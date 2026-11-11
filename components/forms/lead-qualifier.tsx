import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const FLOWS = [
    {
        key: "whats",
        label: "WhatsApp Support",
        lines: [
            "mapping support flow...",
            "context-aware agent + human handoff",
            "integration: WhatsApp · n8n · lightweight CRM",
            "lean proposal ready in 48h",
        ],
    },
    {
        key: "site",
        label: "High-converting website",
        lines: [
            "structure: hero, proof, offer, form",
            "results-driven copy",
            "leads straight to CRM with UTM",
            "lean proposal ready in 48h",
        ],
    },
    {
        key: "ui",
        label: "Product interface",
        lines: [
            "UX audit of critical flows",
            "design system + clickable prototype",
            "clean handoff to the dev team",
            "lean proposal ready in 48h",
        ],
    },
    {
        key: "auto",
        label: "Internal automation",
        lines: [
            "repetitive processes identified",
            "Make/n8n flows with governance",
            "conversion and metrics dashboard",
            "lean proposal ready in 48h",
        ],
    },
]

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 560
 */
export default function AgenteDiagnostico(props) {
    const { accent, title, question, ctaLabel, ctaLink, typingSpeed } = props
    const [sel, setSel] = useState<number | null>(null)
    const [typed, setTyped] = useState(0)
    const [blink, setBlink] = useState(true)
    const [hoverChip, setHoverChip] = useState<number | null>(null)
    const [hoverCta, setHoverCta] = useState(false)
    const timer = useRef<any>(null)
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        if (isStatic) return
        const b = setInterval(() => setBlink((v) => !v), 550)
        return () => {
            clearInterval(b)
            clearInterval(timer.current)
        }
    }, [isStatic])

    const pick = (i: number) => {
        if (isStatic) return
        clearInterval(timer.current)
        const total = FLOWS[i].lines.join("").length
        setSel(i)
        setTyped(0)
        timer.current = setInterval(() => {
            setTyped((t) => {
                if (t >= total) {
                    clearInterval(timer.current)
                    return t
                }
                return Math.min(total, t + 2)
            })
        }, typingSpeed)
    }

    // Static canvas/export: show a finished preview, no timers or transitions
    const curSel = isStatic ? 1 : sel
    const curTyped = isStatic ? FLOWS[1].lines.join("").length : typed
    const caretOn = isStatic ? true : blink
    const tr = (v: string) => (isStatic ? "none" : v)
    const lines: { text: string; color: string }[] = []
    let showCta = false
    if (curSel !== null) {
        let left = curTyped
        const all = FLOWS[curSel].lines
        for (let i = 0; i < all.length && left > 0; i++) {
            lines.push({
                text: all[i].slice(0, left),
                color: i === all.length - 1 ? accent : "rgba(255,255,255,0.82)",
            })
            left -= all[i].length
        }
        showCta = curTyped >= all.join("").length
    }

    // Font is loaded by Framer via the Font property control (no global DOM injection)
    const mono =
        props.font?.fontFamily || "'Chakra Petch', ui-monospace, monospace"
    const body = props.bodyFont?.fontFamily || "inherit"

    return (
        <div
            style={{
                ...props.style,
                width: "100%",
                borderRadius: 6,
                border: `1px solid ${hexA(accent, 0.16)}`,
                background: "rgba(8,9,8,0.62)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                boxShadow:
                    "0 24px 60px -20px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.02)",
                color: "#fff",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "12px 18px",
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: accent,
                            boxShadow: `0 0 10px ${accent}`,
                            opacity: caretOn ? 1 : 0.2,
                            transition: tr("opacity .2s"),
                        }}
                    />
                    <span
                        style={{
                            fontFamily: mono,
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "0.22em",
                            color: accent,
                        }}
                    >
                        {title}
                    </span>
                </div>
                <span
                    style={{
                        fontFamily: mono,
                        fontSize: 10,
                        letterSpacing: "0.2em",
                        color: "rgba(255,255,255,0.45)",
                    }}
                >
                    FREE DIAGNOSIS
                </span>
            </div>
            <div style={{ padding: "16px 18px 18px" }}>
                <p
                    style={{
                        margin: "0 0 12px",
                        fontSize: 17,
                        fontWeight: 600,
                        color: "#fff",
                        fontFamily: body,
                    }}
                >
                    {question}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {FLOWS.map((f, i) => {
                        const on = curSel === i
                        const hv = hoverChip === i
                        return (
                            <button
                                key={f.key}
                                onClick={() => pick(i)}
                                onMouseEnter={() => setHoverChip(i)}
                                onMouseLeave={() => setHoverChip(null)}
                                style={{
                                    height: 34,
                                    padding: "0 14px",
                                    borderRadius: 3,
                                    border: `1px solid ${on ? accent : hv ? hexA(accent, 0.6) : "rgba(255,255,255,0.14)"}`,
                                    background: on ? accent : "transparent",
                                    color: on
                                        ? "#000"
                                        : hv
                                          ? accent
                                          : "rgba(255,255,255,0.78)",
                                    fontFamily: mono,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.14em",
                                    cursor: "pointer",
                                    transition: tr(
                                        "border-color .2s, background .2s, color .2s"
                                    ),
                                }}
                            >
                                {f.label}
                            </button>
                        )
                    })}
                </div>
                <div
                    style={{
                        marginTop: 14,
                        minHeight: 92,
                        padding: "12px 14px",
                        borderRadius: 4,
                        background: "rgba(0,0,0,0.5)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        fontFamily: mono,
                        fontSize: 13,
                        lineHeight: 1.7,
                        letterSpacing: "0.02em",
                    }}
                >
                    {curSel === null && (
                        <div style={{ color: "rgba(255,255,255,0.4)" }}>
                            &gt; awaiting selection
                            <span
                                style={{
                                    color: accent,
                                    opacity: caretOn ? 1 : 0,
                                }}
                            >
                                _
                            </span>
                        </div>
                    )}
                    {lines.map((l, i) => (
                        <div key={i} style={{ color: l.color }}>
                            <span style={{ color: accent }}>&gt;</span> {l.text}
                        </div>
                    ))}
                </div>
                {showCta && (
                    <a
                        href={ctaLink}
                        onMouseEnter={() => setHoverCta(true)}
                        onMouseLeave={() => setHoverCta(false)}
                        style={{
                            marginTop: 14,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            height: 44,
                            padding: "0 16px",
                            borderRadius: 4,
                            border: `1px solid ${hexA(accent, 0.45)}`,
                            background: hoverCta ? accent : "transparent",
                            color: hoverCta ? "#000" : accent,
                            fontFamily: mono,
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: "0.16em",
                            textDecoration: "none",
                            transition: tr("background .25s, color .25s"),
                        }}
                    >
                        {ctaLabel}
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                        </svg>
                    </a>
                )}
            </div>
        </div>
    )
}

function hexA(hex: string, a: number) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || "")
    if (!m) return hex
    const n = parseInt(m[1], 16)
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

AgenteDiagnostico.defaultProps = {
    accent: "#E6FF00",
    title: "ARKANA AGENT",
    question: "What do you want to solve first?",
    ctaLabel: "GET A PROPOSAL IN 48H",
    ctaLink: "#contact",
    typingSpeed: 22,
}

addPropertyControls(AgenteDiagnostico, {
    accent: { type: ControlType.Color, title: "Accent" },
    title: { type: ControlType.String, title: "Title" },
    question: { type: ControlType.String, title: "Question" },
    ctaLabel: { type: ControlType.String, title: "CTA" },
    ctaLink: { type: ControlType.Link, title: "CTA Link" },
    font: {
        type: ControlType.Font,
        title: "UI Font",
        controls: "basic",
        defaultFontType: "monospace",
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Question Font",
        controls: "basic",
        defaultFontType: "sans-serif",
    },
    typingSpeed: {
        type: ControlType.Number,
        title: "Typing (ms)",
        min: 8,
        max: 80,
        step: 1,
    },
})
