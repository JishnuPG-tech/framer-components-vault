// Create a fully responsive, pixel-perfect navigation bar component in Framer that exactly replicates the Ditto (dittowords.com) navbar
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useEffect, useCallback, startTransition } from "react"

interface NavbarProps {
    announcementText: string
    announcementBg: string
    announcementHref: string
    logoMark: { src: string; alt: string }
    logoText: string
    primaryColor: string
    ctaPrimaryLabel: string
    ctaPrimaryHref: string
    ctaSecondaryLabel: string
    ctaSecondaryHref: string
    // ... existing code ...
    dropdownBorderRadius: number
    navFontSize: number
    showMobilePrimaryCTA: boolean
    // Product
    showProduct: boolean
    productLabel: string
    productHref: string
    // Solutions
    showSolutions: boolean
    solutionsLabel: string
    solutionsLeftTitle: string
    solutionsRightTitle: string
    solutionsLeftItems: Array<{ title: string; desc: string; href: string; show: boolean }>
    solutionsRightItems: Array<{ title: string; href: string; show: boolean }>
    // Resources
    showResources: boolean
    resourcesLabel: string
    resourcesItems: Array<{ title: string; href: string; show: boolean }>
    // Enterprise
    showEnterprise: boolean
    enterpriseLabel: string
    enterpriseHref: string
    // Pricing
    showPricing: boolean
    pricingLabel: string
    pricingHref: string
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function DittoNavbar(props: NavbarProps) {
    const {
        announcementText = "Introducing AI-first localization, now in Ditto →",
        announcementBg = "#FEF3C7",
        announcementHref = "https://l10n.dittowords.com",
        logoMark = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Ditto Logo",
        },
        logoText = "Ditto",
        primaryColor = "#0F172A",
        ctaPrimaryLabel = "Get Started",
        ctaPrimaryHref = "https://app.dittowords.com/",
        ctaSecondaryLabel = "Book a Demo",
        ctaSecondaryHref = "#",
        showEnterprise = true,
        showPricing = true,
        dropdownBorderRadius = 12,
        navFontSize = 14,
        showMobilePrimaryCTA = true,
        // Product
        showProduct = true,
        productLabel = "Product",
        productHref = "#",
        // Solutions
        showSolutions = true,
        solutionsLabel = "Solutions",
        solutionsLeftTitle = "Tailored to your needs",
        solutionsRightTitle = "Trusted across use cases",
        solutionsLeftItems = [
            {
                title: "For Content Designers",
                desc: "Build and manage product copy",
                href: "/roles/for-content-designers",
                show: true,
            },
            {
                title: "For Developers",
                desc: "Integrate copy into your codebase",
                href: "/roles/for-developers",
                show: true,
            },
            {
                title: "For Localization Managers",
                desc: "Scale localization workflows",
                href: "/roles/for-localization-managers",
                show: true,
            },
            {
                title: "For Product Designers",
                desc: "Keep designs and copy in sync",
                href: "/roles/for-product-designers",
                show: true,
            },
        ],
        solutionsRightItems = [
            { title: "Build a Reusable Text Library", href: "#", show: true },
            { title: "Centralize Copy Reviews", href: "#", show: true },
            { title: "Build an AI Content System", href: "#", show: true },
            { title: "Keep Designs in Sync", href: "#", show: true },
            { title: "Integrate with Engineering", href: "#", show: true },
            { title: "Localize Product Copy", href: "#", show: true },
        ],
        // Resources
        showResources = true,
        resourcesLabel = "Resources",
        resourcesItems = [
            { title: "Blog", href: "#", show: true },
            { title: "What's New", href: "#", show: true },
            { title: "Help Center", href: "#", show: true },
            { title: "Developer Docs", href: "#", show: true },
        ],
        // Enterprise
        enterpriseLabel = "Enterprise",
        enterpriseHref = "#",
        // Pricing
        pricingLabel = "Pricing",
        pricingHref = "#",
    } = props

