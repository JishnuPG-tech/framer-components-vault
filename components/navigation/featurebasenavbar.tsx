// Create a fully responsive, pixel-perfect navigation bar component in Framer that exactly replicates the Featurebase (featurebase.app) navbar, including announcement bar, sticky blurred navbar, desktop/mobile layouts, scroll shadow, dismissal persistence, and accessibility.
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
} from "react"
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

type NavItem = {
    label: string
    href: string
    hasDropdown?: boolean
    dropdownItems?: Array<{ label: string; href: string; description?: string }>
}

type ResponsiveImageLike = {
    src: string
    srcSet?: string
    alt?: string
}

interface FeaturebaseNavbarProps {
    showAnnouncementBar: boolean
    announcementText: string
    announcementHref: string

    logoIcon?: ResponsiveImageLike
    logoText: string

    primaryColor: string

    loginLabel: string
    loginHref: string

    ctaLabel: string
    ctaHref: string

    // Individual menu items with dropdown support
    showProductsMenu: boolean
    productsLabel: string
    productsHref: string
    productsHasDropdown: boolean
    productsDropdownItems: Array<{ label: string; href: string; description: string }>

    showPricingMenu: boolean
    pricingLabel: string
    pricingHref: string
    pricingHasDropdown: boolean
    pricingDropdownItems: Array<{ label: string; href: string; description: string }>

    showCustomersMenu: boolean
    customersLabel: string
    customersHref: string
    customersHasDropdown: boolean
    customersDropdownItems: Array<{ label: string; href: string; description: string }>

    showResourcesMenu: boolean
    resourcesLabel: string
    resourcesHref: string
    resourcesHasDropdown: boolean
    resourcesDropdownItems: Array<{ label: string; href: string; description: string }>

    showScrollShadow: boolean
    mobileBreakpoint: number

    announcementFont: any
    brandFont: any
    navFont: any
    ctaFont: any
    mobileMenuFont: any
    dropdownFont: any

    style?: CSSProperties
}

const STORAGE_KEY = "framer_featurebase_nav_announcement_dismissed_v1"

