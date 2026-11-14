// User instructions: Create a full-width editorial navigation bar in Framer with specific desktop layout (logo, diagonal separator, nav links with sweep hover, arrow icon button), scroll effects (shadow + logo shrink), and mobile hamburger that opens a fullscreen overlay sliding in from the right with large vertical links.

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
import * as React from "react"

type NavItem = {
    label: string
    href: string
}

type CSSProperties = React.CSSProperties

interface EditorialNavbarProps {
    logoText: string
    logoMode: "text" | "image"
    logoImage?: { src: string; srcSet?: string; alt?: string }
    logoLink: string
    items: NavItem[]

    background: string
    borderColor: string
    textColor: string
    separatorColor: string

    ctaEnabled: boolean
    ctaLabel: string
    ctaHref: string
    ctaVariant: "text" | "outline" | "solid"
    ctaBackground: string
    ctaBorder: string
    ctaText: string
    ctaHoverFill: string
    ctaRadius: string

    height: number
    paddingX: number

    mobileBreakpoint: number
    tabletBreakpoint: number
    previewMobile: boolean
    previewTablet: boolean

    logoFont: any
    linkFont: any
    ctaFont: any
    overlayFont: any
    ctaOverlayFont: any

    overlayBackground: string

    shadow: string
    scrolledLogoScale: number

    style?: CSSProperties
}

