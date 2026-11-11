import * as React from "react"
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
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

const MASK =
    "AAAAAAAAAAA/+AB//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB////////8AAAAAAAcAAAAAAAAAAAAAAAAAAAAABf//3/////gAAD/AA9fAAAfgAAAAAAAAAAAAAAAOf/////////AAAf4AAAAAAAH8AAAAAAAAAAAAAAD+Qc/wf/////AAADMAAAAMABAfAAAAAAAAAAAAAAN//v/gMf///+AAAAAAAAP4Ah//8AA/4AAAAAAAAAfsBv/gAD///+AAAAAAAA8AAH//wAACAAAAAAAAAA//z+/8AB///4AAAAAAABwDv/////wHwAAAwAHgAAd/58//gB///8AAAADgADwP/////////8ABAB//8/8/+/P/8B///4AAAB/+AIHn//////////+/4H/////+8//P+A///AAAAD//5n///////////////n/////////D/g//wIYAAP///////////////////P////////+P/A//AP4AAf7+////////////////Bh////////vR+Af4AHwAB/3/////////////////AH///////+CvcAPwAAAQD/P/////////////////AH///////8AP4AHwAAABH/f//////////////z/gAA/QH////4Af7AAAAAAEH/n//////////////jwAAAPgB////+AP/gAAAAAeD+v////////////8APgAAA6AA/////wf/wAAAAAOB+P////////////wAPgAADAAAf////+f/8AAAAA/Bx/////////////wAfIAAIAAAX/////f/+AAAAB3n///////////////AOAQGAAAAB///////+AAAABnv///////////////AMAAAAAAAD///////+AAAAAM////////////////AQAAAAAAAA//////+ngAAAAH////////////////gAAAAAAAAAf//////PgAAAAD///////////////7BAAAAAAAAAf//////wAAAAAB/////7/////////yCAAAAAAAAAf/////7AAAAAAB/7/if3/////////jgAAAAAAAAAf/////gAAAAAA/x9/gHz/////////HgAAAAAAAAAf/////gAAAAAA/wvf//5////////4GAAAAAAAAAAf////+AAAAAAA/Bj9//5///////3wGAAAAAAAAAAf////8AAAAAAA/AOc//4///////xwOAAAAAAAAAAP////8AAAAAAA+/kM//////////84cAAAAAAAAAAH////8AAAAAAAP/wDG/////////w78AAAAAAAAAAD////wAAAAAAA//wAB/////////4vgAAAAAAAAAAA////gAAAAAAB//+eB/////////4EAAAAAAAAAAAA////AAAAAAAB//////////////4EAAAAAAAAAAAAf/7jAAAAAAAB//////3///////4AAAAAAAAAAAAAb/gBgAAAAAAH//////7///////4AAAAAAAAAAAAAN/gBwAAAAAAP////+/+P//////wAAAAAAAAAAAAAE/gAEAAAAAAP/////f+wP/////6AAAAAAAAAAAAACfgDgAAAAAAf/////f/8H/////oAAAAAAAAYAAAAAfgx4AAAAAA//////v/8D////8AAAAAAAAAGAAAAAfxwPgAAAAAf/////v/8A/8f+QAAAAAAAAACAAAAAP/wL8AAAAAf/////3/4A/4P+wIAAAAAAAAAAAAAAD/gAAAAAAAf/////z/gAfwH/AMAAAAAAAAAAAAAAA/8AAAAAAIf/////7+AAfAF/gMAAAAAAAAAAAAAAAD+AAAAAAA///////4AAfAB/gKAAAAAAAAAAAAAAAAeAgIAAAAf//////hAAPAB/gPAAAAAAAAAAAAAAAAOD4AAAAAf/////+cAAOARvgHAAAAAAAAAAAAAAAAGX/wAAAAP//////8AAHABCARAAAAAAAAAAAAAAAAD//4AAAAH//////8AAFgBgAngAAAAAAAAAAAAAAAAP/8AAAAD//////4AABgAwBjgAAAAAAAAAAAAAAAAP//gAAAB/H////4AAAAHYDwAAAAAAAAAAAAAAAAAP//wAAAAAB////wAAAAD4HgAAAAAAAAAAAAAAAAAf//4AAAAAA////gAAAAB8PgQAAAAAAAAAAAAAAAA///4AAAAAA////AAAAAA4/vQAAAAAAAAAAAAAABA////AAAAAA///+AAAAAA8/83gAAAAAAAAAAAAAAA////wAAAAA///8AAAAAA+fdLcCAAAAAAAAAAAAAA////+AAAAAf//4AAAAAAOLc7/hAAAAAAAAAAAAAA/////gAAAAP//4AAAAAAGAUBf3QAAAAAAAAAAAAA/////gAAAAP//4AAAAAAD+AVP4YAAAAAAAAAAAAAf////gAAAAH//4AAAAAAAf/gPaJAAAAAAAAAAAAAf////gAAAAH//4AAAAAAAAbACOAAAAAAAAAAAAAAP////AAAAAH//4AAAAAAAAAECACAAAAAAAAAAAAAH///+AAAAAP//4MAAAAAAAAHzAAAAAAAAAAAAAAAH///8AAAAAP//4MAAAAAAAB/jgAAAAAAAAAAAAAAD///8AAAAAP//48AAAAAAAB/zgAEAAAAIAAAAAAAA///8AAAAAP//x4AAAAAAAH//wACDAAAAAAAAAAAAf//8AAAAAP//h4AAAAAAAH//wAACAAAAAAAAAAAAf//8AAAAAP/+B4IAAAAAA///4AQAAAAAAAAAAAAAf//4AAAAAH//BwAAAAAAD///8AMAAAAAAAAAAAAAf//wAAAAAH//BwAAAAAAH///+AAAAAAAAAAAAAAAf/+AAAAAAH//BwAAAAAAH////AAAAAAAAAAAAAAAf/8AAAAAAD/8AAAAAAAAH////AAAAAAAAAAAAAAA//8AAAAAAD/8AAAAAAAAD////gAAAAAAAAAAAAAA//4AAAAAAB/8AAAAAAAAD////gAAAAAAAAAAAAAA//wAAAAAAB/4AAAAAAAAD////AAAAAAAAAAAAAAA//gAAAAAAA/wAAAAAAAAB/z//AAAAAAAAAAAAAAA//gAAAAAAA/AAAAAAAAAD+A/+AAAAAAAAAAAAAAB/9AAAAAAAAAAAAAAAAAABgAf+AAYAAAAAAAAAAAB/8AAAAAAAAAAAAAAAAAAAAAH8AAMAAAAAAAAAAAB/8AAAAAAAAAAAAAAAAAAAAAH4AAOAAAAAAAAAAAB/gAAAAAAAAAAAAAAAAAAAAAAIAAMAAAAAAAAAAAD/gAAAAAAAAAAAAAAAAAAAAAA4AA8AAAAAAAAAAAD/AAAAAAAAAAAAAAAAAAAAAAAYABwAAAAAAAAAAAD+AAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAD8AAAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAD8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH8AAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAH4AAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAD4YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
const SRC_COLS = 240
const SRC_ROWS = 96
const NORTH = 84
const SRC_DEG = 1.5
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
const RAD = Math.PI / 180

let unpacked: Uint8Array | null = null
function sourceMask(): Uint8Array {
    if (unpacked) return unpacked
    const out = new Uint8Array(SRC_COLS * SRC_ROWS)
    let bit = 0
    for (let i = 0; i < MASK.length && bit < out.length; i++) {
        const v = B64.indexOf(MASK[i])
        if (v < 0) break
        for (let k = 5; k >= 0 && bit < out.length; k--)
            out[bit++] = (v >> k) & 1
    }
    unpacked = out
    return out
}

type Sheet = {
    key: number
    cols: number
    rows: number
    deg: number
    land: Uint8Array
    grain: Float32Array
}

const sheets = new Map<number, Sheet>()
function sheetFor(k: number): Sheet {
    const hit = sheets.get(k)
    if (hit) return hit
    const src = sourceMask()
    const cols = Math.floor(SRC_COLS / k)
    const rows = Math.floor(SRC_ROWS / k)
    const need = k === 3 ? 3 : 1
    const land = new Uint8Array(cols * rows)
    const grain = new Float32Array(cols * rows)
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let n = 0
            for (let y = 0; y < k; y++)
                for (let x = 0; x < k; x++)
                    n += src[(r * k + y) * SRC_COLS + c * k + x]
            const i = r * cols + c
            land[i] = n >= need ? 1 : 0
            const g = Math.sin(i * 91.7 + 13.1) * 43758.5453
            grain[i] = g - Math.floor(g)
        }
    }
    const made = { key: k, cols, rows, deg: SRC_DEG * k, land, grain }
    sheets.set(k, made)
    return made
}

const DETAIL: Record<string, number> = { fine: 1, medium: 2, chunky: 3 }

/* ------------------------------------------------------------------------ */
/* Small maths + colour helpers                                              */
/* ------------------------------------------------------------------------ */

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
const wrapDeg = (lon: number) => ((((lon + 180) % 360) + 360) % 360) - 180
const modi = (n: number, m: number) => ((n % m) + m) % m
const pad2 = (n: number) => (n < 10 ? "0" + n : "" + n)
function overshoot(x: number) {
    const a = 1.6
    const u = x - 1
    return 1 + (a + 1) * u * u * u + a * u * u
}
function glide(x: number) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

type RGBA = [number, number, number, number]
function readColor(input: string | undefined, fallback: RGBA): RGBA {
    if (!input) return fallback
    let s = String(input).trim()
    const v = s.match(/^var\([^,]+,\s*(.+)\)$/)
    if (v) s = v[1].trim()
    if (s[0] === "#") {
        let h = s.slice(1)
        if (h.length === 3 || h.length === 4)
            h = h
                .split("")
                .map((q) => q + q)
                .join("")
        const n = parseInt(h.slice(0, 6), 16)
        if (isNaN(n)) return fallback
        const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a]
    }
    const m = s.match(/rgba?\(([^)]+)\)/)
    if (m) {
        const p = m[1]
            .split(/[\s,/]+/)
            .filter(Boolean)
            .map(parseFloat)
        return [p[0] || 0, p[1] || 0, p[2] || 0, p.length > 3 ? p[3] : 1]
    }
    if (s === "transparent") return [0, 0, 0, 0]
    return fallback
}
function blend(a: RGBA, b: RGBA, t: number): RGBA {
    return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
        a[3] + (b[3] - a[3]) * t,
    ]
}
const cssOf = (c: RGBA) =>
    `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${+c[3].toFixed(3)})`

/* ------------------------------------------------------------------------ */
/* Themes, ramps, categories                                                 */
/* ------------------------------------------------------------------------ */

type Theme = {
    background: string
    land: string
    night: string
    highlight: string
    ocean: string
    accent: string
    panel: string
    hairline: string
    text: string
    muted: string
}

