// FAQ Accordion component for Framer, using official Transition control (spring-only)
import * as React from "react"
import { motion } from "framer-motion"
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
 * FAQ Accordion
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */

// --- Default content shown on first drop ---
const DEFAULT_FAQ_ITEMS = [
    {
        question: "What is this FAQ component?",
        answer: "A Framer-ready accordion with SEO (FAQPage schema), accessible markup, and spring transitions. Customize fonts, colors, spacing, shadows, and borders.",
    },
    {
        question: "Can I use multiple sections on one page?",
        answer: "Yes—place multiple instances. To avoid duplicate schema, use one for SEO and disable it on others if needed.",
    },
    {
        question: "How do I customize fonts, colors, and spacing?",
        answer: "Use the right panel controls. Question/Answer have extended font controls; Item and Section let you set padding, radius, shadow, and borders.",
    },
]

function parseBoxShadow(value: any) {
    if (!value) return "none"
    if (typeof value === "string") return value
    if (Array.isArray(value)) return value.join(", ")
    return "none"
}
function parseBorder(value: any) {
    if (!value) return "none"
    if (typeof value === "string") return value
    if (typeof value === "object" && typeof value.borderWidth === "number") {
        const {
            borderWidth,
            borderStyle = "solid",
            borderColor = "#000",
        } = value
        if (borderWidth <= 0 || borderStyle === "none") return "none"
        return `${borderWidth}px ${borderStyle} ${borderColor}`
    }
    return "none"
}

function variantToFontWeight(variant?: string) {
    switch (variant) {
        case "Thin":
        case "Thin Italic":
            return 100
        case "Extra Light":
        case "Extra Light Italic":
            return 200
        case "Light":
        case "Light Italic":
            return 300
        case "Regular":
        case "Regular Italic":
        case "Italic":
            return 400
        case "Medium":
        case "Medium Italic":
            return 500
        case "Semibold":
        case "Semibold Italic":
            return 600
        case "Bold":
        case "Bold Italic":
            return 700
        case "Extra Bold":
        case "Extra Bold Italic":
            return 800
        case "Black":
        case "Black Italic":
            return 900
        default:
            return 400
    }
}
function resolveWeight(
    fontObj: any = {},
    variableWeight?: number,
    fallback = 400
) {
    if (typeof variableWeight === "number" && variableWeight > 0)
        return variableWeight
    if (typeof fontObj.fontWeight === "number") return fontObj.fontWeight
    if (typeof fontObj.weight === "number") return fontObj.weight
    if (fontObj.variant) return variantToFontWeight(fontObj.variant)
    return fallback
}

function buildFAQSchema(items: Array<{ question: string; answer: string }>) {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((i) => ({
            "@type": "Question",
            name: i.question,
            acceptedAnswer: { "@type": "Answer", text: i.answer },
        })),
    }
}

/* ------------------ JSON-LD aggregator (no toggles) ------------------ */
// One <script> per page, aggregating all FAQ instances.
type FAQItem = { question: string; answer: string }
declare global {
    interface Window {
        __FAQ_SCHEMA_REG__?: Map<string, FAQItem[]>
    }
}
const SCHEMA_SCRIPT_ID = "faq-schema-aggregated"

function upsertAggregatedSchema() {
    const doc = typeof document !== "undefined" ? document : null
    if (!doc) return
    const all: FAQItem[] = Array.from(
        window.__FAQ_SCHEMA_REG__?.values() ?? []
    ).flat()

    let node = doc.getElementById(SCHEMA_SCRIPT_ID) as HTMLScriptElement | null
    if (all.length === 0) {
        if (node) node.remove()
        return
    }
    const json = JSON.stringify(buildFAQSchema(all))
    if (!node) {
        node = doc.createElement("script")
        node.type = "application/ld+json"
        node.id = SCHEMA_SCRIPT_ID
        node.text = json
        doc.head.appendChild(node)
    } else {
        node.text = json
    }
}
function registerFAQSection(sectionId: string, items: FAQItem[]) {
    if (!window.__FAQ_SCHEMA_REG__) window.__FAQ_SCHEMA_REG__ = new Map()
    window.__FAQ_SCHEMA_REG__.set(sectionId, items)
    upsertAggregatedSchema()
}
function unregisterFAQSection(sectionId: string) {
    window.__FAQ_SCHEMA_REG__?.delete(sectionId)
    upsertAggregatedSchema()
}
/* -------------------------------------------------------------------- */

