import * as React from "react"
// @ts-ignore
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type LegalLink = {
    label: string
    url: string
    openInNewTab: boolean
}

type LocaleMode = "auto" | "preset" | "custom"
type CreditPreset = "builtBy" | "madeWith" | "siteBy" | "custom"
type DisplayNamesFormatter = {
    of: (code: string) => string | undefined
}
type DisplayNamesConstructor = new (
    locales: string | string[] | undefined,
    options: { type: "region" }
) => DisplayNamesFormatter
type IntlWithDisplayNames = typeof Intl & {
    DisplayNames?: DisplayNamesConstructor
}

type FooterProps = {
    startYear: number
    companyName: string
    companyLink: boolean
    companyUrl: string
    links: LegalLink[]
    showRights: boolean
    rightsText: string
    localeMode: LocaleMode
    localePreset: string
    locale: string
    showDate: boolean
    dateStyle: "short" | "medium" | "long" | "full"
    showCountry: boolean
    countryCode: string
    countryDisplay: "name" | "code"
    showCredit: boolean
    creditPreset: CreditPreset
    creditName: string
    creditCustomText: string
    creditLink: boolean
    creditUrl: string
    creditOpenInNewTab: boolean
    creditColor: string
    creditGap: number
    separator: "dot" | "slash" | "dash" | "pipe"
    alignment: "left" | "center" | "right"
    layout: "inline" | "stacked"
    font: React.CSSProperties
    fontSize: number
    lineHeight: number
    textColor: string
    linkColor: string
    hoverLinkColor: string
    hoverInteractions: boolean
    hoverStyle: "underline" | "lift" | "pill" | "glow"
    hoverLift: number
    hoverBackgroundColor: string
    hoverShadowColor: string
    focusRingColor: string
    backgroundColor: string
    padding: number
    gap: number
    borderTop: boolean
    borderColor: string
    borderWidth: number
    style?: React.CSSProperties
}

const defaultLinks: LegalLink[] = [
    { label: "Privacy", url: "/privacy", openInNewTab: false },
    { label: "Terms", url: "/terms", openInNewTab: false },
]

const separators = {
    dot: "•",
    slash: "/",
    dash: "-",
    pipe: "|",
}

const allowedLinkProtocols = new Set(["http:", "https:", "mailto:", "tel:"])

function getResolvedLocale(
    localeMode: LocaleMode,
    locale: string,
    localePreset: string
) {
    if (localeMode === "auto") return undefined

    const sourceLocale = localeMode === "preset" ? localePreset : locale
    const trimmedLocale = sourceLocale.trim()
    return trimmedLocale.length > 0 ? trimmedLocale : undefined
}

function formatYear(year: number, locale: string | undefined) {
    try {
        return new Intl.NumberFormat(locale, {
            useGrouping: false,
            maximumFractionDigits: 0,
        }).format(year)
    } catch {
        return String(year)
    }
}

function formatDate(
    date: Date,
    locale: string | undefined,
    dateStyle: FooterProps["dateStyle"]
) {
    try {
        return new Intl.DateTimeFormat(locale, { dateStyle }).format(date)
    } catch {
        return new Intl.DateTimeFormat(undefined, { dateStyle }).format(date)
    }
}

function formatCountry(
    countryCode: string,
    locale: string | undefined,
    countryDisplay: FooterProps["countryDisplay"]
) {
    const normalizedCode = countryCode.trim().toUpperCase()
    if (!/^[A-Z]{2}$/.test(normalizedCode)) return ""
    if (countryDisplay === "code") return normalizedCode

    try {
        const DisplayNames = (Intl as IntlWithDisplayNames).DisplayNames
        if (typeof DisplayNames !== "function") return normalizedCode

        return (
            new DisplayNames(locale, { type: "region" }).of(normalizedCode) ||
            normalizedCode
        )
    } catch {
        return normalizedCode
    }
}

function normalizeYear(year: number, currentYear: number) {
    if (!Number.isFinite(year)) return currentYear

    const roundedYear = Math.round(year)
    return Math.min(roundedYear, currentYear)
}

