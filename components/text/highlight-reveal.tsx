// Highlight Reveal - Animates a realistic marker scribble over headings or text as you scroll
import {
    useRef,
    useEffect,
    useState,
    startTransition,
    type CSSProperties,
} from "react"
import { motion, useInView, useAnimation } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface HighlightRevealProps {
    text: string
    highlightColor: string
    textColor: string
    font: any
    highlightStyle: "underline" | "strikethrough" | "circle" | "box"
    animationDuration: number
    animationDelay: number
    strokeWidth: number
    opacity: number
    style?: CSSProperties
}

/**
 * Highlight Reveal - Animates a realistic marker scribble over text as you scroll
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function HighlightReveal(props: HighlightRevealProps) {
    const {
        text = "Highlight this text",
        highlightColor = "#FFEB3B",
        textColor = "#000000",
        font,
        highlightStyle = "underline",
        animationDuration = 1.2,
        animationDelay = 0.2,
        strokeWidth = 8,
        opacity = 0.7,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: true, margin: "-20%" })
    const controls = useAnimation()
    const isStatic = useIsStaticRenderer()
    const [textDimensions, setTextDimensions] = useState({
        width: 0,
        height: 0,
    })

    useEffect(() => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            startTransition(() => {
                setTextDimensions({ width: rect.width, height: rect.height })
            })
        }
    }, [text, font])

    useEffect(() => {
        if (isInView && !isStatic) {
            controls.start("visible")
        } else if (isStatic) {
            controls.set("visible")
        }
    }, [isInView, controls, isStatic])

    const getHighlightPath = () => {
        const { width, height } = textDimensions
        const padding = strokeWidth / 2

        switch (highlightStyle) {
            case "underline":
                return `M ${padding} ${height - padding} Q ${width * 0.3} ${height - padding - 2} ${width * 0.6} ${height - padding + 1} T ${width - padding} ${height - padding}`
            case "strikethrough":
                return `M ${padding} ${height * 0.5} Q ${width * 0.25} ${height * 0.5 - 2} ${width * 0.5} ${height * 0.5 + 1} Q ${width * 0.75} ${height * 0.5 - 1} ${width - padding} ${height * 0.5}`
            case "circle":
                const centerX = width / 2
                const centerY = height / 2
                const radiusX = (width - padding * 2) / 2
                const radiusY = (height - padding * 2) / 2
                return `M ${centerX - radiusX} ${centerY} Q ${centerX} ${centerY - radiusY - 3} ${centerX + radiusX} ${centerY} Q ${centerX + radiusX + 2} ${centerY + radiusY} ${centerX} ${centerY + radiusY + 1} Q ${centerX - radiusX - 2} ${centerY} ${centerX - radiusX} ${centerY}`
            case "box":
                return `M ${padding} ${padding + 2} Q ${width * 0.25} ${padding - 1} ${width * 0.5} ${padding + 1} Q ${width * 0.75} ${padding - 1} ${width - padding} ${padding + 2} L ${width - padding + 1} ${height - padding - 1} Q ${width * 0.75} ${height - padding + 1} ${width * 0.5} ${height - padding - 1} Q ${width * 0.25} ${height - padding + 1} ${padding} ${height - padding - 1} Z`
            default:
                return ""
        }
    }

    const pathLength = getHighlightPath().length * 0.01

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                display: "inline-block",
                ...props.style,
            }}
        >
            <span
                style={{
                    color: textColor,
                    position: "relative",
                    zIndex: 1,
                    ...font,
                }}
            >
                {text}
            </span>

            {textDimensions.width > 0 && (
                <motion.svg
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: textDimensions.width,
                        height: textDimensions.height,
                        pointerEvents: "none",
                        zIndex: 0,
                    }}
                    viewBox={`0 0 ${textDimensions.width} ${textDimensions.height}`}
                    initial="hidden"
                    animate={controls}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: { delay: animationDelay },
                        },
                    }}
                >
                    <motion.path
                        d={getHighlightPath()}
                        stroke={highlightColor}
                        strokeWidth={strokeWidth}
                        fill={
                            highlightStyle === "box" ? highlightColor : "none"
                        }
                        fillOpacity={
                            highlightStyle === "box" ? opacity * 0.3 : 0
                        }
                        strokeOpacity={opacity}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={controls}
                        variants={{
                            hidden: { pathLength: 0 },
                            visible: {
                                pathLength: 1,
                                transition: {
                                    duration: animationDuration,
                                    ease: "easeInOut",
                                    delay: animationDelay,
                                },
                            },
                        }}
                        style={{
                            filter: "url(#roughPaper)",
                        }}
                    />
                    <defs>
                        <filter
                            id="roughPaper"
                            x="0%"
                            y="0%"
                            width="100%"
                            height="100%"
                        >
                            <feTurbulence
                                baseFrequency="0.04"
                                numOctaves="5"
                                result="noise"
                                seed="1"
                            />
                            <feDisplacementMap
                                in="SourceGraphic"
                                in2="noise"
                                scale="1"
                            />
                        </filter>
                    </defs>
                </motion.svg>
            )}
        </div>
    )
}

addPropertyControls(HighlightReveal, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Highlight this text",
    },
    highlightColor: {
        type: ControlType.Color,
        title: "Highlight Color",
        defaultValue: "#FFEB3B",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "32px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    highlightStyle: {
        type: ControlType.Enum,
        title: "Highlight Style",
        options: ["underline", "strikethrough", "circle", "box"],
        optionTitles: ["Underline", "Strikethrough", "Circle", "Box"],
        defaultValue: "underline",
        displaySegmentedControl: true,
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 1.2,
        min: 0.3,
        max: 3,
        step: 0.1,
        unit: "s",
    },
    animationDelay: {
        type: ControlType.Number,
        title: "Animation Delay",
        defaultValue: 0.2,
        min: 0,
        max: 2,
        step: 0.1,
        unit: "s",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        defaultValue: 8,
        min: 2,
        max: 20,
        step: 1,
        unit: "px",
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 0.7,
        min: 0.1,
        max: 1,
        step: 0.1,
    },
})
