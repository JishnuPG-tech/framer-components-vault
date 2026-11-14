// Newspaper Team Carousel - Editorial broadsheet aesthetic with expandable member bios
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
import { useState, useMemo, startTransition, useEffect } from "react"

interface Member {
    name: string
    title: string
    sectionLabel: string
    bio: string
    quote: string
    photo: { src: string; alt: string }
    url: string
}

interface NewspaperTeamCarouselProps {
    memberCount: number
    members: Member[]
    defaultUrl: string
    ctaLabel: string
    columns: number
    columnGap: number
    ruleColor: string
    ruleWidth: number
    maxWidth: number
    sectionLabelStyle: "uppercase" | "italic" | "smallCaps"
    featuredSpansColumns: number
    featurePosition: "first" | "last" | "middle"
    showLargeHeadshot: boolean
    featurePhotoRatio: "portrait" | "square" | "landscape"
    largeHeadshotShape: "square" | "circle" | "rounded" | "rectangle" | "oval"
    largeHeadshotHeight: number
    headerFont: "serif" | "slabSerif" | "sans"
    nameSize: number
    nameWeight: "bold" | "black" | "regular"
    titleSize: number
    titleUppercase: boolean
    titleTracking: number
    bioSize: number
    bioLineHeight: number
    dropCap: boolean
    quoteSize: number
    quoteStyle: "blockquote" | "inline" | "boxed"
    headshotStyle: "circle" | "rectangle" | "oval" | "silhouette"
    headshotSize: number
    headshotFilter: "none" | "sepia" | "grayscale" | "halftone"
    headshotBorder: boolean
    headshotBorderWidth: number
    navStyle: "pageNumbers" | "issueDate" | "memberNames"
    navPosition: "topRight" | "bottomCenter"
    previousLabel: string
    nextLabel: string
    background: string
    textColor: string
    accentColor: string
    quoteAccentColor: string
    columnEnterAnimation: "fade" | "wipeDown" | "none"
    duration: number
    stagger: number
    style?: any
}