const THEMES: Record<string, Theme> = {
    midnight: {
        background: "#0A0B0D",
        land: "#4A5059",
        night: "#24272D",
        highlight: "#F2EEE6",
        ocean: "#1C1F24",
        accent: "#FF6A3D",
        panel: "rgba(19, 20, 24, 0.92)",
        hairline: "rgba(255, 255, 255, 0.09)",
        text: "#F2EEE6",
        muted: "rgba(242, 238, 230, 0.58)",
    },
    graphite: {
        background: "#17181B",
        land: "#5C616B",
        night: "#30333A",
        highlight: "#FFFFFF",
        ocean: "#25272C",
        accent: "#7C9CFF",
        panel: "rgba(31, 32, 37, 0.94)",
        hairline: "rgba(255, 255, 255, 0.1)",
        text: "#F4F5F7",
        muted: "rgba(244, 245, 247, 0.6)",
    },
    deepsea: {
        background: "#061624",
        land: "#2F5873",
        night: "#173246",
        highlight: "#E6F6FF",
        ocean: "#0F2639",
        accent: "#3FE0C5",
        panel: "rgba(8, 28, 44, 0.92)",
        hairline: "rgba(160, 220, 255, 0.12)",
        text: "#E6F6FF",
        muted: "rgba(230, 246, 255, 0.6)",
    },
    frost: {
        background: "#FFFFFF",
        land: "#D3D8DF",
        night: "#B7BFCA",
        highlight: "#0E1116",
        ocean: "#EDF0F4",
        accent: "#2F6BFF",
        panel: "rgba(255, 255, 255, 0.96)",
        hairline: "rgba(14, 17, 22, 0.1)",
        text: "#0E1116",
        muted: "rgba(14, 17, 22, 0.56)",
    },
    paper: {
        background: "#F4F1EA",
        land: "#C9C3B6",
        night: "#A9A396",
        highlight: "#1C1B19",
        ocean: "#E4DFD4",
        accent: "#E4572E",
        panel: "rgba(255, 253, 248, 0.95)",
        hairline: "rgba(28, 27, 25, 0.12)",
        text: "#1C1B19",
        muted: "rgba(28, 27, 25, 0.58)",
    },
    sand: {
        background: "#EFE6D8",
        land: "#CDB99A",
        night: "#B39F80",
        highlight: "#2A2118",
        ocean: "#E3D7C4",
        accent: "#B4532A",
        panel: "rgba(250, 245, 237, 0.95)",
        hairline: "rgba(42, 33, 24, 0.12)",
        text: "#2A2118",
        muted: "rgba(42, 33, 24, 0.58)",
    },
}

function themeFor(t: any, dark: boolean): Theme {
    const preset = t?.preset || "system"
    if (preset === "custom") {
        const base = THEMES.midnight
        const out: any = {}
        for (const k of Object.keys(base)) out[k] = t?.[k] || (base as any)[k]
        return out
    }
    if (preset === "system")
        return dark
            ? THEMES[t?.darkPreset || "midnight"]
            : THEMES[t?.lightPreset || "frost"]
    return THEMES[preset] || THEMES.midnight
}

function prefersDark(): boolean {
    if (typeof document !== "undefined") {
        const attr =
            document.body?.getAttribute("data-framer-theme") ||
            document.documentElement?.getAttribute("data-framer-theme") ||
            document.documentElement?.getAttribute("data-theme")
        if (attr === "dark") return true
        if (attr === "light") return false
    }
    if (typeof window !== "undefined" && window.matchMedia)
        return window.matchMedia("(prefers-color-scheme: dark)").matches
    return true
}

const CATEGORY_INKS = [
    "#FF6A3D",
    "#4C8DFF",
    "#2EC4A0",
    "#F5B83D",
    "#B07CFF",
    "#FF5C8A",
    "#4FD1E6",
    "#94D15A",
]

const RAMPS: Record<string, string[]> = {
    thermal: ["#2A1B5E", "#6B1F7C", "#C42F6A", "#FF6A3D", "#FFC15C", "#FFF5DA"],
    spectrum: [
        "#1A3A8F",
        "#1EA4C6",
        "#3ECF8E",
        "#E9E14B",
        "#FF8A2B",
        "#FF3D3D",
    ],
    aurora: ["#0F3B4A", "#127A7A", "#2BC4A0", "#9BEA8F", "#E9F7C4", "#FFFFFF"],
    ember: ["#3A1408", "#7A240C", "#C43D12", "#FF6A3D", "#FFB27A", "#FFF1E4"],
    ice: ["#0B2447", "#19376D", "#2F6BFF", "#5FA8FF", "#A5D7FF", "#F0FAFF"],
}

function rampStops(palette: string, accent: RGBA, ink: RGBA): RGBA[] {
    if (palette === "accent") return [accent, ink]
    return (RAMPS[palette] || RAMPS.thermal).map((h) =>
        readColor(h, [0, 0, 0, 1])
    )
}

function rampAt(stops: RGBA[], land: RGBA, u: number): RGBA {
    const lead = 0.14
    if (u <= lead) return blend(land, stops[0], u / lead)
    const k = ((u - lead) / (1 - lead)) * (stops.length - 1)
    const j = Math.min(stops.length - 2, Math.floor(k))
    return blend(stops[j], stops[j + 1], k - j)
}

function rampCss(stops: RGBA[], land: RGBA) {
    const marks = [0, 0.14, 0.3, 0.45, 0.6, 0.75, 0.88, 1]
    return `linear-gradient(90deg, ${marks
        .map((m) => `${cssOf(rampAt(stops, land, m))} ${Math.round(m * 100)}%`)
        .join(", ")})`
}

const TONES = 26
const DUSK = 6
const HEAT = 40

type Inks = {
    table: string[]
    heat: string[]
    lit: string
    accent: string
    background: string
    ocean: string
    landRGBA: RGBA
    stops: RGBA[]
}

function buildInks(theme: Theme, palette: string): Inks {
    const bg = readColor(theme.background, [10, 11, 13, 1])
    const land = readColor(theme.land, [74, 80, 89, 1])
    const lit = readColor(theme.highlight, [242, 238, 230, 1])
    const night = readColor(theme.night, [33, 36, 42, 1])
    const accent = readColor(theme.accent, [255, 106, 61, 1])
    const table: string[] = []
    for (let d = 0; d < DUSK; d++) {
        const baseTone = blend(land, night, d / (DUSK - 1))
        for (let t = 0; t < TONES; t++)
            table.push(cssOf(blend(baseTone, lit, (t / (TONES - 1)) * 0.85)))
    }
    const stops = rampStops(palette, accent, lit)
    const heat: string[] = []
    for (let t = 0; t < HEAT; t++)
        heat.push(cssOf(rampAt(stops, land, t / (HEAT - 1))))
    return {
        table,
        heat,
        lit: cssOf(lit),
        accent: cssOf(accent),
        background: bg[3] > 0 ? cssOf(bg) : "",
        ocean: cssOf(readColor(theme.ocean, [28, 31, 36, 1])),
        landRGBA: land,
        stops,
    }
}

/* ------------------------------------------------------------------------ */
/* Regions                                                                   */
/* ------------------------------------------------------------------------ */

type Box = { w: number; e: number; s: number; n: number }

const REGIONS: Record<string, Box> = {
    world: { w: -180, e: 180, s: -58, n: 82 },
    northAmerica: { w: -168, e: -50, s: 8, n: 72 },
    southAmerica: { w: -95, e: -30, s: -56, n: 14 },
    europe: { w: -25, e: 45, s: 34, n: 71 },
    africa: { w: -20, e: 55, s: -36, n: 38 },
    middleEast: { w: 24, e: 64, s: 11, n: 42 },
    asia: { w: 25, e: 150, s: -10, n: 72 },
    oceania: { w: 108, e: 180, s: -48, n: 2 },
}

function viewFor(view: any, spots: Spot[]): Box {
    const region = view?.region || "fit"
    if (region === "custom") {
        const z = clamp(view?.zoom ?? 1.6, 1, 12)
        const lon = wrapDeg(view?.centerLongitude ?? 0)
        const lat = clamp(view?.centerLatitude ?? 25, -50, 75)
        const hw = 180 / z
        const hh = 70 / z
        return { w: lon - hw, e: lon + hw, s: lat - hh, n: lat + hh }
    }
    if (region === "fit" && spots.length) {
        let w = Infinity
        let e = -Infinity
        let s = Infinity
        let n = -Infinity
        for (const p of spots) {
            if (p.lon < w) w = p.lon
            if (p.lon > e) e = p.lon
            if (p.lat < s) s = p.lat
            if (p.lat > n) n = p.lat
        }
        const pad = clamp(view?.padding ?? 14, 0, 60)
        w -= pad
        e += pad
        s -= pad * 0.7
        n += pad * 0.7
        if (e - w < 36) {
            const c = (w + e) / 2
            w = c - 18
            e = c + 18
        }
        if (n - s < 20) {
            const c = (n + s) / 2
            s = c - 10
            n = c + 10
        }
        if (e - w > 360) {
            w = -180
            e = 180
        }
        return { w, e, s: Math.max(-60, s), n: Math.min(84, n) }
    }
    return REGIONS[region] || REGIONS.world
}

/* ------------------------------------------------------------------------ */
/* Data — list, CSV or JSON, all provided directly in the property controls  */
/* ------------------------------------------------------------------------ */

type Spot = {
    title: string
    caption: string
    lat: number
    lon: number
    raw: number
    value: number
    category: string
    color: string
    src: string
    alt: string
    link: string
}

const FIELD_NAMES: Record<string, string[]> = {
    title: ["title", "name", "city", "label", "location", "place"],
    caption: [
        "caption",
        "description",
        "desc",
        "subtitle",
        "address",
        "summary",
    ],
    lat: ["lat", "latitude", "y"],
    lon: ["lng", "lon", "long", "longitude", "x"],
    value: ["value", "count", "amount", "total", "score", "heat", "weight"],
    category: ["category", "group", "type", "tag", "segment"],
    color: ["color", "colour", "pincolor"],
    image: ["imageurl", "image", "image_url", "img", "photo", "thumbnail"],
    link: ["link", "url", "href", "website"],
}

function field(row: Record<string, any>, key: string) {
    const names = FIELD_NAMES[key]
    for (const k of Object.keys(row)) {
        const low = k.toLowerCase().replace(/[\s-]/g, "")
        if (names.includes(low)) {
            const v = row[k]
            if (v !== undefined && v !== null && v !== "") return v
        }
    }
    return undefined
}

function toSpot(row: Record<string, any>): Spot | null {
    const lat = parseFloat(field(row, "lat"))
    const lon = parseFloat(field(row, "lon"))
    if (!isFinite(lat) || !isFinite(lon)) return null
    const img = field(row, "image")
    const raw = parseFloat(
        String(field(row, "value") ?? "").replace(/[^0-9.\-]/g, "")
    )
    return {
        title: String(field(row, "title") ?? ""),
        caption: String(field(row, "caption") ?? ""),
        lat: clamp(lat, -59, 83),
        lon: wrapDeg(lon),
        raw: isFinite(raw) ? raw : NaN,
        value: 0,
        category: String(field(row, "category") ?? "").trim(),
        color: String(field(row, "color") ?? ""),
        src: typeof img === "object" ? img?.src || "" : String(img ?? ""),
        alt: typeof img === "object" ? img?.alt || "" : "",
        link: String(field(row, "link") ?? ""),
    }
}

function parseCSV(text: string): Record<string, string>[] {
    const rows: string[][] = []
    let row: string[] = []
    let cell = ""
    let quoted = false
    const src = String(text || "").replace(/^\uFEFF/, "")
    const delim =
        (src.split("\n")[0].match(/;/g) || []).length >
        (src.split("\n")[0].match(/,/g) || []).length
            ? ";"
            : ","
    for (let i = 0; i < src.length; i++) {
        const ch = src[i]
        if (quoted) {
            if (ch === '"') {
                if (src[i + 1] === '"') {
                    cell += '"'
                    i++
                } else quoted = false
            } else cell += ch
        } else if (ch === '"') quoted = true
        else if (ch === delim) {
            row.push(cell)
            cell = ""
        } else if (ch === "\n" || ch === "\r") {
            if (ch === "\r" && src[i + 1] === "\n") i++
            row.push(cell)
            rows.push(row)
            row = []
            cell = ""
        } else cell += ch
    }
    if (cell !== "" || row.length) {
        row.push(cell)
        rows.push(row)
    }
    const body = rows.filter((r) => r.some((c) => c.trim() !== ""))
    if (body.length < 2) return []
    const head = body[0].map((h) => h.trim())
    return body.slice(1).map((r) => {
        const o: Record<string, string> = {}
        head.forEach((h, i) => (o[h] = (r[i] ?? "").trim()))
        return o
    })
}

