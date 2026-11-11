// Condensation: a fogged-up pane over an image or a video. Visitors wipe it clear with the mouse, a finger or the
// arrow keys; heavy drops run down and leave clear trails, the fog comes back from the edges and droplets grow on it
// again. With Controls on, visitors get a panel with scenes, sliders and an upload of a picture of their own.
// Live it draws with WebGL 1, only while something changes. On the server, in the static export, in thumbnails and
// wherever WebGL is missing it shows a still picture made of HTML and CSS. Made by KOJA Studios.

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, ReactNode, RefObject } from "react"

// <baustein:panel clamp, reducedMotion, Panel, Slider, Thumbs, ToggleRows, ICONS, Density, Theme>
// Embedded from the KOJA panel block (bausteine/panel/Panel.tsx, 1dffb327): clamp, reducedMotion, Panel, Slider, Thumbs, ToggleRows, ICONS, Density, Theme, DENSITIES, PANEL_W, PANEL_FONT, THEMES, SliderProps, arrows, Segments, ToggleRowSpec, ThumbItem, ThumbAdd, Icon, EASE, SHEET_MS, BTN_MS, STAGGER, SHEET_UP_MS, panelCount, PanelButton, PanelProps, INERT, SegmentsProps.
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
                <span key={`${r.label}-name`} style={{ minWidth: 0, paddingLeft: 12, fontSize: z.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.label}
                </span>,
                <Segments key={`${r.label}-switch`} z={z} t={t} label={r.label} value={r.value} options={r.options} fill onChange={r.onChange} />,
            ])}
        </div>
    )
}

interface ThumbItem<T extends string> {
    value: T
    /** accessible name and tooltip */
    name: string
    /** a small picture (a data URL or a small file) */
    src: string
}

/**
 * Pictures to choose from: a row of small rounded tiles, the chosen one with a fine ring and some air like the color
 * worlds. An optional last tile adds a picture of one's own (upload), with an icon.
 */
interface ThumbAdd {
    /** accessible name of the file field and tooltip of the tile */
    label: string
    /** file types for the chooser, e.g. "image/*,video/*" */
    accept: string
    /** the chosen file (the field is emptied right after, so the same file can come again) */
    onFile: (file: File) => void
}

function Thumbs<T extends string>({ z, t, label, value, items, add, onChange }: { z: Density; t: Theme; label: string; value: T; items: ThumbItem<T>[]; add?: ThumbAdd; onChange: (v: T) => void }) {
    const n = items.length + (add ? 1 : 0)
    const ic = z.text + 5
    return (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, gap: z.gap }}>
            <div role="radiogroup" aria-label={label} onKeyDown={arrows} style={{ display: "contents" }}>
                {items.map((it) => {
                    const on = it.value === value
                    return (
                        <button key={it.value} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1} aria-label={it.name} onClick={() => onChange(it.value)} className="gq-focus gq-tipped gq-thumb" style={{ position: "relative", height: z.field, padding: 0, border: 0, borderRadius: 10, background: "transparent", cursor: "pointer" }}>
                            <span className="gq-ring" style={{ position: "absolute", inset: 0, borderRadius: 10, boxShadow: `inset 0 0 0 1.25px ${t.ink}`, opacity: on ? 1 : 0, transform: on ? "scale(1)" : "scale(0.94)" }} />
                            <span className="gq-pic" style={{ position: "absolute", inset: 4, borderRadius: 7, backgroundImage: `url("${it.src}")`, backgroundSize: "cover", backgroundPosition: "center", boxShadow: "inset 0 0 0 0.75px rgba(127, 127, 127, 0.35)" }} />
                            <span className="gq-tip" aria-hidden="true">
                                {it.name}
                            </span>
                        </button>
                    )
                })}
            </div>
            {add ? (
                // the real file field, visually hidden but focusable and named, inside the tile that shows it: a click
                // on the tile opens the chooser natively, Tab reaches the field (tabIndex for Safari), Enter or Space
                // opens it, and the ring and the tooltip show on the tile (FP-2, FP-3)
                <label className="gq-tipped gq-btn gq-file" style={{ position: "relative", height: z.field, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, border: 0, borderRadius: 10, background: t.track, color: t.ink, cursor: "pointer" }}>
                    <input
                        type="file"
                        accept={add.accept}
                        aria-label={add.label}
                        tabIndex={0}
                        className="gq-focus gq-sr"
                        onChange={(e) => {
                            const f = e.target.files && e.target.files[0]
                            e.target.value = ""
                            if (f) add.onFile(f)
                        }}
                    />
                    <Icon d={ICONS.upload} size={ic} />
                    <span className="gq-tip gq-end-tip" aria-hidden="true">
                        {add.label}
                    </span>
                </label>
            ) : null}
        </div>
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

function Panel({ title, theme, side = "right", start = "open", w, h, isStatic = false, font, main, advanced, primary, tools = [], row = [], regionLabel = "Controls", children, onOpenChange, sheetDelay, layoutKey = "", align = "center", pad }: PanelProps) {
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
    const z = DENSITIES[phone ? Math.max(2, dens) : dens] ?? DENSITIES[DENSITIES.length - 1]

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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: z.pill, marginBottom: z.section, flex: "none" }}>
            {head}
            <button ref={active ? closeBtnRef : undefined} type="button" tabIndex={0} aria-label="Hide controls" onClick={(e) => close(e.detail === 0)} className="gq-focus gq-btn" style={{ position: "relative", width: z.pill, height: z.pill, display: "flex", alignItems: "center", justifyContent: "center", flex: "none", padding: 0, marginRight: -6, border: 0, borderRadius: 8, background: "transparent", color: t.ink, cursor: "pointer" }}>
                <Icon d={ICONS.close} size={ic} />
            </button>
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
    const actions = (
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
                <button type="button" tabIndex={0} onClick={() => setView("advanced")} className="gq-focus gq-btn gq-wide" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", height: z.field, marginTop: z.section, padding: "0 12px", border: 0, borderRadius: 10, background: "transparent", color: t.ink, font: "inherit", fontSize: z.text, cursor: "pointer", flex: "none" }}>
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
    ].join("")

    const sideStyle: CSSProperties = left ? { left: inset } : { right: inset }
    // a floating card: its height comes from the views, centred on the height of the box and never past the inset (on
    // phones docked at the bottom)
    const room = h - 2 * inset
    const top = align === "top" ? inset : Math.max(inset, Math.round((h - Math.min(sheetH || room, room)) / 2))
    const sheetStyle: CSSProperties = phone ? { left: inset, right: inset, bottom: inset, maxHeight: room } : { ...sideStyle, top, width: Math.min(PANEL_W, w - 2 * inset), maxHeight: room }
    const fontFamily = font && typeof font.fontFamily === "string" && font.fontFamily ? font.fontFamily : PANEL_FONT
    const views: ["main" | "advanced", ReactNode][] = advancedView ? [["main", mainView], ["advanced", advancedView]] : [["main", mainView]]
    return (
        <div
            className={uid}
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
        </div>
    )
}
// </baustein:panel>

// ------------------------------------------------------------------ engine (WebGL 1)
// The fog is a field on the CPU (a value per 2 or 3 px cell), uploaded as a small texture and drawn smooth (bicubic).
// The droplets are simulated once like a breath figure (they nucleate, grow, merge, and the heavy ones run down) and
// kept as stages; a stage is drawn once into a drop map, one texel per screen pixel, read by the pane shader. Running
// drops are drawn on top. Nothing is drawn while nothing changes.

type TouchMode = "hold" | "swipe" | "both"
type GlassMode = "wipe" | "ambient"
type MouseMode = "move" | "drag"
/** Values the engine works with: shares (0 to 1), pixels and seconds. */
interface Look {
    density: number
    droplets: number
    brush: number
    refog: number
    blur: number
    grain: number
    tint: number
    drips: number
}
interface Mode {
    touch: TouchMode
    mouse: MouseMode
    /** false: Mode Ambient, nobody wipes; drops run down now and then and their trails fog up again */
    wipe: boolean
}
type Source = { kind: "none" } | { kind: "image"; url: string; x: number; y: number } | { kind: "video"; url: string; poster: Source } | { kind: "file"; file: File }
type LoadWhat = "picture" | "video"
/**
 * Why a load failed: blocked (not from an allowed host, FP-5), timeout (no answer in time, FP-4), broken (does not
 * open), large (too big for this device), unexpected (anything else, with the browser's message).
 */
type LoadKind = "blocked" | "timeout" | "broken" | "large" | "unexpected"
interface LoadError {
    what: LoadWhat
    kind: LoadKind
    /** for the editor canvas */
    reason: string
}
/** The one wording of every load error (shown in the editor canvas only). */
function loadReason(what: LoadWhat, kind: LoadKind, detail = ""): string {
    const text =
        kind === "blocked"
            ? `This ${what} is not from Framer's ${what === "picture" ? "image" : "file"} storage, so it is not loaded.`
            : kind === "timeout"
              ? `The ${what} did not load in time.`
              : kind === "broken"
                ? `The ${what} could not be opened.`
                : kind === "large"
                  ? `The ${what} is too large for this device.`
                  : `The ${what} stopped loading.`
    return detail ? `${text.slice(0, -1)} (${detail}).` : text
}
/** What a visitor reads under the tiles when a file of their own does not work: short, nothing more. */
const UPLOAD_NOTE = { type: "This file is not a picture or a video.", large: "This file is too large.", broken: "Couldn't open this file." } as const
/** A visitor's file stays in their browser; beyond this it is too much for many phones. */
const UPLOAD_MAX: Record<LoadWhat, number> = { picture: 40 * 1024 * 1024, video: 400 * 1024 * 1024 }
interface SceneInfo {
    dark: boolean
    thumb: string
}
interface Hooks {
    /** live drawing could not start or stopped; visitors keep the still picture */
    fault: (reason: string) => void
    /** the first frame is on the screen (true), or the context is gone and the still is back (false) */
    drawn: (on: boolean) => void
    /** a new picture lies behind the glass: dark or light, and a small preview */
    scene: (info: SceneInfo) => void
    /** the picture or the video did not load (every load error comes through here, see report() in the engine) */
    sourceError: (e: LoadError) => void
    /** part of the glass is wiped clear (true) or it is all fogged (false) */
    state: (clear: boolean) => void
}
interface Glass {
    setLook: (l: Look) => void
    setMode: (m: Mode) => void
    setBackground: (c: string) => void
    /** a new picture; with `look` (a scene change) the values wait for it and both switch together, with a short fade */
    setSource: (s: Source, look?: Look) => void
    /** fetches the files of other scenes ahead, so a switch need not wait for the network */
    preload: (urls: string[]) => void
    fogUp: () => void
    keyMove: (dx: number, dy: number, far: boolean) => void
    keyFocus: (on: boolean) => void
    /** the brush ring in the middle for a moment: only while the Brush slider of the visitor panel moves (QA-2) */
    previewBrush: () => void
    destroy: () => void
}

/** An expected reason the live pane cannot run (no WebGL, a shader the device rejects). */
class GlassFault extends Error {}

/**
 * Tab shown or hidden: the glass pauses its video and drop timers in a hidden tab (the browser only stops animation
 * frames). One shared, read-only listener per document for all panes, attached while at least one pane is in view and
 * removed when none is (FP-16).
 */
