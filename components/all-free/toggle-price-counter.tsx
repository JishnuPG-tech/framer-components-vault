// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { useEffect, useId, useRef, useState } from "react"

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight 220
 * @framerDisableUnlink
 */

type Period = "monthly" | "yearly"
type ThemeName = "dark" | "light"

interface TogglePriceCounterProps {
    monthly?: number
    yearly?: number
    currency?: string
    locale?: string
    defaultPeriod?: Period
    discountLabel?: string
    monthlyNote?: string
    yearlyNote?: string
    monthlyLabel?: string
    yearlyLabel?: string
    perMonthLabel?: string
    theme?: ThemeName
    textColor?: string
    mutedColor?: string
    pillColor?: string
    pillTextColor?: string
    badgeColor?: string
    badgeTextColor?: string
    periodFont?: React.CSSProperties
    priceFont?: React.CSSProperties
    noteFont?: React.CSSProperties
    style?: React.CSSProperties
}

const PALETTES: Record<
    ThemeName,
    {
        text: string
        muted: string
        seg: string
        border: string
        pill: string
        pillText: string
        badge: string
        badgeText: string
    }
> = {
    dark: {
        text: "#F5F4F1",
        muted: "rgba(245,244,241,0.55)",
        seg: "rgba(255,255,255,0.06)",
        border: "rgba(255,255,255,0.12)",
        pill: "#F5F4F1",
        pillText: "#0A0A0A",
        badge: "#3DDC97",
        badgeText: "#06281A",
    },
    light: {
        text: "#0A0A0A",
        muted: "rgba(10,10,10,0.55)",
        seg: "rgba(10,10,10,0.05)",
        border: "rgba(10,10,10,0.12)",
        pill: "#0A0A0A",
        pillText: "#FFFFFF",
        badge: "#19A35A",
        badgeText: "#FFFFFF",
    },
}

function withoutColor(
    font: React.CSSProperties | undefined
): React.CSSProperties | undefined {
    if (!font) return undefined
    const { color: _ignored, ...rest } = font
    return rest
}

function useViewportVisible(
    ref: React.RefObject<HTMLElement | null>,
    isStatic: boolean
): React.MutableRefObject<boolean> {
    const isVisibleRef = useRef(true)

    useEffect(() => {
        if (isStatic) return
        const el = ref.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisibleRef.current = entry.isIntersecting
            },
            { threshold: 0 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [isStatic, ref])

    return isVisibleRef
}

function RollingNumber({
    value,
    isStatic,
    style,
}: {
    value: string
    isStatic: boolean
    style?: React.CSSProperties
}) {
    const reduce = Boolean(useReducedMotion())
    const chars = value.split("")

    return (
        <span
            style={{
                display: "inline-flex",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
                ...style,
            }}
        >
            <span
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                    clip: "rect(0, 0, 0, 0)",
                    whiteSpace: "nowrap",
                }}
            >
                {value}
            </span>
            {chars.map((c, i) => {
                const key = chars.length - i
                if (!/\d/.test(c)) {
                    return (
                        <span key={`s${key}`} aria-hidden>
                            {c}
                        </span>
                    )
                }
                const d = Number(c)
                return (
                    <span
                        key={`d${key}`}
                        aria-hidden
                        style={{
                            position: "relative",
                            display: "inline-block",
                            overflow: "hidden",
                            height: "1em",
                            width: "0.62em",
                        }}
                    >
                        <motion.span
                            initial={false}
                            animate={{ y: `${-d}em` }}
                            transition={
                                isStatic || reduce
                                    ? { duration: 0 }
                                    : {
                                          type: "spring",
                                          stiffness: 180,
                                          damping: 22,
                                          delay: (chars.length - i) * 0.03,
                                      }
                            }
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                display: "flex",
                                flexDirection: "column",
                                transition: isStatic ? "none" : undefined,
                            }}
                        >
                            {Array.from({ length: 10 }, (_, n) => (
                                <span
                                    key={n}
                                    style={{
                                        display: "block",
                                        textAlign: "center",
                                        height: "1em",
                                        width: "0.62em",
                                    }}
                                >
                                    {n}
                                </span>
                            ))}
                        </motion.span>
                    </span>
                )
            })}
        </span>
    )
}

function SaveBadge({
    label,
    active,
    badge,
    badgeText,
    isStatic,
}: {
    label: string
    active: boolean
    badge: string
    badgeText: string
    isStatic: boolean
}) {
    const reduce = Boolean(useReducedMotion())

    return (
        <motion.span
            initial={false}
            animate={
                isStatic || reduce
                    ? { scale: 1 }
                    : { scale: active ? [1, 1.06, 1] : 1 }
            }
            transition={
                isStatic
                    ? { duration: 0 }
                    : { duration: 0.42, ease: [0.22, 1, 0.36, 1] }
            }
            style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                height: 22,
                padding: "0 8px 0 6px",
                borderRadius: 999,
                background: badge,
                color: badgeText,
                boxShadow: active
                    ? `0 0 0 1px rgba(255,255,255,0.18) inset, 0 6px 16px ${badge}55`
                    : "0 0 0 1px rgba(255,255,255,0.12) inset",
                transition: isStatic ? "none" : "box-shadow 0.25s ease",
            }}
        >
            <span
                aria-hidden
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: badgeText,
                    opacity: 0.85,
                    boxShadow: `0 0 0 3px ${badgeText}22`,
                }}
            />
            <span
                style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    lineHeight: 1,
                    textTransform: "uppercase",
                    fontFamily: "Inter, system-ui, sans-serif",
                }}
            >
                {label}
            </span>
        </motion.span>
    )
}

