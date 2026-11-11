// Mail Slot: a newsletter signup you post by hand.
// Put it inside a Framer Form: it adds a real email field (name set by "Field name")
// and submits with the form, so entries land in the form's own inbox. No outside services.
// Outside a form it runs a demo send.
import * as React from "react"
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ---------- helpers ----------

// Natural width when the instance is set to Fit (and wherever it is dropped in).
const NATURAL_WIDTH = 440

// Narrowest layout. Below it the whole object is drawn at this width and shrunk evenly.
const MIN_WIDTH = 320

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

type Spring = { x: number; v: number }
function stepSpring(s: Spring, target: number, k: number, c: number, dt: number) {
    const n = 4,
        h = dt / n
    for (let i = 0; i < n; i++) {
        s.v += (-k * (s.x - target) - c * s.v) * h
        s.x += s.v * h
    }
    return Math.abs(s.x - target) < 0.02 && Math.abs(s.v) < 0.02
}

// Font control values: keep typography, drop colour so the colour controls win
function font(f: any): CSSProperties {
    if (!f) return {}
    const { color, ...rest } = f
    delete (rest as any)["--framer-font-color"]
    // sizes follow the object's phone scale (--k)
    if (rest.fontSize != null) rest.fontSize = `calc(${typeof rest.fontSize === "number" ? rest.fontSize + "px" : rest.fontSize} * var(--k, 1))`
    return rest
}

const mix = (c: string, pct: number) => `color-mix(in srgb, ${c} ${clamp(Math.round(pct), 0, 100)}%, transparent)`

// ---------- sound (synthesized, created on first touch) ----------

let ac: AudioContext | null = null
let noiseBuf: AudioBuffer | null = null
function audio(on: boolean) {
    if (!on || typeof window === "undefined") return null
    try {
        if (!ac) {
            const AC = (window as any).AudioContext || (window as any).webkitAudioContext
            if (!AC) return null
            ac = new AC() as AudioContext
            noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate)
            const d = noiseBuf.getChannelData(0)
            for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
        }
        if (ac.state === "suspended") ac.resume()
        return ac
    } catch (e) {
        return null
    }
}
function noise(a: AudioContext, o: { t?: number; dur?: number; f?: number; q?: number; gain?: number; attack?: number }) {
    const { t = 0, dur = 0.05, f = 2000, q = 1, gain = 0.2, attack = 0.002 } = o
    const s = a.createBufferSource()
    s.buffer = noiseBuf
    const bp = a.createBiquadFilter()
    bp.type = "bandpass"
    bp.frequency.value = f
    bp.Q.value = q
    const g = a.createGain()
    const t0 = a.currentTime + t
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    s.connect(bp).connect(g).connect(a.destination)
    s.start(t0, Math.random())
    s.stop(t0 + dur + 0.02)
}
function tone(a: AudioContext, o: { f?: number; to?: number; dur?: number; gain?: number; type?: OscillatorType }) {
    const { f = 1200, to, dur = 0.04, gain = 0.04, type = "triangle" } = o
    const osc = a.createOscillator()
    osc.type = type
    const g = a.createGain()
    const t0 = a.currentTime
    osc.frequency.setValueAtTime(f, t0)
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur)
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.003)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(g).connect(a.destination)
    osc.start(t0)
    osc.stop(t0 + dur + 0.02)
}
const sfx = {
    touch(on: boolean) {
        const a = audio(on)
        if (!a) return
        noise(a, { dur: 0.04, f: 1500, q: 1.6, gain: 0.07 })
        tone(a, { f: 900, dur: 0.03, gain: 0.015 })
    },
    clack(on: boolean, k: number) {
        const a = audio(on)
        if (!a) return
        const g = clamp(k, 0, 1)
        noise(a, { dur: 0.035, f: 3200, q: 2.2, gain: 0.3 * g })
        tone(a, { f: 1550, dur: 0.05, gain: 0.035 * g })
        tone(a, { f: 180, to: 85, dur: 0.09, gain: 0.13 * g, type: "sine" })
    },
    bounce(on: boolean) {
        const a = audio(on)
        if (!a) return
        tone(a, { f: 150, to: 70, dur: 0.12, gain: 0.14, type: "sine" })
        noise(a, { dur: 0.05, f: 900, q: 1, gain: 0.06 })
    },
    pop(on: boolean) {
        const a = audio(on)
        if (!a) return
        noise(a, { dur: 0.09, f: 1200, q: 0.8, gain: 0.09, attack: 0.01 })
        tone(a, { f: 260, to: 140, dur: 0.1, gain: 0.06, type: "sine" })
    },
}
// paper friction: one looping filtered noise whose level follows the card's speed in the slot
function makeFriction() {
    let src: AudioBufferSourceNode | null = null,
        g: GainNode | null = null,
        bp: BiquadFilterNode | null = null
    return {
        set(level: number, on: boolean) {
            if (!ac || !on) {
                if (g && ac) g.gain.setTargetAtTime(0, ac.currentTime, 0.03)
                return
            }
            if (!src && level > 0.002) {
                src = ac.createBufferSource()
                src.buffer = noiseBuf
                src.loop = true
                bp = ac.createBiquadFilter()
                bp.type = "bandpass"
                bp.frequency.value = 1800
                bp.Q.value = 0.7
                g = ac.createGain()
                g.gain.value = 0
                src.connect(bp).connect(g).connect(ac.destination)
                src.start()
            }
            if (g && bp) {
                g.gain.setTargetAtTime(Math.min(level, 0.09), ac.currentTime, 0.025)
                bp.frequency.setTargetAtTime(1500 + level * 9000, ac.currentTime, 0.05)
            }
        },
        stop() {
            if (src && g && ac) {
                const s = src
                g.gain.setTargetAtTime(0, ac.currentTime, 0.03)
                window.setTimeout(() => {
                    try {
                        s.stop()
                    } catch (e) {}
                }, 200)
            }
            src = g = bp = null
        },
    }
}
function vibrate(on: boolean, p: number | number[]) {
    if (!on) return
    try {
        navigator.vibrate?.(p)
    } catch (e) {}
}

// ---------- form result ----------
// Framer Forms send entries to their own endpoint. The browser's Performance API reports when that
// request finishes (and its status where supported) without touching fetch or anything else on the page.
const FORM_ENDPOINT = /\/forms\/v\d+\/forms\/[^/]+\/submit/

