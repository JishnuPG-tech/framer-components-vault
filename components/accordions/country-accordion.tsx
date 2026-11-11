import React, {
    useState,
    useEffect,
    useRef,
    useMemo,
    startTransition,
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


// ─── Inline icon ────────────────────────────────────────────────────

function ArrowRightIcon({
    size = 14,
    color = "currentColor",
}: {
    size?: number
    color?: string
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    )
}

// ─── Country pill ───────────────────────────────────────────────────

function CountryPill({
    country,
    pillBackground,
    pillRadius,
    borderColor,
    countryFont,
    mutedColor,
    foregroundColor,
}: any) {
    const [hover, setHover] = useState(false)
    const code = (country?.code || "").toLowerCase()
    return (
        <li
            onMouseEnter={() => startTransition(() => setHover(true))}
            onMouseLeave={() => startTransition(() => setHover(false))}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 8px",
                borderRadius: pillRadius,
                background: pillBackground,
                border: `1px solid ${hover ? borderColor : "transparent"}`,
                listStyle: "none",
                transition:
                    "border-color 0.2s ease, background 0.2s ease, color 0.2s ease",
                minWidth: 0,
            }}
        >
            <div
                style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    overflow: "hidden",
                    flexShrink: 0,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                    background: "#f0f0f0",
                }}
            >
                {code && (
                    <img
                        src={`https://flagcdn.com/${code}.svg`}
                        alt={country.name || ""}
                        loading="lazy"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                )}
            </div>
            <span
                style={{
                    ...countryFont,
                    color: hover ? foregroundColor : mutedColor,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    transition: "color 0.2s ease",
                    minWidth: 0,
                }}
            >
                {country?.name}
            </span>
        </li>
    )
}

// ─── Region row ─────────────────────────────────────────────────────

function RegionRow({
    region,
    isOpen,
    onToggle,
    visibleCount,
    columnsPerRow,
    isMobile,
    borderColor,
    mutedColor,
    foregroundColor,
    pillBackground,
    pillRadius,
    regionLabelFont,
    countryFont,
}: any) {
    const countries = region?.countries || []
    const visible = countries.slice(0, visibleCount)
    const hidden = countries.slice(visibleCount)
    const hasMore = hidden.length > 0

    const effectiveCols = isMobile ? Math.min(2, columnsPerRow) : columnsPerRow

    const gridStyle = {
        display: "grid",
        gridTemplateColumns: `repeat(${effectiveCols}, minmax(0, 1fr))`,
        gap: 8,
        margin: 0,
        padding: 0,
        listStyle: "none",
    } as const

    const label = (
        <div
            style={{
                ...regionLabelFont,
                color: mutedColor,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
            }}
        >
            {region?.label}
        </div>
    )

    const toggleButton = hasMore && (
        <button
            onClick={onToggle}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: isOpen ? foregroundColor : mutedColor,
                fontSize: 12,
                fontWeight: 500,
                padding: 0,
                transition: "color 0.2s ease",
            }}
        >
            <span>{isOpen ? "Show less" : "Show all"}</span>
            <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                style={{
                    fontSize: 16,
                    lineHeight: 1,
                    display: "inline-block",
                }}
            >
                +
            </motion.span>
        </button>
    )

    return (
        <div
            style={{
                padding: isMobile ? "16px 20px" : "20px 24px",
                background: isOpen ? "rgba(0,0,0,0.025)" : "transparent",
                transition: "background 0.2s ease",
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? 12 : 40,
                alignItems: isMobile ? "stretch" : "flex-start",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: isMobile ? "100%" : 110,
                    flexShrink: 0,
                    paddingTop: isMobile ? 0 : 2,
                }}
            >
                {label}
                {isMobile && toggleButton}
            </div>

            <div style={{ flexGrow: 1, minWidth: 0 }}>
                <ul style={gridStyle}>
                    {visible.map((country: any, i: number) => (
                        <CountryPill
                            key={country?.code || i}
                            country={country}
                            pillBackground={pillBackground}
                            pillRadius={pillRadius}
                            borderColor={borderColor}
                            countryFont={countryFont}
                            mutedColor={mutedColor}
                            foregroundColor={foregroundColor}
                        />
                    ))}
                </ul>

                <AnimatePresence initial={false}>
                    {isOpen && hidden.length > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                                duration: 0.4,
                                ease: [0.4, 0, 0.2, 1],
                            }}
                            style={{ overflow: "hidden" }}
                        >
                            <ul style={{ ...gridStyle, marginTop: 8 }}>
                                {hidden.map((country: any, i: number) => (
                                    <CountryPill
                                        key={country?.code || `h-${i}`}
                                        country={country}
                                        pillBackground={pillBackground}
                                        pillRadius={pillRadius}
                                        borderColor={borderColor}
                                        countryFont={countryFont}
                                        mutedColor={mutedColor}
                                        foregroundColor={foregroundColor}
                                    />
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {!isMobile && hasMore && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        width: 90,
                        flexShrink: 0,
                        paddingTop: 2,
                    }}
                >
                    {toggleButton}
                </div>
            )}
        </div>
    )
}

