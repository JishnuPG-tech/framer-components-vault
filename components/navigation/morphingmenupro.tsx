// Morphing Menu - Animated hamburger to close icon with smooth spring transitions
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, startTransition, useEffect } from "react"

interface MenuItem {
    label: string
    link: string
}

interface MorphingMenuProps {
    buttonColor: string
    iconColor: string
    buttonSize: number
    animationSpeed: number
    onToggle: () => void
    previewOpen: boolean
    menuItems: MenuItem[]
    menuPosition: "left" | "right" | "top" | "bottom"
    menuBackgroundColor: string
    menuTextColor: string
    menuWidth: number
    menuItemFont: any
    menuItemSpacing: number
    menuPadding: number
    showMenuOverlay: boolean
    overlayColor: string
    showLogo: boolean
    logoVariant: "image" | "text" | "both"
    logo: { src: string; alt?: string }
    logoText: string
    logoTextFont: any
    logoTextColor: string
    logoSize: number
    showCTA: boolean
    ctaText: string
    ctaLink: string
    ctaBackgroundColor: string
    ctaTextColor: string
    ctaFont: any
    ctaBorderRadius: number
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 44
 * @framerIntrinsicHeight 44
 */
export default function MorphingMenu(props: MorphingMenuProps) {
    const {
        buttonColor = "#d4ff57",
        iconColor = "#0b0b0e",
        buttonSize = 44,
        animationSpeed = 320,
        onToggle,
        previewOpen = false,
        menuItems = [
            { label: "Home", link: "#home" },
            { label: "About", link: "#about" },
            { label: "Services", link: "#services" },
            { label: "Contact", link: "#contact" },
        ],
        menuPosition = "right",
        menuBackgroundColor = "#0b0b0e",
        menuTextColor = "#ffffff",
        menuWidth = 280,
        menuItemFont,
        menuItemSpacing = 24,
        menuPadding = 32,
        showMenuOverlay = true,
        overlayColor = "rgba(0, 0, 0, 0.5)",
        showLogo = true,
        logoVariant = "both",
        logo = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Logo",
        },
        logoText = "Brand",
        logoTextFont,
        logoTextColor = "#ffffff",
        logoSize = 40,
        showCTA = true,
        ctaText = "Get Started",
        ctaLink = "#contact",
        ctaBackgroundColor = "#d4ff57",
        ctaTextColor = "#0b0b0e",
        ctaFont,
        ctaBorderRadius = 8,
    } = props

