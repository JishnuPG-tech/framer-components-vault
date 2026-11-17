// Create a navigation bar with mega menu dropdown in Framer.

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

import { AnimatePresence, motion } from "framer-motion"

type LinkItem = {
    label: string
    href: string
}

type MegaItem = {
    icon: string
    title: string
    description: string
    href: string
    featured?: boolean
}

type FontStyle = any

interface Props {
    logoType: "text" | "image"
    logoText: string
    logoImage?: { src: string; alt?: string }
    links: LinkItem[]
    ctaLabel: string
    ctaHref: string

    megaTitle: string
    megaItems: MegaItem[]
    megaPaddingTop: number
    megaPaddingBottom: number
    megaPaddingHorizontal: number

    backgroundColor: string
    textColor: string
    subtleTextColor: string
    panelBackground: string
    shadow: string

    menuRadius: number
    itemRadius: number
    itemBackground: string
    itemBorderColor: string
    iconBackground: string

    ctaGradientFrom: string
    ctaGradientTo: string

    maxWidth: number
    height: number
    horizontalPadding: number
    mobileBreakpoint: number
    tabletBreakpoint: number
    tabletLayout: "compact" | "hamburger" | "desktop"

    mobileCardHeight: number
    mobileCardPadding: number
    mobileCardGap: number

    navFont: FontStyle
    megaTitleFont: FontStyle
    megaDescFont: FontStyle
    ctaFont: FontStyle

    style?: React.CSSProperties
}

function useMediaQuery(query: string) {
    const [matches, setMatches] = React.useState(false)

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const mq = window.matchMedia(query)
        const update = () => {
            React.startTransition(() => setMatches(!!mq.matches))
        }
        update()
        if (mq.addEventListener) mq.addEventListener("change", update)
        else mq.addListener(update)
        return () => {
            if (mq.removeEventListener) mq.removeEventListener("change", update)
            else mq.removeListener(update)
        }
    }, [query])

    return matches
}

function clampItems(items: MegaItem[]) {
    if (!Array.isArray(items)) return []
    return items.filter(Boolean)
}

function safeHref(href: string) {
    if (!href) return "#"
    return href
}

function IconBadge({
    label,
    color,
    background,
}: {
    label: string
    color: string
    background: string
}) {
    return (
        <div
            aria-hidden="true"
            style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color,
                fontSize: 16,
                lineHeight: 1,
                flex: "0 0 auto",
                userSelect: "none",
            }}
        >
            {label || "✦"}
        </div>
    )
}

