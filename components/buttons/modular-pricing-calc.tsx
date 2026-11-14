/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight 480
 *
 * ModularPricing — Interactive pricing calculator for Framer
 * Features: RTL/Arabic support, animated totals, savings badge,
 * yearly savings, breakdown tooltip, CTA button, full design token control.
 */

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"

// ─── Types ────────────────────────────────────────────────────────────────────

type ControlMode = "toggle" | "checkbox" | "stepper"
type Currency = "USD" | "EUR" | "EGP" | "SAR" | "AED" | "GBP"

interface PricingRow {
    mode: ControlMode
    label: string
    price: number
    isMultiplier: boolean
    multiplier: number
    min: number
    max: number
}
interface CardStyle {
    bg: string
    border: string
    radius: number
    padding: number
    shadow: string
    divider: string
}
interface Typography {
    bodyFont: string
    labelSize: number
    labelColor: string
    mutedColor: string
    priceFont: string
    priceSize: number
    priceColor: string
}
interface Colors {
    accent: string
}
interface ControlsStyle {
    rowBg: string
    rowRadius: number
    boxBg: string
    boxBorder: string
    boxRadius: number
    btnRadius: number
    btnBg: string
    btnBorder: string
    btnColor: string
    counterFont: string
}
interface Badges {
    savingsBg: string
    savingsBorder: string
    savingsColor: string
    savingsRadius: number
    tooltipBg: string
    tooltipBorder: string
    tooltipRadius: number
}
interface Cta {
    showCta: boolean
    ctaLabel: string
    ctaUrl: string
    ctaNewTab: boolean
    ctaBg: string
    ctaColor: string
    ctaRadius: number
    ctaPadding: number
    ctaSize: number
}

// ─── Currency formatting ──────────────────────────────────────────────────────

const CURRENCY_LOCALES: Record<Currency, string> = {
    USD: "en-US",
    EUR: "en-DE",
    EGP: "en-EG",
    SAR: "en-SA",
    AED: "en-AE",
    GBP: "en-GB",
}

function formatPrice(value: number, currency: Currency) {
    return new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)
}

// ─── URL sanitizer ────────────────────────────────────────────────────────────

const SAFE_URL_RE = /^(https?:|mailto:|tel:)\/?\//i

function sanitizeUrl(url: string): string {
    if (!url || typeof url !== "string") return "#"
    const trimmed = url.trim()
    // Allow fragment-only links
    if (trimmed.startsWith("#")) return trimmed
    // Allow relative paths (no protocol)
    if (
        trimmed.startsWith("/") ||
        trimmed.startsWith("./") ||
        trimmed.startsWith("../")
    )
        return trimmed
    // Allow safe absolute protocols
    if (SAFE_URL_RE.test(trimmed)) return trimmed
    // Allow bare relative paths (no colon before first slash)
    if (!trimmed.includes(":")) return trimmed
    // Block everything else (javascript:, data:, vbscript:, etc.)
    return "#"
}

// ─── Animated Number (fixed stale-closure + flicker) ──────────────────────────

function AnimatedNumber({
    value,
    currency,
    isStatic,
}: {
    value: number
    currency: Currency
    isStatic: boolean
}) {
    // In static rendering, skip all animation and show final value directly
    if (isStatic) {
        return (
            <span style={{ display: "inline-block" }}>
                {formatPrice(value, currency)}
            </span>
        )
    }

    const [disp, setDisp] = useState(value)
    const frameRef = useRef<number | null>(null)
    const startRef = useRef<number | null>(null)
    const startVal = useRef(value)
    const targetRef = useRef(value)

    useEffect(() => {
        targetRef.current = value
        // Capture the current displayed value at the moment the target changes
        startVal.current = disp
        startRef.current = null

        if (value === disp) return

        const dur = 380
        const tick = (now: number) => {
            if (!startRef.current) startRef.current = now
            const p = Math.min((now - startRef.current) / dur, 1)
            const e = 1 - Math.pow(1 - p, 3) // ease-out cubic
            const next = Math.round(
                startVal.current + (targetRef.current - startVal.current) * e
            )
            setDisp(next)
            if (p < 1) frameRef.current = requestAnimationFrame(tick)
        }
        frameRef.current = requestAnimationFrame(tick)
        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current)
        }
        // Only re-run when target value changes, not when disp changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    // Sync on mount / hard reset
    useEffect(() => {
        startVal.current = value
        setDisp(value)
    }, [currency])

    return (
        <motion.span
            key="price"
            animate={{ opacity: 1, y: 0 }}
            style={{ display: "inline-block" }}
        >
            {formatPrice(disp, currency)}
        </motion.span>
    )
}

// ─── Toggle (fixed RTL thumb) ─────────────────────────────────────────────────

