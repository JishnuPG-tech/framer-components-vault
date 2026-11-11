//   PRELOADER 5 DOT

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useEffect, useMemo, useRef } from "react"
import { motion, useMotionValue, animate } from "framer-motion"

// ─── Component Props Interface ─────────────────────────────

interface Preloader5Props {
    // 1. Timing & Speed
    speedPreset: "hyper" | "fast" | "editorial" | "relaxed" | "custom"
    duration: number
    holdDuration: number
    revealDelay: number
    cycleSpeedMs: number

    // 2. Brand & Header Bar
    brandName: string
    brandColor: string
    brandSize: number

    // 3. Counter Typography & Style
    font?: {
        fontFamily?: string
        fontSize?: number
        fontWeight?: number | string
        fontStyle?: string
        letterSpacing?: string
        lineHeight?: string
    }
    counterColor: string
    counterSize: number
    counterFormat: "unpadded" | "padded"
    counterSuffix: string

    // 4. Center Media Reel (6 Image Slots)
    image1: string
    image2: string
    image3: string
    image4: string
    image5: string
    image6: string

    // 5. Media Frame Sizing & Geometry
    cardWidth: number
    cardAspectRatio: "3/4" | "4/5" | "1/1" | "16/9" | "9/16"
    cardRadius: number

    // 6. Entrance & Exit Reveals
    entranceDuration: number
    exitStyle: "swipeBottomToTop" | "wipeUpCanvas" | "centerSplit" | "pureFade"
    exitSpeed: number

    // 7. Canvas & System
    backgroundColor: string
    showOncePerSession: boolean
    zIndex: number
}

// ─── Curated High-Fashion & Architectural Default Images ───

const DEFAULT_IMAGES = [
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200&auto=format&fit=crop", // Fashion footwear / editorial product
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop", // Monochrome fashion portrait
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop", // Architectural interior light
    "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1200&auto=format&fit=crop", // Classical sculpture profile
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop", // Brutalist concrete geometry
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop", // Luxury modern villa
]

// ─── Ultra-Smooth Luxury Parisian Cubic Bezier Curve ───────
const LUXURY_EASE = [0.85, 0, 0.15, 1] as const

// ─── Main Component ────────────────────────────────────────

