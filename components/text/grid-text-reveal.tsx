import * as React from "react"
import { motion, useInView } from "framer-motion"
// @ts-ignore - this hook is available in Framer's environment but missing in local types
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

interface GridTextRevealProps extends React.HTMLAttributes<HTMLDivElement> {
    text: string
    font: any
    textColor: string
    cellFillType: "solid" | "gradient"
    cellBackgroundColor: string
    gradientStart: string
    gradientEnd: string
    gradientAngle: number
    borderRadius: number
    borderWidth: number
    borderColor: string
    borderStyle: "solid" | "dashed" | "dotted"
    rows: number
    cols: number
    distanceX: number
    distanceY: number
    rotation: number
    delay: number
    duration: number
    staggerDelay: number
    isSequential: boolean
    keepCellsVisible: boolean
    disableAnimation: boolean
    canvasDisplay: "scattered" | "assembled" | "text"
    style?: CSSProperties
}

/**
 * Grid Text Reveal
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 60
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function GridTextReveal(props: GridTextRevealProps) {
    const {
        text = "Shuffling Text Reveal",
        font = {},
        textColor = "#000000",
        cellFillType = "solid",
        cellBackgroundColor = "transparent",
        gradientStart = "#FF5555",
        gradientEnd = "#FF9933",
        gradientAngle = 180,
        borderRadius = 0,
        borderWidth = 0,
        borderColor = "#000000",
        borderStyle = "solid",
        rows = 4,
        cols = 6,
        distanceX = 100,
        distanceY = 150,
        rotation = 45,
        delay = 0.2,
        duration = 0.6,
        staggerDelay = 0.05,
        isSequential = true,
        keepCellsVisible = false,
        disableAnimation = false,
        canvasDisplay = "assembled",
        style,
        ...rest
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isInView = useInView(containerRef, { once: true, amount: 0.2 })

    // Determine the effective state
    let effectiveState = "animate"
    if (isCanvas) {
        effectiveState = canvasDisplay
    } else if (isStatic || disableAnimation) {
        effectiveState = keepCellsVisible ? "assembled" : "text"
    }

    const hasEnteredView = isInView

    const totalPieces = rows * cols
    const [isDone, setIsDone] = React.useState(false)
    const [isFadingOut, setIsFadingOut] = React.useState(false)

    React.useEffect(() => {
        if (effectiveState !== "animate") {
            setIsDone(effectiveState === "text")
            setIsFadingOut(false)
            return
        }

        if (keepCellsVisible) {
            setIsDone(false)
            setIsFadingOut(false)
            return
        }

        if (hasEnteredView) {
            const maxStagger = isSequential
                ? (totalPieces - 1) * staggerDelay
                : 0
            const totalTimeMs = (delay + duration + maxStagger) * 1000

            const fadeTimer = window.setTimeout(() => {
                React.startTransition(() => {
                    setIsFadingOut(true)
                })
            }, totalTimeMs)

            const doneTimer = window.setTimeout(() => {
                React.startTransition(() => {
                    setIsDone(true)
                })
            }, totalTimeMs + 500) // 500ms smooth fade

            return () => {
                window.clearTimeout(fadeTimer)
                window.clearTimeout(doneTimer)
            }
        }
    }, [
        hasEnteredView,
        effectiveState,
        totalPieces,
        isSequential,
        staggerDelay,
        delay,
        duration,
        keepCellsVisible,
    ])

    const initialPositions = React.useMemo(() => {
        const positions = []
        for (let i = 0; i < totalPieces; i++) {
            const x = (Math.random() - 0.5) * 2 * distanceX
            const minOffsetY = distanceY * 0.2
            const y = minOffsetY + Math.random() * (distanceY - minOffsetY)
            const rot = (Math.random() - 0.5) * 2 * rotation
            positions.push({ x, y, rotateZ: rot })
        }
        return positions
    }, [totalPieces, distanceX, distanceY, rotation])

    const shuffledIndices = React.useMemo(() => {
        const indices = Array.from({ length: totalPieces }).map((_, i) => i)
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[indices[i], indices[j]] = [indices[j], indices[i]]
        }
        return indices
    }, [totalPieces])

    const textStyle: React.CSSProperties = {
        ...font,
        color: textColor,
        width: "100%",
        margin: 0,
        padding: 0,
        textAlign: font.textAlign || "center",
    }

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "visible",
            }}
            {...rest}
        >
            <div
                style={{
                    ...textStyle,
                    opacity: isDone || effectiveState === "text" ? 1 : 0,
                }}
            >
                {text}
            </div>

            {!isDone && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        zIndex: 2,
                    }}
                >
                    {Array.from({ length: totalPieces }).map((_, i) => {
                        const r = Math.floor(i / cols)
                        const c = i % cols

                        const orderIndex = shuffledIndices.indexOf(i)
                        const customDelay =
                            delay +
                            (isSequential ? orderIndex * staggerDelay : 0)

                        const initPos = initialPositions[i]
                        const isVisibleState = {
                            opacity: 1,
                            x: 0,
                            y: 0,
                            rotateZ: 0,
                        }
                        // For scattered state, we want them visible on canvas so opacity is 1 if frozen
                        const isScatteredState = {
                            opacity: effectiveState === "scattered" ? 1 : 0,
                            x: initPos.x,
                            y: initPos.y,
                            rotateZ: initPos.rotateZ,
                        }

                        let finalInitialState = isScatteredState
                        let finalAnimateState = hasEnteredView
                            ? isVisibleState
                            : isScatteredState
                        let finalTransitionDuration = duration

                        // If we are showing a frozen state on the canvas, force it statically
                        if (effectiveState === "scattered") {
                            finalInitialState = isScatteredState
                            finalAnimateState = isScatteredState
                            finalTransitionDuration = 0
                        } else if (
                            effectiveState === "assembled" ||
                            effectiveState === "text"
                        ) {
                            finalInitialState = isVisibleState
                            finalAnimateState = isVisibleState
                            finalTransitionDuration = 0
                        }

                        const bgStyle =
                            cellFillType === "gradient"
                                ? `linear-gradient(${gradientAngle}deg, ${gradientStart}, ${gradientEnd})`
                                : cellBackgroundColor

                        return (
                            <motion.div
                                key={i}
                                initial={finalInitialState}
                                animate={finalAnimateState}
                                transition={{
                                    type: "spring",
                                    bounce: 0.2,
                                    duration: finalTransitionDuration,
                                    delay:
                                        effectiveState === "animate"
                                            ? customDelay
                                            : 0,
                                }}
                                style={{
                                    position: "absolute",
                                    width: `${100 / cols}%`,
                                    height: `${100 / rows}%`,
                                    top: `${r * (100 / rows)}%`,
                                    left: `${c * (100 / cols)}%`,
                                    overflow: "hidden",
                                    borderRadius: `${borderRadius}px`,
                                    // Border and background are moved to an inner overlay to prevent layout corruption
                                }}
                            >
                                {/* Cell Background and Border Overlay */}
                                <motion.div
                                    initial={false}
                                    animate={{ opacity: isFadingOut ? 0 : 1 }}
                                    transition={{
                                        duration:
                                            effectiveState === "animate"
                                                ? 0.5
                                                : 0,
                                    }}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: bgStyle,
                                        borderRadius: `${borderRadius}px`,
                                        borderWidth: `${borderWidth}px`,
                                        borderColor: borderColor,
                                        borderStyle: borderStyle,
                                        boxSizing: "border-box",
                                        pointerEvents: "none",
                                        zIndex: 0,
                                    }}
                                />

                                {/* Inner wrapper sized exactly like the main container to match flex behavior perfectly */}
                                <div
                                    style={{
                                        position: "absolute",
                                        width: `${cols * 100}%`,
                                        height: `${rows * 100}%`,
                                        top: `${-r * 100}%`,
                                        left: `${-c * 100}%`,
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        zIndex: 1,
                                    }}
                                >
                                    <div style={textStyle}>{text}</div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

