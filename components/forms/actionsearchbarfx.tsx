// Modern search bar component with action buttons and suggestions
// Converted from kokonutui component to Framer

import {
    useState,
    useEffect,
    useMemo,
    useCallback,
    startTransition,
    type CSSProperties,
} from "react"
import { motion, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Action {
    id: string
    label: string
    icon: string
    description?: string
    shortcut?: string
    tag?: string
    link?: string
}

interface ActionSearchBarProps {
    actions: Action[]
    defaultOpen: boolean
    placeholder: string
    labelText: string
    backgroundColor: string
    textColor: string
    borderColor: string
    hoverColor: string
    activeColor: string
    iconColor: string
    secondaryTextColor: string
    inputFont: any
    actionFont: any
    labelFont: any
    borderRadius: number
    style?: CSSProperties
}

const ANIMATION_VARIANTS = {
    container: {
        hidden: { opacity: 0, height: 0 },
        show: {
            opacity: 1,
            height: "auto",
            transition: {
                height: { duration: 0.4 },
                staggerChildren: 0.1,
            },
        },
        exit: {
            opacity: 0,
            height: 0,
            transition: {
                height: { duration: 0.3 },
                opacity: { duration: 0.2 },
            },
        },
    },
    item: {
        hidden: { opacity: 0, y: 20 },
        show: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.3 },
        },
        exit: {
            opacity: 0,
            y: -10,
            transition: { duration: 0.2 },
        },
    },
}

function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            startTransition(() => setDebouncedValue(value))
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}

