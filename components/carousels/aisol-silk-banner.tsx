// build: R12-1 v1 (Silk Banner — three core only, one continuous cloth strip, runtime canvas print)
// @framerDisableUnlink
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import type { CSSProperties, ReactNode } from "react"
import * as THREE from "three"

/*
 * Aisol Silk Banner
 * One continuous strip of cloth across the page. Words and small image tiles
 * are printed on it and flow endlessly in one direction (the print scrolls
 * through a repeating texture, so there is no seam). Soft waves travel along
 * the strip, and where the pointer passes the cloth is pushed into a bulge
 * that springs back. No drag, no snapping, no arrows: it is a banner, not a
 * carousel. A pause button is always available (WCAG 2.2.2). The default
 * print is painted on a canvas at runtime, so nothing is downloaded.
 * Only nodes inside this component are read or written.
 */

type ColorValue = string | { value?: string }
type ImageValue = { src?: string; srcSet?: string; alt?: string } | string | null | undefined
type ItemKind = "text" | "image"
type Direction = "left" | "right"
type FontKind = "serif" | "sans"
type Separator = "star" | "dot" | "none"
type PausePos = "bottom-right" | "bottom-left" | "top-right" | "top-left"

interface ItemProps {
    type?: ItemKind
    text?: string
    image?: ImageValue
}
interface ClothProps {
    color?: ColorValue
    height?: number
    waves?: number
    count?: number
    sheen?: number
}
interface MotionProps {
    speed?: number
    direction?: Direction
    hoverSlow?: boolean
}
interface TouchProps {
    strength?: number
    radius?: number
}
interface TextProps {
    size?: number
    font?: FontKind
    color?: ColorValue
    separator?: Separator
}
interface PauseProps {
    show?: boolean
    position?: PausePos
}
interface ThemeProps {
    transparent?: boolean
    background?: ColorValue
}

interface Props {
    items?: ItemProps[]
    cloth?: ClothProps
    motion?: MotionProps
    touch?: TouchProps
    text?: TextProps
    pause?: PauseProps
    theme?: ThemeProps
    label?: string
    link?: string
    style?: CSSProperties
}

// ─────────────────────────────────────────────────────────────── defaults
const DEFAULT_ITEMS: ItemProps[] = [
    { type: "text", text: "Slow linen" },
    { type: "image", text: "" },
    { type: "text", text: "Salt air" },
    { type: "image", text: "" },
    { type: "text", text: "Made to last" },
    { type: "image", text: "" },
    { type: "text", text: "Field notes" },
    { type: "text", text: "Autumn 2026" },
    { type: "image", text: "" },
    { type: "text", text: "Halden" },
]
const DEFAULT_CLOTH: Required<ClothProps> = { color: "#A9492B", height: 160, waves: 50, count: 3, sheen: 55 }
const DEFAULT_MOTION: Required<MotionProps> = { speed: 60, direction: "left", hoverSlow: true }
const DEFAULT_TOUCH: Required<TouchProps> = { strength: 60, radius: 160 }
const DEFAULT_TEXT: Required<TextProps> = { size: 100, font: "serif", color: "#FBF1E4", separator: "star" }
const DEFAULT_PAUSE: Required<PauseProps> = { show: true, position: "bottom-right" }
const DEFAULT_THEME: Required<ThemeProps> = { transparent: false, background: "#F1ECE3" }
const DEFAULT_LABEL = "Halden highlights"
const MAX_ITEMS = 24

// Print proportions, as a share of the cloth height (shared by the WebGL print and the DOM strip).
const WORD = 0.4
const TILE_H = 0.56
const TILE_AR = 1.36
const TILE_R = 0.2
const GAP = 0.16
const SEP_D = 0.15
const GAP_NONE = 0.36

