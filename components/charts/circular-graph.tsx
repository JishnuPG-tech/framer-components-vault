// Circular Graph component with customizable stroke, fill, value, font, and animation toggle
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useMemo, useRef, useLayoutEffect, useState } from "react"
import { useInView } from "framer-motion"

interface CircularProgressGraphProps {
    value: number
    strokeWidth: number
    strokeColor: string
    fillColor: string
    valueFont: any
    textStyle?: string
    animate: boolean
    animationDuration: number
    style?: React.CSSProperties
}

/**
 * Circular Graph
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CircularProgressGraph(props: CircularProgressGraphProps) {
    const {
        value = 66,
        strokeWidth = 2,
        strokeColor = "#fff",
        fillColor = "#FFB347",

        valueFont = {
            fontSize: 32,
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
        textStyle = "Custom",
        animate = true,
        animationDuration = 0.9,
        style = {},
    } = props

    // Determine which font style to use
    const appliedFont = useMemo(() => {
        if (textStyle && textStyle !== "Custom" && textStyleMap[textStyle]) {
            return textStyleMap[textStyle]
        }
        return valueFont
    }, [textStyle, valueFont])

    // Sizing
    // Responsive sizing
    const containerRef = useRef<HTMLDivElement>(null)
    const [containerSize, setContainerSize] = useState({ width: 180, height: 220 })

    useLayoutEffect(() => {
        if (!containerRef.current) return
        const node = containerRef.current
        function update() {
            setContainerSize({
                width: node.offsetWidth,
                height: node.offsetHeight,
            })
        }
        update()
        // @ts-ignore
        const ro = new (window.ResizeObserver || window.MozResizeObserver || window.WebKitResizeObserver)(update)
        ro.observe(node)
        return () => ro.disconnect()
    }, [])

    // Reserve space for text below the SVG
    const textMargin = 16
    const minTextHeight = 32
    const textHeight = Math.max(minTextHeight, containerSize.height * 0.13)
    const availableHeight = Math.max(0, containerSize.height - textHeight - textMargin)
    const size = Math.max(0, Math.min(containerSize.width, availableHeight))
    const radius = (size - strokeWidth) / 2
    const center = size / 2

    // Clamp value
    const percent = Math.max(0, Math.min(100, value))

    // Animation for appear effect and counter
    const [animatedPercent, setAnimatedPercent] = useState(animate ? 0 : percent)
    const [displayedValue, setDisplayedValue] = useState(animate ? 0 : percent)

    // In-view detection
    const inViewRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(inViewRef, { once: true, margin: "-20% 0px -20% 0px" })

    useLayoutEffect(() => {
        if (!animate) {
            setAnimatedPercent(percent)
            setDisplayedValue(percent)
            return
        }
        if (!isInView) return
        let frame: number
        let start: number | null = null
        const duration = Math.max(0.1, animationDuration) * 1000 // ms
        const from = 0
        const to = percent
        function step(ts: number) {
            if (start === null) start = ts
            const elapsed = ts - start
            let t = Math.min(1, elapsed / duration)
            // ease-out cubic
            t = 1 - Math.pow(1 - t, 3)
            const current = from + (to - from) * t
            setAnimatedPercent(current)
            setDisplayedValue(Math.round(current))
            if (t < 1) {
                frame = requestAnimationFrame(step)
            } else {
                setAnimatedPercent(to)
                setDisplayedValue(Math.round(to))
            }
        }
        frame = requestAnimationFrame(step)
        return () => cancelAnimationFrame(frame)
    }, [percent, animate, isInView, animationDuration])

    // Ensure innerRadius is always between 0 and maxInnerRadius
    const maxInnerRadius = Math.max(0, radius - strokeWidth * 2)
    const innerRadius = maxInnerRadius * (animatedPercent / 100)
    // Anchor the bottom of the inner circle to the bottom of the outer circle
    // If innerRadius is 0, innerCenterY should be at the bottom; if max, at center
    const innerCenterY = center + radius - innerRadius

    // Use solid fill color for inner circle
    const fill = fillColor

    // Calculate y positions for lines (in px, relative to SVG)
    // Top line at the top of the inner circle (animated)
    const topY = innerCenterY - innerRadius
    // Bottom line at the bottom of the outer circle
    const bottomY = center + radius

    // Calculate SVG vertical offset to center it in the available space
    const svgTop = Math.max(0, (containerSize.height - textHeight - textMargin - size) / 2)

    return (
        <div
            ref={el => {
                containerRef.current = el
                inViewRef.current = el
            }}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                minHeight: 120,
                position: "relative",
                background: "transparent",
            }}
        >
            {/* Top horizontal line, always attached to top of inner circle */}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    width: "100%",
                    height: 1,
                    background: strokeColor,
                    top: svgTop + topY,
                    zIndex: 2,
                }}
            />
            {/* Bottom horizontal line, always attached to bottom of outer circle */}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    width: "100%",
                    height: 1,
                    background: strokeColor,
                    top: svgTop + bottomY,
                    zIndex: 2,
                }}
            />
            <div
                style={{
                    width: size,
                    height: size,
                    position: "absolute",
                    left: "50%",
                    top: svgTop,
                    transform: "translateX(-50%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <svg width={size} height={size} style={{ display: "block", position: "relative", zIndex: 1 }}>
                    {/* Outer Circle */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        fill="none"
                        style={{
                            paintOrder: "stroke",
                        }}
                    />
                    {/* Inner Circle (filled) */}
                    <circle
                        cx={center}
                        cy={innerCenterY}
                        r={innerRadius}
                        fill={fill}
                        style={{}}
                    />
                </svg>
            </div>
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    width: "100%",
                    top: svgTop + size + textMargin,
                    color: strokeColor,
                    textAlign: "center",
                    userSelect: "none",
                    ...appliedFont,
                    fontSize: appliedFont.fontSize || Math.max(20, size * 0.22),
                }}
            >
                {displayedValue}%
            </div>
        </div>
    )
}

