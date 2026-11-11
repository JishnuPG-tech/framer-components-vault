// Interactive menu component with input field, menu button for custom menu items, type button for text suggestions, and send button for navigation
import { useState, useRef, useEffect, startTransition, type CSSProperties } from "react"
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

interface Item {
    label: string
    link: string | { href: string; target?: string; [key: string]: any }
    leadingIcon?: string
    trailingIcon?: string
}

interface Suggestion {
    keywords: string[]
    questions: string[]
    answer: string
    link: string | { href: string; target?: string; [key: string]: any }
    linkTitle?: string
    images?: Array<{ src: string; srcSet?: string; alt?: string }>
}

interface NavAssistantProps {
    items: Item[]
    defaultIdx: number
    suggestions: Suggestion[]
    placeholder: string
    placeholders: string[]
    settings: {
        radius: number
        btnSize: number
        menuIcon: "plus" | "pin" | "hamburger" | "grid" | "dots"
        sendIcon: "arrowUp" | "arrowRight" | "paperPlane" | "check" | "chevronRight"
        menuLayout: "horizontal" | "stacked"
        panelDirection: "up" | "down"
    }
    collapsible: boolean
    collapsedIcon: "search" | "chat" | "plus" | "menu"
    collapsedLabel: string
    collapsedSize: number
    collapsibleSettings: {
        enabled: boolean
        icon: "search" | "chat" | "plus" | "menu"
        label: string
        size: number
    }
    colors: {
        background: string
        text: {
            input: string
            placeholder: string
            pill: string
            suggestion: string
            response: string
        }
        pill: {
            background: string
            hover: string
            text: string
        }
        panel: string
        menu: {
            background: string
            border: string
            hover: string
            icon: string
        }
        send: {
            background: string
            border: string
            hover: string
            icon: string
        }
        container: {
            border: string
            borderWidth: number
        }
    }
    fonts: {
        input: CSSProperties
        placeholder: CSSProperties
        pill: CSSProperties
        suggestion: CSSProperties
        response: CSSProperties
    }
    pills: {
        padding: string
        gap: number
        pillPadding: string
        iconSize: number
        pillGap: number
        borderRadius: number
        iconStrokeWidth: number
        uploadImage: {
            text: string
            icon: string
        }
    }
    enableAI: boolean
    allowImageAttachment: boolean
    websiteURL: string
    brandInfo: string
    tone: "exciting" | "friendly" | "professional" | "casual" | "formal" | "edgy" | "witty" | "empathetic" | "concise" | "detailed"
    style?: CSSProperties
}

