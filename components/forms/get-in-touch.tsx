/**
 * CONTACT SECTION
 *
 * Copyright (c) 2026 Ashref Gammoudi. All rights reserved.
 *
 * Author:   Ashref Gammoudi, The Web Architect
 * Portfolio https://contra.com/ashref_gammoudi
 * Framer    https://www.framer.com/@ashrefgammoudi
 *
 * LICENCE
 * Licensed for use in an unlimited number of the purchaser's own and
 * client projects. You may not resell, sublicense, redistribute or
 * republish this component or any derivative of its source, whether on
 * a marketplace, in a template, or as part of a component library.
 * Removing or altering this notice does not transfer ownership.
 *
 * ---------------------------------------------------------------------
 *
 * A "get in touch" section: heading, contact details and a form with
 * optional topic chips. Three input styles, three button styles, two
 * layouts, and a reveal animation you pick from the panel.
 *
 * WHERE MESSAGES GO
 * Choose one destination in the properties panel. Addresses are fixed
 * in this file and cannot be changed from the panel:
 *
 *   Formspree  https://formspree.io/f/<your form ID>
 *   Basin      https://usebasin.com/f/<your form ID>
 *   Getform    https://getform.io/f/<your form ID>
 *   Email      opens the visitor's own email app, addressed to the
 *              email you set. No request is made.
 *
 * You only paste your form ID (letters, numbers, - and _). Fields sent:
 * name, email, phone, topic, message, _subject.
 *
 * NETWORK
 * At most one request: a POST to the service chosen above, only when a
 * visitor submits. Nothing else, no tracking, no credentials stored.
 *
 * SPAM
 * Includes a hidden honeypot field (_gotcha). Bots that fill it get a
 * fake success and nothing is sent.
 *
 * STATIC RENDERING
 * On the canvas, in thumbnails and in exports it draws the finished
 * layout with no reveal animation. Visitors who prefer reduced motion
 * get the same static layout.
 */

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

import {
    motion,
    AnimatePresence,
    useInView,
    useReducedMotion,
} from "framer-motion"

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

type Reveal = "rise" | "blur" | "fade" | "none"
type Pace = "slow" | "normal" | "fast"
type InputStyle = "boxed" | "underline" | "filled"
type ButtonVariant = "filled" | "outline" | "soft"
type ButtonSize = "small" | "medium" | "large"
type ButtonShape = "pill" | "rounded" | "square"
type Status = "idle" | "sending" | "sent" | "error"

type Detail = { label: string; value: string; link?: string }

type Colors = {
    background: string
    surface: string
    text: string
    muted: string
    accent: string
    border: string
    inputBg: string
    button: string
    buttonText: string
}

type Fields = {
    nameLabel: string
    emailLabel: string
    showPhone: boolean
    phoneLabel: string
    messageLabel: string
    messagePlaceholder: string
}

type Provider = "formspree" | "basin" | "getform" | "email"

type Messages = {
    successTitle: string
    successText: string
    emailText: string
    againLabel: string
    errorText: string
    notConnectedText: string
}

interface Props {
    title: string
    accentLine: string
    description: string
    details: Detail[]
    layout: "split" | "stacked"
    showTopics: boolean
    topicLabel: string
    topics: string[]
    fields: Fields
    provider: Provider
    formId: string
    emailTo: string
    formSubject: string
    privacyNote: string
    messages: Messages
    previewState: "form" | "success"
    buttonLabel: string
    buttonVariant: ButtonVariant
    buttonSize: ButtonSize
    buttonShape: ButtonShape
    buttonArrow: boolean
    inputStyle: InputStyle
    inputRadius: number
    showCard: boolean
    cardRadius: number
    reveal: Reveal
    pace: Pace
    colors: Colors
    headingFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    titleSize: number
    paddingY: number
    style?: React.CSSProperties
}

// ---------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------

const DEFAULT_COLORS: Colors = {
    background: "#FAFBF8",
    surface: "#FFFFFF",
    text: "#1E2420",
    muted: "#5A625C",
    accent: "#4F6F5D",
    border: "#DCE1D9",
    inputBg: "#F2F4EF",
    button: "#1E2420",
    buttonText: "#FAFBF8",
}

const DEFAULT_FIELDS: Fields = {
    nameLabel: "Your name",
    emailLabel: "Email",
    showPhone: true,
    phoneLabel: "Phone (optional)",
    messageLabel: "Message",
    messagePlaceholder: "A few lines about what’s on your mind is plenty.",
}

