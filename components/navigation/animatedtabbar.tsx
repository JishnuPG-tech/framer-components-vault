// Animated Tab Bar with sliding indicator, swipeable content, and multiple styles
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion"
import { useState, useRef, useEffect, useMemo, startTransition, type CSSProperties } from "react"

interface Tab {
    id: string
    label: string
    icon?: string
    iconType?: "emoji" | "image" | "none"
    iconImage?: { src: string; alt?: string }
    badge?: string | number
    content?: string
    link?: string
}

interface AnimatedTabBarProps {
    tabs: Tab[]
    defaultTab: string
    indicatorStyle: "line" | "pill" | "background" | "dot"
    indicatorPosition: "top" | "bottom"
    transition: "slide" | "fade" | "scale" | "none"
    swipeable: boolean
    lazy: boolean
    keepMounted: boolean
    onChange?: (id: string) => void
    scrollable: boolean
    tabBarBackground: string
    tabColor: string
    activeTabColor: string
    indicatorColor: string
    contentBackground: string
    tabFont: CSSProperties
    contentPadding: number
    tabPaddingVertical: number
    tabPaddingHorizontal: number
    tabGap: number
    indicatorHeight: number
    indicatorBorderRadius: number
    badgeBackground: string
    badgeTextColor: string
    badgePadding: number
    iconSize: number
    iconGap: number
    hoverScale: number
    hoverOpacity: number
    responsiveMode: "auto" | "mobile" | "desktop"
    minTouchTarget: number
    mobileLayout: "bottom" | "top"
    mobileShowLabels: boolean
    mobileIconSize: number
    style?: CSSProperties
}

