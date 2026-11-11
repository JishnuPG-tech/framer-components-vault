// AKFaq — Framer Code Component

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState } from "react"
import * as React from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface FAQItem {
    question: string
    answer: string
    category: string
}

interface Props {
    // Content
    badge: string
    heading: string
    subheading: string
    footerTitle: string
    footerSubtext: string
    footerButtonLabel: string
    footerButtonLink: string
    items: FAQItem[]

    // Layout & Sizing
    maxWidth: number
    itemGap: number
    paddingTop: number
    paddingBottom: number
    paddingHorizontal: number
    borderRadius: number

    // Colors
    accentColor: string
    questionColor: string
    answerColor: string
    itemBackground: string
    itemBorderColor: string
    badgeTextColor: string
    numberColor: string
    footerBackground: string

    // Typography — native Framer font objects
    headingFont: any
    questionFont: any
    answerFont: any
    headingSize: number
    questionSize: number
    answerSize: number

    // Features
    showSearch: boolean
    showTabs: boolean
    showNumbers: boolean
    showBadge: boolean
    showFooter: boolean
    allowMultipleOpen: boolean

    // Animation
    animationDuration: number
    animationEasing: string

    // Theme
    darkMode: boolean
}

// ─── Default FAQ Data ─────────────────────────────────────────────────────────

