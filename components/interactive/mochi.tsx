// Mochi: a soft figure with two eyes that follow the pointer, blink, glance around, doze off and hop awake.
// KOJA Studios, 2026.
//
// One WebGL2 context per page draws every Mochi: each figure renders into its own part of a detached canvas and copies
// it at once into its 2D canvas (no context per figure, so a page can hold many). One frame loop and one set of passive
// window listeners serve all figures; the loop sleeps whenever nothing moves. The server, the static export, the editor
// before its first frame and devices without WebGL2 show a still picture in SVG.

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, ReactNode, RefObject } from "react"

// ------------------------------------------------------------------ visitor panel (shared building block)

// <baustein:panel Panel, Slider, Segments, Swatch, ToggleRows, Icon, ICONS, arrows, Density, Theme>
// Embedded from the KOJA panel block (harness/out/augen-figur/fuehlprobe/panel/Panel.tsx, d745bb30): Panel, Slider, Segments, Swatch, ToggleRows, Icon, ICONS, arrows, Density, Theme, clamp, DENSITIES, PANEL_W, PANEL_FONT, THEMES, SliderProps, SegmentsProps, ToggleRowSpec, World, EASE, SHEET_MS, BTN_MS, STAGGER, SHEET_UP_MS, reducedMotion, panelCount, PanelButton, PanelProps, INERT.
// Do not edit here; change the block and run scripts/bausteine/einbetten.mjs.
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/** Sizes of the panel, from roomy down to two columns; the first that fits the box is used. */
interface Density {
    field: number
    pill: number
    gap: number
    section: number
    pad: number
    action: number
    swatch: number
    columns: 1 | 2
    /** labels and values, and the title */
    text: number
    title: number
}

// All spacing on a 4 px grid: padding all round, rows within a group (gap), between groups and to title and buttons
// (section). The roomy step is the design (the Marketplace shows the preview scaled down, hence 15 px text and 40 px
// rows that still fit its 1600 x 933 view); smaller boxes take the next step that fits.
const DENSITIES: Density[] = [
    { field: 40, pill: 36, gap: 8, section: 24, pad: 24, action: 44, swatch: 32, columns: 1, text: 15, title: 17 },
    { field: 36, pill: 32, gap: 8, section: 16, pad: 24, action: 40, swatch: 28, columns: 1, text: 14, title: 16 },
    { field: 36, pill: 32, gap: 8, section: 16, pad: 20, action: 40, swatch: 28, columns: 2, text: 14, title: 16 },
    { field: 28, pill: 28, gap: 4, section: 12, pad: 16, action: 32, swatch: 24, columns: 2, text: 13, title: 15 },
]

const PANEL_W = 340

const PANEL_FONT = '"Inter", "Inter Placeholder", -apple-system, system-ui, sans-serif'

interface Theme {
    ink: string
    soft: string
    /** slider values, on the fill too: at least 4.5:1 on the filled track in every color world (Theme Auto) */
    value: string
    track: string
    fill: string
    surface: string
    edge: string
    shadow: string
    mark: string
    onMark: string
    markShadow: string
    primary: string
    onPrimary: string
}

// The panel follows the stage: light on light grounds, dark on dark ones (Theme Auto), always a little see-through.
const THEMES: Record<"light" | "dark", Theme> = {
    light: {
        ink: "#1C1C1A",
        soft: "rgba(28, 28, 26, 0.55)",
        value: "rgba(28, 28, 26, 0.72)",
        track: "rgba(28, 28, 26, 0.055)",
        fill: "rgba(28, 28, 26, 0.075)",
        surface: "rgba(255, 255, 255, 0.72)",
        edge: "rgba(255, 255, 255, 0.75)",
        shadow: "0 0 0 0.5px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04), 0 16px 48px rgba(0, 0, 0, 0.12)",
        mark: "#FFFFFF",
        onMark: "#1C1C1A",
        markShadow: "0 1px 2px rgba(0, 0, 0, 0.05), 0 3px 12px rgba(0, 0, 0, 0.05)",
        primary: "#1C1C1A",
        onPrimary: "#FFFFFF",
    },
    dark: {
        ink: "#F4F3F0",
        soft: "rgba(244, 243, 240, 0.56)",
        value: "rgba(244, 243, 240, 0.8)",
        track: "rgba(255, 255, 255, 0.06)",
        fill: "rgba(255, 255, 255, 0.09)",
        surface: "rgba(24, 24, 28, 0.6)",
        edge: "rgba(255, 255, 255, 0.1)",
        shadow: "0 0 0 0.5px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.2), 0 16px 48px rgba(0, 0, 0, 0.4)",
        mark: "#F4F3F0",
        onMark: "#141416",
        markShadow: "0 1px 2px rgba(0, 0, 0, 0.2), 0 3px 12px rgba(0, 0, 0, 0.15)",
        primary: "#F4F3F0",
        onPrimary: "#141416",
    },
}

interface SliderProps {
    z: Density
    t: Theme
    label: string
    value: number
    min: number
    max: number
    step: number
    unit?: string
    /** the value as text, when a number with unit is not enough (for example Cool 20, Off) */
    format?: (v: number) => string
    dim?: boolean
    /** where the fill starts: the minimum (default), or a value inside the range (a fill from the middle, both ways) */
    origin?: number
    /** the new value for the effect, at most once per frame while dragging */
    onChange: (v: number) => void
    /** the value once it settles (release, key press), for work too heavy for every frame */
    onCommit?: (v: number) => void
}

/**
 * A wide rounded bar: name left, value right, the fill shows the value, dragging works anywhere on it.
 * Fill and number follow the pointer at once, written straight to the page and moved by transform only (the bar
 * clips, so the fill slides instead of growing): nothing waits for the effect or for a new render. The host hears
 * the value at most once per frame (onChange) and once more when it settles (onCommit).
 */
