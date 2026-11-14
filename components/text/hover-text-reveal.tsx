import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface HoverTextRevealProps {
    text1: string
    text2: string
    font: any
    optical: number
    color: string
    scrambledColor: string
    chars: string
    speed: number
    duration: number
    style?: React.CSSProperties
}

/**
 * HoverTextReveal
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerDisableUnlink
 */
function HoverTextReveal(props: HoverTextRevealProps) {
    const {
        text1,
        text2,
        font,
        optical,
        color,
        scrambledColor,
        chars,
        speed,
        duration,
        style,
    } = props

    const [displayText, setDisplayText] = React.useState(text1)
    const [hasAnimated, setHasAnimated] = React.useState(false)
    const [isAnimating, setIsAnimating] = React.useState(false)

    React.useEffect(() => {
        if (!hasAnimated) {
            React.startTransition(() => {
                setDisplayText(text1)
            })
        }
    }, [text1, hasAnimated])

    React.useEffect(() => {
        let timeoutIds: number[] = []

        if (isAnimating && !hasAnimated) {
            const words = text2.split(" ")
            const possibleChars = chars.split("")

            for (let i = 0; i < duration / speed; i++) {
                const timeoutId = window.setTimeout(() => {
                    const glitchedWords = words.map((word) =>
                        word
                            .split("")
                            .map(() => {
                                // ✅ ONLY characters from Char Set
                                return possibleChars[
                                    Math.floor(
                                        Math.random() * possibleChars.length
                                    )
                                ]
                            })
                            .join("")
                    )

                    React.startTransition(() => {
                        setDisplayText(glitchedWords.join(" "))
                    })
                }, i * speed)

                timeoutIds.push(timeoutId)
            }

            const finalTimeout = window.setTimeout(() => {
                React.startTransition(() => {
                    setDisplayText(text2)
                    setIsAnimating(false)
                    setHasAnimated(true)
                })
            }, duration)

            timeoutIds.push(finalTimeout)
        }

        return () => {
            timeoutIds.forEach((id) => window.clearTimeout(id))
        }
    }, [isAnimating, hasAnimated, text2, chars, speed, duration])

    const handleMouseEnter = () => {
        if (!hasAnimated) {
            React.startTransition(() => {
                setIsAnimating(true)
            })
        }
    }

    const currentColor = isAnimating ? scrambledColor : color
    const resolvedFontVariation = `"opsz" ${optical}`

    return (
        <div
            style={{
                ...style,
                display: "block",

                // 🔑 Font (size included) fully managed by Framer
                ...font,

                fontVariationSettings: resolvedFontVariation,
                color: currentColor,
                cursor: "default",

                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
                transform: "translateZ(0)",
                transition: "color 0.2s ease",
            }}
            onMouseEnter={handleMouseEnter}
        >
            {displayText}
        </div>
    )
}

addPropertyControls(HoverTextReveal, {
    text1: {
        type: ControlType.String,
        title: "Text 1",
        defaultValue: "##### ## ######",
    },
    text2: {
        type: ControlType.String,
        title: "Text 2",
        defaultValue: "Hover to Reveal",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: 26,
            lineHeight: 1.2,
            letterSpacing: 0,
            textAlign: "left",
        },
    },
    optical: {
        type: ControlType.Number,
        title: "Optical (opsz)",
        defaultValue: 22,
        min: 8,
        max: 72,
        step: 1,
    },
    color: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    scrambledColor: {
        type: ControlType.Color,
        title: "Hover Color",
        defaultValue: "#2FB7A8",
    },
    chars: {
        type: ControlType.String,
        title: "Chars set",
        defaultValue: "1234567890@*#!?&$£+",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed (ms)",
        defaultValue: 50,
        min: 10,
        max: 200,
        step: 10,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration (ms)",
        defaultValue: 850,
        min: 200,
        max: 5000,
        step: 20,
    },
})

export default HoverTextReveal