/**
 * Animated Tab Bar
 * 
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function AnimatedTabBar(props: AnimatedTabBarProps) {
    const {
        tabs = [],
        defaultTab,
        indicatorStyle = "line",
        indicatorPosition = "bottom",
        transition = "slide",
        swipeable = true,
        lazy = false,
        keepMounted = false,
        onChange,
        scrollable = false,
        tabBarBackground = "#FFFFFF",
        tabColor = "#666666",
        activeTabColor = "#000000",
        indicatorColor = "#000000",
        contentBackground = "#F5F5F5",
        tabFont,
        contentPadding = 20,
        tabPaddingVertical = 16,
        tabPaddingHorizontal = 24,
        tabGap = 0,
        indicatorHeight = 3,
        indicatorBorderRadius = 0,
        badgeBackground = "#000000",
        badgeTextColor = "#FFFFFF",
        badgePadding = 6,
        iconSize = 18,
        iconGap = 8,
        hoverScale = 1.05,
        hoverOpacity = 0.8,
        responsiveMode = "auto",
        minTouchTarget = 44,
        mobileLayout = "bottom",
        mobileShowLabels = true,
        mobileIconSize = 24,
        style,
    } = props

    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || "")
    const [indicatorProps, setIndicatorProps] = useState({ width: 0, left: 0 })
    const [direction, setDirection] = useState(0)
    const [visitedTabs, setVisitedTabs] = useState(new Set([activeTab]))
    const [hoveredTab, setHoveredTab] = useState<string | null>(null)
    const [isMobile, setIsMobile] = useState(false)
    
    const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
    const tabBarRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const dragX = useMotionValue(0)

    const activeIndex = useMemo(() => tabs.findIndex(tab => tab.id === activeTab), [tabs, activeTab])

    // Detect mobile viewport
    useEffect(() => {
        if (typeof window === "undefined") return
        
        const checkMobile = () => {
            if (responsiveMode === "mobile") {
                setIsMobile(true)
            } else if (responsiveMode === "desktop") {
                setIsMobile(false)
            } else {
                setIsMobile(window.innerWidth < 768)
            }
        }
        
        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [responsiveMode])

    // Responsive values
    const responsiveTabPaddingVertical = isMobile ? Math.max(12, minTouchTarget / 2 - 10) : tabPaddingVertical
    const responsiveTabPaddingHorizontal = isMobile ? 8 : tabPaddingHorizontal
    const responsiveContentPadding = isMobile ? Math.max(contentPadding * 0.6, 12) : contentPadding
    const responsiveIconSize = isMobile ? mobileIconSize : iconSize
    const responsiveIconGap = isMobile ? 4 : iconGap
    const responsiveTabGap = isMobile ? 0 : tabGap

    // Update indicator position
    useEffect(() => {
        const activeTabElement = tabRefs.current[activeTab]
        if (activeTabElement) {
            const { offsetWidth, offsetLeft } = activeTabElement
            setIndicatorProps({ width: offsetWidth, left: offsetLeft })
            
            // Scroll active tab into view if scrollable
            if (scrollable && tabBarRef.current) {
                const container = tabBarRef.current
                const tabRight = offsetLeft + offsetWidth
                const containerRight = container.scrollLeft + container.clientWidth
                
                if (offsetLeft < container.scrollLeft) {
                    container.scrollTo({ left: offsetLeft - 20, behavior: "smooth" })
                } else if (tabRight > containerRight) {
                    container.scrollTo({ left: tabRight - container.clientWidth + 20, behavior: "smooth" })
                }
            }
        }
    }, [activeTab, tabs, scrollable])

    const handleTabChange = (tabId: string) => {
        const tab = tabs.find(t => t.id === tabId)
        
        // If tab has a link, navigate to it
        if (tab?.link && typeof window !== "undefined") {
            window.open(tab.link, "_blank")
            return
        }
        
        const newIndex = tabs.findIndex(tab => tab.id === tabId)
        setDirection(newIndex > activeIndex ? 1 : -1)
        startTransition(() => {
            setActiveTab(tabId)
            setVisitedTabs(prev => new Set([...prev, tabId]))
        })
        onChange?.(tabId)
        
        // Haptic feedback simulation for mobile
        if (isMobile && typeof window !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate(10)
        }
    }

    const handleDragEnd = (_: any, info: PanInfo) => {
        if (!swipeable) return
        
        const threshold = 50
        const velocity = info.velocity.x
        
        if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 500) {
            if (info.offset.x > 0 && activeIndex > 0) {
                handleTabChange(tabs[activeIndex - 1].id)
            } else if (info.offset.x < 0 && activeIndex < tabs.length - 1) {
                handleTabChange(tabs[activeIndex + 1].id)
            }
        }
        
        dragX.set(0)
    }

    const getIndicatorStyle = (): CSSProperties => {
        const baseStyle: CSSProperties = {
            position: "absolute",
            backgroundColor: indicatorColor,
            [indicatorPosition]: 0,
        }

        switch (indicatorStyle) {
            case "line":
                return {
                    ...baseStyle,
                    height: indicatorHeight,
                    width: indicatorProps.width,
                    left: indicatorProps.left,
                    borderRadius: indicatorBorderRadius,
                }
            case "pill":
                return {
                    ...baseStyle,
                    height: `calc(100% - ${tabPaddingVertical / 2}px)`,
                    width: indicatorProps.width + 16,
                    left: indicatorProps.left - 8,
                    top: tabPaddingVertical / 4,
                    borderRadius: indicatorBorderRadius || 100,
                    opacity: 0.15,
                }
            case "background":
                return {
                    ...baseStyle,
                    height: "100%",
                    width: indicatorProps.width,
                    left: indicatorProps.left,
                    opacity: 0.1,
                    borderRadius: indicatorBorderRadius,
                }
            case "dot":
                return {
                    ...baseStyle,
                    height: indicatorHeight * 2,
                    width: indicatorHeight * 2,
                    left: indicatorProps.left + indicatorProps.width / 2 - indicatorHeight,
                    borderRadius: "50%",
                }
            default:
                return baseStyle
        }
    }

    const getContentVariants = () => {
        switch (transition) {
            case "slide":
                return {
                    enter: (dir: number) => ({
                        x: dir > 0 ? "100%" : "-100%",
                        opacity: 1,
                    }),
                    center: {
                        x: 0,
                        opacity: 1,
                    },
                    exit: (dir: number) => ({
                        x: dir > 0 ? "-100%" : "100%",
                        opacity: 1,
                    }),
                }
            case "fade":
                return {
                    enter: { opacity: 0 },
                    center: { opacity: 1 },
                    exit: { opacity: 0 },
                }
            case "scale":
                return {
                    enter: { scale: 0.9, opacity: 0 },
                    center: { scale: 1, opacity: 1 },
                    exit: { scale: 0.9, opacity: 0 },
                }
            case "none":
                return {
                    enter: { opacity: 1 },
                    center: { opacity: 1 },
                    exit: { opacity: 1 },
                }
            default:
                return {}
        }
    }

    const shouldRenderTab = (tabId: string) => {
        if (keepMounted) return true
        if (!lazy) return true
        return visitedTabs.has(tabId)
    }

    const variants = getContentVariants()
    
    const tabBarOrder = isMobile && mobileLayout === "bottom" ? 1 : 0
    const contentOrder = isMobile && mobileLayout === "bottom" ? 0 : 1

    return (
        <div
            style={{
                ...style,
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                minHeight: 0,
                minWidth: 0,
            }}
        >
            {/* Tab Bar */}
            <div
                ref={tabBarRef}
                style={{
                    position: "relative",
                    display: "flex",
                    gap: responsiveTabGap,
                    backgroundColor: tabBarBackground,
                    borderBottom: mobileLayout === "top" || !isMobile ? `1px solid ${contentBackground}` : "none",
                    borderTop: isMobile && mobileLayout === "bottom" ? `1px solid ${contentBackground}` : "none",
                    overflowX: scrollable && !isMobile ? "auto" : "visible",
                    overflowY: "hidden",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    WebkitOverflowScrolling: "touch",
                    flexShrink: 0,
                    minHeight: isMobile ? minTouchTarget + 8 : minTouchTarget,
                    order: tabBarOrder,
                    boxShadow: isMobile && mobileLayout === "bottom" ? "0 -2px 10px rgba(0,0,0,0.05)" : "none",
                    paddingBottom: isMobile && mobileLayout === "bottom" ? "env(safe-area-inset-bottom, 0px)" : 0,
                }}
            >
                {/* Animated Indicator */}
                {(!isMobile || indicatorStyle !== "dot") && (
                    <motion.div
                        style={getIndicatorStyle()}
                        initial={false}
                        animate={{
                            width: indicatorProps.width + (indicatorStyle === "pill" ? 16 : 0),
                            left: indicatorProps.left + (indicatorStyle === "pill" ? -8 : indicatorStyle === "dot" ? indicatorProps.width / 2 - 3 : 0),
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                        }}
                    />
                )}

                {/* Tab Buttons */}
                {tabs.map((tab) => (
                    <motion.button
                        key={tab.id}
                        ref={(el) => {
                            tabRefs.current[tab.id] = el
                        }}
                        onClick={() => handleTabChange(tab.id)}
                        onHoverStart={() => !isMobile && setHoveredTab(tab.id)}
                        onHoverEnd={() => setHoveredTab(null)}
                        whileHover={!isMobile ? {
                            scale: hoverScale,
                            opacity: activeTab === tab.id ? 1 : hoverOpacity,
                        } : undefined}
                        whileTap={{ scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: "relative",
                            padding: isMobile 
                                ? `${responsiveTabPaddingVertical}px ${responsiveTabPaddingHorizontal}px`
                                : `${tabPaddingVertical}px ${tabPaddingHorizontal}px`,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: activeTab === tab.id ? activeTabColor : tabColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: isMobile ? "column" : "row",
                            gap: isMobile ? 4 : responsiveIconGap,
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                            minHeight: isMobile ? minTouchTarget : minTouchTarget,
                            minWidth: isMobile ? minTouchTarget : "auto",
                            flex: isMobile ? 1 : undefined,
                            ...tabFont,
                            fontSize: isMobile ? 11 : tabFont.fontSize,
                            fontWeight: isMobile && activeTab === tab.id ? 600 : tabFont.fontWeight,
                            opacity: isMobile && activeTab !== tab.id ? 0.6 : 1,
                        }}
                    >
                        {/* Icon with animation */}
                        {tab.iconType !== "none" && (
                            <motion.div
                                animate={{
                                    scale: isMobile && activeTab === tab.id ? 1.1 : 1,
                                    y: isMobile && activeTab === tab.id ? -2 : 0,
                                }}
                                transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 20 }}
                                style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                {tab.iconType === "image" && tab.iconImage?.src ? (
                                    <img 
                                        src={tab.iconImage.src} 
                                        alt={tab.iconImage.alt || tab.label}
                                        style={{ 
                                            width: responsiveIconSize, 
                                            height: responsiveIconSize, 
                                            objectFit: "contain",
                                            flexShrink: 0,
                                        }}
                                    />
                                ) : tab.iconType === "emoji" && tab.icon ? (
                                    <span 
                                        style={{ 
                                            fontSize: responsiveIconSize,
                                            flexShrink: 0,
                                            lineHeight: 1,
                                        }}
                                    >
                                        {tab.icon}
                                    </span>
                                ) : null}
                                
                                {/* Badge on icon for mobile */}
                                {isMobile && tab.badge && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        style={{
                                            position: "absolute",
                                            top: -4,
                                            right: -8,
                                            backgroundColor: badgeBackground,
                                            color: badgeTextColor,
                                            borderRadius: 10,
                                            padding: "2px 5px",
                                            fontSize: 9,
                                            fontWeight: 700,
                                            minWidth: 16,
                                            textAlign: "center",
                                            border: `2px solid ${tabBarBackground}`,
                                        }}
                                    >
                                        {tab.badge}
                                    </motion.span>
                                )}
                            </motion.div>
                        )}
                        
                        {/* Label */}
                        {(!isMobile || mobileShowLabels) && (
                            <span style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: isMobile ? "100%" : undefined,
                                fontSize: isMobile ? 11 : undefined,
                            }}>
                                {tab.label}
                            </span>
                        )}
                        
                        {/* Link indicator (desktop only) */}
                        {!isMobile && tab.link && (
                            <motion.span 
                                animate={{
                                    x: hoveredTab === tab.id ? 2 : 0,
                                    y: hoveredTab === tab.id ? -2 : 0,
                                }}
                                transition={{ duration: 0.2 }}
                                style={{ 
                                    fontSize: responsiveIconSize * 0.8, 
                                    opacity: 0.6,
                                    flexShrink: 0,
                                }}
                            >
                                ↗
                            </motion.span>
                        )}
                        
                        {/* Badge (desktop only) */}
                        {!isMobile && tab.badge && (
                            <motion.span
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 0.2 }}
                                style={{
                                    backgroundColor: badgeBackground,
                                    color: badgeTextColor,
                                    borderRadius: 10,
                                    padding: `2px ${badgePadding}px`,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    minWidth: 18,
                                    textAlign: "center",
                                    flexShrink: 0,
                                }}
                            >
                                {tab.badge}
                            </motion.span>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Content Area */}
            <div
                ref={contentRef}
                style={{
                    position: "relative",
                    flex: 1,
                    overflow: "hidden",
                    backgroundColor: contentBackground,
                    minHeight: 0,
                    order: contentOrder,
                }}
            >
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    {tabs.map((tab) => {
                        if (tab.id !== activeTab) return null
                        if (!shouldRenderTab(tab.id)) return null

                        return (
                            <motion.div
                                key={tab.id}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30,
                                }}
                                drag={swipeable ? "x" : false}
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                onDragEnd={handleDragEnd}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    padding: responsiveContentPadding,
                                    overflow: "auto",
                                    WebkitOverflowScrolling: "touch",
                                    x: dragX,
                                }}
                            >
                                <div style={{ 
                                    fontSize: isMobile ? "clamp(14px, 3.5vw, 15px)" : 15, 
                                    color: "#333",
                                    lineHeight: 1.5,
                                    wordBreak: "break-word",
                                }}>
                                    {tab.content || `Content for ${tab.label}`}
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
        </div>
    )
}

