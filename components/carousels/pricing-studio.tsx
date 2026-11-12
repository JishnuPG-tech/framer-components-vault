// Instructions: Create a modern interactive pricing calculator component for Framer. Include sliders for users, storage, and team size that dynamically update the estimated monthly price in real time. Use smooth animated counters, clean SaaS-style UI, rounded cards, and modern typography.
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

import { animate, motion, useInView, useMotionValue } from "framer-motion"

type FontStyle = any

type SliderField = "users" | "storage" | "team"

interface PricingCalculatorProps {
    title: string
    subtitle: string

    currencySymbol: string
    billingSuffix: string
    decimals: number
    showBreakdown: boolean

    themeMode: "preset" | "custom"
    presetTheme: "Light" | "Dark" | "Midnight" | "Sunset" | "Neon"
    showThemeSwitcher: boolean
    allowCustomTheme: boolean

    initialUsers: number
    minUsers: number
    maxUsers: number
    stepUsers: number

    initialStorage: number
    minStorage: number
    maxStorage: number
    stepStorage: number
    storageUnit: "GB" | "TB"

    initialTeam: number
    minTeam: number
    maxTeam: number
    stepTeam: number

    basePrice: number
    pricePerUser: number
    pricePerStorageGB: number
    pricePerTeamMember: number

    includedUsers: number
    includedStorageGB: number
    includedTeam: number

    clampIncludedToZero: boolean

    backgroundMode: "solid" | "gradient"
    background: string
    background2: string
    gradientAngle: number

    showDecor: boolean
    decorColor1: string
    decorColor2: string

    cardBackground: string
    cardTint: string
    borderColor: string
    textColor: string
    subtleTextColor: string
    accentColor: string
    accentColor2: string
    trackColor: string
    thumbColor: string
    shadow: string
    borderRadius: string
    padding: string

    titleFont: FontStyle
    subtitleFont: FontStyle
    labelFont: FontStyle
    valueFont: FontStyle
    priceFont: FontStyle
    breakdownFont: FontStyle
}

