/**
 * Waitlist Morph
 *
 * Install:
 * 1. In Framer, go to Assets > Code > New Component and paste this file.
 * 2. Drop the component on the canvas. Edit the texts and colors in the property panel.
 * 3. Fonts: pick any font in the Font control. It uses your project's default font until you do.
 *
 * An email pill for waitlists. On submit it checks the address, shows a pending state, then the
 * button grows over the whole pill in a colour band and shows a big counting "#1,284" with a small label.
 * The component never sends data anywhere. Handle the email in your own project: use the "On Submit"
 * interaction, or listen for the "waitlistmorph:submit" DOM event (event.detail.email) in a code override.
 * Motion is off in the static render and for reduced motion.
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


interface WaitlistMorphProps {
    placeholder: string
    buttonLabel: string
    successPrefix: string
    successLabel: string
    startCount: number
    invalidText: string
    onSubmit?: () => void
    countDuration: number
    radius: number
    background: string
    border: string
    ink: string
    surface: string
    successColor: string
    errorColor: string
    arrowColor: string
    focusColor: string
    showStripe: boolean
    stripeColors: string[]
    font?: React.CSSProperties
    style?: React.CSSProperties
}

const PALETTE = ["#FFD35C", "#F9C2F2", "#86A3E0", "#C8B8B2", "#55683F"]

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PAD = 6

function prefersReducedMotion(): boolean {
    if (typeof window === "undefined") return false
    if (!window.matchMedia) return false
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function formatCount(n: number): string {
    return Math.round(n).toLocaleString("en-US")
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 460
 */
