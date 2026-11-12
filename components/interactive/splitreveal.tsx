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
    type PointerEvent as ReactPointerEvent,
} from "react"

type FitMode = "cover" | "contain"
type Direction = "horizontal" | "vertical"

type ResponsiveImageLike = {
    src: string
    srcSet?: string
    alt?: string
}

interface SplitRevealProps {
    beforeImage: ResponsiveImageLike
    afterImage: ResponsiveImageLike
    initialPosition: number
    direction: Direction
    fit: FitMode
    aspectRatio: string

    // Labels & Typography
    showLabels: boolean
    beforeLabel: string
    afterLabel: string
    fontFamily: string
    fontSize: number
    fontWeight: number
    labelColor: string
    labelBgColor: string

    // Handle & Divider
    showHandle: boolean
    handleSize: number
    handleColor: string
    handleIconColor: string

    dividerWidth: number
    dividerColor: string
    dividerShadow: boolean

    borderRadius: string

    style?: CSSProperties
}

/**
 * Split Reveal - Image Comparison
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function SplitReveal(props: SplitRevealProps) {
    const {
        beforeImage = {
            src: "https://framerusercontent.com/images/NCf7usvG3jbgxe0NDwmf8B2kfTk.png",
            alt: "Before image",
        },
        afterImage = {
            src: "https://framerusercontent.com/images/vKUV422UsNhX3gjn9NQ8m87NgLs.png",
            alt: "After image",
        },
        initialPosition = 50,
        direction = "horizontal",
        fit = "cover",
        aspectRatio = "auto",
        showLabels = false,
        beforeLabel = "BEFORE",
        afterLabel = "AFTER",
        fontFamily = '"DM Mono", "Courier New", Courier, monospace',
        fontSize = 12,
        fontWeight = 500,
        labelColor = "#FFFFFF",
        labelBgColor = "rgba(0, 0, 0, 0.5)",
        showHandle = true,
        handleSize = 44,
        handleColor = "#FFFFFF",
        handleIconColor = "#000000",
        dividerWidth = 2,
        dividerColor = "#FFFFFF",
        dividerShadow = true,
        borderRadius = "16px",
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement | null>(null)
    const draggingRef = useRef(false)
    const pointerIdRef = useRef<number | null>(null)

    const [position, setPosition] = useState(() => {
        const v = Number.isFinite(initialPosition) ? initialPosition : 50
        return Math.max(0, Math.min(100, v))
    })

    useEffect(() => {
        const v = Number.isFinite(initialPosition) ? initialPosition : 50
        startTransition(() => setPosition(Math.max(0, Math.min(100, v))))
    }, [initialPosition])

    const clampPercent = useCallback((v: number) => {
        if (!Number.isFinite(v)) return 0
        return Math.max(0, Math.min(100, v))
    }, [])

    const computePositionFromPointer = useCallback(
        (clientX: number, clientY: number) => {
            const el = containerRef.current
            if (!el) return position
            const rect = el.getBoundingClientRect()

            if (direction === "horizontal") {
                if (!rect.width) return position
                const x = clientX - rect.left
                return clampPercent((x / rect.width) * 100)
            } else {
                if (!rect.height) return position
                const y = clientY - rect.top
                return clampPercent((y / rect.height) * 100)
            }
        },
        [clampPercent, direction, position]
    )

    const setPositionFromPointer = useCallback(
        (clientX: number, clientY: number) => {
            const p = computePositionFromPointer(clientX, clientY)
            startTransition(() => setPosition(p))
        },
        [computePositionFromPointer]
    )

    const onPointerDown = useCallback(
        (e: ReactPointerEvent<HTMLDivElement>) => {
            if (isStatic) return
            e.preventDefault()
            draggingRef.current = true
            pointerIdRef.current = e.pointerId
            try {
                e.currentTarget.setPointerCapture(e.pointerId)
            } catch {
                // Ignore fallback
            }
            setPositionFromPointer(e.clientX, e.clientY)
        },
        [isStatic, setPositionFromPointer]
    )

    const onPointerMove = useCallback(
        (e: ReactPointerEvent<HTMLDivElement>) => {
            if (isStatic || !draggingRef.current) return
            if (
                pointerIdRef.current !== null &&
                e.pointerId !== pointerIdRef.current
            ) {
                return
            }
            setPositionFromPointer(e.clientX, e.clientY)
        },
        [isStatic, setPositionFromPointer]
    )

    const endDrag = useCallback(() => {
        if (!draggingRef.current) return
        draggingRef.current = false
        pointerIdRef.current = null
    }, [])

    const onPointerUp = useCallback(
        (e: ReactPointerEvent<HTMLDivElement>) => {
            if (isStatic) return
            if (
                pointerIdRef.current !== null &&
                e.pointerId !== pointerIdRef.current
            ) {
                return
            }
            endDrag()
        },
        [endDrag, isStatic]
    )

    const isHorizontal = direction === "horizontal"

    const clippedBeforeStyle = useMemo<CSSProperties>(() => {
        return {
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            clipPath: isHorizontal
                ? `inset(0 ${100 - position}% 0 0)`
                : `inset(0 0 ${100 - position}% 0)`,
            zIndex: 2,
        }
    }, [isHorizontal, position])

    const dividerStyle = useMemo<CSSProperties>(() => {
        const half = dividerWidth / 2
        return {
            position: "absolute",
            top: isHorizontal ? 0 : `${position}%`,
            left: isHorizontal ? `${position}%` : 0,
            width: isHorizontal ? `${dividerWidth}px` : "100%",
            height: isHorizontal ? "100%" : `${dividerWidth}px`,
            backgroundColor: dividerColor,
            transform: isHorizontal
                ? `translateX(-${half}px)`
                : `translateY(-${half}px)`,
            boxShadow: dividerShadow ? "0 4px 12px rgba(0,0,0,0.25)" : "none",
            zIndex: 4,
            pointerEvents: "none",
        }
    }, [dividerColor, dividerShadow, dividerWidth, isHorizontal, position])

    const handleStyle = useMemo<CSSProperties>(() => {
        const half = handleSize / 2
        return {
            position: "absolute",
            top: isHorizontal ? "50%" : `${position}%`,
            left: isHorizontal ? `${position}%` : "50%",
            width: `${handleSize}px`,
            height: `${handleSize}px`,
            transform: `translate(-${half}px, -${half}px)`,
            borderRadius: 999,
            backgroundColor: handleColor,
            boxShadow: "0 6px 18px rgba(0,0,0,0.22)",
            zIndex: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
        }
    }, [handleColor, handleSize, isHorizontal, position])

    const labelBaseStyle: CSSProperties = {
        position: "absolute",
        width: "fit-content",
        height: "fit-content",
        padding: "6px 12px",
        borderRadius: 6,
        fontFamily,
        fontSize,
        fontWeight,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: labelColor,
        backgroundColor: labelBgColor,
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        pointerEvents: "none",
        userSelect: "none",
        boxSizing: "border-box",
        lineHeight: 1,
    }

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: style?.height || "auto",
                aspectRatio: aspectRatio !== "auto" ? aspectRatio : undefined,
                overflow: "hidden",
                borderRadius,
                touchAction: isStatic ? "auto" : "none",
                userSelect: "none",
                cursor: isStatic
                    ? "default"
                    : isHorizontal
                      ? "ew-resize"
                      : "ns-resize",
                background: "transparent",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={endDrag}
            role="slider"
            aria-label="Before and after image comparison slider"
            aria-orientation={isHorizontal ? "horizontal" : "vertical"}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(position)}
            tabIndex={0}
            onKeyDown={(e) => {
                if (isStatic) return
                const step = e.shiftKey ? 10 : 2
                const isDecreasing =
                    e.key === "ArrowLeft" || e.key === "ArrowUp"
                const isIncreasing =
                    e.key === "ArrowRight" || e.key === "ArrowDown"

                if (isDecreasing) {
                    e.preventDefault()
                    startTransition(() =>
                        setPosition((p) => clampPercent(p - step))
                    )
                }
                if (isIncreasing) {
                    e.preventDefault()
                    startTransition(() =>
                        setPosition((p) => clampPercent(p + step))
                    )
                }
                if (e.key === "Home") {
                    e.preventDefault()
                    startTransition(() => setPosition(0))
                }
                if (e.key === "End") {
                    e.preventDefault()
                    startTransition(() => setPosition(100))
                }
            }}
        >
            {/* After (underneath base image) */}
            <img
                src={afterImage?.src}
                srcSet={afterImage?.srcSet}
                alt={afterImage?.alt || "After image"}
                draggable={false}
                style={{
                    display: "block",
                    width: "100%",
                    height:
                        aspectRatio !== "auto" || style?.height === "100%"
                            ? "100%"
                            : "auto",
                    objectFit: fit,
                    objectPosition: "center",
                }}
            />

            {/* Before (revealed overlay image) */}
            <div style={clippedBeforeStyle} aria-hidden>
                <img
                    src={beforeImage?.src}
                    srcSet={beforeImage?.srcSet}
                    alt={beforeImage?.alt || "Before image"}
                    draggable={false}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: fit,
                        objectPosition: "center",
                    }}
                />
            </div>

            {/* Optional Labels */}
            {showLabels && (
                <>
                    {/* Before Label */}
                    <div
                        style={{
                            ...labelBaseStyle,
                            top: isHorizontal ? "auto" : 16,
                            bottom: 16,
                            left: 16,
                            right: "auto",
                            zIndex: 3,
                        }}
                    >
                        {beforeLabel}
                    </div>

                    {/* After Label */}
                    <div
                        style={{
                            ...labelBaseStyle,
                            top: "auto",
                            bottom: 16,
                            left: isHorizontal ? "auto" : 16,
                            right: isHorizontal ? 16 : "auto",
                            zIndex: 1,
                        }}
                    >
                        {afterLabel}
                    </div>
                </>
            )}

            {/* Divider */}
            <div style={dividerStyle} aria-hidden />

            {/* Handle */}
            {showHandle && (
                <div style={handleStyle} aria-hidden>
                    <svg
                        viewBox="0 0 24 24"
                        width={Math.max(14, Math.round(handleSize * 0.5))}
                        height={Math.max(14, Math.round(handleSize * 0.5))}
                        fill="none"
                        stroke={handleIconColor}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                            transform: isHorizontal ? "none" : "rotate(90deg)",
                            transition: "transform 0.15s ease",
                        }}
                    >
                        <path d="M8 7l-5 5 5 5" />
                        <path d="M16 7l5 5-5 5" />
                    </svg>
                </div>
            )}
        </div>
    )
}