    const [isOpen, setIsOpen] = useState(previewOpen)
    const [isHovered, setIsHovered] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    // Detect mobile devices and screen size
    useEffect(() => {
        if (typeof window === "undefined") return

        const checkMobile = () => {
            startTransition(() => {
                setIsMobile(window.innerWidth < 768)
            })
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    // Responsive menu width
    const responsiveMenuWidth = isMobile ? Math.min(menuWidth, window.innerWidth * 0.85) : menuWidth

    const handleClick = () => {
        startTransition(() => {
            setIsOpen(!isOpen)
        })
        if (onToggle) {
            onToggle()
        }
    }

    const springTransition = {
        type: "spring" as const,
        stiffness: animationSpeed,
        damping: 26,
    }

    // Line dimensions relative to button size
    const lineWidth = buttonSize * 0.45
    const lineHeight = 2
    const lineSpacing = buttonSize * 0.15

    // Menu animation variants
    const getMenuVariants = () => {
        switch (menuPosition) {
            case "left":
                return {
                    closed: { x: -responsiveMenuWidth },
                    open: { x: 0 },
                }
            case "right":
                return {
                    closed: { x: responsiveMenuWidth },
                    open: { x: 0 },
                }
            case "top":
                return {
                    closed: { y: "-100%" },
                    open: { y: 0 },
                }
            case "bottom":
                return {
                    closed: { y: "100%" },
                    open: { y: 0 },
                }
        }
    }

    const getMenuStyle = () => {
        const baseStyle = {
            position: "fixed" as const,
            backgroundColor: menuBackgroundColor,
            zIndex: 999,
            display: "flex",
            flexDirection: "column" as const,
            padding: isMobile ? Math.min(menuPadding, 24) : menuPadding,
            gap: isMobile ? Math.min(menuItemSpacing, 20) : menuItemSpacing,
            overflowY: "auto" as const,
            WebkitOverflowScrolling: "touch" as const,
        }

        switch (menuPosition) {
            case "left":
                return {
                    ...baseStyle,
                    left: 0,
                    top: 0,
                    height: "100dvh",
                    width: responsiveMenuWidth,
                    maxWidth: "85vw",
                }
            case "right":
                return {
                    ...baseStyle,
                    right: 0,
                    top: 0,
                    height: "100dvh",
                    width: responsiveMenuWidth,
                    maxWidth: "85vw",
                }
            case "top":
                return {
                    ...baseStyle,
                    top: 0,
                    left: 0,
                    width: "100vw",
                    minHeight: "auto",
                    maxHeight: "80vh",
                }
            case "bottom":
                return {
                    ...baseStyle,
                    bottom: 0,
                    left: 0,
                    width: "100vw",
                    minHeight: "auto",
                    maxHeight: "80vh",
                }
        }
    }

    // Responsive font size
    const responsiveFontSize = isMobile 
        ? `${Math.max(14, parseInt(menuItemFont?.fontSize || "18") * 0.85)}px`
        : menuItemFont?.fontSize

    const responsiveLogoSize = isMobile ? Math.min(logoSize, 32) : logoSize
    const responsiveLogoTextSize = isMobile
        ? `${Math.max(16, parseInt(logoTextFont?.fontSize || "20") * 0.85)}px`
        : logoTextFont?.fontSize
    const responsiveCTAFontSize = isMobile
        ? `${Math.max(14, parseInt(ctaFont?.fontSize || "16") * 0.85)}px`
        : ctaFont?.fontSize

    return (
        <>
            {/* Overlay */}
            {showMenuOverlay && (
                <motion.div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: overlayColor,
                        zIndex: 998,
                        pointerEvents: isOpen ? "auto" : "none",
                        touchAction: "none",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isOpen ? 1 : 0 }}
                    transition={springTransition}
                    onClick={handleClick}
                    onTouchEnd={handleClick}
                />
            )}

            {/* Menu Panel */}
            <motion.nav
                style={getMenuStyle()}
                variants={getMenuVariants()}
                initial="closed"
                animate={isOpen ? "open" : "closed"}
                transition={springTransition}
            >
                {/* Logo Section */}
                {showLogo && (
                    <motion.div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            marginBottom: isMobile ? 16 : 24,
                            paddingBottom: isMobile ? 16 : 24,
                            borderBottom: `1px solid ${menuTextColor}20`,
                        }}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{
                            opacity: isOpen ? 1 : 0,
                            y: isOpen ? 0 : -20,
                        }}
                        transition={springTransition}
                    >
                        {(logoVariant === "image" || logoVariant === "both") && (
                            <img
                                src={logo.src}
                                alt={logo.alt || "Logo"}
                                style={{
                                    width: responsiveLogoSize,
                                    height: responsiveLogoSize,
                                    objectFit: "contain",
                                    borderRadius: 4,
                                }}
                            />
                        )}
                        {(logoVariant === "text" || logoVariant === "both") && (
                            <span
                                style={{
                                    color: logoTextColor,
                                    ...logoTextFont,
                                    fontSize: responsiveLogoTextSize,
                                }}
                            >
                                {logoText}
                            </span>
                        )}
                    </motion.div>
                )}

                {menuItems.map((item, index) => (
                    <motion.a
                        key={index}
                        href={item.link}
                        style={{
                            color: menuTextColor,
                            textDecoration: "none",
                            cursor: "pointer",
                            ...menuItemFont,
                            fontSize: responsiveFontSize,
                            WebkitTapHighlightColor: "transparent",
                            touchAction: "manipulation",
                        }}
                        initial={{ opacity: 0, x: menuPosition === "left" ? -20 : menuPosition === "right" ? 20 : 0, y: menuPosition === "top" ? -20 : menuPosition === "bottom" ? 20 : 0 }}
                        animate={{
                            opacity: isOpen ? 1 : 0,
                            x: 0,
                            y: 0,
                        }}
                        transition={{
                            ...springTransition,
                            delay: isOpen ? (index + (showLogo ? 1 : 0)) * 0.05 : 0,
                        }}
                        whileHover={{ x: 4, color: buttonColor }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                            e.preventDefault()
                            handleClick()
                        }}
                    >
                        {item.label}
                    </motion.a>
                ))}

                {/* CTA Button */}
                {showCTA && (
                    <motion.a
                        href={ctaLink}
                        style={{
                            display: "inline-block",
                            backgroundColor: ctaBackgroundColor,
                            color: ctaTextColor,
                            textDecoration: "none",
                            cursor: "pointer",
                            padding: isMobile ? "12px 20px" : "14px 24px",
                            borderRadius: ctaBorderRadius,
                            textAlign: "center",
                            marginTop: isMobile ? 16 : 24,
                            ...ctaFont,
                            fontSize: responsiveCTAFontSize,
                            WebkitTapHighlightColor: "transparent",
                            touchAction: "manipulation",
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                            opacity: isOpen ? 1 : 0,
                            y: isOpen ? 0 : 20,
                        }}
                        transition={{
                            ...springTransition,
                            delay: isOpen ? (menuItems.length + (showLogo ? 1 : 0)) * 0.05 : 0,
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                            e.preventDefault()
                            handleClick()
                        }}
                    >
                        {ctaText}
                    </motion.a>
                )}
            </motion.nav>

            {/* Menu Button */}
            <motion.button
                style={{
                    width: buttonSize,
                    height: buttonSize,
                    backgroundColor: buttonColor,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    padding: 0,
                    outline: "none",
                    zIndex: 1000,
                    WebkitTapHighlightColor: "transparent",
                    touchAction: "manipulation",
                    minWidth: 44, // Minimum touch target size
                    minHeight: 44,
                }}
                animate={{
                    borderRadius: isHovered || isOpen ? "12px" : "50%",
                    boxShadow:
                        isHovered || isOpen
                            ? `0 0 20px ${buttonColor}4D`
                            : "0 0 0px rgba(0,0,0,0)",
                }}
                transition={springTransition}
                onClick={handleClick}
                onMouseEnter={() => !isMobile && startTransition(() => setIsHovered(true))}
                onMouseLeave={() => !isMobile && startTransition(() => setIsHovered(false))}
                whileTap={{ scale: 0.95 }}
                aria-label={isOpen ? "Close menu" : "Open menu"}
                aria-expanded={isOpen}
            >
                {/* Top line */}
                <motion.div
                    style={{
                        position: "absolute",
                        width: lineWidth,
                        height: lineHeight,
                        backgroundColor: iconColor,
                        borderRadius: lineHeight / 2,
                    }}
                    animate={{
                        rotate: isOpen ? 45 : 0,
                        y: isOpen ? 0 : -lineSpacing,
                    }}
                    transition={springTransition}
                />

                {/* Bottom line */}
                <motion.div
                    style={{
                        position: "absolute",
                        width: lineWidth,
                        height: lineHeight,
                        backgroundColor: iconColor,
                        borderRadius: lineHeight / 2,
                    }}
                    animate={{
                        rotate: isOpen ? -45 : 0,
                        y: isOpen ? 0 : lineSpacing,
                    }}
                    transition={springTransition}
                />
            </motion.button>
        </>
    )
}

