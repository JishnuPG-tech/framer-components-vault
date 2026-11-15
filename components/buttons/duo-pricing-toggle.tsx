// @framerDisableUnlink
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { AnimatePresence, motion } from "framer-motion"
import * as React from "react"
import { useEffect, useState } from "react"

// ControlType.Color may arrive as a token object ({ value }) — unwrap to a CSS string.
function tok(v: unknown, fallback: string): string {
    if (typeof v === "string" && v) return v
    if (v && typeof v === "object" && "value" in v) {
        const inner = (v as { value?: unknown }).value
        if (typeof inner === "string" && inner) return inner
    }
    return fallback
}

function fontFamilyOf(f?: { fontFamily?: string } | null): string {
    return (f && f.fontFamily) || "Inter, system-ui, -apple-system, sans-serif"
}

interface FontValue {
    fontFamily?: string
}

interface Props {
    monthlyLabel: string
    yearlyLabel: string
    monthlyPrice: string
    yearlyPrice: string
    currency: string
    periodMonthly: string
    periodYearly: string
    savingsBadge: string
    switchLabel: string
    deepLink: boolean
    font?: FontValue | null
    accentColor: string
    trackColor: string
    textColor: string
    mutedColor: string
    style?: React.CSSProperties
}

const DEFAULTS: Omit<Props, "font" | "style"> = {
    monthlyLabel: "Monthly",
    yearlyLabel: "Yearly",
    monthlyPrice: "29",
    yearlyPrice: "290",
    currency: "$",
    periodMonthly: "/mo",
    periodYearly: "/yr",
    savingsBadge: "Save 20%",
    switchLabel: "Bill yearly",
    deepLink: false,
    accentColor: "#8B7FFA",
    trackColor: "#26262E",
    textColor: "#F5F5F7",
    mutedColor: "#9A9AA5",
}

function str(v: unknown, fallback: string): string {
    return typeof v === "string" ? v : fallback
}

// Deep link (?billing=monthly|yearly) is the only place the page URL is read or written,
// and only while "Deep link" is on.
const PARAM = "billing"
function readBilling(): boolean | null {
    if (typeof window === "undefined") return null
    const v = (new URLSearchParams(window.location.search).get(PARAM) || "").toLowerCase()
    if (v === "yearly" || v === "annual" || v === "year") return true
    if (v === "monthly" || v === "month") return false
    return null
}
function writeBilling(yearly: boolean) {
    if (typeof window === "undefined" || !window.history?.replaceState) return
    const url = new URL(window.location.href)
    url.searchParams.set(PARAM, yearly ? "yearly" : "monthly")
    // replaceState, not pushState: toggling must not stack history entries.
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash)
}

const SR_ONLY: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    border: 0,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
}

// Focus ring only for keyboard focus; colour comes from the per-instance --dpt-accent variable.
const FOCUS_CSS = ".dpt-switch:focus{outline:none}.dpt-switch:focus-visible{outline:2px solid var(--dpt-accent);outline-offset:3px}"

function Label({ active, color, muted, animate, children }: { active: boolean; color: string; muted: string; animate: boolean; children: React.ReactNode }) {
    return (
        <span
            style={{
                fontSize: 15,
                fontWeight: 600,
                color: active ? color : muted,
                transition: animate ? "color 0.25s ease" : "none",
                whiteSpace: "nowrap",
            }}
        >
            {children}
        </span>
    )
}

interface Resolved {
    monthlyLabel: string
    yearlyLabel: string
    monthlyPrice: string
    yearlyPrice: string
    currency: string
    periodMonthly: string
    periodYearly: string
    savingsBadge: string
    switchLabel: string
    deepLink: boolean
    accent: string
    track: string
    text: string
    muted: string
    font?: FontValue | null
    style?: React.CSSProperties
}