function Slider({ z, t, label, value, min, max, step, unit = "", format, dim = false, origin, onChange, onCommit }: SliderProps) {
    const ref = useRef<HTMLDivElement>(null)
    const fillRef = useRef<HTMLDivElement>(null)
    const lowRef = useRef<HTMLDivElement>(null)
    const highRef = useRef<HTMLDivElement>(null)
    const textRef = useRef<HTMLSpanElement>(null)
    const live = useRef({ v: value, from: value, dragging: false, pending: NaN, raf: 0, x: 0, touch: false, moved: false })
    const calls = useRef({ onChange, onCommit })
    calls.current = { onChange, onCommit }
    const digits = step >= 1 ? 0 : step >= 0.1 ? 1 : 2
    const textOf = (v: number) => (format ? format(v) : `${v.toFixed(digits)}${unit}`)
    const o = origin === undefined ? 0 : clamp((origin - min) / (max - min), 0, 1)
    // the fill as transforms: one bar that slides (from the minimum), or two halves that slide out from the origin
    const shift = (v: number) => {
        const f = clamp((v - min) / (max - min), 0, 1)
        const hi = f > o && o < 1 ? (f - o) / (1 - o) : 0
        const lo = f < o && o > 0 ? (o - f) / o : 0
        return { main: `translateX(${((f - 1) * 100).toFixed(3)}%)`, high: `translateX(${((hi - 1) * 100).toFixed(3)}%)`, low: `translateX(${((1 - lo) * 100).toFixed(3)}%)` }
    }
    const paint = (v: number) => {
        const s = shift(v)
        if (fillRef.current) fillRef.current.style.transform = s.main
        if (highRef.current) highRef.current.style.transform = s.high
        if (lowRef.current) lowRef.current.style.transform = s.low
        const text = textOf(v)
        // the text node React made stays in place, only its value changes, so React and the page never disagree
        const node = textRef.current?.firstChild
        if (node) node.nodeValue = text
        const el = ref.current
        if (el) {
            el.setAttribute("aria-valuenow", String(v))
            el.setAttribute("aria-valuetext", text)
        }
    }
    const set = (v: number) => {
        if (dim) return
        const n = +clamp(Math.round(v / step) * step, min, max).toFixed(4)
        const L = live.current
        if (n === L.v) return
        L.v = n
        paint(n)
        L.pending = n
        if (!L.raf)
            L.raf = requestAnimationFrame(() => {
                L.raf = 0
                const p = L.pending
                L.pending = NaN
                if (!Number.isNaN(p)) calls.current.onChange(p)
            })
    }
    // the value settles: the last frame's value goes out at once, then the commit if anything changed
    const settle = () => {
        const L = live.current
        if (L.raf) {
            cancelAnimationFrame(L.raf)
            L.raf = 0
        }
        if (!Number.isNaN(L.pending)) {
            const p = L.pending
            L.pending = NaN
            calls.current.onChange(p)
        }
        if (L.v !== L.from) calls.current.onCommit?.(L.v)
        L.from = L.v
    }
    const end = () => {
        const L = live.current
        if (!L.dragging) return
        L.dragging = false
        ref.current?.classList.remove("gq-holding")
        settle()
    }
    // after every render the host's value is the truth when no finger or mouse holds the bar (a reset, another view):
    // a host that heard the value without rendering (quiet) may hand back the same prop as before, so compare with
    // what the bar shows, not with the last prop
    useLayoutEffect(() => {
        const L = live.current
        if (!L.dragging && L.v !== value) {
            L.v = value
            L.from = value
            paint(value)
        }
    })
    useEffect(
        () => () => {
            const L = live.current
            if (L.raf) cancelAnimationFrame(L.raf)
        },
        []
    )
    const at = (e: ReactPointerEvent) => {
        const r = ref.current?.getBoundingClientRect()
        if (r && r.width > 0) set(min + ((e.clientX - r.left) / r.width) * (max - min))
    }
    const key = (e: ReactKeyboardEvent) => {
        const big = (max - min) / 10
        const v = live.current.v
        const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? step : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -step : e.key === "PageUp" ? big : e.key === "PageDown" ? -big : 0
        if (e.key === "Home") set(min)
        else if (e.key === "End") set(max)
        else if (d) set(v + d)
        else return
        settle()
        e.preventDefault()
    }
    // while dragging, a render (if the host re-renders) shows the live value, never an older one
    const shown = live.current.dragging ? live.current.v : value
    const s0 = shift(shown)
    const zone = Math.round(z.text * (z.columns === 2 ? 3.2 : 3.8))
    const fillStyle: CSSProperties = { position: "absolute", inset: 0, background: t.fill, willChange: "transform" }
    return (
        <div
            ref={ref}
            role="slider"
            tabIndex={0}
            aria-label={label}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={shown}
            aria-valuetext={textOf(shown)}
            aria-disabled={dim || undefined}
            onKeyDown={key}
            onPointerDown={(e) => {
                // touch: only a sideways drag sets the value, a tap or a vertical swipe stays with the page
                const L = live.current
                L.x = e.clientX
                L.touch = e.pointerType === "touch"
                L.moved = false
                L.dragging = true
                L.from = L.v
                e.currentTarget.classList.add("gq-holding")
                e.currentTarget.setPointerCapture(e.pointerId)
                if (!L.touch) at(e)
            }}
            onPointerMove={(e) => {
                if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
                const L = live.current
                if (L.touch && !L.moved) {
                    if (Math.abs(e.clientX - L.x) < 6) return
                    L.moved = true
                }
                at(e)
            }}
            onPointerUp={end}
            onPointerCancel={end}
            onLostPointerCapture={end}
            className="gq-focus gq-t"
            style={{ position: "relative", height: z.field, borderRadius: 10, background: t.track, overflow: "hidden", cursor: dim ? "default" : "ew-resize", touchAction: "pan-y", userSelect: "none", opacity: dim ? 0.4 : 1 }}
        >
            {origin === undefined ? (
                // the fill runs over the whole width in proportion to the value, at the maximum also behind the number
                <div ref={fillRef} className="gq-fill gq-t" style={{ ...fillStyle, borderRadius: "10px 3px 3px 10px", transform: s0.main }} />
            ) : (
                <>
                    {/* from the origin both ways: each half clips its own sliding fill */}
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(o * 100).toFixed(3)}%`, overflow: "hidden" }}>
                        <div ref={lowRef} className="gq-fill gq-t" style={{ ...fillStyle, borderRadius: "3px 0 0 3px", transform: s0.low }} />
                    </div>
                    <div style={{ position: "absolute", left: `${(o * 100).toFixed(3)}%`, right: 0, top: 0, bottom: 0, overflow: "hidden" }}>
                        <div ref={highRef} className="gq-fill gq-t" style={{ ...fillStyle, borderRadius: "0 3px 3px 0", transform: s0.high }} />
                    </div>
                    {/* a fine mark at the origin, when it lies inside the bar */}
                    {o > 0 && o < 1 ? <div className="gq-t" style={{ position: "absolute", left: `calc(${(o * 100).toFixed(3)}% - 0.5px)`, top: 10, bottom: 10, width: 1, background: t.soft, opacity: 0.45 }} /> : null}
                </>
            )}
            <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "0 12px", fontSize: z.text }}>
                <span style={{ minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
                {/* the value keeps its column for steady numbers and grows when a word needs more: never cut */}
                <span ref={textRef} className="gq-t" style={{ minWidth: zone - 12, flex: "none", textAlign: "right", color: t.value, fontVariantNumeric: "tabular-nums", fontFeatureSettings: "'tnum' 1", whiteSpace: "nowrap" }}>
                    {textOf(shown)}
                </span>
            </div>
        </div>
    )
}

/** Arrow keys inside a radio group move the choice and the focus to the neighbour, like native radio buttons. */
function arrows(e: ReactKeyboardEvent<HTMLDivElement>) {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0
    if (!d) return
    const list = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=radio]")]
    const at = list.indexOf(document.activeElement as HTMLButtonElement)
    if (at < 0) return
    e.preventDefault()
    const next = list[(at + d + list.length) % list.length]
    next.focus()
    next.click()
}

interface SegmentsProps<T extends string | number> {
    z: Density
    t: Theme
    label: string
    value: T
    options: [T, string][]
    columns?: number
    caption?: string
    icons?: (v: T) => ReactNode
    /** compact: as wide as the words and as high as a row, for a switch beside its name (ToggleRow) */
    compact?: boolean
    /** compact and as wide as its cell, the choices sharing the width (ToggleRows) */
    fill?: boolean
    onChange: (v: T) => void
}

/** Choices in one bar; the mark glides to the chosen one. */
function Segments<T extends string | number>({ z, t, label, value, options, columns, caption, icons, compact = false, fill = false, onChange }: SegmentsProps<T>) {
    const ref = useRef<HTMLDivElement>(null)
    const markRef = useRef<HTMLDivElement>(null)
    const placed = useRef(false)
    // the mark follows the chosen button; the first placement and size changes go without a glide
    useLayoutEffect(() => {
        const box = ref.current
        const mark = markRef.current
        if (!box || !mark) return
        const place = (glide: boolean) => {
            const el = box.querySelector<HTMLElement>("[aria-checked=true]")
            if (!el) return
            mark.style.transition = glide && placed.current ? "" : "none"
            mark.style.width = `${el.offsetWidth}px`
            mark.style.height = `${el.offsetHeight}px`
            mark.style.transform = `translate(${el.offsetLeft}px, ${el.offsetTop}px)`
            mark.style.opacity = "1"
            placed.current = true
        }
        place(true)
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => place(false))
        ro.observe(box)
        return () => ro.disconnect()
    }, [value, columns, z, options.length])
    const small = compact || fill
    const pill = small ? z.field - 8 : z.pill
    const cols = fill ? `repeat(${options.length}, minmax(0, 1fr))` : compact ? `repeat(${options.length}, auto)` : `${caption ? "auto " : ""}repeat(${columns ?? options.length}, minmax(0, 1fr))`
    return (
        <div ref={ref} role="radiogroup" aria-label={label} onKeyDown={arrows} className="gq-t" style={{ position: "relative", display: compact && !fill ? "inline-grid" : "grid", gridTemplateColumns: cols, gap: 4, padding: 4, borderRadius: 10, background: t.track, flex: "none" }}>
            <div ref={markRef} className="gq-mark gq-t" style={{ position: "absolute", left: 0, top: 0, borderRadius: 6, background: t.mark, boxShadow: t.markShadow, opacity: 0, pointerEvents: "none" }} />
            {caption ? <span style={{ position: "relative", display: "flex", alignItems: "center", padding: "0 6px 0 9px", fontSize: z.text }}>{caption}</span> : null}
            {options.map(([v, name]) => {
                const on = v === value
                return (
                    <button
                        key={String(v)}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        aria-label={icons ? name : undefined}
                        tabIndex={on ? 0 : -1}
                        onClick={() => onChange(v)}
                        className="gq-focus gq-seg"
                        style={{ position: "relative", height: pill, display: "flex", alignItems: "center", justifyContent: "center", border: 0, borderRadius: 7, background: "transparent", color: on ? t.onMark : t.soft, font: "inherit", fontSize: z.text, cursor: "pointer", padding: small ? "0 8px" : 0, whiteSpace: "nowrap" }}
                    >
                        {icons ? (
                            <>
                                {icons(v)}
                                {/* the name on hover and on keyboard focus; the button already carries it for assistive tech */}
                                <span className="gq-tip" aria-hidden="true">
                                    {name}
                                </span>
                            </>
                        ) : (
                            name
                        )}
                    </button>
                )
            })}
        </div>
    )
}

interface ToggleRowSpec<T extends string | number> {
    label: string
    value: T
    options: [T, string][]
    onChange: (v: T) => void
}

/**
 * Several switches under each other: names left, switches right-aligned, all as wide as the widest one and as high as a
 * row, so their edges line up.
 */
function ToggleRows({ z, t, rows }: { z: Density; t: Theme; rows: ToggleRowSpec<string>[] }) {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", columnGap: 8, rowGap: z.gap, alignItems: "center" }}>
            {rows.map((r) => [
                <span key={`${r.label}-name`} style={{ minWidth: 0, fontSize: z.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.label}
                </span>,
                <Segments key={`${r.label}-switch`} z={z} t={t} label={r.label} value={r.value} options={r.options} fill onChange={r.onChange} />,
            ])}
        </div>
    )
}

interface World {
    name: string
    bg: string
    a: string
    b: string
}

/** A color world as a plain circle, split into its two inks; the chosen one gets a fine ring with some air. */
function Swatch({ world, on, size, t, onClick }: { world: World; on: boolean; size: number; t: Theme; onClick: () => void }) {
    return (
        <button type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1} aria-label={world.name} onClick={onClick} className="gq-focus gq-swatch" style={{ position: "relative", width: "100%", maxWidth: size, aspectRatio: "1", justifySelf: "center", padding: 0, border: 0, borderRadius: "50%", background: "transparent", cursor: "pointer" }}>
            <span className="gq-ring" style={{ position: "absolute", inset: 0, borderRadius: "50%", boxShadow: `inset 0 0 0 1.25px ${t.ink}`, opacity: on ? 1 : 0, transform: on ? "scale(1)" : "scale(0.86)" }} />
            <span className="gq-dot" style={{ position: "absolute", inset: "17%", borderRadius: "50%", background: `linear-gradient(135deg, ${world.a} 0 50%, ${world.b} 50% 100%)`, boxShadow: "inset 0 0 0 0.75px rgba(127, 127, 127, 0.35)" }} />
        </button>
    )
}

// Icons of the panel and the buttons: Lucide (lucide.dev), outline icons on a 24 grid, drawn here as paths. Shown at
// one size for all, the stroke stays 1.5 px at any size.
//
// Lucide, ISC License. Copyright (c) 2026 Lucide Icons and Contributors. Permission to use, copy, modify, and/or
// distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright
// notice and this permission notice appear in all copies. THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS
// ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO
// EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER
// RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION,
// ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
// x, chevron-left and chevron-right are derived from Feather, MIT License. Copyright (c) 2013-present Cole Bemis.
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice
// and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS
// PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
const Icon = ({ d, size }: { d: string; size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ display: "block", flex: "none" }}>
        <path d={d} fill="none" stroke="currentColor" strokeWidth={+((1.5 * 24) / size).toFixed(3)} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const ICONS = {
    close: "M18 6 6 18M6 6l12 12", // x
    back: "m15 18-6-6 6-6", // chevron-left
    next: "m9 18 6-6-6-6", // chevron-right
    sliders: "M10 5H3M12 19H3M14 3v4M16 17v4M21 12h-9M21 19h-5M21 5h-7M8 10v4M8 12H3", // sliders-horizontal
    camera: "M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4zM15 13a3 3 0 1 1-6 0 3 3 0 1 1 6 0", // camera
    play: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z", // play
    pause: "M15 3h3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM6 3h3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z", // pause
    reset: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5", // rotate-ccw
    upload: "M12 3v12M17 8l-5-5-5 5M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", // upload
    fog: "M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M16 17H7M17 21H9", // cloud-fog
}

// the open and close motion: ease out, short ways, only transform and opacity (the compositor runs them)
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"

const SHEET_MS = 300

const BTN_MS = 240

const STAGGER = 40

const SHEET_UP_MS = 380

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches

let panelCount = 0

/** An icon button: in the panel beside the main action, or in the row of the closed panel. */
interface PanelButton {
    key: string
    label: string
    icon: string
    onClick: (e: ReactMouseEvent<HTMLButtonElement>) => void
    /** a short note shown on the tooltip for a moment (for example when saving failed) */
    note?: string | null
}

interface PanelProps {
    title: ReactNode
    theme: "light" | "dark"
    side?: "right" | "left"
    start?: "open" | "closed"
    w: number
    h: number
    isStatic?: boolean
    font?: CSSProperties
    /** the views: what sits between the title and the actions; Advanced is a second view, not a longer list */
    main: (z: Density, t: Theme) => ReactNode
    advanced?: (z: Density, t: Theme) => ReactNode
    /** the wide main button and the icon buttons beside it */
    primary?: { label: string; onClick: () => void }
    tools?: PanelButton[]
    /** icon buttons of the closed panel; the button that opens the panel comes last, in the corner */
    row?: PanelButton[]
    regionLabel?: string
    /** a layer under the buttons and the card, for example a drag area on the stage */
    children?: ReactNode
    /** open or closed, with the size of the card, for a host that moves its picture into the free part */
    onOpenChange?: (open: boolean, info: { phone: boolean; inset: number; height: number; animate: boolean }) => void
    /** on phones the card may come later, when the host moves something first (ms) */
    sheetDelay?: number
    /** changes when the content changes (for example more rows): the density is measured again from the top */
    layoutKey?: string
    /** where the card sits on wide boxes: centred on the height (default) or at the top */
    align?: "center" | "top"
    /** a smaller inner padding than the density step gives (px, on the 4 px grid) */
    pad?: number
    /**
     * Wide boxes only: the card can be dragged by its top edge (grip and title row) and lands where it is dropped, never
     * past the inset. On phones it stays docked at the bottom.
     */
    movable?: boolean
    /** where a movable card starts, from the box and the card size; default: the chosen side, centred on the height */
    startAt?: (box: { w: number; h: number; cardW: number; cardH: number; inset: number }) => { x: number; y: number }
    /** where a movable card sits: after the first placement, after a drop and when the box changes */
    onPlace?: (rect: { x: number; y: number; w: number; h: number; moved: boolean }) => void
    /** a dropped card glides flush to an edge or corner it lands close to (default on) */
    snap?: boolean
    /** icon buttons in the title row, left of the close button (for example Reset) */
    headerTools?: PanelButton[]
    /**
     * changes when what lies behind the card changes (for example the color of the stage): the frosted glass is drawn
     * again while the change settles. Safari on iOS keeps the old blurred backdrop until the next touch otherwise.
     */
    backdropKey?: string
}

/**
 * The panel for visitors. On wide boxes a card on the chosen side, below 640 px a sheet at the bottom. It always fits
 * the box: the density steps down until it does. Both views lie on top of each other in one grid cell, so the card is
 * as high as the taller one and keeps its size when Advanced opens; nothing scrolls.
 */
/**
 * React 18 (Framer's runtime) renders `inert` only as a string attribute; Framer's editor checks the types of React 19,
 * where it is a boolean. The string goes out, typed as the boolean the editor expects.
 */
const INERT = { inert: "" } as unknown as { inert: boolean }

function Panel({ title, theme, side = "right", start = "open", w, h, isStatic = false, font, main, advanced, primary, tools = [], row = [], regionLabel = "Controls", children, onOpenChange, sheetDelay, layoutKey = "", align = "center", pad, movable = false, startAt, onPlace, snap = true, headerTools = [], backdropKey = "" }: PanelProps) {
    const t = THEMES[theme]
    const left = side === "left"
    const [open, setOpen] = useState(start !== "closed")
    const [view, setView] = useState<"main" | "advanced">("main")
    const [dens, setDens] = useState(0)
    const [sheetH, setSheetH] = useState(0)
    const [uid] = useState(() => `gq${++panelCount}`)
    const sheetRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const openBtnRef = useRef<HTMLButtonElement>(null)
    const rowRef = useRef<HTMLDivElement>(null)
    const closeBtnRef = useRef<HTMLButtonElement>(null)
    const lastOpen = useRef(open)
    const focusAfter = useRef<"open" | "close" | null>(null)
    const phone = w < 640
    const inset = phone ? 8 : 12
    // on phones a touch step first: rows 40 px and 12 px apart, so a finger hits safely; smaller only if it must
    const zBase = DENSITIES[phone ? Math.max(2, dens) : dens] ?? DENSITIES[DENSITIES.length - 1]
    const z: Density = phone && dens <= 2 ? { ...zBase, field: 40, pill: 36, gap: 12, section: 20, action: 44 } : zBase

    // A movable card (wide boxes): its place is a translate on a wrapper, so the card keeps its own way in and out.
    // Dragging writes the place straight to the wrapper (no render per move); the drop glides it to where it lands.
    const moves = movable && !phone && !isStatic
    const cardW = Math.min(PANEL_W, w - 2 * inset)
    const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
    const [held, setHeld] = useState(false)
    const moved = useRef(false)
    const rootRef = useRef<HTMLDivElement>(null)
    const wrapRef = useRef<HTMLDivElement>(null)
    const dragRef = useRef<{ id: number; ox: number; oy: number; left: number; top: number; x: number; y: number; vx: number; vy: number; t: number } | null>(null)
    const fits = (p: { x: number; y: number }) => {
        const cardH = Math.min(sheetH || h - 2 * inset, h - 2 * inset)
        return { x: clamp(p.x, inset, Math.max(inset, w - cardW - inset)), y: clamp(p.y, inset, Math.max(inset, h - cardH - inset)) }
    }
    // first place, and again when the box changes: where the host wants it until someone moves it, then where it was
    // dropped, pulled back inside the box
    // deps: startAt and fits are read fresh on each placement; the card is placed again only when the box changes
    useLayoutEffect(() => {
        if (!moves || !sheetH) return
        const cardH = Math.min(sheetH, h - 2 * inset)
        setPos((prev) => {
            const base = prev && moved.current ? prev : startAt ? startAt({ w, h, cardW, cardH, inset }) : { x: left ? inset : w - cardW - inset, y: align === "top" ? inset : (h - cardH) / 2 }
            const next = fits(base)
            return prev && Math.abs(prev.x - next.x) < 0.5 && Math.abs(prev.y - next.y) < 0.5 ? prev : next
        })
    }, [moves, w, h, sheetH, cardW, inset, left, align])
    // deps: onPlace is a callback the host may make anew on every render; it is told only when the place changes
    useEffect(() => {
        if (moves && pos) onPlace?.({ x: pos.x, y: pos.y, w: cardW, h: Math.min(sheetH, h - 2 * inset), moved: moved.current })
    }, [moves, pos, cardW, sheetH, h, inset])
    // Safari on iOS keeps the blurred backdrop of a card until the next touch when only the color behind it changes:
    // while a change of theme or backdrop settles, the glass is nudged every frame, so it is drawn again
    const glassKey = `${theme}|${backdropKey}`
    const lastGlass = useRef(glassKey)
    useEffect(() => {
        if (lastGlass.current === glassKey) return
        lastGlass.current = glassKey
        // the editor canvas draws once per change and needs no nudge (the Safari bug is on phones)
        if (isStatic) return
        const els = [sheetRef.current, ...(rowRef.current ? ([...rowRef.current.querySelectorAll("button")] as HTMLElement[]) : [])].filter(Boolean) as HTMLElement[]
        const t0 = performance.now()
        let raf = 0
        let odd = false
        const nudge = (t: number) => {
            odd = !odd
            const f = t - t0 < 700 ? `blur(28px) saturate(${odd ? 1.5 : 1.501})` : "blur(28px) saturate(1.5)"
            els.forEach((el) => {
                el.style.backdropFilter = f
                el.style.setProperty("-webkit-backdrop-filter", f)
            })
            if (t - t0 < 700) raf = requestAnimationFrame(nudge)
        }
        raf = requestAnimationFrame(nudge)
        return () => cancelAnimationFrame(raf)
    }, [glassKey, isStatic])
    const grab = (e: ReactPointerEvent<HTMLElement>) => {
        if (!moves || !pos || e.button !== 0) return
        if ((e.target as HTMLElement).closest("button, input, [role=slider]")) return
        const root = rootRef.current
        const wrap = wrapRef.current
        if (!root || !wrap) return
        e.preventDefault()
        const r = root.getBoundingClientRect()
        e.currentTarget.setPointerCapture(e.pointerId)
        dragRef.current = { id: e.pointerId, ox: e.clientX - r.left - pos.x, oy: e.clientY - r.top - pos.y, left: r.left, top: r.top, x: pos.x, y: pos.y, vx: 0, vy: 0, t: performance.now() }
        wrap.style.transition = "none"
        setHeld(true)
    }
    const drag = (e: ReactPointerEvent<HTMLElement>) => {
        const d = dragRef.current
        const wrap = wrapRef.current
        if (!d || !wrap || e.pointerId !== d.id) return
        const now = performance.now()
        const dt = Math.max(1, now - d.t)
        const p = fits({ x: e.clientX - d.left - d.ox, y: e.clientY - d.top - d.oy })
        // speed of the hand, smoothed, for a throw on release
        d.vx = 0.7 * d.vx + 0.3 * (((p.x - d.x) / dt) * 1000)
        d.vy = 0.7 * d.vy + 0.3 * (((p.y - d.y) / dt) * 1000)
        d.x = p.x
        d.y = p.y
        d.t = now
        wrap.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`
    }
    const drop = (e: ReactPointerEvent<HTMLElement>) => {
        const d = dragRef.current
        const wrap = wrapRef.current
        if (!d || !wrap || e.pointerId !== d.id) return
        dragRef.current = null
        setHeld(false)
        let x = d.x
        let y = d.y
        // a throw carries on a little; a hand that stopped before letting go throws nothing
        const fresh = performance.now() - d.t < 80
        if (fresh && Math.hypot(d.vx, d.vy) > 500) {
            x += d.vx * 0.12
            y += d.vy * 0.12
        }
        let p = fits({ x, y })
        if (snap) {
            // close to an edge: flush to it (two edges make a corner)
            const reach = 56
            const maxX = Math.max(inset, w - cardW - inset)
            const maxY = Math.max(inset, h - Math.min(sheetH, h - 2 * inset) - inset)
            p = { x: p.x - inset < reach ? inset : maxX - p.x < reach ? maxX : p.x, y: p.y - inset < reach ? inset : maxY - p.y < reach ? maxY : p.y }
        }
        wrap.style.transition = reducedMotion() ? "none" : `transform 420ms ${EASE}`
        wrap.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`
        moved.current = true
        setPos(p)
    }
    const dragProps = moves ? { onPointerDown: grab, onPointerMove: drag, onPointerUp: drop, onPointerCancel: drop } : {}

    // start state follows the setting
    useEffect(() => {
        setOpen(start !== "closed")
    }, [start])
    // a new box size measures the density again from the top
    useLayoutEffect(() => {
        setDens(0)
    }, [w, h, layoutKey])
    // the panel fits the box: step down the density until both views fit (they share one cell, the taller one counts)
    useLayoutEffect(() => {
        const content = contentRef.current
        if (!content) return
        const room = phone ? h - 2 * inset - 160 : h - 2 * inset
        if (content.scrollHeight > room + 1 && dens < DENSITIES.length - 1) setDens((d) => d + 1)
        else if (Math.abs(content.offsetHeight - sheetH) >= 1) setSheetH(content.offsetHeight)
    }, [dens, w, h, phone, inset, sheetH, layoutKey])

    // Open and close, one after the other and never both at once: closing, the card fades out on a short way (300 ms);
    // when it is gone, the buttons come in from above one by one (40 ms apart, from the corner), a short way with a fade
    // and a touch of scale. Opening, the buttons leave the other way round, then the card comes. CSS transitions on
    // transform and opacity only, with delays for the order: they run on the compositor. Reduced motion: the same
    // order, fades only. The first paint and a still render set the state at once. Visibility follows at the end of a
    // fade out, so nothing hidden takes a click or the keyboard focus.
    useLayoutEffect(() => {
        const sheet = sheetRef.current
        if (!sheet) return
        const still = reducedMotion()
        const animate = lastOpen.current !== open && !isStatic
        lastOpen.current = open
        const items = rowRef.current ? ([...rowRef.current.children] as HTMLElement[]) : []
        // the settings button is the last one in the row and sits in the corner: it comes first
        const fromCorner = [...items].reverse()
        const n = fromCorner.length
        const rowTime = n ? (n - 1) * STAGGER + BTN_MS : 0
        const colors = "background-color 320ms ease, box-shadow 320ms ease, color 320ms ease"
        const tr = (ms: number, delay: number, hiding: boolean) => (animate ? `opacity ${ms}ms ${EASE} ${delay}ms, transform ${ms}ms ${EASE} ${delay}ms, visibility 0s linear ${hiding ? delay + ms : delay}ms, ${colors}` : colors)
        // on phones the sheet slides in from below the box edge
        const cardAway = still ? "" : phone ? `translateY(calc(100% + ${inset}px))` : `translateX(${left ? -16 : 16}px)`
        const sheetMs = phone && !still ? SHEET_UP_MS : SHEET_MS
        const sheetAt = sheetDelay !== undefined && phone && !still ? sheetDelay : rowTime
        const buttonAway = still ? "" : "translateY(-10px) scale(0.96)"
        const set = (el: HTMLElement, shown: boolean, transition: string, away: string) => {
            el.style.transition = transition
            el.style.opacity = shown ? "1" : "0"
            el.style.transform = shown ? "" : away
            el.style.visibility = shown ? "visible" : "hidden"
        }
        if (open) {
            fromCorner.forEach((el, i) => set(el, false, tr(BTN_MS, (n - 1 - i) * STAGGER, true), buttonAway))
            set(sheet, true, tr(sheetMs, sheetAt, false), cardAway)
        } else {
            set(sheet, false, tr(sheetMs, 0, true), cardAway)
            fromCorner.forEach((el, i) => set(el, true, tr(BTN_MS, sheetMs + i * STAGGER, false), buttonAway))
        }
        // the focus moves along at the end, only when the keyboard opened or closed the panel
        const timer = window.setTimeout(
            () => {
                if (focusAfter.current === "open") closeBtnRef.current?.focus()
                if (focusAfter.current === "close") openBtnRef.current?.focus()
                focusAfter.current = null
            },
            animate ? (open ? sheetAt + sheetMs : sheetMs + rowTime) : 0
        )
        return () => window.clearTimeout(timer)
    }, [open, left, phone, inset, isStatic, row.length, sheetDelay])
    useEffect(() => {
        onOpenChange?.(open, { phone, inset, height: sheetH, animate: !isStatic })
    }, [open, phone, inset, sheetH, isStatic, onOpenChange])

    // the focus moves along only when the keyboard opened or closed the panel (a click keeps it where it was)
    const close = (keyboard: boolean) => {
        focusAfter.current = keyboard ? "close" : null
        setOpen(false)
    }
    const show = (keyboard: boolean) => {
        focusAfter.current = keyboard ? "open" : null
        setView("main")
        setOpen(true)
    }

    // icons: one size for all, from the text size of the density step
    const ic = z.text + 5
    const header = (head: ReactNode, active: boolean) => (
        <div {...dragProps} className={moves ? "gq-grip" : undefined} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: z.pill, marginBottom: z.section, flex: "none" }}>
            {head}
            <div style={{ display: "flex", alignItems: "center", gap: 4, flex: "none" }}>
            {headerTools.map((b) => (
                <button key={b.key} type="button" tabIndex={0} aria-label={b.label} onClick={b.onClick} className={`gq-focus gq-tipped gq-btn${b.note ? " gq-say" : ""}`} style={{ position: "relative", width: z.pill, height: z.pill, display: "flex", alignItems: "center", justifyContent: "center", flex: "none", padding: 0, border: 0, borderRadius: 8, background: "transparent", color: t.ink, cursor: "pointer" }}>
                    <Icon d={b.icon} size={ic - 2} />
                    <span className="gq-tip gq-below gq-end" aria-hidden="true">
                        {b.note || b.label}
                    </span>
                </button>
            ))}
            <button ref={active ? closeBtnRef : undefined} type="button" tabIndex={0} aria-label="Hide controls" onClick={(e) => close(e.detail === 0)} className="gq-focus gq-btn" style={{ position: "relative", width: z.pill, height: z.pill, display: "flex", alignItems: "center", justifyContent: "center", flex: "none", padding: 0, marginRight: -6, border: 0, borderRadius: 8, background: "transparent", color: t.ink, cursor: "pointer" }}>
                <Icon d={ICONS.close} size={ic} />
            </button>
            </div>
        </div>
    )
    // An icon button with its name as tooltip, one size and one corner for the panel and the row of the closed panel. In
    // the panel it sits on the track like the fields; in the row each one carries the panel's surface, edge and shadow.
    const iconButton = (b: PanelButton, inRow: boolean, ref?: RefObject<HTMLButtonElement>) => {
        const button = (
            <button ref={ref} key={b.key} type="button" tabIndex={0} aria-label={b.label} onClick={b.onClick} className={`gq-focus gq-tipped gq-btn${b.note ? " gq-say" : ""}`} style={{ position: "relative", width: z.action, height: z.action, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, border: 0, borderRadius: 10, background: inRow ? t.surface : t.track, color: t.ink, cursor: "pointer", ...(inRow ? { boxShadow: `inset 0 0 0 0.5px ${t.edge}, ${t.shadow}`, backdropFilter: "blur(28px) saturate(1.5)", WebkitBackdropFilter: "blur(28px) saturate(1.5)" } : {}) }}>
                <Icon d={b.icon} size={ic} />
                <span className={`gq-tip${inRow ? (left ? " gq-below gq-start" : " gq-below gq-end") : ""}`} aria-hidden="true">
                    {b.note || b.label}
                </span>
            </button>
        )
        // in the row, a wrapper carries the way in and out, the button itself keeps its own press feedback
        return inRow ? (
            <div key={b.key} className="gq-anim" style={{ pointerEvents: "auto", willChange: "transform, opacity" }}>
                {button}
            </div>
        ) : (
            button
        )
    }
    const actions = !primary && !tools.length ? null : (
        <div style={{ display: "flex", gap: 8, marginTop: z.section, flex: "none" }}>
            {primary ? (
                <button type="button" tabIndex={0} onClick={primary.onClick} className="gq-focus gq-btn gq-wide" style={{ position: "relative", flex: 1, minWidth: 0, height: z.action, border: 0, borderRadius: 10, background: t.primary, color: t.onPrimary, font: "inherit", fontSize: z.text, fontWeight: 500, cursor: "pointer" }}>
                    {primary.label}
                </button>
            ) : null}
            {tools.map((b) => iconButton(b, false))}
        </div>
    )
    const titleNode = <div style={{ fontSize: z.title, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
    const mainView = (
        <>
            {header(titleNode, view === "main")}
            {main(z, t)}
            {advanced ? (
                <button type="button" tabIndex={0} onClick={() => setView("advanced")} className="gq-focus gq-btn gq-wide" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", width: "calc(100% + 24px)", height: z.field, margin: `${z.section}px -12px 0`, padding: "0 12px", border: 0, borderRadius: 10, background: "transparent", color: t.ink, font: "inherit", fontSize: z.text, cursor: "pointer", flex: "none" }}>
                    <span>Advanced</span>
                    <Icon d={ICONS.next} size={ic} />
                </button>
            ) : null}
            <div style={{ flex: 1 }} />
            {actions}
        </>
    )
    const advancedView = advanced ? (
        <>
            {header(
                <button type="button" tabIndex={0} onClick={() => setView("main")} className="gq-focus gq-btn" style={{ position: "relative", display: "flex", alignItems: "center", gap: 4, height: z.pill, margin: "0 0 0 -8px", padding: "0 8px", border: 0, borderRadius: 8, background: "transparent", color: t.ink, font: "inherit", fontSize: z.title, fontWeight: 600, cursor: "pointer" }}>
                    <Icon d={ICONS.back} size={ic} />
                    <span>Advanced</span>
                </button>,
                view === "advanced"
            )}
            {advanced(z, t)}
            <div style={{ flex: 1 }} />
            {actions}
        </>
    ) : null

    const css = [
        `.${uid} .gq-focus:focus{outline:none}`,
        // the ring shows after keys only: a pointer on a focused control hides it until the next key (FP-10)
        `.${uid} .gq-focus:focus-visible:not([data-pointer]){outline:2px solid ${t.ink};outline-offset:2px}`,
        // a file field hidden for the eye only; its tile carries the ring and the tooltip
        `.${uid} .gq-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}`,
        `.${uid} .gq-file:has(.gq-sr:focus-visible:not([data-pointer])){outline:2px solid ${t.ink};outline-offset:2px}`,
        // the same place as the tooltip of a focused button had before (Update Condensation v1.0.2: no visible change)
        `.${uid} .gq-file:has(.gq-sr:focus-visible:not([data-pointer])) .gq-tip{opacity:1;transform:translate(-50%,0)}`,
        `@media (hover:hover){.${uid} .gq-swatch:hover .gq-dot,.${uid} .gq-thumb:hover .gq-pic{transform:scale(1.07)}}`,
        `.${uid} .gq-mark{transition:transform 300ms cubic-bezier(.3,.7,0,1),width 300ms cubic-bezier(.3,.7,0,1),height 300ms cubic-bezier(.3,.7,0,1),background-color 320ms ease,box-shadow 320ms ease}`,
        `.${uid} .gq-seg{transition:color 220ms ease}`,
        `.${uid} .gq-tip{position:absolute;left:50%;bottom:calc(100% + 8px);transform:translate(-50%,4px);padding:4px 8px;border-radius:6px;background:${t.primary};color:${t.onPrimary};font-size:${z.text - 2}px;line-height:1.2;white-space:nowrap;opacity:0;pointer-events:none;z-index:2;transition:opacity 160ms ease,transform 160ms ease}`,
        `.${uid} .gq-below{bottom:auto;top:calc(100% + 8px);transform:translate(-50%,-4px)}.${uid} .gq-below.gq-end{left:auto;right:0;transform:translate(0,-4px)}.${uid} .gq-below.gq-start{left:0;transform:translate(0,-4px)}`,
        // a tooltip at the end of a row grows to the left, so it stays inside the card
        `.${uid} .gq-end-tip{left:auto;right:0;transform:translate(0,4px)}`,
        `@media (hover:hover){.${uid} .gq-tipped:hover .gq-below.gq-end,.${uid} .gq-tipped:hover .gq-below.gq-start,.${uid} .gq-tipped:hover .gq-end-tip{transform:none}}.${uid} .gq-tipped:focus-visible:not([data-pointer]) .gq-below.gq-end,.${uid} .gq-tipped:focus-visible:not([data-pointer]) .gq-below.gq-start,.${uid} .gq-tipped:focus-visible:not([data-pointer]) .gq-end-tip{transform:none}`,
        // a note stays on its button's tooltip for a moment
        `.${uid} .gq-say .gq-tip{opacity:1;transform:translate(-50%,0)}.${uid} .gq-say .gq-below.gq-end,.${uid} .gq-say .gq-below.gq-start{transform:none}`,
        `@media (hover:hover){.${uid} .gq-seg:hover .gq-tip,.${uid} .gq-tipped:hover .gq-tip{opacity:1;transform:translate(-50%,0)}}.${uid} .gq-seg:focus-visible:not([data-pointer]) .gq-tip,.${uid} .gq-tipped:focus-visible:not([data-pointer]) .gq-tip{opacity:1;transform:translate(-50%,0)}`,
        `.${uid} .gq-t{transition:background-color 320ms ease,color 320ms ease}`,
        `.${uid} .gq-fill{transition:transform 160ms cubic-bezier(.2,.8,.2,1),background-color 320ms ease}`,
        // while dragging the fill sits under the pointer at once; the glide stays for keys and resets
        `.${uid} .gq-holding .gq-fill{transition:background-color 320ms ease}`,
        `.${uid} .gq-ring{transition:opacity 240ms ease,transform 240ms cubic-bezier(.3,.7,0,1),box-shadow 320ms ease}`,
        `.${uid} .gq-dot,.${uid} .gq-pic{transition:transform 220ms cubic-bezier(.3,.7,0,1)}`,
        `.${uid} .gq-sheet{transition:background-color 320ms ease,box-shadow 320ms ease,color 320ms ease}`,
        `@keyframes ${uid}-in{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:none}}`,
        `.${uid} .gq-view{animation:${uid}-in 260ms cubic-bezier(.2,.8,.2,1)}`,
        // no scrollbar, ever: the density steps keep the content inside; on the tiniest boxes it still scrolls by touch
        `.${uid} .gq-scroll{scrollbar-width:none}.${uid} .gq-scroll::-webkit-scrollbar{display:none}`,
        // buttons: a quick, quiet answer to hover and press (a light veil, a slight press), no bounce
        `.${uid} .gq-btn{transition:transform 120ms ${EASE},background-color 320ms ease,box-shadow 320ms ease,color 320ms ease}`,
        `.${uid} .gq-btn::after{content:"";position:absolute;inset:0;border-radius:inherit;background:currentColor;opacity:0;pointer-events:none;transition:opacity 120ms ease-out}`,
        `@media (hover:hover){.${uid} .gq-btn:hover::after{opacity:.07}}.${uid} .gq-btn:active::after{opacity:.12}`,
        `.${uid} .gq-btn:active{transform:scale(0.96)}.${uid} .gq-wide:active{transform:scale(0.99)}`,
        // reduced motion: no transitions, except the fades of card and buttons (set on them directly)
        `@media (prefers-reduced-motion:reduce){.${uid} .gq-view{animation:none!important}.${uid} *:not(.gq-anim){transition:none!important}.${uid} .gq-btn:active{transform:none}}`,
        // a movable card: the top edge and the title row are the handle; a small bar on top shows it
        `.${uid} .gq-grip{cursor:grab;touch-action:none}.${uid} .gq-grip button{cursor:pointer}`,
        `.${uid} .gq-bar{opacity:.18;transition:opacity 200ms ease,transform 200ms ${EASE}}`,
        `@media (hover:hover){.${uid} .gq-sheet:hover .gq-bar{opacity:.3}.${uid} .gq-sheet:has(.gq-grip:hover) .gq-bar{opacity:.5}}`,
        `.${uid} .gq-held .gq-bar{opacity:.55!important;transform:scaleX(1.15)}`,
        // the grabbing cursor while the card is held: on the panel only (the grip holds the pointer, so it stays)
        moves ? `.${uid}.gq-grabbing,.${uid}.gq-grabbing *{cursor:grabbing!important;user-select:none!important;-webkit-user-select:none!important}` : "",
    ].join("")

    const sideStyle: CSSProperties = left ? { left: inset } : { right: inset }
    // a floating card: its height comes from the views, centred on the height of the box and never past the inset (on
    // phones docked at the bottom)
    const room = h - 2 * inset
    const top = align === "top" ? inset : Math.max(inset, Math.round((h - Math.min(sheetH || room, room)) / 2))
    const sheetStyle: CSSProperties = phone ? { left: inset, right: inset, bottom: inset, maxHeight: room } : moves ? { position: "relative", width: "100%", maxHeight: room } : { ...sideStyle, top, width: Math.min(PANEL_W, w - 2 * inset), maxHeight: room }
    // lifted while held, like a window that is picked up
    const lift = held ? `, 0 10px 24px rgba(0, 0, 0, ${theme === "dark" ? 0.3 : 0.07}), 0 32px 80px rgba(0, 0, 0, ${theme === "dark" ? 0.45 : 0.14})` : ""
    const fontFamily = font && typeof font.fontFamily === "string" && font.fontFamily ? font.fontFamily : PANEL_FONT
    const views: ["main" | "advanced", ReactNode][] = advancedView ? [["main", mainView], ["advanced", advancedView]] : [["main", mainView]]
    return (
        <div
            ref={rootRef}
            className={held ? `${uid} gq-grabbing` : uid}
            // a mouse click or drag never leaves focus (or a focus ring) on a button or slider; the keyboard reaches every one
            onMouseDown={(e) => {
                if ((e.target as HTMLElement).closest("button, [role=slider]")) e.preventDefault()
            }}
            // a control that already has the keyboard focus hides its ring while a pointer uses it, until the next key
            onPointerDown={(e) => {
                const target = e.target as HTMLElement
                const el = target.closest(".gq-focus") ?? target.closest(".gq-file")?.querySelector(".gq-focus")
                if (el && !el.hasAttribute("data-pointer")) el.setAttribute("data-pointer", "")
            }}
            onKeyDown={(e) => (e.target as HTMLElement).removeAttribute("data-pointer")}
            onFocus={(e) => (e.target as HTMLElement).removeAttribute("data-pointer")}
            style={{ position: "absolute", inset: 0, color: t.ink, fontFamily, fontWeight: 400, lineHeight: 1.2, pointerEvents: "none" }}
        >
            <style>{css}</style>
            {children}
            <div ref={rowRef} style={{ position: "absolute", zIndex: 2, top: inset + 4, ...(left ? { left: inset + 4, flexDirection: "row-reverse" } : { right: inset + 4 }), display: "flex", gap: 8, pointerEvents: "none" }}>
                {row.map((b) => iconButton(b, true))}
                {iconButton({ key: "open", label: "Show controls", icon: ICONS.sliders, onClick: (e) => show(e.detail === 0) }, true, openBtnRef)}
            </div>
            {moves ? (
                <div ref={wrapRef} className={held ? "gq-held" : undefined} style={{ position: "absolute", zIndex: 1, left: 0, top: 0, width: cardW, transform: pos ? `translate3d(${pos.x}px, ${pos.y}px, 0)` : undefined, opacity: pos ? 1 : 0, pointerEvents: "none", willChange: "transform" }}>
                <div
                    ref={sheetRef}
                    role="region"
                    aria-label={regionLabel}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") close(true)
                    }}
                    className="gq-sheet gq-anim"
                    style={{ position: "absolute", zIndex: 1, ...sheetStyle, display: "flex", flexDirection: "column", borderRadius: phone ? 16 : 18, background: t.surface, boxShadow: `inset 0 0 0 0.5px ${t.edge}, ${t.shadow}${lift}`, backdropFilter: "blur(28px) saturate(1.5)", WebkitBackdropFilter: "blur(28px) saturate(1.5)", color: t.ink, pointerEvents: "auto", overflow: "hidden", willChange: "transform, opacity" }}
                >
                    {/* both views in one cell: the card takes the height of the taller one, the other waits hidden. The active view
                        inherits the card's visibility (never "visible" of its own, or a hidden card would still take clicks). The hidden
                        view is inert, which also takes it out of the accessibility tree; no aria-hidden above buttons (FP-3). */}
                    {moves ? (
                        // the handle: the top strip of the card with a small bar, beside the title row
                        <div {...dragProps} className="gq-grip gq-handle" aria-hidden="true" style={{ position: "absolute", zIndex: 1, left: 0, right: 0, top: 0, height: Math.max(12, (pad === undefined ? z.pad : Math.min(z.pad, pad)) - 2), display: "flex", justifyContent: "center", paddingTop: 8, boxSizing: "border-box" }}>
                            <span className="gq-bar" style={{ width: 36, height: 4, borderRadius: 2, background: t.ink }} />
                        </div>
                    ) : null}
                    <div ref={contentRef} className="gq-scroll" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", flex: "none", maxHeight: room, padding: pad === undefined ? z.pad : Math.min(z.pad, pad), boxSizing: "border-box", overflowY: "auto", overscrollBehavior: "contain" }}>
                        {views.map(([v, node]) => {
                            const on = v === view
                            return (
                                <div key={on ? `${v}-on` : v} className={on ? "gq-view" : undefined} {...(on ? {} : INERT)} style={{ gridArea: "1 / 1", display: "flex", flexDirection: "column", minWidth: 0, visibility: on ? undefined : "hidden" }}>
                                    {node}
                                </div>
                            )
                        })}
                    </div>
                </div>
                </div>
            ) : (
            <div
                ref={sheetRef}
                role="region"
                aria-label={regionLabel}
                onKeyDown={(e) => {
                    if (e.key === "Escape") close(true)
                }}
                className="gq-sheet gq-anim"
                style={{ position: "absolute", zIndex: 1, ...sheetStyle, display: "flex", flexDirection: "column", borderRadius: phone ? 16 : 18, background: t.surface, boxShadow: `inset 0 0 0 0.5px ${t.edge}, ${t.shadow}`, backdropFilter: "blur(28px) saturate(1.5)", WebkitBackdropFilter: "blur(28px) saturate(1.5)", color: t.ink, pointerEvents: "auto", overflow: "hidden", willChange: "transform, opacity" }}
            >
                {/* both views in one cell: the card takes the height of the taller one, the other waits hidden. The active view
                    inherits the card's visibility (never "visible" of its own, or a hidden card would still take clicks). The hidden
                    view is inert, which also takes it out of the accessibility tree; no aria-hidden above buttons (FP-3). */}
                <div ref={contentRef} className="gq-scroll" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", flex: "none", maxHeight: room, padding: pad === undefined ? z.pad : Math.min(z.pad, pad), boxSizing: "border-box", overflowY: "auto", overscrollBehavior: "contain" }}>
                    {views.map(([v, node]) => {
                        const on = v === view
                        return (
                            <div key={on ? `${v}-on` : v} className={on ? "gq-view" : undefined} {...(on ? {} : INERT)} style={{ gridArea: "1 / 1", display: "flex", flexDirection: "column", minWidth: 0, visibility: on ? undefined : "hidden" }}>
                                {node}
                            </div>
                        )
                    })}
                </div>
            </div>
            )}
        </div>
    )
}
// </baustein:panel>

// ------------------------------------------------------------------ figure: shapes, eyes, materials

type Shape = "cube" | "pill" | "hex" | "sphere"
type EyeStyle = "capsule" | "dot" | "square" | "slant"
type Material = "matte" | "satin" | "gloss"
type RGB = [number, number, number]

/** What the engine draws and how it moves; colors in sRGB 0 to 1. */
interface FigOptions {
    fill: RGB
    eyeColor: RGB | null
    shape: Shape
    eyes: EyeStyle
    material: Material
    follow: number
    bounce: number
    range: number
    blink: boolean
    glances: boolean
    sleep: number
    tap: boolean
    scroll: boolean
    shadow: boolean
    scale: number
}

const SHAPES: Shape[] = ["cube", "pill", "hex", "sphere"]
// per shape: K (roundness of the front, 2 is a sphere), Z (depth), bottom edge, half width, the face ellipsoid
const SHAPE_P: Record<Shape, { k: number; z: number; bottom: number; half: number; face: [number, number] }> = {
    cube: { k: 3.2, z: 0.62, bottom: 0.92, half: 0.92, face: [0.98, 0.98] },
    pill: { k: 2.5, z: 0.5, bottom: 0.64, half: 1.02, face: [1.06, 0.7] },
    hex: { k: 3.4, z: 0.6, bottom: 0.98, half: 0.9, face: [0.94, 0.98] },
    sphere: { k: 2.0, z: 1.0, bottom: 1.0, half: 1.0, face: [1.0, 1.0] },
}
// eyes in body units (the figure is 2 units wide): half width, half height, corner, tilt
const EYE_P: Record<EyeStyle, [number, number, number, number]> = {
    capsule: [0.07, 0.165, 0.07, 0],
    dot: [0.1, 0.1, 0.1, 0],
    square: [0.1, 0.1, 0.034, 0],
    slant: [0.072, 0.15, 0.072, 0.3],
}
const MATERIALS: Material[] = ["matte", "satin", "gloss"]
// the figure box in figure sizes; the middle of the figure sits BOX_C below the top of the box (shadow, lean and hop
// need this room, measured; the wide shadow fades out in the outer 8 %)
const BOX_W = 1.6
const BOX_H = 1.35
const BOX_C = 0.68

const VERT = `#version 300 es
in vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }`

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform vec2 uCenter;
uniform float uScale;
uniform int uA;
uniform int uB;
uniform float uM;
uniform float uK;
uniform float uZ;
uniform vec2 uTurn;
uniform vec2 uFace;
uniform vec2 uLean;
uniform float uRoll;
uniform vec2 uSquash;
uniform float uPivot;
uniform float uLift;
uniform vec3 uEye[6];
uniform vec4 uEyeShape;
uniform float uBlink;
uniform float uHappy;
uniform vec3 uBase;
uniform vec3 uEyeCol;
uniform float uDark;
uniform vec4 uMat;
uniform vec2 uMat2;
uniform vec4 uShadow;
uniform vec2 uShadowAmt;
uniform float uFade;
out vec4 o;

// rounded box distance after Inigo Quilez, iquilezles.org/articles/distfunctions2d
float sdRoundBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float sdArc(vec2 q, float ra, float th) {
    if (q.y >= 0.0) return abs(length(q) - ra) - th;
    return length(vec2(abs(q.x) - ra, q.y)) - th;
}
// shape fields: 1 at the edge, 0 in the middle, smooth everywhere (superellipses), so the light shows no creases
float fieldOf(int k, vec2 p) {
    if (k == 0) {
        vec2 a = abs(p) / 0.92;
        return pow(pow(a.x, 4.2) + pow(a.y, 4.2), 1.0 / 4.2);
    }
    if (k == 1) {
        vec2 a = abs(p) / vec2(1.02, 0.64);
        return pow(pow(a.x, 3.0) + pow(a.y, 3.0), 1.0 / 3.0);
    }
    if (k == 2) {
        float s = pow(abs(p.x) / 0.9, 13.0);
        s += pow(abs(dot(p, vec2(0.5, 0.8660254))) / 0.9, 13.0);
        s += pow(abs(dot(p, vec2(-0.5, 0.8660254))) / 0.9, 13.0);
        return pow(s, 1.0 / 13.0);
    }
    return length(p);
}
float fieldBody(vec2 p) { return mix(fieldOf(uA, p), fieldOf(uB, p), uM); }

float eyeSd(vec2 uv, float side, out vec2 local, out vec2 hs) {
    float a = uEyeShape.w * side * (1.0 - uHappy);
    float c = cos(a), s = sin(a);
    vec2 r0 = mat2(c, s, -s, c) * uv;
    hs = uEyeShape.xy;
    hs.y = max(hs.y * (1.0 - 0.9 * uBlink), 0.012);
    vec2 r1 = r0 + vec2(0.0, uBlink * uEyeShape.y * 0.32);
    local = r1;
    float d = sdRoundBox(r1, hs, min(uEyeShape.z, min(hs.x, hs.y)));
    if (uHappy > 0.0) {
        float ra = max(uEyeShape.x, uEyeShape.y * 0.62);
        float th = max(0.022, min(uEyeShape.x, uEyeShape.y) * 0.42);
        d = mix(d, sdArc(uv + vec2(0.0, ra * 0.35), ra, th), uHappy);
    }
    return d;
}

vec3 toSrgb(vec3 c) { return pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2)); }

void main() {
    vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
    vec2 pw = (frag - uCenter) / uScale;
    pw.y = -pw.y;
    float cr = cos(uRoll), sr = sin(uRoll);
    vec2 pb = pw - uLean - vec2(0.0, uLift);
    pb.y -= uPivot;
    pb = mat2(cr, -sr, sr, cr) * pb;
    pb /= uSquash;
    pb.y += uPivot;
    float f = fieldBody(pb);
    float fw = max(fwidth(f), 1e-4);
    float alpha = clamp(0.5 - (f - 1.0) / fw, 0.0, 1.0);
    vec3 col = vec3(0.0);
    if (alpha > 0.0) {
        vec2 e = vec2(0.002, 0.0);
        vec2 g = vec2(fieldBody(pb + e.xy) - fieldBody(pb - e.xy), fieldBody(pb + e.yx) - fieldBody(pb - e.yx)) / (2.0 * e.x);
        float fc = clamp(f, 0.0, 0.9995);
        float fk = pow(fc, uK);
        float slope = uZ * pow(fc, uK - 1.0) * pow(1.0 - fk, 1.0 / uK - 1.0);
        vec3 n = normalize(vec3(g * min(slope, 8.0), 1.0));
        n.xy = mat2(cr, sr, -sr, cr) * n.xy;
        float ty = uTurn.x, tp = uTurn.y;
        n = vec3(n.x, n.y * cos(tp) + n.z * sin(tp), -n.y * sin(tp) + n.z * cos(tp));
        n = vec3(n.x * cos(ty) + n.z * sin(ty), n.y, -n.x * sin(ty) + n.z * cos(ty));
        vec3 L = normalize(vec3(-0.42, 0.62, 0.66));
        vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
        float ndl = dot(n, L);
        float wrap = clamp((ndl + uMat2.x) / (1.0 + uMat2.x), 0.0, 1.0);
        float hemi = 0.5 + 0.5 * n.y;
        vec3 sky = mix(vec3(0.94, 0.95, 1.0), vec3(1.0), 0.5);
        vec3 ground = vec3(0.86, 0.8, 0.74);
        vec3 amb = mix(ground * 0.62, sky, hemi);
        float keyAmt = mix(0.66, 0.9, uDark);
        float ambAmt = mix(0.62, 0.42, uDark);
        col = uBase * (amb * ambAmt + wrap * wrap * keyAmt);
        float nh = max(dot(n, H), 0.0);
        float spec = pow(nh, uMat.y) * uMat.x;
        float sheen = pow(nh, 5.0) * uMat.z;
        float rim = pow(1.0 - max(n.z, 0.0), 3.0) * uMat.w * smoothstep(-0.2, 0.6, n.y + 0.3);
        vec3 rv = reflect(vec3(0.0, 0.0, -1.0), n);
        float win = smoothstep(0.86, 0.975, dot(rv, normalize(vec3(-0.36, 0.62, 0.7)))) * uMat2.y;
        float ao = 1.0 - 0.16 * smoothstep(0.1, 0.95, -n.y) * smoothstep(-0.1, -0.8, pb.y);
        col = col * ao + vec3(spec + sheen + win) + rim * sky;
        // the outline stays readable on white pages: in the outer pixels the brightest light softens
        float edgeBand = 1.0 - smoothstep(1.0, 5.0, (1.0 - f) / fw);
        float bright = smoothstep(0.7, 1.0, max(col.r, max(col.g, col.b)));
        col = mix(col, min(col, vec3(0.72)), edgeBand * bright);
        vec2 q = pb / uFace;
        float r2 = dot(q, q);
        if (r2 < 1.0) {
            vec3 nv = vec3(q, sqrt(1.0 - r2));
            for (int i = 0; i < 2; i++) {
                vec3 dir = uEye[i * 3];
                vec3 rt = uEye[i * 3 + 1];
                vec3 up = uEye[i * 3 + 2];
                float w = dot(nv, dir);
                if (w <= 0.0) continue;
                vec2 uv = vec2(dot(nv, rt) * uFace.x, dot(nv, up) * uFace.y);
                float side = i == 0 ? 1.0 : -1.0;
                vec2 local;
                vec2 hs;
                float sd = eyeSd(uv, side, local, hs);
                float ew = max(fwidth(sd), 1e-4);
                float facing = smoothstep(0.04, 0.3, w);
                float sock = (1.0 - smoothstep(0.0, 0.05, sd)) * step(0.0, sd) * 0.07 * facing;
                col *= 1.0 - sock;
                float m = clamp(0.5 - sd / ew, 0.0, 1.0) * facing;
                vec2 en = local / hs;
                float top = smoothstep(-0.3, 1.0, en.y) * (1.0 - uHappy);
                vec3 ec = uEyeCol * mix(1.0, mix(0.82, 0.55, uDark), top) + (1.0 - top) * mix(0.012, 0.0, uDark);
                vec2 gp = vec2(-0.32, 0.42) * hs;
                float gr = 0.3 * min(hs.x, hs.y);
                float gd = length(local - gp) - gr;
                float glint = clamp(0.5 - gd / ew, 0.0, 1.0) * (1.0 - smoothstep(0.2, 0.7, uBlink)) * (1.0 - uHappy) * mix(0.75, 0.35, uDark);
                ec = mix(ec, vec3(1.0), glint);
                col = mix(col, ec, m);
            }
        }
    }
    vec2 sp = (pw - uShadow.xy) / uShadow.zw;
    vec2 sp2 = sp * vec2(0.6, 0.4);
    float edge = min(min(frag.x, uRes.x - frag.x), min(frag.y, uRes.y - frag.y));
    float sh = (exp(-dot(sp, sp) * 2.6) * uShadowAmt.x + exp(-dot(sp2, sp2) * 2.2) * uShadowAmt.y) * smoothstep(0.0, uFade, edge);
    sh = clamp(sh, 0.0, 1.0);
    vec3 c = toSrgb(col);
    o = vec4(c * alpha, alpha) + vec4(0.0, 0.0, 0.0, sh) * (1.0 - alpha);
}`

