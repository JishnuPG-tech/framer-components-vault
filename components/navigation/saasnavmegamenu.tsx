// Create a fully responsive, pixel-perfect navigation bar component in Framer that exactly replicates the Playground (tryplayground.com) navbar
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useEffect, useCallback, startTransition, type CSSProperties } from "react"

interface NavItem {
    label: string
    href?: string
    hasDropdown?: boolean
    isNew?: boolean
}

interface MenuItem {
    label: string
    href: string
    isNew: boolean
}

interface BuiltForItem {
    label: string
    href: string
    description: string
    icon?: { src: string; alt?: string }
}

interface PlaygroundNavbarProps {
    showAnnouncementBar: boolean
    announcementText: string
    announcementHref: string
    announcementBg: string
    logoType: "icon-text" | "icon-only" | "text-only"
    logoImage?: { src: string; alt?: string }
    logoText: string
    primaryColor: string
    phoneNumber: string
    showPhone: boolean
    ctaLabel: string
    ctaHref: string
    showNewBadges: boolean
    dropdownBorderRadius: number
    mobileBreakpoint: number
    tabletBreakpoint: number
    showAppStoreBadges: boolean
    
    // Platform Solutions (16 items)
    platformSolutions: MenuItem[]
    
    // Platform Resources (7 items)
    platformResources: MenuItem[]
    
    // Built For (6 items)
    builtForItems: BuiltForItem[]
    
    // Switch to Playground (3 items)
    switchItems: MenuItem[]
    