const textStyles = [
    { key: "Custom", title: "Custom" },
    { key: "heading1", title: "Heading 1" },
    { key: "heading2", title: "Heading 2" },
    { key: "heading3", title: "Heading 3" },
    { key: "heading4", title: "Heading 4" },
    { key: "paragraph", title: "Paragraph" },
    { key: "buttonText", title: "Button Text" },
]
const textStyleMap = {
    heading1: {
        fontSize: "40px",
        variant: "Bold",
        letterSpacing: "-0.04em",
        lineHeight: "1em",
    },
    heading2: {
        fontSize: "32px",
        variant: "Semibold",
        letterSpacing: "-0.03em",
        lineHeight: "1em",
    },
    heading3: {
        fontSize: "22px",
        variant: "Semibold",
        letterSpacing: "-0.01em",
        lineHeight: "1.2em",
    },
    heading4: {
        fontSize: "15px",
        variant: "Medium",
        letterSpacing: "-0.01em",
        lineHeight: "1em",
    },
    paragraph: {
        fontSize: "15px",
        variant: "Medium",
        letterSpacing: "-0.01em",
        lineHeight: "1.3em",
    },
    buttonText: {
        variant: "Semibold",
        fontSize: "14px",
        letterSpacing: "-0.01em",
        lineHeight: "1em",
    },
}

addPropertyControls(CircularProgressGraph, {
    value: {
        type: ControlType.Number,
        title: "Value",
        min: 0,
        max: 100,
        defaultValue: 66,
        unit: "%",
        displayStepper: true,
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        min: 1,
        max: 16,
        defaultValue: 2,
        unit: "px",
        displayStepper: true,
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Stroke Color",
        defaultValue: "#FFFFFF",
    },
    fillColor: {
        type: ControlType.Color,
        title: "Fill Color",
        defaultValue: "#FFB347",
    },
    textStyle: {
        type: ControlType.Enum,
        title: "Text Style",
        options: textStyles.map(s => s.key),
        optionTitles: textStyles.map(s => s.title),
        defaultValue: "Custom",
    },
    valueFont: {
        type: ControlType.Font,
        title: "Value Font",
        defaultValue: {
            fontSize: 32,
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        hidden: (props) => props.textStyle && props.textStyle !== "Custom",
    },
    animate: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Anim Duration",
        min: 0.1,
        max: 10,
        step: 0.1,
        defaultValue: 0.9,
        unit: "s",
        displayStepper: true,
    },
})
