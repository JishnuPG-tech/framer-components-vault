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

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

type FAQItem = {
    question: string
    answer: string
    color: string
    shapeColor: string
    shape: "flower" | "blob" | "rings" | "stripes"
    cta: string
    link: string
}

type Props = {
    items: FAQItem[]
    defaultOpen: number
    gap: number
    stagger: number
    radius: number
    padding: number
    speed: number
    hoverShift: number
    background: string
    textColor: string
    bodyColor: string
    questionFont?: React.CSSProperties
    answerFont?: React.CSSProperties
    ctaFont?: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_ITEMS: FAQItem[] = [
    {
        question: "Can I really build it my way?",
        answer: "Absolutely. Start with a blank canvas or a ready-made layout, then customize every detail until it feels like yours.",
        color: "#E9FA66",
        shapeColor: "#FF7E55",
        shape: "flower",
        cta: "Discover Framer",
        link: "",
    },
    {
        question: "Do I need to know how to code?",
        answer: "Not at all. Build responsive pages visually, add interactions and publish when you're ready.",
        color: "#B7B8FF",
        shapeColor: "#6948EA",
        shape: "rings",
        cta: "Discover Framer",
        link: "",
    },
    {
        question: "Will it look good on every screen?",
        answer: "Design for desktop, tablet and mobile. Give each breakpoint the attention it deserves.",
        color: "#FFA5D3",
        shapeColor: "#E8468C",
        shape: "blob",
        cta: "Discover Framer",
        link: "",
    },
    {
        question: "Can I add playful interactions?",
        answer: "Of course. Add motion, hover effects and animated components to make the little moments memorable.",
        color: "#A7E8DB",
        shapeColor: "#3492DC",
        shape: "stripes",
        cta: "Discover Framer",
        link: "",
    },
]

const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v))