function watchFormRequest(since: number, done: (ok: boolean) => void) {
    if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") return () => {}
    let po: PerformanceObserver | null = null
    try {
        po = new PerformanceObserver((list) => {
            for (const e of list.getEntries() as PerformanceResourceTiming[]) {
                if (e.startTime < since || !FORM_ENDPOINT.test(e.name)) continue
                const status = (e as any).responseStatus
                po?.disconnect()
                po = null
                // browsers without responseStatus report 0/undefined: a finished request counts as sent
                done(typeof status === "number" && status > 0 ? status < 400 : true)
                return
            }
        })
        po.observe({ type: "resource", buffered: false } as any)
    } catch (e) {}
    return () => po?.disconnect()
}

// ---------- theme ----------

const COLOR_KEYS: [string, string][] = [
    ["plateTop", "Plate top"],
    ["plateBottom", "Plate bottom"],
    ["frameTop", "Frame top"],
    ["frameBottom", "Frame bottom"],
    ["flapTop", "Flap top"],
    ["flapBottom", "Flap bottom"],
    ["slot", "Slot"],
    ["engraving", "Engraving"],
    ["cardTop", "Card top"],
    ["cardBottom", "Card bottom"],
    ["kicker", "Kicker"],
    ["heading", "Heading"],
    ["field", "Field"],
    ["fieldText", "Field text"],
    ["placeholder", "Placeholder"],
    ["error", "Error text"],
    ["buttonTop", "Button top"],
    ["buttonBottom", "Button bottom"],
    ["buttonText", "Button text"],
    ["thanksTitle", "Thank-you title"],
    ["thanksText", "Thank-you text"],
    ["note", "Note"],
    ["link", "Link"],
    ["light", "Light"],
    ["shadow", "Shadow"],
]

const DEFAULT_DARK: Record<string, any> = {
    plateTop: "rgb(34, 34, 32)",
    plateBottom: "rgb(24, 24, 23)",
    frameTop: "rgb(50, 50, 48)",
    frameBottom: "rgb(30, 30, 29)",
    flapTop: "rgb(72, 72, 69)",
    flapBottom: "rgb(44, 44, 42)",
    slot: "rgb(3, 3, 3)",
    engraving: "rgba(0, 0, 0, 0.6)",
    cardTop: "rgb(255, 255, 255)",
    cardBottom: "rgb(222, 222, 218)",
    kicker: "rgba(31, 31, 29, 0.58)",
    heading: "rgb(31, 31, 29)",
    field: "rgb(228, 228, 224)",
    fieldText: "rgb(31, 31, 29)",
    placeholder: "rgba(31, 31, 29, 0.42)",
    error: "rgb(160, 44, 22)",
    buttonTop: "rgb(50, 50, 48)",
    buttonBottom: "rgb(28, 28, 27)",
    buttonText: "rgb(242, 242, 239)",
    thanksTitle: "rgb(242, 242, 239)",
    thanksText: "rgb(150, 150, 146)",
    note: "rgb(150, 150, 146)",
    link: "rgb(242, 242, 239)",
    light: "rgb(255, 196, 120)",
    shadow: "rgb(0, 0, 0)",
    strength: 100,
}
const DEFAULT_LIGHT: Record<string, any> = {
    ...DEFAULT_DARK,
    plateTop: "rgb(238, 238, 234)",
    plateBottom: "rgb(220, 220, 216)",
    frameTop: "rgb(250, 250, 247)",
    frameBottom: "rgb(212, 212, 208)",
    flapTop: "rgb(232, 232, 228)",
    flapBottom: "rgb(200, 200, 196)",
    slot: "rgb(40, 40, 38)",
    engraving: "rgba(0, 0, 0, 0.3)",
    cardBottom: "rgb(246, 246, 243)",
    thanksTitle: "rgb(31, 31, 29)",
    thanksText: "rgb(102, 102, 98)",
    note: "rgb(102, 102, 98)",
    link: "rgb(31, 31, 29)",
    strength: 70,
}

// Colours grouped by the part of the object they paint (panel order)
const COLOR_GROUPS: [string, string, [string, string][]][] = [
    ["plate", "Plate", [["plateTop", "Top"], ["plateBottom", "Bottom"]]],
    ["slot", "Slot", [["frameTop", "Frame top"], ["frameBottom", "Frame bottom"], ["flapTop", "Flap top"], ["flapBottom", "Flap bottom"], ["slot", "Opening"], ["engraving", "Engraving"]]],
    ["card", "Card", [["cardTop", "Top"], ["cardBottom", "Bottom"], ["kicker", "Kicker"], ["heading", "Heading"]]],
    ["field", "Field", [["field", "Fill"], ["fieldText", "Text"], ["placeholder", "Placeholder"], ["error", "Error"]]],
    ["button", "Button", [["buttonTop", "Top"], ["buttonBottom", "Bottom"], ["buttonText", "Text"]]],
    ["messages", "Messages", [["thanksTitle", "Thank-you title"], ["thanksText", "Thank-you text"], ["note", "Note"], ["link", "Link"], ["light", "Light"]]],
]
// nested panel value -> flat colour map
function flatColors(v: any, defaults: Record<string, any>) {
    const out: Record<string, any> = { ...defaults }
    if (!v) return out
    for (const [g] of COLOR_GROUPS) Object.assign(out, v[g] || {})
    if (v.shadow) {
        if (v.shadow.color) out.shadow = v.shadow.color
        if (typeof v.shadow.strength === "number") out.strength = v.shadow.strength
    }
    return out
}

