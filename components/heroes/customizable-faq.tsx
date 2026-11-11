// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"

// ─── Default FAQ Items ───────────────────────────────────────────────

const defaultItems = [
    {
        question: "What is your return policy?",
        answer: "We offer a hassle-free 30-day return policy on all purchases. Items must be in their original condition with tags attached. Simply initiate a return through your account dashboard or contact our support team for assistance.",
    },
    {
        question: "How do I track my order?",
        answer: "Once your order ships, you'll receive a confirmation email with a tracking number. You can also track your order in real-time through your account dashboard under 'My Orders'.",
    },
    {
        question: "Do you offer international shipping?",
        answer: "Yes, we ship to over 50 countries worldwide. International shipping rates and delivery times vary by destination. You can view the specific rates at checkout.",
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards including Visa, Mastercard, and American Express, as well as PayPal, Apple Pay, Google Pay, and bank transfers for orders above $500.",
    },
    {
        question: "How can I contact customer support?",
        answer: "Our support team is available 24/7 via live chat, email at support@example.com, or phone at 1-800-123-4567. We typically respond within 2 hours during business hours.",
    },
    {
        question: "Is there a warranty on your products?",
        answer: "All our products come with a standard 1-year manufacturer warranty covering defects in materials and workmanship. Extended warranty options are available at checkout.",
    },
]

// ─── Icon Components ─────────────────────────────────────────────────

function PlusIcon({
    size,
    color,
    thickness = 3,
}: {
    size: number
    color: string
    thickness?: number
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            style={{ display: "block" }}
        >
            <line
                x1="12"
                y1="5"
                x2="12"
                y2="19"
                stroke={color}
                strokeWidth={thickness}
                strokeLinecap="round"
            />
            <line
                x1="5"
                y1="12"
                x2="19"
                y2="12"
                stroke={color}
                strokeWidth={thickness}
                strokeLinecap="round"
            />
        </svg>
    )
}

