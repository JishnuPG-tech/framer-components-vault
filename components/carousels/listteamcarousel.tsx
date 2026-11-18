// List Team Carousel with split layout: numbered vertical list + animated preview panel
// Inspired by award-winning agency sites (Resn, Active Theory)
// Features masked text reveals, image morphs, and configurable interactions

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
import { useState, useEffect, startTransition, useMemo } from "react"

interface TeamMember {
    name: string
    role: string
    tags: string
    description: string
    photo: { src: string; alt: string }
    url: string
}

interface ListTeamCarouselProps {
    // Team Data
    memberCount: number
    members: TeamMember[]
    ctaLabel: string
    
    // List Panel
    listWidthPercent: number
    listItemHeight: number
    showIndexNumbers: boolean
    indexStyle: "01" | "1." | "I." | "—"
    indexColor: string
    dividerStyle: "Line" | "None" | "Dot"
    dividerColor: string
    activeItemAccentColor: string
    hideListOnMobile: boolean
    
    // Preview Panel
    previewWidthPercent: number
    previewImageHeight: number
    imageBorderRadius: number
    showTags: boolean
    tagStyle: "Outline" | "Filled" | "Plain"
    showDescription: boolean
    showCTA: boolean
    
    // Typography List
    listNameSize: number
    listNameWeight: "Light" | "Regular" | "Medium" | "Bold"
    listNameFont: string
    listRoleSize: number
    listRoleColor: string
    
    // Typography Preview
    previewNameSize: number
    previewRoleSize: number
    previewTagSize: number
    previewDescriptionSize: number
    
    // Interaction
    trigger: "Hover" | "Click"
    initialActiveIndex: number
    
    // Animation
    listHoverEffect: "Scale" | "Bold" | "Color Change" | "Underline"
    previewReveal: "Masked Slide" | "Fade" | "Scale Up" | "Clip"
    revealDuration: number
    staggerItemsOnLoad: boolean
    staggerDelay: number
    
    // Colors
    background: string
    textPrimary: string
    accent: string
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ListTeamCarousel(props: ListTeamCarouselProps) {
    const {
        memberCount = 6,
        members = [],
        ctaLabel = "Open Profile",
        listWidthPercent = 45,
        listItemHeight = 72,
        showIndexNumbers = true,
        indexStyle = "01",
        indexColor = "#CCCCCC",
        dividerStyle = "Line",
        dividerColor = "#EEEEEE",
        activeItemAccentColor = "#0A0A0A",
        hideListOnMobile = true,
        previewWidthPercent = 55,
        previewImageHeight = 480,
        imageBorderRadius = 16,
        showTags = true,
        tagStyle = "Outline",
        showDescription = true,
        showCTA = true,
        listNameSize = 24,
        listNameWeight = "Medium",
        listNameFont = "inherit",
        listRoleSize = 13,
        listRoleColor = "#888888",
        previewNameSize = 40,
        previewRoleSize = 16,
        previewTagSize = 12,
        previewDescriptionSize = 15,
        trigger = "Hover",
        initialActiveIndex = 0,
        listHoverEffect = "Scale",
        previewReveal = "Masked Slide",
        revealDuration = 500,
        staggerItemsOnLoad = true,
        staggerDelay = 60,
        background = "#FFFFFF",
        textPrimary = "#0A0A0A",
        accent = "#000000",
    } = props

    const isStaticRenderer = useIsStaticRenderer()

    const [activeIndex, setActiveIndex] = useState(initialActiveIndex)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [hasLoaded, setHasLoaded] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isTablet, setIsTablet] = useState(false)

    useEffect(() => {
        startTransition(() => setHasLoaded(true))
    }, [])

    // Detect screen size for responsive behavior
    useEffect(() => {
        if (typeof window === "undefined") return

        const checkScreenSize = () => {
            const width = window.innerWidth
            startTransition(() => {
                setIsMobile(width < 768)
                setIsTablet(width >= 768 && width < 1024)
            })
        }

        checkScreenSize()
        window.addEventListener("resize", checkScreenSize)
        return () => window.removeEventListener("resize", checkScreenSize)
    }, [])

