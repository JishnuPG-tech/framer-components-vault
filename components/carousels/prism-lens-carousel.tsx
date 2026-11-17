import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const TEXT_STACK = "Inter, system-ui, sans-serif"

const RATIOS: Record<string, number> = {
    "3:4": 3 / 4,
    "4:5": 4 / 5,
    "2:3": 2 / 3,
    "1:1": 1,
    "9:16": 9 / 16,
    "16:9": 16 / 9,
}

function bound(v: number, lo: number, hi: number) {
    return v < lo ? lo : v > hi ? hi : v
}

function wrapIndex(i: number, n: number) {
    return ((i % n) + n) % n
}

function num(v: any, fallback: number) {
    const n = typeof v === "number" ? v : parseFloat(v)
    return Number.isFinite(n) ? n : fallback
}

function toRgba(
    input: any,
    fallback: [number, number, number, number]
): [number, number, number, number] {
    let s = String(input ?? "").trim()
    const tokenMatch = s.match(/^var\([^,]+,\s*(.+)\)$/)
    if (tokenMatch) s = tokenMatch[1].trim()
    const hex = s.match(/^#([0-9a-f]{3,8})$/i)
    if (hex) {
        let h = hex[1]
        if (h.length === 3 || h.length === 4)
            h = h
                .split("")
                .map((c) => c + c)
                .join("")
        const r = parseInt(h.slice(0, 2), 16) / 255
        const g = parseInt(h.slice(2, 4), 16) / 255
        const b = parseInt(h.slice(4, 6), 16) / 255
        const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
        return [r, g, b, a]
    }
    const fn = s.match(/rgba?\(([^)]+)\)/i)
    if (fn) {
        const parts = fn[1]
            .split(/[\s,/]+/)
            .filter(Boolean)
            .map((p) => parseFloat(p))
        if (
            parts.length >= 3 &&
            parts.slice(0, 3).every((p) => Number.isFinite(p))
        ) {
            const a =
                parts.length > 3 && Number.isFinite(parts[3]) ? parts[3] : 1
            return [parts[0] / 255, parts[1] / 255, parts[2] / 255, a]
        }
    }
    return fallback
}

function cardRatio(layout: any) {
    const key = layout?.aspect ?? "4:5"
    if (key === "Custom") return bound(num(layout?.customRatio, 0.8), 0.3, 3)
    return RATIOS[key] ?? 0.8
}

function mediaSource(
    card: any,
    index: number
): { kind: "preset" | "image" | "video"; src: string; preset: number } {
    const fallback = {
        kind: "preset" as const,
        src: "",
        preset: wrapIndex(index, 6) + 1,
    }
    if (card?.source === "Video") {
        const src = (card?.videoUrl || "").trim() || card?.video || ""
        return src ? { kind: "video", src, preset: 0 } : fallback
    }
    const src = (card?.imageUrl || "").trim() || card?.image?.src || ""
    return src ? { kind: "image", src, preset: 0 } : fallback
}

// ------------------------------------------------------- built-in UI cards

const SHEET_W = 640
const SHEET_H = 800

function pill(
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
) {
    const rr = Math.min(r, w / 2, h / 2)
    c.beginPath()
    c.moveTo(x + rr, y)
    c.arcTo(x + w, y, x + w, y + h, rr)
    c.arcTo(x + w, y + h, x, y + h, rr)
    c.arcTo(x, y + h, x, y, rr)
    c.arcTo(x, y, x + w, y, rr)
    c.closePath()
}

function label(
    c: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    size: number,
    weight: number,
    color: string,
    align: CanvasTextAlign = "left"
) {
    c.font = `${weight} ${size}px ${TEXT_STACK}`
    c.fillStyle = color
    c.textAlign = align
    c.textBaseline = "alphabetic"
    c.fillText(text, x, y)
}

