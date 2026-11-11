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
 * Cloud Search Bar Pro
 *
 * Premium Framer search component with animated cloud suggestions,
 * keyboard navigation, optional API-powered suggestions, redirect search,
 * event handler support, light/dark mode, responsive sizing, and accessible
 * combobox/listbox semantics.
 */

const DEFAULT_SUGGESTIONS = [
    "AI website templates",
    "Framer components",
    "SaaS hero section",
    "Animated buttons",
    "Pricing cards",
    "Search bars",
    "Portfolio sections",
    "Dark mode UI",
    "Glassmorphism cards",
    "Startup landing page",
]

type Theme = "light" | "dark"

type Props = {
    placeholder: string
    buttonText: string
    suggestions: string
    backgroundColor: string
    inputColor: string
    cloudColor: string
    buttonColor: string
    accentColor: string
    textColor: string
    theme: Theme
    apiUrl: string
    searchUrl: string
    openInNewTab: boolean
    onSearch?: (query: string) => void
    width: number
    height: number
    borderRadius: number
}

export default function CloudSearchBar(props: Partial<Props>) {
    const {
        placeholder = "Search components...",
        buttonText = "Search",
        suggestions = DEFAULT_SUGGESTIONS.join(", "),
        backgroundColor = "#D9A514",
        inputColor = "#FFFFFF",
        cloudColor = "#FFFFFF",
        buttonColor = "#F4F4F4",
        accentColor = "#D9A514",
        textColor = "#6F6F6F",
        theme = "dark",
        apiUrl = "",
        searchUrl = "",
        openInNewTab = false,
        onSearch,
        width = 860,
        height = 76,
        borderRadius = 28,
    } = props

    const [query, setQuery] = React.useState("")
    const [isFocused, setIsFocused] = React.useState(false)
    const [selectedIndex, setSelectedIndex] = React.useState(0)
    const [apiSuggestions, setApiSuggestions] = React.useState<string[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const [hasApiResponded, setHasApiResponded] = React.useState(false)
    const inputId = React.useId()
    const cloudId = React.useId()

    // Base color overrides for Dark Mode
    const finalInputColor = theme === "dark" ? "#171717" : inputColor
    const finalCloudColor = theme === "dark" ? "#1E1E1E" : cloudColor
    const finalTextColor = theme === "dark" ? "#F4F4F4" : textColor
    const finalMutedColor = theme === "dark" ? "#D1D1D1" : textColor
    const finalPillBackground =
        theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(247,248,251,0.78)"

    const finalBarColor = theme === "dark" ? "#111111" : backgroundColor
    const finalButtonColor = theme === "dark" ? "#1A1A1A" : buttonColor
    const finalButtonTextColor = theme === "dark" ? "#F4F4F4" : textColor

    // --- FIXES: Dynamic Shadows & Borders for Smooth Dark Mode ---
    const finalBoxShadow =
        theme === "dark"
            ? `0 26px 60px rgba(0, 0, 0, 0.5),
           0 10px 24px rgba(0, 0, 0, 0.3),
           inset 0 1px 0 rgba(255,255,255,0.05),
           inset 0 -2px 6px rgba(0,0,0,0.4)`
            : `0 26px 60px rgba(15, 23, 42, 0.18),
           0 10px 24px rgba(217,165,20,0.22),
           inset 0 1px 0 rgba(255,255,255,0.9),
           inset 0 -2px 6px rgba(0,0,0,0.08)`

    const finalInputShadow =
        theme === "dark"
            ? `inset 0 2px 8px rgba(0,0,0,0.6),
           inset 0 -5px 10px rgba(255,255,255,0.02)`
            : `0 14px 30px rgba(30,20,45,0.14),
           inset 0 2px 8px rgba(5,20,45,0.89),
           inset 0 2px 4px rgba(255,255,255,0.95),
           inset 0 -5px 10px rgba(15,23,42,0.12)`

    const finalBorder =
        theme === "dark"
            ? "1px solid rgba(255,255,255,0.1)"
            : "1px solid rgba(255,255,255,0.75)"

    const finalInputBorder =
        theme === "dark"
            ? "1px solid rgba(255,255,255,0.05)"
            : "1px solid rgba(255,255,255,0.55)"
    // -------------------------------------------------------------

    // Turns comma-separated suggestions into an array.
    const localSuggestions = React.useMemo(() => {
        return suggestions
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
    }, [suggestions])

    // Match suggestions anywhere inside the string and sort by keyword position
    const localMatches = React.useMemo(() => {
        const cleanQuery = query.trim().toLowerCase()
        if (!cleanQuery) return []

        return localSuggestions
            .filter((item) => item.toLowerCase().includes(cleanQuery))
            .sort((a, b) => {
                const indexA = a.toLowerCase().indexOf(cleanQuery)
                const indexB = b.toLowerCase().indexOf(cleanQuery)
                return indexA - indexB
            })
            .slice(0, 5)
    }, [query, localSuggestions])

    // Optional API support.
    React.useEffect(() => {
        const cleanQuery = query.trim()

        if (!apiUrl || cleanQuery.length < 2) {
            setApiSuggestions([])
            setHasApiResponded(false)
            return
        }

        const controller = new AbortController()
        const timer = window.setTimeout(async () => {
            try {
                setIsLoading(true)
                const separator = apiUrl.includes("?") ? "&" : "?"
                const response = await fetch(
                    `${apiUrl}${separator}q=${encodeURIComponent(cleanQuery)}`,
                    { signal: controller.signal }
                )

                const data = await response.json()
                const results = Array.isArray(data)
                    ? data
                    : Array.isArray(data.suggestions)
                      ? data.suggestions
                      : []

                setApiSuggestions(
                    results
                        .map((item: unknown) => String(item))
                        .filter(Boolean)
                        .slice(0, 5)
                )
                setHasApiResponded(true)
            } catch (error) {
                if (!controller.signal.aborted) {
                    setApiSuggestions([])
                    setHasApiResponded(true)
                }
            } finally {
                if (!controller.signal.aborted) setIsLoading(false)
            }
        }, 300)

        return () => {
            controller.abort()
            window.clearTimeout(timer)
        }
    }, [apiUrl, query])

    const cleanQuery = query.trim()
    const fallbackSuggestions = localSuggestions.slice(0, 5)
    const apiWasRequested = Boolean(apiUrl && cleanQuery.length >= 2)
    const shouldShowEmptyState =
        apiWasRequested &&
        hasApiResponded &&
        !isLoading &&
        apiSuggestions.length === 0 &&
        localMatches.length === 0

    const visibleSuggestions = shouldShowEmptyState
        ? []
        : apiSuggestions.length > 0
          ? apiSuggestions
          : localMatches.length > 0
            ? localMatches
            : fallbackSuggestions

    const showCloud = cleanQuery.length > 0 && isFocused
    const mobileCloudY = width < 420 ? -140 : -172
    const mobileCloudExitY = width < 420 ? -110 : -130
    const selectedSuggestionId =
        showCloud && visibleSuggestions[selectedIndex]
            ? `${cloudId}-suggestion-${selectedIndex}`
            : undefined

    React.useEffect(() => {
        setSelectedIndex(0)
    }, [query])

    function runSearch(value: string) {
        const finalValue = value.trim()
        if (!finalValue) return

        onSearch?.(finalValue)

        if (searchUrl) {
            const separator = searchUrl.includes("?") ? "&" : "?"
            const url = `${searchUrl}${separator}q=${encodeURIComponent(finalValue)}`

            if (openInNewTab) {
                window.open(url, "_blank", "noopener,noreferrer")
            } else {
                window.location.href = url
            }
        }
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (!showCloud) return

        if (event.key === "ArrowDown") {
            event.preventDefault()
            if (visibleSuggestions.length === 0) return

            setSelectedIndex((current) =>
                Math.min(current + 1, visibleSuggestions.length - 1)
            )
        }

        if (event.key === "ArrowUp") {
            event.preventDefault()
            if (visibleSuggestions.length === 0) return

            setSelectedIndex((current) => Math.max(current - 1, 0))
        }

        if (event.key === "Enter") {
            event.preventDefault()
            const selectedSuggestion = visibleSuggestions[selectedIndex]
            runSearch(selectedSuggestion || query)
        }

        if (event.key === "Escape") {
            setIsFocused(false)
        }
    }

    return (
        <div
            style={{
                width: "100%",
                maxWidth: width,
                height: height,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "visible",
                background: "transparent",
                position: "relative",
                fontFamily:
                    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
        >
            {/* SEARCH BAR CONTAINER */}
            <motion.div
                initial={false}
                animate={{ y: showCloud ? 28 : 0 }}
                transition={{
                    type: "spring",
                    stiffness: 120,
                    damping: 20,
                    mass: 0.8,
                }}
                style={{
                    width: "100%",
                    height: "100%",
                    padding: 8,
                    borderRadius,
                    background: finalBarColor,
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    position: "relative",
                    boxShadow: finalBoxShadow,
                    border: finalBorder,
                    zIndex: 2,
                }}
            >
                {/* INPUT AREA */}
                <div
                    style={{
                        flex: 1,
                        height: "100%",
                        minWidth: 0,
                        borderRadius: borderRadius - 5,
                        background: finalInputColor,
                        display: "flex",
                        alignItems: "center",
                        padding: "0 clamp(14px, 4vw, 20px)",
                        boxShadow: finalInputShadow,
                        border: finalInputBorder,
                    }}
                >
                    {/* SEARCH ICON */}
                    <span
                        aria-hidden="true"
                        style={{
                            fontSize: 18,
                            marginRight: 10,
                            opacity: 0.58,
                        }}
                    >
                        🔍
                    </span>

                    {/* SEARCH INPUT */}
                    <input
                        id={inputId}
                        value={query}
                        placeholder={placeholder}
                        aria-label={placeholder || "Search"}
                        aria-expanded={showCloud}
                        aria-controls={showCloud ? cloudId : undefined}
                        aria-activedescendant={selectedSuggestionId}
                        role="combobox"
                        autoComplete="off"
                        onChange={(event) => setQuery(event.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => {
                            window.setTimeout(() => setIsFocused(false), 160)
                        }}
                        onKeyDown={handleKeyDown}
                        style={{
                            width: "100%",
                            minWidth: 0,
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            color: finalTextColor,
                            fontSize: "clamp(14px, 3.8vw, 16px)",
                            fontWeight: 500,
                        }}
                    />
                </div>

                {/* SEARCH BUTTON */}
                <motion.button
                    whileHover={{
                        y: -4,
                        scale: 1.05,
                        rotateX: 8,
                        boxShadow: finalInputShadow,
                    }}
                    whileTap={{
                        y: 3,
                        scale: 0.94,
                        rotateX: -6,
                        boxShadow:
                            theme === "dark"
                                ? `0 4px 12px rgba(0,0,0,0.4), inset 0 2px 8px rgba(0,0,0,0.8)`
                                : `0 4px 12px rgba(30,20,45,0.12), inset 0 2px 8px rgba(5,20,45,0.89)`,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 15,
                    }}
                    type="button"
                    aria-label={`${buttonText} for ${query || placeholder}`}
                    onClick={() => runSearch(query)}
                    style={{
                        height: "100%",
                        padding: "0 clamp(16px, 4vw, 22px)",
                        borderRadius: borderRadius - 5,
                        border:
                            theme === "dark"
                                ? "1px solid rgba(255,255,255,0.08)"
                                : "1px solid rgba(255,255,255,0.8)",
                        cursor: "pointer",
                        color: finalButtonTextColor,
                        background:
                            theme === "dark"
                                ? `linear-gradient(145deg, ${finalButtonColor}, #0D0D0D)`
                                : `linear-gradient(145deg, ${buttonColor}, #FFFFFF)`,
                        fontSize: "clamp(13px, 3.5vw, 15px)",
                        fontWeight: 700,
                        boxShadow: finalInputShadow,
                        transformStyle: "preserve-3d",
                        whiteSpace: "nowrap",
                    }}
                >
                    {buttonText}
                </motion.button>
            </motion.div>

            {/* CLOUD SUGGESTIONS */}
            <AnimatePresence>
                {showCloud && (
                    <motion.div
                        id={cloudId}
                        role="listbox"
                        aria-label="Search suggestions"
                        initial={{
                            opacity: 0,
                            y: 8,
                            scale: 0.78,
                            rotate: -1,
                            filter: "blur(10px)",
                        }}
                        animate={{
                            opacity: 1,
                            y: mobileCloudY,
                            scale: 1,
                            rotate: 0,
                            filter: "blur(0px)",
                        }}
                        exit={{
                            opacity: 0,
                            y: mobileCloudExitY,
                            scale: 0.86,
                            rotate: 1,
                            filter: "blur(8px)",
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 95,
                            damping: 18,
                            mass: 0.9,
                        }}
                        style={{
                            position: "absolute",
                            width: "min(96%, 900px)",
                            minHeight: 108,
                            padding: "20px 22px",
                            borderRadius: 34,
                            background: finalCloudColor,
                            boxShadow:
                                theme === "dark"
                                    ? `0 34px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)`
                                    : `0 34px 80px rgba(15,23,42,0.28), 0 10px 28px rgba(217,165,20,0.10), inset 0 1px 0 rgba(255,255,255,0.9)`,
                            border: finalBorder,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                            justifyContent: "center",
                            alignItems: "center",
                            zIndex: 5,
                        }}
                    >
                        {/* CLOUD CIRCLE BLOBS */}
                        <CloudBlob
                            left="12%"
                            top="-22px"
                            size={76}
                            color={finalCloudColor}
                            theme={theme}
                        />
                        <CloudBlob
                            left="34%"
                            top="-38px"
                            size={90}
                            color={finalCloudColor}
                            theme={theme}
                        />
                        <CloudBlob
                            right="28%"
                            top="-32px"
                            size={80}
                            color={finalCloudColor}
                            theme={theme}
                        />
                        <CloudBlob
                            right="10%"
                            top="-18px"
                            size={74}
                            color={finalCloudColor}
                            theme={theme}
                        />

                        {/* CLOUD TITLE */}
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08 }}
                            style={{
                                width: "100%",
                                textAlign: "center",
                                fontSize: 12,
                                fontWeight: 800,
                                color: accentColor,
                                letterSpacing: 0.5,
                                textTransform: "uppercase",
                                marginBottom: 2,
                            }}
                        >
                            {isLoading ? "Searching..." : "Similar ideas"}
                        </motion.div>

                        {/* EMPTY STATE */}
                        {visibleSuggestions.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    color: finalMutedColor,
                                    fontSize: 13,
                                    fontWeight: 700,
                                    opacity: 0.78,
                                    padding: "8px 12px",
                                }}
                            >
                                No matching suggestions
                            </motion.div>
                        )}

                        {/* SUGGESTION PILLS */}
                        {visibleSuggestions.map((item, index) => {
                            const isSelected = index === selectedIndex

                            return (
                                <motion.button
                                    key={`${item}-${index}`}
                                    id={`${cloudId}-suggestion-${index}`}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    aria-label={`Search for ${item}`}
                                    initial={{
                                        opacity: 0,
                                        y: 10,
                                        scale: 0.96,
                                    }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: index * 0.045 }}
                                    whileHover={{ y: -2, scale: 1.03 }}
                                    whileTap={{ scale: 0.98 }}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    onMouseDown={() => {
                                        setQuery(item)
                                        runSearch(item)
                                    }}
                                    style={{
                                        border: isSelected
                                            ? "1px solid rgba(217,165,20,0.68)"
                                            : "1px solid rgba(217,165,20,0.22)",
                                        background: isSelected
                                            ? "rgba(217,165,20,0.12)"
                                            : finalPillBackground,
                                        color: finalMutedColor,
                                        borderRadius: 999,
                                        padding: "8px 12px",
                                        fontSize: 13,
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        boxShadow: isSelected
                                            ? "0 8px 18px rgba(217,165,20,0.18)"
                                            : "0 5px 12px rgba(15,23,42,0.05)",
                                    }}
                                >
                                    {item}
                                </motion.button>
                            )
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function CloudBlob({
    size,
    color,
    top,
    left,
    right,
    theme,
}: {
    size: number
    color: string
    top: string
    left?: string
    right?: string
    theme?: Theme
}) {
    return (
        <div
            style={{
                position: "absolute",
                width: size,
                height: size,
                borderRadius: "50%",
                background: color,
                top,
                left,
                right,
                boxShadow:
                    theme === "dark"
                        ? "inset 0 1px 0 rgba(255,255,255,0.05)"
                        : "inset 0 1px 0 rgba(255,255,255,0.9)",
                zIndex: -1,
            }}
        />
    )
}

addPropertyControls(CloudSearchBar, {
    width: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 860,
        min: 320,
        max: 1600,
        step: 1,
    },
    height: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 76,
        min: 40,
        max: 120,
        step: 1,
    },
    placeholder: {
        type: ControlType.String,
        title: "Placeholder",
        defaultValue: "Search components...",
    },
    buttonText: {
        type: ControlType.String,
        title: "Button Text",
        defaultValue: "Search",
    },
    suggestions: {
        type: ControlType.String,
        title: "Suggestions",
        defaultValue: DEFAULT_SUGGESTIONS.join(", "),
        displayTextArea: true,
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        defaultValue: "light",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
    },
    apiUrl: {
        type: ControlType.String,
        title: "API URL",
        defaultValue: "",
        placeholder: "https://example.com/suggestions",
    },
    searchUrl: {
        type: ControlType.String,
        title: "Search URL",
        defaultValue: "",
        placeholder: "https://example.com/search",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (props) => !props.searchUrl,
    },
    onSearch: {
        type: ControlType.EventHandler,
        title: "On Search",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Bar BG",
        defaultValue: "#D9A514",
    },
    inputColor: {
        type: ControlType.Color,
        title: "Input BG",
        defaultValue: "#FFFFFF",
    },
    cloudColor: {
        type: ControlType.Color,
        title: "Cloud",
        defaultValue: "#FFFFFF",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button",
        defaultValue: "#F4F4F4",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#D9A514",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#6F6F6F",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 28,
        min: 10,
        max: 60,
        step: 1,
    },
})
