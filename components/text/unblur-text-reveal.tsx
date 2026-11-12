// Get Started: https://www.framer.com/developers
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    useReducedMotion,
} from "framer-motion"
import { useRef } from "react"

/**
 * Word component with multiple animation styles
 */
const Word = ({
    children,
    progress,
    range,
    initialColor,
    revealedColor,
    animationStyle,
    blurAmount,
    springConfig,
    reduceMotion,
}) => {
    const safeRange =
        range &&
        range.length === 2 &&
        typeof range[0] === "number" &&
        typeof range[1] === "number"
            ? range
            : [0, 1]

    const springProgress = useSpring(progress, springConfig)
    const effectiveProgress = reduceMotion ? 1 : springProgress

    const color = useTransform(effectiveProgress, safeRange, [
        initialColor,
        revealedColor,
    ])

    const getAnimationStyle = () => {
        if (reduceMotion) return {}
        switch (animationStyle) {
            case "blur":
                const blur = useTransform(effectiveProgress, safeRange, [
                    blurAmount,
                    0,
                ])
                return { filter: useTransform(blur, (v) => `blur(${v}px)`) }
            case "slideUp":
                const y = useTransform(effectiveProgress, safeRange, [20, 0])
                const opacity1 = useTransform(
                    effectiveProgress,
                    safeRange,
                    [0, 1]
                )
                return { y, opacity: opacity1 }
            case "scale":
                const scale = useTransform(
                    effectiveProgress,
                    safeRange,
                    [0.8, 1]
                )
                const opacity2 = useTransform(
                    effectiveProgress,
                    safeRange,
                    [0, 1]
                )
                return { scale, opacity: opacity2 }
            case "rotate":
                const rotateX = useTransform(
                    effectiveProgress,
                    safeRange,
                    [90, 0]
                )
                const opacity3 = useTransform(
                    effectiveProgress,
                    safeRange,
                    [0, 1]
                )
                return {
                    rotateX,
                    opacity: opacity3,
                    transformPerspective: 1000,
                }
            case "wave":
                const y2 = useTransform(effectiveProgress, safeRange, [30, 0])
                const blur2 = useTransform(effectiveProgress, safeRange, [
                    blurAmount / 2,
                    0,
                ])
                return {
                    y: y2,
                    filter: useTransform(blur2, (v) => `blur(${v}px)`),
                }
            case "glow":
                const blur3 = useTransform(effectiveProgress, safeRange, [
                    blurAmount,
                    0,
                ])
                const brightness = useTransform(
                    effectiveProgress,
                    safeRange,
                    [1.5, 1]
                )
                return {
                    filter: useTransform(
                        [blur3, brightness],
                        ([b, br]) => `blur(${b}px) brightness(${br})`
                    ),
                }
            default:
                return {}
        }
    }

    return (
        <motion.span
            aria-hidden="true"
            style={{
                color,
                marginRight: "0.3em",
                display: "inline-block",
                ...getAnimationStyle(),
            }}
        >
            {children}
        </motion.span>
    )
}

/**
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 200
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerDisableUnlink
 */
export default function ScrollRevealText(props) {
    const {
        textContent = "We believe the best Digital PR isn't transactional; it's relational.",
        style,
        tag = "h2",
        initialColor = "#999999",
        revealedColor = "#000000",
        scrollStart = "start 0.7",
        scrollEnd = "end 0.3",
        animationDirection = "forward",
        animationStyle = "blur",
        blurAmount = 10,
        animationSpeed = "natural",
        springStiffness = 100,
        springDamping = 30,
        padding = 20,
        paragraphSpacing = 16,
        lineBreakSpacing = 0, // Default to 0, but now controllable
    } = props

    const containerRef = useRef(null)
    const shouldReduceMotion = useReducedMotion()

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: [scrollStart, scrollEnd],
    })

    const springConfig = {
        stiffness: springStiffness,
        damping: springDamping,
        mass: 1,
    }

    const lines = textContent ? textContent.split("\n") : []
    const elements = []
    let wordIndex = 0

    lines.forEach((line, lineIdx) => {
        const trimmedLine = line.trim()
        const words = trimmedLine.split(" ").filter((word) => word.length > 0)

        // 1. Add words if the line has them
        if (words.length > 0) {
            words.forEach((word) => {
                elements.push({
                    type: "word",
                    content: word,
                    index: wordIndex,
                })
                wordIndex++
            })
        }

        // 2. Handle Line Breaks vs Paragraph Breaks
        if (lineIdx < lines.length - 1) {
            if (trimmedLine.length === 0) {
                // Double Enter = Paragraph Break
                elements.push({ type: "break", height: paragraphSpacing })
            } else {
                // Single Enter = Line Break (Now uses variable height)
                elements.push({ type: "break", height: lineBreakSpacing })
            }
        }
    })

    const totalWords = wordIndex
    const Container = tag

    const getFlexAlignment = (align) => {
        switch (align) {
            case "center":
                return "center"
            case "right":
                return "flex-end"
            case "justify":
                return "space-between"
            default:
                return "flex-start"
        }
    }

    const getWordRange = (index, total) => {
        const speedConfig = {
            slow: { overlap: 0.4, spread: 0.5 },
            natural: { overlap: 0.25, spread: 0.35 },
            fast: { overlap: 0.15, spread: 0.25 },
        }
        const config = speedConfig[animationSpeed] || speedConfig.natural
        const wordIndex =
            animationDirection === "reverse" ? total - 1 - index : index
        const progress = wordIndex / Math.max(total - 1, 1)
        const start = Math.max(0, progress - config.overlap)
        const end = Math.min(1, progress + config.spread)
        return [start, end]
    }

    return (
        <Container
            ref={containerRef}
            aria-label={textContent}
            style={{
                ...style,
                margin: 0,
                padding: padding,
                width: "100%",
                height: "100%",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-start",
                alignContent: "flex-start",
                justifyContent: getFlexAlignment(style?.textAlign || "left"),
                overflow: "visible",
                wordBreak: "break-word",
                boxSizing: "border-box",
            }}
        >
            {elements.map((element, idx) => {
                if (element.type === "break") {
                    return (
                        <span
                            key={`break-${idx}`}
                            style={{
                                width: "100%",
                                height: `${element.height}px`,
                                display: "block",
                            }}
                            aria-hidden="true"
                        />
                    )
                }

                const range = getWordRange(element.index, totalWords)

                return (
                    <Word
                        key={`word-${idx}`}
                        progress={scrollYProgress}
                        range={range}
                        initialColor={initialColor}
                        revealedColor={revealedColor}
                        animationStyle={animationStyle}
                        blurAmount={blurAmount}
                        springConfig={springConfig}
                        reduceMotion={shouldReduceMotion}
                    >
                        {element.content}
                    </Word>
                )
            })}
        </Container>
    )
}