addPropertyControls(MorphingMenu, {
    previewOpen: {
        type: ControlType.Boolean,
        title: "Preview Open",
        defaultValue: false,
        enabledTitle: "Open",
        disabledTitle: "Closed",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button Color",
        defaultValue: "#d4ff57",
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#0b0b0e",
    },
    buttonSize: {
        type: ControlType.Number,
        title: "Button Size",
        defaultValue: 44,
        min: 32,
        max: 80,
        step: 1,
        unit: "px",
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Animation Speed",
        defaultValue: 320,
        min: 200,
        max: 500,
        step: 10,
    },
    showLogo: {
        type: ControlType.Boolean,
        title: "Show Logo",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    logoVariant: {
        type: ControlType.Enum,
        title: "Logo Type",
        options: ["image", "text", "both"],
        optionTitles: ["Image Only", "Text Only", "Image + Text"],
        defaultValue: "both",
        displaySegmentedControl: true,
        hidden: ({ showLogo }) => !showLogo,
    },
    logo: {
        type: ControlType.ResponsiveImage,
        title: "Logo Image",
        hidden: ({ showLogo, logoVariant }) => !showLogo || logoVariant === "text",
    },
    logoSize: {
        type: ControlType.Number,
        title: "Logo Size",
        defaultValue: 40,
        min: 24,
        max: 80,
        step: 4,
        unit: "px",
        hidden: ({ showLogo, logoVariant }) => !showLogo || logoVariant === "text",
    },
    logoText: {
        type: ControlType.String,
        title: "Logo Text",
        defaultValue: "Brand",
        hidden: ({ showLogo, logoVariant }) => !showLogo || logoVariant === "image",
    },
    logoTextFont: {
        type: ControlType.Font,
        title: "Logo Text Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "20px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
        hidden: ({ showLogo, logoVariant }) => !showLogo || logoVariant === "image",
    },
    logoTextColor: {
        type: ControlType.Color,
        title: "Logo Text Color",
        defaultValue: "#ffffff",
        hidden: ({ showLogo, logoVariant }) => !showLogo || logoVariant === "image",
    },
    menuItems: {
        type: ControlType.Array,
        title: "Menu Items",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Menu Item",
                },
                link: {
                    type: ControlType.String,
                    title: "Link",
                    defaultValue: "#",
                },
            },
        },
        defaultValue: [
            { label: "Home", link: "#home" },
            { label: "About", link: "#about" },
            { label: "Services", link: "#services" },
            { label: "Contact", link: "#contact" },
        ],
    },
    menuPosition: {
        type: ControlType.Enum,
        title: "Menu Position",
        options: ["left", "right", "top", "bottom"],
        optionTitles: ["Left", "Right", "Top", "Bottom"],
        defaultValue: "right",
        displaySegmentedControl: true,
    },
    menuBackgroundColor: {
        type: ControlType.Color,
        title: "Menu Background",
        defaultValue: "#0b0b0e",
    },
    menuTextColor: {
        type: ControlType.Color,
        title: "Menu Text Color",
        defaultValue: "#ffffff",
    },
    menuWidth: {
        type: ControlType.Number,
        title: "Menu Width",
        defaultValue: 280,
        min: 200,
        max: 500,
        step: 10,
        unit: "px",
        hidden: ({ menuPosition }) => menuPosition === "top" || menuPosition === "bottom",
    },
    menuItemFont: {
        type: ControlType.Font,
        title: "Menu Item Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    menuItemSpacing: {
        type: ControlType.Number,
        title: "Item Spacing",
        defaultValue: 24,
        min: 8,
        max: 48,
        step: 4,
        unit: "px",
    },
    menuPadding: {
        type: ControlType.Number,
        title: "Menu Padding",
        defaultValue: 32,
        min: 16,
        max: 64,
        step: 4,
        unit: "px",
    },
    showCTA: {
        type: ControlType.Boolean,
        title: "Show CTA",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    ctaText: {
        type: ControlType.String,
        title: "CTA Text",
        defaultValue: "Get Started",
        hidden: ({ showCTA }) => !showCTA,
    },
    ctaLink: {
        type: ControlType.String,
        title: "CTA Link",
        defaultValue: "#contact",
        hidden: ({ showCTA }) => !showCTA,
    },
    ctaBackgroundColor: {
        type: ControlType.Color,
        title: "CTA Background",
        defaultValue: "#d4ff57",
        hidden: ({ showCTA }) => !showCTA,
    },
    ctaTextColor: {
        type: ControlType.Color,
        title: "CTA Text Color",
        defaultValue: "#0b0b0e",
        hidden: ({ showCTA }) => !showCTA,
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
        hidden: ({ showCTA }) => !showCTA,
    },
    ctaBorderRadius: {
        type: ControlType.Number,
        title: "CTA Radius",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
        hidden: ({ showCTA }) => !showCTA,
    },
    showMenuOverlay: {
        type: ControlType.Boolean,
        title: "Show Overlay",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        defaultValue: "rgba(0, 0, 0, 0.5)",
        hidden: ({ showMenuOverlay }) => !showMenuOverlay,
    },
    onToggle: {
        type: ControlType.EventHandler,
    },
})