function ChevronIcon({
    size,
    color,
    thickness = 3,
}: {
    size: number
    color: string
    thickness?: number
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            style={{ display: "block" }}
        >
            <polyline
                points="6 9 12 15 18 9"
                stroke={color}
                strokeWidth={thickness}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function CaretIcon({
    size,
    color,
    thickness = 3,
}: {
    size: number
    color: string
    thickness?: number
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            style={{ display: "block" }}
        >
            <path
                d="M8 10l4 4 4-4"
                stroke={color}
                strokeWidth={thickness}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    )
}

// ─── Types ───────────────────────────────────────────────────────────

interface FAQItem {
    question: string
    answer: string
}

interface IconSettings {
    style: "plus" | "chevron" | "caret"
    color: string
    bgColor: string
    size: number
    thickness: number
}

interface AccordionStyle {
    bgColor: string
    activeBgColor: string
    borderRadius: number
    border: Partial<React.CSSProperties>
    padding: string
}

interface LayoutSettings {
    rowGap: number
    containerPadding: number
}

interface FontValue {
    fontFamily?: string
    fontSize?: number
    lineHeight?: number
    variant?: string
}

interface TypographySettings {
    questionFont: FontValue
    questionColor: string
    answerFont: FontValue
    answerColor: string
}

interface FAQProps {
    style?: React.CSSProperties
    allowMultiple?: boolean
    _info?: string
    layout: LayoutSettings
    items: FAQItem[]
    typography: TypographySettings
    icon: IconSettings
    accordion: AccordionStyle
    transition?: any
}

// ─── Defaults ────────────────────────────────────────────────────────

const defaultLayout: LayoutSettings = {
    rowGap: 0,
    containerPadding: 0,
}

const defaultIcon: IconSettings = {
    style: "plus",
    color: "#000000",
    bgColor: "rgba(0, 0, 0, 0)",
    size: 32,
    thickness: 3,
}

const defaultAccordion: AccordionStyle = {
    bgColor: "rgba(0, 0, 0, 0)",
    activeBgColor: "rgba(0, 0, 0, 0)",
    borderRadius: 0,
    border: {
        borderTopWidth: 0,
        borderRightWidth: 0,
        borderBottomWidth: 3,
        borderLeftWidth: 0,
        borderStyle: "solid",
        borderColor: "#000000",
    },
    padding: "20px 0px 20px 0px",
}

// ─── FAQ Component ───────────────────────────────────────────────────

/**
 * @framerDisableUnlink
 */
function FAQ(props: FAQProps) {
    const isStatic = useIsStaticRenderer()
    const { style, allowMultiple = false } = props
    const layout = { ...defaultLayout, ...props.layout }
    const items = props.items ?? defaultItems.slice(0, 3)
    const typo = props.typography ?? {}
    const questionFont = (typo as any).questionFont ?? {
        fontFamily: "Host Grotesk",
        fontSize: 24,
        lineHeight: 1.4,
        variant: "Bold",
    }
    const questionColor = (typo as any).questionColor ?? "#000000"
    const answerFont = (typo as any).answerFont ?? {
        fontFamily: "DM Sans",
        fontSize: 16,
        lineHeight: 1.6,
        variant: "Regular",
    }
    const answerColor = (typo as any).answerColor ?? "#666666"
    const icon = { ...defaultIcon, ...props.icon }
    const accordion = { ...defaultAccordion, ...props.accordion }
    const transition = props.transition ?? {
        type: "tween",
        ease: "easeInOut",
        duration: 0.3,
    }

    // Use string padding value e.g. "20px 0px 20px 0px"
    const pad: string = accordion.padding ?? "20px 0px 20px 0px"

    const [openIndices, setOpenIndices] = useState<number[]>([])

    const toggle = (index: number) => {
        setOpenIndices((prev) => {
            const isOpen = prev.includes(index)
            if (allowMultiple) {
                return isOpen
                    ? prev.filter((i) => i !== index)
                    : [...prev, index]
            }
            return isOpen ? [] : [index]
        })
    }

    // ── Icon Renderer ────────────────────────────────────────────────

    const renderIcon = (isOpen: boolean) => {
        const rotation = isOpen ? (icon.style === "plus" ? 45 : 180) : 0

        const IconComponent =
            icon.style === "chevron"
                ? ChevronIcon
                : icon.style === "caret"
                  ? CaretIcon
                  : PlusIcon

        const iconStyle = {
            width: icon.size + 14,
            height: icon.size + 14,
            borderRadius: "50%",
            backgroundColor: icon.bgColor,
            display: "flex" as const,
            alignItems: "center" as const,
            justifyContent: "center" as const,
            flexShrink: 0,
            rotate: isStatic ? `${rotation}deg` : undefined,
        }

        if (isStatic) {
            return (
                <div style={iconStyle}>
                    <IconComponent
                        size={icon.size}
                        color={icon.color}
                        thickness={icon.thickness}
                    />
                </div>
            )
        }

        return (
            <motion.div
                animate={{ rotate: rotation }}
                transition={transition}
                style={iconStyle}
            >
                <IconComponent
                    size={icon.size}
                    color={icon.color}
                    thickness={icon.thickness}
                />
            </motion.div>
        )
    }

    // ── FAQ Item ─────────────────────────────────────────────────────

    const renderItem = (item: FAQItem, index: number) => {
        const isOpen = openIndices.includes(index)

        return (
            <motion.div
                key={index}
                animate={{
                    backgroundColor: isOpen
                        ? accordion.activeBgColor
                        : accordion.bgColor,
                }}
                transition={transition}
                style={{
                    backgroundColor: isOpen
                        ? accordion.activeBgColor
                        : accordion.bgColor,
                    borderRadius: accordion.borderRadius,
                    overflow: "hidden",
                    ...accordion.border,
                }}
            >
                {/* Question Row */}
                <div
                    tabIndex={0}
                    role="button"
                    aria-expanded={isOpen}
                    onClick={() => toggle(index)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            toggle(index)
                        }
                    }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: pad,
                        cursor: "pointer",
                        gap: 16,
                        userSelect: "none",
                        outline: "none",
                    }}
                >
                    <span
                        style={{
                            ...questionFont,
                            color: questionColor,
                            flex: 1,
                            margin: 0,
                        }}
                    >
                        {item.question}
                    </span>
                    {renderIcon(isOpen)}
                </div>

                {/* Answer (animated or static) */}
                {isStatic ? (
                    isOpen && (
                        <div style={{ overflow: "hidden" }}>
                            <div
                                style={{
                                    padding: pad,
                                    paddingTop: 0,
                                }}
                            >
                                <p
                                    style={{
                                        ...answerFont,
                                        color: answerColor,
                                        margin: 0,
                                    }}
                                >
                                    {item.answer}
                                </p>
                            </div>
                        </div>
                    )
                ) : (
                    <AnimatePresence initial={false}>
                        {isOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={transition}
                                style={{ overflow: "hidden" }}
                            >
                                <div
                                    style={{
                                        padding: pad,
                                        paddingTop: 0,
                                    }}
                                >
                                    <p
                                        style={{
                                            ...answerFont,
                                            color: answerColor,
                                            margin: 0,
                                        }}
                                    >
                                        {item.answer}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </motion.div>
        )
    }

    // ── Render ────────────────────────────────────────────────────────

    if (!items || items.length === 0) {
        return (
            <div
                style={{
                    padding: 40,
                    textAlign: "center",
                    color: "#999",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                }}
            >
                Add FAQ items from the property panel →
            </div>
        )
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: layout.rowGap,
                padding: layout.containerPadding,
                boxSizing: "border-box",
                ...style,
            }}
        >
            {items.map((item, index) => renderItem(item, index))}
        </div>
    )
}