function ToggleControl({
    label,
    checked,
    onChange,
    accent,
    labelColor,
    labelSize,
    labelFont,
    btnRadius,
    direction,
    isStatic,
}: {
    label: string
    checked: boolean
    onChange: (v: boolean) => void
    accent: string
    labelColor: string
    labelSize: number
    labelFont: string
    btnRadius: number
    direction: "ltr" | "rtl"
    isStatic: boolean
}) {
    const ThumbTag = isStatic ? "span" : motion.span
    const thumbProps = isStatic
        ? {}
        : {
              layout: true,
              transition: { type: "spring", damping: 25, stiffness: 300 },
          }

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
            }}
        >
            <span
                style={{
                    fontSize: labelSize,
                    color: labelColor,
                    fontFamily: labelFont,
                }}
            >
                {label}
            </span>
            <button
                role="switch"
                aria-checked={checked}
                aria-label={label}
                onClick={() => onChange(!checked)}
                style={{
                    width: 44,
                    height: 24,
                    borderRadius: btnRadius * 2,
                    border: "none",
                    cursor: "pointer",
                    background: checked ? accent : "var(--mp-surf-off)",
                    position: "relative",
                    flexShrink: 0,
                    transition: isStatic
                        ? "none"
                        : "background 180ms cubic-bezier(.16,1,.3,1)",
                }}
            >
                <ThumbTag
                    {...thumbProps}
                    style={{
                        position: "absolute",
                        top: 3,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "#fff",
                        boxShadow: "0 1px 4px rgba(0,0,0,.18)",
                        insetInlineStart: checked ? "calc(100% - 21px)" : "3px",
                        insetInlineEnd: "auto",
                    }}
                />
            </button>
        </div>
    )
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────

function CheckboxControl({
    label,
    checked,
    onChange,
    accent,
    cs,
    labelColor,
    labelSize,
    labelFont,
    isStatic,
}: {
    label: string
    checked: boolean
    onChange: (v: boolean) => void
    accent: string
    cs: ControlsStyle
    labelColor: string
    labelSize: number
    labelFont: string
    isStatic: boolean
}) {
    const IndicatorTag = isStatic ? "span" : motion.span
    const indicatorProps = isStatic
        ? {}
        : {
              animate: {
                  scale: checked ? 1 : 0.8,
                  opacity: checked ? 1 : 0.4,
              },
              transition: { type: "spring", damping: 25, stiffness: 300 },
          }

    return (
        <button
            role="checkbox"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                background: checked ? `${accent}14` : cs.rowBg,
                border: `1.5px solid ${checked ? accent : cs.boxBorder}`,
                borderRadius: cs.rowRadius,
                padding: "10px 14px",
                width: "100%",
                textAlign: "start",
                transition: isStatic
                    ? "none"
                    : "all 180ms cubic-bezier(.16,1,.3,1)",
            }}
        >
            <IndicatorTag
                {...indicatorProps}
                style={{
                    width: 18,
                    height: 18,
                    borderRadius: cs.boxRadius,
                    flexShrink: 0,
                    background: checked ? accent : cs.boxBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    ...(isStatic
                        ? {
                              scale: checked ? 1 : 0.8,
                              opacity: checked ? 1 : 0.4,
                          }
                        : {}),
                }}
            >
                {checked && (
                    <svg
                        width="10"
                        height="8"
                        viewBox="0 0 10 8"
                        fill="none"
                        aria-hidden="true"
                    >
                        <path
                            d="M1 4L3.5 6.5L9 1.5"
                            stroke="white"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )}
            </IndicatorTag>
            <span
                style={{
                    fontSize: labelSize,
                    color: labelColor,
                    fontFamily: labelFont,
                }}
            >
                {label}
            </span>
        </button>
    )
}

// ─── Stepper Button (extracted to avoid re-creation each render) ──────────────

function StepperBtn({
    icon,
    disabled,
    onClick,
    ariaLabel,
    cs,
    btnBg,
    btnBorder,
    btnColor,
    isStatic,
}: {
    icon: string
    disabled: boolean
    onClick: () => void
    ariaLabel: string
    cs: ControlsStyle
    btnBg: string
    btnBorder: string
    btnColor: string
    isStatic: boolean
}) {
    if (isStatic) {
        return (
            <button
                onClick={onClick}
                disabled={disabled}
                aria-label={ariaLabel}
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: cs.btnRadius,
                    lineHeight: 1,
                    background: disabled ? "var(--mp-surf-off)" : btnBg,
                    border: `1.5px solid ${disabled ? "var(--mp-border)" : btnBorder}`,
                    color: disabled ? "var(--mp-text-muted)" : btnColor,
                    fontSize: 18,
                    fontWeight: 600,
                    cursor: disabled ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: disabled ? 0.4 : 1,
                }}
            >
                {icon}
            </button>
        )
    }

    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            whileTap={{ scale: disabled ? 1 : 0.88 }}
            aria-label={ariaLabel}
            style={{
                width: 32,
                height: 32,
                borderRadius: cs.btnRadius,
                lineHeight: 1,
                background: disabled ? "var(--mp-surf-off)" : btnBg,
                border: `1.5px solid ${disabled ? "var(--mp-border)" : btnBorder}`,
                color: disabled ? "var(--mp-text-muted)" : btnColor,
                fontSize: 18,
                fontWeight: 600,
                cursor: disabled ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 180ms cubic-bezier(.16,1,.3,1)",
                opacity: disabled ? 0.4 : 1,
            }}
        >
            {icon}
        </motion.button>
    )
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

