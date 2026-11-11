// ═══════════════════════════════════════════════════════════════════
//   HORIZONTAL BAR PRELOADER — PRO STUDIO EDITION (HOBRO INSPIRED)
//   Framer Marketplace Certified with useIsStaticRenderer
//   Paste into Framer: Assets → Code → + → New Component
// ═══════════════════════════════════════════════════════════════════

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"

// ─── Component Props Interface ─────────────────────────────

interface BarPreloaderProps {
    // Background & Environment
    backgroundColor: string
    showVignette: boolean
    showNoise: boolean

    // Bar Appearance & Geometry
    barColor: string
    barGradientEnd: string
    useGradient: boolean
    showGlow: boolean
    glowColor: string
    barBorderRadius: number
    barPaddingVertical: number
    barPaddingHorizontal: number
    barVerticalPosition: number
    leftPadding: number

    // Text & Subtitle
    loadingText: string
    completeText: string
    barTextColor: string
    textSize: number
    font?: {
        fontFamily?: string
        fontSize?: number
        fontWeight?: number | string
        fontStyle?: string
        letterSpacing?: string
        lineHeight?: string
    }
    subtitleText: string
    subtitleColor: string
    subtitleSize: number
    subtitlePosition: string

    // Counter
    showCounter: boolean
    counterColor: string
    counterSize: number

    // Timing & Motion
    duration: number
    easing: string
    holdDuration: number

    // System
    showOncePerSession: boolean
    zIndex: number
}

// ─── Main Component ────────────────────────────────────────

