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


/**
 * HOVERLIGHT
 *
 * One text block with independently styled lines.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 600
 */

type FillStyle =
    | "solid"
    | "halftone"
    | "stripes"
    | "grid"
    | "checker"
    | "gradient"

type TextAlign = "left" | "center" | "right"
type RestPosition = "hidden" | "center"

type LineStyle = {
    fillStyle: FillStyle
    baseColor: string
    highlightColor: string
    secondaryColor: string
    patternSize: number
    patternGap: number
    patternAngle: number
    patternOpacity: number
    offsetX: number
    scaleX: number
}

type Props = {
    text?: string
    lineStyles?: LineStyle[]

    font?: any
    textAlign?: TextAlign
    wrap?: boolean
    lineHeight?: number
    letterSpacing?: number
    lineGap?: number

    spotlightSize?: number
    softness?: number
    followSpeed?: number
    fadeDuration?: number

    restPosition?: RestPosition
    restOpacity?: number

    paddingTop?: number
    paddingRight?: number
    paddingBottom?: number
    paddingLeft?: number

    style?: React.CSSProperties
}

const defaultLineStyle: LineStyle = {
    fillStyle: "halftone",
    baseColor: "#353535",
    highlightColor: "#FFFFFF",
    secondaryColor: "#777777",
    patternSize: 2,
    patternGap: 2,
    patternAngle: 45,
    patternOpacity: 0.7,
    offsetX: 0,
    scaleX: 1,
}

const defaultLineStyles: LineStyle[] = [
    { ...defaultLineStyle, fillStyle: "halftone" },
    { ...defaultLineStyle, fillStyle: "stripes", patternGap: 4 },
    { ...defaultLineStyle, fillStyle: "grid", patternSize: 1, patternGap: 5 },
    { ...defaultLineStyle, fillStyle: "solid" },
]

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

/**
 * Returns an rgba() string, or null when the color format
 * can't be safely converted (Framer color tokens, hsl, etc.).
 * Callers fall back to element-level opacity in that case.
 */
function colorWithOpacity(color: string, opacity: number): string | null {
    const safeOpacity = clamp(opacity, 0, 1)

    if (!color) {
        return `rgba(255,255,255,${safeOpacity})`
    }

    if (color.startsWith("#")) {
        let hex = color.slice(1)

        if (hex.length === 3) {
            hex = hex
                .split("")
                .map((character) => character + character)
                .join("")
        }

        if (hex.length === 6) {
            const red = parseInt(hex.slice(0, 2), 16)
            const green = parseInt(hex.slice(2, 4), 16)
            const blue = parseInt(hex.slice(4, 6), 16)

            return `rgba(${red},${green},${blue},${safeOpacity})`
        }

        if (hex.length === 8) {
            const red = parseInt(hex.slice(0, 2), 16)
            const green = parseInt(hex.slice(2, 4), 16)
            const blue = parseInt(hex.slice(4, 6), 16)
            const alpha = (parseInt(hex.slice(6, 8), 16) / 255) * safeOpacity

            return `rgba(${red},${green},${blue},${alpha})`
        }

        return null
    }

    if (color.startsWith("rgb(")) {
        return color.replace("rgb(", "rgba(").replace(")", `,${safeOpacity})`)
    }

    if (color.startsWith("rgba(")) {
        const values = color
            .replace("rgba(", "")
            .replace(")", "")
            .split(",")
            .map((value) => value.trim())

        const alpha = (parseFloat(values[3]) || 1) * safeOpacity

        return `rgba(${values[0]},${values[1]},${values[2]},${alpha})`
    }

    // Unknown format (var(--token-...), hsl, named colors)
    return null
}