// Per-theme values derived from the chosen colours, written as --d-* and --l-* custom properties
function themeVars(prefix: string, c: Record<string, any>, isDark: boolean) {
    const s = clamp((c.strength ?? 100) / 100, 0, 2)
    const sh = c.shadow || "#000"
    const v: Record<string, string> = {}
    for (const [k] of COLOR_KEYS) v[`--${prefix}-${k}`] = c[k]
    const hi = isDark ? 0.07 : 0.9
    v[`--${prefix}-rim`] = `rgba(255,255,255,${hi})`
    v[`--${prefix}-glow`] = `rgba(255,255,255,${isDark ? 0.035 : 0.55})`
    v[`--${prefix}-edge`] = mix(sh, (isDark ? 60 : 22) * Math.min(1, s * 1.2))
    v[`--${prefix}-plateShadow`] = [
        `inset 0 1px 0 rgba(255,255,255,${hi})`,
        `0 0 0 1px ${mix(sh, (isDark ? 60 : 22) * Math.min(1, s * 1.2))}`,
        `0 1px 1px ${mix(sh, 30 * s)}`,
        `0 2px 2px ${mix(sh, 28 * s)}`,
        `0 4px 4px ${mix(sh, 26 * s)}`,
        `0 8px 8px ${mix(sh, 24 * s)}`,
        `0 16px 16px ${mix(sh, 22 * s)}`,
        `0 32px 32px ${mix(sh, 20 * s)}`,
    ].join(", ")
    v[`--${prefix}-frameShadow`] = [
        `inset 0 1px 0 rgba(255,255,255,${isDark ? 0.16 : 1})`,
        `inset 0 -1px 0 ${mix(sh, isDark ? 30 : 12)}`,
        `0 0 0 1px ${mix(sh, (isDark ? 42 : 16) * Math.min(1, s * 1.2))}`,
        `0 1px 1px ${mix(sh, 30 * s * (isDark ? 1 : 0.5))}`,
        `0 3px 4px ${mix(sh, 22 * s * (isDark ? 1 : 0.5))}`,
        `0 8px 12px ${mix(sh, 16 * s * (isDark ? 1 : 0.5))}`,
    ].join(", ")
    v[`--${prefix}-cardShadow`] = [
        `inset 0 1px 0 rgba(255,255,255,0.9)`,
        `0 0 0 1px ${mix(sh, 26 * Math.min(1, s * 1.2))}`,
        `0 1px 1px ${mix(sh, 20 * s)}`,
        `0 -1px 12px -6px ${mix(sh, 18 * s)}`,
        `0 8px 14px -10px ${mix(sh, 35 * s)}`,
    ].join(", ")
    v[`--${prefix}-keyShadow`] = `inset 0 1px 0 rgba(255,255,255,0.14), 0 0 0 1px ${mix(sh, 70)}, 0 1px 1px ${mix(sh, 30)}, 0 2px 3px ${mix(sh, 25)}`
    return v
}

const VAR_KEYS = [...COLOR_KEYS.map(([k]) => k), "rim", "glow", "edge", "plateShadow", "frameShadow", "cardShadow", "keyShadow"]
const pick = (p: string) => VAR_KEYS.map((k) => `--c-${k}: var(--${p}-${k});`).join(" ")