const clampN = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const toLinear = (c: number) => Math.pow(c, 2.2)
const rand = (a: number, b: number) => a + Math.random() * (b - a)
const nowMs = () => performance.now()
// squash and stretch together, softly limited: the body never leaves its box and never vanishes
const softSquash = (x: number) => (x < 0 ? -0.3 * Math.tanh(-x / 0.3) : 0.15 * Math.tanh(x / 0.15))

class Spring {
    x: number
    v = 0
    constructor(x = 0) {
        this.x = x
    }
    step(target: number, w: number, z: number, dt: number) {
        const a = -2 * z * w * this.v - w * w * (this.x - target)
        this.v += a * dt
        this.x += this.v * dt
    }
    snap(target: number) {
        this.x = target
        this.v = 0
    }
    still(target: number, eps = 0.0004) {
        return Math.abs(this.x - target) < eps && Math.abs(this.v) < eps * 10
    }
}

type V3 = [number, number, number]
const rot = (v: V3, yaw: number, pitch: number): V3 => {
    const cp = Math.cos(pitch)
    const sp = Math.sin(pitch)
    const y1 = v[1] * cp + v[2] * sp
    const z1 = -v[1] * sp + v[2] * cp
    const cy = Math.cos(yaw)
    const sy = Math.sin(yaw)
    return [v[0] * cy + z1 * sy, y1, -v[0] * sy + z1 * cy]
}
/** the shape field in JS (as in the shader), for the hit test and the outline of the still picture */
const fieldJs = (k: number, x: number, y: number) => {
    if (k === 0) return Math.pow(Math.pow(Math.abs(x) / 0.92, 4.2) + Math.pow(Math.abs(y) / 0.92, 4.2), 1 / 4.2)
    if (k === 1) return Math.pow(Math.pow(Math.abs(x) / 1.02, 3) + Math.pow(Math.abs(y) / 0.64, 3), 1 / 3)
    if (k === 2) {
        const s = Math.pow(Math.abs(x) / 0.9, 13) + Math.pow(Math.abs(0.5 * x + 0.8660254 * y) / 0.9, 13) + Math.pow(Math.abs(-0.5 * x + 0.8660254 * y) / 0.9, 13)
        return Math.pow(s, 1 / 13)
    }
    return Math.hypot(x, y)
}