export default function TogglePriceCounter(props: TogglePriceCounterProps) {
    const {
        monthly = 24,
        yearly = 19,
        currency = "USD",
        locale = "en-US",
        defaultPeriod = "monthly",
        discountLabel = "",
        monthlyNote = "Billed monthly · cancel anytime",
        yearlyNote = "",
        monthlyLabel = "Monthly",
        yearlyLabel = "Yearly",
        perMonthLabel = "/ month",
        theme = "dark",
        textColor,
        mutedColor,
        pillColor,
        pillTextColor,
        badgeColor,
        badgeTextColor,
        periodFont,
        priceFont,
        noteFont,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const reduce = Boolean(useReducedMotion())
    const uid = useId()
    const rootRef = useRef<HTMLDivElement>(null)
    useViewportVisible(rootRef, isStatic)

    const [period, setPeriod] = useState<Period>(defaultPeriod)

    useEffect(() => {
        if (isStatic) return
        setPeriod(defaultPeriod)
    }, [defaultPeriod, isStatic])

    const base = PALETTES[theme]
    const p = {
        text: textColor || base.text,
        muted: mutedColor || base.muted,
        seg: base.seg,
        border: base.border,
        pill: pillColor || base.pill,
        pillText: pillTextColor || base.pillText,
        badge: badgeColor || base.badge,
        badgeText: badgeTextColor || base.badgeText,
    }

    const yearlyOn = period === "yearly"
    const safeMonthly = monthly <= 0 ? 1 : monthly
    const savePct = Math.max(0, Math.round((1 - yearly / safeMonthly) * 100))
    const saving = discountLabel.trim() ? discountLabel : `Save ${savePct}%`

    let fmt: Intl.NumberFormat
    try {
        fmt = new Intl.NumberFormat(locale, {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
        })
    } catch {
        fmt = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        })
    }

    const price = fmt.format(yearlyOn ? yearly : monthly)
    const yearlyTotal = fmt.format(yearly * 12)
    const yearlySave = fmt.format(Math.max(0, (monthly - yearly) * 12))
    const yearlyCopy =
        yearlyNote.trim() ||
        `Billed ${yearlyTotal} yearly · you save ${yearlySave}`

    const schema = {
        "@context": "https://schema.org",
        "@type": "Offer",
        name: yearlyOn ? yearlyLabel : monthlyLabel,
        price: yearlyOn ? yearly : monthly,
        priceCurrency: currency,
        description: yearlyOn ? yearlyCopy : monthlyNote,
        priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: yearlyOn ? yearly : monthly,
            priceCurrency: currency,
            unitText: "MON",
            billingDuration: yearlyOn ? "P1Y" : "P1M",
        },
    }

    return (
        <section
            ref={rootRef}
            aria-label="Pricing"
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 22,
                fontFamily: "Inter, system-ui, sans-serif",
                color: p.text,
                minWidth: 0,
                ...style,
            }}
        >
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />

            <div
                role="radiogroup"
                aria-label="Billing period"
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    borderRadius: 999,
                    padding: 4,
                    gap: 2,
                    background: p.seg,
                    border: `1px solid ${p.border}`,
                }}
            >
                {(["monthly", "yearly"] as const).map((v) => {
                    const on = period === v
                    return (
                        <button
                            key={v}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            aria-pressed={on}
                            onClick={() => setPeriod(v)}
                            style={{
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                height: 38,
                                padding:
                                    v === "yearly" ? "0 10px 0 16px" : "0 18px",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                color: on ? p.pillText : p.muted,
                                fontSize: 14,
                                fontWeight: 600,
                                outline: isStatic
                                    ? "none"
                                    : "2px solid transparent",
                                outlineOffset: 2,
                                transition: isStatic
                                    ? "none"
                                    : "color 0.2s ease",
                                ...withoutColor(periodFont),
                            }}
                        >
                            {on ? (
                                <motion.span
                                    layoutId={
                                        isStatic ? undefined : `${uid}-pill`
                                    }
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        borderRadius: 999,
                                        background: p.pill,
                                        transition: isStatic
                                            ? "none"
                                            : undefined,
                                    }}
                                    transition={
                                        isStatic
                                            ? { duration: 0 }
                                            : {
                                                  type: "spring",
                                                  stiffness: 500,
                                                  damping: 36,
                                              }
                                    }
                                />
                            ) : null}
                            <span style={{ position: "relative", zIndex: 1 }}>
                                {v === "monthly" ? monthlyLabel : yearlyLabel}
                            </span>
                            {v === "yearly" ? (
                                <span
                                    style={{
                                        position: "relative",
                                        zIndex: 1,
                                    }}
                                >
                                    <SaveBadge
                                        label={saving}
                                        active={yearlyOn}
                                        badge={p.badge}
                                        badgeText={p.badgeText}
                                        isStatic={isStatic}
                                    />
                                </span>
                            ) : null}
                        </button>
                    )
                })}
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    minWidth: 0,
                }}
            >
                <p
                    aria-live="polite"
                    style={{
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        flexWrap: "wrap",
                        gap: 8,
                        margin: 0,
                        color: p.text,
                    }}
                >
                    <RollingNumber
                        value={price}
                        isStatic={isStatic}
                        style={{
                            fontWeight: 600,
                            letterSpacing: "-0.04em",
                            fontSize: 64,
                            color: p.text,
                            ...withoutColor(priceFont),
                        }}
                    />
                    <span
                        style={{
                            paddingBottom: 8,
                            fontSize: 15,
                            color: p.muted,
                            ...withoutColor(noteFont),
                        }}
                    >
                        {perMonthLabel}
                    </span>
                </p>

                <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                        key={period}
                        initial={
                            isStatic || reduce
                                ? { opacity: 1, y: 0 }
                                : { opacity: 0, y: 6 }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        exit={
                            isStatic || reduce
                                ? { opacity: 1, y: 0 }
                                : { opacity: 0, y: -6 }
                        }
                        transition={
                            isStatic
                                ? { duration: 0 }
                                : { duration: reduce ? 0 : 0.18 }
                        }
                        style={{
                            margin: 0,
                            fontSize: 13,
                            color: p.muted,
                            textAlign: "center",
                            transition: isStatic ? "none" : undefined,
                            ...withoutColor(noteFont),
                        }}
                    >
                        {yearlyOn ? yearlyCopy : monthlyNote}
                    </motion.p>
                </AnimatePresence>
            </div>
        </section>
    )
}