function Arrow() {
    return (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3.5 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.7"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function ShapeArt({
    shape,
    color,
    active,
    hovered,
    reduced,
    speed,
}: {
    shape: FAQItem["shape"]
    color: string
    active: boolean
    hovered: boolean
    reduced: boolean
    speed: number
}) {
    const spring = reduced
        ? { duration: 0 }
        : { type: "spring" as const, stiffness: 190 / speed, damping: 17 / Math.sqrt(speed), mass: 0.9 }
    return (
        <motion.div
            aria-hidden="true"
            initial={false}
            animate={{
                rotate: active ? 23 : hovered ? -12 : 0,
                scale: active ? 1.20 : hovered ? 1.10 : 1,
                x: active ? 7 : hovered ? 3 : 0,
                borderRadius: active
                    ? "42% 58% 31% 69% / 58% 41% 59% 42%"
                    : "58% 42% 52% 48% / 42% 58% 38% 62%",
            }}
            transition={spring}
            style={{
                position: "absolute",
                width: 118,
                height: 118,
                right: 9,
                top: -11,
                background: color,
                display: "grid",
                placeItems: "center",
                overflow: "hidden",
                pointerEvents: "none",
                willChange: reduced ? "auto" : "transform",
            }}
        >
            {shape === "flower" && (
                <svg width="96" height="96" viewBox="0 0 100 100" fill="none">
                    <path d="M50 15c8-18 20-8 20 6 16-12 26 1 15 16 20 2 21 18 4 25 12 16 2 27-16 20-6 19-23 20-30 2-17 13-29 0-22-17-20-6-21-22-3-28C8 22 21 11 37 24c2-4 7-7 13-9Z" fill="#FBEF6B" />
                    
                </svg>
            )}
            {shape === "rings" && (
                <svg width="95" height="95" viewBox="0 0 100 100" fill="none">
                    <circle cx="43" cy="52" r="32" stroke="#C9FF89" strokeWidth="10"/>
                    <circle cx="59" cy="43" r="27" stroke="#FEA6CE" strokeWidth="12"/>
                    
                </svg>
            )}
            {shape === "blob" && (
                <svg width="104" height="104" viewBox="0 0 110 110" fill="none">
                    <path d="M54 10c17-8 29 2 27 16 20 4 23 20 13 34 7 23-6 34-23 32-11 15-31 15-42 1C7 92 3 75 15 59 1 42 15 25 33 28c4-10 12-15 21-18Z" fill="#F7FF91"/>
                    
                </svg>
            )}
            {shape === "stripes" && (
                <svg width="102" height="102" viewBox="0 0 110 110" fill="none">
                    <circle cx="55" cy="55" r="43" fill="#FFF0A2"/>
                    <path d="M24 77 76 25M37 88 88 37M15 56 56 15M57 96 96 57" stroke="#1D1D1D" strokeWidth="8" strokeLinecap="round"/>
                </svg>
            )}
        </motion.div>
    )
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 880
 * @framerIntrinsicHeight 440
 */
export default function BlobFAQAccordion(props: Props) {
    const {
        items = DEFAULT_ITEMS,
        defaultOpen = 0,
        gap = 11,
        stagger = 24,
        radius = 34,
        padding = 26,
        speed = 1,
        hoverShift = 5,
        background = "#FAFAF7",
        textColor = "#171717",
        bodyColor = "#292929",
        questionFont,
        answerFont,
        ctaFont,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const reduced = isStatic || Boolean(reducedMotion)
    const safeItems = Array.isArray(items) && items.length ? items : DEFAULT_ITEMS
    const safeSpeed = clamp(speed, 0.4, 2.2)
    const [open, setOpen] = React.useState(() => clamp(defaultOpen, -1, safeItems.length - 1))
    const [hovered, setHovered] = React.useState(-1)
    const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    React.useEffect(() => {
        setOpen(clamp(defaultOpen, -1, safeItems.length - 1))
    }, [defaultOpen, safeItems.length])

    const transition = reduced
        ? { duration: 0 }
        : { type: "spring" as const, stiffness: 220 / safeSpeed, damping: 25 / Math.sqrt(safeSpeed), mass: 0.95 }

    const selector = '[data-blob-faq="' + uid + '"]'
    const staggerValue = Math.max(0, stagger)

    return (
        <div
            data-blob-faq={uid}
            style={{
                width: "100%",
                height: "auto",
                minWidth: 0,
                boxSizing: "border-box",
                ...({ containerType: "inline-size" } as any),
                background,
                padding: Math.max(0, padding),
                fontFamily: "Inter, Arial, sans-serif",
                color: textColor,
                ...style,
            }}
        >
            <style>{[
                selector + " * {box-sizing:border-box;}",
                selector + " .bf-list {display:flex;flex-direction:column;}",
                selector + " .bf-row {position:relative;isolation:isolate;overflow:hidden;}",
                selector + " .bf-row:nth-child(2n) {margin-left:" + staggerValue + "px;width:calc(100% - " + staggerValue + "px);}",
                selector + " .bf-head {appearance:none;border:0;background:transparent;width:100%;display:flex;align-items:center;text-align:left;color:inherit;cursor:pointer;position:relative;z-index:2;}",
                selector + " .bf-head:focus-visible {outline:3px solid #171717;outline-offset:-5px;border-radius:" + Math.max(16,radius) + "px;}",
                selector + " .bf-answer-link {display:block;color:inherit;text-decoration:none;outline:none;border-radius:0 0 26px 26px;}",
                selector + " .bf-answer-link:focus-visible {outline:3px solid #171717;outline-offset:-5px;}",
                selector + " .bf-cta {display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:700;letter-spacing:-.01em;padding:10px 15px;border-radius:40px;background:#191919;color:#FFFFFF;transition:transform .25s ease;}",
                selector + " .bf-answer-link:hover .bf-cta {transform:translateX(4px);}",
                "@container (max-width: 540px) {",
                selector + " .bf-row:nth-child(2n) {margin-left:0;width:100%;}",
                selector + " .bf-head {padding:20px 18px !important;min-height:81px !important;}",
                selector + " .bf-question {font-size:clamp(17px,5cqw,23px) !important;padding-right:75px !important;}",
                selector + " .bf-artwork {right:5px !important;transform-origin:center right;}",
                selector + " .bf-artwork > div {width:86px !important;height:86px !important;right:4px !important;top:0 !important;}",
                selector + " .bf-answer {padding:0 20px 22px !important;}",
                selector + " .bf-index {font-size:10px !important;margin-right:12px !important;}",
                "}",
                "@container (max-width: 350px) {",
                selector + " .bf-head {padding:17px 14px !important;}",
                selector + " .bf-question {padding-right:22px !important;font-size:17px !important;}",
                selector + " .bf-index {margin-right:7px !important;}",
                selector + " .bf-artwork > div {width:62px !important;height:62px !important;right:0px !important;top:4px !important;}",
                selector + " .bf-head > span:last-child {width:27px !important;height:27px !important;}",
                "}",
                "@media (prefers-reduced-motion: reduce) {",
                selector + " .bf-cta {transition:none !important;}",
                selector + " .bf-answer-link:hover .bf-cta {transform:none !important;}",
                "}",
            ].join("\n")}</style>
            <div className="bf-list" style={{ gap: Math.max(0, gap) }}>
                {safeItems.map((item, index) => {
                    const active = index === open
                    const over = index === hovered
                    const answerId = uid + "-answer-" + index
                    const titleId = uid + "-question-" + index
                    const link = typeof item.link === "string" ? item.link.trim() : ""
                    const hasLink = Boolean(link)
                    return (
                        <motion.article
                            key={index}
                            className="bf-row"
                            layout
                            initial={false}
                            animate={{ x: over && !active ? hoverShift : 0 }}
                            transition={transition}
                            onHoverStart={reduced ? undefined : () => setHovered(index)}
                            onHoverEnd={reduced ? undefined : () => setHovered(-1)}
                            style={{
                                background: item.color || "#E9FA66",
                                borderRadius: Math.max(20, radius),
                                boxShadow: active
                                    ? "0 8px 20px rgba(0,0,0,0.055)"
                                    : "0 2px 4px rgba(0,0,0,0.018)",
                            }}
                        >
                            <div className="bf-artwork" style={{
                                position: "absolute",
                                right: 6,
                                top: 0,
                                pointerEvents: "none",
                                zIndex: 0,
                            }}>
                                <ShapeArt
                                    shape={item.shape || "blob"}
                                    color={item.shapeColor || "#FF7E55"}
                                    active={active}
                                    hovered={over}
                                    reduced={reduced}
                                    speed={safeSpeed}
                                />
                            </div>
                            <button
                                className="bf-head"
                                type="button"
                                id={titleId}
                                aria-expanded={active}
                                aria-controls={answerId}
                                onClick={() => setOpen(active ? -1 : index)}
                                style={{
                                    minHeight: 86,
                                    padding: "20px 28px",
                                    gap: 0,
                                    position: "relative",
                                }}
                            >
                                <span className="bf-index" style={{
                                    alignSelf: "flex-start",
                                    marginTop: 7,
                                    marginRight: 20,
                                    opacity: 0.65,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    fontVariantNumeric: "tabular-nums",
                                }}>{String(index + 1).padStart(2, "0")}</span>
                                <span className="bf-question" style={{
                                    position: "relative",
                                    display: "block",
                                    maxWidth: 610,
                                    flex: 1,
                                    paddingRight: 92,
                                    fontSize: 26,
                                    fontWeight: 650,
                                    lineHeight: 1.14,
                                    letterSpacing: "-0.052em",
                                    ...questionFont,
                                }}>{item.question}</span>
                                <motion.span
                                    aria-hidden="true"
                                    initial={false}
                                    animate={{ rotate: active ? 45 : 0, scale: over ? 1.08 : 1 }}
                                    transition={transition}
                                    style={{
                                        flexShrink: 0,
                                        width: 34,
                                        height: 34,
                                        background: "#171717",
                                        borderRadius: 100,
                                        color: "#FFFFFF",
                                        display: "grid",
                                        placeItems: "center",
                                        marginLeft: "auto",
                                        zIndex: 2,
                                    }}
                                >
                                    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
                                        <path d="M10 4v12M4 10h12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                    </svg>
                                </motion.span>
                            </button>
                            <AnimatePresence initial={false}>
                                {active && (
                                    <motion.div
                                        key="answer"
                                        id={answerId}
                                        role="region"
                                        aria-labelledby={titleId}
                                        initial={reduced ? false : { height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={transition}
                                        style={{ overflow: "hidden", position: "relative", zIndex: 2 }}
                                    >
                                        {hasLink ? (
                                            <a className="bf-answer-link" href={link}
                                                target="_blank" rel="noopener noreferrer">
                                                <div className="bf-answer" style={{
                                                    padding: "0 30px 27px 60px",
                                                }}>
                                                    <p style={{
                                                        margin: "0 0 17px",
                                                        maxWidth: 590,
                                                        fontSize: 15,
                                                        fontWeight: 450,
                                                        lineHeight: 1.48,
                                                        letterSpacing: "-0.013em",
                                                        color: bodyColor,
                                                        ...answerFont,
                                                    }}>{item.answer}</p>
                                                    {item.cta && (
                                                        <span className="bf-cta" style={ctaFont}>
                                                            {item.cta} <Arrow />
                                                        </span>
                                                    )}
                                                </div>
                                            </a>
                                        ) : (
                                            <div className="bf-answer" style={{
                                                padding: "0 30px 26px 60px",
                                            }}>
                                                <p style={{
                                                    margin: 0,
                                                    maxWidth: 590,
                                                    fontSize: 15,
                                                    lineHeight: 1.48,
                                                    letterSpacing: "-0.013em",
                                                    color: bodyColor,
                                                    ...answerFont,
                                                }}>{item.answer}</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.article>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(BlobFAQAccordion, {
    items: {
        type: ControlType.Array,
        title: "Questions",
        maxCount: 12,
        defaultValue: DEFAULT_ITEMS,
        control: {
            type: ControlType.Object,
            controls: {
                question: { type: ControlType.String, title: "Question" },
                answer: { type: ControlType.String, title: "Answer", displayTextArea: true },
                color: { type: ControlType.Color, title: "Card Color" },
                shapeColor: { type: ControlType.Color, title: "Shape Color" },
                shape: {
                    type: ControlType.Enum,
                    title: "Shape",
                    options: ["flower", "blob", "rings", "stripes"],
                    optionTitles: ["Flower", "Blob", "Rings", "Stripes"],
                },
                cta: { type: ControlType.String, title: "CTA Text", defaultValue: "Discover Framer" },
                link: { type: ControlType.Link, title: "Link", defaultValue: "" },
            },
        },
    },
    defaultOpen: { type: ControlType.Number, title: "Open Item", min: -1, max: 11, step: 1, defaultValue: 0 },
    gap: { type: ControlType.Number, title: "Card Gap", min: 0, max: 28, step: 1, defaultValue: 11 },
    stagger: { type: ControlType.Number, title: "Stagger", min: 0, max: 72, step: 1, defaultValue: 24 },
    radius: { type: ControlType.Number, title: "Corners", min: 14, max: 64, step: 1, defaultValue: 34 },
    padding: { type: ControlType.Number, title: "Outer Padding", min: 0, max: 64, step: 1, defaultValue: 26 },
    speed: { type: ControlType.Number, title: "Motion Speed", min: 0.4, max: 2.2, step: 0.1, defaultValue: 1 },
    hoverShift: { type: ControlType.Number, title: "Hover Shift", min: 0, max: 18, step: 1, defaultValue: 5 },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#FAFAF7" },
    textColor: { type: ControlType.Color, title: "Text Color", defaultValue: "#171717" },
    bodyColor: { type: ControlType.Color, title: "Answer Color", defaultValue: "#292929" },
    questionFont: {
        type: ControlType.Font, title: "Question Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 26, variant: "Bold", lineHeight: "1.14em", letterSpacing: "-0.052em" },
    },
    answerFont: {
        type: ControlType.Font, title: "Answer Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 15, variant: "Regular", lineHeight: "1.48em" },
    },
    ctaFont: {
        type: ControlType.Font, title: "CTA Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 13, variant: "Semibold", lineHeight: "1em" },
    },
})