export default function WaitlistMorph(props: WaitlistMorphProps) {
    const {
        placeholder = "you@company.com",
        buttonLabel = "Join waitlist",
        successPrefix = "#",
        successLabel = "You're on\nthe list",
        startCount = 1283,
        invalidText = "Please enter a valid email address.",
        onSubmit: onSubmitEvent,
        countDuration = 1.4,
        radius = 999,
        background = "#F4F4F2",
        border = "rgba(14, 14, 14, 0.12)",
        ink = "#0E0E0E",
        surface = "#F4F4F2",
        successColor = "#FFD35C",
        errorColor = "#0E0E0E",
        arrowColor = "#FFD35C",
        focusColor = "#86A3E0",
        showStripe = false,
        stripeColors = PALETTE,
        font,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const animate = !isStatic
    const [email, setEmail] = React.useState("")
    const [phase, setPhase] = React.useState<"idle" | "pending" | "success">("idle")
    const [error, setError] = React.useState("")
    const [grown, setGrown] = React.useState(false)
    const [buttonWidth, setButtonWidth] = React.useState(0)
    const [shown, setShown] = React.useState(0)
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    const rootRef = React.useRef<HTMLDivElement>(null)
    const alive = React.useRef(true)
    const errorId = React.useId()

    const finalCount = Math.max(0, Math.round(startCount)) + 1
    const innerRadius = Math.max(0, radius - PAD)

    React.useEffect(() => {
        alive.current = true
        return () => {
            alive.current = false
        }
    }, [])

    // Grow the button over the pill one frame after the overlay mounts at the button's size.
    React.useEffect(() => {
        if (phase !== "success") return
        if (!animate || prefersReducedMotion()) {
            setGrown(true)
            return
        }
        let raf2 = 0
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => setGrown(true))
        })
        return () => {
            cancelAnimationFrame(raf1)
            cancelAnimationFrame(raf2)
        }
    }, [phase, animate])

    // Count up to the final number once the pill has filled.
    React.useEffect(() => {
        if (!grown) return
        if (!animate || prefersReducedMotion()) {
            setShown(finalCount)
            return
        }
        let raf = 0
        let start = 0
        const total = Math.max(0.1, countDuration) * 1000
        const delay = 350
        const tick = (now: number) => {
            if (!start) start = now
            const t = Math.min(1, Math.max(0, (now - start - delay) / total))
            const eased = 1 - Math.pow(1 - t, 4)
            setShown(finalCount * eased)
            if (t < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [grown, finalCount, countDuration, animate])

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (phase !== "idle") return
        const value = email.trim()
        if (!EMAIL.test(value)) {
            setError(invalidText)
            return
        }
        setError("")
        setPhase("pending")
        // Hand the email to the host page only; this component makes no network requests.
        rootRef.current?.dispatchEvent(new CustomEvent("waitlistmorph:submit", { bubbles: true, detail: { email: value } }))
        if (onSubmitEvent) onSubmitEvent()
        // Short pause so the pending state is visible before the morph.
        await new Promise((r) => setTimeout(r, 700))
        if (!alive.current) return
        if (buttonRef.current) setButtonWidth(buttonRef.current.offsetWidth)
        setPhase("success")
    }

    const ease = "cubic-bezier(0.22, 1, 0.36, 1)"
    const pending = phase === "pending"
    const success = phase === "success"

    return (
        <div
            ref={rootRef}
            className="wm-root"
            style={{
                ...style,
                ...font,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                color: ink,
                boxSizing: "border-box",
            }}
        >
            <style>{`
                /* The pill shows the focus ring for its input, so the input's own outline is replaced, not removed. */
                .wm-input { outline: none; }
                .wm-root { container-type: inline-size; }
                /* Narrow pills keep only the arrow so the email field stays readable. */
                @container (max-width: 380px) { .wm-label { display: none; } .wm-btn { padding-left: 6px !important; } }
                /* Periwinkle ring inside the pill plus an ink ring outside, so focus shows on any page colour. */
                .wm-pill:has(.wm-input:focus-visible) { box-shadow: inset 0 0 0 2px ${focusColor}; outline: 2px solid ${ink}; outline-offset: 3px; }
                .wm-btn:focus-visible { outline: 2px solid ${ink}; outline-offset: 3px; }
                .wm-input::placeholder { color: ${ink}; opacity: 0.45; }
                /* Browser autofill paints a square tinted box; repaint it in the pill colour so no corners show. */
                .wm-input:-webkit-autofill, .wm-input:-webkit-autofill:hover, .wm-input:-webkit-autofill:focus, .wm-input:-webkit-autofill:disabled { -webkit-box-shadow: 0 0 0 1000px ${background} inset; box-shadow: 0 0 0 1000px ${background} inset; -webkit-text-fill-color: ${ink}; caret-color: ${ink}; }
                .wm-input:autofill { background: ${background}; }
                .wm-btn:not(:disabled):hover .wm-arrow { transform: translateX(3px); }
                @keyframes wm-spin { to { transform: rotate(360deg); } }
                @media (prefers-reduced-motion: reduce) {
                    .wm-anim, .wm-arrow { transition: none !important; animation: none !important; }
                }
            `}</style>

            <form
                className="wm-pill"
                noValidate
                onSubmit={onSubmit}
                aria-busy={pending}
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: PAD,
                    borderRadius: radius,
                    background,
                    border: `1px solid ${error ? errorColor : border}`,
                    boxSizing: "border-box",
                    // Keeps every child (autofill tint, success fill) inside the rounded pill.
                    overflow: "hidden",
                    transition: animate ? "border-color 0.2s ease" : "none",
                }}
            >
                <input
                    className="wm-input"
                    type="email"
                    name="email"
                    autoComplete="email"
                    inputMode="email"
                    aria-label="Email address"
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    placeholder={placeholder}
                    value={email}
                    disabled={success}
                    onChange={(e) => {
                        setEmail(e.target.value)
                        if (error) setError("")
                    }}
                    style={{
                        flex: 1,
                        minWidth: 0,
                        height: 52,
                        padding: "0 8px 0 18px",
                        border: "none",
                        borderRadius: innerRadius,
                        background: "transparent",
                        color: ink,
                        font: "inherit",
                        fontSize: 16,
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                    }}
                />
                <button
                    ref={buttonRef}
                    type="submit"
                    className="wm-btn wm-anim"
                    aria-label={buttonLabel}
                    disabled={pending || success}
                    style={{
                        position: "relative",
                        flexShrink: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 12,
                        height: 52,
                        padding: "0 6px 0 22px",
                        border: "none",
                        borderRadius: innerRadius,
                        background: ink,
                        color: surface,
                        font: "inherit",
                        fontSize: 15,
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
                        whiteSpace: "nowrap",
                        cursor: pending ? "progress" : "pointer",
                        // The success fill sits on this exact shape; hiding it avoids an anti-aliased fringe around the curve.
                        visibility: success ? "hidden" : "visible",
                    }}
                >
                    <span className="wm-label" style={{ visibility: pending ? "hidden" : "visible" }}>{buttonLabel}</span>
                    <span
                        className="wm-arrow"
                        aria-hidden="true"
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 999,
                            background: arrowColor,
                            color: ink,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            visibility: pending ? "hidden" : "visible",
                            transition: animate ? `transform 0.3s ${ease}` : "none",
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M4 12h15M13 5.5l6.5 6.5-6.5 6.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                    {pending ? (
                        <span
                            aria-hidden="true"
                            style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                            <svg
                                className="wm-anim"
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                style={{ animation: animate ? "wm-spin 0.8s linear infinite" : "none" }}
                            >
                                <circle cx="9" cy="9" r="7" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
                                <path d="M16 9a7 7 0 0 0-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </span>
                    ) : null}
                    {pending ? <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Sending</span> : null}
                </button>

                {success ? (
                    <div
                        className="wm-anim"
                        style={{
                            position: "absolute",
                            top: PAD,
                            bottom: PAD,
                            right: PAD,
                            left: grown ? PAD : `calc(100% - ${PAD + buttonWidth}px)`,
                            borderRadius: innerRadius,
                            background: successColor,
                            color: ink,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0 18px",
                            overflow: "hidden",
                            transition: animate ? `left 0.6s ${ease}` : "none",
                        }}
                    >
                        <span
                            className="wm-anim"
                            aria-hidden="true"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 14,
                                whiteSpace: "nowrap",
                                opacity: grown ? 1 : 0,
                                transform: grown ? "translateY(0)" : "translateY(8px)",
                                transition: animate ? `opacity 0.35s ${ease} 0.3s, transform 0.45s ${ease} 0.3s` : "none",
                            }}
                        >
                            <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                                {successPrefix}
                                {formatCount(shown)}
                            </span>
                            {successLabel ? (
                                <span
                                    style={{
                                        paddingLeft: 14,
                                        borderLeft: "1px solid rgba(14, 14, 14, 0.25)",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        lineHeight: 1.25,
                                        whiteSpace: "pre-line",
                                    }}
                                >
                                    {successLabel}
                                </span>
                            ) : null}
                        </span>
                    </div>
                ) : null}
            </form>

            {showStripe && stripeColors.length ? (
                <div aria-hidden="true" style={{ display: "flex", gap: 4, height: 4, padding: `0 ${radius >= 26 ? 26 : radius}px` }}>
                    {stripeColors.map((c, i) => (
                        <span key={i} style={{ flex: 1, borderRadius: 999, background: c }} />
                    ))}
                </div>
            ) : null}

            <div role="status" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                {success ? `${successPrefix}${formatCount(finalCount)} ${successLabel.replace(/\n/g, " ")}` : ""}
            </div>
            <p
                id={errorId}
                role="alert"
                style={{
                    margin: 0,
                    minHeight: "1.4em",
                    padding: "0 18px",
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: 1.4,
                    color: errorColor,
                }}
            >
                {error ? `⚠ ${error}` : null}
            </p>
        </div>
    )
}

