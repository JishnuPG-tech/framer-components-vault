// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"

const SPRING_PRESETS: Record<string, any> = {
    smooth: { type: "spring", stiffness: 280, damping: 30, mass: 0.9 },
    snappy: { type: "spring", stiffness: 520, damping: 38, mass: 0.7 },
    bouncy: { type: "spring", stiffness: 320, damping: 16, mass: 0.9 },
}

const LIGHT_PALETTE = {
    cardColor: "rgba(255,255,255,1)",
    questionColor: "rgba(20,20,20,1)",
    answerColor: "rgba(100,100,100,1)",
    accentColor: "rgba(90,90,240,1)",
    borderColor: "rgba(230,230,230,1)",
}

const DARK_PALETTE = {
    cardColor: "rgba(28,28,32,1)",
    questionColor: "rgba(245,245,245,1)",
    answerColor: "rgba(170,170,178,1)",
    accentColor: "rgba(150,150,255,1)",
    borderColor: "rgba(255,255,255,0.08)",
}

function escapeRegExp(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function colorsEqual(a: string, b: string) {
    const parse = (color: string) => {
        const match = String(color).match(/rgba?\(([^)]+)\)/)
        if (!match) return null
        return match[1].split(",").map((s) => parseFloat(s.trim()))
    }
    const pa = parse(a)
    const pb = parse(b)
    if (!pa || !pb) return a === b
    return pa.length === pb.length && pa.every((v, i) => v === pb[i])
}

function withAlpha(color: string, alpha: number) {
    if (!color) return `rgba(0,0,0,${alpha})`
    const match = String(color).match(/rgba?\(([^)]+)\)/)
    if (!match) return color
    const [r, g, b] = match[1].split(",").map((s) => s.trim())
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function highlightMatch(text: string, query: string, accentColor: string) {
    const q = query.trim()
    if (!q) return text
    const parts = String(text).split(new RegExp(`(${escapeRegExp(q)})`, "gi"))
    return parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
            <mark
                key={i}
                style={{
                    backgroundColor: withAlpha(accentColor, 0.25),
                    color: "inherit",
                    borderRadius: 3,
                    padding: "0 2px",
                }}
            >
                {part}
            </mark>
        ) : (
            <span key={i}>{part}</span>
        )
    )
}

function SearchIcon({ color }: { color: string }) {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                flexShrink: 0,
            }}
        >
            <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
            <line
                x1="21"
                y1="21"
                x2="16.65"
                y2="16.65"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    )
}

