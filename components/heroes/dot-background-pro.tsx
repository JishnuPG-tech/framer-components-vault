import * as React from "react"
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    type CSSProperties,
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


/** Dot Background — sRGB rendering and fixed initial dimensions. */

type Mode = "repel" | "attract" | "scale" | "none"
type Shape = "circle" | "square"
type Props = {
    backgroundColor: string
    foregroundColor: string
    dotOpacity: number
    dotSpacing: number
    minDotSize: number
    maxDotSize: number
    dotShape: Shape
    gradientX: number
    gradientY: number
    gradientRadius: number
    gradientSoftness: number
    reverseGradient: boolean
    textProtection: number
    mobileDotScale: number
    interactionMode: Mode
    interactionRadius: number
    distortionStrength: number
    scaleStrength: number
    smoothness: number
    ambientMotion: boolean
    ambientSpeed: number
    ambientStrength: number
    borderRadius: number
    heroLink: string
    heroNewTab: boolean
    linkLabel: string
    style?: CSSProperties
}

type Dot = { x: number; y: number; size: number }
type Pointer = { x: number; y: number; influence: number }
const TAU = Math.PI * 2
const MAX_DOTS = 8500
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smoothstep = (n: number) => {
    const x = clamp(n, 0, 1)
    return x * x * (3 - 2 * x)
}

const defaults: Omit<Props, "style"> = {
    backgroundColor: "#D5FF65",
    foregroundColor: "#172616",
    dotOpacity: 1,
    dotSpacing: 20,
    minDotSize: 0.5,
    maxDotSize: 16,
    dotShape: "circle",
    gradientX: 22,
    gradientY: 12,
    gradientRadius: 86,
    gradientSoftness: 1,
    reverseGradient: false,
    textProtection: 0,
    mobileDotScale: 0.85,
    interactionMode: "repel",
    interactionRadius: 150,
    distortionStrength: 26,
    scaleStrength: 0.45,
    smoothness: 0.16,
    ambientMotion: false,
    ambientSpeed: 0.65,
    ambientStrength: 0.12,
    borderRadius: 0,
    heroLink: "",
    heroNewTab: false,
    linkLabel: "Open link",
}

function createDots(width: number, height: number, p: Props): Dot[] {
    if (!width || !height) return []
    const mobile = width < 600
    const spacing = Math.max(4, p.dotSpacing * (mobile ? 1.15 : 1))
    const estimate =
        ((width + spacing * 2) * (height + spacing * 2)) / (spacing * spacing)
    const step = spacing * Math.sqrt(Math.max(1, estimate / MAX_DOTS))
    const cx = (width * p.gradientX) / 100
    const cy = (height * p.gradientY) / 100
    const radius = Math.max(
        1,
        (p.gradientRadius / 100) * Math.hypot(width, height)
    )
    const scale = mobile ? p.mobileDotScale : 1
    const small = Math.min(p.minDotSize, p.maxDotSize) * scale
    const large = Math.max(p.minDotSize, p.maxDotSize) * scale
    const dots: Dot[] = []
    for (let row = -1; row <= Math.ceil(height / step) + 1; row++) {
        for (let col = -1; col <= Math.ceil(width / step) + 1; col++) {
            const x = col * step
            const y = row * step
            let fraction = Math.pow(
                clamp(Math.hypot(x - cx, y - cy) / radius, 0, 1),
                Math.max(0.2, p.gradientSoftness)
            )
            if (p.reverseGradient) fraction = 1 - fraction
            let size = lerp(small, large, fraction)
            // Optional clear area in the upper-left for user-added text overlays.
            if (p.textProtection > 0) {
                const fadeX = 1 - smoothstep((x / width - 0.08) / 0.58)
                const fadeY = 1 - smoothstep((y / height - 0.06) / 0.5)
                size *= 1 - (fadeX * fadeY * p.textProtection) / 100
            }
            if (size > 0.15) dots.push({ x, y, size })
        }
    }
    return dots
}

