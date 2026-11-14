// Advanced interactive feature tabs component with auto-advance, progress bars, responsive design, and theme modes
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
import { useState, useEffect, useCallback, startTransition } from "react"

interface TabContent {
    icon: {
        src: string
        alt: string
    }
    title: string
    description: string
    image: {
        src: string
        alt: string
    }
    imageLink: string
    headline: string
    detailDescription: string
    bullets: string[]
    ctaText: string
    ctaLink: string
}

interface FeatureTabsProps {
    tabs: TabContent[]
    autoAdvance: boolean
    autoAdvanceInterval: number
    theme: "light" | "dark"
    accentColor: string
    activeBackgroundColor: string
    inactiveBackgroundColor: string
    hoverBackgroundColor: string
    textColor: string
    activeTextColor: string
    titleFont: any
    descriptionFont: any
    headlineFont: any
    detailFont: any
    bulletFont: any
    ctaFont: any
    ctaColor: string
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function FeatureTabs(props: FeatureTabsProps) {
    const {
        tabs,
        autoAdvance,
        autoAdvanceInterval,
        theme,
        accentColor,
        activeBackgroundColor,
        inactiveBackgroundColor,
        hoverBackgroundColor,
        textColor,
        activeTextColor,
        titleFont,
        descriptionFont,
        headlineFont,
        detailFont,
        bulletFont,
        ctaFont,
        ctaColor,
    } = props

    const [activeTab, setActiveTab] = useState(0)
    const [progress, setProgress] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isTablet, setIsTablet] = useState(false)
    const [isSmallMobile, setIsSmallMobile] = useState(false)

    // Theme colors
    const themeColors = {
        light: {
            background: "#FFFFFF",
            surface: "#F8F9FA",
            surfaceHover: "#F1F3F5",
            activeBackground: "#FFFFFF",
            text: "#495057",
            textSecondary: "#6C757D",
            activeText: "#212529",
            border: "#E9ECEF",
            shadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            shadowLarge: "0 4px 20px rgba(0, 0, 0, 0.1)",
        },
        dark: {
            background: "#1A1A1A",
            surface: "#242424",
            surfaceHover: "#2D2D2D",
            activeBackground: "#2D2D2D",
            text: "#A0A0A0",
            textSecondary: "#808080",
            activeText: "#FFFFFF",
            border: "#333333",
            shadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
            shadowLarge: "0 4px 20px rgba(0, 0, 0, 0.4)",
        },
    }

    const colors = themeColors[theme]

    // Detect viewport size with more granular breakpoints
    useEffect(() => {
        if (typeof window === "undefined") return

        const checkViewport = () => {
            const width = window.innerWidth
            startTransition(() => {
                setIsSmallMobile(width < 480)
                setIsMobile(width < 768)
                setIsTablet(width >= 768 && width < 1024)
            })
        }

        checkViewport()
        window.addEventListener("resize", checkViewport)
        return () => window.removeEventListener("resize", checkViewport)
    }, [])

    // Auto-advance logic with progress
    useEffect(() => {
        if (!autoAdvance || isPaused || tabs.length === 0) return

        const interval = 50 // Update every 50ms for smooth progress
        const totalSteps = autoAdvanceInterval / interval

        const timer = setInterval(() => {
            setProgress((prev) => {
                const next = prev + 1
                if (next >= totalSteps) {
                    startTransition(() => {
                        setActiveTab((current) => (current + 1) % tabs.length)
                    })
                    return 0
                }
                return next
            })
        }, interval)

        return () => clearInterval(timer)
    }, [autoAdvance, isPaused, autoAdvanceInterval, tabs.length, activeTab])

    const handleTabClick = useCallback(
        (index: number) => {
            startTransition(() => {
                setActiveTab(index)
                setProgress(0)
                setIsPaused(true)
            })

            // Resume auto-advance after 3 seconds on mobile, 2 seconds on desktop
            const resumeDelay = isMobile ? 3000 : 2000
            setTimeout(() => {
                startTransition(() => setIsPaused(false))
            }, resumeDelay)
        },
        [isMobile]
    )

    const progressPercentage = autoAdvance ? (progress / (autoAdvanceInterval / 50)) * 100 : 0

