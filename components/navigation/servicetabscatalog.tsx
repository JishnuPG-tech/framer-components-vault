// Service Tabs component with smooth fade + slide-up animations
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
import { useState, startTransition, type CSSProperties } from "react"

interface ServiceTabsProps {
    tabs: Array<{ 
        label: string
        content: string
        showCta: boolean
        ctaText: string
        ctaLink: string
        ctaStyle: "filled" | "outline"
        ctaColor: string
        ctaTextColor: string
    }>
    theme: "light" | "dark"
    accentColor: string
    animationDuration: number
    style?: CSSProperties
}

/**
 * Service Tabs
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ServiceTabs(props: ServiceTabsProps) {
    const {
        tabs = [
            { 
                label: "Design", 
                content: "We craft beautiful, user-centered designs that elevate your brand and create memorable experiences. Our design process focuses on clarity, aesthetics, and functionality.",
                showCta: true,
                ctaText: "Learn More",
                ctaLink: "#",
                ctaStyle: "filled",
                ctaColor: "#d4ff57",
                ctaTextColor: "#000000"
            },
            { 
                label: "Development", 
                content: "Our development team builds robust, scalable solutions using modern technologies. We ensure your product is fast, secure, and maintainable for the long term.",
                showCta: true,
                ctaText: "Get Started",
                ctaLink: "#",
                ctaStyle: "filled",
                ctaColor: "#d4ff57",
                ctaTextColor: "#000000"
            },
            { 
                label: "Strategy", 
                content: "Strategic planning is at the core of every successful project. We help you define goals, identify opportunities, and create a roadmap for sustainable growth.",
                showCta: false,
                ctaText: "View Details",
                ctaLink: "#",
                ctaStyle: "outline",
                ctaColor: "#d4ff57",
                ctaTextColor: "#d4ff57"
            },
            { 
                label: "Support", 
                content: "We provide ongoing support and maintenance to keep your product running smoothly. Our team is always available to help with updates, improvements, and troubleshooting.",
                showCta: false,
                ctaText: "Contact Us",
                ctaLink: "#",
                ctaStyle: "outline",
                ctaColor: "#d4ff57",
                ctaTextColor: "#d4ff57"
            },
        ],
        theme = "dark",
        accentColor = "#d4ff57",
        animationDuration = 250,
    } = props

    const [activeTab, setActiveTab] = useState(0)

    const handleTabClick = (index: number) => {
        startTransition(() => {
            setActiveTab(index)
        })
    }

    const duration = animationDuration / 1000

    const isDark = theme === "dark"
    const textColor = isDark ? "#ffffff" : "#000000"
    const mutedTextColor = isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)"
    const inactiveBorderColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
    const inactiveBorderHoverColor = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)"
    const backgroundColor = isDark ? "#18181f" : "#f5f5f5"
    const activeTextColor = isDark ? "#000000" : "#ffffff"

    const currentTab = tabs[activeTab]

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontFamily: "DM Mono, monospace",
            }}
        >
            <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

            {/* Tab Buttons */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                }}
            >
                {tabs.map((tab, index) => {
                    const isActive = activeTab === index
                    return (
                        <button
                            key={index}
                            onClick={() => handleTabClick(index)}
                            style={{
                                padding: "10px 20px",
                                borderRadius: 6,
                                fontSize: 12,
                                fontFamily: "DM Mono, monospace",
                                fontWeight: 500,
                                cursor: "pointer",
                                transition: `all ${duration}s ease`,
                                border: isActive ? "none" : `1px solid ${inactiveBorderColor}`,
                                backgroundColor: isActive ? accentColor : "transparent",
                                color: isActive ? activeTextColor : textColor,
                                outline: "none",
                                flex: "1 1 auto",
                                minWidth: "fit-content",
                                whiteSpace: "nowrap",
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.borderColor = inactiveBorderHoverColor
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.borderColor = inactiveBorderColor
                                }
                            }}
                        >
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Content Area */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    overflow: "hidden",
                }}
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                            duration: duration,
                            ease: "easeInOut",
                        }}
                        style={{
                            backgroundColor: backgroundColor,
                            borderRadius: 14,
                            padding: "20px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                fontSize: 13,
                                lineHeight: 1.7,
                                color: mutedTextColor,
                                fontFamily: "Inter, sans-serif",
                                whiteSpace: "pre-wrap",
                            }}
                        >
                            {currentTab.content}
                        </p>
                        
                        {currentTab.showCta && (
                            <a
                                href={currentTab.ctaLink}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "12px 24px",
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontFamily: "DM Mono, monospace",
                                    fontWeight: 500,
                                    textDecoration: "none",
                                    cursor: "pointer",
                                    transition: `all ${duration}s ease`,
                                    alignSelf: "flex-start",
                                    backgroundColor: currentTab.ctaStyle === "filled" ? currentTab.ctaColor : "transparent",
                                    color: currentTab.ctaStyle === "filled" ? currentTab.ctaTextColor : currentTab.ctaColor,
                                    border: currentTab.ctaStyle === "outline" ? `1px solid ${currentTab.ctaColor}` : "none",
                                }}
                                onMouseEnter={(e) => {
                                    if (currentTab.ctaStyle === "filled") {
                                        e.currentTarget.style.opacity = "0.85"
                                    } else {
                                        e.currentTarget.style.backgroundColor = currentTab.ctaColor
                                        e.currentTarget.style.color = currentTab.ctaTextColor
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (currentTab.ctaStyle === "filled") {
                                        e.currentTarget.style.opacity = "1"
                                    } else {
                                        e.currentTarget.style.backgroundColor = "transparent"
                                        e.currentTarget.style.color = currentTab.ctaColor
                                    }
                                }}
                            >
                                {currentTab.ctaText}
                            </a>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}

