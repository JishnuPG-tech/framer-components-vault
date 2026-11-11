// Instructions: Create a Framer component that follows the Framer component rules and achieves the user's goal. Show where previous employees of a company have gone on to work (e.g., Google, Apple, Meta) to show career prestige.

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

import { motion } from "framer-motion"

type DestinationItem = {
    company: string
    logo: { src: string; srcSet?: string; alt?: string }
    meta: string
    link: string
    industry?: string
    role?: string
    companySize?: string
}

type Props = {
    title: string
    subtitle: string
    items: DestinationItem[]

    headerGap: number
    cardContentGap: number
    cardTitleGap: number

    layout: "grid" | "row"
    columns: number
    gap: number

    showMeta: boolean
    align: "left" | "center"

    theme: "light" | "dark" | "highContrast" | "custom"
    customTheme: {
        backgroundColor: string
        borderColor: string
        textColor: string
        metaColor: string
        cardBackground: string
        cardBorderColor: string
        cardHoverBackground: string
        filterBackground: string
        filterBorderColor: string
        filterTextColor: string
        badgeBackground: string
        badgeTextColor: string
    }

    backgroundColor: string
    borderColor: string
    textColor: string
    metaColor: string

    cardBackground: string
    cardBorderColor: string
    cardHoverBackground: string

    titleFont: any
    subtitleFont: any
    companyFont: any
    metaFont: any

    radius: string
    padding: string
    backgroundPadding: string

    logoHeight: number
    cardPadding: string
    cardRadius: string

    openInNewTab: boolean

    enableFiltering: boolean
    showFilterBar: boolean
    defaultIndustryFilter: string
    defaultRoleFilter: string
    defaultCompanySizeFilter: string

    enableSearch: boolean
    showSearchBar: boolean
    defaultSearchQuery: string
    searchPlaceholder: string

    enablePagination: boolean
    itemsPerPage: number
    showPaginationControls: boolean

    filterBackground: string
    filterBorderColor: string
    filterTextColor: string
    filterRadius: string
    filterPadding: string

    enableSorting: boolean
    defaultSort: "companyAsc" | "companyDesc" | "industryAsc" | "roleAsc" | "sizeAsc"
    showSortControl: boolean

    showBadges: boolean
    badgeBackground: string
    badgeTextColor: string

    emptyStateText: string

    allowScroll: boolean

    showResultCount: boolean
    resultCountLabel: string
    showSkipToResults: boolean

    stickyControls: boolean
    stickyTop: number

    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function AlumniDestinations(props: Props) {
    const {
        title,
        subtitle,
        items,

        headerGap,
        cardContentGap,
        cardTitleGap,

        layout,
        columns,
        gap,

        showMeta,
        align,

        theme,
        customTheme,

        backgroundColor,
        borderColor,
        textColor,
        metaColor,

        cardBackground,
        cardBorderColor,
        cardHoverBackground,

        titleFont,
        subtitleFont,
        companyFont,
        metaFont,

        radius,
        padding,
        backgroundPadding,

        logoHeight,
        cardPadding,
        cardRadius,

        openInNewTab,

        enableFiltering,
        showFilterBar,
        defaultIndustryFilter,
        defaultRoleFilter,
        defaultCompanySizeFilter,

        enableSearch,
        showSearchBar,
        defaultSearchQuery,
        searchPlaceholder,

        enablePagination,
        itemsPerPage,
        showPaginationControls,

        filterBackground,
        filterBorderColor,
        filterTextColor,
        filterRadius,
        filterPadding,

        enableSorting,
        defaultSort,
        showSortControl,

        showBadges,
        badgeBackground,
        badgeTextColor,

        emptyStateText,

        allowScroll,

        showResultCount,
        resultCountLabel,
        showSkipToResults,

        stickyControls,
        stickyTop,

        style,
    } = props

    type SortKey = Props["defaultSort"]

    const [industryFilter, setIndustryFilter] = React.useState(defaultIndustryFilter || "All")
    const [roleFilter, setRoleFilter] = React.useState(defaultRoleFilter || "All")
    const [companySizeFilter, setCompanySizeFilter] = React.useState(defaultCompanySizeFilter || "All")
    const [searchQuery, setSearchQuery] = React.useState(defaultSearchQuery || "")
    const [sortKey, setSortKey] = React.useState<SortKey>(defaultSort || "companyAsc")
    const [page, setPage] = React.useState(1)

    const listId = React.useId()
    const listRef = React.useRef<HTMLDivElement>(null)
    const shouldFocusAfterPageChangeRef = React.useRef(false)

    React.useEffect(() => {
        React.startTransition(() => {
            setIndustryFilter(defaultIndustryFilter || "All")
            setRoleFilter(defaultRoleFilter || "All")
            setCompanySizeFilter(defaultCompanySizeFilter || "All")
            setSearchQuery(defaultSearchQuery || "")
            setSortKey(defaultSort || "companyAsc")
            setPage(1)
        })
    }, [defaultIndustryFilter, defaultRoleFilter, defaultCompanySizeFilter, defaultSearchQuery])

    React.useEffect(() => {
        React.startTransition(() => setPage(1))
    }, [enableFiltering, enableSearch, enableSorting, industryFilter, roleFilter, companySizeFilter, searchQuery, sortKey, itemsPerPage])

    React.useEffect(() => {
        if (!enablePagination) return
        if (!shouldFocusAfterPageChangeRef.current) return
        shouldFocusAfterPageChangeRef.current = false

        if (typeof window === "undefined") return
        const root = listRef.current
        if (!root) return

        const first = root.querySelector<HTMLElement>("[data-alumni-card='true']")
        if (first) first.focus()
    }, [enablePagination, page])

    const normalizedItems = React.useMemo(() => (items || []).filter(Boolean), [items])

    const themeTokens = React.useMemo(() => {
        const preset = theme || "light"

        const presets = {
            light: {
                backgroundColor: "#FFFFFF",
                borderColor: "#EEEEEE",
                textColor: "#000000",
                metaColor: "#666666",
                cardBackground: "#F5F5F5",
                cardBorderColor: "#EEEEEE",
                cardHoverBackground: "#FFFFFF",
                filterBackground: "#FFFFFF",
                filterBorderColor: "#EEEEEE",
                filterTextColor: "#000000",
                badgeBackground: "#FFFFFF",
                badgeTextColor: "#000000",
            },
            dark: {
                backgroundColor: "#0B0B0C",
                borderColor: "rgba(255,255,255,0.12)",
                textColor: "#FFFFFF",
                metaColor: "rgba(255,255,255,0.72)",
                cardBackground: "rgba(255,255,255,0.06)",
                cardBorderColor: "rgba(255,255,255,0.12)",
                cardHoverBackground: "rgba(255,255,255,0.10)",
                filterBackground: "rgba(255,255,255,0.04)",
                filterBorderColor: "rgba(255,255,255,0.12)",
                filterTextColor: "#FFFFFF",
                badgeBackground: "rgba(255,255,255,0.10)",
                badgeTextColor: "#FFFFFF",
            },
            highContrast: {
                backgroundColor: "#000000",
                borderColor: "#FFFFFF",
                textColor: "#FFFFFF",
                metaColor: "#FFFFFF",
                cardBackground: "#000000",
                cardBorderColor: "#FFFFFF",
                cardHoverBackground: "#111111",
                filterBackground: "#000000",
                filterBorderColor: "#FFFFFF",
                filterTextColor: "#FFFFFF",
                badgeBackground: "#FFFFFF",
                badgeTextColor: "#000000",
            },
        } as const

        const base = preset === "custom" ? presets.light : presets[preset] || presets.light

        const custom = customTheme || ({} as any)
        const resolved = {
            backgroundColor: preset === "custom" ? custom.backgroundColor || backgroundColor : backgroundColor || base.backgroundColor,
            borderColor: preset === "custom" ? custom.borderColor || borderColor : borderColor || base.borderColor,
            textColor: preset === "custom" ? custom.textColor || textColor : textColor || base.textColor,
            metaColor: preset === "custom" ? custom.metaColor || metaColor : metaColor || base.metaColor,
            cardBackground: preset === "custom" ? custom.cardBackground || cardBackground : cardBackground || base.cardBackground,
            cardBorderColor: preset === "custom" ? custom.cardBorderColor || cardBorderColor : cardBorderColor || base.cardBorderColor,
            cardHoverBackground: preset === "custom" ? custom.cardHoverBackground || cardHoverBackground : cardHoverBackground || base.cardHoverBackground,
            filterBackground: preset === "custom" ? custom.filterBackground || filterBackground : filterBackground || base.filterBackground,
            filterBorderColor: preset === "custom" ? custom.filterBorderColor || filterBorderColor : filterBorderColor || base.filterBorderColor,
            filterTextColor: preset === "custom" ? custom.filterTextColor || filterTextColor : filterTextColor || base.filterTextColor,
            badgeBackground: preset === "custom" ? custom.badgeBackground || badgeBackground : badgeBackground || base.badgeBackground,
            badgeTextColor: preset === "custom" ? custom.badgeTextColor || badgeTextColor : badgeTextColor || base.badgeTextColor,
        }

        return resolved
    }, [
        theme,
        customTheme,
        backgroundColor,
        borderColor,
        textColor,
        metaColor,
        cardBackground,
        cardBorderColor,
        cardHoverBackground,
        filterBackground,
        filterBorderColor,
        filterTextColor,
        badgeBackground,
        badgeTextColor,
    ])

    const resolvedBackgroundColor = themeTokens.backgroundColor
    const resolvedBorderColor = themeTokens.borderColor
    const resolvedTextColor = themeTokens.textColor
    const resolvedMetaColor = themeTokens.metaColor

    const resolvedCardBackground = themeTokens.cardBackground
    const resolvedCardBorderColor = themeTokens.cardBorderColor
    const resolvedCardHoverBackground = themeTokens.cardHoverBackground

    const resolvedFilterBackground = themeTokens.filterBackground
    const resolvedFilterBorderColor = themeTokens.filterBorderColor
    const resolvedFilterTextColor = themeTokens.filterTextColor

    const resolvedBadgeBackground = themeTokens.badgeBackground
    const resolvedBadgeTextColor = themeTokens.badgeTextColor

    const a11yIds = React.useMemo(() => {
        const raw = String(listId || "list")
        const safe = raw.replace(/[^a-zA-Z0-9-_]/g, "") || "list"
        return {
            resultsId: `alumni-results-${safe}`,
            resultsHeadingId: `alumni-results-heading-${safe}`,
            resultCountId: `alumni-result-count-${safe}`,
        }
    }, [listId])

    const filterOptions = React.useMemo(() => {
        const industries = new Set<string>()
        const roles = new Set<string>()
        const sizes = new Set<string>()

        for (const it of normalizedItems) {
            if (it?.industry) industries.add(String(it.industry))
            if (it?.role) roles.add(String(it.role))
            if (it?.companySize) sizes.add(String(it.companySize))
        }

        const sortAlpha = (a: string, b: string) => a.localeCompare(b)

        return {
            industries: ["All", ...Array.from(industries).sort(sortAlpha)],
            roles: ["All", ...Array.from(roles).sort(sortAlpha)],
            companySizes: ["All", ...Array.from(sizes).sort(sortAlpha)],
        }
    }, [normalizedItems])

    const filteredItems = React.useMemo(() => {
        const industry = (industryFilter || "All").trim().toLowerCase()
        const role = (roleFilter || "All").trim().toLowerCase()
        const size = (companySizeFilter || "All").trim().toLowerCase()

        const matches = (value: unknown, filter: string) => {
            if (!filter || filter === "all") return true
            const v = String(value || "").trim().toLowerCase()
            return v === filter
        }

        const q = (searchQuery || "").trim().toLowerCase()
        const matchesSearch = (it: DestinationItem) => {
            if (!enableSearch || !q) return true
            const haystack = [it?.company, it?.meta, it?.industry, it?.role, it?.companySize]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
            return haystack.includes(q)
        }

        return normalizedItems.filter((it) => {
            const passFilters = !enableFiltering
                ? true
                : matches(it?.industry, industry) && matches(it?.role, role) && matches(it?.companySize, size)
            return passFilters && matchesSearch(it)
        })
    }, [enableFiltering, enableSearch, normalizedItems, industryFilter, roleFilter, companySizeFilter, searchQuery])

    const sortedItems = React.useMemo(() => {
        if (!enableSorting) return filteredItems

        const key = sortKey || "companyAsc"
        const get = (it: DestinationItem, k: string) => String((it as any)?.[k] || "").trim().toLowerCase()
        const alpha = (a: DestinationItem, b: DestinationItem, k: string) => get(a, k).localeCompare(get(b, k))

        const next = [...filteredItems]
        if (key === "companyAsc") next.sort((a, b) => alpha(a, b, "company"))
        else if (key === "companyDesc") next.sort((a, b) => alpha(b, a, "company"))
        else if (key === "industryAsc") next.sort((a, b) => alpha(a, b, "industry") || alpha(a, b, "company"))
        else if (key === "roleAsc") next.sort((a, b) => alpha(a, b, "role") || alpha(a, b, "company"))
        else if (key === "sizeAsc") next.sort((a, b) => alpha(a, b, "companySize") || alpha(a, b, "company"))
        return next
    }, [enableSorting, filteredItems, sortKey])

    const pagination = React.useMemo(() => {
        const safePerPage = Math.max(1, Math.min(50, Math.round(itemsPerPage || 1)))
        const totalItems = sortedItems.length
        const totalPages = enablePagination ? Math.max(1, Math.ceil(totalItems / safePerPage)) : 1
        const currentPage = enablePagination ? Math.max(1, Math.min(totalPages, page || 1)) : 1
        return { safePerPage, totalItems, totalPages, currentPage }
    }, [enablePagination, sortedItems.length, itemsPerPage, page])

    const pagedItems = React.useMemo(() => {
        if (!enablePagination) return sortedItems
        const start = (pagination.currentPage - 1) * pagination.safePerPage
        return sortedItems.slice(start, start + pagination.safePerPage)
    }, [enablePagination, sortedItems, pagination.currentPage, pagination.safePerPage])

    const setPageSafe = React.useCallback(
        (next: number) => {
            shouldFocusAfterPageChangeRef.current = true
            React.startTransition(() => {
                setPage(Math.max(1, Math.min(pagination.totalPages, Math.round(next || 1))))
            })
        },
        [pagination.totalPages],
    )

    const onIndustryChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const next = e.target.value
        React.startTransition(() => setIndustryFilter(next))
    }, [])

    const onRoleChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const next = e.target.value
        React.startTransition(() => setRoleFilter(next))
    }, [])

    const onCompanySizeChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const next = e.target.value
        React.startTransition(() => setCompanySizeFilter(next))
    }, [])

    const onSearchChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value
        React.startTransition(() => setSearchQuery(next))
    }, [])

    const onSortChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const next = e.target.value as SortKey
        React.startTransition(() => setSortKey(next))
    }, [])

    const isFixedWidth = style?.width === "100%"
    const isFixedHeight = style?.height === "100%"

    const normalizedColumns = Math.max(1, Math.min(8, Math.round(columns || 1)))
    const isGrid = layout === "grid"

    const containerStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: allowScroll ? "auto" : "hidden",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        boxSizing: "border-box",
        background: resolvedBackgroundColor,
        border: `1px solid ${resolvedBorderColor}`,
        borderRadius: radius,
        padding: padding ?? backgroundPadding ?? "12px",
        color: resolvedTextColor,
        display: "flex",
        flexDirection: "column",
        gap: Math.max(8, gap),
        ...(isFixedWidth ? {} : { minWidth: "min-content" }),
        ...(isFixedHeight ? {} : { minHeight: "min-content" }),
        ...style,
    }

    const headerAlign: React.CSSProperties["alignItems"] = align === "center" ? "center" : "flex-start"
    const textAlign: React.CSSProperties["textAlign"] = align

    const listStyle: React.CSSProperties = {
        width: "100%",
        display: "grid",
        gridTemplateColumns: isGrid ? `repeat(${normalizedColumns}, minmax(0, 1fr))` : "repeat(1, minmax(0, 1fr))",
        gap,
        ...(isGrid
            ? {}
            : {
                  gridAutoFlow: "column",
                  gridAutoColumns: "minmax(180px, 1fr)",
                  gridTemplateColumns: "unset",
                  overflowX: "auto",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  paddingBottom: 2,
                  WebkitOverflowScrolling: "touch",
              }),
    }

    return (
        <section style={containerStyle} aria-label="Alumni destinations" data-alumni-root={a11yIds.resultsId}>
            <style>{`
                [data-alumni-root="${a11yIds.resultsId}"]::-webkit-scrollbar { width: 0px; height: 0px; display: none; }
                [data-alumni-root="${a11yIds.resultsId}"] *::-webkit-scrollbar { width: 0px; height: 0px; display: none; }
            `}</style>
            <header
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: Math.max(0, headerGap),
                    alignItems: headerAlign,
                }}
            >
                <div
                    style={{
                        ...titleFont,
                        color: resolvedTextColor,
                        textAlign,
                        width: "100%",
                        maxWidth: "100%",
                        whiteSpace: "normal",
                        overflowWrap: "anywhere",
                    }}
                >
                    {title}
                </div>
                {subtitle ? (
                    <div
                        style={{
                            ...subtitleFont,
                            color: resolvedMetaColor,
                            textAlign,
                            width: "100%",
                            maxWidth: "100%",
                            whiteSpace: "normal",
                            overflowWrap: "anywhere",
                        }}
                    >
                        {subtitle}
                    </div>
                ) : null}
            </header>

            {showSkipToResults && (
                <a
                    href={`#${a11yIds.resultsId}`}
                    style={{
                        position: "absolute",
                        left: 12,
                        top: 12,
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: `1px solid ${resolvedBorderColor}`,
                        background: resolvedBackgroundColor,
                        color: resolvedTextColor,
                        textDecoration: "none",
                        transform: "translateY(-140%)",
                        transition: "transform 120ms ease",
                        outline: "none",
                        zIndex: 10,
                    }}
                    onFocus={(e) => {
                        ;(e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)"
                    }}
                    onBlur={(e) => {
                        ;(e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-140%)"
                    }}
                >
                    Skip to results
                </a>
            )}

            {(showFilterBar || showSearchBar || showSortControl) && (enableFiltering || enableSearch || enableSorting) && (
                <div
                    style={{
                        width: "100%",
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: align === "center" ? "center" : "flex-start",
                        background: resolvedFilterBackground,
                        border: `1px solid ${resolvedFilterBorderColor}`,
                        borderRadius: filterRadius,
                        padding: filterPadding,
                        boxSizing: "border-box",
                        position: stickyControls ? ("sticky" as const) : undefined,
                        top: stickyControls ? Math.max(0, stickyTop || 0) : undefined,
                        zIndex: stickyControls ? 5 : undefined,
                        backdropFilter: stickyControls ? "blur(8px)" : undefined,
                    }}
                    role="group"
                    aria-label="Filter alumni destinations"
                >
                    {enableSorting && showSortControl && (
                        <select
                            value={sortKey}
                            onChange={onSortChange}
                            aria-label="Sort results"
                            style={{
                                appearance: "none",
                                WebkitAppearance: "none",
                                MozAppearance: "none",
                                background: "transparent",
                                color: resolvedFilterTextColor,
                                border: `1px solid ${resolvedFilterBorderColor}`,
                                borderRadius: 10,
                                padding: "8px 10px",
                                fontSize: 14,
                                lineHeight: "1em",
                                outline: "none",
                            }}
                        >
                            <option value="companyAsc">Company (A–Z)</option>
                            <option value="companyDesc">Company (Z–A)</option>
                            <option value="industryAsc">Industry</option>
                            <option value="roleAsc">Role</option>
                            <option value="sizeAsc">Company size</option>
                        </select>
                    )}

                    {enableFiltering && (
                        <select
                            value={industryFilter}
                            onChange={onIndustryChange}
                            aria-label="Filter by industry"
                            style={{
                                appearance: "none",
                                WebkitAppearance: "none",
                                MozAppearance: "none",
                                background: "transparent",
                                color: resolvedFilterTextColor,
                                border: `1px solid ${resolvedFilterBorderColor}`,
                                borderRadius: 10,
                                padding: "8px 10px",
                                fontSize: 14,
                                lineHeight: "1em",
                                outline: "none",
                            }}
                        >
                            {filterOptions.industries.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt || "(Empty)"}
                                </option>
                            ))}
                        </select>
                    )}

                    {enableFiltering && (
                        <select
                            value={roleFilter}
                            onChange={onRoleChange}
                            aria-label="Filter by role"
                            style={{
                                appearance: "none",
                                WebkitAppearance: "none",
                                MozAppearance: "none",
                                background: "transparent",
                                color: resolvedFilterTextColor,
                                border: `1px solid ${resolvedFilterBorderColor}`,
                                borderRadius: 10,
                                padding: "8px 10px",
                                fontSize: 14,
                                lineHeight: "1em",
                                outline: "none",
                            }}
                        >
                            {filterOptions.roles.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt || "(Empty)"}
                                </option>
                            ))}
                        </select>
                    )}

                    {enableFiltering && (
                        <select
                            value={companySizeFilter}
                            onChange={onCompanySizeChange}
                            aria-label="Filter by company size"
                            style={{
                                appearance: "none",
                                WebkitAppearance: "none",
                                MozAppearance: "none",
                                background: "transparent",
                                color: resolvedFilterTextColor,
                                border: `1px solid ${resolvedFilterBorderColor}`,
                                borderRadius: 10,
                                padding: "8px 10px",
                                fontSize: 14,
                                lineHeight: "1em",
                                outline: "none",
                            }}
                        >
                            {filterOptions.companySizes.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt || "(Empty)"}
                                </option>
                            ))}
                        </select>
                    )}

                    {enableSearch && showSearchBar && (
                        <input
                            value={searchQuery}
                            onChange={onSearchChange}
                            aria-label="Search companies or roles"
                            aria-controls={listId}
                            placeholder={searchPlaceholder}
                            style={{
                                background: "transparent",
                                color: resolvedFilterTextColor,
                                border: `1px solid ${resolvedFilterBorderColor}`,
                                borderRadius: 10,
                                padding: "8px 10px",
                                fontSize: 14,
                                lineHeight: "1em",
                                outline: "none",
                                minWidth: 180,
                                flex: "1 1 220px",
                            }}
                        />
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            React.startTransition(() => {
                                setIndustryFilter("All")
                                setRoleFilter("All")
                                setCompanySizeFilter("All")
                                setSearchQuery("")
                                setSortKey(defaultSort || "companyAsc")
                                setPage(1)
                            })
                        }}
                        aria-label="Clear filters and search"
                        style={{
                            background: "transparent",
                            color: resolvedFilterTextColor,
                            border: `1px solid ${resolvedFilterBorderColor}`,
                            borderRadius: 10,
                            padding: "8px 10px",
                            fontSize: 14,
                            lineHeight: "1em",
                            cursor: "pointer",
                            outline: "none",
                        }}
                    >
                        Clear
                    </button>
                </div>
            )}

            {showResultCount && (enableFiltering || enableSearch || enableSorting || enablePagination) && (
                <div
                    id={a11yIds.resultCountId}
                    aria-live="polite"
                    style={{
                        color: resolvedMetaColor,
                        fontSize: 14,
                        lineHeight: "1em",
                        whiteSpace: "nowrap",
                        textAlign,
                    }}
                >
                    {(resultCountLabel || "Results") + `: ${pagination.totalItems}`}
                </div>
            )}

            {pagedItems.length === 0 ? (
                <div
                    aria-label="No results"
                    style={{
                        width: "100%",
                        padding: "10px 0",
                        color: resolvedMetaColor,
                        fontSize: 14,
                        lineHeight: "1.3em",
                        textAlign,
                    }}
                >
                    {emptyStateText || "No matching alumni destinations."}
                </div>
            ) : (
                <div
                    id={a11yIds.resultsId}
                    aria-labelledby={a11yIds.resultsHeadingId}
                    style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                    }}
                >
                    <div
                        id={a11yIds.resultsHeadingId}
                        style={{
                            position: "absolute",
                            width: 1,
                            height: 1,
                            padding: 0,
                            margin: -1,
                            overflow: "hidden",
                            clip: "rect(0, 0, 0, 0)",
                            whiteSpace: "nowrap",
                            border: 0,
                        }}
                    >
                        Alumni destinations results
                    </div>

                    <div
                        ref={listRef}
                        id={listId}
                        style={listStyle}
                        role="list"
                        aria-label="Companies alumni joined"
                        onKeyDown={(e) => {
                            const key = e.key
                            if (key !== "ArrowRight" && key !== "ArrowLeft" && key !== "ArrowDown" && key !== "ArrowUp" && key !== "Home" && key !== "End") {
                                return
                            }
                            const root = listRef.current
                            if (!root) return

                            const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-alumni-card='true']"))
                            if (cards.length === 0) return

                            const active = (typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null) || null
                            let idx = Math.max(0, cards.findIndex((el) => el === active))

                            if (key === "Home") idx = 0
                            else if (key === "End") idx = cards.length - 1
                            else if (key === "ArrowRight" || key === "ArrowDown") idx = Math.min(cards.length - 1, idx + 1)
                            else if (key === "ArrowLeft" || key === "ArrowUp") idx = Math.max(0, idx - 1)

                            e.preventDefault()
                            cards[idx]?.focus()
                        }}
                    >
                        {pagedItems.map((item, idx) => {
                            const company = item?.company ?? ""
                            const meta = item?.meta ?? ""
                            const link = item?.link ?? "#"
                            const logo = item?.logo

                            const hasLink = Boolean(link && link !== "#")
                            const Tag: any = hasLink ? motion.a : motion.div

                            return (
                                <Tag
                                    key={`${company}-${idx}`}
                                    href={hasLink ? link : undefined}
                                    target={hasLink && openInNewTab ? "_blank" : undefined}
                                    rel={hasLink && openInNewTab ? "noopener noreferrer" : undefined}
                                    role="listitem"
                                    aria-label={company ? `Alumni joined ${company}` : "Alumni destination"}
                                    tabIndex={0}
                                    data-alumni-card="true"
                                    onKeyDown={(e: React.KeyboardEvent) => {
                                        if (!hasLink) return
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault()
                                            if (typeof window !== "undefined") {
                                                if (openInNewTab) window.open(link, "_blank", "noopener,noreferrer")
                                                else window.location.href = link
                                            }
                                        }
                                    }}
                                    style={{
                                        position: "relative",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        gap: Math.max(0, cardContentGap),
                                        padding: cardPadding,
                                        borderRadius: cardRadius,
                                        border: `1px solid ${resolvedCardBorderColor}`,
                                        background: resolvedCardBackground,
                                        textDecoration: "none",
                                        color: "inherit",
                                        minWidth: isGrid ? 0 : 180,
                                        boxSizing: "border-box",
                                        cursor: hasLink ? "pointer" : "default",
                                        outline: "none",
                                    }}
                                    whileHover={
                                        hasLink
                                            ? {
                                                  backgroundColor: resolvedCardHoverBackground,
                                                  y: -2,
                                              }
                                            : undefined
                                    }
                                    whileTap={hasLink ? { y: 0, scale: 0.99 } : undefined}
                                    transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.7 }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "100%",
                                            height: Math.max(24, logoHeight),
                                            overflow: "hidden",
                                        }}
                                    >
                                        {logo?.src ? (
                                            <img
                                                src={logo.src}
                                                srcSet={logo.srcSet}
                                                alt={logo.alt ?? `${company} logo`}
                                                style={{
                                                    height: Math.max(24, logoHeight),
                                                    width: "100%",
                                                    objectFit: "contain",
                                                    display: "block",
                                                }}
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        ) : (
                                            <div
                                                aria-hidden="true"
                                                style={{
                                                    height: Math.max(24, logoHeight),
                                                    width: "100%",
                                                    borderRadius: 8,
                                                    background: "rgba(0,0,0,0.06)",
                                                }}
                                            />
                                        )}
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: Math.max(0, cardTitleGap),
                                        }}
                                    >
                                        <div
                                            style={{
                                                ...companyFont,
                                                color: resolvedTextColor,
                                                width: "100%",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                            title={company}
                                        >
                                            {company}
                                        </div>

                                        {showBadges && (item?.industry || item?.role || item?.companySize) ? (
                                            <div
                                                aria-label="Tags"
                                                style={{
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    gap: 6,
                                                }}
                                            >
                                                {[item?.industry, item?.role, item?.companySize]
                                                    .filter(Boolean)
                                                    .slice(0, 3)
                                                    .map((t, i) => (
                                                        <span
                                                            key={`${t}-${i}`}
                                                            style={{
                                                                background: resolvedBadgeBackground,
                                                                color: resolvedBadgeTextColor,
                                                                border: `1px solid ${resolvedCardBorderColor}`,
                                                                borderRadius: 999,
                                                                padding: "4px 8px",
                                                                fontSize: 12,
                                                                lineHeight: "1em",
                                                                whiteSpace: "nowrap",
                                                            }}
                                                        >
                                                            {String(t)}
                                                        </span>
                                                    ))}
                                            </div>
                                        ) : null}

                                        {showMeta && meta ? (
                                            <div
                                                style={{
                                                    ...metaFont,
                                                    color: resolvedMetaColor,
                                                    width: "100%",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                                title={meta}
                                            >
                                                {meta}
                                            </div>
                                        ) : null}
                                    </div>
                                </Tag>
                            )
                        })}
                    </div>
                </div>
            )}

            {enablePagination && showPaginationControls && pagination.totalPages > 1 && (
                <nav
                    aria-label="Pagination"
                    style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: align === "center" ? "center" : "space-between",
                        gap: 10,
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        type="button"
                        onClick={() => setPageSafe(pagination.currentPage - 1)}
                        disabled={pagination.currentPage <= 1}
                        aria-label="Previous page"
                        style={{
                            background: "transparent",
                            color: resolvedFilterTextColor,
                            border: `1px solid ${resolvedFilterBorderColor}`,
                            borderRadius: 10,
                            padding: "8px 10px",
                            fontSize: 14,
                            lineHeight: "1em",
                            cursor: pagination.currentPage <= 1 ? "not-allowed" : "pointer",
                            opacity: pagination.currentPage <= 1 ? 0.5 : 1,
                        }}
                    >
                        Prev
                    </button>

                    <div
                        aria-label="Page status"
                        style={{
                            color: resolvedMetaColor,
                            fontSize: 14,
                            lineHeight: "1em",
                            whiteSpace: "nowrap",
                        }}
                    >
                        Page {pagination.currentPage} of {pagination.totalPages}
                    </div>

                    <button
                        type="button"
                        onClick={() => setPageSafe(pagination.currentPage + 1)}
                        disabled={pagination.currentPage >= pagination.totalPages}
                        aria-label="Next page"
                        style={{
                            background: "transparent",
                            color: resolvedFilterTextColor,
                            border: `1px solid ${resolvedFilterBorderColor}`,
                            borderRadius: 10,
                            padding: "8px 10px",
                            fontSize: 14,
                            lineHeight: "1em",
                            cursor: pagination.currentPage >= pagination.totalPages ? "not-allowed" : "pointer",
                            opacity: pagination.currentPage >= pagination.totalPages ? 0.5 : 1,
                        }}
                    >
                        Next
                    </button>
                </nav>
            )}
        </section>
    )
}

