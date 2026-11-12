/**
 * LiquidGradientText — Framer code component
 * One slow gradient flows through the whole headline. The cursor stirs it like liquid.
 *
 * Version: 1.0.0
 * Source:  https://github.com/YOUR_USERNAME/framer-text-effects
 */
import { useEffect, useRef } from "react"
import type { CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ─── 1. Types and defaults ───────────────────────────────────────────────────

type Align = "left" | "center" | "right"
type Tag = "h1" | "h2" | "h3" | "p" | "span"

interface FontValue {
    fontFamily?: string
    fontWeight?: number | string
    fontStyle?: string
    fontSize?: number | string
    letterSpacing?: number | string
    lineHeight?: number | string
}

interface Props {
    text?: string
    tag?: Tag
    font?: FontValue
    fitWidth?: boolean
    align?: Align
    base?: string
    accent?: string
    highlight?: string
    baseDark?: string
    accentDark?: string
    highlightDark?: string
    speed?: number
    stir?: number
    style?: CSSProperties
}

const DEFAULT_FONT: FontValue = {
    fontFamily: '"Apfel Grotezk", sans-serif',
    fontWeight: 700,
    fontStyle: "normal",
    fontSize: 160,
    letterSpacing: "-0.03em",
    lineHeight: 0.95,
}

// ─── 2. Helpers: font, color, text mask ──────────────────────────────────────

interface ResolvedFont {
    family: string
    weight: string
    style: string
    size: number
    letterSpacing: number // ratio of font size
    lineHeight: number // ratio of font size
}

function toNumber(value: unknown, fallback: number): number {
    const n =
        typeof value === "number" ? value : parseFloat(String(value ?? ""))
    return Number.isFinite(n) ? n : fallback
}

function resolveFont(font?: FontValue): ResolvedFont {
    const f = { ...DEFAULT_FONT, ...font }
    const size = toNumber(f.fontSize, 160)
    const ls = String(f.letterSpacing ?? "0")
    const lh = String(f.lineHeight ?? "1")
    return {
        family: f.fontFamily || String(DEFAULT_FONT.fontFamily),
        weight: String(f.fontWeight ?? 700),
        style: f.fontStyle || "normal",
        size,
        letterSpacing: ls.endsWith("em")
            ? toNumber(ls, 0)
            : toNumber(ls, 0) / size,
        lineHeight: lh.endsWith("px")
            ? toNumber(lh, size) / size
            : toNumber(lh, 1) || 1,
    }
}

/** Turns any CSS color, including Framer color styles (CSS variables), into [r, g, b]. */
function toRGB(el: HTMLElement, color: string): [number, number, number] {
    const previous = el.style.color
    el.style.color = color
    const match = getComputedStyle(el).color.match(/[\d.]+/g)
    el.style.color = previous
    return match
        ? [Number(match[0]), Number(match[1]), Number(match[2])]
        : [0, 0, 0]
}

/** Draws the text once, in plain black, on its own canvas. Used as a stencil every frame. */
function drawMask(
    mask: HTMLCanvasElement,
    text: string,
    font: ResolvedFont,
    fit: boolean,
    align: Align,
    w: number,
    h: number,
    dpr: number
) {
    mask.width = Math.max(1, Math.round(w * dpr))
    mask.height = Math.max(1, Math.round(h * dpr))
    const ctx = mask.getContext("2d")
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const lines = text.split("\n")
    const setFont = (size: number) => {
        ctx.font = `${font.style} ${font.weight} ${size}px ${font.family}`
        const spaced = ctx as CanvasRenderingContext2D & {
            letterSpacing?: string
        }
        if ("letterSpacing" in ctx)
            spaced.letterSpacing = `${font.letterSpacing * size}px`
    }

    let size = font.size
    if (fit) {
        setFont(100)
        const widest = Math.max(
            1,
            ...lines.map((line) => ctx.measureText(line).width)
        )
        size = Math.max(
            4,
            Math.min(
                (100 * w * 0.98) / widest,
                h / (lines.length * font.lineHeight)
            )
        )
    }
    setFont(size)

    const lineH = size * font.lineHeight
    const ascent =
        ctx.measureText(lines[0]).actualBoundingBoxAscent || size * 0.72
    const descent =
        ctx.measureText(lines[lines.length - 1]).actualBoundingBoxDescent || 0
    const firstBaseline =
        (h - (ascent + (lines.length - 1) * lineH + descent)) / 2 + ascent
    const x = align === "left" ? 0 : align === "right" ? w : w / 2

    ctx.textAlign = align
    ctx.textBaseline = "alphabetic"
    ctx.fillStyle = "#000"
    lines.forEach((line, i) => ctx.fillText(line, x, firstBaseline + i * lineH))
}

// ─── 3. Blobs: the soft color spots that make the gradient ───────────────────

interface Blob {
    x: number // current position (px)
    y: number
    vx: number // velocity (px per frame)
    vy: number
    fx: number // drift frequencies and phases: each blob wanders on its own slow loop
    fy: number
    px: number
    py: number
    size: number // radius as a ratio of the frame's longest side
    tone: "accent" | "highlight"
}

function createBlobs(): Blob[] {
    const make = (
        fx: number,
        fy: number,
        px: number,
        py: number,
        size: number,
        tone: Blob["tone"]
    ): Blob => ({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        fx,
        fy,
        px,
        py,
        size,
        tone,
    })
    return [
        make(0.13, 0.21, 0.0, 1.2, 0.42, "accent"),
        make(0.17, 0.11, 2.1, 0.4, 0.36, "accent"),
        make(0.09, 0.19, 4.0, 2.6, 0.4, "accent"),
        make(0.21, 0.15, 1.3, 3.7, 0.22, "highlight"),
    ]
}

/** Where a blob wants to be at time t: a slow loop across the whole text box. */
function anchor(b: Blob, t: number, w: number, h: number) {
    return {
        x: w * (0.5 + 0.48 * Math.sin(t * b.fx + b.px)),
        y: h * (0.5 + 0.55 * Math.sin(t * b.fy + b.py)),
    }
}

// ─── 4. The component ────────────────────────────────────────────────────────

const visuallyHidden: CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    border: 0,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
}