/** Force spring-only regardless of what Transition UI might contain */
function springOnly(t: any) {
    const fallback = { type: "spring", stiffness: 320, damping: 36, mass: 1 }
    if (!t || typeof t !== "object") return fallback
    const { stiffness = 320, damping = 36, mass = 1 } = t
    const passThrough: any = { type: "spring", stiffness, damping, mass }
    if (typeof t.duration === "number") passThrough.duration = t.duration
    if (typeof t.delay === "number") passThrough.delay = t.delay
    if (typeof t.repeat === "number") passThrough.repeat = t.repeat
    if (typeof t.repeatDelay === "number")
        passThrough.repeatDelay = t.repeatDelay
    if (typeof t.repeatType === "string") passThrough.repeatType = t.repeatType
    return passThrough
}

/**
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 200
 * @framerDisableUnlink
 */

export default function FAQAccordion(props: any) {
    const {
        // DATA
        faqItems = DEFAULT_FAQ_ITEMS,

        // TYPOGRAPHY
        questionFont = { fontSize: 16, lineHeight: "1.5em", variant: "Bold" },
        answerFont = { fontSize: 14, lineHeight: "1.5em", variant: "Regular" },

        // STYLE
        questionStyle = { textColor: "#EDEDED", weight: 0 },
        answerStyle = { textColor: "#A3A3A3", weight: 0 },

        // ICON (now with type + stroke)
        icon = { type: "plus", size: 24, color: "#9CA3AF", stroke: 2 },

        // ITEM visuals
        container = {
            backgroundColor: "#111111",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "",
            border: {
                borderWidth: 0,
                borderStyle: "solid",
                borderColor: "#000000",
            },
        },

        // SECTION (wrapper around all items)
        section = {
            backgroundColor: "transparent",
            borderRadius: "0px",
            padding: "0px",
            boxShadow: "",
            border: {
                borderWidth: 0,
                borderStyle: "solid",
                borderColor: "#000000",
            },
        },

        // OFFICIAL Transition control (will be forced to spring)
        transition,

        // Behavior
        defaultOpenFirst = false,
        openAllOnCanvas = false,
        itemGap = 10, // px

        style,
    } = props

    const isOnCanvas = RenderTarget.current() === RenderTarget.canvas
    const [openIndex, setOpenIndex] = React.useState<number | null>(
        defaultOpenFirst ? 0 : null
    )

    const finalItemShadow = parseBoxShadow((container as any).boxShadow)
    const finalItemBorder = parseBorder((container as any).border)
    const finalSectionShadow = parseBoxShadow((section as any).boxShadow)
    const finalSectionBorder = parseBorder((section as any).border)

    const springTransition = React.useMemo(
        () => springOnly(transition),
        [transition]
    )

    const qWeight = resolveWeight(
        questionFont,
        (questionStyle as any)?.weight,
        600
    )
    const aWeight = resolveWeight(answerFont, (answerStyle as any)?.weight, 400)

    const openAllStaticOnCanvas = isOnCanvas && openAllOnCanvas

    const isItemOpen = (index: number) => {
        if (openAllStaticOnCanvas) return true
        return openIndex === index
    }

    const handleToggle = (index: number) => {
        if (isOnCanvas) return // non-interactive on canvas
        setOpenIndex((prev) => (prev === index ? null : index)) // single-open behavior
    }

    /* ---------------- aggregate schema registration (Preview/Export) ---------------- */
    const sectionId = (React as any).useId ? React.useId() : `${Math.random()}`
    React.useEffect(() => {
        if (isOnCanvas) return
        registerFAQSection(sectionId, faqItems)
        return () => unregisterFAQSection(sectionId)
    }, [isOnCanvas, sectionId, faqItems])
    /* ------------------------------------------------------------------------------- */

    const Header = (item: any, index: number, open: boolean) => {
        const regionId = `faq-region-${index}`
        const buttonId = `faq-button-${index}`
        return (
            <div
                id={buttonId}
                style={{
                    padding: (container as any).padding,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: isOnCanvas ? "default" : "pointer",
                    userSelect: "none",
                }}
                onClick={() => (!isOnCanvas ? handleToggle(index) : undefined)}
                onKeyDown={(e) => {
                    if (isOnCanvas) return
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        handleToggle(index)
                    }
                }}
                aria-expanded={open}
                aria-controls={regionId}
                role="button"
                tabIndex={0}
            >
                <h3
                    style={{
                        margin: 0,
                        fontFamily:
                            (questionFont as any).fontFamily || undefined,
                        fontSize: (questionFont as any).fontSize || undefined,
                        fontWeight: qWeight,
                        fontVariationSettings:
                            typeof qWeight === "number"
                                ? `"wght" ${qWeight}`
                                : undefined,
                        lineHeight: (questionFont as any).lineHeight || "1.5em",
                        letterSpacing:
                            (questionFont as any).letterSpacing || undefined,
                        color:
                            (questionStyle as any).textColor ||
                            (questionFont as any).color ||
                            "#333333",
                    }}
                >
                    {item.question}
                </h3>

                {/* Icon (Plus/Minus or Chevron) */}
                <div
                    aria-hidden="true"
                    style={{
                        width: (icon as any).size,
                        height: (icon as any).size,
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginLeft: 12,
                        flex: "0 0 auto",
                    }}
                >
                    {(icon as any).type === "plus" ? (
                        <>
                            {/* Horizontal bar (minus) */}
                            <div
                                style={{
                                    position: "absolute",
                                    width: (icon as any).size * 0.66,
                                    height: (icon as any).stroke,
                                    background: (icon as any).color,
                                    borderRadius: 1,
                                }}
                            />
                            {/* Vertical bar rotates to overlap → minus */}
                            <motion.div
                                style={{
                                    position: "absolute",
                                    width: (icon as any).stroke,
                                    height: (icon as any).size * 0.66,
                                    background: (icon as any).color,
                                    borderRadius: 1,
                                    transformOrigin: "center",
                                }}
                                animate={{ rotate: open ? 90 : 0 }}
                                transition={springTransition}
                            />
                        </>
                    ) : (
                        // Chevron caret, rotates 0 → 180° when open
                        <motion.svg
                            width={(icon as any).size}
                            height={(icon as any).size}
                            viewBox="0 0 24 24"
                            style={{ display: "block" }}
                            animate={{ rotate: open ? 180 : 0 }}
                            transition={springTransition}
                        >
                            <polyline
                                points="6 9 12 15 18 9"
                                fill="none"
                                stroke={(icon as any).color}
                                strokeWidth={(icon as any).stroke}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </motion.svg>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div
            style={{
                ...style,
                width: "100%",
                height: "100%",
                position: "relative",
            }}
        >
            {/* SECTION WRAPPER */}
            <div
                style={{
                    backgroundColor: (section as any).backgroundColor,
                    borderRadius: (section as any).borderRadius,
                    boxShadow: finalSectionShadow,
                    border: finalSectionBorder,
                    padding: (section as any).padding,
                    overflow: "hidden",
                    width: "100%",
                    height: "auto",
                }}
            >
                {faqItems.map((item: any, index: number) => {
                    const open = isItemOpen(index)
                    const last = index === faqItems.length - 1
                    const regionId = `faq-region-${index}`

                    // On canvas with "Open all" => render fully open, no animation for reliability.
                    if (openAllStaticOnCanvas) {
                        return (
                            <div
                                key={index}
                                style={{
                                    marginBottom: last ? 0 : itemGap,
                                    borderRadius: (container as any)
                                        .borderRadius,
                                    backgroundColor: (container as any)
                                        .backgroundColor,
                                    boxShadow: finalItemShadow,
                                    border: finalItemBorder,
                                    overflow: "hidden",
                                }}
                            >
                                {Header(item, index, true)}
                                <div
                                    id={regionId}
                                    role="region"
                                    aria-labelledby={`faq-button-${index}`}
                                >
                                    <div
                                        style={{
                                            padding: (container as any).padding,
                                            paddingTop: 0,
                                            fontFamily:
                                                (answerFont as any)
                                                    .fontFamily || undefined,
                                            fontSize:
                                                (answerFont as any).fontSize ||
                                                undefined,
                                            fontWeight: aWeight,
                                            fontVariationSettings:
                                                typeof aWeight === "number"
                                                    ? `"wght" ${aWeight}`
                                                    : undefined,
                                            lineHeight:
                                                (answerFont as any)
                                                    .lineHeight || "1.5em",
                                            letterSpacing:
                                                (answerFont as any)
                                                    .letterSpacing || undefined,
                                            color:
                                                (answerStyle as any)
                                                    .textColor ||
                                                (answerFont as any).color ||
                                                "#666666",
                                        }}
                                    >
                                        {item.answer}
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    // Preview/Export: keep ALL answers mounted (SEO) and animate height only
                    return (
                        <motion.div
                            key={index}
                            layout
                            style={{
                                marginBottom: last ? 0 : itemGap,
                                borderRadius: (container as any).borderRadius,
                                backgroundColor: (container as any)
                                    .backgroundColor,
                                boxShadow: finalItemShadow,
                                border: finalItemBorder,
                                overflow: "hidden",
                            }}
                            transition={springTransition}
                        >
                            {Header(item, index, open)}

                            {/* Always mounted for SEO; height animates between 0 and auto */}
                            <motion.div
                                id={regionId}
                                initial={false}
                                animate={
                                    open
                                        ? { height: "auto", opacity: 1 }
                                        : { height: 0, opacity: 0 }
                                }
                                transition={springTransition}
                                style={{ overflow: "hidden" }}
                                role="region"
                                aria-labelledby={`faq-button-${index}`}
                                aria-hidden={!open}
                            >
                                <motion.div
                                    layout="position"
                                    transition={springTransition}
                                    style={{
                                        padding: (container as any).padding,
                                        paddingTop: 0,
                                        fontFamily:
                                            (answerFont as any).fontFamily ||
                                            undefined,
                                        fontSize:
                                            (answerFont as any).fontSize ||
                                            undefined,
                                        fontWeight: aWeight,
                                        fontVariationSettings:
                                            typeof aWeight === "number"
                                                ? `"wght" ${aWeight}`
                                                : undefined,
                                        lineHeight:
                                            (answerFont as any).lineHeight ||
                                            "1.5em",
                                        letterSpacing:
                                            (answerFont as any).letterSpacing ||
                                            undefined,
                                        color:
                                            (answerStyle as any).textColor ||
                                            (answerFont as any).color ||
                                            "#666666",
                                    }}
                                >
                                    {item.answer}
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(FAQAccordion, {
    // 1) CONTENT
    faqItems: {
        type: ControlType.Array,
        title: "Items",
        description: "Add Q/A pairs. Use multi-line for longer answers.",
        control: {
            type: ControlType.Object,
            controls: {
                question: {
                    type: ControlType.String,
                    title: "Question",
                    displayTextArea: true,
                    placeholder: "Type a question…",
                },
                answer: {
                    type: ControlType.String,
                    title: "Answer",
                    placeholder: "Type an answer…",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: DEFAULT_FAQ_ITEMS,
    },

    // 2) LAYOUT
    itemGap: {
        type: ControlType.Number,
        title: "Item Gap",
        description: "Space between accordion items (px).",
        min: 0,
        max: 64,
        step: 1,
        displayStepper: true,
        defaultValue: 10,
    },

    // 3) TYPOGRAPHY — Question
    questionFont: {
        //@ts-ignore
        type: ControlType.Font,
        title: "Question Font",
        description: "Font for the question line.",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: { fontSize: 16, lineHeight: "1.5em", variant: "Bold" },
    },
    questionStyle: {
        type: ControlType.Object,
        title: "Question Style",
        description: "Color and variable ‘wght’ for the question.",
        controls: {
            textColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#EDEDED",
            },
            weight: {
                type: ControlType.Number,
                title: "Weight",
                description:
                    "Variable font ‘wght’. Set 0 to use the font’s variant.",
                min: 0,
                max: 1000,
                step: 1,
                displayStepper: false,
                defaultValue: 0,
            },
        },
        defaultValue: undefined,
    },

    // 4) TYPOGRAPHY — Answer
    answerFont: {
        //@ts-ignore
        type: ControlType.Font,
        title: "Answer Font",
        description: "Font for the answer text.",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: { fontSize: 14, lineHeight: "1.5em", variant: "Regular" },
    },
    answerStyle: {
        type: ControlType.Object,
        title: "Answer Style",
        description: "Color and variable ‘wght’ for the answer.",
        controls: {
            textColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#A3A3A3",
            },
            weight: {
                type: ControlType.Number,
                title: "Weight",
                description:
                    "Variable font ‘wght’. Set 0 to use the font’s variant.",
                min: 0,
                max: 1000,
                step: 1,
                displayStepper: false,
                defaultValue: 0,
            },
        },
        defaultValue: undefined,
    },

    // 5) ICON (with style toggle)
    icon: {
        type: ControlType.Object,
        title: "Icon",
        description: "Dropdown icon style and appearance.",
        controls: {
            type: {
                type: ControlType.Enum,
                title: "Style",
                options: ["plus", "chevron"],
                optionTitles: ["Plus / Minus", "Chevron"],
                defaultValue: "plus",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 0,
                max: 100,
                step: 1,
                displayStepper: true,
                defaultValue: 24,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#9CA3AF",
            },
            stroke: {
                type: ControlType.Number,
                title: "Stroke",
                min: 1,
                max: 6,
                step: 0.5,
                defaultValue: 2,
            },
        },
        defaultValue: undefined,
    },

    // 6) ITEM (each accordion)
    container: {
        type: ControlType.Object,
        title: "Item",
        description:
            "Background, radius, padding, shadow and border for each accordion item.",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#111111",
            },
            borderRadius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "20px",
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "24px",
            },
            boxShadow: { type: ControlType.BoxShadow, title: "Shadow" },
            border: {
                type: ControlType.Border,
                title: "Border",
                defaultValue: {
                    borderWidth: 0,
                    borderStyle: "solid",
                    borderColor: "#000000",
                },
            },
        },
        defaultValue: undefined,
    },

    // 7) SECTION (wrapper of all items)
    section: {
        type: ControlType.Object,
        title: "Section",
        description: "Styles for the overall FAQ wrapper container.",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "transparent",
            },
            borderRadius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "0px",
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "0px",
            },
            boxShadow: { type: ControlType.BoxShadow, title: "Shadow" },
            border: {
                type: ControlType.Border,
                title: "Border",
                defaultValue: {
                    borderWidth: 0,
                    borderStyle: "solid",
                    borderColor: "#000000",
                },
            },
        },
        defaultValue: undefined,
    },

    // 8) TRANSITION (spring-only behavior)
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        description: "Control animation feel (spring).",
        defaultValue: { type: "spring", stiffness: 320, damping: 36, mass: 1 },
    },

    // 9) BEHAVIOR
    defaultOpenFirst: {
        type: ControlType.Boolean,
        title: "Default Open (Preview)",
        description: "In Preview/Export, open the first item by default.",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    openAllOnCanvas: {
        type: ControlType.Boolean,
        title: "Open All on Canvas",
        description:
            "On the canvas, expand every item (no animations) for easier styling.",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})

// Safety net defaults for runtime
;(FAQAccordion as any).defaultProps = {
    faqItems: DEFAULT_FAQ_ITEMS,
}
