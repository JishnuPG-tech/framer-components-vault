// Sticky Announcement Bar Pack with variants: plain text, countdown, free-shipping threshold, or news ticker
import { useState, useEffect, useCallback, useMemo, startTransition, type CSSProperties } from "react"
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

interface AnnouncementBarProps {
    variant: "plain" | "countdown" | "shipping" | "ticker"
    message: string
    countdownTarget: string
    shippingThreshold: number
    shippingCurrent: number
    tickerItems: string[]
    backgroundColor: string
    textColor: string
    font: any
    showShadow: boolean
    showCloseButton: boolean
    closeButtonStyle: "x" | "cross" | "circle"
    animationDuration: number
    enableAnimation: boolean
    entranceAnimation: "slide-down" | "fade-in" | "scale-in" | "slide-fade" | "scale-fade"
    customCSS: string
    backgroundPattern: "none" | "dots" | "grid" | "diagonal" | "waves" | "noise"
    patternOpacity: number
    patternScale: number
    patternColor: string
    zIndex: number
    autoDisappear: boolean
    disappearAfter: number
    enableScheduling: boolean
    scheduleType: "once" | "daily" | "weekly" | "monthly"
    startDate: string
    endDate: string
    startTime: string
    endTime: string
    daysOfWeek: string[]
    dayOfMonth: number
    timezone: string
    enableUserTargeting: boolean
    targetAuthStatus: "any" | "authenticated" | "unauthenticated"
    targetUserRoles: string[]
    currentUserRole: string
    isUserAuthenticated: boolean
    hideForRoles: string[]
    showOnlyForRoles: string[]
    style?: CSSProperties
}