function parseJSON(text: string): Record<string, any>[] {
    try {
        const v = JSON.parse(text)
        if (Array.isArray(v)) return v
        for (const k of [
            "data",
            "locations",
            "items",
            "points",
            "markers",
            "features",
        ]) {
            if (Array.isArray(v?.[k])) {
                if (k === "features")
                    return v[k].map((f: any) => ({
                        ...(f.properties || {}),
                        longitude: f.geometry?.coordinates?.[0],
                        latitude: f.geometry?.coordinates?.[1],
                    }))
                return v[k]
            }
        }
    } catch {}
    return []
}

function listRows(list: any[] | undefined): Record<string, any>[] {
    return (list || []).map((e: any) => ({
        title: e?.title,
        caption: e?.caption,
        latitude: e?.latitude,
        longitude: e?.longitude,
        value: e?.value,
        category: e?.category,
        color: e?.color,
        image: e?.imageURL || e?.image?.src || "",
        link: e?.link,
    }))
}

function finishSpots(list: (Spot | null)[]): Spot[] {
    const spots = list.filter(Boolean) as Spot[]
    let top = 0
    for (const s of spots) if (isFinite(s.raw) && s.raw > top) top = s.raw
    for (const s of spots)
        s.value = isFinite(s.raw) && top > 0 ? clamp(s.raw / top, 0, 1) : 0.6
    return spots
}

function spotsFrom(p: any): Spot[] {
    const data = p.data || {}
    const source = data.source || "list"
    if (source === "csv")
        return finishSpots(parseCSV(data.csv || "").map(toSpot))
    if (source === "json")
        return finishSpots(parseJSON(data.json || "").map(toSpot))
    return finishSpots(listRows(p.locations).map(toSpot))
}

function categoriesOf(spots: Spot[]): string[] {
    const out: string[] = []
    for (const s of spots)
        if (s.category && !out.includes(s.category)) out.push(s.category)
    return out
}

function heatField(
    sh: Sheet,
    spots: Spot[],
    spread: number,
    strength: number
): Float32Array {
    const out = new Float32Array(sh.cols * sh.rows)
    if (!spots.length) return out
    const inv = 1 / (2 * spread * spread)
    for (let r = 0; r < sh.rows; r++) {
        const lat = NORTH - (r + 0.5) * sh.deg
        const squeeze = Math.cos(lat * RAD)
        for (let c = 0; c < sh.cols; c++) {
            const lon = -180 + (c + 0.5) * sh.deg
            let sum = 0
            for (let k = 0; k < spots.length; k++) {
                const m = spots[k]
                const dLon = wrapDeg(lon - m.lon) * squeeze
                const dLat = lat - m.lat
                const q = (dLon * dLon + dLat * dLat) * inv
                if (q < 9) sum += m.value * Math.exp(-q)
            }
            const i = r * sh.cols + c
            out[i] =
                (1 - Math.exp(-sum * 1.7 * strength)) *
                (0.86 + sh.grain[i] * 0.28)
        }
    }
    return out
}

function formatValue(n: number, card: any) {
    if (!isFinite(n)) return ""
    const body =
        Math.abs(n) >= 1000 && card?.compact !== false
            ? new Intl.NumberFormat(undefined, {
                  notation: "compact",
                  maximumFractionDigits: 1,
              }).format(n)
            : new Intl.NumberFormat(undefined, {
                  maximumFractionDigits: 2,
              }).format(n)
    return `${card?.prefix || ""}${body}${card?.suffix || ""}`
}

function coordLabel(lat: number, lon: number) {
    return `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}  ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? "E" : "W"}`
}

/* ------------------------------------------------------------------------ */
/* Sun + routes                                                              */
/* ------------------------------------------------------------------------ */

function duskField(sh: Sheet): Float32Array {
    const d = new Date()
    const yearStart = Date.UTC(d.getUTCFullYear(), 0, 0)
    const day = (d.getTime() - yearStart) / 864e5
    const tilt = -23.44 * Math.cos(((2 * Math.PI) / 365) * (day + 10)) * RAD
    const hours = d.getUTCHours() + d.getUTCMinutes() / 60
    const sunLon = (12 - hours) * 15 * RAD
    const out = new Float32Array(sh.cols * sh.rows)
    const sT = Math.sin(tilt)
    const cT = Math.cos(tilt)
    for (let r = 0; r < sh.rows; r++) {
        const la = (NORTH - (r + 0.5) * sh.deg) * RAD
        const a = Math.sin(la) * sT
        const b = Math.cos(la) * cT
        for (let c = 0; c < sh.cols; c++) {
            const lo = (-180 + (c + 0.5) * sh.deg) * RAD
            const z = a + b * Math.cos(lo - sunLon)
            out[r * sh.cols + c] = clamp((0.06 - z) / 0.2, 0, 1)
        }
    }
    return out
}

function toVec(lon: number, lat: number) {
    const a = lat * RAD
    const o = lon * RAD
    return [Math.cos(a) * Math.cos(o), Math.cos(a) * Math.sin(o), Math.sin(a)]
}

function traceArc(a: Spot, b: Spot, sh: Sheet): number[] {
    const p = toVec(a.lon, a.lat)
    const q = toVec(b.lon, b.lat)
    const dot = clamp(p[0] * q[0] + p[1] * q[1] + p[2] * q[2], -1, 1)
    const ang = Math.acos(dot)
    const steps = Math.max(2, Math.ceil((ang / RAD / sh.deg) * 2.2))
    const sinA = Math.sin(ang) || 1
    const cells: number[] = []
    let prevC = NaN
    let lastKeyC = NaN
    let lastKeyR = NaN
    for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const wa = ang < 1e-6 ? 1 - t : Math.sin((1 - t) * ang) / sinA
        const wb = ang < 1e-6 ? t : Math.sin(t * ang) / sinA
        const x = p[0] * wa + q[0] * wb
        const y = p[1] * wa + q[1] * wb
        const z = p[2] * wa + q[2] * wb
        const lat = Math.atan2(z, Math.hypot(x, y)) / RAD
        const lon = Math.atan2(y, x) / RAD
        let c = (lon + 180) / sh.deg
        if (!isNaN(prevC)) {
            while (c - prevC > sh.cols / 2) c -= sh.cols
            while (prevC - c > sh.cols / 2) c += sh.cols
        }
        prevC = c
        const cc = Math.floor(c)
        const rr = clamp(Math.floor((NORTH - lat) / sh.deg), 0, sh.rows - 1)
        if (cc !== lastKeyC || rr !== lastKeyR) {
            cells.push(cc, rr)
            lastKeyC = cc
            lastKeyR = rr
        }
    }
    return cells
}

/* ------------------------------------------------------------------------ */
/* Visibility + motion preference                                            */
/* ------------------------------------------------------------------------ */

function useOnScreen(ref: React.RefObject<HTMLElement>) {
    const [on, setOn] = useState(false)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        let seen = false
        let tabOpen = typeof document === "undefined" ? true : !document.hidden
        const sync = () => setOn(seen && tabOpen)
        let io: IntersectionObserver | null = null
        if (typeof IntersectionObserver === "undefined") {
            seen = true
            sync()
        } else {
            io = new IntersectionObserver(
                (list) => {
                    seen = list.some((e) => e.isIntersecting)
                    sync()
                },
                { threshold: 0 }
            )
            io.observe(el)
        }
        const onTab = () => {
            tabOpen = !document.hidden
            sync()
        }
        document.addEventListener("visibilitychange", onTab)
        return () => {
            if (io) io.disconnect()
            document.removeEventListener("visibilitychange", onTab)
        }
    }, [])
    return on
}

function useCalmPreference() {
    const [calm, setCalm] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const q = window.matchMedia("(prefers-reduced-motion: reduce)")
        const set = () => setCalm(q.matches)
        set()
        if (q.addEventListener) q.addEventListener("change", set)
        else q.addListener(set)
        return () => {
            if (q.removeEventListener) q.removeEventListener("change", set)
            else q.removeListener(set)
        }
    }, [])
    return calm
}

/* Theme changes — colour styles, light/dark mode, page attributes */
function useThemeTick() {
    const [tick, setTick] = useState(0)
    useEffect(() => {
        const bump = () => setTick((t) => t + 1)
        bump()
        let mq: MediaQueryList | null = null
        if (typeof window !== "undefined" && window.matchMedia) {
            mq = window.matchMedia("(prefers-color-scheme: dark)")
            if (mq.addEventListener) mq.addEventListener("change", bump)
            else mq.addListener(bump)
        }
        let mo: MutationObserver | null = null
        if (typeof MutationObserver !== "undefined") {
            mo = new MutationObserver(bump)
            const opts = {
                attributes: true,
                attributeFilter: [
                    "class",
                    "style",
                    "data-framer-theme",
                    "data-theme",
                ],
            }
            mo.observe(document.documentElement, opts)
            if (document.body) mo.observe(document.body, opts)
        }
        return () => {
            if (mq) {
                if (mq.removeEventListener)
                    mq.removeEventListener("change", bump)
                else mq.removeListener(bump)
            }
            if (mo) mo.disconnect()
        }
    }, [])
    return tick
}

function pinInkFor(
    s: Spot,
    cats: string[],
    mode: string,
    theme: Theme,
    inks: Inks
): string {
    if (s.color) return s.color
    if (mode === "category" && s.category)
        return CATEGORY_INKS[cats.indexOf(s.category) % CATEGORY_INKS.length]
    if (mode === "value")
        return cssOf(rampAt(inks.stops, inks.landRGBA, 0.4 + s.value * 0.6))
    if (mode === "accent") return theme.accent
    return theme.highlight
}

/* ------------------------------------------------------------------------ */
/* Entry                                                                     */
/* ------------------------------------------------------------------------ */

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Petitpoint(props: any) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StaticView {...props} />
    return <LiveView {...props} />
}

/* ------------------------------------------------------------------------ */
/* Static (canvas / export) view — plain markup only                         */
/* ------------------------------------------------------------------------ */

