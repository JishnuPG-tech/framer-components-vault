/**
 * FAQ Accordion
 * Creator: Frankie, framer-expert.com
 *
 * Install:
 * 1. In Framer, go to Assets > Code > New Component and paste this file.
 * 2. Drop the component on the canvas. Edit questions, answers and colors in the property panel.
 * 3. Fonts: pick any font in the Font control. It uses your project's default font until you do.
 *
 * Numbered FAQ rows as flat colour bands in one rounded block. The arrow turns down and the answer
 * opens with a smooth height animation.
 * With "SEO Schema" on it also outputs FAQPage JSON-LD built from the same items, so search engines
 * can read your questions. Use it once per page. Motion is CSS only, off in the static render and for reduced motion.
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


type Item = {
    question: string
    answer: string
}

interface FaqAccordionProps {
    items: Item[]
    allowMultiple: boolean
    firstOpen: boolean
    showNumbers: boolean
    seoSchema: boolean
    duration: number
    radius: number
    colors: string[]
    ink: string
    surface: string
    background: string
    font?: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_ITEMS: Item[] = [
    {
        question: "Is there a free trial?",
        answer: "Yes. Every plan starts with a 14-day free trial, no credit card needed. You can upgrade, downgrade or cancel at any time.",
    },
    {
        question: "Can my team use one account?",
        answer: "Yes. Invite as many teammates as your plan allows and give each of them their own role and permissions.",
    },
    {
        question: "Can I cancel my subscription anytime?",
        answer: "You can cancel from your account settings in two clicks. Your plan stays active until the end of the billing period.",
    },
    {
        question: "Is my data secure?",
        answer: "All data is encrypted in transit and at rest, backed up daily and stored in data centers in the EU and US.",
    },
    {
        question: "How do I get support?",
        answer: "Send us a message from the help center. Every plan includes email support, and Pro and Team plans get priority replies.",
    },
]

const PALETTE = ["#FFD35C", "#C8B8B2", "#F9C2F2", "#86A3E0", "#55683F"]
const PAD_Y = "clamp(18px, 3.2cqi, 26px)"
const PAD_X = "clamp(18px, 3.6cqi, 28px)"

function initialOpen(firstOpen: boolean): number[] {
    if (firstOpen) return [0]
    return []
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 522
 */
