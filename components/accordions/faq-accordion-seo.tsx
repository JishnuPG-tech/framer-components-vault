import React, {
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback,
    useLayoutEffect,
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

// ########
// Icons
// ########

const ChevronIcon = ({ color, size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M6 9L12 15L18 9"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const PlusIcon = ({ color, size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M12 5V19M5 12H19"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const MinusIcon = ({ color, size = 20 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M5 12H19"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const SearchIcon = ({ color, size = 18 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const ClearIcon = ({ color, size = 16 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M18 6L6 18M6 6L18 18"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const CopyIcon = ({ color, size = 16 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect
            x="9"
            y="9"
            width="13"
            height="13"
            rx="2"
            stroke={color}
            strokeWidth="2"
        />
        <path
            d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5"
            stroke={color}
            strokeWidth="2"
        />
    </svg>
)

const CheckIcon = ({ color, size = 16 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M20 6L9 17L4 12"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const ThumbsUpIcon = ({ color, size = 14 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M7 22H4C3.46957 22 2.96086 21.7893 2.58579 21.4142C2.21071 21.0391 2 20.5304 2 20V13C2 12.4696 2.21071 11.9609 2.58579 11.5858C2.96086 11.2107 3.46957 11 4 11H7M14 9V5C14 4.20435 13.6839 3.44129 13.1213 2.87868C12.5587 2.31607 11.7956 2 11 2L7 11V22H18.28C18.7623 22.0055 19.2304 21.8364 19.5979 21.524C19.9654 21.2116 20.2077 20.7769 20.28 20.3L21.66 11.3C21.7035 11.0134 21.6842 10.7207 21.6033 10.4423C21.5225 10.1638 21.3821 9.90629 21.1919 9.68751C21.0016 9.46873 20.7661 9.29393 20.5016 9.17522C20.2371 9.0565 19.9499 8.99672 19.66 9H14Z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const ThumbsDownIcon = ({ color, size = 14 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M17 2H19.67C20.236 1.98999 20.7859 2.18813 21.2154 2.55681C21.6449 2.92549 21.9241 3.43905 22 4V11C21.9241 11.5609 21.6449 12.0745 21.2154 12.4432C20.7859 12.8119 20.236 13.01 19.67 13H17M10 15V19C10 19.7956 10.3161 20.5587 10.8787 21.1213C11.4413 21.6839 12.2044 22 13 22L17 13V2H5.72C5.23767 1.99454 4.76965 2.16359 4.40209 2.47599C4.03452 2.78839 3.79218 3.22309 3.72 3.7L2.34 12.7C2.29651 12.9866 2.31583 13.2793 2.39666 13.5577C2.4775 13.8362 2.61788 14.0937 2.80814 14.3125C2.9984 14.5313 3.23394 14.7061 3.49843 14.8248C3.76293 14.9435 4.05009 15.0033 4.34 15H10Z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const ExternalLinkIcon = ({ color, size = 14 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11M15 3H21M21 3V9M21 3L10 14"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

// ########
// Reactions Hook
// ########

function useReactions(storageKey: string, items: any[] = []) {
    const [reactions, setReactions] = useState<
        Record<number, { up: number; down: number; userVote: string | null }>
    >({})

    useEffect(() => {
        try {
            const stored = localStorage.getItem(storageKey)
            if (stored) setReactions(JSON.parse(stored))
        } catch {}
    }, [storageKey])

    const vote = useCallback(
        (index: number, type: "up" | "down") => {
            setReactions((prev) => {
                const current = prev[index] ?? {
                    up: 0,
                    down: 0,
                    userVote: null,
                }
                let next = { ...current }
                if (current.userVote === type) {
                    next[type] = Math.max(0, next[type] - 1)
                    next.userVote = null
                } else {
                    if (current.userVote) {
                        next[current.userVote as "up" | "down"] = Math.max(
                            0,
                            next[current.userVote as "up" | "down"] - 1
                        )
                    }
                    next[type] = next[type] + 1
                    next.userVote = type
                }
                const updated = { ...prev, [index]: next }
                try {
                    localStorage.setItem(storageKey, JSON.stringify(updated))
                } catch {}

                // Google Analytics event
                try {
                    const w = window as any
                    if (w.gtag) {
                        w.gtag("event", "faq_reaction", {
                            question:
                                items[index]?.question ??
                                `Question ${index + 1}`,
                            reaction: type,
                        })
                    }
                } catch {}

                return updated
            })
        },
        [storageKey, items]
    )

    const getReaction = useCallback(
        (index: number) => {
            return reactions[index] ?? { up: 0, down: 0, userVote: null }
        },
        [reactions]
    )

    return { vote, getReaction }
}

// ########
// Markdown Parser
// ########

function parseMarkdown(text: string): string {
    if (!text) return ""
    let html = text
        // Headings (### > ## > #)
        .replace(/^### (.+)$/gm, "<h4>$1</h4>")
        .replace(/^## (.+)$/gm, "<h3>$1</h3>")
        .replace(/^# (.+)$/gm, "<h2>$1</h2>")
        // Blockquotes
        .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
        // Bold + Italic
        .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
        // Bold
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        // Italic
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        // Inline code
        .replace(/`(.+?)`/g, "<code>$1</code>")
        // Links
        .replace(
            /\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
        )
        // Ordered list items (temporary tag)
        .replace(/^\d+\. (.+)$/gm, "<oli>$1</oli>")
        // Unordered list items
        .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
        // Line breaks
        .replace(/\n\n/g, "<br/><br/>")
        .replace(/\n/g, "<br/>")

    // Wrap consecutive <oli> in <ol>
    html = html.replace(
        /(<oli>.*?<\/oli>(?:<br\/?>)?)+/g,
        (match) =>
            `<ol>${match.replace(/<br\/?>/g, "").replace(/oli>/g, "li>")}</ol>`
    )

    // Wrap consecutive <li> in <ul>
    html = html.replace(
        /(<li>.*?<\/li>(?:<br\/?>)?)+/g,
        (match) => `<ul>${match.replace(/<br\/?>/g, "")}</ul>`
    )

    // Merge consecutive blockquotes
    html = html.replace(/<\/blockquote>(?:<br\/?>)*<blockquote>/g, "<br/>")

    // Clean extra <br/> around block elements (keep at most one)
    html = html.replace(/(<br\/?>){2,}(<(?:ul|ol|h[2-4]|blockquote))/g, "$2")
    html = html.replace(/(<\/(?:ul|ol|h[2-4]|blockquote)>)(<br\/?>){2,}/g, "$1")
    return html
}

// ########
// Highlight Helper
// ########

function highlightText(
    text: string,
    query: string,
    highlightColor: string
): React.ReactNode[] {
    if (!query || !text) return [text]
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`(${escapedQuery})`, "gi")
    const parts = text.split(regex)
    return parts.map((part, i) =>
        regex.test(part) ? (
            <mark
                key={i}
                style={{
                    backgroundColor: highlightColor,
                    color: "inherit",
                    borderRadius: "2px",
                    padding: "0 2px",
                }}
            >
                {part}
            </mark>
        ) : (
            part
        )
    )
}

function highlightHtml(
    html: string,
    query: string,
    highlightColor: string
): string {
    if (!query || !html) return html
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`(${escapedQuery})`, "gi")
    // Only highlight text outside HTML tags
    return html.replace(/>([^<]+)</g, (match, textContent) => {
        const highlighted = textContent.replace(
            regex,
            `<mark style="background-color:${highlightColor};color:inherit;border-radius:2px;padding:0 2px;">$1</mark>`
        )
        return `>${highlighted}<`
    })
}

// ########
// SEO Schema (JSON-LD)
// ########

function FAQSchema({
    items,
}: {
    items: { question: string; answer: string }[]
}) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
            },
        })),
    }
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    )
}

// ########
// Search Bar
// ########

function SearchBar({
    query,
    onQueryChange,
    placeholder,
    font,
    textColor,
    bgColor,
    borderColor,
    borderRadius,
    iconColor,
    highlightColor,
}) {
    const inputRef = useRef<HTMLInputElement>(null)

    const containerStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px 16px",
        backgroundColor: bgColor,
        borderRadius: `${borderRadius}px`,
        border: `1px solid ${borderColor}`,
        transition: "border-color 0.2s ease",
        marginBottom: "8px",
    }

    const inputStyle: React.CSSProperties = {
        flex: 1,
        border: "none",
        outline: "none",
        background: "transparent",
        fontFamily: font?.fontFamily ?? "Inter",
        fontWeight: font?.fontWeight ?? 400,
        fontSize: font?.fontSize ?? "15px",
        lineHeight: font?.lineHeight ?? "1.4em",
        letterSpacing: font?.letterSpacing ?? "0em",
        color: textColor,
    }

    return (
        <div style={containerStyle}>
            <SearchIcon color={iconColor} />
            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder={placeholder}
                style={inputStyle}
                aria-label="Search FAQ"
            />
            {query && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => {
                        onQueryChange("")
                        inputRef.current?.focus()
                    }}
                    style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px",
                        display: "flex",
                        alignItems: "center",
                    }}
                    aria-label="Clear search"
                >
                    <ClearIcon color={iconColor} />
                </motion.button>
            )}
        </div>
    )
}