function StepperControl({
    label,
    value,
    onChange,
    min,
    max,
    accent,
    cs,
    labelColor,
    labelSize,
    labelFont,
    isStatic,
}: {
    label: string
    value: number
    onChange: (v: number) => void
    min: number
    max: number
    accent: string
    cs: ControlsStyle
    labelColor: string
    labelSize: number
    labelFont: string
    isStatic: boolean
}) {
    const btnBg = cs.btnBg || `${accent}18`
    const btnBorder = cs.btnBorder || accent
    const btnColor = cs.btnColor || accent

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
            }}
        >
            <span
                style={{
                    fontSize: labelSize,
                    color: labelColor,
                    fontFamily: labelFont,
                }}
            >
                {label}
            </span>
            <div
                role="group"
                aria-label={label}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
                <StepperBtn
                    icon="−"
                    disabled={value <= min}
                    ariaLabel={`Decrease ${label}`}
                    onClick={() => value > min && onChange(value - 1)}
                    cs={cs}
                    btnBg={btnBg}
                    btnBorder={btnBorder}
                    btnColor={btnColor}
                    isStatic={isStatic}
                />
                {isStatic ? (
                    <span
                        aria-live="polite"
                        style={{
                            fontSize: 16,
                            fontWeight: 600,
                            minWidth: 28,
                            textAlign: "center",
                            color: labelColor,
                            fontFamily: cs.counterFont || labelFont,
                            fontVariantNumeric: "tabular-nums",
                        }}
                    >
                        {value}
                    </span>
                ) : (
                    <motion.span
                        key={value}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            type: "spring",
                            damping: 20,
                            stiffness: 300,
                        }}
                        aria-live="polite"
                        style={{
                            fontSize: 16,
                            fontWeight: 600,
                            minWidth: 28,
                            textAlign: "center",
                            color: labelColor,
                            fontFamily: cs.counterFont || labelFont,
                            fontVariantNumeric: "tabular-nums",
                        }}
                    >
                        {value}
                    </motion.span>
                )}
                <StepperBtn
                    icon="+"
                    disabled={value >= max}
                    ariaLabel={`Increase ${label}`}
                    onClick={() => value < max && onChange(value + 1)}
                    cs={cs}
                    btnBg={btnBg}
                    btnBorder={btnBorder}
                    btnColor={btnColor}
                    isStatic={isStatic}
                />
            </div>
        </div>
    )
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_ROWS: PricingRow[] = [
    {
        mode: "toggle",
        label: "Annual billing (save 20%)",
        price: 0,
        isMultiplier: true,
        multiplier: 0.8,
        min: 1,
        max: 1,
    },
    {
        mode: "stepper",
        label: "Team members",
        price: 10,
        isMultiplier: false,
        multiplier: 1,
        min: 1,
        max: 20,
    },
    {
        mode: "checkbox",
        label: "AI features",
        price: 15,
        isMultiplier: false,
        multiplier: 1,
        min: 1,
        max: 1,
    },
    {
        mode: "checkbox",
        label: "Extra storage 20 GB",
        price: 5,
        isMultiplier: false,
        multiplier: 1,
        min: 1,
        max: 1,
    },
]
const DEFAULT_CARD: CardStyle = {
    bg: "#f9f8f5",
    border: "#d4d1ca",
    radius: 16,
    padding: 24,
    shadow: "0 4px 24px rgba(0,0,0,0.07)",
    divider: "#d4d1ca",
}
const DEFAULT_TYPE: Typography = {
    bodyFont: "Inter, DM Sans, system-ui, sans-serif",
    labelSize: 14,
    labelColor: "#28251d",
    mutedColor: "#7a7974",
    priceFont: "Inter, DM Sans, system-ui, sans-serif",
    priceSize: 40,
    priceColor: "#28251d",
}
const DEFAULT_COLORS: Colors = { accent: "#01696f" }
const DEFAULT_CONTROLS: ControlsStyle = {
    rowBg: "#f1f0ec",
    rowRadius: 10,
    boxBg: "#d4d1ca",
    boxBorder: "#d4d1ca",
    boxRadius: 5,
    btnRadius: 8,
    btnBg: "",
    btnBorder: "",
    btnColor: "",
    counterFont: "",
}
const DEFAULT_BADGES: Badges = {
    savingsBg: "#22c55e18",
    savingsBorder: "#22c55e55",
    savingsColor: "#16a34a",
    savingsRadius: 12,
    tooltipBg: "#f9f8f5",
    tooltipBorder: "#d4d1ca",
    tooltipRadius: 12,
}
const DEFAULT_CTA: Cta = {
    showCta: true,
    ctaLabel: "Get started",
    ctaUrl: "#",
    ctaNewTab: false,
    ctaBg: "",
    ctaColor: "#ffffff",
    ctaRadius: 10,
    ctaPadding: 14,
    ctaSize: 15,
}

