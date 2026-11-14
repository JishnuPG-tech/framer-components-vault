// Scrollytelling Split: Two-panel scrollytelling component with sticky visual panel and scrollable text sections
import { useEffect, useRef, useState, startTransition } from "react"
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

interface Section {
    visual: { src: string; alt?: string }
    visualBg: string
    eyebrow: string
    title: string
    body: string
    highlight: string
    annotation: string
    accentColor: string
    linkUrl: string
    linkText: string
    linkTarget: "_self" | "_blank"
}

interface ScrollytellingSplitProps {
    sections: Section[]
    useCmsData: boolean
    cmsData: any[]
    cmsVisualField: string
    cmsVisualBgField: string
    cmsEyebrowField: string
    cmsTitleField: string
    cmsBodyField: string
    cmsHighlightField: string
    cmsAnnotationField: string
    cmsAccentColorField: string
    cmsLinkUrlField: string
    cmsLinkTextField: string
    cmsLinkTargetField: string
    stickyPanelWidth: number
    stickyPanelSide: "left" | "right"
    stickyTopOffset: number
    sectionMinHeight: number
    containerMaxWidth: number
    containerPaddingX: number
    contentGap: number
    sectionPaddingY: number
    panelBorderRadius: number
    panelShadow: boolean
    panelShadowBlur: number
    panelOverlayColor: string
    imageFit: "cover" | "contain"
    showProgressDots: boolean
    dotColor: string
    dotActiveColor: string
    dotSize: number
    dotGap: number
    visualTransition: "crossfade" | "zoomIn" | "slideUp" | "slideLeft" | "blur" | "none"
    transitionDuration: number
    showAnnotation: boolean
    annotationBg: string
    annotationBlur: number
    annotationColor: string
    annotationFontSize: number
    annotationBorderRadius: number
    annotationPadding: number
    annotationPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"
    eyebrowFontSize: number
    eyebrowColor: string
    eyebrowLetterSpacing: number
    eyebrowTransform: "none" | "uppercase"
    titleFontSize: number
    titleFontWeight: "600" | "700" | "800"
    titleColor: string
    titleLineHeight: number
    bodyFontSize: number
    bodyColor: string
    bodyLineHeight: number
    highlightColor: string
    highlightBg: string
    activeNumberEnabled: boolean
    numberFontSize: number
    numberColor: string
    numberFontWeight: "700" | "800" | "900"
    activeAccentBar: boolean
    accentBarWidth: number
    accentBarHeight: number
    linkFontSize: number
    linkColor: string
    linkHoverColor: string
    linkUnderline: boolean
    linkFontWeight: "500" | "600" | "700"
    linkMarginTop: number
    showArrow: boolean
    enableMobileLayout: boolean
    mobileBreakpoint: number
    mobileStickyHeight: number
    mobilePaddingX: number
    mobileSectionPaddingY: number
}

