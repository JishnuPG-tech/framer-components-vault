import * as React from "react"
import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence } from "framer-motion"

const CONTINENTS: number[][][] = [
    [
        [-168, 66],
        [-162, 70],
        [-156, 71],
        [-140, 70],
        [-128, 70],
        [-115, 68],
        [-95, 72],
        [-85, 70],
        [-80, 64],
        [-90, 60],
        [-94, 58],
        [-82, 55],
        [-78, 52],
        [-70, 58],
        [-64, 60],
        [-60, 55],
        [-56, 52],
        [-60, 47],
        [-66, 45],
        [-70, 42],
        [-74, 40],
        [-76, 35],
        [-81, 31],
        [-80, 25],
        [-82, 27],
        [-84, 30],
        [-90, 30],
        [-97, 27],
        [-97, 22],
        [-92, 18],
        [-87, 21],
        [-88, 16],
        [-84, 15],
        [-83, 10],
        [-79, 9],
        [-80, 7],
        [-86, 12],
        [-92, 14],
        [-96, 16],
        [-105, 20],
        [-106, 23],
        [-110, 24],
        [-112, 29],
        [-115, 30],
        [-117, 33],
        [-121, 35],
        [-124, 40],
        [-124, 46],
        [-125, 50],
        [-130, 55],
        [-138, 59],
        [-146, 61],
        [-152, 59],
        [-158, 57],
        [-164, 55],
        [-160, 59],
        [-165, 62],
    ],
    [
        [-73, 78],
        [-60, 82],
        [-30, 83],
        [-20, 80],
        [-20, 72],
        [-24, 69],
        [-40, 65],
        [-44, 60],
        [-50, 62],
        [-54, 67],
        [-58, 74],
    ],
    [
        [-80, 9],
        [-75, 11],
        [-71, 12],
        [-62, 10],
        [-55, 6],
        [-50, 2],
        [-48, -1],
        [-40, -3],
        [-35, -6],
        [-35, -9],
        [-39, -14],
        [-39, -19],
        [-42, -23],
        [-48, -26],
        [-49, -29],
        [-53, -34],
        [-58, -35],
        [-57, -38],
        [-62, -39],
        [-65, -42],
        [-65, -45],
        [-68, -48],
        [-69, -52],
        [-68, -55],
        [-72, -53],
        [-75, -48],
        [-74, -42],
        [-73, -36],
        [-71, -30],
        [-71, -24],
        [-70, -18],
        [-76, -14],
        [-79, -8],
        [-81, -5],
        [-80, -2],
        [-79, 1],
        [-78, 4],
        [-77, 8],
    ],
    [
        [-10, 36],
        [-9, 43],
        [-2, 43],
        [-1, 46],
        [-5, 48],
        [-2, 49],
        [2, 51],
        [5, 53],
        [8, 54],
        [8, 57],
        [10, 57],
        [11, 54],
        [14, 54],
        [20, 55],
        [21, 57],
        [24, 60],
        [22, 61],
        [21, 64],
        [24, 66],
        [22, 66],
        [17, 62],
        [18, 60],
        [16, 56],
        [12, 56],
        [11, 59],
        [6, 58],
        [5, 62],
        [11, 64],
        [14, 67],
        [18, 70],
        [25, 71],
        [31, 70],
        [40, 67],
        [44, 68],
        [60, 69],
        [70, 73],
        [80, 73],
        [90, 76],
        [105, 78],
        [112, 74],
        [130, 72],
        [142, 73],
        [160, 70],
        [170, 70],
        [180, 68],
        [180, 65],
        [175, 62],
        [163, 60],
        [160, 53],
        [156, 51],
        [155, 57],
        [150, 59],
        [142, 59],
        [136, 54],
        [140, 48],
        [135, 43],
        [130, 42],
        [128, 38],
        [126, 35],
        [126, 38],
        [122, 40],
        [118, 38],
        [121, 32],
        [122, 30],
        [120, 25],
        [115, 22],
        [110, 21],
        [108, 17],
        [109, 12],
        [105, 9],
        [103, 10],
        [100, 13],
        [100, 7],
        [103, 2],
        [104, 1],
        [101, 3],
        [98, 8],
        [98, 16],
        [94, 17],
        [92, 22],
        [88, 22],
        [86, 20],
        [80, 15],
        [80, 10],
        [77, 8],
        [73, 16],
        [72, 21],
        [67, 25],
        [62, 25],
        [57, 26],
        [56, 24],
        [59, 22],
        [55, 17],
        [52, 16],
        [44, 12],
        [43, 15],
        [39, 21],
        [35, 28],
        [34, 31],
        [35, 36],
        [30, 36],
        [27, 37],
        [26, 40],
        [24, 38],
        [22, 37],
        [21, 39],
        [19, 42],
        [16, 43],
        [13, 45],
        [12, 44],
        [15, 41],
        [18, 40],
        [16, 38],
        [12, 38],
        [11, 42],
        [8, 44],
        [4, 43],
        [0, 39],
        [-2, 37],
        [-6, 36],
    ],
    [
        [-17, 21],
        [-16, 28],
        [-10, 30],
        [-6, 36],
        [0, 36],
        [10, 37],
        [11, 33],
        [20, 31],
        [30, 31],
        [33, 31],
        [35, 28],
        [33, 24],
        [37, 18],
        [39, 15],
        [43, 12],
        [51, 12],
        [50, 8],
        [46, 2],
        [41, -2],
        [39, -6],
        [40, -11],
        [40, -16],
        [35, -20],
        [35, -24],
        [32, -29],
        [28, -33],
        [20, -35],
        [18, -32],
        [15, -27],
        [12, -18],
        [13, -12],
        [9, -1],
        [10, 3],
        [6, 4],
        [2, 6],
        [-4, 5],
        [-8, 4],
        [-12, 7],
        [-15, 11],
        [-17, 15],
    ],
    [
        [44, -16],
        [50, -15],
        [50, -22],
        [46, -25],
        [44, -21],
    ],
    [
        [114, -22],
        [114, -26],
        [115, -34],
        [118, -35],
        [124, -33],
        [131, -31],
        [135, -35],
        [138, -35],
        [140, -38],
        [146, -39],
        [150, -37],
        [153, -32],
        [153, -25],
        [149, -21],
        [146, -18],
        [145, -15],
        [142, -11],
        [141, -17],
        [136, -15],
        [137, -12],
        [132, -11],
        [129, -15],
        [126, -14],
        [122, -18],
    ],
    [
        [95, 5],
        [98, 4],
        [104, -2],
        [106, -6],
        [102, -4],
    ],
    [
        [109, 2],
        [111, -3],
        [116, -4],
        [118, 1],
        [117, 7],
        [113, 3],
    ],
    [
        [105, -6],
        [114, -7],
        [114, -8],
        [106, -7],
    ],
    [
        [131, -1],
        [138, -2],
        [147, -6],
        [150, -10],
        [143, -9],
        [138, -8],
        [132, -4],
    ],
    [
        [120, 18],
        [122, 18],
        [126, 7],
        [124, 7],
        [120, 14],
    ],
    [
        [130, 31],
        [132, 34],
        [135, 35],
        [140, 36],
        [141, 41],
        [142, 45],
        [145, 44],
        [141, 38],
        [140, 35],
        [136, 34],
        [131, 31],
    ],
    [
        [-5, 50],
        [1, 51],
        [2, 53],
        [0, 54],
        [-2, 56],
        [-2, 58],
        [-5, 58],
        [-6, 56],
        [-4, 54],
        [-3, 52],
    ],
    [
        [-10, 52],
        [-6, 52],
        [-6, 55],
        [-8, 55],
        [-10, 54],
    ],
    [
        [-24, 64],
        [-14, 64],
        [-14, 66],
        [-22, 66],
    ],
    [
        [172, -34],
        [178, -38],
        [174, -41],
        [170, -46],
        [167, -46],
        [172, -41],
    ],
]

function enclosed(lng: number, lat: number, ring: number[][]) {
    let flip = false
    for (let a = 0, b = ring.length - 1; a < ring.length; b = a++) {
        const ya = ring[a][1]
        const yb = ring[b][1]
        if (ya > lat !== yb > lat) {
            const xa = ring[a][0]
            const xb = ring[b][0]
            if (lng < ((xb - xa) * (lat - ya)) / (yb - ya) + xa) flip = !flip
        }
    }
    return flip
}

function dry(lng: number, lat: number) {
    if (lat < -73) return true
    for (let k = 0; k < CONTINENTS.length; k++)
        if (enclosed(lng, lat, CONTINENTS[k])) return true
    return false
}

const HEX_CACHE = new Map<string, Float32Array>()

/** Land dots on a hex-offset lattice (alternate rows shifted half a step), as unit vectors. */
function hexLand(spacing: number): Float32Array {
    const s = Math.max(0.8, Math.min(5, spacing))
    const key = s.toFixed(2)
    const cached = HEX_CACHE.get(key)
    if (cached) return cached
    const acc: number[] = []
    let row = 0
    for (let lat = -82; lat <= 82; lat += s * 0.866, row++) {
        const c = Math.cos(lat * TO_RAD)
        const step = s / Math.max(0.12, c)
        for (
            let lng = -180 + (row % 2 ? step / 2 : 0);
            lng < 180;
            lng += step
        ) {
            if (!dry(lng, lat)) continue
            acc.push(
                c * Math.sin(lng * TO_RAD),
                Math.sin(lat * TO_RAD),
                c * Math.cos(lng * TO_RAD)
            )
        }
    }
    const out = new Float32Array(acc)
    HEX_CACHE.set(key, out)
    return out
}

/* ────────────────────────────── sphere maths ────────────────────────────── */

const TO_RAD = Math.PI / 180
const TO_DEG = 180 / Math.PI

type Vec = [number, number, number]

function vecOf(lat: number, lng: number): Vec {
    const p = lat * TO_RAD
    const l = lng * TO_RAD
    return [Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l)]
}

function geoOf(v: Vec) {
    const n = Math.hypot(v[0], v[1], v[2]) || 1
    return {
        lat: Math.asin(Math.max(-1, Math.min(1, v[1] / n))) * TO_DEG,
        lng: Math.atan2(v[0], v[2]) * TO_DEG,
    }
}

function arcBlend(a: Vec, b: Vec, t: number): Vec {
    const d = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))
    const w = Math.acos(d)
    if (w < 1e-5) return [a[0], a[1], a[2]]
    const s = Math.sin(w)
    const p = Math.sin((1 - t) * w) / s
    const q = Math.sin(t * w) / s
    return [a[0] * p + b[0] * q, a[1] * p + b[1] * q, a[2] * p + b[2] * q]
}

type Lens = { cl: number; sl: number; cp: number; sp: number }

const lensAt = (lng: number, lat: number): Lens => ({
    cl: Math.cos(lng * TO_RAD),
    sl: Math.sin(lng * TO_RAD),
    cp: Math.cos(lat * TO_RAD),
    sp: Math.sin(lat * TO_RAD),
})

/** Rotate so (lat, lng) of the lens faces the viewer; returns [x, y, depth]. */
function seen(x: number, y: number, z: number, k: Lens): Vec {
    const x1 = x * k.cl - z * k.sl
    const z1 = x * k.sl + z * k.cl
    return [x1, y * k.cp - z1 * k.sp, y * k.sp + z1 * k.cp]
}

