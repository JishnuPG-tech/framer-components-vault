/*
 * Particle Navbar
 * A floating pill navigation made of fine particles. Hover a link and the nav's own
 * particles stream over and assemble a highlight around it. The button is a brighter
 * particle capsule that dissolves on press and rebuilds itself.
 *
 * Built by Matthias Ölschlegel · https://framer.link/fsd2pgh
 */
import * as React from "react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

// ------------------------------------------------------------------ types

type Variant = "Particles" | "Solid"
type Align = "Center" | "Right"
type Layout = "Auto" | "Desktop" | "Mobile"
type MarkStyle = "Orb" | "Ring" | "Atom" | "Spiral" | "Pulse" | "Helix" | "Cube" | "Morph" | "None"
type RGBA = [number, number, number, number]

interface ImageValue {
    src?: string
    srcSet?: string
    alt?: string
}
interface NavLinkItem {
    label?: string
    link?: string
    newTab?: boolean
}
interface ButtonOptions {
    show?: boolean
    label?: string
    link?: string
    newTab?: boolean
    variant?: Variant
    fill?: string
    text?: string
}
interface ParticleOptions {
    color?: string
    hoverColor?: string
    density?: number
    size?: number
    glow?: number
    twinkle?: number
}
interface MotionOptions {
    gather?: number
    speed?: number
    drift?: number
    cursor?: number
    assemble?: boolean
}
interface SurfaceOptions {
    fill?: string
    blur?: number
    shadow?: string
}

interface Props {
    logoText?: string
    logoImage?: ImageValue
    mark?: MarkStyle
    logoLink?: string
    logoNewTab?: boolean
    links?: NavLinkItem[]
    button?: ButtonOptions
    align?: Align
    layout?: Layout
    breakpoint?: number
    font?: React.CSSProperties
    textColor?: string
    hoverTextColor?: string
    particles?: ParticleOptions
    motion?: MotionOptions
    surface?: SurfaceOptions
    radius?: string
    padding?: string
    gap?: string
    focusRing?: string
    style?: React.CSSProperties
}

interface Resolved {
    logoText: string
    logoImage?: ImageValue
    mark: MarkStyle
    logoLink: string
    logoNewTab: boolean
    links: NavLinkItem[]
    button: Required<ButtonOptions>
    align: Align
    layout: Layout
    breakpoint: number
    font: React.CSSProperties
    textColor: string
    hoverTextColor: string
    particles: Required<ParticleOptions>
    motion: Required<MotionOptions>
    surface: Required<SurfaceOptions>
    radius: string
    padding: string
    gap: string
    focusRing: string
    style?: React.CSSProperties
}

const MARKS: MarkStyle[] = ["Orb", "Ring", "Atom", "Spiral", "Pulse", "Helix", "Cube", "Morph", "None"]

const DEFAULT_LINKS: NavLinkItem[] = [
    { label: "Work", link: "", newTab: false },
    { label: "Services", link: "", newTab: false },
    { label: "About", link: "", newTab: false },
    { label: "Journal", link: "", newTab: false },
]

function resolve(p: Props): Resolved {
    const mark = p.mark && MARKS.indexOf(p.mark) >= 0 ? p.mark : "Orb"
    return {
        logoText: p.logoText ?? "Particle",
        logoImage: p.logoImage,
        mark,
        logoLink: p.logoLink ?? "",
        logoNewTab: !!p.logoNewTab,
        links: p.links ?? DEFAULT_LINKS,
        button: {
            show: true,
            label: "Let’s talk",
            link: "",
            newTab: false,
            variant: "Particles",
            fill: "#FFFFFF",
            text: "#0C0C0F",
            ...(p.button || {}),
        } as Required<ButtonOptions>,
        align: p.align ?? "Center",
        layout: p.layout ?? "Auto",
        breakpoint: p.breakpoint ?? 720,
        font: p.font || {},
        textColor: p.textColor ?? "rgba(255, 255, 255, 0.64)",
        hoverTextColor: p.hoverTextColor ?? "#FFFFFF",
        particles: {
            color: "#FFFFFF",
            hoverColor: "#FFFFFF",
            density: 1,
            size: 1.2,
            glow: 0.6,
            twinkle: 0.5,
            ...(p.particles || {}),
        } as Required<ParticleOptions>,
        motion: {
            gather: 0.45,
            speed: 1,
            drift: 0.5,
            cursor: 0.5,
            assemble: true,
            ...(p.motion || {}),
        } as Required<MotionOptions>,
        surface: {
            fill: "rgba(14, 14, 18, 0.72)",
            blur: 18,
            shadow: "0px 24px 60px -24px rgba(0, 0, 0, 0.6)",
            ...(p.surface || {}),
        } as Required<SurfaceOptions>,
        radius: p.radius ?? "999px",
        padding: p.padding ?? "8px 8px 8px 22px",
        gap: p.gap ?? "30px",
        focusRing: p.focusRing ?? "#8AB4FF",
        style: p.style,
    }
}

// ------------------------------------------------------------------ helpers

const TAU = Math.PI * 2

function clamp(v: number, a = 0, b = 1) {
    return v < a ? a : v > b ? b : v
}

function smooth(e0: number, e1: number, x: number) {
    const t = clamp((x - e0) / (e1 - e0))
    return t * t * (3 - 2 * t)
}

function hasHref(link?: string) {
    return typeof link === "string" && link.trim().length > 0
}

function firstPx(v: string | number | undefined, fallback: number) {
    if (typeof v === "number") return v
    if (!v) return fallback
    const n = parseFloat(String(v))
    return isNaN(n) ? fallback : n
}

function parseBox(v: string | undefined): [number, number, number, number] {
    const parts = String(v || "")
        .trim()
        .split(/\s+/)
        .map((s) => parseFloat(s))
        .map((n) => (isNaN(n) ? 0 : n))
    if (parts.length === 0) return [0, 0, 0, 0]
    if (parts.length === 1) return [parts[0], parts[0], parts[0], parts[0]]
    if (parts.length === 2) return [parts[0], parts[1], parts[0], parts[1]]
    if (parts.length === 3) return [parts[0], parts[1], parts[2], parts[1]]
    return [parts[0], parts[1], parts[2], parts[3]]
}

function parseColor(input: string | undefined, fallback: RGBA): RGBA {
    if (!input) return fallback
    let s = String(input).trim()
    if (s.startsWith("var(")) {
        const comma = s.indexOf(",")
        if (comma < 0) return fallback
        s = s.slice(comma + 1, s.lastIndexOf(")")).trim()
        return parseColor(s, fallback)
    }
    if (s[0] === "#") {
        let h = s.slice(1)
        if (h.length === 3 || h.length === 4)
            h = h
                .split("")
                .map((c) => c + c)
                .join("")
        const n = parseInt(h.slice(0, 6), 16)
        if (isNaN(n)) return fallback
        const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a]
    }
    const m = s.match(/rgba?\(([^)]+)\)/i)
    if (m) {
        const p = m[1]
            .split(/[\s,/]+/)
            .filter(Boolean)
            .map((x) => (x.endsWith("%") ? (parseFloat(x) / 100) * 255 : parseFloat(x)))
        if (p.length >= 3 && !isNaN(p[0]) && !isNaN(p[1]) && !isNaN(p[2])) {
            let a = p.length > 3 && !isNaN(p[3]) ? p[3] : 1
            if (a > 1) a = a / 255
            return [p[0], p[1], p[2], a]
        }
    }
    return fallback
}

function luminance(c: RGBA) {
    return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255
}

function rgba(c: RGBA, a: number) {
    return `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${Math.max(0, Math.min(1, a)).toFixed(3)})`
}

function mulberry32(seed: number) {
    let s = seed | 0
    return function () {
        s = (s + 0x6d2b79f5) | 0
        let t = Math.imul(s ^ (s >>> 15), 1 | s)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function useReducedMotion() {
    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(mq.matches)
        update()
        if (mq.addEventListener) mq.addEventListener("change", update)
        else mq.addListener(update)
        return () => {
            if (mq.removeEventListener) mq.removeEventListener("change", update)
            else mq.removeListener(update)
        }
    }, [])
    return reduced
}

// Measures the component itself (never the surrounding page) and decides between the
// desktop row and the collapsed menu. "Auto" collapses below the breakpoint or when the
// row would not fit.
function useMobileLayout(
    rootRef: React.RefObject<HTMLElement>,
    layout: Layout,
    breakpoint: number,
    align: Align,
    contentKey: string
): boolean {
    const [mobile, setMobile] = useState(layout === "Mobile")
    const need = useRef(0)
    useIsoLayoutEffect(() => {
        if (layout !== "Auto") {
            setMobile(layout === "Mobile")
            return
        }
        const el = rootRef.current
        if (!el) return
        need.current = 0
        const check = () => {
            const w = el.offsetWidth
            if (!w) return
            if (!el.classList.contains("is-mobile")) {
                const bar = el.querySelector(".pn-bar") as HTMLElement | null
                const logo = el.querySelector(".pn-bar > .pn-logo") as HTMLElement | null
                const links = el.querySelector(".pn-bar > .pn-links") as HTMLElement | null
                const cta = el.querySelector(".pn-bar > .pn-cta") as HTMLElement | null
                if (bar) {
                    const cs = getComputedStyle(bar)
                    const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0)
                    const gap = parseFloat(cs.columnGap) || 0
                    const lw = logo ? logo.scrollWidth : 0
                    const kw = links ? links.scrollWidth : 0
                    const cw = cta ? cta.scrollWidth : 0
                    need.current =
                        align === "Center"
                            ? pad + kw + 2 * gap + 2 * Math.max(lw, cw)
                            : pad + lw + kw + cw + 2 * gap
                }
            }
            const next = w < breakpoint || (need.current > 0 && w < need.current + 4)
            setMobile((prev) => (prev === next ? prev : next))
        }
        check()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(check)
        ro.observe(el)
        return () => ro.disconnect()
    }, [layout, breakpoint, align, contentKey])
    return mobile
}

// ------------------------------------------------------------------ geometry

interface Rect {
    x: number
    y: number
    w: number
    h: number
    r: number
}
interface Pt {
    x: number
    y: number
    nx: number
    ny: number
}

function radiusOf(R: Rect) {
    return Math.max(0, Math.min(R.r, R.w / 2, R.h / 2))
}

function perimeterOf(R: Rect) {
    const r = radiusOf(R)
    return 2 * (R.w - 2 * r) + 2 * (R.h - 2 * r) + TAU * r
}

function insetRect(R: Rect, d: number): Rect {
    return {
        x: R.x + d,
        y: R.y + d,
        w: Math.max(0, R.w - 2 * d),
        h: Math.max(0, R.h - 2 * d),
        r: Math.max(0, R.r - d),
    }
}

// Point on a rounded rectangle outline; t in [0, 1) runs clockwise from the top-left.
function rrPoint(t: number, R: Rect, o: Pt) {
    const r = radiusOf(R)
    const sw = Math.max(0, R.w - 2 * r)
    const sh = Math.max(0, R.h - 2 * r)
    const arc = (Math.PI * r) / 2
    const L = 2 * sw + 2 * sh + 4 * arc
    if (L <= 0) {
        o.x = R.x
        o.y = R.y
        o.nx = 0
        o.ny = -1
        return
    }
    let d = (((t % 1) + 1) % 1) * L
    const seg = [sw, arc, sh, arc, sw, arc, sh, arc]
    for (let s = 0; s < 8; s++) {
        if (d <= seg[s] || s === 7) {
            const len = seg[s]
            edgePoint(s, s === 2 ? d : s === 6 ? len - d : len > 0 ? d / len : 0, R, o, 1)
            return
        }
        d -= seg[s]
    }
}

// Splits an arc-length position on the capacity outline into a segment and a local parameter.
// Straight horizontal edges and corners use a fraction, the vertical sides a pixel offset from
// the top, so the outline can grow downward (menu panel) while every particle keeps its place.
function edgeParam(d: number, C: Rect): [number, number] {
    const r = radiusOf(C)
    const sw = Math.max(0, C.w - 2 * r)
    const sh = Math.max(0, C.h - 2 * r)
    const arc = (Math.PI * r) / 2
    const seg = [sw, arc, sh, arc, sw, arc, sh, arc]
    for (let s = 0; s < 8; s++) {
        if (d <= seg[s] || s === 7) {
            const len = seg[s]
            if (s === 2) return [2, Math.min(d, len)]
            if (s === 6) return [6, Math.max(0, len - d)]
            return [s, len > 0 ? clamp(d / len) : 0]
        }
        d -= seg[s]
    }
    return [0, 0]
}

// Places a particle on the current outline; returns its visibility (side particles beyond the
// current side length are hidden and ride along with the moving corner). `slack` fades the
// soft reveal front out once the outline has reached its full size.
function edgePoint(seg: number, a: number, S: Rect, o: Pt, slack: number): number {
    const r = radiusOf(S)
    const sw = Math.max(0, S.w - 2 * r)
    const sh = Math.max(0, S.h - 2 * r)
    let ang = 0
    let cx = 0
    let cy = 0
    switch (seg) {
        case 0:
            o.x = S.x + r + a * sw
            o.y = S.y
            o.nx = 0
            o.ny = -1
            return 1
        case 2:
            o.x = S.x + S.w
            o.y = S.y + r + Math.min(a, sh)
            o.nx = 1
            o.ny = 0
            return clamp((sh - a) / 5 + slack)
        case 4:
            o.x = S.x + S.w - r - a * sw
            o.y = S.y + S.h
            o.nx = 0
            o.ny = 1
            return 1
        case 6:
            o.x = S.x
            o.y = S.y + r + Math.min(a, sh)
            o.nx = -1
            o.ny = 0
            return clamp((sh - a) / 5 + slack)
        case 1:
            ang = -Math.PI / 2 + (a * Math.PI) / 2
            cx = S.x + S.w - r
            cy = S.y + r
            break
        case 3:
            ang = (a * Math.PI) / 2
            cx = S.x + S.w - r
            cy = S.y + S.h - r
            break
        case 5:
            ang = Math.PI / 2 + (a * Math.PI) / 2
            cx = S.x + r
            cy = S.y + S.h - r
            break
        default:
            ang = Math.PI + (a * Math.PI) / 2
            cx = S.x + r
            cy = S.y + r
    }
    o.nx = Math.cos(ang)
    o.ny = Math.sin(ang)
    o.x = cx + o.nx * r
    o.y = cy + o.ny * r
    return 1
}

// Signed distance from a point to a rounded rectangle (negative inside).
function rrDist(x: number, y: number, R: Rect) {
    const r = radiusOf(R)
    const qx = Math.abs(x - (R.x + R.w / 2)) - (R.w / 2 - r)
    const qy = Math.abs(y - (R.y + R.h / 2)) - (R.h / 2 - r)
    const ox = Math.max(qx, 0)
    const oy = Math.max(qy, 0)
    return Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(qx, qy), 0) - r
}

// Maps (u, v) in the unit square into a rounded rectangle without gaps or clumps.
function fillPoint(u: number, v: number, R: Rect, o: Pt) {
    const r = radiusOf(R)
    const y = R.y + v * R.h
    const dy = Math.abs(y - (R.y + R.h / 2))
    const e = dy - (R.h / 2 - r)
    const hw = R.w / 2 - r + (e > 0 ? Math.sqrt(Math.max(0, r * r - e * e)) : r)
    o.x = R.x + R.w / 2 + (u * 2 - 1) * hw
    o.y = y
}

// Same as fillPoint, but the vertical position is a pixel offset from the top. Rows below the
// current height are hidden and parked on the bottom edge until the shape reaches them.
function fillPointPx(u: number, yOff: number, R: Rect, o: Pt, slack: number): number {
    const v = R.h > 0 ? Math.min(yOff, R.h) / R.h : 0
    fillPoint(u, v, R, o)
    return clamp((R.h - yOff) / 6 + slack)
}

// ------------------------------------------------------------------ animated marks

interface MP {
    x: number
    y: number
    z: number
    a: number
}

const MARK_COUNT: Record<MarkStyle, number> = {
    Orb: 64,
    Ring: 60,
    Atom: 52,
    Spiral: 60,
    Pulse: 60,
    Helix: 44,
    Cube: 44,
    Morph: 48,
    None: 0,
}

