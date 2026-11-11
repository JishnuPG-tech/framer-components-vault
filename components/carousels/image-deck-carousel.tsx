// CardDeckImageCarousel.tsx — Framer Code Component
// Stack shape is depth-based (fan stays consistent), images are separate

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useCallback, useEffect, useRef } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CardImage {
    src: string
    alt: string
}

interface SlotStyle {
    rotation: number
    offsetX: number
    offsetY: number
    scale: number
}

interface Props {
    images: CardImage[]
    slots: SlotStyle[]
    cardWidth: number
    cardHeight: number
    borderRadius: number
    cardShadow: boolean
    swipeThreshold: number
    animationDuration: number
    autoPlay: boolean
    autoPlayInterval: number
    showControls: boolean
    showDots: boolean
    controlColor: string
    backgroundColor: string
}

// ─── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_IMAGES: CardImage[] = [
    {
        src: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80",
        alt: "Model 1",
    },
    {
        src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80",
        alt: "Model 2",
    },
    {
        src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80",
        alt: "Model 3",
    },
    {
        src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80",
        alt: "Model 4",
    },
    {
        src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80",
        alt: "Model 5",
    },
]

const DEFAULT_SLOTS: SlotStyle[] = [
    { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 }, // depth 0 — front (values locked)
    { rotation: -5, offsetX: -10, offsetY: 8, scale: 0.97 }, // depth 1
    { rotation: -10, offsetX: -18, offsetY: 14, scale: 0.94 }, // depth 2
    { rotation: -14, offsetX: -24, offsetY: 18, scale: 0.91 }, // depth 3
    { rotation: -17, offsetX: -28, offsetY: 22, scale: 0.88 }, // depth 4
]

const EASE_OUT = [0.22, 1, 0.36, 1] as const

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 280
 * @framerIntrinsicHeight 380
 */
