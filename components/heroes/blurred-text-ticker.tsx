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

import { motion } from "framer-motion"

// User request: add tablet/mobile responsive font-size controls while preserving existing behavior, styling, defaults, and visual effect.
interface MyComponentProps {
    texts: string[]
    speed: number
    blur: number
    dissolve: number
    gap: number
    color?: string
    activeColor?: string
    inactiveColor?: string
    fontSize: number
    tabletFontSize: number
    mobileFontSize: number
    fontFamily: string
    fontWeight: number
    typeface?: {
        fontFamily?: string
        fontWeight?: number
        fontStyle?: "normal" | "italic"
        letterSpacing?: string | number
        lineHeight?: string | number
    }
    alignment: "left" | "center" | "right"
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function BlurredTextTicker(props: MyComponentProps) {
    const {
        texts,
        speed,
        blur,
        dissolve,
        gap,
        color,
        activeColor,
        inactiveColor,
        fontSize,
        tabletFontSize,
        mobileFontSize,
        fontFamily,
        fontWeight,
        typeface,
        alignment,
    } = props
    const isStaticRenderer = useIsStaticRenderer()
    const items = React.useMemo(
        () => (texts || []).filter((item) => item && item.trim().length > 0),
        [texts]
    )
    const currentItems = items.length > 0 ? items : ["Text"]
    const itemCount = currentItems.length
    const repeatCount = 80
    const baseTrackOffset = React.useMemo(
        () => itemCount * Math.floor(repeatCount / 2),
        [itemCount]
    )
    const [index, setIndex] = React.useState(baseTrackOffset)
    const [instantSnap, setInstantSnap] = React.useState(false)
    const resolvedActiveColor = activeColor ?? color ?? "#000000"
    const resolvedInactiveColor = inactiveColor ?? color ?? "#000000"
    const resolvedFontFamily = typeface?.fontFamily ?? fontFamily
    const resolvedFontWeight = typeface?.fontWeight ?? fontWeight
    const resolvedFontStyle = typeface?.fontStyle ?? "normal"
    const resolvedLetterSpacing = typeface?.letterSpacing
    const resolvedLineHeight = typeface?.lineHeight ?? "1.2em"
    const [viewportWidth, setViewportWidth] = React.useState<number | null>(
        null
    )

    React.useEffect(() => {
        if (isStaticRenderer) return
        if (typeof window === "undefined") return

        const updateViewportWidth = () => {
            React.startTransition(() => {
                setViewportWidth(window.innerWidth)
            })
        }

        updateViewportWidth()
        window.addEventListener("resize", updateViewportWidth)
        return () => window.removeEventListener("resize", updateViewportWidth)
    }, [isStaticRenderer])

    const responsiveFontSize = React.useMemo(() => {
        if (viewportWidth === null) return fontSize
        if (viewportWidth <= 767) return mobileFontSize
        if (viewportWidth <= 1024) return tabletFontSize
        return fontSize
    }, [fontSize, mobileFontSize, tabletFontSize, viewportWidth])

    React.useEffect(() => {
        React.startTransition(() => {
            setIndex((prev) => {
                if (itemCount <= 0) return baseTrackOffset
                const normalized = ((prev % itemCount) + itemCount) % itemCount
                return baseTrackOffset + normalized
            })
        })
    }, [baseTrackOffset, itemCount])

    React.useEffect(() => {
        if (isStaticRenderer || itemCount <= 1) return
        if (typeof window === "undefined") return

        const delay = Math.max(200, speed)

        const id = window.setTimeout(() => {
            React.startTransition(() => {
                setInstantSnap(false)
                setIndex((v) => v + 1)
            })
        }, delay)

        return () => window.clearTimeout(id)
    }, [speed, isStaticRenderer, index, itemCount])

    React.useEffect(() => {
        if (itemCount <= 1) return
        const maxSafeIndex = itemCount * (repeatCount - 3)
        if (index < maxSafeIndex) return
        React.startTransition(() => {
            setInstantSnap(true)
            setIndex(baseTrackOffset + (index % itemCount))
        })
    }, [index, itemCount, baseTrackOffset])

    React.useEffect(() => {
        if (!instantSnap) return
        if (typeof window === "undefined") return
        const id = window.setTimeout(() => {
            React.startTransition(() => {
                setInstantSnap(false)
            })
        }, 0)
        return () => window.clearTimeout(id)
    }, [instantSnap])

    const rowHeight = React.useMemo(
        () => responsiveFontSize * 1.2,
        [responsiveFontSize]
    )
    const rowGap = React.useMemo(() => Math.max(0, gap), [gap])
    const stepHeight = React.useMemo(
        () => rowHeight + rowGap,
        [rowHeight, rowGap]
    )
    const activeIndex = React.useMemo(() => index, [index])
    const repeatedItems = React.useMemo(
        () => Array.from({ length: repeatCount }, () => currentItems).flat(),
        [currentItems]
    )
    const centerOffset = 0
    const activeTrackIndex = centerOffset + activeIndex
    const translateY = -(activeTrackIndex * stepHeight - stepHeight)
    const dissolveStrength = React.useMemo(
        () => Math.max(0, Math.min(1, dissolve)),
        [dissolve]
    )
    const justifyContent = React.useMemo(() => {
        if (alignment === "left") return "flex-start"
        if (alignment === "right") return "flex-end"
        return "center"
    }, [alignment])
    const textAlign = React.useMemo(() => {
        if (alignment === "left") return "left"
        if (alignment === "right") return "right"
        return "center"
    }, [alignment])

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent,
                alignItems: "center",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    width: "100%",
                    height: rowHeight * 3 + rowGap * 2,
                    overflow: "hidden",
                    position: "relative",
                    maskImage:
                        "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
                    WebkitMaskImage:
                        "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
                }}
            >
                <motion.div
                    animate={{
                        y: translateY,
                    }}
                    transition={{
                        duration: isStaticRenderer || instantSnap ? 0 : 0.9,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                >
                    {repeatedItems.map((text, i) => {
                        const relative = i - activeTrackIndex
                        const distance = Math.abs(relative)
                        const active = distance === 0
                        const adjacent =
                            itemCount > 2
                                ? distance === 1
                                : itemCount === 2
                                  ? relative === 1
                                  : false
                        const inactiveOpacity = 0.15 + dissolveStrength * 0.75
                        const grainOpacity = 0.18 + dissolveStrength * 0.5
                        const layerShift = (1 - dissolveStrength) * 3 + distance
                        return (
                            <div
                                key={`${text}-${i}`}
                                style={{
                                    height: rowHeight,
                                    marginBottom: rowGap,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent,
                                    whiteSpace: "nowrap",
                                    position: "relative",
                                    color: active
                                        ? resolvedActiveColor
                                        : resolvedInactiveColor,
                                    fontSize: responsiveFontSize,
                                    fontFamily: resolvedFontFamily,
                                    fontWeight: resolvedFontWeight,
                                    fontStyle: resolvedFontStyle,
                                    letterSpacing: resolvedLetterSpacing,
                                    lineHeight: resolvedLineHeight,
                                    textAlign,
                                    filter: active
                                        ? "blur(0px)"
                                        : adjacent
                                          ? `blur(${blur}px)`
                                          : `blur(${blur * 1.2}px)`,
                                    opacity: active
                                        ? 1
                                        : adjacent
                                          ? inactiveOpacity
                                          : 0,
                                    textShadow: active
                                        ? "none"
                                        : `0 0 ${2 + dissolveStrength * 5}px ${resolvedInactiveColor}`,
                                }}
                            >
                                <span
                                    style={{ position: "relative", zIndex: 1 }}
                                >
                                    {text}
                                </span>
                                {!active && adjacent ? (
                                    <>
                                        <motion.span
                                            aria-hidden="true"
                                            animate={
                                                isStaticRenderer
                                                    ? undefined
                                                    : {
                                                          x: [
                                                              -layerShift,
                                                              layerShift,
                                                              -layerShift,
                                                          ],
                                                      }
                                            }
                                            transition={{
                                                duration: 2.8,
                                                ease: "linear",
                                                repeat: isStaticRenderer
                                                    ? 0
                                                    : Infinity,
                                            }}
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent,
                                                textAlign,
                                                color: "transparent",
                                                WebkitTextStroke: `0.6px ${resolvedInactiveColor}`,
                                                opacity:
                                                    0.12 +
                                                    dissolveStrength * 0.22,
                                                pointerEvents: "none",
                                            }}
                                        >
                                            {text}
                                        </motion.span>
                                        <motion.span
                                            aria-hidden="true"
                                            animate={
                                                isStaticRenderer
                                                    ? undefined
                                                    : {
                                                          backgroundPosition: [
                                                              "0px 0px, 14px 22px, 0px 0px",
                                                              "18px 20px, 2px 4px, 22px 14px",
                                                              "0px 0px, 14px 22px, 0px 0px",
                                                          ],
                                                      }
                                            }
                                            transition={{
                                                duration: 1.8,
                                                ease: "linear",
                                                repeat: isStaticRenderer
                                                    ? 0
                                                    : Infinity,
                                            }}
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent,
                                                textAlign,
                                                color: "transparent",
                                                backgroundImage: `radial-gradient(circle, ${resolvedInactiveColor} 1.1px, transparent 1.4px),
                                                    radial-gradient(circle, ${resolvedInactiveColor} 0.9px, transparent 1.25px),
                                                    linear-gradient(to bottom, transparent, ${resolvedInactiveColor}, transparent)`,
                                                backgroundSize:
                                                    "10px 10px, 14px 14px, 100% 100%",
                                                WebkitBackgroundClip: "text",
                                                backgroundClip: "text",
                                                opacity: grainOpacity,
                                                pointerEvents: "none",
                                            }}
                                        >
                                            {text}
                                        </motion.span>
                                    </>
                                ) : null}
                            </div>
                        )
                    })}
                </motion.div>
            </div>
        </div>
    )
}