const SERIF = `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif`
const SANS = `Inter, "SF Pro Text", -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
const STAR_PATH = "M0 -1Q0 0 1 0Q0 0 0 1Q0 0 -1 0Q0 0 0 -1Z"

// ─────────────────────────────────────────────────────────────── small helpers
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback)
const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback)
const str = (v: unknown, fallback: string) => (typeof v === "string" ? v : fallback)
const tok = (v?: ColorValue): string => (!v ? "" : typeof v === "string" ? v : v.value || "")
const mod = (a: number, n: number) => ((a % n) + n) % n

// Framer colour tokens can arrive as var(--token, fallback). CSS understands them; a 2D canvas needs the fallback.
function plainColor(v: ColorValue | undefined, fallback: string): string {
    let s = tok(v).trim()
    const m = /^var\([^,]+,\s*(.+)\)$/.exec(s)
    if (m) s = m[1].trim()
    return s || fallback
}

// ---------------------------------------------------------------- URL guards (R7)
// R7 URL guards — one shared implementation across the Aisol catalogue (10/3 r2).
// Browsers ignore tabs, newlines and control characters inside a scheme, so the scheme is tested without them.
const SCHEME = /^([a-z][a-z0-9+.-]*):/i
const flatUrl = (s: string) => s.replace(/[\u0000- \u007f]+/g, "")
// http is lifted to https (the published site is https; the browser would upgrade or block it anyway).
const toHttps = (s: string) => "https:" + s.slice(s.indexOf(":") + 1)
// "//host" (protocol-relative) leaves the site without a visible scheme.
const isProtocolRelative = (flat: string) => /^[\\/]{2}/.test(flat)
// user:pass@host — credentials inside a URL are never passed on.
function hasUserInfo(flat: string): boolean {
    const m = /^[a-z][a-z0-9+.-]*:[\\/]*([^\\/?#]*)/i.exec(flat)
    return !!m && m[1].indexOf("@") >= 0
}
// Links: https, http (lifted to https), mailto, tel and same-site paths (/, #, ?, ./).
// javascript:, data:, protocol-relative //host and user:pass@ URLs → "".
function safeHref(raw: unknown): string {
    const href = String(raw || "").trim()
    const flat = flatUrl(href)
    if (isProtocolRelative(flat)) return ""
    const m = SCHEME.exec(flat)
    if (!m) return href
    const scheme = m[1].toLowerCase()
    if (scheme === "mailto" || scheme === "tel") return href
    if ((scheme !== "https" && scheme !== "http") || hasUserInfo(flat)) return ""
    return scheme === "http" ? toHttps(href) : href
}
// Images: https (framerusercontent.com included), http (lifted), data:image/, blob: and same-site paths.
// Protocol-relative //host, user:pass@ URLs and every other scheme → "".
function safeImageUrl(raw: unknown): string {
    const src = String(raw || "").trim()
    const flat = flatUrl(src)
    if (!flat || isProtocolRelative(flat)) return ""
    const m = SCHEME.exec(flat)
    if (!m) return src
    const scheme = m[1].toLowerCase()
    if (scheme === "blob") return src
    if (scheme === "data") return flat.toLowerCase().startsWith("data:image/") ? src : ""
    if ((scheme !== "https" && scheme !== "http") || hasUserInfo(flat)) return ""
    return scheme === "http" ? toHttps(src) : src
}
// srcSet: every candidate URL goes through safeImageUrl (http candidates are lifted to https) and every
// descriptor must be a plain width/density ("640w", "2x"); one bad candidate drops the whole set.
function safeSrcSet(raw: unknown): string {
    const set = String(raw || "").trim()
    if (!set) return ""
    const parts = set.split(/,\s+/)
    let out = ""
    for (let i = 0; i < parts.length; i += 1) {
        const part = parts[i].trim()
        const cut = part.search(/\s/)
        const url = safeImageUrl(cut < 0 ? part : part.slice(0, cut))
        const descriptor = cut < 0 ? "" : part.slice(cut)
        if (!url || !/^(?:\s+\d+(?:\.\d+)?[wx])?$/.test(descriptor)) return ""
        out += (i ? ", " : "") + url + descriptor
    }
    return out
}
function imageOf(v: ImageValue): { src: string; srcSet: string; alt: string } {
    if (!v) return { src: "", srcSet: "", alt: "" }
    if (typeof v === "string") return { src: safeImageUrl(v), srcSet: "", alt: "" }
    return { src: safeImageUrl(v.src || ""), srcSet: safeSrcSet(v.srcSet || ""), alt: v.alt || "" }
}

interface Item {
    kind: ItemKind
    text: string
    src: string
    srcSet: string
    alt: string
    tile: number
}

interface Config {
    items: Item[]
    cloth: string
    clothPlain: string
    height: number
    waves: number
    count: number
    sheen: number
    speed: number
    direction: Direction
    hoverSlow: boolean
    strength: number
    radius: number
    textSize: number
    font: FontKind
    ink: string
    inkPlain: string
    separator: Separator
    showPause: boolean
    pausePos: PausePos
    transparent: boolean
    background: string
    label: string
    link: string
}

function resolveItems(list: ItemProps[]): Item[] {
    const out: Item[] = []
    let tiles = 0
    for (const it of list.slice(0, MAX_ITEMS)) {
        if (!it) continue
        const kind: ItemKind = it.type === "image" ? "image" : "text"
        const text = str(it.text, "")
        if (kind === "text") {
            if (!text.trim()) continue
            out.push({ kind, text: text.trim(), src: "", srcSet: "", alt: "", tile: 0 })
        } else {
            const img = imageOf(it.image)
            out.push({ kind, text: "", src: img.src, srcSet: img.srcSet, alt: img.alt, tile: tiles++ })
        }
    }
    return out
}

function resolve(props: Props): Config {
    const {
        items = DEFAULT_ITEMS,
        cloth = DEFAULT_CLOTH,
        motion = DEFAULT_MOTION,
        touch = DEFAULT_TOUCH,
        text = DEFAULT_TEXT,
        pause = DEFAULT_PAUSE,
        theme = DEFAULT_THEME,
        label = DEFAULT_LABEL,
        link = "",
    } = props
    let list = resolveItems(Array.isArray(items) && items.length ? items : DEFAULT_ITEMS)
    if (!list.length) list = resolveItems(DEFAULT_ITEMS)
    const pos: PausePos[] = ["bottom-right", "bottom-left", "top-right", "top-left"]
    const pp = pause && pos.indexOf(pause.position as PausePos) >= 0 ? (pause.position as PausePos) : DEFAULT_PAUSE.position
    const sep = text && (text.separator === "dot" || text.separator === "none") ? text.separator : "star"
    const clothCss = tok(cloth && cloth.color) || tok(DEFAULT_CLOTH.color)
    const inkCss = tok(text && text.color) || tok(DEFAULT_TEXT.color)
    return {
        items: list,
        cloth: clothCss,
        clothPlain: plainColor(clothCss, tok(DEFAULT_CLOTH.color)),
        height: Math.round(clamp(num(cloth && cloth.height, DEFAULT_CLOTH.height), 60, 400)),
        waves: clamp(num(cloth && cloth.waves, DEFAULT_CLOTH.waves), 0, 100),
        count: clamp(num(cloth && cloth.count, DEFAULT_CLOTH.count), 1, 8),
        sheen: clamp(num(cloth && cloth.sheen, DEFAULT_CLOTH.sheen), 0, 100),
        speed: clamp(num(motion && motion.speed, DEFAULT_MOTION.speed), 0, 400),
        direction: motion && motion.direction === "right" ? "right" : "left",
        hoverSlow: bool(motion && motion.hoverSlow, DEFAULT_MOTION.hoverSlow),
        strength: clamp(num(touch && touch.strength, DEFAULT_TOUCH.strength), 0, 100),
        radius: clamp(num(touch && touch.radius, DEFAULT_TOUCH.radius), 30, 500),
        textSize: clamp(num(text && text.size, DEFAULT_TEXT.size), 80, 130),
        font: text && text.font === "sans" ? "sans" : "serif",
        ink: inkCss,
        inkPlain: plainColor(inkCss, tok(DEFAULT_TEXT.color)),
        separator: sep,
        showPause: bool(pause && pause.show, DEFAULT_PAUSE.show),
        pausePos: pp,
        transparent: bool(theme && theme.transparent, DEFAULT_THEME.transparent),
        background: tok(theme && theme.background) || tok(DEFAULT_THEME.background),
        label: typeof label === "string" && label.trim() ? label : DEFAULT_LABEL,
        link: safeHref(typeof link === "string" ? link.trim() : ""),
    }
}

// Space kept above and below the cloth for waves, the bulge and the soft shadow.
function padFor(h: number): number {
    return Math.round(Math.max(30, h * 0.1875))
}

// A rough period estimate so the flat DOM strip repeats enough before anything is measured.
function estimatePeriod(cfg: Config): number {
    const h = cfg.height
    const fs = h * WORD * (cfg.textSize / 100)
    let w = 0
    for (const it of cfg.items) {
        w += it.kind === "text" ? it.text.length * fs * 0.48 : h * TILE_H * TILE_AR
        w += cfg.separator === "none" ? h * GAP_NONE : h * (GAP * 2 + SEP_D)
    }
    return Math.max(40, w)
}

// ─────────────────────────────────────────────────────────────── tile art (2D canvas, runtime)
type Motif = "sea" | "leaves" | "alpine" | "lagoon"
interface TileTheme {
    motif: Motif
    sky: string[]
}
const TILES: TileTheme[] = [
    { motif: "sea", sky: ["#F8DDBE", "#F4B393", "#E88A73"] },
    { motif: "leaves", sky: ["#2C543F", "#1F3F2E", "#132A1E"] },
    { motif: "alpine", sky: ["#E4ECF1", "#C9D8E3", "#AFC3D3"] },
    { motif: "lagoon", sky: ["#9ADCD2", "#3DA8A3", "#176571"] },
]
const TILE_W = 480
const TILE_PX_H = Math.round(TILE_W / TILE_AR)

type Ctx2D = CanvasRenderingContext2D

function rng(seed: number): () => number {
    let a = seed >>> 0
    return () => {
        a = (a + 0x6d2b79f5) >>> 0
        let t = a
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function vgrad(ctx: Ctx2D, y0: number, y1: number, stops: string[]): CanvasGradient {
    const g = ctx.createLinearGradient(0, y0, 0, y1)
    stops.forEach((c, i) => g.addColorStop(stops.length === 1 ? 0 : i / (stops.length - 1), c))
    return g
}

// rgb given as "r, g, b"
function glow(ctx: Ctx2D, x: number, y: number, r: number, rgb: string, alpha: number) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(${rgb}, ${alpha})`)
    g.addColorStop(0.4, `rgba(${rgb}, ${alpha * 0.35})`)
    g.addColorStop(1, `rgba(${rgb}, 0)`)
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
}

function ridge(ctx: Ctx2D, W: number, H: number, base: number, amp: number, freq: number, phase: number, jag: number, r: () => number) {
    ctx.beginPath()
    ctx.moveTo(0, H)
    const steps = 40
    for (let i = 0; i <= steps; i++) {
        const t = i / steps
        let y = base - amp * (0.55 * Math.sin(t * freq + phase) + 0.3 * Math.sin(t * freq * 2.3 + phase * 1.7) + 0.15 * Math.sin(t * freq * 5.1 + phase * 0.3))
        if (jag > 0) y -= jag * (r() - 0.5) * amp
        ctx.lineTo(t * W, y)
    }
    ctx.lineTo(W, H)
    ctx.closePath()
}

