// Clapperboard: a film slate you can clap. Press to open the clapper stick, let go to clap it shut.
// A visitor's clap counts the take up, fires On Clap and can follow a link. The intro claps once when the
// slate scrolls into view. Canvas and static export show it closed, the way the animation starts.

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion"
import { memo, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react"

// ------------------------------------------------------------------ types

type LookKey = "classic" | "brand" | "white" | "color" | "timecode"
type Lang = "en" | "de" | "fr" | "es" | "it" | "nl"
type SnapKey = "soft" | "medium" | "hard"
type Field = "production" | "roll" | "scene" | "take" | "director" | "camera" | "date" | "fps"

interface BorderValue {
    borderWidth?: number
    borderTopWidth?: number
    borderRightWidth?: number
    borderBottomWidth?: number
    borderLeftWidth?: number
    borderStyle?: string
    borderColor?: string
}

interface Props {
    look?: LookKey
    production?: string
    scene?: string
    take?: string
    link?: string
    onClap?: () => void
    slate?: { roll?: string; director?: string; camera?: string; date?: string; fps?: string }
    clap?: { count?: boolean; intro?: boolean; delay?: number; angle?: number; snap?: SnapKey; newTab?: boolean }
    labels?: Partial<Record<Field, string>> & { language?: string }
    colors?: { board?: string; text?: string; stripes?: string; stripes2?: string; display?: string }
    fonts?: { values?: CSSProperties; labels?: CSSProperties }
    design?: { radius?: string; lines?: BorderValue; padding?: string; shadow?: string }
    /** Layout Framer sets on every instance (size, position); passed to the root unchanged, not a design option. */
    style?: CSSProperties
}

interface Look {
    board: string
    text: string
    stripeA: string
    stripeB: string
    display: boolean
}

// ------------------------------------------------------------------ looks and texts

// Starting values only: every color has a control that overrides it (empty means "from the look").
const LOOKS: Record<LookKey, Look> = {
    classic: { board: "#151515", text: "#F2F1EC", stripeA: "#F2F1EC", stripeB: "#151515", display: false },
    brand: { board: "#151515", text: "#F2F1EC", stripeA: "#F2F1EC", stripeB: "#2F57FF", display: false },
    white: { board: "#F2F0EA", text: "#161616", stripeA: "#F2F0EA", stripeB: "#161616", display: false },
    color: { board: "#F2BE22", text: "#151515", stripeA: "#F2F0EA", stripeB: "#151515", display: false },
    timecode: { board: "#121212", text: "#F2F1EC", stripeA: "#F2F1EC", stripeB: "#121212", display: true },
}
const LOOK_KEYS = Object.keys(LOOKS) as LookKey[]
const DISPLAY_RED = "#FF3B2E"
const DARK_TEXT = "#141414"
const LIGHT_TEXT = "#F2F1EC"

const LANG_KEYS: Lang[] = ["en", "de", "fr", "es", "it", "nl"]
const LABELS: Record<Lang, Record<Field, string>> = {
    en: { production: "Production", roll: "Roll", scene: "Scene", take: "Take", director: "Director", camera: "Camera", date: "Date", fps: "FPS" },
    de: { production: "Produktion", roll: "Rolle", scene: "Szene", take: "Take", director: "Regie", camera: "Kamera", date: "Datum", fps: "FPS" },
    fr: { production: "Production", roll: "Bobine", scene: "Scène", take: "Prise", director: "Réalisation", camera: "Caméra", date: "Date", fps: "IPS" },
    es: { production: "Producción", roll: "Rollo", scene: "Escena", take: "Toma", director: "Dirección", camera: "Cámara", date: "Fecha", fps: "FPS" },
    it: { production: "Produzione", roll: "Rullo", scene: "Scena", take: "Take", director: "Regia", camera: "Camera", date: "Data", fps: "FPS" },
    nl: { production: "Productie", roll: "Rol", scene: "Scène", take: "Take", director: "Regie", camera: "Camera", date: "Datum", fps: "FPS" },
}
// Read by assistive technology after the name: how the clap works (press, or hold first), the count and the link.
const HOW: Record<Lang, { press: string; hold: string; count: string; link: string }> = {
    en: { press: "Press to clap.", hold: "Press to clap, or hold to keep the stick open until you let go.", count: "Each clap counts the take up.", link: "The link opens after the clap." },
    de: { press: "Drücken schlägt die Klappe zu.", hold: "Drücken schlägt die Klappe zu, Halten lässt sie bis zum Loslassen offen.", count: "Jeder Schlag zählt den Take hoch.", link: "Danach öffnet sich der Link." },
    fr: { press: "Appuyez pour claquer.", hold: "Appuyez pour claquer, ou maintenez pour garder le clap ouvert jusqu'au relâchement.", count: "Chaque claquement augmente la prise d'un.", link: "Le lien s'ouvre ensuite." },
    es: { press: "Pulsa para dar el golpe.", hold: "Pulsa para dar el golpe, o mantén pulsado para dejar la claqueta abierta hasta soltar.", count: "Cada golpe suma una toma.", link: "Después se abre el enlace." },
    it: { press: "Premi per battere il ciak.", hold: "Premi per battere il ciak, o tieni premuto per tenerlo aperto finché non rilasci.", count: "Ogni battuta aumenta il take di uno.", link: "Poi si apre il link." },
    nl: { press: "Druk om te klappen.", hold: "Druk om te klappen, of houd ingedrukt om de klap open te houden tot je loslaat.", count: "Elke klap telt de take op.", link: "Daarna opent de link." },
}
const DATE_LOCALE: Record<Lang, string> = { en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES", it: "it-IT", nl: "nl-NL" }

// Close duration (s), rebound (deg) and the shortest time the stick stays open before a clap (ms).
const SNAPS: Record<SnapKey, { close: number; bounce: number; minOpen: number }> = {
    soft: { close: 0.21, bounce: 5, minOpen: 200 },
    medium: { close: 0.15, bounce: 3, minOpen: 170 },
    hard: { close: 0.11, bounce: 1.5, minOpen: 140 },
}

// Everything is drawn on a 480 unit wide board and scales with the width of the frame.
const W = 480
const VALUE_SIZE = 17
const LABEL_SIZE = 10
const INTRO_LEAD = 250
const LINK_DELAY = 350

// ------------------------------------------------------------------ colors

type RGBA = [number, number, number, number]

/** Reads the colors Framer delivers: hex, rgb(), rgba() and var(--token, fallback). Anything else: null. */
function parseColor(input: unknown): RGBA | null {
    if (typeof input !== "string") return null
    let s = input.trim()
    for (let i = 0; i < 4 && s.startsWith("var("); i++) {
        const comma = s.indexOf(",")
        if (comma < 0 || !s.endsWith(")")) return null
        s = s.slice(comma + 1, -1).trim()
    }
    const hex = /^#([0-9a-f]{3,8})$/i.exec(s)
    if (hex) {
        let h = hex[1]
        if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("")
        if (h.length !== 6 && h.length !== 8) return null
        const n = (i: number) => parseInt(h.slice(i, i + 2), 16)
        return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1]
    }
    const cf = /^color\(\s*(display-p3|srgb)\s+([^)]+)\)$/i.exec(s)
    if (cf) {
        const parts = cf[2].split(/[\s/]+/).filter(Boolean)
        if (parts.length < 3) return null
        const val = (p: string) => (p.endsWith("%") ? parseFloat(p) / 100 : parseFloat(p))
        const [r, g, b] = parts.slice(0, 3).map(val)
        const a = parts[3] === undefined ? 1 : val(parts[3])
        if (![r, g, b, a].every(Number.isFinite)) return null
        const rgb = cf[1].toLowerCase() === "display-p3" ? p3ToSrgb(r, g, b) : [r, g, b]
        return [clamp(rgb[0], 0, 1) * 255, clamp(rgb[1], 0, 1) * 255, clamp(rgb[2], 0, 1) * 255, clamp(a, 0, 1)]
    }
    const fn = /^rgba?\(([^)]+)\)$/i.exec(s)
    if (!fn) return null
    const parts = fn[1].split(/[\s,/]+/).filter(Boolean)
    if (parts.length < 3) return null
    const ch = parts.slice(0, 3).map((p) => (p.endsWith("%") ? (parseFloat(p) * 255) / 100 : parseFloat(p)))
    const a = parts[3] === undefined ? 1 : parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3])
    if (ch.some((v) => !Number.isFinite(v)) || !Number.isFinite(a)) return null
    return [clamp(ch[0], 0, 255), clamp(ch[1], 0, 255), clamp(ch[2], 0, 255), clamp(a, 0, 1)]
}