const CUBE_PTS: [number, number, number][] = (() => {
    const v: [number, number, number][] = []
    for (let i = 0; i < 8; i++) v.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1])
    const pts: [number, number, number][] = v.slice()
    for (let a = 0; a < 8; a++)
        for (let b = a + 1; b < 8; b++) {
            const d = Math.abs(v[a][0] - v[b][0]) + Math.abs(v[a][1] - v[b][1]) + Math.abs(v[a][2] - v[b][2])
            if (d !== 2) continue
            for (let k = 1; k <= 3; k++) {
                const t = k / 4
                pts.push([
                    v[a][0] + (v[b][0] - v[a][0]) * t,
                    v[a][1] + (v[b][1] - v[a][1]) * t,
                    v[a][2] + (v[b][2] - v[a][2]) * t,
                ])
            }
        }
    return pts
})()

function shapePoint(shape: number, s: number, o: { x: number; y: number }) {
    const t = ((s % 1) + 1) % 1
    if (shape === 0) {
        const a = -Math.PI / 2 + t * TAU
        o.x = Math.cos(a) * 0.92
        o.y = Math.sin(a) * 0.92
        return
    }
    let verts: [number, number][]
    if (shape === 1) {
        const q = 0.78
        verts = [
            [0, -q],
            [q, -q],
            [q, q],
            [-q, q],
            [-q, -q],
        ]
    } else if (shape === 2) {
        verts = [0, 1, 2].map((k) => {
            const a = -Math.PI / 2 + (k * TAU) / 3
            return [Math.cos(a) * 0.98, Math.sin(a) * 0.98 + 0.12] as [number, number]
        })
    } else {
        verts = []
        for (let k = 0; k < 10; k++) {
            const a = -Math.PI / 2 + (k * TAU) / 10
            const r = k % 2 ? 0.44 : 0.98
            verts.push([Math.cos(a) * r, Math.sin(a) * r + 0.04])
        }
    }
    const closed = verts.concat([verts[0]])
    let total = 0
    const lens: number[] = []
    for (let k = 0; k < closed.length - 1; k++) {
        const l = Math.hypot(closed[k + 1][0] - closed[k][0], closed[k + 1][1] - closed[k][1])
        lens.push(l)
        total += l
    }
    let d = t * total
    for (let k = 0; k < lens.length; k++) {
        if (d <= lens[k] || k === lens.length - 1) {
            const f = lens[k] > 0 ? d / lens[k] : 0
            o.x = closed[k][0] + (closed[k + 1][0] - closed[k][0]) * f
            o.y = closed[k][1] + (closed[k + 1][1] - closed[k][1]) * f
            return
        }
        d -= lens[k]
    }
}

const MORPH_A = { x: 0, y: 0 }
const MORPH_B = { x: 0, y: 0 }

// One point of an animated logo mark in normalized space ([-1, 1], z = depth, a = alpha).
// `en` is the eased hover energy (0..1): every mark has one simple, characteristic hover move.
function markPoint(style: MarkStyle, i: number, n: number, ph: number, en: number, o: MP) {
    o.z = 1
    o.a = 1
    if (style === "Orb") {
        // hover: the sphere breathes open, every dot drifting out on its own small wave
        const k = (i + 0.5) / n
        const phi = Math.acos(1 - 2 * k)
        const th = Math.PI * (1 + Math.sqrt(5)) * i
        const R = 0.94 + en * (0.1 + 0.06 * Math.sin(ph * 2.4 + i * 1.7))
        const X = Math.sin(phi) * Math.cos(th)
        const Y = Math.cos(phi)
        const Z = Math.sin(phi) * Math.sin(th)
        const cr = Math.cos(ph)
        const sr = Math.sin(ph)
        const X1 = X * cr + Z * sr
        const Z1 = -X * sr + Z * cr
        o.x = X1 * R
        o.y = (Y * 0.913 - Z1 * 0.408) * R
        o.z = Y * 0.408 + Z1 * 0.913
        return
    }
    if (style === "Ring") {
        // hover: the ring tilts open toward you, the planet swells a little
        const planet = 14
        if (i >= n - planet) {
            const j = i - (n - planet)
            const k = (j + 0.5) / planet
            const phi = Math.acos(1 - 2 * k)
            const th = Math.PI * (1 + Math.sqrt(5)) * j + ph * 0.6
            const pr = 0.32 + 0.06 * en
            o.x = Math.sin(phi) * Math.cos(th) * pr
            o.y = Math.cos(phi) * pr
            o.z = Math.sin(phi) * Math.sin(th)
            o.a = 0.75
            return
        }
        const m = n - planet
        const th = (i / m) * TAU + ph * 0.45
        const X = Math.cos(th)
        const Z = Math.sin(th)
        const open = 0.42 + 0.3 * en
        const Y1 = -Z * 0.9
        const roll = -0.4 + 0.18 * en
        o.x = (X * Math.cos(roll) - Y1 * open * Math.sin(roll)) * 0.98
        o.y = (X * Math.sin(roll) + Y1 * open * Math.cos(roll)) * 0.98
        o.z = Z
        o.a = 0.34 + 0.66 * Math.pow(Math.max(0, Math.cos(th - ph * 1.7)), 9)
        return
    }
    if (style === "Atom") {
        // hover: the two orbits swing apart into a wide X, the nucleus pulses
        const nucleus = 6
        if (i >= n - nucleus) {
            const j = i - (n - nucleus)
            const a = (j / nucleus) * TAU + ph * 0.8
            const nr = 0.1 + en * (0.04 + 0.03 * Math.sin(ph * 5))
            o.x = Math.cos(a) * nr
            o.y = Math.sin(a) * nr
            o.a = 0.85
            return
        }
        // two crossed orbits, each with an electron of light running around it
        const per = Math.floor((n - nucleus) / 2)
        const k = Math.min(1, Math.floor(i / per))
        const j = i - k * per
        const th = (j / per) * TAU
        const ex = Math.cos(th) * 0.98
        const ey = Math.sin(th) * 0.36
        const spread = 0.68 + 0.36 * en
        const rot = k ? -spread : spread
        o.x = ex * Math.cos(rot) - ey * Math.sin(rot)
        o.y = ex * Math.sin(rot) + ey * Math.cos(rot)
        o.z = Math.sin(th) * 0.6 + 0.4
        o.a = 0.42 + 0.58 * Math.pow(Math.max(0, Math.cos(th - (ph * 1.6 + k * Math.PI))), 10)
        return
    }
    if (style === "Spiral") {
        // hover: the galaxy winds up tighter and turns toward you
        const per = Math.floor(n / 2)
        const arm = Math.min(1, Math.floor(i / per))
        const j = i - arm * per
        const r = 0.1 + 0.9 * (j / Math.max(1, per - 1))
        const th = arm * Math.PI + r * (3.6 + 2.2 * en) + ph * 0.8
        o.x = Math.cos(th) * r
        o.y = Math.sin(th) * r * (0.62 + 0.24 * en)
        o.z = Math.sin(th)
        o.a = 0.3 + 0.7 * (1 - r * 0.7)
        return
    }
    if (style === "Pulse") {
        // hover: the rings reach further out and the core lights up
        const center = 6
        if (i >= n - center) {
            const j = i - (n - center)
            const a = (j / center) * TAU
            const cr = 0.1 + 0.05 * en
            o.x = Math.cos(a) * cr
            o.y = Math.sin(a) * cr
            return
        }
        const per = Math.floor((n - center) / 3)
        const k = Math.min(2, Math.floor(i / per))
        const j = i - k * per
        const r = (((ph * 0.28 + k / 3) % 1) + 1) % 1
        const a = (j / per) * TAU + k * 0.4
        const R = 0.2 + r * (0.8 + 0.16 * en)
        o.x = Math.cos(a) * R
        o.y = Math.sin(a) * R
        o.a = Math.pow(1 - r, 1.3) * smooth(0, 0.14, r)
        return
    }
    if (style === "Helix") {
        // hover: the double helix widens and twists faster
        const per = Math.floor(n / 2)
        const s = Math.min(1, Math.floor(i / per))
        const j = i - s * per
        const y = -0.95 + 1.9 * (j / Math.max(1, per - 1))
        const th = y * (2.6 + 0.9 * en) + ph * 1.2 + s * Math.PI
        o.x = Math.sin(th) * (0.6 + 0.2 * en)
        o.y = y
        o.z = Math.cos(th)
        return
    }
    if (style === "Cube") {
        // hover: the cube tips forward to show its top face and grows a touch
        const p = CUBE_PTS[i % CUBE_PTS.length]
        const s = 0.56 + 0.05 * en
        const ay = ph * 0.9
        const ax = 0.6 + Math.sin(ph * 0.4) * 0.15 + 0.45 * en
        const X = p[0] * s
        const Y = p[1] * s
        const Z = p[2] * s
        const X1 = X * Math.cos(ay) + Z * Math.sin(ay)
        const Z1 = -X * Math.sin(ay) + Z * Math.cos(ay)
        const Y2 = Y * Math.cos(ax) - Z1 * Math.sin(ax)
        const Z2 = Y * Math.sin(ax) + Z1 * Math.cos(ax)
        o.x = X1
        o.y = Y2
        o.z = clamp(Z2 / (s * 1.733), -1, 1)
        return
    }
    if (style === "Morph") {
        // hover: the shape glides on to its next form (ph is the morph phase in cycles here)
        const cyc = ph
        const base = Math.floor(cyc)
        const f = cyc - base
        const k = ((base % 4) + 4) % 4
        const m = smooth(0.55, 1, f)
        shapePoint(k, i / n, MORPH_A)
        shapePoint((k + 1) % 4, i / n, MORPH_B)
        const x = MORPH_A.x + (MORPH_B.x - MORPH_A.x) * m
        const y = MORPH_A.y + (MORPH_B.y - MORPH_A.y) * m
        const rot = ph * 0.8
        o.x = x * Math.cos(rot) - y * Math.sin(rot)
        o.y = x * Math.sin(rot) + y * Math.cos(rot)
        o.a = 0.66
        return
    }
    o.x = 0
    o.y = 0
    o.a = 0
}

// ------------------------------------------------------------------ particle engine

const K_EDGE = 0
const K_FILL = 1
const K_CTA = 2
const K_MARK = 3
const K_ICON = 4
const K_DUST = 5
const LV = 14

interface EngineOptions {
    color: string
    hoverColor: string
    density: number
    size: number
    glow: number
    twinkle: number
    gather: number
    speed: number
    drift: number
    cursor: number
    assemble: boolean
    variant: Variant
    hasButton: boolean
    mark: MarkStyle
    mobile: boolean
    radius: number
    reduced: boolean
}

type Range = [number, number]

class ParticleEngine {
    root: HTMLElement
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D | null
    o: EngineOptions
    M = 44
    ratio = 1
    w = 0
    h = 0
    barH = 0
    capH = 0
    cssH = 0
    scale = 1
    innerR = 16
    shape: Rect = { x: 0, y: 0, w: 0, h: 0, r: 0 }
    capShape: Rect = { x: 0, y: 0, w: 0, h: 0, r: 0 }
    buildKey = ""
    homesDirty = true
    pendingDraw = false

    linkEls: HTMLElement[] = []
    linkRects: (Rect | null)[] = []
    ctaEl: HTMLElement | null = null
    ctaFx: HTMLElement[] = []
    cta: Rect | null = null
    markEl: HTMLElement | null = null
    markRect: Rect | null = null
    iconEl: HTMLElement | null = null
    icon: Rect | null = null

    n = 0
    x = new Float32Array(0)
    y = new Float32Array(0)
    vx = new Float32Array(0)
    vy = new Float32Array(0)
    hx = new Float32Array(0)
    hy = new Float32Array(0)
    p1 = new Float32Array(0)
    p2 = new Float32Array(0)
    sz = new Float32Array(0)
    al = new Float32Array(0)
    ph = new Float32Array(0)
    tw = new Float32Array(0)
    rk = new Float32Array(0)
    ed = new Float32Array(0)
    bo = new Float32Array(0)
    ma = new Float32Array(0)
    td = new Float32Array(0)
    lf = new Float32Array(0)
    vz = new Float32Array(0)
    gt = new Float32Array(0)
    gb = new Float32Array(0)
    dl = new Float32Array(0)
    rl = new Float32Array(0)
    sb = new Float32Array(0)
    sa = new Float32Array(0)
    hd = new Float32Array(0)
    mt = new Float32Array(0)
    st = new Uint8Array(0)
    ls = new Int32Array(0)
    da = new Float32Array(0)
    ht = new Float32Array(0)
    kind = new Uint8Array(0)
    seg = new Uint8Array(0)
    flag = new Uint8Array(0)
    gm = new Uint8Array(0)
    rEdge: Range = [0, 0]
    rFill: Range = [0, 0]
    rCta: Range = [0, 0]
    rMark: Range = [0, 0]
    rIcon: Range = [0, 0]
    rDust: Range = [0, 0]
    edgeSpacing = 1.3
    fillArea = 70

    hover = -1
    hoverRect: Rect | null = null
    capA = { x0: 0, x1: 0, y0: 0, y1: 0, v0: 0, v1: 0, w0: 0, w1: 0, moving: false }
    capRect: Rect = { x: 0, y: 0, w: 0, h: 0, r: 0 }
    capIn: Rect = { x: 0, y: 0, w: 0, h: 0, r: 0 }
    gathered: number[] = []
    edgeSlots = 120
    releaseTimer = 0
    pointer = { x: 0, y: 0, inside: false }
    ctaHover = false
    ctaHotEl: HTMLElement | null = null
    ctaEn = 0
    logoHover = false
    markEn = 0
    markPh = 0.9
    morphPh = 1.2
    iconHover = false
    iconEn = 0
    cp = 0
    lastDrawT = 0
    settling = false
    alphaInit = false
    sameColor = true
    menuOpen = false
    openT = 0
    openV = 0
    ctaPhase = 0
    capPhase = 0
    burstT = -99
    lastFxOp = 1
    entranceT = -99
    entering = false
    entered = false
    // with the entrance on, nothing is drawn until it starts (no full pill flashing first)
    waiting = false
    motion = 0
    mp: MP = { x: 0, y: 0, z: 1, a: 1 }

    base: RGBA = [255, 255, 255, 1]
    hot: RGBA = [255, 255, 255, 1]
    glowMode = true
    fills: string[] = []
    sprite: HTMLCanvasElement | null = null
    bx: Float32Array[] = []
    bc = new Int32Array(LV * 2)
    gl = new Float32Array(3 * 1600)
    glc = 0

    running = false
    visible = true
    pageVisible = true
    raf = 0
    lastUpdate = 0
    frame = 0
    ro: ResizeObserver | null = null
    io: IntersectionObserver | null = null
    tmp: Pt = { x: 0, y: 0, nx: 0, ny: 0 }
    destroyed = false
    passive = false
    stats = { frames: 0, ms: 0 }

    // `passive` only lays the particles out (used for the static frame): no listeners,
    // observers or animation loop are attached.
    constructor(root: HTMLElement, canvas: HTMLCanvasElement, o: EngineOptions, passive = false) {
        this.root = root
        this.canvas = canvas
        this.o = o
        this.passive = passive
        this.waiting = !passive && o.assemble && !o.reduced
        this.ctx = canvas.getContext("2d")
        for (let b = 0; b < LV * 2; b++) this.bx.push(new Float32Array(3 * 256))
        this.palette()
        this.collect()
        this.measure(true)
        if (passive) return
        root.addEventListener("pointermove", this.onMove)
        root.addEventListener("pointerleave", this.onLeave)
        root.addEventListener("pointerdown", this.onDown)
        root.addEventListener("focusin", this.onFocusIn)
        root.addEventListener("focusout", this.onFocusOut)
        document.addEventListener("visibilitychange", this.onVisibility)
        if (typeof ResizeObserver !== "undefined") {
            this.ro = new ResizeObserver(() => this.onResize())
            this.ro.observe(root)
        }
        const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts
        if (fonts && fonts.ready) fonts.ready.then(() => !this.destroyed && this.onResize()).catch(() => {})
        if (typeof IntersectionObserver !== "undefined") {
            this.io = new IntersectionObserver(
                (entries) => {
                    for (const e of entries) this.visible = e.isIntersecting
                    if (this.visible) {
                        if (!this.entered) this.enter()
                        this.wake()
                    } else this.stop()
                },
                { rootMargin: "60px" }
            )
            this.io.observe(root)
        } else {
            this.enter()
            this.wake()
        }
    }