function drawTile(ctx: Ctx2D, W: number, H: number, index: number) {
    const th = TILES[index % TILES.length]
    const r = rng(2027 + index * 7919)
    const m = Math.min(W, H)
    switch (th.motif) {
        case "sea": {
            const hz = H * 0.58
            ctx.fillStyle = vgrad(ctx, 0, hz, th.sky)
            ctx.fillRect(0, 0, W, hz)
            glow(ctx, W * 0.62, hz - H * 0.14, m * 0.6, "255, 233, 201", 0.6)
            ctx.fillStyle = "#FFF3DE"
            ctx.beginPath()
            ctx.arc(W * 0.62, hz - H * 0.14, m * 0.13, 0, Math.PI * 2)
            ctx.fill()
            const sea = ["#5B6F8A", "#4A5F7D", "#3B5070", "#2E4263", "#233553", "#1B2A44"]
            for (let i = 0; i < sea.length; i++) {
                const y = hz + (H - hz) * Math.pow(i / sea.length, 1.35)
                ctx.fillStyle = sea[i]
                ctx.beginPath()
                ctx.moveTo(0, H)
                for (let k = 0; k <= 40; k++) ctx.lineTo((k / 40) * W, y + Math.sin(k * 0.9 + i * 1.7) * (1.5 + i * 1.6))
                ctx.lineTo(W, H)
                ctx.closePath()
                ctx.fill()
            }
            for (let i = 0; i < 60; i++) {
                const t = r()
                const y = hz + 6 + t * t * (H - hz) * 0.8
                const x = W * 0.62 + (r() - 0.5) * W * (0.04 + t * 0.22) * 2
                ctx.fillStyle = `rgba(255, 236, 205, ${0.55 * (1 - t) + 0.08})`
                ctx.fillRect(x, y, m * (0.03 + r() * 0.06) * (1 - t * 0.5), Math.max(1, m * 0.006))
            }
            break
        }
        case "leaves": {
            ctx.fillStyle = vgrad(ctx, 0, H, th.sky)
            ctx.fillRect(0, 0, W, H)
            const greens = ["#2E5A40", "#3B7050", "#4E8960", "#6FA474", "#97C08A", "#355F45"]
            for (let i = 0; i < 30; i++) {
                const x = r() * W
                const y = H * 0.05 + r() * H * 0.9
                const len = m * (0.22 + r() * 0.34)
                ctx.save()
                ctx.translate(x, y)
                ctx.rotate(r() * Math.PI * 2)
                ctx.globalAlpha = 0.72 + r() * 0.28
                ctx.fillStyle = greens[Math.floor(r() * greens.length)]
                ctx.beginPath()
                ctx.moveTo(0, 0)
                ctx.quadraticCurveTo(len * 0.5, -len * 0.28, len, 0)
                ctx.quadraticCurveTo(len * 0.5, len * 0.28, 0, 0)
                ctx.fill()
                ctx.globalAlpha = 0.25
                ctx.strokeStyle = "#D8EBC8"
                ctx.lineWidth = Math.max(1, m * 0.005)
                ctx.beginPath()
                ctx.moveTo(len * 0.05, 0)
                ctx.lineTo(len * 0.92, 0)
                ctx.stroke()
                ctx.restore()
            }
            ctx.globalAlpha = 1
            glow(ctx, W * 0.7, H * 0.25, m * 0.7, "255, 244, 214", 0.28)
            break
        }
        case "alpine": {
            ctx.fillStyle = vgrad(ctx, 0, H * 0.7, th.sky)
            ctx.fillRect(0, 0, W, H)
            glow(ctx, W * 0.28, H * 0.22, m * 0.5, "255, 250, 238", 0.5)
            const cols = ["#B3C4D3", "#93A9BD", "#7189A1", "#506A84", "#344C63", "#1F3246"]
            cols.forEach((c, i) => {
                ridge(ctx, W, H, H * (0.38 + i * 0.1), H * (0.14 - i * 0.01), 5 + i * 1.3, i * 2.3, 0.3, r)
                ctx.fillStyle = c
                ctx.fill()
                const y = H * (0.42 + i * 0.1)
                const g = ctx.createLinearGradient(0, y - H * 0.05, 0, y + H * 0.06)
                g.addColorStop(0, "rgba(238, 243, 247, 0)")
                g.addColorStop(0.6, `rgba(238, 243, 247, ${0.28 - i * 0.03})`)
                g.addColorStop(1, "rgba(238, 243, 247, 0)")
                ctx.fillStyle = g
                ctx.fillRect(0, y - H * 0.05, W, H * 0.11)
            })
            break
        }
        case "lagoon": {
            ctx.fillStyle = vgrad(ctx, 0, H, th.sky)
            ctx.fillRect(0, 0, W, H)
            ctx.lineWidth = Math.max(1, m * 0.006)
            const rings: [number, number, number][] = [
                [0.32, 0.4, 9],
                [0.74, 0.64, 7],
            ]
            for (const [cx, cy, k] of rings) {
                for (let i = 1; i <= k; i++) {
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.22 - i * 0.02})`
                    ctx.beginPath()
                    ctx.ellipse(W * cx, H * cy, m * 0.06 * i, m * 0.022 * i, 0, 0, Math.PI * 2)
                    ctx.stroke()
                }
            }
            ctx.strokeStyle = "rgba(230, 255, 250, 0.1)"
            ctx.lineWidth = Math.max(1, m * 0.004)
            for (let row = 0; row < 14; row++) {
                ctx.beginPath()
                const y0 = H * (0.08 + row * 0.066)
                for (let k = 0; k <= 30; k++) {
                    const x = (k / 30) * W
                    const y = y0 + Math.sin(k * 0.8 + row * 1.3) * m * 0.016
                    if (k === 0) ctx.moveTo(x, y)
                    else ctx.lineTo(x, y)
                }
                ctx.stroke()
            }
            break
        }
    }
    // film grain: breaks up gradient steps
    try {
        const img = ctx.getImageData(0, 0, W, H)
        const d = img.data
        const g = rng(91 + index)
        for (let i = 0; i < d.length; i += 4) {
            const n = (g() + g() - 1) * 8
            d[i] = d[i] + n
            d[i + 1] = d[i + 1] + n
            d[i + 2] = d[i + 2] + n
        }
        ctx.putImageData(img, 0, 0)
    } catch {
        // grain is decoration only
    }
}

interface TileArt {
    canvas: HTMLCanvasElement
    url: string
}
const tileCache = new Map<number, TileArt>()

function getTile(index: number): TileArt | null {
    if (typeof document === "undefined") return null
    const key = index % TILES.length
    const hit = tileCache.get(key)
    if (hit) return hit
    const canvas = document.createElement("canvas")
    canvas.width = TILE_W
    canvas.height = TILE_PX_H
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    drawTile(ctx, TILE_W, TILE_PX_H, key)
    let url = ""
    try {
        url = canvas.toDataURL("image/jpeg", 0.9)
    } catch {
        url = ""
    }
    const art = { canvas, url }
    tileCache.set(key, art)
    return art
}

function tileGradient(index: number): string {
    const th = TILES[index % TILES.length]
    return `linear-gradient(180deg, ${th.sky.join(", ")})`
}

// ─────────────────────────────────────────────────────────────── the printed strip (one period)
interface PrintItem {
    kind: ItemKind
    text: string
    src: string
    tile: number
}
interface PrintSpec {
    items: PrintItem[]
    family: string
    italic: boolean
    ink: string
    cloth: string
    sep: Separator
    scale: number
}

function wordFont(spec: PrintSpec, px: number): string {
    return `${spec.italic ? "italic 400" : "600"} ${px.toFixed(2)}px ${spec.family}`
}

interface Part {
    item: PrintItem | null
    x: number
    w: number
}

// Lays one period out in CSS px of a cloth that is hc tall: item, gap, separator, gap, next item...
function layoutPrint(ctx: Ctx2D, spec: PrintSpec, hc: number): { parts: Part[]; period: number } {
    const fs = hc * WORD * spec.scale
    ctx.font = wordFont(spec, fs)
    const parts: Part[] = []
    let x = 0
    for (const it of spec.items) {
        const w = it.kind === "text" ? ctx.measureText(it.text).width : hc * TILE_H * TILE_AR
        parts.push({ item: it, x, w })
        x += w
        if (spec.sep === "none") x += hc * GAP_NONE
        else {
            x += hc * GAP
            parts.push({ item: null, x, w: hc * SEP_D })
            x += hc * (SEP_D + GAP)
        }
    }
    return { parts, period: Math.max(8, x) }
}

function roundRect(ctx: Ctx2D, x: number, y: number, w: number, h: number, r: number) {
    const rr = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + rr, y)
    ctx.arcTo(x + w, y, x + w, y + h, rr)
    ctx.arcTo(x + w, y + h, x, y + h, rr)
    ctx.arcTo(x, y + h, x, y, rr)
    ctx.arcTo(x, y, x + w, y, rr)
    ctx.closePath()
}

type ImageState = HTMLImageElement | "loading" | "error"

// Paints one period into a canvas. Everything is drawn at x, x - period and x + period so
// glyph overhangs that cross an edge reappear on the other side: the texture repeats seamlessly.
function paintPrint(spec: PrintSpec, hc: number, pxScale: number, maxW: number, images: Map<string, ImageState>): { canvas: HTMLCanvasElement; period: number } | null {
    if (typeof document === "undefined") return null
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    const { parts, period } = layoutPrint(ctx, spec, hc)
    const s = Math.max(0.25, Math.min(pxScale, maxW / period, 4096 / hc))
    const tw = Math.max(2, Math.round(period * s))
    const th = Math.max(2, Math.round(hc * s))
    canvas.width = tw
    canvas.height = th
    ctx.setTransform(tw / period, 0, 0, th / hc, 0, 0)
    ctx.fillStyle = spec.cloth
    ctx.fillRect(-1, -1, period + 2, hc + 2)
    const fs = hc * WORD * spec.scale
    ctx.font = wordFont(spec, fs)
    const capH = ctx.measureText("H").actualBoundingBoxAscent || fs * 0.68
    const base = hc / 2 + capH / 2
    const tileH = hc * TILE_H
    const tileY = (hc - tileH) / 2
    for (const shift of [-period, 0, period]) {
        for (const p of parts) {
            const x = p.x + shift
            if (x > period + 2 || x + p.w < -2 - fs * 0.3) continue
            if (!p.item) {
                const r = p.w / 2
                const cx = x + r
                const cy = hc / 2
                ctx.fillStyle = spec.ink
                ctx.beginPath()
                if (spec.sep === "dot") ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2)
                else {
                    ctx.moveTo(cx, cy - r)
                    ctx.quadraticCurveTo(cx, cy, cx + r, cy)
                    ctx.quadraticCurveTo(cx, cy, cx, cy + r)
                    ctx.quadraticCurveTo(cx, cy, cx - r, cy)
                    ctx.quadraticCurveTo(cx, cy, cx, cy - r)
                }
                ctx.fill()
                continue
            }
            const it = p.item
            if (it.kind === "text") {
                ctx.fillStyle = spec.ink
                ctx.textAlign = "left"
                ctx.textBaseline = "alphabetic"
                ctx.fillText(it.text, x, base)
                continue
            }
            ctx.save()
            roundRect(ctx, x, tileY, p.w, tileH, tileH * TILE_R)
            ctx.clip()
            const st = it.src ? images.get(it.src) : undefined
            let img: CanvasImageSource | null = null
            let iw = 1
            let ih = 1
            if (st && typeof st !== "string") {
                img = st
                iw = st.naturalWidth || 1
                ih = st.naturalHeight || 1
            } else if (!it.src) {
                const art = getTile(it.tile)
                if (art) {
                    img = art.canvas
                    iw = art.canvas.width
                    ih = art.canvas.height
                }
            }
            if (img) {
                const k = Math.max(p.w / iw, tileH / ih)
                const dw = iw * k
                const dh = ih * k
                try {
                    ctx.drawImage(img, x + (p.w - dw) / 2, tileY + (tileH - dh) / 2, dw, dh)
                } catch {
                    // unreadable image: leave the tinted tile
                }
            } else {
                ctx.fillStyle = spec.ink
                ctx.globalAlpha = 0.14
                ctx.fillRect(x, tileY, p.w, tileH)
                ctx.globalAlpha = 1
            }
            ctx.restore()
        }
    }
    return { canvas, period }
}

// ─────────────────────────────────────────────────────────────── shaders
const VERT = /* glsl */ `
uniform vec2 uSize;
uniform float uHc;
uniform float uAmp;
uniform float uAy;
uniform float uK;
uniform float uOmega;
uniform float uDir;
uniform float uTime;
uniform float uBulge;
uniform vec2 uPtr;
uniform float uRad;
uniform float uShadow;
varying vec2 vLocal;
varying vec3 vNrm;
varying float vZ;

// travelling folds: a long swell plus two diagonal creases
float waves(vec2 p) {
    float y = p.y / uHc;
    float ph = uK * p.x + uDir * uOmega * uTime;
    float z = 0.56 * sin(ph);
    z += 0.29 * sin(1.87 * ph + 2.4 * y + 1.3 + uDir * 0.41 * uOmega * uTime);
    z += 0.15 * sin(3.3 * ph - 3.2 * y + 0.6);
    return z * uAmp;
}

float bump(vec2 p) {
    vec2 d = (p - uPtr) / uRad;
    return uBulge * exp(-dot(d, d) * 2.2);
}

float surf(vec2 p) {
    // a smaller push is also a shallower one, so the slope stays cloth-like
    return waves(p) + bump(p) * uHc * 0.62 * clamp(uRad / 200.0, 0.22, 1.0);
}

void main() {
    vec2 local = position.xy * uSize;
    float z = surf(local);
    float e = 1.0;
    float zx = surf(local + vec2(e, 0.0));
    float zy = surf(local + vec2(0.0, e));
    vNrm = normalize(vec3(-(zx - z) / e, -(zy - z) / e, 1.0));
    vLocal = local;
    vZ = z;
    vec2 d = (local - uPtr) / uRad;
    float g = exp(-dot(d, d) * 2.2);
    vec2 push = d * g * uBulge * 22.0;
    float dy = uAy * sin(0.61 * uK * local.x + uDir * 0.8 * uOmega * uTime + 0.9);
    vec3 pos = vec3(local + push + vec2(0.0, dy), z);
    if (uShadow > 0.5) pos = vec3(local.x, local.y + dy - uHc * 0.06, -1.0);
    gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.0);
}
`

const FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform float uPeriod;
uniform float uOffset;
uniform float uW;
uniform float uHc;
uniform float uSheen;
uniform float uShadow;
uniform float uBlur;
varying vec2 vLocal;
varying vec3 vNrm;
varying float vZ;

float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

void main() {
    float hh = uHc * 0.5;
    float d = abs(vLocal.y) - hh;
    float grain = (hash(gl_FragCoord.xy) - 0.5) / 255.0;
    if (uShadow > 0.5) {
        // soft shadow under the strip
        float a = 0.2 * (1.0 - smoothstep(-uBlur * 0.6, uBlur, d));
        a = clamp(a + grain, 0.0, 1.0);
        gl_FragColor = vec4(0.0, 0.0, 0.0, a);
        return;
    }
    // top and bottom edge, anti-aliased from the distance to the hem
    float aa = max(fwidth(d), 0.0001);
    float cov = clamp(0.5 - d / aa, 0.0, 1.0);
    if (cov < 0.004) discard;
    // the print repeats (RepeatWrapping), so u can grow past 1 without a seam
    vec2 uv = vec2((vLocal.x + uW * 0.5 + uOffset) / uPeriod, clamp(0.5 + vLocal.y / uHc, 0.0, 1.0));
    vec3 col = texture2D(uMap, uv).rgb;
    // soft light from the upper left; exactly unchanged where the cloth is flat
    vec3 n = normalize(vNrm);
    vec3 L = normalize(vec3(-0.38, 0.52, 1.0));
    float dif = dot(n, L) - L.z;
    vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
    float nh = max(dot(n, H), 0.0);
    float broad = pow(nh, 10.0) - pow(H.z, 10.0);
    float tight = max(pow(nh, 70.0) - pow(H.z, 70.0), 0.0);
    float depth = clamp(vZ / uHc, -0.5, 0.5);
    col *= max(0.55, 1.0 + dif * 0.95 + depth * 0.2);
    col += vec3(broad * 0.12 + tight * 0.26) * uSheen;
    // a faint rolled hem
    col *= 1.0 - smoothstep(-8.0, 0.0, d) * 0.1;
    col = clamp(col + grain, 0.0, 1.0);
    gl_FragColor = vec4(col * cov, cov);
}
`

// ─────────────────────────────────────────────────────────────── engine (browser only)
const SEG_X = 240
const SEG_Y = 14
const OVERSCAN = 90
const SUB = 1 / 240

interface EngineOpts {
    speed: number
    dir: number
    hoverSlow: boolean
    waves: number
    count: number
    sheen: number
    strength: number
    radius: number
    height: number
    playing: boolean
    flat: boolean
}

interface EngineCallbacks {
    onReady: (ok: boolean) => void
    onPeriod: (p: number) => void
    onRestored: () => void
}

type Uniform<T> = { value: T }

class BannerEngine {
    private renderer: THREE.WebGLRenderer
    private scene = new THREE.Scene()
    private camera = new THREE.PerspectiveCamera(20, 1, 1, 20000)
    private clothGeo = new THREE.PlaneGeometry(1, 1, SEG_X, SEG_Y)
    private shadowGeo = new THREE.PlaneGeometry(1, 1, SEG_X / 2, 4)
    private shared: Record<string, Uniform<number | THREE.Vector2 | THREE.Texture>>
    private clothMat: THREE.ShaderMaterial
    private shadowMat: THREE.ShaderMaterial
    private clothSize = new THREE.Vector2(1, 1)
    private shadowSize = new THREE.Vector2(1, 1)
    private blank: THREE.DataTexture
    private atlas: THREE.CanvasTexture | null = null
    private spec: PrintSpec | null = null
    private specKey = ""
    private atlasKey = ""
    private images = new Map<string, ImageState>()
    // layout (CSS px)
    private W = 1
    private hc = 1
    private period = 1
    // motion state
    private offset = 0
    private time = 0
    private factor = 1
    private bulge = 0
    private bulgeV = 0
    private energy = 0
    private px = 0
    private py = 0
    private rx = 0
    private ry = 0
    private inside = false
    private hover = false
    private lastX = 0
    private lastY = 0
    private hasPtr = false
    // gate
    private visible = false
    private docVisible = true
    private raf = 0
    private last = 0
    private readyFlag = false
    private disposed = false
    private ro: ResizeObserver | null = null
    private io: IntersectionObserver | null = null
    private opts: EngineOpts = { speed: 60, dir: 1, hoverSlow: true, waves: 50, count: 3, sheen: 55, strength: 60, radius: 160, height: 160, playing: true, flat: false }

    constructor(
        private root: HTMLElement,
        private canvas: HTMLCanvasElement,
        gl: WebGL2RenderingContext,
        private cb: EngineCallbacks
    ) {
        this.renderer = new THREE.WebGLRenderer({ canvas, context: gl, antialias: true, alpha: true, premultipliedAlpha: true })
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
        this.renderer.setClearColor(0x000000, 0)
        const px = new Uint8Array([0, 0, 0, 0])
        this.blank = new THREE.DataTexture(px, 1, 1, THREE.RGBAFormat)
        this.blank.needsUpdate = true
        this.shared = {
            uHc: { value: 1 },
            uAmp: { value: 0 },
            uAy: { value: 0 },
            uK: { value: 0.01 },
            uOmega: { value: 1 },
            uDir: { value: 1 },
            uTime: { value: 0 },
            uBulge: { value: 0 },
            uPtr: { value: new THREE.Vector2(0, -9999) },
            uRad: { value: 160 },
            uMap: { value: this.blank },
            uPeriod: { value: 1 },
            uOffset: { value: 0 },
            uW: { value: 1 },
            uSheen: { value: 0.5 },
            uBlur: { value: 20 },
        }
        const make = (shadow: boolean, size: THREE.Vector2) =>
            new THREE.ShaderMaterial({
                vertexShader: VERT,
                fragmentShader: FRAG,
                uniforms: { ...this.shared, uSize: { value: size }, uShadow: { value: shadow ? 1 : 0 } },
                transparent: true,
                premultipliedAlpha: true,
                depthTest: false,
                depthWrite: false,
                side: THREE.DoubleSide,
            })
        this.shadowMat = make(true, this.shadowSize)
        this.clothMat = make(false, this.clothSize)
        const shadow = new THREE.Mesh(this.shadowGeo, this.shadowMat)
        const cloth = new THREE.Mesh(this.clothGeo, this.clothMat)
        shadow.frustumCulled = false
        cloth.frustumCulled = false
        shadow.renderOrder = 0
        cloth.renderOrder = 1
        this.scene.add(shadow)
        this.scene.add(cloth)
        this.docVisible = document.visibilityState !== "hidden"

        root.addEventListener("pointermove", this.onMove)
        root.addEventListener("pointerdown", this.onDown)
        root.addEventListener("pointerenter", this.onEnter)
        root.addEventListener("pointerleave", this.onLeave)
        canvas.addEventListener("webglcontextlost", this.onLost)
        canvas.addEventListener("webglcontextrestored", this.onRestore)
        document.addEventListener("visibilitychange", this.onVisibility)
        this.ro = new ResizeObserver(() => this.relayout())
        this.ro.observe(root)
        this.io = new IntersectionObserver((entries) => {
            const e = entries[entries.length - 1]
            this.visible = !!e && e.isIntersecting
            this.gateChanged()
        })
        this.io.observe(root)
    }

    // ── public API
    setOptions(o: EngineOpts) {
        const prev = this.opts
        this.opts = o
        if (prev.height !== o.height) this.relayout()
        if (!o.playing) this.hover = this.inside = false
        this.invalidate()
    }

    setPrint(spec: PrintSpec, key: string) {
        this.spec = spec
        this.specKey = key
        for (const it of spec.items) if (it.src && !this.images.has(it.src)) this.loadImage(it.src)
        this.rebuild()
    }

    relayout() {
        if (this.disposed) return
        const W = Math.max(1, this.root.clientWidth)
        const H = Math.max(1, this.root.clientHeight)
        this.W = W
        const hc = Math.max(20, Math.min(this.opts.height, H - 20))
        const hcChanged = Math.abs(hc - this.hc) > 0.25
        this.hc = hc
        this.renderer.setSize(W, H, false)
        // camera far enough back that waves read as depth without warping the ends
        const D = Math.max(W, 900) * 1.15
        this.camera.aspect = W / H
        this.camera.fov = (2 * Math.atan(H / 2 / D) * 180) / Math.PI
        this.camera.position.set(0, 0, D)
        this.camera.near = 1
        this.camera.far = D * 3
        this.camera.lookAt(0, 0, 0)
        this.camera.updateProjectionMatrix()
        this.clothSize.set(W + OVERSCAN * 2, hc + 6)
        const blur = Math.max(10, hc * 0.14)
        this.shadowSize.set(W + OVERSCAN * 2, hc + blur * 3)
        this.shared.uBlur.value = blur
        this.shared.uHc.value = hc
        this.shared.uW.value = W
        if (hcChanged) this.rebuild()
        this.invalidate()
    }

    dispose() {
        this.disposed = true
        this.stop()
        this.ro?.disconnect()
        this.io?.disconnect()
        const r = this.root
        r.removeEventListener("pointermove", this.onMove)
        r.removeEventListener("pointerdown", this.onDown)
        r.removeEventListener("pointerenter", this.onEnter)
        r.removeEventListener("pointerleave", this.onLeave)
        this.canvas.removeEventListener("webglcontextlost", this.onLost)
        this.canvas.removeEventListener("webglcontextrestored", this.onRestore)
        document.removeEventListener("visibilitychange", this.onVisibility)
        this.atlas?.dispose()
        this.blank.dispose()
        this.clothMat.dispose()
        this.shadowMat.dispose()
        this.clothGeo.dispose()
        this.shadowGeo.dispose()
        this.renderer.dispose()
        this.images.clear()
    }

    // ── print texture
    private loadImage(url: string) {
        this.images.set(url, "loading")
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.decoding = "async"
        img.onload = () => {
            if (this.disposed) return
            this.images.set(url, img)
            this.rebuild()
        }
        img.onerror = () => {
            // unreadable for WebGL (no CORS or broken): that tile stays a tinted block
            if (this.disposed) return
            this.images.set(url, "error")
        }
        img.src = url
    }

    private rebuild() {
        if (this.disposed || !this.spec || this.hc < 2) return
        const loaded = this.spec.items.map((it) => (it.src ? (typeof this.images.get(it.src) === "string" ? "0" : "1") : "")).join("")
        const key = `${this.specKey}|${this.hc.toFixed(2)}|${loaded}`
        if (key === this.atlasKey && this.atlas) return
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const maxW = Math.min(this.renderer.capabilities.maxTextureSize || 4096, 8192)
        const res = paintPrint(this.spec, this.hc, dpr, maxW, this.images)
        if (!res) return
        this.atlasKey = key
        const t = new THREE.CanvasTexture(res.canvas)
        t.wrapS = THREE.RepeatWrapping
        t.wrapT = THREE.ClampToEdgeWrapping
        t.minFilter = THREE.LinearMipmapLinearFilter
        t.magFilter = THREE.LinearFilter
        t.generateMipmaps = true
        t.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy())
        t.needsUpdate = true
        this.atlas?.dispose()
        this.atlas = t
        this.shared.uMap.value = t
        if (this.period > 1 && Math.abs(res.period - this.period) > 0.01) this.offset = mod((this.offset * res.period) / this.period, res.period)
        this.period = res.period
        this.shared.uPeriod.value = res.period
        this.cb.onPeriod(res.period)
        this.invalidate()
    }

    // ── input: pointer position only (no drag, no wheel, page scrolling untouched)
    private local(e: PointerEvent): { x: number; y: number } {
        const r = this.root.getBoundingClientRect()
        return { x: e.clientX - r.left - r.width / 2, y: r.height / 2 - (e.clientY - r.top) }
    }

    private interactive(): boolean {
        return this.opts.playing && !this.opts.flat && this.opts.strength > 0
    }

    private onMove = (e: PointerEvent) => {
        if (e.pointerType === "mouse" || e.pointerType === "pen") this.hover = true
        if (!this.interactive()) {
            this.invalidate()
            return
        }
        const p = this.local(e)
        const reach = this.hc / 2 + this.opts.radius * 0.5
        this.inside = (e.pointerType === "mouse" || e.pointerType === "pen") && Math.abs(p.y) < reach
        if (!this.hasPtr) {
            this.px = p.x
            this.py = p.y
            this.lastX = p.x
            this.lastY = p.y
            this.hasPtr = true
        }
        const dist = Math.hypot(p.x - this.lastX, p.y - this.lastY)
        this.lastX = p.x
        this.lastY = p.y
        this.rx = p.x
        this.ry = p.y
        if (Math.abs(p.y) < reach) this.energy = Math.min(1.2, this.energy + dist / 140)
        this.invalidate()
    }

    // A tap (or click) pushes the cloth once at that spot.
    private onDown = (e: PointerEvent) => {
        if (!this.interactive()) return
        // pressing the pause button is not a push
        if (e.target instanceof Element && e.target.closest("button")) return
        const p = this.local(e)
        if (Math.abs(p.y) > this.hc / 2 + this.opts.radius * 0.5) return
        this.rx = this.px = this.lastX = p.x
        this.ry = this.py = this.lastY = p.y
        this.hasPtr = true
        this.energy = Math.max(this.energy, 1)
        this.invalidate()
    }

    private onEnter = (e: PointerEvent) => {
        if (e.pointerType === "mouse" || e.pointerType === "pen") this.hover = true
        this.invalidate()
    }

    private onLeave = () => {
        this.hover = false
        this.inside = false
        this.invalidate()
    }

    // ── lifecycle and the single run gate
    private onLost = (e: Event) => {
        e.preventDefault()
        this.stop()
        this.readyFlag = false
        this.cb.onReady(false)
    }

    private onRestore = () => {
        if (!this.disposed) this.cb.onRestored()
    }

    private onVisibility = () => {
        this.docVisible = document.visibilityState !== "hidden"
        this.gateChanged()
    }

    // Everything that can stop drawing, in one place: on screen, tab visible, not disposed.
    private gate(): boolean {
        return !this.disposed && this.visible && this.docVisible
    }

    // Continuous frames only while the banner is playing and motion is allowed.
    private running(): boolean {
        return this.opts.playing && !this.opts.flat
    }

    private gateChanged() {
        if (this.gate()) this.invalidate()
        else this.stop()
    }

    private invalidate() {
        if (this.raf || !this.gate()) return
        this.raf = requestAnimationFrame(this.tick)
    }

    private stop() {
        if (this.raf) cancelAnimationFrame(this.raf)
        this.raf = 0
        this.last = 0
    }

    // ── simulation
    private simulate(dt: number) {
        const o = this.opts
        const slow = o.hoverSlow && this.hover ? 0.3 : 1
        this.factor += (slow - this.factor) * (1 - Math.exp(-dt * 5))
        if (Math.abs(this.factor - slow) < 1e-3) this.factor = slow
        this.time += dt
        if (this.period > 1) this.offset = mod(this.offset + o.dir * o.speed * this.factor * dt, this.period)
        this.energy *= Math.exp(-2.6 * dt)
        if (this.energy < 1e-4) this.energy = 0
        const k = 1 - Math.exp(-dt * 14)
        this.px += (this.rx - this.px) * k
        this.py += (this.ry - this.py) * k
        const target = (o.strength / 100) * Math.min(1.25, (this.inside ? 0.5 : 0) + this.energy)
        const w = 12
        const z = 0.26
        const steps = Math.max(1, Math.ceil(dt / SUB))
        const h = dt / steps
        for (let i = 0; i < steps; i++) {
            this.bulgeV += (w * w * (target - this.bulge) - 2 * z * w * this.bulgeV) * h
            this.bulge += this.bulgeV * h
        }
    }

    private idle(): boolean {
        const o = this.opts
        const slowTarget = o.hoverSlow && this.hover ? 0.3 : 1
        return (
            (o.speed === 0 || this.period <= 1) &&
            o.waves === 0 &&
            !this.inside &&
            this.energy === 0 &&
            Math.abs(this.bulge) < 1e-4 &&
            Math.abs(this.bulgeV) < 1e-3 &&
            this.factor === slowTarget
        )
    }

    private pushUniforms() {
        const o = this.opts
        const u = this.shared
        const hc = this.hc
        const flat = o.flat
        const wv = flat ? 0 : o.waves / 100
        u.uAmp.value = wv * hc * 0.2
        u.uAy.value = wv * hc * 0.055
        const k = (2 * Math.PI * o.count) / Math.max(this.W, 900)
        u.uK.value = k
        u.uOmega.value = k * (70 + o.speed * 0.5)
        u.uDir.value = o.dir
        u.uTime.value = this.time
        u.uBulge.value = flat ? 0 : this.bulge
        ;(u.uPtr.value as THREE.Vector2).set(this.px, this.py)
        u.uRad.value = o.radius
        u.uOffset.value = this.offset
        u.uSheen.value = o.sheen / 100
    }

    private tick = (now: number) => {
        this.raf = 0
        if (!this.gate() || !this.atlas) {
            this.last = 0
            return
        }
        const run = this.running()
        const dt = this.last ? clamp((now - this.last) / 1000, 0.001, 0.05) : 1 / 60
        if (run) this.simulate(dt)
        this.pushUniforms()
        this.renderer.render(this.scene, this.camera)
        if (!this.readyFlag) {
            this.readyFlag = true
            this.cb.onReady(true)
        }
        if (run && !this.idle()) {
            this.last = now
            this.raf = requestAnimationFrame(this.tick)
        } else this.last = 0
    }
}

// ─────────────────────────────────────────────────────────────── React
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

// prefers-reduced-motion is read after mount so the server and the first client render match.
function useReduce(): boolean | null {
    const [reduce, setReduce] = useState<boolean | null>(null)
    useIsoLayoutEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
            setReduce(true)
            return
        }
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setReduce(mq.matches)
        sync()
        mq.addEventListener("change", sync)
        return () => mq.removeEventListener("change", sync)
    }, [])
    return reduce
}