// ########
// Category Tabs
// ########

function CategoryTabs({
    categories,
    activeCategory,
    onCategoryChange,
    font,
    textColor,
    activeTextColor,
    bgColor,
    activeBgColor,
    borderRadius,
    gap,
    isMobile,
}) {
    const scrollRef = useRef<HTMLDivElement>(null)

    const containerStyle: React.CSSProperties = {
        display: "flex",
        flexWrap: isMobile ? "nowrap" : "wrap",
        gap: `${gap}px`,
        marginBottom: "8px",
        overflowX: isMobile ? "auto" : "visible",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
    }

    const tabBaseStyle: React.CSSProperties = {
        padding: "8px 18px",
        borderRadius: `${borderRadius}px`,
        border: "none",
        cursor: "pointer",
        fontFamily: font?.fontFamily ?? "Inter",
        fontWeight: font?.fontWeight ?? 500,
        fontSize: font?.fontSize ?? "14px",
        lineHeight: font?.lineHeight ?? "1.4em",
        letterSpacing: font?.letterSpacing ?? "0em",
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",
        flexShrink: 0,
    }

    return (
        <div ref={scrollRef} style={containerStyle} role="tablist">
            {categories.map((cat) => {
                const isActive = cat === activeCategory
                return (
                    <motion.button
                        key={cat}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onCategoryChange(cat)}
                        style={{
                            ...tabBaseStyle,
                            backgroundColor: isActive ? activeBgColor : bgColor,
                            color: isActive ? activeTextColor : textColor,
                        }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        {cat}
                    </motion.button>
                )
            })}
        </div>
    )
}

// ########
// FAQ Item
// ########