function getSafeHref(url: string) {
    const trimmedUrl = url.trim()
    if (trimmedUrl.length === 0) return ""

    try {
        const parsedUrl = new URL(trimmedUrl, "https://framer.local")
        return allowedLinkProtocols.has(parsedUrl.protocol) ? trimmedUrl : ""
    } catch {
        return ""
    }
}

function getCreditParts(
    creditPreset: CreditPreset,
    creditName: string,
    creditCustomText: string
) {
    const trimmedName = creditName.trim()
    const trimmedCustomText = creditCustomText.trim()

    if (creditPreset === "custom") {
        return {
            prefix: "",
            label: trimmedCustomText || "Built by Acme Studio",
        }
    }

    if (creditPreset === "madeWith") {
        return {
            prefix: "Made with",
            label: trimmedName || "Framer",
        }
    }

    if (creditPreset === "siteBy") {
        return {
            prefix: "Site by",
            label: trimmedName || "Nova Labs",
        }
    }

    return {
        prefix: "Built by",
        label: trimmedName || "Acme Studio",
    }
}

function DynamicCopyrightLegalFooter(props: FooterProps) {
    const {
        startYear,
        companyName,
        companyLink,
        companyUrl,
        links,
        showRights,
        rightsText,
        localeMode,
        localePreset,
        locale,
        showDate,
        dateStyle,
        showCountry,
        countryCode,
        countryDisplay,
        showCredit,
        creditPreset,
        creditName,
        creditCustomText,
        creditLink,
        creditUrl,
        creditOpenInNewTab,
        creditColor,
        creditGap,
        separator,
        alignment,
        layout,
        font,
        fontSize,
        lineHeight,
        textColor,
        linkColor,
        hoverLinkColor,
        hoverInteractions,
        hoverStyle,
        hoverLift,
        hoverBackgroundColor,
        hoverShadowColor,
        focusRingColor,
        backgroundColor,
        padding,
        gap,
        borderTop,
        borderColor,
        borderWidth,
        style,
    } = props

    const isStatic =
        typeof useIsStaticRenderer === "function"
            ? useIsStaticRenderer()
            : false
    const [hoveredItem, setHoveredItem] = React.useState<string | null>(null)
    const [pressedItem, setPressedItem] = React.useState<string | null>(null)
    const [focusedItem, setFocusedItem] = React.useState<string | null>(null)
    const now = new Date()
    const resolvedLocale = getResolvedLocale(localeMode, locale, localePreset)
    const currentYear = now.getFullYear()
    const safeStartYear = normalizeYear(startYear, currentYear)
    const displayedYear =
        safeStartYear < currentYear
            ? `${formatYear(safeStartYear, resolvedLocale)}–${formatYear(currentYear, resolvedLocale)}`
            : formatYear(currentYear, resolvedLocale)
    const cleanLinks = Array.isArray(links)
        ? links
              .map((link) => ({
                  ...link,
                  label:
                      typeof link.label === "string" ? link.label.trim() : "",
                  url:
                      typeof link.url === "string" ? getSafeHref(link.url) : "",
              }))
              .filter((link) => link.label.length > 0 && link.url.length > 0)
        : []
    const separatorMark = separators[separator]
    const showStacked = layout === "stacked"
    const justifyContent =
        alignment === "left"
            ? "flex-start"
            : alignment === "right"
              ? "flex-end"
              : "center"
    const stackedAlignItems = justifyContent
    const textAlign = alignment
    const formattedDate = showDate
        ? formatDate(now, resolvedLocale, dateStyle)
        : ""
    const formattedCountry = showCountry
        ? formatCountry(countryCode, resolvedLocale, countryDisplay)
        : ""
    const canAnimate = hoverInteractions && !isStatic
    const companyLabel = companyName.trim() || "Company"
    const safeCompanyUrl = companyLink ? getSafeHref(companyUrl) : ""
    const safeCreditUrl = creditLink ? getSafeHref(creditUrl) : ""
    const creditParts = getCreditParts(
        creditPreset,
        creditName,
        creditCustomText
    )
    const linkTransition = canAnimate
        ? "color 160ms ease, background-color 160ms ease, background-size 180ms ease, box-shadow 180ms ease, opacity 160ms ease, transform 180ms ease"
        : "none"
    const shouldUnderline =
        hoverInteractions &&
        (hoverStyle === "underline" || hoverStyle === "lift")
    const shouldLift =
        hoverInteractions && (hoverStyle === "lift" || hoverStyle === "glow")
    const shouldUsePill = hoverInteractions && hoverStyle === "pill"
    const shouldUseGlow = hoverInteractions && hoverStyle === "glow"

    function getInteractiveLinkStyle(itemId: string): React.CSSProperties {
        const isHovered = hoveredItem === itemId
        const isPressed = pressedItem === itemId
        const isFocused = focusedItem === itemId
        const isActive = canAnimate && (isHovered || isFocused)
        const translateY = isActive && shouldLift ? -Math.abs(hoverLift) : 0
        const scale = canAnimate && isPressed ? 0.98 : 1
        const shadows: string[] = []

        if (isActive && shouldUseGlow) {
            shadows.push(`0 8px 24px ${hoverShadowColor}`)
        }

        if (canAnimate && isFocused) {
            shadows.push(`0 0 0 3px ${focusRingColor}`)
        }

        return {
            color: isActive ? hoverLinkColor : linkColor,
            display: "inline-flex",
            alignItems: "center",
            position: "relative",
            borderRadius: shouldUsePill ? 999 : 4,
            padding: shouldUsePill ? "2px 7px" : "0 1px",
            margin: shouldUsePill ? "0 -3px" : "0 -1px",
            backgroundColor:
                isActive && shouldUsePill
                    ? hoverBackgroundColor
                    : "transparent",
            backgroundImage: shouldUnderline
                ? `linear-gradient(${hoverLinkColor}, ${hoverLinkColor})`
                : "none",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "0 100%",
            backgroundSize: isActive && shouldUnderline ? "100% 1px" : "0% 1px",
            boxShadow: shadows.length > 0 ? shadows.join(", ") : "none",
            opacity: canAnimate && isPressed ? 0.82 : 1,
            textDecoration: "none",
            transform: `translateY(${translateY}px) scale(${scale})`,
            transition: linkTransition,
            outline: canAnimate ? "none" : undefined,
            overflowWrap: "anywhere",
            willChange: canAnimate
                ? "transform, color, background-size, box-shadow"
                : undefined,
        }
    }

    function renderInteractiveLink(
        itemId: string,
        label: string,
        url: string,
        openInNewTab = false
    ) {
        return (
            <a
                href={url}
                target={openInNewTab ? "_blank" : undefined}
                rel={openInNewTab ? "noopener noreferrer" : undefined}
                style={getInteractiveLinkStyle(itemId)}
                onMouseEnter={() => setHoveredItem(itemId)}
                onMouseLeave={() => {
                    setHoveredItem(null)
                    setPressedItem(null)
                }}
                onMouseDown={() => setPressedItem(itemId)}
                onMouseUp={() => setPressedItem(null)}
                onFocus={() => setFocusedItem(itemId)}
                onBlur={() => {
                    setFocusedItem(null)
                    setPressedItem(null)
                }}
            >
                {label}
            </a>
        )
    }

    function renderCreditLine() {
        if (!showCredit) return null

        if (creditPreset === "custom") {
            return safeCreditUrl
                ? renderInteractiveLink(
                      "credit",
                      creditParts.label,
                      safeCreditUrl,
                      creditOpenInNewTab
                  )
                : creditParts.label
        }

        return (
            <span>
                {creditParts.prefix}{" "}
                {safeCreditUrl
                    ? renderInteractiveLink(
                          "credit",
                          creditParts.label,
                          safeCreditUrl,
                          creditOpenInNewTab
                      )
                    : creditParts.label}
            </span>
        )
    }

    const contentItems: Array<{ key: string; content: React.ReactNode }> = [
        {
            key: "copyright",
            content: (
                <span>
                    © {displayedYear}{" "}
                    {safeCompanyUrl
                        ? renderInteractiveLink(
                              "company",
                              companyLabel,
                              safeCompanyUrl
                          )
                        : companyLabel}
                </span>
            ),
        },
        ...(showRights
            ? [
                  {
                      key: "rights",
                      content: rightsText.trim() || "All rights reserved.",
                  },
              ]
            : []),
        ...(formattedCountry
            ? [
                  {
                      key: "country",
                      content: formattedCountry,
                  },
              ]
            : []),
        ...(formattedDate
            ? [
                  {
                      key: "date",
                      content: formattedDate,
                  },
              ]
            : []),
    ]
    const creditLine = renderCreditLine()

    return (
        <footer
            style={{
                ...style,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                justifyContent: "flex-start",
                gap: creditLine ? creditGap : 0,
                padding,
                boxSizing: "border-box",
                backgroundColor,
                borderTop: borderTop
                    ? `${borderWidth}px solid ${borderColor}`
                    : "none",
                color: textColor,
                textAlign,
                ...font,
                fontSize,
                lineHeight,
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: showStacked ? "column" : "row",
                    flexWrap: showStacked ? "nowrap" : "wrap",
                    alignItems: showStacked ? stackedAlignItems : "center",
                    justifyContent,
                    gap,
                    width: "100%",
                    minWidth: 0,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent,
                        gap,
                        minWidth: 0,
                    }}
                >
                    {contentItems.map((item, index) => (
                        <React.Fragment key={item.key}>
                            {index > 0 && (
                                <span
                                    aria-hidden="true"
                                    style={{ color: textColor, opacity: 0.56 }}
                                >
                                    {separatorMark}
                                </span>
                            )}
                            <span>{item.content}</span>
                        </React.Fragment>
                    ))}
                </div>

                {cleanLinks.length > 0 && (
                    <nav
                        aria-label="Legal links"
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            justifyContent,
                            gap,
                            minWidth: 0,
                        }}
                    >
                        {cleanLinks.map((link, index) => (
                            <React.Fragment key={`${link.label}-${index}`}>
                                {index > 0 && (
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            color: textColor,
                                            opacity: 0.56,
                                        }}
                                    >
                                        {separatorMark}
                                    </span>
                                )}
                                {renderInteractiveLink(
                                    `link-${index}`,
                                    link.label,
                                    link.url,
                                    link.openInNewTab
                                )}
                            </React.Fragment>
                        ))}
                    </nav>
                )}
            </div>

            {creditLine && (
                <div
                    style={{
                        width: "100%",
                        display: "flex",
                        justifyContent,
                        color: creditColor,
                        fontSize: Math.max(10, fontSize - 1),
                        lineHeight,
                        textAlign,
                        minWidth: 0,
                    }}
                >
                    <span>{creditLine}</span>
                </div>
            )}
        </footer>
    )
}