const tabWatch = new Map<Document, Set<() => void>>()
function onTab(this: Document) {
    tabWatch.get(this)?.forEach((fn) => fn())
}
function watchTab(doc: Document, fn: () => void): () => void {
    let subs = tabWatch.get(doc)
    if (!subs) {
        subs = new Set()
        tabWatch.set(doc, subs)
        doc.addEventListener("visibilitychange", onTab)
    }
    subs.add(fn)
    return () => {
        const left = tabWatch.get(doc)
        if (!left) return
        left.delete(fn)
        if (left.size) return
        tabWatch.delete(doc)
        doc.removeEventListener("visibilitychange", onTab)
    }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (a: number, b: number, x: number) => {
    const t = clamp((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)
}
const rand = (a: number, b: number) => a + Math.random() * (b - a)
function vnoise(x: number, y: number, seed: number): number {
    const h = (a: number, b: number) => {
        let n = (a * 374761393 + b * 668265263 + seed * 2147483647) | 0
        n = Math.imul(n ^ (n >>> 13), 1274126177)
        return ((n ^ (n >>> 16)) >>> 0) / 4294967295
    }
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const xf = x - xi
    const yf = y - yi
    const u = xf * xf * (3 - 2 * xf)
    const v = yf * yf * (3 - 2 * yf)
    return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v)
}

/**
 * vnoise along one row of the fog field (x = i * cell, all at height y): the same numbers, but the corner hashes are
 * reused while the lattice cell stays the same, a fifth of the time on a large pane (QA-3).
 */
function noiseRow(out: Float64Array, n: number, cell: number, y: number, scale: number, seed: number) {
    const h = (a: number, b: number) => {
        let m = (a * 374761393 + b * 668265263 + seed * 2147483647) | 0
        m = Math.imul(m ^ (m >>> 13), 1274126177)
        return ((m ^ (m >>> 16)) >>> 0) / 4294967295
    }
    const fy = y / scale
    const yi = Math.floor(fy)
    const yf = fy - yi
    const v = yf * yf * (3 - 2 * yf)
    let at = NaN
    let h00 = 0
    let h10 = 0
    let h01 = 0
    let h11 = 0
    for (let i = 0; i < n; i++) {
        const fx = (i * cell) / scale
        const xi = Math.floor(fx)
        const xf = fx - xi
        const u = xf * xf * (3 - 2 * xf)
        if (xi !== at) {
            if (xi === at + 1) {
                h00 = h10
                h01 = h11
            } else {
                h00 = h(xi, yi)
                h01 = h(xi, yi + 1)
            }
            h10 = h(xi + 1, yi)
            h11 = h(xi + 1, yi + 1)
            at = xi
        }
        out[i] = lerp(lerp(h00, h10, u), lerp(h01, h11, u), v)
    }
}

/** The tint as a color: cool blue at -1, a neutral grey at 0, warm at 1. */
function tintRgb(t: number): [number, number, number] {
    const cold = [0.78, 0.87, 0.97]
    const neutral = [0.9, 0.905, 0.91]
    const warm = [1.0, 0.89, 0.78]
    const z = t < 0 ? cold : warm
    const a = Math.min(1, Math.abs(t))
    return [lerp(neutral[0], z[0], a), lerp(neutral[1], z[1], a), lerp(neutral[2], z[2], a)]
}

// Hosts that may serve a picture or a video (FP-5): Framer's own storage, the page itself, and files a visitor picks.
function allowedUrl(url: string): boolean {
    if (url.startsWith("blob:") || url.startsWith("data:image/")) return true
    try {
        const u = new URL(url, typeof location !== "undefined" ? location.href : undefined)
        if (typeof location !== "undefined" && u.origin === location.origin) return true
        return u.protocol === "https:" && (u.hostname === "framerusercontent.com" || u.hostname.endsWith(".framerusercontent.com"))
    } catch (e) {
        if (e instanceof TypeError) return false
        throw e
    }
}
/** For the still picture: the same answer on the server and in the browser (paths on the page and Framer's storage). */
function allowedStill(url: string): boolean {
    if (url.startsWith("/") && !url.startsWith("//")) return true
    return /^https:\/\/([a-z0-9-]+\.)?framerusercontent\.com\//.test(url)
}
/** A Framer image in about the size the pane needs (Framer's image service scales on request). */
function sizedUrl(url: string, longSide: number): string {
    if (!/^https:\/\/([a-z0-9-]+\.)?framerusercontent\.com\/images\//.test(url) || /[?&]scale-down-to=/.test(url)) return url
    const steps = [512, 1024, 2048, 4096]
    const n = steps.find((s) => s >= longSide) ?? 4096
    return `${url}${url.includes("?") ? "&" : "?"}scale-down-to=${n}`
}

/** a small tile in one colour (a scene without a picture, or a video before its first frame) */
function fillThumb(color: string): string {
    if (typeof document === "undefined") return ""
    // a colour style (var(...)) means nothing inside an image: then the default fill
    const c = /^(#[0-9a-f]{3,8}|rgba?\([\d.,\s%]+\)|hsla?\([\d.,\s%deg]+\))$/i.test(color) ? color : DEFAULT_FILL
    return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="${c}"/></svg>`)}`
}

const VS_FULL = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`

const FS_DOWN = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uSrc;
uniform vec2 uScale;
uniform vec2 uOff;
void main() {
  vec2 uv = (vUv - 0.5) * uScale + 0.5;
  vec3 c = texture2D(uSrc, uv + vec2(-uOff.x, -uOff.y)).rgb + texture2D(uSrc, uv + vec2(uOff.x, -uOff.y)).rgb
         + texture2D(uSrc, uv + vec2(-uOff.x, uOff.y)).rgb + texture2D(uSrc, uv + vec2(uOff.x, uOff.y)).rgb;
  gl_FragColor = vec4(c * 0.25, 1.0);
}`

const FS_BLUR = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uSrc;
uniform vec2 uDir;
void main() {
  vec3 acc = vec3(0.0); float ws = 0.0;
  for (int i = -6; i <= 6; i++) {
    float x = float(i); float w = exp(-x * x / 18.0);
    acc += texture2D(uSrc, vUv + uDir * x).rgb * w; ws += w;
  }
  gl_FragColor = vec4(acc / ws, 1.0);
}`

// Drop map: every droplet drawn once as an irregular shape. rg = position inside the drop as a vector (length 0 at the
// centre to 1 at the rim), b = radius / 24 px, a = 0.5 + random / 2. Halo (a < 0.5): thinner fog around big drops.
const VS_DROP_MAP = `
attribute vec2 aC;
attribute vec4 aP;
attribute vec4 aQ;
attribute vec3 aS;
uniform vec2 uRes;
uniform float uHalo;
varying vec2 vL;
varying vec4 vP;
varying vec4 vQ;
varying vec3 vS;
void main() {
  float ext = uHalo > 0.5 ? aP.z * 1.9 : aP.z * (aP.w * 1.45 + 0.35) + 1.0;
  vec2 l = aC * ext;
  vL = l; vP = aP; vQ = aQ; vS = aS;
  vec2 px = aP.xy + l;
  gl_Position = vec4(px.x / uRes.x * 2.0 - 1.0, 1.0 - px.y / uRes.y * 2.0, 0.0, 1.0);
}`
const FS_DROP_MAP = `
precision highp float;
varying vec2 vL;
varying vec4 vP;
varying vec4 vQ;
varying vec3 vS;
uniform float uHalo, uErase;
void main() {
  vec2 p = vL;
  float r = vP.z, ex = vP.w, ang = vQ.x;
  if (uHalo > 0.5) {
    float d = length(p) / r;
    if (d < 1.0) discard;
    float s = (1.0 - smoothstep(1.05, 1.9, d)) * clamp((r - 2.0) / 3.5, 0.0, 1.0);
    if (s < 0.02) discard;
    gl_FragColor = vec4(0.5, 0.5, 0.0, s * 0.45);
    return;
  }
  vec2 pp = p;
  if (pp.y > 0.0) pp.y /= 1.0 + vS.y;
  float c = cos(ang), s = sin(ang);
  vec2 q = vec2(c * pp.x + s * pp.y, -s * pp.x + c * pp.y);
  q.x /= ex;
  float th = atan(q.y, q.x);
  float rr = r * (1.0 + vQ.y * cos(2.0 * th + vQ.z) + vQ.w * cos(3.0 * th + vS.x));
  vec2 nq = q / rr;
  float d = length(nq);
  if (d >= 1.0) discard;
  if (uErase > 0.5) { gl_FragColor = vec4(0.5, 0.5, 0.0, 0.0); return; }
  vec2 g = vec2(nq.x / ex, nq.y);
  vec2 ns = vec2(c * g.x - s * g.y, s * g.x + c * g.y);
  ns = normalize(ns + vec2(1e-5)) * d;
  gl_FragColor = vec4(ns * 0.5 + 0.5, clamp(r / 24.0, 0.0, 1.0), 0.5 + 0.5 * vS.z);
}`

// Shared by the pane and the running drops. A drop is a small lens: it shows a little upside-down piece of the scene,
// a rim and a highlight. Rim and shadow follow the brightness behind the drop: on a bright ground real drops show a
// fine, light edge, not a dark ring.
const GL_COMMON = `
precision highp float;
uniform vec2 uRes;
uniform float uDpr;
uniform vec3 uTint;
uniform sampler2D uSharp;
const vec3 LH = vec3(-0.36, -0.56, 0.75);
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
// a soft shoulder for the lights of fog and drops: on white they keep grain and drops instead of clipping
vec3 shoulder(vec3 c) {
  vec3 k = max(c - 0.86, 0.0);
  return c - k + 0.14 * (1.0 - exp(-k / 0.14));
}
vec3 lens(vec2 px, vec2 n, float d, float rc, vec3 haze, vec3 glow) {
  vec2 c = px - n * rc;
  vec3 v = texture2D(uSharp, (c - n * rc * 2.7) / uRes).rgb;
  float z = sqrt(max(1.0 - d * d, 0.0));
  vec3 nn = normalize(vec3(n * 1.2, z));
  float gr = smoothstep(1.0, 5.5, rc);
  float bright = smoothstep(0.42, 0.88, dot(haze, vec3(0.299, 0.587, 0.114)));
  float rim = smoothstep(mix(0.58, 0.74, bright), 1.0, d);
  v = mix(v, haze, mix(0.72, 0.05, gr) + 0.22 * rim * rim);
  v *= 1.0 - (0.18 + 0.4 * gr) * mix(1.0, 0.5, bright) * rim * rim;
  v += glow * (1.0 - rim) * 0.4 * gr + vec3(0.07) * bright * (1.0 - rim) * gr;
  float spec = pow(max(dot(nn, normalize(LH)), 0.0), 90.0);
  v += vec3(spec * (0.45 + 0.9 * gr)) + vec3(0.05) * smoothstep(0.3, 0.95, n.y) * (1.0 - rim) * gr;
  return shoulder(v);
}
`

const FS_PANE = `
varying vec2 vUv;
uniform sampler2D uBg, uBlur, uFog, uDropMap, uDropMapOld;
uniform vec2 uFogSize, uBgScale;
uniform float uDensity, uGrain, uFade;
vec4 cubicW(float v) {
  vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v; vec4 s = n * n * n;
  float x = s.x; float y = s.y - 4.0 * s.x; float z = s.z - 4.0 * s.y + 6.0 * s.x; float w = 6.0 - x - y - z;
  return vec4(x, y, z, w) * (1.0 / 6.0);
}
vec2 fogTex(vec2 uv) {
  vec2 tc = uv * uFogSize - 0.5; vec2 f = fract(tc); tc -= f;
  vec4 xc = cubicW(f.x); vec4 yc = cubicW(f.y);
  vec4 c = tc.xxyy + vec2(-0.5, 1.5).xyxy;
  vec4 s = vec4(xc.xz + xc.yw, yc.xz + yc.yw);
  vec4 o = (c + vec4(xc.yw, yc.yw) / s) / uFogSize.xxyy;
  vec2 s0 = texture2D(uFog, o.xz).ra; vec2 s1 = texture2D(uFog, o.yz).ra;
  vec2 s2 = texture2D(uFog, o.xw).ra; vec2 s3 = texture2D(uFog, o.yw).ra;
  float sx = s.x / (s.x + s.y); float sy = s.z / (s.z + s.w);
  return mix(mix(s3, s2, sx), mix(s1, s0, sx), sy);
}
float dropAt(vec4 m, float fv, out vec2 nn, out float dp, out float rc) {
  nn = vec2(0.0); dp = 0.0; rc = 0.0;
  if (m.a < 0.5) return 0.0;
  vec2 n = m.rg * 2.0 - 1.0; float d = length(n);
  float rpx = m.b * 24.0; float rnd = m.a * 2.0 - 1.0;
  float thr = 0.04 + 0.5 * smoothstep(0.6, 8.0, rpx) + 0.12 * rnd;
  float g = smoothstep(thr, thr + 0.3, fv);
  dp = d / max(g, 0.001);
  if (dp >= 1.0) return 0.0;
  rc = rpx * g;
  nn = n / max(g, 0.001);
  return clamp((1.0 - dp) * rc * uDpr * 1.5, 0.0, 1.0);
}
void main() {
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  vec2 px = uv * uRes;
  vec2 fr = fogTex(uv);
  float F = fr.x * 1.3;
  float thick = fr.y;
  float fog = clamp(F, 0.0, 1.0);
  float ring = clamp((F - 1.0) / 0.2, 0.0, 1.0);
  float ed = min(min(px.x, uRes.x - px.x), min(px.y, uRes.y - px.y));
  float frame = (1.0 - smoothstep(0.0, 110.0, ed)) * 0.6 + smoothstep(0.55, 1.0, uv.y) * 0.4;
  float lum = dot(uTint, vec3(0.299, 0.587, 0.114));
  vec3 tintMul = mix(vec3(1.0), uTint / lum, 0.5);
  float hz = mix(0.12, 0.56, uDensity) * (0.78 + 0.44 * thick) + 0.12 * frame + 0.07 * ring;
  float op = fog * mix(0.84, 1.0, uDensity);
  float h1 = hash12(floor(px * uDpr * 0.85));
  float h2 = hash12(floor(px * 0.45) + 17.0);
  float grainV = (h1 * 0.62 + h2 * 0.38 - 0.5) * uGrain;
  vec4 m = texture2D(uDropMap, vUv);
  float halo = m.a < 0.5 ? m.a / 0.45 : 0.0;
  op *= 1.0 - 0.2 * halo;
  float fv = F * (0.9 + 0.2 * thick) + 0.25 * ring;
  vec2 nn; float dp, rc;
  float cov = dropAt(m, fv, nn, dp, rc);
  float sheen = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * 0.8 + uv.y * 0.6 - 0.5) * 2.6);
  vec3 clear = texture2D(uBg, (uv - 0.5) * uBgScale + 0.5).rgb;
  vec3 blur = texture2D(uBlur, uv).rgb;
  float bl = dot(blur, vec3(0.299, 0.587, 0.114));
  float hl = mix(0.38, 1.0, smoothstep(0.02, 0.55, bl));
  vec3 milk = mix(blur * tintMul, uTint * hl, clamp(hz * (1.0 + grainV * 0.5), 0.0, 0.92)) + blur * blur * 0.18;
  milk *= 1.0 + grainV * 0.14;
  milk += step(0.993, h1) * 0.1 * uGrain;
  milk = shoulder(milk);
  vec3 col = mix(clear, milk, op);
  vec3 outCol = cov > 0.0 ? mix(col, lens(px, nn, dp, rc, milk, blur * blur), cov) : col;
  if (uFade < 0.999) {
    vec2 na; float da, ra;
    float ca = dropAt(texture2D(uDropMapOld, vUv), fv, na, da, ra);
    vec3 prev = ca > 0.0 ? mix(col, lens(px, na, da, ra, milk, blur * blur), ca) : col;
    outCol = mix(prev, outCol, uFade);
  }
  gl_FragColor = vec4(outCol + 0.03 * sheen, 1.0);
}`

const VS_DROP = `
attribute vec2 aC;
attribute vec4 aD;
uniform vec2 uRes;
varying vec2 vQ;
varying vec4 vD;
varying vec2 vPx;
void main() {
  vec2 q = vec2(aC.x * 1.3, aC.y < 0.0 ? aC.y * 1.3 * (1.0 + aD.w) : aC.y * 1.3);
  vec2 px = aD.xy + q * aD.z;
  vQ = q; vD = aD; vPx = px;
  gl_Position = vec4(px.x / uRes.x * 2.0 - 1.0, 1.0 - px.y / uRes.y * 2.0, 0.0, 1.0);
}`
const FS_DROP = `
varying vec2 vQ;
varying vec4 vD;
varying vec2 vPx;
uniform sampler2D uBlur;
void main() {
  vec2 q = vQ; float st = vD.w; float r = vD.z;
  float t = q.y < 0.0 ? clamp(-q.y / (1.0 + st), 0.0, 1.0) : 0.0;
  float taper = 1.0 - 0.42 * t * t * min(st, 1.0);
  vec2 e = vec2(q.x / taper, q.y < 0.0 ? q.y / (1.0 + st) : q.y);
  float d = length(e);
  float aa = 1.5 / (r * uDpr);
  float cover = 1.0 - smoothstep(1.0 - aa, 1.0, d);
  if (cover <= 0.0) discard;
  vec3 blur = texture2D(uBlur, vPx / uRes).rgb;
  vec3 v = lens(vPx, e, d, r, mix(blur, uTint, 0.35), blur * blur);
  gl_FragColor = vec4(v * cover, cover);
}`

interface Prog {
    p: WebGLProgram
    u: Record<string, WebGLUniformLocation | null>
    a: Record<string, number>
}
interface Fb {
    t: WebGLTexture
    fb: WebGLFramebuffer
    w: number
    h: number
}
interface Stage {
    n: number
    X: Float32Array
    Y: Float32Array
    R: Float32Array
    EX: Float32Array
    AN: Float32Array
    /** per drop eleven values for the GPU: centre, radius, length, angle, waves of the shape, pear, random */
    attribs: Float32Array
    buf: WebGLBuffer | null
}
interface Runner {
    x: number
    y: number
    r: number
    mode: "sitting" | "running"
    t: number
    v: number
    pause: number
    travelled: number
    dripAt: number
    ph: number
    rest: boolean
    k: number
    jerk: number
}

const TG = 24
const STAGE_MIN = 10
const STAGE_MAX = 18
const R_RUN = 3.0
const R_STOP = 1.9
const MAX_DROPS = 360
/** pixels of the drawing surface at most: big Retina screens draw a little softer, maps and buffers stay small */
const MAX_PIXELS = 4.0e6
const CORNERS = [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]
const stageFor = (r: number) => Math.round(lerp(STAGE_MIN, STAGE_MAX, clamp(r, 0, 1)))
/** fixed start for the droplets: the same size always shows the same pane (rule: fixed variations) */
const SEED = 7919
/** cross-fade from the last picture to a new scene */
const FADE_MS = 300
/** seeds or drops per slice of a simulation step (QA-3) */
const SLICE = 1024
/** pixels of a picture per upload task: about 10 ms with a four times slower CPU (QA-3) */
const BAND_PX = 256 * 1024

// the buffer is kept between pictures, so a running drop only redraws its own part (Audit 1)
const GL_ATTRS: WebGLContextAttributes = { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: true }

/**
 * A fresh canvas with its WebGL context for every start (a context given back on unmount is never reused). It is made
 * one task before the rest of the start, because the first context of a page can take a while on its own (Audit 6).
 */
function glassCanvas(doc: Document): HTMLCanvasElement {
    const cv = doc.createElement("canvas")
    cv.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;display:block"
    if (!cv.getContext("webgl", GL_ATTRS)) throw new GlassFault("WebGL is off in this browser")
    return cv
}
/** gives a canvas from glassCanvas back when no glass was made with it */
function releaseCanvas(cv: HTMLCanvasElement) {
    cv.getContext("webgl")?.getExtension("WEBGL_lose_context")?.loseContext()
    cv.remove()
}

function createGlass(root: HTMLDivElement, layer: HTMLDivElement, cv: HTMLCanvasElement, ringEl: HTMLDivElement | null, still: boolean, hooks: Hooks): Glass {
    const doc = root.ownerDocument
    const win = doc.defaultView ?? window
    const ctx = cv.getContext("webgl", GL_ATTRS)
    if (!ctx) throw new GlassFault("WebGL is off in this browser")
    const gl: WebGLRenderingContext = ctx
    layer.appendChild(cv)

    // ---------------------------------------------------------------- state on the CPU (kept when the GPU context is lost)
    let look: Look = { density: 0.72, droplets: 0.5, brush: 56, refog: 14, blur: 16, grain: 0.2, tint: -0.2, drips: 0.55 }
    let mode: Mode = { touch: "both", mouse: "move", wipe: true }
    let bgColor = "#E4E1DB"
    /** the fill as canvas 2D understands it (see solidFill) */
    let bgFill = "#E4E1DB"
    let W = 0
    let H = 0
    let S = 1
    let cell = 2
    let fw = 0
    let fh = 0
    let rb = 6
    let F = new Float32Array(0)
    let NZ = new Float32Array(0)
    let TH = new Float32Array(0)
    let BN = new Float32Array(0)
    let TMP = new Float32Array(0)
    let fogBytes = new Uint8Array(0)
    /** every cell that is not exactly 1 (fogged) lies in this rectangle of cells: [x0, y0, x1, y1] */
    let open: number[] | null = null
    /** rows of the field to upload: [y0, y1], or everything */
    let rows: number[] | null = null
    let fieldAll = true
    let fogUpLeft = 0
    // droplets of the field
    let STAGES: (Stage | undefined)[] = []
    let stage = 0
    let sk = 1
    const TF = { n: 0, X: new Float32Array(0), Y: new Float32Array(0), R: new Float32Array(0), EX: new Float32Array(0), AN: new Float32Array(0), alive: new Uint8Array(0), gw: 0, gh: 0, grid: [] as number[][], gridStale: true }
    /** drops that went with the brush or a running drop: they grow back where the fog returns */
    let removed: number[] = []
    const eraseList: number[] = []
    const regrowList: number[] = []
    const runners: Runner[] = []
    let water = 0
    // the picture behind the glass
    let srcImg: HTMLImageElement | null = null
    /** the values of a scene whose picture is still on its way: they switch together with it */
    let pendingLook: Look | null = null
    /** the next picture swap fades over the last one (a scene change, not a resize) */
    let fadeNext = false
    let fadeCv: HTMLCanvasElement | null = null
    let fadeTimer = 0
    /** files of other scenes, fetched ahead (sized address to file) */
    const blobCache = new Map<string, Blob>()
    /** files of other scenes on their way ahead: address to abort */
    const preloads = new Map<string, () => void>()
    /** the file of srcImg as data, for bitmaps decoded off the main thread */
    let srcBlob: { img: HTMLImageElement; blob: Blob } | null = null
    let srcPos: [number, number] = [0.5, 0.5]
    let srcCanvas: HTMLCanvasElement | null = null
    let srcVideo: HTMLVideoElement | null = null
    let videoUrl = ""
    let sourceToken = 0
    let bgW = 1
    let bgH = 1
    let blurDirty = true
    // loop
    let raf = 0
    let last = 0
    let elapsed = 0
    let visible = true
    let alive = true
    let lost = false
    let drawn = false
    let dirty = true
    let fade = 1
    let refogAcc = 0
    let refogChanging = false
    let regrowAcc = 0
    let slideTimer = 0
    let lastInput = 0
    let simTimer = 0
    let cropTimer = 0
    /** the next band of a picture on its way to the GPU */
    let upTimer = 0
    let simJob: { step: () => boolean } | null = null
    let dropMapMissing = false
    let bgReady = false
    let wasClear = false
    /** the part of the picture that changed, in CSS pixels, or the whole picture */
    let dirtyPx: number[] | null = null
    let dirtyFull = true
    const reduced = () => reducedMotion()
    const markFull = () => {
        dirtyFull = true
        dirty = true
    }
    const markPx = (x0: number, y0: number, x1: number, y1: number) => {
        dirtyPx = dirtyPx ? [Math.min(dirtyPx[0], x0), Math.min(dirtyPx[1], y0), Math.max(dirtyPx[2], x1), Math.max(dirtyPx[3], y1)] : [x0, y0, x1, y1]
        dirty = true
    }
    const markDrop = (x: number, y: number, r: number) => markPx(x - r * 2.2 - 3, y - r * 4 - 3, x + r * 2.2 + 3, y + r * 2.2 + 3)

    // ---------------------------------------------------------------- GPU resources
    let INST: ANGLE_instanced_arrays | null = null
    const need = <T,>(v: T | null, what: string): T => {
        if (v === null) throw new GlassFault(`${what} could not be created`)
        return v
    }
    // Programs are compiled in parallel where the browser can (KHR_parallel_shader_compile): the loop only asks whether
    // they are done, so compiling never blocks the page (Audit 6). Without the extension they are checked at once.
    // Fetched again in initGL: after a lost context the old extension object no longer counts.
    let PAR: KHR_parallel_shader_compile | null = null
    interface Pending {
        name: keyof typeof P
        p: WebGLProgram
        vs: WebGLShader
        fs: WebGLShader
        attrs: string[]
    }
    let pending: Pending[] = []
    let progsReady = false
    function compile(type: number, src: string): WebGLShader {
        const sh = need(gl.createShader(type), "a shader")
        gl.shaderSource(sh, src)
        gl.compileShader(sh)
        return sh
    }
    function beginProgram(name: keyof typeof P, vs: string, fs: string, attrs: string[]): Pending {
        const p = need(gl.createProgram(), "a program")
        const v = compile(gl.VERTEX_SHADER, vs)
        const f = compile(gl.FRAGMENT_SHADER, fs)
        gl.attachShader(p, v)
        gl.attachShader(p, f)
        gl.linkProgram(p)
        return { name, p, vs: v, fs: f, attrs }
    }
    /** true when every program is done; then their uniforms and attributes are looked up */
    function programsDone(): boolean {
        if (progsReady) return true
        const par = PAR
        if (par && pending.some((q) => !gl.getProgramParameter(q.p, par.COMPLETION_STATUS_KHR))) return false
        for (const q of pending) {
            if (!gl.getProgramParameter(q.p, gl.LINK_STATUS) && !gl.isContextLost()) {
                const log = gl.getShaderInfoLog(q.fs) || gl.getShaderInfoLog(q.vs) || gl.getProgramInfoLog(q.p) || ""
                throw new GlassFault(`a shader did not compile: ${log.split("\n")[0]}`)
            }
            P[q.name] = lookup(q.p, q.attrs)
        }
        pending = []
        progsReady = true
        return true
    }
    function lookup(p: WebGLProgram, attrs: string[]): Prog {
        const u: Record<string, WebGLUniformLocation | null> = {}
        const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) as number
        for (let i = 0; i < n; i++) {
            const info = gl.getActiveUniform(p, i)
            if (info) u[info.name] = gl.getUniformLocation(p, info.name)
        }
        const a: Record<string, number> = {}
        for (const name of attrs) a[name] = gl.getAttribLocation(p, name)
        return { p, u, a }
    }
    function tex(w: number, h: number, data: ArrayBufferView | null, format: number, nearest: boolean): WebGLTexture {
        const t = need(gl.createTexture(), "a texture")
        const f = nearest ? gl.NEAREST : gl.LINEAR
        gl.bindTexture(gl.TEXTURE_2D, t)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        if (w) gl.texImage2D(gl.TEXTURE_2D, 0, format, w, h, 0, format, gl.UNSIGNED_BYTE, data)
        return t
    }
    function fbo(w: number, h: number, nearest: boolean): Fb {
        const t = tex(w, h, null, gl.RGBA, nearest)
        const fb = need(gl.createFramebuffer(), "a frame buffer")
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        return { t, fb, w, h }
    }
    const freeFbo = (f: Fb | null) => {
        if (!f) return
        gl.deleteTexture(f.t)
        gl.deleteFramebuffer(f.fb)
    }
    let P = {} as Record<"down" | "blur" | "dropMap" | "pane" | "drop", Prog>
    let triBuf: WebGLBuffer | null = null
    let cornerBuf: WebGLBuffer | null = null
    let dropBuf: WebGLBuffer | null = null
    let dropMapBuf: WebGLBuffer | null = null
    let eraseBuf: WebGLBuffer | null = null
    let bgTex: WebGLTexture | null = null
    let fogTex: WebGLTexture | null = null
    let D2: Fb | null = null
    let D4: Fb | null = null
    let BA: Fb | null = null
    let BB: Fb | null = null
    let DROP_MAP: Fb | null = null
    let DROP_MAP_OLD: Fb | null = null
    const dropData = new Float32Array(MAX_DROPS * 6 * 6)
    let dropMapVerts = new Float32Array(0)

    function initGL() {
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
        INST = gl.getExtension("ANGLE_instanced_arrays")
        PAR = gl.getExtension("KHR_parallel_shader_compile")
        progsReady = false
        pending = [
            beginProgram("pane", VS_FULL, GL_COMMON + FS_PANE, ["aPos"]),
            beginProgram("dropMap", VS_DROP_MAP, FS_DROP_MAP, ["aC", "aP", "aQ", "aS"]),
            beginProgram("down", VS_FULL, FS_DOWN, ["aPos"]),
            beginProgram("blur", VS_FULL, FS_BLUR, ["aPos"]),
            beginProgram("drop", VS_DROP, GL_COMMON + FS_DROP, ["aC", "aD"]),
        ]
        triBuf = need(gl.createBuffer(), "a buffer")
        gl.bindBuffer(gl.ARRAY_BUFFER, triBuf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
        cornerBuf = need(gl.createBuffer(), "a buffer")
        gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(CORNERS), gl.STATIC_DRAW)
        dropBuf = need(gl.createBuffer(), "a buffer")
        gl.bindBuffer(gl.ARRAY_BUFFER, dropBuf)
        gl.bufferData(gl.ARRAY_BUFFER, dropData.byteLength, gl.DYNAMIC_DRAW)
        dropMapBuf = need(gl.createBuffer(), "a buffer")
        eraseBuf = need(gl.createBuffer(), "a buffer")
        bgTex = tex(1, 1, new Uint8Array([20, 22, 28, 255]), gl.RGBA, false)
        fogTex = tex(1, 1, new Uint8Array([255, 128]), gl.LUMINANCE_ALPHA, false)
        D2 = D4 = BA = BB = DROP_MAP = DROP_MAP_OLD = null
        for (const q of STAGES) if (q) q.buf = null
        fieldAll = true
        blurDirty = true
        markFull()
    }

    function drawFull(pr: Prog) {
        gl.bindBuffer(gl.ARRAY_BUFFER, triBuf)
        const loc = pr.a.aPos
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
        gl.disableVertexAttribArray(loc)
    }
    function bgScale(): [number, number] {
        const ia = bgW / bgH
        const sa = W / H
        return ia > sa ? [sa / ia, 1] : [1, ia / sa]
    }
    // Blur: shrink twice (D2 is also the picture inside the drops), then blur twice in both directions
    function computeBlur() {
        if (!progsReady || !D2 || !D4 || !BA || !BB) return
        gl.disable(gl.BLEND)
        const sc = bgScale()
        const pd = P.down
        gl.useProgram(pd.p)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, bgTex)
        gl.uniform1i(pd.u.uSrc, 0)
        gl.bindFramebuffer(gl.FRAMEBUFFER, D2.fb)
        gl.viewport(0, 0, D2.w, D2.h)
        gl.uniform2f(pd.u.uScale, sc[0], sc[1])
        gl.uniform2f(pd.u.uOff, (0.25 / D2.w) * sc[0], (0.25 / D2.h) * sc[1])
        drawFull(pd)
        gl.bindTexture(gl.TEXTURE_2D, D2.t)
        gl.bindFramebuffer(gl.FRAMEBUFFER, D4.fb)
        gl.viewport(0, 0, D4.w, D4.h)
        gl.uniform2f(pd.u.uScale, 1, 1)
        gl.uniform2f(pd.u.uOff, 0.25 / D4.w, 0.25 / D4.h)
        drawFull(pd)
        const pb = P.blur
        gl.useProgram(pb.p)
        gl.uniform1i(pb.u.uSrc, 0)
        const sigmaT = look.blur / 4
        const step = Math.max(0.35, sigmaT / (3 * Math.SQRT2))
        let src: Fb = D4
        for (let it = 0; it < 2; it++) {
            gl.bindTexture(gl.TEXTURE_2D, src.t)
            gl.bindFramebuffer(gl.FRAMEBUFFER, BA.fb)
            gl.viewport(0, 0, BA.w, BA.h)
            gl.uniform2f(pb.u.uDir, step / BA.w, 0)
            drawFull(pb)
            gl.bindTexture(gl.TEXTURE_2D, BA.t)
            gl.bindFramebuffer(gl.FRAMEBUFFER, BB.fb)
            gl.uniform2f(pb.u.uDir, 0, step / BB.h)
            drawFull(pb)
            src = BB
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        blurDirty = false
    }

    // ---------------------------------------------------------------- droplets of the field (simulated in steps)
    // Droplets nucleate, grow (faster at the bottom), merge on contact (volume kept, the shape gets longer); too heavy
    // ones run down and eat a lane where only young ones follow. Nucleation is patchy (Audit 3): some places dense,
    // some sparse, like a real pane. One step per call, so the work spreads over frames (Audit 6).
    function simulation(seed: number, w: number, h: number) {
        let s = seed
        const rnd = () => {
            s = (s * 16807) % 2147483647
            return s / 2147483647
        }
        const sks = clamp(Math.sqrt(w * h) / 900, 0.6, 1)
        const SW = w / sks
        const SH = h / sks
        const area = SW * SH
        const cap = Math.ceil(area * 0.0016 * STAGE_MAX) + 64
        const X = new Float32Array(cap)
        const Y = new Float32Array(cap)
        const R = new Float32Array(cap)
        const EX = new Float32Array(cap)
        const AN = new Float32Array(cap)
        const GF = new Float32Array(cap)
        const U2 = new Float32Array(cap)
        const P2 = new Float32Array(cap)
        const U3 = new Float32Array(cap)
        const P3 = new Float32Array(cap)
        const RN = new Float32Array(cap)
        const al = new Uint8Array(cap)
        const gw = Math.ceil(SW / TG) + 1
        const gh = Math.ceil(SH / TG) + 1
        const grid: number[][] = Array.from({ length: gw * gh }, () => [])
        const cellOf = (x: number, y: number) => clamp(Math.floor(y / TG), 0, gh - 1) * gw + clamp(Math.floor(x / TG), 0, gw - 1)
        const near = (x: number, y: number, rad: number, out: number[]) => {
            out.length = 0
            const c0 = Math.max(0, Math.floor((x - rad) / TG))
            const c1 = Math.min(gw - 1, Math.floor((x + rad) / TG))
            const r0 = Math.max(0, Math.floor((y - rad) / TG))
            const r1 = Math.min(gh - 1, Math.floor((y + rad) / TG))
            for (let gy = r0; gy <= r1; gy++)
                for (let gx = c0; gx <= c1; gx++) {
                    const c = grid[gy * gw + gx]
                    for (let k = 0; k < c.length; k++) out.push(c[k])
                }
            return out
        }
        const unbin = (i: number) => {
            const c = grid[cellOf(X[i], Y[i])]
            const k = c.indexOf(i)
            if (k >= 0) {
                c[k] = c[c.length - 1]
                c.pop()
            }
        }
        const remove = (i: number) => {
            unbin(i)
            al[i] = 0
        }
        let n = 0
        const tmp: number[] = []
        const add = (x: number, y: number, r: number) => {
            const i = n++
            X[i] = x
            Y[i] = y
            R[i] = r
            EX[i] = 1
            AN[i] = 0
            GF[i] = Math.exp((rnd() - 0.5) * 1.2) * (0.75 + 0.5 * vnoise(x / 240, y / 240, 37))
            U2[i] = rnd()
            P2[i] = rnd() * 6.283
            U3[i] = rnd()
            P3[i] = rnd() * 6.283
            RN[i] = rnd()
            al[i] = 1
            grid[cellOf(x, y)].push(i)
            return i
        }
        const merge = (i: number) => {
            let merged = true
            while (merged) {
                merged = false
                near(X[i], Y[i], R[i] + 12, tmp)
                for (const j of tmp) {
                    if (j === i || !al[j]) continue
                    const dx = X[j] - X[i]
                    const dy = Y[j] - Y[i]
                    const rr = R[i] + R[j]
                    if (dx * dx + dy * dy < rr * rr * 0.9) {
                        const vi = R[i] ** 3
                        const vj = R[j] ** 3
                        const v = vi + vj
                        const ratio = Math.min(R[i], R[j]) / Math.max(R[i], R[j])
                        unbin(i)
                        X[i] = (X[i] * vi + X[j] * vj) / v
                        Y[i] = (Y[i] * vi + Y[j] * vj) / v
                        R[i] = Math.cbrt(v)
                        GF[i] = (GF[i] * vi + GF[j] * vj) / v
                        const e = 1 + 0.55 * ratio ** 1.5
                        if (e > EX[i]) {
                            EX[i] = e
                            AN[i] = Math.atan2(dy, dx)
                        } else EX[i] = 1 + (EX[i] - 1) * 0.8
                        grid[cellOf(X[i], Y[i])].push(i)
                        remove(j)
                        merged = true
                        break
                    }
                }
            }
        }
        const stages: (Stage | undefined)[] = []
        let st = 0
        // One step of the field pauses after every SLICE seeds or drops, so a frame never waits for a whole large pane
        // (QA-3); the order of the random numbers stays, and with it every field.
        function* steps(): Generator<void, void, void> {
            for (;;) {
                const seeds = Math.round(area * 0.0016)
                for (let k = 0; k < seeds; k++) {
                    if (k % SLICE === SLICE - 1) yield
                    const x = rnd() * SW
                    let y = rnd() * SH
                    if (rnd() < 0.35) y = SH - rnd() * rnd() * SH
                    if (rnd() > 0.3 + 0.7 * vnoise(x / 170, y / 170, 31)) continue
                    near(x, y, 10, tmp)
                    let vacant = true
                    for (const j of tmp) {
                        const dx = X[j] - x
                        const dy = Y[j] - y
                        if (dx * dx + dy * dy < R[j] * R[j]) {
                            vacant = false
                            break
                        }
                    }
                    if (vacant && n < cap) merge(add(x, y, 0.35 + rnd() * 0.25))
                }
                for (let i = 0; i < n; i++) {
                    if (i % SLICE === SLICE - 1) yield
                    if (!al[i]) continue
                    const r0 = R[i]
                    R[i] = r0 + (0.1 * GF[i] * (1 + (2.2 * Y[i]) / SH)) / (1 + 0.3 * r0)
                    if (R[i] > 1.2) merge(i)
                    EX[i] = 1 + (EX[i] - 1) * 0.985
                    if (al[i] && R[i] > 12.5 + 1.5 * Math.sin(i * 12.9898)) {
                        // too heavy: runs down and eats a lane
                        let x = X[i]
                        let y = Y[i]
                        let r = R[i]
                        remove(i)
                        while (y < SH + 10 && r > 1.6) {
                            near(x, y, r + 10, tmp)
                            for (const j of tmp) {
                                if (!al[j]) continue
                                const dx = X[j] - x
                                const dy = Y[j] - y
                                const rr = r + R[j]
                                if (dx * dx + dy * dy < rr * rr * 0.8) {
                                    r = Math.cbrt(r ** 3 + R[j] ** 3 * 0.6)
                                    remove(j)
                                }
                            }
                            y += 2
                            x += (rnd() - 0.5) * 0.9
                            r -= 0.03
                        }
                    }
                }
                st++
                // keep this step as a stage, already scaled to the pane
                if (st >= STAGE_MIN) {
                    let m = 0
                    for (let i = 0; i < n; i++) m += al[i]
                    const q: Stage = { n: m, X: new Float32Array(m), Y: new Float32Array(m), R: new Float32Array(m), EX: new Float32Array(m), AN: new Float32Array(m), attribs: new Float32Array(m * 11), buf: null }
                    let k = 0
                    for (let i = 0; i < n; i++) {
                        if (!al[i]) continue
                        const rs = R[i]
                        const sz = smooth(1.5, 8, rs)
                        const o = k * 11
                        q.X[k] = X[i] * sks
                        q.Y[k] = Y[i] * sks
                        q.R[k] = R[i] * sks
                        q.EX[k] = EX[i]
                        q.AN[k] = AN[i]
                        q.attribs.set([q.X[k], q.Y[k], q.R[k], EX[i], AN[i], (0.02 + 0.1 * sz) * U2[i], P2[i], (0.015 + 0.07 * sz) * U3[i], P3[i], 0.16 * smooth(3, 9, rs), RN[i]], o)
                        k++
                    }
                    stages[st] = q
                }
                if (st >= STAGE_MAX) return
                yield
            }
        }
        const run = steps()
        /** a slice of the work; true once the last stage is there */
        const step = (): boolean => run.next().done === true
        return { step, stages, sks }
    }

    // the stage the runtime works on (running drops, the brush): its own copy of the positions and a grid
    function activateStage(st: number) {
        const q = STAGES[st]
        if (!q) return
        Object.assign(TF, { n: q.n, X: q.X, Y: q.Y, R: q.R, EX: q.EX, AN: q.AN, alive: new Uint8Array(q.n).fill(1), gw: Math.ceil(W / TG) + 1, gh: Math.ceil(H / TG) + 1, gridStale: true })
        stage = st
        removed = []
        eraseList.length = 0
        regrowList.length = 0
    }
    const tfCell = (x: number, y: number) => clamp(Math.floor(y / TG), 0, TF.gh - 1) * TF.gw + clamp(Math.floor(x / TG), 0, TF.gw - 1)
    function tfGrid() {
        if (!TF.gridStale) return
        TF.gridStale = false
        TF.grid = Array.from({ length: TF.gw * TF.gh }, () => [])
        for (let i = 0; i < TF.n; i++) if (TF.alive[i]) TF.grid[tfCell(TF.X[i], TF.Y[i])].push(i)
    }
    function tfNear(x: number, y: number, rad: number, out: number[]) {
        tfGrid()
        out.length = 0
        const c0 = Math.max(0, Math.floor((x - rad) / TG))
        const c1 = Math.min(TF.gw - 1, Math.floor((x + rad) / TG))
        const r0 = Math.max(0, Math.floor((y - rad) / TG))
        const r1 = Math.min(TF.gh - 1, Math.floor((y + rad) / TG))
        for (let gy = r0; gy <= r1; gy++)
            for (let gx = c0; gx <= c1; gx++) {
                const c = TF.grid[gy * TF.gw + gx]
                for (let k = 0; k < c.length; k++) out.push(c[k])
            }
        return out
    }
    function tfRemove(i: number) {
        tfGrid()
        const c = TF.grid[tfCell(TF.X[i], TF.Y[i])]
        const k = c.indexOf(i)
        if (k >= 0) {
            c[k] = c[c.length - 1]
            c.pop()
        }
        TF.alive[i] = 0
        eraseList.push(i)
        removed.push(i)
    }

    // the drop map on the GPU: halos, then drops, every drop one instance of the same quad
    function drawDropMap(attribs: Float32Array, buf: WebGLBuffer | null, count: number, halo: boolean, erase: boolean) {
        if (!count) return
        const pr = P.dropMap
        gl.useProgram(pr.p)
        gl.uniform2f(pr.u.uRes, W, H)
        gl.uniform1f(pr.u.uHalo, halo ? 1 : 0)
        gl.uniform1f(pr.u.uErase, erase ? 1 : 0)
        const at: [string, number, number][] = [
            ["aP", 4, 0],
            ["aQ", 4, 16],
            ["aS", 3, 32],
        ]
        if (INST && buf) {
            const inst = INST
            gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuf)
            gl.enableVertexAttribArray(pr.a.aC)
            gl.vertexAttribPointer(pr.a.aC, 2, gl.FLOAT, false, 0, 0)
            gl.bindBuffer(gl.ARRAY_BUFFER, buf)
            const locs = at.map(([name, size, off]) => {
                const l = pr.a[name]
                gl.enableVertexAttribArray(l)
                gl.vertexAttribPointer(l, size, gl.FLOAT, false, 44, off)
                inst.vertexAttribDivisorANGLE(l, 1)
                return l
            })
            inst.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, count)
            for (const l of locs) {
                inst.vertexAttribDivisorANGLE(l, 0)
                gl.disableVertexAttribArray(l)
            }
            gl.disableVertexAttribArray(pr.a.aC)
            return
        }
        // without instancing: every quad written out (six corners per drop)
        const needLen = count * 78
        if (dropMapVerts.length < needLen) dropMapVerts = new Float32Array(needLen)
        let k = 0
        for (let a = 0; a < count; a++)
            for (let c = 0; c < 12; c += 2) {
                dropMapVerts[k++] = CORNERS[c]
                dropMapVerts[k++] = CORNERS[c + 1]
                for (let j = 0; j < 11; j++) dropMapVerts[k++] = attribs[a * 11 + j]
            }
        gl.bindBuffer(gl.ARRAY_BUFFER, dropMapBuf)
        gl.bufferData(gl.ARRAY_BUFFER, dropMapVerts.subarray(0, k), gl.STREAM_DRAW)
        const all: [string, number, number][] = [["aC", 2, 0], ...at.map(([name, size, off]): [string, number, number] => [name, size, off + 8])]
        const locs = all.map(([name, size, off]) => {
            const l = pr.a[name]
            gl.enableVertexAttribArray(l)
            gl.vertexAttribPointer(l, size, gl.FLOAT, false, 52, off)
            return l
        })
        gl.drawArrays(gl.TRIANGLES, 0, k / 13)
        for (const l of locs) gl.disableVertexAttribArray(l)
    }
    // two maps: when the stage changes, the current one becomes the old one and fades out, the new one fades in
    function buildDropMap(gentle: boolean) {
        let fresh = false
        if (!DROP_MAP || DROP_MAP.w !== cv.width || DROP_MAP.h !== cv.height) {
            if (DROP_MAP_OLD !== DROP_MAP) freeFbo(DROP_MAP)
            DROP_MAP = fbo(cv.width, cv.height, true)
            if (still) DROP_MAP_OLD = DROP_MAP
            fresh = true
        }
        // in the editor one map is enough (no fading between stages); live a second one for the fade
        if (!still && (!DROP_MAP_OLD || DROP_MAP_OLD === DROP_MAP || DROP_MAP_OLD.w !== cv.width || DROP_MAP_OLD.h !== cv.height)) {
            if (DROP_MAP_OLD && DROP_MAP_OLD !== DROP_MAP) freeFbo(DROP_MAP_OLD)
            DROP_MAP_OLD = fbo(cv.width, cv.height, true)
            fresh = true
        }
        if (gentle && !fresh && !reduced() && !still && DROP_MAP_OLD) {
            const t = DROP_MAP
            DROP_MAP = DROP_MAP_OLD
            DROP_MAP_OLD = t
            fade = 0
        } else fade = 1
        gl.bindFramebuffer(gl.FRAMEBUFFER, DROP_MAP.fb)
        gl.viewport(0, 0, DROP_MAP.w, DROP_MAP.h)
        gl.disable(gl.BLEND)
        gl.clearColor(0.5, 0.5, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        const q = STAGES[stage]
        if (q && q.n) {
            if (INST && !q.buf) {
                q.buf = gl.createBuffer()
                gl.bindBuffer(gl.ARRAY_BUFFER, q.buf)
                gl.bufferData(gl.ARRAY_BUFFER, q.attribs, gl.STATIC_DRAW)
            }
            drawDropMap(q.attribs, q.buf, q.n, true, false)
            drawDropMap(q.attribs, q.buf, q.n, false, false)
            // drops that are gone stay gone until the fog comes back
            const gone = removed.filter((i) => !TF.alive[i])
            if (gone.length) drawList(gone, true)
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        eraseList.length = 0
        regrowList.length = 0
        markFull()
    }
    // removed drops (erase) or drops that grow back (draw again), straight into the current map
    function drawList(list: number[], erase: boolean) {
        const q = STAGES[stage]
        if (!q || !DROP_MAP || !list.length) return
        const d = new Float32Array(list.length * 11)
        list.forEach((i, a) => {
            d.set(q.attribs.subarray(i * 11, i * 11 + 11), a * 11)
            markPx(q.X[i] - q.R[i] * 2.4 - 2, q.Y[i] - q.R[i] * 2.4 - 2, q.X[i] + q.R[i] * 2.4 + 2, q.Y[i] + q.R[i] * 2.4 + 2)
        })
        if (INST) {
            gl.bindBuffer(gl.ARRAY_BUFFER, eraseBuf)
            gl.bufferData(gl.ARRAY_BUFFER, d, gl.DYNAMIC_DRAW)
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, DROP_MAP.fb)
        gl.viewport(0, 0, DROP_MAP.w, DROP_MAP.h)
        gl.disable(gl.BLEND)
        drawDropMap(d, eraseBuf, list.length, false, erase)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }
    function syncDropMap() {
        if (eraseList.length) {
            drawList(eraseList, true)
            eraseList.length = 0
        }
        if (regrowList.length) {
            drawList(regrowList, false)
            regrowList.length = 0
        }
    }
    // where the fog is back, the drops that went with the brush grow again (the shader lets them grow with the fog)
    function regrowDrops() {
        if (!removed.length) return
        const kept: number[] = []
        for (const i of removed) {
            if (TF.alive[i]) continue
            if (fogAt(TF.X[i], TF.Y[i]) > 0.55) {
                TF.alive[i] = 1
                tfGrid()
                TF.grid[tfCell(TF.X[i], TF.Y[i])].push(i)
                regrowList.push(i)
            } else kept.push(i)
        }
        removed = kept
        if (regrowList.length) dirty = true
    }
    function changeStage() {
        const st = stageFor(look.droplets)
        if (!STAGES[st] || st === stage) return
        activateStage(st)
        if (progsReady) buildDropMap(true)
        else dropMapMissing = true
        wake()
    }
    function newDropField(seed: number) {
        const job = simulation(seed, W, H)
        STAGES = []
        let finished = false
        simJob = {
            step: () => {
                if (finished) return true
                finished = job.step()
                for (let st = STAGE_MIN; st <= STAGE_MAX; st++) if (job.stages[st] && !STAGES[st]) STAGES[st] = job.stages[st]
                sk = job.sks
                const aim = stageFor(look.droplets)
                if (STAGES[aim] && stage !== aim) {
                    activateStage(aim)
                    if (progsReady) buildDropMap(drawn)
                    else dropMapMissing = true
                }
                return finished
            },
        }
    }
    function simWork(budget: number) {
        if (!simJob) return
        const t0 = performance.now()
        do {
            if (simJob.step()) {
                simJob = null
                break
            }
        } while (performance.now() - t0 < budget)
    }

    // ---------------------------------------------------------------- fog field on the CPU
    function createField() {
        const oldF = F
        const oldW = fw
        const oldH = fh
        const oldCell = cell
        cell = W * H > 900 * 650 ? 3 : 2
        fw = Math.ceil(W / cell) + 1
        fh = Math.ceil(H / cell) + 1
        const n = fw * fh
        F = new Float32Array(n)
        NZ = new Float32Array(n)
        TH = new Float32Array(n)
        BN = new Float32Array(n)
        TMP = new Float32Array(n)
        fogBytes = new Uint8Array(n * 2)
        rb = Math.max(3, Math.round(16 / cell))
        open = null
        const n46 = new Float64Array(fw)
        const n13 = new Float64Array(fw)
        const n190 = new Float64Array(fw)
        const n55 = new Float64Array(fw)
        for (let j = 0; j < fh; j++) {
            const y = j * cell
            noiseRow(n46, fw, cell, y, 46, 3)
            noiseRow(n13, fw, cell, y, 13, 5)
            noiseRow(n190, fw, cell, y, 190, 11)
            noiseRow(n55, fw, cell, y, 55, 13)
            for (let i = 0; i < fw; i++) {
                const x = i * cell
                const k = j * fw + i
                NZ[k] = 0.35 + 1.1 * (0.65 * n46[i] + 0.35 * n13[i])
                TH[k] = 0.6 * n190[i] + 0.4 * n55[i]
                if (oldF.length) {
                    const ai = Math.min(oldW - 1, Math.round(x / oldCell))
                    const aj = Math.min(oldH - 1, Math.round(y / oldCell))
                    F[k] = oldF[aj * oldW + ai]
                } else F[k] = 1
                if (F[k] !== 1) grow(i, j, i, j)
            }
        }
        for (let k = 0; k < n; k++) fogBytes[k * 2 + 1] = TH[k] * 255
        fieldAll = true
    }
    const fogAt = (x: number, y: number) => {
        const i = clamp(Math.round(x / cell), 0, fw - 1)
        const j = clamp(Math.round(y / cell), 0, fh - 1)
        return F[j * fw + i]
    }
    /** widen the open rectangle (cells) */
    function grow(x0: number, y0: number, x1: number, y1: number) {
        x0 = clamp(x0, 0, fw - 1)
        x1 = clamp(x1, 0, fw - 1)
        y0 = clamp(y0, 0, fh - 1)
        y1 = clamp(y1, 0, fh - 1)
        if (!open) open = [x0, y0, x1, y1]
        else open = [Math.min(open[0], x0), Math.min(open[1], y0), Math.max(open[2], x1), Math.max(open[3], y1)]
    }
    const markRows = (y0: number, y1: number) => {
        rows = rows ? [Math.min(rows[0], y0), Math.max(rows[1], y1)] : [y0, y1]
    }
    // box filter over the open part of the field; outside the pane counts as fogged (so the fog also comes from the edge)
    function neighbours(x0: number, y0: number, x1: number, y1: number) {
        const w = fw
        const h = fh
        const r = rb
        const inv = 1 / (2 * r + 1)
        const ya = Math.max(0, y0 - r)
        const yb = Math.min(h - 1, y1 + r)
        const at = (row: number, x: number) => (x < 0 || x >= w ? 1 : Math.min(1, F[row + x]))
        for (let y = ya; y <= yb; y++) {
            const row = y * w
            let s = 0
            for (let k = x0 - r; k <= x0 + r; k++) s += at(row, k)
            for (let x = x0; x <= x1; x++) {
                TMP[row + x] = s * inv
                s += at(row, x + r + 1) - at(row, x - r)
            }
        }
        for (let x = x0; x <= x1; x++) {
            let s = 0
            const tv = (y: number) => (y < 0 || y >= h ? 1 : y < ya || y > yb ? 1 : TMP[y * w + x])
            for (let k = y0 - r; k <= y0 + r; k++) s += tv(k)
            for (let y = y0; y <= y1; y++) {
                BN[y * w + x] = s * inv
                s += tv(y + r + 1) - tv(y - r)
            }
        }
    }
    /** the fog comes back; returns whether anything changed */
    function refogStep(dt: number): boolean {
        if (!open) return false
        const [x0, y0, x1, y1] = open
        let changed = false
        let nx0 = fw
        let ny0 = fh
        let nx1 = -1
        let ny1 = -1
        if (fogUpLeft > 0) {
            fogUpLeft -= dt
            // the last step closes the glass completely, so the state reads fogged right when Fog up ends
            const a = reduced() || fogUpLeft <= 0 ? 1 : Math.min(1, dt * 3.5)
            for (let y = y0; y <= y1; y++)
                for (let x = x0; x <= x1; x++) {
                    const k = y * fw + x
                    const f = F[k]
                    if (f < 1) {
                        const fn = f + (1 - f) * a
                        F[k] = fn > 0.999 ? 1 : fn
                        changed = true
                    } else if (f > 1) F[k] = 1
                    if (F[k] !== 1) {
                        if (x < nx0) nx0 = x
                        if (x > nx1) nx1 = x
                        if (y < ny0) ny0 = y
                        if (y > ny1) ny1 = y
                    }
                }
            for (const d of runners) d.r -= dt * 3
        } else {
            // nobody wipes: trails always fog up again, with Refog 0 at its default pace
            const secs = look.refog > 0 ? look.refog : mode.wipe ? 0 : D.refog
            const on = secs > 0
            if (on) neighbours(x0, y0, x1, y1)
            const k0 = on ? dt / secs : 0
            for (let y = y0; y <= y1; y++)
                for (let x = x0; x <= x1; x++) {
                    const k = y * fw + x
                    const f = F[k]
                    if (f > 1) {
                        const fn = Math.max(1, f - dt * 0.035)
                        F[k] = fn
                        changed = true
                        if (fn === 1) continue
                    } else if (f < 1 && on) {
                        const nb = BN[k]
                        const g = k0 * (0.5 * NZ[k] + 3.4 * nb * nb) * (1.06 - f)
                        const fn = Math.min(1, f + g)
                        F[k] = fn > 0.9995 ? 1 : fn
                        changed = true
                    }
                    if (F[k] !== 1) {
                        if (x < nx0) nx0 = x
                        if (x > nx1) nx1 = x
                        if (y < ny0) ny0 = y
                        if (y > ny1) ny1 = y
                    }
                }
        }
        if (changed) {
            markRows(y0, y1)
            markPx((x0 - 3) * cell, (y0 - 3) * cell, (x1 + 3) * cell, (y1 + 3) * cell)
        }
        open = nx1 >= 0 ? [nx0, ny0, nx1, ny1] : null
        return changed
    }

    // the brush: soft, with fine streaks in the wiping direction; it pushes the water to the edge and takes the drops
    // under it along (Audit 4), only tiny ones may stay at its very edge
    const nearby: number[] = []
    function stamp(x: number, y: number, R: number, dx: number, dy: number, strength: number, seed: number) {
        const cx = x / cell
        const cy = y / cell
        const rc = R / cell
        const rOut = rc * 1.38
        const x0 = Math.max(0, Math.floor(cx - rOut))
        const x1 = Math.min(fw - 1, Math.ceil(cx + rOut))
        const y0 = Math.max(0, Math.floor(cy - rOut))
        const y1 = Math.min(fh - 1, Math.ceil(cy + rOut))
        if (x1 < x0 || y1 < y0) return
        const soft = reduced() ? 0.15 : 0.5
        for (let j = y0; j <= y1; j++)
            for (let i = x0; i <= x1; i++) {
                const ox = i - cx
                const oy = j - cy
                const d = Math.sqrt(ox * ox + oy * oy)
                if (d > rOut) continue
                const k = j * fw + i
                const f = F[k]
                if (d < rc) {
                    const a = strength * (1 - smooth(soft, 1, d / rc + (NZ[k] - 0.9) * 0.17))
                    if (a <= 0) continue
                    const perp = (ox * -dy + oy * dx) * cell
                    const s = Math.pow(vnoise(perp / 2.6 + seed, seed * 0.37, 21), 3)
                    const fn = Math.min(f, Math.max(f * (1 - a), 0.13 * s * a))
                    water += (Math.min(f, 1) - Math.min(fn, 1)) * cell * cell
                    F[k] = fn
                } else if (f > 0.55 && !reduced()) {
                    F[k] = Math.min(1.2, f + 0.02 * f * (1 - (d - rc) / (rOut - rc)))
                }
            }
        grow(x0, y0, x1, y1)
        markRows(y0, y1)
        markPx((x0 - 3) * cell, (y0 - 3) * cell, (x1 + 3) * cell, (y1 + 3) * cell)
        if (TF.n) {
            tfNear(x, y, R * 1.05, nearby)
            for (const j of nearby) {
                if (!TF.alive[j]) continue
                const ddx = TF.X[j] - x
                const ddy = TF.Y[j] - y
                const dd = Math.sqrt(ddx * ddx + ddy * ddy)
                if (dd < R * 0.92 || (dd < R * 1.05 && TF.R[j] > 1.2 * sk)) {
                    water += TF.R[j] * TF.R[j] * 1.5
                    tfRemove(j)
                }
            }
        }
        for (let i = runners.length - 1; i >= 0; i--) {
            const d = runners[i]
            if ((d.x - x) ** 2 + (d.y - y) ** 2 < R * R * 0.8) {
                water += d.r * d.r * 3
                runners.splice(i, 1)
            }
        }
        // enough water: a drop at the lower edge of the brush
        const threshold = lerp(12000, 2200, look.drips)
        while (look.drips > 0 && !reduced() && water > threshold) {
            water -= threshold
            const ang = rand(0.12, 0.88) * Math.PI
            const px = x + Math.cos(ang) * R
            const py = y + Math.sin(ang) * R
            if (fogAt(px, py) < 0.45) continue
            addRunner(px, py, rand(2.3, 3.9) + look.drips * 0.7, false)
        }
    }
    let stroke: { x: number; y: number; seed: number; dx: number; dy: number; travelled: number } | null = null
    const strokeStart = (x: number, y: number) => {
        stroke = { x, y, seed: Math.random() * 1000, dx: 1, dy: 0, travelled: 0 }
    }
    function strokeTo(x: number, y: number) {
        if (!stroke) {
            strokeStart(x, y)
            return
        }
        const R = look.brush / 2
        const vx = x - stroke.x
        const vy = y - stroke.y
        const len = Math.hypot(vx, vy)
        if (len < 0.5) return
        stroke.dx = lerp(stroke.dx, vx / len, 0.35)
        stroke.dy = lerp(stroke.dy, vy / len, 0.35)
        const dl = Math.hypot(stroke.dx, stroke.dy) || 1
        const sp = Math.max(1.5, R * 0.22)
        const n = Math.ceil(len / sp)
        const st = reduced() ? 0.3 : 0.86
        for (let i = 1; i <= n; i++) {
            const t = i / n
            const rw = R * (0.9 + 0.2 * vnoise((stroke.travelled + len * t) / 38, stroke.seed, 7))
            stamp(stroke.x + vx * t, stroke.y + vy * t, rw, stroke.dx / dl, stroke.dy / dl, st, stroke.seed)
        }
        stroke.travelled += len
        stroke.x = x
        stroke.y = y
        lastInput = performance.now()
        wake()
    }
    const strokeEnd = () => {
        stroke = null
    }

    // ---------------------------------------------------------------- running drops
    function addRunner(x: number, y: number, r: number, immediate: boolean) {
        for (const d of runners) {
            if (d.mode === "sitting" && (d.x - x) ** 2 + (d.y - y) ** 2 < (d.r + r + 2) ** 2) {
                d.r = Math.min(6, Math.hypot(d.r, r))
                markDrop(d.x, d.y, d.r)
                return
            }
        }
        if (runners.length >= MAX_DROPS) {
            const i = runners.findIndex((d) => d.rest)
            if (i >= 0) runners.splice(i, 1)
            else return
        }
        runners.push({ x, y, r, mode: immediate ? "running" : "sitting", t: rand(0.3, 3.6), v: 0, pause: immediate ? rand(0, 0.4) : 0, travelled: 0, dripAt: rand(10, 24), ph: Math.random() * 6.28, rest: false, k: rand(0.55, 1.35), jerk: rand(0.4, 1.5) })
        markDrop(x, y, r)
    }
    // a big drop of the field gets too heavy and runs down
    function slideDown(): boolean {
        if (!TF.n) return false
        let best = -1
        for (let k = 0; k < 90; k++) {
            const i = Math.floor(Math.random() * TF.n)
            if (!TF.alive[i] || TF.R[i] < 4.2 * sk || TF.Y[i] < H * 0.18) continue
            if (fogAt(TF.X[i], TF.Y[i]) < 0.97) continue
            if (best < 0 || TF.R[i] > TF.R[best]) best = i
        }
        if (best < 0) return false
        tfRemove(best)
        addRunner(TF.X[best], TF.Y[best], TF.R[best] * 0.95, true)
        return true
    }
    /** one step of the running drops; returns whether anything moved or changed */
    function stepRunners(dt: number): boolean {
        if (reduced()) {
            const any = runners.length > 0
            runners.length = 0
            return any
        }
        let changed = false
        for (let i = runners.length - 1; i >= 0; i--) {
            const d = runners[i]
            if (d.mode === "sitting") {
                const f = fogAt(d.x, d.y)
                if (f > 0.85) {
                    markDrop(d.x, d.y, d.r)
                    d.r -= dt * (d.rest ? 0.5 : 0.25)
                    changed = true
                }
                if (d.r < 0.5) {
                    markDrop(d.x, d.y, 1)
                    runners.splice(i, 1)
                    changed = true
                    continue
                }
                if (!d.rest && d.r >= R_RUN) {
                    d.t -= dt
                    changed = true
                    if (d.t <= 0) {
                        d.mode = "running"
                        d.v = 0
                    }
                }
                continue
            }
            changed = true
            markDrop(d.x, d.y, d.r)
            if (d.pause > 0) {
                d.pause -= dt
                d.v *= Math.max(0, 1 - dt * 10)
            } else {
                const aim = (22 + 150 * clamp((d.r - R_STOP) / 3.4, 0, 1)) * d.k
                d.v += (aim - d.v) * Math.min(1, dt * 5)
                if (Math.random() < dt * 0.9 * d.jerk) d.pause = rand(0.06, 0.5)
            }
            const dy = d.v * dt
            const ox = d.x
            const oy = d.y
            d.y += dy
            // the trail wanders a little (Audit 8), like water finding its way
            d.x += (Math.sin(elapsed * 1.7 + d.ph + d.y * 0.05) * 0.14 + (vnoise(d.y / 34, d.ph * 10, 41) - 0.5) * 0.5) * dy
            const f = Math.min(1, fogAt(d.x, d.y + d.r))
            if (f > 0.25) {
                d.r += f * dy * 0.004
                d.v *= 1 - Math.min(0.9, dt * 1.2 * f)
            }
            d.r -= dy * 0.0034
            trail(ox, oy, d.x, d.y, Math.max(2.2, d.r * (0.8 + 0.2 * vnoise(d.y / 22, d.ph, 43))))
            // eats the drops of the field on its way and gets heavier
            if (TF.n && dy > 0) {
                tfNear(d.x, d.y, d.r + 12, nearby)
                for (const j of nearby) {
                    if (!TF.alive[j]) continue
                    const ex = TF.X[j] - d.x
                    const ey = TF.Y[j] - d.y
                    const rr = d.r + TF.R[j]
                    if (ex * ex + ey * ey < rr * rr * 0.75) {
                        d.r = Math.min(6.5, Math.cbrt(d.r ** 3 + TF.R[j] ** 3 * 0.7))
                        tfRemove(j)
                    }
                }
            }
            d.travelled += dy
            if (d.travelled > d.dripAt) {
                d.travelled = 0
                d.dripAt = rand(10, 28)
                if (runners.length < MAX_DROPS) {
                    runners.push({ x: d.x + rand(-0.4, 0.4), y: d.y - d.r * 1.1, r: rand(0.55, 1.1), mode: "sitting", t: 0, v: 0, pause: 0, travelled: 0, dripAt: 0, ph: 0, rest: true, k: 1, jerk: 1 })
                    markDrop(d.x, d.y - d.r * 1.1, 1.2)
                }
                d.r -= 0.05
            }
            for (let j = runners.length - 1; j >= 0; j--) {
                const o = runners[j]
                if (o === d || o.mode !== "sitting") continue
                const rr = d.r + o.r * 0.7
                if ((o.x - d.x) ** 2 + (o.y - d.y) ** 2 < rr * rr && o.y > d.y - d.r) {
                    markDrop(o.x, o.y, o.r)
                    d.r = Math.min(6.5, Math.hypot(d.r, o.r))
                    runners.splice(j, 1)
                    if (j < i) i--
                }
            }
            if (d.r < R_STOP) {
                d.mode = "sitting"
                d.rest = true
                d.v = 0
            }
            markDrop(d.x, d.y, d.r)
            if (d.y - d.r > H + 4) runners.splice(runners.indexOf(d), 1)
        }
        return changed
    }
    // the trail of a running drop: a narrow clear lane that slowly fogs up again
    function trail(x0: number, y0: number, x1: number, y1: number, hw: number) {
        const c0x = Math.min(x0, x1) - hw
        const c1x = Math.max(x0, x1) + hw
        const c0y = Math.min(y0, y1) - hw
        const c1y = Math.max(y0, y1) + hw
        const i0 = Math.max(0, Math.floor(c0x / cell))
        const i1 = Math.min(fw - 1, Math.ceil(c1x / cell))
        const j0 = Math.max(0, Math.floor(c0y / cell))
        const j1 = Math.min(fh - 1, Math.ceil(c1y / cell))
        if (i1 < i0 || j1 < j0) return
        const vx = x1 - x0
        const vy = y1 - y0
        const l2 = vx * vx + vy * vy || 1
        for (let j = j0; j <= j1; j++)
            for (let i = i0; i <= i1; i++) {
                const px = i * cell
                const py = j * cell
                const t = clamp(((px - x0) * vx + (py - y0) * vy) / l2, 0, 1)
                const d = Math.hypot(px - (x0 + vx * t), py - (y0 + vy * t))
                if (d > hw + cell) continue
                const a = 1 - smooth(hw * 0.55, hw + cell, d)
                const k = j * fw + i
                F[k] = Math.min(F[k], F[k] * (1 - 0.92 * a))
            }
        grow(i0, j0, i1, j1)
        markRows(j0, j1)
        markPx((i0 - 3) * cell, (j0 - 3) * cell, (i1 + 3) * cell, (j1 + 3) * cell)
    }

    // ---------------------------------------------------------------- size
    function resize() {
        const w = root.clientWidth
        const h = root.clientHeight
        if (!w || !h) return
        // the editor shows Desktop, Tablet and Phone side by side: fewer pixels there
        const dpr = Math.min(still ? 1.5 : 2, win.devicePixelRatio || 1)
        const s = Math.min(dpr, Math.sqrt((still ? MAX_PIXELS * 0.6 : MAX_PIXELS) / (w * h)))
        if (w === W && h === H && Math.abs(s - S) < 0.01) return
        const first = W === 0
        W = w
        H = h
        S = s
        cv.width = Math.max(1, Math.round(W * S))
        cv.height = Math.max(1, Math.round(H * S))
        allocate()
        createField()
        if (first) newDropField(SEED)
        else {
            if (progsReady && STAGES[stage]) buildDropMap(false)
            win.clearTimeout(simTimer)
            simTimer = win.setTimeout(() => {
                newDropField(SEED)
                wake()
            }, 250)
            win.clearTimeout(cropTimer)
            cropTimer = win.setTimeout(() => {
                if (srcImg) crop(srcImg)
                wake()
            }, 150)
        }
        markFull()
        wake()
    }
    function allocate() {
        freeFbo(D2)
        freeFbo(D4)
        freeFbo(BA)
        freeFbo(BB)
        D2 = fbo(Math.ceil(W / 2), Math.ceil(H / 2), false)
        D4 = fbo(Math.ceil(W / 4), Math.ceil(H / 4), false)
        BA = fbo(D4.w, D4.h, false)
        BB = fbo(D4.w, D4.h, false)
        if (STAGES[stage] && progsReady) buildDropMap(false)
        else if (STAGES[stage]) dropMapMissing = true
        blurDirty = true
    }

    // ---------------------------------------------------------------- the picture behind the glass
    function setBg(src: TexImageSource, w: number, h: number) {
        gl.bindTexture(gl.TEXTURE_2D, bgTex)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src)
        bgW = w
        bgH = h
        blurDirty = true
        bgReady = true
        markFull()
    }
    // a small preview and the brightness, for the panel; `part` cuts the source first (a picture: straight from the
    // source, never read back from the large canvas on the GPU)
    function analyse(src: CanvasImageSource, w: number, h: number, part?: [number, number, number, number]) {
        const t = doc.createElement("canvas")
        t.width = 120
        t.height = 80
        const x = t.getContext("2d", { willReadFrequently: true })
        if (!x) return
        const k = Math.max(120 / w, 80 / h)
        if (part) x.drawImage(src, part[0], part[1], part[2], part[3], (120 - w * k) / 2, (80 - h * k) / 2, w * k, h * k)
        else x.drawImage(src, (120 - w * k) / 2, (80 - h * k) / 2, w * k, h * k)
        let thumb = ""
        let bright = 0.5
        try {
            const d = x.getImageData(0, 0, 120, 80).data
            let sum = 0
            for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]
            bright = sum / (d.length / 4) / 255
            thumb = t.toDataURL("image/jpeg", 0.85)
        } catch (e) {
            // a picture from another origin without CORS cannot be read back (SecurityError): no preview, medium light;
            // anything else is reported, the picture stays
            if (!(e instanceof DOMException)) report(typeof HTMLVideoElement !== "undefined" && src instanceof HTMLVideoElement ? "video" : "picture", "unexpected", message(e))
        }
        hooks.scene({ dark: bright < 0.3, thumb })
    }
    /**
     * The visible part of the picture (cover, at its position) at the pane's size, on Fill (Audit 7). Cut and scaled
     * by the browser off the main thread where it can (createImageBitmap), so big pictures cause no long task.
     */
    let cropToken = 0
    /**
     * The fill as canvas 2D understands it. A color style arrives as var(--token-…, rgb(…)), which canvas 2D ignores (the
     * picture would turn black), so the browser resolves it on a hidden element first; a fill with no opacity at all falls
     * back to the default, as it would show black behind transparent pictures.
     */
    function solidFill(c: string): string {
        const probe = doc.createElement("span")
        probe.style.display = "none"
        probe.style.color = c
        layer.appendChild(probe)
        const resolved = win.getComputedStyle(probe).color
        probe.remove()
        const x = doc.createElement("canvas").getContext("2d")
        if (!x) return resolved
        x.fillStyle = resolved
        x.fillRect(0, 0, 1, 1)
        const [r, g, b, a] = x.getImageData(0, 0, 1, 1).data
        return a === 0 ? DEFAULT_FILL : `rgb(${r}, ${g}, ${b})`
    }
    function crop(img: HTMLImageElement) {
        const iw = img.naturalWidth
        const ih = img.naturalHeight
        if (!iw || !ih || !W || !H) return
        const max = Math.min(4096, (gl.getParameter(gl.MAX_TEXTURE_SIZE) as number) || 4096)
        const cw = Math.min(max, Math.round(W * S))
        const ch = Math.min(max, Math.round(H * S))
        const s = Math.max(cw / iw, ch / ih)
        const sw = cw / s
        const sh = ch / s
        const sx = (iw - sw) * srcPos[0]
        const sy = (ih - sh) * srcPos[1]
        const token = ++cropToken
        win.clearTimeout(upTimer)
        // The cut is decoded and scaled off the main thread, then goes to the GPU in bands of rows, one task each, into a
        // texture of its own that replaces the picture only when complete. One upload of the whole cut took 70 to 200 ms
        // on large Retina panes with a slow CPU (QA-3).
        const upload = (bmp: ImageBitmap | null) => {
            // a context the browser took away before webglcontextlost arrived counts as lost (FP-12: tex() would throw)
            const current = () => alive && !lost && !gl.isContextLost() && token === cropToken && srcImg === img
            if (!current()) {
                bmp?.close()
                return
            }
            const band = doc.createElement("canvas")
            const rows = Math.max(16, Math.floor(BAND_PX / cw))
            band.width = cw
            band.height = Math.min(rows, ch)
            // in memory: the bitmap is in memory too, so each band is a plain copy
            const x = band.getContext("2d", { willReadFrequently: true })
            if (!x) {
                bmp?.close()
                return
            }
            const t = tex(cw, ch, null, gl.RGBA, false)
            let y = 0
            const next = () => {
                upTimer = 0
                if (!current()) {
                    bmp?.close()
                    gl.deleteTexture(t)
                    return
                }
                const bh = Math.min(rows, ch - y)
                if (band.height !== bh) band.height = bh
                x.fillStyle = bgFill
                x.fillRect(0, 0, cw, bh)
                x.imageSmoothingQuality = "high"
                if (bmp) {
                    // a browser that ignores the resize options hands over the cut in its own size
                    const k = bmp.height / ch
                    x.drawImage(bmp, 0, y * k, bmp.width, bh * k, 0, 0, cw, bh)
                } else x.drawImage(img, sx, sy + y / s, sw, bh / s, 0, 0, cw, bh)
                gl.bindTexture(gl.TEXTURE_2D, t)
                gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y, gl.RGBA, gl.UNSIGNED_BYTE, band)
                y += bh
                if (y < ch) {
                    upTimer = win.setTimeout(next, 0)
                    return
                }
                if (needsAnalysis) {
                    needsAnalysis = false
                    if (bmp) analyse(bmp, bmp.width, bmp.height)
                    else analyse(img, cw, ch, [sx, sy, sw, sh])
                }
                bmp?.close()
                if (srcVideo) gl.deleteTexture(t)
                else {
                    takeScene()
                    fillOnly = false
                    if (bgTex) gl.deleteTexture(bgTex)
                    bgTex = t
                    bgW = cw
                    bgH = ch
                    blurDirty = true
                    bgReady = true
                    markFull()
                }
                wake()
            }
            upTimer = win.setTimeout(next, 0)
        }
        if (typeof win.createImageBitmap === "function") {
            // "high" scales on the main thread in Chrome, "medium" does not
            const opt: ImageBitmapOptions = { resizeWidth: cw, resizeHeight: ch, resizeQuality: "medium" }
            const made = srcBlob && srcBlob.img === img ? win.createImageBitmap(srcBlob.blob, sx, sy, sw, sh, opt) : win.createImageBitmap(img, sx, sy, sw, sh, opt)
            made.then(upload, (e: unknown) => {
                // a browser without the resize options draws the cut itself; anything else is reported, and the cut is
                // drawn anyway
                if (!(e instanceof DOMException || e instanceof TypeError)) report("picture", "unexpected", message(e))
                upload(null)
            })
        } else upload(null)
    }
    let needsAnalysis = false
    function stopVideo() {
        videoToken = -1
        if (srcVideo) {
            srcVideo.pause()
            srcVideo.removeAttribute("src")
            srcVideo.load()
        }
        srcVideo = null
        if (videoUrl.startsWith("blob:")) URL.revokeObjectURL(videoUrl)
        videoUrl = ""
    }
    /** no picture (empty Image, a failed load, a video before its first frame): only the fill colour under the fog,
     * never a motif of our own (Jan and Konsti, 26.10.2026; K B-1) */
    let fillOnly = false
    function showFill() {
        srcImg = null
        srcBlob = null
        fillOnly = true
        const c = srcCanvas ?? doc.createElement("canvas")
        srcCanvas = c
        c.width = 16
        c.height = 16
        const x = c.getContext("2d")
        if (x) {
            x.fillStyle = bgFill
            x.fillRect(0, 0, 16, 16)
        }
        takeScene()
        setBg(c, c.width, c.height)
        analyse(c, c.width, c.height)
        wake()
    }
    // loads in flight: each one cancels its timer, its handlers and its download; it leaves the set when it finishes,
    // and a new source or the unmount cancels the rest (FP-4)
    const loads = new Set<() => void>()
    function cancelLoads() {
        for (const cancel of [...loads]) cancel()
    }
    // ---------------------------------------------------------------- loading and its errors, in one place
    // Every load runs through here: a picture, a video, a file fetched ahead or once more as data. Each has a time limit
    // (FP-4) and comes only from an allowed host (FP-5), and every failure ends in report(): the editor canvas names the
    // reason, a visitor's own file gets a short note, and the pane falls back (fill, poster or the scene before), never
    // to a broken or empty area. Expected browser errors (TypeError, DOMException) are handled where they occur;
    // anything else is reported as unexpected instead of being thrown into the page (FP-8).
    const maxTex = (gl.getParameter(gl.MAX_TEXTURE_SIZE) as number) || 4096
    function report(what: LoadWhat, kind: LoadKind, detail = "") {
        hooks.sourceError({ what, kind, reason: loadReason(what, kind, detail) })
    }
    const message = (e: unknown) => (e instanceof Error ? e.message : String(e))
    /**
     * A file as data, or null; never throws. Offline, a refusal, an error status, the time limit or an abort mean no
     * file, and the caller falls back without a word (the picture itself loads and reports on its own way); only an
     * unexpected error is reported.
     */
    function fetchFile(url: string, ms: number, what: LoadWhat): { done: Promise<Blob | null>; abort: () => void } {
        if (typeof win.fetch !== "function" || typeof AbortController === "undefined") return { done: Promise.resolve(null), abort: () => undefined }
        const ac = new AbortController()
        const timer = win.setTimeout(() => ac.abort(), ms)
        const done = win
            .fetch(url, { signal: ac.signal })
            .then((r) => (r.ok ? r.blob() : null))
            .then(
                (b) => {
                    win.clearTimeout(timer)
                    return b
                },
                (e: unknown) => {
                    win.clearTimeout(timer)
                    if (!(e instanceof TypeError || e instanceof DOMException)) report(what, "unexpected", message(e))
                    return null
                }
            )
        return { done, abort: () => ac.abort() }
    }
    /** the source whose video is on screen: a poster that arrives later leaves it alone */
    let videoToken = -1
    /** brings the poster back when the browser refuses to start the video */
    let posterAgain: (() => void) | null = null
    /**
     * Starts a video. A refused start (autoplay blocked, e.g. on an iPhone in Low Power Mode) brings the poster back, so
     * the picture stands as when the video does not load; a start interrupted by a pause changes nothing. Both arrive as
     * a DOMException; anything else is reported (report()).
     */
    function play(v: HTMLVideoElement) {
        // reduced motion: the video keeps its first picture (QA-6). iOS fetches data only after play(), so a video
        // without a picture yet starts once and stops here as soon as its first picture is there (loadeddata).
        if (reduced() && v.readyState >= 2) {
            v.pause()
            return
        }
        v.play().catch((e: unknown) => {
            if (!(e instanceof DOMException)) {
                report("video", "unexpected", message(e))
                return
            }
            if (e.name !== "NotAllowedError" || srcVideo !== v || !posterAgain) return
            const again = posterAgain
            posterAgain = null
            stopVideo()
            again()
        })
    }
    function loadImage(url: string, pos: [number, number], token: number, fallback: () => void, revoke: boolean, poster = false) {
        if (!allowedUrl(url)) {
            report("picture", "blocked")
            fallback()
            return
        }
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.decoding = "async"
        let aheadBlob: Blob | null = null
        let aheadUrl = ""
        let done = false
        const stop = (keepUrl = false) => {
            done = true
            win.clearTimeout(timer)
            img.onload = null
            img.onerror = null
            loads.delete(cancel)
            if (revoke && !keepUrl) URL.revokeObjectURL(url)
            if (aheadUrl) URL.revokeObjectURL(aheadUrl)
        }
        const cancel = () => {
            if (done) return
            stop()
            img.removeAttribute("src")
        }
        const timer = win.setTimeout(() => finish("timeout"), 15000)
        loads.add(cancel)
        /** null: loaded; otherwise why not */
        function finish(fail: LoadKind | null) {
            const ok = fail === null
            if (done) return
            stop(ok)
            if (!alive || token !== sourceToken) {
                if (revoke) URL.revokeObjectURL(url)
                return
            }
            // the video of this source already plays: its poster stays out of the way (FR-1)
            const videoShows = poster && videoToken === token
            if (fail) {
                report("picture", fail)
                if (!videoShows) fallback()
                takeScene()
                return
            }
            if (videoShows) {
                if (revoke) URL.revokeObjectURL(url)
                return
            }
            stopVideo()
            srcImg = img
            srcPos = pos
            needsAnalysis = true
            // The file once more, now out of the cache, as data: a bitmap made from it decodes and scales off the main
            // thread; one made from the <img> decodes on it (Chrome, up to 250 ms on a slow CPU, QA-3). Without it the
            // <img> serves.
            const held = (blob: Blob | null) => {
                if (revoke) URL.revokeObjectURL(url)
                if (!alive || srcImg !== img) return
                srcBlob = blob ? { img, blob } : null
                crop(img)
            }
            // without the data (offline, refused, too slow) the <img> serves; the picture is there anyway
            if (aheadBlob) held(aheadBlob)
            else {
                // in the set of loads, so a new source or the unmount cancels it (FP-4)
                const again = fetchFile(img.currentSrc || img.src, 15000, "picture")
                loads.add(again.abort)
                void again.done.then((blob) => {
                    loads.delete(again.abort)
                    held(blob)
                })
            }
        }
        img.onload = () => finish(null)
        img.onerror = () => finish("broken")
        const need = Math.max(W, H) * S * 1.25
        const sized = sizedUrl(url, need)
        // fetched ahead (preload): the picture comes from memory, the network is not asked again
        const ahead = revoke ? undefined : blobCache.get(sized)
        if (ahead) {
            aheadBlob = ahead
            aheadUrl = URL.createObjectURL(ahead)
        }
        img.src = aheadUrl || sized
    }
    function loadVideo(url: string, token: number, fallback: () => void) {
        if (!allowedUrl(url)) {
            report("video", "blocked")
            fallback()
            return
        }
        const v = doc.createElement("video")
        v.crossOrigin = "anonymous"
        v.muted = true
        v.loop = true
        v.playsInline = true
        v.preload = "auto"
        v.setAttribute("muted", "")
        v.setAttribute("playsinline", "")
        let done = false
        const stop = () => {
            done = true
            win.clearTimeout(timer)
            v.onloadeddata = null
            v.onerror = null
            loads.delete(cancel)
        }
        const release = () => {
            v.pause()
            v.removeAttribute("src")
            v.load()
            if (url.startsWith("blob:")) URL.revokeObjectURL(url)
        }
        const cancel = () => {
            if (done) return
            stop()
            release()
        }
        const timer = win.setTimeout(() => finish("timeout"), 20000)
        loads.add(cancel)
        /** null: loaded; otherwise why not */
        function finish(fail: LoadKind | null) {
            if (done) return
            stop()
            if (!alive || token !== sourceToken) {
                release()
                return
            }
            // a frame larger than the GPU takes would stay black: the poster or the fill instead
            if (!fail && (v.videoWidth > maxTex || v.videoHeight > maxTex)) fail = "large"
            if (fail) {
                release()
                report("video", fail)
                fallback()
                takeScene()
                return
            }
            stopVideo()
            srcVideo = v
            videoUrl = url
            videoToken = token
            srcImg = null
            srcBlob = null
            takeScene()
            setBg(v, v.videoWidth, v.videoHeight)
            analyse(v, v.videoWidth, v.videoHeight)
            if (visible && !still) play(v)
            wake()
        }
        v.onloadeddata = () => finish(null)
        v.onerror = () => finish("broken")
        v.src = url
        v.load()
        // iOS Safari fetches video data only once playback is asked for; a muted inline video may start right away
        if (visible && !still) play(v)
    }
    // the last picture as a still on top, fading out over the new one (Handtest 25.10.2026: no jump between scenes)
    function crossfade() {
        if (!fadeNext) return
        fadeNext = false
        if (!drawn || still || lost || !visible || reduced() || !cv.width || !cv.height) return
        let c = fadeCv
        if (!c) {
            c = doc.createElement("canvas")
            c.setAttribute("aria-hidden", "true")
            Object.assign(c.style, { position: "absolute", left: "0", top: "0", width: "100%", height: "100%", pointerEvents: "none" })
            layer.appendChild(c)
            fadeCv = c
        }
        c.width = cv.width
        c.height = cv.height
        const x = c.getContext("2d")
        if (!x) return
        x.drawImage(cv, 0, 0)
        c.style.transition = "none"
        c.style.opacity = "1"
        c.style.display = "block"
        void c.offsetWidth
        c.style.transition = `opacity ${FADE_MS}ms ease`
        c.style.opacity = "0"
        win.clearTimeout(fadeTimer)
        fadeTimer = win.setTimeout(() => {
            if (!fadeCv) return
            fadeCv.style.display = "none"
            fadeCv.width = 1
            fadeCv.height = 1
        }, FADE_MS + 50)
    }
    /** the new picture is ready (or failed): the scene's values switch now, together with it */
    function takeScene() {
        crossfade()
        const l = pendingLook
        pendingLook = null
        if (l) applyLook(l)
    }
    function preload(urls: string[]) {
        if (still) return
        const need = Math.max(W, H) * S * 1.25
        for (const u of urls) {
            if (!u || u.startsWith("blob:") || !allowedUrl(u)) continue
            const src = sizedUrl(u, need)
            if (blobCache.has(src) || preloads.has(src)) continue
            const f = fetchFile(src, 15000, "picture")
            preloads.set(src, f.abort)
            // a file that does not come in time is simply not ahead: its scene loads it as usual and reports there
            void f.done.then((b) => {
                preloads.delete(src)
                if (b && alive) blobCache.set(src, b)
            })
        }
    }

    function setSource(s: Source, l?: Look) {
        const token = ++sourceToken
        cancelLoads()
        posterAgain = null
        // a scene change: the values wait for the picture, which fades in over the last one
        pendingLook = l ?? null
        fadeNext = !!l
        const none = () => {
            if (token === sourceToken) {
                stopVideo()
                showFill()
            }
        }
        if (s.kind === "none") none()
        else if (s.kind === "image") loadImage(s.url, [s.x, s.y], token, none, false)
        else if (s.kind === "video") {
            // the poster (or the drawn scene) first, the video on top as soon as it plays; a refused start brings the
            // poster back, without one the first frame stays
            const poster = s.poster
            if (poster.kind === "image") {
                loadImage(poster.url, [poster.x, poster.y], token, none, false, true)
                posterAgain = () => {
                    if (token === sourceToken) loadImage(poster.url, [poster.x, poster.y], token, none, false)
                }
            } else if (token === sourceToken) {
                stopVideo()
                showFill()
            }
            loadVideo(s.url, token, () => undefined)
        } else {
            const url = URL.createObjectURL(s.file)
            if (s.file.type.startsWith("video/")) loadVideo(url, token, () => undefined)
            else loadImage(url, [0.5, 0.5], token, () => undefined, true)
        }
    }

    // ---------------------------------------------------------------- drawing
    function render() {
        if (!progsReady || !DROP_MAP || !DROP_MAP_OLD || !BB || !D2 || !bgReady) return
        if (blurDirty || (srcVideo && !srcVideo.paused)) {
            computeBlur()
            dirtyFull = true
        }
        syncDropMap()
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.viewport(0, 0, cv.width, cv.height)
        gl.disable(gl.BLEND)
        // only the part that changed, unless that is most of the picture
        let scissor = false
        if (!dirtyFull && dirtyPx && drawn) {
            const x0 = clamp(Math.floor(dirtyPx[0] * S), 0, cv.width)
            const x1 = clamp(Math.ceil(dirtyPx[2] * S), 0, cv.width)
            const y0 = clamp(Math.floor(dirtyPx[1] * S), 0, cv.height)
            const y1 = clamp(Math.ceil(dirtyPx[3] * S), 0, cv.height)
            if (x1 <= x0 || y1 <= y0) {
                dirty = false
                dirtyPx = null
                return
            }
            if ((x1 - x0) * (y1 - y0) < cv.width * cv.height * 0.6) {
                gl.enable(gl.SCISSOR_TEST)
                gl.scissor(x0, cv.height - y1, x1 - x0, y1 - y0)
                scissor = true
            }
        }
        if (fieldAll || rows) {
            const y0 = fieldAll || !rows ? 0 : rows[0]
            const y1 = fieldAll || !rows ? fh - 1 : rows[1]
            for (let k = y0 * fw; k < (y1 + 1) * fw; k++) fogBytes[k * 2] = Math.min(255, F[k] * (255 / 1.3))
            gl.bindTexture(gl.TEXTURE_2D, fogTex)
            if (fieldAll) gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE_ALPHA, fw, fh, 0, gl.LUMINANCE_ALPHA, gl.UNSIGNED_BYTE, fogBytes)
            else gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y0, fw, y1 - y0 + 1, gl.LUMINANCE_ALPHA, gl.UNSIGNED_BYTE, fogBytes.subarray(y0 * fw * 2, (y1 + 1) * fw * 2))
            fieldAll = false
            rows = null
        }
        const sc = bgScale()
        const ti = tintRgb(look.tint)
        const pr = P.pane
        gl.useProgram(pr.p)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, bgTex)
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, BB.t)
        gl.activeTexture(gl.TEXTURE2)
        gl.bindTexture(gl.TEXTURE_2D, fogTex)
        gl.activeTexture(gl.TEXTURE3)
        gl.bindTexture(gl.TEXTURE_2D, DROP_MAP.t)
        gl.activeTexture(gl.TEXTURE4)
        gl.bindTexture(gl.TEXTURE_2D, D2.t)
        gl.activeTexture(gl.TEXTURE5)
        gl.bindTexture(gl.TEXTURE_2D, DROP_MAP_OLD.t)
        const u = pr.u
        gl.uniform1i(u.uBg, 0)
        gl.uniform1i(u.uBlur, 1)
        gl.uniform1i(u.uFog, 2)
        gl.uniform1i(u.uDropMap, 3)
        gl.uniform1i(u.uSharp, 4)
        gl.uniform1i(u.uDropMapOld, 5)
        gl.uniform1f(u.uFade, fade)
        gl.uniform2f(u.uRes, W, H)
        gl.uniform1f(u.uDpr, S)
        gl.uniform2f(u.uFogSize, fw, fh)
        gl.uniform2f(u.uBgScale, sc[0], sc[1])
        gl.uniform1f(u.uDensity, look.density)
        gl.uniform1f(u.uGrain, look.grain)
        gl.uniform3f(u.uTint, ti[0], ti[1], ti[2])
        drawFull(pr)
        if (runners.length) {
            let n = 0
            for (const d of runners) {
                const st = d.mode === "running" ? 0.25 + clamp(d.v / 110, 0, 1.4) : 0.06
                for (let c = 0; c < 12; c += 2) {
                    dropData[n++] = CORNERS[c]
                    dropData[n++] = CORNERS[c + 1]
                    dropData[n++] = d.x
                    dropData[n++] = d.y
                    dropData[n++] = Math.max(0.6, d.r)
                    dropData[n++] = st
                }
            }
            const dp = P.drop
            gl.useProgram(dp.p)
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
            gl.bindBuffer(gl.ARRAY_BUFFER, dropBuf)
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, dropData.subarray(0, n))
            gl.enableVertexAttribArray(dp.a.aC)
            gl.enableVertexAttribArray(dp.a.aD)
            gl.vertexAttribPointer(dp.a.aC, 2, gl.FLOAT, false, 24, 0)
            gl.vertexAttribPointer(dp.a.aD, 4, gl.FLOAT, false, 24, 8)
            gl.uniform1i(dp.u.uBlur, 1)
            gl.uniform1i(dp.u.uSharp, 4)
            gl.uniform2f(dp.u.uRes, W, H)
            gl.uniform1f(dp.u.uDpr, S)
            gl.uniform3f(dp.u.uTint, ti[0], ti[1], ti[2])
            gl.drawArrays(gl.TRIANGLES, 0, n / 6)
            gl.disableVertexAttribArray(dp.a.aC)
            gl.disableVertexAttribArray(dp.a.aD)
            gl.disable(gl.BLEND)
        }
        if (scissor) gl.disable(gl.SCISSOR_TEST)
        dirty = false
        dirtyFull = false
        dirtyPx = null
        if (!drawn && STAGES[stage]) {
            drawn = true
            hooks.drawn(true)
        }
    }

    /** runs a step that may find a shader the device rejects: the fault goes to the host, the loop stops */
    function guard(f: () => boolean): boolean | null {
        try {
            return f()
        } catch (e) {
            if (!(e instanceof GlassFault)) throw e
            alive = false
            hooks.fault(e.message)
            return null
        }
    }
    // ---------------------------------------------------------------- the loop: only while something changes (Audit 1)
    function wake() {
        if (raf || !alive || lost || still) {
            if (still && !raf && alive && !lost) raf = win.requestAnimationFrame(drawOnce)
            return
        }
        if (!visible) return
        win.clearTimeout(slideTimer)
        slideTimer = 0
        last = performance.now()
        raf = win.requestAnimationFrame(tick)
    }
    // in the editor: the work of the simulation in slices, then one picture, no loop
    /** programs finished compiling; a map waiting for them is drawn now */
    function ready(): boolean {
        if (!programsDone()) return false
        if (dropMapMissing && STAGES[stage]) {
            dropMapMissing = false
            buildDropMap(false)
        }
        return true
    }
    function drawOnce() {
        raf = 0
        if (!alive || lost) return
        const ok = guard(ready)
        if (ok === null) return
        if (!ok) {
            raf = win.requestAnimationFrame(drawOnce)
            if (simJob) simWork(12)
            return
        }
        if (simJob) {
            simWork(12)
            raf = win.requestAnimationFrame(drawOnce)
            if (!STAGES[stage]) return
        }
        render()
    }
    function tick(now: number) {
        raf = 0
        if (!alive || lost || !visible) return
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now
        elapsed += dt
        let busy = false
        if (simJob) {
            simWork(6)
            busy = true
        }
        const ok = guard(ready)
        if (ok === null) return
        if (!ok) {
            raf = win.requestAnimationFrame(tick)
            return
        }
        if (fade < 1) {
            fade = Math.min(1, fade + dt / 0.2)
            markFull()
            busy = true
        }
        if (srcVideo && !srcVideo.paused && srcVideo.readyState >= 2) {
            gl.bindTexture(gl.TEXTURE_2D, bgTex)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, srcVideo)
            blurDirty = true
            markFull()
            busy = true
        }
        if (runners.length && stepRunners(dt)) {
            dirty = true
            busy = true
        }
        // a stroke keeps the loop going only while it moves: a pointer resting on the glass or a focused pane cost nothing
        if (stroke && performance.now() - lastInput < 150) busy = true
        // the fog coming back alone needs no more than 30 pictures a second
        refogAcc += dt
        if (open && (busy || fogUpLeft > 0 || refogAcc >= 1 / 30)) {
            refogChanging = refogStep(refogAcc)
            if (refogChanging) {
                regrowAcc += refogAcc
                if (regrowAcc > 0.25) {
                    regrowAcc = 0
                    regrowDrops()
                }
            }
            refogAcc = 0
        }
        if (!open) refogChanging = false
        if (wasClear !== (open !== null)) {
            wasClear = open !== null
            hooks.state(wasClear)
        }
        if (dirty) render()
        const drawable = bgReady && !!DROP_MAP && !!BB
        if (busy || fogUpLeft > 0 || (dirty && drawable) || (open !== null && refogChanging)) raf = win.requestAnimationFrame(tick)
        else settle()
    }
    // at rest: nothing runs; a drop that gets too heavy wakes the pane now and then (Drips). In Mode Ambient nobody
    // wipes: drops keep running at their own random pace (no calmer phase after a while), and when no drop of the field
    // is heavy enough, one starts high on the glass. No patches clear (Handtest 25.10.2026).
    function settle() {
        win.clearTimeout(slideTimer)
        slideTimer = 0
        if (still || !visible || look.drips <= 0 || reduced()) return
        const calmFactor = !mode.wipe ? 0.6 : performance.now() - lastInput > 30000 ? 3 : 1
        const mean = (2.2 / (look.drips * look.drips)) * calmFactor
        const t = clamp(-Math.log(1 - Math.random()) * mean, 0.4 * mean, 2.5 * mean)
        slideTimer = win.setTimeout(() => {
            slideTimer = 0
            if (!alive || !visible) return
            if (slideDown()) wake()
            else if (!mode.wipe && W && H) {
                addRunner(rand(0.06, 0.94) * W, rand(0.08, 0.5) * H, rand(2.6, 4.2) + look.drips * 0.7, true)
                wake()
            } else settle()
        }, t * 1000)
    }

    // ---------------------------------------------------------------- input (on the pane only, never on the window)
    const inUi = (e: Event) => e.target instanceof Element && !!e.target.closest("[data-cd-ui]")
    const pointAt = (cx: number, cy: number): [number, number] | null => {
        const r = root.getBoundingClientRect()
        return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom ? [cx - r.left, cy - r.top] : null
    }
    let ringPos: [number, number] | null = null
    let ringTimer = 0
    let kbPos: [number, number] | null = null
    function placeRing() {
        if (!ringEl || !ringPos) return
        const d = look.brush
        ringEl.style.width = `${d}px`
        ringEl.style.height = `${d}px`
        ringEl.style.transform = `translate(${ringPos[0] - d / 2}px, ${ringPos[1] - d / 2}px)`
    }
    function showRing(on: boolean) {
        if (!ringEl) return
        ringEl.style.opacity = on ? "1" : "0"
    }
    // the ring shows only while the size changes: it grows with Brush while the slider moves, in the middle of the
    // glass, and fades shortly after (Handtest 25.10.2026: never around the pointer or the keyboard brush)
    function previewRing() {
        if (!ringEl || !mode.wipe) return
        ringPos = [W / 2, H / 2]
        placeRing()
        showRing(true)
        win.clearTimeout(ringTimer)
        ringTimer = win.setTimeout(() => showRing(false), 900)
    }
    const onPointerMove = (e: PointerEvent) => {
        if (e.pointerType === "touch" || !mode.wipe) return
        // a pointer after the arrow keys: the keyboard brush ends here instead of wiping a line to the pointer
        if (kbPos) keyFocus(false)
        const p = inUi(e) ? null : pointAt(e.clientX, e.clientY)
        if (!p) {
            strokeEnd()
            return
        }
        if (mode.mouse === "move" || e.buttons & 1) strokeTo(p[0], p[1])
    }
    const onPointerDown = (e: PointerEvent) => {
        if (e.pointerType === "touch" || inUi(e) || !mode.wipe) return
        if (kbPos) keyFocus(false)
        const p = pointAt(e.clientX, e.clientY)
        if (p && mode.mouse === "drag") strokeStart(p[0], p[1])
    }
    const onPointerUp = (e: PointerEvent) => {
        if (e.pointerType !== "touch" && mode.mouse === "drag") strokeEnd()
    }
    const onPointerLeave = () => {
        strokeEnd()
    }
    // fingers: Hold (rest a moment), Swipe (a sideways start wipes, an upright one scrolls) or both
    let touch: { id: number; x0: number; y0: number; x: number; y: number; state: "waiting" | "wiping" | "scrolling"; timer: number } | null = null
    const onTouchStart = (e: TouchEvent) => {
        if (kbPos) keyFocus(false)
        showRing(false)
        if (inUi(e) || !mode.wipe) return
        if (e.touches.length > 1) {
            if (touch) win.clearTimeout(touch.timer)
            touch = null
            strokeEnd()
            return
        }
        const t = e.changedTouches[0]
        const p = pointAt(t.clientX, t.clientY)
        if (!p) return
        const tt = { id: t.identifier, x0: p[0], y0: p[1], x: p[0], y: p[1], state: "waiting" as "waiting" | "wiping" | "scrolling", timer: 0 }
        touch = tt
        if (mode.touch !== "swipe") {
            tt.timer = win.setTimeout(() => {
                if (touch !== tt || tt.state !== "waiting") return
                tt.state = "wiping"
                strokeStart(tt.x, tt.y)
                const R = look.brush / 2
                for (let i = 0; i < 4; i++) stamp(tt.x, tt.y, R * 0.85, 1, 0, 0.5, Math.random() * 100)
                lastInput = performance.now()
                wake()
            }, 260)
        }
    }
    const onTouchMove = (e: TouchEvent) => {
        const tt = touch
        if (!tt) return
        let t: Touch | null = null
        for (let i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === tt.id) t = e.changedTouches[i]
        if (!t) return
        const r = root.getBoundingClientRect()
        const x = t.clientX - r.left
        const y = t.clientY - r.top
        tt.x = x
        tt.y = y
        if (tt.state === "waiting") {
            const dx = x - tt.x0
            const dy = y - tt.y0
            if (dx * dx + dy * dy < 49) return
            win.clearTimeout(tt.timer)
            if (mode.touch !== "hold" && Math.abs(dx) > Math.abs(dy) * 1.15) {
                tt.state = "wiping"
                strokeStart(tt.x0, tt.y0)
            } else {
                tt.state = "scrolling"
                return
            }
        }
        if (tt.state === "wiping") {
            if (e.cancelable) e.preventDefault()
            strokeTo(x, y)
        }
    }
    const onTouchEnd = () => {
        if (touch) win.clearTimeout(touch.timer)
        touch = null
        strokeEnd()
    }
    // keyboard: the brush starts in the middle and the arrow keys wipe from there
    function keyMove(dx: number, dy: number, far: boolean) {
        if (!W || !mode.wipe) return
        const p = kbPos ?? [W / 2, H / 2]
        if (!kbPos) {
            kbPos = p
            strokeStart(p[0], p[1])
            stamp(p[0], p[1], (look.brush / 2) * 0.85, 1, 0, 0.6, Math.random() * 100)
        }
        const step = Math.max(8, look.brush * 0.5) * (far ? 3 : 1)
        const nx = clamp(p[0] + dx * step, 0, W)
        const ny = clamp(p[1] + dy * step, 0, H)
        if (!stroke) strokeStart(p[0], p[1])
        strokeTo(nx, ny)
        kbPos = [nx, ny]
    }
    function keyFocus(on: boolean) {
        if (!on) {
            kbPos = null
            strokeEnd()
        }
    }

    // ---------------------------------------------------------------- visibility and the GPU context
    // on screen and tab shown: a tab that comes back while the glass is still off screen keeps it resting (QA-1)
    let inView = true
    // the shared tab listener (watchTab) only while this pane is in view
    let tabOff: (() => void) | null = null
    const io =
        typeof IntersectionObserver !== "undefined" && !still
            ? new IntersectionObserver((es) => {
                  inView = es[es.length - 1].isIntersecting
                  if (inView && !tabOff) tabOff = watchTab(doc, onVisibility)
                  else if (!inView && tabOff) {
                      tabOff()
                      tabOff = null
                  }
                  setVisible(inView && !doc.hidden)
              })
            : null
    const onVisibility = () => setVisible(inView && !doc.hidden)
    function setVisible(v: boolean) {
        if (v === visible) return
        visible = v
        if (!v) {
            if (raf) win.cancelAnimationFrame(raf)
            raf = 0
            win.clearTimeout(slideTimer)
            slideTimer = 0
            srcVideo?.pause()
        } else {
            if (srcVideo) play(srcVideo)
            dirty = true
            wake()
        }
    }
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => resize()) : null
    const onLost = (e: Event) => {
        e.preventDefault()
        lost = true
        if (raf) win.cancelAnimationFrame(raf)
        raf = 0
        win.clearTimeout(slideTimer)
        slideTimer = 0
        drawn = false
        hooks.drawn(false)
    }
    const onRestored = () => {
        if (!alive) return
        lost = false
        try {
            initGL()
            allocate()
            if (srcVideo) setBg(srcVideo, srcVideo.videoWidth, srcVideo.videoHeight)
            else if (srcImg) {
                // the picture comes back band by band; until then the still stays
                bgReady = false
                crop(srcImg)
            } else if (srcCanvas) setBg(srcCanvas, srcCanvas.width, srcCanvas.height)
            if (STAGES[stage]) dropMapMissing = true
            markFull()
        } catch (e) {
            if (!(e instanceof GlassFault)) throw e
            hooks.fault(e.message)
            return
        }
        wake()
    }

    // ---------------------------------------------------------------- start
    initGL()
    resize()
    if (!still) {
        root.addEventListener("pointermove", onPointerMove)
        root.addEventListener("pointerdown", onPointerDown)
        root.addEventListener("pointerup", onPointerUp)
        root.addEventListener("pointerleave", onPointerLeave)
        root.addEventListener("touchstart", onTouchStart, { passive: true })
        root.addEventListener("touchmove", onTouchMove, { passive: false })
        root.addEventListener("touchend", onTouchEnd)
        root.addEventListener("touchcancel", onTouchEnd)
        if (io) io.observe(root)
        else tabOff = watchTab(doc, onVisibility)
    }
    ro?.observe(root)
    cv.addEventListener("webglcontextlost", onLost)
    cv.addEventListener("webglcontextrestored", onRestored)

    // the values of the glass; a scene change hands them over with its picture (takeScene)
    function applyLook(l: Look) {
        const prev = look
        look = l
        if (prev.blur !== l.blur) blurDirty = true
        if (prev.droplets !== l.droplets) changeStage()
        if (prev.refog !== l.refog && l.refog > 0 && !open) {
            // refog switched back on: everything still clear takes part again
            for (let k = 0; k < F.length; k++)
                if (F[k] !== 1) {
                    const x = k % fw
                    const y = Math.floor(k / fw)
                    grow(x, y, x, y)
                }
        }
        if (prev.drips !== l.drips && !raf) settle()
        markFull()
        wake()
    }

    return {
        previewBrush() {
            if (!still) previewRing()
        },
        setLook(l) {
            // values of a scene whose picture is not there yet wait with it
            if (pendingLook) pendingLook = l
            else applyLook(l)
        },
        setMode(m) {
            const was = mode.wipe
            mode = m
            if (!m.wipe) {
                showRing(false)
                strokeEnd()
                if (touch) win.clearTimeout(touch.timer)
                touch = null
            }
            // the drops keep a different pace in each mode: the next one is drawn anew
            if (was !== m.wipe && !raf) settle()
        },
        setBackground(c) {
            if (c === bgColor) return
            bgColor = c
            bgFill = solidFill(c)
            if (srcImg) crop(srcImg)
            else if (fillOnly && !srcVideo) showFill()
        },
        setSource,
        preload,
        fogUp() {
            fogUpLeft = reduced() ? 0.05 : 1.2
            if (!open) open = [0, 0, fw - 1, fh - 1]
            markFull()
            lastInput = performance.now()
            wake()
        },
        keyMove,
        keyFocus,
        destroy() {
            alive = false
            if (raf) win.cancelAnimationFrame(raf)
            raf = 0
            for (const t of [slideTimer, simTimer, cropTimer, ringTimer, upTimer, fadeTimer]) win.clearTimeout(t)
            for (const abort of [...preloads.values()]) abort()
            blobCache.clear()
            fadeCv?.remove()
            cancelLoads()
            posterAgain = null
            if (touch) win.clearTimeout(touch.timer)
            root.removeEventListener("pointermove", onPointerMove)
            root.removeEventListener("pointerdown", onPointerDown)
            root.removeEventListener("pointerup", onPointerUp)
            root.removeEventListener("pointerleave", onPointerLeave)
            root.removeEventListener("touchstart", onTouchStart)
            root.removeEventListener("touchmove", onTouchMove)
            root.removeEventListener("touchend", onTouchEnd)
            root.removeEventListener("touchcancel", onTouchEnd)
            tabOff?.()
            tabOff = null
            io?.disconnect()
            ro?.disconnect()
            cv.removeEventListener("webglcontextlost", onLost)
            cv.removeEventListener("webglcontextrestored", onRestored)
            stopVideo()
            sourceToken++
            const lose = gl.getExtension("WEBGL_lose_context")
            lose?.loseContext()
            cv.remove()
        },
    }
}

// ------------------------------------------------------------------ component

interface ImageValue {
    src?: string
    srcSet?: string
    alt?: string
    positionX?: string
    positionY?: string
}
interface SceneProps {
    image?: ImageValue
    video?: string
    look?: "shared" | "own"
    density?: number
    droplets?: number
    brush?: number
    refog?: number
    blur?: number
    grain?: number
    tint?: number
    drips?: number
}
interface PanelGroup {
    theme?: "auto" | "light" | "dark"
    start?: "open" | "closed"
    title?: string
    font?: CSSProperties
    upload?: boolean
    scenes?: SceneProps[]
}
interface AdvancedGroup {
    blur?: number
    grain?: number
    tint?: number
    drips?: number
    /** Ambient: nobody wipes, drops run down by themselves */
    mode?: GlassMode
    touch?: TouchMode
    mouse?: MouseMode
}
interface StyleGroup {
    fill?: string
}
interface Props {
    showControls?: boolean
    controls?: PanelGroup
    image?: ImageValue
    video?: string
    density?: number
    droplets?: number
    brush?: number
    refog?: number
    advanced?: AdvancedGroup
    styling?: StyleGroup
    /** Set by Framer (size and position of the instance), passed to the root unchanged. Not a design option. */
    style?: CSSProperties
}

/** what a scene or a visitor sets, in the units of the panel: percent, px and seconds */
interface Values {
    density: number
    droplets: number
    brush: number
    refog: number
    blur: number
    grain: number
    tint: number
    drips: number
}
type Key = keyof Values
const D: Values = { density: 72, droplets: 50, brush: 56, refog: 14, blur: 16, grain: 20, tint: -20, drips: 55 }
const RANGE: Record<Key, [number, number]> = { density: [15, 100], droplets: [0, 100], brush: [20, 120], refog: [0, 60], blur: [4, 40], grain: [0, 100], tint: [-100, 100], drips: [0, 100] }
const KEYS = Object.keys(D) as Key[]
const DEFAULT_FILL = "#E4E1DB"
/** any value from the panel: a number in its range, otherwise the default */
function values(src: Partial<Record<Key, unknown>>, base: Values): Values {
    const out = { ...base }
    for (const k of KEYS) {
        const v = src[k]
        if (typeof v === "number" && Number.isFinite(v)) out[k] = clamp(v, RANGE[k][0], RANGE[k][1])
    }
    return out
}
const toLook = (v: Values): Look => ({ density: v.density / 100, droplets: v.droplets / 100, brush: v.brush, refog: v.refog, blur: v.blur, grain: v.grain / 100, tint: v.tint / 100, drips: v.drips / 100 })
/** position of a Framer image ("left", "center", "40%"), as a share from 0 to 1 */
function share(v: string | undefined, low: string, high: string): number {
    if (v === low) return 0
    if (v === high) return 1
    if (typeof v === "string" && /^-?\d+(\.\d+)?%$/.test(v)) return clamp(parseFloat(v) / 100, 0, 1)
    return 0.5
}
/** Same content for plain data (numbers, strings, arrays, plain objects); anything else, like a File, by identity. */
function samePlain(a: unknown, b: unknown): boolean {
    if (a === b) return true
    if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => samePlain(v, b[i]))
    const plain = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype
    if (!plain(a) || !plain(b)) return false
    const ka = Object.keys(a)
    return ka.length === Object.keys(b).length && ka.every((k) => samePlain(a[k], b[k]))
}
/** The scenes the panel defines: same keys, pictures, videos and values (names do not count, as before) */
function sameDefs(a: SceneDef[], b: SceneDef[]): boolean {
    return a.length === b.length && a.every((d, i) => d.key === b[i].key && (d.image?.src ?? "") === (b[i].image?.src ?? "") && d.video === b[i].video && samePlain(d.values, b[i].values))
}
/**
 * The value last handed on while a new one has the same content (FP-15): hooks depend on the value itself, and a new
 * object with the same content (Framer passes new props on every render) does not run them again. Compared once per new
 * value; a ref, not state, so no second render.
 */
function useSameValue<T>(value: T, same: (a: T, b: T) => boolean): T {
    const held = useRef({ seen: value, use: value })
    const h = held.current
    if (value !== h.seen) {
        h.seen = value
        if (!same(h.use, value)) h.use = value
    }
    return h.use
}

function sourceOf(image: ImageValue | undefined, video: string): Source {
    const still: Source = image && typeof image.src === "string" && image.src ? { kind: "image", url: image.src, x: share(image.positionX, "left", "right"), y: share(image.positionY, "top", "bottom") } : { kind: "none" }
    return video ? { kind: "video", url: video, poster: still } : still
}

interface SceneDef {
    key: string
    name: string
    image?: ImageValue
    video: string
    values: Values
}

const SR_ONLY: CSSProperties = { position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap" }
const NOISE = `url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

/**
 * The still picture: the image (or only the fill colour) blurred and a little larger, the fog in its tint over it,
 * thicker at the edges and at the bottom like the live pane, and grain. No randomness, so server and browser agree.
 */
function Still({ image, fill, v }: { image?: ImageValue; fill: string; v: Values }) {
    const [r, g, b] = tintRgb(v.tint / 100).map((c) => Math.round(c * 255))
    // as bright as the live glass (D-1): like the shader, the fog lifts dark parts a little and bright parts a bit more
    // (soft-light with the tint), plus a thin veil; dark rims a little darker, bright ones almost unchanged
    const d = v.density / 100
    const softA = 0.55 + 0.45 * d
    const fogA = 0.04 + 0.08 * d
    const blurPx = Math.max(3, v.blur * 0.75)
    const src = image && typeof image.src === "string" && allowedStill(image.src) ? image.src : ""
    const x = share(image?.positionX, "left", "right") * 100
    const y = share(image?.positionY, "top", "bottom") * 100
    const layer: CSSProperties = { position: "absolute", inset: 0 }
    return (
        <div aria-hidden="true" style={{ ...layer, overflow: "hidden", background: fill }}>
            {src ? (
                <img src={src} srcSet={image?.srcSet} sizes="100vw" alt="" draggable={false} decoding="async" style={{ ...layer, width: "100%", height: "100%", objectFit: "cover", objectPosition: `${x}% ${y}%`, filter: `blur(${blurPx}px)`, transform: "scale(1.1)" }} />
            ) : null}
            <div style={{ ...layer, background: `rgb(${r}, ${g}, ${b})`, opacity: softA, mixBlendMode: "soft-light" }} />
            <div style={{ ...layer, background: `rgb(${r}, ${g}, ${b})`, opacity: fogA }} />
            <div style={{ ...layer, boxShadow: "inset 0 0 120px rgba(0, 0, 0, 0.5)", mixBlendMode: "soft-light" }} />
            {v.grain > 0 ? <div style={{ ...layer, backgroundImage: NOISE, opacity: (v.grain / 100) * 0.3, mixBlendMode: "soft-light" }} /> : null}
        </div>
    )
}

const pct = (v: number) => `${Math.round(v)}%`
const px = (v: number) => `${Math.round(v)} px`
const secs = (v: number) => (v <= 0 ? "Off" : `${Math.round(v)} s`)
const tintText = (v: number) => (Math.abs(v) < 3 ? "Neutral" : v < 0 ? `Cool ${Math.round(-v)}` : `Warm ${Math.round(v)}`)

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * @framerDisableUnlink
 */
export default function Condensation(props: Props) {
    const { showControls = false, controls, image, video = "", density = D.density, droplets = D.droplets, brush = D.brush, refog = D.refog, advanced, styling, style } = props
    const adv: AdvancedGroup = advanced && typeof advanced === "object" ? advanced : {}
    const { blur = D.blur, grain = D.grain, tint = D.tint, drips = D.drips, mode = "wipe", touch = "both", mouse = "move" } = adv
    const wipe = mode !== "ambient"
    const pan: PanelGroup = controls && typeof controls === "object" ? controls : {}
    const { theme = "auto", start = "closed", title = "Condensation", font, upload = true, scenes = [] } = pan
    // a color from Framer's Color control (also a color style); anything else, and transparent, falls back to the default
    const fill = styling && typeof styling.fill === "string" && /^(#[0-9a-f]{3,8}|(rgba?|hsla?|oklch|oklab|lab|lch|color|var)\(.+\))$/i.test(styling.fill.trim()) ? styling.fill.trim() : DEFAULT_FILL
    const videoUrl = typeof video === "string" ? video : ""
    const main = values({ density, droplets, brush, refog, blur, grain, tint, drips }, D)

    // the scenes: the image above, and with Controls on up to three more, each with the values above or its own
    const defs: SceneDef[] = [{ key: "main", name: image?.alt || "Scene 1", image, video: videoUrl, values: main }]
    if (showControls && Array.isArray(scenes)) {
        scenes.slice(0, 3).forEach((s, i) => {
            if (!s || typeof s !== "object") return
            const v = typeof s.video === "string" ? s.video : ""
            if (!s.image?.src && !v) return
            defs.push({ key: `s${i + 1}`, name: s.image?.alt || `Scene ${i + 2}`, image: s.image, video: v, values: s.look === "own" ? values(s, D) : main })
        })
    }
    const defsUse = useSameValue(defs, sameDefs)

    // the thumbnail Framer makes of the component is a picture as well: the still, like the static export (QA-4)
    const isStatic = useIsStaticRenderer() || RenderTarget.current() === RenderTarget.thumbnail
    const inCanvas = isStatic && RenderTarget.current() === RenderTarget.canvas
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])
    const live = mounted && !isStatic
    const uid = `cd${useId().replace(/[^a-zA-Z0-9]/g, "")}`

    // what a visitor has set (Controls on); without Controls the panel values go straight to the pane
    const [sceneKey, setSceneKey] = useState("main")
    const [vis, setVis] = useState<Values>(main)
    const visRef = useRef<Values>(main)
    const setVisBoth = (v: Values) => {
        visRef.current = v
        setVis(v)
    }
    const [modes, setModes] = useState<{ touch: TouchMode; mouse: MouseMode; wipe: boolean }>({ touch, mouse, wipe })
    const [upl, setUpl] = useState<{ id: number; file: File; thumb: string; values: Values } | null>(null)
    const [note, setNote] = useState<string | null>(null)
    const [dark, setDark] = useState(false)
    const [fault, setFault] = useState<string | null>(null)
    const [srcError, setSrcError] = useState<string | null>(null)
    const [drawn, setDrawn] = useState(false)
    const [gen, setGen] = useState(0)
    const [area, setArea] = useState({ w: 0, h: 0 })

    // a new setting in the editor starts the visitor values over
    useEffect(() => {
        const cur = defsUse.find((d) => d.key === sceneKey) ?? defsUse[0]
        if (sceneKey !== "upload") {
            visRef.current = { ...cur.values }
            setVis({ ...cur.values })
        }
    }, [defsUse, sceneKey])
    useEffect(() => setModes({ touch, mouse, wipe }), [touch, mouse, wipe])

    const scene = defs.find((d) => d.key === sceneKey) ?? defs[0]
    const onUpload = showControls && sceneKey === "upload" && upl !== null
    const effValues = showControls ? vis : main
    const effModes = showControls ? modes : { touch, mouse, wipe }
    const source: Source = onUpload && upl ? { kind: "file", file: upl.file } : sourceOf(scene.image, scene.video)
    const sourceUse = useSameValue(source, samePlain)
    const look = useSameValue(toLook(effValues), samePlain)
    const { touch: modeTouch, mouse: modeMouse, wipe: modeWipe } = effModes

    const rootRef = useRef<HTMLDivElement>(null)
    const layerRef = useRef<HTMLDivElement>(null)
    const ringRef = useRef<HTMLDivElement>(null)
    const paneRef = useRef<HTMLButtonElement>(null)
    const glassRef = useRef<Glass | null>(null)
    const [frameThumbs, setFrameThumbs] = useState<Record<string, string>>({})
    const cfg = useRef({ source, sceneKey, prevScene: "main", uploading: false, defs })
    cfg.current.source = source
    cfg.current.sceneKey = sceneKey
    cfg.current.defs = defs

    // what the engine reports goes into state; the handlers are made once and read the latest values from refs
    const hooks = useMemo<Hooks>(
        () => ({
            fault: (reason) => setFault(reason),
            drawn: (on) => setDrawn(on),
            scene: (info) => {
                setDark(info.dark)
                const c = cfg.current
                const d = c.defs.find((x) => x.key === c.sceneKey)
                if (!c.uploading && d && d.video && !d.image?.src && c.source.kind === "video") setFrameThumbs((t) => (t[d.key] === info.thumb ? t : { ...t, [d.key]: info.thumb }))
                if (cfg.current.uploading) {
                    cfg.current.uploading = false
                    setUpl((u) => (u ? { ...u, thumb: info.thumb } : u))
                }
            },
            sourceError: (e) => {
                if (cfg.current.uploading) {
                    // a visitor's file that does not open: a short note, and the scene before it comes back
                    cfg.current.uploading = false
                    setNote(e.kind === "large" ? UPLOAD_NOTE.large : UPLOAD_NOTE.broken)
                    setUpl(null)
                    const back = cfg.current.defs.find((d) => d.key === cfg.current.prevScene) ?? cfg.current.defs[0]
                    setSceneKey(back.key)
                    visRef.current = back.values
                    setVis(back.values)
                    return
                }
                setSrcError(e.reason)
            },
            state: (clear) => paneRef.current?.setAttribute("data-state", clear ? "clear" : "fogged"),
        }),
        []
    )

    // the engine starts when the pane comes into view (or at once in the editor), and is given back on unmount
    useEffect(() => {
        if (!mounted || (isStatic && !inCanvas)) return
        const root = rootRef.current
        const layer = layerRef.current
        if (!root || !layer) return
        let glass: Glass | null = null
        let io: IntersectionObserver | null = null
        let cv: HTMLCanvasElement | null = null
        let wait = 0
        // expected: no WebGL or a shader the device rejects; anything else is named too, visitors keep the still
        const fail = (e: unknown) => setFault(e instanceof GlassFault ? e.message : `live drawing stopped: ${e instanceof Error ? e.message : String(e)}`)
        const begin = () => {
            try {
                cv = glassCanvas(root.ownerDocument)
            } catch (e) {
                fail(e)
                return
            }
            // the rest one task later, so the context and the start never add up to one long task (Audit 6)
            wait = window.setTimeout(() => {
                wait = 0
                if (!cv) return
                try {
                    glass = createGlass(root, layer, cv, ringRef.current, inCanvas, hooks)
                } catch (e) {
                    releaseCanvas(cv)
                    cv = null
                    fail(e)
                    return
                }
                glassRef.current = glass
                setFault(null)
                setGen((g) => g + 1)
            }, 0)
        }
        if (inCanvas || typeof IntersectionObserver === "undefined") begin()
        else {
            io = new IntersectionObserver(
                (es) => {
                    if (!es.some((e) => e.isIntersecting)) return
                    io?.disconnect()
                    io = null
                    begin()
                },
                { rootMargin: "200px" }
            )
            io.observe(root)
        }
        return () => {
            io?.disconnect()
            window.clearTimeout(wait)
            if (glass) glass.destroy()
            else if (cv) releaseCanvas(cv)
            glassRef.current = null
            setDrawn(false)
        }
    }, [mounted, isStatic, inCanvas, hooks])

    // A scene change sends its values together with its picture (the source effect below): they switch when the
    // picture is ready, not before on the last one. `shown` is the source the engine has (with the engine's gen).
    const shown = useRef<{ source: Source | null; gen: number }>({ source: null, gen: -1 })
    const lookNow = useRef(look)
    lookNow.current = look
    useEffect(() => {
        if (shown.current.gen === gen && shown.current.source !== sourceUse) return
        glassRef.current?.setLook({ ...look })
    }, [look, gen, sourceUse])
    useEffect(() => {
        glassRef.current?.setMode({ touch: modeTouch, mouse: modeMouse, wipe: modeWipe })
    }, [modeTouch, modeMouse, modeWipe, gen])
    useEffect(() => {
        glassRef.current?.setBackground(fill)
    }, [fill, gen])
    useEffect(() => {
        setSrcError(null)
        const g = glassRef.current
        if (!g) return
        const sceneChange = shown.current.gen === gen
        shown.current = { source: sourceUse, gen }
        g.setSource(sourceUse, sceneChange ? { ...lookNow.current } : undefined)
    }, [sourceUse, gen])
    // the pictures of the other scenes, fetched ahead once the glass runs, so a switch does not wait for the network
    const preloadList = useSameValue(showControls ? defs.map((d) => d.image?.src ?? "") : null, samePlain)
    useEffect(() => {
        const g = glassRef.current
        if (!g || !preloadList) return
        const t = window.setTimeout(() => g.preload([...preloadList]), 1500)
        return () => window.clearTimeout(t)
    }, [preloadList, gen])

    // the panel lays itself out by the size of the box
    useLayoutEffect(() => {
        const root = rootRef.current
        if (!root || !showControls || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => setArea({ w: root.clientWidth, h: root.clientHeight }))
        ro.observe(root)
        setArea({ w: root.clientWidth, h: root.clientHeight })
        return () => ro.disconnect()
    }, [showControls, mounted])

    // ---------------------------------------------------------------- the visitor panel
    const quiet = (k: Key, v: number) => {
        const next = { ...visRef.current, [k]: v }
        visRef.current = next
        glassRef.current?.setLook(toLook(next))
        if (k === "brush") glassRef.current?.previewBrush()
    }
    const commit = () => setVis(visRef.current)
    const fogUp = () => glassRef.current?.fogUp()
    const reset = () => {
        const v = sceneKey === "upload" && upl ? main : scene.values
        setVisBoth(v)
        setModes({ touch, mouse, wipe })
    }
    const pick = (key: string) => {
        if (key === sceneKey) return
        if (sceneKey === "upload" && upl) setUpl({ ...upl, values: visRef.current })
        setNote(null)
        setSceneKey(key)
        if (key === "upload" && upl) setVisBoth(upl.values)
        else setVisBoth((defs.find((d) => d.key === key) ?? defs[0]).values)
    }
    // a visitor's own file: type and size are checked here, everything after that runs through the engine's report()
    const onFile = (f: File) => {
        const what: LoadWhat | null = /^image\//.test(f.type) ? "picture" : /^video\//.test(f.type) ? "video" : null
        if (!what) {
            setNote(UPLOAD_NOTE.type)
            return
        }
        if (f.size > UPLOAD_MAX[what]) {
            setNote(UPLOAD_NOTE.large)
            return
        }
        setNote(null)
        if (sceneKey !== "upload") cfg.current.prevScene = sceneKey
        cfg.current.uploading = true
        setUpl({ id: Date.now(), file: f, thumb: "", values: main })
        setSceneKey("upload")
        setVisBoth(main)
    }
    // a video scene without an image: its first frame once it has shown, before that the fill (K B-1)
    const thumbOf = (d: SceneDef) => (d.image?.src && allowedStill(d.image.src) ? sizedUrl(d.image.src, 256) : d.video ? (frameThumbs[d.key] ?? fillThumb(fill)) : fillThumb(fill))
    const items = defs.map((d) => ({ value: d.key, name: d.name, src: thumbOf(d) }))
    // an own picture only where the glass draws live; the still could not show it (QA-5)
    const canUpload = upload && !fault
    if (upl) items.push({ value: "upload", name: "Your file", src: upl.thumb })
    const raster = (z: Density, extra?: CSSProperties): CSSProperties => ({ display: "grid", gridTemplateColumns: z.columns === 2 ? "minmax(0, 1fr) minmax(0, 1fr)" : "minmax(0, 1fr)", gap: z.gap, ...extra })
    const slider = (z: Density, t: Theme, label: string, k: Key, format: (v: number) => string, origin?: number) => (
        <Slider key={label} z={z} t={t} label={label} value={vis[k]} min={RANGE[k][0]} max={RANGE[k][1]} step={1} format={format} origin={origin} onChange={(v) => quiet(k, v)} onCommit={commit} />
    )
    const mainView = (z: Density, t: Theme): ReactNode => (
        <>
            {items.length > 1 || canUpload ? (
                <Thumbs<string> z={z} t={t} label="Scene" value={onUpload ? "upload" : scene.key} items={items} add={canUpload ? { label: "Upload image or video", accept: "image/*,video/*", onFile } : undefined} onChange={pick} />
            ) : null}
            {note ? (
                <p role="status" style={{ margin: `${z.gap}px 0 0`, fontSize: z.text - 2, color: t.soft }}>
                    {note}
                </p>
            ) : null}
            <div style={raster(z, items.length > 1 || canUpload ? { marginTop: z.section } : undefined)}>
                {slider(z, t, "Density", "density", pct)}
                {slider(z, t, "Droplets", "droplets", pct)}
                {slider(z, t, "Brush", "brush", px)}
                {slider(z, t, "Refog", "refog", secs)}
            </div>
        </>
    )
    const advView = (z: Density, t: Theme): ReactNode => (
        <>
            <div style={raster(z)}>
                {slider(z, t, "Blur", "blur", px)}
                {slider(z, t, "Grain", "grain", pct)}
                {slider(z, t, "Tint", "tint", tintText, 0)}
                {slider(z, t, "Drips", "drips", pct)}
            </div>
            <div style={{ marginTop: z.section }}>
                <ToggleRows
                    z={z}
                    t={t}
                    rows={[
                        { label: "Mode", value: modes.wipe ? "wipe" : "ambient", options: [["wipe", "Wipe"], ["ambient", "Ambient"]], onChange: (v) => setModes((m) => ({ ...m, wipe: v !== "ambient" })) },
                        ...(modes.wipe
                            ? [
                                  { label: "Touch", value: modes.touch, options: [["hold", "Hold"], ["swipe", "Swipe"], ["both", "Both"]] as [string, string][], onChange: (v: string) => setModes((m) => ({ ...m, touch: v as TouchMode })) },
                                  { label: "Mouse", value: modes.mouse, options: [["move", "Move"], ["drag", "Drag"]] as [string, string][], onChange: (v: string) => setModes((m) => ({ ...m, mouse: v as MouseMode })) },
                              ]
                            : []),
                    ]}
                />
            </div>
        </>
    )
    const panelOn = showControls && mounted && area.w > 0 && (!isStatic || inCanvas)
    const panelTheme = theme === "auto" ? (dark ? "dark" : "light") : theme

    // ---------------------------------------------------------------- the pane as a button for the keyboard (FP-2, FP-3, FP-10)
    // the picture behind the glass in words: the alt text of the scene on screen (the visitor's own file has none)
    const alt = onUpload ? "" : typeof scene.image?.alt === "string" ? scene.image.alt.trim() : ""
    const describe = `${alt ? `${alt}. ` : ""}Arrow keys wipe the glass, with Shift further. Enter or Space fogs it up again.`
    const pane = live && !fault && effModes.wipe
    const onKey = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
        e.currentTarget.removeAttribute("data-pointer")
        const k = e.key
        const dx = k === "ArrowLeft" ? -1 : k === "ArrowRight" ? 1 : 0
        const dy = k === "ArrowUp" ? -1 : k === "ArrowDown" ? 1 : 0
        if (!dx && !dy) return
        e.preventDefault()
        glassRef.current?.keyMove(dx, dy, e.shiftKey)
    }
    const pointerUse = (e: ReactPointerEvent<HTMLButtonElement>) => {
        if (!e.currentTarget.hasAttribute("data-pointer")) e.currentTarget.setAttribute("data-pointer", "")
    }
    const css = `.${uid} .cd-pane:focus{outline:none}.${uid} .cd-pane:focus-visible:not([data-pointer]){box-shadow:inset 0 0 0 2px rgba(255,255,255,0.9),inset 0 0 0 4px rgba(0,0,0,0.28)}.${uid} .cd-ring{transition:opacity 160ms ease}@media (prefers-reduced-motion:reduce){.${uid} .cd-ring{transition:none}}`

    const rootStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: fill,
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
        touchAction: live && effModes.wipe ? (effModes.touch === "hold" ? "manipulation" : "pan-y") : undefined,
        ...style,
    }
    return (
        <div
            ref={rootRef}
            className={uid}
            style={rootStyle}
            data-condensation="">
            <style>{css}</style>
            {/* the live glass replaces the still at once, no fade (every start effect would need a switch); both are equally bright (D-1) */}
            <div data-cd-still="" style={{ position: "absolute", inset: 0, visibility: drawn ? "hidden" : undefined }}>
                <Still image={onUpload ? undefined : scene.image} fill={fill} v={effValues} />
            </div>
            {mounted && (!isStatic || inCanvas) ? <div ref={layerRef} data-cd-live="" aria-hidden="true" style={{ position: "absolute", inset: 0, opacity: drawn ? 1 : 0, pointerEvents: "none" }} /> : null}
            {!pane && alt ? (
                // no glass to wipe (Mode Ambient, no WebGL, the still): the picture is still named for screen readers (L-1)
                <span role="img" aria-label={alt} style={SR_ONLY} />
            ) : null}
            {pane ? (
                // without live drawing nothing wipes: no key stop, no description, no ring (QA-5)
                <>
                    <button
                        ref={paneRef}
                        type="button"
                        className="cd-pane"
                        tabIndex={0}
                        aria-label="Fogged glass"
                        aria-describedby={`${uid}-how`}
                        data-state="fogged"
                        onKeyDown={onKey}
                        // the ring around the glass shows after keys only: a pointer hides it until the next key (FP-10)
                        onPointerDown={pointerUse}
                        onPointerMove={pointerUse}
                        onFocus={(e) => e.currentTarget.removeAttribute("data-pointer")}
                        onBlur={() => glassRef.current?.keyFocus(false)}
                        onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                            // Enter and Space fog the glass up; a click with the mouse or a finger only wipes
                            if (e.detail === 0) fogUp()
                        }}
                        style={{ position: "absolute", inset: 0, zIndex: 1, margin: 0, padding: 0, border: 0, borderRadius: 0, background: "transparent", cursor: "default", appearance: "none", WebkitAppearance: "none", touchAction: "inherit" }}
                    />
                    <span id={`${uid}-how`} style={SR_ONLY}>
                        {describe}
                    </span>
                    <div ref={ringRef} className="cd-ring" aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, zIndex: 2, pointerEvents: "none", borderRadius: "50%", boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.85), 0 0 0 2px rgba(0, 0, 0, 0.16)", opacity: 0, willChange: "transform" }} />
                </>
            ) : null}
            {panelOn ? (
                <div data-cd-ui="" style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }}>
                    <Panel
                        title={title}
                        theme={panelTheme}
                        start={start}
                        w={area.w}
                        h={area.h}
                        isStatic={isStatic}
                        font={font}
                        main={mainView}
                        advanced={advView}
                        primary={fault ? undefined : { label: "Fog up", onClick: fogUp }}
                        tools={[{ key: "reset", label: "Reset", icon: ICONS.reset, onClick: reset }]}
                        row={fault ? [] : [{ key: "fog", label: "Fog up", icon: ICONS.fog, onClick: fogUp }]}
                        regionLabel="Condensation controls"
                        align="top"
                        pad={20}
                        layoutKey={`${items.length}${canUpload ? "u" : ""}`}
                    />
                </div>
            ) : null}
            {inCanvas && (fault || srcError) ? (
                // editor canvas only (RenderTarget: the one place this note belongs); visitors see the still picture
                <div aria-hidden="true" style={{ position: "absolute", left: 8, bottom: 8, zIndex: 4, maxWidth: "calc(100% - 16px)", padding: "6px 10px", borderRadius: 4, background: "rgba(255, 255, 255, 0.94)", color: "rgb(28, 27, 25)", boxShadow: "0 0 0 1px rgba(28, 27, 25, 0.16)", font: "13px/18px system-ui, sans-serif", pointerEvents: "none" }}>
                    {fault ? `Live drawing could not start (${fault}). Visitors see the still picture.` : srcError}
                </div>
            ) : null}
        </div>
    )
}

