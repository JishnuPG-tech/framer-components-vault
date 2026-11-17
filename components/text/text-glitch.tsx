// glitch effect for text
import {
    useEffect,
    useState,
    useRef,
    startTransition,
    useMemo,
    type CSSProperties,
} from "react"
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

interface TextGlitchProps {
    text: string
    font: CSSProperties
    textColor: string
    glitchColor1: string
    glitchColor2: string
    intensity: number
    speed: number
    continuous: boolean
    glitchStyle: "classic" | "scanLines" | "rgbSplit" | "chaos"
    smoothness: number
    style?: CSSProperties
}

/**
 * Glitch Text Effect
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 100
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function TextGlitch(props: TextGlitchProps) {
    const {
        text = "GLITCH",
        font,
        textColor = "#FFFFFF",
        glitchColor1 = "#FF0000",
        glitchColor2 = "#00FFFF",
        intensity = 5,
        speed = 3,
        continuous = true,
        glitchStyle = "classic",
        smoothness = 5,
        style,
    } = props

    const [glitchState, setGlitchState] = useState({
        isGlitching: false,
        offset1: { x: 0, y: 0 },
        offset2: { x: 0, y: 0 },
        clipPath1: "",
        clipPath2: "",
        skew: 0,
        scale: 1,
        noiseOpacity: 0,
        blockGlitches: [] as Array<{
            top: number
            height: number
            offset: number
        }>,
    })

    const [scanLinePosition, setScanLinePosition] = useState(0)
    const intervalRef = useRef<number | null>(null)
    const scanLineRef = useRef<number | null>(null)
    const isStatic = useIsStaticRenderer()

    // Spring configuration
    const springConfig = useMemo(
        () => ({
            type: "spring" as const,
            stiffness: 200 - smoothness * 15,
            damping: 22 + smoothness * 2,
            mass: 0.8,
        }),
        [smoothness]
    )

    // Main glitch effect
    useEffect(() => {
        if (isStatic || RenderTarget.current() === RenderTarget.thumbnail)
            return

        const glitch = () => {
            const skewAmount = (Math.random() - 0.5) * intensity * 0.5
            const scaleAmount =
                1 + (Math.random() - 0.5) * 0.025 * (intensity / 5)
            const noiseAmount = Math.random() * 0.35

            const blocks = []
            const numBlocks = Math.floor(Math.random() * 3) + 2
            for (let i = 0; i < numBlocks; i++) {
                blocks.push({
                    top: Math.random() * 100,
                    height: Math.random() * 15 + 5,
                    offset: (Math.random() - 0.5) * intensity * 3,
                })
            }

            let offset1 = { x: 0, y: 0 }
            let offset2 = { x: 0, y: 0 }

            switch (glitchStyle) {
                case "classic":
                    offset1 = {
                        x: (Math.random() - 0.5) * intensity * 2.5,
                        y: (Math.random() - 0.5) * intensity * 0.5,
                    }
                    offset2 = {
                        x: (Math.random() - 0.5) * intensity * 2.5,
                        y: (Math.random() - 0.5) * intensity * 0.5,
                    }
                    break

                case "scanLines":
                    offset1 = {
                        x: (Math.random() - 0.5) * intensity * 0.8,
                        y: 0,
                    }
                    offset2 = {
                        x: (Math.random() - 0.5) * intensity * 0.8,
                        y: 0,
                    }
                    break

                case "rgbSplit":
                    offset1 = {
                        x: -intensity * 2,
                        y: (Math.random() - 0.5) * intensity * 0.4,
                    }
                    offset2 = {
                        x: intensity * 2,
                        y: (Math.random() - 0.5) * intensity * 0.4,
                    }
                    break

                case "chaos":
                    offset1 = {
                        x: (Math.random() - 0.5) * intensity * 4,
                        y: (Math.random() - 0.5) * intensity * 3,
                    }
                    offset2 = {
                        x: (Math.random() - 0.5) * intensity * 4,
                        y: (Math.random() - 0.5) * intensity * 3,
                    }
                    break
            }

            startTransition(() => {
                setGlitchState({
                    isGlitching: true,
                    offset1,
                    offset2,
                    clipPath1: "inset(0 0 0 0)",
                    clipPath2: "inset(0 0 0 0)",
                    skew: skewAmount,
                    scale: scaleAmount,
                    noiseOpacity: noiseAmount,
                    blockGlitches: blocks,
                })
            })

            const resetDuration = 100 + smoothness * 20
            setTimeout(() => {
                startTransition(() => {
                    setGlitchState({
                        isGlitching: false,
                        offset1: { x: 0, y: 0 },
                        offset2: { x: 0, y: 0 },
                        clipPath1: "",
                        clipPath2: "",
                        skew: 0,
                        scale: 1,
                        noiseOpacity: 0,
                        blockGlitches: [],
                    })
                })
            }, resetDuration)
        }

        if (continuous) {
            const interval = Math.max(200, 800 - speed * 60)
            intervalRef.current = window.setInterval(glitch, interval)
        }

        return () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current)
            }
        }
    }, [intensity, speed, continuous, glitchStyle, isStatic, smoothness])

    const handleMouseEnter = () => {
        if (!continuous && !isStatic) {
            const skewAmount = (Math.random() - 0.5) * intensity * 0.5
            const scaleAmount =
                1 + (Math.random() - 0.5) * 0.025 * (intensity / 5)
            const noiseAmount = Math.random() * 0.35

            const blocks = []
            const numBlocks = Math.floor(Math.random() * 3) + 2
            for (let i = 0; i < numBlocks; i++) {
                blocks.push({
                    top: Math.random() * 100,
                    height: Math.random() * 15 + 5,
                    offset: (Math.random() - 0.5) * intensity * 3,
                })
            }

            let offset1 = { x: 0, y: 0 }
            let offset2 = { x: 0, y: 0 }

            switch (glitchStyle) {
                case "classic":
                    offset1 = {
                        x: (Math.random() - 0.5) * intensity * 2.5,
                        y: (Math.random() - 0.5) * intensity * 0.5,
                    }
                    offset2 = {
                        x: (Math.random() - 0.5) * intensity * 2.5,
                        y: (Math.random() - 0.5) * intensity * 0.5,
                    }
                    break

                case "scanLines":
                    offset1 = {
                        x: (Math.random() - 0.5) * intensity * 0.8,
                        y: 0,
                    }
                    offset2 = {
                        x: (Math.random() - 0.5) * intensity * 0.8,
                        y: 0,
                    }
                    break

                case "rgbSplit":
                    offset1 = {
                        x: -intensity * 2,
                        y: (Math.random() - 0.5) * intensity * 0.4,
                    }
                    offset2 = {
                        x: intensity * 2,
                        y: (Math.random() - 0.5) * intensity * 0.4,
                    }
                    break

                case "chaos":
                    offset1 = {
                        x: (Math.random() - 0.5) * intensity * 4,
                        y: (Math.random() - 0.5) * intensity * 3,
                    }
                    offset2 = {
                        x: (Math.random() - 0.5) * intensity * 4,
                        y: (Math.random() - 0.5) * intensity * 3,
                    }
                    break
            }

            startTransition(() => {
                setGlitchState({
                    isGlitching: true,
                    offset1,
                    offset2,
                    clipPath1: "inset(0 0 0 0)",
                    clipPath2: "inset(0 0 0 0)",
                    skew: skewAmount,
                    scale: scaleAmount,
                    noiseOpacity: noiseAmount,
                    blockGlitches: blocks,
                })
            })

            setTimeout(() => {
                startTransition(() => {
                    setGlitchState({
                        isGlitching: false,
                        offset1: { x: 0, y: 0 },
                        offset2: { x: 0, y: 0 },
                        clipPath1: "",
                        clipPath2: "",
                        skew: 0,
                        scale: 1,
                        noiseOpacity: 0,
                        blockGlitches: [],
                    })
                })
            }, 250)
        }
    }

    const isFixedWidth = style && style.width === "100%"

    // Static render preview
    if (isStatic || RenderTarget.current() === RenderTarget.thumbnail) {
        const staticOffset1 = {
            x: intensity * 1.5,
            y: intensity * 0.3,
        }
        const staticOffset2 = {
            x: -intensity * 1.5,
            y: -intensity * 0.3,
        }

        const staticBlocks = [
            { top: 20, height: 8, offset: intensity * 2 },
            { top: 55, height: 12, offset: -intensity * 1.5 },
            { top: 80, height: 6, offset: intensity * 2.5 },
        ]

        return (
            <div
                style={{
                    position: "relative",
                    display: "inline-block",
                    ...(isFixedWidth
                        ? { width: "100%" }
                        : { width: "max-content" }),
                    height: "auto",
                    overflow: "visible",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        display: "inline-block",
                        ...font,
                        color: textColor,
                        userSelect: "none",
                        textTransform: "none",
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        ...(isFixedWidth
                            ? { width: "100%" }
                            : { width: "max-content" }),
                    }}
                >
                    {text}

                    {/* Static chromatic aberration layer 1 */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            color: glitchColor1,
                            mixBlendMode: "screen",
                            pointerEvents: "none",
                            filter: "blur(0.5px)",
                            transform: `translate(${staticOffset1.x}px, ${staticOffset1.y}px)`,
                            opacity: 0.8,
                        }}
                    >
                        {text}
                    </div>

                    {/* Static chromatic aberration layer 2 */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            color: glitchColor2,
                            mixBlendMode: "screen",
                            pointerEvents: "none",
                            filter: "blur(0.5px)",
                            transform: `translate(${staticOffset2.x}px, ${staticOffset2.y}px)`,
                            opacity: 0.8,
                        }}
                    >
                        {text}
                    </div>

                    {/* Static block glitches */}
                    {staticBlocks.map((block, index) => (
                        <div
                            key={index}
                            style={{
                                position: "absolute",
                                top: `${block.top}%`,
                                left: 0,
                                width: "100%",
                                height: `${block.height}%`,
                                overflow: "hidden",
                                pointerEvents: "none",
                                opacity: 0.9,
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    top: `-${block.top}%`,
                                    left: 0,
                                    width: "100%",
                                    color: textColor,
                                    transform: `translateX(${block.offset}px)`,
                                }}
                            >
                                {text}
                            </div>
                        </div>
                    ))}

                    {/* Static noise overlay */}
                </div>
            </div>
        )
    }

    return (
        <div
            style={{
                position: "relative",
                display: "inline-block",
                ...(isFixedWidth
                    ? { width: "100%" }
                    : { width: "max-content" }),
                height: "auto",
                overflow: "visible",
            }}
            onMouseEnter={handleMouseEnter}
        >
            <motion.div
                style={{
                    position: "relative",
                    display: "inline-block",
                    ...font,
                    color: textColor,
                    userSelect: "none",
                    textTransform: "none",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    ...(isFixedWidth
                        ? { width: "100%" }
                        : { width: "max-content" }),
                }}
                animate={{
                    skewX: glitchState.skew,
                    scale: glitchState.scale,
                }}
                transition={springConfig}
            >
                {text}

                {/* Chromatic aberration layer 1 (Red channel) */}
                <motion.div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        color: glitchColor1,
                        mixBlendMode: "screen",
                        clipPath: glitchState.clipPath1,
                        pointerEvents: "none",
                        filter: "blur(0.5px)",
                    }}
                    animate={{
                        x: glitchState.offset1.x,
                        y: glitchState.offset1.y,
                        opacity: glitchState.isGlitching ? 0.8 : 0,
                    }}
                    transition={springConfig}
                >
                    {text}
                </motion.div>

                {/* Chromatic aberration layer 2 (Cyan channel) */}
                <motion.div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        color: glitchColor2,
                        mixBlendMode: "screen",
                        clipPath: glitchState.clipPath2,
                        pointerEvents: "none",
                        filter: "blur(0.5px)",
                    }}
                    animate={{
                        x: glitchState.offset2.x,
                        y: glitchState.offset2.y,
                        opacity: glitchState.isGlitching ? 0.8 : 0,
                    }}
                    transition={springConfig}
                >
                    {text}
                </motion.div>

                {/* Block glitches - horizontal slices */}
                {glitchState.blockGlitches.map((block, index) => (
                    <motion.div
                        key={index}
                        style={{
                            position: "absolute",
                            top: `${block.top}%`,
                            left: 0,
                            width: "100%",
                            height: `${block.height}%`,
                            overflow: "hidden",
                            pointerEvents: "none",
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.9 }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 0.2,
                            ease: "easeOut",
                        }}
                    >
                        <motion.div
                            style={{
                                position: "absolute",
                                top: `-${block.top}%`,
                                left: 0,
                                width: "100%",
                                color: textColor,
                            }}
                            animate={{
                                x: block.offset,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 180 - smoothness * 12,
                                damping: 20 + smoothness * 1.5,
                                mass: 0.6,
                            }}
                        >
                            {text}
                        </motion.div>
                    </motion.div>
                ))}

                {/* Noise overlay */}
                <motion.div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                        backgroundSize: "100px 100px",
                        mixBlendMode: "overlay",
                    }}
                    animate={{
                        opacity: glitchState.noiseOpacity,
                    }}
                    transition={springConfig}
                />
            </motion.div>
        </div>
    )
}

addPropertyControls(TextGlitch, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "GLITCH",
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
            lineHeight: "1em",
        },
    },
    glitchStyle: {
        type: ControlType.Enum,
        title: "Style",
        options: ["classic", "rgbSplit", "chaos"],
        optionTitles: ["Classic", "RGB Split", "Chaos"],
        defaultValue: "classic",
        displaySegmentedControl: false,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    glitchColor1: {
        type: ControlType.Color,
        title: "Glitch Color 1",
        defaultValue: "#FF0000",
    },
    glitchColor2: {
        type: ControlType.Color,
        title: "Glitch Color 2",
        defaultValue: "#00FFFF",
    },
    intensity: {
        type: ControlType.Number,
        title: "Intensity",
        defaultValue: 5,
        min: 1,
        max: 50,
        step: 1,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 1,
        displayStepper: true,
    },
    smoothness: {
        type: ControlType.Number,
        title: "Smoothness",
        defaultValue: 5,
        min: 1,
        max: 10,
        step: 1,
        displayStepper: true,
    },
    continuous: {
        type: ControlType.Boolean,
        title: "Mode",
        defaultValue: true,
        enabledTitle: "Continuous",
        disabledTitle: "On Hover",
    },
})
