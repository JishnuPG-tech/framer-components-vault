// User instructions: Create a Smart Search component in Framer Workshop with advanced search input, real-time suggestions, recent searches, keyboard navigation, category filters, highlighted matching text, "did you mean" corrections, dropdown animation, and optional voice search.

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { AnimatePresence, motion, useInView } from "framer-motion"
import * as React from "react"
import {
    startTransition,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from "react"

type SuggestionType = "recent" | "trending" | "ai" | "category" | "exact"

type Suggestion = {
    id: string
    text: string
    type: SuggestionType
    category?: string
    timestamp?: number
    badge?: string
    url?: string
}

type CategoryMode = "all" | "chips"

type RecentTimestampMode = "relative" | "off"

interface SmartSearchProps {
    placeholder: string
    hotkey: string
    debounce: number
    maxSuggestions: number
    showRecent: boolean
    aiSuggestions: boolean
    voiceSearch: boolean

    categories: string[]
    categoryMode: CategoryMode
    defaultCategory: string

    trending: string[]
    items: string[]

    storageKey: string
    useLocalStorage: boolean

    recentTimestamp: RecentTimestampMode

    backgroundColor: string
    borderColor: string
    textColor: string
    placeholderColor: string
    accentColor: string
    dropdownBackground: string
    itemHoverBackground: string
    itemActiveBackground: string
    dividerColor: string

    inputFont: any
    itemFont: any

    onSearch?: (query: string) => void
    onSuggestionSelect?: (suggestion: Suggestion) => void

    style?: CSSProperties
}

const defaultTrending = [
    "Product roadmap",
    "Pricing",
    "Integrations",
    "API docs",
    "Design system",
    "Changelog",
]

const defaultItems = [
    "Getting started",
    "Account settings",
    "Billing",
    "Security",
    "SSO setup",
    "Webhooks",
    "SDK reference",
    "Examples",
    "Release notes",
]

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function normalizeHotkey(hotkey: string) {
    const raw = (hotkey || "").trim()
    if (!raw) return null

    // Accept: "⌘K", "Cmd+K", "Ctrl+K", "Control+K", "Alt+K", "Shift+K"
    // Parse tokens
    const tokens = raw
        .replace(/\s+/g, "")
        .replaceAll("⌘", "Cmd+")
        .replaceAll("Command", "Cmd")
        .replaceAll("control", "Ctrl")
        .replaceAll("Control", "Ctrl")
        .split("+")
        .filter(Boolean)

    const keyToken = tokens[tokens.length - 1]
    if (!keyToken) return null

    const mods = new Set(tokens.slice(0, -1).map((t) => t.toLowerCase()))

    const key = keyToken.length === 1 ? keyToken.toLowerCase() : keyToken.toLowerCase()

    return {
        key,
        meta: mods.has("cmd") || mods.has("meta") || raw.includes("⌘"),
        ctrl: mods.has("ctrl"),
        alt: mods.has("alt"),
        shift: mods.has("shift"),
    }
}

function escapeRegExp(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function highlightText(text: string, query: string, accentColor: string) {
    const q = (query || "").trim()
    if (!q) return text

    const re = new RegExp(escapeRegExp(q), "ig")
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let m: RegExpExecArray | null

    while ((m = re.exec(text)) !== null) {
        const start = m.index
        const end = start + m[0].length
        if (start > lastIndex) parts.push(text.slice(lastIndex, start))
        parts.push(
            <span
                key={`${start}-${end}`}
                style={{
                    fontWeight: 700,
                    color: accentColor,
                }}
            >
                {text.slice(start, end)}
            </span>,
        )
        lastIndex = end
        if (m.index === re.lastIndex) re.lastIndex++
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex))
    return parts
}

function levenshtein(a: string, b: string) {
    const s = a.toLowerCase()
    const t = b.toLowerCase()
    const m = s.length
    const n = t.length
    if (m === 0) return n
    if (n === 0) return m

    const dp = new Array(n + 1)
    for (let j = 0; j <= n; j++) dp[j] = j

    for (let i = 1; i <= m; i++) {
        let prev = dp[0]
        dp[0] = i
        for (let j = 1; j <= n; j++) {
            const tmp = dp[j]
            const cost = s[i - 1] === t[j - 1] ? 0 : 1
            dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost)
            prev = tmp
        }
    }

    return dp[n]
}