FAQ.defaultProps = {
    _info: "kaniyanstudio",
    allowMultiple: false,
    layout: defaultLayout,
    items: defaultItems.slice(0, 3),
    typography: {
        questionFont: {
            fontFamily: "Host Grotesk",
            fontSize: 24,
            lineHeight: 1.4,
            variant: "Bold",
        },
        questionColor: "#000000",
        answerFont: {
            fontFamily: "DM Sans",
            fontSize: 16,
            lineHeight: 1.6,
            variant: "Regular",
        },
        answerColor: "#666666",
    },
    icon: defaultIcon,
    accordion: defaultAccordion,
    transition: { type: "tween", ease: "easeInOut", duration: 0.3 },
    style: {
        width: "100%",
        minWidth: 320,
    },
}

// ─── Framer Property Controls ────────────────────────────────────────
// Grouped into collapsible sections via ControlType.Object
// Font controls use ControlType.Font for native Framer font picker

const REMIX_LINK = "https://faq-accordion.framer.ai/" // Paste your remix link here

addPropertyControls(FAQ, {
    _info: {
        type: ControlType.Enum,
        title: "Developed by",
        options: ["kaniyanstudio"],
        optionTitles: ["KaniyanStudio"],
        displaySegmentedControl: true,
        defaultValue: "kaniyanstudio",
        description: `Made with ❤️ by [@kaniyanstudio](https://www.x.com/kaniyanstudio)\n[Live Demo](${REMIX_LINK})`,
    },
    allowMultiple: {
        type: ControlType.Boolean,
        title: "Multiple Open",
        description:
            "When enabled, multiple questions can be open at the same time.",
        defaultValue: false,
    },

    // ── Layout (collapsible group) ───────────────────────────────────
    layout: {
        type: ControlType.Object,
        title: "Layout",
        description: "Control the spacing around and between FAQ items.",
        controls: {
            rowGap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 60,
                step: 1,
                defaultValue: 0,
                unit: "px",
            },
            containerPadding: {
                type: ControlType.Number,
                title: "Padding",
                min: 0,
                max: 100,
                step: 1,
                defaultValue: 0,
                unit: "px",
            },
        },
    },

    // ── FAQ Items ────────────────────────────────────────────────────
    items: {
        type: ControlType.Array,
        title: "FAQ Items",
        control: {
            type: ControlType.Object,
            controls: {
                question: {
                    type: ControlType.String,
                    title: "Question",
                    defaultValue: "Your question here?",
                },
                answer: {
                    type: ControlType.String,
                    title: "Answer",
                    defaultValue: "Your answer goes here.",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: defaultItems.slice(0, 3),
    },

    // ── Typography (collapsible group) ─────────────────────────────
    typography: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            questionFont: {
                type: ControlType.Font,
                title: "Question Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontFamily: "Host Grotesk",
                    fontSize: 24,
                    lineHeight: 1.4,
                    variant: "Bold",
                },
            },
            questionColor: {
                type: ControlType.Color,
                title: "Question Color",
                defaultValue: "#000000",
            },
            answerFont: {
                type: ControlType.Font,
                title: "Answer Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontFamily: "DM Sans",
                    fontSize: 16,
                    lineHeight: 1.6,
                    variant: "Regular",
                },
            },
            answerColor: {
                type: ControlType.Color,
                title: "Answer Color",
                defaultValue: "#666666",
            },
        },
    },

    // ── Icon (collapsible group) ─────────────────────────────────────
    icon: {
        type: ControlType.Object,
        title: "Icon",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["plus", "chevron", "caret"],
                optionTitles: ["Plus ✕", "Chevron ▾", "Caret ▸"],
                defaultValue: "plus",
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#000000",
            },
            bgColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(0, 0, 0, 0)",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 10,
                max: 60,
                step: 1,
                defaultValue: 32,
                unit: "px",
            },
            thickness: {
                type: ControlType.Number,
                title: "Thickness",
                min: 1,
                max: 10,
                step: 0.5,
                defaultValue: 3,
            },
        },
    },

    // ── Accordion Style (collapsible group) ─────────────────────────
    accordion: {
        type: ControlType.Object,
        title: "Accordion",
        description: "Customize the shape and colors of the individual items.",
        controls: {
            bgColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(0, 0, 0, 0)",
            },
            activeBgColor: {
                type: ControlType.Color,
                title: "Active Background",
                defaultValue: "rgba(0, 0, 0, 0)",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 50,
                step: 1,
                defaultValue: 0,
                unit: "px",
            },
            border: {
                type: ControlType.Border,
                title: "Border",
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "20px 0px 20px 0px",
            },
        },
    },

    // ── Transition ───────────────────────────────────────────────────
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: {
            type: "tween",
            ease: "easeInOut",
            duration: 0.3,
        },
    },
})

export default FAQ