    if (tabs.length === 0) {
        return (
            <div style={{ 
                padding: 40, 
                textAlign: "center", 
                color: colors.text,
                background: colors.background,
                width: "100%",
                height: "100%",
            }}>
                Add tabs to get started
            </div>
        )
    }

    const activeContent = {
        ...tabs[activeTab],
        icon: tabs[activeTab].icon || {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Icon"
        },
        image: tabs[activeTab].image || {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Default image"
        },
        imageLink: tabs[activeTab].imageLink || "#"
    }

    // Mobile layout (< 768px)
    if (isMobile) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: isSmallMobile ? 16 : 20,
                    padding: isSmallMobile ? 12 : 16,
                    overflow: "auto",
                    background: colors.background,
                }}
            >
                {/* Horizontal scrollable tabs */}
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        overflowX: "auto",
                        paddingBottom: 8,
                        WebkitOverflowScrolling: "touch",
                        scrollbarWidth: "thin",
                        scrollbarColor: `${colors.border} transparent`,
                    }}
                    className="mobile-tabs-scroll"
                >
                    <style>{`
                        .mobile-tabs-scroll::-webkit-scrollbar {
                            height: 4px;
                        }
                        .mobile-tabs-scroll::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .mobile-tabs-scroll::-webkit-scrollbar-thumb {
                            background: ${colors.border};
                            border-radius: 2px;
                        }
                    `}</style>
                    {tabs.map((tab, index) => (
                        <motion.button
                            key={index}
                            onClick={() => handleTabClick(index)}
                            onTouchStart={(e) => {
                                e.currentTarget.style.transform = "scale(0.95)"
                            }}
                            onTouchEnd={(e) => {
                                e.currentTarget.style.transform = "scale(1)"
                            }}
                            style={{
                                flex: "0 0 auto",
                                padding: isSmallMobile ? "8px 14px" : "10px 16px",
                                borderRadius: 20,
                                border: index === activeTab ? `2px solid ${accentColor}` : `1px solid ${colors.border}`,
                                background: index === activeTab ? colors.activeBackground : colors.surface,
                                color: index === activeTab ? colors.activeText : colors.text,
                                cursor: "pointer",
                                position: "relative",
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                boxShadow: index === activeTab ? colors.shadow : "none",
                                transition: "transform 0.1s ease",
                                WebkitTapHighlightColor: "transparent",
                                ...titleFont,
                                fontSize: isSmallMobile ? "14px" : titleFont.fontSize,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <img 
                                src={tab.icon?.src || "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"} 
                                alt={tab.icon?.alt || "Icon"}
                                style={{ 
                                    width: isSmallMobile ? 16 : 20, 
                                    height: isSmallMobile ? 16 : 20, 
                                    objectFit: "contain",
                                    flexShrink: 0,
                                }} 
                            />
                            {tab.title}
                            {index === activeTab && autoAdvance && (
                                <motion.div
                                    style={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        height: 2,
                                        background: accentColor,
                                        width: `${progressPercentage}%`,
                                    }}
                                    initial={{ width: 0 }}
                                />
                            )}
                        </motion.button>
                    ))}
                </div>

                {/* Content panel */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: isSmallMobile ? 12 : 16,
                            background: colors.surface,
                            borderRadius: isSmallMobile ? 12 : 16,
                            padding: isSmallMobile ? 16 : 20,
                            border: `1px solid ${colors.border}`,
                        }}
                    >
                        <a
                            href={activeContent.imageLink}
                            target={activeContent.imageLink && activeContent.imageLink !== "#" ? "_blank" : undefined}
                            rel={activeContent.imageLink && activeContent.imageLink !== "#" ? "noreferrer noopener" : undefined}
                            aria-label={activeContent.image.alt}
                            style={{
                                display: "block",
                                width: "100%",
                                cursor: activeContent.imageLink && activeContent.imageLink !== "#" ? "pointer" : "default",
                            }}
                            onClick={(e) => {
                                if (!activeContent.imageLink || activeContent.imageLink === "#") e.preventDefault()
                            }}
                        >
                            <img
                                src={activeContent.image.src}
                                alt={activeContent.image.alt}
                                style={{
                                    width: "100%",
                                    height: "auto",
                                    maxHeight: isSmallMobile ? 200 : 240,
                                    borderRadius: isSmallMobile ? 8 : 12,
                                    objectFit: "cover",
                                    boxShadow: colors.shadow,
                                }}
                            />
                        </a>
                        <div style={{ display: "flex", flexDirection: "column", gap: isSmallMobile ? 10 : 12 }}>
                            <h2 style={{ 
                                margin: 0, 
                                color: colors.activeText, 
                                ...headlineFont,
                                fontSize: isSmallMobile ? "20px" : headlineFont.fontSize,
                            }}>
                                {activeContent.headline}
                            </h2>
                            <p style={{ 
                                margin: 0, 
                                color: colors.text, 
                                ...detailFont,
                                fontSize: isSmallMobile ? "14px" : detailFont.fontSize,
                            }}>
                                {activeContent.detailDescription}
                            </p>
                            <ul style={{ 
                                margin: 0, 
                                paddingLeft: 20, 
                                color: colors.text, 
                                ...bulletFont,
                                fontSize: isSmallMobile ? "13px" : bulletFont.fontSize,
                            }}>
                                {activeContent.bullets.map((bullet, i) => (
                                    <li key={i} style={{ marginBottom: 6 }}>
                                        {bullet}
                                    </li>
                                ))}
                            </ul>
                            <a
                                href={activeContent.ctaLink}
                                onTouchStart={(e) => {
                                    e.currentTarget.style.opacity = "0.7"
                                }}
                                onTouchEnd={(e) => {
                                    e.currentTarget.style.opacity = "1"
                                }}
                                style={{
                                    color: accentColor,
                                    textDecoration: "none",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    marginTop: 8,
                                    WebkitTapHighlightColor: "transparent",
                                    transition: "opacity 0.1s ease",
                                    ...ctaFont,
                                    fontSize: isSmallMobile ? "14px" : ctaFont.fontSize,
                                }}
                            >
                                {activeContent.ctaText} →
                            </a>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        )
    }

    // Tablet layout (768px - 1024px)
    if (isTablet) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 24,
                    padding: 24,
                    overflow: "auto",
                    background: colors.background,
                }}
            >
                {/* Horizontal tabs */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                        gap: 12,
                    }}
                >
                    {tabs.map((tab, index) => {
                        const isActive = index === activeTab
                        return (
                            <motion.button
                                key={index}
                                onClick={() => handleTabClick(index)}
                                onTouchStart={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = colors.surfaceHover
                                    }
                                }}
                                onTouchEnd={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = colors.surface
                                    }
                                }}
                                style={{
                                    position: "relative",
                                    padding: "16px",
                                    borderRadius: 12,
                                    border: isActive ? `2px solid ${accentColor}` : `1px solid ${colors.border}`,
                                    background: isActive ? colors.activeBackground : colors.surface,
                                    color: isActive ? colors.activeText : colors.text,
                                    cursor: "pointer",
                                    textAlign: "center",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 8,
                                    overflow: "hidden",
                                    boxShadow: isActive ? colors.shadow : "none",
                                    transition: "all 0.2s ease",
                                    WebkitTapHighlightColor: "transparent",
                                }}
                                whileHover={
                                    !isActive
                                        ? {
                                              background: colors.surfaceHover,
                                              borderColor: colors.border,
                                          }
                                        : {}
                                }
                                whileTap={{ scale: 0.97 }}
                            >
                                <img 
                                    src={tab.icon?.src || "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"} 
                                    alt={tab.icon?.alt || "Icon"}
                                    style={{ 
                                        width: 32, 
                                        height: 32, 
                                        objectFit: "contain",
                                        flexShrink: 0,
                                    }} 
                                />
                                <span
                                    style={{
                                        fontWeight: isActive ? 600 : 500,
                                        ...titleFont,
                                    }}
                                >
                                    {tab.title}
                                </span>

                                {isActive && autoAdvance && (
                                    <motion.div
                                        style={{
                                            position: "absolute",
                                            bottom: 0,
                                            left: 0,
                                            height: 3,
                                            background: accentColor,
                                            width: `${progressPercentage}%`,
                                            borderRadius: "0 0 12px 12px",
                                        }}
                                        initial={{ width: 0 }}
                                    />
                                )}
                            </motion.button>
                        )
                    })}
                </div>

                {/* Content panel */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 24,
                            background: colors.surface,
                            borderRadius: 16,
                            padding: 24,
                            border: `1px solid ${colors.border}`,
                            boxShadow: colors.shadow,
                            overflow: "auto",
                        }}
                    >
                        <a
                            href={activeContent.imageLink}
                            target={activeContent.imageLink && activeContent.imageLink !== "#" ? "_blank" : undefined}
                            rel={activeContent.imageLink && activeContent.imageLink !== "#" ? "noreferrer noopener" : undefined}
                            aria-label={activeContent.image.alt}
                            style={{
                                display: "block",
                                width: "100%",
                                cursor: activeContent.imageLink && activeContent.imageLink !== "#" ? "pointer" : "default",
                            }}
                            onClick={(e) => {
                                if (!activeContent.imageLink || activeContent.imageLink === "#") e.preventDefault()
                            }}
                        >
                            <img
                                src={activeContent.image.src}
                                alt={activeContent.image.alt}
                                style={{
                                    width: "100%",
                                    height: "auto",
                                    maxHeight: 320,
                                    borderRadius: 12,
                                    objectFit: "cover",
                                    boxShadow: colors.shadowLarge,
                                }}
                            />
                        </a>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <h2 style={{ margin: 0, color: colors.activeText, ...headlineFont }}>
                                {activeContent.headline}
                            </h2>
                            <p style={{ margin: 0, color: colors.text, ...detailFont }}>
                                {activeContent.detailDescription}
                            </p>
                            <ul style={{ margin: 0, paddingLeft: 20, color: colors.text, ...bulletFont }}>
                                {activeContent.bullets.map((bullet, i) => (
                                    <li key={i} style={{ marginBottom: 8 }}>
                                        {bullet}
                                    </li>
                                ))}
                            </ul>
                            <a
                                href={activeContent.ctaLink}
                                onTouchStart={(e) => {
                                    e.currentTarget.style.opacity = "0.7"
                                }}
                                onTouchEnd={(e) => {
                                    e.currentTarget.style.opacity = "1"
                                }}
                                style={{
                                    color: accentColor,
                                    textDecoration: "none",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    marginTop: 8,
                                    WebkitTapHighlightColor: "transparent",
                                    transition: "opacity 0.1s ease",
                                    ...ctaFont,
                                }}
                            >
                                {activeContent.ctaText} →
                            </a>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        )
    }

    // Desktop layout (>= 1024px)
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                gap: 32,
                padding: 40,
                overflow: "hidden",
                background: colors.background,
            }}
        >
            {/* Left column: Vertical tabs */}
            <div
                style={{
                    flex: "0 0 340px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    position: "relative",
                    overflowY: "auto",
                    overflowX: "hidden",
                    paddingRight: 8,
                }}
            >
                {tabs.map((tab, index) => {
                    const isActive = index === activeTab
                    return (
                        <motion.button
                            key={index}
                            onClick={() => handleTabClick(index)}
                            style={{
                                position: "relative",
                                padding: "20px 24px",
                                borderRadius: 16,
                                border: isActive ? `2px solid ${accentColor}` : `1px solid ${colors.border}`,
                                background: isActive ? colors.activeBackground : colors.surface,
                                color: isActive ? colors.activeText : colors.text,
                                cursor: "pointer",
                                textAlign: "left",
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                                overflow: "hidden",
                                boxShadow: isActive ? colors.shadowLarge : "none",
                                transition: "all 0.2s ease",
                            }}
                            whileHover={
                                !isActive
                                    ? {
                                          background: colors.surfaceHover,
                                          borderColor: colors.border,
                                          boxShadow: colors.shadow,
                                      }
                                    : {}
                            }
                            whileTap={{ scale: 0.98 }}
                        >
                            {/* Left accent bar */}
                            {isActive && (
                                <motion.div
                                    layoutId="accent-bar"
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: 4,
                                        background: accentColor,
                                        borderRadius: "16px 0 0 16px",
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 30,
                                    }}
                                />
                            )}

                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <img 
                                    src={tab.icon?.src || "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"} 
                                    alt={tab.icon?.alt || "Icon"}
                                    style={{ 
                                        width: 32, 
                                        height: 32, 
                                        objectFit: "contain",
                                        flexShrink: 0,
                                    }} 
                                />
                                <span
                                    style={{
                                        fontWeight: isActive ? 600 : 500,
                                        ...titleFont,
                                    }}
                                >
                                    {tab.title}
                                </span>
                            </div>

                            <p
                                style={{
                                    margin: 0,
                                    color: isActive ? colors.text : colors.textSecondary,
                                    ...descriptionFont,
                                }}
                            >
                                {tab.description}
                            </p>

                            {/* Progress bar */}
                            {isActive && autoAdvance && (
                                <motion.div
                                    style={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        height: 3,
                                        background: accentColor,
                                        width: `${progressPercentage}%`,
                                        borderRadius: "0 0 16px 16px",
                                    }}
                                    initial={{ width: 0 }}
                                />
                            )}
                        </motion.button>
                    )
                })}
            </div>

            {/* Right column: Content panel */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    gap: 40,
                    overflow: "auto",
                    background: colors.surface,
                    borderRadius: 20,
                    padding: 40,
                    border: `1px solid ${colors.border}`,
                    boxShadow: colors.shadow,
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                        }}
                        style={{
                            display: "flex",
                            gap: 40,
                            width: "100%",
                            minHeight: "100%",
                        }}
                    >
                        {/* Content text */}
                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                gap: 24,
                                justifyContent: "center",
                                minWidth: 0,
                            }}
                        >
                            <h2 style={{ margin: 0, color: colors.activeText, ...headlineFont }}>
                                {activeContent.headline}
                            </h2>
                            <p style={{ margin: 0, color: colors.text, ...detailFont }}>
                                {activeContent.detailDescription}
                            </p>
                            <ul style={{ margin: 0, paddingLeft: 20, color: colors.text, ...bulletFont }}>
                                {activeContent.bullets.map((bullet, i) => (
                                    <li key={i} style={{ marginBottom: 10 }}>
                                        {bullet}
                                    </li>
                                ))}
                            </ul>
                            <a
                                href={activeContent.ctaLink}
                                style={{
                                    color: accentColor,
                                    textDecoration: "none",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 8,
                                    marginTop: 8,
                                    transition: "opacity 0.2s ease",
                                    ...ctaFont,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = "0.7"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = "1"
                                }}
                            >
                                {activeContent.ctaText} →
                            </a>
                        </div>

                        {/* Feature image */}
                        <div
                            style={{
                                flex: "0 0 420px",
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            <a
                                href={activeContent.imageLink}
                                target={activeContent.imageLink && activeContent.imageLink !== "#" ? "_blank" : undefined}
                                rel={activeContent.imageLink && activeContent.imageLink !== "#" ? "noreferrer noopener" : undefined}
                                aria-label={activeContent.image.alt}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    cursor: activeContent.imageLink && activeContent.imageLink !== "#" ? "pointer" : "default",
                                }}
                                onClick={(e) => {
                                    if (!activeContent.imageLink || activeContent.imageLink === "#") e.preventDefault()
                                }}
                            >
                                <img
                                    src={activeContent.image.src}
                                    alt={activeContent.image.alt}
                                    style={{
                                        width: "100%",
                                        height: "auto",
                                        maxHeight: "100%",
                                        borderRadius: 16,
                                        objectFit: "cover",
                                        boxShadow: colors.shadowLarge,
                                        border: `1px solid ${colors.border}`,
                                    }}
                                />
                            </a>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}

