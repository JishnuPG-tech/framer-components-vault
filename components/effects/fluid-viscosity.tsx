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

import { startTransition, type CSSProperties, useCallback, useEffect, useId, useMemo, useRef } from "react"

/** User instructions: Create this Fluid Viscosity effect component bys using this exact code. */

/**
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight 520
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function FluidViscosityEffect(props: Props) {
    const {
        backImage = {
            src: "https://images.unsplash.com/photo-1518066000714-58c45f1a2c0a?q=80&w=1200&auto=format&fit=crop",
            alt: "Back image",
        },
        topImage = {
            src: "https://images.unsplash.com/photo-1558486012-817176f84c6d?q=80&w=1200&auto=format&fit=crop",
            alt: "Top image",
        },
        effectPreset = "waveCurtain",
        // Custom effect (only when effectPreset=custom)
        customClipType = "inset",
        customInsetRound = "24px",
        customCircleMaxRadius = 80,
        customCircleX = 50,
        customCircleY = 50,
        customPolygonSkew = 15,
        cardRadius,
        cardBackground,
        hoverScaleBack,
        hoverScaleTopContainer,
        durationMs,
        easing,
        displacementMax,
        baseFrequencyX,
        baseFrequencyY,
        octaves,
        overlayGradientStrength,
        enableTouchToggle,
        style,
    } = props

    const renderTarget = RenderTarget.current()
    const isStatic = useIsStaticRenderer()
    const disableAnimation = isStatic && renderTarget !== RenderTarget.canvas
    const filterId = useId().replace(/:/g, "_")
    const dispRef = useRef<SVGFEDisplacementMapElement | null>(null)
    const innerRef = useRef<HTMLDivElement | null>(null)
    const rafRef = useRef<number | null>(null)

    const liquidValRef = useRef(0)
    const liquidTargetRef = useRef(0)

    const transitionTimingFunction = useMemo(() => {
        switch (easing) {
            case "premium":
                return "cubic-bezier(0.23, 1, 0.32, 1)"
            case "easeOut":
                return "cubic-bezier(0.16, 1, 0.3, 1)"
            case "easeInOut":
                return "cubic-bezier(0.65, 0, 0.35, 1)"
            case "linear":
            default:
                return "linear"
        }
    }, [easing])

    const cleanupRaf = useCallback(() => {
        if (typeof window === "undefined") return
        if (rafRef.current != null) {
            window.cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }, [])

    const applyAt = useCallback(
        (valPct: number) => {
            const disp = dispRef.current
            const inner = innerRef.current
            if (!inner) return

            // waveIntensity matches provided code
            const waveIntensity = Math.sin((valPct / 100) * Math.PI)
            if (disp) disp.setAttribute("scale", String(waveIntensity * displacementMax))

            const v = Math.max(0, Math.min(100, valPct))
            const progress = v / 100
            const remaining = 1 - progress

            const setMask = (value: string | undefined) => {
                // @ts-ignore
                inner.style.webkitMaskImage = value || ""
                // @ts-ignore
                inner.style.maskImage = value || ""
            }

            const clip = (() => {
                switch (effectPreset) {
                    case "waveCurtain": {
                        // Must be fully visible at rest (progress=0) and fully hidden at end (progress=1).
                        const amp = 28 * waveIntensity
                        const points: string[] = []
                        const steps = 18
                        for (let i = 0; i <= steps; i++) {
                            const x = (i / steps) * 100
                            const phase = (i / steps) * Math.PI * 2
                            const yEdge = Math.max(0, Math.min(100, v + Math.sin(phase + progress * Math.PI) * amp))
                            points.push(`${x}% ${yEdge}%`)
                        }
                        setMask(undefined)
                        return `polygon(${points.join(", ")}, 100% 100%, 0% 100%)`
                    }

                    case "irisShrink": {
                        // Start fully visible: radius must cover the corners (>= ~71%). Use 150% for safety.
                        const r = Math.max(0, 150 * remaining)
                        setMask(undefined)
                        return `circle(${r}% at 50% 50%)`
                    }

                    case "centerSqueeze": {
                        // Squeeze vertically from center (non-basic: eased + overshoot)
                        const eased = Math.sin(remaining * Math.PI * 0.5)
                        const halfCut = (1 - eased) * 50
                        const wobble = Math.sin(progress * Math.PI * 2) * 2 * waveIntensity
                        setMask(undefined)
                        return `inset(${Math.max(0, halfCut + wobble)}% 0 ${Math.max(0, halfCut - wobble)}% 0 round 24px)`
                    }

                    case "shatter": {
                        // Must be fully visible at rest (progress=0)
                        const amp = 30 * waveIntensity
                        const points: string[] = []
                        const steps = 18
                        for (let i = 0; i <= steps; i++) {
                            const x = (i / steps) * 100
                            const seed = Math.sin((i + 1) * 999.123) * 10000
                            const rand = seed - Math.floor(seed)
                            const yEdge = Math.max(0, Math.min(100, v + (rand - 0.5) * amp))
                            points.push(`${x}% ${yEdge}%`)
                        }
                        setMask(undefined)
                        return `polygon(${points.join(", ")}, 100% 100%, 0% 100%)`
                    }

                    case "custom": {
                        setMask(undefined)
                        if (customClipType === "inset") return `inset(${v}% 0 0 0 round ${customInsetRound})`
                        if (customClipType === "circle") {
                            const r = Math.max(0, customCircleMaxRadius * remaining)
                            return `circle(${r}% at ${customCircleX}% ${customCircleY}%)`
                        }
                        // polygon: behave like an inset wipe with optional skew, while starting fully visible at v=0
                        const y = Math.max(0, Math.min(100, v))
                        const xSkew = Math.max(-50, Math.min(50, customPolygonSkew))
                        return `polygon(0% ${Math.max(0, Math.min(100, y + xSkew))}%, 100% ${Math.max(0, Math.min(100, y - xSkew))}%, 100% 100%, 0% 100%)`
                    }

                    default:
                        setMask(undefined)
                        return `inset(${v}% 0 0 0)`
                }
            })()

            inner.style.clipPath = clip
        },
        [
            customCircleMaxRadius,
            customCircleX,
            customCircleY,
            customClipType,
            customInsetRound,
            customPolygonSkew,
            displacementMax,
            effectPreset,
        ]
    )

    const loop = useCallback(() => {
        if (typeof window === "undefined") return

        const v = liquidValRef.current
        const t = liquidTargetRef.current
        const next = v + (t - v) * 0.08

        liquidValRef.current = next
        applyAt(next)

        if (Math.abs(t - next) > 0.1) {
            rafRef.current = window.requestAnimationFrame(loop)
        } else {
            liquidValRef.current = t
            applyAt(t)
            const disp = dispRef.current
            if (disp) disp.setAttribute("scale", "0")
            rafRef.current = null
        }
    }, [applyAt])

    const setTarget = useCallback(
        (t: number) => {
            if (disableAnimation) return
            liquidTargetRef.current = t
            cleanupRaf()
            if (typeof window !== "undefined") rafRef.current = window.requestAnimationFrame(loop)
        },
        [cleanupRaf, disableAnimation, loop]
    )

    useEffect(() => {
        return () => cleanupRaf()
    }, [cleanupRaf])

    useEffect(() => {
        if (disableAnimation) return
        // Ensure initial state matches the provided code (0)
        liquidValRef.current = 0
        liquidTargetRef.current = 0
        applyAt(0)
        const disp = dispRef.current
        if (disp) disp.setAttribute("scale", "0")
    }, [applyAt, disableAnimation])

    const outerStyle: CSSProperties = useMemo(
        () => ({
            position: "relative",
            width: "100%",
            height: "100%",
            ...style,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background: "transparent",
            overflow: "visible",
        }),
        [style]
    )

    const cardTransition = useMemo(() => {
        const d = Math.max(0, durationMs)
        return `transform ${d}ms ${transitionTimingFunction}`
    }, [durationMs, transitionTimingFunction])

    const cardStyle: CSSProperties = useMemo(
        () => ({
            position: "relative",
            width: "100%",
            height: "100%",
            flex: "1 1 auto",
            borderRadius: cardRadius,
            border: "none",
            overflow: "hidden",
            background: cardBackground,
            cursor: disableAnimation ? "default" : "pointer",
            userSelect: "none",
        }),
        [cardBackground, cardRadius, disableAnimation]
    )

    const topContainerStyle: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            filter: `url(#${filterId})`,
            transition: cardTransition,
            transform: `scale(1)`,
        }),
        [cardTransition, filterId]
    )

    const backImageStyle: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${hoverScaleBack})`,
            transition: cardTransition,
            willChange: disableAnimation ? undefined : "transform",
        }),
        [cardTransition, hoverScaleBack, disableAnimation]
    )

    const innerStyle: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            clipPath: "inset(0 0 0 0)",
        }),
        []
    )

    const overlayStyle: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 16,
            background: `linear-gradient(to top, rgba(255,255,255,${Math.max(0, Math.min(1, overlayGradientStrength))}) 0%, rgba(255,255,255,0) 100%)`,
            mixBlendMode: "overlay",
            pointerEvents: "none",
        }),
        [overlayGradientStrength]
    )

    const [isHovered, setIsHovered] = React.useState(false)

    const onEnter = useCallback(() => {
        if (disableAnimation) return
        startTransition(() => setIsHovered(true))
        setTarget(100)
    }, [disableAnimation, setTarget])

    const onLeave = useCallback(() => {
        if (disableAnimation) return
        startTransition(() => setIsHovered(false))
        setTarget(0)
    }, [disableAnimation, setTarget])

    const onTouchStart = useCallback(() => {
        if (disableAnimation || !enableTouchToggle) return
        startTransition(() => setIsHovered((h) => !h))
        setTarget(liquidTargetRef.current > 0 ? 0 : 100)
    }, [enableTouchToggle, disableAnimation, setTarget])

    const currentBackTransform = useMemo(() => {
        // match: default scale-110 then hover scale-100
        const base = Math.max(1, hoverScaleBack)
        const hover = 1.0
        const s = isHovered ? hover : base
        return `scale(${s})`
    }, [hoverScaleBack, isHovered])

    const currentTopContainerTransform = useMemo(() => {
        const s = isHovered ? hoverScaleTopContainer : 1
        return `scale(${s})`
    }, [hoverScaleTopContainer, isHovered])

    // Static renderer: show a useful static preview (no filter/RAF)
    const staticTopReveal = disableAnimation || renderTarget === RenderTarget.thumbnail

    return (
        <div style={outerStyle}>
            <svg style={{ width: 0, height: 0, position: "absolute" }} aria-hidden="true">
                <filter id={filterId} colorInterpolationFilters="sRGB">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency={`${baseFrequencyX} ${baseFrequencyY}`}
                        numOctaves={octaves}
                        result="noise"
                    />
                    <feDisplacementMap
                        ref={dispRef}
                        in="SourceGraphic"
                        in2="noise"
                        scale={0}
                        xChannelSelector="R"
                        yChannelSelector="G"
                    />
                </filter>
            </svg>

            <div style={{ width: "100%", height: "100%", maxWidth: "100%" }}>
                <div
                    style={cardStyle}
                    role="img"
                    aria-label="Fluid viscosity hover card"
                    onMouseEnter={disableAnimation ? undefined : onEnter}
                    onMouseLeave={disableAnimation ? undefined : onLeave}
                    onTouchStart={disableAnimation ? undefined : onTouchStart}
                >
                    <img
                        src={backImage.src}
                        alt={backImage.alt || ""}
                        style={{
                            ...backImageStyle,
                            transform: disableAnimation ? `scale(${Math.max(1, hoverScaleBack)})` : currentBackTransform,
                            transitionTimingFunction: transitionTimingFunction,
                            transitionDuration: `${durationMs}ms`,
                        }}
                        draggable={false}
                    />

                    {staticTopReveal ? (
                        <div style={{ position: "absolute", inset: 0 }}>
                            <img
                                src={topImage.src}
                                alt={topImage.alt || ""}
                                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                                draggable={false}
                            />
                            <div style={overlayStyle} />
                        </div>
                    ) : (
                        <div
                            style={{
                                ...topContainerStyle,
                                transform: currentTopContainerTransform,
                                transitionTimingFunction: transitionTimingFunction,
                                transitionDuration: `${durationMs}ms`,
                                willChange: "transform, filter",
                            }}
                        >
                            <div ref={innerRef} style={innerStyle}>
                                <img
                                    src={topImage.src}
                                    alt={topImage.alt || ""}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    draggable={false}
                                />
                                <div style={overlayStyle} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

type AspectOption = "portrait45" | "square"
type EasingOption = "premium" | "easeOut" | "easeInOut" | "linear"
type EffectPreset = "waveCurtain" | "irisShrink" | "centerSqueeze" | "shatter" | "custom"

type CustomClipType = "inset" | "circle" | "polygon"

type ResponsiveImageLike = {
    src: string
    srcSet?: string
    alt?: string
}

type Props = {
    backImage: ResponsiveImageLike
    topImage: ResponsiveImageLike

    effectPreset: EffectPreset

    // Custom effect (only when effectPreset=custom)
    customClipType: CustomClipType
    customInsetRound: string
    customCircleMaxRadius: number
    customCircleX: number
    customCircleY: number
    customPolygonSkew: number

    cardRadius: string
    cardBackground: string

    hoverScaleBack: number
    hoverScaleTopContainer: number
    durationMs: number
    easing: EasingOption

    displacementMax: number
    baseFrequencyX: number
    baseFrequencyY: number
    octaves: number
    overlayGradientStrength: number
    enableTouchToggle: boolean

    style?: CSSProperties
}

addPropertyControls<Props>(FluidViscosityEffect, {
    backImage: { type: ControlType.ResponsiveImage, title: "Back Image" },
    topImage: { type: ControlType.ResponsiveImage, title: "Top Image" },

    effectPreset: {
        type: ControlType.Enum,
        title: "Effect",
        description: "Pick the reveal style that peels the top image away to show the back image.",
        options: ["waveCurtain", "irisShrink", "centerSqueeze", "shatter", "custom"],
        optionTitles: ["Wave Curtain", "Iris Shrink", "Center Squeeze", "Shatter", "Custom"],
        defaultValue: "waveCurtain",
    },

    customClipType: {
        type: ControlType.Enum,
        title: "Custom Type",
        description: "How the top image gets clipped when using Custom.",
        options: ["inset", "circle", "polygon"],
        optionTitles: ["Inset", "Circle", "Polygon"],
        defaultValue: "inset",
        hidden: ({ effectPreset }) => effectPreset !== "custom",
    },
    customInsetRound: {
        type: ControlType.BorderRadius,
        title: "Inset Round",
        defaultValue: "24px",
        hidden: ({ effectPreset, customClipType }) => effectPreset !== "custom" || customClipType !== "inset",
    },
    customCircleMaxRadius: {
        type: ControlType.Number,
        title: "Circle Radius",
        description: "Max size of the reveal circle (in % of the card).",
        defaultValue: 80,
        min: 0,
        max: 120,
        step: 1,
        unit: "%",
        hidden: ({ effectPreset, customClipType }) => effectPreset !== "custom" || customClipType !== "circle",
    },
    customCircleX: {
        type: ControlType.Number,
        title: "Circle X",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: ({ effectPreset, customClipType }) => effectPreset !== "custom" || customClipType !== "circle",
    },
    customCircleY: {
        type: ControlType.Number,
        title: "Circle Y",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: ({ effectPreset, customClipType }) => effectPreset !== "custom" || customClipType !== "circle",
    },
    customPolygonSkew: {
        type: ControlType.Number,
        title: "Poly Skew",
        description: "Adds a diagonal slant to the polygon edge.",
        defaultValue: 15,
        min: -50,
        max: 50,
        step: 1,
        unit: "%",
        hidden: ({ effectPreset, customClipType }) => effectPreset !== "custom" || customClipType !== "polygon",
    },

    cardBackground: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "#0A0A0A",
    },
    cardRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "16px",
    },

    durationMs: {
        type: ControlType.Number,
        title: "Duration",
        description: "How long the hover transition takes.",
        defaultValue: 1200,
        min: 0,
        max: 3000,
        step: 50,
        unit: "ms",
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["premium", "easeOut", "easeInOut", "linear"],
        optionTitles: ["Premium", "Ease Out", "Ease In/Out", "Linear"],
        defaultValue: "premium",
    },

    hoverScaleBack: {
        type: ControlType.Number,
        title: "Back Scale",
        defaultValue: 1.1,
        min: 1,
        max: 1.25,
        step: 0.01,
    },
    hoverScaleTopContainer: {
        type: ControlType.Number,
        title: "Top Scale",
        defaultValue: 1.03,
        min: 1,
        max: 1.12,
        step: 0.01,
    },

    displacementMax: {
        type: ControlType.Number,
        title: "Displace",
        description: "Strength of the liquid distortion (higher = more wavy).",
        defaultValue: 140,
        min: 0,
        max: 300,
        step: 1,
    },
    baseFrequencyX: {
        type: ControlType.Number,
        title: "Freq X",
        description: "Noise detail horizontally. Smaller = smoother, larger = busier.",
        defaultValue: 0.04,
        min: 0.0,
        max: 0.2,
        step: 0.005,
    },
    baseFrequencyY: {
        type: ControlType.Number,
        title: "Freq Y",
        defaultValue: 0.02,
        min: 0.0,
        max: 0.2,
        step: 0.005,
    },
    octaves: {
        type: ControlType.Number,
        title: "Octaves",
        description: "How many layers of noise are combined (more = more detail).",
        defaultValue: 3,
        min: 1,
        max: 6,
        step: 1,
    },

    overlayGradientStrength: {
        type: ControlType.Number,
        title: "Overlay",
        description: "Subtle highlight at the bottom edge of the top image.",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.05,
    },

    enableTouchToggle: {
        type: ControlType.Boolean,
        title: "Touch Toggle",
        description: "On mobile: tap once to reveal, tap again to reset.",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})