const CSS = `
.mslot { --c-led-off: rgb(70,66,60); position: relative; width: 100%; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
.ms-scale { width: 100%; container-type: inline-size; }
.mslot[data-theme="dark"] { ${pick("d")} }
.mslot[data-theme="light"], .mslot[data-theme="auto"] { ${pick("l")} }
@media (prefers-color-scheme: dark) { .mslot[data-theme="auto"] { ${pick("d")} } }
.mslot * { box-sizing: border-box; }
.ms-plate { --k: 1; }
@container (max-width: 400px) { .ms-plate { --k: .88; } }
@container (max-width: 330px) { .ms-plate { --k: .82; } }
.mslot p { margin: 0; }
.ms-plate { display: grid; grid-template-columns: minmax(0, 1fr); width: 100%; padding: calc(30px * var(--k)) calc(30px * var(--k)) calc(22px * var(--k)); border-radius: var(--ms-radius, 22px);
  background: radial-gradient(120% 55% at 50% 0%, var(--c-glow), transparent 70%), linear-gradient(var(--c-plateTop), var(--c-plateBottom)); box-shadow: var(--c-plateShadow); }
.ms-clip { position: relative; overflow: hidden; padding: calc(30px * var(--k)) 18px 0; margin: calc(-30px * var(--k)) -18px 0; perspective: 700px; }
.ms-card { position: relative; overflow: hidden; margin: 0 calc(2% + 11px); padding: calc(20px * var(--k)) calc(20px * var(--k)) calc(18px * var(--k)); border-radius: var(--ms-card-radius, 12px);
  background: linear-gradient(180deg, var(--c-cardTop), var(--c-cardBottom)); box-shadow: var(--c-cardShadow);
  transform-origin: 50% 100%; will-change: transform; user-select: none; -webkit-user-select: none; }
.ms-card[data-drag="true"] { cursor: grab; touch-action: none; }
.ms-card[data-grabbing="true"] { cursor: grabbing; }
.ms-card[data-sent="true"] { transform: translateY(calc(100% + 44px)); }
.ms-shade { position: absolute; left: 0; right: 0; height: 26px; pointer-events: none; opacity: 0; background: linear-gradient(rgba(0,0,0,0), rgba(0,0,0,.34)); }
.ms-kicker { font-size: calc(13px * var(--k)); line-height: 1.4; color: var(--c-kicker); }
.ms-heading { margin-top: calc(4px * var(--k)) !important; margin-bottom: calc(16px * var(--k)) !important; font-size: calc(18px * var(--k)); line-height: 1.3; letter-spacing: -0.01em; color: var(--c-heading); text-wrap: balance; white-space: pre-line; }
.ms-field { display: flex; gap: calc(8px * var(--k)); padding: 4px; border-radius: calc(var(--ms-card-radius, 12px) - 0px); background-color: var(--c-field); cursor: auto;
  box-shadow: inset 0 1px 2px rgba(0,0,0,.18), inset 0 0 0 1px rgba(0,0,0,.06), 0 1px 0 rgba(255,255,255,.9), 0 0 0 0 rgba(0,0,0,0);
  transition: box-shadow .35s cubic-bezier(.22,1,.36,1), filter .35s cubic-bezier(.22,1,.36,1); }
.ms-field:focus-within { filter: brightness(1.03); box-shadow: inset 0 1px 2px rgba(0,0,0,.14), inset 0 0 0 1px ${mix("var(--c-fieldText)", 22)}, 0 1px 0 rgba(255,255,255,.9), 0 0 0 4px ${mix("var(--c-fieldText)", 7)}; }
.ms-input { flex: 1; min-width: 0; height: calc(38px * var(--k)); padding: 0 calc(10px * var(--k)); margin: 0; border: 0; outline: none; box-shadow: none; background: transparent; border-radius: 8px;
  font-size: calc(15px * var(--k)); color: var(--c-fieldText); caret-color: var(--c-fieldText); user-select: text; -webkit-user-select: text; transition: color .3s cubic-bezier(.22,1,.36,1); -webkit-appearance: none; appearance: none; }
.ms-input::placeholder { color: var(--c-placeholder); opacity: 1; }
.ms-input:focus, .ms-input:focus-visible { outline: none; box-shadow: none; }
.ms-input[aria-invalid="true"] { color: var(--c-error); }
.ms-input:-webkit-autofill { -webkit-box-shadow: 0 0 0 40px var(--c-field) inset; -webkit-text-fill-color: var(--c-fieldText); }
.ms-key { position: relative; overflow: hidden; flex: none; height: calc(38px * var(--k)); padding: 0 calc(16px * var(--k)); margin: 0; border: 0; border-radius: 8px; cursor: pointer; white-space: nowrap;
  font-size: calc(14px * var(--k)); font-weight: 500; color: var(--c-buttonText); background: linear-gradient(var(--c-buttonTop), var(--c-buttonBottom)); box-shadow: var(--c-keyShadow);
  transition: transform .12s cubic-bezier(.22,1,.36,1), box-shadow .3s cubic-bezier(.22,1,.36,1); }
.ms-key::after { content: ""; position: absolute; inset: 0; background: linear-gradient(rgba(255,255,255,.08), rgba(255,255,255,0)); opacity: 0; transition: opacity .25s cubic-bezier(.22,1,.36,1); }
.ms-key:hover::after { opacity: 1; }
.ms-key:active { transform: translateY(1px); }
.ms-key:focus { outline: none; }
.ms-key:focus-visible { box-shadow: var(--c-keyShadow), 0 0 0 4px ${mix("var(--c-fieldText)", 16)}; }
.ms-thanks { position: absolute; inset: calc(30px * var(--k)) 18px 0; display: grid; place-content: center; gap: 8px; text-align: center; padding: 0 24px; pointer-events: none;
  opacity: 0; transform: translateY(8px); transition: opacity .5s cubic-bezier(.22,1,.36,1), transform .5s cubic-bezier(.22,1,.36,1); }
.ms-thanks[data-show="true"] { opacity: 1; transform: none; transition-delay: .2s; }
.ms-thanks-title { font-size: calc(24px * var(--k)); line-height: 1.2; letter-spacing: -0.015em; color: var(--c-thanksTitle); text-wrap: balance; }
.ms-thanks-text { max-width: calc(250px * var(--k)); margin-inline: auto !important; font-size: calc(14px * var(--k)); line-height: 1.5; color: var(--c-thanksText); text-wrap: balance; }
.ms-slot { position: relative; height: calc(64px * var(--k)); }
.ms-frame { position: absolute; left: 2%; right: 2%; top: -5px; height: calc(60px * var(--k)); padding: 5px; border-radius: calc(13px * var(--k)); background: linear-gradient(var(--c-frameTop), var(--c-frameBottom)); box-shadow: var(--c-frameShadow); }
.ms-mouth { position: relative; height: calc(calc(60px * var(--k)) - 10px); border-radius: 8px; overflow: hidden; perspective: 320px; background: var(--c-slot); box-shadow: inset 0 3px 8px rgba(0,0,0,.9), inset 0 0 0 1px rgba(0,0,0,.6); }
.ms-inside { position: absolute; inset: 0; background: linear-gradient(rgba(0,0,0,1) 0 40%, rgba(60,60,58,.35) 100%); }
.ms-flap { position: absolute; inset: 0; display: grid; place-items: center; border-radius: 8px; transform-origin: 50% 0; will-change: transform;
  background: repeating-linear-gradient(90deg, rgba(255,255,255,.025) 0 1px, transparent 1px 3px), linear-gradient(var(--c-flapTop), var(--c-flapBottom));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.22), inset 0 -2px 0 rgba(0,0,0,.18), inset 0 0 0 1px rgba(0,0,0,.25); }
.ms-engrave { font-size: calc(12px * var(--k)); font-weight: 500; letter-spacing: .1em; color: var(--c-engraving); text-shadow: 0 1px 0 var(--c-rim); white-space: nowrap; }
.ms-spec, .ms-dim { position: absolute; inset: 0; border-radius: inherit; opacity: 0; }
.ms-spec { background: linear-gradient(90deg, rgba(255,255,255,0) 8%, rgba(255,255,255,.34) 50%, rgba(255,255,255,0) 92%); }
.ms-dim { background: #000; }
.ms-foot { display: flex; align-items: center; gap: calc(12px * var(--k)); min-height: calc(40px * var(--k)); padding-left: 2px; }
.ms-led { flex: none; width: 8px; height: 8px; border-radius: 50%; background: radial-gradient(circle at 40% 35%, rgba(255,255,255,.25), rgba(0,0,0,.35) 70%), var(--c-led-off);
  box-shadow: 0 0 0 2px rgba(0,0,0,.28), 0 1px 0 2px rgba(255,255,255,.06); transition: background-color .4s cubic-bezier(.22,1,.36,1), box-shadow .4s cubic-bezier(.22,1,.36,1); }
.ms-led[data-led="on"] { background-color: var(--c-light); box-shadow: 0 0 0 2px rgba(0,0,0,.28), 0 0 10px 1px ${mix("var(--c-light)", 65)}; }
.ms-led[data-led="wait"] { animation: ms-pulse 1.1s ease-in-out infinite; }
.mslot[data-static="true"] *, .mslot[data-static="true"] *::before, .mslot[data-static="true"] *::after { animation: none !important; transition: none !important; }
@keyframes ms-pulse { 50% { background-color: var(--c-light); box-shadow: 0 0 0 2px rgba(0,0,0,.28), 0 0 10px 1px ${mix("var(--c-light)", 65)}; } }
.ms-status { min-width: 0; font-size: calc(13px * var(--k)); line-height: 1.45; color: var(--c-note); overflow-wrap: anywhere; text-wrap: balance; transition: opacity .18s cubic-bezier(.22,1,.36,1), transform .18s cubic-bezier(.22,1,.36,1); }
.ms-status[data-kind="added"] { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; overflow-wrap: normal; }
.ms-status[data-out="true"] { opacity: 0; transform: translateY(3px); }
.ms-again { flex: none; margin: 0 0 0 auto; padding: 0; border: 0; background: none; cursor: pointer; white-space: nowrap; font-size: calc(13px * var(--k)); line-height: 1.45; color: var(--c-link);
  text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 1px; text-decoration-color: ${mix("var(--c-link)", 35)};
  transition: text-decoration-color .25s cubic-bezier(.22,1,.36,1); animation: ms-rise .45s cubic-bezier(.22,1,.36,1) both; }
.ms-again:hover, .ms-again:focus-visible { text-decoration-color: var(--c-link); outline: none; }
@keyframes ms-rise { from { opacity: 0; transform: translateY(4px); } }
@container (max-width: 400px) {
  .ms-plate { padding-left: 18px; padding-right: 18px; }
  .ms-clip { padding-left: 12px; padding-right: 12px; margin-left: -12px; margin-right: -12px; }
  .ms-thanks { left: 12px; right: 12px; }
  .ms-status[data-kind="added"] { max-width: 60%; }
}
@media (prefers-reduced-motion: reduce) { .ms-led[data-led="wait"] { animation: none; background-color: var(--c-light); } .ms-thanks, .ms-status { transition: none; } }
`

