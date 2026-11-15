// Magazine Grid Team Carousel — Editorial-style team showcase with hero slot and thumbnail grid
import { useState, useMemo, startTransition, useEffect, useCallback, useRef } from "react"
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

interface TeamMember {
    name: string
    role: string
    quote: string
    photo: { src: string; alt?: string }
    profileUrl: string
}

interface MagazineGridTeamCarouselProps {
    memberCount: number
    members: TeamMember[]
    showQuote: boolean
    layoutStyle: "classic" | "centered" | "sidebar" | "fullGrid"
    heroWidthPercent: number
    thumbnailColumns: number
    thumbnailRows: number
    gap: number
    componentMaxWidth: number
    padding: number
    heroHeightMode: "auto" | "fixed" | "viewport"
    heroFixedHeight: number
    heroViewportHeight: number
    showHeroName: boolean
    showHeroRole: boolean
    showHeroQuote: boolean
    showCTAButton: boolean
    ctaStyle: "filled" | "outline" | "ghost" | "arrow"
    overlayStyle: "gradient" | "full" | "topBar" | "none"
    thumbnailBorderRadius: number
    showNameOnThumbnail: boolean
    showRoleOnThumbnail: boolean
    thumbnailHoverEffect: "scale" | "brightness" | "border" | "none"
    activeThumbnailStyle: "whiteBorder" | "coloredBorder" | "scaleUp" | "glow"
    heroNameSize: number
    heroNameFont: string
    heroNameWeight: "Regular" | "Bold" | "Black" | "Condensed"
    quoteStyle: "serif" | "sans" | "monospace"
    quoteSize: number
    theme: "light" | "dark" | "auto"
    accentColor: string
    backgroundColor: string
    textPrimary: string
    textSecondary: string
    transitionDuration: number
    transitionEasing: "easeOut" | "spring" | "linear"
    heroImageZoom: boolean
    style?: React.CSSProperties
}

