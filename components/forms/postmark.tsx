// PostcardForm — Framer Code Component
// @framerSupportedLayoutWidth any
// @framerSupportedLayoutHeight auto
// @framerIntrinsicWidth 960
// @framerIntrinsicHeight 640

import * as React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Stamp = { name: string; glyph: string; color: string; description: string }

type Props = {
    formspreeId: string
    recipient: string
    recipientLine: string
    greeting: string
    placeholder: string
    maxChars: number
    stamps: Stamp[]
    paper: string
    ink: string
    accent: string
    line: string
    muted: string
    textColor: string
    radius: number
    tilt: number
    animate: boolean
    showPostmark: boolean
    successTitle: string
    successText: string
    buttonLabel: string
    showButton: boolean
    buttonColor: string
    buttonText: string
    handFont?: React.CSSProperties
    serifFont?: React.CSSProperties
    onSubmit?: (data: Record<string, string>) => void
    style?: React.CSSProperties
}

type Phase = "edit" | "sending" | "stamped" | "flying" | "sent"

const DEFAULT_STAMPS: Stamp[] = [
    {
        name: "Say hello",
        glyph: "✳",
        color: "#2F6B4F",
        description: "Just saying hi",
    },
    {
        name: "New project",
        glyph: "◐",
        color: "#E2471B",
        description: "A project in mind",
    },
    {
        name: "Press",
        glyph: "¶",
        color: "#23324A",
        description: "Press & speaking",
    },
    {
        name: "Careers",
        glyph: "★",
        color: "#B8892B",
        description: "Want to join us",
    },
]

