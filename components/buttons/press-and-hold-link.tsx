// Long press component with countdown animation at cursor position before triggering a link
import { useState, useRef, useEffect, useCallback, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence } from "framer-motion"

interface LongPressLinkProps {
    link: string
    duration: number
    ring: {
        countdownSize: number
        ringLineCap: "round" | "butt"
        countdownColor: string
        backgroundColor: string
        showCountdownNumber: boolean
        ringWidth: number
        numberColor: string
        font: CSSProperties
    }
    placement: {
        offsetX: number
        offsetY: number
    }
    tooltip: {
        showTooltip: boolean
        tooltipText: string
        tooltipColor: string
        tooltipBackground: string
        tooltipFont: CSSProperties
        tooltipPadding: string
        tooltipRadius: string
    }
    backdrop: {
        showBackdrop: boolean
        backdropColor: string
    }
    showPreview: boolean
    style?: CSSProperties
}

/**
 * Long Press Link Trigger
 * 
 * A component that triggers a link after holding down a keyboard key or long-pressing with mouse.
 * Shows a countdown animation at the cursor position.
 *
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 200
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function PressAndHold(props: LongPressLinkProps) {
    const {
        link = "https://framer.com",
        duration = 2,
        ring = {
            countdownColor: "#000000",
            countdownSize: 80,
            backgroundColor: "rgba(0, 0, 0, 0.1)",
            showCountdownNumber: true,
            ringLineCap: "round",
            ringWidth: 4,
            numberColor: "#000000",
            font: {
                variant: "Bold",
                fontSize: "32px",
                letterSpacing: "-0.01em",
                lineHeight: "1em",
            },
        },
        placement = {
            offsetX: 0,
            offsetY: 0,
        },
        tooltip = {
            showTooltip: true,
            tooltipText: "Click and hold",
            tooltipColor: "#FFFFFF",
            tooltipBackground: "rgba(0, 0, 0, 0.8)",
            tooltipFont: {
                variant: "Medium",
                fontSize: "14px",
                letterSpacing: "-0.01em",
                lineHeight: "1em",
            },
            tooltipPadding: "6px 12px 6px 12px",
            tooltipRadius: "6px",
        },
        backdrop = {
            showBackdrop: true,
            backdropColor: "rgba(0, 0, 0, 0.2)",
        },
        showPreview = true,
    } = props

    const { countdownColor, countdownSize, backgroundColor, showCountdownNumber, ringLineCap, ringWidth, numberColor, font } = ring
    const { offsetX, offsetY } = placement
    const { showTooltip, tooltipText, tooltipColor, tooltipBackground, tooltipFont, tooltipPadding, tooltipRadius } = tooltip
    const { showBackdrop, backdropColor } = backdrop

    const [isPressed, setIsPressed] = useState(false)
    const [progress, setProgress] = useState(0)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isHovering, setIsHovering] = useState(false)
    const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
    const containerRef = useRef<HTMLDivElement>(null)
    const startTimeRef = useRef<number>(0)
    const animationFrameRef = useRef<number>(0)

    const startPress = useCallback((clientX: number, clientY: number) => {
        if (!containerRef.current) return
        
        const rect = containerRef.current.getBoundingClientRect()
        startTransition(() => {
            setPosition({ x: clientX - rect.left, y: clientY - rect.top })
            setIsPressed(true)
            setProgress(0)
        })
        startTimeRef.current = Date.now()
    }, [])

    const endPress = useCallback(() => {
        startTransition(() => {
            setIsPressed(false)
            setProgress(0)
        })
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
        }
    }, [])

    const updateProgress = useCallback(() => {
        if (!isPressed) return

        const elapsed = Date.now() - startTimeRef.current
        const newProgress = Math.min(elapsed / (duration * 1000), 1)
        
        startTransition(() => setProgress(newProgress))

        if (newProgress >= 1) {
            endPress()
            if (typeof window !== "undefined" && link) {
                window.open(link, "_blank")
            }
        } else {
            animationFrameRef.current = requestAnimationFrame(updateProgress)
        }
    }, [isPressed, duration, link, endPress])

    useEffect(() => {
        if (isPressed) {
            animationFrameRef.current = requestAnimationFrame(updateProgress)
        }
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [isPressed, updateProgress])

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        startPress(e.clientX, e.clientY)
        startTransition(() => setIsHovering(false))
    }

    const handleMouseUp = () => {
        endPress()
    }

    const handleMouseLeave = () => {
        endPress()
        startTransition(() => setIsHovering(false))
    }

    const handleMouseEnter = () => {
        startTransition(() => setIsHovering(true))
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current || !showTooltip) return
        const rect = containerRef.current.getBoundingClientRect()
        startTransition(() => {
            setHoverPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        })
    }

    // Re-enable hovering when showTooltip becomes true
    useEffect(() => {
        if (showTooltip && !isPressed && containerRef.current) {
            // Check if mouse is still over the component
            const checkHover = (e: MouseEvent) => {
                if (!containerRef.current) return
                const rect = containerRef.current.getBoundingClientRect()
                const isOver = e.clientX >= rect.left && e.clientX <= rect.right && 
                              e.clientY >= rect.top && e.clientY <= rect.bottom
                if (isOver) {
                    startTransition(() => setIsHovering(true))
                }
            }
            
            if (typeof window !== "undefined") {
                window.addEventListener("mousemove", checkHover, { once: true })
                return () => window.removeEventListener("mousemove", checkHover)
            }
        }
    }, [showTooltip, isPressed])

    const remainingTime = Math.ceil(duration * (1 - progress))
    const circumference = 2 * Math.PI * (countdownSize / 2 - ringWidth / 2)
    const strokeDashoffset = circumference * (1 - progress)

    // Check if we're in Framer canvas (not preview or export)
    const isFramerCanvas = RenderTarget.current() === RenderTarget.canvas

    // Static preview for Framer canvas
    if (isFramerCanvas && showPreview) {
        return (
            <div
                style={{
                    ...props.style,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 30,
                    backgroundColor: "#f5f5f5",
                    padding: 20,
                }}
            >
                <div
                    style={{
                        fontSize: 12,
                        color: "#999",
                        fontWeight: 500,
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                    }}
                >
                    Static Preview
                </div>
                
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 40,
                        flexWrap: "wrap",
                    }}
                >
                    {/* Tooltip Preview */}
                    {showTooltip && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 11,
                                    color: "#666",
                                    fontWeight: 500,
                                }}
                            >
                                Tooltip
                            </div>
                            <div
                                style={{
                                    backgroundColor: tooltipBackground,
                                    color: tooltipColor,
                                    padding: tooltipPadding,
                                    borderRadius: tooltipRadius,
                                    whiteSpace: "nowrap",
                                    ...tooltipFont,
                                }}
                            >
                                {tooltipText}
                            </div>
                        </div>
                    )}

                    {/* Ring Preview */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 11,
                                color: "#666",
                                fontWeight: 500,
                            }}
                        >
                            Ring
                        </div>
                        <div
                            style={{
                                position: "relative",
                                width: countdownSize,
                                height: countdownSize,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: "50%",
                                    backgroundColor: backgroundColor,
                                }}
                            />
                            <svg
                                width={countdownSize}
                                height={countdownSize}
                                style={{
                                    position: "absolute",
                                    transform: "rotate(-90deg)",
                                }}
                            >
                                <circle
                                    cx={countdownSize / 2}
                                    cy={countdownSize / 2}
                                    r={countdownSize / 2 - ringWidth / 2}
                                    fill="none"
                                    stroke={countdownColor}
                                    strokeWidth={ringWidth}
                                    strokeDasharray={circumference}
                                    strokeDashoffset={circumference * 0.25}
                                    strokeLinecap={ringLineCap}
                                />
                            </svg>
                            {showCountdownNumber && (
                                <span
                                    style={{
                                        position: "relative",
                                        color: numberColor,
                                        fontSize: countdownSize * 0.4,
                                        fontWeight: 700,
                                        ...font,
                                    }}
                                >
                                    {duration}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Normal interactive functionality for live page
    return (
        <div
            ref={containerRef}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                cursor: "pointer",
                userSelect: "none",
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
        >
            <AnimatePresence>
                {isPressed && showBackdrop && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            backgroundColor: backdropColor,
                            pointerEvents: "none",
                            zIndex: 998,
                        }}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isPressed && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: "absolute",
                            left: position.x + offsetX - countdownSize / 2,
                            top: position.y + offsetY - countdownSize / 2,
                            pointerEvents: "none",
                            zIndex: 1000,
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                width: countdownSize,
                                height: countdownSize,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: "50%",
                                    backgroundColor: backgroundColor,
                                }}
                            />
                            <svg
                                width={countdownSize}
                                height={countdownSize}
                                style={{
                                    position: "absolute",
                                    transform: "rotate(-90deg)",
                                }}
                            >
                                <circle
                                    cx={countdownSize / 2}
                                    cy={countdownSize / 2}
                                    r={countdownSize / 2 - ringWidth / 2}
                                    fill="none"
                                    stroke={countdownColor}
                                    strokeWidth={ringWidth}
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap={ringLineCap}
                                    style={{
                                        transition: "stroke-dashoffset 0.05s linear",
                                    }}
                                />
                            </svg>
                            {showCountdownNumber && (
                                <span
                                    style={{
                                        position: "relative",
                                        color: numberColor,
                                        fontSize: countdownSize * 0.4,
                                        fontWeight: 700,
                                        ...font,
                                    }}
                                >
                                    {remainingTime}
                                </span>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isHovering && !isPressed && showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: "absolute",
                            left: hoverPosition.x,
                            top: hoverPosition.y - 40,
                            transform: "translateX(-50%)",
                            pointerEvents: "none",
                            zIndex: 999,
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: tooltipBackground,
                                color: tooltipColor,
                                padding: tooltipPadding,
                                borderRadius: tooltipRadius,
                                whiteSpace: "nowrap",
                                ...tooltipFont,
                            }}
                        >
                            {tooltipText}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(PressAndHold, {
    showPreview: {
        type: ControlType.Boolean,
        title: "Canvas Preview",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
        defaultValue: "https://framer.com",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 2,
        min: 0.5,
        max: 10,
        step: 0.5,
        unit: "s",
    },
    ring: {
        type: ControlType.Object,
        title: "Ring",
        controls: {
            countdownSize: {
                type: ControlType.Number,
                title: "Ring Size",
                defaultValue: 80,
                min: 40,
                max: 200,
                unit: "px",
            },
            ringWidth: {
                type: ControlType.Number,
                title: "Ring Width",
                defaultValue: 4,
                min: 1,
                max: 20,
                step: 1,
                unit: "px",
            },
            ringLineCap: {
                type: ControlType.Enum,
                title: "Ring Line Cap",
                options: ["round", "butt"],
                optionTitles: ["Round", "Flat"],
                defaultValue: "round",
                displaySegmentedControl: true,
            },
            countdownColor: {
                type: ControlType.Color,
                title: "Ring Color",
                defaultValue: "#000000",
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(0, 0, 0, 0.1)",
            },
            showCountdownNumber: {
                type: ControlType.Boolean,
                title: "Show Number",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            numberColor: {
                type: ControlType.Color,
                title: "Number Color",
                defaultValue: "#000000",
            },
            font: {
                type: ControlType.Font,
                title: "Number Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    variant: "Bold",
                    fontSize: "32px",
                    letterSpacing: "-0.01em",
                    lineHeight: "1em",
                },
            },
        },
    },
    placement: {
        type: ControlType.Object,
        title: "Placement",
        controls: {
            offsetX: {
                type: ControlType.Number,
                title: "Offset X",
                defaultValue: 0,
                min: -100,
                max: 100,
                step: 1,
                unit: "px",
            },
            offsetY: {
                type: ControlType.Number,
                title: "Offset Y",
                defaultValue: 0,
                min: -100,
                max: 100,
                step: 1,
                unit: "px",
            },
        },
    },
    backdrop: {
        type: ControlType.Object,
        title: "Backdrop",
        controls: {
            showBackdrop: {
                type: ControlType.Boolean,
                title: "Show Backdrop",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            backdropColor: {
                type: ControlType.Color,
                title: "Backdrop Color",
                defaultValue: "rgba(0, 0, 0, 0.2)",
            },
        },
    },
    tooltip: {
        type: ControlType.Object,
        title: "Tooltip",
        description: "Explore [more components](https://dub.sh/Explore-more).\n\nMade by [Till Janek](https://dub.sh/made-by-tilljanek).",
        controls: {
            showTooltip: {
                type: ControlType.Boolean,
                title: "Show Tooltip",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            tooltipText: {
                type: ControlType.String,
                title: "Tooltip Text",
                defaultValue: "Click and hold",
            },
            tooltipColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#FFFFFF",
            },
            tooltipBackground: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(0, 0, 0, 0.8)",
            },
            tooltipFont: {
                type: ControlType.Font,
                title: "Tooltip Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    variant: "Medium",
                    fontSize: "14px",
                    letterSpacing: "-0.01em",
                    lineHeight: "1em",
                },
            },
            tooltipPadding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "6px 12px 6px 12px",
            },
            tooltipRadius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "6px",
            },
        },
    },
})

PressAndHold.displayName = "Press and Hold Link"