// Text animation with 2 variants: scroll trigger, and scroll scrub
// Highly customizable with performance optimizations for Framer
import { useRef, useMemo, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView, useScroll, useTransform } from "framer-motion"

interface AnimatedTextProps {
    text: string
    animationMode: "onScroll" | "scrub"
    splitBy: "chars" | "words" | "lines"
    delay: number
    stagger: number
    duration: number
    startX: number
    startY: number
    startOpacity: number
    startRotate: number
    startScale: number
    startSkewX: number
    ease: string
    scrollStart: string
    scrollEnd: string
    textColor: string
    font: CSSProperties
    style?: CSSProperties
}

/**
 * Animated Text Component
 * 
 * High-performance text animation with two modes:
 * - On Scroll: Triggers animation when scrolling into view
 * - Scrub: Animates based on scroll position
 * 
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 100
 * 
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function AnimatedText(props: AnimatedTextProps) {
    const {
        text = "Animated Text",
        animationMode = "onScroll",
        splitBy = "chars",
        delay = 0,
        stagger = 0.05,
        duration = 0.65,
        startX = 100,
        startY = 0,
        startOpacity = 0,
        startRotate = 0,
        startScale = 1,
        startSkewX = 20,
        ease = "easeOut",
        scrollStart = "top 80%",
        scrollEnd = "top 20%",
        textColor = "#000000",
        font,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: true, amount: 0.3 })
    const isStatic = useIsStaticRenderer()

    const scrollOffset = useMemo(() => {
        const normalize = (value: string) => {
            const safe = String(value || "").trim()
            if (!safe) return ""
            // framer-motion uses start/center/end; allow common synonyms.
            return safe
                .replace(/\btop\b/gi, "start")
                .replace(/\bbottom\b/gi, "end")
        }

        const start = normalize(scrollStart)
        const end = normalize(scrollEnd)

        // Fallback to a safe default if the user entered an invalid/empty offset.
        const fallback: [any, any] = ["start 0.8", "start 0.2"]
        return [start || fallback[0], end || fallback[1]] as any
    }, [scrollStart, scrollEnd])

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: scrollOffset,
    })

    // Split text into segments - ensure text is always a string
    const segments = useMemo(() => {
        const safeText = String(text || "")
        if (splitBy === "chars") {
            return safeText.split("")
        } else if (splitBy === "words") {
            return safeText.split(" ")
        } else {
            return safeText.split("\n")
        }
    }, [text, splitBy])

    // Easing function mapping
    const easingMap = {
        easeOut: [0.33, 1, 0.68, 1],
        easeInOut: [0.65, 0, 0.35, 1],
        easeIn: [0.32, 0, 0.67, 0],
        linear: [0, 0, 1, 1],
        spring: [0.34, 1.56, 0.64, 1],
    }

    const getEasing = (easeName: string) => easingMap[easeName] || easingMap.easeOut

    // Determine if animation should play
    const shouldAnimate = useMemo(() => {
        if (isStatic) return false
        if (animationMode === "onScroll") return isInView
        return true // scrub mode always active
    }, [isStatic, animationMode, isInView])

    // Static preview for canvas
    if (isStatic) {
        return (
            <div
                ref={containerRef}
                style={{
                    ...props.style,
                    color: textColor,
                    ...font,
                    width: "100%",
                    overflow: "hidden",
                }}
            >
                {text}
            </div>
        )
    }

    // Render scrub mode segments
    if (animationMode === "scrub") {
        return (
            <div
                ref={containerRef}
                style={{
                    ...props.style,
                    color: textColor,
                    ...font,
                    width: "100%",
                    overflow: "hidden",
                }}
            >
                {segments.map((segment, index) => {
                    const totalSegments = segments.length
                    
                    // Calculate progress range for this segment
                    // Each segment gets a portion of the scroll range with overlap
                    const segmentProgress = index / Math.max(totalSegments - 1, 1)
                    const staggerRange = stagger / (duration + stagger * totalSegments)
                    const durationRange = duration / (duration + stagger * totalSegments)
                    
                    const startProgress = Math.max(0, segmentProgress - staggerRange)
                    const endProgress = Math.min(1, segmentProgress + durationRange)
                    
                    return (
                        <ScrubSegment
                            key={index}
                            segment={segment}
                            index={index}
                            totalSegments={totalSegments}
                            scrollYProgress={scrollYProgress}
                            startProgress={startProgress}
                            endProgress={endProgress}
                            startX={startX}
                            startY={startY}
                            startOpacity={startOpacity}
                            startRotate={startRotate}
                            startScale={startScale}
                            startSkewX={startSkewX}
                            splitBy={splitBy}
                        />
                    )
                })}
            </div>
        )
    }

    // Render on mount or on scroll segments
    return (
        <div
            ref={containerRef}
            style={{
                ...props.style,
                color: textColor,
                ...font,
                width: "100%",
                overflow: "hidden",
            }}
        >
            {segments.map((segment, index) => {
                const segmentDelay = delay + (index * stagger)
                
                return (
                    <motion.span
                        key={index}
                        style={{
                            display: "inline-block",
                            whiteSpace: splitBy === "words" ? "nowrap" : "pre",
                        }}
                        initial={{
                            x: startX,
                            y: startY,
                            opacity: startOpacity,
                            rotate: startRotate,
                            scale: startScale,
                            skewX: startSkewX,
                        }}
                        animate={shouldAnimate ? {
                            x: 0,
                            y: 0,
                            opacity: 1,
                            rotate: 0,
                            scale: 1,
                            skewX: 0,
                        } : {}}
                        transition={{
                            duration,
                            delay: segmentDelay,
                            ease: getEasing(ease),
                        }}
                    >
                        {segment}
                        {splitBy === "words" && index < segments.length - 1 ? "\u00A0" : ""}
                    </motion.span>
                )
            })}
        </div>
    )
}

// Separate component for scrub segments to isolate useTransform hooks
function ScrubSegment({ 
    segment, 
    index, 
    totalSegments, 
    scrollYProgress, 
    startProgress, 
    endProgress,
    startX,
    startY,
    startOpacity,
    startRotate,
    startScale,
    startSkewX,
    splitBy
}) {
    const x = useTransform(scrollYProgress, [startProgress, endProgress], [startX, 0])
    const y = useTransform(scrollYProgress, [startProgress, endProgress], [startY, 0])
    const opacity = useTransform(scrollYProgress, [startProgress, endProgress], [startOpacity, 1])
    const rotate = useTransform(scrollYProgress, [startProgress, endProgress], [startRotate, 0])
    const scale = useTransform(scrollYProgress, [startProgress, endProgress], [startScale, 1])
    const skewX = useTransform(scrollYProgress, [startProgress, endProgress], [startSkewX, 0])

    return (
        <motion.span
            style={{
                display: "inline-block",
                whiteSpace: splitBy === "words" ? "nowrap" : "pre",
                x,
                y,
                opacity,
                rotate,
                scale,
                skewX,
            }}
        >
            {segment}
            {splitBy === "words" && index < totalSegments - 1 ? "\u00A0" : ""}
        </motion.span>
    )
}

addPropertyControls(AnimatedText, {
    text: {
        type: ControlType.String,
        title: "Text",
        description: "The text to animate. Use line breaks (\n) when Split By is set to Lines.",
        defaultValue: "Animated Text",
        displayTextArea: true,
    },
    animationMode: {
        type: ControlType.Enum,
        title: "Mode",
        description: "Choose how the text animates: trigger when it scrolls into view, or scrub with scroll position.",
        options: ["onScroll", "scrub"],
        optionTitles: ["On Scroll", "Scroll Scrub"],
        defaultValue: "onScroll",
        displaySegmentedControl: true,
    },
    splitBy: {
        type: ControlType.Enum,
        title: "Split By",
        description: "Split the text into segments for staggered animation.",
        options: ["chars", "words", "lines"],
        optionTitles: ["Characters", "Words", "Lines"],
        defaultValue: "chars",
        displaySegmentedControl: true,
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        description: "Delay before the first segment starts (On Scroll mode only).",
        defaultValue: 0,
        min: 0,
        max: 3,
        step: 0.1,
        unit: "s",
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        description: "Time between each segment starting. In Scrub mode, this affects segment spacing across scroll progress.",
        defaultValue: 0.05,
        min: 0,
        max: 0.5,
        step: 0.01,
        unit: "s",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.65,
        min: 0.1,
        max: 3,
        step: 0.05,
        unit: "s",
    },
    ease: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["easeOut", "easeInOut", "easeIn", "linear", "spring"],
        optionTitles: ["Ease Out", "Ease In Out", "Ease In", "Linear", "Spring"],
        defaultValue: "easeOut",
    },
    startX: {
        type: ControlType.Number,
        title: "Start X",
        defaultValue: 100,
        min: -500,
        max: 500,
        step: 10,
        unit: "px",
    },
    startY: {
        type: ControlType.Number,
        title: "Start Y",
        defaultValue: 0,
        min: -500,
        max: 500,
        step: 10,
        unit: "px",
    },
    startOpacity: {
        type: ControlType.Number,
        title: "Start Opacity",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.1,
    },
    startRotate: {
        type: ControlType.Number,
        title: "Start Rotate",
        defaultValue: 0,
        min: -180,
        max: 180,
        step: 5,
        unit: "°",
    },
    startScale: {
        type: ControlType.Number,
        title: "Start Scale",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.1,
    },
    startSkewX: {
        type: ControlType.Number,
        title: "Start Skew X",
        defaultValue: 20,
        min: -45,
        max: 45,
        step: 1,
        unit: "°",
    },
    scrollStart: {
        type: ControlType.String,
        title: "Scroll Start",
        description: "Scroll offset where progress starts (Framer Motion offset syntax). Example: 'top 80%'.",
        defaultValue: "top 80%",
        placeholder: "top 80%",
        hidden: ({ animationMode }) => animationMode !== "scrub",
    },
    scrollEnd: {
        type: ControlType.String,
        title: "Scroll End",
        description: "Scroll offset where progress ends. Example: 'top 20%'.",
        defaultValue: "top 20%",
        placeholder: "top 20%",
        hidden: ({ animationMode }) => animationMode !== "scrub",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
    },
})
