// Frontify Navbar — fully responsive, pixel-perfect navigation bar
// Bug fixes applied:
//   1. Removed unused `useScroll` import
//   2. Removed `startTransition` (React 18 only, breaks in Framer env) — plain setState used
//   3. logoSrc / featuredCard image: handle both ResponsiveImage object and plain string safely
//   4. Dropdown overflow: added maxHeight + overflowY scroll so long dropdowns don't clip
//   5. Mobile menu zIndex bumped above nav (1002 > 1001)
//   6. navItems object control: removed `hidden` callback (not supported in all Framer versions)
//   7. Added null/undefined guards on all array props to prevent render crashes

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
import { useState, useEffect, useRef } from "react"

interface NavItem {
    label: string
    href?: string
    hasDropdown?: boolean
    dropdownType?: string
}

interface CapabilityItem {
    icon: string
    label: string
    description: string
    href: string
}

interface SimpleLink {
    label: string
    description: string
    href: string
}

interface FeaturedCard {
    image: { src: string; alt: string } | string
    title: string
    description: string
    href: string
}

interface FrontifyNavbarProps {
    navBackground: string
    navBorderColor: string
    navHeight: number
    logoType: "image" | "text"
    logoWidth: number
    logoSrc: { src: string; srcSet?: string; alt?: string } | string
    logoText: string
    logoFontSize: number
    logoFontWeight: number
    logoColor: string
    logoFont: any
    linkColor: string
    linkHoverBg: string
    linkFontSize: number
    linkFontWeight: number
    ctaPrimaryBg: string
    ctaPrimaryText: string
    ctaPrimaryLabel: string
    ctaPrimaryHref: string
    ctaSecondaryLabel: string
    ctaSecondaryHref: string
    // Visibility toggles
    showLanguageSelector: boolean
    showLoginButton: boolean
    showDemoButton: boolean
    showResourcesFeatured: boolean
    stickyOnScroll: boolean
    showScrollBorder: boolean
    dropdownBorderRadius: number
    dropdownShadow: boolean
    mobileBreakpoint: number
    navItems: NavItem[]
    platformTitle: string
    platformDescription: string
    platformCtaLabel: string
    platformCtaHref: string
    platformCapabilities: CapabilityItem[]
    platformFeaturedCard: FeaturedCard
    customersLinks: SimpleLink[]
    customersFeaturedCard: FeaturedCard
    partnershipsTitle: string
    partnershipsDescription: string
    partnershipsCta1Label: string
    partnershipsCta1Href: string
    partnershipsCta2Label: string
    partnershipsCta2Href: string
    partnershipsLinks: SimpleLink[]
    partnershipsFeaturedCard: FeaturedCard
    resourcesTitle: string
    resourcesLinks: SimpleLink[]
    resourcesFeaturedCard: FeaturedCard
    languages: string[]

    // Visual section dividers in Framer property panel (no runtime effect)
    __sectionMain?: string
    __sectionVisibility?: string
}

// Helper: safely extract image src from ResponsiveImage object or plain string
function getImageSrc(img: any): string {
    if (!img) return ""
    if (typeof img === "string") return img
    if (typeof img === "object" && img.src) return img.src
    return ""
}