DynamicCopyrightLegalFooter.defaultProps = {
    startYear: 2024,
    companyName: "Acme Studio",
    companyLink: false,
    companyUrl: "/",
    links: defaultLinks,
    showRights: true,
    rightsText: "All rights reserved.",
    localeMode: "auto",
    localePreset: "en-US",
    locale: "en-US",
    showDate: false,
    dateStyle: "medium",
    showCountry: false,
    countryCode: "US",
    countryDisplay: "name",
    showCredit: false,
    creditPreset: "builtBy",
    creditName: "",
    creditCustomText: "Built by Acme Studio",
    creditLink: false,
    creditUrl: "/",
    creditOpenInNewTab: false,
    creditColor: "rgba(17, 24, 39, 0.52)",
    creditGap: 4,
    separator: "dot",
    alignment: "center",
    layout: "inline",
    font: { fontFamily: "Inter", fontWeight: 400 },
    fontSize: 13,
    lineHeight: 1.45,
    textColor: "rgba(17, 24, 39, 0.72)",
    linkColor: "#111827",
    hoverLinkColor: "#4F46E5",
    hoverInteractions: true,
    hoverStyle: "lift",
    hoverLift: 2,
    hoverBackgroundColor: "rgba(79, 70, 229, 0.08)",
    hoverShadowColor: "rgba(79, 70, 229, 0.18)",
    focusRingColor: "rgba(79, 70, 229, 0.22)",
    backgroundColor: "rgba(255, 255, 255, 0)",
    padding: 16,
    gap: 8,
    borderTop: false,
    borderColor: "rgba(17, 24, 39, 0.12)",
    borderWidth: 1,
}

