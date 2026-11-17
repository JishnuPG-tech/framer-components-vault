/**
 * KineticHoverText — Framer Component
 *
 * Letters are ALWAYS visible from first render (opacity:1 in JSX).
 * Intro = upward physics kick, spring bounce back.
 * Cursor = repulsion force, same spring restores letters.
 * Canvas = cinematic ghost trail (blue on intro, orange on push).
 *
 * Reset: right-click any control → "Reset to default"
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

import { useEffect, useRef } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface P {
    x: number
    y: number
    vx: number
    vy: number
    ox: number
    oy: number
    intro: boolean
}

interface Props {
    text: string
    fontFamily: string
    fontWeight:
        | "100"
        | "200"
        | "300"
        | "400"
        | "500"
        | "600"
        | "700"
        | "800"
        | "900"
    autoFit: boolean
    textWidthPercent: number
    letterSpacingEm: number
    backgroundColor: string
    textColor: string
    pushedTextColor: string
    showTrail: boolean
    trailFade: number
    introTrailColor: string
    pushTrailColor: string
    repulsionRadius: number
    maxForce: number
    springStrength: number
    damping: number
    maxTiltY: number
    maxTiltX: number
    blurScale: number
    maxBlur: number
    introDelay: number
    staggerDelay: number
    introLaunchSpeed: number
    showCustomCursor: boolean
    cursorDotSize: number
    cursorDotColor: string
    glowSize: number
    glowColor: string
    glowOpacity: number
    cursorLerpSpeed: number
}

function hexToRgb(color: string): { r: number; g: number; b: number } {
    const trimmed = color.trim()

    if (/^rgba?\(/i.test(trimmed)) {
        const match = trimmed.match(
            /^rgba?\(\s*([+-]?\d*\.?\d+)\s*,\s*([+-]?\d*\.?\d+)\s*,\s*([+-]?\d*\.?\d+)(?:\s*,\s*[+-]?\d*\.?\d+\s*)?\)$/i
        )
        if (match) {
            return {
                r: Math.max(0, Math.min(255, Math.round(Number(match[1])))),
                g: Math.max(0, Math.min(255, Math.round(Number(match[2])))),
                b: Math.max(0, Math.min(255, Math.round(Number(match[3])))),
            }
        }
    }

    const raw = trimmed.replace(/^#/, "")
    const h =
        raw.length === 3
            ? raw
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : raw
    const padded = h.padEnd(6, "0")
    const n = parseInt(padded, 16)
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function KineticHoverText({
    text = "KINETIC",
    fontFamily = "Arial",
    fontWeight = "900",
    autoFit = true,
    textWidthPercent = 97,
    letterSpacingEm = -0.02,
    backgroundColor = "#08080f",
    textColor = "#ffffff",
    pushedTextColor = "#FF7300",
    showTrail = true,
    trailFade = 0.07,
    introTrailColor = "#50A0FF",
    pushTrailColor = "#FF7300",
    repulsionRadius = 155,
    maxForce = 72,
    springStrength = 0.08,
    damping = 0.73,
    maxTiltY = 24,
    maxTiltX = 14,
    blurScale = 0.3,
    maxBlur = 6,
    introDelay = 0,
    staggerDelay = 80,
    introLaunchSpeed = 28,
    showCustomCursor = true,
    cursorDotSize = 6,
    cursorDotColor = "#ffffff",
    glowSize = 160,
    glowColor = "#4466ff",
    glowOpacity = 0.5,
    cursorLerpSpeed = 0.09,
}: Props) {
    const isStatic = useIsStaticRenderer()

    const letters = text.toUpperCase().split("")

    // Collect span refs without re-rendering
    const spanRefs = useRef<(HTMLSpanElement | null)[]>([])

    const containerRef = useRef<HTMLDivElement>(null)
    const wrapRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const dotRef = useRef<HTMLDivElement>(null)
    const glowRef = useRef<HTMLDivElement>(null)

    const chars = useRef<P[]>([])
    const state = useRef({
        mx: 0,
        my: 0,
        smx: 0,
        smy: 0,
        visible: false,
        introComplete: false,
        cursorOnScreen: false,
        rafId: 0,
        ctx: null as CanvasRenderingContext2D | null,
        fontSize: 100,
        timers: [] as ReturnType<typeof setTimeout>[],
    })

    // ── Main physics effect ───────────────────────────────────────────────────
    useEffect(() => {
        if (isStatic) return

        const container = containerRef.current
        const wrap = wrapRef.current
        const canvas = canvasRef.current
        const dot = dotRef.current
        const glow = glowRef.current
        if (!container || !wrap || !canvas) return

        const s = state.current
        cancelAnimationFrame(s.rafId)
        s.rafId = 0
        s.timers.forEach(clearTimeout)
        s.timers = []
        s.visible = false
        s.introComplete = false
        s.cursorOnScreen = false

        const bgRgb = hexToRgb(backgroundColor)
        const introRgb = hexToRgb(introTrailColor)
        const pushRgb = hexToRgb(pushTrailColor)
        const pushedRgb = hexToRgb(pushedTextColor)
        const textRgb = hexToRgb(textColor)

        // ── Fit font ──────────────────────────────────────────────────────────
        function fitText() {
            wrap.style.fontSize = "100px"
            const w = wrap.offsetWidth
            const h = wrap.offsetHeight
            if (!w || !h || !container.offsetWidth || !container.offsetHeight) return
            if (autoFit) {
                const scaleW = container.offsetWidth / w
                const scaleH = container.offsetHeight / h
                s.fontSize = Math.max(
                    1,
                    Math.floor(Math.min(scaleW, scaleH) * 100 * 0.97)
                )
            } else {
                s.fontSize = Math.max(
                    1,
                    Math.floor(
                        ((container.offsetWidth * textWidthPercent) / 100 / w) *
                            100
                    )
                )
            }
            wrap.style.fontSize = s.fontSize + "px"
        }

        // ── Canvas init ───────────────────────────────────────────────────────
        function initCanvas() {
            canvas.width = container.offsetWidth
            canvas.height = container.offsetHeight
            s.ctx = canvas.getContext("2d")
            if (s.ctx) {
                s.ctx.fillStyle = backgroundColor
                s.ctx.fillRect(0, 0, canvas.width, canvas.height)
            }
        }

        // ── Cache origins & kick letters upward ───────────────────────────────
        function launch() {
            const cRect = container.getBoundingClientRect()
            chars.current = spanRefs.current.map((el, i) => {
                let ox = container.offsetWidth / 2
                let oy = container.offsetHeight / 2
                if (el && cRect.width > 0) {
                    const r = el.getBoundingClientRect()
                    if (r.width > 0) {
                        ox = r.left + r.width / 2 - cRect.left
                        oy = r.top + r.height / 2 - cRect.top
                    }
                }
                // Reset styles — letters are already visible (opacity:1 in JSX)
                if (el) {
                    el.style.transform = ""
                    el.style.filter = "none"
                    el.style.color = textColor
                }
                return { ox, oy, x: 0, y: 0, vx: 0, vy: 0, intro: true }
            })

            // Staggered upward velocity kick (no opacity hiding needed)
            letters.forEach((_, i) => {
                const t = setTimeout(
                    () => {
                        const ch = chars.current[i]
                        if (ch) {
                            ch.vy = -(introLaunchSpeed + Math.random() * 6)
                            ch.vx = (Math.random() - 0.5) * 1.5
                        }
                    },
                    introDelay + i * staggerDelay
                )
                s.timers.push(t)
            })

            // Unlock cursor after all letters settle
            const settle = introDelay + letters.length * staggerDelay + 1600
            s.timers.push(
                setTimeout(() => {
                    s.introComplete = true
                    chars.current.forEach((ch) => {
                        ch.intro = false
                    })
                    if (dot && s.cursorOnScreen) dot.style.opacity = "1"
                }, settle)
            )
        }

        // ── Ghost trail ───────────────────────────────────────────────────────
        function drawTrail() {
            const ctx = s.ctx
            if (!ctx || !showTrail) return

            ctx.fillStyle = `rgba(${bgRgb.r},${bgRgb.g},${bgRgb.b},${trailFade})`
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            ctx.save()
            ctx.font = `${fontWeight} ${s.fontSize}px "${fontFamily}",sans-serif`
            ctx.textBaseline = "middle"
            ctx.textAlign = "center"

            chars.current.forEach((ch, i) => {
                const spd = Math.hypot(ch.vx, ch.vy)
                if (spd < 0.3) return
                const t = Math.min(spd / 20, 1)
                const wx = ch.ox + ch.x
                const wy = ch.oy + ch.y

                if (ch.vy < -1) {
                    // Rising → intro trail color
                    ctx.globalAlpha = Math.max(t * 0.85, 0.4)
                    ctx.fillStyle = `rgb(${introRgb.r},${introRgb.g},${introRgb.b})`
                } else {
                    // Pushed → push trail color
                    ctx.globalAlpha = Math.max(t * 0.8, 0.4)
                    ctx.fillStyle = `rgb(${pushRgb.r},${pushRgb.g},${pushRgb.b})`
                }
                ctx.fillText(letters[i], wx, wy)
            })

            ctx.globalAlpha = 1
            ctx.restore()
        }

        // ── RAF loop ──────────────────────────────────────────────────────────
        function loop() {
            s.rafId = requestAnimationFrame(loop)
            if (!s.visible) {
                s.rafId = 0
                return
            }
            drawTrail()

            s.smx += (s.mx - s.smx) * cursorLerpSpeed
            s.smy += (s.my - s.smy) * cursorLerpSpeed
            if (glow) {
                glow.style.left = s.smx + "px"
                glow.style.top = s.smy + "px"
            }
            if (dot) {
                dot.style.left = s.mx + "px"
                dot.style.top = s.my + "px"
            }

            chars.current.forEach((ch, i) => {
                if (s.introComplete && s.cursorOnScreen) {
                    const dx = ch.ox + ch.x - s.mx
                    const dy = ch.oy + ch.y - s.my
                    const d = Math.hypot(dx, dy) || 1
                    if (d < repulsionRadius) {
                        const f = (1 - d / repulsionRadius) ** 2 * maxForce
                        ch.vx += (dx / d) * f
                        ch.vy += (dy / d) * f
                    }
                }

                ch.vx = (ch.vx - ch.x * springStrength) * damping
                ch.vy = (ch.vy - ch.y * springStrength) * damping
                ch.x += ch.vx
                ch.y += ch.vy

                const spd = Math.hypot(ch.vx, ch.vy)
                const disp = Math.hypot(ch.x, ch.y)
                const tY = Math.max(-maxTiltY, Math.min(maxTiltY, ch.x * 0.26))
                const tX = Math.max(-maxTiltX, Math.min(maxTiltX, -ch.y * 0.15))
                const bl = Math.min(spd * blurScale, maxBlur).toFixed(2)
                const tf = Math.min(disp / 55, 1)

                const el = spanRefs.current[i]
                if (!el) return
                el.style.transform = `translate(${ch.x.toFixed(2)}px,${ch.y.toFixed(2)}px) rotateY(${tY.toFixed(2)}deg) rotateX(${tX.toFixed(2)}deg)`
                el.style.filter = `blur(${bl}px)`
                if (!ch.intro) {
                    el.style.color = `rgb(${Math.round(textRgb.r + (pushedRgb.r - textRgb.r) * tf)},${Math.round(textRgb.g + (pushedRgb.g - textRgb.g) * tf)},${Math.round(textRgb.b + (pushedRgb.b - textRgb.b) * tf)})`
                }
            })
        }

        // ── Mouse events ──────────────────────────────────────────────────────
        function onMove(e: MouseEvent) {
            const r = container.getBoundingClientRect()
            s.mx = e.clientX - r.left
            s.my = e.clientY - r.top
            s.cursorOnScreen = true
            if (dot) dot.style.opacity = s.introComplete ? "1" : "0"
            if (glow) glow.style.opacity = String(glowOpacity)
        }
        function onLeave() {
            s.cursorOnScreen = false
            if (dot) dot.style.opacity = "0"
            if (glow) glow.style.opacity = "0"
        }

        container.addEventListener("mousemove", onMove)
        container.addEventListener("mouseleave", onLeave)

        // ── Init — poll until container has real dimensions ────────────────────
        let done = false
        function tryInit() {
            if (done) return
            const w = container.offsetWidth
            const h = container.offsetHeight
            if (w > 0 && h > 0) {
                done = true
                s.mx = w / 2
                s.my = h / 2
                s.smx = w / 2
                s.smy = h / 2
                fitText()
                initCanvas()
                // Small RAF delay so spans have rendered with correct font
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        launch()
                        if (s.visible) loop()
                    })
                })
            }
        }

        tryInit()
        const polls = [16, 50, 100, 200, 400, 800].map((d) =>
            setTimeout(tryInit, d)
        )

        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(tryInit)
            ro.observe(container)
        }

        const onResize = () => {
            fitText()
            initCanvas()
            if (chars.current.length) {
                const cRect = container.getBoundingClientRect()
                chars.current.forEach((ch, i) => {
                    const el = spanRefs.current[i]
                    if (!el) return
                    const r = el.getBoundingClientRect()
                    if (r.width > 0) {
                        ch.ox = r.left + r.width / 2 - cRect.left
                        ch.oy = r.top + r.height / 2 - cRect.top
                    }
                })
            }
        }
        window.addEventListener("resize", onResize)

        const io = new IntersectionObserver(
            (entries) => {
                const visible = entries[0]?.intersectionRatio > 0
                s.visible = visible
                if (visible && s.rafId === 0) loop()
                if (!visible) {
                    cancelAnimationFrame(s.rafId)
                    s.rafId = 0
                }
            },
            { threshold: 0 }
        )
        io.observe(container)

        return () => {
            done = true
            cancelAnimationFrame(s.rafId)
            s.timers.forEach(clearTimeout)
            polls.forEach(clearTimeout)
            ro?.disconnect()
            io.disconnect()
            container.removeEventListener("mousemove", onMove)
            container.removeEventListener("mouseleave", onLeave)
            window.removeEventListener("resize", onResize)
        }
    }, [
        isStatic,
        text,
        fontFamily,
        fontWeight,
        autoFit,
        textWidthPercent,
        letterSpacingEm,
        backgroundColor,
        textColor,
        pushedTextColor,
        showTrail,
        trailFade,
        introTrailColor,
        pushTrailColor,
        repulsionRadius,
        maxForce,
        springStrength,
        damping,
        maxTiltY,
        maxTiltX,
        blurScale,
        maxBlur,
        introDelay,
        staggerDelay,
        introLaunchSpeed,
        showCustomCursor,
        cursorDotSize,
        cursorDotColor,
        glowSize,
        glowColor,
        glowOpacity,
        cursorLerpSpeed,
    ])

    // ── Static renderer ───────────────────────────────────────────────────────
    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background: backgroundColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    fontFamily: `"${fontFamily}",sans-serif`,
                }}
            >
                <span
                    style={{
                        color: textColor,
                        fontWeight,
                        fontSize: `${textWidthPercent}cqw`,
                        letterSpacing: `${letterSpacingEm}em`,
                        lineHeight: 1,
                        whiteSpace: "nowrap",
                        userSelect: "none",
                    }}
                >
                    {text.toUpperCase()}
                </span>
            </div>
        )
    }

    // ── Live render ───────────────────────────────────────────────────────────
    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                background: backgroundColor,
                overflow: "hidden",
                cursor: showCustomCursor ? "none" : "default",
            }}
        >
            {/* Trail canvas — below text */}
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            />

            {/* Letter row */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    perspective: "800px",
                    zIndex: 1,
                }}
            >
                <div
                    ref={wrapRef}
                    style={{
                        fontFamily: `"${fontFamily}",sans-serif`,
                        fontWeight,
                        lineHeight: 1,
                        letterSpacing: `${letterSpacingEm}em`,
                        whiteSpace: "nowrap",
                        display: "flex",
                        transformStyle: "preserve-3d",
                    }}
                >
                    {letters.map((ch, i) => (
                        <span
                            key={`${text}-${i}`}
                            ref={(el) => {
                                spanRefs.current[i] = el
                            }}
                            style={{
                                display: "inline-block",
                                color: textColor,
                                /* opacity:1 — text is ALWAYS visible, no hidden state */
                                willChange: "transform, filter, color",
                                transformStyle: "preserve-3d",
                            }}
                        >
                            {ch}
                        </span>
                    ))}
                </div>
            </div>

            {/* Cursor glow */}
            {showCustomCursor && (
                <div
                    ref={glowRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: glowSize,
                        height: glowSize,
                        borderRadius: "50%",
                        background: `radial-gradient(circle,${glowColor}88 0%,transparent 70%)`,
                        transform: "translate(-50%,-50%)",
                        pointerEvents: "none",
                        opacity: 0,
                        transition: "opacity 0.3s",
                        zIndex: 2,
                    }}
                />
            )}

            {/* Cursor dot */}
            {showCustomCursor && (
                <div
                    ref={dotRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: cursorDotSize,
                        height: cursorDotSize,
                        borderRadius: "50%",
                        background: cursorDotColor,
                        transform: "translate(-50%,-50%)",
                        pointerEvents: "none",
                        opacity: 0,
                        zIndex: 3,
                    }}
                />
            )}
        </div>
    )
}

