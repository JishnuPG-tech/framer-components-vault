// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React, { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

// ─── Color Utilities ──────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace("#", "").padEnd(6, "0")
    return [
        parseInt(h.slice(0, 2), 16) || 0,
        parseInt(h.slice(2, 4), 16) || 0,
        parseInt(h.slice(4, 6), 16) || 0,
    ]
}

function lerpColor(a: string, b: string, t: number): string {
    try {
        const [ar, ag, ab] = hexToRgb(a)
        const [br, bg, bb] = hexToRgb(b)
        return `rgb(${Math.round(ar + (br - ar) * t)},${Math.round(ag + (bg - ag) * t)},${Math.round(ab + (bb - ab) * t)})`
    } catch {
        return a
    }
}

function getRangeColor(
    ratio: number,
    low: string,
    mid: string,
    high: string
): string {
    const t = Math.max(0, Math.min(1, ratio))
    if (t <= 0.5) return lerpColor(low, mid, t * 2)
    return lerpColor(mid, high, (t - 0.5) * 2)
}

// ─── Size Presets ─────────────────────────────────────────────────────────────

const SIZE_MAP: Record<string, number> = {
    xs: 20,
    sm: 28,
    md: 40,
    lg: 56,
    xl: 72,
}
const DEMO_SIZE_MAP: Record<string, number> = { S: 28, M: 40, L: 56 }

// ─── Demo Panel UI ────────────────────────────────────────────────────────────

function DemoToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
        <div
            onClick={onToggle}
            style={{
                width: 44,
                height: 26,
                borderRadius: 999,
                background: on
                    ? "rgba(255,255,255,0.92)"
                    : "rgba(255,255,255,0.10)",
                position: "relative",
                cursor: "pointer",
                flexShrink: 0,
                transition: "background 0.2s",
            }}
        >
            <motion.div
                animate={{ x: on ? 20 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
                style={{
                    position: "absolute",
                    top: 3,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: on ? "#111" : "rgba(255,255,255,0.45)",
                }}
            />
        </div>
    )
}

function DemoSegment<T extends string>({
    options,
    labels,
    value,
    onChange,
}: {
    options: T[]
    labels: string[]
    value: T
    onChange: (v: T) => void
}) {
    return (
        <div
            style={{
                display: "flex",
                borderRadius: 999,
                background: "rgba(255,255,255,0.07)",
                overflow: "hidden",
                cursor: "pointer",
            }}
        >
            {options.map((opt, i) => (
                <div
                    key={opt}
                    onClick={() => onChange(opt)}
                    style={{
                        padding: "5px 9px",
                        background:
                            opt === value
                                ? "rgba(255,255,255,0.88)"
                                : "transparent",
                        color:
                            opt === value ? "#111" : "rgba(255,255,255,0.38)",
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: "system-ui, sans-serif",
                        letterSpacing: "0.03em",
                        transition: "all 0.15s",
                        userSelect: "none",
                    }}
                >
                    {labels[i]}
                </div>
            ))}
        </div>
    )
}

