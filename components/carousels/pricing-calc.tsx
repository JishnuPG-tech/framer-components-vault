import * as React from "react"
import { useState, useEffect, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * Pricing Calculator
 *
 * A live, computed pricing component for Framer. Buyers adjust plan,
 * seats, billing cycle, and add-ons; the total recalculates instantly.
 * All copy, tiers, add-ons, and styling are editable via property controls.
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function PricingCalculator(props) {
    const {
        content = {},
        pricing = {},
        colors = {},
        emailCapture = {},
        shadow = {},
        tiers,
        addons,
        style,
    } = props

    const {
        title,
        subtitle,
        ctaText,
        footnote,
        font,
        fontSize = 28,
        textAlign = "left",
    } = content

    const headingFontFamily = font?.fontFamily
        ? `"${font.fontFamily}", ${DISPLAY}`
        : DISPLAY
    const headingFontWeight = font?.fontWeight || 600

    const { annualDiscountPercent, currencySymbol } = pricing

    const {
        accentColor,
        goldColor,
        inkColor,
        backgroundColor,
        cardColor,
        lineColor,
    } = colors

    const {
        enabled: emailCaptureEnabled,
        recipientEmail,
        subjectLine,
    } = emailCapture

    const {
        enabled: shadowEnabled = true,
        intensity: shadowIntensity = 40,
        color: shadowColor = "#16201C",
    } = shadow

    const safeTiers = tiers && tiers.length ? tiers : DEFAULT_TIERS
    const safeAddons = addons && addons.length ? addons : DEFAULT_ADDONS

    const [tierIndex, setTierIndex] = useState(0)
    const [seats, setSeats] = useState(6)
    const [cycle, setCycle] = useState("monthly")
    const [checkedAddons, setCheckedAddons] = useState(() =>
        safeAddons.map((a) => !!a.checkedByDefault)
    )

    // Keep selection valid if property-controlled arrays change length in the editor
    useEffect(() => {
        if (tierIndex >= safeTiers.length) setTierIndex(0)
    }, [safeTiers.length])

    useEffect(() => {
        setCheckedAddons((prev) => {
            if (prev.length === safeAddons.length) return prev
            return safeAddons.map((a) => !!a.checkedByDefault)
        })
    }, [safeAddons.length])

    useEffect(() => {
        injectFontsOnce()
    }, [])

    const activeTier = safeTiers[tierIndex] || safeTiers[0]

    const { base, addonTotal, subtotal, discount, total } = useMemo(() => {
        const base = (activeTier?.price || 0) * seats
        const addonTotal =
            safeAddons.reduce(
                (sum, a, i) => sum + (checkedAddons[i] ? a.price : 0),
                0
            ) * seats
        const subtotal = base + addonTotal
        const discount =
            cycle === "annual"
                ? subtotal * ((annualDiscountPercent || 0) / 100)
                : 0
        const total = subtotal - discount
        return { base, addonTotal, subtotal, discount, total }
    }, [
        activeTier,
        seats,
        safeAddons,
        checkedAddons,
        cycle,
        annualDiscountPercent,
    ])

    const fmt = (n) => `${currencySymbol}${n.toFixed(2)}`

    const handleSubmit = () => {
        if (!emailCaptureEnabled || !recipientEmail) return

        const addonLines = safeAddons
            .filter((a, i) => checkedAddons[i])
            .map((a) => `- ${a.name} (+${currencySymbol}${a.price}/seat)`)
            .join("\n")

        const bodyLines = [
            `Plan: ${activeTier?.name || ""}`,
            `Seats: ${seats}`,
            `Billing cycle: ${cycle}`,
            addonLines ? `Add-ons:\n${addonLines}` : `Add-ons: none`,
            `Subtotal: ${fmt(subtotal)}`,
            discount > 0 ? `Annual discount: -${fmt(discount)}` : null,
            `Total: ${fmt(total)} ${cycle === "annual" ? "/month, billed yearly" : "/month"}`,
        ].filter(Boolean)

        const subject = encodeURIComponent(
            subjectLine || "New pricing calculator submission"
        )
        const body = encodeURIComponent(bodyLines.join("\n"))

        // mailto keeps this entirely between the visitor's own mail client and your
        // inbox — no third-party form service, no API key, no data stored anywhere.
        if (typeof window !== "undefined") {
            window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`
        }
    }

    return (
        <div
            style={{ ...containerStyle, background: backgroundColor, ...style }}
        >
            {(title || subtitle) && (
                <div style={{ marginBottom: 24, textAlign }}>
                    {title && (
                        <div
                            style={{
                                ...headingStyle(inkColor),
                                fontFamily: headingFontFamily,
                                fontWeight: headingFontWeight,
                                fontSize,
                            }}
                        >
                            {title}
                        </div>
                    )}
                    {subtitle && (
                        <div
                            style={{
                                ...subStyle(inkColor),
                                fontFamily: headingFontFamily,
                                marginLeft: textAlign === "center" ? "auto" : 0,
                                marginRight:
                                    textAlign === "center" ? "auto" : 0,
                            }}
                        >
                            {subtitle}
                        </div>
                    )}
                </div>
            )}

            <div
                style={panelStyle(
                    cardColor,
                    lineColor,
                    shadowEnabled,
                    shadowIntensity,
                    shadowColor
                )}
            >
                {/* ---------- Controls ---------- */}
                <div style={controlsStyle(lineColor)}>
                    <Field label="Plan" inkColor={inkColor}>
                        <div style={{ display: "flex", gap: 8 }}>
                            {safeTiers.map((t, i) => (
                                <button
                                    key={t.name + i}
                                    onClick={() => setTierIndex(i)}
                                    style={tierBtnStyle(
                                        i === tierIndex,
                                        accentColor,
                                        lineColor,
                                        inkColor
                                    )}
                                >
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    </Field>

                    <Field
                        label="Seats"
                        value={String(seats)}
                        accentColor={accentColor}
                        inkColor={inkColor}
                    >
                        <input
                            type="range"
                            min={1}
                            max={50}
                            value={seats}
                            onChange={(e) =>
                                setSeats(parseInt(e.target.value, 10))
                            }
                            style={sliderStyle(accentColor, lineColor)}
                        />
                    </Field>

                    <Field label="Billing cycle" inkColor={inkColor}>
                        <div style={billingWrapStyle(accentColor)}>
                            {["monthly", "annual"].map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setCycle(c)}
                                    style={billingBtnStyle(
                                        cycle === c,
                                        accentColor,
                                        inkColor
                                    )}
                                >
                                    {c === "monthly" ? "Monthly" : "Annual"}
                                    {c === "annual" &&
                                        annualDiscountPercent > 0 && (
                                            <span
                                                style={savePillStyle(goldColor)}
                                            >
                                                −{annualDiscountPercent}%
                                            </span>
                                        )}
                                </button>
                            ))}
                        </div>
                    </Field>

                    <Field label="Add-ons" inkColor={inkColor}>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                            }}
                        >
                            {safeAddons.map((a, i) => {
                                const checked = checkedAddons[i]
                                return (
                                    <div
                                        key={a.name + i}
                                        onClick={() =>
                                            setCheckedAddons((prev) => {
                                                const next = [...prev]
                                                next[i] = !next[i]
                                                return next
                                            })
                                        }
                                        style={addonRowStyle(
                                            checked,
                                            accentColor,
                                            lineColor
                                        )}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 10,
                                            }}
                                        >
                                            <div
                                                style={checkboxStyle(
                                                    checked,
                                                    accentColor,
                                                    lineColor
                                                )}
                                            >
                                                {checked && <CheckIcon />}
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 500,
                                                    color: inkColor,
                                                }}
                                            >
                                                {a.name}
                                            </span>
                                        </div>
                                        <span
                                            style={{
                                                fontFamily: MONO,
                                                fontSize: 12,
                                                color: mix(inkColor, 0.45),
                                            }}
                                        >
                                            +{currencySymbol}
                                            {a.price} /seat
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </Field>
                </div>

                {/* ---------- Receipt ---------- */}
                <div style={receiptStyle(inkColor)}>
                    <div style={receiptLabelStyle}>Estimated total</div>

                    <Line
                        label={`${activeTier?.name || ""} — ${seats} seat${seats > 1 ? "s" : ""}`}
                        amount={fmt(base)}
                    />
                    {addonTotal > 0 && (
                        <Line label="Add-ons" amount={fmt(addonTotal)} />
                    )}
                    {discount > 0 && (
                        <Line
                            label="Annual discount"
                            amount={`−${fmt(discount)}`}
                            positive
                        />
                    )}

                    <div style={{ marginTop: "auto", paddingTop: 20 }}>
                        <div
                            style={{
                                fontSize: 12,
                                color: "rgba(255,255,255,0.5)",
                                marginBottom: 4,
                            }}
                        >
                            Total
                        </div>
                        <div style={totalAmtStyle}>
                            {fmt(total)}
                            <span style={perLabelStyle}>
                                {cycle === "annual"
                                    ? "/month, billed yearly"
                                    : "/month"}
                            </span>
                        </div>
                        <button style={ctaStyle} onClick={handleSubmit}>
                            {ctaText}
                        </button>
                        {emailCaptureEnabled && (
                            <div style={emailNoteStyle}>
                                {recipientEmail
                                    ? "Opens the visitor's email client — sent directly, no third party"
                                    : "Add a recipient email above to activate this button"}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {footnote && (
                <div style={footnoteStyle(inkColor)}>
                    <span style={dotStyle(accentColor)} />
                    {footnote}
                </div>
            )}
        </div>
    )
}

/* ---------------------------------- */
/* Small subcomponents                 */
/* ---------------------------------- */

function Field({ label, value, children, inkColor, accentColor }) {
    return (
        <div style={{ marginBottom: 24 }}>
            <label
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 10,
                    color: inkColor,
                    fontFamily: SANS,
                }}
            >
                {label}
                {value && (
                    <span
                        style={{
                            fontFamily: MONO,
                            color: accentColor,
                            fontSize: 13,
                        }}
                    >
                        {value}
                    </span>
                )}
            </label>
            {children}
        </div>
    )
}

function Line({ label, amount, positive }) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                padding: "9px 0",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.85)",
            }}
        >
            <span>{label}</span>
            <span
                style={{
                    fontFamily: MONO,
                    color: positive ? "#7FD9A8" : "rgba(255,255,255,0.85)",
                }}
            >
                {amount}
            </span>
        </div>
    )
}

function CheckIcon() {
    return (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
                d="M1 4L3.5 6.5L9 1"
                stroke="white"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/* ---------------------------------- */
/* Fonts                               */
/* ---------------------------------- */

const SANS = "'Inter', system-ui, sans-serif"
const DISPLAY = "'Space Grotesk', system-ui, sans-serif"
const MONO = "'JetBrains Mono', ui-monospace, monospace"

let fontsInjected = false
function injectFontsOnce() {
    if (fontsInjected || typeof document === "undefined") return
    fontsInjected = true
    const id = "pricing-calc-fonts"
    if (document.getElementById(id)) return
    const link = document.createElement("link")
    link.id = id
    link.rel = "stylesheet"
    link.href =
        "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
    document.head.appendChild(link)
}

/* ---------------------------------- */
/* Style helpers                       */
/* ---------------------------------- */

function mix(hex, alpha) {
    // returns hex with inline opacity via rgba fallback for simple hex colors
    return hex
}

const containerStyle = {
    width: "100%",
    fontFamily: SANS,
    padding: 8,
    boxSizing: "border-box",
}

const headingStyle = (ink) => ({
    fontFamily: DISPLAY,
    fontSize: 28,
    fontWeight: 600,
    color: ink,
    marginBottom: 6,
    letterSpacing: "-0.01em",
})

const subStyle = (ink) => ({
    fontSize: 14,
    color: ink,
    opacity: 0.6,
    maxWidth: 480,
})

const panelStyle = (
    card,
    line,
    shadowEnabled,
    shadowIntensity,
    shadowColor
) => ({
    background: card,
    border: `1px solid ${line}`,
    borderRadius: 14,
    display: "grid",
    gridTemplateColumns: "1.3fr 1fr",
    overflow: "hidden",
    boxShadow: shadowEnabled
        ? buildShadow(shadowIntensity, shadowColor)
        : "none",
})

function buildShadow(intensity, color) {
    // intensity 0-100 drives blur/spread/opacity together so one slider feels natural
    const t = Math.max(0, Math.min(100, intensity)) / 100
    const blur = Math.round(16 + t * 48)
    const spread = Math.round(-4 - t * 4)
    const y = Math.round(6 + t * 18)
    const opacity = (0.08 + t * 0.22).toFixed(2)
    return `0 ${y}px ${blur}px ${spread}px ${hexToRgba(color, opacity)}`
}

function hexToRgba(hex, alpha) {
    const clean = (hex || "#16201C").replace("#", "")
    const full =
        clean.length === 3
            ? clean
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : clean
    const r = parseInt(full.substring(0, 2), 16) || 0
    const g = parseInt(full.substring(2, 4), 16) || 0
    const b = parseInt(full.substring(4, 6), 16) || 0
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const controlsStyle = (line) => ({
    padding: 28,
    borderRight: `1px solid ${line}`,
    boxSizing: "border-box",
})

const tierBtnStyle = (active, accent, line, ink) => ({
    flex: 1,
    padding: "10px 8px",
    borderRadius: 10,
    border: `1px solid ${active ? accent : line}`,
    background: active ? accent : "transparent",
    color: active ? "#fff" : ink,
    fontFamily: SANS,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    opacity: active ? 1 : 0.7,
})

const sliderStyle = (accent, line) => ({
    width: "100%",
    accentColor: accent,
})

const billingWrapStyle = (accent) => ({
    display: "flex",
    background: `${accent}1A`,
    borderRadius: 10,
    padding: 4,
    gap: 4,
})

const billingBtnStyle = (active, accent, ink) => ({
    flex: 1,
    border: "none",
    background: active ? "#fff" : "transparent",
    color: active ? accent : ink,
    opacity: active ? 1 : 0.6,
    padding: 9,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    fontFamily: SANS,
    cursor: "pointer",
    boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
})

const savePillStyle = (gold) => ({
    fontSize: 10,
    background: gold,
    color: "#fff",
    padding: "1px 6px",
    borderRadius: 20,
    marginLeft: 6,
    fontFamily: MONO,
})

const addonRowStyle = (checked, accent, line) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    border: `1px solid ${checked ? accent : line}`,
    background: checked ? `${accent}14` : "transparent",
    borderRadius: 10,
    cursor: "pointer",
})

const checkboxStyle = (checked, accent, line) => ({
    width: 16,
    height: 16,
    borderRadius: 4,
    border: `1.5px solid ${checked ? accent : line}`,
    background: checked ? accent : "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
})

const receiptStyle = (ink) => ({
    background: ink,
    color: "#fff",
    padding: 28,
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
})

const receiptLabelStyle = {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.5)",
    marginBottom: 18,
}

const totalAmtStyle = {
    fontFamily: DISPLAY,
    fontSize: 34,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    display: "flex",
    alignItems: "baseline",
    gap: 6,
    flexWrap: "wrap",
}

const perLabelStyle = {
    fontFamily: SANS,
    fontSize: 12,
    fontWeight: 400,
    color: "rgba(255,255,255,0.5)",
}

const ctaStyle = {
    marginTop: 18,
    width: "100%",
    background: "#fff",
    color: "#16201C",
    border: "none",
    borderRadius: 10,
    padding: 13,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: SANS,
}

const emailNoteStyle = {
    marginTop: 10,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    fontFamily: SANS,
    textAlign: "center",
}

const footnoteStyle = (ink) => ({
    marginTop: 16,
    fontSize: 12,
    color: ink,
    opacity: 0.6,
    display: "flex",
    alignItems: "center",
    gap: 8,
})

const dotStyle = (accent) => ({
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: accent,
    flexShrink: 0,
})

/* ---------------------------------- */
/* Defaults                            */
/* ---------------------------------- */

const DEFAULT_TIERS = [
    { name: "Starter", price: 12 },
    { name: "Growth", price: 24 },
    { name: "Scale", price: 42 },
]

const DEFAULT_ADDONS = [
    { name: "Priority support", price: 3, checkedByDefault: true },
    { name: "Extra storage (1TB)", price: 5, checkedByDefault: false },
    { name: "Advanced analytics", price: 8, checkedByDefault: false },
]

/* ---------------------------------- */
/* Property Controls                   */
/* ---------------------------------- */

addPropertyControls(PricingCalculator, {
    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            title: {
                type: ControlType.String,
                title: "Title",
                defaultValue: "Live pricing, computed in real time.",
            },
            subtitle: {
                type: ControlType.String,
                title: "Subtitle",
                defaultValue:
                    "Totals recalculate instantly as buyers adjust plan, seats, billing, and add-ons.",
                displayTextArea: true,
            },
            ctaText: {
                type: ControlType.String,
                title: "CTA text",
                defaultValue: "Start free trial",
            },
            footnote: {
                type: ControlType.String,
                title: "Footnote",
                defaultValue:
                    "Every value above is computed live from the control state, not a lookup image.",
                displayTextArea: true,
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "basic",
                defaultValue: {
                    fontFamily: "Space Grotesk",
                    fontWeight: 600,
                },
            },
            fontSize: {
                type: ControlType.Number,
                title: "Font size",
                defaultValue: 28,
                min: 12,
                max: 64,
                step: 1,
            },
            textAlign: {
                type: ControlType.Enum,
                title: "Alignment",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: "left",
            },
        },
    },

    tiers: {
        type: ControlType.Array,
        title: "Plans",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Starter",
                },
                price: {
                    type: ControlType.Number,
                    title: "Price / seat",
                    defaultValue: 12,
                    min: 0,
                },
            },
        },
        defaultValue: DEFAULT_TIERS,
    },
    addons: {
        type: ControlType.Array,
        title: "Add-ons",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Add-on",
                },
                price: {
                    type: ControlType.Number,
                    title: "Price / seat",
                    defaultValue: 5,
                    min: 0,
                },
                checkedByDefault: {
                    type: ControlType.Boolean,
                    title: "Checked by default",
                    defaultValue: false,
                },
            },
        },
        defaultValue: DEFAULT_ADDONS,
    },

    pricing: {
        type: ControlType.Object,
        title: "Pricing rules",
        controls: {
            annualDiscountPercent: {
                type: ControlType.Number,
                title: "Annual discount %",
                defaultValue: 20,
                min: 0,
                max: 100,
            },
            currencySymbol: {
                type: ControlType.String,
                title: "Currency symbol",
                defaultValue: "$",
            },
        },
    },

    emailCapture: {
        type: ControlType.Object,
        title: "Email capture",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Send to email",
                defaultValue: false,
            },
            recipientEmail: {
                type: ControlType.String,
                title: "Recipient email",
                defaultValue: "",
                placeholder: "you@yourcompany.com",
                hidden: (props) => !props.enabled,
            },
            subjectLine: {
                type: ControlType.String,
                title: "Subject line",
                defaultValue: "New pricing calculator submission",
                hidden: (props) => !props.enabled,
            },
        },
    },

    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            accentColor: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: "#10513C",
            },
            goldColor: {
                type: ControlType.Color,
                title: "Highlight",
                defaultValue: "#B8862E",
            },
            inkColor: {
                type: ControlType.Color,
                title: "Ink / Receipt bg",
                defaultValue: "#16201C",
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Page background",
                defaultValue: "#F6F5F1",
            },
            cardColor: {
                type: ControlType.Color,
                title: "Card background",
                defaultValue: "#FFFFFF",
            },
            lineColor: {
                type: ControlType.Color,
                title: "Border/line",
                defaultValue: "#E4E1D8",
            },
        },
    },

    shadow: {
        type: ControlType.Object,
        title: "Shadow",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable shadow",
                defaultValue: true,
            },
            intensity: {
                type: ControlType.Number,
                title: "Intensity",
                defaultValue: 40,
                min: 0,
                max: 100,
                step: 1,
                hidden: (props) => !props.enabled,
            },
            color: {
                type: ControlType.Color,
                title: "Shadow color",
                defaultValue: "#16201C",
                hidden: (props) => !props.enabled,
            },
        },
    },
})
