// Split Screen Team Carousel - Editorial two-column layout with animated transitions
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
import { useState, useMemo, useCallback, startTransition, useEffect, type CSSProperties } from "react"

interface Member {
    name: string
    role: string
    bio: string
    tags: string
    photo?: { src: string; alt: string }
    url: string
}

interface SplitScreenTeamCarouselProps {
    memberCount: number
    members: Member[]
    defaultUrl: string
    ctaText: string
    photoSide: "left" | "right" | "alternating"
    photoColumnWidth: number
    componentHeight: number
    photoFit: "cover" | "contain" | "top" | "bottom" | "custom"
    photoVerticalPosition: number
    panelBackground: string
    panelPaddingHorizontal: number
    panelPaddingVertical: number
    textMaxWidth: number
    verticalAlignment: "top" | "center" | "bottom"
    nameSize: number
    nameWeight: "100" | "300" | "400" | "700" | "900"
    nameLineHeight: number
    nameLetterSpacing: number
    roleSize: number
    roleLetterSpacing: number
    roleUppercase: boolean
    bioSize: number
    bioLineHeight: number
    showTags: boolean
    tagStyle: "outline" | "filled" | "dot" | "none"
    tagColor: string
    tagTextColor: string
    tagSize: number
    arrowPosition: "center" | "bottom-panel" | "bottom-full" | "below-component"
    showArrows: boolean
    arrowStyle: "long" | "short" | "chevron" | "circle"
    arrowSize: "sm" | "md" | "lg"
    arrowColor: string
    arrowBackground: string
    arrowGap: number
    arrowAlign: "left" | "center" | "right"
    showProgressBar: boolean
    progressBarPosition: "bottom" | "top"
    progressColor: string
    background: string
    nameColor: string
    roleColor: string
    bioColor: string
    accentColor: string
    dividerColor: string
    photoTransition: "slide" | "clip" | "fade" | "zoom"
    textTransition: "fadeUp" | "fade" | "slideIn"
    transitionDuration: number
    textStagger: number
    directionAware: boolean
}