// ------------------------------------------------------------------ shared renderer (one context per page)

interface Renderer {
    gl: WebGL2RenderingContext
    canvas: HTMLCanvasElement
    u: Record<string, WebGLUniformLocation | null>
    lost: boolean
    release: () => void
    /** the largest size drawn in the running frame, and since when the canvas has been larger than needed */
    needW: number
    needH: number
    bigSince: number
}
let R: Renderer | null = null
/** an expected reason the live figure cannot run (no WebGL2, a shader the device rejects); shown in the editor canvas */
let renderFault = ""
// the context goes with the last figure, in the next microtask: a quick unmount and mount (StrictMode) keeps it
let releasePending = false
const UNIFORMS = ["uRes", "uCenter", "uScale", "uA", "uB", "uM", "uK", "uZ", "uTurn", "uFace", "uLean", "uRoll", "uSquash", "uPivot", "uLift", "uEye", "uEyeShape", "uBlink", "uHappy", "uBase", "uEyeCol", "uDark", "uMat", "uMat2", "uShadow", "uShadowAmt", "uFade"]
function setupProgram(gl: WebGL2RenderingContext): Record<string, WebGLUniformLocation | null> | null {
    const compile = (type: number, src: string) => {
        const s = gl.createShader(type)
        if (!s) return null
        gl.shaderSource(s, src)
        gl.compileShader(s)
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            renderFault = "the shader did not compile"
            return null
        }
        return s
    }
    const vs = compile(gl.VERTEX_SHADER, VERT)
    const fs = compile(gl.FRAGMENT_SHADER, FRAG)
    const prog = gl.createProgram()
    if (!vs || !fs || !prog) return null
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        renderFault = "the shader did not link"
        return null
    }
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, "a")
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const u: Record<string, WebGLUniformLocation | null> = {}
    for (const n of UNIFORMS) u[n] = gl.getUniformLocation(prog, n)
    return u
}
function renderer(): Renderer | null {
    releasePending = false
    if (R) return R.lost ? null : R
    if (renderFault) return null
    const canvas = document.createElement("canvas")
    canvas.width = 64
    canvas.height = 64
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false })
    if (!gl) {
        renderFault = "WebGL 2 is not available"
        return null
    }
    const u = setupProgram(gl)
    if (!u) return null
    const onLost = (e: Event) => {
        // without preventDefault the context never comes back
        e.preventDefault()
        r.lost = true
        figs.forEach((f) => f.show(false))
    }
    const onRestored = () => {
        const nu = setupProgram(r.gl)
        if (!nu) return
        r.u = nu
        r.lost = false
        figs.forEach((f) => {
            f.dirty = true
            if (!f.live) f.drawNow()
        })
        wake()
    }
    const r: Renderer = {
        gl,
        canvas,
        u,
        lost: false,
        needW: 0,
        needH: 0,
        bigSince: 0,
        release: () => {
            canvas.removeEventListener("webglcontextlost", onLost)
            canvas.removeEventListener("webglcontextrestored", onRestored)
            gl.getExtension("WEBGL_lose_context")?.loseContext()
        },
    }
    R = r
    canvas.addEventListener("webglcontextlost", onLost)
    canvas.addEventListener("webglcontextrestored", onRestored)
    return R
}
/** the shared canvas grows in 64 px steps to the largest figure drawn */
function glFit(r: Renderer, w: number, h: number) {
    r.needW = Math.max(r.needW, w)
    r.needH = Math.max(r.needH, h)
    const W = Math.max(r.canvas.width, Math.ceil(w / 64) * 64)
    const H = Math.max(r.canvas.height, Math.ceil(h / 64) * 64)
    if (W !== r.canvas.width || H !== r.canvas.height) {
        r.canvas.width = W
        r.canvas.height = H
    }
}
/** after a frame: a canvas that has been at least one step too large for 2 s shrinks to what the figures need */
function glTrim(r: Renderer, t: number) {
    const W = Math.ceil(r.needW / 64) * 64
    const H = Math.ceil(r.needH / 64) * 64
    const drew = r.needW > 0
    r.needW = 0
    r.needH = 0
    if (!drew) return
    if (r.canvas.width <= W && r.canvas.height <= H) {
        r.bigSince = 0
        return
    }
    if (!r.bigSince) r.bigSince = t
    else if (t - r.bigSince > 2000) {
        r.canvas.width = Math.min(r.canvas.width, W)
        r.canvas.height = Math.min(r.canvas.height, H)
        r.bigSince = 0
    }
}

// ------------------------------------------------------------------ shared input (one set of listeners)

interface Pt {
    x: number
    y: number
}
const IN = {
    pointer: null as Pt | null,
    lastInput: -1e9,
    activity: 0,
    touchMode: false,
    away: false,
    awaySince: 0,
    fingerDown: false,
    tap: null as { x: number; y: number; t: number; cancelled: boolean; woke: Set<Fig>; target: EventTarget | null } | null,
    scrollY: 0,
    scrollT: 0,
    scrollV: 0,
    lastScroll: -1e9,
    // fast scrolling up: the strongest upward speed of the running swing (px/s, negative); the hop comes at its end
    swingPeak: 0,
    rectsDirty: true,
}
/** happy eyes keep the loop running for their 880 ms; the frame time can lie a few ms before the tap (event time) */
const happyFor = (d: number) => d > -100 && d < 880
/** a swing must have been at least this fast upwards (px/s) for a hop */
const HOP_SPEED = 1500
const figs = new Set<Fig>()
let raf = 0
let timer = 0
let last = 0
let attached = false
let stillMq: MediaQueryList | null = null
const reduced = () => !!stillMq && stillMq.matches
let io: IntersectionObserver | null = null
let ro: ResizeObserver | null = null
let pixelScale = 1

function activity() {
    const t = nowMs()
    IN.activity = t
    figs.forEach((f) => f.onActivity(t))
}
function goAway() {
    if (IN.away) return
    IN.away = true
    IN.awaySince = nowMs()
    figs.forEach((f) => (f.glanceAt = 0))
    wake()
}

// ------------------------------------------------------------------ one figure

