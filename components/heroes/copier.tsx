// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { memo, useEffect, useLayoutEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"

// ─── Copier ──────────────────────────────────────────────────────────────────
// A copy button as a desktop photocopier. The visitor puts the slip on the glass
// (drag it, or just click it), the lamp scans it with the lid up, a toner copy
// slides into the tray, and pulling the copy out puts the value on the clipboard.
// Everything is drawn once into canvases (paper, toner, dust) and moved with CSS
// and the Web Animations API, so nothing re-renders while it plays.

const W = 420 // design size; the whole desk scales to the frame
const H = 640
const TS = 3 // texture resolution per CSS px

type Behavior = { sound: boolean; haptics: boolean; keepCopies: boolean; canvasState: "rest" | "tray" }
type Theme = "light" | "dark" | "auto"
type FontValue = { fontFamily?: string; fontWeight?: number | string; fontStyle?: string }

// Fonts already on the device. Nothing is downloaded: pick fonts in the Typography control
// and Framer loads them like any project font.
const MONO_FALLBACK = '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace'
const SANS_FALLBACK = '"Geist", "Inter", ui-sans-serif, system-ui, sans-serif'

const DEFAULTS = {
    content: { label: "Email", value: "justyna@justbuilt.it", mark: "JB·01 COPIER" },
    light: {
        body: "rgb(231, 229, 224)",
        tray: "rgb(231, 229, 224)",
        accent: "rgb(226, 72, 31)",
        paper: "rgb(244, 242, 236)",
        ink: "rgb(35, 35, 39)",
        shadow: "rgb(36, 30, 22)",
        strength: 70,
    },
    dark: {
        body: "rgb(44, 44, 46)",
        tray: "rgb(44, 44, 46)",
        accent: "rgb(226, 72, 31)",
        paper: "rgb(244, 242, 236)",
        ink: "rgb(35, 35, 39)",
        shadow: "rgb(0, 0, 0)",
        strength: 100,
    },
    behavior: { sound: true, haptics: true, keepCopies: true, canvasState: "rest" } as Behavior,
}
type Palette = typeof DEFAULTS.dark
type Content = typeof DEFAULTS.content
type CopierProps = {
    content?: Partial<Content>
    theme?: Theme
    light?: Partial<Palette>
    dark?: Partial<Palette>
    behavior?: Partial<Behavior>
    typography?: { value?: FontValue; label?: FontValue }
    onCopy?: () => void
    style?: CSSProperties
}

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

// ─── Colour helpers ──────────────────────────────────────────────────────────

type RGB = [number, number, number]
function parseColor(input: string, fallback: RGB): RGB {
    if (!input) return fallback
    let s = String(input).trim()
    // Framer tokens arrive as var(--token, rgb(...)): use the fallback inside
    const v = s.match(/^var\([^,]+,\s*(.+)\)$/)
    if (v) s = v[1]
    const m = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/)
    if (m) return [+m[1], +m[2], +m[3]]
    const h = s.match(/^#([0-9a-f]{3,8})$/i)
    if (h) {
        let x = h[1]
        if (x.length < 6) x = x.split("").map((c) => c + c).join("")
        return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16)]
    }
    return fallback
}
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
const css = (c: RGB, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`
const lum = (c: RGB) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255
const WHITE: RGB = [255, 255, 255]
const BLACK: RGB = [0, 0, 0]

// ─── Styles ──────────────────────────────────────────────────────────────────
// Scoped under .cp-desk. No child combinators (they get escaped when server-rendered).

const CSS = `
.cp-desk { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none; }
.cp-desk * { box-sizing: border-box; }
.cp-noise::before { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; background-image: var(--cp-grain); background-size: 128px 128px; mix-blend-mode: soft-light; opacity: var(--cp-grain-o, 0.3); }

.cp-original { all: unset; position: absolute; left: 0; top: 0; width: 250px; height: 92px; z-index: 80; cursor: grab; touch-action: none; -webkit-tap-highlight-color: transparent; }
.cp-original.cp-flying { transform-style: preserve-3d; }
.cp-original .cp-face, .cp-original .cp-back { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.cp-original .cp-back { transform: rotateY(180deg); }
.cp-original canvas { display: block; }
.cp-original .cp-shadow { position: absolute; inset: 0; transform: translateZ(-1px); box-shadow: var(--cp-ps); transition: box-shadow 0.25s; }
.cp-original.cp-lifted { cursor: grabbing; }
.cp-original.cp-lifted .cp-shadow { box-shadow: var(--cp-ps-lift); }
.cp-original:focus-visible { outline: 2px solid var(--cp-a); outline-offset: 6px; }
.cp-original.cp-inside { visibility: hidden; pointer-events: none; }

.cp-machine { position: absolute; left: 0; top: 146px; width: ${W}px; height: 404px; }
.cp-tray { position: absolute; left: 38px; right: 38px; top: 226px; height: 168px; z-index: 0; border-radius: 6px 6px 22px 22px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--cp-t) 72%, black) 0%, color-mix(in srgb, var(--cp-t) 92%, black) 30%, var(--cp-t) 100%);
  box-shadow: inset 0 -4px 0 color-mix(in srgb, var(--cp-t) 90%, black), inset 1px 0 0 rgba(255,255,255,0.05), inset -1px 0 0 rgba(255,255,255,0.05), 0 1px 1px var(--cp-s1), 0 8px 12px -4px var(--cp-s2), 0 34px 44px -22px var(--cp-s3); }
.cp-well { position: absolute; left: 9px; right: 9px; top: 0; bottom: 15px; border-radius: 4px 4px 13px 13px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--cp-t) 80%, black), color-mix(in srgb, var(--cp-t) 96%, black) 45%, var(--cp-t));
  box-shadow: inset 0 2px 6px var(--cp-wi1), inset 0 -1px 1px var(--cp-wi2), inset 2px 0 4px var(--cp-wi2), inset -2px 0 4px var(--cp-wi2); }
.cp-lip { display: none; position: absolute; left: 0; right: 0; bottom: 0; height: 16px; border-radius: 0 0 22px 22px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--cp-t) 100%, white 8%) 0%, var(--cp-t) 30%, color-mix(in srgb, var(--cp-t) 72%, black) 100%); box-shadow: inset 0 1px 0 rgba(255,255,255,0.09); }

.cp-page { position: absolute; left: 70px; top: 236px; width: 280px; height: 108px; z-index: 1; cursor: grab; touch-action: none; }
.cp-page canvas { display: block; }
.cp-page::after { content: ""; position: absolute; inset: 0; z-index: -1; box-shadow: 0 0.5px 0.5px rgba(0,0,0,0.5), 0 2px 3px rgba(0,0,0,0.28), 0 6px 10px -4px rgba(0,0,0,0.3); transition: box-shadow 0.25s; }
.cp-page.cp-held { z-index: 90; cursor: grabbing; }
.cp-page.cp-held::after { box-shadow: var(--cp-ps-lift); }
.cp-page.cp-out { z-index: 50; }
.cp-page.cp-out::after { box-shadow: var(--cp-ps); }
.cp-page:focus-visible { outline: 2px solid var(--cp-a); outline-offset: 4px; }
.cp-overhang { position: absolute; left: 38px; right: 38px; top: 250px; height: 34px; z-index: 2; pointer-events: none;
  background: linear-gradient(180deg, var(--cp-oh1) 0%, var(--cp-oh2) 30%, var(--cp-oh3) 65%, rgba(0,0,0,0) 100%); }
.cp-front { position: absolute; left: 0; right: 0; top: 16px; height: 238px; z-index: 3; border-radius: 30px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--cp-b) 66%, black) 78%, color-mix(in srgb, var(--cp-b) 54%, black) 92%, color-mix(in srgb, var(--cp-b) 44%, black) 100%);
  box-shadow: 0 1px 0.5px var(--cp-s1), 0 3px 4px var(--cp-s1), 0 16px 22px -8px var(--cp-s2), 0 44px 60px -26px var(--cp-s3); }