const defaultImages = [
    { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Team Member 1" },
    { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Team Member 2" },
    { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Team Member 3" },
    { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Team Member 4" },
    { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Team Member 5" },
]

/**
 * Split Screen Team Carousel
 * 
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 600
 */
export default function SplitScreenTeamCarousel(props: SplitScreenTeamCarouselProps) {
    const {
        memberCount = 5,
        members = [],
        defaultUrl = "https://framer.link/dulaj80",
        ctaText = "See Portfolio",
        photoSide = "left",
        photoColumnWidth = 50,
        componentHeight = 600,
        photoFit = "cover",
        photoVerticalPosition = 20,
        panelBackground = "#FFFFFF",
        panelPaddingHorizontal = 64,
        panelPaddingVertical = 48,
        textMaxWidth = 440,
        verticalAlignment = "center",
        nameSize = 48,
        nameWeight = "700",
        nameLineHeight = 1.1,
        nameLetterSpacing = -0.02,
        roleSize = 16,
        roleLetterSpacing = 0.08,
        roleUppercase = true,
        bioSize = 15,
        bioLineHeight = 1.7,
        showTags = true,
        tagStyle = "outline",
        tagColor = "#F0F0F0",
        tagTextColor = "#444444",
        tagSize = 12,
        arrowPosition = "below-component",
        showArrows = true,
        arrowStyle = "long",
        arrowSize = "md",
        arrowColor = "#0A0A0A",
        arrowBackground = "transparent",
        arrowGap = 14,
        arrowAlign = "center",
        showProgressBar = true,
        progressBarPosition = "bottom",
        progressColor = "#0A0A0A",
        background = "#FFFFFF",
        nameColor = "#0A0A0A",
        roleColor = "#888888",
        bioColor = "#444444",
        accentColor = "#0A0A0A",
        dividerColor = "#EEEEEE",
        photoTransition = "slide",
        textTransition = "fadeUp",
        transitionDuration = 700,
        textStagger = 60,
        directionAware = true,
    } = props

    const [currentIndex, setCurrentIndex] = useState(0)
    const [direction, setDirection] = useState(1)
    const [isMobile, setIsMobile] = useState(false)
    const [isTablet, setIsTablet] = useState(false)
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        if (typeof window === "undefined") return

        const checkMobile = () => {
            startTransition(() => {
                const w = window.innerWidth
                setIsMobile(w < 768)
                setIsTablet(w >= 768 && w < 1024)
            })
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    const teamMembers = useMemo(() => {
        const defaultMembers: Member[] = [
            {
                name: "Sarah Chen",
                role: "Creative Director",
                bio: "Leading innovative design strategies with 12+ years of experience in brand identity and digital experiences. Passionate about creating meaningful connections through design.",
                tags: "Design, Strategy, Branding",
                url: defaultUrl,
            },
            {
                name: "Marcus Rodriguez",
                role: "Lead Developer",
                bio: "Full-stack engineer specializing in scalable web applications and modern JavaScript frameworks. Building the future of digital products.",
                tags: "Engineering, React, Node.js",
                url: defaultUrl,
            },
            {
                name: "Aisha Patel",
                role: "Product Designer",
                bio: "Crafting intuitive user experiences that balance aesthetics with functionality. Advocate for inclusive design and accessibility.",
                tags: "UX, UI, Research",
                url: defaultUrl,
            },
            {
                name: "James Wilson",
                role: "Brand Strategist",
                bio: "Transforming businesses through compelling narratives and strategic positioning. Expert in market analysis and brand development.",
                tags: "Strategy, Marketing, Content",
                url: defaultUrl,
            },
            {
                name: "Elena Kowalski",
                role: "Art Director",
                bio: "Visual storyteller with a keen eye for detail and composition. Creating memorable brand experiences across digital and print media.",
                tags: "Art Direction, Photography, Print",
                url: defaultUrl,
            },
        ]

        const actualMembers = members.length > 0 ? members : defaultMembers
        return actualMembers.slice(0, memberCount).map((member, i) => ({
            ...defaultMembers[i % defaultMembers.length],
            ...member,
            photo: member.photo || defaultImages[i % defaultImages.length],
            tags: member.tags || "",
        }))
    }, [members, memberCount, defaultUrl])

    const handleNext = useCallback(() => {
        startTransition(() => {
            setDirection(1)
            setCurrentIndex((prev) => (prev + 1) % teamMembers.length)
        })
    }, [teamMembers.length])

    const handlePrev = useCallback(() => {
        startTransition(() => {
            setDirection(-1)
            setCurrentIndex((prev) => (prev - 1 + teamMembers.length) % teamMembers.length)
        })
    }, [teamMembers.length])

    const currentMember = teamMembers[currentIndex]
    const isPhotoLeft = photoSide === "alternating" ? currentIndex % 2 === 0 : photoSide === "left"

    const photoObjectPosition = useMemo(() => {
        if (photoFit === "cover") return "center"
        if (photoFit === "top") return "top"
        if (photoFit === "bottom") return "bottom"
        if (photoFit === "custom") return `center ${photoVerticalPosition}%`
        return "center"
    }, [photoFit, photoVerticalPosition])

    const photoVariants = useMemo(() => ({
        enter: (dir: number) => {
            if (photoTransition === "slide") {
                return {
                    x: directionAware ? (dir > 0 ? "100%" : "-100%") : "100%",
                    opacity: 1,
                }
            }
            if (photoTransition === "clip") {
                return {
                    clipPath: directionAware
                        ? dir > 0
                            ? "inset(0 0 0 100%)"
                            : "inset(0 100% 0 0)"
                        : "inset(0 0 0 100%)",
                    opacity: 1,
                }
            }
            if (photoTransition === "zoom") {
                return { scale: 1.2, opacity: 0 }
            }
            return { opacity: 0 }
        },
        center: {
            x: 0,
            clipPath: "inset(0 0 0 0)",
            scale: 1,
            opacity: 1,
        },
        exit: (dir: number) => {
            if (photoTransition === "slide") {
                return {
                    x: directionAware ? (dir > 0 ? "-100%" : "100%") : "-100%",
                    opacity: 1,
                }
            }
            if (photoTransition === "clip") {
                return {
                    clipPath: directionAware
                        ? dir > 0
                            ? "inset(0 100% 0 0)"
                            : "inset(0 0 0 100%)"
                        : "inset(0 100% 0 0)",
                    opacity: 1,
                }
            }
            if (photoTransition === "zoom") {
                return { scale: 0.8, opacity: 0 }
            }
            return { opacity: 0 }
        },
    }), [photoTransition, directionAware])

    const textVariants = useMemo(() => ({
        enter: {
            opacity: 0,
            y: textTransition === "fadeUp" ? 20 : textTransition === "slideIn" ? 40 : 0,
            x: textTransition === "slideIn" ? 20 : 0,
        },
        center: {
            opacity: 1,
            y: 0,
            x: 0,
        },
        exit: {
            opacity: 0,
            y: textTransition === "fadeUp" ? -10 : 0,
            x: textTransition === "slideIn" ? -20 : 0,
        },
    }), [textTransition])

    const tags = useMemo(() => 
        currentMember.tags ? currentMember.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        [currentMember.tags]
    )

    const renderArrow = useCallback((isNext: boolean) => {
        const rotation = isNext ? 0 : 180
        const sizeScale = arrowSize === "sm" ? 0.85 : arrowSize === "lg" ? 1.15 : 1

        if (arrowStyle === "long") {
            return (
                <svg
                    width={48 * sizeScale}
                    height={16 * sizeScale}
                    viewBox="0 0 48 16"
                    fill="none"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    <path
                        d="M47.7071 8.70711C48.0976 8.31658 48.0976 7.68342 47.7071 7.29289L41.3431 0.928932C40.9526 0.538408 40.3195 0.538408 39.9289 0.928932C39.5384 1.31946 39.5384 1.95262 39.9289 2.34315L45.5858 8L39.9289 13.6569C39.5384 14.0474 39.5384 14.6805 39.9289 15.0711C40.3195 15.4616 40.9526 15.4616 41.3431 15.0711L47.7071 8.70711ZM0 9H47V7H0V9Z"
                        fill={arrowColor}
                    />
                </svg>
            )
        }

        if (arrowStyle === "short") {
            return (
                <svg
                    width={24 * sizeScale}
                    height={16 * sizeScale}
                    viewBox="0 0 24 16"
                    fill="none"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    <path
                        d="M23.7071 8.70711C24.0976 8.31658 24.0976 7.68342 23.7071 7.29289L17.3431 0.928932C16.9526 0.538408 16.3195 0.538408 15.9289 0.928932C15.5384 1.31946 15.5384 1.95262 15.9289 2.34315L21.5858 8L15.9289 13.6569C15.5384 14.0474 15.5384 14.6805 15.9289 15.0711C16.3195 15.4616 16.9526 15.4616 17.3431 15.0711L23.7071 8.70711ZM0 9H23V7H0V9Z"
                        fill={arrowColor}
                    />
                </svg>
            )
        }

        if (arrowStyle === "chevron") {
            return (
                <svg
                    width={24 * sizeScale}
                    height={24 * sizeScale}
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ transform: `rotate(${rotation}deg)` }}
                >
                    <path
                        d="M9 18L15 12L9 6"
                        stroke={arrowColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            )
        }

        return (
            <svg width={40 * sizeScale} height={40 * sizeScale} viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="19" stroke={arrowColor} strokeWidth="2" />
                <path
                    d="M16 20H24M24 20L20 16M24 20L20 24"
                    stroke={arrowColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "20px 20px" }}
                />
            </svg>
        )
    }, [arrowSize, arrowStyle, arrowColor])

    const renderTag = useCallback((tag: string, index: number) => {
        const baseStyle: CSSProperties = {
            fontSize: tagSize,
            padding: tagStyle === "dot" ? "0" : "6px 12px",
            borderRadius: tagStyle === "dot" ? "0" : "4px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
        }

        if (tagStyle === "outline") {
            return (
                <span key={`${tag}-${index}`} style={{ ...baseStyle, border: `1px solid ${tagTextColor}`, color: tagTextColor }}>
                    {tag}
                </span>
            )
        }
        
        if (tagStyle === "filled") {
            return (
                <span key={`${tag}-${index}`} style={{ ...baseStyle, backgroundColor: tagColor, color: tagTextColor }}>
                    {tag}
                </span>
            )
        }
        
        if (tagStyle === "dot") {
            return (
                <span key={`${tag}-${index}`} style={{ ...baseStyle, color: tagTextColor }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: accentColor }} />
                    {tag}
                </span>
            )
        }
        
        return <span key={`${tag}-${index}`} style={{ ...baseStyle, color: tagTextColor }}>{tag}</span>
    }, [tagSize, tagStyle, tagColor, tagTextColor, accentColor])

    const arrowContainerStyle = useMemo(() => {
        const justifyContent =
            arrowAlign === "left" ? "flex-start" : arrowAlign === "right" ? "flex-end" : "center"

        const responsiveGap = isMobile ? Math.max(10, arrowGap * 0.85) : isTablet ? Math.max(12, arrowGap * 0.95) : arrowGap

        return {
            width: "100%",
            display: "flex",
            justifyContent: isMobile ? "space-between" : justifyContent,
            gap: `${responsiveGap}px`,
        }
    }, [arrowAlign, arrowGap, isMobile, isTablet])

    const verticalAlignmentStyle = useMemo(() => {
        if (verticalAlignment === "top") return "flex-start"
        if (verticalAlignment === "bottom") return "flex-end"
        return "center"
    }, [verticalAlignment])

    const renderArrows = useCallback((variant: "in-panel" | "below-component") => {
        if (!showArrows) return null
        const sizeScale = arrowSize === "sm" ? 0.85 : arrowSize === "lg" ? 1.15 : 1

        const buttonPadding = isMobile ? Math.round(10 * sizeScale) : isTablet ? Math.round(11 * sizeScale) : Math.round(12 * sizeScale)

        const baseButtonStyle: CSSProperties = {
            background: arrowBackground,
            border: `1px solid ${dividerColor}`,
            cursor: "pointer",
            padding: buttonPadding,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: arrowColor,
        }

        if (variant === "in-panel") {
            return (
                <div style={{ ...arrowContainerStyle, marginTop: isMobile ? 12 : 16, marginBottom: isMobile ? 16 : 20 }} aria-label="Carousel navigation">
                    <button
                        onClick={handlePrev}
                        style={baseButtonStyle}
                        aria-label="Previous member"
                    >
                        {renderArrow(false)}
                    </button>
                    <button
                        onClick={handleNext}
                        style={baseButtonStyle}
                        aria-label="Next member"
                    >
                        {renderArrow(true)}
                    </button>
                </div>
            )
        }

        return (
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    gap: `${Math.max(10, arrowGap)}px`,
                    paddingTop: 16,
                    paddingBottom: 16,
                    backgroundColor: background,
                    borderTop: `1px solid ${dividerColor}`,
                }}
            >
                <button
                    onClick={handlePrev}
                    style={baseButtonStyle}
                    aria-label="Previous member"
                >
                    {renderArrow(false)}
                </button>
                <button
                    onClick={handleNext}
                    style={baseButtonStyle}
                    aria-label="Next member"
                >
                    {renderArrow(true)}
                </button>
            </div>
        )
    }, [showArrows, arrowSize, isMobile, isTablet, arrowBackground, dividerColor, arrowColor, arrowContainerStyle, handlePrev, handleNext, renderArrow, arrowGap, background])

    const extraHeight = showArrows && arrowPosition === "below-component" ? 80 : 0

    const animationProps = isStatic ? {} : {
        initial: "enter",
        animate: "center",
        exit: "exit",
    }

    const progressBarAnimationProps = isStatic ? {} : {
        initial: { width: 0 },
        animate: { width: `${((currentIndex + 1) / teamMembers.length) * 100}%` },
        transition: { duration: 0.3 },
    }

    return (
        <div style={{ width: "100%", height: componentHeight + extraHeight, position: "relative", backgroundColor: background, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "relative", width: "100%", height: componentHeight, overflow: "hidden" }}>
                {/* Progress Bar */}
                {showProgressBar && (
                    <div
                        style={{
                            position: "absolute",
                            [progressBarPosition]: 0,
                            left: 0,
                            right: 0,
                            height: 2,
                            backgroundColor: dividerColor,
                            zIndex: 20,
                        }}
                    >
                        <motion.div
                            style={{
                                height: "100%",
                                backgroundColor: progressColor,
                                width: isStatic ? `${((currentIndex + 1) / teamMembers.length) * 100}%` : undefined,
                            }}
                            {...progressBarAnimationProps}
                        />
                    </div>
                )}

                {/* Main Layout */}
                <div style={{ 
                    display: "flex", 
                    height: "100%", 
                    flexDirection: isMobile ? "column" : isPhotoLeft ? "row" : "row-reverse"
                }}>
                    {/* Center overlap arrows (between panels) */}
                    {showArrows && arrowPosition === "center" && !isMobile && (
                        <div
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: `${isPhotoLeft ? photoColumnWidth : 100 - photoColumnWidth}%`,
                                transform: "translate(-50%, -50%)",
                                zIndex: 30,
                                width: isTablet ? 120 : 140,
                            }}
                        >
                            {renderArrows("in-panel")}
                        </div>
                    )}

                    {/* Photo Column */}
                    <div style={{ 
                        width: isMobile ? "100%" : `${photoColumnWidth}%`, 
                        height: isMobile ? "50%" : "100%", 
                        position: "relative", 
                        overflow: "hidden" 
                    }}>
                        <AnimatePresence initial={false} custom={direction}>
                            <motion.div
                                key={currentIndex}
                                custom={direction}
                                variants={isStatic ? undefined : photoVariants}
                                {...animationProps}
                                transition={isStatic ? undefined : { duration: transitionDuration / 1000, ease: [0.4, 0, 0.2, 1] }}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    backgroundImage: `url(${currentMember.photo?.src})`,
                                    backgroundSize: photoFit === "contain" ? "contain" : "cover",
                                    backgroundPosition: photoObjectPosition,
                                    backgroundRepeat: "no-repeat",
                                }}
                            />
                        </AnimatePresence>
                    </div>

                    {/* Text Column */}
                    <div
                        style={{
                            width: isMobile ? "100%" : `${100 - photoColumnWidth}%`,
                            height: isMobile ? "50%" : "100%",
                            backgroundColor: panelBackground,
                            padding: isMobile 
                                ? `${Math.max(24, panelPaddingVertical / 2)}px ${Math.max(24, panelPaddingHorizontal / 2)}px`
                                : `${panelPaddingVertical}px ${panelPaddingHorizontal}px`,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: verticalAlignmentStyle,
                            position: "relative",
                            overflowY: isMobile ? "auto" : "visible",
                        }}
                    >
                        <div style={{ maxWidth: isMobile ? "100%" : textMaxWidth, display: "flex", flexDirection: "column" }}>
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={currentIndex}
                                    variants={isStatic ? undefined : textVariants}
                                    {...animationProps}
                                    transition={isStatic ? undefined : { duration: transitionDuration / 1000, ease: [0.4, 0, 0.2, 1] }}
                                >
                                    {/* Role */}
                                    <motion.div
                                        initial={isStatic ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={isStatic ? undefined : { delay: textStagger / 1000, duration: transitionDuration / 1000 }}
                                        style={{
                                            fontSize: isMobile ? Math.max(12, roleSize * 0.85) : roleSize,
                                            color: roleColor,
                                            letterSpacing: `${roleLetterSpacing}em`,
                                            textTransform: roleUppercase ? "uppercase" : "none",
                                            marginBottom: isMobile ? 8 : 16,
                                            fontWeight: 500,
                                        }}
                                    >
                                        {currentMember.role}
                                    </motion.div>

                                    {/* Name */}
                                    <motion.h2
                                        initial={isStatic ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={isStatic ? undefined : { delay: (textStagger * 2) / 1000, duration: transitionDuration / 1000 }}
                                        style={{
                                            fontSize: isMobile ? Math.max(28, nameSize * 0.6) : nameSize,
                                            fontWeight: nameWeight,
                                            lineHeight: nameLineHeight,
                                            letterSpacing: `${nameLetterSpacing}em`,
                                            color: nameColor,
                                            margin: 0,
                                            marginBottom: isMobile ? 12 : 24,
                                        }}
                                    >
                                        {currentMember.name}
                                    </motion.h2>

                                    {/* Divider */}
                                    <motion.div
                                        initial={isStatic ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
                                        animate={{ opacity: 1, scaleX: 1 }}
                                        transition={isStatic ? undefined : { delay: (textStagger * 3) / 1000, duration: transitionDuration / 1000 }}
                                        style={{
                                            width: isMobile ? 32 : 48,
                                            height: 2,
                                            backgroundColor: dividerColor,
                                            marginBottom: isMobile ? 12 : 24,
                                            transformOrigin: "left",
                                        }}
                                    />

                                    {/* Bio */}
                                    <motion.p
                                        initial={isStatic ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={isStatic ? undefined : { delay: (textStagger * 4) / 1000, duration: transitionDuration / 1000 }}
                                        style={{
                                            fontSize: isMobile ? Math.max(13, bioSize * 0.9) : bioSize,
                                            lineHeight: bioLineHeight,
                                            color: bioColor,
                                            margin: 0,
                                            marginBottom: isMobile ? 16 : 24,
                                        }}
                                    >
                                        {currentMember.bio}
                                    </motion.p>

                                    {/* Tags */}
                                    {showTags && tags.length > 0 && (
                                        <motion.div
                                            initial={isStatic ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={isStatic ? undefined : { delay: (textStagger * 5) / 1000, duration: transitionDuration / 1000 }}
                                            style={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: isMobile ? "6px" : "8px",
                                                marginBottom: isMobile ? 14 : 18,
                                            }}
                                        >
                                            {tags.map(renderTag)}
                                        </motion.div>
                                    )}

                                    {/* Arrows below content (in panel) */}
                                    {showArrows && arrowPosition === "bottom-panel" && renderArrows("in-panel")}

                                    {/* CTA */}
                                    <motion.a
                                        initial={isStatic ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={isStatic ? undefined : { delay: (textStagger * 6) / 1000, duration: transitionDuration / 1000 }}
                                        href={currentMember.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            color: accentColor,
                                            fontSize: isMobile ? 13 : 14,
                                            fontWeight: 600,
                                            textDecoration: "none",
                                            letterSpacing: "-0.01em",
                                        }}
                                    >
                                        {ctaText}
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </motion.a>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* Arrows below the component */}
            {showArrows && arrowPosition === "below-component" && renderArrows("below-component")}

            {/* Arrows bottom full width (inside component) */}
            {showArrows && arrowPosition === "bottom-full" && (
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 25 }}>
                    {renderArrows("below-component")}
                </div>
            )}
        </div>
    )
}

