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
    useRef,
    useState,
    startTransition,
    type CSSProperties,
} from "react"
import { motion, useInView, useMotionValue, useTransform } from "framer-motion"

interface Image {
    src: string
    alt: string
}

interface BeforeAfterCompareProps {
    beforeImage: Image
    afterImage: Image
    initialPosition: number
    sliderColor: string
    sliderWidth: number
    handleColor: string
    handleSize: number
    showLabels: boolean
    label: {
        position: "top" | "bottom"
        beforeText: string
        beforeX: number
        beforeY: number
        afterText: string
        afterX: number
        afterY: number
        borderRadius?: number
    }
    labelColor: string
    labelBackgroundColor: string
    labelFont: CSSProperties
    interactionMode: "drag" | "hover"
    showPulse: boolean
    useCustomArrow: boolean
    arrowIcon?: string
    borderRadius?: string
    shadow?: string
}

/**
 * Before/After Image Comparison
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function BeforeAfterCompare(props: BeforeAfterCompareProps) {
    const {
        beforeImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Before image",
        },
        afterImage = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "After image",
        },
        initialPosition = 50,
        sliderColor = "#FFFFFF",
        sliderWidth = 3,
        handleColor = "#FFFFFF",
        handleSize = 48,
        showLabels = true,
        label = {
            position: "top",
            beforeText: "Before",
            beforeX: 20,
            beforeY: 20,
            afterText: "After",
            afterX: 20,
            afterY: 20,
            borderRadius: 4,
        },
        labelColor = "#FFFFFF",
        labelBackgroundColor = "rgba(0, 0, 0, 0.5)",
        labelFont = {
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        interactionMode = "drag",
        showPulse = true,
        useCustomArrow = false,
        arrowIcon = "",
        borderRadius = "0px",
        shadow = "0px 4px 10px rgba(0, 0, 0, 0.1)",
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const sliderPosition = useMotionValue(initialPosition)
    const [isDragging, setIsDragging] = useState(false)
    const [hasInteracted, setHasInteracted] = useState(false)
    const isStatic = useIsStaticRenderer()
    const isInView = useInView(containerRef, { once: true })
    const [currentPosition, setCurrentPosition] = useState(initialPosition)
    const [isTouchDevice, setIsTouchDevice] = useState(false)

    // Detect touch device on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
            setIsTouchDevice(hasTouch)
        }
    }, [])

    // Sync sliderPosition with initialPosition prop
    useEffect(() => {
        sliderPosition.set(initialPosition)
    }, [initialPosition, sliderPosition])

    // Sync currentPosition with sliderPosition for ARIA
    useEffect(() => {
        const unsubscribe = sliderPosition.on("change", (latest) => {
            startTransition(() => {
                setCurrentPosition(Math.round(latest))
            })
        })
        return () => unsubscribe()
    }, [sliderPosition])

    const updatePositionFromEvent = useCallback(
        (e) => {
            if (!containerRef.current) return

            const rect = containerRef.current.getBoundingClientRect()
            const x = e.clientX - rect.left
            const newPosition = Math.max(
                0,
                Math.min(100, (x / rect.width) * 100)
            )
            sliderPosition.set(newPosition)
        },
        [sliderPosition]
    )

    const handleMouseDown = useCallback(
        (e) => {
            if (interactionMode === "drag") {
                e.preventDefault()
                setIsDragging(true)
                setHasInteracted(true)
            }
        },
        [interactionMode]
    )

    const handleMouseMove = useCallback(
        (e) => {
            if (!containerRef.current) return

            // Force drag mode on touch devices
            const effectiveMode = isTouchDevice ? "drag" : interactionMode

            if (effectiveMode === "hover") {
                updatePositionFromEvent(e)
                if (!hasInteracted) {
                    setHasInteracted(true)
                }
            } else if (isDragging) {
                updatePositionFromEvent(e)
            }
        },
        [interactionMode, isDragging, updatePositionFromEvent, hasInteracted, isTouchDevice]
    )

    const handleMouseUp = useCallback(() => {
        if (interactionMode === "drag") {
            setIsDragging(false)
        }
    }, [interactionMode])

    const handleTouchStart = useCallback(
        (e) => {
            if (interactionMode === "drag") {
                setIsDragging(true)
                setHasInteracted(true)
            }
        },
        [interactionMode]
    )

    const handleTouchMove = useCallback(
        (e) => {
            if (!containerRef.current) return

            const touch = e.touches[0]
            const rect = containerRef.current.getBoundingClientRect()
            const x = touch.clientX - rect.left
            const newPosition = Math.max(
                0,
                Math.min(100, (x / rect.width) * 100)
            )

            if (interactionMode === "hover" || isDragging) {
                sliderPosition.set(newPosition)
                if (!hasInteracted) {
                    setHasInteracted(true)
                }
            }
        },
        [interactionMode, isDragging, hasInteracted, sliderPosition]
    )

    const handleTouchEnd = useCallback(() => {
        if (interactionMode === "drag") {
            setIsDragging(false)
        }
    }, [interactionMode])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            const currentPosition = sliderPosition.get()
            let newPosition = currentPosition

            switch (e.key) {
                case "ArrowLeft":
                    newPosition = Math.max(0, currentPosition - 1)
                    break
                case "ArrowRight":
                    newPosition = Math.min(100, currentPosition + 1)
                    break
                case "Home":
                    newPosition = 0
                    break
                case "End":
                    newPosition = 100
                    break
                default:
                    return
            }

            e.preventDefault()
            sliderPosition.set(newPosition)
            if (!hasInteracted) {
                setHasInteracted(true)
            }
        },
        [sliderPosition, hasInteracted]
    )

    useEffect(() => {
        if (isStatic) return

        const handleGlobalMouseMove = (e) => handleMouseMove(e)
        const handleGlobalMouseUp = () => handleMouseUp()
        const handleGlobalTouchMove = (e) => handleTouchMove(e)
        const handleGlobalTouchEnd = () => handleTouchEnd()

        if (isDragging) {
            window.addEventListener("mousemove", handleGlobalMouseMove)
            window.addEventListener("mouseup", handleGlobalMouseUp)
            window.addEventListener("touchmove", handleGlobalTouchMove)
            window.addEventListener("touchend", handleGlobalTouchEnd)
        }

        return () => {
            window.removeEventListener("mousemove", handleGlobalMouseMove)
            window.removeEventListener("mouseup", handleGlobalMouseUp)
            window.removeEventListener("touchmove", handleGlobalTouchMove)
            window.removeEventListener("touchend", handleGlobalTouchEnd)
        }
    }, [
        isDragging,
        handleMouseMove,
        handleMouseUp,
        handleTouchMove,
        handleTouchEnd,
        isStatic,
    ])

    const getBeforeLabelStyle = (): CSSProperties => {
        return {
            position: "absolute",
            padding: "8px 16px",
            backgroundColor: labelBackgroundColor,
            color: labelColor,
            pointerEvents: "none",
            zIndex: 10,
            borderRadius: label.borderRadius ? `${label.borderRadius}px` : "4px",
            ...labelFont,
            ...(label.position === "top"
                ? { top: label.beforeY }
                : { bottom: label.beforeY }),
            left: label.beforeX,
        }
    }

    const getAfterLabelStyle = (): CSSProperties => {
        return {
            position: "absolute",
            padding: "8px 16px",
            backgroundColor: labelBackgroundColor,
            color: labelColor,
            pointerEvents: "none",
            zIndex: 10,
            borderRadius: label.borderRadius ? `${label.borderRadius}px` : "4px",
            ...labelFont,
            ...(label.position === "top"
                ? { top: label.afterY }
                : { bottom: label.afterY }),
            right: label.afterX,
        }
    }

    const shouldShowPulse = showPulse && !hasInteracted && isInView && !isStatic

    const renderArrows = () => {
        if (useCustomArrow && arrowIcon && arrowIcon.trim() !== "") {
            return (
                <img
                    src={arrowIcon}
                    alt="Handle icon"
                    style={{
                        width: handleSize * 0.6,
                        height: handleSize * 0.6,
                        objectFit: "contain",
                    }}
                />
            )
        }

        return (
            <svg
                viewBox="0 0 32 24"
                width={handleSize * 0.5}
                height={handleSize * 0.5}
                fill="none"
                stroke="rgba(0, 0, 0, 0.8)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-label="Drag handle"
            >
                <title>Drag to compare</title>
                <polyline points="11,6 6,12 11,18" />
                <polyline points="21,6 26,12 21,18" />
            </svg>
        )
    }

    const clipPath = useTransform(
        sliderPosition,
        (pos) => `inset(0 ${100 - pos}% 0 0)`
    )
    const sliderLeft = useTransform(sliderPosition, (pos) => `${pos}%`)
    const handleLeft = useTransform(sliderPosition, (pos) => `${pos}%`)

    // Extract borderRadius value
    const radiusValue = borderRadius || "0px"
    const shadowValue = shadow || "0px 4px 10px rgba(0, 0, 0, 0.1)"
    
    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                boxShadow: shadowValue,
                borderRadius: radiusValue,
                overflow: "visible",
            }}
            tabIndex={0}
            onKeyDown={isStatic ? undefined : handleKeyDown}
            role="slider"
            aria-valuenow={currentPosition}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Image comparison slider"
        >
            <style>{`
                div[role="slider"] {
                    outline: none;
                }
                div[role="slider"]:focus-visible {
                    outline: 3px solid rgba(0, 123, 255, 0.5) !important;
                    outline-offset: 2px !important;
                }
            `}</style>
            <div
                ref={containerRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    borderRadius: radiusValue,
                    cursor: isDragging
                        ? "ew-resize"
                        : (isTouchDevice ? "drag" : interactionMode) === "hover"
                          ? "pointer"
                          : "grab",
                    userSelect: "none",
                    touchAction: "none",
                    backgroundColor: "transparent",
                }}
                onMouseMove={isStatic ? undefined : handleMouseMove}
                onMouseDown={isStatic ? undefined : handleMouseDown}
                onMouseUp={isStatic ? undefined : handleMouseUp}
                onTouchStart={isStatic ? undefined : handleTouchStart}
                onTouchMove={isStatic ? undefined : handleTouchMove}
                onTouchEnd={isStatic ? undefined : handleTouchEnd}
            >
                {/* After Image (Full) */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundImage: `url(${afterImage.src})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                    aria-label={afterImage.alt}
                    role="img"
                />

                {/* Before Image (Clipped) */}
                <motion.div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundImage: `url(${beforeImage.src})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        clipPath: clipPath,
                    }}
                    aria-label={beforeImage.alt}
                    role="img"
                />

                {/* Labels */}
                {showLabels && (
                    <>
                        <div style={getBeforeLabelStyle()}>{label.beforeText}</div>
                        <div style={getAfterLabelStyle()}>{label.afterText}</div>
                    </>
                )}

                {/* Slider Line */}
                <motion.div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: sliderLeft,
                        width: `${sliderWidth}px`,
                        height: "100%",
                        backgroundColor: sliderColor,
                        zIndex: 20,
                        pointerEvents: "none",
                        x: "-50%",
                    }}
                />

                {/* Handle */}
                <motion.div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: handleLeft,
                        width: `${handleSize}px`,
                        height: `${handleSize}px`,
                        backgroundColor: handleColor,
                        borderRadius: "50%",
                        cursor: isDragging ? "ew-resize" : "grab",
                        zIndex: 30,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        x: "-50%",
                        y: "-50%",
                    }}
                    animate={
                        shouldShowPulse
                            ? {
                                  x: "-50%",
                                  y: "-50%",
                                  scale: [1, 1.15, 1],
                                  boxShadow: [
                                      "0 2px 12px rgba(0, 0, 0, 0.3)",
                                      "0 4px 20px rgba(255, 255, 255, 0.6)",
                                      "0 2px 12px rgba(0, 0, 0, 0.3)",
                                  ],
                              }
                            : {
                                  x: "-50%",
                                  y: "-50%",
                              }
                    }
                    transition={
                        shouldShowPulse
                            ? {
                                  duration: 2,
                                  repeat: Number.POSITIVE_INFINITY,
                                  ease: "easeInOut",
                              }
                            : {}
                    }
                    onMouseDown={isStatic ? undefined : handleMouseDown}
                    onTouchStart={isStatic ? undefined : handleTouchStart}
                >
                    {renderArrows()}
                </motion.div>
            </div>
        </div>
    )
}

