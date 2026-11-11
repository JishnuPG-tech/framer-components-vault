import * as React from "react"
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


const DEFAULT_TEXT =
    "Sticky note\n\nPick a color\nCustomize type\nHover to curl"

const COLOR_THEMES = {
    yellow: {
        paperTop: "#FFF1A3",
        paperMiddle: "#FFF6BF",
        paperBottom: "#FFF0A0",
        curlLight: "#FFF8C8",
        curlDark: "#F4D968",
    },
    pink: {
        paperTop: "#FFD6E7",
        paperMiddle: "#FFE5F0",
        paperBottom: "#FFC6DD",
        curlLight: "#FFEAF3",
        curlDark: "#F3A2C3",
    },
    blue: {
        paperTop: "#BFE3FF",
        paperMiddle: "#D8F0FF",
        paperBottom: "#AAD9FA",
        curlLight: "#E7F6FF",
        curlDark: "#79BDEB",
    },
    green: {
        paperTop: "#CFF6B8",
        paperMiddle: "#E1FBCF",
        paperBottom: "#B9EFA1",
        curlLight: "#ECFFE1",
        curlDark: "#8ED26F",
    },
    orange: {
        paperTop: "#FFD39B",
        paperMiddle: "#FFE2BA",
        paperBottom: "#FFC478",
        curlLight: "#FFEBD1",
        curlDark: "#E8A34F",
    },
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 280
 * @framerIntrinsicHeight 300
 */
export default function StickyNote({
    text = DEFAULT_TEXT,
    theme = "yellow",
    padding = 36,
    font,
    textColor = "#050505",
    textAlign = "left",
    verticalAlign = "flex-start",
    style,
}) {
    const isStatic = useIsStaticRenderer()
    const paperId = React.useId()
    const curlId = React.useId()
    const colors = COLOR_THEMES[theme] || COLOR_THEMES.yellow

    const paperRestPath = "M20 18 L380 18 L380 498 C260 506 140 510 20 502 Z"
    const paperHoverPath = "M20 18 L380 18 L380 462 C342 482 270 498 20 502 Z"
    const curlRestPath =
        "M317 496 C335 466 362 438.5 380 434.5 L380 492 C357 494.5 338.5 495 317 496 Z"
    const curlHoverPath =
        "M304 482 C328 424 360 400.5 380 394.5 L380 459 C356 470.5 329.5 477 304 482 Z"

    return (
        <motion.div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "visible",
                perspective: 900,
                ...style,
            }}
            initial={isStatic ? false : "rest"}
            animate={isStatic ? false : "rest"}
            whileHover={isStatic ? undefined : "hover"}
        >
            <motion.div
                variants={
                    isStatic
                        ? undefined
                        : {
                              rest: { rotate: -1.5, y: 0 },
                              hover: { rotate: 1, y: -8 },
                          }
                }
                transition={
                    isStatic
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 180, damping: 18 }
                }
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    transformStyle: "preserve-3d",
                    willChange: isStatic ? "auto" : "transform",
                }}
            >
                {isStatic ? (
                    <div
                        style={{
                            position: "absolute",
                            right: "8%",
                            bottom: "-4%",
                            width: "58%",
                            height: "11%",
                            borderRadius: "50%",
                            background: "rgba(0,0,0,0.22)",
                            filter: "blur(10px)",
                            zIndex: 0,
                            pointerEvents: "none",
                        }}
                    />
                ) : (
                    <motion.div
                        variants={{
                            rest: {
                                opacity: 0.22,
                                x: 8,
                                y: 0,
                                scaleX: 0.82,
                                scaleY: 0.55,
                            },
                            hover: {
                                opacity: 0.34,
                                x: 18,
                                y: 0,
                                scaleX: 1,
                                scaleY: 0.68,
                            },
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 180,
                            damping: 18,
                        }}
                        style={{
                            position: "absolute",
                            right: "8%",
                            bottom: "-4%",
                            width: "58%",
                            height: "11%",
                            borderRadius: "50%",
                            background: "rgba(0,0,0,0.32)",
                            filter: "blur(14px)",
                            zIndex: 0,
                            pointerEvents: "none",
                            willChange: "transform, opacity",
                        }}
                    />
                )}

                <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 400 520"
                    preserveAspectRatio="none"
                    style={{
                        position: "absolute",
                        inset: 0,
                        overflow: "visible",
                        zIndex: 1,
                        filter: `
                            drop-shadow(0px 6px 6px rgba(0,0,0,0.08))
                            drop-shadow(0px 14px 14px rgba(0,0,0,0.08))
                        `,
                    }}
                >
                    <defs>
                        <linearGradient
                            id={paperId}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop offset="0%" stopColor={colors.paperTop} />
                            <stop offset="18%" stopColor={colors.paperMiddle} />
                            <stop
                                offset="100%"
                                stopColor={colors.paperBottom}
                            />
                        </linearGradient>

                        <linearGradient id={curlId} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={colors.curlLight} />
                            <stop offset="100%" stopColor={colors.curlDark} />
                        </linearGradient>
                    </defs>

                    {isStatic ? (
                        <>
                            <path d={paperRestPath} fill={`url(#${paperId})`} />
                            <path
                                d={curlRestPath}
                                opacity={0.3}
                                fill={`url(#${curlId})`}
                            />
                        </>
                    ) : (
                        <>
                            <motion.path
                                variants={{
                                    rest: { d: paperRestPath },
                                    hover: { d: paperHoverPath },
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 120,
                                    damping: 20,
                                }}
                                fill={`url(#${paperId})`}
                            />

                            <motion.path
                                variants={{
                                    rest: {
                                        d: curlRestPath,
                                        opacity: 0.3,
                                    },
                                    hover: {
                                        d: curlHoverPath,
                                        opacity: 0.55,
                                    },
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 120,
                                    damping: 20,
                                }}
                                fill={`url(#${curlId})`}
                            />
                        </>
                    )}
                </svg>

                <div
                    style={{
                        position: "relative",
                        zIndex: 2,
                        padding,
                        color: textColor,
                        textAlign,
                        width: "100%",
                        height: "100%",
                        boxSizing: "border-box",
                        pointerEvents: "none",
                        whiteSpace: "pre-wrap",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: verticalAlign,
                        fontFamily: "Inter, sans-serif",
                        fontWeight: 400,
                        ...font,
                    }}
                >
                    {text}
                </div>
            </motion.div>
        </motion.div>
    )
}

addPropertyControls(StickyNote, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: DEFAULT_TEXT,
        displayTextArea: true,
    },
    theme: {
        type: ControlType.Enum,
        title: "Color",
        defaultValue: "yellow",
        options: ["yellow", "pink", "blue", "green", "orange"],
        optionTitles: ["Yellow", "Pink", "Blue", "Green", "Orange"],
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 14,
            lineHeight: 1.35,
            letterSpacing: 0,
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#050505",
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Align",
        defaultValue: "left",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
    },
    verticalAlign: {
        type: ControlType.Enum,
        title: "Vertical",
        defaultValue: "flex-start",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Start", "Middle", "End"],
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 36,
        min: 0,
        max: 120,
        step: 1,
    },
})