// ---------- component ----------

type StatusKind = "idle" | "posting" | "empty" | "invalid" | "failed" | "added"

interface MailSlotProps {
    card?: Record<string, string>
    plate?: Record<string, string>
    messages?: Record<string, string>
    thanks?: Record<string, string>
    form?: Record<string, string>
    theme?: "dark" | "light" | "auto"
    dark?: any
    light?: any
    shape?: { radius: number; cardRadius: number }
    fonts?: Record<string, any>
    behaviour?: { drag: boolean; sound: boolean; haptics: boolean; canvas: "ready" | "sent" }
    onSuccess?: () => void
    onError?: () => void
    style?: CSSProperties
}

const DEFAULT_CONTENT = {
    kicker: "Studio letters",
    heading: "One short email a month about new components.",
    placeholder: "you@studio.com",
    button: "Send",
    fieldName: "Email",
    fieldLabel: "Email address",
    engraving: "Letters",
    note: "One email a month. Leave any time.",
    posting: "Posting…",
    thanksTitle: "It's in the post.",
    thanksText: "Watch your inbox for one short confirmation email.",
    added: "Added",
    again: "Send another",
    empty: "Add your email address first.",
    invalid: "That address is missing something. Try name@studio.com.",
    failed: "The list didn't answer. Your address is still on the card: try again.",
}
const DEFAULT_SHAPE = { radius: 22, cardRadius: 12 }
const DEFAULT_BEHAVIOUR = { drag: true, sound: true, haptics: true, canvas: "ready" as const }

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 440
 * @framerIntrinsicHeight 326
 * @framerSupportedLayoutWidth any-prefer-auto
 * @framerSupportedLayoutHeight auto
 */