addPropertyControls(FeatureTabs, {
    tabs: {
        type: ControlType.Array,
        title: "Tabs",
        control: {
            type: ControlType.Object,
            controls: {
                icon: {
                    type: ControlType.ResponsiveImage,
                    title: "Icon",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Feature",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Short description of this feature",
                    displayTextArea: true,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                imageLink: {
                    type: ControlType.Link,
                    title: "Image Link",
                    defaultValue: "#",
                },
                headline: {
                    type: ControlType.String,
                    title: "Headline",
                    defaultValue: "Feature Headline",
                },
                detailDescription: {
                    type: ControlType.String,
                    title: "Detail Description",
                    defaultValue: "Detailed description of the feature and its benefits.",
                    displayTextArea: true,
                },
                bullets: {
                    type: ControlType.Array,
                    title: "Bullet Points",
                    control: {
                        type: ControlType.String,
                    },
                    defaultValue: ["Benefit one", "Benefit two", "Benefit three"],
                },
                ctaText: {
                    type: ControlType.String,
                    title: "CTA Text",
                    defaultValue: "Learn more",
                },
                ctaLink: {
                    type: ControlType.String,
                    title: "CTA Link",
                    defaultValue: "#",
                },
            },
        },
        defaultValue: [
            {
                icon: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Performance Icon",
                },
                title: "Fast Performance",
                description: "Lightning-fast load times and smooth interactions",
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Performance",
                },
                imageLink: "#",
                headline: "Blazing Fast Performance",
                detailDescription:
                    "Experience unparalleled speed with our optimized architecture that delivers content in milliseconds.",
                bullets: [
                    "Sub-second page loads",
                    "Optimized asset delivery",
                    "Smart caching strategies",
                ],
                ctaText: "Learn more",
                ctaLink: "#",
            },
            {
                icon: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Design Icon",
                },
                title: "Beautiful Design",
                description: "Stunning visuals that captivate your audience",
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Design",
                },
                imageLink: "#",
                headline: "Pixel-Perfect Design",
                detailDescription:
                    "Every element is crafted with attention to detail, creating a cohesive and beautiful user experience.",
                bullets: [
                    "Modern UI components",
                    "Consistent design system",
                    "Responsive layouts",
                ],
                ctaText: "View examples",
                ctaLink: "#",
            },
            {
                icon: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Security Icon",
                },
                title: "Secure & Private",
                description: "Enterprise-grade security for your peace of mind",
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Security",
                },
                imageLink: "#",
                headline: "Bank-Level Security",
                detailDescription:
                    "Your data is protected with industry-leading encryption and security protocols.",
                bullets: [
                    "End-to-end encryption",
                    "Regular security audits",
                    "GDPR compliant",
                ],
                ctaText: "Security details",
                ctaLink: "#",
            },
            {
                icon: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Mobile Icon",
                },
                title: "Mobile First",
                description: "Perfect experience on any device, anywhere",
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Mobile",
                },
                imageLink: "#",
                headline: "Mobile-Optimized Experience",
                detailDescription:
                    "Designed from the ground up to work flawlessly on smartphones and tablets.",
                bullets: [
                    "Touch-optimized interface",
                    "Offline functionality",
                    "Native app feel",
                ],
                ctaText: "Try on mobile",
                ctaLink: "#",
            },
        ],
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
        defaultValue: "light",
        displaySegmentedControl: true,
    },
    autoAdvance: {
        type: ControlType.Boolean,
        title: "Auto Advance",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoAdvanceInterval: {
        type: ControlType.Number,
        title: "Interval (ms)",
        defaultValue: 5000,
        min: 2000,
        max: 15000,
        step: 500,
        hidden: (props) => !props.autoAdvance,
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#0099FF",
    },
    activeBackgroundColor: {
        type: ControlType.Color,
        title: "Active BG",
        defaultValue: "#F5F5F5",
    },
    inactiveBackgroundColor: {
        type: ControlType.Color,
        title: "Inactive BG",
        defaultValue: "#FFFFFF",
    },
    hoverBackgroundColor: {
        type: ControlType.Color,
        title: "Hover BG",
        defaultValue: "#FAFAFA",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#666666",
    },
    activeTextColor: {
        type: ControlType.Color,
        title: "Active Text",
        defaultValue: "#000000",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Description Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.4em",
        },
    },
    headlineFont: {
        type: ControlType.Font,
        title: "Headline Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
    },
    detailFont: {
        type: ControlType.Font,
        title: "Detail Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.5em",
        },
    },
    bulletFont: {
        type: ControlType.Font,
        title: "Bullet Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.4em",
        },
    },
    ctaFont: {
        type: ControlType.Font,
        title: "CTA Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    ctaColor: {
        type: ControlType.Color,
        title: "CTA Color",
        defaultValue: "#0099FF",
    },
})
