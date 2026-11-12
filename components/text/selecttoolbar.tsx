/**
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 280
 * @framerIntrinsicHeight 90
 */

import * as React from "react"
import { createPortal } from "react-dom"
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


// ============================================================================
// LIGHTWEIGHT VECTOR ICONS (Zero Bloat, High Precision 16x16 / 18x18)
// ============================================================================
const Icon = {
    copy: (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
    ),
    check: (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    highlight: (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m9 11-6 6v3h9l3-3" />
            <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
        </svg>
    ),
    speak: (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
    ),
    stop: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
    ),
    search: (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    ai: (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
        </svg>
    ),
    translate: (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m5 8 6 6" />
            <path d="m4 14 6-6 2-3" />
            <path d="M2 5h12" />
            <path d="M7 2h1" />
            <path d="m22 22-5-10-5 10" />
            <path d="M14 18h6" />
        </svg>
    ),
    share: (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
    ),
    quote: (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 21c3 0 7-1 7-8V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v6c0 4.5 2 7 5 8" />
            <path d="M15 21c3 0 7-1 7-8V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v6c0 4.5 2 7 5 8" />
        </svg>
    ),
    x: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    ),
    whatsapp: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.16 8.16 0 0 1-1.25-4.38c0-4.52 3.68-8.2 8.2-8.2 2.19 0 4.25.85 5.8 2.4 1.55 1.55 2.4 3.61 2.4 5.8 0 4.52-3.68 8.2-8.2 8.2z" />
        </svg>
    ),
    telegram: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
    ),
    link: (
        <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    ),
}

// Token unwrapper for Framer Variables
const parseToken = (v: any) =>
    v && typeof v === "object" && "value" in v ? v.value : v

type Position = {
    top: number
    left: number
    isFlipped: boolean
}

type Props = {
    behavior: {
        scope: "global" | "parent"
        mobileMode: "custom" | "both" | "default"
        closeOnScroll: boolean
    }
    appearance: {
        background: any
        textColor: any
        hoverBackground: any
        accentColor: any
        highlightTint: any
        backdropBlur: number
        borderRadius: number
        boxShadow: any
    }
    actionsList: string[]
    style?: React.CSSProperties
}

function checkIsTouchDevice(): boolean {
    if (typeof window === "undefined") return false
    return (
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth < 768
    )
}