export default function FaqAccordion(props: FaqAccordionProps) {
    const {
        items: rawItems = DEFAULT_ITEMS,
        allowMultiple = false,
        firstOpen = true,
        showNumbers = false,
        seoSchema = true,
        duration = 0.45,
        radius = 24,
        colors: rawColors = PALETTE,
        ink = "#0E0E0E",
        surface = "#F4F4F2",
        background = "rgba(0, 0, 0, 0)",
        font,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const animate = !isStatic
    const items = rawItems.length ? rawItems : DEFAULT_ITEMS
    const palette = rawColors && rawColors.length ? rawColors : PALETTE
    const [open, setOpen] = React.useState<number[]>(() => initialOpen(firstOpen))
    React.useEffect(() => setOpen(initialOpen(firstOpen)), [firstOpen])
    const baseId = React.useId()

    const toggle = (i: number) => {
        setOpen((prev) => {
            if (prev.includes(i)) return prev.filter((x) => x !== i)
            if (allowMultiple) return [...prev, i]
            return [i]
        })
    }

    const schema = React.useMemo(() => {
        const data = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: items
                .filter((item) => item.question && item.answer)
                .map((item) => ({
                    "@type": "Question",
                    name: item.question,
                    acceptedAnswer: { "@type": "Answer", text: item.answer },
                })),
        }
        // Escape "<" so an answer can never close the script tag.
        return JSON.stringify(data).replace(/</g, "\\u003c")
    }, [items])

    const ease = "cubic-bezier(0.22, 1, 0.36, 1)"

    return (
        <div
            style={{
                ...style,
                ...font,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: radius,
                overflow: "hidden",
                background,
                color: ink,
                boxSizing: "border-box",
            }}
            className="faq-root"
        >
            <style>{`
                .faq-root { container-type: inline-size; }
                .faq-q:focus-visible { outline: 2px solid ${ink}; outline-offset: -5px; }
                .faq-q:hover .faq-icon svg { translate: 3px 0; }
                @media (prefers-reduced-motion: reduce) {
                    .faq-anim { transition: none !important; }
                }
            `}</style>
            {seoSchema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} /> : null}

            {items.map((item, i) => {
                const isOpen = open.includes(i)
                const qId = `${baseId}-q${i}`
                const aId = `${baseId}-a${i}`
                return (
                    <div
                        key={i}
                        className="faq-anim"
                        style={{ background: palette[i % palette.length], color: ink }}
                    >
                        <h3 style={{ margin: 0, font: "inherit" }}>
                            <button
                                type="button"
                                id={qId}
                                className="faq-q"
                                aria-expanded={isOpen}
                                aria-controls={aId}
                                onClick={() => toggle(i)}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 16,
                                    padding: `${PAD_Y} ${PAD_X}`,
                                    border: "none",
                                    background: "transparent",
                                    color: ink,
                                    font: "inherit",
                                    fontSize: "clamp(20px, 4.4cqi, 34px)",
                                    fontWeight: 700,
                                    letterSpacing: "-0.035em",
                                    lineHeight: 1.08,
                                    textAlign: "left",
                                    cursor: "pointer",
                                }}
                            >
                                {showNumbers ? (
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            width: 32, // keeps the question column where it was
                                            flexShrink: 0,
                                            color: ink,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: 14,
                                            fontWeight: 700,
                                            letterSpacing: 0,
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {i + 1}
                                    </span>
                                ) : null}
                                <span style={{ flex: 1, minWidth: 0 }}>{item.question}</span>
                                <span
                                    className="faq-icon faq-anim"
                                    aria-hidden="true"
                                    style={{
                                        width: 44,
                                        height: 44,
                                        flexShrink: 0,
                                        borderRadius: 999,
                                        background: ink,
                                        color: surface,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                                        transition: animate ? `transform ${duration}s ${ease}` : "none",
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="faq-anim" style={{ transition: animate ? `translate 0.25s ${ease}` : "none" }}>
                                        <path d="M4 12h15M13 5.5l6.5 6.5-6.5 6.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                            </button>
                        </h3>
                        <div
                            id={aId}
                            role="region"
                            aria-labelledby={qId}
                            className="faq-anim"
                            style={{
                                display: "grid",
                                gridTemplateRows: isOpen ? "1fr" : "0fr",
                                // Hidden after it collapses, so closed answers are not tabbable or read out.
                                visibility: isOpen ? "visible" : "hidden",
                                transition: animate
                                    ? `grid-template-rows ${duration}s ${ease}, visibility 0s linear ${isOpen ? 0 : duration}s`
                                    : "none",
                            }}
                        >
                            <div style={{ overflow: "hidden", minHeight: 0 }}>
                                <p
                                    style={{
                                        margin: 0,
                                        padding: showNumbers
                                            ? `0 ${PAD_X} ${PAD_Y} calc(${PAD_X} + 48px)`
                                            : `0 ${PAD_X} ${PAD_Y} ${PAD_X}`,
                                        maxWidth: "62ch",
                                        fontSize: 16,
                                        fontWeight: 500,
                                        lineHeight: 1.5,
                                        opacity: 0.75,
                                        whiteSpace: "pre-line",
                                    }}
                                >
                                    {item.answer}
                                </p>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

addPropertyControls(FaqAccordion, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                question: { type: ControlType.String, title: "Question", defaultValue: "Question" },
                answer: { type: ControlType.String, title: "Answer", displayTextArea: true, defaultValue: "" },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    allowMultiple: { type: ControlType.Boolean, title: "Multiple Open", defaultValue: false, description: "Off closes the open row when another one opens." },
    firstOpen: { type: ControlType.Boolean, title: "First Open", defaultValue: true },
    showNumbers: { type: ControlType.Boolean, title: "Numbers", defaultValue: false },
    seoSchema: {
        type: ControlType.Boolean,
        title: "SEO Schema",
        defaultValue: true,
        description: "Adds FAQPage JSON-LD from the items. Keep it on for one FAQ per page only.",
    },
    duration: { type: ControlType.Number, title: "Duration", defaultValue: 0.45, min: 0.1, max: 2, step: 0.05, unit: "s", displayStepper: true },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 24, min: 0, max: 40, step: 1, displayStepper: true, unit: "px" },
    colors: {
        type: ControlType.Array,
        title: "Band Colors",
        control: { type: ControlType.Color },
        defaultValue: PALETTE,
        description: "One per row in order, then repeated.",
    },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: "#0E0E0E", description: "Text, arrow button and focus ring." },
    surface: { type: ControlType.Color, title: "Surface", defaultValue: "#F4F4F2", description: "Arrow colour." },
    background: { type: ControlType.Color, title: "Background", defaultValue: "rgba(0, 0, 0, 0)" },
    font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif" },
})