addPropertyControls(AlumniDestinations, {
    // Content
    title: {
        type: ControlType.String,
        title: "Main Title",
        defaultValue: "Where our alumni work",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle Text",
        defaultValue: "A signal of career outcomes and company prestige.",
    },

    // Data
    items: {
        type: ControlType.Array,
        title: "Destinations",
        maxCount: 24,
        defaultValue: [
            { company: "Google", meta: "Engineering · Product", link: "https://google.com", industry: "Tech", role: "Engineering", companySize: "Large" },
            { company: "Apple", meta: "Design · Hardware", link: "https://apple.com", industry: "Tech", role: "Design", companySize: "Large" },
            { company: "Meta", meta: "Growth · Data", link: "https://meta.com", industry: "Tech", role: "Growth", companySize: "Large" },
            { company: "Netflix", meta: "Platform · Security", link: "https://netflix.com", industry: "Media", role: "Engineering", companySize: "Large" },
            { company: "Stripe", meta: "Payments · Infra", link: "https://stripe.com", industry: "Fintech", role: "Engineering", companySize: "Large" },
            { company: "OpenAI", meta: "AI · Research", link: "https://openai.com", industry: "AI", role: "Research", companySize: "Medium" },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                company: { type: ControlType.String, title: "Company", defaultValue: "Google" },
                meta: { type: ControlType.String, title: "Meta", defaultValue: "Engineering · Product" },
                industry: { type: ControlType.String, title: "Industry", defaultValue: "Tech" },
                role: { type: ControlType.String, title: "Role", defaultValue: "Engineering" },
                companySize: { type: ControlType.String, title: "Company Size", defaultValue: "Large" },
                link: { type: ControlType.Link, title: "Link", defaultValue: "https://google.com" },
                logo: { type: ControlType.ResponsiveImage, title: "Logo" },
            },
        },
    },

    // Layout
    backgroundPadding: {
        type: ControlType.Padding,
        title: "Background Padding",
        defaultValue: "20px",
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["grid", "row"],
        optionTitles: ["Grid", "Row (scroll)"],
        defaultValue: "grid",
        displaySegmentedControl: true,
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 3,
        min: 1,
        max: 8,
        step: 1,
        hidden: (p) => p.layout !== "grid",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 12,
        min: 6,
        max: 40,
        step: 1,
    },

    // Spacing
    headerGap: {
        type: ControlType.Number,
        title: "Header Gap",
        defaultValue: 6,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    cardContentGap: {
        type: ControlType.Number,
        title: "Card Gap",
        defaultValue: 10,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    cardTitleGap: {
        type: ControlType.Number,
        title: "Title Gap",
        defaultValue: 4,
        min: 0,
        max: 24,
        step: 1,
        unit: "px",
    },

    // Cards
    showMeta: {
        type: ControlType.Boolean,
        title: "Show Meta",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center"],
        optionTitles: ["Left", "Center"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    logoHeight: {
        type: ControlType.Number,
        title: "Logo Height",
        defaultValue: 34,
        min: 20,
        max: 80,
        step: 1,
        unit: "px",
    },
    cardPadding: {
        type: ControlType.Padding,
        title: "Card Padding",
        defaultValue: "12px",
    },
    cardRadius: {
        type: ControlType.BorderRadius,
        title: "Card Radius",
        defaultValue: "12px",
    },
    showBadges: {
        type: ControlType.Boolean,
        title: "Badges",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    badgeBackground: {
        type: ControlType.Color,
        title: "Badge Bg",
        defaultValue: "#FFFFFF",
        hidden: (p) => !p.showBadges,
    },
    badgeTextColor: {
        type: ControlType.Color,
        title: "Badge Text",
        defaultValue: "#000000",
        hidden: (p) => !p.showBadges,
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "Open Link",
        defaultValue: true,
        enabledTitle: "New Tab",
        disabledTitle: "Same Tab",
    },

    // Typography
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            variant: "Semibold",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    companyFont: {
        type: ControlType.Font,
        title: "Company Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    metaFont: {
        type: ControlType.Font,
        title: "Meta Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },

    // Theme
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["light", "dark", "highContrast", "custom"],
        optionTitles: ["Light", "Dark", "High Contrast", "Custom"],
        defaultValue: "light",
    },
    customTheme: {
        type: ControlType.Object,
        title: "Custom Theme",
        icon: "color",
        hidden: (p) => p.theme !== "custom",
        controls: {
            backgroundColor: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
            borderColor: { type: ControlType.Color, title: "Border", defaultValue: "#EEEEEE" },
            textColor: { type: ControlType.Color, title: "Text", defaultValue: "#000000" },
            metaColor: { type: ControlType.Color, title: "Meta", defaultValue: "#CCCCCC" },
            cardBackground: { type: ControlType.Color, title: "Card Bg", defaultValue: "#F5F5F5" },
            cardBorderColor: { type: ControlType.Color, title: "Card Border", defaultValue: "#EEEEEE" },
            cardHoverBackground: { type: ControlType.Color, title: "Card Hover", defaultValue: "#FFFFFF" },
            filterBackground: { type: ControlType.Color, title: "Controls Bg", defaultValue: "#FFFFFF" },
            filterBorderColor: { type: ControlType.Color, title: "Controls Border", defaultValue: "#EEEEEE" },
            filterTextColor: { type: ControlType.Color, title: "Controls Text", defaultValue: "#000000" },
            badgeBackground: { type: ControlType.Color, title: "Badge Bg", defaultValue: "#FFFFFF" },
            badgeTextColor: { type: ControlType.Color, title: "Badge Text", defaultValue: "#000000" },
        },
        defaultValue: {
            backgroundColor: "#FFFFFF",
            borderColor: "#EEEEEE",
            textColor: "#000000",
            metaColor: "#CCCCCC",
            cardBackground: "#F5F5F5",
            cardBorderColor: "#EEEEEE",
            cardHoverBackground: "#FFFFFF",
            filterBackground: "#FFFFFF",
            filterBorderColor: "#EEEEEE",
            filterTextColor: "#000000",
            badgeBackground: "#FFFFFF",
            badgeTextColor: "#000000",
        },
    },

    // Color overrides (optional, applies on top of presets)
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#EEEEEE",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#000000",
    },
    metaColor: {
        type: ControlType.Color,
        title: "Meta",
        defaultValue: "#CCCCCC",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Bg",
        defaultValue: "#F5F5F5",
    },
    cardBorderColor: {
        type: ControlType.Color,
        title: "Card Border",
        defaultValue: "#EEEEEE",
    },
    cardHoverBackground: {
        type: ControlType.Color,
        title: "Card Hover",
        defaultValue: "#FFFFFF",
    },

    // Controls (Filter / Search / Sort)
    enableSorting: {
        type: ControlType.Boolean,
        title: "Sorting",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showSortControl: {
        type: ControlType.Boolean,
        title: "Sort UI",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (p) => !p.enableSorting,
    },
    defaultSort: {
        type: ControlType.Enum,
        title: "Default Sort",
        options: ["companyAsc", "companyDesc", "industryAsc", "roleAsc", "sizeAsc"],
        optionTitles: ["Company (A–Z)", "Company (Z–A)", "Industry", "Role", "Company size"],
        defaultValue: "companyAsc",
        hidden: (p) => !p.enableSorting,
    },

    enableFiltering: {
        type: ControlType.Boolean,
        title: "Filtering",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showFilterBar: {
        type: ControlType.Boolean,
        title: "Filter UI",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (p) => !p.enableFiltering,
    },
    defaultIndustryFilter: {
        type: ControlType.String,
        title: "Default Industry",
        defaultValue: "All",
        hidden: (p) => !p.enableFiltering,
    },
    defaultRoleFilter: {
        type: ControlType.String,
        title: "Default Role",
        defaultValue: "All",
        hidden: (p) => !p.enableFiltering,
    },
    defaultCompanySizeFilter: {
        type: ControlType.String,
        title: "Default Size",
        defaultValue: "All",
        hidden: (p) => !p.enableFiltering,
    },

    enableSearch: {
        type: ControlType.Boolean,
        title: "Search",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showSearchBar: {
        type: ControlType.Boolean,
        title: "Search UI",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (p) => !p.enableSearch,
    },
    defaultSearchQuery: {
        type: ControlType.String,
        title: "Default Search",
        defaultValue: "",
        hidden: (p) => !p.enableSearch,
    },
    searchPlaceholder: {
        type: ControlType.String,
        title: "Placeholder",
        defaultValue: "Search companies or roles…",
        hidden: (p) => !p.enableSearch || !p.showSearchBar,
    },

    // Controls styling
    filterBackground: {
        type: ControlType.Color,
        title: "Controls Bg",
        defaultValue: "#FFFFFF",
        hidden: (p) => (!p.enableFiltering || !p.showFilterBar) && (!p.enableSearch || !p.showSearchBar) && (!p.enableSorting || !p.showSortControl),
    },
    filterBorderColor: {
        type: ControlType.Color,
        title: "Controls Border",
        defaultValue: "#EEEEEE",
        hidden: (p) => (!p.enableFiltering || !p.showFilterBar) && (!p.enableSearch || !p.showSearchBar) && (!p.enableSorting || !p.showSortControl),
    },
    filterTextColor: {
        type: ControlType.Color,
        title: "Controls Text",
        defaultValue: "#000000",
        hidden: (p) => (!p.enableFiltering || !p.showFilterBar) && (!p.enableSearch || !p.showSearchBar) && (!p.enableSorting || !p.showSortControl),
    },
    filterRadius: {
        type: ControlType.BorderRadius,
        title: "Controls Radius",
        defaultValue: "12px",
        hidden: (p) => (!p.enableFiltering || !p.showFilterBar) && (!p.enableSearch || !p.showSearchBar) && (!p.enableSorting || !p.showSortControl),
    },
    filterPadding: {
        type: ControlType.Padding,
        title: "Controls Padding",
        defaultValue: "10px",
        hidden: (p) => (!p.enableFiltering || !p.showFilterBar) && (!p.enableSearch || !p.showSearchBar) && (!p.enableSorting || !p.showSortControl),
    },

    // Pagination
    enablePagination: {
        type: ControlType.Boolean,
        title: "Pagination",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    itemsPerPage: {
        type: ControlType.Number,
        title: "Per Page",
        defaultValue: 6,
        min: 1,
        max: 50,
        step: 1,
        hidden: (p) => !p.enablePagination,
    },
    showPaginationControls: {
        type: ControlType.Boolean,
        title: "Pager UI",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (p) => !p.enablePagination,
    },

    // Results / accessibility
    showResultCount: {
        type: ControlType.Boolean,
        title: "Result Count",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    resultCountLabel: {
        type: ControlType.String,
        title: "Count Label",
        defaultValue: "Results",
        hidden: (p) => !p.showResultCount,
    },
    showSkipToResults: {
        type: ControlType.Boolean,
        title: "Skip Link",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    // Sticky controls
    stickyControls: {
        type: ControlType.Boolean,
        title: "Sticky Controls",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    stickyTop: {
        type: ControlType.Number,
        title: "Sticky Top",
        defaultValue: 0,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        hidden: (p) => !p.stickyControls,
    },

    // Misc
    emptyStateText: {
        type: ControlType.String,
        title: "Empty Text",
        defaultValue: "No matching alumni destinations.",
        displayTextArea: false,
    },
    allowScroll: {
        type: ControlType.Boolean,
        title: "Scroll",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})