    // Generate team members with defaults
    const teamMembers = useMemo(() => {
        const defaultMembers: TeamMember[] = [
            {
                name: "Sarah Chen",
                role: "Creative Director",
                tags: "Strategy, Design, Leadership",
                description: "Award-winning creative director with 12+ years shaping digital experiences for global brands.",
                photo: { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Sarah Chen" },
                url: "https://framer.link/dulaj80"
            },
            {
                name: "Marcus Rodriguez",
                role: "Lead Developer",
                tags: "WebGL, React, Performance",
                description: "Full-stack engineer specializing in high-performance web applications and interactive 3D experiences.",
                photo: { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Marcus Rodriguez" },
                url: "https://framer.link/dulaj80"
            },
            {
                name: "Aisha Patel",
                role: "UX Researcher",
                tags: "User Testing, Analytics, Insights",
                description: "Data-driven researcher focused on understanding user behavior and translating insights into design.",
                photo: { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Aisha Patel" },
                url: "https://framer.link/dulaj80"
            },
            {
                name: "James O'Connor",
                role: "Motion Designer",
                tags: "Animation, Branding, Video",
                description: "Motion designer crafting fluid animations and dynamic brand experiences across digital platforms.",
                photo: { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "James O'Connor" },
                url: "https://framer.link/dulaj80"
            },
            {
                name: "Yuki Tanaka",
                role: "Product Designer",
                tags: "UI/UX, Prototyping, Systems",
                description: "Product designer passionate about creating intuitive interfaces and scalable design systems.",
                photo: { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Yuki Tanaka" },
                url: "https://framer.link/dulaj80"
            },
            {
                name: "Elena Volkov",
                role: "Brand Strategist",
                tags: "Positioning, Messaging, Identity",
                description: "Strategic thinker helping brands find their voice and connect authentically with their audience.",
                photo: { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Elena Volkov" },
                url: "https://framer.link/dulaj80"
            },
            {
                name: "David Kim",
                role: "Technical Lead",
                tags: "Architecture, DevOps, Mentoring",
                description: "Technical architect building scalable systems and mentoring the next generation of developers.",
                photo: { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "David Kim" },
                url: "https://framer.link/dulaj80"
            },
            {
                name: "Sofia Martinez",
                role: "Content Strategist",
                tags: "Copywriting, SEO, Storytelling",
                description: "Content strategist weaving compelling narratives that engage audiences and drive results.",
                photo: { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Sofia Martinez" },
                url: "https://framer.link/dulaj80"
            },
            {
                name: "Alex Thompson",
                role: "Art Director",
                tags: "Visual Design, Photography, Concept",
                description: "Art director with a keen eye for aesthetics and a passion for pushing creative boundaries.",
                photo: { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Alex Thompson" },
                url: "https://framer.link/dulaj80"
            },
            {
                name: "Priya Sharma",
                role: "Project Manager",
                tags: "Agile, Coordination, Delivery",
                description: "Project manager ensuring seamless collaboration and on-time delivery of exceptional work.",
                photo: { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Priya Sharma" },
                url: "https://framer.link/dulaj80"
            },
        ]

        const result: TeamMember[] = []
        for (let i = 0; i < memberCount; i++) {
            result.push(members[i] || defaultMembers[i] || defaultMembers[0])
        }
        return result
    }, [memberCount, members])

    const formatIndex = (index: number): string => {
        switch (indexStyle) {
            case "01":
                return (index + 1).toString().padStart(2, "0")
            case "1.":
                return `${index + 1}.`
            case "I.":
                const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]
                return `${roman[index] || index + 1}.`
            case "—":
                return "—"
            default:
                return `${index + 1}`
        }
    }

    const handleItemInteraction = (index: number) => {
        if (trigger === "Click") {
            startTransition(() => setActiveIndex(index))
        }
    }

    const handleItemHover = (index: number) => {
        startTransition(() => setHoveredIndex(index))
        if (trigger === "Hover") {
            startTransition(() => setActiveIndex(index))
        }
    }

    const handleItemLeave = () => {
        startTransition(() => setHoveredIndex(null))
    }

    const fontWeightMap: Record<ListTeamCarouselProps["listNameWeight"], number> = {
        Light: 300,
        Regular: 400,
        Medium: 500,
        Bold: 700,
    }

    const getListItemVariants = (index: number) => {
        const isActive = activeIndex === index
        const isHovered = hoveredIndex === index

        let transform = "scale(1)"
        let fontWeight = fontWeightMap[listNameWeight] ?? 500
        let color = textPrimary
        let textDecoration = "none"

        if (isHovered || isActive) {
            switch (listHoverEffect) {
                case "Scale":
                    transform = "scale(1.02)"
                    break
                case "Bold":
                    fontWeight = 700
                    break
                case "Color Change":
                    color = accent
                    break
                case "Underline":
                    textDecoration = "underline"
                    break
            }
        }

        return { transform, fontWeight, color, textDecoration }
    }

    const getPreviewVariants = () => {
        switch (previewReveal) {
            case "Masked Slide":
                return {
                    initial: { x: 100, opacity: 0 },
                    animate: { x: 0, opacity: 1 },
                    exit: { x: -100, opacity: 0 },
                }
            case "Fade":
                return {
                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                    exit: { opacity: 0 },
                }
            case "Scale Up":
                return {
                    initial: { scale: 0.9, opacity: 0 },
                    animate: { scale: 1, opacity: 1 },
                    exit: { scale: 1.1, opacity: 0 },
                }
            case "Clip":
                return {
                    initial: { clipPath: "inset(0 100% 0 0)" },
                    animate: { clipPath: "inset(0 0% 0 0)" },
                    exit: { clipPath: "inset(0 0 0 100%)" },
                }
            default:
                return {
                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                    exit: { opacity: 0 },
                }
        }
    }

    const activeMember = teamMembers[activeIndex]
    const tags = activeMember?.tags ? activeMember.tags.split(",").map(t => t.trim()) : []

    // Navigation handlers for mobile arrows
    const handlePrevious = () => {
        startTransition(() => {
            setActiveIndex((prev) => (prev === 0 ? teamMembers.length - 1 : prev - 1))
        })
    }

    const handleNext = () => {
        startTransition(() => {
            setActiveIndex((prev) => (prev === teamMembers.length - 1 ? 0 : prev + 1))
        })
    }

    // Responsive values
    const responsiveListWidth = isMobile ? 100 : isTablet ? 50 : listWidthPercent
    const responsivePreviewWidth = isMobile ? 100 : isTablet ? 50 : previewWidthPercent
    const responsivePadding = isMobile ? "20px 16px" : isTablet ? "32px 24px" : "40px 32px"
    const responsivePreviewPadding = isMobile ? "20px 16px" : isTablet ? "32px 24px" : "40px"
    const responsiveGap = isMobile ? 16 : 24
    const responsiveListNameSize = isMobile ? Math.max(18, listNameSize * 0.75) : isTablet ? Math.max(20, listNameSize * 0.85) : listNameSize
    const responsiveListRoleSize = isMobile ? Math.max(11, listRoleSize * 0.85) : listRoleSize
    const responsivePreviewNameSize = isMobile ? Math.max(28, previewNameSize * 0.7) : isTablet ? Math.max(32, previewNameSize * 0.8) : previewNameSize
    const responsivePreviewRoleSize = isMobile ? Math.max(13, previewRoleSize * 0.85) : previewRoleSize
    const responsivePreviewTagSize = isMobile ? Math.max(10, previewTagSize * 0.85) : previewTagSize
    const responsivePreviewDescriptionSize = isMobile ? Math.max(13, previewDescriptionSize * 0.87) : previewDescriptionSize
    const responsiveImageHeight = isMobile ? Math.min(300, previewImageHeight * 0.6) : isTablet ? Math.min(400, previewImageHeight * 0.8) : previewImageHeight
    const responsiveListItemHeight = isMobile ? Math.max(60, listItemHeight * 0.85) : listItemHeight

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                backgroundColor: background,
                overflow: "hidden",
                position: "relative",
            }}
        >
            {/* Preview Panel - First on mobile, fixed with arrows */}
            <div
                style={{
                    width: isMobile ? "100%" : `${responsivePreviewWidth}%`,
                    height: isMobile && hideListOnMobile ? "100%" : isMobile ? "50vh" : "100%",
                    minHeight: isMobile && hideListOnMobile ? "100%" : isMobile ? "400px" : "100%",
                    maxHeight: isMobile && hideListOnMobile ? "100%" : isMobile ? "50vh" : "100%",
                    display: "flex",
                    alignItems: isMobile ? "flex-start" : "center",
                    justifyContent: "center",
                    padding: responsivePreviewPadding,
                    position: isMobile && !hideListOnMobile ? "sticky" : "relative",
                    top: isMobile && !hideListOnMobile ? 0 : "auto",
                    flexShrink: 0,
                    order: isMobile ? 1 : 2,
                    overflowY: isMobile ? "hidden" : "hidden",
                    overflowX: "hidden",
                    backgroundColor: background,
                    zIndex: isMobile && !hideListOnMobile ? 10 : 1,
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeIndex}
                        {...(isStaticRenderer ? {} : getPreviewVariants())}
                        transition={
                            isStaticRenderer
                                ? { duration: 0 }
                                : { duration: revealDuration / 1000, ease: "easeInOut" }
                        }
                        style={{
                            width: "100%",
                            height: isMobile ? "auto" : "100%",
                            display: "flex",
                            flexDirection: "column",
                            gap: responsiveGap,
                        }}
                    >
                        {/* Image with navigation arrows on mobile */}
                        <div
                            style={{
                                width: "100%",
                                height: responsiveImageHeight,
                                borderRadius: isMobile ? Math.max(8, imageBorderRadius * 0.5) : imageBorderRadius,
                                overflow: "hidden",
                                backgroundColor: "#f0f0f0",
                                flexShrink: 0,
                                position: "relative",
                            }}
                        >
                            <img
                                src={activeMember.photo.src}
                                alt={activeMember.photo.alt}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                            
                            {/* Navigation Arrows - Only on mobile */}
                            {isMobile && (
                                <>
                                    {/* Left Arrow */}
                                    <button
                                        onClick={handlePrevious}
                                        style={{
                                            position: "absolute",
                                            left: 12,
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            width: 40,
                                            height: 40,
                                            borderRadius: "50%",
                                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                                            border: "none",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                                            zIndex: 20,
                                            WebkitTapHighlightColor: "transparent",
                                            transition: "all 0.2s ease",
                                        }}
                                        onTouchStart={(e) => {
                                            e.currentTarget.style.transform = "translateY(-50%) scale(0.9)"
                                        }}
                                        onTouchEnd={(e) => {
                                            e.currentTarget.style.transform = "translateY(-50%) scale(1)"
                                        }}
                                        aria-label="Previous member"
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke={textPrimary}
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="15 18 9 12 15 6" />
                                        </svg>
                                    </button>

                                    {/* Right Arrow */}
                                    <button
                                        onClick={handleNext}
                                        style={{
                                            position: "absolute",
                                            right: 12,
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            width: 40,
                                            height: 40,
                                            borderRadius: "50%",
                                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                                            border: "none",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                                            zIndex: 20,
                                            WebkitTapHighlightColor: "transparent",
                                            transition: "all 0.2s ease",
                                        }}
                                        onTouchStart={(e) => {
                                            e.currentTarget.style.transform = "translateY(-50%) scale(0.9)"
                                        }}
                                        onTouchEnd={(e) => {
                                            e.currentTarget.style.transform = "translateY(-50%) scale(1)"
                                        }}
                                        aria-label="Next member"
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke={textPrimary}
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>
                                    </button>

                                    {/* Pagination Indicator */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            bottom: 12,
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            display: "flex",
                                            gap: 6,
                                            padding: "8px 12px",
                                            borderRadius: 20,
                                            backgroundColor: "rgba(0, 0, 0, 0.6)",
                                            backdropFilter: "blur(8px)",
                                        }}
                                    >
                                        {teamMembers.map((_, index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    width: index === activeIndex ? 20 : 6,
                                                    height: 6,
                                                    borderRadius: 3,
                                                    backgroundColor: index === activeIndex ? "#FFFFFF" : "rgba(255, 255, 255, 0.4)",
                                                    transition: "all 0.3s ease",
                                                }}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Content */}
                        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 16 }}>
                            <div>
                                <div
                                    style={{
                                        fontSize: responsivePreviewNameSize,
                                        fontWeight: 700,
                                        color: textPrimary,
                                        lineHeight: 1.1,
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {activeMember.name}
                                </div>
                                <div
                                    style={{
                                        fontSize: responsivePreviewRoleSize,
                                        color: listRoleColor,
                                        marginTop: isMobile ? 6 : 8,
                                        lineHeight: 1.3,
                                    }}
                                >
                                    {activeMember.role}
                                </div>
                            </div>

                            {showTags && tags.length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: isMobile ? 6 : 8 }}>
                                    {tags.map((tag, i) => (
                                        <span
                                            key={i}
                                            style={{
                                                fontSize: responsivePreviewTagSize,
                                                padding: isMobile ? "4px 10px" : "6px 12px",
                                                borderRadius: isMobile ? 4 : 6,
                                                backgroundColor:
                                                    tagStyle === "Filled" ? accent : "transparent",
                                                color:
                                                    tagStyle === "Filled" ? "#FFFFFF" : textPrimary,
                                                border:
                                                    tagStyle === "Outline"
                                                        ? `1px solid ${dividerColor}`
                                                        : "none",
                                                lineHeight: 1,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {showDescription && (
                                <div
                                    style={{
                                        fontSize: responsivePreviewDescriptionSize,
                                        color: textPrimary,
                                        lineHeight: 1.6,
                                        opacity: 0.8,
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {activeMember.description}
                                </div>
                            )}

                            {showCTA && (
                                <a
                                    href={activeMember.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 8,
                                        fontSize: isMobile ? 13 : 14,
                                        fontWeight: 600,
                                        color: accent,
                                        textDecoration: "none",
                                        marginTop: isMobile ? 4 : 8,
                                        transition: "opacity 0.2s ease",
                                        WebkitTapHighlightColor: "transparent",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.opacity = "0.7"
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.opacity = "1"
                                    }}
                                >
                                    {ctaLabel}
                                    <span style={{ fontSize: isMobile ? 14 : 16 }}>→</span>
                                </a>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* List Panel - Second on mobile with independent scroll, hidden if hideListOnMobile is true */}
            {(!isMobile || !hideListOnMobile) && (
                <div
                    style={{
                        width: isMobile ? "100%" : `${responsiveListWidth}%`,
                        height: isMobile ? "auto" : "100%",
                        minHeight: isMobile ? "50vh" : "100%",
                        display: "flex",
                        flexDirection: "column",
                        padding: responsivePadding,
                        overflowY: isMobile ? "visible" : "auto",
                        overflowX: "hidden",
                        gap: 0,
                        flexShrink: 0,
                        order: isMobile ? 2 : 1,
                        borderTop: isMobile ? `1px solid ${dividerColor}` : "none",
                    }}
                >
                    {teamMembers.map((member, index) => {
                        const isActive = activeIndex === index
                        const variants = getListItemVariants(index)

                        return (
                            <motion.div
                                key={index}
                                initial={!isStaticRenderer && staggerItemsOnLoad ? { opacity: 0, y: 20 } : false}
                                animate={
                                    isStaticRenderer
                                        ? { opacity: 1, y: 0 }
                                        : hasLoaded
                                          ? { opacity: 1, y: 0 }
                                          : {}
                                }
                                transition={
                                    isStaticRenderer
                                        ? { duration: 0 }
                                        : {
                                              duration: 0.4,
                                              delay: staggerItemsOnLoad ? index * (staggerDelay / 1000) : 0,
                                          }
                                }
                                style={{
                                    minHeight: responsiveListItemHeight,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: isMobile ? 12 : 16,
                                    cursor: "pointer",
                                    borderBottom:
                                        dividerStyle === "Line" ? `1px solid ${dividerColor}` : "none",
                                    paddingTop: isMobile ? 12 : 16,
                                    paddingBottom: isMobile ? 12 : 16,
                                    transition: "all 0.3s ease",
                                    WebkitTapHighlightColor: "transparent",
                                }}
                                onClick={() => handleItemInteraction(index)}
                                onMouseEnter={() => !isMobile && handleItemHover(index)}
                                onMouseLeave={handleItemLeave}
                                onTouchStart={() => isMobile && handleItemHover(index)}
                            >
                                {showIndexNumbers && (
                                    <div
                                        style={{
                                            fontSize: isMobile ? 12 : 14,
                                            fontWeight: 500,
                                            color: isActive ? activeItemAccentColor : indexColor,
                                            minWidth: isMobile ? 24 : 32,
                                            transition: "color 0.3s ease",
                                        }}
                                    >
                                        {formatIndex(index)}
                                    </div>
                                )}

                                {dividerStyle === "Dot" && (
                                    <div
                                        style={{
                                            width: isMobile ? 5 : 6,
                                            height: isMobile ? 5 : 6,
                                            borderRadius: "50%",
                                            backgroundColor: isActive ? activeItemAccentColor : dividerColor,
                                            transition: "background-color 0.3s ease",
                                        }}
                                    />
                                )}

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontSize: responsiveListNameSize,
                                            fontWeight: variants.fontWeight,
                                            color: variants.color,
                                            fontFamily: listNameFont,
                                            textDecoration: variants.textDecoration,
                                            transform: variants.transform,
                                            transition: "all 0.3s ease",
                                            lineHeight: 1.2,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: isMobile ? "nowrap" : "normal",
                                        }}
                                    >
                                        {member.name}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: responsiveListRoleSize,
                                            color: listRoleColor,
                                            marginTop: 4,
                                            lineHeight: 1.3,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: isMobile ? "nowrap" : "normal",
                                        }}
                                    >
                                        {member.role}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

addPropertyControls(ListTeamCarousel, {
    // TEAM DATA
    memberCount: {
        type: ControlType.Number,
        title: "Member Count",
        defaultValue: 6,
        min: 3,
        max: 10,
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
                tags: {
                    type: ControlType.String,
                    title: "Tags",
                    defaultValue: "Skill, Expertise, Focus",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                    defaultValue: "Professional description and background.",
                },
                photo: {
                    type: ControlType.ResponsiveImage,
                    title: "Photo",
                },
                url: {
                    type: ControlType.String,
                    title: "URL",
                    defaultValue: "https://framer.link/dulaj80",
                },
            },
        },
        maxCount: 10,
    },
    ctaLabel: {
        type: ControlType.String,
        title: "CTA Label",
        defaultValue: "Open Profile",
    },

    // LIST PANEL
    listWidthPercent: {
        type: ControlType.Number,
        title: "List Width %",
        defaultValue: 45,
        min: 30,
        max: 60,
        step: 1,
        unit: "%",
    },
    listItemHeight: {
        type: ControlType.Number,
        title: "List Item Height",
        defaultValue: 72,
        min: 50,
        max: 120,
        step: 1,
        unit: "px",
    },
    showIndexNumbers: {
        type: ControlType.Boolean,
        title: "Show Index Numbers",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    indexStyle: {
        type: ControlType.Enum,
        title: "Index Style",
        options: ["01", "1.", "I.", "—"],
        defaultValue: "01",
        displaySegmentedControl: true,
        hidden: ({ showIndexNumbers }) => !showIndexNumbers,
    },
    indexColor: {
        type: ControlType.Color,
        title: "Index Color",
        defaultValue: "#CCCCCC",
        hidden: ({ showIndexNumbers }) => !showIndexNumbers,
    },
    dividerStyle: {
        type: ControlType.Enum,
        title: "Divider Style",
        options: ["Line", "None", "Dot"],
        defaultValue: "Line",
        displaySegmentedControl: true,
    },
    dividerColor: {
        type: ControlType.Color,
        title: "Divider Color",
        defaultValue: "#EEEEEE",
        hidden: ({ dividerStyle }) => dividerStyle === "None",
    },
    activeItemAccentColor: {
        type: ControlType.Color,
        title: "Active Item Accent",
        defaultValue: "#0A0A0A",
    },
    hideListOnMobile: {
        type: ControlType.Boolean,
        title: "Hide List on Mobile",
        defaultValue: true,
        enabledTitle: "Hide",
        disabledTitle: "Show",
    },

    // PREVIEW PANEL
    previewWidthPercent: {
        type: ControlType.Number,
        title: "Preview Width %",
        defaultValue: 55,
        min: 40,
        max: 70,
        step: 1,
        unit: "%",
    },
    previewImageHeight: {
        type: ControlType.Number,
        title: "Preview Image Height",
        defaultValue: 480,
        min: 300,
        max: 700,
        step: 10,
        unit: "px",
    },
    imageBorderRadius: {
        type: ControlType.Number,
        title: "Image Border Radius",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    showTags: {
        type: ControlType.Boolean,
        title: "Show Tags",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    tagStyle: {
        type: ControlType.Enum,
        title: "Tag Style",
        options: ["Outline", "Filled", "Plain"],
        defaultValue: "Outline",
        displaySegmentedControl: true,
        hidden: ({ showTags }) => !showTags,
    },
    showDescription: {
        type: ControlType.Boolean,
        title: "Show Description",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showCTA: {
        type: ControlType.Boolean,
        title: "Show CTA",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    // TYPOGRAPHY (List)
    listNameSize: {
        type: ControlType.Number,
        title: "List Name Size",
        defaultValue: 24,
        min: 14,
        max: 40,
        step: 1,
        unit: "px",
    },
    listNameWeight: {
        type: ControlType.Enum,
        title: "List Name Weight",
        options: ["Light", "Regular", "Medium", "Bold"],
        defaultValue: "Medium",
        displaySegmentedControl: true,
    },
    listNameFont: {
        type: ControlType.String,
        title: "List Name Font",
        defaultValue: "inherit",
    },
    listRoleSize: {
        type: ControlType.Number,
        title: "List Role Size",
        defaultValue: 13,
        min: 10,
        max: 20,
        step: 1,
        unit: "px",
    },
    listRoleColor: {
        type: ControlType.Color,
        title: "List Role Color",
        defaultValue: "#888888",
    },

    // TYPOGRAPHY (Preview)
    previewNameSize: {
        type: ControlType.Number,
        title: "Preview Name Size",
        defaultValue: 40,
        min: 24,
        max: 60,
        step: 1,
        unit: "px",
    },
    previewRoleSize: {
        type: ControlType.Number,
        title: "Preview Role Size",
        defaultValue: 16,
        min: 12,
        max: 24,
        step: 1,
        unit: "px",
    },
    previewTagSize: {
        type: ControlType.Number,
        title: "Preview Tag Size",
        defaultValue: 12,
        min: 10,
        max: 16,
        step: 1,
        unit: "px",
    },
    previewDescriptionSize: {
        type: ControlType.Number,
        title: "Preview Description Size",
        defaultValue: 15,
        min: 12,
        max: 20,
        step: 1,
        unit: "px",
    },

    // INTERACTION TRIGGER
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["Hover", "Click"],
        defaultValue: "Hover",
        displaySegmentedControl: true,
    },
    initialActiveIndex: {
        type: ControlType.Number,
        title: "Initial Active Index",
        defaultValue: 0,
        min: 0,
        max: 9,
        step: 1,
        displayStepper: true,
    },

    // ANIMATION
    listHoverEffect: {
        type: ControlType.Enum,
        title: "List Hover Effect",
        options: ["Scale", "Bold", "Color Change", "Underline"],
        defaultValue: "Scale",
    },
    previewReveal: {
        type: ControlType.Enum,
        title: "Preview Reveal",
        options: ["Masked Slide", "Fade", "Scale Up", "Clip"],
        defaultValue: "Masked Slide",
    },
    revealDuration: {
        type: ControlType.Number,
        title: "Reveal Duration",
        defaultValue: 500,
        min: 200,
        max: 1000,
        step: 50,
        unit: "ms",
    },
    staggerItemsOnLoad: {
        type: ControlType.Boolean,
        title: "Stagger Items on Load",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger Delay",
        defaultValue: 60,
        min: 20,
        max: 150,
        step: 10,
        unit: "ms",
        hidden: ({ staggerItemsOnLoad }) => !staggerItemsOnLoad,
    },

    // COLORS
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    textPrimary: {
        type: ControlType.Color,
        title: "Text Primary",
        defaultValue: "#0A0A0A",
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#000000",
    },
})