function DemoPanel({
    size,
    setSize,
    glow,
    setGlow,
    label,
    setLabel,
    labelStyle,
    setLabelStyle,
    bar,
    setBar,
    anim,
    setAnim,
    wave,
    setWave,
    theme,
    setTheme,
}: {
    size: "S" | "M" | "L"
    setSize: (v: "S" | "M" | "L") => void
    glow: boolean
    setGlow: (v: boolean) => void
    label: boolean
    setLabel: (v: boolean) => void
    labelStyle: "score" | "fraction" | "percent" | "label"
    setLabelStyle: (v: "score" | "fraction" | "percent" | "label") => void
    bar: boolean
    setBar: (v: boolean) => void
    anim: boolean
    setAnim: (v: boolean) => void
    wave: boolean
    setWave: (v: boolean) => void
    theme: "dark" | "light"
    setTheme: (v: "dark" | "light") => void
}) {
    const labelStyle_ = {
        fontSize: 10,
        fontWeight: 700,
        color: "rgba(255,255,255,0.32)",
        letterSpacing: "0.09em",
        textTransform: "uppercase" as const,
        fontFamily: "system-ui, sans-serif",
        userSelect: "none" as const,
    }

    const item = (title: string, ctrl: React.ReactNode) => (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 9,
                padding: "0 18px",
            }}
        >
            <span style={labelStyle_}>{title}</span>
            {ctrl}
        </div>
    )

    const divider = (
        <div
            style={{
                width: 1,
                height: 44,
                background: "rgba(255,255,255,0.07)",
                alignSelf: "center",
                flexShrink: 0,
            }}
        />
    )

    // Wrap each (item + divider) as one unit so they never split across rows
    const group = (title: string, ctrl: React.ReactNode, isLast = false) => (
        <div style={{ display: "flex", alignItems: "center" }}>
            {item(title, ctrl)}
            {!isLast && divider}
        </div>
    )

    return (
        <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center",
                rowGap: 8,
                background: "rgba(16,16,16,0.94)",
                borderRadius: 20,
                padding: "14px 6px",
                border: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(16px)",
                boxShadow:
                    "0 12px 40px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset",
                width: "100%",
            }}
        >
            {group(
                "SIZE",
                <DemoSegment
                    options={["S", "M", "L"] as ("S" | "M" | "L")[]}
                    labels={["S", "M", "L"]}
                    value={size}
                    onChange={setSize}
                />
            )}
            {group(
                "GLOW",
                <DemoToggle on={glow} onToggle={() => setGlow(!glow)} />
            )}
            {group(
                "LABEL",
                <DemoToggle on={label} onToggle={() => setLabel(!label)} />
            )}
            {group(
                "STYLE",
                <DemoSegment
                    options={
                        ["score", "fraction", "percent", "label"] as (
                            | "score"
                            | "fraction"
                            | "percent"
                            | "label"
                        )[]
                    }
                    labels={["#", "÷", "%", "A"]}
                    value={labelStyle}
                    onChange={setLabelStyle}
                />
            )}
            {group(
                "BAR",
                <DemoToggle on={bar} onToggle={() => setBar(!bar)} />
            )}
            {group(
                "ANIM",
                <DemoToggle on={anim} onToggle={() => setAnim(!anim)} />
            )}
            {group(
                "WAVE",
                <DemoToggle on={wave} onToggle={() => setWave(!wave)} />
            )}
            {group(
                "THEME",
                <DemoSegment
                    options={["dark", "light"] as ("dark" | "light")[]}
                    labels={["D", "L"]}
                    value={theme}
                    onChange={setTheme}
                />,
                true
            )}
        </motion.div>
    )
}

// ─── Star SVG ────────────────────────────────────────────────────────────────

function StarIcon({
    filled,
    half,
    size,
    fillColor,
    emptyColor,
    strokeWidth,
    glowSize,
}: {
    filled: boolean
    half: boolean
    size: number
    fillColor: string
    emptyColor: string
    strokeWidth: number
    glowSize: number
}) {
    const id = React.useId()
    const path =
        "M12 2.5l2.83 5.73 6.32.92-4.57 4.45 1.08 6.28L12 16.9l-5.66 2.98 1.08-6.28L2.85 9.15l6.32-.92L12 2.5z"
    const glow =
        glowSize > 0 && (filled || half)
            ? `drop-shadow(0 0 ${glowSize}px ${fillColor})`
            : undefined

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: glow, display: "block" }}
        >
            {half && (
                <defs>
                    <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
                        <stop offset="50%" stopColor={fillColor} />
                        <stop offset="50%" stopColor="transparent" />
                    </linearGradient>
                </defs>
            )}
            <path
                d={path}
                fill={filled ? fillColor : half ? `url(#${id})` : "transparent"}
                stroke={filled || half ? fillColor : emptyColor}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    )
}

// ─── Burst Particle ───────────────────────────────────────────────────────────

