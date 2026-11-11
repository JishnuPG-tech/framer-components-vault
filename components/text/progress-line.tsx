// User instructions: Create a fully customizable Progress Bar Component for Framer with 2 rows (label/percentage header + progress bar), independent typography controls for both texts, styling controls for bar (colors, height, radius, spacing), responsive 100% width, smooth width animation on percentage change, professional modern design, reusable, and all controls visible in Framer.

import type { CSSProperties } from "react"
import { useMemo, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView } from "framer-motion"

type TextTransform = "none" | "uppercase" | "lowercase" | "capitalize"

interface ProgressLineProps {
    labelText: string

    percentValue: number
    useValueForPercentText: boolean
    percentText: string

    labelFont: any
    percentFont: any

    labelColor: string
    percentColor: string

    labelTransform: TextTransform
    percentTransform: TextTransform

    trackColor: string
    fillColor: string

    barHeight: number
    radius: number
    topSpacing: number

    transition: any

    style?: CSSProperties
}

/**
 * Progress Bar
 *
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 70
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ProgressLine(props: ProgressLineProps) {
    const isStatic = useIsStaticRenderer()

    const {
        labelText,
        percentValue,
        useValueForPercentText,
        percentText,
        labelFont,
        percentFont,
        labelColor,
        percentColor,
        labelTransform,
        percentTransform,
        trackColor,
        fillColor,
        barHeight,
        radius,
        topSpacing,
        transition,
        style,
    } = props

    const clamped = useMemo(() => {
        const n = Number.isFinite(percentValue) ? percentValue : 0
        return Math.max(0, Math.min(100, n))
    }, [percentValue])

    const displayedPercentText = useMemo(() => {
        if (useValueForPercentText) return `${Math.round(clamped)}%`
        return percentText
    }, [useValueForPercentText, percentText, clamped])

    const mountRef = useRef<HTMLDivElement | null>(null)
    const inView = useInView(mountRef, { amount: 0.2, once: false })

    const isFixedWidth = !!(style && style.width === "100%")

    const trackRadius = useMemo(() => {
        const r = Math.max(0, radius)
        return r
    }, [radius])

    const headerTextBase: CSSProperties = useMemo(
        () => ({
            margin: 0,
            padding: 0,
            minWidth: 0,
        }),
        []
    )

    const fillTargetWidth = `${clamped}%`
    const shouldAnimate = !isStatic && inView

    const fillStyle: CSSProperties = useMemo(
        () => ({
            height: "100%",
            background: fillColor,
            borderRadius: trackRadius,
            willChange: "width",
        }),
        [fillColor, trackRadius]
    )

    return (
        <div
            ref={mountRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                ...(isFixedWidth ? null : { minWidth: 0 }),
            }}
        >
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 12,
                }}
            >
                <span
                    style={{
                        ...headerTextBase,
                        ...labelFont,
                        color: labelColor,
                        textTransform: labelTransform,
                        flex: "1 1 auto",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                    aria-label="Progress label"
                >
                    {labelText}
                </span>

                <span
                    style={{
                        ...headerTextBase,
                        ...percentFont,
                        color: percentColor,
                        textTransform: percentTransform,
                        flex: "0 0 auto",
                        textAlign: "right",
                    }}
                    aria-label="Progress percentage"
                >
                    {displayedPercentText}
                </span>
            </div>

            <div
                role="ProgressLine"
                aria-valuenow={clamped}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{
                    marginTop: topSpacing,
                    width: "100%",
                    height: Math.max(1, barHeight),
                    background: trackColor,
                    borderRadius: trackRadius,
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                {isStatic ? (
                    <div
                        style={{
                            ...fillStyle,
                            width: fillTargetWidth,
                        }}
                    />
                ) : (
                    <motion.div
                        style={fillStyle}
                        animate={
                            shouldAnimate
                                ? { width: fillTargetWidth }
                                : { width: fillTargetWidth }
                        }
                        initial={{ width: 0 }}
                        transition={transition}
                    />
                )}
            </div>
        </div>
    )
}

addPropertyControls(ProgressLine, {
    labelText: {
        type: ControlType.String,
        title: "Label Text",
        defaultValue: "PHP & MYSQL",
    },

    percentValue: {
        type: ControlType.Number,
        title: "Percentage Value",
        defaultValue: 85,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    useValueForPercentText: {
        type: ControlType.Boolean,
        title: "Percent Text",
        defaultValue: true,
        enabledTitle: "Auto",
        disabledTitle: "Custom",
    },
    percentText: {
        type: ControlType.String,
        title: "Custom Percent Text",
        defaultValue: "85%",
        hidden: (p) => p.useValueForPercentText,
    },

    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    percentFont: {
        type: ControlType.Font,
        title: "Percent Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },

    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "#000000",
    },
    percentColor: {
        type: ControlType.Color,
        title: "Percent Color",
        defaultValue: "#000000",
    },

    labelTransform: {
        type: ControlType.Enum,
        title: "Label Transform",
        defaultValue: "none",
        options: ["none", "uppercase", "lowercase", "capitalize"],
    },
    percentTransform: {
        type: ControlType.Enum,
        title: "Percent Transform",
        defaultValue: "none",
        options: ["none", "uppercase", "lowercase", "capitalize"],
    },

    fillColor: {
        type: ControlType.Color,
        title: "Progress Fill",
        defaultValue: "#000000",
    },
    trackColor: {
        type: ControlType.Color,
        title: "Progress Track",
        defaultValue: "#EEEEEE",
    },
    barHeight: {
        type: ControlType.Number,
        title: "Bar Height",
        defaultValue: 8,
        min: 1,
        max: 40,
        step: 1,
        unit: "px",
    },
    radius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 999,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    topSpacing: {
        type: ControlType.Number,
        title: "Top Spacing",
        defaultValue: 10,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },

    transition: {
        type: ControlType.Transition,
        title: "Animation",
    },
})