/**
 * Featurebase Navbar
 *
 * @framerIntrinsicWidth 1280
 * @framerIntrinsicHeight 100
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function FeaturebaseNavbar(props: FeaturebaseNavbarProps) {
    const {
        showAnnouncementBar,
        announcementText,
        announcementHref,

        logoIcon = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Featurebase logo",
        },
        logoText,

        primaryColor,

        loginLabel,
        loginHref,

        ctaLabel,
        ctaHref,

        showProductsMenu,
        productsLabel,
        productsHref,
        productsHasDropdown,
        productsDropdownItems,

        showPricingMenu,
        pricingLabel,
        pricingHref,
        pricingHasDropdown,
        pricingDropdownItems,

        showCustomersMenu,
        customersLabel,
        customersHref,
        customersHasDropdown,
        customersDropdownItems,

        showResourcesMenu,
        resourcesLabel,
        resourcesHref,
        resourcesHasDropdown,
        resourcesDropdownItems,

        showScrollShadow,
        mobileBreakpoint,

        announcementFont,
        brandFont,
        navFont,
        ctaFont,
        mobileMenuFont,
        dropdownFont,

        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const [announcementDismissed, setAnnouncementDismissed] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)

    // Build navItems from individual props
    const navItems = useMemo(() => {
        const items: NavItem[] = []
        
        if (showProductsMenu) {
            items.push({
                label: productsLabel,
                href: productsHref,
                hasDropdown: productsHasDropdown,
                dropdownItems: productsDropdownItems,
            })
        }
        
        if (showPricingMenu) {
            items.push({
                label: pricingLabel,
                href: pricingHref,
                hasDropdown: pricingHasDropdown,
                dropdownItems: pricingDropdownItems,
            })
        }
        
        if (showCustomersMenu) {
            items.push({
                label: customersLabel,
                href: customersHref,
                hasDropdown: customersHasDropdown,
                dropdownItems: customersDropdownItems,
            })
        }
        
        if (showResourcesMenu) {
            items.push({
                label: resourcesLabel,
                href: resourcesHref,
                hasDropdown: resourcesHasDropdown,
                dropdownItems: resourcesDropdownItems,
            })
        }
        
        return items
    }, [
        showProductsMenu, productsLabel, productsHref, productsHasDropdown, productsDropdownItems,
        showPricingMenu, pricingLabel, pricingHref, pricingHasDropdown, pricingDropdownItems,
        showCustomersMenu, customersLabel, customersHref, customersHasDropdown, customersDropdownItems,
        showResourcesMenu, resourcesLabel, resourcesHref, resourcesHasDropdown, resourcesDropdownItems,
    ])

    const announcementVisible = showAnnouncementBar && !announcementDismissed
    const stickyTop = announcementVisible ? 36 : 0

    const focusRing = useMemo(() => {
        return `0 0 0 2px ${primaryColor}, 0 0 0 4px rgba(255,255,255,1)`
    }, [primaryColor])

    const closeMobileMenu = useCallback(() => {
        startTransition(() => setMobileMenuOpen(false))
    }, [])

    const closeDropdown = useCallback(() => {
        startTransition(() => setOpenDropdown(null))
    }, [])

    const onDismissAnnouncement = useCallback(() => {
        startTransition(() => setAnnouncementDismissed(true))
        if (typeof window !== "undefined") {
            try {
                window.localStorage.setItem(STORAGE_KEY, "1")
            } catch (e) {
                // ignore
            }
        }
    }, [])

    const onToggleMobileMenu = useCallback(() => {
        startTransition(() => setMobileMenuOpen((v) => !v))
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        try {
            const dismissed = window.localStorage.getItem(STORAGE_KEY) === "1"
            startTransition(() => setAnnouncementDismissed(dismissed))
        } catch (e) {
            // ignore
        }
    }, [])

    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return

        const mq = window.matchMedia(`(max-width: ${Math.max(0, mobileBreakpoint)}px)`)

        const apply = () => {
            const next = mq.matches
            startTransition(() => setIsMobile(next))
            if (!next) startTransition(() => setMobileMenuOpen(false))
        }

        apply()
        if (typeof mq.addEventListener === "function") {
            mq.addEventListener("change", apply)
            return () => mq.removeEventListener("change", apply)
        }

        // Safari fallback
        // @ts-ignore
        mq.addListener(apply)
        // @ts-ignore
        return () => mq.removeListener(apply)
    }, [isStatic, mobileBreakpoint])

    useEffect(() => {
        if (isStatic) return
        if (!showScrollShadow) return
        if (typeof window === "undefined") return

        const onScroll = () => {
            const y = window.scrollY || 0
            startTransition(() => setScrolled(y > 0))
        }
        onScroll()
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [isStatic, showScrollShadow])

    useEffect(() => {
        if (!mobileMenuOpen) return
        if (typeof window === "undefined") return

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeMobileMenu()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [mobileMenuOpen, closeMobileMenu])

    // Close dropdown on escape
    useEffect(() => {
        if (!openDropdown) return
        if (typeof window === "undefined") return

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeDropdown()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [openDropdown, closeDropdown])

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!openDropdown) return
        if (typeof window === "undefined") return

        const onClick = () => closeDropdown()
        window.addEventListener("click", onClick)
        return () => window.removeEventListener("click", onClick)
    }, [openDropdown, closeDropdown])

    const rootStyle: CSSProperties = useMemo(() => {
        return {
            ...style,
            position: "relative",
            width: "100%",
            overflow: "visible",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
        }
    }, [style])

    const desktopPadX = 40
    const mobilePadX = 20

    const navHeight = isMobile ? 56 : 64

    // Add responsive padding that scales between mobile and desktop
    const responsivePadX = isMobile ? mobilePadX : desktopPadX

    const linkBaseFocus: CSSProperties = useMemo(
        () => ({
            outline: "none",
        }),
        [],
    )

    const interactiveFocusStyle: CSSProperties = useMemo(
        () => ({
            boxShadow: focusRing,
        }),
        [focusRing],
    )

    const [hoveredNav, setHoveredNav] = useState<string | null>(null)
    const [focusedId, setFocusedId] = useState<string | null>(null)

    const makeIsFocused = useCallback(
        (id: string) => {
            return focusedId === id
        },
        [focusedId],
    )

    const makeIsHovered = useCallback(
        (id: string) => {
            return hoveredNav === id
        },
        [hoveredNav],
    )

    const shadow = useMemo(() => {
        return scrolled && showScrollShadow ? "0 2px 8px rgba(0,0,0,0.08)" : "none"
    }, [scrolled, showScrollShadow])

    const navbarBackground = useMemo(() => {
        return "rgba(255, 255, 255, 0.8)"
    }, [])

    const innerWrapStyle: CSSProperties = useMemo(() => {
        return {
            height: "100%",
            width: "100%",
            maxWidth: 1280,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
        }
    }, [])

    const logoNode = useMemo(() => {
        const logoHovered = makeIsHovered("logo")
        const logoFocused = makeIsFocused("logo")

        return (
            <a
                href="/"
                aria-label={logoText}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    textDecoration: "none",
                    padding: "6px 10px",
                    borderRadius: 10,
                    ...linkBaseFocus,
                    ...(logoFocused ? interactiveFocusStyle : null),
                }}
                onMouseEnter={() => startTransition(() => setHoveredNav("logo"))}
                onMouseLeave={() => startTransition(() => setHoveredNav(null))}
                onFocus={() => startTransition(() => setFocusedId("logo"))}
                onBlur={() => startTransition(() => setFocusedId(null))}
            >
                <img
                    {...logoIcon}
                    style={{
                        width: 32,
                        height: 32,
                        objectFit: "contain",
                        borderRadius: 6,
                    }}
                />
                <span
                    style={{
                        ...brandFont,
                        color: logoHovered ? "#111827" : "#0F172A",
                        transition: "color 150ms ease",
                    }}
                >
                    {logoText}
                </span>
            </a>
        )
    }, [logoIcon, logoText, brandFont, makeIsHovered, makeIsFocused, linkBaseFocus, interactiveFocusStyle])

    const desktopNav = useMemo(() => {
        if (isMobile) return null

        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    justifyContent: "center",
                }}
            >
                {navItems.map((item, idx) => {
                    const id = `nav-${idx}`
                    const isFocused = makeIsFocused(id)
                    const isHovered = makeIsHovered(id)
                    const isOpen = openDropdown === id
                    const hasDropdown = item.hasDropdown && item.dropdownItems && item.dropdownItems.length > 0

                    return (
                        <div key={id} style={{ position: "relative" }}>
                            <a
                                href={hasDropdown ? undefined : item.href}
                                onClick={(e) => {
                                    if (hasDropdown) {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        startTransition(() => setOpenDropdown(isOpen ? null : id))
                                    }
                                }}
                                style={{
                                    ...navFont,
                                    color: isHovered || isOpen ? "#111827" : "#64748B",
                                    textDecoration: "none",
                                    padding: "8px 14px",
                                    borderRadius: 10,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    cursor: "pointer",
                                    transition: "color 150ms ease",
                                    ...linkBaseFocus,
                                    ...(isFocused ? interactiveFocusStyle : null),
                                }}
                                onMouseEnter={() => startTransition(() => setHoveredNav(id))}
                                onMouseLeave={() => startTransition(() => setHoveredNav(null))}
                                onFocus={() => startTransition(() => setFocusedId(id))}
                                onBlur={() => startTransition(() => setFocusedId(null))}
                            >
                                <span>{item.label}</span>
                                {hasDropdown && (
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 12 12"
                                        fill="none"
                                        style={{
                                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                                            transition: "transform 150ms ease",
                                        }}
                                    >
                                        <path
                                            d="M3 5L6 8L9 5"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                )}
                            </a>

                            {hasDropdown && isOpen && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "calc(100% + 8px)",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        background: "#FFFFFF",
                                        borderRadius: 12,
                                        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                                        border: "1px solid #F1F5F9",
                                        padding: 8,
                                        minWidth: 240,
                                        zIndex: 1000,
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {item.dropdownItems?.map((dropItem, dropIdx) => (
                                        <a
                                            key={dropIdx}
                                            href={dropItem.href}
                                            style={{
                                                ...dropdownFont,
                                                color: "#0F172A",
                                                textDecoration: "none",
                                                padding: "12px 14px",
                                                borderRadius: 8,
                                                display: "block",
                                                transition: "background 150ms ease",
                                                ...linkBaseFocus,
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = "#F9FAFB"
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = "transparent"
                                            }}
                                        >
                                            <div style={{ fontWeight: 600, marginBottom: dropItem.description ? 4 : 0 }}>
                                                {dropItem.label}
                                            </div>
                                            {dropItem.description && (
                                                <div style={{ fontSize: 13, color: "#64748B", lineHeight: "1.4em" }}>
                                                    {dropItem.description}
                                                </div>
                                            )}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        )
    }, [isMobile, navItems, makeIsFocused, makeIsHovered, openDropdown, navFont, linkBaseFocus, interactiveFocusStyle, dropdownFont])

    const rightSide = useMemo(() => {
        if (isMobile) {
            const hamburgerHovered = makeIsHovered("hamburger")
            const hamburgerFocused = makeIsFocused("hamburger")

            return (
                <button
                    type="button"
                    aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={mobileMenuOpen}
                    onClick={onToggleMobileMenu}
                    style={{
                        appearance: "none",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        padding: "8px",
                        borderRadius: 8,
                        display: "grid",
                        placeItems: "center",
                        color: hamburgerHovered ? "#111827" : "#64748B",
                        transition: "color 150ms ease",
                        ...linkBaseFocus,
                        ...(hamburgerFocused ? interactiveFocusStyle : null),
                    }}
                    onMouseEnter={() => startTransition(() => setHoveredNav("hamburger"))}
                    onMouseLeave={() => startTransition(() => setHoveredNav(null))}
                    onFocus={() => startTransition(() => setFocusedId("hamburger"))}
                    onBlur={() => startTransition(() => setFocusedId(null))}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        {mobileMenuOpen ? (
                            <path
                                d="M6 6L18 18M18 6L6 18"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        ) : (
                            <>
                                <path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </>
                        )}
                    </svg>
                </button>
            )
        }

        const loginHovered = makeIsHovered("login")
        const loginFocused = makeIsFocused("login")
        const ctaHovered = makeIsHovered("cta")
        const ctaFocused = makeIsFocused("cta")

        return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <a
                    href={loginHref}
                    aria-label={loginLabel}
                    style={{
                        ...ctaFont,
                        color: loginHovered ? "#111827" : "#64748B",
                        textDecoration: "none",
                        padding: "8px 16px",
                        borderRadius: 10,
                        transition: "color 150ms ease",
                        ...linkBaseFocus,
                        ...(loginFocused ? interactiveFocusStyle : null),
                    }}
                    onMouseEnter={() => startTransition(() => setHoveredNav("login"))}
                    onMouseLeave={() => startTransition(() => setHoveredNav(null))}
                    onFocus={() => startTransition(() => setFocusedId("login"))}
                    onBlur={() => startTransition(() => setFocusedId(null))}
                >
                    {loginLabel}
                </a>
                <a
                    href={ctaHref}
                    aria-label={ctaLabel}
                    style={{
                        ...ctaFont,
                        color: "#FFFFFF",
                        textDecoration: "none",
                        padding: "10px 18px",
                        borderRadius: 999,
                        background: ctaHovered ? primaryColor : primaryColor,
                        opacity: ctaHovered ? 0.9 : 1,
                        transition: "opacity 150ms ease",
                        ...linkBaseFocus,
                        ...(ctaFocused ? interactiveFocusStyle : null),
                    }}
                    onMouseEnter={() => startTransition(() => setHoveredNav("cta"))}
                    onMouseLeave={() => startTransition(() => setHoveredNav(null))}
                    onFocus={() => startTransition(() => setFocusedId("cta"))}
                    onBlur={() => startTransition(() => setFocusedId(null))}
                >
                    {ctaLabel}
                </a>
            </div>
        )
    }, [
        isMobile,
        makeIsHovered,
        makeIsFocused,
        mobileMenuOpen,
        onToggleMobileMenu,
        linkBaseFocus,
        interactiveFocusStyle,
        loginHref,
        loginLabel,
        ctaFont,
        ctaHref,
        ctaLabel,
        primaryColor,
    ])

    const announcementBarNode = useMemo(() => {
        if (!announcementVisible) return null

        const closeHovered = makeIsHovered("ann-close")
        const closeFocused = makeIsFocused("ann-close")

        const linkHovered = makeIsHovered("ann-link")
        const linkFocused = makeIsFocused("ann-link")

        return (
            <div
                style={{
                    height: 36,
                    width: "100%",
                    background: "#F5F3FF",
                    borderBottom: "1px solid #E0E7FF",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 48px",
                    boxSizing: "border-box",
                }}
                role="region"
                aria-label="Announcement"
            >
                <a
                    href={announcementHref}
                    style={{
                        ...announcementFont,
                        color: linkHovered ? "#4338CA" : primaryColor,
                        textDecoration: "none",
                        lineHeight: "36px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "0 10px",
                        borderRadius: 6,
                        transition: "color 150ms ease",
                        whiteSpace: "nowrap",
                        ...linkBaseFocus,
                        ...(linkFocused ? interactiveFocusStyle : null),
                    }}
                    onMouseEnter={() => startTransition(() => setHoveredNav("ann-link"))}
                    onMouseLeave={() => startTransition(() => setHoveredNav(null))}
                    onFocus={() => startTransition(() => setFocusedId("ann-link"))}
                    onBlur={() => startTransition(() => setFocusedId(null))}
                >
                    <span>{announcementText}</span>
                    <span aria-hidden="true">→</span>
                </a>

                <button
                    type="button"
                    aria-label="Dismiss announcement"
                    onClick={onDismissAnnouncement}
                    style={{
                        position: "absolute",
                        right: 16,
                        top: "50%",
                        transform: "translateY(-50%)",
                        height: 24,
                        width: 24,
                        borderRadius: 6,
                        appearance: "none",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: closeHovered ? "#111827" : "#6B7280",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "color 150ms ease",
                        ...linkBaseFocus,
                        ...(closeFocused ? interactiveFocusStyle : null),
                    }}
                    onMouseEnter={() => startTransition(() => setHoveredNav("ann-close"))}
                    onMouseLeave={() => startTransition(() => setHoveredNav(null))}
                    onFocus={() => startTransition(() => setFocusedId("ann-close"))}
                    onBlur={() => startTransition(() => setFocusedId(null))}
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path
                            d="M2 2L10 10M10 2L2 10"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
            </div>
        )
    }, [
        announcementFont,
        announcementHref,
        announcementText,
        announcementVisible,
        interactiveFocusStyle,
        linkBaseFocus,
        makeIsFocused,
        makeIsHovered,
        onDismissAnnouncement,
        primaryColor,
    ])

    const mobileMenuPanel = useMemo(() => {
        if (!isMobile) return null

        const panel = (
            <motion.div
                key="panel"
                role="dialog"
                aria-label="Mobile menu"
                initial={isStatic ? false : { opacity: 0, y: -8 }}
                animate={isStatic ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                exit={isStatic ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                style={{
                    width: "100%",
                    background: "#FFFFFF",
                    borderBottom: "1px solid #F1F5F9",
                    boxShadow: shadow,
                    maxHeight: "calc(100vh - 56px)",
                    overflowY: "auto",
                }}
            >
                <div
                    style={{
                        padding: 24,
                        boxSizing: "border-box",
                        width: "100%",
                        maxWidth: 1280,
                        margin: "0 auto",
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {navItems.map((item, idx) => {
                            const id = `mitem-${idx}`
                            const isFocused = makeIsFocused(id)
                            const isHovered = makeIsHovered(id)
                            const isOpen = openDropdown === id
                            const hasDropdown = item.hasDropdown && item.dropdownItems && item.dropdownItems.length > 0

                            return (
                                <div key={id} style={{ marginBottom: 8 }}>
                                    <a
                                        href={hasDropdown ? undefined : item.href}
                                        onClick={(e) => {
                                            if (hasDropdown) {
                                                e.preventDefault()
                                                startTransition(() => setOpenDropdown(isOpen ? null : id))
                                            } else {
                                                closeMobileMenu()
                                            }
                                        }}
                                        style={{
                                            ...mobileMenuFont,
                                            fontSize: 18,
                                            fontWeight: 500,
                                            color: isHovered || isOpen ? "#111827" : "#0F172A",
                                            textDecoration: "none",
                                            padding: "14px 6px",
                                            borderRadius: 10,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            cursor: "pointer",
                                            ...linkBaseFocus,
                                            ...(isFocused ? interactiveFocusStyle : null),
                                            transition: "color 150ms ease",
                                        }}
                                        onMouseEnter={() => startTransition(() => setHoveredNav(id))}
                                        onMouseLeave={() => startTransition(() => setHoveredNav(null))}
                                        onFocus={() => startTransition(() => setFocusedId(id))}
                                        onBlur={() => startTransition(() => setFocusedId(null))}
                                    >
                                        <span>{item.label}</span>
                                        {hasDropdown && (
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 16 16"
                                                fill="none"
                                                style={{
                                                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                                                    transition: "transform 150ms ease",
                                                }}
                                            >
                                                <path
                                                    d="M4 6L8 10L12 6"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        )}
                                    </a>

                                    {hasDropdown && isOpen && (
                                        <div
                                            style={{
                                                paddingLeft: 16,
                                                paddingTop: 8,
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 4,
                                            }}
                                        >
                                            {item.dropdownItems?.map((dropItem, dropIdx) => (
                                                <a
                                                    key={dropIdx}
                                                    href={dropItem.href}
                                                    onClick={closeMobileMenu}
                                                    style={{
                                                        ...mobileMenuFont,
                                                        fontSize: 15,
                                                        fontWeight: 400,
                                                        color: "#64748B",
                                                        textDecoration: "none",
                                                        padding: "10px 12px",
                                                        borderRadius: 8,
                                                        display: "block",
                                                        transition: "background 150ms ease, color 150ms ease",
                                                        ...linkBaseFocus,
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = "#F9FAFB"
                                                        e.currentTarget.style.color = "#0F172A"
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = "transparent"
                                                        e.currentTarget.style.color = "#64748B"
                                                    }}
                                                >
                                                    <div style={{ fontWeight: 500, marginBottom: dropItem.description ? 4 : 0 }}>
                                                        {dropItem.label}
                                                    </div>
                                                    {dropItem.description && (
                                                        <div style={{ fontSize: 13, opacity: 0.8 }}>
                                                            {dropItem.description}
                                                        </div>
                                                    )}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        <div style={{ height: 16 }} />

                        <div
                            style={{
                                borderTop: "1px solid #F1F5F9",
                                paddingTop: 16,
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                            }}
                        >
                            <a
                                href={loginHref}
                                aria-label={loginLabel}
                                onClick={closeMobileMenu}
                                style={{
                                    ...ctaFont,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: "#111827",
                                    padding: "12px 14px",
                                    borderRadius: 12,
                                    textDecoration: "none",
                                    border: "1px solid #E2E8F0",
                                    background: "#FFFFFF",
                                    textAlign: "center",
                                    ...linkBaseFocus,
                                }}
                            >
                                {loginLabel}
                            </a>
                            <a
                                href={ctaHref}
                                aria-label={ctaLabel}
                                onClick={closeMobileMenu}
                                style={{
                                    ...ctaFont,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: "#FFFFFF",
                                    padding: "12px 14px",
                                    borderRadius: 999,
                                    textDecoration: "none",
                                    background: primaryColor,
                                    textAlign: "center",
                                    ...linkBaseFocus,
                                }}
                            >
                                {ctaLabel}
                            </a>
                        </div>
                    </div>
                </div>
            </motion.div>
        )

        return (
            <AnimatePresence initial={false}>{mobileMenuOpen ? panel : null}</AnimatePresence>
        )
    }, [
        closeMobileMenu,
        ctaFont,
        ctaHref,
        ctaLabel,
        interactiveFocusStyle,
        isMobile,
        isStatic,
        linkBaseFocus,
        loginHref,
        loginLabel,
        makeIsFocused,
        makeIsHovered,
        mobileMenuFont,
        mobileMenuOpen,
        navItems,
        primaryColor,
        shadow,
        openDropdown,
    ])

    const showThumbnailFallback = RenderTarget.current() === RenderTarget.thumbnail

    return (
        <div style={rootStyle}>
            {announcementBarNode}

            <nav
                aria-label="Main navigation"
                style={{
                    position: "sticky",
                    top: stickyTop,
                    height: navHeight,
                    width: "100%",
                    zIndex: 100,
                    background: navbarBackground,
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    borderBottom: "1px solid #F1F5F9",
                    boxShadow: showThumbnailFallback ? "none" : shadow,
                    transition: "box-shadow 150ms ease",
                }}
            >
                <div
                    style={{
                        height: "100%",
                        paddingLeft: responsivePadX,
                        paddingRight: responsivePadX,
                        boxSizing: "border-box",
                    }}
                >
                    <div style={innerWrapStyle}>
                        <div style={{ display: "flex", alignItems: "center", minWidth: "max-content", flex: "0 0 auto" }}>
                            {logoNode}
                        </div>

                        <div style={{ flex: 1, display: "flex", justifyContent: "center", minWidth: 0 }}>{desktopNav}</div>

                        <div style={{ display: "flex", justifyContent: "flex-end", minWidth: "max-content", flex: "0 0 auto" }}>
                            {rightSide}
                        </div>
                    </div>
                </div>

                {mobileMenuPanel}
            </nav>
        </div>
    )
}

addPropertyControls(FeaturebaseNavbar, {
    showAnnouncementBar: {
        type: ControlType.Boolean,
        title: "Announcement",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    announcementText: {
        type: ControlType.String,
        title: "Announcement Text",
        defaultValue: "We're hiring! Join our team",
    },
    announcementHref: {
        type: ControlType.String,
        title: "Announcement Href",
        defaultValue: "/careers",
    },

    logoIcon: {
        type: ControlType.ResponsiveImage,
        title: "Logo Icon",
    },
    logoText: {
        type: ControlType.String,
        title: "Logo Text",
        defaultValue: "Featurebase",
    },

    primaryColor: {
        type: ControlType.Color,
        title: "Primary",
        defaultValue: "#4F46E5",
    },

    loginLabel: {
        type: ControlType.String,
        title: "Login Label",
        defaultValue: "Login",
    },
    loginHref: {
        type: ControlType.String,
        title: "Login Href",
        defaultValue: "https://auth.featurebase.app/",
    },

    ctaLabel: {
        type: ControlType.String,
        title: "CTA Label",
        defaultValue: "Start for free",
    },
    ctaHref: {
        type: ControlType.String,
        title: "CTA Href",
        defaultValue: "https://auth.featurebase.app/register",
    },

    // Products Menu
    showProductsMenu: {
        type: ControlType.Boolean,
        title: "Show Products",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    productsLabel: {
        type: ControlType.String,
        title: "Products Label",
        defaultValue: "Products",
        hidden: ({ showProductsMenu }) => !showProductsMenu,
    },
    productsHref: {
        type: ControlType.String,
        title: "Products Href",
        defaultValue: "/products",
        hidden: ({ showProductsMenu }) => !showProductsMenu,
    },
    productsHasDropdown: {
        type: ControlType.Boolean,
        title: "Products Dropdown",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: ({ showProductsMenu }) => !showProductsMenu,
    },
    productsDropdownItems: {
        type: ControlType.Array,
        title: "Products Submenu",
        maxCount: 10,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Feature" },
                href: { type: ControlType.String, title: "Href", defaultValue: "/" },
                description: { type: ControlType.String, title: "Description", defaultValue: "Description text" },
            },
        },
        defaultValue: [
            { label: "Feedback", href: "/feedback", description: "Collect user feedback" },
            { label: "Roadmap", href: "/roadmap", description: "Share your product roadmap" },
        ],
        hidden: ({ showProductsMenu, productsHasDropdown }) => !showProductsMenu || !productsHasDropdown,
    },

    // Pricing Menu
    showPricingMenu: {
        type: ControlType.Boolean,
        title: "Show Pricing",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    pricingLabel: {
        type: ControlType.String,
        title: "Pricing Label",
        defaultValue: "Pricing",
        hidden: ({ showPricingMenu }) => !showPricingMenu,
    },
    pricingHref: {
        type: ControlType.String,
        title: "Pricing Href",
        defaultValue: "/pricing",
        hidden: ({ showPricingMenu }) => !showPricingMenu,
    },
    pricingHasDropdown: {
        type: ControlType.Boolean,
        title: "Pricing Dropdown",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: ({ showPricingMenu }) => !showPricingMenu,
    },
    pricingDropdownItems: {
        type: ControlType.Array,
        title: "Pricing Submenu",
        maxCount: 10,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Plan" },
                href: { type: ControlType.String, title: "Href", defaultValue: "/" },
                description: { type: ControlType.String, title: "Description", defaultValue: "Description text" },
            },
        },
        defaultValue: [],
        hidden: ({ showPricingMenu, pricingHasDropdown }) => !showPricingMenu || !pricingHasDropdown,
    },

    // Customers Menu
    showCustomersMenu: {
        type: ControlType.Boolean,
        title: "Show Customers",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    customersLabel: {
        type: ControlType.String,
        title: "Customers Label",
        defaultValue: "Customers",
        hidden: ({ showCustomersMenu }) => !showCustomersMenu,
    },
    customersHref: {
        type: ControlType.String,
        title: "Customers Href",
        defaultValue: "/customers",
        hidden: ({ showCustomersMenu }) => !showCustomersMenu,
    },
    customersHasDropdown: {
        type: ControlType.Boolean,
        title: "Customers Dropdown",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: ({ showCustomersMenu }) => !showCustomersMenu,
    },
    customersDropdownItems: {
        type: ControlType.Array,
        title: "Customers Submenu",
        maxCount: 10,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Story" },
                href: { type: ControlType.String, title: "Href", defaultValue: "/" },
                description: { type: ControlType.String, title: "Description", defaultValue: "Description text" },
            },
        },
        defaultValue: [],
        hidden: ({ showCustomersMenu, customersHasDropdown }) => !showCustomersMenu || !customersHasDropdown,
    },

    // Resources Menu
    showResourcesMenu: {
        type: ControlType.Boolean,
        title: "Show Resources",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    resourcesLabel: {
        type: ControlType.String,
        title: "Resources Label",
        defaultValue: "Resources",
        hidden: ({ showResourcesMenu }) => !showResourcesMenu,
    },
    resourcesHref: {
        type: ControlType.String,
        title: "Resources Href",
        defaultValue: "/resources",
        hidden: ({ showResourcesMenu }) => !showResourcesMenu,
    },
    resourcesHasDropdown: {
        type: ControlType.Boolean,
        title: "Resources Dropdown",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: ({ showResourcesMenu }) => !showResourcesMenu,
    },
    resourcesDropdownItems: {
        type: ControlType.Array,
        title: "Resources Submenu",
        maxCount: 10,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Resource" },
                href: { type: ControlType.String, title: "Href", defaultValue: "/" },
                description: { type: ControlType.String, title: "Description", defaultValue: "Description text" },
            },
        },
        defaultValue: [
            { label: "Blog", href: "/blog", description: "Latest articles and updates" },
            { label: "Docs", href: "/docs", description: "Documentation and guides" },
        ],
        hidden: ({ showResourcesMenu, resourcesHasDropdown }) => !showResourcesMenu || !resourcesHasDropdown,
    },

    showScrollShadow: {
        type: ControlType.Boolean,
        title: "Scroll Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile Breakpoint",
        defaultValue: 768,
        min: 320,
        max: 1440,
        step: 1,
        unit: "px",
    },

    announcementFont: {
        type: ControlType.Font,
        title: "Announcement Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    brandFont: {
        type: ControlType.Font,
        title: "Brand Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Semibold",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
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
    mobileMenuFont: {
        type: ControlType.Font,
        title: "Mobile Menu Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Semibold",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
    },
    dropdownFont: {
        type: ControlType.Font,
        title: "Dropdown Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
})