const smooth = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
const clampN = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const wrap = (v: number) => ((((v + 180) % 360) + 360) % 360) - 180

/* ────────────────────────────── layout (pure maths, no markup) ────────────────────────────── */

type Stage = {
    wide: boolean
    ox: number
    oy: number
    R: number
    fx: number
    fy: number
    top: number
    bottom: number
}

function stageFor(
    W: number,
    H: number,
    pad: number,
    labelW: number,
    size: number,
    compact: boolean
): Stage {
    const wide = W >= 760 && W / H > 1.25
    const top = pad + 64
    const bottom = H - pad - 30
    const ox = W / 2
    const oy = top + (bottom - top) / 2
    const byW = compact ? W * 0.33 : W / 2 - labelW - 28
    const byH = (bottom - top) / 2 - 6
    const R = Math.max(54, Math.min(byW, byH) * clampN(size, 0.5, 1.1))
    return {
        wide,
        ox,
        oy,
        R,
        fx: wide ? W * 0.3 : W / 2,
        fy: wide ? H * 0.5 : H * 0.23,
        top,
        bottom,
    }
}

type Slot = {
    x: number
    y: number
    side: number
    px: number
    py: number
    front: boolean
}

const TAG_H = 30

/** Callout placement: labels hug a ring around the globe, split left/right, de-overlapped per side. */
function placeTags(
    pins: { px: number; py: number; dx: number; dy: number; z: number }[],
    widths: number[],
    cx: number,
    cy: number,
    ring: number,
    top: number,
    bottom: number,
    W: number
): Slot[] {
    const slots: (Slot & { i: number })[] = pins.map((p, i) => {
        const len = Math.hypot(p.dx, p.dy)
        const ux = len < 1e-4 ? 1 : p.dx / len
        const uy = len < 1e-4 ? 0 : p.dy / len
        return {
            i,
            x: 0,
            y: cy + uy * ring - TAG_H / 2,
            side: ux >= 0 ? 1 : -1,
            px: p.px,
            py: p.py,
            front: p.z > 0.03,
        }
    })
    const gap = 6
    for (const side of [1, -1]) {
        const col = slots
            .filter((s) => s.side === side)
            .sort((a, b) => a.y - b.y)
        if (!col.length) continue
        for (let k = 1; k < col.length; k++)
            if (col[k].y < col[k - 1].y + TAG_H + gap)
                col[k].y = col[k - 1].y + TAG_H + gap
        const maxY = bottom - TAG_H
        if (col[col.length - 1].y > maxY) {
            col[col.length - 1].y = maxY
            for (let k = col.length - 2; k >= 0; k--)
                if (col[k].y > col[k + 1].y - TAG_H - gap)
                    col[k].y = col[k + 1].y - TAG_H - gap
        }
        if (col[0].y < top) {
            col[0].y = top
            for (let k = 1; k < col.length; k++)
                if (col[k].y < col[k - 1].y + TAG_H + gap)
                    col[k].y = col[k - 1].y + TAG_H + gap
        }
        for (const s of col) {
            const w = widths[s.i] || 120
            const dy = s.y + TAG_H / 2 - cy
            const dx = Math.sqrt(Math.max(0, ring * ring - dy * dy))
            const x = side > 0 ? cx + dx + 10 : cx - dx - 10 - w
            s.x = clampN(x, 8, Math.max(8, W - 8 - w))
        }
    }
    return slots
}

/* ────────────────────────────── time ────────────────────────────── */

function wallClock(zone: string | undefined, at: number) {
    try {
        const parts = new Intl.DateTimeFormat("en-US", {
            timeZone: zone && zone.trim() ? zone.trim() : undefined,
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            hourCycle: "h23",
        }).formatToParts(new Date(at))
        const v: Record<string, number> = {}
        for (const p of parts)
            if (p.type !== "literal") v[p.type] = Number(p.value)
        const asUtc = Date.UTC(
            v.year,
            v.month - 1,
            v.day,
            v.hour % 24,
            v.minute
        )
        const minutesAhead = Math.round((asUtc - (at - (at % 60000))) / 60000)
        if (!isFinite(minutesAhead) || !isFinite(v.hour))
            throw new Error("zone")
        return { h: v.hour % 24, m: v.minute, minutesAhead }
    } catch {
        const d = new Date(at)
        return {
            h: d.getHours(),
            m: d.getMinutes(),
            minutesAhead: -d.getTimezoneOffset(),
        }
    }
}

function readout(zone: string | undefined, at: number, h24: boolean) {
    const c = wallClock(zone, at)
    const mm = String(c.m).padStart(2, "0")
    const time = h24
        ? `${String(c.h).padStart(2, "0")}:${mm}`
        : `${c.h % 12 || 12}:${mm}`
    const ampm = h24 ? "" : c.h < 12 ? "AM" : "PM"
    const delta = c.minutesAhead + new Date(at).getTimezoneOffset()
    let shift = "±0h"
    if (delta) {
        const a = Math.abs(delta)
        shift = `${delta > 0 ? "+" : "−"}${Math.floor(a / 60)}${a % 60 ? `:${String(a % 60).padStart(2, "0")}` : ""}h`
    }
    return { time, ampm, shift, day: c.h >= 6 && c.h < 18 }
}

/* ────────────────────────────── content ────────────────────────────── */

type Img = { src?: string; srcSet?: string; alt?: string } | undefined

type Office = {
    city?: string
    country?: string
    role?: string
    lat?: number
    lng?: number
    zone?: string
    image?: Img
    imageUrl?: string
    image2?: Img
    image2Url?: string
    image3?: Img
    image3Url?: string
    address?: string
    phone?: string
    email?: string
    hours?: string
    button?: string
    buttonLink?: string
    mapLabel?: string
    mapLink?: string
    link?: string
    newTab?: boolean
}

function photos(o: Office) {
    const take = (i: Img, u?: string) => {
        const src = (i && i.src) || (u || "").trim()
        return src ? { src, alt: (i && i.alt) || o.city || "" } : null
    }
    return [
        take(o.image, o.imageUrl),
        take(o.image2, o.image2Url),
        take(o.image3, o.image3Url),
    ].filter(Boolean) as { src: string; alt: string }[]
}

const latLngText = (o: Office) =>
    `${Math.abs(o.lat || 0).toFixed(2)}°${(o.lat || 0) >= 0 ? "N" : "S"}  ${Math.abs(o.lng || 0).toFixed(2)}°${(o.lng || 0) >= 0 ? "E" : "W"}`

const two = (n: number) => String(n).padStart(2, "0")

type Sphere = {
    start: "overview" | "open"
    size: number
    zoom: number
    spacing: number
    dot: number
    grid: boolean
    spin: boolean
    spinSpeed: number
    dive: number
}

type Deck = {
    pad: number
    radius: number
    cardWidth: number
    photoHeight: number
    cycle: boolean
    cycleEvery: number
}

type Ink = {
    field: string
    ink: string
    muted: string
    line: string
    sphere: string
    sphereLight: string
    land: string
    grid: string
    accent: string
    onAccent: string
    card: string
}

type Words = {
    eyebrow: string
    heading: string
    hint: string
    back: string
    yourTime: string
    address: string
    contact: string
    hours: string
    view: string
    clock24: boolean
}

type Props = {
    offices: Office[]
    sphere: Sphere
    deck: Deck
    ink: Ink
    words: Words
    titleFont: any
    bodyFont: any
    style?: React.CSSProperties
}

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Nadir(props: Props) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <NadirStill {...props} />
    return <NadirLive {...props} />
}

/* ────────────────────────────── icons ────────────────────────────── */

function Glyph({ d, size = 14 }: { d: string; size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d={d} />
        </svg>
    )
}
const D_OUT = "M5 11 11 5M6.5 5H11v4.5"
const D_PREV = "M10 3.5 5.5 8l4.5 4.5"
const D_NEXT = "M6 3.5 10.5 8 6 12.5"
const D_X = "M4 4l8 8M12 4l-8 8"
const D_BACK = "M13 8H3.5M7 4.5 3.5 8 7 11.5"
const D_PIN =
    "M8 14s4.5-4.2 4.5-7.5a4.5 4.5 0 0 0-9 0C3.5 9.8 8 14 8 14Zm0-6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
const D_SUN =
    "M8 5.4a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2ZM8 1.8v1.4M8 12.8v1.4M1.8 8h1.4M12.8 8h1.4M3.6 3.6l1 1M11.4 11.4l1 1M3.6 12.4l1-1M11.4 4.6l1-1"
const D_MOON = "M13 9.7A5.4 5.4 0 0 1 6.3 3a5.4 5.4 0 1 0 6.7 6.7Z"

const CHANNELS: Record<string, number[]> = {}
function channels(c: string): number[] {
    if (CHANNELS[c]) return CHANNELS[c]
    let out = [0, 0, 0, 1]
    const s = (c || "").trim()
    const hex = s.match(/^#([\da-f]{3}|[\da-f]{6})$/i)
    if (hex) {
        const h =
            hex[1].length === 3 ? hex[1].replace(/./g, (m) => m + m) : hex[1]
        const n = parseInt(h, 16)
        out = [n >> 16, (n >> 8) & 255, n & 255, 1]
    } else {
        const fn = s.match(/rgba?\(([^)]+)\)/i)
        if (fn) {
            const p = fn[1].split(",").map(parseFloat)
            out = [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]]
        }
    }
    CHANNELS[c] = out
    return out
}
const tint = (c: string, a: number) => {
    const p = channels(c)
    return `rgba(${p[0]}, ${p[1]}, ${p[2]}, ${a * p[3]})`
}

/* ────────────────────────────── live branch ────────────────────────────── */

function usePermit(node: React.RefObject<HTMLElement>) {
    const [inView, setInView] = useState(false)
    const [tabOn, setTabOn] = useState(true)
    const [calm, setCalm] = useState(false)
    useEffect(() => {
        const el = node.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }
        const io = new IntersectionObserver(
            (entries) => setInView(entries.some((e) => e.isIntersecting)),
            { threshold: 0.02 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])
    useEffect(() => {
        if (typeof document === "undefined") return
        const sync = () => setTabOn(document.visibilityState !== "hidden")
        sync()
        document.addEventListener("visibilitychange", sync)
        return () => document.removeEventListener("visibilitychange", sync)
    }, [])
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setCalm(mq.matches)
        sync()
        mq.addEventListener
            ? mq.addEventListener("change", sync)
            : mq.addListener(sync)
        return () => {
            mq.removeEventListener
                ? mq.removeEventListener("change", sync)
                : mq.removeListener(sync)
        }
    }, [])
    return { running: inView && tabOn, calm }
}

function navigate(href?: string, tab?: boolean) {
    if (!href || typeof window === "undefined") return
    if (tab) window.open(href, "_blank", "noopener,noreferrer")
    else window.location.href = href
}

const RISE: [number, number, number, number] = [0.22, 1, 0.36, 1]

type Trip = {
    a: Vec
    b: Vec
    f0: number
    f1: number
    dip: number
    start: number
    ms: number
    done?: () => void
}

