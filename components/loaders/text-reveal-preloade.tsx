//   TEXT REVEAL PRELOADER DOT

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
import { motion, AnimatePresence } from "framer-motion"

// ─── Component Props Interface ─────────────────────────────

interface TextRevealPreloaderProps {
    // 1. Words Sequence Deck
    word1: string
    word2: string
    word3: string
    word4: string
    word5: string
    finalWord: string

    // 2. Timing & Animation Pacing
    speedPreset: "hyper" | "fast" | "editorial" | "relaxed" | "custom"
    wordDuration: number
    staggerDelay: number
    holdDuration: number
    revealDelay: number

    // 3. Kinetic Typography & Sizing
    font?: {
        fontFamily?: string
        fontSize?: number
        fontWeight?: number | string
        fontStyle?: string
        letterSpacing?: string
        lineHeight?: string
    }
    fontSize: number
    textTransform: "uppercase" | "none" | "lowercase" | "capitalize"
    skewIntensity: number

    // 4. Color Palette & Aesthetic
    backgroundColor: string
    textColor: string

    // 5. Entrance & Exit Reveals
    exitStyle:
        | "swipeBottomToTop"
        | "curtainSweepUp"
        | "centerSplit"
        | "scaleThrough"
        | "pureFade"
    exitSpeed: number

    // 6. Canvas & System
    showOncePerSession: boolean
    zIndex: number
}

// ─── Curated Default Word Sequence ─────────────────────────
const DEFAULT_WORDS = ["Create", "Design", "Experience", "Studio"]

// ─── High-Torque Kinetic Bezier Easing Curves ───────────────
const KINETIC_ENTRANCE_EASE = [0.22, 1, 0.36, 1] as const
const KINETIC_EXIT_EASE = [0.76, 0, 0.24, 1] as const
const LUXURY_EXIT_EASE = [0.85, 0, 0.15, 1] as const

// ─── Main Component ────────────────────────────────────────

