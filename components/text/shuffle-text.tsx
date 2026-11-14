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


/**
 * @framerSupportedLayoutWidth
 * @framerSupportedLayoutHeight
 * @framerDisableUnlink
 */
export default function TextShuffle({
    text,
    duration,
    interval,
    font,
    color,
    HoverColor,
    style,
}) {
    const [displayText, setDisplayText] = React.useState(text)
    const [hovered, setHovered] = React.useState(false)
    const [isAnimating, setIsAnimating] = React.useState(false)

    React.useEffect(() => {
        let letters = text.split("")
        let timeoutIds = []

        if (hovered) {
            setIsAnimating(true)

            // Shuffle animation
            for (let i = 0; i < duration / interval; i++) {
                timeoutIds.push(
                    setTimeout(() => {
                        const shuffled = [...letters].sort(
                            () => 0.5 - Math.random()
                        )
                        setDisplayText(shuffled.join(""))
                    }, i * interval)
                )
            }

            // Return to original at the end
            timeoutIds.push(
                setTimeout(() => {
                    setDisplayText(text)
                    setIsAnimating(false)
                }, duration)
            )
        } else {
            setIsAnimating(false)
            timeoutIds.push(
                setTimeout(() => {
                    setDisplayText(text)
                }, 100)
            )
        }

        return () => timeoutIds.forEach(clearTimeout)
    }, [hovered, text, duration, interval])

    // 🎨 Colore SOLO durante l'animazione
    const currentColor = isAnimating ? HoverColor : color

    return (
        <motion.div
            style={{
                ...style,
                display: "inline-block",
                ...font,
                color: currentColor,
                cursor: "default",
                transition: "color 0.2s ease",
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {displayText}
        </motion.div>
    )
}

addPropertyControls(TextShuffle, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Hover to shuffle",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration (ms)",
        defaultValue: 450,
        min: 100,
        max: 2000,
        step: 50,
    },
    interval: {
        type: ControlType.Number,
        title: "Speed (ms)",
        defaultValue: 50,
        min: 10,
        max: 200,
        step: 10,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: 48,
            letterSpacing: 0,
            textAlign: "left",
            lineHeight: 1.2,
        },
    },
    color: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000",
    },
    HoverColor: {
        type: ControlType.Color,
        title: "Hover Color",
        defaultValue: "#FE5440",
    },
})