addPropertyControls(GridTextReveal, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Shuffling Text Reveal",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 40,
            // @ts-ignore - variant is correct per latest Framer best practices
            variant: "Bold",
            lineHeight: "1.2em",
            letterSpacing: "-0.02em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#111111",
    },
    keepCellsVisible: {
        type: ControlType.Boolean,
        title: "Keep Cells",
        defaultValue: false,
        description:
            "Keep the cells visible after animation ends. Enable this if you are using background colors or borders so they don't disappear.",
    },
    cellFillType: {
        type: ControlType.Enum,
        title: "Cell Fill",
        options: ["solid", "gradient"],
        optionTitles: ["Solid Color", "Gradient"],
        defaultValue: "solid",
    },
    cellBackgroundColor: {
        type: ControlType.Color,
        title: "Solid Color",
        defaultValue: "transparent",
        hidden(props) {
            return props.cellFillType !== "solid"
        },
    },
    gradientStart: {
        type: ControlType.Color,
        title: "Start Color",
        defaultValue: "#FF5555",
        hidden(props) {
            return props.cellFillType !== "gradient"
        },
    },
    gradientEnd: {
        type: ControlType.Color,
        title: "End Color",
        defaultValue: "#FF9933",
        hidden(props) {
            return props.cellFillType !== "gradient"
        },
    },
    gradientAngle: {
        type: ControlType.Number,
        title: "Angle",
        min: 0,
        max: 360,
        defaultValue: 180,
        unit: "°",
        displayStepper: true,
        hidden(props) {
            return props.cellFillType !== "gradient"
        },
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 100,
        defaultValue: 0,
        unit: "px",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        min: 0,
        max: 10,
        defaultValue: 0,
        unit: "px",
        displayStepper: true,
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#000000",
        hidden(props) {
            return props.borderWidth === 0
        },
    },
    borderStyle: {
        type: ControlType.Enum,
        title: "Border Style",
        options: ["solid", "dashed", "dotted"],
        optionTitles: ["Solid", "Dashed", "Dotted"],
        defaultValue: "solid",
        hidden(props) {
            return props.borderWidth === 0
        },
    },
    rows: {
        type: ControlType.Number,
        title: "Grid Rows",
        min: 1,
        max: 20,
        defaultValue: 4,
        displayStepper: true,
    },
    cols: {
        type: ControlType.Number,
        title: "Grid Cols",
        min: 1,
        max: 20,
        defaultValue: 6,
        displayStepper: true,
    },
    distanceX: {
        type: ControlType.Number,
        title: "Scatter X",
        description: "Horizontal scatter distance",
        min: 0,
        max: 500,
        defaultValue: 100,
        unit: "px",
    },
    distanceY: {
        type: ControlType.Number,
        title: "Scatter Y",
        description: "Vertical scatter distance",
        min: 0,
        max: 500,
        defaultValue: 150,
        unit: "px",
    },
    rotation: {
        type: ControlType.Number,
        title: "Rotation",
        min: 0,
        max: 180,
        defaultValue: 45,
        unit: "°",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        min: 0,
        max: 5,
        step: 0.1,
        defaultValue: 0.2,
        unit: "s",
    },
    duration: {
        type: ControlType.Number,
        title: "Speed (Duration)",
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 0.6,
        unit: "s",
    },
    isSequential: {
        type: ControlType.Boolean,
        title: "Sequential",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger Gap",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.05,
        unit: "s",
        hidden(props) {
            return !props.isSequential
        },
    },
    disableAnimation: {
        type: ControlType.Boolean,
        title: "Disable",
        defaultValue: false,
        description:
            "Disable the animation completely and show the final state instantly. Useful for mobile breakpoints.",
    },
    canvasDisplay: {
        type: ControlType.Enum,
        title: "Canvas Display",
        options: ["scattered", "assembled", "text"],
        optionTitles: ["Scattered (Start)", "Assembled (Grid)", "Final Text"],
        defaultValue: "assembled",
        description:
            "Force a specific static state on the Framer canvas for styling. To see the animation, hit Framer's Preview (Play) button.",
    },
})