// Built-in tile art for image items without an image. Painted after mount (needs a canvas).
function useTiles(cfg: Config): string[] {
    const [urls, setUrls] = useState<string[]>([])
    const key = cfg.items.map((it) => (it.kind === "image" && !it.src ? String(it.tile) : "-")).join(",")
    useEffect(() => {
        const n = cfg.items.reduce((m, it) => (it.kind === "image" ? Math.max(m, it.tile + 1) : m), 0)
        const out: string[] = []
        for (let i = 0; i < n; i++) {
            const art = getTile(i)
            out.push(art ? art.url : "")
        }
        setUrls(out)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key])
    return urls
}

function printSpec(cfg: Config): PrintSpec {
    return {
        items: cfg.items.map((it) => ({ kind: it.kind, text: it.text, src: it.src, tile: it.tile })),
        family: cfg.font === "sans" ? SANS : SERIF,
        italic: cfg.font !== "sans",
        ink: cfg.inkPlain,
        cloth: cfg.clothPlain,
        sep: cfg.separator,
        scale: cfg.textSize / 100,
    }
}

// Constant stylesheet (no interpolation, no angle brackets, ampersands or quotes).
const CSS = `
.asb-root { position: relative; box-sizing: border-box; width: 100%; height: 100%; min-height: 80px; overflow: hidden; container-type: size; -webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: transparent; --asb-h: min(var(--asb-h0), calc(100cqh - 20px)); --asb-f0: calc(14px * var(--asb-s)); --asb-f1: calc(var(--asb-f0) * 1.125); --asb-f2: calc(var(--asb-f1) * 1.125); --asb-f3: calc(var(--asb-f2) * 1.125); --asb-fm1: calc(var(--asb-f0) / 1.125); --asb-word: calc(var(--asb-h) * 0.4 * var(--asb-s)); }
.asb-root.asb-auto { height: calc(var(--asb-h0) + var(--asb-pad) * 2); min-height: 0; container-type: inline-size; --asb-h: var(--asb-h0); }
.asb-root *, .asb-root *::before, .asb-root *::after { box-sizing: border-box; }
.asb-stage { position: absolute; inset: 0; display: block; color: inherit; text-decoration: none; user-select: none; -webkit-user-select: none; }
.asb-link { position: absolute; inset: 0; z-index: 2; display: block; cursor: pointer; -webkit-user-drag: none; }
.asb-link:focus-visible { outline: 2px solid #17181C; outline-offset: -4px; border-radius: 6px; box-shadow: inset 0 0 0 6px #FFFFFF; }
.asb-dom { position: absolute; inset: 0; pointer-events: none; }
.asb-cloth { position: absolute; left: 0; right: 0; top: 50%; height: var(--asb-h); margin-top: calc(var(--asb-h) / -2); background: linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0) 35%, rgba(0, 0, 0, 0) 70%, rgba(0, 0, 0, 0.08)), var(--asb-cloth); overflow: hidden; box-shadow: 0 calc(var(--asb-h) * 0.06) calc(var(--asb-h) * 0.12) calc(var(--asb-h) * -0.05) rgba(0, 0, 0, 0.3); }
.asb-run { display: flex; height: 100%; width: max-content; align-items: center; will-change: auto; }
.asb-group { display: flex; flex: none; height: 100%; align-items: center; }
.asb-word { flex: none; font-family: var(--asb-family); font-size: var(--asb-word); font-style: italic; font-weight: 400; line-height: 1; white-space: nowrap; color: var(--asb-ink); }
.asb-sans .asb-word { font-style: normal; font-weight: 600; }
.asb-tile { position: relative; flex: none; height: calc(var(--asb-h) * 0.56); width: calc(var(--asb-h) * 0.56 * 1.36); border-radius: calc(var(--asb-h) * 0.56 * 0.2); overflow: hidden; }
.asb-tile img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; -webkit-user-drag: none; }
.asb-sep { flex: none; display: block; width: calc(var(--asb-h) * 0.15); height: calc(var(--asb-h) * 0.15); margin: 0 calc(var(--asb-h) * 0.16); color: var(--asb-ink); }
.asb-sep svg { display: block; width: 100%; height: 100%; }
.asb-gap { flex: none; display: block; width: calc(var(--asb-h) * 0.36); height: 1px; }
.asb-gl { position: absolute; inset: 0; width: 100%; height: 100%; display: block; opacity: 0; pointer-events: none; }
.asb-ready .asb-gl { opacity: 1; }
.asb-ready .asb-dom { visibility: hidden; }
.asb-anim .asb-run { animation: asb-flow var(--asb-dur) linear infinite; }
.asb-anim.asb-rev .asb-run { animation-direction: reverse; }
.asb-hold .asb-run { animation-play-state: paused; }
@keyframes asb-flow { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(calc(var(--asb-p) * -1), 0, 0); } }
.asb-pause { position: absolute; z-index: 3; width: calc(var(--asb-f2) * 2.2); height: calc(var(--asb-f2) * 2.2); padding: 0; border-radius: 50%; border: 1px solid rgba(23, 24, 28, 0.12); background: rgba(255, 255, 255, 0.92); color: #17181C; display: grid; place-items: center; cursor: pointer; font: inherit; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14); }
.asb-live .asb-pause { transition: transform 0.15s ease, background-color 0.15s ease; }
.asb-pause:hover { background: #FFFFFF; transform: scale(1.06); }
.asb-pause:focus-visible { outline: 2px solid #17181C; outline-offset: 2px; }
.asb-pause svg { width: 40%; height: 40%; display: block; }
.asb-bottom-right { right: 14px; bottom: 10px; }
.asb-bottom-left { left: 14px; bottom: 10px; }
.asb-top-right { right: 14px; top: 10px; }
.asb-top-left { left: 14px; top: 10px; }
.asb-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; border: 0; list-style: none; }
@media (prefers-reduced-motion: reduce) {
.asb-live .asb-pause { transition: none; }
}
`