    now() {
        return performance.now() / 1000
    }

    destroy() {
        this.destroyed = true
        this.stop()
        window.clearTimeout(this.releaseTimer)
        this.root.removeEventListener("pointermove", this.onMove)
        this.root.removeEventListener("pointerleave", this.onLeave)
        this.root.removeEventListener("pointerdown", this.onDown)
        this.root.removeEventListener("focusin", this.onFocusIn)
        this.root.removeEventListener("focusout", this.onFocusOut)
        document.removeEventListener("visibilitychange", this.onVisibility)
        if (this.ro) this.ro.disconnect()
        if (this.io) this.io.disconnect()
        for (const el of this.linkEls) el.classList.remove("is-hot")
        if (this.ctaHotEl) this.ctaHotEl.classList.remove("is-hot")
        this.resetFx()
    }

    setOptions(o: EngineOptions) {
        const prev = this.o
        this.o = o
        if (prev.color !== o.color || prev.hoverColor !== o.hoverColor) this.palette()
        if (o.reduced && this.entering) this.entering = false
        if (!o.assemble || o.reduced) this.waiting = false
        if (prev.mobile !== o.mobile) this.setHover(-1)
        this.collect()
        this.measure(false)
        this.flushDraw()
        this.wake()
    }

    refresh() {
        this.collect()
        this.measure(false)
        this.flushDraw()
        this.wake()
    }

    setMenuOpen(open: boolean) {
        if (open === this.menuOpen) return
        this.menuOpen = open
        if (!open) this.setHover(-1)
        this.fitCanvas()
        this.flushDraw()
        this.wake()
    }

    palette() {
        this.base = parseColor(this.o.color, [255, 255, 255, 1])
        this.hot = parseColor(this.o.hoverColor, this.base)
        this.sameColor =
            Math.abs(this.base[0] - this.hot[0]) + Math.abs(this.base[1] - this.hot[1]) + Math.abs(this.base[2] - this.hot[2]) < 6 &&
            Math.abs(this.base[3] - this.hot[3]) < 0.02
        this.glowMode = luminance(this.base) > 0.45
        this.fills = []
        for (let c = 0; c < 2; c++) {
            const col = c ? this.hot : this.base
            for (let l = 0; l < LV; l++) this.fills.push(rgba(col, ((l + 0.5) / LV) * col[3]))
        }
        this.sprite = null
        // the static frame only records where glows go, it needs no real sprite canvas
        if (this.passive) {
            if (this.glowMode) this.sprite = {} as HTMLCanvasElement
            return
        }
        if (typeof document !== "undefined" && this.glowMode) {
            const s = document.createElement("canvas")
            s.width = s.height = 64
            const g = s.getContext("2d")
            if (g) {
                const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
                grd.addColorStop(0, rgba(this.hot, 1))
                grd.addColorStop(0.35, rgba(this.hot, 0.35))
                grd.addColorStop(1, rgba(this.hot, 0))
                g.fillStyle = grd
                g.fillRect(0, 0, 64, 64)
                this.sprite = s
            }
        }
    }

    collect() {
        const r = this.root
        const m = this.o.mobile
        this.linkEls.forEach((el) => el.classList.remove("is-hot"))
        this.linkEls = Array.from(
            r.querySelectorAll(m ? ".pn-panel .pn-plink" : ".pn-bar .pn-link")
        ) as HTMLElement[]
        if (this.hover >= 0 && this.linkEls[this.hover]) this.linkEls[this.hover].classList.add("is-hot")
        const cta = r.querySelector(m ? ".pn-panel .pn-cta" : ".pn-bar .pn-cta") as HTMLElement | null
        if (cta !== this.ctaEl) {
            this.resetFx()
            this.ctaEl = cta
            this.ctaFx = cta ? (Array.from(cta.querySelectorAll(".pn-cta-bg, .pn-cta-label")) as HTMLElement[]) : []
        }
        this.markEl = r.querySelector(".pn-mark") as HTMLElement | null
        this.iconEl = m ? (r.querySelector(".pn-menu-box") as HTMLElement | null) : null
    }

    resetFx() {
        for (const el of this.ctaFx) el.style.opacity = ""
        this.lastFxOp = 1
    }

    measure(force: boolean) {
        const root = this.root
        const w = root.offsetWidth
        const h = root.offsetHeight
        const bb = root.getBoundingClientRect()
        this.scale = w > 0 && bb.width > 0 ? bb.width / w : 1
        const bar = root.querySelector(".pn-bar") as HTMLElement | null
        this.barH = bar ? bar.offsetHeight : h
        const inner = root.querySelector(".pn-panel-inner") as HTMLElement | null
        this.capH = this.o.mobile && inner ? this.barH + inner.offsetHeight : Math.max(h, this.barH)
        if (bar) {
            const pt = parseFloat(getComputedStyle(bar).paddingTop) || 0
            this.innerR = Math.max(6, this.o.radius - pt)
        }
        this.w = w
        this.h = h
        this.computeRects(bb)
        const dpr = (typeof window !== "undefined" && window.devicePixelRatio) || 1
        this.ratio = Math.min(3, Math.max(1, dpr * this.scale))
        this.fitCanvas()
        this.updateShape()
        const o = this.o
        const key = [
            Math.round(w),
            Math.round(this.capH),
            Math.round(this.barH),
            this.cta ? Math.round(this.cta.w) + "x" + Math.round(this.cta.h) : "-",
            this.markRect ? 1 : 0,
            this.icon ? 1 : 0,
            o.density,
            o.size,
            o.variant,
            o.hasButton,
            o.mark,
            o.mobile,
            o.radius,
        ].join("|")
        if (force || key !== this.buildKey) {
            this.buildKey = key
            this.build()
        }
        this.homesDirty = true
    }

    // While the menu is open or animating, the canvas already covers the fully open panel, so
    // the unfolding never resizes (and blanks) it. Closed, it shrinks back to the bar.
    fitCanvas() {
        const expanded =
            this.o.mobile && (this.menuOpen || this.openT > 0.002 || this.h > this.barH + 0.5)
        const covered = expanded ? Math.max(this.h, this.capH) : this.h
        const cssH = Math.round(covered + this.M * 2)
        if (cssH !== this.cssH) {
            this.cssH = cssH
            this.canvas.style.height = cssH + "px"
        }
        const cw = Math.max(1, Math.round((this.w + this.M * 2) * this.ratio))
        const ch = Math.max(1, Math.round(cssH * this.ratio))
        if (this.canvas.width !== cw || this.canvas.height !== ch) {
            this.canvas.width = cw
            this.canvas.height = ch
            this.pendingDraw = true
        }
    }

    // A resized canvas is blank until the next frame, so redraw it right away.
    flushDraw() {
        if (!this.pendingDraw) return
        this.pendingDraw = false
        if (this.homesDirty) this.computeHomes()
        this.draw(this.now())
    }

    computeRects(bb?: DOMRect) {
        const box = bb || this.root.getBoundingClientRect()
        const s = this.scale || 1
        const rel = (el: HTMLElement): Rect | null => {
            if (!el.offsetParent && getComputedStyle(el).position !== "fixed") return null
            const b = el.getBoundingClientRect()
            if (b.width === 0 && b.height === 0) return null
            return {
                x: (b.left - box.left) / s,
                y: (b.top - box.top) / s,
                w: b.width / s,
                h: b.height / s,
                r: b.height / s / 2,
            }
        }
        this.linkRects = this.linkEls.map((el) => {
            const rc = rel(el)
            if (rc) rc.r = Math.min(rc.h / 2, this.innerR)
            return rc
        })
        this.cta = this.ctaEl ? rel(this.ctaEl) : null
        if (this.cta && this.ctaEl) {
            const br = parseFloat(getComputedStyle(this.ctaEl).borderTopLeftRadius)
            this.cta.r = Math.min(this.cta.h / 2, isNaN(br) ? this.cta.h / 2 : br)
        }
        this.markRect = this.markEl ? rel(this.markEl) : null
        this.icon = this.iconEl ? rel(this.iconEl) : null
        if (this.hover >= 0) {
            const rc = this.linkRects[this.hover]
            if (rc) this.hoverRect = rc
        }
    }

    shapeAt(k: number, hOverride?: number): Rect {
        const h = hOverride !== undefined ? hOverride : this.barH + (this.capH - this.barH) * k
        const closedR = Math.min(this.o.radius, this.barH / 2)
        const openR = Math.min(this.o.radius, 26)
        const r = Math.min(closedR + (openR - closedR) * k, h / 2, this.w / 2)
        return { x: 0, y: 0, w: this.w, h, r }
    }

    updateShape() {
        const span = this.capH - this.barH
        const k = this.o.mobile && span > 1 ? clamp((this.h - this.barH) / span) : 0
        this.shape = this.shapeAt(k, this.h)
    }

    build() {
        const o = this.o
        const d = clamp(o.density, 0.2, 3)
        const f = this.w < 520 ? 0.82 : 1
        const C = this.o.mobile ? this.shapeAt(1) : this.shapeAt(0, Math.max(this.h, this.barH))
        this.capShape = C
        const perim = Math.max(perimeterOf(C), 1)
        const inner = insetRect(C, 3.4)
        const area = Math.max(inner.w * inner.h, 1)
        this.edgeSpacing = 1.3 / (d * f)
        this.fillArea = 70 / (d * f)
        let nE = Math.round(perim / this.edgeSpacing)
        let nF = Math.round(area / this.fillArea)
        let nC = 0
        if (o.hasButton && this.cta) {
            const cp = perimeterOf(this.cta)
            const ca = this.cta.w * this.cta.h
            nC = o.variant === "Particles" ? Math.round((cp / 1.05) * d + (ca / 40) * d) : Math.round((cp / 2.1) * d)
        }
        const nO = this.markRect ? MARK_COUNT[o.mark] || 0 : 0
        const nI = o.mobile && this.icon ? 40 : 0
        let nD = o.hasButton && this.cta && o.variant === "Solid" ? Math.round(((this.cta.w * this.cta.h) / 11) * clamp(d, 0.4, 1.5)) : 0
        const MAX = 7000
        const total0 = nE + nF + nC + nO + nI + nD
        if (total0 > MAX) {
            const k = MAX / total0
            nE = Math.round(nE * k)
            nF = Math.round(nF * k)
            nC = Math.round(nC * k)
            nD = Math.round(nD * k)
        }
        const n = nE + nF + nC + nO + nI + nD
        this.n = n
        const F = () => new Float32Array(n)
        this.x = F()
        this.y = F()
        this.vx = F()
        this.vy = F()
        this.hx = F()
        this.hy = F()
        this.p1 = F()
        this.p2 = F()
        this.sz = F()
        this.al = F()
        this.ph = F()
        this.tw = F()
        this.rk = F()
        this.ed = F()
        this.bo = F()
        this.ma = F()
        this.td = F()
        this.lf = F()
        this.vz = F()
        this.gt = F()
        this.gb = F()
        this.dl = F()
        this.rl = F()
        this.sb = F()
        this.sa = F()
        this.hd = F()
        this.mt = F()
        this.st = new Uint8Array(n)
        this.ls = new Int32Array(n)
        this.da = F()
        this.ht = F()
        this.alphaInit = false
        this.kind = new Uint8Array(n)
        this.seg = new Uint8Array(n)
        this.flag = new Uint8Array(n)
        this.gm = new Uint8Array(n)
        this.gathered = []
        let i = 0
        const size = clamp(o.size, 0.4, 4)
        const R = Math.random
        const common = (idx: number) => {
            this.ph[idx] = R() * TAU
            this.tw[idx] = 1.1 + R() * 2.4
            this.rk[idx] = 0.72 + R() * 0.56
            this.lf[idx] = 1
            this.vz[idx] = 1
            this.ma[idx] = 1
        }
        this.rEdge = [i, i + nE]
        for (let j = 0; j < nE; j++, i++) {
            this.kind[i] = K_EDGE
            const [sg, a] = edgeParam(R() * perim, C)
            this.seg[i] = sg
            this.p1[i] = a
            this.p2[i] = -Math.pow(R(), 2.2) * 1.15 + 0.22
            this.sz[i] = size * (0.7 + R() * 0.5)
            this.al[i] = 0.4 + R() * 0.34
            common(i)
        }
        this.rFill = [i, i + nF]
        for (let j = 0; j < nF; j++, i++) {
            this.kind[i] = K_FILL
            this.p1[i] = R()
            this.p2[i] = R() * inner.h
            const sparkle = R() < 0.03
            this.sz[i] = size * (sparkle ? 1.05 + R() * 0.4 : 0.55 + R() * 0.6)
            this.al[i] = sparkle ? 0.55 + R() * 0.3 : 0.09 + R() * R() * 0.3
            common(i)
        }
        this.rCta = [i, i + nC]
        if (nC) {
            const cp = this.cta ? perimeterOf(this.cta) : 1
            const edgeShare = o.variant === "Particles" ? Math.min(0.9, (cp / 1.05) * d / Math.max(1, nC)) : 1
            for (let j = 0; j < nC; j++, i++) {
                this.kind[i] = K_CTA
                const edge = o.variant === "Solid" || R() < edgeShare
                this.gm[i] = edge ? 0 : 1
                this.p1[i] = R()
                if (edge) this.p2[i] = o.variant === "Solid" ? R() * 1.6 : -Math.pow(R(), 2) * 1.0 + 0.25
                else {
                    // inner specks hug the rim so the label stays calm
                    const q = Math.pow(R(), 2.2) * 0.42
                    this.p2[i] = R() < 0.5 ? q : 1 - q
                }
                this.sz[i] = size * (edge ? 0.72 + R() * 0.45 : 0.55 + R() * 0.5)
                this.al[i] = 0.62 + R() * 0.38
                common(i)
            }
        }
        this.rMark = [i, i + nO]
        for (let j = 0; j < nO; j++, i++) {
            this.kind[i] = K_MARK
            this.sz[i] = size * (0.82 + R() * 0.3)
            this.al[i] = 0.88 + R() * 0.12
            common(i)
        }
        this.rIcon = [i, i + nI]
        for (let j = 0; j < nI; j++, i++) {
            this.kind[i] = K_ICON
            this.gm[i] = j % 2
            this.p1[i] = (Math.floor(j / 2) + 0.5) / (nI / 2)
            this.sz[i] = size * (0.95 + R() * 0.3)
            this.al[i] = 0.85 + R() * 0.15
            common(i)
        }
        this.rDust = [i, i + nD]
        for (let j = 0; j < nD; j++, i++) {
            this.kind[i] = K_DUST
            this.p1[i] = R()
            this.p2[i] = R()
            this.sz[i] = size * (0.6 + R() * 0.7)
            this.al[i] = 0.6 + R() * 0.4
            common(i)
        }
        this.updateShape()
        this.computeHomes(false)
        for (let q = 0; q < n; q++) {
            const kd = this.kind[q]
            let px = this.hx[q]
            let py = this.hy[q]
            if (kd === K_CTA || kd === K_DUST) {
                const c = this.cta
                px = c ? c.x + c.w * (0.1 + 0.8 * this.p1[q]) : 0
                py = c ? c.y + c.h * (0.2 + 0.6 * (kd === K_DUST ? this.p2[q] : 0.5)) : 0
            } else if (kd === K_MARK) {
                const c = this.markRect
                px = c ? c.x + c.w / 2 : 0
                py = c ? c.y + c.h / 2 : 0
            } else if (kd === K_ICON) {
                const c = this.icon
                px = c ? c.x + c.w / 2 : 0
                py = c ? c.y + c.h / 2 : 0
            }
            this.x[q] = px
            this.y[q] = py
        }
        if (this.entering) this.scatter(this.now() - this.entranceT)
        if (this.hover >= 0) {
            const h = this.hover
            this.hover = -1
            this.setHover(h)
        }
    }