.cp-slot { position: absolute; left: 66px; right: 66px; bottom: 6px; height: 6px; border-radius: 3px; background: #050506; box-shadow: inset 0 2px 2px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.07), 0 -1px 0 rgba(0,0,0,0.5); }
.cp-top { position: absolute; left: 0; right: 0; top: 0; height: 238px; z-index: 4; border-radius: 30px; perspective: 1150px; perspective-origin: 50% 45%;
  background: radial-gradient(110% 80% at 15% -10%, rgba(255,255,255,0.075), rgba(255,255,255,0) 55%), radial-gradient(80% 60% at 100% 100%, rgba(0,0,0,0.14), rgba(0,0,0,0) 70%),
    linear-gradient(180deg, color-mix(in srgb, var(--cp-b) 100%, white 3%) 0%, var(--cp-b) 55%, color-mix(in srgb, var(--cp-b) 88%, black) 100%);
  box-shadow: inset 0 1.5px 0 rgba(255,255,255,0.11), inset 0 -1.5px 0 rgba(255,255,255,0.05), inset 1px 0 0 rgba(255,255,255,0.03), inset -1px 0 0 rgba(255,255,255,0.03); }

.cp-recess { position: absolute; left: 18px; right: 18px; top: 22px; height: 146px; border-radius: 15px; overflow: hidden; background: #121213;
  box-shadow: inset 0 3px 4px rgba(0,0,0,0.75), inset 0 -1px 0 rgba(255,255,255,0.06), 0 1px 0 rgba(255,255,255,0.07), 0 -1px 0 rgba(0,0,0,0.35); }
.cp-glass { position: absolute; inset: 5px; border-radius: 10px; overflow: hidden; background: radial-gradient(130% 120% at 40% 0%, #12171a 0%, #0a0c0d 55%, #060707 100%); box-shadow: inset 0 0 0 0.5px rgba(255,255,255,0.05); }
.cp-scale { position: absolute; left: 0; top: 0; z-index: 2; pointer-events: none; }
.cp-carriage { position: absolute; top: -10px; bottom: -10px; left: 0; width: 40px; z-index: 1; will-change: transform;
  background: linear-gradient(90deg, rgba(20,22,23,0) 0%, rgba(26,29,31,0.95) 25%, #24282a 50%, rgba(26,29,31,0.95) 75%, rgba(20,22,23,0) 100%); }
.cp-lamp { position: absolute; top: 0; bottom: 0; left: 18px; width: 4px; border-radius: 2px; background: linear-gradient(90deg, #2a2d2f, #3b3f41, #2a2d2f); transition: background 0.1s, box-shadow 0.18s; }
.cp-scanning .cp-lamp { background: color-mix(in srgb, var(--cp-a) 10%, white);
  box-shadow: 0 0 2px 1px color-mix(in srgb, var(--cp-a) 30%, white), 0 0 9px 3px color-mix(in srgb, var(--cp-a) 65%, transparent), 0 0 32px 12px color-mix(in srgb, var(--cp-a) 28%, transparent), 0 0 90px 40px color-mix(in srgb, var(--cp-a) 12%, transparent); }
.cp-slip { position: absolute; left: 12px; top: 13px; z-index: 2; width: 250px; height: 92px; pointer-events: none; visibility: hidden; }
.cp-slip canvas, .cp-lit-slip { display: block; }
.cp-loaded .cp-slip { visibility: visible; }
.cp-dust { position: absolute; left: 0; top: 0; z-index: 3; pointer-events: none; }
.cp-beam { position: absolute; top: 0; bottom: 0; left: 0; width: 170px; z-index: 4; overflow: hidden; pointer-events: none; opacity: 0; will-change: transform;
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 38%, #000 62%, transparent 100%); mask-image: linear-gradient(90deg, transparent 0%, #000 38%, #000 62%, transparent 100%); transition: opacity 0.16s; }
.cp-scanning .cp-beam { opacity: 1; }
.cp-beam-in { position: absolute; top: 0; left: 0; width: 384px; height: 146px; will-change: transform; }
.cp-lit-slip { position: absolute; left: 17px; top: 18px; visibility: hidden; }
.cp-loaded .cp-lit-slip { visibility: visible; }
.cp-lit-dust { position: absolute; left: 5px; top: 5px; mix-blend-mode: screen; }
.cp-lit-wall { position: absolute; inset: 0; border-radius: 15px; mix-blend-mode: screen; box-shadow: inset 0 0 0 5px color-mix(in srgb, var(--cp-a) 12%, transparent), inset 0 0 14px 4px color-mix(in srgb, var(--cp-a) 12%, transparent); }
.cp-reflect { position: absolute; inset: 5px; z-index: 5; border-radius: 10px; pointer-events: none;
  background: linear-gradient(104deg, rgba(255,255,255,0) 52%, rgba(255,255,255,0.055) 60%, rgba(255,255,255,0.02) 70%, rgba(255,255,255,0) 71%),
    linear-gradient(104deg, rgba(255,255,255,0) 73.5%, rgba(255,255,255,0.03) 74.5%, rgba(255,255,255,0) 77%),
    radial-gradient(60% 50% at 85% 10%, rgba(255,255,255,0.035), rgba(255,255,255,0) 70%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), inset 1px 0 0 rgba(255,255,255,0.025); }

.cp-lid { position: absolute; left: 11px; right: 11px; top: 13px; height: 162px; z-index: 6; transform-origin: 50% 0; transform-style: preserve-3d; transition: transform 0.62s cubic-bezier(.3,.75,.25,1); }
.cp-open .cp-lid { transform: rotateX(104deg); }
.cp-lid-face { position: absolute; inset: 0; border-radius: 19px; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.cp-lid-top { transition: filter 0.62s;
  background: radial-gradient(110% 90% at 12% -10%, rgba(255,255,255,0.085), rgba(255,255,255,0) 55%), linear-gradient(180deg, color-mix(in srgb, var(--cp-b) 100%, white 5%) 0%, var(--cp-b) 60%, color-mix(in srgb, var(--cp-b) 92%, black) 100%);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--cp-b) 25%, black), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.2), 0 1.5px 0 0.5px rgba(255,255,255,0.03); }
.cp-open .cp-lid-top { filter: brightness(0.6); }
.cp-grip { position: absolute; left: 50%; bottom: -1px; width: 64px; height: 6px; margin-left: -32px; border-radius: 6px 6px 0 0; background: color-mix(in srgb, var(--cp-b) 40%, black); box-shadow: inset 0 1.5px 2px rgba(0,0,0,0.75), 0 -1px 0 rgba(255,255,255,0.05); }
.cp-mark { position: absolute; left: 22px; bottom: 14px; font: 500 7.5px/1 var(--cp-vf); letter-spacing: 0.16em; color: var(--cp-eng); text-shadow: var(--cp-engs); white-space: pre; }
.cp-lid-under { transform: rotateX(180deg); background: color-mix(in srgb, var(--cp-b) 92%, black); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04); }
.cp-lid-under::after { content: ""; position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(0deg, rgba(0,0,0,0.25), rgba(0,0,0,0) 60%); }
.cp-pad { position: absolute; inset: 7px; border-radius: 13px; background-color: #dedcd6; background-image: var(--cp-foam); background-size: 120px 120px; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.12), inset 0 2px 6px rgba(0,0,0,0.12); }
.cp-hinge { position: absolute; top: 8px; width: 44px; height: 6px; z-index: 7; border-radius: 3px; background: linear-gradient(180deg, color-mix(in srgb, var(--cp-b) 45%, black), color-mix(in srgb, var(--cp-b) 30%, black)); box-shadow: inset 0 1px 1.5px rgba(0,0,0,0.85), 0 1px 0 rgba(255,255,255,0.06); }
.cp-leak { position: absolute; left: 0; width: 70px; height: 3px; z-index: 7; border-radius: 2px; opacity: 0; pointer-events: none; will-change: transform; transition: opacity 0.15s;
  background: radial-gradient(50% 50% at 50% 50%, color-mix(in srgb, var(--cp-a) 55%, white), color-mix(in srgb, var(--cp-a) 0%, transparent) 100%); filter: blur(0.6px); }
.cp-scanning.cp-shut .cp-leak { opacity: 1; }

.cp-panel { position: absolute; left: 24px; right: 26px; top: 184px; height: 44px; display: flex; align-items: center; gap: 12px; }
.cp-lcd { position: relative; width: 168px; height: 38px; border-radius: 9px; background: #0c0c0d; box-shadow: inset 0 1px 1.5px rgba(0,0,0,0.95), 0 1px 0 rgba(255,255,255,0.07), 0 -0.5px 0 rgba(0,0,0,0.4); }
.cp-lcd-face { position: absolute; inset: 3px; border-radius: 6px; overflow: hidden; background: radial-gradient(120% 140% at 50% 120%, color-mix(in srgb, var(--cp-a) 9%, #070606) 0%, #0b0807 60%, #070606 100%); box-shadow: inset 0 1px 2px rgba(0,0,0,0.9), inset 0 0 0 0.5px rgba(255,255,255,0.04); }
.cp-matrix { position: absolute; left: 3px; top: 3px; }
.cp-glare { position: absolute; inset: 3px; border-radius: 6px; pointer-events: none; background: linear-gradient(172deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.02) 46%, rgba(255,255,255,0) 47%); }
.cp-spacer { flex: 1; }
.cp-micro { font: 500 7.5px/1 var(--cp-vf); letter-spacing: 0.18em; color: var(--cp-eng); text-shadow: var(--cp-engs); margin-right: 2px; }
.cp-well-key { position: relative; width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; background: #0f0f10; box-shadow: inset 0 2px 3px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.07); }
.cp-ring { position: absolute; inset: 1.5px; border-radius: 50%; pointer-events: none; transition: box-shadow 0.4s; box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--cp-a) 18%, transparent); }
.cp-ready .cp-ring { box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--cp-a) 75%, transparent), 0 0 10px color-mix(in srgb, var(--cp-a) 18%, transparent), inset 0 0 6px color-mix(in srgb, var(--cp-a) 25%, transparent); }
.cp-scanning .cp-ring { animation: cp-breathe 0.9s ease-in-out infinite; }
.cp-flash .cp-ring { box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--cp-a) 80%, white), 0 0 14px color-mix(in srgb, var(--cp-a) 40%, transparent), inset 0 0 8px color-mix(in srgb, var(--cp-a) 45%, transparent); }
@keyframes cp-breathe { 50% { box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--cp-a) 90%, transparent), 0 0 12px color-mix(in srgb, var(--cp-a) 30%, transparent), inset 0 0 7px color-mix(in srgb, var(--cp-a) 35%, transparent); } }
.cp-start { all: unset; position: relative; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; -webkit-tap-highlight-color: transparent;
  background: radial-gradient(60% 45% at 40% 18%, rgba(255,235,225,0.42), rgba(255,235,225,0) 70%), radial-gradient(120% 120% at 50% 85%, rgba(0,0,0,0.22), rgba(0,0,0,0) 55%),
    radial-gradient(100% 100% at 50% 40%, color-mix(in srgb, var(--cp-a) 75%, white) 0%, var(--cp-a) 55%, color-mix(in srgb, var(--cp-a) 70%, black) 100%);
  box-shadow: inset 0 1px 0.5px rgba(255,240,232,0.45), inset 0 -2.5px 4px rgba(60,15,4,0.35), 0 2px 1px rgba(0,0,0,0.55), 0 4px 7px rgba(0,0,0,0.35); transition: transform 0.07s, box-shadow 0.07s; }
.cp-start::after { content: ""; position: absolute; left: 50%; top: 50%; width: 8px; height: 8px; border-radius: 1.5px; transform: translate(-50%, -50%) rotate(45deg);
  box-shadow: inset 0 0 0 1.3px color-mix(in srgb, var(--cp-a) 40%, black), 0 0.8px 0 rgba(255,225,210,0.35); }
.cp-start.cp-down, .cp-start:active { transform: translateY(1.5px) scale(0.985); box-shadow: inset 0 1px 0.5px rgba(255,240,232,0.22), inset 0 -2px 3px rgba(0,0,0,0.25), 0 0.5px 0.5px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.3); }
.cp-start:focus-visible { outline: 2px solid var(--cp-a); outline-offset: 7px; }
.cp-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
`

// The machine's static structure. Rendered once per build (keyed), then driven by mount().
const Machine = memo(function Machine() {
    return (
        <>
            <div className="cp-machine cp-ready cp-shut">
                <div className="cp-tray">
                    <div className="cp-well" />
                    <div className="cp-lip" />
                </div>
                <div className="cp-overhang" />
                <div className="cp-front">
                    <div className="cp-slot" />
                </div>
                <div className="cp-top cp-noise">
                    <div className="cp-recess" aria-hidden="true">
                        <div className="cp-glass">
                            <canvas className="cp-scale" />
                            <div className="cp-carriage">
                                <div className="cp-lamp" />
                            </div>
                            <div className="cp-slip" />
                            <canvas className="cp-dust" />
                        </div>
                        <div className="cp-beam">
                            <div className="cp-beam-in">
                                <div className="cp-lit-wall" />
                                <canvas className="cp-lit-slip" />
                                <canvas className="cp-lit-dust" />
                            </div>
                        </div>
                        <div className="cp-reflect" />
                    </div>
                    <div className="cp-leak" style={{ top: 174 }} />
                    <div className="cp-leak" style={{ top: 12 }} />
                    <div className="cp-lid" aria-hidden="true">
                        <div className="cp-lid-face cp-lid-top cp-noise">
                            <span className="cp-mark" />
                            <span className="cp-grip" />
                        </div>
                        <div className="cp-lid-face cp-lid-under">
                            <div className="cp-pad" />
                        </div>
                    </div>
                    <span className="cp-hinge" style={{ left: 84 }} />
                    <span className="cp-hinge" style={{ right: 84 }} />
                    <div className="cp-panel">
                        <div className="cp-lcd" aria-hidden="true">
                            <div className="cp-lcd-face" />
                            <canvas className="cp-matrix" />
                            <div className="cp-glare" />
                        </div>
                        <span className="cp-spacer" />
                        <span className="cp-micro" aria-hidden="true">
                            START
                        </span>
                        <div className="cp-well-key">
                            <span className="cp-ring" aria-hidden="true" />
                            <button className="cp-start cp-noise" aria-label="Start copying" />
                        </div>
                    </div>
                </div>
            </div>
            <button className="cp-original">
                <span className="cp-shadow" />
                <span className="cp-face" />
                <span className="cp-back" />
            </button>
            <p className="cp-sr" aria-live="polite" />
        </>
    )
})

// ─── Random + noise ──────────────────────────────────────────────────────────

function rng(seed: number) {
    return () => {
        seed |= 0
        seed = (seed + 0x6d2b79f5) | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}
function cv(w: number, h: number) {
    const c = document.createElement("canvas")
    c.width = Math.ceil(w)
    c.height = Math.ceil(h)
    return c
}
function sized(c: HTMLCanvasElement, w: number, h: number) {
    c.style.width = w + "px"
    c.style.height = h + "px"
    return c
}
function into(el: HTMLCanvasElement, src: HTMLCanvasElement, w: number, h: number) {
    el.width = src.width
    el.height = src.height
    sized(el, w, h)
    el.getContext("2d")!.drawImage(src, 0, 0)
}
// Rotated sheets: keep the paper edge inside the bitmap so it is smoothed, not stair-stepped
function bleed(c: HTMLCanvasElement, w: number, h: number, px = 2) {
    const o = cv(c.width + px * 2 * TS, c.height + px * 2 * TS)
    o.getContext("2d")!.drawImage(c, px * TS, px * TS)
    o.style.cssText = `position:absolute;left:${-px}px;top:${-px}px;width:${w + px * 2}px;height:${h + px * 2}px;max-width:none`
    return o
}
function valueNoise(w: number, h: number, cell: number, R: () => number) {
    const gw = Math.ceil(w / cell) + 2, gh = Math.ceil(h / cell) + 2
    const g = new Float32Array(gw * gh).map(() => R())
    const out = new Float32Array(w * h)
    for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
            const fx = x / cell, fy = y / cell, ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy
            const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty)
            const a = g[iy * gw + ix], b = g[iy * gw + ix + 1], c = g[(iy + 1) * gw + ix], d = g[(iy + 1) * gw + ix + 1]
            out[y * w + x] = a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
        }
    return out
}
// Paper fibre clouds: faint in reflected light, strong when the lamp shines through
function formation(w: number, h: number, seed: number) {
    const R = rng(seed), Wd = w * TS, Hd = h * TS
    const a = valueNoise(Wd, Hd, 26 * TS, R), b = valueNoise(Wd, Hd, 8 * TS, R), c = valueNoise(Wd, Hd, 2.5 * TS, R)
    const f = new Float32Array(Wd * Hd)
    for (let i = 0; i < f.length; i++) f[i] = a[i] * 0.45 + b[i] * 0.35 + c[i] * 0.2
    return f
}
// Surface tooth: a fine height field lit from the top left, sized so it survives at screen resolution.
// Every sheet of the same size shares it, so it's computed once.
const toothCache = new Map<string, Float32Array>()
function toothShade(Wd: number, Hd: number) {
    const key = Wd + "x" + Hd
    const hit = toothCache.get(key)
    if (hit) return hit
    const R = rng(991), a = valueNoise(Wd, Hd, 1.3 * TS, R), b = valueNoise(Wd, Hd, 4.5 * TS, R)
    const hgt = new Float32Array(Wd * Hd), out = new Float32Array(Wd * Hd)
    for (let i = 0; i < hgt.length; i++) hgt[i] = a[i] * 0.62 + b[i] * 0.38
    for (let y = 0, p = 0; y < Hd; y++)
        for (let x = 0; x < Wd; x++, p++) {
            const dx = hgt[p + (x < Wd - 1 ? 1 : 0)] - hgt[p - (x > 0 ? 1 : 0)]
            const dy = hgt[p + (y < Hd - 1 ? Wd : 0)] - hgt[p - (y > 0 ? Wd : 0)]
            out[p] = -(dx * 0.6 + dy * 0.8) * 70
        }
    toothCache.set(key, out)
    return out
}
function paperCanvas(w: number, h: number, rgb: RGB, form: Float32Array, amt: number, seed: number, fibre = true, relief = 1) {
    const R = rng(seed), Wd = w * TS, Hd = h * TS, c = cv(Wd, Hd), g = c.getContext("2d")!, id = g.createImageData(Wd, Hd), d = id.data
    const shade = toothShade(Wd, Hd)
    for (let y = 0, i = 0, p = 0; y < Hd; y++)
        for (let x = 0; x < Wd; x++, p++, i += 4) {
            const n = (form[p] - 0.5) * amt + shade[p] * relief + (R() - 0.5) * 6
            d[i] = rgb[0] + n
            d[i + 1] = rgb[1] + n
            d[i + 2] = rgb[2] + n * 0.95
            d[i + 3] = 255
        }
    g.putImageData(id, 0, 0)
    if (fibre) {
        g.lineCap = "round"
        for (let i = 0; i < (w * h) / 60; i++) {
            const x = R() * Wd, y = R() * Hd, len = (1.5 + R() * 5) * TS, an = R() * 6.28, bend = (R() - 0.5) * len * 0.6
            const ex = x + Math.cos(an) * len, ey = y + Math.sin(an) * len
            g.strokeStyle = R() < 0.6 ? `rgba(90,82,66,${0.025 + R() * 0.045})` : `rgba(255,255,252,${0.1 + R() * 0.14})`
            g.lineWidth = (0.2 + R() * 0.35) * TS
            g.beginPath()
            g.moveTo(x, y)
            g.quadraticCurveTo((x + ex) / 2 - Math.sin(an) * bend, (y + ey) / 2 + Math.cos(an) * bend, ex, ey)
            g.stroke()
        }
    }
    return c
}
function noiseURL(size: number, amp: number, seed: number) {
    const R = rng(seed), c = cv(size, size), g = c.getContext("2d")!, id = g.createImageData(size, size)
    for (let i = 0; i < id.data.length; i += 4) {
        const v = 128 + (R() - 0.5) * amp
        id.data[i] = id.data[i + 1] = id.data[i + 2] = v
        id.data[i + 3] = 255
    }
    g.putImageData(id, 0, 0)
    return c.toDataURL()
}
// The white pad under the lid: open-cell foam, a little grey from use
function foamURL() {
    const R = rng(8), s = 240, c = cv(s, s), g = c.getContext("2d")!
    g.fillStyle = "#dedcd6"
    g.fillRect(0, 0, s, s)
    for (let i = 0; i < 2600; i++) {
        g.fillStyle = R() < 0.5 ? `rgba(0,0,0,${0.03 + R() * 0.05})` : `rgba(255,255,255,${0.15 + R() * 0.2})`
        g.beginPath()
        g.arc(R() * s, R() * s, 0.4 + R() * 1.4, 0, 7)
        g.fill()
    }
    return c.toDataURL()
}

// ─── Dot matrix font (5×7) ───────────────────────────────────────────────────

const FONT: Record<string, string> = {
    A: "01110 10001 10001 11111 10001 10001 10001", B: "11110 10001 10001 11110 10001 10001 11110", C: "01110 10001 10000 10000 10000 10001 01110",
    D: "11110 10001 10001 10001 10001 10001 11110", E: "11111 10000 10000 11110 10000 10000 11111", F: "11111 10000 10000 11110 10000 10000 10000",
    G: "01110 10001 10000 10111 10001 10001 01111", H: "10001 10001 10001 11111 10001 10001 10001", I: "01110 00100 00100 00100 00100 00100 01110",
    K: "10001 10010 10100 11000 10100 10010 10001", L: "10000 10000 10000 10000 10000 10000 11111", M: "10001 11011 10101 10101 10001 10001 10001",
    N: "10001 10001 11001 10101 10011 10001 10001", O: "01110 10001 10001 10001 10001 10001 01110", P: "11110 10001 10001 11110 10000 10000 10000",
    R: "11110 10001 10001 11110 10100 10010 10001", S: "01111 10000 10000 01110 00001 00001 11110", T: "11111 00100 00100 00100 00100 00100 00100",
    U: "10001 10001 10001 10001 10001 10001 01110", W: "10001 10001 10001 10101 10101 10101 01010", Y: "10001 10001 01010 00100 00100 00100 00100",
    "✓": "00000 00001 00001 00010 10100 01000 00000", " ": "00000 00000 00000 00000 00000 00000 00000",
}
const MX = { cols: 63, rows: 7, pitch: 2.5, w: 162, h: 32 }
function matrixColumns(text: string) {
    const cols: boolean[][] = []
    for (const ch of text) {
        const g = (FONT[ch] || FONT[" "]).split(" ")
        for (let x = 0; x < 5; x++) cols.push(g.map((r) => r[x] === "1"))
        cols.push(Array(7).fill(false))
    }
    return cols
}

// ─── Sheets ──────────────────────────────────────────────────────────────────

const SW = 250, SH = 92, PW = 280, PH = 108, OX = 15, OY = 8, GW = 374, GH = 136

function tracked(g: CanvasRenderingContext2D, text: string, x: number, y: number, track: number) {
    let cx = x
    for (const ch of text) {
        g.fillText(ch, cx, y)
        cx += g.measureText(ch).width + track
    }
}

// ─── Mount: builds the textures and wires the whole machine ─────────────────

type FontSpec = { family: string; weight: number | string; style: string }
const fontSpec = (f: FontValue | undefined, family: string, weight: number): FontSpec => ({
    family: f?.fontFamily ? String(f.fontFamily) : family,
    weight: f?.fontWeight || weight,
    style: f?.fontStyle || "normal",
})

type Opts = {
    label: string
    value: string
    mark: string
    accent: RGB
    paper: RGB
    ink: RGB
    live: boolean
    canvasState: string
    keepCopies: boolean
    reduced: () => boolean
    sound: () => boolean
    haptics: () => boolean
    onCopy: () => void
    valueFont: FontSpec
    labelFont: FontSpec
}

function mount(desk: HTMLElement, o: Opts) {
    const q = (s: string) => desk.querySelector(s) as HTMLElement
    const machine = q(".cp-machine"), carriage = q(".cp-carriage"), beam = q(".cp-beam"), beamIn = q(".cp-beam-in"), orig = q(".cp-original") as HTMLButtonElement
    const startBtn = q(".cp-start"), live = q(".cp-sr"), matrix = q(".cp-matrix") as HTMLCanvasElement
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const later = (f: () => void, ms: number) => {
        const t = setTimeout(() => {
            timers.delete(t)
            f()
        }, ms)
        timers.add(t)
        return t
    }
    const cleanups: (() => void)[] = []
    const on = <E extends Event>(el: EventTarget, ev: string, fn: (e: E) => void) => {
        const h = fn as EventListener
        el.addEventListener(ev, h)
        cleanups.push(() => el.removeEventListener(ev, h))
    }
    const reduce = o.reduced
    const MY = 146
    const REST = { x: 85, y: 22, r: -1.6 }
    const GLASS_SPOT = { x: 35, y: MY + 40 }
    const VF = (size: number) => `${o.valueFont.style} ${o.valueFont.weight} ${size}px ${o.valueFont.family}`
    // the typed value sets its own size so the whole address fits the slip, in any font
    // and below 12px it condenses instead of shrinking further, so long values stay readable
    const W100 = (() => {
        const g = cv(1, 1).getContext("2d")!
        g.font = VF(100)
        return g.measureText(o.value || " ").width || 1
    })()
    const FS = Math.max(12, Math.min(19, ((SW - 40) * 100) / W100))
    const HS = Math.min(1, (SW - 40) / ((W100 * FS) / 100))
    const accentHi = mix(o.accent, WHITE, 0.3)
    const litPaper = mix(o.accent, WHITE, 0.86)
    const litDust = mix(o.accent, WHITE, 0.62)
    const labelInk = mix(o.ink, o.paper, 0.55)

    // ── printing on the original, in its own coordinates
    function slipText(g: CanvasRenderingContext2D, s: { label: string; ink: string; alpha: number; spread?: boolean }) {
        const R = rng(11)
        g.save()
        g.textBaseline = "alphabetic"
        g.globalAlpha = s.alpha
        g.fillStyle = s.label
        g.font = `${o.labelFont.style} ${o.labelFont.weight} 9.4px ${o.labelFont.family}`
        tracked(g, o.label.toUpperCase(), 18, 27, 1.3)
        g.font = VF(FS)
        const chars = [...o.value]
        const xs = chars.map((_, i) => g.measureText(chars.slice(0, i).join("")).width)
        g.translate(18, 0)
        g.scale(HS, 1)
        ;[...o.value].forEach((ch, i) => {
            const dx = (R() - 0.5) * 0.35, dy = (R() - 0.5) * 0.4, p = 0.86 + R() * 0.14
            g.globalAlpha = s.alpha * p
            g.fillStyle = s.ink
            g.fillText(ch, xs[i] + dx, 62 + dy)
            if (s.spread) {
                g.globalAlpha = s.alpha * 0.35
                g.fillText(ch, xs[i] + dx + 0.35, 62 + dy + 0.2)
            }
        })
        g.restore()
    }
    function mirroredText(blur: number, alpha: number) {
        const c = cv(SW * TS, SH * TS), g = c.getContext("2d")!
        g.filter = blur ? `blur(${blur * TS}px)` : "none"
        g.setTransform(-TS, 0, 0, TS, SW * TS, 0)
        slipText(g, { label: "#000", ink: "#000", alpha })
        return c
    }
    function edges(g: CanvasRenderingContext2D) {
        const e = (x0: number, y0: number, x1: number, y1: number, k: number) => {
            const gg = g.createLinearGradient(x0, y0, x1, y1)
            gg.addColorStop(0, `rgba(30,30,30,${k})`)
            gg.addColorStop(1, "rgba(30,30,30,0)")
            g.fillStyle = gg
            g.fillRect(0, 0, SW, SH)
        }
        e(SW, 0, SW - 7, 0, 0.12)
        e(0, SH, 0, SH - 6, 0.14)
        e(0, 0, 5, 0, 0.06)
    }
    function makeFront(form: Float32Array) {
        const c = paperCanvas(SW, SH, o.paper, form, 14, 4, true, 0.6), g = c.getContext("2d")!
        const t = cv(c.width, c.height), tg = t.getContext("2d")!
        tg.scale(TS, TS)
        slipText(tg, { label: css(labelInk), ink: css(o.ink), alpha: 1 })
        const m = cv(c.width, c.height), mg = m.getContext("2d")!, id = mg.createImageData(m.width, m.height), R = rng(9)
        for (let i = 0; i < id.data.length; i += 4) id.data[i + 3] = (0.8 + R() * 0.2) * 255
        mg.putImageData(id, 0, 0)
        tg.setTransform(1, 0, 0, 1, 0, 0)
        tg.globalCompositeOperation = "destination-in"
        tg.drawImage(m, 0, 0)
        g.drawImage(t, 0, 0)
        g.scale(TS, TS)
        const lg = g.createLinearGradient(0, 0, SW, SH)
        lg.addColorStop(0, "rgba(255,255,255,0.08)")
        lg.addColorStop(1, "rgba(0,0,0,0.05)")
        g.fillStyle = lg
        g.fillRect(0, 0, SW, SH)
        return c
    }
    function makeBack(form: Float32Array) {
        const c = paperCanvas(SW, SH, mix(o.paper, BLACK, 0.075), form, 14, 5, true, 0.6), g = c.getContext("2d")!
        g.drawImage(mirroredText(0.6, 0.035), 0, 0)
        g.scale(TS, TS)
        const lg = g.createLinearGradient(0, 0, SW, SH)
        lg.addColorStop(0, "rgba(255,255,255,0.10)")
        lg.addColorStop(0.5, "rgba(255,255,255,0)")
        lg.addColorStop(1, "rgba(0,0,0,0.10)")
        g.fillStyle = lg
        g.fillRect(0, 0, SW, SH)
        edges(g)
        return c
    }
    function makeLit(form: Float32Array) {
        const c = paperCanvas(SW, SH, litPaper, form, 46, 6, false, 0.3), g = c.getContext("2d")!
        g.globalCompositeOperation = "multiply"
        g.drawImage(mirroredText(0.55, 0.62), 0, 0)
        g.globalCompositeOperation = "source-over"
        g.globalAlpha = 0.5
        g.drawImage(mirroredText(0, 0.25), 0, 0)
        return c
    }
    // copier paper and the open-glass toner field are built once, ahead of the first copy
    let baseSheet: HTMLCanvasElement | null = null, toner: HTMLCanvasElement | null = null
    function copyBase() {
        if (!baseSheet) baseSheet = paperCanvas(PW, PH, mix(o.paper, [242, 242, 238], 0.6), formation(PW, PH, 301), 10, 401, false, 0.7)
        return baseSheet
    }
    function tonerField() {
        if (toner) return toner
        const R = rng(555), Wd = PW * TS, Hd = PH * TS
        const f = cv(Wd, Hd), fg = f.getContext("2d")!, fid = fg.createImageData(Wd, Hd), d = fid.data
        const mott = valueNoise(Wd, Hd, 9 * TS, R), band = R() * 6.28
        for (let y = 0; y < Hd; y++) {
            const row = 0.8 + 0.05 * Math.sin(y / TS / 6 + band)
            for (let x = 0; x < Wd; x++) {
                if (x >= OX * TS && x < (OX + SW) * TS && y >= OY * TS && y < (OY + SH) * TS) continue
                const i = (y * Wd + x) * 4, a = row + (mott[y * Wd + x] - 0.5) * 0.18 + (R() - 0.5) * 0.3
                d[i] = 22
                d[i + 1] = 22
                d[i + 2] = 24
                d[i + 3] = Math.max(0, Math.min(1, a)) * 255
            }
        }
        fg.putImageData(fid, 0, 0)
        return (toner = f)
    }
    function makeCopy(n: number, lidOpen: boolean) {
        const R = rng(1000 + n * 17), Wd = PW * TS, Hd = PH * TS
        const c = cv(Wd, Hd), g = c.getContext("2d")!
        g.drawImage(copyBase(), 0, 0)
        if (lidOpen) {
            // lid open: the empty glass prints as a toner field, flipped per copy so no two match
            g.save()
            g.translate(n % 2 ? Wd : 0, n % 3 === 0 ? Hd : 0)
            g.scale(n % 2 ? -1 : 1, n % 3 === 0 ? -1 : 1)
            g.drawImage(tonerField(), 0, 0)
            g.restore()
        }
        g.save()
        g.scale(TS, TS)
        // the copier picks up the edge of the original
        g.strokeStyle = lidOpen ? "rgba(35,35,37,0.4)" : "rgba(60,60,62,0.22)"
        g.lineWidth = lidOpen ? 0.7 : 0.5
        g.strokeRect(OX + 0.35, OY + 0.35, SW - 0.7, SH - 0.7)
        if (!lidOpen) {
            g.fillStyle = "rgba(60,60,62,0.10)"
            g.fillRect(OX + SW - 1, OY + 2, 1.4, SH)
            g.fillRect(OX + 2, OY + SH - 0.6, SW, 1.2)
        }
        const sh = g.createLinearGradient(OX, OY, OX + SW, OY)
        sh.addColorStop(0, "rgba(0,0,0,0.06)")
        sh.addColorStop(0.25, "rgba(0,0,0,0)")
        sh.addColorStop(1, "rgba(0,0,0,0.04)")
        g.fillStyle = sh
        g.fillRect(OX, OY, SW, SH)
        g.restore()
        // the type, in toner, a hair off square
        const t = cv(SW * TS, SH * TS), tg = t.getContext("2d")!
        tg.scale(TS, TS)
        slipText(tg, { label: "#1d1d1f", ink: "#121214", alpha: 1, spread: true })
        const m = cv(t.width, t.height), mg = m.getContext("2d")!, mid = mg.createImageData(m.width, m.height)
        for (let i = 0; i < mid.data.length; i += 4) mid.data[i + 3] = (R() < 0.05 ? 0.5 : 0.88 + R() * 0.12) * 255
        mg.putImageData(mid, 0, 0)
        tg.setTransform(1, 0, 0, 1, 0, 0)
        tg.globalCompositeOperation = "destination-in"
        tg.drawImage(m, 0, 0)
        g.save()
        g.translate(OX * TS, OY * TS)
        g.rotate((R() - 0.5) * 0.004)
        g.drawImage(t, 0, 0)
        g.restore()
        g.save()
        g.scale(TS, TS)
        for (let i = 0; i < (lidOpen ? 46 : 26); i++) {
            const near = R() < 0.6, x = near ? OX + 16 + R() * 215 : R() * PW, y = near ? OY + 44 + R() * 26 : R() * PH
            g.fillStyle = `rgba(18,18,20,${0.2 + R() * 0.5})`
            g.beginPath()
            g.arc(x, y, 0.2 + R() * (near ? 0.3 : 0.5), 0, 7)
            g.fill()
        }
        if (R() < 0.6) {
            const x = OX + 20 + R() * (SW - 40)
            g.fillStyle = `rgba(30,30,32,${0.06 + R() * 0.07})`
            g.fillRect(x, 0, 0.6, PH)
        }
        // a warm sheet straight off the fuser isn't flat
        const wv = g.createLinearGradient(0, 0, PW, 0), ph = R()
        for (let k = 0; k <= 6; k++) wv.addColorStop(k / 6, `rgba(${k % 2 ? "255,255,255" : "0,0,0"},${0.025 + 0.02 * Math.sin(k + ph * 6)})`)
        g.fillStyle = wv
        g.fillRect(0, 0, PW, PH)
        g.restore()
        return c
    }
    function makeDust(lit: boolean) {
        const R = rng(77), c = cv(GW * TS, GH * TS), g = c.getContext("2d")!
        g.scale(TS, TS)
        for (let i = 0; i < 70; i++) {
            const x = R() * GW, y = R() * GH, r = 0.25 + R() * R() * 0.9
            g.fillStyle = lit ? css(litDust, 0.35 + R() * 0.6) : `rgba(255,255,255,${0.04 + R() * 0.07})`
            g.beginPath()
            g.arc(x, y, r, 0, 7)
            g.fill()
        }
        for (let i = 0; i < 5; i++) {
            const x = R() * GW, y = R() * GH, a = R() * 6.28, l = 3 + R() * 7
            g.strokeStyle = lit ? css(litDust, 0.45) : "rgba(255,255,255,0.05)"
            g.lineWidth = 0.35
            g.beginPath()
            g.moveTo(x, y)
            g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 1.5, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l)
            g.stroke()
        }
        // a thumbprint where someone pressed a sheet flat
        g.save()
        g.translate(300, 96)
        g.rotate(-0.5)
        g.lineWidth = 0.5
        for (let k = 0; k < 11; k++) {
            g.strokeStyle = lit ? css(litDust, 0.16 - k * 0.01) : `rgba(255,255,255,${0.028 - k * 0.002})`
            g.beginPath()
            g.ellipse(0, 0, 2 + k * 1.2, 3 + k * 1.55, 0, 0.2, Math.PI * 1.85)
            g.stroke()
        }
        g.restore()
        return c
    }
    function drawScale() {
        // printed rulers along the top and left edge of the glass
        const s = q(".cp-scale") as HTMLCanvasElement
        s.width = GW * TS
        s.height = GH * TS
        sized(s, GW, GH)
        const g = s.getContext("2d")!
        g.scale(TS, TS)
        const tick = css(accentHi, 0.3), major = css(accentHi, 0.42)
        for (let x = 6, i = 1; x < GW - 4; x += 6, i++) {
            g.fillStyle = i % 5 === 0 ? major : tick
            g.fillRect(x, 0, 0.55, i % 5 === 0 ? 5 : 2.5)
        }
        for (let y = 6, i = 1; y < GH - 4; y += 6, i++) {
            g.fillStyle = i % 5 === 0 ? major : tick
            g.fillRect(0, y, i % 5 === 0 ? 5 : 2.5, 0.55)
        }
        g.font = '600 5px "Geist", "Inter", sans-serif'
        g.fillStyle = css(accentHi, 0.38)
        g.fillText("A6", 258, 10)
        g.fillText("A5", 330, 10)
        g.save()
        g.translate(10, 112)
        g.rotate(-Math.PI / 2)
        g.fillText("A6", 0, 0)
        g.restore()
    }

    // ── dot matrix display
    matrix.width = MX.w * TS
    matrix.height = MX.h * TS
    sized(matrix, MX.w, MX.h)
    type Msg = { cols: boolean[][]; scroll: boolean; t0: number; blink: boolean }
    let msg: Msg = { cols: [], scroll: false, t0: 0, blink: false }, mxRaf = 0, onScreen = true
    function show(text: string, opt: { blink?: boolean } = {}) {
        const cols = matrixColumns(text)
        msg = { cols, scroll: cols.length > MX.cols, t0: performance.now(), blink: !!opt.blink && !reduce() }
        if (!mxRaf) mxRaf = requestAnimationFrame(drawMatrix)
    }
    function drawMatrix(now: number) {
        const g = matrix.getContext("2d")!
        g.setTransform(TS, 0, 0, TS, 0, 0)
        g.clearRect(0, 0, MX.w, MX.h)
        const oy = (MX.h - MX.rows * MX.pitch) / 2 + 0.3, ox = (MX.w - MX.cols * MX.pitch) / 2 + 0.3, d = MX.pitch - 0.55
        const cols = msg.cols
        let start = 0
        if (msg.scroll) start = (Math.floor((now - msg.t0) / 70) % (cols.length + 14)) - 4
        else start = -Math.floor((MX.cols - cols.length) / 2)
        const lit = !msg.blink || Math.floor((now - msg.t0) / 420) % 2 === 0
        for (let x = 0; x < MX.cols; x++) {
            const col = cols[x + start]
            for (let y = 0; y < MX.rows; y++) {
                const onDot = lit && col && col[y]
                if (onDot) {
                    g.shadowColor = css(o.accent, 0.6)
                    g.shadowBlur = 1.6 * TS
                    g.fillStyle = css(accentHi)
                } else {
                    g.shadowBlur = 0
                    g.fillStyle = css(accentHi, 0.055)
                }
                g.beginPath()
                g.arc(ox + x * MX.pitch + d / 2, oy + y * MX.pitch + d / 2, d * 0.46, 0, 7)
                g.fill()
            }
        }
        // marquee and blink keep the loop alive; a static message stops it
        mxRaf = onScreen && ((msg.scroll && !reduce()) || msg.blink) ? requestAnimationFrame(drawMatrix) : 0
    }

    // ── sound and haptics
    let actx: AudioContext | null = null, nbuf: AudioBuffer | null = null
    function audio() {
        if (!o.sound()) return null
        try {
            if (!actx) {
                actx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
                nbuf = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate)
                const d = nbuf.getChannelData(0)
                for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
            }
            if (actx.state === "suspended") actx.resume()
            return actx
        } catch (e) {
            return null
        }
    }
    type NoiseOpts = { type?: BiquadFilterType; f?: number; f2?: number; q?: number; gain?: number; attack?: number; hold?: number; dur?: number; delay?: number }
    function noise({ type = "bandpass", f = 1000, f2 = 0, q: Q = 1, gain = 0.05, attack = 0.005, hold = 0, dur = 0.05, delay = 0 }: NoiseOpts) {
        const a = audio()
        if (!a || !nbuf) return
        const t = a.currentTime + delay, src = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain()
        src.buffer = nbuf
        fl.type = type
        fl.frequency.setValueAtTime(f, t)
        if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + attack + hold + dur)
        fl.Q.value = Q
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(gain, t + attack)
        g.gain.setValueAtTime(gain, t + attack + hold)
        g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + dur)
        src.connect(fl).connect(g).connect(a.destination)
        src.start(t, Math.random())
        src.stop(t + attack + hold + dur + 0.05)
    }
    function tone(f: number, dur: number, gain: number, delay = 0) {
        const a = audio()
        if (!a) return
        const t = a.currentTime + delay, osc = a.createOscillator(), g = a.createGain()
        osc.type = "square"
        osc.frequency.value = f
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(gain, t + 0.005)
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
        osc.connect(g).connect(a.destination)
        osc.start(t)
        osc.stop(t + dur + 0.02)
    }
    function hum(dur: number) {
        const a = audio()
        if (!a) return
        const t = a.currentTime, osc = a.createOscillator(), fl = a.createBiquadFilter(), g = a.createGain()
        osc.type = "sawtooth"
        osc.frequency.setValueAtTime(46, t)
        osc.frequency.linearRampToValueAtTime(60, t + 0.25)
        osc.frequency.setValueAtTime(60, t + dur - 0.2)
        osc.frequency.linearRampToValueAtTime(42, t + dur)
        fl.type = "lowpass"
        fl.frequency.value = 240
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(0.05, t + 0.15)
        g.gain.setValueAtTime(0.05, t + dur - 0.2)
        g.gain.linearRampToValueAtTime(0.0001, t + dur)
        osc.connect(fl).connect(g).connect(a.destination)
        osc.start(t)
        osc.stop(t + dur + 0.05)
    }
    const buzz = (ms: number) => {
        if (!o.haptics()) return
        try {
            navigator.vibrate?.(ms)
        } catch (e) {}
    }
    const sfx = {
        key: () => { noise({ type: "lowpass", f: 800, gain: 0.09, dur: 0.05 }); noise({ f: 3000, q: 1.5, gain: 0.025, dur: 0.02 }); buzz(8) },
        scan: (d: number) => { hum(d); noise({ f: 650, q: 0.7, gain: 0.016, attack: 0.15, hold: d - 0.35, dur: 0.2 }); noise({ type: "lowpass", f: 480, gain: 0.07, dur: 0.06, delay: d - 0.05 }) },
        feed: () => { noise({ f: 1700, f2: 4000, q: 0.6, gain: 0.04, attack: 0.04, hold: 0.25, dur: 0.18 }); noise({ type: "lowpass", f: 1100, gain: 0.05, dur: 0.06, delay: 0.55 }) },
        lidUp: () => { noise({ type: "lowpass", f: 600, gain: 0.05, dur: 0.05 }); noise({ f: 900, f2: 500, q: 0.6, gain: 0.015, attack: 0.1, dur: 0.3 }) },
        lidDown: () => { noise({ f: 600, f2: 1400, q: 0.6, gain: 0.012, attack: 0.15, dur: 0.15 }); noise({ type: "lowpass", f: 380, gain: 0.12, dur: 0.09, delay: 0.42 }); later(() => buzz(12), 420) },
        paper: () => noise({ f: 2600, q: 0.8, gain: 0.025, dur: 0.08 }),
        settle: () => { noise({ f: 1900, f2: 900, q: 0.7, gain: 0.03, attack: 0.02, dur: 0.16 }); buzz(6) },
        copied: () => { tone(1568, 0.09, 0.035); tone(2093, 0.14, 0.03, 0.09); buzz(14) },
    }

    // ── lid and lamp
    let lidOpen = false, loaded = false, busy = false, made = 0
    function setLid(open: boolean, quiet = false) {
        if (open === lidOpen) return
        lidOpen = open
        machine.classList.toggle("cp-open", open)
        machine.classList.toggle("cp-shut", !open)
        if (!quiet) open ? sfx.lidUp() : sfx.lidDown()
    }
    const LAMP0 = 5, LAMP1 = 5 + GW + 20
    const leaks = Array.from(desk.querySelectorAll(".cp-leak")) as HTMLElement[]
    function sweep(from: number, to: number, duration: number, easing: string) {
        const op: KeyframeAnimationOptions = { duration, easing, fill: "forwards" }
        const k = (x: number) => `translateX(${x}px)`
        carriage.animate([{ transform: k(from - 25) }, { transform: k(to - 25) }], op)
        beam.animate([{ transform: k(from - 85) }, { transform: k(to - 85) }], op)
        beamIn.animate([{ transform: k(85 - from) }, { transform: k(85 - to) }], op)
        // with the lid down, light only escapes along its edges
        for (const l of leaks) l.animate([{ transform: k(18 + from - 35) }, { transform: k(18 + to - 35) }], op)
    }

    // ── the original: drag or click it onto the glass
    const place = (x: number, y: number, r: number, extra = "") => `translate(${x}px, ${y}px) rotate(${r}deg) ${extra}`
    const deskScale = () => desk.getBoundingClientRect().width / W || 1
    const overGlass = (x: number, y: number) => {
        const cx = x + SW / 2, cy = y + SH / 2
        return cx > 18 && cx < 402 && cy > MY + 10 && cy < MY + 190
    }
    orig.setAttribute("aria-label", `Put the ${o.label.toLowerCase()} in the copier`)
    type SlipDrag = { sx: number; sy: number; x: number; y: number; k: number; moved: boolean }
    let og: SlipDrag | null = null

    function load(x: number, y: number, r: number, s = 1) {
        // the sheet travels to the corner of the glass and turns face down on the way
        drain()
        busy = true
        audio()
        setLid(true)
        orig.classList.add("cp-lifted", "cp-flying")
        show("READY")
        const T = reduce() ? 1 : 820, delay = reduce() ? 0 : 160
        const mx = (x + GLASS_SPOT.x) / 2, my = Math.min(y, GLASS_SPOT.y) - 26
        orig.animate(
            [
                { transform: place(x, y, r, `scale(${s}) rotateY(0deg)`) },
                { transform: place(mx, my, r * 0.5, "scale(1.07) rotateY(90deg)"), offset: 0.5 },
                { transform: place(GLASS_SPOT.x, GLASS_SPOT.y, 0, "scale(1.01) rotateY(180deg)"), offset: 0.88 },
                { transform: place(GLASS_SPOT.x, GLASS_SPOT.y, 0, "scale(1) rotateY(180deg)") },
            ],
            { duration: T, easing: "cubic-bezier(.45,.05,.3,1)", fill: "forwards", delay }
        )
        later(() => sfx.paper(), reduce() ? 0 : 300)
        later(() => {
            sfx.settle()
            loaded = true
            machine.classList.add("cp-loaded")
            orig.classList.add("cp-inside")
            orig.classList.remove("cp-lifted")
            orig.setAttribute("aria-label", `The ${o.label.toLowerCase()} is in the copier`)
            later(() => run(true), reduce() ? 0 : 380)
        }, T + delay + 20)
    }

    // ── copying
    type Page = { el: HTMLDivElement; x: number; y: number; r: number; out: boolean }
    type PageDrag = { sx: number; sy: number; x0: number; y0: number; lx: number; vx: number; tilt: number; k: number; moved: boolean }
    const pages: Page[] = []
    const pageT = (p: Page, extra = "") => `translate(${p.x}px, ${p.y}px) rotate(${p.r}deg) ${extra}`
    const TRAY = { l: 38 - 70, r: 382 - 70, t: 226 - 236, b: 394 - 236 }
    const inTray = (p: Page) => {
        const cx = p.x + PW / 2, cy = p.y + PH / 2
        return cx > TRAY.l && cx < TRAY.r && cy > TRAY.t && cy < TRAY.b + 20
    }
    function run(auto: boolean) {
        busy = true
        machine.classList.remove("cp-ready")
        startBtn.classList.add("cp-down")
        later(() => startBtn.classList.remove("cp-down"), 150)
        sfx.key()
        const scanT = reduce() ? 200 : 1250, backT = reduce() ? 100 : 560, open = lidOpen
        show("COPYING", { blink: true })
        later(() => {
            machine.classList.add("cp-scanning")
            sfx.scan(scanT / 1000)
            sweep(LAMP0, LAMP1, scanT, "cubic-bezier(.45,.05,.4,1)")
            later(() => {
                machine.classList.remove("cp-scanning")
                sweep(LAMP1, LAMP0, backT, "cubic-bezier(.5,0,.2,1)")
                eject(open, true)
                if (auto) later(() => setLid(false), reduce() ? 0 : 900)
            }, scanT)
        }, 170)
    }
    function eject(open: boolean, animate: boolean) {
        made++
        const n = made, el = document.createElement("div")
        el.className = "cp-page"
        const c = bleed(makeCopy(n, open), PW, PH)
        c.setAttribute("aria-hidden", "true")
        el.appendChild(c)
        el.setAttribute("role", "button")
        el.tabIndex = 0
        el.setAttribute("aria-label", `Copy ${o.value} to the clipboard`)
        const inTrayCount = pages.filter((p) => !p.out).length
        const R = rng(n * 91), rot = (R() - 0.5) * 4, dx = (R() - 0.5) * 12, dy = Math.min(inTrayCount, 4) * 2.4
        const p = { el, x: dx, y: dy, r: rot, out: false }
        pages.push(p)
        machine.insertBefore(el, q(".cp-overhang"))
        bindPage(p)
        el.style.transform = pageT(p)
        const T = animate && !reduce() ? 820 : 0
        if (T) {
            sfx.feed()
            el.animate(
                [
                    { transform: "translate(0px, -112px) rotate(0deg)" },
                    { transform: `translate(${dx * 0.7}px, ${dy + 5}px) rotate(${rot * 0.5}deg)`, offset: 0.64, easing: "cubic-bezier(.25,.6,.3,1)" },
                    { transform: pageT(p) },
                ],
                { duration: T, easing: "cubic-bezier(.25,.7,.3,1)" }
            )
        }
        later(() => {
            busy = false
            machine.classList.add("cp-ready")
            show("TAKE COPY")
        }, T)
    }
    function fallback() {
        const ta = document.createElement("textarea")
        ta.value = o.value
        ta.setAttribute("readonly", "")
        ta.style.cssText = "position:fixed;opacity:0;pointer-events:none"
        document.body.appendChild(ta)
        ta.select()
        try {
            document.execCommand("copy")
        } catch (e) {}
        ta.remove()
    }
    let copiedT: ReturnType<typeof setTimeout> | undefined, flashT: ReturnType<typeof setTimeout> | undefined
    function copyToClipboard() {
        try {
            navigator.clipboard.writeText(o.value).catch(fallback)
        } catch (e) {
            fallback()
        }
        sfx.copied()
        show("COPIED ✓")
        machine.classList.add("cp-flash")
        clearTimeout(flashT)
        flashT = later(() => machine.classList.remove("cp-flash"), 900)
        live.textContent = ""
        live.textContent = `Copied ${o.value} to the clipboard.`
        clearTimeout(copiedT)
        copiedT = later(() => show(loaded ? "READY" : "PLACE ORIGINAL"), 2600)
        o.onCopy()
    }
    function retire(p: Page) {
        // copies that shouldn't stay on the desk slide away once they've done their job
        if (o.keepCopies) return
        later(() => {
            p.el.animate([{ transform: pageT(p), opacity: 1 }, { transform: pageT(p, "translateY(24px)"), opacity: 0 }], { duration: reduce() ? 1 : 420, easing: "ease-in", fill: "forwards" })
            later(() => {
                p.el.remove()
                pages.splice(pages.indexOf(p), 1)
            }, reduce() ? 10 : 440)
        }, 1600)
    }
    function bindPage(p: Page) {
        const el = p.el
        let s: PageDrag | null = null
        on(el, "pointerdown", (e: PointerEvent) => {
            if (!p.out && pages.filter((x) => !x.out).slice(-1)[0] !== p) return // in the tray only the top copy comes out
            e.preventDefault()
            el.setPointerCapture(e.pointerId)
            audio()
            el.getAnimations().forEach((a) => a.cancel())
            s = { sx: e.clientX, sy: e.clientY, x0: p.x, y0: p.y, lx: e.clientX, vx: 0, tilt: 0, k: deskScale(), moved: false }
        })
        on(el, "pointermove", (e: PointerEvent) => {
            if (!s) return
            const dx = (e.clientX - s.sx) / s.k, dy = (e.clientY - s.sy) / s.k
            if (!s.moved && Math.hypot(dx, dy) > 4) {
                s.moved = true
                el.classList.add("cp-held")
                sfx.paper()
            }
            if (!s.moved) return
            s.vx = s.vx * 0.7 + (e.clientX - s.lx) * 0.3
            s.lx = e.clientX
            s.tilt += (Math.max(-7, Math.min(7, s.vx * 0.5)) - s.tilt) * 0.3
            p.x = s.x0 + dx
            p.y = s.y0 + dy
            el.style.transform = pageT(p, `rotate(${s.tilt}deg) scale(1.035)`)
        })
        const up = () => {
            if (!s) return
            const st = s
            s = null
            el.classList.remove("cp-held")
            if (!st.moved) {
                copyToClipboard()
                el.animate([{ transform: pageT(p) }, { transform: pageT(p, "translateY(-2px) scale(1.012)") }, { transform: pageT(p) }], { duration: 260, easing: "ease-out" })
                return
            }
            sfx.settle()
            const from = el.style.transform
            if (!p.out && !inTray(p)) {
                p.out = true
                el.classList.add("cp-out")
                p.r += st.tilt * 0.4
                copyToClipboard()
                retire(p)
            } else if (!p.out) {
                p.x = st.x0
                p.y = st.y0
            }
            el.style.transform = pageT(p)
            el.animate([{ transform: from }, { transform: pageT(p) }], { duration: 480, easing: "cubic-bezier(.22,1,.36,1)" })
        }
        on(el, "pointerup", up)
        on(el, "pointercancel", up)
        on(el, "keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                copyToClipboard()
            }
        })
    }

    // ── build
    desk.style.setProperty("--cp-grain", `url(${noiseURL(128, 70, 3)})`)
    desk.style.setProperty("--cp-foam", `url(${foamURL()})`)
    q(".cp-mark").textContent = o.mark
    const form = formation(SW, SH, 21)
    q(".cp-face").appendChild(bleed(makeFront(form), SW, SH))
    drawScale()
    // everything hidden at rest is built in idle moments, one piece per tick, so loading never stalls
    const queue: (() => void)[] = []
    const ric = (window as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback
    const cic = (window as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback
    const idle = (cb: () => void): number => (ric ? ric.call(window, cb) : window.setTimeout(cb, 16))
    const cancelIdle = (id: number) => (cic ? cic.call(window, id) : window.clearTimeout(id))
    let idleId = 0
    const pump = () => {
        idleId = 0
        queue.shift()?.()
        if (queue.length) idleId = idle(pump)
    }
    const drain = () => {
        while (queue.length) queue.shift()!()
    }
    queue.push(
        () => {
            const back = makeBack(form)
            q(".cp-back").appendChild(bleed(back, SW, SH))
            q(".cp-slip").appendChild(sized(back, SW, SH))
        },
        () => into(q(".cp-lit-slip") as HTMLCanvasElement, makeLit(form), SW, SH),
        () => into(q(".cp-dust") as HTMLCanvasElement, makeDust(false), GW, GH),
        () => into(q(".cp-lit-dust") as HTMLCanvasElement, makeDust(true), GW, GH),
        () => copyBase(),
        () => tonerField()
    )
    idleId = idle(pump)
    carriage.style.transform = `translateX(${LAMP0 - 25}px)`
    orig.style.transform = place(REST.x, REST.y, REST.r)

    if (!o.live) {
        // canvas and previews: a still, believable state
        drain()
        if (o.canvasState === "tray") {
            loaded = true
            machine.classList.add("cp-loaded")
            orig.classList.add("cp-inside")
            eject(true, false)
            show("TAKE COPY")
        } else show("READY") // a still frame can't show the scrolling hint
        return () => {
            timers.forEach(clearTimeout)
            cancelAnimationFrame(mxRaf)
            cancelIdle(idleId)
        }
    }
    show("PLACE ORIGINAL")

    // the display only animates while the copier is on screen and the tab is visible
    let inView = true
    const wake = () => {
        onScreen = inView && !document.hidden
        if (onScreen && !mxRaf) mxRaf = requestAnimationFrame(drawMatrix)
    }
    const io = new IntersectionObserver((entries) => {
        inView = entries[0]?.isIntersecting ?? true
        wake()
    })
    io.observe(desk)
    on(document, "visibilitychange", wake)

    on(orig, "pointerdown", (e: PointerEvent) => {
        if (loaded || busy) return
        e.preventDefault()
        orig.setPointerCapture(e.pointerId)
        audio()
        orig.getAnimations().forEach((a) => a.cancel())
        og = { sx: e.clientX, sy: e.clientY, x: REST.x, y: REST.y, k: deskScale(), moved: false }
    })
    on(orig, "pointermove", (e: PointerEvent) => {
        if (!og) return
        const dx = (e.clientX - og.sx) / og.k, dy = (e.clientY - og.sy) / og.k
        if (!og.moved && Math.hypot(dx, dy) > 4) {
            og.moved = true
            orig.classList.add("cp-lifted")
            sfx.paper()
        }
        if (!og.moved) return
        og.x = REST.x + dx
        og.y = REST.y + dy
        orig.style.transform = place(og.x, og.y, REST.r * 0.4, "scale(1.03)")
        setLid(og.y + SH > MY - 30) // the lid lifts as the sheet comes near
        show(lidOpen && overGlass(og.x, og.y) ? "DROP" : "PLACE ORIGINAL")
    })
    const release = () => {
        if (!og) return
        const s = og
        og = null
        if (!s.moved) return load(REST.x, REST.y, REST.r)
        if (overGlass(s.x, s.y)) return load(s.x, s.y, REST.r * 0.4, 1.03)
        orig.classList.remove("cp-lifted")
        sfx.settle()
        setLid(false)
        show("PLACE ORIGINAL")
        orig.animate([{ transform: orig.style.transform }, { transform: place(REST.x, REST.y, REST.r) }], { duration: 520, easing: "cubic-bezier(.22,1,.36,1)" })
        orig.style.transform = place(REST.x, REST.y, REST.r)
    }
    on(orig, "pointerup", release)
    on(orig, "pointercancel", release)
    on(orig, "click", (e: MouseEvent) => {
        if (e.detail === 0 && !loaded && !busy) load(REST.x, REST.y, REST.r) // keyboard
    })
    on(startBtn, "click", () => {
        audio()
        if (busy) return
        if (!loaded) return load(REST.x, REST.y, REST.r) // the sheet is still on the desk: feed it in, then copy
        // lift the lid for every copy so they all print the same, and the scan stays visible
        busy = true
        setLid(true)
        later(() => run(true), reduce() ? 0 : 520)
    })

    return () => {
        cleanups.forEach((f) => f())
        timers.forEach(clearTimeout)
        cancelAnimationFrame(mxRaf)
        cancelIdle(idleId)
        io.disconnect()
        try {
            actx?.close()
        } catch (e) {}
    }
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 640
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function Copier(props: CopierProps) {
    const { style } = props
    const content: Content = { ...DEFAULTS.content, ...props.content }
    const lightPal: Palette = { ...DEFAULTS.light, ...props.light }
    const darkPal: Palette = { ...DEFAULTS.dark, ...props.dark }
    const beh: Behavior = { ...DEFAULTS.behavior, ...props.behavior }
    const valueFont = fontSpec(props.typography?.value, MONO_FALLBACK, 500)
    const labelFont = fontSpec(props.typography?.label, SANS_FALLBACK, 600)
    const theme: Theme = props.theme || "dark"

    const isOnCanvas = useIsOnFramerCanvas()
    const isStatic = useIsStaticRenderer()
    const liveMode = !isOnCanvas && !isStatic

    // Theme
    const [prefersDark, setPrefersDark] = useState(true)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-color-scheme: dark)")
        const fn = () => setPrefersDark(mq.matches)
        fn()
        mq.addEventListener("change", fn)
        return () => mq.removeEventListener("change", fn)
    }, [])
    const isDark = theme === "dark" || (theme === "auto" && prefersDark)
    const pal = isDark ? darkPal : lightPal

    // Reduced motion, followed live
    const reducedRef = useRef(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const fn = () => (reducedRef.current = mq.matches)
        fn()
        mq.addEventListener("change", fn)
        return () => mq.removeEventListener("change", fn)
    }, [])

    // Toggles and the event are read through refs so changing them doesn't rebuild the machine
    const soundRef = useRef(beh.sound), hapticsRef = useRef(beh.haptics), onCopyRef = useRef(props.onCopy)
    soundRef.current = beh.sound
    hapticsRef.current = beh.haptics
    onCopyRef.current = props.onCopy

    // Fit the 420×640 desk into the frame
    const rootRef = useRef<HTMLDivElement>(null)
    const deskRef = useRef<HTMLDivElement>(null)
    const [fit, setFit] = useState({ k: 1, x: 0, y: 0 })
    useIsoLayoutEffect(() => {
        const el = rootRef.current
        if (!el) return
        const measure = () => {
            const w = el.offsetWidth || W, h = el.offsetHeight || H
            const k = Math.min(w / W, h / H)
            setFit({ k, x: (w - W * k) / 2, y: (h - H * k) / 2 })
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Colours
    const body = parseColor(pal.body, [44, 44, 46])
    const tray = parseColor(pal.tray, body)
    const accent = parseColor(pal.accent, [226, 72, 31])
    const paper = parseColor(pal.paper, [244, 242, 236])
    const ink = parseColor(pal.ink, [35, 35, 39])
    const shadow = parseColor(pal.shadow, [0, 0, 0])
    const s = Math.max(0, Math.min(2, (pal.strength ?? 100) / 100))
    const lightBody = lum(body) > 0.5
    // shade inside the tray softens as the tray gets lighter, so a white tray doesn't get a black band
    const tk = 1 - 0.62 * Math.max(0, Math.min(1, (lum(tray) - 0.25) / 0.6))
    const vars: Record<string, string> = {
        "--cp-b": css(body),
        "--cp-t": css(tray),
        "--cp-wi1": css(shadow, 0.5 * tk),
        "--cp-wi2": css(shadow, 0.24 * tk),
        "--cp-oh1": css(shadow, 0.6 * tk),
        "--cp-oh2": css(shadow, 0.26 * tk),
        "--cp-oh3": css(shadow, 0.07 * tk),
        "--cp-a": css(accent),
        "--cp-s1": css(shadow, 0.45 * s),
        "--cp-s2": css(shadow, 0.3 * s),
        "--cp-s3": css(shadow, 0.5 * s),
        "--cp-ps": `0 0.5px 1px ${css(shadow, 0.16 * s)}, 0 2px 5px -1px ${css(shadow, 0.12 * s)}, 0 14px 28px -12px ${css(shadow, 0.25 * s)}`,
        "--cp-ps-lift": `0 2px 4px ${css(shadow, 0.1 * s)}, 0 18px 30px -12px ${css(shadow, 0.3 * s)}, 0 44px 60px -26px ${css(shadow, 0.36 * s)}`,
        "--cp-eng": lightBody ? "rgba(0,0,0,0.36)" : "rgba(255,255,255,0.28)",
        "--cp-engs": lightBody ? "0 0.5px 0 rgba(255,255,255,0.7)" : "0 -0.5px 0 rgba(0,0,0,0.6)",
        "--cp-vf": valueFont.family,
    }

    // Rebuild the machine whenever something printed or drawn into the textures changes
    const key = [content.label, content.value, content.mark, css(accent), css(paper), css(ink), liveMode, beh.canvasState, beh.keepCopies, JSON.stringify(valueFont), JSON.stringify(labelFont)].join("|")
    useEffect(() => {
        const desk = deskRef.current
        if (!desk) return
        let stop: (() => void) | undefined, dead = false
        const fonts = typeof document !== "undefined" ? document.fonts : undefined
        const fontsReady: Promise<unknown> = fonts
            ? Promise.all([
                  fonts.load(`${valueFont.style} ${valueFont.weight} 19px ${valueFont.family}`),
                  fonts.load(`${labelFont.style} ${labelFont.weight} 9px ${labelFont.family}`),
              ]).catch(() => undefined)
            : Promise.resolve()
        Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2500))]).then(() => {
            if (dead) return
            stop = mount(desk, {
                label: content.label || "",
                value: content.value || "",
                mark: content.mark || "",
                accent,
                paper,
                ink,
                live: liveMode,
                canvasState: beh.canvasState,
                keepCopies: beh.keepCopies,
                reduced: () => reducedRef.current,
                sound: () => soundRef.current,
                haptics: () => hapticsRef.current,
                onCopy: () => onCopyRef.current?.(),
                valueFont,
                labelFont,
            })
        })
        return () => {
            dead = true
            stop?.()
        }
    }, [key])

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                // with only a width (auto height), keep the desk's own shape instead of collapsing
                aspectRatio: `${W} / ${H}`,
                boxSizing: "border-box",
                overflow: "visible",
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr)",
            }}
        >
            <style>{CSS}</style>
            <div ref={deskRef} className="cp-desk" style={{ ...(vars as CSSProperties), transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.k})` }}>
                <Machine key={key} />
            </div>
        </div>
    )
}
Copier.displayName = "Copier"