const defaultItems: FAQItem[] = [
    {
        question: "What is this component and how does it work?",
        answer: "A fully responsive FAQ accordion built for Framer. Each question expands smoothly to reveal its answer. Customize all text, colors, and animations directly from the properties panel — no code required.",
        category: "General",
    },
    {
        question: "Is this compatible with all Framer plans?",
        answer: "Yes, it works on all Framer plans including Free, Mini, Basic, Pro, and Enterprise. It uses standard Framer capabilities and needs no extra plugins.",
        category: "Pricing",
    },
    {
        question: "Can I customize colors and typography?",
        answer: "Absolutely. Every color, font size, border, spacing, and animation setting is exposed as a property control. Light and dark mode both work automatically.",
        category: "General",
    },
    {
        question: "Does it work on mobile and tablet?",
        answer: "Yes — fully responsive from 320px to 1440px. You can set a max-width and the layout adapts automatically. Touch interaction is optimized for mobile.",
        category: "General",
    },
    {
        question: "How do I add or remove questions?",
        answer: "Use the Items array in the property panel. Duplicate or delete entries as needed. The numbering and layout adjust automatically.",
        category: "General",
    },
    {
        question: "Can I use this for SaaS or e-commerce pages?",
        answer: "It's designed for exactly that. Product pages, onboarding flows, help centers, and pricing sections all benefit from a clean FAQ section.",
        category: "Integrations",
    },
    {
        question: "Is there support if I get stuck?",
        answer: "Documentation and a walkthrough video are included. Use the contact button below to reach the support team within 24 hours.",
        category: "Support",
    },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function AKFaq(props: Props) {
    const {
        badge,
        heading,
        subheading,
        footerTitle,
        footerSubtext,
        footerButtonLabel,
        footerButtonLink,
        items,
        maxWidth,
        itemGap,
        paddingTop,
        paddingBottom,
        paddingHorizontal,
        borderRadius,
        accentColor,
        questionColor,
        answerColor,
        itemBackground,
        itemBorderColor,
        badgeTextColor,
        numberColor,
        footerBackground,
        headingFont,
        questionFont,
        answerFont,
        headingSize,
        questionSize,
        answerSize,
        showSearch,
        showTabs,
        showNumbers,
        showBadge,
        showFooter,
        allowMultipleOpen,
        animationDuration,
        animationEasing,
        darkMode,
    } = props

    const [openItems, setOpenItems] = useState<Set<number>>(new Set())
    const [search, setSearch] = useState("")
    const [activeTab, setActiveTab] = useState("All")

    const dm = darkMode
    const categories = [
        "All",
        ...Array.from(new Set(items.map((i) => i.category).filter(Boolean))),
    ]

    const filtered = items.filter((item) => {
        const tabMatch = activeTab === "All" || item.category === activeTab
        const searchMatch =
            !search ||
            item.question.toLowerCase().includes(search.toLowerCase()) ||
            item.answer.toLowerCase().includes(search.toLowerCase())
        return tabMatch && searchMatch
    })

    const toggle = (idx: number) => {
        setOpenItems((prev) => {
            const next = new Set(prev)
            if (next.has(idx)) {
                next.delete(idx)
            } else {
                if (!allowMultipleOpen) next.clear()
                next.add(idx)
            }
            return next
        })
    }

    const palette = {
        bg: dm ? "#0f0f0f" : "transparent",
        text: dm ? "#f0f0f0" : questionColor,
        textMuted: dm ? "#888888" : answerColor,
        itemBg: dm ? "#1a1a1a" : itemBackground,
        border: dm ? "rgba(255,255,255,0.08)" : itemBorderColor,
        badgeBg: dm ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        badgeBorder: dm ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)",
        footerBg: dm ? "#161616" : footerBackground,
        inputBg: dm ? "#1a1a1a" : "#ffffff",
        inputBorder: dm ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)",
        tabActiveBg: dm ? "#f0f0f0" : "#0f0f0f",
        tabActiveText: dm ? "#0f0f0f" : "#ffffff",
        tabBorder: dm ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)",
    }

    const ease = animationEasing
    const dur = animationDuration

    return (
        <div
            style={{
                background: palette.bg,
                paddingTop,
                paddingBottom,
                paddingLeft: paddingHorizontal,
                paddingRight: paddingHorizontal,
                width: "100%",
                boxSizing: "border-box",
            }}
        >
            <div style={{ maxWidth, margin: "0 auto" }}>
                {/* ── Badge ── */}
                {showBadge && (
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 11,
                            fontWeight: 500,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: dm ? "#888888" : badgeTextColor,
                            background: palette.badgeBg,
                            border: `0.5px solid ${palette.badgeBorder}`,
                            borderRadius: 999,
                            padding: "4px 12px",
                            marginBottom: 16,
                        }}
                    >
                        <span
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: accentColor,
                                display: "inline-block",
                            }}
                        />
                        {badge}
                    </div>
                )}

                {/* ── Heading ── */}
                <h2
                    style={{
                        // Spread the native Framer font object — includes fontFamily, fontWeight, etc.
                        ...headingFont,
                        fontSize: headingSize,
                        color: palette.text,
                        lineHeight: 1.2,
                        marginBottom: 8,
                    }}
                >
                    {heading}
                </h2>

                {/* ── Subheading ── */}
                <p
                    style={{
                        ...answerFont,
                        fontSize: 14,
                        color: palette.textMuted,
                        marginBottom: 24,
                        lineHeight: 1.65,
                    }}
                >
                    {subheading}
                </p>

                {/* ── Search ── */}
                {showSearch && (
                    <div style={{ position: "relative", marginBottom: 16 }}>
                        <svg
                            width={14}
                            height={14}
                            viewBox="0 0 16 16"
                            fill="none"
                            style={{
                                position: "absolute",
                                left: 11,
                                top: "50%",
                                transform: "translateY(-50%)",
                                pointerEvents: "none",
                            }}
                        >
                            <circle
                                cx="6.5"
                                cy="6.5"
                                r="5"
                                stroke={palette.textMuted}
                                strokeWidth="1.3"
                            />
                            <line
                                x1="10.5"
                                y1="10.5"
                                x2="14"
                                y2="14"
                                stroke={palette.textMuted}
                                strokeWidth="1.3"
                                strokeLinecap="round"
                            />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search questions…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: "100%",
                                ...questionFont,
                                fontSize: 13.5,
                                padding: "9px 12px 9px 36px",
                                borderRadius,
                                border: `0.5px solid ${palette.inputBorder}`,
                                background: palette.inputBg,
                                color: palette.text,
                                outline: "none",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>
                )}

                {/* ── Category Tabs ── */}
                {showTabs && categories.length > 1 && (
                    <div
                        style={{
                            display: "flex",
                            gap: 6,
                            flexWrap: "wrap",
                            marginBottom: 20,
                        }}
                    >
                        {categories.map((cat) => {
                            const isActive = activeTab === cat
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setActiveTab(cat)}
                                    style={{
                                        ...questionFont,
                                        fontSize: 12,
                                        fontWeight: 500,
                                        padding: "5px 14px",
                                        borderRadius: 999,
                                        border: `0.5px solid ${isActive ? palette.tabActiveBg : palette.tabBorder}`,
                                        background: isActive
                                            ? palette.tabActiveBg
                                            : "transparent",
                                        color: isActive
                                            ? palette.tabActiveText
                                            : palette.textMuted,
                                        cursor: "pointer",
                                        transition: `all ${dur}ms ${ease}`,
                                    }}
                                >
                                    {cat}
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* ── FAQ Items ── */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: itemGap,
                    }}
                >
                    {filtered.length === 0 ? (
                        <p
                            style={{
                                textAlign: "center",
                                padding: "2rem 1rem",
                                fontSize: 13,
                                color: palette.textMuted,
                                ...questionFont,
                            }}
                        >
                            No questions match your search.
                        </p>
                    ) : (
                        filtered.map((item, i) => {
                            const isOpen = openItems.has(i)
                            return (
                                <div
                                    key={i}
                                    style={{
                                        borderRadius,
                                        border: `0.5px solid ${isOpen ? accentColor + "55" : palette.border}`,
                                        background: palette.itemBg,
                                        overflow: "hidden",
                                        transition: `border-color ${dur}ms ${ease}`,
                                    }}
                                >
                                    {/* Question row */}
                                    <button
                                        onClick={() => toggle(i)}
                                        aria-expanded={isOpen}
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 12,
                                            padding: "14px 16px",
                                            ...questionFont,
                                            fontSize: questionSize,
                                            fontWeight: 500,
                                            color: palette.text,
                                            background: "transparent",
                                            border: "none",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: 10,
                                                flex: 1,
                                            }}
                                        >
                                            {showNumbers && (
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 500,
                                                        color:
                                                            numberColor ||
                                                            palette.textMuted,
                                                        minWidth: 22,
                                                        paddingTop: 1,
                                                    }}
                                                >
                                                    {String(i + 1).padStart(
                                                        2,
                                                        "0"
                                                    )}
                                                </span>
                                            )}
                                            <span style={{ flex: 1 }}>
                                                {item.question}
                                            </span>
                                        </div>

                                        {/* ± Icon */}
                                        <div
                                            style={{
                                                width: 22,
                                                height: 22,
                                                borderRadius: "50%",
                                                border: `0.5px solid ${isOpen ? accentColor : palette.border}`,
                                                background: isOpen
                                                    ? accentColor
                                                    : "transparent",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                                transform: isOpen
                                                    ? "rotate(45deg)"
                                                    : "rotate(0deg)",
                                                transition: `all ${dur}ms ${ease}`,
                                            }}
                                        >
                                            <svg
                                                width={10}
                                                height={10}
                                                viewBox="0 0 10 10"
                                                fill="none"
                                            >
                                                <line
                                                    x1="5"
                                                    y1="1"
                                                    x2="5"
                                                    y2="9"
                                                    stroke={
                                                        isOpen
                                                            ? "#fff"
                                                            : palette.text
                                                    }
                                                    strokeWidth="1.4"
                                                    strokeLinecap="round"
                                                />
                                                <line
                                                    x1="1"
                                                    y1="5"
                                                    x2="9"
                                                    y2="5"
                                                    stroke={
                                                        isOpen
                                                            ? "#fff"
                                                            : palette.text
                                                    }
                                                    strokeWidth="1.4"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        </div>
                                    </button>

                                    {/* Answer */}
                                    <div
                                        style={{
                                            maxHeight: isOpen ? 400 : 0,
                                            overflow: "hidden",
                                            opacity: isOpen ? 1 : 0,
                                            transition: `max-height ${dur}ms ${ease}, opacity ${Math.round(dur * 0.7)}ms ${ease}`,
                                        }}
                                    >
                                        <div
                                            style={{
                                                padding: `0 16px 16px ${showNumbers ? "48px" : "16px"}`,
                                                ...answerFont,
                                                fontSize: answerSize,
                                                lineHeight: 1.75,
                                                color: palette.textMuted,
                                            }}
                                        >
                                            {item.answer}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* ── Footer CTA ── */}
                {showFooter && (
                    <div
                        style={{
                            marginTop: 24,
                            padding: "16px 20px",
                            borderRadius,
                            border: `0.5px solid ${palette.border}`,
                            background: palette.footerBg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            flexWrap: "wrap",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                            }}
                        >
                            <span
                                style={{
                                    ...questionFont,
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: palette.text,
                                    lineHeight: 1.4,
                                }}
                            >
                                {footerTitle}
                            </span>
                            {footerSubtext ? (
                                <span
                                    style={{
                                        ...answerFont,
                                        fontSize: 12,
                                        color: palette.textMuted,
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {footerSubtext}
                                </span>
                            ) : null}
                        </div>

                        {/*
                         * ControlType.Link returns a plain URL string.
                         * Rendered as <a> so the link works natively in Framer's published site.
                         * rel="noopener noreferrer" prevents tab-napping on target="_blank".
                         */}
                        <a
                            href={footerButtonLink || undefined}
                            target={footerButtonLink ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            style={{
                                ...questionFont,
                                fontSize: 12,
                                fontWeight: 500,
                                padding: "7px 16px",
                                borderRadius,
                                border: `0.5px solid ${palette.border}`,
                                background: palette.itemBg,
                                color: palette.text,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                textDecoration: "none",
                                display: "inline-block",
                            }}
                        >
                            {footerButtonLabel}
                        </a>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Default Props ────────────────────────────────────────────────────────────

AKFaq.defaultProps = {
    badge: "FAQ",
    heading: "Frequently Asked Questions",
    subheading:
        "Everything you need to know. Can't find the answer? Contact our team.",
    footerTitle: "Still have questions?",
    footerSubtext: "We're here to help.",
    footerButtonLabel: "Contact Support →",
    footerButtonLink: "",
    items: defaultItems,

    maxWidth: 760,
    itemGap: 4,
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 24,
    borderRadius: 10,

    accentColor: "#1D9E75",
    questionColor: "#0f0f0f",
    answerColor: "#666666",
    itemBackground: "#ffffff",
    itemBorderColor: "rgba(0,0,0,0.08)",
    badgeTextColor: "#888888",
    numberColor: "#bbbbbb",
    footerBackground: "#f7f7f5",

    // Default font objects — Framer will merge these with its own font system
    headingFont: { fontFamily: "'Space Grotesk', system-ui, sans-serif" },
    questionFont: { fontFamily: "'Space Grotesk', system-ui, sans-serif" },
    answerFont: { fontFamily: "'Space Grotesk', system-ui, sans-serif" },

    headingSize: 28,
    questionSize: 14,
    answerSize: 13.5,

    showSearch: true,
    showTabs: true,
    showNumbers: true,
    showBadge: true,
    showFooter: true,
    allowMultipleOpen: false,

    animationDuration: 320,
    animationEasing: "cubic-bezier(0.4, 0, 0.2, 1)",

    darkMode: false,
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(AKFaq, {
    // ── CONTENT ──────────────────────────────────────────
    badge: {
        title: "Badge Label",
        type: ControlType.String,
        defaultValue: "FAQ",
    },
    heading: {
        title: "Heading",
        type: ControlType.String,
        defaultValue: "Frequently Asked Questions",
    },
    subheading: {
        title: "Subheading",
        type: ControlType.String,
        defaultValue: "Everything you need to know.",
        displayTextArea: true,
    },
    items: {
        title: "FAQ Items",
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                question: {
                    title: "Question",
                    type: ControlType.String,
                    defaultValue: "Your question here?",
                },
                answer: {
                    title: "Answer",
                    type: ControlType.String,
                    defaultValue: "Your answer here.",
                    displayTextArea: true,
                },
                category: {
                    title: "Category",
                    type: ControlType.String,
                    defaultValue: "General",
                },
            },
        },
    },

    // ── FOOTER ───────────────────────────────────────────
    footerTitle: {
        title: "Footer Title",
        type: ControlType.String,
        defaultValue: "Still have questions?",
    },
    footerSubtext: {
        title: "Footer Subtext",
        type: ControlType.String,
        defaultValue: "We're here to help.",
    },
    footerButtonLabel: {
        title: "Button Label",
        type: ControlType.String,
        defaultValue: "Contact Support →",
    },
    // ControlType.Link — renders as a native Framer link picker in the panel
    footerButtonLink: {
        title: "Button Link",
        type: ControlType.Link,
    },

    // ── LAYOUT ───────────────────────────────────────────
    maxWidth: {
        title: "Max Width",
        type: ControlType.Number,
        defaultValue: 760,
        min: 320,
        max: 1200,
        step: 10,
        unit: "px",
    },
    paddingTop: {
        title: "Padding Top",
        type: ControlType.Number,
        defaultValue: 48,
        min: 0,
        max: 120,
        step: 4,
        unit: "px",
    },
    paddingBottom: {
        title: "Padding Bottom",
        type: ControlType.Number,
        defaultValue: 48,
        min: 0,
        max: 120,
        step: 4,
        unit: "px",
    },
    paddingHorizontal: {
        title: "Padding H",
        type: ControlType.Number,
        defaultValue: 24,
        min: 0,
        max: 80,
        step: 4,
        unit: "px",
    },
    itemGap: {
        title: "Item Gap",
        type: ControlType.Number,
        defaultValue: 4,
        min: 0,
        max: 24,
        step: 2,
        unit: "px",
    },
    borderRadius: {
        title: "Border Radius",
        type: ControlType.Number,
        defaultValue: 10,
        min: 0,
        max: 24,
        step: 1,
        unit: "px",
    },

    // ── COLORS ───────────────────────────────────────────
    accentColor: {
        title: "Accent Color",
        type: ControlType.Color,
        defaultValue: "#1D9E75",
    },
    badgeTextColor: {
        title: "Badge Text",
        type: ControlType.Color,
        defaultValue: "#888888",
    },
    questionColor: {
        title: "Question Color",
        type: ControlType.Color,
        defaultValue: "#0f0f0f",
    },
    answerColor: {
        title: "Answer Color",
        type: ControlType.Color,
        defaultValue: "#666666",
    },
    itemBackground: {
        title: "Item Background",
        type: ControlType.Color,
        defaultValue: "#ffffff",
    },
    itemBorderColor: {
        title: "Item Border",
        type: ControlType.Color,
        defaultValue: "rgba(0,0,0,0.08)",
    },
    numberColor: {
        title: "Number Color",
        type: ControlType.Color,
        defaultValue: "#bbbbbb",
    },
    footerBackground: {
        title: "Footer Background",
        type: ControlType.Color,
        defaultValue: "#f7f7f5",
    },

    // ── TYPOGRAPHY — native Framer font pickers ───────────
    headingFont: {
        title: "Heading Font",
        // @ts-ignore — ControlType.Font is valid in Framer but not yet in the public TS types
        type: ControlType.Font,
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 28, fontWeight: 600 },
    },
    questionFont: {
        title: "Question Font",
        // @ts-ignore
        type: ControlType.Font,
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 14, fontWeight: 500 },
    },
    answerFont: {
        title: "Answer Font",
        // @ts-ignore
        type: ControlType.Font,
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 13, fontWeight: 400 },
    },

    // Size overrides (still useful for fine-tuning independently of the font picker)
    headingSize: {
        title: "Heading Size",
        type: ControlType.Number,
        defaultValue: 28,
        min: 18,
        max: 56,
        step: 1,
        unit: "px",
    },
    questionSize: {
        title: "Question Size",
        type: ControlType.Number,
        defaultValue: 14,
        min: 12,
        max: 22,
        step: 1,
        unit: "px",
    },
    answerSize: {
        title: "Answer Size",
        type: ControlType.Number,
        defaultValue: 13.5,
        min: 11,
        max: 18,
        step: 0.5,
        unit: "px",
    },

    // ── FEATURES ─────────────────────────────────────────
    showBadge: {
        title: "Badge",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "Visible",
        disabledTitle: "Hidden",
    },
    showSearch: {
        title: "Search Bar",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "Visible",
        disabledTitle: "Hidden",
    },
    showTabs: {
        title: "Category Tabs",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "Visible",
        disabledTitle: "Hidden",
    },
    showNumbers: {
        title: "Numbers",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "Visible",
        disabledTitle: "Hidden",
    },
    showFooter: {
        title: "Footer",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "Visible",
        disabledTitle: "Hidden",
    },
    allowMultipleOpen: {
        title: "Multi-expand",
        type: ControlType.Boolean,
        defaultValue: false,
        enabledTitle: "Allow",
        disabledTitle: "One at a time",
    },

    // ── ANIMATION ────────────────────────────────────────
    animationDuration: {
        title: "Duration",
        type: ControlType.Number,
        defaultValue: 320,
        min: 100,
        max: 800,
        step: 20,
        unit: "ms",
    },
    animationEasing: {
        title: "Easing",
        type: ControlType.Enum,
        defaultValue: "cubic-bezier(0.4, 0, 0.2, 1)",
        options: [
            "cubic-bezier(0.4, 0, 0.2, 1)",
            "ease",
            "ease-in",
            "ease-out",
            "ease-in-out",
            "linear",
            "cubic-bezier(0.34, 1.56, 0.64, 1)",
        ],
        optionTitles: [
            "Smooth (default)",
            "Ease",
            "Ease In",
            "Ease Out",
            "Ease In Out",
            "Linear",
            "Spring Bounce",
        ],
    },

    // ── THEME ────────────────────────────────────────────
    darkMode: {
        title: "Dark Mode",
        type: ControlType.Boolean,
        defaultValue: false,
        enabledTitle: "Dark",
        disabledTitle: "Light",
    },
})
