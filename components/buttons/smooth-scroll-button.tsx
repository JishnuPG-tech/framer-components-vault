// Scroll Controller Component - A floating scroll controller with up/down arrow buttons
// that can be positioned anywhere on the page using absolute positioning
// Each button scrolls the page by a configurable amount

import { useState, useEffect, useCallback, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ScrollButtonsProps {
    scrollAmount: number
    buttonSize: number
    backgroundColor: string
    iconColor: string
    hoverBackgroundColor: string
    hoverIconColor: string
    borderRadius: number
    shadow: boolean
    spacing: number
    animationDuration: number
    bounceIntensity: number
    stackDirection: "vertical" | "horizontal"
    style?: CSSProperties
}

/**
 * Scroll Controller
 * 
 * A floating scroll controller with up/down arrow buttons that can scroll the page.
 * Can be positioned anywhere using absolute positioning.
 *
 * @framerIntrinsicWidth 60
 * @framerIntrinsicHeight 130
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ScrollButtons(props: ScrollButtonsProps) {
    const {
        scrollAmount = 300,
        buttonSize = 50,
        backgroundColor = "#F5F5F5",
        iconColor = "#000000",
        hoverBackgroundColor = "#EEEEEE",
        hoverIconColor = "#000000",
        borderRadius = 25,
        shadow = true,
        spacing = 10,
        animationDuration = 300,
        bounceIntensity = 1.70158,
        stackDirection = "vertical",
        style,
    } = props

    const [isScrollingUp, setIsScrollingUp] = useState(false)
    const [isScrollingDown, setIsScrollingDown] = useState(false)
    const [canScrollUp, setCanScrollUp] = useState(false)
    const [canScrollDown, setCanScrollDown] = useState(true)
    const isStatic = useIsStaticRenderer()

    // Check scroll position to enable/disable buttons
    const checkScrollPosition = useCallback(() => {
        if (typeof window === "undefined") return

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        const scrollHeight = document.documentElement.scrollHeight
        const clientHeight = document.documentElement.clientHeight

        startTransition(() => {
            setCanScrollUp(scrollTop > 0)
            setCanScrollDown(scrollTop < scrollHeight - clientHeight - 10)
        })
    }, [])

    // Smooth scroll function
    const smoothScroll = useCallback((direction: "up" | "down") => {
        if (typeof window === "undefined") return

        const currentScroll = window.pageYOffset || document.documentElement.scrollTop
        const targetScroll = direction === "up" 
            ? Math.max(0, currentScroll - scrollAmount)
            : currentScroll + scrollAmount

        // Enhanced smooth scrolling with custom easing
        const startTime = performance.now()
        const startScroll = currentScroll
        const distance = targetScroll - startScroll
        
        // Apple-like easing function with subtle bounce
        const easeOutBack = (t: number): number => {
            const c1 = bounceIntensity
            const c3 = c1 + 1
            return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
        }

        const animateScroll = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / animationDuration, 1)
            
            const easedProgress = easeOutBack(progress)
            const newScroll = startScroll + (distance * easedProgress)
            
            window.scrollTo(0, newScroll)
            
            if (progress < 1) {
                requestAnimationFrame(animateScroll)
            }
        }

        requestAnimationFrame(animateScroll)

        // Set animation state
        if (direction === "up") {
            startTransition(() => setIsScrollingUp(true))
            setTimeout(() => startTransition(() => setIsScrollingUp(false)), animationDuration)
        } else {
            startTransition(() => setIsScrollingDown(true))
            setTimeout(() => startTransition(() => setIsScrollingDown(false)), animationDuration)
        }
    }, [scrollAmount, animationDuration, bounceIntensity])

    // Handle scroll events
    useEffect(() => {
        if (isStatic) return

        checkScrollPosition()
        
        const handleScroll = () => {
            checkScrollPosition()
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        window.addEventListener("resize", checkScrollPosition)

        return () => {
            window.removeEventListener("scroll", handleScroll)
            window.removeEventListener("resize", checkScrollPosition)
        }
    }, [checkScrollPosition, isStatic])

    // Calculate container dimensions based on stack direction
    const containerWidth = stackDirection === "vertical" ? 
        Math.max(buttonSize, 5) : 
        Math.max(buttonSize * 2 + spacing, 5)
    
    const containerHeight = stackDirection === "vertical" ? 
        Math.max(buttonSize * 2 + spacing, 5) : 
        Math.max(buttonSize, 5)

    // Container style with explicit width and height
    const containerStyle: CSSProperties = {
        ...style,
        position: "relative",
        zIndex: 9999,
        width: containerWidth,
        height: containerHeight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    }

    const buttonStyle: CSSProperties = {
        width: buttonSize,
        height: buttonSize,
        borderRadius: borderRadius,
        backgroundColor: backgroundColor,
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: `all ${animationDuration}ms ease`,
        boxShadow: shadow ? "0 2px 8px rgba(0, 0, 0, 0.15)" : "none",
        outline: "none",
    }

    const getButtonHoverStyle = (isActive: boolean): CSSProperties => ({
        backgroundColor: isActive ? hoverBackgroundColor : backgroundColor,
        transform: isActive ? "scale(0.95)" : "scale(1)",
    })

    const iconStyle: CSSProperties = {
        width: buttonSize * 0.4,
        height: buttonSize * 0.4,
        transition: `color ${animationDuration}ms ease`,
    }

    if (isStatic) {
        return (
            <div style={containerStyle}>
                <div style={{ display: "flex", flexDirection: stackDirection === "vertical" ? "column" : "row", gap: spacing }}>
                    <button style={buttonStyle} disabled>
                        <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2">
                            <path d="M18 15l-6-6-6 6" />
                        </svg>
                    </button>
                    <button style={buttonStyle} disabled>
                        <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2">
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div style={containerStyle}>
            <div style={{ display: "flex", flexDirection: stackDirection === "vertical" ? "column" : "row", gap: spacing }}>
                {/* Up Button */}
                <button
                    style={{
                        ...buttonStyle,
                        ...getButtonHoverStyle(isScrollingUp),
                        opacity: canScrollUp ? 1 : 0.5,
                        cursor: canScrollUp ? "pointer" : "not-allowed",
                    }}
                    onClick={() => canScrollUp && smoothScroll("up")}
                    disabled={!canScrollUp}
                    onMouseEnter={(e) => {
                        if (canScrollUp) {
                            e.currentTarget.style.backgroundColor = hoverBackgroundColor
                            const icon = e.currentTarget.querySelector("svg")
                            if (icon) icon.style.stroke = hoverIconColor
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = backgroundColor
                        const icon = e.currentTarget.querySelector("svg")
                        if (icon) icon.style.stroke = iconColor
                    }}
                    aria-label="Scroll up"
                >
                    <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2">
                        <path d="M18 15l-6-6-6 6" />
                    </svg>
                </button>

                {/* Down Button */}
                <button
                    style={{
                        ...buttonStyle,
                        ...getButtonHoverStyle(isScrollingDown),
                        opacity: canScrollDown ? 1 : 0.5,
                        cursor: canScrollDown ? "pointer" : "not-allowed",
                    }}
                    onClick={() => canScrollDown && smoothScroll("down")}
                    disabled={!canScrollDown}
                    onMouseEnter={(e) => {
                        if (canScrollDown) {
                            e.currentTarget.style.backgroundColor = hoverBackgroundColor
                            const icon = e.currentTarget.querySelector("svg")
                            if (icon) icon.style.stroke = hoverIconColor
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = backgroundColor
                        const icon = e.currentTarget.querySelector("svg")
                        if (icon) icon.style.stroke = iconColor
                    }}
                    aria-label="Scroll down"
                >
                    <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2">
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </button>
            </div>
        </div>
    )
}

