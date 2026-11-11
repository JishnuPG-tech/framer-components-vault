// Made with 💛 by Karim Saif (https://x.com/karimsaif0)
// --- Component ---

import * as React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { motion, PanInfo } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function VerticalImageStack(props) {
    const {
        images = [],
        cardWidth = 280,
        cardHeight = 420,
        borderRadius = 24,
        cooldown = 400,
        showDots = true,
        showCounter = true,
        showHints = true,
        showHintArrows = true,
        showHintText = true,
        hintText = "Scroll or drag",
        backgroundColor = "#000000",
        textColor = "#ffffff",
        ariaLabel = "Vertical image stack visualization",
    } = props

    const isStatic = useIsStaticRenderer()
    const [currentIndex, setCurrentIndex] = useState(0)
    const lastNavigationTime = useRef(0)
    const containerRef = useRef<HTMLDivElement>(null)

    const list = images || []

    // Index Boundary Guard (Syncs index when array controls are modified live)
    useEffect(() => {
        if (list.length === 0) {
            setCurrentIndex(0)
        } else if (currentIndex >= list.length) {
            setCurrentIndex(list.length - 1)
        }
    }, [currentIndex, list.length])

    // Unified Navigation Dispatcher
    const navigate = useCallback(
        (target: number | "next" | "prev") => {
            if (isStatic || list.length === 0) return

            const now = Date.now()
            if (now - lastNavigationTime.current < cooldown) return
            lastNavigationTime.current = now

            setCurrentIndex((prev) => {
                const total = list.length
                if (typeof target === "number") {
                    return Math.max(0, Math.min(target, total - 1))
                }
                if (target === "next") {
                    return prev === total - 1 ? 0 : prev + 1
                }
                return prev === 0 ? total - 1 : prev - 1
            })
        },
        [cooldown, list.length, isStatic]
    )

    // Strict Drag Types
    const handleDragEnd = (
        _: MouseEvent | TouchEvent | PointerEvent,
        info: PanInfo
    ) => {
        const threshold = 50
        if (info.offset.y < -threshold) {
            navigate("next")
        } else if (info.offset.y > threshold) {
            navigate("prev")
        }
    }

    // Local Container Wheel Listener
    const handleWheel = useCallback(
        (e: WheelEvent) => {
            if (Math.abs(e.deltaY) > 30) {
                if (e.deltaY > 0) {
                    navigate("next")
                } else {
                    navigate("prev")
                }
            }
        },
        [navigate]
    )

    useEffect(() => {
        const element = containerRef.current
        if (!element || isStatic) return

        element.addEventListener("wheel", handleWheel, { passive: true })
        return () => element.removeEventListener("wheel", handleWheel)
    }, [handleWheel, isStatic])

    // Keyboard Navigation Handler
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
            e.preventDefault()
            navigate("next")
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
            e.preventDefault()
            navigate("prev")
        }
    }

    const getCardStyle = (index: number) => {
        const total = list.length
        let diff = index - currentIndex
        if (diff > total / 2) diff -= total
        if (diff < -total / 2) diff += total

        if (diff === 0) {
            return { y: 0, scale: 1, opacity: 1, zIndex: 5, rotateX: 0 }
        } else if (diff === -1) {
            return { y: -160, scale: 0.82, opacity: 0.6, zIndex: 4, rotateX: 8 }
        } else if (diff === -2) {
            return { y: -280, scale: 0.7, opacity: 0.3, zIndex: 3, rotateX: 15 }
        } else if (diff === 1) {
            return { y: 160, scale: 0.82, opacity: 0.6, zIndex: 4, rotateX: -8 }
        } else if (diff === 2) {
            return { y: 280, scale: 0.7, opacity: 0.3, zIndex: 3, rotateX: -15 }
        } else {
            return {
                y: diff > 0 ? 400 : -400,
                scale: 0.6,
                opacity: 0,
                zIndex: 0,
                rotateX: diff > 0 ? -20 : 20,
            }
        }
    }

    const isVisible = (index: number) => {
        const total = list.length
        let diff = index - currentIndex
        if (diff > total / 2) diff -= total
        if (diff < -total / 2) diff += total
        return Math.abs(diff) <= 2
    }

    return (
        <section
            ref={containerRef}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label={ariaLabel}
            onKeyDown={handleKeyDown}
            style={{
                position: "relative",
                display: "flex",
                height: "100%",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                backgroundColor: backgroundColor,
                color: textColor,
                userSelect: "none",
            }}
        >
            {/* Ambient Glow */}
            <div
                style={{
                    pointerEvents: "none",
                    position: "absolute",
                    inset: 0,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        height: "80%",
                        width: "80%",
                        maxWidth: 600,
                        maxHeight: 600,
                        transform: "translate(-50%, -50%)",
                        borderRadius: "50%",
                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                        filter: "blur(64px)",
                    }}
                />
            </div>

            {/* Responsive Card Stack Container */}
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    height: "100%",
                    maxHeight: cardHeight + 100,
                    width: "100%",
                    maxWidth: cardWidth + 40,
                    alignItems: "center",
                    justifyContent: "center",
                    perspective: 1200,
                }}
            >
                {list.map((image, index) => {
                    if (!isVisible(index)) return null
                    const style = getCardStyle(index)
                    const isCurrent = index === currentIndex

                    return (
                        <motion.div
                            key={image.id || index}
                            style={{
                                position: "absolute",
                                cursor:
                                    isCurrent && !isStatic ? "grab" : "default",
                                transformStyle: "preserve-3d",
                                zIndex: style.zIndex,
                            }}
                            animate={{
                                y: style.y,
                                scale: style.scale,
                                opacity: style.opacity,
                                rotateX: style.rotateX,
                                zIndex: style.zIndex,
                            }}
                            transition={
                                isStatic
                                    ? { duration: 0 }
                                    : {
                                          type: "spring",
                                          stiffness: 300,
                                          damping: 30,
                                          mass: 1,
                                      }
                            }
                            drag={isCurrent && !isStatic ? "y" : false}
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={0.2}
                            onDragEnd={handleDragEnd}
                        >
                            <div
                                style={{
                                    position: "relative",
                                    height: cardHeight,
                                    width: cardWidth,
                                    maxWidth: "90vw",
                                    maxHeight: "65vh",
                                    overflow: "hidden",
                                    borderRadius: borderRadius,
                                    backgroundColor:
                                        "rgba(255, 255, 255, 0.05)",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                    boxShadow: isCurrent
                                        ? "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)"
                                        : "0 10px 30px -10px rgba(0, 0, 0, 0.3)",
                                }}
                            >
                                {/* Inner Glow */}
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        borderRadius: borderRadius,
                                        background:
                                            "linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)",
                                        pointerEvents: "none",
                                        zIndex: 2,
                                    }}
                                />

                                {image.src && (
                                    <img
                                        src={image.src}
                                        alt={image.alt || ""}
                                        draggable={false}
                                        style={{
                                            objectFit: "cover",
                                            width: "100%",
                                            height: "100%",
                                            display: "block",
                                        }}
                                    />
                                )}

                                {/* Bottom Gradient Overlay */}
                                <div
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        height: 128,
                                        background:
                                            "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
                                        pointerEvents: "none",
                                    }}
                                />
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Navigation Dots */}
            {showDots && list.length > 0 && (
                <div
                    style={{
                        position: "absolute",
                        right: 24,
                        top: "50%",
                        transform: "translateY(-50%)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        zIndex: 10,
                    }}
                >
                    {list.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => navigate(index)}
                            aria-current={
                                index === currentIndex ? "true" : undefined
                            }
                            aria-label={`Go to slide ${index + 1}`}
                            style={{
                                height: index === currentIndex ? 24 : 8,
                                width: 8,
                                borderRadius: 9999,
                                backgroundColor:
                                    index === currentIndex
                                        ? textColor
                                        : "rgba(255, 255, 255, 0.3)",
                                border: "none",
                                cursor: "pointer",
                                transition: "all 300ms ease",
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Instruction Hints */}
            {showHints && list.length > 0 && (
                <motion.div
                    style={{
                        position: "absolute",
                        bottom: 24,
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 10,
                    }}
                    initial={isStatic ? false : { opacity: 0, y: 20 }}
                    animate={isStatic ? false : { opacity: 1, y: 0 }}
                    transition={
                        isStatic ? { duration: 0 } : { delay: 1, duration: 0.6 }
                    }
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 6,
                            opacity: 0.6,
                        }}
                    >
                        {showHintArrows && (
                            <motion.div
                                animate={
                                    isStatic ? { y: 0 } : { y: [0, -6, 0] }
                                }
                                transition={
                                    isStatic
                                        ? { duration: 0 }
                                        : {
                                              repeat: Infinity,
                                              duration: 1.5,
                                              ease: "easeInOut",
                                          }
                                }
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M12 5v14M5 12l7-7 7 7" />
                                </svg>
                            </motion.div>
                        )}

                        {showHintText && (
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    letterSpacing: "0.15em",
                                    textTransform: "uppercase",
                                }}
                            >
                                {hintText}
                            </span>
                        )}

                        {showHintArrows && (
                            <motion.div
                                animate={isStatic ? { y: 0 } : { y: [0, 6, 0] }}
                                transition={
                                    isStatic
                                        ? { duration: 0 }
                                        : {
                                              repeat: Infinity,
                                              duration: 1.5,
                                              ease: "easeInOut",
                                          }
                                }
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M12 5v14M19 12l-7 7-7-7" />
                                </svg>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Counter */}
            {showCounter && list.length > 0 && (
                <div
                    style={{
                        position: "absolute",
                        left: 24,
                        top: "50%",
                        transform: "translateY(-50%)",
                        zIndex: 10,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                    >
                        <span
                            style={{
                                fontSize: 32,
                                fontWeight: 300,
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            {String(currentIndex + 1).padStart(2, "0")}
                        </span>
                        <div
                            style={{
                                margin: "6px 0",
                                height: 1,
                                width: 28,
                                backgroundColor: "rgba(255, 255, 255, 0.2)",
                            }}
                        />
                        <span
                            style={{
                                fontSize: 13,
                                opacity: 0.5,
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            {String(list.length).padStart(2, "0")}
                        </span>
                    </div>
                </div>
            )}
        </section>
    )
}

// --- Property Controls ---
addPropertyControls(VerticalImageStack, {
    images: {
        type: ControlType.Array,
        title: "Images",
        description: "Add images for the vertical card stack",
        control: {
            type: ControlType.Object,
            controls: {
                src: { type: ControlType.Image, title: "Image" },
                alt: { type: ControlType.String, title: "Alt Text" },
            },
        },
        defaultValue: [],
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Width",
        min: 150,
        max: 600,
        step: 10,
        defaultValue: 280,
        description: "Width of individual cards in pixels",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Height",
        min: 200,
        max: 800,
        step: 10,
        defaultValue: 420,
        description: "Height of individual cards in pixels",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 24,
        description: "Corner roundness of the cards",
    },
    cooldown: {
        type: ControlType.Number,
        title: "Cooldown",
        min: 100,
        max: 1000,
        step: 50,
        unit: "ms",
        defaultValue: 400,
        description: "Minimum delay between scroll/drag transitions",
    },
    showDots: {
        type: ControlType.Boolean,
        title: "Show Dots",
        defaultValue: true,
        description: "Toggle right-hand navigation dots",
    },
    showCounter: {
        type: ControlType.Boolean,
        title: "Show Counter",
        defaultValue: true,
        description: "Toggle left-hand index counter",
    },
    showHints: {
        type: ControlType.Boolean,
        title: "Show Hints",
        defaultValue: true,
        description: "Toggle scroll/drag directional hint container",
    },
    showHintArrows: {
        type: ControlType.Boolean,
        title: "Hint Arrows",
        defaultValue: true,
        description: "Toggle animated up/down arrows in hint container",
        hidden: (props) => !props.showHints,
    },
    showHintText: {
        type: ControlType.Boolean,
        title: "Hint Text UI",
        defaultValue: true,
        description: "Toggle hint label text display",
        hidden: (props) => !props.showHints,
    },
    hintText: {
        type: ControlType.String,
        title: "Hint Text",
        defaultValue: "Scroll or drag",
        description: "Custom label text for navigation hints",
        hidden: (props) => !props.showHints || !props.showHintText,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
        description: "Background color of the container",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#ffffff",
        description: "Foreground color for text and icons",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "Vertical image stack visualization",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})
