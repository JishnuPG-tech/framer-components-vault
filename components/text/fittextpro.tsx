// Text component with "fit" font size that scales to container and supports variable content
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, useState, startTransition } from "react"

interface FitTextProProps {
    text: string
    textColor: string
    font: any
    letterSpacing: string
    lineHeight: string
    textAlign: "left" | "center" | "right"
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight any
 */
export default function FitTextPro(props: FitTextProProps) {
    const { text, textColor, font, letterSpacing, lineHeight, textAlign } =
        props

    const containerRef = useRef<HTMLDivElement>(null)
    const textRef = useRef<HTMLDivElement>(null)
    const [fontSize, setFontSize] = useState(100)

    useEffect(() => {
        const fitText = () => {
            if (!containerRef.current || !textRef.current) return

            const container = containerRef.current
            const textElement = textRef.current

            const containerWidth = container.clientWidth

            // Ensure we have valid dimensions
            if (containerWidth <= 0) return

            let low = 8 // Minimum font size to prevent 1px issues
            let high = 1000
            let bestFit = 8
            let iterations = 0
            const maxIterations = 30

            while (low <= high && iterations < maxIterations) {
                iterations++
                const mid = Math.floor((low + high) / 2)
                textElement.style.fontSize = `${mid}px`

                const textWidth = textElement.scrollWidth

                // Only constrain by width, let height grow naturally
                if (textWidth <= containerWidth) {
                    bestFit = mid
                    low = mid + 1
                } else {
                    high = mid - 1
                }
            }

            startTransition(() => setFontSize(bestFit))
        }

        fitText()

        if (typeof window !== "undefined") {
            const resizeObserver = new ResizeObserver(() => {
                fitText()
            })
            if (containerRef.current) {
                resizeObserver.observe(containerRef.current)
            }

            return () => {
                resizeObserver.disconnect()
            }
        }
    }, [text, font, letterSpacing, lineHeight])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "flex-start",
                justifyContent:
                    textAlign === "left"
                        ? "flex-start"
                        : textAlign === "right"
                          ? "flex-end"
                          : "center",
                overflow: "visible",
                position: "relative",
            }}
        >
            <div
                ref={textRef}
                style={{
                    fontSize: `${fontSize}px`,
                    color: textColor,
                    fontFamily: font?.fontFamily,
                    fontWeight: font?.fontWeight,
                    fontStyle: font?.fontStyle,
                    letterSpacing: letterSpacing,
                    lineHeight: lineHeight,
                    textAlign: textAlign,
                    whiteSpace: "nowrap",
                    wordBreak: "break-word",
                    maxWidth: "100%",
                    position: "relative",
                    visibility: "visible",
                }}
            >
                {text}
            </div>
        </div>
    )
}

addPropertyControls(FitTextPro, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Fit Text Pro",
        displayTextArea: true,
    },
    textColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            variant: "Bold",
        },
    },
    letterSpacing: {
        type: ControlType.String,
        title: "Letter Spacing",
        defaultValue: "-0.02em",
    },
    lineHeight: {
        type: ControlType.String,
        title: "Line Height",
        defaultValue: "1em",
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
        description:
            "Made by [Mo](https://framer.com/%40mogy-studio) at [Mogy Studio](https://mogy.studio)",
    },
})