function NadirLive(props: Props) {
    const offices = props.offices || []
    const sphere = { ...SPHERE0, ...(props.sphere || {}) }
    const deck = { ...DECK0, ...(props.deck || {}) }
    const ink = { ...INK0, ...(props.ink || {}) }
    const words = { ...WORDS0, ...(props.words || {}) }
    const titleFont = props.titleFont || {}
    const bodyFont = props.bodyFont || {}
    const uid = "n" + useId().replace(/[^a-zA-Z0-9]/g, "")

    const root = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const tagRefs = useRef<(HTMLButtonElement | null)[]>([])
    const tagWidths = useRef<number[]>([])
    const buffer = useRef<{
        x: Float32Array
        y: Float32Array
        s: Float32Array
        b: Uint8Array
    } | null>(null)

    const { running, calm } = usePermit(root)
    const [dims, setDims] = useState({ w: 0, h: 0 })
    const compact = dims.w > 0 && dims.w < 560
    const count = offices.length
    const openFirst = sphere.start === "open" && count > 0
    const [openAt, setOpenAt] = useState(openFirst ? 0 : -1)
    const [lastAt, setLastAt] = useState(0)
    const [landed, setLanded] = useState(openFirst)
    const [pic, setPic] = useState(0)
    const [hovering, setHovering] = useState(false)
    const [stamp, setStamp] = useState(() => Date.now())
    const cur = openAt >= 0 && count ? Math.min(openAt, count - 1) : -1
    const office: Office | null = cur >= 0 ? offices[cur] : null
    const pics = office ? photos(office) : []
    const picAt = pics.length ? pic % pics.length : 0

    const rig = useRef({
        lng: offices[0]?.lng ?? 0,
        lat: openFirst
            ? (offices[0]?.lat ?? 0)
            : clampN(offices[0]?.lat ?? 18, -28, 28) * 0.6,
        f: openFirst ? 1 : 0,
        trip: null as Trip | null,
        held: false,
        gx: 0,
        gy: 0,
        moved: 0,
        vx: 0,
        vy: 0,
        raf: 0,
        last: 0,
        idleAt: 0,
        hover: -1,
        lastAt: 0,
    })
    const permit = useRef({ running: false, calm: false })
    permit.current = { running, calm }
    const state = useRef({ offices, sphere, deck, ink, dims, compact, cur })
    state.current = { offices, sphere, deck, ink, dims, compact, cur }
    rig.current.lastAt = lastAt

    const stageNow = () => {
        const s = state.current
        return stageFor(
            s.dims.w,
            s.dims.h,
            s.deck.pad,
            s.compact ? 100 : 156,
            s.sphere.size,
            s.compact
        )
    }

    const view = () => {
        const g = stageNow()
        const r = rig.current
        const z = Math.max(1, state.current.sphere.zoom)
        return {
            g,
            R: g.R * Math.pow(z, r.f),
            cx: g.ox + (g.fx - g.ox) * r.f,
            cy: g.oy + (g.fy - g.oy) * r.f,
            lens: lensAt(r.lng, r.lat),
        }
    }

    const paint = () => {
        const cv = canvasRef.current
        const ctx = cv && cv.getContext("2d")
        const s = state.current
        const W = s.dims.w
        const H = s.dims.h
        if (!cv || !ctx || !W || !H) return
        const r = rig.current
        const { g, R, cx, cy, lens } = view()
        const k = s.ink
        const f = r.f
        const dpr = Math.min(2, window.devicePixelRatio || 1)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, W, H)

        // contact shadow under the globe while in orbit
        if (f < 0.98) {
            const sy = cy + R * 1.06
            const sh = ctx.createRadialGradient(cx, sy, 0, cx, sy, R * 0.85)
            sh.addColorStop(0, tint(k.ink, 0.22 * (1 - f)))
            sh.addColorStop(1, tint(k.ink, 0))
            ctx.fillStyle = sh
            ctx.beginPath()
            ctx.ellipse(cx, sy, R * 0.85, R * 0.12, 0, 0, Math.PI * 2)
            ctx.fill()
        }

        // body
        const body = ctx.createRadialGradient(
            cx - R * 0.38,
            cy - R * 0.42,
            R * 0.04,
            cx,
            cy,
            R
        )
        body.addColorStop(0, k.sphereLight)
        body.addColorStop(1, k.sphere)
        ctx.fillStyle = body
        ctx.beginPath()
        ctx.arc(cx, cy, R, 0, Math.PI * 2)
        ctx.fill()

        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, R, 0, Math.PI * 2)
        ctx.clip()

        if (s.sphere.grid) {
            ctx.strokeStyle = k.grid
            ctx.lineWidth = 0.8
            ctx.beginPath()
            const trace = (pts: Vec[]) => {
                let pen = false
                for (const p of pts) {
                    const q = seen(p[0], p[1], p[2], lens)
                    if (q[2] > 0) {
                        const X = cx + q[0] * R
                        const Y = cy - q[1] * R
                        pen ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)
                        pen = true
                    } else pen = false
                }
            }
            for (let lng = -180; lng < 180; lng += 15) {
                const pts: Vec[] = []
                for (let lat = -84; lat <= 84; lat += 3)
                    pts.push(vecOf(lat, lng))
                trace(pts)
            }
            for (let lat = -75; lat <= 75; lat += 15) {
                const pts: Vec[] = []
                for (let lng = -180; lng <= 180; lng += 3)
                    pts.push(vecOf(lat, lng))
                trace(pts)
            }
            ctx.stroke()
        }

        // halftone land, projected once then drawn in four depth bands
        const land = hexLand(s.sphere.spacing)
        const n = land.length / 3
        let buf = buffer.current
        if (!buf || buf.x.length < n)
            buf = buffer.current = {
                x: new Float32Array(n),
                y: new Float32Array(n),
                s: new Float32Array(n),
                b: new Uint8Array(n),
            }
        const zoom = Math.max(1, s.sphere.zoom)
        const base = s.sphere.dot * (1 + f * (zoom - 1) * 0.42)
        let m = 0
        for (let i = 0; i < land.length; i += 3) {
            const q = seen(land[i], land[i + 1], land[i + 2], lens)
            if (q[2] <= 0.02) continue
            const X = cx + q[0] * R
            const Y = cy - q[1] * R
            if (X < -10 || X > W + 10 || Y < -10 || Y > H + 10) continue
            buf.x[m] = X
            buf.y[m] = Y
            buf.s[m] = (base * (0.55 + 0.45 * q[2])) / 2
            buf.b[m] = Math.min(3, Math.floor(q[2] * 4))
            m++
        }
        ctx.fillStyle = k.land
        for (let band = 0; band < 4; band++) {
            ctx.globalAlpha = 0.24 + band * 0.25
            ctx.beginPath()
            for (let j = 0; j < m; j++) {
                if (buf.b[j] !== band) continue
                ctx.moveTo(buf.x[j] + buf.s[j], buf.y[j])
                ctx.arc(buf.x[j], buf.y[j], buf.s[j], 0, Math.PI * 2)
            }
            ctx.fill()
        }
        ctx.globalAlpha = 1
        ctx.restore()

        // rim light
        ctx.strokeStyle = tint(k.land, 0.16)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(cx, cy, R - 0.5, 0, Math.PI * 2)
        ctx.stroke()

        // pins + callouts
        const ring = R + 16
        const tagAlpha = clampN(1 - f * 2.6, 0, 1)
        const pins = s.offices.map((o) => {
            const v = vecOf(o.lat || 0, o.lng || 0)
            const q = seen(v[0], v[1], v[2], lens)
            return {
                px: cx + q[0] * R,
                py: cy - q[1] * R,
                dx: q[0],
                dy: -q[1],
                z: q[2],
            }
        })
        const slots = placeTags(
            pins,
            tagWidths.current,
            cx,
            cy,
            ring,
            g.top,
            g.bottom,
            W
        )

        if (tagAlpha > 0) {
            slots.forEach((sl, i) => {
                if (!sl.front) return
                const w = tagWidths.current[i] || 120
                const ey = sl.y + TAG_H / 2
                const ex = sl.side > 0 ? sl.x : sl.x + w
                const elbow = sl.side > 0 ? ex - 14 : ex + 14
                const hot = r.hover === i
                ctx.strokeStyle = tint(k.accent, (hot ? 1 : 0.7) * tagAlpha)
                ctx.lineWidth = hot ? 1.6 : 1
                ctx.beginPath()
                ctx.moveTo(sl.px, sl.py)
                ctx.lineTo(elbow, ey)
                ctx.lineTo(ex, ey)
                ctx.stroke()
            })
        }

        pins.forEach((p, i) => {
            if (p.z <= 0.03) return
            const on = i === s.cur
            ctx.globalAlpha = 0.45 + 0.55 * p.z
            ctx.fillStyle = on ? k.accent : k.land
            ctx.beginPath()
            ctx.arc(p.px, p.py, on ? 5 : 3.2, 0, Math.PI * 2)
            ctx.fill()
            ctx.strokeStyle = on ? k.land : k.accent
            ctx.lineWidth = 1.5
            ctx.stroke()
            ctx.globalAlpha = 1
        })

        // callout DOM
        slots.forEach((sl, i) => {
            const el = tagRefs.current[i]
            if (!el) return
            el.style.transform = `translate3d(${sl.x.toFixed(1)}px, ${sl.y.toFixed(1)}px, 0)`
            el.style.opacity = String(tagAlpha * (sl.front ? 1 : 0.55))
            el.style.pointerEvents = tagAlpha > 0.5 ? "auto" : "none"
        })
    }

    const frame = useCallback((t: number) => {
        const r = rig.current
        r.raf = 0
        if (!permit.current.running) return
        const dt = r.last ? Math.min(0.05, (t - r.last) / 1000) : 1 / 60
        r.last = t
        const s = state.current
        const calmNow = permit.current.calm
        let more = false
        if (r.trip) {
            const tr = r.trip
            const e = calmNow ? 1 : clampN((t - tr.start) / tr.ms, 0, 1)
            const k = smooth(e)
            const g = geoOf(arcBlend(tr.a, tr.b, k))
            r.lng = g.lng
            r.lat = g.lat
            r.f = clampN(
                tr.f0 + (tr.f1 - tr.f0) * k - tr.dip * Math.sin(Math.PI * k),
                0,
                1
            )
            if (e >= 1) {
                r.f = tr.f1
                r.trip = null
                tr.done && tr.done()
            }
            more = true
        } else if (r.held) {
            more = true
        } else {
            if (Math.abs(r.vx) + Math.abs(r.vy) > 0.004) {
                r.lng += r.vx
                r.lat = clampN(r.lat + r.vy, -50, 50)
                const damp = Math.pow(0.9, dt * 60)
                r.vx *= damp
                r.vy *= damp
                more = true
            } else {
                r.vx = 0
                r.vy = 0
            }
            if (
                s.sphere.spin &&
                !calmNow &&
                r.f < 0.01 &&
                performance.now() > r.idleAt
            ) {
                r.lng += s.sphere.spinSpeed * dt
                more = true
            }
        }
        r.lng = wrap(r.lng)
        paint()
        if (more) r.raf = requestAnimationFrame(frame)
        else r.last = 0
    }, [])

    const wake = useCallback(() => {
        const r = rig.current
        if (
            !r.raf &&
            permit.current.running &&
            typeof requestAnimationFrame !== "undefined"
        )
            r.raf = requestAnimationFrame(frame)
    }, [frame])

    useEffect(() => {
        const r = rig.current
        if (running) wake()
        else {
            if (r.raf) cancelAnimationFrame(r.raf)
            r.raf = 0
            r.last = 0
            r.held = false
            r.vx = 0
            r.vy = 0
        }
    }, [running, wake])

    useEffect(
        () => () => {
            const r = rig.current
            if (r.raf) cancelAnimationFrame(r.raf)
            r.raf = 0
        },
        []
    )

    useEffect(() => {
        const el = root.current
        if (!el) return
        const sync = () => setDims({ w: el.offsetWidth, h: el.offsetHeight })
        sync()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(sync)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    useLayoutEffect(() => {
        const cv = canvasRef.current
        if (!cv || !dims.w) return
        const dpr = Math.min(2, window.devicePixelRatio || 1)
        cv.width = Math.round(dims.w * dpr)
        cv.height = Math.round(dims.h * dpr)
        cv.style.width = `${dims.w}px`
        cv.style.height = `${dims.h}px`
    }, [dims.w, dims.h])

    // measure callout widths, then repaint so panel edits show at once
    useLayoutEffect(() => {
        tagRefs.current.forEach((el, i) => {
            if (el) tagWidths.current[i] = el.offsetWidth
        })
        if (permit.current.running) {
            paint()
            wake()
        }
    })

    useEffect(() => {
        if (!running) return
        setStamp(Date.now())
        const id = setInterval(() => setStamp(Date.now()), 30000)
        return () => clearInterval(id)
    }, [running])

    const dive = useCallback(
        (toLat: number, toLng: number, toF: number, done?: () => void) => {
            const r = rig.current
            const a = vecOf(r.lat, r.lng)
            const b = vecOf(toLat, toLng)
            const ang = Math.acos(
                clampN(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1)
            )
            const base = Math.max(0.2, state.current.sphere.dive) * 1000
            const travel = ang / Math.PI
            const hop = r.f > 0.5 && toF > 0.5
            r.trip = {
                a,
                b,
                f0: r.f,
                f1: toF,
                dip: hop ? Math.min(0.85, 0.25 + travel * 1.4) : 0,
                start: performance.now(),
                ms: base * (hop ? 0.75 + travel * 0.6 : 0.6 + travel * 0.5),
                done,
            }
            r.vx = 0
            r.vy = 0
            wake()
        },
        [wake]
    )

    const openOffice = useCallback(
        (i: number) => {
            if (!count) return
            const k = ((i % count) + count) % count
            const o = state.current.offices[k] || {}
            setOpenAt(k)
            setLastAt(k)
            setPic(0)
            setLanded(false)
            dive(clampN(o.lat || 0, -80, 80), o.lng || 0, 1, () =>
                setLanded(true)
            )
        },
        [count, dive]
    )

    const closeOffice = useCallback(() => {
        const r = rig.current
        setOpenAt(-1)
        setLanded(false)
        r.idleAt = performance.now() + 1800
        dive(clampN(r.lat, -28, 28) * 0.6, r.lng, 0)
    }, [dive])

    const cycling =
        running &&
        deck.cycle &&
        cur >= 0 &&
        !hovering &&
        !calm &&
        count > 1 &&
        landed
    useEffect(() => {
        if (!cycling) return
        const id = setTimeout(
            () => openOffice(cur + 1),
            Math.max(3, deck.cycleEvery) * 1000
        )
        return () => clearTimeout(id)
    }, [cycling, cur, deck.cycleEvery, openOffice])

    const down = (e: React.PointerEvent) => {
        const r = rig.current
        if (r.f > 0.05 || r.trip) return
        r.held = true
        r.gx = e.clientX
        r.gy = e.clientY
        r.moved = 0
        r.vx = 0
        r.vy = 0
        ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
        wake()
    }
    const move = (e: React.PointerEvent) => {
        const r = rig.current
        if (!r.held) return
        const { R } = view()
        const dx = e.clientX - r.gx
        const dy = e.clientY - r.gy
        r.gx = e.clientX
        r.gy = e.clientY
        r.moved += Math.abs(dx) + Math.abs(dy)
        const ax = -(dx / R) * TO_DEG
        const ay = (dy / R) * TO_DEG
        r.lng += ax
        r.lat = clampN(r.lat + ay, -50, 50)
        r.vx = ax
        r.vy = ay
    }
    const up = (e: React.PointerEvent) => {
        const r = rig.current
        if (!r.held) return
        r.held = false
        r.idleAt = performance.now() + 2500
        ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
        if (r.moved < 6) {
            const box = root.current?.getBoundingClientRect()
            if (box) {
                const px = e.clientX - box.left
                const py = e.clientY - box.top
                const { R, cx, cy, lens } = view()
                let best = -1
                let bestD = 24 * 24
                state.current.offices.forEach((o, i) => {
                    const v = vecOf(o.lat || 0, o.lng || 0)
                    const q = seen(v[0], v[1], v[2], lens)
                    if (q[2] <= 0.03) return
                    const d =
                        (cx + q[0] * R - px) ** 2 + (cy - q[1] * R - py) ** 2
                    if (d < bestD) {
                        bestD = d
                        best = i
                    }
                })
                if (best >= 0) openOffice(best)
            }
        }
        wake()
    }

    const hoverTag = (i: number) => {
        rig.current.hover = i
        if (permit.current.running) paint()
    }

    if (!count)
        return (
            <div style={{ ...props.style, ...bodyFont, ...emptyLook(ink) }}>
                Add offices in the property panel
            </div>
        )

    const g = stageFor(
        dims.w || 700,
        dims.h || 700,
        deck.pad,
        compact ? 100 : 156,
        sphere.size,
        compact
    )
    const pad = compact ? Math.min(deck.pad, 18) : deck.pad
    const mine = readout(undefined, stamp, words.clock24)
    const sp = calm ? 0 : 1
    const linked = !!office?.link
    const there = office ? readout(office.zone, stamp, words.clock24) : null
    const threeCols = !g.wide && !compact

    const css = `
@keyframes ${uid}ring { 0% { transform: translate(-50%, -50%) scale(0.35); opacity: 0.9 } 100% { transform: translate(-50%, -50%) scale(2.6); opacity: 0 } }
.${uid}tag:focus-visible, .${uid}btn:focus-visible { outline: 2px solid ${ink.accent}; outline-offset: 2px }
`

    const cardFrame: React.CSSProperties = g.wide
        ? {
              position: "absolute",
              right: pad,
              top: pad,
              bottom: pad,
              width: Math.min(deck.cardWidth, (dims.w || 700) * 0.48),
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
              zIndex: 4,
          }
        : {
              position: "absolute",
              left: pad,
              right: pad,
              bottom: pad,
              top: g.fy + 46,
              display: "flex",
              alignItems: "flex-end",
              pointerEvents: "none",
              zIndex: 4,
          }

    const round: React.CSSProperties = {
        all: "unset",
        cursor: "pointer",
        width: 34,
        height: 34,
        borderRadius: 34,
        display: "grid",
        placeItems: "center",
        border: `1px solid ${ink.line}`,
        color: ink.ink,
        flex: "0 0 auto",
    }

    return (
        <div
            ref={root}
            onPointerEnter={() => setHovering(true)}
            onPointerLeave={() => setHovering(false)}
            onKeyDown={(e) => {
                if (e.key === "Escape" && cur >= 0) closeOffice()
            }}
            style={{
                ...props.style,
                ...bodyFont,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: ink.field,
                color: ink.ink,
                boxSizing: "border-box",
            }}
        >
            <style>{css}</style>

            <canvas
                ref={canvasRef}
                onPointerDown={down}
                onPointerMove={move}
                onPointerUp={up}
                onPointerCancel={up}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    display: "block",
                    cursor: cur >= 0 ? "default" : "grab",
                    touchAction: "pan-y",
                }}
            />

            {/* callout labels */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    zIndex: 2,
                }}
            >
                {offices.map((o, i) => {
                    const mark = i === lastAt
                    const clock = readout(o.zone, stamp, words.clock24)
                    return (
                        <button
                            key={i}
                            ref={(el) => {
                                tagRefs.current[i] = el
                            }}
                            className={`${uid}tag`}
                            aria-label={o.city || `Office ${i + 1}`}
                            onClick={() => openOffice(i)}
                            onPointerEnter={() => hoverTag(i)}
                            onPointerLeave={() => hoverTag(-1)}
                            onFocus={() => hoverTag(i)}
                            onBlur={() => hoverTag(-1)}
                            style={{
                                all: "unset",
                                position: "absolute",
                                left: 0,
                                top: 0,
                                height: TAG_H,
                                boxSizing: "border-box",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "0 12px 0 5px",
                                borderRadius: 999,
                                background: mark ? ink.ink : ink.card,
                                color: mark ? ink.card : ink.ink,
                                border: `1px solid ${mark ? ink.ink : ink.line}`,
                                boxShadow: `0 6px 18px -10px ${tint(ink.ink, 0.5)}`,
                                fontSize: compact ? 11.5 : 12.5,
                                whiteSpace: "nowrap",
                                cursor: "pointer",
                                opacity: 0,
                                pointerEvents: "none",
                                willChange: "transform",
                            }}
                        >
                            <span
                                style={{
                                    minWidth: 20,
                                    height: 20,
                                    borderRadius: 20,
                                    display: "grid",
                                    placeItems: "center",
                                    background: ink.accent,
                                    color: ink.onAccent,
                                    fontSize: 10,
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {i + 1}
                            </span>
                            <span style={{ fontWeight: 600 }}>{o.city}</span>
                            {!compact && (
                                <span
                                    style={{
                                        fontSize: 11,
                                        opacity: 0.6,
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    {clock.time}
                                    {clock.ampm && ` ${clock.ampm}`}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* masthead (orbit only) */}
            <motion.div
                initial={false}
                animate={{ opacity: cur >= 0 ? 0 : 1, y: cur >= 0 ? -10 : 0 }}
                transition={{ duration: 0.4 * sp, ease: RISE }}
                style={{
                    position: "absolute",
                    top: pad,
                    left: pad,
                    right: pad,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 16,
                    pointerEvents: "none",
                    zIndex: 3,
                }}
            >
                <div style={{ minWidth: 0 }}>
                    {words.eyebrow && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                fontSize: 11,
                                letterSpacing: "0.2em",
                                textTransform: "uppercase",
                                color: ink.accent,
                                marginBottom: 8,
                            }}
                        >
                            <span
                                style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: 2,
                                    background: ink.accent,
                                    transform: "rotate(45deg)",
                                }}
                            />
                            {words.eyebrow}
                        </div>
                    )}
                    {words.heading && (
                        <div
                            style={{
                                ...titleFont,
                                fontSize: compact ? 22 : 30,
                                lineHeight: 1.05,
                                letterSpacing: "-0.03em",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {words.heading}
                        </div>
                    )}
                </div>
                {!compact && (
                    <div
                        style={{
                            textAlign: "right",
                            flex: "0 0 auto",
                            fontVariantNumeric: "tabular-nums",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 10.5,
                                letterSpacing: "0.18em",
                                textTransform: "uppercase",
                                color: ink.muted,
                                marginBottom: 5,
                            }}
                        >
                            {words.yourTime}
                        </div>
                        <div style={{ fontSize: 18 }}>
                            {mine.time}
                            {mine.ampm && (
                                <span
                                    style={{
                                        fontSize: 11,
                                        marginLeft: 3,
                                        color: ink.muted,
                                    }}
                                >
                                    {mine.ampm}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </motion.div>

            {/* hint (orbit only) */}
            <motion.div
                initial={false}
                animate={{ opacity: cur >= 0 ? 0 : 1 }}
                transition={{ duration: 0.3 * sp }}
                style={{
                    position: "absolute",
                    left: pad,
                    right: pad,
                    bottom: pad,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 11.5,
                    letterSpacing: "0.04em",
                    color: ink.muted,
                    pointerEvents: "none",
                    zIndex: 3,
                }}
            >
                <span
                    style={{
                        fontVariantNumeric: "tabular-nums",
                        color: ink.ink,
                    }}
                >
                    {two(count)}
                </span>
                <span style={{ width: 18, height: 1, background: ink.line }} />
                <span
                    style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {words.hint}
                </span>
            </motion.div>

            {/* back chip (dived) */}
            <AnimatePresence>
                {cur >= 0 && (
                    <motion.button
                        key="back"
                        className={`${uid}btn`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{
                            opacity: 1,
                            x: 0,
                            transition: {
                                duration: 0.4 * sp,
                                delay: 0.2 * sp,
                                ease: RISE,
                            },
                        }}
                        exit={{
                            opacity: 0,
                            transition: { duration: 0.15 * sp },
                        }}
                        onClick={closeOffice}
                        style={{
                            all: "unset",
                            position: "absolute",
                            top: pad,
                            left: pad,
                            zIndex: 5,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 14px 8px 10px",
                            borderRadius: 999,
                            background: ink.card,
                            color: ink.ink,
                            fontSize: 12.5,
                            boxShadow: `0 10px 24px -14px ${tint(ink.ink, 0.6)}`,
                        }}
                    >
                        <Glyph d={D_BACK} size={14} />
                        {words.back}
                    </motion.button>
                )}
            </AnimatePresence>

            {/* landed pin pulse */}
            {cur >= 0 && landed && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: g.fx,
                        top: g.fy,
                        width: 0,
                        height: 0,
                        zIndex: 3,
                        pointerEvents: "none",
                    }}
                >
                    {!calm &&
                        [0, 1].map((k) => (
                            <span
                                key={k}
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    width: 44,
                                    height: 44,
                                    borderRadius: 44,
                                    border: `1.5px solid ${ink.accent}`,
                                    animation: `${uid}ring 2.4s cubic-bezier(0.2, 0.6, 0.3, 1) ${k * 1.2}s infinite`,
                                    animationPlayState: running
                                        ? "running"
                                        : "paused",
                                }}
                            />
                        ))}
                    <span
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: 14,
                            height: 14,
                            borderRadius: 14,
                            transform: "translate(-50%, -50%)",
                            background: ink.accent,
                            border: `2.5px solid ${ink.card}`,
                            boxShadow: `0 0 0 6px ${tint(ink.accent, 0.25)}`,
                        }}
                    />
                </div>
            )}

            {/* detail card */}
            <div style={cardFrame}>
                <AnimatePresence>
                    {office && there && (
                        <motion.div
                            key="card"
                            initial={{ opacity: 0, y: 36 }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                transition: {
                                    duration: 0.6 * sp,
                                    delay: 0.3 * sp,
                                    ease: RISE,
                                },
                            }}
                            exit={{
                                opacity: 0,
                                y: 24,
                                transition: { duration: 0.25 * sp },
                            }}
                            role={linked ? "link" : undefined}
                            tabIndex={linked ? 0 : undefined}
                            aria-label={
                                linked
                                    ? `${words.view}: ${office.city || ""}`
                                    : undefined
                            }
                            onClick={() =>
                                linked && navigate(office.link, office.newTab)
                            }
                            onKeyDown={(e) => {
                                if (
                                    linked &&
                                    e.key === "Enter" &&
                                    e.target === e.currentTarget
                                )
                                    navigate(office.link, office.newTab)
                            }}
                            style={{
                                pointerEvents: "auto",
                                width: "100%",
                                maxHeight: "100%",
                                boxSizing: "border-box",
                                display: "flex",
                                flexDirection: "column",
                                background: ink.card,
                                borderRadius: deck.radius,
                                overflow: "hidden",
                                boxShadow: `0 40px 80px -36px ${tint(ink.ink, 0.55)}`,
                                cursor: linked ? "pointer" : "default",
                                outline: "none",
                            }}
                        >
                            {pics.length > 0 && (
                                <div
                                    style={{
                                        position: "relative",
                                        flex: `0 1 ${compact ? Math.round(deck.photoHeight * 0.75) : deck.photoHeight}px`,
                                        minHeight: 0,
                                        margin: 8,
                                        marginBottom: 0,
                                        borderRadius: Math.max(
                                            0,
                                            deck.radius - 6
                                        ),
                                        overflow: "hidden",
                                        background: ink.line,
                                    }}
                                >
                                    <AnimatePresence initial={false}>
                                        <motion.img
                                            key={`${cur}-${picAt}`}
                                            src={pics[picAt].src}
                                            alt={pics[picAt].alt}
                                            draggable={false}
                                            initial={{
                                                clipPath:
                                                    "inset(0% 0% 0% 100%)",
                                            }}
                                            animate={{
                                                clipPath: "inset(0% 0% 0% 0%)",
                                            }}
                                            exit={{ opacity: 1 }}
                                            transition={{
                                                duration: 0.75 * sp,
                                                ease: RISE,
                                            }}
                                            onError={(e) => {
                                                ;(
                                                    e.currentTarget as HTMLImageElement
                                                ).style.visibility = "hidden"
                                            }}
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block",
                                            }}
                                        />
                                    </AnimatePresence>
                                    <div
                                        style={{
                                            position: "absolute",
                                            zIndex: 2,
                                            left: 10,
                                            top: 10,
                                            padding: "5px 9px",
                                            borderRadius: 999,
                                            background: "rgba(0,0,0,0.45)",
                                            color: "#fff",
                                            fontSize: 10.5,
                                            letterSpacing: "0.08em",
                                            fontVariantNumeric: "tabular-nums",
                                            whiteSpace: "pre",
                                        }}
                                    >
                                        {latLngText(office)}
                                    </div>
                                    {pics.length > 1 && (
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                                position: "absolute",
                                                zIndex: 2,
                                                right: 10,
                                                bottom: 10,
                                                display: "flex",
                                                gap: 6,
                                            }}
                                        >
                                            {pics.map((p, k) => (
                                                <button
                                                    key={k}
                                                    className={`${uid}btn`}
                                                    aria-label={`Photo ${k + 1}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setPic(k)
                                                    }}
                                                    style={{
                                                        all: "unset",
                                                        cursor: "pointer",
                                                        width: 34,
                                                        height: 34,
                                                        borderRadius: 9,
                                                        overflow: "hidden",
                                                        boxSizing: "border-box",
                                                        border: `2px solid ${k === picAt ? "#fff" : "rgba(255,255,255,0.35)"}`,
                                                        opacity:
                                                            k === picAt
                                                                ? 1
                                                                : 0.8,
                                                        background:
                                                            "rgba(255,255,255,0.2)",
                                                        transition:
                                                            "border-color .25s, opacity .25s",
                                                    }}
                                                >
                                                    <img
                                                        src={p.src}
                                                        alt=""
                                                        draggable={false}
                                                        style={{
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit: "cover",
                                                            display: "block",
                                                        }}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={`body-${cur}`}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        transition: {
                                            duration: 0.4 * sp,
                                            ease: RISE,
                                        },
                                    }}
                                    exit={{
                                        opacity: 0,
                                        transition: { duration: 0.12 * sp },
                                    }}
                                    style={{
                                        flex: "0 0 auto",
                                        padding: compact
                                            ? "14px 16px 16px"
                                            : "18px 22px 20px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: compact ? 10 : 13,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 10,
                                            fontSize: 10.5,
                                            letterSpacing: "0.18em",
                                            textTransform: "uppercase",
                                            color: ink.muted,
                                        }}
                                    >
                                        <span
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                                minWidth: 0,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    color: ink.accent,
                                                    fontVariantNumeric:
                                                        "tabular-nums",
                                                }}
                                            >
                                                {two(cur + 1)} / {two(count)}
                                            </span>
                                            {office.role && (
                                                <span
                                                    style={{
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                    }}
                                                >
                                                    {office.role}
                                                </span>
                                            )}
                                        </span>
                                        <span
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                                color: ink.ink,
                                                letterSpacing: "0.04em",
                                                fontVariantNumeric:
                                                    "tabular-nums",
                                                flex: "0 0 auto",
                                            }}
                                        >
                                            <Glyph
                                                d={there.day ? D_SUN : D_MOON}
                                                size={12}
                                            />
                                            {there.time}
                                            {there.ampm && (
                                                <span
                                                    style={{ color: ink.muted }}
                                                >
                                                    {there.ampm}
                                                </span>
                                            )}
                                            <span style={{ color: ink.muted }}>
                                                {there.shift}
                                            </span>
                                        </span>
                                    </div>

                                    <div style={{ minWidth: 0 }}>
                                        <div
                                            style={{
                                                ...titleFont,
                                                color: ink.ink,
                                                fontSize: compact ? 28 : 38,
                                                lineHeight: 1,
                                                letterSpacing: "-0.035em",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {office.city}
                                        </div>
                                        {office.country && (
                                            <div
                                                style={{
                                                    marginTop: 5,
                                                    fontSize: "0.86em",
                                                    color: ink.muted,
                                                }}
                                            >
                                                {office.country}
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: threeCols
                                                ? "1.15fr 1fr 0.9fr"
                                                : "1fr 1fr",
                                            gap: compact ? 12 : 18,
                                            paddingTop: compact ? 10 : 13,
                                            borderTop: `1px solid ${ink.line}`,
                                            fontSize: "0.88em",
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        <div style={{ minWidth: 0 }}>
                                            <Kicker color={ink.muted}>
                                                {words.address}
                                            </Kicker>
                                            <div
                                                style={{
                                                    whiteSpace: "pre-line",
                                                }}
                                            >
                                                {office.address}
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                minWidth: 0,
                                                display: "flex",
                                                flexDirection: "column",
                                            }}
                                        >
                                            <Kicker color={ink.muted}>
                                                {words.contact}
                                            </Kicker>
                                            {office.phone && (
                                                <a
                                                    href={`tel:${office.phone.replace(/[^\d+]/g, "")}`}
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                    style={{
                                                        color: ink.ink,
                                                        textDecoration: "none",
                                                        width: "fit-content",
                                                        fontVariantNumeric:
                                                            "tabular-nums",
                                                    }}
                                                >
                                                    <Underline
                                                        tone={ink.accent}
                                                    >
                                                        {office.phone}
                                                    </Underline>
                                                </a>
                                            )}
                                            {office.email && (
                                                <a
                                                    href={`mailto:${office.email}`}
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                    style={{
                                                        color: ink.ink,
                                                        textDecoration: "none",
                                                        width: "fit-content",
                                                        overflowWrap:
                                                            "anywhere",
                                                    }}
                                                >
                                                    <Underline
                                                        tone={ink.accent}
                                                    >
                                                        {office.email}
                                                    </Underline>
                                                </a>
                                            )}
                                        </div>
                                        {office.hours && (
                                            <div
                                                style={{
                                                    minWidth: 0,
                                                    gridColumn: threeCols
                                                        ? undefined
                                                        : "1 / -1",
                                                    display: threeCols
                                                        ? "block"
                                                        : "flex",
                                                    alignItems: "baseline",
                                                    gap: 12,
                                                }}
                                            >
                                                <Kicker color={ink.muted}>
                                                    {words.hours}
                                                </Kicker>
                                                <div
                                                    style={{
                                                        whiteSpace: threeCols
                                                            ? "pre-line"
                                                            : "normal",
                                                        fontVariantNumeric:
                                                            "tabular-nums",
                                                    }}
                                                >
                                                    {threeCols
                                                        ? office.hours
                                                        : office.hours.replace(
                                                              /\n+/g,
                                                              " · "
                                                          )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        {office.button && (
                                            <motion.a
                                                href={
                                                    office.buttonLink ||
                                                    undefined
                                                }
                                                target={
                                                    office.newTab
                                                        ? "_blank"
                                                        : undefined
                                                }
                                                rel={
                                                    office.newTab
                                                        ? "noopener noreferrer"
                                                        : undefined
                                                }
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                                whileHover={
                                                    calm ? undefined : { y: -2 }
                                                }
                                                whileTap={
                                                    calm
                                                        ? undefined
                                                        : { scale: 0.97 }
                                                }
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                    padding: "10px 16px",
                                                    borderRadius: 999,
                                                    background: ink.accent,
                                                    color: ink.onAccent,
                                                    textDecoration: "none",
                                                    fontWeight: 600,
                                                    fontSize: "0.86em",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {office.button}
                                                <Glyph d={D_OUT} size={12} />
                                            </motion.a>
                                        )}
                                        {office.mapLink && (
                                            <a
                                                href={office.mapLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                    color: ink.ink,
                                                    textDecoration: "none",
                                                    fontSize: "0.85em",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                <Glyph d={D_PIN} size={13} />
                                                <Underline tone={ink.accent}>
                                                    {office.mapLabel || "Map"}
                                                </Underline>
                                            </a>
                                        )}
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                                marginLeft: "auto",
                                                display: "flex",
                                                gap: 6,
                                            }}
                                        >
                                            {count > 1 &&
                                                [-1, 1].map((d) => (
                                                    <motion.button
                                                        key={d}
                                                        className={`${uid}btn`}
                                                        aria-label={
                                                            d < 0
                                                                ? "Previous office"
                                                                : "Next office"
                                                        }
                                                        onClick={() =>
                                                            openOffice(cur + d)
                                                        }
                                                        whileHover={
                                                            calm
                                                                ? undefined
                                                                : {
                                                                      scale: 1.07,
                                                                  }
                                                        }
                                                        whileTap={
                                                            calm
                                                                ? undefined
                                                                : {
                                                                      scale: 0.93,
                                                                  }
                                                        }
                                                        style={round}
                                                    >
                                                        <Glyph
                                                            d={
                                                                d < 0
                                                                    ? D_PREV
                                                                    : D_NEXT
                                                            }
                                                            size={13}
                                                        />
                                                    </motion.button>
                                                ))}
                                            <motion.button
                                                className={`${uid}btn`}
                                                aria-label={words.back}
                                                onClick={closeOffice}
                                                whileHover={
                                                    calm
                                                        ? undefined
                                                        : { rotate: 90 }
                                                }
                                                whileTap={
                                                    calm
                                                        ? undefined
                                                        : { scale: 0.93 }
                                                }
                                                style={{
                                                    ...round,
                                                    background: ink.ink,
                                                    color: ink.card,
                                                    borderColor: ink.ink,
                                                }}
                                            >
                                                <Glyph d={D_X} size={12} />
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

function Kicker({
    children,
    color,
}: {
    children: React.ReactNode
    color: string
}) {
    return (
        <div
            style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color,
                marginBottom: 5,
                flex: "0 0 auto",
            }}
        >
            {children}
        </div>
    )
}

function Underline({
    children,
    tone,
}: {
    children: React.ReactNode
    tone: string
}) {
    const [lit, setLit] = useState(false)
    return (
        <span
            onPointerEnter={() => setLit(true)}
            onPointerLeave={() => setLit(false)}
            style={{ position: "relative", display: "inline-block" }}
        >
            {children}
            <motion.span
                initial={false}
                animate={{ scaleX: lit ? 1 : 0 }}
                transition={{ duration: 0.3, ease: RISE }}
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: -1,
                    height: 1,
                    background: tone,
                    transformOrigin: lit ? "left" : "right",
                }}
            />
        </span>
    )
}

function emptyLook(k: Ink): React.CSSProperties {
    return {
        width: "100%",
        height: "100%",
        display: "grid",
        placeItems: "center",
        background: k.field,
        color: k.muted,
        fontSize: 14,
    }
}

/* ────────────────────────────── static branch ────────────────────────────── */

function NadirStill(props: Props) {
    const offices = props.offices || []
    const sphere = { ...SPHERE0, ...(props.sphere || {}) }
    const deck = { ...DECK0, ...(props.deck || {}) }
    const ink = { ...INK0, ...(props.ink || {}) }
    const words = { ...WORDS0, ...(props.words || {}) }
    const titleFont = props.titleFont || {}
    const bodyFont = props.bodyFont || {}
    const count = offices.length
    if (!count)
        return (
            <div style={{ ...props.style, ...bodyFont, ...emptyLook(ink) }}>
                Add offices in the property panel
            </div>
        )

    const at = Date.now()
    const opened = sphere.start === "open"
    const first = offices[0]
    const VW = 700
    const VH = 700
    const g = stageFor(VW, VH, deck.pad, 156, sphere.size, false)
    const R = opened ? g.R * Math.max(1, sphere.zoom) : g.R
    const cx = opened ? g.fx : g.ox
    const cy = opened ? g.fy : g.oy
    const lens = lensAt(
        first.lng || 0,
        opened ? first.lat || 0 : clampN(first.lat || 18, -28, 28) * 0.6
    )
    const mine = readout(undefined, at, words.clock24)
    const dotR =
        (sphere.dot *
            (opened ? 1 + (Math.max(1, sphere.zoom) - 1) * 0.42 : 1)) /
        2

    const land = hexLand(sphere.spacing)
    const dots: React.ReactNode[] = []
    for (let i = 0; i < land.length; i += 3) {
        const q = seen(land[i], land[i + 1], land[i + 2], lens)
        if (q[2] <= 0.02) continue
        const X = cx + q[0] * R
        const Y = cy - q[1] * R
        if (X < -10 || X > VW + 10 || Y < -10 || Y > VH + 10) continue
        dots.push(
            <circle
                key={i}
                cx={X.toFixed(1)}
                cy={Y.toFixed(1)}
                r={(dotR * (0.55 + 0.45 * q[2])).toFixed(2)}
                fill={ink.land}
                opacity={0.24 + Math.min(3, Math.floor(q[2] * 4)) * 0.25}
            />
        )
    }
    let grid = ""
    if (sphere.grid) {
        const add = (pts: Vec[]) => {
            let pen = false
            for (const p of pts) {
                const q = seen(p[0], p[1], p[2], lens)
                if (q[2] > 0) {
                    grid += `${pen ? "L" : "M"}${(cx + q[0] * R).toFixed(1)} ${(cy - q[1] * R).toFixed(1)} `
                    pen = true
                } else pen = false
            }
        }
        for (let lng = -180; lng < 180; lng += 15) {
            const pts: Vec[] = []
            for (let lat = -84; lat <= 84; lat += 3) pts.push(vecOf(lat, lng))
            add(pts)
        }
        for (let lat = -75; lat <= 75; lat += 15) {
            const pts: Vec[] = []
            for (let lng = -180; lng <= 180; lng += 3) pts.push(vecOf(lat, lng))
            add(pts)
        }
    }
    const pins = offices.map((o) => {
        const v = vecOf(o.lat || 0, o.lng || 0)
        const q = seen(v[0], v[1], v[2], lens)
        return {
            px: cx + q[0] * R,
            py: cy - q[1] * R,
            dx: q[0],
            dy: -q[1],
            z: q[2],
        }
    })
    const widths = offices.map((o) =>
        Math.round(62 + (o.city || "").length * 7.4 + 34)
    )
    const slots = opened
        ? []
        : placeTags(pins, widths, cx, cy, R + 16, g.top, g.bottom, VW)

    const office = first
    const pics = photos(office)
    const there = readout(office.zone, at, words.clock24)

    return (
        <div
            style={{
                ...props.style,
                ...bodyFont,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: ink.field,
                color: ink.ink,
            }}
        >
            <svg
                viewBox={`0 0 ${VW} ${VH}`}
                preserveAspectRatio={
                    opened ? "xMidYMin slice" : "xMidYMid meet"
                }
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                }}
                aria-hidden="true"
            >
                <defs>
                    <radialGradient
                        id="nadir-body"
                        cx={cx - R * 0.38}
                        cy={cy - R * 0.42}
                        r={R}
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop offset="0" stopColor={ink.sphereLight} />
                        <stop offset="1" stopColor={ink.sphere} />
                    </radialGradient>
                    <radialGradient id="nadir-shadow" cx="0.5" cy="0.5" r="0.5">
                        <stop
                            offset="0"
                            stopColor={ink.ink}
                            stopOpacity="0.22"
                        />
                        <stop offset="1" stopColor={ink.ink} stopOpacity="0" />
                    </radialGradient>
                    <clipPath id="nadir-disc">
                        <circle cx={cx} cy={cy} r={R} />
                    </clipPath>
                </defs>
                {!opened && (
                    <ellipse
                        cx={cx}
                        cy={cy + R * 1.06}
                        rx={R * 0.85}
                        ry={R * 0.12}
                        fill="url(#nadir-shadow)"
                    />
                )}
                <circle cx={cx} cy={cy} r={R} fill="url(#nadir-body)" />
                <g clipPath="url(#nadir-disc)">
                    {grid && (
                        <path
                            d={grid}
                            fill="none"
                            stroke={ink.grid}
                            strokeWidth={0.8}
                        />
                    )}
                    {dots}
                </g>
                <circle
                    cx={cx}
                    cy={cy}
                    r={R - 0.5}
                    fill="none"
                    stroke={tint(ink.land, 0.16)}
                    strokeWidth={1}
                />
                {!opened &&
                    slots.map((sl, i) => {
                        if (!sl.front) return null
                        const w = widths[i]
                        const ey = sl.y + TAG_H / 2
                        const ex = sl.side > 0 ? sl.x : sl.x + w
                        const elbow = sl.side > 0 ? ex - 14 : ex + 14
                        return (
                            <polyline
                                key={`l${i}`}
                                points={`${sl.px},${sl.py} ${elbow},${ey} ${ex},${ey}`}
                                fill="none"
                                stroke={ink.accent}
                                strokeOpacity={0.7}
                                strokeWidth={1}
                            />
                        )
                    })}
                {pins.map((p, i) =>
                    p.z > 0.03 ? (
                        <circle
                            key={`p${i}`}
                            cx={p.px}
                            cy={p.py}
                            r={opened && i === 0 ? 5 : 3.2}
                            fill={opened && i === 0 ? ink.accent : ink.land}
                            stroke={opened && i === 0 ? ink.land : ink.accent}
                            strokeWidth={1.5}
                        />
                    ) : null
                )}
                {!opened &&
                    slots.map((sl, i) => {
                        const w = widths[i]
                        const mark = i === 0
                        return (
                            <g
                                key={`t${i}`}
                                transform={`translate(${sl.x} ${sl.y})`}
                                opacity={sl.front ? 1 : 0.55}
                            >
                                <rect
                                    width={w}
                                    height={TAG_H}
                                    rx={TAG_H / 2}
                                    fill={mark ? ink.ink : ink.card}
                                    stroke={mark ? ink.ink : ink.line}
                                />
                                <circle
                                    cx={15}
                                    cy={TAG_H / 2}
                                    r={10}
                                    fill={ink.accent}
                                />
                                <text
                                    x={15}
                                    y={TAG_H / 2 + 3.5}
                                    textAnchor="middle"
                                    fontSize={10}
                                    fill={ink.onAccent}
                                >
                                    {i + 1}
                                </text>
                                <text
                                    x={33}
                                    y={TAG_H / 2 + 4.3}
                                    fontSize={12.5}
                                    fontWeight={600}
                                    fill={mark ? ink.card : ink.ink}
                                >
                                    {offices[i].city}
                                </text>
                            </g>
                        )
                    })}
            </svg>

            {!opened && (
                <>
                    <div
                        style={{
                            position: "absolute",
                            top: deck.pad,
                            left: deck.pad,
                            right: deck.pad,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 16,
                        }}
                    >
                        <div style={{ minWidth: 0 }}>
                            {words.eyebrow && (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        fontSize: 11,
                                        letterSpacing: "0.2em",
                                        textTransform: "uppercase",
                                        color: ink.accent,
                                        marginBottom: 8,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 7,
                                            height: 7,
                                            borderRadius: 2,
                                            background: ink.accent,
                                            transform: "rotate(45deg)",
                                        }}
                                    />
                                    {words.eyebrow}
                                </div>
                            )}
                            {words.heading && (
                                <div
                                    style={{
                                        ...titleFont,
                                        fontSize: 30,
                                        lineHeight: 1.05,
                                        letterSpacing: "-0.03em",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {words.heading}
                                </div>
                            )}
                        </div>
                        <div style={{ textAlign: "right", flex: "0 0 auto" }}>
                            <div
                                style={{
                                    fontSize: 10.5,
                                    letterSpacing: "0.18em",
                                    textTransform: "uppercase",
                                    color: ink.muted,
                                    marginBottom: 5,
                                }}
                            >
                                {words.yourTime}
                            </div>
                            <div style={{ fontSize: 18 }}>
                                {mine.time}
                                {mine.ampm && (
                                    <span
                                        style={{
                                            fontSize: 11,
                                            marginLeft: 3,
                                            color: ink.muted,
                                        }}
                                    >
                                        {mine.ampm}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div
                        style={{
                            position: "absolute",
                            left: deck.pad,
                            right: deck.pad,
                            bottom: deck.pad,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: 10,
                            fontSize: 11.5,
                            color: ink.muted,
                        }}
                    >
                        <div style={{ color: ink.ink }}>{two(count)}</div>
                        <div
                            style={{
                                width: 18,
                                height: 1,
                                background: ink.line,
                            }}
                        />
                        <div>{words.hint}</div>
                    </div>
                </>
            )}

            {opened && (
                <>
                    <div
                        style={{
                            position: "absolute",
                            top: deck.pad,
                            left: deck.pad,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 14px 8px 10px",
                            borderRadius: 999,
                            background: ink.card,
                            fontSize: 12.5,
                        }}
                    >
                        <Glyph d={D_BACK} size={14} />
                        {words.back}
                    </div>
                    <div
                        style={{
                            position: "absolute",
                            left: deck.pad,
                            right: deck.pad,
                            bottom: deck.pad,
                            top: "34%",
                            display: "flex",
                            alignItems: "flex-end",
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                maxHeight: "100%",
                                display: "flex",
                                flexDirection: "column",
                                background: ink.card,
                                borderRadius: deck.radius,
                                overflow: "hidden",
                            }}
                        >
                            {pics.length > 0 && (
                                <div
                                    style={{
                                        position: "relative",
                                        flex: `0 1 ${deck.photoHeight}px`,
                                        minHeight: 0,
                                        margin: 8,
                                        marginBottom: 0,
                                        borderRadius: Math.max(
                                            0,
                                            deck.radius - 6
                                        ),
                                        overflow: "hidden",
                                        background: ink.line,
                                    }}
                                >
                                    <img
                                        src={pics[0].src}
                                        alt={pics[0].alt}
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: 10,
                                            top: 10,
                                            padding: "5px 9px",
                                            borderRadius: 999,
                                            background: "rgba(0,0,0,0.45)",
                                            color: "#fff",
                                            fontSize: 10.5,
                                            letterSpacing: "0.08em",
                                            whiteSpace: "pre",
                                        }}
                                    >
                                        {latLngText(office)}
                                    </div>
                                </div>
                            )}
                            <div
                                style={{
                                    flex: "0 0 auto",
                                    padding: "18px 22px 20px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 13,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 10,
                                        fontSize: 10.5,
                                        letterSpacing: "0.18em",
                                        textTransform: "uppercase",
                                        color: ink.muted,
                                    }}
                                >
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <div style={{ color: ink.accent }}>
                                            01 / {two(count)}
                                        </div>
                                        {office.role && (
                                            <div>{office.role}</div>
                                        )}
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                            color: ink.ink,
                                            letterSpacing: "0.04em",
                                        }}
                                    >
                                        <Glyph
                                            d={there.day ? D_SUN : D_MOON}
                                            size={12}
                                        />
                                        {there.time}
                                        {there.ampm && (
                                            <div style={{ color: ink.muted }}>
                                                {there.ampm}
                                            </div>
                                        )}
                                        <div style={{ color: ink.muted }}>
                                            {there.shift}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div
                                        style={{
                                            ...titleFont,
                                            fontSize: 38,
                                            lineHeight: 1,
                                            letterSpacing: "-0.035em",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {office.city}
                                    </div>
                                    {office.country && (
                                        <div
                                            style={{
                                                marginTop: 5,
                                                fontSize: "0.86em",
                                                color: ink.muted,
                                            }}
                                        >
                                            {office.country}
                                        </div>
                                    )}
                                </div>
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1.15fr 1fr 0.9fr",
                                        gap: 18,
                                        paddingTop: 13,
                                        borderTop: `1px solid ${ink.line}`,
                                        fontSize: "0.88em",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    <div>
                                        <div
                                            style={{
                                                fontSize: 10,
                                                letterSpacing: "0.2em",
                                                textTransform: "uppercase",
                                                color: ink.muted,
                                                marginBottom: 5,
                                            }}
                                        >
                                            {words.address}
                                        </div>
                                        <div style={{ whiteSpace: "pre-line" }}>
                                            {office.address}
                                        </div>
                                    </div>
                                    <div>
                                        <div
                                            style={{
                                                fontSize: 10,
                                                letterSpacing: "0.2em",
                                                textTransform: "uppercase",
                                                color: ink.muted,
                                                marginBottom: 5,
                                            }}
                                        >
                                            {words.contact}
                                        </div>
                                        {office.phone && (
                                            <div>{office.phone}</div>
                                        )}
                                        {office.email && (
                                            <div
                                                style={{
                                                    overflowWrap: "anywhere",
                                                }}
                                            >
                                                {office.email}
                                            </div>
                                        )}
                                    </div>
                                    {office.hours && (
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    letterSpacing: "0.2em",
                                                    textTransform: "uppercase",
                                                    color: ink.muted,
                                                    marginBottom: 5,
                                                }}
                                            >
                                                {words.hours}
                                            </div>
                                            <div
                                                style={{
                                                    whiteSpace: "pre-line",
                                                }}
                                            >
                                                {office.hours}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                >
                                    {office.button && (
                                        <div
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 8,
                                                padding: "10px 16px",
                                                borderRadius: 999,
                                                background: ink.accent,
                                                color: ink.onAccent,
                                                fontWeight: 600,
                                                fontSize: "0.86em",
                                            }}
                                        >
                                            {office.button}
                                            <Glyph d={D_OUT} size={12} />
                                        </div>
                                    )}
                                    {office.mapLink && (
                                        <div
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 6,
                                                fontSize: "0.85em",
                                            }}
                                        >
                                            <Glyph d={D_PIN} size={13} />
                                            {office.mapLabel || "Map"}
                                        </div>
                                    )}
                                    <div
                                        style={{
                                            marginLeft: "auto",
                                            display: "flex",
                                            gap: 6,
                                        }}
                                    >
                                        {count > 1 &&
                                            [D_PREV, D_NEXT].map((d) => (
                                                <div
                                                    key={d}
                                                    style={{
                                                        width: 34,
                                                        height: 34,
                                                        borderRadius: 34,
                                                        display: "grid",
                                                        placeItems: "center",
                                                        border: `1px solid ${ink.line}`,
                                                    }}
                                                >
                                                    <Glyph d={d} size={13} />
                                                </div>
                                            ))}
                                        <div
                                            style={{
                                                width: 34,
                                                height: 34,
                                                borderRadius: 34,
                                                display: "grid",
                                                placeItems: "center",
                                                background: ink.ink,
                                                color: ink.card,
                                            }}
                                        >
                                            <Glyph d={D_X} size={12} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

/* ────────────────────────────── defaults ────────────────────────────── */

const SPHERE0: Sphere = {
    start: "overview",
    size: 1,
    zoom: 3.6,
    spacing: 1.6,
    dot: 2.6,
    grid: true,
    spin: true,
    spinSpeed: 4,
    dive: 1.8,
}

const DECK0: Deck = {
    pad: 28,
    radius: 22,
    cardWidth: 440,
    photoHeight: 150,
    cycle: false,
    cycleEvery: 8,
}

const INK0: Ink = {
    field: "#EDEDF0",
    ink: "#121216",
    muted: "#77777F",
    line: "rgba(18, 18, 22, 0.12)",
    sphere: "#0F0F13",
    sphereLight: "#2B2B35",
    land: "#E8E8EE",
    grid: "rgba(232, 232, 238, 0.09)",
    accent: "#5B3CF6",
    onAccent: "#FFFFFF",
    card: "#FFFFFF",
}

const WORDS0: Words = {
    eyebrow: "Our offices",
    heading: "Closer than you think",
    hint: "Pick a city to fly in",
    back: "All offices",
    yourTime: "Your time",
    address: "Address",
    contact: "Contact",
    hours: "Hours",
    view: "Open office",
    clock24: true,
}

const U = "https://images.unsplash.com/"
const Q = "?auto=format&fit=crop&w=1200&q=80"

const OFFICES0: Office[] = [
    {
        city: "Stockholm",
        country: "Sweden",
        role: "Headquarters",
        lat: 59.33,
        lng: 18.07,
        zone: "Europe/Stockholm",
        imageUrl: `${U}photo-1509356843151-3e7d96241e11${Q}`,
        image2Url: `${U}photo-1497366754035-f200968a6e72${Q}`,
        address: "Skeppsbron 14\n111 30 Stockholm",
        phone: "+46 8 000 000 00",
        email: "stockholm@example.com",
        hours: "Mon – Fri\n08:30 – 17:00",
        button: "Book a visit",
        mapLabel: "Directions",
    },
    {
        city: "Vancouver",
        country: "Canada",
        role: "Studio",
        lat: 49.28,
        lng: -123.12,
        zone: "America/Vancouver",
        imageUrl: `${U}photo-1559511260-66a654ae982a${Q}`,
        image2Url: `${U}photo-1497366811353-6870744d04b2${Q}`,
        address: "800 Example Street, Floor 9\nVancouver, BC V6B 0A0",
        phone: "+1 604 000 0000",
        email: "vancouver@example.com",
        hours: "Mon – Fri\n09:00 – 17:30",
        button: "Book a visit",
        mapLabel: "Directions",
    },
    {
        city: "Lima",
        country: "Peru",
        role: "Design lab",
        lat: -12.05,
        lng: -77.04,
        zone: "America/Lima",
        imageUrl: `${U}photo-1531968455001-5c5272a41129${Q}`,
        image2Url: `${U}photo-1524758631624-e2822e304c36${Q}`,
        address: "Av. Ejemplo 455, Miraflores\nLima 15074",
        phone: "+51 1 000 0000",
        email: "lima@example.com",
        hours: "Mon – Fri\n09:00 – 18:00",
        button: "Book a visit",
        mapLabel: "Directions",
    },
    {
        city: "Nairobi",
        country: "Kenya",
        role: "Field office",
        lat: -1.29,
        lng: 36.82,
        zone: "Africa/Nairobi",
        imageUrl: `${U}photo-1611348586804-61bf6c080437${Q}`,
        image2Url: `${U}photo-1504384308090-c894fdcc538d${Q}`,
        address: "Example Towers, 6th Floor\nWestlands, Nairobi",
        phone: "+254 20 000 0000",
        email: "nairobi@example.com",
        hours: "Mon – Fri\n08:00 – 17:00",
        button: "Book a visit",
        mapLabel: "Directions",
    },
    {
        city: "Bangkok",
        country: "Thailand",
        role: "Engineering",
        lat: 13.76,
        lng: 100.5,
        zone: "Asia/Bangkok",
        imageUrl: `${U}photo-1508009603885-50cf7c579365${Q}`,
        image2Url: `${U}photo-1519389950473-47ba0277781c${Q}`,
        address: "99 Example Road, 21st Floor\nSathorn, Bangkok 10120",
        phone: "+66 2 000 0000",
        email: "bangkok@example.com",
        hours: "Mon – Fri\n09:30 – 18:30",
        button: "Book a visit",
        mapLabel: "Directions",
    },
    {
        city: "Auckland",
        country: "New Zealand",
        role: "Studio",
        lat: -36.85,
        lng: 174.76,
        zone: "Pacific/Auckland",
        imageUrl: `${U}photo-1507699622108-4be3abd695ad${Q}`,
        image2Url: `${U}photo-1497215728101-856f4ea42174${Q}`,
        address: "12 Example Quay, Level 4\nAuckland 1010",
        phone: "+64 9 000 0000",
        email: "auckland@example.com",
        hours: "Mon – Fri\n08:30 – 17:30",
        button: "Book a visit",
        mapLabel: "Directions",
    },
]

;(Nadir as any).defaultProps = {
    offices: OFFICES0,
    sphere: SPHERE0,
    deck: DECK0,
    ink: INK0,
    words: WORDS0,
    titleFont: { fontWeight: 500, letterSpacing: "-0.03em" },
    bodyFont: { fontSize: "15px", fontWeight: 400, lineHeight: "1.45em" },
}

/* ────────────────────────────── controls ────────────────────────────── */

const onlyIf = (key: string, group: string) => (p: any) =>
    !(p?.[key] ?? p?.[group]?.[key] ?? false)

addPropertyControls(Nadir, {
    offices: {
        type: ControlType.Array,
        title: "Offices",
        maxCount: 12,
        defaultValue: OFFICES0,
        control: {
            type: ControlType.Object,
            controls: {
                city: {
                    type: ControlType.String,
                    title: "City",
                    defaultValue: "City",
                },
                country: {
                    type: ControlType.String,
                    title: "Country",
                    defaultValue: "",
                },
                role: {
                    type: ControlType.String,
                    title: "Role",
                    defaultValue: "Studio",
                },
                lat: {
                    type: ControlType.Number,
                    title: "Latitude",
                    min: -90,
                    max: 90,
                    step: 0.01,
                    defaultValue: 0,
                },
                lng: {
                    type: ControlType.Number,
                    title: "Longitude",
                    min: -180,
                    max: 180,
                    step: 0.01,
                    defaultValue: 0,
                },
                zone: {
                    type: ControlType.String,
                    title: "Time Zone",
                    defaultValue: "UTC",
                    description: "IANA name, e.g. Europe/Oslo",
                },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    defaultValue: "",
                },
                image2: { type: ControlType.ResponsiveImage, title: "Image 2" },
                image2Url: {
                    type: ControlType.String,
                    title: "Image 2 URL",
                    defaultValue: "",
                },
                image3: { type: ControlType.ResponsiveImage, title: "Image 3" },
                image3Url: {
                    type: ControlType.String,
                    title: "Image 3 URL",
                    defaultValue: "",
                },
                address: {
                    type: ControlType.String,
                    title: "Address",
                    displayTextArea: true,
                    defaultValue: "",
                },
                phone: {
                    type: ControlType.String,
                    title: "Phone",
                    defaultValue: "",
                },
                email: {
                    type: ControlType.String,
                    title: "Email",
                    defaultValue: "",
                },
                hours: {
                    type: ControlType.String,
                    title: "Hours",
                    displayTextArea: true,
                    defaultValue: "",
                },
                button: {
                    type: ControlType.String,
                    title: "Button",
                    defaultValue: "Book a visit",
                },
                buttonLink: { type: ControlType.Link, title: "Button Link" },
                mapLabel: {
                    type: ControlType.String,
                    title: "Map Label",
                    defaultValue: "Directions",
                },
                mapLink: { type: ControlType.Link, title: "Map Link" },
                link: { type: ControlType.Link, title: "Card Link" },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                },
            },
        },
    },
    sphere: {
        type: ControlType.Object,
        title: "Globe",
        controls: {
            start: {
                type: ControlType.Enum,
                title: "Start",
                options: ["overview", "open"],
                optionTitles: ["Globe", "First Office"],
                displaySegmentedControl: true,
                defaultValue: SPHERE0.start,
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 0.5,
                max: 1.1,
                step: 0.01,
                defaultValue: SPHERE0.size,
            },
            zoom: {
                type: ControlType.Number,
                title: "Dive Zoom",
                min: 1.5,
                max: 6,
                step: 0.1,
                unit: "×",
                defaultValue: SPHERE0.zoom,
            },
            dive: {
                type: ControlType.Number,
                title: "Dive Time",
                min: 0.4,
                max: 4,
                step: 0.1,
                unit: "s",
                defaultValue: SPHERE0.dive,
            },
            spacing: {
                type: ControlType.Number,
                title: "Dot Spacing",
                min: 0.8,
                max: 5,
                step: 0.1,
                unit: "°",
                defaultValue: SPHERE0.spacing,
            },
            dot: {
                type: ControlType.Number,
                title: "Dot Size",
                min: 0.8,
                max: 6,
                step: 0.1,
                defaultValue: SPHERE0.dot,
            },
            grid: {
                type: ControlType.Boolean,
                title: "Grid",
                defaultValue: SPHERE0.grid,
            },
            spin: {
                type: ControlType.Boolean,
                title: "Idle Spin",
                defaultValue: SPHERE0.spin,
            },
            spinSpeed: {
                type: ControlType.Number,
                title: "Spin Speed",
                min: 0.5,
                max: 20,
                step: 0.5,
                unit: "°/s",
                defaultValue: SPHERE0.spinSpeed,
                hidden: onlyIf("spin", "sphere"),
            },
        },
    },
    deck: {
        type: ControlType.Object,
        title: "Card",
        controls: {
            pad: {
                type: ControlType.Number,
                title: "Padding",
                min: 0,
                max: 96,
                defaultValue: DECK0.pad,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 40,
                defaultValue: DECK0.radius,
            },
            cardWidth: {
                type: ControlType.Number,
                title: "Side Width",
                min: 320,
                max: 640,
                step: 2,
                unit: "px",
                defaultValue: DECK0.cardWidth,
                description: "Used when the frame is wide",
            },
            photoHeight: {
                type: ControlType.Number,
                title: "Photo Height",
                min: 60,
                max: 320,
                step: 2,
                unit: "px",
                defaultValue: DECK0.photoHeight,
            },
            cycle: {
                type: ControlType.Boolean,
                title: "Auto Cycle",
                defaultValue: DECK0.cycle,
            },
            cycleEvery: {
                type: ControlType.Number,
                title: "Every",
                min: 3,
                max: 30,
                step: 0.5,
                unit: "s",
                defaultValue: DECK0.cycleEvery,
                hidden: onlyIf("cycle", "deck"),
            },
        },
    },
    ink: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            field: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: INK0.field,
            },
            ink: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: INK0.ink,
            },
            muted: {
                type: ControlType.Color,
                title: "Muted",
                defaultValue: INK0.muted,
            },
            line: {
                type: ControlType.Color,
                title: "Lines",
                defaultValue: INK0.line,
            },
            accent: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: INK0.accent,
            },
            onAccent: {
                type: ControlType.Color,
                title: "On Accent",
                defaultValue: INK0.onAccent,
            },
            card: {
                type: ControlType.Color,
                title: "Card",
                defaultValue: INK0.card,
            },
            sphere: {
                type: ControlType.Color,
                title: "Globe",
                defaultValue: INK0.sphere,
            },
            sphereLight: {
                type: ControlType.Color,
                title: "Globe Light",
                defaultValue: INK0.sphereLight,
            },
            land: {
                type: ControlType.Color,
                title: "Land Dots",
                defaultValue: INK0.land,
            },
            grid: {
                type: ControlType.Color,
                title: "Grid",
                defaultValue: INK0.grid,
            },
        },
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontWeight: 500, letterSpacing: "-0.03em" },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            fontWeight: 400,
            lineHeight: "1.45em",
        },
    },
    words: {
        type: ControlType.Object,
        title: "Text",
        controls: {
            eyebrow: {
                type: ControlType.String,
                title: "Eyebrow",
                defaultValue: WORDS0.eyebrow,
            },
            heading: {
                type: ControlType.String,
                title: "Heading",
                defaultValue: WORDS0.heading,
            },
            hint: {
                type: ControlType.String,
                title: "Hint",
                defaultValue: WORDS0.hint,
            },
            back: {
                type: ControlType.String,
                title: "Back",
                defaultValue: WORDS0.back,
            },
            clock24: {
                type: ControlType.Boolean,
                title: "Clock",
                enabledTitle: "24h",
                disabledTitle: "12h",
                defaultValue: WORDS0.clock24,
            },
            yourTime: {
                type: ControlType.String,
                title: "Your Time",
                defaultValue: WORDS0.yourTime,
            },
            address: {
                type: ControlType.String,
                title: "Address",
                defaultValue: WORDS0.address,
            },
            contact: {
                type: ControlType.String,
                title: "Contact",
                defaultValue: WORDS0.contact,
            },
            hours: {
                type: ControlType.String,
                title: "Hours",
                defaultValue: WORDS0.hours,
            },
            view: {
                type: ControlType.String,
                title: "Link Label",
                defaultValue: WORDS0.view,
            },
        },
    },
})