function formatRelativeTime(timestamp: number) {
    const now = Date.now()
    const delta = now - timestamp
    const day = 24 * 60 * 60 * 1000
    const week = 7 * day

    if (delta < day) return "today"
    if (delta < 2 * day) return "yesterday"
    if (delta < week) return "this week"
    if (delta < 2 * week) return "last week"
    return "earlier"
}

function safeJSONParse<T>(value: string | null, fallback: T): T {
    if (!value) return fallback
    try {
        const parsed = JSON.parse(value)
        return parsed as T
    } catch {
        return fallback
    }
}

function uniqueByText(list: Suggestion[]) {
    const seen = new Set<string>()
    const out: Suggestion[] = []
    for (const s of list) {
        const key = s.text.toLowerCase().trim()
        if (!key) continue
        if (seen.has(key)) continue
        seen.add(key)
        out.push(s)
    }
    return out
}

/**
 * Smart Search
 *
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 56
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SmartSearch(props: SmartSearchProps) {
    const {
        placeholder,
        hotkey,
        debounce,
        maxSuggestions,
        showRecent,
        aiSuggestions,
        voiceSearch,
        categories,
        categoryMode,
        defaultCategory,
        trending,
        items,
        storageKey,
        useLocalStorage,
        recentTimestamp,
        backgroundColor,
        borderColor,
        textColor,
        placeholderColor,
        accentColor,
        dropdownBackground,
        itemHoverBackground,
        itemActiveBackground,
        dividerColor,
        inputFont,
        itemFont,
        onSearch,
        onSuggestionSelect,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const uid = useId()
    const rootRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const inView = useInView(rootRef, { amount: 0.1 })

    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [focusedIndex, setFocusedIndex] = useState(-1)
    const [selectedCategory, setSelectedCategory] = useState<string>(
        categories && categories.includes(defaultCategory) ? defaultCategory : "all",
    )

    const [recent, setRecent] = useState<{ text: string; timestamp: number }[]>([])
    const [isListening, setIsListening] = useState(false)

    const hotkeyParsed = useMemo(() => normalizeHotkey(hotkey), [hotkey])

    const trimmedQuery = query.trim()

    const loadRecent = useCallback(() => {
        if (!useLocalStorage) return
        if (typeof window === "undefined") return
        const key = storageKey || "smart_search_recent"
        const data = safeJSONParse<{ text: string; timestamp: number }[]>(
            window.localStorage.getItem(key),
            [],
        )
        startTransition(() => setRecent(Array.isArray(data) ? data.slice(0, 50) : []))
    }, [storageKey, useLocalStorage])

    const saveRecent = useCallback(
        (next: { text: string; timestamp: number }[]) => {
            if (!useLocalStorage) return
            if (typeof window === "undefined") return
            const key = storageKey || "smart_search_recent"
            try {
                window.localStorage.setItem(key, JSON.stringify(next))
            } catch {
                // ignore
            }
        },
        [storageKey, useLocalStorage],
    )

    useEffect(() => {
        if (isStatic) return
        loadRecent()
    }, [isStatic, loadRecent])

    const recentSuggestions = useMemo(() => {
        if (!showRecent) return [] as Suggestion[]
        return recent
            .slice(0, 8)
            .map((r, idx) => ({
                id: `recent-${idx}-${r.timestamp}`,
                text: r.text,
                type: "recent" as const,
                timestamp: r.timestamp,
            }))
    }, [recent, showRecent])

    const categorySuggestions = useMemo(() => {
        const list = (categories || []).filter((c) => c && c !== "all")
        if (!trimmedQuery) return [] as Suggestion[]
        const q = trimmedQuery.toLowerCase()
        const matched = list
            .filter((c) => c.toLowerCase().includes(q))
            .slice(0, Math.max(0, maxSuggestions))
            .map((c, idx) => ({
                id: `category-${idx}-${c}`,
                text: c,
                type: "category" as const,
                category: c,
            }))
        return matched
    }, [categories, trimmedQuery, maxSuggestions])

    const baseCorpus = useMemo(() => {
        const t = (trending && trending.length ? trending : defaultTrending).filter(Boolean)
        const i = (items && items.length ? items : defaultItems).filter(Boolean)
        return { trending: t, items: i }
    }, [trending, items])

    const [asyncSuggestions, setAsyncSuggestions] = useState<Suggestion[]>([])
    const [loading, setLoading] = useState(false)

    const computeLocalSuggestions = useCallback(
        (q: string) => {
            const queryLower = q.toLowerCase()
            const categoryFilter = selectedCategory && selectedCategory !== "all" ? selectedCategory : null

            const exact = baseCorpus.items
                .filter((t) => t.toLowerCase() === queryLower)
                .slice(0, maxSuggestions)
                .map((t) => ({ id: `exact-${t}`, text: t, type: "exact" as const }))

            const trendingMatches = baseCorpus.trending
                .filter((t) => t.toLowerCase().includes(queryLower))
                .map((t, idx) => ({ id: `trending-${idx}-${t}`, text: t, type: "trending" as const }))

            const itemMatches = baseCorpus.items
                .filter((t) => t.toLowerCase().includes(queryLower))
                .map((t, idx) => ({ id: `item-${idx}-${t}`, text: t, type: "exact" as const }))

            let combined = [...exact, ...itemMatches, ...trendingMatches]

            if (categoryFilter) {
                // Lightweight category filter: keep suggestions that include the category token
                const token = categoryFilter.toLowerCase()
                combined = combined.filter((s) => s.text.toLowerCase().includes(token))
            }

            return uniqueByText(combined).slice(0, maxSuggestions)
        },
        [baseCorpus.items, baseCorpus.trending, maxSuggestions, selectedCategory],
    )

    const computeAISuggestions = useCallback(
        (q: string) => {
            if (!aiSuggestions) return [] as Suggestion[]
            const corpus = uniqueByText(
                [...baseCorpus.items, ...baseCorpus.trending].map((t, idx) => ({
                    id: `corpus-${idx}-${t}`,
                    text: t,
                    type: "ai" as const,
                })),
            )

            const qTrim = q.trim()
            if (qTrim.length < 3) return []

            // "Did you mean" based on edit distance among closest items
            let best: { text: string; dist: number } | null = null
            for (const c of corpus) {
                const dist = levenshtein(qTrim, c.text)
                if (best === null || dist < best.dist) {
                    best = { text: c.text, dist }
                }
            }

            const didYouMean: Suggestion[] = []
            if (best && best.dist > 0 && best.dist <= Math.max(2, Math.round(qTrim.length / 4))) {
                didYouMean.push({
                    id: `ai-dym-${best.text}`,
                    text: best.text,
                    type: "ai",
                    badge: "Did you mean",
                })
            }

            // Semantic-ish suggestions: prefix matches and token overlaps
            const qLower = qTrim.toLowerCase()
            const related = corpus
                .filter((c) => {
                    const t = c.text.toLowerCase()
                    return t.startsWith(qLower) || (qLower.length > 3 && t.includes(qLower.slice(0, 3)))
                })
                .slice(0, 4)
                .map((c, idx) => ({
                    id: `ai-rel-${idx}-${c.text}`,
                    text: c.text,
                    type: "ai" as const,
                    badge: "AI",
                }))

            const merged = uniqueByText([...didYouMean, ...related])
            return merged.slice(0, 4)
        },
        [aiSuggestions, baseCorpus.items, baseCorpus.trending],
    )

    // Debounced suggestion computation
    useEffect(() => {
        if (isStatic) return
        if (!inView) return

        const q = trimmedQuery
        const timer = window.setTimeout(async () => {
            if (!q) {
                startTransition(() => {
                    setAsyncSuggestions([])
                    setLoading(false)
                    setFocusedIndex(-1)
                })
                return
            }

            startTransition(() => setLoading(true))

            const local = computeLocalSuggestions(q)
            const cats = categorySuggestions
            const ai = computeAISuggestions(q)

            const next = uniqueByText([...cats, ...local, ...ai]).slice(0, maxSuggestions)

            startTransition(() => {
                setAsyncSuggestions(next)
                setLoading(false)
                setFocusedIndex(next.length ? 0 : -1)
            })
        }, clamp(debounce, 0, 2000))

        return () => window.clearTimeout(timer)
    }, [
        trimmedQuery,
        debounce,
        computeLocalSuggestions,
        computeAISuggestions,
        categorySuggestions,
        maxSuggestions,
        isStatic,
        inView,
    ])

    const suggestions = useMemo(() => {
        const q = trimmedQuery

        // When empty query, show recent + trending
        if (!q) {
            const t = (baseCorpus.trending || []).slice(0, maxSuggestions).map((text, idx) => ({
                id: `trending-empty-${idx}-${text}`,
                text,
                type: "trending" as const,
            }))
            return uniqueByText([...recentSuggestions, ...t]).slice(0, maxSuggestions)
        }

        return asyncSuggestions.slice(0, maxSuggestions)
    }, [trimmedQuery, baseCorpus.trending, recentSuggestions, asyncSuggestions, maxSuggestions])

    const openDropdown = useCallback(() => {
        startTransition(() => setOpen(true))
    }, [])

    const closeDropdown = useCallback(() => {
        startTransition(() => {
            setOpen(false)
            setFocusedIndex(-1)
        })
    }, [])

    const scrollFocusedIntoView = useCallback(
        (index: number) => {
            if (!listRef.current) return
            const item = listRef.current.querySelector(`[data-ss-item-index="${index}"]`) as HTMLElement | null
            if (!item) return
            try {
                item.scrollIntoView({ block: "nearest" })
            } catch {
                // ignore
            }
        },
        [listRef],
    )

    useEffect(() => {
        if (focusedIndex < 0) return
        scrollFocusedIntoView(focusedIndex)
    }, [focusedIndex, scrollFocusedIntoView])

    const commitRecent = useCallback(
        (text: string) => {
            const t = text.trim()
            if (!t) return

            const next = [{ text: t, timestamp: Date.now() }, ...recent.filter((r) => r.text.toLowerCase() !== t.toLowerCase())]
                .slice(0, 8)
                .filter(Boolean)

            startTransition(() => setRecent(next))
            saveRecent(next)
        },
        [recent, saveRecent],
    )

    const handleSubmit = useCallback(
        (value?: string) => {
            const q = (value ?? query).trim()
            if (!q) return

            commitRecent(q)
            if (typeof onSearch === "function") {
                try {
                    onSearch(q)
                } catch {
                    // ignore
                }
            }
            closeDropdown()
        },
        [query, commitRecent, onSearch, closeDropdown],
    )

    const handleSuggestionPick = useCallback(
        (s: Suggestion) => {
            startTransition(() => setQuery(s.text))
            commitRecent(s.text)

            if (typeof onSuggestionSelect === "function") {
                try {
                    onSuggestionSelect(s)
                } catch {
                    // ignore
                }
            }
            // Treat selection as a search submission
            if (typeof onSearch === "function") {
                try {
                    onSearch(s.text)
                } catch {
                    // ignore
                }
            }

            closeDropdown()
            if (inputRef.current) {
                inputRef.current.blur()
            }
        },
        [commitRecent, onSuggestionSelect, onSearch, closeDropdown],
    )

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
                openDropdown()
            }

            if (!open) {
                if (e.key === "Enter") handleSubmit()
                return
            }

            if (e.key === "Escape") {
                e.preventDefault()
                closeDropdown()
                return
            }

            if (e.key === "ArrowDown") {
                e.preventDefault()
                startTransition(() => setFocusedIndex((idx) => clamp(idx + 1, 0, Math.max(0, suggestions.length - 1))))
                return
            }

            if (e.key === "ArrowUp") {
                e.preventDefault()
                startTransition(() => setFocusedIndex((idx) => clamp(idx - 1, 0, Math.max(0, suggestions.length - 1))))
                return
            }

            if (e.key === "Tab") {
                // Accept first suggestion
                if (suggestions.length > 0) {
                    e.preventDefault()
                    handleSuggestionPick(suggestions[0])
                }
                return
            }

            if (e.key === "Enter") {
                e.preventDefault()
                const idx = focusedIndex
                if (idx >= 0 && idx < suggestions.length) {
                    handleSuggestionPick(suggestions[idx])
                } else {
                    handleSubmit()
                }
                return
            }
        },
        [open, openDropdown, closeDropdown, focusedIndex, suggestions, handleSuggestionPick, handleSubmit, openDropdown],
    )

    // Global hotkey focus
    useEffect(() => {
        if (isStatic) return
        if (!hotkeyParsed) return
        if (typeof window === "undefined") return

        const onKey = (e: KeyboardEvent) => {
            const key = (e.key || "").toLowerCase()
            const matchesKey = key === hotkeyParsed.key
            const matchesMods =
                (!!hotkeyParsed.meta === !!e.metaKey) &&
                (!!hotkeyParsed.ctrl === !!e.ctrlKey) &&
                (!!hotkeyParsed.alt === !!e.altKey) &&
                (!!hotkeyParsed.shift === !!e.shiftKey)

            if (matchesKey && matchesMods) {
                e.preventDefault()
                if (inputRef.current) {
                    inputRef.current.focus()
                    openDropdown()
                }
            }
        }

        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [hotkeyParsed, isStatic, openDropdown])

    // Click outside
    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return

        const onPointerDown = (e: PointerEvent) => {
            const el = rootRef.current
            if (!el) return
            if (!el.contains(e.target as Node)) {
                closeDropdown()
            }
        }
        window.addEventListener("pointerdown", onPointerDown)
        return () => window.removeEventListener("pointerdown", onPointerDown)
    }, [isStatic, closeDropdown])

    const clearAllRecent = useCallback(() => {
        startTransition(() => setRecent([]))
        saveRecent([])
    }, [saveRecent])

    const dismissRecentItem = useCallback(
        (text: string) => {
            const next = recent.filter((r) => r.text.toLowerCase() !== text.toLowerCase())
            startTransition(() => setRecent(next))
            saveRecent(next)
        },
        [recent, saveRecent],
    )

    const startVoice = useCallback(() => {
        if (isStatic) return
        if (!voiceSearch) return
        if (typeof window === "undefined") return

        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

        if (!SpeechRecognition) return

        const recognition = new SpeechRecognition()
        recognition.lang = "en-US"
        recognition.interimResults = true
        recognition.maxAlternatives = 1

        startTransition(() => setIsListening(true))

        recognition.onresult = (event: any) => {
            try {
                const result = event.results[event.results.length - 1]
                const transcript = result[0].transcript
                startTransition(() => {
                    setQuery(transcript)
                    setOpen(true)
                })
            } catch {
                // ignore
            }
        }

        recognition.onerror = () => {
            startTransition(() => setIsListening(false))
        }

        recognition.onend = () => {
            startTransition(() => setIsListening(false))
        }

        try {
            recognition.start()
        } catch {
            startTransition(() => setIsListening(false))
        }
    }, [isStatic, voiceSearch])

    const showDropdown = open && (RenderTarget.current() === RenderTarget.preview || RenderTarget.current() === RenderTarget.export)

    const showCategoryChips = categoryMode === "chips" && (categories?.length ?? 0) > 0

    const ariaListId = `ss-list-${uid}`

    const inputWrapperStyle: CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: backgroundColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        padding: "10px 12px",
        boxSizing: "border-box",
        color: textColor,
        overflow: "visible",
        ...style,
    }

    const iconButtonStyle: CSSProperties = {
        appearance: "none",
        border: "none",
        background: "transparent",
        padding: 6,
        borderRadius: 8,
        cursor: "pointer",
        color: textColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "0 0 auto",
    }

    const hotkeyBadgeStyle: CSSProperties = {
        flex: "0 0 auto",
        padding: "4px 8px",
        borderRadius: 8,
        background: "rgba(0,0,0,0.06)",
        border: `1px solid ${dividerColor}`,
        color: textColor,
        fontSize: 12,
        lineHeight: "12px",
        userSelect: "none",
        whiteSpace: "nowrap",
    }

    const inputStyle: CSSProperties = {
        position: "relative",
        flex: 1,
        minWidth: 0,
        outline: "none",
        border: "none",
        background: "transparent",
        color: textColor,
        ...inputFont,
    }

    const dropdownStyle: CSSProperties = {
        position: "absolute",
        left: 0,
        right: 0,
        top: "calc(100% + 8px)",
        background: dropdownBackground,
        border: `1px solid ${dividerColor}`,
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
        zIndex: 50,
        transformOrigin: "top center",
    }

    const listStyle: CSSProperties = {
        maxHeight: 320,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
    }

    const headerRowStyle: CSSProperties = {
        display: "flex",
        gap: 8,
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 12px",
        borderBottom: `1px solid ${dividerColor}`,
        background: dropdownBackground,
    }

    const chipRowStyle: CSSProperties = {
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
        padding: "10px 12px",
        borderBottom: `1px solid ${dividerColor}`,
        background: dropdownBackground,
    }

    const chipStyle = (active: boolean): CSSProperties => ({
        border: `1px solid ${active ? accentColor : dividerColor}`,
        background: active ? "rgba(0,0,0,0.04)" : "transparent",
        color: textColor,
        borderRadius: 999,
        padding: "6px 10px",
        fontSize: 12,
        lineHeight: "12px",
        cursor: "pointer",
        userSelect: "none",
    })

    const typeLabel = useCallback((t: SuggestionType) => {
        if (t === "recent") return "Recent"
        if (t === "trending") return "Trending"
        if (t === "category") return "Category"
        if (t === "ai") return "AI"
        return "Match"
    }, [])

    return (
        <div ref={rootRef} style={{ position: "relative", width: "100%", height: "100%" }}>
            <style>{`
                .ss-input::placeholder { color: ${placeholderColor}; }
                .ss-item mark { background: transparent; color: inherit; font-weight: 700; }
            `}</style>

            <div style={inputWrapperStyle} aria-label="Smart search" role="search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <path
                        d="M16.2 16.2 21 21"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>

                <input
                    ref={inputRef}
                    className="ss-input"
                    value={query}
                    placeholder={placeholder}
                    style={inputStyle}
                    onFocus={() => {
                        if (!isStatic) openDropdown()
                    }}
                    onChange={(e) => {
                        const next = e.target.value
                        startTransition(() => {
                            setQuery(next)
                            setOpen(true)
                        })
                    }}
                    onKeyDown={isStatic ? undefined : handleKeyDown}
                    aria-expanded={open}
                    aria-controls={ariaListId}
                    aria-autocomplete="list"
                    aria-activedescendant={focusedIndex >= 0 ? `ss-item-${uid}-${focusedIndex}` : undefined}
                />

                {voiceSearch && (
                    <button
                        type="button"
                        style={{
                            ...iconButtonStyle,
                            background: isListening ? "rgba(0,0,0,0.06)" : "transparent",
                            border: `1px solid ${isListening ? dividerColor : "transparent"}`,
                        }}
                        aria-label={isListening ? "Listening" : "Voice search"}
                        onClick={isStatic ? undefined : startVoice}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                                d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"
                                stroke="currentColor"
                                strokeWidth="2"
                            />
                            <path
                                d="M19 11a7 7 0 0 1-14 0"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            <path
                                d="M12 18v3"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            <path
                                d="M8 21h8"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                )}

                {hotkey.trim() && (
                    <span style={{ ...hotkeyBadgeStyle, ...itemFont }} aria-hidden="true">
                        {hotkey}
                    </span>
                )}
            </div>

            <AnimatePresence>
                {showDropdown && (
                    <motion.div
                        style={dropdownStyle}
                        initial={{ opacity: 0, scaleY: 0.95 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        exit={{ opacity: 0, scaleY: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        role="listbox"
                        aria-label="Search suggestions"
                        id={ariaListId}
                    >
                        <div style={headerRowStyle}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                                <span style={{ ...itemFont, fontSize: 12, opacity: 0.7 }}>
                                    {trimmedQuery ? (loading ? "Searching…" : `${suggestions.length} suggestion${suggestions.length === 1 ? "" : "s"}`) : "Suggestions"}
                                </span>
                                {selectedCategory !== "all" && (
                                    <span
                                        style={{
                                            ...itemFont,
                                            fontSize: 12,
                                            border: `1px solid ${dividerColor}`,
                                            borderRadius: 999,
                                            padding: "4px 8px",
                                            opacity: 0.9,
                                        }}
                                    >
                                        {selectedCategory}
                                    </span>
                                )}
                            </div>

                            {showRecent && recent.length > 0 && (
                                <button
                                    type="button"
                                    style={{
                                        ...itemFont,
                                        fontSize: 12,
                                        border: `1px solid ${dividerColor}`,
                                        background: "transparent",
                                        borderRadius: 10,
                                        padding: "6px 10px",
                                        cursor: "pointer",
                                        color: textColor,
                                    }}
                                    onClick={clearAllRecent}
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {showCategoryChips && (
                            <div style={chipRowStyle} aria-label="Category filters">
                                <button
                                    type="button"
                                    style={chipStyle(selectedCategory === "all")}
                                    onClick={() => startTransition(() => setSelectedCategory("all"))}
                                >
                                    All
                                </button>
                                {(categories || []).filter(Boolean).map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        style={chipStyle(selectedCategory === c)}
                                        onClick={() => startTransition(() => setSelectedCategory(c))}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div ref={listRef} style={listStyle}>
                            {suggestions.length === 0 ? (
                                <div
                                    style={{
                                        padding: 14,
                                        ...itemFont,
                                        color: textColor,
                                        opacity: 0.7,
                                    }}
                                >
                                    No results
                                </div>
                            ) : (
                                <motion.div
                                    initial="hidden"
                                    animate="show"
                                    variants={{
                                        hidden: {},
                                        show: {
                                            transition: {
                                                staggerChildren: 0.03,
                                            },
                                        },
                                    }}
                                >
                                    {suggestions.map((s, idx) => {
                                        const active = idx === focusedIndex
                                        const showTime = s.type === "recent" && recentTimestamp === "relative" && typeof s.timestamp === "number"

                                        return (
                                            <motion.div
                                                key={s.id}
                                                id={`ss-item-${uid}-${idx}`}
                                                data-ss-item-index={idx}
                                                role="option"
                                                aria-selected={active}
                                                className="ss-item"
                                                variants={{
                                                    hidden: { opacity: 0, y: -4 },
                                                    show: { opacity: 1, y: 0 },
                                                }}
                                                onMouseEnter={() => startTransition(() => setFocusedIndex(idx))}
                                                onMouseDown={(e) => {
                                                    // Prevent input blur before click
                                                    e.preventDefault()
                                                }}
                                                onClick={() => handleSuggestionPick(s)}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 10,
                                                    padding: "10px 12px",
                                                    cursor: "pointer",
                                                    background: active ? itemActiveBackground : "transparent",
                                                    color: textColor,
                                                    borderBottom:
                                                        idx === suggestions.length - 1
                                                            ? "none"
                                                            : `1px solid ${dividerColor}`,
                                                }}
                                            >
                                                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "baseline",
                                                            justifyContent: "space-between",
                                                            gap: 8,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                ...itemFont,
                                                                whiteSpace: "nowrap",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                minWidth: 0,
                                                            }}
                                                        >
                                                            {highlightText(s.text, trimmedQuery, accentColor)}
                                                        </div>

                                                        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
                                                            {(s.badge || s.type === "ai") && (
                                                                <span
                                                                    style={{
                                                                        ...itemFont,
                                                                        fontSize: 11,
                                                                        lineHeight: "11px",
                                                                        padding: "4px 8px",
                                                                        borderRadius: 999,
                                                                        border: `1px solid ${dividerColor}`,
                                                                        background: "rgba(0,0,0,0.03)",
                                                                        whiteSpace: "nowrap",
                                                                    }}
                                                                >
                                                                    {s.type === "ai" ? "✨ " : ""}
                                                                    {s.badge || typeLabel(s.type)}
                                                                </span>
                                                            )}

                                                            {showTime && (
                                                                <span style={{ ...itemFont, fontSize: 11, opacity: 0.6, whiteSpace: "nowrap" }}>
                                                                    {formatRelativeTime(s.timestamp as number)}
                                                                </span>
                                                            )}

                                                            {s.type === "recent" && (
                                                                <button
                                                                    type="button"
                                                                    aria-label="Dismiss recent search"
                                                                    style={{
                                                                        ...iconButtonStyle,
                                                                        padding: 4,
                                                                        borderRadius: 8,
                                                                        border: `1px solid transparent`,
                                                                    }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        dismissRecentItem(s.text)
                                                                    }}
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                                        <path
                                                                            d="M18 6 6 18"
                                                                            stroke="currentColor"
                                                                            strokeWidth="2"
                                                                            strokeLinecap="round"
                                                                        />
                                                                        <path
                                                                            d="m6 6 12 12"
                                                                            stroke="currentColor"
                                                                            strokeWidth="2"
                                                                            strokeLinecap="round"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </motion.div>
                            )}
                        </div>

                        <div
                            style={{
                                padding: "10px 12px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 8,
                                borderTop: `1px solid ${dividerColor}`,
                            }}
                        >
                            <span style={{ ...itemFont, fontSize: 12, opacity: 0.65 }}>
                                Enter to search • ↑↓ to navigate • Esc to close • Tab to accept
                            </span>
                            <button
                                type="button"
                                style={{
                                    ...itemFont,
                                    fontSize: 12,
                                    border: `1px solid ${dividerColor}`,
                                    background: "transparent",
                                    borderRadius: 10,
                                    padding: "6px 10px",
                                    cursor: "pointer",
                                    color: textColor,
                                }}
                                onClick={() => handleSubmit()}
                            >
                                Search
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(SmartSearch, {
    placeholder: {
        type: ControlType.String,
        title: "Placeholder",
        defaultValue: "Search…",
    },
    hotkey: {
        type: ControlType.String,
        title: "Hotkey",
        defaultValue: "⌘K",
        placeholder: "⌘K",
    },
    debounce: {
        type: ControlType.Number,
        title: "Debounce",
        defaultValue: 300,
        min: 0,
        max: 2000,
        step: 50,
        unit: "ms",
    },
    maxSuggestions: {
        type: ControlType.Number,
        title: "Max",
        defaultValue: 8,
        min: 1,
        max: 20,
        step: 1,
    },
    showRecent: {
        type: ControlType.Boolean,
        title: "Recent",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    aiSuggestions: {
        type: ControlType.Boolean,
        title: "AI",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    voiceSearch: {
        type: ControlType.Boolean,
        title: "Voice",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    categoryMode: {
        type: ControlType.Enum,
        title: "Categories",
        options: ["all", "chips"],
        optionTitles: ["Off", "Chips"],
        defaultValue: "chips",
        displaySegmentedControl: true,
    },
    categories: {
        type: ControlType.Array,
        title: "Category List",
        maxCount: 10,
        control: {
            type: ControlType.String,
            defaultValue: "",
        },
        defaultValue: ["Docs", "Pricing", "Security"],
        hidden: ({ categoryMode }) => categoryMode !== "chips",
    },
    defaultCategory: {
        type: ControlType.String,
        title: "Default",
        defaultValue: "all",
        hidden: ({ categoryMode }) => categoryMode !== "chips",
    },
    trending: {
        type: ControlType.Array,
        title: "Trending",
        maxCount: 20,
        control: {
            type: ControlType.String,
            defaultValue: "",
        },
        defaultValue: defaultTrending,
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 50,
        control: {
            type: ControlType.String,
            defaultValue: "",
        },
        defaultValue: defaultItems,
    },
    useLocalStorage: {
        type: ControlType.Boolean,
        title: "Storage",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    storageKey: {
        type: ControlType.String,
        title: "Storage Key",
        defaultValue: "smart_search_recent",
        hidden: ({ useLocalStorage }) => !useLocalStorage,
    },
    recentTimestamp: {
        type: ControlType.Enum,
        title: "Timestamp",
        options: ["relative", "off"],
        optionTitles: ["Relative", "Off"],
        defaultValue: "relative",
        displaySegmentedControl: true,
        hidden: ({ showRecent }) => !showRecent,
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Bg",
        defaultValue: "#FFFFFF",
    },
    dropdownBackground: {
        type: ControlType.Color,
        title: "Dropdown",
        defaultValue: "#FFFFFF",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#EEEEEE",
    },
    dividerColor: {
        type: ControlType.Color,
        title: "Divider",
        defaultValue: "#EEEEEE",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#000000",
    },
    placeholderColor: {
        type: ControlType.Color,
        title: "Placeholder",
        defaultValue: "#CCCCCC",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#0066FF",
    },
    itemHoverBackground: {
        type: ControlType.Color,
        title: "Hover",
        defaultValue: "#F5F5F5",
    },
    itemActiveBackground: {
        type: ControlType.Color,
        title: "Active",
        defaultValue: "#F5F5F5",
    },

    inputFont: {
        type: ControlType.Font,
        title: "Input Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    itemFont: {
        type: ControlType.Font,
        title: "Item Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },

    onSearch: {
        type: ControlType.EventHandler,
        title: "On Search",
    },
    onSuggestionSelect: {
        type: ControlType.EventHandler,
        title: "On Select",
    },
})
