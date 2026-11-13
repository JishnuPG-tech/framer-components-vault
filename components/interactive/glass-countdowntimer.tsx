// Framer Component: Liquid Glass Countdown Timer

import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence, useAnimation } from "framer-motion"
import { useState, useEffect, useRef, useCallback } from "react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface TimeUnit {
    value: number
    prev: number
    label: string
}

interface CountdownTimerProps {
    targetDate: string
    title: string
    subtitle: string
    showDays: boolean
    showHours: boolean
    showMinutes: boolean
    showSeconds: boolean
    accentColor: string
    glassOpacity: number
    blurAmount: number
    showParticles: boolean
    onComplete: () => void
    completedMessage: string
    lightMode: boolean
    titleFontSize: number
    subtitleFontSize: number
    digitFontSize: number
    titleColor: string
    subtitleColor: string
    titleFont: { fontFamily?: string; fontWeight?: string; fontStyle?: string }
    subtitleFont: {
        fontFamily?: string
        fontWeight?: string
        fontStyle?: string
    }
    digitFont: { fontFamily?: string; fontWeight?: string; fontStyle?: string }
    style?: React.CSSProperties
}

// ─── Utility: parse & compute time left ──────────────────────────────────────

function getTimeLeft(targetDate: string) {
    const now = new Date().getTime()
    const target = new Date(targetDate).getTime()
    const diff = Math.max(0, target - now)

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return { days, hours, minutes, seconds, total: diff }
}

// ─── Floating Particle ────────────────────────────────────────────────────────

function Particle({ color }: { color: string }) {
    const isStatic = useIsStaticRenderer()
    // FIX [P1]: Do not render particles in static/canvas context
    if (isStatic) return null

    const size = Math.random() * 4 + 2
    const x = Math.random() * 100
    const duration = Math.random() * 8 + 6
    const delay = Math.random() * 4

    return (
        <motion.div
            style={{
                position: "absolute",
                bottom: -10,
                left: `${x}%`,
                width: size,
                height: size,
                borderRadius: "50%",
                background: color,
                opacity: 0.6,
                pointerEvents: "none",
            }}
            animate={{
                y: [0, -(Math.random() * 200 + 100)],
                x: [0, (Math.random() - 0.5) * 60],
                opacity: [0, 0.7, 0],
                scale: [0, 1, 0.5],
            }}
            transition={{
                duration,
                delay,
                repeat: Infinity,
                ease: "easeOut",
            }}
        />
    )
}

// ─── Flip Digit ───────────────────────────────────────────────────────────────

