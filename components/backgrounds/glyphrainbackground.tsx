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


type Density = "Low" | "Medium" | "High"
type Speed = "Slow" | "Normal" | "Fast"
type WindMode = "Off" | "On"
type Charset = "Symbols" | "Numbers" | "Mixed" | "Letters"

type Props = {
    density: Density
    speed: Speed
    wind: WindMode
    charset: Charset
    tint: string
    opacity: number
    fontSize: number
}

type Glyph = {
    x: number
    y: number
    vy: number
    vx: number
    size: number
    alpha: number
    ch: string
}

function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v))
}
function rand(a: number, b: number) {
    return a + Math.random() * (b - a)
}
function pick<T>(arr: T[]) {
    return arr[Math.floor(Math.random() * arr.length)]
}

// Full alphabets
const LETTERS: string[] = [
    ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    ..."abcdefghijklmnopqrstuvwxyz",
]

// 0–9 + a small set of multi-digit tokens that still looks nice visually
// (Full 1..100 is possible but becomes visually repetitive and messy.)
const NUMBERS: string[] = [
    ..."0123456789",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "25",
    "30",
    "33",
    "40",
    "44",
    "50",
    "55",
    "60",
    "66",
    "70",
    "77",
    "80",
    "88",
    "90",
    "99",
]

// Bigger symbol palette (still “clean”, not emoji)
const SYMBOLS: string[] = [
    "·",
    "•",
    "–",
    "—",
    "+",
    "×",
    "÷",
    "=",
    "~",
    "^",
    "_",
    "/",
    "\\",
    "*",
    ":",
    ";",
    ".",
    ",",
    "|",
    "!",
    "?",
    "#",
    "$",
    "%",
    "&",
    "@",
    "(",
    ")",
    "[",
    "]",
    "{",
    "}",
    "<",
    ">",
    "°",
    "±",
    "∞",
    "§",
    "¶",
    "¢",
    "£",
    "¥",
    "©",
    "®",
    "™",
    "□",
    "■",
    "△",
    "▲",
    "▽",
    "▼",
    "◇",
    "◆",
    "○",
    "●",
    "◎",
    "◌",
    "▢",
    "▣",
    "▤",
    "▥",
    "→",
    "←",
    "↑",
    "↓",
]

function getCharset(set: Charset): string[] {
    if (set === "Symbols") return SYMBOLS
    if (set === "Numbers") return NUMBERS
    if (set === "Letters") return LETTERS
    return [...SYMBOLS, ...NUMBERS, ...LETTERS]
}

function densityCount(d: Density, w: number, h: number) {
    const area = w * h
    const base = clamp(Math.round(area / 16000), 30, 240)
    if (d === "Low") return Math.round(base * 0.7)
    if (d === "High") return Math.round(base * 1.25)
    return base
}
function speedFactor(s: Speed) {
    if (s === "Slow") return 0.75
    if (s === "Fast") return 1.35
    return 1.0
}

export default function GlyphRainBackground({
    density = "Medium",
    speed = "Normal",
    wind = "On",
    charset = "Mixed",
    tint = "rgba(255,255,255,1)",
    opacity = 0.55,
    fontSize = 14,
}: Partial<Props>) {
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
    const glyphsRef = React.useRef<Glyph[]>([])
    const rafRef = React.useRef<number | null>(null)
    const lastRef = React.useRef<number>(0)
    const windPhaseRef = React.useRef<number>(0)

    React.useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let w = 1
        let h = 1
        let dpr = 1

        const charsetArr = getCharset(charset)

        // Keep settle behavior internally (looks good), but no UI control.
        const SETTLE_ZONE = 0.82

        const buildGlyphs = () => {
            const count = densityCount(density, w, h)
            const g: Glyph[] = []
            for (let i = 0; i < count; i++) {
                const size = rand(fontSize * 0.75, fontSize * 1.75)
                g.push({
                    x: rand(0, w),
                    y: rand(-h, h),
                    vy: rand(18, 50) * (size / fontSize) * speedFactor(speed),
                    vx: rand(-6, 6),
                    size,
                    // Rich but still premium
                    alpha: rand(0.18, 0.55),
                    ch: pick(charsetArr),
                })
            }
            glyphsRef.current = g
        }

        const ensureSize = () => {
            const cssW = Math.max(1, Math.floor(canvas.clientWidth))
            const cssH = Math.max(1, Math.floor(canvas.clientHeight))
            const nextDpr = Math.max(
                1,
                Math.min(2, window.devicePixelRatio || 1)
            )

            if (cssW !== w || cssH !== h || nextDpr !== dpr) {
                w = cssW
                h = cssH
                dpr = nextDpr
                canvas.width = Math.floor(w * dpr)
                canvas.height = Math.floor(h * dpr)
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
                buildGlyphs()
            }
        }

        const animate = (t: number) => {
            ensureSize()

            const dt = lastRef.current ? (t - lastRef.current) / 1000 : 0.016
            lastRef.current = t

            ctx.clearRect(0, 0, w, h)

            windPhaseRef.current += dt * 0.35
            const windVal =
                wind === "On" ? Math.sin(windPhaseRef.current) * 10 : 0

            ctx.textBaseline = "middle"
            ctx.textAlign = "center"
            ctx.fillStyle = tint

            const settleY = h * SETTLE_ZONE

            for (const g of glyphsRef.current) {
                g.y += g.vy * dt
                g.x += (g.vx + windVal) * dt

                if (g.x < -60) g.x = w + 60
                if (g.x > w + 60) g.x = -60

                // Subtle settle illusion near bottom
                if (g.y > settleY) {
                    g.y += g.vy * dt * -0.15
                    g.vx *= 0.985
                    g.alpha *= 0.996
                }

                // Respawn
                if (g.y > h + 80 || g.alpha < 0.02) {
                    g.y = rand(-80, -10)
                    g.x = rand(0, w)
                    g.size = rand(fontSize * 0.75, fontSize * 1.75)
                    g.vy =
                        rand(18, 50) * (g.size / fontSize) * speedFactor(speed)
                    g.vx = rand(-6, 6)
                    g.alpha = rand(0.18, 0.55)
                    g.ch = pick(charsetArr)
                }

                // Only alpha affects intensity; color stays exact.
                const a = clamp(g.alpha * opacity, 0, 1)
                if (a <= 0.001) continue

                ctx.globalAlpha = a
                ctx.font = `${g.size}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`
                ctx.fillText(g.ch, g.x, g.y)
            }

            ctx.globalAlpha = 1
            rafRef.current = requestAnimationFrame(animate)
        }

        rafRef.current = requestAnimationFrame(animate)

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [density, speed, wind, charset, tint, opacity, fontSize])

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                pointerEvents: "none",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", display: "block" }}
            />
        </div>
    )
}

addPropertyControls(GlyphRainBackground as any, {
    density: {
        type: ControlType.Enum,
        options: ["Low", "Medium", "High"],
        title: "Density",
    },
    speed: {
        type: ControlType.Enum,
        options: ["Slow", "Normal", "Fast"],
        title: "Speed",
    },
    wind: { type: ControlType.Enum, options: ["Off", "On"], title: "Wind" },
    charset: {
        type: ControlType.Enum,
        options: ["Symbols", "Numbers", "Mixed", "Letters"],
        title: "Chars",
    },
    tint: { type: ControlType.Color, title: "Tint" },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.55,
    },
    // ✅ More size range like you asked
    fontSize: {
        type: ControlType.Number,
        title: "Size",
        min: 10,
        max: 48,
        step: 1,
        defaultValue: 14,
    },
})