export default function preloader5DOT(props: Preloader5Props) {
    const {
        // Timing
        speedPreset = "editorial",
        duration = 3.2,
        holdDuration = 0.35,
        revealDelay = 0.35,
        cycleSpeedMs = 170,

        // Brand & Header
        brandName = "STUDIO OLIMPO",
        brandColor = "#111116",
        brandSize = 11,

        // Counter
        font,
        counterColor = "#111116",
        counterSize = 11,
        counterFormat = "unpadded",
        counterSuffix = "",

        // Images
        image1 = DEFAULT_IMAGES[0],
        image2 = DEFAULT_IMAGES[1],
        image3 = DEFAULT_IMAGES[2],
        image4 = DEFAULT_IMAGES[3],
        image5 = DEFAULT_IMAGES[4],
        image6 = DEFAULT_IMAGES[5],

        // Frame
        cardWidth = 260,
        cardAspectRatio = "4/5",
        cardRadius = 0,

        // Entrance & Exit
        entranceDuration = 0.85,
        exitStyle = "swipeBottomToTop",
        exitSpeed = 0.85,

        // Canvas & System
        backgroundColor = "#f4f1ea",
        showOncePerSession = false,
        zIndex = 99999,
    } = props

    const isStatic = useIsStaticRenderer()

    // ─── 1. Effective Duration Preset ──────────────────────────
    const effectiveDuration = useMemo(() => {
        switch (speedPreset) {
            case "hyper":
                return 1.8
            case "fast":
                return 2.4
            case "editorial":
                return 3.2
            case "relaxed":
                return 4.6
            case "custom":
            default:
                return duration || 3.2
        }
    }, [speedPreset, duration])

    // ─── 2. Image Deck Pooling & Instant In-Memory Preload ──────
    const imageDeck = useMemo(() => {
        const list = [image1, image2, image3, image4, image5, image6].filter(
            Boolean
        )
        return list.length > 0 ? list : DEFAULT_IMAGES
    }, [image1, image2, image3, image4, image5, image6])

    useEffect(() => {
        if (typeof window !== "undefined") {
            imageDeck.forEach((src) => {
                const img = new Image()
                img.src = src
            })
        }
    }, [imageDeck])

    // ─── 3. State & Animation Values ──────────────────────────
    const [isVisible, setIsVisible] = useState(() => {
        if (isStatic) return true
        if (typeof window === "undefined") return true
        if (showOncePerSession) {
            return !sessionStorage.getItem("preloader5_seen")
        }
        return true
    })

    const [isElementExiting, setIsElementExiting] = useState(false)
    const [isScreenExiting, setIsScreenExiting] = useState(false)
    const [displayNumber, setDisplayNumber] = useState(isStatic ? 100 : 0)
    const [activeImageIndex, setActiveImageIndex] = useState(0)

    const progress = useMotionValue(isStatic ? 100 : 0)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isInView, setIsInView] = useState(isStatic)

    // ─── 4. Viewport Visibility (IntersectionObserver) ────────
    useEffect(() => {
        if (isStatic) {
            setIsInView(true)
            return
        }
        const node = containerRef.current
        if (!node || typeof IntersectionObserver === "undefined") {
            setIsInView(true)
            return
        }
        const observer = new IntersectionObserver(
            ([entry]) => setIsInView(entry.isIntersecting),
            { threshold: 0.05 }
        )
        observer.observe(node)
        return () => observer.disconnect()
    }, [isStatic])

    // ─── 5. Uninterrupted Continuous Image Loop ────────────────
    useEffect(() => {
        if (isStatic || isElementExiting || !isVisible || !isInView) {
            return
        }
        if (imageDeck.length <= 1) return

        const interval = setInterval(
            () => {
                setActiveImageIndex((prev) => (prev + 1) % imageDeck.length)
            },
            Math.max(60, cycleSpeedMs)
        )

        return () => clearInterval(interval)
    }, [
        isStatic,
        isElementExiting,
        isVisible,
        isInView,
        imageDeck,
        cycleSpeedMs,
    ])

    // ─── 6. Counter Value Listener ────────────────────────────
    useEffect(() => {
        if (isStatic) {
            setDisplayNumber(100)
            return
        }
        setDisplayNumber(0)
        const unsubscribe = progress.on("change", (latest) => {
            setDisplayNumber(Math.min(100, Math.floor(latest)))
        })
        return () => unsubscribe()
    }, [progress, isStatic])

    // ─── 7. Master Choreographed Animation Controller ─────────
    useEffect(() => {
        if (isStatic || !isVisible || !isInView) return

        progress.set(0)
        setIsElementExiting(false)
        setIsScreenExiting(false)

        const controls = animate(progress, 100, {
            duration: effectiveDuration,
            ease: LUXURY_EASE,
            onComplete: () => {
                // Phase 1: Hold briefly at 100%, then exit center elements
                const elementExitTimer = setTimeout(() => {
                    setIsElementExiting(true)

                    // Phase 2: After center elements exit + deliberate delay, reveal full screen
                    const screenRevealTimer = setTimeout(
                        () => {
                            setIsScreenExiting(true)

                            // Phase 3: Cleanup when canvas reveal completes
                            const cleanupTimer = setTimeout(
                                () => {
                                    setIsVisible(false)
                                    if (
                                        showOncePerSession &&
                                        typeof window !== "undefined"
                                    ) {
                                        sessionStorage.setItem(
                                            "preloader5_seen",
                                            "true"
                                        )
                                    }
                                },
                                (exitSpeed + 0.15) * 1000
                            )

                            return () => clearTimeout(cleanupTimer)
                        },
                        (0.38 + revealDelay) * 1000
                    )

                    return () => clearTimeout(screenRevealTimer)
                }, holdDuration * 1000)

                return () => clearTimeout(elementExitTimer)
            },
        })

        return () => controls.stop()
    }, [
        isStatic,
        isVisible,
        isInView,
        effectiveDuration,
        holdDuration,
        revealDelay,
        exitSpeed,
        showOncePerSession,
        progress,
    ])

    // ─── 8. Formatted Counter String ──────────────────────────
    const formattedCounter = useMemo(() => {
        const numStr =
            counterFormat === "padded"
                ? String(displayNumber).padStart(2, "0")
                : String(displayNumber)
        return `${numStr}${counterSuffix}`
    }, [displayNumber, counterFormat, counterSuffix])

    // ─── 9. Aspect Ratio Resolution ───────────────────────────
    const resolvedAspectRatio = useMemo(() => {
        switch (cardAspectRatio) {
            case "3/4":
                return "3 / 4"
            case "4/5":
                return "4 / 5"
            case "1/1":
                return "1 / 1"
            case "16/9":
                return "16 / 9"
            case "9/16":
                return "9 / 16"
            default:
                return "4 / 5"
        }
    }, [cardAspectRatio])

    if (!isVisible && !isStatic) return null

    return (
        <motion.div
            ref={containerRef}
            key="preloader5-dot"
            animate={
                !isStatic && isScreenExiting && exitStyle === "swipeBottomToTop"
                    ? {
                          clipPath: "inset(0% 0% 100% 0%)",
                          transition: {
                              duration: exitSpeed,
                              ease: LUXURY_EASE,
                          },
                      }
                    : !isStatic &&
                        isScreenExiting &&
                        exitStyle === "wipeUpCanvas"
                      ? {
                            y: "-100%",
                            transition: {
                                duration: exitSpeed,
                                ease: LUXURY_EASE,
                            },
                        }
                      : !isStatic && isScreenExiting && exitStyle === "pureFade"
                        ? {
                              opacity: 0,
                              transition: {
                                  duration: exitSpeed,
                                  ease: LUXURY_EASE,
                              },
                          }
                        : {
                              clipPath: "inset(0% 0% 0% 0%)",
                              y: 0,
                              opacity: 1,
                          }
            }
            style={{
                position: isStatic ? "absolute" : "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100%",
                height: "100%",
                zIndex: isStatic ? 1 : zIndex,
                overflow: "hidden",
                userSelect: "none",
                WebkitUserSelect: "none",
                pointerEvents: isScreenExiting && !isStatic ? "none" : "auto",
                backgroundColor:
                    exitStyle === "centerSplit"
                        ? "transparent"
                        : backgroundColor,
                willChange: "clip-path, transform, opacity",
            }}
        >
            {/* ─── Center Split Open Exit Panels (if selected) ─── */}
            {exitStyle === "centerSplit" && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "row",
                        zIndex: 1,
                        overflow: "hidden",
                    }}
                >
                    <motion.div
                        animate={{
                            x: !isStatic && isScreenExiting ? "-100%" : 0,
                        }}
                        transition={{ duration: exitSpeed, ease: LUXURY_EASE }}
                        style={{
                            width: "calc(50% + 1.5px)",
                            marginRight: "-1.5px",
                            height: "100%",
                            backgroundColor,
                            willChange: "transform",
                            transform: "translate3d(0, 0, 0)",
                            backfaceVisibility: "hidden",
                        }}
                    />
                    <motion.div
                        animate={{
                            x: !isStatic && isScreenExiting ? "100%" : 0,
                        }}
                        transition={{ duration: exitSpeed, ease: LUXURY_EASE }}
                        style={{
                            width: "50%",
                            height: "100%",
                            backgroundColor,
                            willChange: "transform",
                            transform: "translate3d(0, 0, 0)",
                            backfaceVisibility: "hidden",
                        }}
                    />
                </div>
            )}

            {/* ─── Center Editorial Stage ─── */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                    pointerEvents: "none",
                    padding: "24px",
                }}
            >
                {/* ── Center Media Container ── */}
                <div
                    style={{
                        width: `min(${cardWidth}px, 80vw)`,
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                    }}
                >
                    {/* ── Header Bar (Masked Slide Animation) ── */}
                    <div
                        style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "baseline",
                            justifyContent: "space-between",
                            paddingBottom: "10px",
                            fontFamily:
                                font?.fontFamily ||
                                "-apple-system, BlinkMacSystemFont, 'Space Grotesk', 'Inter', sans-serif",
                            userSelect: "none",
                            overflow: "hidden",
                        }}
                    >
                        {/* Brand Name with Masked Slide-Up Entrance & Exit */}
                        <motion.div
                            initial={
                                isStatic ? false : { y: "120%", opacity: 0 }
                            }
                            animate={
                                !isStatic && isElementExiting
                                    ? {
                                          y: "-120%",
                                          opacity: 0,
                                          transition: {
                                              duration: 0.38,
                                              ease: LUXURY_EASE,
                                          },
                                      }
                                    : {
                                          y: "0%",
                                          opacity: 1,
                                          transition: {
                                              duration: entranceDuration,
                                              ease: LUXURY_EASE,
                                              delay: 0.04,
                                          },
                                      }
                            }
                            style={{
                                color: brandColor,
                                fontSize: `${brandSize}px`,
                                fontWeight: font?.fontWeight || 600,
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                                willChange: "transform, opacity",
                            }}
                        >
                            {brandName}
                        </motion.div>

                        {/* Precision Counter with Masked Slide-Up Entrance & Exit */}
                        <motion.div
                            initial={
                                isStatic ? false : { y: "120%", opacity: 0 }
                            }
                            animate={
                                !isStatic && isElementExiting
                                    ? {
                                          y: "-120%",
                                          opacity: 0,
                                          transition: {
                                              duration: 0.38,
                                              ease: LUXURY_EASE,
                                          },
                                      }
                                    : {
                                          y: "0%",
                                          opacity: 1,
                                          transition: {
                                              duration: entranceDuration,
                                              ease: LUXURY_EASE,
                                              delay: 0.08,
                                          },
                                      }
                            }
                            style={{
                                color: counterColor,
                                fontSize: `${counterSize}px`,
                                fontWeight: font?.fontWeight || 600,
                                letterSpacing: "0.08em",
                                fontVariantNumeric: "tabular-nums",
                                willChange: "transform, opacity",
                            }}
                        >
                            {formattedCounter}
                        </motion.div>
                    </div>

                    {/* ── Center Image Frame with Parallax Aperture Swipe Reveal ── */}
                    <motion.div
                        initial={
                            isStatic
                                ? false
                                : { clipPath: "inset(100% 0% 0% 0%)" }
                        }
                        animate={
                            !isStatic && isElementExiting
                                ? {
                                      clipPath: "inset(0% 0% 100% 0%)",
                                      transition: {
                                          duration: 0.42,
                                          ease: LUXURY_EASE,
                                      },
                                  }
                                : {
                                      clipPath: "inset(0% 0% 0% 0%)",
                                      transition: {
                                          duration: entranceDuration,
                                          ease: LUXURY_EASE,
                                          delay: 0.1,
                                      },
                                  }
                        }
                        style={{
                            width: "100%",
                            aspectRatio: resolvedAspectRatio,
                            borderRadius: `${cardRadius}px`,
                            overflow: "hidden",
                            position: "relative",
                            backgroundColor: "rgba(0, 0, 0, 0.03)",
                            willChange: "clip-path, transform",
                            transform: "translate3d(0, 0, 0)",
                            backfaceVisibility: "hidden",
                        }}
                    >
                        {/* Clean Media Frame */}
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                position: "relative",
                            }}
                        >
                            {/* Crisp Image Sequence (Instant Flow, No Animations) */}
                            {imageDeck.map((src, idx) => (
                                <img
                                    key={`img-${idx}`}
                                    src={src}
                                    alt={`Reel frame ${idx + 1}`}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display:
                                            idx === activeImageIndex
                                                ? "block"
                                                : "none",
                                    }}
                                    loading="eager"
                                />
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    )
}