export default function CardDeckImageCarousel({
    images = DEFAULT_IMAGES,
    slots = DEFAULT_SLOTS,
    cardWidth = 280,
    cardHeight = 380,
    borderRadius = 20,
    cardShadow = true,
    swipeThreshold = 70,
    animationDuration = 0.55,
    autoPlay = false,
    autoPlayInterval = 2500,
    showControls = true,
    showDots = true,
    controlColor = "rgba(255,255,255,0.85)",
    backgroundColor = "transparent",
}: Props) {
    const n = images.length
    const isStatic = useIsStaticRenderer()

    const [positions, setPositions] = useState<number[]>(
        images.map((_, i) => i)
    )
    const [locked, setLocked] = useState(false)

    useEffect(() => {
        setPositions(images.map((_, i) => i))
    }, [n])

    const dragX = useMotionValue(0)
    const dragExtraRotate = useTransform(dragX, [-160, 0, 160], [-12, 0, 12])
    const dragExtraScale = useTransform(dragX, [-160, 0, 160], [0.96, 1, 0.96])

    const styleForDepth = (depth: number): SlotStyle => {
        if (depth === 0)
            return { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 }
        const slot = slots[Math.min(depth, slots.length - 1)]
        return slot ?? { rotation: 0, offsetX: 0, offsetY: 0, scale: 1 }
    }

    const sendFrontToBack = useCallback(() => {
        if (locked) return
        setLocked(true)
        animate(dragX, 0, { duration: 0.05 })
        setPositions((prev) => prev.map((p) => (p === 0 ? n - 1 : p - 1)))
        setTimeout(() => setLocked(false), animationDuration * 1000 + 60)
    }, [locked, n, animationDuration, dragX])

    const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null)
    useEffect(() => {
        if (!autoPlay || isStatic) return
        autoTimer.current = setInterval(sendFrontToBack, autoPlayInterval)
        return () => {
            if (autoTimer.current) clearInterval(autoTimer.current)
        }
    }, [autoPlay, autoPlayInterval, sendFrontToBack, isStatic])

    const handleDragEnd = useCallback(
        (_: any, info: { offset: { x: number } }) => {
            if (Math.abs(info.offset.x) >= swipeThreshold) {
                sendFrontToBack()
            } else {
                animate(dragX, 0, {
                    type: "spring",
                    stiffness: 350,
                    damping: 32,
                })
            }
        },
        [swipeThreshold, sendFrontToBack, dragX]
    )

    const zFor = (depth: number) => n - depth

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                background: backgroundColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "visible",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: cardWidth,
                    height: cardHeight,
                }}
            >
                {images.map((image, imgIdx) => {
                    const depth = positions[imgIdx]
                    const isTop = depth === 0
                    const s = styleForDepth(depth)

                    return (
                        <motion.div
                            key={imgIdx}
                            drag={isTop && !locked && !isStatic ? "x" : false}
                            dragElastic={0.08}
                            dragConstraints={{ left: 0, right: 0 }}
                            onDragEnd={
                                isTop && !isStatic ? handleDragEnd : undefined
                            }
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: cardWidth,
                                height: cardHeight,
                                borderRadius,
                                overflow: "hidden",
                                cursor:
                                    isTop && !locked && !isStatic
                                        ? "grab"
                                        : "default",
                                touchAction: "none",
                                willChange: "transform",
                                zIndex: zFor(depth),
                                // In static mode apply transforms directly via style — no animation
                                ...(isStatic
                                    ? {
                                          rotate: `${s.rotation}deg`,
                                          x: s.offsetX,
                                          y: s.offsetY,
                                          scale: s.scale,
                                      }
                                    : {}),
                                boxShadow: cardShadow
                                    ? isTop
                                        ? "0 24px 64px rgba(0,0,0,0.32), 0 4px 16px rgba(0,0,0,0.18)"
                                        : `0 ${4 + depth * 2}px ${14 + depth * 5}px rgba(0,0,0,${0.1 + depth * 0.03})`
                                    : "none",
                            }}
                            // Only animate when not in static renderer
                            animate={
                                !isStatic
                                    ? {
                                          rotate: s.rotation,
                                          x: s.offsetX,
                                          y: s.offsetY,
                                          scale: s.scale,
                                      }
                                    : undefined
                            }
                            transition={{
                                duration: animationDuration,
                                ease: EASE_OUT,
                            }}
                            whileDrag={
                                !isStatic ? { cursor: "grabbing" } : undefined
                            }
                        >
                            <motion.div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    x: isTop && !isStatic ? dragX : 0,
                                    rotate:
                                        isTop && !isStatic
                                            ? dragExtraRotate
                                            : 0,
                                    scale:
                                        isTop && !isStatic ? dragExtraScale : 1,
                                    borderRadius,
                                    overflow: "hidden",
                                    background: "#1c1c1e",
                                }}
                            >
                                {image?.src ? (
                                    <img
                                        src={image.src}
                                        alt={image.alt || ""}
                                        draggable={false}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                            pointerEvents: "none",
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "rgba(255,255,255,0.2)",
                                            fontSize: 13,
                                        }}
                                    >
                                        No image
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Arrow */}
            {showControls && (
                <button
                    onClick={sendFrontToBack}
                    disabled={locked}
                    aria-label="Next card"
                    style={{
                        position: "absolute",
                        right: `calc(50% - ${cardWidth / 2}px - 56px)`,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        border: `1.5px solid ${controlColor}`,
                        background: "rgba(255,255,255,0.1)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        color: controlColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: locked ? "default" : "pointer",
                        opacity: locked ? 0.4 : 1,
                        transition: "opacity 0.2s",
                        zIndex: 50,
                        padding: 0,
                    }}
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
            )}

            {/* Dots */}
            {showDots && (
                <div
                    style={{
                        position: "absolute",
                        bottom: -44,
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        gap: 7,
                        alignItems: "center",
                    }}
                >
                    {images.map((_, i) => {
                        const isActive = positions[i] === 0
                        return (
                            <motion.div
                                key={i}
                                animate={
                                    !isStatic
                                        ? {
                                              width: isActive ? 22 : 8,
                                              opacity: isActive ? 1 : 0.35,
                                          }
                                        : undefined
                                }
                                style={{
                                    height: 8,
                                    borderRadius: 4,
                                    background: controlColor,
                                    width: isActive ? 22 : 8,
                                    opacity: isActive ? 1 : 0.35,
                                }}
                                transition={{ duration: 0.3, ease: EASE_OUT }}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ─── Property Controls ──────────────────────────────────────────────────────────

addPropertyControls(CardDeckImageCarousel, {
    images: {
        type: ControlType.Array,
        title: "Images",
        description:
            "Add one image per card. The first image starts at the front of the stack. Order cycles as cards advance.",
        control: {
            type: ControlType.Object,
            title: "Image",
            controls: {
                src: { type: ControlType.Image, title: "Image" },
                alt: {
                    type: ControlType.String,
                    title: "Alt text",
                    defaultValue: "",
                },
            },
        },
        defaultValue: DEFAULT_IMAGES,
    },

    slots: {
        type: ControlType.Array,
        title: "Stack Slots",
        description:
            "One slot per depth layer behind the front card. Slot 1 = directly behind, Slot 2 = next, etc. Add a slot per card for a fully custom fan. Extra cards inherit the last slot's style.",
        control: {
            type: ControlType.Object,
            title: "Slot",
            controls: {
                rotation: {
                    type: ControlType.Number,
                    title: "Rotation",
                    description:
                        "How many degrees this slot leans. Negative = leans left, positive = leans right.",
                    defaultValue: 0,
                    min: -60,
                    max: 60,
                    step: 0.5,
                    unit: "°",
                },
                offsetX: {
                    type: ControlType.Number,
                    title: "Offset X",
                    description:
                        "Horizontal shift relative to the front card. Negative = shifts left (classic left-peek fan).",
                    defaultValue: 0,
                    min: -150,
                    max: 150,
                    step: 1,
                    unit: "px",
                },
                offsetY: {
                    type: ControlType.Number,
                    title: "Offset Y",
                    description:
                        "Vertical shift relative to the front card. Positive = moves down, adding a sense of physical stack height.",
                    defaultValue: 0,
                    min: -150,
                    max: 150,
                    step: 1,
                    unit: "px",
                },
                scale: {
                    type: ControlType.Number,
                    title: "Scale",
                    description:
                        "Size relative to the front card. Slightly below 1 (e.g. 0.97) adds depth. 1 = same size as front.",
                    defaultValue: 1,
                    min: 0.5,
                    max: 1,
                    step: 0.01,
                },
            },
        },
        defaultValue: DEFAULT_SLOTS,
    },

    cardWidth: {
        type: ControlType.Number,
        title: "Width",
        description: "Width of each card.",
        defaultValue: 280,
        min: 140,
        max: 600,
        step: 4,
        unit: "px",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Height",
        description: "Height of each card.",
        defaultValue: 380,
        min: 140,
        max: 800,
        step: 4,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        description:
            "Corner rounding on every card. 0 = sharp, higher = rounder.",
        defaultValue: 20,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    cardShadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        description:
            "Toggles drop shadows. Front card has a deep shadow; background cards progressively lighter.",
        defaultValue: true,
    },

    swipeThreshold: {
        type: ControlType.Number,
        title: "Swipe Threshold",
        description:
            "Distance in px the user must drag before the card commits to cycling. Lower = more sensitive.",
        defaultValue: 70,
        min: 20,
        max: 200,
        step: 5,
        unit: "px",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Duration",
        description:
            "Transition duration in seconds. Lower = snappier, higher = more cinematic.",
        defaultValue: 0.55,
        min: 0.2,
        max: 1.5,
        step: 0.05,
        unit: "s",
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        description:
            "Automatically advances the stack on a timer. Set the speed with Interval.",
        defaultValue: false,
    },
    autoPlayInterval: {
        type: ControlType.Number,
        title: "Interval",
        description:
            "Milliseconds between automatic advances. 1000ms = 1 second.",
        defaultValue: 2500,
        min: 500,
        max: 10000,
        step: 100,
        unit: "ms",
        hidden: (props: any) => !props.autoPlay,
    },

    showControls: {
        type: ControlType.Boolean,
        title: "Show Arrow",
        description: "Shows or hides the circular next-card button.",
        defaultValue: true,
    },
    showDots: {
        type: ControlType.Boolean,
        title: "Show Dots",
        description:
            "Shows or hides the dot progress bar. The active dot expands to indicate the front card.",
        defaultValue: true,
    },
    controlColor: {
        type: ControlType.Color,
        title: "Control Color",
        description:
            "Color for both the arrow button and dots. Use a color that contrasts with your background.",
        defaultValue: "rgba(255,255,255,0.85)",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        description:
            "Component background. Transparent by default so it blends into your frame.\n\n[More Components](https://framer.link/OwYNKli)",
        defaultValue: "transparent",
    },
})
