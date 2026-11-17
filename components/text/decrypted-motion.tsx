import { useEffect, useState, useRef } from "react"
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


export default function DecryptedText(props) {
    const {
        text,
        speed,
        maxIterations,
        sequential,
        revealDirection,
        useOriginalCharsOnly,
        characters,
        animateOn,
        textColor,
        encryptedColor,
        font,
    } = props

    const [displayText, setDisplayText] = useState(text)
    const [isHovering, setIsHovering] = useState(false)
    const [isScrambling, setIsScrambling] = useState(false)
    const [revealedIndices, setRevealedIndices] = useState(new Set())
    const [hasAnimated, setHasAnimated] = useState(false)
    const [naturalWidth, setNaturalWidth] = useState<number | null>(null)
    const containerRef = useRef(null)
    const measuringRef = useRef(null)

    // Measure the natural width of the original text once on mount
    useEffect(() => {
        if (measuringRef.current) {
            setNaturalWidth(measuringRef.current.offsetWidth)
        }
    }, [text, font])

    // 🔹 Scramble Logic
    useEffect(() => {
        let interval
        let currentIteration = 0

        const getNextIndex = (revealedSet) => {
            const textLength = text.length

            switch (revealDirection) {
                case "start":
                    return revealedSet.size
                case "end":
                    return textLength - 1 - revealedSet.size
                case "center": {
                    const middle = Math.floor(textLength / 2)
                    const offset = Math.floor(revealedSet.size / 2)
                    const nextIndex =
                        revealedSet.size % 2 === 0
                            ? middle + offset
                            : middle - offset - 1

                    if (
                        nextIndex >= 0 &&
                        nextIndex < textLength &&
                        !revealedSet.has(nextIndex)
                    ) {
                        return nextIndex
                    }

                    for (let i = 0; i < textLength; i++) {
                        if (!revealedSet.has(i)) return i
                    }
                    return 0
                }
                default:
                    return revealedSet.size
            }
        }

        const availableChars = useOriginalCharsOnly
            ? Array.from(new Set(text.split(""))).filter((c) => c !== " ")
            : characters.split("")

        const shuffleText = (originalText, currentRevealed) => {
            return originalText
                .split("")
                .map((char, i) => {
                    if (char === " ") return " "
                    if (currentRevealed.has(i)) return originalText[i]
                    return availableChars[
                        Math.floor(Math.random() * availableChars.length)
                    ]
                })
                .join("")
        }

        if (isHovering) {
            setIsScrambling(true)

            interval = setInterval(() => {
                setRevealedIndices((prev) => {
                    if (sequential) {
                        if (prev.size < text.length) {
                            const nextIndex = getNextIndex(prev)
                            const updated = new Set(prev)
                            updated.add(nextIndex)
                            setDisplayText(shuffleText(text, updated))
                            return updated
                        } else {
                            clearInterval(interval)
                            setIsScrambling(false)
                            return prev
                        }
                    } else {
                        setDisplayText(shuffleText(text, prev))
                        currentIteration++
                        if (currentIteration >= maxIterations) {
                            clearInterval(interval)
                            setIsScrambling(false)
                            setDisplayText(text)
                        }
                        return prev
                    }
                })
            }, speed)
        } else {
            setDisplayText(text)
            setRevealedIndices(new Set())
            setIsScrambling(false)
        }

        return () => interval && clearInterval(interval)
    }, [
        isHovering,
        text,
        speed,
        maxIterations,
        sequential,
        revealDirection,
        characters,
        useOriginalCharsOnly,
    ])

    // 🔹 View Trigger
    useEffect(() => {
        if (animateOn !== "view" && animateOn !== "both") return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasAnimated) {
                        setIsHovering(true)
                        setHasAnimated(true)
                    }
                })
            },
            { threshold: 0.1 }
        )

        if (containerRef.current) observer.observe(containerRef.current)

        return () => observer.disconnect()
    }, [animateOn, hasAnimated])

    const hoverProps =
        animateOn === "hover" || animateOn === "both"
            ? {
                  onMouseEnter: () => setIsHovering(true),
                  onMouseLeave: () => setIsHovering(false),
              }
            : {}

    return (
        <>
            {/* Hidden element used solely to measure the natural width of the original text */}
            <span
                ref={measuringRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    visibility: "hidden",
                    pointerEvents: "none",
                    whiteSpace: "pre",
                    ...font,
                }}
            >
                {text}
            </span>

            <motion.span
                ref={containerRef}
                {...hoverProps}
                style={{
                    display: "inline-flex",
                    whiteSpace: "pre-wrap",
                    cursor: "pointer",
                    width: naturalWidth != null ? naturalWidth : undefined,
                    overflow: "visible",
                    flexWrap: "nowrap",
                    justifyContent: "flex-start",
                    ...font,
                }}
            >
                {displayText.split("").map((char, index) => {
                    const isRevealed =
                        revealedIndices.has(index) || !isScrambling

                    return (
                        <span
                            key={index}
                            style={{
                                color: isRevealed ? textColor : encryptedColor,
                            }}
                        >
                            {char}
                        </span>
                    )
                })}
            </motion.span>
        </>
    )
}

DecryptedText.defaultProps = {
    text: "Decrypted Text",
    speed: 50,
    maxIterations: 10,
    sequential: false,
    revealDirection: "start",
    useOriginalCharsOnly: false,
    characters:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+",
    animateOn: "hover",
    textColor: "#000000",
    encryptedColor: "#999999",
}

addPropertyControls(DecryptedText, {
    text: { type: ControlType.String, title: "Text" },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 32,
            variant: "Semibold",
        },
    },
    speed: { type: ControlType.Number, title: "Speed", min: 10, max: 200 },
    maxIterations: {
        type: ControlType.Number,
        title: "Iterations",
        min: 1,
        max: 50,
    },
    sequential: { type: ControlType.Boolean, title: "Sequential" },
    revealDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["start", "end", "center"],
    },
    useOriginalCharsOnly: {
        type: ControlType.Boolean,
        title: "Use Original Chars",
    },
    characters: {
        type: ControlType.String,
        title: "Characters",
        defaultValue:
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+",
        hidden: (props) => props.useOriginalCharsOnly,
        displayTextArea: true,
    },
    animateOn: {
        type: ControlType.Enum,
        title: "Animate On",
        options: ["hover", "view", "both"],
    },
    textColor: { type: ControlType.Color, title: "Text Color" },
    encryptedColor: { type: ControlType.Color, title: "Encrypted Color" },
})
