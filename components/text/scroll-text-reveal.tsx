// Headline text with scroll-triggered color animation - characters change from primary to secondary color as user scrolls
import { useEffect, useState, useRef, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ScrollColorTextProps {
    text: string
    startColor: string
    endColor: string
    font: any
    triggerAlignment: "top" | "middle" | "bottom"
    animationUnit: "character" | "word" | "line"
    animationSpeed: number
    transitionDuration: number
    transitionType: "ease" | "spring"
    transitionEasing: "ease" | "ease-in" | "ease-out" | "ease-in-out"
    springTension: number
    springFriction: number
    tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p"
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ScrollColorText(props: ScrollColorTextProps) {
    const {
        text,
        startColor,
        endColor,
        font,
        triggerAlignment,
        animationUnit,
        animationSpeed,
        transitionDuration,
        transitionType,
        transitionEasing,
        springTension,
        springFriction,
        tag,
    } = props

    const [scrollProgress, setScrollProgress] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        if (isStatic || typeof window === "undefined" || !containerRef.current) return

        let targetElement = containerRef.current

        const updateProgress = () => {
            const rect = targetElement.getBoundingClientRect()
            const windowHeight = window.innerHeight
            const scrollY = window.scrollY || window.pageYOffset
            
            // Get element's position relative to viewport
            const elementTop = rect.top
            const elementBottom = rect.bottom
            const elementHeight = rect.height
            
            let progress = 0
            
            if (triggerAlignment === "top") {
                // Animation starts when element top enters viewport from bottom
                if (elementTop >= windowHeight) {
                    progress = 0
                } else if (elementTop <= 0) {
                    progress = 1
                } else {
                    // Progress from 0 to 1 as element top moves from bottom of viewport to top
                    progress = (windowHeight - elementTop) / windowHeight
                }
            } else if (triggerAlignment === "middle") {
                // Animation based on element center position relative to viewport center
                const elementCenter = elementTop + elementHeight / 2
                const viewportCenter = windowHeight / 2
                
                if (elementCenter >= windowHeight) {
                    progress = 0
                } else if (elementCenter <= 0) {
                    progress = 1
                } else {
                    // Progress from 0 to 1 as element center moves through viewport
                    progress = (windowHeight - elementCenter) / windowHeight
                }
            } else if (triggerAlignment === "bottom") {
                // Animation starts when element bottom enters viewport
                if (elementBottom >= windowHeight) {
                    progress = 0
                } else if (elementBottom <= 0) {
                    progress = 1
                } else {
                    // Progress from 0 to 1 as element bottom moves from bottom of viewport to top
                    progress = (windowHeight - elementBottom) / windowHeight
                }
            }
            
            // Apply animation speed
            progress = Math.pow(progress, 1 / animationSpeed)
            
            startTransition(() => setScrollProgress(Math.max(0, Math.min(1, progress))))
        }

        // Use both intersection observer and scroll listener for smoother updates
        const observer = new IntersectionObserver(
            () => updateProgress(),
            {
                threshold: Array.from({ length: 21 }, (_, i) => i / 20),
                rootMargin: "100px"
            }
        )

        const handleScroll = () => {
            requestAnimationFrame(updateProgress)
        }

        observer.observe(targetElement)
        window.addEventListener('scroll', handleScroll, { passive: true })
        window.addEventListener('resize', updateProgress, { passive: true })

        // Initial calculation
        updateProgress()

        return () => {
            observer.disconnect()
            window.removeEventListener('scroll', handleScroll)
            window.removeEventListener('resize', updateProgress)
        }
    }, [animationSpeed, triggerAlignment, isStatic])

    const getTextUnits = () => {
        if (animationUnit === "character") {
            return text.split("")
        } else if (animationUnit === "word") {
            return text.split(/(\s+)/)
        } else {
            // line mode - split by line breaks or approximate line breaks
            return text.split(/\n/)
        }
    }

    const textUnits = getTextUnits()
    const totalUnits = textUnits.length
    
    // Calculate how many units should be colored based on scroll progress
    const unitsToColor = Math.floor(scrollProgress * totalUnits)

    const TextTag = tag as keyof JSX.IntrinsicElements

    const getTransitionStyle = () => {
        if (transitionType === "spring") {
            // Convert spring values to cubic-bezier approximation
            const tension = springTension / 100
            const friction = springFriction / 100
            const cubicBezier = `cubic-bezier(${0.25 + tension * 0.5}, ${0.1 + tension * 0.4}, ${0.25 + friction * 0.5}, ${1 - friction * 0.3})`
            return `color ${transitionDuration}s ${cubicBezier}`
        } else {
            return `color ${transitionDuration}s ${transitionEasing}`
        }
    }

    const transitionStyle = getTransitionStyle()

    return (
        <div
            ref={containerRef}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                ...font,
            }}
            role="region"
            aria-label={`Scroll-animated text: ${text}`}
            aria-live="polite"
            aria-atomic="false"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    // Announce current progress for keyboard users
                    const announcement = scrollProgress >= 1 
                        ? "Text animation complete" 
                        : `Text animation ${Math.round(scrollProgress * 100)}% complete`
                    
                    // Create temporary announcement element
                    const announcer = document.createElement('div')
                    announcer.setAttribute('aria-live', 'assertive')
                    announcer.setAttribute('aria-atomic', 'true')
                    announcer.style.position = 'absolute'
                    announcer.style.left = '-10000px'
                    announcer.textContent = announcement
                    document.body.appendChild(announcer)
                    
                    setTimeout(() => {
                        document.body.removeChild(announcer)
                    }, 1000)
                }
            }}
        >
            <TextTag 
                style={{ 
                    display: "block",
                    wordWrap: "break-word",
                    whiteSpace: "normal",
                    margin: 0,
                    padding: 0,
                    fontSize: font.fontSize,
                    fontFamily: font.fontFamily,
                    fontWeight: font.fontWeight,
                    fontStyle: font.fontStyle,
                    lineHeight: font.lineHeight,
                    letterSpacing: font.letterSpacing,
                }}
                role="text"
                aria-describedby="scroll-progress-description"
            >
                {animationUnit === "character" ? (
                    textUnits.map((char, index) => (
                        <span
                            key={index}
                            style={{
                                color: index < unitsToColor ? endColor : startColor,
                                transition: isStatic ? "none" : transitionStyle,
                                display: char === " " ? "inline" : "inline-block",
                            }}
                            aria-hidden={char === " " ? "true" : "false"}
                            role={char.trim() ? "text" : "presentation"}
                        >
                            {char === " " ? "\u00A0" : char}
                        </span>
                    ))
                ) : animationUnit === "word" ? (
                    textUnits.map((unit, index) => (
                        <span
                            key={index}
                            style={{
                                color: index < unitsToColor ? endColor : startColor,
                                transition: isStatic ? "none" : transitionStyle,
                            }}
                            role={unit.trim() ? "text" : "presentation"}
                            aria-hidden={!unit.trim() ? "true" : "false"}
                        >
                            {unit}
                        </span>
                    ))
                ) : (
                    textUnits.map((line, index) => (
                        <div
                            key={index}
                            style={{
                                color: index < unitsToColor ? endColor : startColor,
                                transition: isStatic ? "none" : transitionStyle,
                            }}
                            role="text"
                            aria-label={`Line ${index + 1}: ${line}`}
                        >
                            {line}
                        </div>
                    ))
                )}
            </TextTag>
            
            {/* Hidden description for screen readers */}
            <div 
                id="scroll-progress-description"
                style={{
                    position: "absolute",
                    left: "-10000px",
                    width: "1px",
                    height: "1px",
                    overflow: "hidden"
                }}
                aria-hidden="true"
            >
                Text changes color as you scroll. Animation unit: {animationUnit}. 
                Trigger alignment: {triggerAlignment}. Press Enter or Space to announce progress.
            </div>
            
            {/* Screen reader announcement for progress */}
            <div 
                aria-live="polite" 
                aria-atomic="true"
                role="status"
                style={{
                    position: "absolute",
                    left: "-10000px",
                    width: "1px",
                    height: "1px",
                    overflow: "hidden"
                }}
            >
                {scrollProgress > 0 && scrollProgress < 1 && 
                    `Text animation ${Math.round(scrollProgress * 100)}% complete`
                }
                {scrollProgress >= 1 && "Text animation complete"}
            </div>
        </div>
    )
}