export default function MailSlot(props: MailSlotProps) {
    const content = { ...DEFAULT_CONTENT, ...props.card, ...props.plate, ...props.messages, ...props.thanks, ...props.form }
    const theme = props.theme || "dark"
    const shape = { ...DEFAULT_SHAPE, ...(props.shape || {}) }
    const dark = flatColors(props.dark, DEFAULT_DARK)
    const light = flatColors(props.light, DEFAULT_LIGHT)
    const fonts = props.fonts || {}
    const be = { ...DEFAULT_BEHAVIOUR, ...(props.behaviour || {}) }
    const isStatic = useIsStaticRenderer()
    const live = !isStatic

    const rootRef = useRef<HTMLDivElement>(null)
    const scaleRef = useRef<HTMLDivElement>(null)
    const [fit, setFit] = useState<{ s: number; h: number } | null>(null)
    const cardRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const keyRef = useRef<HTMLButtonElement>(null)
    const flapRef = useRef<HTMLDivElement>(null)
    const specRef = useRef<HTMLElement>(null)
    const dimRef = useRef<HTMLElement>(null)
    const shadeRef = useRef<HTMLDivElement>(null)

    const sentOnCanvas = !live && be.canvas === "sent"
    const [status, setStatus] = useState<{ kind: StatusKind; email?: string }>({ kind: sentOnCanvas ? "added" : "idle" })
    const [shown, setShown] = useState(status)
    const [fading, setFading] = useState(false)
    const [thanks, setThanks] = useState(sentOnCanvas)
    const [again, setAgain] = useState(false)
    const [invalid, setInvalid] = useState(false)
    const [inForm, setInForm] = useState(false)

    // latest props for the engine
    const propsRef = useRef({ content, be, onSuccess: props.onSuccess, onError: props.onError })
    propsRef.current = { content, be, onSuccess: props.onSuccess, onError: props.onError }

    // status crossfade: fade the old line out, swap, fade the new one in
    useEffect(() => {
        if (status.kind === shown.kind && status.email === shown.email) return
        const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        if (reduced) {
            setShown(status)
            return
        }
        setFading(true)
        const t = window.setTimeout(() => {
            setShown(status)
            setFading(false)
        }, 180)
        return () => window.clearTimeout(t)
    }, [status])

    const engine = useRef<{ sendAnother: () => void } | null>(null)

    // Narrower than MIN_WIDTH: keep the layout, scale the whole object down
    useIsoLayoutEffect(() => {
        const o = rootRef.current,
            i = scaleRef.current
        if (!o || !i || typeof ResizeObserver === "undefined") return
        const measure = () => {
            const w = o.clientWidth
            const s = w > 0 && w < MIN_WIDTH ? w / MIN_WIDTH : 1
            const next = s < 1 ? { s, h: i.offsetHeight * s } : null
            setFit((prev) => {
                if (!prev && !next) return prev
                if (prev && next && Math.abs(prev.s - next.s) < 0.001 && Math.abs(prev.h - next.h) < 0.5) return prev
                return next
            })
        }
        const ro = new ResizeObserver(measure)
        ro.observe(o)
        ro.observe(i)
        measure()
        return () => ro.disconnect()
    }, [])

    useIsoLayoutEffect(() => {
        const input = inputRef.current
        setInForm(!!input?.form)
    }, [])

    useEffect(() => {
        if (!live) return
        const card = cardRef.current!,
            input = inputRef.current!,
            key = keyRef.current!,
            flap = flapRef.current!,
            spec = specRef.current!,
            dim = dimRef.current!,
            shade = shadeRef.current!
        if (!card || !input || !key || !flap) return
        const P = () => propsRef.current
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        let reduced = mq.matches
        const onMq = (e: MediaQueryListEvent) => (reduced = e.matches)
        mq.addEventListener?.("change", onMq)

        const y: Spring = { x: 0, v: 0 },
            x: Spring = { x: 0, v: 0 },
            rz: Spring = { x: 0, v: 0 },
            fl: Spring = { x: 0, v: 0 }
        let ty = 0,
            yk = 220,
            yc = 26
        let H = card.offsetHeight
        let dragging = false,
            busy = false,
            raf = 0,
            last = 0,
            touched = false,
            viaKeys = false,
            postedAt = 0,
            pending: { timer: number; stop: () => void } | null = null,
            alive = true
        const timers = new Set<number>()
        const later = (fn: () => void, ms: number) => {
            const t = window.setTimeout(() => {
                timers.delete(t)
                if (alive) fn()
            }, reduced ? Math.min(ms, 50) : ms)
            timers.add(t)
            return t
        }
        const fr = makeFriction()
        const ro = new ResizeObserver(() => (H = card.offsetHeight))
        ro.observe(card)

        function render() {
            const prog = clamp(y.x / H, 0, 1)
            card.style.transform = `translate3d(${x.x.toFixed(2)}px,${y.x.toFixed(2)}px,0) rotate(${rz.x.toFixed(3)}deg) rotateX(${(-11 * prog).toFixed(2)}deg)`
            shade.style.top = `${H - y.x - 26}px`
            shade.style.opacity = String(clamp(y.x / 8, 0, 1))
            const a = Math.max(0, fl.x)
            flap.style.transform = `rotateX(${(-a).toFixed(2)}deg)`
            spec.style.opacity = (Math.sin((a * Math.PI) / 90) * 0.85).toFixed(3)
            dim.style.opacity = ((a / 90) * 0.7).toFixed(3)
        }
        function tick(t: number) {
            const dt = Math.min((t - last) / 1000, 0.032)
            last = t
            let still = true
            if (!dragging) {
                still = stepSpring(y, ty, yk, yc, dt) && still
                still = stepSpring(x, 0, 260, 30, dt) && still
                still = stepSpring(rz, 0, 260, 30, dt) && still
            }
            // flap: pushed by the card's edge, rides on its face, snaps once the top edge is through
            const inSlot = y.x > 0 && y.x < H + 4
            const target = inSlot ? Math.min(72, y.x * 3.2) : 0
            still = stepSpring(fl, target, inSlot ? 900 : 1700, inSlot ? 40 : 15, dt) && still
            if (fl.x < 0) {
                const hit = -fl.v
                fl.x = 0
                fl.v = hit * 0.32
                if (hit > 60) {
                    sfx.clack(P().be.sound, clamp(hit / 900, 0.25, 1))
                    if (hit > 300) vibrate(P().be.haptics, 12)
                }
            }
            if (inSlot && !touched) {
                touched = true
                sfx.touch(P().be.sound)
            }
            if (!inSlot && y.x <= 0) touched = false
            fr.set(inSlot ? (Math.abs(y.v) / 1800) * 0.09 : 0, P().be.sound)
            render()
            if (still && !dragging) {
                raf = 0
                fr.stop()
            } else raf = requestAnimationFrame(tick)
        }
        function kick() {
            if (reduced) {
                y.x = ty
                x.x = rz.x = fl.x = 0
                render()
                return
            }
            if (!raf) {
                last = performance.now()
                raf = requestAnimationFrame(tick)
            }
        }
        function drive(target: number, k: number, c: number) {
            ty = target
            yk = k
            yc = c
            kick()
        }
        const refocus = () => {
            if (viaKeys) input.focus({ preventScroll: true })
        }

        function bounce(kind: "empty" | "invalid") {
            setInvalid(true)
            setStatus({ kind })
            drive(0, 320, 13)
            if (y.x > 6) sfx.pop(P().be.sound)
            else sfx.bounce(P().be.sound)
            if (!reduced) {
                x.v = -900
                rz.v = -40
                kick()
            }
            vibrate(P().be.haptics, [10, 40, 10])
            refocus()
        }
        function startPosting() {
            if (busy) return false
            busy = true
            setInvalid(false)
            setAgain(false)
            input.readOnly = true
            if (!viaKeys) input.blur()
            setStatus({ kind: "posting" })
            drive(H + 44, 70, 17)
            postedAt = performance.now()
            return true
        }
        function finish(ok: boolean) {
            if (pending) {
                window.clearTimeout(pending.timer)
                pending.stop()
                pending = null
            }
            // let the card finish going in before the answer shows
            const wait = Math.max(0, 1300 - (performance.now() - postedAt))
            later(() => {
                if (ok) {
                    setStatus({ kind: "added", email: input.value.trim() })
                    setThanks(true)
                    setAgain(true)
                    P().onSuccess?.()
                } else {
                    setStatus({ kind: "failed" })
                    drive(0, 300, 14)
                    sfx.pop(P().be.sound)
                    vibrate(P().be.haptics, [8, 30, 8])
                    later(() => {
                        input.readOnly = false
                        busy = false
                        refocus()
                    }, 700)
                    P().onError?.()
                }
            }, wait)
        }
        function sendAnother() {
            setAgain(false)
            setThanks(false)
            input.value = ""
            input.readOnly = false
            setStatus({ kind: "idle" })
            drive(0, 120, 20)
            later(() => {
                busy = false
                refocus()
            }, 700)
        }
        engine.current = { sendAnother }

        // ----- submitting -----
        const form = input.form
        function submit() {
            if (busy) return
            audio(P().be.sound)
            if (form) {
                // the form validates (our invalid handler bounces the card) and then posts
                if (typeof form.requestSubmit === "function") form.requestSubmit(key)
                else key.click()
                return
            }
            if (!input.checkValidity()) return
            if (startPosting()) later(() => finish(true), 900) // demo send outside a form
        }
        const onInvalid = (e: Event) => {
            e.preventDefault() // no browser bubble; the card says it
            bounce(input.value.trim() ? "invalid" : "empty")
        }
        const onFormSubmit = () => {
            if (!startPosting()) return
            pending?.stop()
            pending = {
                timer: window.setTimeout(() => finish(false), 12000),
                stop: watchFormRequest(performance.now(), (ok) => finish(ok)),
            }
        }
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                viaKeys = true
                e.preventDefault()
                e.stopPropagation() // one path for every submit: ours
                submit()
            }
        }
        const onKeyTrack = (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") viaKeys = true
        }
        const onKeyClick = (e: MouseEvent) => {
            if (!form) {
                e.preventDefault()
                submit()
            }
        }
        input.addEventListener("invalid", onInvalid)
        input.addEventListener("keydown", onKeyDown)
        const onInput = () => setInvalid(false)
        input.addEventListener("input", onInput)
        key.addEventListener("keydown", onKeyTrack)
        key.addEventListener("click", onKeyClick)
        form?.addEventListener("submit", onFormSubmit)

        // ----- drag to post -----
        let g: { sx: number; sy: number; y0: number; ly: number; lt: number; vy: number } | null = null
        const onDown = (e: PointerEvent) => {
            viaKeys = false
            if (!P().be.drag || busy || e.button > 0) return
            if ((e.target as HTMLElement).closest("input, button, a")) return
            audio(P().be.sound)
            g = { sx: e.clientX, sy: e.clientY, y0: y.x, ly: y.x, lt: performance.now(), vy: 0 }
            dragging = true
            card.setPointerCapture(e.pointerId)
            card.dataset.grabbing = "true"
            y.v = 0
            kick()
        }
        const onMove = (e: PointerEvent) => {
            if (!dragging || !g) return
            const k = card.getBoundingClientRect().width / card.offsetWidth || 1 // canvas zoom
            const dx = (e.clientX - g.sx) / k,
                dy = (e.clientY - g.sy) / k
            const raw = g.y0 + dy
            const ny = raw < 0 ? raw * 0.22 : raw * 0.92
            const now = performance.now(),
                dt = Math.max(1, now - g.lt)
            g.vy = g.vy * 0.6 + ((ny - g.ly) / dt) * 1000 * 0.4
            g.ly = ny
            g.lt = now
            y.x = ny
            y.v = g.vy
            x.x = clamp(dx * 0.12, -6, 6)
            rz.x = clamp(dx * 0.025, -2.5, 2.5)
        }
        const onUp = () => {
            if (!dragging) return
            dragging = false
            card.dataset.grabbing = "false"
            const fast = !!g && g.vy > 650
            g = null
            if (y.x > H * 0.38 || (fast && y.x > 12)) {
                drive(0, 320, 18) // springs back unless the post goes through
                submit()
            } else drive(0, 320, 18)
            kick()
        }
        const onRootDown = () => (viaKeys = false)
        const root = rootRef.current
        root?.addEventListener("pointerdown", onRootDown, true)
        card.addEventListener("pointerdown", onDown)
        card.addEventListener("pointermove", onMove)
        card.addEventListener("pointerup", onUp)
        card.addEventListener("pointercancel", onUp)
        render()

        return () => {
            alive = false
            mq.removeEventListener?.("change", onMq)
            if (raf) cancelAnimationFrame(raf)
            fr.stop()
            ro.disconnect()
            timers.forEach((t) => window.clearTimeout(t))
            if (pending) window.clearTimeout(pending.timer)
            pending?.stop()
            input.removeEventListener("invalid", onInvalid)
            input.removeEventListener("keydown", onKeyDown)
            input.removeEventListener("input", onInput)
            key.removeEventListener("keydown", onKeyTrack)
            key.removeEventListener("click", onKeyClick)
            form?.removeEventListener("submit", onFormSubmit)
            root?.removeEventListener("pointerdown", onRootDown, true)
            card.removeEventListener("pointerdown", onDown)
            card.removeEventListener("pointermove", onMove)
            card.removeEventListener("pointerup", onUp)
            card.removeEventListener("pointercancel", onUp)
            engine.current = null
        }
    }, [live])

    const statusText = (() => {
        switch (shown.kind) {
            case "posting":
                return content.posting
            case "empty":
                return content.empty
            case "invalid":
                return content.invalid
            case "failed":
                return content.failed
            case "added":
                return `${content.added} ${shown.email || content.placeholder}`
            default:
                return content.note
        }
    })()
    const led = shown.kind === "posting" ? (live ? "wait" : "on") : shown.kind === "added" ? "on" : "off"

    const vars: Record<string, string> = {
        ...themeVars("d", dark, true),
        ...themeVars("l", light, false),
        "--ms-radius": `${shape.radius}px`,
        "--ms-card-radius": `${shape.cardRadius}px`,
    }

    return (
        <div
            ref={rootRef}
            className="mslot"
            data-static={live ? undefined : "true"}
            data-theme={theme}
            style={{
                ...(vars as any),
                ...props.style,
                // Fit width: take the natural size, never wider than the container
                ...(props.style?.width === "100%" ? null : { width: NATURAL_WIDTH, maxWidth: "100%" }),
                ...(fit ? { height: fit.h } : null),
            }}
        >
            <style>{CSS}</style>
            <div
                ref={scaleRef}
                className="ms-scale"
                style={fit ? { position: "absolute", left: 0, top: 0, width: MIN_WIDTH, transform: `scale(${fit.s})`, transformOrigin: "0 0" } : undefined}
            >
            <div className="ms-plate">
                <div className="ms-clip">
                    <div className="ms-thanks" data-show={thanks ? "true" : "false"} aria-hidden="true">
                        <p className="ms-thanks-title" style={font(fonts.thanksTitle)}>
                            {content.thanksTitle}
                        </p>
                        <p className="ms-thanks-text" style={font(fonts.thanksText)}>
                            {content.thanksText}
                        </p>
                    </div>
                    <div ref={cardRef} className="ms-card" data-drag={be.drag ? "true" : "false"} data-sent={sentOnCanvas ? "true" : "false"}>
                        {content.kicker ? (
                            <p className="ms-kicker" style={font(fonts.kicker)}>
                                {content.kicker}
                            </p>
                        ) : null}
                        <p className="ms-heading" style={font(fonts.heading)}>
                            {content.heading}
                        </p>
                        <div className="ms-field">
                            <input
                                ref={inputRef}
                                className="ms-input"
                                type="email"
                                name={content.fieldName || "Email"}
                                required
                                autoComplete="email"
                                inputMode="email"
                                spellCheck={false}
                                placeholder={content.placeholder}
                                aria-label={content.fieldLabel}
                                aria-invalid={invalid ? "true" : undefined}
                                style={font(fonts.field)}
                            />
                            <button ref={keyRef} className="ms-key" type={inForm ? "submit" : "button"} style={font(fonts.button)}>
                                {content.button}
                            </button>
                        </div>
                        <div ref={shadeRef} className="ms-shade" />
                    </div>
                </div>
                <div className="ms-slot" aria-hidden="true">
                    <div className="ms-frame">
                        <div className="ms-mouth">
                            <div className="ms-inside" />
                            <div ref={flapRef} className="ms-flap">
                                <span className="ms-engrave" style={font(fonts.engraving)}>
                                    {content.engraving}
                                </span>
                                <i ref={specRef as any} className="ms-spec" />
                                <i ref={dimRef as any} className="ms-dim" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="ms-foot">
                    <span className="ms-led" data-led={led} />
                    <span className="ms-status" role="status" data-kind={shown.kind} data-out={fading ? "true" : "false"} style={font(fonts.note)}>
                        {statusText}
                    </span>
                    {again ? (
                        <button type="button" className="ms-again" style={font(fonts.note)} onClick={() => engine.current?.sendAnother()}>
                            {content.again}
                        </button>
                    ) : null}
                </div>
            </div>
            </div>
        </div>
    )
}