class Fig {
    o: FigOptions
    frame: HTMLElement
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D | null
    live: boolean
    onShown: (on: boolean) => void
    gazeX = new Spring(0)
    gazeY = new Spring(0.03)
    roll = new Spring(0)
    leanX = new Spring(0)
    squash = new Spring(0)
    eyeP: Spring[]
    col: Spring[]
    mat: Spring
    shapeA: number
    shapeB: number
    morph = 1
    morphFrom = 0
    target = { x: 0, y: 0.03 }
    glanceAt = 0
    blinkStart = -1e9
    nextBlink = nowMs() + rand(1200, 3800)
    doubleBlink = false
    happyStart = -1e9
    sleep: "awake" | "falling" | "asleep" | "waking" = "awake"
    sleepFrom = 0
    hopFrom = -1e9
    landed = true
    seen = true
    /** on screen and not hidden in the last frame: only then it blinks and glances by itself */
    vis = true
    /** until then the position is read every frame (the layer glides aside for the visitor panel) */
    trackUntil = 0
    dirty = true
    shown = false
    rect: DOMRect
    S = 100
    boxW = 160
    boxH = 135
    pxW = 0
    pxH = 0
    constructor(frame: HTMLElement, canvas: HTMLCanvasElement, o: FigOptions, live: boolean, onShown: (on: boolean) => void) {
        this.o = { ...o }
        this.frame = frame
        this.canvas = canvas
        this.live = live
        this.onShown = onShown
        this.ctx = canvas.getContext("2d")
        this.eyeP = EYE_P[o.eyes].map((x) => new Spring(x))
        this.col = o.fill.map((c) => new Spring(toLinear(c)))
        this.mat = new Spring(MATERIALS.indexOf(o.material))
        this.shapeA = SHAPES.indexOf(o.shape)
        this.shapeB = this.shapeA
        this.rect = canvas.getBoundingClientRect()
        this.layout()
    }
    /** the figure box in the frame: S = min(width / 1.6, height / 1.35), the box centred */
    layout() {
        const fw = this.frame.clientWidth
        const fh = this.frame.clientHeight
        const S = Math.max(1, Math.min(fw / BOX_W, fh / BOX_H))
        this.S = S
        this.boxW = BOX_W * S
        this.boxH = BOX_H * S
        const st = this.canvas.style
        st.width = `${this.boxW}px`
        st.height = `${this.boxH}px`
        st.left = `${(fw - this.boxW) / 2}px`
        st.top = `${(fh - this.boxH) / 2}px`
        this.dirty = true
        IN.rectsDirty = true
    }
    show(on: boolean) {
        if (this.shown === on) return
        this.shown = on
        this.onShown(on)
    }
    center() {
        const r = this.rect
        return { x: r.left + r.width / 2, y: r.top + r.height * (BOX_C / BOX_H) }
    }
    /** the figure size on the page (a transform on a parent, like the visitor panel's, included) */
    screenSize() {
        return (this.rect.width / BOX_W) * clampN(this.o.scale, 0.4, 1)
    }
    sz() {
        return this.S * clampN(this.o.scale, 0.4, 1)
    }
    maxAngle() {
        return (clampN(this.o.range, 10, 80) * Math.PI) / 180
    }
    aim(p: Pt) {
        const c = this.center()
        const D = this.screenSize() * 1.5 + 220
        const m = this.maxAngle()
        const yaw = Math.atan2(p.x - c.x, D)
        const pitch = Math.atan2(c.y - p.y, D) / 0.7
        const a = Math.hypot(yaw, pitch)
        const k = a > 1e-6 ? (m * Math.tanh(a / m)) / a : 1
        return { x: yaw * k, y: pitch * k * 0.7 + 0.03 }
    }
    jump(nx: number, ny: number, t: number) {
        const dist = Math.hypot(nx - this.target.x, ny - this.target.y)
        if (dist > 0.35) {
            if (Math.random() < 0.35) this.startBlink(t + 20)
            if (!reduced()) this.squash.v -= 0.25 * dist * (0.4 + this.o.bounce / 100)
        }
        this.target = { x: nx, y: ny }
    }
    startBlink(t: number) {
        if (!this.o.blink || reduced()) return
        if (t - this.blinkStart < 300) return
        this.blinkStart = t
    }
    blinkValue(t: number) {
        const d = t - this.blinkStart
        if (d < 0 || d > 270) return 0
        if (d < 70) return (d / 70) * (d / 70)
        if (d < 110) return 1
        const x = (d - 110) / 160
        return (1 - x) * (1 - x)
    }
    happyValue(t: number) {
        const d = t - this.happyStart
        if (d < 0 || d > 880) return 0
        if (d < 120) return 1 - Math.pow(1 - d / 120, 3)
        if (d < 700) return 1
        const x = (d - 700) / 180
        return 1 - x * x * (3 - 2 * x)
    }
    /** lids in sleep: they sink in 1.6 s and open in 160 ms on waking */
    lidValue(t: number) {
        if (this.sleep === "falling") {
            const x = clampN((t - this.sleepFrom) / 1600, 0, 1)
            return x * x * (3 - 2 * x)
        }
        if (this.sleep === "asleep") return 1
        if (this.sleep === "waking") return 1 - clampN((t - this.sleepFrom) / 160, 0, 1)
        return 0
    }
    lift(t: number) {
        const d = (t - this.hopFrom) / 380
        if (d < 0 || d > 1) return 0
        return 0.12 * 4 * d * (1 - d)
    }
    onActivity(t: number) {
        if (this.sleep === "falling" || this.sleep === "asleep") {
            this.sleep = "waking"
            this.sleepFrom = t
            this.breathe(false)
            this.dirty = true
        }
    }
    breathe(on: boolean) {
        const st = this.canvas.style
        if (on && !reduced()) {
            // around the point where the body rests, so the shadow stays on the ground
            const groundY = BOX_C * this.S + (SHAPE_P[SHAPES[this.shapeB]].bottom * this.sz()) / 2
            st.transformOrigin = `50% ${groundY}px`
            st.animation = "mochi-breathe 4s ease-in-out infinite"
            st.animationPlayState = this.seen ? "running" : "paused"
        } else st.animation = ""
    }
    hop(t: number) {
        if (!this.o.scroll || reduced() || this.sleep !== "awake" || t - this.hopFrom < 900) return false
        this.hopFrom = t
        this.landed = false
        this.dirty = true
        return true
    }
    tapped(t: number) {
        if (!this.o.tap || this.sleep !== "awake") return
        this.happyStart = t
        if (!reduced()) this.squash.v -= 1.0 * (0.5 + this.o.bounce / 100)
        this.startBlink(t)
        this.dirty = true
    }
    hit(p: Pt, target: EventTarget | null) {
        // decoration without a function: a listener on the own frame with a hit test, no element with a click handler
        // (FP-2 exception agreed by Jan and Konsti, 27.10.2026)
        if (!target || !(target instanceof Node) || !this.frame.contains(target)) return false
        const c = this.center()
        const half = this.screenSize() / 2
        if (half <= 0) return false
        return fieldJs(this.shapeB, (p.x - c.x) / half - this.leanX.x, -(p.y - c.y) / half) <= 1
    }

    /** one step; true while anything moves */
    update(t: number, dt: number): boolean {
        const red = reduced()
        const o = this.o
        if (this.sleep === "awake" && o.sleep > 0 && t - IN.activity > o.sleep * 1000) {
            this.sleep = "falling"
            this.sleepFrom = t
        }
        if (this.sleep === "falling" && t - this.sleepFrom >= 1600) {
            this.sleep = "asleep"
            this.breathe(true)
        }
        if (this.sleep === "waking" && t - this.sleepFrom >= 160) {
            this.sleep = "awake"
            if (!red) {
                this.hopFrom = t
                this.landed = false
            }
        }
        if (o.sleep <= 0 && this.sleep !== "awake") {
            this.sleep = "awake"
            this.breathe(false)
        }
        const sleepy = this.sleep === "falling" || this.sleep === "asleep"
        const m = this.maxAngle()
        const scrolling = IN.touchMode && o.scroll && t - IN.lastScroll < 300
        const idleFor = IN.touchMode ? 1700 : 2200
        const wanderNow = !red && o.glances && (IN.away ? t - IN.awaySince > 350 : t - IN.lastInput > idleFor)
        const wander = wanderNow && this.vis
        if (sleepy) {
            this.target = { x: this.target.x * 0.4, y: red ? 0.03 : -0.2 }
        } else if (scrolling) {
            // while the page moves, with or without a finger: look the way it scrolls (Safari on iPhone reports no
            // finger movement while scrolling, so the direction comes from scrolling alone)
            const k = 0.6 * m * Math.min(1, Math.abs(IN.scrollV) / 2500)
            this.target = { x: 0, y: (IN.scrollV > 0 ? -k : k) + 0.03 }
        } else if (IN.touchMode && IN.fingerDown && IN.pointer) {
            this.target = this.aim(IN.pointer)
        } else if (wander) {
            if (t >= this.glanceAt) {
                if (Math.random() < 0.3) this.jump(rand(-0.05, 0.05), 0.04, t)
                else {
                    const a = rand(0, Math.PI * 2)
                    const r = rand(0.35, 0.85) * m
                    this.jump(Math.cos(a) * r, Math.sin(a) * r * 0.6 + 0.03, t)
                }
                this.glanceAt = t + rand(900, 2700)
            }
        } else if (IN.away) {
            this.target = { x: 0, y: 0.03 }
        } else if (IN.pointer) {
            this.target = this.aim(IN.pointer)
            this.glanceAt = 0
        }
        // hidden (visibility, display), not off screen: a glance that is due waits for the next turn, so the figure
        // goes on living when it is shown again (the Look Player switches looks by visibility); after the branches,
        // so none of them resets it
        if (wanderNow && !this.vis && t >= this.glanceAt) this.glanceAt = t + rand(900, 2700)
        if (o.blink && !red && !sleepy && !this.vis && t >= this.nextBlink) this.nextBlink = t + rand(2600, 6400)
        if (o.blink && !red && !sleepy && this.vis && t >= this.nextBlink) {
            this.startBlink(t)
            if (!this.doubleBlink && Math.random() < 0.16) {
                this.doubleBlink = true
                this.nextBlink = t + 300
            } else {
                this.doubleBlink = false
                this.nextBlink = t + rand(2600, 6400)
            }
        }
        const f = o.follow / 100
        const bo = o.bounce / 100
        const wE = red ? 22 : lerp(6, 30, f)
        const zE = red ? 1 : lerp(1, 0.55, bo)
        const wB = lerp(4, 12, f)
        const zB = lerp(0.95, 0.2, bo)
        const leanAmt = red ? 0 : 1
        const rollT = -this.gazeX.x * 0.07 * leanAmt
        const leanT = this.gazeX.x * 0.05 * leanAmt
        const stretch = IN.touchMode && o.scroll && !red ? Math.min(1, Math.abs(IN.scrollV) / 2500) * 0.06 : 0
        const sqT = (this.gazeY.x - 0.03) * 0.06 * leanAmt + stretch - (sleepy && !red ? 0.035 : 0)
        let steps = Math.ceil(dt / (1 / 240))
        const h = dt / steps
        const ep = EYE_P[o.eyes]
        const matI = MATERIALS.indexOf(o.material)
        while (steps-- > 0) {
            this.gazeX.step(this.target.x, wE, zE, h)
            this.gazeY.step(this.target.y, wE, zE, h)
            this.roll.step(rollT, wB, zB, h)
            this.leanX.step(leanT, wB, zB, h)
            this.squash.step(sqT, wB * 1.25, zB * 0.9, h)
            this.eyeP.forEach((s, i) => s.step(ep[i], 16, 0.8, h))
            this.col.forEach((s, i) => s.step(toLinear(o.fill[i]), 14, 1, h))
            this.mat.step(matI, 14, 1, h)
        }
        if (red) {
            this.roll.snap(0)
            this.leanX.snap(0)
            this.squash.snap(0)
        }
        if (this.morph < 1) this.morph = Math.min(1, (t - this.morphFrom) / 420)
        if (!this.landed && t - this.hopFrom > 380) {
            this.landed = true
            this.squash.v -= 0.8 * (0.4 + bo)
        }
        const blinking = this.blinkValue(t) > 0 || t - this.blinkStart < 300
        return (
            !this.gazeX.still(this.target.x) || !this.gazeY.still(this.target.y) || !this.roll.still(rollT) || !this.leanX.still(leanT) || !this.squash.still(sqT) ||
            this.eyeP.some((s, i) => !s.still(ep[i], 0.0002)) || this.col.some((s, i) => !s.still(toLinear(o.fill[i]))) || !this.mat.still(matI) ||
            this.morph < 1 || blinking || happyFor(t - this.happyStart) || t - this.hopFrom < 400 || !this.landed ||
            this.sleep === "falling" || this.sleep === "waking" || scrolling || stretch > 0
        )
    }

    /** the next moment this figure does something by itself */
    nextEvent(t: number) {
        const o = this.o
        const red = reduced()
        const idleFor = IN.touchMode ? 1700 : 2200
        // off screen nothing is planned (the IntersectionObserver wakes it); hidden figures keep their plan
        const ev = [o.blink && !red && this.seen && this.sleep === "awake" ? this.nextBlink : Infinity]
        if (o.glances && !red && this.seen && this.sleep === "awake") {
            const wander = IN.away ? t - IN.awaySince > 350 : t - IN.lastInput > idleFor
            ev.push(wander ? this.glanceAt : IN.away ? IN.awaySince + 351 : IN.lastInput + idleFor + 1)
        }
        if (o.sleep > 0 && this.sleep === "awake") ev.push(IN.activity + o.sleep * 1000 + 1)
        if (IN.touchMode && o.scroll && t - IN.lastScroll < 301) ev.push(IN.lastScroll + 301)
        const fut = ev.filter((x) => x > t - 1)
        return fut.length ? Math.min(...fut) : Infinity
    }

    /** the editor: the end state at once, no transitions */
    settle() {
        const o = this.o
        this.shapeA = this.shapeB = SHAPES.indexOf(o.shape)
        this.morph = 1
        this.target = { x: 0, y: 0.03 }
        this.gazeX.snap(0)
        this.gazeY.snap(0.03)
        this.roll.snap(0)
        this.leanX.snap(0)
        this.squash.snap(0)
        EYE_P[o.eyes].forEach((x, i) => this.eyeP[i].snap(x))
        o.fill.forEach((c, i) => this.col[i].snap(toLinear(c)))
        this.mat.snap(MATERIALS.indexOf(o.material))
    }
    drawNow() {
        this.settle()
        this.rect = this.canvas.getBoundingClientRect()
        this.draw(nowMs())
    }

    draw(t: number) {
        const r = renderer()
        const ctx = this.ctx
        if (!r || !ctx || this.boxW < 1 || this.boxH < 1) return
        const gl = r.gl
        const dpr = Math.min(2, window.devicePixelRatio || 1) * pixelScale
        const w = Math.max(1, Math.round(this.boxW * dpr))
        const hh = Math.max(1, Math.round(this.boxH * dpr))
        // the own canvas only when the box changed, right before the copy (a new canvas is empty until then)
        if (w !== this.pxW || hh !== this.pxH) {
            this.canvas.width = w
            this.canvas.height = hh
            this.pxW = w
            this.pxH = hh
        }
        glFit(r, w, hh)
        const o = this.o
        const A = SHAPE_P[SHAPES[this.shapeA]]
        const B = SHAPE_P[SHAPES[this.shapeB]]
        const mE = this.morph < 1 ? 1 - Math.pow(1 - this.morph, 3) : 1
        const mix = (a: number, b: number) => lerp(a, b, mE)
        const bottom = mix(A.bottom, B.bottom)
        const half = mix(A.half, B.half)
        const face: [number, number] = [mix(A.face[0], B.face[0]), mix(A.face[1], B.face[1])]
        const sep = 0.3 * (1 / face[0])
        const eyeU: number[] = []
        for (const side of [-1, 1]) {
            const yaw = this.gazeX.x + side * sep
            const pitch = this.gazeY.x + 0.05
            eyeU.push(...rot([0, 0, 1], yaw, pitch), ...rot([1, 0, 0], yaw, pitch), ...rot([0, 1, 0], yaw, pitch))
        }
        const sq = softSquash(this.squash.x)
        const sx = 1 / Math.sqrt(1 + sq)
        const sy = 1 + sq
        const lift = this.lift(t)
        const base = this.col.map((c) => clampN(c.x, 0, 1)) as V3
        const lum = 0.2126 * base[0] + 0.7152 * base[1] + 0.0722 * base[2]
        const dark = clampN((0.18 - lum) / 0.16, 0, 1)
        const eyeCol: V3 = o.eyeColor ? (o.eyeColor.map(toLinear) as V3) : dark > 0.5 ? [0.86, 0.85, 0.83] : [0.012, 0.012, 0.016]
        const eyeLum = 0.2126 * eyeCol[0] + 0.7152 * eyeCol[1] + 0.0722 * eyeCol[2]
        // materials: Matte 0, Satin 1, Gloss 2, mixed softly
        const mt = clampN(this.mat.x, 0, 2)
        const P3 = (a: number, s: number, g: number) => (mt <= 1 ? lerp(a, s, mt) : lerp(s, g, mt - 1))
        const turnW = clampN((mix(A.k, B.k) - 2) / 1.2, 0, 1) * 0.3
        const u = r.u
        gl.viewport(0, 0, w, hh)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.uniform2f(u.uRes, w, hh)
        gl.uniform2f(u.uCenter, w / 2, BOX_C * this.S * dpr)
        gl.uniform1f(u.uScale, (this.sz() / 2) * dpr)
        gl.uniform1i(u.uA, this.shapeA)
        gl.uniform1i(u.uB, this.shapeB)
        gl.uniform1f(u.uM, mE)
        gl.uniform1f(u.uK, mix(A.k, B.k))
        gl.uniform1f(u.uZ, mix(A.z, B.z))
        gl.uniform2f(u.uTurn, this.roll.x * -3.9 * turnW, (this.gazeY.x - 0.03) * turnW * 0.8)
        gl.uniform2f(u.uFace, face[0], face[1])
        gl.uniform2f(u.uLean, this.leanX.x, 0)
        gl.uniform1f(u.uRoll, this.roll.x)
        gl.uniform2f(u.uSquash, sx, sy)
        gl.uniform1f(u.uPivot, -bottom)
        gl.uniform1f(u.uLift, lift)
        gl.uniform3fv(u.uEye, new Float32Array(eyeU))
        gl.uniform4f(u.uEyeShape, this.eyeP[0].x, this.eyeP[1].x, this.eyeP[2].x, this.eyeP[3].x)
        gl.uniform1f(u.uBlink, Math.max(o.blink ? this.blinkValue(t) : 0, this.lidValue(t)))
        gl.uniform1f(u.uHappy, this.happyValue(t))
        gl.uniform3f(u.uBase, base[0], base[1], base[2])
        gl.uniform3f(u.uEyeCol, eyeCol[0], eyeCol[1], eyeCol[2])
        // the eye shading follows the eye color: light eyes get the deeper lid shadow
        gl.uniform1f(u.uDark, o.eyeColor ? (eyeLum > 0.3 ? Math.max(dark, 0.6) : Math.min(dark, 0.4)) : dark)
        gl.uniform4f(u.uMat, P3(0, lerp(0.16, 0.34, dark), lerp(0.55, 0.8, dark)), P3(8, lerp(34, 46, dark), 170), P3(lerp(0.01, 0.02, dark), lerp(0.035, 0.06, dark), lerp(0.05, 0.08, dark)), P3(lerp(0.04, 0.09, dark), lerp(0.1, 0.22, dark), lerp(0.16, 0.3, dark)))
        gl.uniform2f(u.uMat2, P3(0.68, 0.45, 0.4), P3(0, 0, lerp(0.16, 0.26, dark)))
        const shrink = 1 - Math.min(0.5, lift * 1.6)
        gl.uniform4f(u.uShadow, this.leanX.x + Math.sin(this.roll.x) * 0.3, -bottom - 0.035, half * 0.82 * sx * shrink, 0.1 * shrink)
        const fadeShadow = o.shadow ? 1 - Math.min(0.6, lift * 3) : 0
        gl.uniform2f(u.uShadowAmt, lerp(0.2, 0.55, dark) * fadeShadow, lerp(0.08, 0.2, dark) * fadeShadow)
        gl.uniform1f(u.uFade, 0.08 * Math.min(w, hh))
        gl.drawArrays(gl.TRIANGLES, 0, 3)
        // copy at once, in the same task (no preserveDrawingBuffer); the part sits bottom left in GL
        ctx.clearRect(0, 0, w, hh)
        ctx.drawImage(r.canvas, 0, r.canvas.height - hh, w, hh, 0, 0, w, hh)
        this.dirty = false
        this.show(true)
    }
}

// ------------------------------------------------------------------ frame loop

function tick(t: number) {
    raf = 0
    const dt = Math.min(0.05, last ? (t - last) / 1000 : 1 / 60)
    last = t
    if (t - IN.lastScroll > 100) IN.scrollV *= Math.pow(0.001, dt)
    if (Math.abs(IN.scrollV) < 5) IN.scrollV = 0
    const live = [...figs].filter((f) => f.live)
    // the end of a fast swing upwards (120 ms without scrolling, or nearly still): the figures on screen hop. At the
    // start of the swing a figure is often not there yet or flies past with the page (iPhone test, 27.10.2026)
    const swingPending = IN.swingPeak <= -HOP_SPEED
    if (swingPending && (t - IN.lastScroll > 120 || IN.scrollV > -300)) {
        IN.swingPeak = 0
        live.forEach((f) => {
            if (f.seen) f.hop(t)
        })
    } else if (!swingPending && t - IN.lastScroll > 120) IN.swingPeak = 0
    // read every position first, then draw (no forced layout per figure)
    const gliding = live.some((f) => t < f.trackUntil)
    if (IN.rectsDirty || gliding) {
        live.forEach((f) => (f.rect = f.canvas.getBoundingClientRect()))
        IN.rectsDirty = false
    }
    // at most about 4 million pixels per frame for all figures together; beyond that every figure draws softer
    const area = live.filter((f) => f.seen).reduce((s, f) => s + f.boxW * f.boxH, 0) * Math.pow(Math.min(2, window.devicePixelRatio || 1), 2)
    pixelScale = area > 4e6 ? Math.sqrt(4e6 / area) : 1
    let moving = IN.swingPeak <= -HOP_SPEED || gliding
    live.forEach((f) => {
        const visible = f.seen && !document.hidden && (typeof f.canvas.checkVisibility !== "function" || f.canvas.checkVisibility({ visibilityProperty: true }))
        f.vis = visible
        const m = f.update(t, dt)
        // visible figures draw while they move; hidden ones once when they come to rest, so their picture is never old
        if (visible && (m || f.dirty)) f.draw(t)
        else if (!visible && !m && f.dirty) f.draw(t)
        else if (!visible && m) f.dirty = true
        if (m) moving = true
    })
    if (R && !R.lost) glTrim(R, t)
    if (moving) {
        schedule()
        return
    }
    last = 0
    const at = Math.min(...live.map((f) => f.nextEvent(t)))
    if (at < Infinity && !document.hidden) timer = window.setTimeout(wake, Math.max(16, at - t))
}
function schedule() {
    if (!raf && [...figs].some((f) => f.live)) raf = requestAnimationFrame(tick)
}
function wake() {
    window.clearTimeout(timer)
    timer = 0
    schedule()
}