/**
 * Liquid Gradient Text
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 240
 */
export default function LiquidGradientText(props: Props) {
    const {
        text = "Liquid",
        tag = "h2",
        font,
        fitWidth = true,
        align = "center",
        base = "#121110",
        accent = "#FF5B14",
        highlight = "#ff9e3d",
        baseDark = "#EDE7DC",
        accentDark = "#FF5B14",
        highlightDark = "#9E2A0B",
        speed = 1,
        stir = 1,
        style,
    } = props

    const hostRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const redrawRef = useRef<() => void>(() => {})

    // Latest props, read by the animation loop without restarting it.
    const settings = {
        text: text || " ",
        font: resolveFont(font),
        fitWidth,
        align,
        base,
        accent,
        highlight,
        baseDark,
        accentDark,
        highlightDark,
        speed,
        stir,
    }
    const settingsRef = useRef(settings)
    settingsRef.current = settings

    const target = RenderTarget.current()
    const isStaticTarget =
        target === RenderTarget.canvas ||
        target === RenderTarget.export ||
        target === RenderTarget.thumbnail

    useEffect(() => {
        const host = hostRef.current
        const canvas = canvasRef.current
        const ctx = canvas?.getContext("2d")
        if (!host || !canvas || !ctx) return

        // ── 4a. State that lives as long as the component ──
        const reducedMotion =
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ??
            false
        const animate = !isStaticTarget && !reducedMotion
        const mask = document.createElement("canvas")
        const blobs = createBlobs()
        const pointer = { x: 0, y: 0, vx: 0, vy: 0, inside: false }
        const glow = { x: 0, y: 0, strength: 0 }
        let w = 0
        let h = 0
        let dpr = 1
        let maskKey = ""
        let time = 0
        let last = 0
        let raf = 0
        let visible = true
        const darkQuery = window.matchMedia?.("(prefers-color-scheme: dark)")
        let dark = darkQuery?.matches ?? false

        // ── 4b. Keep the text stencil in sync with size, text and font ──
        const updateMask = () => {
            const s = settingsRef.current
            const key = JSON.stringify([
                w,
                h,
                dpr,
                s.text,
                s.font,
                s.fitWidth,
                s.align,
            ])
            if (key === maskKey || w < 1 || h < 1) return
            maskKey = key
            drawMask(mask, s.text, s.font, s.fitWidth, s.align, w, h, dpr)
        }

        const resize = (width: number, height: number) => {
            const firstSize = w === 0
            w = width
            h = height
            dpr = Math.min(window.devicePixelRatio || 1, 2)
            canvas.width = Math.round(w * dpr)
            canvas.height = Math.round(h * dpr)
            if (firstSize) {
                // Start every blob at its anchor so nothing flies in on load.
                blobs.forEach((b) => Object.assign(b, anchor(b, time, w, h)))
            }
            updateMask()
            render()
        }

        // ── 4c. Physics: drift, stir, settle ──
        const step = (frames: number) => {
            const s = settingsRef.current
            time += (frames / 60) * s.speed

            for (const b of blobs) {
                const a = anchor(b, time, w, h)
                const radius = b.size * Math.max(w, h)

                // The cursor's movement pushes nearby blobs in the same direction, like stirring.
                if (pointer.inside) {
                    const dx = b.x - pointer.x
                    const dy = b.y - pointer.y
                    const falloff = Math.exp(
                        -(dx * dx + dy * dy) / (radius * radius)
                    )
                    b.vx += pointer.vx * falloff * 0.12 * s.stir
                    b.vy += pointer.vy * falloff * 0.12 * s.stir
                }

                // A weak spring pulls each blob back to its path; low friction lets it slosh.
                b.vx =
                    (b.vx + (a.x - b.x) * 0.006 * frames) *
                    Math.pow(0.95, frames)
                b.vy =
                    (b.vy + (a.y - b.y) * 0.006 * frames) *
                    Math.pow(0.95, frames)
                b.x += b.vx * frames
                b.y += b.vy * frames
            }

            // Cursor speed fades quickly, so a still cursor stops stirring.
            pointer.vx *= 0.6
            pointer.vy *= 0.6

            // A soft light follows the cursor with a little lag.
            glow.x += (pointer.x - glow.x) * 0.1
            glow.y += (pointer.y - glow.y) * 0.1
            glow.strength += ((pointer.inside ? 1 : 0) - glow.strength) * 0.05
        }

        // ── 4d. Drawing: stencil first, then paint only inside the letters ──
        const spot = (
            x: number,
            y: number,
            radius: number,
            rgb: number[],
            alpha: number
        ) => {
            const [r, g, b] = rgb
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
            gradient.addColorStop(0, `rgba(${r},${g},${b},${alpha})`)
            gradient.addColorStop(0.5, `rgba(${r},${g},${b},${alpha * 0.55})`)
            gradient.addColorStop(1, `rgba(${r},${g},${b},0)`)
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, w, h)
        }

        const render = () => {
            if (w < 1 || h < 1) return
            const s = settingsRef.current
            const colors = {
                base: toRGB(host, dark ? s.baseDark : s.base),
                accent: toRGB(host, dark ? s.accentDark : s.accent),
                highlight: toRGB(host, dark ? s.highlightDark : s.highlight),
            }

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.globalCompositeOperation = "source-over"
            ctx.clearRect(0, 0, w, h)
            ctx.drawImage(mask, 0, 0, w, h)

            // "source-atop" paints only where something is already drawn: the letters.
            ctx.globalCompositeOperation = "source-atop"
            ctx.fillStyle = `rgb(${colors.base.join(",")})`
            ctx.fillRect(0, 0, w, h)
            for (const b of blobs) {
                spot(b.x, b.y, b.size * Math.max(w, h), colors[b.tone], 1)
            }
            if (glow.strength > 0.01) {
                spot(
                    glow.x,
                    glow.y,
                    h * 0.6,
                    colors.highlight,
                    0.85 * glow.strength
                )
            }
            ctx.globalCompositeOperation = "source-over"
        }

        // ── 4e. The loop: time-based, so it runs the same at 60 Hz and 120 Hz ──
        const loop = (now: number) => {
            const frames = last ? Math.min((now - last) / (1000 / 60), 3) : 1
            last = now
            updateMask()
            step(frames)
            render()
            raf = requestAnimationFrame(loop)
        }
        const start = () => {
            if (!animate || raf || !visible) return
            last = 0
            raf = requestAnimationFrame(loop)
        }
        const stop = () => {
            cancelAnimationFrame(raf)
            raf = 0
        }

        // ── 4f. Events: size, visibility, pointer, fonts ──
        const resizeObserver = new ResizeObserver(([entry]) =>
            resize(entry.contentRect.width, entry.contentRect.height)
        )
        resizeObserver.observe(host)

        const intersectionObserver = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting
            if (visible) start()
            else stop()
        })
        intersectionObserver.observe(host)

        const onMove = (e: PointerEvent) => {
            const rect = host.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            if (pointer.inside) {
                pointer.vx += x - pointer.x
                pointer.vy += y - pointer.y
            } else {
                glow.x = x
                glow.y = y
            }
            pointer.x = x
            pointer.y = y
            pointer.inside = true
        }
        const onLeave = () => {
            pointer.inside = false
        }
        const onFonts = () => {
            maskKey = ""
            updateMask()
            render()
        }

        host.addEventListener("pointermove", onMove)
        host.addEventListener("pointerleave", onLeave)
        host.addEventListener("pointercancel", onLeave)
        document.fonts?.addEventListener?.("loadingdone", onFonts)
        document.fonts?.ready.then(onFonts)

        const onScheme = (e: MediaQueryListEvent) => {
            dark = e.matches
            render()
        }
        darkQuery?.addEventListener?.("change", onScheme)

        redrawRef.current = () => {
            updateMask()
            render()
        }
        start()

        return () => {
            stop()
            resizeObserver.disconnect()
            intersectionObserver.disconnect()
            host.removeEventListener("pointermove", onMove)
            host.removeEventListener("pointerleave", onLeave)
            host.removeEventListener("pointercancel", onLeave)
            document.fonts?.removeEventListener?.("loadingdone", onFonts)
            darkQuery?.removeEventListener?.("change", onScheme)
        }
    }, [isStaticTarget])

    // When no loop is running (editor, reduced motion), redraw the still frame on every prop change.
    useEffect(() => {
        redrawRef.current()
    })

    const Hidden = tag

    return (
        <div
            ref={hostRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
            <Hidden style={visuallyHidden}>{text}</Hidden>
        </div>
    )
}

