// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useEffect, startTransition, type CSSProperties } from "react"

type DetectMode = "auto" | "email" | "phone" | "whatsapp" | "url"

interface ContactLinkProps {
    value?: string
    label?: string
    detect?: DetectMode
    newTab?: boolean
    underline?: boolean
    copyButton?: boolean
    obfuscate?: boolean
    subject?: string
    body?: string
    countryCode?: string
    waMessage?: string
    trackingId?: string
    color?: string
    hoverColor?: string
    font?: CSSProperties
    style?: CSSProperties
}

function resolveType(value: string, detect: DetectMode): DetectMode {
    if (detect !== "auto") return detect
    if (/^mailto:/i.test(value)) return "email"
    if (/^tel:/i.test(value)) return "phone"
    if (/wa\.me\/|whatsapp/i.test(value)) return "whatsapp"
    if (/^(https?:\/\/|www\.)/i.test(value)) return "url"
    if (value.includes("@")) return "email"
    if ((value.match(/\d/g) ?? []).length >= 5) return "phone"
    return "auto"
}

function fillUrlToken(text: string, pageUrl: string): string {
    if (!text.includes("{url}")) return text
    return text.replace(/\{url\}/g, pageUrl).trim()
}

function CopyIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="12" height="12" rx="2.5" />
            <path d="M5 15H4.5A2.5 2.5 0 0 1 2 12.5v-8A2.5 2.5 0 0 1 4.5 2h8A2.5 2.5 0 0 1 15 4.5V5" />
        </svg>
    )
}

function CheckIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
        </svg>
    )
}