function FlipDigit({
    value,
    prevValue,
    accentColor,
    blurAmount,
    glassOpacity,
    lightMode,
    digitFontSize,
    digitFont,
}: {
    value: number
    prevValue: number
    accentColor: string
    blurAmount: number
    glassOpacity: number
    lightMode: boolean
    digitFontSize: number
    digitFont: { fontFamily?: string; fontWeight?: string; fontStyle?: string }
}) {
    const displayValue = String(value).padStart(2, "0")
    const hasChanged = value !== prevValue

    const glassStyle: React.CSSProperties = lightMode
        ? {
              background: `rgba(255,255,255,0.85)`,
              backdropFilter: `blur(${blurAmount}px) saturate(180%)`,
              WebkitBackdropFilter: `blur(${blurAmount}px) saturate(180%)`,
              border: `1px solid rgba(0,0,0,0.10)`,
              boxShadow: `
                0 4px 16px rgba(0,0,0,0.10),
                0 1px 4px rgba(0,0,0,0.08),
                inset 0 1px 0 rgba(255,255,255,0.95),
                0 0 0 1px rgba(0,0,0,0.04)
              `,
          }
        : {
              background: `rgba(255,255,255,${glassOpacity * 0.12})`,
              backdropFilter: `blur(${blurAmount}px) saturate(180%)`,
              WebkitBackdropFilter: `blur(${blurAmount}px) saturate(180%)`,
              border: `1px solid rgba(255,255,255,${glassOpacity * 0.3})`,
              boxShadow: `
                0 8px 32px rgba(0,0,0,0.15),
                inset 0 1px 0 rgba(255,255,255,${glassOpacity * 0.4}),
                inset 0 -1px 0 rgba(0,0,0,0.05),
                0 0 0 1px rgba(255,255,255,0.05)
              `,
          }

    return (
        <motion.div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                borderRadius: 8,
                overflow: "hidden",
                ...glassStyle,
            }}
            whileHover={{
                scale: 1.04,
                boxShadow: `
          0 16px 48px rgba(0,0,0,0.2),
          inset 0 1px 0 rgba(255,255,255,${glassOpacity * 0.5}),
          0 0 30px ${accentColor}40,
          0 0 0 1px ${accentColor}30
        `,
                borderColor: `${accentColor}60`,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: "10%",
                    right: "10%",
                    height: "1px",
                    background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)`,
                    borderRadius: "50%",
                    zIndex: 3,
                }}
            />
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(ellipse at 50% 0%, ${accentColor}15 0%, transparent 70%)`,
                    zIndex: 1,
                    borderRadius: 20,
                    pointerEvents: "none",
                }}
            />
            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                }}
            >
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                        key={displayValue}
                        initial={
                            hasChanged
                                ? { y: -40, opacity: 0, scale: 0.85 }
                                : false
                        }
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 40, opacity: 0, scale: 0.85 }}
                        transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                            mass: 0.8,
                        }}
                        style={{
                            position: "absolute",
                            fontSize: `${digitFontSize}px`,
                            fontWeight: digitFont.fontWeight || "800",
                            fontStyle: digitFont.fontStyle || "normal",
                            fontFamily:
                                digitFont.fontFamily || "system-ui, sans-serif",
                            color: lightMode
                                ? "rgba(20,20,40,0.90)"
                                : "rgba(255,255,255,0.95)",
                            letterSpacing: "-0.02em",
                            textShadow: `0 2px 20px ${accentColor}80, 0 0 40px ${accentColor}40`,
                            lineHeight: 1,
                        }}
                    >
                        {displayValue}
                    </motion.span>
                </AnimatePresence>
            </div>
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: "50%",
                    height: "1px",
                    background: lightMode
                        ? `rgba(0,0,0,0.08)`
                        : `rgba(0,0,0,0.15)`,
                    zIndex: 3,
                }}
            />
        </motion.div>
    )
}

// ─── Time Block ───────────────────────────────────────────────────────────────

function TimeBlock({
    unit,
    accentColor,
    blurAmount,
    glassOpacity,
    lightMode,
    digitFontSize,
    digitFont,
}: {
    unit: TimeUnit
    accentColor: string
    blurAmount: number
    glassOpacity: number
    lightMode: boolean
    digitFontSize: number
    digitFont: { fontFamily?: string; fontWeight?: string; fontStyle?: string }
}) {
    const [isDesktop, setIsDesktop] = useState(
        () => typeof window !== "undefined" && window.innerWidth >= 1024
    )
    const pulseControls = useAnimation()

    useEffect(() => {
        const handler = () => setIsDesktop(window.innerWidth >= 1024)
        window.addEventListener("resize", handler)
        return () => window.removeEventListener("resize", handler)
    }, [])

    useEffect(() => {
        if (unit.value !== unit.prev) {
            pulseControls.start({
                scale: [1, 1.06, 1],
                transition: { duration: 0.3, ease: "easeOut" },
            })
        }
    }, [unit.value])

    return (
        <motion.div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                flex: 1,
                minWidth: 0,
            }}
            animate={pulseControls}
        >
            <div
                style={{
                    aspectRatio: "1 / 1.1",
                    width: isDesktop ? 70 : 50,
                    position: "relative",
                }}
            >
                <FlipDigit
                    value={unit.value}
                    prevValue={unit.prev}
                    accentColor={accentColor}
                    blurAmount={blurAmount}
                    glassOpacity={glassOpacity}
                    lightMode={lightMode}
                    digitFontSize={digitFontSize}
                    digitFont={digitFont}
                />
            </div>

            <motion.span
                style={{
                    fontSize: "clamp(0.55rem, 1.5vw, 0.75rem)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: lightMode
                        ? `rgba(40,40,60,0.55)`
                        : `rgba(255,255,255,0.55)`,
                    fontFamily: digitFont.fontFamily || "system-ui, sans-serif",
                    textAlign: "center",
                }}
                whileHover={{
                    color: lightMode
                        ? "rgba(20,20,40,0.9)"
                        : "rgba(255,255,255,0.9)",
                    scale: 1.05,
                }}
                transition={{ duration: 0.2 }}
            >
                {unit.label}
            </motion.span>
        </motion.div>
    )
}

// ─── Separator ────────────────────────────────────────────────────────────────