function ChevronIcon({ color }: { color: string }) {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            style={{ flexShrink: 0 }}
        >
            <path
                d="M6 9l6 6 6-6"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function EmptyIcon({ color }: { color: string }) {
    return (
        <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            style={{ margin: "0 auto" }}
        >
            <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
            <line
                x1="8"
                y1="8"
                x2="14"
                y2="14"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <line
                x1="14"
                y1="8"
                x2="8"
                y2="14"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    )
}

interface FAQItem {
    question: string
    answer: string
}

/**
 * Searchable FAQ Accordion
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 480
 * @framerIntrinsicHeight 420
 */
//@framerDisableUnlink
export default function SearchableFAQAccordion(props) {
    const { content, style: styleProps, interaction } = props
    const { items, searchPlaceholder, emptyStateTitle, emptyStateSubtitle } =
        content
    const {
        darkMode,
        font,
        backgroundColor,
        cardColor: customCardColor,
        questionColor: customQuestionColor,
        answerColor: customAnswerColor,
        accentColor: customAccentColor,
        borderColor: customBorderColor,
        cornerRadius,
        itemGap,
        itemPadding,
        borderWidth,
        shadow,
    } = styleProps
    const { showSearch, allowMultipleOpen, defaultOpenIndex, animationSpeed } =
        interaction

    const useDarkDefault = (custom: string, key: keyof typeof LIGHT_PALETTE) =>
        darkMode && colorsEqual(custom, LIGHT_PALETTE[key])
            ? DARK_PALETTE[key]
            : custom

    const cardColor = useDarkDefault(customCardColor, "cardColor")
    const questionColor = useDarkDefault(customQuestionColor, "questionColor")
    const answerColor = useDarkDefault(customAnswerColor, "answerColor")
    const accentColor = useDarkDefault(customAccentColor, "accentColor")
    const borderColor = useDarkDefault(customBorderColor, "borderColor")

    const isStatic = useIsStaticRenderer()
    const transition = isStatic
        ? { duration: 0 }
        : SPRING_PRESETS[animationSpeed] || SPRING_PRESETS.smooth

    const [query, setQuery] = useState("")
    const [openIds, setOpenIds] = useState<Set<number>>(
        () => new Set(defaultOpenIndex >= 0 ? [defaultOpenIndex] : [])
    )

    const filteredItems = useMemo(() => {
        const list: (FAQItem & { __index: number })[] = (items || []).map(
            (item: FAQItem, index: number) => ({ ...item, __index: index })
        )
        const q = query.trim().toLowerCase()
        if (!q) return list
        return list.filter(
            (item) =>
                (item.question || "").toLowerCase().includes(q) ||
                (item.answer || "").toLowerCase().includes(q)
        )
    }, [items, query])

    function toggleItem(id: number) {
        setOpenIds((prev) => {
            const isOpen = prev.has(id)
            if (allowMultipleOpen) {
                const next = new Set(prev)
                if (isOpen) next.delete(id)
                else next.add(id)
                return next
            }
            return isOpen ? new Set<number>() : new Set<number>([id])
        })
    }

    return (
        <div
            style={{
                ...font,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: itemGap,
                backgroundColor,
                boxSizing: "border-box",
            }}
        >
            {showSearch && (
                <div style={{ position: "relative", flexShrink: 0 }}>
                    <SearchIcon color={accentColor} />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={searchPlaceholder}
                        style={{
                            ...font,
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "12px 16px 12px 44px",
                            borderRadius: cornerRadius,
                            border: `${borderWidth}px solid ${borderColor}`,
                            backgroundColor: cardColor,
                            color: questionColor,
                            outline: "none",
                        }}
                    />
                </div>
            )}

            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: itemGap,
                }}
            >
                {filteredItems.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 16px" }}>
                        <EmptyIcon color={accentColor} />
                        <div
                            style={{
                                ...font,
                                fontWeight: 600,
                                color: questionColor,
                                marginTop: 12,
                            }}
                        >
                            {emptyStateTitle}
                        </div>
                        <div
                            style={{
                                ...font,
                                fontSize:
                                    typeof font.fontSize === "number"
                                        ? font.fontSize * 0.9
                                        : font.fontSize,
                                color: answerColor,
                                marginTop: 4,
                            }}
                        >
                            {emptyStateSubtitle}
                        </div>
                    </div>
                ) : (
                    filteredItems.map((item) => {
                        const isOpen = openIds.has(item.__index)
                        return (
                            <div
                                key={item.__index}
                                style={{
                                    border: `${borderWidth}px solid ${borderColor}`,
                                    borderRadius: cornerRadius,
                                    backgroundColor: cardColor,
                                    boxShadow: shadow,
                                    overflow: "hidden",
                                    flexShrink: 0,
                                }}
                            >
                                <button
                                    onClick={() => toggleItem(item.__index)}
                                    style={{
                                        ...font,
                                        width: "100%",
                                        boxSizing: "border-box",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: itemPadding,
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        fontWeight: 600,
                                        color: questionColor,
                                        textAlign: "left",
                                    }}
                                >
                                    <span style={{ marginRight: 12 }}>
                                        {highlightMatch(
                                            item.question,
                                            query,
                                            accentColor
                                        )}
                                    </span>
                                    <motion.div
                                        animate={{ rotate: isOpen ? 180 : 0 }}
                                        transition={transition}
                                    >
                                        <ChevronIcon color={accentColor} />
                                    </motion.div>
                                </button>
                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            key="content"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{
                                                height: "auto",
                                                opacity: 1,
                                            }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={transition}
                                            style={{ overflow: "hidden" }}
                                        >
                                            <div
                                                style={{
                                                    ...font,
                                                    fontSize:
                                                        typeof font.fontSize ===
                                                        "number"
                                                            ? font.fontSize *
                                                              0.95
                                                            : font.fontSize,
                                                    boxSizing: "border-box",
                                                    padding: itemPadding,
                                                    color: answerColor,
                                                    lineHeight: 1.6,
                                                }}
                                            >
                                                {highlightMatch(
                                                    item.answer,
                                                    query,
                                                    accentColor
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

SearchableFAQAccordion.defaultProps = {
    content: {
        items: [
            {
                question: "How do I install this component?",
                answer: "Copy the component URL from the property panel and paste it directly onto your Framer canvas. It installs instantly, no code editing required.",
            },
            {
                question: "Can I search across both questions and answers?",
                answer: "Yes. The search filter matches text in both the question and answer fields in real time, so users find what they need faster.",
            },
            {
                question:
                    "Does the accordion support opening multiple items at once?",
                answer: "Toggle 'Multiple Open' in the Interaction settings to allow several answers to stay expanded simultaneously, or keep it off for a classic single-open accordion.",
            },
            {
                question: "Is the animation customizable?",
                answer: "Choose between Smooth, Snappy, or Bouncy spring presets to match the personality of your site.",
            },
            {
                question: "What happens when a search has no results?",
                answer: "A friendly empty state appears with an icon and message, letting users know to try a different search term.",
            },
        ],
        searchPlaceholder: "Search FAQs...",
        emptyStateTitle: "No results found",
        emptyStateSubtitle: "Try a different search term",
    },
    style: {
        darkMode: false,
        font: {
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
            fontWeight: 400,
            letterSpacing: 0,
            lineHeight: "1.4em",
        },
        backgroundColor: "rgba(0,0,0,0)",
        cardColor: "rgba(255,255,255,1)",
        questionColor: "rgba(20,20,20,1)",
        answerColor: "rgba(100,100,100,1)",
        accentColor: "rgba(90,90,240,1)",
        borderColor: "rgba(230,230,230,1)",
        cornerRadius: 12,
        itemGap: 10,
        itemPadding: "16px 18px 16px 18px",
        borderWidth: 1,
        shadow: "0px 0px 0px 0px rgba(0,0,0,0)",
    },
    interaction: {
        showSearch: true,
        allowMultipleOpen: false,
        defaultOpenIndex: 0,
        animationSpeed: "smooth",
    },
}

addPropertyControls(SearchableFAQAccordion, {
    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            items: {
                type: ControlType.Array,
                title: "Questions",
                control: {
                    type: ControlType.Object,
                    controls: {
                        question: {
                            type: ControlType.String,
                            title: "Question",
                            defaultValue: "Question",
                        },
                        answer: {
                            type: ControlType.String,
                            title: "Answer",
                            defaultValue: "Answer",
                            displayTextArea: true,
                        },
                    },
                },
                defaultValue: [
                    {
                        question: "How do I install this component?",
                        answer: "Copy the component URL from the property panel and paste it directly onto your Framer canvas. It installs instantly, no code editing required.",
                    },
                    {
                        question:
                            "Can I search across both questions and answers?",
                        answer: "Yes. The search filter matches text in both the question and answer fields in real time, so users find what they need faster.",
                    },
                    {
                        question:
                            "Does the accordion support opening multiple items at once?",
                        answer: "Toggle 'Multiple Open' in the Interaction settings to allow several answers to stay expanded simultaneously, or keep it off for a classic single-open accordion.",
                    },
                    {
                        question: "Is the animation customizable?",
                        answer: "Choose between Smooth, Snappy, or Bouncy spring presets to match the personality of your site.",
                    },
                    {
                        question: "What happens when a search has no results?",
                        answer: "A friendly empty state appears with an icon and message, letting users know to try a different search term.",
                    },
                ],
                maxCount: 30,
            },
            searchPlaceholder: {
                type: ControlType.String,
                title: "Search Placeholder",
                defaultValue: "Search FAQs...",
            },
            emptyStateTitle: {
                type: ControlType.String,
                title: "Empty Title",
                defaultValue: "No results found",
            },
            emptyStateSubtitle: {
                type: ControlType.String,
                title: "Empty Subtitle",
                defaultValue: "Try a different search term",
            },
        },
    },
    style: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            darkMode: {
                type: ControlType.Boolean,
                title: "Dark Mode",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: false,
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                displayTextAlign: false,
                defaultValue: {
                    fontFamily: "Inter, sans-serif",
                    fontSize: 16,
                },
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(0,0,0,0)",
            },
            cardColor: {
                type: ControlType.Color,
                title: "Card",
                defaultValue: "rgba(255,255,255,1)",
            },
            questionColor: {
                type: ControlType.Color,
                title: "Question",
                defaultValue: "rgba(20,20,20,1)",
            },
            answerColor: {
                type: ControlType.Color,
                title: "Answer",
                defaultValue: "rgba(100,100,100,1)",
            },
            accentColor: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: "rgba(90,90,240,1)",
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: "rgba(230,230,230,1)",
            },
            cornerRadius: {
                type: ControlType.Number,
                title: "Corner Radius",
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
                defaultValue: 12,
            },
            itemGap: {
                type: ControlType.Number,
                title: "Item Spacing",
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                defaultValue: 10,
            },
            itemPadding: {
                type: ControlType.Padding,
                title: "Item Padding",
                defaultValue: "16px 18px 16px 18px",
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Border Width",
                min: 0,
                max: 8,
                step: 1,
                unit: "px",
                defaultValue: 1,
            },
            shadow: {
                type: ControlType.BoxShadow,
                title: "Shadow",
                defaultValue: "0px 0px 0px 0px rgba(0,0,0,0)",
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        controls: {
            showSearch: {
                type: ControlType.Boolean,
                title: "Show Search",
                enabledTitle: "Visible",
                disabledTitle: "Hidden",
                defaultValue: true,
            },
            allowMultipleOpen: {
                type: ControlType.Boolean,
                title: "Multiple Open",
                enabledTitle: "Yes",
                disabledTitle: "No",
                defaultValue: false,
            },
            defaultOpenIndex: {
                type: ControlType.Number,
                title: "Default Open",
                min: -1,
                max: 30,
                step: 1,
                defaultValue: 0,
                description: "-1 = all closed",
            },
            animationSpeed: {
                type: ControlType.Enum,
                title: "Speed",
                options: ["smooth", "snappy", "bouncy"],
                optionTitles: ["Smooth", "Snappy", "Bouncy"],
                defaultValue: "smooth",
            },
        },
        description:
            "Explore more components by [Jonghyuk](https://www.framer.com/%40-wz74q/?tab=marketplace)",
    },
})