    // Resources (4 items)
    resourcesItems: MenuItem[]
    
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function PlaygroundNavbar(props: PlaygroundNavbarProps) {
    const {
        showAnnouncementBar,
        announcementText,
        announcementHref,
        announcementBg,
        logoType,
        logoImage,
        logoText,
        primaryColor,
        phoneNumber,
        showPhone,
        ctaLabel,
        ctaHref,
        showNewBadges,
        dropdownBorderRadius,
        mobileBreakpoint,
        tabletBreakpoint,
        showAppStoreBadges,
        platformSolutions,
        platformResources,
        builtForItems,
        switchItems,
        resourcesItems,
    } = props

    const [scrolled, setScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
    const [mobileAccordion, setMobileAccordion] = useState<string | null>(null)
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== "undefined" ? window.innerWidth : 1200
    )

    useEffect(() => {
        if (typeof window === "undefined") return

        const handleScroll = () => {
            startTransition(() => {
                setScrolled(window.scrollY > 10)
            })
        }

        const handleResize = () => {
            startTransition(() => {
                setWindowWidth(window.innerWidth)
            })
        }

        window.addEventListener("scroll", handleScroll)
        window.addEventListener("resize", handleResize)

        return () => {
            window.removeEventListener("scroll", handleScroll)
            window.removeEventListener("resize", handleResize)
        }
    }, [])

    const isMobile = windowWidth <= mobileBreakpoint
    const isTablet = windowWidth > mobileBreakpoint && windowWidth <= tabletBreakpoint

    const toggleDropdown = useCallback((name: string) => {
        startTransition(() => {
            setActiveDropdown((prev) => (prev === name ? null : name))
        })
    }, [])

    const closeDropdown = useCallback(() => {
        startTransition(() => {
            setActiveDropdown(null)
        })
    }, [])

    const toggleMobileMenu = useCallback(() => {
        startTransition(() => {
            setMobileMenuOpen((prev) => !prev)
        })
    }, [])

    const toggleMobileAccordion = useCallback((name: string) => {
        startTransition(() => {
            setMobileAccordion((prev) => (prev === name ? null : name))
        })
    }, [])

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                fontFamily: "Inter, -apple-system, sans-serif",
            }}
        >
            {/* Announcement Bar */}
            {showAnnouncementBar && (
                <a
                    href={announcementHref}
                    style={{
                        display: "block",
                        width: "100%",
                        height: "38px",
                        backgroundColor: announcementBg,
                        textDecoration: "none",
                        transition: "background-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#DBEAFE"
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = announcementBg
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "#1D4ED8",
                        }}
                    >
                        {announcementText}
                    </div>
                </a>
            )}

            {/* Main Navbar */}
            <nav
                aria-label="Main navigation"
                style={{
                    position: "sticky",
                    top: 0,
                    width: "100%",
                    height: isMobile ? "56px" : "64px",
                    backgroundColor: "#FFFFFF",
                    borderBottom: "1px solid #F3F4F6",
                    zIndex: 100,
                    boxShadow: scrolled ? "0 2px 12px rgba(0,0,0,0.08)" : "none",
                    transition: "box-shadow 0.3s ease",
                }}
            >
                <div
                    style={{
                        maxWidth: "1200px",
                        height: "100%",
                        margin: "0 auto",
                        padding: isMobile ? "0 16px" : "0 40px",
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
                            gap: "10px",
                            textDecoration: "none",
                        }}
                    >
                        {(logoType === "icon-text" || logoType === "icon-only") && (
                            logoImage ? (
                                <img
                                    src={logoImage.src}
                                    alt={logoImage.alt || "Logo"}
                                    style={{
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "10px",
                                        objectFit: "cover",
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: "32px",
                                        height: "32px",
                                        backgroundColor: primaryColor,
                                        borderRadius: "10px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#FFFFFF",
                                        fontSize: "18px",
                                        fontWeight: 700,
                                    }}
                                >
                                    P
                                </div>
                            )
                        )}
                        {(logoType === "icon-text" || logoType === "text-only") && (
                            <span
                                style={{
                                    fontSize: "16px",
                                    fontWeight: 700,
                                    color: "#111827",
                                    letterSpacing: "-0.02em",
                                }}
                            >
                                {logoText}
                            </span>
                        )}
                    </a>

                    {/* Desktop Nav Links */}
                    {!isMobile && !isTablet && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                            }}
                        >
                            {/* Platform */}
                            <div style={{ position: "relative" }}>
                                <button
                                    aria-haspopup="true"
                                    aria-expanded={activeDropdown === "platform"}
                                    onClick={() => toggleDropdown("platform")}
                                    style={{
                                        fontSize: "14px",
                                        fontWeight: 450,
                                        color: activeDropdown === "platform" ? "#111827" : "#374151",
                                        padding: "8px 14px",
                                        borderRadius: "8px",
                                        backgroundColor:
                                            activeDropdown === "platform" ? "#F9FAFB" : "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (activeDropdown !== "platform") {
                                            e.currentTarget.style.backgroundColor = "#F9FAFB"
                                            e.currentTarget.style.color = "#111827"
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (activeDropdown !== "platform") {
                                            e.currentTarget.style.backgroundColor = "transparent"
                                            e.currentTarget.style.color = "#374151"
                                        }
                                    }}
                                >
                                    Platform
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 12 12"
                                        fill="none"
                                        style={{
                                            transform:
                                                activeDropdown === "platform"
                                                    ? "rotate(180deg)"
                                                    : "rotate(0deg)",
                                            transition: "transform 0.2s ease",
                                        }}
                                    >
                                        <path
                                            d="M3 4.5L6 7.5L9 4.5"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>

                                {/* Platform Dropdown */}
                                {activeDropdown === "platform" && (
                                    <div
                                        role="menu"
                                        style={{
                                            position: "absolute",
                                            top: "calc(100% + 8px)",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            minWidth: "680px",
                                            backgroundColor: "#FFFFFF",
                                            border: "1px solid #E5E7EB",
                                            borderRadius: `${dropdownBorderRadius}px`,
                                            boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
                                            padding: "28px",
                                            display: "grid",
                                            gridTemplateColumns: "2fr 1fr",
                                            gap: "32px",
                                            zIndex: 1000,
                                        }}
                                    >
                                        {/* Solutions Column */}
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: "11px",
                                                    fontWeight: 600,
                                                    color: "#9CA3AF",
                                                    textTransform: "uppercase",
                                                    marginBottom: "12px",
                                                    letterSpacing: "0.05em",
                                                }}
                                            >
                                                Solutions
                                            </div>
                                            <div
                                                style={{
                                                    display: "grid",
                                                    gridTemplateColumns: "1fr 1fr",
                                                    gap: "4px",
                                                }}
                                            >
                                                {platformSolutions.map((item) => (
                                                    <a
                                                        key={item.label}
                                                        href={item.href}
                                                        aria-label={
                                                            item.isNew
                                                                ? `${item.label} - New feature`
                                                                : item.label
                                                        }
                                                        style={{
                                                            fontSize: "13px",
                                                            fontWeight: 400,
                                                            color: "#374151",
                                                            padding: "6px 8px",
                                                            borderRadius: "6px",
                                                            textDecoration: "none",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "6px",
                                                            transition: "background-color 0.2s ease",
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = "#EFF6FF"
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor =
                                                                "transparent"
                                                        }}
                                                    >
                                                        {item.label}
                                                        {item.isNew && (
                                                            <span
                                                                style={{
                                                                    fontSize: "8px",
                                                                    fontWeight: 600,
                                                                    color: primaryColor,
                                                                    backgroundColor: "#EFF6FF",
                                                                    padding: "1px 6px",
                                                                    borderRadius: "20px",
                                                                }}
                                                            >
                                                                New!
                                                            </span>
                                                        )}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Resources Column */}
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: "11px",
                                                    fontWeight: 600,
                                                    color: "#9CA3AF",
                                                    textTransform: "uppercase",
                                                    marginBottom: "12px",
                                                    letterSpacing: "0.05em",
                                                }}
                                            >
                                                Resources
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                {platformResources.map((item) => (
                                                    <a
                                                        key={item.label}
                                                        href={item.href}
                                                        aria-label={
                                                            item.isNew
                                                                ? `${item.label} - New feature`
                                                                : item.label
                                                        }
                                                        style={{
                                                            fontSize: "13px",
                                                            fontWeight: 400,
                                                            color: "#374151",
                                                            padding: "6px 8px",
                                                            borderRadius: "6px",
                                                            textDecoration: "none",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "6px",
                                                            transition: "background-color 0.2s ease",
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = "#EFF6FF"
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor =
                                                                "transparent"
                                                        }}
                                                    >
                                                        {item.label}
                                                        {item.isNew && (
                                                            <span
                                                                style={{
                                                                    fontSize: "8px",
                                                                    fontWeight: 600,
                                                                    color: primaryColor,
                                                                    backgroundColor: "#EFF6FF",
                                                                    padding: "1px 6px",
                                                                    borderRadius: "20px",
                                                                }}
                                                            >
                                                                New!
                                                            </span>
                                                        )}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Switch to Playground */}
                            <div style={{ position: "relative" }}>
                                <button
                                    aria-haspopup="true"
                                    aria-expanded={activeDropdown === "switch"}
                                    onClick={() => toggleDropdown("switch")}
                                    style={{
                                        fontSize: "14px",
                                        fontWeight: 450,
                                        color: activeDropdown === "switch" ? "#111827" : "#374151",
                                        padding: "8px 14px",
                                        borderRadius: "8px",
                                        backgroundColor:
                                            activeDropdown === "switch" ? "#F9FAFB" : "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (activeDropdown !== "switch") {
                                            e.currentTarget.style.backgroundColor = "#F9FAFB"
                                            e.currentTarget.style.color = "#111827"
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (activeDropdown !== "switch") {
                                            e.currentTarget.style.backgroundColor = "transparent"
                                            e.currentTarget.style.color = "#374151"
                                        }
                                    }}
                                >
                                    Switch to Playground
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 12 12"
                                        fill="none"
                                        style={{
                                            transform:
                                                activeDropdown === "switch"
                                                    ? "rotate(180deg)"
                                                    : "rotate(0deg)",
                                            transition: "transform 0.2s ease",
                                        }}
                                    >
                                        <path
                                            d="M3 4.5L6 7.5L9 4.5"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>

                                {activeDropdown === "switch" && (
                                    <div
                                        role="menu"
                                        style={{
                                            position: "absolute",
                                            top: "calc(100% + 8px)",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            minWidth: "280px",
                                            backgroundColor: "#FFFFFF",
                                            border: "1px solid #E5E7EB",
                                            borderRadius: `${dropdownBorderRadius}px`,
                                            boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
                                            padding: "16px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "8px",
                                            zIndex: 1000,
                                        }}
                                    >
                                        {switchItems.map((item) => (
                                            <a
                                                key={item.label}
                                                href={item.href}
                                                style={{
                                                    fontSize: "13px",
                                                    fontWeight: 400,
                                                    color: "#374151",
                                                    padding: "12px",
                                                    borderRadius: "8px",
                                                    textDecoration: "none",
                                                    border: "1px solid #E5E7EB",
                                                    backgroundColor: "#FFFFFF",
                                                    transition: "all 0.2s ease",
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = "#F9FAFB"
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = "#FFFFFF"
                                                }}
                                            >
                                                {item.label}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Built for */}
                            <div style={{ position: "relative" }}>
                                <button
                                    aria-haspopup="true"
                                    aria-expanded={activeDropdown === "builtfor"}
                                    onClick={() => toggleDropdown("builtfor")}
                                    style={{
                                        fontSize: "14px",
                                        fontWeight: 450,
                                        color: activeDropdown === "builtfor" ? "#111827" : "#374151",
                                        padding: "8px 14px",
                                        borderRadius: "8px",
                                        backgroundColor:
                                            activeDropdown === "builtfor" ? "#F9FAFB" : "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (activeDropdown !== "builtfor") {
                                            e.currentTarget.style.backgroundColor = "#F9FAFB"
                                            e.currentTarget.style.color = "#111827"
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (activeDropdown !== "builtfor") {
                                            e.currentTarget.style.backgroundColor = "transparent"
                                            e.currentTarget.style.color = "#374151"
                                        }
                                    }}
                                >
                                    Built for
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 12 12"
                                        fill="none"
                                        style={{
                                            transform:
                                                activeDropdown === "builtfor"
                                                    ? "rotate(180deg)"
                                                    : "rotate(0deg)",
                                            transition: "transform 0.2s ease",
                                        }}
                                    >
                                        <path
                                            d="M3 4.5L6 7.5L9 4.5"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>

                                {activeDropdown === "builtfor" && (
                                    <div
                                        role="menu"
                                        style={{
                                            position: "absolute",
                                            top: "calc(100% + 8px)",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            minWidth: "320px",
                                            backgroundColor: "#FFFFFF",
                                            border: "1px solid #E5E7EB",
                                            borderRadius: `${dropdownBorderRadius}px`,
                                            boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
                                            padding: "16px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "4px",
                                            zIndex: 1000,
                                        }}
                                    >
                                        {builtForItems.map((item) => (
                                            <a
                                                key={item.label}
                                                href={item.href}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    gap: "12px",
                                                    padding: "10px",
                                                    borderRadius: "8px",
                                                    textDecoration: "none",
                                                    transition: "background-color 0.2s ease",
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = "#F9FAFB"
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = "transparent"
                                                }}
                                            >
                                                {item.icon ? (
                                                    <img
                                                        src={item.icon.src}
                                                        alt={item.icon.alt || ""}
                                                        style={{
                                                            width: "32px",
                                                            height: "32px",
                                                            borderRadius: "8px",
                                                            objectFit: "cover",
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                ) : (
                                                    <div
                                                        style={{
                                                            width: "32px",
                                                            height: "32px",
                                                            backgroundColor: "#EFF6FF",
                                                            borderRadius: "8px",
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                )}
                                                <div>
                                                    <div
                                                        style={{
                                                            fontSize: "13px",
                                                            fontWeight: 500,
                                                            color: "#111827",
                                                            marginBottom: "2px",
                                                        }}
                                                    >
                                                        {item.label}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: "12px",
                                                            fontWeight: 400,
                                                            color: "#6B7280",
                                                        }}
                                                    >
                                                        {item.description}
                                                    </div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Resources */}
                            <div style={{ position: "relative" }}>
                                <button
                                    aria-haspopup="true"
                                    aria-expanded={activeDropdown === "resources"}
                                    onClick={() => toggleDropdown("resources")}
                                    style={{
                                        fontSize: "14px",
                                        fontWeight: 450,
                                        color: activeDropdown === "resources" ? "#111827" : "#374151",
                                        padding: "8px 14px",
                                        borderRadius: "8px",
                                        backgroundColor:
                                            activeDropdown === "resources" ? "#F9FAFB" : "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (activeDropdown !== "resources") {
                                            e.currentTarget.style.backgroundColor = "#F9FAFB"
                                            e.currentTarget.style.color = "#111827"
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (activeDropdown !== "resources") {
                                            e.currentTarget.style.backgroundColor = "transparent"
                                            e.currentTarget.style.color = "#374151"
                                        }
                                    }}
                                >
                                    Resources
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 12 12"
                                        fill="none"
                                        style={{
                                            transform:
                                                activeDropdown === "resources"
                                                    ? "rotate(180deg)"
                                                    : "rotate(0deg)",
                                            transition: "transform 0.2s ease",
                                        }}
                                    >
                                        <path
                                            d="M3 4.5L6 7.5L9 4.5"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>

                                {activeDropdown === "resources" && (
                                    <div
                                        role="menu"
                                        style={{
                                            position: "absolute",
                                            top: "calc(100% + 8px)",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            minWidth: "220px",
                                            backgroundColor: "#FFFFFF",
                                            border: "1px solid #E5E7EB",
                                            borderRadius: `${dropdownBorderRadius}px`,
                                            boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
                                            padding: "12px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "4px",
                                            zIndex: 1000,
                                        }}
                                    >
                                        {resourcesItems.map((item) => (
                                            <a
                                                key={item.label}
                                                href={item.href}
                                                style={{
                                                    fontSize: "13px",
                                                    fontWeight: 400,
                                                    color: "#374151",
                                                    padding: "8px 10px",
                                                    borderRadius: "6px",
                                                    textDecoration: "none",
                                                    transition: "background-color 0.2s ease",
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = "#F9FAFB"
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = "transparent"
                                                }}
                                            >
                                                {item.label}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Right Side - Phone + CTA */}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        {!isMobile && !isTablet && showPhone && (
                            <a
                                href={`tel:${phoneNumber}`}
                                aria-label={`Call us at ${phoneNumber}`}
                                style={{
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    color: "#374151",
                                    textDecoration: "none",
                                    transition: "color 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = primaryColor
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = "#374151"
                                }}
                            >
                                {phoneNumber}
                            </a>
                        )}

                        {!isMobile && (
                            <a
                                href={ctaHref}
                                style={{
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    color: "#FFFFFF",
                                    backgroundColor: primaryColor,
                                    padding: "9px 20px",
                                    borderRadius: "10px",
                                    textDecoration: "none",
                                    transition: "background-color 0.2s ease",
                                    whiteSpace: "nowrap",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#1D4ED8"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = primaryColor
                                }}
                            >
                                {ctaLabel}
                            </a>
                        )}

                        {/* Mobile Hamburger */}
                        {isMobile && (
                            <button
                                onClick={toggleMobileMenu}
                                aria-label="Toggle mobile menu"
                                style={{
                                    width: "40px",
                                    height: "40px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border: "none",
                                    backgroundColor: "transparent",
                                    cursor: "pointer",
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path
                                        d="M3 5h14M3 10h14M3 15h14"
                                        stroke={primaryColor}
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            {isMobile && mobileMenuOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    style={{
                        position: "fixed",
                        top: 0,
                        right: 0,
                        width: "100%",
                        height: "100vh",
                        backgroundColor: "#FFFFFF",
                        zIndex: 1000,
                        overflowY: "auto",
                        padding: "20px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "32px",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {(logoType === "icon-text" || logoType === "icon-only") && (
                                logoImage ? (
                                    <img
                                        src={logoImage.src}
                                        alt={logoImage.alt || "Logo"}
                                        style={{
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "10px",
                                            objectFit: "cover",
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: "32px",
                                            height: "32px",
                                            backgroundColor: primaryColor,
                                            borderRadius: "10px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#FFFFFF",
                                            fontSize: "18px",
                                            fontWeight: 700,
                                        }}
                                    >
                                        P
                                    </div>
                                )
                            )}
                            {(logoType === "icon-text" || logoType === "text-only") && (
                                <span
                                    style={{
                                        fontSize: "16px",
                                        fontWeight: 700,
                                        color: "#111827",
                                    }}
                                >
                                    {logoText}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={toggleMobileMenu}
                            aria-label="Close mobile menu"
                            style={{
                                width: "40px",
                                height: "40px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "none",
                                backgroundColor: "transparent",
                                cursor: "pointer",
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path
                                    d="M5 5l10 10M15 5l-10 10"
                                    stroke="#374151"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        <a
                            href={ctaHref}
                            style={{
                                fontSize: "16px",
                                fontWeight: 600,
                                color: "#FFFFFF",
                                backgroundColor: primaryColor,
                                padding: "14px 24px",
                                borderRadius: "10px",
                                textDecoration: "none",
                                textAlign: "center",
                            }}
                        >
                            {ctaLabel}
                        </a>

                        {showPhone && (
                            <a
                                href={`tel:${phoneNumber}`}
                                style={{
                                    fontSize: "16px",
                                    fontWeight: 500,
                                    color: primaryColor,
                                    textAlign: "center",
                                    textDecoration: "none",
                                }}
                            >
                                {phoneNumber}
                            </a>
                        )}

                        {/* Mobile Navigation Accordions */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
                            {/* Platform Accordion */}
                            <div style={{ borderBottom: "1px solid #E5E7EB" }}>
                                <button
                                    onClick={() => toggleMobileAccordion("platform")}
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "16px 0",
                                        fontSize: "16px",
                                        fontWeight: 500,
                                        color: "#111827",
                                        backgroundColor: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                    }}
                                >
                                    Platform
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        style={{
                                            transform: mobileAccordion === "platform" ? "rotate(180deg)" : "rotate(0deg)",
                                            transition: "transform 0.2s ease",
                                        }}
                                    >
                                        <path
                                            d="M4 6l4 4 4-4"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                                {mobileAccordion === "platform" && (
                                    <div style={{ paddingBottom: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                                        <div>
                                            <div style={{ fontSize: "11px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.05em" }}>
                                                Solutions
                                            </div>
                                            {platformSolutions.map((item) => (
                                                <a
                                                    key={item.label}
                                                    href={item.href}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        padding: "8px 0",
                                                        fontSize: "14px",
                                                        color: "#374151",
                                                        textDecoration: "none",
                                                    }}
                                                >
                                                    {item.label}
                                                    {item.isNew && (
                                                        <span
                                                            style={{
                                                                fontSize: "8px",
                                                                fontWeight: 600,
                                                                color: primaryColor,
                                                                backgroundColor: "#EFF6FF",
                                                                padding: "1px 6px",
                                                                borderRadius: "20px",
                                                            }}
                                                        >
                                                            New!
                                                        </span>
                                                    )}
                                                </a>
                                            ))}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "11px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.05em" }}>
                                                Resources
                                            </div>
                                            {platformResources.map((item) => (
                                                <a
                                                    key={item.label}
                                                    href={item.href}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        padding: "8px 0",
                                                        fontSize: "14px",
                                                        color: "#374151",
                                                        textDecoration: "none",
                                                    }}
                                                >
                                                    {item.label}
                                                    {item.isNew && (
                                                        <span
                                                            style={{
                                                                fontSize: "8px",
                                                                fontWeight: 600,
                                                                color: primaryColor,
                                                                backgroundColor: "#EFF6FF",
                                                                padding: "1px 6px",
                                                                borderRadius: "20px",
                                                            }}
                                                        >
                                                            New!
                                                        </span>
                                                    )}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Switch to Playground Accordion */}
                            <div style={{ borderBottom: "1px solid #E5E7EB" }}>
                                <button
                                    onClick={() => toggleMobileAccordion("switch")}
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "16px 0",
                                        fontSize: "16px",
                                        fontWeight: 500,
                                        color: "#111827",
                                        backgroundColor: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                    }}
                                >
                                    Switch to Playground
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        style={{
                                            transform: mobileAccordion === "switch" ? "rotate(180deg)" : "rotate(0deg)",
                                            transition: "transform 0.2s ease",
                                        }}
                                    >
                                        <path
                                            d="M4 6l4 4 4-4"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                                {mobileAccordion === "switch" && (
                                    <div style={{ paddingBottom: "16px" }}>
                                        {switchItems.map((item) => (
                                            <a
                                                key={item.label}
                                                href={item.href}
                                                style={{
                                                    display: "block",
                                                    padding: "12px",
                                                    marginBottom: "8px",
                                                    fontSize: "14px",
                                                    color: "#374151",
                                                    textDecoration: "none",
                                                    border: "1px solid #E5E7EB",
                                                    borderRadius: "8px",
                                                    backgroundColor: "#FFFFFF",
                                                }}
                                            >
                                                {item.label}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Built For Accordion */}
                            <div style={{ borderBottom: "1px solid #E5E7EB" }}>
                                <button
                                    onClick={() => toggleMobileAccordion("builtfor")}
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "16px 0",
                                        fontSize: "16px",
                                        fontWeight: 500,
                                        color: "#111827",
                                        backgroundColor: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                    }}
                                >
                                    Built for
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        style={{
                                            transform: mobileAccordion === "builtfor" ? "rotate(180deg)" : "rotate(0deg)",
                                            transition: "transform 0.2s ease",
                                        }}
                                    >
                                        <path
                                            d="M4 6l4 4 4-4"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                                {mobileAccordion === "builtfor" && (
                                    <div style={{ paddingBottom: "16px" }}>
                                        {builtForItems.map((item) => (
                                            <a
                                                key={item.label}
                                                href={item.href}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    gap: "12px",
                                                    padding: "12px 0",
                                                    textDecoration: "none",
                                                }}
                                            >
                                                {item.icon ? (
                                                    <img
                                                        src={item.icon.src}
                                                        alt={item.icon.alt || ""}
                                                        style={{
                                                            width: "32px",
                                                            height: "32px",
                                                            borderRadius: "8px",
                                                            objectFit: "cover",
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                ) : (
                                                    <div
                                                        style={{
                                                            width: "32px",
                                                            height: "32px",
                                                            backgroundColor: "#EFF6FF",
                                                            borderRadius: "8px",
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                )}
                                                <div>
                                                    <div style={{ fontSize: "14px", fontWeight: 500, color: "#111827", marginBottom: "2px" }}>
                                                        {item.label}
                                                    </div>
                                                    <div style={{ fontSize: "12px", color: "#6B7280" }}>
                                                        {item.description}
                                                    </div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Resources Accordion */}
                            <div style={{ borderBottom: "1px solid #E5E7EB" }}>
                                <button
                                    onClick={() => toggleMobileAccordion("resources")}
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "16px 0",
                                        fontSize: "16px",
                                        fontWeight: 500,
                                        color: "#111827",
                                        backgroundColor: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                    }}
                                >
                                    Resources
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        style={{
                                            transform: mobileAccordion === "resources" ? "rotate(180deg)" : "rotate(0deg)",
                                            transition: "transform 0.2s ease",
                                        }}
                                    >
                                        <path
                                            d="M4 6l4 4 4-4"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                                {mobileAccordion === "resources" && (
                                    <div style={{ paddingBottom: "16px" }}>
                                        {resourcesItems.map((item) => (
                                            <a
                                                key={item.label}
                                                href={item.href}
                                                style={{
                                                    display: "block",
                                                    padding: "10px 0",
                                                    fontSize: "14px",
                                                    color: "#374151",
                                                    textDecoration: "none",
                                                }}
                                            >
                                                {item.label}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {showAppStoreBadges && (
                            <div
                                style={{
                                    display: "flex",
                                    gap: "12px",
                                    justifyContent: "center",
                                    marginTop: "16px",
                                }}
                            >
                                <div
                                    style={{
                                        width: "120px",
                                        height: "40px",
                                        backgroundColor: "#000000",
                                        borderRadius: "8px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#FFFFFF",
                                        fontSize: "10px",
                                    }}
                                >
                                    App Store
                                </div>
                                <div
                                    style={{
                                        width: "120px",
                                        height: "40px",
                                        backgroundColor: "#000000",
                                        borderRadius: "8px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#FFFFFF",
                                        fontSize: "10px",
                                    }}
                                >
                                    Google Play
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Overlay to close dropdowns */}
            {activeDropdown && !isMobile && (
                <div
                    onClick={closeDropdown}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 99,
                    }}
                />
            )}
        </div>
    )
}

addPropertyControls(PlaygroundNavbar, {
    showAnnouncementBar: {
        type: ControlType.Boolean,
        title: "Show Announcement",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    announcementText: {
        type: ControlType.String,
        title: "Announcement Text",
        defaultValue: "Meet Camber, the first AI child care employee →",
        hidden: ({ showAnnouncementBar }) => !showAnnouncementBar,
    },
    announcementHref: {
        type: ControlType.String,
        title: "Announcement Link",
        defaultValue: "/solutions/ai",
        hidden: ({ showAnnouncementBar }) => !showAnnouncementBar,
    },
    announcementBg: {
        type: ControlType.Color,
        title: "Announcement BG",
        defaultValue: "#EFF6FF",
        hidden: ({ showAnnouncementBar }) => !showAnnouncementBar,
    },
    logoType: {
        type: ControlType.Enum,
        title: "Logo Type",
        options: ["icon-text", "icon-only", "text-only"],
        optionTitles: ["Icon + Text", "Icon Only", "Text Only"],
        defaultValue: "icon-text",
        displaySegmentedControl: true,
    },
    logoImage: {
        type: ControlType.ResponsiveImage,
        title: "Logo Image",
        hidden: ({ logoType }) => logoType === "text-only",
    },
    logoText: {
        type: ControlType.String,
        title: "Logo Text",
        defaultValue: "Playground",
        hidden: ({ logoType }) => logoType === "icon-only",
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#2563EB",
    },
    phoneNumber: {
        type: ControlType.String,
        title: "Phone Number",
        defaultValue: "(646) 566-8590",
    },
    showPhone: {
        type: ControlType.Boolean,
        title: "Show Phone",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    ctaLabel: {
        type: ControlType.String,
        title: "CTA Label",
        defaultValue: "Get demo",
    },
    ctaHref: {
        type: ControlType.String,
        title: "CTA Link",
        defaultValue: "/demo",
    },
    
    // Platform Solutions Menu Items
    platformSolutions: {
        type: ControlType.Array,
        title: "Platform Solutions",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Menu Item",
                },
                href: {
                    type: ControlType.String,
                    title: "Link",
                    defaultValue: "#",
                },
                isNew: {
                    type: ControlType.Boolean,
                    title: "New Badge",
                    defaultValue: false,
                    enabledTitle: "Show",
                    disabledTitle: "Hide",
                },
            },
        },
        defaultValue: [
            { label: "Billing", href: "#", isNew: false },
            { label: "Expenses", href: "#", isNew: false },
            { label: "Payroll", href: "#", isNew: false },
            { label: "Subsidies", href: "#", isNew: false },
            { label: "Marketing", href: "#", isNew: false },
            { label: "Enrollment", href: "#", isNew: false },
            { label: "Websites", href: "#", isNew: false },
            { label: "Paperwork", href: "#", isNew: false },
            { label: "Predictive Enrollment", href: "#", isNew: false },
            { label: "AI", href: "#", isNew: true },
            { label: "Attendance", href: "#", isNew: false },
            { label: "Communication", href: "#", isNew: false },
            { label: "Food programs", href: "#", isNew: false },
            { label: "Learning", href: "#", isNew: false },
            { label: "Reporting", href: "#", isNew: false },
            { label: "Integrations", href: "#", isNew: false },
        ],
    },
    
    // Platform Resources Menu Items
    platformResources: {
        type: ControlType.Array,
        title: "Platform Resources",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Resource",
                },
                href: {
                    type: ControlType.String,
                    title: "Link",
                    defaultValue: "#",
                },
                isNew: {
                    type: ControlType.Boolean,
                    title: "New Badge",
                    defaultValue: false,
                    enabledTitle: "Show",
                    disabledTitle: "Hide",
                },
            },
        },
        defaultValue: [
            { label: "Blog", href: "#", isNew: false },
            { label: "Why Playground", href: "#", isNew: false },
            { label: "Savings Club", href: "#", isNew: true },
            { label: "Early Childhood Investigations", href: "#", isNew: false },
            { label: "Customer Stories", href: "#", isNew: false },
            { label: "Help Center", href: "#", isNew: false },
            { label: "Changelog", href: "#", isNew: true },
        ],
    },
    
    // Built For Menu Items
    builtForItems: {
        type: ControlType.Array,
        title: "Built For Items",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Category",
                },
                href: {
                    type: ControlType.String,
                    title: "Link",
                    defaultValue: "#",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Description text",
                },
                icon: {
                    type: ControlType.ResponsiveImage,
                    title: "Icon",
                },
            },
        },
        defaultValue: [
            { label: "In-home", href: "#", description: "Perfect for home-based care" },
            { label: "Centers", href: "#", description: "Built for childcare centers" },
            { label: "Multi-site", href: "#", description: "Manage multiple locations" },
            { label: "Shared Services", href: "#", description: "Collaborative management" },
            { label: "Before & After Care", href: "#", description: "Extended care programs" },
            { label: "Camps", href: "#", description: "Summer and seasonal camps" },
        ],
    },
    
    // Switch to Playground Menu Items
    switchItems: {
        type: ControlType.Array,
        title: "Switch Items",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "vs Competitor",
                },
                href: {
                    type: ControlType.String,
                    title: "Link",
                    defaultValue: "#",
                },
                isNew: {
                    type: ControlType.Boolean,
                    title: "New Badge",
                    defaultValue: false,
                    enabledTitle: "Show",
                    disabledTitle: "Hide",
                },
            },
        },
        defaultValue: [
            { label: "vs Brightwheel", href: "#", isNew: false },
            { label: "vs HiMama", href: "#", isNew: false },
            { label: "vs Procare", href: "#", isNew: false },
        ],
    },
    
    // Resources Menu Items
    resourcesItems: {
        type: ControlType.Array,
        title: "Resources Items",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Resource",
                },
                href: {
                    type: ControlType.String,
                    title: "Link",
                    defaultValue: "#",
                },
                isNew: {
                    type: ControlType.Boolean,
                    title: "New Badge",
                    defaultValue: false,
                    enabledTitle: "Show",
                    disabledTitle: "Hide",
                },
            },
        },
        defaultValue: [
            { label: "Blog", href: "#", isNew: false },
            { label: "Why Playground", href: "#", isNew: false },
            { label: "Customer Stories", href: "#", isNew: false },
            { label: "Changelog", href: "#", isNew: false },
        ],
    },
    
    showNewBadges: {
        type: ControlType.Boolean,
        title: "Show New Badges",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    dropdownBorderRadius: {
        type: ControlType.Number,
        title: "Dropdown Radius",
        defaultValue: 14,
        min: 0,
        max: 24,
        step: 1,
        unit: "px",
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile Breakpoint",
        defaultValue: 768,
        min: 320,
        max: 1024,
        step: 1,
        unit: "px",
    },
    tabletBreakpoint: {
        type: ControlType.Number,
        title: "Tablet Breakpoint",
        defaultValue: 1024,
        min: 768,
        max: 1440,
        step: 1,
        unit: "px",
    },
    showAppStoreBadges: {
        type: ControlType.Boolean,
        title: "App Store Badges",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
})