/** Display P3 to sRGB with the matrices of CSS Color 4; values outside sRGB are clipped by the caller. */
function p3ToSrgb(r: number, g: number, b: number): number[] {
    const lin = (v: number) => (Math.abs(v) <= 0.04045 ? v / 12.92 : Math.sign(v) * ((Math.abs(v) + 0.055) / 1.055) ** 2.4)
    const enc = (v: number) => (Math.abs(v) <= 0.0031308 ? v * 12.92 : Math.sign(v) * (1.055 * Math.abs(v) ** (1 / 2.4) - 0.055))
    const [R, G, B] = [lin(r), lin(g), lin(b)]
    return [enc(1.2249402 * R - 0.2249402 * G), enc(-0.0420570 * R + 1.0420570 * G), enc(-0.0196376 * R - 0.0786360 * G + 1.0982736 * B)]
}

function luminance(c: RGBA): number {
    const lin = (v: number) => {
        const x = v / 255
        return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])
}

function contrast(a: RGBA, b: RGBA): number {
    const x = luminance(a)
    const y = luminance(b)
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

const mixRgb = (a: RGBA, b: RGBA, t: number): RGBA => [a[0] * t + b[0] * (1 - t), a[1] * t + b[1] * (1 - t), a[2] * t + b[2] * (1 - t), 1]

/** What the eye sees of the board: itself, or a see-through board over a white and over a black page. */
function grounds(board: RGBA): RGBA[] {
    if (board[3] >= 1) return [board]
    const over = (bg: number): RGBA => [board[0] * board[3] + bg * (1 - board[3]), board[1] * board[3] + bg * (1 - board[3]), board[2] * board[3] + bg * (1 - board[3]), 1]
    return [over(255), over(0)]
}

const WHITE: RGBA = [255, 255, 255, 1]
const BLACK: RGBA = [0, 0, 0, 1]

/** The board as painted: each ground plain, under the white sheen at the top and the dark one at the bottom. */
function lit(board: RGBA, hi: number, lo: number): RGBA[] {
    return grounds(board).flatMap((g) => [g, mixRgb(WHITE, g, hi), mixRgb(BLACK, g, lo)])
}

const reads = (c: RGBA, ground: RGBA[]) => Math.min(...ground.map((g) => contrast(c, g)))

/** Share of the text color in the label color: as light as possible, at least 4.6:1 on every ground. */
function labelShare(text: RGBA | null, board: RGBA | null, ground: RGBA[]): number {
    if (!text || !board) return 100
    const solid: RGBA = [board[0], board[1], board[2], 1]
    for (let t = 56; t <= 100; t += 2) if (reads(mixRgb(text, solid, t / 100), ground) >= 4.6) return t
    return 100
}

// ------------------------------------------------------------------ small helpers

function clamp(v: number, lo: number, hi: number): number {
    return Math.min(hi, Math.max(lo, v))
}

const str = (v: unknown, fallback: string) => (typeof v === "string" ? v : fallback)
const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback)
const u = (n: number) => `calc(${Math.round(n * 100) / 100} * var(--cb-u))`

/** Pixel values from Framer's controls are meant for a 480 px wide board: they scale with it. */
function scalePx(value: string): string {
    return value.replace(/(-?\d*\.?\d+)px/g, (_m, n: string) => u(parseFloat(n)))
}

function pxList(v: unknown, count: number, fallback: number[], max: number): number[] {
    const s = typeof v === "number" ? `${v}px` : typeof v === "string" ? v.trim() : ""
    const parts = s.split(/\s+/).filter(Boolean)
    if (!parts.length || parts.some((p) => !/^\d*\.?\d+(px)?$/.test(p))) return fallback
    const n = parts.map((p) => clamp(parseFloat(p), 0, max))
    if (count === 4) {
        if (n.length === 1) return [n[0], n[0], n[0], n[0]]
        if (n.length === 2) return [n[0], n[1], n[0], n[1]]
        if (n.length === 3) return [n[0], n[1], n[2], n[1]]
        return n.slice(0, 4)
    }
    return n
}

function fontPx(f: CSSProperties | undefined, fallback: number, lo: number, hi: number): number {
    const v = f && typeof f === "object" ? f.fontSize : undefined
    const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN
    return Number.isFinite(n) ? clamp(n, lo, hi) : fallback
}

function fontStyle(f: CSSProperties | undefined, family: string, weight: number): CSSProperties {
    const o = f && typeof f === "object" ? f : {}
    return {
        fontFamily: typeof o.fontFamily === "string" && o.fontFamily ? o.fontFamily : family,
        fontWeight: o.fontWeight ?? weight,
        fontStyle: o.fontStyle,
        letterSpacing: o.letterSpacing,
    }
}

/** Line height from a Font control (1.2, "1.2em", "120%", "20px") as em of its text, between 0.9 and 3; else dropped. */
function lineHeightOf(f: CSSProperties | undefined, sizePx: number): string | undefined {
    const v = f && typeof f === "object" ? f.lineHeight : undefined
    let n = typeof v === "number" ? v : NaN
    const m = typeof v === "string" ? /^(\d*\.?\d+)(em|%|px)?$/.exec(v.trim()) : null
    if (m) n = m[2] === "%" ? parseFloat(m[1]) / 100 : m[2] === "px" ? parseFloat(m[1]) / sizePx : parseFloat(m[1])
    return Number.isFinite(n) && n > 0 ? `${Math.round(clamp(n, 0.9, 3) * 1000) / 1000}em` : undefined
}

/** Width of a text in em at a semibold sans like Inter, within about 3 percent. */
function textEm(s: string): number {
    let w = 0
    for (const ch of s) {
        if (/[ijlI!.,:;'|\s]/.test(ch)) w += 0.25
        else if (/[frt()]/.test(ch)) w += 0.35
        else if (/[mwMW]/.test(ch)) w += 0.86
        else if (/[⺀-鿿가-힯＀-￯]/.test(ch)) w += 1
        else if (/[0-9]/.test(ch) || ch !== ch.toLowerCase()) w += 0.67
        else w += 0.55
    }
    return w
}

/** Links that may run: web, mail, phone, relative paths and anchors. Other schemes (javascript: and the like) give "". */
function safeHref(v: unknown): string {
    if (typeof v !== "string") return ""
    const s = v.trim()
    const bare = s.replace(/[\u0000- \u007f]+/g, "")
    if (!bare) return ""
    if (/^(https?|mailto|tel):/i.test(bare)) return s
    return /^[a-z][a-z0-9+.-]*:/i.test(bare) ? "" : s
}

/** A whole number counts up and keeps its width ("09" becomes "10"). Anything else stays as typed. */
function nextTake(t: string): string {
    if (!/^\d{1,9}$/.test(t)) return t
    return String(Number(t) + 1).padStart(t.length, "0")
}

function pickLang(choice: string, site: string | undefined): { lang: Lang; locale: string } {
    if ((LANG_KEYS as string[]).includes(choice)) return { lang: choice as Lang, locale: DATE_LOCALE[choice as Lang] }
    const code = typeof site === "string" && /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(site) ? site : "en-US"
    const two = code.slice(0, 2).toLowerCase()
    return { lang: (LANG_KEYS as string[]).includes(two) ? (two as Lang) : "en", locale: code }
}

const DATE_OPTIONS: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "2-digit" }

function formatDate(d: Date, locale: string): string {
    try {
        return new Intl.DateTimeFormat(locale, DATE_OPTIONS).format(d)
    } catch (e) {
        // a language tag the browser does not know: English dates; anything else is a bug and stays visible
        if (!(e instanceof RangeError)) throw e
        return new Intl.DateTimeFormat("en-US", DATE_OPTIONS).format(d)
    }
}

// ------------------------------------------------------------------ first paint of a color style

// Before the client has measured, a board linked to a color style may already show its dark value. Plain CSS covers
// that first paint, no script: each value below compares the painted board with the light value the server rendered
// with (lightness in oklch). While they match it keeps the server's color; otherwise it holds pure black or white text,
// labels in the text color, a line in the text color and no sheen. Only numbers computed here go into these values,
// never a prop string; the board enters as var(--cb-board). Browsers without relative colors skip the rule (@supports).

type Oklch = [number, number, number]

/** Encoded sRGB channels (0 to 1) of a color Framer delivers, the fallback of var() included; P3 converted, not clipped. */
function unclippedSrgb(input: string): number[] | null {
    let s = input.trim()
    for (let i = 0; i < 4 && s.startsWith("var("); i++) {
        const comma = s.indexOf(",")
        if (comma < 0 || !s.endsWith(")")) return null
        s = s.slice(comma + 1, -1).trim()
    }
    const p3 = /^color\(\s*display-p3\s+([^)]+)\)$/i.exec(s)
    if (p3) {
        const v = p3[1].split(/[\s/]+/).filter(Boolean).slice(0, 3).map((p) => (p.endsWith("%") ? parseFloat(p) / 100 : parseFloat(p)))
        return v.length === 3 && v.every(Number.isFinite) ? p3ToSrgb(v[0], v[1], v[2]) : null
    }
    const c = parseColor(s)
    return c ? [c[0] / 255, c[1] / 255, c[2] / 255] : null
}