function Separator({ accentColor }: { accentColor: string }) {
    const isStatic = useIsStaticRenderer()

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                alignItems: "center",
                justifyContent: "center",
                paddingBottom: 24,
                flexShrink: 0,
            }}
        >
            {[0, 1].map((i) =>
                // FIX [P1]: Static canvas — no infinite animation
                isStatic ? (
                    <div
                        key={i}
                        style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: accentColor,
                            opacity: 0.7,
                        }}
                    />
                ) : (
                    <motion.div
                        key={i}
                        style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: accentColor,
                            boxShadow: `0 0 8px ${accentColor}80`,
                        }}
                        animate={{ opacity: [1, 0.2, 1] }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeInOut",
                        }}
                    />
                )
            )}
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CountdownTimer({
    targetDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    title = "Launching Soon",
    subtitle = "Something extraordinary is coming.",
    showDays = true,
    showHours = true,
    showMinutes = true,
    showSeconds = true,
    accentColor = "#818CF8",
    glassOpacity = 0.7,
    blurAmount = 24,
    showParticles = true,
    onComplete,
    completedMessage = "We're Live!",
    lightMode = true,
    titleFontSize = 32,
    subtitleFontSize = 15,
    digitFontSize = 42,
    titleColor = "",
    subtitleColor = "",
    titleFont = {
        fontFamily: "'SF Pro Display', system-ui, sans-serif",
        fontWeight: "800",
    },
    subtitleFont = { fontFamily: "system-ui, sans-serif", fontWeight: "400" },
    digitFont = {
        fontFamily: "'SF Pro Display', system-ui, sans-serif",
        fontWeight: "800",
    },
    style,
}: Partial<CountdownTimerProps>) {
    const isStatic = useIsStaticRenderer()

    const initialTime = getTimeLeft(targetDate)
    const [timeUnits, setTimeUnits] = useState<TimeUnit[]>([])
    const [isComplete, setIsComplete] = useState(false)
    const prevRef = useRef({
        days: initialTime.days,
        hours: initialTime.hours,
        minutes: initialTime.minutes,
        seconds: initialTime.seconds,
    })

    const buildUnits = useCallback(
        (
            curr: ReturnType<typeof getTimeLeft>,
            prev: typeof prevRef.current
        ): TimeUnit[] => {
            const all: TimeUnit[] = [
                { value: curr.days, prev: prev.days, label: "Days" },
                { value: curr.hours, prev: prev.hours, label: "Hours" },
                { value: curr.minutes, prev: prev.minutes, label: "Minutes" },
                { value: curr.seconds, prev: prev.seconds, label: "Seconds" },
            ]
            const flags = [showDays, showHours, showMinutes, showSeconds]
            return all.filter((_, i) => flags[i])
        },
        [showDays, showHours, showMinutes, showSeconds]
    )

    useEffect(() => {
        const tick = () => {
            const current = getTimeLeft(targetDate)

            if (current.total === 0) {
                setIsComplete(true)
                setTimeUnits(buildUnits(current, prevRef.current))
                onComplete?.()
                return
            }

            setTimeUnits(() => {
                const newUnits = buildUnits(current, prevRef.current)
                prevRef.current = {
                    days: current.days,
                    hours: current.hours,
                    minutes: current.minutes,
                    seconds: current.seconds,
                }
                return newUnits
            })
        }

        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [targetDate, buildUnits])

    const totalDuration = new Date(targetDate).getTime() - Date.now()
    const progress = Math.min(
        1,
        Math.max(0, 1 - getTimeLeft(targetDate).total / (totalDuration || 1))
    )

    const containerGlass: React.CSSProperties = lightMode
        ? {
              background: `linear-gradient(135deg, rgba(255,255,255,0.80) 0%, rgba(255,255,255,0.65) 100%)`,
              backdropFilter: `blur(${blurAmount * 1.5}px) saturate(200%)`,
              WebkitBackdropFilter: `blur(${blurAmount * 1.5}px) saturate(200%)`,
              border: `1px solid rgba(0,0,0,0.10)`,
              boxShadow: `
                0 8px 24px rgba(0,0,0,0.12),
                0 2px 8px rgba(0,0,0,0.08),
                inset 0 1px 0 rgba(255,255,255,0.95),
                0 0 0 1px rgba(0,0,0,0.04)
              `,
          }
        : {
              background: `linear-gradient(135deg, rgba(255,255,255,${glassOpacity * 0.1}) 0%, rgba(255,255,255,${glassOpacity * 0.04}) 100%)`,
              backdropFilter: `blur(${blurAmount * 1.5}px) saturate(200%)`,
              WebkitBackdropFilter: `blur(${blurAmount * 1.5}px) saturate(200%)`,
              border: `1px solid rgba(255,255,255,${glassOpacity * 0.2})`,
              boxShadow: `
                0 4px 6px rgba(0,0,0,0.04),
                0 10px 40px rgba(0,0,0,0.10),
                0 20px 60px rgba(0,0,0,0.07),
                inset 0 1px 0 rgba(255,255,255,${glassOpacity * 0.3}),
                0 0 0 1px rgba(0,0,0,0.04)
              `,
          }

    const particles = Array.from({ length: 18 })

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                boxSizing: "border-box",
                position: "relative",
                overflow: "hidden",
                ...style,
            }}
        >
            {/* Background gradient orbs — FIX [P1]: disabled in static context */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    overflow: "hidden",
                }}
            >
                {isStatic ? (
                    <>
                        <div
                            style={{
                                position: "absolute",
                                width: "60%",
                                paddingBottom: "60%",
                                borderRadius: "50%",
                                background: `radial-gradient(circle, ${accentColor}25 0%, transparent 70%)`,
                                top: "-20%",
                                left: "-10%",
                                filter: "blur(40px)",
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                width: "50%",
                                paddingBottom: "50%",
                                borderRadius: "50%",
                                background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
                                bottom: "-15%",
                                right: "-5%",
                                filter: "blur(50px)",
                            }}
                        />
                    </>
                ) : (
                    <>
                        <motion.div
                            style={{
                                position: "absolute",
                                width: "60%",
                                paddingBottom: "60%",
                                borderRadius: "50%",
                                background: `radial-gradient(circle, ${accentColor}25 0%, transparent 70%)`,
                                top: "-20%",
                                left: "-10%",
                                filter: "blur(40px)",
                            }}
                            animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
                            transition={{
                                duration: 12,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                        <motion.div
                            style={{
                                position: "absolute",
                                width: "50%",
                                paddingBottom: "50%",
                                borderRadius: "50%",
                                background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
                                bottom: "-15%",
                                right: "-5%",
                                filter: "blur(50px)",
                            }}
                            animate={{ x: [0, -20, 0], y: [0, -30, 0] }}
                            transition={{
                                duration: 15,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 3,
                            }}
                        />
                    </>
                )}
            </div>

            {/* Particles — only in non-static context */}
            {showParticles &&
                !isStatic &&
                particles.map((_, i) => (
                    <Particle key={i} color={accentColor} />
                ))}

            {/* Main card */}
            <motion.div
                style={{
                    width: "100%",
                    maxWidth: 560,
                    borderRadius: 28,
                    padding: "36px 32px 32px",
                    boxSizing: "border-box",
                    position: "relative",
                    overflow: "visible",
                    ...containerGlass,
                }}
                initial={isStatic ? false : { opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                whileHover={{
                    boxShadow: `
            0 40px 100px rgba(0,0,0,0.3),
            inset 0 1px 0 rgba(255,255,255,${glassOpacity * 0.4}),
            0 0 100px ${accentColor}20
          `,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: "15%",
                        right: "15%",
                        height: "1px",
                        background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)`,
                        borderRadius: "50%",
                    }}
                />

                <AnimatePresence mode="wait">
                    {isComplete ? (
                        <motion.div
                            key="complete"
                            initial={
                                isStatic ? false : { opacity: 0, scale: 0.8 }
                            }
                            animate={{ opacity: 1, scale: 1 }}
                            exit={isStatic ? {} : { opacity: 0, scale: 0.8 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 20,
                            }}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 16,
                                padding: "24px 0",
                            }}
                        >
                            <motion.div
                                style={{
                                    fontSize: "clamp(3rem, 8vw, 5rem)",
                                    lineHeight: 1,
                                }}
                                animate={
                                    isStatic
                                        ? {}
                                        : {
                                              rotate: [0, -10, 10, -10, 0],
                                              scale: [1, 1.1, 1],
                                          }
                                }
                                transition={{
                                    duration: 0.6,
                                    repeat: Infinity,
                                    repeatDelay: 3,
                                }}
                            >
                                🎉
                            </motion.div>
                            <motion.h2
                                style={{
                                    fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                                    fontWeight: 800,
                                    color: lightMode
                                        ? "rgba(20,20,40,0.92)"
                                        : "rgba(255,255,255,0.95)",
                                    margin: 0,
                                    textAlign: "center",
                                    fontFamily:
                                        "'SF Pro Display', system-ui, sans-serif",
                                    textShadow: `0 0 30px ${accentColor}80`,
                                }}
                            >
                                {completedMessage}
                            </motion.h2>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="countdown"
                            initial={isStatic ? false : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={isStatic ? {} : { opacity: 0 }}
                        >
                            {/* Header */}
                            <div
                                style={{
                                    textAlign: "center",
                                    marginBottom: 28,
                                }}
                            >
                                {/* Badge */}
                                <motion.div
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                        background: `${accentColor}20`,
                                        border: `1px solid ${accentColor}40`,
                                        borderRadius: 100,
                                        padding: "4px 14px",
                                        marginBottom: 14,
                                    }}
                                    animate={
                                        isStatic
                                            ? {}
                                            : {
                                                  borderColor: [
                                                      `${accentColor}40`,
                                                      `${accentColor}80`,
                                                      `${accentColor}40`,
                                                  ],
                                              }
                                    }
                                    transition={{
                                        duration: 2.5,
                                        repeat: Infinity,
                                    }}
                                >
                                    <motion.div
                                        style={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: "50%",
                                            background: accentColor,
                                            boxShadow: `0 0 6px ${accentColor}`,
                                        }}
                                        animate={
                                            isStatic
                                                ? {}
                                                : { opacity: [1, 0.3, 1] }
                                        }
                                        transition={{
                                            duration: 1.2,
                                            repeat: Infinity,
                                        }}
                                    />
                                    <span
                                        style={{
                                            fontSize: "0.7rem",
                                            fontWeight: 600,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.1em",
                                            color: accentColor,
                                            fontFamily: "system-ui, sans-serif",
                                        }}
                                    >
                                        Countdown
                                    </span>
                                </motion.div>

                                <motion.h1
                                    style={{
                                        fontSize: `${titleFontSize}px`,
                                        fontWeight:
                                            titleFont.fontWeight || "800",
                                        fontStyle:
                                            titleFont.fontStyle || "normal",
                                        color: titleColor
                                            ? titleColor
                                            : lightMode
                                              ? "rgba(20,20,40,0.92)"
                                              : "rgba(255,255,255,0.95)",
                                        margin: "0 0 8px",
                                        lineHeight: 1.2,
                                        fontFamily:
                                            titleFont.fontFamily ||
                                            "system-ui, sans-serif",
                                        letterSpacing: "-0.02em",
                                    }}
                                    initial={
                                        isStatic
                                            ? false
                                            : { opacity: 0, y: -10 }
                                    }
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    {title}
                                </motion.h1>

                                <motion.p
                                    style={{
                                        fontSize: `${subtitleFontSize}px`,
                                        fontWeight:
                                            subtitleFont.fontWeight || "400",
                                        fontStyle:
                                            subtitleFont.fontStyle || "normal",
                                        color: subtitleColor
                                            ? subtitleColor
                                            : lightMode
                                              ? "rgba(60,60,80,0.60)"
                                              : "rgba(255,255,255,0.5)",
                                        margin: 0,
                                        fontFamily:
                                            subtitleFont.fontFamily ||
                                            "system-ui, sans-serif",
                                        lineHeight: 1.5,
                                    }}
                                    initial={isStatic ? false : { opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.35 }}
                                >
                                    {subtitle}
                                </motion.p>
                            </div>

                            {/* Digit blocks — FIX [P2]: key on React.Fragment */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "stretch",
                                    gap: "clamp(6px, 2vw, 14px)",
                                }}
                            >
                                {timeUnits.map((unit, i) => (
                                    <React.Fragment key={unit.label}>
                                        <TimeBlock
                                            unit={unit}
                                            accentColor={accentColor}
                                            blurAmount={blurAmount}
                                            glassOpacity={glassOpacity}
                                            lightMode={lightMode}
                                            digitFontSize={digitFontSize}
                                            digitFont={digitFont}
                                        />
                                        {i < timeUnits.length - 1 && (
                                            <Separator
                                                accentColor={accentColor}
                                            />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Footer */}
                            <motion.div
                                style={{
                                    marginTop: 24,
                                    paddingTop: 20,
                                    borderTop: lightMode
                                        ? "1px solid rgba(0,0,0,0.07)"
                                        : "1px solid rgba(255,255,255,0.08)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 12,
                                    flexWrap: "wrap",
                                }}
                                initial={isStatic ? false : { opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "100%",
                                            maxWidth: 140,
                                            height: 3,
                                            borderRadius: 100,
                                            background: lightMode
                                                ? "rgba(0,0,0,0.08)"
                                                : "rgba(255,255,255,0.1)",
                                            overflow: "hidden",
                                            position: "relative",
                                        }}
                                    >
                                        <motion.div
                                            style={{
                                                height: "100%",
                                                background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`,
                                                borderRadius: 100,
                                                boxShadow: `0 0 8px ${accentColor}`,
                                                width: `${progress * 100}%`,
                                            }}
                                            transition={{
                                                duration: 0.8,
                                                ease: "easeOut",
                                            }}
                                        />
                                    </div>
                                    <span
                                        style={{
                                            fontSize: "0.7rem",
                                            color: lightMode
                                                ? "rgba(60,60,80,0.45)"
                                                : "rgba(255,255,255,0.35)",
                                            fontFamily: "system-ui, sans-serif",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {(progress * 100).toFixed(1)}% elapsed
                                    </span>
                                </div>

                                <motion.div
                                    style={{
                                        fontSize: "0.7rem",
                                        color: lightMode
                                            ? "rgba(60,60,80,0.40)"
                                            : "rgba(255,255,255,0.3)",
                                        fontFamily: "system-ui, sans-serif",
                                        textAlign: "right",
                                    }}
                                >
                                    {new Date(targetDate).toLocaleDateString(
                                        undefined,
                                        {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        }
                                    )}
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}

// ─── Framer Property Controls ─────────────────────────────────────────────────

addPropertyControls(CountdownTimer, {
    lightMode: {
        type: ControlType.Boolean,
        title: "Light Mode",
        defaultValue: true,
        enabledTitle: "Light",
        disabledTitle: "Dark",
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Launching Soon",
        placeholder: "Event title...",
    },
    titleFontSize: {
        type: ControlType.Number,
        title: "Title Size",
        defaultValue: 32,
        min: 12,
        max: 72,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "Something extraordinary is coming.",
        placeholder: "Description...",
    },
    subtitleFontSize: {
        type: ControlType.Number,
        title: "Subtitle Size",
        defaultValue: 15,
        min: 10,
        max: 40,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    subtitleColor: {
        type: ControlType.Color,
        title: "Subtitle Color",
        defaultValue: "",
    },
    digitFontSize: {
        type: ControlType.Number,
        title: "Digit Size",
        defaultValue: 42,
        min: 16,
        max: 80,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        defaultValue: {
            fontFamily: "'SF Pro Display', system-ui, sans-serif",
            fontWeight: "800",
        },
        controls: "extended",
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Font",
        defaultValue: {
            fontFamily: "system-ui, sans-serif",
            fontWeight: "400",
        },
        controls: "extended",
    },
    digitFont: {
        type: ControlType.Font,
        title: "Digit Font",
        defaultValue: {
            fontFamily: "'SF Pro Display', system-ui, sans-serif",
            fontWeight: "800",
        },
        controls: "extended",
    },
    targetDate: {
        type: ControlType.String,
        title: "Target Date",
        defaultValue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10),
        placeholder: "YYYY-MM-DD",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#818CF8",
    },
    glassOpacity: {
        type: ControlType.Number,
        title: "Glass Opacity",
        defaultValue: 0.7,
        min: 0.1,
        max: 1,
        step: 0.05,
        displayStepper: true,
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur Amount",
        defaultValue: 24,
        min: 4,
        max: 60,
        step: 2,
        unit: "px",
        displayStepper: true,
    },
    showParticles: {
        type: ControlType.Boolean,
        title: "Particles",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showDays: {
        type: ControlType.Boolean,
        title: "Show Days",
        defaultValue: true,
    },
    showHours: {
        type: ControlType.Boolean,
        title: "Show Hours",
        defaultValue: true,
    },
    showMinutes: {
        type: ControlType.Boolean,
        title: "Show Minutes",
        defaultValue: true,
    },
    showSeconds: {
        type: ControlType.Boolean,
        title: "Show Seconds",
        defaultValue: true,
    },
    completedMessage: {
        type: ControlType.String,
        title: "Done Message",
        defaultValue: "We're Live!",
    },
    onComplete: {
        type: ControlType.EventHandler,
    },
})