type Mode = "static" | "live" | "fallback"

interface FrameProps {
    cfg: Config
    mode: Mode
    style?: CSSProperties
    tiles: string[]
    copies: number
    ready: boolean
    playing: boolean
    anim: boolean
    hold: boolean
    period: number
    rootRef?: { current: HTMLElement | null }
    groupRef?: { current: HTMLDivElement | null }
    onToggle?: () => void
    children?: ReactNode
}

function heightIsFixed(style?: CSSProperties): boolean {
    const h = style ? style.height : undefined
    return h !== undefined && h !== "auto" && h !== ""
}

function PauseIcon({ playing }: { playing: boolean }) {
    return playing ? (
        <svg viewBox="0 0 16 16" aria-hidden="true">
            <rect x="3.5" y="2.5" width="3" height="11" rx="1" fill="currentColor" />
            <rect x="9.5" y="2.5" width="3" height="11" rx="1" fill="currentColor" />
        </svg>
    ) : (
        <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4.5 2.9v10.2a.8.8 0 0 0 1.2.7l8.2-5.1a.8.8 0 0 0 0-1.4L5.7 2.2a.8.8 0 0 0-1.2.7Z" fill="currentColor" />
        </svg>
    )
}

function Group({ cfg, tiles, groupRef }: { cfg: Config; tiles: string[]; groupRef?: { current: HTMLDivElement | null } }) {
    const out: ReactNode[] = []
    cfg.items.forEach((it, i) => {
        if (it.kind === "text") out.push(<span key={"w" + i} className="asb-word">{it.text}</span>)
        else {
            // R7: guard again at the sink (the generated tiles are data:image/jpeg and pass unchanged)
            const src = safeImageUrl(it.src || tiles[it.tile] || "")
            const srcSet = it.src ? safeSrcSet(it.srcSet) : ""
            out.push(
                <span key={"t" + i} className="asb-tile" style={{ background: it.src ? "rgba(127, 127, 127, 0.2)" : tileGradient(it.tile) }}>
                    {src ? <img src={src} srcSet={srcSet || undefined} sizes={srcSet ? "240px" : undefined} alt="" draggable={false} decoding="async" /> : null}
                </span>
            )
        }
        if (cfg.separator === "none") out.push(<span key={"g" + i} className="asb-gap" />)
        else
            out.push(
                <span key={"s" + i} className="asb-sep">
                    <svg viewBox="-1 -1 2 2">{cfg.separator === "dot" ? <circle cx="0" cy="0" r="0.3" fill="currentColor" /> : <path d={STAR_PATH} fill="currentColor" />}</svg>
                </span>
            )
    })
    return (
        <div ref={groupRef} className="asb-group">
            {out}
        </div>
    )
}