addPropertyControls(ServiceTabs, {
    tabs: {
        type: ControlType.Array,
        title: "Tabs",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Tab",
                },
                content: {
                    type: ControlType.String,
                    title: "Content",
                    displayTextArea: true,
                    defaultValue: "Tab content goes here.",
                },
                showCta: {
                    type: ControlType.Boolean,
                    title: "Show CTA",
                    defaultValue: false,
                    enabledTitle: "Show",
                    disabledTitle: "Hide",
                },
                ctaText: {
                    type: ControlType.String,
                    title: "CTA Text",
                    defaultValue: "Learn More",
                    hidden: ({ showCta }) => !showCta,
                },
                ctaLink: {
                    type: ControlType.String,
                    title: "CTA Link",
                    defaultValue: "#",
                    hidden: ({ showCta }) => !showCta,
                },
                ctaStyle: {
                    type: ControlType.Enum,
                    title: "CTA Style",
                    options: ["filled", "outline"],
                    optionTitles: ["Filled", "Outline"],
                    defaultValue: "filled",
                    displaySegmentedControl: true,
                    hidden: ({ showCta }) => !showCta,
                },
                ctaColor: {
                    type: ControlType.Color,
                    title: "CTA Color",
                    defaultValue: "#d4ff57",
                    hidden: ({ showCta }) => !showCta,
                },
                ctaTextColor: {
                    type: ControlType.Color,
                    title: "CTA Text Color",
                    defaultValue: "#000000",
                    hidden: ({ showCta, ctaStyle }) => !showCta || ctaStyle === "outline",
                },
            },
        },
        defaultValue: [
            { 
                label: "Design", 
                content: "We craft beautiful, user-centered designs that elevate your brand and create memorable experiences. Our design process focuses on clarity, aesthetics, and functionality.",
                showCta: true,
                ctaText: "Learn More",
                ctaLink: "#",
                ctaStyle: "filled",
                ctaColor: "#d4ff57",
                ctaTextColor: "#000000"
            },
            { 
                label: "Development", 
                content: "Our development team builds robust, scalable solutions using modern technologies. We ensure your product is fast, secure, and maintainable for the long term.",
                showCta: true,
                ctaText: "Get Started",
                ctaLink: "#",
                ctaStyle: "filled",
                ctaColor: "#d4ff57",
                ctaTextColor: "#000000"
            },
            { 
                label: "Strategy", 
                content: "Strategic planning is at the core of every successful project. We help you define goals, identify opportunities, and create a roadmap for sustainable growth.",
                showCta: false,
                ctaText: "View Details",
                ctaLink: "#",
                ctaStyle: "outline",
                ctaColor: "#d4ff57",
                ctaTextColor: "#d4ff57"
            },
            { 
                label: "Support", 
                content: "We provide ongoing support and maintenance to keep your product running smoothly. Our team is always available to help with updates, improvements, and troubleshooting.",
                showCta: false,
                ctaText: "Contact Us",
                ctaLink: "#",
                ctaStyle: "outline",
                ctaColor: "#d4ff57",
                ctaTextColor: "#d4ff57"
            },
        ],
        maxCount: 6,
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
        defaultValue: "dark",
        displaySegmentedControl: true,
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#d4ff57",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 250,
        min: 150,
        max: 400,
        step: 10,
        unit: "ms",
    },
})