/**
 * Editorial Navbar
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 72
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function EditorialNavbar(props: EditorialNavbarProps) {
    const isStatic = useIsStaticRenderer()

    const {
        logoText,
        logoMode,
        logoImage = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Logo",
        },
        logoLink,
        items,
        background,
        borderColor,
        textColor,
        separatorColor,
        ctaEnabled,
        ctaLabel,
        ctaHref,
        ctaVariant,
        ctaBackground,
        ctaBorder,
        ctaText,
        ctaHoverFill,
        ctaRadius,
        height,
        paddingX,
        mobileBreakpoint,
        tabletBreakpoint,
        previewMobile,
        previewTablet,
        logoFont,
        linkFont,
        ctaFont,
        overlayFont,
        ctaOverlayFont,
        overlayBackground,
        shadow,
        scrolledLogoScale,
        style,
    } = props

    const [isScrolled, setIsScrolled] = React.useState(false)
    const [viewportWidth, setViewportWidth] = React.useState<number>(0)
    const [menuOpen, setMenuOpen] = React.useState(false)

    const mode = React.useMemo(() => {
        const w = isStatic ? 0 : viewportWidth
        if (isStatic) {
            if (previewMobile) return "mobile"
            if (previewTablet) return "tablet"
            return "desktop"
        }
        if (!w) return "desktop"
        if (w <= mobileBreakpoint) return "mobile"
        if (w <= tabletBreakpoint) return "tablet"
        return "desktop"
    }, [isStatic, mobileBreakpoint, previewMobile, previewTablet, tabletBreakpoint, viewportWidth])

    const effectiveMobile = mode === "mobile"
    const effectiveTablet = mode === "tablet"

    React.useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return

        const onScroll = () => {
            const next = window.scrollY > 4
            React.startTransition(() => setIsScrolled(next))
        }

        const onResize = () => {
            React.startTransition(() => setViewportWidth(window.innerWidth))
            if (window.innerWidth > mobileBreakpoint) React.startTransition(() => setMenuOpen(false))
        }

        onScroll()
        onResize()

        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onResize)

        return () => {
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onResize)
        }
    }, [isStatic, tabletBreakpoint, mobileBreakpoint])

    const safeItems = React.useMemo(() => {
        const list = Array.isArray(items) && items.length > 0 ? items : [{ label: "WORK", href: "#" }]
        return list
    }, [items])

    const closeMenu = React.useCallback(() => {
        React.startTransition(() => setMenuOpen(false))
    }, [])

    const toggleMenu = React.useCallback(() => {
        React.startTransition(() => setMenuOpen((v) => !v))
    }, [])

    React.useEffect(() => {
        if (isStatic) return
        if (typeof document === "undefined") return
        document.body.style.overflow = menuOpen ? "hidden" : ""
        return () => {
            document.body.style.overflow = ""
        }
    }, [menuOpen, isStatic])

    const isFillWidth = !!style && style.width === "100%"

    const responsivePaddingX = React.useMemo(() => {
        if (effectiveMobile) return Math.min(paddingX, 16)
        if (effectiveTablet) return Math.min(paddingX, 20)
        return paddingX
    }, [effectiveMobile, effectiveTablet, paddingX])

    return (
        <nav
            aria-label="Primary"
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingLeft: responsivePaddingX,
                paddingRight: responsivePaddingX,
                background,
                borderBottom: `1px solid ${borderColor}`,
                boxShadow: isScrolled ? shadow : "none",
                boxSizing: "border-box",
                overflow: "visible",
                ...(isFillWidth ? {} : { minWidth: "min(100%, 320px)" }),
            }}
        >
            <motion.a
                href={logoLink}
                aria-label="Home"
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    textDecoration: "none",
                    color: textColor,
                    whiteSpace: "nowrap",
                    fontFamily: "Georgia, 'Times New Roman', Times, serif",
                    fontStyle: "italic",
                    ...logoFont,
                }}
                animate={{ scale: isScrolled ? scrolledLogoScale : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
            >
                {logoMode === "image" ? (
                    <img
                        {...logoImage}
                        alt={logoImage?.alt || "Logo"}
                        style={{
                            height: 28,
                            width: "auto",
                            display: "block",
                            objectFit: "contain",
                        }}
                    />
                ) : (
                    <span style={{ fontSize: 22 }}>{logoText}</span>
                )}
            </motion.a>

            {!effectiveMobile && !effectiveTablet && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 20,
                        flex: 1,
                        justifyContent: "center",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        aria-hidden="true"
                        style={{
                            width: 1,
                            height: 40,
                            background: separatorColor,
                            transform: "rotate(45deg)",
                            transformOrigin: "center",
                        }}
                    />
                </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: effectiveTablet ? 10 : 14 }}>
                {!effectiveMobile && (
                    <div style={{ display: "flex", alignItems: "center", gap: effectiveTablet ? 12 : 18, flexWrap: "nowrap" }}>
                        {safeItems.map((item, idx) => (
                            <SweepLink
                                key={`${item.label}-${idx}`}
                                href={item.href}
                                label={item.label}
                                color={textColor}
                                font={linkFont}
                                compact={effectiveTablet}
                            />
                        ))}
                        {ctaEnabled && (
                            <SweepLink
                                href={ctaHref}
                                label={ctaLabel}
                                color={ctaVariant === "text" ? textColor : ctaText}
                                font={linkFont}
                                ctaFont={ctaFont}
                                compact={effectiveTablet}
                                isCta
                                ctaVariant={ctaVariant}
                                ctaBackground={ctaBackground}
                                ctaBorder={ctaBorder}
                                ctaHoverFill={ctaHoverFill}
                                ctaRadius={ctaRadius}
                            />
                        )}
                    </div>
                )}

                {effectiveMobile && (
                    <button
                        type="button"
                        onClick={toggleMenu}
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={menuOpen}
                        style={{
                            width: 44,
                            height: 44,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: `1px solid ${borderColor}`,
                            borderRadius: 999,
                            background: "transparent",
                            color: textColor,
                            cursor: "pointer",
                            padding: 0,
                        }}
                    >
                        <HamburgerIcon open={menuOpen} color={textColor} />
                    </button>
                )}
            </div>

            <AnimatePresence>
                {effectiveMobile && menuOpen && (
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Navigation menu"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "tween", ease: [0.2, 0.8, 0.2, 1], duration: 0.35 }}
                        style={{
                            position: "fixed",
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0,
                            background: overlayBackground,
                            zIndex: 9999,
                            display: "flex",
                            flexDirection: "column",
                            padding: 28,
                            boxSizing: "border-box",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button
                                type="button"
                                onClick={closeMenu}
                                aria-label="Close menu"
                                style={{
                                    width: 44,
                                    height: 44,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border: `1px solid ${borderColor}`,
                                    borderRadius: 999,
                                    background: "transparent",
                                    color: textColor,
                                    cursor: "pointer",
                                    padding: 0,
                                }}
                            >
                                <HamburgerIcon open={true} color={textColor} />
                            </button>
                        </div>

                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                gap: 18,
                                paddingLeft: 6,
                                paddingRight: 6,
                            }}
                        >
                            {safeItems.map((item, idx) => (
                                <a
                                    key={`overlay-${item.label}-${idx}`}
                                    href={item.href}
                                    onClick={closeMenu}
                                    style={{
                                        textDecoration: "none",
                                        color: textColor,
                                        fontFamily: "Georgia, 'Times New Roman', Times, serif",
                                        fontStyle: "italic",
                                        fontSize: 48,
                                        lineHeight: "1.05em",
                                        letterSpacing: "-0.02em",
                                        ...overlayFont,
                                    }}
                                >
                                    {item.label}
                                </a>
                            ))}
                            {ctaEnabled && (
                                <motion.a
                                    href={ctaHref}
                                    onClick={closeMenu}
                                    initial="rest"
                                    animate="rest"
                                    whileHover="hover"
                                    whileFocus="hover"
                                    style={{
                                        position: "relative",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "flex-start",
                                        textDecoration: "none",
                                        overflow: "hidden",
                                        userSelect: "none",
                                        color: ctaVariant === "text" ? textColor : ctaText,
                                        fontFamily: "Georgia, 'Times New Roman', Times, serif",
                                        fontStyle: "italic",
                                        fontSize: 48,
                                        lineHeight: "1.05em",
                                        letterSpacing: "-0.02em",
                                        padding: ctaVariant === "text" ? "0" : "14px 16px",
                                        borderRadius: ctaVariant === "text" ? 0 : ctaRadius || "6px",
                                        border: ctaVariant === "text" ? "none" : `1px solid ${ctaBorder || "rgba(0,0,0,0.12)"}`,
                                        background: ctaVariant === "solid" ? ctaBackground : "transparent",
                                        ...overlayFont,
                                        ...ctaOverlayFont,
                                    }}
                                >
                                    {ctaVariant !== "text" && (
                                        <motion.span
                                            aria-hidden="true"
                                            variants={{
                                                rest: { clipPath: "inset(0 100% 0 0)" },
                                                hover: { clipPath: "inset(0 0% 0 0)" },
                                            }}
                                            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                background: ctaHoverFill || "rgba(0,0,0,0.06)",
                                            }}
                                        />
                                    )}
                                    <span style={{ position: "relative", zIndex: 1 }}>{ctaLabel}</span>
                                </motion.a>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}

function SweepLink({
    href,
    label,
    color,
    font,
    ctaFont,
    compact,
    isCta,
    ctaVariant = "outline",
    ctaBackground,
    ctaBorder,
    ctaHoverFill,
    ctaRadius,
}: {
    href: string
    label: string
    color: string
    font: any
    ctaFont?: any
    compact: boolean
    isCta?: boolean
    ctaVariant?: "text" | "outline" | "solid"
    ctaBackground?: string
    ctaBorder?: string
    ctaHoverFill?: string
    ctaRadius?: string
}) {
    const isButtonLike = !!isCta && ctaVariant !== "text"
    return (
        <motion.a
            href={href}
            style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                color,
                padding: compact ? "10px 8px" : "10px 10px",
                borderRadius: isButtonLike ? ctaRadius || 6 : 6,
                overflow: "hidden",
                userSelect: "none",
                textTransform: "uppercase",
                fontSize: compact ? 10 : 11,
                letterSpacing: "0.15em",
                fontWeight: 500,
                fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
                ...(isCta
                    ? {
                          border: ctaVariant === "text" ? "none" : `1px solid ${ctaBorder || "rgba(0,0,0,0.12)"}`,
                          background: ctaVariant === "solid" ? ctaBackground : "transparent",
                          padding: compact ? "10px 10px" : "10px 12px",
                      }
                    : null),
                ...font,
                ...(isCta ? ctaFont : null),
            }}
            initial="rest"
            animate="rest"
            whileHover="hover"
            whileFocus="hover"
        >
            <motion.span
                aria-hidden="true"
                variants={{
                    rest: { clipPath: "inset(0 100% 0 0)" },
                    hover: { clipPath: "inset(0 0% 0 0)" },
                }}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                style={{
                    position: "absolute",
                    inset: 0,
                    background: isCta && ctaVariant !== "text" ? ctaHoverFill || "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.06)",
                }}
            />
            <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
        </motion.a>
    )
}

function HamburgerIcon({ open, color }: { open: boolean; color: string }) {
    const common: CSSProperties = {
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 18,
        height: 1.5,
        background: color,
        borderRadius: 1,
        transformOrigin: "center",
    }

    return (
        <span style={{ position: "relative", width: 22, height: 22, display: "inline-block" }} aria-hidden="true">
            <motion.span
                style={common}
                animate={{
                    rotate: open ? 45 : 0,
                    y: open ? 0 : -5,
                    x: "-50%",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 34 }}
            />
            <motion.span
                style={common}
                animate={{
                    opacity: open ? 0 : 1,
                    x: "-50%",
                }}
                transition={{ duration: 0.15 }}
            />
            <motion.span
                style={common}
                animate={{
                    rotate: open ? -45 : 0,
                    y: open ? 0 : 5,
                    x: "-50%",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 34 }}
            />
        </span>
    )
}

addPropertyControls(EditorialNavbar, {
    logoMode: {
        type: ControlType.Enum,
        title: "Logo Type",
        options: ["text", "image"],
        optionTitles: ["Text", "Image"],
        defaultValue: "text",
        displaySegmentedControl: true,
    },
    logoText: {
        type: ControlType.String,
        title: "Logo",
        defaultValue: "The Journal",
        hidden: ({ logoMode }) => logoMode === "image",
    },
    logoImage: {
        type: ControlType.ResponsiveImage,
        title: "Logo Image",
        hidden: ({ logoMode }) => logoMode !== "image",
    },
    logoLink: {
        type: ControlType.Link,
        title: "Logo Link",
        defaultValue: "#",
    },
    items: {
        type: ControlType.Array,
        title: "Links",
        maxCount: 6,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "STUDIO" },
                href: { type: ControlType.Link, title: "Href", defaultValue: "#" },
            },
        },
        defaultValue: [
            { label: "STUDIO", href: "#" },
            { label: "WORK", href: "#" },
            { label: "ARCHIVE", href: "#" },
            { label: "CONTACT", href: "#" },
        ],
    },

    ctaEnabled: {
        type: ControlType.Boolean,
        title: "CTA",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    ctaLabel: {
        type: ControlType.String,
        title: "CTA Label",
        defaultValue: "Subscribe",
        hidden: ({ ctaEnabled }) => !ctaEnabled,
    },
    ctaHref: {
        type: ControlType.Link,
        title: "CTA Link",
        defaultValue: "#",
        hidden: ({ ctaEnabled }) => !ctaEnabled,
    },
    ctaVariant: {
        type: ControlType.Enum,
        title: "CTA Style",
        options: ["text", "outline", "solid"],
        optionTitles: ["Text", "Outline", "Solid"],
        defaultValue: "outline",
        displaySegmentedControl: true,
        hidden: ({ ctaEnabled }) => !ctaEnabled,
    },
    ctaBackground: {
        type: ControlType.Color,
        title: "CTA BG",
        defaultValue: "#F5F5F5",
        hidden: ({ ctaEnabled, ctaVariant }) => !ctaEnabled || ctaVariant !== "solid",
    },
    ctaBorder: {
        type: ControlType.Color,
        title: "CTA Border",
        defaultValue: "#E8E8E8",
        hidden: ({ ctaEnabled, ctaVariant }) => !ctaEnabled || ctaVariant === "text",
    },
    ctaText: {
        type: ControlType.Color,
        title: "CTA Text",
        defaultValue: "#1a1a1a",
        hidden: ({ ctaEnabled, ctaVariant }) => !ctaEnabled || ctaVariant === "text",
    },
    ctaHoverFill: {
        type: ControlType.Color,
        title: "CTA Hover",
        defaultValue: "rgba(0,0,0,0.06)",
        hidden: ({ ctaEnabled, ctaVariant }) => !ctaEnabled || ctaVariant === "text",
    },
    ctaRadius: {
        type: ControlType.BorderRadius,
        title: "CTA Radius",
        defaultValue: "6px",
        hidden: ({ ctaEnabled, ctaVariant }) => !ctaEnabled || ctaVariant === "text",
    },

    height: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 72,
        min: 48,
        max: 120,
        step: 1,
        unit: "px",
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        defaultValue: 24,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#E8E8E8",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#1a1a1a",
    },
    separatorColor: {
        type: ControlType.Color,
        title: "Separator",
        defaultValue: "#CCCCCC",
    },

    shadow: {
        type: ControlType.BoxShadow,
        title: "Scroll Shadow",
        defaultValue: "0 6px 18px rgba(0,0,0,0.06)",
    },
    scrolledLogoScale: {
        type: ControlType.Number,
        title: "Logo Scale",
        defaultValue: 0.94,
        min: 0.8,
        max: 1,
        step: 0.01,
    },

    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile ≤",
        defaultValue: 768,
        min: 320,
        max: 1200,
        step: 1,
        unit: "px",
    },
    tabletBreakpoint: {
        type: ControlType.Number,
        title: "Tablet ≤",
        defaultValue: 1024,
        min: 480,
        max: 1400,
        step: 1,
        unit: "px",
    },
    previewMobile: {
        type: ControlType.Boolean,
        title: "Canvas Mobile",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    previewTablet: {
        type: ControlType.Boolean,
        title: "Canvas Tablet",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ previewMobile }) => !!previewMobile,
    },

    overlayBackground: {
        type: ControlType.Color,
        title: "Overlay BG",
        defaultValue: "#FFFFFF",
    },

    logoFont: {
        type: ControlType.Font,
        title: "Logo Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    linkFont: {
        type: ControlType.Font,
        title: "Link Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "11px",
            variant: "Medium",
            letterSpacing: "0.15em",
            lineHeight: "1em",
        },
    },
    overlayFont: {
        type: ControlType.Font,
        title: "Overlay Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "48px",
            variant: "Regular",
            letterSpacing: "-0.02em",
            lineHeight: "1.05em",
        },
    },
    ctaFont: {
        type: ControlType.Font,
        title: "CTA Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "11px",
            variant: "Medium",
            letterSpacing: "0.15em",
            lineHeight: "1em",
        },
        hidden: ({ ctaEnabled }) => !ctaEnabled,
    },
    ctaOverlayFont: {
        type: ControlType.Font,
        title: "CTA Overlay Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "48px",
            variant: "Regular",
            letterSpacing: "-0.02em",
            lineHeight: "1.05em",
        },
        hidden: ({ ctaEnabled }) => !ctaEnabled,
    },
})
