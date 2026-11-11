// Instructions: Create a modern, responsive FAQ Accordion component with clean minimalist design, subtle border, smooth slide-open animation, and glassmorphism expanded answer (background blur 10px + semi-transparent background). Expose properties to change text, font size (via fonts), colors, and blur amount.

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

import { AnimatePresence, motion, useInView } from "framer-motion"

type FAQItem = {
    question: string
    answer: string
}

interface FAQAccordionProps {
    items: FAQItem[]
    allowMultipleOpen: boolean
    defaultOpenIndex: number

    borderColor: string
    backgroundColor: string
    questionColor: string
    answerColor: string

    pastelColor1: string
    pastelColor2: string
    pastelHighlight: string
    glassBackground: string
    blurAmount: number

    radius: number
    padding: number
    gap: number

    questionFont: any
    answerFont: any

    style?: React.CSSProperties
}

/**
 * FAQ Accordion
 *
 * @framerIntrinsicWidth 520
 * @framerIntrinsicHeight 320
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function FAQAccordion(props: FAQAccordionProps) {
    const {
        items,
        allowMultipleOpen,
        defaultOpenIndex,
        borderColor,
        backgroundColor,
        questionColor,
        answerColor,
        pastelColor1,
        pastelColor2,
        pastelHighlight,
        glassBackground,
        blurAmount,
        radius,
        padding,
        gap,
        questionFont,
        answerFont,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = React.useRef<HTMLDivElement>(null)
    const inView = useInView(containerRef, { margin: "200px 0px 200px 0px", once: false })

    const clampIndex = React.useMemo(() => {
        const max = Math.max(0, (items?.length ?? 0) - 1)
        const idx = Math.max(-1, Math.min(max, Math.round(defaultOpenIndex)))
        return Number.isFinite(idx) ? idx : -1
    }, [defaultOpenIndex, items?.length])

    const [open, setOpen] = React.useState<number[]>(() => {
        if (!items || items.length === 0) return []
        if (clampIndex < 0) return []
        return [clampIndex]
    })

    React.useEffect(() => {
        if (!items || items.length === 0) {
            React.startTransition(() => setOpen([]))
            return
        }
        if (clampIndex < 0) {
            React.startTransition(() => setOpen([]))
            return
        }
        React.startTransition(() => setOpen([clampIndex]))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clampIndex, items?.length])

    const toggle = React.useCallback(
        (index: number) => {
            React.startTransition(() => {
                setOpen((prev) => {
                    const isOpen = prev.includes(index)
                    if (allowMultipleOpen) {
                        if (isOpen) return prev.filter((i) => i !== index)
                        return [...prev, index]
                    }
                    return isOpen ? [] : [index]
                })
            })
        },
        [allowMultipleOpen]
    )

    const safeItems = React.useMemo<FAQItem[]>(() => {
        if (!Array.isArray(items) || items.length === 0) {
            return [
                {
                    question: "What is Framer?",
                    answer: "Framer is a design and website-building tool that lets you create responsive sites with interactive components.",
                },
                {
                    question: "Can I customize this accordion?",
                    answer: "Yes. Edit the questions/answers, fonts, colors, radius, and blur from the properties panel.",
                },
            ]
        }
        return items
    }, [items])

    const isFullWidth = style?.width === "100%"

    return (
        <section
            ref={containerRef}
            aria-label="Frequently asked questions"
            style={{
                ...style,
                position: "relative",
                width: "100%",
                ...(isFullWidth ? null : { minWidth: "min(520px, 100%)" }),
                height: "auto",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap,
                padding,
                borderRadius: radius,
                background: backgroundColor,
                border: `1px solid ${borderColor}`,
                overflow: "hidden",
            }}
        >
            {safeItems.map((item, index) => {
                const expanded = open.includes(index)
                const contentId = `faq-answer-${index}`

                return (
                    <div
                        key={`${index}-${item.question}`}
                        style={{
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            borderRadius: Math.max(0, radius - 4),
                            border: `1px solid ${borderColor}`,
                            overflow: "hidden",
                            background: "transparent",
                        }}
                    >
                        <button
                            type="button"
                            aria-expanded={expanded}
                            aria-controls={contentId}
                            onClick={() => toggle(index)}
                            style={{
                                appearance: "none",
                                WebkitAppearance: "none",
                                border: "none",
                                background: "transparent",
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                                padding: 14,
                                cursor: "pointer",
                                color: questionColor,
                                textAlign: "left",
                                outline: "none",
                                userSelect: "none",
                                ...questionFont,
                            }}
                        >
                            <span
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    lineHeight: 1.2,
                                }}
                            >
                                {item.question}
                            </span>

                            <motion.span
                                aria-hidden="true"
                                style={{
                                    display: "inline-flex",
                                    width: 18,
                                    height: 18,
                                    flex: "0 0 auto",
                                    color: questionColor,
                                }}
                                animate={isStatic ? undefined : inView ? { rotate: expanded ? 180 : 0 } : { rotate: 0 }}
                                transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                            >
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </motion.span>
                        </button>

                        <AnimatePresence initial={false}>
                            {expanded && (
                                <motion.div
                                    id={contentId}
                                    role="region"
                                    aria-label={`Answer: ${item.question}`}
                                    layout
                                    initial={isStatic ? false : { opacity: 0 }}
                                    animate={isStatic ? undefined : inView ? { opacity: 1 } : { opacity: 0 }}
                                    exit={isStatic ? undefined : { opacity: 0 }}
                                    transition={
                                        isStatic || !inView
                                            ? { duration: 0 }
                                            : { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }
                                    }
                                    style={{
                                        overflow: "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: 14,
                                            color: answerColor,
                                            backgroundColor: glassBackground,
                                            backgroundImage: `radial-gradient(120% 120% at 20% 10%, ${pastelHighlight} 0%, rgba(255,255,255,0) 55%), linear-gradient(135deg, ${pastelColor1} 0%, ${pastelColor2} 100%)`,
                                            backdropFilter: `blur(${Math.max(0, blurAmount)}px) saturate(1.25)`,
                                            WebkitBackdropFilter: `blur(${Math.max(0, blurAmount)}px) saturate(1.25)`,
                                            border: `1px solid ${borderColor}`,
                                            backgroundClip: "padding-box",
                                            boxShadow: "0 12px 30px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.35)",
                                            ...answerFont,
                                        }}
                                    >
                                        <div style={{ whiteSpace: "pre-wrap" }}>{item.answer}</div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )
            })}
        </section>
    )
}

addPropertyControls(FAQAccordion, {
    items: {
        type: ControlType.Array,
        title: "FAQs",
        control: {
            type: ControlType.Object,
            controls: {
                question: {
                    type: ControlType.String,
                    title: "Question",
                    defaultValue: "What’s included?",
                },
                answer: {
                    type: ControlType.String,
                    title: "Answer",
                    defaultValue:
                        "Everything you need to get started: responsive layout, smooth animation, and a glassmorphism answer panel.",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: [
            {
                question: "What’s included?",
                answer: "Everything you need to get started: responsive layout, smooth animation, and a glassmorphism answer panel.",
            },
            {
                question: "Can I customize colors and blur?",
                answer: "Yes. Use the right panel controls to set colors, fonts, radius, spacing, and the blur amount.",
            },
            {
                question: "Does it support multiple open items?",
                answer: "Enable ‘Allow Multiple Open’ to expand more than one answer at a time.",
            },
        ],
    },
    allowMultipleOpen: {
        type: ControlType.Boolean,
        title: "Multiple Open",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    defaultOpenIndex: {
        type: ControlType.Number,
        title: "Default Open",
        defaultValue: 0,
        min: -1,
        max: 20,
        step: 1,
    },
    questionFont: {
        type: ControlType.Font,
        title: "Question Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    answerFont: {
        type: ControlType.Font,
        title: "Answer Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.4em",
        },
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#EEEEEE",
    },
    questionColor: {
        type: ControlType.Color,
        title: "Question",
        defaultValue: "#000000",
    },
    answerColor: {
        type: ControlType.Color,
        title: "Answer",
        defaultValue: "#000000",
    },
    pastelColor1: {
        type: ControlType.Color,
        title: "Pastel A",
        defaultValue: "rgba(165, 214, 255, 0.75)",
    },
    pastelColor2: {
        type: ControlType.Color,
        title: "Pastel B",
        defaultValue: "rgba(255, 184, 232, 0.70)",
    },
    pastelHighlight: {
        type: ControlType.Color,
        title: "Highlight",
        defaultValue: "rgba(255, 255, 255, 0.65)",
    },
    glassBackground: {
        type: ControlType.Color,
        title: "Overlay",
        defaultValue: "rgba(0, 0, 0, 0.06)",
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 10,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 10,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
})