/** Oklch of encoded sRGB, as the browser computes it for relative colors. */
function toOklch(rgb: number[]): Oklch {
    const lin = (v: number) => (Math.abs(v) <= 0.04045 ? v / 12.92 : Math.sign(v) * ((Math.abs(v) + 0.055) / 1.055) ** 2.4)
    const [r, g, b] = rgb.map(lin)
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
    const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
    const h = (Math.atan2(B, A) * 180) / Math.PI
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, Math.hypot(A, B), h < 0 ? h + 360 : h]
}

type PrePaint = { tokens: string; vars: Record<`--cb-${string}`, string> }

/**
 * CSS values for the first paint of a board linked to a color style. `text` is the text color the server chose,
 * `own` marks a text color of the buyer (kept as it is), `share` the label share in percent, `line` whether the line
 * follows the text color, `hi`, `lo` the sheen and `edge` the edge share in percent. Null when a color does not parse.
 */
function prePaint(board: string, text: string, own: boolean, share: number, line: boolean, hi: number, lo: number, edge: number): PrePaint | null {
    const b = unclippedSrgb(board)
    const t = unclippedSrgb(text)
    if (!b || !t) return null
    const n = (v: number) => String(Number.isFinite(v) ? Math.round(v * 10000) / 10000 : 0)
    const mix = (k: number) => t.map((v, i) => v * k + b[i] * (1 - k))
    const L0 = n(toOklch(b)[0])
    // 1 once the painted board differs from the light value, 1 where white text reads (else black).
    const D = `clamp(0, (max(l - ${L0}, ${L0} - l) - 0.004) * 1000, 1)`
    const W = "clamp(0, (0.5636 - l) * 1000, 1)"
    // Opaque on purpose: a relative color keeps the alpha of the board otherwise (see-through color styles).
    const toward = ([L, C, H]: Oklch) => `oklch(from var(--cb-board) calc(${n(L)} + ${D} * (${W} - ${n(L)})) calc(${n(C)} * (1 - ${D})) ${n(H)} / 1)`
    const [Lt, Ct, Ht] = toOklch(t)
    const vars: PrePaint["vars"] = {
        "--cb-phi": `oklch(from var(--cb-board) 1 0 0 / calc(${n(hi)} * (1 - ${D})))`,
        "--cb-plo": `oklch(from var(--cb-board) 0 0 0 / calc(${n(lo)} * (1 - ${D})))`,
        "--cb-pe": `oklch(from var(--cb-board) ${n(Lt)} ${n(Ct)} ${n(Ht)} / calc(${n(edge / 100)} * (1 - ${D})))`,
    }
    const tokens: string[] = []
    if (!own) {
        tokens.push("t")
        vars["--cb-pt"] = toward([Lt, Ct, Ht])
        vars["--cb-pl"] = toward(toOklch(mix(share / 100)))
        if (line) {
            tokens.push("n")
            const [Ln, Cn, Hn] = toOklch(mix(0.18)).map(n)
            vars["--cb-pn"] = `oklch(from var(--cb-board) calc(${Ln} + ${D} * (l + 0.18 * (${W} - l) - ${Ln})) calc(${Cn} + ${D} * (0.82 * c - ${Cn})) calc(${Hn} + ${D} * (h - ${Hn})) / 1)`
        }
    }
    return { tokens: tokens.join(" ") || "-", vars }
}

// Layout effects only where there is a DOM (the server warns about them otherwise).
const useClientLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

/**
 * A color style can switch with the system scheme or with a theme attribute on <html> or <body>. One shared watcher
 * for all slates on the page (FP-16): it only reads, is attached while at least one slate with a color style is in
 * view and is removed when none is.
 */
const scheme = { subs: new Set<() => void>(), mq: null as MediaQueryList | null, mo: null as MutationObserver | null }
const schemeNotify = () => scheme.subs.forEach((fn) => fn())
function schemeSubscribe(fn: () => void): () => void {
    scheme.subs.add(fn)
    if (scheme.subs.size === 1) {
        scheme.mq = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null
        scheme.mq?.addEventListener?.("change", schemeNotify)
        scheme.mo = typeof MutationObserver === "undefined" ? null : new MutationObserver(schemeNotify)
        scheme.mo?.observe(document.documentElement, { attributes: true })
        if (document.body) scheme.mo?.observe(document.body, { attributes: true })
    }
    return () => {
        scheme.subs.delete(fn)
        if (scheme.subs.size > 0) return
        scheme.mq?.removeEventListener?.("change", schemeNotify)
        scheme.mo?.disconnect()
        scheme.mq = null
        scheme.mo = null
    }
}

function readServerDate(uid: string): string | null {
    if (typeof document === "undefined") return null
    const el = document.querySelector(`.${uid} [data-cb-date]`)
    const t = el ? el.textContent : null
    return t && t.trim() ? t : null
}

function fpsOf(v: string): number {
    const n = Math.round(parseFloat(v.replace(",", ".")))
    return Number.isFinite(n) && n >= 1 ? Math.min(n, 120) : 24
}

function timecode(d: Date, fps: number): string {
    const p = (n: number) => String(n).padStart(2, "0")
    // Above 60 FPS the frame field counts pairs of frames, so it stays two digits.
    const base = fps > 60 ? Math.round(fps / 2) : fps
    const f = Math.min(base - 1, Math.floor((d.getMilliseconds() / 1000) * base))
    return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}:${p(f)}`
}

// ------------------------------------------------------------------ drawings

/**
 * Stripes on a 480 wide stick, as a sheared pattern: the edges of both sticks meet at the seam and lean away from
 * it, so the closed clapper shows chevrons. The shear starts at the seam (bottom edge above, top edge below).
 */
function stripes(id: string, h: number, a: string, b: string, below: boolean) {
    const lean = (Math.atan(0.62) * 180) / Math.PI
    const transform = below ? `skewX(${lean.toFixed(2)})` : `translate(0 ${h}) skewX(${(-lean).toFixed(2)})`
    return (
        <svg viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <defs>
                <pattern id={id} width="68" height={h * 2} patternUnits="userSpaceOnUse" patternTransform={transform}>
                    <rect width="68" height={h * 2} style={{ fill: a }} />
                    <rect width="34" height={h * 2} style={{ fill: b }} />
                </pattern>
            </defs>
            <rect width={W} height={h} fill={`url(#${id})`} />
        </svg>
    )
}

