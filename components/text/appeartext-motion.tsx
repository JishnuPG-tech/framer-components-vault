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
import { useEffect } from "react"

const EachCharacter = ({
    char,
    duration,
    easing,
    index,
    transitionStartIndex,
    delayStep,
}) => {
    const initialColor = index < transitionStartIndex ? "#212121" : "#212121"

    return (
        <motion.span
            initial={{ color: initialColor, opacity: 0.2 }}
            animate={{
                color: "#212121",
                opacity: 1,
            }}
            transition={{
                duration: duration,
                ease: easing,
                delay: index * delayStep,
            }}
        >
            {char}
        </motion.span>
    )
}

const EachWord = ({
    word,
    duration,
    easing,
    transitionStartIndex,
    currentCharacterIndex,
    delayStep,
}) => {
    const characters = word.split("")
    return (
        <motion.span>
            {characters.map((char, idx) => (
                <EachCharacter
                    key={idx}
                    char={char}
                    duration={duration}
                    easing={easing}
                    index={currentCharacterIndex + idx}
                    transitionStartIndex={transitionStartIndex}
                    delayStep={delayStep}
                />
            ))}
            &nbsp;
        </motion.span>
    )
}

export default function Text_Color_Letters_Appear(props) {
    const {
        text,
        duration,
        easing,
        fontSize,
        lineHeight,
        letterSpacing,
        paragraphAlign,
        transitionStartIndex,
        fontFamily,
        delayStep,
    } = props

    const words = text.split(" ")

    // Load external Google font
    useEffect(() => {
        const style = document.createElement("style")
        style.appendChild(
            document.createTextNode(`
                @import url('https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, "+")}:wght@400&display=swap');
            `)
        )
        document.head.appendChild(style)

        return () => {
            document.head.removeChild(style)
        }
    }, [fontFamily])

    let currentCharacterIndex = 0

    return (
        <p
            style={{
                fontFamily: `${fontFamily}, sans-serif`,
                fontSize: `${fontSize}px`,
                color: "#666666",
                display: "flex",
                flexWrap: "wrap",
                lineHeight: `${lineHeight}px`,
                fontWeight: 500,
                letterSpacing: `${letterSpacing}px`,
                justifyContent: paragraphAlign,
                margin: 0,
            }}
        >
            {words.map((word, idx) => {
                const startIdx = currentCharacterIndex
                currentCharacterIndex += word.length + 1
                return (
                    <EachWord
                        key={idx}
                        word={word}
                        duration={duration}
                        easing={easing}
                        transitionStartIndex={transitionStartIndex}
                        currentCharacterIndex={startIdx}
                        delayStep={delayStep}
                    />
                )
            })}
        </p>
    )
}

addPropertyControls(Text_Color_Letters_Appear, {
    text: {
        title: "Text",
        type: ControlType.String,
        defaultValue: "Hello Text",
    },
    fontFamily: {
        title: "Font Family",
        type: ControlType.String,
        defaultValue: "Urbanist",
    },
    fontSize: {
        title: "Font Size",
        type: ControlType.Number,
        defaultValue: 48,
        min: 10,
        max: 300,
    },
    lineHeight: {
        title: "Line Height",
        type: ControlType.Number,
        defaultValue: 60,
        min: 10,
        max: 100,
    },
    letterSpacing: {
        title: "Letter Spacing",
        type: ControlType.Number,
        defaultValue: -3,
        min: -10,
        max: 10,
    },
    paragraphAlign: {
        title: "Paragraph Align",
        type: ControlType.Enum,
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "Left",
    },
    duration: {
        title: "Duration",
        type: ControlType.Number,
        defaultValue: 0.3,
        min: 0.1,
        max: 3,
        step: 0.1,
    },
    easing: {
        title: "Easing",
        type: ControlType.Enum,
        options: ["easeInOut", "easeIn", "easeOut", "linear"],
        optionTitles: ["Ease In Out", "Ease In", "Ease Out", "Linear"],
        defaultValue: "easeInOut",
    },
    transitionStartIndex: {
        title: "Start Index",
        type: ControlType.Number,
        defaultValue: 0,
        min: 0,
        max: 1000,
    },
    delayStep: {
        title: "Delay Step",
        type: ControlType.Number,
        defaultValue: 0.02,
        min: 0.001,
        max: 0.2,
        step: 0.005,
    },
})