const MONO = "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
const SANS = "'Geist', system-ui, sans-serif"
const HAND = "'Caveat', cursive"
const SERIF = "'Libre Caslon Text', Georgia, serif"
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Fixed, reviewed submission backend. Only the form ID is configurable.
const FORMSPREE_BASE = "https://formspree.io/f/"

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Caveat:wght@500;600&family=Geist:wght@400;500&family=Geist+Mono:wght@400;500&display=swap');
@keyframes pf-thunk{0%{opacity:0;transform:rotate(-18deg) scale(2.2)}60%{opacity:1;transform:rotate(-18deg) scale(.92)}100%{opacity:1;transform:rotate(-18deg) scale(1)}}
@keyframes pf-rise{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
.pf-root input::placeholder,.pf-root textarea::placeholder{color:var(--pf-ph)}
.pf-stamp{transition:transform .2s cubic-bezier(.3,1.6,.5,1)}
.pf-stamp:hover{transform:translateY(-3px) rotate(-3deg)}
.pf-field:focus{border-bottom-color:var(--pf-ink)!important}
.pf-btn{transition:transform .2s}
.pf-btn:hover{transform:translateY(-2px) rotate(-1deg)}
.pf-btn:active{transform:scale(.97)}
`

/**
 * @framerDisableUnlink
 */
export default function PostcardForm(props: Props) {
    const {
        formspreeId,
        recipient,
        recipientLine,
        greeting,
        placeholder,
        maxChars,
        paper,
        ink,
        accent,
        line,
        muted,
        textColor,
        radius,
        tilt,
        animate,
        showPostmark,
        successTitle,
        successText,
        buttonLabel,
        showButton,
        buttonColor,
        buttonText,
        handFont,
        serifFont,
        onSubmit,
        style,
    } = props
    const stamps = props.stamps?.length ? props.stamps : DEFAULT_STAMPS
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const [message, setMessage] = useState("")
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [stampIndex, setStampIndex] = useState(0)
    const [phase, setPhase] = useState<Phase>("edit")
    const [error, setError] = useState("")
    const timers = useRef<number[]>([])

    useEffect(() => () => timers.current.forEach(clearTimeout), [])

    const stamp = stamps[Math.min(stampIndex, stamps.length - 1)]
    const hand = { fontFamily: HAND, ...handFont }
    const serif = { fontFamily: SERIF, ...serifFont }

    const validate = () => {
        if (message.trim().length < 3) return "Write a line or two first"
        if (!name.trim()) return "Sign it with your name"
        if (!EMAIL_RE.test(email.trim()))
            return "We need a valid return address"
        return ""
    }

    const send = useCallback(async () => {
        if (phase !== "edit") return
        const err = validate()
        if (err) return setError(err)
        setError("")
        const data = {
            name: name.trim(),
            email: email.trim(),
            message: message.trim(),
            topic: stamp.name,
        }

        const formId = (formspreeId || "").trim()
        if (formId && !isCanvas) {
            if (!/^[a-zA-Z0-9]{4,20}$/.test(formId))
                return setError("Form isn’t set up correctly")
            setPhase("sending")
            try {
                const res = await fetch(`${FORMSPREE_BASE}${formId}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify(data),
                })
                if (!res.ok) throw new Error(String(res.status))
            } catch {
                setPhase("edit")
                return setError("Couldn’t send — please try again")
            }
        }
        onSubmit?.(data)

        const fast = !animate || isCanvas
        setPhase(showPostmark ? "stamped" : "flying")
        timers.current = [
            window.setTimeout(
                () => setPhase("flying"),
                fast ? 200 : showPostmark ? 900 : 0
            ),
            window.setTimeout(
                () => setPhase("sent"),
                fast ? 300 : showPostmark ? 1700 : 800
            ),
        ]
    }, [
        phase,
        name,
        email,
        message,
        stamp,
        formspreeId,
        animate,
        showPostmark,
        onSubmit,
        isCanvas,
    ])

    const reset = () => {
        timers.current.forEach(clearTimeout)
        setMessage("")
        setName("")
        setEmail("")
        setError("")
        setPhase("edit")
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            send()
        }
    }

    const len = message.length
    const msgSize = Math.round(36 - Math.min(1, len / maxChars) * 12)
    const d = new Date()
    const dateShort = `${d.getDate()} ${d.toLocaleString("en", { month: "short" }).toUpperCase()}`
    const flying = phase === "flying" || phase === "sent"
    const errLine = (key: string) => (error.includes(key) ? "#C23A12" : line)

    const label: React.CSSProperties = {
        font: `500 10px ${MONO}`,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: muted,
    }
    const fieldStyle: React.CSSProperties = {
        ...hand,
        fontSize: 28,
        fontWeight: 500,
        border: "none",
        background: "none",
        outline: "none",
        padding: "4px 0 6px",
        color: ink,
        width: "100%",
    }

    return (
        <div
            className="pf-root"
            onKeyDown={onKeyDown}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 28,
                fontFamily: SANS,
                color: textColor,
                // @ts-ignore css vars
                "--pf-ink": ink,
                "--pf-ph": "#B4AC9C",
            }}
        >
            <style>{GLOBAL_CSS}</style>

            <div style={{ position: "relative", width: "100%" }}>
                {phase === "sent" && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 14,
                            textAlign: "center",
                            animation:
                                "pf-rise 600ms 300ms cubic-bezier(.2,.8,.2,1) both",
                        }}
                    >
                        <span
                            style={{
                                ...label,
                                color: "currentColor",
                                opacity: 0.6,
                            }}
                        >
                            Postmarked{" "}
                            {d.toLocaleDateString("en", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            })}
                        </span>
                        <h2
                            style={{
                                ...serif,
                                margin: 0,
                                fontSize: 64,
                                lineHeight: 1,
                                fontWeight: 400,
                            }}
                        >
                            {successTitle}
                        </h2>
                        <p
                            style={{
                                ...hand,
                                margin: 0,
                                fontSize: 26,
                                opacity: 0.8,
                            }}
                        >
                            {successText.replace("{email}", email)}
                        </p>
                        <button
                            onClick={reset}
                            style={{
                                marginTop: 8,
                                border: "1px solid currentColor",
                                background: "none",
                                color: "inherit",
                                font: `500 12px ${MONO}`,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                padding: "12px 18px",
                                borderRadius: 999,
                                cursor: "pointer",
                                opacity: 0.8,
                            }}
                        >
                            Write another
                        </button>
                    </div>
                )}

                <div
                    style={{
                        position: "relative",
                        background: paper,
                        borderRadius: radius,
                        display: "flex",
                        flexWrap: "wrap",
                        boxShadow:
                            "0 2px 0 rgba(0,0,0,0.08), 0 30px 80px -20px rgba(0,0,0,0.45)",
                        transform: flying
                            ? "translate(40vw,-90vh) rotate(18deg) scale(0.6)"
                            : phase === "stamped"
                              ? `rotate(${tilt - 1}deg) scale(0.985)`
                              : `rotate(${tilt}deg)`,
                        opacity: phase === "sent" ? 0 : 1,
                        transition: flying
                            ? "transform 900ms cubic-bezier(.6,-0.2,.4,1), opacity 400ms 500ms"
                            : "transform 400ms cubic-bezier(.2,.8,.2,1)",
                        pointerEvents: phase === "edit" ? "auto" : "none",
                    }}
                >
                    {/* Message side */}
                    <div
                        style={{
                            flex: "1.15 1 380px",
                            padding: "36px clamp(20px, 5vw, 36px) 28px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 14,
                            boxSizing: "border-box",
                            minWidth: 0,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "baseline",
                                gap: 12,
                            }}
                        >
                            <span style={label}>{greeting}</span>
                            <span
                                style={{
                                    ...label,
                                    letterSpacing: "0.08em",
                                    color:
                                        maxChars - len < 30 ? "#C23A12" : muted,
                                }}
                            >
                                {len} / {maxChars}
                            </span>
                        </div>
                        <textarea
                            value={message}
                            aria-label="Message"
                            maxLength={maxChars}
                            onChange={(e) => {
                                setMessage(e.target.value)
                                setError("")
                            }}
                            placeholder={placeholder}
                            style={{
                                ...hand,
                                flex: 1,
                                minHeight: 280,
                                resize: "none",
                                border: "none",
                                outline: "none",
                                padding: 0,
                                background: `repeating-linear-gradient(to bottom, transparent 0, transparent 41px, ${line} 41px, ${line} 42px)`,
                                backgroundAttachment: "local",
                                fontSize: msgSize,
                                fontWeight: 500,
                                lineHeight: "42px",
                                color: ink,
                                transition: "font-size 250ms",
                            }}
                        />
                        <div style={{ ...hand, fontSize: 26, color: ink }}>
                            — {name.trim() || "you"}
                        </div>
                    </div>

                    <div
                        style={{
                            flex: "0 0 1px",
                            background: line,
                            margin: "32px 0",
                        }}
                    />

                    {/* Address side */}
                    <div
                        style={{
                            flex: "1 1 320px",
                            padding: "28px clamp(20px, 5vw, 36px) 32px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 26,
                            boxSizing: "border-box",
                            minWidth: 0,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap-reverse",
                                justifyContent: "space-between",
                                alignItems: "flex-end",
                                gap: 16,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 6,
                                    paddingTop: 6,
                                }}
                            >
                                <span style={label}>Pick a stamp</span>
                                <div
                                    role="radiogroup"
                                    aria-label="Topic"
                                    style={{ display: "flex", gap: 6 }}
                                >
                                    {stamps.map((s, i) => (
                                        <button
                                            key={i}
                                            className="pf-stamp"
                                            title={s.name}
                                            role="radio"
                                            aria-checked={i === stampIndex}
                                            aria-label={s.name}
                                            onClick={() => setStampIndex(i)}
                                            style={{
                                                width: 38,
                                                height: 46,
                                                padding: 3,
                                                border: "none",
                                                flex: "none",
                                                background: paper,
                                                cursor: "pointer",
                                                outline: `2px dotted ${i === stampIndex ? ink : line}`,
                                                outlineOffset: -1,
                                                transform:
                                                    i === stampIndex
                                                        ? "translateY(-4px) rotate(-4deg)"
                                                        : undefined,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    ...serif,
                                                    display: "flex",
                                                    width: "100%",
                                                    height: "100%",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    background: s.color,
                                                    color: paper,
                                                    fontSize: 20,
                                                }}
                                            >
                                                {s.glyph}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <span
                                    style={{
                                        ...hand,
                                        fontSize: 22,
                                        color: muted,
                                    }}
                                >
                                    {stamp.description}
                                </span>
                            </div>

                            <div style={{ position: "relative", flex: "none" }}>
                                <div
                                    style={{
                                        width: 96,
                                        height: 116,
                                        padding: 6,
                                        background: paper,
                                        outline: `3px dotted ${line}`,
                                        outlineOffset: -2,
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                                        transform: "rotate(3deg)",
                                        boxSizing: "border-box",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            background: stamp.color,
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "space-between",
                                            padding: 8,
                                            boxSizing: "border-box",
                                            color: paper,
                                            transition: "background 300ms",
                                        }}
                                    >
                                        <span
                                            style={{
                                                font: `500 8px ${MONO}`,
                                                letterSpacing: "0.12em",
                                            }}
                                        >
                                            No.{" "}
                                            {String(stampIndex + 1).padStart(
                                                2,
                                                "0"
                                            )}
                                        </span>
                                        <span
                                            style={{
                                                ...serif,
                                                fontSize: 44,
                                                lineHeight: 0.8,
                                                textAlign: "center",
                                            }}
                                        >
                                            {stamp.glyph}
                                        </span>
                                        <span
                                            style={{
                                                font: `500 8px ${MONO}`,
                                                letterSpacing: "0.12em",
                                                textAlign: "right",
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            {stamp.name}
                                        </span>
                                    </div>
                                </div>
                                {showPostmark &&
                                    (phase === "stamped" || flying) && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: -58,
                                                top: 22,
                                                width: 112,
                                                height: 112,
                                                borderRadius: "50%",
                                                border: `2.5px solid ${accent}`,
                                                color: accent,
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 2,
                                                mixBlendMode: "multiply",
                                                animation:
                                                    "pf-thunk 380ms cubic-bezier(.3,1.4,.5,1) both",
                                                pointerEvents: "none",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    font: `500 9px ${MONO}`,
                                                    letterSpacing: "0.14em",
                                                    textTransform: "uppercase",
                                                }}
                                            >
                                                {recipient}
                                            </span>
                                            <span
                                                style={{
                                                    ...serif,
                                                    fontSize: 22,
                                                    lineHeight: 1,
                                                }}
                                            >
                                                {dateShort}
                                            </span>
                                            <span
                                                style={{
                                                    font: `500 9px ${MONO}`,
                                                    letterSpacing: "0.14em",
                                                }}
                                            >
                                                {d.getFullYear()}
                                            </span>
                                        </div>
                                    )}
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                            }}
                        >
                            <span style={label}>To</span>
                            <span
                                style={{
                                    ...serif,
                                    fontSize: 28,
                                    lineHeight: 1.25,
                                    color: "#1C1B19",
                                }}
                            >
                                {recipient}
                            </span>
                            <span
                                style={{
                                    font: `400 15px/1.5 ${SANS}`,
                                    color: muted,
                                }}
                            >
                                {recipientLine}
                            </span>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 18,
                                marginTop: "auto",
                            }}
                        >
                            <span style={label}>From</span>
                            <input
                                className="pf-field"
                                value={name}
                                placeholder="Your name"
                                aria-label="Your name"
                                autoComplete="name"
                                onChange={(e) => {
                                    setName(e.target.value)
                                    setError("")
                                }}
                                style={{
                                    ...fieldStyle,
                                    borderBottom: `1.5px solid ${errLine("name")}`,
                                }}
                            />
                            <input
                                className="pf-field"
                                value={email}
                                type="email"
                                placeholder="your@email.com"
                                aria-label="Your email"
                                autoComplete="email"
                                onChange={(e) => {
                                    setEmail(e.target.value)
                                    setError("")
                                }}
                                style={{
                                    ...fieldStyle,
                                    borderBottom: `1.5px solid ${errLine("address")}`,
                                }}
                            />
                            {error && (
                                <span
                                    role="alert"
                                    style={{
                                        marginTop: -8,
                                        font: `500 11px ${MONO}`,
                                        color: "#C23A12",
                                    }}
                                >
                                    ↳ {error}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showButton && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 20,
                        flexWrap: "wrap",
                        justifyContent: "center",
                        opacity: flying ? 0 : 1,
                        transition: "opacity 400ms",
                    }}
                >
                    <button
                        className="pf-btn"
                        onClick={send}
                        disabled={phase !== "edit"}
                        style={{
                            height: 60,
                            padding: "0 12px 0 28px",
                            borderRadius: 999,
                            border: "none",
                            background: buttonColor,
                            color: buttonText,
                            font: `500 16px ${SANS}`,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                        }}
                    >
                        {phase === "sending" ? "Sending…" : buttonLabel}
                        <span
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                background: buttonText,
                                color: buttonColor,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            ↗
                        </span>
                    </button>
                </div>
            )}
        </div>
    )
}

