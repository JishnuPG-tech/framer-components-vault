// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useAnimation } from "framer-motion"
import { useEffect, useRef, useState, useCallback } from "react"

interface Props {
    text: string
    font: any
    fontSize: number
    color: string
    letterDelay: number
    duration: number
    triggerOnView: boolean
    yOffset: number
    rotateAmount: number
    letterSpacing: number
    lineHeight: number
    scaleToFit: boolean
}

const BASE_SIZE = 100

export default function AnimatedText({
    text = "Hello World",
    font,
    fontSize = 64,
    color = "#000000",
    letterDelay = 0.05,
    duration = 0.7,
    triggerOnView = true,
    yOffset = 100,
    rotateAmount = 60,
    letterSpacing = 0,
    lineHeight = 1.1,
    scaleToFit = false,
}: Props) {
    const isStatic = useIsStaticRenderer()
    const controls = useAnimation()
    const containerRef = useRef<HTMLDivElement>(null)
    const measureRef = useRef<HTMLDivElement>(null)
    const [ratio, setRatio] = useState(1)

    const isEditor = RenderTarget.current() === RenderTarget.canvas

    const recompute = useCallback(() => {
        if (!scaleToFit) return
        const container = containerRef.current
        const measure = measureRef.current
        if (!container || !measure) return

        const containerWidth = container.getBoundingClientRect().width
        const textWidth = measure.getBoundingClientRect().width

        if (textWidth === 0 || containerWidth === 0) return
        setRatio(containerWidth / textWidth)
    }, [scaleToFit])

    // Shared: scale-to-fit measurement runs in ALL contexts, static or not
    useEffect(() => {
        if (!scaleToFit) {
            setRatio(1)
            return
        }
        const raf = requestAnimationFrame(recompute)
        return () => cancelAnimationFrame(raf)
    }, [scaleToFit, text, letterSpacing, font, recompute])

    useEffect(() => {
        if (!scaleToFit) return
        const ro = new ResizeObserver(() => requestAnimationFrame(recompute))
        if (containerRef.current) ro.observe(containerRef.current)
        return () => ro.disconnect()
    }, [scaleToFit, recompute])

    // Animation only: skip entirely in static contexts
    useEffect(() => {
        if (isStatic) return

        if (isEditor) {
            controls.start("visible")
            return
        }
        if (!triggerOnView) {
            controls.start("visible")
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) controls.start("visible")
            },
            { threshold: 0.2 }
        )
        if (containerRef.current) observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [isStatic, controls, triggerOnView, isEditor])

    const fontStyles: React.CSSProperties = font
        ? {
              fontFamily: font.fontFamily ?? font.family ?? "inherit",
              fontWeight: font.fontWeight ?? font.weight ?? 400,
              fontStyle: font.fontStyle ?? font.style ?? "normal",
          }
        : {}

    const renderSize = scaleToFit ? BASE_SIZE * ratio : fontSize
    const renderLetterSpacing = scaleToFit
        ? letterSpacing * ratio
        : letterSpacing

    const words = text.split(" ")

    // Static fallback: correct size (ratio already computed above),
    // no motion wrappers, no animation machinery
    if (isStatic) {
        return (
            <div
                ref={containerRef}
                style={{ width: "100%", position: "relative" }}
            >
                {scaleToFit && (
                    <div
                        ref={measureRef}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            display: "inline-flex",
                            whiteSpace: "nowrap",
                            pointerEvents: "none",
                            opacity: 0,
                        }}
                    >
                        {words.map((word, wordIndex) => (
                            <div
                                key={wordIndex}
                                style={{
                                    display: "inline-flex",
                                    marginRight:
                                        wordIndex < words.length - 1
                                            ? `${BASE_SIZE * 0.28 + letterSpacing}px`
                                            : 0,
                                }}
                            >
                                {word.split("").map((letter, letterIndex) => (
                                    <div
                                        key={letterIndex}
                                        style={{
                                            display: "inline-block",
                                            fontSize: BASE_SIZE,
                                            marginRight:
                                                letterIndex < word.length - 1
                                                    ? `${letterSpacing}px`
                                                    : 0,
                                            ...fontStyles,
                                            lineHeight,
                                            visibility: "hidden",
                                        }}
                                    >
                                        {letter}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                <div
                    style={{
                        display: "flex",
                        flexWrap: scaleToFit ? "nowrap" : "wrap",
                        whiteSpace: scaleToFit ? "nowrap" : undefined,
                    }}
                >
                    {words.map((word, wordIndex) => (
                        <div
                            key={wordIndex}
                            style={{
                                display: "inline-flex",
                                marginRight:
                                    wordIndex < words.length - 1
                                        ? `${renderSize * 0.28 + renderLetterSpacing}px`
                                        : 0,
                            }}
                        >
                            {word.split("").map((letter, letterIndex) => (
                                <div
                                    key={letterIndex}
                                    style={{
                                        display: "inline-block",
                                        fontSize: renderSize,
                                        color,
                                        ...fontStyles,
                                        lineHeight,
                                        marginRight:
                                            letterIndex < word.length - 1
                                                ? `${renderLetterSpacing}px`
                                                : 0,
                                    }}
                                >
                                    {letter}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const renderWords = (size: number, spacing: number, forMeasure = false) =>
        words.map((word, wordIndex) => {
            const letterOffset =
                words
                    .slice(0, wordIndex)
                    .reduce((acc, w) => acc + w.length, 0) + wordIndex

            return (
                <div
                    key={wordIndex}
                    style={{
                        display: "inline-flex",
                        marginRight:
                            wordIndex < words.length - 1
                                ? `${size * 0.28 + spacing}px`
                                : 0,
                    }}
                >
                    {word.split("").map((letter, letterIndex) => {
                        const globalIndex = letterOffset + letterIndex
                        const isLastLetter = letterIndex === word.length - 1

                        if (forMeasure) {
                            return (
                                <div
                                    key={letterIndex}
                                    style={{
                                        display: "inline-block",
                                        fontSize: size,
                                        marginRight: isLastLetter
                                            ? 0
                                            : `${spacing}px`,
                                        ...fontStyles,
                                        lineHeight,
                                        visibility: "hidden",
                                    }}
                                >
                                    {letter}
                                </div>
                            )
                        }

                        return (
                            <div
                                key={letterIndex}
                                style={{
                                    overflow: "hidden",
                                    paddingBottom: `${size * 0.5}px`,
                                    marginBottom: `-${size * 0.5}px`,
                                    marginRight: isLastLetter
                                        ? 0
                                        : `${spacing}px`,
                                }}
                            >
                                {/* Layer 1: Y slide */}
                                <motion.div
                                    custom={globalIndex}
                                    initial={isEditor ? "visible" : "hidden"}
                                    animate={controls}
                                    variants={{
                                        hidden: {
                                            transform: `translate3d(0px, ${yOffset}px, 0px)`,
                                        },
                                        visible: (i: number) => ({
                                            transform:
                                                "translate3d(0px, 0px, 0px)",
                                            transition: {
                                                delay: i * letterDelay,
                                                duration,
                                                ease: [0.22, 1, 0.36, 1],
                                            },
                                        }),
                                    }}
                                    style={{
                                        display: "inline-block",
                                        perspective: `${size * 5}px`,
                                        perspectiveOrigin: "50% 100%",
                                    }}
                                >
                                    {/* Layer 2: rotateX tilt */}
                                    <motion.div
                                        aria-hidden="true"
                                        custom={globalIndex}
                                        initial={
                                            isEditor ? "visible" : "hidden"
                                        }
                                        animate={controls}
                                        variants={{
                                            hidden: {
                                                transform: `rotateX(${rotateAmount}deg)`,
                                            },
                                            visible: (i: number) => ({
                                                transform: "rotateX(0deg)",
                                                transition: {
                                                    delay: i * letterDelay,
                                                    duration,
                                                    ease: [0.22, 1, 0.36, 1],
                                                },
                                            }),
                                        }}
                                        style={{
                                            display: "inline-block",
                                            fontSize: size,
                                            color,
                                            ...fontStyles,
                                            lineHeight,
                                            transformOrigin: "50% 100%",
                                            willChange: "transform",
                                        }}
                                    >
                                        {letter}
                                    </motion.div>
                                </motion.div>
                            </div>
                        )
                    })}
                </div>
            )
        })

    return (
        <div ref={containerRef} style={{ width: "100%", position: "relative" }}>
            {scaleToFit && (
                <div
                    ref={measureRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        display: "inline-flex",
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                        opacity: 0,
                    }}
                >
                    {renderWords(BASE_SIZE, letterSpacing, true)}
                </div>
            )}

            <div
                style={{
                    display: "flex",
                    flexWrap: scaleToFit ? "nowrap" : "wrap",
                    whiteSpace: scaleToFit ? "nowrap" : undefined,
                }}
            >
                {renderWords(renderSize, renderLetterSpacing, false)}
            </div>
        </div>
    )
}

addPropertyControls(AnimatedText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Hello World",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 64,
        min: 12,
        max: 300,
        step: 1,
        displayStepper: true,
        hidden(props) {
            return props.scaleToFit === true
        },
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: 0,
        min: -10,
        max: 50,
        step: 0.5,
        displayStepper: true,
        unit: "px",
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 1.1,
        min: 0.5,
        max: 3,
        step: 0.05,
        displayStepper: true,
    },
    scaleToFit: {
        type: ControlType.Boolean,
        title: "Scale to Fit",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    letterDelay: {
        type: ControlType.Number,
        title: "Letter Delay",
        defaultValue: 0.05,
        min: 0,
        max: 0.3,
        step: 0.005,
        displayStepper: true,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.7,
        min: 0.1,
        max: 5,
        step: 0.05,
        displayStepper: true,
    },
    yOffset: {
        type: ControlType.Number,
        title: "Y Offset",
        defaultValue: 100,
        min: 20,
        max: 300,
        step: 10,
        displayStepper: true,
    },
    rotateAmount: {
        type: ControlType.Number,
        title: "Rotate X",
        defaultValue: 60,
        min: 0,
        max: 90,
        step: 5,
        displayStepper: true,
    },
    triggerOnView: {
        type: ControlType.Boolean,
        title: "Trigger on View",
        defaultValue: true,
        enabledTitle: "On scroll",
        disabledTitle: "On load",
    },
})
