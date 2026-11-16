/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 300
 */

// ============================================================================
// Made with 💛 by Karim Saif
// Framer Code Component: Text Pressure
// ============================================================================

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Utility functions for mouse interaction distance calculations
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dx = b.x - a.x
    const dy = b.y - a.y
    return Math.sqrt(dx * dx + dy * dy)
}

const getAttr = (
    distance: number,
    maxDist: number,
    minVal: number,
    maxVal: number
) => {
    const val = maxVal - Math.abs((maxVal * distance) / maxDist)
    return Math.max(minVal, val + minVal)
}

const debounce = <T extends (...args: any[]) => void>(
    func: T,
    delay: number
) => {
    let timeoutId: ReturnType<typeof setTimeout>
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
            func(...args)
        }, delay)
    }
}

interface FontObject {
    fontFamily?: string
    fontWeight?: string | number
    style?: string
}

interface TextPressureProps {
    text: string
    font: FontObject | string
    width: boolean
    weight: boolean
    italic: boolean
    alpha: boolean
    flex: boolean
    stroke: boolean
    scale: boolean
    textColor: string
    strokeColor: string
    minFontSize: number
    ariaLabel: string
}

// Helper function to extract font family string from Framer's Font object or standard string
function getFontFamily(font: FontObject | string): string {
    if (typeof font === "object" && font?.fontFamily) {
        return font.fontFamily
    }
    if (typeof font === "string" && font.trim() !== "") {
        return font
    }
    return "Roboto Flex"
}

// ============================================================================
// 1. STATIC COMPONENT (Canvas / Thumbnail / SSR)
// Contains ZERO animation hooks, ZERO rAF, ZERO DOM mutation refs
// ============================================================================
function StaticTextPressure(props: TextPressureProps) {
    const {
        text = "COMPRESSA",
        font = { fontFamily: "Roboto Flex" },
        flex = true,
        stroke = false,
        textColor = "#FFFFFF",
        strokeColor = "#FF0000",
        minFontSize = 24,
        ariaLabel = "Text Pressure",
    } = props

    const resolvedFontFamily = useMemo(() => getFontFamily(font), [font])
    const chars = useMemo(() => Array.from(text), [text])

    return (
        <div
            aria-label={ariaLabel}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                background: "transparent",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <h1
                style={{
                    fontFamily: resolvedFontFamily,
                    textTransform: "uppercase",
                    fontSize: `${minFontSize}px`,
                    margin: 0,
                    textAlign: "center",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    fontWeight: 400,
                    color: textColor,
                    display: flex ? "flex" : "block",
                    justifyContent: flex ? "space-between" : "normal",
                    width: "100%",
                }}
            >
                {chars.map((char, i) => (
                    <span
                        key={i}
                        style={{
                            display: "inline-block",
                            color: stroke ? "transparent" : textColor,
                            WebkitTextStrokeWidth: stroke ? "3px" : undefined,
                            WebkitTextStrokeColor: stroke
                                ? strokeColor
                                : undefined,
                        }}
                    >
                        {char}
                    </span>
                ))}
            </h1>
        </div>
    )
}