LiquidGradientText.displayName = "Liquid Gradient Text"

// ─── 5. Property controls ────────────────────────────────────────────────────

addPropertyControls(LiquidGradientText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Liquid",
        displayTextArea: true,
    },
    tag: {
        type: ControlType.Enum,
        title: "Tag",
        description: "Hidden text for SEO and screen readers.",
        options: ["h1", "h2", "h3", "p", "span"],
        optionTitles: ["H1", "H2", "H3", "Paragraph", "Span"],
        defaultValue: "h2",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 160,
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
        },
    },
    fitWidth: {
        type: ControlType.Boolean,
        title: "Fit",
        defaultValue: true,
        description: "Fills the frame. Ignores font size.",
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
        defaultValue: "center",
    },
    base: { type: ControlType.Color, title: "Base", defaultValue: "#121110" },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#FF5B14",
    },
    highlight: {
        type: ControlType.Color,
        title: "Highlight",
        defaultValue: "#FFD2A6",
    },
    baseDark: {
        type: ControlType.Color,
        title: "Base Dark",
        defaultValue: "#EDE7DC",
    },
    accentDark: {
        type: ControlType.Color,
        title: "Accent Dark",
        defaultValue: "#FF5B14",
    },
    highlightDark: {
        type: ControlType.Color,
        title: "Highlight Dark",
        defaultValue: "#9E2A0B",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 4,
        step: 0.1,
        defaultValue: 1,
    },
    stir: {
        type: ControlType.Number,
        title: "Stir",
        min: 0,
        max: 3,
        step: 0.1,
        defaultValue: 1,
    },
})