// ─── Stable row fingerprint for detecting config changes ──────────────────────

function rowFingerprint(rows: PricingRow[]): string {
    return rows.map((r) => `${r.mode}:${r.label}:${r.min}`).join("|")
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ModularPricing({
    basePrice = 29,
    currency = "USD" as Currency,
    direction = "ltr" as "ltr" | "rtl",
    billingLabel = "per month",
    showBreakdown = true,
    showSavings = true,
    rows = DEFAULT_ROWS,
    cardStyle = DEFAULT_CARD,
    typography = DEFAULT_TYPE,
    colors = DEFAULT_COLORS,
    controlsStyle = DEFAULT_CONTROLS,
    badges = DEFAULT_BADGES,
    cta = DEFAULT_CTA,
    style,
}: {
    basePrice?: number
    currency?: Currency
    direction?: "ltr" | "rtl"
    billingLabel?: string
    showBreakdown?: boolean
    showSavings?: boolean
    rows?: PricingRow[]
    cardStyle?: CardStyle
    typography?: Typography
    colors?: Colors
    controlsStyle?: ControlsStyle
    badges?: Badges
    cta?: Cta
    style?: React.CSSProperties
}) {
    const c = { ...DEFAULT_CARD, ...cardStyle }
    const t = { ...DEFAULT_TYPE, ...typography }
    const k = { ...DEFAULT_COLORS, ...colors }
    const s = { ...DEFAULT_CONTROLS, ...controlsStyle }
    const b = { ...DEFAULT_BADGES, ...badges }
    const a = { ...DEFAULT_CTA, ...cta }

    const isStatic = useIsStaticRenderer()
    const safeCtaUrl = sanitizeUrl(a.ctaUrl)

    // ── Reset state when rows change in structure, not just count ──
    const fingerprint = rowFingerprint(rows)
    const [toggles, setToggles] = useState<Record<number, boolean>>(() =>
        Object.fromEntries(rows.map((_, i) => [i, false]))
    )
    const [steps, setSteps] = useState<Record<number, number>>(() =>
        Object.fromEntries(rows.map((r, i) => [i, r.min]))
    )
    const [showTip, setShowTip] = useState(false)

    const prevFingerprint = useRef(fingerprint)
    useEffect(() => {
        if (fingerprint !== prevFingerprint.current) {
            setToggles(Object.fromEntries(rows.map((_, i) => [i, false])))
            setSteps(Object.fromEntries(rows.map((r, i) => [i, r.min])))
            prevFingerprint.current = fingerprint
        }
    }, [fingerprint, rows])

    // ── Clamp step values when min/max change in property panel ──
    useEffect(() => {
        setSteps((prev) => {
            let changed = false
            const next = { ...prev }
            rows.forEach((r, i) => {
                if (r.mode === "stepper") {
                    const v = next[i] ?? r.min
                    const clamped = Math.max(r.min, Math.min(r.max, v))
                    if (clamped !== v) {
                        next[i] = clamped
                        changed = true
                    }
                }
            })
            return changed ? next : prev
        })
    }, [rows])

    // ── Memoized callbacks to avoid passing new refs every render ──
    const handleToggle = useCallback((i: number, v: boolean) => {
        setToggles((p) => ({ ...p, [i]: v }))
    }, [])
    const handleStep = useCallback((i: number, v: number) => {
        setSteps((p) => ({ ...p, [i]: v }))
    }, [])

    // ── Calculate total ──
    let total = basePrice
    const breakdown: { label: string; amount: number }[] = [
        {
            label: direction === "rtl" ? "السعر الأساسي" : "Base price",
            amount: basePrice,
        },
    ]
    for (let i = 0; i < rows.length; i++) {
        const r = rows[i]
        if ((r.mode === "toggle" || r.mode === "checkbox") && toggles[i]) {
            if (r.isMultiplier) {
                const saving = -(total * (1 - r.multiplier))
                breakdown.push({ label: r.label, amount: saving })
                total = Math.round(total * r.multiplier)
            } else {
                total += r.price
                breakdown.push({ label: r.label, amount: r.price })
            }
        }
        if (r.mode === "stepper") {
            const qty = steps[i] ?? r.min
            const added = r.price * (qty - 1)
            if (added > 0) {
                breakdown.push({ label: `${r.label} ×${qty}`, amount: added })
                total += added
            }
        }
    }

    // ── Savings ──
    const preDis = rows.reduce((acc, r, i) => {
        if (r.mode === "stepper")
            return acc + r.price * ((steps[i] ?? r.min) - 1)
        if (
            (r.mode === "toggle" || r.mode === "checkbox") &&
            toggles[i] &&
            !r.isMultiplier
        )
            return acc + r.price
        return acc
    }, basePrice)
    const activeMult = rows
        .filter(
            (r, i) =>
                (r.mode === "toggle" || r.mode === "checkbox") &&
                toggles[i] &&
                r.isMultiplier
        )
        .reduce((acc, r) => acc * r.multiplier, 1)
    const savingsAmt =
        activeMult < 1 ? Math.round(preDis * (1 - activeMult)) : 0
    const savingsYear = savingsAmt * 12

    const cssVars = {
        "--mp-text": t.labelColor,
        "--mp-text-muted": t.mutedColor,
        "--mp-surf-off": s.rowBg,
        "--mp-border": c.border,
    } as React.CSSProperties

    return (
        <div
            dir={direction}
            role="region"
            aria-label="Pricing calculator"
            style={{
                ...cssVars,
                fontFamily: t.bodyFont,
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: c.radius,
                padding: c.padding,
                display: "flex",
                flexDirection: "column",
                gap: 20,
                width: "100%",
                maxWidth: "min(360px, 100%)",
                boxSizing: "border-box",
                boxShadow: c.shadow,
                ...style,
            }}
        >
            {/* Controls */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {rows.map((r, i) => {
                    if (r.mode === "toggle")
                        return (
                            <ToggleControl
                                key={`toggle-${i}`}
                                label={r.label}
                                accent={k.accent}
                                labelColor={t.labelColor}
                                labelSize={t.labelSize}
                                labelFont={t.bodyFont}
                                btnRadius={s.btnRadius}
                                checked={toggles[i] ?? false}
                                onChange={(v) => handleToggle(i, v)}
                                direction={direction}
                                isStatic={isStatic}
                            />
                        )
                    if (r.mode === "checkbox")
                        return (
                            <CheckboxControl
                                key={`check-${i}`}
                                label={r.label}
                                accent={k.accent}
                                cs={s}
                                labelColor={t.labelColor}
                                labelSize={t.labelSize}
                                labelFont={t.bodyFont}
                                checked={toggles[i] ?? false}
                                onChange={(v) => handleToggle(i, v)}
                                isStatic={isStatic}
                            />
                        )
                    if (r.mode === "stepper")
                        return (
                            <StepperControl
                                key={`step-${i}`}
                                label={r.label}
                                accent={k.accent}
                                cs={s}
                                labelColor={t.labelColor}
                                labelSize={t.labelSize}
                                labelFont={t.bodyFont}
                                value={steps[i] ?? r.min}
                                min={r.min}
                                max={r.max}
                                onChange={(v) => handleStep(i, v)}
                                isStatic={isStatic}
                            />
                        )
                    return null
                })}
            </div>

            <div
                style={{ height: 1, background: c.divider }}
                role="separator"
            />

            {/* Price section */}
            <div
                style={{
                    position: "relative",
                    cursor: showBreakdown ? "pointer" : "default",
                }}
                onMouseEnter={() =>
                    !isStatic && showBreakdown && setShowTip(true)
                }
                onMouseLeave={() => !isStatic && setShowTip(false)}
            >
                {/* Breakdown tooltip */}
                <AnimatePresence>
                    {showTip && showBreakdown && (
                        <motion.div
                            role="tooltip"
                            initial={{ opacity: 0, y: 4, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.97 }}
                            transition={{
                                duration: 0.15,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                            style={{
                                position: "absolute",
                                bottom: "calc(100% + 8px)",
                                insetInlineStart: 0,
                                insetInlineEnd: 0,
                                background: b.tooltipBg,
                                border: `1px solid ${b.tooltipBorder}`,
                                borderRadius: b.tooltipRadius,
                                padding: "12px 14px",
                                boxShadow: "0 8px 24px rgba(0,0,0,.12)",
                                zIndex: 10,
                            }}
                        >
                            {breakdown.map((item, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        gap: 16,
                                        fontSize: 13,
                                        padding: "3px 0",
                                        color:
                                            item.amount < 0
                                                ? b.savingsColor
                                                : t.mutedColor,
                                        borderBottom:
                                            i < breakdown.length - 1
                                                ? `1px solid ${b.tooltipBorder}`
                                                : "none",
                                    }}
                                >
                                    <span
                                        style={{
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            minWidth: 0,
                                        }}
                                    >
                                        {item.label}
                                    </span>
                                    <span
                                        style={{
                                            fontVariantNumeric: "tabular-nums",
                                            fontWeight: 500,
                                            flexShrink: 0,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {item.amount >= 0 ? "+" : "−"}
                                        {formatPrice(
                                            Math.abs(item.amount),
                                            currency
                                        )}
                                    </span>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Price */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: 8,
                        flexWrap: "wrap",
                    }}
                >
                    <span
                        style={{
                            fontSize: t.priceSize,
                            fontWeight: 700,
                            color: t.priceColor,
                            lineHeight: 1,
                            fontFamily: t.priceFont,
                        }}
                    >
                        <AnimatedNumber
                            value={Math.round(total)}
                            currency={currency}
                            isStatic={isStatic}
                        />
                    </span>
                    <span
                        style={{
                            fontSize: 14,
                            color: t.mutedColor,
                            marginBottom: 4,
                        }}
                    >
                        / {billingLabel}
                    </span>
                </div>

                {/* Savings badge */}
                {isStatic ? (
                    showSavings &&
                    savingsAmt > 0 && (
                        <div
                            role="status"
                            style={{
                                background: b.savingsBg,
                                border: `1.5px solid ${b.savingsBorder}`,
                                borderRadius: b.savingsRadius,
                                padding: "8px 12px",
                                marginTop: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                color: b.savingsColor,
                                display: "inline-flex",
                                flexDirection: "column",
                                gap: 2,
                            }}
                        >
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                }}
                            >
                                <span aria-hidden="true">↓</span>
                                <span>
                                    {direction === "rtl"
                                        ? `وفّرت ${formatPrice(savingsAmt, currency)} / شهرياً`
                                        : `Save ${formatPrice(savingsAmt, currency)} / month`}
                                </span>
                            </span>
                            <span style={{ opacity: 0.75, fontWeight: 500 }}>
                                {direction === "rtl"
                                    ? `${formatPrice(savingsYear, currency)} وفورات سنوية`
                                    : `${formatPrice(savingsYear, currency)} saved per year`}
                            </span>
                        </div>
                    )
                ) : (
                    <AnimatePresence>
                        {showSavings && savingsAmt > 0 && (
                            <motion.div
                                role="status"
                                aria-live="polite"
                                initial={{ opacity: 0, scale: 0.85, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.85, y: -4 }}
                                transition={{
                                    type: "spring",
                                    damping: 20,
                                    stiffness: 280,
                                }}
                                style={{
                                    background: b.savingsBg,
                                    border: `1.5px solid ${b.savingsBorder}`,
                                    borderRadius: b.savingsRadius,
                                    padding: "8px 12px",
                                    marginTop: 8,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: b.savingsColor,
                                    display: "inline-flex",
                                    flexDirection: "column",
                                    gap: 2,
                                }}
                            >
                                <span
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                    }}
                                >
                                    <span aria-hidden="true">↓</span>
                                    <span>
                                        {direction === "rtl"
                                            ? `وفّرت ${formatPrice(savingsAmt, currency)} / شهرياً`
                                            : `Save ${formatPrice(savingsAmt, currency)} / month`}
                                    </span>
                                </span>
                                <span
                                    style={{ opacity: 0.75, fontWeight: 500 }}
                                >
                                    {direction === "rtl"
                                        ? `${formatPrice(savingsYear, currency)} وفورات سنوية`
                                        : `${formatPrice(savingsYear, currency)} saved per year`}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}

                {showBreakdown && (
                    <p
                        style={{
                            fontSize: 12,
                            color: t.mutedColor,
                            marginTop: 6,
                        }}
                    >
                        {direction === "rtl"
                            ? "مرر فوق السعر لرؤية التفاصيل"
                            : "Hover price for breakdown"}
                    </p>
                )}
            </div>

            {/* CTA Button */}
            {a.showCta &&
                (isStatic ? (
                    <a
                        href={safeCtaUrl}
                        target={a.ctaNewTab ? "_blank" : "_self"}
                        rel="noopener noreferrer"
                        style={{
                            display: "block",
                            textAlign: "center",
                            textDecoration: "none",
                            background: a.ctaBg || k.accent,
                            color: a.ctaColor,
                            borderRadius: a.ctaRadius,
                            padding: `${a.ctaPadding}px`,
                            fontSize: a.ctaSize,
                            fontWeight: 600,
                            fontFamily: t.bodyFont,
                            cursor: "pointer",
                            letterSpacing: "0.01em",
                        }}
                    >
                        {a.ctaLabel}
                    </a>
                ) : (
                    <motion.a
                        href={safeCtaUrl}
                        target={a.ctaNewTab ? "_blank" : "_self"}
                        rel="noopener noreferrer"
                        whileHover={{ opacity: 0.88 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            display: "block",
                            textAlign: "center",
                            textDecoration: "none",
                            background: a.ctaBg || k.accent,
                            color: a.ctaColor,
                            borderRadius: a.ctaRadius,
                            padding: `${a.ctaPadding}px`,
                            fontSize: a.ctaSize,
                            fontWeight: 600,
                            fontFamily: t.bodyFont,
                            cursor: "pointer",
                            letterSpacing: "0.01em",
                        }}
                    >
                        {a.ctaLabel}
                    </motion.a>
                ))}
        </div>
    )
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(ModularPricing, {
    basePrice: {
        type: ControlType.Number,
        title: "Base Price",
        defaultValue: 29,
        min: 0,
        step: 1,
        description: "Starting price before any options are selected.",
    },
    currency: {
        type: ControlType.Enum,
        title: "Currency",
        defaultValue: "USD",
        options: ["USD", "EUR", "EGP", "SAR", "AED", "GBP"],
        optionTitles: [
            "USD ($)",
            "EUR (€)",
            "EGP (ج.م)",
            "SAR (ر.س)",
            "AED (د.إ)",
            "GBP (£)",
        ],
        description: "Formats the price using the correct locale and symbol.",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        defaultValue: "ltr",
        options: ["ltr", "rtl"],
        optionTitles: ["LTR (English)", "RTL (العربية)"],
        description:
            "Switch to RTL for Arabic and other right-to-left languages.",
    },
    billingLabel: {
        type: ControlType.String,
        title: "Billing Label",
        defaultValue: "per month",
        description:
            "Text shown next to the price. E.g. 'per month', 'per seat', 'في الشهر'.",
    },
    showBreakdown: {
        type: ControlType.Boolean,
        title: "Breakdown",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Show an itemized tooltip when hovering the price.",
    },
    showSavings: {
        type: ControlType.Boolean,
        title: "Savings Badge",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Show monthly and yearly savings when a discount row is active.",
    },

    cardStyle: {
        type: ControlType.Object,
        title: "Card Style",
        description: "Visual styling for the outer card container.",
        controls: {
            bg: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#f9f8f5",
            },
            border: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: "#d4d1ca",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 16,
                min: 0,
                max: 48,
                step: 1,
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                defaultValue: 24,
                min: 8,
                max: 64,
                step: 2,
            },
            shadow: {
                type: ControlType.String,
                title: "Shadow",
                defaultValue: "0 4px 24px rgba(0,0,0,0.07)",
            },
            divider: {
                type: ControlType.Color,
                title: "Divider",
                defaultValue: "#d4d1ca",
            },
        },
    },

    typography: {
        type: ControlType.Object,
        title: "Typography",
        description: "Fonts, sizes, and colors for all text in the component.",
        controls: {
            bodyFont: {
                type: ControlType.String,
                title: "Body Font",
                defaultValue: "Inter, DM Sans, system-ui, sans-serif",
            },
            labelSize: {
                type: ControlType.Number,
                title: "Label Size",
                defaultValue: 14,
                min: 10,
                max: 24,
            },
            labelColor: {
                type: ControlType.Color,
                title: "Label Color",
                defaultValue: "#28251d",
            },
            mutedColor: {
                type: ControlType.Color,
                title: "Muted Color",
                defaultValue: "#7a7974",
            },
            priceFont: {
                type: ControlType.String,
                title: "Price Font",
                defaultValue: "Inter, DM Sans, system-ui, sans-serif",
            },
            priceSize: {
                type: ControlType.Number,
                title: "Price Size",
                defaultValue: 40,
                min: 20,
                max: 80,
                step: 2,
            },
            priceColor: {
                type: ControlType.Color,
                title: "Price Color",
                defaultValue: "#28251d",
            },
        },
    },

    colors: {
        type: ControlType.Object,
        title: "Colors",
        description:
            "Accent color used for active toggles, checkboxes, stepper buttons, and CTA button.",
        controls: {
            accent: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: "#01696f",
            },
        },
    },

    controlsStyle: {
        type: ControlType.Object,
        title: "Controls Style",
        description:
            "Style checkbox rows and stepper buttons. Leave button colors empty to inherit the Accent color.",
        controls: {
            rowBg: {
                type: ControlType.Color,
                title: "Row Background",
                defaultValue: "#f1f0ec",
            },
            rowRadius: {
                type: ControlType.Number,
                title: "Row Radius",
                defaultValue: 10,
                min: 0,
                max: 32,
            },
            boxBg: {
                type: ControlType.Color,
                title: "Box Background",
                defaultValue: "#d4d1ca",
            },
            boxBorder: {
                type: ControlType.Color,
                title: "Box Border",
                defaultValue: "#d4d1ca",
            },
            boxRadius: {
                type: ControlType.Number,
                title: "Box Radius",
                defaultValue: 5,
                min: 0,
                max: 12,
            },
            btnRadius: {
                type: ControlType.Number,
                title: "Button Radius",
                defaultValue: 8,
                min: 0,
                max: 99,
            },
            btnBg: {
                type: ControlType.Color,
                title: "Button BG",
                defaultValue: "",
            },
            btnBorder: {
                type: ControlType.Color,
                title: "Button Border",
                defaultValue: "",
            },
            btnColor: {
                type: ControlType.Color,
                title: "Button Color",
                defaultValue: "",
            },
            counterFont: {
                type: ControlType.String,
                title: "Counter Font",
                defaultValue: "",
            },
        },
    },

    badges: {
        type: ControlType.Object,
        title: "Badges & Tooltip",
        description: "Style the savings badge and the price breakdown tooltip.",
        controls: {
            savingsBg: {
                type: ControlType.Color,
                title: "Savings BG",
                defaultValue: "#22c55e18",
            },
            savingsBorder: {
                type: ControlType.Color,
                title: "Savings Border",
                defaultValue: "#22c55e55",
            },
            savingsColor: {
                type: ControlType.Color,
                title: "Savings Text",
                defaultValue: "#16a34a",
            },
            savingsRadius: {
                type: ControlType.Number,
                title: "Savings Radius",
                defaultValue: 12,
                min: 0,
                max: 99,
            },
            tooltipBg: {
                type: ControlType.Color,
                title: "Tooltip BG",
                defaultValue: "#f9f8f5",
            },
            tooltipBorder: {
                type: ControlType.Color,
                title: "Tooltip Border",
                defaultValue: "#d4d1ca",
            },
            tooltipRadius: {
                type: ControlType.Number,
                title: "Tooltip Radius",
                defaultValue: 12,
                min: 0,
                max: 32,
            },
        },
    },

    cta: {
        type: ControlType.Object,
        title: "CTA Button",
        description:
            "Primary action button shown below the price. Background defaults to Accent color when left empty.",
        controls: {
            showCta: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            ctaLabel: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "Get started",
            },
            ctaUrl: {
                type: ControlType.String,
                title: "URL",
                defaultValue: "#",
            },
            ctaNewTab: {
                type: ControlType.Boolean,
                title: "New Tab",
                defaultValue: false,
                enabledTitle: "Yes",
                disabledTitle: "No",
            },
            ctaBg: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "",
            },
            ctaColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#ffffff",
            },
            ctaRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 10,
                min: 0,
                max: 99,
            },
            ctaPadding: {
                type: ControlType.Number,
                title: "Padding",
                defaultValue: 14,
                min: 4,
                max: 32,
            },
            ctaSize: {
                type: ControlType.Number,
                title: "Font Size",
                defaultValue: 15,
                min: 12,
                max: 24,
            },
        },
    },

    rows: {
        type: ControlType.Array,
        title: "Rows",
        description:
            "Add toggles, checkboxes, or steppers. Each row updates the total automatically. Drag to reorder.",
        control: {
            type: ControlType.Object,
            controls: {
                mode: {
                    type: ControlType.Enum,
                    title: "Type",
                    defaultValue: "checkbox",
                    options: ["toggle", "checkbox", "stepper"],
                    optionTitles: ["Toggle", "Checkbox", "Stepper"],
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Feature",
                },
                price: {
                    type: ControlType.Number,
                    title: "Price (+)",
                    defaultValue: 10,
                    min: 0,
                    step: 1,
                },
                isMultiplier: {
                    type: ControlType.Boolean,
                    title: "Discount?",
                    defaultValue: false,
                    enabledTitle: "Yes (×)",
                    disabledTitle: "No (+)",
                    hidden: (props) => props.mode === "stepper",
                },
                multiplier: {
                    type: ControlType.Number,
                    title: "Multiplier",
                    defaultValue: 0.8,
                    min: 0.01,
                    max: 1,
                    step: 0.01,
                    description:
                        "Applied when Discount is Yes. E.g. 0.8 = 20% off. Only used with Toggle/Checkbox.",
                    hidden: (props) =>
                        props.mode === "stepper" || !props.isMultiplier,
                },
                min: {
                    type: ControlType.Number,
                    title: "Min",
                    defaultValue: 1,
                    min: 0,
                    description:
                        "Lowest value the stepper can reach. The − button disables at this number.",
                    hidden: (props) => props.mode !== "stepper",
                },
                max: {
                    type: ControlType.Number,
                    title: "Max",
                    defaultValue: 20,
                    min: 1,
                    description:
                        "Highest value the stepper can reach. The + button disables at this number.",
                    hidden: (props) => props.mode !== "stepper",
                },
            },
        },
        defaultValue: [
            {
                mode: "toggle",
                label: "Annual billing (save 20%)",
                price: 0,
                isMultiplier: true,
                multiplier: 0.8,
                min: 1,
                max: 1,
            },
            {
                mode: "stepper",
                label: "Team members",
                price: 10,
                isMultiplier: false,
                multiplier: 1,
                min: 1,
                max: 20,
            },
            {
                mode: "checkbox",
                label: "AI features",
                price: 15,
                isMultiplier: false,
                multiplier: 1,
                min: 1,
                max: 1,
            },
            {
                mode: "checkbox",
                label: "Extra storage 20 GB",
                price: 5,
                isMultiplier: false,
                multiplier: 1,
                min: 1,
                max: 1,
            },
        ],
    },
})