// ============================================================================
// 2. INTERACTIVE COMPONENT (Published Canvas Runtime)
// ============================================================================
function InteractiveTextPressure(props: TextPressureProps) {
    const {
        text = "COMPRESSA",
        font = { fontFamily: "Roboto Flex" },
        width = true,
        weight = true,
        italic = true,
        alpha = false,
        flex = true,
        stroke = false,
        scale = false,
        textColor = "#FFFFFF",
        strokeColor = "#FF0000",
        minFontSize = 24,
        ariaLabel = "Text Pressure",
    } = props

    const resolvedFontFamily = useMemo(() => getFontFamily(font), [font])
    const chars = useMemo(() => Array.from(text), [text])

    const containerRef = useRef<HTMLDivElement>(null)
    const titleRef = useRef<HTMLHeadingElement>(null)
    const spansRef = useRef<(HTMLSpanElement | null)[]>([])

    // Cached positions to prevent layout thrashing
    const centersRef = useRef<{ x: number; y: number }[]>([])
    const titleMaxDistRef = useRef<number>(0)

    const mouseRef = useRef({ x: 0, y: 0 })
    const cursorRef = useRef({ x: 0, y: 0 })
    const isHoveredRef = useRef(false)
    const isAnimatingRef = useRef(false)
    const rafIdRef = useRef<number | null>(null)

    // Cached previous styles to prevent redundant DOM mutations
    const prevStylesRef = useRef<
        {
            fontVariation?: string
            transform?: string
            fontWeight?: string
            opacity?: string
        }[]
    >([])

    const [fontSize, setFontSize] = useState(minFontSize)
    const [scaleY, setScaleY] = useState(1)
    const [lineHeight, setLineHeight] = useState(1)

    const updateCenters = useCallback(() => {
        if (!titleRef.current) return

        const titleRect = titleRef.current.getBoundingClientRect()
        titleMaxDistRef.current = titleRect.width / 2

        centersRef.current = spansRef.current.map((span) => {
            if (!span) return { x: 0, y: 0 }
            const rect = span.getBoundingClientRect()
            return {
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
            }
        })
    }, [])

    const setSize = useCallback(() => {
        if (!containerRef.current || !titleRef.current) return

        const { width: containerW, height: containerH } =
            containerRef.current.getBoundingClientRect()

        let newFontSize = containerW / (chars.length / 2)
        newFontSize = Math.max(newFontSize, minFontSize)

        setFontSize(newFontSize)
        setScaleY(1)
        setLineHeight(1)

        requestAnimationFrame(() => {
            if (!titleRef.current) return
            const textRect = titleRef.current.getBoundingClientRect()

            if (scale && textRect.height > 0) {
                const yRatio = containerH / textRect.height
                setScaleY(yRatio)
                setLineHeight(yRatio)
            }
            updateCenters()
        })
    }, [chars.length, minFontSize, scale, updateCenters])

    useEffect(() => {
        const debouncedSetSize = debounce(setSize, 100)
        debouncedSetSize()
        window.addEventListener("resize", debouncedSetSize)
        return () => window.removeEventListener("resize", debouncedSetSize)
    }, [setSize])

    const animate = useCallback(() => {
        const dx = cursorRef.current.x - mouseRef.current.x
        const dy = cursorRef.current.y - mouseRef.current.y

        mouseRef.current.x += dx / 15
        mouseRef.current.y += dy / 15

        const distDelta = Math.sqrt(dx * dx + dy * dy)

        if (titleRef.current && centersRef.current.length > 0) {
            const maxDist = titleMaxDistRef.current || 100

            spansRef.current.forEach((span, i) => {
                if (!span) return

                const charCenter = centersRef.current[i] || { x: 0, y: 0 }
                const d = dist(mouseRef.current, charCenter)

                const wdth = width
                    ? Math.floor(getAttr(d, maxDist, 5, 200))
                    : 100
                const wght = weight
                    ? Math.floor(getAttr(d, maxDist, 100, 900))
                    : 400
                const italVal = italic
                    ? getAttr(d, maxDist, 0, 1).toFixed(2)
                    : "0"
                const alphaVal = alpha
                    ? getAttr(d, maxDist, 0, 1).toFixed(2)
                    : "1"

                const newFontVariation = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${italVal}`
                const scaleXFactor = width
                    ? getAttr(d, maxDist, 0.8, 1.4).toFixed(2)
                    : "1"
                const skewXFactor = italic
                    ? getAttr(d, maxDist, 0, -15).toFixed(2)
                    : "0"

                const newTransform = `scaleX(${scaleXFactor}) skewX(${skewXFactor}deg)`
                const newFontWeight = `${wght}`

                if (!prevStylesRef.current[i]) {
                    prevStylesRef.current[i] = {}
                }
                const prev = prevStylesRef.current[i]

                if (prev.fontVariation !== newFontVariation) {
                    span.style.fontVariationSettings = newFontVariation
                    prev.fontVariation = newFontVariation
                }
                if (prev.transform !== newTransform) {
                    span.style.transform = newTransform
                    prev.transform = newTransform
                }
                if (prev.fontWeight !== newFontWeight) {
                    span.style.fontWeight = newFontWeight
                    prev.fontWeight = newFontWeight
                }
                if (alpha && prev.opacity !== alphaVal) {
                    span.style.opacity = alphaVal
                    prev.opacity = alphaVal
                }
            })
        }

        if (distDelta < 0.01 && !isHoveredRef.current) {
            isAnimatingRef.current = false
            rafIdRef.current = null
            return
        }

        rafIdRef.current = requestAnimationFrame(animate)
    }, [width, weight, italic, alpha])

    const startAnimation = useCallback(() => {
        if (!isAnimatingRef.current) {
            isAnimatingRef.current = true
            rafIdRef.current = requestAnimationFrame(animate)
        }
    }, [animate])

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        isHoveredRef.current = true
        cursorRef.current.x = e.clientX
        cursorRef.current.y = e.clientY
        startAnimation()
    }

    const handlePointerLeave = () => {
        isHoveredRef.current = false
        cursorRef.current.x = -9999
        cursorRef.current.y = -9999
        startAnimation()
    }

    useEffect(() => {
        return () => {
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current)
            }
        }
    }, [])

    return (
        <div
            ref={containerRef}
            aria-label={ariaLabel}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                background: "transparent",
                overflow: "hidden",
            }}
        >
            <h1
                ref={titleRef}
                style={{
                    fontFamily: resolvedFontFamily,
                    textTransform: "uppercase",
                    fontSize: `${fontSize}px`,
                    lineHeight,
                    transform: `scale(1, ${scaleY})`,
                    transformOrigin: "center top",
                    margin: 0,
                    textAlign: "center",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    fontWeight: 100,
                    width: "100%",
                    color: textColor,
                    display: flex ? "flex" : "block",
                    justifyContent: flex ? "space-between" : "normal",
                }}
            >
                {chars.map((char, i) => (
                    <span
                        key={i}
                        ref={(node) => {
                            spansRef.current[i] = node
                        }}
                        data-char={char}
                        style={{
                            display: "inline-block",
                            color: stroke ? "transparent" : textColor,
                            WebkitTextStrokeWidth: stroke ? "3px" : undefined,
                            WebkitTextStrokeColor: stroke
                                ? strokeColor
                                : undefined,
                            willChange:
                                "transform, font-variation-settings, opacity",
                        }}
                    >
                        {char}
                    </span>
                ))}
            </h1>
        </div>
    )
}

// ============================================================================
// 3. MAIN EXPORT COMPONENT
// Switches purely between static rendering mode and interactive runtime
// ============================================================================
export default function TextPressure(props: TextPressureProps) {
    const isStatic = useIsStaticRenderer()

    if (isStatic) {
        return <StaticTextPressure {...props} />
    }

    return <InteractiveTextPressure {...props} />
}

// Organized Property Controls for Framer
addPropertyControls(TextPressure, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "HELLO!",
        description: "The interactive text string displayed on screen.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontFamily: "Roboto Flex",
        },
        description:
            "Select any font family from Framer. Automatically adjusts variables or transforms.",
    },
    minFontSize: {
        type: ControlType.Number,
        title: "Min Font Size",
        defaultValue: 24,
        min: 12,
        max: 120,
        unit: "px",
        description:
            "Sets minimum text size bound to avoid clipping on smaller viewports.",
    },
    width: {
        type: ControlType.Boolean,
        title: "Width Axis",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Varies character width ('wdth' or scaleX) dynamically on mouse hover.",
    },
    weight: {
        type: ControlType.Boolean,
        title: "Weight Axis",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Varies stroke weight ('wght') dynamically on mouse hover.",
    },
    italic: {
        type: ControlType.Boolean,
        title: "Italic Axis",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Varies slant/italic ('ital' or skew) dynamically on mouse hover.",
    },
    alpha: {
        type: ControlType.Boolean,
        title: "Alpha Effect",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Modulates opacity based on distance between cursor and character.",
    },
    flex: {
        type: ControlType.Boolean,
        title: "Flex Spacing",
        defaultValue: true,
        enabledTitle: "Space Out",
        disabledTitle: "Normal",
        description: "Distributes characters evenly across container width.",
    },
    scale: {
        type: ControlType.Boolean,
        title: "Scale Height",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Vertically stretches font to match container frame height.",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
        description: "Primary fill color for the variable font characters.",
    },
    stroke: {
        type: ControlType.Boolean,
        title: "Stroke Effect",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Applies outline stroke rendering around each letter.",
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Stroke Color",
        defaultValue: "#FF0000",
        hidden: (props) => !props.stroke,
        description: "Outline stroke color when stroke mode is enabled.",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "Text Pressure",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})

// ============================================================================
// End of file - Made with 💛 by Karim Saif
// ============================================================================