    // `carry` moves resting particles together with their homes, so the outline sticks to the
    // glass while the panel unfolds or the nav resizes instead of trailing behind on springs.
    computeHomes(carry = true) {
        const S = this.shape
        const C = this.capShape
        const t = this.tmp
        // While the panel unfolds, particles below the current outline stay hidden; once the
        // outline reaches its full size the soft reveal front fades away.
        const sideC = Math.max(0, C.h - 2 * radiusOf(C))
        const sideS = Math.max(0, S.h - 2 * radiusOf(S))
        const slackE = clamp(1 - (sideC - sideS) / 10)
        const slackF = clamp(1 - (C.h - S.h) / 12)
        const [e0, e1] = this.rEdge
        for (let i = e0; i < e1; i++) {
            const v = edgePoint(this.seg[i], this.p1[i], S, t, slackE)
            const b = this.p2[i]
            const nx = t.x + t.nx * b
            const ny = t.y + t.ny * b
            if (carry) {
                this.x[i] += nx - this.hx[i]
                this.y[i] += ny - this.hy[i]
            }
            this.hx[i] = nx
            this.hy[i] = ny
            this.vz[i] = v
            // light from above: bright top rim, softer sides, dim underside
            this.lf[i] = 0.82 - 0.3 * t.ny
        }
        const Si = insetRect(S, 3.4)
        const [f0, f1] = this.rFill
        for (let i = f0; i < f1; i++) {
            this.vz[i] = fillPointPx(this.p1[i], this.p2[i], Si, t, slackF)
            if (carry && this.flag[i] !== 1) {
                this.x[i] += t.x - this.hx[i]
                this.y[i] += t.y - this.hy[i]
            }
            this.hx[i] = t.x
            this.hy[i] = t.y
            // calm interior for the labels, a little more life near the rim
            const dEdge = Math.min(t.y - S.y, S.y + S.h - t.y)
            const e = 1 - smooth(0, 1, dEdge / 22)
            this.lf[i] = (0.42 + 0.58 * e) * (1.08 - 0.16 * clamp((t.y - S.y) / Math.max(1, S.h)))
        }
        this.homesDirty = false
    }

    local(e: PointerEvent) {
        const b = this.root.getBoundingClientRect()
        const s = this.scale || 1
        return { x: (e.clientX - b.left) / s, y: (e.clientY - b.top) / s }
    }

    // ---------------------------------------------------------- interaction

    onMove = (e: PointerEvent) => {
        if (e.pointerType === "touch") return
        const p = this.local(e)
        this.pointer.x = p.x
        this.pointer.y = p.y
        this.pointer.inside = true
        const t = e.target as Element | null
        const link = t && t.closest ? (t.closest(".pn-link, .pn-plink") as HTMLElement | null) : null
        const cta = t && t.closest ? (t.closest(".pn-cta") as HTMLElement | null) : null
        // the whole link list is one continuous hover area: crossing the gap between two links
        // keeps the capsule instead of releasing and gathering again
        const inList = !!(t && t.closest && (t.closest(".pn-links") || (!cta && t.closest(".pn-panel-inner"))))
        this.hoverFromElement(link, inList)
        this.setCtaHover(cta)
        this.logoHover = !!(t && t.closest && t.closest(".pn-logo"))
        this.iconHover = !!(t && t.closest && t.closest(".pn-menu"))
        this.wake()
    }

    onLeave = () => {
        this.pointer.inside = false
        this.logoHover = false
        this.iconHover = false
        this.setCtaHover(null)
        if (this.hover >= 0) this.scheduleRelease(60)
        this.wake()
    }

    onDown = (e: PointerEvent) => {
        const t = e.target as Element | null
        if (t && t.closest && t.closest(".pn-cta")) this.burst()
        if (e.pointerType === "touch") {
            const link = t && t.closest ? (t.closest(".pn-link, .pn-plink") as HTMLElement | null) : null
            if (link) {
                this.hoverFromElement(link)
                this.scheduleRelease(700)
            }
        }
        this.wake()
    }

    onFocusIn = (e: FocusEvent) => {
        const t = e.target as HTMLElement | null
        if (!t || !t.closest) return
        let visible = true
        try {
            visible = t.matches(":focus-visible")
        } catch (err) {
            visible = true
        }
        if (!visible) return
        const link = t.closest(".pn-link, .pn-plink") as HTMLElement | null
        if (link) this.hoverFromElement(link)
        const cta = t.closest(".pn-cta") as HTMLElement | null
        if (cta) this.setCtaHover(cta)
        this.wake()
    }

    onFocusOut = () => {
        if (!this.pointer.inside) {
            this.setCtaHover(null)
            if (this.hover >= 0) this.scheduleRelease(120)
        }
    }

    onVisibility = () => {
        this.pageVisible = document.visibilityState !== "hidden"
        if (this.pageVisible) this.wake()
        else this.stop()
    }

    onResize() {
        if (this.destroyed) return
        this.measure(false)
        this.flushDraw()
        this.wake()
    }

    setCtaHover(el: HTMLElement | null) {
        if (this.ctaHotEl && this.ctaHotEl !== el) this.ctaHotEl.classList.remove("is-hot")
        if (el) el.classList.add("is-hot")
        this.ctaHotEl = el
        this.ctaHover = !!el && el === this.ctaEl
    }

    hoverFromElement(link: HTMLElement | null, inList = false) {
        if (link) {
            const i = this.linkEls.indexOf(link)
            if (i >= 0) {
                window.clearTimeout(this.releaseTimer)
                this.releaseTimer = 0
                this.setHover(i)
                return
            }
        }
        if (inList && this.hover >= 0) {
            window.clearTimeout(this.releaseTimer)
            this.releaseTimer = 0
            return
        }
        if (this.hover >= 0 && !this.releaseTimer) this.scheduleRelease(140)
    }

    scheduleRelease(ms: number) {
        window.clearTimeout(this.releaseTimer)
        this.releaseTimer = window.setTimeout(() => {
            this.releaseTimer = 0
            this.setHover(-1)
            this.wake()
        }, ms)
    }

    setHover(i: number) {
        if (i === this.hover && (i < 0 || this.gathered.length)) return
        const prev = this.hover
        if (prev >= 0 && this.linkEls[prev]) this.linkEls[prev].classList.remove("is-hot")
        this.hover = i
        const t = this.now()
        if (i < 0) {
            this.releaseAll(t)
            this.gathered = []
            this.hoverRect = null
            return
        }
        if (this.linkEls[i]) this.linkEls[i].classList.add("is-hot")
        this.computeRects()
        const cap = this.linkRects[i]
        if (!cap) return
        this.hoverRect = cap
        if (this.gathered.length) {
            // another link: the formed capsule glides over as one shape (stepCapsule). The spots it
            // borrowed its particles from are refilled in place by stand-ins, so no hole follows.
            this.wake()
            return
        }
        const ca = this.capA
        ca.x0 = cap.x
        ca.x1 = cap.x + cap.w
        ca.y0 = cap.y
        ca.y1 = cap.y + cap.h
        ca.v0 = ca.v1 = ca.w0 = ca.w1 = 0
        this.syncCapsule()
        const cx = cap.x + cap.w / 2
        const cy = cap.y + cap.h / 2
        const [f0, f1] = this.rFill
        if (this.homesDirty) this.computeHomes()
        {
            let visCount = 0
            for (let j = f0; j < f1; j++) if (this.vz[j] > 0.5) visCount++
            // same highlight density for every capsule size (big menu links don't drain the panel)
            const g = clamp(this.o.gather, 0.05, 0.9)
            const K = Math.round(Math.min(visCount * g, (cap.w * cap.h * g) / 5.4))
            const cand: { j: number; d: number }[] = []
            for (let j = f0; j < f1; j++) {
                if (this.vz[j] <= 0.5) continue
                const dx = this.x[j] - cx
                const dy = this.y[j] - cy
                cand.push({ j, d: dx * dx + dy * dy * 4 + Math.random() * 2200 })
            }
            cand.sort((a, b) => a.d - b.d)
            this.gathered = cand.slice(0, K).map((c) => c.j)
        }
        const list = this.gathered.map((j) => ({
            j,
            a: Math.atan2((this.y[j] - cy) / Math.max(1, cap.h), (this.x[j] - cx) / Math.max(1, cap.w)),
        }))
        list.sort((a, b) => a.a - b.a)
        let bestT = 0
        let bestD = 1e9
        const a0 = list.length ? list[0].a : 0
        for (let q = 0; q < 72; q++) {
            const tt = q / 72
            rrPoint(tt, cap, this.tmp)
            const aa = Math.atan2((this.tmp.y - cy) / cap.h, (this.tmp.x - cx) / cap.w)
            let dd = Math.abs(aa - a0)
            if (dd > Math.PI) dd = TAU - dd
            if (dd < bestD) {
                bestD = dd
                bestT = tt
            }
        }
        const edges = list.filter((_, q) => q % 8 < 5).length || 1
        this.edgeSlots = edges
        let e = 0
        const sp = clamp(this.o.speed, 0.3, 3)
        for (let q = 0; q < list.length; q++) {
            const j = list[q].j
            if (q % 8 < 5) {
                this.gm[j] = 0
                this.gt[j] = bestT + e / edges
                this.gb[j] = (Math.random() - 0.5) * 1.5
                e++
            } else {
                this.gm[j] = 1
                this.gt[j] = Math.random()
                this.gb[j] = Math.random()
            }
            const dx = this.x[j] - cx
            const dy = this.y[j] - cy
            const dist = Math.sqrt(dx * dx + dy * dy)
            // particles still glowing from a release rejoin right away, the rest stream in by distance
            const warm = this.flag[j] !== 0 || this.ht[j] > 0.3
            this.dl[j] = this.o.reduced ? t : t + (warm ? Math.random() * 0.04 : dist / (1100 * sp) + Math.random() * 0.05)
            this.flag[j] = 1
            this.st[j] = 0
            this.rl[j] = 0
            // its spot shows empty while the capsule forms, then heals softly (farthest first);
            // a spot that is still shown by a stand-in simply stays shown
            const far = clamp(dist / 220)
            this.hd[j] = this.sb[j] > 0.5 ? t : t + 0.5 + 0.3 * (1 - far) + Math.random() * 0.08
        }
        this.wake()
    }

    // Leaving: a capsule particle whose own spot is still empty flies back and refills it (the
    // soft release from before). One whose spot is already shown by its stand-in dissolves into
    // the field right around the capsule instead and then quietly takes the stand-in's place —
    // so nothing ever crosses the bar.
    releaseAll(t: number) {
        const [f0, f1] = this.rFill
        const R = this.capRect
        const cx = R.x + R.w / 2
        const cy = R.y + R.h / 2
        const landers: number[] = []
        for (let j = f0; j < f1; j++) {
            if (this.flag[j] !== 1) continue
            this.st[j] = 0
            if (t < this.dl[j]) {
                // never left its spot
                this.flag[j] = 0
                continue
            }
            if (this.o.reduced) {
                this.flag[j] = 0
                this.x[j] = this.hx[j]
                this.y[j] = this.hy[j]
                this.vx[j] = 0
                this.vy[j] = 0
                this.sb[j] = 0
                continue
            }
            // its own spot is close by (or still empty): fly back there; the stand-in, if any,
            // fades out as it arrives
            const hdx = this.hx[j] - cx
            const hdy = this.hy[j] - cy
            if (this.sb[j] >= 0.5 && hdx * hdx + hdy * hdy * 4 > 220 * 220) landers.push(j)
            else {
                this.flag[j] = 3
                this.dl[j] = t + 0.04 + Math.random() * 0.1
            }
        }
        if (!landers.length) return
        // the nearest visible spots around the capsule, matched by angle with the best rotation
        // (the mirror image of the gather: short paths that never cross)
        const spots: { j: number; d: number }[] = []
        for (let j = f0; j < f1; j++) {
            if (this.flag[j] !== 0 || this.vz[j] <= 0.5) continue
            spots.push({ j, d: rrDist(this.hx[j], this.hy[j], R) })
        }
        spots.sort((a, b) => Math.abs(a.d) - Math.abs(b.d))
        const m = Math.min(landers.length, spots.length)
        for (let k = m; k < landers.length; k++) {
            this.flag[landers[k]] = 3
            this.dl[landers[k]] = t + 0.04 + Math.random() * 0.1
        }
        if (!m) return
        const L = landers.slice(0, m).map((j) => ({ j, a: Math.atan2(this.y[j] - cy, this.x[j] - cx) }))
        const S = spots.slice(0, m).map((c) => ({ j: c.j, a: Math.atan2(this.hy[c.j] - cy, this.hx[c.j] - cx) }))
        L.sort((a, b) => a.a - b.a)
        S.sort((a, b) => a.a - b.a)
        let bestOff = 0
        let bestCost = Infinity
        const step = Math.max(1, Math.floor(m / 60))
        for (let off = 0; off < m; off += step) {
            let c = 0
            for (let q = 0; q < m; q++) {
                const a = L[q].j
                const b = S[(q + off) % m].j
                const dx = this.x[a] - this.hx[b]
                const dy = this.y[a] - this.hy[b]
                c += dx * dx + dy * dy
            }
            if (c < bestCost) {
                bestCost = c
                bestOff = off
            }
        }
        for (let q = 0; q < m; q++) {
            const a = L[q].j
            this.flag[a] = 5
            this.ls[a] = S[(q + bestOff) % m].j
            this.dl[a] = t + 0.04 + Math.random() * 0.1
        }
    }

    // The highlight capsule as an animated shape: on a link change its edges spring to the new
    // link, the leading edge faster than the trailing one, so it stretches over and settles
    // like a liquid pill. Particles ride on this shape instead of being re-sorted.
    stepCapsule(dt: number) {
        const target = this.hoverRect
        const ca = this.capA
        if (!target) return
        const tx0 = target.x
        const tx1 = target.x + target.w
        const ty0 = target.y
        const ty1 = target.y + target.h
        if (this.o.reduced) {
            ca.x0 = tx0
            ca.x1 = tx1
            ca.y0 = ty0
            ca.y1 = ty1
            ca.v0 = ca.v1 = ca.w0 = ca.w1 = 0
        } else {
            const sp = clamp(this.o.speed, 0.3, 3)
            const right = tx0 + tx1 > ca.x0 + ca.x1
            // long jumps glide a little softer so the stretch stays modest
            const jump = Math.abs(tx0 + tx1 - ca.x0 - ca.x1) / 2
            const soft = jump > 2.2 * Math.max(40, target.w) ? 0.6 : 1
            const kLead = 700 * sp * sp * soft
            const kTrail = 380 * sp * sp * soft
            const spring = (p: number, v: number, to: number, k: number, z: number, h: number) => {
                const c = 2 * Math.sqrt(k) * z
                return v + (k * (to - p) - c * v) * h
            }
            const steps = dt > 1 / 90 ? 2 : 1
            const h = dt / steps
            for (let q = 0; q < steps; q++) {
                ca.v0 = spring(ca.x0, ca.v0, tx0, right ? kTrail : kLead, right ? 0.95 : 0.9, h)
                ca.v1 = spring(ca.x1, ca.v1, tx1, right ? kLead : kTrail, right ? 0.9 : 0.95, h)
                ca.w0 = spring(ca.y0, ca.w0, ty0, 700 * sp * sp, 0.95, h)
                ca.w1 = spring(ca.y1, ca.w1, ty1, 700 * sp * sp, 0.95, h)
                ca.x0 += ca.v0 * h
                ca.x1 += ca.v1 * h
                ca.y0 += ca.w0 * h
                ca.y1 += ca.w1 * h
            }
            // the stretch never exceeds ~35 %: the trailing edge is pulled along
            const maxW = Math.max(target.w, 8) * 1.35
            if (ca.x1 - ca.x0 > maxW) {
                if (right) ca.x0 = ca.x1 - maxW
                else ca.x1 = ca.x0 + maxW
            }
        }
        this.syncCapsule()
    }

    syncCapsule() {
        const ca = this.capA
        const target = this.hoverRect
        let x0 = Math.min(ca.x0, ca.x1 - 4)
        const x1 = Math.max(ca.x1, x0 + 4)
        let y0 = ca.y0
        let y1 = ca.y1
        // a stretched capsule gets a touch thinner (keeps the liquid look)
        if (target) {
            const stretch = (x1 - x0) / Math.max(1, target.w)
            if (stretch > 1) {
                const k = Math.max(0.8, 1 / Math.sqrt(stretch))
                const cy = (y0 + y1) / 2
                const hh = ((y1 - y0) / 2) * k
                y0 = cy - hh
                y1 = cy + hh
            }
        }
        x0 = Math.min(x0, x1 - 4)
        const h = Math.max(4, y1 - y0)
        const R = this.capRect
        R.x = x0
        R.y = y0
        R.w = x1 - x0
        R.h = h
        R.r = Math.min(h / 2, this.innerR)
        const I = this.capIn
        I.x = R.x + 3
        I.y = R.y + 3
        I.w = Math.max(0, R.w - 6)
        I.h = Math.max(0, R.h - 6)
        I.r = Math.max(0, R.r - 3)
        ca.moving = Math.abs(ca.v0) + Math.abs(ca.v1) + Math.abs(ca.w0) + Math.abs(ca.w1) > 2
    }

