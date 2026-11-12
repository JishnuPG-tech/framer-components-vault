// Instructions: Create a hero slideshow with a mask reveal (wipe) transition between images, sliding horizontally with smooth easing. Use a clip-path or mask-based image transition instead of fade.
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView, type Easing } from "framer-motion"
import { startTransition, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"

type ResponsiveImageLike = { src: string; srcSet?: string; alt?: string }

type EasingPreset = "easeInOut" | "easeOut" | "easeIn" | "linear" | "custom"
type WipeDirection = "leftToRight" | "rightToLeft"

interface CustomBezier {
    x1: number
    y1: number
    x2: number
    y2: number
}

interface HeroWipeSlideshowProps {
    images: ResponsiveImageLike[]
    imageBrightness: number
    imageMaskEnabled: boolean
    imageMaskType: "none" | "vignette" | "linearLeft" | "linearRight" | "linearTop" | "linearBottom"
    imageMaskEdge: number
    autoplay: boolean
    interval: number
    duration: number
    easing: EasingPreset
    customBezier: CustomBezier
    direction: WipeDirection
    borderRadius: string
    backgroundColor: string
    showControls: boolean
    controlsVisibility: "always" | "hover"
    controlColor: string
    controlBackground: string
    controlRadius: number
    controlSize: number
    controlsPosition: "bottomLeft" | "bottomCenter" | "bottomRight" | "topLeft" | "topCenter" | "topRight"
    controlsPadding: string
    controlBorder: any
    controlShadow: string
    controlHoverScale: number
    controlHoverOpacity: number
    padding: string
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function HeroWipeSlideshow(props: HeroWipeSlideshowProps) {
    const isStatic = useIsStaticRenderer()
    const {
        images,
        imageBrightness,
        imageMaskEnabled,
        imageMaskType,
        imageMaskEdge,
        autoplay,
        interval,
        duration,
        easing,
        customBezier,
        direction,
        borderRadius,
        backgroundColor,
        showControls,
        controlsVisibility,
        controlColor,
        controlBackground,
        controlRadius,
        controlSize,
        controlsPosition,
        controlsPadding,
        controlHoverScale,
        controlHoverOpacity,
        padding,
        style,
    } = props

    const [isHovering, setIsHovering] = useState(false)
    const [hoveredControl, setHoveredControl] = useState<"prev" | "next" | null>(null)

    const deviceCanHover = useMemo(() => {
        if (typeof window === "undefined") return false
        return window.matchMedia
            ? window.matchMedia("(hover: hover) and (pointer: fine)").matches
            : false
    }, [])

    const fallbackImages: ResponsiveImageLike[] = useMemo(
        () => [
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Gradient 5 - Green",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Gradient 4 - Yellow",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Gradient 3 - Orange",
            },
        ],
        []
    )

    const safeImages = useMemo(() => {
        const arr = Array.isArray(images) ? images.filter((i) => i && typeof i.src === "string" && i.src.length > 0) : []
        return arr.length > 0 ? arr : fallbackImages
    }, [images, fallbackImages])

    const containerRef = useRef<HTMLDivElement>(null)
    const inView = useInView(containerRef, { amount: 0.25 })

    const [index, setIndex] = useState(0)
    const [transitioning, setTransitioning] = useState(false)
    const [toIndex, setToIndex] = useState<number | null>(null)

    const timerRef = useRef<number | null>(null)

    const normalizedIndex = useMemo(() => {
        const len = safeImages.length
        if (len <= 0) return 0
        return ((index % len) + len) % len
    }, [index, safeImages.length])

    const current = safeImages[normalizedIndex]
    const nextIndex = useMemo(() => {
        const len = safeImages.length
        if (len <= 0) return 0
        return (normalizedIndex + 1) % len
    }, [normalizedIndex, safeImages.length])

    const prevIndex = useMemo(() => {
        const len = safeImages.length
        if (len <= 0) return 0
        return (normalizedIndex - 1 + len) % len
    }, [normalizedIndex, safeImages.length])

    const effectiveToIndex = toIndex ?? nextIndex
    const next = safeImages[effectiveToIndex] ?? safeImages[nextIndex]

    const ease: Easing = useMemo(() => {
        switch (easing) {
            case "linear":
                return "linear"
            case "easeIn":
                return [0.4, 0, 1, 1] as [number, number, number, number]
            case "easeOut":
                return [0, 0, 0.2, 1] as [number, number, number, number]
            case "custom":
                return [customBezier.x1, customBezier.y1, customBezier.x2, customBezier.y2] as [number, number, number, number]
            case "easeInOut":
            default:
                // Slightly more cinematic than the default material curve
                return [0.22, 1, 0.36, 1] as [number, number, number, number]
        }
    }, [customBezier.x1, customBezier.x2, customBezier.y1, customBezier.y2, easing])

    const wipeClipFrom = useMemo(() => {
        // clipPath inset(top right bottom left)
        if (direction === "rightToLeft") return "inset(0% 0% 0% 100%)"
        return "inset(0% 100% 0% 0%)"
    }, [direction])

    const wipeClipTo = useMemo(() => {
        return "inset(0% 0% 0% 0%)"
    }, [])

    const scaleFrom = 1.02
    const scaleTo = 1

    const nextSlideFromX = "0%"
    const nextSlideToX = "0%"

    const clearTimer = useCallback(() => {
        if (typeof window === "undefined") return
        if (timerRef.current != null) {
            window.clearInterval(timerRef.current)
            timerRef.current = null
        }
    }, [])

    const goTo = useCallback(
        (target: number) => {
            if (safeImages.length <= 1) return
            if (transitioning) return
            const len = safeImages.length
            const normalizedTarget = ((target % len) + len) % len
            if (normalizedTarget === normalizedIndex) return
            startTransition(() => {
                setToIndex(normalizedTarget)
                setTransitioning(true)
            })
        },
        [normalizedIndex, safeImages.length, transitioning]
    )

    const goNext = useCallback(() => {
        goTo(nextIndex)
    }, [goTo, nextIndex])

    const goPrev = useCallback(() => {
        goTo(prevIndex)
    }, [goTo, prevIndex])

    useEffect(() => {
        clearTimer()
        if (isStatic) return
        if (!autoplay) return
        if (!inView) return
        if (safeImages.length <= 1) return
        if (typeof window === "undefined") return

        timerRef.current = window.setInterval(() => {
            if (transitioning) return
            goNext()
        }, Math.max(500, interval * 1000))

        return () => clearTimer()
    }, [autoplay, clearTimer, goNext, inView, interval, isStatic, safeImages.length, transitioning])

    useEffect(() => {
        return () => clearTimer()
    }, [clearTimer])

    const onTransitionComplete = useCallback(() => {
        if (toIndex == null) {
            startTransition(() => setTransitioning(false))
            return
        }
        startTransition(() => {
            setIndex(toIndex)
            setToIndex(null)
            setTransitioning(false)
        })
    }, [normalizedIndex, safeImages.length, toIndex])

    const isFixedWidth = !!(style && style.width === "100%")
    const isFixedHeight = !!(style && style.height === "100%")

    const baseContainerStyle: CSSProperties = useMemo(
        () => ({
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            borderRadius,
            background: backgroundColor,
            padding,
            ...(style || {}),
            ...(isFixedWidth ? {} : {}),
            ...(isFixedHeight ? {} : {}),
        }),
        [backgroundColor, borderRadius, isFixedHeight, isFixedWidth, padding, style]
    )

    const imageLayerStyleBase: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            inset: padding && padding !== "0px" ? padding : 0,
            borderRadius: padding && padding !== "0px" ? `calc(${borderRadius} - 1px)` : borderRadius,
            overflow: "hidden",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: `brightness(${Math.max(0, imageBrightness)})`,
            willChange: "transform, clip-path",
        }),
        [borderRadius, imageBrightness, padding]
    )

    const imageMaskStyle: CSSProperties = useMemo(() => {
        if (!imageMaskEnabled || !imageMaskType || imageMaskType === "none") return {}
        const edge = Math.max(0, Math.min(100, imageMaskEdge))
        const inner = Math.max(0, Math.min(100, 100 - edge))

        let maskImage = ""
        switch (imageMaskType) {
            case "vignette":
                // White = visible, transparent = hidden
                maskImage = `radial-gradient(circle at center, rgba(255,255,255,1) ${inner}%, rgba(255,255,255,0) 100%)`
                break
            case "linearLeft":
                maskImage = `linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,1) ${edge}%, rgba(255,255,255,1) 100%)`
                break
            case "linearRight":
                maskImage = `linear-gradient(to left, rgba(255,255,255,0) 0%, rgba(255,255,255,1) ${edge}%, rgba(255,255,255,1) 100%)`
                break
            case "linearTop":
                maskImage = `linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) ${edge}%, rgba(255,255,255,1) 100%)`
                break
            case "linearBottom":
                maskImage = `linear-gradient(to top, rgba(255,255,255,0) 0%, rgba(255,255,255,1) ${edge}%, rgba(255,255,255,1) 100%)`
                break
            default:
                return {}
        }

        return {
            WebkitMaskImage: maskImage,
            maskImage,
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
        } as CSSProperties
    }, [imageMaskEdge, imageMaskEnabled, imageMaskType])

    const buttonCommon: CSSProperties = useMemo(
        () => ({
            width: controlSize,
            height: controlSize,
            borderRadius: controlRadius,
            outline: "none",
            border: "none",
            boxShadow: "none",
            appearance: "none",
            WebkitAppearance: "none",
            background: controlBackground,
            color: controlColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            pointerEvents: safeImages.length <= 1 ? "none" : "auto",
            opacity: safeImages.length <= 1 ? 0.5 : 1,
            transition:
                "opacity 350ms cubic-bezier(0.22, 1, 0.36, 1), transform 350ms cubic-bezier(0.22, 1, 0.36, 1)",
        }),
        [controlBackground, controlColor, controlRadius, controlSize, safeImages.length]
    )

    const canAnimate = !isStatic && safeImages.length > 1

    const controlsPlacementStyle: CSSProperties = useMemo(() => {
        const padString = controlsPadding && controlsPadding !== "0px" ? controlsPadding : "12px"
        const parts = String(padString).trim().split(/\s+/).filter(Boolean)
        const top = parts[0] || "12px"
        const right = parts[1] || top
        const bottom = parts[2] || top
        const left = parts[3] || right
        const base: CSSProperties = { position: "absolute", zIndex: 10 }

        switch (controlsPosition) {
            case "topLeft":
                return { ...base, top, left }
            case "topCenter":
                return { ...base, top, left: "50%", transform: "translateX(-50%)" }
            case "topRight":
                return { ...base, top, right }
            case "bottomLeft":
                return { ...base, bottom, left }
            case "bottomCenter":
                return { ...base, bottom, left: "50%", transform: "translateX(-50%)" }
            case "bottomRight":
            default:
                return { ...base, bottom, right }
        }
    }, [controlsPadding, controlsPosition])

    return (
        <section
            ref={containerRef}
            aria-roledescription="carousel"
            aria-label="Hero slideshow"
            style={baseContainerStyle}
            onMouseEnter={controlsVisibility === "hover" ? () => startTransition(() => setIsHovering(true)) : undefined}
            onMouseLeave={controlsVisibility === "hover" ? () => startTransition(() => setIsHovering(false)) : undefined}
            onFocusCapture={
                controlsVisibility === "hover"
                    ? () => startTransition(() => setIsHovering(true))
                    : undefined
            }
            onBlurCapture={
                controlsVisibility === "hover"
                    ? () => startTransition(() => setIsHovering(false))
                    : undefined
            }
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius,
                    overflow: "hidden",
                    pointerEvents: "none",
                    ...imageMaskStyle,
                }}
            >
                <div
                    role="img"
                    aria-label={current?.alt || "Slide image"}
                    style={{
                        ...imageLayerStyleBase,
                        backgroundImage: current?.src ? `url(${current.src})` : "none",
                        zIndex: 1,
                    }}
                />

                {canAnimate && transitioning && next?.src ? (
                    <motion.div
                        key={`${normalizedIndex}->${effectiveToIndex}`}
                        style={{
                            ...imageLayerStyleBase,
                            backgroundImage: `url(${next.src})`,
                            zIndex: 2,
                            backfaceVisibility: "hidden",
                            transformOrigin: "50% 50%",
                        }}
                        initial={{
                            clipPath: wipeClipFrom,
                            x: nextSlideFromX,
                            scale: scaleFrom,
                        }}
                        animate={{
                            clipPath: wipeClipTo,
                            x: nextSlideToX,
                            scale: scaleTo,
                        }}
                        transition={{
                            duration: Math.max(0.15, duration),
                            ease,
                        }}
                        onAnimationComplete={onTransitionComplete}
                        aria-label={next.alt || "Next slide image"}
                        role="img"
                    />
                ) : null}
            </div>

            {showControls ? (
                <div
                    style={{
                        ...controlsPlacementStyle,
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        gap: 10,
                        pointerEvents:
                            controlsVisibility === "hover" && deviceCanHover && !isStatic && !isHovering ? "none" : "auto",
                        opacity: controlsVisibility === "hover" && deviceCanHover && !isStatic ? (isHovering ? 1 : 0) : 1,
                        transition: "opacity 350ms cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                >
                    <button
                        type="button"
                        aria-label="Previous slide"
                        onClick={canAnimate ? goPrev : undefined}
                        onMouseEnter={() => startTransition(() => setHoveredControl("prev"))}
                        onMouseLeave={() => startTransition(() => setHoveredControl(null))}
                        onFocus={() => startTransition(() => setHoveredControl("prev"))}
                        onBlur={() => startTransition(() => setHoveredControl(null))}
                        style={{
                            ...buttonCommon,
                            ...(hoveredControl === "prev"
                                ? {
                                      transform: `scale(${controlHoverScale})`,
                                      opacity: controlHoverOpacity,
                                  }
                                : null),
                            pointerEvents:
                                controlsVisibility === "hover" && deviceCanHover && !isStatic && !isHovering ? "none" : "auto",
                        }}
                    >
                        <svg
                            width={Math.max(12, controlSize * 0.42)}
                            height={Math.max(12, controlSize * 0.42)}
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path
                                d="M15 18l-6-6 6-6"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>

                    <button
                        type="button"
                        aria-label="Next slide"
                        onClick={canAnimate ? goNext : undefined}
                        onMouseEnter={() => startTransition(() => setHoveredControl("next"))}
                        onMouseLeave={() => startTransition(() => setHoveredControl(null))}
                        onFocus={() => startTransition(() => setHoveredControl("next"))}
                        onBlur={() => startTransition(() => setHoveredControl(null))}
                        style={{
                            ...buttonCommon,
                            ...(hoveredControl === "next"
                                ? {
                                      transform: `scale(${controlHoverScale})`,
                                      opacity: controlHoverOpacity,
                                  }
                                : null),
                            pointerEvents:
                                controlsVisibility === "hover" && deviceCanHover && !isStatic && !isHovering ? "none" : "auto",
                        }}
                    >
                        <svg
                            width={Math.max(12, controlSize * 0.42)}
                            height={Math.max(12, controlSize * 0.42)}
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path
                                d="M9 6l6 6-6 6"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>
            ) : null}
        </section>
    )
}