function getImageAlt(img: any): string {
    if (!img) return ""
    if (typeof img === "string") return ""
    if (typeof img === "object" && img.alt) return img.alt
    return ""
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function FrontifyNavbar(props: FrontifyNavbarProps) {
    const {
        navBackground = "#FFFFFF",
        navBorderColor = "#EBEBEB",
        navHeight = 68,
        logoType = "image",
        logoWidth = 80,
        logoSrc = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Logo",
        },
        logoText = "Frontify",
        logoFontSize = 24,
        logoFontWeight = 600,
        logoColor = "#1A1A1A",
        logoFont,
        linkColor = "#1A1A1A",
        linkHoverBg = "#F5F5F3",
        linkFontSize = 14,
        linkFontWeight = 450,
        ctaPrimaryBg = "#1A1A1A",
        ctaPrimaryText = "#FFFFFF",
        ctaPrimaryLabel = "Demo",
        ctaPrimaryHref = "#",
        ctaSecondaryLabel = "Login",
        ctaSecondaryHref = "#",
        showLanguageSelector = true,
        showLoginButton = true,
        showDemoButton = true,
        showResourcesFeatured = true,
        stickyOnScroll = true,
        showScrollBorder = true,
        dropdownBorderRadius = 16,
        dropdownShadow = true,
        mobileBreakpoint = 768,
        navItems = [
            { label: "Platform", hasDropdown: true, dropdownType: "platform" },
            { label: "Customers", hasDropdown: true, dropdownType: "customers" },
            { label: "Partnerships", hasDropdown: true, dropdownType: "partnerships" },
            { label: "Resources", hasDropdown: true, dropdownType: "resources" },
            { label: "Pricing", href: "#pricing" },
        ],
        platformTitle = "Explore Frontify",
        platformDescription = "Everything you need to produce on-brand content — in one intelligent platform.",
        platformCtaLabel = "Platform overview →",
        platformCtaHref = "#platform",
        platformCapabilities = [
            { icon: "📦", label: "Digital Asset Management", description: "Find, manage, and share brand assets", href: "#dam" },
            { icon: "🤖", label: "AI", description: "Built-in intelligence for your brand", href: "#ai" },
            { icon: "📋", label: "Guidelines", description: "One home for your brand guidelines", href: "#guidelines" },
            { icon: "📄", label: "Templates", description: "Create and scale on-brand content", href: "#templates" },
            { icon: "📊", label: "Analytics", description: "See what's working across your brand", href: "#analytics" },
            { icon: "🔗", label: "Integrations", description: "Connect to the tools you already use", href: "#integrations" },
            { icon: "🌐", label: "Ecosystems", description: "Build on and around Frontify", href: "#ecosystems" },
            { icon: "⚡", label: "Apps", description: "Add apps to fit your workflow", href: "#apps" },
        ],
        customersLinks = [
            { label: "Success stories", description: "See how brands succeed with Frontify", href: "#success" },
            { label: "Built with Frontify", description: "Explore customer showcases", href: "#built" },
        ],
        customersFeaturedCard = {
            image: { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Featured" },
            title: "Customer Success Story",
            description: "See how leading brands transform their workflows",
            href: "#featured",
        },
        partnershipsTitle = "Grow your agency",
        partnershipsDescription = "Join our partner network and unlock new opportunities",
        partnershipsCta1Label = "Become a partner",
        partnershipsCta1Href = "#partner",
        partnershipsCta2Label = "Get matched",
        partnershipsCta2Href = "#matched",
        partnershipsLinks = [
            { label: "Frontify for Agencies", description: "", href: "#agencies" },
            { label: "Become a partner", description: "", href: "#partner" },
            { label: "Partners directory", description: "", href: "#directory" },
        ],
        partnershipsFeaturedCard = {
            image: { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Partnership" },
            title: "Partner Success",
            description: "Discover partnership opportunities and success stories",
            href: "#partner-featured",
        },
        resourcesTitle = "Knowledge center",
        resourcesLinks = [
            { label: "Blog", description: "", href: "#blog" },
            { label: "Webinars", description: "", href: "#webinars" },
            { label: "Guides", description: "", href: "#guides" },
            { label: "Frontify Futures", description: "", href: "#futures" },
            { label: "Kitchen", description: "", href: "#kitchen" },
            { label: "Help center", description: "", href: "#help" },
            { label: "Customer support", description: "", href: "#support" },
        ],
        resourcesFeaturedCard = {
            image: { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Resource" },
            title: "Featured Article",
            description: "Discover the latest insights and best practices",
            href: "#resource-featured",
        },
        platformFeaturedCard = {
            image: { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Platform" },
            title: "Frontify MCP",
            description: "Frontify is your brand intelligence layer for seamless workflows",
            href: "#mcp",
        },
        languages = ["English", "Deutsch", "Français"],
    } = props

    const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
    const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isTablet, setIsTablet] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [languageOpen, setLanguageOpen] = useState(false)
    const [mobileExpandedItem, setMobileExpandedItem] = useState<string | null>(null)
    const navRef = useRef<HTMLElement>(null)

    // Detect scroll position
    useEffect(() => {
        if (typeof window === "undefined") return
        const handleScroll = () => setScrolled(window.scrollY > 10)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    // Detect viewport size
    useEffect(() => {
        if (typeof window === "undefined") return
        const handleResize = () => {
            const width = window.innerWidth
            setIsMobile(width <= mobileBreakpoint)
            setIsTablet(width > mobileBreakpoint && width <= 1024)
        }
        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [mobileBreakpoint])

    // Close dropdown on click outside or Escape
    useEffect(() => {
        if (typeof window === "undefined") return
        const handleClickOutside = (e: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(e.target as Node)) {
                setActiveDropdown(null)
                setActiveDropdownIndex(null)
                setLanguageOpen(false)
            }
        }
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setActiveDropdown(null)
                setActiveDropdownIndex(null)
                setLanguageOpen(false)
                setMobileMenuOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        document.addEventListener("keydown", handleEscape)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("keydown", handleEscape)
        }
    }, [])

    // FeaturedCard renderer — reusable
    const renderFeaturedCard = (card: FeaturedCard, height: number = 80) => {
        if (!card) return null
        const src = getImageSrc(card.image)
        const alt = getImageAlt(card.image)
        return (
            <a
                href={card.href}
                style={{
                    display: "block",
                    marginTop: 16,
                    background: "#F8F7F4",
                    border: "1px solid #E8E8E5",
                    borderRadius: 10,
                    padding: 16,
                    textDecoration: "none",
                    transition: "background 120ms ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#F5F4F1" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#F8F7F4" }}
                onFocus={(e) => { e.currentTarget.style.outline = "2px solid #4A90E2"; e.currentTarget.style.outlineOffset = "2px" }}
                onBlur={(e) => { e.currentTarget.style.outline = "none" }}
            >
                {src && (
                    <img
                        src={src}
                        alt={alt}
                        style={{
                            width: "100%",
                            height,
                            objectFit: "cover",
                            borderRadius: 6,
                            marginBottom: 12,
                        }}
                    />
                )}
                <div style={{ fontSize: 14, fontWeight: 500, color: linkColor, marginBottom: 4 }}>
                    {card.title}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>{card.description}</div>
            </a>
        )
    }

    const renderPlatformDropdown = () => (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1.2fr",
                gap: isMobile ? 24 : 32,
                minWidth: isMobile ? "auto" : 560,
                maxWidth: isMobile ? "100%" : "none",
            }}
        >
            <div>
                <div style={{ fontSize: 13, color: "#888", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                    {platformTitle}
                </div>
                <p style={{ fontSize: 13, color: "#555", lineHeight: 1.5, margin: "0 0 16px 0" }}>
                    {platformDescription}
                </p>
                <a href={platformCtaHref} style={{ fontSize: 13, color: linkColor, fontWeight: 500, textDecoration: "none" }}>
                    {platformCtaLabel}
                </a>
            </div>
            <div>
                <div style={{ fontSize: 13, color: "#888", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                    Capabilities
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {(platformCapabilities || []).map((item, i) => (
                        <a
                            key={i}
                            href={item.href}
                            style={{ display: "flex", gap: 12, padding: 8, borderRadius: 8, textDecoration: "none", transition: "background 120ms ease" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = linkHoverBg }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                        >
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F5F5F3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                                {item.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 500, color: linkColor }}>{item.label}</div>
                                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{item.description}</div>
                            </div>
                        </a>
                    ))}
                </div>
                {renderFeaturedCard(platformFeaturedCard, 80)}
            </div>
        </div>
    )

    const renderCustomersDropdown = () => (
        <div style={{ minWidth: isMobile ? "auto" : 360, maxWidth: isMobile ? "100%" : "none" }}>
            {(customersLinks || []).map((link, i) => (
                <a
                    key={i}
                    href={link.href}
                    style={{ display: "block", padding: 12, borderRadius: 8, textDecoration: "none", marginBottom: i < customersLinks.length - 1 ? 8 : 0 }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = linkHoverBg }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                >
                    <div style={{ fontSize: 14, fontWeight: 450, color: linkColor, marginBottom: 4 }}>{link.label}</div>
                    {link.description && <div style={{ fontSize: 12, color: "#888" }}>{link.description}</div>}
                </a>
            ))}
            {renderFeaturedCard(customersFeaturedCard, 100)}
        </div>
    )

    const renderPartnershipsDropdown = () => (
        <div style={{ minWidth: isMobile ? "auto" : 360, maxWidth: isMobile ? "100%" : "none" }}>
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: linkColor, marginBottom: 8 }}>{partnershipsTitle}</div>
                <p style={{ fontSize: 13, color: "#555", margin: 0, lineHeight: 1.5 }}>{partnershipsDescription}</p>
            </div>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 8, marginBottom: 16 }}>
                <a
                    href={partnershipsCta1Href}
                    style={{ flex: 1, padding: "8px 16px", background: ctaPrimaryBg, color: ctaPrimaryText, borderRadius: 8, fontSize: 13, fontWeight: 500, textAlign: "center", textDecoration: "none", transition: "background 120ms ease" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#333333" }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = ctaPrimaryBg }}
                >
                    {partnershipsCta1Label}
                </a>
                <a
                    href={partnershipsCta2Href}
                    style={{ flex: 1, padding: "8px 16px", background: "transparent", color: linkColor, border: "1px solid #D8D8D6", borderRadius: 8, fontSize: 13, fontWeight: 500, textAlign: "center", textDecoration: "none", transition: "background 120ms ease, border-color 120ms ease" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = linkHoverBg; e.currentTarget.style.borderColor = "#C0C0BE" }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#D8D8D6" }}
                >
                    {partnershipsCta2Label}
                </a>
            </div>
            <div style={{ borderTop: "1px solid #EBEBEB", paddingTop: 12, marginBottom: 16 }}>
                {(partnershipsLinks || []).map((link, i) => (
                    <a
                        key={i}
                        href={link.href}
                        style={{ display: "block", padding: "8px 12px", fontSize: 13, color: linkColor, textDecoration: "none", borderRadius: 6 }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = linkHoverBg }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                    >
                        {link.label}
                    </a>
                ))}
            </div>
            {renderFeaturedCard(partnershipsFeaturedCard, 100)}
        </div>
    )

    const renderResourcesDropdown = () => {
        const hasFeatured = !!(showResourcesFeatured && resourcesFeaturedCard)
        return (
        <div style={{ minWidth: isMobile ? "auto" : "auto", maxWidth: "100%", width: isMobile ? "auto" : "max-content" }} >
            <div>
                <div style={{ fontSize: 13, color: "#888", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                    {resourcesTitle}
                </div>
                {(resourcesLinks || []).map((link, i) => (
                    <a
                        key={i}
                        href={link.href}
                        style={{ display: "block", padding: "8px 12px", fontSize: 14, fontWeight: 450, color: linkColor, textDecoration: "none", borderRadius: 6 }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = linkHoverBg }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                    >
                        {link.label}
                    </a>
                ))}
            </div>
            {hasFeatured && (
                <div>{renderFeaturedCard(resourcesFeaturedCard, 100)}</div>
            )}
        </div>
        )
    }

    const renderDropdown = (type: string) => {
        switch (type) {
            case "platform": return renderPlatformDropdown()
            case "customers": return renderCustomersDropdown()
            case "partnerships": return renderPartnershipsDropdown()
            case "resources": return renderResourcesDropdown()
            default: return null
        }
    }

    const currentHeight = isMobile ? 60 : navHeight
    const logoImgSrc = getImageSrc(logoSrc)
    const logoImgAlt = getImageAlt(logoSrc) || "Logo"

    return (
        <nav
            ref={navRef}
            aria-label="Main navigation"
            style={{
                position: stickyOnScroll ? "sticky" : "relative",
                top: 0,
                left: 0,
                width: "100%",
                height: currentHeight,
                background: scrolled ? "rgba(255,255,255,0.92)" : navBackground,
                backdropFilter: scrolled ? "blur(12px)" : "none",
                borderBottom: showScrollBorder && scrolled ? `1px solid ${navBorderColor}` : "1px solid transparent",
                zIndex: 999,
                transition: "background 200ms ease, border-color 200ms ease",
            }}
        >
            <div
                style={{
                    maxWidth: 1280,
                    height: "100%",
                    margin: "0 auto",
                    padding: isMobile ? "0 16px" : isTablet ? "0 24px" : "0 40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                {/* Logo */}
                <a href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
                    {logoType === "image" ? (
                        <img
                            src={logoImgSrc}
                            alt={logoImgAlt}
                            style={{ width: isMobile ? logoWidth * 0.83 : logoWidth, height: "auto" }}
                        />
                    ) : (
                        <span
                            style={{
                                fontSize: isMobile ? logoFontSize * 0.83 : logoFontSize,
                                fontWeight: logoFontWeight,
                                color: logoColor,
                                letterSpacing: "-0.02em",
                                ...logoFont,
                            }}
                        >
                            {logoText}
                        </span>
                    )}
                </a>

                {/* Desktop Nav Links */}
                {!isMobile && (
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                        {(navItems || []).map((item, i) => (
                            <div key={i} style={{ position: "relative" }}>
                                {item.hasDropdown ? (
                                    <button
                                        onClick={() => {
                                            const type = item.dropdownType || null
                                            const isOpen = activeDropdown === type && activeDropdownIndex === i
                                            if (isOpen) {
                                                setActiveDropdown(null)
                                                setActiveDropdownIndex(null)
                                            } else {
                                                setActiveDropdown(type)
                                                setActiveDropdownIndex(i)
                                            }
                                        }}
                                        aria-expanded={activeDropdown === item.dropdownType}
                                        aria-haspopup="true"
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 4,
                                            padding: isTablet ? "8px 10px" : "8px 14px",
                                            fontSize: linkFontSize,
                                            fontWeight: linkFontWeight,
                                            color: linkColor,
                                            background: activeDropdown === item.dropdownType ? "#F0F0EE" : "transparent",
                                            border: "none",
                                            borderRadius: 6,
                                            cursor: "pointer",
                                            letterSpacing: "-0.01em",
                                            transition: "background 120ms ease, color 120ms ease",
                                        }}
                                        onMouseEnter={(e) => { if (activeDropdown !== item.dropdownType) e.currentTarget.style.background = linkHoverBg }}
                                        onMouseLeave={(e) => { if (activeDropdown !== item.dropdownType) e.currentTarget.style.background = "transparent" }}
                                    >
                                        {item.label}
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                            style={{ transform: activeDropdown === item.dropdownType ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 180ms ease" }}
                                        >
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </button>
                                ) : (
                                    <a
                                        href={item.href}
                                        style={{
                                            display: "block",
                                            padding: isTablet ? "8px 10px" : "8px 14px",
                                            fontSize: linkFontSize,
                                            fontWeight: linkFontWeight,
                                            color: linkColor,
                                            textDecoration: "none",
                                            borderRadius: 6,
                                            letterSpacing: "-0.01em",
                                            transition: "background 120ms ease, color 120ms ease",
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = linkHoverBg }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                                    >
                                        {item.label}
                                    </a>
                                )}

                                {/* Dropdown panel */}
                                <AnimatePresence>
                                    {activeDropdown === item.dropdownType && activeDropdownIndex === i && !isMobile && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -6 }}
                                            transition={{ duration: 0.18, ease: "easeOut" }}
                                            role="menu"
                                            style={{
                                                position: "absolute",
                                                top: "calc(100% + 8px)",
                                                left: "50%",
                                                transform: "translateX(-50%)",
                                                background: "#FFFFFF",
                                                border: "1px solid #E8E8E6",
                                                borderRadius: dropdownBorderRadius,
                                                boxShadow: dropdownShadow ? "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)" : "none",
                                                padding: 24,
                                                zIndex: 1000,
                                                maxWidth: isTablet && item.dropdownType === "resources" ? "calc(100vw - 48px)" : "calc(100vw - 32px)",
                                                width: isTablet && item.dropdownType === "resources" ? "calc(100vw - 48px)" : undefined,
                                                // BUG FIX: prevent dropdown from overflowing screen vertically
                                                maxHeight: "80vh",
                                                overflowY: "auto",
                                            }}
                                        >
                                            {renderDropdown(item.dropdownType || "")}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                )}

                {/* Right Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Language Selector */}
                    {!isMobile && !isTablet && showLanguageSelector && (
                        <div style={{ position: "relative" }}>
                            <button
                                onClick={() => setLanguageOpen(!languageOpen)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 6,
                                    padding: "7px 12px", fontSize: 13, fontWeight: 500, color: linkColor,
                                    background: "transparent", border: "none", borderRadius: 6, cursor: "pointer",
                                    transition: "background 120ms ease",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = linkHoverBg }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="2" y1="12" x2="22" y2="12" />
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                </svg>
                                {(languages[0] || "EN").substring(0, 2).toUpperCase()}
                            </button>
                            <AnimatePresence>
                                {languageOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.18 }}
                                        style={{
                                            position: "absolute", top: "calc(100% + 4px)", right: 0,
                                            background: "#FFFFFF", border: "1px solid #E8E8E6", borderRadius: 8,
                                            boxShadow: "0 4px 16px rgba(0,0,0,0.1)", padding: 8, minWidth: 120, zIndex: 1000,
                                        }}
                                    >
                                        {(languages || []).map((lang, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setLanguageOpen(false)}
                                                style={{
                                                    display: "block", width: "100%", padding: "8px 12px",
                                                    fontSize: 13, color: linkColor, background: "transparent",
                                                    border: "none", borderRadius: 4, cursor: "pointer", textAlign: "left",
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = linkHoverBg }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                                            >
                                                {lang}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Login Button */}
                    {!isMobile && showLoginButton && (
                        <a
                            href={ctaSecondaryHref}
                            style={{
                                padding: "7px 16px", fontSize: 13, fontWeight: 500, color: linkColor,
                                background: "transparent", border: "1px solid #D8D8D6", borderRadius: 8,
                                textDecoration: "none", transition: "background 120ms ease, border-color 120ms ease",
                                display: "inline-block",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = linkHoverBg; e.currentTarget.style.borderColor = "#C0C0BE" }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#D8D8D6" }}
                            onFocus={(e) => { e.currentTarget.style.outline = "2px solid #4A90E2"; e.currentTarget.style.outlineOffset = "2px" }}
                            onBlur={(e) => { e.currentTarget.style.outline = "none" }}
                        >
                            {ctaSecondaryLabel}
                        </a>
                    )}

                    {/* Demo Button */}
                    {!isMobile && showDemoButton && (
                        <a
                            href={ctaPrimaryHref}
                            style={{
                                padding: "7px 18px", fontSize: 13, fontWeight: 600, color: ctaPrimaryText,
                                background: ctaPrimaryBg, border: `1px solid ${ctaPrimaryBg}`, borderRadius: 8,
                                textDecoration: "none", transition: "background 120ms ease", display: "inline-block",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#333333" }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = ctaPrimaryBg }}
                            onFocus={(e) => { e.currentTarget.style.outline = "2px solid #4A90E2"; e.currentTarget.style.outlineOffset = "2px" }}
                            onBlur={(e) => { e.currentTarget.style.outline = "none" }}
                        >
                            {ctaPrimaryLabel}
                        </a>
                    )}

                    {/* Mobile Hamburger */}
                    {isMobile && (
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                            style={{ background: "transparent", border: "none", cursor: "pointer", padding: 8 }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={linkColor}>
                                <line x1="4" y1="6" x2="20" y2="6" strokeWidth="2" />
                                <line x1="4" y1="12" x2="20" y2="12" strokeWidth="2" />
                                <line x1="4" y1="18" x2="20" y2="18" strokeWidth="2" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile Full-screen Menu — BUG FIX: zIndex 1002 > nav 999 */}
            <AnimatePresence>
                {mobileMenuOpen && isMobile && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        aria-modal="true"
                        style={{
                            position: "fixed",
                            top: 0, left: 0,
                            width: "100%",
                            height: "100vh",
                            background: navBackground,
                            zIndex: 1002,
                            padding: 24,
                            overflowY: "auto",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
                            {logoType === "image" ? (
                                <img src={logoImgSrc} alt={logoImgAlt} style={{ width: 90, height: "auto" }} />
                            ) : (
                                <span style={{ fontSize: logoFontSize * 0.83, fontWeight: logoFontWeight, color: logoColor, ...logoFont }}>
                                    {logoText}
                                </span>
                            )}
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                style={{ background: "transparent", border: "none", cursor: "pointer", padding: 8 }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={linkColor}>
                                    <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" />
                                    <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" />
                                </svg>
                            </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {(navItems || []).map((item, i) => (
                                <div key={i}>
                                    {item.hasDropdown ? (
                                        <>
                                            <button
                                                onClick={() => setMobileExpandedItem(mobileExpandedItem === item.dropdownType ? null : item.dropdownType || null)}
                                                style={{
                                                    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                                                    fontSize: 18, fontWeight: 500, color: linkColor,
                                                    background: "transparent", border: "none", padding: "12px 0",
                                                    cursor: "pointer", textAlign: "left",
                                                }}
                                            >
                                                {item.label}
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                                    style={{ transform: mobileExpandedItem === item.dropdownType ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 180ms ease" }}
                                                >
                                                    <polyline points="6 9 12 15 18 9" />
                                                </svg>
                                            </button>
                                            <AnimatePresence>
                                                {mobileExpandedItem === item.dropdownType && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        style={{ overflow: "hidden", paddingLeft: 16, paddingTop: 8, paddingBottom: 8 }}
                                                    >
                                                        {renderDropdown(item.dropdownType || "")}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </>
                                    ) : (
                                        <a
                                            href={item.href || "#"}
                                            style={{ display: "block", fontSize: 18, fontWeight: 500, color: linkColor, textDecoration: "none", padding: "12px 0" }}
                                        >
                                            {item.label}
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32, paddingTop: 32, borderTop: `1px solid ${navBorderColor}` }} >
                            {showLoginButton && (
                            <a
                                href={ctaSecondaryHref}
                                style={{ padding: "12px 24px", fontSize: 15, fontWeight: 500, color: linkColor, background: "transparent", border: "1px solid #D8D8D6", borderRadius: 8, textDecoration: "none", textAlign: "center", display: "block", transition: "background 120ms ease, border-color 120ms ease" }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = linkHoverBg; e.currentTarget.style.borderColor = "#C0C0BE" }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#D8D8D6" }}
                            >
                                {ctaSecondaryLabel}
                            </a>
                            )}
                            {showDemoButton && (
                            <a
                                href={ctaPrimaryHref}
                                style={{ padding: "12px 24px", fontSize: 15, fontWeight: 600, color: ctaPrimaryText, background: ctaPrimaryBg, border: `1px solid ${ctaPrimaryBg}`, borderRadius: 8, textDecoration: "none", textAlign: "center", display: "block", transition: "background 120ms ease" }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#333333" }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = ctaPrimaryBg }}
                            >
                                {ctaPrimaryLabel}
                            </a>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}

addPropertyControls(FrontifyNavbar, {
    __sectionMain: { type: ControlType.String, title: "──────── Main ────────", defaultValue: "" },
    navBackground: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
    navBorderColor: { type: ControlType.Color, title: "Border Color", defaultValue: "#EBEBEB" },
    navHeight: { type: ControlType.Number, title: "Height", defaultValue: 68, min: 50, max: 100, step: 1, unit: "px" },
    logoType: {
        type: ControlType.Enum,
        title: "Logo Type",
        options: ["image", "text"],
        optionTitles: ["Image", "Text"],
        defaultValue: "image",
        displaySegmentedControl: true,
    },
    logoWidth: { type: ControlType.Number, title: "Logo Width", defaultValue: 80, min: 40, max: 300, step: 1, unit: "px", hidden: (props) => props.logoType === "text" },
    logoSrc: { type: ControlType.ResponsiveImage, title: "Logo Image", hidden: (props) => props.logoType === "text" },
    logoText: { type: ControlType.String, title: "Logo Text", defaultValue: "Frontify", hidden: (props) => props.logoType === "image" },
    logoFontSize: { type: ControlType.Number, title: "Logo Font Size", defaultValue: 24, min: 14, max: 48, step: 1, unit: "px", hidden: (props) => props.logoType === "image" },
    logoFontWeight: { type: ControlType.Number, title: "Logo Font Weight", defaultValue: 600, min: 300, max: 900, step: 100, hidden: (props) => props.logoType === "image" },
    logoColor: { type: ControlType.Color, title: "Logo Color", defaultValue: "#1A1A1A", hidden: (props) => props.logoType === "image" },
    logoFont: {
        type: ControlType.Font,
        title: "Logo Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "24px",
            variant: "Semibold",
            letterSpacing: "-0.02em",
        },
        hidden: (props) => props.logoType === "image",
    },
    linkColor: { type: ControlType.Color, title: "Link Color", defaultValue: "#1A1A1A" },
    linkHoverBg: { type: ControlType.Color, title: "Link Hover BG", defaultValue: "#F5F5F3" },
    linkFontSize: { type: ControlType.Number, title: "Link Font Size", defaultValue: 14, min: 12, max: 18, step: 1, unit: "px" },
    linkFontWeight: { type: ControlType.Number, title: "Link Weight", defaultValue: 450, min: 300, max: 700, step: 50 },
    ctaPrimaryBg: { type: ControlType.Color, title: "Primary CTA BG", defaultValue: "#1A1A1A" },
    ctaPrimaryText: { type: ControlType.Color, title: "Primary CTA Text", defaultValue: "#FFFFFF" },
    ctaPrimaryLabel: { type: ControlType.String, title: "Primary CTA Label", defaultValue: "Demo" },
    ctaPrimaryHref: { type: ControlType.String, title: "Primary CTA Link", defaultValue: "#" },
    ctaSecondaryLabel: { type: ControlType.String, title: "Secondary CTA Label", defaultValue: "Login" },
    ctaSecondaryHref: { type: ControlType.String, title: "Secondary CTA Link", defaultValue: "#" },
    __sectionVisibility: { type: ControlType.String, title: "──────── Visibility ────────", defaultValue: "" },
    showLanguageSelector: { type: ControlType.Boolean, title: "Language Selector", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    showLoginButton: { type: ControlType.Boolean, title: "Login Button", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    showDemoButton: { type: ControlType.Boolean, title: "Demo Button", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    showResourcesFeatured: { type: ControlType.Boolean, title: "Resources Featured", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    stickyOnScroll: { type: ControlType.Boolean, title: "Sticky", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    showScrollBorder: { type: ControlType.Boolean, title: "Scroll Border", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    dropdownBorderRadius: { type: ControlType.Number, title: "Dropdown Radius", defaultValue: 16, min: 0, max: 32, step: 1, unit: "px" },
    dropdownShadow: { type: ControlType.Boolean, title: "Dropdown Shadow", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    mobileBreakpoint: { type: ControlType.Number, title: "Mobile Breakpoint", defaultValue: 768, min: 320, max: 1024, step: 1, unit: "px" },
    navItems: {
        type: ControlType.Array,
        title: "Nav Items",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Link" },
                href: { type: ControlType.String, title: "URL", defaultValue: "#" },
                hasDropdown: { type: ControlType.Boolean, title: "Has Dropdown", defaultValue: false },
                dropdownType: {
                    type: ControlType.Enum,
                    title: "Dropdown Type",
                    options: ["platform", "customers", "partnerships", "resources"],
                    optionTitles: ["Platform", "Customers", "Partnerships", "Resources"],
                },
            },
        },
        defaultValue: [
            { label: "Platform", hasDropdown: true, dropdownType: "platform" },
            { label: "Customers", hasDropdown: true, dropdownType: "customers" },
            { label: "Partnerships", hasDropdown: true, dropdownType: "partnerships" },
            { label: "Resources", hasDropdown: true, dropdownType: "resources" },
            { label: "Pricing", href: "#pricing" },
        ],
    },
    platformTitle: { type: ControlType.String, title: "Platform Title", defaultValue: "Explore Frontify" },
    platformDescription: { type: ControlType.String, title: "Platform Description", displayTextArea: true, defaultValue: "Everything you need to produce on-brand content — in one intelligent platform." },
    platformCtaLabel: { type: ControlType.String, title: "Platform CTA", defaultValue: "Platform overview →" },
    platformCtaHref: { type: ControlType.String, title: "Platform CTA URL", defaultValue: "#platform" },
    platformCapabilities: {
        type: ControlType.Array,
        title: "Capabilities",
        control: {
            type: ControlType.Object,
            controls: {
                icon: { type: ControlType.String, title: "Icon", defaultValue: "📦" },
                label: { type: ControlType.String, title: "Label", defaultValue: "Feature" },
                description: { type: ControlType.String, title: "Description", defaultValue: "Description" },
                href: { type: ControlType.String, title: "URL", defaultValue: "#" },
            },
        },
        defaultValue: [
            { icon: "📦", label: "Digital Asset Management", description: "Find, manage, and share brand assets", href: "#dam" },
            { icon: "🤖", label: "AI", description: "Built-in intelligence for your brand", href: "#ai" },
        ],
    },
    platformFeaturedCard: {
        type: ControlType.Object,
        title: "Platform Featured",
        controls: {
            image: { type: ControlType.ResponsiveImage, title: "Image" },
            title: { type: ControlType.String, title: "Title", defaultValue: "Frontify MCP" },
            description: { type: ControlType.String, title: "Description", defaultValue: "Your brand intelligence layer" },
            href: { type: ControlType.String, title: "URL", defaultValue: "#mcp" },
        },
        defaultValue: {
            image: { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Platform" },
            title: "Frontify MCP",
            description: "Frontify is your brand intelligence layer for seamless workflows",
            href: "#mcp",
        },
    },
    customersLinks: {
        type: ControlType.Array,
        title: "Customer Links",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Link" },
                description: { type: ControlType.String, title: "Description", defaultValue: "Description" },
                href: { type: ControlType.String, title: "URL", defaultValue: "#" },
            },
        },
        defaultValue: [
            { label: "Success stories", description: "See how brands succeed with Frontify", href: "#success" },
            { label: "Built with Frontify", description: "Explore customer showcases", href: "#built" },
        ],
    },
    customersFeaturedCard: {
        type: ControlType.Object,
        title: "Customers Featured",
        controls: {
            image: { type: ControlType.ResponsiveImage, title: "Image" },
            title: { type: ControlType.String, title: "Title", defaultValue: "Customer Success Story" },
            description: { type: ControlType.String, title: "Description", defaultValue: "See how leading brands transform their workflows" },
            href: { type: ControlType.String, title: "URL", defaultValue: "#featured" },
        },
        defaultValue: {
            image: { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Featured" },
            title: "Customer Success Story",
            description: "See how leading brands transform their workflows",
            href: "#featured",
        },
    },
    partnershipsTitle: { type: ControlType.String, title: "Partnerships Title", defaultValue: "Grow your agency" },
    partnershipsDescription: { type: ControlType.String, title: "Partnerships Desc", displayTextArea: true, defaultValue: "Join our partner network and unlock new opportunities" },
    partnershipsCta1Label: { type: ControlType.String, title: "CTA 1 Label", defaultValue: "Become a partner" },
    partnershipsCta1Href: { type: ControlType.String, title: "CTA 1 URL", defaultValue: "#partner" },
    partnershipsCta2Label: { type: ControlType.String, title: "CTA 2 Label", defaultValue: "Get matched" },
    partnershipsCta2Href: { type: ControlType.String, title: "CTA 2 URL", defaultValue: "#matched" },
    partnershipsLinks: {
        type: ControlType.Array,
        title: "Partnership Links",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Link" },
                description: { type: ControlType.String, title: "Description", defaultValue: "" },
                href: { type: ControlType.String, title: "URL", defaultValue: "#" },
            },
        },
        defaultValue: [
            { label: "Frontify for Agencies", description: "", href: "#agencies" },
            { label: "Become a partner", description: "", href: "#partner" },
            { label: "Partners directory", description: "", href: "#directory" },
        ],
    },
    partnershipsFeaturedCard: {
        type: ControlType.Object,
        title: "Partnerships Featured",
        controls: {
            image: { type: ControlType.ResponsiveImage, title: "Image" },
            title: { type: ControlType.String, title: "Title", defaultValue: "Partner Success" },
            description: { type: ControlType.String, title: "Description", defaultValue: "Discover partnership opportunities" },
            href: { type: ControlType.String, title: "URL", defaultValue: "#partner-featured" },
        },
        defaultValue: {
            image: { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Partnership" },
            title: "Partner Success",
            description: "Discover partnership opportunities and success stories",
            href: "#partner-featured",
        },
    },
    resourcesTitle: { type: ControlType.String, title: "Resources Title", defaultValue: "Knowledge center" },
    resourcesLinks: {
        type: ControlType.Array,
        title: "Resource Links",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Link" },
                description: { type: ControlType.String, title: "Description", defaultValue: "" },
                href: { type: ControlType.String, title: "URL", defaultValue: "#" },
            },
        },
        defaultValue: [
            { label: "Blog", description: "", href: "#blog" },
            { label: "Webinars", description: "", href: "#webinars" },
            { label: "Guides", description: "", href: "#guides" },
        ],
    },
    resourcesFeaturedCard: {
        type: ControlType.Object,
        title: "Resources Featured",
        controls: {
            image: { type: ControlType.ResponsiveImage, title: "Image" },
            title: { type: ControlType.String, title: "Title", defaultValue: "Featured Article" },
            description: { type: ControlType.String, title: "Description", defaultValue: "Discover the latest insights" },
            href: { type: ControlType.String, title: "URL", defaultValue: "#resource-featured" },
        },
        defaultValue: {
            image: { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Resource" },
            title: "Featured Article",
            description: "Discover the latest insights and best practices",
            href: "#resource-featured",
        },
    },
    languages: {
        type: ControlType.Array,
        title: "Languages",
        control: { type: ControlType.String },
        defaultValue: ["English", "Deutsch", "Français"],
    },
})
