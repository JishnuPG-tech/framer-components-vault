/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 500
 *
 * Reactive Lines — Karim Saif
 * Made with 💛 by @karimsaif (https://x.com/karimsaif0)
 */

"use client"

import React, { useEffect, useRef, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Vec = { x: number; y: number }
const vec = (x: number, y: number): Vec => ({ x, y })
const vecAdd = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y })
const vecSub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y })
const vecMult = (a: Vec, s: number): Vec => ({ x: a.x * s, y: a.y * s })
const vecLerp = (a: Vec, b: Vec, t: number): Vec => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
})
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (v: number, mn: number, mx: number) =>
    Math.max(mn, Math.min(mx, v))
const map = (v: number, a: number, b: number, c: number, d: number) =>
    ((v - a) / (b - a)) * (d - c) + c

function pseudoRandom(seed: number) {
    const x = Math.sin(seed++) * 10000
    return x - Math.floor(x)
}

function parseToRGB(str: string): { r: number; g: number; b: number } {
    if (str) {
        const m = str.match(/rgba?\(([^)]+)\)/)
        if (m) {
            const p = m[1].split(",").map((s) => parseFloat(s))
            return { r: p[0] || 0, g: p[1] || 0, b: p[2] || 0 }
        }
        const hex = str.replace("#", "")
        if (hex.length >= 6)
            return {
                r: parseInt(hex.slice(0, 2), 16),
                g: parseInt(hex.slice(2, 4), 16),
                b: parseInt(hex.slice(4, 6), 16),
            }
        if (hex.length === 3)
            return {
                r: parseInt(hex[0] + hex[0], 16),
                g: parseInt(hex[1] + hex[1], 16),
                b: parseInt(hex[2] + hex[2], 16),
            }
    }
    return { r: 10, g: 10, b: 10 }
}

interface InteractiveLinesProps {
    backgroundColor?: string
    transparentBackground?: boolean
    lineColor?: string
    lineWidth?: number
    opacity?: number
    minLines?: number
    maxLines?: number
    direction?: "vertical" | "horizontal" | "diagonal" | "reverse"
    distribution?: "quadratic" | "linear" | "exponential" | "logarithmic"
    curveStrength?: number
    padding?: number
    blendMode?: string
    interactionMode?: "mouse" | "auto" | "none"
    mobileBehavior?: "touch" | "auto" | "center"
    influenceRadius?: number
    responseSpeed?: number
    mouseSmoothing?: number
    idleAnimation?: boolean
    idleDelay?: number
    fade?: boolean
    fadeIntensity?: number
    noise?: number
    seed?: number
    quality?: number
    ariaLabel?: string
    style?: React.CSSProperties
}

