/*
 * Milk Glass Folder v1.0.6, a Framer code component by KOJA Studios.
 *
 * The glass recipe (backdrop blur, tint, specular light, rim), the spring curves and the generator of the painted
 * shimmer on the back panel with its seeded random and hash helpers are adapted from MIT-licensed code that carries
 * no copyright line:
 *
 * MIT License
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 * the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * Our own: the folder shape with tab and thumb cut, grain, bevel, milk glass key, document cards, the card
 * choreography (peek under the pointer, rise, spread, turn), keyboard and swipe control, CMS fields.
 */
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, ReactNode } from "react"

// ------------------------------------------------------------------ types

type ImageValue = { src?: string; srcSet?: string; alt?: string } | string | null | undefined
type FontValue = { fontFamily?: string; fontWeight?: number | string; fontStyle?: string; fontSize?: string | number; lineHeight?: string | number; letterSpacing?: string | number } | null | undefined
type ItemType = "image" | "document"
type Item = { type?: ItemType; image?: ImageValue; title?: string; meta?: string; byline?: string; link?: string; file?: string }

interface Props {
    title?: string
    caption?: string
    link?: string
    source?: "items" | "cms"
    items?: Item[]
    image1?: ImageValue
    image2?: ImageValue
    image3?: ImageValue
    image4?: ImageValue
    card1?: string
    card2?: string
    card3?: string
    card4?: string
    button?: { icon?: "arrow" | "download"; label?: string }
    colors?: { tone?: "light" | "dark"; shimmer1?: string; shimmer2?: string; shimmer3?: string; text?: string }
    fonts?: { title?: FontValue; text?: FontValue }
    look?: { folder?: string; cards?: string; shadow?: string }
    motion?: { hover?: boolean; entrance?: boolean; canvas?: "closed" | "open"; hint?: string }
    onOpen?: () => void
    onClose?: () => void
    /** Layout from Framer (size, position). Passed to the root unchanged, never read for design. */
    style?: CSSProperties
}

type Img = { src: string; srcSet?: string; alt?: string }
type Card = { key: string; where: string; kind: ItemType; title: string; meta: string; byline: string; img: Img | null; href: string; external: boolean; download: boolean }
type Issue = { kind: "origin" | "broken" | "slow" | "paint" | "target" | "empty"; where: string; src?: string }

// ------------------------------------------------------------------ constants

const DEFAULT_TITLE = "Residential"
const DEFAULT_SHADOW = "0px 22px 22px 0px rgba(40,32,24,0.3)"
const DARK_SHADOW_COLOR = "rgba(0,0,0,0.7)"
const SHIMMER = ["#CF8A64", "#6A5045", "#A9B9C4"]
const TITLE_SIZE = 19
const TEXT_SIZE = 13
const LOAD_MS = 8000
const HOVER_DELAY = 80
const PEEK = 92
const SANS = "-apple-system, BlinkMacSystemFont, Inter, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"

/** A demo picture in Framer's storage (Pexels, see build-notes.md) with the sizes Framer's image service scales to. */
const framerImage = (id: string, alt: string): { src: string; srcSet: string; alt: string } => {
    const src = `https://framerusercontent.com/images/${id}.jpg`
    return { src, srcSet: `${src}?scale-down-to=512 512w, ${src}?scale-down-to=1024 1024w, ${src}?scale-down-to=2048 2048w, ${src} 2400w`, alt }
}

/** Default cards after insert; a card shows its demo picture only while it has no image and keeps the demo title. */
const DEMO: { title: string; meta: string; img: { src: string; srcSet?: string; alt?: string } | null }[] = [
    { title: "Oak House", meta: "Residence, 2025", img: framerImage("VBnFSpec9swlCZtM3GN0qDtgA", "Living room") },
    { title: "Travertine Kitchen", meta: "Residence, 2024", img: framerImage("AbWexLKYLsqQ1iRKjGPS6Z9hdw", "Kitchen") },
    { title: "Olive Room", meta: "Residence, 2025", img: framerImage("Zi1hGUAQuJfSy5YDWtmU1iS0HbY", "Plants in a bedroom corner") },
    { title: "Stair Hall", meta: "Residence, 2023", img: framerImage("k9s5uyDEaxFXeJ427aqoTpjF0", "Stair hall") },
]

/** The same four cards for the code default and the panel default. */
const DEMO_ITEMS: Item[] = DEMO.map((d) => ({ type: "image", title: d.title, meta: d.meta }))

/** React 18 writes inert only as text; Framer's editor types it as a boolean. The text goes out. */
const INERT = { inert: "" } as unknown as { inert: boolean }

// ------------------------------------------------------------------ small helpers

const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback)
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const u = (n: number) => `calc(var(--gf-u) * ${round(n)})`
const round = (n: number) => Math.round(n * 1000) / 1000

function hashString(s: string): number {
    let h = 2166136261
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
    return h >>> 0
}