function Frame(f: FrameProps) {
    const { cfg, mode } = f
    const live = mode !== "static"
    const fixed = heightIsFixed(f.style)
    const vars = {
        "--asb-h0": `${cfg.height}px`,
        "--asb-pad": `${padFor(cfg.height)}px`,
        "--asb-s": String(cfg.textSize / 100),
        "--asb-cloth": cfg.cloth,
        "--asb-ink": cfg.ink,
        "--asb-family": cfg.font === "sans" ? SANS : SERIF,
        "--asb-p": `${f.period}px`,
        "--asb-dur": `${cfg.speed > 0 ? (f.period / cfg.speed).toFixed(3) : "1"}s`,
    } as CSSProperties
    const cls =
        "asb-root" +
        (live ? " asb-live" : "") +
        (fixed ? "" : " asb-auto") +
        (cfg.font === "sans" ? " asb-sans" : "") +
        (mode === "fallback" ? " asb-fallback" : "") +
        (f.anim ? " asb-anim" : "") +
        (f.anim && f.hold ? " asb-hold" : "") +
        (cfg.direction === "right" ? " asb-rev" : "") +
        (f.ready && mode === "live" ? " asb-ready" : "")
    const groups: ReactNode[] = []
    for (let c = 0; c < f.copies; c++) groups.push(<Group key={c} cfg={cfg} tiles={f.tiles} groupRef={c === 0 ? f.groupRef : undefined} />)
    const spoken = cfg.items.map((it) => (it.kind === "text" ? it.text : it.alt)).filter((t) => !!t)
    const strip = (
        <div className="asb-dom" aria-hidden="true">
            <div className="asb-cloth">
                <div className="asb-run">{groups}</div>
            </div>
        </div>
    )
    const bg = cfg.transparent ? "transparent" : cfg.background
    return (
        <section ref={f.rootRef} className={cls} role="region" aria-label={cfg.label} style={{ ...f.style, ...vars, color: "#17181C", background: bg }}>
            <style>{CSS}</style>
            {spoken.length ? (
                <ul className="asb-sr">
                    {spoken.map((t, i) => (
                        <li key={i}>{t}</li>
                    ))}
                </ul>
            ) : null}
            <div className="asb-stage">
                {strip}
                {f.children}
                {cfg.link ? <a className="asb-link" href={cfg.link} aria-label={cfg.label} draggable={false} tabIndex={live ? undefined : -1} /> : null}
            </div>
            {cfg.showPause ? (
                <button
                    type="button"
                    className={"asb-pause asb-" + cfg.pausePos}
                    aria-pressed={!f.playing}
                    aria-label="Pause banner"
                    tabIndex={live ? undefined : -1}
                    onClick={f.onToggle}
                >
                    <PauseIcon playing={f.playing} />
                </button>
            ) : null}
        </section>
    )
}