    const [showAnnouncement, setShowAnnouncement] = useState(true)
    const [solutionsOpen, setSolutionsOpen] = useState(false)
    const [resourcesOpen, setResourcesOpen] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false)
    const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined") return

        const checkMobile = () => {
            startTransition(() => setIsMobile(window.innerWidth <= 768))
        }
        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    const closeAllDropdowns = useCallback(() => {
        startTransition(() => {
            setSolutionsOpen(false)
            setResourcesOpen(false)
        })
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (mobileMenuOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }
        return () => {
            document.body.style.overflow = ""
        }
    }, [mobileMenuOpen])

    const solutionsData = {
        left: {
            title: solutionsLeftTitle,
            items: solutionsLeftItems.filter((item) => item.show),
        },
        right: {
            title: solutionsRightTitle,
            items: solutionsRightItems.filter((item) => item.show),
        },
    }

    const resourcesData = resourcesItems.filter((item) => item.show)

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                fontFamily: "Inter, -apple-system, sans-serif",
            }}
        >
            {/* Announcement Bar */}
            {showAnnouncement && (
                <div
                    style={{
                        width: "100%",
                        height: isMobile ? "auto" : "40px",
                        minHeight: isMobile ? "36px" : "40px",
                        backgroundColor: announcementBg,
                        borderBottom: "1px solid #FDE68A",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        padding: isMobile ? "8px 40px 8px 12px" : "0 40px 0 20px",
                    }}
                >
                    <a
                        href={announcementHref}
                        style={{
                            fontSize: isMobile ? "12px" : "13px",
                            fontWeight: 500,
                            color: "#78350F",
                            textDecoration: "none",
                            textAlign: "center",
                            lineHeight: isMobile ? "1.4" : "1.2",
                            wordBreak: "break-word",
                        }}
                    >
                        {announcementText}
                    </a>
                    <button
                        onClick={() => startTransition(() => setShowAnnouncement(false))}
                        style={{
                            position: "absolute",
                            right: isMobile ? "8px" : "20px",
                            background: "none",
                            border: "none",
                            fontSize: isMobile ? "14px" : "16px",
                            color: "#78350F",
                            cursor: "pointer",
                            padding: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        aria-label="Close announcement"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Navbar */}
            <nav
                style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 100,
                    width: "100%",
                    backgroundColor: "#FFFFFF",
                    borderBottom: "1px solid #E5E7EB",
                }}
                aria-label="Site navigation"
            >
                <div
                    style={{
                        maxWidth: "1280px",
                        margin: "0 auto",
                        height: isMobile ? "58px" : "64px",
                        padding: isMobile ? "0 20px" : "0 40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    {/* Logo */}
                    <a
                        href="/"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            textDecoration: "none",
                            flex: isMobile ? "0 1 auto" : "0 0 auto",
                        }}
                    >
                        <div
                            style={{
                                width: isMobile ? "24px" : "28px",
                                height: isMobile ? "24px" : "28px",
                                borderRadius: "6px",
                                overflow: "hidden",
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <img
                                {...logoMark}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                }}
                            />
                        </div>
                        <span
                            style={{
                                fontSize: isMobile ? "14px" : "16px",
                                fontWeight: 700,
                                color: primaryColor,
                                letterSpacing: "-0.03em",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {logoText}
                        </span>
                    </a>

                    {/* Desktop Nav Links */}
                    {!isMobile && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                            }}
                        >
                            {showProduct && (
                                <a
                                    href={productHref}
                                    style={{
                                        fontSize: `${navFontSize}px`,
                                        fontWeight: 450,
                                        color: "#374151",
                                        textDecoration: "none",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        transition: "all 0.15s",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = "#F9FAFB"
                                        e.currentTarget.style.color = "#000"
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "transparent"
                                        e.currentTarget.style.color = "#374151"
                                    }}
                                >
                                    {productLabel}
                                </a>
                            )}

                            {/* Solutions Dropdown */}
                            {showSolutions && (
                                <div style={{ position: "relative" }}>
                                    <button
                                        onClick={() =>
                                            startTransition(() => {
                                                setSolutionsOpen(!solutionsOpen)
                                                setResourcesOpen(false)
                                            })
                                        }
                                        onMouseEnter={() => startTransition(() => setSolutionsOpen(true))}
                                        style={{
                                            fontSize: `${navFontSize}px`,
                                            fontWeight: 450,
                                            color: "#374151",
                                            background: "none",
                                            border: "none",
                                            padding: "8px 12px",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            transition: "all 0.15s",
                                        }}
                                        aria-haspopup="true"
                                        aria-expanded={solutionsOpen}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.backgroundColor = "#F9FAFB"
                                            e.currentTarget.style.color = "#000"
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = "transparent"
                                            e.currentTarget.style.color = "#374151"
                                        }}
                                    >
                                        {solutionsLabel}
                                        <svg
                                            width="12"
                                            height="12"
                                            viewBox="0 0 12 12"
                                            style={{
                                                transform: solutionsOpen ? "rotate(180deg)" : "rotate(0deg)",
                                                transition: "transform 0.15s",
                                            }}
                                        >
                                            <path
                                                d="M3 4.5L6 7.5L9 4.5"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                fill="none"
                                            />
                                        </svg>
                                    </button>

                                    {solutionsOpen && (
                                        <div
                                            onMouseEnter={() => startTransition(() => setSolutionsOpen(true))}
                                            onMouseLeave={closeAllDropdowns}
                                            role="menu"
                                            style={{
                                                position: "absolute",
                                                top: "calc(100% + 8px)",
                                                left: 0,
                                                minWidth: "620px",
                                                backgroundColor: "#FFFFFF",
                                                border: "1px solid #E5E7EB",
                                                borderRadius: `${dropdownBorderRadius}px`,
                                                boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                                                padding: "24px",
                                                display: "grid",
                                                gridTemplateColumns: "1fr 1fr",
                                                gap: "24px",
                                                animation: "dropdownFade 0.16s ease-out",
                                            }}
                                        >
                                            <style>
                                                {`
                                                    @keyframes dropdownFade {
                                                        from {
                                                            opacity: 0;
                                                            transform: translateY(-6px);
                                                        }
                                                        to {
                                                            opacity: 1;
                                                            transform: translateY(0);
                                                        }
                                                    }
                                                `}
                                            </style>
                                            {/* Left Column */}
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: "11px",
                                                        color: "#9CA3AF",
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.06em",
                                                        fontWeight: 600,
                                                        marginBottom: "12px",
                                                    }}
                                                >
                                                    {solutionsData.left.title}
                                                </div>
                                                {solutionsData.left.items.map((item, i) => (
                                                    <a
                                                        key={i}
                                                        href={item.href}
                                                        style={{
                                                            display: "block",
                                                            padding: "10px",
                                                            borderRadius: "8px",
                                                            textDecoration: "none",
                                                            transition: "background 0.15s",
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = "#F9FAFB"
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = "transparent"
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontSize: "13px",
                                                                fontWeight: 500,
                                                                color: "#1A1A1A",
                                                                marginBottom: "2px",
                                                            }}
                                                        >
                                                            {item.title}
                                                        </div>
                                                        {item.desc && (
                                                            <div
                                                                style={{
                                                                    fontSize: "12px",
                                                                    color: "#6B7280",
                                                                }}
                                                            >
                                                                {item.desc}
                                                            </div>
                                                        )}
                                                    </a>
                                                ))}
                                            </div>

                                            {/* Right Column */}
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: "11px",
                                                        color: "#9CA3AF",
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.06em",
                                                        fontWeight: 600,
                                                        marginBottom: "12px",
                                                    }}
                                                >
                                                    {solutionsData.right.title}
                                                </div>
                                                {solutionsData.right.items.map((item, i) => (
                                                    <a
                                                        key={i}
                                                        href={item.href}
                                                        style={{
                                                            display: "block",
                                                            padding: "10px",
                                                            borderRadius: "8px",
                                                            textDecoration: "none",
                                                            transition: "background 0.15s",
                                                            fontSize: "13px",
                                                            fontWeight: 500,
                                                            color: "#1A1A1A",
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = "#F9FAFB"
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = "transparent"
                                                        }}
                                                    >
                                                        {item.title}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Resources Dropdown */}
                            {showResources && (
                                <div style={{ position: "relative" }}>
                                    <button
                                        onClick={() =>
                                            startTransition(() => {
                                                setResourcesOpen(!resourcesOpen)
                                                setSolutionsOpen(false)
                                            })
                                        }
                                        onMouseEnter={() => startTransition(() => setResourcesOpen(true))}
                                        style={{
                                            fontSize: `${navFontSize}px`,
                                            fontWeight: 450,
                                            color: "#374151",
                                            background: "none",
                                            border: "none",
                                            padding: "8px 12px",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            transition: "all 0.15s",
                                        }}
                                        aria-haspopup="true"
                                        aria-expanded={resourcesOpen}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.backgroundColor = "#F9FAFB"
                                            e.currentTarget.style.color = "#000"
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = "transparent"
                                            e.currentTarget.style.color = "#374151"
                                        }}
                                    >
                                        {resourcesLabel}
                                        <svg
                                            width="12"
                                            height="12"
                                            viewBox="0 0 12 12"
                                            style={{
                                                transform: resourcesOpen ? "rotate(180deg)" : "rotate(0deg)",
                                                transition: "transform 0.15s",
                                            }}
                                        >
                                            <path
                                                d="M3 4.5L6 7.5L9 4.5"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                fill="none"
                                            />
                                        </svg>
                                    </button>

                                    {resourcesOpen && (
                                        <div
                                            onMouseEnter={() => startTransition(() => setResourcesOpen(true))}
                                            onMouseLeave={closeAllDropdowns}
                                            role="menu"
                                            style={{
                                                position: "absolute",
                                                top: "calc(100% + 8px)",
                                                left: 0,
                                                minWidth: "220px",
                                                backgroundColor: "#FFFFFF",
                                                border: "1px solid #E5E7EB",
                                                borderRadius: `${dropdownBorderRadius}px`,
                                                boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                                                padding: "8px",
                                                animation: "dropdownFade 0.16s ease-out",
                                            }}
                                        >
                                            {resourcesData.map((item, i) => (
                                                <a
                                                    key={i}
                                                    href={item.href}
                                                    style={{
                                                        display: "block",
                                                        padding: "10px 12px",
                                                        borderRadius: "6px",
                                                        textDecoration: "none",
                                                        fontSize: "14px",
                                                        fontWeight: 450,
                                                        color: "#374151",
                                                        transition: "background 0.15s",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = "#F9FAFB"
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = "transparent"
                                                    }}
                                                >
                                                    {item.title}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {showEnterprise && (
                                <a
                                    href={enterpriseHref}
                                    style={{
                                        fontSize: `${navFontSize}px`,
                                        fontWeight: 450,
                                        color: "#374151",
                                        textDecoration: "none",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        transition: "all 0.15s",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = "#F9FAFB"
                                        e.currentTarget.style.color = "#000"
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "transparent"
                                        e.currentTarget.style.color = "#374151"
                                    }}
                                >
                                    {enterpriseLabel}
                                </a>
                            )}

                            {showPricing && (
                                <a
                                    href={pricingHref}
                                    style={{
                                        fontSize: `${navFontSize}px`,
                                        fontWeight: 450,
                                        color: "#374151",
                                        textDecoration: "none",
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        transition: "all 0.15s",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = "#F9FAFB"
                                        e.currentTarget.style.color = "#000"
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "transparent"
                                        e.currentTarget.style.color = "#374151"
                                    }}
                                >
                                    {pricingLabel}
                                </a>
                            )}
                        </div>
                    )}

                    {/* Desktop CTAs */}
                    {!isMobile && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <a
                                href={ctaSecondaryHref}
                                style={{
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    color: "#374151",
                                    textDecoration: "none",
                                    padding: "8px 18px",
                                    borderRadius: "8px",
                                    border: "1px solid #D1D5DB",
                                    backgroundColor: "transparent",
                                    transition: "background 0.15s",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#F9FAFB"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "transparent"
                                }}
                            >
                                {ctaSecondaryLabel}
                            </a>
                            <a
                                href={ctaPrimaryHref}
                                style={{
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#FFFFFF",
                                    textDecoration: "none",
                                    padding: "8px 18px",
                                    borderRadius: "8px",
                                    backgroundColor: primaryColor,
                                    transition: "background 0.15s",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#1E293B"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = primaryColor
                                }}
                            >
                                {ctaPrimaryLabel}
                            </a>
                        </div>
                    )}

                    {/* Mobile Menu Button */}
                    {isMobile && (
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            {showMobilePrimaryCTA && (
                                <a
                                    href={ctaPrimaryHref}
                                    style={{
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        color: "#FFFFFF",
                                        textDecoration: "none",
                                        padding: "6px 14px",
                                        borderRadius: "20px",
                                        backgroundColor: "#000000",
                                    }}
                                >
                                    {ctaPrimaryLabel}
                                </a>
                            )}
                            <button
                                onClick={() => startTransition(() => setMobileMenuOpen(!mobileMenuOpen))}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "4px",
                                }}
                                aria-label="Toggle menu"
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20">
                                    <path
                                        d="M3 5h14M3 10h14M3 15h14"
                                        stroke={primaryColor}
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {isMobile && mobileMenuOpen && (
                <div
                    style={{
                        position: "fixed",
                        top: showAnnouncement ? "calc(58px + 36px)" : "58px",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "#FFFFFF",
                        zIndex: 99,
                        overflowY: "auto",
                        overflowX: "hidden",
                        padding: "16px 20px 40px 20px",
                        WebkitOverflowScrolling: "touch",
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", minHeight: "100%" }}>
                        {showProduct && (
                            <a
                                href={productHref}
                                style={{
                                    fontSize: "16px",
                                    fontWeight: 500,
                                    color: "#374151",
                                    textDecoration: "none",
                                    padding: "14px 12px",
                                    borderBottom: "1px solid #F3F4F6",
                                }}
                            >
                                {productLabel}
                            </a>
                        )}

                        {/* Mobile Solutions Accordion */}
                        {showSolutions && (
                            <div style={{ borderBottom: "1px solid #F3F4F6" }}>
                                <button
                                    onClick={() =>
                                        startTransition(() => setMobileSolutionsOpen(!mobileSolutionsOpen))
                                    }
                                    style={{
                                        width: "100%",
                                        fontSize: "16px",
                                        fontWeight: 500,
                                        color: "#374151",
                                        background: "none",
                                        border: "none",
                                        padding: "14px 12px",
                                        textAlign: "left",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        cursor: "pointer",
                                    }}
                                >
                                    {solutionsLabel}
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 12 12"
                                        style={{
                                            transform: mobileSolutionsOpen ? "rotate(180deg)" : "rotate(0deg)",
                                            transition: "transform 0.2s ease",
                                        }}
                                    >
                                        <path
                                            d="M3 4.5L6 7.5L9 4.5"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            fill="none"
                                        />
                                    </svg>
                                </button>
                                {mobileSolutionsOpen && (
                                    <div
                                        style={{
                                            paddingLeft: "12px",
                                            paddingRight: "12px",
                                            paddingBottom: "12px",
                                            maxHeight: "600px",
                                            overflowY: "auto",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "11px",
                                                color: "#9CA3AF",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.06em",
                                                fontWeight: 600,
                                                marginBottom: "8px",
                                                marginTop: "4px",
                                            }}
                                        >
                                            {solutionsData.left.title}
                                        </div>
                                        {solutionsData.left.items.map((item, i) => (
                                            <a
                                                key={i}
                                                href={item.href}
                                                style={{
                                                    display: "block",
                                                    padding: "10px 8px",
                                                    fontSize: "14px",
                                                    fontWeight: 500,
                                                    color: "#1A1A1A",
                                                    textDecoration: "none",
                                                    borderRadius: "6px",
                                                    lineHeight: "1.4",
                                                }}
                                            >
                                                <div style={{ marginBottom: "2px" }}>{item.title}</div>
                                                {item.desc && (
                                                    <div
                                                        style={{
                                                            fontSize: "12px",
                                                            color: "#6B7280",
                                                            fontWeight: 400,
                                                        }}
                                                    >
                                                        {item.desc}
                                                    </div>
                                                )}
                                            </a>
                                        ))}
                                        <div
                                            style={{
                                                fontSize: "11px",
                                                color: "#9CA3AF",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.06em",
                                                fontWeight: 600,
                                                marginTop: "20px",
                                                marginBottom: "8px",
                                            }}
                                        >
                                            {solutionsData.right.title}
                                        </div>
                                        {solutionsData.right.items.map((item, i) => (
                                            <a
                                                key={i}
                                                href={item.href}
                                                style={{
                                                    display: "block",
                                                    padding: "10px 8px",
                                                    fontSize: "14px",
                                                    fontWeight: 500,
                                                    color: "#1A1A1A",
                                                    textDecoration: "none",
                                                    borderRadius: "6px",
                                                    lineHeight: "1.4",
                                                }}
                                            >
                                                {item.title}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Mobile Resources Accordion */}
                        {showResources && (
                            <div style={{ borderBottom: "1px solid #F3F4F6" }}>
                                <button
                                    onClick={() =>
                                        startTransition(() => setMobileResourcesOpen(!mobileResourcesOpen))
                                    }
                                    style={{
                                        width: "100%",
                                        fontSize: "16px",
                                        fontWeight: 500,
                                        color: "#374151",
                                        background: "none",
                                        border: "none",
                                        padding: "14px 12px",
                                        textAlign: "left",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        cursor: "pointer",
                                    }}
                                >
                                    {resourcesLabel}
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 12 12"
                                        style={{
                                            transform: mobileResourcesOpen ? "rotate(180deg)" : "rotate(0deg)",
                                            transition: "transform 0.2s ease",
                                        }}
                                    >
                                        <path
                                            d="M3 4.5L6 7.5L9 4.5"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            fill="none"
                                        />
                                    </svg>
                                </button>
                                {mobileResourcesOpen && (
                                    <div
                                        style={{
                                            paddingLeft: "12px",
                                            paddingRight: "12px",
                                            paddingBottom: "12px",
                                        }}
                                    >
                                        {resourcesData.map((item, i) => (
                                            <a
                                                key={i}
                                                href={item.href}
                                                style={{
                                                    display: "block",
                                                    padding: "10px 8px",
                                                    fontSize: "14px",
                                                    fontWeight: 500,
                                                    color: "#1A1A1A",
                                                    textDecoration: "none",
                                                    borderRadius: "6px",
                                                    lineHeight: "1.4",
                                                }}
                                            >
                                                {item.title}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {showEnterprise && (
                            <a
                                href={enterpriseHref}
                                style={{
                                    fontSize: "16px",
                                    fontWeight: 500,
                                    color: "#374151",
                                    textDecoration: "none",
                                    padding: "14px 12px",
                                    borderBottom: "1px solid #F3F4F6",
                                }}
                            >
                                {enterpriseLabel}
                            </a>
                        )}

                        {showPricing && (
                            <a
                                href={pricingHref}
                                style={{
                                    fontSize: "16px",
                                    fontWeight: 500,
                                    color: "#374151",
                                    textDecoration: "none",
                                    padding: "14px 12px",
                                    borderBottom: "1px solid #F3F4F6",
                                }}
                            >
                                {pricingLabel}
                            </a>
                        )}

                        {/* Mobile CTAs */}
                        <div
                            style={{
                                marginTop: "32px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "12px",
                                paddingBottom: "20px",
                            }}
                        >
                            <a
                                href={ctaPrimaryHref}
                                style={{
                                    fontSize: "15px",
                                    fontWeight: 600,
                                    color: "#FFFFFF",
                                    textDecoration: "none",
                                    padding: "14px 20px",
                                    borderRadius: "8px",
                                    backgroundColor: primaryColor,
                                    textAlign: "center",
                                }}
                            >
                                {ctaPrimaryLabel}
                            </a>
                            <a
                                href={ctaSecondaryHref}
                                style={{
                                    fontSize: "15px",
                                    fontWeight: 500,
                                    color: "#374151",
                                    textDecoration: "none",
                                    padding: "14px 20px",
                                    borderRadius: "8px",
                                    border: "1px solid #D1D5DB",
                                    backgroundColor: "transparent",
                                    textAlign: "center",
                                }}
                            >
                                {ctaSecondaryLabel}
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

addPropertyControls(DittoNavbar, {
    announcementText: {
        type: ControlType.String,
        title: "Announcement",
        defaultValue: "Introducing AI-first localization, now in Ditto →",
    },
    announcementBg: {
        type: ControlType.Color,
        title: "Announcement BG",
        defaultValue: "#FEF3C7",
    },
    announcementHref: {
        type: ControlType.String,
        title: "Announcement Link",
        defaultValue: "https://l10n.dittowords.com",
    },
    logoMark: {
        type: ControlType.ResponsiveImage,
        title: "Logo Mark",
    },
    logoText: {
        type: ControlType.String,
        title: "Logo Text",
        defaultValue: "Ditto",
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#0F172A",
    },
    ctaPrimaryLabel: {
        type: ControlType.String,
        title: "Primary CTA",
        defaultValue: "Get Started",
    },
    ctaPrimaryHref: {
        type: ControlType.String,
        title: "Primary CTA Link",
        defaultValue: "https://app.dittowords.com/",
    },
    ctaSecondaryLabel: {
        type: ControlType.String,
        title: "Secondary CTA",
        defaultValue: "Book a Demo",
    },
    ctaSecondaryHref: {
        type: ControlType.String,
        title: "Secondary CTA Link",
        defaultValue: "#",
    },
    showMobilePrimaryCTA: {
        type: ControlType.Boolean,
        title: "Show Mobile Primary CTA",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    // Product Menu Item
    showProduct: {
        type: ControlType.Boolean,
        title: "Show Product",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    productLabel: {
        type: ControlType.String,
        title: "Product Label",
        defaultValue: "Product",
        hidden: ({ showProduct }) => !showProduct,
    },
    productHref: {
        type: ControlType.String,
        title: "Product Link",
        defaultValue: "#",
        hidden: ({ showProduct }) => !showProduct,
    },
    // Solutions Menu
    showSolutions: {
        type: ControlType.Boolean,
        title: "Show Solutions",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    solutionsLabel: {
        type: ControlType.String,
        title: "Solutions Label",
        defaultValue: "Solutions",
        hidden: ({ showSolutions }) => !showSolutions,
    },
    solutionsLeftTitle: {
        type: ControlType.String,
        title: "Left Section Title",
        defaultValue: "Tailored to your needs",
        hidden: ({ showSolutions }) => !showSolutions,
    },
    solutionsLeftItems: {
        type: ControlType.Array,
        title: "Left Section Items",
        control: {
            type: ControlType.Object,
            controls: {
                show: {
                    type: ControlType.Boolean,
                    title: "Show",
                    defaultValue: true,
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Menu Item",
                },
                desc: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Description text",
                },
                href: {
                    type: ControlType.String,
                    title: "Link",
                    defaultValue: "#",
                },
            },
        },
        defaultValue: [
            {
                title: "For Content Designers",
                desc: "Build and manage product copy",
                href: "/roles/for-content-designers",
                show: true,
            },
            {
                title: "For Developers",
                desc: "Integrate copy into your codebase",
                href: "/roles/for-developers",
                show: true,
            },
            {
                title: "For Localization Managers",
                desc: "Scale localization workflows",
                href: "/roles/for-localization-managers",
                show: true,
            },
            {
                title: "For Product Designers",
                desc: "Keep designs and copy in sync",
                href: "/roles/for-product-designers",
                show: true,
            },
        ],
        hidden: ({ showSolutions }) => !showSolutions,
    },
    solutionsRightTitle: {
        type: ControlType.String,
        title: "Right Section Title",
        defaultValue: "Trusted across use cases",
        hidden: ({ showSolutions }) => !showSolutions,
    },
    solutionsRightItems: {
        type: ControlType.Array,
        title: "Right Section Items",
        control: {
            type: ControlType.Object,
            controls: {
                show: {
                    type: ControlType.Boolean,
                    title: "Show",
                    defaultValue: true,
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Menu Item",
                },
                href: {
                    type: ControlType.String,
                    title: "Link",
                    defaultValue: "#",
                },
            },
        },
        defaultValue: [
            { title: "Build a Reusable Text Library", href: "#", show: true },
            { title: "Centralize Copy Reviews", href: "#", show: true },
            { title: "Build an AI Content System", href: "#", show: true },
            { title: "Keep Designs in Sync", href: "#", show: true },
            { title: "Integrate with Engineering", href: "#", show: true },
            { title: "Localize Product Copy", href: "#", show: true },
        ],
        hidden: ({ showSolutions }) => !showSolutions,
    },
    // Resources Menu
    showResources: {
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
        hidden: ({ showResources }) => !showResources,
    },
    resourcesItems: {
        type: ControlType.Array,
        title: "Resources Items",
        control: {
            type: ControlType.Object,
            controls: {
                show: {
                    type: ControlType.Boolean,
                    title: "Show",
                    defaultValue: true,
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Menu Item",
                },
                href: {
                    type: ControlType.String,
                    title: "Link",
                    defaultValue: "#",
                },
            },
        },
        defaultValue: [
            { title: "Blog", href: "#", show: true },
            { title: "What's New", href: "#", show: true },
            { title: "Help Center", href: "#", show: true },
            { title: "Developer Docs", href: "#", show: true },
        ],
        hidden: ({ showResources }) => !showResources,
    },
    // Enterprise Menu Item
    showEnterprise: {
        type: ControlType.Boolean,
        title: "Show Enterprise",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    enterpriseLabel: {
        type: ControlType.String,
        title: "Enterprise Label",
        defaultValue: "Enterprise",
        hidden: ({ showEnterprise }) => !showEnterprise,
    },
    enterpriseHref: {
        type: ControlType.String,
        title: "Enterprise Link",
        defaultValue: "#",
        hidden: ({ showEnterprise }) => !showEnterprise,
    },
    // Pricing Menu Item
    showPricing: {
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
        hidden: ({ showPricing }) => !showPricing,
    },
    pricingHref: {
        type: ControlType.String,
        title: "Pricing Link",
        defaultValue: "#",
        hidden: ({ showPricing }) => !showPricing,
    },
    dropdownBorderRadius: {
        type: ControlType.Number,
        title: "Dropdown Radius",
        defaultValue: 12,
        min: 0,
        max: 24,
        step: 1,
        unit: "px",
    },
    navFontSize: {
        type: ControlType.Number,
        title: "Nav Font Size",
        defaultValue: 14,
        min: 12,
        max: 18,
        step: 1,
        unit: "px",
    },
})