/**
 * Interactive Menu Input
 *
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 96
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function NavAssistant(props: NavAssistantProps) {
    const {
        items = [
            { label: "Home", link: "/" },
            { label: "Career", link: "/career" },
            { label: "Pricing", link: "/pricing" },
            { label: "About Us", link: "/about" },
            { label: "Blog", link: "/blog" },
            { label: "Contact", link: "/contact" },
            { label: "Support", link: "/support" },
        ],
        defaultIdx = 0,
        suggestions = [
            { 
                keywords: ["bags", "bag", "tote", "backpack", "handbag"], 
                questions: ["What bags do you have?", "Show me bags", "Bag collection"],
                answer: "We have a wide variety of bags including totes, backpacks, and handbags. Visit our bags page to see the full collection.",
                link: "/bags",
                linkTitle: "View Bags Collection"
            },
            { 
                keywords: ["shoes", "shoe", "footwear", "sneakers", "boots"], 
                questions: ["What shoes are available?", "Show me shoes", "Footwear options"],
                answer: "Browse our extensive footwear collection including sneakers, boots, and formal shoes.",
                link: "/shoes",
                linkTitle: "View Shoes Collection"
            },
            { 
                keywords: ["contact", "reach", "email", "phone", "call"], 
                questions: ["How can I contact you?", "Contact information", "Get in touch"],
                answer: "You can reach us via email at hello@example.com or call us at (555) 123-4567.",
                link: "/contact",
                linkTitle: "Contact Us"
            },
        ],
        placeholder = "Type here",
        placeholders = [
            "What bags do you have?",
            "Show me your shoe collection",
            "How can I contact you?",
            "Tell me about your products",
            "What are your store hours?",
        ],
        colors = {
            background: "#131826",
            text: {
                input: "#E8EAF0",
                placeholder: "#E8EAF0",
                pill: "#E8EAF0",
                suggestion: "#E8EAF0",
                response: "#E8EAF0",
            },
            pill: {
                background: "#1C2333",
                hover: "#252D40",
                text: "#E8EAF0",
            },
            panel: "#131826",
            menu: {
                background: "#1C2333",
                border: "#2E3749",
                hover: "#252D40",
                icon: "#E8EAF0",
            },
            send: {
                background: "#1C2333",
                border: "#2E3749",
                hover: "#252D40",
                icon: "#E8EAF0",
            },
            container: {
                border: "#2E3749",
                borderWidth: 1,
            },
        },
        fonts = {
            input: {
                fontSize: "14px",
                fontWeight: 400,
                letterSpacing: "0em",
                lineHeight: "1.4em",
            },
            placeholder: {
                fontSize: "14px",
                fontWeight: 400,
                letterSpacing: "0em",
                lineHeight: "1.4em",
            },
            pill: {
                fontSize: "14px",
                fontWeight: 400,
                letterSpacing: "0em",
                lineHeight: "1.4em",
            },
            suggestion: {
                fontSize: "16px",
                fontWeight: 400,
                letterSpacing: "0em",
                lineHeight: "1.4em",
            },
            response: {
                fontSize: "16px",
                fontWeight: 400,
                letterSpacing: "0em",
                lineHeight: "1.5em",
            },
        },
        pills = {
            padding: "16px",
            gap: 12,
            pillPadding: "12px 24px",
            iconSize: 16,
            pillGap: 8,
            borderRadius: 50,
            iconStrokeWidth: 1,
            uploadImage: {
                text: "Upload Image",
                icon: "image",
            },
        },
        settings = {
            radius: 50,
            btnSize: 40,
            menuIcon: "plus",
            sendIcon: "arrowUp",
        menuLayout: "horizontal" as "horizontal" | "stacked",
        panelDirection: "up" as "up" | "down",
        },
        enableAI = false,
        allowImageAttachment = false,
        websiteURL = "",
        brandInfo = "We are a modern e-commerce brand specializing in fashion accessories and lifestyle products.",
        tone = "friendly",
        collapsibleSettings = {
            enabled: false,
            icon: "search",
            label: "Ask anything...",
            size: 40,
        },
    } = props

    const { radius, btnSize, menuIcon, sendIcon } = settings
    const menuLayout = 'menuLayout' in settings ? settings.menuLayout : "horizontal"
    const panelDirection = 'panelDirection' in settings ? settings.panelDirection : "up"

    const [inputValue, setInputValue] = useState("")
    const [showMenu, setShowMenu] = useState(false)
    const [showSuggest, setShowSuggest] = useState(false)
    const [filtered, setFiltered] = useState<Suggestion[]>([])
    const [filteredItems, setFilteredItems] = useState<Item[]>([])
    const [question, setQuestion] = useState<string | null>(null)
    const [selected, setSelected] = useState(false)
    const [showAnswer, setShowAnswer] = useState(false)
    const [answer, setAnswer] = useState("")
    const [loading, setLoading] = useState(false)
    const [suggested, setSuggested] = useState<Item[]>([])
    const [questions, setQuestions] = useState<Array<{question: string, suggestion: Suggestion}>>([])
    const [placeholderIdx, setPlaceholderIdx] = useState(0)
    const [pagePill, setPagePill] = useState<Item | null>(null)
    const [isTyping, setIsTyping] = useState(false)
    const [currentSuggestion, setCurrentSuggestion] = useState<Suggestion | null>(null)
    const [aiImages, setAiImages] = useState<Array<{ src: string; srcSet?: string; alt?: string }>>([])
    const [aiLink, setAiLink] = useState<string | { href: string; target?: string; [key: string]: any } | null>(null)
    const [aiLinkTitle, setAiLinkTitle] = useState<string | null>(null)
    const [uploadedImage, setUploadedImage] = useState<string | null>(null)
    const [isStreaming, setIsStreaming] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(props.collapsible)
    const [isCollapsedNew, setIsCollapsedNew] = useState(collapsibleSettings.enabled)
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const placeholderId = useRef(`placeholder-${Math.random().toString(36).substr(2, 9)}`).current

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer()
    

    // Generate unique ID for placeholder styling
    const placeholderIdRef = useRef(`placeholder-${Math.random().toString(36).substr(2, 9)}`).current

    const btnStyle: CSSProperties = {
        width: btnSize,
        height: btnSize,
        borderRadius: "50%",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
        flexShrink: 0,
    }

    const renderSendIcon = () => {
        const iconProps = {
            width: "20",
            height: "20",
            viewBox: "0 0 20 20",
            fill: "none",
            style: { color: colors.send.icon }
        }

        switch (sendIcon) {
            case "arrowRight":
                return (
                    <svg {...iconProps}>
                        <path
                            d="M4 10H16M16 10L10 4M16 10L10 16"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )
            case "paperPlane":
                return (
                    <svg {...iconProps}>
                        <path
                            d="M3 3L17 10L3 17L5 10L3 3Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                        />
                        <path
                            d="M5 10H10"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                )
            case "check":
                return (
                    <svg {...iconProps}>
                        <path
                            d="M4 10L8 14L16 6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )
            case "chevronRight":
                return (
                    <svg {...iconProps}>
                        <path
                            d="M8 4L14 10L8 16"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )
            case "arrowUp":
            default:
                return (
                    <svg {...iconProps}>
                        <path
                            d="M10 4L10 16M10 4L4 10M10 4L16 10"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )
        }
    }

    // Helper function to navigate using Framer's Link component
    const navigateToLink = (link: string | { href: string; target?: string; [key: string]: any }) => {
        if (typeof window === "undefined") return

        if (typeof link === "string") {
            // Simple string URL
            if (link.startsWith("http://") || link.startsWith("https://") || link.startsWith("mailto:") || link.startsWith("tel:")) {
                // External URL
                window.open(link, "_blank")
            } else {
                // Internal path - use direct navigation
                window.location.href = link
            }
        } else if (link && typeof link === "object") {
            // Framer Link object
            if (link.webPageId) {
                // Internal Framer page - navigate instantly
                const currentPath = window.location.pathname
                
                // Check if we're in preview mode
                if (currentPath.includes("/preview/")) {
                    // In preview mode, construct the preview URL
                    const previewBase = currentPath.match(/\/preview\/[^\/]+\//)?.[0]
                    if (previewBase) {
                        window.location.href = `${previewBase}${link.webPageId}`
                    } else {
                        window.location.href = `/${link.webPageId}`
                    }
                } else {
                    // In published mode
                    window.location.href = `/${link.webPageId}`
                }
            } else if (link.href) {
                // External URL in object format
                if (link.target === "_blank") {
                    window.open(link.href, "_blank")
                } else {
                    window.location.href = link.href
                }
            }
        }
    }

    // STATIC MODE RENDER - No animations, no timers, no dynamic behavior
    if (isStatic) {
        return (
            <div
                ref={containerRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    zIndex: 5,
                }}
            >
                <style>{`
                    .${placeholderIdRef}::placeholder {
                        color: ${colors.text.placeholder};
                        opacity: 0.5;
                        font-size: ${fonts.placeholder.fontSize || '14px'};
                        font-weight: ${fonts.placeholder.fontWeight || 400};
                        letter-spacing: ${fonts.placeholder.letterSpacing || '0em'};
                        line-height: ${fonts.placeholder.lineHeight || '1.4em'};
                        font-family: ${fonts.placeholder.fontFamily || 'inherit'};
                        font-style: ${fonts.placeholder.fontStyle || 'normal'};
                    }
                `}</style>

                {/* Input Row - Static */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: 12,
                        alignItems: "center",
                        backgroundColor: colors.background,
                        borderRadius: radius,
                        padding: 16,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        position: "relative",
                        border: `${colors.container.borderWidth}px solid ${colors.container.border}`,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                            style={{
                                ...btnStyle,
                                backgroundColor: colors.menu.background,
                                border: `1px solid ${colors.menu.border}`,
                            }}
                            aria-label="Show menu items"
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: colors.menu.icon }}>
                                {menuIcon === "hamburger" ? (
                                    <>
                                        <path d="M3 5H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        <path d="M3 10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        <path d="M3 15H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </>
                                ) : menuIcon === "grid" ? (
                                    <path d="M4 4H8V8H4V4ZM12 4H16V8H12V4ZM4 12H8V16H4V12ZM12 12H16V16H12V12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                ) : menuIcon === "dots" ? (
                                    <>
                                        <circle cx="10" cy="5" r="1.5" fill="currentColor" />
                                        <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                                        <circle cx="10" cy="15" r="1.5" fill="currentColor" />
                                    </>
                                ) : menuIcon === "pin" ? (
                                    <path d="M10 2L10 10M10 10L6 14M10 10L14 14M10 10L10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                ) : (
                                    <>
                                        <path d="M10 4V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        <path d="M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </>
                                )}
                            </svg>
                        </button>
                    </div>

                    <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, position: "relative" }}>
                            <textarea
                                placeholder={placeholder || "Ask anything…"}
                                rows={1}
                                className={placeholderIdRef}
                                style={{
                                    width: "100%",
                                    padding: `${(btnSize - 24) / 2}px 0`,
                                    backgroundColor: "transparent",
                                    color: colors.text.input,
                                    border: "none",
                                    outline: "none",
                                    resize: "none",
                                    overflow: "auto",
                                    maxHeight: "120px",
                                    whiteSpace: "pre-wrap",
                                    wordWrap: "break-word",
                                    ...fonts.input,
                                }}
                                readOnly
                            />
                        </div>

                        <button
                            style={{
                                ...btnStyle,
                                backgroundColor: colors.send.background,
                                border: `1px solid ${colors.send.border}`,
                            }}
                            aria-label="Send"
                        >
                            {renderSendIcon()}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ALL EFFECTS ONLY RUN IN LIVE MODE - After static return
    useEffect(() => {
        if (inputValue.trim() && inputValue !== "/" && !selected) {
            // Search for any suggestion keyword in the input text
            const filtered = suggestions.filter((s) => {
                const inputLower = inputValue.toLowerCase()
                return s.keywords.some(keyword => {
                    const keywordLower = keyword.toLowerCase()
                    return inputLower.includes(keywordLower)
                })
            })
            
            // Search for menu items that match the input
            const matchedItems = items.filter((item) => {
                const labelLower = item.label.toLowerCase()
                const inputLower = inputValue.toLowerCase()
                return labelLower.includes(inputLower)
            })
            
            startTransition(() => {
                setFiltered(filtered)
                setFilteredItems(matchedItems)
                setShowSuggest(filtered.length > 0 || matchedItems.length > 0)
            })
        } else {
            startTransition(() => {
                setFiltered([])
                setFilteredItems([])
                setShowSuggest(false)
                if (!selected) {
                    setQuestion(null)
                }
            })
        }
    }, [inputValue, suggestions, selected, items])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                startTransition(() => {
                    setShowMenu(false)
                    setShowSuggest(false)
                })
            }
        }

        if (typeof document !== "undefined") {
            document.addEventListener("mousedown", handleClickOutside)
            return () => document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [props.collapsible, isCollapsed])

    // Handle click outside to collapse when in collapsible mode
    useEffect(() => {
        function handleClickOutsideToCollapse(event: MouseEvent) {
            if (collapsibleSettings.enabled && !isCollapsedNew && containerRef.current && !containerRef.current.contains(event.target as Node)) {
                startTransition(() => {
                    setIsCollapsedNew(true)
                })
            }
        }

        if (typeof document !== "undefined") {
            document.addEventListener("mousedown", handleClickOutsideToCollapse)
            return () => document.removeEventListener("mousedown", handleClickOutsideToCollapse)
        }
    }, [collapsibleSettings.enabled, isCollapsedNew])

    // Dynamic placeholder cycling - ONLY in live mode
    useEffect(() => {
        if (placeholders.length === 0 || inputValue.trim() !== "") return

        const interval = setInterval(() => {
            startTransition(() => {
                setPlaceholderIdx((prev) => (prev + 1) % placeholders.length)
            })
        }, 4000)

        return () => clearInterval(interval)
    }, [placeholders, inputValue])

    // Detect current page and show as pill - ONLY in live mode
    useEffect(() => {
        if (typeof window === "undefined") return

        const currentPath = window.location.pathname
        
        // Extract the current page ID from the path
        let currentPageId = ""
        
        // Check if we're in preview mode
        if (currentPath.includes("/preview/")) {
            const previewMatch = currentPath.match(/\/preview\/[^\/]+\/(.+)/)
            if (previewMatch) {
                currentPageId = previewMatch[1]
            }
        } else {
            // In published mode, get the last path segment
            const pathParts = currentPath.split('/').filter(Boolean)
            currentPageId = pathParts[pathParts.length - 1] || ""
        }
        
        // Find the matching menu item
        const matchedItem = items.find((item, index) => {
            const link = item.link
            
            // Skip default page
            if (index === defaultIdx) return false
            
            if (typeof link === "string") {
                const linkPath = link.replace(/^\//, '')
                return linkPath === currentPageId || link === currentPath
            } else if (link && typeof link === "object" && link.webPageId) {
                return link.webPageId === currentPageId
            }
            
            return false
        })
        
        if (matchedItem) {
            startTransition(() => setPagePill(matchedItem))
        }
    }, [items, defaultIdx])

    const handleClosePill = () => {
        const defaultPage = items[defaultIdx]
        if (defaultPage) {
            navigateToLink(defaultPage.link)
        }
        startTransition(() => setPagePill(null))
    }

    const handleMenuClick = () => {
        startTransition(() => {
            setShowMenu(!showMenu)
            setShowSuggest(false)
            if (showAnswer) {
                setShowAnswer(false)
                setAnswer("")
                setSuggested([])
                setQuestions([])
            }
        })
    }

    const handleItemClick = (item: Item) => {
        navigateToLink(item.link)
        startTransition(() => setShowMenu(false))
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onload = (event) => {
                const imageData = event.target?.result as string
                startTransition(() => {
                    setUploadedImage(imageData)
                    setShowMenu(false)
                })
            }
            reader.readAsDataURL(file)
        }
    }

    const handleRemoveImage = () => {
        startTransition(() => {
            setUploadedImage(null)
        })
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleImageUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleSuggestionClick = (suggestion: Suggestion) => {
        const formattedAnswer = formatAnswerWithLink(suggestion)
        startTransition(() => {
            setAnswer(formattedAnswer)
            setShowAnswer(true)
            setShowSuggest(false)
            setInputValue("")
            setIsTyping(false)
            setCurrentSuggestion(suggestion)
        })
    }

    const handleQuestionClick = (q: string) => {
        // Find the matching suggestion
        const matchedSuggestion = suggestions.find((s) => 
            s.questions.some(question => question.toLowerCase() === q.toLowerCase())
        )
        
        if (matchedSuggestion) {
            const formattedAnswer = formatAnswerWithLink(matchedSuggestion)
            startTransition(() => {
                setAnswer(formattedAnswer)
                setShowAnswer(true)
                setShowSuggest(false)
                setInputValue("")
                setIsTyping(false)
                setQuestion(null)
                setCurrentSuggestion(matchedSuggestion)
            })
        }
    }

    const formatAnswerWithLink = (suggestion: Suggestion): string => {
        let formattedAnswer = suggestion.answer
        if (suggestion.linkTitle) {
            const link = suggestion.link
            let href = ""
            
            if (typeof link === "string") {
                href = link
            } else if (link && typeof link === "object") {
                href = link.webPageId ? `/${link.webPageId}` : link.href || ""
            }
            
            if (href) {
                formattedAnswer += `\n\n[${suggestion.linkTitle}](${href})`
            }
        }
        return formattedAnswer
    }

    const generateErrorMessage = (): { message: string, questions: Array<{question: string, suggestion: Suggestion}> } => {
        const availableTopics = []
        const questionsArray: Array<{question: string, suggestion: Suggestion}> = []
        
        if (items.length > 0) {
            const menuLabels = items.slice(0, 3).map(item => item.label).join(", ")
            availableTopics.push(`visiting our pages: ${menuLabels}`)
        }
        
        if (suggestions.length > 0) {
            suggestions.slice(0, 3).forEach(suggestion => {
                if (suggestion.questions.length > 0) {
                    questionsArray.push({
                        question: suggestion.questions[0],
                        suggestion: suggestion
                    })
                }
            })
        }
        
        const message = availableTopics.length > 0 
            ? `We couldn't find what you were looking for. You can try ${availableTopics.join(" or ")}.`
            : `We couldn't find what you were looking for.`
        
        return { message, questions: questionsArray }
    }

    const handleSendClick = () => {
        // Close suggestions immediately when send is clicked
        startTransition(() => {
            setShowSuggest(false)
        })
        
        if (question) {
            const matchedSuggestion = suggestions.find((s) => 
                s.questions.some(q => q.toLowerCase() === question.toLowerCase())
            )
            
            if (matchedSuggestion) {
                const formattedAnswer = formatAnswerWithLink(matchedSuggestion)
                startTransition(() => {
                    setAnswer(formattedAnswer)
                    setShowAnswer(true)
                    setInputValue("")
                    setIsTyping(false)
                    setQuestion(null)
                    setCurrentSuggestion(matchedSuggestion)
                })
                return
            }
        }
        
        // Check if input matches a menu item exactly
        const matchedItem = items.find(
            (item) => item.label.toLowerCase() === inputValue.toLowerCase()
        )
        
        // If exact menu item match, navigate directly
        if (matchedItem) {
            navigateToLink(matchedItem.link)
            return
        }
        
        // If no matches and AI is enabled, use AI response
        if (enableAI && inputValue.trim() && brandInfo.trim()) {
            handleAIResponse(inputValue)
        } else if (inputValue.trim()) {
            const { message, questions: questionsArray } = generateErrorMessage()
            startTransition(() => {
                setAnswer(message)
                setQuestions(questionsArray)
                setShowAnswer(true)
                setInputValue("")
                setIsTyping(false)
                setCurrentSuggestion(null)
            })
        }
    }

    const handleAIResponse = async (q: string) => {
        startTransition(() => setLoading(true))
        startTransition(() => setIsStreaming(true))
        startTransition(() => setAnswer(""))
        startTransition(() => setShowAnswer(true))
        
        try {
            let aiAnswer = ""

            // Create tone-specific instructions
            const toneInstructions = {
                exciting: "Use an enthusiastic and energetic tone with exclamation marks and positive language.",
                friendly: "Use a warm, conversational, and approachable tone.",
                professional: "Use a polished, business-appropriate tone with clear and concise language.",
                casual: "Use a relaxed, informal tone as if talking to a friend.",
                formal: "Use a respectful, structured tone with proper grammar and formal language.",
                edgy: "Use a bold, confident tone with a bit of attitude and personality.",
                witty: "Use a clever, humorous tone with wordplay and light-hearted responses.",
                empathetic: "Use a caring, understanding tone that shows genuine concern and support.",
                concise: "Use brief, to-the-point responses with minimal elaboration.",
                detailed: "Use comprehensive, thorough responses with explanations and context."
            }

            // Create menu items context for AI
            const itemsList = items.map(item => item.label).join(", ")

            const systemPrompt = `You are a helpful AI assistant EXCLUSIVELY for this brand. Your role is to answer questions ONLY about this brand and its offerings.

BRAND INFORMATION:
${brandInfo}

AVAILABLE MENU ITEMS/PAGES:
${itemsList}

CRITICAL INSTRUCTIONS - STRICTLY ENFORCE:
1. ONLY answer questions that are directly related to the brand information provided above
2. DO NOT answer questions about topics, products, or services outside the brand information
3. DO NOT provide general knowledge, advice, or information unrelated to this specific brand
4. If a user asks about ANYTHING not covered in the brand information, you MUST respond with:
   "I'm sorry, but I can only provide information about [brand name/our brand]. That question isn't related to what we offer. Is there anything about our brand, products, or services I can help you with?"
5. NEVER make assumptions or provide information that isn't explicitly stated in the brand information
6. If specific details are missing from the brand information, respond with:
   "I don't have that specific information available at the moment. Please contact us directly at [contact info if available] for more details about [topic]."
7. Stay strictly within the scope of the brand - no exceptions
8. If the user's question relates to any of the available menu items (${itemsList}), mention the relevant page(s) in your response and indicate which menu items are relevant by ending your response with: "SUGGESTED_MENU_ITEMS: [item1, item2, ...]"
9. KEEP ALL RESPONSES EXTREMELY SHORT - Maximum 2-3 sentences
10. Be direct and concise - no lengthy explanations or elaborations
11. If a response would be longer than 3 sentences, summarize it into 2-3 key points instead

RESPONSE TONE: ${toneInstructions[tone]}

Keep responses concise (2-3 sentences maximum) and always redirect off-topic questions back to the brand.`

            const requestBody = {
                message: q,
                context: brandInfo,
                systemPrompt: systemPrompt,
                suggestions: suggestions,
                menuItems: items,
                tone: tone,
                settings: settings,
                image: uploadedImage,
                websiteURL: websiteURL,
            }

            // Use streaming endpoint
            const response = await fetch("https://nav-assistant.vercel.app/api/chat-stream", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            })

            if (!response.ok) {
                const errorText = await response.text()
                let data
                try {
                    data = JSON.parse(errorText)
                } catch (parseError) {
                    throw new Error(`Invalid response: ${errorText.substring(0, 100)}...`)
                }
                throw new Error(data.error || data.message || response.statusText)
            }

            // Read the stream
            const reader = response.body?.getReader()
            const decoder = new TextDecoder()
            
            if (!reader) {
                throw new Error("Response body is not readable")
            }
            
            let streamedAnswer = ""
            let metadata: any = {}
            
            while (true) {
                const { done, value } = await reader.read()
                
                if (done) break
                
                const chunk = decoder.decode(value, { stream: true })
                const lines = chunk.split('\n')
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6)
                        
                        if (data === '[DONE]') {
                            continue
                        }
                        
                        try {
                            const parsed = JSON.parse(data)
                            
                            if (parsed.type === 'token') {
                                // Stream individual tokens
                                streamedAnswer += parsed.content
                                startTransition(() => setAnswer(streamedAnswer))
                            } else if (parsed.type === 'metadata') {
                                // Store metadata for later use
                                metadata = parsed
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }
            
            aiAnswer = streamedAnswer || "I'm sorry, I couldn't generate a response."
            
            // Extract images from AI response
            const aiResponseImages = metadata.images || []
            
            // Extract link and linkTitle from AI response
            const aiResponseLink = metadata.link || null
            const aiResponseLinkTitle = metadata.linkTitle || null
            
            // Extract suggested menu items from AI response
            const suggestedItems: Item[] = []
            
            // First check if backend provided menuItems array
            if (metadata.menuItems && Array.isArray(metadata.menuItems)) {
                // Match the menu item labels to actual menu items (max 3)
                metadata.menuItems.slice(0, 3).forEach((menuLabel: string) => {
                    const matchedItem = items.find(item => 
                        item.label.toLowerCase() === menuLabel.toLowerCase()
                    )
                    if (matchedItem) {
                        suggestedItems.push(matchedItem)
                    }
                })
            } else {
                // Fallback: Check for SUGGESTED_MENU_ITEMS tag in answer
                const itemMatch = aiAnswer.match(/SUGGESTED_MENU_ITEMS:\s*\[?(.*?)\]?$/i)
                
                if (itemMatch) {
                    const suggestedLabels = itemMatch[1].split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 0)
                    suggestedLabels.slice(0, 3).forEach(label => {
                        const matchedItem = items.find(item => 
                            item.label.toLowerCase() === label
                        )
                        if (matchedItem) {
                            suggestedItems.push(matchedItem)
                        }
                    })
                    // Remove the SUGGESTED_MENU_ITEMS tag from the answer
                    aiAnswer = aiAnswer.replace(/SUGGESTED_MENU_ITEMS:\s*\[?.*?\]?$/i, '').trim()
                }
            }
            
            // Extract suggested questions from AI response
            const suggestedQuestions: Array<{question: string, suggestion: Suggestion}> = []
            
            if (metadata.questions && Array.isArray(metadata.questions)) {
                // Match the question strings to actual suggestions (max 3)
                metadata.questions.slice(0, 3).forEach((questionText: string) => {
                    // Find a suggestion that contains this question
                    const matchedSuggestion = suggestions.find(s => 
                        s.questions.some(q => q.toLowerCase() === questionText.toLowerCase())
                    )
                    
                    if (matchedSuggestion) {
                        suggestedQuestions.push({
                            question: questionText,
                            suggestion: matchedSuggestion
                        })
                    } else {
                        // If no exact match, try to find a suggestion with similar keywords
                        const questionLower = questionText.toLowerCase()
                        const keywordMatch = suggestions.find(s =>
                            s.keywords.some(keyword => questionLower.includes(keyword.toLowerCase()))
                        )
                        
                        if (keywordMatch && keywordMatch.questions.length > 0) {
                            suggestedQuestions.push({
                                question: keywordMatch.questions[0],
                                suggestion: keywordMatch
                            })
                        }
                    }
                })
            }
            
            startTransition(() => {
                setAnswer(aiAnswer)
                setSuggested(suggestedItems)
                setQuestions(suggestedQuestions)
                setAiImages(aiResponseImages)
                setAiLink(aiResponseLink)
                setAiLinkTitle(aiResponseLinkTitle)
                setShowAnswer(true)
                setLoading(false)
                setIsStreaming(false)
                setInputValue("")
                setIsTyping(false)
                setCurrentSuggestion(null)
                setUploadedImage(null)
            })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
            
            startTransition(() => {
                setAnswer(`Error: API error: ${errorMessage}. Please check your API configuration and try again.`)
                setShowAnswer(true)
                setLoading(false)
                setInputValue("")
                setIsTyping(false)
                setCurrentSuggestion(null)
                setAiImages([])
                setAiLink(null)
                setAiLinkTitle(null)
                setIsStreaming(false)
            })
        }
    }

    const pillStyle: CSSProperties = {
        padding: pills.pillPadding,
        cursor: "pointer",
        color: colors.text.pill,
        backgroundColor: colors.pill.background,
        borderRadius: pills.borderRadius,
        transition: "all 0.2s",
        whiteSpace: "nowrap",
        ...fonts.pill,
    }

    const closeButtonStyle: CSSProperties = {
        position: "absolute",
        top: 8,
        right: 16,
        padding: 0,
        backgroundColor: colors.pill.background,
        color: colors.menu.icon,
        border: "none",
        borderRadius: "50%",
        cursor: "pointer",
        width: 32,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    }

    const parseMarkdown = (text: string): JSX.Element => {
        const lines = text.split('\n')
        const elements: JSX.Element[] = []
        let listItems: string[] = []
        let inCodeBlock = false
        let codeBlockContent: string[] = []
        let codeBlockLanguage = ""

        const flushList = () => {
            if (listItems.length > 0) {
                elements.push(
                    <ul key={`list-${elements.length}`} style={{ margin: "8px 0", paddingLeft: "20px" }}>
                        {listItems.map((item, i) => (
                            <li key={i} style={{ marginBottom: "4px" }}>
                                {parseInlineMarkdown(item)}
                            </li>
                        ))}
                    </ul>
                )
                listItems = []
            }
        }

        const flushCodeBlock = () => {
            if (codeBlockContent.length > 0) {
                elements.push(
                    <pre key={`code-${elements.length}`} style={{
                        backgroundColor: "#F5F5F5",
                        padding: "12px",
                        borderRadius: "8px",
                        overflow: "auto",
                        margin: "8px 0",
                    }}>
                        <code style={{
                            color: "#E01E5A",
                            fontFamily: "monospace",
                            fontSize: "14px",
                        }}>
                            {codeBlockContent.join('\n')}
                        </code>
                    </pre>
                )
                codeBlockContent = []
                codeBlockLanguage = ""
            }
        }

        const parseInlineMarkdown = (text: string): JSX.Element => {
            const parts: (string | JSX.Element)[] = []
            let remaining = text
            let key = 0

            while (remaining.length > 0) {
                // Bold **text**
                const boldMatch = remaining.match(/^\*\*(.+?)\*\*/)
                if (boldMatch) {
                    parts.push(<strong key={key++}>{boldMatch[1]}</strong>)
                    remaining = remaining.slice(boldMatch[0].length)
                    continue
                }

                // Italic *text*
                const italicMatch = remaining.match(/^\*(.+?)\*/)
                if (italicMatch) {
                    parts.push(<em key={key++}>{italicMatch[1]}</em>)
                    remaining = remaining.slice(italicMatch[0].length)
                    continue
                }

                // Inline code `code`
                const codeMatch = remaining.match(/^`(.+?)`/)
                if (codeMatch) {
                    parts.push(
                        <code key={key++} style={{
                            backgroundColor: "#F5F5F5",
                            color: "#E01E5A",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontFamily: "monospace",
                            fontSize: "0.9em",
                        }}>
                            {codeMatch[1]}
                        </code>
                    )
                    remaining = remaining.slice(codeMatch[0].length)
                    continue
                }

                // Links [text](url) - Render as pill buttons
                const linkMatch = remaining.match(/^\[(.+?)\]\((.+?)\)/)
                if (linkMatch) {
                    const linkText = linkMatch[1]
                    const linkUrl = linkMatch[2]
                    
                    parts.push(
                        <button
                            key={key++}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                navigateToLink(linkUrl)
                            }}
                            style={{
                                ...pillStyle,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: "14px",
                                padding: "8px 16px",
                                marginLeft: "4px",
                                marginRight: "4px",
                                border: "none",
                                verticalAlign: "middle",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = colors.pill.hover
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = colors.pill.background
                            }}
                        >
                            {linkText}
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                                <path
                                    d="M3 6H9M9 6L6 3M9 6L6 9"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    )
                    remaining = remaining.slice(linkMatch[0].length)
                    continue
                }

                // Regular text
                parts.push(remaining[0])
                remaining = remaining.slice(1)
            }

            return <>{parts}</>
        }

        lines.forEach((line, index) => {
            // Code block
            if (line.startsWith('```')) {
                if (inCodeBlock) {
                    flushCodeBlock()
                    inCodeBlock = false
                } else {
                    flushList()
                    inCodeBlock = true
                    codeBlockLanguage = line.slice(3).trim()
                }
                return
            }

            if (inCodeBlock) {
                codeBlockContent.push(line)
                return
            }

            // Heading
            const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
            if (headingMatch) {
                flushList()
                const level = headingMatch[1].length
                const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements
                elements.push(
                    <HeadingTag key={`heading-${index}`} style={{
                        color: colors.text.response,
                        fontWeight: "bold",
                        fontSize: `${2 - (level * 0.2)}em`,
                        margin: "12px 0 8px 0",
                    }}>
                        {parseInlineMarkdown(headingMatch[2])}
                    </HeadingTag>
                )
                return
            }

            // List item
            const listMatch = line.match(/^[-*]\s+(.+)$/)
            if (listMatch) {
                listItems.push(listMatch[1])
                return
            }

            // Regular paragraph
            if (line.trim()) {
                flushList()
                elements.push(
                    <p key={`p-${index}`} style={{ margin: "8px 0" }}>
                        {parseInlineMarkdown(line)}
                    </p>
                )
            } else if (elements.length > 0) {
                // Empty line - add spacing
                elements.push(<div key={`space-${index}`} style={{ height: "8px" }} />)
            }
        })

        flushList()
        flushCodeBlock()

        return <>{elements}</>
    }

    const renderIcon = (iconName: string, size: number = 16, strokeWidth: number = 1) => {
        if (!iconName || iconName === "none") return null

        const iconProps = {
            width: size,
            height: size,
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: strokeWidth,
            strokeLinecap: "round" as const,
            strokeLinejoin: "round" as const,
        }

        switch (iconName) {
            case "home":
                return <svg {...iconProps}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            case "star":
                return <svg {...iconProps}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            case "heart":
                return <svg {...iconProps}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            case "user":
                return <svg {...iconProps}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            case "settings":
                return <svg {...iconProps}><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m-2 2l-4.2 4.2m13.2-5.2l-4.2-4.2m-2 2l-4.2-4.2"/></svg>
            case "search":
                return <svg {...iconProps}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            case "mail":
                return <svg {...iconProps}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            case "phone":
                return <svg {...iconProps}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            case "calendar":
                return <svg {...iconProps}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            case "folder":
                return <svg {...iconProps}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            case "file":
                return <svg {...iconProps}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
            case "image":
                return <svg {...iconProps}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            case "video":
                return <svg {...iconProps}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            case "music":
                return <svg {...iconProps}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            case "cart":
                return <svg {...iconProps}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            case "tag":
                return <svg {...iconProps}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            case "bookmark":
                return <svg {...iconProps}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            case "bell":
                return <svg {...iconProps}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            case "clock":
                return <svg {...iconProps}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            case "map":
                return <svg {...iconProps}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
            case "globe":
                return <svg {...iconProps}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            case "link":
                return <svg {...iconProps}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            case "lock":
                return <svg {...iconProps}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            case "unlock":
                return <svg {...iconProps}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
            case "eye":
                return <svg {...iconProps}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            case "edit":
                return <svg {...iconProps}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            case "trash":
                return <svg {...iconProps}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            case "download":
                return <svg {...iconProps}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            case "upload":
                return <svg {...iconProps}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            case "share":
                return <svg {...iconProps}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            case "arrow-right":
                return <svg {...iconProps}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            case "arrow-left":
                return <svg {...iconProps}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            case "arrow-up":
                return <svg {...iconProps}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
            case "arrow-down":
                return <svg {...iconProps}><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
            case "chevron-right":
                return <svg {...iconProps}><polyline points="9 18 15 12 9 6"/></svg>
            case "chevron-left":
                return <svg {...iconProps}><polyline points="15 18 9 12 15 6"/></svg>
            case "chevron-up":
                return <svg {...iconProps}><polyline points="18 15 12 9 6 15"/></svg>
            case "chevron-down":
                return <svg {...iconProps}><polyline points="6 9 12 15 18 9"/></svg>
            case "check":
                return <svg {...iconProps}><polyline points="20 6 9 17 4 12"/></svg>
            case "x":
                return <svg {...iconProps}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            case "plus":
                return <svg {...iconProps}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            case "minus":
                return <svg {...iconProps}><line x1="5" y1="12" x2="19" y2="12"/></svg>
            case "info":
                return <svg {...iconProps}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            case "alert":
                return <svg {...iconProps}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            case "help":
                return <svg {...iconProps}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            default:
                return null
        }
    }

    const renderMenuIcon = () => {
        const iconProps = {
            width: "20",
            height: "20",
            viewBox: "0 0 20 20",
            fill: "none",
            style: { color: colors.menu.icon }
        }

        // All icons animate to X when menu is open
        if (showMenu) {
            return (
                <motion.svg {...iconProps}>
                    <motion.path
                        d="M5 5L15 15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={false}
                        animate={isStatic ? {} : { d: "M5 5L15 15" }}
                        transition={isStatic ? {} : { duration: 0.3, ease: "easeInOut" }}
                    />
                    <motion.path
                        d="M5 15L15 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={false}
                        animate={isStatic ? {} : { d: "M5 15L15 5" }}
                        transition={isStatic ? {} : { duration: 0.3, ease: "easeInOut" }}
                    />
                </motion.svg>
            )
        }

        switch (menuIcon) {
            case "pin":
                return (
                    <motion.svg {...iconProps}>
                        <motion.path
                            d="M10 2L10 10M10 10L6 14M10 10L14 14M10 10L10 18"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={false}
                            animate={isStatic ? {} : { d: "M10 2L10 10M10 10L6 14M10 10L14 14M10 10L10 18" }}
                            transition={isStatic ? {} : { duration: 0.3, ease: "easeInOut" }}
                        />
                    </motion.svg>
                )
            case "hamburger":
                return (
                    <motion.svg {...iconProps}>
                        <motion.path
                            d="M3 5H17"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            initial={false}
                            animate={isStatic ? {} : { d: "M3 5H17" }}
                            transition={isStatic ? {} : { duration: 0.3, ease: "easeInOut" }}
                        />
                        <motion.path
                            d="M3 10H17"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            initial={false}
                            animate={isStatic ? {} : { d: "M3 10H17" }}
                            transition={isStatic ? {} : { duration: 0.3, ease: "easeInOut" }}
                        />
                        <motion.path
                            d="M3 15H17"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            initial={false}
                            animate={isStatic ? {} : { d: "M3 15H17" }}
                            transition={isStatic ? {} : { duration: 0.3, ease: "easeInOut" }}
                        />
                    </motion.svg>
                )
            case "grid":
                return (
                    <motion.svg {...iconProps}>
                        <motion.path
                            d="M4 4H8V8H4V4ZM12 4H16V8H12V4ZM4 12H8V16H4V12ZM12 12H16V16H12V12Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={false}
                            animate={isStatic ? {} : { d: "M4 4H8V8H4V4ZM12 4H16V8H12V4ZM4 12H8V16H4V12ZM12 12H16V16H12V12Z" }}
                            transition={isStatic ? {} : { duration: 0.3, ease: "easeInOut" }}
                        />
                    </motion.svg>
                )
            case "dots":
                return (
                    <motion.svg {...iconProps}>
                        <motion.circle 
                            cx="10" 
                            cy="5" 
                            r="1.5" 
                            fill="currentColor"
                            initial={false}
                            animate={isStatic ? {} : { cx: 10, cy: 5, r: 1.5 }}
                            transition={isStatic ? {} : { duration: 0.3, ease: "easeInOut" }}
                        />
                        <motion.circle 
                            cx="10" 
                            cy="10" 
                            r="1.5" 
                            fill="currentColor"
                            initial={false}
                            animate={isStatic ? {} : { cx: 10, cy: 10, r: 1.5 }}
                            transition={isStatic ? {} : { duration: 0.3, ease: "easeInOut" }}
                        />
                        <motion.circle 
                            cx="10" 
                            cy="15" 
                            r="1.5" 
                            fill="currentColor"
                            initial={false}
                            animate={isStatic ? {} : { cx: 10, cy: 15, r: 1.5 }}
                            transition={isStatic ? {} : { duration: 0.3, ease: "easeInOut" }}
                        />
                    </motion.svg>
                )
            case "plus":
            default:
                return (
                    <motion.svg {...iconProps}>
                        <motion.path
                            d="M10 4V16"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            initial={false}
                            animate={isStatic ? {} : { d: "M10 4V16" }}
                            transition={isStatic ? {} : { duration: 0.3, ease: "easeInOut" }}
                        />
                        <motion.path
                            d="M4 10H16"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            initial={false}
                            animate={isStatic ? {} : { d: "M4 10H16" }}
                            transition={isStatic ? {} : { duration: 0.3, ease: "easeInOut" }}
                        />
                    </motion.svg>
                )
        }
    }
    
    const renderCollapsedIconNew = () => {
        const iconProps = {
            width: "20",
            height: "20",
            viewBox: "0 0 20 20",
            fill: "none",
            style: { color: colors.menu.icon }
        }

        switch (collapsibleSettings.icon) {
            case "chat":
                return (
                    <svg {...iconProps}>
                        <path
                            d="M17 8.5C17 12.09 13.866 15 10 15C8.95 15 7.95 14.78 7.05 14.39L3 15L4.39 11.95C3.61 10.95 3 9.78 3 8.5C3 4.91 6.134 2 10 2C13.866 2 17 4.91 17 8.5Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )
            case "plus":
                return (
                    <svg {...iconProps}>
                        <path d="M10 4V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                )
            case "menu":
                return (
                    <svg {...iconProps}>
                        <path d="M3 5H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M3 10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M3 15H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                )
            case "search":
            default:
                return (
                    <svg {...iconProps}>
                        <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
                        <path d="M14 14L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                )
        }
    }

    // LIVE MODE RENDER - Full interactivity with animations
    
    // Collapsed state render
    if (collapsibleSettings.enabled && isCollapsedNew) {
        return (
            <div
                ref={containerRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 5,
                }}
            >
                <motion.button
                    layoutId="nav-assistant-container"
                    onClick={() => startTransition(() => setIsCollapsedNew(false))}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "0 12px",
                        backgroundColor: colors.background,
                        border: `${colors.container.borderWidth}px solid ${colors.container.border}`,
                        borderRadius: radius,
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        ...fonts.placeholder,
                        color: colors.text.placeholder,
                        height: collapsibleSettings.size || btnSize,
                    }}
                    aria-label="Expand input"
                >
                    <motion.div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        {renderCollapsedIconNew()}
                    </motion.div>
                    {collapsibleSettings.label && (
                        <motion.span
                            style={{
                                display: "flex",
                                alignItems: "center",
                            }}
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            {collapsibleSettings.label}
                        </motion.span>
                    )}
                </motion.button>
            </div>
        )
    }
    
    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                zIndex: 5,
            }}
        >
            <style>{`
                .${placeholderIdRef}::placeholder {
                    color: ${colors.text.placeholder};
                    opacity: 0.5;
                    font-size: ${fonts.placeholder.fontSize || '14px'};
                    font-weight: ${fonts.placeholder.fontWeight || 400};
                    letter-spacing: ${fonts.placeholder.letterSpacing || '0em'};
                    line-height: ${fonts.placeholder.lineHeight || '1.4em'};
                    font-family: ${fonts.placeholder.fontFamily || 'inherit'};
                    font-style: ${fonts.placeholder.fontStyle || 'normal'};
                }
            `}</style>

            {/* Menu Items Drawer */}
            <AnimatePresence>
                {showMenu && items.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        style={{
                            position: "absolute",
                            bottom: panelDirection === "up" ? "100%" : undefined,
                            top: panelDirection === "down" ? "100%" : undefined,
                            left: 0,
                            right: 0,
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: menuLayout === "stacked" ? "column" : "row",
                            flexWrap: menuLayout === "stacked" ? "nowrap" : "wrap",
                            gap: pills.gap,
                            padding: pills.padding,
                            backgroundColor: colors.background,
                            borderTopLeftRadius: panelDirection === "up" ? radius : 0,
                            borderTopRightRadius: panelDirection === "up" ? radius : 0,
                            borderBottomLeftRadius: panelDirection === "up" ? 0 : radius,
                            borderBottomRightRadius: panelDirection === "up" ? 0 : radius,
                            border: `${colors.container.borderWidth}px solid ${colors.container.border}`,
                            borderBottom: panelDirection === "up" ? "none" : undefined,
                            borderTop: panelDirection === "down" ? "none" : undefined,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        }}
                    >
                        {/* Hidden file input */}
                        {allowImageAttachment && (
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ display: "none" }}
                            />
                        )}
                        
                        {/* Image Upload Button */}
                        {allowImageAttachment && enableAI && (
                            <>
                            <div
                                onClick={handleImageUploadClick}
                                style={{ 
                                    ...pillStyle, 
                                    display: "flex",
                                    alignItems: "center",
                                    gap: pills.pillGap,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = colors.pill.hover
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = colors.pill.background
                                }}
                            >
                                <span style={{ display: "flex", alignItems: "center", color: colors.menu.icon }}>
                                    {renderIcon(pills.uploadImage.icon, pills.iconSize, pills.iconStrokeWidth)}
                                </span>
                                <span>{pills.uploadImage.text}</span>
                            </div>
                            
                            {/* Separator line */}
                            <div
                                style={{
                                    backgroundColor: colors.menu.border,
                                    ...(menuLayout === "stacked"
                                        ? {
                                    width: "96%",
                                            height: "1px",
                                            alignSelf: "center",
                                        }
                                        : {
                                            width: "1px",
                                            height: "20px",
                                            alignSelf: "center",
                                        }),
                                }}
                            />
                            </>
                        )}
                        
                        {items.map((item, index) => (
                            <div
                                key={`menu-${index}`}
                                onClick={() => handleItemClick(item)}
                                style={{ 
                                    ...pillStyle, 
                                    display: "flex",
                                    alignItems: "center",
                                    gap: pills.pillGap,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = colors.pill.hover
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = colors.pill.background
                                }}
                            >
                                {item.leadingIcon && item.leadingIcon !== "none" && (
                                    <span style={{ display: "flex", alignItems: "center", color: colors.menu.icon }}>
                                        {renderIcon(item.leadingIcon, pills.iconSize, pills.iconStrokeWidth)}
                                    </span>
                                )}
                                <span>{item.label}</span>
                                {item.trailingIcon && item.trailingIcon !== "none" && (
                                    <span style={{ display: "flex", alignItems: "center", color: colors.menu.icon }}>
                                        {renderIcon(item.trailingIcon, pills.iconSize, pills.iconStrokeWidth)}
                                    </span>
                                )}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Answer Chat Response */}
            <AnimatePresence>
                {(showAnswer && answer) || loading ? (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        style={{
                            position: "absolute",
                            bottom: panelDirection === "up" ? "calc(100% + 12px)" : undefined,
                            top: panelDirection === "down" ? "calc(100% + 12px)" : undefined,
                            left: 0,
                            right: 0,
                            overflow: "hidden",
                            backgroundColor: colors.panel,
                            borderRadius: radius,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                            maxHeight: "400px",
                            display: "flex",
                            flexDirection: panelDirection === "down" ? "column-reverse" : "column",
                        }}
                    >
                        {!loading && (
                            <button
                                onClick={() => startTransition(() => {
                                    setShowAnswer(false)
                                    setSuggested([])
                                    setAnswer("")
                                    setQuestions([])
                                    setCurrentSuggestion(null)
                                    setAiImages([])
                                    setAiLink(null)
                                    setAiLinkTitle(null)
                                })}
                                style={closeButtonStyle}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = colors.pill.hover
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = colors.pill.background
                                }}
                                aria-label="Close"
                            >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path
                                        d="M2 2L10 10M2 10L10 2"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </button>
                        )}
                        <div style={{ 
                            color: colors.text.response, 
                            ...fonts.response,
                            padding: 24,
                            paddingTop: loading ? 24 : 40,
                            overflowY: "auto",
                            flex: 1,
                            minHeight: 0,
                        }}>
                            {loading ? "Curating response..." : (
                                <>
                                    {currentSuggestion?.images && currentSuggestion.images.length > 0 && (
                                        <div style={{ 
                                            marginBottom: panelDirection === "down" ? 0 : 16,
                                            marginTop: panelDirection === "down" ? 16 : 0,
                                            display: "grid",
                                            gridTemplateColumns: currentSuggestion.images.length === 1 
                                                ? "1fr" 
                                                : currentSuggestion.images.length === 2 
                                                ? "repeat(2, 1fr)" 
                                                : "repeat(auto-fit, minmax(150px, 1fr))",
                                            gap: 12,
                                            borderRadius: 8,
                                            overflow: "hidden",
                                        }}>
                                            {currentSuggestion.images.map((image, idx) => (
                                                <img 
                                                    key={idx}
                                                    src={image.src}
                                                    srcSet={image.srcSet}
                                                    alt={image.alt || ""}
                                                    style={{
                                                        width: "100%",
                                                        height: "auto",
                                                        display: "block",
                                                        borderRadius: 8,
                                                        objectFit: "cover",
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    {aiImages.length > 0 && (
                                        <div style={{ 
                                            marginBottom: panelDirection === "down" ? 0 : 16,
                                            marginTop: panelDirection === "down" ? 16 : 0,
                                            display: "grid",
                                            gridTemplateColumns: aiImages.length === 1 
                                                ? "1fr" 
                                                : aiImages.length === 2 
                                                ? "repeat(2, 1fr)" 
                                                : "repeat(auto-fit, minmax(150px, 1fr))",
                                            gap: 12,
                                            borderRadius: 8,
                                            overflow: "hidden",
                                        }}>
                                            {aiImages.map((image, idx) => (
                                                <img 
                                                    key={idx}
                                                    src={image.src}
                                                    srcSet={image.srcSet}
                                                    alt={image.alt || ""}
                                                    style={{
                                                        width: "100%",
                                                        height: "auto",
                                                        display: "block",
                                                        borderRadius: 8,
                                                        objectFit: "cover",
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    {parseMarkdown(answer)}
                                </>
                            )}
                        </div>
                        
                        {/* Suggested Menu Items */}
                        {!loading && suggested.length > 0 && (
                            <div
                                style={{
                                    padding: "0 24px 16px 24px",
                                    paddingTop: 16,
                                    borderTop: panelDirection === "down" ? "none" : `1px solid ${colors.pill.background}`,
                                    borderBottom: panelDirection === "down" ? `1px solid ${colors.pill.background}` : "none",
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 8,
                                    flexShrink: 0,
                                }}
                            >
                                {suggested.map((item, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleItemClick(item)}
                                        style={{ ...pillStyle, fontSize: 14, padding: "8px 16px" }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = colors.pill.hover
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = colors.pill.background
                                        }}
                                    >
                                        {item.label}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* AI Response Link */}
                        {!loading && aiLink && aiLinkTitle && (
                            <div
                                style={{
                                    padding: "0 24px 16px 24px",
                                    paddingTop: suggested.length > 0 ? 0 : 16,
                                    borderTop: panelDirection === "down" || suggested.length > 0 ? "none" : `1px solid ${colors.pill.background}`,
                                    borderBottom: panelDirection === "down" && suggested.length === 0 ? `1px solid ${colors.pill.background}` : "none",
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 8,
                                    flexShrink: 0,
                                }}
                            >
                                <button
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        navigateToLink(aiLink)
                                    }}
                                    style={{
                                        ...pillStyle,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                        fontSize: "14px",
                                        padding: "8px 16px",
                                        border: "none",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = colors.pill.hover
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = colors.pill.background
                                    }}
                                >
                                    {aiLinkTitle}
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                                        <path
                                            d="M3 6H9M9 6L6 3M9 6L6 9"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                            </div>
                        )}
                        
                        {/* Suggested Questions */}
                        {!loading && questions.length > 0 && (
                            <div
                                style={{
                                    padding: "0 24px 16px 24px",
                                    marginTop: 16,
                                    paddingTop: 16,
                                    borderTop: panelDirection === "down" ? "none" : `1px solid ${colors.pill.background}`,
                                    borderBottom: panelDirection === "down" ? `1px solid ${colors.pill.background}` : "none",
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 8,
                                    flexShrink: 0,
                                }}
                            >
                                {questions.map((item, index) => (
                                    <div
                                        key={index}
                                        onClick={() => {
                                            const formattedAnswer = formatAnswerWithLink(item.suggestion)
                                            startTransition(() => {
                                                setAnswer(formattedAnswer)
                                                setQuestions([])
                                                setShowAnswer(true)
                                                setCurrentSuggestion(item.suggestion)
                                            })
                                        }}
                                        style={{ ...pillStyle, color: colors.text.suggestion, fontSize: 14, padding: "8px 16px" }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = colors.pill.hover
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = colors.pill.background
                                        }}
                                    >
                                        {item.question}
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* Input Row */}
            <div
                style={{
                    display: "flex",
                    flexDirection: isTyping || uploadedImage ? (panelDirection === "down" ? "column-reverse" : "column") : "row",
                    gap: 12,
                    alignItems: isTyping || uploadedImage ? "stretch" : "center",
                    backgroundColor: colors.background,
                    borderTopLeftRadius: showMenu && panelDirection === "up" ? 0 : radius,
                    borderTopRightRadius: showMenu && panelDirection === "up" ? 0 : radius,
                    borderBottomLeftRadius: showMenu && panelDirection === "down" ? 0 : radius,
                    borderBottomRightRadius: showMenu && panelDirection === "down" ? 0 : radius,
                    padding: 16,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    position: "relative",
                    border: `${colors.container.borderWidth}px solid ${colors.container.border}`,
                    transition: showMenu 
                        ? "border-radius 0.1s ease-in-out" 
                        : "border-radius 0.3s ease-in-out 0.25s",
                }}
            >
                {!isTyping && !uploadedImage && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                            style={{
                                ...btnStyle,
                                backgroundColor: colors.menu.background,
                                border: `1px solid ${colors.menu.border}`,
                            }}
                            onClick={handleMenuClick}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.menu.hover)}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.menu.background)}
                            aria-label="Show menu items"
                        >
                            {renderMenuIcon()}
                        </button>

                        {/* Current Page Pill */}
                        {pagePill && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    ...pillStyle,
                                }}
                            >
                                <span>{pagePill.label}</span>
                                <button
                                    onClick={handleClosePill}
                                    style={{
                                        padding: 0,
                                        backgroundColor: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: colors.menu.icon,
                                        opacity: 0.6,
                                        transition: "opacity 0.2s",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.opacity = "1"
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.opacity = "0.6"
                                    }}
                                    aria-label="Close and go to default page"
                                >
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path
                                            d="M2 2L10 10M2 10L10 2"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", gap: 8 }}>
                        {/* Image attachment preview */}
                        {uploadedImage && (
                            <div style={{
                                position: "relative",
                                width: 80,
                                height: 80,
                                borderRadius: 8,
                                overflow: "hidden",
                                alignSelf: "flex-start",
                            }}>
                                <img 
                                    src={uploadedImage} 
                                    alt="Uploaded attachment" 
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />
                                <button
                                    onClick={handleRemoveImage}
                                    style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "50%",
                                        transform: "translate(-50%, -50%)",
                                        padding: 0,
                                        backgroundColor: colors.pill.background,
                                        border: "none",
                                        borderRadius: "50%",
                                        cursor: "pointer",
                                        width: 28,
                                        height: 28,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: colors.menu.icon,
                                        opacity: 0.9,
                                        transition: "opacity 0.2s",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.opacity = "1"
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.opacity = "0.9"
                                    }}
                                    aria-label="Remove image"
                                >
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <path
                                            d="M2 2L12 12M2 12L12 2"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </button>
                            </div>
                        )}
                        
                        <textarea
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => {
                                const value = e.target.value
                                startTransition(() => {
                                    setInputValue(value)
                                    setIsTyping(value.trim() !== "")
                                    if (value === "") {
                                        setSelected(false)
                                        setQuestion(null)
                                        setShowMenu(false)
                                    } else if (value === "/") {
                                        setShowMenu(true)
                                        setShowSuggest(false)
                                    } else if (showMenu) {
                                        setShowMenu(false)
                                    }
                                    if (showAnswer && value.trim() !== "") {
                                        setShowAnswer(false)
                                        setAnswer("")
                                        setSuggested([])
                                        setQuestions([])
                                        setCurrentSuggestion(null)
                                        setAiImages([])
                                        setAiLink(null)
                                        setAiLinkTitle(null)
                                    }
                                })
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSendClick()
                                }
                            }}
                            placeholder={isCanvas || placeholders.length === 0 ? placeholder : ""}
                            rows={1}
                            className={placeholderIdRef}
                            style={{
                                width: "100%",
                                padding: `${(btnSize - 24) / 2}px 0`,
                                backgroundColor: "transparent",
                                color: colors.text.input,
                                border: "none",
                                outline: "none",
                                resize: "none",
                                overflow: "auto",
                                maxHeight: "120px",
                                whiteSpace: "pre-wrap",
                                wordWrap: "break-word",
                                ...fonts.input,
                            }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement
                                target.style.height = "auto"
                                target.style.height = `${Math.min(target.scrollHeight, 120)}px`
                            }}
                        />

                        {/* Custom animated placeholder */}
                        {inputValue === "" && placeholders.length > 0 && (
                            <div
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: uploadedImage ? "90px" : `${(btnSize - 24) / 2}px`,
                                    pointerEvents: "none",
                                    color: colors.text.placeholder,
                                    opacity: 0.5,
                                    ...fonts.placeholder,
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={placeholderIdx}
                                        initial={{ opacity: 0, y: 5, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -5, scale: 0.98 }}
                                        transition={{ 
                                            duration: 1.2, 
                                            ease: [0.25, 0.1, 0.25, 1]
                                        }}
                                    >
                                        {placeholders[placeholderIdx] || placeholder}
                                    </motion.span>
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {!isTyping && !uploadedImage && (
                        <button
                            style={{
                                ...btnStyle,
                                backgroundColor: colors.send.background,
                                border: `1px solid ${colors.send.border}`,
                            }}
                            onClick={handleSendClick}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.send.hover)}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.send.background)}
                            aria-label="Send"
                        >
                            {renderSendIcon()}
                        </button>
                    )}
                </div>

                {isTyping || uploadedImage ? (
                    <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button
                                style={{
                                    ...btnStyle,
                                    backgroundColor: colors.menu.background,
                                    border: `1px solid ${colors.menu.border}`,
                                }}
                                onClick={handleMenuClick}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.menu.hover)}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.menu.background)}
                                aria-label="Show menu items"
                            >
                                {renderMenuIcon()}
                            </button>

                            {/* Current Page Pill */}
                            {pagePill && (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        ...pillStyle,
                                    }}
                                >
                                    <span>{pagePill.label}</span>
                                    <button
                                        onClick={handleClosePill}
                                        style={{
                                            padding: 0,
                                            backgroundColor: "transparent",
                                            border: "none",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: colors.menu.icon,
                                            opacity: 0.6,
                                            transition: "opacity 0.2s",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.opacity = "1"
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.opacity = "0.6"
                                        }}
                                        aria-label="Close and go to default page"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                            <path
                                                d="M2 2L10 10M2 10L10 2"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <button
                            style={{
                                ...btnStyle,
                                backgroundColor: colors.send.background,
                                border: `1px solid ${colors.send.border}`,
                            }}
                            onClick={handleSendClick}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.send.hover)}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.send.background)}
                            aria-label="Send"
                        >
                            {renderSendIcon()}
                        </button>
                    </div>
                ) : null}
            </div>

            {/* Suggestions Drawer */}
            <AnimatePresence>
                {showSuggest && (filtered.length > 0 || filteredItems.length > 0) && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        style={{
                            position: "absolute",
                            bottom: settings.panelDirection === "up" ? "calc(100% + 12px)" : undefined,
                            top: settings.panelDirection === "down" ? "calc(100% + 12px)" : undefined,
                            left: 0,
                            right: 0,
                            overflow: "hidden",
                            display: "flex",
                            flexWrap: "wrap",
                            gap: pills.gap,
                            backgroundColor: colors.panel,
                            borderRadius: radius,
                            padding: pills.padding,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        }}
                    >
                        {filteredItems.map((item, index) => (
                            <div
                                key={`menu-${index}`}
                                onClick={() => handleItemClick(item)}
                                style={{ ...pillStyle }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = colors.pill.hover
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = colors.pill.background
                                }}
                            >
                                {item.label}
                            </div>
                        ))}
                        
                        {filtered.map((suggestion, index) => (
                            <div key={index} style={{ display: "contents" }}>
                                {suggestion.questions.map((question, qIndex) => (
                                    <div
                                        key={`${index}-${qIndex}`}
                                        onClick={() => handleQuestionClick(question)}
                                        style={{ ...pillStyle, color: colors.text.suggestion, ...fonts.suggestion }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = colors.pill.hover
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = colors.pill.background
                                        }}
                                    >
                                        {question}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(NavAssistant, {
    items: {
        type: ControlType.Array,
        title: "Menu Items",
        description: "Menu dropdown pages",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Home",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
                leadingIcon: {
                    type: ControlType.Enum,
                    title: "Leading Icon",
                    options: ["none", "home", "star", "heart", "user", "settings", "search", "mail", "phone", "calendar", "folder", "file", "image", "video", "music", "cart", "tag", "bookmark", "bell", "clock", "map", "globe", "link", "lock", "unlock", "eye", "edit", "trash", "download", "upload", "share", "arrow-right", "arrow-left", "arrow-up", "arrow-down", "chevron-right", "chevron-left", "chevron-up", "chevron-down", "check", "x", "plus", "minus", "info", "alert", "help"],
                    optionTitles: ["None", "🏠 Home", "⭐ Star", "❤️ Heart", "👤 User", "⚙️ Settings", "🔍 Search", "✉️ Mail", "📞 Phone", "📅 Calendar", "📁 Folder", "📄 File", "🖼️ Image", "🎥 Video", "🎵 Music", "🛒 Cart", "🏷️ Tag", "🔖 Bookmark", "🔔 Bell", "🕐 Clock", "🗺️ Map", "🌐 Globe", "🔗 Link", "🔒 Lock", "🔓 Unlock", "👁️ Eye", "✏️ Edit", "🗑️ Trash", "⬇️ Download", "⬆️ Upload", "📤 Share", "→ Arrow Right", "← Arrow Left", "↑ Arrow Up", "↓ Arrow Down", "› Chevron Right", "‹ Chevron Left", "^ Chevron Up", "v Chevron Down", "✓ Check", "✕ X", "➕ Plus", "➖ Minus", "ℹ️ Info", "⚠️ Alert", "❓ Help"],
                    defaultValue: "none",
                },
                trailingIcon: {
                    type: ControlType.Enum,
                    title: "Trailing Icon",
                    options: ["none", "home", "star", "heart", "user", "settings", "search", "mail", "phone", "calendar", "folder", "file", "image", "video", "music", "cart", "tag", "bookmark", "bell", "clock", "map", "globe", "link", "lock", "unlock", "eye", "edit", "trash", "download", "upload", "share", "arrow-right", "arrow-left", "arrow-up", "arrow-down", "chevron-right", "chevron-left", "chevron-up", "chevron-down", "check", "x", "plus", "minus", "info", "alert", "help"],
                    optionTitles: ["None", "🏠 Home", "⭐ Star", "❤️ Heart", "👤 User", "⚙️ Settings", "🔍 Search", "✉️ Mail", "📞 Phone", "📅 Calendar", "📁 Folder", "📄 File", "🖼️ Image", "🎥 Video", "🎵 Music", "🛒 Cart", "🏷️ Tag", "🔖 Bookmark", "🔔 Bell", "🕐 Clock", "🗺️ Map", "🌐 Globe", "🔗 Link", "🔒 Lock", "🔓 Unlock", "👁️ Eye", "✏️ Edit", "🗑️ Trash", "⬇️ Download", "⬆️ Upload", "📤 Share", "→ Arrow Right", "← Arrow Left", "↑ Arrow Up", "↓ Arrow Down", "› Chevron Right", "‹ Chevron Left", "^ Chevron Up", "v Chevron Down", "✓ Check", "✕ X", "➕ Plus", "➖ Minus", "ℹ️ Info", "⚠️ Alert", "❓ Help"],
                    defaultValue: "none",
                },
            },
        },
        defaultValue: [
            { label: "Home", link: "/" },
            { label: "Career", link: "/career" },
            { label: "Pricing", link: "/pricing" },
            { label: "About Us", link: "/about" },
            { label: "Blog", link: "/blog" },
            { label: "Contact", link: "/contact" },
            { label: "Support", link: "/support" },
        ],
    },
    defaultIdx: {
        type: ControlType.Number,
        title: "Default Page",
        description: "Home page index",
        defaultValue: 0,
        min: 0,
        step: 1,
        displayStepper: true,
    },
    suggestions: {
        type: ControlType.Array,
        title: "Suggestions",
        description: "Keyword suggestions",
        control: {
            type: ControlType.Object,
            controls: {
                keywords: {
                    type: ControlType.Array,
                    title: "Keywords",
                    control: {
                        type: ControlType.String,
                    },
                    defaultValue: ["bags", "bag"],
                },
                questions: {
                    type: ControlType.Array,
                    title: "Questions",
                    control: {
                        type: ControlType.String,
                    },
                    defaultValue: ["What bags do you have?", "Show me bags"],
                },
                answer: {
                    type: ControlType.String,
                    title: "Answer",
                    defaultValue: "We have a wide variety of bags including totes, backpacks, and handbags.",
                    displayTextArea: true,
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
                linkTitle: {
                    type: ControlType.String,
                    title: "Link Title",
                    defaultValue: "View Collection",
                    placeholder: "e.g., View Collection, Learn More",
                },
                images: {
                    type: ControlType.Array,
                    title: "Images",
                    control: {
                        type: ControlType.ResponsiveImage,
                    },
                    maxCount: 5,
                },
            },
        },
        defaultValue: [
            { 
                keywords: ["bags", "bag", "tote", "backpack", "handbag"], 
                questions: ["What bags do you have?", "Show me bags", "Bag collection"],
                answer: "We have a wide variety of bags including totes, backpacks, and handbags. Visit our bags page to see the full collection.",
                link: "/bags",
                linkTitle: "View Bags Collection"
            },
            { 
                keywords: ["shoes", "shoe", "footwear", "sneakers", "boots"], 
                questions: ["What shoes are available?", "Show me shoes", "Footwear options"],
                answer: "Browse our extensive footwear collection including sneakers, boots, and formal shoes.",
                link: "/shoes",
                linkTitle: "View Shoes Collection"
            },
            { 
                keywords: ["contact", "reach", "email", "phone", "call"], 
                questions: ["How can I contact you?", "Contact information", "Get in touch"],
                answer: "You can reach us via email at hello@example.com or call us at (555) 123-4567.",
                link: "/contact",
                linkTitle: "Contact Us"
            },
        ],
    },
    enableAI: {
        type: ControlType.Boolean,
        title: "Enable AI",
        description: "AI-powered responses",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    allowImageAttachment: {
        type: ControlType.Boolean,
        title: "Allow Image Upload",
        description: "Enable image attachment for queries",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ enableAI }) => !enableAI,
    },
    websiteURL: {
        type: ControlType.String,
        title: "Website URL",
        description: "Your website URL for AI context",
        placeholder: "https://yourwebsite.com",
        defaultValue: "",
        hidden: ({ enableAI }) => !enableAI,
    },
    brandInfo: {
        type: ControlType.String,
        title: "Brand Info",
        description: "Brand context for AI",
        displayTextArea: true,
        defaultValue: "We are a modern e-commerce brand specializing in fashion accessories and lifestyle products.",
        hidden: ({ enableAI }) => !enableAI,
    },
    tone: {
        type: ControlType.Enum,
        title: "AI Response Tone",
        description: "Response personality",
        options: ["exciting", "friendly", "professional", "casual", "formal", "edgy", "witty", "empathetic", "concise", "detailed"],
        optionTitles: ["Exciting", "Friendly", "Professional", "Casual", "Formal", "Edgy", "Witty", "Empathetic", "Concise", "Detailed"],
        defaultValue: "friendly",
        hidden: ({ enableAI }) => !enableAI,
    },
    placeholders: {
        type: ControlType.Array,
        title: "Placeholder",
        description: "Rotating placeholder text",
        control: {
            type: ControlType.String,
        },
        defaultValue: [
            "What bags do you have?",
            "Show me your shoe collection",
            "How can I contact you?",
            "Tell me about your products",
            "What are your store hours?",
        ],
    },
    settings: {
        type: ControlType.Object,
        title: "Settings",
        description: "Button and layout settings",
        controls: {
            radius: {
                type: ControlType.Number,
                title: "Border Radius",
                defaultValue: 50,
                min: 0,
                max: 200,
                step: 1,
            },
            btnSize: {
                type: ControlType.Number,
                title: "Button Size",
                defaultValue: 40,
                min: 32,
                max: 100,
                step: 1,
                unit: "px",
            },
            menuIcon: {
                type: ControlType.Enum,
                title: "Menu Icon",
                options: ["plus", "pin", "hamburger", "grid", "dots"],
                optionTitles: ["Plus", "Pin", "Hamburger Menu", "Grid", "Dots"],
                defaultValue: "plus",
                displaySegmentedControl: false,
            },
            sendIcon: {
                type: ControlType.Enum,
                title: "Send Icon",
                options: ["arrowUp", "arrowRight", "paperPlane", "check", "chevronRight"],
                optionTitles: ["Arrow Up", "Arrow Right", "Paper Plane", "Check", "Chevron Right"],
                defaultValue: "arrowUp",
                displaySegmentedControl: false,
            },
            menuLayout: {
                type: ControlType.Enum,
                title: "Menu Layout",
                options: ["horizontal", "stacked"],
                optionTitles: ["Horizontal", "Stacked"],
                defaultValue: "horizontal",
                displaySegmentedControl: true,
            },
                panelDirection: {
                    type: ControlType.Enum,
                    title: "Panel Direction",
                    options: ["up", "down"],
                    optionTitles: ["Up", "Down"],
                    defaultValue: "up",
                    displaySegmentedControl: true,
                },
        },
        defaultValue: {
            radius: 50,
            btnSize: 40,
            menuIcon: "plus",
            sendIcon: "arrowUp",
            menuLayout: "horizontal",
                panelDirection: "up",
        },
    },
    fonts: {
        type: ControlType.Object,
        title: "Fonts",
        description: "Typography settings",
        controls: {
            input: {
                type: ControlType.Font,
                title: "Input",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Regular",
                    letterSpacing: "0em",
                    lineHeight: "1.4em",
                },
                controls: "extended",
                defaultFontType: "sans-serif",
            },
            placeholder: {
                type: ControlType.Font,
                title: "Placeholder",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Regular",
                    letterSpacing: "0em",
                    lineHeight: "1.4em",
                },
                controls: "extended",
                defaultFontType: "sans-serif",
            },
            pill: {
                type: ControlType.Font,
                title: "Pill",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Regular",
                    letterSpacing: "0em",
                    lineHeight: "1.4em",
                },
                controls: "extended",
                defaultFontType: "sans-serif",
            },
            suggestion: {
                type: ControlType.Font,
                title: "Suggestion",
                defaultValue: {
                    fontSize: "16px",
                    variant: "Regular",
                    letterSpacing: "0em",
                    lineHeight: "1.4em",
                },
                controls: "extended",
                defaultFontType: "sans-serif",
            },
            response: {
                type: ControlType.Font,
                title: "Response",
                defaultValue: {
                    fontSize: "16px",
                    variant: "Regular",
                    letterSpacing: "0em",
                    lineHeight: "1.5em",
                },
                controls: "extended",
                defaultFontType: "sans-serif",
            },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        description: "Color settings",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#131826",
            },
            text: {
                type: ControlType.Object,
                title: "Text",
                controls: {
                    input: {
                        type: ControlType.Color,
                        title: "Input",
                        defaultValue: "#E8EAF0",
                    },
                    placeholder: {
                        type: ControlType.Color,
                        title: "Placeholder",
                        defaultValue: "#E8EAF0",
                    },
                    pill: {
                        type: ControlType.Color,
                        title: "Pill",
                        defaultValue: "#E8EAF0",
                    },
                    suggestion: {
                        type: ControlType.Color,
                        title: "Suggestion",
                        defaultValue: "#E8EAF0",
                    },
                    response: {
                        type: ControlType.Color,
                        title: "Response",
                        defaultValue: "#E8EAF0",
                    },
                },
                defaultValue: {
                    input: "#E8EAF0",
                    placeholder: "#E8EAF0",
                    pill: "#E8EAF0",
                    suggestion: "#E8EAF0",
                    response: "#E8EAF0",
                },
            },
            pill: {
                type: ControlType.Object,
                title: "Pill",
                controls: {
                    background: {
                        type: ControlType.Color,
                        title: "Background",
                        defaultValue: "#1C2333",
                    },
                    hover: {
                        type: ControlType.Color,
                        title: "Hover",
                        defaultValue: "#252D40",
                    },
                    text: {
                        type: ControlType.Color,
                        title: "Text",
                        defaultValue: "#E8EAF0",
                    },
                },
                defaultValue: {
                    background: "#1C2333",
                    hover: "#252D40",
                    text: "#E8EAF0",
                },
            },
            panel: {
                type: ControlType.Color,
                title: "Panel",
                defaultValue: "#131826",
            },
            menu: {
                type: ControlType.Object,
                title: "Menu",
                controls: {
                    background: {
                        type: ControlType.Color,
                        title: "Background",
                        defaultValue: "#1C2333",
                    },
                    border: {
                        type: ControlType.Color,
                        title: "Border",
                        defaultValue: "#2E3749",
                    },
                    hover: {
                        type: ControlType.Color,
                        title: "Hover",
                        defaultValue: "#252D40",
                    },
                    icon: {
                        type: ControlType.Color,
                        title: "Icon",
                        defaultValue: "#E8EAF0",
                    },
                },
                defaultValue: {
                    background: "#1C2333",
                    border: "#2E3749",
                    hover: "#252D40",
                    icon: "#E8EAF0",
                },
            },
            send: {
                type: ControlType.Object,
                title: "Send",
                controls: {
                    background: {
                        type: ControlType.Color,
                        title: "Background",
                        defaultValue: "#1C2333",
                    },
                    border: {
                        type: ControlType.Color,
                        title: "Border",
                        defaultValue: "#2E3749",
                    },
                    hover: {
                        type: ControlType.Color,
                        title: "Hover",
                        defaultValue: "#252D40",
                    },
                    icon: {
                        type: ControlType.Color,
                        title: "Icon",
                        defaultValue: "#E8EAF0",
                    },
                },
                defaultValue: {
                    background: "#1C2333",
                    border: "#2E3749",
                    hover: "#252D40",
                    icon: "#E8EAF0",
                },
            },
            container: {
                type: ControlType.Object,
                title: "Container",
                controls: {
                    border: {
                        type: ControlType.Color,
                        title: "Border",
                        defaultValue: "#2E3749",
                    },
                    borderWidth: {
                        type: ControlType.Number,
                        title: "Border Width",
                        defaultValue: 1,
                        min: 0,
                        max: 10,
                        step: 1,
                        unit: "px",
                    },
                },
                defaultValue: {
                    border: "#2E3749",
                    borderWidth: 1,
                },
            },
        },
    },
    pills: {
        type: ControlType.Object,
        title: "Pills",
        description: "Pill layout settings",
        controls: {
            padding: {
                type: ControlType.Padding,
                title: "Container Padding",
                defaultValue: "16px",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 12,
                min: 0,
                max: 32,
                step: 1,
            },
            pillPadding: {
                type: ControlType.Padding,
                title: "Pill Padding",
                defaultValue: "12px 24px",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Border Radius",
                defaultValue: 50,
                min: 0,
                max: 100,
                step: 1,
                unit: "px",
            },
            iconSize: {
                type: ControlType.Number,
                title: "Icon Size",
                defaultValue: 16,
                min: 8,
                max: 32,
                step: 1,
                unit: "px",
            },
            pillGap: {
                type: ControlType.Number,
                title: "Pill Gap",
                defaultValue: 8,
                min: 0,
                max: 32,
                step: 1,
                unit: "px",
            },
            iconStrokeWidth: {
                type: ControlType.Number,
                title: "Icon Stroke Width",
                defaultValue: 1,
                min: 0.5,
                max: 3,
                step: 0.1,
            },
            uploadImage: {
                type: ControlType.Object,
                title: "Upload Image",
                controls: {
                    text: {
                        type: ControlType.String,
                        title: "Text",
                        defaultValue: "Upload Image",
                    },
                    icon: {
                        type: ControlType.Enum,
                        title: "Icon",
                        options: ["none", "home", "star", "heart", "user", "settings", "search", "mail", "phone", "calendar", "folder", "file", "image", "video", "music", "cart", "tag", "bookmark", "bell", "clock", "map", "globe", "link", "lock", "unlock", "eye", "edit", "trash", "download", "upload", "share", "arrow-right", "arrow-left", "arrow-up", "arrow-down", "chevron-right", "chevron-left", "chevron-up", "chevron-down", "check", "x", "plus", "minus", "info", "alert", "help"],
                        optionTitles: ["None", "🏠 Home", "⭐ Star", "❤️ Heart", "👤 User", "⚙️ Settings", "🔍 Search", "✉️ Mail", "📞 Phone", "📅 Calendar", "📁 Folder", "📄 File", "🖼️ Image", "🎥 Video", "🎵 Music", "🛒 Cart", "🏷️ Tag", "🔖 Bookmark", "🔔 Bell", "🕐 Clock", "🗺️ Map", "🌐 Globe", "🔗 Link", "🔒 Lock", "🔓 Unlock", "👁️ Eye", "✏️ Edit", "🗑️ Trash", "⬇️ Download", "⬆️ Upload", "📤 Share", "→ Arrow Right", "← Arrow Left", "↑ Arrow Up", "↓ Arrow Down", "› Chevron Right", "‹ Chevron Left", "^ Chevron Up", "v Chevron Down", "✓ Check", "✕ X", "➕ Plus", "➖ Minus", "ℹ️ Info", "⚠️ Alert", "❓ Help"],
                        defaultValue: "image",
                    },
                },
                defaultValue: {
                    text: "Upload Image",
                    icon: "image",
                },
            },
        },
    },
    collapsibleSettings: {
        type: ControlType.Object,
        title: "Collapsible",
        description: "Collapsible mode settings",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            icon: {
                type: ControlType.Enum,
                title: "Icon",
                options: ["search", "chat", "plus", "menu"],
                optionTitles: ["Search", "Chat", "Plus", "Menu"],
                defaultValue: "search",
            },
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "Ask anything...",
                placeholder: "e.g., Ask anything...",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 40,
                min: 32,
                max: 100,
                step: 1,
                unit: "px",
            },
        },
        defaultValue: {
            enabled: false,
            icon: "search",
            label: "Ask anything...",
            size: 40,
        },
    },
})