addPropertyControls(ScrollButtons, {
    stackDirection: {
        type: ControlType.Enum,
        title: "Stack Direction",
        options: ["vertical", "horizontal"],
        optionTitles: ["Vertical", "Horizontal"],
        defaultValue: "vertical",
        displaySegmentedControl: true,
    },
    scrollAmount: {
        type: ControlType.Number,
        title: "Scroll Amount",
        defaultValue: 300,
        min: 50,
        max: 1000,
        step: 50,
        unit: "px",
    },
    buttonSize: {
        type: ControlType.Number,
        title: "Button Size",
        defaultValue: 50,
        min: 30,
        max: 80,
        step: 5,
        unit: "px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#F5F5F5",
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#000000",
    },
    hoverBackgroundColor: {
        type: ControlType.Color,
        title: "Hover Background",
        defaultValue: "#EEEEEE",
    },
    hoverIconColor: {
        type: ControlType.Color,
        title: "Hover Icon Color",
        defaultValue: "#000000",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 25,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    shadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    spacing: {
        type: ControlType.Number,
        title: "Button Spacing",
        defaultValue: 10,
        min: 0,
        max: 30,
        step: 2,
        unit: "px",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 300,
        min: 100,
        max: 1000,
        step: 50,
        unit: "ms",
    },
    bounceIntensity: {
        type: ControlType.Number,
        title: "Bounce Intensity",
        defaultValue: 1.70158,
        min: 0.1,
        max: 5,
        step: 0.1,
        unit: "",
    },
})