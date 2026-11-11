// ============================================================================
// Bouncy Nav Pill— Framer Code Component
// A premium, fully-configurable floating navigation bar with a spring-based
// "bouncy" hover indicator, dropdown submenus, sticky-on-scroll, and a
// responsive mobile menu. Built for the Framer Marketplace.
//
// Author: Claude (Anthropic) — designed to be dropped straight into Framer.
// ============================================================================

import * as React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
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


// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface DropdownItem {
    label: string
    link?: string
}

interface NavItem {
    label: string
    link?: string
    dropdownItems?: DropdownItem[]
}

interface LogoSettings {
    type: "text" | "image"
    text: string
    textFont: any
    textColor: string
    image?: { src: string; srcSet?: string; alt?: string }
    imageWidth: number
    imageHeight: number
    link: string
}

interface MenuStyleSettings {
    font: any
    itemPadding: string
    itemRadius: number
    itemGap: number
    dropdownRadius: number
    dropdownGap: number
    dropdownWidth: number
    dropdownItemTextColor: string
    dropdownItemHoverTextColor: string
    dropdownItemHoverBackground: string
}

interface CtaSettings {
    enabled: boolean
    label: string
    href: string
    font: any
    padding: string
    radius: number
}

interface LayoutSettings {
    maxWidth: number
    navbarPadding: string
    borderRadius: number
    shadow: boolean
}

interface ColorSettings {
    navbarBackground: string
    borderColor: string
    textMuted: string
    menuHoverBackground: string
    menuHoverText: string
    ctaBackground: string
    ctaHoverBackground: string
    ctaText: string
    ctaHoverText: string
}

interface BouncyNavPillProps {
    logo: LogoSettings
    menuItems: NavItem[]
    menuStyle: MenuStyleSettings
    cta: CtaSettings
    layout: LayoutSettings
    colors: ColorSettings
    activePreviewIndex: number
    sticky: boolean
    stickyOffset: number
    hideOnScroll: boolean
    bounceStiffness: number
    bounceDamping: number
    mobileBreakpoint: number
}

// ----------------------------------------------------------------------------
// Icons (inline SVG — zero dependencies)
// ----------------------------------------------------------------------------

const ChevronDown = ({ size = 14, color = "currentColor" }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={{ flexShrink: 0 }}
    >
        <path
            d="M6 9L12 15L18 9"
            stroke={color}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const MenuIcon = ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
            d="M4 7H20"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
        />
        <path
            d="M4 12H20"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
        />
        <path
            d="M4 17H20"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
        />
    </svg>
)

const CloseIcon = ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
            d="M6 6L18 18"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
        />
        <path
            d="M18 6L6 18"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
        />
    </svg>
)

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

/**
 * User request: turn this existing BouncyNav Pill into a fully-featured adjustable navbar with grouped nested object property controls for logo, menu items, menu style, CTA, layout, and colors while preserving the baseline bouncy interactions.
 */

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1100
 * @framerIntrinsicHeight 64
 */
