// Instructions: Create a Framer component that follows the Framer component rules and achieves the user's goal.
// Goal: Craete this pixelated image reveal component. Use this code as reference and recreate it.

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    startTransition,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from "react"

type ResponsiveImage = { src: string; srcSet?: string; alt?: string }

type TriggerMode = "auto" | "hover" | "click"

interface PixelatedImageRevealProps {
    defaultImage: ResponsiveImage
    activeImage: ResponsiveImage

    trigger: TriggerMode

    gridSize: number
    stepDuration: number

    pixelColor: string
    borderRadius: string

    imageFit: "cover" | "contain"
    imagePositionPreset: "center" | "top" | "bottom" | "left" | "right" | "top left" | "top right" | "bottom left" | "bottom right"

    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight 360
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function PixelatedImageReveal(props: PixelatedImageRevealProps) {
    const isStatic = useIsStaticRenderer()

    const {
        defaultImage = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "",
        },
        activeImage = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "",
        },

        trigger = "auto",

        gridSize = 7,
        stepDuration = 0.3,

        pixelColor = "#000000",
        borderRadius = "8px",

        imageFit = "cover",
        imagePositionPreset = "center",

        style,
    } = props

    const safeGridSize = Math.max(1, Math.min(40, Math.floor(gridSize)))

    const isTouchDevice = useMemo(() => {
        if (typeof window === "undefined") return false
        const nav = window.navigator as any
        return (
            "ontouchstart" in window ||
            (typeof nav?.maxTouchPoints === "number" && nav.maxTouchPoints > 0) ||
            (typeof window.matchMedia === "function" &&
                window.matchMedia("(pointer: coarse)").matches)
        )
    }, [])

    const resolvedTrigger: "hover" | "click" = useMemo(() => {
        if (trigger === "hover") return "hover"
        if (trigger === "click") return "click"
        return isTouchDevice ? "click" : "hover"
    }, [trigger, isTouchDevice])

    const [isActive, setIsActive] = useState(false)
    const [showActiveLayer, setShowActiveLayer] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)
    const [isPressing, setIsPressing] = useState(false)
    const [animId, setAnimId] = useState(0)
    const [order, setOrder] = useState<number[]>([])

    const showTimerRef = useRef<number | null>(null)
    const endTimerRef = useRef<number | null>(null)

    const clearTimers = useCallback(() => {
        if (typeof window === "undefined") return
        if (showTimerRef.current != null) {
            window.clearTimeout(showTimerRef.current)
            showTimerRef.current = null
        }
        if (endTimerRef.current != null) {
            window.clearTimeout(endTimerRef.current)
            endTimerRef.current = null
        }
    }, [])

    useEffect(() => {
        return () => clearTimers()
    }, [clearTimers])

    const shuffledOrder = useCallback((n: number) => {
        const arr = Array.from({ length: n }, (_, i) => i)
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            const tmp = arr[i]
            arr[i] = arr[j]
            arr[j] = tmp
        }
        return arr
    }, [])

    const animatePixels = useCallback(
        (activate: boolean) => {
            if (isStatic) {
                startTransition(() => {
                    setIsActive(activate)
                    setShowActiveLayer(activate)
                })
                return
            }

            clearTimers()

            const nextOrder = shuffledOrder(Math.max(1, safeGridSize * safeGridSize))
            startTransition(() => {
                setIsActive(activate)
                // Match reference behavior: active image switches after the first stepDuration
                setShowActiveLayer((prev) => (activate ? false : prev))
                setIsAnimating(true)
                setOrder(nextOrder)
                setAnimId((v) => v + 1)
            })

            if (typeof window !== "undefined") {
                const stepMs = Math.max(0, stepDuration) * 1000
                showTimerRef.current = window.setTimeout(() => {
                    startTransition(() => setShowActiveLayer(activate))
                }, stepMs)

                endTimerRef.current = window.setTimeout(() => {
                    startTransition(() => setIsAnimating(false))
                }, Math.max(1, stepMs * 2))
            }
        },
        [clearTimers, isStatic, safeGridSize, shuffledOrder, stepDuration]
    )

    const handleMouseEnter = useCallback(() => {
        if (resolvedTrigger !== "hover") return
        if (isActive) return
        animatePixels(true)
    }, [animatePixels, isActive, resolvedTrigger])

    const handleMouseLeave = useCallback(() => {
        if (resolvedTrigger !== "hover") return
        if (!isActive) return
        animatePixels(false)
    }, [animatePixels, isActive, resolvedTrigger])

    const handleClick = useCallback(() => {
        if (resolvedTrigger !== "click") return
        animatePixels(!isActive)
    }, [animatePixels, isActive, resolvedTrigger])

    const pixelSizePct = 100 / safeGridSize
    const stagger = useMemo(() => {
        const n = Math.max(1, safeGridSize * safeGridSize)
        return Math.max(0, stepDuration) / n
    }, [safeGridSize, stepDuration])

    const pixels = useMemo(() => {
        const n = safeGridSize * safeGridSize
        const activeOrder = order.length === n ? order : Array.from({ length: n }, (_, i) => i)
        const rankByIndex = new Array(n).fill(0)
        for (let r = 0; r < n; r++) rankByIndex[activeOrder[r]] = r

        return Array.from({ length: n }, (_, index) => {
            const row = Math.floor(index / safeGridSize)
            const col = index % safeGridSize
            const rank = rankByIndex[index] ?? index
            return { index, row, col, rank }
        })
    }, [order, safeGridSize])

    const isFixedWidth = !!(style && style.width === "100%")
    const isFixedHeight = !!(style && style.height === "100%")

    const rootStyle: CSSProperties = useMemo(
        () => ({
            ...style,
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            borderRadius,
            background: "#F5F5F5",
            cursor: "default",
            touchAction: "manipulation",
            ...(isFixedWidth || isFixedHeight ? {} : {}),
        }),
        [borderRadius, isFixedHeight, isFixedWidth, style]
    )

    const resolvedImagePosition = useMemo(() => {
        return (imagePositionPreset || "center").trim()
    }, [imagePositionPreset])

    const imgStyle: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: imageFit,
            objectPosition: resolvedImagePosition,
            display: "block",
            userSelect: "none",
            pointerEvents: "none",
        }),
        [imageFit, resolvedImagePosition]
    )

    const pixelsLayerStyle: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
        }),
        []
    )

    const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const keyframesName = useMemo(
        () => `pixelReveal_${instanceId}_${Math.round(Math.max(0, stepDuration) * 1000)}`,
        [instanceId, stepDuration]
    )
    const animationDuration = Math.max(0.001, Math.max(0, stepDuration) * 2)

    return (
        <div
            style={rootStyle}
            onMouseEnter={isStatic ? undefined : handleMouseEnter}
            onMouseLeave={isStatic ? undefined : handleMouseLeave}
            onClick={isStatic ? undefined : handleClick}
            onPointerDown={
                isStatic
                    ? undefined
                    : () => {
                          startTransition(() => setIsPressing(true))
                      }
            }
            onPointerUp={
                isStatic
                    ? undefined
                    : () => {
                          startTransition(() => setIsPressing(false))
                      }
            }
            onPointerCancel={
                isStatic
                    ? undefined
                    : () => {
                          startTransition(() => setIsPressing(false))
                      }
            }
            role={resolvedTrigger === "click" ? "button" : undefined}
            tabIndex={resolvedTrigger === "click" ? 0 : undefined}
            onKeyDown={
                resolvedTrigger === "click"
                    ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              handleClick()
                          }
                      }
                    : undefined
            }
            aria-pressed={resolvedTrigger === "click" ? isActive : undefined}
        >
            <style>{`
                @keyframes ${keyframesName} {
                    0% { opacity: 0; }
                    1% { opacity: 1; }
                    49% { opacity: 1; }
                    50% { opacity: 0; }
                    100% { opacity: 0; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .__pixelated_pixel {
                        animation: none !important;
                        opacity: 0 !important;
                    }
                }
            `}</style>

            <img
                src={defaultImage?.src}
                srcSet={defaultImage?.srcSet}
                alt={defaultImage?.alt ?? ""}
                style={imgStyle}
                draggable={false}
            />

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: showActiveLayer ? "block" : "none",
                    pointerEvents: "none",
                }}
                aria-hidden={!showActiveLayer}
            >
                <img
                    src={activeImage?.src}
                    srcSet={activeImage?.srcSet}
                    alt={activeImage?.alt ?? ""}
                    style={imgStyle}
                    draggable={false}
                />
            </div>

            <div style={pixelsLayerStyle} aria-hidden>
                {pixels.map((p) => {
                    const delay = p.rank * stagger
                    return (
                        <div
                            key={`${animId}-${p.index}`}
                            className="__pixelated_pixel"
                            style={{
                                position: "absolute",
                                left: `${p.col * pixelSizePct}%`,
                                top: `${p.row * pixelSizePct}%`,
                                width: `${pixelSizePct}%`,
                                height: `${pixelSizePct}%`,
                                background: pixelColor,
                                opacity: 0,
                                display: isStatic || !isAnimating ? "none" : "block",
                                animationName: `${keyframesName}`,
                                animationDuration: `${animationDuration}s`,
                                animationTimingFunction: "linear",
                                animationDelay: `${delay}s`,
                                animationFillMode: "both",
                                willChange: "opacity",
                            }}
                        />
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(PixelatedImageReveal, {
    defaultImage: {
        type: ControlType.ResponsiveImage,
        title: "Default Image",
        description: "Image shown before interaction (hover/click).",
    },
    activeImage: {
        type: ControlType.ResponsiveImage,
        title: "Active Image",
        description: "Image revealed during the pixel animation.",
    },

    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        description: "How the reveal starts. Auto picks Hover on desktop and Click on touch devices.",
        options: ["auto", "hover", "click"],
        optionTitles: ["Auto", "Hover", "Click"],
        defaultValue: "auto",
        displaySegmentedControl: true,
    },

    gridSize: {
        type: ControlType.Number,
        title: "Grid Size",
        description: "Number of squares per row/column. Higher = smaller pixels (more detail) but more work.",
        defaultValue: 7,
        min: 1,
        max: 30,
        step: 1,
    },

    stepDuration: {
        type: ControlType.Number,
        title: "Step Duration",
        description: "Time for one phase of the animation (pixels in or pixels out). Total is 2× this value.",
        defaultValue: 0.3,
        min: 0.05,
        max: 2,
        step: 0.01,
        unit: "s",
    },

    pixelColor: {
        type: ControlType.Color,
        title: "Pixel Color",
        description: "Color of the pixel overlay that wipes between images.",
        defaultValue: "#000000",
    },

    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "8px",
    },

    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },

    imagePositionPreset: {
        type: ControlType.Enum,
        title: "Image Position",
        options: [
            "center",
            "top",
            "bottom",
            "left",
            "right",
            "top left",
            "top right",
            "bottom left",
            "bottom right",
        ],
        optionTitles: [
            "Center",
            "Top",
            "Bottom",
            "Left",
            "Right",
            "Top Left",
            "Top Right",
            "Bottom Left",
            "Bottom Right",
        ],
        defaultValue: "center",
        displaySegmentedControl: false,
    },

    // NOTE: `style` is provided by Framer automatically and is not a property control.
})