// Live search component with animated dropdown, keyboard navigation, and filtering
import { useId, useState, useRef, useEffect, useMemo, useCallback, startTransition, type CSSProperties } from "react"
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

interface SearchResult {
    id: string
    icon: string
    title: string
    description: string
    category: string
    image?: string
    imageAlt?: string
    link?: string
}

// CMS items arrive as props on LiveSearchItem instances placed inside a Collection List.
// Each instance registers its fields here, grouped by Search ID, and LiveSearch subscribes.
const registry = new Map<string, Map<string, SearchResult>>()
const listeners = new Set<() => void>()
let notifyQueued = false

// Many items register in the same tick, so listeners are notified once per batch
function notify() {
    if (notifyQueued) return
    notifyQueued = true
    queueMicrotask(() => {
        notifyQueued = false
        listeners.forEach((listener) => listener())
    })
}

function registerItem(group: string, key: string, item: SearchResult): () => void {
    let items = registry.get(group)
    if (!items) {
        items = new Map()
        registry.set(group, items)
    }
    items.set(key, item)
    notify()
    return () => {
        items.delete(key)
        notify()
    }
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}

function readGroup(group: string): SearchResult[] {
    const results: SearchResult[] = []
    const seen = new Set<string>()
    for (const item of registry.get(group)?.values() ?? []) {
        if (results.length >= MAX_CMS_ITEMS) break
        // Responsive breakpoints can render the same list more than once
        const key = `${item.title}|${item.description}|${item.link || ""}`
        if (seen.has(key)) continue
        seen.add(key)
        results.push(item)
    }
    return results
}

const normalizeGroup = (value: string) => value.trim().toLowerCase() || "search"

// Upper bound so a very large Collection List can't stall the page
const MAX_CMS_ITEMS = 500

const RESULT_FIELDS: (keyof SearchResult)[] = ["id", "icon", "title", "description", "category", "image", "imageAlt", "link"]

function sameResults(a: SearchResult[], b: SearchResult[]): boolean {
    if (a === b) return true
    if (a.length !== b.length) return false
    return a.every((item, i) => RESULT_FIELDS.every((field) => item[field] === b[i][field]))
}

interface LiveSearchProps {
    placeholder: string
    useCMS: boolean
    searchId: string
    results: SearchResult[]
    recentSearches: string[]
    categories: string[]
    emptyStateIcon: string
    loadingDuration: number
    maxResults: number
    accentColor: string
    backgroundColor: string
    textColor: string
    secondaryTextColor: string
    borderColor: string
    hoverColor: string
    inputFont: CSSProperties
    titleFont: CSSProperties
    descriptionFont: CSSProperties
    mobileBreakpoint: number
    style?: CSSProperties
}

