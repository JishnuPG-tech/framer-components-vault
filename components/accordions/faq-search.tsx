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


/**
 * FAQSearch — a Framer code component.
 *
 * Paste the whole file into Framer:
 *   Assets > Code > New Code File > name it FAQSearch.tsx > paste > Save
 * Then drag "FAQSearch" from Assets onto any page.
 * Everything buyers change lives in the right-side Properties panel —
 * no canvas editing is needed. Properties are grouped as
 * Content / Appearance / Behaviour / Questions, using Framer
 * Object controls for the first three groups.
 */

interface FaqItem {
    question: string
    answer: string
    category: string
}

interface ContentProps {
    heading: string
    description: string
    searchPlaceholder: string
}

interface AppearanceProps {
    style: "Cards" | "Minimal" | "Divided"
    accent: string
    cornerRadius: number
}

interface BehaviourProps {
    showSearch: boolean
    showCategories: boolean
    showResultCount: boolean
    allowMultipleOpen: boolean
    openFirstByDefault: boolean
}

interface Props {
    content: ContentProps
    appearance: AppearanceProps
    behaviour: BehaviourProps
    questions: FaqItem[]
}

const DEFAULT_CONTENT: ContentProps = {
    heading: "Frequently asked questions",
    description: "Search below — find the answer in seconds.",
    searchPlaceholder: "Search questions…",
}

const DEFAULT_APPEARANCE: AppearanceProps = {
    style: "Cards",
    accent: "#ff5a1f",
    cornerRadius: 16,
}

const DEFAULT_BEHAVIOUR: BehaviourProps = {
    showSearch: true,
    showCategories: true,
    showResultCount: true,
    allowMultipleOpen: false,
    openFirstByDefault: true,
}

const DEFAULT_QUESTIONS: FaqItem[] = [
    {
        question: "How do I get started?",
        answer: "Add the component to your page, then edit the questions, answers and categories in the Properties panel. No code changes are needed.",
        category: "General",
    },
    {
        question: "Can I change the colours and corner radius?",
        answer: "Yes. Use the Accent colour and Corner radius controls in the Properties panel. The search highlight, category pills and icons all follow your accent colour.",
        category: "General",
    },
    {
        question: "How does the search work?",
        answer: "Visitors type any word and the list filters instantly across questions and answers. Matching words are highlighted, and the result count updates as they type.",
        category: "General",
    },
    {
        question: "What happens when there are no matches?",
        answer: "A friendly empty state appears with a reset button, so visitors can clear the search and category filter in one tap and see every question again.",
        category: "General",
    },
    {
        question: "How much does it cost?",
        answer: "Pricing is set on your Marketplace listing. This component itself has no subscription, no external requests and no tracking — it runs fully in the browser.",
        category: "Billing",
    },
    {
        question: "Can I get a refund?",
        answer: "Refunds follow the terms on your Marketplace listing. Because the component is a digital download, most creators offer a refund only if it is demonstrably defective and cannot be fixed.",
        category: "Billing",
    },
    {
        question: "Does it work on mobile?",
        answer: "Yes. The layout is fluid, the search field and category pills wrap on small screens, and every answer expands to full width. Test it at phone, tablet and desktop widths before publishing.",
        category: "Support",
    },
    {
        question: "Can I use it on more than one site?",
        answer: "That depends on the licence on your Marketplace listing. Most single-component licences cover the buyer's own projects; check your listing wording before you publish.",
        category: "Support",
    },
]

function highlight(text: string, query: string, accent: string) {
    const q = query.trim()
    if (!q) return text
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const parts = text.split(new RegExp(`(${escaped})`, "gi"))
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === q.toLowerCase() ? (
                    <mark
                        key={i}
                        style={{
                            background: accent,
                            color: "#fff",
                            borderRadius: 3,
                            padding: "0 2px",
                        }}
                    >
                        {part}
                    </mark>
                ) : (
                    <React.Fragment key={i}>{part}</React.Fragment>
                )
            )}
        </>
    )
}