function Burst({
    active,
    color,
    size,
}: {
    active: boolean
    color: string
    size: number
}) {
    const count = 8
    const radius = size * 0.9
    return (
        <AnimatePresence>
            {active &&
                Array.from({ length: count }).map((_, i) => {
                    const angle = (i / count) * 360
                    const rad = (angle * Math.PI) / 180
                    const x = Math.cos(rad) * radius
                    const y = Math.sin(rad) * radius
                    return (
                        <motion.div
                            key={i}
                            style={{
                                position: "absolute",
                                width: size * 0.12,
                                height: size * 0.12,
                                borderRadius: "50%",
                                backgroundColor: color,
                                top: "50%",
                                left: "50%",
                                marginTop: -(size * 0.06),
                                marginLeft: -(size * 0.06),
                                pointerEvents: "none",
                            }}
                            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                            animate={{ x, y, opacity: 0, scale: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    )
                })}
        </AnimatePresence>
    )
}

// ─── Single Star ──────────────────────────────────────────────────────────────

function Star({
    index,
    value,
    hoverValue,
    allowHalf,
    size,
    fillColor,
    emptyColor,
    strokeWidth,
    glowSize,
    onHover,
    onLeave,
    onClick,
    animate: shouldAnimate,
    waveDelay,
}: {
    index: number
    value: number
    hoverValue: number | null
    allowHalf: boolean
    size: number
    fillColor: string
    emptyColor: string
    strokeWidth: number
    glowSize: number
    onHover: (v: number) => void
    onLeave: () => void
    onClick: (v: number) => void
    animate: boolean
    waveDelay: number
}) {
    const [burst, setBurst] = useState(false)
    const active = hoverValue !== null ? hoverValue : value
    const isFilled = active >= index + 1
    const isHalf = allowHalf && !isFilled && active >= index + 0.5

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!allowHalf) {
                onHover(index + 1)
                return
            }
            const rect = e.currentTarget.getBoundingClientRect()
            onHover(
                e.clientX - rect.left < rect.width / 2 ? index + 0.5 : index + 1
            )
        },
        [index, allowHalf, onHover]
    )

    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            let v = index + 1
            if (allowHalf) {
                const rect = e.currentTarget.getBoundingClientRect()
                v =
                    e.clientX - rect.left < rect.width / 2
                        ? index + 0.5
                        : index + 1
            }
            onClick(v)
            if (shouldAnimate) {
                setBurst(true)
                setTimeout(() => setBurst(false), 600)
            }
        },
        [index, allowHalf, onClick, shouldAnimate]
    )

    const starValue = index + 1
    const ariaLabel = `${starValue} ${starValue === 1 ? "star" : "stars"}`

    return (
        <div
            role="radio"
            aria-label={ariaLabel}
            aria-checked={isFilled}
            tabIndex={-1}
            style={{
                position: "relative",
                cursor: "pointer",
                display: "inline-flex",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={onLeave}
            onClick={handleClick}
        >
            <motion.div
                animate={shouldAnimate && isFilled ? "filled" : "idle"}
                whileHover={shouldAnimate ? "hovered" : undefined}
                whileTap={shouldAnimate ? "tapped" : undefined}
                variants={{
                    idle: {
                        scale: 1,
                        rotate: 0,
                        transition: {
                            type: "spring",
                            stiffness: 400,
                            damping: 15,
                        },
                    },
                    filled: {
                        scale: [1, 1.18, 1],
                        rotate: [0, -10, 10, 0],
                        transition: {
                            type: "spring",
                            stiffness: 400,
                            damping: 15,
                            delay: waveDelay,
                        },
                    },
                    hovered: {
                        scale: 1.2,
                        transition: {
                            type: "spring",
                            stiffness: 500,
                            damping: 20,
                        },
                    },
                    tapped: {
                        scale: 0.9,
                        transition: {
                            type: "spring",
                            stiffness: 500,
                            damping: 20,
                        },
                    },
                }}
                style={{ display: "inline-flex" }}
            >
                <StarIcon
                    filled={isFilled}
                    half={isHalf}
                    size={size}
                    fillColor={fillColor}
                    emptyColor={emptyColor}
                    strokeWidth={strokeWidth}
                    glowSize={glowSize}
                />
            </motion.div>
            {shouldAnimate && (
                <Burst active={burst} color={fillColor} size={size} />
            )}
        </div>
    )
}

// ─── Label ────────────────────────────────────────────────────────────────────

function RatingLabel({
    value,
    max,
    showCount,
    reviewCount,
    fontSize,
    fontFamily,
    textColor,
    labelStyle,
}: {
    value: number
    max: number
    showCount: boolean
    reviewCount: number
    fontSize: number
    fontFamily: string
    textColor: string
    labelStyle: "score" | "fraction" | "percent" | "label"
}) {
    const labels = ["Terrible", "Poor", "Fair", "Good", "Excellent"]
    const labelIndex = Math.min(Math.ceil(value) - 1, max - 1)
    let text = ""
    if (labelStyle === "score") text = value.toFixed(1)
    else if (labelStyle === "fraction") text = `${value.toFixed(1)} / ${max}`
    else if (labelStyle === "percent")
        text = `${Math.round((value / max) * 100)}%`
    else
        text = value > 0 ? labels[Math.min(labelIndex, labels.length - 1)] : "—"

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily,
                fontSize,
                color: textColor,
                userSelect: "none",
            }}
        >
            <span style={{ fontWeight: 700 }}>{text}</span>
            {showCount && (
                <span style={{ opacity: 0.5 }}>
                    ({reviewCount.toLocaleString()})
                </span>
            )}
        </div>
    )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function RatingBar({
    value,
    max,
    fillColor,
    trackColor,
    height,
    radius,
    animated,
}: {
    value: number
    max: number
    fillColor: string
    trackColor: string
    height: number
    radius: number
    animated: boolean
}) {
    const pct = Math.min(Math.max(value / max, 0), 1) * 100
    return (
        <div
            style={{
                width: "100%",
                height,
                borderRadius: radius,
                backgroundColor: trackColor,
                overflow: "hidden",
            }}
        >
            <motion.div
                style={{
                    height: "100%",
                    backgroundColor: fillColor,
                    borderRadius: radius,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={
                    animated
                        ? { duration: 0.6, ease: "easeOut" }
                        : { duration: 0 }
                }
            />
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerDisableUnlink
 * @framerIntrinsicWidth 240
 * @framerIntrinsicHeight 48
 *
 * Rating Stars Pro — Smooth animated star rating system for Framer.
 * Supports half stars, wave fill animation, dynamic color range, glow effect,
 * rating bar, size presets, and an interactive demo mode panel.
 * Fully keyboard accessible (arrow keys, Home, End).
 * Use cases: e-commerce product ratings, user feedback forms, movie/content ratings, app-like rating bars.
 */
export default function RatingStarsPro(props: {
    defaultValue: number
    maxStars: number
    readOnly: boolean
    allowHalf: boolean
    sizePreset: "xs" | "sm" | "md" | "lg" | "xl" | "custom"
    starSize: number
    gap: number
    fillColor: string
    emptyColor: string
    strokeWidth: number
    colorRange: boolean
    colorLow: string
    colorMid: string
    colorHigh: string
    showGlow: boolean
    glowSize: number
    labelPosition: "right" | "left" | "bottom" | "top"
    showLabel: boolean
    labelStyle: "score" | "fraction" | "percent" | "label"
    showReviewCount: boolean
    reviewCount: number
    fontSize: number
    fontFamily: string
    textColor: string
    showBar: boolean
    barHeight: number
    barRadius: number
    barTrackColor: string
    animated: boolean
    animStyle: "instant" | "wave"
    demoMode: boolean
    onRatingChange: (v: number) => void
}) {
    const {
        defaultValue = 3,
        maxStars = 5,
        readOnly = false,
        allowHalf = true,
        sizePreset = "md",
        starSize = 40,
        gap = 8,
        fillColor = "#F5C518",
        emptyColor = "#9CA3AF",
        strokeWidth = 1.5,
        colorRange = false,
        colorLow = "#EF4444",
        colorMid = "#F5C518",
        colorHigh = "#22C55E",
        showGlow = false,
        glowSize = 8,
        labelPosition = "right",
        showLabel = true,
        labelStyle = "score",
        showReviewCount = false,
        reviewCount = 1284,
        fontSize = 16,
        fontFamily = "Inter, sans-serif",
        textColor = "#FFFFFF",
        showBar = false,
        barHeight = 6,
        barRadius = 999,
        barTrackColor = "rgba(255,255,255,0.12)",
        animated = true,
        animStyle = "instant",
        demoMode = false,
        onRatingChange,
    } = props

    // ── Demo state (overrides props when demoMode is on)
    const [demoSz, setDemoSz] = useState<"S" | "M" | "L">("M")
    const [demoGlow, setDemoGlow] = useState(false)
    const [demoLabel, setDemoLabel] = useState(true)
    const [demoLabelStyle, setDemoLabelStyle] = useState<
        "score" | "fraction" | "percent" | "label"
    >("score")
    const [demoBar, setDemoBar] = useState(false)
    const [demoAnim, setDemoAnim] = useState(true)
    const [demoWave, setDemoWave] = useState(false)
    const [demoTheme, setDemoTheme] = useState<"dark" | "light">("dark")

    const resolvedSize =
        sizePreset === "custom" ? starSize : (SIZE_MAP[sizePreset] ?? 40)

    // Effective values
    const effSize = demoMode ? (DEMO_SIZE_MAP[demoSz] ?? 40) : resolvedSize
    const effGlowSize = demoMode
        ? demoGlow
            ? glowSize
            : 0
        : showGlow
          ? glowSize
          : 0
    const effShowLabel = demoMode ? demoLabel : showLabel
    const effLabelStyle = demoMode ? demoLabelStyle : labelStyle
    const effShowBar = demoMode ? demoBar : showBar
    const effAnimated = demoMode ? demoAnim : animated
    const effAnimStyle = demoMode ? (demoWave ? "wave" : "instant") : animStyle
    const effTextColor = demoMode
        ? demoTheme === "light"
            ? "#111111"
            : "#FFFFFF"
        : textColor

    const [value, setValue] = useState(defaultValue)
    const [hoverValue, setHoverValue] = useState<number | null>(null)

    const handleClick = useCallback(
        (v: number) => {
            if (readOnly) return
            setValue(v)
            onRatingChange?.(v)
        },
        [readOnly, onRatingChange]
    )

    const noOpNum = useCallback((_v: number) => {}, [])
    const noOpVoid = useCallback(() => {}, [])
    const handleLeave = useCallback(() => setHoverValue(null), [])

    const handleStarsKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (readOnly) return
            const step = allowHalf ? 0.5 : 1
            let next = value
            if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                e.preventDefault()
                next = Math.min(value + step, maxStars)
            } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                e.preventDefault()
                next = Math.max(value - step, 0)
            } else if (e.key === "Home") {
                e.preventDefault()
                next = 0
            } else if (e.key === "End") {
                e.preventDefault()
                next = maxStars
            } else {
                return
            }
            setValue(next)
            onRatingChange?.(next)
        },
        [readOnly, allowHalf, value, maxStars, onRatingChange]
    )

    const activeValue = hoverValue !== null ? hoverValue : value
    const activeFill = colorRange
        ? getRangeColor(activeValue / maxStars, colorLow, colorMid, colorHigh)
        : fillColor

    const starsRow = (
        <div
            role="slider"
            aria-label="Star rating"
            aria-valuemin={0}
            aria-valuemax={maxStars}
            aria-valuenow={value}
            aria-valuetext={`${value} out of ${maxStars} stars`}
            aria-readonly={readOnly ? true : undefined}
            tabIndex={readOnly ? -1 : 0}
            onKeyDown={handleStarsKeyDown}
            style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap,
                outline: "none",
            }}
        >
            {Array.from({ length: maxStars }).map((_, i) => (
                <Star
                    key={i}
                    index={i}
                    value={value}
                    hoverValue={readOnly ? null : hoverValue}
                    allowHalf={allowHalf}
                    size={effSize}
                    fillColor={activeFill}
                    emptyColor={emptyColor}
                    strokeWidth={strokeWidth}
                    glowSize={effGlowSize}
                    onHover={readOnly ? noOpNum : setHoverValue}
                    onLeave={readOnly ? noOpVoid : handleLeave}
                    onClick={handleClick}
                    animate={effAnimated && !readOnly}
                    waveDelay={
                        effAnimated && effAnimStyle === "wave" ? i * 0.07 : 0
                    }
                />
            ))}
        </div>
    )

    const label = (
        <RatingLabel
            value={value}
            max={maxStars}
            showCount={showReviewCount}
            reviewCount={reviewCount}
            fontSize={fontSize}
            fontFamily={fontFamily}
            textColor={effTextColor}
            labelStyle={effLabelStyle}
        />
    )

    const bar = (
        <RatingBar
            value={value}
            max={maxStars}
            fillColor={activeFill}
            trackColor={barTrackColor}
            height={barHeight}
            radius={barRadius}
            animated={effAnimated}
        />
    )

    const isVertical = labelPosition === "top" || labelPosition === "bottom"

    const ratingUI = (
        <div
            style={{
                display: "flex",
                flexDirection: isVertical ? "column" : "row",
                alignItems: isVertical ? "flex-start" : "center",
                gap: isVertical ? gap * 0.6 : gap,
                width: effShowBar ? "100%" : "fit-content",
            }}
        >
            {effShowLabel && labelPosition === "top" && label}
            {effShowLabel && labelPosition === "left" && label}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: gap * 0.5,
                    flex: effShowBar ? 1 : "0 0 auto",
                }}
            >
                {starsRow}
                {effShowBar && bar}
            </div>
            {effShowLabel && labelPosition === "right" && label}
            {effShowLabel && labelPosition === "bottom" && label}
        </div>
    )

    if (!demoMode) return ratingUI

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 28,
                width: "100%",
                background: demoTheme === "dark" ? "#000000" : "#FFFFFF",
                padding: "32px 24px",
                borderRadius: 16,
                transition: "background 0.3s",
            }}
        >
            {ratingUI}
            <DemoPanel
                size={demoSz}
                setSize={setDemoSz}
                glow={demoGlow}
                setGlow={setDemoGlow}
                label={demoLabel}
                setLabel={setDemoLabel}
                labelStyle={demoLabelStyle}
                setLabelStyle={setDemoLabelStyle}
                bar={demoBar}
                setBar={setDemoBar}
                anim={demoAnim}
                setAnim={setDemoAnim}
                wave={demoWave}
                setWave={setDemoWave}
                theme={demoTheme}
                setTheme={setDemoTheme}
            />
        </div>
    )
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(RatingStarsPro, {
    demoMode: {
        type: ControlType.Boolean,
        title: "Demo Mode",
        defaultValue: false,
    },

    // ── Core
    defaultValue: {
        type: ControlType.Number,
        title: "Rating",
        defaultValue: 3,
        min: 0,
        max: 10,
        step: 0.5,
        displayStepper: true,
    },
    maxStars: {
        type: ControlType.Number,
        title: "Max Stars",
        defaultValue: 5,
        min: 1,
        max: 10,
        step: 1,
        displayStepper: true,
    },
    readOnly: {
        type: ControlType.Boolean,
        title: "Read Only",
        defaultValue: false,
    },
    allowHalf: {
        type: ControlType.Boolean,
        title: "Half Stars",
        defaultValue: true,
        hidden(props) {
            return !!props.readOnly
        },
    },

    // ── Size
    sizePreset: {
        type: ControlType.Enum,
        title: "Size",
        options: ["xs", "sm", "md", "lg", "xl", "custom"],
        optionTitles: [
            "XS (20)",
            "SM (28)",
            "MD (40)",
            "LG (56)",
            "XL (72)",
            "Custom",
        ],
        defaultValue: "md",
    },
    starSize: {
        type: ControlType.Number,
        title: "Custom px",
        defaultValue: 40,
        min: 12,
        max: 120,
        step: 2,
        unit: "px",
        hidden(props) {
            return props.sizePreset !== "custom"
        },
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 8,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },

    // ── Colors
    fillColor: {
        type: ControlType.Color,
        title: "Fill Color",
        defaultValue: "#F5C518",
        hidden(props) {
            return !!props.colorRange
        },
    },
    emptyColor: {
        type: ControlType.Color,
        title: "Empty Color",
        defaultValue: "#9CA3AF",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke",
        defaultValue: 1.5,
        min: 0,
        max: 4,
        step: 0.25,
    },

    // ── Color Range
    colorRange: {
        type: ControlType.Boolean,
        title: "Color Range",
        defaultValue: false,
    },
    colorLow: {
        type: ControlType.Color,
        title: "↓ Low",
        defaultValue: "#EF4444",
        hidden(props) {
            return !props.colorRange
        },
    },
    colorMid: {
        type: ControlType.Color,
        title: "→ Mid",
        defaultValue: "#F5C518",
        hidden(props) {
            return !props.colorRange
        },
    },
    colorHigh: {
        type: ControlType.Color,
        title: "↑ High",
        defaultValue: "#22C55E",
        hidden(props) {
            return !props.colorRange
        },
    },

    // ── Glow
    showGlow: {
        type: ControlType.Boolean,
        title: "Glow",
        defaultValue: false,
    },
    glowSize: {
        type: ControlType.Number,
        title: "Glow Size",
        defaultValue: 8,
        min: 1,
        max: 40,
        step: 1,
        unit: "px",
        hidden(props) {
            return !props.showGlow
        },
    },

    // ── Label
    showLabel: {
        type: ControlType.Boolean,
        title: "Show Label",
        defaultValue: true,
    },
    labelStyle: {
        type: ControlType.Enum,
        title: "Label Style",
        options: ["score", "fraction", "percent", "label"],
        optionTitles: [
            "Score (4.5)",
            "Fraction (4.5 / 5)",
            "Percent (90%)",
            "Text (Excellent)",
        ],
        defaultValue: "score",
        hidden(props) {
            return !props.showLabel
        },
    },
    labelPosition: {
        type: ControlType.Enum,
        title: "Label Side",
        options: ["right", "left", "top", "bottom"],
        optionTitles: ["Right", "Left", "Top", "Bottom"],
        defaultValue: "right",
        hidden(props) {
            return !props.showLabel
        },
    },
    showReviewCount: {
        type: ControlType.Boolean,
        title: "Review Count",
        defaultValue: false,
        hidden(props) {
            return !props.showLabel
        },
    },
    reviewCount: {
        type: ControlType.Number,
        title: "# Reviews",
        defaultValue: 1284,
        min: 0,
        step: 1,
        hidden(props) {
            return !props.showLabel || !props.showReviewCount
        },
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 16,
        min: 10,
        max: 48,
        unit: "px",
        hidden(props) {
            return !props.showLabel
        },
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: "Inter, sans-serif",
        hidden(props) {
            return !props.showLabel
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
        hidden(props) {
            return !props.showLabel
        },
    },

    // ── Bar
    showBar: {
        type: ControlType.Boolean,
        title: "Rating Bar",
        defaultValue: false,
    },
    barHeight: {
        type: ControlType.Number,
        title: "Bar Height",
        defaultValue: 6,
        min: 2,
        max: 24,
        unit: "px",
        hidden(props) {
            return !props.showBar
        },
    },
    barRadius: {
        type: ControlType.Number,
        title: "Bar Radius",
        defaultValue: 999,
        min: 0,
        max: 999,
        hidden(props) {
            return !props.showBar
        },
    },
    barTrackColor: {
        type: ControlType.Color,
        title: "Track Color",
        defaultValue: "rgba(255,255,255,0.12)",
        hidden(props) {
            return !props.showBar
        },
    },

    // ── Animation
    animated: {
        type: ControlType.Boolean,
        title: "Animated",
        defaultValue: true,
    },
    animStyle: {
        type: ControlType.Enum,
        title: "Fill Style",
        options: ["instant", "wave"],
        optionTitles: ["Instant", "Wave ✦"],
        defaultValue: "instant",
        hidden(props) {
            return !props.animated
        },
    },
})