// Pure style builder shared by the static and live renderers (no hooks, no DOM).
function buildStyles(r: Resolved, on: boolean, animate: boolean, interactive: boolean) {
    const shellStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 22,
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        fontFamily: fontFamilyOf(r.font),
        position: "relative",
        ...r.style,
    }
    const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", flexWrap: "wrap", justifyContent: "center", gap: 14, maxWidth: "100%" }
    const knobStyle: React.CSSProperties = {
        display: "block",
        width: 24,
        height: 24,
        borderRadius: "50%",
        background: "#fff",
        marginLeft: on ? 22 : 0,
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
    }
    const switchStyle = {
        boxSizing: "border-box",
        flex: "0 0 auto",
        width: 52,
        height: 30,
        margin: 0,
        border: 0,
        borderRadius: 999,
        background: on ? r.accent : r.track,
        cursor: interactive ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        padding: 3,
        transition: animate ? "background 0.3s ease" : "none",
        "--dpt-accent": r.accent,
    } as React.CSSProperties
    const badgeStyle: React.CSSProperties = {
        fontSize: 12,
        fontWeight: 600,
        color: r.accent,
        // Works for hex, rgb() and rgba() alike (the old accent + "22" only worked for 6-digit hex).
        background: `color-mix(in srgb, ${r.accent} 13%, transparent)`,
        padding: "4px 9px",
        borderRadius: 999,
        whiteSpace: "nowrap",
    }
    const priceRowStyle: React.CSSProperties = { display: "flex", alignItems: "flex-end", gap: 6, minHeight: 60, maxWidth: "100%" }
    const currencyStyle: React.CSSProperties = { fontSize: 28, fontWeight: 600, color: r.text, lineHeight: 1.4 }
    const amountStyle: React.CSSProperties = { display: "inline-block", fontSize: 54, fontWeight: 800, color: r.text, lineHeight: 1, fontVariantNumeric: "tabular-nums" }
    const periodStyle: React.CSSProperties = { fontSize: 15, fontWeight: 500, color: r.muted, marginBottom: 6 }
    return { shellStyle, rowStyle, knobStyle, switchStyle, badgeStyle, priceRowStyle, currencyStyle, amountStyle, periodStyle }
}

// Static renderer (Framer canvas / export): resting monthly state — no state, no effects,
// no listeners, no transitions, no framer-motion elements.
function PricingToggleStatic({ r }: { r: Resolved }) {
    const st = buildStyles(r, false, false, false)
    return (
        <div style={st.shellStyle}>
            <div style={st.rowStyle}>
                <Label active color={r.text} muted={r.muted} animate={false}>{r.monthlyLabel}</Label>
                <span role="switch" aria-checked={false} aria-label={r.switchLabel} aria-readonly="true" style={st.switchStyle}>
                    <span style={st.knobStyle} />
                </span>
                <Label active={false} color={r.text} muted={r.muted} animate={false}>{r.yearlyLabel}</Label>
                {r.savingsBadge ? <span style={st.badgeStyle}>{r.savingsBadge}</span> : null}
            </div>
            <div style={st.priceRowStyle}>
                <span style={st.currencyStyle}>{r.currency}</span>
                <span style={st.amountStyle}>{r.monthlyPrice}</span>
                <span style={st.periodStyle}>{r.periodMonthly}</span>
            </div>
        </div>
    )
}

function PricingToggleLive({ r }: { r: Resolved }) {
    const { deepLink, monthlyPrice, yearlyPrice, periodMonthly, periodYearly, currency } = r
    const [yearly, setYearly] = useState(false)
    const [reduced, setReduced] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setReduced(mq.matches)
        sync()
        mq.addEventListener("change", sync)
        return () => mq.removeEventListener("change", sync)
    }, [])

    useEffect(() => {
        if (!deepLink) return
        const fromUrl = readBilling()
        if (fromUrl !== null) setYearly(fromUrl)
    }, [deepLink])

    const toggle = () => {
        const next = !yearly
        setYearly(next)
        if (deepLink) writeBilling(next)
    }

    const price = yearly ? yearlyPrice : monthlyPrice
    const period = yearly ? periodYearly : periodMonthly
    const animate = !reduced
    const st = buildStyles(r, yearly, animate, true)

    return (
        <div style={st.shellStyle}>
            <style>{FOCUS_CSS}</style>
            <div style={st.rowStyle}>
                <Label active={!yearly} color={r.text} muted={r.muted} animate={animate}>{r.monthlyLabel}</Label>
                <button
                    type="button"
                    role="switch"
                    className="dpt-switch"
                    aria-checked={yearly}
                    aria-label={r.switchLabel}
                    onClick={toggle}
                    style={st.switchStyle}
                >
                    {animate ? (
                        <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 32 }} style={st.knobStyle} />
                    ) : (
                        <span style={st.knobStyle} />
                    )}
                </button>
                <Label active={yearly} color={r.text} muted={r.muted} animate={animate}>{r.yearlyLabel}</Label>
                {r.savingsBadge ? <span style={st.badgeStyle}>{r.savingsBadge}</span> : null}
            </div>

            {/* Visual price (hidden from assistive tech: the cross-fade briefly shows two numbers). */}
            <div style={st.priceRowStyle} aria-hidden="true">
                <span style={st.currencyStyle}>{currency}</span>
                {animate ? (
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                            key={(yearly ? "y:" : "m:") + price}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.28, ease: "easeOut" }}
                            style={st.amountStyle}
                        >
                            {price}
                        </motion.span>
                    </AnimatePresence>
                ) : (
                    <span style={st.amountStyle}>{price}</span>
                )}
                <span style={st.periodStyle}>{period}</span>
            </div>
            {/* Screen-reader price: one string, announced politely when the switch changes it. */}
            <span style={SR_ONLY} aria-live="polite" aria-atomic="true">
                {`${currency}${price} ${period}`.trim()}
            </span>
        </div>
    )
}