addPropertyControls(ScrollColorText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Scroll to reveal",
    },
    tag: {
        type: ControlType.Enum,
        title: "HTML Tag",
        options: ["h1", "h2", "h3", "h4", "h5", "h6", "p"],
        optionTitles: ["H1", "H2", "H3", "H4", "H5", "H6", "Paragraph"],
        defaultValue: "h1",
    },
    startColor: {
        type: ControlType.Color,
        title: "Start Color",
        defaultValue: "#CCCCCC",
    },
    endColor: {
        type: ControlType.Color,
        title: "End Color",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    triggerAlignment: {
        type: ControlType.Enum,
        title: "Trigger Alignment",
        options: ["top", "middle", "bottom"],
        optionTitles: ["Top", "Middle", "Bottom"],
        defaultValue: "top",
        displaySegmentedControl: true,
    },
    animationUnit: {
        type: ControlType.Enum,
        title: "Animation Unit",
        options: ["character", "word", "line"],
        optionTitles: ["Character", "Word", "Line"],
        defaultValue: "character",
        displaySegmentedControl: true,
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Animation Speed",
        defaultValue: 1.5,
        min: 0.1,
        max: 5,
        step: 0.1,
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Transition Duration",
        defaultValue: 0.3,
        min: 0.05,
        max: 2,
        step: 0.05,
        unit: "s",
    },
    transitionType: {
        type: ControlType.Enum,
        title: "Transition Type",
        options: ["ease", "spring"],
        optionTitles: ["Ease", "Spring"],
        defaultValue: "ease",
        displaySegmentedControl: true,
    },
    transitionEasing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["ease", "ease-in", "ease-out", "ease-in-out"],
        optionTitles: ["Ease", "Ease In", "Ease Out", "Ease In Out"],
        defaultValue: "ease-out",
        hidden: ({ transitionType }) => transitionType !== "ease",
    },
    springTension: {
        type: ControlType.Number,
        title: "Spring Tension",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        hidden: ({ transitionType }) => transitionType !== "spring",
    },
    springFriction: {
        type: ControlType.Number,
        title: "Spring Friction",
        defaultValue: 25,
        min: 0,
        max: 100,
        step: 1,
        hidden: ({ transitionType }) => transitionType !== "spring",
    },
})