import { useState, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function HighlightedTextAnimation(props) {
    const [progress, setProgress] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)

    const {
        fullText,
        animatedWords,
        duration,
        autoPlay,
        loop,
        headingTag,
        normalFont,
        normalColor,
        highlightedFont,
        highlightedColor,
    } = props

    useEffect(() => {
        if (autoPlay) {
            setIsAnimating(true)
        }
    }, [autoPlay])

    useEffect(() => {
        if (!isAnimating) return

        const startTime = Date.now()
        let animationFrameId

        const animate = () => {
            const elapsed = Date.now() - startTime
            const newProgress = Math.min(elapsed / duration, 1)
            setProgress(newProgress)

            if (newProgress < 1) {
                animationFrameId = requestAnimationFrame(animate)
            } else {
                if (loop) {
                    setTimeout(() => {
                        setProgress(0)
                        setIsAnimating(false)
                        // Restart animation
                        setTimeout(() => setIsAnimating(true), 50)
                    }, 1000)
                } else {
                    setIsAnimating(false)
                }
            }
        }

        animationFrameId = requestAnimationFrame(animate)

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
            }
        }
    }, [isAnimating, duration, loop])

    const words = fullText.split(" ")

    // Convert animated words string to array and normalize
    const animatedWordsList = animatedWords
        .split(",")
        .map((word) => word.trim().toLowerCase())
        .filter((word) => word.length > 0)

    // Check if a word should be animated
    const isWordAnimated = (word) => {
        return animatedWordsList.includes(word.toLowerCase())
    }

    // Get total characters to animate
    const getTotalAnimatedChars = () => {
        return words
            .filter((word) => isWordAnimated(word))
            .reduce((total, word) => total + word.length, 0)
    }

    const getVisibleCharacters = (word, wordIndex) => {
        if (!isWordAnimated(word)) return word.length

        const totalChars = getTotalAnimatedChars()
        const totalProgress = progress * totalChars

        // Calculate how many chars have been revealed before this word
        let charsBefore = 0
        for (let i = 0; i < wordIndex; i++) {
            if (isWordAnimated(words[i])) {
                charsBefore += words[i].length
            }
        }

        const charsForThisWord = Math.max(
            0,
            Math.min(word.length, totalProgress - charsBefore)
        )
        return Math.floor(charsForThisWord)
    }

    const HeadingTag = headingTag

    return (
        <HeadingTag style={{ margin: 0, lineHeight: 1.4, overflow: "visible" }}>
            {words.map((word, index) => {
                const isAnimated = isWordAnimated(word)
                const visibleChars = isAnimated
                    ? getVisibleCharacters(word, index)
                    : word.length

                return (
                    <span
                        key={index}
                        style={{ display: "inline-block", overflow: "visible" }}
                    >
                        <span
                            style={{
                                ...(isAnimated ? highlightedFont : normalFont),
                                color: isAnimated
                                    ? highlightedColor
                                    : normalColor,
                                position: "relative",
                                display: "inline-block",
                                marginRight:
                                    index < words.length - 1 ? "0.3em" : "0",
                                overflow: "visible",
                                whiteSpace: "nowrap",
                                paddingBottom: "0.2em",
                            }}
                        >
                            {isAnimated ? (
                                <>
                                    <span
                                        style={{
                                            opacity: 0.2,
                                            visibility: "visible",
                                        }}
                                    >
                                        {word}
                                    </span>
                                    <span
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            top: 0,
                                            overflow: "visible",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {word.slice(0, visibleChars)}
                                    </span>
                                </>
                            ) : (
                                word
                            )}
                        </span>
                    </span>
                )
            })}
        </HeadingTag>
    )
}

HighlightedTextAnimation.defaultProps = {
    fullText: "Turn Your Words Into Highlighted Text",
    animatedWords: "Highlighted",
    duration: 1500,
    autoPlay: true,
    loop: true,
    headingTag: "h2",
    normalColor: "#FFFFFF",
    highlightedColor: "#32FA57",
}

addPropertyControls(HighlightedTextAnimation, {
    fullText: {
        type: ControlType.String,
        title: "Full Text",
        defaultValue: "Turn Your Words Into Highlighted Text",
    },
    animatedWords: {
        type: ControlType.String,
        title: "Words to Highlight",
        description: "Comma-separated (e.g., 'Highlighted, Text')",
        defaultValue: "Highlighted",
    },
    headingTag: {
        type: ControlType.Enum,
        title: "Heading Tag",
        options: ["h1", "h2", "h3", "h4", "h5", "h6", "p"],
        optionTitles: ["H1", "H2", "H3", "H4", "H5", "H6", "Paragraph"],
        defaultValue: "h2",
    },
    normalFont: {
        type: ControlType.Font,
        title: "Normal Font",
        controls: "extended",
    },
    normalColor: {
        type: ControlType.Color,
        title: "Normal Color",
        defaultValue: "#FFFFFF",
    },
    highlightedFont: {
        type: ControlType.Font,
        title: "Highlighted Font",
        controls: "extended",
    },
    highlightedColor: {
        type: ControlType.Color,
        title: "Highlighted Color",
        defaultValue: "#32FA57",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration (ms)",
        min: 500,
        max: 5000,
        step: 100,
        defaultValue: 1500,
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        defaultValue: true,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
    },
})