const DEFAULT_MESSAGES: Messages = {
    successTitle: "Thank you, message received.",
    successText: "I’ll get back to you within two working days.",
    emailText:
        "Your email app should now open with your message ready to send.",
    againLabel: "Send another message",
    errorText: "Something went wrong. Please try again, or email me directly.",
    notConnectedText:
        "This form isn’t connected yet. Add your form ID or email in the properties panel.",
}

// Fixed, documented destinations. Nothing else can be reached.
const PROVIDER_URLS: Record<Exclude<Provider, "email">, string> = {
    formspree: "https://formspree.io/f/",
    basin: "https://usebasin.com/f/",
    getform: "https://getform.io/f/",
}
const ID_PATTERN = /^[A-Za-z0-9_-]{4,64}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const DEFAULT_DETAILS: Detail[] = [
    {
        label: "Email",
        value: "hello@yourpractice.com",
        link: "mailto:hello@yourpractice.com",
    },
    { label: "Phone", value: "+1 (555) 012 3456", link: "tel:+15550123456" },
    { label: "Practice", value: "12 Linden Street, Suite 4" },
    { label: "Hours", value: "Mon to Fri, 9:00 to 18:00" },
]

const DEFAULT_TOPICS = [
    "Anxiety & stress",
    "Burnout",
    "Relationships",
    "Not sure yet",
]

const ease = [0.16, 1, 0.3, 1] as const
const PACE: Record<Pace, number> = { slow: 1.35, normal: 1, fast: 0.7 }