// ------------------------------------------------------------------ listeners
// Everything that happens on the figure itself (a tap, a click, keys inside the visitor panel) is heard on its own
// frame element. To follow the pointer and the finger across the page and to look along when it scrolls, a figure
// needs positions outside its own area, and it pauses in a hidden tab: one shared set of window and document
// listeners for all figures, only reading (passive, never preventDefault or stopPropagation), attached only while a
// figure is on screen and removed when none is. Mochi writes to no element outside its own frame (Framer code
// review, 28.10.2026, FP-16).

const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return
    IN.touchMode = false
    IN.away = false
    IN.pointer = { x: e.clientX, y: e.clientY }
    IN.lastInput = nowMs()
    // positions are read again in the next frame: the page may have moved without a scroll (resize, layout)
    IN.rectsDirty = true
    activity()
    wake()
}
const onOut = (e: PointerEvent) => {
    if (e.pointerType !== "touch" && !e.relatedTarget) goAway()
}
// an Apple Pencil counts through pointer events only, otherwise twice
const fingers = (e: TouchEvent) => [...e.touches].filter((t) => (t as Touch & { touchType?: string }).touchType !== "stylus")
const onTouchStart = (e: TouchEvent) => {
    const list = fingers(e)
    const f0 = list[0]
    if (!f0) return
    const t = nowMs()
    IN.touchMode = true
    IN.away = false
    IN.fingerDown = true
    IN.pointer = { x: f0.clientX, y: f0.clientY }
    IN.lastInput = t
    IN.rectsDirty = true
    if (IN.tap && list.length > 1) IN.tap.cancelled = true
    activity()
    figs.forEach((f) => {
        if (f.live && f.sleep === "awake") {
            const a = f.aim({ x: f0.clientX, y: f0.clientY })
            f.jump(a.x, a.y, t)
        }
    })
    wake()
}
const onTouchMove = (e: TouchEvent) => {
    const f0 = fingers(e)[0]
    if (!f0) return
    IN.pointer = { x: f0.clientX, y: f0.clientY }
    IN.lastInput = nowMs()
    if (IN.tap && Math.hypot(f0.clientX - IN.tap.x, f0.clientY - IN.tap.y) > 10) IN.tap.cancelled = true
    activity()
    wake()
}
const onTouchEnd = (e: TouchEvent) => {
    if (fingers(e).length === 0) IN.fingerDown = false
    IN.lastInput = nowMs()
    activity()
    wake()
}
const onTouchCancel = () => {
    IN.fingerDown = false
    IN.tap = null
    wake()
}
const onScroll = () => {
    const t = nowMs()
    const y = window.scrollY
    const dt = Math.max(1, t - IN.scrollT)
    if (t - IN.scrollT < 200) IN.scrollV = lerp(IN.scrollV, ((y - IN.scrollY) / dt) * 1000, Math.min(1, dt / 100))
    IN.scrollY = y
    IN.scrollT = t
    IN.lastScroll = t
    IN.rectsDirty = true
    if (IN.tap) IN.tap.cancelled = true
    // remember the swing; the hop comes at its end (frame loop), on phones and desktops alike
    if (IN.scrollV < IN.swingPeak) IN.swingPeak = IN.scrollV
    activity()
    wake()
}
// a hidden tab: the eyes leave the old spot; back after longer than Sleep: asleep already
const onVis = () => {
    if (document.hidden) {
        goAway()
        return
    }
    const t = nowMs()
    figs.forEach((f) => {
        if (f.live && f.o.sleep > 0 && t - IN.activity > f.o.sleep * 1000 && f.sleep === "awake") {
            f.sleep = "asleep"
            f.sleepFrom = t
            f.dirty = true
            f.breathe(true)
        }
    })
    wake()
}
const onReduce = () => {
    figs.forEach((f) => (f.dirty = true))
    wake()
}
function attach() {
    if (attached) return
    attached = true
    IN.activity = nowMs()
    IN.scrollY = window.scrollY
    IN.rectsDirty = true
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerout", onOut, { passive: true })
    window.addEventListener("blur", goAway, { passive: true })
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: true })
    window.addEventListener("touchend", onTouchEnd, { passive: true })
    window.addEventListener("touchcancel", onTouchCancel, { passive: true })
    // capture: scrolling inside a container moves a figure too
    document.addEventListener("scroll", onScroll, { passive: true, capture: true })
    document.addEventListener("visibilitychange", onVis, { passive: true })
}
function detach() {
    if (!attached) return
    attached = false
    window.removeEventListener("pointermove", onMove)
    window.removeEventListener("pointerout", onOut)
    window.removeEventListener("blur", goAway)
    window.removeEventListener("touchstart", onTouchStart)
    window.removeEventListener("touchmove", onTouchMove)
    window.removeEventListener("touchend", onTouchEnd)
    window.removeEventListener("touchcancel", onTouchCancel)
    document.removeEventListener("scroll", onScroll, { capture: true })
    document.removeEventListener("visibilitychange", onVis)
    IN.tap = null
    IN.fingerDown = false
}
/** the shared listeners only while a live figure is on screen */
function listen() {
    if ([...figs].some((f) => f.live && f.seen)) attach()
    else detach()
}
/** the figure's own listeners: taps and keys on its frame element */
function ownListeners(f: Fig): () => void {
    const el = f.frame
    const down = (e: PointerEvent) => {
        const t = nowMs()
        const p = { x: e.clientX, y: e.clientY }
        // a figure that was asleep only wakes up; the press itself wakes it (the activity below)
        const woke = f.sleep !== "awake"
        if (e.pointerType === "touch") {
            // on phones a tap counts on release only: short, without a way, without scrolling
            IN.tap = { x: p.x, y: p.y, t, cancelled: false, woke: woke ? new Set([f]) : new Set(), target: e.target }
            return
        }
        IN.touchMode = false
        IN.away = false
        IN.pointer = p
        IN.lastInput = t
        activity()
        if (f.live && !woke && f.hit(p, e.target)) f.tapped(t)
        wake()
    }
    const up = (e: PointerEvent) => {
        if (e.pointerType !== "touch") return
        const tap = IN.tap
        IN.tap = null
        const t = nowMs()
        if (tap && !tap.cancelled && t - tap.t <= 500 && !tap.woke.has(f) && f.live && f.hit({ x: tap.x, y: tap.y }, tap.target)) f.tapped(t)
        wake()
    }
    const cancel = () => {
        IN.tap = null
    }
    const key = () => {
        activity()
        wake()
    }
    el.addEventListener("pointerdown", down, { passive: true })
    el.addEventListener("pointerup", up, { passive: true })
    el.addEventListener("pointercancel", cancel, { passive: true })
    el.addEventListener("keydown", key, { passive: true })
    return () => {
        el.removeEventListener("pointerdown", down)
        el.removeEventListener("pointerup", up)
        el.removeEventListener("pointercancel", cancel)
        el.removeEventListener("keydown", key)
    }
}
function observers() {
    if (!stillMq) {
        stillMq = window.matchMedia("(prefers-reduced-motion: reduce)")
        stillMq.addEventListener("change", onReduce)
    }
    if (io && ro) return
    io = new IntersectionObserver((list) => {
        list.forEach((en) => {
            const f = [...figs].find((x) => x.canvas === en.target)
            if (!f) return
            f.seen = en.isIntersecting
            f.canvas.style.animationPlayState = f.seen ? "running" : "paused"
            if (f.seen) f.dirty = true
        })
        listen()
        wake()
    })
    ro = new ResizeObserver((list) => {
        list.forEach((en) => {
            const f = [...figs].find((x) => x.frame === en.target)
            if (!f) return
            f.layout()
            // in the editor: one new frame after a size change; until then the still picture shows
            if (!f.live) {
                f.show(false)
                f.drawNow()
            }
        })
        wake()
    })
}

interface FigHandle {
    set(o: Partial<FigOptions>): void
    /** the frame moved by a transform (no resize, no scroll): read the position every frame for ms */
    moved(ms: number): void
    destroy(): void
}
/**
 * A figure in a frame element, drawn into the canvas given. live: follows pointer, finger and scrolling with the
 * shared loop and listeners; otherwise (editor canvas) one frame in its end state per call of set().
 */
function createFig(frame: HTMLElement, canvas: HTMLCanvasElement, initial: FigOptions, live: boolean, onShown: (on: boolean) => void): FigHandle | null {
    if (!renderer()) return null
    observers()
    const f = new Fig(frame, canvas, initial, live, onShown)
    figs.add(f)
    const offOwn = live ? ownListeners(f) : null
    io?.observe(canvas)
    ro?.observe(frame)
    if (live) wake()
    else f.drawNow()
    return {
        set(n) {
            const t = nowMs()
            if (n.shape && n.shape !== f.o.shape && f.live) {
                f.shapeA = f.morph < 0.5 ? f.shapeA : f.shapeB
                f.shapeB = SHAPES.indexOf(n.shape)
                f.morph = 0
                f.morphFrom = t
                if (!reduced()) f.squash.v -= 0.9 * (0.4 + f.o.bounce / 100)
            }
            f.o = { ...f.o, ...n }
            if (n.blink === true) f.nextBlink = t + 600
            if (n.sleep !== undefined && f.sleep !== "awake" && (n.sleep <= 0 || t - IN.activity < n.sleep * 1000)) {
                f.sleep = "awake"
                f.breathe(false)
            }
            f.dirty = true
            if (!f.live) {
                f.drawNow()
                return
            }
            // draw at once: sliders report at most once per frame, so the figure moves in the same frame as the slider
            window.clearTimeout(timer)
            timer = 0
            cancelAnimationFrame(raf)
            raf = 0
            tick(t)
        },
        moved(ms) {
            if (!f.live) return
            f.trackUntil = nowMs() + ms
            IN.rectsDirty = true
            wake()
        },
        destroy() {
            figs.delete(f)
            offOwn?.()
            io?.unobserve(canvas)
            ro?.unobserve(frame)
            f.breathe(false)
            listen()
            if (![...figs].some((x) => x.live)) {
                cancelAnimationFrame(raf)
                raf = 0
                window.clearTimeout(timer)
                timer = 0
            }
            if (!figs.size) {
                io?.disconnect()
                ro?.disconnect()
                io = null
                ro = null
                stillMq?.removeEventListener("change", onReduce)
                stillMq = null
                releasePending = true
                queueMicrotask(() => {
                    if (!releasePending || figs.size || !R) return
                    releasePending = false
                    R.release()
                    R = null
                })
            }
        },
    }
}

// ------------------------------------------------------------------ colors

