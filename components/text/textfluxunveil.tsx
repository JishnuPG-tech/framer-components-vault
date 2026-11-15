// Text Flux Unveil - Scroll Word Reveal - A scroll-triggered text animation component that reveals text word by word as users scroll
import { useEffect, useState, useRef, useMemo, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useScroll, useInView } from "framer-motion"

interface AnimatedTextRevealProps {
    text: string
    color: string
    font: any
    textAlign: "left" | "center" | "right"
    startFromWord: number
    initialOpacity: number
    fadeDelay: number
    fadeDuration: number
    fadeEasing: "linear" | "easeIn" | "easeOut" | "easeInOut"
    fullRevealDistance: number
    accessibilityTag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span"
    style?: React.CSSProperties
}

/**
 * Text Flux Unveil
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function TextFluxUnveil(props: AnimatedTextRevealProps) {
    const {
        text = "Your text will reveal word by word as you scroll down the page",
        color = "#000000",
        font,
        textAlign = "left",
        startFromWord = 5,
        initialOpacity = 0.2,
        fadeDelay = 0,
        fadeDuration = 0.1,
        fadeEasing = "linear",
        fullRevealDistance = 150,
        accessibilityTag = "h3",
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()
    const isInView = useInView(containerRef, { margin: "-20% 0px -20% 0px" })

    const { scrollY } = useScroll()
    const [elementTop, setElementTop] = useState(0)
    const [windowHeight, setWindowHeight] = useState(0)
    const [scrollProgress, setScrollProgress] = useState(0)

    // Calculate element position and window height
    useEffect(() => {
        if (!containerRef.current || isStatic) return

        const updatePosition = () => {
            const rect = containerRef.current?.getBoundingClientRect()
            if (rect) {
                const scrollTop =
                    window.pageYOffset || document.documentElement.scrollTop
                startTransition(() => {
                    setElementTop(rect.top + scrollTop)
                    setWindowHeight(window.innerHeight)
                })
            }
        }

        updatePosition()
        window.addEventListener("resize", updatePosition)
        return () => window.removeEventListener("resize", updatePosition)
    }, [isStatic])

    // Update scroll progress based on scroll position
    useEffect(() => {
        if (isStatic) return

        const unsubscribe = scrollY.on("change", (latest) => {
            const triggerPoint = elementTop - windowHeight
            const progress = Math.max(
                0,
                Math.min(1, (latest - triggerPoint) / fullRevealDistance)
            )
            startTransition(() => setScrollProgress(progress))
        })

        return unsubscribe
    }, [scrollY, elementTop, windowHeight, fullRevealDistance, isStatic])

    // Split text into words
    const words = useMemo(() => {
        return text.split(" ").filter((word) => word.length > 0)
    }, [text])

    const TagComponent = accessibilityTag as keyof JSX.IntrinsicElements

    return (
        <div
            ref={containerRef}
            style={{
                position: "sticky",
                top: "20vh",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent:
                    textAlign === "center"
                        ? "center"
                        : textAlign === "right"
                          ? "flex-end"
                          : "flex-start",
                padding: "1rem",
                ...props.style,
            }}
        >
            <TagComponent
                style={{
                    textAlign,
                    maxWidth: "100%",
                    margin: 0,
                    ...font,
                    color,
                }}
                role={accessibilityTag.startsWith("h") ? "heading" : undefined}
                aria-level={
                    accessibilityTag.startsWith("h")
                        ? parseInt(accessibilityTag.charAt(1))
                        : undefined
                }
                aria-live="polite"
                aria-atomic="false"
            >
                {words.map((word, index) => {
                    const wordIndex = index + 1
                    const shouldAnimate = wordIndex >= startFromWord

                    if (!shouldAnimate) {
                        return (
                            <span
                                key={index}
                                style={{
                                    display: "inline-block",
                                    marginRight: "0.3em",
                                    opacity: 1,
                                }}
                            >
                                {word}
                            </span>
                        )
                    }

                    // Calculate when this word should reveal based on scroll progress
                    const wordsToAnimate = words.length - (startFromWord - 1)
                    const wordRevealStart =
                        (index - (startFromWord - 1)) / wordsToAnimate
                    const wordRevealEnd =
                        (index - (startFromWord - 1) + 1) / wordsToAnimate

                    // Calculate smooth opacity transition
                    let wordOpacity = initialOpacity
                    if (isStatic) {
                        wordOpacity = 1
                    } else if (scrollProgress >= wordRevealEnd) {
                        wordOpacity = 1
                    } else if (scrollProgress > wordRevealStart) {
                        const wordProgress =
                            (scrollProgress - wordRevealStart) /
                            (wordRevealEnd - wordRevealStart)
                        wordOpacity =
                            initialOpacity + (1 - initialOpacity) * wordProgress
                    }

                    return (
                        <span
                            key={index}
                            style={{
                                display: "inline-block",
                                marginRight: "0.3em",
                                opacity: wordOpacity,
                                transition: `opacity ${fadeDuration}s ${fadeEasing}`,
                            }}
                        >
                            {word}
                        </span>
                    )
                })}
            </TagComponent>
        </div>
    )
}

addPropertyControls(TextFluxUnveil, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue:
            "Your text will reveal word by word as you scroll down the page",
        displayTextArea: true,
    },
    accessibilityTag: {
        type: ControlType.Enum,
        title: "Accessibility Tag",
        options: ["h1", "h2", "h3", "h4", "h5", "h6", "p", "span"],
        optionTitles: ["H1", "H2", "H3", "H4", "H5", "H6", "Paragraph", "Span"],
        defaultValue: "h3",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "32px",
            variant: "Semibold",
            letterSpacing: "-0.03em",
            lineHeight: "1.2em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Text Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    startFromWord: {
        type: ControlType.Number,
        title: "Start From Word",
        defaultValue: 5,
        min: 1,
        max: 50,
        step: 1,
        displayStepper: true,
    },
    initialOpacity: {
        type: ControlType.Number,
        title: "Initial Opacity",
        defaultValue: 0.2,
        min: 0,
        max: 1,
        step: 0.1,
    },
    fadeDelay: {
        type: ControlType.Number,
        title: "Fade Delay",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.05,
        unit: "s",
    },
    fadeDuration: {
        type: ControlType.Number,
        title: "Fade Duration",
        defaultValue: 0.1,
        min: 0,
        max: 2,
        step: 0.1,
        unit: "s",
    },
    fadeEasing: {
        type: ControlType.Enum,
        title: "Fade Easing",
        options: ["linear", "easeIn", "easeOut", "easeInOut"],
        optionTitles: ["Linear", "Ease In", "Ease Out", "Ease In Out"],
        defaultValue: "linear",
    },
    fullRevealDistance: {
        type: ControlType.Number,
        title: "Full Reveal Distance",
        defaultValue: 150,
        min: 100,
        max: 1000,
        step: 50,
        unit: "px",
    },
})
