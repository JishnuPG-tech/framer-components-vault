import * as React from "react"
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

/**
 * FEATURE SHOWCASE COMPONENT (Viral Layout Update)
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

export default function FeatureShowcaseUltra(props) {
    const isStatic = useIsStaticRenderer()
    const [activeTab, setActiveTab] = React.useState(0)
    const [hoveredTab, setHoveredTab] = React.useState<number | null>(null)

    const tabs = props.tabs || []
    const tags = props.tags || []
    const currentTabIndex = activeTab < tabs.length ? activeTab : 0
    const activeItem = tabs[currentTabIndex]

    const shouldAnimate = props.animate && !isStatic

    // --- Dynamic Styles ---

    const containerStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        gap: `${props.containerGap}px`, // Gap between Header and Split Area
        width: "100%",
        minHeight: "100%",
        padding: `${props.containerPadding}px`,
        backgroundColor: props.containerBg,
        color: props.textColor,
        borderRadius: `${props.containerRadius}px`,
        boxSizing: "border-box",
        overflow: "hidden",
    }

    // NEW: Centralized/Top Header layout
    const headerStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        alignItems:
            props.headerAlignment === "center" ? "center" : "flex-start",
        textAlign: props.headerAlignment === "center" ? "center" : "left",
        maxWidth: "800px",
        margin: props.headerAlignment === "center" ? "0 auto" : "0",
    }

    const badgeStyle: React.CSSProperties = {
        padding: "6px 14px",
        borderRadius: "100px",
        border: `1px solid ${props.badgeBorderColor}`,
        color: props.accentColor,
        fontSize: "13px",
        fontWeight: 500,
        letterSpacing: "0.02em",
        display: "inline-flex",
        alignItems: "center",
    }

    const headlineStyle: React.CSSProperties = {
        fontSize: "clamp(36px, 5vw, 56px)",
        fontWeight: 600,
        lineHeight: 1.1,
        margin: 0,
        letterSpacing: "-0.03em",
        color: props.textColor,
    }

    const subtitleStyle: React.CSSProperties = {
        fontSize: "18px",
        fontWeight: 400,
        color: props.textColor,
        opacity: 0.65,
        margin: 0,
        lineHeight: 1.6,
        letterSpacing: "-0.01em",
    }

    const tagContainerStyle: React.CSSProperties = {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        justifyContent:
            props.headerAlignment === "center" ? "center" : "flex-start",
        marginTop: "8px",
    }

    const tagStyle: React.CSSProperties = {
        padding: "6px 14px",
        borderRadius: "100px",
        border: `1px solid ${props.tagBorderColor}`,
        backgroundColor: "transparent",
        fontSize: "13px",
        fontWeight: 500,
        color: props.textColor,
        opacity: 0.8,
        letterSpacing: "0.01em",
    }

    // Split Layout Area
    const splitAreaStyle: React.CSSProperties = {
        display: "flex",
        flexWrap: "wrap",
        gap: `${props.splitGap || 80}px`,
        direction: props.layoutDirection === "row-reverse" ? "rtl" : "ltr",
        alignItems: "stretch", // ensure equal height if possible
    }

    const leftPanelStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        direction: "ltr",
        flex: "1 1 360px",
        gap: "32px",
        maxWidth: "100%",
    }

    const rightPanelStyle: React.CSSProperties = {
        flex: "1.4 1 420px",
        width: "100%",
        minHeight: props.mediaRatio !== "auto" ? "auto" : "480px",
        aspectRatio: props.mediaRatio !== "auto" ? props.mediaRatio : "auto",
        borderRadius: `${props.mediaRadius}px`,
        overflow: "hidden",
        backgroundColor: "rgba(128,128,128,0.03)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        direction: "ltr",
        border: `1px solid ${props.borderColor}`,
    }

    const tabTitleStyle: React.CSSProperties = {
        fontSize: "18px",
        fontWeight: 500,
        letterSpacing: "-0.01em",
        margin: 0,
        flex: 1,
    }

    const tabDescriptionStyle: React.CSSProperties = {
        fontSize: "15px",
        fontWeight: 400,
        margin: 0,
        lineHeight: 1.6,
        paddingTop: "12px",
        paddingRight: "32px",
    }

    const mediaOverlayTopStyle: React.CSSProperties = {
        position: "absolute",
        top: "24px",
        left: "24px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        zIndex: 10,
    }

    const mediaOverlayBottomStyle: React.CSSProperties = {
        position: "absolute",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "6px",
        backgroundColor: "rgba(10, 10, 10, 0.4)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: "100px",
        border: `1px solid ${props.borderColor}`,
        zIndex: 10,
    }

    const mediaPillStyle = (isActive: boolean): React.CSSProperties => ({
        padding: "8px 20px",
        borderRadius: "100px",
        fontSize: "13px",
        fontWeight: 500,
        letterSpacing: "0.01em",
        backgroundColor: isActive ? props.textColor : "transparent",
        color: isActive ? props.containerBg : props.textColor,
        cursor: "pointer",
        transition: "all 0.2s ease",
        opacity: isActive ? 1 : 0.7,
    })

    const ctaContainerStyle: React.CSSProperties = {
        display: "flex",
        gap: "16px",
        marginTop: "16px",
        flexWrap: "wrap",
    }

    const primaryBtnStyle: React.CSSProperties = {
        padding: "14px 28px",
        borderRadius: "10px",
        backgroundColor: props.textColor,
        color: props.containerBg,
        fontWeight: 500,
        fontSize: "15px",
        letterSpacing: "-0.01em",
        border: "none",
        cursor: "pointer",
        transition: "opacity 0.2s",
    }

    const secondaryBtnStyle: React.CSSProperties = {
        padding: "14px 28px",
        borderRadius: "10px",
        backgroundColor: "transparent",
        color: props.textColor,
        fontWeight: 500,
        fontSize: "15px",
        letterSpacing: "-0.01em",
        border: `1px solid ${props.borderColor}`,
        cursor: "pointer",
        transition: "background-color 0.2s",
    }

    // Chevron SVG Component
    const ChevronIcon = ({ isActive, color }) => (
        <motion.svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={shouldAnimate ? { rotate: isActive ? 180 : 0 } : false}
            initial={false}
            transition={{ duration: 0.3 }}
            style={{ flexShrink: 0, marginTop: "2px" }}
        >
            <polyline points="6 9 12 15 18 9"></polyline>
        </motion.svg>
    )

    return (
        <div style={containerStyle}>
            {/* NEW: Full Width Section Header */}
            <div style={headerStyle}>
                {props.badgeText && (
                    <span style={badgeStyle}>{props.badgeText}</span>
                )}
                {props.headline && (
                    <h2 style={headlineStyle}>{props.headline}</h2>
                )}
                {props.subtitle && (
                    <p style={subtitleStyle}>{props.subtitle}</p>
                )}

                {tags.length > 0 && (
                    <div style={tagContainerStyle}>
                        {tags.map((tag, i) => (
                            <span key={i} style={tagStyle}>
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Split Layout Area */}
            <div style={splitAreaStyle}>
                {/* Left Panel: Accordion & CTAs Only */}
                <div style={leftPanelStyle}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {tabs.map((tab, index) => {
                            const isActive = index === currentTabIndex
                            const isHovered = index === hoveredTab
                            const tabColor = isActive
                                ? props.tabActiveColor
                                : isHovered
                                  ? props.tabActiveColor
                                  : props.tabInactiveColor

                            return (
                                <motion.div
                                    key={index}
                                    style={{
                                        padding: "24px 0",
                                        cursor: "pointer",
                                        display: "flex",
                                        flexDirection: "column",
                                        borderBottom: `1px solid ${props.borderColor}`,
                                    }}
                                    onClick={() =>
                                        !isStatic && setActiveTab(index)
                                    }
                                    onMouseEnter={() => setHoveredTab(index)}
                                    onMouseLeave={() => setHoveredTab(null)}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            width: "100%",
                                        }}
                                    >
                                        <motion.h3
                                            style={tabTitleStyle}
                                            animate={
                                                shouldAnimate
                                                    ? { color: tabColor }
                                                    : false
                                            }
                                            initial={false}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {tab.title}
                                        </motion.h3>
                                        <ChevronIcon
                                            isActive={isActive}
                                            color={tabColor}
                                        />
                                    </div>

                                    <AnimatePresence initial={false}>
                                        {isActive && tab.description && (
                                            <motion.div
                                                key="content"
                                                initial={
                                                    shouldAnimate
                                                        ? {
                                                              height: 0,
                                                              opacity: 0,
                                                          }
                                                        : false
                                                }
                                                animate={
                                                    shouldAnimate
                                                        ? {
                                                              height: "auto",
                                                              opacity: 1,
                                                          }
                                                        : false
                                                }
                                                exit={
                                                    shouldAnimate
                                                        ? {
                                                              height: 0,
                                                              opacity: 0,
                                                          }
                                                        : false
                                                }
                                                transition={
                                                    shouldAnimate
                                                        ? {
                                                              duration: 0.3,
                                                              ease: "easeInOut",
                                                          }
                                                        : undefined
                                                }
                                                style={{ overflow: "hidden" }}
                                            >
                                                <p
                                                    style={{
                                                        ...tabDescriptionStyle,
                                                        color: props.tabInactiveColor,
                                                    }}
                                                >
                                                    {tab.description}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* CTAs */}
                    {(props.primaryCta || props.secondaryCta) && (
                        <div style={ctaContainerStyle}>
                            {props.primaryCta &&
                                (props.primaryCtaLink ? (
                                    <a
                                        href={props.primaryCtaLink}
                                        style={{ textDecoration: "none" }}
                                    >
                                        <motion.button
                                            style={primaryBtnStyle}
                                            whileHover={{ opacity: 0.8 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {props.primaryCta}
                                        </motion.button>
                                    </a>
                                ) : (
                                    <motion.button
                                        style={primaryBtnStyle}
                                        whileHover={{ opacity: 0.8 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {props.primaryCta}
                                    </motion.button>
                                ))}
                            {props.secondaryCta &&
                                (props.secondaryCtaLink ? (
                                    <a
                                        href={props.secondaryCtaLink}
                                        style={{ textDecoration: "none" }}
                                    >
                                        <motion.button
                                            style={secondaryBtnStyle}
                                            whileHover={{
                                                backgroundColor:
                                                    "rgba(255,255,255,0.05)",
                                            }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {props.secondaryCta}
                                        </motion.button>
                                    </a>
                                ) : (
                                    <motion.button
                                        style={secondaryBtnStyle}
                                        whileHover={{
                                            backgroundColor:
                                                "rgba(255,255,255,0.05)",
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {props.secondaryCta}
                                    </motion.button>
                                ))}
                        </div>
                    )}
                </div>

                {/* Right Panel: Media */}
                <div style={rightPanelStyle}>
                    <AnimatePresence mode="wait">
                        {activeItem && activeItem.image ? (
                            <motion.img
                                key={`img-${currentTabIndex}`}
                                src={activeItem.image}
                                alt={activeItem.title || "Feature media"}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    position: "absolute",
                                    inset: 0,
                                }}
                                initial={
                                    shouldAnimate
                                        ? { opacity: 0, scale: 0.95 }
                                        : false
                                }
                                animate={
                                    shouldAnimate
                                        ? { opacity: 1, scale: 1 }
                                        : false
                                }
                                exit={
                                    shouldAnimate
                                        ? { opacity: 0, scale: 1.05 }
                                        : false
                                }
                                transition={
                                    shouldAnimate
                                        ? {
                                              duration: 0.5,
                                              ease: [0.16, 1, 0.3, 1],
                                          }
                                        : undefined
                                }
                            />
                        ) : (
                            <motion.div
                                key="placeholder"
                                initial={shouldAnimate ? { opacity: 0 } : false}
                                animate={shouldAnimate ? { opacity: 1 } : false}
                                exit={shouldAnimate ? { opacity: 0 } : false}
                                style={{ color: props.textColor, opacity: 0.3 }}
                            >
                                No Media
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Media Overlays */}
                    {activeItem && activeItem.mediaLabel && (
                        <div style={mediaOverlayTopStyle}>
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ color: props.textColor, opacity: 0.8 }}
                            >
                                <rect
                                    x="3"
                                    y="3"
                                    width="18"
                                    height="18"
                                    rx="2"
                                    ry="2"
                                ></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            <span
                                style={{
                                    color: props.textColor,
                                    fontWeight: 500,
                                    fontSize: "13px",
                                    letterSpacing: "0.01em",
                                    textShadow: "0 2px 8px rgba(0,0,0,0.4)",
                                }}
                            >
                                {activeItem.mediaLabel}
                            </span>
                        </div>
                    )}

                    <div style={mediaOverlayBottomStyle}>
                        {tabs.map((tab, index) => {
                            if (!tab.mediaTabName) return null
                            const isActive = index === currentTabIndex
                            return (
                                <div
                                    key={index}
                                    style={mediaPillStyle(isActive)}
                                    onClick={() =>
                                        !isStatic && setActiveTab(index)
                                    }
                                >
                                    {tab.mediaTabName}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

// --------------------------------------------------
// DEFAULT PROPS
// --------------------------------------------------
FeatureShowcaseUltra.defaultProps = {
    animate: true,

    // Content Header
    headerAlignment: "center",
    badgeText: "Premium Component",
    headline: "Stop Boring Your Visitors.",
    subtitle:
        "Showcase your best features with interactive, dynamic tabs that keep users engaged. Build faster with this plug-and-play Framer component that converts.",
    tags: ["Zero Code", "High Conversion", "Fully Responsive"],

    // Content Tabs
    tabs: [
        {
            title: "Interactive Storytelling",
            description:
                "Ditch the static walls of text. Pair your compelling copy with dynamic visuals that automatically sync as your users explore.",
            image: "https://framerusercontent.com/images/3K0Y49iQ29f1P85k0M7kHqP3w.jpg",
            mediaLabel: "Engagement Metrics",
            mediaTabName: "Engagement",
        },
        {
            title: "Silky Smooth Motion",
            description:
                "Powered by Framer Motion, every interaction feels incredibly premium. Zero layout shifts, just fluid, uninterrupted transitions.",
            image: "https://framerusercontent.com/images/kQkF30YQ9J28F0P9230kP9K0.jpg",
            mediaLabel: "Animation Preview",
            mediaTabName: "Motion",
        },
        {
            title: "Tailor to Your Brand",
            description:
                "Every color, gap, radius, and line is exposed in the property controls. Make it yours in seconds without writing a single line of CSS.",
            image: "https://framerusercontent.com/images/123Placeholder.jpg",
            mediaLabel: "Customization Panel",
            mediaTabName: "Styling",
        },
    ],

    // CTAs
    primaryCta: "Get this Component",
    secondaryCta: "View Documentation",

    // Layout
    layoutDirection: "row",
    containerPadding: 64,
    containerGap: 64, // Gap below header
    splitGap: 80, // Gap between accordion and media

    // Style - Colors & Container
    containerBg: "#0E0E0E",
    containerRadius: 0,
    borderColor: "rgba(255,255,255,0.1)",

    // Style - Borders
    badgeBorderColor: "rgba(255,255,255,0.2)",
    tagBorderColor: "rgba(255,255,255,0.1)",

    // Style - Typography
    textColor: "#FFFFFF",
    accentColor: "#FFFFFF",

    // Style - Tabs
    tabActiveColor: "#FFFFFF",
    tabInactiveColor: "rgba(255,255,255,0.5)",

    // Style - Media
    mediaRadius: 16,
    mediaRatio: "auto",
}

// --------------------------------------------------
// PROPERTY CONTROLS
// --------------------------------------------------
addPropertyControls(FeatureShowcaseUltra, {
    // --- STRICT PROPERTY GROUPING TOGGLE ---
    propertyView: {
        type: ControlType.Enum,
        title: "⚙️ Category",
        options: [
            "Content",
            "Layout",
            "Style - Container",
            "Typography",
            "Tabs",
            "Media",
        ],
        defaultValue: "Content",
        description: "Select which group of properties you want to edit.",
    },

    animate: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: true,
        description:
            "Enable or disable all animations. Disabling is useful for completely static pages.",
        hidden: (props) =>
            props.propertyView !== "Layout" && props.propertyView !== "Media",
    },

    // ==========================================
    // 1. CONTENT
    // ==========================================
    headerAlignment: {
        type: ControlType.Enum,
        title: "Alignment",
        options: ["left", "center"],
        optionTitles: ["Left", "Center"],
        defaultValue: "center",
        description: "Alignment of the main header section.",
        hidden: (props) => props.propertyView !== "Content",
    },
    badgeText: {
        type: ControlType.String,
        title: "Badge Text",
        description: "Small text pill displayed above the headline.",
        hidden: (props) => props.propertyView !== "Content",
    },
    headline: {
        type: ControlType.String,
        title: "Headline",
        displayTextArea: true,
        description: "Main bold headline for the feature showcase.",
        hidden: (props) => props.propertyView !== "Content",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        displayTextArea: true,
        description:
            "Secondary text providing more context, displayed below the headline.",
        hidden: (props) => props.propertyView !== "Content",
    },
    tags: {
        type: ControlType.Array,
        title: "Tags",
        control: { type: ControlType.String },
        description: "List of small pill badges displayed below the subtitle.",
        hidden: (props) => props.propertyView !== "Content",
    },
    tabs: {
        type: ControlType.Array,
        title: "Accordion Items",
        description: "Add or remove items for the interactive accordion.",
        hidden: (props) => props.propertyView !== "Content",
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title" },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                },
                image: { type: ControlType.Image, title: "Image" },
                mediaLabel: {
                    type: ControlType.String,
                    title: "Media Label",
                    description: "Text at the top left of the media.",
                },
                mediaTabName: {
                    type: ControlType.String,
                    title: "Media Tab",
                    description: "Text for the bottom pill on the media panel.",
                },
            },
        },
    },
    primaryCta: {
        type: ControlType.String,
        title: "Primary Btn",
        description:
            "Text for the primary call-to-action button. Leave empty to hide.",
        hidden: (props) => props.propertyView !== "Content",
    },
    primaryCtaLink: {
        type: ControlType.Link,
        title: "Primary Link",
        description: "Link destination for the primary button.",
        hidden: (props) => props.propertyView !== "Content",
    },
    secondaryCta: {
        type: ControlType.String,
        title: "Secondary Btn",
        description:
            "Text for the secondary call-to-action button. Leave empty to hide.",
        hidden: (props) => props.propertyView !== "Content",
    },
    secondaryCtaLink: {
        type: ControlType.Link,
        title: "Secondary Link",
        description: "Link destination for the secondary button.",
        hidden: (props) => props.propertyView !== "Content",
    },

    // ==========================================
    // 2. LAYOUT
    // ==========================================
    layoutDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["row", "row-reverse"],
        optionTitles: ["Text Left", "Text Right"],
        defaultValue: "row",
        description: "Swap the position of the accordion and the media panel.",
        hidden: (props) => props.propertyView !== "Layout",
    },
    containerPadding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 64,
        min: 0,
        max: 200,
        displayStepper: true,
        description: "Inner spacing around the entire component.",
        hidden: (props) => props.propertyView !== "Layout",
    },
    containerGap: {
        type: ControlType.Number,
        title: "Header Gap",
        defaultValue: 64,
        min: 0,
        max: 200,
        displayStepper: true,
        description: "Space between the top header and the interactive area.",
        hidden: (props) => props.propertyView !== "Layout",
    },
    splitGap: {
        type: ControlType.Number,
        title: "Split Gap",
        defaultValue: 80,
        min: 0,
        max: 200,
        displayStepper: true,
        description: "Space between the accordion and the media panel.",
        hidden: (props) => props.propertyView !== "Layout",
    },

    // ==========================================
    // 3. STYLE - CONTAINER
    // ==========================================
    containerBg: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0E0E0E",
        description: "Main background color of the component.",
        hidden: (props) => props.propertyView !== "Style - Container",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "rgba(255,255,255,0.1)",
        description: "Color for accordion lines and media outlines.",
        hidden: (props) => props.propertyView !== "Style - Container",
    },
    containerRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 100,
        displayStepper: true,
        description: "Corner radius of the entire component.",
        hidden: (props) => props.propertyView !== "Style - Container",
    },
    badgeBorderColor: {
        type: ControlType.Color,
        title: "Badge Border",
        defaultValue: "rgba(255,255,255,0.2)",
        description: "Border color for the top badge text.",
        hidden: (props) => props.propertyView !== "Style - Container",
    },
    tagBorderColor: {
        type: ControlType.Color,
        title: "Tag Border",
        defaultValue: "rgba(255,255,255,0.1)",
        description: "Border color for the small tags below the subtitle.",
        hidden: (props) => props.propertyView !== "Style - Container",
    },

    // ==========================================
    // 4. TYPOGRAPHY
    // ==========================================
    textColor: {
        type: ControlType.Color,
        title: "Text Main",
        defaultValue: "#FFFFFF",
        description: "Primary text color used for headlines and titles.",
        hidden: (props) => props.propertyView !== "Typography",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#FFFFFF",
        description: "Highlight color used for the top badge text.",
        hidden: (props) => props.propertyView !== "Typography",
    },

    // ==========================================
    // 5. TABS
    // ==========================================
    tabActiveColor: {
        type: ControlType.Color,
        title: "Tab Active",
        defaultValue: "#FFFFFF",
        description: "Color for the currently selected accordion tab.",
        hidden: (props) => props.propertyView !== "Tabs",
    },
    tabInactiveColor: {
        type: ControlType.Color,
        title: "Tab Inactive",
        defaultValue: "rgba(255,255,255,0.5)",
        description:
            "Color for the unselected accordion tabs and descriptions.",
        hidden: (props) => props.propertyView !== "Tabs",
    },

    // ==========================================
    // 6. MEDIA
    // ==========================================
    mediaRadius: {
        type: ControlType.Number,
        title: "Media Radius",
        defaultValue: 16,
        min: 0,
        max: 100,
        displayStepper: true,
        description: "Corner radius of the right media panel.",
        hidden: (props) => props.propertyView !== "Media",
    },
    mediaRatio: {
        type: ControlType.Enum,
        title: "Media Ratio",
        options: ["1/1", "4/3", "16/9", "auto"],
        optionTitles: [
            "1:1 Square",
            "4:3 Standard",
            "16:9 Wide",
            "Auto (Fill Space)",
        ],
        defaultValue: "auto",
        description:
            "Aspect ratio lock for the media panel. Use Auto to fill height.",
        hidden: (props) => props.propertyView !== "Media",
    },
})
