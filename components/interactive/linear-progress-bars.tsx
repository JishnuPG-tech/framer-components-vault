// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useRef, useState, useEffect, useMemo, memo } from "react"
import type { ReactElement } from "react"

// ─── Icons ────────────────────────────────────────────────────────────────────

function Spinner({ color, active }: { color: string; active: boolean }) {
    return (
        <motion.svg
            width={16}
            height={16}
            viewBox="0 0 16 16"
            fill="none"
            style={{ flexShrink: 0, willChange: "transform" }}
            animate={active ? { rotate: 360 } : { rotate: 0 }}
            transition={{
                duration: 1.1,
                repeat: active ? Infinity : 0,
                ease: "linear",
            }}
        >
            <circle
                cx="8"
                cy="8"
                r="6"
                stroke={color}
                strokeOpacity="0.22"
                strokeWidth="2.2"
            />
            <path
                d="M14 8A6 6 0 0 0 8 2"
                stroke={color}
                strokeWidth="2.2"
                strokeLinecap="round"
            />
        </motion.svg>
    )
}

function CheckCircle({ color }: { color: string }) {
    return (
        <svg
            width={18}
            height={18}
            viewBox="0 0 18 18"
            fill="none"
            style={{ flexShrink: 0 }}
        >
            <circle
                cx="9"
                cy="9"
                r="8"
                fill={color}
                fillOpacity="0.1"
                stroke={color}
                strokeWidth="1.5"
            />
            <path
                d="M5.5 9.5 8 12l4.5-5.5"
                stroke={color}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function XCircle({ color }: { color: string }) {
    return (
        <svg
            width={18}
            height={18}
            viewBox="0 0 18 18"
            fill="none"
            style={{ flexShrink: 0 }}
        >
            <circle
                cx="9"
                cy="9"
                r="8"
                fill={color}
                fillOpacity="0.1"
                stroke={color}
                strokeWidth="1.5"
            />
            <path
                d="M6 6l6 6M12 6l-6 6"
                stroke={color}
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    )
}

function CloseX({ color }: { color: string }) {
    return (
        <svg
            width={14}
            height={14}
            viewBox="0 0 14 14"
            fill="none"
            style={{ flexShrink: 0 }}
        >
            <path
                d="M3 3l8 8M11 3l-8 8"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    )
}

function InfoDot({ color }: { color: string }) {
    return (
        <svg
            width={14}
            height={14}
            viewBox="0 0 14 14"
            fill="none"
            style={{ flexShrink: 0 }}
        >
            <circle cx="7" cy="7" r="6.2" stroke={color} strokeWidth="1.2" />
            <circle cx="7" cy="4.6" r="0.72" fill={color} />
            <path
                d="M7 6.5v3.2"
                stroke={color}
                strokeWidth="1.3"
                strokeLinecap="round"
            />
        </svg>
    )
}

// ─── Progress Row ─────────────────────────────────────────────────────────────

interface RowProps {
    label?: string
    labelSub?: string
    labelRight?: string
    rightIcon?: ReactElement
    showInfo?: boolean
    pct: number
    colorStart: string
    colorEnd: string
    height?: number
    capStyle?: "glow" | "dot" | "line" | "none"
    capColor?: string
    shimmer?: boolean
    milestones?: number
    subtitle?: string
    subtitleColor?: string
    inline?: boolean
    duration?: number
    animated: boolean
    theme: "light" | "dark"
}

const ProgressRow = memo(function ProgressRow(p: RowProps) {
    const {
        label,
        labelSub,
        labelRight,
        rightIcon,
        showInfo,
        pct,
        colorStart,
        colorEnd,
        height = 8,
        capStyle = "none",
        capColor,
        shimmer = false,
        milestones = 0,
        subtitle,
        subtitleColor,
        inline = false,
        duration = 1.2,
        animated,
        theme,
    } = p

    const isDark = theme === "dark"
    const trackBg = isDark ? "#1E1E1E" : "#F0F0F8"
    const textPrimary = isDark ? "#F3F4F6" : "#111827"
    const textMuted = isDark ? "#6B7280" : "#9CA3AF"
    const textValue = isDark ? "#D1D5DB" : "#374151"
    const subColor = subtitleColor ?? textMuted

    const bg =
        colorStart === colorEnd
            ? colorStart
            : `linear-gradient(90deg, ${colorStart}, ${colorEnd})`
    const cap = capColor ?? colorEnd
    const target = animated ? pct : 0
    const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]
    const tr = { duration, ease }

    const milePositions =
        milestones > 1
            ? Array.from({ length: milestones - 1 }, (_, i) =>
                  Math.round(((i + 1) / milestones) * 100)
              )
            : []

    const track = (
        <div
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label}
            style={{
                position: "relative",
                height,
                borderRadius: 999,
                backgroundColor: trackBg,
                overflow: "visible",
                ...(inline ? { flex: 1 } : { width: "100%" }),
            }}
        >
            {milePositions.map((pos) => (
                <div
                    key={pos}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: `${pos}%`,
                        transform: "translate(-50%,-50%)",
                        width: 1.5,
                        height: height * 0.55,
                        backgroundColor: isDark ? "#3A3A3A" : "#D1D5DB",
                        borderRadius: 1,
                        zIndex: 2,
                        pointerEvents: "none",
                    }}
                />
            ))}

            <motion.div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    borderRadius: 999,
                    background: bg,
                    overflow: "hidden",
                }}
                initial={{ width: "0%" }}
                animate={{ width: `${target}%` }}
                transition={tr}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        height: "45%",
                        background:
                            "linear-gradient(180deg,rgba(255,255,255,0.22) 0%,transparent 100%)",
                        pointerEvents: "none",
                    }}
                />
                {shimmer && (
                    <motion.div
                        style={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            width: "55%",
                            background:
                                "linear-gradient(90deg,transparent,rgba(255,255,255,0.35) 50%,transparent)",
                            pointerEvents: "none",
                        }}
                        animate={{ x: ["-120%", "320%"] }}
                        transition={{
                            repeat: Infinity,
                            repeatDelay: 2.2,
                            duration: 1.5,
                            ease: "easeInOut",
                        }}
                    />
                )}
            </motion.div>

            {capStyle !== "none" && (
                <motion.div
                    style={{
                        position: "absolute",
                        top: "50%",
                        transform: "translate(-50%,-50%)",
                        zIndex: 3,
                        pointerEvents: "none",
                    }}
                    initial={{ left: "0%" }}
                    animate={{ left: `${target}%` }}
                    transition={tr}
                >
                    {capStyle === "glow" && (
                        <div
                            style={{
                                width: height + 4,
                                height: height + 4,
                                borderRadius: "50%",
                                backgroundColor: "#fff",
                                border: `2px solid ${cap}`,
                                boxShadow: `0 0 0 3px ${cap}33,0 0 14px 5px ${cap}55`,
                            }}
                        />
                    )}
                    {capStyle === "dot" && (
                        <div
                            style={{
                                width: height + 4,
                                height: height + 4,
                                borderRadius: "50%",
                                backgroundColor: "#fff",
                                border: `2px solid ${cap}`,
                                boxShadow: "0 2px 6px rgba(0,0,0,0.16)",
                            }}
                        />
                    )}
                    {capStyle === "line" && (
                        <div
                            style={{
                                width: 3,
                                height: height + 6,
                                borderRadius: 2,
                                backgroundColor: "#fff",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                            }}
                        />
                    )}
                </motion.div>
            )}
        </div>
    )

    if (inline) {
        return (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {label && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 13.5,
                                fontWeight: 500,
                                color: textPrimary,
                                whiteSpace: "nowrap",
                                letterSpacing: "-0.01em",
                            }}
                        >
                            {label}
                        </span>
                        {showInfo && <InfoDot color={textMuted} />}
                    </div>
                )}
                {track}
                {labelRight && (
                    <span
                        style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: textValue,
                            whiteSpace: "nowrap",
                            letterSpacing: "-0.025em",
                            fontVariantNumeric: "tabular-nums",
                        }}
                    >
                        {labelRight}
                    </span>
                )}
                {rightIcon}
            </div>
        )
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {(label || labelRight || rightIcon) && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            minWidth: 0,
                            overflow: "hidden",
                        }}
                    >
                        {label && (
                            <span
                                style={{
                                    fontSize: 13.5,
                                    fontWeight: 500,
                                    color: textPrimary,
                                    letterSpacing: "-0.01em",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {label}
                            </span>
                        )}
                        {showInfo && <InfoDot color={textMuted} />}
                        {labelSub && (
                            <span
                                style={{
                                    fontSize: 12,
                                    color: textMuted,
                                    whiteSpace: "nowrap",
                                    flexShrink: 0,
                                }}
                            >
                                {labelSub}
                            </span>
                        )}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            flexShrink: 0,
                        }}
                    >
                        {labelRight && (
                            <span
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: textValue,
                                    letterSpacing: "-0.025em",
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {labelRight}
                            </span>
                        )}
                        {rightIcon}
                    </div>
                </div>
            )}
            {track}
            {subtitle && (
                <span
                    style={{
                        fontSize: 11.5,
                        color: subColor,
                        letterSpacing: "-0.005em",
                    }}
                >
                    {subtitle}
                </span>
            )}
        </div>
    )
})