/**
 * Scrollytelling Split Component
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ScrollytellingSplit(props: ScrollytellingSplitProps) {
    const {
        sections,
        useCmsData,
        cmsData,
        cmsVisualField,
        cmsVisualBgField,
        cmsEyebrowField,
        cmsTitleField,
        cmsBodyField,
        cmsHighlightField,
        cmsAnnotationField,
        cmsAccentColorField,
        cmsLinkUrlField,
        cmsLinkTextField,
        cmsLinkTargetField,
        stickyPanelWidth,
        stickyPanelSide,
        stickyTopOffset,
        sectionMinHeight,
        containerMaxWidth,
        containerPaddingX,
        contentGap,
        sectionPaddingY,
        panelBorderRadius,
        panelShadow,
        panelShadowBlur,
        panelOverlayColor,
        imageFit,
        showProgressDots,
        dotColor,
        dotActiveColor,
        dotSize,
        dotGap,
        visualTransition,
        transitionDuration,
        showAnnotation,
        annotationBg,
        annotationBlur,
        annotationColor,
        annotationFontSize,
        annotationBorderRadius,
        annotationPadding,
        annotationPosition,
        eyebrowFontSize,
        eyebrowColor,
        eyebrowLetterSpacing,
        eyebrowTransform,
        titleFontSize,
        titleFontWeight,
        titleColor,
        titleLineHeight,
        bodyFontSize,
        bodyColor,
        bodyLineHeight,
        highlightColor,
        highlightBg,
        activeNumberEnabled,
        numberFontSize,
        numberColor,
        numberFontWeight,
        activeAccentBar,
        accentBarWidth,
        accentBarHeight,
        linkFontSize,
        linkColor,
        linkHoverColor,
        linkUnderline,
        linkFontWeight,
        linkMarginTop,
        showArrow,
        enableMobileLayout,
        mobileBreakpoint,
        mobileStickyHeight,
        mobilePaddingX,
        mobileSectionPaddingY,
    } = props

    const [activeSection, setActiveSection] = useState(0)
    const [isMobile, setIsMobile] = useState(false)
    const sectionRefs = useRef<(HTMLDivElement | null)[]>([])

    // Transform CMS data to Section format
    const transformedSections = useCmsData && cmsData && cmsData.length > 0
        ? cmsData.map((item) => {
            const getFieldValue = (fieldName: string, defaultValue: any = "") => {
                if (!fieldName) return defaultValue
                return item[fieldName] ?? defaultValue
            }

            const visualValue = getFieldValue(cmsVisualField, "")
            const visual = typeof visualValue === "string" 
                ? { src: visualValue, alt: "" }
                : visualValue

            return {
                visual,
                visualBg: getFieldValue(cmsVisualBgField, "#1a1a1a"),
                eyebrow: getFieldValue(cmsEyebrowField, ""),
                title: getFieldValue(cmsTitleField, ""),
                body: getFieldValue(cmsBodyField, ""),
                highlight: getFieldValue(cmsHighlightField, ""),
                annotation: getFieldValue(cmsAnnotationField, ""),
                accentColor: getFieldValue(cmsAccentColorField, "#6366f1"),
                linkUrl: getFieldValue(cmsLinkUrlField, ""),
                linkText: getFieldValue(cmsLinkTextField, ""),
                linkTarget: getFieldValue(cmsLinkTargetField, "_self") as "_self" | "_blank",
            }
        })
        : sections

    const activeSections = transformedSections.length > 0 ? transformedSections : sections

    // Helper function to escape regex special characters
    const escapeRegex = (str: string): string => {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }

    // Helper function to safely highlight text without using dangerouslySetInnerHTML
    const renderHighlightedText = (text: string, highlight: string) => {
        if (!highlight || !text) {
            return text
        }

        try {
            const escapedHighlight = escapeRegex(highlight)
            const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'))
            
            return parts.map((part, index) => {
                if (part.toLowerCase() === highlight.toLowerCase()) {
                    return (
                        <mark
                            key={index}
                            style={{
                                backgroundColor: highlightBg,
                                color: highlightColor,
                                padding: "2px 4px",
                                borderRadius: 3,
                            }}
                        >
                            {part}
                        </mark>
                    )
                }
                return part
            })
        } catch (error) {
            // If regex fails, return plain text
            return text
        }
    }

    useEffect(() => {
        if (typeof window === "undefined" || !enableMobileLayout) return

        const checkMobile = () => {
            startTransition(() => {
                setIsMobile(window.innerWidth <= mobileBreakpoint)
            })
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)

        return () => {
            window.removeEventListener("resize", checkMobile)
        }
    }, [enableMobileLayout, mobileBreakpoint])

    useEffect(() => {
        if (typeof window === "undefined") return

        const observerOptions = {
            root: null,
            // Pick the section closest to the viewport center for stable 1:1 visual/text matching
            rootMargin: "-40% 0px -40% 0px",
            threshold: [0, 0.25, 0.5, 0.75, 1.0],
        }

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            const intersecting = entries.filter((e) => e.isIntersecting)
            if (intersecting.length === 0) return

            const viewportH = typeof window !== "undefined" ? window.innerHeight : 0
            // Activation line for 1:1 matching. On mobile, bias below the sticky visual so content drives the image.
            const activationY = isMobile ? mobileStickyHeight + 24 : viewportH / 2

            let best: { index: number; distance: number } | null = null

            for (const entry of intersecting) {
                const index = sectionRefs.current.indexOf(entry.target as HTMLDivElement)
                if (index === -1) continue

                const rect = entry.boundingClientRect
                const entryCenter = rect.top + rect.height / 2
                const distance = Math.abs(entryCenter - activationY)

                if (!best || distance < best.distance) {
                    best = { index, distance }
                }
            }

            if (best && best.index !== activeSection) {
                startTransition(() => {
                    setActiveSection(best.index)
                })
            }
        }

        const observer = new IntersectionObserver(
            observerCallback,
            observerOptions
        )

        sectionRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref)
        })

        return () => {
            observer.disconnect()
        }
    }, [activeSections.length, activeSection, isMobile, mobileStickyHeight])

    const getTransitionVariants = () => {
        const duration = transitionDuration / 1000

        switch (visualTransition) {
            case "zoomIn":
                return {
                    initial: { opacity: 0, scale: 0.8 },
                    animate: { opacity: 1, scale: 1 },
                    exit: { opacity: 0, scale: 1.1 },
                    transition: { duration },
                }
            case "slideUp":
                return {
                    initial: { opacity: 0, y: 100 },
                    animate: { opacity: 1, y: 0 },
                    exit: { opacity: 0, y: -100 },
                    transition: { duration },
                }
            case "slideLeft":
                return {
                    initial: { opacity: 0, x: 100 },
                    animate: { opacity: 1, x: 0 },
                    exit: { opacity: 0, x: -100 },
                    transition: { duration },
                }
            case "blur":
                return {
                    initial: { opacity: 0, filter: "blur(10px)" },
                    animate: { opacity: 1, filter: "blur(0px)" },
                    exit: { opacity: 0, filter: "blur(10px)" },
                    transition: { duration },
                }
            case "none":
                return {
                    initial: { opacity: 1 },
                    animate: { opacity: 1 },
                    exit: { opacity: 1 },
                    transition: { duration: 0 },
                }
            case "crossfade":
            default:
                return {
                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                    exit: { opacity: 0 },
                    transition: { duration },
                }
        }
    }

    const getAnnotationPosition = () => {
        const positions = {
            "top-left": { top: 24, left: 24 },
            "top-right": { top: 24, right: 24 },
            "bottom-left": { bottom: 24, left: 24 },
            "bottom-right": { bottom: 24, right: 24 },
            center: {
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
            },
        }
        return positions[annotationPosition]
    }

    const currentSection = activeSections[activeSection] || activeSections[0]
    const transitionVariants = getTransitionVariants()

    const handleImageClick = () => {
        if (currentSection?.linkUrl) {
            if (typeof window !== "undefined") {
                if (currentSection.linkTarget === "_blank") {
                    window.open(currentSection.linkUrl, "_blank", "noopener,noreferrer")
                } else {
                    window.location.href = currentSection.linkUrl
                }
            }
        }
    }

    const stickyPanel = (
        <div
            style={{
                position: isMobile ? "sticky" : "sticky",
                top: isMobile ? 0 : stickyTopOffset,
                width: isMobile ? "100%" : `${stickyPanelWidth}%`,
                height: isMobile ? mobileStickyHeight : `calc(100vh - ${stickyTopOffset * 2}px)`,
                flexShrink: 0,
                zIndex: isMobile ? 10 : "auto",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    borderRadius: panelBorderRadius,
                    overflow: "hidden",
                    boxShadow: panelShadow
                        ? `0 20px ${panelShadowBlur}px rgba(0, 0, 0, 0.15)`
                        : "none",
                    cursor: currentSection?.linkUrl ? "pointer" : "default",
                }}
                onClick={handleImageClick}
                role={currentSection?.linkUrl ? "button" : undefined}
                tabIndex={currentSection?.linkUrl ? 0 : undefined}
                onKeyDown={(e) => {
                    if (currentSection?.linkUrl && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault()
                        handleImageClick()
                    }
                }}
                aria-label={currentSection?.linkUrl ? `Navigate to ${currentSection.linkUrl}` : undefined}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSection}
                        {...transitionVariants}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            backgroundColor: currentSection?.visualBg || "#1a1a1a",
                        }}
                    >
                        {currentSection?.visual?.src && (
                            <img
                                src={currentSection.visual.src}
                                alt={currentSection.visual.alt || ""}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: imageFit,
                                    pointerEvents: "none",
                                }}
                            />
                        )}
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                backgroundColor: panelOverlayColor,
                                pointerEvents: "none",
                            }}
                        />
                    </motion.div>
                </AnimatePresence>

                {showAnnotation && currentSection?.annotation && (
                    <div
                        style={{
                            position: "absolute",
                            ...getAnnotationPosition(),
                            backgroundColor: annotationBg,
                            backdropFilter: `blur(${annotationBlur}px)`,
                            color: annotationColor,
                            fontSize: annotationFontSize,
                            borderRadius: annotationBorderRadius,
                            padding: annotationPadding,
                            zIndex: 10,
                        }}
                    >
                        {currentSection.annotation}
                    </div>
                )}

                {showProgressDots && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: 24,
                            left: "50%",
                            transform: "translateX(-50%)",
                            display: "flex",
                            gap: dotGap,
                            zIndex: 10,
                        }}
                    >
                        {activeSections.map((_, index) => (
                            <div
                                key={index}
                                style={{
                                    width: dotSize,
                                    height: dotSize,
                                    borderRadius: "50%",
                                    backgroundColor:
                                        index === activeSection
                                            ? dotActiveColor
                                            : dotColor,
                                    transition: "background-color 0.3s ease",
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )

    const scrollableContent = (
        <div
            style={{
                width: isMobile ? "100%" : `${100 - stickyPanelWidth}%`,
                display: "flex",
                flexDirection: "column",
            }}
        >
            {activeSections.map((section, index) => {
                const isActive = index === activeSection

                const currentSectionPaddingY = isMobile ? mobileSectionPaddingY : sectionPaddingY
                const currentMinHeight = isMobile ? Math.max(300, sectionMinHeight * 0.6) : sectionMinHeight

                return (
                    <div
                        key={index}
                        ref={(el) => {
                            sectionRefs.current[index] = el
                        }}
                        style={{
                            minHeight: currentMinHeight,
                            padding: `${currentSectionPaddingY}px 0`,
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                        }}
                    >
                        {activeNumberEnabled && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: currentSectionPaddingY,
                                    left: 0,
                                    fontSize: isMobile ? numberFontSize * 0.6 : numberFontSize,
                                    fontWeight: numberFontWeight,
                                    color: isActive
                                        ? section.accentColor
                                        : numberColor,
                                    lineHeight: 1,
                                    transition: "color 0.3s ease",
                                    userSelect: "none",
                                    display: isMobile ? "none" : "block",
                                }}
                            >
                                {String(index + 1).padStart(2, "0")}
                            </div>
                        )}

                        {activeAccentBar && isActive && (
                            <motion.div
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: 1 }}
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    width: accentBarWidth,
                                    height: isMobile ? accentBarHeight * 0.75 : accentBarHeight,
                                    backgroundColor: section.accentColor,
                                    borderRadius: accentBarWidth / 2,
                                }}
                            />
                        )}

                        <div
                            style={{
                                paddingLeft: activeNumberEnabled ? (isMobile ? 32 : 40) : 0,
                            }}
                        >
                            {section.eyebrow && (
                                <div
                                    style={{
                                        fontSize: isMobile ? Math.max(10, eyebrowFontSize - 1) : eyebrowFontSize,
                                        color: eyebrowColor,
                                        letterSpacing: eyebrowLetterSpacing,
                                        textTransform: eyebrowTransform,
                                        marginBottom: isMobile ? 8 : 12,
                                        fontWeight: "600",
                                    }}
                                >
                                    {section.eyebrow}
                                </div>
                            )}

                            <h2
                                style={{
                                    fontSize: isMobile ? Math.max(20, titleFontSize * 0.7) : titleFontSize,
                                    fontWeight: titleFontWeight,
                                    color: titleColor,
                                    lineHeight: titleLineHeight,
                                    margin: isMobile ? "0 0 12px 0" : "0 0 16px 0",
                                }}
                            >
                                {section.title}
                            </h2>

                            <div
                                style={{
                                    fontSize: isMobile ? Math.max(14, bodyFontSize - 1) : bodyFontSize,
                                    color: bodyColor,
                                    lineHeight: bodyLineHeight,
                                }}
                            >
                                {renderHighlightedText(section.body, section.highlight)}
                            </div>

                            {section.linkUrl && section.linkText && (
                                <a
                                    href={section.linkUrl}
                                    target={section.linkTarget || "_self"}
                                    rel={section.linkTarget === "_blank" ? "noopener noreferrer" : undefined}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 8,
                                        marginTop: isMobile ? Math.max(12, linkMarginTop * 0.7) : linkMarginTop,
                                        fontSize: isMobile ? Math.max(13, linkFontSize - 1) : linkFontSize,
                                        fontWeight: linkFontWeight,
                                        color: linkColor,
                                        textDecoration: linkUnderline ? "underline" : "none",
                                        transition: "color 0.2s ease",
                                        cursor: "pointer",
                                        minHeight: isMobile ? 44 : "auto",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = linkHoverColor
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = linkColor
                                    }}
                                >
                                    {section.linkText}
                                    {showArrow && (
                                        <svg
                                            width={isMobile ? "14" : "16"}
                                            height={isMobile ? "14" : "16"}
                                            viewBox="0 0 16 16"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M6 3L11 8L6 13"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    )}
                                </a>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )

    return (
        <div
            style={{
                width: "100%",
                backgroundColor: "#0a0a0a",
                padding: isMobile 
                    ? "0" 
                    : `60px ${containerPaddingX}px`,
            }}
        >
            <div
                style={{
                    maxWidth: isMobile ? "100%" : containerMaxWidth,
                    margin: "0 auto",
                    display: "flex",
                    gap: isMobile ? 0 : contentGap,
                    flexDirection: isMobile 
                        ? "column"
                        : (stickyPanelSide === "left" ? "row" : "row-reverse"),
                }}
            >
                {isMobile ? (
                    <>
                        {stickyPanel}
                        <div style={{ 
                            padding: `${mobileSectionPaddingY}px ${mobilePaddingX}px`,
                            backgroundColor: "#0a0a0a",
                        }}>
                            {scrollableContent}
                        </div>
                    </>
                ) : (
                    <>
                        {stickyPanel}
                        {scrollableContent}
                    </>
                )}
            </div>
        </div>
    )
}

addPropertyControls(ScrollytellingSplit, {
    // ===== CONTENT =====
    sections: {
        type: ControlType.Array,
        title: "📝 Sections",
        control: {
            type: ControlType.Object,
            controls: {
                visual: {
                    type: ControlType.ResponsiveImage,
                    title: "Visual",
                },
                visualBg: {
                    type: ControlType.Color,
                    title: "Visual BG",
                    defaultValue: "#1a1a1a",
                },
                eyebrow: {
                    type: ControlType.String,
                    title: "Eyebrow",
                    defaultValue: "Chapter",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Section Title",
                },
                body: {
                    type: ControlType.String,
                    title: "Body",
                    displayTextArea: true,
                    defaultValue:
                        "This is the body text for this section. It provides detailed information about the visual on the left.",
                },
                highlight: {
                    type: ControlType.String,
                    title: "Highlight Word",
                    defaultValue: "visual",
                },
                annotation: {
                    type: ControlType.String,
                    title: "Annotation",
                    defaultValue: "Key insight",
                },
                accentColor: {
                    type: ControlType.Color,
                    title: "Accent Color",
                    defaultValue: "#6366f1",
                },
                linkUrl: {
                    type: ControlType.String,
                    title: "Link URL",
                    defaultValue: "",
                    placeholder: "https://example.com",
                },
                linkText: {
                    type: ControlType.String,
                    title: "Link Text",
                    defaultValue: "",
                    placeholder: "Learn more",
                },
                linkTarget: {
                    type: ControlType.Enum,
                    title: "Link Target",
                    options: ["_self", "_blank"],
                    optionTitles: ["Same Tab", "New Tab"],
                    defaultValue: "_self",
                    displaySegmentedControl: true,
                },
            },
        },
        maxCount: 10,
        defaultValue: [
            {
                visual: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Gradient 1",
                },
                visualBg: "#1a1a2e",
                eyebrow: "Chapter 01",
                title: "The Beginning",
                body: "Every great story starts with a single step. This is where our journey begins, setting the foundation for everything that follows.",
                highlight: "journey",
                annotation: "Starting point",
                accentColor: "#6366f1",
                linkUrl: "",
                linkText: "",
                linkTarget: "_self",
            },
            {
                visual: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Gradient 2",
                },
                visualBg: "#2e1a2e",
                eyebrow: "Chapter 02",
                title: "The Challenge",
                body: "As we progress, obstacles emerge. These challenges test our resolve and push us to grow beyond our limitations.",
                highlight: "challenges",
                annotation: "Critical moment",
                accentColor: "#a855f7",
                linkUrl: "",
                linkText: "",
                linkTarget: "_self",
            },
            {
                visual: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Gradient 3",
                },
                visualBg: "#2e1a1a",
                eyebrow: "Chapter 03",
                title: "The Transformation",
                body: "Through perseverance and dedication, transformation occurs. What once seemed impossible becomes our new reality.",
                highlight: "transformation",
                annotation: "Breakthrough",
                accentColor: "#f97316",
                linkUrl: "",
                linkText: "",
                linkTarget: "_self",
            },
        ],
        hidden: ({ useCmsData }) => useCmsData,
    },

    // ===== CMS DATA =====
    useCmsData: {
        type: ControlType.Boolean,
        title: "🔌 Use CMS Data",
        defaultValue: false,
        enabledTitle: "CMS",
        disabledTitle: "Manual",
    },
    cmsData: {
        type: ControlType.Array,
        title: "CMS Collection",
        control: {
            type: ControlType.Object,
            controls: {},
        },
        hidden: ({ useCmsData }) => !useCmsData,
    },
    cmsVisualField: {
        type: ControlType.String,
        title: "Visual Field Name",
        defaultValue: "image",
        placeholder: "image",
        hidden: ({ useCmsData }) => !useCmsData,
    },
    cmsVisualBgField: {
        type: ControlType.String,
        title: "Visual BG Field Name",
        defaultValue: "backgroundColor",
        placeholder: "backgroundColor",
        hidden: ({ useCmsData }) => !useCmsData,
    },
    cmsEyebrowField: {
        type: ControlType.String,
        title: "Eyebrow Field Name",
        defaultValue: "eyebrow",
        placeholder: "eyebrow",
        hidden: ({ useCmsData }) => !useCmsData,
    },
    cmsTitleField: {
        type: ControlType.String,
        title: "Title Field Name",
        defaultValue: "title",
        placeholder: "title",
        hidden: ({ useCmsData }) => !useCmsData,
    },
    cmsBodyField: {
        type: ControlType.String,
        title: "Body Field Name",
        defaultValue: "body",
        placeholder: "body",
        hidden: ({ useCmsData }) => !useCmsData,
    },
    cmsHighlightField: {
        type: ControlType.String,
        title: "Highlight Field Name",
        defaultValue: "highlight",
        placeholder: "highlight",
        hidden: ({ useCmsData }) => !useCmsData,
    },
    cmsAnnotationField: {
        type: ControlType.String,
        title: "Annotation Field Name",
        defaultValue: "annotation",
        placeholder: "annotation",
        hidden: ({ useCmsData }) => !useCmsData,
    },
    cmsAccentColorField: {
        type: ControlType.String,
        title: "Accent Color Field Name",
        defaultValue: "accentColor",
        placeholder: "accentColor",
        hidden: ({ useCmsData }) => !useCmsData,
    },
    cmsLinkUrlField: {
        type: ControlType.String,
        title: "Link URL Field Name",
        defaultValue: "linkUrl",
        placeholder: "linkUrl",
        hidden: ({ useCmsData }) => !useCmsData,
    },
    cmsLinkTextField: {
        type: ControlType.String,
        title: "Link Text Field Name",
        defaultValue: "linkText",
        placeholder: "linkText",
        hidden: ({ useCmsData }) => !useCmsData,
    },
    cmsLinkTargetField: {
        type: ControlType.String,
        title: "Link Target Field Name",
        defaultValue: "linkTarget",
        placeholder: "linkTarget",
        hidden: ({ useCmsData }) => !useCmsData,
    },

    // ===== LAYOUT =====
    containerMaxWidth: {
        type: ControlType.Number,
        title: "📐 Container Max Width",
        defaultValue: 1400,
        min: 800,
        max: 1800,
        step: 100,
        unit: "px",
    },
    containerPaddingX: {
        type: ControlType.Number,
        title: "Container Padding",
        defaultValue: 48,
        min: 16,
        max: 80,
        step: 4,
        unit: "px",
    },
    stickyPanelSide: {
        type: ControlType.Enum,
        title: "Visual Panel Side",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    stickyPanelWidth: {
        type: ControlType.Number,
        title: "Visual Panel Width",
        defaultValue: 50,
        min: 30,
        max: 60,
        step: 1,
        unit: "%",
    },
    stickyTopOffset: {
        type: ControlType.Number,
        title: "Visual Top Offset",
        defaultValue: 80,
        min: 0,
        max: 120,
        step: 4,
        unit: "px",
    },
    contentGap: {
        type: ControlType.Number,
        title: "Gap Between Panels",
        defaultValue: 48,
        min: 24,
        max: 80,
        step: 4,
        unit: "px",
    },
    sectionMinHeight: {
        type: ControlType.Number,
        title: "Section Min Height",
        defaultValue: 500,
        min: 200,
        max: 800,
        step: 50,
        unit: "px",
    },
    sectionPaddingY: {
        type: ControlType.Number,
        title: "Section Padding Y",
        defaultValue: 60,
        min: 24,
        max: 120,
        step: 4,
        unit: "px",
    },

    // ===== VISUAL PANEL STYLE =====
    panelBorderRadius: {
        type: ControlType.Number,
        title: "🎨 Panel Border Radius",
        defaultValue: 20,
        min: 0,
        max: 32,
        step: 2,
        unit: "px",
    },
    panelShadow: {
        type: ControlType.Boolean,
        title: "Panel Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    panelShadowBlur: {
        type: ControlType.Number,
        title: "Shadow Blur",
        defaultValue: 60,
        min: 20,
        max: 80,
        step: 5,
        unit: "px",
        hidden: ({ panelShadow }) => !panelShadow,
    },
    panelOverlayColor: {
        type: ControlType.Color,
        title: "Panel Overlay Color",
        defaultValue: "rgba(0,0,0,0.2)",
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },

    // ===== VISUAL TRANSITION =====
    visualTransition: {
        type: ControlType.Enum,
        title: "✨ Transition Effect",
        options: ["crossfade", "zoomIn", "slideUp", "slideLeft", "blur", "none"],
        optionTitles: [
            "Crossfade",
            "Zoom In",
            "Slide Up",
            "Slide Left",
            "Blur",
            "None",
        ],
        defaultValue: "crossfade",
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Transition Duration",
        defaultValue: 500,
        min: 300,
        max: 1000,
        step: 50,
        unit: "ms",
    },

    // ===== PROGRESS DOTS =====
    showProgressDots: {
        type: ControlType.Boolean,
        title: "⚫ Show Progress Dots",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 8,
        min: 4,
        max: 14,
        step: 1,
        unit: "px",
        hidden: ({ showProgressDots }) => !showProgressDots,
    },
    dotGap: {
        type: ControlType.Number,
        title: "Dot Gap",
        defaultValue: 10,
        min: 6,
        max: 20,
        step: 1,
        unit: "px",
        hidden: ({ showProgressDots }) => !showProgressDots,
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "rgba(255,255,255,0.3)",
        hidden: ({ showProgressDots }) => !showProgressDots,
    },
    dotActiveColor: {
        type: ControlType.Color,
        title: "Active Dot Color",
        defaultValue: "#ffffff",
        hidden: ({ showProgressDots }) => !showProgressDots,
    },

    // ===== ANNOTATION =====
    showAnnotation: {
        type: ControlType.Boolean,
        title: "💬 Show Annotation",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    annotationPosition: {
        type: ControlType.Enum,
        title: "Position",
        options: [
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "center",
        ],
        optionTitles: [
            "Top Left",
            "Top Right",
            "Bottom Left",
            "Bottom Right",
            "Center",
        ],
        defaultValue: "bottom-left",
        hidden: ({ showAnnotation }) => !showAnnotation,
    },
    annotationBg: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(0,0,0,0.7)",
        hidden: ({ showAnnotation }) => !showAnnotation,
    },
    annotationColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#ffffff",
        hidden: ({ showAnnotation }) => !showAnnotation,
    },
    annotationFontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 13,
        min: 10,
        max: 20,
        step: 1,
        unit: "px",
        hidden: ({ showAnnotation }) => !showAnnotation,
    },
    annotationBorderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 10,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
        hidden: ({ showAnnotation }) => !showAnnotation,
    },
    annotationPadding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 12,
        min: 8,
        max: 24,
        step: 2,
        unit: "px",
        hidden: ({ showAnnotation }) => !showAnnotation,
    },
    annotationBlur: {
        type: ControlType.Number,
        title: "Backdrop Blur",
        defaultValue: 8,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
        hidden: ({ showAnnotation }) => !showAnnotation,
    },

    // ===== TEXT STYLE - EYEBROW =====
    eyebrowFontSize: {
        type: ControlType.Number,
        title: "👁️ Eyebrow Font Size",
        defaultValue: 12,
        min: 9,
        max: 16,
        step: 1,
        unit: "px",
    },
    eyebrowColor: {
        type: ControlType.Color,
        title: "Eyebrow Color",
        defaultValue: "rgba(255,255,255,0.4)",
    },
    eyebrowLetterSpacing: {
        type: ControlType.Number,
        title: "Eyebrow Letter Spacing",
        defaultValue: 2.5,
        min: 0,
        max: 6,
        step: 0.5,
        unit: "px",
    },
    eyebrowTransform: {
        type: ControlType.Enum,
        title: "Eyebrow Transform",
        options: ["none", "uppercase"],
        optionTitles: ["None", "Uppercase"],
        defaultValue: "uppercase",
        displaySegmentedControl: true,
    },

    // ===== TEXT STYLE - TITLE =====
    titleFontSize: {
        type: ControlType.Number,
        title: "📰 Title Font Size",
        defaultValue: 32,
        min: 18,
        max: 60,
        step: 2,
        unit: "px",
    },
    titleFontWeight: {
        type: ControlType.Enum,
        title: "Title Font Weight",
        options: ["600", "700", "800"],
        optionTitles: ["Semibold", "Bold", "Extra Bold"],
        defaultValue: "700",
        displaySegmentedControl: true,
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#ffffff",
    },
    titleLineHeight: {
        type: ControlType.Number,
        title: "Title Line Height",
        defaultValue: 1.2,
        min: 1.0,
        max: 1.5,
        step: 0.05,
    },

    // ===== TEXT STYLE - BODY =====
    bodyFontSize: {
        type: ControlType.Number,
        title: "📄 Body Font Size",
        defaultValue: 16,
        min: 13,
        max: 22,
        step: 1,
        unit: "px",
    },
    bodyColor: {
        type: ControlType.Color,
        title: "Body Color",
        defaultValue: "rgba(255,255,255,0.7)",
    },
    bodyLineHeight: {
        type: ControlType.Number,
        title: "Body Line Height",
        defaultValue: 1.7,
        min: 1.4,
        max: 2.0,
        step: 0.1,
    },
    highlightColor: {
        type: ControlType.Color,
        title: "Highlight Text Color",
        defaultValue: "#6366f1",
    },
    highlightBg: {
        type: ControlType.Color,
        title: "Highlight Background",
        defaultValue: "rgba(99,102,241,0.12)",
    },

    // ===== TEXT STYLE - LINK =====
    linkFontSize: {
        type: ControlType.Number,
        title: "🔗 Link Font Size",
        defaultValue: 15,
        min: 12,
        max: 20,
        step: 1,
        unit: "px",
    },
    linkFontWeight: {
        type: ControlType.Enum,
        title: "Link Font Weight",
        options: ["500", "600", "700"],
        optionTitles: ["Medium", "Semibold", "Bold"],
        defaultValue: "600",
        displaySegmentedControl: true,
    },
    linkColor: {
        type: ControlType.Color,
        title: "Link Color",
        defaultValue: "#6366f1",
    },
    linkHoverColor: {
        type: ControlType.Color,
        title: "Link Hover Color",
        defaultValue: "#818cf8",
    },
    linkUnderline: {
        type: ControlType.Boolean,
        title: "Link Underline",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    linkMarginTop: {
        type: ControlType.Number,
        title: "Link Margin Top",
        defaultValue: 20,
        min: 8,
        max: 40,
        step: 2,
        unit: "px",
    },
    showArrow: {
        type: ControlType.Boolean,
        title: "Show Link Arrow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    // ===== SECTION INDICATORS =====
    activeNumberEnabled: {
        type: ControlType.Boolean,
        title: "🔢 Show Section Numbers",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    numberFontSize: {
        type: ControlType.Number,
        title: "Number Font Size",
        defaultValue: 80,
        min: 40,
        max: 200,
        step: 10,
        unit: "px",
        hidden: ({ activeNumberEnabled }) => !activeNumberEnabled,
    },
    numberFontWeight: {
        type: ControlType.Enum,
        title: "Number Font Weight",
        options: ["700", "800", "900"],
        optionTitles: ["Bold", "Extra Bold", "Black"],
        defaultValue: "900",
        displaySegmentedControl: true,
        hidden: ({ activeNumberEnabled }) => !activeNumberEnabled,
    },
    numberColor: {
        type: ControlType.Color,
        title: "Number Color",
        defaultValue: "rgba(255,255,255,0.04)",
        hidden: ({ activeNumberEnabled }) => !activeNumberEnabled,
    },
    activeAccentBar: {
        type: ControlType.Boolean,
        title: "Show Accent Bar",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    accentBarWidth: {
        type: ControlType.Number,
        title: "Accent Bar Width",
        defaultValue: 3,
        min: 2,
        max: 8,
        step: 1,
        unit: "px",
        hidden: ({ activeAccentBar }) => !activeAccentBar,
    },
    accentBarHeight: {
        type: ControlType.Number,
        title: "Accent Bar Height",
        defaultValue: 48,
        min: 30,
        max: 80,
        step: 2,
        unit: "px",
        hidden: ({ activeAccentBar }) => !activeAccentBar,
    },

    // ===== MOBILE RESPONSIVE =====
    enableMobileLayout: {
        type: ControlType.Boolean,
        title: "📱 Enable Mobile Layout",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile Breakpoint",
        defaultValue: 768,
        min: 480,
        max: 1024,
        step: 16,
        unit: "px",
        hidden: ({ enableMobileLayout }) => !enableMobileLayout,
    },
    mobileStickyHeight: {
        type: ControlType.Number,
        title: "Mobile Visual Height",
        defaultValue: 400,
        min: 250,
        max: 600,
        step: 25,
        unit: "px",
        hidden: ({ enableMobileLayout }) => !enableMobileLayout,
    },
    mobilePaddingX: {
        type: ControlType.Number,
        title: "Mobile Padding X",
        defaultValue: 24,
        min: 16,
        max: 48,
        step: 4,
        unit: "px",
        hidden: ({ enableMobileLayout }) => !enableMobileLayout,
    },
    mobileSectionPaddingY: {
        type: ControlType.Number,
        title: "Mobile Section Padding",
        defaultValue: 40,
        min: 24,
        max: 80,
        step: 4,
        unit: "px",
        hidden: ({ enableMobileLayout }) => !enableMobileLayout,
    },
})