/**
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ActionSearchBar(props: ActionSearchBarProps) {
    const {
        actions,
        defaultOpen,
        placeholder,
        labelText,
        backgroundColor,
        textColor,
        borderColor,
        hoverColor,
        activeColor,
        iconColor,
        secondaryTextColor,
        inputFont,
        actionFont,
        labelFont,
        borderRadius,
    } = props

    const [query, setQuery] = useState("")
    const [isFocused, setIsFocused] = useState(defaultOpen)
    const [activeIndex, setActiveIndex] = useState(-1)
    const debouncedQuery = useDebounce(query, 200)

    const filteredActions = useMemo(() => {
        if (!debouncedQuery) return actions

        const normalizedQuery = debouncedQuery.toLowerCase().trim()
        return actions.filter((action) => {
            const searchableText =
                `${action.label} ${action.description || ""}`.toLowerCase()
            return searchableText.includes(normalizedQuery)
        })
    }, [debouncedQuery, actions])

    useEffect(() => {
        if (!isFocused) {
            startTransition(() => setActiveIndex(-1))
        } else {
            startTransition(() => setActiveIndex(-1))
        }
    }, [filteredActions, isFocused])

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            startTransition(() => {
                setQuery(e.target.value)
                setActiveIndex(-1)
            })
        },
        []
    )

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (!filteredActions.length) return

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault()
                    startTransition(() =>
                        setActiveIndex((prev) =>
                            prev < filteredActions.length - 1 ? prev + 1 : 0
                        )
                    )
                    break
                case "ArrowUp":
                    e.preventDefault()
                    startTransition(() =>
                        setActiveIndex((prev) =>
                            prev > 0 ? prev - 1 : filteredActions.length - 1
                        )
                    )
                    break
                case "Enter":
                    e.preventDefault()
                    if (activeIndex >= 0 && filteredActions[activeIndex]) {
                        console.log("Selected:", filteredActions[activeIndex])
                    }
                    break
                case "Escape":
                    startTransition(() => {
                        setIsFocused(false)
                        setActiveIndex(-1)
                    })
                    break
            }
        },
        [filteredActions, activeIndex]
    )

    const handleFocus = useCallback(() => {
        startTransition(() => {
            setIsFocused(true)
            setActiveIndex(-1)
        })
    }, [])

    const handleBlur = useCallback(() => {
        setTimeout(() => {
            startTransition(() => {
                setIsFocused(false)
                setActiveIndex(-1)
            })
        }, 200)
    }, [])

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                padding: "16px",
                backgroundColor,
            }}
        >
            <div style={{ width: "100%", maxWidth: "512px" }}>
                <label
                    style={{
                        display: "block",
                        marginBottom: "4px",
                        color: secondaryTextColor,
                        ...labelFont,
                    }}
                    htmlFor="search"
                >
                    {labelText}
                </label>
                <div style={{ position: "relative" }}>
                    <input
                        type="text"
                        placeholder={placeholder}
                        value={query}
                        onChange={handleInputChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        id="search"
                        autoComplete="off"
                        style={{
                            width: "100%",
                            padding: "6px 36px 6px 12px",
                            height: "36px",
                            borderRadius: `${borderRadius}px`,
                            border: `1px solid ${borderColor}`,
                            backgroundColor,
                            color: textColor,
                            outline: "none",
                            ...inputFont,
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            right: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            height: "16px",
                            width: "16px",
                        }}
                    >
                        <AnimatePresence mode="popLayout">
                            {query.length > 0 ? (
                                <motion.svg
                                    key="send"
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 20, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={iconColor}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="m22 2-7 20-4-9-9-4Z" />
                                    <path d="M22 2 11 13" />
                                </motion.svg>
                            ) : (
                                <motion.svg
                                    key="search"
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 20, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={iconColor}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.3-4.3" />
                                </motion.svg>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div style={{ width: "100%", maxWidth: "512px", marginTop: "4px" }}>
                <AnimatePresence>
                    {isFocused && filteredActions.length > 0 && (
                        <motion.div
                            style={{
                                width: "100%",
                                border: `1px solid ${borderColor}`,
                                borderRadius: `${borderRadius}px`,
                                overflow: "hidden",
                                backgroundColor,
                                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                            }}
                            variants={ANIMATION_VARIANTS.container}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                        >
                            <div>
                                {filteredActions.map((action, index) => (
                                    <motion.div
                                        key={action.id}
                                        style={{
                                            padding: "8px 12px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            cursor: "pointer",
                                            borderRadius: `${borderRadius}px`,
                                            backgroundColor:
                                                activeIndex === index
                                                    ? activeColor
                                                    : "transparent",
                                        }}
                                        variants={ANIMATION_VARIANTS.item}
                                        onMouseEnter={() =>
                                            startTransition(() =>
                                                setActiveIndex(index)
                                            )
                                        }
                                        onMouseDown={(e) => {
                                            e.preventDefault()
                                            if (action.link) {
                                                window.open(
                                                    action.link,
                                                    "_blank",
                                                    "noopener,noreferrer"
                                                )
                                            }
                                            console.log("Selected:", action)
                                        }}
                                        whileHover={{
                                            backgroundColor: hoverColor,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                            }}
                                        >
                                            <span style={{ fontSize: "16px" }}>
                                                {action.icon}
                                            </span>
                                            <span
                                                style={{
                                                    color: textColor,
                                                    ...actionFont,
                                                }}
                                            >
                                                {action.label}
                                            </span>
                                            {action.description && (
                                                <span
                                                    style={{
                                                        color: secondaryTextColor,
                                                        fontSize: "12px",
                                                    }}
                                                >
                                                    {action.description}
                                                </span>
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                            }}
                                        >
                                            {action.shortcut && (
                                                <span
                                                    style={{
                                                        color: secondaryTextColor,
                                                        fontSize: "12px",
                                                    }}
                                                >
                                                    {action.shortcut}
                                                </span>
                                            )}
                                            {action.tag && (
                                                <span
                                                    style={{
                                                        color: secondaryTextColor,
                                                        fontSize: "12px",
                                                    }}
                                                >
                                                    {action.tag}
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <div
                                style={{
                                    marginTop: "8px",
                                    padding: "8px 12px",
                                    borderTop: `1px solid ${borderColor}`,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        fontSize: "12px",
                                        color: secondaryTextColor,
                                    }}
                                >
                                    <span>Press ⌘K to open commands</span>
                                    <span>ESC to cancel</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

addPropertyControls(ActionSearchBar, {
    actions: {
        type: ControlType.Array,
        title: "Actions",
        control: {
            type: ControlType.Object,
            controls: {
                id: { type: ControlType.String, defaultValue: "1" },
                label: { type: ControlType.String, defaultValue: "Action" },
                icon: { type: ControlType.String, defaultValue: "✈️" },
                description: {
                    type: ControlType.String,
                    defaultValue: "Description",
                },
                shortcut: { type: ControlType.String, defaultValue: "⌘K" },
                tag: { type: ControlType.String, defaultValue: "Tag" },
                link: { type: ControlType.String, defaultValue: "" },
            },
        },
        defaultValue: [
            {
                id: "1",
                label: "Book tickets",
                icon: "✈️",
                description: "Operator",
                shortcut: "⌘K",
                tag: "Agent",
                link: "https://example.com/book",
            },
            {
                id: "2",
                label: "Summarize",
                icon: "📊",
                description: "gpt-5",
                shortcut: "⌘P",
                tag: "Command",
                link: "https://example.com/summarize",
            },
            {
                id: "3",
                label: "Screen Studio",
                icon: "🎥",
                description: "Claude 4.1",
                shortcut: "",
                tag: "Application",
                link: "https://example.com/screen-studio",
            },
            {
                id: "4",
                label: "Talk to Jarvis",
                icon: "🎙️",
                description: "gpt-5 voice",
                shortcut: "",
                tag: "Active",
                link: "https://example.com/jarvis",
            },
            {
                id: "5",
                label: "Kokonut UI - Pro",
                icon: "🎨",
                description: "Components",
                shortcut: "",
                tag: "Link",
                link: "https://kokonutui.com",
            },
        ],
    },
    defaultOpen: {
        type: ControlType.Boolean,
        title: "Default Open",
        defaultValue: false,
        enabledTitle: "Open",
        disabledTitle: "Closed",
    },
    placeholder: {
        type: ControlType.String,
        title: "Placeholder",
        defaultValue: "What's up?",
    },
    labelText: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Search Commands",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFF",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#181818",
    },
    hoverColor: {
        type: ControlType.Color,
        title: "Hover Color",
        defaultValue: "#2b2b2b",
    },
    activeColor: {
        type: ControlType.Color,
        title: "Active Color",
        defaultValue: "#2b2b2b",
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#CCCCCC",
    },
    secondaryTextColor: {
        type: ControlType.Color,
        title: "Secondary Text",
        defaultValue: "#CCCCCC",
    },
    inputFont: {
        type: ControlType.Font,
        title: "Input Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    actionFont: {
        type: ControlType.Font,
        title: "Action Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 8,
        min: 0,
        max: 24,
        step: 1,
        unit: "px",
        description:
            "More Components at [DiverseKit](https://framer.link/se2heI4)",
    },
})