export default function TextSelectionActionsV2(props: Props) {
    const { behavior, appearance, actionsList, style } = props

    // Framer static renderer check to ensure static exports and canvas avoid animation loops
    const isStaticRenderer = useIsStaticRenderer()
    const isCanvas =
        isStaticRenderer || RenderTarget.current() === RenderTarget.canvas

    const [isClient, setIsClient] = React.useState(false)
    const [selection, setSelection] = React.useState<{
        text: string
        range: Range
    } | null>(null)
    const [position, setPosition] = React.useState<Position | null>(null)
    const [isCopied, setIsCopied] = React.useState(false)
    const [isQuoteCopied, setIsQuoteCopied] = React.useState(false)
    const [activeSubmenu, setActiveSubmenu] = React.useState<string | null>(
        null
    )
    const [linkCopied, setLinkCopied] = React.useState(false)
    const [isSpeaking, setIsSpeaking] = React.useState(false)
    const [isTouch, setIsTouch] = React.useState(false)

    const rootRef = React.useRef<HTMLDivElement>(null)
    const toolbarRef = React.useRef<HTMLDivElement>(null)
    const submenuRef = React.useRef<HTMLDivElement>(null)
    const isInteractingRef = React.useRef(false)

    // ========================================================================
    // PARENT CONTAINER RESOLUTION
    // ========================================================================
    const getParentContainer = React.useCallback((): HTMLElement | null => {
        if (!rootRef.current) return null
        let cur: HTMLElement | null = rootRef.current.parentElement

        while (
            cur &&
            cur !== document.body &&
            cur !== document.documentElement
        ) {
            const children = Array.from(cur.children)
            const hasOtherContent = children.some(
                (child) =>
                    child !== rootRef.current &&
                    !child.contains(rootRef.current)
            )
            if (hasOtherContent) {
                return cur
            }
            cur = cur.parentElement
        }
        return rootRef.current.parentElement || document.body
    }, [])

    // Hydration check
    React.useEffect(() => {
        if (isCanvas) return
        setIsClient(true)
        setIsTouch(checkIsTouchDevice())
        const handleResize = () => setIsTouch(checkIsTouchDevice())
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [isCanvas])

    // Highlight tint CSS injection
    React.useEffect(() => {
        if (isCanvas || !isClient) return
        const styleId = "framer-v2-text-highlights"
        let el = document.getElementById(styleId) as HTMLStyleElement
        if (!el) {
            el = document.createElement("style")
            el.id = styleId
            document.head.appendChild(el)
        }
        el.innerHTML = `::highlight(framer-highlight-v2) { background-color: ${parseToken(
            appearance.highlightTint
        )}; color: inherit; }`
    }, [appearance.highlightTint, isCanvas, isClient])

    // Mobile custom selection styling for parent or global scope
    React.useEffect(() => {
        if (
            isCanvas ||
            !isTouch ||
            behavior.mobileMode !== "custom" ||
            !isClient
        )
            return

        const container =
            behavior.scope === "parent" ? getParentContainer() : null
        if (container) {
            container.setAttribute("data-framer-sel-scope", "true")
        }

        const styleId = "framer-v2-mobile-callout-disable"
        let el = document.getElementById(styleId) as HTMLStyleElement
        if (!el) {
            el = document.createElement("style")
            el.id = styleId
            document.head.appendChild(el)
        }

        const selector =
            behavior.scope === "parent" && container
                ? `[data-framer-sel-scope="true"], [data-framer-sel-scope="true"] *`
                : `*`

        el.innerHTML = `${selector} { -webkit-touch-callout: none !important; }`

        return () => {
            if (container) container.removeAttribute("data-framer-sel-scope")
            if (el) el.innerHTML = ""
        }
    }, [
        isCanvas,
        isTouch,
        behavior.mobileMode,
        behavior.scope,
        isClient,
        getParentContainer,
    ])

    // Speech audio cleanup
    React.useEffect(() => {
        return () => {
            if (typeof window !== "undefined" && window.speechSynthesis) {
                window.speechSynthesis.cancel()
            }
        }
    }, [])

    // Outside click dismiss
    React.useEffect(() => {
        if (isCanvas || !activeSubmenu) return
        const onPointerDown = (e: MouseEvent | TouchEvent) => {
            const target = e.target as Node
            if (
                toolbarRef.current &&
                !toolbarRef.current.contains(target) &&
                submenuRef.current &&
                !submenuRef.current.contains(target)
            ) {
                React.startTransition(() => {
                    setActiveSubmenu(null)
                })
            }
        }
        document.addEventListener("mousedown", onPointerDown)
        document.addEventListener("touchstart", onPointerDown)
        return () => {
            document.removeEventListener("mousedown", onPointerDown)
            document.removeEventListener("touchstart", onPointerDown)
        }
    }, [activeSubmenu, isCanvas])

    // Bounds and placement calculation
    const calculatePosition = React.useCallback(() => {
        if (isCanvas) return

        if (isTouch && behavior.mobileMode === "default") {
            React.startTransition(() => {
                setSelection(null)
                setPosition(null)
                setActiveSubmenu(null)
            })
            return
        }

        const sel = window.getSelection()
        if (!sel || sel.isCollapsed) {
            React.startTransition(() => {
                setSelection(null)
                setPosition(null)
                setActiveSubmenu(null)
            })
            return
        }

        const text = sel.toString()
        if (!text || !text.trim()) {
            React.startTransition(() => {
                setSelection(null)
                setPosition(null)
                setActiveSubmenu(null)
            })
            return
        }

        const range = sel.getRangeAt(0)

        // Strict Parent Scope Check
        if (behavior.scope === "parent") {
            const container = getParentContainer()
            if (!container) {
                React.startTransition(() => {
                    setSelection(null)
                    setPosition(null)
                })
                return
            }

            const commonNode = range.commonAncestorContainer
            const startNode = range.startContainer
            const endNode = range.endContainer

            const isContained =
                container === commonNode ||
                container.contains(commonNode) ||
                (container.contains(startNode) && container.contains(endNode))

            if (!isContained) {
                React.startTransition(() => {
                    setSelection(null)
                    setPosition(null)
                })
                return
            }
        }

        const TOOLBAR_WIDTH = Math.min(320, window.innerWidth - 32)
        const TOOLBAR_HEIGHT = 44
        const GAP = 10

        const rect = range.getBoundingClientRect()
        if (rect.width === 0 && rect.height === 0) return

        let top = rect.top - TOOLBAR_HEIGHT - GAP
        let isFlipped = false

        if (top < 12) {
            top = rect.bottom + GAP
            isFlipped = true
        }

        let left = rect.left + rect.width / 2
        const halfToolbar = TOOLBAR_WIDTH / 2
        left = Math.max(
            halfToolbar + 12,
            Math.min(window.innerWidth - halfToolbar - 12, left)
        )

        React.startTransition(() => {
            setSelection({ text, range })
            setPosition({ top, left, isFlipped })
        })
    }, [
        isCanvas,
        isTouch,
        behavior.mobileMode,
        behavior.scope,
        getParentContainer,
    ])

    // Scroll listener
    React.useEffect(() => {
        if (isCanvas) return
        const handleScroll = () => {
            if (behavior.closeOnScroll) {
                React.startTransition(() => {
                    setSelection(null)
                    setPosition(null)
                    setActiveSubmenu(null)
                })
            } else {
                calculatePosition()
            }
        }
        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [behavior.closeOnScroll, calculatePosition, isCanvas])

    // Selection listener
    React.useEffect(() => {
        if (isCanvas) return

        let rAF = 0
        const triggerCalculation = () => {
            if (isInteractingRef.current) return
            cancelAnimationFrame(rAF)
            rAF = requestAnimationFrame(calculatePosition)
        }

        const onStart = () => {
            isInteractingRef.current = true
        }

        const onEnd = () => {
            isInteractingRef.current = false
            triggerCalculation()
        }

        document.addEventListener("selectionchange", triggerCalculation)
        document.addEventListener("mousedown", onStart)
        document.addEventListener("mouseup", onEnd)
        document.addEventListener("touchstart", onStart, { passive: true })
        document.addEventListener("touchend", onEnd, { passive: true })
        window.addEventListener("resize", triggerCalculation)

        return () => {
            cancelAnimationFrame(rAF)
            document.removeEventListener("selectionchange", triggerCalculation)
            document.removeEventListener("mousedown", onStart)
            document.removeEventListener("mouseup", onEnd)
            document.removeEventListener("touchstart", onStart)
            document.removeEventListener("touchend", onEnd)
            window.removeEventListener("resize", triggerCalculation)
        }
    }, [calculatePosition, isCanvas])

    const preventDeselection = (e: React.SyntheticEvent) => {
        e.preventDefault()
    }

    // ========================================================================
    // ACTION HANDLERS
    // ========================================================================
    const handleCopy = () => {
        if (!selection) return
        navigator.clipboard.writeText(selection.text)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 1800)
    }

    const handleCopyQuote = () => {
        if (!selection) return
        const markdown = `> ${selection.text.trim().replace(/\n/g, "\n> ")}\n`
        navigator.clipboard.writeText(markdown)
        setIsQuoteCopied(true)
        setTimeout(() => setIsQuoteCopied(false), 1800)
    }

    const handleSearch = () => {
        if (!selection) return
        window.open(
            `https://www.google.com/search?q=${encodeURIComponent(
                selection.text
            )}`,
            "_blank",
            "noopener,noreferrer"
        )
    }

    const handleReadAloud = () => {
        if (
            !selection ||
            typeof window === "undefined" ||
            !window.speechSynthesis
        )
            return

        if (isSpeaking) {
            window.speechSynthesis.cancel()
            setIsSpeaking(false)
            return
        }

        const utter = new SpeechSynthesisUtterance(selection.text)
        utter.rate = 1.02
        utter.pitch = 1
        utter.onend = () => setIsSpeaking(false)
        utter.onerror = () => setIsSpeaking(false)

        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(utter)
        setIsSpeaking(true)
    }

    const handleHighlight = () => {
        if (!selection) return
        // @ts-ignore
        if (typeof CSS === "undefined" || !CSS.highlights) {
            alert("Custom Highlight API is not supported in this browser.")
            return
        }
        try {
            // @ts-ignore
            let highlight = CSS.highlights.get("framer-highlight-v2")
            if (!highlight) {
                // @ts-ignore
                highlight = new Highlight(selection.range)
                // @ts-ignore
                CSS.highlights.set("framer-highlight-v2", highlight)
            } else {
                highlight.add(selection.range)
            }
            window.getSelection()?.removeAllRanges()
        } catch (err) {
            console.error("Highlight error:", err)
        }
    }

    // ========================================================================
    // SUBMENU DATA
    // ========================================================================
    const aiMenuItems = React.useMemo(
        () => [
            {
                name: "ChatGPT",
                badge: "OpenAI",
                color: "#10A37F",
                run: (txt: string) =>
                    window.open(
                        `https://chatgpt.com/?q=${encodeURIComponent(txt)}`,
                        "_blank",
                        "noopener,noreferrer"
                    ),
            },
            {
                name: "Claude",
                badge: "Anthropic",
                color: "#D97757",
                run: (txt: string) =>
                    window.open(
                        `https://claude.ai/new?q=${encodeURIComponent(txt)}`,
                        "_blank",
                        "noopener,noreferrer"
                    ),
            },
            {
                name: "Perplexity",
                badge: "Search",
                color: "#20B8CD",
                run: (txt: string) =>
                    window.open(
                        `https://www.perplexity.ai/search?q=${encodeURIComponent(
                            txt
                        )}`,
                        "_blank",
                        "noopener,noreferrer"
                    ),
            },
            {
                name: "Grok",
                badge: "xAI",
                color: "#FFFFFF",
                run: (txt: string) =>
                    window.open(
                        `https://grok.com/?q=${encodeURIComponent(txt)}`,
                        "_blank",
                        "noopener,noreferrer"
                    ),
            },
            {
                name: "Mistral",
                badge: "Le Chat",
                color: "#FF7000",
                run: (txt: string) =>
                    window.open(
                        `https://chat.mistral.ai/chat?q=${encodeURIComponent(
                            txt
                        )}`,
                        "_blank",
                        "noopener,noreferrer"
                    ),
            },
        ],
        []
    )

    const translateMenuItems = React.useMemo(
        () => [
            {
                name: "Google Translate",
                badge: "Google",
                color: "#4285F4",
                run: (txt: string) =>
                    window.open(
                        `https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(
                            txt
                        )}&op=translate`,
                        "_blank",
                        "noopener,noreferrer"
                    ),
            },
            {
                name: "Bing Translator",
                badge: "Microsoft",
                color: "#008080",
                run: (txt: string) =>
                    window.open(
                        `https://www.bing.com/translator?text=${encodeURIComponent(
                            txt
                        )}`,
                        "_blank",
                        "noopener,noreferrer"
                    ),
            },
        ],
        []
    )

    const shareMenuItems = React.useMemo(() => {
        const list = [
            {
                id: "x",
                label: "Post to X",
                icon: Icon.x,
                color: "#FFFFFF",
                run: (txt: string) =>
                    window.open(
                        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                            txt
                        )}`,
                        "_blank",
                        "noopener,noreferrer"
                    ),
            },
            {
                id: "wa",
                label: "WhatsApp",
                icon: Icon.whatsapp,
                color: "#25D366",
                run: (txt: string) =>
                    window.open(
                        `https://wa.me/?text=${encodeURIComponent(txt)}`,
                        "_blank",
                        "noopener,noreferrer"
                    ),
            },
            {
                id: "tg",
                label: "Telegram",
                icon: Icon.telegram,
                color: "#2AABEE",
                run: (txt: string) =>
                    window.open(
                        `https://t.me/share/url?url=${encodeURIComponent(
                            window.location.href
                        )}&text=${encodeURIComponent(txt)}`,
                        "_blank",
                        "noopener,noreferrer"
                    ),
            },
            {
                id: "copyUrl",
                label: linkCopied ? "Link Copied!" : "Copy Page Link",
                icon: linkCopied ? Icon.check : Icon.link,
                color: linkCopied ? "#4ade80" : "#94A3B8",
                run: () => {
                    navigator.clipboard.writeText(window.location.href)
                    setLinkCopied(true)
                    setTimeout(() => setLinkCopied(false), 2000)
                },
            },
        ]
        if (typeof navigator !== "undefined" && navigator.share) {
            list.unshift({
                id: "systemShare",
                label: "Share via device...",
                icon: Icon.share,
                color: "#A855F7",
                run: async (txt: string) => {
                    try {
                        await navigator.share({
                            text: txt,
                            url: window.location.href,
                        })
                    } catch {}
                },
            })
        }
        return list
    }, [linkCopied])

    // ========================================================================
    // ACTION RENDERER
    // ========================================================================
    const renderActionButton = (action: string) => {
        const btnStyle: React.CSSProperties = {
            border: "none",
            outline: "none",
            background: "transparent",
            color: parseToken(appearance.textColor),
            cursor: "pointer",
            padding: "8px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: Math.max(4, appearance.borderRadius - 4),
            position: "relative",
            transition: "all 0.15s ease",
            WebkitTapHighlightColor: "transparent",
        }

        const sharedMotion = {
            onMouseDown: preventDeselection,
            whileHover: {
                backgroundColor: parseToken(appearance.hoverBackground),
            },
            whileTap: { scale: 0.94 },
        }

        switch (action) {
            case "copy":
                return (
                    <motion.button
                        key="copy"
                        onClick={handleCopy}
                        style={btnStyle}
                        title="Copy text"
                        {...sharedMotion}
                    >
                        {isCopied ? (
                            <span style={{ color: "#4ade80" }}>
                                {Icon.check}
                            </span>
                        ) : (
                            Icon.copy
                        )}
                    </motion.button>
                )
            case "quote":
                return (
                    <motion.button
                        key="quote"
                        onClick={handleCopyQuote}
                        style={btnStyle}
                        title="Copy as Markdown Quote"
                        {...sharedMotion}
                    >
                        {isQuoteCopied ? (
                            <span style={{ color: "#4ade80" }}>
                                {Icon.check}
                            </span>
                        ) : (
                            Icon.quote
                        )}
                    </motion.button>
                )
            case "highlight":
                return (
                    <motion.button
                        key="highlight"
                        onClick={handleHighlight}
                        style={btnStyle}
                        title="Highlight selection"
                        {...sharedMotion}
                    >
                        {Icon.highlight}
                    </motion.button>
                )
            case "readAloud":
                return (
                    <motion.button
                        key="readAloud"
                        onClick={handleReadAloud}
                        style={{
                            ...btnStyle,
                            backgroundColor: isSpeaking
                                ? parseToken(appearance.hoverBackground)
                                : "transparent",
                        }}
                        title={isSpeaking ? "Stop Speaking" : "Read Aloud"}
                        {...sharedMotion}
                    >
                        {isSpeaking ? (
                            <motion.span
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 0.8 }}
                                style={{ display: "flex", color: "#f87171" }}
                            >
                                {Icon.stop}
                            </motion.span>
                        ) : (
                            Icon.speak
                        )}
                    </motion.button>
                )
            case "search":
                return (
                    <motion.button
                        key="search"
                        onClick={handleSearch}
                        style={btnStyle}
                        title="Search with Google"
                        {...sharedMotion}
                    >
                        {Icon.search}
                    </motion.button>
                )
            case "aiSearch":
                return (
                    <motion.button
                        key="aiSearch"
                        onClick={() =>
                            React.startTransition(() => {
                                setActiveSubmenu((prev) =>
                                    prev === "ai" ? null : "ai"
                                )
                            })
                        }
                        style={{
                            ...btnStyle,
                            backgroundColor:
                                activeSubmenu === "ai"
                                    ? parseToken(appearance.hoverBackground)
                                    : "transparent",
                        }}
                        title="Ask AI"
                        {...sharedMotion}
                    >
                        {Icon.ai}
                    </motion.button>
                )
            case "translate":
                return (
                    <motion.button
                        key="translate"
                        onClick={() =>
                            React.startTransition(() => {
                                setActiveSubmenu((prev) =>
                                    prev === "translate" ? null : "translate"
                                )
                            })
                        }
                        style={{
                            ...btnStyle,
                            backgroundColor:
                                activeSubmenu === "translate"
                                    ? parseToken(appearance.hoverBackground)
                                    : "transparent",
                        }}
                        title="Translate"
                        {...sharedMotion}
                    >
                        {Icon.translate}
                    </motion.button>
                )
            case "share":
                return (
                    <motion.button
                        key="share"
                        onClick={() =>
                            React.startTransition(() => {
                                setActiveSubmenu((prev) =>
                                    prev === "share" ? null : "share"
                                )
                            })
                        }
                        style={{
                            ...btnStyle,
                            backgroundColor:
                                activeSubmenu === "share"
                                    ? parseToken(appearance.hoverBackground)
                                    : "transparent",
                        }}
                        title="Share Selection"
                        {...sharedMotion}
                    >
                        {Icon.share}
                    </motion.button>
                )
            default:
                return null
        }
    }

    // ========================================================================
    // FRAMER CANVAS / STATIC RENDERER PREVIEW (Zero Animation Fallback)
    // ========================================================================
    if (isCanvas) {
        return (
            <div
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    minHeight: 85,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 20px",
                    background:
                        "linear-gradient(135deg, #18181b 0%, #09090b 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: 14,
                    boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
                    fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: "#FFFFFF",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        zIndex: 2,
                    }}
                >
                    <div
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background:
                                "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.35)",
                        }}
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#fff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
                        </svg>
                    </div>
                    <div>
                        <div
                            style={{
                                fontSize: 13,
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            <span>Text Selection Toolbar</span>
                            <span
                                style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background: "rgba(139, 92, 246, 0.25)",
                                    color: "#A78BFA",
                                    border: "1px solid rgba(139, 92, 246, 0.4)",
                                    letterSpacing: "0.04em",
                                }}
                            >
                                V2
                            </span>
                        </div>
                        <div
                            style={{
                                fontSize: 11,
                                color: "rgba(255, 255, 255, 0.55)",
                                marginTop: 2,
                            }}
                        >
                            {behavior.scope === "global"
                                ? "Triggers on any text selected across the page"
                                : "Triggers only on text selected inside this parent layer"}
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        zIndex: 2,
                    }}
                >
                    <span
                        style={{
                            fontSize: 11,
                            padding: "4px 9px",
                            borderRadius: 6,
                            background: "rgba(255, 255, 255, 0.08)",
                            color: "rgba(255,255,255,0.8)",
                        }}
                    >
                        {behavior.scope === "global"
                            ? "🌐 Global"
                            : "📦 Parent Layer"}
                    </span>
                    <span
                        style={{
                            fontSize: 11,
                            padding: "4px 9px",
                            borderRadius: 6,
                            background: "rgba(255, 255, 255, 0.08)",
                            color: "rgba(255,255,255,0.8)",
                        }}
                    >
                        {actionsList.length} Tools
                    </span>
                </div>
            </div>
        )
    }

    if (!isClient) return null

    // ========================================================================
    // SUBMENU CONTENT RENDERER
    // ========================================================================
    const renderSubmenuContent = () => {
        if (!activeSubmenu) return null

        let title = ""
        let items: React.ReactNode = null

        if (activeSubmenu === "ai") {
            title = "Ask AI Assistant"
            items = aiMenuItems.map((item) => (
                <button
                    key={item.name}
                    onMouseDown={preventDeselection}
                    onClick={() => {
                        if (selection) item.run(selection.text)
                        React.startTransition(() => setActiveSubmenu(null))
                    }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "7px 10px",
                        background: "transparent",
                        border: "none",
                        color: parseToken(appearance.textColor),
                        borderRadius: Math.max(appearance.borderRadius - 4, 4),
                        fontSize: 13,
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                        fontFamily: "inherit",
                        transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = parseToken(
                            appearance.hoverBackground
                        ))
                    }
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                    }
                >
                    <span
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                backgroundColor: item.color,
                            }}
                        />
                        {item.name}
                    </span>
                    <span
                        style={{
                            fontSize: 10,
                            opacity: 0.5,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                        }}
                    >
                        {item.badge}
                    </span>
                </button>
            ))
        } else if (activeSubmenu === "translate") {
            title = "Translate via"
            items = translateMenuItems.map((item) => (
                <button
                    key={item.name}
                    onMouseDown={preventDeselection}
                    onClick={() => {
                        if (selection) item.run(selection.text)
                        React.startTransition(() => setActiveSubmenu(null))
                    }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "7px 10px",
                        background: "transparent",
                        border: "none",
                        color: parseToken(appearance.textColor),
                        borderRadius: Math.max(appearance.borderRadius - 4, 4),
                        fontSize: 13,
                        cursor: "pointer",
                        width: "100%",
                        fontFamily: "inherit",
                        transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = parseToken(
                            appearance.hoverBackground
                        ))
                    }
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                    }
                >
                    <span
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                backgroundColor: item.color,
                            }}
                        />
                        {item.name}
                    </span>
                    <span
                        style={{
                            fontSize: 10,
                            opacity: 0.5,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                        }}
                    >
                        {item.badge}
                    </span>
                </button>
            ))
        } else if (activeSubmenu === "share") {
            title = "Share Selection"
            items = shareMenuItems.map((item) => (
                <button
                    key={item.id}
                    onMouseDown={preventDeselection}
                    onClick={() => {
                        if (selection) item.run(selection.text)
                        if (item.id !== "copyUrl") {
                            React.startTransition(() => setActiveSubmenu(null))
                        }
                    }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "7px 10px",
                        background: "transparent",
                        border: "none",
                        color: parseToken(appearance.textColor),
                        borderRadius: Math.max(appearance.borderRadius - 4, 4),
                        fontSize: 13,
                        cursor: "pointer",
                        width: "100%",
                        fontFamily: "inherit",
                        transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = parseToken(
                            appearance.hoverBackground
                        ))
                    }
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                    }
                >
                    <span
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 20,
                            height: 20,
                            color: item.color,
                        }}
                    >
                        {item.icon}
                    </span>
                    <span style={{ flex: 1, textAlign: "left" }}>
                        {item.label}
                    </span>
                </button>
            ))
        }

        const SUBMENU_WIDTH = 205
        const isFlipped = position?.isFlipped ?? false

        return (
            <motion.div
                ref={submenuRef}
                onMouseDown={preventDeselection}
                initial={{ opacity: 0, y: isFlipped ? -6 : 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{
                    position: "fixed",
                    top: isFlipped
                        ? (position?.top ?? 0) + 50
                        : (position?.top ?? 0) - 10,
                    transform: isFlipped ? "none" : "translateY(-100%)",
                    left: Math.max(
                        12,
                        Math.min(
                            window.innerWidth - SUBMENU_WIDTH - 12,
                            (position?.left ?? 0) - SUBMENU_WIDTH / 2
                        )
                    ),
                    width: SUBMENU_WIDTH,
                    maxHeight: 290,
                    overflowY: "auto",
                    backgroundColor: parseToken(appearance.background),
                    color: parseToken(appearance.textColor),
                    backdropFilter: `blur(${appearance.backdropBlur}px)`,
                    WebkitBackdropFilter: `blur(${appearance.backdropBlur}px)`,
                    borderRadius: appearance.borderRadius,
                    boxShadow: parseToken(appearance.boxShadow),
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    padding: "6px",
                    zIndex: 100000,
                    pointerEvents: "auto",
                }}
            >
                <div
                    style={{
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        padding: "4px 8px 6px",
                        opacity: 0.5,
                        fontFamily:
                            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    }}
                >
                    {title}
                </div>
                {items}
            </motion.div>
        )
    }

    return (
        <div
            ref={rootRef}
            style={{
                position: "absolute",
                width: 0,
                height: 0,
                margin: 0,
                padding: 0,
                border: "none",
                pointerEvents: "none",
                opacity: 0,
                overflow: "hidden",
                visibility: "hidden",
            }}
            aria-hidden="true"
        >
            {createPortal(
                <AnimatePresence>
                    {position && selection && (
                        <>
                            {/* Main Floating Bar */}
                            <motion.div
                                ref={toolbarRef}
                                onMouseDown={preventDeselection}
                                initial={{
                                    opacity: 0,
                                    scale: 0.92,
                                    y: position.isFlipped ? -8 : 8,
                                    x: "-50%",
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    y: 0,
                                    x: "-50%",
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 0.92,
                                    y: position.isFlipped ? -6 : 6,
                                    x: "-50%",
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 450,
                                    damping: 30,
                                }}
                                style={{
                                    position: "fixed",
                                    top: position.top,
                                    left: position.left,
                                    backgroundColor: parseToken(
                                        appearance.background
                                    ),
                                    backdropFilter: `blur(${appearance.backdropBlur}px)`,
                                    WebkitBackdropFilter: `blur(${appearance.backdropBlur}px)`,
                                    borderRadius: appearance.borderRadius,
                                    boxShadow: parseToken(appearance.boxShadow),
                                    border: "1px solid rgba(255, 255, 255, 0.09)",
                                    padding: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "3px",
                                    zIndex: 99999,
                                    pointerEvents: "auto",
                                    willChange: "transform",
                                    transform: "translateZ(0)",
                                }}
                            >
                                {actionsList.map((a) => renderActionButton(a))}
                            </motion.div>

                            {/* Submenus (AI / Share / Translate) */}
                            {renderSubmenuContent()}
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    )
}

TextSelectionActionsV2.displayName = "Text Selection Actions V2"

// ============================================================================
// DEFAULT PROPS & FRAMER CONTROLS
// ============================================================================
TextSelectionActionsV2.defaultProps = {
    behavior: {
        scope: "global",
        mobileMode: "custom",
        closeOnScroll: true,
    },
    appearance: {
        background: "rgba(24, 24, 27, 0.92)",
        textColor: "#FFFFFF",
        hoverBackground: "rgba(255, 255, 255, 0.12)",
        accentColor: "#8B5CF6",
        highlightTint: "rgba(250, 204, 21, 0.35)",
        backdropBlur: 16,
        borderRadius: 10,
        boxShadow:
            "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
    },
    actionsList: [
        "copy",
        "quote",
        "highlight",
        "readAloud",
        "translate",
        "search",
        "aiSearch",
        "share",
    ],
}

addPropertyControls(TextSelectionActionsV2, {
    // 1. BEHAVIOR SECTION
    behavior: {
        type: ControlType.Object,
        title: "Behavior",
        controls: {
            scope: {
                type: ControlType.Enum,
                title: "Scope",
                options: ["global", "parent"],
                optionTitles: [
                    "🌐 Global (Whole Page)",
                    "📦 Parent Layer Only",
                ],
                defaultValue: "global",
            },
            mobileMode: {
                type: ControlType.Enum,
                title: "Mobile UI",
                options: ["custom", "both", "default"],
                optionTitles: [
                    "✨ Custom Toolbar",
                    "📋 Custom + System",
                    "📱 System Default",
                ],
                defaultValue: "custom",
            },
            closeOnScroll: {
                type: ControlType.Boolean,
                title: "Scroll Dismiss",
                defaultValue: true,
            },
        },
    },

    // 2. ACTIONS ORDER & VISIBILITY
    actionsList: {
        type: ControlType.Array,
        title: "Actions",
        control: {
            type: ControlType.Enum,
            options: [
                "copy",
                "quote",
                "highlight",
                "readAloud",
                "translate",
                "search",
                "aiSearch",
                "share",
            ],
            optionTitles: [
                "Copy Text",
                "Copy as Quote",
                "Highlight",
                "Read Aloud (TTS)",
                "Translate",
                "Google Search",
                "Ask AI (ChatGPT/Claude/Grok)",
                "Share (X/WhatsApp/Link)",
            ],
        },
        defaultValue: [
            "copy",
            "quote",
            "highlight",
            "readAloud",
            "translate",
            "search",
            "aiSearch",
            "share",
        ],
    },

    // 3. APPEARANCE SECTION
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(24, 24, 27, 0.92)",
            },
            textColor: {
                type: ControlType.Color,
                title: "Text / Icons",
                defaultValue: "#FFFFFF",
            },
            hoverBackground: {
                type: ControlType.Color,
                title: "Hover Tint",
                defaultValue: "rgba(255, 255, 255, 0.12)",
            },
            highlightTint: {
                type: ControlType.Color,
                title: "Highlight Tint",
                defaultValue: "rgba(250, 204, 21, 0.35)",
            },
            backdropBlur: {
                type: ControlType.Number,
                title: "Blur",
                defaultValue: 16,
                min: 0,
                max: 30,
                unit: "px",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 10,
                min: 0,
                max: 32,
            },
            boxShadow: {
                type: ControlType.BoxShadow,
                title: "Shadow",
                defaultValue:
                    "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
            },
        },
    },
})