PostcardForm.defaultProps = {
    formspreeId: "",
    recipient: "The Studio",
    recipientLine: "hello@studio.co · Lisbon, PT",
    greeting: "Dear studio,",
    placeholder: "Write it like you’d write to a friend…",
    maxChars: 280,
    stamps: DEFAULT_STAMPS,
    paper: "#F4EFE4",
    ink: "#23324A",
    accent: "#E2471B",
    line: "#CFC5B1",
    muted: "#8C8475",
    textColor: "#F4EFE4",
    radius: 6,
    tilt: -0.6,
    animate: true,
    showPostmark: true,
    successTitle: "It’s on its way.",
    successText: "Expect a reply at {email} within a day or two.",
    buttonLabel: "Drop it in the mailbox",
    showButton: true,
    buttonColor: "#FF7A4D",
    buttonText: "#1C1B19",
}

addPropertyControls(PostcardForm, {
    formspreeId: {
        type: ControlType.String,
        title: "Formspree ID",
        placeholder: "xyzabcde",
        description:
            "From formspree.io — the code after /f/ in your form URL. Or leave empty and use the On Submit event.",
    },
    recipient: { type: ControlType.String, title: "To" },
    recipientLine: { type: ControlType.String, title: "Address" },
    greeting: { type: ControlType.String, title: "Greeting" },
    placeholder: { type: ControlType.String, title: "Placeholder" },
    maxChars: {
        type: ControlType.Number,
        title: "Max Chars",
        min: 80,
        max: 1000,
        step: 20,
        displayStepper: true,
    },
    stamps: {
        type: ControlType.Array,
        title: "Stamps",
        maxCount: 6,
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, defaultValue: "Topic" },
                glyph: { type: ControlType.String, defaultValue: "✳" },
                color: { type: ControlType.Color, defaultValue: "#2F6B4F" },
                description: {
                    type: ControlType.String,
                    defaultValue: "A short note",
                },
            },
        },
    },
    paper: { type: ControlType.Color, title: "Paper" },
    ink: { type: ControlType.Color, title: "Ink" },
    accent: { type: ControlType.Color, title: "Postmark" },
    line: { type: ControlType.Color, title: "Lines" },
    muted: { type: ControlType.Color, title: "Labels" },
    textColor: {
        type: ControlType.Color,
        title: "Outer Text",
        description:
            "Hint + success message. Match to your section background.",
    },
    handFont: {
        type: ControlType.Font,
        title: "Hand Font",
        controls: "basic",
        description: "Empty = Caveat",
    },
    serifFont: {
        type: ControlType.Font,
        title: "Serif Font",
        controls: "basic",
        description: "Empty = Libre Caslon Text",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 40,
        unit: "px",
    },
    tilt: {
        type: ControlType.Number,
        title: "Tilt",
        min: -6,
        max: 6,
        step: 0.1,
        unit: "°",
    },
    animate: { type: ControlType.Boolean, title: "Fly Away" },
    showPostmark: { type: ControlType.Boolean, title: "Postmark" },
    successTitle: { type: ControlType.String, title: "Success Title" },
    successText: {
        type: ControlType.String,
        title: "Success Text",
        displayTextArea: true,
        description: "Use {email} to insert the sender’s email.",
    },
    showButton: { type: ControlType.Boolean, title: "Button" },
    buttonLabel: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Drop it in the mailbox",
        hidden: (p) => !p.showButton,
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button Fill",
        defaultValue: "#FF7A4D",
        hidden: (p) => !p.showButton,
    },
    buttonText: {
        type: ControlType.Color,
        title: "Button Text",
        defaultValue: "#1C1B19",
        hidden: (p) => !p.showButton,
    },
    onSubmit: { type: ControlType.EventHandler },
})