/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function DotBackground(input: Partial<Props>) {
    const p: Props = { ...defaults, ...input }
    const isStaticRenderer = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const contextRef = useRef<CanvasRenderingContext2D | null>(null)
    const dotsRef = useRef<Dot[]>([])
    const frameRef = useRef<number | null>(null)
    const dimensionsRef = useRef({ width: 0, height: 0 })
    const pointerRef = useRef<Pointer>({ x: 0, y: 0, influence: 0 })
    const targetRef = useRef<Pointer>({ x: 0, y: 0, influence: 0 })
    const reducedRef = useRef(false)
    const visibleRef = useRef(false)
    const staticRef = useRef(isStaticRenderer)
    staticRef.current = isStaticRenderer
    const propsRef = useRef(p)
    propsRef.current = p
    const drawRef = useRef<() => void>(() => {})

    const requestDraw = useCallback(() => {
        if (
            staticRef.current ||
            !visibleRef.current ||
            frameRef.current !== null ||
            (typeof document !== "undefined" && document.hidden)
        )
            return
        frameRef.current = requestAnimationFrame(() => drawRef.current())
    }, [])

    const draw = useCallback(() => {
        frameRef.current = null
        const ctx = contextRef.current
        const { width, height } = dimensionsRef.current
        if (
            !ctx ||
            !width ||
            !height ||
            staticRef.current ||
            !visibleRef.current ||
            document.hidden
        )
            return
        const s = propsRef.current
        const current = pointerRef.current
        const target = targetRef.current
        const ease = clamp(s.smoothness, 0.01, 1)
        current.x = lerp(current.x, target.x, ease)
        current.y = lerp(current.y, target.y, ease)
        current.influence = lerp(current.influence, target.influence, ease)
        if (Math.abs(current.influence - target.influence) < 0.001)
            current.influence = target.influence
        // Paint BOTH colors into the same opaque sRGB canvas.
        // This avoids CSS/canvas color-profile differences between the
        // Framer editor and the published page.
        const root = rootRef.current
        const canvas = canvasRef.current
        const background = root
            ? getComputedStyle(root).backgroundColor
            : s.backgroundColor
        const foreground = canvas
            ? getComputedStyle(canvas).color
            : s.foregroundColor
        ctx.globalAlpha = 1
        ctx.fillStyle = background
        ctx.fillRect(0, 0, width, height)
        ctx.fillStyle = foreground
        ctx.globalAlpha = clamp(s.dotOpacity, 0, 1)
        const motion = !reducedRef.current
        const interactive =
            motion && s.interactionMode !== "none" && current.influence > 0.001
        const ambient = motion && s.ambientMotion && s.ambientStrength > 0
        const time = performance.now() * 0.001
        const radius = Math.max(1, s.interactionRadius)
        for (const dot of dotsRef.current) {
            let { x, y, size } = dot
            if (ambient) {
                const phase =
                    (x * 0.008 + y * 0.006 - time * s.ambientSpeed * 2) *
                    Math.PI
                size *= 1 + Math.sin(phase) * s.ambientStrength
            }
            if (interactive) {
                const dx = x - current.x
                const dy = y - current.y
                const distanceSq = dx * dx + dy * dy
                if (distanceSq < radius * radius) {
                    const distance = Math.sqrt(distanceSq)
                    const influence =
                        smoothstep(1 - distance / radius) * current.influence
                    if (
                        s.interactionMode === "repel" ||
                        s.interactionMode === "attract"
                    ) {
                        const displacement =
                            influence *
                            s.distortionStrength *
                            (s.interactionMode === "repel" ? 1 : -1)
                        x += (dx / Math.max(0.001, distance)) * displacement
                        y += (dy / Math.max(0.001, distance)) * displacement
                    }
                    size *= 1 + influence * s.scaleStrength
                }
            }
            if (size <= 0.15) continue
            if (s.dotShape === "square")
                ctx.fillRect(x - size / 2, y - size / 2, size, size)
            else {
                ctx.beginPath()
                ctx.arc(x, y, size / 2, 0, TAU)
                ctx.fill()
            }
        }
        ctx.globalAlpha = 1
        const moving =
            Math.abs(current.x - target.x) > 0.15 ||
            Math.abs(current.y - target.y) > 0.15 ||
            Math.abs(current.influence - target.influence) > 0.001
        if (ambient || (motion && moving)) requestDraw()
    }, [requestDraw])
    drawRef.current = draw

    // Both the editor canvas and the published site use the component's
    // actual layout dimensions. Never derive dot geometry from the viewport
    // or from the transformed bounding rectangle (Framer canvas zoom).
    useLayoutEffect(() => {
        if (isStaticRenderer) return
        const root = rootRef.current
        const canvas = canvasRef.current
        if (!root || !canvas) return
        const ctx = canvas.getContext("2d", {
            alpha: false,
            colorSpace: "srgb",
        })
        if (!ctx) return
        contextRef.current = ctx

        const media = window.matchMedia("(prefers-reduced-motion: reduce)")
        let lastW = -1
        let lastH = -1
        let lastDpr = -1

        const resize = () => {
            // clientWidth/clientHeight are untransformed layout pixels.
            // Framer scales its editing canvas with CSS transforms, so
            // getBoundingClientRect() must not be used for dot geometry.
            const w = root.clientWidth
            const h = root.clientHeight
            if (w <= 0 || h <= 0) return
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            if (w === lastW && h === lastH && dpr === lastDpr) return
            lastW = w
            lastH = h
            lastDpr = dpr

            const pixelW = Math.max(1, Math.round(w * dpr))
            const pixelH = Math.max(1, Math.round(h * dpr))
            if (canvas.width !== pixelW) canvas.width = pixelW
            if (canvas.height !== pixelH) canvas.height = pixelH

            // The exact backing-store ratio avoids rounding drift at
            // non-integer zoom/devicePixelRatio combinations.
            ctx.setTransform(pixelW / w, 0, 0, pixelH / h, 0, 0)
            dimensionsRef.current = { width: w, height: h }
            dotsRef.current = createDots(w, h, propsRef.current)
            if (frameRef.current !== null) {
                cancelAnimationFrame(frameRef.current)
                frameRef.current = null
            }
            requestDraw()
        }

        const ro = new ResizeObserver(resize)
        ro.observe(root)
        const io = new IntersectionObserver(
            (entries) => {
                const visible = entries[0]?.isIntersecting ?? false
                visibleRef.current = visible
                if (!visible) {
                    if (frameRef.current !== null)
                        cancelAnimationFrame(frameRef.current)
                    frameRef.current = null
                } else if (!document.hidden) {
                    resize()
                    requestDraw()
                }
            },
            { threshold: 0 }
        )
        io.observe(root)
        const onMotion = () => {
            reducedRef.current = media.matches
            if (media.matches) {
                pointerRef.current.influence = 0
                targetRef.current.influence = 0
            }
            requestDraw()
        }
        const onVisibility = () => {
            if (document.hidden && frameRef.current !== null) {
                cancelAnimationFrame(frameRef.current)
                frameRef.current = null
            } else {
                resize()
                requestDraw()
            }
        }
        media.addEventListener?.("change", onMotion)
        document.addEventListener("visibilitychange", onVisibility)
        window.addEventListener("resize", resize)
        resize()
        onMotion()

        return () => {
            ro.disconnect()
            io.disconnect()
            visibleRef.current = false
            media.removeEventListener?.("change", onMotion)
            document.removeEventListener("visibilitychange", onVisibility)
            window.removeEventListener("resize", resize)
            if (frameRef.current !== null)
                cancelAnimationFrame(frameRef.current)
            frameRef.current = null
            contextRef.current = null
        }
    }, [requestDraw, isStaticRenderer])

    useLayoutEffect(() => {
        const { width, height } = dimensionsRef.current
        if (width && height)
            dotsRef.current = createDots(width, height, propsRef.current)
        if (frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current)
            frameRef.current = null
        }
        requestDraw()
    }, [
        p.backgroundColor,
        p.dotSpacing,
        p.minDotSize,
        p.maxDotSize,
        p.dotShape,
        p.dotOpacity,
        p.foregroundColor,
        p.gradientX,
        p.gradientY,
        p.gradientRadius,
        p.gradientSoftness,
        p.reverseGradient,
        p.textProtection,
        p.mobileDotScale,
        p.interactionMode,
        p.interactionRadius,
        p.distortionStrength,
        p.scaleStrength,
        p.smoothness,
        p.ambientMotion,
        p.ambientSpeed,
        p.ambientStrength,
        requestDraw,
    ])

    const updatePointer = (event: React.PointerEvent<HTMLDivElement>) => {
        if (
            isStaticRenderer ||
            !visibleRef.current ||
            reducedRef.current ||
            propsRef.current.interactionMode === "none"
        )
            return
        const root = rootRef.current
        if (!root) return
        const rect = root.getBoundingClientRect()
        const scaleX = rect.width / Math.max(1, root.clientWidth)
        const scaleY = rect.height / Math.max(1, root.clientHeight)
        targetRef.current = {
            x: (event.clientX - rect.left) / Math.max(0.001, scaleX),
            y: (event.clientY - rect.top) / Math.max(0.001, scaleY),
            influence: 1,
        }
        requestDraw()
    }
    const resetPointer = () => {
        targetRef.current.influence = 0
        requestDraw()
    }
    const hasLink = Boolean(p.heroLink?.trim())
    // Framer Canvas and export: render SVG without effects, listeners or RAF.
    // Same dot-generation algorithm and colors as the live Canvas drawing.
    const staticWidth = 1200
    const staticHeight = 700
    const staticDots = isStaticRenderer
        ? createDots(staticWidth, staticHeight, p)
        : []
    return (
        <div
            ref={rootRef}
            style={{
                ...p.style,
                position: "relative",
                overflow: "hidden",
                minWidth: 0,
                minHeight: 0,
                isolation: "isolate",
                boxSizing: "border-box",
                backgroundColor: p.backgroundColor,
                borderRadius: p.borderRadius,
                touchAction: "pan-y",
                colorScheme: "light",
            }}
            onPointerMove={(event) => {
                if (!isStaticRenderer && event.pointerType !== "touch")
                    updatePointer(event)
            }}
            onPointerDown={(event) => {
                if (event.pointerType === "touch") updatePointer(event)
            }}
            onPointerUp={resetPointer}
            onPointerCancel={resetPointer}
            onPointerLeave={resetPointer}
        >
            {isStaticRenderer ? (
                <svg
                    aria-hidden="true"
                    viewBox={`0 0 ${staticWidth} ${staticHeight}`}
                    preserveAspectRatio="none"
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        display: "block",
                    }}
                >
                    <rect
                        width={staticWidth}
                        height={staticHeight}
                        fill={p.backgroundColor}
                    />
                    <g
                        fill={p.foregroundColor}
                        opacity={clamp(p.dotOpacity, 0, 1)}
                    >
                        {staticDots.map((dot, index) =>
                            p.dotShape === "square" ? (
                                <rect
                                    key={index}
                                    x={dot.x - dot.size / 2}
                                    y={dot.y - dot.size / 2}
                                    width={dot.size}
                                    height={dot.size}
                                />
                            ) : (
                                <circle
                                    key={index}
                                    cx={dot.x}
                                    cy={dot.y}
                                    r={dot.size / 2}
                                />
                            )
                        )}
                    </g>
                </svg>
            ) : (
                <canvas
                    ref={canvasRef}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        display: "block",
                        pointerEvents: "none",
                        color: p.foregroundColor,
                    }}
                />
            )}
            {hasLink && (
                <a
                    href={p.heroLink}
                    target={p.heroNewTab ? "_blank" : undefined}
                    rel={p.heroNewTab ? "noopener noreferrer" : undefined}
                    aria-label={p.linkLabel || "Open link"}
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 1,
                        display: "block",
                        cursor: "pointer",
                        borderRadius: "inherit",
                        background: "transparent",
                    }}
                />
            )}
        </div>
    )
}