addPropertyControls(SplitReveal, {
    beforeImage: {
        type: ControlType.ResponsiveImage,
        title: "Before",
    },
    afterImage: {
        type: ControlType.ResponsiveImage,
        title: "After",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
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
    fit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
    aspectRatio: {
        type: ControlType.Enum,
        title: "Aspect Ratio",
        options: ["auto", "16/9", "4/3", "1/1", "3/4", "9/16"],
        optionTitles: ["Auto", "16:9", "4:3", "1:1", "3:4", "9:16"],
        defaultValue: "auto",
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "16px",
    },
    showLabels: {
        type: ControlType.Boolean,
        title: "Labels",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    beforeLabel: {
        type: ControlType.String,
        title: "Top / Left",
        defaultValue: "BEFORE",
        hidden: ({ showLabels }) => !showLabels,
    },
    afterLabel: {
        type: ControlType.String,
        title: "Bottom / Right",
        defaultValue: "AFTER",
        hidden: ({ showLabels }) => !showLabels,
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: '"DM Mono", "Courier New", Courier, monospace',
        hidden: ({ showLabels }) => !showLabels,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 12,
        min: 8,
        max: 32,
        step: 1,
        unit: "px",
        hidden: ({ showLabels }) => !showLabels,
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Font Weight",
        defaultValue: 500,
        min: 100,
        max: 900,
        step: 100,
        hidden: ({ showLabels }) => !showLabels,
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Text",
        defaultValue: "#FFFFFF",
        hidden: ({ showLabels }) => !showLabels,
    },
    labelBgColor: {
        type: ControlType.Color,
        title: "Label Bg",
        defaultValue: "rgba(0, 0, 0, 0.5)",
        hidden: ({ showLabels }) => !showLabels,
    },
    dividerWidth: {
        type: ControlType.Number,
        title: "Divider",
        defaultValue: 2,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    dividerColor: {
        type: ControlType.Color,
        title: "Divider Color",
        defaultValue: "#FFFFFF",
    },
    dividerShadow: {
        type: ControlType.Boolean,
        title: "Divider Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showHandle: {
        type: ControlType.Boolean,
        title: "Handle",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    handleSize: {
        type: ControlType.Number,
        title: "Handle Size",
        defaultValue: 44,
        min: 20,
        max: 120,
        step: 1,
        unit: "px",
        hidden: ({ showHandle }) => !showHandle,
    },
    handleColor: {
        type: ControlType.Color,
        title: "Handle Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showHandle }) => !showHandle,
    },
    handleIconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#000000",
        hidden: ({ showHandle }) => !showHandle,
    },
})