function StaticView(p: any) {
    const view = p.view || {}
    const layers = p.layers || {}
    const hm = p.heatmap || {}
    const mk = p.markers || {}
    const ui = p.ui || {}
    const mono = p.monoFont || {}
    const theme = themeFor(p.theme, prefersDark())
    const inks = buildInks(theme, hm.palette || "thermal")
    const sh = sheetFor(DETAIL[view.detail] || 2)
    const spots = spotsFrom(p)
    const cats = categoriesOf(spots)
    const box = viewFor(view, spots)
    const deg = sh.deg
    const vx = (box.w + 180) / deg
    const vy = (NORTH - box.n) / deg
    const vw = (box.e - box.w) / deg
    const vh = (box.n - box.s) / deg
    const approx = Math.min(700 / vw, 700 / vh)
    const gap = clamp(view.gap ?? 0.22, 0, 0.8)
    const size = 1 - gap
    const o = gap / 2
    const round = view.shape === "dot"
    const field =
        layers.heatmap !== false
            ? heatField(sh, spots, hm.spread ?? 13, hm.strength ?? 1)
            : null
    const LEVELS = 14
    const bands: string[] = new Array(LEVELS).fill("")

    let land = ""
    let sea = ""
    const cell = (x: number, r: number) =>
        round
            ? `M${(x + 0.5 - size / 2).toFixed(2)} ${r + 0.5}a${(size / 2).toFixed(2)} ${(size / 2).toFixed(2)} 0 1 0 ${size.toFixed(2)} 0a${(size / 2).toFixed(2)} ${(size / 2).toFixed(2)} 0 1 0 -${size.toFixed(2)} 0`
            : `M${(x + o).toFixed(2)} ${(r + o).toFixed(2)}h${size.toFixed(2)}v${size.toFixed(2)}h-${size.toFixed(2)}z`
    for (let r = 0; r < sh.rows; r++) {
        for (let c = 0; c < sh.cols; c++) {
            const i = r * sh.cols + c
            if (sh.land[i]) {
                const lv = field
                    ? Math.round(clamp(field[i], 0, 1) * (LEVELS - 1))
                    : 0
                if (lv > 0) bands[lv] += cell(c, r)
                else land += cell(c, r)
            } else if (view.oceanGrid !== false) {
                sea += `M${(c + 0.43).toFixed(2)} ${(r + 0.43).toFixed(2)}h0.14v0.14h-0.14z`
            }
        }
    }
    const copies = vw < sh.cols - 0.5 ? [-sh.cols, 0, sh.cols] : [0]
    const pinCells = (20 * clamp(mk.size ?? 1, 0.5, 2.5)) / Math.max(2, approx)
    const showLegend = layers.heatmap !== false && hm.legend !== false
    const showChips = ui.filters !== false && cats.length > 1

    return (
        <div
            style={{
                ...p.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: theme.background,
                borderRadius: ui.radius ?? 0,
            }}
        >
            <svg
                viewBox={`${vx.toFixed(2)} ${vy.toFixed(2)} ${vw.toFixed(2)} ${vh.toFixed(2)}`}
                preserveAspectRatio="xMidYMid meet"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                    overflow: "visible",
                }}
            >
                {copies.map((dx) => (
                    <g key={dx} transform={`translate(${dx} 0)`}>
                        {sea && <path d={sea} style={{ fill: theme.ocean }} />}
                        <path d={land} style={{ fill: theme.land }} />
                        {bands.map((d, lv) =>
                            d ? (
                                <path
                                    key={lv}
                                    d={d}
                                    fill={
                                        inks.heat[
                                            Math.round(
                                                (lv / (LEVELS - 1)) * (HEAT - 1)
                                            )
                                        ]
                                    }
                                />
                            ) : null
                        )}
                        {layers.markers !== false &&
                            spots.map((s, i) => {
                                const x = (s.lon + 180) / deg
                                const y = (NORTH - s.lat) / deg
                                const k = mk.sizeByValue
                                    ? 0.75 + s.value * 0.6
                                    : 1
                                const pc = pinCells * k
                                const ink = pinInkFor(
                                    s,
                                    cats,
                                    mk.colorBy || "theme",
                                    theme,
                                    inks
                                )
                                return (
                                    <g key={i}>
                                        <rect
                                            x={x - pc / 2 - 0.2}
                                            y={y - pc / 2 - 0.2}
                                            width={pc + 0.4}
                                            height={pc + 0.4}
                                            style={{ fill: theme.background }}
                                        />
                                        <rect
                                            x={x - pc / 2 + 0.08}
                                            y={y - pc / 2 + 0.08}
                                            width={pc - 0.16}
                                            height={pc - 0.16}
                                            fill="none"
                                            style={{ stroke: ink }}
                                            strokeWidth={0.16}
                                        />
                                        <rect
                                            x={x - pc * 0.19}
                                            y={y - pc * 0.19}
                                            width={pc * 0.38}
                                            height={pc * 0.38}
                                            style={{ fill: ink }}
                                        />
                                    </g>
                                )
                            })}
                    </g>
                ))}
            </svg>
            {ui.readout !== false && (
                <div
                    style={{
                        position: "absolute",
                        top: 14,
                        left: 14,
                        padding: "7px 10px",
                        borderRadius: 6,
                        background: theme.panel,
                        border: `1px solid ${theme.hairline}`,
                        color: theme.muted,
                        whiteSpace: "pre",
                        ...mono,
                    }}
                >
                    {coordLabel(
                        (box.n + box.s) / 2,
                        wrapDeg((box.w + box.e) / 2)
                    )}
                </div>
            )}
            {(showLegend || showChips) && (
                <div
                    style={{
                        position: "absolute",
                        left: 14,
                        bottom: 14,
                        maxWidth: "calc(100% - 28px)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 9,
                        padding: "9px 10px",
                        borderRadius: 6,
                        background: theme.panel,
                        border: `1px solid ${theme.hairline}`,
                        color: theme.muted,
                        ...mono,
                    }}
                >
                    {showChips && (
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 6,
                            }}
                        >
                            {["", ...cats].map((c) => (
                                <span
                                    key={c || "all"}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "4px 7px",
                                        borderRadius: 4,
                                        border: `1px solid ${c ? theme.hairline : theme.highlight}`,
                                        color: c ? theme.muted : theme.text,
                                    }}
                                >
                                    {c && (
                                        <span
                                            style={{
                                                width: 6,
                                                height: 6,
                                                background:
                                                    (mk.colorBy || "theme") ===
                                                    "category"
                                                        ? CATEGORY_INKS[
                                                              cats.indexOf(c) %
                                                                  CATEGORY_INKS.length
                                                          ]
                                                        : theme.muted,
                                            }}
                                        />
                                    )}
                                    {c || ui.allLabel || "All"}
                                </span>
                            ))}
                        </div>
                    )}
                    {showLegend && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                            }}
                        >
                            <div
                                style={{
                                    width: 140,
                                    height: 6,
                                    borderRadius: 1,
                                    background: rampCss(
                                        inks.stops,
                                        inks.landRGBA
                                    ),
                                }}
                            />
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    width: 140,
                                }}
                            >
                                <span>{hm.lowLabel || "Low"}</span>
                                <span>{hm.highLabel || "High"}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

/* ------------------------------------------------------------------------ */
/* Live view                                                                 */
/* ------------------------------------------------------------------------ */

const INTRO_END = 1.75
const THEME_KEYS = [
    "background",
    "land",
    "night",
    "highlight",
    "ocean",
    "accent",
    "panel",
    "hairline",
    "text",
    "muted",
]