addPropertyControls(BeforeAfterCompare, {
    beforeImage: {
        type: ControlType.ResponsiveImage,
        title: "Before Image",
    },
    afterImage: {
        type: ControlType.ResponsiveImage,
        title: "After Image",
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
    },
    shadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
    },
    initialPosition: {
        type: ControlType.Number,
        title: "Initial Position",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    interactionMode: {
        type: ControlType.Enum,
        title: "Interaction Mode",
        options: ["drag", "hover"],
        optionTitles: ["Click & Drag", "Hover"],
        defaultValue: "drag",
        displaySegmentedControl: true,
    },
    sliderColor: {
        type: ControlType.Color,
        title: "Slider Color",
        defaultValue: "#FFFFFF",
    },
    sliderWidth: {
        type: ControlType.Number,
        title: "Slider Width",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 1,
        unit: "px",
    },
    handleColor: {
        type: ControlType.Color,
        title: "Handle Color",
        defaultValue: "#FFFFFF",
    },
    handleSize: {
        type: ControlType.Number,
        title: "Handle Size",
        defaultValue: 48,
        min: 32,
        max: 80,
        step: 4,
        unit: "px",
    },
    useCustomArrow: {
        type: ControlType.Boolean,
        title: "Arrow Icon",
        defaultValue: false,
        enabledTitle: "Custom",
        disabledTitle: "Default",
    },
    arrowIcon: {
        type: ControlType.File,
        title: "Custom Icon",
        allowedFileTypes: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
        hidden: ({ useCustomArrow }) => !useCustomArrow,
    },
    showLabels: {
        type: ControlType.Boolean,
        title: "Show Labels",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    label: {
        type: ControlType.Object,
        title: "Label",
        controls: {
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: ["top", "bottom"],
                optionTitles: ["Top", "Bottom"],
                defaultValue: "top",
                displaySegmentedControl: true,
            },
            beforeText: {
                type: ControlType.String,
                title: "Before",
                defaultValue: "Before",
            },
            beforeX: {
                type: ControlType.Number,
                title: "X",
                defaultValue: 20,
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
            beforeY: {
                type: ControlType.Number,
                title: "Y",
                defaultValue: 20,
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
            afterText: {
                type: ControlType.String,
                title: "After",
                defaultValue: "After",
            },
            afterX: {
                type: ControlType.Number,
                title: "X",
                defaultValue: 20,
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
            afterY: {
                type: ControlType.Number,
                title: "Y",
                defaultValue: 20,
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 4,
                min: 0,
                max: 20,
                step: 1,
                unit: "px",
            },
        },
        hidden: ({ showLabels }) => !showLabels,
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Text Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showLabels }) => !showLabels,
    },
    labelBackgroundColor: {
        type: ControlType.Color,
        title: "Label Background",
        defaultValue: "rgba(0, 0, 0, 0.5)",
        hidden: ({ showLabels }) => !showLabels,
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        hidden: ({ showLabels }) => !showLabels,
    },
    showPulse: {
        type: ControlType.Boolean,
        title: "Pulse Animation",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
