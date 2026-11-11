// Framer Code Component
// Created by Ahmet Loca
// File: countdown3.tsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useReducedMotion } from "framer-motion"

// ── Types ─────────────────────────────────────────────────────────────────────
interface TimeLeft {
    days: number
    hours: number
    minutes: number
    seconds: number
}

interface FontProps {
    fontFamily?: string
    fontSize?: string | number
    fontWeight?: string | number
    letterSpacing?: string
    lineHeight?: string | number
    variant?: string
    textAlign?: string
    [key: string]: string | number | undefined
}

interface Props {
    // Content
    title?: string
    description?: string
    // Countdown
    targetDate?: string
    showDays?: boolean
    showHours?: boolean
    showMinutes?: boolean
    showSeconds?: boolean
    daysLabel?: string
    hoursLabel?: string
    minutesLabel?: string
    secondsLabel?: string
    // Background
    backgroundType?: "none" | "image" | "video"
    backgroundImage?: string
    backgroundVideo?: string
    // Gradient
    gradientFrom?: string
    gradientVia?: string
    gradientTo?: string
    // Appearance
    borderRadius?: number
    cardRadius?: number
    accentColor?: string
    defaultTheme?: "dark" | "light"
    // Typography
    titleFont?: FontProps
    bodyFont?: FontProps
    uiFont?: FontProps
    numberFont?: FontProps
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function pad(n: number) {
    return n.toString().padStart(2, "0")
}

function calcTimeLeft(target: Date): TimeLeft {
    const now = Date.now()
    const diff = Math.max(0, target.getTime() - now)

    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
    }
}

function useContainerWidth(
    ref: React.RefObject<HTMLDivElement | null>,
    isStatic: boolean
) {
    const [width, setWidth] = useState(900)
    useEffect(() => {
        if (isStatic || !ref.current) return
        const ro = new ResizeObserver(([entry]) => {
            setWidth(entry.contentRect.width)
        })
        ro.observe(ref.current)
        return () => ro.disconnect()
    }, [isStatic])
    return width
}