const BTN_SIZES: Record<ButtonSize, { padding: string; fontSize: number }> = {
    small: { padding: "10px 20px", fontSize: 14 },
    medium: { padding: "14px 26px", fontSize: 15 },
    large: { padding: "18px 34px", fontSize: 16 },
}
const BTN_SHAPES: Record<ButtonShape, number> = {
    pill: 9999,
    rounded: 12,
    square: 0,
}

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 */
export default function ContactSection(props: Props) {
    const {
        title = "Get in touch,",
        accentLine = "whenever you’re ready.",
        description = "Send a short note about what’s on your mind. I reply within two working days, and the first 15-minute call is free.",
        details = DEFAULT_DETAILS,
        layout = "split",
        showTopics = true,
        topicLabel = "What would you like support with?",
        topics = DEFAULT_TOPICS,
        fields: fieldsProp,
        provider = "formspree",
        formId = "",
        emailTo = "",
        formSubject = "New message from your website",
        privacyNote = "Your message stays private and is only read by me.",
        messages: messagesProp,
        previewState = "form",
        buttonLabel = "Send message",
        buttonVariant = "filled",
        buttonSize = "medium",
        buttonShape = "pill",
        buttonArrow = false,
        inputStyle = "boxed",
        inputRadius = 12,
        showCard = true,
        cardRadius = 24,
        reveal = "rise",
        pace = "normal",
        colors: colorsProp,
        headingFont,
        bodyFont,
        titleSize = 52,
        paddingY = 120,
        style,
    } = props

    const c = { ...DEFAULT_COLORS, ...colorsProp }
    const f = { ...DEFAULT_FIELDS, ...fieldsProp }
    const m = { ...DEFAULT_MESSAGES, ...messagesProp }

    const isStatic = useIsStaticRenderer()
    const reduceMotion = useReducedMotion()
    const still = isStatic || !!reduceMotion
    const mode: Reveal = still ? "none" : reveal
    const p = PACE[pace] ?? 1

    const sectionRef = React.useRef<HTMLElement>(null)
    const inView = useInView(sectionRef, { once: true, amount: 0.2 })

    const [status, setStatus] = React.useState<Status>("idle")
    const [error, setError] = React.useState("")
    const [topic, setTopic] = React.useState("")
    const [sentByEmail, setSentByEmail] = React.useState(false)

    const uid = "cs" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
    const shownStatus: Status =
        isStatic && previewState === "success" ? "sent" : status
    const stacked = layout === "stacked"

    // Reveal: each block enters in order once the section scrolls into view
    const hidden =
        mode === "rise"
            ? { opacity: 0, y: 28 }
            : mode === "blur"
              ? { opacity: 0, y: 10, filter: "blur(10px)" }
              : { opacity: 0 }
    const r = (i: number) =>
        mode === "none"
            ? {}
            : {
                  initial: hidden,
                  animate: inView
                      ? { opacity: 1, y: 0, filter: "blur(0px)" }
                      : hidden,
                  transition: {
                      duration: 1.1 * p,
                      delay: 0.08 + i * 0.08 * p,
                      ease,
                  },
              }

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (status === "sending") return
        const form = e.currentTarget
        const data = new FormData(form)

        if (data.get("_gotcha")) {
            setSentByEmail(false)
            setStatus("sent")
            return
        }

        // Email: open the visitor's own email app. No request is made.
        if (provider === "email") {
            const to = emailTo.trim()
            if (!EMAIL_PATTERN.test(to)) {
                setError(m.notConnectedText)
                setStatus("error")
                return
            }
            const lines = [
                `Name: ${data.get("name") ?? ""}`,
                `Email: ${data.get("email") ?? ""}`,
                data.get("phone") ? `Phone: ${data.get("phone")}` : "",
                data.get("topic") ? `Topic: ${data.get("topic")}` : "",
                "",
                String(data.get("message") ?? ""),
            ].filter((l, i) => l !== "" || i === 4)
            const href =
                `mailto:${encodeURIComponent(to)}` +
                `?subject=${encodeURIComponent(formSubject)}` +
                `&body=${encodeURIComponent(lines.join("\n"))}`
            window.location.href = href
            setSentByEmail(true)
            setStatus("sent")
            return
        }

        // Form service: fixed base address + the owner's form ID
        const base = PROVIDER_URLS[provider]
        const id = formId.trim()
        if (!base || !ID_PATTERN.test(id)) {
            setError(m.notConnectedText)
            setStatus("error")
            return
        }

        setStatus("sending")
        setError("")
        try {
            const res = await fetch(base + encodeURIComponent(id), {
                method: "POST",
                body: data,
                headers: { Accept: "application/json" },
            })
            if (!res.ok) throw new Error(String(res.status))
            form.reset()
            setTopic("")
            setSentByEmail(false)
            setStatus("sent")
        } catch {
            setError(m.errorText)
            setStatus("error")
        }
    }

    const heading: React.CSSProperties = {
        fontFamily: "'Georgia', 'Times New Roman', serif",
        fontWeight: 400,
        ...headingFont,
    }
    const body: React.CSSProperties = {
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        ...bodyFont,
    }

    const btn = BTN_SIZES[buttonSize] ?? BTN_SIZES.medium
    const btnStyle: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: btn.padding,
        fontSize: btn.fontSize,
        fontWeight: 500,
        lineHeight: 1.2,
        fontFamily: "inherit",
        borderRadius: BTN_SHAPES[buttonShape] ?? 9999,
        border: `1px solid ${c.button}`,
        cursor: "pointer",
        ...(buttonVariant === "outline"
            ? { background: "transparent", color: c.button }
            : buttonVariant === "soft"
              ? {
                    background: `color-mix(in srgb, ${c.button} 10%, transparent)`,
                    borderColor: "transparent",
                    color: c.button,
                }
              : { background: c.button, color: c.buttonText }),
    }

    const input =
        inputStyle === "underline"
            ? `border: 0; border-bottom: 1px solid ${c.border}; border-radius: 0; padding: 12px 0; background: transparent;`
            : inputStyle === "filled"
              ? `border: 1px solid transparent; border-radius: ${inputRadius}px; padding: 14px 16px; background: ${c.inputBg};`
              : `border: 1px solid ${c.border}; border-radius: ${inputRadius}px; padding: 14px 16px; background: ${c.surface};`
    const inputFocus =
        inputStyle === "underline"
            ? `border-bottom-color: ${c.accent};`
            : `border-color: ${c.accent}; box-shadow: 0 0 0 3px color-mix(in srgb, ${c.accent} 16%, transparent);`

    return (
        <section
            ref={sectionRef}
            className={uid}
            style={{
                width: "100%",
                background: c.background,
                color: c.text,
                ...body,
                ...style,
            }}
        >
            <style>{`
                .${uid} { container-type: inline-size; }
                .${uid} .cs-title { font-size: ${titleSize}px; }
                .${uid} .cs-grid {
                    display: grid; gap: 72px; align-items: start;
                    grid-template-columns: ${stacked ? "1fr" : "0.9fr 1.1fr"};
                }
                .${uid} .cs-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

                .${uid} .cs-input {
                    width: 100%; box-sizing: border-box; display: block;
                    font: inherit; font-size: 16px; line-height: 1.4; color: ${c.text};
                    outline: none; -webkit-appearance: none; appearance: none;
                    transition: border-color .35s ease, box-shadow .35s ease, background-color .35s ease;
                    ${input}
                }
                .${uid} .cs-input::placeholder { color: ${c.muted}; opacity: .7; }
                .${uid} .cs-input:focus { ${inputFocus} }
                .${uid} textarea.cs-input { resize: vertical; min-height: 132px; }

                .${uid} .cs-chip {
                    font: inherit; font-size: 14px; cursor: pointer;
                    padding: 9px 16px; border-radius: 9999px;
                    border: 1px solid ${c.border}; background: transparent; color: ${c.text};
                    transition: background-color .35s cubic-bezier(.16,1,.3,1), color .35s cubic-bezier(.16,1,.3,1), border-color .35s ease;
                }
                .${uid} .cs-chip:hover { border-color: ${c.accent}; }
                .${uid} .cs-chip[aria-checked="true"] { background: ${c.button}; border-color: ${c.button}; color: ${c.buttonText}; }

                .${uid} .cs-btn {
                    transition: background-color .45s cubic-bezier(.16,1,.3,1), color .45s cubic-bezier(.16,1,.3,1),
                                transform .45s cubic-bezier(.16,1,.3,1), opacity .45s ease;
                }
                .${uid} .cs-btn:hover:not(:disabled) { transform: translateY(-2px); }
                .${uid} .cs-btn-filled:hover:not(:disabled) { opacity: .9; }
                .${uid} .cs-btn-outline:hover:not(:disabled) { background: ${c.button} !important; color: ${c.buttonText} !important; }
                .${uid} .cs-btn-soft:hover:not(:disabled) { background: color-mix(in srgb, ${c.button} 18%, transparent) !important; }
                .${uid} .cs-btn:disabled { opacity: .6; cursor: progress; }
                .${uid} .cs-arrow { transition: transform .45s cubic-bezier(.16,1,.3,1); }
                .${uid} .cs-btn:hover .cs-arrow { transform: translateX(3px); }

                .${uid} a.cs-link { color: inherit; text-decoration: underline; text-decoration-color: transparent;
                    text-underline-offset: 4px; transition: text-decoration-color .3s ease; }
                .${uid} a.cs-link:hover { text-decoration-color: currentColor; }
                .${uid} :focus-visible { outline: 2px solid ${c.accent}; outline-offset: 3px; }

                @container (max-width: 1100px) {
                    .${uid} .cs-title { font-size: ${Math.round(titleSize * 0.85)}px; }
                    .${uid} .cs-grid { gap: 48px; }
                }
                @container (max-width: 809px) {
                    .${uid} .cs-title { font-size: ${Math.max(32, Math.round(titleSize * 0.68))}px; }
                    .${uid} .cs-grid { grid-template-columns: 1fr; gap: 40px; }
                    .${uid} .cs-row2 { grid-template-columns: 1fr; }
                    .${uid} .cs-wrap { padding: ${Math.round(paddingY * 0.6)}px 20px !important; }
                    .${uid} .cs-card { padding: 24px !important; }
                }
            `}</style>

            <div
                className="cs-wrap"
                style={{
                    maxWidth: stacked ? 760 : 1200,
                    margin: "0 auto",
                    padding: `${paddingY}px 40px`,
                    boxSizing: "border-box",
                }}
            >
                <div className="cs-grid">
                    {/* Intro + details */}
                    <div style={{ textAlign: stacked ? "center" : "left" }}>
                        <motion.h2
                            className="cs-title"
                            {...r(0)}
                            style={{
                                ...heading,
                                margin: 0,
                                lineHeight: 1.1,
                                letterSpacing: "-0.015em",
                                textWrap: "balance" as any,
                            }}
                        >
                            {title}
                            {accentLine && (
                                <>
                                    <br />
                                    <span style={{ color: c.accent }}>
                                        {accentLine}
                                    </span>
                                </>
                            )}
                        </motion.h2>

                        {description && (
                            <motion.p
                                {...r(1)}
                                style={{
                                    margin: stacked
                                        ? "20px auto 0"
                                        : "20px 0 0",
                                    maxWidth: "44ch",
                                    fontSize: 17,
                                    lineHeight: 1.6,
                                    color: c.muted,
                                }}
                            >
                                {description}
                            </motion.p>
                        )}

                        {details && details.length > 0 && (
                            <motion.dl
                                {...r(2)}
                                style={{
                                    margin: stacked ? "32px 0 0" : "48px 0 0",
                                    display: stacked ? "flex" : "block",
                                    flexWrap: "wrap",
                                    justifyContent: "center",
                                    gap: stacked ? "16px 40px" : undefined,
                                }}
                            >
                                {details.map((d, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            padding: stacked ? 0 : "18px 0",
                                            borderTop: stacked
                                                ? "none"
                                                : `1px solid ${c.border}`,
                                            borderBottom:
                                                !stacked &&
                                                i === details.length - 1
                                                    ? `1px solid ${c.border}`
                                                    : "none",
                                            display: stacked ? "block" : "grid",
                                            gridTemplateColumns: "120px 1fr",
                                            gap: 16,
                                        }}
                                    >
                                        <dt
                                            style={{
                                                fontSize: 14,
                                                color: c.muted,
                                            }}
                                        >
                                            {d.label}
                                        </dt>
                                        <dd
                                            style={{
                                                margin: stacked ? "4px 0 0" : 0,
                                                fontSize: 16,
                                            }}
                                        >
                                            {d.link ? (
                                                <a
                                                    className="cs-link"
                                                    href={d.link}
                                                >
                                                    {d.value}
                                                </a>
                                            ) : (
                                                d.value
                                            )}
                                        </dd>
                                    </div>
                                ))}
                            </motion.dl>
                        )}
                    </div>

                    {/* Form */}
                    <motion.div
                        {...r(3)}
                        className="cs-card"
                        style={{
                            position: "relative",
                            textAlign: "left",
                            padding: showCard ? 40 : 0,
                            background: showCard ? c.surface : "transparent",
                            border: showCard ? `1px solid ${c.border}` : "none",
                            borderRadius: showCard ? cardRadius : 0,
                            boxSizing: "border-box",
                        }}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            {shownStatus === "sent" ? (
                                <motion.div
                                    key="sent"
                                    role="status"
                                    initial={
                                        still ? false : { opacity: 0, y: 12 }
                                    }
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.6 * p, ease }}
                                    style={{
                                        minHeight: 360,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        textAlign: "center",
                                        gap: 12,
                                    }}
                                >
                                    <SuccessMark
                                        color={c.accent}
                                        animate={!still}
                                    />
                                    <p
                                        style={{
                                            ...heading,
                                            margin: "12px 0 0",
                                            fontSize: 28,
                                            lineHeight: 1.2,
                                        }}
                                    >
                                        {m.successTitle}
                                    </p>
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: 16,
                                            color: c.muted,
                                            maxWidth: "36ch",
                                        }}
                                    >
                                        {sentByEmail
                                            ? m.emailText
                                            : m.successText}
                                    </p>
                                    {m.againLabel && (
                                        <button
                                            type="button"
                                            onClick={() => setStatus("idle")}
                                            style={{
                                                marginTop: 12,
                                                font: "inherit",
                                                fontSize: 15,
                                                color: c.text,
                                                background: "none",
                                                border: 0,
                                                padding: 0,
                                                cursor: "pointer",
                                                textDecoration: "underline",
                                                textUnderlineOffset: 5,
                                            }}
                                        >
                                            {m.againLabel}
                                        </button>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.form
                                    key="form"
                                    onSubmit={onSubmit}
                                    noValidate={false}
                                    initial={still ? false : { opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.5 * p, ease }}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 20,
                                    }}
                                >
                                    <input
                                        type="hidden"
                                        name="_subject"
                                        value={formSubject}
                                    />
                                    <input
                                        type="hidden"
                                        name="topic"
                                        value={topic}
                                    />
                                    <input
                                        type="text"
                                        name="_gotcha"
                                        tabIndex={-1}
                                        autoComplete="off"
                                        aria-hidden
                                        style={{
                                            position: "absolute",
                                            left: -9999,
                                            width: 1,
                                            height: 1,
                                            opacity: 0,
                                        }}
                                    />

                                    <div className="cs-row2">
                                        <Field
                                            id={`${uid}-name`}
                                            label={f.nameLabel}
                                            color={c.muted}
                                        >
                                            <input
                                                id={`${uid}-name`}
                                                className="cs-input"
                                                name="name"
                                                type="text"
                                                autoComplete="name"
                                                required
                                            />
                                        </Field>
                                        <Field
                                            id={`${uid}-email`}
                                            label={f.emailLabel}
                                            color={c.muted}
                                        >
                                            <input
                                                id={`${uid}-email`}
                                                className="cs-input"
                                                name="email"
                                                type="email"
                                                autoComplete="email"
                                                required
                                            />
                                        </Field>
                                    </div>

                                    {f.showPhone && (
                                        <Field
                                            id={`${uid}-phone`}
                                            label={f.phoneLabel}
                                            color={c.muted}
                                        >
                                            <input
                                                id={`${uid}-phone`}
                                                className="cs-input"
                                                name="phone"
                                                type="tel"
                                                autoComplete="tel"
                                            />
                                        </Field>
                                    )}

                                    {showTopics &&
                                        topics &&
                                        topics.length > 0 && (
                                            <div
                                                role="radiogroup"
                                                aria-label={topicLabel}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: 14,
                                                        color: c.muted,
                                                        marginBottom: 10,
                                                    }}
                                                >
                                                    {topicLabel}
                                                </div>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        flexWrap: "wrap",
                                                        gap: 8,
                                                    }}
                                                >
                                                    {topics.map((t, i) => (
                                                        <button
                                                            key={i}
                                                            type="button"
                                                            role="radio"
                                                            aria-checked={
                                                                topic === t
                                                            }
                                                            className="cs-chip"
                                                            onClick={() =>
                                                                setTopic(
                                                                    topic === t
                                                                        ? ""
                                                                        : t
                                                                )
                                                            }
                                                        >
                                                            {t}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                    <Field
                                        id={`${uid}-msg`}
                                        label={f.messageLabel}
                                        color={c.muted}
                                    >
                                        <textarea
                                            id={`${uid}-msg`}
                                            className="cs-input"
                                            name="message"
                                            rows={5}
                                            placeholder={f.messagePlaceholder}
                                            required
                                        />
                                    </Field>

                                    <div
                                        style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: "16px 24px",
                                            marginTop: 4,
                                        }}
                                    >
                                        {privacyNote && (
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: 13,
                                                    color: c.muted,
                                                    maxWidth: "34ch",
                                                }}
                                            >
                                                {privacyNote}
                                            </p>
                                        )}
                                        <button
                                            type="submit"
                                            className={`cs-btn cs-btn-${buttonVariant}`}
                                            disabled={status === "sending"}
                                            style={btnStyle}
                                        >
                                            {status === "sending" ? (
                                                <Dots />
                                            ) : (
                                                buttonLabel
                                            )}
                                            {buttonArrow &&
                                                status !== "sending" && (
                                                    <svg
                                                        className="cs-arrow"
                                                        width="14"
                                                        height="14"
                                                        viewBox="0 0 14 14"
                                                        fill="none"
                                                        aria-hidden
                                                    >
                                                        <path
                                                            d="M1 7h12M8 2l5 5-5 5"
                                                            stroke="currentColor"
                                                            strokeWidth="1.5"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                )}
                                        </button>
                                    </div>

                                    <div
                                        aria-live="polite"
                                        style={{ minHeight: 0 }}
                                    >
                                        {shownStatus === "error" && error && (
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: 14,
                                                    color: c.text,
                                                }}
                                            >
                                                {error}
                                            </p>
                                        )}
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}