addPropertyControls(AnimatedTabBar, {
    tabs: {
        type: ControlType.Array,
        title: "Tabs",
        control: {
            type: ControlType.Object,
            controls: {
                id: {
                    type: ControlType.String,
                    title: "ID",
                    defaultValue: "tab1",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Tab",
                },
                iconType: {
                    type: ControlType.Enum,
                    title: "Icon Type",
                    options: ["emoji", "image", "none"],
                    optionTitles: ["Emoji", "Image", "None"],
                    defaultValue: "emoji",
                    displaySegmentedControl: true,
                },
                icon: {
                    type: ControlType.String,
                    title: "Emoji Icon",
                    defaultValue: "📄",
                    hidden: (props) => props.iconType !== "emoji",
                },
                iconImage: {
                    type: ControlType.ResponsiveImage,
                    title: "Icon Image",
                    hidden: (props) => props.iconType !== "image",
                },
                badge: {
                    type: ControlType.String,
                    title: "Badge",
                    defaultValue: "",
                },
                link: {
                    type: ControlType.String,
                    title: "Link URL",
                    defaultValue: "",
                    placeholder: "https://example.com",
                },
            },
        },
        defaultValue: [
            {
                id: "home",
                label: "Home",
                iconType: "emoji",
                icon: "🏠",
                badge: "",
            },
            {
                id: "explore",
                label: "Explore",
                iconType: "emoji",
                icon: "🔍",
                badge: "3",
            },
            {
                id: "notifications",
                label: "Notifications",
                iconType: "emoji",
                icon: "🔔",
                badge: "12",
            },
            {
                id: "profile",
                label: "Profile",
                iconType: "emoji",
                icon: "👤",
                badge: "",
            },
        ],
    },
    defaultTab: {
        type: ControlType.String,
        title: "Default Tab",
        defaultValue: "home",
    },
    indicatorStyle: {
        type: ControlType.Enum,
        title: "Indicator Style",
        options: ["line", "pill", "background", "dot"],
        optionTitles: ["Line", "Pill", "Background", "Dot"],
        defaultValue: "line",
        displaySegmentedControl: true,
    },
    indicatorPosition: {
        type: ControlType.Enum,
        title: "Indicator Position",
        options: ["top", "bottom"],
        optionTitles: ["Top", "Bottom"],
        defaultValue: "bottom",
        displaySegmentedControl: true,
    },
    transition: {
        type: ControlType.Enum,
        title: "Transition",
        options: ["slide", "fade", "scale", "none"],
        optionTitles: ["Slide", "Fade", "Scale", "None"],
        defaultValue: "slide",
        displaySegmentedControl: true,
    },
    swipeable: {
        type: ControlType.Boolean,
        title: "Swipeable",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    lazy: {
        type: ControlType.Boolean,
        title: "Lazy Load",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    keepMounted: {
        type: ControlType.Boolean,
        title: "Keep Mounted",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    scrollable: {
        type: ControlType.Boolean,
        title: "Scrollable Tabs",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    responsiveMode: {
        type: ControlType.Enum,
        title: "Responsive Mode",
        options: ["auto", "mobile", "desktop"],
        optionTitles: ["Auto", "Mobile", "Desktop"],
        defaultValue: "auto",
        displaySegmentedControl: true,
    },
    minTouchTarget: {
        type: ControlType.Number,
        title: "Min Touch Target",
        defaultValue: 44,
        min: 32,
        max: 60,
        step: 4,
        unit: "px",
    },
    mobileLayout: {
        type: ControlType.Enum,
        title: "Mobile Layout",
        options: ["bottom", "top"],
        optionTitles: ["Bottom Nav", "Top Nav"],
        defaultValue: "bottom",
        displaySegmentedControl: true,
    },
    mobileShowLabels: {
        type: ControlType.Boolean,
        title: "Mobile Labels",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    mobileIconSize: {
        type: ControlType.Number,
        title: "Mobile Icon Size",
        defaultValue: 24,
        min: 16,
        max: 32,
        step: 2,
        unit: "px",
    },
    tabBarBackground: {
        type: ControlType.Color,
        title: "Tab Bar BG",
        defaultValue: "#FFFFFF",
    },
    tabColor: {
        type: ControlType.Color,
        title: "Tab Color",
        defaultValue: "#666666",
    },
    activeTabColor: {
        type: ControlType.Color,
        title: "Active Tab Color",
        defaultValue: "#000000",
    },
    indicatorColor: {
        type: ControlType.Color,
        title: "Indicator Color",
        defaultValue: "#000000",
    },
    contentBackground: {
        type: ControlType.Color,
        title: "Content BG",
        defaultValue: "#F5F5F5",
    },
    tabFont: {
        type: ControlType.Font,
        title: "Tab Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 15,
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    contentPadding: {
        type: ControlType.Number,
        title: "Content Padding",
        defaultValue: 20,
        min: 0,
        max: 60,
        step: 4,
        unit: "px",
    },
    iconGap: {
        type: ControlType.Number,
        title: "Icon Gap",
        defaultValue: 8,
        min: 0,
        max: 20,
        step: 2,
        unit: "px",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.05,
        min: 1,
        max: 1.2,
        step: 0.01,
    },
    hoverOpacity: {
        type: ControlType.Number,
        title: "Hover Opacity",
        defaultValue: 0.8,
        min: 0.5,
        max: 1,
        step: 0.05,
    },
})