export default function InteractiveLines({
    style,
    backgroundColor = "rgb(10, 10, 10)",
    transparentBackground = false,
    lineColor = "rgba(255, 255, 255, 1)",
    lineWidth = 1,
    opacity = 1,
    minLines = 2,
    maxLines = 45,
    direction = "vertical",
    distribution = "quadratic",
    curveStrength = 1,
    padding = 0,
    blendMode = "source-over",
    interactionMode = "mouse",
    mobileBehavior = "touch",
    influenceRadius = 100,
    responseSpeed = 0.05,
    mouseSmoothing = 0.1,
    idleAnimation = true,
    idleDelay = 2,
    fade = false,
    fadeIntensity = 15,
    noise = 0,
    seed = 42,
    quality = 50,
    ariaLabel = "Typer text visualization",
}: InteractiveLinesProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })
    const cfgRef = useRef({ linesNum: 40, bias: 0.5 })
    const lastActivityRef = useRef<number>(Date.now())
    const startAnimRef = useRef<() => void>()

    // Official Framer Marketplace Static Renderer Check
    const isStatic = useIsStaticRenderer()

    // Memoize RGB conversion
    const cachedBgRGB = useMemo(
        () => parseToRGB(backgroundColor),
        [backgroundColor]
    )

    useEffect(() => {
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas) return

        const ctx = canvas.getContext("2d", { alpha: transparentBackground })
        if (!ctx) return

        let animationId = 0
        let isVisible = true
        let isPageVisible = true

        const setupCanvas = () => {
            const dpr = window.devicePixelRatio || 1
            const w = container.clientWidth || 300
            const h = container.clientHeight || 300
            canvas.width = w * dpr
            canvas.height = h * dpr
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            return { width: w, height: h }
        }

        let { width, height } = setupCanvas()

        mouseRef.current.x = width / 2
        mouseRef.current.y = height / 2
        mouseRef.current.targetX = width / 2
        mouseRef.current.targetY = height / 2

        const drawFrame = (time: number) => {
            let r = width
            let n = height
            let a = mouseRef.current
            let o = cfgRef.current

            const now = Date.now()
            const isMobile = window.matchMedia("(max-width: 768px)").matches
            const effectiveMode = isMobile
                ? mobileBehavior === "touch"
                    ? "mouse"
                    : mobileBehavior
                : interactionMode

            // Explicit interaction modes
            if (effectiveMode === "none" || effectiveMode === "center") {
                a.targetX = r / 2
                a.targetY = n / 2
            } else {
                const isIdle =
                    idleAnimation &&
                    effectiveMode === "mouse" &&
                    (now - lastActivityRef.current) / 1000 > idleDelay

                if (effectiveMode === "auto" || isIdle) {
                    const t = time * 0.001
                    a.targetX =
                        r / 2 +
                        Math.sin(t * 0.8) * r * 0.35 * (influenceRadius / 100)
                    a.targetY =
                        n / 2 +
                        Math.cos(t * 0.5) * n * 0.35 * (influenceRadius / 100)
                }
            }

            a.x = a.x + (a.targetX - a.x) * clamp(responseSpeed, 0.001, 1)
            a.y = a.y + (a.targetY - a.y) * clamp(mouseSmoothing, 0.001, 1)

            ctx.clearRect(0, 0, r, n)

            if (!transparentBackground) {
                ctx.fillStyle = backgroundColor
                ctx.fillRect(0, 0, r, n)
            }

            ctx.save()
            ctx.globalAlpha = opacity
            ctx.globalCompositeOperation =
                (blendMode as GlobalCompositeOperation) || "source-over"

            let c: Vec, f: Vec, g: Vec
            const pad = padding
            const effW = Math.max(10, r - pad * 2)
            const effH = Math.max(10, n - pad * 2)

            ctx.translate(r / 2, n / 2)

            const isSmall = effW < 500
            const u = isSmall ? 0.8 * effH : 0
            const dFactor = (isSmall ? 1.5 : 0.7) * curveStrength

            switch (direction) {
                case "horizontal":
                    c = vec(effH, -(1.1 * effW) + u)
                    f = vec(0, 2 * effW)
                    g = vec(-effH, -effW + u)
                    break
                case "diagonal":
                    c = vec(effW, -(1.1 * effH) + u)
                    f = vec(effW, effH)
                    g = vec(-effW, -effH)
                    break
                case "reverse":
                    c = vec(-effW, 1.1 * effH - u)
                    f = vec(0, -2 * effH)
                    g = vec(effW, effH - u)
                    break
                case "vertical":
                default:
                    c = vec(effW, -(1.1 * effH) + u)
                    f = vec(0, 2 * effH)
                    g = vec(-effW, -effH + u)
                    break
            }

            const lo = Math.min(minLines, maxLines)
            const hi = Math.max(minLines, maxLines)
            const h = clamp(map(a.y, 0, n, lo, hi), lo, hi)
            o.linesNum = lerp(o.linesNum, h, 0.1)

            const b = clamp(map(a.x, 0, r, 0.6, 0.4), 0.4, 0.6)
            o.bias = lerp(o.bias, b, 0.05)

            ctx.strokeStyle = lineColor
            ctx.lineWidth = lineWidth

            const segments = Math.max(10, quality)

            for (let t = 0; t < o.linesNum; t++) {
                let norm = t / Math.max(1, o.linesNum - 1)

                let distributionFactor = norm
                if (distribution === "quadratic") {
                    distributionFactor = 1 - norm * norm
                } else if (distribution === "linear") {
                    distributionFactor = 1 - norm
                } else if (distribution === "exponential") {
                    distributionFactor = Math.pow(1 - norm, 3)
                } else if (distribution === "logarithmic") {
                    distributionFactor = 1 - Math.log10(1 + norm * 9)
                }

                const lineEnd = vec(
                    lerp(f.x, g.x, distributionFactor),
                    lerp(f.y, g.y, distributionFactor)
                )

                const l = vecAdd(vecMult(c, 0.5), vecMult(lineEnd, 0.5))
                const dispTarget = vecMult(vecAdd(f, l), 0.5)

                const start = c
                const end = lineEnd
                const target = dispTarget
                const biasVal = o.bias

                const mid = vecLerp(start, end, 0.5)
                const diff = vecSub(target, mid)

                ctx.beginPath()
                for (let i = 0; i <= segments; i++) {
                    const segT = i / segments
                    const basePos = vecLerp(start, end, segT)
                    const weight =
                        2 *
                        Math.pow(segT, dFactor * (1 - biasVal) * 2) *
                        Math.pow(1 - segT, dFactor * biasVal * 2)

                    let cv = vecAdd(basePos, vecMult(diff, weight))

                    if (noise > 0) {
                        const prn = pseudoRandom(seed + t * 100 + i)
                        cv.x += (prn - 0.5) * noise
                        cv.y += (pseudoRandom(seed + t * 200 + i) - 0.5) * noise
                    }

                    if (i === 0) ctx.moveTo(cv.x, cv.y)
                    else ctx.lineTo(cv.x, cv.y)
                }
                ctx.stroke()
            }

            ctx.restore()

            if (fade) {
                const bg = cachedBgRGB
                const rgba = (alpha: number) =>
                    `rgba(${bg.r}, ${bg.g}, ${bg.b}, ${alpha})`
                const inner = clamp(
                    map(fadeIntensity, 1, 50, 0.82, 0.25),
                    0.25,
                    0.82
                )
                const maxA = clamp(
                    map(fadeIntensity, 1, 50, 0.35, 0.9),
                    0.35,
                    0.9
                )
                ctx.save()
                const halfW = r / 2
                const halfH = n / 2
                const maxDim = Math.max(r, n) / 2
                ctx.translate(halfW, halfH)
                ctx.scale(r / (2 * maxDim), n / (2 * maxDim))
                const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, maxDim)
                grad.addColorStop(0, rgba(0))
                grad.addColorStop(inner, rgba(0))
                grad.addColorStop(lerp(inner, 1, 0.5), rgba(maxA * 0.3))
                grad.addColorStop(lerp(inner, 1, 0.8), rgba(maxA * 0.7))
                grad.addColorStop(1, rgba(maxA))
                ctx.fillStyle = grad
                ctx.fillRect(-maxDim, -maxDim, 2 * maxDim, 2 * maxDim)
                ctx.restore()
            }
        }

        const renderLoop = (time: number) => {
            drawFrame(time)
            if (!isStatic) {
                animationId = requestAnimationFrame(renderLoop)
            }
        }

        const startAnimation = () => {
            if (!animationId && isVisible && isPageVisible) {
                if (isStatic) {
                    drawFrame(0)
                } else {
                    animationId = requestAnimationFrame(renderLoop)
                }
            }
        }

        const stopAnimation = () => {
            if (animationId) {
                cancelAnimationFrame(animationId)
                animationId = 0
            }
        }

        startAnimRef.current = startAnimation

        // Use ResizeObserver instead of window resize events
        const resizeObserver = new ResizeObserver(() => {
            stopAnimation()
            const res = setupCanvas()
            width = res.width
            height = res.height
            startAnimation()
        })

        const onVisibilityChange = () => {
            isPageVisible = document.visibilityState === "visible"
            isPageVisible ? startAnimation() : stopAnimation()
        }

        const observer = new IntersectionObserver(
            (entries) => {
                isVisible = entries[0]?.isIntersecting ?? true
                isVisible && isPageVisible ? startAnimation() : stopAnimation()
            },
            { threshold: 0 }
        )

        observer.observe(container)
        resizeObserver.observe(container)
        document.addEventListener("visibilitychange", onVisibilityChange)

        startAnimation()

        return () => {
            stopAnimation()
            observer.disconnect()
            resizeObserver.disconnect()
            document.removeEventListener("visibilitychange", onVisibilityChange)
        }
    }, [
        backgroundColor,
        transparentBackground,
        lineColor,
        lineWidth,
        opacity,
        minLines,
        maxLines,
        direction,
        distribution,
        curveStrength,
        padding,
        blendMode,
        interactionMode,
        mobileBehavior,
        influenceRadius,
        responseSpeed,
        mouseSmoothing,
        idleAnimation,
        idleDelay,
        fade,
        fadeIntensity,
        noise,
        seed,
        quality,
        isStatic,
    ])

    // Pointer event tracking attached strictly to container
    useEffect(() => {
        const el = containerRef.current
        if (!el || isStatic || interactionMode === "none") return

        let ticking = false

        const handlePointerMove = (ev: PointerEvent) => {
            lastActivityRef.current = Date.now()
            const rect = el.getBoundingClientRect()
            const relativeX = ev.clientX - rect.left
            const relativeY = ev.clientY - rect.top

            if (influenceRadius < 100) {
                const centerX = rect.width / 2
                const centerY = rect.height / 2
                const maxDist =
                    (Math.max(rect.width, rect.height) / 2) *
                    (influenceRadius / 100)
                const dist = Math.hypot(
                    relativeX - centerX,
                    relativeY - centerY
                )

                if (dist > maxDist) {
                    mouseRef.current.targetX = centerX
                    mouseRef.current.targetY = centerY
                    return
                }
            }

            mouseRef.current.targetX = relativeX
            mouseRef.current.targetY = relativeY

            if (!ticking) {
                ticking = true
                requestAnimationFrame(() => {
                    ticking = false
                })
            }

            startAnimRef.current?.()
        }

        el.addEventListener("pointermove", handlePointerMove, { passive: true })
        return () => el.removeEventListener("pointermove", handlePointerMove)
    }, [influenceRadius, isStatic, interactionMode])

    return (
        <div
            ref={containerRef}
            aria-label={ariaLabel}
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", display: "block" }}
            />
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/*                          Framer Property Controls                          */
/* -------------------------------------------------------------------------- */

addPropertyControls(InteractiveLines, {
    // Appearance Group
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgb(10, 10, 10)",
        hidden(props) {
            return props.transparentBackground
        },
    },
    transparentBackground: {
        type: ControlType.Boolean,
        title: "Transparent",
        defaultValue: false,
        description: "Remove background color fill.",
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "rgba(255, 255, 255, 1)",
    },
    lineWidth: {
        type: ControlType.Number,
        title: "Line Width",
        defaultValue: 1,
        min: 0.1,
        max: 10,
        step: 0.1,
        unit: "px",
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Blend Mode",
        defaultValue: "source-over",
        options: [
            "source-over",
            "multiply",
            "screen",
            "lighter",
            "difference",
            "xor",
        ],
        optionTitles: [
            "Normal",
            "Multiply",
            "Screen",
            "Lighter",
            "Difference",
            "XOR",
        ],
    },

    // Geometry & Lines
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        defaultValue: "vertical",
        options: ["vertical", "horizontal", "diagonal", "reverse"],
        optionTitles: ["Vertical", "Horizontal", "Diagonal", "Reverse"],
    },
    distribution: {
        type: ControlType.Enum,
        title: "Distribution",
        defaultValue: "quadratic",
        options: ["quadratic", "linear", "exponential", "logarithmic"],
        optionTitles: ["Ease Quad", "Linear", "Exponential", "Logarithmic"],
    },
    minLines: {
        type: ControlType.Number,
        title: "Min Lines",
        defaultValue: 2,
        min: 1,
        max: 200,
        step: 1,
    },
    maxLines: {
        type: ControlType.Number,
        title: "Max Lines",
        defaultValue: 45,
        min: 1,
        max: 200,
        step: 1,
    },
    curveStrength: {
        type: ControlType.Number,
        title: "Curve",
        defaultValue: 1,
        min: 0,
        max: 5,
        step: 0.1,
        description: "Amplifies curvature strength.",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 0,
        min: 0,
        max: 300,
        step: 5,
        unit: "px",
    },

    // Dynamics & Motion
    interactionMode: {
        type: ControlType.Enum,
        title: "Interaction",
        defaultValue: "mouse",
        options: ["mouse", "auto", "none"],
        optionTitles: ["Mouse Follow", "Auto Orbit", "Static / None"],
    },
    mobileBehavior: {
        type: ControlType.Enum,
        title: "Mobile Mode",
        defaultValue: "touch",
        options: ["touch", "auto", "center"],
        optionTitles: ["Follow Touch", "Auto Orbit", "Center Lock"],
    },
    influenceRadius: {
        type: ControlType.Number,
        title: "Cursor Radius",
        defaultValue: 100,
        min: 10,
        max: 100,
        step: 5,
        unit: "%",
        description: "Active cursor boundary radius.",
    },
    responseSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 0.05,
        min: 0.001,
        max: 0.3,
        step: 0.01,
        description: "Higher = faster response to mouse.",
    },
    mouseSmoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        defaultValue: 0.1,
        min: 0.01,
        max: 0.5,
        step: 0.01,
    },
    idleAnimation: {
        type: ControlType.Boolean,
        title: "Idle Motion",
        defaultValue: true,
        description: "Slowly orbits curves when user is idle.",
    },
    idleDelay: {
        type: ControlType.Number,
        title: "Idle Delay",
        defaultValue: 2,
        min: 0.5,
        max: 10,
        step: 0.5,
        unit: "s",
        hidden(props) {
            return !props.idleAnimation
        },
    },

    // Effects & Noise
    fade: {
        type: ControlType.Boolean,
        title: "Vignette Fade",
        defaultValue: false,
    },
    fadeIntensity: {
        type: ControlType.Number,
        title: "Fade Level",
        defaultValue: 15,
        min: 1,
        max: 50,
        step: 1,
        hidden(props) {
            return !props.fade
        },
    },
    noise: {
        type: ControlType.Number,
        title: "Noise",
        defaultValue: 0,
        min: 0,
        max: 20,
        step: 0.5,
        description: "Random vertex offset along curves.",
    },
    seed: {
        type: ControlType.Number,
        title: "Noise Seed",
        defaultValue: 42,
        min: 1,
        max: 999,
        step: 1,
        hidden(props) {
            return props.noise === 0
        },
    },
    quality: {
        type: ControlType.Number,
        title: "Quality",
        defaultValue: 50,
        min: 15,
        max: 100,
        step: 5,
        description: "Curve segment resolution (samples per line).",
    },

    // Accessibility
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "Interactive Lines",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})