// ─── CTA button ─────────────────────────────────────────────────────

function CtaButton({
    label,
    font,
    background,
    color,
    radius,
}: {
    label: string
    font: any
    background: string
    color: string
    radius: number
}) {
    const [hover, setHover] = useState(false)
    return (
        <motion.button
            onMouseEnter={() => startTransition(() => setHover(true))}
            onMouseLeave={() => startTransition(() => setHover(false))}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background,
                color,
                padding: "12px 28px",
                borderRadius: radius,
                border: "none",
                cursor: "pointer",
                ...font,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                opacity: hover ? 0.92 : 1,
                transition: "opacity 0.2s ease",
            }}
        >
            <span>{label}</span>
            <span
                style={{
                    position: "relative",
                    display: "inline-flex",
                    width: 14,
                    height: 14,
                    overflow: "hidden",
                    flexShrink: 0,
                }}
            >
                <motion.span
                    animate={{
                        x: hover ? 20 : 0,
                        opacity: hover ? 0 : 1,
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <ArrowRightIcon size={14} color={color} />
                </motion.span>
                <motion.span
                    animate={{
                        x: hover ? 0 : -20,
                        opacity: hover ? 1 : 0,
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <ArrowRightIcon size={14} color={color} />
                </motion.span>
            </span>
        </motion.button>
    )
}

// ─── Main component ─────────────────────────────────────────────────

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 1024
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CountryAccordion(props) {
    const {
        // Header
        showSubtitle = true,
        subtitle = "Global Coverage",
        subtitleFont,
        showTitle = true,
        title = "International Money Transfer",
        titleFont,
        // Data
        countries = [],
        visibleCount = 4,
        columnsPerRow = 4,
        regionLabelFont,
        countryFont,
        // Footer
        showDescription = true,
        description = "Send money to friends and family in over 200 countries and territories. Competitive rates and fast transfers with real-time tracking.",
        descriptionFont,
        showCta = true,
        ctaText = "Start Sending",
        ctaFont,
        // Colors
        background = "transparent",
        cardBackground = "#ffffff",
        borderColor = "rgba(0,0,0,0.08)",
        mutedColor = "#71717A",
        foregroundColor = "#111111",
        pillBackground = "rgba(0,0,0,0.04)",
        ctaBackground = "#111111",
        ctaTextColor = "#ffffff",
        // Radii
        cardRadius = 16,
        pillRadius = 8,
        ctaRadius = 999,
        // Layout
        maxWidth = 920,
        mobileBreakpoint = 600,
        verticalPadding = 48,
        style,
    } = props

    const [openId, setOpenId] = useState<string | null>(null)
    const [isMobile, setIsMobile] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Group flat countries by region, preserving order of first appearance.
    const regions = useMemo(() => {
        const map = new Map<string, any[]>()
        const order: string[] = []
        for (const c of countries) {
            const label = c?.region
            if (!label) continue
            if (!map.has(label)) {
                map.set(label, [])
                order.push(label)
            }
            map.get(label)!.push({ code: c.code, name: c.name })
        }
        return order.map((label) => ({
            id: label.toLowerCase().replace(/\s+/g, "-"),
            label,
            countries: map.get(label) || [],
        }))
    }, [countries])

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const ro = new ResizeObserver(([entry]) => {
            const next = entry.contentRect.width < mobileBreakpoint
            startTransition(() => setIsMobile(next))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [mobileBreakpoint])

    const toggle = (id: string) => {
        startTransition(() => setOpenId((prev) => (prev === id ? null : id)))
    }

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                background,
                width: "100%",
                padding: `${verticalPadding}px 24px`,
                boxSizing: "border-box",
                color: foregroundColor,
            }}
        >
            <div
                style={{
                    maxWidth,
                    margin: "0 auto",
                    width: "100%",
                }}
            >
                {(showSubtitle || showTitle) && (
                    <div
                        style={{
                            textAlign: "center",
                            marginBottom: 40,
                        }}
                    >
                        {showSubtitle && subtitle && (
                            <div
                                style={{
                                    ...subtitleFont,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.2em",
                                    color: mutedColor,
                                    marginBottom: 12,
                                }}
                            >
                                {subtitle}
                            </div>
                        )}
                        {showTitle && title && (
                            <h2
                                style={{
                                    ...titleFont,
                                    margin: 0,
                                    color: foregroundColor,
                                }}
                            >
                                {title}
                            </h2>
                        )}
                    </div>
                )}

                <div
                    style={{
                        borderRadius: cardRadius,
                        border: `1px solid ${borderColor}`,
                        background: cardBackground,
                        overflow: "hidden",
                    }}
                >
                    {regions.map((region: any, idx: number) => {
                        const id = region?.id || String(idx)
                        return (
                            <div
                                key={id}
                                style={{
                                    borderTop:
                                        idx === 0
                                            ? "none"
                                            : `1px solid ${borderColor}`,
                                }}
                            >
                                <RegionRow
                                    region={region}
                                    isOpen={openId === id}
                                    onToggle={() => toggle(id)}
                                    visibleCount={visibleCount}
                                    columnsPerRow={columnsPerRow}
                                    isMobile={isMobile}
                                    borderColor={borderColor}
                                    mutedColor={mutedColor}
                                    foregroundColor={foregroundColor}
                                    pillBackground={pillBackground}
                                    pillRadius={pillRadius}
                                    regionLabelFont={regionLabelFont}
                                    countryFont={countryFont}
                                />
                            </div>
                        )
                    })}
                </div>

                {(showDescription || showCta) && (
                    <div
                        style={{
                            marginTop: 32,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 24,
                        }}
                    >
                        {showDescription && description && (
                            <p
                                style={{
                                    ...descriptionFont,
                                    color: mutedColor,
                                    textAlign: "center",
                                    maxWidth: 560,
                                    margin: 0,
                                }}
                            >
                                {description}
                            </p>
                        )}
                        {showCta && (
                            <CtaButton
                                label={ctaText}
                                font={ctaFont}
                                background={ctaBackground}
                                color={ctaTextColor}
                                radius={ctaRadius}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

CountryAccordion.displayName = "Country Accordion"

// ─── Default props ──────────────────────────────────────────────────

const DEFAULT_COUNTRIES = [
    { region: "Europe", code: "de", name: "Germany" },
    { region: "Europe", code: "fr", name: "France" },
    { region: "Europe", code: "gb", name: "United Kingdom" },
    { region: "Europe", code: "it", name: "Italy" },
    { region: "Europe", code: "es", name: "Spain" },
    { region: "Europe", code: "nl", name: "Netherlands" },
    { region: "Europe", code: "be", name: "Belgium" },
    { region: "Europe", code: "ch", name: "Switzerland" },
    { region: "Africa", code: "ng", name: "Nigeria" },
    { region: "Africa", code: "za", name: "South Africa" },
    { region: "Africa", code: "eg", name: "Egypt" },
    { region: "Africa", code: "ke", name: "Kenya" },
    { region: "Africa", code: "ma", name: "Morocco" },
    { region: "Africa", code: "gh", name: "Ghana" },
    { region: "Africa", code: "et", name: "Ethiopia" },
    { region: "Africa", code: "sn", name: "Senegal" },
    { region: "Americas", code: "us", name: "United States" },
    { region: "Americas", code: "ca", name: "Canada" },
    { region: "Americas", code: "mx", name: "Mexico" },
    { region: "Americas", code: "br", name: "Brazil" },
    { region: "Americas", code: "ar", name: "Argentina" },
    { region: "Americas", code: "cl", name: "Chile" },
    { region: "Americas", code: "co", name: "Colombia" },
    { region: "Americas", code: "pe", name: "Peru" },
]

CountryAccordion.defaultProps = {
    countries: DEFAULT_COUNTRIES,
}

// ─── Property Controls ──────────────────────────────────────────────

addPropertyControls(CountryAccordion, {
    // ── Header ───────────────────────────────────────────────────
    showSubtitle: {
        type: ControlType.Boolean,
        title: "Subtitle",
        defaultValue: true,
        enabledTitle: "Visible",
        disabledTitle: "Hidden",
    },
    subtitle: {
        type: ControlType.String,
        defaultValue: "Global Coverage",
        hidden: (p) => !p.showSubtitle,
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 12,
            lineHeight: "1.4em",
        },
        hidden: (p) => !p.showSubtitle,
    },
    showTitle: {
        type: ControlType.Boolean,
        title: "Title",
        defaultValue: true,
        enabledTitle: "Visible",
        disabledTitle: "Hidden",
    },
    title: {
        type: ControlType.String,
        defaultValue: "International Money Transfer",
        displayTextArea: true,
        hidden: (p) => !p.showTitle,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 700,
            fontSize: 36,
            lineHeight: "1.1em",
            letterSpacing: "-0.02em",
        },
        hidden: (p) => !p.showTitle,
    },

    // ── Data ─────────────────────────────────────────────────────
    countries: {
        type: ControlType.Array,
        title: "Countries",
        description:
            "Flat list of countries. Each entry has a 'Region' label used to group them. Reorder, add, or delete entries — items with the same region label are grouped together (in their order of first appearance). Flag images come from flagcdn.com.",
        maxCount: 200,
        defaultValue: [
            { region: "Europe", code: "de", name: "Germany" },
            { region: "Europe", code: "fr", name: "France" },
            { region: "Europe", code: "gb", name: "United Kingdom" },
            { region: "Europe", code: "it", name: "Italy" },
            { region: "Europe", code: "es", name: "Spain" },
            { region: "Europe", code: "nl", name: "Netherlands" },
            { region: "Europe", code: "be", name: "Belgium" },
            { region: "Europe", code: "ch", name: "Switzerland" },
            { region: "Africa", code: "ng", name: "Nigeria" },
            { region: "Africa", code: "za", name: "South Africa" },
            { region: "Africa", code: "eg", name: "Egypt" },
            { region: "Africa", code: "ke", name: "Kenya" },
            { region: "Africa", code: "ma", name: "Morocco" },
            { region: "Africa", code: "gh", name: "Ghana" },
            { region: "Africa", code: "et", name: "Ethiopia" },
            { region: "Africa", code: "sn", name: "Senegal" },
            { region: "Americas", code: "us", name: "United States" },
            { region: "Americas", code: "ca", name: "Canada" },
            { region: "Americas", code: "mx", name: "Mexico" },
            { region: "Americas", code: "br", name: "Brazil" },
            { region: "Americas", code: "ar", name: "Argentina" },
            { region: "Americas", code: "cl", name: "Chile" },
            { region: "Americas", code: "co", name: "Colombia" },
            { region: "Americas", code: "pe", name: "Peru" },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                region: {
                    type: ControlType.String,
                    description:
                        "Region label — countries sharing the same label are grouped into one row.",
                    defaultValue: "Europe",
                },
                code: {
                    type: ControlType.String,
                    description:
                        "ISO 2-letter code, lowercase (fr, us, gb, jp...).",
                    defaultValue: "fr",
                },
                name: {
                    type: ControlType.String,
                    defaultValue: "France",
                },
            },
        },
    },
    visibleCount: {
        type: ControlType.Number,
        title: "Visible Items",
        description:
            "Number of countries shown before the user clicks 'Show all'.",
        min: 1,
        max: 12,
        step: 1,
        defaultValue: 4,
    },
    columnsPerRow: {
        type: ControlType.Number,
        title: "Grid Columns",
        description: "How many columns the country grid uses on desktop.",
        min: 1,
        max: 6,
        step: 1,
        defaultValue: 4,
    },
    regionLabelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 12,
            lineHeight: "1.4em",
        },
    },
    countryFont: {
        type: ControlType.Font,
        title: "Country Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 500,
            fontSize: 13,
            lineHeight: "1.4em",
        },
    },

    // ── Footer (description + CTA) ───────────────────────────────
    showDescription: {
        type: ControlType.Boolean,
        title: "Description",
        defaultValue: true,
        enabledTitle: "Visible",
        disabledTitle: "Hidden",
    },
    description: {
        type: ControlType.String,
        displayTextArea: true,
        defaultValue:
            "Send money to friends and family in over 200 countries and territories. Competitive rates and fast transfers with real-time tracking.",
        hidden: (p) => !p.showDescription,
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Desc. Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 400,
            fontSize: 14,
            lineHeight: "1.6em",
        },
        hidden: (p) => !p.showDescription,
    },
    showCta: {
        type: ControlType.Boolean,
        title: "CTA Button",
        defaultValue: true,
        enabledTitle: "Visible",
        disabledTitle: "Hidden",
    },
    ctaText: {
        type: ControlType.String,
        title: "CTA Text",
        defaultValue: "Start Sending",
        hidden: (p) => !p.showCta,
    },
    ctaFont: {
        type: ControlType.Font,
        title: "CTA Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 14,
            lineHeight: "1.4em",
        },
        hidden: (p) => !p.showCta,
    },
    ctaBackground: {
        type: ControlType.Color,
        title: "CTA BG",
        defaultValue: "#111111",
        hidden: (p) => !p.showCta,
    },
    ctaTextColor: {
        type: ControlType.Color,
        title: "CTA Text",
        defaultValue: "#ffffff",
        hidden: (p) => !p.showCta,
    },
    ctaRadius: {
        type: ControlType.Number,
        title: "CTA Radius",
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        defaultValue: 999,
        hidden: (p) => !p.showCta,
    },

    // ── Visual ───────────────────────────────────────────────────
    background: {
        type: ControlType.Color,
        defaultValue: "rgba(0,0,0,0)",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "#ffffff",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "rgba(0,0,0,0.08)",
    },
    pillBackground: {
        type: ControlType.Color,
        title: "Pill BG",
        defaultValue: "rgba(0,0,0,0.04)",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Muted Text",
        defaultValue: "#71717A",
    },
    foregroundColor: {
        type: ControlType.Color,
        title: "Foreground",
        defaultValue: "#111111",
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
        defaultValue: 16,
    },
    pillRadius: {
        type: ControlType.Number,
        title: "Pill Radius",
        min: 0,
        max: 24,
        step: 1,
        unit: "px",
        defaultValue: 8,
    },

    // ── Layout ───────────────────────────────────────────────────
    maxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        min: 320,
        max: 1600,
        step: 10,
        unit: "px",
        defaultValue: 920,
    },
    verticalPadding: {
        type: ControlType.Number,
        title: "V. Padding",
        min: 0,
        max: 200,
        step: 4,
        unit: "px",
        defaultValue: 48,
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile @",
        description:
            "Below this container width, the row layout stacks vertically.",
        min: 320,
        max: 1024,
        step: 10,
        unit: "px",
        defaultValue: 600,
    },
})