// ─── Controls ────────────────────────────────────────────────────────────────

const color = (title: string, defaultValue: string, description: string) => ({ type: ControlType.Color as const, title, defaultValue, description })
const colorControls = (d: Palette) => ({
    body: color("Body", d.body, "The copier's casing and lid. Edges and shading are derived from it."),
    tray: color("Tray", d.tray, "The output tray the copies land in."),
    accent: color("Accent", d.accent, "Start key, status ring, display, scan light and rulers on the glass."),
    paper: color("Paper", d.paper, "The original sheet. Copies use a slightly cooler copier paper."),
    ink: color("Ink", d.ink, "Typed text on the original. Copies always print in black toner."),
    shadow: color("Shadow", d.shadow, "Tint for every shadow on the desk. Match it to the surface behind."),
    strength: { type: ControlType.Number as const, title: "Strength", defaultValue: d.strength, min: 0, max: 200, step: 5, unit: "%", description: "How dark the shadows are." },
})

addPropertyControls(Copier, {
    content: {
        type: ControlType.Object,
        title: "Content",
        buttonTitle: "Text",
        controls: {
            label: { type: ControlType.String, title: "Label", defaultValue: DEFAULTS.content.label, description: "Small printed label above the value." },
            value: { type: ControlType.String, title: "Value", defaultValue: DEFAULTS.content.value, description: "Typed on the sheet and copied to the clipboard. Long values are condensed to fit." },
            mark: { type: ControlType.String, title: "Lid text", defaultValue: DEFAULTS.content.mark, description: "Engraved in the corner of the lid. Leave empty to hide." },
        },
    },
    typography: {
        type: ControlType.Object,
        title: "Typography",
        buttonTitle: "Fonts",
        controls: {
            value: { type: ControlType.Font, title: "Value", controls: "basic", defaultFontType: "monospace", description: "Font for the typed value on the sheet and its copies, and the engraving. Size adjusts to fit." },
            label: { type: ControlType.Font, title: "Label", controls: "basic", defaultFontType: "sans-serif", description: "Font for the small printed label." },
        },
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["light", "dark", "auto"],
        optionTitles: ["Light", "Dark", "Auto"],
        displaySegmentedControl: true,
        defaultValue: "dark",
        description: "Auto follows the visitor's system setting.",
    },
    light: { type: ControlType.Object, title: "Light", buttonTitle: "Colours", controls: colorControls(DEFAULTS.light), hidden: (p: CopierProps) => p.theme === "dark" },
    dark: { type: ControlType.Object, title: "Dark", buttonTitle: "Colours", controls: colorControls(DEFAULTS.dark), hidden: (p: CopierProps) => p.theme === "light" },
    behavior: {
        type: ControlType.Object,
        title: "Behavior",
        buttonTitle: "Sound & copies",
        controls: {
            sound: { type: ControlType.Boolean, title: "Sound", defaultValue: true, enabledTitle: "On", disabledTitle: "Off", description: "Lid, motor, paper and a short beep when copied." },
            haptics: { type: ControlType.Boolean, title: "Haptics", defaultValue: true, enabledTitle: "On", disabledTitle: "Off", description: "Small vibrations on phones that support it." },
            keepCopies: { type: ControlType.Boolean, title: "Copies", defaultValue: true, enabledTitle: "Stay", disabledTitle: "Clear", description: "Stay: copies stay where they're dropped. Clear: they slide away after copying." },
            canvasState: {
                type: ControlType.Enum,
                title: "Canvas",
                options: ["rest", "tray"],
                optionTitles: ["At rest", "Copy in tray"],
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
                defaultValue: "rest",
                description: "What the editor and previews show. The live site always starts at rest.",
            },
        },
    },
    onCopy: { type: ControlType.EventHandler, title: "On copy" },
})