/**
 * MegaNav
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 60
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function MegaNav(props: Props) {
    const {
        logoType,
        logoText,
        logoImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Logo",
        },
        links,
        ctaLabel,
        ctaHref,
        megaTitle,
        megaItems,
        megaPaddingTop,
        megaPaddingBottom,
        megaPaddingHorizontal,
        backgroundColor,
        textColor,
        subtleTextColor,
        panelBackground,
        shadow,
        menuRadius,
        itemRadius,
        itemBackground,
        itemBorderColor,
        iconBackground,
        ctaGradientFrom,
        ctaGradientTo,
        maxWidth,
        height,
        horizontalPadding,
        mobileBreakpoint,
        tabletBreakpoint,
        tabletLayout,
        mobileCardHeight,
        mobileCardPadding,
        mobileCardGap,
        navFont,
        megaTitleFont,
        megaDescFont,
        ctaFont,
    } = props

    const isStatic = useIsStaticRenderer()
    const isPreview = RenderTarget.current() === RenderTarget.preview

    const isMobile = useMediaQuery(`(max-width: ${Math.max(240, mobileBreakpoint)}px)`) // guard min
    const isTablet = useMediaQuery(`(max-width: ${Math.max(Math.max(320, mobileBreakpoint + 1), tabletBreakpoint)}px)`) &&
        !isMobile
    const tabletUsesHamburger = isTablet && tabletLayout === "hamburger"
    const tabletUsesCompact = isTablet && tabletLayout === "compact"
    const isCollapsed = isMobile || tabletUsesHamburger

    const [openMega, setOpenMega] = React.useState(false)
    const [mobileOpen, setMobileOpen] = React.useState(false)
    const [mobileProductsOpen, setMobileProductsOpen] = React.useState(false)

    const rootRef = React.useRef<HTMLDivElement>(null)

    const items = React.useMemo(() => {
        const normalized = clampItems(megaItems)
        // Ensure exactly one featured item (first featured or first item)
        const firstFeatured = normalized.findIndex((i) => i.featured)
        if (firstFeatured === -1 && normalized[0]) {
            return [{ ...normalized[0], featured: true }, ...normalized.slice(1)]
        }
        if (firstFeatured > 0) {
            const featured = normalized[firstFeatured]
            const rest = normalized.filter((_, idx) => idx !== firstFeatured)
            return [{ ...featured, featured: true }, ...rest]
        }
        return normalized
    }, [megaItems])

    const closeAll = React.useCallback(() => {
        React.startTransition(() => {
            setOpenMega(false)
            setMobileOpen(false)
            setMobileProductsOpen(false)
        })
    }, [])

    const closeMegaOnly = React.useCallback(() => {
        React.startTransition(() => setOpenMega(false))
    }, [])

    const onDocumentPointerDown = React.useCallback(
        (e: PointerEvent | MouseEvent) => {
            const el = rootRef.current
            if (!el) return
            const target = e.target as Node | null
            if (!target) return
            if (!el.contains(target)) {
                closeAll()
            }
        },
        [closeAll]
    )

    React.useEffect(() => {
        if (isStatic) return
        if (typeof document === "undefined") return

        const shouldListen = openMega || mobileOpen
        if (!shouldListen) return

        document.addEventListener("pointerdown", onDocumentPointerDown, { capture: true })
        return () => {
            document.removeEventListener("pointerdown", onDocumentPointerDown, { capture: true } as any)
        }
    }, [openMega, mobileOpen, onDocumentPointerDown, isStatic])

    React.useEffect(() => {
        // When switching between layouts, close menus
        React.startTransition(() => {
            setOpenMega(false)
            setMobileOpen(false)
            setMobileProductsOpen(false)
        })
    }, [isMobile, isTablet, tabletLayout])

    const openMegaMenu = React.useCallback(() => {
        if (isStatic) return
        if (isMobile || isTablet) return
        React.startTransition(() => setOpenMega(true))
    }, [isStatic, isMobile, isTablet])

    const toggleMobile = React.useCallback(() => {
        if (isStatic) return
        React.startTransition(() => {
            setMobileOpen((v) => !v)
            setMobileProductsOpen(false)
        })
    }, [isStatic])

    const toggleMobileProducts = React.useCallback(() => {
        if (isStatic) return
        React.startTransition(() => setMobileProductsOpen((v) => !v))
    }, [isStatic])

    const topBarStyles: React.CSSProperties = {
        height,
        width: "100%",
        background: backgroundColor,
        position: "relative",
        display: "flex",
        alignItems: "center",
        zIndex: 2,
    }

    const innerStyles: React.CSSProperties = {
        width: "100%",
        maxWidth,
        margin: "0 auto",
        paddingLeft: horizontalPadding,
        paddingRight: horizontalPadding,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
    }

    const navLinkBase: React.CSSProperties = {
        ...navFont,
        fontSize: navFont?.fontSize ?? "14px",
        color: textColor,
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "10px 10px",
        borderRadius: 10,
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        cursor: "pointer",
    }

    const ctaStyles: React.CSSProperties = {
        ...ctaFont,
        border: "none",
        color: "#FFFFFF",
        background: `linear-gradient(135deg, ${ctaGradientFrom}, ${ctaGradientTo})`,
        padding: "10px 14px",
        borderRadius: 12,
        cursor: "pointer",
        userSelect: "none",
        boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        whiteSpace: "nowrap",
    }

    const hamburgerStyles: React.CSSProperties = {
        width: 40,
        height: 40,
        borderRadius: 12,
        border: "1px solid rgba(0,0,0,0.08)",
        background: "rgba(0,0,0,0.02)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        userSelect: "none",
    }

    const panelMotion = {
        initial: { opacity: 0, y: -8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.25, ease: "easeInOut" as const },
    }

    const featuredGradient = `linear-gradient(135deg, rgba(99,102,241,0.18), rgba(168,85,247,0.18))`

    return (
        <div
            ref={rootRef}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height,
                overflow: "visible",
                background: "transparent",
                // Use vendor-specific smoothing key; standard CSSProperties doesn't include `fontSmoothing`.
                WebkitFontSmoothing: "antialiased",
            }}
            onMouseLeave={isStatic || isMobile || isTablet ? undefined : closeMegaOnly}
        >
            <div style={topBarStyles} role="navigation" aria-label="Primary">
                <div style={innerStyles}>
                    <a
                        href={safeHref("/")}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 10,
                            minWidth: "max-content",
                            textDecoration: "none",
                            color: textColor,
                        }}
                        aria-label="Home"
                        onClick={(e) => {
                            if (!isPreview) return
                            // allow navigation in preview; no-op otherwise
                        }}
                    >
                        {logoType === "image" && logoImage?.src ? (
                            <img
                                src={logoImage.src}
                                alt={logoImage.alt || "Logo"}
                                style={{ width: 28, height: 28, borderRadius: 8, objectFit: "cover" }}
                            />
                        ) : null}
                        {logoType === "text" && (
                            <span
                                style={{
                                    ...navFont,
                                    fontSize: 15,
                                    letterSpacing: "-0.02em",
                                    fontWeight: 700,
                                    lineHeight: 1,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {logoText}
                            </span>
                        )}
                    </a>

                    {!isCollapsed && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 2,
                                flex: 1,
                                ...(tabletUsesCompact
                                    ? {
                                          justifyContent: "flex-start",
                                          overflowX: "auto",
                                          WebkitOverflowScrolling: "touch",
                                          scrollbarWidth: "none",
                                      }
                                    : null),
                            }}
                            aria-label="Main links"
                        >
                            {links.map((l, idx) => {
                                const isProducts = l.label.toLowerCase() === "products"
                                return (
                                    <a
                                        key={idx}
                                        href={safeHref(l.href)}
                                        style={navLinkBase}
                                        onMouseEnter={isProducts ? openMegaMenu : closeMegaOnly}
                                        onFocus={isProducts ? openMegaMenu : closeMegaOnly}
                                        onClick={(e) => {
                                            if (isProducts) {
                                                e.preventDefault()
                                                if (isStatic) return
                                                React.startTransition(() => setOpenMega((v) => !v))
                                            }
                                        }}
                                        aria-haspopup={isProducts ? "menu" : undefined}
                                        aria-expanded={isProducts ? openMega : undefined}
                                    >
                                        <span>{l.label}</span>
                                        {isProducts ? (
                                            <span
                                                aria-hidden="true"
                                                style={{
                                                    display: "inline-flex",
                                                    transform: openMega ? "rotate(180deg)" : "rotate(0deg)",
                                                    transition: "transform 0.18s ease",
                                                    opacity: 0.7,
                                                }}
                                            >
                                                ▾
                                            </span>
                                        ) : null}
                                    </a>
                                )
                            })}
                        </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: "max-content" }}>
                        {!isCollapsed && (
                            <a
                                href={safeHref(ctaHref)}
                                style={{ textDecoration: "none" }}
                                aria-label={ctaLabel}
                            >
                                <button
                                    style={ctaStyles}
                                    onMouseEnter={(e) => {
                                        const el = e.currentTarget
                                        el.style.transform = "translateY(-1px)"
                                        el.style.boxShadow = "0 12px 24px rgba(0,0,0,0.16)"
                                    }}
                                    onMouseLeave={(e) => {
                                        const el = e.currentTarget
                                        el.style.transform = "translateY(0px)"
                                        el.style.boxShadow = "0 8px 18px rgba(0,0,0,0.12)"
                                    }}
                                    onFocus={(e) => {
                                        const el = e.currentTarget
                                        el.style.transform = "translateY(-1px)"
                                        el.style.boxShadow = "0 12px 24px rgba(0,0,0,0.16)"
                                    }}
                                    onBlur={(e) => {
                                        const el = e.currentTarget
                                        el.style.transform = "translateY(0px)"
                                        el.style.boxShadow = "0 8px 18px rgba(0,0,0,0.12)"
                                    }}
                                >
                                    {ctaLabel}
                                </button>
                            </a>
                        )}

                        {isCollapsed && (
                            <button
                                style={hamburgerStyles}
                                onClick={toggleMobile}
                                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                                aria-expanded={mobileOpen}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path
                                        d={
                                            mobileOpen
                                                ? "M6 6l12 12M18 6L6 18"
                                                : "M4 7h16M4 12h16M4 17h16"
                                        }
                                        stroke={textColor}
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Desktop mega menu */}
            <AnimatePresence>
                {!isCollapsed && !isTablet && openMega && !isStatic && (
                    <motion.div
                        {...panelMotion}
                        style={{
                            position: "absolute",
                            top: height,
                            left: 0,
                            right: 0,
                            zIndex: 1,
                            background: panelBackground,
                            boxShadow: shadow,
                            borderTop: "1px solid rgba(0,0,0,0.06)",
                            borderBottomLeftRadius: menuRadius,
                            borderBottomRightRadius: menuRadius,
                        }}
                        role="menu"
                        aria-label={megaTitle}
                        onMouseEnter={openMegaMenu}
                    >
                        <div
                            style={{
                                maxWidth,
                                margin: "0 auto",
                                padding: "18px 18px 22px",
                                paddingTop: megaPaddingTop,
                                paddingBottom: megaPaddingBottom,
                                paddingLeft: megaPaddingHorizontal,
                                paddingRight: megaPaddingHorizontal,
                            }}
                        >
                            <div
                                style={{
                                    ...megaTitleFont,
                                    color: textColor,
                                    marginBottom: 14,
                                }}
                            >
                                {megaTitle}
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                                    gap: 12,
                                }}
                            >
                                {items.slice(0, 6).map((item, idx) => {
                                    const featured = !!item.featured && idx === 0
                                    return (
                                        <a
                                            key={idx}
                                            href={safeHref(item.href)}
                                            style={{
                                                textDecoration: "none",
                                                color: textColor,
                                                outline: "none",
                                            }}
                                            onClick={() => {
                                                closeMegaOnly()
                                            }}
                                            role="menuitem"
                                        >
                                            <div
                                                style={{
                                                    borderRadius: itemRadius,
                                                    padding: 14,
                                                    height: 120,
                                                    display: "flex",
                                                    gap: 12,
                                                    alignItems: "flex-start",
                                                    background: featured ? featuredGradient : itemBackground,
                                                    border: `1px solid ${itemBorderColor}`,
                                                    transition: "transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
                                                }}
                                                onMouseEnter={(e) => {
                                                    const el = e.currentTarget
                                                    el.style.transform = "translateY(-1px)"
                                                    el.style.boxShadow = "0 10px 24px rgba(0,0,0,0.08)"
                                                }}
                                                onMouseLeave={(e) => {
                                                    const el = e.currentTarget
                                                    el.style.transform = "translateY(0px)"
                                                    el.style.boxShadow = "none"
                                                }}
                                            >
                                                <IconBadge label={item.icon} color={textColor} background={iconBackground} />
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div
                                                        style={{
                                                            ...megaTitleFont,
                                                            color: textColor,
                                                            marginBottom: 6,
                                                            fontWeight: featured ? 800 : megaTitleFont?.fontWeight,
                                                        }}
                                                    >
                                                        {item.title}
                                                    </div>
                                                    <div
                                                        style={{
                                                            ...megaDescFont,
                                                            color: subtleTextColor,
                                                            display: "-webkit-box",
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: "vertical",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        {item.description}
                                                    </div>
                                                </div>
                                            </div>
                                        </a>
                                    )
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile menu */}
            <AnimatePresence>
                {isCollapsed && mobileOpen && !isStatic && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        style={{
                            position: "absolute",
                            top: height,
                            left: 0,
                            right: 0,
                            background: panelBackground,
                            boxShadow: shadow,
                            borderTop: "1px solid rgba(0,0,0,0.06)",
                            borderBottomLeftRadius: menuRadius,
                            borderBottomRightRadius: menuRadius,
                            zIndex: 1,
                        }}
                        role="dialog"
                        aria-label="Mobile menu"
                    >
                        <div style={{ padding: 14 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {links.map((l, idx) => {
                                    const isProducts = l.label.toLowerCase() === "products"
                                    if (!isProducts) {
                                        return (
                                            <a
                                                key={idx}
                                                href={safeHref(l.href)}
                                                style={{
                                                    ...navLinkBase,
                                                    padding: "12px 12px",
                                                    borderRadius: 12,
                                                    justifyContent: "space-between",
                                                }}
                                                onClick={() => closeAll()}
                                            >
                                                {l.label}
                                            </a>
                                        )
                                    }

                                    return (
                                        <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                            <button
                                                style={{
                                                    ...navLinkBase,
                                                    padding: "12px 12px",
                                                    borderRadius: 12,
                                                    width: "100%",
                                                    justifyContent: "space-between",
                                                    background: "rgba(0,0,0,0.02)",
                                                    border: "1px solid rgba(0,0,0,0.06)",
                                                }}
                                                onClick={toggleMobileProducts}
                                                aria-expanded={mobileProductsOpen}
                                                aria-controls="products-accordion"
                                            >
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                                    {l.label}
                                                </span>
                                                <span
                                                    aria-hidden="true"
                                                    style={{
                                                        opacity: 0.7,
                                                        transform: mobileProductsOpen ? "rotate(180deg)" : "rotate(0deg)",
                                                        transition: "transform 0.18s ease",
                                                    }}
                                                >
                                                    ▾
                                                </span>
                                            </button>

                                            <AnimatePresence initial={false}>
                                                {mobileProductsOpen && (
                                                    <motion.div
                                                        id="products-accordion"
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                                        style={{
                                                            overflow: "hidden",
                                                            borderRadius: 14,
                                                            border: "1px solid rgba(0,0,0,0.06)",
                                                            background: itemBackground,
                                                        }}
                                                    >
                                                        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: mobileCardGap }}>
                                                            {items.slice(0, 6).map((item, i) => (
                                                                <a
                                                                    key={i}
                                                                    href={safeHref(item.href)}
                                                                    style={{
                                                                        textDecoration: "none",
                                                                        color: textColor,
                                                                        borderRadius: itemRadius,
                                                                        display: "block",
                                                                    }}
                                                                    onClick={() => closeAll()}
                                                                    aria-label={item.title}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            textAlign: "left",
                                                                            background: panelBackground,
                                                                            border: `1px solid ${itemBorderColor}`,
                                                                            padding: mobileCardPadding,
                                                                            borderRadius: itemRadius,
                                                                            cursor: "pointer",
                                                                            minHeight: mobileCardHeight,
                                                                            height: mobileCardHeight,
                                                                            display: "flex",
                                                                            flexDirection: "column",
                                                                            justifyContent: "flex-start",
                                                                            transition: "transform 0.18s ease, box-shadow 0.18s ease",
                                                                        }}
                                                                        onMouseEnter={(e) => {
                                                                            const el = e.currentTarget
                                                                            el.style.transform = "translateY(-1px)"
                                                                            el.style.boxShadow = "0 6px 16px rgba(0,0,0,0.08)"
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            const el = e.currentTarget
                                                                            el.style.transform = "translateY(0px)"
                                                                            el.style.boxShadow = "none"
                                                                        }}
                                                                    >
                                                                        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", width: "100%" }}>
                                                                            <IconBadge
                                                                                label={item.icon}
                                                                                color={textColor}
                                                                                background={iconBackground}
                                                                            />
                                                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                                                <div
                                                                                    style={{
                                                                                        ...megaTitleFont,
                                                                                        color: textColor,
                                                                                        marginBottom: 6,
                                                                                    }}
                                                                                >
                                                                                    {item.title}
                                                                                </div>
                                                                                <div
                                                                                    style={{
                                                                                        ...megaDescFont,
                                                                                        color: subtleTextColor,
                                                                                        display: "-webkit-box",
                                                                                        WebkitLineClamp: 2,
                                                                                        WebkitBoxOrient: "vertical",
                                                                                        overflow: "hidden",
                                                                                    }}
                                                                                >
                                                                                    {item.description}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )
                                })}

                                <a href={safeHref(ctaHref)} style={{ textDecoration: "none" }} onClick={() => closeAll()}>
                                    <button style={{ ...ctaStyles, width: "100%" }}>{ctaLabel}</button>
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(MegaNav, {
    logoType: {
        type: ControlType.Enum,
        title: "Logo Type",
        options: ["text", "image"],
        optionTitles: ["Text", "Image"],
        defaultValue: "text",
        displaySegmentedControl: true,
    },
    logoText: {
        type: ControlType.String,
        title: "Logo Text",
        defaultValue: "Acme",
        hidden: ({ logoType }) => logoType === "image",
    },
    logoImage: {
        type: ControlType.ResponsiveImage,
        title: "Logo Image",
        hidden: ({ logoType }) => logoType === "text",
    },
    links: {
        type: ControlType.Array,
        title: "Links",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Home" },
                href: { type: ControlType.Link, title: "URL", defaultValue: "/" },
            },
        },
        defaultValue: [
            { label: "Home", href: "/" },
            { label: "Products", href: "#" },
            { label: "Solutions", href: "#" },
            { label: "Pricing", href: "#" },
            { label: "Blog", href: "#" },
        ],
        maxCount: 8,
    },
    ctaLabel: {
        type: ControlType.String,
        title: "CTA Label",
        defaultValue: "Get Started",
    },
    ctaHref: {
        type: ControlType.Link,
        title: "CTA URL",
        defaultValue: "#",
    },

    megaTitle: {
        type: ControlType.String,
        title: "Mega Title",
        defaultValue: "Explore Products",
    },
    megaPaddingTop: {
        type: ControlType.Number,
        title: "Mega Padding Top",
        defaultValue: 18,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    megaPaddingBottom: {
        type: ControlType.Number,
        title: "Mega Padding Bottom",
        defaultValue: 22,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    megaPaddingHorizontal: {
        type: ControlType.Number,
        title: "Mega Padding Horizontal",
        defaultValue: 18,
        min: 0,
        max: 500,
        step: 1,
        unit: "px",
    },
    megaItems: {
        type: ControlType.Array,
        title: "Mega Items",
        control: {
            type: ControlType.Object,
            controls: {
                icon: { type: ControlType.String, title: "Icon", defaultValue: "⚡" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Automation" },
                href: { type: ControlType.Link, title: "URL", defaultValue: "#" },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Build workflows faster with templates and integrations.",
                    displayTextArea: true,
                },
                featured: { type: ControlType.Boolean, title: "Featured", defaultValue: false },
            },
        },
        defaultValue: [
            {
                icon: "✨",
                title: "New: AI Studio",
                href: "#",
                description: "Design, generate, and deploy AI-powered experiences in minutes.",
                featured: true,
            },
            {
                icon: "⚡",
                title: "Automation",
                href: "#",
                description: "Trigger actions across your stack with reliable workflows.",
            },
            {
                icon: "🔒",
                title: "Security",
                href: "#",
                description: "Enterprise-grade controls, SSO, and audit-ready reporting.",
            },
            {
                icon: "📊",
                title: "Analytics",
                href: "#",
                description: "Understand usage patterns with real-time dashboards.",
            },
            {
                icon: "🧩",
                title: "Integrations",
                href: "#",
                description: "Connect tools you already use with one-click connectors.",
            },
            {
                icon: "🚀",
                title: "Deploy",
                href: "#",
                description: "Ship changes safely with previews, rollbacks, and releases.",
            },
        ],
        maxCount: 9,
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Bar",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#333333",
    },
    subtleTextColor: {
        type: ControlType.Color,
        title: "Subtle Text",
        defaultValue: "#666666",
    },
    panelBackground: {
        type: ControlType.Color,
        title: "Panel",
        defaultValue: "#FFFFFF",
    },
    shadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
        defaultValue: "0 18px 50px rgba(0,0,0,0.12)",
    },

    menuRadius: {
        type: ControlType.Number,
        title: "Menu Radius",
        defaultValue: 16,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
    itemRadius: {
        type: ControlType.Number,
        title: "Item Radius",
        defaultValue: 16,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
    itemBackground: {
        type: ControlType.Color,
        title: "Item BG",
        defaultValue: "#F5F5F5",
    },
    itemBorderColor: {
        type: ControlType.Color,
        title: "Item Border",
        defaultValue: "#EEEEEE",
    },
    iconBackground: {
        type: ControlType.Color,
        title: "Icon BG",
        defaultValue: "rgba(0,0,0,0.04)",
    },

    ctaGradientFrom: {
        type: ControlType.Color,
        title: "CTA From",
        defaultValue: "#4F46E5",
    },
    ctaGradientTo: {
        type: ControlType.Color,
        title: "CTA To",
        defaultValue: "#A855F7",
    },

    maxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        defaultValue: 1200,
        min: 320,
        max: 1600,
        step: 10,
        unit: "px",
    },
    height: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 60,
        min: 44,
        max: 96,
        step: 1,
        unit: "px",
    },
    horizontalPadding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 18,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile",
        defaultValue: 860,
        min: 320,
        max: 1200,
        step: 10,
        unit: "px",
    },
    tabletBreakpoint: {
        type: ControlType.Number,
        title: "Tablet",
        defaultValue: 1024,
        min: 480,
        max: 1400,
        step: 10,
        unit: "px",
    },
    tabletLayout: {
        type: ControlType.Enum,
        title: "Tablet Layout",
        options: ["compact", "hamburger", "desktop"],
        optionTitles: ["Compact", "Hamburger", "Desktop"],
        defaultValue: "compact",
        displaySegmentedControl: true,
    },

    mobileCardHeight: {
        type: ControlType.Number,
        title: "Mobile Card Height",
        defaultValue: 100,
        min: 80,
        max: 200,
        step: 5,
        unit: "px",
    },
    mobileCardPadding: {
        type: ControlType.Number,
        title: "Mobile Card Padding",
        defaultValue: 14,
        min: 8,
        max: 24,
        step: 1,
        unit: "px",
    },
    mobileCardGap: {
        type: ControlType.Number,
        title: "Mobile Card Gap",
        defaultValue: 10,
        min: 4,
        max: 20,
        step: 1,
        unit: "px",
    },

    navFont: {
        type: ControlType.Font,
        title: "Nav Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    megaTitleFont: {
        type: ControlType.Font,
        title: "Mega Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.1em",
        },
    },
    megaDescFont: {
        type: ControlType.Font,
        title: "Mega Desc Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    ctaFont: {
        type: ControlType.Font,
        title: "CTA Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
})