MailSlot.displayName = "Mail Slot"

// ---------- controls ----------

const colorTheme = (defaults: Record<string, any>, title: string, hide: string) => ({
    type: ControlType.Object,
    title,
    buttonTitle: "Colours",
    icon: "color",
    hidden: (p: any) => p.theme === hide,
    controls: {
        ...Object.fromEntries(
            COLOR_GROUPS.map(([g, gt, keys]) => [
                g,
                {
                    type: ControlType.Object,
                    title: gt,
                    controls: Object.fromEntries(keys.map(([k, t]) => [k, { type: ControlType.Color, title: t, defaultValue: defaults[k] }])),
                },
            ])
        ),
        shadow: {
            type: ControlType.Object,
            title: "Shadow",
            controls: {
                color: { type: ControlType.Color, title: "Colour", defaultValue: defaults.shadow, description: "Colours every shadow, rim and contact shade." },
                strength: { type: ControlType.Number, title: "Strength", defaultValue: defaults.strength, min: 0, max: 200, step: 5, unit: "%" },
            },
        },
    },
})

const fontControl = (title: string, d: Record<string, any>) => ({
    type: ControlType.Font,
    title,
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: d,
})

const text = (title: string, key: keyof typeof DEFAULT_CONTENT, extra: Record<string, any> = {}) => ({
    type: ControlType.String,
    title,
    defaultValue: DEFAULT_CONTENT[key],
    ...extra,
})