addPropertyControls(TogglePriceCounter, {
    monthly: {
        type: ControlType.Number,
        title: "Monthly",
        defaultValue: 24,
        min: 0,
        displayStepper: true,
        description: "Price per month on monthly billing.",
    },
    yearly: {
        type: ControlType.Number,
        title: "Yearly",
        defaultValue: 19,
        min: 0,
        displayStepper: true,
        description: "Equivalent monthly price on yearly billing.",
    },
    currency: {
        type: ControlType.String,
        title: "Currency",
        defaultValue: "USD",
        description: "ISO currency code, e.g. USD, EUR, TRY.",
    },
    locale: {
        type: ControlType.String,
        title: "Locale",
        defaultValue: "en-US",
        description: "BCP 47 locale for currency formatting.",
    },
    defaultPeriod: {
        type: ControlType.Enum,
        title: "Default",
        options: ["monthly", "yearly"],
        optionTitles: ["Monthly", "Yearly"],
        defaultValue: "monthly",
        displaySegmentedControl: true,
    },
    monthlyLabel: {
        type: ControlType.String,
        title: "Monthly Label",
        defaultValue: "Monthly",
    },
    yearlyLabel: {
        type: ControlType.String,
        title: "Yearly Label",
        defaultValue: "Yearly",
    },
    perMonthLabel: {
        type: ControlType.String,
        title: "Per Month",
        defaultValue: "/ month",
    },
    discountLabel: {
        type: ControlType.String,
        title: "Save Label",
        defaultValue: "",
        description: "Override badge text. Empty uses computed Save 21%.",
    },
    monthlyNote: {
        type: ControlType.String,
        title: "Monthly Note",
        defaultValue: "Billed monthly · cancel anytime",
        displayTextArea: true,
    },
    yearlyNote: {
        type: ControlType.String,
        title: "Yearly Note",
        defaultValue: "",
        displayTextArea: true,
        description: "Empty = billed total and yearly savings.",
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["dark", "light"],
        optionTitles: ["Dark", "Light"],
        defaultValue: "dark",
        displaySegmentedControl: true,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#F5F4F1",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Muted",
        defaultValue: "rgba(245,244,241,0.55)",
    },
    pillColor: {
        type: ControlType.Color,
        title: "Pill",
        defaultValue: "#F5F4F1",
    },
    pillTextColor: {
        type: ControlType.Color,
        title: "Pill Text",
        defaultValue: "#0A0A0A",
    },
    badgeColor: {
        type: ControlType.Color,
        title: "Badge",
        defaultValue: "#3DDC97",
    },
    badgeTextColor: {
        type: ControlType.Color,
        title: "Badge Text",
        defaultValue: "#06281A",
    },
    periodFont: {
        type: ControlType.Font,
        title: "Period Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 14 },
    },
    priceFont: {
        type: ControlType.Font,
        title: "Price Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 64 },
    },
    noteFont: {
        type: ControlType.Font,
        title: "Note Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 13 },
    },
})
