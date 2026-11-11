// User instructions: Create a Framer component with a slider and 2 images; sliding reveals the image underneath. Simple, customizable before/after image slider for transformations/comparisons with custom images, handle size/color, divider width, border radius, image fit options, responsive layout, clean/lightweight.

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
} from "react"

type FitMode = "cover" | "contain"

type ResponsiveImageLike = {
    src: string
    srcSet?: string
    alt?: string
}

interface SplitRevealProps {
    beforeImage: ResponsiveImageLike
    afterImage: ResponsiveImageLike
    initialPosition: number
    fit: FitMode

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
 * Reveal Slider
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SplitReveal(props: SplitRevealProps) {
    const {
        beforeImage = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Before image",
        },
        afterImage = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "After image",
        },
        initialPosition = 50,
        fit = "cover",
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialPosition])

    const objectFit = fit

    const clampPercent = useCallback((v: number) => {
        if (!Number.isFinite(v)) return 0
        return Math.max(0, Math.min(100, v))
    }, [])

    const computePositionFromClientX = useCallback(
        (clientX: number) => {
            const el = containerRef.current
            if (!el) return position
            const rect = el.getBoundingClientRect()
            if (!rect.width) return position
            const x = clientX - rect.left
            const p = (x / rect.width) * 100
            return clampPercent(p)
        },
        [clampPercent, position]
    )

    const setPositionFromClientX = useCallback(
        (clientX: number) => {
            const p = computePositionFromClientX(clientX)
            startTransition(() => setPosition(p))
        },
        [computePositionFromClientX]
    )

    const onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (isStatic) return
            e.preventDefault()
            draggingRef.current = true
            pointerIdRef.current = e.pointerId
            try {
                e.currentTarget.setPointerCapture(e.pointerId)
            } catch (err) {
                // Ignore capture errors
            }
            setPositionFromClientX(e.clientX)
        },
        [isStatic, setPositionFromClientX]
    )

    const onPointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (isStatic) return
            if (!draggingRef.current) return
            if (
                pointerIdRef.current !== null &&
                e.pointerId !== pointerIdRef.current
            )
                return
            setPositionFromClientX(e.clientX)
        },
        [isStatic, setPositionFromClientX]
    )

    const endDrag = useCallback(() => {
        if (!draggingRef.current) return
        draggingRef.current = false
        pointerIdRef.current = null
    }, [])

    const onPointerUp = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (isStatic) return
            if (
                pointerIdRef.current !== null &&
                e.pointerId !== pointerIdRef.current
            )
                return
            endDrag()
        },
        [endDrag, isStatic]
    )

    const onPointerCancel = useCallback(() => {
        if (isStatic) return
        endDrag()
    }, [endDrag, isStatic])

    const clippedBeforeStyle = useMemo<CSSProperties>(() => {
        return {
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            clipPath: `inset(0 ${100 - position}% 0 0)`,
        }
    }, [position])

    const dividerStyle = useMemo<CSSProperties>(() => {
        const half = dividerWidth / 2
        return {
            position: "absolute",
            top: 0,
            left: `${position}%`,
            width: `${dividerWidth}px`,
            height: "100%",
            backgroundColor: dividerColor,
            transform: `translateX(-${half}px)`,
            boxShadow: dividerShadow ? "0 4px 12px rgba(0,0,0,0.25)" : "none",
            zIndex: 3,
            pointerEvents: "none",
        }
    }, [dividerColor, dividerShadow, dividerWidth, position])

    const handleStyle = useMemo<CSSProperties>(() => {
        const half = handleSize / 2
        return {
            position: "absolute",
            top: "50%",
            left: `${position}%`,
            width: `${handleSize}px`,
            height: `${handleSize}px`,
            transform: `translate(-${half}px, -${half}px)`,
            borderRadius: 999,
            backgroundColor: handleColor,
            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
            zIndex: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
        }
    }, [handleColor, handleSize, position])

    const containerCursor = useMemo(() => {
        if (isStatic) return "default"
        return draggingRef.current ? "ew-resize" : "ew-resize"
    }, [isStatic])

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius,
                touchAction: isStatic ? "auto" : "none",
                userSelect: "none",
                cursor: containerCursor,
                background: "#000",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            role="slider"
            aria-label="Before and after image slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(position)}
            tabIndex={0}
            onKeyDown={(e) => {
                if (isStatic) return
                const step = e.shiftKey ? 10 : 2
                if (e.key === "ArrowLeft") {
                    e.preventDefault()
                    startTransition(() =>
                        setPosition((p) => clampPercent(p - step))
                    )
                }
                if (e.key === "ArrowRight") {
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
            {/* After (underneath) */}
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
                    objectPosition: "center",
                }}
            />

            {/* Before (revealed) */}
            <div style={clippedBeforeStyle} aria-hidden>
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
                        objectPosition: "center",
                    }}
                />
            </div>

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
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        focusable="false"
                        aria-hidden
                    >
                        <path d="M8 7l-4 5 4 5" />
                        <path d="M16 7l4 5-4 5" />
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
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "16px",
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
