import { useState, useEffect, useMemo, useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView, useIsomorphicLayoutEffect } from "framer-motion"

interface Image {
    src: string
    alt: string
}

interface RibbonCurtainRevealProps {
    image: Image
    ribbonCount: number
    duration: number
    staggerDelay: number
    revealDirection: "start" | "end" | "center-out" | "center-in"
    orientation: "horizontal" | "vertical"
    ribbonColor: string
    easing: "easeInOut" | "easeOut" | "easeIn" | "linear" | "circOut" | "backOut"
    gap: number
    borderRadius: number
    triggerType: "load" | "layer-in-view" | "section-in-view" | "click" | "hover"
    loadDelay: number
    layerInViewPosition: "top" | "center" | "bottom"
    viewportPosition: "top" | "center" | "bottom"
    sectionId: string
    onRevealStart?: () => void
    onRevealComplete?: () => void
    style?: CSSProperties
}

/**
 * Ribbon Curtain Reveal
 * 
 * An image reveal animation that uses multiple ribbon strips to unveil the image
 * in a curtain-like effect.
 * 
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 300
 * 
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function RibbonCurtainReveal(props: RibbonCurtainRevealProps) {
    const {
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Gradient 1 - Blue",
        },
        ribbonCount = 8,
        duration = 0.8,
        staggerDelay = 0.08,
        revealDirection = "start",
        orientation = "horizontal",
        ribbonColor = "#FFFFFF",
        easing = "circOut",
        gap = 2,
        borderRadius = 0,
        triggerType = "layer-in-view",
        loadDelay = 0,
        layerInViewPosition = "center",
        viewportPosition = "center",
        sectionId = "",
        onRevealStart,
        onRevealComplete,
    } = props

    const [isRevealed, setIsRevealed] = useState(false)
    const [hasTriggered, setHasTriggered] = useState(false)
    const [isSectionActive, setIsSectionActive] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const isThumbnail = RenderTarget.current() === RenderTarget.thumbnail
    const isStatic = useIsStaticRenderer()

    // Map layer in view position to amount value
    const getInViewAmount = () => {
        switch (layerInViewPosition) {
            case "top": return 0.05
            case "center": return 0.5
            case "bottom": return 0.95
            default: return 0.3
        }
    }
    
    // Layer in view detection (component is in viewport)
    const isLayerInView = useInView(containerRef, { 
        once: true, 
        amount: getInViewAmount()
    })
    
    // Section in view detection with section ID
    useEffect(() => {
        if (triggerType !== "section-in-view" || !sectionId || typeof window === "undefined") {
            return
        }

        // Find the section element by ID
        const sectionElement = document.getElementById(sectionId)
        if (!sectionElement) {
            return
        }

        const checkSectionPosition = () => {
            const rect = sectionElement.getBoundingClientRect()
            const windowHeight = window.innerHeight
            
            let isInPosition = false
            
            switch (viewportPosition) {
                case "top":
                    // Trigger when section top enters viewport top
                    isInPosition = rect.top >= 0 && rect.top <= windowHeight * 0.5
                    break
                case "center":
                    // Trigger when section center passes viewport center
                    const sectionCenter = rect.top + rect.height / 2
                    isInPosition = sectionCenter >= windowHeight * 0.25 && sectionCenter <= windowHeight * 0.75
                    break
                case "bottom":
                    // Trigger when section bottom enters viewport from below
                    isInPosition = rect.bottom >= windowHeight * 0.5 && rect.bottom <= windowHeight
                    break
                default:
                    isInPosition = rect.top >= 0 && rect.top <= windowHeight
            }
            
            if (isInPosition) {
                setIsSectionActive(true)
            }
        }

        // Check immediately
        checkSectionPosition()
        
        // Listen for scroll events
        window.addEventListener("scroll", checkSectionPosition, { passive: true })
        
        // Also use IntersectionObserver as backup for initial detection
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        checkSectionPosition()
                    }
                })
            },
            { threshold: [0, 0.25, 0.5, 0.75, 1] }
        )

        observer.observe(sectionElement)

        return () => {
            window.removeEventListener("scroll", checkSectionPosition)
            observer.disconnect()
        }
    }, [triggerType, sectionId, viewportPosition])

    // Handle trigger types
    useEffect(() => {
        if (isThumbnail) {
            setIsRevealed(true)
            return
        }
        
        switch (triggerType) {
            case "load":
                const timer = setTimeout(() => {
                    setIsRevealed(true)
                }, loadDelay * 1000)
                return () => clearTimeout(timer)
                
            case "layer-in-view":
                if (isLayerInView) {
                    setIsRevealed(true)
                }
                break
                
            case "section-in-view":
                if (isSectionActive) {
                    setIsRevealed(true)
                }
                break
                
            case "hover":
                // Do nothing - hover handles this via mouse events
                break
                
            default:
                break
        }
    }, [triggerType, isLayerInView, isSectionActive, loadDelay, isThumbnail])

    // Handle click trigger
    const handleClick = () => {
        if (triggerType === "click") {
            setIsRevealed(prev => !prev)
        }
    }

    // Handle hover trigger
    const handleMouseEnter = () => {
        if (triggerType === "hover") {
            setIsRevealed(true)
        }
    }

    const handleMouseLeave = () => {
        if (triggerType === "hover") {
            setIsRevealed(false)
        }
    }

    // Track when animation starts for event
    useEffect(() => {
        if (isRevealed && !hasTriggered) {
            setHasTriggered(true)
            if (onRevealStart) {
                onRevealStart()
            }
        }
    }, [isRevealed, hasTriggered, onRevealStart])

    // Calculate total animation duration for onComplete
    useEffect(() => {
        if (!isRevealed || !hasTriggered) return
        
        const ribbons = Math.max(2, Math.min(20, ribbonCount))
        let maxDelay = 0
        
        if (revealDirection === "center-out") {
            const centerIndex = (ribbons - 1) / 2
            maxDelay = centerIndex * staggerDelay
        } else if (revealDirection === "center-in") {
            maxDelay = ((ribbons - 1) / 2) * staggerDelay
        } else {
            maxDelay = (ribbons - 1) * staggerDelay
        }
        
        const totalDuration = (maxDelay + duration) * 1000
        
        const timer = setTimeout(() => {
            if (onRevealComplete) {
                onRevealComplete()
            }
        }, totalDuration)
        
        return () => clearTimeout(timer)
    }, [isRevealed, hasTriggered, ribbonCount, duration, staggerDelay, revealDirection, onRevealComplete])

    // Auto-reveal in thumbnail
    useEffect(() => {
        if (isThumbnail) {
            setIsRevealed(true)
        }
    }, [isThumbnail])

    const ribbons = useMemo(() => {
        return Array.from({ length: Math.max(2, Math.min(20, ribbonCount)) }, (_, i) => i)
    }, [ribbonCount])

    const isHorizontal = orientation === "horizontal"
    const isCenterOut = revealDirection === "center-out"
    const isCenterIn = revealDirection === "center-in"
    const isReverse = revealDirection === "end"

    // Calculate ribbon dimensions - all ribbons should be exactly the same size
    const ribbonSize = isHorizontal 
        ? `calc((100% - ${(ribbons.length - 1) * gap}px) / ${ribbons.length})`
        : `calc((100% - ${(ribbons.length - 1) * gap}px) / ${ribbons.length})`

    const easingMap: Record<string, any> = {
        easeInOut: [0.42, 0, 0.58, 1],
        easeOut: [0, 0, 0.58, 1],
        easeIn: [0.42, 0, 1, 1],
        linear: [0, 0, 1, 1],
        circOut: [0.33, 1, 0.68, 1],
        backOut: [0.34, 1.56, 0.64, 1],
    }

    const containerStyle: CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: `${borderRadius}px`,
    }

    const imageStyle: CSSProperties = {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: `${borderRadius}px`,
    }

    return (
        <div
            ref={containerRef}
            style={containerStyle}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            role={triggerType === "click" ? "button" : undefined}
            tabIndex={triggerType === "click" ? 0 : undefined}
            aria-label={triggerType === "click" ? "Click to reveal image" : undefined}
        >
            <img
                src={image.src}
                alt={image.alt}
                style={imageStyle}
            />

            {ribbons.map((_, index) => {
                // Calculate delay based on position
                let delay = 0
                
                if (isCenterOut) {
                    // Animate from center outward
                    const centerIndex = (ribbons.length - 1) / 2
                    const distanceFromCenter = Math.abs(index - centerIndex)
                    delay = distanceFromCenter * staggerDelay
                } else if (isCenterIn) {
                    // Animate from edges toward center
                    const centerIndex = (ribbons.length - 1) / 2
                    const distanceFromCenter = Math.abs(index - centerIndex)
                    const maxDistance = Math.abs(0 - centerIndex)
                    delay = (maxDistance - distanceFromCenter) * staggerDelay
                } else {
                    // Standard sequential animation
                    const effectiveIndex = isReverse ? ribbons.length - 1 - index : index
                    delay = effectiveIndex * staggerDelay
                }

                const ribbonStyle: CSSProperties = isHorizontal
                    ? {
                        position: "absolute",
                        top: `calc(${index} * (${ribbonSize} + ${gap}px))`,
                        left: 0,
                        width: "100%",
                        height: ribbonSize,
                        backgroundColor: ribbonColor,
                    }
                    : {
                        position: "absolute",
                        top: 0,
                        left: `calc(${index} * (${ribbonSize} + ${gap}px))`,
                        width: ribbonSize,
                        height: "100%",
                        backgroundColor: ribbonColor,
                    }

                // In static contexts, render ribbons in revealed state or skip entirely
                if (isStatic) {
                    return null // Don't render ribbons in static context - just show the image
                }

                // SLIDE ANIMATION: ribbons slide away to reveal the image
                // For horizontal orientation (horizontal bars stacked vertically):
                //   - Always slide LEFT (x: -100%)
                //   - revealDirection="start": top-to-bottom reveal sequence
                //   - revealDirection="end": bottom-to-top reveal sequence
                // For vertical orientation (vertical bars side by side):
                //   - Always slide DOWN (y: 100%)
                //   - revealDirection="start": left-to-right reveal sequence
                //   - revealDirection="end": right-to-left reveal sequence
                
                let animateProps, initialProps
                
                if (isHorizontal) {
                    // Horizontal bars: always slide LEFT
                    // revealDirection="start": top-to-bottom reveal (top ribbon first)
                    // revealDirection="end": bottom-to-top reveal (bottom ribbon first)
                    
                    animateProps = isRevealed
                        ? { x: "-100%", opacity: 0 }
                        : { x: 0, opacity: 1 }
                    initialProps = { x: 0, opacity: 1 }
                } else {
                    // Vertical bars: always slide DOWN
                    // revealDirection="start": left-to-right reveal (left ribbon first)
                    // revealDirection="end": right-to-left reveal (right ribbon first)
                    
                    animateProps = isRevealed
                        ? { y: "100%", opacity: 0 }
                        : { y: 0, opacity: 1 }
                    initialProps = { y: 0, opacity: 1 }
                }

                return (
                    <motion.div
                        key={index}
                        style={ribbonStyle}
                        initial={initialProps}
                        animate={animateProps}
                        transition={{
                            duration: duration,
                            delay: delay,
                            ease: easingMap[easing] || easingMap.circOut,
                        }}
                    />
                )
            })}
        </div>
    )
}

addPropertyControls(RibbonCurtainReveal, {
    onRevealStart: {
        type: ControlType.EventHandler,
        title: "On Reveal Start",
    },
    onRevealComplete: {
        type: ControlType.EventHandler,
        title: "On Reveal Complete",
    },
    triggerType: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["load", "layer-in-view", "section-in-view", "click", "hover"],
        optionTitles: ["On Load", "Layer in View", "Section in View", "On Click", "On Hover"],
        defaultValue: "layer-in-view",
    },
    loadDelay: {
        type: ControlType.Number,
        title: "Load Delay",
        defaultValue: 0,
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
        hidden: ({ triggerType }) => triggerType !== "load",
    },
    layerInViewPosition: {
        type: ControlType.Enum,
        title: "Layer Position",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "center",
        hidden: ({ triggerType }) => triggerType !== "layer-in-view",
    },
    sectionId: {
        type: ControlType.String,
        title: "Section ID",
        placeholder: "hero",
        defaultValue: "",
        hidden: ({ triggerType }) => triggerType !== "section-in-view",
    },
    viewportPosition: {
        type: ControlType.Enum,
        title: "Section Position",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "center",
        hidden: ({ triggerType }) => triggerType !== "section-in-view",
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    ribbonCount: {
        type: ControlType.Number,
        title: "Ribbons",
        defaultValue: 8,
        min: 2,
        max: 20,
        step: 1,
        displayStepper: true,
    },
    orientation: {
        type: ControlType.Enum,
        title: "Orientation",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
    },
    revealDirection: {
        type: ControlType.Enum,
        title: "Reveal Direction",
        options: ["start", "end", "center-out", "center-in"],
        optionTitles: ["Start to End", "End to Start", "Center Out", "Center In"],
        defaultValue: "start",
    },
    ribbonColor: {
        type: ControlType.Color,
        title: "Ribbon Color",
        defaultValue: "#FFFFFF",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.8,
        min: 0.1,
        max: 3,
        step: 0.1,
        unit: "s",
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 0.08,
        min: 0,
        max: 0.5,
        step: 0.01,
        unit: "s",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 2,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["easeInOut", "easeOut", "easeIn", "linear", "circOut", "backOut"],
        optionTitles: ["Ease In Out", "Ease Out", "Ease In", "Linear", "Circ Out", "Back Out"],
        defaultValue: "circOut",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 0,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
})