/**
 * Live Search Component
 * 
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 50
 * 
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function LiveSearch(props: LiveSearchProps) {
    const {
        placeholder = "Search...",
        useCMS = false,
        searchId = "search",
        results = [],
        recentSearches = [],
        categories = [],
        emptyStateIcon = "🔍",
        loadingDuration = 500,
        maxResults = 8,
        accentColor = "#0099FF",
        backgroundColor = "#FFFFFF",
        textColor = "#000000",
        secondaryTextColor = "#666666",
        borderColor = "#EEEEEE",
        hoverColor = "#F5F5F5",
        inputFont = {},
        titleFont = {},
        descriptionFont = {},
        mobileBreakpoint = 768,
    } = props

    const [query, setQuery] = useState("")
    const [isFocused, setIsFocused] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [isMobile, setIsMobile] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const resultsRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()
    const listboxId = `live-search-${useId().replace(/:/g, "")}`
    const optionId = (kind: "recent" | "result", index: number) => `${listboxId}-${kind}-${index}`
    // Rendered option rows by id, so keyboard selection can scroll without querying the DOM
    const optionRefs = useRef(new Map<string, HTMLElement>())
    const setOptionRef = (id: string) => (el: HTMLElement | null) => {
        if (el) optionRefs.current.set(id, el)
        else optionRefs.current.delete(id)
    }

    // Detect mobile viewport
    useEffect(() => {
        if (typeof window === "undefined") return

        const checkMobile = () => {
            startTransition(() => setIsMobile(window.innerWidth < mobileBreakpoint))
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [mobileBreakpoint])

    // CMS mode: items come from LiveSearchItem instances with the same Search ID
    const [cmsResults, setCmsResults] = useState<SearchResult[]>([])

    useEffect(() => {
        if (!useCMS || isStatic) {
            setCmsResults([])
            return
        }
        const group = normalizeGroup(searchId)
        const update = () => {
            const items = readGroup(group)
            startTransition(() => setCmsResults((prev) => (sameResults(prev, items) ? prev : items)))
        }
        update()
        return subscribe(update)
    }, [useCMS, isStatic, searchId])

    const selectResult = useCallback((result: SearchResult) => {
        if (result.link && RenderTarget.current() !== RenderTarget.canvas) {
            window.location.href = result.link
            return
        }
        startTransition(() => {
            setQuery(result.title)
            setIsFocused(false)
        })
    }, [])

    // Use CMS results if enabled, otherwise use manual results
    const activeResults = useCMS ? cmsResults : results

    // Extract unique categories from active results
    const activeCategories = useMemo(() => {
        if (useCMS) {
            const cats = new Set(activeResults.map(r => r.category))
            return Array.from(cats)
        }
        return categories
    }, [useCMS, activeResults, categories])

    // Filter results based on query and category
    const filteredResults = useMemo(() => {
        let filtered = activeResults

        if (selectedCategory) {
            filtered = filtered.filter(r => r.category === selectedCategory)
        }

        if (query.trim()) {
            const lowerQuery = query.toLowerCase()
            filtered = filtered.filter(r => 
                r.title.toLowerCase().includes(lowerQuery) || 
                r.description.toLowerCase().includes(lowerQuery)
            )
        }

        return filtered.slice(0, maxResults)
    }, [query, selectedCategory, activeResults, maxResults])

    // Show dropdown when focused
    const showDropdown = isFocused && (query.trim() || recentSearches.length > 0)
    const showResults = query.trim().length > 0
    const showRecent = !query.trim() && recentSearches.length > 0
    const showEmpty = showResults && filteredResults.length === 0 && !isLoading

    // Simulate loading
    useEffect(() => {
        if (query.trim()) {
            setIsLoading(true)
            const timer = setTimeout(() => {
                startTransition(() => setIsLoading(false))
            }, loadingDuration)
            return () => clearTimeout(timer)
        } else {
            setIsLoading(false)
        }
    }, [query, loadingDuration])

    // Reset selected index when results change
    useEffect(() => {
        startTransition(() => setSelectedIndex(-1))
    }, [filteredResults])

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!showDropdown) return

        const itemCount = showRecent ? recentSearches.length : filteredResults.length

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault()
                startTransition(() => {
                    setSelectedIndex(prev => (prev < itemCount - 1 ? prev + 1 : prev))
                })
                break
            case "ArrowUp":
                e.preventDefault()
                startTransition(() => {
                    setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
                })
                break
            case "Enter":
                e.preventDefault()
                if (selectedIndex >= 0) {
                    if (showRecent) {
                        startTransition(() => {
                            setQuery(recentSearches[selectedIndex])
                            setIsFocused(false)
                        })
                    } else if (filteredResults[selectedIndex]) {
                        selectResult(filteredResults[selectedIndex])
                    }
                }
                break
            case "Escape":
                e.preventDefault()
                startTransition(() => {
                    setIsFocused(false)
                    inputRef.current?.blur()
                })
                break
        }
    }, [showDropdown, showRecent, recentSearches, filteredResults, selectedIndex, selectResult])

    // Scroll selected item into view
    useEffect(() => {
        if (selectedIndex >= 0) {
            const id = optionId(showRecent ? "recent" : "result", selectedIndex)
            const selectedElement = optionRefs.current.get(id)
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" })
            }
        }
    }, [selectedIndex, showRecent, listboxId])

    // Highlight matched text
    const highlightText = (text: string, query: string) => {
        if (!query.trim()) return text

        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const parts = text.split(new RegExp(`(${escaped})`, "gi"))
        return parts.map((part, i) => 
            part.toLowerCase() === query.toLowerCase() 
                ? <strong key={i} style={{ fontWeight: 700, color: accentColor }}>{part}</strong>
                : part
        )
    }

    const hasText = query.length > 0

    // Responsive sizing
    const inputPadding = isMobile ? "12px" : "14px"
    const iconPadding = isMobile ? "0 12px" : "0 16px"
    const dropdownPadding = isMobile ? "8px 12px" : "12px 16px"
    const resultPadding = isMobile ? 12 : 16
    const iconSize = isMobile ? 18 : 20
    const resultIconSize = isMobile ? 28 : 32
    const maxDropdownHeight = isMobile ? "70vh" : 400
    const emptyStatePadding = isMobile ? 32 : 48
    const emptyStateIconSize = isMobile ? 48 : 64

    // Static fallback for canvas thumbnails and exports: the closed field, no motion or CMS observation
    if (isStatic) {
        return (
            <div style={{ position: "relative", width: "100%" }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        backgroundColor,
                        border: `2px solid ${borderColor}`,
                        borderRadius: isMobile ? 10 : 12,
                        overflow: "hidden",
                    }}
                >
                    <div style={{ padding: iconPadding, display: "flex", alignItems: "center" }}>
                        <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <circle cx="8" cy="8" r="6" stroke={secondaryTextColor} strokeWidth="2" />
                            <path d="M13 13L17 17" stroke={secondaryTextColor} strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div
                        style={{
                            flex: 1,
                            padding: `${inputPadding} ${isMobile ? "12px" : "16px"} ${inputPadding} 0`,
                            color: secondaryTextColor,
                            fontSize: inputFont.fontSize || "15px",
                            ...inputFont,
                        }}
                    >
                        {placeholder}
                    </div>
                </div>
                {useCMS && RenderTarget.current() === RenderTarget.canvas && (
                    <div style={{ marginTop: 8, fontSize: 12, color: secondaryTextColor }}>
                        {`CMS mode: add a LiveSearchItem to your Collection List item, bind its fields, and set Search ID to "${searchId}". Results show in Preview.`}
                    </div>
                )}
            </div>
        )
    }

    const activeOption =
        showDropdown && selectedIndex >= 0 ? optionId(showRecent ? "recent" : "result", selectedIndex) : undefined

    return (
        <div 
            ref={containerRef}
            // Close when focus leaves the search, e.g. a click elsewhere on the page
            onBlur={(e) => {
                if (!containerRef.current?.contains(e.relatedTarget as Node | null)) {
                    startTransition(() => setIsFocused(false))
                }
            }}
            style={{
                position: "relative",
                width: "100%",
            }}
        >
            {/* Search Input */}
            <motion.div
                animate={{
                    width: isFocused ? "100%" : "100%",
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    backgroundColor,
                    border: `2px solid ${isFocused ? accentColor : borderColor}`,
                    borderRadius: isMobile ? 10 : 12,
                    overflow: "hidden",
                    transition: "border-color 0.2s ease",
                }}
            >
                {/* Icon */}
                <div style={{ 
                    padding: iconPadding,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                }}>
                    <AnimatePresence mode="wait">
                        {hasText ? (
                            <motion.button
                                key="close"
                                type="button"
                                aria-label="Clear search"
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => {
                                    startTransition(() => setQuery(""))
                                    inputRef.current?.focus()
                                }}
                                style={{
                                    display: "flex",
                                    padding: 0,
                                    border: "none",
                                    background: "none",
                                    cursor: "pointer",
                                    pointerEvents: "auto",
                                    touchAction: "manipulation",
                                }}
                            >
                                <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                    <path
                                        d="M15 5L5 15M5 5L15 15"
                                        stroke={secondaryTextColor}
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </motion.button>
                        ) : (
                            <motion.svg
                                key="search"
                                initial={{ rotate: 90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: -90, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                width={iconSize}
                                height={iconSize}
                                viewBox="0 0 20 20"
                                fill="none"
                            >
                                <circle
                                    cx="8"
                                    cy="8"
                                    r="6"
                                    stroke={secondaryTextColor}
                                    strokeWidth="2"
                                />
                                <path
                                    d="M13 13L17 17"
                                    stroke={secondaryTextColor}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </motion.svg>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => startTransition(() => setQuery(e.target.value))}
                    onFocus={() => startTransition(() => setIsFocused(true))}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    role="combobox"
                    aria-label={placeholder}
                    aria-autocomplete="list"
                    aria-expanded={Boolean(showDropdown)}
                    aria-controls={listboxId}
                    aria-activedescendant={activeOption}
                    style={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        backgroundColor: "transparent",
                        padding: `${inputPadding} ${isMobile ? "12px" : "16px"} ${inputPadding} 0`,
                        color: textColor,
                        fontSize: isMobile ? "16px" : inputFont.fontSize || "15px",
                        ...inputFont,
                    }}
                />
            </motion.div>

            {/* Dropdown */}
            <AnimatePresence>
                {showDropdown && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: isMobile ? "absolute" : "absolute",
                            top: isMobile ? "calc(100% + 8px)" : "calc(100% + 8px)",
                            bottom: "auto",
                            left: 0,
                            right: 0,
                            backgroundColor,
                            border: `1px solid ${borderColor}`,
                            borderRadius: isMobile ? 12 : 12,
                            boxShadow: isMobile 
                                ? "0 4px 24px rgba(0,0,0,0.15)" 
                                : "0 8px 24px rgba(0,0,0,0.12)",
                            overflow: "hidden",
                            zIndex: 1000,
                            maxHeight: isMobile ? "70vh" : "auto",
                        }}
                    >
                        {/* Mobile Handle */}
                        {isMobile && (
                            <div style={{
                                padding: "8px 0 4px",
                                display: "flex",
                                justifyContent: "center",
                            }}>
                                <div style={{
                                    width: 40,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: borderColor,
                                }} />
                            </div>
                        )}

                        {/* Categories */}
                        {activeCategories.length > 0 && showResults && (
                            <div style={{
                                padding: dropdownPadding,
                                borderBottom: `1px solid ${borderColor}`,
                                display: "flex",
                                gap: isMobile ? 6 : 8,
                                flexWrap: "wrap",
                                overflowX: isMobile ? "auto" : "visible",
                                WebkitOverflowScrolling: "touch",
                            }}>
                                <button
                                    type="button"
                                    aria-pressed={selectedCategory === null}
                                    onClick={() => startTransition(() => setSelectedCategory(null))}
                                    style={{
                                        padding: isMobile ? "8px 14px" : "6px 12px",
                                        borderRadius: 20,
                                        border: "none",
                                        backgroundColor: selectedCategory === null ? accentColor : hoverColor,
                                        color: selectedCategory === null ? "#FFFFFF" : textColor,
                                        cursor: "pointer",
                                        fontSize: isMobile ? 14 : 13,
                                        fontWeight: 500,
                                        transition: "all 0.2s ease",
                                        touchAction: "manipulation",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    All
                                </button>
                                {activeCategories.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        aria-pressed={selectedCategory === cat}
                                        onClick={() => startTransition(() => setSelectedCategory(cat))}
                                        style={{
                                            padding: isMobile ? "8px 14px" : "6px 12px",
                                            borderRadius: 20,
                                            border: "none",
                                            backgroundColor: selectedCategory === cat ? accentColor : hoverColor,
                                            color: selectedCategory === cat ? "#FFFFFF" : textColor,
                                            cursor: "pointer",
                                            fontSize: isMobile ? 14 : 13,
                                            fontWeight: 500,
                                            transition: "all 0.2s ease",
                                            touchAction: "manipulation",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Results Container */}
                        <div
                            ref={resultsRef}
                            id={listboxId}
                            role="listbox"
                            aria-label="Search results"
                            style={{
                                maxHeight: maxDropdownHeight,
                                overflowY: "auto",
                                overflowX: "hidden",
                                overscrollBehavior: "contain",
                                WebkitOverflowScrolling: "touch",
                            }}
                        >
                            {/* Loading State */}
                            {isLoading && (
                                <div role="status" aria-label="Loading results" style={{ padding: isMobile ? 4 : 8 }}>
                                    {[...Array(3)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.1 }}
                                            style={{
                                                padding: resultPadding,
                                                display: "flex",
                                                gap: isMobile ? 10 : 12,
                                            }}
                                        >
                                            <div style={{
                                                width: isMobile ? 36 : 40,
                                                height: isMobile ? 36 : 40,
                                                borderRadius: 8,
                                                background: `linear-gradient(90deg, ${hoverColor} 0%, ${borderColor} 50%, ${hoverColor} 100%)`,
                                                backgroundSize: "200% 100%",
                                                animation: "shimmer 1.5s infinite",
                                                flexShrink: 0,
                                            }} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    height: isMobile ? 14 : 16,
                                                    width: "60%",
                                                    borderRadius: 4,
                                                    marginBottom: isMobile ? 6 : 8,
                                                    background: `linear-gradient(90deg, ${hoverColor} 0%, ${borderColor} 50%, ${hoverColor} 100%)`,
                                                    backgroundSize: "200% 100%",
                                                    animation: "shimmer 1.5s infinite",
                                                }} />
                                                <div style={{
                                                    height: isMobile ? 10 : 12,
                                                    width: "90%",
                                                    borderRadius: 4,
                                                    background: `linear-gradient(90deg, ${hoverColor} 0%, ${borderColor} 50%, ${hoverColor} 100%)`,
                                                    backgroundSize: "200% 100%",
                                                    animation: "shimmer 1.5s infinite",
                                                }} />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* Recent Searches */}
                            {!isLoading && showRecent && (
                                <div role="group" aria-label="Recent searches">
                                    <div role="presentation" style={{
                                        padding: isMobile ? "8px 12px 4px" : "12px 16px 8px",
                                        fontSize: isMobile ? 11 : 12,
                                        fontWeight: 600,
                                        color: secondaryTextColor,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                    }}>
                                        Recent Searches
                                    </div>
                                    {recentSearches.map((search, i) => (
                                        <motion.div
                                            key={i}
                                            id={optionId("recent", i)}
                                            ref={setOptionRef(optionId("recent", i))}
                                            role="option"
                                            aria-selected={selectedIndex === i}
                                            // Keep focus in the input so keyboard navigation continues
                                            onMouseDown={(e) => e.preventDefault()}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => {
                                                startTransition(() => {
                                                    setQuery(search)
                                                    setIsFocused(false)
                                                })
                                            }}
                                            style={{
                                                padding: isMobile ? "10px 12px" : "12px 16px",
                                                cursor: "pointer",
                                                backgroundColor: selectedIndex === i ? hoverColor : "transparent",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: isMobile ? 10 : 12,
                                                transition: "background-color 0.15s ease",
                                                touchAction: "manipulation",
                                            }}
                                        >
                                            <svg width={isMobile ? 14 : 16} height={isMobile ? 14 : 16} viewBox="0 0 16 16" fill="none">
                                                <path
                                                    d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z"
                                                    stroke={secondaryTextColor}
                                                    strokeWidth="1.5"
                                                />
                                                <path
                                                    d="M8 5V8L10 10"
                                                    stroke={secondaryTextColor}
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <span style={{ 
                                                color: textColor,
                                                fontSize: isMobile ? "15px" : inputFont.fontSize || "15px",
                                                ...inputFont,
                                            }}>
                                                {search}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* Search Results */}
                            {!isLoading && showResults && !showEmpty && (
                                <div role="group" aria-label="Results">
                                    {filteredResults.map((result, i) => (
                                        <motion.div
                                            key={result.id}
                                            id={optionId("result", i)}
                                            ref={setOptionRef(optionId("result", i))}
                                            role="option"
                                            aria-selected={selectedIndex === i}
                                            aria-label={result.description ? `${result.title}, ${result.description}` : result.title}
                                            onMouseDown={(e) => e.preventDefault()}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => selectResult(result)}
                                            style={{
                                                padding: resultPadding,
                                                cursor: "pointer",
                                                backgroundColor: selectedIndex === i ? hoverColor : "transparent",
                                                display: "flex",
                                                gap: isMobile ? 10 : 12,
                                                transition: "background-color 0.15s ease",
                                                touchAction: "manipulation",
                                            }}
                                        >
                                            {result.image ? (
                                                <img
                                                    src={result.image}
                                                    // Alt text comes from the bound CMS image; empty means decorative
                                                    alt={result.imageAlt || ""}
                                                    style={{
                                                        width: resultIconSize,
                                                        height: resultIconSize,
                                                        borderRadius: 6,
                                                        objectFit: "cover",
                                                        flexShrink: 0,
                                                    }}
                                                />
                                            ) : (
                                                <div style={{
                                                    fontSize: resultIconSize,
                                                    lineHeight: 1,
                                                    flexShrink: 0,
                                                }}>
                                                    {result.icon}
                                                </div>
                                            )}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    color: textColor,
                                                    marginBottom: 4,
                                                    fontSize: isMobile ? "14px" : titleFont.fontSize || "15px",
                                                    ...titleFont,
                                                }}>
                                                    {highlightText(result.title, query)}
                                                </div>
                                                <div style={{
                                                    color: secondaryTextColor,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: isMobile ? "normal" : "nowrap",
                                                    display: isMobile ? "-webkit-box" : "block",
                                                    WebkitLineClamp: isMobile ? 2 : undefined,
                                                    WebkitBoxOrient: isMobile ? "vertical" : undefined,
                                                    fontSize: isMobile ? "13px" : descriptionFont.fontSize || "13px",
                                                    ...descriptionFont,
                                                }}>
                                                    {highlightText(result.description, query)}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* Empty State */}
                            {!isLoading && showEmpty && (
                                <motion.div
                                    role="status"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{
                                        padding: emptyStatePadding,
                                        textAlign: "center",
                                    }}
                                >
                                    <div style={{ fontSize: emptyStateIconSize, marginBottom: isMobile ? 12 : 16 }}>
                                        {emptyStateIcon}
                                    </div>
                                    <div style={{
                                        color: textColor,
                                        marginBottom: isMobile ? 6 : 8,
                                        fontSize: isMobile ? "16px" : titleFont.fontSize || "15px",
                                        ...titleFont,
                                    }}>
                                        No results for "{query}"
                                    </div>
                                    <div style={{
                                        color: secondaryTextColor,
                                        fontSize: isMobile ? "14px" : descriptionFont.fontSize || "13px",
                                        ...descriptionFont,
                                    }}>
                                        Try searching for something else
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Canvas hint when CMS mode has no items yet */}
            {useCMS && RenderTarget.current() === RenderTarget.canvas && cmsResults.length === 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: secondaryTextColor }}>
                    {`Add a LiveSearchItem inside your Collection List item, bind its fields to the CMS, and set Search ID to "${searchId}".`}
                </div>
            )}

            {/* Shimmer Animation */}
            <style>{`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    )
}

addPropertyControls(LiveSearch, {
    placeholder: {
        type: ControlType.String,
        title: "Placeholder",
        defaultValue: "Search...",
    },
    useCMS: {
        type: ControlType.Boolean,
        title: "Data Source",
        enabledTitle: "CMS",
        disabledTitle: "Manual",
        defaultValue: false,
    },
    searchId: {
        type: ControlType.String,
        title: "Search ID",
        defaultValue: "search",
        description: "Matches the Search ID on the LiveSearchItem components inside your Collection List.",
        hidden: ({ useCMS }) => !useCMS,
    },
    results: {
        type: ControlType.Array,
        title: "Results",
        control: {
            type: ControlType.Object,
            controls: {
                id: {
                    type: ControlType.String,
                    defaultValue: "1",
                },
                icon: {
                    type: ControlType.String,
                    defaultValue: "📄",
                },
                title: {
                    type: ControlType.String,
                    defaultValue: "Result Title",
                },
                description: {
                    type: ControlType.String,
                    defaultValue: "Result description goes here",
                },
                category: {
                    type: ControlType.String,
                    defaultValue: "General",
                },
            },
        },
        defaultValue: [
            { id: "1", icon: "📄", title: "Getting Started Guide", description: "Learn the basics of using our platform", category: "Documentation" },
            { id: "2", icon: "🎨", title: "Design System", description: "Explore our design components and patterns", category: "Design" },
            { id: "3", icon: "⚙️", title: "API Reference", description: "Complete API documentation and examples", category: "Documentation" },
            { id: "4", icon: "🚀", title: "Quick Start Tutorial", description: "Get up and running in 5 minutes", category: "Tutorials" },
            { id: "5", icon: "💡", title: "Best Practices", description: "Tips and tricks for optimal performance", category: "Tutorials" },
            { id: "6", icon: "🔧", title: "Configuration Guide", description: "How to configure your environment", category: "Documentation" },
            { id: "7", icon: "🎯", title: "Advanced Features", description: "Unlock the full potential of the platform", category: "Tutorials" },
            { id: "8", icon: "📊", title: "Analytics Dashboard", description: "Track your metrics and insights", category: "Features" },
        ],
        hidden: ({ useCMS }) => useCMS,
    },
    recentSearches: {
        type: ControlType.Array,
        title: "Recent Searches",
        control: {
            type: ControlType.String,
        },
        defaultValue: ["Getting Started", "API", "Design System"],
    },
    categories: {
        type: ControlType.Array,
        title: "Categories",
        control: {
            type: ControlType.String,
        },
        defaultValue: ["Documentation", "Tutorials", "Design", "Features"],
        hidden: ({ useCMS }) => useCMS,
        description: "Categories auto-detected from CMS when using CMS mode",
    },
    emptyStateIcon: {
        type: ControlType.String,
        title: "Empty Icon",
        defaultValue: "🔍",
    },
    loadingDuration: {
        type: ControlType.Number,
        title: "Loading Time",
        defaultValue: 500,
        min: 0,
        max: 2000,
        step: 100,
        unit: "ms",
    },
    maxResults: {
        type: ControlType.Number,
        title: "Max Results",
        defaultValue: 8,
        min: 1,
        max: 20,
        step: 1,
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#0099FF",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#000000",
    },
    secondaryTextColor: {
        type: ControlType.Color,
        title: "Secondary Text",
        defaultValue: "#666666",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#EEEEEE",
    },
    hoverColor: {
        type: ControlType.Color,
        title: "Hover",
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
            lineHeight: "1em",
        },
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Description Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile Below",
        defaultValue: 768,
        min: 320,
        max: 1440,
        step: 1,
        unit: "px",
        displayStepper: true,
        description: "Below this viewport width the search uses its compact mobile layout.",
    },
})

interface LiveSearchItemProps {
    searchId: string
    title: string
    description: string
    category: string
    icon: string
    image?: { src?: string; alt?: string }
    link: string
    style?: CSSProperties
}

/**
 * Live Search Item
 *
 * Place inside a Collection List item and bind its properties to CMS fields.
 * It renders nothing on the live site and sends its data to the LiveSearch with the same Search ID.
 *
 * @framerIntrinsicWidth 160
 * @framerIntrinsicHeight 24
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export function LiveSearchItem(props: LiveSearchItemProps) {
    const {
        searchId = "search",
        title = "",
        description = "",
        category = "",
        icon = "",
        image,
        link = "",
    } = props
    const key = useId()
    const imageSrc = image?.src || undefined
    const imageAlt = image?.alt?.trim() || undefined

    useEffect(() => {
        if (!title.trim()) return
        return registerItem(normalizeGroup(searchId), key, {
            id: link || key,
            icon: icon.trim() || "📄",
            title: title.trim(),
            description: description.trim(),
            category: category.trim() || "General",
            image: imageSrc,
            imageAlt,
            link: link || undefined,
        })
    }, [searchId, key, title, description, category, icon, imageSrc, imageAlt, link])

    // Only the canvas shows the item, so the bound list stays editable but invisible when published
    if (RenderTarget.current() !== RenderTarget.canvas) return null

    return (
        <div
            style={{
                ...props.style,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px",
                borderRadius: 6,
                backgroundColor: "rgba(0, 153, 255, 0.1)",
                color: "#0099FF",
                fontSize: 12,
                whiteSpace: "nowrap",
            }}
        >
            <span aria-hidden="true">🔍</span>
            {title || "Search item"}
        </div>
    )
}

addPropertyControls(LiveSearchItem, {
    searchId: {
        type: ControlType.String,
        title: "Search ID",
        defaultValue: "search",
        description: "Must match the Search ID on the LiveSearch component",
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "",
    },
    description: {
        type: ControlType.String,
        title: "Description",
        defaultValue: "",
        displayTextArea: true,
    },
    category: {
        type: ControlType.String,
        title: "Category",
        defaultValue: "",
    },
    icon: {
        type: ControlType.String,
        title: "Icon",
        defaultValue: "",
        description: "Emoji or short text, used when there is no image",
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
})