function FAQItem({
    item,
    index,
    isOpen,
    onToggle,
    isFocused,
    showNumber,
    numberFont,
    numberColor,
    questionFont,
    questionColor,
    answerFont,
    answerColor,
    iconStyle: iconVariant,
    iconBgColor,
    iconColor,
    iconSize,
    itemBgColor,
    hoverBgColor,
    itemBorderRadius,
    border,
    shadow,
    searchQuery,
    highlightColor,

    itemPadding,
    dividerColor,
    useDividers,
    // New features
    showReactions,
    showCopy,
    reactionData,
    onReaction,
    accentColor,
    reactionsLabel,
    linkColor,
    copyLabel = "Copy",
    copiedLabel = "Copied!",
    resolvedReactions,
    resolvedCopy,
    resolvedCta,
}) {
    const itemRef = useRef<HTMLDivElement>(null)
    const [copied, setCopied] = useState(false)

    const copyToClipboard = useCallback((text: string) => {
        const fallback = () => {
            const ta = document.createElement("textarea")
            ta.value = text
            ta.style.position = "fixed"
            ta.style.left = "-9999px"
            document.body.appendChild(ta)
            ta.select()
            document.execCommand("copy")
            document.body.removeChild(ta)
        }

        try {
            if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(text).catch(fallback)
            } else {
                fallback()
            }
        } catch {
            fallback()
        }

        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }, [])

    useEffect(() => {
        if (isFocused && itemRef.current) {
            itemRef.current.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            })
        }
    }, [isFocused])

    const padH = itemPadding?.horizontal ?? 24
    const padV = itemPadding?.vertical ?? 20

    const itemStyle: React.CSSProperties = useDividers
        ? {
              borderTop: `1px solid ${dividerColor}`,
              overflow: "hidden",
              outline: isFocused ? `2px solid ${iconBgColor}` : "none",
              outlineOffset: "-2px",
              borderRadius: 0,
              background: "transparent",
          }
        : {
              background: itemBgColor,
              borderRadius: `${itemBorderRadius}px`,
              overflow: "hidden",
              border: border
                  ? `${border.borderWidth ?? 0}px ${border.borderStyle ?? "solid"} ${border.borderColor ?? "transparent"}`
                  : "none",
              boxShadow: shadow ?? "none",
              outline: isFocused ? `2px solid ${iconBgColor}` : "none",
              outlineOffset: "-2px",
          }

    const headerStyle: React.CSSProperties = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: useDividers ? `${padV}px 0` : `${padV}px ${padH}px`,
        cursor: "pointer",
        userSelect: "none",
        width: "100%",
        background: "transparent",
        border: "none",
        textAlign: "left",
        gap: "12px",
    }

    const numberStyle: React.CSSProperties = {
        fontFamily: numberFont?.fontFamily ?? "Inter",
        fontWeight: numberFont?.fontWeight ?? 600,
        fontSize: numberFont?.fontSize ?? "18px",
        lineHeight: numberFont?.lineHeight ?? "1em",
        letterSpacing: numberFont?.letterSpacing ?? "0em",
        color: numberColor,
        marginRight: "12px",
        flexShrink: 0,
    }

    const questionStyle: React.CSSProperties = {
        fontFamily: questionFont?.fontFamily ?? "Inter",
        fontWeight: questionFont?.fontWeight ?? 600,
        fontSize: questionFont?.fontSize ?? "18px",
        lineHeight: questionFont?.lineHeight ?? "1.3em",
        letterSpacing: questionFont?.letterSpacing ?? "0em",
        color: questionColor,
        margin: 0,
        flex: 1,
    }

    const answerContainerStyle: React.CSSProperties = {
        color: answerColor,
        fontFamily: answerFont?.fontFamily ?? "Inter",
        fontWeight: answerFont?.fontWeight ?? 400,
        fontSize: answerFont?.fontSize ?? "16px",
        lineHeight: answerFont?.lineHeight ?? "1.6em",
        letterSpacing: answerFont?.letterSpacing ?? "0em",
        padding: useDividers
            ? showNumber
                ? `0 0 ${padV}px 42px`
                : `0 0 ${padV}px 0`
            : showNumber
              ? `0 ${padH}px ${padV}px ${padH + 42}px`
              : `0 ${padH}px ${padV}px ${padH}px`,
    }

    const answerLinkStyle = `
        a { color: ${linkColor}; text-decoration: underline; }
        a:hover { opacity: 0.8; }
        ul, ol { margin: 6px 0; padding-left: 20px; }
        li { margin-bottom: 3px; }
        code { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
        h2, h3, h4 { margin: 10px 0 4px 0; }
        blockquote { margin: 6px 0; padding: 4px 12px; border-left: 3px solid ${linkColor}; opacity: 0.85; }
        strong { font-weight: 700; }
    `

    const renderIcon = () => {
        const iconContainerStyle: React.CSSProperties = {
            width: `${iconSize + 12}px`,
            height: `${iconSize + 12}px`,
            borderRadius:
                iconVariant === "circle"
                    ? "50%"
                    : `${Math.min(itemBorderRadius, 8)}px`,
            background: iconBgColor,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexShrink: 0,
        }

        return (
            <div style={iconContainerStyle}>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    style={{ display: "flex" }}
                >
                    {iconVariant === "plusMinus" ? (
                        isOpen ? (
                            <MinusIcon color={iconColor} size={iconSize} />
                        ) : (
                            <PlusIcon color={iconColor} size={iconSize} />
                        )
                    ) : (
                        <ChevronIcon color={iconColor} size={iconSize} />
                    )}
                </motion.div>
            </div>
        )
    }

    const renderAnswer = () => {
        const rawAnswer = item.answer ?? ""
        let html = parseMarkdown(rawAnswer)
        if (searchQuery) {
            html = highlightHtml(html, searchQuery, highlightColor)
        }
        return (
            <>
                <style>{answerLinkStyle}</style>
                <div dangerouslySetInnerHTML={{ __html: html }} />
            </>
        )
    }

    return (
        <motion.div
            ref={itemRef}
            layout
            initial={false}
            style={itemStyle}
            whileHover={
                !useDividers ? { backgroundColor: hoverBgColor } : undefined
            }
            transition={{ duration: 0.2 }}
            role="region"
        >
            <motion.button
                layout="position"
                style={headerStyle}
                onClick={() => onToggle(index)}
                aria-expanded={isOpen}
                tabIndex={0}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    {showNumber && (
                        <span style={numberStyle}>
                            {String(index + 1).padStart(2, "0")}.
                        </span>
                    )}
                    <span style={questionStyle}>
                        {searchQuery
                            ? highlightText(
                                  item.question,
                                  searchQuery,
                                  highlightColor
                              )
                            : item.question}
                    </span>
                </div>
                {renderIcon()}
            </motion.button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{
                            opacity: { duration: 0.2, delay: 0.05 },
                            height: { duration: 0.3, ease: "easeInOut" },
                        }}
                    >
                        <div style={answerContainerStyle}>{renderAnswer()}</div>
                        {/* Action Bar */}
                        {(showReactions || showCopy || item.ctaLabel) && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: useDividers
                                        ? showNumber
                                            ? `0 0 ${padV}px 42px`
                                            : `0 0 ${padV}px 0`
                                        : showNumber
                                          ? `0 ${padH}px ${padV}px ${padH + 42}px`
                                          : `0 ${padH}px ${padV}px ${padH}px`,
                                    flexWrap: "wrap",
                                }}
                            >
                                {showReactions && reactionData && (
                                    <>
                                        <span
                                            style={{
                                                fontFamily:
                                                    resolvedReactions.font
                                                        .fontFamily,
                                                fontWeight:
                                                    resolvedReactions.font
                                                        .fontWeight,
                                                fontSize:
                                                    resolvedReactions.font
                                                        .fontSize,
                                                lineHeight:
                                                    resolvedReactions.font
                                                        .lineHeight,
                                                letterSpacing:
                                                    resolvedReactions.font
                                                        .letterSpacing,
                                                color: resolvedReactions.color,
                                                opacity: 0.7,
                                                marginRight: "4px",
                                            }}
                                        >
                                            {reactionsLabel}
                                        </span>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() =>
                                                onReaction(index, "up")
                                            }
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px",
                                                padding: "4px 10px",
                                                borderRadius:
                                                    resolvedReactions.borderRadius,
                                                border: "none",
                                                cursor: "pointer",
                                                fontFamily:
                                                    resolvedReactions.font
                                                        .fontFamily,
                                                fontWeight:
                                                    resolvedReactions.font
                                                        .fontWeight,
                                                fontSize:
                                                    resolvedReactions.font
                                                        .fontSize,
                                                lineHeight:
                                                    resolvedReactions.font
                                                        .lineHeight,
                                                letterSpacing:
                                                    resolvedReactions.font
                                                        .letterSpacing,
                                                background:
                                                    reactionData.userVote ===
                                                    "up"
                                                        ? resolvedReactions.activeBgColor
                                                        : resolvedReactions.bgColor,
                                                color:
                                                    reactionData.userVote ===
                                                    "up"
                                                        ? resolvedReactions.activeColor
                                                        : resolvedReactions.color,
                                                transition: "all 0.2s ease",
                                            }}
                                            aria-label="Helpful"
                                        >
                                            <ThumbsUpIcon
                                                color={
                                                    reactionData.userVote ===
                                                    "up"
                                                        ? resolvedReactions.activeColor
                                                        : resolvedReactions.color
                                                }
                                            />
                                            {reactionData.up > 0 &&
                                                reactionData.up}
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() =>
                                                onReaction(index, "down")
                                            }
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px",
                                                padding: "4px 10px",
                                                borderRadius:
                                                    resolvedReactions.borderRadius,
                                                border: "none",
                                                cursor: "pointer",
                                                fontFamily:
                                                    resolvedReactions.font
                                                        .fontFamily,
                                                fontWeight:
                                                    resolvedReactions.font
                                                        .fontWeight,
                                                fontSize:
                                                    resolvedReactions.font
                                                        .fontSize,
                                                lineHeight:
                                                    resolvedReactions.font
                                                        .lineHeight,
                                                letterSpacing:
                                                    resolvedReactions.font
                                                        .letterSpacing,
                                                background:
                                                    reactionData.userVote ===
                                                    "down"
                                                        ? resolvedReactions.negBgColor
                                                        : resolvedReactions.bgColor,
                                                color:
                                                    reactionData.userVote ===
                                                    "down"
                                                        ? resolvedReactions.activeColor
                                                        : resolvedReactions.color,
                                                transition: "all 0.2s ease",
                                            }}
                                            aria-label="Not helpful"
                                        >
                                            <ThumbsDownIcon
                                                color={
                                                    reactionData.userVote ===
                                                    "down"
                                                        ? resolvedReactions.activeColor
                                                        : resolvedReactions.color
                                                }
                                            />
                                            {reactionData.down > 0 &&
                                                reactionData.down}
                                        </motion.button>
                                    </>
                                )}
                                {showCopy && (
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() =>
                                            copyToClipboard(item.answer ?? "")
                                        }
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            padding: "4px 10px",
                                            borderRadius:
                                                resolvedCopy.borderRadius,
                                            border: "none",
                                            cursor: "pointer",
                                            fontFamily:
                                                resolvedCopy.font.fontFamily,
                                            fontWeight:
                                                resolvedCopy.font.fontWeight,
                                            fontSize:
                                                resolvedCopy.font.fontSize,
                                            lineHeight:
                                                resolvedCopy.font.lineHeight,
                                            letterSpacing:
                                                resolvedCopy.font.letterSpacing,
                                            background: copied
                                                ? resolvedCopy.copiedBgColor
                                                : resolvedCopy.bgColor,
                                            color: copied
                                                ? resolvedCopy.copiedColor
                                                : resolvedCopy.color,
                                            transition: "all 0.2s ease",
                                        }}
                                        aria-label="Copy answer"
                                    >
                                        {copied ? (
                                            <CheckIcon
                                                color={resolvedCopy.copiedColor}
                                            />
                                        ) : (
                                            <CopyIcon
                                                color={resolvedCopy.color}
                                            />
                                        )}
                                        {copied ? copiedLabel : copyLabel}
                                    </motion.button>
                                )}
                                {item.ctaLabel && item.ctaUrl && (
                                    <a
                                        href={item.ctaUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "4px 12px",
                                            borderRadius:
                                                resolvedCta.borderRadius,
                                            background: resolvedCta.bgColor,
                                            color: resolvedCta.color,
                                            fontFamily:
                                                resolvedCta.font.fontFamily,
                                            fontWeight:
                                                resolvedCta.font.fontWeight,
                                            fontSize: resolvedCta.font.fontSize,
                                            lineHeight:
                                                resolvedCta.font.lineHeight,
                                            letterSpacing:
                                                resolvedCta.font.letterSpacing,
                                            textDecoration: "none",
                                            marginLeft: "auto",
                                            transition: "opacity 0.2s ease",
                                        }}
                                    >
                                        {item.ctaLabel}
                                        <ExternalLinkIcon
                                            color={resolvedCta.color}
                                            size={12}
                                        />
                                    </a>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

// ########
// No Results
// ########

function NoResults({ query, font, color, label = "No results found for" }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                textAlign: "center",
                padding: "40px 20px",
                fontFamily: font?.fontFamily ?? "Inter",
                fontWeight: font?.fontWeight ?? 400,
                fontSize: font?.fontSize ?? "15px",
                color: color,
                opacity: 0.7,
            }}
        >
            {label} "{query}"
        </motion.div>
    )
}