// ------------------------------------------------------------------ panel (Framer)

const own = (s: SceneProps) => s.look !== "own"
const wipeOff = (a: AdvancedGroup) => a.mode === "ambient"
addPropertyControls(Condensation, {
    // flat: first setting, switches the visitor panel on
    showControls: {
        type: ControlType.Boolean,
        title: "Controls",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: false,
        description: "On: a panel for visitors with scenes, sliders and an upload.",
    },
    controls: {
        type: ControlType.Object,
        title: "Panel",
        hidden: (p: Props) => p.showControls !== true,
        controls: {
            theme: { type: ControlType.Enum, title: "Theme", options: ["auto", "light", "dark"], optionTitles: ["Auto", "Light", "Dark"], displaySegmentedControl: true, defaultValue: "auto", description: "Auto turns dark on dark pictures." },
            start: { type: ControlType.Enum, title: "Start", options: ["open", "closed"], optionTitles: ["Open", "Closed"], displaySegmentedControl: true, defaultValue: "closed", description: "Whether the visitor panel starts open." },
            title: { type: ControlType.String, title: "Title", defaultValue: "Condensation" },
            font: { type: ControlType.Font, title: "Font", controls: "basic", description: "Inter until you pick one." },
            upload: { type: ControlType.Boolean, title: "Upload", enabledTitle: "Show", disabledTitle: "Hide", defaultValue: true, description: "Visitors can try a picture or a video of their own. It stays in their browser." },
            scenes: {
                type: ControlType.Array,
                title: "Scenes",
                maxCount: 3,
                description: "Up to three more pictures for the visitor panel.",
                control: {
                    type: ControlType.Object,
                    controls: {
                        image: { type: ControlType.ResponsiveImage, title: "Image" },
                        video: { type: ControlType.File, title: "Video", allowedFileTypes: ["mp4", "webm", "mov"] },
                        look: { type: ControlType.Enum, title: "Look", options: ["shared", "own"], optionTitles: ["Shared", "Own"], displaySegmentedControl: true, defaultValue: "shared", description: "Shared uses the values of the main image. Own starts from the defaults." },
                        density: { type: ControlType.Number, title: "Density", min: 15, max: 100, step: 1, unit: "%", defaultValue: D.density, hidden: own },
                        droplets: { type: ControlType.Number, title: "Droplets", min: 0, max: 100, step: 1, unit: "%", defaultValue: D.droplets, hidden: own },
                        brush: { type: ControlType.Number, title: "Brush", min: 20, max: 120, step: 1, unit: "px", defaultValue: D.brush, hidden: own },
                        refog: { type: ControlType.Number, title: "Refog", min: 0, max: 60, step: 1, unit: "s", defaultValue: D.refog, hidden: own },
                        blur: { type: ControlType.Number, title: "Blur", min: 4, max: 40, step: 1, unit: "px", defaultValue: D.blur, hidden: own },
                        grain: { type: ControlType.Number, title: "Grain", min: 0, max: 100, step: 1, unit: "%", defaultValue: D.grain, hidden: own },
                        tint: { type: ControlType.Number, title: "Tint", min: -100, max: 100, step: 1, defaultValue: D.tint, hidden: own },
                        drips: { type: ControlType.Number, title: "Drips", min: 0, max: 100, step: 1, unit: "%", defaultValue: D.drips, hidden: own },
                    },
                },
            },
        },
    },
    // flat: main input
    image: { type: ControlType.ResponsiveImage, title: "Image" },
    // flat: main input
    video: { type: ControlType.File, title: "Video", allowedFileTypes: ["mp4", "webm", "mov"], description: "Muted and looped. Add an Image as well: it shows until the first frame." },
    // flat: main control, always visible
    density: { type: ControlType.Number, title: "Density", min: 15, max: 100, step: 1, unit: "%", defaultValue: D.density },
    // flat: main control, always visible
    droplets: { type: ControlType.Number, title: "Droplets", min: 0, max: 100, step: 1, unit: "%", defaultValue: D.droplets },
    // flat: main control, always visible
    brush: { type: ControlType.Number, title: "Brush", min: 20, max: 120, step: 1, unit: "px", defaultValue: D.brush },
    // flat: main control, always visible
    refog: { type: ControlType.Number, title: "Refog", min: 0, max: 60, step: 1, unit: "s", defaultValue: D.refog, description: "Seconds until wiped glass is fogged again. 0 keeps it clear." },
    advanced: {
        type: ControlType.Object,
        title: "Advanced",
        controls: {
            blur: { type: ControlType.Number, title: "Blur", min: 4, max: 40, step: 1, unit: "px", defaultValue: D.blur },
            grain: { type: ControlType.Number, title: "Grain", min: 0, max: 100, step: 1, unit: "%", defaultValue: D.grain },
            tint: { type: ControlType.Number, title: "Tint", min: -100, max: 100, step: 1, defaultValue: D.tint, description: "Below 0 cool, above 0 warm." },
            drips: { type: ControlType.Number, title: "Drips", min: 0, max: 100, step: 1, unit: "%", defaultValue: D.drips, description: "How often a heavy drop runs down." },
            mode: { type: ControlType.Enum, title: "Mode", options: ["wipe", "ambient"], optionTitles: ["Wipe", "Ambient"], displaySegmentedControl: true, defaultValue: "wipe", description: "Ambient: nobody wipes; drops run down by themselves, as often as Drips says, for backgrounds." },
            touch: { type: ControlType.Enum, title: "Touch", options: ["hold", "swipe", "both"], optionTitles: ["Hold", "Swipe", "Both"], displaySegmentedControl: true, defaultValue: "both", description: "Hold: rest a finger, then wipe. Swipe: a sideways start wipes. Upright swipes scroll the page.", hidden: wipeOff },
            mouse: { type: ControlType.Enum, title: "Mouse", options: ["move", "drag"], optionTitles: ["Move", "Drag"], displaySegmentedControl: true, defaultValue: "move", description: "Move wipes on hover, Drag only with the button down.", hidden: wipeOff },
        },
    },
    styling: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            fill: { type: ControlType.Color, title: "Fill", defaultValue: DEFAULT_FILL, description: "Behind transparent pictures and while they load." },
        },
    },
})