function getFillStyle(
    lineStyle: LineStyle,
    color: string
): React.CSSProperties {
    const patternSize = Math.max(0.25, lineStyle.patternSize || 1)
    const patternGap = Math.max(0, lineStyle.patternGap || 0)

    const cellSize = Math.max(patternSize + patternGap, patternSize + 0.1)

    const opacity = clamp(lineStyle.patternOpacity ?? 1, 0, 1)

    // If conversion fails, use the raw color and apply
    // opacity on the element instead.
    const converted = colorWithOpacity(color, opacity)
    const visibleColor = converted ?? color
    const elementOpacity = converted ? 1 : opacity

    const convertedSecond = colorWithOpacity(
        lineStyle.secondaryColor || color,
        opacity
    )
    const secondColor = convertedSecond ?? (lineStyle.secondaryColor || color)

    const clippedTextStyle: React.CSSProperties = {
        color: "transparent",
        WebkitTextFillColor: "transparent",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        backgroundRepeat: "repeat",
        opacity: elementOpacity,
    }

    switch (lineStyle.fillStyle) {
        case "halftone": {
            const dotRadius = patternSize / 2

            return {
                ...clippedTextStyle,
                backgroundImage: `radial-gradient(
                    circle,
                    ${visibleColor} 0px,
                    ${visibleColor} ${dotRadius}px,
                    transparent ${dotRadius + 0.2}px
                )`,
                backgroundSize: `${cellSize}px ${cellSize}px`,
            }
        }

        case "stripes":
            return {
                ...clippedTextStyle,
                backgroundImage: `repeating-linear-gradient(
                    ${lineStyle.patternAngle}deg,
                    ${visibleColor} 0px,
                    ${visibleColor} ${patternSize}px,
                    transparent ${patternSize}px,
                    transparent ${cellSize}px
                )`,
            }

        case "grid":
            return {
                ...clippedTextStyle,
                backgroundImage: `
                    repeating-linear-gradient(
                        0deg,
                        ${visibleColor} 0px,
                        ${visibleColor} ${patternSize}px,
                        transparent ${patternSize}px,
                        transparent ${cellSize}px
                    ),
                    repeating-linear-gradient(
                        90deg,
                        ${visibleColor} 0px,
                        ${visibleColor} ${patternSize}px,
                        transparent ${patternSize}px,
                        transparent ${cellSize}px
                    )
                `,
            }

        case "checker":
            return {
                ...clippedTextStyle,
                backgroundImage: `
                    linear-gradient(
                        45deg,
                        ${visibleColor} 25%,
                        transparent 25%,
                        transparent 75%,
                        ${visibleColor} 75%
                    ),
                    linear-gradient(
                        45deg,
                        ${visibleColor} 25%,
                        transparent 25%,
                        transparent 75%,
                        ${visibleColor} 75%
                    )
                `,
                backgroundSize: `${cellSize}px ${cellSize}px`,
                backgroundPosition: `
                    0 0,
                    ${cellSize / 2}px ${cellSize / 2}px
                `,
            }

        case "gradient":
            return {
                ...clippedTextStyle,
                backgroundImage: `linear-gradient(
                    ${lineStyle.patternAngle}deg,
                    ${visibleColor},
                    ${secondColor}
                )`,
                backgroundSize: "100% 100%",
            }

        case "solid":
        default:
            return {
                color,
                WebkitTextFillColor: color,
                opacity,
            }
    }
}

function getLineStyle(lineStyles: LineStyle[], index: number): LineStyle {
    if (!lineStyles || lineStyles.length === 0) {
        return defaultLineStyle
    }

    return {
        ...defaultLineStyle,
        ...(lineStyles[index] ??
            lineStyles[lineStyles.length - 1] ??
            defaultLineStyle),
    }
}

function getHorizontalAlignment(textAlign: TextAlign) {
    if (textAlign === "left") return "flex-start"
    if (textAlign === "right") return "flex-end"
    return "center"
}

type TextLayerProps = {
    text: string
    lineStyles: LineStyle[]
    font: any
    textAlign: TextAlign
    wrap: boolean
    lineHeight: number
    letterSpacing: number
    lineGap: number
    highlighted: boolean
}

function TextLayer(props: TextLayerProps) {
    const {
        text,
        lineStyles,
        font,
        textAlign,
        wrap,
        lineHeight,
        letterSpacing,
        lineGap,
        highlighted,
    } = props

    const lines = text.split("\n")

    return (
        <div
            aria-hidden={highlighted}
            style={{
                ...font,

                position: "relative",
                width: "100%",

                display: "flex",
                flexDirection: "column",
                alignItems: getHorizontalAlignment(textAlign),

                margin: 0,
                padding: 0,

                pointerEvents: "none",
                overflow: "visible",
            }}
        >
            {lines.map((line, index) => {
                const currentLineStyle = getLineStyle(lineStyles, index)

                const fillColor = highlighted
                    ? currentLineStyle.highlightColor
                    : currentLineStyle.baseColor

                return (
                    <div
                        key={`${index}-${line}`}
                        style={{
                            ...getFillStyle(currentLineStyle, fillColor),

                            display: "block",
                            width: "fit-content",
                            maxWidth: "100%",

                            // Negative gap support: margin
                            // instead of flex gap (flex gap
                            // rejects negative values)
                            marginTop: index > 0 ? lineGap : 0,

                            padding: "0.08em 0 0.12em",
                            boxSizing: "border-box",

                            textAlign,
                            lineHeight,
                            letterSpacing: `${letterSpacing}em`,

                            // pre-wrap keeps manual \n breaks
                            // but wraps overflowing lines
                            whiteSpace: wrap ? "pre-wrap" : "pre",
                            overflowWrap: wrap ? "break-word" : "normal",

                            overflow: "visible",

                            transform: `
                                translateX(${currentLineStyle.offsetX}px)
                                scaleX(${currentLineStyle.scaleX})
                            `,

                            transformOrigin:
                                textAlign === "left"
                                    ? "left center"
                                    : textAlign === "right"
                                      ? "right center"
                                      : "center center",
                        }}
                    >
                        {line.length > 0 ? line : "\u00A0"}
                    </div>
                )
            })}
        </div>
    )
}

