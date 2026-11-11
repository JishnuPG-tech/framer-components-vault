// 3D Spinning Box Text Component - Displays rotating text on a 3D box with customizable labels and styling

import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import type { CSSProperties } from "react"

interface SpinningBoxTextProps {
    frontText: string
    bottomText: string
    backText: string
    topText: string
    prefixText: string
    backgroundColor: string
    borderColor: string
    textColor: string
    boxWidth: number
    boxHeight: number
    duration: number
    font: CSSProperties
    prefixFont: CSSProperties
    containerBackground: string
    style?: CSSProperties
}

/**
 * 3D Spinning Box Text
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function SpinningBoxText(props: SpinningBoxTextProps) {
    const {
        frontText,
        bottomText,
        backText,
        topText,
        prefixText,
        backgroundColor,
        borderColor,
        textColor,
        boxWidth,
        boxHeight,
        duration,
        font,
        prefixFont,
        containerBackground,
    } = props

    const boxDepth = boxHeight
    const isStatic = useIsStaticRenderer()

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: containerBackground,
                padding: "48px 16px",
                width: "100%",
                minWidth: "max-content",
            }}
        >
            <span
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                    color: textColor,
                    flexWrap: "wrap",
                    ...prefixFont,
                }}
            >
                {prefixText}
                <motion.span
                    style={{
                        position: "relative",
                        height: boxHeight,
                        width: boxWidth,
                        transformStyle: "preserve-3d",
                        transformOrigin: `center center -${boxDepth / 2}px`,
                        textTransform: "uppercase",
                        ...font,
                    }}
                    initial={{ rotateX: "0deg" }}
                    animate={{
                        rotateX: isStatic
                            ? "0deg"
                            : ["0deg", "90deg", "90deg", "180deg", "180deg", "270deg", "270deg", "360deg"],
                    }}
                    transition={{
                        repeat: isStatic ? 0 : Infinity,
                        duration: duration,
                        ease: "backInOut",
                        times: [0, 0.2, 0.25, 0.45, 0.5, 0.7, 0.75, 1],
                    }}
                >
                    {/* FRONT */}
                    <span
                        style={{
                            position: "absolute",
                            display: "flex",
                            height: "100%",
                            width: "100%",
                            alignItems: "center",
                            justifyContent: "center",
                            border: `2px solid ${borderColor}`,
                            backgroundColor: backgroundColor,
                            color: textColor,
                        }}
                    >
                        {frontText}
                    </span>

                    {/* BOTTOM */}
                    <span
                        style={{
                            transform: `translateY(${boxDepth}px) rotateX(-90deg)`,
                            position: "absolute",
                            display: "flex",
                            height: "100%",
                            width: "100%",
                            transformOrigin: "top",
                            alignItems: "center",
                            justifyContent: "center",
                            border: `2px solid ${borderColor}`,
                            backgroundColor: backgroundColor,
                            color: textColor,
                        }}
                    >
                        {bottomText}
                    </span>

                    {/* TOP */}
                    <span
                        style={{
                            transform: `translateY(-${boxDepth}px) rotateX(90deg)`,
                            position: "absolute",
                            display: "flex",
                            height: "100%",
                            width: "100%",
                            transformOrigin: "bottom",
                            alignItems: "center",
                            justifyContent: "center",
                            border: `2px solid ${borderColor}`,
                            backgroundColor: backgroundColor,
                            color: textColor,
                        }}
                    >
                        {topText}
                    </span>

                    {/* BACK */}
                    <span
                        style={{
                            transform: `translateZ(-${boxDepth}px) rotateZ(-180deg) rotateY(180deg)`,
                            position: "absolute",
                            display: "flex",
                            height: "100%",
                            width: "100%",
                            transformOrigin: "center",
                            alignItems: "center",
                            justifyContent: "center",
                            border: `2px solid ${borderColor}`,
                            backgroundColor: backgroundColor,
                            color: textColor,
                        }}
                    >
                        {backText}
                    </span>
                </motion.span>
            </span>
        </div>
    )
}

addPropertyControls(SpinningBoxText, {
    prefixText: {
        type: ControlType.String,
        title: "Prefix Text",
        defaultValue: "As simple as",
    },
    frontText: {
        type: ControlType.String,
        title: "Front Text",
        defaultValue: "Learn",
    },
    bottomText: {
        type: ControlType.String,
        title: "Bottom Text",
        defaultValue: "Earn",
    },
    backText: {
        type: ControlType.String,
        title: "Back Text",
        defaultValue: "Grow",
    },
    topText: {
        type: ControlType.String,
        title: "Top Text",
        defaultValue: "Repeat",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Box Background",
        defaultValue: "#4F46E5",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Box Border",
        defaultValue: "#818CF8",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    containerBackground: {
        type: ControlType.Color,
        title: "Container BG",
        defaultValue: "#0F172A",
    },
    boxWidth: {
        type: ControlType.Number,
        title: "Box Width",
        defaultValue: 288,
        min: 100,
        max: 500,
        step: 1,
        unit: "px",
    },
    boxHeight: {
        type: ControlType.Number,
        title: "Box Height",
        defaultValue: 80,
        min: 40,
        max: 200,
        step: 1,
        unit: "px",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 10,
        min: 2,
        max: 30,
        step: 0.5,
        unit: "s",
    },
    font: {
        type: ControlType.Font,
        title: "Box Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            variant: "Black",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
    },
    prefixFont: {
        type: ControlType.Font,
        title: "Prefix Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            variant: "Semibold",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
    },
})