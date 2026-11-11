// Dancing shadow text
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

interface DancingShadowTextProps {
    text: string
    textColor: string
    shadowColor1: string
    shadowColor2: string
    animationSpeed: number
    shadowIntensity: number
    font: CSSProperties
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function DancingShadowText(props: DancingShadowTextProps) {
    const {
        text,
        textColor,
        shadowColor1,
        shadowColor2,
        animationSpeed,
        shadowIntensity,
        font,
    } = props

    const duration = 5 / animationSpeed
    const isStatic = useIsStaticRenderer()

    const createGradientShadow = (x: number, y: number, blur: number) => {
        const shadows = []
        const steps = 3
        for (let i = 0; i < steps; i++) {
            const ratio = i / (steps - 1)
            const color = ratio < 0.5 ? shadowColor1 : shadowColor2
            const offset = (i + 1) * 0.3
            shadows.push(
                `${x * offset}px ${y * offset}px ${blur * (1 + i * 0.2)}px ${color}`
            )
        }
        return shadows.join(", ")
    }

    const staticShadow = createGradientShadow(
        2 * shadowIntensity,
        2 * shadowIntensity,
        4 * shadowIntensity
    )

    return (
        <div
            style={{
                position: "relative",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                padding: `${shadowIntensity * 10}px`,
                textAlign: "center",
                wordBreak: "break-word",
                overflowWrap: "anywhere",
            }}
        >
            <motion.div
                style={{
                    color: textColor,
                    width: "100%",
                    ...font,
                    ...(isStatic && { textShadow: staticShadow }),
                }}
                animate={
                    isStatic
                        ? {}
                        : {
                              textShadow: [
                                  createGradientShadow(
                                      2 * shadowIntensity,
                                      2 * shadowIntensity,
                                      4 * shadowIntensity
                                  ),
                                  createGradientShadow(
                                      -3 * shadowIntensity,
                                      4 * shadowIntensity,
                                      6 * shadowIntensity
                                  ),
                                  createGradientShadow(
                                      4 * shadowIntensity,
                                      -2 * shadowIntensity,
                                      5 * shadowIntensity
                                  ),
                                  createGradientShadow(
                                      -2 * shadowIntensity,
                                      -3 * shadowIntensity,
                                      7 * shadowIntensity
                                  ),
                                  createGradientShadow(
                                      3 * shadowIntensity,
                                      3 * shadowIntensity,
                                      4 * shadowIntensity
                                  ),
                                  createGradientShadow(
                                      2 * shadowIntensity,
                                      2 * shadowIntensity,
                                      4 * shadowIntensity
                                  ),
                              ],
                          }
                }
                transition={{
                    duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                {text}
            </motion.div>
        </div>
    )
}

addPropertyControls(DancingShadowText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Dancing Shadow",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#111111",
    },
    shadowColor1: {
        type: ControlType.Color,
        title: "Shadow Start",
        defaultValue: "#00A2FF",
    },
    shadowColor2: {
        type: ControlType.Color,
        title: "Shadow End",
        defaultValue: "#FF00CC",
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
    },
    shadowIntensity: {
        type: ControlType.Number,
        title: "Intensity",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1.1em",
        },
    },
})