addPropertyControls(ScrollRevealText, {
    textContent: {
        title: "Text Content",
        type: ControlType.String,
        displayTextArea: true,
        defaultValue:
            "We believe the best Digital PR isn't transactional; it's relational.",
    },
    style: {
        type: ControlType.Font,
        controls: "extended",
        defaultValue: {
            fontSize: 48,
            fontWeight: 700,
            fontFamily: "Inter",
            lineHeight: "1.2",
            letterSpacing: "0em",
            textAlign: "left",
        },
    },
    tag: {
        title: "HTML Tag",
        type: ControlType.Enum,
        options: ["h1", "h2", "h3", "h4", "h5", "h6", "p", "div"],
        optionTitles: ["H1", "H2", "H3", "H4", "H5", "H6", "Paragraph", "Div"],
        defaultValue: "h2",
    },
    initialColor: {
        title: "Initial Color",
        type: ControlType.Color,
        defaultValue: "#999999",
    },
    revealedColor: {
        title: "Revealed Color",
        type: ControlType.Color,
        defaultValue: "#000000",
    },
    scrollStart: {
        title: "Animation Start",
        type: ControlType.Enum,
        options: ["start end", "start 0.7", "start 0.5", "start 0.2"],
        optionTitles: ["Top of Screen", "Near Top", "Middle", "Bottom"],
        defaultValue: "start 0.7",
    },
    scrollEnd: {
        title: "Animation End",
        type: ControlType.Enum,
        options: ["end 0.1", "end 0.3", "end 0.5", "end 0.8"],
        optionTitles: ["Very Late", "Late", "Natural", "Early"],
        defaultValue: "end 0.3",
    },
    animationDirection: {
        title: "Animation Direction",
        type: ControlType.Enum,
        options: ["forward", "reverse"],
        optionTitles: ["Left to Right", "Right to Left"],
        defaultValue: "forward",
    },
    animationStyle: {
        title: "Animation Style",
        type: ControlType.Enum,
        options: ["blur", "slideUp", "scale", "rotate", "wave", "glow"],
        optionTitles: [
            "Blur Reveal",
            "Slide Up",
            "Scale In",
            "Rotate 3D",
            "Wave",
            "Glow",
        ],
        defaultValue: "blur",
    },
    blurAmount: {
        title: "Blur Amount",
        type: ControlType.Number,
        min: 0,
        max: 20,
        step: 1,
        defaultValue: 10,
        displayStepper: true,
        hidden: (props) =>
            props.animationStyle !== "blur" &&
            props.animationStyle !== "wave" &&
            props.animationStyle !== "glow",
    },
    animationSpeed: {
        title: "Animation Speed",
        type: ControlType.Enum,
        options: ["slow", "natural", "fast"],
        optionTitles: ["Slow & Smooth", "Natural", "Quick & Snappy"],
        defaultValue: "natural",
    },
    springStiffness: {
        title: "Spring Stiffness",
        type: ControlType.Number,
        min: 50,
        max: 300,
        step: 10,
        defaultValue: 100,
        displayStepper: true,
    },
    springDamping: {
        title: "Spring Damping",
        type: ControlType.Number,
        min: 10,
        max: 50,
        step: 5,
        defaultValue: 30,
        displayStepper: true,
    },
    padding: {
        title: "Padding",
        type: ControlType.Padding,
        defaultValue: 20,
    },
    // Updated controls section
    paragraphSpacing: {
        title: "Paragraph Spacing",
        type: ControlType.Number,
        min: 0,
        max: 100,
        step: 2,
        defaultValue: 16,
        displayStepper: true,
    },
    lineBreakSpacing: {
        title: "Line Break Spacing",
        type: ControlType.Number,
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 0,
        displayStepper: true,
    },
})