// ---------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------

function Field({
    id,
    label,
    color,
    children,
}: {
    id: string
    label: string
    color: string
    children: React.ReactNode
}) {
    return (
        <div>
            <label
                htmlFor={id}
                style={{
                    display: "block",
                    fontSize: 14,
                    color,
                    marginBottom: 8,
                }}
            >
                {label}
            </label>
            {children}
        </div>
    )
}

function Dots() {
    return (
        <span
            aria-label="Sending"
            style={{ display: "inline-flex", gap: 4, padding: "0 6px" }}
        >
            {[0, 1, 2].map((i) => (
                <motion.span
                    key={i}
                    style={{
                        width: 5,
                        height: 5,
                        borderRadius: 9999,
                        background: "currentColor",
                        display: "block",
                    }}
                    animate={{ opacity: [0.25, 1, 0.25] }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </span>
    )
}

function SuccessMark({ color, animate }: { color: string; animate: boolean }) {
    return (
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden>
            <motion.circle
                cx="28"
                cy="28"
                r="26"
                stroke={color}
                strokeWidth="1.5"
                initial={animate ? { pathLength: 0 } : false}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease }}
            />
            <motion.path
                d="M18 29l7 7 13-15"
                stroke={color}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={animate ? { pathLength: 0 } : false}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.5, ease }}
            />
        </svg>
    )
}

