// Instructions: Create a Framer component that follows the Framer component rules and achieves the user's goal. Make a before / after slider.
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
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
    type PointerEvent,
    type KeyboardEvent,
    type SyntheticEvent,
} from "react"
import { useInView } from "framer-motion"

type ResponsiveImageLike = {
    src: string
    srcSet?: string
    alt?: string
}

type Orientation = "horizontal" | "vertical"

interface BeforeSwipeProps {
    beforeImage?: ResponsiveImageLike
    afterImage?: ResponsiveImageLike

    beforeCaption: string
    afterCaption: string
    showCaptions: boolean
    captionColor: string
    captionBackground: string
    captionFont: any

    orientation: Orientation
    initialPosition: number

    backgroundColor: string

    autoAnimatePreset: "off" | "pulse" | "idleDefault" | "idleFast" | "idleSlow"

    dividerColor: string
    dividerWidth: number
    dividerShadow: boolean
    dividerDashSize: number
    dividerDashGap: number
    dividerGradientStart: string
    dividerGradientEnd: string
    dividerPatternSvg: string
    dividerPatternSize: number

    handleColor: string
    handleSize: number
    handleShadow: boolean
    handleBorderColor: string
    handleIcon: "chevrons" | "arrows" | "grip" | "custom" | "none"
    handleIconColor: string
    handleCustomIcon: string

    dividerPreset: "solid" | "dashed" | "gradient" | "pattern"
    handlePreset:
        | "default"
        | "minimal"
        | "glass"
        | "liquidGlass"
        | "custom"
        | "hidden"

    borderRadius: string

    style?: CSSProperties
}