export default function Hoverlight(props: Props) {
    const {
        text = "YOU CAN\nDO IT",
        lineStyles = defaultLineStyles,

        font = {
            fontFamily: "Oswald",
            fontSize: "120px",
            fontWeight: 700,
        },

        textAlign = "center",
        wrap = true,
        lineHeight = 0.95,
        letterSpacing = -0.055,
        lineGap = -10,

        spotlightSize = 180,
        softness = 65,
        followSpeed = 0.18,
        fadeDuration = 200,

        restPosition = "hidden",
        restOpacity = 0.25,

        paddingTop = 24,
        paddingRight = 24,
        paddingBottom = 24,
        paddingLeft = 24,

        style,
    } = props

    // True on the Framer canvas and during static export —
    // all animation and interaction is disabled there
    const isStatic = useIsStaticRenderer()

    const containerRef = React.useRef<HTMLDivElement>(null)
    const highlightRef = React.useRef<HTMLDivElement>(null)

    const animationFrameRef = React.useRef<number | null>(null)
    const lastFrameTime = React.useRef<number | null>(null)

    const targetPosition = React.useRef({ x: 0, y: 0 })
    const currentPosition = React.useRef({ x: 0, y: 0 })

    const [isHovered, setIsHovered] = React.useState(false)

    // Writes the spotlight position as CSS variables —
    // no React re-render on pointer movement.
    const applyPosition = React.useCallback(() => {
        const element = highlightRef.current
        if (!element) return

        element.style.setProperty("--hl-x", `${currentPosition.current.x}px`)
        element.style.setProperty("--hl-y", `${currentPosition.current.y}px`)
    }, [])

    const positionSpotlightInCenter = React.useCallback(() => {
        const element = containerRef.current
        if (!element) return

        const rect = element.getBoundingClientRect()

        const center = {
            x: rect.width / 2,
            y: rect.height / 2,
        }

        targetPosition.current = { ...center }
        currentPosition.current = { ...center }
        applyPosition()
    }, [applyPosition])

    React.useLayoutEffect(() => {
        // Always position once so the mask has valid
        // coordinates — this is also the static fallback
        positionSpotlightInCenter()

        if (isStatic) return

        const element = containerRef.current

        if (!element || typeof ResizeObserver === "undefined") {
            return
        }

        const observer = new ResizeObserver(() => {
            if (!isHovered) {
                positionSpotlightInCenter()
            }
        })

        observer.observe(element)

        return () => {
            observer.disconnect()
        }
    }, [positionSpotlightInCenter, isHovered, isStatic])

    React.useEffect(() => {
        // No animation loop on canvas / during export
        if (isStatic) return

        const animate = (time: number) => {
            animationFrameRef.current = requestAnimationFrame(animate)

            // Delta-time normalization: identical follow
            // speed on 60Hz and 120Hz displays
            const delta =
                lastFrameTime.current !== null
                    ? time - lastFrameTime.current
                    : 16.67

            lastFrameTime.current = time

            const smoothing = clamp(followSpeed, 0.01, 1)
            const factor = 1 - Math.pow(1 - smoothing, delta / 16.67)

            const dx = targetPosition.current.x - currentPosition.current.x
            const dy = targetPosition.current.y - currentPosition.current.y

            // Converged — skip DOM writes entirely
            if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) {
                return
            }

            currentPosition.current.x += dx * factor
            currentPosition.current.y += dy * factor

            applyPosition()
        }

        animationFrameRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current)
            }
            lastFrameTime.current = null
        }
    }, [followSpeed, applyPosition, isStatic])

    const updatePointerPosition = (
        event: React.PointerEvent<HTMLDivElement>
    ) => {
        const element = containerRef.current
        if (!element) return

        const rect = element.getBoundingClientRect()

        targetPosition.current = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        }
    }

    const handlePointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
        updatePointerPosition(event)
        setIsHovered(true)
    }

    const handlePointerLeave = () => {
        setIsHovered(false)

        if (restPosition === "center") {
            positionSpotlightInCenter()
        }
    }

    const radius = Math.max(1, spotlightSize)
    const innerRadius = radius * (1 - clamp(softness, 0, 100) / 100)

    // Position lives in CSS variables, so the mask string
    // itself never changes between frames
    const mask = `radial-gradient(
        circle ${radius}px
        at var(--hl-x, 50%) var(--hl-y, 50%),
        rgba(0,0,0,1) 0px,
        rgba(0,0,0,1) ${innerRadius}px,
        rgba(0,0,0,0) ${radius}px
    )`

    // Static preview shows a partially revealed spotlight
    // at center so the effect reads on canvas and in exports
    const highlightOpacity = isStatic
        ? restPosition === "center"
            ? restOpacity
            : 0.35
        : isHovered
          ? 1
          : restPosition === "center"
            ? restOpacity
            : 0

    const safeLineStyles =
        lineStyles && lineStyles.length > 0 ? lineStyles : defaultLineStyles

    const contentLayout: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "center",

        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,

        boxSizing: "border-box",
        overflow: "visible",
    }

    return (
        <div
            ref={containerRef}
            onPointerEnter={isStatic ? undefined : handlePointerEnter}
            onPointerMove={isStatic ? undefined : updatePointerPosition}
            onPointerLeave={isStatic ? undefined : handlePointerLeave}
            style={{
                ...style,

                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,

                boxSizing: "border-box",

                cursor: "default",
                touchAction: "pan-y",

                overflow: "visible",
            }}
        >
            {/*
                Base layer stays in normal flow — it gives
                the component intrinsic height, so auto
                sizing works with @framerSupportedLayoutHeight any
            */}
            <div
                style={{
                    ...contentLayout,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    minHeight: "100%",
                }}
            >
                <TextLayer
                    text={text}
                    lineStyles={safeLineStyles}
                    font={font}
                    textAlign={textAlign}
                    wrap={wrap}
                    lineHeight={lineHeight}
                    letterSpacing={letterSpacing}
                    lineGap={lineGap}
                    highlighted={false}
                />
            </div>

            {/*
                Highlight overlay — mask sits HERE (inset: 0,
                same coordinate space as the container), so
                the spotlight matches the cursor exactly
            */}
            <div
                ref={highlightRef}
                style={{
                    ...contentLayout,

                    position: "absolute",
                    inset: 0,

                    pointerEvents: "none",

                    opacity: highlightOpacity,
                    transition: isStatic
                        ? "none"
                        : `opacity ${fadeDuration}ms ease`,

                    WebkitMaskImage: mask,
                    maskImage: mask,
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                }}
            >
                <TextLayer
                    text={text}
                    lineStyles={safeLineStyles}
                    font={font}
                    textAlign={textAlign}
                    wrap={wrap}
                    lineHeight={lineHeight}
                    letterSpacing={letterSpacing}
                    lineGap={lineGap}
                    highlighted
                />
            </div>
        </div>
    )
}

