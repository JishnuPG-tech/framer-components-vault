import * as React from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * =========================
 * SHUFFLE CHAR
 * =========================
 */

export function ShuffleChar({
    targetValue,
    totalDuration,
    shuffleCount,
    shuffleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    fontFamily,
    fontSize,
    fontWeight,
    color,
    letterSpacing,
    lineHeight,
    charWidthPercentage = 100,
}) {
    const isStaticRenderer = useIsStaticRenderer()

    const isStatic = targetValue === " "
    const displayChar = isStatic ? "\u00A0" : targetValue

    // Static fallback – no animations, no measurements
    if (isStaticRenderer) {
        return (
            <span
                style={{
                    fontFamily,
                    fontSize,
                    fontWeight,
                    color,
                    letterSpacing,
                    lineHeight,
                    whiteSpace: "nowrap",
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {displayChar}
            </span>
        )
    }

    const [currentItem, setCurrentItem] = React.useState({
        id: "initial",
        val: targetValue,
        type: "target",
        duration: totalDuration,
    })

    const [measuredWidth, setMeasuredWidth] = React.useState(0)
    const measureRef = React.useRef(null)

    // 1. Measure the exact natural width of the character dynamically
    React.useLayoutEffect(() => {
        if (!measureRef.current) return

        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const width = entry.target.getBoundingClientRect().width
                if (width > 0) {
                    setMeasuredWidth(width)
                }
            }
        })

        observer.observe(measureRef.current)
        return () => observer.disconnect()
    }, [displayChar, fontFamily, fontSize, fontWeight, letterSpacing])

    // 2. Handle the shuffle animation sequence
    React.useEffect(() => {
        let cancelled = false

        if (isStatic) {
            setCurrentItem({
                id: `static-${targetValue}-${Date.now()}`,
                val: targetValue,
                type: "target",
                duration: totalDuration,
            })
            return
        }

        const springTime = Math.min(0.6, totalDuration * 0.4)
        const spinTime = Math.max(0, totalDuration - springTime)
        const stepTime =
            shuffleCount > 0 ? spinTime / shuffleCount : totalDuration

        const sequence = []
        const validShuffleChars =
            shuffleChars?.length > 0
                ? shuffleChars
                : "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

        for (let i = 0; i < shuffleCount; i++) {
            const randomChar = validShuffleChars.charAt(
                Math.floor(Math.random() * validShuffleChars.length)
            )
            sequence.push({
                id: `shuffle-${i}-${Date.now()}`,
                val: randomChar,
                type: i === 0 ? "first" : "middle",
                duration: stepTime,
            })
        }

        sequence.push({
            id: `target-${Date.now()}`,
            val: targetValue,
            type: "target",
            duration: springTime,
        })

        const run = async () => {
            for (const step of sequence) {
                if (cancelled) return
                setCurrentItem(step)
                await new Promise((r) => setTimeout(r, step.duration * 1000))
            }
        }

        run()

        return () => {
            cancelled = true
        }
    }, [targetValue, shuffleCount, totalDuration, shuffleChars])

    const isOnlyTarget = shuffleCount === 0

    const getTransition = () => {
        if (currentItem.type === "first") {
            return { duration: currentItem.duration, ease: "easeIn" }
        }
        if (currentItem.type === "middle") {
            return { duration: currentItem.duration, ease: "linear" }
        }
        return {
            type: "spring",
            duration: currentItem.duration,
            bounce: 0.35,
        }
    }

    return (
        <div
            style={{
                position: "relative",
                width:
                    measuredWidth > 0
                        ? measuredWidth * (charWidthPercentage / 100)
                        : "auto",
                height: fontSize * 0.9,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                flexShrink: 0,
            }}
        >
            <span
                ref={measureRef}
                style={{
                    visibility: "hidden",
                    opacity: 0,
                    pointerEvents: "none",
                    fontFamily,
                    fontSize,
                    fontWeight,
                    letterSpacing,
                    lineHeight,
                    whiteSpace: "nowrap",
                }}
            >
                {displayChar}
            </span>

            {measuredWidth > 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            key={currentItem.id}
                            initial={{
                                y: "100%",
                                opacity: 0,
                                filter:
                                    currentItem.type === "first" || isOnlyTarget
                                        ? "blur(0px)"
                                        : "blur(3px)",
                            }}
                            animate={{
                                y: "0%",
                                opacity: 1,
                                filter:
                                    currentItem.type === "target"
                                        ? "blur(0px)"
                                        : "blur(3px)",
                            }}
                            exit={{
                                y: "-100%",
                                opacity: 0,
                                filter: "blur(3px)",
                            }}
                            transition={{
                                y: getTransition(),
                                opacity: {
                                    duration: currentItem.duration * 0.5,
                                },
                                filter: {
                                    duration: currentItem.duration,
                                },
                            }}
                            style={{
                                position: "absolute",
                                fontFamily,
                                fontSize,
                                fontWeight,
                                color,
                                letterSpacing,
                                lineHeight,
                                whiteSpace: "nowrap",
                                fontVariantNumeric: "tabular-nums",
                                WebkitFontSmoothing: "antialiased",
                                MozOsxFontSmoothing: "grayscale",
                            }}
                        >
                            {currentItem.val === " "
                                ? "\u00A0"
                                : currentItem.val}
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}

/**
 * =========================
 * TEXT SHUFFLE
 * =========================
 */

export default function TextShuffle(props) {
    const {
        text = "FRAMER",
        shuffleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*",
        duration = 1,
        shuffleCount = 10,
        stagger = 0.25,
        font,
        color = "#000000",
        align = "center",
        playOnView = true,
        viewAmount = 0.1,
        once = true,
        charWidthPercentage = 100,
    } = props

    const isStaticRenderer = useIsStaticRenderer()

    const containerRef = React.useRef(null)

    const isInView = useInView(containerRef, {
        amount: viewAmount,
        once,
    })

    const [hasTriggered, setHasTriggered] = React.useState(!playOnView)

    React.useEffect(() => {
        if (isStaticRenderer) return

        if (!playOnView) {
            setHasTriggered(true)
            return
        }

        if (isInView) {
            setHasTriggered(true)
        }
    }, [isInView, playOnView, isStaticRenderer])

    const fontFamily =
        font?.fontFamily ??
        "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"

    const fontSize = parseFloat(font?.fontSize ?? "64px")
    const letterSpacing = font?.letterSpacing ?? "0em"
    const lineHeight = font?.lineHeight ?? "1.2"

    const fontWeightMap = {
        Thin: 100,
        "Extra Light": 200,
        Light: 300,
        Regular: 400,
        Medium: 500,
        "Semi Bold": 600,
        Bold: 700,
        "Extra Bold": 800,
        Black: 900,
    }

    const fontWeight =
        fontWeightMap[font?.variant] ?? parseInt(font?.variant, 10) ?? 400

    // Static canvas/export fallback – plain styled text, no animations
    if (isStaticRenderer) {
        return (
            <div
                style={{
                    width: "fit-content",
                    display: "inline-flex",
                    justifyContent: align,
                    alignItems: "center",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    fontFamily,
                    fontSize: `${fontSize}px`,
                    fontWeight,
                    color,
                    letterSpacing,
                    lineHeight,
                }}
            >
                {text}
            </div>
        )
    }

    const textString = String(text)
    const characters = textString.split("")
    const baseSpinSpeed = shuffleCount > 0 ? duration / shuffleCount : duration

    return (
        <div
            ref={containerRef}
            style={{
                width: "fit-content",
                display: "inline-flex",
                justifyContent: align,
                alignItems: "center",
                whiteSpace: "nowrap",
                flexShrink: 0,
            }}
        >
            {hasTriggered &&
                characters.map((char, index) => {
                    const columnDuration = duration + index * stagger
                    const extraTime = index * stagger
                    const extraShuffles =
                        shuffleCount > 0
                            ? Math.round(extraTime / baseSpinSpeed)
                            : 0
                    const columnShuffleCount = shuffleCount + extraShuffles

                    return (
                        <ShuffleChar
                            key={`char-${index}`}
                            targetValue={char}
                            shuffleChars={shuffleChars}
                            totalDuration={columnDuration}
                            shuffleCount={columnShuffleCount}
                            fontFamily={fontFamily}
                            fontSize={fontSize}
                            fontWeight={fontWeight}
                            color={color}
                            letterSpacing={letterSpacing}
                            lineHeight={lineHeight}
                            charWidthPercentage={charWidthPercentage}
                        />
                    )
                })}
        </div>
    )
}

/**
 * =========================
 * CONTROLS
 * =========================
 */

addPropertyControls(TextShuffle, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "FRAMER",
    },
    shuffleChars: {
        type: ControlType.String,
        title: "Shuffle Chars",
        defaultValue: "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1,
        min: 0.1,
        max: 10,
        step: 0.1,
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 0.25,
        min: 0,
        max: 2,
        step: 0.05,
    },
    shuffleCount: {
        type: ControlType.Number,
        title: "Shuffles",
        defaultValue: 10,
        min: 0,
        max: 50,
        step: 1,
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontFamily:
                "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            fontSize: "64px",
            variant: "Bold",
            letterSpacing: "0em",
            lineHeight: "1.2",
        },
    },
    playOnView: {
        type: ControlType.Boolean,
        title: "On View",
        defaultValue: true,
    },
    viewAmount: {
        type: ControlType.Number,
        title: "View %",
        defaultValue: 0.1,
        min: 0,
        max: 1,
        step: 0.05,
    },
    once: {
        type: ControlType.Boolean,
        title: "Once",
        defaultValue: true,
    },
    charWidthPercentage: {
        type: ControlType.Number,
        title: "Width (%)",
        defaultValue: 100,
        min: 10,
        max: 300,
        step: 1,
        displayStepper: true,
    },
})
