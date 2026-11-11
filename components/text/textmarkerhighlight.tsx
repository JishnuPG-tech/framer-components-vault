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

import { motion, useSpring, useTransform } from "framer-motion"

interface Props {
    before: string
    highlight: string
    font: React.CSSProperties
    markerColor: string
    baseColor: string
    highlightedTextColor: string
    speed: number
    delay: number
}

export default function TextMarkerHighlight(props: Props) {
    const {
        before,
        highlight,
        font,
        markerColor,
        baseColor,
        highlightedTextColor,
        speed,
        delay,
    } = props

    const markerScale = useSpring(0, {
        stiffness: 90 * speed,
        damping: 22,
        mass: 0.8,
        restDelta: 0.001,
    })

    const textColor = useTransform(
        markerScale,
        [0.82, 0.98],
        [baseColor, highlightedTextColor]
    )

    React.useEffect(() => {
        markerScale.set(0)

        const timeout = setTimeout(() => {
            markerScale.set(1)
        }, delay * 1000)

        return () => clearTimeout(timeout)
    }, [markerScale, delay, speed])

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "visible",
            }}
        >
            <span
                style={{
                    ...font,
                    color: baseColor,
                    fontFamily:
                        font.fontFamily ||
                        "Poppins, -apple-system, BlinkMacSystemFont, sans-serif",
                    letterSpacing: font.letterSpacing ?? "-0.03em",
                    whiteSpace: "pre-wrap",
                    overflow: "visible",
                }}
            >
                {before}

                <span
                    style={{
                        position: "relative",
                        display: "inline-block",
                        overflow: "visible",
                    }}
                >
                    <motion.span
                        aria-hidden
                        style={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            left: "-0.12em",
                            width: "calc(100% + 0.24em)",
                            background: markerColor,
                            borderRadius: "0.08em",
                            transformOrigin: "left center",
                            scaleX: markerScale,
                            zIndex: 0,
                            willChange: "transform",
                        }}
                    />

                    <motion.span
                        style={{
                            position: "relative",
                            zIndex: 1,
                            color: textColor,
                        }}
                    >
                        {highlight}
                    </motion.span>
                </span>
            </span>
        </div>
    )
}

addPropertyControls(TextMarkerHighlight, {
    before: {
        type: ControlType.String,
        defaultValue: "Made in ",
        title: "Before",
    },
    highlight: {
        type: ControlType.String,
        defaultValue: "Framer",
        title: "Highlight",
    },
    font: {
        type: ControlType.Font,
        controls: "extended",
        displayFontSize: true,
        displayTextAlignment: true,
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 72,
            letterSpacing: "-0.03em",
            lineHeight: "1.1",
        },
    },
    markerColor: {
        type: ControlType.Color,
        defaultValue: "#143AFA",
        title: "Marker",
    },
    baseColor: {
        type: ControlType.Color,
        defaultValue: "#000",
        title: "Base Text",
    },
    highlightedTextColor: {
        type: ControlType.Color,
        defaultValue: "#fff",
        title: "Highlight Text",
    },
    speed: {
        type: ControlType.Number,
        defaultValue: 1,
        min: 0.2,
        max: 3,
        step: 0.1,
        title: "Speed",
    },
    delay: {
        type: ControlType.Number,
        defaultValue: 0.25,
        min: 0,
        max: 5,
        step: 0.1,
        title: "Delay",
    },
})