addPropertyControls(SplitScreenTeamCarousel, {
    // MEMBERS
    memberCount: {
        type: ControlType.Number,
        title: "Member Count",
        defaultValue: 5,
        min: 2,
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
                bio: {
                    type: ControlType.String,
                    title: "Bio",
                    displayTextArea: true,
                    defaultValue: "A brief description of this team member's expertise and background.",
                },
                tags: {
                    type: ControlType.String,
                    title: "Tags (comma separated)",
                    defaultValue: "Design, Strategy, Innovation",
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
        defaultValue: [],
    },
    defaultUrl: {
        type: ControlType.String,
        title: "Default URL",
        defaultValue: "https://framer.link/dulaj80",
    },
    ctaText: {
        type: ControlType.String,
        title: "CTA Text",
        defaultValue: "See Portfolio",
    },

    // SPLIT LAYOUT
    photoSide: {
        type: ControlType.Enum,
        title: "Photo Side",
        options: ["left", "right", "alternating"],
        optionTitles: ["Left", "Right", "Alternating"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    photoColumnWidth: {
        type: ControlType.Number,
        title: "Photo Column Width %",
        defaultValue: 50,
        min: 30,
        max: 70,
        step: 1,
        unit: "%",
    },
    componentHeight: {
        type: ControlType.Number,
        title: "Component Height",
        defaultValue: 600,
        min: 400,
        max: 1200,
        step: 50,
        unit: "px",
    },
    photoFit: {
        type: ControlType.Enum,
        title: "Photo Fit",
        options: ["cover", "contain", "top", "bottom", "custom"],
        optionTitles: ["Cover", "Contain", "Top", "Bottom", "Custom"],
        defaultValue: "cover",
    },
    photoVerticalPosition: {
        type: ControlType.Number,
        title: "Photo Vertical Position %",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 5,
        unit: "%",
        hidden: (props) => props.photoFit !== "custom",
    },

    // TEXT PANEL
    panelBackground: {
        type: ControlType.Color,
        title: "Panel Background",
        defaultValue: "#FFFFFF",
    },
    panelPaddingHorizontal: {
        type: ControlType.Number,
        title: "Panel Padding Horizontal",
        defaultValue: 64,
        min: 16,
        max: 120,
        step: 8,
        unit: "px",
    },
    panelPaddingVertical: {
        type: ControlType.Number,
        title: "Panel Padding Vertical",
        defaultValue: 48,
        min: 16,
        max: 120,
        step: 8,
        unit: "px",
    },
    textMaxWidth: {
        type: ControlType.Number,
        title: "Text Max Width",
        defaultValue: 440,
        min: 300,
        max: 800,
        step: 20,
        unit: "px",
    },
    verticalAlignment: {
        type: ControlType.Enum,
        title: "Vertical Alignment",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },

    // TYPOGRAPHY
    nameSize: {
        type: ControlType.Number,
        title: "Name Size",
        defaultValue: 48,
        min: 24,
        max: 80,
        step: 2,
        unit: "px",
    },
    nameWeight: {
        type: ControlType.Enum,
        title: "Name Weight",
        options: ["100", "300", "400", "700", "900"],
        optionTitles: ["Thin", "Light", "Regular", "Bold", "Black"],
        defaultValue: "700",
    },
    nameLineHeight: {
        type: ControlType.Number,
        title: "Name Line Height",
        defaultValue: 1.1,
        min: 0.8,
        max: 2,
        step: 0.1,
    },
    nameLetterSpacing: {
        type: ControlType.Number,
        title: "Name Letter Spacing",
        defaultValue: -0.02,
        min: -0.1,
        max: 0.2,
        step: 0.01,
        unit: "em",
    },
    roleSize: {
        type: ControlType.Number,
        title: "Role Size",
        defaultValue: 16,
        min: 10,
        max: 24,
        step: 1,
        unit: "px",
    },
    roleLetterSpacing: {
        type: ControlType.Number,
        title: "Role Letter Spacing",
        defaultValue: 0.08,
        min: 0,
        max: 0.3,
        step: 0.01,
        unit: "em",
    },
    roleUppercase: {
        type: ControlType.Boolean,
        title: "Role Uppercase",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    bioSize: {
        type: ControlType.Number,
        title: "Bio Size",
        defaultValue: 15,
        min: 12,
        max: 20,
        step: 1,
        unit: "px",
    },
    bioLineHeight: {
        type: ControlType.Number,
        title: "Bio Line Height",
        defaultValue: 1.7,
        min: 1.2,
        max: 2.5,
        step: 0.1,
    },

    // TAGS
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
        options: ["outline", "filled", "dot", "none"],
        optionTitles: ["Outline", "Filled", "Dot Prefix", "None"],
        defaultValue: "outline",
        hidden: (props) => !props.showTags,
    },
    tagColor: {
        type: ControlType.Color,
        title: "Tag Color",
        defaultValue: "#F0F0F0",
        hidden: (props) => !props.showTags,
    },
    tagTextColor: {
        type: ControlType.Color,
        title: "Tag Text Color",
        defaultValue: "#444444",
        hidden: (props) => !props.showTags,
    },
    tagSize: {
        type: ControlType.Number,
        title: "Tag Size",
        defaultValue: 12,
        min: 10,
        max: 16,
        step: 1,
        unit: "px",
        hidden: (props) => !props.showTags,
    },

    // NAVIGATION
    showArrows: {
        type: ControlType.Boolean,
        title: "Show Arrows",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    arrowPosition: {
        type: ControlType.Enum,
        title: "Arrow Position",
        options: ["center", "bottom-panel", "bottom-full", "below-component"],
        optionTitles: ["Center Overlap", "Below Content", "Bottom Full Width", "Below Component"],
        defaultValue: "below-component",
        hidden: (props) => !props.showArrows,
    },
    arrowStyle: {
        type: ControlType.Enum,
        title: "Arrow Style",
        options: ["long", "short", "chevron", "circle"],
        optionTitles: ["Long Arrow", "Short Arrow", "Chevron", "Circle"],
        defaultValue: "long",
        hidden: (props) => !props.showArrows,
    },
    arrowSize: {
        type: ControlType.Enum,
        title: "Arrow Size",
        options: ["sm", "md", "lg"],
        optionTitles: ["Small", "Medium", "Large"],
        defaultValue: "md",
        hidden: (props) => !props.showArrows,
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#0A0A0A",
        hidden: (props) => !props.showArrows,
    },
    arrowBackground: {
        type: ControlType.Color,
        title: "Arrow Background",
        defaultValue: "rgba(255, 255, 255, 0)",
        hidden: (props) => !props.showArrows,
    },
    arrowGap: {
        type: ControlType.Number,
        title: "Arrow Gap",
        defaultValue: 14,
        min: 0,
        max: 48,
        step: 2,
        unit: "px",
        hidden: (props) => !props.showArrows,
    },
    arrowAlign: {
        type: ControlType.Enum,
        title: "Arrow Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
        hidden: (props) => !props.showArrows,
    },
    showProgressBar: {
        type: ControlType.Boolean,
        title: "Show Progress Bar",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    progressBarPosition: {
        type: ControlType.Enum,
        title: "Progress Bar Position",
        options: ["bottom", "top"],
        optionTitles: ["Bottom", "Top"],
        defaultValue: "bottom",
        displaySegmentedControl: true,
        hidden: (props) => !props.showProgressBar,
    },
    progressColor: {
        type: ControlType.Color,
        title: "Progress Color",
        defaultValue: "#0A0A0A",
        hidden: (props) => !props.showProgressBar,
    },

    // COLORS
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    nameColor: {
        type: ControlType.Color,
        title: "Name Color",
        defaultValue: "#0A0A0A",
    },
    roleColor: {
        type: ControlType.Color,
        title: "Role Color",
        defaultValue: "#888888",
    },
    bioColor: {
        type: ControlType.Color,
        title: "Bio Color",
        defaultValue: "#444444",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#0A0A0A",
    },
    dividerColor: {
        type: ControlType.Color,
        title: "Divider Color",
        defaultValue: "#EEEEEE",
    },

    // ANIMATION
    photoTransition: {
        type: ControlType.Enum,
        title: "Photo Transition",
        options: ["slide", "clip", "fade", "zoom"],
        optionTitles: ["Slide", "Clip Reveal", "Fade", "Zoom Out"],
        defaultValue: "slide",
    },
    textTransition: {
        type: ControlType.Enum,
        title: "Text Transition",
        options: ["fadeUp", "fade", "slideIn"],
        optionTitles: ["Fade Up", "Fade", "Slide In"],
        defaultValue: "fadeUp",
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Transition Duration",
        defaultValue: 700,
        min: 200,
        max: 2000,
        step: 50,
        unit: "ms",
    },
    textStagger: {
        type: ControlType.Number,
        title: "Text Stagger",
        defaultValue: 60,
        min: 0,
        max: 200,
        step: 10,
        unit: "ms",
    },
    directionAware: {
        type: ControlType.Boolean,
        title: "Direction Aware",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
})