// ─── Dual Backward-Compatible Export Aliases ───────────────
export {
    preloader5DOT as Preloader5DOT,
    preloader5DOT as StudioOlimpoPreloaderDOT,
    preloader5DOT as Studio_Olimpo_Preloader_DOT,
    preloader5DOT as studioolimpopreloader,
}

// ─── Framer Property Controls ──────────────────────────────

addPropertyControls(preloader5DOT, {
    // ── 1. Speed & Timing ──
    speedPreset: {
        type: ControlType.Enum,
        title: "Speed Preset",
        description: "Preloader counter speed and duration.",
        options: ["hyper", "fast", "editorial", "relaxed", "custom"],
        optionTitles: [
            "Hyper Fast (1.8s)",
            "Fast (2.4s)",
            "Editorial (3.2s — Recommended)",
            "Relaxed (4.6s)",
            "Custom Slider",
        ],
        defaultValue: "editorial",
    },
    duration: {
        type: ControlType.Number,
        title: "Custom Duration",
        description: "Exact seconds for the counter to reach 100%.",
        min: 1.0,
        max: 10.0,
        step: 0.1,
        unit: "s",
        defaultValue: 3.2,
        hidden: (props) => props.speedPreset !== "custom",
    },
    holdDuration: {
        type: ControlType.Number,
        title: "Hold At 100%",
        description: "Pause time at 100% before center elements slide away.",
        min: 0.1,
        max: 2.0,
        step: 0.05,
        unit: "s",
        defaultValue: 0.35,
    },
    revealDelay: {
        type: ControlType.Number,
        title: "Screen Reveal Delay",
        description:
            "Pause delay on clean canvas before full screen reveal executes.",
        min: 0.1,
        max: 2.0,
        step: 0.05,
        unit: "s",
        defaultValue: 0.35,
    },
    cycleSpeedMs: {
        type: ControlType.Number,
        title: "Reel Cycle Speed",
        description: "Image flow interval in milliseconds (70ms–350ms).",
        min: 70,
        max: 350,
        step: 10,
        unit: "ms",
        defaultValue: 170,
    },

    // ── 2. Brand & Header Bar ──
    brandName: {
        type: ControlType.String,
        title: "Brand Name",
        description: "Main studio or company title above the image.",
        defaultValue: "STUDIO OLIMPO",
    },
    brandColor: {
        type: ControlType.Color,
        title: "Brand Color",
        description: "Color of the brand name.",
        defaultValue: "#111116",
    },
    brandSize: {
        type: ControlType.Number,
        title: "Brand Size",
        min: 9,
        max: 24,
        step: 1,
        unit: "px",
        defaultValue: 11,
    },

    // ── 3. Counter Typography ──
    counterColor: {
        type: ControlType.Color,
        title: "Counter Color",
        description: "Color of the percentage numbers.",
        defaultValue: "#111116",
    },
    counterSize: {
        type: ControlType.Number,
        title: "Counter Size",
        min: 9,
        max: 24,
        step: 1,
        unit: "px",
        defaultValue: 11,
    },
    counterFormat: {
        type: ControlType.Enum,
        title: "Format",
        description: "Choose single digit (0) or double digit padding (00).",
        options: ["unpadded", "padded"],
        optionTitles: ["Direct (88)", "Padded (088)"],
        defaultValue: "unpadded",
    },
    counterSuffix: {
        type: ControlType.String,
        title: "Suffix",
        description: "Optional symbol after counter (blank by default).",
        defaultValue: "",
    },
    font: {
        type: ControlType.Font,
        title: "Typography",
        controls: "extended",
    },

    // ── 4. Center Media Reel (6 Image Slots) ──
    image1: {
        type: ControlType.Image,
        title: "Image 1 (Hero)",
        description: "First image (and final image settled on at 100%).",
        defaultValue: DEFAULT_IMAGES[0],
    },
    image2: {
        type: ControlType.Image,
        title: "Image 2",
        defaultValue: DEFAULT_IMAGES[1],
    },
    image3: {
        type: ControlType.Image,
        title: "Image 3",
        defaultValue: DEFAULT_IMAGES[2],
    },
    image4: {
        type: ControlType.Image,
        title: "Image 4",
        defaultValue: DEFAULT_IMAGES[3],
    },
    image5: {
        type: ControlType.Image,
        title: "Image 5",
        defaultValue: DEFAULT_IMAGES[4],
    },
    image6: {
        type: ControlType.Image,
        title: "Image 6",
        defaultValue: DEFAULT_IMAGES[5],
    },

    // ── 5. Media Frame Sizing & Geometry ──
    cardWidth: {
        type: ControlType.Number,
        title: "Frame Width",
        description: "Width of the center media frame.",
        min: 180,
        max: 560,
        step: 10,
        unit: "px",
        defaultValue: 260,
    },
    cardAspectRatio: {
        type: ControlType.Enum,
        title: "Aspect Ratio",
        options: ["3/4", "4/5", "1/1", "16/9", "9/16"],
        optionTitles: [
            "3:4 (Portrait)",
            "4:5 (Editorial)",
            "1:1 (Square)",
            "16:9 (Landscape)",
            "9:16 (Story)",
        ],
        defaultValue: "4/5",
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        min: 0,
        max: 32,
        step: 2,
        unit: "px",
        defaultValue: 0,
    },

    // ── 6. Entrance & Exit Reveals ──
    entranceDuration: {
        type: ControlType.Number,
        title: "Entrance Speed",
        description: "Duration of the bottom-to-top swipe entrance.",
        min: 0.3,
        max: 1.5,
        step: 0.05,
        unit: "s",
        defaultValue: 0.85,
    },
    exitStyle: {
        type: ControlType.Enum,
        title: "Exit Style",
        description: "Transition animation to reveal the website.",
        options: [
            "swipeBottomToTop",
            "wipeUpCanvas",
            "centerSplit",
            "pureFade",
        ],
        optionTitles: [
            "Swipe Bottom → Top (Signature)",
            "Canvas Sweep Up",
            "Center Split Open",
            "Pure Minimal Fade",
        ],
        defaultValue: "swipeBottomToTop",
    },
    exitSpeed: {
        type: ControlType.Number,
        title: "Exit Speed",
        description: "Duration of the reveal transition in seconds.",
        min: 0.4,
        max: 2.0,
        step: 0.05,
        unit: "s",
        defaultValue: 0.85,
    },

    // ── 7. Canvas & System ──
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        description: "Canvas backdrop color.",
        defaultValue: "#f4f1ea",
    },
    showOncePerSession: {
        type: ControlType.Boolean,
        title: "Once / Session",
        description: "Only display preloader once per browser visit.",
        defaultValue: false,
    },
    zIndex: {
        type: ControlType.Number,
        title: "Z-Index",
        min: 1,
        max: 999999,
        step: 1,
        defaultValue: 99999,
        description:
            "Get more components and templates on\n[DOT](https://www.framer.com/%40dharun)",
    },
})