export default function BouncyNavPill(props: BouncyNavPillProps) {
    const {
        logo = {
            type: "text",
            text: "ZUN",
            textFont: {
                fontSize: "24px",
                variant: "Semibold",
                textAlign: "center",
                letterSpacing: "-0.04em",
                lineHeight: "1.1em",
            },
            textColor: "#FFFFFF",
            image: {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Gradient 1 - Blue",
            },
            imageWidth: 92,
            imageHeight: 26,
            link: "#",
        },
        menuItems = [
            { label: "Product", link: "#" },
            {
                label: "Resources",
                link: "#",
                dropdownItems: [
                    { label: "Templates", link: "#" },
                    { label: "Components", link: "#" },
                    { label: "Plugins", link: "#" },
                ],
            },
            { label: "Services", link: "#" },
            {
                label: "Socials",
                link: "#",
                dropdownItems: [
                    { label: "Instagram", link: "#" },
                    { label: "Linkedin", link: "#" },
                    { label: "Twitter", link: "#" },
                ],
            },
        ],
        menuStyle = {
            font: {
                fontSize: "16px",
                variant: "Regular",
                letterSpacing: "-0.02em",
                lineHeight: "1.1em",
            },
            itemPadding: "12px 16px 12px 16px",
            itemRadius: 999,
            itemGap: 2,
            dropdownRadius: 18,
            dropdownGap: 18,
            dropdownWidth: 200,
            dropdownItemTextColor: "rgba(255, 255, 255, 0.56)",
            dropdownItemHoverTextColor: "#FFFFFF",
            dropdownItemHoverBackground: "rgba(255, 255, 255, 0.08)",
        },
        cta = {
            enabled: true,
            label: "Join Now",
            href: "#",
            font: {
                fontSize: "16px",
                variant: "Medium",
                letterSpacing: "-0.02em",
                lineHeight: "1.1em",
            },
            padding: "14px 16px 14px 16px",
            radius: 999,
        },
        layout = {
            maxWidth: 1200,
            navbarPadding: "12px 12px 12px 24px",
            borderRadius: 36,
            shadow: true,
        },
        colors = {
            navbarBackground: "rgb(49, 46, 46)",
            borderColor: "rgb(49, 46, 46)",
            textMuted: "rgb(255, 255, 255)",
            menuHoverBackground: "rgb(0, 105, 226)",
            menuHoverText: "rgb(255, 255, 255)",
            ctaBackground: "rgb(0, 105, 226)",
            ctaHoverBackground: "rgb(255, 255, 255)",
            ctaText: "rgb(255, 255, 255)",
            ctaHoverText: "rgb(0, 0, 0)",
        },
        activePreviewIndex = -1,
        sticky = true,
        stickyOffset = 16,
        hideOnScroll = false,
        bounceStiffness = 500,
        bounceDamping = 24,
        mobileBreakpoint = 400,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer()

    // --- Responsive width measurement (element-based, works inside Framer breakpoints) ---
    const containerRef = useRef<HTMLDivElement>(null)
    const [containerWidth, setContainerWidth] = useState(
        layout.maxWidth || 1200
    )
    const isMobile = containerWidth < mobileBreakpoint

    useEffect(() => {
        if (isStatic) return
        if (!containerRef.current || typeof ResizeObserver === "undefined")
            return
        const el = containerRef.current
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                React.startTransition(() =>
                    setContainerWidth(entry.contentRect.width)
                )
            }
        })
        observer.observe(el)
        setContainerWidth(el.getBoundingClientRect().width)
        return () => observer.disconnect()
    }, [isStatic])

    // --- Hover / bounce pill state ---
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(
        isCanvas && activePreviewIndex >= 0 ? activePreviewIndex : null
    )
    const [openDropdown, setOpenDropdown] = useState<number | null>(null)
    const linkRefs = useRef<Array<HTMLDivElement | null>>([])
    const [pillStyle, setPillStyle] = useState<{
        left: number
        width: number
        opacity: number
    }>({
        left: 0,
        width: 0,
        opacity: 0,
    })

    const updatePill = useCallback(
        (index: number | null) => {
            if (isStatic) return
            if (index === null) {
                React.startTransition(() =>
                    setPillStyle((s) => ({ ...s, opacity: 0 }))
                )
                return
            }
            const el = linkRefs.current[index]
            if (!el) return
            React.startTransition(() =>
                setPillStyle({
                    left: el.offsetLeft,
                    width: el.offsetWidth,
                    opacity: 1,
                })
            )
        },
        [isStatic, menuItems]
    )

    useEffect(() => {
        if (isStatic) return
        updatePill(hoveredIndex)
    }, [isStatic, hoveredIndex, updatePill, containerWidth])

    // --- Sticky / hide on scroll ---
    const [scrolled, setScrolled] = useState(false)
    const [hidden, setHidden] = useState(false)
    const lastScrollY = useRef(0)

    useEffect(() => {
        if (isStatic) return
        if (isCanvas || !sticky || typeof window === "undefined") return
        const handleScroll = () => {
            const y = window.scrollY
            React.startTransition(() => setScrolled(y > stickyOffset))
            if (hideOnScroll) {
                React.startTransition(() =>
                    setHidden(y > lastScrollY.current && y > 160)
                )
            }
            lastScrollY.current = y
        }
        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [sticky, stickyOffset, hideOnScroll, isCanvas, isStatic])

    // --- Mobile menu open state ---
    const [mobileOpen, setMobileOpen] = useState(false)
    const [openMobileDropdown, setOpenMobileDropdown] = useState<number | null>(
        null
    )
    useEffect(() => {
        if (!isMobile) {
            React.startTransition(() => setMobileOpen(false))
            React.startTransition(() => setOpenMobileDropdown(null))
        }
    }, [isMobile])
    useEffect(() => {
        if (!mobileOpen) {
            React.startTransition(() => setOpenMobileDropdown(null))
        }
    }, [mobileOpen])

    const springBounce = {
        type: "spring" as const,
        stiffness: bounceStiffness,
        damping: bounceDamping,
    }
    const menuFont = menuStyle.font || {}
    const logoFont = logo.textFont || {}
    const ctaFont = cta.font || {}
    const mobileDropdownItemTextColor = menuStyle.dropdownItemTextColor
    const mobileDropdownItemHoverTextColor =
        menuStyle.dropdownItemHoverTextColor
    const mobileDropdownItemHoverBackground =
        menuStyle.dropdownItemHoverBackground
    const sharedItemRadius = Math.max(layout.borderRadius - 8, 999)
    const menuFontStack = menuFont.fontFamily
        ? menuFont.fontFamily
        : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

    // --------------------------------------------------------------------
    // Shared styles
    // --------------------------------------------------------------------
    const wrapperStyle: React.CSSProperties = useMemo(
        () => ({
            position: sticky && !isCanvas ? "sticky" : "relative",
            top: sticky && !isCanvas ? 0 : undefined,
            zIndex: 1000,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            fontFamily: menuFontStack,
            transform:
                hideOnScroll && hidden && !isCanvas
                    ? "translateY(-130%)"
                    : "translateY(0%)",
            transition: isStatic
                ? undefined
                : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            boxSizing: "border-box",
            padding: sticky && !isCanvas ? "16px 16px 0 16px" : "0",
        }),
        [sticky, isCanvas, hideOnScroll, hidden, menuFontStack, isStatic]
    )

    const navBarStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        maxWidth: layout.maxWidth,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxSizing: "border-box",
        padding: layout.navbarPadding,
        borderRadius: layout.borderRadius,
        background: colors.navbarBackground,
        border: `1px solid ${colors.borderColor}`,
        boxShadow: layout.shadow
            ? scrolled || !sticky
                ? "0 8px 30px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.25)"
                : "0 4px 16px rgba(0,0,0,0.18)"
            : "none",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        transition: isStatic ? undefined : "box-shadow 0.35s ease",
    }

    const linkBaseStyle: React.CSSProperties = {
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: menuStyle.itemPadding,
        fontSize: menuFont.fontSize,
        fontWeight: menuFont.fontWeight,
        letterSpacing: menuFont.letterSpacing,
        lineHeight: menuFont.lineHeight,
        fontStyle: menuFont.fontStyle,
        borderRadius: sharedItemRadius,
        cursor: "pointer",
        whiteSpace: "nowrap",
        zIndex: 2,
        textDecoration: "none",
    }

    // --------------------------------------------------------------------
    // Render
    // --------------------------------------------------------------------
    if (isStatic) {
        return (
            <div ref={containerRef} style={wrapperStyle}>
                <nav style={navBarStyle} aria-label="Primary">
                    <a
                        href={undefined}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            textDecoration: "none",
                            flexShrink: 0,
                            zIndex: 2,
                        }}
                    >
                        {logo.type === "image" && logo.image?.src ? (
                            <img
                                src={logo.image.src}
                                srcSet={logo.image.srcSet}
                                alt={logo.image.alt || logo.text || "Logo"}
                                style={{
                                    width: logo.imageWidth,
                                    height: logo.imageHeight,
                                    display: "block",
                                    objectFit: "contain",
                                }}
                            />
                        ) : (
                            <span
                                style={{
                                    fontSize: logoFont.fontSize,
                                    fontWeight: logoFont.fontWeight,
                                    color: logo.textColor,
                                    letterSpacing: logoFont.letterSpacing,
                                    lineHeight: logoFont.lineHeight,
                                    fontStyle: logoFont.fontStyle,
                                    fontFamily: logoFont.fontFamily,
                                }}
                            >
                                {logo.text}
                            </span>
                        )}
                    </a>

                    {!isMobile && (
                        <div
                            style={{
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                gap: menuStyle.itemGap,
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: 0,
                                    opacity: 0,
                                    height: "100%",
                                    background: colors.menuHoverBackground,
                                    borderRadius: sharedItemRadius,
                                    zIndex: 1,
                                    pointerEvents: "none",
                                }}
                            />
                            {menuItems.map((item, i) => (
                                <div key={i} style={{ position: "relative" }}>
                                    <a
                                        href={undefined}
                                        style={{
                                            ...linkBaseStyle,
                                            color: colors.textMuted,
                                        }}
                                    >
                                        {item.label}
                                        {item.dropdownItems &&
                                            item.dropdownItems.length > 0 && (
                                                <span
                                                    style={{ display: "flex" }}
                                                >
                                                    <ChevronDown
                                                        size={13}
                                                        color={colors.textMuted}
                                                    />
                                                </span>
                                            )}
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}

                    {!isMobile && cta.enabled && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 14,
                                flexShrink: 0,
                                zIndex: 2,
                            }}
                        >
                            <a
                                href={undefined}
                                style={{
                                    fontSize: ctaFont.fontSize,
                                    fontWeight: ctaFont.fontWeight,
                                    letterSpacing: ctaFont.letterSpacing,
                                    lineHeight: ctaFont.lineHeight,
                                    fontStyle: ctaFont.fontStyle,
                                    fontFamily: ctaFont.fontFamily,
                                    color: colors.ctaText,
                                    background: colors.ctaBackground,
                                    padding: cta.padding,
                                    borderRadius: sharedItemRadius,
                                    textDecoration: "none",
                                    display: "inline-block",
                                    cursor: "pointer",
                                }}
                            >
                                {cta.label}
                            </a>
                        </div>
                    )}

                    {isMobile && (
                        <button
                            aria-label="Open menu"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                background: colors.menuHoverBackground,
                                border: "none",
                                cursor: "pointer",
                                zIndex: 2,
                            }}
                        >
                            <MenuIcon color={colors.menuHoverText} />
                        </button>
                    )}
                </nav>
            </div>
        )
    }

    return (
        <div ref={containerRef} style={wrapperStyle}>
            <nav style={navBarStyle} aria-label="Primary">
                {/* ---------------- Logo ---------------- */}
                <a
                    href={isCanvas ? undefined : logo.link}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        textDecoration: "none",
                        flexShrink: 0,
                        zIndex: 2,
                    }}
                >
                    {logo.type === "image" && logo.image?.src ? (
                        <img
                            src={logo.image.src}
                            srcSet={logo.image.srcSet}
                            alt={logo.image.alt || logo.text || "Logo"}
                            style={{
                                width: logo.imageWidth,
                                height: logo.imageHeight,
                                display: "block",
                                objectFit: "contain",
                            }}
                        />
                    ) : (
                        <span
                            style={{
                                fontSize: logoFont.fontSize,
                                fontWeight: logoFont.fontWeight,
                                color: logo.textColor,
                                letterSpacing: logoFont.letterSpacing,
                                lineHeight: logoFont.lineHeight,
                                fontStyle: logoFont.fontStyle,
                                fontFamily: logoFont.fontFamily,
                            }}
                        >
                            {logo.text}
                        </span>
                    )}
                </a>

                {/* ---------------- Center Nav Links (desktop) ---------------- */}
                {!isMobile && (
                    <div
                        style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            gap: menuStyle.itemGap,
                        }}
                        onMouseLeave={() => {
                            React.startTransition(() =>
                                setHoveredIndex(isCanvas ? hoveredIndex : null)
                            )
                            React.startTransition(() => setOpenDropdown(null))
                        }}
                    >
                        {/* Bouncy sliding pill */}
                        {isStatic ? (
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    height: "100%",
                                    background: colors.menuHoverBackground,
                                    borderRadius: sharedItemRadius,
                                    zIndex: 1,
                                    pointerEvents: "none",
                                    left: 0,
                                    width: 0,
                                    opacity: 0,
                                }}
                            />
                        ) : (
                            <motion.div
                                animate={{
                                    left: pillStyle.left,
                                    width: pillStyle.width,
                                    opacity: pillStyle.opacity,
                                }}
                                transition={springBounce}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    height: "100%",
                                    background: colors.menuHoverBackground,
                                    borderRadius: sharedItemRadius,
                                    zIndex: 1,
                                    pointerEvents: "none",
                                }}
                            />
                        )}

                        {menuItems.map((item, i) => (
                            <div
                                key={i}
                                ref={(el) => {
                                    linkRefs.current[i] = el
                                }}
                                onMouseEnter={() => {
                                    React.startTransition(() =>
                                        setHoveredIndex(i)
                                    )
                                    if (item.dropdownItems?.length) {
                                        React.startTransition(() =>
                                            setOpenDropdown(i)
                                        )
                                    } else {
                                        React.startTransition(() =>
                                            setOpenDropdown(null)
                                        )
                                    }
                                }}
                                style={{ position: "relative" }}
                            >
                                <a
                                    href={isCanvas ? undefined : item.link}
                                    style={{
                                        ...linkBaseStyle,
                                        color:
                                            hoveredIndex === i
                                                ? colors.menuHoverText
                                                : colors.textMuted,
                                        transition: "color 0.2s ease",
                                    }}
                                >
                                    {item.label}
                                    {item.dropdownItems &&
                                        item.dropdownItems.length > 0 && (
                                            <motion.span
                                                animate={{
                                                    rotate:
                                                        openDropdown === i
                                                            ? 180
                                                            : 0,
                                                }}
                                                transition={springBounce}
                                                style={{ display: "flex" }}
                                            >
                                                <ChevronDown
                                                    size={13}
                                                    color={
                                                        hoveredIndex === i
                                                            ? colors.menuHoverText
                                                            : colors.textMuted
                                                    }
                                                />
                                            </motion.span>
                                        )}
                                </a>

                                {/* Dropdown submenu */}
                                <AnimatePresence>
                                    {item.dropdownItems &&
                                        openDropdown === i &&
                                        item.dropdownItems.length > 0 && (
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    y: -6,
                                                    scale: 0.96,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    y: 0,
                                                    scale: 1,
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    y: -6,
                                                    scale: 0.96,
                                                }}
                                                transition={springBounce}
                                                style={{
                                                    position: "absolute",
                                                    top: `calc(100% + ${menuStyle.dropdownGap}px)`,
                                                    left: 0,
                                                    minWidth:
                                                        menuStyle.dropdownWidth,
                                                    background:
                                                        colors.navbarBackground,
                                                    border: `1px solid ${colors.borderColor}`,
                                                    borderRadius:
                                                        menuStyle.dropdownRadius,
                                                    padding: 8,
                                                    boxShadow:
                                                        "0 16px 40px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.25)",
                                                    backdropFilter:
                                                        "blur(14px)",
                                                    WebkitBackdropFilter:
                                                        "blur(14px)",
                                                    zIndex: 50,
                                                }}
                                            >
                                                {item.dropdownItems.map(
                                                    (sub, si) => (
                                                        <a
                                                            key={si}
                                                            href={
                                                                isCanvas
                                                                    ? undefined
                                                                    : sub.link
                                                            }
                                                            style={{
                                                                display:
                                                                    "block",
                                                                padding:
                                                                    "10px 12px",
                                                                borderRadius:
                                                                    Math.max(
                                                                        menuStyle.dropdownRadius -
                                                                            6,
                                                                        8
                                                                    ),
                                                                textDecoration:
                                                                    "none",
                                                                color: colors.textMuted,
                                                                fontSize:
                                                                    menuFont.fontSize,
                                                                fontWeight:
                                                                    menuFont.fontWeight,
                                                                letterSpacing:
                                                                    menuFont.letterSpacing,
                                                                lineHeight:
                                                                    menuFont.lineHeight,
                                                                fontStyle:
                                                                    menuFont.fontStyle,
                                                            }}
                                                            onMouseEnter={(
                                                                e
                                                            ) => {
                                                                e.currentTarget.style.background =
                                                                    colors.menuHoverBackground
                                                                e.currentTarget.style.color =
                                                                    colors.menuHoverText
                                                            }}
                                                            onMouseLeave={(
                                                                e
                                                            ) => {
                                                                e.currentTarget.style.background =
                                                                    "transparent"
                                                                e.currentTarget.style.color =
                                                                    colors.textMuted
                                                            }}
                                                        >
                                                            {sub.label}
                                                        </a>
                                                    )
                                                )}
                                            </motion.div>
                                        )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                )}

                {/* ---------------- Right side (desktop) ---------------- */}
                {!isMobile && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            flexShrink: 0,
                            zIndex: 2,
                        }}
                    >
                        {cta.enabled && (
                            <motion.a
                                href={isCanvas ? undefined : cta.href}
                                whileTap={{ scale: 0.95 }}
                                transition={springBounce}
                                style={{
                                    fontSize: ctaFont.fontSize,
                                    fontWeight: ctaFont.fontWeight,
                                    letterSpacing: ctaFont.letterSpacing,
                                    lineHeight: ctaFont.lineHeight,
                                    fontStyle: ctaFont.fontStyle,
                                    fontFamily: ctaFont.fontFamily,
                                    color: colors.ctaText,
                                    background: colors.ctaBackground,
                                    padding: cta.padding,
                                    borderRadius: sharedItemRadius,
                                    textDecoration: "none",
                                    display: "inline-block",
                                    cursor: "pointer",
                                }}
                                onHoverStart={(e: any) => {
                                    if (e?.target)
                                        e.target.style.background =
                                            colors.ctaHoverBackground
                                    if (e?.target)
                                        e.target.style.color =
                                            colors.ctaHoverText
                                }}
                                onHoverEnd={(e: any) => {
                                    if (e?.target)
                                        e.target.style.background =
                                            colors.ctaBackground
                                    if (e?.target)
                                        e.target.style.color = colors.ctaText
                                }}
                            >
                                {cta.label}
                            </motion.a>
                        )}
                    </div>
                )}

                {/* ---------------- Mobile trigger ---------------- */}
                {isMobile && (
                    <motion.button
                        onClick={() =>
                            React.startTransition(() =>
                                setMobileOpen((v) => !v)
                            )
                        }
                        whileTap={{ scale: 0.9 }}
                        transition={springBounce}
                        aria-label={mobileOpen ? "Close menu" : "Open menu"}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: colors.menuHoverBackground,
                            border: "none",
                            cursor: "pointer",
                            zIndex: 2,
                        }}
                    >
                        {mobileOpen ? (
                            <CloseIcon color={colors.menuHoverText} />
                        ) : (
                            <MenuIcon color={colors.menuHoverText} />
                        )}
                    </motion.button>
                )}
            </nav>

            {/* ---------------- Mobile dropdown panel ---------------- */}
            <AnimatePresence>
                {isMobile && mobileOpen && (
                    <motion.div
                        layout={false}
                        initial={{ opacity: 0, y: -12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.97 }}
                        transition={springBounce}
                        style={{
                            position: "relative",
                            width: navBarStyle.width,
                            maxWidth: navBarStyle.maxWidth,
                            marginTop: 12,
                            background: colors.navbarBackground,
                            border: `1px solid ${colors.borderColor}`,
                            borderRadius: 20,
                            padding: 12,
                            boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
                            backdropFilter: "blur(14px)",
                            WebkitBackdropFilter: "blur(14px)",
                            zIndex: 999,
                            fontFamily: menuFontStack,
                        }}
                    >
                        {menuItems.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    ...springBounce,
                                    delay: i * 0.04,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        width: "100%",
                                        padding: menuStyle.itemPadding,
                                        fontSize: menuFont.fontSize,
                                        fontWeight: menuFont.fontWeight,
                                        letterSpacing: menuFont.letterSpacing,
                                        lineHeight: menuFont.lineHeight,
                                        color: colors.menuHoverText,
                                        borderRadius: sharedItemRadius,
                                        boxSizing: "border-box",
                                    }}
                                >
                                    <a
                                        href={isCanvas ? undefined : item.link}
                                        style={{
                                            color: colors.menuHoverText,
                                            textDecoration: "none",
                                            flex: 1,
                                            minWidth: 0,
                                        }}
                                    >
                                        {item.label}
                                    </a>
                                    {item.dropdownItems &&
                                        item.dropdownItems.length > 0 && (
                                            <motion.button
                                                type="button"
                                                onClick={() =>
                                                    React.startTransition(() =>
                                                        setOpenMobileDropdown(
                                                            (prev) =>
                                                                prev === i
                                                                    ? null
                                                                    : i
                                                        )
                                                    )
                                                }
                                                animate={{
                                                    rotate:
                                                        openMobileDropdown === i
                                                            ? 180
                                                            : 0,
                                                }}
                                                transition={springBounce}
                                                style={{
                                                    border: "none",
                                                    background: "transparent",
                                                    color: colors.textMuted,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    width: 28,
                                                    height: 28,
                                                    cursor: "pointer",
                                                    flexShrink: 0,
                                                    padding: 0,
                                                }}
                                                aria-label={
                                                    openMobileDropdown === i
                                                        ? `Collapse ${item.label}`
                                                        : `Expand ${item.label}`
                                                }
                                            >
                                                <ChevronDown
                                                    color={colors.textMuted}
                                                />
                                            </motion.button>
                                        )}
                                </div>
                                <AnimatePresence initial={false}>
                                    {item.dropdownItems &&
                                        item.dropdownItems.length > 0 &&
                                        openMobileDropdown === i && (
                                            <motion.div
                                                initial={{
                                                    height: 0,
                                                    opacity: 0,
                                                }}
                                                animate={{
                                                    height: "auto",
                                                    opacity: 1,
                                                }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={springBounce}
                                                style={{
                                                    overflow: "hidden",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: 4,
                                                        padding: "4px 0 6px 0",
                                                    }}
                                                >
                                                    {item.dropdownItems.map(
                                                        (sub, si) => (
                                                            <a
                                                                key={si}
                                                                href={
                                                                    isCanvas
                                                                        ? undefined
                                                                        : sub.link
                                                                }
                                                                style={{
                                                                    display:
                                                                        "block",
                                                                    width: "100%",
                                                                    boxSizing:
                                                                        "border-box",
                                                                    padding:
                                                                        "10px 14px 10px 28px",
                                                                    fontSize:
                                                                        menuFont.fontSize,
                                                                    fontWeight:
                                                                        menuFont.fontWeight,
                                                                    letterSpacing:
                                                                        menuFont.letterSpacing,
                                                                    lineHeight:
                                                                        menuFont.lineHeight,
                                                                    color: mobileDropdownItemTextColor,
                                                                    textDecoration:
                                                                        "none",
                                                                    borderRadius:
                                                                        sharedItemRadius,
                                                                }}
                                                                onMouseEnter={(
                                                                    e
                                                                ) => {
                                                                    e.currentTarget.style.background =
                                                                        mobileDropdownItemHoverBackground
                                                                    e.currentTarget.style.color =
                                                                        mobileDropdownItemHoverTextColor
                                                                }}
                                                                onMouseLeave={(
                                                                    e
                                                                ) => {
                                                                    e.currentTarget.style.background =
                                                                        "transparent"
                                                                    e.currentTarget.style.color =
                                                                        mobileDropdownItemTextColor
                                                                }}
                                                            >
                                                                {sub.label}
                                                            </a>
                                                        )
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                </AnimatePresence>
                            </motion.div>
                        ))}

                        <div
                            style={{
                                height: 1,
                                background: colors.borderColor,
                                margin: "8px 6px",
                            }}
                        />

                        {cta.enabled && (
                            <motion.a
                                href={isCanvas ? undefined : cta.href}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileTap={{ scale: 0.96 }}
                                transition={{
                                    ...springBounce,
                                    delay: menuItems.length * 0.04 + 0.05,
                                }}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    boxSizing: "border-box",
                                    textAlign: "center",
                                    marginTop: 6,
                                    padding: cta.padding,
                                    fontSize: ctaFont.fontSize,
                                    fontWeight: ctaFont.fontWeight,
                                    color: colors.ctaText,
                                    background: colors.ctaBackground,
                                    textDecoration: "none",
                                    borderRadius: sharedItemRadius,
                                }}
                            >
                                {cta.label}
                            </motion.a>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ----------------------------------------------------------------------------
// Property Controls — organized panel for the Framer Marketplace
// ----------------------------------------------------------------------------

addPropertyControls(BouncyNavPill, {
    logo: {
        type: ControlType.Object,
        title: "Logo",
        controls: {
            type: {
                type: ControlType.Enum,
                options: ["text", "image"],
                optionTitles: ["Text", "Image"],
                defaultValue: "text",
            },
            text: {
                type: ControlType.String,
                defaultValue: "ZUN",
                hidden: (value: any) => value?.type !== "text",
            },
            textFont: {
                type: ControlType.Font,
                controls: "extended",
                defaultFontType: "sans-serif",
                hidden: (value: any) => value?.type !== "text",
                defaultValue: {
                    fontSize: "24px",
                    variant: "Semibold",
                    textAlign: "center",
                    letterSpacing: "-0.04em",
                    lineHeight: "1.1em",
                },
            },
            textColor: {
                type: ControlType.Color,
                defaultValue: "#FFFFFF",
                hidden: (value: any) => value?.type !== "text",
            },
            image: {
                type: ControlType.ResponsiveImage,
                hidden: (value: any) => value?.type !== "image",
            },
            imageWidth: {
                type: ControlType.Number,
                min: 20,
                max: 260,
                step: 1,
                defaultValue: 92,
                hidden: (value: any) => value?.type !== "image",
            },
            imageHeight: {
                type: ControlType.Number,
                min: 12,
                max: 120,
                step: 1,
                defaultValue: 26,
                hidden: (value: any) => value?.type !== "image",
            },
            link: {
                type: ControlType.Link,
                defaultValue: "#",
            },
        },
    },
    menuItems: {
        type: ControlType.Array,
        title: "Menu Items",
        maxCount: 8,
        defaultValue: [
            { label: "Product", link: "#" },
            {
                label: "Resources",
                link: "#",
                dropdownItems: [
                    { label: "Templates", link: "#" },
                    { label: "Components", link: "#" },
                    { label: "Plugins", link: "#" },
                ],
            },
            { label: "Services", link: "#" },
            {
                label: "Socials",
                link: "#",
                dropdownItems: [
                    { label: "Instagram", link: "#" },
                    { label: "Linkedin", link: "#" },
                    { label: "Twitter", link: "#" },
                ],
            },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Link",
                },
                link: { type: ControlType.Link, title: "Link" },
                dropdownItems: {
                    type: ControlType.Array,
                    title: "Dropdown Items",
                    defaultValue: [{ label: "Item", link: "#" }],
                    control: {
                        type: ControlType.Object,
                        controls: {
                            label: {
                                type: ControlType.String,
                                title: "Label",
                                defaultValue: "Item",
                            },
                            link: { type: ControlType.Link, title: "Link" },
                        },
                    },
                },
            },
        },
    },
    menuStyle: {
        type: ControlType.Object,
        title: "Menu Style",
        controls: {
            font: {
                type: ControlType.Font,
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "16px",
                    variant: "Regular",
                    letterSpacing: "-0.02em",
                    lineHeight: "1.1em",
                },
            },
            itemPadding: {
                type: ControlType.Padding,
                defaultValue: "12px 16px 12px 16px",
            },
            itemRadius: {
                type: ControlType.Number,
                min: 0,
                max: 999,
                step: 1,
                defaultValue: 999,
            },
            itemGap: {
                type: ControlType.Number,
                min: 0,
                max: 24,
                step: 1,
                defaultValue: 2,
            },
            dropdownRadius: {
                type: ControlType.Number,
                min: 0,
                max: 40,
                step: 1,
                defaultValue: 18,
            },
            dropdownGap: {
                type: ControlType.Number,
                min: 0,
                max: 40,
                step: 1,
                defaultValue: 18,
            },
            dropdownWidth: {
                type: ControlType.Number,
                min: 120,
                max: 360,
                step: 2,
                defaultValue: 200,
            },
            dropdownItemTextColor: {
                type: ControlType.Color,
                defaultValue: "rgba(255, 255, 255, 0.56)",
            },
            dropdownItemHoverTextColor: {
                type: ControlType.Color,
                defaultValue: "#FFFFFF",
            },
            dropdownItemHoverBackground: {
                type: ControlType.Color,
                defaultValue: "rgba(255, 255, 255, 0.08)",
            },
        },
    },
    cta: {
        type: ControlType.Object,
        title: "CTA",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                defaultValue: true,
            },
            label: {
                type: ControlType.String,
                defaultValue: "Join Now",
                hidden: (value: any) => !value?.enabled,
            },
            href: {
                type: ControlType.Link,
                defaultValue: "#",
                hidden: (value: any) => !value?.enabled,
            },
            font: {
                type: ControlType.Font,
                controls: "extended",
                defaultFontType: "sans-serif",
                hidden: (value: any) => !value?.enabled,
                defaultValue: {
                    variant: "Medium",
                    fontSize: "16px",
                    letterSpacing: "-0.02em",
                    lineHeight: "1.1em",
                },
            },
            padding: {
                type: ControlType.Padding,
                defaultValue: "14px 16px 14px 16px",
                hidden: (value: any) => !value?.enabled,
            },
            radius: {
                type: ControlType.Number,
                min: 0,
                max: 999,
                step: 1,
                defaultValue: 999,
                hidden: (value: any) => !value?.enabled,
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            maxWidth: {
                type: ControlType.Number,
                min: 480,
                max: 1600,
                step: 10,
                defaultValue: 1200,
            },
            navbarPadding: {
                type: ControlType.Padding,
                defaultValue: "12px 12px 12px 24px",
            },
            borderRadius: {
                type: ControlType.Number,
                min: 0,
                max: 999,
                step: 1,
                defaultValue: 36,
            },
            shadow: {
                type: ControlType.Boolean,
                defaultValue: true,
            },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            navbarBackground: {
                type: ControlType.Color,
                defaultValue: "rgb(49, 46, 46)",
            },
            borderColor: {
                type: ControlType.Color,
                defaultValue: "rgb(49, 46, 46)",
            },
            textMuted: {
                type: ControlType.Color,
                defaultValue: "rgb(255, 255, 255)",
            },
            menuHoverBackground: {
                type: ControlType.Color,
                defaultValue: "rgb(0, 105, 226)",
            },
            menuHoverText: {
                type: ControlType.Color,
                defaultValue: "rgb(255, 255, 255)",
            },
            ctaBackground: {
                type: ControlType.Color,
                defaultValue: "rgb(0, 105, 226)",
            },
            ctaHoverBackground: {
                type: ControlType.Color,
                defaultValue: "rgb(255, 255, 255)",
            },
            ctaText: {
                type: ControlType.Color,
                defaultValue: "rgb(255, 255, 255)",
            },
            ctaHoverText: {
                type: ControlType.Color,
                defaultValue: "rgb(0, 0, 0)",
            },
        },
    },
    activePreviewIndex: {
        type: ControlType.Number,
        title: "Canvas Preview",
        min: -1,
        max: 7,
        step: 1,
        defaultValue: -1,
        description:
            "Highlights a link on the canvas only (for design preview).",
    },

    sticky: {
        type: ControlType.Boolean,
        title: "Sticky",
        defaultValue: true,
    },
    stickyOffset: {
        type: ControlType.Number,
        title: "Sticky Offset",
        min: 0,
        max: 200,
        step: 1,
        defaultValue: 16,
        hidden: (props) => !props.sticky,
    },
    hideOnScroll: {
        type: ControlType.Boolean,
        title: "Hide on Scroll Down",
        defaultValue: false,
        hidden: (props) => !props.sticky,
    },
    bounceStiffness: {
        type: ControlType.Number,
        title: "Bounce Stiffness",
        min: 100,
        max: 1000,
        step: 10,
        defaultValue: 500,
    },
    bounceDamping: {
        type: ControlType.Number,
        title: "Bounce Damping",
        min: 5,
        max: 60,
        step: 1,
        defaultValue: 24,
        description: "Lower = more bounce/overshoot. Higher = smoother.",
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile Breakpoint",
        min: 400,
        max: 1200,
        step: 10,
        defaultValue: 400,
    },
})