/**
 * Turns an email address, phone number, or web address into the right
 * kind of link: mailto, tel, WhatsApp, or a regular URL. Bind the value
 * to a CMS field to make plain-text contact details clickable. Includes
 * a copy-to-clipboard button, spam-safe email obfuscation, pre-filled
 * email subject/body, and click tracking hooks.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function ContactLink(props: ContactLinkProps) {
    const {
        value = "",
        label = "",
        detect = "auto",
        newTab = true,
        underline = true,
        copyButton = true,
        obfuscate = true,
        subject = "",
        body = "",
        countryCode = "",
        waMessage = "",
        trackingId = "",
        color = "#111111",
        hoverColor = "#666666",
        font,
        style,
    } = props
    const [hovered, setHovered] = useState(false)
    const [copied, setCopied] = useState(false)
    const [copyHover, setCopyHover] = useState(false)
    const [copyPressed, setCopyPressed] = useState(false)
    // After hydration we can safely reveal obfuscated addresses and read the page URL.
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        startTransition(() => setMounted(true))
    }, [])

    const containerStyle: CSSProperties = {
        margin: 0,
        position: "relative",
        width: "100%",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        ...style,
    }

    const textStyle: CSSProperties = {
        margin: 0,
        minWidth: 0,
        overflowWrap: "break-word",
        ...font,
    }

    const trimmed = value.trim()
    if (!trimmed) {
        return <p style={{ ...containerStyle, ...textStyle, color }} />
    }

    const type = resolveType(trimmed, detect)
    const cleaned = trimmed.replace(/^(mailto:|tel:)/i, "")
    const display = label.trim() || cleaned

    const pageUrl = mounted && typeof window !== "undefined" ? window.location.href : ""

    let href = ""
    if (type === "email") {
        const params: string[] = []
        if (subject.trim()) params.push("subject=" + encodeURIComponent(fillUrlToken(subject, pageUrl)))
        if (body.trim()) params.push("body=" + encodeURIComponent(fillUrlToken(body, pageUrl)))
        href = `mailto:${cleaned}` + (params.length ? "?" + params.join("&") : "")
    } else if (type === "phone") {
        // Dial only digits and a leading +, but display the number as written.
        const dialable = cleaned.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "")
        if (dialable) href = `tel:${dialable}`
    } else if (type === "whatsapp") {
        if (/wa\.me\//i.test(cleaned)) {
            href = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`
        } else {
            let digits = cleaned.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "")
            if (digits.startsWith("+")) digits = digits.slice(1)
            else if (digits.startsWith("00")) digits = digits.slice(2)
            else if (digits.startsWith("0") && countryCode.trim())
                digits = countryCode.replace(/\D/g, "") + digits.slice(1)
            if (digits) {
                href = `https://wa.me/${digits}`
                if (waMessage.trim()) href += "?text=" + encodeURIComponent(waMessage)
            }
        }
    } else if (type === "url") {
        href = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`
    }

    if (!href) {
        return <p style={{ ...containerStyle, ...textStyle, color }}>{display}</p>
    }

    // Spam shield: before hydration the address is rendered reversed (with
    // bidi-override it still reads correctly) and the mailto href is withheld,
    // so harvesters scraping the HTML never see a usable address.
    const shielded = obfuscate && type === "email" && !mounted
    const showReversed = shielded && display === cleaned
    const shownText = showReversed ? display.split("").reverse().join("") : display

    const opensNewTab = (type === "url" || type === "whatsapp") && newTab
    const showCopy = copyButton && (type === "email" || type === "phone" || type === "whatsapp")

    function track() {
        if (!trackingId) return
        try {
            const w = window as any
            w.dataLayer?.push({ event: "contact_link_click", trackingId, linkType: type })
            w.gtag?.("event", "contact_link_click", { tracking_id: trackingId, link_type: type })
            window.dispatchEvent(
                new CustomEvent("contactlink:click", { detail: { trackingId, type } })
            )
        } catch {
            // Analytics must never break the link.
        }
    }

    function handleCopy() {
        if (typeof navigator === "undefined" || !navigator.clipboard) return
        navigator.clipboard
            .writeText(cleaned)
            .then(() => {
                startTransition(() => setCopied(true))
                window.setTimeout(() => startTransition(() => setCopied(false)), 1600)
            })
            .catch(() => {})
    }

    return (
        <span style={containerStyle}>
            <a
                href={shielded ? undefined : href}
                target={opensNewTab ? "_blank" : undefined}
                rel={opensNewTab ? "noopener noreferrer" : undefined}
                onClick={track}
                style={{
                    ...textStyle,
                    display: "inline-block",
                    color: hovered ? hoverColor : color,
                    textDecoration: underline ? "underline" : "none",
                    textUnderlineOffset: "3px",
                    textDecorationThickness: "1px",
                    cursor: "pointer",
                    ...(showReversed
                        ? { unicodeBidi: "bidi-override", direction: "rtl" }
                        : {}),
                }}
                onMouseEnter={() => startTransition(() => setHovered(true))}
                onMouseLeave={() => startTransition(() => setHovered(false))}
            >
                {shownText}
            </a>
            {showCopy && (
                <button
                    type="button"
                    aria-label={copied ? "Copied" : "Copy to clipboard"}
                    onClick={handleCopy}
                    onPointerEnter={() => startTransition(() => setCopyHover(true))}
                    onPointerLeave={() =>
                        startTransition(() => {
                            setCopyHover(false)
                            setCopyPressed(false)
                        })
                    }
                    onPointerDown={() => startTransition(() => setCopyPressed(true))}
                    onPointerUp={() => startTransition(() => setCopyPressed(false))}
                    onPointerCancel={() => startTransition(() => setCopyPressed(false))}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "none",
                        border: "none",
                        padding: 2,
                        margin: 0,
                        cursor: "pointer",
                        flexShrink: 0,
                        color: copied ? "#16A34A" : copyHover ? hoverColor : color,
                        opacity: copied || copyHover ? 1 : 0.55,
                        transform: copyPressed ? "scale(0.82)" : "scale(1)",
                        transition:
                            "transform 0.12s ease, opacity 0.15s ease, color 0.15s ease",
                    }}
                >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                </button>
            )}
        </span>
    )
}

addPropertyControls(ContactLink, {
    value: {
        type: ControlType.String,
        title: "Value",
        defaultValue: "hello@example.com",
        placeholder: "Email, phone or URL",
    },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "",
        placeholder: "Optional display text",
    },
    detect: {
        type: ControlType.Enum,
        title: "Type",
        options: ["auto", "email", "phone", "whatsapp", "url"],
        optionTitles: ["Auto", "Email", "Phone", "WhatsApp", "Web Link"],
        defaultValue: "auto",
    },
    subject: {
        type: ControlType.String,
        title: "Subject",
        defaultValue: "",
        placeholder: "Pre-filled subject",
        hidden: (props) => props.detect !== "auto" && props.detect !== "email",
    },
    body: {
        type: ControlType.String,
        title: "Body",
        defaultValue: "",
        displayTextArea: true,
        placeholder: "Pre-filled message — {url} inserts the page URL",
        hidden: (props) => props.detect !== "auto" && props.detect !== "email",
    },
    obfuscate: {
        type: ControlType.Boolean,
        title: "Spam Shield",
        defaultValue: true,
        hidden: (props) =>
            props.detect === "phone" || props.detect === "whatsapp" || props.detect === "url",
    },
    countryCode: {
        type: ControlType.String,
        title: "Country Code",
        defaultValue: "",
        placeholder: "e.g. 31 for NL",
        hidden: (props) => props.detect !== "whatsapp",
    },
    waMessage: {
        type: ControlType.String,
        title: "Message",
        defaultValue: "",
        displayTextArea: true,
        placeholder: "Pre-filled WhatsApp message",
        hidden: (props) => props.detect !== "whatsapp",
    },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: true,
        hidden: (props) => props.detect === "email" || props.detect === "phone",
    },
    copyButton: {
        type: ControlType.Boolean,
        title: "Copy Button",
        defaultValue: true,
        hidden: (props) => props.detect === "url",
    },
    underline: {
        type: ControlType.Boolean,
        title: "Underline",
        defaultValue: true,
    },
    trackingId: {
        type: ControlType.TrackingId,
        title: "Tracking ID",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#111111",
    },
    hoverColor: {
        type: ControlType.Color,
        title: "Hover",
        defaultValue: "#666666",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            lineHeight: "1.5em",
        },
    },
})