type ThemeColors = {
    backgroundMode: "solid" | "gradient"
    background: string
    background2: string
    gradientAngle: number
    showDecor: boolean
    decorColor1: string
    decorColor2: string
    cardBackground: string
    cardTint: string
    borderColor: string
    textColor: string
    subtleTextColor: string
    accentColor: string
    accentColor2: string
    trackColor: string
    thumbColor: string
    shadow: string
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function resolvePresetTheme(theme: PricingCalculatorProps["presetTheme"]): ThemeColors {
    switch (theme) {
        case "Light":
            return {
                backgroundMode: "gradient",
                background: "#FFFFFF",
                background2: "#EEF2FF",
                gradientAngle: 145,
                showDecor: true,
                decorColor1: "#3B82F6",
                decorColor2: "#A855F7",
                cardBackground: "rgba(255,255,255,0.78)",
                cardTint: "rgba(255,255,255,0.55)",
                borderColor: "rgba(15,23,42,0.10)",
                textColor: "#0B1220",
                subtleTextColor: "#667085",
                accentColor: "#2563EB",
                accentColor2: "#F97316",
                trackColor: "rgba(15,23,42,0.08)",
                thumbColor: "#FFFFFF",
                shadow: "0 18px 60px rgba(16,24,40,0.10)",
            }
        case "Dark":
            return {
                backgroundMode: "gradient",
                background: "#0B1220",
                background2: "#1D4ED8",
                gradientAngle: 135,
                showDecor: true,
                decorColor1: "#22C55E",
                decorColor2: "#A855F7",
                cardBackground: "rgba(255,255,255,0.10)",
                cardTint: "rgba(255,255,255,0.06)",
                borderColor: "rgba(255,255,255,0.14)",
                textColor: "#F8FAFC",
                subtleTextColor: "rgba(226,232,240,0.70)",
                accentColor: "#60A5FA",
                accentColor2: "#F97316",
                trackColor: "rgba(255,255,255,0.14)",
                thumbColor: "#FFFFFF",
                shadow: "0 18px 60px rgba(0,0,0,0.35)",
            }
        case "Midnight":
            return {
                backgroundMode: "gradient",
                background: "#020617",
                background2: "#0F172A",
                gradientAngle: 160,
                showDecor: true,
                decorColor1: "#38BDF8",
                decorColor2: "#F472B6",
                cardBackground: "rgba(255,255,255,0.08)",
                cardTint: "rgba(255,255,255,0.05)",
                borderColor: "rgba(255,255,255,0.12)",
                textColor: "#E2E8F0",
                subtleTextColor: "rgba(226,232,240,0.65)",
                accentColor: "#38BDF8",
                accentColor2: "#A78BFA",
                trackColor: "rgba(255,255,255,0.12)",
                thumbColor: "#FFFFFF",
                shadow: "0 20px 70px rgba(0,0,0,0.45)",
            }
        case "Sunset":
            return {
                backgroundMode: "gradient",
                background: "#0B1220",
                background2: "#FB7185",
                gradientAngle: 135,
                showDecor: true,
                decorColor1: "#F97316",
                decorColor2: "#FBBF24",
                cardBackground: "rgba(255,255,255,0.10)",
                cardTint: "rgba(255,255,255,0.06)",
                borderColor: "rgba(255,255,255,0.14)",
                textColor: "#FFF7ED",
                subtleTextColor: "rgba(255,237,213,0.70)",
                accentColor: "#FB7185",
                accentColor2: "#F97316",
                trackColor: "rgba(255,255,255,0.14)",
                thumbColor: "#FFFFFF",
                shadow: "0 18px 60px rgba(0,0,0,0.35)",
            }
        case "Neon":
            return {
                backgroundMode: "gradient",
                background: "#050816",
                background2: "#7C3AED",
                gradientAngle: 135,
                showDecor: true,
                decorColor1: "#22C55E",
                decorColor2: "#06B6D4",
                cardBackground: "rgba(255,255,255,0.08)",
                cardTint: "rgba(255,255,255,0.05)",
                borderColor: "rgba(255,255,255,0.14)",
                textColor: "#ECFEFF",
                subtleTextColor: "rgba(236,254,255,0.70)",
                accentColor: "#22C55E",
                accentColor2: "#06B6D4",
                trackColor: "rgba(255,255,255,0.14)",
                thumbColor: "#FFFFFF",
                shadow: "0 18px 70px rgba(0,0,0,0.42)",
            }
        default:
            return resolvePresetTheme("Dark")
    }
}

function toFixedSmart(value: number, decimals: number) {
    const p = Math.pow(10, decimals)
    const rounded = Math.round((value + Number.EPSILON) * p) / p
    if (decimals <= 0) return String(Math.round(rounded))
    return rounded.toFixed(decimals)
}

function formatMoney(value: number, symbol: string, decimals: number) {
    const safe = Number.isFinite(value) ? value : 0
    const fixed = toFixedSmart(safe, decimals)
    const [intPart, decPart] = fixed.split(".")
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    return decPart != null ? `${symbol}${withCommas}.${decPart}` : `${symbol}${withCommas}`
}

function AnimatedMoney(props: {
    value: number
    symbol: string
    decimals: number
    enabled: boolean
    style?: React.CSSProperties
}) {
    const { value, symbol, decimals, enabled, style } = props
    const mv = useMotionValue(Number.isFinite(value) ? value : 0)
    const [display, setDisplay] = React.useState(() => formatMoney(mv.get(), symbol, decimals))

    React.useEffect(() => {
        if (!enabled) {
            mv.set(Number.isFinite(value) ? value : 0)
            setDisplay(formatMoney(mv.get(), symbol, decimals))
            return
        }

        const controls = animate(mv, Number.isFinite(value) ? value : 0, {
            type: "spring",
            stiffness: 280,
            damping: 30,
            mass: 0.7,
            restDelta: 0.001,
            onUpdate: (latest) => {
                setDisplay(formatMoney(latest, symbol, decimals))
            },
        })

        return () => {
            controls.stop()
        }
    }, [value, enabled, mv, symbol, decimals])

    return (
        <motion.span style={{ ...style, fontVariantNumeric: "tabular-nums" as any }}>
            {display}
        </motion.span>
    )
}

/**
 * @framerIntrinsicWidth 560
 * @framerIntrinsicHeight 420
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function PricingCalculator(props: PricingCalculatorProps) {
    const {
        title,
        subtitle,

        currencySymbol,
        billingSuffix,
        decimals,
        showBreakdown,

        themeMode,
        presetTheme,
        showThemeSwitcher,
        allowCustomTheme,

        initialUsers,
        minUsers,
        maxUsers,
        stepUsers,

        initialStorage,
        minStorage,
        maxStorage,
        stepStorage,
        storageUnit,

        initialTeam,
        minTeam,
        maxTeam,
        stepTeam,

        basePrice,
        pricePerUser,
        pricePerStorageGB,
        pricePerTeamMember,

        includedUsers,
        includedStorageGB,
        includedTeam,

        clampIncludedToZero,

        backgroundMode: backgroundModeProp,
        background: backgroundProp,
        background2: background2Prop,
        gradientAngle: gradientAngleProp,

        showDecor: showDecorProp,
        decorColor1: decorColor1Prop,
        decorColor2: decorColor2Prop,

        cardBackground: cardBackgroundProp,
        cardTint: cardTintProp,
        borderColor: borderColorProp,
        textColor: textColorProp,
        subtleTextColor: subtleTextColorProp,
        accentColor: accentColorProp,
        accentColor2: accentColor2Prop,
        trackColor: trackColorProp,
        thumbColor: thumbColorProp,
        shadow: shadowProp,
        borderRadius,
        padding,

        titleFont,
        subtitleFont,
        labelFont,
        valueFont,
        priceFont,
        breakdownFont,
    } = props

    const themeOptions = React.useMemo(() => ["Light", "Dark", "Midnight", "Sunset", "Neon"] as const, [])
    const [selectedTheme, setSelectedTheme] = React.useState<PricingCalculatorProps["presetTheme"]>(() => presetTheme)

    React.useEffect(() => {
        React.startTransition(() => setSelectedTheme(presetTheme))
    }, [presetTheme])

    const effectiveTheme = React.useMemo(() => {
        if (themeMode === "custom") return null
        return resolvePresetTheme(selectedTheme)
    }, [themeMode, selectedTheme])

    const themeColors = React.useMemo((): ThemeColors => {
        if (effectiveTheme) return effectiveTheme
        return {
            backgroundMode: backgroundModeProp,
            background: backgroundProp,
            background2: background2Prop,
            gradientAngle: gradientAngleProp,
            showDecor: showDecorProp,
            decorColor1: decorColor1Prop,
            decorColor2: decorColor2Prop,
            cardBackground: cardBackgroundProp,
            cardTint: cardTintProp,
            borderColor: borderColorProp,
            textColor: textColorProp,
            subtleTextColor: subtleTextColorProp,
            accentColor: accentColorProp,
            accentColor2: accentColor2Prop,
            trackColor: trackColorProp,
            thumbColor: thumbColorProp,
            shadow: shadowProp,
        }
    }, [
        effectiveTheme,
        backgroundModeProp,
        backgroundProp,
        background2Prop,
        gradientAngleProp,
        showDecorProp,
        decorColor1Prop,
        decorColor2Prop,
        cardBackgroundProp,
        cardTintProp,
        borderColorProp,
        textColorProp,
        subtleTextColorProp,
        accentColorProp,
        accentColor2Prop,
        trackColorProp,
        thumbColorProp,
        shadowProp,
    ])

    const {
        backgroundMode,
        background,
        background2,
        gradientAngle,
        showDecor,
        decorColor1,
        decorColor2,
        cardBackground,
        cardTint,
        borderColor,
        textColor,
        subtleTextColor,
        accentColor,
        accentColor2,
        trackColor,
        thumbColor,
        shadow,
    } = themeColors

    const isStatic = useIsStaticRenderer()
    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const inView = useInView(rootRef, { amount: 0.25 })

    const [activeField, setActiveField] = React.useState<SliderField>("users")

    const [users, setUsers] = React.useState(() => clamp(initialUsers, minUsers, maxUsers))
    const [storage, setStorage] = React.useState(() => clamp(initialStorage, minStorage, maxStorage))
    const [team, setTeam] = React.useState(() => clamp(initialTeam, minTeam, maxTeam))

    React.useEffect(() => {
        React.startTransition(() => setUsers(clamp(initialUsers, minUsers, maxUsers)))
    }, [initialUsers, minUsers, maxUsers])

    React.useEffect(() => {
        React.startTransition(() => setStorage(clamp(initialStorage, minStorage, maxStorage)))
    }, [initialStorage, minStorage, maxStorage])

    React.useEffect(() => {
        React.startTransition(() => setTeam(clamp(initialTeam, minTeam, maxTeam)))
    }, [initialTeam, minTeam, maxTeam])

    const storageGB = React.useMemo(() => {
        const val = Number.isFinite(storage) ? storage : 0
        return storageUnit === "TB" ? val * 1024 : val
    }, [storage, storageUnit])

    const included = React.useMemo(() => {
        const incUsers = Number.isFinite(includedUsers) ? includedUsers : 0
        const incStorage = Number.isFinite(includedStorageGB) ? includedStorageGB : 0
        const incTeam = Number.isFinite(includedTeam) ? includedTeam : 0
        return { incUsers, incStorage, incTeam }
    }, [includedUsers, includedStorageGB, includedTeam])

    const billable = React.useMemo(() => {
        const rawUsers = users - included.incUsers
        const rawStorage = storageGB - included.incStorage
        const rawTeam = team - included.incTeam

        const u = clampIncludedToZero ? Math.max(0, rawUsers) : rawUsers
        const s = clampIncludedToZero ? Math.max(0, rawStorage) : rawStorage
        const t = clampIncludedToZero ? Math.max(0, rawTeam) : rawTeam

        return {
            users: Number.isFinite(u) ? u : 0,
            storageGB: Number.isFinite(s) ? s : 0,
            team: Number.isFinite(t) ? t : 0,
        }
    }, [users, storageGB, team, included, clampIncludedToZero])

    const costBreakdown = React.useMemo(() => {
        const base = Number.isFinite(basePrice) ? basePrice : 0
        const u = billable.users * (Number.isFinite(pricePerUser) ? pricePerUser : 0)
        const s = billable.storageGB * (Number.isFinite(pricePerStorageGB) ? pricePerStorageGB : 0)
        const t = billable.team * (Number.isFinite(pricePerTeamMember) ? pricePerTeamMember : 0)
        const total = base + u + s + t
        return { base, users: u, storage: s, team: t, total }
    }, [basePrice, billable, pricePerUser, pricePerStorageGB, pricePerTeamMember])

    const sliderStyle = React.useMemo((): React.CSSProperties => {
        const height = 36
        return {
            width: "100%",
            height,
            accentColor: accentColor,
            cursor: "pointer",
        }
    }, [accentColor])

    const containerStyle: React.CSSProperties = React.useMemo(
        () => ({
            position: "relative",
            width: "100%",
            height: "100%",
            background:
                backgroundMode === "gradient"
                    ? `linear-gradient(${gradientAngle}deg, ${background} 0%, ${background2} 100%)`
                    : background,
            borderRadius,
            padding,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            overflow: "hidden",
            border: `1px solid ${borderColor}`,
            boxShadow: "0 18px 50px rgba(16,24,40,0.08)",
        }),
        [backgroundMode, background, background2, gradientAngle, borderRadius, padding, borderColor]
    )

    const cardStyle: React.CSSProperties = React.useMemo(
        () => ({
            background: cardBackground,
            border: `1px solid ${borderColor}`,
            borderRadius,
            boxShadow: shadow,
            padding: "18px",
            boxSizing: "border-box",
            backdropFilter: cardTint !== "transparent" ? "blur(14px)" : undefined,
        }),
        [cardBackground, borderColor, borderRadius, shadow, cardTint]
    )

    const headerRowStyle: React.CSSProperties = React.useMemo(
        () => ({
            display: "flex",
            flexDirection: "column",
            gap: 6,
        }),
        []
    )

    const controlsCardStyle: React.CSSProperties = React.useMemo(
        () => ({
            ...cardStyle,
            display: "flex",
            flexDirection: "column",
            gap: 14,
        }),
        [cardStyle]
    )

    const priceCardStyle: React.CSSProperties = React.useMemo(
        () => ({
            ...cardStyle,
            display: "flex",
            flexDirection: "column",
            gap: 10,
        }),
        [cardStyle]
    )

    const dividerStyle: React.CSSProperties = React.useMemo(
        () => ({
            width: "100%",
            height: 1,
            background: borderColor,
            opacity: 0.7,
        }),
        [borderColor]
    )

    const labelRow: React.CSSProperties = React.useMemo(
        () => ({
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
        }),
        []
    )

    const chipStyle = React.useMemo((): React.CSSProperties => {
        return {
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: "999px",
            border: `1px solid ${borderColor}`,
            background: cardTint,
            color: textColor,
            userSelect: "none",
            cursor: "default",
            backdropFilter: "blur(10px)",
        }
    }, [borderColor, textColor, cardTint])

    const isMotionEnabled = !isStatic && inView

    const SliderRow = React.useCallback(
        (p: {
            field: SliderField
            label: string
            valueText: string
            min: number
            max: number
            step: number
            value: number
            onChange: (v: number) => void
            ariaLabel: string
        }) => {
            const { field, label, valueText, min, max, step, value, onChange, ariaLabel } = p

            const isActive = activeField === field

            return (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        padding: 12,
                        borderRadius: "14px",
                        border: `1px solid ${isActive ? accentColor : borderColor}`,
                        background: isActive ? "rgba(0,0,0,0.015)" : "transparent",
                        transition: "border-color 200ms ease, background 200ms ease",
                    }}
                    onPointerEnter={() => {
                        React.startTransition(() => setActiveField(field))
                    }}
                >
                    <div style={labelRow}>
                        <span style={{ ...labelFont, color: textColor }}>{label}</span>
                        <span style={{ ...valueFont, color: subtleTextColor, fontVariantNumeric: "tabular-nums" as any }}>
                            {valueText}
                        </span>
                    </div>

                    <div style={{ position: "relative", height: 18 }}>
                        <div
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: "50%",
                                transform: "translateY(-50%)",
                                height: 6,
                                borderRadius: 999,
                                background: trackColor,
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: `${((value - min) / Math.max(1e-6, max - min)) * 100}%`,
                                    background: accentColor,
                                    borderRadius: 999,
                                    transition: isStatic ? "none" : "width 140ms ease-out",
                                }}
                            />
                        </div>

                        <input
                            aria-label={ariaLabel}
                            type="range"
                            min={min}
                            max={max}
                            step={step}
                            value={value}
                            onChange={(e) => {
                                const v = clamp(parseFloat(e.target.value), min, max)
                                React.startTransition(() => onChange(v))
                            }}
                            onFocus={() => {
                                React.startTransition(() => setActiveField(field))
                            }}
                            style={{
                                ...sliderStyle,
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: "50%",
                                transform: "translateY(-50%)",
                                height: 18,
                                width: "100%",
                                appearance: "none",
                                background: "transparent",
                                outline: "none",
                                margin: 0,
                                padding: 0,
                            }}
                        />

                        <style>{`
                          input[type="range"]::-webkit-slider-thumb {
                            -webkit-appearance: none;
                            appearance: none;
                            width: 18px;
                            height: 18px;
                            border-radius: 999px;
                            background: ${thumbColor};
                            border: 2px solid ${accentColor};
                            box-shadow: 0 6px 18px rgba(0,0,0,0.12);
                            cursor: pointer;
                            margin-top: -6px;
                          }
                          input[type="range"]::-webkit-slider-runnable-track {
                            height: 6px;
                            background: transparent;
                            border-radius: 999px;
                          }
                          input[type="range"]::-moz-range-thumb {
                            width: 18px;
                            height: 18px;
                            border-radius: 999px;
                            background: ${thumbColor};
                            border: 2px solid ${accentColor};
                            box-shadow: 0 6px 18px rgba(0,0,0,0.12);
                            cursor: pointer;
                          }
                          input[type="range"]::-moz-range-track {
                            height: 6px;
                            background: transparent;
                            border-radius: 999px;
                          }
                        `}</style>
                    </div>
                </div>
            )
        },
        [
            accentColor,
            activeField,
            borderColor,
            labelFont,
            labelRow,
            sliderStyle,
            subtleTextColor,
            textColor,
            thumbColor,
            trackColor,
            valueFont,
            isStatic,
        ]
    )

    const storageLabel = storageUnit === "TB" ? "Storage (TB)" : "Storage (GB)"
    const storageValueText = storageUnit === "TB" ? `${storage.toFixed(2).replace(/\.00$/, "")} TB` : `${Math.round(storage)} GB`

    const usersValueText = `${Math.round(users)} users`
    const teamValueText = `${Math.round(team)} seats`

    return (
        <div ref={rootRef} style={containerStyle}>
            {showDecor && (
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: -2,
                        background: `radial-gradient(900px 380px at 12% 0%, ${decorColor1}55 0%, transparent 62%), radial-gradient(820px 360px at 95% 12%, ${decorColor2}44 0%, transparent 58%), radial-gradient(720px 340px at 60% 105%, ${accentColor2}22 0%, transparent 56%)`,
                        pointerEvents: "none",
                        filter: "saturate(1.1)",
                    }}
                />
            )}
            <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
                <div style={headerRowStyle}>
                    <div style={{ ...titleFont, color: textColor, lineHeight: titleFont?.lineHeight ?? "1.05em" }}>{title}</div>
                    <div style={{ ...subtitleFont, color: subtleTextColor }}>{subtitle}</div>
                </div>

                {showThemeSwitcher && (
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                            alignItems: "center",
                        }}
                        role="group"
                        aria-label="Color theme"
                    >
                        {themeOptions.map((t) => {
                            const active = selectedTheme === t
                            const disabled = themeMode === "custom"
                            return (
                                <button
                                    key={t}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => {
                                        if (disabled) return
                                        React.startTransition(() => setSelectedTheme(t))
                                    }}
                                    style={{
                                        ...labelFont,
                                        cursor: disabled ? "not-allowed" : "pointer",
                                        userSelect: "none",
                                        padding: "8px 10px",
                                        borderRadius: 999,
                                        border: `1px solid ${active ? accentColor : borderColor}`,
                                        background: active ? `linear-gradient(180deg, ${cardTint} 0%, rgba(0,0,0,0.0) 100%)` : "transparent",
                                        color: disabled ? subtleTextColor : textColor,
                                        opacity: disabled ? 0.55 : 1,
                                        transition: "border-color 200ms ease, background 200ms ease, opacity 200ms ease",
                                    }}
                                >
                                    {t}
                                </button>
                            )
                        })}

                        {allowCustomTheme && (
                            <span
                                style={{
                                    ...breakdownFont,
                                    color: themeMode === "custom" ? textColor : subtleTextColor,
                                    paddingLeft: 4,
                                }}
                            >
                                {themeMode === "custom" ? "Custom palette" : "Preset theme"}
                            </span>
                        )}
                    </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 14, flex: 1, minHeight: 0 }}>
                    <div style={controlsCardStyle}>
                        {SliderRow({
                            field: "users",
                            label: "Users",
                            valueText: usersValueText,
                            min: minUsers,
                            max: maxUsers,
                            step: stepUsers,
                            value: users,
                            onChange: setUsers,
                            ariaLabel: "Users",
                        })}

                        {SliderRow({
                            field: "storage",
                            label: storageLabel,
                            valueText: storageValueText,
                            min: minStorage,
                            max: maxStorage,
                            step: stepStorage,
                            value: storage,
                            onChange: setStorage,
                            ariaLabel: "Storage",
                        })}

                        {SliderRow({
                            field: "team",
                            label: "Team size",
                            valueText: teamValueText,
                            min: minTeam,
                            max: maxTeam,
                            step: stepTeam,
                            value: team,
                            onChange: setTeam,
                            ariaLabel: "Team size",
                        })}
                    </div>

                    <div style={{ ...priceCardStyle, background: `linear-gradient(180deg, ${cardBackground} 0%, ${cardTint} 120%)` }} aria-label="Estimated monthly price">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                            <span style={{ ...labelFont, color: subtleTextColor }}>Estimated</span>
                            <span style={chipStyle} aria-hidden="true">
                                <span
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 999,
                                        background: accentColor,
                                        boxShadow: `0 0 0 3px rgba(0,0,0,0.04)`,
                                    }}
                                />
                                <span style={{ ...labelFont, color: textColor }}>Monthly</span>
                            </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                            <AnimatedMoney
                                value={costBreakdown.total}
                                symbol={currencySymbol}
                                decimals={decimals}
                                enabled={isMotionEnabled}
                                style={{
                                    ...priceFont,
                                    color: textColor,
                                    letterSpacing: priceFont?.letterSpacing ?? "-0.02em",
                                }}
                            />
                            <span style={{ ...subtitleFont, color: subtleTextColor }}>{billingSuffix}</span>
                        </div>

                        {showBreakdown && (
                            <>
                                <div style={dividerStyle} />
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                        <span style={{ ...breakdownFont, color: subtleTextColor }}>Base</span>
                                        <span style={{ ...breakdownFont, color: textColor, fontVariantNumeric: "tabular-nums" as any }}>
                                            {formatMoney(costBreakdown.base, currencySymbol, decimals)}
                                        </span>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                        <span style={{ ...breakdownFont, color: subtleTextColor }}>
                                            Users ({Math.max(0, Math.round(billable.users))})
                                        </span>
                                        <span style={{ ...breakdownFont, color: textColor, fontVariantNumeric: "tabular-nums" as any }}>
                                            {formatMoney(costBreakdown.users, currencySymbol, decimals)}
                                        </span>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                        <span style={{ ...breakdownFont, color: subtleTextColor }}>
                                            Storage ({Math.max(0, Math.round(billable.storageGB))} GB)
                                        </span>
                                        <span style={{ ...breakdownFont, color: textColor, fontVariantNumeric: "tabular-nums" as any }}>
                                            {formatMoney(costBreakdown.storage, currencySymbol, decimals)}
                                        </span>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                        <span style={{ ...breakdownFont, color: subtleTextColor }}>
                                            Team ({Math.max(0, Math.round(billable.team))})
                                        </span>
                                        <span style={{ ...breakdownFont, color: textColor, fontVariantNumeric: "tabular-nums" as any }}>
                                            {formatMoney(costBreakdown.team, currencySymbol, decimals)}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}

                        <div style={{ marginTop: "auto" }}>
                            <div
                                style={{
                                    padding: "12px",
                                    borderRadius: "14px",
                                    border: `1px solid ${borderColor}`,
                                    background: "rgba(0,0,0,0.012)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 6,
                                }}
                            >
                                <div style={{ ...breakdownFont, color: subtleTextColor }}>Included</div>
                                <div style={{ ...breakdownFont, color: textColor }}>
                                    {included.incUsers} users • {included.incStorage} GB storage • {included.incTeam} seats
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(PricingCalculator, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Pricing calculator",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "Adjust your usage to estimate the monthly cost.",
    },

    themeMode: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["preset", "custom"],
        optionTitles: ["Preset", "Custom"],
        defaultValue: "preset",
        displaySegmentedControl: true,
    },
    presetTheme: {
        type: ControlType.Enum,
        title: "Preset",
        options: ["Light", "Dark", "Midnight", "Sunset", "Neon"],
        defaultValue: "Dark",
        hidden: ({ themeMode }) => themeMode !== "preset",
    },
    showThemeSwitcher: {
        type: ControlType.Boolean,
        title: "Theme UI",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    allowCustomTheme: {
        type: ControlType.Boolean,
        title: "Custom Label",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ showThemeSwitcher }) => !showThemeSwitcher,
    },

    currencySymbol: {
        type: ControlType.String,
        title: "Currency",
        defaultValue: "$",
    },
    billingSuffix: {
        type: ControlType.String,
        title: "Suffix",
        defaultValue: "/month",
    },
    decimals: {
        type: ControlType.Number,
        title: "Decimals",
        defaultValue: 0,
        min: 0,
        max: 2,
        step: 1,
        displayStepper: true,
    },
    showBreakdown: {
        type: ControlType.Boolean,
        title: "Breakdown",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    initialUsers: {
        type: ControlType.Number,
        title: "Initial Users",
        defaultValue: 25,
        min: 0,
        max: 100000,
        step: 1,
    },
    minUsers: {
        type: ControlType.Number,
        title: "Min Users",
        defaultValue: 1,
        min: 0,
        max: 100000,
        step: 1,
    },
    maxUsers: {
        type: ControlType.Number,
        title: "Max Users",
        defaultValue: 250,
        min: 1,
        max: 100000,
        step: 1,
    },
    stepUsers: {
        type: ControlType.Number,
        title: "Step Users",
        defaultValue: 1,
        min: 1,
        max: 1000,
        step: 1,
    },

    initialStorage: {
        type: ControlType.Number,
        title: "Initial Storage",
        defaultValue: 200,
        min: 0,
        max: 100000,
        step: 1,
    },
    minStorage: {
        type: ControlType.Number,
        title: "Min Storage",
        defaultValue: 50,
        min: 0,
        max: 100000,
        step: 1,
    },
    maxStorage: {
        type: ControlType.Number,
        title: "Max Storage",
        defaultValue: 2000,
        min: 1,
        max: 100000,
        step: 1,
    },
    stepStorage: {
        type: ControlType.Number,
        title: "Step Storage",
        defaultValue: 10,
        min: 1,
        max: 10000,
        step: 1,
    },
    storageUnit: {
        type: ControlType.Enum,
        title: "Storage Unit",
        options: ["GB", "TB"],
        optionTitles: ["GB", "TB"],
        defaultValue: "GB",
        displaySegmentedControl: true,
    },

    initialTeam: {
        type: ControlType.Number,
        title: "Initial Team",
        defaultValue: 8,
        min: 0,
        max: 100000,
        step: 1,
    },
    minTeam: {
        type: ControlType.Number,
        title: "Min Team",
        defaultValue: 1,
        min: 0,
        max: 100000,
        step: 1,
    },
    maxTeam: {
        type: ControlType.Number,
        title: "Max Team",
        defaultValue: 50,
        min: 1,
        max: 100000,
        step: 1,
    },
    stepTeam: {
        type: ControlType.Number,
        title: "Step Team",
        defaultValue: 1,
        min: 1,
        max: 1000,
        step: 1,
    },

    basePrice: {
        type: ControlType.Number,
        title: "Base Price",
        defaultValue: 29,
        min: 0,
        max: 100000,
        step: 1,
    },
    pricePerUser: {
        type: ControlType.Number,
        title: "Per User",
        defaultValue: 2.5,
        min: 0,
        max: 1000,
        step: 0.1,
    },
    pricePerStorageGB: {
        type: ControlType.Number,
        title: "Per GB",
        defaultValue: 0.03,
        min: 0,
        max: 10,
        step: 0.01,
    },
    pricePerTeamMember: {
        type: ControlType.Number,
        title: "Per Seat",
        defaultValue: 4,
        min: 0,
        max: 1000,
        step: 0.5,
    },

    includedUsers: {
        type: ControlType.Number,
        title: "Included Users",
        defaultValue: 5,
        min: 0,
        max: 100000,
        step: 1,
    },
    includedStorageGB: {
        type: ControlType.Number,
        title: "Included GB",
        defaultValue: 100,
        min: 0,
        max: 100000,
        step: 1,
    },
    includedTeam: {
        type: ControlType.Number,
        title: "Included Seats",
        defaultValue: 2,
        min: 0,
        max: 100000,
        step: 1,
    },
    clampIncludedToZero: {
        type: ControlType.Boolean,
        title: "No Negatives",
        defaultValue: true,
        enabledTitle: "Clamp",
        disabledTitle: "Allow",
    },

    backgroundMode: {
        type: ControlType.Enum,
        title: "BG Mode",
        options: ["solid", "gradient"],
        optionTitles: ["Solid", "Gradient"],
        defaultValue: "gradient",
        displaySegmentedControl: true,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0B1220",
    },
    background2: {
        type: ControlType.Color,
        title: "Background 2",
        defaultValue: "#1D4ED8",
        hidden: ({ backgroundMode }) => backgroundMode !== "gradient",
    },
    gradientAngle: {
        type: ControlType.Number,
        title: "BG Angle",
        defaultValue: 135,
        min: 0,
        max: 360,
        step: 1,
        unit: "deg",
        hidden: ({ backgroundMode }) => backgroundMode !== "gradient",
    },
    showDecor: {
        type: ControlType.Boolean,
        title: "Decor",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    decorColor1: {
        type: ControlType.Color,
        title: "Decor 1",
        defaultValue: "#22C55E",
        hidden: ({ showDecor }) => !showDecor,
    },
    decorColor2: {
        type: ControlType.Color,
        title: "Decor 2",
        defaultValue: "#A855F7",
        hidden: ({ showDecor }) => !showDecor,
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card",
        defaultValue: "rgba(255,255,255,0.10)",
    },
    cardTint: {
        type: ControlType.Color,
        title: "Card Tint",
        defaultValue: "rgba(255,255,255,0.06)",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#E6E8EB",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#0B1220",
    },
    subtleTextColor: {
        type: ControlType.Color,
        title: "Subtle Text",
        defaultValue: "#667085",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#60A5FA",
    },
    accentColor2: {
        type: ControlType.Color,
        title: "Accent 2",
        defaultValue: "#F97316",
    },
    trackColor: {
        type: ControlType.Color,
        title: "Track",
        defaultValue: "rgba(255,255,255,0.14)",
    },
    thumbColor: {
        type: ControlType.Color,
        title: "Thumb",
        defaultValue: "#FFFFFF",
    },
    shadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
        defaultValue: "0 14px 40px rgba(16,24,40,0.10)",
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "16px",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "18px",
    },

    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            variant: "Semibold",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    valueFont: {
        type: ControlType.Font,
        title: "Value Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    priceFont: {
        type: ControlType.Font,
        title: "Price Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
    },
    breakdownFont: {
        type: ControlType.Font,
        title: "Breakdown Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
})