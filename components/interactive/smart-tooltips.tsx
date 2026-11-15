// Advanced Tooltip component with customizable icon, styling, and smart positioning
import { useState, useRef, useEffect, useCallback, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface TooltipProps {
    button: {
        icon: {
            svg: string
            color: string
            hoverColor: string
            size: number
        }
        backgroundColor: string
        rotation: number
        borderRadius: string
        border: {
            width: number
            color: string
        }
        shadow: {
            color: string
            x: number
            y: number
            blur: number
            spread: number
        }
        hoverEffect: {
            scale: number
            opacity: number
            blur: number
            rotate: number
            skewX: number
            skewY: number
            backgroundColor: string
            borderWidth: number
            borderColor: string
            transition: any
        }
    }
    tooltip: {
        text: string
        backgroundColor: string
        textColor: string
        maxWidth: number
        font: any
        position: "bottom" | "right"
        borderRadius: string
        shadow: {
            color: string
            x: number
            y: number
            blur: number
            spread: number
        }
    }
    triggerType: "click" | "hover"
    preview: boolean
    style?: CSSProperties
}

/**
 * Advanced Tooltip
 *
 * @framerIntrinsicWidth 20
 * @framerIntrinsicHeight 20
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
function SmartTooltips(props: TooltipProps) {
    const {
        button,
        tooltip,
        triggerType,
        preview,
    } = props

    const [isVisible, setIsVisible] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const [isPinned, setIsPinned] = useState(false)
    const [viewportWidth, setViewportWidth] = useState(800)

    // Track viewport width
    useEffect(() => {
        if (typeof window !== "undefined") {
            const updateViewportWidth = () => {
                startTransition(() => setViewportWidth(window.innerWidth))
            }
            
            updateViewportWidth()
            window.addEventListener("resize", updateViewportWidth)
            return () => window.removeEventListener("resize", updateViewportWidth)
        }
    }, [])

    // Update visibility when preview changes
    useEffect(() => {
        if (preview) {
            startTransition(() => setIsVisible(true))
            startTransition(() => setIsHovered(true))
        } else {
            startTransition(() => setIsVisible(false))
            startTransition(() => setIsHovered(false))
        }
    }, [preview])

    const [position, setPosition] = useState({ top: 0, left: 0, placement: "bottom" as "top" | "bottom" | "left" | "right" })
    const buttonRef = useRef<HTMLDivElement>(null)
    const tooltipRef = useRef<HTMLDivElement>(null)

    const calculatePosition = useCallback(() => {
        if (!buttonRef.current || !tooltipRef.current || typeof window === "undefined") return

        const buttonRect = buttonRef.current.getBoundingClientRect()
        const tooltipRect = tooltipRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight

        let top = 0
        let left = 0
        let placement: "top" | "bottom" | "left" | "right" = props.tooltip.position

        // Use the selected tooltip position as the primary placement
        if (props.tooltip.position === "right") {
            // Try right first
            if (buttonRect.right + tooltipRect.width + 8 <= viewportWidth) {
                top = buttonRect.top + (buttonRect.height - tooltipRect.height) / 2
                left = buttonRect.right + 8
                placement = "right"
            }
            // Fallback to left if right doesn't fit
            else if (buttonRect.left - tooltipRect.width - 8 >= 0) {
                top = buttonRect.top + (buttonRect.height - tooltipRect.height) / 2
                left = buttonRect.left - tooltipRect.width - 8
                placement = "left"
            }
            // Fallback to bottom if neither horizontal position fits
            else {
                top = buttonRect.bottom + 8
                left = buttonRect.left + (buttonRect.width - tooltipRect.width) / 2
                placement = "bottom"
            }
        } else {
            // Try bottom first (original behavior for "bottom" setting)
            if (buttonRect.bottom + tooltipRect.height + 8 <= viewportHeight) {
                top = buttonRect.bottom + 8
                placement = "bottom"
            }
            // Try top
            else if (buttonRect.top - tooltipRect.height - 8 >= 0) {
                top = buttonRect.top - tooltipRect.height - 8
                placement = "top"
            }
            // Try right
            else if (buttonRect.right + tooltipRect.width + 8 <= viewportWidth) {
                top = buttonRect.top + (buttonRect.height - tooltipRect.height) / 2
                left = buttonRect.right + 8
                placement = "right"
            }
            // Try left
            else if (buttonRect.left - tooltipRect.width - 8 >= 0) {
                top = buttonRect.top + (buttonRect.height - tooltipRect.height) / 2
                left = buttonRect.left - tooltipRect.width - 8
                placement = "left"
            }
            // Default to bottom with adjusted position
            else {
                top = buttonRect.bottom + 8
                placement = "bottom"
            }
        }

        // Center horizontally for top/bottom placements
        if (placement === "top" || placement === "bottom") {
            left = buttonRect.left + (buttonRect.width - tooltipRect.width) / 2
            
            // Ensure tooltip doesn't go off screen horizontally
            if (left < 8) left = 8
            if (left + tooltipRect.width > viewportWidth - 8) {
                left = viewportWidth - tooltipRect.width - 8
            }
        }

        setPosition({ top, left, placement })
    }, [viewportWidth, props.tooltip.position])

    useEffect(() => {
        if (isVisible && typeof window !== "undefined") {
            calculatePosition()
            
            const handleResize = () => calculatePosition()
            window.addEventListener("resize", handleResize)
            return () => window.removeEventListener("resize", handleResize)
        }
    }, [isVisible, calculatePosition])

    const handleClick = () => {
        if (!preview) {
            if (triggerType === "hover" && isVisible && !isPinned) {
                // If hovering and tooltip is visible but not pinned, pin it instead of closing
                startTransition(() => setIsPinned(true))
            } else {
                // Toggle visibility and reset pinned state
                startTransition(() => setIsVisible(!isVisible))
                startTransition(() => setIsPinned(false))
            }
        }
    }

    const handleMouseEnter = () => {
        startTransition(() => setIsHovered(true))
        if (triggerType === "hover" && !preview) {
            startTransition(() => setIsVisible(true))
        }
    }

    const handleMouseLeave = () => {
        if (!preview) {
            startTransition(() => setIsHovered(false))
            if (triggerType === "hover" && !isPinned) {
                startTransition(() => setIsVisible(false))
            }
        }
    }

    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (
            buttonRef.current &&
            tooltipRef.current &&
            !buttonRef.current.contains(event.target as Node) &&
            !tooltipRef.current.contains(event.target as Node)
        ) {
            startTransition(() => setIsVisible(false))
        }
    }, [])

    useEffect(() => {
        // Listen for outside clicks regardless of trigger type
        if (isVisible && typeof document !== "undefined") {
            document.addEventListener("mousedown", handleClickOutside)
            return () => document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isVisible, handleClickOutside])

    // Close tooltip on scroll
    useEffect(() => {
        if (isVisible && !preview && typeof window !== "undefined") {
            const handleScroll = () => {
                startTransition(() => setIsVisible(false))
                startTransition(() => setIsPinned(false))
            }
            
            window.addEventListener("scroll", handleScroll, true)
            return () => window.removeEventListener("scroll", handleScroll, true)
        }
    }, [isVisible, preview])

    const defaultQuestionMarkSvg = `
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1,-0.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
        </svg>
    `

    // Convert Framer transition object to CSS transition string
    const getTransitionString = () => {
        const transition = button.hoverEffect.transition
        if (!transition) return 'all 0.3s ease'
        
        const duration = transition.duration || 0.3
        const delay = transition.delay || 0
        const ease = transition.ease || [0.4, 0.0, 0.2, 1] // Default easing
        
        // Convert ease array to cubic-bezier
        let timingFunction = 'ease'
        if (Array.isArray(ease) && ease.length === 4) {
            timingFunction = `cubic-bezier(${ease.join(', ')})`
        } else if (typeof ease === 'string') {
            timingFunction = ease
        }
        
        return `all ${duration}s ${timingFunction}${delay > 0 ? ` ${delay}s` : ''}`
    }

    return (
        <>
            <div
                ref={buttonRef}
                style={{
                    width: "100%",
                    height: "100%",
                    aspectRatio: "1/1",
                    backgroundColor: (isHovered || isVisible) ? button.hoverEffect.backgroundColor : button.backgroundColor,
                    borderRadius: button.borderRadius,
                    border: `${button.border.width}px solid ${button.border.color}`,
                    borderColor: (isHovered || isVisible) ? button.hoverEffect.borderColor : button.border.color,
                    borderWidth: (isHovered || isVisible) ? button.hoverEffect.borderWidth : button.border.width,
                    boxShadow: `${button.shadow.x}px ${button.shadow.y}px ${button.shadow.blur}px ${button.shadow.spread}px ${button.shadow.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transform: `rotate(${button.rotation}deg) scale(${(isHovered || isVisible) ? button.hoverEffect.scale : 1}) rotate(${(isHovered || isVisible) ? button.hoverEffect.rotate : 0}deg) skew(${(isHovered || isVisible) ? button.hoverEffect.skewX : 0}deg, ${(isHovered || isVisible) ? button.hoverEffect.skewY : 0}deg)`,
                    opacity: (isHovered || isVisible) ? button.hoverEffect.opacity / 100 : 1,
                    filter: `blur(${(isHovered || isVisible) ? button.hoverEffect.blur : 0}px)`,
                    transition: getTransitionString(),
                    position: "relative",
                    zIndex: 1,
                }}
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                role="button"
                tabIndex={0}
                aria-label="Show tooltip"
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        handleClick()
                    }
                }}
            >
                <div
                    style={{
                        width: `${button.icon.size}%`,
                        height: `${button.icon.size}%`,
                        color: button.icon.color,
                        transform: `rotate(-${button.rotation}deg)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {button.icon.svg ? (
                        <span
                            style={{
                                width: "100%",
                                height: "100%",
                                backgroundColor: (isHovered || isVisible) ? button.icon.hoverColor : button.icon.color,
                                maskImage: `url(${button.icon.svg})`,
                                WebkitMaskImage: `url(${button.icon.svg})`,
                                maskSize: "contain",
                                maskRepeat: "no-repeat",
                                maskPosition: "center",
                                display: "inline-block",
                                transition: getTransitionString(),
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: (isHovered || isVisible) ? button.icon.hoverColor : button.icon.color,
                                transition: getTransitionString(),
                            }}
                            dangerouslySetInnerHTML={{
                                __html: defaultQuestionMarkSvg
                            }}
                        />
                    )}
                </div>
            </div>

            {(isVisible || preview) && (
                <div
                    ref={tooltipRef}
                    style={{
                        position: preview ? "absolute" : "fixed",
                        top: preview ? (props.tooltip.position === "right" ? "50%" : "130%") : position.top,
                        left: preview ? (props.tooltip.position === "right" ? "140%" : "50%") : position.left,
                        transform: preview ? (props.tooltip.position === "right" ? "translateY(-50%)" : "translateX(-50%)") : "none",
                        width: preview ? `${Math.min(tooltip.maxWidth, 400)}px` : "auto",
                        maxWidth: preview ? `${Math.min(tooltip.maxWidth, 400)}px` : Math.min(tooltip.maxWidth, viewportWidth - 16),
                        backgroundColor: tooltip.backgroundColor,
                        color: tooltip.textColor,
                        padding: "12px 16px",
                        borderRadius: tooltip.borderRadius,
                        boxShadow: `${tooltip.shadow.x}px ${tooltip.shadow.y}px ${tooltip.shadow.blur}px ${tooltip.shadow.spread}px ${tooltip.shadow.color}`,
                        zIndex: 1000,
                        pointerEvents: "auto",
                        opacity: (isVisible || preview) ? 1 : 0,
                        visibility: (isVisible || preview) ? "visible" : "hidden",
                        transition: "opacity 0.2s ease, visibility 0.2s ease",
                        ...tooltip.font,
                    }}
                    role="tooltip"
                    aria-live="polite"
                >
                    {tooltip.text}
                    
                    {/* Arrow */}
                    <div
                        style={{
                            position: "absolute",
                            width: 0,
                            height: 0,
                            borderStyle: "solid",
                            ...(preview && props.tooltip.position === "bottom" && {
                                top: -8,
                                left: "50%",
                                transform: "translateX(-50%)",
                                borderWidth: "0 8px 8px 8px",
                                borderColor: `transparent transparent ${tooltip.backgroundColor} transparent`,
                            }),
                            ...(preview && props.tooltip.position === "right" && {
                                left: -8,
                                top: "50%",
                                transform: "translateY(-50%)",
                                borderWidth: "8px 8px 8px 0",
                                borderColor: `transparent ${tooltip.backgroundColor} transparent transparent`,
                            }),
                            ...(!preview && position.placement === "bottom" && {
                                top: -8,
                                left: "50%",
                                transform: "translateX(-50%)",
                                borderWidth: "0 8px 8px 8px",
                                borderColor: `transparent transparent ${tooltip.backgroundColor} transparent`,
                            }),
                            ...(!preview && position.placement === "top" && {
                                bottom: -8,
                                left: "50%",
                                transform: "translateX(-50%)",
                                borderWidth: "8px 8px 0 8px",
                                borderColor: `${tooltip.backgroundColor} transparent transparent transparent`,
                            }),
                            ...(!preview && position.placement === "right" && {
                                left: -8,
                                top: "50%",
                                transform: "translateY(-50%)",
                                borderWidth: "8px 8px 8px 0",
                                borderColor: `transparent ${tooltip.backgroundColor} transparent transparent`,
                            }),
                            ...(!preview && position.placement === "left" && {
                                right: -8,
                                top: "50%",
                                transform: "translateY(-50%)",
                                borderWidth: "8px 0 8px 8px",
                                borderColor: `transparent transparent transparent ${tooltip.backgroundColor}`,
                            }),
                        }}
                    />
                </div>
            )}
        </>
    )
}