    burst() {
        if (this.o.reduced || !this.cta) return
        const t = this.now()
        this.burstT = t
        const c = this.cta
        const cx = c.x + c.w / 2
        const cy = c.y + c.h / 2
        const kick = (i: number, base: number) => {
            let dx = this.x[i] - cx
            let dy = this.y[i] - cy
            const dd = Math.sqrt(dx * dx + dy * dy) || 1
            dx /= dd
            dy /= dd
            const ang = (Math.random() - 0.5) * 1.1
            const ca = Math.cos(ang)
            const sa = Math.sin(ang)
            const ux = dx * ca - dy * sa
            const uy = dx * sa + dy * ca
            const s = base * (0.4 + Math.random() * 0.95)
            this.vx[i] += ux * s
            this.vy[i] += uy * s * 0.8
        }
        const [c0, c1] = this.rCta
        for (let i = c0; i < c1; i++) kick(i, 200)
        const [d0, d1] = this.rDust
        if (d1 > d0) {
            const ci = insetRect(c, 2)
            for (let i = d0; i < d1; i++) {
                fillPoint(this.p1[i], this.p2[i], ci, this.tmp)
                this.x[i] = this.tmp.x
                this.y[i] = this.tmp.y
                this.vx[i] = 0
                this.vy[i] = 0
                kick(i, 240)
            }
        }
        const [e0, f1] = [this.rEdge[0], this.rFill[1]]
        for (let i = e0; i < f1; i++) {
            const dx = this.x[i] - cx
            const dy = this.y[i] - cy
            if (dx * dx + dy * dy < 90 * 90) kick(i, 80)
        }
        this.wake()
    }

    enter() {
        if (this.entered) return
        this.entered = true
        this.waiting = false
        if (!this.o.assemble || this.o.reduced || !this.n) return
        this.entranceT = this.now()
        this.entering = true
        this.scatter(0)
    }

    // Scatters the particles into a soft cloud; they then assemble the pill from left to right.
    scatter(elapsed: number) {
        const S = this.shape
        const R = Math.random
        for (let i = 0; i < this.n; i++) {
            const kd = this.kind[i]
            if (kd === K_DUST) continue
            const bx = kd <= K_FILL ? this.hx[i] : this.x[i]
            const by = kd <= K_FILL ? this.hy[i] : this.y[i]
            const ang = R() * TAU
            const dist = 34 + R() * 120
            this.x[i] = bx + Math.cos(ang) * dist
            this.y[i] = by + Math.sin(ang) * dist * 0.5
            this.vx[i] = 0
            this.vy[i] = 0
            this.ed[i] = elapsed + clamp((bx - S.x) / Math.max(1, S.w)) * 0.5 + R() * 0.24
        }
    }

    // ---------------------------------------------------------- loop

    wake() {
        if (this.destroyed || !this.visible || !this.pageVisible) return
        this.running = true
        if (!this.raf) {
            this.lastUpdate = this.now()
            this.raf = requestAnimationFrame(this.tick)
        }
    }

    stop() {
        this.running = false
        if (this.raf) cancelAnimationFrame(this.raf)
        this.raf = 0
    }

    idle(t: number) {
        return (
            !this.pointer.inside &&
            this.hover < 0 &&
            !this.ctaHover &&
            this.ctaEn < 0.01 &&
            this.markEn < 0.01 &&
            this.iconEn < 0.01 &&
            !this.settling &&
            !this.capA.moving &&
            this.cp < 0.003 &&
            t - this.burstT > 1.3 &&
            !this.entering &&
            this.motion < 3 &&
            Math.abs(this.openT - (this.menuOpen ? 1 : 0)) < 0.002 &&
            Math.abs(this.openV) < 0.01
        )
    }

    tick = (ms: number) => {
        this.raf = 0
        if (!this.running || this.destroyed) return
        const t = ms / 1000
        const idle = this.idle(t)
        this.frame++
        const still = idle && (this.o.reduced || (this.o.drift <= 0 && this.o.twinkle <= 0 && !this.markRect))
        if (idle && this.frame % 2 === 1 && !still) {
            this.raf = requestAnimationFrame(this.tick)
            return
        }
        const dt = Math.min(1 / 12, Math.max(1 / 240, t - this.lastUpdate))
        this.lastUpdate = t
        const s0 = performance.now()
        if (this.entering && t - this.entranceT > 2.4) this.entering = false
        // The springs are stiff (the capsule rides on them), so the physics always steps at
        // 120 Hz or finer: identical motion at 120, 60, 30 or 15 fps instead of jitter whenever
        // the browser throttles frames (Safari runs embedded previews in cross-origin iframes
        // and Low Power Mode at 30 fps, busy tabs and phones drop frames).
        const steps = Math.max(1, Math.ceil(dt * 120 - 0.01))
        const h = dt / steps
        for (let k = 1; k <= steps; k++) this.update(h, t - dt + h * k)
        this.fitCanvas()
        this.draw(t)
        this.fx(t)
        this.stats.frames++
        this.stats.ms += performance.now() - s0
        if (still) {
            this.running = false
            return
        }
        this.raf = requestAnimationFrame(this.tick)
    }

    fx(t: number) {
        if (!this.ctaFx.length) return
        let op = 1
        if (this.o.variant === "Solid") {
            const ba = t - this.burstT
            if (ba < 0.07) op = 1 - ba / 0.07
            else if (ba < 0.5) op = 0
            else if (ba < 0.9) op = (ba - 0.5) / 0.4
        }
        if (Math.abs(op - this.lastFxOp) > 0.001) {
            const v = op >= 0.999 ? "" : op.toFixed(3)
            for (const el of this.ctaFx) el.style.opacity = v
            this.lastFxOp = op
        }
    }

    update(dt: number, t: number) {
        const o = this.o
        if (this.homesDirty) this.computeHomes()
        const reduced = o.reduced
        const sp = clamp(o.speed, 0.3, 3)
        // eased energies: quick to wake up, slow and soft to calm down (no abrupt stops)
        const ease = (cur: number, on: boolean, up: number, down: number) => {
            const target = on ? 1 : 0
            return cur + (target - cur) * (1 - Math.exp(-dt / (target > cur ? up : down)))
        }
        this.ctaEn = reduced ? (this.ctaHover ? 1 : 0) : ease(this.ctaEn, this.ctaHover, 0.16, 0.5)
        this.markEn = reduced ? (this.logoHover ? 1 : 0) : ease(this.markEn, this.logoHover, 0.22, 0.95)
        this.iconEn = reduced ? (this.iconHover ? 1 : 0) : ease(this.iconEn, this.iconHover, 0.12, 0.3)
        this.ctaPhase += dt * (0.014 + 0.13 * this.ctaEn)
        this.markPh += dt * (reduced ? 0 : 0.55 + 1.25 * this.markEn) * sp
        this.morphPh += dt * (reduced ? 0 : 0.12 + 1.1 * this.markEn) * sp
        this.capPhase += dt * 0.028
        this.stepCapsule(dt)
        {
            const target = this.menuOpen ? 1 : 0
            if (reduced) {
                this.openT = target
                this.openV = 0
            } else {
                const k = 170
                const c = 2 * Math.sqrt(k) * 0.86
                const a = k * (target - this.openT) - c * this.openV
                this.openV += a * dt
                this.openT += this.openV * dt
            }
        }
        const driftAmp = reduced ? 0 : clamp(o.drift, 0, 1) * 1.7
        const ba = t - this.burstT
        const inBurst = ba < 0.24
        const rebuildK = clamp((ba - 0.24) / 0.35)
        const cap = this.hoverRect ? this.capRect : null
        const capIn = this.capIn
        // presence of the capsule (drives the small clearing that travels with it)
        this.cp = reduced ? (cap ? 1 : 0) : ease(this.cp, !!cap, 0.25, 0.18)
        const sbUp = reduced ? 1 : 1 - Math.exp(-dt / 0.2)
        const sbDown = reduced ? 1 : 1 - Math.exp(-dt / 0.12)
        const pin = this.pointer.inside && !reduced && o.cursor > 0
        const px = this.pointer.x
        const py = this.pointer.y
        const CR = 50
        const CR2 = CR * CR
        const cStr = clamp(o.cursor, 0, 1) * 2400
        const tp = this.tmp
        const cta = this.cta
        const solid = o.variant === "Solid"
        const ring = cta ? insetRect(cta, solid ? -(3 + 2.4 * this.ctaEn) : -(0.4 + 1.6 * this.ctaEn)) : null
        const ctaIn = cta ? insetRect(cta, 3) : null
        const ccx = cta ? cta.x + cta.w / 2 : 0
        const ccy = cta ? cta.y + cta.h / 2 : 0
        const pull = !reduced && cta && this.ctaEn > 0.02 ? this.ctaEn * 460 : 0
        const mr = this.markRect
        const mcx = mr ? mr.x + mr.w / 2 : 0
        const mcy = mr ? mr.y + mr.h / 2 : 0
        const mrad = mr ? (Math.min(mr.w, mr.h) / 2 - 0.5) * (0.92 + 0.04 * this.markEn) : 0
        const [m0, m1] = this.rMark
        const mn = m1 - m0
        const mp = this.mp
        const icon = this.icon
        const ok = clamp(this.openT, -0.15, 1.15)
        const VMAX = 950
        let motion = 0
        const n = this.n
        for (let i = 0; i < n; i++) {
            const kd = this.kind[i]
            let tx = 0
            let ty = 0
            let K = 90
            let Z = 0.8
            let drag = 0
            let gathered = false
            if (kd === K_EDGE || kd === K_FILL) {
                let fl = this.flag[i]
                // stand-in at this particle's spot: shown while it is away and its spot has healed
                if (kd === K_FILL) {
                    let want = fl === 1 ? (t >= this.hd[i] ? 1 : 0) : fl === 5 || fl === 6 ? 1 : 0
                    if (fl === 3) {
                        // flying home to its own stand-in: it hands over during the last ~30 px
                        const dx = this.hx[i] - this.x[i]
                        const dy = this.hy[i] - this.y[i]
                        want = Math.min(this.sb[i], clamp(Math.sqrt(dx * dx + dy * dy) / 30))
                    }
                    const cur = this.sb[i]
                    this.sb[i] = cur + (want - cur) * (want > cur ? sbUp : sbDown)
                }
                if (fl === 3 && t >= this.dl[i]) {
                    this.flag[i] = 0
                    fl = 0
                }
                if (fl === 6 && t - this.mt[i] > 0.17) {
                    // merged into a star around the capsule: take over its own stand-in at home
                    const a = this.ph[i]
                    this.x[i] = this.hx[i] + Math.sin(t * 0.8 + a) * driftAmp
                    this.y[i] = this.hy[i] + Math.cos(t * 0.62 + a * 1.7) * driftAmp * 0.75
                    this.vx[i] = 0
                    this.vy[i] = 0
                    this.da[i] = this.sa[i]
                    this.ht[i] = 0
                    this.sb[i] = 0
                    this.flag[i] = 0
                    fl = 0
                }
                if (fl === 3 || (fl === 5 && t < this.dl[i])) {
                    // released: float in place for a moment while the glow fades
                    tx = this.x[i]
                    ty = this.y[i]
                    K = 0
                    drag = 6
                    gathered = true
                } else if (fl === 5 || fl === 6) {
                    // dissolve into a star right around the capsule
                    const sj = this.ls[i]
                    tx = this.x[sj]
                    ty = this.y[sj]
                    if (fl === 5) {
                        const since = t - this.dl[i]
                        const ramp = since < 0.38 ? 0.12 + 0.88 * smooth(0, 1, since / 0.38) : 1
                        K = 90 * sp * ramp
                        Z = 0.9
                        const ex = tx - this.x[i]
                        const ey = ty - this.y[i]
                        if (ex * ex + ey * ey < 6 || since > 1.1) {
                            this.flag[i] = 6
                            this.mt[i] = t
                        }
                    } else {
                        K = 500
                        Z = 1
                    }
                    gathered = true
                } else if (fl === 1 && cap && t >= this.dl[i]) {
                    if (this.gm[i] === 0) {
                        rrPoint(this.gt[i] + this.capPhase, cap, tp)
                        tx = tp.x + tp.nx * this.gb[i]
                        ty = tp.y + tp.ny * this.gb[i]
                    } else {
                        fillPoint(this.gt[i], this.gb[i], capIn, tp)
                        tx = tp.x
                        ty = tp.y
                    }
                    if (this.st[i]) {
                        // seated: rides the capsule as one rigid shape (uniform, no overshoot)
                        K = 1400 * sp
                        Z = 1
                    } else {
                        // arriving: soft start, the pull fades in over ~0.25 s
                        const since = t - this.dl[i]
                        const ramp = since < 0.26 ? 0.16 + 0.84 * smooth(0, 1, since / 0.26) : 1
                        K = 150 * this.rk[i] * sp * ramp
                        Z = 0.84
                        const ex = tx - this.x[i]
                        const ey = ty - this.y[i]
                        if (since > 0.12 && ex * ex + ey * ey < 9) this.st[i] = 1
                    }
                    gathered = true
                } else {
                    tx = this.hx[i]
                    ty = this.hy[i]
                    // after a release the way home eases in too (same soft start as the gather)
                    const since = t - this.dl[i]
                    const ramp = since >= 0 && since < 0.38 ? 0.12 + 0.88 * smooth(0, 1, since / 0.38) : 1
                    K = 80 * this.rk[i] * sp * ramp
                    Z = 0.88
                }
                if (driftAmp > 0) {
                    const a = this.ph[i]
                    const f = kd === K_FILL ? 1 : 0.32
                    tx += Math.sin(t * 0.8 + a) * driftAmp * f
                    ty += Math.cos(t * 0.62 + a * 1.7) * driftAmp * f * 0.75
                }
            } else if (kd === K_CTA) {
                if (!cta || !ring || !ctaIn) continue
                if (this.gm[i] === 0) {
                    rrPoint(this.p1[i] + this.ctaPhase * (this.rk[i] > 1 ? 1 : 0.82), ring, tp)
                    const b = this.p2[i]
                    tx = tp.x + tp.nx * b
                    ty = tp.y + tp.ny * b
                    this.bo[i] = tp.ny
                } else {
                    fillPoint(this.p1[i], this.p2[i], ctaIn, tp)
                    tx = tp.x
                    ty = tp.y
                    if (driftAmp > 0) {
                        tx += Math.sin(t * 1.3 + this.ph[i]) * (0.5 + 1.1 * this.ctaEn)
                        ty += Math.cos(t * 1.1 + this.ph[i]) * (0.35 + 0.6 * this.ctaEn)
                    }
                }
                if (inBurst) {
                    K = 4
                    Z = 0
                    drag = 3.2
                } else {
                    K = (30 + 170 * rebuildK) * this.rk[i]
                    Z = 0.78
                }
            } else if (kd === K_MARK) {
                if (!mr) continue
                markPoint(o.mark, i - m0, mn, o.mark === "Morph" ? this.morphPh : this.markPh, this.markEn, mp)
                tx = mcx + mp.x * mrad
                ty = mcy + mp.y * mrad
                this.bo[i] = mp.z
                this.ma[i] = mp.a
                // big jumps (pulse rings restarting) teleport instead of streaking
                const jx = tx - this.x[i]
                const jy = ty - this.y[i]
                if (jx * jx + jy * jy > mrad * mrad * 0.5) {
                    this.x[i] = tx
                    this.y[i] = ty
                    this.vx[i] = 0
                    this.vy[i] = 0
                }
                K = 560
                Z = 0.92
            } else if (kd === K_ICON) {
                if (!icon) continue
                const cx = icon.x + icon.w / 2
                const cy = icon.y + icon.h / 2
                const s = this.p1[i]
                const up = this.gm[i] === 0
                // hover: the two dotted lines part a little and slide against each other
                const hov = this.iconEn * (1 - clamp(ok))
                const ay = (up ? -1 : 1) * (3.5 + 1.1 * hov)
                const by0 = up ? -6.6 : 6.6
                const shift = (up ? 1 : -1) * 1.5 * hov
                const sc = 1 + 0.12 * this.iconEn * clamp(ok)
                const x0 = -9 + 2.4 * ok + shift
                const x1 = 9 - 2.4 * ok + shift
                const y0 = ay + (by0 - ay) * ok
                const y1 = ay + (-by0 - ay) * ok
                tx = cx + (x0 + (x1 - x0) * s) * sc
                ty = cy + (y0 + (y1 - y0) * s) * sc
                K = 420 * this.rk[i]
                Z = 0.82
            } else {
                if (!ctaIn || ba > 1.05) {
                    if (ctaIn) {
                        fillPoint(this.p1[i], this.p2[i], ctaIn, tp)
                        this.x[i] = tp.x
                        this.y[i] = tp.y
                    }
                    this.vx[i] = 0
                    this.vy[i] = 0
                    continue
                }
                fillPoint(this.p1[i], this.p2[i], ctaIn, tp)
                tx = tp.x
                ty = tp.y
                if (inBurst) {
                    K = 0
                    Z = 0
                    drag = 3
                } else {
                    K = (20 + 150 * rebuildK) * this.rk[i]
                    Z = 0.72
                }
            }
            if (this.entering && t < this.entranceT + this.ed[i]) continue
            if (reduced) {
                this.x[i] = tx
                this.y[i] = ty
                this.vx[i] = 0
                this.vy[i] = 0
                this.td[i] = 0
                continue
            }
            const C = 2 * Math.sqrt(K) * Z + drag
            const ex = tx - this.x[i]
            const ey = ty - this.y[i]
            let ax = K * ex - C * this.vx[i]
            let ay = K * ey - C * this.vy[i]
            if (kd <= K_FILL) {
                this.bo[i] = 0
                if (!gathered) {
                    if (pin) {
                        const dx = this.x[i] - px
                        const dy = this.y[i] - py
                        const d2 = dx * dx + dy * dy
                        if (d2 < CR2) {
                            const dd = Math.sqrt(d2) + 0.001
                            const q = 1 - dd / CR
                            const f = (q * q * cStr) / dd
                            ax += dx * f
                            ay += dy * f
                            this.bo[i] = q
                        }
                    }
                    if (pull && kd === K_FILL) {
                        // the surface leans gently toward the hovered button
                        const dx = ccx - this.x[i]
                        const dy = ccy - this.y[i]
                        const d2 = dx * dx + dy * dy
                        if (d2 < 170 * 170) {
                            const dd = Math.sqrt(d2) + 0.001
                            const f = (pull * (1 - dd / 170)) / dd
                            ax += dx * f
                            ay += dy * f
                        }
                    }
                }
            }
            let nvx = this.vx[i] + ax * dt
            let nvy = this.vy[i] + ay * dt
            if (kd <= K_FILL) {
                const v2 = nvx * nvx + nvy * nvy
                if (v2 > VMAX * VMAX) {
                    const k = VMAX / Math.sqrt(v2)
                    nvx *= k
                    nvy *= k
                }
            }
            this.vx[i] = nvx
            this.vy[i] = nvy
            this.x[i] += nvx * dt
            this.y[i] += nvy * dt
            this.td[i] = Math.abs(ex) + Math.abs(ey)
            motion += Math.abs(nvx) + Math.abs(nvy)
        }
        this.motion = motion / Math.max(1, n)
    }