/**
 * Sticky Announcement Bar Pack
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 60
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function AnnouncementBar(props: AnnouncementBarProps) {
    const {
        variant = "plain",
        message = "🎉 Special offer: 20% off everything! Use code SAVE20",
        countdownTarget = "2024-12-31T23:59:59",
        shippingThreshold = 50,
        shippingCurrent = 25,
        tickerItems = ["Breaking: New product launch", "Limited time offer", "Free shipping worldwide"],
        backgroundColor = "#000000",
        textColor = "#FFFFFF",
        font,
        showShadow = true,
        showCloseButton = true,
        closeButtonStyle = "x",
        animationDuration = 0.5,
        enableAnimation = true,
        entranceAnimation = "slide-down",
        customCSS = "",
        backgroundPattern = "none",
        patternOpacity = 0.1,
        patternScale = 1,
        patternColor = "#FFFFFF",
        zIndex = 1000,
        autoDisappear = false,
        disappearAfter = 30,
    } = props

    const [isVisible, setIsVisible] = useState(true)
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
    const [currentTickerIndex, setCurrentTickerIndex] = useState(0)
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

    const shouldAnimate = enableAnimation && !prefersReducedMotion

    // Auto disappear timer
    useEffect(() => {
        if (!autoDisappear || !isVisible) return

        const timer = setTimeout(() => {
            startTransition(() => {
                setIsVisible(false)
            })
        }, disappearAfter * 1000)

        return () => clearTimeout(timer)
    }, [autoDisappear, disappearAfter, isVisible])

    // Check for reduced motion preference
    useEffect(() => {
        if (typeof window !== "undefined") {
            const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
            setPrefersReducedMotion(mediaQuery.matches)
            
            const handleChange = (e: MediaQueryListEvent) => {
                setPrefersReducedMotion(e.matches)
            }
            
            mediaQuery.addEventListener("change", handleChange)
            return () => mediaQuery.removeEventListener("change", handleChange)
        }
    }, [])

    // Countdown timer
    useEffect(() => {
        if (variant !== "countdown") return

        const updateCountdown = () => {
            const target = new Date(countdownTarget).getTime()
            const now = new Date().getTime()
            const difference = target - now

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24))
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
                const seconds = Math.floor((difference % (1000 * 60)) / 1000)

                startTransition(() => {
                    setTimeLeft({ days, hours, minutes, seconds })
                })
            } else {
                startTransition(() => {
                    setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
                })
            }
        }

        updateCountdown()
        const interval = setInterval(updateCountdown, 1000)
        return () => clearInterval(interval)
    }, [variant, countdownTarget])

    // News ticker rotation
    useEffect(() => {
        if (variant !== "ticker" || tickerItems.length <= 1) return

        const interval = setInterval(() => {
            startTransition(() => {
                setCurrentTickerIndex((prev) => (prev + 1) % tickerItems.length)
            })
        }, 3000)

        return () => clearInterval(interval)
    }, [variant, tickerItems.length])

    const handleClose = useCallback(() => {
        startTransition(() => {
            setIsVisible(false)
        })
    }, [])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleClose()
        }
    }, [handleClose])

    const renderContent = useMemo(() => {
        switch (variant) {
            case "countdown":
                const countdownText = `${message} ${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`
                return countdownText

            case "shipping":
                const remaining = Math.max(0, shippingThreshold - shippingCurrent)
                if (remaining === 0) {
                    return "🎉 You qualify for free shipping!"
                }
                return `🚚 Add $${remaining.toFixed(2)} more for free shipping!`

            case "ticker":
                return tickerItems[currentTickerIndex] || "No news items"

            default:
                return message
        }
    }, [variant, message, timeLeft, shippingThreshold, shippingCurrent, tickerItems, currentTickerIndex])

    const renderCloseButton = () => {
        if (!showCloseButton) return null

        const iconSize = 16
        let icon

        switch (closeButtonStyle) {
            case "cross":
                icon = (
                    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                )
                break
            case "circle":
                icon = (
                    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                        <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                )
                break
            default:
                icon = (
                    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                )
        }

        return (
            <motion.button
                onClick={handleClose}
                onKeyDown={handleKeyDown}
                style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: textColor,
                    cursor: "pointer",
                    padding: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "8px",
                    opacity: 0.9,
                    marginLeft: "20px",
                    backdropFilter: "blur(8px)",
                    transition: "all 0.2s ease",
                }}
                whileHover={{
                    scale: 1.05,
                    opacity: 1,
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                }}
                whileTap={{
                    scale: 0.98,
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                }}
                transition={{
                    duration: 0.15,
                    ease: "easeOut"
                }}
                aria-label="Close announcement"
                type="button"
            >
                {icon}
            </motion.button>
        )
    }

    const getAnimationVariants = useMemo(() => {
        if (!shouldAnimate) {
            return {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 }
            }
        }

        switch (entranceAnimation) {
            case "fade-in":
                return {
                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                    exit: { opacity: 0 }
                }
            
            case "scale-in":
                return {
                    initial: { scale: 0.8, opacity: 0 },
                    animate: { scale: 1, opacity: 1 },
                    exit: { scale: 0.8, opacity: 0 }
                }
            
            case "slide-fade":
                return {
                    initial: { y: -100, opacity: 0 },
                    animate: { y: 0, opacity: 1 },
                    exit: { y: -100, opacity: 0 }
                }
            
            case "scale-fade":
                return {
                    initial: { scale: 0.9, y: -20, opacity: 0 },
                    animate: { scale: 1, y: 0, opacity: 1 },
                    exit: { scale: 0.9, y: -20, opacity: 0 }
                }
            
            case "slide-down":
            default:
                return {
                    initial: { y: -100, opacity: 0 },
                    animate: { y: 0, opacity: 1 },
                    exit: { y: -100, opacity: 0 }
                }
        }
    }, [shouldAnimate, entranceAnimation])

    const parseCustomCSS = useMemo(() => {
        if (!customCSS) return {}
        
        try {
            // Simple CSS parser for basic properties
            const styles: Record<string, any> = {}
            const declarations = customCSS.split(';').filter(decl => decl.trim())
            
            declarations.forEach(decl => {
                const [property, value] = decl.split(':').map(s => s.trim())
                if (property && value) {
                    // Convert kebab-case to camelCase
                    const camelProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
                    styles[camelProperty] = value
                }
            })
            
            return styles as CSSProperties
        } catch {
            return {}
        }
    }, [customCSS])

    const getPatternSVG = useMemo(() => {
        if (backgroundPattern === "none") return null

        const size = 20 * patternScale
        const color = patternColor
        const opacity = patternOpacity

        switch (backgroundPattern) {
            case "dots":
                return `data:image/svg+xml,${encodeURIComponent(`
                    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="${size/2}" cy="${size/2}" r="2" fill="${color}" opacity="${opacity}"/>
                    </svg>
                `)}`

            case "grid":
                return `data:image/svg+xml,${encodeURIComponent(`
                    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                        <path d="M 0 0 L 0 ${size} M 0 0 L ${size} 0" stroke="${color}" stroke-width="1" opacity="${opacity}"/>
                    </svg>
                `)}`

            case "diagonal":
                return `data:image/svg+xml,${encodeURIComponent(`
                    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                        <path d="M 0 ${size} L ${size} 0" stroke="${color}" stroke-width="1" opacity="${opacity}"/>
                    </svg>
                `)}`

            case "waves":
                return `data:image/svg+xml,${encodeURIComponent(`
                    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                        <path d="M 0 ${size/2} Q ${size/4} ${size/4} ${size/2} ${size/2} T ${size} ${size/2}" stroke="${color}" stroke-width="1" fill="none" opacity="${opacity}"/>
                    </svg>
                `)}`

            case "noise":
                return `data:image/svg+xml,${encodeURIComponent(`
                    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="3" cy="7" r="0.5" fill="${color}" opacity="${opacity}"/>
                        <circle cx="12" cy="4" r="0.5" fill="${color}" opacity="${opacity}"/>
                        <circle cx="8" cy="15" r="0.5" fill="${color}" opacity="${opacity}"/>
                        <circle cx="16" cy="11" r="0.5" fill="${color}" opacity="${opacity}"/>
                        <circle cx="5" cy="18" r="0.5" fill="${color}" opacity="${opacity}"/>
                    </svg>
                `)}`

            default:
                return null
        }
    }, [backgroundPattern, patternScale, patternColor, patternOpacity])

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={getAnimationVariants.initial}
                    animate={getAnimationVariants.animate}
                    exit={getAnimationVariants.exit}
                    transition={{ 
                        duration: prefersReducedMotion ? 0.2 : animationDuration,
                        ease: entranceAnimation === "scale-in" || entranceAnimation === "scale-fade" ? "easeOut" : "easeOut"
                    }}
                    style={{
                        position: "relative",
                        width: "100%",
                        backgroundColor,
                        color: textColor,
                        padding: "16px 24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: showShadow ? "0 4px 20px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)" : "none",
                        backdropFilter: backgroundColor.includes("rgba") ? "blur(12px)" : "none",
                        minHeight: "64px",
                        zIndex,
                        backgroundImage: getPatternSVG ? `url("${getPatternSVG}")` : "none",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                        background: backgroundColor.includes("rgba") 
                            ? `linear-gradient(135deg, ${backgroundColor}, ${backgroundColor}dd)`
                            : `linear-gradient(135deg, ${backgroundColor}, ${backgroundColor}ee)`,
                        ...parseCustomCSS,
                        ...props.style,
                    }}
                    role="banner"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    <div
                        style={{
                            flex: 1,
                            textAlign: "center",
                            fontSize: "15px",
                            fontWeight: 600,
                            lineHeight: "1.5",
                            maxWidth: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: variant === "ticker" ? "nowrap" : "normal",
                            letterSpacing: "-0.01em",
                            textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                            ...font,
                        }}
                    >
                        {variant === "ticker" ? (
                            <motion.span
                                key={currentTickerIndex}
                                initial={shouldAnimate ? { opacity: 0, y: 10 } : { opacity: 1 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={shouldAnimate ? { opacity: 0, y: -10 } : { opacity: 1 }}
                                transition={{ duration: prefersReducedMotion ? 0.1 : 0.3 }}
                            >
                                {renderContent}
                            </motion.span>
                        ) : (
                            renderContent
                        )}
                    </div>
                    {renderCloseButton()}
                </motion.div>
            )}
        </AnimatePresence>
    )
}

addPropertyControls(AnnouncementBar, {
    variant: {
        type: ControlType.Enum,
        title: "Variant",
        options: ["plain", "countdown", "shipping", "ticker"],
        optionTitles: ["Plain Text", "Countdown", "Free Shipping", "News Ticker"],
        defaultValue: "plain",
        displaySegmentedControl: true,
    },
    message: {
        type: ControlType.String,
        title: "Message",
        defaultValue: "🎉 Special offer: 20% off everything! Use code SAVE20",
        displayTextArea: true,
        hidden: ({ variant }) => variant !== "plain" && variant !== "countdown",
    },
    countdownTarget: {
        type: ControlType.String,
        title: "Target Date",
        defaultValue: "2024-12-31T23:59:59",
        placeholder: "YYYY-MM-DDTHH:MM:SS",
        hidden: ({ variant }) => variant !== "countdown",
    },
    shippingThreshold: {
        type: ControlType.Number,
        title: "Free Shipping Threshold",
        defaultValue: 50,
        min: 0,
        step: 1,
        unit: "$",
        hidden: ({ variant }) => variant !== "shipping",
    },
    shippingCurrent: {
        type: ControlType.Number,
        title: "Current Cart Value",
        defaultValue: 25,
        min: 0,
        step: 1,
        unit: "$",
        hidden: ({ variant }) => variant !== "shipping",
    },
    tickerItems: {
        type: ControlType.Array,
        title: "News Items",
        control: {
            type: ControlType.String,
            placeholder: "Enter news item...",
        },
        defaultValue: ["Breaking: New product launch", "Limited time offer", "Free shipping worldwide"],
        maxCount: 10,
        hidden: ({ variant }) => variant !== "ticker",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.4em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    showShadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showCloseButton: {
        type: ControlType.Boolean,
        title: "Close Button",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    closeButtonStyle: {
        type: ControlType.Enum,
        title: "Close Icon",
        options: ["x", "cross", "circle"],
        optionTitles: ["X", "Cross", "Circle"],
        defaultValue: "x",
        hidden: ({ showCloseButton }) => !showCloseButton,
    },
    enableAnimation: {
        type: ControlType.Boolean,
        title: "Animation",
        defaultValue: true,
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 0.5,
        min: 0.1,
        max: 2,
        step: 0.1,
        unit: "s",
        hidden: ({ enableAnimation }) => !enableAnimation,
    },
    entranceAnimation: {
        type: ControlType.Enum,
        title: "Entrance Animation",
        options: ["slide-down", "fade-in", "scale-in", "slide-fade", "scale-fade"],
        optionTitles: ["Slide Down", "Fade In", "Scale In", "Slide & Fade", "Scale & Fade"],
        defaultValue: "slide-down",
        hidden: ({ enableAnimation }) => !enableAnimation,
    },
    customCSS: {
        type: ControlType.String,
        title: "Custom CSS",
        placeholder: "color: red; border: 1px solid blue;",
        displayTextArea: true,
    },
    backgroundPattern: {
        type: ControlType.Enum,
        title: "Background Pattern",
        options: ["none", "dots", "grid", "diagonal", "waves", "noise"],
        optionTitles: ["None", "Dots", "Grid", "Diagonal", "Waves", "Noise"],
        defaultValue: "none",
    },
    patternOpacity: {
        type: ControlType.Number,
        title: "Pattern Opacity",
        defaultValue: 0.1,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: ({ backgroundPattern }) => backgroundPattern === "none",
    },
    patternScale: {
        type: ControlType.Number,
        title: "Pattern Scale",
        defaultValue: 1,
        min: 0.5,
        max: 3,
        step: 0.1,
        hidden: ({ backgroundPattern }) => backgroundPattern === "none",
    },
    patternColor: {
        type: ControlType.Color,
        title: "Pattern Color",
        defaultValue: "#FFFFFF",
        hidden: ({ backgroundPattern }) => backgroundPattern === "none",
    },
    zIndex: {
        type: ControlType.Number,
        title: "Z-Index",
        defaultValue: 1000,
        min: 0,
        max: 9999,
        step: 1,
    },
    autoDisappear: {
        type: ControlType.Boolean,
        title: "Auto Disappear",
        defaultValue: false,
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
    },
    disappearAfter: {
        type: ControlType.Number,
        title: "Disappear After",
        defaultValue: 30,
        min: 1,
        max: 300,
        step: 1,
        unit: "s",
        hidden: ({ autoDisappear }) => !autoDisappear,
    },
})