/**
 * Newspaper Team Carousel
 * 
 * Editorial broadsheet-style team carousel with dense columns, hairline rules,
 * and expandable member bios in article format.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function NewspaperTeamCarousel(props: NewspaperTeamCarouselProps) {
    const isStatic = useIsStaticRenderer()
    const shouldAnimate = !isStatic

    const {
        memberCount = 5,
        members = [],
        defaultUrl = "https://framer.link/dulaj80",
        ctaLabel = "Read Full Story",
        columns = 3,
        columnGap = 32,
        ruleColor = "#DDDDDD",
        ruleWidth = 1,
        maxWidth = 1100,
        sectionLabelStyle = "uppercase",
        featuredSpansColumns = 1,
        featurePosition = "first",
        showLargeHeadshot = true,
        featurePhotoRatio = "portrait",
        largeHeadshotShape = "rounded",
        largeHeadshotHeight = 220,
        headerFont = "serif",
        nameSize = 28,
        nameWeight = "bold",
        titleSize = 14,
        titleUppercase = true,
        titleTracking = 0.1,
        bioSize = 14,
        bioLineHeight = 1.85,
        dropCap = true,
        quoteSize = 18,
        quoteStyle = "blockquote",
        headshotStyle = "circle",
        headshotSize = 80,
        headshotFilter = "none",
        headshotBorder = true,
        headshotBorderWidth = 1,
        navStyle = "pageNumbers",
        navPosition = "topRight",
        previousLabel = "← Previous",
        nextLabel = "Next →",
        background = "#FFFEF5",
        textColor = "#1A1A1A",
        accentColor = "#B22222",
        quoteAccentColor = "#B22222",
        columnEnterAnimation = "fade",
        duration = 500,
        stagger = 80,
        style,
    } = props

    const [currentIndex, setCurrentIndex] = useState(0)
    const [expandedMember, setExpandedMember] = useState<number | null>(null)
    const [isMobile, setIsMobile] = useState(false)
    const [isTablet, setIsTablet] = useState(false)

    // Detect viewport size for responsive behavior
    useEffect(() => {
        if (typeof window === "undefined") return

        const checkViewport = () => {
            const width = window.innerWidth
            startTransition(() => {
                setIsMobile(width < 768)
                setIsTablet(width >= 768 && width < 1024)
            })
        }

        checkViewport()
        window.addEventListener("resize", checkViewport)
        return () => window.removeEventListener("resize", checkViewport)
    }, [])

    // Determine if component is using fill/fixed/relative width
    const isFixedWidth = style?.width === "100%"
    const hasViewportHeight = style?.height === "100vh" || (typeof style?.height === "string" && style.height.includes("vh"))

    // Generate default members
    const defaultMembers: Member[] = useMemo(() => {
        const defaults = [
            {
                name: "Margaret Ashford",
                title: "Editor-in-Chief",
                sectionLabel: "Editorial",
                bio: "With over two decades of experience in investigative journalism, Margaret has led our editorial team through numerous award-winning campaigns. Her commitment to truth and rigorous fact-checking has established our publication as a trusted voice in modern media. She began her career covering local politics before rising through the ranks to become one of the most respected editors in the industry.",
                quote: "Journalism is not just about reporting facts—it's about uncovering truth and holding power accountable.",
                photo: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Margaret Ashford",
                },
                url: defaultUrl,
            },
            {
                name: "James Chen",
                title: "Senior Correspondent",
                sectionLabel: "International",
                bio: "James has reported from over forty countries, bringing critical international stories to our readers. His work on global economic policy and international relations has earned him multiple journalism awards. Based in our London bureau, he maintains an extensive network of sources across government and industry sectors worldwide.",
                quote: "Every story connects us to a larger human experience beyond borders.",
                photo: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "James Chen",
                },
                url: defaultUrl,
            },
            {
                name: "Dr. Sarah Williams",
                title: "Legal Affairs Editor",
                sectionLabel: "Law & Policy",
                bio: "A former practicing attorney, Sarah brings unparalleled expertise to our legal coverage. She specializes in constitutional law and Supreme Court analysis, making complex legal matters accessible to our readership. Her weekly column on legal developments has become essential reading for legal professionals and engaged citizens alike.",
                quote: "The law shapes society, and society shapes the law—understanding this dialogue is crucial.",
                photo: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Dr. Sarah Williams",
                },
                url: defaultUrl,
            },
            {
                name: "Robert Martinez",
                title: "Business Editor",
                sectionLabel: "Commerce",
                bio: "Robert oversees our business and finance coverage with a keen eye for emerging market trends. His analysis of corporate governance and economic policy has influenced business leaders and policymakers. Before joining our team, he spent fifteen years as a financial analyst, bringing insider perspective to his reporting.",
                quote: "Markets tell stories—our job is to read between the lines and report what matters.",
                photo: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Robert Martinez",
                },
                url: defaultUrl,
            },
            {
                name: "Elena Kowalski",
                title: "Culture Critic",
                sectionLabel: "Arts & Letters",
                bio: "Elena's incisive cultural commentary has redefined arts criticism for the digital age. She covers literature, theater, and visual arts with equal expertise, bringing historical context and contemporary relevance to every review. Her essays on the intersection of art and society have been widely anthologized.",
                quote: "Art doesn't exist in a vacuum—it reflects and shapes the world we inhabit.",
                photo: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Elena Kowalski",
                },
                url: defaultUrl,
            },
            {
                name: "Thomas Bradford",
                title: "Investigative Reporter",
                sectionLabel: "Investigations",
                bio: "Thomas leads our investigative unit, uncovering stories that demand public attention. His dogged pursuit of truth has exposed corruption at the highest levels and sparked meaningful reform. A Pulitzer Prize finalist, his work exemplifies the vital role of investigative journalism in democracy.",
                quote: "The stories that matter most are often the ones people don't want told.",
                photo: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Thomas Bradford",
                },
                url: defaultUrl,
            },
            {
                name: "Aisha Patel",
                title: "Technology Editor",
                sectionLabel: "Innovation",
                bio: "Aisha covers the rapidly evolving technology sector with expertise in artificial intelligence, cybersecurity, and digital privacy. Her reporting bridges the gap between technical complexity and public understanding, making her essential reading for anyone navigating our digital future.",
                quote: "Technology is reshaping humanity—we must understand it to shape our future wisely.",
                photo: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Aisha Patel",
                },
                url: defaultUrl,
            },
            {
                name: "David O'Connor",
                title: "Opinion Columnist",
                sectionLabel: "Commentary",
                bio: "David's twice-weekly column offers sharp political analysis and cultural commentary. His ability to articulate complex arguments with clarity and wit has earned him a devoted readership across the political spectrum. He previously served as a speechwriter and policy advisor before turning to journalism.",
                quote: "Opinion without fact is noise; fact without opinion is incomplete—we need both.",
                photo: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "David O'Connor",
                },
                url: defaultUrl,
            },
        ]
        return defaults.slice(0, memberCount)
    }, [memberCount, defaultUrl])

    const activeMembers = members.length > 0 ? members.slice(0, memberCount) : defaultMembers

    const fontFamily = useMemo(() => {
        switch (headerFont) {
            case "serif":
                return "Georgia, 'Times New Roman', serif"
            case "slabSerif":
                return "'Courier New', Courier, monospace"
            case "sans":
                return "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            default:
                return "Georgia, 'Times New Roman', serif"
        }
    }, [headerFont])

    const sectionLabelCSS = useMemo(() => {
        switch (sectionLabelStyle) {
            case "uppercase":
                return { textTransform: "uppercase" as const, fontStyle: "normal" }
            case "italic":
                return { textTransform: "none" as const, fontStyle: "italic" as const }
            case "smallCaps":
                return { fontVariant: "small-caps" as const, fontStyle: "normal" }
            default:
                return { textTransform: "uppercase" as const, fontStyle: "normal" }
        }
    }, [sectionLabelStyle])

    const headshotBorderRadius = useMemo(() => {
        switch (headshotStyle) {
            case "circle":
                return "50%"
            case "oval":
                return "50%"
            case "rectangle":
                return "0"
            case "silhouette":
                return "0"
            default:
                return "50%"
        }
    }, [headshotStyle])

    const largeHeadshotBorderRadius = useMemo(() => {
        switch (largeHeadshotShape) {
            case "square":
                return "0"
            case "rectangle":
                return "0"
            case "circle":
                return "50%"
            case "oval":
                return "999px"
            case "rounded":
            default:
                return "14px"
        }
    }, [largeHeadshotShape])

    const filterCSS = useMemo(() => {
        switch (headshotFilter) {
            case "sepia":
                return "sepia(100%)"
            case "grayscale":
                return "grayscale(100%)"
            case "halftone":
                return "contrast(150%) grayscale(100%)"
            default:
                return "none"
        }
    }, [headshotFilter])

    const photoAspectRatio = useMemo(() => {
        switch (featurePhotoRatio) {
            case "portrait":
                return "3 / 4"
            case "square":
                return "1 / 1"
            case "landscape":
                return "4 / 3"
            default:
                return "3 / 4"
        }
    }, [featurePhotoRatio])

    // Responsive column count
    const responsiveColumns = useMemo(() => {
        if (isMobile) return 1
        if (isTablet) return Math.min(2, columns)
        return columns
    }, [isMobile, isTablet, columns])

    // Responsive gap
    const responsiveGap = useMemo(() => {
        if (isMobile) return Math.min(16, columnGap)
        if (isTablet) return Math.min(24, columnGap)
        return columnGap
    }, [isMobile, isTablet, columnGap])

    // Responsive padding
    const responsivePadding = useMemo(() => {
        if (isMobile) return "24px 16px"
        if (isTablet) return "32px 20px"
        return "48px 24px"
    }, [isMobile, isTablet])

    // Responsive name size
    const responsiveNameSize = useMemo(() => {
        if (isMobile) return Math.min(22, nameSize)
        if (isTablet) return Math.min(24, nameSize)
        return nameSize
    }, [isMobile, isTablet, nameSize])

    // Responsive headshot size
    const responsiveHeadshotSize = useMemo(() => {
        if (isMobile) return Math.min(60, headshotSize)
        if (isTablet) return Math.min(70, headshotSize)
        return headshotSize
    }, [isMobile, isTablet, headshotSize])

    // Responsive large headshot height
    const responsiveLargeHeadshotHeight = useMemo(() => {
        if (isMobile) return Math.min(180, largeHeadshotHeight)
        if (isTablet) return Math.min(220, largeHeadshotHeight)
        return largeHeadshotHeight
    }, [isMobile, isTablet, largeHeadshotHeight])

    const handlePrevious = () => {
        startTransition(() => {
            setCurrentIndex((prev) => (prev === 0 ? activeMembers.length - 1 : prev - 1))
            setExpandedMember(null)
        })
    }

    const handleNext = () => {
        startTransition(() => {
            setCurrentIndex((prev) => (prev === activeMembers.length - 1 ? 0 : prev + 1))
            setExpandedMember(null)
        })
    }

    const toggleExpanded = (index: number) => {
        startTransition(() => {
            setExpandedMember(expandedMember === index ? null : index)
        })
    }

    const getAnimationVariants = () => {
        switch (columnEnterAnimation) {
            case "fade":
                return {
                    hidden: { opacity: 0 },
                    visible: { opacity: 1 },
                }
            case "wipeDown":
                return {
                    hidden: { opacity: 0, y: -20 },
                    visible: { opacity: 1, y: 0 },
                }
            default:
                return {
                    hidden: { opacity: 1 },
                    visible: { opacity: 1 },
                }
        }
    }

    const variants = getAnimationVariants()

    const renderNavigation = () => {
        const navContent = (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: isMobile ? 12 : 24,
                    fontFamily,
                    fontSize: isMobile ? 11 : 13,
                    color: textColor,
                    letterSpacing: "0.05em",
                    flexWrap: "wrap",
                    justifyContent: "center",
                }}
            >
                <button
                    onClick={handlePrevious}
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: textColor,
                        fontFamily,
                        fontSize: isMobile ? 11 : 13,
                        letterSpacing: "0.05em",
                        padding: isMobile ? "8px 12px" : "4px 8px",
                        minHeight: isMobile ? 44 : "auto",
                        touchAction: "manipulation",
                    }}
                    aria-label="Previous member"
                >
                    {isMobile ? "←" : previousLabel}
                </button>
                <div style={{ borderLeft: `${ruleWidth}px solid ${ruleColor}`, height: 16 }} />
                {navStyle === "pageNumbers" && (
                    <span>
                        {currentIndex + 1} / {activeMembers.length}
                    </span>
                )}
                {navStyle === "issueDate" && !isMobile && (
                    <span>{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                )}
                {navStyle === "issueDate" && isMobile && (
                    <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                )}
                {navStyle === "memberNames" && <span style={{ textAlign: "center" }}>{activeMembers[currentIndex]?.name}</span>}
                <div style={{ borderLeft: `${ruleWidth}px solid ${ruleColor}`, height: 16 }} />
                <button
                    onClick={handleNext}
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: textColor,
                        fontFamily,
                        fontSize: isMobile ? 11 : 13,
                        letterSpacing: "0.05em",
                        padding: isMobile ? "8px 12px" : "4px 8px",
                        minHeight: isMobile ? 44 : "auto",
                        touchAction: "manipulation",
                    }}
                    aria-label="Next member"
                >
                    {isMobile ? "→" : nextLabel}
                </button>
            </div>
        )

        return navContent
    }

    const renderMemberColumn = (member: Member, index: number, isFeatured: boolean) => {
        const isExpanded = expandedMember === index
        const nameWeightValue = nameWeight === "black" ? 900 : nameWeight === "bold" ? 700 : 400

        const renderBio = (text: string) => {
            if (!dropCap || !text || isMobile) return text

            const firstChar = text.charAt(0)
            const restOfText = text.slice(1)

            return (
                <>
                    <span
                        style={{
                            float: "left",
                            fontSize: bioSize * 3.5,
                            lineHeight: 1,
                            fontWeight: 700,
                            marginRight: 8,
                            marginTop: 4,
                            color: accentColor,
                        }}
                    >
                        {firstChar}
                    </span>
                    {restOfText}
                </>
            )
        }

        const shouldShowLargeHeadshot = (isFeatured && showLargeHeadshot) || isMobile

        return (
            <motion.div
                key={`${currentIndex}-${index}`}
                variants={shouldAnimate ? variants : undefined}
                initial={shouldAnimate ? "hidden" : false}
                animate={shouldAnimate ? "visible" : false}
                transition={
                    shouldAnimate
                        ? {
                              duration: duration / 1000,
                              delay: (index * stagger) / 1000,
                          }
                        : undefined
                }
                style={{
                    gridColumn: isMobile ? "span 1" : isFeatured ? `span ${featuredSpansColumns}` : "span 1",
                    display: "flex",
                    flexDirection: "column",
                    gap: isMobile ? 12 : 16,
                    cursor: "pointer",
                    touchAction: "manipulation",
                }}
                onClick={() => toggleExpanded(index)}
            >
                {/* Section Label */}
                <div
                    style={{
                        fontSize: isMobile ? 10 : 11,
                        letterSpacing: "0.15em",
                        color: accentColor,
                        fontWeight: 600,
                        borderBottom: `${ruleWidth}px solid ${ruleColor}`,
                        paddingBottom: isMobile ? 6 : 8,
                        ...sectionLabelCSS,
                    }}
                >
                    {member.sectionLabel}
                </div>

                {/* Headshot */}
                {shouldShowLargeHeadshot || !isFeatured ? (
                    <div
                        style={{
                            width: shouldShowLargeHeadshot ? "100%" : responsiveHeadshotSize,
                            height: shouldShowLargeHeadshot ? "auto" : responsiveHeadshotSize,
                            maxHeight: shouldShowLargeHeadshot ? responsiveLargeHeadshotHeight : undefined,
                            aspectRatio: shouldShowLargeHeadshot ? photoAspectRatio : "1 / 1",
                            overflow: "hidden",
                            borderRadius: shouldShowLargeHeadshot ? largeHeadshotBorderRadius : headshotBorderRadius,
                            border: headshotBorder ? `${headshotBorderWidth}px solid ${ruleColor}` : "none",
                            alignSelf: shouldShowLargeHeadshot ? "stretch" : "flex-start",
                        }}
                    >
                        <img
                            src={member.photo.src}
                            alt={member.photo.alt}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                filter: filterCSS,
                            }}
                        />
                    </div>
                ) : null}

                {/* Name */}
                <h3
                    style={{
                        fontFamily,
                        fontSize: isFeatured && !isMobile ? responsiveNameSize * 1.2 : responsiveNameSize,
                        fontWeight: nameWeightValue,
                        margin: 0,
                        lineHeight: 1.1,
                        color: textColor,
                    }}
                >
                    {member.name}
                </h3>

                {/* Title */}
                <div
                    style={{
                        fontSize: isMobile ? Math.min(12, titleSize) : titleSize,
                        textTransform: titleUppercase ? "uppercase" : "none",
                        letterSpacing: `${titleTracking}em`,
                        color: textColor,
                        opacity: 0.7,
                        fontWeight: 500,
                    }}
                >
                    {member.title}
                </div>

                {/* Bio - shown when expanded or featured */}
                {shouldAnimate ? (
                    <AnimatePresence>
                        {(isExpanded || (isFeatured && !isMobile) || isMobile) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                style={{
                                    overflow: "hidden",
                                }}
                            >
                                <p
                                    style={{
                                        fontFamily: "Georgia, serif",
                                        fontSize: isMobile ? Math.min(13, bioSize) : bioSize,
                                        lineHeight: bioLineHeight,
                                        color: textColor,
                                        margin: 0,
                                        marginBottom: isMobile ? 12 : 16,
                                        textAlign: isMobile ? "left" : "justify",
                                    }}
                                >
                                    {renderBio(member.bio)}
                                </p>

                                {/* Quote */}
                                {member.quote && (
                                    <div
                                        style={{
                                            fontSize: isMobile ? Math.min(16, quoteSize) : quoteSize,
                                            fontStyle: quoteStyle === "inline" ? "italic" : "normal",
                                            color: quoteAccentColor,
                                            marginTop: isMobile ? 12 : 16,
                                            marginBottom: isMobile ? 12 : 16,
                                            paddingLeft: quoteStyle === "blockquote" ? (isMobile ? 12 : 20) : 0,
                                            borderLeft:
                                                quoteStyle === "blockquote"
                                                    ? `${isMobile ? 2 : 3}px solid ${quoteAccentColor}`
                                                    : "none",
                                            padding:
                                                quoteStyle === "boxed"
                                                    ? isMobile
                                                        ? 12
                                                        : 16
                                                    : quoteStyle === "blockquote"
                                                      ? `0 0 0 ${isMobile ? 12 : 20}px`
                                                      : 0,
                                            border: quoteStyle === "boxed" ? `1px solid ${ruleColor}` : "none",
                                            fontFamily: quoteStyle === "inline" ? "Georgia, serif" : fontFamily,
                                        }}
                                    >
                                        "{member.quote}"
                                    </div>
                                )}

                                {/* CTA */}
                                <a
                                    href={member.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: "inline-block",
                                        fontSize: isMobile ? 12 : 13,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.1em",
                                        color: accentColor,
                                        textDecoration: "none",
                                        borderBottom: `1px solid ${accentColor}`,
                                        paddingBottom: 2,
                                        fontWeight: 600,
                                        minHeight: isMobile ? 44 : "auto",
                                        alignItems: "center",
                                        touchAction: "manipulation",
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {ctaLabel}
                                </a>
                            </motion.div>
                        )}
                    </AnimatePresence>
                ) : (
                    (isExpanded || (isFeatured && !isMobile) || isMobile) && (
                        <div
                            style={{
                                overflow: "hidden",
                            }}
                        >
                            <p
                                style={{
                                    fontFamily: "Georgia, serif",
                                    fontSize: isMobile ? Math.min(13, bioSize) : bioSize,
                                    lineHeight: bioLineHeight,
                                    color: textColor,
                                    margin: 0,
                                    marginBottom: isMobile ? 12 : 16,
                                    textAlign: isMobile ? "left" : "justify",
                                }}
                            >
                                {renderBio(member.bio)}
                            </p>

                            {/* Quote */}
                            {member.quote && (
                                <div
                                    style={{
                                        fontSize: isMobile ? Math.min(16, quoteSize) : quoteSize,
                                        fontStyle: quoteStyle === "inline" ? "italic" : "normal",
                                        color: quoteAccentColor,
                                        marginTop: isMobile ? 12 : 16,
                                        marginBottom: isMobile ? 12 : 16,
                                        paddingLeft: quoteStyle === "blockquote" ? (isMobile ? 12 : 20) : 0,
                                        borderLeft:
                                            quoteStyle === "blockquote"
                                                ? `${isMobile ? 2 : 3}px solid ${quoteAccentColor}`
                                                : "none",
                                        padding:
                                            quoteStyle === "boxed"
                                                ? isMobile
                                                    ? 12
                                                    : 16
                                                : quoteStyle === "blockquote"
                                                  ? `0 0 0 ${isMobile ? 12 : 20}px`
                                                  : 0,
                                        border: quoteStyle === "boxed" ? `1px solid ${ruleColor}` : "none",
                                        fontFamily: quoteStyle === "inline" ? "Georgia, serif" : fontFamily,
                                    }}
                                >
                                    "{member.quote}"
                                </div>
                            )}

                            {/* CTA */}
                            <a
                                href={member.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: "inline-block",
                                    fontSize: isMobile ? 12 : 13,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                    color: accentColor,
                                    textDecoration: "none",
                                    borderBottom: `1px solid ${accentColor}`,
                                    paddingBottom: 2,
                                    fontWeight: 600,
                                    minHeight: isMobile ? 44 : "auto",
                                    alignItems: "center",
                                    touchAction: "manipulation",
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {ctaLabel}
                            </a>
                        </div>
                    )
                )}
            </motion.div>
        )
    }

    const renderColumns = () => {
        const featuredIndex =
            featurePosition === "first" ? 0 : featurePosition === "last" ? responsiveColumns - 1 : Math.floor(responsiveColumns / 2)

        const membersToShow = isMobile 
            ? [activeMembers[currentIndex]]
            : activeMembers.slice(currentIndex, currentIndex + responsiveColumns)
        
        if (!isMobile) {
            while (membersToShow.length < responsiveColumns) {
                membersToShow.push(...activeMembers.slice(0, responsiveColumns - membersToShow.length))
            }
        }

        return membersToShow.map((member, index) => renderMemberColumn(member, currentIndex + index, !isMobile && index === featuredIndex))
    }

    return (
        <div
            style={{
                width: "100%",
                minHeight: hasViewportHeight ? "100vh" : 400,
                height: hasViewportHeight ? "100vh" : "auto",
                backgroundColor: background,
                padding: responsivePadding,
                fontFamily,
                color: textColor,
                overflow: hasViewportHeight ? "auto" : "visible",
                position: "relative",
                ...(isFixedWidth ? {} : { maxWidth: isMobile ? "100%" : maxWidth, margin: "0 auto" }),
            }}
        >
            <div
                style={{
                    maxWidth: isFixedWidth ? "100%" : maxWidth,
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: isMobile ? 20 : isTablet ? 24 : 32,
                    width: "100%",
                }}
            >
                {/* Top Navigation */}
                {navPosition === "topRight" && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: isMobile ? "center" : "flex-end",
                            paddingBottom: isMobile ? 12 : 16,
                            borderBottom: `${ruleWidth}px solid ${ruleColor}`,
                        }}
                    >
                        {renderNavigation()}
                    </div>
                )}

                {/* Masthead */}
                <div
                    style={{
                        textAlign: "center",
                        borderTop: `${ruleWidth * 2}px solid ${textColor}`,
                        borderBottom: `${ruleWidth * 2}px solid ${textColor}`,
                        padding: isMobile ? "12px 0" : "16px 0",
                    }}
                >
                    <h1
                        style={{
                            fontFamily,
                            fontSize: isMobile ? 28 : isTablet ? 36 : 48,
                            fontWeight: 900,
                            margin: 0,
                            letterSpacing: "0.02em",
                            color: textColor,
                        }}
                    >
                        EDITORIAL STAFF
                    </h1>
                    <div
                        style={{
                            fontSize: isMobile ? 9 : 11,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            marginTop: isMobile ? 6 : 8,
                            opacity: 0.6,
                        }}
                    >
                        {isMobile 
                            ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                            : new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
                        }
                    </div>
                </div>

                {/* Columns Grid */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${responsiveColumns}, 1fr)`,
                        gap: responsiveGap,
                        borderTop: `${ruleWidth}px solid ${ruleColor}`,
                        paddingTop: isMobile ? 20 : 32,
                    }}
                >
                    {renderColumns()}
                </div>

                {/* Bottom Navigation */}
                {navPosition === "bottomCenter" && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            paddingTop: isMobile ? 20 : 32,
                            borderTop: `${ruleWidth}px solid ${ruleColor}`,
                        }}
                    >
                        {renderNavigation()}
                    </div>
                )}
            </div>
        </div>
    )
}

addPropertyControls(NewspaperTeamCarousel, {
    // MEMBERS
    memberCount: {
        type: ControlType.Number,
        title: "Member Count",
        defaultValue: 5,
        min: 3,
        max: 8,
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
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Position",
                },
                sectionLabel: {
                    type: ControlType.String,
                    title: "Section",
                    defaultValue: "Department",
                },
                bio: {
                    type: ControlType.String,
                    title: "Bio",
                    displayTextArea: true,
                    defaultValue: "Biography text goes here...",
                },
                quote: {
                    type: ControlType.String,
                    title: "Quote",
                    displayTextArea: true,
                    defaultValue: "A memorable quote...",
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
        maxCount: 8,
    },
    defaultUrl: {
        type: ControlType.String,
        title: "Default URL",
        defaultValue: "https://framer.link/dulaj80",
    },
    ctaLabel: {
        type: ControlType.String,
        title: "CTA Label",
        defaultValue: "Read Full Story",
    },

    // LAYOUT
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 3,
        min: 2,
        max: 4,
        step: 1,
        displayStepper: true,
    },
    columnGap: {
        type: ControlType.Number,
        title: "Column Gap",
        defaultValue: 32,
        min: 16,
        max: 64,
        step: 4,
    },
    ruleWidth: {
        type: ControlType.Number,
        title: "Rule Width",
        defaultValue: 1,
        min: 1,
        max: 4,
        step: 1,
    },
    maxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        defaultValue: 1100,
        min: 800,
        max: 1600,
        step: 50,
    },
    sectionLabelStyle: {
        type: ControlType.Enum,
        title: "Section Label Style",
        options: ["uppercase", "italic", "smallCaps"],
        optionTitles: ["Uppercase", "Italic", "Small Caps"],
        defaultValue: "uppercase",
    },

    // FEATURED MEMBER COLUMN
    featuredSpansColumns: {
        type: ControlType.Number,
        title: "Featured Spans",
        defaultValue: 1,
        min: 1,
        max: 2,
        step: 1,
        displayStepper: true,
    },
    featurePosition: {
        type: ControlType.Enum,
        title: "Feature Position",
        options: ["first", "last", "middle"],
        optionTitles: ["First", "Last", "Middle"],
        defaultValue: "first",
        displaySegmentedControl: true,
    },
    showLargeHeadshot: {
        type: ControlType.Boolean,
        title: "Large Headshot",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    featurePhotoRatio: {
        type: ControlType.Enum,
        title: "Photo Ratio",
        options: ["portrait", "square", "landscape"],
        optionTitles: ["Portrait 3:4", "Square", "Landscape"],
        defaultValue: "portrait",
    },
    largeHeadshotShape: {
        type: ControlType.Enum,
        title: "Large Photo Shape",
        options: ["rounded", "square", "circle", "oval", "rectangle"],
        optionTitles: ["Rounded", "Square", "Circle", "Oval", "Rectangle"],
        defaultValue: "rounded",
        hidden: ({ showLargeHeadshot }) => !showLargeHeadshot,
    },
    largeHeadshotHeight: {
        type: ControlType.Number,
        title: "Large Headshot Height",
        defaultValue: 220,
        min: 120,
        max: 480,
        step: 10,
        unit: "px",
        hidden: ({ showLargeHeadshot }) => !showLargeHeadshot,
    },

    // TYPOGRAPHY
    headerFont: {
        type: ControlType.Enum,
        title: "Header Font",
        options: ["serif", "slabSerif", "sans"],
        optionTitles: ["Serif", "Slab Serif", "Sans"],
        defaultValue: "serif",
    },
    nameSize: {
        type: ControlType.Number,
        title: "Name Size",
        defaultValue: 28,
        min: 18,
        max: 48,
        step: 2,
    },
    nameWeight: {
        type: ControlType.Enum,
        title: "Name Weight",
        options: ["bold", "black", "regular"],
        optionTitles: ["Bold", "Black", "Regular"],
        defaultValue: "bold",
        displaySegmentedControl: true,
    },
    titleSize: {
        type: ControlType.Number,
        title: "Title Size",
        defaultValue: 14,
        min: 10,
        max: 20,
        step: 1,
    },
    titleUppercase: {
        type: ControlType.Boolean,
        title: "Title Uppercase",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    titleTracking: {
        type: ControlType.Number,
        title: "Title Tracking",
        defaultValue: 0.1,
        min: 0,
        max: 0.3,
        step: 0.01,
        unit: "em",
    },
    bioSize: {
        type: ControlType.Number,
        title: "Bio Size",
        defaultValue: 14,
        min: 12,
        max: 18,
        step: 1,
    },
    bioLineHeight: {
        type: ControlType.Number,
        title: "Bio Line Height",
        defaultValue: 1.85,
        min: 1.2,
        max: 2.5,
        step: 0.05,
    },
    dropCap: {
        type: ControlType.Boolean,
        title: "Drop Cap",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    quoteSize: {
        type: ControlType.Number,
        title: "Quote Size",
        defaultValue: 18,
        min: 14,
        max: 24,
        step: 1,
    },
    quoteStyle: {
        type: ControlType.Enum,
        title: "Quote Style",
        options: ["blockquote", "inline", "boxed"],
        optionTitles: ["Blockquote Pull", "Inline Italic", "Boxed"],
        defaultValue: "blockquote",
    },

    // HEADSHOT
    headshotStyle: {
        type: ControlType.Enum,
        title: "Headshot Style",
        options: ["circle", "rectangle", "oval", "silhouette"],
        optionTitles: ["Circle Cutout", "Rectangle", "Oval", "Silhouette"],
        defaultValue: "circle",
    },
    headshotSize: {
        type: ControlType.Number,
        title: "Headshot Size",
        defaultValue: 80,
        min: 60,
        max: 150,
        step: 10,
    },
    headshotFilter: {
        type: ControlType.Enum,
        title: "Headshot Filter",
        options: ["none", "sepia", "grayscale", "halftone"],
        optionTitles: ["None", "Sepia", "Grayscale", "Halftone"],
        defaultValue: "none",
    },
    headshotBorder: {
        type: ControlType.Boolean,
        title: "Headshot Border",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    headshotBorderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 1,
        min: 1,
        max: 5,
        step: 1,
    },

    // NAVIGATION
    navStyle: {
        type: ControlType.Enum,
        title: "Nav Style",
        options: ["pageNumbers", "issueDate", "memberNames"],
        optionTitles: ["Page Numbers", "Issue Date", "Member Names"],
        defaultValue: "pageNumbers",
    },
    navPosition: {
        type: ControlType.Enum,
        title: "Nav Position",
        options: ["topRight", "bottomCenter"],
        optionTitles: ["Top Right", "Bottom Center"],
        defaultValue: "topRight",
        displaySegmentedControl: true,
    },
    previousLabel: {
        type: ControlType.String,
        title: "Previous Label",
        defaultValue: "← Previous",
    },
    nextLabel: {
        type: ControlType.String,
        title: "Next Label",
        defaultValue: "Next →",
    },

    // COLORS
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFEF5",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#1A1A1A",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#B22222",
    },
    ruleColor: {
        type: ControlType.Color,
        title: "Rule Color",
        defaultValue: "#CCCCCC",
    },
    quoteAccentColor: {
        type: ControlType.Color,
        title: "Quote Accent",
        defaultValue: "#B22222",
    },

    // ANIMATION
    columnEnterAnimation: {
        type: ControlType.Enum,
        title: "Enter Animation",
        options: ["fade", "wipeDown", "none"],
        optionTitles: ["Fade", "Wipe Down", "None"],
        defaultValue: "fade",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 500,
        min: 200,
        max: 1000,
        step: 50,
        unit: "ms",
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 80,
        min: 0,
        max: 200,
        step: 20,
        unit: "ms",
    },
})