/**
 * Magazine Grid Team Carousel
 * 
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function MagazineGridTeamCarousel(props: MagazineGridTeamCarouselProps) {
    const {
        memberCount = 6,
        members = [],
        showQuote = true,
        layoutStyle = "classic",
        heroWidthPercent = 60,
        thumbnailColumns = 2,
        thumbnailRows = 3,
        gap = 16,
        componentMaxWidth = 1200,
        padding = 20,
        heroHeightMode = "auto",
        heroFixedHeight = 500,
        heroViewportHeight = 70,
        showHeroName = true,
        showHeroRole = true,
        showHeroQuote = true,
        showCTAButton = true,
        ctaStyle = "filled",
        overlayStyle = "gradient",
        thumbnailBorderRadius = 12,
        showNameOnThumbnail = true,
        showRoleOnThumbnail = false,
        thumbnailHoverEffect = "scale",
        activeThumbnailStyle = "whiteBorder",
        heroNameSize = 48,
        heroNameFont = "inherit",
        heroNameWeight = "Bold",
        quoteStyle = "serif",
        quoteSize = 18,
        theme = "light",
        accentColor = "#E63946",
        backgroundColor = "#FFFFFF",
        textPrimary = "#0A0A0A",
        textSecondary = "#888888",
        transitionDuration = 500,
        transitionEasing = "easeOut",
        heroImageZoom = true,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const [activeIndex, setActiveIndex] = useState(0)
    const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 })
    const [prefersDark, setPrefersDark] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Detect dark mode preference for auto theme
    useEffect(() => {
        if (theme !== "auto" || typeof window === "undefined") return
        
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
        startTransition(() => setPrefersDark(mediaQuery.matches))
        
        const handleChange = (e: MediaQueryListEvent) => {
            startTransition(() => setPrefersDark(e.matches))
        }
        
        mediaQuery.addEventListener("change", handleChange)
        return () => mediaQuery.removeEventListener("change", handleChange)
    }, [theme])

    // Detect container size for responsive calculations
    useEffect(() => {
        if (typeof window === "undefined") return
        
        const updateSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                startTransition(() => setContainerSize({
                    width: rect.width,
                    height: rect.height
                }))
            }
        }
        
        updateSize()
        window.addEventListener("resize", updateSize)
        return () => window.removeEventListener("resize", updateSize)
    }, [])

    const isMobile = containerSize.width < 768
    const isTablet = containerSize.width >= 768 && containerSize.width < 1024

    // Determine effective theme
    const effectiveTheme = theme === "auto" ? (prefersDark ? "dark" : "light") : theme

    // Generate team members based on count
    const teamMembers = useMemo(() => {
        const result: TeamMember[] = []
        for (let i = 0; i < memberCount; i++) {
            if (members[i]) {
                result.push(members[i])
            } else {
                result.push({
                    name: `Team Member ${i + 1}`,
                    role: "Position",
                    quote: "Passionate about creating exceptional experiences.",
                    photo: {
                        src: [
                            "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                            "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                            "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                            "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                            "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                        ][i % 5],
                        alt: `Team Member ${i + 1}`,
                    },
                    profileUrl: "https://framer.link/dulaj80",
                })
            }
        }
        return result
    }, [memberCount, members])

    const activeMember = teamMembers[activeIndex]
    
    // Ensure photo has default values to prevent undefined errors
    const activePhoto = activeMember?.photo || {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: activeMember?.name || "Team Member"
    }

    // Font weight mapping
    const fontWeightMap = {
        Regular: 400,
        Bold: 700,
        Black: 900,
        Condensed: 600,
    }

    // Quote font family
    const quoteFontFamily = {
        serif: "Georgia, serif",
        sans: "inherit",
        monospace: "monospace",
    }

    // Transition config
    const transitionConfig =
        transitionEasing === "spring"
            ? { type: "spring" as const, stiffness: 300, damping: 30 }
            : { duration: transitionDuration / 1000, ease: transitionEasing }

    // CTA Button styles
    const ctaButtonStyles = {
        filled: {
            backgroundColor: accentColor,
            color: "#FFFFFF",
            border: "none",
        },
        outline: {
            backgroundColor: "transparent",
            color: accentColor,
            border: `2px solid ${accentColor}`,
        },
        ghost: {
            backgroundColor: "transparent",
            color: textPrimary,
            border: "none",
        },
        arrow: {
            backgroundColor: "transparent",
            color: accentColor,
            border: "none",
            textDecoration: "underline",
        },
    }

    // Overlay styles
    const getOverlayStyle = () => {
        switch (overlayStyle) {
            case "gradient":
                return {
                    background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)",
                }
            case "full":
                return {
                    background: "rgba(0,0,0,0.4)",
                }
            case "topBar":
                return {
                    background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 30%)",
                }
            default:
                return {}
        }
    }

    // Thumbnail hover effect
    const getThumbnailHoverStyle = () => {
        switch (thumbnailHoverEffect) {
            case "scale":
                return { scale: 1.05 }
            case "brightness":
                return { filter: "brightness(1.2)" }
            case "border":
                return { borderColor: accentColor }
            default:
                return {}
        }
    }

    // Active thumbnail style
    const getActiveThumbnailStyle = (isActive: boolean) => {
        if (!isActive) return {}
        switch (activeThumbnailStyle) {
            case "whiteBorder":
                return { border: "3px solid #FFFFFF", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }
            case "coloredBorder":
                return { border: `3px solid ${accentColor}`, boxShadow: `0 4px 12px ${accentColor}40` }
            case "scaleUp":
                return { transform: "scale(1.08)", zIndex: 10 }
            case "glow":
                return { boxShadow: `0 0 20px ${accentColor}80` }
            default:
                return {}
        }
    }

    // Responsive calculations
    const heroWidth = layoutStyle === "fullGrid" ? 100 : isMobile ? 100 : heroWidthPercent
    const thumbnailWidth = 100 - heroWidth
    const responsiveThumbnailColumns = isMobile ? 2 : isTablet ? 2 : thumbnailColumns
    const responsiveThumbnailRows = isMobile ? Math.min(2, thumbnailRows) : isTablet ? Math.min(3, thumbnailRows) : thumbnailRows
    const responsiveHeroNameSize = isMobile ? Math.max(28, heroNameSize * 0.55) : isTablet ? Math.max(36, heroNameSize * 0.75) : heroNameSize
    const responsiveQuoteSize = isMobile ? Math.max(14, quoteSize * 0.8) : isTablet ? Math.max(16, quoteSize * 0.9) : quoteSize
    const responsiveGap = isMobile ? Math.max(8, gap * 0.5) : isTablet ? Math.max(12, gap * 0.75) : gap
    const responsivePadding = isMobile ? 16 : isTablet ? 24 : 40
    const responsiveComponentPadding = isMobile ? Math.max(8, padding * 0.5) : isTablet ? Math.max(12, padding * 0.75) : padding

    const maxThumbs = Math.max(0, responsiveThumbnailColumns * responsiveThumbnailRows)

    // Calculate hero height based on mode
    const getHeroHeight = () => {
        switch (heroHeightMode) {
            case "viewport":
                return `${heroViewportHeight}vh`
            case "fixed":
                return isMobile ? Math.min(heroFixedHeight, 400) : heroFixedHeight
            case "auto":
            default:
                // Auto height based on container - use aspect ratio or min-height
                return isMobile ? 350 : isTablet ? 450 : 600
        }
    }

    const heroHeight = getHeroHeight()

    // Theme-based colors
    const themeBg = effectiveTheme === "dark" ? "#0A0A0A" : backgroundColor
    const themeTextPrimary = effectiveTheme === "dark" ? "#FFFFFF" : textPrimary
    const themeTextSecondary = effectiveTheme === "dark" ? "#CCCCCC" : textSecondary

    // Handle hero card click
    const handleHeroClick = useCallback(() => {
        if (showCTAButton && activeMember.profileUrl) {
            if (typeof window !== "undefined") {
                window.open(activeMember.profileUrl, "_blank")
            }
        }
    }, [showCTAButton, activeMember?.profileUrl])

    // Handle keyboard activation
    const handleHeroKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleHeroClick()
        }
    }, [handleHeroClick])

    // Static renderer components
    const HeroCard = isStatic ? "a" : motion.div
    const ThumbnailCard = isStatic ? "div" : motion.div
    const HeroImage = isStatic ? "img" : motion.img
    const HeroName = isStatic ? "h2" : motion.h2
    const HeroRole = isStatic ? "p" : motion.p
    const HeroQuote = isStatic ? "p" : motion.p
    const CTAButton = isStatic ? "button" : motion.button

    const heroCardProps = isStatic ? {
        href: showCTAButton && activeMember.profileUrl ? activeMember.profileUrl : undefined,
        target: "_blank",
        rel: "noopener noreferrer",
        role: showCTAButton ? "link" : undefined,
        tabIndex: showCTAButton ? 0 : -1,
        onKeyDown: showCTAButton ? handleHeroKeyDown : undefined,
    } : {
        layout: true,
        layoutId: `member-${activeIndex}`,
        onClick: handleHeroClick,
    }

    const heroImageProps = isStatic ? {} : {
        initial: heroImageZoom ? { scale: 1.1, opacity: 0 } : { opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { opacity: 0 },
        transition: transitionConfig,
    }

    const heroNameProps = isStatic ? {} : {
        initial: { y: 20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { delay: 0.1, ...transitionConfig },
    }

    const heroRoleProps = isStatic ? {} : {
        initial: { y: 20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { delay: 0.15, ...transitionConfig },
    }

    const heroQuoteProps = isStatic ? {} : {
        initial: { y: 20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { delay: 0.2, ...transitionConfig },
    }

    const ctaButtonProps = isStatic ? {} : {
        initial: { y: 20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { delay: 0.25, ...transitionConfig },
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                maxWidth: isMobile ? "100%" : componentMaxWidth,
                margin: "0 auto",
                backgroundColor: themeBg,
                padding: responsiveComponentPadding,
                fontFamily: heroNameFont,
                boxSizing: "border-box",
                minHeight: "100%",
                ...style,
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: isMobile || layoutStyle === "fullGrid" ? "column" : layoutStyle === "sidebar" ? "row-reverse" : "row",
                    gap: responsiveGap,
                    height: heroHeightMode === "auto" ? "auto" : "100%",
                    minHeight: "100%",
                }}
            >
                {/* Hero Card */}
                <HeroCard
                    {...heroCardProps}
                    style={{
                        width: isMobile || layoutStyle === "fullGrid" ? "100%" : `${heroWidth}%`,
                        position: "relative",
                        borderRadius: isMobile ? 12 : 16,
                        overflow: "hidden",
                        minHeight: isMobile ? 300 : 400,
                        height: heroHeight,
                        cursor: showCTAButton ? "pointer" : "default",
                        flexShrink: 0,
                        display: "block",
                        textDecoration: "none",
                    }}
                >
                    {isStatic ? (
                        <img
                            src={activePhoto.src}
                            alt={activePhoto.alt || activeMember.name}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                position: "absolute",
                                top: 0,
                                left: 0,
                            }}
                        />
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={activeIndex}
                                src={activePhoto.src}
                                alt={activePhoto.alt || activeMember.name}
                                initial={heroImageZoom ? { scale: 1.1, opacity: 0 } : { opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={transitionConfig}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                }}
                            />
                        </AnimatePresence>
                    )}

                    {/* Overlay */}
                    {overlayStyle !== "none" && (
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                ...getOverlayStyle(),
                            }}
                        />
                    )}

                    {/* Hero Content */}
                    <div
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: responsivePadding,
                            color: "#FFFFFF",
                            zIndex: 2,
                        }}
                    >
                        {showHeroName && (
                            <HeroName
                                {...heroNameProps}
                                style={{
                                    fontSize: responsiveHeroNameSize,
                                    fontWeight: fontWeightMap[heroNameWeight],
                                    margin: 0,
                                    marginBottom: 8,
                                    lineHeight: 1.1,
                                }}
                            >
                                {activeMember.name}
                            </HeroName>
                        )}

                        {showHeroRole && (
                            <HeroRole
                                {...heroRoleProps}
                                style={{
                                    fontSize: isMobile ? 12 : isTablet ? 14 : 16,
                                    margin: 0,
                                    marginBottom: 12,
                                    opacity: 0.9,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                }}
                            >
                                {activeMember.role}
                            </HeroRole>
                        )}

                        {showHeroQuote && showQuote && (
                            <HeroQuote
                                {...heroQuoteProps}
                                style={{
                                    fontSize: responsiveQuoteSize,
                                    fontFamily: quoteFontFamily[quoteStyle],
                                    fontStyle: quoteStyle === "serif" ? "italic" : "normal",
                                    margin: 0,
                                    marginBottom: isMobile ? 16 : 24,
                                    maxWidth: isMobile ? "100%" : isTablet ? 400 : 500,
                                    lineHeight: 1.5,
                                    display: isMobile && !showHeroName ? "-webkit-box" : "block",
                                    WebkitLineClamp: isMobile && !showHeroName ? 3 : undefined,
                                    WebkitBoxOrient: isMobile && !showHeroName ? "vertical" : undefined,
                                    overflow: isMobile && !showHeroName ? "hidden" : undefined,
                                }}
                            >
                                "{activeMember.quote}"
                            </HeroQuote>
                        )}

                        {showCTAButton && (
                            <CTAButton
                                {...ctaButtonProps}
                                style={{
                                    padding: ctaStyle === "arrow" ? "8px 0" : isMobile ? "8px 20px" : "12px 32px",
                                    fontSize: isMobile ? 13 : isTablet ? 14 : 16,
                                    fontWeight: 600,
                                    borderRadius: 8,
                                    cursor: "pointer",
                                    ...ctaButtonStyles[ctaStyle],
                                }}
                            >
                                View Profile {ctaStyle === "arrow" && "→"}
                            </CTAButton>
                        )}
                    </div>
                </HeroCard>

                {/* Thumbnail Grid */}
                {layoutStyle !== "fullGrid" && (
                    <div
                        style={{
                            width: isMobile ? "100%" : `${thumbnailWidth}%`,
                            display: "grid",
                            gridTemplateColumns: `repeat(${responsiveThumbnailColumns}, 1fr)`,
                            gap: responsiveGap,
                            overflow: isMobile ? "visible" : "auto",
                            flexShrink: 0,
                            alignContent: "start",
                        }}
                    >
                        {teamMembers.map((member, index) => {
                            if (index === activeIndex) return null
                            if (maxThumbs > 0) {
                                const visibleIndex = index > activeIndex ? index - 1 : index
                                if (visibleIndex >= maxThumbs) return null
                            }
                            
                            // Ensure each member has a valid photo
                            const memberPhoto = member?.photo || {
                                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                                alt: member?.name || "Team Member"
                            }

                            const handleThumbnailClick = () => startTransition(() => setActiveIndex(index))

                            if (isStatic) {
                                return (
                                    <div
                                        key={index}
                                        onClick={handleThumbnailClick}
                                        style={{
                                            position: "relative",
                                            borderRadius: thumbnailBorderRadius,
                                            overflow: "hidden",
                                            cursor: "pointer",
                                            aspectRatio: isMobile ? "1/1" : "3/4",
                                            minHeight: isMobile ? 100 : 120,
                                            ...getActiveThumbnailStyle(false),
                                        }}
                                    >
                                        <img
                                            src={memberPhoto.src}
                                            alt={memberPhoto.alt || member.name}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />

                                        {/* Thumbnail Overlay */}
                                        <div
                                            style={{
                                                position: "absolute",
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                padding: isMobile ? 8 : 12,
                                                background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
                                                color: "#FFFFFF",
                                            }}
                                        >
                                            {showNameOnThumbnail && (
                                                <p
                                                    style={{
                                                        margin: 0,
                                                        fontSize: isMobile ? 11 : 13,
                                                        fontWeight: 600,
                                                        marginBottom: showRoleOnThumbnail ? 2 : 0,
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                    }}
                                                >
                                                    {member.name}
                                                </p>
                                            )}
                                            {showRoleOnThumbnail && (
                                                <p
                                                    style={{
                                                        margin: 0,
                                                        fontSize: isMobile ? 9 : 10,
                                                        opacity: 0.8,
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.05em",
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                    }}
                                                >
                                                    {member.role}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            }

                            return (
                                <motion.div
                                    key={index}
                                    layoutId={`member-${index}`}
                                    whileHover={getThumbnailHoverStyle()}
                                    onClick={handleThumbnailClick}
                                    style={{
                                        position: "relative",
                                        borderRadius: thumbnailBorderRadius,
                                        overflow: "hidden",
                                        cursor: "pointer",
                                        aspectRatio: isMobile ? "1/1" : "3/4",
                                        minHeight: isMobile ? 100 : 120,
                                        ...getActiveThumbnailStyle(false),
                                    }}
                                    transition={transitionConfig}
                                >
                                    <img
                                        src={memberPhoto.src}
                                        alt={memberPhoto.alt || member.name}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />

                                    {/* Thumbnail Overlay */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            padding: isMobile ? 8 : 12,
                                            background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
                                            color: "#FFFFFF",
                                        }}
                                    >
                                        {showNameOnThumbnail && (
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: isMobile ? 11 : 13,
                                                    fontWeight: 600,
                                                    marginBottom: showRoleOnThumbnail ? 2 : 0,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                            >
                                                {member.name}
                                            </p>
                                        )}
                                        {showRoleOnThumbnail && (
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: isMobile ? 9 : 10,
                                                    opacity: 0.8,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.05em",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                            >
                                                {member.role}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

addPropertyControls(MagazineGridTeamCarousel, {
    // CONTENT
    memberCount: {
        type: ControlType.Number,
        title: "Member Count",
        defaultValue: 6,
        min: 4,
        max: 12,
        step: 1,
        displayStepper: true,
    },
    members: {
        type: ControlType.Array,
        title: "Members",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Team Member",
                },
                role: {
                    type: ControlType.String,
                    title: "Role",
                    defaultValue: "Position",
                },
                quote: {
                    type: ControlType.String,
                    title: "Quote",
                    defaultValue: "Passionate about creating exceptional experiences.",
                    displayTextArea: true,
                },
                photo: {
                    type: ControlType.ResponsiveImage,
                    title: "Photo",
                },
                profileUrl: {
                    type: ControlType.String,
                    title: "Profile URL",
                    defaultValue: "https://framer.link/dulaj80",
                },
            },
        },
        defaultValue: [
            {
                name: "Sofia Chen",
                role: "Creative Director",
                quote: "Design is not just what it looks like. Design is how it works.",
                profileUrl: "https://framer.link/dulaj80",
            },
        ],
    },
    showQuote: {
        type: ControlType.Boolean,
        title: "Show Quote",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    // GRID LAYOUT
    layoutStyle: {
        type: ControlType.Enum,
        title: "Layout Style",
        options: ["classic", "centered", "sidebar", "fullGrid"],
        optionTitles: ["Classic 60/40", "Centered Hero", "Sidebar List", "Full Grid"],
        defaultValue: "classic",
        displaySegmentedControl: false,
    },
    heroWidthPercent: {
        type: ControlType.Number,
        title: "Hero Width %",
        defaultValue: 60,
        min: 40,
        max: 75,
        step: 5,
        hidden: ({ layoutStyle }) => layoutStyle === "fullGrid",
    },
    thumbnailColumns: {
        type: ControlType.Number,
        title: "Thumbnail Columns",
        defaultValue: 2,
        min: 1,
        max: 3,
        step: 1,
        displayStepper: true,
        hidden: ({ layoutStyle }) => layoutStyle === "fullGrid",
    },
    thumbnailRows: {
        type: ControlType.Number,
        title: "Thumbnail Rows",
        defaultValue: 3,
        min: 1,
        max: 4,
        step: 1,
        displayStepper: true,
        hidden: ({ layoutStyle }) => layoutStyle === "fullGrid",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 16,
        min: 0,
        max: 48,
        step: 4,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 20,
        min: 0,
        max: 80,
        step: 4,
        unit: "px",
    },
    componentMaxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        defaultValue: 1200,
        min: 600,
        max: 2000,
        step: 100,
        unit: "px",
    },
    heroHeightMode: {
        type: ControlType.Enum,
        title: "Hero Height Mode",
        options: ["auto", "fixed", "viewport"],
        optionTitles: ["Auto", "Fixed", "Viewport"],
        defaultValue: "auto",
    },
    heroFixedHeight: {
        type: ControlType.Number,
        title: "Hero Fixed Height",
        defaultValue: 500,
        min: 200,
        max: 1000,
        step: 50,
        unit: "px",
        hidden: ({ heroHeightMode }) => heroHeightMode !== "fixed",
    },
    heroViewportHeight: {
        type: ControlType.Number,
        title: "Hero Viewport Height",
        defaultValue: 70,
        min: 40,
        max: 100,
        step: 5,
        unit: "%",
        hidden: ({ heroHeightMode }) => heroHeightMode !== "viewport",
    },

    // HERO CARD
    showHeroName: {
        type: ControlType.Boolean,
        title: "Show Name",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showHeroRole: {
        type: ControlType.Boolean,
        title: "Show Role",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showHeroQuote: {
        type: ControlType.Boolean,
        title: "Show Quote",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showCTAButton: {
        type: ControlType.Boolean,
        title: "Show CTA Button",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    ctaStyle: {
        type: ControlType.Enum,
        title: "CTA Style",
        options: ["filled", "outline", "ghost", "arrow"],
        optionTitles: ["Filled", "Outline", "Ghost", "Arrow Link"],
        defaultValue: "filled",
        hidden: ({ showCTAButton }) => !showCTAButton,
    },
    overlayStyle: {
        type: ControlType.Enum,
        title: "Overlay Style",
        options: ["gradient", "full", "topBar", "none"],
        optionTitles: ["Bottom Gradient", "Full Overlay", "Top Bar", "None"],
        defaultValue: "gradient",
    },

    // THUMBNAIL CARD
    thumbnailBorderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 12,
        min: 0,
        max: 32,
        step: 4,
        unit: "px",
    },
    showNameOnThumbnail: {
        type: ControlType.Boolean,
        title: "Show Name",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showRoleOnThumbnail: {
        type: ControlType.Boolean,
        title: "Show Role",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    thumbnailHoverEffect: {
        type: ControlType.Enum,
        title: "Hover Effect",
        options: ["scale", "brightness", "border", "none"],
        optionTitles: ["Scale", "Brightness", "Border", "None"],
        defaultValue: "scale",
    },
    activeThumbnailStyle: {
        type: ControlType.Enum,
        title: "Active Style",
        options: ["whiteBorder", "coloredBorder", "scaleUp", "glow"],
        optionTitles: ["White Border", "Colored Border", "Scale Up", "Glow"],
        defaultValue: "whiteBorder",
    },

    // TYPOGRAPHY
    heroNameSize: {
        type: ControlType.Number,
        title: "Hero Name Size",
        defaultValue: 48,
        min: 24,
        max: 80,
        step: 4,
        unit: "px",
    },
    heroNameFont: {
        type: ControlType.String,
        title: "Hero Name Font",
        defaultValue: "inherit",
    },
    heroNameWeight: {
        type: ControlType.Enum,
        title: "Hero Name Weight",
        options: ["Regular", "Bold", "Black", "Condensed"],
        defaultValue: "Bold",
        displaySegmentedControl: true,
    },
    quoteStyle: {
        type: ControlType.Enum,
        title: "Quote Style",
        options: ["serif", "sans", "monospace"],
        optionTitles: ["Serif", "Sans", "Monospace"],
        defaultValue: "serif",
    },
    quoteSize: {
        type: ControlType.Number,
        title: "Quote Size",
        defaultValue: 18,
        min: 12,
        max: 28,
        step: 2,
        unit: "px",
    },

    // COLORS & THEME
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["light", "dark", "auto"],
        optionTitles: ["Light", "Dark", "Auto"],
        defaultValue: "light",
        displaySegmentedControl: true,
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#E63946",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    textPrimary: {
        type: ControlType.Color,
        title: "Text Primary",
        defaultValue: "#0A0A0A",
    },
    textSecondary: {
        type: ControlType.Color,
        title: "Text Secondary",
        defaultValue: "#888888",
    },

    // ANIMATION
    transitionDuration: {
        type: ControlType.Number,
        title: "Duration (ms)",
        defaultValue: 500,
        min: 200,
        max: 1500,
        step: 100,
        unit: "ms",
    },
    transitionEasing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["easeOut", "spring", "linear"],
        optionTitles: ["Ease Out", "Spring", "Linear"],
        defaultValue: "easeOut",
        displaySegmentedControl: true,
    },
    heroImageZoom: {
        type: ControlType.Boolean,
        title: "Hero Image Zoom",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})