export default SmartTooltips

addPropertyControls(SmartTooltips, {
    preview: {
        type: ControlType.Boolean,
        title: "Preview",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    button: {
        type: ControlType.Object,
        title: "Button",
        controls: {
            icon: {
                type: ControlType.Object,
                title: "Icon",
                controls: {
                    svg: {
                        type: ControlType.File,
                        title: "SVG",
                        allowedFileTypes: ["svg"],
                    },
                    color: {
                        type: ControlType.Color,
                        title: "Color",
                        defaultValue: "#FFFFFF",
                    },
                    hoverColor: {
                        type: ControlType.Color,
                        title: "Hover Color",
                        defaultValue: "#CCCCCC",
                    },
                    size: {
                        type: ControlType.Number,
                        title: "Size",
                        defaultValue: 60,
                        min: 20,
                        max: 100,
                        step: 5,
                        unit: "%",
                    },
                },
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background Color",
                defaultValue: "#000000",
            },
            border: {
                type: ControlType.Object,
                title: "Border",
                controls: {
                    width: {
                        type: ControlType.Number,
                        title: "Width",
                        defaultValue: 0,
                        min: 0,
                        max: 10,
                        step: 1,
                        unit: "px",
                    },
                    color: {
                        type: ControlType.Color,
                        title: "Color",
                        defaultValue: "#000000",
                    },
                },
            },
            rotation: {
                type: ControlType.Number,
                title: "Rotation",
                defaultValue: 0,
                min: 0,
                max: 360,
                step: 1,
                unit: "deg",
            },
            borderRadius: {
                type: ControlType.BorderRadius,
                title: "Border Radius",
                defaultValue: "8px",
            },
            shadow: {
                type: ControlType.Object,
                title: "Shadow",
                controls: {
                    color: {
                        type: ControlType.Color,
                        title: "Color",
                        defaultValue: "rgba(0, 0, 0, 0)",
                    },
                    x: {
                        type: ControlType.Number,
                        title: "X",
                        defaultValue: 0,
                        min: -50,
                        max: 50,
                        step: 1,
                        unit: "px",
                    },
                    y: {
                        type: ControlType.Number,
                        title: "Y",
                        defaultValue: 0,
                        min: -50,
                        max: 50,
                        step: 1,
                        unit: "px",
                    },
                    blur: {
                        type: ControlType.Number,
                        title: "Blur",
                        defaultValue: 0,
                        min: 0,
                        max: 100,
                        step: 1,
                        unit: "px",
                    },
                    spread: {
                        type: ControlType.Number,
                        title: "Spread",
                        defaultValue: 0,
                        min: -50,
                        max: 50,
                        step: 1,
                        unit: "px",
                    },
                },
            },
            hoverEffect: {
                type: ControlType.Object,
                title: "Hover Effect",
                controls: {
                    scale: {
                        type: ControlType.Number,
                        title: "Scale",
                        defaultValue: 1,
                        min: 0.5,
                        max: 2,
                        step: 0.1,
                    },
                    opacity: {
                        type: ControlType.Number,
                        title: "Opacity",
                        defaultValue: 100,
                        min: 0,
                        max: 100,
                        step: 1,
                        unit: "%",
                    },
                    blur: {
                        type: ControlType.Number,
                        title: "Blur",
                        defaultValue: 0,
                        min: 0,
                        max: 20,
                        step: 1,
                        unit: "px",
                    },
                    rotate: {
                        type: ControlType.Number,
                        title: "Rotate",
                        defaultValue: 0,
                        min: -180,
                        max: 180,
                        step: 1,
                        unit: "deg",
                    },
                    skewX: {
                        type: ControlType.Number,
                        title: "Skew X",
                        defaultValue: 0,
                        min: -45,
                        max: 45,
                        step: 1,
                        unit: "deg",
                    },
                    skewY: {
                        type: ControlType.Number,
                        title: "Skew Y",
                        defaultValue: 0,
                        min: -45,
                        max: 45,
                        step: 1,
                        unit: "deg",
                    },
                    backgroundColor: {
                        type: ControlType.Color,
                        title: "Background",
                        defaultValue: "#000000",
                    },
                    borderWidth: {
                        type: ControlType.Number,
                        title: "Border Width",
                        defaultValue: 0,
                        min: 0,
                        max: 10,
                        step: 1,
                        unit: "px",
                    },
                    borderColor: {
                        type: ControlType.Color,
                        title: "Border Color",
                        defaultValue: "#000000",
                    },
                    transition: {
                        type: ControlType.Transition,
                        title: "Transition",
                    },
                },
            },
        },
    },
    tooltip: {
        type: ControlType.Object,
        title: "Tooltip",
        controls: {
            text: {
                type: ControlType.String,
                title: "Text",
                defaultValue: "This is a helpful tooltip with detailed information.",
                displayTextArea: true,
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
            maxWidth: {
                type: ControlType.Number,
                title: "Max Width",
                defaultValue: 300,
                min: 100,
                max: 600,
                step: 10,
                unit: "px",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Medium",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.3em",
                },
                controls: "extended",
                defaultFontType: "sans-serif",
            },
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: ["bottom", "right"],
                optionTitles: ["Bottom", "Right"],
                defaultValue: "bottom",
                displaySegmentedControl: true,
            },
            borderRadius: {
                type: ControlType.BorderRadius,
                title: "Border Radius",
                defaultValue: "8px",
            },
            shadow: {
                type: ControlType.Object,
                title: "Shadow",
                controls: {
                    color: {
                        type: ControlType.Color,
                        title: "Color",
                        defaultValue: "rgba(0, 0, 0, 0)",
                    },
                    x: {
                        type: ControlType.Number,
                        title: "X",
                        defaultValue: 0,
                        min: -50,
                        max: 50,
                        step: 1,
                        unit: "px",
                    },
                    y: {
                        type: ControlType.Number,
                        title: "Y",
                        defaultValue: 10,
                        min: -50,
                        max: 50,
                        step: 1,
                        unit: "px",
                    },
                    blur: {
                        type: ControlType.Number,
                        title: "Blur",
                        defaultValue: 20,
                        min: 0,
                        max: 100,
                        step: 1,
                        unit: "px",
                    },
                    spread: {
                        type: ControlType.Number,
                        title: "Spread",
                        defaultValue: 0,
                        min: -50,
                        max: 50,
                        step: 1,
                        unit: "px",
                    },
                },
            },
        },
    },
    triggerType: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["click", "hover"],
        optionTitles: ["Click", "Hover"],
        defaultValue: "hover",
        displaySegmentedControl: true,
    },
})