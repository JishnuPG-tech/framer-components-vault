import { CSSProperties, useLayoutEffect, useRef, useState } from "react"
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

type Pattern = {
    id: string
    displayName: string
    backgroundImageCss?: string
    backgroundCss?: string
    addBackground?: string
    size: string
    opacity: number
    angle?: string
    position?: string
    blendMode?: string
    repeat?: string
    locked?: boolean
    lockedUrl?: string
}

const loadPassword = (str: string) => {
    try {
        const prefixes = ["FramerOverrides Pattern >", "Pattern >"]
        const matchedPrefix = prefixes.find((prefix) => str.includes(prefix))
        if (!matchedPrefix) {
            return null
        }
        const preprocessedStr = str.replace(matchedPrefix, "")
        const parsed = JSON.parse(preprocessedStr)

        return parsed as Pattern
    } catch (err) {
        return null
    }
}

const formatPatternString = (
    str: string,
    primary: string,
    secondary: string,
    tertiary: string,
    scale: number,
    angle: number
) => {
    const primaryNoHash = primary.replace("#", "")
    const secondaryNoHash = secondary.replace("#", "")
    const tertiaryNoHash = tertiary.replace("#", "")
    const nineDownScale = scale / 9
    const quarterScale = scale / 4
    const halfScale = scale / 2
    const twoScale = scale * 2
    const twoPointFourScale = scale * 2.4
    const twoPointEightScale = scale * 2.8
    const threeScale = scale * 3
    const threePointTwoScale = scale * 3.2
    const threePointFourScale = scale * 3.4
    const fourScale = scale * 4
    const fiveScale = scale * 5
    const fivePointSixScale = scale * 5.6
    const sixScale = scale * 6
    const sevenScale = scale * 7
    const eightScale = scale * 8
    const nineScale = scale * 9
    const tenScale = scale * 10
    const fourteenScale = scale * 14

    return str
        .replace(/\{primary\}/g, primary)
        .replace(/\{primaryNoHash\}/g, primaryNoHash)
        .replace(/\{secondary\}/g, secondary)
        .replace(/\{secondaryNoHash\}/g, secondaryNoHash)
        .replace(/\{tertiary\}/g, tertiary)
        .replace(/\{tertiaryNoHash\}/g, tertiaryNoHash)
        .replace(/\{nineDownScale\}/g, nineDownScale.toString())
        .replace(/\{quarterScale\}/g, quarterScale.toString())
        .replace(/\{halfScale\}/g, halfScale.toString())
        .replace(/\{scale\}/g, scale.toString())
        .replace(/\{twoScale\}/g, twoScale.toString())
        .replace(/\{twoPointFourScale\}/g, twoPointFourScale.toString())
        .replace(/\{twoPointEightScale\}/g, twoPointEightScale.toString())
        .replace(/\{threeScale\}/g, threeScale.toString())
        .replace(/\{threePointTwoScale\}/g, threePointTwoScale.toString())
        .replace(/\{threePointFourScale\}/g, threePointFourScale.toString())
        .replace(/\{fourScale\}/g, fourScale.toString())
        .replace(/\{fiveScale\}/g, fiveScale.toString())
        .replace(/\{fivePointSixScale\}/g, fivePointSixScale.toString())
        .replace(/\{sixScale\}/g, sixScale.toString())
        .replace(/\{sevenScale\}/g, sevenScale.toString())
        .replace(/\{eightScale\}/g, eightScale.toString())
        .replace(/\{nineScale\}/g, nineScale.toString())
        .replace(/\{tenScale\}/g, tenScale.toString())
        .replace(/\{fourteenScale\}/g, fourteenScale.toString())
        .replace(/\{angle\}/g, angle.toString())
}

const cleanColorString = (s: string) => {
    if (s.startsWith("var(--")) {
        console.log(s)
        // var(--token-580cb08b-d3fb-479e-bdd5-30cc5f9acae8, rgb(186, 143, 229)) /* {"name":"Dark Purple"} */
        // => rgb(186, 143, 229)
        const startIndex = s.indexOf("(", 4)
        const endIndex = s.indexOf(")")
        const colorString = "rgb(" + s.substring(startIndex + 1, endIndex) + ")"
        console.log("FINAL RESULT: " + colorString)
        console.log()
        console.log()
        return colorString
    }
    return s
}