/** Colors Framer cannot deliver (typos in a pasted value): back to the look instead of a dropped style. */
function validColor(v: unknown): string {
    const s = typeof v === "string" ? v.trim() : ""
    if (!s) return ""
    return parseColor(s) || /^(var|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i.test(s) || /^[a-z]+$/i.test(s) ? s : ""
}

// Seven segment digits, drawn by hand (no font): a to g clockwise, g in the middle.
const SEGMENTS: Record<string, string> = { "0": "abcdef", "1": "bc", "2": "abdeg", "3": "abcdg", "4": "bcfg", "5": "acdfg", "6": "acdefg", "7": "abc", "8": "abcdefg", "9": "abcdfg" }
const DIGIT_W = 30
const DIGIT_H = 52
const STROKE = 6
const GAP = 1.2

function segmentShapes(x: number): Record<string, string> {
    const t = STROKE
    const g = GAP
    const skew = (y: number) => (DIGIT_H - y) * 0.09
    const pts = (list: number[][]) => list.map(([px, py]) => `${Math.round((x + px + skew(py)) * 10) / 10},${Math.round(py * 10) / 10}`).join(" ")
    const hz = (y: number) => [[t / 2 + g, y], [t + g, y - t / 2], [DIGIT_W - t - g, y - t / 2], [DIGIT_W - t / 2 - g, y], [DIGIT_W - t - g, y + t / 2], [t + g, y + t / 2]]
    const vt = (xx: number, y0: number, y1: number) => [[xx, y0 + g], [xx + t / 2, y0 + t / 2 + g], [xx + t / 2, y1 - t / 2 - g], [xx, y1 - g], [xx - t / 2, y1 - t / 2 - g], [xx - t / 2, y0 + t / 2 + g]]
    return {
        a: pts(hz(t / 2)),
        b: pts(vt(DIGIT_W - t / 2, 0, DIGIT_H / 2)),
        c: pts(vt(DIGIT_W - t / 2, DIGIT_H / 2, DIGIT_H)),
        d: pts(hz(DIGIT_H - t / 2)),
        e: pts(vt(t / 2, DIGIT_H / 2, DIGIT_H)),
        f: pts(vt(t / 2, 0, DIGIT_H / 2)),
        g: pts(hz(DIGIT_H / 2)),
    }
}

// Positions of the eight digits and three colons of HH:MM:SS:FF.
const TC_LAYOUT = (() => {
    const digits: Record<string, string>[] = []
    const colons: number[] = []
    let x = 0
    for (let i = 0; i < 11; i++) {
        if (i % 3 === 2) {
            colons.push(x)
            x += 13
        } else {
            digits.push(segmentShapes(x))
            x += 38
        }
    }
    return { digits, colons, width: x - 8 }
})()

interface DisplayProps {
    run: boolean
    frozen: string
    fps: number
    color: string
}

/** The red display. It runs its own clock while the stick is open, so only this part re-renders. */
const TimecodeDisplay = memo(function TimecodeDisplay({ run, frozen, fps, color }: DisplayProps) {
    const [live, setLive] = useState(frozen)
    useEffect(() => {
        if (!run) return
        let frame = 0
        let last = ""
        const tick = () => {
            const t = timecode(new Date(), fps)
            if (t !== last) {
                last = t
                setLive(t)
            }
            frame = requestAnimationFrame(tick)
        }
        tick()
        return () => cancelAnimationFrame(frame)
    }, [run, fps])
    const text = (run ? live : frozen).replace(/:/g, "")
    const ghost = `color-mix(in srgb, ${color} 9%, transparent)`
    return (
        <svg className="cb-digits" viewBox={`-2 -2 ${TC_LAYOUT.width + 4} ${DIGIT_H + 4}`} aria-hidden="true" focusable="false">
            {TC_LAYOUT.digits.map((shapes, i) => {
                const lit = SEGMENTS[text[i]] ?? ""
                return Object.entries(shapes).map(([k, p]) => <polygon key={`${i}${k}`} points={p} style={{ fill: lit.includes(k) ? color : ghost }} />)
            })}
            {TC_LAYOUT.colons.map((x) => (
                <g key={x} style={{ fill: color }}>
                    <circle cx={x + 6.9} cy={17} r={3.2} />
                    <circle cx={x + 5.4} cy={35} r={3.2} />
                </g>
            ))}
        </svg>
    )
})

// ------------------------------------------------------------------ styles

/** Instance-scoped CSS. "&" stands for the instance class. No characters React escapes in SSR (> " ' &). */
function buildCss(r: string): string {
    const css = `&{position:relative;width:100%;container-type:inline-size;-webkit-tap-highlight-color:transparent}
& *{box-sizing:border-box}
& .cb-obj{--cb-u:calc(100cqw / ${W});position:relative}
& .cb-hit{display:block;position:relative;width:100%;margin:0;padding:0;border:0;background:none;-webkit-appearance:none;appearance:none;font:inherit;letter-spacing:inherit;word-spacing:inherit;line-height:inherit;text-align:inherit;text-transform:inherit;text-indent:inherit;text-shadow:inherit;color:inherit;text-decoration:none;cursor:pointer;outline:none;border-radius:var(--cb-rh);touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
& .cb-hit.cb-off{cursor:default}
& .cb-hit:focus-visible{outline:2px solid #111111;outline-offset:3px;box-shadow:0 0 0 3px #FFFFFF}
& .cb-hit::-moz-focus-inner{border:0;padding:0}
& .cb-clap{position:relative;height:${u(70)};z-index:2}
& .cb-stick{position:absolute;left:0;right:0;overflow:hidden}
& .cb-stick svg{position:absolute;left:0;top:0;width:100%;height:100%;display:block}
& .cb-fixed{bottom:-1px;height:calc(${u(30)} + 2px)}
& .cb-top{top:0;height:${u(40)};transform-origin:${u(13)} 100%;border-radius:var(--cb-rt);box-shadow:0 ${u(2)} ${u(5)} rgba(0,0,0,.28);z-index:2}
& .cb-gloss{position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;background:linear-gradient(180deg,rgba(255,255,255,.16) 0,rgba(255,255,255,0) ${u(5)},rgba(0,0,0,0) 60%,rgba(0,0,0,.2) 100%)}
& .cb-fixed .cb-gloss{background:linear-gradient(180deg,rgba(0,0,0,.3) 0,rgba(0,0,0,0) ${u(6)},rgba(0,0,0,0) 70%,rgba(0,0,0,.18) 100%)}
& .cb-hinge{position:absolute;z-index:3;left:${u(7)};top:${u(34)};width:${u(12)};height:${u(12)};border-radius:50%;background:radial-gradient(circle at 36% 30%,#FFFFFF 0,#D6D8DB 34%,#9A9EA3 70%,#6B6F74 100%);box-shadow:0 ${u(1)} ${u(2)} rgba(0,0,0,.45),inset 0 0 0 ${u(0.6)} rgba(0,0,0,.25)}
& .cb-pin{position:absolute;left:38%;top:38%;width:24%;height:24%;border-radius:50%;background:rgba(0,0,0,.35)}
& .cb-body{position:relative;background-color:var(--cb-board);border-radius:var(--cb-rb);box-shadow:var(--cb-shadow)}
& .cb-sheen,& .cb-edge{position:absolute;left:0;top:0;right:0;bottom:0;border-radius:inherit;pointer-events:none}
& .cb-sheen{background:linear-gradient(180deg,rgba(255,255,255,var(--cb-hi)) 0,rgba(255,255,255,0) 40%,rgba(0,0,0,0) 70%,rgba(0,0,0,var(--cb-lo)) 100%)}
& .cb-edge{box-shadow:inset 0 0 0 max(1px,${u(1)}) var(--cb-edge)}
& .cb-tc{position:relative;padding:${u(14)} ${u(16)};border-bottom:var(--cb-lw) var(--cb-lst) var(--cb-line)}
& .cb-glass{position:relative;overflow:hidden;border-radius:${u(6)};background:#050505;padding:${u(12)} ${u(14)};box-shadow:inset 0 ${u(1)} ${u(3)} rgba(0,0,0,.9),inset 0 0 0 max(1px,${u(1)}) rgba(255,255,255,.06)}
& .cb-glare{position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;background:linear-gradient(170deg,rgba(255,255,255,.07) 0,rgba(255,255,255,0) 45%)}
& .cb-digits{display:block;width:100%;height:auto;overflow:visible;filter:drop-shadow(0 0 ${u(5)} var(--cb-glow))}
& .cb-board{position:relative;display:grid;grid-template-columns:${u(128)} ${u(176)} minmax(0,1fr)}
& .cb-cell{min-width:0;padding:var(--cb-pad);border:0 var(--cb-lst) var(--cb-line)}
& .cb-r{border-left-width:var(--cb-lw)}
& .cb-t{border-top-width:var(--cb-lw)}
& .cb-w2{grid-column:1 / 3}
& .cb-label{display:block;font-size:max(9px,var(--cb-ls));line-height:var(--cb-ll,1.2em);text-transform:uppercase;color:var(--cb-label);white-space:nowrap;overflow:clip visible;text-overflow:ellipsis}
& .cb-value{display:block;color:var(--cb-text);white-space:nowrap;overflow:clip visible;text-overflow:ellipsis;font-variant-numeric:tabular-nums;margin-top:${u(9)}}
& .cb-s{font-size:max(12px,var(--cb-vs));line-height:var(--cb-vl,1.15em)}
& .cb-p{font-size:calc(var(--cb-vs) * 1.6);line-height:max(1.15em,var(--cb-vl,1.15em));overflow:hidden;white-space:normal;overflow-wrap:break-word;text-wrap:balance;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2}
& .cb-xl{line-height:.92;margin-top:${u(6)}}
& .cb-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}
@supports (color: oklch(from red calc(max(l - 0.5, 0.5 - l)) c h / calc(alpha * 0.5))){
& .cb-obj[data-cb-pre~=t]{--cb-text:var(--cb-pt)!important;--cb-label:var(--cb-pl)!important}
& .cb-obj[data-cb-pre~=n]{--cb-line:var(--cb-pn)!important}
& .cb-obj[data-cb-pre]{--cb-edge:var(--cb-pe)!important}
& .cb-obj[data-cb-pre] .cb-sheen{background:linear-gradient(180deg,var(--cb-phi) 0,rgba(255,255,255,0) 40%,rgba(0,0,0,0) 70%,var(--cb-plo) 100%)}
}`
    return css.split("&").join(r)
}

// ------------------------------------------------------------------ component

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 480
 * @framerIntrinsicHeight 335
 * @framerDisableUnlink
 */
export default function Clapperboard(props: Props) {
    const { look = "classic", production = "KOJA", scene = "27", take = "1", link = "", onClap, slate, clap, labels, colors, fonts, design, style } = props
    const { roll = "A012", director = "J. GOLD", camera = "A", date = "", fps = "24" } = slate || {}
    const { count = true, intro = true, delay = 700, angle = 30, snap = "hard", newTab = false } = clap || {}
    const { language = "auto" } = labels || {}
    const href = safeHref(link)
    // Stripes is the colored stripe (blue in Brand Stripes), Stripes 2 the one in between.
    const { board, text, stripes: stripeB, stripes2: stripeA, display } = colors || {}
    const { values: valueFont, labels: labelFont } = fonts || {}
    const { radius = "10px", lines, padding = "13px 16px 15px 16px", shadow = "0px 24px 48px -16px rgba(0, 0, 0, 0.42)" } = design || {}

    const isStatic = useIsStaticRenderer()
    const reduced = useReducedMotion() === true
    const uid = `cb${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
    const css = useMemo(() => buildCss(`.${uid}`), [uid])

    // ---------------------------------------------------------------- language, labels, date
    const siteLocale = useLocaleInfo()?.activeLocale?.code
    const { lang, locale } = pickLang(str(language, "auto"), siteLocale)
    const L = LABELS[lang]
    const labelOf = (f: Field) => {
        const own = labels && typeof labels[f] === "string" ? String(labels[f]).trim() : ""
        return own || L[f]
    }
    const dateText = str(date, "").trim()
    const autoDate = dateText === ""
    // The server's date until the client knows the visitor's: the first client render reads the server text back
    // (no mismatch), then the effect sets the visitor's day.
    const [today, setToday] = useState(() => readServerDate(uid) ?? formatDate(new Date(), locale))
    useEffect(() => {
        if (!autoDate) return
        const t = formatDate(new Date(), locale)
        setToday((prev) => (prev === t ? prev : t))
    }, [autoDate, locale])

    // ---------------------------------------------------------------- colors
    const lk = LOOKS[LOOK_KEYS.includes(look) ? look : "classic"]
    const boardCss = validColor(board) || lk.board
    const ownText = validColor(text)
    // Colors linked to a color style are measured in the browser, so text choice, labels and sheen follow the
    // style's dark mode value too: the board always, a linked text color as well. Canvas and export keep the light value.
    const measureBoard = !isStatic && /^var\(/i.test(boardCss)
    const measureText = !isStatic && /^var\(/i.test(ownText)
    const [measured, setMeasured] = useState<{ board: RGBA | null; text: RGBA | null } | null>(null)
    const boardRgb = (measureBoard && measured?.board) || parseColor(boardCss) || parseColor(lk.board)
    const lum = boardRgb ? luminance(boardRgb) : 0
    const hiFull = lum > 0.6 ? 0.45 : lum > 0.25 ? 0.18 : 0.06
    const loFull = lum > 0.6 ? 0.05 : lum > 0.25 ? 0.08 : 0.14
    // Text and labels are measured on the board as painted, sheen included (f = share of the full sheen).
    const ground = (f: number) => (boardRgb ? lit(boardRgb, hiFull * f, loFull * f) : [])
    const readsAt = (c: string, f: number) => {
        const rgb = parseColor(c)
        return rgb && boardRgb ? reads(rgb, ground(f)) : 21
    }
    let textCss = ownText
    if (!textCss) {
        // The look's text, else the softer pair, else pure black or white: the first that reads at 4.5:1.
        const tiers = [[lk.text], [DARK_TEXT, LIGHT_TEXT], ["#000000", "#FFFFFF"]]
        const best = (list: string[], f: number) => list.reduce((a, b) => (readsAt(b, f) > readsAt(a, f) ? b : a))
        const full = tiers.map((t) => best(t, 1)).find((c) => readsAt(c, 1) >= 4.5)
        textCss = full ?? tiers.map((t) => best(t, 0)).find((c) => readsAt(c, 0) >= 4.5) ?? best(tiers[2], 0)
    }
    const textRgb = (measureText && measured?.text) || parseColor(textCss)
    const readsText = (f: number) => (textRgb && boardRgb ? reads(textRgb, ground(f)) : 21)
    // The sheen gives way where it would push the text under 4.5:1 (unless the text misses it on the plain board too).
    let sheen = 1
    while (sheen > 0 && readsText(sheen) < 4.5 && readsText(0) >= 4.5) sheen -= 0.25
    const hi = hiFull * sheen
    const lo = loFull * sheen
    const share = labelShare(textRgb, boardRgb, ground(sheen))
    // A see-through board mixes as its solid color, so the labels stay opaque; a P3 board as its sRGB color, the one
    // the contrast is measured with. Color styles stay var() and follow their dark mode value.
    const solidBoard = boardRgb && (boardRgb[3] < 1 || /^color\(/i.test(boardCss))
    const mixBoard = boardRgb && solidBoard ? `rgb(${boardRgb.slice(0, 3).map(Math.round).join(", ")})` : boardCss
    const labelCss = share >= 100 ? textCss : `color-mix(in srgb, ${textCss} ${share}%, ${mixBoard})`
    const aCss = validColor(stripeA) || lk.stripeA
    const bCss = validColor(stripeB) || lk.stripeB
    const ledCss = validColor(display) || DISPLAY_RED

    // Lines between the fields: the Border control, else 1 px in a faint tint of the text color.
    const lineSet = lines && typeof lines === "object"
    const lineW = lineSet
        ? clamp(Math.max(num(lines.borderWidth, 0), num(lines.borderTopWidth, 0), num(lines.borderRightWidth, 0), num(lines.borderBottomWidth, 0), num(lines.borderLeftWidth, 0)), 0, 4)
        : 1
    const lineStyle = lineSet && ["solid", "dashed", "dotted", "double"].includes(String(lines.borderStyle)) ? String(lines.borderStyle) : "solid"
    const ownLine = !!(lineSet && typeof lines.borderColor === "string" && lines.borderColor)
    const lineCss = ownLine && lines ? String(lines.borderColor) : `color-mix(in srgb, ${textCss} 18%, ${boardCss})`
    const edgeShare = lum > 0.6 ? 12 : lum < 0.05 ? 9 : 0
    const pre = measureBoard && !measured ? prePaint(boardCss, textCss, !!ownText, share, !ownLine && !solidBoard, hi, lo, edgeShare) : null

    // ---------------------------------------------------------------- sizes
    const vs = fontPx(valueFont, VALUE_SIZE, 6, 60)
    const ls = fontPx(labelFont, LABEL_SIZE, 5, 30)
    // At most 48 above and below, 32 at the sides: more would push values out of the narrow Roll column.
    const pad = pxList(padding, 4, [13, 16, 15, 16], 120).map((v, i) => Math.min(v, i % 2 ? 32 : 48))
    // Bottom corners only as round as the corner fields allow: their values stay 4 units inside the curve.
    const cornerRoom = (side: number, bottom: number) => {
        const s = side + bottom - 4
        const d = s * s - (side * side + bottom * bottom - 16)
        return d > 0 ? s + Math.sqrt(d) : 0
    }
    const [rtl, rtr, rbrIn, rblIn] = pxList(radius, 4, [10, 10, 10, 10], 120)
    const rbr = Math.min(rbrIn, Math.max(10, cornerRoom(pad[1], pad[2])))
    const rbl = Math.min(rblIn, Math.max(10, cornerRoom(pad[3], pad[2])))
    const shadowCss = typeof shadow === "string" && shadow.trim() ? scalePx(shadow) : "none"
    const valueStyle = fontStyle(valueFont, "Inter, system-ui, sans-serif", 600)
    const labelStyle = fontStyle(labelFont, "'Fragment Mono', ui-monospace, monospace", 400)
    if (labelStyle.letterSpacing === undefined) labelStyle.letterSpacing = "0.08em"
    // Scene and take: about four times the values and never wider than their field ("9" and "10" share one size).
    // They never get smaller than the production or than three characters need; longer values end with an ellipsis.
    const bigRoom = 176 - pad[1] - pad[3]
    const bigFloor = Math.min(vs * 1.6, bigRoom / (textEm("000") * 1.04))
    const bigSize = (v: string) => {
        const fit = Math.min(vs * 4.35 * (v.length <= 4 ? 1 : Math.max(0.42, 4 / v.length)), bigRoom / (Math.max(textEm(v), 1.34) * 1.04))
        return `max(12px, ${u(Math.max(bigFloor, fit))})`
    }
    // A long production gets smaller until it would drop below 0.72 of its size, then it takes a second line. The
    // longest word among those that can show in two lines fits one line, with room for wide fonts. Never below the
    // small values: a word that still does not fit breaks, a third line ends with an ellipsis.
    const prodSize = (v: string) => {
        const room = 128 + 176 - pad[1] - pad[3]
        const size = vs * 1.6 * clamp(room / (vs * 1.6) / (textEm(v) * 1.04), 0.72, 1)
        let used = 0
        let longest = 0
        for (const w of v.split(/\s+/)) {
            const e = textEm(w)
            if (used + e > (2 * room) / size) break
            longest = Math.max(longest, e)
            used += e + 0.25
        }
        return `max(12px, ${u(Math.max(vs, longest > 0 ? Math.min(size, room / (longest * 1.35)) : size))})`
    }

    const objStyle = {
        "--cb-board": boardCss,
        "--cb-text": textCss,
        "--cb-label": labelCss,
        "--cb-line": lineCss,
        "--cb-lw": lineW > 0 ? `max(1px, ${u(lineW)})` : "0px",
        "--cb-lst": lineStyle,
        "--cb-hi": String(hi),
        "--cb-lo": String(lo),
        "--cb-edge": edgeShare ? `color-mix(in srgb, ${textCss} ${edgeShare}%, transparent)` : "transparent",
        "--cb-shadow": shadowCss,
        "--cb-rb": `0 0 ${u(rbr)} ${u(rbl)}`,
        "--cb-rt": `${u(rtl * 0.6)} ${u(rtr * 0.6)} ${u(1)} ${u(1)}`,
        "--cb-rh": `${u(rtl * 0.6)} ${u(rtr * 0.6)} ${u(rbr)} ${u(rbl)}`,
        "--cb-pad": pad.map(u).join(" "),
        "--cb-vs": u(vs),
        "--cb-ls": u(ls),
        "--cb-vl": lineHeightOf(valueFont, vs),
        "--cb-ll": lineHeightOf(labelFont, ls),
        "--cb-glow": `color-mix(in srgb, ${ledCss} 55%, transparent)`,
        ...(pre ? pre.vars : {}),
    } as CSSProperties

    // ---------------------------------------------------------------- take, timecode, announcements
    const takeIn = str(take, "").trim()
    const [shownTake, setShownTake] = useState(takeIn)
    useEffect(() => setShownTake(takeIn), [takeIn])
    const tcFps = fpsOf(str(fps, "24"))
    const [tcRun, setTcRun] = useState(false)
    const [tcAuto, setTcAuto] = useState(false)
    const [tcFrozen, setTcFrozen] = useState("00:00:00:00")
    const [announce, setAnnounce] = useState("")

    // ---------------------------------------------------------------- motion
    const stick = useMotionValue(0)
    const tilt = useMotionValue(0)
    const drop = useMotionValue(0)
    const objRef = useRef<HTMLDivElement | null>(null)
    const bodyRef = useRef<HTMLDivElement | null>(null)
    const tcHeld = useRef(false)
    const phase = useRef<"closed" | "open" | "closing">("closed")
    const openedAt = useRef(0)
    const pressed = useRef<null | "pointer" | "key">(null)
    const pointerKind = useRef("")
    const inputClapAt = useRef(-Infinity)
    const [isOpen, setIsOpen] = useState(false)
    // Reduced motion is only known in the browser (null on the server): text that depends on it waits for the mount.
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])
    const introPending = useRef(false)
    const introDone = useRef(false)
    const queued = useRef(0)
    const timers = useRef<number[]>([])

    const S = SNAPS[snap === "soft" || snap === "medium" ? snap : "hard"]
    const openAngle = clamp(num(angle, 30), 10, 60)
    const holdMs = clamp(num(delay, 700), 0, 3000)
    const showDisplay = lk.display

    // Latest values for callbacks that outlive a render (timers, animations).
    const live = useRef({ count, href, newTab, onClap, takeLabel: labelOf("take"), reduced, showDisplay, tcFps })
    live.current = { count, href, newTab, onClap, takeLabel: labelOf("take"), reduced, showDisplay, tcFps }

    const later = (ms: number, fn: () => void) => {
        const id = window.setTimeout(() => {
            timers.current = timers.current.filter((t) => t !== id)
            fn()
        }, ms)
        timers.current.push(id)
    }

    useEffect(
        () => () => {
            timers.current.forEach((t) => window.clearTimeout(t))
            timers.current = []
            stick.stop()
            tilt.stop()
            drop.stop()
        },
        [stick, tilt, drop]
    )

    const follow = () => {
        const { href: to, newTab: tab, reduced: still } = live.current
        if (!to) return
        const go = () => {
            try {
                if (tab) window.open(to, "_blank", "noopener,noreferrer")
                else window.location.assign(to)
            } catch (e) {
                // A link the browser refuses (an address it cannot read) stays a clap; anything else is a bug.
                if (!(e instanceof DOMException)) throw e
            }
        }
        if (still) go()
        else later(LINK_DELAY, go)
    }

    const clapped = (byVisitor: boolean) => {
        const v = live.current
        if (v.showDisplay) {
            tcHeld.current = true
            setTcAuto(false)
            setTcRun(false)
            setTcFrozen(timecode(new Date(), v.tcFps))
        }
        const first = introPending.current
        introPending.current = false
        if (!first && v.count) {
            setShownTake((t) => {
                const n = nextTake(t)
                if (n !== t) setAnnounce(`${v.takeLabel} ${n}`)
                return n
            })
        }
        if (byVisitor) {
            v.onClap?.()
            follow()
        }
    }

    const open = () => {
        if (phase.current !== "closed") return
        phase.current = "open"
        setIsOpen(true)
        openedAt.current = performance.now()
        if (live.current.showDisplay) setTcRun(true)
        animate(stick, -openAngle, { type: "spring", stiffness: 420, damping: 24 })
    }

    // After a clap or a settle: a press that came meanwhile opens the stick, finished presses clap in turn.
    function afterClosed() {
        if (pressed.current) open()
        else if (queued.current > 0) {
            queued.current -= 1
            open()
            close(true)
        }
    }

    const close = (byVisitor: boolean) => {
        if (phase.current !== "open") return
        phase.current = "closing"
        const wait = Math.max(0, S.minOpen - (performance.now() - openedAt.current))
        later(wait, () => {
            animate(stick, 0, {
                duration: S.close,
                ease: [0.55, 0, 1, 0.45],
                onComplete: () => {
                    phase.current = "closed"
                    setIsOpen(false)
                    animate(stick, [0, -S.bounce, 0], { duration: 0.22, times: [0, 0.35, 1], ease: "easeOut" })
                    animate(tilt, [0, -0.5, 0.25, 0], { duration: 0.2, ease: "easeOut" })
                    animate(drop, [0, 1.5, 0], { duration: 0.18, ease: "easeOut" })
                    clapped(byVisitor)
                    afterClosed()
                },
            })
        })
    }

    // Lets the stick down without a clap (scroll started on touch, focus lost while a key was held).
    const settle = () => {
        if (phase.current !== "open") return
        if (introPending.current) return close(false)
        phase.current = "closing"
        animate(stick, 0, {
            duration: 0.25,
            ease: "easeOut",
            onComplete: () => {
                phase.current = "closed"
                setIsOpen(false)
                afterClosed()
            },
        })
        if (live.current.showDisplay) setTcRun(false)
    }

    const press = (kind: "pointer" | "key") => {
        pressed.current = kind
        if (live.current.reduced) return
        if (phase.current === "closed") open()
    }

    const release = () => {
        pressed.current = null
        if (live.current.reduced) return clapped(true)
        if (phase.current === "open") close(true)
        else if (phase.current === "closed") {
            open()
            close(true)
        } else queued.current = Math.min(queued.current + 1, 6)
    }

    // ---------------------------------------------------------------- intro
    // the observer outlives a render: it calls the newest open, close and timer helpers
    const act = useRef({ later, open, close })
    act.current = { later, open, close }
    useEffect(() => {
        const el = objRef.current
        if (isStatic || !intro || reduced || introDone.current || !el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    const viewH = e.rootBounds ? e.rootBounds.height : window.innerHeight
                    if (e.isIntersecting && (e.intersectionRatio >= 0.5 || e.intersectionRect.height >= viewH * 0.5)) {
                        io.disconnect()
                        introDone.current = true
                        act.current.later(INTRO_LEAD, () => {
                            if (phase.current !== "closed" || pressed.current) return
                            introPending.current = true
                            act.current.open()
                            act.current.later(holdMs, () => {
                                if (!pressed.current) act.current.close(false)
                            })
                        })
                        return
                    }
                }
            },
            { threshold: [0, 0.25, 0.5, 0.75, 1] }
        )
        io.observe(el)
        // the intro runs once; its timers are cleared on unmount
        return () => io.disconnect()
    }, [isStatic, intro, reduced, holdMs])

    // ---------------------------------------------------------------- board color in the browser, running display
    useClientLayoutEffect(() => {
        const el = bodyRef.current
        if ((!measureBoard && !measureText) || !el || typeof window === "undefined") return
        // Channels within half a step count as equal; alpha (0 to 1) has its own, finer step.
        const same = (a: RGBA | null | undefined, b: RGBA | null) => (!a && !b) || (!!a && !!b && a.every((v, i) => Math.abs(v - b[i]) < (i < 3 ? 0.5 : 0.005)))
        const read = () => {
            const value = el.querySelector(".cb-value")
            const b = measureBoard ? parseColor(getComputedStyle(el).backgroundColor) : null
            const t = measureText && value ? parseColor(getComputedStyle(value).color) : null
            setMeasured((prev) => (prev && same(prev.board, b) && same(prev.text, t) ? prev : { board: b, text: t }))
        }
        read()
        // A color style switches with the system scheme or with a theme attribute on the page. The shared watcher
        // (schemeSubscribe) runs only while this slate is in view; a switch while it is out of view is read on entering.
        let off: (() => void) | null = null
        const io =
            typeof IntersectionObserver === "undefined"
                ? null
                : new IntersectionObserver((entries) => {
                      const e = entries[entries.length - 1]
                      if (e && e.isIntersecting) {
                          if (!off) {
                              read()
                              off = schemeSubscribe(read)
                          }
                      } else if (off) {
                          off()
                          off = null
                      }
                  })
        if (io) io.observe(el)
        else off = schemeSubscribe(read)
        return () => {
            io?.disconnect()
            off?.()
        }
    }, [measureBoard, measureText, boardCss, ownText])

    // Intro off: the display runs while the slate is in view, until the first clap freezes it.
    useEffect(() => {
        const el = objRef.current
        if (isStatic || intro || reduced || !showDisplay || !el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver((entries) => {
            for (const e of entries) {
                if (tcHeld.current) return
                // Out of view it keeps the last time, so coming back never shows 00:00:00:00 for a frame.
                if (!e.isIntersecting) setTcFrozen(timecode(new Date(), live.current.tcFps))
                setTcAuto(e.isIntersecting)
            }
        })
        io.observe(el)
        return () => {
            io.disconnect()
            setTcAuto(false)
        }
    }, [isStatic, intro, reduced, showDisplay])

    // ---------------------------------------------------------------- input
    const interactive = !isStatic
    const modified = (e: { metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }) => !!href && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
    const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
        pointerKind.current = e.pointerType
        if (!e.isPrimary || e.button !== 0 || e.pointerType === "touch" || modified(e)) return
        e.currentTarget.setPointerCapture?.(e.pointerId)
        press("pointer")
    }
    const onPointerUp = (e: ReactPointerEvent<HTMLElement>) => {
        if (e.pointerType !== "touch" && pressed.current === "pointer") {
            inputClapAt.current = performance.now()
            release()
        }
    }
    const onPointerCancel = () => {
        if (pressed.current !== "pointer") return
        pressed.current = null
        settle()
    }
    const onClick = (e: ReactMouseEvent<HTMLElement>) => {
        if (modified(e)) return
        if (href) e.preventDefault()
        // Mouse, pen and keys clap through their own events. A tap claps here, after the browser decided it is no
        // scroll, and so does a click without a pointer (screen readers, element.click()), unless a pointer or a key
        // just clapped (a native button also clicks on Enter and Space).
        if (e.detail === 0 ? pressed.current !== null || performance.now() - inputClapAt.current < 500 : pointerKind.current !== "touch") return
        release()
    }
    const onKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
        if ((e.key !== " " && e.key !== "Enter") || modified(e)) return
        e.preventDefault()
        if (e.repeat || pressed.current) return
        press("key")
    }
    const onKeyUp = (e: ReactKeyboardEvent<HTMLElement>) => {
        if (e.key !== " " && e.key !== "Enter") return
        // A held key claps on release even if a modifier joined meanwhile; otherwise modifiers stay with the browser.
        if (pressed.current !== "key" && modified(e)) return
        e.preventDefault()
        if (pressed.current === "key") {
            inputClapAt.current = performance.now()
            release()
        }
    }
    const onBlur = () => {
        if (pressed.current !== "key") return
        pressed.current = null
        settle()
    }

    // ---------------------------------------------------------------- render
    const prodText = str(production, "")
    const sceneText = str(scene, "")
    const cell = (cls: string, f: Field, value: string, size: "s" | "p" | "xl", extra?: CSSProperties) => (
        <div className={`cb-cell ${cls}`}>
            <span className="cb-label" style={labelStyle}>
                {labelOf(f)}
            </span>
            <span className={`cb-value cb-${size}`} style={{ ...valueStyle, ...extra }}>
                {value || " "}
            </span>
        </div>
    )
    const name = [prodText, `${labelOf("scene")} ${sceneText}`, `${labelOf("take")} ${shownTake}`].filter((s) => s.trim()).join(", ")
    // tabIndex stays on the native button and link too: Safari skips both on Tab with its default settings otherwise.
    const handlers = interactive ? { onPointerDown, onPointerUp, onPointerCancel, onLostPointerCapture: onPointerCancel, onClick, onKeyDown, onKeyUp, onBlur, tabIndex: 0 } : {}
    // For assistive technology only: how the clap works, read after the name.
    const howId = `${uid}-how`
    const H = HOW[lang]
    const how = [reduced && mounted ? H.press : H.hold, count && /^\d{1,9}$/.test(shownTake) ? H.count : "", href ? H.link : ""].filter(Boolean).join(" ")
    const state = interactive ? { "data-state": isOpen ? "open" : "closed", "aria-describedby": howId } : {}
    const body = (
        <>
            <motion.div style={{ rotate: tilt, y: drop, transformOrigin: "50% 100%" }}>
                <div className="cb-clap">
                    <div className="cb-stick cb-fixed">
                        {stripes(`${uid}-s2`, 30, aCss, bCss, true)}
                        <div className="cb-gloss" />
                    </div>
                    <motion.div className="cb-stick cb-top" style={{ rotate: stick }}>
                        {stripes(`${uid}-s1`, 40, aCss, bCss, false)}
                        <div className="cb-gloss" />
                    </motion.div>
                    <div className="cb-hinge">
                        <div className="cb-pin" />
                    </div>
                </div>
                <div className="cb-body" ref={bodyRef}>
                    <div className="cb-sheen" />
                    {showDisplay ? (
                        <div className="cb-tc">
                            <div className="cb-glass">
                                <TimecodeDisplay run={(tcRun || tcAuto) && !isStatic} frozen={tcFrozen} fps={tcFps} color={ledCss} />
                                <div className="cb-glare" />
                            </div>
                        </div>
                    ) : null}
                    <div className="cb-board">
                        {cell("cb-w2", "production", prodText, "p", { fontSize: prodSize(prodText) })}
                        <div className="cb-cell cb-r">
                            <span className="cb-label" style={labelStyle}>
                                {labelOf("date")}
                            </span>
                            <span className="cb-value cb-s" style={valueStyle} data-cb-date="">
                                {autoDate ? today : dateText}
                            </span>
                        </div>
                        {cell("cb-t", "roll", str(roll, ""), "s")}
                        {cell("cb-t cb-r", "scene", sceneText, "xl", { fontSize: bigSize(sceneText) })}
                        {cell("cb-t cb-r", "take", shownTake, "xl", { fontSize: bigSize(shownTake) })}
                        {cell("cb-t", "camera", str(camera, ""), "s")}
                        {cell("cb-t cb-r", "director", str(director, ""), "s")}
                        {cell("cb-t cb-r", "fps", str(fps, ""), "s")}
                    </div>
                    <div className="cb-edge" />
                </div>
            </motion.div>
        </>
    )

    return (
        <div className={uid} style={{ ...style }} lang={language !== "auto" ? lang : undefined}>
            <style>{css}</style>
            <div ref={objRef} className="cb-obj" style={objStyle} data-cb-pre={pre ? pre.tokens : undefined}>
                {href ? (
                    <a className={interactive ? "cb-hit" : "cb-hit cb-off"} href={href} draggable={false} target={newTab ? "_blank" : undefined} rel={newTab ? "noopener noreferrer" : undefined} aria-label={name} {...state} {...handlers}>
                        {body}
                    </a>
                ) : interactive ? (
                    <button type="button" className="cb-hit" aria-label={name} aria-pressed={isOpen} {...state} {...handlers}>
                        {body}
                    </button>
                ) : (
                    <div className="cb-hit cb-off">{body}</div>
                )}
            </div>
            {interactive ? (
                <span id={howId} className="cb-sr">
                    {how}
                </span>
            ) : null}
            <p className="cb-sr" aria-live="polite">
                {announce}
            </p>
        </div>
    )
}

// ------------------------------------------------------------------ property controls

// The raw value on purpose: in the editor a page link arrives as "data:framer/page-link,…", which safeHref drops.
const hasLink = (_p: unknown, root: unknown) => !(root && typeof root === "object" && (root as Props).link)
const notTimecode = (_p: unknown, root: unknown) => !(root && typeof root === "object" && (root as Props).look === "timecode")
const fromLanguage = (title: string) => ({ type: ControlType.String as const, title, defaultValue: "", placeholder: "From language" })

addPropertyControls(Clapperboard, {
    // flat: chooses the look first, as the top control
    look: {
        type: ControlType.Enum,
        title: "Look",
        options: LOOK_KEYS,
        optionTitles: ["Classic", "Brand Stripes", "White Board", "Color Board", "Timecode"],
        defaultValue: "classic",
        description: "Sets the starting colors. Colors and Style override it.",
    },
    // flat: CMS binding
    production: { type: ControlType.String, title: "Production", defaultValue: "KOJA" },
    // flat: CMS binding
    scene: { type: ControlType.String, title: "Scene", defaultValue: "27" },
    // flat: CMS binding
    take: { type: ControlType.String, title: "Take", defaultValue: "1", description: "A whole number counts up with each clap." },
    // flat: CMS binding
    link: { type: ControlType.Link, title: "Link", description: "Opens after a visitor's clap." },
    onClap: { type: ControlType.EventHandler },
    slate: {
        type: ControlType.Object,
        title: "Slate",
        controls: {
            roll: { type: ControlType.String, title: "Roll", defaultValue: "A012" },
            director: { type: ControlType.String, title: "Director", defaultValue: "J. GOLD" },
            camera: { type: ControlType.String, title: "Camera", defaultValue: "A" },
            date: { type: ControlType.String, title: "Date", defaultValue: "", placeholder: "Today", description: "Empty shows the visitor's date in the page language." },
            fps: { type: ControlType.String, title: "FPS", defaultValue: "24", description: "Also sets the frames of the timecode, counted in pairs above 60." },
        },
    },
    clap: {
        type: ControlType.Object,
        title: "Clap",
        controls: {
            count: { type: ControlType.Boolean, title: "Count", defaultValue: true },
            intro: { type: ControlType.Boolean, title: "Intro", defaultValue: true, description: "Claps once when it scrolls into view. This clap does not count." },
            delay: {
                type: ControlType.Number,
                title: "Delay",
                min: 0,
                max: 3000,
                step: 50,
                unit: "ms",
                defaultValue: 700,
                description: "How long the intro holds the stick open.",
                hidden: (p: { intro?: boolean }) => p.intro === false,
            },
            angle: { type: ControlType.Number, title: "Angle", min: 10, max: 60, step: 1, unit: "°", defaultValue: 30, description: "At 30°, the open stick rises about half the width above the slate." },
            snap: { type: ControlType.Enum, title: "Snap", options: ["soft", "medium", "hard"], optionTitles: ["Soft", "Medium", "Hard"], defaultValue: "hard" },
            newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false, hidden: hasLink },
        },
    },
    labels: {
        type: ControlType.Object,
        title: "Labels",
        controls: {
            language: {
                type: ControlType.Enum,
                title: "Language",
                options: ["auto", ...LANG_KEYS],
                optionTitles: ["Auto", "English", "Deutsch", "Français", "Español", "Italiano", "Nederlands"],
                defaultValue: "auto",
                description: "Auto follows the page language. Also sets the date format.",
            },
            production: fromLanguage("Production"),
            roll: fromLanguage("Roll"),
            scene: fromLanguage("Scene"),
            take: fromLanguage("Take"),
            director: fromLanguage("Director"),
            camera: fromLanguage("Camera"),
            date: fromLanguage("Date"),
            fps: fromLanguage("FPS"),
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            board: { type: ControlType.Color, title: "Board", optional: true },
            text: { type: ControlType.Color, title: "Text", optional: true, description: "Empty picks a dark or light text that reads on the board." },
            stripes: { type: ControlType.Color, title: "Stripes", optional: true },
            stripes2: { type: ControlType.Color, title: "Stripes 2", optional: true, description: "The stripes in between." },
            display: { type: ControlType.Color, title: "Display", optional: true, hidden: notTimecode },
        },
    },
    fonts: {
        type: ControlType.Object,
        title: "Fonts",
        controls: {
            values: {
                type: ControlType.Font,
                title: "Values",
                controls: "extended",
                displayTextAlignment: false,
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: VALUE_SIZE, variant: "Semibold", letterSpacing: "-0.005em", lineHeight: "1.15em" },
                description: "Size at 480 px wide, it scales with the board. Production is 1.6 times, Scene and Take about 4 times as large.",
            },
            labels: {
                type: ControlType.Font,
                title: "Labels",
                controls: "extended",
                displayTextAlignment: false,
                defaultFontType: "monospace",
                defaultValue: { fontSize: LABEL_SIZE, letterSpacing: "0.08em", lineHeight: "1.2em" },
            },
        },
    },
    design: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "10px", description: "Sizes in Style are for 480 px wide and scale with the board." },
            lines: { type: ControlType.Border, title: "Lines", optional: true, description: "Empty uses a faint tint of the text color." },
            padding: { type: ControlType.Padding, title: "Padding", defaultValue: "13px 16px 15px 16px", description: "Inside each field, up to 48 px above and below and 32 px at the sides." },
            shadow: { type: ControlType.BoxShadow, title: "Shadow", defaultValue: "0px 24px 48px -16px rgba(0, 0, 0, 0.42)" },
        },
    },
})