    draw(t: number) {
        const ctx = this.ctx
        if (!ctx) return
        this.pendingDraw = false
        const o = this.o
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.globalCompositeOperation = "source-over"
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        if (this.waiting) return
        ctx.setTransform(this.ratio, 0, 0, this.ratio, this.M * this.ratio, this.M * this.ratio)
        ctx.globalCompositeOperation = this.glowMode ? "lighter" : "source-over"
        const bc = this.bc
        bc.fill(0)
        this.glc = 0
        const glMax = this.gl.length / 3
        const twk = clamp(o.twinkle, 0, 1) * (o.reduced ? 0.25 : 1)
        const ba = t - this.burstT
        const cEn = this.ctaEn
        const solid = o.variant === "Solid"
        let ctaGate = 1
        if (o.mobile) {
            ctaGate = clamp(this.openT)
            // the panel button only appears once the unfolding outline has reached it
            if (this.cta) ctaGate *= clamp((this.shape.y + this.shape.h - (this.cta.y + this.cta.h)) / 14 + 1)
        }
        const markBoost = 0.12 * this.markEn
        const driftAmp = o.reduced ? 0 : clamp(o.drift, 0, 1) * 1.7
        const haloOn = this.cp > 0.003
        const HR = this.capRect
        const cpv = this.cp
        const halo = (x: number, y: number) => 1 - cpv * (1 - smooth(6, 40, rrDist(x, y, HR)))
        // every particle's brightness and "heat" (hover colour) ease over time, so nothing pops
        // in or out when a highlight forms, glides to another link or dissolves
        const dtd = clamp(t - this.lastDrawT, 0, 0.1)
        this.lastDrawT = t
        const snap = o.reduced || !this.alphaInit
        this.alphaInit = true
        const aUp = snap ? 1 : 1 - Math.exp(-dtd / 0.07)
        const aDown = snap ? 1 : 1 - Math.exp(-dtd / 0.2)
        const hUp = snap ? 1 : 1 - Math.exp(-dtd / 0.12)
        const hDown = snap ? 1 : 1 - Math.exp(-dtd / 0.3)
        let settle = 0
        const split = !this.sameColor
        const n = this.n
        for (let i = 0; i < n; i++) {
            const kd = this.kind[i]
            let a = this.al[i]
            let heat = 1
            const tf = 1 - twk * 0.55 + twk * 0.55 * (0.5 + 0.5 * Math.sin(t * this.tw[i] + this.ph[i]))
            let sizeK = 1
            if (kd === K_EDGE || kd === K_FILL) {
                const v = this.vz[i]
                if (v <= 0.01) {
                    this.da[i] = 0
                    this.ht[i] = 0
                    continue
                }
                a *= tf * v * this.lf[i]
                const fl = this.flag[i]
                const want = fl === 1 && t >= this.dl[i] ? 1 : 0
                if (kd === K_FILL) {
                    // the stand-in that refills this particle's spot while it is away
                    let sa = 0
                    if (fl !== 0 && this.sb[i] > 0.01) {
                        const ph = this.ph[i]
                        const sx = this.hx[i] + Math.sin(t * 0.8 + ph) * driftAmp
                        const sy = this.hy[i] + Math.cos(t * 0.62 + ph * 1.7) * driftAmp * 0.75
                        sa = a * this.sb[i] * (haloOn ? halo(sx, sy) : 1)
                        if (!this.glowMode) sa *= 0.82
                        if (sa > 0.015) this.pushDot(0, Math.min(1, sa), sx, sy, this.sz[i] * (this.glowMode ? 1 : 0.9))
                    }
                    this.sa[i] = sa
                    // a small clearing travels with the capsule
                    if (fl === 0 && haloOn) a *= halo(this.x[i], this.y[i])
                    if (fl === 6) a *= clamp(1 - (t - this.mt[i]) / 0.17)
                }
                let h = this.ht[i]
                const dh = want - h
                h += dh * (dh > 0 ? hUp : hDown)
                if (h < 0.002) h = 0
                this.ht[i] = h
                if (dh > 0.01 || dh < -0.01) settle++
                heat = h
                if (h > 0) {
                    const prog = clamp(1 - this.td[i] / 34)
                    const peak = (this.gm[i] === 0 ? 0.92 : 0.42) * (0.78 + 0.22 * tf) * (0.6 + 0.4 * prog)
                    a += (peak - a) * h
                }
                a += this.bo[i] * 0.55
            } else if (kd === K_CTA) {
                const edge = this.gm[i] === 0
                if (solid) a = (0.24 + 0.48 * cEn) * this.al[i] * tf
                else if (edge) a = (0.5 + 0.3 * cEn) * this.al[i] * (0.86 - 0.24 * this.bo[i]) * (0.82 + 0.18 * tf)
                else a = (0.2 + 0.24 * cEn) * this.al[i] * tf
                if (ba < 1) a = Math.max(a, 0.95 * (1 - ba))
                a *= ctaGate
            } else if (kd === K_MARK) {
                const depth = this.bo[i] * 0.5 + 0.5
                a = (0.18 + 0.82 * depth) * this.ma[i] * this.al[i] + markBoost * this.ma[i]
                sizeK = (0.74 + 0.4 * depth) * 1.12
            } else if (kd === K_ICON) {
                a = 0.92 * this.al[i]
            } else {
                a = ba > 1.05 ? 0 : (ba < 0.5 ? 1 : clamp(1 - (ba - 0.5) / 0.5)) * this.al[i] * ctaGate
            }
            if (this.entering) {
                const since = t - this.entranceT - this.ed[i]
                a *= since < 0 ? 0 : clamp(since / 0.45)
            }
            if (!this.glowMode) {
                a *= 0.82
                sizeK *= 0.9
            }
            if (a > 1) a = 1
            // displayed alpha follows the target softly (fast in, slower out)
            const cur = this.da[i]
            const da = a - cur
            a = cur + da * (da > 0 ? aUp : aDown)
            if (a < 0.002) a = 0
            this.da[i] = a
            if (a < 0.015) continue
            const size = kd === K_MARK ? -this.sz[i] * sizeK : this.sz[i] * sizeK
            if (!split || heat >= 0.985) this.pushDot(LV, a, this.x[i], this.y[i], size)
            else if (heat <= 0.015) this.pushDot(0, a, this.x[i], this.y[i], size)
            else {
                // cross-fade between base and hover colour while heating up or cooling down
                this.pushDot(LV, a * heat, this.x[i], this.y[i], size)
                this.pushDot(0, a * (1 - heat), this.x[i], this.y[i], size)
            }
            if (this.glowMode && this.glc < glMax && kd !== K_ICON) {
                let ga = 0
                if (kd <= K_FILL) ga = a * heat > 0.22 ? a * heat : 0
                else if (a > 0.45) ga = kd === K_MARK ? a * 0.4 : kd === K_CTA ? a * 0.5 : a
                if (ga > 0) {
                    const g = this.glc * 3
                    this.gl[g] = this.x[i]
                    this.gl[g + 1] = this.y[i]
                    this.gl[g + 2] = ga
                    this.glc++
                }
            }
        }
        this.settling = settle > 0
        for (let b = 0; b < LV * 2; b++) {
            const cnt = bc[b]
            if (!cnt) continue
            const arr = this.bx[b]
            ctx.fillStyle = this.fills[b]
            ctx.beginPath()
            for (let j = 0; j < cnt; j++) {
                const q = j * 3
                const s = arr[q + 2]
                const X = arr[q]
                const Y = arr[q + 1]
                if (s < 0 || s >= 1.8) {
                    const r = (s < 0 ? -s : s) * 0.5
                    ctx.moveTo(X + r, Y)
                    ctx.arc(X, Y, r, 0, TAU)
                } else ctx.rect(X - s * 0.5, Y - s * 0.5, s, s)
            }
            ctx.fill()
        }
        if (this.glc && this.sprite && o.glow > 0) {
            const gs = 4.5 + clamp(o.size, 0.4, 4) * 2.4
            const ga = clamp(o.glow, 0, 1) * 0.3
            for (let j = 0; j < this.glc; j++) {
                const q = j * 3
                ctx.globalAlpha = Math.min(1, this.gl[q + 2] * ga)
                ctx.drawImage(this.sprite, this.gl[q] - gs, this.gl[q + 1] - gs, gs * 2, gs * 2)
            }
            ctx.globalAlpha = 1
        }
    }

    // queues one dot into the batch of its colour (0 = base, LV = hover) and alpha level
    pushDot(colour: number, a: number, x: number, y: number, size: number) {
        if (a < 0.012) return
        const lvl = Math.min(LV - 1, (a * LV) | 0)
        const b = colour + lvl
        let arr = this.bx[b]
        const c = this.bc[b] * 3
        if (c + 3 > arr.length) {
            const grown = new Float32Array(arr.length * 2)
            grown.set(arr)
            this.bx[b] = grown
            arr = grown
        }
        arr[c] = x
        arr[c + 1] = y
        arr[c + 2] = size
        this.bc[b]++
    }
}

// ------------------------------------------------------------------ styles

const CSS = `
.pn{position:relative;box-sizing:border-box;display:block;isolation:isolate;-webkit-tap-highlight-color:transparent;color:var(--pn-text);line-height:1.2}
.pn *,.pn *::before,.pn *::after{box-sizing:border-box}
.pn-surface{position:absolute;inset:0;border-radius:var(--pn-sr);background:var(--pn-fill);box-shadow:var(--pn-shadow);pointer-events:none;-webkit-backdrop-filter:var(--pn-bf);backdrop-filter:var(--pn-bf)}
.pn-canvas{position:absolute;left:-44px;top:-44px;width:calc(100% + 88px);height:calc(100% + 88px);pointer-events:none;display:block}
.pn-bar{position:relative;display:grid;grid-template-columns:minmax(max-content,1fr) auto minmax(max-content,1fr);align-items:center;column-gap:var(--pn-gap);padding:var(--pn-pad);min-width:0}
.pn.is-right .pn-bar{display:flex;align-items:center}
.pn.is-right .pn-links{margin-left:auto}
.pn-logo{justify-self:start;display:inline-flex;align-items:center;gap:10px;padding:6px 8px;margin:-6px -8px;border-radius:999px;color:var(--pn-logo);font-weight:600;white-space:nowrap;text-decoration:none;user-select:none;-webkit-user-select:none;outline:none}
a.pn-logo[href]{cursor:pointer}
.pn-mark{position:relative;display:block;width:20px;height:20px;flex:none}
.pn-logo img{display:block;height:22px;width:auto;max-width:160px;object-fit:contain}
.pn-links{justify-self:center;display:flex;align-items:center;gap:var(--pn-gap)}
.pn-link{position:relative;display:inline-flex;align-items:center;padding:8px 14px;margin:-8px -14px;border-radius:var(--pn-ir);color:var(--pn-text);text-decoration:none;white-space:nowrap;transition:color .42s cubic-bezier(.2,.8,.2,1);user-select:none;-webkit-user-select:none;outline:none;cursor:default}
a.pn-link[href]{cursor:pointer}
.pn-link.is-hot{color:var(--pn-hover)}
.pn-cta{justify-self:end;position:relative;z-index:0;display:inline-flex;align-items:center;justify-content:center;padding:11px 20px;border-radius:var(--pn-ir);color:var(--pn-cta-text);font-weight:600;white-space:nowrap;text-decoration:none;user-select:none;-webkit-user-select:none;outline:none;cursor:default}
a.pn-cta[href]{cursor:pointer}
.pn-cta-bg{position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--pn-cta-fill);transition:transform .5s cubic-bezier(.2,.8,.2,1),background .5s ease,box-shadow .5s ease}
.pn-cta-label{position:relative}
.pn-cta.is-hot .pn-cta-bg{transform:scale(1.03)}
.pn-cta.is-particles .pn-cta-bg{background:var(--pn-cta-soft);box-shadow:inset 0 1px 0 var(--pn-cta-rim),0 0 22px -10px var(--pn-cta-glow)}
.pn-cta.is-particles.is-hot .pn-cta-bg{background:var(--pn-cta-soft-hot);box-shadow:inset 0 1px 0 var(--pn-cta-rim),0 0 30px -8px var(--pn-cta-glow-hot)}
.pn-menu{display:none;align-items:center;justify-content:center;width:40px;height:40px;margin:-4px -4px -4px auto;padding:0;border:0;background:transparent;border-radius:999px;color:var(--pn-logo);cursor:pointer;outline:none;-webkit-appearance:none;appearance:none}
.pn-menu-box{position:relative;display:block;width:20px;height:20px}
.pn.is-mobile .pn-bar{display:flex;align-items:center;justify-content:space-between}
.pn.is-mobile .pn-bar > .pn-links,.pn.is-mobile .pn-bar > .pn-cta{display:none}
.pn.is-mobile .pn-menu{display:inline-flex}
.pn-panel{position:relative;height:0;overflow:hidden}
.pn-panel-inner{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:2px var(--pn-pad-r) var(--pn-pad-r) var(--pn-pad-l)}
.pn-plink{position:relative;display:inline-flex;align-items:center;padding:11px 14px;margin:0 -14px;border-radius:var(--pn-ir);color:var(--pn-text);font-size:max(18px,1.3em);letter-spacing:-.015em;text-decoration:none;white-space:nowrap;transition:color .42s cubic-bezier(.2,.8,.2,1);user-select:none;-webkit-user-select:none;outline:none;cursor:default}
a.pn-plink[href]{cursor:pointer}
.pn-plink.is-hot{color:var(--pn-hover)}
.pn-panel .pn-cta{align-self:stretch;margin-top:14px;padding:14px 20px}
.pn-link:focus-visible,.pn-plink:focus-visible,.pn-logo:focus-visible,.pn-cta:focus-visible,.pn-menu:focus-visible{box-shadow:0 0 0 2px var(--pn-focus)}
.pn-static-edge{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.pn-static-dots{position:absolute;inset:3px;border-radius:var(--pn-sr);overflow:hidden;pointer-events:none}
.pn-static-dots i{position:absolute;display:block;border-radius:50%;background:currentColor;transform:translate(-50%,-50%)}
.pn-static-halo{position:absolute;left:-3px;top:-3px;width:calc(100% + 6px);height:calc(100% + 6px);overflow:visible;pointer-events:none}
.pn-frame{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;display:block}
@media (max-width:640px){.pn:not(.pn-ready):not(.is-desktop) .pn-bar > .pn-links,.pn:not(.pn-ready):not(.is-desktop) .pn-bar > .pn-cta{display:none}.pn:not(.pn-ready):not(.is-desktop) .pn-menu{display:inline-flex}.pn:not(.pn-ready):not(.is-desktop) .pn-bar{display:flex;justify-content:space-between}}
@media (prefers-reduced-motion:reduce){.pn-link,.pn-plink,.pn-cta-bg{transition:none}}
`