// ─── Class Row ────────────────────────────────────────────────────────────────

interface ClassRowProps {
    label: string
    value: number
    maxValue: number
    colorStart: string
    colorEnd: string
    height: number
    animated: boolean
    theme: "light" | "dark"
}

const ClassRow = memo(function ClassRow(p: ClassRowProps) {
    const {
        label,
        value,
        maxValue,
        colorStart,
        colorEnd,
        height,
        animated,
        theme,
    } = p
    const isDark = theme === "dark"
    const trackBg = isDark ? "#1E1E1E" : "#EFEFEF"
    const textPrimary = isDark ? "#F3F4F6" : "#111827"
    const textValue = isDark ? "#D1D5DB" : "#374151"
    const pct =
        maxValue > 0 ? Math.min(100, Math.max(0, (value / maxValue) * 100)) : 0
    const target = animated ? pct : 0
    const bg =
        colorStart === colorEnd
            ? colorStart
            : `linear-gradient(90deg, ${colorStart}, ${colorEnd})`
    const ease: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94]

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <span
                    style={{
                        fontSize: 14.5,
                        fontWeight: 500,
                        color: textPrimary,
                        letterSpacing: "-0.015em",
                    }}
                >
                    {label}
                </span>
                <span
                    style={{
                        fontSize: 14.5,
                        fontWeight: 600,
                        color: textValue,
                        letterSpacing: "-0.02em",
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    {value}
                </span>
            </div>
            <div
                role="progressbar"
                aria-valuenow={Math.round(pct)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={label}
                style={{
                    position: "relative",
                    height,
                    borderRadius: 999,
                    backgroundColor: trackBg,
                    overflow: "hidden",
                }}
            >
                <motion.div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        bottom: 0,
                        borderRadius: 999,
                        background: bg,
                    }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${target}%` }}
                    transition={{ duration: 1.2, ease }}
                />
            </div>
        </div>
    )
})

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider({ dark }: { dark: boolean }) {
    return (
        <div
            style={{
                height: 1,
                background: dark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.055)",
            }}
        />
    )
}

// ─── Types ────────────────────────────────────────────────────────────────────

// Shared type for ratio-based rows (Progress A / B / C)
interface RClass {
    visible: boolean
    label: string
    value: number
    maxValue: number
    colorStart: string
    colorEnd: string
    height: number
}
interface R4 {
    visible: boolean
    label: string
    labelSub: string
    labelRight: string
    pct: number
    colorStart: string
    colorEnd: string
    height: number
    subtitle: string
}
interface R5 {
    visible: boolean
    label: string
    labelRight: string
    pct: number
    colorStart: string
    colorEnd: string
    height: number
    subtitle: string
}
interface R6 {
    visible: boolean
    label: string
    pct: number
    colorStart: string
    colorEnd: string
    height: number
    subtitle: string
}
interface R7 {
    visible: boolean
    label: string
    labelRight: string
    pct: number
    colorStart: string
    colorEnd: string
    height: number
    milestones: number
    subtitle: string
}
interface R8 {
    visible: boolean
    label: string
    labelRight: string
    pct: number
    colorStart: string
    colorEnd: string
    height: number
    subtitle: string
}
interface R9 {
    visible: boolean
    label: string
    labelRight: string
    pct: number
    colorStart: string
    colorEnd: string
    height: number
}
interface R10 {
    visible: boolean
    label: string
    labelRight: string
    pct: number
    colorStart: string
    colorEnd: string
    height: number
    subtitle: string
}

interface CardProps {
    bgColor: string
    borderRadius: number
    borderWidth: number
    borderColor: string
    shadow: "none" | "soft" | "medium" | "strong"
    paddingV: number
    paddingH: number
}

interface ShowcaseProps {
    theme: "light" | "dark"
    scrollReveal: boolean
    card: CardProps
    layout: {
        row1: RClass
        row2: RClass
        row3: RClass
        row4: R4
        row5: R5
        row6: R6
        row7: R7
        row8: R8
        row9: R9
        row10: R10
    }
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_CARD: CardProps = {
    bgColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 0,
    borderColor: "#E5E7EB",
    shadow: "medium",
    paddingV: 28,
    paddingH: 32,
}

const DEFAULT_LAYOUT: ShowcaseProps["layout"] = {
    row1: {
        visible: true,
        label: "Progress A",
        value: 368,
        maxValue: 500,
        colorStart: "#34D399",
        colorEnd: "#10B981",
        height: 9,
    },
    row2: {
        visible: true,
        label: "Progress B",
        value: 211,
        maxValue: 500,
        colorStart: "#FB923C",
        colorEnd: "#F97316",
        height: 9,
    },
    row3: {
        visible: true,
        label: "Progress C",
        value: 96,
        maxValue: 500,
        colorStart: "#F87171",
        colorEnd: "#EF4444",
        height: 9,
    },
    row4: {
        visible: true,
        label: "brand-assets.zip",
        labelSub: "(21.2 MB)",
        labelRight: "67%",
        pct: 67,
        colorStart: "#6366F1",
        colorEnd: "#8B5CF6",
        height: 8,
        subtitle: "14.2 MB of 21.2 MB  ·  8 seconds remaining",
    },
    row5: {
        visible: true,
        label: "quarterly-report.pdf",
        labelRight: "100%",
        pct: 100,
        colorStart: "#10B981",
        colorEnd: "#10B981",
        height: 8,
        subtitle: "12.8 MB  ·  Saved to Cloud Storage",
    },
    row6: {
        visible: true,
        label: "prototype-v4.fig",
        pct: 38,
        colorStart: "#EF4444",
        colorEnd: "#F87171",
        height: 8,
        subtitle: "Upload interrupted  ·  Tap to retry",
    },
    row7: {
        visible: true,
        label: "Framer Cloud",
        labelRight: "24.8 GB / 100 GB",
        pct: 25,
        colorStart: "#3B82F6",
        colorEnd: "#06B6D4",
        height: 10,
        subtitle: "Est. full in 18 months",
        milestones: 4,
    },
    row8: {
        visible: true,
        label: "Generating design tokens",
        labelRight: "318 / 400 tasks",
        pct: 79,
        colorStart: "#F59E0B",
        colorEnd: "#EF4444",
        height: 10,
        subtitle: "~22 seconds remaining",
    },
    row9: {
        visible: true,
        label: "Bandwidth",
        labelRight: "61%",
        pct: 61,
        colorStart: "#06B6D4",
        colorEnd: "#8B5CF6",
        height: 7,
    },
    row10: {
        visible: true,
        label: "Monthly Transfer",
        labelRight: "1.2 TB / 2 TB",
        pct: 61,
        colorStart: "#EC4899",
        colorEnd: "#F97316",
        height: 10,
        subtitle: "(650 GB / 1.12 TB)  ·  17 days remaining",
    },
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LinearProgressBars({
    theme = "light",
    scrollReveal = true,
    card = DEFAULT_CARD,
    layout = DEFAULT_LAYOUT,
}: ShowcaseProps) {
    const { row1, row2, row3, row4, row5, row6, row7, row8, row9, row10 } =
        layout
    const isDark = theme === "dark"

    const ref = useRef<HTMLDivElement>(null)
    const isInView = useInView(ref, { once: true, amount: 0.15 })
    const [animated, setAnimated] = useState(!scrollReveal)

    useEffect(() => {
        if (!scrollReveal) {
            setAnimated(true)
            return
        }
        if (isInView) setAnimated(true)
    }, [scrollReveal, isInView])

    const shared = { animated, theme }
    const muted = isDark ? "#5B6370" : "#9CA3AF"

    const shadowValue = {
        none: "none",
        soft: isDark
            ? "0 8px 24px rgba(0,0,0,0.45)"
            : "0 4px 16px rgba(0,0,0,0.06)",
        medium: isDark
            ? "0 0 0 1px rgba(255,255,255,0.07), 0 32px 64px rgba(0,0,0,0.7)"
            : "0 0 0 1px rgba(0,0,0,0.05), 0 20px 60px rgba(0,0,0,0.07)",
        strong: isDark
            ? "0 0 0 1px rgba(255,255,255,0.09), 0 48px 96px rgba(0,0,0,0.85)"
            : "0 0 0 1px rgba(0,0,0,0.08), 0 32px 80px rgba(0,0,0,0.15)",
    }[card.shadow]

    const rowDefs = useMemo<
        Array<{ key: string; visible: boolean; el: ReactElement }>
    >(
        () => [
            {
                key: "r1",
                visible: row1.visible,
                el: (
                    <ClassRow
                        key="r1"
                        {...shared}
                        label={row1.label}
                        value={row1.value}
                        maxValue={row1.maxValue}
                        colorStart={row1.colorStart}
                        colorEnd={row1.colorEnd}
                        height={row1.height}
                    />
                ),
            },
            {
                key: "r2",
                visible: row2.visible,
                el: (
                    <ClassRow
                        key="r2"
                        {...shared}
                        label={row2.label}
                        value={row2.value}
                        maxValue={row2.maxValue}
                        colorStart={row2.colorStart}
                        colorEnd={row2.colorEnd}
                        height={row2.height}
                    />
                ),
            },
            {
                key: "r3",
                visible: row3.visible,
                el: (
                    <ClassRow
                        key="r3"
                        {...shared}
                        label={row3.label}
                        value={row3.value}
                        maxValue={row3.maxValue}
                        colorStart={row3.colorStart}
                        colorEnd={row3.colorEnd}
                        height={row3.height}
                    />
                ),
            },
            {
                key: "r4",
                visible: row4.visible,
                el: (
                    <ProgressRow
                        key="r4"
                        {...shared}
                        label={row4.label}
                        labelSub={row4.labelSub}
                        labelRight={row4.labelRight}
                        pct={row4.pct}
                        colorStart={row4.colorStart}
                        colorEnd={row4.colorEnd}
                        height={row4.height}
                        subtitle={row4.subtitle}
                        showInfo
                        rightIcon={
                            <Spinner color={row4.colorEnd} active={animated} />
                        }
                        capStyle="glow"
                        capColor={row4.colorEnd}
                        shimmer
                        duration={1.3}
                    />
                ),
            },
            {
                key: "r5",
                visible: row5.visible,
                el: (
                    <ProgressRow
                        key="r5"
                        {...shared}
                        label={row5.label}
                        labelRight={row5.labelRight}
                        pct={row5.pct}
                        colorStart={row5.colorStart}
                        colorEnd={row5.colorEnd}
                        height={row5.height}
                        subtitle={row5.subtitle}
                        showInfo
                        rightIcon={<CheckCircle color={row5.colorStart} />}
                        duration={0.9}
                    />
                ),
            },
            {
                key: "r6",
                visible: row6.visible,
                el: (
                    <ProgressRow
                        key="r6"
                        {...shared}
                        label={row6.label}
                        pct={row6.pct}
                        colorStart={row6.colorStart}
                        colorEnd={row6.colorEnd}
                        height={row6.height}
                        subtitle={row6.subtitle}
                        subtitleColor={row6.colorStart}
                        showInfo
                        rightIcon={<XCircle color={row6.colorStart} />}
                        duration={0.6}
                    />
                ),
            },
            {
                key: "r7",
                visible: row7.visible,
                el: (
                    <ProgressRow
                        key="r7"
                        {...shared}
                        label={row7.label}
                        labelRight={row7.labelRight}
                        pct={row7.pct}
                        colorStart={row7.colorStart}
                        colorEnd={row7.colorEnd}
                        height={row7.height}
                        milestones={row7.milestones}
                        subtitle={row7.subtitle}
                        duration={1.1}
                    />
                ),
            },
            {
                key: "r8",
                visible: row8.visible,
                el: (
                    <ProgressRow
                        key="r8"
                        {...shared}
                        label={row8.label}
                        labelRight={row8.labelRight}
                        pct={row8.pct}
                        colorStart={row8.colorStart}
                        colorEnd={row8.colorEnd}
                        height={row8.height}
                        subtitle={row8.subtitle}
                        capStyle="dot"
                        capColor={row8.colorEnd}
                        duration={1.2}
                    />
                ),
            },
            {
                key: "r9",
                visible: row9.visible,
                el: (
                    <ProgressRow
                        key="r9"
                        {...shared}
                        label={row9.label}
                        labelRight={row9.labelRight}
                        pct={row9.pct}
                        colorStart={row9.colorStart}
                        colorEnd={row9.colorEnd}
                        height={row9.height}
                        showInfo
                        rightIcon={
                            <Spinner color={row9.colorEnd} active={animated} />
                        }
                        shimmer
                        inline
                        duration={1.1}
                    />
                ),
            },
            {
                key: "r10",
                visible: row10.visible,
                el: (
                    <ProgressRow
                        key="r10"
                        {...shared}
                        label={row10.label}
                        labelRight={row10.labelRight}
                        pct={row10.pct}
                        colorStart={row10.colorStart}
                        colorEnd={row10.colorEnd}
                        height={row10.height}
                        subtitle={row10.subtitle}
                        rightIcon={<CloseX color={muted} />}
                        capStyle="line"
                        shimmer
                        duration={1.2}
                    />
                ),
            },
        ],
        [layout, animated, theme, muted]
    )

    const children = rowDefs
        .filter((r) => r.visible)
        .flatMap((row, i) =>
            i === 0
                ? [row.el]
                : [<Divider key={`d-${row.key}`} dark={isDark} />, row.el]
        )

    return (
        <div
            ref={ref}
            style={{
                width: "100%",
                backgroundColor: card.bgColor,
                borderRadius: card.borderRadius,
                padding: `${card.paddingV}px ${card.paddingH}px`,
                border:
                    card.borderWidth > 0
                        ? `${card.borderWidth}px solid ${card.borderColor}`
                        : "none",
                display: "flex",
                flexDirection: "column",
                gap: 22,
                boxSizing: "border-box",
                fontFamily:
                    "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
                boxShadow: shadowValue,
            }}
        >
            {children}
        </div>
    )
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(LinearProgressBars, {
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        defaultValue: "light",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
    },
    scrollReveal: {
        type: ControlType.Boolean,
        title: "Scroll Reveal",
        defaultValue: true,
    },

    card: {
        type: ControlType.Object,
        title: "Card",
        controls: {
            bgColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#FFFFFF",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 20,
                min: 0,
                max: 48,
                step: 1,
                displayStepper: true,
                unit: "px",
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Border",
                defaultValue: 0,
                min: 0,
                max: 8,
                step: 1,
                displayStepper: true,
                unit: "px",
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border Color",
                defaultValue: "#E5E7EB",
            },
            shadow: {
                type: ControlType.Enum,
                title: "Shadow",
                defaultValue: "medium",
                options: ["none", "soft", "medium", "strong"],
                optionTitles: ["None", "Soft", "Medium", "Strong"],
            },
            paddingV: {
                type: ControlType.Number,
                title: "Padding V",
                defaultValue: 28,
                min: 0,
                max: 80,
                step: 2,
                displayStepper: true,
                unit: "px",
            },
            paddingH: {
                type: ControlType.Number,
                title: "Padding H",
                defaultValue: 32,
                min: 0,
                max: 80,
                step: 2,
                displayStepper: true,
                unit: "px",
            },
        },
    },

    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            row1: {
                type: ControlType.Object,
                title: "① Progress A",
                controls: {
                    visible: {
                        type: ControlType.Boolean,
                        title: "Visible",
                        defaultValue: true,
                    },
                    label: {
                        type: ControlType.String,
                        title: "Label",
                        defaultValue: "Progress A",
                    },
                    value: {
                        type: ControlType.Number,
                        title: "Value",
                        defaultValue: 368,
                        min: 0,
                        max: 99999,
                        step: 1,
                        displayStepper: true,
                    },
                    maxValue: {
                        type: ControlType.Number,
                        title: "Max",
                        defaultValue: 500,
                        min: 1,
                        max: 99999,
                        step: 1,
                        displayStepper: true,
                    },
                    colorStart: {
                        type: ControlType.Color,
                        title: "Color From",
                        defaultValue: "#34D399",
                    },
                    colorEnd: {
                        type: ControlType.Color,
                        title: "Color To",
                        defaultValue: "#10B981",
                    },
                    height: {
                        type: ControlType.Number,
                        title: "Bar Height",
                        defaultValue: 9,
                        min: 4,
                        max: 24,
                        step: 1,
                        displayStepper: true,
                        unit: "px",
                    },
                },
            },

            row2: {
                type: ControlType.Object,
                title: "② Progress B",
                controls: {
                    visible: {
                        type: ControlType.Boolean,
                        title: "Visible",
                        defaultValue: true,
                    },
                    label: {
                        type: ControlType.String,
                        title: "Label",
                        defaultValue: "Progress B",
                    },
                    value: {
                        type: ControlType.Number,
                        title: "Value",
                        defaultValue: 211,
                        min: 0,
                        max: 99999,
                        step: 1,
                        displayStepper: true,
                    },
                    maxValue: {
                        type: ControlType.Number,
                        title: "Max",
                        defaultValue: 500,
                        min: 1,
                        max: 99999,
                        step: 1,
                        displayStepper: true,
                    },
                    colorStart: {
                        type: ControlType.Color,
                        title: "Color From",
                        defaultValue: "#FB923C",
                    },
                    colorEnd: {
                        type: ControlType.Color,
                        title: "Color To",
                        defaultValue: "#F97316",
                    },
                    height: {
                        type: ControlType.Number,
                        title: "Bar Height",
                        defaultValue: 9,
                        min: 4,
                        max: 24,
                        step: 1,
                        displayStepper: true,
                        unit: "px",
                    },
                },
            },

            row3: {
                type: ControlType.Object,
                title: "③ Progress C",
                controls: {
                    visible: {
                        type: ControlType.Boolean,
                        title: "Visible",
                        defaultValue: true,
                    },
                    label: {
                        type: ControlType.String,
                        title: "Label",
                        defaultValue: "Progress C",
                    },
                    value: {
                        type: ControlType.Number,
                        title: "Value",
                        defaultValue: 96,
                        min: 0,
                        max: 99999,
                        step: 1,
                        displayStepper: true,
                    },
                    maxValue: {
                        type: ControlType.Number,
                        title: "Max",
                        defaultValue: 500,
                        min: 1,
                        max: 99999,
                        step: 1,
                        displayStepper: true,
                    },
                    colorStart: {
                        type: ControlType.Color,
                        title: "Color From",
                        defaultValue: "#F87171",
                    },
                    colorEnd: {
                        type: ControlType.Color,
                        title: "Color To",
                        defaultValue: "#EF4444",
                    },
                    height: {
                        type: ControlType.Number,
                        title: "Bar Height",
                        defaultValue: 9,
                        min: 4,
                        max: 24,
                        step: 1,
                        displayStepper: true,
                        unit: "px",
                    },
                },
            },

            row4: {
                type: ControlType.Object,
                title: "④ Uploading...",
                controls: {
                    visible: {
                        type: ControlType.Boolean,
                        title: "Visible",
                        defaultValue: true,
                    },
                    label: {
                        type: ControlType.String,
                        title: "File Name",
                        defaultValue: "brand-assets.zip",
                    },
                    labelSub: {
                        type: ControlType.String,
                        title: "File Size",
                        defaultValue: "(21.2 MB)",
                    },
                    labelRight: {
                        type: ControlType.String,
                        title: "Value",
                        defaultValue: "67%",
                    },
                    pct: {
                        type: ControlType.Number,
                        title: "Progress %",
                        defaultValue: 67,
                        min: 0,
                        max: 100,
                        step: 1,
                        displayStepper: true,
                    },
                    colorStart: {
                        type: ControlType.Color,
                        title: "Color From",
                        defaultValue: "#6366F1",
                    },
                    colorEnd: {
                        type: ControlType.Color,
                        title: "Color To",
                        defaultValue: "#8B5CF6",
                    },
                    height: {
                        type: ControlType.Number,
                        title: "Bar Height",
                        defaultValue: 8,
                        min: 4,
                        max: 24,
                        step: 1,
                        displayStepper: true,
                        unit: "px",
                    },
                    subtitle: {
                        type: ControlType.String,
                        title: "Subtitle",
                        defaultValue:
                            "14.2 MB of 21.2 MB  ·  8 seconds remaining",
                    },
                },
            },

            row5: {
                type: ControlType.Object,
                title: "⑤ Complete",
                controls: {
                    visible: {
                        type: ControlType.Boolean,
                        title: "Visible",
                        defaultValue: true,
                    },
                    label: {
                        type: ControlType.String,
                        title: "File Name",
                        defaultValue: "quarterly-report.pdf",
                    },
                    labelRight: {
                        type: ControlType.String,
                        title: "Value",
                        defaultValue: "100%",
                    },
                    pct: {
                        type: ControlType.Number,
                        title: "Progress %",
                        defaultValue: 100,
                        min: 0,
                        max: 100,
                        step: 1,
                        displayStepper: true,
                    },
                    colorStart: {
                        type: ControlType.Color,
                        title: "Color From",
                        defaultValue: "#10B981",
                    },
                    colorEnd: {
                        type: ControlType.Color,
                        title: "Color To",
                        defaultValue: "#10B981",
                    },
                    height: {
                        type: ControlType.Number,
                        title: "Bar Height",
                        defaultValue: 8,
                        min: 4,
                        max: 24,
                        step: 1,
                        displayStepper: true,
                        unit: "px",
                    },
                    subtitle: {
                        type: ControlType.String,
                        title: "Subtitle",
                        defaultValue: "12.8 MB  ·  Saved to Cloud Storage",
                    },
                },
            },

            row6: {
                type: ControlType.Object,
                title: "⑥ Failed",
                controls: {
                    visible: {
                        type: ControlType.Boolean,
                        title: "Visible",
                        defaultValue: true,
                    },
                    label: {
                        type: ControlType.String,
                        title: "File Name",
                        defaultValue: "prototype-v4.fig",
                    },
                    pct: {
                        type: ControlType.Number,
                        title: "Progress %",
                        defaultValue: 38,
                        min: 0,
                        max: 100,
                        step: 1,
                        displayStepper: true,
                    },
                    colorStart: {
                        type: ControlType.Color,
                        title: "Color From",
                        defaultValue: "#EF4444",
                    },
                    colorEnd: {
                        type: ControlType.Color,
                        title: "Color To",
                        defaultValue: "#F87171",
                    },
                    height: {
                        type: ControlType.Number,
                        title: "Bar Height",
                        defaultValue: 8,
                        min: 4,
                        max: 24,
                        step: 1,
                        displayStepper: true,
                        unit: "px",
                    },
                    subtitle: {
                        type: ControlType.String,
                        title: "Error Message",
                        defaultValue: "Upload interrupted  ·  Tap to retry",
                    },
                },
            },

            row7: {
                type: ControlType.Object,
                title: "⑦ Storage",
                controls: {
                    visible: {
                        type: ControlType.Boolean,
                        title: "Visible",
                        defaultValue: true,
                    },
                    label: {
                        type: ControlType.String,
                        title: "Label",
                        defaultValue: "Framer Cloud",
                    },
                    labelRight: {
                        type: ControlType.String,
                        title: "Value",
                        defaultValue: "24.8 GB / 100 GB",
                    },
                    pct: {
                        type: ControlType.Number,
                        title: "Progress %",
                        defaultValue: 25,
                        min: 0,
                        max: 100,
                        step: 1,
                        displayStepper: true,
                    },
                    colorStart: {
                        type: ControlType.Color,
                        title: "Color From",
                        defaultValue: "#3B82F6",
                    },
                    colorEnd: {
                        type: ControlType.Color,
                        title: "Color To",
                        defaultValue: "#06B6D4",
                    },
                    height: {
                        type: ControlType.Number,
                        title: "Bar Height",
                        defaultValue: 10,
                        min: 4,
                        max: 24,
                        step: 1,
                        displayStepper: true,
                        unit: "px",
                    },
                    milestones: {
                        type: ControlType.Number,
                        title: "Sections",
                        defaultValue: 4,
                        min: 2,
                        max: 8,
                        step: 1,
                        displayStepper: true,
                    },
                    subtitle: {
                        type: ControlType.String,
                        title: "Subtitle",
                        defaultValue: "Est. full in 18 months",
                    },
                },
            },

            row8: {
                type: ControlType.Object,
                title: "⑧ Task Queue",
                controls: {
                    visible: {
                        type: ControlType.Boolean,
                        title: "Visible",
                        defaultValue: true,
                    },
                    label: {
                        type: ControlType.String,
                        title: "Label",
                        defaultValue: "Generating design tokens",
                    },
                    labelRight: {
                        type: ControlType.String,
                        title: "Value",
                        defaultValue: "318 / 400 tasks",
                    },
                    pct: {
                        type: ControlType.Number,
                        title: "Progress %",
                        defaultValue: 79,
                        min: 0,
                        max: 100,
                        step: 1,
                        displayStepper: true,
                    },
                    colorStart: {
                        type: ControlType.Color,
                        title: "Color From",
                        defaultValue: "#F59E0B",
                    },
                    colorEnd: {
                        type: ControlType.Color,
                        title: "Color To",
                        defaultValue: "#EF4444",
                    },
                    height: {
                        type: ControlType.Number,
                        title: "Bar Height",
                        defaultValue: 10,
                        min: 4,
                        max: 24,
                        step: 1,
                        displayStepper: true,
                        unit: "px",
                    },
                    subtitle: {
                        type: ControlType.String,
                        title: "Subtitle",
                        defaultValue: "~22 seconds remaining",
                    },
                },
            },

            row9: {
                type: ControlType.Object,
                title: "⑨ Inline Bar",
                controls: {
                    visible: {
                        type: ControlType.Boolean,
                        title: "Visible",
                        defaultValue: true,
                    },
                    label: {
                        type: ControlType.String,
                        title: "Label",
                        defaultValue: "Bandwidth",
                    },
                    labelRight: {
                        type: ControlType.String,
                        title: "Value",
                        defaultValue: "61%",
                    },
                    pct: {
                        type: ControlType.Number,
                        title: "Progress %",
                        defaultValue: 61,
                        min: 0,
                        max: 100,
                        step: 1,
                        displayStepper: true,
                    },
                    colorStart: {
                        type: ControlType.Color,
                        title: "Color From",
                        defaultValue: "#06B6D4",
                    },
                    colorEnd: {
                        type: ControlType.Color,
                        title: "Color To",
                        defaultValue: "#8B5CF6",
                    },
                    height: {
                        type: ControlType.Number,
                        title: "Bar Height",
                        defaultValue: 7,
                        min: 4,
                        max: 24,
                        step: 1,
                        displayStepper: true,
                        unit: "px",
                    },
                },
            },

            row10: {
                type: ControlType.Object,
                title: "⑩ Transfer",
                controls: {
                    visible: {
                        type: ControlType.Boolean,
                        title: "Visible",
                        defaultValue: true,
                    },
                    label: {
                        type: ControlType.String,
                        title: "Label",
                        defaultValue: "Monthly Transfer",
                    },
                    labelRight: {
                        type: ControlType.String,
                        title: "Value",
                        defaultValue: "1.2 TB / 2 TB",
                    },
                    pct: {
                        type: ControlType.Number,
                        title: "Progress %",
                        defaultValue: 61,
                        min: 0,
                        max: 100,
                        step: 1,
                        displayStepper: true,
                    },
                    colorStart: {
                        type: ControlType.Color,
                        title: "Color From",
                        defaultValue: "#EC4899",
                    },
                    colorEnd: {
                        type: ControlType.Color,
                        title: "Color To",
                        defaultValue: "#F97316",
                    },
                    height: {
                        type: ControlType.Number,
                        title: "Bar Height",
                        defaultValue: 10,
                        min: 4,
                        max: 24,
                        step: 1,
                        displayStepper: true,
                        unit: "px",
                    },
                    subtitle: {
                        type: ControlType.String,
                        title: "Subtitle",
                        defaultValue:
                            "(650 GB / 1.12 TB)  ·  17 days remaining",
                    },
                },
            },
        },
    },
})