function sheetAnalytics(c: CanvasRenderingContext2D) {
    const g = c.createLinearGradient(0, 0, SHEET_W, SHEET_H)
    g.addColorStop(0, "#0d1122")
    g.addColorStop(1, "#1a1f3d")
    c.fillStyle = g
    c.fillRect(0, 0, SHEET_W, SHEET_H)
    const halo = c.createRadialGradient(520, 120, 0, 520, 120, 360)
    halo.addColorStop(0, "rgba(124,92,255,0.35)")
    halo.addColorStop(1, "rgba(124,92,255,0)")
    c.fillStyle = halo
    c.fillRect(0, 0, SHEET_W, SHEET_H)

    c.fillStyle = "#8b7bff"
    c.beginPath()
    c.arc(64, 82, 9, 0, Math.PI * 2)
    c.fill()
    label(c, "Overview", 84, 90, 24, 600, "rgba(255,255,255,0.72)")
    pill(c, 436, 58, 148, 46, 23)
    c.fillStyle = "rgba(255,255,255,0.08)"
    c.fill()
    label(c, "This month", 510, 89, 20, 500, "rgba(255,255,255,0.75)", "center")

    label(c, "Revenue", 56, 186, 28, 500, "rgba(255,255,255,0.55)")
    label(c, "$48,290", 52, 270, 84, 700, "#ffffff")
    pill(c, 56, 300, 128, 42, 21)
    c.fillStyle = "rgba(52,211,153,0.16)"
    c.fill()
    label(c, "+12.4%", 120, 329, 21, 700, "#34d399", "center")

    const pts = [
        [56, 548],
        [130, 520],
        [196, 532],
        [262, 470],
        [330, 488],
        [398, 420],
        [462, 438],
        [530, 372],
        [588, 386],
    ]
    const trace = () => {
        c.beginPath()
        c.moveTo(pts[0][0], pts[0][1])
        for (let i = 1; i < pts.length; i++) {
            const [px, py] = pts[i - 1]
            const [x, y] = pts[i]
            const mx = (px + x) / 2
            c.bezierCurveTo(mx, py, mx, y, x, y)
        }
    }
    trace()
    c.lineTo(588, 600)
    c.lineTo(56, 600)
    c.closePath()
    const fill = c.createLinearGradient(0, 360, 0, 600)
    fill.addColorStop(0, "rgba(124,92,255,0.45)")
    fill.addColorStop(1, "rgba(124,92,255,0)")
    c.fillStyle = fill
    c.fill()
    trace()
    c.strokeStyle = "#a597ff"
    c.lineWidth = 5
    c.lineJoin = "round"
    c.stroke()
    c.fillStyle = "rgba(165,151,255,0.25)"
    c.beginPath()
    c.arc(530, 372, 22, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = "#ffffff"
    c.beginPath()
    c.arc(530, 372, 9, 0, Math.PI * 2)
    c.fill()

    const days = ["M", "T", "W", "T", "F", "S", "S"]
    const heights = [46, 70, 38, 82, 58, 96, 64]
    for (let i = 0; i < 7; i++) {
        const x = 64 + i * 78
        const h = heights[i]
        pill(c, x, 712 - h, 40, h, 12)
        c.fillStyle = i === 5 ? "#8b7bff" : "rgba(255,255,255,0.12)"
        c.fill()
        label(
            c,
            days[i],
            x + 20,
            752,
            20,
            600,
            "rgba(255,255,255,0.5)",
            "center"
        )
    }
}

function sheetMusic(c: CanvasRenderingContext2D) {
    const g = c.createLinearGradient(0, 0, 0, SHEET_H)
    g.addColorStop(0, "#1c0f26")
    g.addColorStop(1, "#3d1431")
    c.fillStyle = g
    c.fillRect(0, 0, SHEET_W, SHEET_H)

    c.save()
    pill(c, 80, 64, 480, 440, 40)
    c.clip()
    c.fillStyle = "#26122f"
    c.fillRect(80, 64, 480, 440)
    const blobs: [number, number, number, string][] = [
        [200, 180, 260, "rgba(255,122,69,0.95)"],
        [450, 220, 240, "rgba(255,61,140,0.9)"],
        [330, 440, 280, "rgba(120,72,255,0.9)"],
    ]
    for (const [x, y, r, col] of blobs) {
        const rg = c.createRadialGradient(x, y, 0, x, y, r)
        rg.addColorStop(0, col)
        rg.addColorStop(1, "rgba(0,0,0,0)")
        c.fillStyle = rg
        c.fillRect(80, 64, 480, 440)
    }
    c.strokeStyle = "rgba(255,255,255,0.22)"
    c.lineWidth = 2
    for (let r = 40; r < 260; r += 34) {
        c.beginPath()
        c.arc(320, 284, r, 0, Math.PI * 2)
        c.stroke()
    }
    c.restore()

    label(c, "Night Session", 80, 584, 40, 700, "#ffffff")
    label(c, "Low Tide Collective", 80, 624, 24, 500, "rgba(255,255,255,0.6)")
    pill(c, 80, 660, 480, 8, 4)
    c.fillStyle = "rgba(255,255,255,0.18)"
    c.fill()
    pill(c, 80, 660, 206, 8, 4)
    c.fillStyle = "#ffffff"
    c.fill()
    c.beginPath()
    c.arc(286, 664, 11, 0, Math.PI * 2)
    c.fill()
    label(c, "1:42", 80, 700, 18, 500, "rgba(255,255,255,0.55)")
    label(c, "3:58", 560, 700, 18, 500, "rgba(255,255,255,0.55)", "right")

    const cy = 750
    c.fillStyle = "rgba(255,255,255,0.85)"
    const tri = (x: number, dir: number) => {
        c.beginPath()
        c.moveTo(x, cy)
        c.lineTo(x + 20 * dir, cy - 14)
        c.lineTo(x + 20 * dir, cy + 14)
        c.closePath()
        c.fill()
    }
    tri(180, 1)
    tri(160, 1)
    tri(460, -1)
    tri(480, -1)
    c.fillStyle = "#ffffff"
    c.beginPath()
    c.arc(320, cy, 34, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = "#2b1230"
    c.fillRect(306, cy - 14, 9, 28)
    c.fillRect(325, cy - 14, 9, 28)
}

function sheetWeather(c: CanvasRenderingContext2D) {
    const g = c.createLinearGradient(0, 0, 0, SHEET_H)
    g.addColorStop(0, "#3d8cff")
    g.addColorStop(1, "#a6d6ff")
    c.fillStyle = g
    c.fillRect(0, 0, SHEET_W, SHEET_H)

    const sun = c.createRadialGradient(470, 180, 0, 470, 180, 200)
    sun.addColorStop(0, "rgba(255,226,120,0.85)")
    sun.addColorStop(1, "rgba(255,226,120,0)")
    c.fillStyle = sun
    c.fillRect(0, 0, SHEET_W, SHEET_H)
    c.fillStyle = "#ffd75e"
    c.beginPath()
    c.arc(470, 180, 70, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = "rgba(255,255,255,0.96)"
    for (const [x, y, r] of [
        [380, 250, 52],
        [440, 228, 64],
        [508, 252, 50],
        [440, 270, 46],
    ] as const) {
        c.beginPath()
        c.arc(x, y, r, 0, Math.PI * 2)
        c.fill()
    }

    label(c, "Today", 56, 96, 28, 600, "rgba(255,255,255,0.85)")
    label(c, "24°", 44, 380, 190, 300, "#ffffff")
    label(c, "Partly Cloudy", 58, 440, 34, 600, "#ffffff")
    label(c, "H 27°   L 18°", 58, 486, 26, 500, "rgba(255,255,255,0.8)")

    pill(c, 40, 556, 560, 200, 34)
    c.fillStyle = "rgba(255,255,255,0.22)"
    c.fill()
    c.strokeStyle = "rgba(255,255,255,0.4)"
    c.lineWidth = 2
    c.stroke()
    const hours = ["Now", "13", "14", "15", "16"]
    const temps = ["24°", "25°", "26°", "25°", "23°"]
    for (let i = 0; i < 5; i++) {
        const x = 96 + i * 112
        label(c, hours[i], x, 608, 20, 600, "rgba(255,255,255,0.85)", "center")
        c.fillStyle = i < 3 ? "#ffd75e" : "rgba(255,255,255,0.95)"
        c.beginPath()
        c.arc(x, 652, 16, 0, Math.PI * 2)
        c.fill()
        label(c, temps[i], x, 718, 24, 700, "#ffffff", "center")
    }
}

function sheetActivity(c: CanvasRenderingContext2D) {
    c.fillStyle = "#0a0a0d"
    c.fillRect(0, 0, SHEET_W, SHEET_H)
    label(c, "Activity", 56, 96, 40, 700, "#ffffff")
    label(c, "Tuesday", 56, 134, 22, 500, "rgba(255,255,255,0.45)")

    const rings: [number, string, number][] = [
        [168, "#ff2d6f", 0.84],
        [126, "#a3f84a", 0.66],
        [84, "#33d6ff", 0.92],
    ]
    c.lineCap = "round"
    for (const [r, col, p] of rings) {
        c.lineWidth = 34
        c.strokeStyle = col
        c.globalAlpha = 0.18
        c.beginPath()
        c.arc(320, 360, r, 0, Math.PI * 2)
        c.stroke()
        c.globalAlpha = 1
        c.beginPath()
        c.arc(320, 360, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p)
        c.stroke()
    }
    c.lineCap = "butt"

    const rows: [string, string, string][] = [
        ["Move", "420/500 KCAL", "#ff2d6f"],
        ["Exercise", "20/30 MIN", "#a3f84a"],
        ["Stand", "11/12 HRS", "#33d6ff"],
    ]
    rows.forEach(([name, value, col], i) => {
        const y = 616 + i * 58
        c.fillStyle = col
        c.beginPath()
        c.arc(68, y - 8, 9, 0, Math.PI * 2)
        c.fill()
        label(c, name, 92, y, 26, 600, "rgba(255,255,255,0.9)")
        label(c, value, 584, y, 24, 700, col, "right")
    })
}

function sheetWallet(c: CanvasRenderingContext2D) {
    c.fillStyle = "#f3f1ec"
    c.fillRect(0, 0, SHEET_W, SHEET_H)
    label(c, "Balance", 56, 96, 26, 500, "rgba(20,20,26,0.5)")
    label(c, "$12,840.50", 52, 170, 66, 700, "#14141a")

    c.save()
    pill(c, 48, 214, 544, 280, 34)
    c.clip()
    const g = c.createLinearGradient(48, 214, 592, 494)
    g.addColorStop(0, "#15151c")
    g.addColorStop(1, "#3f3d58")
    c.fillStyle = g
    c.fillRect(48, 214, 544, 280)
    c.fillStyle = "rgba(255,255,255,0.06)"
    c.beginPath()
    c.arc(520, 240, 170, 0, Math.PI * 2)
    c.fill()
    c.beginPath()
    c.arc(560, 470, 120, 0, Math.PI * 2)
    c.fill()
    c.restore()
    pill(c, 88, 262, 70, 52, 10)
    const chip = c.createLinearGradient(88, 262, 158, 314)
    chip.addColorStop(0, "#e9c97a")
    chip.addColorStop(1, "#b48a3c")
    c.fillStyle = chip
    c.fill()
    label(c, "••••  ••••  ••••  4821", 88, 404, 30, 600, "#ffffff")
    label(c, "VALID 08/29", 88, 456, 20, 600, "rgba(255,255,255,0.6)")

    const tx: [string, string, string, string][] = [
        ["Coffee Bar", "Today", "-$4.80", "#ff8a3d"],
        ["Studio Rent", "Yesterday", "-$1,200", "#6c63ff"],
        ["Transfer In", "Mon", "+$860", "#1fb57a"],
    ]
    tx.forEach(([name, when, amt, col], i) => {
        const y = 560 + i * 78
        c.fillStyle = col
        c.globalAlpha = 0.16
        c.beginPath()
        c.arc(84, y + 10, 26, 0, Math.PI * 2)
        c.fill()
        c.globalAlpha = 1
        c.beginPath()
        c.arc(84, y + 10, 9, 0, Math.PI * 2)
        c.fill()
        label(c, name, 128, y + 6, 25, 600, "#14141a")
        label(c, when, 128, y + 36, 19, 500, "rgba(20,20,26,0.45)")
        label(
            c,
            amt,
            588,
            y + 18,
            25,
            700,
            amt.startsWith("+") ? "#1fb57a" : "#14141a",
            "right"
        )
    })
}

function sheetTasks(c: CanvasRenderingContext2D) {
    const g = c.createLinearGradient(0, 0, 0, SHEET_H)
    g.addColorStop(0, "#ece7ff")
    g.addColorStop(1, "#faf9ff")
    c.fillStyle = g
    c.fillRect(0, 0, SHEET_W, SHEET_H)
    label(c, "Today", 56, 104, 56, 700, "#1b1630")
    label(c, "6 tasks · 2 done", 58, 144, 24, 500, "rgba(27,22,48,0.5)")

    const tasks: [string, string, string, boolean][] = [
        ["Review moodboard", "Design", "#7c5cff", true],
        ["Sync with studio", "Call", "#ff7a45", true],
        ["Ship onboarding flow", "Build", "#1fb57a", false],
        ["Draft release notes", "Write", "#ff3d8c", false],
    ]
    tasks.forEach(([text, tag, col, done], i) => {
        const y = 186 + i * 112
        pill(c, 40, y, 560, 92, 24)
        c.fillStyle = "#ffffff"
        c.fill()
        pill(c, 68, y + 30, 32, 32, 9)
        if (done) {
            c.fillStyle = "#7c5cff"
            c.fill()
            c.strokeStyle = "#ffffff"
            c.lineWidth = 4
            c.lineCap = "round"
            c.beginPath()
            c.moveTo(76, y + 47)
            c.lineTo(83, y + 54)
            c.lineTo(94, y + 39)
            c.stroke()
            c.lineCap = "butt"
        } else {
            c.strokeStyle = "rgba(27,22,48,0.25)"
            c.lineWidth = 3
            c.stroke()
        }
        label(
            c,
            text,
            120,
            y + 56,
            25,
            600,
            done ? "rgba(27,22,48,0.4)" : "#1b1630"
        )
        c.font = `700 18px ${TEXT_STACK}`
        const tw = c.measureText(tag).width + 28
        pill(c, 576 - tw, y + 30, tw, 34, 17)
        c.fillStyle = col
        c.globalAlpha = 0.14
        c.fill()
        c.globalAlpha = 1
        label(c, tag, 576 - tw / 2, y + 53, 18, 700, col, "center")
    })

    const avatars = ["#ffb38a", "#9bd4ff", "#c8b6ff"]
    avatars.forEach((col, i) => {
        c.fillStyle = col
        c.strokeStyle = "#faf9ff"
        c.lineWidth = 5
        c.beginPath()
        c.arc(80 + i * 40, 702, 26, 0, Math.PI * 2)
        c.fill()
        c.stroke()
    })
    pill(c, 220, 694, 372, 16, 8)
    c.fillStyle = "rgba(124,92,255,0.15)"
    c.fill()
    pill(c, 220, 694, 124, 16, 8)
    c.fillStyle = "#7c5cff"
    c.fill()
}

const SHEETS = [
    sheetAnalytics,
    sheetMusic,
    sheetWeather,
    sheetActivity,
    sheetWallet,
    sheetTasks,
]

function paintSheet(id: number): HTMLCanvasElement | null {
    if (typeof document === "undefined") return null
    const cv = document.createElement("canvas")
    cv.width = SHEET_W
    cv.height = SHEET_H
    const c = cv.getContext("2d")
    if (!c) return null
    SHEETS[bound(id, 1, 6) - 1](c)
    return cv
}

// ---------------------------------------------------------- caption plate

function clipText(c: CanvasRenderingContext2D, text: string, maxW: number) {
    if (c.measureText(text).width <= maxW) return text
    let s = text
    while (s.length > 1 && c.measureText(s + "…").width > maxW)
        s = s.slice(0, -1)
    return s + "…"
}

function fontParts(font: any, scale: number) {
    const size = num(font?.fontSize, 18) * scale
    const weight = font?.fontWeight ?? 600
    const family = font?.fontFamily || TEXT_STACK
    const style = font?.fontStyle === "italic" ? "italic " : ""
    return {
        size,
        css: (s: number, w: any) => `${style}${w} ${s}px ${family}`,
        weight,
    }
}

function paintCaption(
    cv: HTMLCanvasElement,
    title: string,
    caption: string,
    cap: any,
    scale: number
) {
    const c = cv.getContext("2d")
    if (!c) return
    const w = cv.width
    const h = cv.height
    c.clearRect(0, 0, w, h)
    const shade = c.createLinearGradient(0, h * 0.5, 0, h)
    shade.addColorStop(0, "rgba(0,0,0,0)")
    shade.addColorStop(1, `rgba(0,0,0,${bound(num(cap?.shade, 0.6), 0, 1)})`)
    c.fillStyle = shade
    c.fillRect(0, h * 0.5, w, h * 0.5)
    const f = fontParts(cap?.font, scale)
    const pad = Math.max(14 * scale, w * 0.07)
    const color = cap?.color || "#ffffff"
    c.textBaseline = "alphabetic"
    c.textAlign = "left"
    let y = h - pad
    if (caption) {
        const cs = f.size * 0.72
        c.font = f.css(cs, 500)
        c.fillStyle = color
        c.globalAlpha = 0.72
        c.fillText(clipText(c, caption, w - pad * 2), pad, y)
        c.globalAlpha = 1
        y -= cs * 1.45
    }
    if (title) {
        c.font = f.css(f.size, f.weight)
        c.fillStyle = color
        c.fillText(clipText(c, title, w - pad * 2), pad, y)
    }
}

// ------------------------------------------------------------------ shaders

const CARD_VS = `
attribute vec2 aGrid;
uniform vec2 uView;
uniform vec2 uHalf;
uniform float uPad;
uniform float uX;
uniform float uSize;
uniform float uBend;
uniform float uLens;
varying vec2 vP;
void main() {
    vec2 span = (uHalf + uPad) * 2.0;
    vec2 p = (aGrid - 0.5) * span;
    vP = p;
    float x = uX + p.x * uSize;
    float y = p.y * uSize;
    float nx = x / (uView.x * 0.5);
    float depth = -uBend * nx * nx;
    float k = uLens / (uLens - depth);
    gl_Position = vec4(x * k / (uView.x * 0.5), -y * k / (uView.y * 0.5), 0.0, 1.0);
}`

const CARD_FS = `
precision highp float;
varying vec2 vP;
uniform sampler2D uImg;
uniform sampler2D uTxt;
uniform vec2 uHalf;
uniform float uPad;
uniform float uCorner;
uniform float uDrop;
uniform vec3 uDropTint;
uniform float uImgRatio;
uniform float uHasImg;
uniform float uHasTxt;
uniform float uShade;
uniform vec3 uShadeTint;
uniform vec3 uFillA;
uniform vec3 uFillB;
float boxDist(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
void main() {
    float d = boxDist(vP, uHalf, uCorner);
    float body = 1.0 - smoothstep(-0.9, 0.9, d);
    vec2 uv = vP / (uHalf * 2.0) + 0.5;
    vec3 rgb;
    if (uHasImg > 0.5) {
        float boxRatio = uHalf.x / uHalf.y;
        vec2 m = uv - 0.5;
        if (uImgRatio > boxRatio) m.x *= boxRatio / uImgRatio;
        else m.y *= uImgRatio / boxRatio;
        rgb = texture2D(uImg, m + 0.5).rgb;
    } else {
        rgb = mix(uFillA, uFillB, uv.y);
    }
    if (uHasTxt > 0.5) {
        vec4 t = texture2D(uTxt, uv);
        rgb = rgb * (1.0 - t.a) + t.rgb;
    }
    rgb = mix(rgb, uShadeTint, uShade);
    float ds = boxDist(vP - vec2(0.0, uPad * 0.28), uHalf, uCorner);
    float fall = clamp(1.0 - ds / max(uPad, 1.0), 0.0, 1.0);
    float drop = uDrop * 0.62 * fall * fall * fall;
    float a = body + drop * (1.0 - body);
    gl_FragColor = vec4(rgb * body + uDropTint * drop * (1.0 - body), a);
}`

const SCREEN_VS = `
attribute vec2 aQuad;
varying vec2 vUv;
void main() {
    vUv = aQuad * 0.5 + 0.5;
    gl_Position = vec4(aQuad, 0.0, 1.0);
}`

const GLASS_FS = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uFrame;
uniform vec2 uPx;
uniform float uBand;
uniform float uPower;
uniform float uBulge;
uniform float uFlare;
uniform float uDrag;
uniform float uSplit;
uniform float uWave;
uniform float uRim;
uniform vec3 uRimTint;
uniform float uSoft;
uniform float uTaps;
uniform float uClock;
uniform float uFlow;
uniform float uGleam;
uniform vec3 uGlass;
uniform float uGlassMix;
uniform float uFade;
uniform vec3 uBack;
uniform float uSolid;
uniform float uTravel;
uniform float uFrameMode;
uniform float uScale;

float hashPx(vec2 p) {
    return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

void main() {
    vec2 uv = vUv;
    float aspect = uPx.x / uPx.y;
    vec2 toPx = vec2(1.0, aspect);
    float gx = min(uv.x, 1.0 - uv.x);
    float gy = uFrameMode > 0.5 ? min(uv.y, 1.0 - uv.y) / aspect : 10.0;
    float band = max(uBand, 0.0001);

    // bevel coordinate: 0 where the glass rim begins, 1 at the outer border
    float tx = 1.0 - clamp(gx / band, 0.0, 1.0);
    float ty = 1.0 - clamp(gy / band, 0.0, 1.0);
    float u = max(tx, ty);
    vec2 dir = vec2(sign(uv.x - 0.5) * tx * tx * tx, sign(uv.y - 0.5) * ty * ty * ty);
    float dl = length(dir);
    dir = dl > 0.0 ? dir / dl : vec2(0.0);
    vec2 across = vec2(abs(dir.y), abs(dir.x));
    vec2 along = vec2(-dir.y, dir.x);

    // rounded rim profile: a quarter circle that is flat inside and steep at the border
    float uc = min(u, 0.992);
    float nz = sqrt(1.0 - uc * uc);
    float bend = (1.0 - nz) * uPower;

    vec2 refr = -dir * toPx * bend * band * uBulge * 0.85;
    vec2 s = uv + refr;
    s = 0.5 + (s - 0.5) * (1.0 - across * uFlare * bend * 0.26);
    float wv = uWave * bend;
    s += dir * toPx * sin(dot(uv, along) * 36.0 + uClock * 2.1) * 0.0032 * wv;
    s += along * toPx * sin(dot(uv, dir) * 24.0 - uClock * 1.6 + dot(uv, along) * 7.0) * 0.0022 * wv;

    float n = hashPx(gl_FragCoord.xy);
    vec4 col;
    if (bend < 0.0005) {
        col = texture2D(uFrame, s);
    } else {
        // dispersion: short wavelengths refract further than long ones
        vec2 spread = refr * uSplit * 0.32 - dir * toPx * bend * uSplit * 0.007;
        float frost = uSoft * pow(u, 1.5) * band * 0.15 * uPower;
        vec2 streak = vec2(uFlow * uDrag * bend * 0.12, 0.0);
        vec4 acc = vec4(0.0);
        float wsum = 0.0;
        for (int i = 0; i < 32; i++) {
            float fi = float(i);
            if (fi >= uTaps) break;
            float f = (fi + n) / uTaps;
            float r = sqrt(f);
            float ang = fi * 2.39996323 + n * 6.2831853;
            vec2 o = vec2(cos(ang), sin(ang) * aspect) * r * frost + streak * (f - 0.5);
            float w = exp(-r * r * 2.2);
            vec4 sr = texture2D(uFrame, s + o - spread);
            vec4 sg = texture2D(uFrame, s + o);
            vec4 sb = texture2D(uFrame, s + o + spread);
            acc += w * vec4(sr.r, sg.g, sb.b, (sr.a + sg.a + sb.a) / 3.0);
            wsum += w;
        }
        col = acc / wsum;
        if (uSolid < 0.5) col.rgb = min(col.rgb, vec3(col.a));
    }

    // body tint and a soft contact shadow where the rim lifts off the flat pane
    col.rgb = mix(col.rgb, col.rgb * uGlass, clamp(bend * uGlassMix * 1.6, 0.0, 1.0));
    float contact = exp(-pow((u - 0.14) / 0.09, 2.0)) * 0.07 * uRim * uPower;
    col.rgb *= 1.0 - contact;

    // fresnel reflection of a soft studio environment, brighter from above
    float fres = pow(1.0 - nz, 2.2) * uPower;
    vec3 env = mix(uRimTint * 0.82, vec3(1.0), smoothstep(0.1, 0.95, uv.y));
    float fr = clamp(fres * uRim * 0.55, 0.0, 1.0);
    col.rgb = mix(col.rgb, env * max(col.a, 0.65), fr);
    col.a = max(col.a, fr * 0.8);

    // specular sheen from a key light that drifts as the carousel travels
    vec3 N = normalize(vec3(dir * uc, nz));
    vec3 L = normalize(vec3(-0.42 + 0.22 * sin(uTravel * 0.7), 0.62, 0.66));
    vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
    float spec = pow(max(dot(N, H), 0.0), 42.0) * uGleam * uPower * smoothstep(0.0, 0.3, u);
    col.rgb += vec3(spec) * 0.85;
    col.a = max(col.a, clamp(spec, 0.0, 1.0));

    float fade = uFade > 0.0 ? smoothstep(0.0, uFade, min(gx, gy)) : 1.0;
    col *= fade;

    // bright hairline on the outer border with a soft bloom into the rim
    float edgePx = min(gx, gy) * uPx.x;
    float outer = exp(-edgePx / (1.3 * uScale));
    float swell = 0.6 + 0.4 * sin(dot(uv, across) * 3.14159);
    float glow = clamp((outer * 0.85 + pow(u, 6.0) * 0.25) * uRim * swell, 0.0, 1.0);
    col.rgb = col.rgb * (1.0 - glow * 0.55) + uRimTint * glow;
    col.a = clamp(col.a + glow * (1.0 - col.a), 0.0, 1.0);

    if (uSolid > 0.5) {
        col.rgb = col.rgb + uBack * (1.0 - col.a);
        col.a = 1.0;
    }
    col.rgb += (n - 0.5) / 255.0;
    gl_FragColor = col;
}`

// ------------------------------------------------------------- live engine

type Slot = {
    kind: "preset" | "image" | "video"
    tex: WebGLTexture | null
    ratio: number
    ready: boolean
    clip: HTMLVideoElement | null
    img: HTMLImageElement | null
    txt: WebGLTexture | null
    hasTxt: boolean
}

type Hooks = { onIndex: (i: number) => void; onLost: () => void }

function launchStage(
    host: HTMLDivElement,
    canvas: HTMLCanvasElement,
    propsRef: React.MutableRefObject<any>,
    hooks: Hooks
) {
    const gl = canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
    }) as WebGLRenderingContext | null
    if (!gl) return null

    const compile = (type: number, src: string) => {
        const sh = gl.createShader(type)!
        gl.shaderSource(sh, src)
        gl.compileShader(sh)
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            console.warn(gl.getShaderInfoLog(sh))
            return null
        }
        return sh
    }
    const link = (vs: string, fs: string) => {
        const a = compile(gl.VERTEX_SHADER, vs)
        const b = compile(gl.FRAGMENT_SHADER, fs)
        if (!a || !b) return null
        const p = gl.createProgram()!
        gl.attachShader(p, a)
        gl.attachShader(p, b)
        gl.linkProgram(p)
        gl.deleteShader(a)
        gl.deleteShader(b)
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null
        return p
    }
    const cardProg = link(CARD_VS, CARD_FS)
    const glassProg = link(SCREEN_VS, GLASS_FS)
    if (!cardProg || !glassProg) return null

    const slotsOf = (p: WebGLProgram) => {
        const cache: Record<string, WebGLUniformLocation | null> = {}
        return (name: string) =>
            name in cache
                ? cache[name]
                : (cache[name] = gl.getUniformLocation(p, name))
    }
    const cu = slotsOf(cardProg)
    const pu = slotsOf(glassProg)

    // card strip mesh: 48 columns so the depth bend stays smooth
    const COLS = 48
    const grid: number[] = []
    for (let i = 0; i <= COLS; i++) grid.push(i / COLS, 0, i / COLS, 1)
    const order: number[] = []
    for (let i = 0; i < COLS; i++) {
        const a = i * 2
        order.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
    const gridBuf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(grid), gl.STATIC_DRAW)
    const orderBuf = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, orderBuf)
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(order),
        gl.STATIC_DRAW
    )
    const quadBuf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf)
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW
    )
    const aGrid = gl.getAttribLocation(cardProg, "aGrid")
    const aQuad = gl.getAttribLocation(glassProg, "aQuad")

    const blankTex = () => {
        const t = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, t)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            1,
            1,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 0, 0])
        )
        return t
    }
    const upload = (
        t: WebGLTexture | null,
        src: TexImageSource,
        premul = false
    ) => {
        gl.bindTexture(gl.TEXTURE_2D, t)
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premul)
        try {
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                src
            )
        } catch (err) {
            /* cross-origin media without CORS headers stays on its placeholder */
        }
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    }

    const frameTex = blankTex()
    const frameBuf = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuf)
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        frameTex,
        0
    )
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    const live = {
        offset: 0,
        speed: 0,
        lensFlow: 0,
        clock: 0,
        held: false,
        heldId: -1,
        lastX: 0,
        lastMoveAt: 0,
        downX: 0,
        downY: 0,
        downAt: 0,
        travel: 0,
        hover: false,
        touchedAt: -1e9,
        wheelUntil: 0,
        goal: null as number | null,
        frame: 0,
        stamp: 0,
        wakeTimer: 0 as any,
        index: -1,
        inView: typeof IntersectionObserver === "undefined",
        tabShown: typeof document === "undefined" ? true : !document.hidden,
        calm: false,
        clipsRunning: false,
        mediaKey: "",
        txtKey: "",
        slots: [] as Slot[],
        w: 0,
        h: 0,
        dpr: 1,
        cardW: 0,
        cardH: 0,
        pitch: 1,
        dead: false,
    }

    const motionQuery =
        typeof window !== "undefined" && window.matchMedia
            ? window.matchMedia("(prefers-reduced-motion: reduce)")
            : null
    live.calm = !!motionQuery?.matches

    const allowed = () => live.inView && live.tabShown && !live.dead

    const pauseClips = () => {
        for (const s of live.slots) s.clip?.pause()
        live.clipsRunning = false
    }
    const runClips = () => {
        for (const s of live.slots) if (s.clip) s.clip.play().catch(() => {})
        live.clipsRunning = true
    }

    const clearWake = () => {
        if (live.wakeTimer) clearTimeout(live.wakeTimer)
        live.wakeTimer = 0
    }

    const park = () => {
        if (live.frame) cancelAnimationFrame(live.frame)
        live.frame = 0
        clearWake()
        live.held = false
        live.heldId = -1
        live.speed = 0
        live.lensFlow = 0
        live.goal = null
        live.wheelUntil = 0
        host.style.cursor = ""
        pauseClips()
    }

    const wake = () => {
        if (live.frame || !allowed()) return
        live.stamp = performance.now()
        live.frame = requestAnimationFrame(tick)
    }

    const disposeSlots = () => {
        for (const s of live.slots) {
            if (s.clip) {
                s.clip.pause()
                s.clip.removeAttribute("src")
                s.clip.load()
            }
            if (s.img) s.img.onload = null
            gl.deleteTexture(s.tex)
            gl.deleteTexture(s.txt)
        }
        live.slots = []
    }

    const syncMedia = (cards: any[]) => {
        const key = JSON.stringify(cards.map((c, i) => mediaSource(c, i)))
        if (key === live.mediaKey) return
        live.mediaKey = key
        live.txtKey = ""
        disposeSlots()
        live.slots = cards.map((card, ci) => {
            const m = mediaSource(card, ci)
            const slot: Slot = {
                kind: m.kind,
                tex: blankTex(),
                ratio: 1,
                ready: false,
                clip: null,
                img: null,
                txt: blankTex(),
                hasTxt: false,
            }
            if (m.kind === "preset") {
                const sheet = paintSheet(m.preset)
                if (sheet) {
                    upload(slot.tex, sheet)
                    slot.ratio = SHEET_W / SHEET_H
                    slot.ready = true
                }
            } else if (m.kind === "image" && m.src) {
                const img = new Image()
                img.crossOrigin = "anonymous"
                img.decoding = "async"
                img.onload = () => {
                    if (live.dead) return
                    upload(slot.tex, img)
                    slot.ratio =
                        img.naturalWidth / Math.max(1, img.naturalHeight)
                    slot.ready = true
                    wake()
                }
                img.onerror = () => {
                    if (live.dead) return
                    const sheet = paintSheet(wrapIndex(ci, 6) + 1)
                    if (!sheet) return
                    upload(slot.tex, sheet)
                    slot.ratio = SHEET_W / SHEET_H
                    slot.ready = true
                    wake()
                }
                img.src = m.src
                slot.img = img
            } else if (m.kind === "video" && m.src) {
                const v = document.createElement("video")
                v.crossOrigin = "anonymous"
                v.muted = true
                v.loop = true
                v.playsInline = true
                v.setAttribute("playsinline", "")
                v.preload = "auto"
                v.addEventListener("loadeddata", () => {
                    if (live.dead) return
                    slot.ratio = v.videoWidth / Math.max(1, v.videoHeight)
                    slot.ready = true
                    wake()
                })
                v.src = m.src
                if (live.clipsRunning) v.play().catch(() => {})
                slot.clip = v
            }
            return slot
        })
    }

    const syncText = (cards: any[], cap: any) => {
        const show = !!cap?.show
        const key = JSON.stringify([
            show,
            cap?.font,
            cap?.color,
            cap?.shade,
            Math.round(live.cardW / 8),
            Math.round(live.cardH / 8),
            live.dpr,
            show ? cards.map((c) => [c?.title || "", c?.caption || ""]) : 0,
        ])
        if (key === live.txtKey) return
        live.txtKey = key
        const scale = Math.min(live.dpr, 1024 / Math.max(1, live.cardW))
        const pw = Math.max(2, Math.round(live.cardW * scale))
        const ph = Math.max(2, Math.round(live.cardH * scale))
        live.slots.forEach((slot, i) => {
            const title = cards[i]?.title || ""
            const caption = cards[i]?.caption || ""
            slot.hasTxt = show && !!(title || caption)
            if (!slot.hasTxt) return
            const cv = document.createElement("canvas")
            cv.width = pw
            cv.height = ph
            paintCaption(cv, title, caption, cap, scale)
            upload(slot.txt, cv, true)
        })
    }

    const measure = () => {
        const w = Math.max(1, host.clientWidth)
        const h = Math.max(1, host.clientHeight)
        const dpr = bound(
            typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
            1,
            2
        )
        if (w !== live.w || h !== live.h || dpr !== live.dpr) {
            live.w = w
            live.h = h
            live.dpr = dpr
            canvas.width = Math.round(w * dpr)
            canvas.height = Math.round(h * dpr)
            gl.bindTexture(gl.TEXTURE_2D, frameTex)
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                canvas.width,
                canvas.height,
                0,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                null
            )
        }
        const L = propsRef.current.layout || {}
        const ratio = cardRatio(L)
        let ch = h * bound(num(L.cardScale, 0.62), 0.2, 0.98)
        let cw = ch * ratio
        if (cw > w * 0.92) {
            cw = w * 0.92
            ch = cw / ratio
        }
        live.cardW = cw
        live.cardH = ch
        live.pitch = Math.max(1, cw + Math.max(0, num(L.gap, 24)))
    }

    const lensDepth = () => {
        const L = propsRef.current.layout || {}
        const lens = bound(num(L.perspective, 1100), 200, 6000)
        const bend = bound(num(L.curve, 220), -lens * 0.7, lens * 3)
        return { lens, bend }
    }

    const pieces = (count: number) => {
        const L = propsRef.current.layout || {}
        const lift = bound(num(L.focusScale, 0.08), 0, 0.6)
        const dim = bound(num(L.sideDim, 0.2), 0, 0.9)
        const total = count * live.pitch
        const reach = live.w / 2 + live.cardW * (1.5 + lift)
        const out: { x: number; i: number; size: number; shade: number }[] = []
        for (let i = 0; i < count; i++) {
            const raw = i * live.pitch - live.offset
            const base =
                ((((raw + total / 2) % total) + total) % total) - total / 2
            for (let k = -3; k <= 3; k++) {
                const x = base + k * total
                if (Math.abs(x) > reach) continue
                const near = Math.max(0, 1 - Math.abs(x) / live.pitch)
                const size = 1 + lift * near * near * (3 - 2 * near)
                const shade =
                    dim * Math.min(1, Math.abs(x) / Math.max(1, live.w / 2))
                out.push({ x, i, size, shade })
            }
        }
        out.sort((a, b) => Math.abs(b.x) - Math.abs(a.x))
        return out
    }

    const project = (x: number) => {
        const { lens, bend } = lensDepth()
        const nx = x / (live.w / 2)
        const k = lens / (lens + bend * nx * nx)
        return { sx: x * k, k }
    }

    const pick = (px: number, py: number) => {
        const list = pieces(live.slots.length).reverse()
        for (const p of list) {
            const half = (live.cardW / 2) * p.size
            const l = project(p.x - half).sx
            const r = project(p.x + half).sx
            const { k } = project(p.x)
            if (
                px >= l &&
                px <= r &&
                Math.abs(py) <= (live.cardH / 2) * p.size * k
            )
                return p
        }
        return null
    }

    const draw = () => {
        const P = propsRef.current
        const L = P.layout || {}
        const G = P.lens || {}
        const S = P.look || {}
        const { lens, bend } = lensDepth()

        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuf)
        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

        gl.useProgram(cardProg)
        gl.bindBuffer(gl.ARRAY_BUFFER, gridBuf)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, orderBuf)
        gl.enableVertexAttribArray(aGrid)
        gl.vertexAttribPointer(aGrid, 2, gl.FLOAT, false, 0, 0)

        const drop = bound(num(S.shadow, 0.32), 0, 1)
        const pad = 6 + drop * 64
        const dropTint = toRgba(S.shadowColor, [0.1, 0.13, 0.2, 1])
        const corner = Math.min(
            bound(num(S.radius, 28), 0, 400),
            live.cardW / 2,
            live.cardH / 2
        )
        const fillA = toRgba(S.placeholder, [0.89, 0.9, 0.92, 1])
        gl.uniform2f(cu("uView"), live.w, live.h)
        gl.uniform2f(cu("uHalf"), live.cardW / 2, live.cardH / 2)
        gl.uniform1f(cu("uPad"), pad)
        gl.uniform1f(cu("uBend"), bend)
        gl.uniform1f(cu("uLens"), lens)
        gl.uniform1f(cu("uCorner"), corner)
        gl.uniform1f(cu("uDrop"), drop)
        gl.uniform3f(cu("uDropTint"), dropTint[0], dropTint[1], dropTint[2])
        gl.uniform3f(cu("uFillA"), fillA[0], fillA[1], fillA[2])
        gl.uniform3f(
            cu("uFillB"),
            fillA[0] * 0.6,
            fillA[1] * 0.6,
            fillA[2] * 0.6
        )
        const backTone = toRgba(S.background, [0.95, 0.955, 0.965, 1])
        gl.uniform3f(cu("uShadeTint"), backTone[0], backTone[1], backTone[2])
        gl.uniform1i(cu("uImg"), 0)
        gl.uniform1i(cu("uTxt"), 1)

        for (const p of pieces(live.slots.length)) {
            const slot = live.slots[p.i]
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, slot.tex)
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, slot.txt)
            gl.uniform1f(cu("uX"), p.x)
            gl.uniform1f(cu("uSize"), p.size)
            gl.uniform1f(cu("uShade"), p.shade)
            gl.uniform1f(cu("uHasImg"), slot.ready ? 1 : 0)
            gl.uniform1f(cu("uImgRatio"), slot.ratio)
            gl.uniform1f(cu("uHasTxt"), slot.hasTxt ? 1 : 0)
            gl.drawElements(gl.TRIANGLES, order.length, gl.UNSIGNED_SHORT, 0)
        }
        gl.disableVertexAttribArray(aGrid)

        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.disable(gl.BLEND)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.useProgram(glassProg)
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf)
        gl.enableVertexAttribArray(aQuad)
        gl.vertexAttribPointer(aQuad, 2, gl.FLOAT, false, 0, 0)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, frameTex)

        const power = bound(num(G.intensity, 1), 0, 2)
        const rimTint = toRgba(G.rimColor, [1, 1, 1, 1])
        const glass = toRgba(G.tint, [0.95, 0.97, 1, 1])
        const back = toRgba(S.background, [0.95, 0.955, 0.965, 1])
        const solid = !S.transparent
        const taps = G.quality === "Low" ? 8 : G.quality === "Medium" ? 16 : 32
        gl.uniform1i(pu("uFrame"), 0)
        gl.uniform2f(pu("uPx"), canvas.width, canvas.height)
        gl.uniform1f(pu("uBand"), bound(num(G.zone, 0.2), 0.02, 0.5))
        gl.uniform1f(pu("uPower"), power)
        gl.uniform1f(pu("uBulge"), bound(num(G.warp, 0.7), 0, 2))
        gl.uniform1f(pu("uFlare"), bound(num(G.flare, 0.6), 0, 2))
        gl.uniform1f(pu("uDrag"), bound(num(G.smear, 0.8), 0, 2))
        gl.uniform1f(pu("uSplit"), bound(num(G.prism, 0.7), 0, 2))
        gl.uniform1f(
            pu("uWave"),
            live.calm ? 0 : bound(num(G.ripple, 0.35), 0, 2)
        )
        gl.uniform1f(pu("uRim"), bound(num(G.rim, 0.5), 0, 2))
        gl.uniform3f(
            pu("uRimTint"),
            rimTint[0] * rimTint[3],
            rimTint[1] * rimTint[3],
            rimTint[2] * rimTint[3]
        )
        gl.uniform1f(pu("uSoft"), bound(num(G.blur, 0.6), 0, 2))
        gl.uniform1f(pu("uTaps"), taps)
        gl.uniform1f(pu("uClock"), live.clock)
        gl.uniform1f(pu("uFlow"), live.lensFlow)
        gl.uniform1f(pu("uGleam"), bound(num(G.sheen, 0.5), 0, 2))
        gl.uniform3f(pu("uGlass"), glass[0], glass[1], glass[2])
        gl.uniform1f(pu("uGlassMix"), bound(num(G.tintAmount, 0.25), 0, 1))
        gl.uniform1f(pu("uFade"), bound(num(S.edgeFade, 0), 0, 0.5))
        gl.uniform3f(pu("uBack"), back[0], back[1], back[2])
        gl.uniform1f(pu("uSolid"), solid ? 1 : 0)
        gl.uniform1f(pu("uTravel"), live.offset / live.pitch)
        gl.uniform1f(pu("uFrameMode"), G.shape === "Frame" ? 1 : 0)
        gl.uniform1f(pu("uScale"), live.dpr)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        gl.disableVertexAttribArray(aQuad)
    }

    const cruiseOn = (now: number) => {
        const M = propsRef.current.motion || {}
        if (!M.autoplay || live.calm || num(M.speed, 60) <= 0) return false
        if (M.pauseOnHover && live.hover) return false
        if (live.held || live.goal !== null || now < live.wheelUntil)
            return false
        return (
            now - live.touchedAt >= bound(num(M.resumeDelay, 1.5), 0, 30) * 1000
        )
    }

    const tick = (now: number) => {
        live.frame = 0
        if (!allowed()) {
            park()
            return
        }
        if (!live.clipsRunning) runClips()
        const dt = bound((now - live.stamp) / 1000, 0, 0.05)
        live.stamp = now
        const P = propsRef.current
        const cards: any[] = Array.isArray(P.cards) ? P.cards : []
        const M = P.motion || {}
        const I = P.interaction || {}

        measure()
        syncMedia(cards)
        syncText(cards, P.captions)

        const n = live.slots.length
        const cruising = cruiseOn(now)
        let settling = false
        const wheeling = now < live.wheelUntil
        if (!live.held && !wheeling && n > 0) {
            if (live.goal !== null) {
                const diff = live.goal - live.offset
                live.offset += diff * (1 - Math.exp(-9 * dt))
                live.speed = 0
                if (Math.abs(diff) < 0.4) {
                    live.offset = live.goal
                    live.goal = null
                }
            } else if (cruising) {
                const target =
                    num(M.speed, 60) * (M.direction === "Right" ? -1 : 1)
                live.speed += (target - live.speed) * (1 - Math.exp(-2.5 * dt))
                live.offset += live.speed * dt
            } else {
                const damp = 0.8 + bound(num(I.damping, 0.45), 0, 1) * 9
                live.speed *= Math.exp(-damp * dt)
                live.offset += live.speed * dt
                if (I.snap !== false && Math.abs(live.speed) < 140) {
                    const rest =
                        Math.round(live.offset / live.pitch) * live.pitch
                    const diff = rest - live.offset
                    live.offset += diff * (1 - Math.exp(-8 * dt))
                    live.speed *= Math.exp(-6 * dt)
                    if (Math.abs(diff) < 0.3) live.offset = rest
                    else settling = true
                }
            }
        }

        const flowTarget = bound(live.speed / 1800, -1, 1)
        live.lensFlow += (flowTarget - live.lensFlow) * (1 - Math.exp(-8 * dt))
        if (Math.abs(live.lensFlow) < 0.002 && flowTarget === 0)
            live.lensFlow = 0
        if (!live.calm) live.clock += dt

        for (const s of live.slots) {
            if (s.clip && s.ready && s.clip.readyState >= 2)
                upload(s.tex, s.clip)
        }

        draw()

        if (n > 0) {
            const idx = wrapIndex(Math.round(live.offset / live.pitch), n)
            if (idx !== live.index) {
                live.index = idx
                hooks.onIndex(idx)
            }
        }

        const clipsLive = live.slots.some((s) => s.clip && s.ready)
        const busy =
            live.held ||
            wheeling ||
            cruising ||
            settling ||
            live.goal !== null ||
            Math.abs(live.speed) > 3 ||
            live.lensFlow !== 0 ||
            clipsLive
        if (busy) {
            live.frame = requestAnimationFrame(tick)
            return
        }
        live.speed = 0
        clearWake()
        if (
            M.autoplay &&
            !live.calm &&
            num(M.speed, 60) > 0 &&
            !(M.pauseOnHover && live.hover)
        ) {
            const left =
                bound(num(M.resumeDelay, 1.5), 0, 30) * 1000 -
                (now - live.touchedAt)
            if (left > 0)
                live.wakeTimer = setTimeout(() => {
                    live.wakeTimer = 0
                    wake()
                }, left + 20)
        }
    }

    const steer = (delta: number) => {
        if (!live.slots.length) return
        const from = live.goal ?? live.offset
        const goal = (Math.round(from / live.pitch) + delta) * live.pitch
        live.touchedAt = performance.now()
        live.speed = 0
        if (live.calm) {
            live.offset = goal
            live.goal = null
        } else live.goal = goal
        wake()
    }

    const jumpTo = (target: number) => {
        const n = live.slots.length
        if (!n) return
        const here = Math.round((live.goal ?? live.offset) / live.pitch)
        let diff = target - wrapIndex(here, n)
        if (diff > n / 2) diff -= n
        if (diff < -n / 2) diff += n
        steer(diff)
    }

    // ---- input
    const onDown = (e: PointerEvent) => {
        if (e.button !== 0) return
        const I = propsRef.current.interaction || {}
        live.downX = e.clientX
        live.downY = e.clientY
        live.downAt = performance.now()
        live.travel = 0
        if (I.drag === false) return
        live.held = true
        live.heldId = e.pointerId
        live.lastX = e.clientX
        live.lastMoveAt = live.downAt
        live.speed = 0
        live.goal = null
        live.touchedAt = live.downAt
        try {
            host.setPointerCapture(e.pointerId)
        } catch (err) {}
        host.style.cursor = "grabbing"
        wake()
    }
    const onMove = (e: PointerEvent) => {
        if (!live.held || e.pointerId !== live.heldId) return
        const I = propsRef.current.interaction || {}
        const now = performance.now()
        const dx =
            (e.clientX - live.lastX) * bound(num(I.sensitivity, 1), 0.05, 5)
        live.travel += Math.abs(e.clientX - live.lastX)
        live.lastX = e.clientX
        live.offset -= dx
        const dt = Math.max(1, now - live.lastMoveAt) / 1000
        live.speed = bound(live.speed * 0.55 + (-dx / dt) * 0.45, -7000, 7000)
        live.lastMoveAt = now
        live.touchedAt = now
        wake()
    }
    const onUp = (e: PointerEvent) => {
        const now = performance.now()
        const wasHeld = live.held && e.pointerId === live.heldId
        if (wasHeld) {
            live.held = false
            live.heldId = -1
            try {
                host.releasePointerCapture(e.pointerId)
            } catch (err) {}
            host.style.cursor = ""
            if (now - live.lastMoveAt > 90 || live.calm) live.speed = 0
            live.touchedAt = now
        }
        const moved = Math.hypot(e.clientX - live.downX, e.clientY - live.downY)
        if (
            e.type === "pointerup" &&
            moved < 6 &&
            now - live.downAt < 450 &&
            live.travel < 6
        ) {
            const box = host.getBoundingClientRect()
            const hit = pick(
                e.clientX - box.left - box.width / 2,
                e.clientY - box.top - box.height / 2
            )
            if (hit) {
                const near = Math.abs(hit.x) < live.pitch * 0.5
                const card = (propsRef.current.cards || [])[hit.i]
                if (near && card?.link) {
                    const I = propsRef.current.interaction || {}
                    if (I.newTab !== false)
                        window.open(card.link, "_blank", "noopener")
                    else window.location.href = card.link
                } else if (!near) {
                    live.speed = 0
                    steer(Math.round(hit.x / live.pitch))
                }
            }
        }
        wake()
    }
    const onWheel = (e: WheelEvent) => {
        const I = propsRef.current.interaction || {}
        if (I.drag === false || I.wheel === false) return
        const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? live.h : 1
        const raw =
            Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
        if (!raw) return
        e.preventDefault()
        const step = raw * unit * bound(num(I.sensitivity, 1), 0.05, 5)
        live.speed = bound(live.speed + step * 9, -6000, 6000)
        live.goal = null
        live.touchedAt = performance.now()
        wake()
    }
    const onKey = (e: KeyboardEvent) => {
        const I = propsRef.current.interaction || {}
        if (I.keyboard === false) return
        if (e.key === "ArrowLeft") {
            e.preventDefault()
            steer(-1)
        } else if (e.key === "ArrowRight") {
            e.preventDefault()
            steer(1)
        }
    }
    const onEnter = () => {
        live.hover = true
    }
    const onLeave = () => {
        live.hover = false
        wake()
    }
    const onShown = () => {
        live.tabShown = !document.hidden
        if (allowed()) wake()
        else park()
    }
    const onMotionPref = () => {
        live.calm = !!motionQuery?.matches
        wake()
    }
    const onLost = (e: Event) => {
        e.preventDefault()
        park()
        hooks.onLost()
    }

    host.addEventListener("pointerdown", onDown)
    host.addEventListener("pointermove", onMove)
    host.addEventListener("pointerup", onUp)
    host.addEventListener("pointercancel", onUp)
    host.addEventListener("pointerenter", onEnter)
    host.addEventListener("pointerleave", onLeave)
    host.addEventListener("wheel", onWheel, { passive: false })
    host.addEventListener("keydown", onKey)
    canvas.addEventListener("webglcontextlost", onLost)
    document.addEventListener("visibilitychange", onShown)
    motionQuery?.addEventListener?.("change", onMotionPref)

    let seer: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== "undefined") {
        seer = new IntersectionObserver((entries) => {
            const entry = entries[entries.length - 1]
            live.inView = !!entry?.isIntersecting
            if (allowed()) wake()
            else park()
        })
        seer.observe(host)
    }
    let sizer: ResizeObserver | null = null
    const onResize = () => wake()
    if (typeof ResizeObserver !== "undefined") {
        sizer = new ResizeObserver(onResize)
        sizer.observe(host)
    } else window.addEventListener("resize", onResize)

    wake()

    return {
        wake,
        steer,
        jumpTo,
        destroy() {
            live.dead = true
            park()
            seer?.disconnect()
            sizer?.disconnect()
            window.removeEventListener("resize", onResize)
            host.removeEventListener("pointerdown", onDown)
            host.removeEventListener("pointermove", onMove)
            host.removeEventListener("pointerup", onUp)
            host.removeEventListener("pointercancel", onUp)
            host.removeEventListener("pointerenter", onEnter)
            host.removeEventListener("pointerleave", onLeave)
            host.removeEventListener("wheel", onWheel)
            host.removeEventListener("keydown", onKey)
            canvas.removeEventListener("webglcontextlost", onLost)
            document.removeEventListener("visibilitychange", onShown)
            motionQuery?.removeEventListener?.("change", onMotionPref)
            disposeSlots()
            gl.deleteTexture(frameTex)
            gl.deleteFramebuffer(frameBuf)
            gl.deleteBuffer(gridBuf)
            gl.deleteBuffer(orderBuf)
            gl.deleteBuffer(quadBuf)
            gl.deleteProgram(cardProg)
            gl.deleteProgram(glassProg)
        },
    }
}

// --------------------------------------------------------------- live view

function NavBar(props: {
    count: number
    active: number
    nav: any
    onStep: (d: number) => void
    onDot: (i: number) => void
}) {
    const { count, active, nav, onStep, onDot } = props
    const mode = nav?.mode ?? "Dots"
    if (mode === "None" || count < 2) return null
    const ink = nav?.color || "rgba(20,24,34,0.85)"
    const plate = nav?.background || "rgba(255,255,255,0.65)"
    const showArrows = mode === "Arrows" || mode === "Both"
    const showDots = mode === "Dots" || mode === "Both"
    const arrow = (d: number) => (
        <button
            type="button"
            aria-label={d < 0 ? "Previous card" : "Next card"}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onStep(d)}
            style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                border: "none",
                background: "transparent",
                color: ink,
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                padding: 0,
            }}
        >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                    d={
                        d < 0
                            ? "M8.5 2.5 4 7l4.5 4.5"
                            : "M5.5 2.5 10 7l-4.5 4.5"
                    }
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    )
    return (
        <div
            style={{
                position: "absolute",
                left: "50%",
                bottom: num(nav?.offset, 20),
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: showArrows ? "4px 6px" : "10px 14px",
                borderRadius: 999,
                background: plate,
                boxShadow:
                    "inset 0 0 0 1px rgba(20,24,34,0.08), 0 6px 20px rgba(20,24,34,0.08)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                zIndex: 2,
            }}
        >
            {showArrows && arrow(-1)}
            {showDots &&
                Array.from({ length: count }, (_, i) => (
                    <button
                        key={i}
                        type="button"
                        aria-label={`Show card ${i + 1}`}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => onDot(i)}
                        style={{
                            width: i === active ? 18 : 6,
                            height: 6,
                            borderRadius: 3,
                            border: "none",
                            padding: 0,
                            background: ink,
                            opacity: i === active ? 1 : 0.35,
                            cursor: "pointer",
                            transition: "width 0.3s ease, opacity 0.3s ease",
                        }}
                    />
                ))}
            {showArrows && arrow(1)}
        </div>
    )
}

function LiveStage(props: any) {
    const hostRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const propsRef = React.useRef(props)
    propsRef.current = props
    const stageRef = React.useRef<ReturnType<typeof launchStage>>(null)
    const [active, setActive] = React.useState(0)
    const [failed, setFailed] = React.useState(false)
    const [generation, setGeneration] = React.useState(0)

    React.useEffect(() => {
        if (!hostRef.current || !canvasRef.current) return
        const stage = launchStage(
            hostRef.current,
            canvasRef.current,
            propsRef,
            {
                onIndex: (i) => setActive(i),
                onLost: () =>
                    setTimeout(() => setGeneration((g) => g + 1), 400),
            }
        )
        if (!stage) {
            setFailed(true)
            return
        }
        stageRef.current = stage
        return () => {
            stage.destroy()
            stageRef.current = null
        }
    }, [generation])

    React.useEffect(() => {
        stageRef.current?.wake()
    })

    if (failed) return <StillFrame {...props} />

    const S = props.look || {}
    const cards = Array.isArray(props.cards) ? props.cards : []
    const solid = !S.transparent
    return (
        <div
            ref={hostRef}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label="Media carousel"
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: solid ? S.background || "#F2F3F6" : "transparent",
                touchAction: "pan-y",
                userSelect: "none",
                WebkitUserSelect: "none",
                outline: "none",
                cursor: props.interaction?.drag === false ? "default" : "grab",
            }}
        >
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
            <NavBar
                count={cards.length}
                active={active}
                nav={props.navigation}
                onStep={(d) => stageRef.current?.steer(d)}
                onDot={(i) => stageRef.current?.jumpTo(i)}
            />
        </div>
    )
}

// ------------------------------------------------------------- still frame

function StillFrame(props: any) {
    const cards: any[] = Array.isArray(props.cards) ? props.cards : []
    const L = props.layout || {}
    const S = props.look || {}
    const G = props.lens || {}
    const C = props.captions || {}
    const nav = props.navigation || {}
    const styled = true
    const ratio = cardRatio(L)
    const scale = bound(num(L.cardScale, 0.62), 0.2, 0.98)
    const gap = Math.max(0, num(L.gap, 24))
    const radius = bound(num(S.radius, 28), 0, 400)
    const shadow = bound(num(S.shadow, 0.32), 0, 1)
    const lens = bound(num(L.perspective, 1100), 200, 6000)
    const bend = bound(num(L.curve, 220), -lens * 0.7, lens * 3)
    const lift = bound(num(L.focusScale, 0.08), 0, 0.6)
    const dim = bound(num(L.sideDim, 0.2), 0, 0.9)
    const rim = toRgba(G.rimColor, [1, 1, 1, 1])
    const rimCss = (a: number) =>
        `rgba(${Math.round(rim[0] * 255)},${Math.round(rim[1] * 255)},${Math.round(rim[2] * 255)},${a})`
    const zone = bound(num(G.zone, 0.2), 0.02, 0.5) * 100
    const power = bound(num(G.intensity, 1), 0, 2)

    const sheets = React.useMemo(() => {
        const out: Record<number, string> = {}
        for (let ci = 0; ci < cards.length; ci++) {
            const m = mediaSource(cards[ci], ci)
            if (m.kind === "preset" && !out[m.preset]) {
                const cv = paintSheet(m.preset)
                if (cv) out[m.preset] = cv.toDataURL("image/jpeg", 0.9)
            }
        }
        return out
    }, [cards.length])

    const n = cards.length
    const reach = n ? Math.min(n + 1, 4) : 0
    const estW = Math.min(700 * scale * ratio, 700 * 0.92)
    const pitchEst = estW + gap
    const slots: number[] = []
    for (let j = -reach; j <= reach; j++) slots.push(j)

    const font = C.font || {}
    const capSize = num(font.fontSize, 18)

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: S.transparent
                    ? "transparent"
                    : S.background || "#F2F3F6",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap,
                    perspective: styled ? lens : undefined,
                }}
            >
                {n > 0 &&
                    slots.map((j) => {
                        const card = cards[wrapIndex(j, n)]
                        const m = mediaSource(card, wrapIndex(j, n))
                        const nx = (j * pitchEst) / 350
                        const z = styled ? -bend * nx * nx : 0
                        const near = Math.max(0, 1 - Math.abs(j))
                        const size = styled ? 1 + lift * near : 1
                        const shade = styled
                            ? dim * Math.min(1, Math.abs(nx))
                            : 0
                        const showCap = C.show && (card?.title || card?.caption)
                        return (
                            <div
                                key={j}
                                style={{
                                    position: "relative",
                                    flexShrink: 0,
                                    height: `${scale * 100}%`,
                                    aspectRatio: `${ratio}`,
                                    borderRadius: radius,
                                    overflow: "hidden",
                                    background: S.placeholder || "#E3E5EA",
                                    boxShadow:
                                        shadow > 0
                                            ? `0 ${12 * shadow}px ${48 * shadow}px rgba(26,33,51,${0.4 * shadow})`
                                            : undefined,
                                    zIndex: 10 - Math.abs(j),
                                    transform: styled
                                        ? `translateZ(${z}px) scale(${size})`
                                        : undefined,
                                }}
                            >
                                {m.kind !== "video" &&
                                    (m.kind === "preset"
                                        ? sheets[m.preset]
                                        : m.src) && (
                                        <img
                                            src={
                                                m.kind === "preset"
                                                    ? sheets[m.preset]
                                                    : m.src
                                            }
                                            alt={card?.title || ""}
                                            draggable={false}
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block",
                                            }}
                                        />
                                    )}
                                {m.kind === "video" && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            display: "grid",
                                            placeItems: "center",
                                            background:
                                                "linear-gradient(160deg,#eceef2,#d9dce3)",
                                        }}
                                    >
                                        <svg
                                            width="44"
                                            height="44"
                                            viewBox="0 0 44 44"
                                        >
                                            <circle
                                                cx="22"
                                                cy="22"
                                                r="21"
                                                fill="rgba(20,24,34,0.12)"
                                            />
                                            <path
                                                d="M18 14.5v15l12-7.5z"
                                                fill="rgba(20,24,34,0.7)"
                                            />
                                        </svg>
                                    </div>
                                )}
                                {showCap && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "flex-end",
                                            padding: "7%",
                                            background: `linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,${bound(num(C.shade, 0.6), 0, 1)}) 100%)`,
                                            color: C.color || "#fff",
                                        }}
                                    >
                                        {card?.title && (
                                            <div
                                                style={{
                                                    ...font,
                                                    fontSize: capSize,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                            >
                                                {card.title}
                                            </div>
                                        )}
                                        {card?.caption && (
                                            <div
                                                style={{
                                                    ...font,
                                                    fontSize: capSize * 0.72,
                                                    fontWeight: 500,
                                                    opacity: 0.72,
                                                    marginTop: capSize * 0.3,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                            >
                                                {card.caption}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {shade > 0 && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            background: S.transparent
                                                ? "#fff"
                                                : S.background || "#F2F3F6",
                                            opacity: shade,
                                        }}
                                    />
                                )}
                            </div>
                        )
                    })}
            </div>
            {styled &&
                power > 0 &&
                [0, 1].map((side) => (
                    <div
                        key={side}
                        style={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            [side ? "right" : "left"]: 0,
                            width: `${zone}%`,
                            pointerEvents: "none",
                            background: `linear-gradient(${side ? "270deg" : "90deg"}, ${rimCss(0.28 * power)} 0%, ${rimCss(0.06 * power)} 18%, rgba(0,0,0,0) 100%)`,
                            boxShadow: `inset ${side ? "-" : ""}2px 0 0 ${rimCss(0.55 * Math.min(1, power))}, inset ${side ? "-" : ""}5px 0 0 rgba(255,60,90,${0.18 * power}), inset ${side ? "-" : ""}8px 0 0 rgba(60,160,255,${0.16 * power})`,
                        }}
                    />
                ))}
            {(nav.mode ?? "Dots") !== "None" && n > 1 && (
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        bottom: num(nav.offset, 20),
                        transform: "translateX(-50%)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "10px 14px",
                        borderRadius: 999,
                        background: nav.background || "rgba(255,255,255,0.65)",
                        boxShadow:
                            "inset 0 0 0 1px rgba(20,24,34,0.08), 0 6px 20px rgba(20,24,34,0.08)",
                    }}
                >
                    {Array.from(
                        { length: (nav.mode ?? "Dots") === "Arrows" ? 0 : n },
                        (_, i) => (
                            <div
                                key={i}
                                style={{
                                    width: i === 0 ? 18 : 6,
                                    height: 6,
                                    borderRadius: 3,
                                    background:
                                        nav.color || "rgba(20,24,34,0.85)",
                                    opacity: i === 0 ? 1 : 0.35,
                                }}
                            />
                        )
                    )}
                    {(nav.mode ?? "Dots") === "Arrows" && (
                        <div
                            style={{
                                width: 60,
                                height: 14,
                                color: nav.color || "rgba(20,24,34,0.85)",
                                fontSize: 12,
                                textAlign: "center",
                                lineHeight: "14px",
                            }}
                        >
                            ‹ ›
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ------------------------------------------------------------------- entry

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Dioptra(props: any) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StillFrame {...props} />
    return <LiveStage {...props} />
}

// ---------------------------------------------------------------- controls

const isSource = (want: string) => (p: any) => (p?.source ?? "Image") !== want

addPropertyControls(Dioptra, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 24,
        control: {
            type: ControlType.Object,
            controls: {
                source: {
                    type: ControlType.Enum,
                    title: "Source",
                    options: ["Image", "Video"],
                    displaySegmentedControl: true,
                    defaultValue: "Image",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: isSource("Image"),
                },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…",
                    hidden: isSource("Image"),
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: isSource("Video"),
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://…/clip.mp4",
                    hidden: isSource("Video"),
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "",
                },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    defaultValue: "",
                },
                link: { type: ControlType.Link, title: "CMS Link" },
            },
        },
        defaultValue: [
            {
                source: "Image",
                imageUrl:
                    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80",
                title: "Valley Light",
                caption: "Morning over the granite walls",
            },
            {
                source: "Image",
                imageUrl:
                    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1000&q=80",
                title: "Sunlit Ridge",
                caption: "First light across the hills",
            },
            {
                source: "Image",
                imageUrl:
                    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1000&q=80",
                title: "Still Water",
                caption: "A quiet lake below the peaks",
            },
            {
                source: "Image",
                imageUrl:
                    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1000&q=80",
                title: "Fog Line",
                caption: "Mist rolling through the pines",
            },
            {
                source: "Image",
                imageUrl:
                    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1000&q=80",
                title: "Green Hour",
                caption: "Sun through the forest canopy",
            },
            {
                source: "Image",
                imageUrl:
                    "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=80",
                title: "High Camp",
                caption: "Stars above the snowline",
            },
        ],
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: true,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0,
                max: 600,
                step: 5,
                unit: "px/s",
                defaultValue: 60,
                hidden: (p: any) => !p.autoplay,
            },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["Left", "Right"],
                displaySegmentedControl: true,
                defaultValue: "Left",
                hidden: (p: any) => !p.autoplay,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Hover Pause",
                defaultValue: true,
                hidden: (p: any) => !p.autoplay,
            },
            resumeDelay: {
                type: ControlType.Number,
                title: "Resume After",
                min: 0,
                max: 10,
                step: 0.1,
                unit: "s",
                defaultValue: 1.5,
                hidden: (p: any) => !p.autoplay,
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            cardScale: {
                type: ControlType.Number,
                title: "Card Size",
                min: 0.2,
                max: 0.98,
                step: 0.01,
                defaultValue: 0.62,
            },
            aspect: {
                type: ControlType.Enum,
                title: "Ratio",
                options: ["4:5", "3:4", "2:3", "1:1", "9:16", "16:9", "Custom"],
                defaultValue: "4:5",
            },
            customRatio: {
                type: ControlType.Number,
                title: "W / H",
                min: 0.3,
                max: 3,
                step: 0.01,
                defaultValue: 0.8,
                hidden: (p: any) => p.aspect !== "Custom",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
                defaultValue: 24,
            },
            curve: {
                type: ControlType.Number,
                title: "Depth Curve",
                min: -400,
                max: 1200,
                step: 5,
                defaultValue: 220,
            },
            perspective: {
                type: ControlType.Number,
                title: "Perspective",
                min: 300,
                max: 4000,
                step: 10,
                defaultValue: 1100,
            },
            focusScale: {
                type: ControlType.Number,
                title: "Focus Lift",
                min: 0,
                max: 0.4,
                step: 0.01,
                defaultValue: 0.08,
            },
            sideDim: {
                type: ControlType.Number,
                title: "Side Fade",
                min: 0,
                max: 0.9,
                step: 0.01,
                defaultValue: 0.2,
            },
        },
    },
    lens: {
        type: ControlType.Object,
        title: "Glass Lens",
        controls: {
            intensity: {
                type: ControlType.Number,
                title: "Intensity",
                min: 0,
                max: 1.5,
                step: 0.01,
                defaultValue: 1,
            },
            shape: {
                type: ControlType.Enum,
                title: "Edges",
                options: ["Sides", "Frame"],
                optionTitles: ["Sides", "All Four"],
                displaySegmentedControl: true,
                defaultValue: "Sides",
            },
            zone: {
                type: ControlType.Number,
                title: "Edge Zone",
                min: 0.03,
                max: 0.45,
                step: 0.01,
                defaultValue: 0.2,
            },
            warp: {
                type: ControlType.Number,
                title: "Edge Warp",
                min: 0,
                max: 1.5,
                step: 0.01,
                defaultValue: 0.7,
            },
            flare: {
                type: ControlType.Number,
                title: "Vertical Flare",
                min: 0,
                max: 1.5,
                step: 0.01,
                defaultValue: 0.6,
            },
            smear: {
                type: ControlType.Number,
                title: "Liquid Smear",
                min: 0,
                max: 1.5,
                step: 0.01,
                defaultValue: 0.8,
            },
            prism: {
                type: ControlType.Number,
                title: "Prism RGB",
                min: 0,
                max: 1.5,
                step: 0.01,
                defaultValue: 0.7,
            },
            ripple: {
                type: ControlType.Number,
                title: "Glass Ripple",
                min: 0,
                max: 1.5,
                step: 0.01,
                defaultValue: 0.35,
            },
            blur: {
                type: ControlType.Number,
                title: "Optical Blur",
                min: 0,
                max: 1.5,
                step: 0.01,
                defaultValue: 0.6,
            },
            quality: {
                type: ControlType.Enum,
                title: "Blur Taps",
                options: ["Low", "Medium", "High"],
                optionTitles: ["8", "16", "32"],
                displaySegmentedControl: true,
                defaultValue: "High",
            },
            rim: {
                type: ControlType.Number,
                title: "Border Glow",
                min: 0,
                max: 1.5,
                step: 0.01,
                defaultValue: 0.5,
            },
            rimColor: {
                type: ControlType.Color,
                title: "Glow Color",
                defaultValue: "#FFFFFF",
            },
            sheen: {
                type: ControlType.Number,
                title: "Sheen",
                min: 0,
                max: 1.5,
                step: 0.01,
                defaultValue: 0.5,
            },
            tint: {
                type: ControlType.Color,
                title: "Glass Tint",
                defaultValue: "#F2F6FF",
            },
            tintAmount: {
                type: ControlType.Number,
                title: "Tint Mix",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.25,
            },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            transparent: {
                type: ControlType.Boolean,
                title: "Transparent",
                defaultValue: false,
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#F2F3F6",
                hidden: (p: any) => p.transparent,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 120,
                step: 1,
                unit: "px",
                defaultValue: 28,
            },
            shadow: {
                type: ControlType.Number,
                title: "Shadow",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.32,
            },
            shadowColor: {
                type: ControlType.Color,
                title: "Shadow Color",
                defaultValue: "#1A2133",
                hidden: (p: any) => !p.shadow,
            },
            edgeFade: {
                type: ControlType.Number,
                title: "Edge Fade",
                min: 0,
                max: 0.3,
                step: 0.01,
                defaultValue: 0,
            },
            placeholder: {
                type: ControlType.Color,
                title: "Loading Fill",
                defaultValue: "#E3E5EA",
            },
        },
    },
    captions: {
        type: ControlType.Object,
        title: "Captions",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: false,
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 18,
                    variant: "Semibold",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.2em",
                },
                hidden: (p: any) => !p.show,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#FFFFFF",
                hidden: (p: any) => !p.show,
            },
            shade: {
                type: ControlType.Number,
                title: "Scrim",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.6,
                hidden: (p: any) => !p.show,
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        controls: {
            drag: {
                type: ControlType.Boolean,
                title: "Drag",
                defaultValue: true,
            },
            wheel: {
                type: ControlType.Boolean,
                title: "Mouse Wheel",
                defaultValue: true,
                hidden: (p: any) => p.drag === false,
            },
            sensitivity: {
                type: ControlType.Number,
                title: "Sensitivity",
                min: 0.2,
                max: 3,
                step: 0.05,
                defaultValue: 1,
                hidden: (p: any) => p.drag === false,
            },
            damping: {
                type: ControlType.Number,
                title: "Damping",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.45,
                hidden: (p: any) => p.drag === false,
            },
            snap: {
                type: ControlType.Boolean,
                title: "Snap to Card",
                defaultValue: true,
            },
            keyboard: {
                type: ControlType.Boolean,
                title: "Arrow Keys",
                defaultValue: true,
            },
            newTab: {
                type: ControlType.Boolean,
                title: "Links",
                enabledTitle: "New Tab",
                disabledTitle: "Same Tab",
                defaultValue: true,
            },
        },
    },
    navigation: {
        type: ControlType.Object,
        title: "Navigation",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Show",
                options: ["None", "Dots", "Arrows", "Both"],
                defaultValue: "Dots",
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "rgba(20, 24, 34, 0.85)",
                hidden: (p: any) => p.mode === "None",
            },
            background: {
                type: ControlType.Color,
                title: "Plate",
                defaultValue: "rgba(255, 255, 255, 0.65)",
                hidden: (p: any) => p.mode === "None",
            },
            offset: {
                type: ControlType.Number,
                title: "Bottom",
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
                defaultValue: 20,
                hidden: (p: any) => p.mode === "None",
            },
        },
    },
})