/**
 * PATTERN
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 200
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function Pattern(props) {
    const {
        patternType,
        primary,
        secondary,
        tertiary,
        radius,
        scale,
        opacity,
        angle,
        shouldAnimate,
        direction,
        diagonal,
        duration,
        password,
    } = props
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer()

    /* Styles */
    const placeholderStyles: CSSProperties = {
        display: "flex",
        width: "100%",
        height: "100%",
        placeContent: "center",
        placeItems: "center",
        flexDirection: "column",
        color: "#96F",
        background: "rgba(136, 85, 255, 0.1)",
        fontSize: 14,
        overflow: "hidden",
        padding: "20px 20px 30px 20px",
    }

    const emojiStyles: CSSProperties = {
        fontSize: 32,
        marginBottom: 10,
    }

    const titleStyles: CSSProperties = {
        margin: 0,
        marginBottom: 10,
        fontWeight: 600,
        textAlign: "center",
    }

    const subtitleStyles: CSSProperties = {
        margin: 0,
        opacity: 0.7,
        lineHeight: 1.5,
        textAlign: "center",
    }

    let pattern
    let filter
    let backgroundPosAnimation

    const cleanPrimary = cleanColorString(primary)
    const cleanSecondary = cleanColorString(secondary)
    const cleanTertiary = cleanColorString(tertiary)

    const primaryColor = Color(cleanPrimary)
    const primaryOpacity = primaryColor.roundA
    const primaryOpacityHex = (
        "00" + parseInt((primaryOpacity * 255).toFixed(0)).toString(16)
    ).slice(-2)
    const primaryOpacityHexFinal =
        primaryOpacity === 1
            ? ""
            : primaryOpacityHex.length === 1
              ? primaryOpacityHex + primaryOpacityHex
              : primaryOpacityHex

    const secondaryColor = Color(cleanSecondary)
    const secondaryOpacity = secondaryColor.roundA
    const secondaryOpacityHex = (
        "00" + parseInt((secondaryOpacity * 255).toFixed(0)).toString(16)
    ).slice(-2)
    const secondaryOpacityHexFinal =
        secondaryOpacity === 1
            ? ""
            : secondaryOpacityHex.length === 1
              ? secondaryOpacityHex + secondaryOpacityHex
              : secondaryOpacityHex

    const tertiaryColor = Color(cleanTertiary)
    const tertiaryOpacity = tertiaryColor.roundA
    const tertiaryOpacityHex = (
        "00" + parseInt((tertiaryOpacity * 255).toFixed(0)).toString(16)
    ).slice(-2)
    const tertiaryOpacityHexFinal =
        tertiaryOpacity === 1
            ? ""
            : tertiaryOpacityHex.length === 1
              ? tertiaryOpacityHex + tertiaryOpacityHex
              : tertiaryOpacityHex

    const primaryHex = Color.toHexString(primaryColor) + primaryOpacityHexFinal
    const secondaryHex =
        Color.toHexString(secondaryColor) + secondaryOpacityHexFinal
    const tertiaryHex =
        Color.toHexString(tertiaryColor) + tertiaryOpacityHexFinal

    const frontWithoutHex = primaryHex.replace("#", "")
    const backWithoutHex = secondaryHex.replace("#", "")
    const tertiaryWithoutHex = tertiaryHex.replace("#", "")

    const factor = direction === "left" || direction === "top" ? -1 : 1

    const xScale =
        direction === "left" || direction === "right" ? factor * scale : 0
    const yScale =
        direction === "top" || direction === "bottom" ? factor * scale : 0

    const parsedPattern = loadPassword(password)

    if (parsedPattern === null) {
        return (
            <section style={placeholderStyles}>
                <div style={emojiStyles}>✨</div>
                <p style={titleStyles}>Please provide a pattern snippet</p>
                <a>https://framerpatterns.framer.website</a>
            </section>
        )
    }

    const id = parsedPattern.id
    const displayName = parsedPattern.displayName
    const patternBackground = parsedPattern.backgroundCss
        ? formatPatternString(
              parsedPattern.backgroundCss,
              primaryHex,
              secondaryHex,
              tertiaryHex,
              scale,
              angle
          )
        : undefined
    const patternBackgroundImage = parsedPattern.backgroundImageCss
        ? formatPatternString(
              parsedPattern.backgroundImageCss,
              primaryHex,
              secondaryHex,
              tertiaryHex,
              scale,
              angle
          )
        : undefined
    const addBackground = parsedPattern.addBackground
        ? formatPatternString(
              parsedPattern.addBackground,
              primaryHex,
              secondaryHex,
              tertiaryHex,
              scale,
              angle
          )
        : "transparent"
    const size = parsedPattern.size
        ? formatPatternString(
              parsedPattern.size,
              primaryHex,
              secondaryHex,
              tertiaryHex,
              scale,
              angle
          )
        : `${scale * 10}px ${scale * 2}px`
    const position = parsedPattern.position
        ? formatPatternString(
              parsedPattern.position,
              primaryHex,
              secondaryHex,
              tertiaryHex,
              scale,
              angle
          )
        : "0 0"
    const blendMode = parsedPattern.blendMode ?? "normal"
    const repeat = parsedPattern.repeat ?? "repeat"

    const backgroundConfig = patternBackground
        ? {
              //   backgroundSize: size,
              //   backgroundPosition: position,
          }
        : {
              backgroundColor: addBackground,
              backgroundImage: patternBackgroundImage,
              backgroundPosition: position,
              backgroundSize: size,
              backgroundRepeat: repeat,
              backgroundBlendMode: blendMode,
          }

    const content =
        patternBackground && patternBackground.includes("<svg") ? (
            <>
                {[0].map((_, i) => {
                    const a = patternBackground.indexOf("<svg")
                    const b = patternBackground.indexOf("</svg>") + 6
                    const svg = patternBackground.substring(a, b)

                    return (
                        <object
                            style={{
                                position: "absolute",
                                width:
                                    patternBackground &&
                                    patternBackground.includes(
                                        "patternTransform='"
                                    )
                                        ? "100%"
                                        : "calc(50vw + 50vh)",
                                height:
                                    patternBackground &&
                                    patternBackground.includes(
                                        "patternTransform='"
                                    )
                                        ? "100%"
                                        : "calc(50vw + 50vh)",
                                top:
                                    patternBackground &&
                                    patternBackground.includes(
                                        "patternTransform='"
                                    )
                                        ? "0"
                                        : "50%",
                                left:
                                    patternBackground &&
                                    patternBackground.includes(
                                        "patternTransform='"
                                    )
                                        ? "0"
                                        : "50%",

                                opacity: opacity / 100,
                                transform:
                                    patternBackground &&
                                    patternBackground.includes(
                                        "patternTransform='"
                                    )
                                        ? "none"
                                        : `translate(-50%, -50%) rotate(${angle}deg)`,
                            }}
                            type="image/svg+xml"
                            data={`data:image/svg+xml,
                                                        ${svg}
                                                    `}
                        >
                            SVG not supported
                        </object>
                    )
                })}
            </>
        ) : (
            <div
                style={{
                    position: "absolute",
                    width:
                        patternBackground &&
                        patternBackground.includes("patternTransform='")
                            ? "100%"
                            : "calc(100vw + 100vh)", // Maximum possible diagonal for screen
                    height:
                        patternBackground &&
                        patternBackground.includes("patternTransform='")
                            ? "100%"
                            : "calc(100vw + 100vh)", // Maximum possible diagonal for screen
                    top:
                        patternBackground &&
                        patternBackground.includes("patternTransform='")
                            ? 0
                            : "50%",
                    left:
                        patternBackground &&
                        patternBackground.includes("patternTransform='")
                            ? 0
                            : "50%",
                    borderRadius:
                        patternBackground &&
                        patternBackground.includes("patternTransform='")
                            ? 0
                            : "50%",

                    transformOrigin: "center",
                    transform:
                        patternBackground &&
                        patternBackground.includes("patternTransform='")
                            ? "none"
                            : `translate(-50%, -50%) rotate(${angle}deg)`,
                    background: patternBackground,
                    ...backgroundConfig,
                }}
            />
        )

    const containerStyles: CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: radius,
        filter: filter,
        opacity: opacity / 100,
        background: patternBackground,
        ...backgroundConfig,
    }

    if (isStatic) {
        return <div style={containerStyles}>{content}</div>
    }

    return (
        <motion.div
            style={containerStyles}
            animate={
                shouldAnimate && {
                    backgroundPosition: backgroundPosAnimation,
                }
            }
            transition={{
                type: "tween",
                ease: "linear",
                duration: duration,
                repeat: Infinity,
                repeatType: "loop",
            }}
        >
            {content}
        </motion.div>
    )
}

Pattern.displayName = "Pattern"

addPropertyControls(Pattern, {
    password: {
        type: ControlType.String,
        title: "Snippet",
        placeholder: "Enter Snippet",
    },
    primary: {
        type: ControlType.Color,
        title: "Primary",
        defaultValue: "#6D29FF",
        hidden(props) {
            return props.password.includes("{primary") === false
        },
    },
    secondary: {
        type: ControlType.Color,
        title: "Secondary",
        defaultValue: "#EBE5FF",
        hidden(props) {
            return props.password.includes("{secondary") === false
        },
    },
    tertiary: {
        type: ControlType.Color,
        title: "Tertiary",
        defaultValue: "#DF26CF",
        hidden(props) {
            return props.password.includes("{tertiary") === false
        },
    },
    scale: {
        type: ControlType.Number,
        min: 1,
        max: 100,
        step: 1,
        defaultValue: 8,
    },
    angle: {
        type: ControlType.Number,
        title: "Angle",
        min: 0,
        max: 360,
        step: 5,
        defaultValue: 0,
    },
    radius: {
        type: ControlType.Number,
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 0,
    },
    opacity: {
        type: ControlType.Number,
        min: 10,
        max: 100,
        step: 10,
        defaultValue: 100,
    },
})