addPropertyControls(HeroWipeSlideshow, {
    images: {
        type: ControlType.Array,
        title: "Images",
        maxCount: 10,
        defaultValue: [{}, {}, {}],
        control: { type: ControlType.ResponsiveImage },
    },
    imageBrightness: {
        type: ControlType.Number,
        title: "Brightness",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.01,
    },
    imageMaskEnabled: {
        type: ControlType.Boolean,
        title: "Image Mask",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    imageMaskType: {
        type: ControlType.Enum,
        title: "Mask Type",
        defaultValue: "vignette",
        options: ["none", "vignette", "linearLeft", "linearRight", "linearTop", "linearBottom"],
        optionTitles: ["None", "Vignette", "Linear Left", "Linear Right", "Linear Top", "Linear Bottom"],
        hidden: ({ imageMaskEnabled }) => !imageMaskEnabled,
    },
    imageMaskEdge: {
        type: ControlType.Number,
        title: "Mask Edge",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: ({ imageMaskEnabled, imageMaskType }) => !imageMaskEnabled || imageMaskType === "none",
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    interval: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: 4,
        min: 1,
        max: 20,
        step: 0.5,
        unit: "s",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.9,
        min: 0.15,
        max: 3,
        step: 0.05,
        unit: "s",
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        defaultValue: "easeInOut",
        options: ["easeInOut", "easeOut", "easeIn", "linear", "custom"],
        optionTitles: ["Ease In Out", "Ease Out", "Ease In", "Linear", "Custom Bezier"],
    },
    customBezier: {
        type: ControlType.Object,
        title: "Custom Bezier",
        icon: "effect",
        hidden: ({ easing }) => easing !== "custom",
        controls: {
            x1: { type: ControlType.Number, title: "x1", defaultValue: 0.22, min: 0, max: 1, step: 0.01 },
            y1: { type: ControlType.Number, title: "y1", defaultValue: 1, min: 0, max: 1.5, step: 0.01 },
            x2: { type: ControlType.Number, title: "x2", defaultValue: 0.36, min: 0, max: 1, step: 0.01 },
            y2: { type: ControlType.Number, title: "y2", defaultValue: 1, min: 0, max: 1.5, step: 0.01 },
        },
    },
    direction: {
        type: ControlType.Enum,
        title: "Wipe",
        defaultValue: "leftToRight",
        options: ["leftToRight", "rightToLeft"],
        optionTitles: ["Left → Right", "Right → Left"],
        displaySegmentedControl: true,
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "16px",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "0px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    showControls: {
        type: ControlType.Boolean,
        title: "Controls",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    controlsPosition: {
        type: ControlType.Enum,
        title: "Position",
        defaultValue: "bottomRight",
        options: ["bottomLeft", "bottomCenter", "bottomRight", "topLeft", "topCenter", "topRight"],
        optionTitles: ["Bottom Left", "Bottom Center", "Bottom Right", "Top Left", "Top Center", "Top Right"],
        hidden: ({ showControls }) => !showControls,
    },
    controlsPadding: {
        type: ControlType.Padding,
        title: "Ctrl Padding",
        defaultValue: "12px",
        hidden: ({ showControls }) => !showControls,
    },
    controlsVisibility: {
        type: ControlType.Enum,
        title: "Controls",
        defaultValue: "hover",
        options: ["hover", "always"],
        optionTitles: ["On Hover", "Always"],
        hidden: ({ showControls }) => !showControls,
    },
    controlColor: {
        type: ControlType.Color,
        title: "Icon",
        defaultValue: "#000000",
        hidden: ({ showControls }) => !showControls,
    },
    controlBackground: {
        type: ControlType.Color,
        title: "Button BG",
        defaultValue: "rgba(255,255,255,0.75)",
        hidden: ({ showControls }) => !showControls,
    },
    controlRadius: {
        type: ControlType.Number,
        title: "Btn Radius",
        defaultValue: 999,
        min: 0,
        max: 999,
        step: 1,
        hidden: ({ showControls }) => !showControls,
    },
    controlSize: {
        type: ControlType.Number,
        title: "Btn Size",
        defaultValue: 44,
        min: 28,
        max: 72,
        step: 1,
        unit: "px",
        hidden: ({ showControls }) => !showControls,
    },
    controlHoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.04,
        min: 0.8,
        max: 1.2,
        step: 0.01,
        hidden: ({ showControls }) => !showControls,
    },
    controlHoverOpacity: {
        type: ControlType.Number,
        title: "Hover Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: ({ showControls }) => !showControls,
    },
})