/**
 * PricingToggle
 * A monthly / yearly switch with a cross-fading price and a savings badge.
 *
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight 200
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function PricingToggle(props: Partial<Props>) {
    const isStatic = useIsStaticRenderer()
    const yearlyLabel = str(props.yearlyLabel, DEFAULTS.yearlyLabel)
    const r: Resolved = {
        monthlyLabel: str(props.monthlyLabel, DEFAULTS.monthlyLabel),
        yearlyLabel,
        monthlyPrice: str(props.monthlyPrice, DEFAULTS.monthlyPrice),
        yearlyPrice: str(props.yearlyPrice, DEFAULTS.yearlyPrice),
        currency: str(props.currency, DEFAULTS.currency),
        periodMonthly: str(props.periodMonthly, DEFAULTS.periodMonthly),
        periodYearly: str(props.periodYearly, DEFAULTS.periodYearly),
        savingsBadge: str(props.savingsBadge, DEFAULTS.savingsBadge),
        switchLabel: str(props.switchLabel, DEFAULTS.switchLabel).trim() || `${yearlyLabel || "Yearly"} billing`,
        deepLink: props.deepLink === true,
        accent: tok(props.accentColor, DEFAULTS.accentColor),
        track: tok(props.trackColor, DEFAULTS.trackColor),
        text: tok(props.textColor, DEFAULTS.textColor),
        muted: tok(props.mutedColor, DEFAULTS.mutedColor),
        font: props.font,
        style: props.style,
    }
    return isStatic ? <PricingToggleStatic r={r} /> : <PricingToggleLive r={r} />
}

addPropertyControls(PricingToggle, {
    monthlyLabel: {
        type: ControlType.String,
        title: "Monthly",
        defaultValue: DEFAULTS.monthlyLabel,
        description: "Text left of the switch (monthly billing).",
    },
    yearlyLabel: {
        type: ControlType.String,
        title: "Yearly",
        defaultValue: DEFAULTS.yearlyLabel,
        description: "Text right of the switch (yearly billing).",
    },
    monthlyPrice: {
        type: ControlType.String,
        title: "Price / mo",
        defaultValue: DEFAULTS.monthlyPrice,
        description: "Amount shown while Monthly is selected, without the currency sign.",
    },
    yearlyPrice: {
        type: ControlType.String,
        title: "Price / yr",
        defaultValue: DEFAULTS.yearlyPrice,
        description: "Amount shown while Yearly is selected, without the currency sign.",
    },
    currency: {
        type: ControlType.String,
        title: "Currency",
        defaultValue: DEFAULTS.currency,
        description: "Sign before the amount, e.g. $, €, ₩. Leave empty for none.",
    },
    periodMonthly: {
        type: ControlType.String,
        title: "Unit /mo",
        defaultValue: DEFAULTS.periodMonthly,
        description: "Suffix after the monthly amount.",
    },
    periodYearly: {
        type: ControlType.String,
        title: "Unit /yr",
        defaultValue: DEFAULTS.periodYearly,
        description: "Suffix after the yearly amount.",
    },
    savingsBadge: {
        type: ControlType.String,
        title: "Badge",
        defaultValue: DEFAULTS.savingsBadge,
        description: "Pill next to the switch. Leave empty to hide it.",
    },
    switchLabel: {
        type: ControlType.String,
        title: "Switch name",
        defaultValue: DEFAULTS.switchLabel,
        description: "What screen readers call the switch. On = yearly billing.",
    },
    deepLink: {
        type: ControlType.Boolean,
        title: "Deep link",
        defaultValue: DEFAULTS.deepLink,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "On: ?billing=yearly or ?billing=monthly in the page URL picks the start state, and toggling updates it. Off: the URL is never read or changed.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        description: "Font family for labels, badge and price.",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: DEFAULTS.accentColor,
        description: "Switch when Yearly is on, badge text and tint, keyboard focus ring.",
    },
    trackColor: {
        type: ControlType.Color,
        title: "Track",
        defaultValue: DEFAULTS.trackColor,
        description: "Switch background while Monthly is selected.",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: DEFAULTS.textColor,
        description: "Active label, currency and amount.",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Muted",
        defaultValue: DEFAULTS.mutedColor,
        description: "Inactive label and the /mo or /yr unit.",
    },
})
