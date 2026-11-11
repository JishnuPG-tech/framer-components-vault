import {
    useState,
    useMemo,
    startTransition,
    type CSSProperties,
    type ChangeEvent,
} from "react"
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

interface FAQItem {
    question: string
    answer: string
    category: string
}

interface FAQProps {
    content: {
        items: FAQItem[]
        showSearch: boolean
        searchPlaceholder: string
        showCategories: boolean
    }
    animation: {
        speed: number
    }
    colors: {
        background: string
        question: string
        answer: string
        accent: string
        border: string
        searchBackground: string
        categoryActive: string
        categoryInactive: string
    }
    fonts: {
        question: CSSProperties
        answer: CSSProperties
        category: CSSProperties
    }
    layout: {
        borderRadius: number
        spacing: number
    }
    style?: CSSProperties
}

function getByPath(obj: any, path: string) {
    if (!obj || typeof obj !== "object") return undefined
    if (!path) return undefined
    if (!path.includes(".")) return obj?.[path]
    return path
        .split(".")
        .reduce((acc: any, key) => (acc == null ? undefined : acc?.[key]), obj)
}

/**
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SmartFAQ(props: FAQProps) {
    const { content, animation, colors, fonts, layout } = props

    const { items, searchPlaceholder, showSearch, showCategories } = content

    const { speed: animationSpeed } = animation

    const {
        background: backgroundColor,
        question: questionColor,
        answer: answerColor,
        accent: accentColor,
        border: borderColor,
        searchBackground: searchBackgroundColor,
        categoryActive: categoryActiveColor,
        categoryInactive: categoryInactiveColor,
    } = colors

    const {
        question: questionFont,
        answer: answerFont,
        category: categoryFont,
    } = fonts

    const { borderRadius, spacing } = layout

    const effectiveItems = useMemo(() => {
        if (!Array.isArray(items)) return []

        return items
            .map((item: any) => {
                if (!item) return null

                let question =
                    typeof item.question === "string" ? item.question : ""
                let answer = typeof item.answer === "string" ? item.answer : ""
                let category =
                    typeof item.category === "string" && item.category.trim()
                        ? item.category
                        : ""

                if (!question) {
                    question =
                        getByPath(item, "title") ||
                        getByPath(item, "name") ||
                        getByPath(item, "question") ||
                        getByPath(item, "fields.question") ||
                        getByPath(item, "fields.title") ||
                        ""
                }

                if (!answer) {
                    answer =
                        getByPath(item, "description") ||
                        getByPath(item, "content") ||
                        getByPath(item, "answer") ||
                        getByPath(item, "fields.answer") ||
                        getByPath(item, "fields.description") ||
                        getByPath(item, "fields.content") ||
                        ""
                }

                if (!category) {
                    category =
                        getByPath(item, "category") ||
                        getByPath(item, "tag") ||
                        getByPath(item, "type") ||
                        getByPath(item, "fields.category") ||
                        getByPath(item, "fields.tag") ||
                        "General"
                }

                if (!question || !answer) {
                    return null
                }

                return {
                    question: String(question),
                    answer: String(answer),
                    category: String(category),
                } as FAQItem
            })
            .filter(Boolean) as FAQItem[]
    }, [items])

    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

    const categories = useMemo(() => {
        const cats = [
            "All",
            ...new Set(
                effectiveItems.map((item) => item.category).filter(Boolean)
            ),
        ]
        return cats
    }, [effectiveItems])

    const filteredItems = useMemo(() => {
        return effectiveItems.filter((item) => {
            const matchesSearch =
                searchQuery === "" ||
                item.question
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                item.answer.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory =
                selectedCategory === "All" || item.category === selectedCategory
            return matchesSearch && matchesCategory
        })
    }, [effectiveItems, searchQuery, selectedCategory])

    const handleToggle = (index: number) => {
        startTransition(() => {
            setExpandedIndex(expandedIndex === index ? null : index)
        })
    }

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        startTransition(() => {
            setSearchQuery(e.target.value)
        })
    }

    const handleCategoryClick = (category: string) => {
        startTransition(() => {
            setSelectedCategory(category)
            setExpandedIndex(null)
        })
    }

    const isFixedHeight = props?.style && props.style.height === "100%"

    const responsiveSpacing =
        typeof window !== "undefined" && window.innerWidth < 768
            ? Math.max(spacing / 2, 8)
            : spacing
    const responsivePadding =
        typeof window !== "undefined" && window.innerWidth < 768
            ? "10px 12px"
            : "12px 16px"
    const responsiveButtonPadding =
        typeof window !== "undefined" && window.innerWidth < 768
            ? "12px 16px"
            : "16px 20px"
    const responsiveAnswerPadding =
        typeof window !== "undefined" && window.innerWidth < 768
            ? "0 16px 12px 16px"
            : "0 20px 16px 20px"

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                ...(isFixedHeight
                    ? { height: "100%" }
                    : { minHeight: "max-content" }),
                display: "flex",
                flexDirection: "column",
                gap: responsiveSpacing,
                padding: responsiveSpacing,
                backgroundColor: backgroundColor,
                borderRadius: borderRadius,
                overflow: "visible",

                scrollbarWidth: "none",
                msOverflowStyle: "none",
            }}
        >
            <style>{`
                div::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            {showSearch && (
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={handleSearchChange}
                    style={{
                        width: "100%",
                        padding: responsivePadding,
                        backgroundColor: searchBackgroundColor,
                        border: `1px solid ${borderColor}`,
                        borderRadius: borderRadius,
                        fontSize:
                            typeof window !== "undefined" &&
                            window.innerWidth < 768
                                ? "14px"
                                : "15px",
                        color: questionColor,
                        outline: "none",
                        transition: "border-color 0.2s",
                        boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = accentColor
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = borderColor
                    }}
                />
            )}

            {showCategories && (
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap:
                            typeof window !== "undefined" &&
                            window.innerWidth < 768
                                ? 6
                                : 8,
                    }}
                >
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => handleCategoryClick(category)}
                            style={{
                                padding:
                                    typeof window !== "undefined" &&
                                    window.innerWidth < 768
                                        ? "6px 12px"
                                        : "8px 16px",
                                backgroundColor:
                                    selectedCategory === category
                                        ? categoryActiveColor
                                        : categoryInactiveColor,
                                color:
                                    selectedCategory === category
                                        ? "#FFFFFF"
                                        : questionColor,
                                border: "none",
                                borderRadius: borderRadius / 2,
                                cursor: "pointer",
                                transition: "all 0.2s",
                                ...categoryFont,
                                fontSize:
                                    typeof window !== "undefined" &&
                                    window.innerWidth < 768
                                        ? "13px"
                                        : categoryFont.fontSize,
                            }}
                            onMouseEnter={(e) => {
                                if (selectedCategory !== category) {
                                    e.currentTarget.style.backgroundColor =
                                        accentColor
                                    e.currentTarget.style.color = "#FFFFFF"
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedCategory !== category) {
                                    e.currentTarget.style.backgroundColor =
                                        categoryInactiveColor
                                    e.currentTarget.style.color = questionColor
                                }
                            }}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            )}

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: responsiveSpacing / 2,
                }}
            >
                {filteredItems.length === 0 ? (
                    <div
                        style={{
                            padding:
                                typeof window !== "undefined" &&
                                window.innerWidth < 768
                                    ? 16
                                    : 24,
                            textAlign: "center",
                            color: answerColor,
                            ...answerFont,
                            fontSize:
                                typeof window !== "undefined" &&
                                window.innerWidth < 768
                                    ? "14px"
                                    : answerFont.fontSize,
                        }}
                    >
                        No questions found matching your search.
                    </div>
                ) : (
                    filteredItems.map((item, index) => (
                        <div
                            key={index}
                            style={{
                                backgroundColor: backgroundColor,
                                border: `1px solid ${borderColor}`,
                                borderRadius: borderRadius,
                                overflow: "hidden",
                            }}
                        >
                            <button
                                onClick={() => handleToggle(index)}
                                style={{
                                    width: "100%",
                                    padding: responsiveButtonPadding,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    backgroundColor: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    transition: "background-color 0.2s",
                                    boxSizing: "border-box",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        searchBackgroundColor
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        "transparent"
                                }}
                            >
                                <span
                                    style={{
                                        color: questionColor,
                                        flex: 1,
                                        ...questionFont,
                                        fontSize:
                                            typeof window !== "undefined" &&
                                            window.innerWidth < 768
                                                ? "14px"
                                                : questionFont.fontSize,
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {item.question}
                                </span>
                                <motion.svg
                                    width={
                                        typeof window !== "undefined" &&
                                        window.innerWidth < 768
                                            ? "16"
                                            : "20"
                                    }
                                    height={
                                        typeof window !== "undefined" &&
                                        window.innerWidth < 768
                                            ? "16"
                                            : "20"
                                    }
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    style={{
                                        flexShrink: 0,
                                        marginLeft:
                                            typeof window !== "undefined" &&
                                            window.innerWidth < 768
                                                ? 8
                                                : 12,
                                    }}
                                    animate={{
                                        rotate:
                                            expandedIndex === index ? 180 : 0,
                                    }}
                                    transition={{
                                        duration: animationSpeed,
                                    }}
                                >
                                    <path
                                        d="M5 7.5L10 12.5L15 7.5"
                                        stroke={accentColor}
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </motion.svg>
                            </button>
                            <AnimatePresence initial={false}>
                                {expandedIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{
                                            duration: animationSpeed,
                                            ease: "easeInOut",
                                        }}
                                        style={{
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                padding:
                                                    responsiveAnswerPadding,
                                                color: answerColor,
                                                borderTop: `1px solid ${borderColor}`,
                                                paddingTop:
                                                    typeof window !==
                                                        "undefined" &&
                                                    window.innerWidth < 768
                                                        ? 12
                                                        : 16,
                                                ...answerFont,
                                                fontSize:
                                                    typeof window !==
                                                        "undefined" &&
                                                    window.innerWidth < 768
                                                        ? "14px"
                                                        : answerFont.fontSize,
                                                wordBreak: "break-word",
                                            }}
                                        >
                                            {item.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

addPropertyControls(SmartFAQ, {
    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            items: {
                type: ControlType.Array,
                title: "FAQ Items",
                control: {
                    type: ControlType.Object,
                    controls: {
                        question: {
                            type: ControlType.String,
                            title: "Question",
                            defaultValue: "What is your question?",
                        },
                        answer: {
                            type: ControlType.String,
                            title: "Answer",
                            defaultValue: "Your answer here.",
                            displayTextArea: true,
                        },
                        category: {
                            type: ControlType.String,
                            title: "Category",
                            defaultValue: "General",
                        },
                    },
                },
                defaultValue: [
                    {
                        question: "What is Framer?",
                        answer: "Framer is a powerful design and prototyping tool that allows you to create interactive designs and websites.",
                        category: "General",
                    },
                    {
                        question: "How do I create components?",
                        answer: "You can create components using React and TypeScript, with full access to Framer's property controls.",
                        category: "Development",
                    },
                    {
                        question: "Can I use custom code?",
                        answer: "Yes! Framer supports custom React components with full TypeScript support.",
                        category: "Development",
                    },
                    {
                        question: "Is Framer free?",
                        answer: "Framer offers a free plan with basic features, and paid plans with advanced capabilities.",
                        category: "Pricing",
                    },
                    {
                        question: "What browsers are supported?",
                        answer: "Framer works on all modern browsers including Chrome, Firefox, Safari, and Edge.",
                        category: "General",
                    },
                ],
            },
            showSearch: {
                type: ControlType.Boolean,
                title: "Show Search",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            searchPlaceholder: {
                type: ControlType.String,
                title: "Search Placeholder",
                defaultValue: "Search questions...",
                hidden: ({ showSearch }) => !showSearch,
            },
            showCategories: {
                type: ControlType.Boolean,
                title: "Show Categories",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
        },
    },
    animation: {
        type: ControlType.Object,
        title: "Animation",
        controls: {
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 0.3,
                min: 0.1,
                max: 1,
                step: 0.1,
                unit: "s",
            },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#FFFFFF",
            },
            question: {
                type: ControlType.Color,
                title: "Question",
                defaultValue: "#000000",
            },
            answer: {
                type: ControlType.Color,
                title: "Answer",
                defaultValue: "#666666",
            },
            accent: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: "#0099FF",
            },
            border: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: "#EEEEEE",
            },
            searchBackground: {
                type: ControlType.Color,
                title: "Search Background",
                defaultValue: "#F5F5F5",
            },
            categoryActive: {
                type: ControlType.Color,
                title: "Category Active",
                defaultValue: "#0099FF",
            },
            categoryInactive: {
                type: ControlType.Color,
                title: "Category Inactive",
                defaultValue: "#F5F5F5",
            },
        },
    },
    fonts: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            question: {
                type: ControlType.Font,
                title: "Question",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "15px",
                    variant: "Semibold",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.3em",
                },
            },
            answer: {
                type: ControlType.Font,
                title: "Answer",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "15px",
                    variant: "Medium",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.5em",
                },
            },
            category: {
                type: ControlType.Font,
                title: "Category",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Medium",
                    letterSpacing: "-0.01em",
                    lineHeight: "1em",
                },
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            borderRadius: {
                type: ControlType.Number,
                title: "Border Radius",
                defaultValue: 8,
                min: 0,
                max: 24,
                step: 1,
                unit: "px",
            },
            spacing: {
                type: ControlType.Number,
                title: "Spacing",
                defaultValue: 16,
                min: 8,
                max: 32,
                step: 4,
                unit: "px",
            },
        },
    },
})