addPropertyControls(DotBackground, {
    heroLink: { type: ControlType.Link, title: "Link" },
    heroNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
    },
    linkLabel: {
        type: ControlType.String,
        title: "Link Label",
        defaultValue: "Open link",
        hidden: (p) => !p.heroLink,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#D5FF65",
    },
    foregroundColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#172616",
    },
    dotOpacity: {
        type: ControlType.Number,
        title: "Dot Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
    },
    dotSpacing: {
        type: ControlType.Number,
        title: "Dot Spacing",
        defaultValue: 20,
        min: 8,
        max: 80,
        step: 1,
        unit: "px",
    },
    minDotSize: {
        type: ControlType.Number,
        title: "Min Dot",
        defaultValue: 0.5,
        min: 0,
        max: 15,
        step: 0.5,
        unit: "px",
    },
    maxDotSize: {
        type: ControlType.Number,
        title: "Max Dot",
        defaultValue: 16,
        min: 1,
        max: 60,
        step: 1,
        unit: "px",
    },
    dotShape: {
        type: ControlType.Enum,
        title: "Dot Shape",
        options: ["circle", "square"],
        optionTitles: ["Circle", "Square"],
        displaySegmentedControl: true,
        defaultValue: "circle",
    },
    gradientX: {
        type: ControlType.Number,
        title: "Gradient X",
        defaultValue: 22,
        min: -100,
        max: 200,
        step: 1,
        unit: "%",
    },
    gradientY: {
        type: ControlType.Number,
        title: "Gradient Y",
        defaultValue: 12,
        min: -100,
        max: 200,
        step: 1,
        unit: "%",
    },
    gradientRadius: {
        type: ControlType.Number,
        title: "Gradient Radius",
        defaultValue: 86,
        min: 5,
        max: 250,
        step: 1,
        unit: "%",
    },
    gradientSoftness: {
        type: ControlType.Number,
        title: "Gradient Curve",
        defaultValue: 1,
        min: 0.2,
        max: 4,
        step: 0.1,
    },
    reverseGradient: {
        type: ControlType.Boolean,
        title: "Reverse",
        defaultValue: false,
    },
    textProtection: {
        type: ControlType.Number,
        title: "Clear Area",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 5,
        unit: "%",
    },
    mobileDotScale: {
        type: ControlType.Number,
        title: "Mobile Dots",
        defaultValue: 0.85,
        min: 0.3,
        max: 1.5,
        step: 0.05,
    },
    interactionMode: {
        type: ControlType.Enum,
        title: "Interaction",
        options: ["repel", "attract", "scale", "none"],
        optionTitles: ["Repel", "Attract", "Scale", "None"],
        defaultValue: "repel",
    },
    interactionRadius: {
        type: ControlType.Number,
        title: "Hover Radius",
        defaultValue: 150,
        min: 30,
        max: 500,
        step: 5,
        unit: "px",
        hidden: (p) => p.interactionMode === "none",
    },
    distortionStrength: {
        type: ControlType.Number,
        title: "Push Strength",
        defaultValue: 26,
        min: 0,
        max: 150,
        step: 1,
        unit: "px",
        hidden: (p) =>
            p.interactionMode === "none" || p.interactionMode === "scale",
    },
    scaleStrength: {
        type: ControlType.Number,
        title: "Scale Strength",
        defaultValue: 0.45,
        min: -1,
        max: 3,
        step: 0.05,
        hidden: (p) => p.interactionMode === "none",
    },
    smoothness: {
        type: ControlType.Number,
        title: "Smoothness",
        defaultValue: 0.16,
        min: 0.01,
        max: 1,
        step: 0.01,
        hidden: (p) => p.interactionMode === "none",
    },
    ambientMotion: {
        type: ControlType.Boolean,
        title: "Ambient Motion",
        defaultValue: false,
    },
    ambientSpeed: {
        type: ControlType.Number,
        title: "Ambient Speed",
        defaultValue: 0.65,
        min: 0.05,
        max: 3,
        step: 0.05,
        hidden: (p) => !p.ambientMotion,
    },
    ambientStrength: {
        type: ControlType.Number,
        title: "Ambient Amount",
        defaultValue: 0.12,
        min: 0,
        max: 0.6,
        step: 0.01,
        hidden: (p) => !p.ambientMotion,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
})