BlurredTextTicker.displayName = "Blurred-Text-Ticker"

addPropertyControls(BlurredTextTicker, {
    texts: {
        type: ControlType.Array,
        title: "Texts",
        control: {
            type: ControlType.String,
        },
        defaultValue: ["Build", "Ship", "Scale"],
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1600,
        min: 200,
        max: 6000,
        step: 100,
        unit: "ms",
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 2,
        min: 0,
        max: 12,
        step: 0.5,
    },
    dissolve: {
        type: ControlType.Number,
        title: "Dissolve",
        defaultValue: 0.4,
        min: 0,
        max: 1,
        step: 0.05,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 0,
        min: 0,
        max: 64,
        step: 1,
    },
    activeColor: {
        type: ControlType.Color,
        title: "Active Color",
        defaultValue: "#000000",
    },
    inactiveColor: {
        type: ControlType.Color,
        title: "Inactive Color",
        defaultValue: "#000000",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 44,
        min: 8,
        max: 180,
        step: 1,
    },
    tabletFontSize: {
        type: ControlType.Number,
        title: "Tablet Font Size",
        defaultValue: 36,
        min: 8,
        max: 180,
        step: 1,
    },
    mobileFontSize: {
        type: ControlType.Number,
        title: "Mobile Font Size",
        defaultValue: 28,
        min: 8,
        max: 180,
        step: 1,
    },
    typeface: {
        type: ControlType.Font,
        title: "Typeface",
        defaultValue: {
            fontSize: 44,
            variant: "Bold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font Family (Legacy)",
        defaultValue: "Inter",
        hidden: (props) => Boolean(props.typeface?.fontFamily),
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Weight",
        defaultValue: 700,
        min: 100,
        max: 900,
        step: 100,
        displayStepper: true,
        hidden: (props) => Boolean(props.typeface?.fontWeight),
    },
    alignment: {
        type: ControlType.Enum,
        title: "Alignment",
        defaultValue: "center",
        options: ["left", "center", "right"],
        optionTitles: ["Left aligned", "Center aligned", "Right aligned"],
    },
})