// ------------------------------------------------------------------ markup

function cssVars(r: Resolved, mobile: boolean): React.CSSProperties {
    const pad = parseBox(r.padding)
    const radius = firstPx(r.radius, 999)
    const ir = Math.max(6, radius - pad[0])
    const hover = parseColor(r.particles.hoverColor, [255, 255, 255, 1])
    const ha = hover[3]
    const blur = Math.max(0, r.surface.blur || 0)
    return {
        ["--pn-fill" as string]: r.surface.fill,
        ["--pn-bf" as string]: blur > 0 ? `blur(${blur}px) saturate(1.4)` : "none",
        ["--pn-shadow" as string]: r.surface.shadow || "none",
        ["--pn-r" as string]: r.radius,
        ["--pn-sr" as string]: mobile ? `${Math.min(radius, 26)}px` : r.radius,
        ["--pn-ir" as string]: `${ir}px`,
        ["--pn-pad" as string]: r.padding,
        ["--pn-pad-l" as string]: `${pad[3]}px`,
        ["--pn-pad-r" as string]: `${Math.max(pad[1], 12)}px`,
        ["--pn-gap" as string]: `${firstPx(r.gap, 30)}px`,
        ["--pn-text" as string]: r.textColor,
        ["--pn-hover" as string]: r.hoverTextColor,
        ["--pn-logo" as string]: r.hoverTextColor,
        ["--pn-cta-fill" as string]: r.button.fill,
        ["--pn-cta-text" as string]: r.button.variant === "Solid" ? r.button.text : r.hoverTextColor,
        ["--pn-cta-soft" as string]: `linear-gradient(180deg, ${rgba(hover, 0.11 * ha)}, ${rgba(hover, 0.04 * ha)})`,
        ["--pn-cta-soft-hot" as string]: `linear-gradient(180deg, ${rgba(hover, 0.17 * ha)}, ${rgba(hover, 0.07 * ha)})`,
        ["--pn-cta-rim" as string]: rgba(hover, 0.14 * ha),
        ["--pn-cta-glow" as string]: rgba(hover, 0.28 * ha),
        ["--pn-cta-glow-hot" as string]: rgba(hover, 0.45 * ha),
        ["--pn-focus" as string]: r.focusRing,
    }
}

function linkAttrs(link?: string, newTab?: boolean) {
    if (!hasHref(link)) return {}
    return {
        href: link,
        target: newTab ? "_blank" : undefined,
        rel: newTab ? "noopener noreferrer" : undefined,
    }
}

interface BarProps {
    r: Resolved
    mobile: boolean
    open: boolean
    panelId: string
    onToggle?: () => void
    onPanelClick?: (e: React.MouseEvent) => void
    menuRef?: React.Ref<HTMLButtonElement>
    panelRef?: React.Ref<HTMLDivElement>
    panelInnerRef?: React.Ref<HTMLDivElement>
    mark?: React.ReactNode
    icon?: React.ReactNode
    ctaDeco?: React.ReactNode
    panelCtaDeco?: React.ReactNode
    renderPanel: boolean
}

function Bar(props: BarProps) {
    const { r, mobile, open } = props
    const b = r.button
    const logoInner = (
        <>
            {r.mark !== "None" ? (
                <span className="pn-mark" aria-hidden="true">
                    {props.mark}
                </span>
            ) : null}
            {r.logoImage && r.logoImage.src ? (
                <img src={r.logoImage.src} srcSet={r.logoImage.srcSet} alt={r.logoImage.alt || r.logoText || "Logo"} />
            ) : r.logoText ? (
                <span>{r.logoText}</span>
            ) : null}
        </>
    )
    const cta = (key: string, deco?: React.ReactNode) =>
        b.show ? (
            <a
                key={key}
                className={"pn-cta" + (b.variant === "Solid" ? "" : " is-particles")}
                {...linkAttrs(b.link, b.newTab)}
            >
                <span className="pn-cta-bg" aria-hidden="true" />
                {deco}
                <span className="pn-cta-label">{b.label}</span>
            </a>
        ) : null
    return (
        <>
            <div className="pn-bar">
                <a className="pn-logo" aria-label={r.logoText ? undefined : "Home"} {...linkAttrs(r.logoLink, r.logoNewTab)}>
                    {logoInner}
                </a>
                <div className="pn-links">
                    {r.links.map((l, i) => (
                        <a key={i} className="pn-link" data-i={i} {...linkAttrs(l.link, l.newTab)}>
                            {l.label || ""}
                        </a>
                    ))}
                </div>
                {cta("bar", props.ctaDeco)}
                <button
                    ref={props.menuRef}
                    type="button"
                    className="pn-menu"
                    aria-label={open ? "Close menu" : "Open menu"}
                    aria-expanded={open}
                    aria-controls={props.panelId}
                    onClick={props.onToggle}
                >
                    <span className="pn-menu-box" aria-hidden="true">
                        {props.icon}
                    </span>
                </button>
            </div>
            {props.renderPanel && mobile ? (
                <div className="pn-panel" id={props.panelId} ref={props.panelRef}>
                    <div className="pn-panel-inner" ref={props.panelInnerRef} onClick={props.onPanelClick}>
                        {r.links.map((l, i) => (
                            <a key={i} className="pn-plink" data-i={i} {...linkAttrs(l.link, l.newTab)}>
                                {l.label || ""}
                            </a>
                        ))}
                        {cta("panel", props.panelCtaDeco)}
                    </div>
                </div>
            ) : null}
        </>
    )
}

// ------------------------------------------------------------------ live component

function LiveNav({ r }: { r: Resolved }) {
    const rootRef = useRef<HTMLElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const panelInnerRef = useRef<HTMLDivElement>(null)
    const menuRef = useRef<HTMLButtonElement>(null)
    const engineRef = useRef<ParticleEngine | null>(null)
    const reduced = useReducedMotion()
    const contentKey =
        r.links.map((l) => l.label).join("|") + "|" + r.logoText + "|" + r.mark + "|" + r.button.show + r.button.label + JSON.stringify(r.font) + r.padding + r.gap
    const mobile = useMobileLayout(rootRef, r.layout, r.breakpoint, r.align, contentKey)
    const [open, setOpen] = useState(false)
    const [ready, setReady] = useState(false)
    const reactId = (React as unknown as { useId?: () => string }).useId
        ? (React as unknown as { useId: () => string }).useId()
        : "pn"
    const panelId = "pn-panel-" + reactId.replace(/[^a-zA-Z0-9_-]/g, "")

    const eo: EngineOptions = {
        color: r.particles.color,
        hoverColor: r.particles.hoverColor,
        density: r.particles.density,
        size: r.particles.size,
        glow: r.particles.glow,
        twinkle: r.particles.twinkle,
        gather: r.motion.gather,
        speed: r.motion.speed,
        drift: r.motion.drift,
        cursor: r.motion.cursor,
        assemble: r.motion.assemble,
        variant: r.button.variant,
        hasButton: r.button.show,
        mark: r.mark,
        mobile,
        radius: firstPx(r.radius, 999),
        reduced,
    }
    const eoRef = useRef(eo)
    eoRef.current = eo
    const eoKey = JSON.stringify(eo)

    useEffect(() => {
        const root = rootRef.current
        const canvas = canvasRef.current
        if (!root || !canvas) return
        const engine = new ParticleEngine(root, canvas, eoRef.current)
        engineRef.current = engine
        setReady(true)
        return () => {
            engine.destroy()
            engineRef.current = null
        }
    }, [])

    useEffect(() => {
        if (engineRef.current) engineRef.current.setOptions(eoRef.current)
    }, [eoKey])

    useIsoLayoutEffect(() => {
        if (engineRef.current) engineRef.current.refresh()
    })

    useEffect(() => {
        if (!mobile && open) setOpen(false)
    }, [mobile, open])

    // open / close the menu panel: height unfolds, items follow in a soft stagger
    useIsoLayoutEffect(() => {
        const panel = panelRef.current
        const inner = panelInnerRef.current
        if (engineRef.current) engineRef.current.setMenuOpen(open && mobile)
        if (!panel || !inner) return
        if (open) {
            inner.removeAttribute("inert")
            inner.removeAttribute("aria-hidden")
        } else {
            inner.setAttribute("inert", "")
            inner.setAttribute("aria-hidden", "true")
        }
        const items = Array.from(inner.children) as HTMLElement[]
        const target = open ? inner.offsetHeight : 0
        if (reduced) {
            panel.style.transition = "none"
            panel.style.height = target + "px"
            return
        }
        const from = panel.offsetHeight
        panel.style.transition = "none"
        panel.style.height = from + "px"
        void panel.offsetHeight
        panel.style.transition = open
            ? "height .6s cubic-bezier(.4,.6,.2,1)"
            : "height .44s cubic-bezier(.45,0,.2,1) .06s"
        panel.style.height = target + "px"
        if (typeof inner.animate !== "function") return
        items.forEach((el) => {
            if (typeof el.getAnimations === "function") el.getAnimations().forEach((a) => a.cancel())
        })
        const anims: Animation[] = []
        if (open) {
            items.forEach((el, i) => {
                anims.push(
                    el.animate(
                        [
                            { opacity: 0, transform: "translateY(-10px)" },
                            { opacity: 1, transform: "translateY(0)" },
                        ],
                        { duration: 520, delay: 110 + i * 48, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" }
                    )
                )
            })
        } else if (from > 0) {
            items.forEach((el) => {
                anims.push(el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 170, easing: "ease-out", fill: "forwards" }))
            })
        }
        // the links slide in with a transform, so measure their resting place once they settle
        const last = anims.length ? (anims[anims.length - 1] as Animation & { finished?: Promise<Animation> }) : null
        if (open && last && last.finished) {
            last.finished
                .then(() => {
                    if (engineRef.current) engineRef.current.refresh()
                })
                .catch(() => {})
        }
    }, [open, mobile, reduced])

    // keep the open panel sized to its content when the width changes (never interrupts the open animation)
    useEffect(() => {
        const inner = panelInnerRef.current
        const panel = panelRef.current
        if (!open || !inner || !panel || typeof ResizeObserver === "undefined") return
        let last = inner.offsetHeight
        let raf = 0
        const ro = new ResizeObserver(() => {
            const h = inner.offsetHeight
            if (Math.abs(h - last) < 0.5) return
            last = h
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(() => {
                panel.style.transition = "none"
                panel.style.height = h + "px"
            })
        })
        ro.observe(inner)
        return () => {
            ro.disconnect()
            cancelAnimationFrame(raf)
        }
    }, [open, mobile])

    // Escape and outside clicks close the menu
    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpen(false)
                if (menuRef.current) menuRef.current.focus()
            }
        }
        const onDown = (e: PointerEvent) => {
            const root = rootRef.current
            if (root && e.target instanceof Node && !root.contains(e.target)) setOpen(false)
        }
        document.addEventListener("keydown", onKey)
        document.addEventListener("pointerdown", onDown, true)
        return () => {
            document.removeEventListener("keydown", onKey)
            document.removeEventListener("pointerdown", onDown, true)
        }
    }, [open])

    const cls =
        "pn" +
        (mobile ? " is-mobile" : "") +
        (r.layout === "Desktop" ? " is-desktop" : "") +
        (r.align === "Right" ? " is-right" : "") +
        (open ? " is-open" : "") +
        (ready ? " pn-ready" : "")

    return (
        <nav
            ref={rootRef}
            className={cls}
            aria-label="Main"
            style={{ ...r.style, ...r.font, ...cssVars(r, mobile), position: "relative" }}
        >
            <style>{CSS}</style>
            <div className="pn-surface" aria-hidden="true" />
            <canvas ref={canvasRef} className="pn-canvas" aria-hidden="true" />
            <Bar
                r={r}
                mobile={mobile}
                open={open}
                panelId={panelId}
                renderPanel={true}
                menuRef={menuRef}
                panelRef={panelRef}
                panelInnerRef={panelInnerRef}
                onToggle={() => setOpen((v) => !v)}
                onPanelClick={(e) => {
                    const t = e.target as Element
                    if (t && t.closest && t.closest("a[href]")) setOpen(false)
                }}
            />
        </nav>
    )
}

// ------------------------------------------------------------------ static component (Canvas, thumbnails, export)

function StaticDots({ seed, count, color, size, min, max }: { seed: number; count: number; color: string; size: number; min: number; max: number }) {
    const rnd = mulberry32(seed)
    const dots: React.ReactNode[] = []
    for (let i = 0; i < count; i++) {
        const u = rnd()
        const v = rnd()
        const sparkle = rnd() < 0.035
        const s = size * (sparkle ? 1.1 + rnd() * 0.4 : 0.55 + rnd() * 0.6)
        const e = clamp((Math.abs(v * 2 - 1) - 0.35) / 0.65)
        const lf = (0.42 + 0.58 * e * e * (3 - 2 * e)) * (1.08 - 0.16 * v)
        const a = (sparkle ? 0.55 + rnd() * 0.3 : min + rnd() * rnd() * (max - min)) * lf
        dots.push(
            <i
                key={i}
                style={{ left: (u * 100).toFixed(2) + "%", top: (v * 100).toFixed(2) + "%", width: s, height: s, opacity: a }}
            />
        )
    }
    return (
        <span className="pn-static-dots" aria-hidden="true" style={{ color }}>
            {dots}
        </span>
    )
}

let staticGradientId = 0

function StaticEdge({ color, size, r, spacing, opacity, className }: { color: string; size: number; r: number; spacing: number; opacity: number; className?: string }) {
    const sw = Math.max(0.6, size)
    const idRef = useRef("")
    if (!idRef.current) idRef.current = "pn-light-" + ++staticGradientId
    const gid = idRef.current
    return (
        <svg className={className || "pn-static-edge"} aria-hidden="true">
            <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={color} stopOpacity={1} />
                    <stop offset="0.5" stopColor={color} stopOpacity={0.72} />
                    <stop offset="1" stopColor={color} stopOpacity={0.48} />
                </linearGradient>
            </defs>
            <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                rx={r}
                ry={r}
                fill="none"
                stroke={`url(#${gid})`}
                strokeWidth={sw}
                strokeLinecap="round"
                strokeDasharray={`0.01 ${spacing}`}
                strokeOpacity={opacity}
            />
            <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                rx={r}
                ry={r}
                fill="none"
                stroke={`url(#${gid})`}
                strokeWidth={sw * 0.8}
                strokeLinecap="round"
                strokeDasharray={`0.01 ${spacing * 1.63}`}
                strokeDashoffset={spacing * 0.5}
                strokeOpacity={opacity * 0.45}
            />
        </svg>
    )
}