export default function FAQSearch(props: Props) {
    const {
        content = DEFAULT_CONTENT,
        appearance = DEFAULT_APPEARANCE,
        behaviour = DEFAULT_BEHAVIOUR,
        questions = DEFAULT_QUESTIONS,
    } = props
    const {
        heading = DEFAULT_CONTENT.heading,
        description = DEFAULT_CONTENT.description,
        searchPlaceholder = DEFAULT_CONTENT.searchPlaceholder,
    } = content || DEFAULT_CONTENT
    const {
        style = DEFAULT_APPEARANCE.style,
        accent = DEFAULT_APPEARANCE.accent,
        cornerRadius = DEFAULT_APPEARANCE.cornerRadius,
    } = appearance || DEFAULT_APPEARANCE
    const {
        showSearch = DEFAULT_BEHAVIOUR.showSearch,
        showCategories = DEFAULT_BEHAVIOUR.showCategories,
        showResultCount = DEFAULT_BEHAVIOUR.showResultCount,
        allowMultipleOpen = DEFAULT_BEHAVIOUR.allowMultipleOpen,
        openFirstByDefault = DEFAULT_BEHAVIOUR.openFirstByDefault,
    } = behaviour || DEFAULT_BEHAVIOUR

    const list =
        questions && questions.length > 0 ? questions : DEFAULT_QUESTIONS
    const categories = React.useMemo(() => {
        const seen: string[] = []
        list.forEach((item) => {
            if (item.category && !seen.includes(item.category))
                seen.push(item.category)
        })
        return ["All", ...seen]
    }, [list])

    const [search, setSearch] = React.useState("")
    const [category, setCategory] = React.useState("All")
    const [open, setOpen] = React.useState<number[]>(() =>
        openFirstByDefault ? [0] : []
    )

    const filtered = React.useMemo(() => {
        const q = search.trim().toLowerCase()
        return list.filter((item) => {
            const inCategory = category === "All" || item.category === category
            const inSearch =
                !q ||
                item.question.toLowerCase().includes(q) ||
                item.answer.toLowerCase().includes(q)
            return inCategory && inSearch
        })
    }, [list, search, category])

    // Keep the open index valid when the visible list changes.
    const visibleOpen = open.filter((i) => i < filtered.length)

    function toggle(index: number) {
        if (allowMultipleOpen) {
            setOpen((prev) =>
                prev.includes(index)
                    ? prev.filter((i) => i !== index)
                    : [...prev, index]
            )
        } else {
            setOpen((prev) => (prev.includes(index) ? [] : [index]))
        }
    }

    function reset() {
        setSearch("")
        setCategory("All")
    }

    const isMinimal = style === "Minimal"
    const isDivided = style === "Divided"

    return (
        <div
            style={{
                width: "100%",
                fontFamily: "inherit",
                color: "#111827",
                background: "transparent",
            }}
        >
            <h2
                style={{
                    margin: "0 0 8px",
                    fontSize: 32,
                    lineHeight: 1.15,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                }}
            >
                {heading}
            </h2>
            {description ? (
                <p
                    style={{
                        margin: "0 0 24px",
                        fontSize: 16,
                        lineHeight: 1.5,
                        color: "#6b7280",
                    }}
                >
                    {description}
                </p>
            ) : null}

            {showSearch ? (
                <input
                    type="search"
                    value={search}
                    placeholder={searchPlaceholder}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search questions"
                    style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "14px 16px",
                        fontSize: 16,
                        fontFamily: "inherit",
                        border: "1px solid #e5e7eb",
                        borderRadius: cornerRadius,
                        outline: "none",
                        background: "#fff",
                    }}
                />
            ) : null}

            {showCategories ? (
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        marginTop: showSearch ? 16 : 0,
                    }}
                >
                    {categories.map((cat) => {
                        const active = category === cat
                        return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategory(cat)}
                                style={{
                                    cursor: "pointer",
                                    padding: "8px 14px",
                                    fontSize: 14,
                                    fontFamily: "inherit",
                                    fontWeight: active ? 700 : 500,
                                    color: active ? "#fff" : "#374151",
                                    background: active ? accent : "#f3f4f6",
                                    border: "1px solid transparent",
                                    borderRadius: 999,
                                }}
                            >
                                {cat}
                            </button>
                        )
                    })}
                </div>
            ) : null}

            {showResultCount ? (
                <p
                    style={{
                        margin: "16px 0 0",
                        fontSize: 14,
                        color: "#6b7280",
                    }}
                >
                    {filtered.length} result{filtered.length === 1 ? "" : "s"}
                    {search.trim() ? ` for “${search.trim()}”` : ""}
                </p>
            ) : null}

            <div
                style={{
                    marginTop: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: isMinimal || isDivided ? 0 : 12,
                    border: isDivided ? "1px solid #e5e7eb" : "none",
                    borderRadius: isDivided ? cornerRadius : 0,
                    overflow: isDivided ? "hidden" : "visible",
                    background: isDivided ? "#fff" : "transparent",
                }}
            >
                {filtered.length === 0 ? (
                    <div
                        style={{
                            padding: 32,
                            textAlign: "center",
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: cornerRadius,
                        }}
                    >
                        <p
                            style={{
                                margin: "0 0 8px",
                                fontSize: 18,
                                fontWeight: 700,
                            }}
                        >
                            No matches found
                        </p>
                        <p style={{ margin: "0 0 20px", color: "#6b7280" }}>
                            Try different words, or clear the filters to see
                            every question.
                        </p>
                        <button
                            type="button"
                            onClick={reset}
                            style={{
                                cursor: "pointer",
                                padding: "10px 18px",
                                fontSize: 14,
                                fontFamily: "inherit",
                                fontWeight: 700,
                                color: "#fff",
                                background: accent,
                                border: "none",
                                borderRadius: 999,
                            }}
                        >
                            Show all questions
                        </button>
                    </div>
                ) : (
                    filtered.map((item, index) => {
                        const isOpen = visibleOpen.includes(index)
                        return (
                            <div
                                key={`${item.question}-${index}`}
                                style={{
                                    background: isMinimal
                                        ? "transparent"
                                        : "#fff",
                                    border: isMinimal
                                        ? "none"
                                        : isDivided
                                          ? "none"
                                          : "1px solid #e5e7eb",
                                    borderTop:
                                        isDivided && index > 0
                                            ? "1px solid #e5e7eb"
                                            : undefined,
                                    borderBottom: isMinimal
                                        ? "1px solid #e5e7eb"
                                        : undefined,
                                    borderRadius:
                                        isMinimal || isDivided
                                            ? 0
                                            : cornerRadius,
                                    overflow: "hidden",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => toggle(index)}
                                    aria-expanded={isOpen}
                                    style={{
                                        width: "100%",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 16,
                                        padding: "18px 20px",
                                        fontSize: 16,
                                        fontFamily: "inherit",
                                        fontWeight: 600,
                                        textAlign: "left",
                                        color: "#111827",
                                        background: "transparent",
                                        border: "none",
                                    }}
                                >
                                    <span>
                                        {highlight(
                                            item.question,
                                            search,
                                            accent
                                        )}
                                    </span>
                                    <span
                                        style={{
                                            flexShrink: 0,
                                            width: 28,
                                            height: 28,
                                            display: "grid",
                                            placeItems: "center",
                                            fontSize: 20,
                                            lineHeight: 1,
                                            color: "#fff",
                                            background: accent,
                                            borderRadius: "50%",
                                            transform: isOpen
                                                ? "rotate(45deg)"
                                                : "rotate(0deg)",
                                            transition: "transform 0.2s ease",
                                        }}
                                    >
                                        +
                                    </span>
                                </button>
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateRows: isOpen
                                            ? "1fr"
                                            : "0fr",
                                        transition:
                                            "grid-template-rows 0.25s ease",
                                    }}
                                >
                                    <div style={{ overflow: "hidden" }}>
                                        <p
                                            style={{
                                                margin: 0,
                                                padding: "0 20px 20px",
                                                fontSize: 15,
                                                lineHeight: 1.6,
                                                color: "#4b5563",
                                            }}
                                        >
                                            {highlight(
                                                item.answer,
                                                search,
                                                accent
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

FAQSearch.defaultProps = {
    content: DEFAULT_CONTENT,
    appearance: DEFAULT_APPEARANCE,
    behaviour: DEFAULT_BEHAVIOUR,
    questions: DEFAULT_QUESTIONS,
}

addPropertyControls(FAQSearch, {
    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            heading: {
                type: ControlType.String,
                title: "Heading",
                defaultValue: "Frequently asked questions",
            },
            description: {
                type: ControlType.String,
                title: "Description",
                defaultValue: "Search below — find the answer in seconds.",
            },
            searchPlaceholder: {
                type: ControlType.String,
                title: "Search placeholder",
                defaultValue: "Search questions…",
            },
        },
        defaultValue: DEFAULT_CONTENT,
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["Cards", "Minimal", "Divided"],
                optionTitles: ["Cards", "Minimal", "Divided"],
                defaultValue: "Cards",
                displaySegmentedControl: true,
            },
            accent: {
                type: ControlType.Color,
                title: "Accent colour",
                defaultValue: "#ff5a1f",
            },
            cornerRadius: {
                type: ControlType.Number,
                title: "Corner radius",
                min: 0,
                max: 32,
                step: 1,
                defaultValue: 16,
                displayStepper: true,
            },
        },
        defaultValue: DEFAULT_APPEARANCE,
    },
    behaviour: {
        type: ControlType.Object,
        title: "Behaviour",
        controls: {
            showSearch: {
                type: ControlType.Boolean,
                title: "Show search",
                defaultValue: true,
            },
            showCategories: {
                type: ControlType.Boolean,
                title: "Show categories",
                defaultValue: true,
            },
            showResultCount: {
                type: ControlType.Boolean,
                title: "Show result count",
                defaultValue: true,
            },
            allowMultipleOpen: {
                type: ControlType.Boolean,
                title: "Allow multiple open",
                defaultValue: false,
            },
            openFirstByDefault: {
                type: ControlType.Boolean,
                title: "Open first by default",
                defaultValue: true,
            },
        },
        defaultValue: DEFAULT_BEHAVIOUR,
    },
    questions: {
        type: ControlType.Array,
        title: "Questions",
        control: {
            type: ControlType.Object,
            controls: {
                question: {
                    type: ControlType.String,
                    title: "Question",
                    defaultValue: "How do I get started?",
                },
                answer: {
                    type: ControlType.String,
                    title: "Answer",
                    defaultValue:
                        "Add the component to your page, then edit the questions in the Properties panel.",
                },
                category: {
                    type: ControlType.String,
                    title: "Category",
                    defaultValue: "General",
                },
            },
        },
        defaultValue: DEFAULT_QUESTIONS,
    },
})