function LiveView(p: any) {
    const scope = "pp" + useId().replace(/[^a-zA-Z0-9]/g, "")
    const hostRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const cardRef = useRef<HTMLDivElement>(null)
    const readRef = useRef<HTMLSpanElement>(null)
    const probeRef = useRef<HTMLSpanElement>(null)

    const onScreen = useOnScreen(hostRef)
    const calm = useCalmPreference()
    const tick = useThemeTick()

    const view = p.view || {}
    const layers = p.layers || {}
    const hm = p.heatmap || {}
    const mk = p.markers || {}
    const cardCfg = p.card || {}
    const tour = p.tour || {}
    const ui = p.ui || {}
    const data = p.data || {}
    const mono = p.monoFont || {}
    const type = p.font || {}

    /* theme — resolved through the DOM so colour styles and light/dark follow */
    const dark = useMemo(() => prefersDark(), [tick])
    const themeKey = JSON.stringify(p.theme || {})
    const theme = useMemo(() => themeFor(p.theme, dark), [themeKey, dark])
    const solid = useMemo(() => {
        const probe = probeRef.current
        const out: any = {}
        for (const k of THEME_KEYS) {
            const v = (theme as any)[k]
            if (probe && typeof v === "string" && v.indexOf("var(") >= 0) {
                probe.style.color = ""
                probe.style.color = v
                out[k] = getComputedStyle(probe).color || v
            } else out[k] = v
        }
        return out as Theme
    }, [theme, tick])
    const resolve = useCallback(
        (v: string) => {
            const probe = probeRef.current
            if (!probe || !v || v.indexOf("var(") < 0) return v
            probe.style.color = ""
            probe.style.color = v
            return getComputedStyle(probe).color || v
        },
        [tick]
    )

    /* data — read only from the property controls, never fetched */
    const source = data.source || "list"
    const listKey = JSON.stringify(p.locations || [])
    const allSpots = useMemo(
        () => spotsFrom(p),
        [listKey, source, data.csv, data.json]
    )
    const cats = useMemo(() => categoriesOf(allSpots), [allSpots])
    const [filter, setFilter] = useState("")
    useEffect(() => {
        if (filter && !cats.includes(filter)) setFilter("")
    }, [cats, filter])
    const spots = useMemo(
        () =>
            filter ? allSpots.filter((s) => s.category === filter) : allSpots,
        [allSpots, filter]
    )

    const sheet = useMemo(
        () => sheetFor(DETAIL[view.detail] || 2),
        [view.detail]
    )
    const palette = hm.palette || "thermal"
    const inks = useMemo(() => buildInks(solid, palette), [solid, palette])
    const gradient = useMemo(() => rampCss(inks.stops, inks.landRGBA), [inks])
    const colorBy = mk.colorBy || "theme"
    const pinInks = useMemo(
        () =>
            spots.map((s) => resolve(pinInkFor(s, cats, colorBy, solid, inks))),
        [spots, cats, colorBy, solid, inks, resolve]
    )
    const heatOn = layers.heatmap !== false
    const field = useMemo(
        () =>
            heatOn
                ? heatField(sheet, spots, hm.spread ?? 13, hm.strength ?? 1)
                : null,
        [heatOn, sheet, spots, hm.spread, hm.strength]
    )
    const routes = useMemo(() => {
        const out: number[][] = []
        if (!layers.routes || spots.length < 2) return out
        for (let i = 0; i < spots.length - 1; i++)
            out.push(traceArc(spots[i], spots[i + 1], sheet))
        if (layers.closeLoop && spots.length > 2)
            out.push(traceArc(spots[spots.length - 1], spots[0], sheet))
        return out
    }, [spots, sheet, layers.routes, layers.closeLoop])
    const viewKey = JSON.stringify(view)
    const target = useMemo(() => viewFor(view, spots), [viewKey, spots])

    const live = useRef<any>({})
    live.current = {
        p,
        sheet,
        inks,
        solid,
        spots,
        pinInks,
        routes,
        calm,
        onScreen,
        field,
        target,
    }

    const [picked, setPicked] = useState(-1)
    const pickedRef = useRef(-1)

    const st = useRef<any>(null)
    if (!st.current) {
        st.current = {
            w: 0,
            h: 0,
            dpr: 1,
            px: -999,
            py: -999,
            inside: false,
            press: null as any,
            born: -1,
            prev: 0,
            hover: -1,
            dusk: null as Float32Array | null,
            duskAt: 0,
            duskKey: -1,
            frame: 0,
            geo: null as any,
            pins: [] as { x: number; y: number; r: number }[],
            lastUser: 0,
            readText: "",
            cam: null as Box | null,
        }
    }

    /* ---------------- the frame ---------------- */

    const paint = useCallback((now: number): boolean => {
        const S = st.current
        const L = live.current
        const P = L.p
        const G: Sheet = L.sheet
        const K: Inks = L.inks
        const T: Theme = L.solid
        const SP: Spot[] = L.spots
        const still: boolean = L.calm
        const cv = canvasRef.current
        if (!cv) return false
        const ctx = cv.getContext("2d")
        if (!ctx || S.w < 2 || S.h < 2) return false
        const W = S.w
        const H = S.h
        const vw = P.view || {}
        const ly = P.layers || {}
        const HM = P.heatmap || {}
        const MK = P.markers || {}
        const UI = P.ui || {}
        const fnt = P.monoFont || {}
        const step = Math.min(50, S.prev ? now - S.prev : 16)
        S.prev = now
        const secs = now / 1000
        let more = false

        if (S.born < 0) S.born = now
        const intro = still || UI.intro === "none" ? 99 : (now - S.born) / 1000
        if (intro < INTRO_END) more = true

        /* camera eases between regions */
        const goal: Box = L.target
        if (!S.cam || still || vw.animate === false) S.cam = { ...goal }
        else {
            const k = 1 - Math.exp(-step / 170)
            let moving = false
            for (const key of ["w", "e", "s", "n"] as const) {
                const d = goal[key] - S.cam[key]
                if (Math.abs(d) > 0.02) {
                    S.cam[key] += d * k
                    moving = true
                } else S.cam[key] = goal[key]
            }
            if (moving) more = true
        }
        const cam: Box = S.cam

        /* geometry */
        const cols = G.cols
        const rows = G.rows
        const deg = G.deg
        const s = Math.max(
            0.5,
            Math.min(W / ((cam.e - cam.w) / deg), H / ((cam.n - cam.s) / deg))
        )
        const worldW = cols * s
        const roll = worldW > W + 0.5
        const lonC = (cam.w + cam.e) / 2
        const latC = (cam.n + cam.s) / 2
        const ox = roll ? W / 2 - ((lonC + 180) / deg) * s : (W - worldW) / 2
        const tall = rows * s
        const oy = clamp(
            H / 2 - ((NORTH - latC) / deg) * s,
            Math.min(0, H - tall),
            Math.max(0, H - tall)
        )
        S.geo = { s, ox, oy, roll, cols, rows, deg }
        const cFrom = roll ? Math.floor(-ox / s) - 1 : 0
        const cTo = roll ? Math.ceil((W - ox) / s) + 1 : cols - 1
        const rFrom = Math.max(0, Math.floor(-oy / s))
        const rTo = Math.min(rows - 1, Math.ceil((H - oy) / s))
        const midCol = (W / 2 - ox) / s

        /* daylight */
        const daylight = !!ly.daylight
        if (
            daylight &&
            (!S.dusk || S.duskKey !== G.key || Date.now() - S.duskAt > 30000)
        ) {
            S.dusk = duskField(G)
            S.duskKey = G.key
            S.duskAt = Date.now()
        }
        const dusk: Float32Array | null = daylight ? S.dusk : null

        /* heat */
        const F: Float32Array | null = L.field
        const breathe = !!F && HM.breathe !== false && !still
        if (breathe) more = true
        const reveal = still ? 1 : clamp((intro - 0.5) / 1.1, 0, 1)
        const fieldAt = (i: number) => {
            if (!F) return 0
            let f = F[i] * reveal
            if (breathe && f > 0.02)
                f *= 0.88 + 0.12 * Math.sin(secs * 1.6 - f * 5 + G.grain[i] * 3)
            return f > 1 ? 1 : f
        }

        /* clear */
        const dpr = S.dpr
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, W, H)
        if (K.background) {
            ctx.fillStyle = K.background
            ctx.fillRect(0, 0, W, H)
        }

        const style = UI.intro || "sweep"
        const halfDiag = Math.hypot(W, H) / 2
        const gap = clamp(vw.gap ?? 0.22, 0, 0.8)
        const unit = s * (1 - gap)
        const shape = vw.shape || "square"
        const arrival = (cx: number, cy: number, g: number) => {
            if (intro >= INTRO_END) return 1
            let d: number
            if (style === "bloom")
                d =
                    (Math.hypot(cx - W / 2, cy - H / 2) / halfDiag) * 0.85 +
                    g * 0.15
            else if (style === "rain") d = (cy / H) * 0.45 + g * 0.55
            else d = (cx / W) * 0.8 + g * 0.2
            return clamp((intro - d * 1.15) / 0.5, 0, 1)
        }

        /* sea grid */
        if (vw.oceanGrid !== false) {
            const dot = Math.max(1, s * 0.15)
            let sea = ""
            for (let cu = cFrom; cu <= cTo; cu++) {
                const c = roll ? modi(cu, cols) : cu
                const cx = ox + cu * s + s / 2
                if (cx < -s || cx > W + s) continue
                for (let r = rFrom; r <= rTo; r++) {
                    const i = r * cols + c
                    if (G.land[i]) continue
                    const cy = oy + r * s + s / 2
                    const a = arrival(cx, cy, G.grain[i])
                    if (a <= 0) continue
                    const t = HM.seaGlow !== false ? fieldAt(i) : 0
                    let fill = K.ocean
                    let z = dot * a
                    if (t > 0.06) {
                        fill = K.heat[Math.round(t * 0.62 * (HEAT - 1))]
                        z = dot + (unit * 0.42 - dot) * t
                    }
                    if (fill !== sea) {
                        ctx.fillStyle = fill
                        sea = fill
                    }
                    ctx.fillRect(cx - z / 2, cy - z / 2, z, z)
                }
            }
        }

        /* land */
        let ink = ""
        const round = shape === "dot"
        const soft = shape === "soft" && !!(ctx as any).roundRect
        for (let cu = cFrom; cu <= cTo; cu++) {
            const c = roll ? modi(cu, cols) : cu
            const cx = ox + cu * s + s / 2
            if (cx < -s || cx > W + s) continue
            for (let r = rFrom; r <= rTo; r++) {
                const i = r * cols + c
                if (!G.land[i]) continue
                const cy = oy + r * s + s / 2
                const a = arrival(cx, cy, G.grain[i])
                if (a <= 0) continue
                const t = fieldAt(i)
                const night = dusk ? Math.round(dusk[i] * (DUSK - 1)) : 0
                const fill =
                    t > 0.025
                        ? K.heat[Math.round(t * (HEAT - 1))]
                        : K.table[
                              night * TONES +
                                  Math.round(
                                      clamp(a < 1 ? (1 - a) * 0.9 : 0, 0, 1) *
                                          (TONES - 1)
                                  )
                          ]
                if (fill !== ink) {
                    ctx.fillStyle = fill
                    ink = fill
                }
                const z = unit * overshoot(a)
                if (round) {
                    ctx.beginPath()
                    ctx.arc(cx, cy, z / 2, 0, Math.PI * 2)
                    ctx.fill()
                } else if (soft) {
                    ctx.beginPath()
                    ;(ctx as any).roundRect(
                        cx - z / 2,
                        cy - z / 2,
                        z,
                        z,
                        z * 0.3
                    )
                    ctx.fill()
                } else {
                    ctx.fillRect(cx - z / 2, cy - z / 2, z, z)
                }
            }
        }

        /* routes */
        const RT: number[][] = L.routes
        if (ly.routes && RT.length) {
            const fade = still ? 1 : clamp((intro - 1.0) / 0.6, 0, 1)
            if (fade > 0) {
                ctx.fillStyle = K.accent
                const dot = Math.max(1.2, s * 0.2)
                const speed = ly.routeSpeed ?? 14
                for (let ri = 0; ri < RT.length; ri++) {
                    const cells = RT[ri]
                    const n = cells.length / 2
                    if (n < 2) continue
                    let lo = Infinity
                    let hi = -Infinity
                    for (let q = 0; q < cells.length; q += 2) {
                        if (cells[q] < lo) lo = cells[q]
                        if (cells[q] > hi) hi = cells[q]
                    }
                    const kFrom = roll ? Math.floor((cFrom - hi) / cols) : 0
                    const kTo = roll ? Math.ceil((cTo - lo) / cols) : 0
                    const head = still
                        ? -1
                        : (secs * speed + ri * 9.7) % (n + 14)
                    for (let kk = kFrom; kk <= kTo; kk++) {
                        const shift = kk * cols
                        ctx.globalAlpha = 0.4 * fade
                        for (let q = 0; q < cells.length; q += 2) {
                            const x = ox + (cells[q] + shift) * s + s / 2
                            if (x < -s || x > W + s) continue
                            const y = oy + cells[q + 1] * s + s / 2
                            ctx.fillRect(x - dot / 2, y - dot / 2, dot, dot)
                        }
                        if (head >= 0) {
                            for (let tail = 0; tail < 9; tail++) {
                                const idx = Math.floor(head) - tail
                                if (idx < 0 || idx >= n) continue
                                const x =
                                    ox + (cells[idx * 2] + shift) * s + s / 2
                                if (x < -s || x > W + s) continue
                                const y = oy + cells[idx * 2 + 1] * s + s / 2
                                ctx.globalAlpha = (1 - tail / 9) * fade
                                const z = Math.max(
                                    2,
                                    s *
                                        (tail === 0
                                            ? 0.62
                                            : 0.44 - tail * 0.025)
                                )
                                ctx.fillRect(x - z / 2, y - z / 2, z, z)
                            }
                        }
                    }
                }
                ctx.globalAlpha = 1
                if (!still) more = true
            }
        }

        /* markers */
        const sel = pickedRef.current
        const scale = clamp(MK.size ?? 1, 0.5, 2.5)
        const pins: { x: number; y: number; r: number }[] = []
        for (let i = 0; i < SP.length; i++) {
            const m = SP[i]
            let x = ox + ((m.lon + 180) / deg) * s
            if (roll) x += worldW * Math.round((W / 2 - x) / worldW)
            const y = oy + ((NORTH - m.lat) / deg) * s
            const k = MK.sizeByValue ? 0.75 + m.value * 0.6 : 1
            pins.push({ x, y, r: Math.round(20 * scale * k) })
        }
        S.pins = pins

        const showPins = ly.markers !== false
        const show = still ? 1 : clamp((intro - 0.8) / 0.5, 0, 1)
        if (showPins && show > 0) {
            const PI: string[] = L.pinInks
            const bgInk = K.background || T.background
            const tagMode = MK.labels || "hover"
            const kind = MK.style || "square"
            const drawTag = (
                i: number,
                x: number,
                y: number,
                plate: number
            ) => {
                const label = SP[i].title.toUpperCase()
                if (!label) return
                ctx.font = `600 10px ${fnt.fontFamily || "ui-monospace, monospace"}`
                const tw = ctx.measureText(label).width
                const bw = Math.ceil(tw + 16)
                let bx = Math.round(x + plate / 2 + 8)
                if (bx + bw > W - 6) bx = Math.round(x - plate / 2 - 8 - bw)
                const by = Math.round(y - 10)
                ctx.globalAlpha = show
                ctx.fillStyle = T.panel
                ctx.fillRect(bx, by, bw, 20)
                ctx.strokeStyle = T.hairline
                ctx.lineWidth = 1
                ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, 19)
                ctx.fillStyle = T.text
                ctx.textBaseline = "middle"
                ctx.fillText(label, bx + 8, by + 10.5)
            }
            const shapePath = (x: number, y: number, z: number) => {
                ctx.beginPath()
                if (kind === "dot" || kind === "ring")
                    ctx.arc(x, y, z / 2, 0, Math.PI * 2)
                else if (kind === "diamond") {
                    ctx.moveTo(x, y - z / 2)
                    ctx.lineTo(x + z / 2, y)
                    ctx.lineTo(x, y + z / 2)
                    ctx.lineTo(x - z / 2, y)
                    ctx.closePath()
                } else ctx.rect(x - z / 2, y - z / 2, z, z)
            }
            const order = SP.map((_, i) => i).sort(
                (a, b) => (a === sel ? 1 : 0) - (b === sel ? 1 : 0)
            )
            for (const i of order) {
                const pin = pins[i]
                if (
                    pin.x < -60 ||
                    pin.x > W + 60 ||
                    pin.y < -60 ||
                    pin.y > H + 60
                )
                    continue
                const x = Math.round(pin.x)
                const y = Math.round(pin.y)
                const chosen = sel === i
                const near = S.hover === i
                const tone = PI[i] || K.lit
                const pop = overshoot(show)
                const plate = pin.r

                if (MK.pulse !== false && !still) {
                    ctx.lineWidth = 1.5
                    for (let q = 0; q < 2; q++) {
                        const ph = (secs * 0.5 + q * 0.5 + i * 0.137) % 1
                        const z = plate + ph * plate * (chosen ? 2.6 : 1.8)
                        ctx.globalAlpha = (1 - ph) * (1 - ph) * 0.85 * show
                        ctx.strokeStyle = chosen ? K.accent : tone
                        shapePath(x, y, z)
                        ctx.stroke()
                    }
                    more = true
                }

                if (chosen) {
                    ctx.globalAlpha = 0.3 * show
                    ctx.strokeStyle = K.lit
                    ctx.lineWidth = 1
                    if (ctx.setLineDash) ctx.setLineDash([2, 5])
                    ctx.beginPath()
                    ctx.moveTo(0, y + 0.5)
                    ctx.lineTo(x - plate, y + 0.5)
                    ctx.moveTo(x + plate, y + 0.5)
                    ctx.lineTo(W, y + 0.5)
                    ctx.moveTo(x + 0.5, 0)
                    ctx.lineTo(x + 0.5, y - plate)
                    ctx.moveTo(x + 0.5, y + plate)
                    ctx.lineTo(x + 0.5, H)
                    ctx.stroke()
                    if (ctx.setLineDash) ctx.setLineDash([])
                }

                const size = Math.round(
                    plate * (chosen ? 1.25 : near ? 1.12 : 1) * pop
                )
                ctx.globalAlpha = show
                ctx.fillStyle = bgInk
                shapePath(x, y, size + 4)
                ctx.fill()
                ctx.strokeStyle = chosen ? K.accent : tone
                ctx.lineWidth = 1.5
                shapePath(x, y, size - 1.5)
                ctx.stroke()

                if (chosen) {
                    const b = size / 2 + 7
                    const arm = Math.max(4, size * 0.28)
                    ctx.strokeStyle = K.accent
                    ctx.beginPath()
                    for (const [sx, sy] of [
                        [-1, -1],
                        [1, -1],
                        [1, 1],
                        [-1, 1],
                    ]) {
                        const cx = x + sx * b
                        const cy = y + sy * b
                        ctx.moveTo(cx - sx * arm, cy)
                        ctx.lineTo(cx, cy)
                        ctx.lineTo(cx, cy - sy * arm)
                    }
                    ctx.stroke()
                }

                if (kind !== "ring" || chosen) {
                    const core = Math.max(
                        3,
                        Math.round(size * (chosen ? 0.46 : 0.38))
                    )
                    ctx.fillStyle = chosen ? K.accent : tone
                    shapePath(x, y, core)
                    ctx.fill()
                }

                if (
                    !chosen &&
                    (tagMode === "always" || (near && tagMode !== "none"))
                )
                    drawTag(i, x, y, plate)
            }
            ctx.globalAlpha = 1
        }

        /* card follows its pin */
        const card = cardRef.current
        if (card && sel >= 0 && pins[sel]) {
            const cw = card.offsetWidth || 240
            const ch = card.offsetHeight || 200
            const { x, y, r } = pins[sel]
            const off = r * 0.62 + 16
            let left = x + off
            if (left + cw > W - 12) left = x - off - cw
            left = clamp(left, 12, Math.max(12, W - cw - 12))
            const top = clamp(y - ch / 2, 12, Math.max(12, H - ch - 12))
            card.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`
        }

        /* readout */
        const rd = readRef.current
        if (rd) {
            let text = ""
            if (S.inside && S.px > -900) {
                const cf = (S.px - ox) / s
                const lon = wrapDeg(cf * deg - 180)
                const lat = NORTH - ((S.py - oy) / s) * deg
                const ci = roll ? modi(Math.floor(cf), cols) : Math.floor(cf)
                const ri = Math.floor((S.py - oy) / s)
                const onLand =
                    ci >= 0 &&
                    ci < cols &&
                    ri >= 0 &&
                    ri < rows &&
                    G.land[ri * cols + ci]
                text = `${coordLabel(clamp(lat, -90, 90), lon)}  ·  ${onLand ? "LAND" : "SEA"}`
            } else if (sel >= 0 && SP[sel]) {
                text = `${coordLabel(SP[sel].lat, SP[sel].lon)}  ·  ${pad2(sel + 1)}`
            } else {
                text = `${coordLabel(latC, wrapDeg(lonC))}  ·  ${pad2(SP.length)} ${UI.countLabel || "POINTS"}`
            }
            if (text !== S.readText) {
                rd.textContent = text
                S.readText = text
            }
        }

        return more
    }, [])

    const tickFrame = useCallback(
        (now: number) => {
            const S = st.current
            S.frame = 0
            if (!live.current.onScreen) {
                S.prev = 0
                return
            }
            const more = paint(now)
            if (more && live.current.onScreen)
                S.frame = requestAnimationFrame(tickFrame)
            else S.prev = 0
        },
        [paint]
    )

    const wake = useCallback(() => {
        const S = st.current
        if (S.frame || !live.current.onScreen) return
        S.frame = requestAnimationFrame(tickFrame)
    }, [tickFrame])

    useEffect(() => {
        const S = st.current
        if (onScreen) wake()
        else {
            if (S.frame) cancelAnimationFrame(S.frame)
            S.frame = 0
            S.prev = 0
            S.press = null
            S.inside = false
        }
    }, [onScreen, wake])

    useEffect(() => {
        return () => {
            const S = st.current
            if (S.frame) cancelAnimationFrame(S.frame)
            S.frame = 0
        }
    }, [])

    useEffect(() => {
        wake()
    })

    useEffect(() => {
        const host = hostRef.current
        const cv = canvasRef.current
        if (!host || !cv) return
        const fit = () => {
            const S = st.current
            const w = host.clientWidth
            const h = host.clientHeight
            const dpr = Math.min(2, window.devicePixelRatio || 1)
            if (w === S.w && h === S.h && dpr === S.dpr) return
            S.w = w
            S.h = h
            S.dpr = dpr
            cv.width = Math.max(1, Math.round(w * dpr))
            cv.height = Math.max(1, Math.round(h * dpr))
            wake()
        }
        fit()
        if (typeof ResizeObserver !== "undefined") {
            const ro = new ResizeObserver(fit)
            ro.observe(host)
            return () => ro.disconnect()
        }
        window.addEventListener("resize", fit)
        return () => window.removeEventListener("resize", fit)
    }, [wake])

    /* selection */
    const choose = useCallback(
        (i: number, byUser: boolean) => {
            const S = st.current
            if (byUser) S.lastUser = performance.now()
            const next = i >= 0 && i < live.current.spots.length ? i : -1
            pickedRef.current = next
            setPicked(next)
            wake()
        },
        [wake]
    )

    useEffect(() => {
        choose(-1, false)
    }, [filter, source])

    useEffect(() => {
        if (picked >= spots.length) choose(-1, false)
    }, [spots.length, picked, choose])

    const inFrame = (q: { x: number; y: number }) => {
        const S = st.current
        return q.x >= 8 && q.x <= S.w - 8 && q.y >= 8 && q.y <= S.h - 8
    }

    /* tour */
    useEffect(() => {
        if (
            !tour.autoplay ||
            !onScreen ||
            calm ||
            spots.length === 0 ||
            cardCfg.enabled === false
        )
            return
        const every = Math.max(1.5, tour.interval ?? 5) * 1000
        let id: any = 0
        const run = () => {
            const S = st.current
            const idle = performance.now() - S.lastUser
            if (S.lastUser && idle < every * 1.6) {
                id = setTimeout(run, every * 1.6 - idle)
                return
            }
            if (S.press) {
                id = setTimeout(run, every)
                return
            }
            const n = live.current.spots.length
            const pins = S.pins
            let next = -1
            for (let k = 1; k <= n; k++) {
                const j = (pickedRef.current + k + n) % n
                if (pins[j] && inFrame(pins[j])) {
                    next = j
                    break
                }
            }
            if (next >= 0) choose(next, false)
            id = setTimeout(run, every)
        }
        id = setTimeout(run, every * 0.6)
        return () => clearTimeout(id)
    }, [
        tour.autoplay,
        tour.interval,
        onScreen,
        calm,
        spots.length,
        choose,
        cardCfg.enabled,
    ])

    /* pointer */
    const local = (e: React.PointerEvent) => {
        const S = st.current
        const host = hostRef.current
        if (!host) return { x: 0, y: 0 }
        const b = host.getBoundingClientRect()
        const kx = b.width ? S.w / b.width : 1
        const ky = b.height ? S.h / b.height : 1
        return { x: (e.clientX - b.left) * kx, y: (e.clientY - b.top) * ky }
    }

    const pinAt = (x: number, y: number) => {
        const S = st.current
        if ((live.current.p.layers || {}).markers === false) return -1
        let best = -1
        let bestD = Infinity
        S.pins.forEach((q: any, i: number) => {
            if (!inFrame(q)) return
            const d = Math.hypot(q.x - x, q.y - y)
            if (d < Math.max(12, q.r * 0.75) && d < bestD) {
                bestD = d
                best = i
            }
        })
        return best
    }

    const onDown = (e: React.PointerEvent) => {
        if (e.button !== 0) return
        const S = st.current
        const { x, y } = local(e)
        S.press = { id: e.pointerId, x0: x, y0: y }
        S.lastUser = performance.now()
    }

    const onMove = (e: React.PointerEvent) => {
        const S = st.current
        const { x, y } = local(e)
        S.px = x
        S.py = y
        S.inside = true
        const over = pinAt(x, y)
        if (over !== S.hover) {
            S.hover = over
            const host = hostRef.current
            if (host) host.style.cursor = over >= 0 ? "pointer" : "default"
        }
        wake()
    }

    const onUp = (e: React.PointerEvent) => {
        const S = st.current
        const pr = S.press
        if (!pr || pr.id !== e.pointerId) return
        S.press = null
        const { x, y } = local(e)
        if (Math.hypot(x - pr.x0, y - pr.y0) > 8) return
        const hit = pinAt(x, y)
        const P = live.current.p
        if (hit >= 0) {
            const card = P.card || {}
            const spot = live.current.spots[hit]
            if (card.enabled === false && spot?.link) {
                window.open(spot.link, card.newTab ? "_blank" : "_self")
                return
            }
            if (card.enabled !== false)
                choose(hit === pickedRef.current ? -1 : hit, true)
        } else if (pickedRef.current >= 0) choose(-1, true)
        wake()
    }

    const onLeave = () => {
        const S = st.current
        S.inside = false
        S.hover = -1
        wake()
    }

    const onKey = (e: React.KeyboardEvent) => {
        const n = spots.length
        if (!n || cardCfg.enabled === false) return
        const hop = (dir: number) => {
            const pins = st.current.pins
            for (let k = 1; k <= n; k++) {
                const j = (pickedRef.current + dir * k + n * 2) % n
                if (pins[j] && inFrame(pins[j])) return j
            }
            return -1
        }
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault()
            choose(hop(1), true)
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault()
            choose(hop(-1), true)
        } else if (e.key === "Escape") {
            choose(-1, true)
        }
    }

    const cur = picked >= 0 && cardCfg.enabled !== false ? spots[picked] : null
    const cardW = cardCfg.width ?? 248
    const radius = ui.radius ?? 0
    const shield = (e: React.PointerEvent) => e.stopPropagation()
    const showLegend = heatOn && hm.legend !== false
    const showChips = ui.filters !== false && cats.length > 1
    const catInk = (c: string) =>
        colorBy === "category"
            ? CATEGORY_INKS[cats.indexOf(c) % CATEGORY_INKS.length]
            : theme.muted
    const curInk = cur
        ? pinInkFor(cur, cats, colorBy, theme, inks)
        : theme.accent

    return (
        <div
            ref={hostRef}
            tabIndex={0}
            role="application"
            aria-label={ui.ariaLabel || "Interactive world map"}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onPointerLeave={onLeave}
            onKeyDown={onKey}
            className={scope}
            style={{
                ...p.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: radius,
                background: theme.background,
                touchAction: "manipulation",
                outline: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
        >
            <style>{`
.${scope}-chip{transition:border-color .25s ease,color .25s ease,background-color .25s ease}
.${scope}-chip:hover{color:${theme.text}}
.${scope}-go{transition:gap .25s ease}
.${scope}-go:hover{gap:12px}
.${scope}:focus-visible{box-shadow:inset 0 0 0 1px ${theme.accent}}
`}</style>
            <span
                ref={probeRef}
                aria-hidden
                style={{
                    position: "absolute",
                    width: 0,
                    height: 0,
                    overflow: "hidden",
                    pointerEvents: "none",
                }}
            />

            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />

            {ui.readout !== false && (
                <div
                    style={{
                        position: "absolute",
                        top: 14,
                        left: 14,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "7px 10px",
                        borderRadius: 6,
                        background: theme.panel,
                        border: `1px solid ${theme.hairline}`,
                        color: theme.muted,
                        pointerEvents: "none",
                        whiteSpace: "pre",
                        ...mono,
                    }}
                >
                    <span
                        style={{
                            width: 6,
                            height: 6,
                            background: theme.accent,
                            flexShrink: 0,
                        }}
                    />
                    <span ref={readRef} />
                </div>
            )}

            {(showLegend || showChips) && (
                <div
                    onPointerDown={shield}
                    onPointerUp={shield}
                    style={{
                        position: "absolute",
                        left: 14,
                        bottom: 14,
                        maxWidth: "calc(100% - 28px)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 9,
                        padding: "9px 10px",
                        borderRadius: 6,
                        background: theme.panel,
                        border: `1px solid ${theme.hairline}`,
                        color: theme.muted,
                        zIndex: 2,
                        ...mono,
                    }}
                >
                    {showChips && (
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 6,
                            }}
                        >
                            {["", ...cats].map((c) => {
                                const on = filter === c
                                return (
                                    <button
                                        key={c || "all"}
                                        type="button"
                                        className={`${scope}-chip`}
                                        onClick={() => setFilter(c)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                            padding: "4px 7px",
                                            borderRadius: 4,
                                            cursor: "pointer",
                                            background: "transparent",
                                            border: `1px solid ${on ? theme.highlight : theme.hairline}`,
                                            color: on
                                                ? theme.text
                                                : theme.muted,
                                            ...mono,
                                        }}
                                    >
                                        {c && (
                                            <span
                                                style={{
                                                    width: 6,
                                                    height: 6,
                                                    background: catInk(c),
                                                }}
                                            />
                                        )}
                                        {c || ui.allLabel || "All"}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                    {showLegend && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                                pointerEvents: "none",
                            }}
                        >
                            <div
                                style={{
                                    width: 140,
                                    height: 6,
                                    borderRadius: 1,
                                    background: gradient,
                                }}
                            />
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    width: 140,
                                }}
                            >
                                <span>{hm.lowLabel || "Low"}</span>
                                <span>{hm.highLabel || "High"}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div
                ref={cardRef}
                onPointerDown={shield}
                onPointerMove={shield}
                onPointerUp={shield}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: cardW,
                    zIndex: 3,
                    pointerEvents: cur ? "auto" : "none",
                }}
            >
                <AnimatePresence mode="wait">
                    {cur && (
                        <motion.div
                            key={`${filter}-${picked}`}
                            initial={
                                calm
                                    ? { opacity: 0 }
                                    : {
                                          opacity: 0,
                                          y: 10,
                                          scale: 0.96,
                                          clipPath:
                                              "inset(0% 0% 100% 0% round 10px)",
                                      }
                            }
                            animate={
                                calm
                                    ? { opacity: 1 }
                                    : {
                                          opacity: 1,
                                          y: 0,
                                          scale: 1,
                                          clipPath:
                                              "inset(0% 0% 0% 0% round 10px)",
                                      }
                            }
                            exit={
                                calm
                                    ? { opacity: 0 }
                                    : { opacity: 0, y: 6, scale: 0.98 }
                            }
                            transition={{
                                type: "spring",
                                stiffness: 360,
                                damping: 34,
                                mass: 0.8,
                            }}
                            style={{
                                position: "relative",
                                width: "100%",
                                boxSizing: "border-box",
                                padding: 12,
                                borderRadius: 10,
                                background: theme.panel,
                                border: `1px solid ${theme.hairline}`,
                                boxShadow: "0 24px 60px -24px rgba(0,0,0,0.45)",
                                color: theme.text,
                            }}
                        >
                            {cur.src && cardCfg.showImage !== false && (
                                <div
                                    style={{
                                        position: "relative",
                                        width: "100%",
                                        aspectRatio: "16 / 10",
                                        borderRadius: 6,
                                        overflow: "hidden",
                                        marginBottom: 12,
                                        background: theme.ocean,
                                    }}
                                >
                                    <motion.img
                                        src={cur.src}
                                        alt={cur.alt || cur.title}
                                        initial={calm ? false : { scale: 1.12 }}
                                        animate={{ scale: 1 }}
                                        transition={{
                                            duration: 1.1,
                                            ease: [0.2, 0.8, 0.2, 1],
                                        }}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                        draggable={false}
                                    />
                                </div>
                            )}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 8,
                                    color: theme.muted,
                                    marginBottom: 8,
                                    paddingRight:
                                        cur.src && cardCfg.showImage !== false
                                            ? 0
                                            : 28,
                                    ...mono,
                                }}
                            >
                                <span
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 7,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 6,
                                            height: 6,
                                            background: curInk,
                                        }}
                                    />
                                    {cur.category ||
                                        `${pad2(picked + 1)} / ${pad2(spots.length)}`}
                                </span>
                                {cardCfg.showCoords !== false && (
                                    <span style={{ whiteSpace: "nowrap" }}>
                                        {coordLabel(cur.lat, cur.lon)}
                                    </span>
                                )}
                            </div>
                            {cur.title && (
                                <div
                                    style={{
                                        margin: 0,
                                        color: theme.text,
                                        ...type,
                                    }}
                                >
                                    {cur.title}
                                </div>
                            )}
                            {cur.caption && (
                                <div
                                    style={{
                                        marginTop: 6,
                                        color: theme.muted,
                                        fontFamily: type.fontFamily,
                                        fontSize: 13,
                                        lineHeight: 1.45,
                                    }}
                                >
                                    {cur.caption}
                                </div>
                            )}
                            {cardCfg.meter !== false && isFinite(cur.raw) && (
                                <div
                                    style={{
                                        marginTop: 12,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        color: theme.muted,
                                        ...mono,
                                    }}
                                >
                                    <span style={{ whiteSpace: "nowrap" }}>
                                        {cardCfg.meterLabel || "Value"}
                                    </span>
                                    <div
                                        style={{
                                            position: "relative",
                                            flex: 1,
                                            height: 4,
                                            borderRadius: 1,
                                            background: theme.hairline,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <motion.div
                                            initial={
                                                calm ? false : { scaleX: 0 }
                                            }
                                            animate={{ scaleX: 1 }}
                                            transition={{
                                                duration: 0.9,
                                                ease: [0.2, 0.8, 0.2, 1],
                                                delay: 0.15,
                                            }}
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                bottom: 0,
                                                left: 0,
                                                width: `${Math.max(2, Math.round(cur.value * 100))}%`,
                                                transformOrigin: "0% 50%",
                                                background: heatOn
                                                    ? gradient
                                                    : curInk,
                                                backgroundSize: `${cur.value > 0 ? 100 / cur.value : 100}% 100%`,
                                            }}
                                        />
                                    </div>
                                    <span
                                        style={{
                                            color: theme.text,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {formatValue(cur.raw, cardCfg)}
                                    </span>
                                </div>
                            )}
                            {cur.link && (
                                <a
                                    href={cur.link}
                                    target={
                                        cardCfg.newTab ? "_blank" : undefined
                                    }
                                    rel={
                                        cardCfg.newTab
                                            ? "noopener noreferrer"
                                            : undefined
                                    }
                                    className={`${scope}-go`}
                                    style={{
                                        marginTop: 12,
                                        paddingTop: 10,
                                        borderTop: `1px solid ${theme.hairline}`,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        color: theme.accent,
                                        textDecoration: "none",
                                        ...mono,
                                    }}
                                >
                                    {cardCfg.linkText || "View details"}
                                    <svg
                                        width="10"
                                        height="10"
                                        viewBox="0 0 10 10"
                                        fill="none"
                                    >
                                        <path
                                            d="M2 8L8 2M3.5 2H8V6.5"
                                            stroke="currentColor"
                                            strokeWidth="1.4"
                                        />
                                    </svg>
                                </a>
                            )}
                            <button
                                type="button"
                                aria-label="Close"
                                onClick={() => choose(-1, true)}
                                style={{
                                    position: "absolute",
                                    top:
                                        cur.src && cardCfg.showImage !== false
                                            ? 18
                                            : 8,
                                    right:
                                        cur.src && cardCfg.showImage !== false
                                            ? 18
                                            : 8,
                                    width: 22,
                                    height: 22,
                                    padding: 0,
                                    border: `1px solid ${theme.hairline}`,
                                    borderRadius: 4,
                                    background: theme.panel,
                                    color: theme.muted,
                                    cursor: "pointer",
                                    display: "grid",
                                    placeItems: "center",
                                }}
                            >
                                <svg
                                    width="8"
                                    height="8"
                                    viewBox="0 0 8 8"
                                    fill="none"
                                >
                                    <path
                                        d="M1 1L7 7M7 1L1 7"
                                        stroke="currentColor"
                                        strokeWidth="1.3"
                                    />
                                </svg>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------------ */
/* Controls                                                                  */
/* ------------------------------------------------------------------------ */

const spot = (
    title: string,
    caption: string,
    category: string,
    latitude: number,
    longitude: number,
    value: number
) => ({
    title,
    caption,
    category,
    latitude,
    longitude,
    value,
    imageURL: "",
    link: "",
})

const SAMPLE_CSV = `title,caption,category,latitude,longitude,value
Toronto,Canada headquarters,Hub,43.65,-79.38,1820
San Francisco,West coast office,Hub,37.77,-122.42,2450
London,Europe headquarters,Hub,51.51,-0.13,2210
Berlin,Design studio,Office,52.52,13.40,1150
Mumbai,South Asia hub,Hub,19.08,72.88,1670`

const SAMPLE_JSON = `[
  { "title": "Toronto", "category": "Hub", "lat": 43.65, "lng": -79.38, "value": 1820 },
  { "title": "San Francisco", "category": "Hub", "lat": 37.77, "lng": -122.42, "value": 2450 },
  { "title": "London", "category": "Hub", "lat": 51.51, "lng": -0.13, "value": 2210 },
  { "title": "Berlin", "category": "Office", "lat": 52.52, "lng": 13.40, "value": 1150 },
  { "title": "Mumbai", "category": "Hub", "lat": 19.08, "lng": 72.88, "value": 1670 }
]`

const PRESET_OPTIONS = [
    "midnight",
    "graphite",
    "deepsea",
    "frost",
    "paper",
    "sand",
]
const PRESET_TITLES = [
    "Midnight",
    "Graphite",
    "Deep Sea",
    "Frost",
    "Paper",
    "Sand",
]
const notCustom = (o: any) => o.preset !== "custom"

addPropertyControls(Petitpoint, {
    data: {
        type: ControlType.Object,
        title: "Data",
        controls: {
            source: {
                type: ControlType.Enum,
                title: "Source",
                options: ["list", "csv", "json"],
                optionTitles: ["List", "CSV", "JSON"],
                defaultValue: "list",
                displaySegmentedControl: true,
            },
            csv: {
                type: ControlType.String,
                title: "CSV",
                displayTextArea: true,
                defaultValue: SAMPLE_CSV,
                hidden: (o: any) => o.source !== "csv",
            },
            json: {
                type: ControlType.String,
                title: "JSON",
                displayTextArea: true,
                defaultValue: SAMPLE_JSON,
                hidden: (o: any) => o.source !== "json",
            },
        },
    },
    locations: {
        type: ControlType.Array,
        title: "Locations",
        maxCount: 60,
        hidden: (props: any) => (props.data?.source || "list") !== "list",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Location",
                },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    displayTextArea: true,
                    defaultValue: "A short line about this place.",
                },
                category: {
                    type: ControlType.String,
                    title: "Category",
                    defaultValue: "",
                },
                latitude: {
                    type: ControlType.Number,
                    title: "Latitude",
                    min: -59,
                    max: 83,
                    step: 0.01,
                    defaultValue: 0,
                    displayStepper: false,
                },
                longitude: {
                    type: ControlType.Number,
                    title: "Longitude",
                    min: -180,
                    max: 180,
                    step: 0.01,
                    defaultValue: 0,
                    displayStepper: false,
                },
                value: {
                    type: ControlType.Number,
                    title: "Value",
                    min: 0,
                    step: 1,
                    defaultValue: 100,
                    displayStepper: false,
                },
                color: {
                    type: ControlType.Color,
                    title: "Pin Color",
                    optional: true,
                },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                imageURL: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: [
            spot(
                "Vancouver",
                "Pacific studio — product and engineering.",
                "Office",
                49.28,
                -123.12,
                640
            ),
            spot(
                "Toronto",
                "Canada headquarters and support desk.",
                "Hub",
                43.65,
                -79.38,
                1820
            ),
            spot(
                "San Francisco",
                "West coast office — research and design.",
                "Hub",
                37.77,
                -122.42,
                2450
            ),
            spot(
                "Austin",
                "Central US operations.",
                "Office",
                30.27,
                -97.74,
                980
            ),
            spot(
                "Miami",
                "Southeast US and Latin America desk.",
                "Partner",
                25.76,
                -80.19,
                520
            ),
            spot(
                "London",
                "Europe headquarters — sales and partnerships.",
                "Hub",
                51.51,
                -0.13,
                2210
            ),
            spot(
                "Madrid",
                "Southern Europe partner studio.",
                "Partner",
                40.42,
                -3.7,
                610
            ),
            spot(
                "Berlin",
                "Design and research studio.",
                "Office",
                52.52,
                13.4,
                1150
            ),
            spot(
                "Mumbai",
                "South Asia hub — support around the clock.",
                "Hub",
                19.08,
                72.88,
                1670
            ),
        ],
    },
    view: {
        type: ControlType.Object,
        title: "View",
        controls: {
            region: {
                type: ControlType.Enum,
                title: "Region",
                options: [
                    "fit",
                    "world",
                    "northAmerica",
                    "southAmerica",
                    "europe",
                    "africa",
                    "middleEast",
                    "asia",
                    "oceania",
                    "custom",
                ],
                optionTitles: [
                    "Fit to Points",
                    "World",
                    "North America",
                    "South America",
                    "Europe",
                    "Africa",
                    "Middle East",
                    "Asia",
                    "Oceania",
                    "Custom",
                ],
                defaultValue: "fit",
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 0,
                max: 60,
                step: 1,
                unit: "°",
                defaultValue: 14,
                hidden: (o: any) => (o.region || "fit") !== "fit",
            },
            centerLongitude: {
                type: ControlType.Number,
                title: "Center Lon",
                min: -180,
                max: 180,
                step: 1,
                defaultValue: 0,
                hidden: (o: any) => o.region !== "custom",
            },
            centerLatitude: {
                type: ControlType.Number,
                title: "Center Lat",
                min: -50,
                max: 75,
                step: 1,
                defaultValue: 25,
                hidden: (o: any) => o.region !== "custom",
            },
            zoom: {
                type: ControlType.Number,
                title: "Zoom",
                min: 1,
                max: 12,
                step: 0.1,
                defaultValue: 1.6,
                hidden: (o: any) => o.region !== "custom",
            },
            animate: {
                type: ControlType.Boolean,
                title: "Smooth Moves",
                defaultValue: true,
            },
            detail: {
                type: ControlType.Enum,
                title: "Detail",
                options: ["fine", "medium", "chunky"],
                optionTitles: ["Fine", "Medium", "Chunky"],
                defaultValue: "medium",
                displaySegmentedControl: true,
            },
            shape: {
                type: ControlType.Enum,
                title: "Pixel",
                options: ["square", "soft", "dot"],
                optionTitles: ["Square", "Soft", "Dot"],
                defaultValue: "square",
                displaySegmentedControl: true,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 0.7,
                step: 0.02,
                defaultValue: 0.22,
            },
            oceanGrid: {
                type: ControlType.Boolean,
                title: "Sea Grid",
                defaultValue: true,
            },
        },
    },
    layers: {
        type: ControlType.Object,
        title: "Layers",
        controls: {
            heatmap: {
                type: ControlType.Boolean,
                title: "Heatmap",
                defaultValue: true,
            },
            markers: {
                type: ControlType.Boolean,
                title: "Markers",
                defaultValue: true,
            },
            routes: {
                type: ControlType.Boolean,
                title: "Routes",
                defaultValue: false,
            },
            closeLoop: {
                type: ControlType.Boolean,
                title: "Close Loop",
                defaultValue: false,
                hidden: (o: any) => !o.routes,
            },
            routeSpeed: {
                type: ControlType.Number,
                title: "Route Speed",
                min: 2,
                max: 40,
                step: 1,
                defaultValue: 14,
                hidden: (o: any) => !o.routes,
            },
            daylight: {
                type: ControlType.Boolean,
                title: "Live Daylight",
                defaultValue: false,
            },
        },
    },
    heatmap: {
        type: ControlType.Object,
        title: "Heatmap",
        controls: {
            palette: {
                type: ControlType.Enum,
                title: "Palette",
                options: [
                    "thermal",
                    "spectrum",
                    "aurora",
                    "ember",
                    "ice",
                    "accent",
                ],
                optionTitles: [
                    "Thermal",
                    "Spectrum",
                    "Aurora",
                    "Ember",
                    "Ice",
                    "Theme Accent",
                ],
                defaultValue: "thermal",
            },
            spread: {
                type: ControlType.Number,
                title: "Spread",
                min: 3,
                max: 35,
                step: 0.5,
                unit: "°",
                defaultValue: 12,
            },
            strength: {
                type: ControlType.Number,
                title: "Strength",
                min: 0.2,
                max: 3,
                step: 0.05,
                defaultValue: 1,
            },
            breathe: {
                type: ControlType.Boolean,
                title: "Breathe",
                defaultValue: true,
            },
            seaGlow: {
                type: ControlType.Boolean,
                title: "Sea Glow",
                defaultValue: true,
            },
            legend: {
                type: ControlType.Boolean,
                title: "Legend",
                defaultValue: true,
            },
            lowLabel: {
                type: ControlType.String,
                title: "Low Label",
                defaultValue: "Low",
                hidden: (o: any) => o.legend === false,
            },
            highLabel: {
                type: ControlType.String,
                title: "High Label",
                defaultValue: "High",
                hidden: (o: any) => o.legend === false,
            },
        },
    },
    markers: {
        type: ControlType.Object,
        title: "Markers",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["square", "dot", "diamond", "ring"],
                optionTitles: ["Square", "Dot", "Diamond", "Ring"],
                defaultValue: "square",
                displaySegmentedControl: true,
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 0.5,
                max: 2.5,
                step: 0.05,
                defaultValue: 1,
            },
            colorBy: {
                type: ControlType.Enum,
                title: "Color By",
                options: ["theme", "accent", "category", "value"],
                optionTitles: ["Theme", "Accent", "Category", "Value"],
                defaultValue: "theme",
            },
            sizeByValue: {
                type: ControlType.Boolean,
                title: "Size by Value",
                defaultValue: false,
            },
            pulse: {
                type: ControlType.Boolean,
                title: "Pulse",
                defaultValue: true,
            },
            labels: {
                type: ControlType.Enum,
                title: "Labels",
                options: ["hover", "always", "none"],
                optionTitles: ["Hover", "Always", "None"],
                defaultValue: "hover",
                displaySegmentedControl: true,
            },
        },
    },
    card: {
        type: ControlType.Object,
        title: "Card",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Show Card",
                defaultValue: true,
            },
            width: {
                type: ControlType.Number,
                title: "Width",
                min: 180,
                max: 360,
                step: 2,
                defaultValue: 248,
            },
            showImage: {
                type: ControlType.Boolean,
                title: "Image",
                defaultValue: true,
            },
            showCoords: {
                type: ControlType.Boolean,
                title: "Coordinates",
                defaultValue: true,
            },
            meter: {
                type: ControlType.Boolean,
                title: "Value Meter",
                defaultValue: true,
            },
            meterLabel: {
                type: ControlType.String,
                title: "Meter Label",
                defaultValue: "Activity",
                hidden: (o: any) => o.meter === false,
            },
            prefix: {
                type: ControlType.String,
                title: "Prefix",
                defaultValue: "",
                hidden: (o: any) => o.meter === false,
            },
            suffix: {
                type: ControlType.String,
                title: "Suffix",
                defaultValue: "",
                hidden: (o: any) => o.meter === false,
            },
            compact: {
                type: ControlType.Boolean,
                title: "Compact No.",
                defaultValue: true,
                hidden: (o: any) => o.meter === false,
            },
            linkText: {
                type: ControlType.String,
                title: "Link Text",
                defaultValue: "View details",
            },
            newTab: {
                type: ControlType.Boolean,
                title: "New Tab",
                defaultValue: false,
            },
        },
    },
    tour: {
        type: ControlType.Object,
        title: "Tour",
        controls: {
            autoplay: {
                type: ControlType.Boolean,
                title: "Auto Tour",
                defaultValue: true,
            },
            interval: {
                type: ControlType.Number,
                title: "Every",
                min: 2,
                max: 20,
                step: 0.5,
                unit: "s",
                defaultValue: 5,
                hidden: (o: any) => !o.autoplay,
            },
        },
    },
    theme: {
        type: ControlType.Object,
        title: "Theme",
        controls: {
            preset: {
                type: ControlType.Enum,
                title: "Preset",
                options: ["system", ...PRESET_OPTIONS, "custom"],
                optionTitles: ["Light / Dark Auto", ...PRESET_TITLES, "Custom"],
                defaultValue: "system",
            },
            lightPreset: {
                type: ControlType.Enum,
                title: "Light",
                options: PRESET_OPTIONS,
                optionTitles: PRESET_TITLES,
                defaultValue: "frost",
                hidden: (o: any) => (o.preset || "system") !== "system",
            },
            darkPreset: {
                type: ControlType.Enum,
                title: "Dark",
                options: PRESET_OPTIONS,
                optionTitles: PRESET_TITLES,
                defaultValue: "midnight",
                hidden: (o: any) => (o.preset || "system") !== "system",
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#0A0B0D",
                hidden: notCustom,
            },
            land: {
                type: ControlType.Color,
                title: "Land",
                defaultValue: "#4A5059",
                hidden: notCustom,
            },
            night: {
                type: ControlType.Color,
                title: "Night Land",
                defaultValue: "#24272D",
                hidden: notCustom,
            },
            highlight: {
                type: ControlType.Color,
                title: "Ink",
                defaultValue: "#F2EEE6",
                hidden: notCustom,
            },
            ocean: {
                type: ControlType.Color,
                title: "Sea Grid",
                defaultValue: "#1C1F24",
                hidden: notCustom,
            },
            accent: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: "#FF6A3D",
                hidden: notCustom,
            },
            panel: {
                type: ControlType.Color,
                title: "Panel",
                defaultValue: "rgba(19, 20, 24, 0.92)",
                hidden: notCustom,
            },
            hairline: {
                type: ControlType.Color,
                title: "Hairline",
                defaultValue: "rgba(255, 255, 255, 0.09)",
                hidden: notCustom,
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#F2EEE6",
                hidden: notCustom,
            },
            muted: {
                type: ControlType.Color,
                title: "Muted",
                defaultValue: "rgba(242, 238, 230, 0.58)",
                hidden: notCustom,
            },
        },
    },
    ui: {
        type: ControlType.Object,
        title: "Interface",
        controls: {
            intro: {
                type: ControlType.Enum,
                title: "Intro",
                options: ["sweep", "bloom", "rain", "none"],
                optionTitles: ["Sweep", "Bloom", "Rain", "None"],
                defaultValue: "sweep",
            },
            readout: {
                type: ControlType.Boolean,
                title: "Readout",
                defaultValue: true,
            },
            countLabel: {
                type: ControlType.String,
                title: "Count Label",
                defaultValue: "POINTS",
                hidden: (o: any) => o.readout === false,
            },
            filters: {
                type: ControlType.Boolean,
                title: "Filters",
                defaultValue: true,
            },
            allLabel: {
                type: ControlType.String,
                title: "All Label",
                defaultValue: "All",
                hidden: (o: any) => o.filters === false,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 48,
                step: 1,
                defaultValue: 0,
            },
            ariaLabel: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "Interactive world map",
            },
        },
    },
    font: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 19,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            lineHeight: 1.15,
        },
    },
    monoFont: {
        type: ControlType.Font,
        title: "Mono Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: 11,
            letterSpacing: "0.04em",
            lineHeight: 1.2,
        },
    },
})