function staticCopies(cfg: Config): number {
    return clamp(Math.ceil(3200 / estimatePeriod(cfg)) + 1, 2, 24)
}

/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 220
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function AisolSilkBanner(props: Props) {
    const isStatic = useIsStaticRenderer()
    const cfg = resolve(props)
    return isStatic ? <StaticBanner cfg={cfg} style={props.style} /> : <LiveBanner cfg={cfg} style={props.style} />
}

// Static renderer: the flat DOM strip only. No WebGL, observers, timers, animation or transitions.
function StaticBanner({ cfg, style }: { cfg: Config; style?: CSSProperties }) {
    const tiles = useTiles(cfg)
    return <Frame cfg={cfg} mode="static" style={style} tiles={tiles} copies={staticCopies(cfg)} ready={false} playing={true} anim={false} hold={true} period={estimatePeriod(cfg)} />
}

function LiveBanner({ cfg, style }: { cfg: Config; style?: CSSProperties }) {
    const reduce = useReduce()
    const tiles = useTiles(cfg)
    const rootRef = useRef<HTMLElement | null>(null)
    const groupRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const [mounted, setMounted] = useState(false)
    const [ready, setReady] = useState(false)
    const [failed, setFailed] = useState(false)
    const [engine, setEngine] = useState<BannerEngine | null>(null)
    const [generation, setGeneration] = useState(0)
    const [userPlay, setUserPlay] = useState<boolean | null>(null)
    const [period, setPeriod] = useState(0)
    const [fb, setFb] = useState({ p: 0, copies: 0 })
    const [inView, setInView] = useState(false)
    const [docVisible, setDocVisible] = useState(true)
    // Reduced motion starts paused; the button can still start it.
    const playing = userPlay !== null ? userPlay : reduce !== true
    const flat = reduce === true && !playing
    const spec = printSpec(cfg)
    const specKey = JSON.stringify(spec)

    useEffect(() => setMounted(true), [])

    // The WebGL engine lives on the canvas mounted after hydration.
    useEffect(() => {
        const canvas = canvasRef.current
        const root = rootRef.current
        if (!mounted || reduce === null || failed || !canvas || !root) return
        let gl: WebGL2RenderingContext | null = null
        try {
            gl = canvas.getContext("webgl2", { alpha: true, antialias: true, premultipliedAlpha: true })
        } catch {
            gl = null
        }
        if (!gl) {
            setFailed(true)
            return
        }
        let made: BannerEngine | null = null
        try {
            made = new BannerEngine(root, canvas, gl, {
                onReady: (ok) => {
                    setReady(ok)
                    if (!ok) setFailed(true)
                },
                onPeriod: (p) => setPeriod(p),
                onRestored: () => {
                    setFailed(false)
                    setGeneration((g) => g + 1)
                },
            })
        } catch {
            made = null
        }
        if (!made) {
            setFailed(true)
            return
        }
        const current = made
        setEngine(current)
        return () => {
            current.dispose()
            setEngine(null)
            setReady(false)
        }
        // options reach the engine through setOptions / setPrint
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted, generation, reduce === null, failed])

    useIsoLayoutEffect(() => {
        if (!engine) return
        engine.setOptions({
            speed: cfg.speed,
            dir: cfg.direction === "right" ? -1 : 1,
            hoverSlow: cfg.hoverSlow,
            waves: cfg.waves,
            count: cfg.count,
            sheen: cfg.sheen,
            strength: cfg.strength,
            radius: cfg.radius,
            height: cfg.height,
            playing,
            flat,
        })
    }, [engine, cfg.speed, cfg.direction, cfg.hoverSlow, cfg.waves, cfg.count, cfg.sheen, cfg.strength, cfg.radius, cfg.height, playing, flat])

    useIsoLayoutEffect(() => {
        if (engine) engine.setPrint(spec, specKey)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [engine, specKey])

    // No WebGL: a CSS marquee of the flat strip, measured from its own first group.
    useEffect(() => {
        const root = rootRef.current
        if (!failed || !root) return
        const measure = () => {
            const g = groupRef.current
            if (!g) return
            const p = g.getBoundingClientRect().width
            const w = root.clientWidth
            setFb({ p, copies: clamp(Math.ceil(w / Math.max(1, p)) + 1, 2, 40) })
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(root)
        const io = new IntersectionObserver((entries) => {
            const e = entries[entries.length - 1]
            setInView(!!e && e.isIntersecting)
        })
        io.observe(root)
        const vis = () => setDocVisible(document.visibilityState !== "hidden")
        vis()
        document.addEventListener("visibilitychange", vis)
        return () => {
            ro.disconnect()
            io.disconnect()
            document.removeEventListener("visibilitychange", vis)
        }
    }, [failed, specKey, cfg.height, cfg.textSize])

    const onToggle = () => setUserPlay(!playing)
    const anim = failed && fb.p > 0 && cfg.speed > 0 && reduce !== null
    const fbRunning = playing && inView && docVisible

    return (
        <Frame
            cfg={cfg}
            mode={failed ? "fallback" : "live"}
            style={style}
            tiles={tiles}
            copies={failed ? Math.max(2, fb.copies) : staticCopies(cfg)}
            ready={ready && !failed}
            playing={playing}
            anim={anim}
            hold={!fbRunning}
            period={failed ? fb.p : period || estimatePeriod(cfg)}
            rootRef={rootRef}
            groupRef={groupRef}
            onToggle={onToggle}
        >
            {mounted && !failed ? <canvas ref={canvasRef} className="asb-gl" aria-hidden="true" /> : null}
        </Frame>
    )
}

const hideText = (p: ItemProps) => p.type === "image"
const hideImage = (p: ItemProps) => p.type !== "image"
const hideBackground = (p: ThemeProps) => !!p.transparent
const hidePausePos = (p: PauseProps) => p.show === false

addPropertyControls(AisolSilkBanner, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: MAX_ITEMS,
        defaultValue: DEFAULT_ITEMS,
        control: {
            type: ControlType.Object,
            controls: {
                type: { type: ControlType.Enum, title: "Type", defaultValue: "text", options: ["text", "image"], optionTitles: ["Text", "Image"], displaySegmentedControl: true },
                text: { type: ControlType.String, title: "Text", defaultValue: "New word", hidden: hideText },
                image: { type: ControlType.ResponsiveImage, title: "Image", description: "Empty image items get built-in art.", hidden: hideImage },
            },
        },
    },
    cloth: {
        type: ControlType.Object,
        title: "Cloth",
        defaultValue: DEFAULT_CLOTH,
        controls: {
            color: { type: ControlType.Color, title: "Color", defaultValue: "#A9492B" },
            height: { type: ControlType.Number, title: "Height", defaultValue: 160, min: 60, max: 400, step: 1, unit: "px" },
            waves: { type: ControlType.Number, title: "Wave Size", defaultValue: 50, min: 0, max: 100, step: 1 },
            count: { type: ControlType.Number, title: "Wave Count", defaultValue: 3, min: 1, max: 8, step: 0.5 },
            sheen: { type: ControlType.Number, title: "Sheen", defaultValue: 55, min: 0, max: 100, step: 1 },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        defaultValue: DEFAULT_MOTION,
        controls: {
            speed: { type: ControlType.Number, title: "Speed", defaultValue: 60, min: 0, max: 400, step: 5, unit: "px/s" },
            direction: { type: ControlType.Enum, title: "Direction", defaultValue: "left", options: ["left", "right"], optionTitles: ["←", "→"], displaySegmentedControl: true },
            hoverSlow: { type: ControlType.Boolean, title: "Slow on Hover", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
        },
    },
    touch: {
        type: ControlType.Object,
        title: "Touch",
        defaultValue: DEFAULT_TOUCH,
        controls: {
            strength: { type: ControlType.Number, title: "Push", defaultValue: 60, min: 0, max: 100, step: 1, description: "How far the pointer pushes the cloth." },
            radius: { type: ControlType.Number, title: "Radius", defaultValue: 160, min: 40, max: 400, step: 5, unit: "px" },
        },
    },
    text: {
        type: ControlType.Object,
        title: "Text",
        defaultValue: DEFAULT_TEXT,
        controls: {
            size: { type: ControlType.Number, title: "Text Size", defaultValue: 100, min: 80, max: 130, step: 5, unit: "%" },
            font: { type: ControlType.Enum, title: "Font", defaultValue: "serif", options: ["serif", "sans"], optionTitles: ["Serif", "Sans"], displaySegmentedControl: true },
            color: { type: ControlType.Color, title: "Color", defaultValue: "#FBF1E4" },
            separator: { type: ControlType.Enum, title: "Separator", defaultValue: "star", options: ["star", "dot", "none"], optionTitles: ["✦", "·", "None"], displaySegmentedControl: true },
        },
    },
    pause: {
        type: ControlType.Object,
        title: "Pause",
        defaultValue: DEFAULT_PAUSE,
        controls: {
            show: { type: ControlType.Boolean, title: "Button", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide", description: "Keep it visible: motion over 5 s needs a pause control (WCAG 2.2.2)." },
            position: {
                type: ControlType.Enum,
                title: "Position",
                defaultValue: "bottom-right",
                options: ["bottom-right", "bottom-left", "top-right", "top-left"],
                optionTitles: ["Bottom Right", "Bottom Left", "Top Right", "Top Left"],
                hidden: hidePausePos,
            },
        },
    },
    theme: {
        type: ControlType.Object,
        title: "Theme",
        defaultValue: DEFAULT_THEME,
        controls: {
            transparent: { type: ControlType.Boolean, title: "Transparent", defaultValue: false, enabledTitle: "Yes", disabledTitle: "No" },
            background: { type: ControlType.Color, title: "Background", defaultValue: "#F1ECE3", hidden: hideBackground },
        },
    },
    label: { type: ControlType.String, title: "Label", defaultValue: DEFAULT_LABEL, description: "Accessible name read by screen readers." },
    link: { type: ControlType.Link, title: "Link", defaultValue: "", description: "Optional. Makes the whole strip one link." },
})