// ─── Framer Property Controls ─────────────────────────────────────────────────

addPropertyControls(KineticHoverText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "KINETIC",
    },

    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        description:
            "Use a font already added to your Framer project. System fonts (Arial, Georgia, Impact, etc.) work without any setup.",
        defaultValue: "Arial",
    },
    fontWeight: {
        type: ControlType.Enum,
        title: "Weight",
        defaultValue: "900",
        options: [
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
        ],
        optionTitles: [
            "Thin 100",
            "Extra Light 200",
            "Light 300",
            "Regular 400",
            "Medium 500",
            "Semi Bold 600",
            "Bold 700",
            "Extra Bold 800",
            "Black 900",
        ],
    },
    autoFit: {
        type: ControlType.Boolean,
        title: "Auto Fit",
        defaultValue: true,
    },
    textWidthPercent: {
        type: ControlType.Number,
        title: "Fill Width %",
        defaultValue: 97,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (p: Props) => p.autoFit,
    },
    letterSpacingEm: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: -0.02,
        min: -0.2,
        max: 0.4,
        step: 0.005,
        unit: "em",
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#08080f",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#ffffff",
    },
    pushedTextColor: {
        type: ControlType.Color,
        title: "Pushed Color",
        defaultValue: "#FF7300",
    },

    showTrail: {
        type: ControlType.Boolean,
        title: "Ghost Trail",
        defaultValue: true,
    },
    trailFade: {
        type: ControlType.Number,
        title: "Trail Length",
        defaultValue: 0.07,
        min: 0.01,
        max: 1,
        step: 0.01,
        displayStepper: true,
        hidden: (p: Props) => !p.showTrail,
    },
    introTrailColor: {
        type: ControlType.Color,
        title: "Ghost Color (Intro)",
        defaultValue: "#50A0FF",
    },
    pushTrailColor: {
        type: ControlType.Color,
        title: "Ghost Color (Push)",
        defaultValue: "#FF7300",
    },

    repulsionRadius: {
        type: ControlType.Number,
        title: "Push Radius",
        defaultValue: 155,
        min: 20,
        max: 500,
        step: 5,
        unit: "px",
    },
    maxForce: {
        type: ControlType.Number,
        title: "Push Force",
        defaultValue: 72,
        min: 1,
        max: 300,
        step: 1,
    },
    springStrength: {
        type: ControlType.Number,
        title: "Spring",
        defaultValue: 0.08,
        min: 0.005,
        max: 1,
        step: 0.005,
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 0.73,
        min: 0.1,
        max: 0.99,
        step: 0.01,
    },

    maxTiltY: {
        type: ControlType.Number,
        title: "Tilt Y",
        defaultValue: 24,
        min: 0,
        max: 90,
        step: 1,
        unit: "°",
    },
    maxTiltX: {
        type: ControlType.Number,
        title: "Tilt X",
        defaultValue: 14,
        min: 0,
        max: 90,
        step: 1,
        unit: "°",
    },
    blurScale: {
        type: ControlType.Number,
        title: "Blur Scale",
        defaultValue: 0.3,
        min: 0,
        max: 2,
        step: 0.05,
    },
    maxBlur: {
        type: ControlType.Number,
        title: "Max Blur",
        defaultValue: 6,
        min: 0,
        max: 30,
        step: 0.5,
        unit: "px",
    },

    introDelay: {
        type: ControlType.Number,
        title: "Intro Delay",
        defaultValue: 0,
        min: 0,
        max: 3000,
        step: 50,
        unit: "ms",
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 80,
        min: 0,
        max: 500,
        step: 10,
        unit: "ms",
    },
    introLaunchSpeed: {
        type: ControlType.Number,
        title: "Launch Speed",
        defaultValue: 28,
        min: 0,
        max: 80,
        step: 1,
    },

    showCustomCursor: {
        type: ControlType.Boolean,
        title: "Custom Cursor",
        defaultValue: true,
    },
    cursorDotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 6,
        min: 2,
        max: 40,
        step: 1,
        unit: "px",
        hidden: (p: Props) => !p.showCustomCursor,
    },
    cursorDotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#ffffff",
        hidden: (p: Props) => !p.showCustomCursor,
    },
    glowSize: {
        type: ControlType.Number,
        title: "Glow Size",
        defaultValue: 160,
        min: 20,
        max: 600,
        step: 10,
        unit: "px",
        hidden: (p: Props) => !p.showCustomCursor,
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "#4466ff",
        hidden: (p: Props) => !p.showCustomCursor,
    },
    glowOpacity: {
        type: ControlType.Number,
        title: "Glow Opacity",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p: Props) => !p.showCustomCursor,
    },
    cursorLerpSpeed: {
        type: ControlType.Number,
        title: "Glow Lag",
        defaultValue: 0.09,
        min: 0.01,
        max: 1,
        step: 0.01,
        hidden: (p: Props) => !p.showCustomCursor,
    },
})