// ########
// Main Component
// ########

/**
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 *
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 500
 */
export default function FAQ(props) {
    const {
        items = [],
        gap = 12,
        startOpen = false,
        allowMultiple = false,
        // Search
        showSearch = true,
        // Categories
        showCategories = true,
        // SEO
        enableSchema = true,
        // Appearance
        showNumber = false,
        itemVariant = "cards",
        // Accordion Icon
        iconSettings,
        // Item Style
        itemBgColor = "#1E1E24",
        hoverBgColor = "#26262E",
        itemBorderRadius = 12,
        border,
        shadow,
        dividerColor = "rgba(255,255,255,0.08)",
        itemPadding,
        // Search Style
        searchStyle,
        // Category Style
        categoryStyle,
        // Question Style
        questionStyle,
        // Answer Style
        answerStyle,
        // Number Style
        numberStyle,
        // Search colors
        highlightColor = "#7C3AED40",
        // Actions
        showReactions = true,
        showCopy = true,
        reactionsStyle,
        copyButtonStyle,
        ctaStyle,
        // Labels
        labels,
        reactionsStorageKey = "faq-reactions",
        // Responsive
        mobileBreakpoint = 480,
    } = props

    // Extract labels with defaults (|| ensures empty strings fallback to default)
    const searchPlaceholder = labels?.searchPlaceholder || "Search questions..."
    const allCategoryLabel = labels?.allCategoryLabel || "All"
    const reactionsLabel = labels?.reactionsLabel || "Was this helpful?"
    const copyLabel = labels?.copyLabel || "Copy"
    const copiedLabel = labels?.copiedLabel || "Copied!"
    const noResultsLabel = labels?.noResultsLabel || "No results found for"
    const resultsCountLabel = labels?.resultsCountLabel || "results found"

    // State
    const [openIndices, setOpenIndices] = useState<number[] | number | null>(
        startOpen ? (allowMultiple ? [0] : 0) : allowMultiple ? [] : null
    )
    const [searchQuery, setSearchQuery] = useState("")
    const [activeCategory, setActiveCategory] = useState<string | null>(null)
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

    // Reactions
    const { vote, getReaction } = useReactions(reactionsStorageKey, items)

    // Refs
    const isFirstMount = useRef(true)
    const containerRef = useRef<HTMLDivElement>(null)
    const [containerWidth, setContainerWidth] = useState(0)

    // Responsive
    useLayoutEffect(() => {
        const el = containerRef.current
        if (!el) return
        setContainerWidth(el.getBoundingClientRect().width)
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width)
            }
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const isMobile = containerWidth > 0 && containerWidth <= mobileBreakpoint

    // Reset on mode change
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false
            return
        }
        setOpenIndices(allowMultiple ? [] : null)
    }, [allowMultiple])

    // Deep link support via URL hash
    useEffect(() => {
        const hash = window.location.hash
        if (hash && hash.startsWith("#faq-")) {
            const idx = parseInt(hash.replace("#faq-", ""), 10)
            if (!isNaN(idx) && idx >= 0 && idx < items.length) {
                setOpenIndices(allowMultiple ? [idx] : idx)
                setTimeout(() => {
                    const el = document.getElementById(`faq-item-${idx}`)
                    el?.scrollIntoView({ behavior: "smooth", block: "center" })
                }, 300)
            }
        }
    }, [])

    // Extract unique categories
    const categories = useMemo(() => {
        if (!showCategories) return []
        const cats = new Set<string>()
        items.forEach((item) => {
            if (item.category && item.category.trim()) {
                cats.add(item.category.trim())
            }
        })
        return Array.from(cats)
    }, [items, showCategories])

    const allCategories = useMemo(() => {
        if (categories.length === 0) return []
        return [allCategoryLabel, ...categories]
    }, [categories, allCategoryLabel])

    // Filter items by category and search
    const filteredItems = useMemo(() => {
        let result = items.map((item, idx) => ({ ...item, originalIndex: idx }))

        // Filter by category
        if (
            showCategories &&
            activeCategory &&
            activeCategory !== allCategoryLabel
        ) {
            result = result.filter(
                (item) =>
                    item.category && item.category.trim() === activeCategory
            )
        }

        // Filter by search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            result = result.filter(
                (item) =>
                    item.question?.toLowerCase().includes(q) ||
                    item.answer?.toLowerCase().includes(q)
            )
        }

        return result
    }, [items, activeCategory, searchQuery, showCategories, allCategoryLabel])

    // Auto-open matched items on search
    useEffect(() => {
        if (searchQuery.trim() && filteredItems.length > 0) {
            if (allowMultiple) {
                setOpenIndices(filteredItems.map((item) => item.originalIndex))
            } else {
                setOpenIndices(filteredItems[0]?.originalIndex ?? null)
            }
        }
    }, [searchQuery, filteredItems.length])

    // Toggle handler
    const handleToggle = useCallback(
        (originalIndex: number) => {
            setOpenIndices((prev) => {
                if (allowMultiple) {
                    const currentIndices = Array.isArray(prev) ? prev : []
                    if (currentIndices.includes(originalIndex)) {
                        return currentIndices.filter((i) => i !== originalIndex)
                    }
                    return [...currentIndices, originalIndex]
                }
                const currentIndex = Array.isArray(prev) ? null : prev
                return currentIndex === originalIndex ? null : originalIndex
            })
        },
        [allowMultiple]
    )

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (filteredItems.length === 0) return

            const currentFocusIdx =
                focusedIndex !== null
                    ? filteredItems.findIndex(
                          (item) => item.originalIndex === focusedIndex
                      )
                    : -1

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault()
                    const nextIdx =
                        currentFocusIdx < filteredItems.length - 1
                            ? currentFocusIdx + 1
                            : 0
                    setFocusedIndex(filteredItems[nextIdx].originalIndex)
                    break
                case "ArrowUp":
                    e.preventDefault()
                    const prevIdx =
                        currentFocusIdx > 0
                            ? currentFocusIdx - 1
                            : filteredItems.length - 1
                    setFocusedIndex(filteredItems[prevIdx].originalIndex)
                    break
                case "Enter":
                case " ":
                    e.preventDefault()
                    if (focusedIndex !== null) {
                        handleToggle(focusedIndex)
                    }
                    break
                case "Home":
                    e.preventDefault()
                    setFocusedIndex(filteredItems[0].originalIndex)
                    break
                case "End":
                    e.preventDefault()
                    setFocusedIndex(
                        filteredItems[filteredItems.length - 1].originalIndex
                    )
                    break
                case "Escape":
                    e.preventDefault()
                    setFocusedIndex(null)
                    if (searchQuery) setSearchQuery("")
                    break
            }
        },
        [filteredItems, focusedIndex, handleToggle, searchQuery]
    )

    const isItemOpen = useCallback(
        (originalIndex: number) => {
            if (allowMultiple) {
                return (
                    Array.isArray(openIndices) &&
                    openIndices.includes(originalIndex)
                )
            }
            return openIndices === originalIndex
        },
        [openIndices, allowMultiple]
    )

    // Empty state
    if (!items.length) {
        return (
            <div
                style={{
                    color: "#aaa",
                    textAlign: "center",
                    padding: 60,
                    width: "100%",
                    fontFamily: "Inter, sans-serif",
                }}
            >
                Add at least 1 item in the properties panel.
            </div>
        )
    }

    const useDividers = itemVariant === "dividers"

    const containerStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        gap: useDividers ? 0 : `${gap}px`,
        width: "100%",
    }

    // Resolved icon settings
    const iconStyle = iconSettings?.style ?? "chevron"
    const iconSize = iconSettings?.size ?? 18
    const iconBgColor = iconSettings?.bgColor ?? "#7C3AED"
    const iconColor = iconSettings?.color ?? "#FFFFFF"

    // Resolved question style
    const questionFont = questionStyle?.font ?? {
        fontFamily: "Inter",
        fontWeight: 600,
        fontSize: "17px",
        lineHeight: "1.35em",
        letterSpacing: "0em",
    }
    const questionColor = questionStyle?.color ?? "#FFFFFF"

    // Resolved answer style
    const answerFont = answerStyle?.font ?? {
        fontFamily: "Inter",
        fontWeight: 400,
        fontSize: "15px",
        lineHeight: "1.6em",
        letterSpacing: "0em",
    }
    const answerColor = answerStyle?.color ?? "#A0A0B0"
    const answerLinkColor = answerStyle?.linkColor ?? iconBgColor

    // Resolved number style
    const numberFont = numberStyle?.font ?? {
        fontFamily: "Inter",
        fontWeight: 600,
        fontSize: "17px",
        lineHeight: "1em",
        letterSpacing: "0em",
    }
    const numberColor = numberStyle?.color ?? "#FFFFFF"

    // Resolved search style
    const resolvedSearchFont = searchStyle?.font ?? {
        fontFamily: "Inter",
        fontWeight: 400,
        fontSize: "15px",
        lineHeight: "1.4em",
        letterSpacing: "0em",
    }
    const resolvedSearchTextColor = searchStyle?.textColor ?? answerColor
    const resolvedSearchBgColor = searchStyle?.bgColor ?? itemBgColor
    const resolvedSearchBorderColor =
        searchStyle?.borderColor ?? "rgba(255,255,255,0.1)"
    const resolvedSearchBorderRadius =
        searchStyle?.borderRadius ?? itemBorderRadius

    // Resolved category style
    const resolvedCatFont = categoryStyle?.font ?? {
        fontFamily: "Inter",
        fontWeight: 500,
        fontSize: "14px",
        lineHeight: "1.4em",
        letterSpacing: "0em",
    }
    const resolvedCatTextColor = categoryStyle?.textColor ?? answerColor
    const resolvedCatActiveTextColor =
        categoryStyle?.activeTextColor ?? "#FFFFFF"
    const resolvedCatBgColor =
        categoryStyle?.bgColor ?? "rgba(255,255,255,0.06)"
    const resolvedCatActiveBgColor = categoryStyle?.activeBgColor ?? iconBgColor
    const resolvedCatBorderRadius = categoryStyle?.borderRadius ?? 20
    const resolvedCatGap = categoryStyle?.gap ?? 8

    // Resolved reactions style
    const defaultActionFont = {
        fontFamily: "Inter",
        fontWeight: 400,
        fontSize: "12px",
        lineHeight: "1.4em",
        letterSpacing: "0em",
    }
    const resolvedReactions = {
        font: reactionsStyle?.font ?? defaultActionFont,
        color: reactionsStyle?.color ?? "#A0A0B0",
        bgColor: reactionsStyle?.bgColor ?? "rgba(255,255,255,0.06)",
        activeBgColor: reactionsStyle?.activeBgColor ?? iconBgColor,
        negBgColor: reactionsStyle?.negBgColor ?? "#E53E3E",
        activeColor: reactionsStyle?.activeColor ?? "#FFFFFF",
        borderRadius: reactionsStyle?.borderRadius ?? 6,
    }

    // Resolved copy button style
    const resolvedCopy = {
        font: copyButtonStyle?.font ?? defaultActionFont,
        color: copyButtonStyle?.color ?? "#A0A0B0",
        bgColor: copyButtonStyle?.bgColor ?? "rgba(255,255,255,0.06)",
        copiedBgColor: copyButtonStyle?.copiedBgColor ?? iconBgColor,
        copiedColor: copyButtonStyle?.copiedColor ?? "#FFFFFF",
        borderRadius: copyButtonStyle?.borderRadius ?? 6,
    }

    // Resolved CTA style
    const resolvedCta = {
        font: ctaStyle?.font ?? { ...defaultActionFont, fontWeight: 500 },
        color: ctaStyle?.color ?? "#FFFFFF",
        bgColor: ctaStyle?.bgColor ?? iconBgColor,
        borderRadius: ctaStyle?.borderRadius ?? 6,
    }

    return (
        <div
            ref={containerRef}
            style={{ width: "100%", position: "relative" }}
            onKeyDown={handleKeyDown}
        >
            {/* SEO Schema */}
            {enableSchema && <FAQSchema items={items} />}

            {/* Search */}
            {showSearch && (
                <div style={{ marginBottom: `${gap}px` }}>
                    <SearchBar
                        query={searchQuery}
                        onQueryChange={setSearchQuery}
                        placeholder={searchPlaceholder}
                        font={resolvedSearchFont}
                        textColor={resolvedSearchTextColor}
                        bgColor={resolvedSearchBgColor}
                        borderColor={resolvedSearchBorderColor}
                        borderRadius={resolvedSearchBorderRadius}
                        iconColor={resolvedSearchTextColor}
                        highlightColor={highlightColor}
                    />
                    {searchQuery.trim() && filteredItems.length > 0 && (
                        <div
                            style={{
                                marginTop: "8px",
                                fontFamily: resolvedSearchFont.fontFamily,
                                fontWeight: resolvedSearchFont.fontWeight,
                                fontSize: resolvedSearchFont.fontSize,
                                lineHeight: resolvedSearchFont.lineHeight,
                                letterSpacing: resolvedSearchFont.letterSpacing,
                                color: resolvedSearchTextColor,
                                opacity: 0.6,
                            }}
                        >
                            {filteredItems.length} {resultsCountLabel}
                        </div>
                    )}
                </div>
            )}

            {/* Category Tabs */}
            {showCategories && allCategories.length > 0 && !searchQuery && (
                <div style={{ marginBottom: `${gap}px` }}>
                    <CategoryTabs
                        categories={allCategories}
                        activeCategory={activeCategory ?? allCategoryLabel}
                        onCategoryChange={(cat) =>
                            setActiveCategory(
                                cat === allCategoryLabel ? null : cat
                            )
                        }
                        font={resolvedCatFont}
                        textColor={resolvedCatTextColor}
                        activeTextColor={resolvedCatActiveTextColor}
                        bgColor={resolvedCatBgColor}
                        activeBgColor={resolvedCatActiveBgColor}
                        borderRadius={resolvedCatBorderRadius}
                        gap={resolvedCatGap}
                        isMobile={isMobile}
                    />
                </div>
            )}

            {/* FAQ Items */}
            <div style={containerStyle} role="list">
                <AnimatePresence initial={false}>
                    {filteredItems.length === 0 && searchQuery ? (
                        <NoResults
                            query={searchQuery}
                            font={answerFont}
                            color={answerColor}
                            label={noResultsLabel}
                        />
                    ) : (
                        filteredItems.map((item) => (
                            <motion.div
                                key={item.originalIndex}
                                id={`faq-item-${item.originalIndex}`}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{
                                    opacity: { duration: 0.2 },
                                    layout: { duration: 0.25, ease: "easeOut" },
                                }}
                                role="listitem"
                            >
                                <FAQItem
                                    item={item}
                                    index={item.originalIndex}
                                    isOpen={isItemOpen(item.originalIndex)}
                                    isFocused={
                                        focusedIndex === item.originalIndex
                                    }
                                    onToggle={handleToggle}
                                    showNumber={showNumber}
                                    numberFont={numberFont}
                                    numberColor={numberColor}
                                    questionFont={questionFont}
                                    questionColor={questionColor}
                                    answerFont={answerFont}
                                    answerColor={answerColor}
                                    iconStyle={iconStyle}
                                    iconBgColor={iconBgColor}
                                    iconColor={iconColor}
                                    iconSize={iconSize}
                                    itemBgColor={itemBgColor}
                                    hoverBgColor={hoverBgColor}
                                    itemBorderRadius={itemBorderRadius}
                                    border={border}
                                    shadow={shadow}
                                    searchQuery={searchQuery}
                                    highlightColor={highlightColor}
                                    itemPadding={itemPadding}
                                    dividerColor={dividerColor}
                                    useDividers={useDividers}
                                    showReactions={showReactions}
                                    showCopy={showCopy}
                                    reactionData={getReaction(
                                        item.originalIndex
                                    )}
                                    onReaction={vote}
                                    accentColor={iconBgColor}
                                    linkColor={answerLinkColor}
                                    reactionsLabel={reactionsLabel}
                                    copyLabel={copyLabel}
                                    copiedLabel={copiedLabel}
                                    resolvedReactions={resolvedReactions}
                                    resolvedCopy={resolvedCopy}
                                    resolvedCta={resolvedCta}
                                />
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

// ########
// Property Controls
// ########

addPropertyControls(FAQ, {
    // 1. Content
    items: {
        type: ControlType.Array,
        title: "Items",
        propertyControl: {
            type: ControlType.Object,
            controls: {
                question: {
                    type: ControlType.String,
                    title: "Question",
                    defaultValue: "What is this component?",
                },
                answer: {
                    type: ControlType.String,
                    title: "Answer",
                    defaultValue: "Your answer goes here.",
                    displayTextArea: true,
                },
                category: {
                    type: ControlType.String,
                    title: "Category",
                    defaultValue: "General",
                },
                ctaLabel: {
                    type: ControlType.String,
                    title: "CTA Label",
                    defaultValue: "",
                },
                ctaUrl: {
                    type: ControlType.String,
                    title: "CTA URL",
                    defaultValue: "",
                },
            },
        },
        defaultValue: [
            {
                question: "How does this work?",
                answer: "Simply add your questions and answers below. You can organize them by **category**, and your visitors can search, filter, and interact with each item.",
                category: "General",
            },
            {
                question: "What's included?",
                answer: "Everything you need out of the box — search, categories, reactions, copy button, and **full keyboard navigation**. Just customize the content and style to match your brand.",
                category: "General",
            },
            {
                question: "How do I get started?",
                answer: "Click on any item in the **Items** list to edit the question, answer, and category. You can add or remove items as needed.",
                category: "Getting Started",
            },
        ],
    },

    // 2. Features
    showSearch: {
        type: ControlType.Boolean,
        title: "Search",
        defaultValue: true,
    },
    showCategories: {
        type: ControlType.Boolean,
        title: "Categories",
        defaultValue: true,
    },
    enableSchema: {
        type: ControlType.Boolean,
        title: "SEO Schema",
        defaultValue: true,
    },

    showReactions: {
        type: ControlType.Boolean,
        title: "Reactions",
        defaultValue: true,
    },
    showCopy: {
        type: ControlType.Boolean,
        title: "Copy Answer",
        defaultValue: true,
    },
    reactionsStorageKey: {
        type: ControlType.String,
        title: "Reactions Key",
        defaultValue: "faq-reactions",
        hidden: (props) => !props.showReactions,
    },

    // Labels
    labels: {
        type: ControlType.Object,
        title: "Labels",
        optional: true,
        buttonTitle: "Labels",
        icon: "object",
        controls: {
            searchPlaceholder: {
                type: ControlType.String,
                title: "Search Placeholder",
                defaultValue: "Search questions...",
            },
            allCategoryLabel: {
                type: ControlType.String,
                title: "All Category",
                defaultValue: "All",
            },
            reactionsLabel: {
                type: ControlType.String,
                title: "Reactions",
                defaultValue: "Was this helpful?",
            },
            copyLabel: {
                type: ControlType.String,
                title: "Copy Button",
                defaultValue: "Copy",
            },
            copiedLabel: {
                type: ControlType.String,
                title: "Copied Feedback",
                defaultValue: "Copied!",
            },
            noResultsLabel: {
                type: ControlType.String,
                title: "No Results",
                defaultValue: "No results found for",
            },
            resultsCountLabel: {
                type: ControlType.String,
                title: "Results Count",
                defaultValue: "results found",
            },
        },
    },

    // 3. Layout
    itemVariant: {
        type: ControlType.Enum,
        title: "Item Style",
        options: ["cards", "dividers"],
        optionTitles: ["Cards", "Dividers"],
        defaultValue: "cards",
    },
    startOpen: {
        type: ControlType.Boolean,
        title: "Start Open",
        defaultValue: false,
    },
    allowMultiple: {
        type: ControlType.Boolean,
        title: "Multi Open",
        defaultValue: false,
    },
    showNumber: {
        type: ControlType.Boolean,
        title: "Show Number",
        defaultValue: false,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 12,
        min: 0,
        max: 60,
        displayStepper: true,
    },

    // 4. Item Appearance
    itemPadding: {
        type: ControlType.Object,
        title: "Item Padding",
        controls: {
            vertical: {
                type: ControlType.Number,
                title: "Vertical",
                defaultValue: 20,
                min: 0,
                max: 60,
            },
            horizontal: {
                type: ControlType.Number,
                title: "Horizontal",
                defaultValue: 24,
                min: 0,
                max: 60,
            },
        },
    },
    itemBgColor: {
        type: ControlType.Color,
        title: "Item Background",
        defaultValue: "#1E1E24",
        hidden: (props) => props.itemVariant === "dividers",
    },
    hoverBgColor: {
        type: ControlType.Color,
        title: "Item Hover",
        defaultValue: "#26262E",
        hidden: (props) => props.itemVariant === "dividers",
    },
    itemBorderRadius: {
        type: ControlType.Number,
        title: "Item Radius",
        defaultValue: 12,
        min: 0,
        max: 30,
        hidden: (props) => props.itemVariant === "dividers",
    },
    dividerColor: {
        type: ControlType.Color,
        title: "Divider Color",
        defaultValue: "rgba(255,255,255,0.08)",
        hidden: (props) => props.itemVariant !== "dividers",
    },
    border: {
        type: ControlType.Border,
        title: "Item Border",
        defaultValue: {
            borderWidth: 0,
            borderStyle: "solid",
            borderColor: "transparent",
        },
        hidden: (props) => props.itemVariant === "dividers",
    },
    shadow: {
        type: ControlType.BoxShadow,
        title: "Item Shadow",
        hidden: (props) => props.itemVariant === "dividers",
    },

    // 5. Accordion Icon
    iconSettings: {
        type: ControlType.Object,
        title: "Accordion Icon",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Type",
                options: ["chevron", "plusMinus", "circle"],
                optionTitles: ["Chevron", "Plus/Minus", "Circle"],
                defaultValue: "chevron",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 18,
                min: 12,
                max: 28,
                displayStepper: true,
            },
            bgColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#7C3AED",
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#FFFFFF",
            },
        },
    },

    // 6. Question Style
    questionStyle: {
        type: ControlType.Object,
        title: "Question Style",
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultValue: {
                    fontFamily: "Inter",
                    fontWeight: 600,
                    fontSize: "17px",
                    lineHeight: "1.35em",
                    letterSpacing: "0em",
                },
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#FFFFFF",
            },
        },
    },

    // 7. Answer Style
    answerStyle: {
        type: ControlType.Object,
        title: "Answer Style",
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultValue: {
                    fontFamily: "Inter",
                    fontWeight: 400,
                    fontSize: "15px",
                    lineHeight: "1.6em",
                    letterSpacing: "0em",
                },
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#A0A0B0",
            },
            linkColor: {
                type: ControlType.Color,
                title: "Link Color",
                defaultValue: "#7C3AED",
            },
        },
    },

    // 8. Reactions Style
    reactionsStyle: {
        type: ControlType.Object,
        title: "Reactions Style",
        optional: true,
        buttonTitle: "Style",
        icon: "color",
        hidden: (props) => !props.showReactions,
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultValue: {
                    fontFamily: "Inter",
                    fontWeight: 400,
                    fontSize: "12px",
                    lineHeight: "1.4em",
                    letterSpacing: "0em",
                },
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#A0A0B0",
            },
            bgColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(255,255,255,0.06)",
            },
            activeBgColor: {
                type: ControlType.Color,
                title: "Active Background",
                defaultValue: "#7C3AED",
            },
            negBgColor: {
                type: ControlType.Color,
                title: "Negative Background",
                defaultValue: "#E53E3E",
            },
            activeColor: {
                type: ControlType.Color,
                title: "Active Color",
                defaultValue: "#FFFFFF",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 6,
                min: 0,
                max: 20,
            },
        },
    },

    // 9. Copy Button Style
    copyButtonStyle: {
        type: ControlType.Object,
        title: "Copy Button Style",
        optional: true,
        buttonTitle: "Style",
        icon: "color",
        hidden: (props) => !props.showCopy,
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultValue: {
                    fontFamily: "Inter",
                    fontWeight: 400,
                    fontSize: "12px",
                    lineHeight: "1.4em",
                    letterSpacing: "0em",
                },
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#A0A0B0",
            },
            bgColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(255,255,255,0.06)",
            },
            copiedBgColor: {
                type: ControlType.Color,
                title: "Copied Background",
                defaultValue: "#7C3AED",
            },
            copiedColor: {
                type: ControlType.Color,
                title: "Copied Color",
                defaultValue: "#FFFFFF",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 6,
                min: 0,
                max: 20,
            },
        },
    },

    // 10. CTA Style
    ctaStyle: {
        type: ControlType.Object,
        title: "CTA Style",
        optional: true,
        buttonTitle: "Style",
        icon: "color",
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultValue: {
                    fontFamily: "Inter",
                    fontWeight: 500,
                    fontSize: "12px",
                    lineHeight: "1.4em",
                    letterSpacing: "0em",
                },
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#FFFFFF",
            },
            bgColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#7C3AED",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 6,
                min: 0,
                max: 20,
            },
        },
    },

    // 9. Number Style
    numberStyle: {
        type: ControlType.Object,
        title: "Number Style",
        hidden: (props) => !props.showNumber,
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultValue: {
                    fontFamily: "Inter",
                    fontWeight: 600,
                    fontSize: "17px",
                    lineHeight: "1em",
                    letterSpacing: "0em",
                },
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#FFFFFF",
            },
        },
    },

    // 9. Search Style
    searchStyle: {
        type: ControlType.Object,
        title: "Search Style",
        optional: true,
        buttonTitle: "Style",
        icon: "color",
        hidden: (props) => !props.showSearch,
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultValue: {
                    fontFamily: "Inter",
                    fontWeight: 400,
                    fontSize: "15px",
                    lineHeight: "1.4em",
                    letterSpacing: "0em",
                },
            },
            textColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#A0A0B0",
            },
            bgColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#1E1E24",
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border Color",
                defaultValue: "rgba(255,255,255,0.1)",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 12,
                min: 0,
                max: 30,
            },
        },
    },
    highlightColor: {
        type: ControlType.Color,
        title: "Highlight Color",
        defaultValue: "#7C3AED40",
        hidden: (props) => !props.showSearch,
    },

    // 10. Category Style
    categoryStyle: {
        type: ControlType.Object,
        title: "Category Style",
        optional: true,
        buttonTitle: "Style",
        icon: "color",
        hidden: (props) => !props.showCategories,
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultValue: {
                    fontFamily: "Inter",
                    fontWeight: 500,
                    fontSize: "14px",
                    lineHeight: "1.4em",
                    letterSpacing: "0em",
                },
            },
            textColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#A0A0B0",
            },
            activeTextColor: {
                type: ControlType.Color,
                title: "Active Text",
                defaultValue: "#FFFFFF",
            },
            bgColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(255,255,255,0.06)",
            },
            activeBgColor: {
                type: ControlType.Color,
                title: "Active Background",
                defaultValue: "#7C3AED",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 20,
                min: 0,
                max: 30,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 8,
                min: 0,
                max: 24,
            },
        },
    },

    // 11. Responsive
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile Breakpoint",
        defaultValue: 480,
        min: 300,
        max: 768,
        displayStepper: true,
    },
})