// ---------------------------------------------------------------------
// Property controls
// ---------------------------------------------------------------------

addPropertyControls(ContactSection, {
    // Content
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Get in touch,",
        displayTextArea: true,
    },
    accentLine: {
        type: ControlType.String,
        title: "Accent Line",
        defaultValue: "whenever you’re ready.",
        description: "Second line in the accent color. Leave empty to hide.",
    },
    description: {
        type: ControlType.String,
        title: "Description",
        defaultValue:
            "Send a short note about what’s on your mind. I reply within two working days, and the first 15-minute call is free.",
        displayTextArea: true,
    },
    details: {
        type: ControlType.Array,
        title: "Details",
        maxCount: 6,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Email",
                },
                value: {
                    type: ControlType.String,
                    title: "Value",
                    defaultValue: "hello@yourpractice.com",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    description: "Optional. mailto:, tel: or a maps link.",
                },
            },
        },
        defaultValue: DEFAULT_DETAILS,
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["split", "stacked"],
        optionTitles: ["Split", "Stacked"],
        defaultValue: "split",
        displaySegmentedControl: true,
    },

    // Form
    provider: {
        type: ControlType.Enum,
        title: "Send With",
        options: ["formspree", "basin", "getform", "email"],
        optionTitles: ["Formspree", "Basin", "Getform", "Email App"],
        defaultValue: "formspree",
        description:
            "Where messages go. Addresses are fixed: formspree.io, usebasin.com, getform.io.",
    },
    formId: {
        type: ControlType.String,
        title: "Form ID",
        defaultValue: "",
        placeholder: "e.g. xyzabcd",
        description: "Only the ID from your form’s URL, not the full link.",
        hidden: (p) => p.provider === "email",
    },
    emailTo: {
        type: ControlType.String,
        title: "Your Email",
        defaultValue: "",
        placeholder: "hello@yourpractice.com",
        description:
            "Opens the visitor’s email app addressed to you. No data passes through any service.",
        hidden: (p) => p.provider !== "email",
    },
    formSubject: {
        type: ControlType.String,
        title: "Email Subject",
        defaultValue: "New message from your website",
    },
    fields: {
        type: ControlType.Object,
        title: "Fields",
        controls: {
            nameLabel: {
                type: ControlType.String,
                title: "Name",
                defaultValue: DEFAULT_FIELDS.nameLabel,
            },
            emailLabel: {
                type: ControlType.String,
                title: "Email",
                defaultValue: DEFAULT_FIELDS.emailLabel,
            },
            showPhone: {
                type: ControlType.Boolean,
                title: "Phone Field",
                defaultValue: true,
            },
            phoneLabel: {
                type: ControlType.String,
                title: "Phone",
                defaultValue: DEFAULT_FIELDS.phoneLabel,
                hidden: (p: any) => !p.showPhone,
            },
            messageLabel: {
                type: ControlType.String,
                title: "Message",
                defaultValue: DEFAULT_FIELDS.messageLabel,
            },
            messagePlaceholder: {
                type: ControlType.String,
                title: "Placeholder",
                defaultValue: DEFAULT_FIELDS.messagePlaceholder,
            },
        },
    },
    showTopics: {
        type: ControlType.Boolean,
        title: "Topic Chips",
        defaultValue: true,
    },
    topicLabel: {
        type: ControlType.String,
        title: "Topic Label",
        defaultValue: "What would you like support with?",
        hidden: (p) => !p.showTopics,
    },
    topics: {
        type: ControlType.Array,
        title: "Topics",
        control: { type: ControlType.String },
        defaultValue: DEFAULT_TOPICS,
        maxCount: 8,
        hidden: (p) => !p.showTopics,
    },
    privacyNote: {
        type: ControlType.String,
        title: "Privacy Note",
        defaultValue: "Your message stays private and is only read by me.",
        description: "Leave empty to hide.",
    },
    messages: {
        type: ControlType.Object,
        title: "Messages",
        controls: {
            successTitle: {
                type: ControlType.String,
                title: "Success",
                defaultValue: DEFAULT_MESSAGES.successTitle,
            },
            successText: {
                type: ControlType.String,
                title: "Success Text",
                defaultValue: DEFAULT_MESSAGES.successText,
                displayTextArea: true,
            },
            emailText: {
                type: ControlType.String,
                title: "Email App Text",
                defaultValue: DEFAULT_MESSAGES.emailText,
                displayTextArea: true,
            },
            againLabel: {
                type: ControlType.String,
                title: "Send Again",
                defaultValue: DEFAULT_MESSAGES.againLabel,
            },
            errorText: {
                type: ControlType.String,
                title: "Error",
                defaultValue: DEFAULT_MESSAGES.errorText,
                displayTextArea: true,
            },
            notConnectedText: {
                type: ControlType.String,
                title: "Not Connected",
                defaultValue: DEFAULT_MESSAGES.notConnectedText,
                displayTextArea: true,
            },
        },
    },
    previewState: {
        type: ControlType.Enum,
        title: "Canvas Preview",
        options: ["form", "success"],
        optionTitles: ["Form", "Success"],
        defaultValue: "form",
        displaySegmentedControl: true,
        description:
            "Canvas only. Lets you style the success message. The live site always starts on the form.",
    },

    // Button
    buttonLabel: {
        type: ControlType.String,
        title: "Button",
        defaultValue: "Send message",
    },
    buttonVariant: {
        type: ControlType.Enum,
        title: "Button Style",
        options: ["filled", "outline", "soft"],
        optionTitles: ["Filled", "Outline", "Soft"],
        defaultValue: "filled",
        displaySegmentedControl: true,
    },
    buttonSize: {
        type: ControlType.Enum,
        title: "Button Size",
        options: ["small", "medium", "large"],
        optionTitles: ["S", "M", "L"],
        defaultValue: "medium",
        displaySegmentedControl: true,
    },
    buttonShape: {
        type: ControlType.Enum,
        title: "Button Shape",
        options: ["pill", "rounded", "square"],
        optionTitles: ["Pill", "Rounded", "Square"],
        defaultValue: "pill",
        displaySegmentedControl: true,
    },
    buttonArrow: {
        type: ControlType.Boolean,
        title: "Button Arrow",
        defaultValue: false,
    },

    // Inputs & card
    inputStyle: {
        type: ControlType.Enum,
        title: "Input Style",
        options: ["boxed", "underline", "filled"],
        optionTitles: ["Boxed", "Underline", "Filled"],
        defaultValue: "boxed",
        displaySegmentedControl: true,
    },
    inputRadius: {
        type: ControlType.Number,
        title: "Input Radius",
        defaultValue: 12,
        min: 0,
        max: 30,
        unit: "px",
        hidden: (p) => p.inputStyle === "underline",
    },
    showCard: {
        type: ControlType.Boolean,
        title: "Form Card",
        defaultValue: true,
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 24,
        min: 0,
        max: 48,
        unit: "px",
        hidden: (p) => !p.showCard,
    },

    // Motion
    reveal: {
        type: ControlType.Enum,
        title: "Reveal",
        options: ["rise", "blur", "fade", "none"],
        optionTitles: ["Rise", "Blur", "Fade", "None"],
        defaultValue: "rise",
        displaySegmentedControl: true,
    },
    pace: {
        type: ControlType.Enum,
        title: "Pace",
        options: ["slow", "normal", "fast"],
        optionTitles: ["Slow", "Normal", "Fast"],
        defaultValue: "normal",
        displaySegmentedControl: true,
    },

    // Style
    titleSize: {
        type: ControlType.Number,
        title: "Title Size",
        defaultValue: 52,
        min: 28,
        max: 96,
        unit: "px",
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        defaultValue: 120,
        min: 0,
        max: 240,
        unit: "px",
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: DEFAULT_COLORS.background,
            },
            surface: {
                type: ControlType.Color,
                title: "Card",
                defaultValue: DEFAULT_COLORS.surface,
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: DEFAULT_COLORS.text,
            },
            muted: {
                type: ControlType.Color,
                title: "Muted",
                defaultValue: DEFAULT_COLORS.muted,
            },
            accent: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: DEFAULT_COLORS.accent,
            },
            border: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: DEFAULT_COLORS.border,
            },
            inputBg: {
                type: ControlType.Color,
                title: "Input Fill",
                defaultValue: DEFAULT_COLORS.inputBg,
            },
            button: {
                type: ControlType.Color,
                title: "Button",
                defaultValue: DEFAULT_COLORS.button,
            },
            buttonText: {
                type: ControlType.Color,
                title: "Button Text",
                defaultValue: DEFAULT_COLORS.buttonText,
            },
        },
    },
    headingFont: {
        type: ControlType.Font,
        title: "Heading Font",
        controls: "basic",
        defaultFontType: "serif",
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "basic",
        defaultFontType: "sans-serif",
    },
})
