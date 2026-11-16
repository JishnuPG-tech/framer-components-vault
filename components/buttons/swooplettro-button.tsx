// Built by OceanDevs / update
/**
 * @framerLockCode
 */

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


// ───────── CONSTANTS ───────── //
const GLOSSY_GRADIENT =
    "linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)"

const BG_EASING = "cubic-bezier(0.65,0,0.35,1)"
const LETTER_EASING = "cubic-bezier(0.22, 1, 0.36, 1)"
const BOUNCY_EASING = "cubic-bezier(0.68, -0.6, 0.32, 1.6)"
const MASK_GRADIENT =
    "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%)"

const DEFAULT_PADDING = "16px 24px"

// ───────── TYPES ───────── //
interface ColorState {
    bgColor: string
    textColor: string
    useGradient: boolean
    gradientAngle: number
    gradientColor1: string
    gradientColor2: string
}

interface FontType {
    fontFamily?: string
    fontSize?: number | string
    fontWeight?: number | string
    fontStyle?: string
    letterSpacing?: string
    textAlign?: "left" | "center" | "right"
    lineHeight?: number | string
    textTransform?: "none" | "uppercase" | "lowercase" | "capitalize"
}

interface SwoopLettroButtonProps {
    label: string
    font: FontType
    style: {
        padding: string | number
        borderRadius: string | number
        skew: number
        textTransform: "none" | "uppercase" | "lowercase" | "capitalize"
    }
    defaultState: ColorState
    hoverState: ColorState
    showBorder: boolean
    borderSettings: {
        borderWidth: number
        defaultBorderColor: string
        hoverBorderColor: string
    }
    effects: {
        glossyEffect: boolean
        sweepDirection: string
        direction: "top" | "bottom" | "alternate" | "none"
        stagger: number
        duration: number
        bouncy: boolean
        maskSpread: number
        syncColors: boolean
    }
    enableLink: boolean
    link: string
    openInNewTab: boolean
}

// ───────── HELPERS ───────── //

const resolvePadding = (value: string | number | undefined): string => {
    if (value === undefined || value === null) return DEFAULT_PADDING
    const str = String(value).trim()
    if (!str || /^(0px\s*)+$/.test(str) || str === "0") return DEFAULT_PADDING
    return str
}

const getSweepTransform = (direction: string): string => {
    const sweepMap: Record<string, string> = {
        left: "-100%,0,0",
        right: "100%,0,0",
        top: "0,-100%,0",
        bottom: "0,100%,0",
        "top-left": "-100%,-100%,0",
        "top-right": "100%,-100%,0",
        "bottom-left": "-100%,100%,0",
        "bottom-right": "100%,100%,0",
    }
    return sweepMap[direction] || "-100%,0,0"
}

const getSweepGradientDirection = (direction: string): string => {
    const map: Record<string, string> = {
        left: "to left",
        right: "to right",
        top: "to top",
        bottom: "to bottom",
        "top-left": "135deg",
        "top-right": "45deg",
        "bottom-left": "225deg",
        "bottom-right": "315deg",
    }
    return map[direction] || "to right"
}

const getBackground = (state: ColorState): string => {
    if (state.useGradient) {
        return `linear-gradient(${state.gradientAngle ?? 90}deg, ${state.gradientColor1}, ${state.gradientColor2})`
    }
    return state.bgColor
}

const applyTextTransform = (text: string, transform: string): string => {
    if (!text) return ""
    switch (transform) {
        case "uppercase":
            return text.toUpperCase()
        case "lowercase":
            return text.toLowerCase()
        case "capitalize":
            return text
                .toLowerCase()
                .replace(/(^|\s)\S/g, (c) => c.toUpperCase())
        default:
            return text
    }
}

// ───────── COMPONENT ───────── //
/**
 * @framerDisableUnlink
 * @framerDisableRename
 */
