import React, {
    useCallback,
    useEffect,
    useMemo,
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

import { useInView } from "framer-motion"

interface KaleidoscopeProps {
    image: { src: string; srcSet?: string; alt?: string }
    slices: number
    zoom: number
    radiusMultiplier: number
    offsetScale: number
    baseRotationSpeed: number
    hoverMoveAmount: number
    ease: number
    idleEnabled: boolean
    idleMoveAmount: number
    idleSpeed: number
    maxFps: 30 | 45 | 60
    safariSliceCap: number
    performanceMode: "auto" | "quality" | "balanced" | "performance"
    livePreview: boolean
    style?: CSSProperties
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function getIsSafariLike() {
    if (typeof window === "undefined") return false
    const ua = window.navigator.userAgent
    const isSafari =
        /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR/i.test(ua)
    const isIOS =
        /iPad|iPhone|iPod/i.test(ua) ||
        (/(Macintosh)/i.test(ua) &&
            typeof document !== "undefined" &&
            "ontouchend" in document)
    return isSafari || isIOS
}

// Quality and Safari safe mode are now internalized here — not exposed as props.
// performanceMode drives all DPR, slice cap, and FPS decisions.
function getPerformanceSettings(mode: KaleidoscopeProps["performanceMode"]) {
    switch (mode) {
        case "quality":
            return { dpr: 2, sliceCap: 120, maxFps: 60 as const }
        case "balanced":
            return { dpr: 1.5, sliceCap: 48, maxFps: 45 as const }
        case "performance":
            return { dpr: 1, sliceCap: 32, maxFps: 30 as const }
        // "auto" is resolved before this call — should never reach default
        default:
            return { dpr: 1.5, sliceCap: 48, maxFps: 45 as const }
    }
}

/**
 * Kaleidoscope (Image)
 *
 * @framerIntrinsicWidth 460
 * @framerIntrinsicHeight 460
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function Kaleidoscope(props: KaleidoscopeProps) {
    const {
        image = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Kaleidoscope source",
        },
        slices,
        zoom,
        radiusMultiplier,
        offsetScale,
        baseRotationSpeed,
        hoverMoveAmount,
        ease,
        idleEnabled,
        idleMoveAmount,
        idleSpeed,
        maxFps,
        safariSliceCap,
        performanceMode,
        livePreview,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const renderTarget = RenderTarget.current()
    const allowMotion =
        !isStatic || (livePreview && renderTarget === RenderTarget.canvas)

    const containerRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null)

    const inView = useInView(containerRef, { margin: "200px" })

    const imgRef = useRef<HTMLImageElement | null>(null)
    const imgSizeRef = useRef<{ w: number; h: number } | null>(null)
    const patternRef = useRef<CanvasPattern | null>(null)
    const patternValidRef = useRef(false)

    const rafRef = useRef<number | null>(null)
    const lastTRef = useRef<number>(0)

    const txRef = useRef(0)
    const tyRef = useRef(0)
    const targetXRef = useRef(0)
    const targetYRef = useRef(0)
    const rotRef = useRef(0)

    const hoveringRef = useRef(false)
    const idleTRef = useRef(0)

    const isSafariLike = useMemo(() => getIsSafariLike(), [])

    // Resolve "auto" to a concrete mode before anything else
    const effectiveMode = useMemo(() => {
        if (performanceMode !== "auto") return performanceMode
        return isSafariLike ? "performance" : "balanced"
    }, [performanceMode, isSafariLike])

    const basePerf = useMemo(
        () => getPerformanceSettings(effectiveMode),
        [effectiveMode]
    )

    // Safari always gets DPR=1, regardless of mode — canvas at 2x is too costly
    const effectiveDpr = useMemo(() => {
        if (isSafariLike) return 1
        return clamp(basePerf.dpr, 1, 2)
    }, [basePerf.dpr, isSafariLike])

    const effectiveMaxFps = useMemo(() => {
        // Safari in performance mode hard-caps at 24
        if (isSafariLike && effectiveMode === "performance") return 24
        return Math.min(maxFps, basePerf.maxFps)
    }, [basePerf.maxFps, effectiveMode, isSafariLike, maxFps])

    const effectiveSliceCap = useMemo(() => {
        // Safari in performance mode hard-caps at 16
        if (isSafariLike && effectiveMode === "performance") return 16
        const userCap = Math.max(6, Math.round(safariSliceCap || 0))
        return isSafariLike
            ? Math.min(userCap, basePerf.sliceCap)
            : basePerf.sliceCap
    }, [basePerf.sliceCap, effectiveMode, isSafariLike, safariSliceCap])

    const effectiveIdleEnabled = useMemo(() => {
        // Disable idle on Safari in auto/performance to avoid continuous RAF drain
        if (isSafariLike && effectiveMode === "performance") return false
        return idleEnabled
    }, [effectiveMode, idleEnabled, isSafariLike])

    const effectiveRotationSpeed = useMemo(() => {
        // Disable continuous spin on Safari unless user explicitly picked Quality
        if (isSafariLike && effectiveMode !== "quality") return 0
        return baseRotationSpeed
    }, [baseRotationSpeed, effectiveMode, isSafariLike])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d", { alpha: true }) // no desynchronized:true
        if (!ctx) return
        ctxRef.current = ctx
        patternValidRef.current = false
        return () => {
            ctxRef.current = null
            patternValidRef.current = false
        }
    }, [])

    const loadImage = useCallback(() => {
        if (typeof window === "undefined") return
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.decoding = "async"
        img.loading = "eager"
        img.onload = () => {
            imgRef.current = img
            imgSizeRef.current = { w: img.width, h: img.height }
            patternValidRef.current = false
        }
        img.onerror = () => {
            imgRef.current = null
            imgSizeRef.current = null
            patternValidRef.current = false
        }
        img.src = image?.src || ""
    }, [image])

    useEffect(() => {
        loadImage()
    }, [loadImage])

    // Set transform + smoothing once, not on every draw call
    const applyCtxDefaults = useCallback(
        (ctx: CanvasRenderingContext2D) => {
            ctx.setTransform(effectiveDpr, 0, 0, effectiveDpr, 0, 0)
            ctx.imageSmoothingEnabled = !isSafariLike
            ;(ctx as any).imageSmoothingQuality = "low"
        },
        [effectiveDpr, isSafariLike]
    )

    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current
        const el = containerRef.current
        const ctx = ctxRef.current
        if (!canvas || !el || !ctx) return

        const rect = el.getBoundingClientRect()
        const w = Math.max(1, rect.width)
        const h = Math.max(1, rect.height)

        const nextW = Math.floor(w * effectiveDpr)
        const nextH = Math.floor(h * effectiveDpr)

        if (canvas.width !== nextW || canvas.height !== nextH) {
            canvas.width = nextW
            canvas.height = nextH
            patternValidRef.current = false
            patternRef.current = null
        }

        applyCtxDefaults(ctx)
    }, [applyCtxDefaults, effectiveDpr])

    const updateTargetsFromPointer = useCallback(
        (clientX: number, clientY: number) => {
            const el = containerRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            if (rect.width <= 0 || rect.height <= 0) return
            const x = clamp((clientX - rect.left) / rect.width, 0, 1)
            const y = clamp((clientY - rect.top) / rect.height, 0, 1)
            const hx = x - 0.1
            const hy = y - 0.1
            const radius =
                (Math.sqrt(
                    rect.width * rect.width + rect.height * rect.height
                ) /
                    2) *
                radiusMultiplier
            targetXRef.current = hx * radius * -0.8 * hoverMoveAmount
            targetYRef.current = hy * radius * 0.8 * hoverMoveAmount
        },
        [hoverMoveAmount, radiusMultiplier]
    )

    const pointerQueuedRef = useRef(false)
    const pointerLastRef = useRef<{ x: number; y: number } | null>(null)
    const lastPointerTRef = useRef(0)

    const pointerThrottleMs = useMemo(() => {
        if (isSafariLike) return 50
        return effectiveMaxFps <= 30 ? 33 : effectiveMaxFps <= 45 ? 22 : 16
    }, [effectiveMaxFps, isSafariLike])

    const draw = useCallback(() => {
        const canvas = canvasRef.current
        const ctx = ctxRef.current
        if (!canvas || !ctx) return

        const img = imgRef.current
        const imgSize = imgSizeRef.current

        const wCss = canvas.width / effectiveDpr
        const hCss = canvas.height / effectiveDpr

        ctx.clearRect(0, 0, wCss, hCss)

        if (!img || !imgSize) return

        if (!patternValidRef.current || !patternRef.current) {
            const p = ctx.createPattern(img, "repeat")
            if (!p) return
            patternRef.current = p
            patternValidRef.current = true
        }

        ctx.fillStyle = patternRef.current

        const radius =
            (Math.sqrt(wCss * wCss + hCss * hCss) / 2) * radiusMultiplier
        const cx = wCss / 2
        const cy = hCss / 2

        const requestedSlices = Math.max(2, Math.round(slices))
        const nSlices = Math.max(
            2,
            Math.min(requestedSlices, effectiveSliceCap)
        )
        const step = (Math.PI * 2) / nSlices

        const imgMin = Math.max(1, Math.min(imgSize.w, imgSize.h))
        const scale = zoom * (radius / imgMin)
        const imgCx = imgSize.w / 2

        for (let i = 0; i <= nSlices; i++) {
            ctx.save()
            ctx.translate(cx, cy)
            ctx.rotate(i * step)
            ctx.beginPath()
            ctx.moveTo(0, 0)
            ctx.arc(0, 0, radius + 1, step * -0.51, step * 0.51)
            ctx.closePath()
            ctx.rotate(Math.PI / 2)
            ctx.scale(scale, scale)
            ctx.scale(i % 2 ? -1 : 1, 1)
            ctx.translate(txRef.current - imgCx, tyRef.current)
            ctx.rotate(rotRef.current)
            ctx.scale(offsetScale, offsetScale)
            ctx.fill()
            ctx.restore()
        }
    }, [
        effectiveDpr,
        effectiveSliceCap,
        offsetScale,
        radiusMultiplier,
        slices,
        zoom,
    ])

    const tick = useCallback(
        (t: number) => {
            rafRef.current = null
            if (!inView || !allowMotion) return

            const minDt = 1000 / Math.max(1, effectiveMaxFps)
            if (t - lastTRef.current < minDt) {
                rafRef.current = requestAnimationFrame(tick)
                return
            }
            lastTRef.current = t

            if (effectiveIdleEnabled && !hoveringRef.current) {
                idleTRef.current += 0.01 * Math.max(0.001, idleSpeed)
                const it = idleTRef.current
                targetXRef.current = Math.sin(it) * idleMoveAmount
                targetYRef.current = Math.cos(it * 0.7) * idleMoveAmount
            }

            if (effectiveRotationSpeed !== 0) {
                rotRef.current -= effectiveRotationSpeed
            }

            const e = clamp(ease, 0.0001, 0.2)
            const dx = targetXRef.current - txRef.current
            const dy = targetYRef.current - tyRef.current
            txRef.current += dx * e
            tyRef.current += dy * e

            draw()

            const settled = Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05
            const needsContinuous =
                effectiveIdleEnabled || Math.abs(effectiveRotationSpeed) > 0
            const needsHover = hoveringRef.current && !settled

            if (needsContinuous || needsHover) {
                rafRef.current = requestAnimationFrame(tick)
            }
        },
        [
            allowMotion,
            draw,
            ease,
            effectiveIdleEnabled,
            effectiveMaxFps,
            effectiveRotationSpeed,
            idleMoveAmount,
            idleSpeed,
            inView,
        ]
    )

    const requestLoop = useCallback(() => {
        if (typeof window === "undefined") return
        if (!allowMotion || !inView) return
        if (rafRef.current != null) return
        lastTRef.current = 0
        rafRef.current = requestAnimationFrame(tick)
    }, [allowMotion, inView, tick])

    const onPointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!allowMotion) return
            const now =
                typeof performance !== "undefined"
                    ? performance.now()
                    : Date.now()
            pointerLastRef.current = { x: e.clientX, y: e.clientY }

            if (now - lastPointerTRef.current < pointerThrottleMs) {
                if (pointerQueuedRef.current) return
                pointerQueuedRef.current = true
                requestAnimationFrame(() => {
                    pointerQueuedRef.current = false
                    const last = pointerLastRef.current
                    if (!last) return
                    lastPointerTRef.current =
                        typeof performance !== "undefined"
                            ? performance.now()
                            : Date.now()
                    updateTargetsFromPointer(last.x, last.y)
                    requestLoop()
                })
                return
            }

            lastPointerTRef.current = now
            updateTargetsFromPointer(e.clientX, e.clientY)
            requestLoop()
        },
        [allowMotion, pointerThrottleMs, requestLoop, updateTargetsFromPointer]
    )

    const onPointerEnter = useCallback(() => {
        hoveringRef.current = true
        requestLoop()
    }, [requestLoop])

    const onPointerLeave = useCallback(() => {
        hoveringRef.current = false
        requestLoop()
    }, [requestLoop])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (!inView || !allowMotion) {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
            return
        }

        const needsContinuous =
            effectiveIdleEnabled || Math.abs(effectiveRotationSpeed) > 0
        if (needsContinuous) {
            requestLoop()
        } else {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
            draw()
        }

        return () => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }, [
        allowMotion,
        draw,
        effectiveIdleEnabled,
        effectiveRotationSpeed,
        inView,
        requestLoop,
    ])

    useEffect(() => {
        resizeCanvas()
        draw()
    }, [resizeCanvas, draw])

    useEffect(() => {
        const ctx = ctxRef.current
        if (!ctx) return
        applyCtxDefaults(ctx)
        patternValidRef.current = false
    }, [applyCtxDefaults])

    const wrapperStyle: CSSProperties = useMemo(
        () => ({
            ...style,
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            background: "transparent",
            userSelect: "none",
            WebkitUserSelect: "none",
            touchAction: "none",
        }),
        [style]
    )

    return (
        <div
            ref={containerRef}
            style={wrapperStyle}
            aria-label="Kaleidoscope"
            onPointerMove={onPointerMove}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
        >
            <canvas
                ref={canvasRef}
                style={{ display: "block", width: "100%", height: "100%" }}
            />
        </div>
    )
}

addPropertyControls(Kaleidoscope, {
    livePreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    slices: {
        type: ControlType.Number,
        title: "Slices",
        defaultValue: 24,
        min: 2,
        max: 120,
        step: 1,
    },
    zoom: {
        type: ControlType.Number,
        title: "Zoom",
        defaultValue: 0.3,
        min: 0.2,
        max: 5,
        step: 0.01,
    },
    radiusMultiplier: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 2.62,
        min: 0.5,
        max: 3,
        step: 0.01,
    },
    offsetScale: {
        type: ControlType.Number,
        title: "Pattern Scale",
        defaultValue: 1,
        min: 0.1,
        max: 2,
        step: 0.01,
    },
    baseRotationSpeed: {
        type: ControlType.Number,
        title: "Spin",
        defaultValue: 0.002,
        min: -0.02,
        max: 0.02,
        step: 0.001,
    },
    hoverMoveAmount: {
        type: ControlType.Number,
        title: "Hover Move",
        defaultValue: 0.4,
        min: 0,
        max: 2,
        step: 0.01,
    },
    ease: {
        type: ControlType.Number,
        title: "Ease",
        defaultValue: 0.01,
        min: 0.001,
        max: 0.08,
        step: 0.001,
    },
    idleEnabled: {
        type: ControlType.Boolean,
        title: "Idle",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    idleMoveAmount: {
        type: ControlType.Number,
        title: "Idle Move",
        defaultValue: 30,
        min: 0,
        max: 200,
        step: 1,
        hidden: ({ idleEnabled }) => !idleEnabled,
    },
    idleSpeed: {
        type: ControlType.Number,
        title: "Idle Speed",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        hidden: ({ idleEnabled }) => !idleEnabled,
    },
    performanceMode: {
        type: ControlType.Enum,
        title: "Performance",
        defaultValue: "quality",
        options: ["auto", "quality", "balanced", "performance"],
        optionTitles: ["Auto", "Quality", "Balanced", "Performance"],
    },
    maxFps: {
        type: ControlType.Enum,
        title: "Max FPS",
        defaultValue: 60,
        options: [30, 45, 60],
        optionTitles: ["30", "45", "60"],
    },
    safariSliceCap: {
        type: ControlType.Number,
        title: "Safari Cap",
        defaultValue: 16,
        min: 6,
        max: 60,
        step: 1,
        description:
            "Max number of slices rendered on Safari and iOS. Lower values improve performance on those browsers. Has no effect on Chrome or Firefox.",
    },
})