addPropertyControls(WaitlistMorph, {
    placeholder: { type: ControlType.String, title: "Placeholder", defaultValue: "you@company.com" },
    buttonLabel: { type: ControlType.String, title: "Button", defaultValue: "Join waitlist" },
    successPrefix: { type: ControlType.String, title: "Number Prefix", defaultValue: "#" },
    successLabel: {
        type: ControlType.String,
        title: "Success Label",
        defaultValue: "You're on\nthe list",
        displayTextArea: true,
        description: "Small label next to the counting number. Line breaks are kept.",
    },
    startCount: {
        type: ControlType.Number,
        title: "Start Count",
        defaultValue: 1283,
        min: 0,
        step: 1,
        displayStepper: true,
        description: "People already on the list. The visitor sees this number + 1.",
    },
    invalidText: { type: ControlType.String, title: "Invalid Text", defaultValue: "Please enter a valid email address." },
    onSubmit: { type: ControlType.EventHandler, title: "On Submit" },
    countDuration: { type: ControlType.Number, title: "Count Time", defaultValue: 1.4, min: 0.2, max: 5, step: 0.1, unit: "s" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 999, min: 0, max: 999, description: "999 = full pill." },
    background: { type: ControlType.Color, title: "Pill", defaultValue: "#F4F4F2" },
    border: { type: ControlType.Color, title: "Border", defaultValue: "rgba(14, 14, 14, 0.12)" },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: "#0E0E0E", description: "Text, button and focus ring." },
    surface: { type: ControlType.Color, title: "Surface", defaultValue: "#F4F4F2", description: "Button label and arrow circle." },
    successColor: { type: ControlType.Color, title: "Success Fill", defaultValue: "#FFD35C" },
    errorColor: { type: ControlType.Color, title: "Error", defaultValue: "#0E0E0E", description: "Error text and pill border. Ink reads on any coloured block." },
    arrowColor: { type: ControlType.Color, title: "Arrow Circle", defaultValue: "#FFD35C" },
    focusColor: { type: ControlType.Color, title: "Focus", defaultValue: "#86A3E0", description: "Inner ring while the email field has keyboard focus." },
    showStripe: { type: ControlType.Boolean, title: "Stripe", defaultValue: false, description: "Thin palette stripe under the pill." },
    stripeColors: {
        type: ControlType.Array,
        title: "Stripe Colors",
        control: { type: ControlType.Color },
        defaultValue: PALETTE,
        hidden: (p: WaitlistMorphProps) => !p.showStripe,
    },
    font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif" },
})
