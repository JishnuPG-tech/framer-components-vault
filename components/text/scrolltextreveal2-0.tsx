// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef, useMemo } from "react"

/**
 * Scroll Text Reveal
 * 
 * A scroll-triggered text animation component that reveals text character by character
 * as the user scrolls. Perfect for storytelling, hero sections, and dramatic reveals.
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 200
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */

interface ScrollTextRevealProps {
    text: string
    startColor: string
    endColor: string
    font: any
    duration: number
    easing: string
    transitionStartIndex: number
    staggerDelay: number
    offsetStart: number
    offsetEnd: number
}

const EachCharacter = ({
    char,
    start,
    end,
    progress,
    startColor,
    endColor,
    index,
    transitionStartIndex,
}: {
    char: string
    start: number
    end: number
    progress: any
    startColor: string
    endColor: string
    index: number
    transitionStartIndex: number
}) => {
    const colorProgress = useTransform(progress, [start, end], [startColor, endColor])
    
    const isPreRevealed = index < transitionStartIndex
    
    return (
        <motion.span
            style={{
                color: isPreRevealed ? endColor : colorProgress,
                display: "inline-block",
            }}
        >
            {char}
        </motion.span>
    )
}

const EachWord = ({
    word,
    progress,
    starting,
    ending,
    startColor,
    endColor,
    transitionStartIndex,
    currentCharacterIndex,
}: {
    word: string
    progress: any
    starting: number
    ending: number
    startColor: string
    endColor: string
    transitionStartIndex: number
    currentCharacterIndex: number
}) => {
    const characters = word.split("")
    const wordLength = characters.length
    const amount = ending - starting
    const step = amount / wordLength

    return (
        <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
            {characters.map((char, idx) => {
                const charStart = starting + step * idx
                const charEnd = starting + step * (idx + 1)
                return (
                    <EachCharacter
                        key={idx}
                        char={char}
                        start={charStart}
                        end={charEnd}
                        progress={progress}
                        startColor={startColor}
                        endColor={endColor}
                        index={currentCharacterIndex + idx}
                        transitionStartIndex={transitionStartIndex}
                    />
                )
            })}
        </span>
    )
}

export default function ScrollTextReveal(props: ScrollTextRevealProps) {
    const {
        text = "Scroll to reveal this text word by word with a smooth color transition effect",
        startColor = "#666666",
        endColor = "#FFFFFF",
        font,
        easing = "easeInOut",
        transitionStartIndex = 0,
        offsetStart = 0.8,
        offsetEnd = 0.2,
    } = props

    const words = useMemo(() => text.split(" "), [text])
    const totalWords = words.length
    const ref = useRef<HTMLParagraphElement>(null)

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: [`start ${offsetStart}`, `start ${offsetEnd}`],
    })

    // Font style extraction
    const fontStyles = useMemo(() => {
        if (!font) {
            return {
                fontSize: "48px",
                fontWeight: 400,
                fontStyle: "normal",
                lineHeight: "1.2em",
                letterSpacing: "-0.02em",
                textAlign: "center" as const,
                fontFamily: "system-ui, -apple-system, sans-serif",
            }
        }
        return {
            fontSize: font.fontSize || "48px",
            fontWeight: font.fontWeight || 400,
            fontStyle: font.fontStyle || "normal",
            lineHeight: font.lineHeight || "1.2em",
            letterSpacing: font.letterSpacing || "-0.02em",
            textAlign: font.textAlign || "center",
            fontFamily: font.fontFamily || "system-ui, -apple-system, sans-serif",
        }
    }, [font])

    let currentCharacterIndex = 0

    return (
        <p
            ref={ref}
            style={{
                fontFamily: fontStyles.fontFamily,
                fontSize: fontStyles.fontSize,
                fontWeight: fontStyles.fontWeight,
                fontStyle: fontStyles.fontStyle,
                lineHeight: fontStyles.lineHeight,
                letterSpacing: fontStyles.letterSpacing,
                textAlign: fontStyles.textAlign,
                color: startColor,
                display: "flex",
                flexWrap: "wrap",
                justifyContent: fontStyles.textAlign === "left" 
                    ? "flex-start" 
                    : fontStyles.textAlign === "right" 
                        ? "flex-end" 
                        : "center",
                margin: 0,
                padding: "20px 0",
                gap: "0.25em",
                position: "relative",
                width: "100%",
            }}
        >
            {words.map((word, idx) => {
                const starting = idx / totalWords
                const ending = (idx + 1) / totalWords
                const wordLength = word.length
                const startIdx = currentCharacterIndex
                currentCharacterIndex += wordLength + 1

                return (
                    <EachWord
                        key={idx}
                        word={word}
                        progress={scrollYProgress}
                        starting={starting}
                        ending={ending}
                        startColor={startColor}
                        endColor={endColor}
                        transitionStartIndex={transitionStartIndex}
                        currentCharacterIndex={startIdx}
                    />
                )
            })}
        </p>
    )
}

addPropertyControls(ScrollTextReveal, {
    text: {
        title: "Text",
        type: ControlType.String,
        defaultValue: "Scroll to reveal this text word by word with a smooth color transition effect",
        displayTextArea: true,
    },
    font: {
        title: "Typography",
        type: ControlType.Font,
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "48px",
            variant: "Regular",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
            textAlign: "center",
        },
    },
    startColor: {
        title: "Start Color",
        type: ControlType.Color,
        defaultValue: "#666666",
    },
    endColor: {
        title: "End Color",
        type: ControlType.Color,
        defaultValue: "#FFFFFF",
    },
    transitionStartIndex: {
        title: "Pre-reveal Chars",
        description: "Number of characters to show in end color immediately",
        type: ControlType.Number,
        defaultValue: 0,
        min: 0,
        max: 500,
        step: 1,
    },
    easing: {
        title: "Easing",
        type: ControlType.Enum,
        options: ["easeInOut", "easeIn", "easeOut", "linear", "circOut", "backOut", "anticipate"],
        optionTitles: ["Ease In Out", "Ease In", "Ease Out", "Linear", "Circ Out", "Back Out", "Anticipate"],
        defaultValue: "easeInOut",
    },
    offsetStart: {
        title: "Scroll Start",
        description: "When animation starts (0 = top of viewport)",
        type: ControlType.Number,
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.05,
    },
    offsetEnd: {
        title: "Scroll End",
        description: "When animation completes (0 = top of viewport)",
        type: ControlType.Number,
        defaultValue: 0.2,
        min: 0,
        max: 1,
        step: 0.05,
    },
})