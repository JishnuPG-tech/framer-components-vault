// Matrix text animation component that reveals text with a digital matrix effect
import { motion, useInView } from "framer-motion"
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    startTransition,
    useRef,
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


interface LetterState {
    char: string
    isMatrix: boolean
    isSpace: boolean
}

interface MatrixTextProps {
    text: string
    initialDelay: number
    letterAnimationDuration: number
    letterInterval: number
    matrixColor: string
    textColor: string
    font: CSSProperties
    triggerMode: "hover" | "appear"
    isInfiniteHover: boolean
    hoverAnimationCount: number
    isInfiniteAppear: boolean
    appearAnimationCount: number
    style?: CSSProperties
}

/**
 * Matrix Text Animation
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function MatrixText(props: MatrixTextProps) {
    const {
        text = "DiverseKit!",
        initialDelay = 200,
        letterAnimationDuration = 500,
        letterInterval = 100,
        matrixColor = "#00ff00",
        textColor = "#000000",
        font,
        triggerMode = "hover",
        isInfiniteHover = false,
        hoverAnimationCount = 1,
        isInfiniteAppear = false,
        appearAnimationCount = 1,
        style,
    } = props

    const [letters, setLetters] = useState<LetterState[]>(() =>
        text.split("").map((char) => ({
            char,
            isMatrix: false,
            isSpace: char === " ",
        }))
    )
    const [isAnimating, setIsAnimating] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: false, amount: 0.5 })
    const appearAnimationCounter = useRef(0)
    const hoverAnimationCounter = useRef(0)

    const getRandomChar = useCallback(
        () => (Math.random() > 0.5 ? "1" : "0"),
        []
    )

    const animateLetter = useCallback(
        (index: number) => {
            if (index >= text.length) return

            requestAnimationFrame(() => {
                setLetters((prev) => {
                    const newLetters = [...prev]
                    if (!newLetters[index].isSpace) {
                        newLetters[index] = {
                            ...newLetters[index],
                            char: getRandomChar(),
                            isMatrix: true,
                        }
                    }
                    return newLetters
                })

                setTimeout(() => {
                    setLetters((prev) => {
                        const newLetters = [...prev]
                        newLetters[index] = {
                            ...newLetters[index],
                            char: text[index],
                            isMatrix: false,
                        }
                        return newLetters
                    })
                }, letterAnimationDuration)
            })
        },
        [getRandomChar, text, letterAnimationDuration]
    )

    const startAnimation = useCallback(() => {
        if (isAnimating) return

        startTransition(() => setIsAnimating(true))
        let currentIndex = 0

        const animate = () => {
            if (currentIndex >= text.length) {
                startTransition(() => setIsAnimating(false))
                return
            }

            animateLetter(currentIndex)
            currentIndex++
            setTimeout(animate, letterInterval)
        }

        animate()
    }, [animateLetter, text, isAnimating, letterInterval])

    useEffect(() => {
        if (triggerMode === "appear" && isInView) {
            if (
                isInfiniteAppear ||
                appearAnimationCounter.current < appearAnimationCount
            ) {
                appearAnimationCounter.current++
                const timer = setTimeout(startAnimation, initialDelay)
                return () => clearTimeout(timer)
            }
        }
        if (!isInView) {
            appearAnimationCounter.current = 0
        }
    }, [
        isInView,
        startAnimation,
        initialDelay,
        triggerMode,
        appearAnimationCount,
        isInfiniteAppear,
    ])

    useEffect(() => {
        if (triggerMode === "hover" && isHovered) {
            if (
                isInfiniteHover ||
                hoverAnimationCounter.current < hoverAnimationCount
            ) {
                hoverAnimationCounter.current++
                startAnimation()
            }
        }
        if (!isHovered) {
            hoverAnimationCounter.current = 0
        }
    }, [
        isHovered,
        startAnimation,
        triggerMode,
        hoverAnimationCount,
        isInfiniteHover,
    ])

    useEffect(() => {
        setLetters(
            text.split("").map((char) => ({
                char,
                isMatrix: false,
                isSpace: char === " ",
            }))
        )
    }, [text])

    const motionVariants = useMemo(
        () => ({
            initial: {
                color: textColor,
            },
            matrix: {
                color: matrixColor,
                textShadow: `0 2px 4px ${matrixColor}80`,
            },
            normal: {
                color: textColor,
                textShadow: "none",
            },
        }),
        [matrixColor, textColor]
    )

    return (
        <div
            ref={containerRef}
            onMouseEnter={() => startTransition(() => setIsHovered(true))}
            onMouseLeave={() => startTransition(() => setIsHovered(false))}
            style={{
                ...style,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: style?.width === "100%" ? "100%" : "max-content",
                height: style?.height === "100%" ? "100%" : "max-content",
            }}
            aria-label="Matrix text animation"
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {letters.map((letter, index) => (
                        <motion.div
                            key={`${index}-${letter.char}`}
                            animate={letter.isMatrix ? "matrix" : "normal"}
                            initial="initial"
                            variants={motionVariants}
                            transition={{
                                duration: 0.1,
                                ease: "easeInOut",
                            }}
                            style={{
                                display: "inline-block",
                                width: "1ch",
                                overflow: "hidden",
                                textAlign: "center",
                                fontFamily: "monospace",
                                fontVariantNumeric: "tabular-nums",
                                ...font,
                            }}
                        >
                            {letter.isSpace ? "\u00A0" : letter.char}
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(MatrixText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "DiverseKit!",
    },
    triggerMode: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["hover", "appear"],
        optionTitles: ["On Hover", "On Appear"],
        defaultValue: "appear",
        displaySegmentedControl: true,
    },
    isInfiniteHover: {
        type: ControlType.Boolean,
        title: "Infinite Hover",
        defaultValue: false,
        enabledTitle: "Infinite",
        disabledTitle: "Limited",
        hidden: ({ triggerMode }) => triggerMode !== "hover",
    },
    hoverAnimationCount: {
        type: ControlType.Number,
        title: "Hover Count",
        defaultValue: 1,
        min: 1,
        max: 10,
        step: 1,
        hidden: ({ triggerMode, isInfiniteHover }) =>
            triggerMode !== "hover" || isInfiniteHover,
    },
    isInfiniteAppear: {
        type: ControlType.Boolean,
        title: "Infinite Appear",
        defaultValue: false,
        enabledTitle: "Infinite",
        disabledTitle: "Limited",
        hidden: ({ triggerMode }) => triggerMode !== "appear",
    },
    appearAnimationCount: {
        type: ControlType.Number,
        title: "Appear Count",
        defaultValue: 1,
        min: 1,
        max: 10,
        step: 1,
        hidden: ({ triggerMode, isInfiniteAppear }) =>
            triggerMode !== "appear" || isInfiniteAppear,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: "60px",
        },
    },
    matrixColor: {
        type: ControlType.Color,
        title: "Matrix Color",
        defaultValue: "#00ff00",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#fff",
    },
    initialDelay: {
        type: ControlType.Number,
        title: "Initial Delay",
        defaultValue: 200,
        min: 0,
        max: 5000,
        step: 100,
        unit: "ms",
    },
    letterAnimationDuration: {
        type: ControlType.Number,
        title: "Letter Duration",
        defaultValue: 500,
        min: 100,
        max: 2000,
        step: 50,
        unit: "ms",
    },
    letterInterval: {
        type: ControlType.Number,
        title: "Letter Interval",
        defaultValue: 100,
        min: 10,
        max: 1000,
        step: 10,
        unit: "ms",
        description:
            "More Components at [DiverseKit](https://framer.link/se2heI4)",
    },
})