/**
 * CinematicCountdown
 *
 * Cinematic single-card countdown using #121212 family gradient tones.
 * Soft-glass treatment, live timer, dark/light mode.
 * Optional background image or video.
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 480
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CinematicCountdown({
    title = "The window is closing",
    description = "Only a few days left to claim early access. Once the timer hits zero the doors open for everyone else.",
    targetDate = "2026-12-31T23:59:59",
    showDays = true,
    showHours = true,
    showMinutes = true,
    showSeconds = false,
    daysLabel = "Days",
    hoursLabel = "Hours",
    minutesLabel = "Minutes",
    secondsLabel = "Seconds",
    // Background
    backgroundType = "none",
    backgroundImage,
    backgroundVideo,
    // Default gradient – #121212 cinematic family
    gradientFrom = "#1a1a1a",
    gradientVia = "#121212",
    gradientTo = "#0e0e0e",
    borderRadius = 0,
    cardRadius = 20,
    accentColor = "#ffffff",
    defaultTheme = "dark",
    titleFont,
    bodyFont,
    uiFont,
    numberFont,
}: Props) {
    const isStatic = useIsStaticRenderer()
    const prefersReduced = useReducedMotion()
    const shouldAnimate = !isStatic && !prefersReduced

    const rootRef = useRef<HTMLDivElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const containerWidth = useContainerWidth(rootRef, isStatic)
    const isMobile = containerWidth < 640

    const [theme, setTheme] = useState<"dark" | "light">(defaultTheme)
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    })
    const [isVisible, setIsVisible] = useState(true)

    const target = useMemo(() => {
        const d = new Date(targetDate)
        return isNaN(d.getTime()) ? new Date(Date.now() + 86400000 * 28) : d
    }, [targetDate])

    // Live timer – fully guarded
    useEffect(() => {
        if (isStatic) {
            setTimeLeft({ days: 18, hours: 9, minutes: 42, seconds: 11 })
            return
        }

        setTimeLeft(calcTimeLeft(target))
        const id = setInterval(() => {
            setTimeLeft(calcTimeLeft(target))
        }, 1000)

        return () => clearInterval(id)
    }, [target, isStatic])

    useEffect(() => {
        if (isStatic) setTheme(defaultTheme)
    }, [defaultTheme, isStatic])

    // IntersectionObserver for video visibility
    useEffect(() => {
        if (isStatic || !rootRef.current) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting)
            },
            { threshold: 0.1 }
        )

        observer.observe(rootRef.current)

        return () => observer.disconnect()
    }, [isStatic])

    // Play / Pause video based on visibility
    useEffect(() => {
        if (isStatic || !videoRef.current) return

        const video = videoRef.current

        if (isVisible && backgroundType === "video" && backgroundVideo) {
            video.play().catch(() => {})
        } else {
            video.pause()
        }
    }, [isVisible, backgroundType, backgroundVideo, isStatic])

    const isDark = theme === "dark"

    // Tokens
    const tokens = useMemo(() => {
        if (isDark) {
            return {
                bg: "#0a0a0a",
                text: "rgba(255,255,255,0.96)",
                muted: "rgba(255,255,255,0.52)",
                subtle: "rgba(255,255,255,0.32)",
                glass: "rgba(255,255,255,0.05)",
                glassBorder: "rgba(255,255,255,0.1)",
                number: "#ffffff",
                label: "rgba(255,255,255,0.5)",
            }
        }
        return {
            bg: "#ffffff",
            text: "rgba(0,0,0,0.92)",
            muted: "rgba(0,0,0,0.52)",
            subtle: "rgba(0,0,0,0.32)",
            glass: "rgba(0,0,0,0.03)",
            glassBorder: "rgba(0,0,0,0.08)",
            number: "#111111",
            label: "rgba(0,0,0,0.5)",
        }
    }, [isDark])

    // Theme toggle
    const toggleTheme = useCallback(() => {
        if (isStatic) return
        setTheme((t) => (t === "dark" ? "light" : "dark"))
    }, [isStatic])

    const handleToggleKey = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                toggleTheme()
            }
        },
        [toggleTheme]
    )

    // Units
    const units = useMemo(() => {
        const list: { value: number; label: string; key: string }[] = []
        if (showDays)
            list.push({ value: timeLeft.days, label: daysLabel, key: "d" })
        if (showHours)
            list.push({ value: timeLeft.hours, label: hoursLabel, key: "h" })
        if (showMinutes)
            list.push({
                value: timeLeft.minutes,
                label: minutesLabel,
                key: "m",
            })
        if (showSeconds)
            list.push({
                value: timeLeft.seconds,
                label: secondsLabel,
                key: "s",
            })
        return list
    }, [
        timeLeft,
        showDays,
        showHours,
        showMinutes,
        showSeconds,
        daysLabel,
        hoursLabel,
        minutesLabel,
        secondsLabel,
    ])

    // Motion
    const fadeUp = {
        hidden: { opacity: 0, y: 18 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: 0.08 * i,
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
            },
        }),
    }

    // JSON-LD
    const jsonLd = useMemo(
        () => ({
            "@context": "https://schema.org",
            "@type": "Event",
            name: title,
            description: description,
            startDate: target.toISOString(),
            eventStatus: "https://schema.org/EventScheduled",
        }),
        [title, description, target]
    )

    const activeGradient = isDark
        ? `linear-gradient(105deg, ${gradientFrom} 0%, ${gradientVia} 50%, ${gradientTo} 100%)`
        : `linear-gradient(105deg, #f0f0f0 0%, #e8e8e8 50%, #e0e0e0 100%)`

    const hasMediaBackground =
        (backgroundType === "image" && !!backgroundImage) ||
        (backgroundType === "video" && !!backgroundVideo && !isStatic)

    return (
        <section
            ref={rootRef}
            aria-label="Cinematic countdown"
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: isMobile ? 420 : 460,
                background: tokens.bg,
                borderRadius: borderRadius,
                overflow: "hidden",
                boxSizing: "border-box",
                color: tokens.text,
                fontFamily:
                    bodyFont?.fontFamily ||
                    "'Helvetica Neue', Arial, sans-serif",
            }}
        >
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Background Image */}
            {backgroundType === "image" && backgroundImage && (
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: `url(${backgroundImage})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        zIndex: 0,
                    }}
                />
            )}

            {/* Background Video – only when NOT static */}
            {backgroundType === "video" && backgroundVideo && !isStatic && (
                <video
                    ref={videoRef}
                    src={backgroundVideo}
                    muted
                    loop
                    playsInline
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        zIndex: 0,
                    }}
                />
            )}

            {/* Soft overlay */}
            {hasMediaBackground && (
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: isDark
                            ? "rgba(0,0,0,0.55)"
                            : "rgba(255,255,255,0.45)",
                        zIndex: 1,
                        pointerEvents: "none",
                    }}
                />
            )}

            {/* Theme toggle */}
            <button
                type="button"
                aria-label={
                    isDark ? "Switch to light mode" : "Switch to dark mode"
                }
                aria-pressed={isDark}
                onClick={toggleTheme}
                onKeyDown={handleToggleKey}
                style={{
                    position: "absolute",
                    top: 18,
                    left: 18,
                    zIndex: 20,
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: `1px solid ${tokens.glassBorder}`,
                    background: tokens.glass,
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: isStatic ? "default" : "pointer",
                    color: tokens.text,
                    padding: 0,
                    outline: "none",
                    transition: isStatic
                        ? "none"
                        : "background 0.25s ease, border-color 0.25s ease",
                }}
            >
                {isDark ? (
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                    >
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                    </svg>
                ) : (
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                    >
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                )}
            </button>

            {/* Content */}
            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    padding: isMobile ? "56px 20px 40px" : "56px 48px 48px",
                    boxSizing: "border-box",
                    textAlign: "center",
                }}
            >
                {/* Title */}
                <motion.h1
                    custom={0}
                    initial={shouldAnimate ? "hidden" : false}
                    animate={shouldAnimate ? "visible" : false}
                    variants={fadeUp}
                    style={{
                        margin: 0,
                        maxWidth: 480,
                        color: tokens.text,
                        fontFamily:
                            titleFont?.fontFamily ||
                            "Georgia, 'Times New Roman', serif",
                        fontSize: isMobile
                            ? "26px"
                            : titleFont?.fontSize || "34px",
                        fontWeight: titleFont?.fontWeight || 400,
                        letterSpacing: titleFont?.letterSpacing || "-0.03em",
                        lineHeight: titleFont?.lineHeight || "1.15em",
                        ...(titleFont as React.CSSProperties),
                    }}
                >
                    {title}
                </motion.h1>

                {/* Description */}
                <motion.p
                    custom={1}
                    initial={shouldAnimate ? "hidden" : false}
                    animate={shouldAnimate ? "visible" : false}
                    variants={fadeUp}
                    style={{
                        margin: "14px 0 0",
                        maxWidth: 420,
                        color: tokens.muted,
                        fontFamily:
                            bodyFont?.fontFamily ||
                            "'Helvetica Neue', Arial, sans-serif",
                        fontSize: isMobile
                            ? "14px"
                            : bodyFont?.fontSize || "15px",
                        fontWeight: bodyFont?.fontWeight || 400,
                        letterSpacing: bodyFont?.letterSpacing || "0em",
                        lineHeight: bodyFont?.lineHeight || "1.55em",
                        ...(bodyFont as React.CSSProperties),
                    }}
                >
                    {description}
                </motion.p>

                {/* Gradient card */}
                <motion.div
                    custom={2}
                    initial={shouldAnimate ? "hidden" : false}
                    animate={shouldAnimate ? "visible" : false}
                    variants={fadeUp}
                    style={{
                        marginTop: isMobile ? 36 : 48,
                        width: "100%",
                        maxWidth: isMobile ? 340 : 520,
                        borderRadius: cardRadius,
                        background: activeGradient,
                        padding: isMobile ? "28px 16px" : "36px 24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-evenly",
                        boxShadow: isDark
                            ? "0 24px 48px rgba(0,0,0,0.5)"
                            : "0 20px 40px rgba(0,0,0,0.08)",
                        border: isDark
                            ? "1px solid rgba(255,255,255,0.06)"
                            : "1px solid rgba(0,0,0,0.05)",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: isDark
                                ? "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.15) 100%)"
                                : "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(0,0,0,0.02) 100%)",
                            pointerEvents: "none",
                        }}
                    />

                    {units.map((unit) => (
                        <div
                            key={unit.key}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 6,
                                position: "relative",
                                zIndex: 1,
                                minWidth: isMobile ? 64 : 90,
                            }}
                        >
                            <span
                                style={{
                                    color: tokens.number,
                                    fontFamily:
                                        numberFont?.fontFamily ||
                                        "Georgia, 'Times New Roman', serif",
                                    fontSize: isMobile
                                        ? "32px"
                                        : numberFont?.fontSize || "48px",
                                    fontWeight: numberFont?.fontWeight || 400,
                                    letterSpacing:
                                        numberFont?.letterSpacing || "-0.03em",
                                    lineHeight: numberFont?.lineHeight || "1em",
                                    ...(numberFont as React.CSSProperties),
                                }}
                            >
                                {unit.key === "d"
                                    ? unit.value
                                    : pad(unit.value)}
                            </span>

                            <span
                                style={{
                                    color: tokens.label,
                                    fontFamily:
                                        uiFont?.fontFamily ||
                                        "'Helvetica Neue', Arial, sans-serif",
                                    fontSize: isMobile
                                        ? "11px"
                                        : uiFont?.fontSize || "12px",
                                    fontWeight: uiFont?.fontWeight || 500,
                                    letterSpacing:
                                        uiFont?.letterSpacing || "0.04em",
                                    lineHeight: uiFont?.lineHeight || "1.3em",
                                    ...(uiFont as React.CSSProperties),
                                }}
                            >
                                {unit.label}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}

// ── Property Controls ─────────────────────────────────────────────────────────
addPropertyControls(CinematicCountdown, {
    defaultTheme: {
        type: ControlType.Enum,
        title: "Default Theme",
        options: ["dark", "light"],
        optionTitles: ["Dark", "Light"],
        defaultValue: "dark",
        displaySegmentedControl: true,
    },

    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "The window is closing",
        displayTextArea: true,
    },
    description: {
        type: ControlType.String,
        title: "Description",
        defaultValue:
            "Only a few days left to claim early access. Once the timer hits zero the doors open for everyone else.",
        displayTextArea: true,
    },

    targetDate: {
        type: ControlType.String,
        title: "Target Date",
        defaultValue: "2026-12-31T23:59:59",
        description: "ISO format: YYYY-MM-DDTHH:mm:ss",
    },
    showDays: {
        type: ControlType.Boolean,
        title: "Show Days",
        defaultValue: true,
    },
    daysLabel: {
        type: ControlType.String,
        title: "Days Label",
        defaultValue: "Days",
        hidden: (p) => !p.showDays,
    },
    showHours: {
        type: ControlType.Boolean,
        title: "Show Hours",
        defaultValue: true,
    },
    hoursLabel: {
        type: ControlType.String,
        title: "Hours Label",
        defaultValue: "Hours",
        hidden: (p) => !p.showHours,
    },
    showMinutes: {
        type: ControlType.Boolean,
        title: "Show Minutes",
        defaultValue: true,
    },
    minutesLabel: {
        type: ControlType.String,
        title: "Minutes Label",
        defaultValue: "Minutes",
        hidden: (p) => !p.showMinutes,
    },
    showSeconds: {
        type: ControlType.Boolean,
        title: "Show Seconds",
        defaultValue: false,
    },
    secondsLabel: {
        type: ControlType.String,
        title: "Seconds Label",
        defaultValue: "Seconds",
        hidden: (p) => !p.showSeconds,
    },

    backgroundType: {
        type: ControlType.Enum,
        title: "Background",
        options: ["none", "image", "video"],
        optionTitles: ["None (Solid)", "Image", "Video"],
        defaultValue: "none",
    },
    backgroundImage: {
        type: ControlType.Image,
        title: "Background Image",
        hidden: (p) => p.backgroundType !== "image",
    },
    backgroundVideo: {
        type: ControlType.File,
        title: "Background Video",
        allowedFileTypes: ["mp4", "webm", "mov", "ogg"],
        hidden: (p) => p.backgroundType !== "video",
    },

    gradientFrom: {
        type: ControlType.Color,
        title: "Gradient From",
        defaultValue: "#1a1a1a",
    },
    gradientVia: {
        type: ControlType.Color,
        title: "Gradient Via",
        defaultValue: "#121212",
    },
    gradientTo: {
        type: ControlType.Color,
        title: "Gradient To",
        defaultValue: "#0e0e0e",
    },

    borderRadius: {
        type: ControlType.Number,
        title: "Section Radius",
        defaultValue: 0,
        min: 0,
        max: 40,
        step: 2,
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 20,
        min: 8,
        max: 32,
        step: 2,
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#ffffff",
    },

    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "serif",
        defaultValue: {
            fontSize: "34px",
            variant: "Regular",
            letterSpacing: "-0.03em",
            lineHeight: "1.15em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.55em",
        },
    },
    uiFont: {
        type: ControlType.Font,
        title: "UI Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Medium",
            letterSpacing: "0.04em",
            lineHeight: "1.3em",
        },
    },
    numberFont: {
        type: ControlType.Font,
        title: "Number Font",
        controls: "extended",
        defaultFontType: "serif",
        defaultValue: {
            fontSize: "48px",
            variant: "Regular",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
    },
})