// built from shared helpers, so typed loosely for the control map
const controls: any = {
    // ----- Content: one group per part of the object -----
    card: {
        type: ControlType.Object,
        title: "Card",
        buttonTitle: "Text",
        controls: {
            kicker: text("Kicker", "kicker", { description: "Leave empty to hide." }),
            heading: text("Heading", "heading", { displayTextArea: true }),
            placeholder: text("Placeholder", "placeholder"),
            button: text("Button", "button"),
        },
    },
    plate: {
        type: ControlType.Object,
        title: "Plate",
        buttonTitle: "Text",
        controls: {
            engraving: text("Engraving", "engraving", { description: "The word on the flap. Leave empty for a plain flap." }),
            note: text("Note", "note", { displayTextArea: true, description: "Shown under the slot before sending." }),
        },
    },
    messages: {
        type: ControlType.Object,
        title: "Messages",
        buttonTitle: "Text",
        controls: {
            posting: text("Sending", "posting"),
            added: text("Sent", "added", { description: "Shown before the address." }),
            again: text("Send another", "again"),
            empty: text("Empty field", "empty", { displayTextArea: true }),
            invalid: text("Wrong address", "invalid", { displayTextArea: true }),
            failed: text("Not sent", "failed", { displayTextArea: true }),
        },
    },
    thanks: {
        type: ControlType.Object,
        title: "Thank you",
        buttonTitle: "Text",
        controls: {
            thanksTitle: text("Title", "thanksTitle"),
            thanksText: text("Text", "thanksText", { displayTextArea: true }),
        },
    },
    form: {
        type: ControlType.Object,
        title: "Form field",
        buttonTitle: "Settings",
        controls: {
            fieldName: text("Name", "fieldName", {
                preventLocalization: true,
                description: "Column name in your Framer form submissions. Place Mail Slot inside a Form to collect emails.",
            }),
            fieldLabel: text("Label", "fieldLabel", { description: "Read by screen readers." }),
        },
    },

    // ----- Appearance -----
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["dark", "light", "auto"],
        optionTitles: ["Dark", "Light", "Auto"],
        defaultValue: "dark",
        displaySegmentedControl: true,
        description: "Auto follows the visitor's system setting.",
    },
    dark: colorTheme(DEFAULT_DARK, "Dark", "light"),
    light: colorTheme(DEFAULT_LIGHT, "Light", "dark"),
    shape: {
        type: ControlType.Object,
        title: "Shape",
        buttonTitle: "Radius",
        controls: {
            radius: { type: ControlType.Number, title: "Plate", defaultValue: 22, min: 0, max: 48, unit: "px" },
            cardRadius: { type: ControlType.Number, title: "Card", defaultValue: 12, min: 0, max: 32, unit: "px" },
        },
    },
    fonts: {
        type: ControlType.Object,
        title: "Fonts",
        buttonTitle: "Type",
        controls: {
            heading: fontControl("Heading", { fontSize: "18px", variant: "Regular", letterSpacing: "-0.01em", lineHeight: "1.3em" }),
            kicker: fontControl("Kicker", { fontSize: "13px", variant: "Regular", letterSpacing: "0em", lineHeight: "1.4em" }),
            field: fontControl("Field", { fontSize: "15px", variant: "Regular", letterSpacing: "0em", lineHeight: "1.2em" }),
            button: fontControl("Button", { fontSize: "14px", variant: "Medium", letterSpacing: "0em", lineHeight: "1em" }),
            engraving: fontControl("Engraving", { fontSize: "12px", variant: "Medium", letterSpacing: "0.1em", lineHeight: "1em" }),
            note: fontControl("Messages", { fontSize: "13px", variant: "Regular", letterSpacing: "0em", lineHeight: "1.45em" }),
            thanksTitle: fontControl("Thank-you title", { fontSize: "24px", variant: "Regular", letterSpacing: "-0.015em", lineHeight: "1.2em" }),
            thanksText: fontControl("Thank-you text", { fontSize: "14px", variant: "Regular", letterSpacing: "0em", lineHeight: "1.5em" }),
        },
    },

    // ----- Behaviour -----
    behaviour: {
        type: ControlType.Object,
        title: "Behaviour",
        buttonTitle: "Options",
        controls: {
            drag: {
                type: ControlType.Boolean,
                title: "Drag to post",
                defaultValue: true,
                description: "Visitors can push the card into the slot. Off keeps page scroll over the card on phones.",
            },
            sound: { type: ControlType.Boolean, title: "Sound", defaultValue: true },
            haptics: { type: ControlType.Boolean, title: "Haptics", defaultValue: true, description: "Small vibrations on phones that support them." },
            canvas: {
                type: ControlType.Enum,
                title: "On canvas",
                options: ["ready", "sent"],
                optionTitles: ["Ready", "Sent"],
                defaultValue: "ready",
                displaySegmentedControl: true,
            },
        },
    },
    onSuccess: { type: ControlType.EventHandler, title: "On sent" },
    onError: { type: ControlType.EventHandler, title: "On error" },
}
addPropertyControls(MailSlot, controls)