/**
 * Before / After Slider
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 360
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function BeforeSwipe(props: BeforeSwipeProps) {
    const {
        beforeImage = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Before image",
        },
        afterImage = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "After image",
        },
        orientation,
        initialPosition,
        backgroundColor,
        autoAnimatePreset,
        dividerColor,
        dividerWidth,
        dividerShadow,
        dividerDashSize,
        dividerDashGap,
        dividerGradientStart,
        dividerGradientEnd,
        dividerPatternSvg = "",
        dividerPatternSize,
        showHandle,
        handleColor,
        handleSize,
        handleShadow,
        handleBorderColor,
        handleIcon,
        handleIconColor,
        handleCustomIcon = "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        borderRadius,
        style,
        showCaptions,
        beforeCaption,
        afterCaption,
        captionColor,
        captionBackground,
        captionFont,
        dividerPreset,
        handlePreset,
    } = props

    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const inView = useInView(rootRef, {
        amount: 0.2,
        margin: "200px 0px 200px 0px",
    })

    const [position, setPosition] = useState(() =>
        clamp01to100(initialPosition)
    )
    const [dragging, setDragging] = useState(false)
    const [pulseScale, setPulseScale] = useState(1)
    const pulseTimeoutRef = useRef<number | null>(null)
    const idleTimeoutRef = useRef<number | null>(null)
    const pulseRafRef = useRef<number | null>(null)
    const idleRafRef = useRef<number | null>(null)

    useEffect(() => {
        if (!isFiniteNumber(initialPosition)) return
        startTransition(() => setPosition(clamp01to100(initialPosition)))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialPosition])

    const isHorizontal = orientation === "horizontal"

    const objectFit = "cover"

    const updateFromClient = useCallback(
        (clientX: number, clientY: number) => {
            const el = rootRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            if (rect.width <= 0 || rect.height <= 0) return

            if (isHorizontal) {
                const x = clientX - rect.left
                const next = (x / rect.width) * 100
                startTransition(() => setPosition(clamp01to100(next)))
            } else {
                const y = clientY - rect.top
                const next = (y / rect.height) * 100
                startTransition(() => setPosition(clamp01to100(next)))
            }
        },
        [isHorizontal]
    )

    const onPointerDown = useCallback(
        (e: PointerEvent<HTMLDivElement>) => {
            if (isStatic) return
            if (!inView) return
            if (e.button !== undefined && e.button !== 0) return

            e.preventDefault()
            const target = e.currentTarget

            try {
                target.setPointerCapture(e.pointerId)
            } catch {
                // ignore
            }

            startTransition(() => setDragging(true))
            updateFromClient(e.clientX, e.clientY)
        },
        [inView, isStatic, updateFromClient]
    )

    const onPointerMove = useCallback(
        (e: PointerEvent<HTMLDivElement>) => {
            if (isStatic) return
            if (!inView) return
            if (!dragging) return
            e.preventDefault()
            updateFromClient(e.clientX, e.clientY)
        },
        [dragging, inView, isStatic, updateFromClient]
    )

    const endDrag = useCallback(
        (e?: SyntheticEvent<HTMLDivElement>) => {
            if (isStatic) return
            startTransition(() => setDragging(false))
        },
        [isStatic]
    )

    const onPointerUp = useCallback(
        (e: PointerEvent<HTMLDivElement>) => {
            if (isStatic) return
            if (!inView) return
            endDrag(e)
        },
        [endDrag, inView, isStatic]
    )

    const onPointerCancel = useCallback(
        (e: PointerEvent<HTMLDivElement>) => {
            if (isStatic) return
            endDrag(e)
        },
        [endDrag, isStatic]
    )

    const onKeyDown = useCallback(
        (e: KeyboardEvent<HTMLDivElement>) => {
            if (isStatic) return

            const step = e.shiftKey ? 10 : 2

            if (isHorizontal) {
                if (e.key === "ArrowLeft") {
                    e.preventDefault()
                    startTransition(() =>
                        setPosition((p) => clamp01to100(p - step))
                    )
                } else if (e.key === "ArrowRight") {
                    e.preventDefault()
                    startTransition(() =>
                        setPosition((p) => clamp01to100(p + step))
                    )
                }
            } else {
                if (e.key === "ArrowUp") {
                    e.preventDefault()
                    startTransition(() =>
                        setPosition((p) => clamp01to100(p - step))
                    )
                } else if (e.key === "ArrowDown") {
                    e.preventDefault()
                    startTransition(() =>
                        setPosition((p) => clamp01to100(p + step))
                    )
                }
            }

            if (e.key === "Home") {
                e.preventDefault()
                startTransition(() => setPosition(0))
            } else if (e.key === "End") {
                e.preventDefault()
                startTransition(() => setPosition(100))
            } else if (e.key === "Escape") {
                e.preventDefault()
                endDrag(e)
            }
        },
        [endDrag, isHorizontal, isStatic]
    )

    const cursor = useMemo(() => {
        if (isStatic) return "default"
        if (dragging) return isHorizontal ? "ew-resize" : "ns-resize"
        return isHorizontal ? "ew-resize" : "ns-resize"
    }, [dragging, isHorizontal, isStatic])

    const clipStyle = useMemo(() => {
        const p = clamp01to100(position)
        if (isHorizontal) return { clipPath: `inset(0 ${100 - p}% 0 0)` }
        return { clipPath: `inset(0 0 ${100 - p}% 0)` }
    }, [isHorizontal, position])

    const effectiveDivider = useMemo(() => {
        if (dividerPreset === "dashed") {
            return {
                variant: "dashed" as const,
                color: dividerColor,
                dashSize: 10,
                dashGap: 6,
                gradientStart: dividerGradientStart,
                gradientEnd: dividerGradientEnd,
                patternSvg: dividerPatternSvg,
                patternSize: dividerPatternSize,
                width: dividerWidth,
                shadow: dividerShadow,
            }
        }

        if (dividerPreset === "gradient") {
            return {
                variant: "gradient" as const,
                color: dividerColor,
                dashSize: dividerDashSize,
                dashGap: dividerDashGap,
                gradientStart: "rgba(255,255,255,1)",
                gradientEnd: "rgba(255,255,255,0)",
                patternSvg: dividerPatternSvg,
                patternSize: dividerPatternSize,
                width: dividerWidth,
                shadow: dividerShadow,
            }
        }

        if (dividerPreset === "pattern") {
            return {
                variant: "svgPattern" as const,
                color: dividerColor,
                dashSize: dividerDashSize,
                dashGap: dividerDashGap,
                gradientStart: dividerGradientStart,
                gradientEnd: dividerGradientEnd,
                patternSvg: dividerPatternSvg,
                patternSize: Math.max(2, dividerPatternSize),
                width: dividerWidth,
                shadow: dividerShadow,
            }
        }

        return {
            variant: "solid" as const,
            color: dividerColor,
            dashSize: dividerDashSize,
            dashGap: dividerDashGap,
            gradientStart: dividerGradientStart,
            gradientEnd: dividerGradientEnd,
            patternSvg: dividerPatternSvg,
            patternSize: dividerPatternSize,
            width: dividerWidth,
            shadow: dividerShadow,
        }
    }, [
        dividerColor,
        dividerDashGap,
        dividerDashSize,
        dividerGradientEnd,
        dividerGradientStart,
        dividerPatternSize,
        dividerPatternSvg,
        dividerPreset,
        dividerShadow,
        dividerWidth,
    ])

    const dividerCss: CSSProperties = useMemo(() => {
        const p = clamp01to100(position)
        const baseColor = effectiveDivider.color

        const dash = Math.max(1, effectiveDivider.dashSize)
        const gap = Math.max(0, effectiveDivider.dashGap)

        const backgroundImage = (() => {
            if (effectiveDivider.variant === "gradient") {
                const start = effectiveDivider.gradientStart || baseColor
                const end = effectiveDivider.gradientEnd || baseColor
                return isHorizontal
                    ? `linear-gradient(to bottom, ${start}, ${end})`
                    : `linear-gradient(to right, ${start}, ${end})`
            }

            if (effectiveDivider.variant === "dashed") {
                return isHorizontal
                    ? `repeating-linear-gradient(to bottom, ${baseColor} 0 ${dash}px, rgba(0,0,0,0) ${dash}px ${dash + gap}px)`
                    : `repeating-linear-gradient(to right, ${baseColor} 0 ${dash}px, rgba(0,0,0,0) ${dash}px ${dash + gap}px)`
            }

            if (
                effectiveDivider.variant === "svgPattern" &&
                effectiveDivider.patternSvg
            ) {
                return baseColor
            }

            return undefined
        })()

        const style: CSSProperties = {
            position: "absolute",
            zIndex: 3,
            top: isHorizontal ? 0 : `${p}%`,
            left: isHorizontal ? `${p}%` : 0,
            width: isHorizontal ? `${effectiveDivider.width}px` : "100%",
            height: isHorizontal ? "100%" : `${effectiveDivider.width}px`,
            transform: isHorizontal
                ? `translateX(-${effectiveDivider.width / 2}px)`
                : `translateY(-${effectiveDivider.width / 2}px)`,
            backgroundColor:
                effectiveDivider.variant === "solid"
                    ? baseColor
                    : effectiveDivider.variant === "svgPattern"
                      ? baseColor
                      : backgroundImage
                        ? "transparent"
                        : baseColor,
            backgroundImage:
                effectiveDivider.variant === "svgPattern"
                    ? undefined
                    : backgroundImage,
            boxShadow: effectiveDivider.shadow
                ? "0 0 10px rgba(0,0,0,0.28)"
                : "none",
            pointerEvents: "none",
        }

        if (
            effectiveDivider.variant === "svgPattern" &&
            effectiveDivider.patternSvg
        ) {
            const size = Math.max(2, effectiveDivider.patternSize)
            ;(style as any).WebkitMaskImage =
                `url(${effectiveDivider.patternSvg})`
            ;(style as any).maskImage = `url(${effectiveDivider.patternSvg})`
            ;(style as any).WebkitMaskRepeat = "repeat"
            ;(style as any).maskRepeat = "repeat"
            ;(style as any).WebkitMaskSize = `${size}px ${size}px`
            ;(style as any).maskSize = `${size}px ${size}px`
            ;(style as any).WebkitMaskPosition = "center"
            ;(style as any).maskPosition = "center"
        }

        return style
    }, [effectiveDivider, isHorizontal, position])

    const effectiveHandle = useMemo(() => {
        if (handlePreset === "custom") {
            return {
                color: handleColor,
                size: handleSize,
                shadow: handleShadow,
                borderColor: handleBorderColor,
                icon: handleIcon,
                iconColor: handleIconColor,
            }
        }

        if (handlePreset === "hidden") {
            return {
                showHandle: false,
                shadow: false,
                borderColor: "rgba(0,0,0,0)",
            }
        }

        if (handlePreset === "minimal") {
            return {
                color: "rgba(255,255,255,0.92)",
                size: handleSize,
                shadow: false,
                borderColor: "rgba(0,0,0,0.12)",
                icon: "grip" as const,
                iconColor: "#000000",
            }
        }

        if (handlePreset === "glass") {
            return {
                color: "rgba(255,255,255,0.22)",
                size: handleSize,
                shadow: true,
                borderColor: "rgba(255,255,255,0.40)",
                icon: "chevrons" as const,
                iconColor: "#000000",
            }
        }

        if (handlePreset === "liquidGlass") {
            return {
                color: "rgba(255,255,255,0.22)",
                size: handleSize,
                shadow: true,
                borderColor: "rgba(255,255,255,0.55)",
                icon: "chevrons" as const,
                iconColor: "#000000",
            }
        }

        // default
        return {
            color: "rgba(0,0,0,0.55)",
            size: handleSize,
            shadow: true,
            borderColor: "rgba(255,255,255,0.30)",
            icon: "arrows" as const,
            iconColor: "#FFFFFF",
        }
    }, [
        handleBorderColor,
        handleColor,
        handleIcon,
        handleIconColor,
        handlePreset,
        handleShadow,
        handleSize,
    ])

    const handleStyle: CSSProperties = useMemo(() => {
        const p = clamp01to100(position)
        const isGlass = handlePreset === "liquidGlass"
        return {
            position: "absolute",
            zIndex: 4,
            top: isHorizontal ? "50%" : `${p}%`,
            left: isHorizontal ? `${p}%` : "50%",
            width: `${effectiveHandle.size}px`,
            height: `${effectiveHandle.size}px`,
            borderRadius: 999,
            transform: `translate(-${effectiveHandle.size / 2}px, -${effectiveHandle.size / 2}px) scale(${pulseScale})`,
            backgroundColor: isGlass
                ? "rgba(255,255,255,0.22)"
                : effectiveHandle.color,
            boxShadow: effectiveHandle.shadow
                ? isGlass
                    ? "0 20px 60px rgba(0,0,0,0.25)"
                    : "0 8px 18px rgba(0,0,0,0.22)"
                : "none",
            border: `1px solid ${effectiveHandle.borderColor}`,
            backdropFilter: isGlass ? "blur(14px) saturate(180%)" : undefined,
            WebkitBackdropFilter: isGlass
                ? "blur(14px) saturate(180%)"
                : undefined,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
        }
    }, [effectiveHandle, handlePreset, isHorizontal, position, pulseScale])

    useEffect(() => {
        if (pulseTimeoutRef.current != null && typeof window !== "undefined") {
            window.clearTimeout(pulseTimeoutRef.current)
            pulseTimeoutRef.current = null
        }

        if (pulseRafRef.current != null && typeof window !== "undefined") {
            window.cancelAnimationFrame(pulseRafRef.current)
            pulseRafRef.current = null
        }

        if (idleTimeoutRef.current != null && typeof window !== "undefined") {
            window.clearTimeout(idleTimeoutRef.current)
            idleTimeoutRef.current = null
        }

        if (idleRafRef.current != null && typeof window !== "undefined") {
            window.cancelAnimationFrame(idleRafRef.current)
            idleRafRef.current = null
        }

        if (isStatic) {
            startTransition(() => setPulseScale(1))
            return
        }

        if (!inView) {
            startTransition(() => setPulseScale(1))
            return
        }

        if (dragging) {
            startTransition(() => setPulseScale(1))
            return
        }

        if (autoAnimatePreset === "pulse") {
            if (typeof window === "undefined") return

            pulseTimeoutRef.current = window.setTimeout(() => {
                const start = performance.now()
                const durationMs = 1400
                const amplitude = 0.08

                const tick = (t: number) => {
                    const phase = ((t - start) / durationMs) * Math.PI * 2
                    const eased = (1 - Math.cos(phase)) / 2
                    const scale = 1 + eased * amplitude
                    startTransition(() => setPulseScale(scale))
                    pulseRafRef.current = window.requestAnimationFrame(tick)
                }

                pulseRafRef.current = window.requestAnimationFrame(tick)

                return () => {
                    if (pulseTimeoutRef.current != null) {
                        window.clearTimeout(pulseTimeoutRef.current)
                        pulseTimeoutRef.current = null
                    }
                    if (pulseRafRef.current != null) {
                        window.cancelAnimationFrame(pulseRafRef.current)
                        pulseRafRef.current = null
                    }
                    startTransition(() => setPulseScale(1))
                }
            }, 1000)

            return () => {
                if (pulseTimeoutRef.current != null) {
                    window.clearTimeout(pulseTimeoutRef.current)
                    pulseTimeoutRef.current = null
                }
                if (pulseRafRef.current != null) {
                    window.cancelAnimationFrame(pulseRafRef.current)
                    pulseRafRef.current = null
                }
                startTransition(() => setPulseScale(1))
            }
        }

        if (autoAnimatePreset === "off") {
            startTransition(() => setPulseScale(1))
            return
        }

        if (typeof window === "undefined") return
        const durationSeconds =
            autoAnimatePreset === "idleFast"
                ? 20
                : autoAnimatePreset === "idleSlow"
                  ? 60
                  : 40

        const amplitude = 10

        idleTimeoutRef.current = window.setTimeout(() => {
            const base = clamp01to100(position)
            const start = performance.now()

            const tick = (t: number) => {
                const phase =
                    ((t - start) / (durationSeconds * 1000)) * Math.PI * 2
                const next = base + Math.sin(phase) * amplitude
                startTransition(() => setPosition(clamp01to100(next)))
                idleRafRef.current = window.requestAnimationFrame(tick)
            }

            idleRafRef.current = window.requestAnimationFrame(tick)
        }, 1000)

        return () => {
            if (idleTimeoutRef.current != null) {
                window.clearTimeout(idleTimeoutRef.current)
                idleTimeoutRef.current = null
            }
            if (idleRafRef.current != null) {
                window.cancelAnimationFrame(idleRafRef.current)
                idleRafRef.current = null
            }
        }
    }, [
        autoAnimatePreset,
        dragging,
        inView,
        initialPosition,
        isStatic,
        position,
    ])

    const handleIconSvg = useMemo(() => {
        if (effectiveHandle.icon === "none") return null

        if (effectiveHandle.icon === "custom") {
            return (
                <img
                    src={handleCustomIcon}
                    alt=""
                    draggable={false}
                    style={{
                        width: Math.max(
                            10,
                            Math.round(effectiveHandle.size * 0.5)
                        ),
                        height: Math.max(
                            10,
                            Math.round(effectiveHandle.size * 0.5)
                        ),
                        objectFit: "contain",
                        display: "block",
                        filter: "none",
                    }}
                />
            )
        }

        const size = Math.max(10, Math.round(effectiveHandle.size * 0.45))
        const strokeWidth = Math.max(
            1.5,
            Math.round(effectiveHandle.size * 0.05 * 10) / 10
        )
        const stroke = effectiveHandle.iconColor

        const path = (() => {
            if (effectiveHandle.icon === "chevrons") {
                return isHorizontal
                    ? "M9 6 L5 12 L9 18 M15 6 L19 12 L15 18"
                    : "M6 9 L12 5 L18 9 M6 15 L12 19 L18 15"
            }

            if (effectiveHandle.icon === "arrows") {
                return isHorizontal
                    ? "M9 6 L5 12 L9 18 M15 6 L19 12 L15 18 M5 12 H19"
                    : "M6 9 L12 5 L18 9 M6 15 L12 19 L18 15 M12 5 V19"
            }

            // grip
            return isHorizontal ? "M10 7 V17 M14 7 V17" : "M7 10 H17 M7 14 H17"
        })()

        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                focusable="false"
            >
                <path
                    d={path}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        )
    }, [effectiveHandle, handleCustomIcon, isHorizontal])

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                backgroundColor,
                borderRadius,
                touchAction: "none",
                userSelect: "none",
                cursor,
                ...style,
            }}
            role="slider"
            aria-label={"Before and after slider"}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(clamp01to100(position))}
            aria-orientation={orientation}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onKeyDown={onKeyDown}
            onBlur={endDrag}
        >
            <img
                src={afterImage?.src}
                srcSet={afterImage?.srcSet}
                alt={afterImage?.alt || ""}
                draggable={false}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit,
                    pointerEvents: "none",
                }}
            />

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    ...clipStyle,
                }}
                aria-hidden="true"
            >
                <img
                    src={beforeImage?.src}
                    srcSet={beforeImage?.srcSet}
                    alt={beforeImage?.alt || ""}
                    draggable={false}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit,
                        pointerEvents: "none",
                    }}
                />
            </div>

            <div style={dividerCss} aria-hidden="true" />

            {showCaptions && (beforeCaption || afterCaption) && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 5,
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                        padding: 12,
                        gap: 12,
                    }}
                >
                    <div
                        style={{
                            ...captionFont,
                            color: captionColor,
                            background: captionBackground,
                            padding: "6px 10px",
                            borderRadius: 999,
                            width: "max-content",
                            maxWidth: "70%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            backdropFilter: undefined,
                            WebkitBackdropFilter: undefined,
                        }}
                    >
                        {beforeCaption}
                    </div>
                    <div
                        style={{
                            ...captionFont,
                            color: captionColor,
                            background: captionBackground,
                            padding: "6px 10px",
                            borderRadius: 999,
                            width: "max-content",
                            maxWidth: "70%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            backdropFilter: undefined,
                            WebkitBackdropFilter: undefined,
                        }}
                    >
                        {afterCaption}
                    </div>
                </div>
            )}

            {showHandle && (
                <div style={handleStyle} aria-hidden="true">
                    {handleIconSvg}
                </div>
            )}
        </div>
    )
}

addPropertyControls(BeforeSwipe, {
    beforeImage: { type: ControlType.ResponsiveImage, title: "Before" },
    afterImage: { type: ControlType.ResponsiveImage, title: "After" },

    orientation: {
        type: ControlType.Enum,
        title: "Orientation",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
    },

    initialPosition: {
        type: ControlType.Number,
        title: "Start",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },

    autoAnimatePreset: {
        type: ControlType.Enum,
        title: "Animation",
        options: ["off", "pulse", "idleDefault", "idleFast", "idleSlow"],
        optionTitles: [
            "Off",
            "Pulse",
            "Slow (60s)",
            "Medium (40s)",
            "Fast (20s)",
        ],
        defaultValue: "off",
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
        description: "\n",
    },

    dividerPreset: {
        type: ControlType.Enum,
        title: "Divider",
        options: ["solid", "dashed", "gradient", "pattern"],
        optionTitles: ["Solid", "Dashed", "Gradient", "SVG Pattern"],
        defaultValue: "solid",
    },

    dividerColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#FFFFFF",
        hidden: ({ dividerPreset, dividerStyle }) => {
            if (dividerPreset === "solid") return false
            return dividerPreset !== "dashed"
        },
    },
    dividerDashSize: {
        type: ControlType.Number,
        title: "Dash",
        defaultValue: 10,
        min: 1,
        max: 80,
        step: 1,
        unit: "px",
        hidden: ({ dividerPreset }) => dividerPreset !== "dashed",
    },
    dividerDashGap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 6,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        hidden: ({ dividerPreset }) => dividerPreset !== "dashed",
    },
    dividerGradientStart: {
        type: ControlType.Color,
        title: "Color A",
        defaultValue: "rgba(255,255,255,1)",
        hidden: ({ dividerPreset }) => dividerPreset !== "gradient",
    },
    dividerGradientEnd: {
        type: ControlType.Color,
        title: "Color B",
        defaultValue: "rgba(255,255,255,0)",
        hidden: ({ dividerPreset }) => dividerPreset !== "gradient",
    },
    dividerPatternSvg: {
        type: ControlType.File,
        title: "Pattern",
        allowedFileTypes: ["svg"],
        hidden: ({ dividerPreset }) => dividerPreset !== "pattern",
    },
    dividerPatternSize: {
        type: ControlType.Number,
        title: "Pat Size",
        defaultValue: 18,
        min: 2,
        max: 160,
        step: 1,
        unit: "px",
        hidden: ({ dividerPreset }) => dividerPreset !== "pattern",
    },
    dividerWidth: {
        type: ControlType.Number,
        title: "Divider Width",
        defaultValue: 2,
        min: 1,
        max: 20,
        step: 1,
        unit: "px",
    },
    dividerShadow: {
        type: ControlType.Boolean,
        title: "Divider Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "\n",
    },

    showHandle: {
        type: ControlType.Boolean,
        title: "Handle",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    handlePreset: {
        type: ControlType.Enum,
        title: "Handle",
        options: [
            "default",
            "minimal",
            "glass",
            "liquidGlass",
            "custom",
            "hidden",
        ],
        optionTitles: [
            "Default",
            "Minimal",
            "Glass",
            "Liquid Glass",
            "Custom",
            "Hidden",
        ],
        defaultValue: "minimal",
    },

    handleSize: {
        type: ControlType.Number,
        title: "Handle Size",
        defaultValue: 24,
        min: 16,
        max: 48,
        step: 1,
        unit: "px",
        hidden: ({ handlePreset }) => handlePreset == "hidden",
    },
    handleColor: {
        type: ControlType.Color,
        title: "Handle",
        defaultValue: "#FFFFFF",
        hidden: ({ handlePreset }) => handlePreset !== "custom",
    },
    handleBorderColor: {
        type: ControlType.Color,
        title: "Handle Border",
        defaultValue: "rgba(0,0,0,0.08)",
        hidden: ({ handlePreset }) => handlePreset !== "custom",
    },
    handleIcon: {
        type: ControlType.Enum,
        title: "Icon",
        options: ["chevrons", "arrows", "grip", "custom", "none"],
        optionTitles: ["Chevrons", "Arrows", "Grip", "Custom", "None"],
        defaultValue: "arrows",
        displaySegmentedControl: false,
        hidden: ({ handlePreset }) => handlePreset !== "custom",
    },

    handleCustomIcon: {
        type: ControlType.File,
        title: "Custom Icon",
        allowedFileTypes: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
        hidden: ({ handleIcon, handlePreset }) =>
            handlePreset !== "custom" || handleIcon !== "custom",
    },

    handleIconColor: {
        type: ControlType.Color,
        title: "Icon",
        defaultValue: "#000000",
        hidden: ({ handleIcon, handlePreset }) =>
            handlePreset !== "custom" ||
            handleIcon === "none" ||
            handleIcon === "custom",
    },
    handleShadow: {
        type: ControlType.Boolean,
        title: "Handle Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "\n",
        hidden: ({ handlePreset }) => handlePreset == "hidden",
    },

    showCaptions: {
        type: ControlType.Boolean,
        title: "Captions",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    beforeCaption: {
        type: ControlType.String,
        title: "Before Caption",
        defaultValue: "Before",
        hidden: ({ showCaptions }) => !showCaptions,
    },
    afterCaption: {
        type: ControlType.String,
        title: "After Caption",
        defaultValue: "After",
        hidden: ({ showCaptions }) => !showCaptions,
    },
    captionColor: {
        type: ControlType.Color,
        title: "Caption Text",
        defaultValue: "#000000",
        hidden: ({ showCaptions }) => !showCaptions,
    },
    captionBackground: {
        type: ControlType.Color,
        title: "Caption Background",
        defaultValue: "rgba(255,255,255,0.75)",
        hidden: ({ showCaptions }) => !showCaptions,
    },
    captionFont: {
        type: ControlType.Font,
        title: "Caption Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        hidden: ({ showCaptions }) => !showCaptions,
    },

    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "16px",
        description:
            "Made by *[Bernburg]*(https://www.bernburg.is), \n [contact me](https://www.bernburg.is/contact) for support.",
    },
})

function clamp01to100(v: number) {
    if (!isFiniteNumber(v)) return 50
    return Math.max(0, Math.min(100, v))
}

function isFiniteNumber(v: any): v is number {
    return typeof v === "number" && Number.isFinite(v)
}