function Bar_preloader(props: BarPreloaderProps) {
    const {
        backgroundColor = "#000000",
        showVignette = true,
        showNoise = false,

        barColor = "#ffffff",
        barGradientEnd = "#ffffff",
        useGradient = false,
        showGlow = false,
        glowColor = "rgba(255, 255, 255, 0.35)",
        barBorderRadius = 0,
        barPaddingVertical = 6,
        barPaddingHorizontal = 14,
        barVerticalPosition = 50,
        leftPadding = 0,

        loadingText = "LOADING...",
        completeText = "READY",
        barTextColor = "#000000",
        textSize = 12,
        font = {
            fontFamily: "Space Grotesk",
            fontWeight: 600,
        },
        subtitleText = "DIGITAL EXPERIENCE © 2026",
        subtitleColor = "rgba(255, 255, 255, 0.4)",
        subtitleSize = 10,
        subtitlePosition = "below",

        showCounter = true,
        counterColor = "#000000",
        counterSize = 12,

        duration = 2.5,
        easing = "ease-out",
        holdDuration = 0.35,

        showOncePerSession = false,
        zIndex = 9999,
    } = props

    // 1. Framer Static Renderer Check (Marketplace safety)
    const isStatic = useIsStaticRenderer()

    // 2. Component States
    const [progress, setProgress] = useState(isStatic ? 45 : 0)
    const [isComplete, setIsComplete] = useState(false)
    const [isExiting, setIsExiting] = useState(false)
    const [isDone, setIsDone] = useState(false)

    // 3. Typography Styles from Framer Font control
    const typographyStyles = useMemo(() => {
        if (!font)
            return {
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 600,
            }
        if (typeof font === "string")
            return { fontFamily: `"${font}", sans-serif`, fontWeight: 600 }
        return {
            fontFamily: font.fontFamily
                ? `"${font.fontFamily}", sans-serif`
                : '"Space Grotesk", sans-serif',
            fontWeight: font.fontWeight || 600,
            fontStyle: font.fontStyle || "normal",
            letterSpacing: font.letterSpacing || "0.12em",
        }
    }, [font])

    // 4. Session memory check
    useEffect(() => {
        if (isStatic) return
        if (showOncePerSession && typeof sessionStorage !== "undefined") {
            try {
                if (sessionStorage.getItem("barPreloaderShown") === "true") {
                    setIsDone(true)
                    return
                }
            } catch (e) {}
        }
    }, [showOncePerSession, isStatic])

    // 5. Progress animation & text state morph
    useEffect(() => {
        if (isStatic || isDone) return

        const startTime = performance.now()
        const totalMs = duration * 1000
        let rafId: number
        let holdTimeout: ReturnType<typeof setTimeout> | null = null

        function applyEasing(t: number): number {
            switch (easing) {
                case "linear":
                    return t
                case "ease-out":
                    return 1 - Math.pow(1 - t, 3)
                case "ease-in-out":
                    return t < 0.5
                        ? 4 * t * t * t
                        : 1 - Math.pow(-2 * t + 2, 3) / 2
                default:
                    return 1 - Math.pow(1 - t, 3)
            }
        }

        function tick() {
            const elapsed = performance.now() - startTime
            const rawProgress = Math.min(elapsed / totalMs, 1)
            const easedProgress = applyEasing(rawProgress)
            const currentPct = Math.floor(easedProgress * 100)
            setProgress(currentPct)

            if (rawProgress < 1) {
                rafId = requestAnimationFrame(tick)
            } else {
                // Bar reached 100%
                setIsComplete(true)
                // Hold briefly at 100% so users enjoy the completed state
                holdTimeout = setTimeout(() => {
                    setIsExiting(true)
                    if (
                        showOncePerSession &&
                        typeof sessionStorage !== "undefined"
                    ) {
                        try {
                            sessionStorage.setItem("barPreloaderShown", "true")
                        } catch (e) {}
                    }
                }, holdDuration * 1000)
            }
        }

        rafId = requestAnimationFrame(tick)
        return () => {
            if (rafId) cancelAnimationFrame(rafId)
            if (holdTimeout) clearTimeout(holdTimeout)
        }
    }, [duration, easing, holdDuration, isDone, isStatic, showOncePerSession])

    // 6. Cleanup after exit animation
    useEffect(() => {
        if (isStatic || !isExiting) return
        const timer = setTimeout(() => setIsDone(true), 700)
        return () => clearTimeout(timer)
    }, [isExiting, isStatic])

    // ─── Early return only AFTER all hooks ───
    if (isDone && !isStatic) return null

    const currentText = isComplete ? completeText || loadingText : loadingText

    return (
        <AnimatePresence>
            {(!isDone || isStatic) && (
                <motion.div
                    key="bar-preloader"
                    initial={false}
                    animate={{ y: 0 }}
                    exit={
                        isStatic
                            ? undefined
                            : {
                                  y: "-100%",
                                  transition: {
                                      duration: 0.6,
                                      ease: [0.76, 0, 0.24, 1],
                                  },
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
                        backgroundColor,
                        zIndex: isStatic ? 1 : zIndex,
                        overflow: "hidden",
                        pointerEvents: isExiting && !isStatic ? "none" : "auto",
                    }}
                >
                    {/* Optional Radial Vignette for Depth */}
                    {showVignette && (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                background:
                                    "radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.6) 100%)",
                                zIndex: 1,
                            }}
                        />
                    )}

                    {/* Optional Film Grain Texture */}
                    {showNoise && (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                opacity: 0.04,
                                pointerEvents: "none",
                                zIndex: 2,
                                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                            }}
                        />
                    )}

                    {/* ─── Main Bar & Content Wrapper ─── */}
                    <div
                        style={{
                            position: "absolute",
                            left: leftPadding,
                            right: 0,
                            top: `${barVerticalPosition}%`,
                            transform: "translateY(-50%)",
                            zIndex: 4,
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                        }}
                    >
                        {/* Subtitle Above Bar (if selected) */}
                        {subtitleText && subtitlePosition === "above" && (
                            <span
                                style={{
                                    color: subtitleColor,
                                    fontSize: subtitleSize,
                                    letterSpacing: "0.18em",
                                    textTransform: "uppercase",
                                    userSelect: "none",
                                    paddingLeft: Math.max(
                                        leftPadding ? 0 : 8,
                                        4
                                    ),
                                    ...typographyStyles,
                                    fontWeight: 400,
                                }}
                            >
                                {subtitleText}
                            </span>
                        )}

                        {/* The Growing Bar */}
                        <div
                            style={{
                                width: `${progress}%`,
                                minWidth: 40,
                                background: useGradient
                                    ? `linear-gradient(90deg, ${barColor} 0%, ${barGradientEnd} 100%)`
                                    : barColor,
                                borderRadius: barBorderRadius,
                                boxShadow: showGlow
                                    ? `0 0 24px ${glowColor}`
                                    : "none",
                                paddingTop: barPaddingVertical,
                                paddingBottom: barPaddingVertical,
                                paddingLeft: barPaddingHorizontal,
                                paddingRight: barPaddingHorizontal,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                minHeight: textSize + barPaddingVertical * 2,
                                transition: isStatic
                                    ? "none"
                                    : "width 0.05s linear",
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {/* Loading Text */}
                            {currentText && (
                                <motion.span
                                    key={currentText}
                                    initial={{ opacity: 0, y: 2 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{
                                        color: barTextColor,
                                        fontSize: textSize,
                                        letterSpacing: "0.12em",
                                        textTransform: "uppercase",
                                        userSelect: "none",
                                        whiteSpace: "nowrap",
                                        ...typographyStyles,
                                    }}
                                >
                                    {currentText}
                                </motion.span>
                            )}

                            {/* Optional Percentage Counter Inside Bar */}
                            {showCounter && (
                                <span
                                    style={{
                                        color: counterColor || barTextColor,
                                        fontSize: counterSize,
                                        fontVariantNumeric: "tabular-nums",
                                        userSelect: "none",
                                        whiteSpace: "nowrap",
                                        marginLeft: 16,
                                        ...typographyStyles,
                                    }}
                                >
                                    {isStatic
                                        ? "45%"
                                        : `${String(progress).padStart(2, "0")}%`}
                                </span>
                            )}
                        </div>

                        {/* Subtitle Below Bar (if selected) */}
                        {subtitleText && subtitlePosition === "below" && (
                            <span
                                style={{
                                    color: subtitleColor,
                                    fontSize: subtitleSize,
                                    letterSpacing: "0.18em",
                                    textTransform: "uppercase",
                                    userSelect: "none",
                                    paddingLeft: Math.max(
                                        leftPadding ? 0 : 8,
                                        4
                                    ),
                                    ...typographyStyles,
                                    fontWeight: 400,
                                }}
                            >
                                {subtitleText}
                            </span>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default Bar_preloader

// ─── Framer Property Controls ──────────────────────────────

addPropertyControls(Bar_preloader, {
    // ── 1. Text & Content ──
    loadingText: {
        type: ControlType.String,
        title: "Loading Text",
        defaultValue: "LOADING...",
        placeholder: "e.g. LOADING...",
        description: "Text inside the bar during progress",
    },
    completeText: {
        type: ControlType.String,
        title: "Complete Text",
        defaultValue: "READY",
        placeholder: "e.g. COMPLETE",
        description: "Text morph state when bar hits 100%",
    },
    barTextColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
        description: "Color of the text inside the bar",
    },
    textSize: {
        type: ControlType.Number,
        title: "Text Size",
        defaultValue: 12,
        min: 8,
        max: 28,
        step: 1,
        unit: "px",
        description: "Font size of loading text",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
    },

    // ── 2. Bar Style & Colors ──
    barColor: {
        type: ControlType.Color,
        title: "Bar Color",
        defaultValue: "#ffffff",
        description: "Primary bar fill color",
    },
    useGradient: {
        type: ControlType.Boolean,
        title: "Gradient Fill",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Enable smooth horizontal gradient on the bar",
    },
    barGradientEnd: {
        type: ControlType.Color,
        title: "Gradient End",
        defaultValue: "#00f0ff",
        hidden: (props: any) => !props.useGradient,
        description: "End color for the gradient bar",
    },
    showGlow: {
        type: ControlType.Boolean,
        title: "Bar Glow",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Soft glowing shadow behind the bar",
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "rgba(255, 255, 255, 0.4)",
        hidden: (props: any) => !props.showGlow,
        description: "Color of the glowing drop shadow",
    },
    barBorderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 0,
        min: 0,
        max: 30,
        step: 1,
        unit: "px",
        description: "0 = sharp brutalist, higher = sleek rounded pill",
    },
    barPaddingVertical: {
        type: ControlType.Number,
        title: "Padding Y",
        defaultValue: 6,
        min: 2,
        max: 24,
        step: 1,
        unit: "px",
        description: "Vertical padding inside the bar",
    },
    barPaddingHorizontal: {
        type: ControlType.Number,
        title: "Padding X",
        defaultValue: 14,
        min: 4,
        max: 40,
        step: 2,
        unit: "px",
        description: "Horizontal padding inside the bar",
    },

    // ── 3. Position & Layout ──
    barVerticalPosition: {
        type: ControlType.Number,
        title: "Vertical Pos",
        defaultValue: 50,
        min: 5,
        max: 95,
        step: 1,
        unit: "%",
        description: "Vertical position on screen (50% = middle)",
    },
    leftPadding: {
        type: ControlType.Number,
        title: "Left Margin",
        defaultValue: 0,
        min: 0,
        max: 200,
        step: 4,
        unit: "px",
        description: "Left gap from screen edge (0 = edge flush)",
    },

    // ── 4. Subtitle / Agency Tagline ──
    subtitleText: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "DIGITAL EXPERIENCE © 2026",
        placeholder: "e.g. CREATIVE STUDIO",
        description: "Secondary agency tagline or copyright label",
    },
    subtitleColor: {
        type: ControlType.Color,
        title: "Subtitle Color",
        defaultValue: "rgba(255, 255, 255, 0.4)",
        hidden: (props: any) => !props.subtitleText,
        description: "Color of the subtitle text",
    },
    subtitleSize: {
        type: ControlType.Number,
        title: "Subtitle Size",
        defaultValue: 10,
        min: 8,
        max: 20,
        step: 1,
        unit: "px",
        hidden: (props: any) => !props.subtitleText,
        description: "Font size of the subtitle",
    },
    subtitlePosition: {
        type: ControlType.Enum,
        title: "Subtitle Pos",
        defaultValue: "below",
        options: ["above", "below"],
        optionTitles: ["Above Bar", "Below Bar"],
        hidden: (props: any) => !props.subtitleText,
        description: "Position of the subtitle relative to the bar",
    },

    // ── 5. Numeric Counter ──
    showCounter: {
        type: ControlType.Boolean,
        title: "Counter",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "Display live numeric percentage inside the bar",
    },
    counterColor: {
        type: ControlType.Color,
        title: "Counter Color",
        defaultValue: "#000000",
        hidden: (props: any) => !props.showCounter,
        description: "Color of the percentage numbers",
    },
    counterSize: {
        type: ControlType.Number,
        title: "Counter Size",
        defaultValue: 12,
        min: 8,
        max: 24,
        step: 1,
        unit: "px",
        hidden: (props: any) => !props.showCounter,
        description: "Font size of the counter",
    },

    // ── 6. Motion & Timing ──
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 2.5,
        min: 0.5,
        max: 8,
        step: 0.1,
        unit: "s",
        description: "Time to fill from 0% to 100%",
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        defaultValue: "ease-out",
        options: ["linear", "ease-out", "ease-in-out"],
        optionTitles: ["Linear", "Ease Out", "Ease In-Out"],
        description: "Progress acceleration curve",
    },
    holdDuration: {
        type: ControlType.Number,
        title: "Hold at 100%",
        defaultValue: 0.35,
        min: 0.1,
        max: 2,
        step: 0.05,
        unit: "s",
        description: "Pause at completion before exit wipe",
    },

    // ── 7. Extras & Environment ──
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
        description: "Full-screen background color",
    },
    showVignette: {
        type: ControlType.Boolean,
        title: "Vignette",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Subtle radial depth vignette",
    },
    showNoise: {
        type: ControlType.Boolean,
        title: "Film Grain",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Tactile film grain overlay",
    },
    showOncePerSession: {
        type: ControlType.Boolean,
        title: "Once / Session",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        description: "Only display on first page visit",
    },
    zIndex: {
        type: ControlType.Number,
        title: "Z-Index",
        defaultValue: 9999,
        min: 1,
        max: 99999,
        step: 1,
        description: "Stack order of the preloader",
    },
})