function rng(seed: number): () => number {
    let s = seed >>> 0
    return () => {
        s = (s + 1831565813) >>> 0
        let t = s
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

/** First number of a CSS length ("20px", "20px 4px ..."), in px; anything else falls back. */
function firstPx(v: unknown, fallback: number): number {
    if (typeof v === "number" && Number.isFinite(v)) return v
    const m = /^\s*(-?\d*\.?\d+)(px)?(?=\s|$)/.exec(typeof v === "string" ? v : "")
    const n = m ? parseFloat(m[1]) : NaN
    return Number.isFinite(n) ? n : fallback
}

/** Font size from Framer's Font control as px at 404 px width. */
function fontPx(f: FontValue, fallback: number): number {
    const n = firstPx(f?.fontSize, fallback)
    return n > 0 ? n : fallback
}

/** A size that scales with the folder and never goes below 11 px. */
const scaled = (px: number) => `max(11px, ${u(px)})`

/** Weight of a Font control value; anything unreadable is Medium. */
function weightOf(f: FontValue): number {
    const n = Number(f?.fontWeight)
    return Number.isFinite(n) && n > 0 ? clamp(n, 1, 1000) : 500
}

/** Line height or letter spacing: px values scale with the folder, em, % and plain numbers stay. */
function scaledLength(v: unknown, fallback: string): string {
    if (typeof v === "number" && Number.isFinite(v)) return String(v)
    const s = typeof v === "string" ? v.trim() : ""
    if (!s) return fallback
    const m = /^(-?[\d.]+)px$/.exec(s)
    return m ? u(parseFloat(m[1])) : s
}

/**
 * Allowed images and files: a path on this site, Framer's storage over https, or a full address on the page's own
 * origin (FP-5). The origin is only known after mounting, so server and first browser render always agree.
 */
function allowedUrl(url: unknown, origin = ""): url is string {
    if (typeof url !== "string" || !url || /[\\\u0000-\u0020\u007f]/.test(url)) return false
    if (url.startsWith("/") && !url.startsWith("//")) return true
    if (origin && url.startsWith(origin + "/")) return true
    return /^https:\/\/([a-z0-9-]+\.)*framerusercontent\.com\//i.test(url)
}

/**
 * Link targets: relative paths, http, https, mailto and tel. Anything else (javascript:, data:) is dropped, except
 * Framer's own page links, which arrive in the editor as "data:framer/page-link,…" and as paths on the site.
 */
function safeHref(href: unknown): string {
    const s = typeof href === "string" ? href.trim() : ""
    if (!s) return ""
    const bare = s.replace(/[\u0000-\u0020\u007f]/g, "")
    if (/^data:framer\/page-link,/i.test(bare)) return s
    const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(bare)
    if (!scheme) return s
    return /^(https?|mailto|tel)$/i.test(scheme[1]) ? s : ""
}

/** Keeps a srcset only when every address in it is allowed. */
function allowedSrcSet(set: unknown, origin: string): string | undefined {
    if (typeof set !== "string" || !set.trim()) return undefined
    const urls = set.split(",").map((part) => part.trim().split(/\s+/)[0])
    return urls.every((x) => allowedUrl(x, origin)) ? set : undefined
}

function imageOf(v: ImageValue, origin: string): Img | null | "origin" {
    const src = typeof v === "string" ? v : str(v?.src)
    if (!src) return null
    if (!allowedUrl(src, origin)) return "origin"
    const obj = typeof v === "object" && v ? v : null
    return { src, srcSet: obj ? allowedSrcSet(obj.srcSet, origin) : undefined, alt: obj ? str(obj.alt) : "" }
}

const isExternal = (href: string) => /^(https?:)?\/\//i.test(href)

// ------------------------------------------------------------------ shapes

type Seg = ["M" | "L", number, number] | ["C", number, number, number, number, number, number] | ["A", number, number, number] | ["Z"]

/** Back panel 352 x 264 with the tab on the left. */
function backSegs(r: number): Seg[] {
    return [["M", 0, r], ["A", r, r, 0], ["L", 118, 0], ["C", 138, 0, 142, 22, 162, 22], ["L", 352 - r, 22], ["A", r, 352, 22 + r], ["L", 352, 264 - r], ["A", r, 352 - r, 264], ["L", r, 264], ["A", r, 0, 264 - r], ["Z"]]
}

/** Front glass 352 x 194 with the flat thumb cut in the middle. */
function frontSegs(r: number): Seg[] {
    return [["M", 0, r], ["A", r, r, 0], ["L", 136, 0], ["C", 150, 0, 152, 13, 176, 13], ["C", 200, 13, 202, 0, 216, 0], ["L", 352 - r, 0], ["A", r, 352, r], ["L", 352, 194 - r], ["A", r, 352 - r, 194], ["L", r, 194], ["A", r, 0, 194 - r], ["Z"]]
}

function svgPath(segs: Seg[]): string {
    return segs.map((s) => {
        if (s[0] === "A") return s[1] > 0 ? `A${s[1]} ${s[1]} 0 0 1 ${s[2]} ${s[3]}` : `L${s[2]} ${s[3]}`
        if (s[0] === "Z") return "Z"
        return s[0] + s.slice(1).join(" ")
    }).join("")
}

/** The same outline as CSS shape() in folder units, so it scales with the component. */
function cssShape(segs: Seg[]): string {
    const p = (x: number, y: number) => `${u(x)} ${u(y)}`
    const parts: string[] = []
    for (const s of segs) {
        if (s[0] === "M") parts.push(`from ${p(s[1], s[2])}`)
        else if (s[0] === "L") parts.push(`line to ${p(s[1], s[2])}`)
        else if (s[0] === "C") parts.push(`curve to ${p(s[5], s[6])} with ${p(s[1], s[2])} / ${p(s[3], s[4])}`)
        else if (s[0] === "A") parts.push(s[1] > 0 ? `arc to ${p(s[2], s[3])} of ${u(s[1])} cw` : `line to ${p(s[2], s[3])}`)
        else parts.push("close")
    }
    return `shape(${parts.join(", ")})`
}

// ------------------------------------------------------------------ box shadow

/** An emptied Shadow control or "none" switches both shadows off; no value at all keeps the default. */
const isNoShadow = (v: unknown) => typeof v === "string" && (!v.trim() || v.trim().toLowerCase() === "none")

/** Splits at a separator outside of brackets; null when the brackets do not match. */
function splitTop(text: string, isSep: (ch: string) => boolean): string[] | null {
    const out: string[] = []
    let depth = 0
    let cur = ""
    for (const ch of text) {
        if (ch === "(") depth++
        else if (ch === ")") {
            depth--
            if (depth < 0) return null
        }
        if (depth === 0 && isSep(ch)) {
            out.push(cur)
            cur = ""
        } else cur += ch
    }
    if (depth !== 0) return null
    out.push(cur)
    return out
}

/** Shadow control value with every length scaled to the folder (values hold at 404 px width). */
function scaledShadow(v: unknown, dark: boolean): string {
    const fallback = `${u(0)} ${u(22)} ${u(22)} ${u(0)} ${dark ? DARK_SHADOW_COLOR : "rgba(40,32,24,0.3)"}`
    // no value at all: the default; an emptied control or "none": no shadow
    if (isNoShadow(v)) return "none"
    const raw = typeof v === "string" ? v.trim() : DEFAULT_SHADOW
    if (/[;{}"'\\]|\/\*/.test(raw)) return fallback
    const parts = splitTop(raw, (ch) => ch === ",")
    if (!parts) return fallback
    const isDefault = sameShadow(raw, DEFAULT_SHADOW)
    const out: string[] = []
    for (const part of parts) {
        const tokens = splitTop(part.trim(), (ch) => /\s/.test(ch))
        if (!tokens) return fallback
        const lengths: string[] = []
        const color: string[] = []
        let inset = false
        for (const t of tokens.filter(Boolean)) {
            if (/^-?\d*\.?\d+(px)?$/.test(t)) lengths.push(u(parseFloat(t)))
            else if (t === "inset") inset = true
            else color.push(t)
        }
        if (lengths.length < 2) continue
        const c = dark && isDefault ? DARK_SHADOW_COLOR : color.join(" ") || "rgba(0,0,0,0.3)"
        out.push(`${inset ? "inset " : ""}${lengths.join(" ")} ${c}`)
    }
    return out.length ? out.join(", ") : fallback
}

/** Compares two shadow strings by their numbers, not their text (Framer may rewrite the format). */
function sameShadow(a: string, b: string): boolean {
    const nums = (s: string) => (s.match(/-?\d*\.?\d+/g) || []).map(Number)
    const x = nums(a)
    const y = nums(b)
    return x.length === y.length && x.every((n, i) => Math.abs(n - y[i]) < 0.011)
}

// ------------------------------------------------------------------ colours

type Rgb = [number, number, number]

/** Reads a CSS colour the way the page shows it (tokens with light and dark values included). */
function readColor(probe: HTMLElement, value: string, fallback: string): Rgb {
    probe.style.color = ""
    probe.style.color = value
    if (!probe.style.color) probe.style.color = fallback
    const cs = getComputedStyle(probe).color
    const nums = (cs.match(/-?\d*\.?\d+/g) || []).map(Number)
    if (/^color\(/.test(cs) && nums.length >= 3) return [nums[0] * 255, nums[1] * 255, nums[2] * 255].map((n) => clamp(Math.round(n), 0, 255)) as Rgb
    if (nums.length >= 3) return [nums[0], nums[1], nums[2]].map((n) => clamp(Math.round(n), 0, 255)) as Rgb
    return [128, 128, 128]
}

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
const WHITE: Rgb = [255, 255, 255]
const BLACK: Rgb = [0, 0, 0]

function paletteOf(s1: Rgb, s2: Rgb, s3: Rgb, dark: boolean): Rgb[] {
    return dark ? [mix(s1, BLACK, 0.94), mix(s1, BLACK, 0.72), s1, s2, mix(s3, BLACK, 0.7), mix(s3, BLACK, 0.92)] : [mix(s1, WHITE, 0.88), mix(s1, WHITE, 0.62), s1, s2, s3, mix(s3, WHITE, 0.82)]
}

/** Gradient shown until the painting is ready and in the static export, from the same six steps. */
function fallbackGradient(c: string[], dark: boolean): string {
    const [a, b, d] = c
    const stops = dark
        ? [`color-mix(in srgb, ${a} 6%, black)`, `color-mix(in srgb, ${a} 28%, black)`, a, b, `color-mix(in srgb, ${d} 30%, black)`, `color-mix(in srgb, ${d} 8%, black)`]
        : [`color-mix(in srgb, ${a} 12%, white)`, `color-mix(in srgb, ${a} 38%, white)`, a, b, d, `color-mix(in srgb, ${d} 18%, white)`]
    return `linear-gradient(115deg, ${stops[0]} 0%, ${stops[1]} 24%, ${stops[2]} 44%, ${stops[3]} 60%, ${stops[4]} 80%, ${stops[5]} 100%)`
}

// ------------------------------------------------------------------ painted shimmer (adapted, MIT, see header)

function makeFbm(seed: number): (x: number, y: number, oct: number) => number {
    const r = rng(seed)
    const perm = new Uint8Array(512)
    const grad = new Float32Array(512)
    const p: number[] = []
    for (let i = 0; i < 256; i++) p.push(i)
    for (let i = 255; i > 0; i--) {
        const j = Math.floor(r() * (i + 1))
        const t = p[i]
        p[i] = p[j]
        p[j] = t
    }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255]
    for (let i = 0; i < 256; i++) {
        const a = r() * Math.PI * 2
        grad[i * 2] = Math.cos(a)
        grad[i * 2 + 1] = Math.sin(a)
    }
    const noise = (x: number, y: number) => {
        const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, X = xi & 255, Y = yi & 255
        const a = perm[X + perm[Y]] * 2, b = perm[X + 1 + perm[Y]] * 2, c = perm[X + perm[Y + 1]] * 2, d = perm[X + 1 + perm[Y + 1]] * 2
        const n00 = grad[a] * fx + grad[a + 1] * fy, n10 = grad[b] * (fx - 1) + grad[b + 1] * fy
        const n01 = grad[c] * fx + grad[c + 1] * (fy - 1), n11 = grad[d] * (fx - 1) + grad[d + 1] * (fy - 1)
        const uu = fx * fx * fx * (fx * (fx * 6 - 15) + 10), vv = fy * fy * fy * (fy * (fy * 6 - 15) + 10)
        return n00 + uu * (n10 - n00) + vv * (n01 - n00 + uu * (n11 - n01 - n10 + n00))
    }
    return (x, y, oct) => {
        let s = 0, amp = 0.5
        for (let k = 0; k < oct; k++) {
            s += amp * noise(x, y)
            const nx = 1.6 * x + 1.2 * y + 7.1
            y = -1.2 * x + 1.6 * y + 3.3
            x = nx
            amp *= 0.5
        }
        return s
    }
}

interface ArtJob { width: number; height: number; pixels: Uint8ClampedArray; step(until: number): boolean }

/** Streaks with domain warping, built row by row so every step can stop inside its time budget. */
function createArtJob(W: number, H: number, colors: Rgb[], seed: number, dark: boolean): ArtJob {
    const w = Math.max(1, Math.round(W)), h = Math.max(1, Math.round(H))
    const stops = colors.map((c, i) => ({ t: i / (colors.length - 1), c }))
    const scale = 0.7, warp = 1.6, gloss = dark ? 0.3 : 0.2
    const fbm = makeFbm(seed * 977 + 13)
    const r = rng(seed + 1)
    const ox = r() * 50, oy = r() * 50, ang = -0.6 + (r() - 0.5) * 0.5, ca = Math.cos(ang), sa = Math.sin(ang)
    const m = Math.min(w, h), lw = Math.ceil(w / 2) + 3, lh = Math.ceil(h / 2) + 3
    const field = new Float32Array(lw * lh), mag = new Float32Array(lw * lh), tmp = new Float32Array(w * lh)
    const up = new Float32Array(w * h), magUp = new Float32Array(w * h), px = new Uint8ClampedArray(w * h * 4)
    const cr = (a: number, b: number, c: number, d: number) => (-a + 9 * b + 9 * c - d) / 16
    let phase = 0, row = 0, lo = 0, inv = 1, gs = 1
    const fieldRow = (y: number) => {
        for (let x = 0; x < lw; x++) {
            const nx = ((x - 1) * 2 - w / 2) / m, ny = ((y - 1) * 2 - h / 2) / m
            let a = (nx * ca - ny * sa) * scale, b = (nx * sa + ny * ca) * scale
            a *= 0.14
            b *= 2.2
            a += ox
            b += oy
            const q1 = fbm(a, b, 3), q2 = fbm(a + 5.2, b + 1.3, 3)
            const r1 = fbm(a + warp * q1 + 1.7, b + warp * q2 + 9.2, 3), r2 = fbm(a + warp * q1 + 8.3, b + warp * q2 + 2.8, 3)
            field[y * lw + x] = fbm(a + warp * r1, b + warp * r2, 4)
            mag[y * lw + x] = Math.sqrt(q1 * q1 + q2 * q2)
        }
    }
    const horizontalRow = (y: number) => {
        const o = y * lw
        for (let x = 0; x < w; x++) {
            const k = (x >> 1) + 1
            tmp[y * w + x] = x & 1 ? cr(field[o + k - 1], field[o + k], field[o + k + 1], field[o + k + 2]) : field[o + k]
        }
    }
    const verticalRow = (y: number) => {
        const k = (y >> 1) + 1
        for (let x = 0; x < w; x++) {
            up[y * w + x] = y & 1 ? cr(tmp[(k - 1) * w + x], tmp[k * w + x], tmp[(k + 1) * w + x], tmp[(k + 2) * w + x]) : tmp[k * w + x]
            const j = (x >> 1) + 1, m0 = mag[k * lw + j], mx = x & 1 ? (m0 + mag[k * lw + j + 1]) / 2 : m0
            const my = y & 1 ? (x & 1 ? (mag[(k + 1) * lw + j] + mag[(k + 1) * lw + j + 1]) / 2 : mag[(k + 1) * lw + j]) : mx
            magUp[y * w + x] = (mx + my) / 2
        }
    }
    const levels = () => {
        const sample: number[] = []
        const st = Math.max(1, Math.floor(up.length / 4096))
        for (let i = 0; i < up.length; i += st) sample.push(up[i])
        sample.sort((a, b) => a - b)
        lo = sample[Math.floor(sample.length * 0.02)]
        inv = 1 / (sample[Math.floor(sample.length * 0.98)] - lo || 1)
        gs = inv * m * 0.012
    }
    const colorRow = (y: number) => {
        const Lx = -0.55, Ly = -0.65, Lz = 0.52
        for (let x = 0; x < w; x++) {
            const i = y * w + x
            let t = (up[i] - lo) * inv
            t = t < 0 ? 0 : t > 1 ? 1 : t
            let s = 1
            while (s < stops.length - 1 && stops[s].t < t) s++
            const A = stops[s - 1], B = stops[s]
            let f = (t - A.t) / (B.t - A.t || 1)
            f = f < 0 ? 0 : f > 1 ? 1 : f
            f = f * f * (3 - 2 * f)
            const dx = (up[x < w - 1 ? i + 1 : i] - up[x > 0 ? i - 1 : i]) * gs, dy = (up[y < h - 1 ? i + w : i] - up[y > 0 ? i - w : i]) * gs
            const nl = (-dx * Lx - dy * Ly + Lz) / Math.sqrt(dx * dx + dy * dy + 1)
            const spec = Math.pow(nl > 0 ? nl : 0, 24) * gloss * 255
            const ripple = 1 + 0.035 * Math.sin(t * 150 + magUp[i] * 24), shade = (0.82 + 0.28 * nl) * ripple
            for (let c = 0; c < 3; c++) px[i * 4 + c] = (A.c[c] + (B.c[c] - A.c[c]) * f) * shade + spec
            px[i * 4 + 3] = 255
        }
    }
    return {
        width: w,
        height: h,
        pixels: px,
        step(until) {
            while (phase < 5 && performance.now() < until) {
                if (phase === 0) {
                    fieldRow(row++)
                    if (row >= lh) { phase = 1; row = 0 }
                } else if (phase === 1) {
                    horizontalRow(row++)
                    if (row >= lh) { phase = 2; row = 0 }
                } else if (phase === 2) {
                    verticalRow(row++)
                    if (row >= h) { phase = 3; row = 0 }
                } else if (phase === 3) {
                    levels()
                    phase = 4
                } else {
                    colorRow(row++)
                    if (row >= h) phase = 5
                }
            }
            return phase === 5
        },
    }
}

type Paint = { job: ArtJob; done: (c: HTMLCanvasElement | null, error?: string) => void; cancelled: boolean }
const paintQueue: Paint[] = []
let pumping = false
const paintCache = new Map<string, HTMLCanvasElement>()
const PAINT_CACHE_MAX = 8

/** Runs the queued paintings at most 7 ms per frame, one after another. */
function pump() {
    if (pumping) return
    pumping = true
    const tick = () => {
        const until = performance.now() + 7
        while (paintQueue.length && performance.now() < until) {
            const item = paintQueue[0]
            if (item.cancelled) {
                paintQueue.shift()
                continue
            }
            if (!item.job.step(until)) break
            paintQueue.shift()
            const c = document.createElement("canvas")
            c.width = item.job.width
            c.height = item.job.height
            const ctx = c.getContext("2d")
            if (!ctx) item.done(null, "no 2D context")
            else {
                const img = ctx.createImageData(c.width, c.height)
                img.data.set(item.job.pixels)
                ctx.putImageData(img, 0, 0)
                item.done(c)
            }
        }
        if (paintQueue.length) requestAnimationFrame(tick)
        else pumping = false
    }
    requestAnimationFrame(tick)
}

let grainUrl: string | null | undefined

/** One small noise tile per page for the grain on the glass; null when the browser cannot draw it. */
function grainTile(): string | null {
    if (grainUrl !== undefined) return grainUrl
    const c = document.createElement("canvas")
    c.width = 128
    c.height = 128
    const ctx = c.getContext("2d")
    if (!ctx) return (grainUrl = null)
    const img = ctx.createImageData(128, 128)
    const r = rng(7)
    for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.round(r() * 255)
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v
        img.data[i + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
    try {
        grainUrl = c.toDataURL("image/png")
    } catch {
        // a locked canvas (SecurityError) or any other failure: glass without grain, the editor names it
        grainUrl = null
    }
    return grainUrl
}

// ------------------------------------------------------------------ page-wide coordination

/** One folder open at a time: every open folder registers its close function here. */
const openFolders = new Set<() => void>()

/** Folders whose first visible moment falls into the same frame assemble one after another, left to right. */
type Reveal = { left: number; run: () => void; timer: number; cancelled: boolean }
let revealBatch: Reveal[] = []
let revealFrame = 0
function flushReveals() {
    revealFrame = 0
    const batch = revealBatch.sort((a, b) => a.left - b.left)
    revealBatch = []
    batch.forEach((r, i) => {
        if (!r.cancelled) r.timer = window.setTimeout(r.run, i * 140)
    })
}
/** Queues one folder; the returned function takes it out again (unmount). */
function queueReveal(left: number, run: () => void): () => void {
    const item: Reveal = { left, run, timer: 0, cancelled: false }
    if (!revealBatch.length) revealFrame = requestAnimationFrame(flushReveals)
    revealBatch.push(item)
    return () => {
        item.cancelled = true
        window.clearTimeout(item.timer)
        revealBatch = revealBatch.filter((r) => r !== item)
        if (!revealBatch.length && revealFrame) {
            cancelAnimationFrame(revealFrame)
            revealFrame = 0
        }
    }
}

// ------------------------------------------------------------------ stylesheet
// One constant, no props in it. It holds none of the characters React escapes in the server render
// (ampersand, angle brackets, quotes): no child combinator, attribute selectors without quotes, no content.
// Checked by check-css.mjs.

const CSS = `
.gf-root{position:relative;width:100%;container:gf / inline-size;pointer-events:none;-webkit-tap-highlight-color:transparent;--gf-ease:cubic-bezier(.2,.8,.2,1);--gf-spring:cubic-bezier(.34,1.36,.5,1);--gf-px:0;--gf-py:0;--gf-lift:4;--gf-stack:5;--gf-step:0;--gf-spread:0;--gf-fan:0;--gf-drop:0;--gf-squash:1;--gf-ink:#141416;--gf-ring:#1d1b18;--gf-ring2:#ffffff;--gf-surface:#e7e2da;--gf-paper:#f7f4ee;--gf-tint:linear-gradient(180deg,rgba(255,255,255,.16) 0%,rgba(255,255,255,.5) 42%,rgba(252,251,249,.93) 100%);--gf-grain-o:.07;--gf-spec-o:.9;--gf-rim-o:1;--gf-bevel-o:.16;--gf-brim:rgba(255,255,255,.45);--gf-contact:rgba(40,32,24,.22)}
.gf-root[data-tone=dark]{--gf-ink:#f5f3ef;--gf-ring:#f1ede7;--gf-ring2:#141416;--gf-surface:#2a2724;--gf-paper:#22201e;--gf-tint:linear-gradient(180deg,rgba(20,18,16,.18) 0%,rgba(16,14,12,.62) 46%,rgba(10,9,8,.94) 100%);--gf-grain-o:.09;--gf-spec-o:.16;--gf-rim-o:.55;--gf-bevel-o:.07;--gf-brim:rgba(255,255,255,.14);--gf-contact:rgba(0,0,0,.6)}
.gf-root *{box-sizing:border-box}
.gf-root:not([data-open])[data-peek],.gf-root:not([data-open]):has(.gf-hit:focus-visible){--gf-lift:-12;--gf-stack:5;--gf-step:18;--gf-drop:3;--gf-squash:.985}
.gf-root[data-open]{--gf-lift:-104;--gf-stack:32;--gf-step:0;--gf-spread:36;--gf-fan:4.2;--gf-drop:10;--gf-squash:.955}
.gf-root[data-open][data-few]{--gf-stack:36}
.gf-root .gf-box{position:relative;width:100%;aspect-ratio:404 / 448;--gf-u:calc(100cqw / 404)}
.gf-root .gf-tilt{position:absolute;left:calc(var(--gf-u) * 26);top:calc(var(--gf-u) * 154);width:calc(var(--gf-u) * 352);height:calc(var(--gf-u) * 264);transform:rotate(calc(var(--gf-px) * .6deg)) translate(calc(var(--gf-px) * var(--gf-u) * 3),calc(var(--gf-py) * var(--gf-u) * 2));transition:transform .9s var(--gf-ease)}
.gf-root .gf-shadow{position:absolute;z-index:1;left:calc(var(--gf-u) * 24);right:calc(var(--gf-u) * 24);bottom:calc(var(--gf-u) * 2);height:calc(var(--gf-u) * 54);border-radius:calc(var(--gf-u) * 40);box-shadow:var(--gf-shadow);translate:calc(var(--gf-px) * var(--gf-u) * -8) 0;transition:translate .9s var(--gf-ease),opacity .9s var(--gf-ease)}
.gf-root .gf-contact{position:absolute;z-index:1;left:calc(var(--gf-u) * 30);right:calc(var(--gf-u) * 30);bottom:calc(var(--gf-u) * -2);height:calc(var(--gf-u) * 10);border-radius:50%;background:var(--gf-contact);filter:blur(calc(var(--gf-u) * 6));transition:opacity .9s var(--gf-ease)}
.gf-root[data-noshadow] .gf-contact{display:none}
.gf-root .gf-back{position:absolute;z-index:2;inset:0;overflow:hidden;clip-path:var(--gf-back-clip);background:linear-gradient(180deg,#f3f2f0 0%,#e4e2de 100%);transition:translate 1s var(--gf-ease),opacity .9s var(--gf-ease)}
.gf-root[data-tone=dark] .gf-back{background:linear-gradient(180deg,#2a2826 0%,#121110 100%)}
.gf-root .gf-fill{position:absolute;inset:0;background-image:var(--gf-fill)}
.gf-root .gf-art{position:absolute;left:calc(var(--gf-u) * -12);top:calc(var(--gf-u) * -12);width:calc(100% + var(--gf-u) * 24);height:calc(100% + var(--gf-u) * 24);max-width:none;opacity:0;filter:blur(14px) saturate(.6);transform:translate(calc(var(--gf-px) * var(--gf-u) * -7),calc(var(--gf-py) * var(--gf-u) * -6)) scale(1.02);transition:transform 1.1s var(--gf-ease),opacity 1.2s var(--gf-ease),filter 1.2s var(--gf-ease)}
.gf-root .gf-art[data-ready]{opacity:1;filter:none}
.gf-root[data-instant] .gf-art{transition:transform 1.1s var(--gf-ease)}
.gf-root .gf-sheen{position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.22) 0%,rgba(255,255,255,0) 22%),radial-gradient(120% 80% at 80% 0%,rgba(255,255,255,.16),rgba(255,255,255,0) 60%)}
.gf-root .gf-rim{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;fill:none;pointer-events:none}
.gf-root .gf-brimsvg{z-index:3;transition:translate 1s var(--gf-ease),opacity .9s var(--gf-ease)}
.gf-root .gf-brimsvg path{stroke:var(--gf-brim);stroke-width:1}
.gf-root .gf-hit{all:unset;position:absolute;z-index:11;left:0;width:100%;top:calc(var(--gf-u) * -40);height:calc(var(--gf-u) * 307);border-radius:0 0 var(--gf-rad) var(--gf-rad);cursor:pointer;pointer-events:auto;touch-action:pan-y pinch-zoom;transform-origin:50% 100%}
.gf-root[data-open] .gf-hit{top:calc(var(--gf-u) * 70);height:calc(var(--gf-u) * 194);border-radius:0;clip-path:var(--gf-front-clip);transform:translateY(calc(var(--gf-drop) * var(--gf-u))) scaleY(var(--gf-squash));transition:transform .8s var(--gf-spring)}
.gf-root[data-empty] .gf-hit{cursor:default}
.gf-root .gf-list{position:absolute;z-index:5;inset:0;margin:0;padding:0;list-style:none;pointer-events:none;clip-path:inset(-200% -200% calc(var(--gf-u) * 10) -200%)}
.gf-root .gf-slot{position:absolute;left:calc(var(--gf-u) * 40);top:calc(var(--gf-u) * 92);width:calc(var(--gf-u) * 272);height:calc(var(--gf-u) * 180);--gf-dty:calc(var(--gf-depth) * 35ms);--gf-dtx:var(--gf-dty);--gf-dr:var(--gf-dty);--gf-din:calc(.18s + var(--gf-depth) * 90ms);translate:0 calc((var(--gf-lift) - var(--gf-depth) * var(--gf-stack) - var(--gf-peek, 0) - var(--gf-hov, 0)) * var(--gf-u));transition:translate .75s var(--gf-spring) var(--gf-dty),transform .9s var(--gf-ease) var(--gf-din),opacity .9s var(--gf-ease) var(--gf-din)}
.gf-root[data-peek] .gf-slot{--gf-dty:0ms;--gf-dtx:0ms;--gf-dr:0ms}
.gf-root[data-open] .gf-slot{--gf-dty:calc(var(--gf-depth) * 45ms);--gf-dtx:calc(var(--gf-depth) * 45ms + 110ms);--gf-dr:calc(var(--gf-depth) * 45ms + 190ms)}
.gf-root[data-settled] .gf-slot{--gf-dty:0ms;--gf-dtx:0ms;--gf-dr:0ms}
.gf-root .gf-card{all:unset;box-sizing:border-box;position:absolute;inset:0;display:block;border-radius:var(--gf-crad);overflow:hidden;background:#1a1a1d;color:#fff;box-shadow:inset 0 0 0 .5px rgba(255,255,255,.22),0 0 0 .5px rgba(0,0,0,.12),0 calc(var(--gf-u) * 10) calc(var(--gf-u) * 26) calc(var(--gf-u) * -8) rgba(20,16,12,.32);transform-origin:50% 100%;translate:calc((var(--gf-jx) + var(--gf-ord) * var(--gf-step) + var(--gf-pos) * var(--gf-spread)) * var(--gf-u)) 0;rotate:calc((var(--gf-jr) + var(--gf-pos) * var(--gf-fan)) * 1deg);transition:translate .8s var(--gf-spring) var(--gf-dtx),rotate .65s var(--gf-ease) var(--gf-dr),box-shadow .4s var(--gf-ease)}
.gf-root[data-open] .gf-card{pointer-events:auto}
.gf-root[data-open] a.gf-card{cursor:pointer}
.gf-root .gf-card[data-noimg]{background:var(--gf-surface);color:var(--gf-ink)}
.gf-root .gf-card-doc{background:var(--gf-paper);color:var(--gf-ink)}
.gf-root .gf-photo{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;transition:transform 1.1s var(--gf-ease)}
.gf-root .gf-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.62) 0%,rgba(0,0,0,0.619) 5%,rgba(0,0,0,0.613) 10%,rgba(0,0,0,0.599) 15%,rgba(0,0,0,0.572) 20%,rgba(0,0,0,0.531) 25%,rgba(0,0,0,0.475) 30%,rgba(0,0,0,0.406) 35%,rgba(0,0,0,0.326) 40%,rgba(0,0,0,0.24) 45%,rgba(0,0,0,0.154) 50%,rgba(0,0,0,0.078) 55%,rgba(0,0,0,0.022) 60%,rgba(0,0,0,0) 65%)}
.gf-root .gf-card[data-noimg] .gf-shade{display:none}
.gf-root .gf-head{position:absolute;z-index:1;left:calc(var(--gf-u) * 14);right:calc(var(--gf-u) * 14);top:calc(var(--gf-u) * 11);display:flex;align-items:baseline;justify-content:space-between;gap:calc(var(--gf-u) * 10);white-space:nowrap}
.gf-root .gf-name{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;font-size:var(--gf-ns);line-height:1.2}
.gf-root .gf-meta{flex:0 3 auto;min-width:min(4.5em,35%);max-width:50%;overflow:hidden;text-overflow:ellipsis;font-size:var(--gf-ms);line-height:1.2;letter-spacing:.01em;font-variant-numeric:tabular-nums;color:color-mix(in srgb,currentColor 86%,transparent);transition:opacity .25s var(--gf-ease)}
.gf-root .gf-doc{position:absolute;inset:0;display:grid;grid-template-columns:57% 43%}
.gf-root .gf-paper{position:relative;min-width:0;padding:calc(var(--gf-u) * 10) calc(var(--gf-u) * 12) calc(var(--gf-u) * 12) calc(var(--gf-u) * 14);display:flex;flex-direction:column;justify-content:flex-start;gap:calc(var(--gf-u) * 3)}
.gf-root .gf-dtitle{font-size:var(--gf-dts);line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gf-root .gf-foot{display:block;font-size:var(--gf-fs);line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.64}
.gf-root .gf-dimg{position:relative;overflow:hidden;background:var(--gf-surface)}
.gf-root .gf-fold{position:absolute;top:0;bottom:0;left:57%;width:1.5%;background:linear-gradient(90deg,rgba(0,0,0,.1),rgba(0,0,0,0))}
.gf-root .gf-edge-in{position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 0 .5px rgba(0,0,0,.08);pointer-events:none}
.gf-root .gf-go{position:absolute;z-index:2;right:calc(var(--gf-u) * 8);top:calc(var(--gf-u) * 7);width:calc(var(--gf-u) * 26);height:calc(var(--gf-u) * 26);border-radius:50%;display:grid;place-items:center;color:#16140f;background:rgba(255,255,255,.86);box-shadow:0 4px 12px -4px rgba(0,0,0,.35);opacity:0;transform:translateY(calc(var(--gf-u) * 4)) scale(.9);transition:opacity .3s var(--gf-ease),transform .45s var(--gf-spring)}
.gf-root .gf-go svg{width:54%;height:54%;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.gf-root[data-open] .gf-slot:has(.gf-card:focus-visible){--gf-hov:18}
.gf-root[data-open] .gf-card:focus-visible .gf-go{opacity:1;transform:none}
.gf-root[data-open] .gf-card:focus-visible .gf-meta{opacity:0}
.gf-root .gf-card:focus-visible{box-shadow:0 0 0 2px var(--gf-ring2),0 0 0 4px var(--gf-ring),0 calc(var(--gf-u) * 24) calc(var(--gf-u) * 44) calc(var(--gf-u) * -14) rgba(20,16,12,.46)}
@media (hover: hover){
.gf-root[data-open] .gf-slot:has(a.gf-card:hover){--gf-hov:18}
.gf-root[data-open] a.gf-card:hover{box-shadow:inset 0 0 0 .5px rgba(255,255,255,.28),0 0 0 .5px rgba(0,0,0,.12),0 calc(var(--gf-u) * 24) calc(var(--gf-u) * 44) calc(var(--gf-u) * -14) rgba(20,16,12,.46)}
.gf-root[data-open] a.gf-card:hover .gf-photo{transform:scale(1.035)}
.gf-root[data-open] a.gf-card:hover .gf-go{opacity:1;transform:none}
.gf-root[data-open] a.gf-card:hover .gf-meta{opacity:0}
.gf-root .gf-key:hover{transform:translateY(calc(var(--gf-u) * -2))}
}
.gf-root .gf-front{position:absolute;z-index:10;left:0;top:calc(var(--gf-u) * 70);width:100%;height:calc(var(--gf-u) * 194);pointer-events:none;border-radius:var(--gf-rad);clip-path:var(--gf-front-clip);-webkit-mask-size:100% 100%;mask-size:100% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-backdrop-filter:blur(calc(var(--gf-u) * 22)) saturate(1.5);backdrop-filter:blur(calc(var(--gf-u) * 22)) saturate(1.5);transform-origin:50% 100%;transform:translateY(calc(var(--gf-drop) * var(--gf-u))) scaleY(var(--gf-squash));transition:transform .8s var(--gf-spring),translate 1s var(--gf-ease) .42s,opacity 1s var(--gf-ease) .42s}
.gf-root .gf-tint{position:absolute;inset:0;background:var(--gf-tint)}
.gf-root .gf-grain{position:absolute;inset:0;opacity:var(--gf-grain-o);mix-blend-mode:overlay;background-size:calc(var(--gf-u) * 128) auto}
.gf-root[data-tone=dark] .gf-grain{mix-blend-mode:soft-light}
.gf-root .gf-spec{position:absolute;inset:0;background:radial-gradient(calc(var(--gf-u) * 260) calc(var(--gf-u) * 200) at calc(50% + var(--gf-px) * 46%) calc(30% + var(--gf-py) * 40%),rgba(255,255,255,.5),rgba(255,255,255,0) 70%);mix-blend-mode:soft-light;opacity:var(--gf-spec-o)}
.gf-root[data-tone=dark] .gf-spec{mix-blend-mode:screen}
.gf-root .gf-frim{opacity:var(--gf-rim-o)}
.gf-root .gf-edge{stroke-width:2.4;transition:stroke-width .3s var(--gf-ease)}
.gf-root .gf-bevel{stroke:#ffffff;stroke-width:7;opacity:var(--gf-bevel-o)}
.gf-root:has(.gf-hit:focus-visible) .gf-edge{stroke-width:5}
.gf-root .gf-label{position:absolute;z-index:2;left:calc(var(--gf-u) * 28);bottom:calc(var(--gf-u) * 30);max-width:64%;display:flex;flex-direction:column;gap:calc(var(--gf-u) * 5);color:var(--gf-label, var(--gf-ink))}
.gf-root .gf-title{font-size:var(--gf-ts);line-height:var(--gf-tlh);letter-spacing:var(--gf-tls);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:.3em;margin-bottom:-.3em;text-underline-offset:.22em;text-decoration-thickness:1.5px}
.gf-root:has(.gf-hit:focus-visible) .gf-title{text-decoration-line:underline}
.gf-root .gf-caption{font-size:var(--gf-cs);line-height:var(--gf-clh);letter-spacing:var(--gf-cls);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums;color:color-mix(in srgb,var(--gf-label, var(--gf-ink)) 64%,transparent)}
.gf-root .gf-key{position:absolute;z-index:12;right:calc(var(--gf-u) * 22);bottom:calc(var(--gf-u) * 22);width:calc(var(--gf-u) * 54);height:calc(var(--gf-u) * 54);border-radius:50%;display:grid;place-items:center;pointer-events:auto;cursor:pointer;color:#1d1b18;text-decoration:none;background:radial-gradient(120% 120% at 32% 18%,rgba(255,255,255,.98) 0%,rgba(244,241,236,.82) 48%,rgba(222,216,208,.78) 100%);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:inset 0 1px 0 #ffffff,inset 0 -3px 7px rgba(60,44,30,.1),0 0 0 .5px rgba(40,30,20,.2),0 calc(var(--gf-u) * 12) calc(var(--gf-u) * 22) calc(var(--gf-u) * -10) rgba(40,30,20,.42),0 2px 4px -2px rgba(40,30,20,.25);transition:transform .35s var(--gf-spring),box-shadow .35s var(--gf-ease),opacity .6s var(--gf-ease) .7s,scale .7s var(--gf-spring) .7s}
.gf-root[data-tone=dark] .gf-key{color:#f3efe9;background:radial-gradient(120% 120% at 32% 18%,rgba(255,255,255,.26) 0%,rgba(255,255,255,.1) 48%,rgba(255,255,255,.05) 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.3),inset 0 -3px 7px rgba(0,0,0,.35),0 0 0 .5px rgba(255,255,255,.16),0 calc(var(--gf-u) * 12) calc(var(--gf-u) * 22) calc(var(--gf-u) * -10) rgba(0,0,0,.8)}
.gf-root .gf-key:active{transform:scale(.94);transition-duration:.12s}
.gf-root .gf-key:focus-visible{outline:2px solid var(--gf-ring);outline-offset:3px;box-shadow:0 0 0 7px var(--gf-ring2)}
.gf-root .gf-key svg{width:37%;height:37%;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}
.gf-root .gf-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.gf-root .gf-probe{position:absolute;width:0;height:0;overflow:hidden}
.gf-root .gf-hints{position:absolute;z-index:20;left:0;top:0;max-width:100%;padding:6px 8px;border-radius:6px;background:rgba(20,20,22,.86);color:#fff;font-size:11px;line-height:1.35}
.gf-root[data-pre] .gf-back,.gf-root[data-pre] .gf-brimsvg{translate:0 calc(var(--gf-u) * 22);opacity:0;transition:none}
.gf-root[data-pre] .gf-slot{transform:translateY(calc(var(--gf-u) * -110));opacity:0;transition:none}
.gf-root[data-pre] .gf-front{translate:0 calc(var(--gf-u) * 22);opacity:0;transition:none}
.gf-root[data-pre] .gf-key{opacity:0;scale:.6;transition:none}
.gf-root[data-pre] .gf-shadow,.gf-root[data-pre] .gf-contact{opacity:0;transition:none}
@supports not (clip-path: shape(from 0 0, line to 1px 0, close)){
.gf-root .gf-back{clip-path:inset(0 round var(--gf-rad))}
.gf-root .gf-front{clip-path:inset(0 round var(--gf-rad));box-shadow:inset 0 0 0 1px rgba(255,255,255,.6);-webkit-mask-image:none !important;mask-image:none !important}
.gf-root[data-open] .gf-hit{clip-path:inset(0 round var(--gf-rad))}
.gf-root .gf-rim{display:none}
}
@media (prefers-reduced-motion: reduce){
.gf-root *{transition:none !important;animation:none !important}
.gf-root .gf-tilt{transform:none}
}
`

// ------------------------------------------------------------------ icons

const ArrowIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M7 17L17 7M9 7h8v8" />
    </svg>
)
const DownIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 5v13M6.5 12.5L12 18l5.5-5.5" />
    </svg>
)

// ------------------------------------------------------------------ card image with time limit (FP-4, FP-12)

function CardImage({ img, sizes, className, near, report, where, onFail }: { img: { src: string; srcSet?: string }; sizes: string; className: string; near: boolean; report: (i: Issue) => void; where: string; onFail: () => void }) {
    const [state, setState] = useState<"wait" | "ok" | "fail">("wait")
    const stateRef = useRef(state)
    stateRef.current = state
    const reportRef = useRef(report)
    reportRef.current = report
    const failRef = useRef(onFail)
    failRef.current = onFail
    const src = img.src
    useEffect(() => {
        if (!near || state !== "wait") return
        const t = window.setTimeout(() => {
            if (stateRef.current !== "wait") return
            setState("fail")
            reportRef.current({ kind: "slow", where, src })
            failRef.current()
        }, LOAD_MS)
        return () => window.clearTimeout(t)
    }, [near, src, where, state])
    if (!near || state === "fail") return null
    return (
        <img
            className={className}
            alt=""
            decoding="async"
            draggable={false}
            sizes={sizes}
            srcSet={img.srcSet}
            src={img.src}
            onLoad={() => {
                if (stateRef.current === "wait") setState("ok")
            }}
            onError={() => {
                if (stateRef.current !== "wait") return
                setState("fail")
                reportRef.current({ kind: "broken", where, src })
                failRef.current()
            }}
        />
    )
}

// ------------------------------------------------------------------ component

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 404
 * @framerIntrinsicHeight 448
 * @framerDisableUnlink
 */
export default function MilkGlassFolder(props: Props) {
    const {
        title: titleProp = DEFAULT_TITLE,
        caption: captionProp = "4 projects",
        link: linkProp = "",
        source = "items",
        items = DEMO_ITEMS,
        button,
        colors,
        fonts,
        look,
        motion,
        onOpen,
        onClose,
        style,
    } = props
    const title = str(titleProp)
    const caption = str(captionProp)
    const tone = colors?.tone === "dark" ? "dark" : "light"
    const dark = tone === "dark"
    const shimmer = [str(colors?.shimmer1, SHIMMER[0]) || SHIMMER[0], str(colors?.shimmer2, SHIMMER[1]) || SHIMMER[1], str(colors?.shimmer3, SHIMMER[2]) || SHIMMER[2]]
    const textColor = str(colors?.text)
    const hoverOn = motion?.hover !== false
    const entranceOn = motion?.entrance !== false
    const hint = str(motion?.hint, "Arrow keys preview the cards.")
    const label = str(button?.label, "View all") || "View all"
    const icon = button?.icon === "download" ? "download" : "arrow"
    const folderR = clamp(firstPx(look?.folder, 20), 0, 40)
    const cardR = clamp(firstPx(look?.cards, 15), 0, 30)

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer()
    const isExport = isStatic && !isCanvas
    const live = !isStatic

    const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const listId = `gf${uid}l`
    const hintId = `gf${uid}h`
    const rimId = `gf${uid}r`

    // ---------------------------------------------------------------- cards
    const [issues, setIssues] = useState<Issue[]>([])
    const report = useCallback((i: Issue) => {
        setIssues((list) => (list.some((x) => x.kind === i.kind && x.where === i.where && x.src === i.src) ? list : [...list, i]))
    }, [])
    const [failed, setFailed] = useState<Record<string, boolean>>({})
    // the page's own origin, only after mounting (the server does not know it)
    const [origin, setOrigin] = useState("")
    useEffect(() => {
        setOrigin(typeof location !== "undefined" ? location.origin : "")
    }, [])

    const cmsKey = source === "cms" ? JSON.stringify([props.image1, props.image2, props.image3, props.image4, props.card1, props.card2, props.card3, props.card4]) : ""
    const itemsKey = source === "cms" ? "" : JSON.stringify(Array.isArray(items) ? items.slice(0, 4) : [])
    const rawLink = str(linkProp).trim()
    const linkTarget = safeHref(rawLink)
    const { cards, problems } = useMemo(() => {
        const list: Card[] = []
        const found: Issue[] = []
        const target = (raw: string, where: string): { href: string; external: boolean } => {
            const href = safeHref(raw)
            if (raw.trim() && !href) found.push({ kind: "target", where })
            return { href, external: !!href && isExternal(href) }
        }
        if (rawLink && !linkTarget) found.push({ kind: "target", where: "Link" })
        if (cmsKey) {
            const [i1, i2, i3, i4, c1, c2, c3, c4] = JSON.parse(cmsKey) as [ImageValue, ImageValue, ImageValue, ImageValue, unknown, unknown, unknown, unknown]
            const imgs = [i1, i2, i3, i4]
            const names = [c1, c2, c3, c4]
            imgs.forEach((v, i) => {
                const img = imageOf(v, origin)
                const name = str(names[i]).trim()
                // a card needs an image or a name; a name without an image shows the calm surface
                if (img === null && !name) return
                if (img === "origin") found.push({ kind: "origin", where: `Image ${i + 1}` })
                list.push({ key: `c${i}`, where: `Image ${i + 1}`, kind: "image", title: name, meta: "", byline: "", img: img === "origin" ? null : img, href: linkTarget, external: !!linkTarget && isExternal(linkTarget), download: false })
            })
        } else {
            const arr = JSON.parse(itemsKey) as Item[]
            arr.forEach((it, i) => {
                const kind: ItemType = it?.type === "document" ? "document" : "image"
                const name = str(it?.title)
                let img = imageOf(it?.image, origin)
                if (img === null && DEMO[i] && DEMO[i].title === name) img = DEMO[i].img
                if (img === "origin") found.push({ kind: "origin", where: `Item ${i + 1}` })
                const file = kind === "document" ? str(it?.file) : ""
                let href = ""
                let external = false
                let download = false
                if (file) {
                    if (allowedUrl(file, origin)) {
                        href = file
                        external = true
                        download = true
                    } else found.push({ kind: "origin", where: `Item ${i + 1} file` })
                }
                if (!href) {
                    const t = target(str(it?.link), `Item ${i + 1}`)
                    href = t.href
                    external = t.external
                }
                list.push({ key: `i${i}`, where: `Item ${i + 1}`, kind, title: name, meta: str(it?.meta), byline: kind === "document" ? str(it?.byline) : "", img: img === "origin" ? null : img, href, external, download })
            })
        }
        return { cards: list.slice(0, 4), problems: found }
    }, [cmsKey, itemsKey, rawLink, linkTarget, origin])
    const n = cards.length
    const empty = n === 0

    // ---------------------------------------------------------------- refs and state
    const rootRef = useRef<HTMLDivElement>(null)
    const tiltRef = useRef<HTMLDivElement>(null)
    const hitRef = useRef<HTMLButtonElement>(null)
    const listRef = useRef<HTMLUListElement>(null)
    const artRef = useRef<HTMLCanvasElement>(null)
    const grainRef = useRef<HTMLDivElement>(null)
    const probeRef = useRef<HTMLSpanElement>(null)
    const liveRef = useRef<HTMLSpanElement>(null)
    const slotRefs = useRef<(HTMLLIElement | null)[]>([])
    const [openState, setOpenState] = useState(false)
    const open = isCanvas ? motion?.canvas === "open" : openState
    const openRef = useRef(open)
    openRef.current = open
    const [near, setNear] = useState(!live)
    const events = useRef({ onOpen, onClose })
    events.current = { onOpen, onClose }

    // peek: the edges show and one card rises; set on the DOM directly, it changes with every pointer move
    const peekIdx = useRef(-1)
    const peek = useCallback((idx: number) => {
        if (idx === peekIdx.current) return
        peekIdx.current = idx
        slotRefs.current.forEach((el, i) => {
            if (!el) return
            if (i === idx) el.style.setProperty("--gf-peek", String(PEEK))
            else el.style.removeProperty("--gf-peek")
        })
    }, [])
    const setPeek = useCallback((on: boolean) => {
        const root = rootRef.current
        if (!root) return
        if (on) root.setAttribute("data-peek", "")
        else {
            root.removeAttribute("data-peek")
            peek(-1)
        }
    }, [peek])

    // a second click right after opening (double click, double tap) neither closes nor follows a card
    const openedAt = useRef(0)
    const setOpen = useCallback((v: boolean, focusBack = false) => {
        if (openRef.current === v) return
        openRef.current = v
        setOpenState(v)
        const root = rootRef.current
        if (v) {
            openedAt.current = performance.now()
            peek(-1)
            events.current.onOpen?.()
        } else {
            const list = listRef.current
            const hadFocus = !!(list && document.activeElement && list.contains(document.activeElement))
            if (focusBack || hadFocus) hitRef.current?.focus({ preventScroll: true })
            events.current.onClose?.()
        }
        root?.removeAttribute("data-settled")
    }, [peek])

    // one folder open at a time, settle the delays, listen for clicks elsewhere while open
    useEffect(() => {
        if (!live || !openState) return
        const close = () => setOpen(false)
        openFolders.forEach((f) => f())
        openFolders.add(close)
        const root = rootRef.current
        const settle = window.setTimeout(() => root?.setAttribute("data-settled", ""), 1100)
        const onDown = (e: PointerEvent) => {
            if (!root || (e.target instanceof Node && root.contains(e.target))) return
            // right after opening the button shrinks to the glass: a second press inside the box is not "elsewhere"
            if (performance.now() - openedAt.current < 400) {
                const r = root.getBoundingClientRect()
                if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) return
            }
            setOpen(false)
        }
        // Escape on the document: Safari does not focus a clicked button, so keys may not reach the folder
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Escape" || e.defaultPrevented) return
            const active = document.activeElement
            const inside = !!(root && active && root.contains(active))
            // focus in another control of the page (search field, dialog): leave its Escape alone
            if (!inside && active && active !== document.body) return
            e.preventDefault()
            setOpen(false, inside)
        }
        document.addEventListener("pointerdown", onDown)
        document.addEventListener("keydown", onKey)
        return () => {
            openFolders.delete(close)
            window.clearTimeout(settle)
            document.removeEventListener("pointerdown", onDown)
            document.removeEventListener("keydown", onKey)
        }
    }, [live, openState, setOpen])

    // pointer, touch and keys (never in the editor or the export)
    useEffect(() => {
        const root = rootRef.current
        const hit = hitRef.current
        const tilt = tiltRef.current
        if (!live || !root || !hit || !tilt) return
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
        let raf = 0
        let tx = 0
        let ty = 0
        let lastX = 0
        let hoverT = 0
        let dropT = 0
        let down: { x: number; y: number } | null = null
        let dragged = false
        let lastType = ""
        const write = () => {
            raf = 0
            root.style.setProperty("--gf-px", tx.toFixed(3))
            root.style.setProperty("--gf-py", ty.toFixed(3))
        }
        const cardAt = (x: number) => {
            const b = tilt.getBoundingClientRect()
            return clamp(Math.floor(((x - b.left) / (b.width || 1)) * n), 0, Math.max(0, n - 1))
        }
        const onEnter = (e: PointerEvent) => {
            if (e.pointerType === "touch" || openRef.current || !hoverOn || n === 0) return
            lastX = e.clientX
            window.clearTimeout(hoverT)
            hoverT = window.setTimeout(() => {
                if (openRef.current) return
                setPeek(true)
                peek(cardAt(lastX))
            }, HOVER_DELAY)
        }
        const onMove = (e: PointerEvent) => {
            if (e.pointerType === "touch") {
                if (!down || openRef.current || n === 0) return
                const dx = e.clientX - down.x
                if (!dragged && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - down.y)) {
                    dragged = true
                    window.clearTimeout(dropT)
                    setPeek(true)
                }
                if (dragged) peek(cardAt(e.clientX))
                return
            }
            lastX = e.clientX
            if (!reduced) {
                const b = root.getBoundingClientRect()
                tx = ((e.clientX - b.left) / (b.width || 1)) * 2 - 1
                ty = ((e.clientY - b.top) / (b.height || 1)) * 2 - 1
                if (!raf) raf = requestAnimationFrame(write)
            }
            if (!openRef.current && root.hasAttribute("data-peek")) peek(cardAt(e.clientX))
        }
        const onLeave = (e: PointerEvent) => {
            if (e.pointerType === "touch") return
            window.clearTimeout(hoverT)
            tx = 0
            ty = 0
            if (!raf) raf = requestAnimationFrame(write)
            if (!(hit === document.activeElement && hit.matches(":focus-visible"))) setPeek(false)
        }
        const onDown = (e: PointerEvent) => {
            dragged = false
            lastType = e.pointerType
            down = e.pointerType === "touch" ? { x: e.clientX, y: e.clientY } : null
        }
        // also on pointercancel (second finger, system gesture): the swiped cards drop after the pause
        const onUp = () => {
            down = null
            if (dragged) dropT = window.setTimeout(() => setPeek(false), 1400)
        }
        const onClick = (e: MouseEvent) => {
            if (dragged) {
                dragged = false
                e.preventDefault()
                return
            }
            if (n === 0) return
            if (openRef.current && performance.now() - openedAt.current < 400) return
            window.clearTimeout(hoverT)
            setOpen(!openRef.current)
            // closed with the mouse while still over the folder: the hover state comes back at once
            if (!openRef.current && hoverOn && e.detail > 0 && lastType === "mouse") {
                setPeek(true)
                peek(cardAt(e.clientX))
            }
        }
        const onHitKey = (e: KeyboardEvent) => {
            if (openRef.current || n === 0) return
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault()
                const d = e.key === "ArrowRight" ? 1 : -1
                const next = peekIdx.current < 0 ? (d > 0 ? 0 : n - 1) : clamp(peekIdx.current + d, 0, n - 1)
                setPeek(true)
                peek(next)
                const c = cards[next]
                if (liveRef.current && c) liveRef.current.textContent = [c.title, c.meta].filter(Boolean).join(", ")
            } else if (e.key === "Escape" && root.hasAttribute("data-peek")) {
                e.preventDefault()
                setPeek(false)
            }
        }
        const onBlur = () => {
            if (!openRef.current && !root.matches(":hover")) setPeek(false)
        }
        root.addEventListener("pointerenter", onEnter)
        root.addEventListener("pointermove", onMove)
        root.addEventListener("pointerleave", onLeave)
        hit.addEventListener("pointerdown", onDown)
        hit.addEventListener("pointerup", onUp)
        hit.addEventListener("pointercancel", onUp)
        hit.addEventListener("click", onClick)
        hit.addEventListener("keydown", onHitKey)
        hit.addEventListener("blur", onBlur)
        return () => {
            root.removeEventListener("pointerenter", onEnter)
            root.removeEventListener("pointermove", onMove)
            root.removeEventListener("pointerleave", onLeave)
            hit.removeEventListener("pointerdown", onDown)
            hit.removeEventListener("pointerup", onUp)
            hit.removeEventListener("pointercancel", onUp)
            hit.removeEventListener("click", onClick)
            hit.removeEventListener("keydown", onHitKey)
            hit.removeEventListener("blur", onBlur)
            window.clearTimeout(hoverT)
            window.clearTimeout(dropT)
            cancelAnimationFrame(raf)
        }
    }, [live, n, hoverOn, cards, peek, setPeek, setOpen])

    // close cleanly when the folder goes away or loses its cards
    useEffect(() => {
        if (empty && openRef.current) setOpen(false)
    }, [empty, setOpen])

    // near the screen: load images, paint the back; first sighting decides about the entrance
    useEffect(() => {
        const root = rootRef.current
        if (!live || !root) return
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
        let first = true
        let waiting = false
        let cancelReveal: (() => void) | null = null
        const nearObs = new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) {
                setNear(true)
                nearObs.disconnect()
            }
        }, { rootMargin: "600px" })
        nearObs.observe(root)
        const seeObs = new IntersectionObserver((entries) => {
            const e = entries[entries.length - 1]
            if (!e) return
            if (first) {
                first = false
                if (!e.isIntersecting && entranceOn && !reduced) {
                    root.setAttribute("data-pre", "")
                    waiting = true
                } else {
                    seeObs.disconnect()
                    return
                }
            }
            if (waiting && e.intersectionRatio >= 0.25) {
                waiting = false
                seeObs.disconnect()
                cancelReveal = queueReveal(e.boundingClientRect.left, () => root.removeAttribute("data-pre"))
            }
        }, { threshold: [0, 0.25] })
        seeObs.observe(root)
        return () => {
            nearObs.disconnect()
            seeObs.disconnect()
            cancelReveal?.()
            root.removeAttribute("data-pre")
        }
    }, [live, entranceOn])

    // grain on the glass, one tile per page
    useEffect(() => {
        const el = grainRef.current
        if (!el || isExport) return
        const url = grainTile()
        if (url) el.style.backgroundImage = `url(${url})`
        else report({ kind: "paint", where: "Grain" })
    }, [isExport, report])

    // the painted shimmer of the back panel
    const shimmerKey = shimmer.join("|")
    useEffect(() => {
        const canvas = artRef.current
        const probe = probeRef.current
        if (isExport || !near || !canvas || !probe) return
        const [c1, c2, c3] = shimmerKey.split("|")
        const colorsRgb = paletteOf(readColor(probe, c1, SHIMMER[0]), readColor(probe, c2, SHIMMER[1]), readColor(probe, c3, SHIMMER[2]), dark)
        const seed = (hashString(title || DEFAULT_TITLE) % 97) + 1
        let job: Paint | null = null
        let size = 0
        const paint = () => {
            const dpr = Math.min(1.5, Math.max(1, window.devicePixelRatio || 1))
            // capped: the painting is soft, a larger bitmap only costs memory
            const k = Math.min(dpr, 900 / Math.max(1, canvas.clientWidth))
            const w = Math.round(canvas.clientWidth * k)
            const h = Math.round(canvas.clientHeight * k)
            if (w < 2 || h < 2) return
            size = canvas.clientWidth
            const key = [colorsRgb.map((c) => c.map(Math.round).join(",")).join(";"), seed, w, h, dark].join("/")
            const draw = (src: HTMLCanvasElement) => {
                canvas.width = src.width
                canvas.height = src.height
                const ctx = canvas.getContext("2d")
                if (!ctx) {
                    report({ kind: "paint", where: "Back" })
                    return
                }
                ctx.drawImage(src, 0, 0)
                canvas.setAttribute("data-ready", "")
            }
            if (job) job.cancelled = true
            const cached = paintCache.get(key)
            if (cached) {
                draw(cached)
                return
            }
            if (job) job.cancelled = true
            const item: Paint = {
                job: createArtJob(w, h, colorsRgb, seed, dark),
                cancelled: false,
                done: (c, error) => {
                    // release the job and its pixel buffers as soon as it is done
                    if (job === item) job = null
                    if (item.cancelled) return
                    if (!c) {
                        report({ kind: "paint", where: `Back: ${error || "unknown"}` })
                        return
                    }
                    paintCache.set(key, c)
                    if (paintCache.size > PAINT_CACHE_MAX) paintCache.delete(paintCache.keys().next().value as string)
                    draw(c)
                },
            }
            job = item
            paintQueue.push(item)
            pump()
        }
        paint()
        let ro: ResizeObserver | null = null
        if (!isCanvas && typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => {
                const w = canvas.clientWidth
                if (size > 0 && Math.abs(w - size) / size >= 0.25) paint()
            })
            ro.observe(canvas)
        }
        return () => {
            if (job) job.cancelled = true
            ro?.disconnect()
        }
    }, [isExport, isCanvas, near, shimmerKey, dark, title, report])

    // ---------------------------------------------------------------- styles
    const backSegments = useMemo(() => backSegs(folderR), [folderR])
    const frontSegments = useMemo(() => frontSegs(folderR), [folderR])
    // The blur behind the glass follows a mask in the same shape: some renderers (Framer's canvas, Safari) clip
    // backdrop-filter only by border-radius or a mask, not by clip-path: shape(), and let the blur stand out square.
    const frontMask = useMemo((): CSSProperties => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="352" height="194" viewBox="0 0 352 194" preserveAspectRatio="none"><path d="${svgPath(frontSegments)}" fill="#000"/></svg>`
        const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
        return { WebkitMaskImage: url, maskImage: url }
    }, [frontSegments])
    const titleFont = fonts?.title
    const textFont = fonts?.text
    const t = fontPx(titleFont, TITLE_SIZE)
    const x = fontPx(textFont, TEXT_SIZE)
    const boxStyle = {
        "--gf-back-clip": cssShape(backSegments),
        "--gf-front-clip": cssShape(frontSegments),
        "--gf-rad": u(folderR),
        "--gf-crad": u(cardR),
        "--gf-shadow": scaledShadow(look?.shadow, dark),
        "--gf-fill": fallbackGradient(shimmer, dark),
        "--gf-ts": scaled(t),
        "--gf-tlh": scaledLength(titleFont?.lineHeight, "1.1"),
        "--gf-tls": scaledLength(titleFont?.letterSpacing, "-0.015em"),
        "--gf-dts": scaled((t * 17) / 19),
        "--gf-ns": scaled(x),
        "--gf-cs": scaled((x * 12.5) / 13),
        "--gf-clh": scaledLength(textFont?.lineHeight, "1.25"),
        "--gf-cls": scaledLength(textFont?.letterSpacing, "0.005em"),
        "--gf-ms": scaled((x * 11) / 13),
        "--gf-fs": scaled((x * 9.5) / 13),
    } as CSSProperties
    const titleFace: CSSProperties = { fontFamily: titleFont?.fontFamily || SANS, fontWeight: titleFont?.fontWeight ?? 500, fontStyle: titleFont?.fontStyle }
    const textFace: CSSProperties = { fontFamily: textFont?.fontFamily || SANS, fontWeight: textFont?.fontWeight ?? 500, fontStyle: textFont?.fontStyle }
    // the steps of the approved look: card names a little heavier, caption, meta and byline a step lighter than Text
    const textWeight = weightOf(textFont)
    const nameWeight: CSSProperties = { fontWeight: textWeight + 60 }
    const lightWeight: CSSProperties = { fontWeight: Math.max(100, textWeight - 100) }
    const rootStyle: CSSProperties = { ...style, ...(textColor ? ({ "--gf-label": textColor } as CSSProperties) : null), fontFamily: SANS }

    const name = [title || "Folder", caption].filter(Boolean).join(", ")
    const current = new Set(cards.map((c) => c.img?.src).filter(Boolean))
    const allIssues = [...(empty ? [{ kind: "empty", where: source === "cms" ? "CMS" : "Items" } as Issue] : []), ...problems, ...issues.filter((i) => !i.src || current.has(i.src))]
    const hints = isCanvas ? [...new Set(allIssues.map(issueText))] : []

    const failKey = (c: Card) => `${c.key}|${c.img?.src ?? ""}`
    const markFailed = (key: string) => setFailed((f) => (f[key] ? f : { ...f, [key]: true }))

    const cardNodes: ReactNode[] = cards.map((c, i) => {
        const depth = n - 1 - i
        const r = rng(hashString(c.title) + i)
        const slotStyle = {
            "--gf-depth": depth,
            "--gf-ord": round(i - (n - 1) / 2),
            "--gf-pos": round(n <= 1 ? 0 : (i / (n - 1)) * 2 - 1),
            "--gf-jx": round((r() - 0.5) * 10),
            "--gf-jr": round((r() - 0.5) * 3.2),
            zIndex: i + 1,
        } as CSSProperties
        const noImg = !c.img || failed[failKey(c)]
        const inner =
            c.kind === "document" ? (
                <span className="gf-doc">
                    <span className="gf-paper" style={textFace}>
                        <span className="gf-dtitle" style={titleFace}>
                            {c.title}
                        </span>
                        {c.byline || c.meta ? (
                            <span className="gf-foot" style={lightWeight}>
                                {[c.byline, c.meta].filter(Boolean).join(" \u00b7 ")}
                            </span>
                        ) : null}
                    </span>
                    <span className="gf-dimg">
                        {c.img && !failed[failKey(c)] ? <CardImage key={c.img.src} img={c.img} sizes="(max-width: 600px) 33vw, 170px" className="gf-photo" near={near} report={report} where={c.where} onFail={() => markFailed(failKey(c))} /> : null}
                    </span>
                    <span className="gf-fold" />
                    <span className="gf-edge-in" />
                </span>
            ) : (
                <>
                    {c.img && !failed[failKey(c)] ? <CardImage key={c.img.src} img={c.img} sizes="(max-width: 600px) 75vw, 380px" className="gf-photo" near={near} report={report} where={c.where} onFail={() => markFailed(failKey(c))} /> : null}
                    <span className="gf-shade" />
                    {c.title || c.meta ? (
                        <span className="gf-head" style={textFace}>
                            <span className="gf-name" style={nameWeight}>
                                {c.title}
                            </span>
                            {c.meta ? (
                                <span className="gf-meta" style={lightWeight}>
                                    {c.meta}
                                </span>
                            ) : null}
                        </span>
                    ) : null}
                </>
            )
        const cls = `gf-card${c.kind === "document" ? " gf-card-doc" : ""}`
        const noImgAttr = c.kind === "image" && noImg ? { "data-noimg": "" } : null
        const cardLabel = [c.title, c.byline, c.meta].filter(Boolean).join(", ") || c.img?.alt || `${title || "Folder"}, ${i + 1} of ${n}`
        return (
            <li
                key={c.key}
                className="gf-slot"
                style={slotStyle}
                ref={(el) => {
                    slotRefs.current[i] = el
                }}
            >
                {c.href ? (
                    <a className={cls} {...noImgAttr} href={c.href} target={c.external ? "_blank" : undefined} rel={c.external ? "noopener" : undefined} tabIndex={0} aria-label={cardLabel} draggable={false}>
                        {inner}
                        <span className="gf-go">{c.download ? <DownIcon /> : <ArrowIcon />}</span>
                    </a>
                ) : (
                    <div className={cls} {...noImgAttr}>
                        {inner}
                    </div>
                )}
            </li>
        )
    })

    const onRootClickCapture = (e: ReactMouseEvent) => {
        // closed: fallback for browsers without inert; just opened: the second click of a double click
        const link = e.target instanceof Element ? e.target.closest("a.gf-card") : null
        if (link && listRef.current?.contains(link) && (!open || performance.now() - openedAt.current < 400)) e.preventDefault()
    }
    const onHitKeyDown = (e: ReactKeyboardEvent) => {
        // one toggle per key press: a held Enter repeats keydown, and every repeat would click
        if ((empty || e.repeat) && (e.key === "Enter" || e.key === " ")) e.preventDefault()
    }

    return (
        <div
            ref={rootRef}
            className="gf-root"
            role="group"
            aria-label={title || "Folder"}
            data-tone={tone}
            data-open={open ? "" : undefined}
            data-few={n < 4 ? "" : undefined}
            data-empty={empty ? "" : undefined}
            data-instant={!entranceOn ? "" : undefined}
            data-noshadow={isNoShadow(look?.shadow) ? "" : undefined}
            style={rootStyle}
            onClickCapture={onRootClickCapture}
        >
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="gf-box" style={boxStyle}>
                <div ref={tiltRef} className="gf-tilt">
                    <div className="gf-shadow" aria-hidden="true" />
                    <div className="gf-contact" aria-hidden="true" />
                    <div className="gf-back" aria-hidden="true">
                        <div className="gf-fill" />
                        {isExport ? null : <canvas ref={artRef} className="gf-art" />}
                        <div className="gf-sheen" />
                    </div>
                    <svg className="gf-rim gf-brimsvg" viewBox="0 0 352 264" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                        <path d={svgPath(backSegments)} />
                    </svg>
                    <button
                        ref={hitRef}
                        type="button"
                        className="gf-hit"
                        tabIndex={0}
                        aria-label={name}
                        aria-expanded={empty ? undefined : open}
                        aria-controls={empty ? undefined : listId}
                        aria-disabled={empty ? true : undefined}
                        aria-describedby={empty ? undefined : hintId}
                        onKeyDown={onHitKeyDown}
                    />
                    <ul ref={listRef} id={listId} className="gf-list" aria-label={title || "Folder"} {...(open ? null : INERT)}>
                        {cardNodes}
                    </ul>
                    <div className="gf-front" aria-hidden="true" style={frontMask}>
                        <div className="gf-tint" />
                        <div ref={grainRef} className="gf-grain" />
                        <div className="gf-spec" />
                        <svg className="gf-rim gf-frim" viewBox="0 0 352 194" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                            <defs>
                                <linearGradient id={rimId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
                                    <stop offset="0.35" stopColor="#fff" stopOpacity="0.35" />
                                    <stop offset="1" stopColor="#fff" stopOpacity="0.12" />
                                </linearGradient>
                            </defs>
                            <path className="gf-bevel" d={svgPath(frontSegments)} />
                            <path className="gf-edge" d={svgPath(frontSegments)} stroke={`url(#${rimId})`} />
                        </svg>
                        <div className="gf-label">
                            <span className="gf-title" style={titleFace}>
                                {title}
                            </span>
                            {caption ? (
                                <span className="gf-caption" style={{ ...textFace, ...lightWeight }}>
                                    {caption}
                                </span>
                            ) : null}
                        </div>
                    </div>
                    {linkTarget ? (
                        <a className="gf-key" href={linkTarget} target={isExternal(linkTarget) ? "_blank" : undefined} rel={isExternal(linkTarget) ? "noopener" : undefined} tabIndex={0} aria-label={[label, title].filter(Boolean).join(", ")}>
                            {icon === "download" ? <DownIcon /> : <ArrowIcon />}
                        </a>
                    ) : null}
                </div>
            </div>
            <span id={hintId} className="gf-sr">
                {hint}
            </span>
            <span ref={liveRef} className="gf-sr" aria-live="polite" />
            <span ref={probeRef} className="gf-probe" aria-hidden="true" />
            {hints.length ? (
                <div className="gf-hints" aria-hidden="true">
                    {hints.map((h) => (
                        <div key={h}>{h}</div>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

function issueText(i: Issue): string {
    if (i.kind === "empty") return i.where === "CMS" ? "Bind Image 1 to 4 or Card 1 to 4 to fill the folder." : "Add items to fill the folder."
    if (i.kind === "origin") return `${i.where}: only images and files from Framer or this site load.`
    if (i.kind === "broken") return `${i.where}: the image did not load.`
    if (i.kind === "slow") return `${i.where}: the image took longer than 8 s.`
    if (i.kind === "target") return `${i.where}: this link is not allowed.`
    return `${i.where}: could not be drawn, shown without it.`
}

// ------------------------------------------------------------------ property controls

const isCms = (p: Props) => p.source === "cms"
const notCms = (p: Props) => p.source !== "cms"

addPropertyControls(MilkGlassFolder, {
    // flat: CMS binding
    title: { type: ControlType.String, title: "Title", defaultValue: DEFAULT_TITLE },
    // flat: CMS binding
    caption: { type: ControlType.String, title: "Caption", defaultValue: "4 projects", description: "Free text, also for CMS. Not counted from the cards." },
    // flat: CMS binding
    link: { type: ControlType.Link, title: "Link", description: "Round button and, in CMS mode, every card. Empty hides the button." },
    source: {
        type: ControlType.Enum,
        title: "Source",
        options: ["items", "cms"],
        optionTitles: ["Items", "CMS"],
        displaySegmentedControl: true,
        defaultValue: "items",
        description: "CMS uses the flat fields below, so a Collection List can bind them.",
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 4,
        hidden: isCms,
        control: {
            type: ControlType.Object,
            controls: {
                type: { type: ControlType.Enum, title: "Type", options: ["image", "document"], optionTitles: ["Image", "Document"], displaySegmentedControl: true, defaultValue: "image" },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Project" },
                meta: { type: ControlType.String, title: "Meta", defaultValue: "" },
                byline: { type: ControlType.String, title: "Byline", defaultValue: "", hidden: (p: Item) => p.type !== "document" },
                link: { type: ControlType.Link, title: "Link" },
                file: {
                    type: ControlType.File,
                    title: "File",
                    allowedFileTypes: ["pdf", "zip", "docx", "pptx", "xlsx", "key", "png", "jpg", "mp4"],
                    hidden: (p: Item) => p.type !== "document",
                    description: "Opens instead of the link, in a new tab.",
                },
            },
        },
        defaultValue: DEMO_ITEMS,
    },
    // flat: CMS binding
    image1: { type: ControlType.ResponsiveImage, title: "Image 1", hidden: notCms },
    // flat: CMS binding
    image2: { type: ControlType.ResponsiveImage, title: "Image 2", hidden: notCms },
    // flat: CMS binding
    image3: { type: ControlType.ResponsiveImage, title: "Image 3", hidden: notCms },
    // flat: CMS binding
    image4: { type: ControlType.ResponsiveImage, title: "Image 4", hidden: notCms },
    // flat: CMS binding
    card1: { type: ControlType.String, title: "Card 1", defaultValue: "", hidden: notCms, description: "Name for Image 1. Without an image: a plain card in the folder tone." },
    // flat: CMS binding
    card2: { type: ControlType.String, title: "Card 2", defaultValue: "", hidden: notCms, description: "Name for Image 2." },
    // flat: CMS binding
    card3: { type: ControlType.String, title: "Card 3", defaultValue: "", hidden: notCms, description: "Name for Image 3." },
    // flat: CMS binding
    card4: { type: ControlType.String, title: "Card 4", defaultValue: "", hidden: notCms, description: "Name for Image 4." },
    button: {
        type: ControlType.Object,
        title: "Button",
        controls: {
            icon: { type: ControlType.Enum, title: "Icon", options: ["arrow", "download"], optionTitles: ["Arrow", "Download"], displaySegmentedControl: true, defaultValue: "arrow" },
            label: { type: ControlType.String, title: "Label", defaultValue: "View all", description: "Read by screen readers together with the title, not shown." },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            tone: { type: ControlType.Enum, title: "Tone", options: ["light", "dark"], optionTitles: ["Light", "Dark"], displaySegmentedControl: true, defaultValue: "light" },
            shimmer1: { type: ControlType.Color, title: "Shimmer 1", defaultValue: SHIMMER[0] },
            shimmer2: { type: ControlType.Color, title: "Shimmer 2", defaultValue: SHIMMER[1] },
            shimmer3: { type: ControlType.Color, title: "Shimmer 3", defaultValue: SHIMMER[2] },
            text: { type: ControlType.Color, title: "Text", optional: true, description: "Title and caption. Empty: dark on Light, light on Dark." },
        },
    },
    fonts: {
        type: ControlType.Object,
        title: "Fonts",
        controls: {
            title: { type: ControlType.Font, title: "Title", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: `${TITLE_SIZE}px`, variant: "Medium", lineHeight: "1.1em", letterSpacing: "-0.015em" } },
            text: { type: ControlType.Font, title: "Text", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: `${TEXT_SIZE}px`, variant: "Medium", lineHeight: "1.25em", letterSpacing: "0.005em" } },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            folder: { type: ControlType.BorderRadius, title: "Folder", defaultValue: "20px" },
            cards: { type: ControlType.BorderRadius, title: "Cards", defaultValue: "15px" },
            shadow: { type: ControlType.BoxShadow, title: "Shadow", defaultValue: DEFAULT_SHADOW, description: "Values apply at 404 px width and scale with the folder. On Dark the default turns darker." },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            hover: { type: ControlType.Boolean, title: "Hover", defaultValue: true, enabledTitle: "On", disabledTitle: "Off", description: "Off: no cards rise under the pointer. Keys and swipe still preview." },
            entrance: { type: ControlType.Boolean, title: "Entrance", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
            canvas: { type: ControlType.Enum, title: "Canvas", options: ["closed", "open"], optionTitles: ["Closed", "Open"], displaySegmentedControl: true, defaultValue: "closed", description: "Editor only." },
            hint: { type: ControlType.String, title: "Hint", defaultValue: "Arrow keys preview the cards.", description: "Read by screen readers on the folder button." },
        },
    },
    onOpen: { type: ControlType.EventHandler, title: "On Open" },
    onClose: { type: ControlType.EventHandler, title: "On Close" },
})
