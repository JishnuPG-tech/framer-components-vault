/**
 * Made with 💛 by Karim Saif
 * Created and customized for Framer by Karim Saif
 *
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 360
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

"use client"

import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface FontValue {
    fontFamily?: string
    fontWeight?: number | string
    fontStyle?: string
    letterSpacing?: string | number
}

interface Props {
    text: string
    font: FontValue
    fontSize: number
    strokeWidth: number
    duration: number
    startColor: string
    endColor: string
    loop: boolean
    alignment: "left" | "center" | "right"
    verticalPosition: number
    drawLength: number
    style?: React.CSSProperties
}

const COMPONENT_AUTHOR = "Karim Saif"

function getFontFamily(font: FontValue | undefined): string {
    if (font && typeof font.fontFamily === "string" && font.fontFamily.trim()) {
        return font.fontFamily
    }

    return "Inter, sans-serif"
}

function getFontWeight(font: FontValue | undefined): number | string {
    if (
        font &&
        (typeof font.fontWeight === "number" ||
            typeof font.fontWeight === "string")
    ) {
        return font.fontWeight
    }

    return 700
}

function getFontStyle(font: FontValue | undefined): string {
    if (font && typeof font.fontStyle === "string" && font.fontStyle.trim()) {
        return font.fontStyle
    }

    return "normal"
}

function getLetterSpacing(
    font: FontValue | undefined
): string | number | undefined {
    if (
        font &&
        (typeof font.letterSpacing === "number" ||
            typeof font.letterSpacing === "string")
    ) {
        return font.letterSpacing
    }

    return undefined
}

export default function KarimSaifPathDrawing(props: Props) {
    const {
        text,
        font,
        fontSize,
        strokeWidth,
        duration,
        startColor,
        endColor,
        loop,
        alignment,
        verticalPosition,
        drawLength,
        style,
    } = props

    const isStaticRenderer = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()

    const textRef = React.useRef<SVGTextElement>(null)

    const [measuredLength, setMeasuredLength] = React.useState(0)

    const gradientId = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const animationBaseId = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")

    const displayText =
        typeof text === "string" && text.trim().length > 0
            ? text
            : "PATH DRAWING"

    const safeFontSize = Math.max(8, Math.min(180, Number(fontSize) || 88))

    const safeStrokeWidth = Math.max(
        0.1,
        Math.min(20, Number(strokeWidth) || 2)
    )

    const safeDuration = Math.max(0.1, Math.min(60, Number(duration) || 8))

    const safeDrawLength = Math.max(
        100,
        Math.min(10000, Number(drawLength) || 1000)
    )

    const safeVerticalPosition = Math.max(
        5,
        Math.min(95, Number(verticalPosition) || 50)
    )

    const fontFamily = getFontFamily(font)
    const fontWeight = getFontWeight(font)
    const fontStyle = getFontStyle(font)
    const letterSpacing = getLetterSpacing(font)

    React.useEffect(() => {
        const element = textRef.current

        if (!element) return

        let cancelled = false
        let frame = 0

        const measure = () => {
            if (cancelled) return

            const currentElement = textRef.current

            if (!currentElement) return

            let length = 0

            try {
                length = currentElement.getComputedTextLength()
            } catch {
                length = 0
            }

            if (Number.isFinite(length) && length > 0 && !cancelled) {
                setMeasuredLength((previous) => {
                    if (Math.abs(previous - length) < 0.5) {
                        return previous
                    }

                    return length
                })
            }
        }

        frame = window.requestAnimationFrame(measure)

        if (
            typeof document !== "undefined" &&
            "fonts" in document &&
            document.fonts
        ) {
            document.fonts.ready.then(() => {
                if (cancelled) return

                window.requestAnimationFrame(measure)
            })
        }

        return () => {
            cancelled = true

            if (frame) {
                window.cancelAnimationFrame(frame)
            }
        }
    }, [
        displayText,
        fontFamily,
        fontWeight,
        fontStyle,
        letterSpacing,
        safeFontSize,
        alignment,
    ])

    const effectiveDashLength = Math.max(
        safeDrawLength,
        measuredLength > 0 ? measuredLength * 1.05 : safeDrawLength
    )

    const shouldAnimate =
        !isStaticRenderer && !reducedMotion && effectiveDashLength > 0

    let textAnchor: "start" | "middle" | "end" = "middle"

    let textX = "50%"

    if (alignment === "left") {
        textAnchor = "start"
        textX = "2%"
    } else if (alignment === "right") {
        textAnchor = "end"
        textX = "98%"
    }

    const animationName = `${animationBaseId}-${Math.round(
        effectiveDashLength
    )}`

    const textStyle: React.CSSProperties = {
        fontFamily,
        fontWeight,
        fontStyle,
        ...(letterSpacing !== undefined ? { letterSpacing } : {}),
        ...(shouldAnimate
            ? {
                  animationName,
                  animationDuration: `${safeDuration}s`,
                  animationTimingFunction: "cubic-bezier(0.25, 0.1, 0.25, 1)",
                  animationIterationCount: loop ? "infinite" : "1",
                  animationFillMode: "forwards",
              }
            : {}),
    }

    return (
        <div
            data-component-author={COMPONENT_AUTHOR}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 800 160"
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label={displayText}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                }}
            >
                <defs>
                    <linearGradient
                        id={gradientId}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                    >
                        <stop offset="0%" stopColor={startColor} />

                        <stop offset="100%" stopColor={endColor} />
                    </linearGradient>
                </defs>

                <text
                    ref={textRef}
                    x={textX}
                    y={`${safeVerticalPosition}%`}
                    textAnchor={textAnchor}
                    dominantBaseline="middle"
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={safeStrokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fontSize={safeFontSize}
                    strokeDasharray={`${effectiveDashLength} ${effectiveDashLength}`}
                    strokeDashoffset={shouldAnimate ? effectiveDashLength : 0}
                    style={textStyle}
                >
                    {displayText}
                </text>

                {shouldAnimate && (
                    <style>
                        {`
                            @keyframes ${animationName} {
                                0% {
                                    stroke-dashoffset: ${effectiveDashLength};
                                }

                                100% {
                                    stroke-dashoffset: 0;
                                }
                            }
                        `}
                    </style>
                )}
            </svg>
        </div>
    )
}

KarimSaifPathDrawing.displayName = "Karim Saif Path Drawing"

addPropertyControls(KarimSaifPathDrawing, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "PATH DRAWING",
        displayTextArea: true,
        description: "Sets the text that is revealed by the animated stroke.",
    },

    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 700,
        },
        description:
            "Selects the font family, weight, style, and related typography settings.",
    },

    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 88,
        min: 8,
        max: 180,
        step: 1,
        unit: "px",
        description: "Controls the size of the animated text.",
    },

    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        defaultValue: 2,
        min: 0.1,
        max: 20,
        step: 0.1,
        unit: "px",
        description:
            "Controls the thickness of the outline used to draw the text.",
    },

    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 8,
        min: 0.1,
        max: 60,
        step: 0.1,
        unit: "s",
        description:
            "Controls how long one complete text-drawing animation takes.",
    },

    startColor: {
        type: ControlType.Color,
        title: "Start Color",
        defaultValue: "#F093FB",
        description: "Sets the gradient color at the beginning of the text.",
    },

    endColor: {
        type: ControlType.Color,
        title: "End Color",
        defaultValue: "#F5576C",
        description: "Sets the gradient color at the end of the text.",
    },

    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        description: "Continuously repeats the drawing animation when enabled.",
    },

    alignment: {
        type: ControlType.Enum,
        title: "Alignment",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        description: "Controls the horizontal alignment of the text.",
    },

    verticalPosition: {
        type: ControlType.Number,
        title: "Vertical Position",
        defaultValue: 50,
        min: 5,
        max: 95,
        step: 1,
        unit: "%",
        description:
            "Controls the vertical position of the text inside the component.",
    },

    drawLength: {
        type: ControlType.Number,
        title: "Draw Length",
        defaultValue: 1000,
        min: 100,
        max: 10000,
        step: 10,
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})