export default function SwoopLettroButton(props: SwoopLettroButtonProps) {
    const {
        label = "GET IN TOUCH",
        font,
        style: {
            padding,
            borderRadius = "10px",
            skew = -10,
            textTransform = "none",
        } = {} as any,
        defaultState,
        hoverState,
        showBorder = true,
        borderSettings: {
            borderWidth = 1,
            defaultBorderColor = "#FEEED2",
            hoverBorderColor = "#AFD4DE",
        } = {},
        effects: {
            glossyEffect = true,
            sweepDirection = "left",
            direction = "alternate",
            stagger = 30,
            duration = 700,
            bouncy = true,
            maskSpread = 15,
            syncColors = true,
        } = {},
        enableLink = false,
        link = "",
        openInNewTab = false,
    } = props

    const [hovered, setHovered] = React.useState(false)
    const resolvedPadding = resolvePadding(padding)

    // Font Logic
    const safeFont = React.useMemo(
        () => ({
            fontFamily: font?.fontFamily || "Inter",
            fontSize:
                typeof font?.fontSize === "number"
                    ? font.fontSize
                    : parseFloat(font?.fontSize?.toString() || "18"),
            fontWeight: font?.fontWeight || 600,
            letterSpacing: font?.letterSpacing || "0.4px",
            textAlign: (font?.textAlign || "center") as any,
        }),
        [font]
    )

    // FIX: Parse line height correctly from Framer's font control
    const safeLineHeight = React.useMemo(() => {
        if (font?.lineHeight === undefined || font?.lineHeight === null)
            return 1.2
        const parsed = parseFloat(font.lineHeight.toString())
        return isNaN(parsed) ? 1.2 : parsed
    }, [font?.lineHeight])

    const letterHeight = Number(safeFont.fontSize) * safeLineHeight

    // Text Processing
    const transformedLabel = applyTextTransform(
        label,
        font?.textTransform || textTransform
    )
    const chars = Array.from(transformedLabel).map((c) =>
        c === " " ? "\u00A0" : c
    )

    // Animation Timings (Synced with letters)
    const totalAnimDuration = Math.max(100, duration + chars.length * stagger)
    const activeEasing = bouncy ? BOUNCY_EASING : LETTER_EASING
    const transitionStyle = `${totalAnimDuration}ms ${BG_EASING} 0ms`

    // Mask Generation
    const activeMask = `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) ${maskSpread}%, rgba(0,0,0,1) ${100 - maskSpread}%, rgba(0,0,0,0) 100%)`

    // Background colors
    const defaultBg = getBackground(defaultState)
    const hoverWipeColor = hoverState.useGradient
        ? hoverState.gradientColor1
        : hoverState.bgColor

    const handleClick = () => {
        if (!enableLink || !link) return
        window.open(link, openInNewTab ? "_blank" : "_self")
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                transform: skew !== 0 ? `skewX(${skew}deg)` : undefined,
            }}
        >
            <div
                role="button"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onClick={handleClick}
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                    borderRadius,
                    cursor: "pointer",
                    background: defaultBg,
                    borderWidth: showBorder ? borderWidth : 0,
                    borderStyle: "solid",
                    borderColor: hovered
                        ? hoverBorderColor
                        : defaultBorderColor,
                    transition: `background-color ${transitionStyle}, border-color ${transitionStyle}`,
                    userSelect: "none",
                }}
            >
                {/* PRECISE SWEEP LAYER (THICK WIPE) */}
                {sweepDirection !== "none" && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 1,
                            background: `linear-gradient(${getSweepGradientDirection(sweepDirection)}, transparent 0%, ${hoverWipeColor} 100%)`,
                            transform: hovered
                                ? "translate3d(0,0,0)"
                                : `translate3d(${getSweepTransform(sweepDirection)})`,
                            opacity: hovered ? 1 : 0,
                            transition: `transform ${transitionStyle}, opacity ${transitionStyle}`,
                            pointerEvents: "none",
                        }}
                    />
                )}

                {/* Final Hover Solid Background Layer */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 0,
                        background: getBackground(hoverState),
                        opacity: hovered ? 1 : 0,
                        transition: `opacity ${duration}ms ${BG_EASING}`,
                    }}
                />

                {/* Glossy Bubble Overlay */}
                {glossyEffect && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: "50%",
                            background: GLOSSY_GRADIENT,
                            zIndex: 3,
                            pointerEvents: "none",
                            opacity: hovered ? 0.15 : 0.25,
                            transition: `opacity ${duration}ms`,
                        }}
                    />
                )}

                {/* Text Content Area */}
                <div
                    style={{
                        position: "relative",
                        zIndex: 5,
                        width: "100%",
                        height: "100%",
                        padding: resolvedPadding,
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                            safeFont.textAlign === "left"
                                ? "flex-start"
                                : safeFont.textAlign === "right"
                                  ? "flex-end"
                                  : "center",
                        transform:
                            skew !== 0 ? `skewX(${-skew}deg)` : undefined,
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            display: "flex",
                            height: `${letterHeight}px`,
                            maskImage: activeMask,
                            WebkitMaskImage: activeMask,
                            overflow: "hidden",
                        }}
                    >
                        {chars.map((ch, i) => {
                            const dir =
                                direction === "alternate"
                                    ? i % 2 === 0
                                        ? "top"
                                        : "bottom"
                                    : direction
                            const fromY = dir === "top" ? "-50%" : "0%"
                            const toY = dir === "top" ? "0%" : "-50%"
                            const delay = direction !== "none" ? i * stagger : 0

                            // SYNCED COLOR WIPING: Text color change follows background sweep
                            const colorTransition = syncColors
                                ? `color ${duration * 0.7}ms ${BG_EASING} ${delay}ms`
                                : `color ${duration * 0.5}ms ease ${hovered ? delay + 150 : delay}ms`

                            return (
                                <span
                                    key={i}
                                    style={{
                                        position: "relative",
                                        display: "inline-block",
                                        height: `${letterHeight}px`,
                                        ...safeFont,
                                        lineHeight: `${safeLineHeight}`,
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "grid",
                                            gridAutoRows: `${letterHeight}px`,
                                            alignItems: "center",
                                            transform:
                                                direction !== "none"
                                                    ? `translate3d(0, ${hovered ? toY : fromY}, 0)`
                                                    : "none",
                                            transition: `transform ${duration}ms ${activeEasing} ${delay}ms`,
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: hovered
                                                    ? hoverState.textColor
                                                    : defaultState.textColor,
                                                transition: colorTransition,
                                            }}
                                        >
                                            {ch}
                                        </span>
                                        <span
                                            style={{
                                                color: hovered
                                                    ? hoverState.textColor
                                                    : defaultState.textColor,
                                                transition: colorTransition,
                                            }}
                                        >
                                            {ch}
                                        </span>
                                    </span>
                                </span>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

SwoopLettroButton.displayName = "SwoopLettro Button"

// ───────── PROPERTY CONTROLS ───────── //

addPropertyControls(SwoopLettroButton, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "let's do this!",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: { fontSize: 20 },
        defaultFontType: "monospace",
    },

    style: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            textTransform: {
                type: ControlType.Enum,
                title: "Transform",
                options: ["none", "capitalize", "uppercase", "lowercase"],
                optionTitles: [
                    "Default",
                    "Capitalize",
                    "UPPERCASE",
                    "lowercase",
                ],
                defaultValue: "uppercase",
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "16px 24px",
            },
            borderRadius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "4px",
            },
            skew: {
                type: ControlType.Number,
                title: "Skew",
                defaultValue: -16,
                min: -45,
                max: 45,
                unit: "°",
            },
        },
    },
    showBorder: {
        type: ControlType.Boolean,
        title: "Outline",
        defaultValue: true,
    },
    borderSettings: {
        type: ControlType.Object,
        title: "Outline Style",
        hidden: (props) => !props.showBorder,
        controls: {
            borderWidth: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 1,
                unit: "px",
            },
            defaultBorderColor: {
                type: ControlType.Color,
                title: "Default",
                defaultValue: "#E6D8BC",
            },
            hoverBorderColor: {
                type: ControlType.Color,
                title: "Hover",
                defaultValue: "#FFAB9A",
            },
        },
    },
    defaultState: {
        type: ControlType.Object,
        title: "Default Colors",
        controls: {
            useGradient: {
                type: ControlType.Boolean,
                title: "Type",
                defaultValue: true,
                enabledTitle: "Gradient",
                disabledTitle: "Solid",
            },
            bgColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#8067F6",
                hidden: (p) => p.useGradient,
            },
            gradientAngle: {
                type: ControlType.Number,
                title: "Angle",
                defaultValue: 150,
                min: 0,
                max: 360,
                unit: "°",
                hidden: (p) => !p.useGradient,
            },
            gradientColor1: {
                type: ControlType.Color,
                title: "From",
                defaultValue: "#569A67",
                hidden: (p) => !p.useGradient,
            },
            gradientColor2: {
                type: ControlType.Color,
                title: "To",
                defaultValue: "#002B11",
                hidden: (p) => !p.useGradient,
            },
            textColor: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#E6D8BC",
            },
        },
    },

    hoverState: {
        type: ControlType.Object,
        title: "Hover Colors",
        controls: {
            useGradient: {
                type: ControlType.Boolean,
                title: "Type",
                defaultValue: true,
                enabledTitle: "Gradient",
                disabledTitle: "Solid",
            },
            bgColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#ff6041",
                hidden: (p) => p.useGradient,
            },
            gradientAngle: {
                type: ControlType.Number,
                title: "Angle",
                defaultValue: 150,
                min: 0,
                max: 360,
                unit: "°",
                hidden: (p) => !p.useGradient,
            },
            gradientColor1: {
                type: ControlType.Color,
                title: "From",
                defaultValue: "#F95524",
                hidden: (p) => !p.useGradient,
            },
            gradientColor2: {
                type: ControlType.Color,
                title: "To",
                defaultValue: "#ff6041",
                hidden: (p) => !p.useGradient,
            },
            textColor: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#120804",
            },
        },
    },

    effects: {
        type: ControlType.Object,
        title: "Animation",
        controls: {
            sweepDirection: {
                type: ControlType.Enum,
                title: "Color Dir",
                options: [
                    "none",
                    "left",
                    "right",
                    "top",
                    "bottom",
                    "top-left",
                    "top-right",
                    "bottom-left",
                    "bottom-right",
                ],
                defaultValue: "left",
            },
            direction: {
                type: ControlType.Enum,
                title: "Letter Dir",
                options: ["none", "top", "bottom", "alternate"],
                defaultValue: "alternate",
            },
            stagger: {
                type: ControlType.Number,
                title: "Stagger",
                defaultValue: 40,
                unit: "ms",
                hidden: (p) => p.direction === "none",
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 700,
                unit: "ms",
            },
            maskSpread: {
                type: ControlType.Number,
                title: "Mask Fade",
                defaultValue: 15,
                unit: "%",
            },
            glossyEffect: {
                type: ControlType.Boolean,
                title: "Glossy",
                defaultValue: true,
            },
            bouncy: {
                type: ControlType.Boolean,
                title: "Bouncy",
                defaultValue: true,
            },
            syncColors: {
                type: ControlType.Boolean,
                title: "Sync Wipe",
                defaultValue: true,
                description: "Syncs color with sweep.",
            },
        },
    },

    // ───────── LINK ───────── //

    enableLink: {
        type: ControlType.Boolean,
        title: "Link",
        defaultValue: false,
        enabledTitle: "Enable",
        disabledTitle: "Disable",
        description:
            "Elevating and served by ⋆ [OceanDevs](https://www.framer.com)",
    },
    link: {
        type: ControlType.Link,
        title: "Link To",
        defaultValue: "https://www.framer.com/@oceandevs",
        hidden: (p) => !p.enableLink,
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: true,
        hidden: (p) => !p.enableLink,
    },
})