addPropertyControls(DynamicCopyrightLegalFooter, {
    startYear: {
        type: ControlType.Number,
        title: "Start Year",
        min: 1900,
        max: 2100,
        step: 1,
        displayStepper: true,
        defaultValue: 2024,
    },
    companyName: {
        type: ControlType.String,
        title: "Company",
        defaultValue: "Acme Studio",
    },
    companyLink: {
        type: ControlType.Boolean,
        title: "Company Link",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    companyUrl: {
        type: ControlType.Link,
        title: "Company URL",
        defaultValue: "/",
        hidden: (props) => !props.companyLink,
    },
    links: {
        type: ControlType.Array,
        title: "Links",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Privacy",
                },
                url: {
                    type: ControlType.Link,
                    title: "URL",
                    defaultValue: "/privacy",
                },
                openInNewTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                    enabledTitle: "Yes",
                    disabledTitle: "No",
                },
            },
        },
        defaultValue: defaultLinks,
    },
    showCredit: {
        type: ControlType.Boolean,
        title: "Credit Line",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    creditPreset: {
        type: ControlType.Enum,
        title: "Credit",
        options: ["builtBy", "madeWith", "siteBy", "custom"],
        optionTitles: ["Built by", "Made with", "Site by", "Custom"],
        defaultValue: "builtBy",
        hidden: (props) => !props.showCredit,
    },
    creditName: {
        type: ControlType.String,
        title: "Credit Name",
        defaultValue: "",
        placeholder: "Acme Studio / Framer / Nova Labs",
        hidden: (props) => !props.showCredit || props.creditPreset === "custom",
    },
    creditCustomText: {
        type: ControlType.String,
        title: "Credit Text",
        defaultValue: "Built by Acme Studio",
        hidden: (props) => !props.showCredit || props.creditPreset !== "custom",
    },
    creditLink: {
        type: ControlType.Boolean,
        title: "Credit Link",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props) => !props.showCredit,
    },
    creditUrl: {
        type: ControlType.Link,
        title: "Credit URL",
        defaultValue: "/",
        hidden: (props) => !props.showCredit || !props.creditLink,
    },
    creditOpenInNewTab: {
        type: ControlType.Boolean,
        title: "Credit Tab",
        defaultValue: false,
        enabledTitle: "New",
        disabledTitle: "Same",
        hidden: (props) => !props.showCredit || !props.creditLink,
    },
    showRights: {
        type: ControlType.Boolean,
        title: "Rights",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    rightsText: {
        type: ControlType.String,
        title: "Rights Text",
        defaultValue: "All rights reserved.",
        hidden: (props) => !props.showRights,
    },
    localeMode: {
        type: ControlType.Enum,
        title: "Locale",
        options: ["auto", "preset", "custom"],
        optionTitles: ["Auto", "Preset", "Custom"],
        defaultValue: "auto",
        displaySegmentedControl: true,
    },
    localePreset: {
        type: ControlType.Enum,
        title: "Preset",
        options: [
            "en-US",
            "en-GB",
            "en-CA",
            "fr-CA",
            "de-DE",
            "fr-FR",
            "es-ES",
            "it-IT",
            "nl-NL",
            "sv-SE",
            "ja-JP",
            "ko-KR",
            "pt-BR",
            "hi-IN",
            "ar-AE",
        ],
        optionTitles: [
            "English (US)",
            "English (UK)",
            "English (Canada)",
            "French (Canada)",
            "German (DE)",
            "French (FR)",
            "Spanish (ES)",
            "Italian (IT)",
            "Dutch (NL)",
            "Swedish (SE)",
            "Japanese (JP)",
            "Korean (KR)",
            "Portuguese (BR)",
            "Hindi (IN)",
            "Arabic (AE)",
        ],
        defaultValue: "en-US",
        hidden: (props) => props.localeMode !== "preset",
    },
    locale: {
        type: ControlType.String,
        title: "Code",
        defaultValue: "en-US",
        placeholder: "en-US",
        hidden: (props) => props.localeMode !== "custom",
    },
    showDate: {
        type: ControlType.Boolean,
        title: "Date",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    dateStyle: {
        type: ControlType.Enum,
        title: "Date Style",
        options: ["short", "medium", "long", "full"],
        optionTitles: ["Short", "Medium", "Long", "Full"],
        defaultValue: "medium",
        hidden: (props) => !props.showDate,
    },
    showCountry: {
        type: ControlType.Boolean,
        title: "Country",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    countryCode: {
        type: ControlType.String,
        title: "Country Code",
        defaultValue: "US",
        placeholder: "US",
        hidden: (props) => !props.showCountry,
    },
    countryDisplay: {
        type: ControlType.Enum,
        title: "Country As",
        options: ["name", "code"],
        optionTitles: ["Name", "Code"],
        defaultValue: "name",
        displaySegmentedControl: true,
        hidden: (props) => !props.showCountry,
    },
    separator: {
        type: ControlType.Enum,
        title: "Separator",
        options: ["dot", "slash", "dash", "pipe"],
        optionTitles: ["Dot", "Slash", "Dash", "Pipe"],
        defaultValue: "dot",
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["inline", "stacked"],
        optionTitles: ["Inline", "Stacked"],
        defaultValue: "inline",
        displaySegmentedControl: true,
    },
    alignment: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },
    font: {
        // @ts-ignore
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        displayFontSize: false,
        displayTextAlignment: false,
        defaultFontType: "sans-serif",
        defaultValue: { fontFamily: "Inter", fontWeight: 400 },
    },
    fontSize: {
        type: ControlType.Number,
        title: "Size",
        min: 8,
        max: 40,
        step: 1,
        defaultValue: 13,
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line",
        min: 1,
        max: 2,
        step: 0.05,
        defaultValue: 1.45,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "rgba(17, 24, 39, 0.72)",
    },
    linkColor: {
        type: ControlType.Color,
        title: "Links",
        defaultValue: "#111827",
    },
    hoverLinkColor: {
        type: ControlType.Color,
        title: "Hover",
        defaultValue: "#4F46E5",
    },
    hoverInteractions: {
        type: ControlType.Boolean,
        title: "Interactions",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    hoverStyle: {
        type: ControlType.Enum,
        title: "Hover Style",
        options: ["underline", "lift", "pill", "glow"],
        optionTitles: ["Underline", "Lift", "Pill", "Glow"],
        defaultValue: "lift",
        hidden: (props) => !props.hoverInteractions,
    },
    hoverLift: {
        type: ControlType.Number,
        title: "Lift",
        min: 0,
        max: 8,
        step: 1,
        defaultValue: 2,
        hidden: (props) =>
            !props.hoverInteractions ||
            (props.hoverStyle !== "lift" && props.hoverStyle !== "glow"),
    },
    hoverBackgroundColor: {
        type: ControlType.Color,
        title: "Hover Bg",
        defaultValue: "rgba(79, 70, 229, 0.08)",
        hidden: (props) =>
            !props.hoverInteractions || props.hoverStyle !== "pill",
    },
    hoverShadowColor: {
        type: ControlType.Color,
        title: "Glow",
        defaultValue: "rgba(79, 70, 229, 0.18)",
        hidden: (props) =>
            !props.hoverInteractions || props.hoverStyle !== "glow",
    },
    focusRingColor: {
        type: ControlType.Color,
        title: "Focus Ring",
        defaultValue: "rgba(79, 70, 229, 0.22)",
        hidden: (props) => !props.hoverInteractions,
    },
    creditColor: {
        type: ControlType.Color,
        title: "Credit Color",
        defaultValue: "rgba(17, 24, 39, 0.52)",
        hidden: (props) => !props.showCredit,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Bg",
        defaultValue: "rgba(255, 255, 255, 0)",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 80,
        step: 1,
        defaultValue: 16,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 32,
        step: 1,
        defaultValue: 8,
    },
    creditGap: {
        type: ControlType.Number,
        title: "Credit Gap",
        min: 0,
        max: 24,
        step: 1,
        defaultValue: 4,
        hidden: (props) => !props.showCredit,
    },
    borderTop: {
        type: ControlType.Boolean,
        title: "Border",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "rgba(17, 24, 39, 0.12)",
        hidden: (props) => !props.borderTop,
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        min: 1,
        max: 8,
        step: 1,
        defaultValue: 1,
        hidden: (props) => !props.borderTop,
    },
})

export default DynamicCopyrightLegalFooter