addPropertyControls(Hoverlight, {
    text: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        defaultValue: "YOU CAN\nDO IT",
    },

    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontFamily: "Oswald",
            fontSize: "120px",
            fontWeight: 700,
        },
    },

    textAlign: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
        defaultValue: "center",
    },

    wrap: {
        type: ControlType.Boolean,
        title: "Wrap",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: true,
    },

    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        min: 0.5,
        max: 2,
        step: 0.01,
        defaultValue: 0.95,
    },

    letterSpacing: {
        type: ControlType.Number,
        title: "Tracking",
        min: -0.2,
        max: 0.3,
        step: 0.005,
        defaultValue: -0.055,
    },

    lineGap: {
        type: ControlType.Number,
        title: "Line Gap",
        min: -200,
        max: 300,
        step: 1,
        unit: "px",
        defaultValue: -10,
    },

    lineStyles: {
        type: ControlType.Array,
        title: "Line Styles",
        maxCount: 20,
        defaultValue: defaultLineStyles,

        control: {
            type: ControlType.Object,

            controls: {
                fillStyle: {
                    type: ControlType.Enum,
                    title: "Style",
                    options: [
                        "solid",
                        "halftone",
                        "stripes",
                        "grid",
                        "checker",
                        "gradient",
                    ],
                    optionTitles: [
                        "Solid",
                        "Halftone",
                        "Stripes",
                        "Grid",
                        "Checker",
                        "Gradient",
                    ],
                    defaultValue: "halftone",
                },

                baseColor: {
                    type: ControlType.Color,
                    title: "Base",
                    defaultValue: "#353535",
                },

                highlightColor: {
                    type: ControlType.Color,
                    title: "Highlight",
                    defaultValue: "#FFFFFF",
                },

                secondaryColor: {
                    type: ControlType.Color,
                    title: "Second",
                    defaultValue: "#777777",
                    hidden: (properties) => properties.fillStyle !== "gradient",
                },

                patternSize: {
                    type: ControlType.Number,
                    title: "Pattern Size",
                    min: 0.25,
                    max: 40,
                    step: 0.25,
                    unit: "px",
                    defaultValue: 2,
                    hidden: (properties) =>
                        properties.fillStyle === "solid" ||
                        properties.fillStyle === "gradient",
                },

                patternGap: {
                    type: ControlType.Number,
                    title: "Pattern Gap",
                    min: 0,
                    max: 50,
                    step: 0.25,
                    unit: "px",
                    defaultValue: 2,
                    hidden: (properties) =>
                        properties.fillStyle === "solid" ||
                        properties.fillStyle === "gradient",
                },

                patternAngle: {
                    type: ControlType.Number,
                    title: "Angle",
                    min: -180,
                    max: 180,
                    step: 1,
                    unit: "°",
                    defaultValue: 45,
                    hidden: (properties) =>
                        properties.fillStyle !== "stripes" &&
                        properties.fillStyle !== "gradient",
                },

                patternOpacity: {
                    type: ControlType.Number,
                    title: "Opacity",
                    min: 0,
                    max: 1,
                    step: 0.05,
                    defaultValue: 0.7,
                },

                offsetX: {
                    type: ControlType.Number,
                    title: "Offset X",
                    min: -500,
                    max: 500,
                    step: 1,
                    unit: "px",
                    defaultValue: 0,
                },

                scaleX: {
                    type: ControlType.Number,
                    title: "Width Scale",
                    min: 0.2,
                    max: 2,
                    step: 0.01,
                    defaultValue: 1,
                },
            },
        },
    },

    spotlightSize: {
        type: ControlType.Number,
        title: "Light Size",
        min: 20,
        max: 1200,
        step: 5,
        unit: "px",
        defaultValue: 180,
    },

    softness: {
        type: ControlType.Number,
        title: "Softness",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: 65,
    },

    followSpeed: {
        type: ControlType.Number,
        title: "Follow",
        min: 0.01,
        max: 1,
        step: 0.01,
        defaultValue: 0.18,
    },

    fadeDuration: {
        type: ControlType.Number,
        title: "Fade",
        min: 0,
        max: 2000,
        step: 25,
        unit: "ms",
        defaultValue: 200,
    },

    restPosition: {
        type: ControlType.Enum,
        title: "At Rest",
        options: ["hidden", "center"],
        optionTitles: ["Hidden", "Centered"],
        displaySegmentedControl: true,
        defaultValue: "hidden",
    },

    restOpacity: {
        type: ControlType.Number,
        title: "Rest Light",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.25,
        hidden: (properties) => properties.restPosition !== "center",
    },

    paddingTop: {
        type: ControlType.Number,
        title: "Padding Top",
        min: 0,
        max: 500,
        step: 1,
        unit: "px",
        defaultValue: 24,
    },

    paddingRight: {
        type: ControlType.Number,
        title: "Padding Right",
        min: 0,
        max: 500,
        step: 1,
        unit: "px",
        defaultValue: 24,
    },

    paddingBottom: {
        type: ControlType.Number,
        title: "Padding Bottom",
        min: 0,
        max: 500,
        step: 1,
        unit: "px",
        defaultValue: 24,
    },

    paddingLeft: {
        type: ControlType.Number,
        title: "Padding Left",
        min: 0,
        max: 500,
        step: 1,
        unit: "px",
        defaultValue: 24,
    },
})