function StaticMark({ style, color }: { style: MarkStyle; color: string }) {
    const n = MARK_COUNT[style] || 0
    const p: MP = { x: 0, y: 0, z: 1, a: 1 }
    const pts: React.ReactNode[] = []
    for (let i = 0; i < n; i++) {
        markPoint(style, i, n, style === "Morph" ? 1.2 : 0.9, 0, p)
        const depth = p.z * 0.5 + 0.5
        const op = (0.18 + 0.82 * depth) * p.a
        if (op < 0.03) continue
        pts.push(<circle key={i} cx={10 + p.x * 9.2} cy={10 + p.y * 9.2} r={0.42 + 0.34 * depth} fill={color} opacity={op} />)
    }
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" style={{ display: "block", overflow: "visible" }}>
            {pts}
        </svg>
    )
}

function StaticIcon({ color }: { color: string }) {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" style={{ display: "block", overflow: "visible" }}>
            <line x1="1" y1="6.5" x2="19" y2="6.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="0.01 2.25" />
            <line x1="1" y1="13.5" x2="19" y2="13.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="0.01 2.25" />
        </svg>
    )
}

// The canvas shows the same picture as the live site at rest: the engine lays its particles out
// once on their resting spots (one pass, no simulation, no loop), draws a single frame into a
// recorder and the frame is written out as SVG. Same seed every time, so it never flickers.

interface FrozenFrame {
    dots: { color: string; w: number; d: string }[]
    glows: number[]
    glowColor: string
    additive: boolean
}

class FrameRecorder {
    fillStyle: unknown = ""
    globalAlpha = 1
    globalCompositeOperation = "source-over"
    cur: number[] = []
    batches: { fill: string; pts: number[] }[] = []
    glows: number[] = []
    setTransform() {}
    clearRect() {
        this.batches = []
        this.glows = []
    }
    beginPath() {
        this.cur = []
    }
    moveTo() {}
    arc(x: number, y: number, r: number) {
        this.cur.push(x, y, r)
    }
    rect(x: number, y: number, w: number, h: number) {
        // the live canvas draws tiny particles as squares: same area as a circle
        this.cur.push(x + w / 2, y + h / 2, w * 0.564)
    }
    fill() {
        if (this.cur.length) this.batches.push({ fill: String(this.fillStyle), pts: this.cur })
        this.cur = []
    }
    drawImage(_img: unknown, x: number, y: number, w: number, h: number) {
        this.glows.push(x + w / 2, y + h / 2, w / 2, this.globalAlpha)
    }
}

function freezeFrame(root: HTMLElement, r: Resolved, mobile: boolean): FrozenFrame | null {
    const rec = new FrameRecorder()
    const surface = {
        width: 1,
        height: 1,
        style: {} as CSSStyleDeclaration,
        getContext: () => rec,
    } as unknown as HTMLCanvasElement
    const random = Math.random
    Math.random = mulberry32(23770)
    try {
        const eo: EngineOptions = {
            color: r.particles.color,
            hoverColor: r.particles.hoverColor,
            density: r.particles.density,
            size: r.particles.size,
            glow: r.particles.glow,
            twinkle: r.particles.twinkle,
            gather: r.motion.gather,
            speed: r.motion.speed,
            drift: r.motion.drift,
            cursor: r.motion.cursor,
            assemble: false,
            variant: r.button.variant,
            hasButton: r.button.show,
            mark: r.mark,
            mobile,
            radius: firstPx(r.radius, 999),
            reduced: true,
        }
        const engine = new ParticleEngine(root, surface, eo, true)
        const t = 10
        // reduced motion places every particle exactly on its resting spot in one step
        engine.update(1 / 60, t)
        // the frame itself keeps the natural twinkle variation of the live nav
        engine.o = { ...eo, reduced: false }
        engine.draw(t)
        engine.destroy()
        // each dot becomes a round-capped zero-length stroke, grouped by colour and size
        const dots: { color: string; w: number; d: string }[] = []
        for (const b of rec.batches) {
            const q = b.pts
            const groups = new Map<number, string>()
            for (let k = 0; k < q.length; k += 3) {
                const w = Math.max(2, Math.round(q[k + 2] * 10)) / 5
                groups.set(w, (groups.get(w) || "") + "M" + q[k].toFixed(1) + " " + q[k + 1].toFixed(1) + "h0")
            }
            groups.forEach((d, w) => dots.push({ color: b.fill, w, d }))
        }
        const hot = parseColor(r.particles.hoverColor, parseColor(r.particles.color, [255, 255, 255, 1]))
        return { dots, glows: rec.glows.slice(), glowColor: rgba(hot, 1), additive: engine.glowMode }
    } catch (err) {
        return null
    } finally {
        Math.random = random
    }
}

function FrameSvg({ frame, gid }: { frame: FrozenFrame; gid: string }) {
    // light particles add up like on the live canvas; the blending stays inside this group
    const blend: React.CSSProperties | undefined = frame.additive ? { mixBlendMode: "plus-lighter" as React.CSSProperties["mixBlendMode"] } : undefined
    const g = frame.glows
    const glows: React.ReactNode[] = []
    for (let k = 0; k + 3 < g.length; k += 4) {
        const a = Math.min(1, g[k + 3])
        if (a < 0.01) continue
        glows.push(
            <circle key={k} cx={g[k].toFixed(1)} cy={g[k + 1].toFixed(1)} r={g[k + 2].toFixed(2)} fill={`url(#${gid})`} opacity={a.toFixed(3)} style={blend} />
        )
    }
    return (
        <svg className="pn-frame" aria-hidden="true">
            {glows.length ? (
                <defs>
                    <radialGradient id={gid}>
                        <stop offset="0" stopColor={frame.glowColor} stopOpacity={1} />
                        <stop offset="0.35" stopColor={frame.glowColor} stopOpacity={0.35} />
                        <stop offset="1" stopColor={frame.glowColor} stopOpacity={0} />
                    </radialGradient>
                </defs>
            ) : null}
            <g style={{ isolation: "isolate" }}>
                {frame.dots.map((p, k) => (
                    <path key={k} d={p.d} fill="none" stroke={p.color} strokeWidth={p.w} strokeLinecap="round" style={blend} />
                ))}
                {glows}
            </g>
        </svg>
    )
}

function StaticNav({ r }: { r: Resolved }) {
    const rootRef = useRef<HTMLElement>(null)
    const contentKey =
        r.links.map((l) => l.label).join("|") + "|" + r.logoText + "|" + r.mark + "|" + r.button.show + r.button.label + JSON.stringify(r.font) + r.padding + r.gap
    const mobile = useMobileLayout(rootRef, r.layout, r.breakpoint, r.align, contentKey)
    const [dims, setDims] = useState({ h: 56, ch: 40 })
    const [layoutKey, setLayoutKey] = useState("")
    const [frame, setFrame] = useState<FrozenFrame | null>(null)
    const gidRef = useRef("")
    if (!gidRef.current) gidRef.current = "pn-glow-" + ++staticGradientId
    // follows the size of the nav and of the parts the particles wrap (late fonts move them)
    useIsoLayoutEffect(() => {
        const el = rootRef.current
        if (!el) return
        const parts = () => Array.from(el.querySelectorAll(".pn-bar > *")) as HTMLElement[]
        const measure = () => {
            const bar = el.querySelector(".pn-bar") as HTMLElement | null
            const cta = el.querySelector(".pn-bar > .pn-cta") as HTMLElement | null
            const h = bar ? bar.offsetHeight : el.offsetHeight
            const ch = cta ? cta.offsetHeight : 40
            setDims((d) => (Math.abs(d.h - h) < 0.5 && Math.abs(d.ch - ch) < 0.5 ? d : { h, ch }))
            let key = el.offsetWidth + "x" + el.offsetHeight
            if (el.offsetWidth > 0) for (const c of parts()) key += "|" + c.offsetLeft + "," + c.offsetTop + "," + c.offsetWidth + "," + c.offsetHeight
            else key = ""
            setLayoutKey((k) => (k === key ? k : key))
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        for (const c of parts()) ro.observe(c)
        return () => ro.disconnect()
    }, [contentKey, mobile])
    const frameKey = JSON.stringify([r.particles, r.button.variant, r.button.show, r.mark, r.radius, r.align, mobile, layoutKey, contentKey])
    useIsoLayoutEffect(() => {
        const root = rootRef.current
        if (!root || !layoutKey) return
        setFrame(freezeFrame(root, r, mobile))
    }, [frameKey])
    const radius = firstPx(r.radius, 999)
    const pad = parseBox(r.padding)
    const ir = Math.max(6, radius - pad[0])
    const color = r.particles.color
    const hot = r.particles.hoverColor
    const size = clamp(r.particles.size, 0.4, 4)
    const d = clamp(r.particles.density, 0.2, 3)
    const navR = Math.min(radius, dims.h / 2)
    const ctaR = Math.min(ir, dims.ch / 2)
    const cls = "pn pn-ready" + (mobile ? " is-mobile" : "") + (r.layout === "Desktop" ? " is-desktop" : "") + (r.align === "Right" ? " is-right" : "")
    const solid = r.button.variant === "Solid"
    // simple dotted fallback, only shown where the frame cannot be laid out (no layout pass)
    const ctaDeco = frame ? null : solid ? (
        <StaticEdge className="pn-static-halo" color={hot} size={size} r={ctaR + 3} spacing={2.3 / d} opacity={0.3} />
    ) : (
        <>
            <StaticDots seed={7} count={Math.round(22 * d)} color={hot} size={size} min={0.2} max={0.42} />
            <StaticEdge color={hot} size={size} r={ctaR} spacing={1.25 / d} opacity={0.9} />
        </>
    )
    return (
        <nav
            ref={rootRef}
            className={cls}
            aria-label="Main"
            style={{ ...r.style, ...r.font, ...cssVars(r, mobile), position: "relative" }}
        >
            <style>{CSS}</style>
            <div className="pn-surface" aria-hidden="true" />
            {frame ? (
                <FrameSvg frame={frame} gid={gidRef.current} />
            ) : (
                <>
                    <StaticDots seed={3} count={Math.round(170 * d)} color={color} size={size} min={0.08} max={0.36} />
                    <StaticEdge color={color} size={size} r={navR} spacing={1.9 / d} opacity={0.62} />
                </>
            )}
            <Bar
                r={r}
                mobile={mobile}
                open={false}
                panelId="pn-static-panel"
                renderPanel={false}
                mark={frame ? null : <StaticMark style={r.mark} color={hot} />}
                icon={frame ? null : <StaticIcon color={hot} />}
                ctaDeco={ctaDeco}
            />
        </nav>
    )
}

// ------------------------------------------------------------------ component

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 760
 * @framerDisableUnlink
 */
export default function ParticleNavbar(props: Props) {
    const isStatic = useIsStaticRenderer()
    const r = resolve(props)
    if (isStatic) return <StaticNav r={r} />
    return <LiveNav r={r} />
}

ParticleNavbar.displayName = "Particle Navbar"

addPropertyControls(ParticleNavbar, {
    logoText: {
        type: ControlType.String,
        title: "Logo",
        defaultValue: "Particle",
    },
    logoImage: {
        type: ControlType.ResponsiveImage,
        title: "Logo Image",
    },
    mark: {
        type: ControlType.Enum,
        title: "Mark",
        options: ["Orb", "Ring", "Atom", "Spiral", "Pulse", "Helix", "Cube", "Morph", "None"],
        optionTitles: ["Orb", "Ring", "Atom", "Spiral", "Pulse", "Helix", "Cube", "Morph", "None"],
        defaultValue: "Orb",
    },
    logoLink: {
        type: ControlType.Link,
        title: "Logo Link",
    },
    logoNewTab: {
        type: ControlType.Boolean,
        title: "Logo New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    links: {
        type: ControlType.Array,
        title: "Links",
        maxCount: 7,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Link" },
                link: { type: ControlType.Link, title: "Link" },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                    enabledTitle: "Yes",
                    disabledTitle: "No",
                },
            },
        },
        defaultValue: [
            { label: "Work", link: "", newTab: false },
            { label: "Services", link: "", newTab: false },
            { label: "About", link: "", newTab: false },
            { label: "Journal", link: "", newTab: false },
        ],
    },
    button: {
        type: ControlType.Object,
        title: "Button",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: true, enabledTitle: "Yes", disabledTitle: "No" },
            label: { type: ControlType.String, title: "Label", defaultValue: "Let’s talk" },
            link: { type: ControlType.Link, title: "Link" },
            newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false, enabledTitle: "Yes", disabledTitle: "No" },
            variant: {
                type: ControlType.Enum,
                title: "Style",
                options: ["Particles", "Solid"],
                optionTitles: ["Particles", "Solid"],
                displaySegmentedControl: true,
                defaultValue: "Particles",
            },
            fill: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "#FFFFFF",
                hidden: (b: ButtonOptions) => !b || b.variant !== "Solid",
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#0C0C0F",
                hidden: (b: ButtonOptions) => !b || b.variant !== "Solid",
            },
        },
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["Center", "Right"],
        optionTitles: ["Center", "Right"],
        displaySegmentedControl: true,
        defaultValue: "Center",
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["Auto", "Desktop", "Mobile"],
        optionTitles: ["Auto", "Desktop", "Mobile"],
        defaultValue: "Auto",
    },
    breakpoint: {
        type: ControlType.Number,
        title: "Breakpoint",
        defaultValue: 720,
        min: 320,
        max: 1600,
        step: 10,
        unit: "px",
        hidden: (p: Props) => p.layout !== undefined && p.layout !== "Auto",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "rgba(255, 255, 255, 0.64)",
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text",
        defaultValue: "#FFFFFF",
    },
    particles: {
        type: ControlType.Object,
        title: "Particles",
        controls: {
            color: { type: ControlType.Color, title: "Color", defaultValue: "#FFFFFF" },
            hoverColor: { type: ControlType.Color, title: "Hover", defaultValue: "#FFFFFF" },
            density: { type: ControlType.Number, title: "Density", defaultValue: 1, min: 0.3, max: 2.5, step: 0.05 },
            size: { type: ControlType.Number, title: "Size", defaultValue: 1.2, min: 0.6, max: 3, step: 0.1, unit: "px" },
            glow: { type: ControlType.Number, title: "Glow", defaultValue: 0.6, min: 0, max: 1, step: 0.05 },
            twinkle: { type: ControlType.Number, title: "Twinkle", defaultValue: 0.5, min: 0, max: 1, step: 0.05 },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            gather: { type: ControlType.Number, title: "Gather", defaultValue: 0.45, min: 0.1, max: 0.8, step: 0.05 },
            speed: { type: ControlType.Number, title: "Speed", defaultValue: 1, min: 0.4, max: 2, step: 0.05 },
            drift: { type: ControlType.Number, title: "Drift", defaultValue: 0.5, min: 0, max: 1, step: 0.05 },
            cursor: { type: ControlType.Number, title: "Cursor Field", defaultValue: 0.5, min: 0, max: 1, step: 0.05 },
            assemble: { type: ControlType.Boolean, title: "Assemble", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
        },
    },
    surface: {
        type: ControlType.Object,
        title: "Surface",
        controls: {
            fill: { type: ControlType.Color, title: "Fill", defaultValue: "rgba(14, 14, 18, 0.72)" },
            blur: { type: ControlType.Number, title: "Blur", defaultValue: 18, min: 0, max: 40, step: 1, unit: "px" },
            shadow: { type: ControlType.BoxShadow, title: "Shadow", defaultValue: "0px 24px 60px -24px rgba(0, 0, 0, 0.6)" },
        },
    },
    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "999px",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "8px 8px 8px 22px",
    },
    gap: {
        type: ControlType.Gap,
        title: "Gap",
        defaultValue: "30px",
    },
    focusRing: {
        type: ControlType.Color,
        title: "Focus Ring",
        defaultValue: "#8AB4FF",
        description: "Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)",
    },
})