const DEFAULT_FILL = "rgb(243, 241, 237)"
/** a color from Framer's Color control: rgb(a), hex, or a color style as var(--token-…, rgb(…)); else null */
function parseColor(input: unknown): RGB | null {
    if (typeof input !== "string") return null
    let s = input.trim()
    const v = s.match(/^var\(\s*--[^,]+,\s*(.+)\)$/i)
    if (v) s = v[1].trim()
    // the figure is always opaque: any alpha counts as full, but a color with no opacity at all falls back to the default
    const hex = s.match(/^#([0-9a-f]{3,8})$/i)
    if (hex) {
        let h = hex[1]
        if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("")
        if (h.length !== 6 && h.length !== 8) return null
        if (h.length === 8 && parseInt(h.slice(6, 8), 16) === 0) return null
        return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]
    }
    const rgb = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+)(%?))?/i)
    if (rgb) {
        if (rgb[4] !== undefined && Number(rgb[4]) === 0) return null
        return [Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255].map((x) => clampN(Number.isFinite(x) ? x : 0, 0, 1)) as RGB
    }
    return null
}
/** a color style resolved in the browser (it may have its own dark value); the figure is always opaque */
function resolveColor(input: unknown, host: HTMLElement | null): RGB | null {
    const direct = parseColor(input)
    if (typeof input !== "string" || !host || !/^var\(/i.test(input.trim())) return direct
    const probe = document.createElement("span")
    probe.style.display = "none"
    probe.style.color = input
    host.appendChild(probe)
    const resolved = window.getComputedStyle(probe).color
    probe.remove()
    return parseColor(resolved) ?? direct
}
const toHexStr = (c: RGB) => "#" + c.map((x) => Math.round(clampN(x, 0, 1) * 255).toString(16).padStart(2, "0")).join("").toUpperCase()
const lumOf = (c: RGB) => 0.2126 * toLinear(c[0]) + 0.7152 * toLinear(c[1]) + 0.0722 * toLinear(c[2])

// ------------------------------------------------------------------ still picture (SVG)

const round2 = (n: number) => Math.round(n * 100) / 100
/** the outline of a shape in the box of 160 × 135 (S = 100), the same text on the server and in every browser */
function outlinePath(shape: Shape): string {
    const k = SHAPES.indexOf(shape)
    const pts: string[] = []
    for (let i = 0; i < 120; i++) {
        const a = (i / 120) * Math.PI * 2
        const c = Math.cos(a)
        const s = Math.sin(a)
        // every field is of degree 1: the edge lies at r = 1 / f(cos, sin)
        const r = 1 / fieldJs(k, c, s)
        pts.push(`${round2(80 + 50 * r * c)} ${round2(68 - 50 * r * s)}`)
    }
    return `M${pts.join("L")}Z`
}
/**
 * The light of the still picture, fitted to the WebGL picture (probe/render.mjs: mean brightness within 0.04): per
 * shape and material for light, colored and dark fills, as [dim, edge shade, bottom shade, highlight].
 */
type Fit = [number, number, number, number]
const STILL_FIT: Record<Shape, Record<Material, [Fit, Fit, Fit]>> = {
    cube: { matte: [[0, 0.24, 0.12, 0.4], [0, 0.24, 0.12, 0.1], [0, 0, 0.12, 0.1]], satin: [[0.04, 0.24, 0.12, 0.7], [0.04, 0.24, 0.12, 0.25], [0, 0, 0, 0.4]], gloss: [[0.04, 0.24, 0.12, 0.7], [0.04, 0.24, 0.12, 0.25], [0.04, 0, 0, 0.55]] },
    pill: { matte: [[0, 0.24, 0.24, 0.7], [0, 0.24, 0.24, 0.1], [0, 0, 0.24, 0.1]], satin: [[0, 0.24, 0.24, 0.7], [0.08, 0.12, 0.24, 0.4], [0, 0, 0.24, 0.4]], gloss: [[0, 0.24, 0.24, 0.7], [0.08, 0.12, 0.24, 0.4], [0.16, 0, 0, 0.55]] },
    hex: { matte: [[0.04, 0.24, 0.12, 0.7], [0.04, 0.24, 0.12, 0.1], [0, 0, 0.12, 0.1]], satin: [[0, 0.36, 0.12, 0.4], [0.04, 0.24, 0.12, 0.25], [0, 0, 0, 0.4]], gloss: [[0, 0.36, 0.12, 0.25], [0.08, 0.12, 0.24, 0.4], [0.12, 0, 0, 0.55]] },
    sphere: { matte: [[0.04, 0.36, 0.24, 0.7], [0.16, 0.12, 0.24, 0.4], [0, 0.12, 0.24, 0.1]], satin: [[0.04, 0.36, 0.24, 0.7], [0.12, 0.24, 0.24, 0.4], [0.16, 0, 0.24, 0.4]], gloss: [[0.04, 0.36, 0.24, 0.7], [0.12, 0.24, 0.24, 0.4], [0.04, 0, 0.24, 0.4]] },
}
interface StillProps {
    uid: string
    /** a color style as var(--token-…): the still keeps its dark value, made opaque where the browser can */
    token: string
    fillRgb: RGB
    eyeColor: RGB | null
    shape: Shape
    eyes: EyeStyle
    material: Material
    shadow: boolean
    scale: number
    hidden: boolean
}
/** what the server, the static export and devices without WebGL2 show: the figure at rest, looking ahead */
function Still({ uid, token, fillRgb, eyeColor, shape, eyes, material, shadow, scale, hidden }: StillProps) {
    const P = SHAPE_P[shape]
    const dark = lumOf(fillRgb) < 0.04
    // light eyes on the same fills as the live figure (shader: dark > 0.5)
    const eyeFill = eyeColor ? toHexStr(eyeColor) : (0.18 - lumOf(fillRgb)) / 0.16 > 0.5 ? "#EDECEA" : "#0F0F12"
    const [hw, hh, rr, tilt] = EYE_P[eyes]
    const sep = 0.3 / P.face[0]
    const ex = 50 * P.face[0] * Math.sin(sep)
    const ey = 68 - 50 * P.face[1] * Math.sin(0.08)
    const ew = 100 * hw
    const eh = 100 * hh
    const deg = (tilt * 180) / Math.PI
    const lum = lumOf(fillRgb)
    const [dim, edgeShade, bottomShade, hi] = STILL_FIT[shape][material][dark ? 2 : lum > 0.6 ? 0 : 1]
    const g = (n: string) => `${uid}${n}`
    const s = clampN(scale, 0.4, 1)
    const shadowY = 68 + 50 * P.bottom * s + 1.75
    const outline = outlinePath(shape)
    return (
        <svg viewBox="0 0 160 135" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", opacity: hidden ? 0 : 1, transition: "opacity 200ms ease" }}>
            <defs>
                <radialGradient id={g("h")} cx="0.34" cy="0.26" r="0.62">
                    <stop offset="0" stopColor="#fff" stopOpacity={hi} />
                    <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
                <radialGradient id={g("e")} cx="0.42" cy="0.36" r="0.7">
                    <stop offset="0.45" stopColor="#000" stopOpacity="0" />
                    <stop offset="1" stopColor="#000" stopOpacity={edgeShade} />
                </radialGradient>
                <linearGradient id={g("d")} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0.45" stopColor="#000" stopOpacity="0" />
                    <stop offset="1" stopColor="#000" stopOpacity={bottomShade} />
                </linearGradient>
                <radialGradient id={g("s")} cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0" stopColor="#000" stopOpacity={shadow ? (dark ? 0.4 : 0.22) : 0} />
                    <stop offset="1" stopColor="#000" stopOpacity="0" />
                </radialGradient>
            </defs>
            <ellipse cx="80" cy={round2(shadowY)} rx={round2(50 * P.half * 0.95 * s)} ry={round2(9 * s)} fill={`url(#${g("s")})`} />
            <g transform={`translate(80 68) scale(${s}) translate(-80 -68)`}>
                <path d={outline} className={token ? "mo-token" : undefined} style={{ fill: toHexStr(fillRgb), ...(token ? ({ "--mo-fill": token } as CSSProperties) : null) }} />
                {dim ? <path d={outline} fill="#000" fillOpacity={dim} /> : null}
                {edgeShade ? <path d={outline} fill={`url(#${g("e")})`} /> : null}
                {bottomShade ? <path d={outline} fill={`url(#${g("d")})`} /> : null}
                <path d={outline} fill={`url(#${g("h")})`} />
                {material === "gloss" ? <ellipse cx="62" cy="40" rx="7" ry="4" fill="#fff" opacity={dark ? 0.55 : 0.7} transform="rotate(-24 62 40)" /> : null}
                {[-1, 1].map((side) => (
                    <g key={side} transform={`translate(${round2(80 + side * ex)} ${round2(ey)}) rotate(${round2(-side * deg)})`}>
                        <rect x={round2(-ew / 2)} y={round2(-eh / 2)} width={round2(ew)} height={round2(eh)} rx={round2(Math.min(100 * rr, ew / 2, eh / 2))} fill={eyeFill} />
                        <circle cx={round2(-0.32 * ew * 0.5)} cy={round2(-0.42 * eh * 0.5)} r={round2(0.3 * Math.min(ew, eh) * 0.5)} fill="#fff" opacity={dark ? 0.35 : 0.75} />
                    </g>
                ))}
            </g>
        </svg>
    )
}

// ------------------------------------------------------------------ visitor panel: content

interface VisitorState {
    fill: string
    custom: string
    shape: Shape
    eyes: EyeStyle
    material: Material
    size: number
    follow: number
    bounce: number
    range: number
    glances: boolean
    blink: boolean
    sleep: number
}
const FILLS: { key: string; name: string; hex: string }[] = [
    { key: "light", name: "Light", hex: "#F3F1ED" },
    { key: "dark", name: "Dark", hex: "#1D1D20" },
    { key: "lilac", name: "Lilac", hex: "#A698F3" },
    { key: "coral", name: "Coral", hex: "#F2876B" },
    { key: "butter", name: "Butter", hex: "#F2D27A" },
    { key: "mint", name: "Mint", hex: "#8FD0B3" },
]
const SHAPE_ICONS: Record<Shape, string> = {
    cube: "M8 4.5h8A3.5 3.5 0 0 1 19.5 8v8a3.5 3.5 0 0 1-3.5 3.5H8A3.5 3.5 0 0 1 4.5 16V8A3.5 3.5 0 0 1 8 4.5z",
    pill: "M8.5 7h7a5 5 0 0 1 0 10h-7a5 5 0 0 1 0-10z",
    hex: "M12 3.5l7.4 4.25v8.5L12 20.5l-7.4-4.25v-8.5z",
    sphere: "M12 4a8 8 0 1 0 0 16 8 8 0 1 0 0-16z",
}
const EYE_ICONS: Record<EyeStyle, string> = {
    capsule: "M9 8.5v7M15 8.5v7",
    slant: "M9.6 9L8 15.2M14.4 9l1.6 6.2",
    dot: "M8.5 10.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 1 0 0-3.6zM15.5 10.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 1 0 0-3.6z",
    square: "M7 10.2h3.4v3.6H7zM13.6 10.2H17v3.6h-3.4z",
}
// Lucide check (ISC, notice with the panel icons above)
const CHECK = "M20 6 9 17l-5-5"

interface HSV {
    h: number
    s: number
    v: number
}
const hsvRgb = ({ h, s, v }: HSV): RGB => {
    const f = (n: number) => {
        const k = (n + h / 60) % 6
        return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
    }
    return [f(5), f(3), f(1)]
}
const rgbHsv = ([r, g, b]: RGB): HSV => {
    const max = Math.max(r, g, b)
    const d = max - Math.min(r, g, b)
    let h = 0
    if (d) {
        h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
        h *= 60
        if (h < 0) h += 360
    }
    return { h, s: max ? d / max : 0, v: max }
}
const parseHexText = (text: string) => {
    let x = text.trim().replace(/^#/, "")
    if (/^[0-9a-f]{3}$/i.test(x)) x = x.split("").map((c) => c + c).join("")
    return /^[0-9a-f]{6}$/i.test(x) ? "#" + x.toUpperCase() : null
}

/** dragging on a surface: the pointer captured, values at most once per frame */
function useDrag(on: (p: Pt, r: DOMRect) => void) {
    const el = useRef<HTMLDivElement>(null)
    const held = useRef<number | null>(null)
    const pending = useRef<Pt | null>(null)
    const frame = useRef(0)
    const call = useRef(on)
    call.current = on
    const flush = () => {
        frame.current = 0
        const p = pending.current
        pending.current = null
        if (p && el.current) call.current(p, el.current.getBoundingClientRect())
    }
    const note = (e: ReactPointerEvent<HTMLDivElement>) => {
        pending.current = { x: e.clientX, y: e.clientY }
        if (!frame.current) frame.current = requestAnimationFrame(flush)
    }
    useEffect(() => () => cancelAnimationFrame(frame.current), [])
    return {
        ref: el,
        onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => {
            if (e.button !== 0) return
            e.currentTarget.setPointerCapture(e.pointerId)
            held.current = e.pointerId
            note(e)
        },
        onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => {
            if (held.current === e.pointerId) note(e)
        },
        onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => {
            if (held.current === e.pointerId) held.current = null
        },
        onPointerCancel: () => {
            held.current = null
        },
    }
}

const knob = (size: number, fill: string, extra: CSSProperties = {}) => (
    <span aria-hidden="true" style={{ position: "absolute", width: size, height: size, borderRadius: "50%", background: fill, boxShadow: "0 0 0 2px #fff, 0 1px 4px rgba(0,0,0,0.28), inset 0 0 0 0.5px rgba(0,0,0,0.12)", transform: "translate(-50%, -50%)", pointerEvents: "none", ...extra }} />
)

/** a color of one's own: saturation and brightness, a hue bar and a hex field, over the controls below (same size) */
function ColorPicker({ z, t, hsv, onHsv, done, focusFirst }: { z: Density; t: Theme; hsv: HSV; onHsv: (n: HSV) => void; done: () => void; focusFirst: boolean }) {
    const hintId = useId()
    const cur = useRef(hsv)
    cur.current = hsv
    const hex = toHexStr(hsvRgb(hsv))
    const [text, setText] = useState(hex.slice(1))
    const [typing, setTyping] = useState(false)
    useEffect(() => {
        if (!typing) setText(hex.slice(1))
    }, [hex, typing])
    const area = useDrag((p, r) => onHsv({ ...cur.current, s: clampN((p.x - r.left) / r.width, 0, 1), v: clampN(1 - (p.y - r.top) / r.height, 0, 1) }))
    const hue = useDrag((p, r) => onHsv({ ...cur.current, h: clampN((p.x - r.left) / r.width, 0, 1) * 359.9 }))
    // opened from the keyboard: the focus goes to the first field, not left behind on the button
    const areaEl = area.ref
    useEffect(() => {
        if (focusFirst) areaEl.current?.focus()
    }, [focusFirst, areaEl])
    const keys = (e: ReactKeyboardEvent<HTMLDivElement>, axis: "sv" | "h") => {
        const k = e.shiftKey ? 10 : 1
        const n = { ...cur.current }
        if (axis === "h") {
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") n.h = (n.h - 2 * k + 360) % 360
            else if (e.key === "ArrowRight" || e.key === "ArrowUp") n.h = (n.h + 2 * k) % 360
            else return
        } else if (e.key === "ArrowLeft") n.s = clampN(n.s - 0.01 * k, 0, 1)
        else if (e.key === "ArrowRight") n.s = clampN(n.s + 0.01 * k, 0, 1)
        else if (e.key === "ArrowDown") n.v = clampN(n.v - 0.01 * k, 0, 1)
        else if (e.key === "ArrowUp") n.v = clampN(n.v + 0.01 * k, 0, 1)
        else return
        e.preventDefault()
        onHsv(n)
    }
    const bar = Math.max(20, z.pill - 8)
    const pure = toHexStr(hsvRgb({ h: hsv.h, s: 1, v: 1 }))
    return (
        <div
            className="mo-in"
            onKeyDown={(e) => {
                // Escape closes the picker only, not the whole panel
                if (e.key === "Escape") {
                    e.stopPropagation()
                    done()
                }
            }}
            style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: z.gap }}
        >
            <span id={hintId} style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap" }}>
                Left and right change saturation, up and down brightness. Shift for larger steps.
            </span>
            <div {...area} role="slider" tabIndex={0} aria-label="Saturation and brightness" aria-describedby={hintId} aria-valuetext={`Saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`} className="gq-focus" onKeyDown={(e) => keys(e, "sv")} style={{ position: "relative", flex: 1, minHeight: z.field * 1.5, borderRadius: 10, background: `linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, ${pure})`, boxShadow: "inset 0 0 0 0.75px rgba(127,127,127,0.3)", cursor: "crosshair", touchAction: "none" }}>
                {knob(16, hex, { left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` })}
            </div>
            <div {...hue} role="slider" tabIndex={0} aria-label="Hue" aria-valuemin={0} aria-valuemax={360} aria-valuenow={Math.round(hsv.h)} className="gq-focus" onKeyDown={(e) => keys(e, "h")} style={{ position: "relative", flex: "none", height: bar, borderRadius: bar / 2, background: "linear-gradient(to right, #f00, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00)", boxShadow: "inset 0 0 0 0.75px rgba(127,127,127,0.3)", cursor: "pointer", touchAction: "none" }}>
                <div style={{ position: "absolute", left: bar / 2, right: bar / 2, top: "50%" }}>{knob(bar - 8, pure, { left: `${(hsv.h / 360) * 100}%`, top: 0 })}</div>
            </div>
            <div style={{ display: "flex", gap: 8, flex: "none" }}>
                <label style={{ flex: 1, minWidth: 0, height: z.field, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", borderRadius: 10, background: t.track, boxShadow: typing ? `inset 0 0 0 1.25px ${t.ink}` : "none", fontSize: z.text, cursor: "text" }}>
                    <span aria-hidden="true" style={{ width: 14, height: 14, flex: "none", borderRadius: "50%", background: hex, boxShadow: "inset 0 0 0 0.75px rgba(127,127,127,0.4)" }} />
                    <span aria-hidden="true" style={{ color: t.soft }}>
                        #
                    </span>
                    <input
                        value={text}
                        aria-label="Hex color"
                        spellCheck={false}
                        autoComplete="off"
                        maxLength={7}
                        onFocus={() => setTyping(true)}
                        onBlur={() => setTyping(false)}
                        onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9a-f#]/gi, "").replace(/#/g, "").toUpperCase().slice(0, 6)
                            setText(v)
                            const ok = parseHexText(v)
                            const c = ok ? parseColor(ok) : null
                            if (c && v.length === 6) onHsv(rgbHsv(c))
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                const ok = parseHexText(text)
                                const c = ok ? parseColor(ok) : null
                                if (c) onHsv(rgbHsv(c))
                                e.currentTarget.blur()
                            }
                        }}
                        style={{ flex: 1, minWidth: 0, height: "100%", padding: 0, border: 0, outline: "none", background: "transparent", color: t.ink, font: "inherit", fontSize: z.text, letterSpacing: "0.04em", fontVariantNumeric: "tabular-nums" }}
                    />
                </label>
                <button type="button" tabIndex={0} aria-label="Done" onClick={done} className="gq-focus gq-btn gq-tipped" style={{ position: "relative", width: z.field, height: z.field, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, border: 0, borderRadius: 10, background: t.track, color: t.ink, cursor: "pointer" }}>
                    <Icon d={CHECK} size={z.text + 5} />
                    <span className="gq-tip gq-end-tip" aria-hidden="true">
                        Done
                    </span>
                </button>
            </div>
        </div>
    )
}

/** fill: the choice and a color of one's own; the picker opens over the controls below (rest) */
function FillChoice({ z, t, vs, setVs, rest }: { z: Density; t: Theme; vs: VisitorState; setVs: (n: Partial<VisitorState>) => void; rest: ReactNode }) {
    const [open, setOpen] = useState(false)
    const [focusFirst, setFocusFirst] = useState(false)
    const customRef = useRef<HTMLButtonElement>(null)
    const boxRef = useRef<HTMLDivElement>(null)
    const byKey = useRef(false)
    const [hsv, setHsv] = useState<HSV>(() => rgbHsv(parseColor(vs.custom) ?? [0.42, 0.55, 0.94]))
    const own = vs.fill === "custom"
    const pick = (n: HSV) => {
        setHsv(n)
        setVs({ fill: "custom", custom: toHexStr(hsvRgb(n)) })
    }
    // closing with the focus in the picker (Escape, Done): back to the button, never lost to the page
    const close = () => {
        const inPicker = !!boxRef.current && boxRef.current.contains(document.activeElement)
        setOpen(false)
        if (inPicker) customRef.current?.focus()
    }
    const toggle = () => {
        if (open) return close()
        // start from the color on show when it has one, else from the last color of one's own
        const now = parseColor(vs.fill === "custom" ? vs.custom : (FILLS.find((f) => f.key === vs.fill) ?? FILLS[0]).hex) ?? [0.95, 0.94, 0.93]
        pick(rgbHsv(now).s > 0.15 ? rgbHsv(now) : rgbHsv(parseColor(vs.custom) ?? [0.42, 0.55, 0.94]))
        setFocusFirst(byKey.current)
        byKey.current = false
        setOpen(true)
    }
    return (
        <>
            <div role="radiogroup" aria-label="Fill" onKeyDown={arrows} style={{ display: "grid", gridTemplateColumns: `repeat(${FILLS.length + 1}, minmax(0, 1fr))`, gap: z.gap, alignItems: "center", height: z.field }}>
                {FILLS.map((f) => (
                    <Swatch
                        key={f.key}
                        world={{ name: f.name, bg: f.hex, a: f.hex, b: f.hex }}
                        on={vs.fill === f.key}
                        size={z.swatch + 8}
                        t={t}
                        onClick={() => {
                            setOpen(false)
                            setVs({ fill: f.key })
                        }}
                    />
                ))}
                <button
                    ref={customRef}
                    type="button"
                    role="radio"
                    aria-checked={own}
                    tabIndex={own ? 0 : -1}
                    aria-label="Custom color"
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") byKey.current = true
                    }}
                    onPointerDown={() => (byKey.current = false)}
                    onClick={toggle}
                    className="gq-focus gq-swatch" style={{ position: "relative", width: "100%", maxWidth: z.swatch + 8, aspectRatio: "1", justifySelf: "center", padding: 0, border: 0, borderRadius: "50%", background: "transparent", cursor: "pointer" }}>
                    <span className="gq-ring" style={{ position: "absolute", inset: 0, borderRadius: "50%", boxShadow: `inset 0 0 0 1.25px ${t.ink}`, opacity: own || open ? 1 : 0, transform: own || open ? "scale(1)" : "scale(0.86)" }} />
                    <span className="gq-dot" style={{ position: "absolute", inset: "17%", borderRadius: "50%", background: own ? vs.custom : "conic-gradient(from 200deg, #F2876B, #F2D27A, #8FD0B3, #6FA8F2, #A698F3, #F2876B)", boxShadow: "inset 0 0 0 0.75px rgba(127, 127, 127, 0.35)" }} />
                </button>
            </div>
            <div ref={boxRef} style={{ position: "relative", marginTop: z.section }}>
                <div {...(open ? INERT : {})} style={{ visibility: open ? "hidden" : undefined }}>
                    {rest}
                </div>
                {open ? <ColorPicker z={z} t={t} hsv={hsv} onHsv={pick} done={close} focusFirst={focusFirst} /> : null}
            </div>
        </>
    )
}

// ------------------------------------------------------------------ component

interface MotionGroup {
    follow?: number
    bounce?: number
    range?: number
    blink?: boolean
    glances?: boolean
    tap?: boolean
    sleep?: number
    scroll?: boolean
}
interface StyleGroup {
    eyeColor?: string
    shadow?: boolean
}
interface LabelGroup {
    altText?: string
}
interface PanelGroup {
    theme?: "auto" | "light" | "dark"
    start?: "open" | "closed"
    title?: string
}
interface Props {
    shape?: Shape
    eyes?: EyeStyle
    fill?: string
    material?: Material
    showControls?: boolean
    motion?: MotionGroup
    styling?: StyleGroup
    labels?: LabelGroup
    controls?: PanelGroup
    /** Set by Framer (size and position of the instance), passed to the root unchanged. Not a design option. */
    style?: CSSProperties
}

/** the movable card starts beside a zone this wide for the figure, with this gap (as in the feel probe) */
const CARD_ZONE = 680
const CARD_GAP = 64

/** the visitor panel offers Off, 10, 30 and 60 s: a value set in Framer shows as the nearest (never Off while it sleeps) */
const nearestSleep = (v: number) => (v <= 0 ? 0 : [10, 30, 60].reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a)))

/**
 * the stage behind figure and visitor panel, as in the feel probe: light and warm, dark nearly black, colors pale.
 * Theme Auto follows the fill; Light or Dark set the stage as well, so the glass card always sits on its own ground
 */
function stageOf(c: RGB, key: string, theme: "auto" | "light" | "dark") {
    const dark = theme === "auto" ? lumOf(c) < 0.04 : theme === "dark"
    if (dark) return { bg: "#101012", glow: "rgba(255, 255, 255, 0.055)" }
    if (key === "light" || lumOf(c) < 0.04) return { bg: "#E8E6E2", glow: "rgba(255, 255, 255, 0.7)" }
    const m = (x: number) => Math.round((x * 0.2 + 0.8) * 255)
    return { bg: `rgb(${m(c[0])}, ${m(c[1])}, ${m(c[2])})`, glow: "rgba(255, 255, 255, 0.55)" }
}

const D = { follow: 60, bounce: 40, range: 45, sleep: 30 }
const num = (v: unknown, d: number, a: number, b: number) => (typeof v === "number" && Number.isFinite(v) ? clampN(v, a, b) : d)
const oneOf = <T extends string>(v: unknown, list: readonly T[], d: T): T => (typeof v === "string" && (list as readonly string[]).includes(v) ? (v as T) : d)

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 240
 * @framerIntrinsicHeight 240
 * @framerDisableUnlink
 */
export default function Mochi(props: Props) {
    const { showControls = false, style } = props
    const shape = oneOf(props.shape, SHAPES, "cube")
    const eyes = oneOf(props.eyes, ["capsule", "dot", "square", "slant"] as const, "capsule")
    const material = oneOf(props.material, MATERIALS, "satin")
    const fillRaw = typeof props.fill === "string" && parseColor(props.fill) ? props.fill.trim() : DEFAULT_FILL
    const mo: MotionGroup = props.motion && typeof props.motion === "object" ? props.motion : {}
    const st: StyleGroup = props.styling && typeof props.styling === "object" ? props.styling : {}
    const lb: LabelGroup = props.labels && typeof props.labels === "object" ? props.labels : {}
    const pn: PanelGroup = props.controls && typeof props.controls === "object" ? props.controls : {}
    const follow = num(mo.follow, D.follow, 0, 100)
    const bounce = num(mo.bounce, D.bounce, 0, 100)
    const range = num(mo.range, D.range, 20, 60)
    const sleep = num(mo.sleep, D.sleep, 0, 300)
    const blink = mo.blink !== false
    const glances = mo.glances !== false
    const tap = mo.tap !== false
    const scroll = mo.scroll !== false
    const shadow = st.shadow !== false
    const eyeRaw = typeof st.eyeColor === "string" && parseColor(st.eyeColor) ? st.eyeColor : null
    const altText = typeof lb.altText === "string" ? lb.altText.trim() : ""
    const theme = oneOf(pn.theme, ["auto", "light", "dark"] as const, "auto")
    const startPanel = oneOf(pn.start, ["open", "closed"] as const, "closed")
    const title = typeof pn.title === "string" && pn.title.trim() ? pn.title : "Mochi"

    // the thumbnail Framer makes of the component is a picture as well: the still, like the static export
    const isStatic = useIsStaticRenderer() || RenderTarget.current() === RenderTarget.thumbnail
    const inCanvas = isStatic && RenderTarget.current() === RenderTarget.canvas
    const uid = `mo${useId().replace(/[^a-zA-Z0-9]/g, "")}`
    const rootRef = useRef<HTMLDivElement>(null)
    const layerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const figRef = useRef<FigHandle | null>(null)
    const [shown, setShown] = useState(false)
    const [fault, setFault] = useState("")
    const [box, setBox] = useState({ w: 0, h: 0 })

    // what a visitor sets in the panel (Controls on); a new setting in the editor starts it over
    const fromProps = (): VisitorState => {
        const c = parseColor(fillRaw)
        const preset = FILLS.find((f) => c && toHexStr(c) === f.hex)
        return { fill: preset ? preset.key : "custom", custom: c ? toHexStr(c) : "#6C8CF0", shape, eyes, material, size: 100, follow, bounce, range, glances, blink, sleep }
    }
    const propsKey = JSON.stringify([fillRaw, shape, eyes, material, follow, bounce, range, glances, blink, sleep])
    const [vs, setVsState] = useState<VisitorState>(fromProps)
    const setVs = (n: Partial<VisitorState>) => setVsState((v) => ({ ...v, ...n }))
    // deps: fromProps reads exactly the props summarised in propsKey
    useEffect(() => {
        setVsState(fromProps())
    }, [propsKey])
    // the visitor panel: live on the page, standing still in the editor canvas, not in the export
    const useVisitor = showControls && (!isStatic || inCanvas)
    const visitorHex = vs.fill === "custom" ? vs.custom : (FILLS.find((f) => f.key === vs.fill) ?? FILLS[0]).hex

    // the colors the engine gets: a color style resolved in the browser (with its dark value), else as parsed
    const [resolved, setResolved] = useState<{ fill: RGB | null; eye: RGB | null }>({ fill: null, eye: null })
    useEffect(() => {
        const host = rootRef.current
        const read = () => setResolved({ fill: resolveColor(fillRaw, host), eye: eyeRaw ? resolveColor(eyeRaw, host) : null })
        read()
        if (!/^var\(/i.test(fillRaw) && !(eyeRaw && /^var\(/i.test(eyeRaw))) return
        const mq = window.matchMedia("(prefers-color-scheme: dark)")
        mq.addEventListener("change", read)
        return () => mq.removeEventListener("change", read)
    }, [fillRaw, eyeRaw])
    const fillRgb: RGB = (useVisitor ? parseColor(visitorHex) : resolved.fill ?? parseColor(fillRaw)) ?? [0.953, 0.945, 0.929]
    const opts: FigOptions = {
        fill: fillRgb,
        eyeColor: useVisitor && visitorHex !== toHexStr(parseColor(fillRaw) ?? [0.953, 0.945, 0.929]) ? null : resolved.eye ?? (eyeRaw ? parseColor(eyeRaw) : null),
        shape: useVisitor ? vs.shape : shape,
        eyes: useVisitor ? vs.eyes : eyes,
        material: useVisitor ? vs.material : material,
        follow: useVisitor ? vs.follow : follow,
        bounce: useVisitor ? vs.bounce : bounce,
        range: useVisitor ? vs.range : range,
        blink: useVisitor ? vs.blink : blink,
        glances: useVisitor ? vs.glances : glances,
        sleep: useVisitor ? vs.sleep : sleep,
        tap,
        scroll,
        shadow,
        scale: useVisitor ? vs.size / 100 : 1,
    }
    const optsRef = useRef(opts)
    optsRef.current = opts
    const optsKey = JSON.stringify(opts)

    // the figure: live on the page, one frame per change in the editor canvas, nothing in the export
    useLayoutEffect(() => {
        const layer = layerRef.current
        const canvas = canvasRef.current
        if (!layer || !canvas || (isStatic && !inCanvas)) return
        const fig = createFig(layer, canvas, optsRef.current, !isStatic, (on) => setShown(on))
        if (!fig) {
            setFault(renderFault || "WebGL 2 is not available")
            return
        }
        figRef.current = fig
        return () => {
            fig.destroy()
            figRef.current = null
            setShown(false)
        }
    }, [isStatic, inCanvas])
    useLayoutEffect(() => {
        figRef.current?.set(optsRef.current)
    }, [optsKey])

    // the size of the component, for the visitor panel
    useEffect(() => {
        const el = rootRef.current
        if (!el || !useVisitor) return
        const read = () => setBox({ w: el.clientWidth, h: el.clientHeight })
        read()
        const obs = new ResizeObserver(read)
        obs.observe(el)
        return () => obs.disconnect()
    }, [useVisitor])

    // with the visitor panel open the figure moves into the free part (desktop beside the card, phones above the
    // sheet), by transform only: the canvas keeps its size and stays sharp
    const [room, setRoom] = useState<{ open: boolean; phone: boolean; inset: number; height: number }>({ open: false, phone: false, inset: 12, height: 0 })
    // the card can be moved on wider screens (grip, snapping, never off screen, as in the feel probe): it starts beside a
    // zone for the figure in the middle, and the figure stays beside the card, on the freer side once it is dropped on it
    const [place, setPlace] = useState<{ x: number; y: number; w: number; h: number; fx: number } | null>(null)
    const sideOf = (W: number, r: { x: number; w: number }, fx: number) => (fx < r.x + r.w / 2 ? r.x : W - (r.x + r.w))
    const scaleFor = (W: number, side: number, inset: number) => clampN(Math.min((side - 2 * inset) / W, 1), 0.3, 1)
    const startAt = ({ w, h, cardW, cardH, inset }: { w: number; h: number; cardW: number; cardH: number; inset: number }) => {
        const zone = Math.min(CARD_ZONE, Math.max(0, w - cardW - 2 * inset - CARD_GAP))
        const left = Math.max(inset, (w - (zone + CARD_GAP + cardW)) / 2)
        return { x: left + zone + CARD_GAP, y: (h - cardH) / 2 }
    }
    const onPlace = (r: { x: number; y: number; w: number; h: number; moved: boolean }) => {
        const el = rootRef.current
        if (!el) return
        const W = el.clientWidth
        const H = el.clientHeight
        const links = r.x
        const rechts = W - (r.x + r.w)
        const beside = links >= rechts ? Math.max(links / 2, r.x - CARD_GAP - CARD_ZONE / 2) : Math.min(r.x + r.w + rechts / 2, r.x + r.w + CARD_GAP + CARD_ZONE / 2)
        setPlace((p) => {
            let fx = !r.moved || !p ? beside : p.fx
            const k = scaleFor(W, sideOf(W, r, fx), room.inset)
            const half = (W * k) / 2
            const top = H / 2 - (H * k) / 2
            // dropped onto the figure: the figure moves to the freer side
            if (fx + half > r.x && fx - half < r.x + r.w && top + H * k > r.y && top < r.y + r.h) fx = beside
            fx = clampN(fx, half, W - half)
            return p && p.x === r.x && p.y === r.y && p.w === r.w && p.h === r.h && p.fx === fx ? p : { x: r.x, y: r.y, w: r.w, h: r.h, fx }
        })
    }
    let layerTransform = "none"
    if (useVisitor && room.open && box.w && box.h) {
        const W = box.w
        const H = box.h
        let fx = W / 2
        let fy = H / 2
        let fw = W
        let fh = H
        if (!room.phone && place) {
            fx = place.fx
            fw = Math.max(0, sideOf(W, place, fx) - 2 * room.inset)
        } else if (!room.phone) {
            fw = W - (Math.min(340, W - 2 * room.inset) + 2 * room.inset)
            fx = fw / 2
        } else {
            fh = H - room.height - 2 * room.inset
            fy = fh / 2 + 4
        }
        const k = clampN(Math.min(fw / W, fh / H), 0.3, 1)
        layerTransform = `translate(${Math.round(fx - (W * k) / 2)}px, ${Math.round(fy - (H * k) / 2)}px) scale(${k.toFixed(4)})`
    }
    const reset = () => setVsState(fromProps())
    useLayoutEffect(() => {
        figRef.current?.moved(600)
    }, [layerTransform])
    const stage = useVisitor ? stageOf(fillRgb, vs.fill, theme) : null

    // the panel sits on the stage, and the stage follows the fill
    const darkFill = lumOf(fillRgb) < 0.04
    const panelTheme: "light" | "dark" = theme === "auto" ? (darkFill ? "dark" : "light") : theme
    const ic = (z: Density, d: string) => <Icon d={d} size={z.text + 5} />
    const slider = (z: Density, t: Theme, label: string, value: number, min: number, max: number, format: (v: number) => string, onChange: (v: number) => void) => <Slider key={label} z={z} t={t} label={label} value={value} min={min} max={max} step={1} format={format} onChange={onChange} />
    const grid = (z: Density): CSSProperties => ({ display: "grid", gridTemplateColumns: z.columns === 2 ? "minmax(0, 1fr) minmax(0, 1fr)" : "minmax(0, 1fr)", gap: z.gap })
    const label = (z: Density, text: string) => <span style={{ fontSize: z.text }}>{text}</span>
    const main = (z: Density, t: Theme) => (
        <FillChoice
            z={z}
            t={t}
            vs={vs}
            setVs={setVs}
            rest={
                <>
                    {/* form: names left, the choices right, all of the same width */}
                    <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", columnGap: 12, rowGap: z.gap, alignItems: "center" }}>
                        {label(z, "Shape")}
                        <Segments<Shape> z={z} t={t} label="Shape" value={vs.shape} fill options={[["cube", "Cube"], ["pill", "Pill"], ["hex", "Hexagon"], ["sphere", "Sphere"]]} icons={(v) => ic(z, SHAPE_ICONS[v])} onChange={(v) => setVs({ shape: v })} />
                        {label(z, "Eyes")}
                        <Segments<EyeStyle> z={z} t={t} label="Eyes" value={vs.eyes} fill options={[["capsule", "Capsule"], ["slant", "Slant"], ["dot", "Dot"], ["square", "Square"]]} icons={(v) => ic(z, EYE_ICONS[v])} onChange={(v) => setVs({ eyes: v })} />
                        {label(z, "Material")}
                        <Segments<Material> z={z} t={t} label="Material" value={vs.material} fill options={[["matte", "Matte"], ["satin", "Satin"], ["gloss", "Gloss"]]} onChange={(v) => setVs({ material: v })} />
                    </div>
                    <div style={{ ...grid(z), marginTop: z.section }}>
                        {slider(z, t, "Size", vs.size, 40, 100, (v) => `${v}%`, (v) => setVs({ size: v }))}
                        {slider(z, t, "Follow", vs.follow, 0, 100, (v) => String(v), (v) => setVs({ follow: v }))}
                        {slider(z, t, "Wobble", vs.bounce, 0, 100, (v) => String(v), (v) => setVs({ bounce: v }))}
                    </div>
                </>
            }
        />
    )
    // Advanced: first how far the eyes look, then life without a pointer, all switches of the same width
    const advanced = (z: Density, t: Theme) => (
        <>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)" }}>{slider(z, t, "Range", vs.range, 20, 60, (v) => `${v}°`, (v) => setVs({ range: v }))}</div>
            <div style={{ marginTop: z.section }}>
                <ToggleRows
                    z={z}
                    t={t}
                    rows={[
                        { label: "Glances", value: vs.glances ? "on" : "off", options: [["on", "On"], ["off", "Off"]], onChange: (v) => setVs({ glances: v === "on" }) },
                        { label: "Blink", value: vs.blink ? "on" : "off", options: [["on", "On"], ["off", "Off"]], onChange: (v) => setVs({ blink: v === "on" }) },
                        { label: "Sleep", value: String(nearestSleep(vs.sleep)), options: [["0", "Off"], ["10", "10 s"], ["30", "30 s"], ["60", "60 s"]], onChange: (v) => setVs({ sleep: Number(v) }) },
                    ]}
                />
            </div>
        </>
    )

    const reducedCss = `@keyframes mochi-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.015)}}@keyframes ${uid}-in{from{opacity:0}to{opacity:1}}.${uid} .mo-in{animation:${uid}-in 220ms cubic-bezier(0.22,1,0.36,1)}@supports (color:rgb(from red r g b)){.${uid} .mo-token{fill:rgb(from var(--mo-fill) r g b / 1)!important}}@media (prefers-reduced-motion:reduce){.${uid} .mo-in{animation:none}.${uid} canvas{animation:none!important}.${uid} .mo-layer,.${uid} .mo-layer svg,.${uid} .mo-layer canvas{transition:none!important}}`
    const figureLabel = altText ? { role: "img", "aria-label": altText } : { "aria-hidden": true }
    return (
        <div
            ref={rootRef}
            className={uid}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: useVisitor ? "hidden" : "visible",
                ...(stage ? { backgroundColor: stage.bg, backgroundImage: `radial-gradient(70% 60% at 38% 34%, ${stage.glow}, transparent 70%)`, transition: isStatic ? undefined : "background-color 450ms ease" } : null),
                ...style,
            }}
        >
            <style>{reducedCss}</style>
            {/* the figure layer: still picture and canvas; the visitor panel is its sibling, never inside (FP-3) */}
            <div ref={layerRef} {...figureLabel} className="mo-layer" style={{ position: "absolute", inset: 0, transform: layerTransform, transformOrigin: "0 0", transition: isStatic ? undefined : "transform 520ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
                <Still uid={uid} token={!useVisitor && /^var\(/i.test(fillRaw) ? fillRaw : ""} fillRgb={fillRgb} eyeColor={opts.eyeColor} shape={opts.shape} eyes={opts.eyes} material={opts.material} shadow={shadow} scale={opts.scale} hidden={shown} />
                {/* only where something is drawn (not in the export); size 0 until the engine fits it into the box */}
                {!isStatic || inCanvas ? <canvas ref={canvasRef} aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, display: "block", pointerEvents: "none", opacity: shown ? 1 : 0, transition: "opacity 200ms ease" }} /> : null}
            </div>
            {useVisitor && box.w > 0 ? (
                <Panel
                    title={title}
                    theme={panelTheme}
                    start={startPanel}
                    isStatic={isStatic}
                    w={box.w}
                    h={box.h}
                    main={main}
                    advanced={advanced}
                    headerTools={[{ key: "reset", label: "Reset", icon: ICONS.reset, onClick: reset }]}
                    backdropKey={visitorHex}
                    regionLabel="Mochi controls"
                    layoutKey={String(box.w < 640)}
                    movable
                    snap
                    startAt={startAt}
                    onPlace={onPlace}
                    onOpenChange={(open, info) => setRoom((r) => (r.open === open && r.phone === info.phone && r.height === info.height && r.inset === info.inset ? r : { open, phone: info.phone, inset: info.inset, height: info.height }))}
                />
            ) : null}
            {inCanvas && fault ? (
                // editor canvas only (RenderTarget: the one place this note belongs); visitors see the still picture
                <div aria-hidden="true" style={{ position: "absolute", left: 8, bottom: 8, zIndex: 4, maxWidth: "calc(100% - 16px)", padding: "6px 10px", borderRadius: 4, background: "rgba(255, 255, 255, 0.94)", color: "rgb(28, 27, 25)", boxShadow: "0 0 0 1px rgba(28, 27, 25, 0.16)", font: "13px/18px system-ui, sans-serif", pointerEvents: "none" }}>
                    {`Live drawing could not start (${fault}). Visitors see the still picture.`}
                </div>
            ) : null}
        </div>
    )
}

// ------------------------------------------------------------------ panel (Framer)

addPropertyControls(Mochi, {
    shape: { type: ControlType.Enum, title: "Shape", options: ["cube", "pill", "hex", "sphere"], optionTitles: ["Cube", "Pill", "Hexagon", "Sphere"], defaultValue: "cube" },
    eyes: { type: ControlType.Enum, title: "Eyes", options: ["capsule", "slant", "dot", "square"], optionTitles: ["Capsule", "Slant", "Dot", "Square"], defaultValue: "capsule" },
    fill: { type: ControlType.Color, title: "Fill", defaultValue: "#F3F1ED" },
    material: { type: ControlType.Enum, title: "Material", options: ["matte", "satin", "gloss"], optionTitles: ["Matte", "Satin", "Gloss"], displaySegmentedControl: true, defaultValue: "satin" },
    // flat: switches the visitor panel on
    showControls: { type: ControlType.Boolean, title: "Controls", enabledTitle: "On", disabledTitle: "Off", defaultValue: false, description: "On: a playground on its own stage where visitors try shape, color and motion." },
    controls: {
        type: ControlType.Object,
        title: "Panel",
        hidden: (p: Props) => p.showControls !== true,
        controls: {
            theme: { type: ControlType.Enum, title: "Theme", options: ["auto", "light", "dark"], optionTitles: ["Auto", "Light", "Dark"], displaySegmentedControl: true, defaultValue: "auto", description: "Auto follows the fill. Light and Dark also set the stage." },
            start: { type: ControlType.Enum, title: "Start", options: ["open", "closed"], optionTitles: ["Open", "Closed"], displaySegmentedControl: true, defaultValue: "closed", description: "Whether the visitor panel starts open." },
            title: { type: ControlType.String, title: "Title", defaultValue: "Mochi" },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            follow: { type: ControlType.Number, title: "Follow", min: 0, max: 100, step: 1, defaultValue: D.follow, description: "How quickly the eyes catch up." },
            bounce: { type: ControlType.Number, title: "Wobble", min: 0, max: 100, step: 1, defaultValue: D.bounce, description: "How far eyes and body swing past before they settle." },
            range: { type: ControlType.Number, title: "Range", min: 20, max: 60, step: 1, unit: "°", defaultValue: D.range, description: "How far the eyes turn." },
            blink: { type: ControlType.Boolean, title: "Blink", defaultValue: true },
            glances: { type: ControlType.Boolean, title: "Glances", defaultValue: true, description: "Looks around on its own when the pointer is still." },
            tap: { type: ControlType.Boolean, title: "Tap", defaultValue: true, description: "Happy eyes and a squash when tapped." },
            sleep: { type: ControlType.Number, title: "Sleep", min: 0, max: 300, step: 5, unit: "s", defaultValue: D.sleep, description: "Seconds without input before it dozes off. 0 keeps it awake." },
            scroll: { type: ControlType.Boolean, title: "Scroll", defaultValue: true, description: "A fast scroll up makes it hop; on phones it also looks and leans with the page." },
        },
    },
    styling: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            eyeColor: { type: ControlType.Color, title: "Eye Color", optional: true, description: "Leave empty to pick light or dark eyes automatically." },
            shadow: { type: ControlType.Boolean, title: "Shadow", defaultValue: true },
        },
    },
    labels: {
        type: ControlType.Object,
        title: "Labels",
        controls: {
            altText: { type: ControlType.String, title: "Alt Text", defaultValue: "", description: "Read by screen readers. Empty treats the figure as decoration." },
        },
    },
})