export default function Text_Reveal_Preloader_DOT(
    props: TextRevealPreloaderProps
) {
    const {
        // Words
        word1 = DEFAULT_WORDS[0],
        word2 = DEFAULT_WORDS[1],
        word3 = DEFAULT_WORDS[2],
        word4 = DEFAULT_WORDS[3],
        word5 = "",
        finalWord = "",

        // Timing
        speedPreset = "editorial",
        wordDuration = 0.95,
        staggerDelay = 0.045,
        holdDuration = 0.6,
        revealDelay = 0.4,

        // Typography & Kinetic Physics
        font,
        fontSize = 76,
        textTransform = "uppercase",
        skewIntensity = 6,

        // Colors
        backgroundColor = "#fa4429",
        textColor = "#fbf7ee",

        // Exit
        exitStyle = "swipeBottomToTop",
        exitSpeed = 0.95,

        // System
        showOncePerSession = false,
        zIndex = 99999,
    } = props

    const isStatic = useIsStaticRenderer()

    // ─── 1. Word Deck Resolution ───────────────────────────────
    const wordDeck = useMemo(() => {
        const rawList = [word1, word2, word3, word4, word5, finalWord]
            .map((w) => (w !== undefined && w !== null ? String(w).trim() : ""))
            .filter(Boolean)
        return rawList.length > 0 ? rawList : DEFAULT_WORDS
    }, [word1, word2, word3, word4, word5, finalWord])

    // ─── 2. Effective Word Duration Preset ─────────────────────
    const effectiveWordDuration = useMemo(() => {
        switch (speedPreset) {
            case "hyper":
                return 0.52
            case "fast":
                return 0.72
            case "editorial":
                return 0.95
            case "relaxed":
                return 1.3
            case "custom":
            default:
                return wordDuration || 0.95
        }
    }, [speedPreset, wordDuration])

    // ─── 3. State Management ───────────────────────────────────
    const [isVisible, setIsVisible] = useState(() => {
        if (isStatic) return true
        if (typeof window === "undefined") return true
        if (showOncePerSession) {
            return !sessionStorage.getItem("text_preloader_seen")
        }
        return true
    })

    const [currentWordIndex, setCurrentWordIndex] = useState(
        isStatic ? wordDeck.length - 1 : 0
    )
    const [isElementExiting, setIsElementExiting] = useState(false)
    const [isScreenExiting, setIsScreenExiting] = useState(false)

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

    // ─── 5. Master Word Progression & Reveal Controller ────────
    useEffect(() => {
        if (isStatic || !isVisible || !isInView) return

        setIsElementExiting(false)
        setIsScreenExiting(false)
        setCurrentWordIndex(0)

        let isCancelled = false
        const totalWords = wordDeck.length
        let activeIdx = 0

        const runWordSequence = () => {
            if (isCancelled) return

            if (activeIdx < totalWords - 1) {
                // Advance to next word after effectiveWordDuration
                const wordTimer = setTimeout(() => {
                    if (isCancelled) return
                    activeIdx += 1
                    setCurrentWordIndex(activeIdx)
                    runWordSequence()
                }, effectiveWordDuration * 1000)

                return () => clearTimeout(wordTimer)
            } else {
                // Reached final word -> Hold -> Phase 1 Kinetic Exit -> Phase 2 Screen Reveal
                const finalHoldTimer = setTimeout(() => {
                    if (isCancelled) return
                    setIsElementExiting(true)

                    const screenRevealTimer = setTimeout(
                        () => {
                            if (isCancelled) return
                            setIsScreenExiting(true)

                            const cleanupTimer = setTimeout(
                                () => {
                                    if (isCancelled) return
                                    setIsVisible(false)
                                    if (
                                        showOncePerSession &&
                                        typeof window !== "undefined"
                                    ) {
                                        sessionStorage.setItem(
                                            "text_preloader_seen",
                                            "true"
                                        )
                                    }
                                },
                                (exitSpeed + 0.2) * 1000
                            )

                            return () => clearTimeout(cleanupTimer)
                        },
                        (0.5 + revealDelay) * 1000
                    )

                    return () => clearTimeout(screenRevealTimer)
                }, holdDuration * 1000)

                return () => clearTimeout(finalHoldTimer)
            }
        }

        const initialTeardown = runWordSequence()

        return () => {
            isCancelled = true
            if (typeof initialTeardown === "function") {
                initialTeardown()
            }
        }
    }, [
        isStatic,
        isVisible,
        isInView,
        wordDeck,
        effectiveWordDuration,
        holdDuration,
        revealDelay,
        exitSpeed,
        showOncePerSession,
    ])

    // ─── 6. Active Word & Case Transformation ──────────────────
    const activeWord = wordDeck[currentWordIndex] || ""

    const transformedWord = useMemo(() => {
        if (!activeWord) return ""
        switch (textTransform) {
            case "uppercase":
                return activeWord.toUpperCase()
            case "lowercase":
                return activeWord.toLowerCase()
            case "capitalize":
                return (
                    activeWord.charAt(0).toUpperCase() +
                    activeWord.slice(1).toLowerCase()
                )
            case "none":
            default:
                return activeWord
        }
    }, [activeWord, textTransform])

    const charArray = useMemo(
        () => transformedWord.split(""),
        [transformedWord]
    )

    if (!isVisible && !isStatic) return null

    return (
        <motion.div
            ref={containerRef}
            key="text-reveal-preloader-dot"
            animate={
                !isStatic && isScreenExiting && exitStyle === "swipeBottomToTop"
                    ? {
                          clipPath: "inset(0% 0% 100% 0%)",
                          transition: {
                              duration: exitSpeed,
                              ease: LUXURY_EXIT_EASE,
                          },
                      }
                    : !isStatic &&
                        isScreenExiting &&
                        exitStyle === "curtainSweepUp"
                      ? {
                            y: "-100%",
                            transition: {
                                duration: exitSpeed,
                                ease: LUXURY_EXIT_EASE,
                            },
                        }
                      : !isStatic &&
                          isScreenExiting &&
                          exitStyle === "scaleThrough"
                        ? {
                              scale: 1.25,
                              opacity: 0,
                              transition: {
                                  duration: exitSpeed,
                                  ease: KINETIC_ENTRANCE_EASE,
                              },
                          }
                        : !isStatic &&
                            isScreenExiting &&
                            exitStyle === "pureFade"
                          ? {
                                opacity: 0,
                                transition: {
                                    duration: exitSpeed,
                                    ease: LUXURY_EXIT_EASE,
                                },
                            }
                          : {
                                clipPath: "inset(0% 0% 0% 0%)",
                                y: 0,
                                scale: 1,
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
            {/* ─── Center Split Open Panels (if selected) ─── */}
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
                        transition={{
                            duration: exitSpeed,
                            ease: LUXURY_EXIT_EASE,
                        }}
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
                        transition={{
                            duration: exitSpeed,
                            ease: LUXURY_EXIT_EASE,
                        }}
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

            {/* ─── Center Hero Typography Stage ─── */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 20,
                    pointerEvents: "none",
                    padding: "24px",
                    perspective: "1200px",
                }}
            >
                {/* ─── Masked Overlay Clip Stack Container ─── */}
                <div
                    style={{
                        position: "relative",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        clipPath: "inset(0% 0% 0% 0%)",
                        WebkitClipPath: "inset(0% 0% 0% 0%)",
                        padding: "12px 32px",
                    }}
                >
                    {/* Animated Word Display with Kinetic Stagger */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`word-${currentWordIndex}`}
                            initial={
                                isStatic
                                    ? false
                                    : {
                                          opacity: 1,
                                      }
                            }
                            animate={
                                !isStatic && isElementExiting
                                    ? {
                                          y: "-125%",
                                          opacity: 0,
                                          transition: {
                                              duration: 0.52,
                                              ease: KINETIC_EXIT_EASE,
                                          },
                                      }
                                    : {
                                          y: "0%",
                                          opacity: 1,
                                      }
                            }
                            exit={{
                                y: "-125%",
                                opacity: 0,
                                transition: {
                                    duration: 0.45,
                                    ease: KINETIC_EXIT_EASE,
                                },
                            }}
                            style={{
                                display: "inline-flex",
                                alignItems: "baseline",
                                overflow: "hidden",
                                fontFamily:
                                    font?.fontFamily ||
                                    "-apple-system, BlinkMacSystemFont, 'Inter', 'Plus Jakarta Sans', sans-serif",
                                fontSize: `clamp(42px, 9.5vw, ${fontSize}px)`,
                                fontWeight: font?.fontWeight || 800,
                                fontStyle: font?.fontStyle || "normal",
                                lineHeight: font?.lineHeight || 0.94,
                                textTransform,
                                willChange: "transform, opacity",
                            }}
                        >
                            {charArray.map((char, cIdx) => (
                                <motion.span
                                    key={`char-${cIdx}-${char}`}
                                    initial={
                                        isStatic
                                            ? false
                                            : {
                                                  y: "135%",
                                                  skewY: skewIntensity,
                                                  rotate:
                                                      skewIntensity > 0
                                                          ? cIdx % 2 === 0
                                                              ? 3
                                                              : -3
                                                          : 0,
                                                  scale: 0.9,
                                                  opacity: 0,
                                              }
                                    }
                                    animate={{
                                        y: "0%",
                                        skewY: 0,
                                        rotate: 0,
                                        scale: 1,
                                        opacity: 1,
                                        transition: {
                                            duration: 0.68,
                                            ease: KINETIC_ENTRANCE_EASE,
                                            delay: cIdx * staggerDelay,
                                        },
                                    }}
                                    style={{
                                        display: "inline-block",
                                        position: "relative",
                                        color: textColor,
                                        textTransform,
                                        transformOrigin: "bottom center",
                                        willChange: "transform, opacity",
                                    }}
                                >
                                    {char === " " ? "\u00A0" : char}
                                </motion.span>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    )
}

// ─── Dual Backward-Compatible Export Aliases ───────────────
export {
    Text_Reveal_Preloader_DOT as TextRevealPreloaderDOT,
    Text_Reveal_Preloader_DOT as textrevealpreloaderDOT,
    Text_Reveal_Preloader_DOT as text_reveal_preloader_DOT,
}

// ─── Framer Property Controls ──────────────────────────────

addPropertyControls(Text_Reveal_Preloader_DOT, {
    // ── 1. Sequential Words ──
    word1: {
        type: ControlType.String,
        title: "Word 1",
        description: "",
        defaultValue: "Create",
    },
    word2: {
        type: ControlType.String,
        title: "Word 2",
        defaultValue: "Design",
    },
    word3: {
        type: ControlType.String,
        title: "Word 3",
        defaultValue: "Experience",
    },
    word4: {
        type: ControlType.String,
        title: "Word 4",
        description: "",
        defaultValue: "Studio",
    },
    word5: {
        type: ControlType.String,
        title: "Word 5 (Optional)",
        defaultValue: "",
    },
    finalWord: {
        type: ControlType.String,
        title: "Final Word (Optional)",
        description: "Custom final word to hold before screen reveal.",
        defaultValue: "",
    },

    // ── 2. Timing & Pacing ──
    speedPreset: {
        type: ControlType.Enum,
        title: "Speed Preset",
        description: "Pacing of the word sequence transition.",
        options: ["hyper", "fast", "editorial", "relaxed", "custom"],
        optionTitles: [
            "Hyper (0.52s/word)",
            "Fast (0.72s/word)",
            "Editorial (0.95s/word — Kinetic Balance)",
            "Relaxed (1.30s/word)",
            "Custom Slider",
        ],
        defaultValue: "editorial",
    },
    wordDuration: {
        type: ControlType.Number,
        title: "Word Duration",
        description: "Time each word stays on screen before advancing.",
        min: 0.3,
        max: 4.0,
        step: 0.05,
        unit: "s",
        defaultValue: 0.95,
        hidden: (props) => props.speedPreset !== "custom",
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Letter Stagger",
        description:
            "Delay between each individual letter rising with momentum.",
        min: 0.015,
        max: 0.12,
        step: 0.005,
        unit: "s",
        defaultValue: 0.045,
    },
    skewIntensity: {
        type: ControlType.Number,
        title: "Kinetic Skew",
        description: "Angular dynamic skew angle on character entry.",
        min: 0,
        max: 18,
        step: 1,
        unit: "°",
        defaultValue: 6,
    },
    holdDuration: {
        type: ControlType.Number,
        title: "Final Hold",
        description: "Hold time on the final word before element exit.",
        min: 0.1,
        max: 3.0,
        step: 0.05,
        unit: "s",
        defaultValue: 0.6,
    },
    revealDelay: {
        type: ControlType.Number,
        title: "Reveal Delay",
        description: "Pause on canvas after words exit before screen reveal.",
        min: 0.1,
        max: 2.5,
        step: 0.05,
        unit: "s",
        defaultValue: 0.4,
    },

    // ── 3. Typography & Styling ──
    font: {
        type: ControlType.Font,
        title: "Typography",
        controls: "extended",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        description: "Max font size on desktop displays.",
        min: 32,
        max: 180,
        step: 2,
        unit: "px",
        defaultValue: 76,
    },
    textTransform: {
        type: ControlType.Enum,
        title: "Case",
        description: "Letter casing transformation.",
        options: ["uppercase", "none", "lowercase", "capitalize"],
        optionTitles: ["UPPERCASE", "Original", "lowercase", "Capitalize"],
        defaultValue: "uppercase",
    },

    // ── 4. Color Palette ──
    backgroundColor: {
        type: ControlType.Color,
        title: "Canvas Color",
        description: "Vibrant background backdrop color.",
        defaultValue: "#fa4429",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Fill",
        description: "Color of the solid letters.",
        defaultValue: "#fbf7ee",
    },

    // ── 5. Exit Reveals ──
    exitStyle: {
        type: ControlType.Enum,
        title: "Exit Style",
        description: "Animation to uncover the website underneath.",
        options: [
            "swipeBottomToTop",
            "curtainSweepUp",
            "centerSplit",
            "scaleThrough",
            "pureFade",
        ],
        optionTitles: [
            "Swipe Bottom → Top (Signature)",
            "Curtain Sweep Up",
            "Center Split Open",
            "Kinetic Scale Through",
            "Pure Minimal Fade",
        ],
        defaultValue: "swipeBottomToTop",
    },
    exitSpeed: {
        type: ControlType.Number,
        title: "Exit Speed",
        description: "Duration of the reveal transition in seconds.",
        min: 0.4,
        max: 2.5,
        step: 0.05,
        unit: "s",
        defaultValue: 0.95,
    },

    // ── 6. System & Session ──
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
