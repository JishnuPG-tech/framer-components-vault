// Text scrambler effect on hover where each character animates to reveal a customizable word
import { useState, useEffect, useRef, useCallback, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface TextScramblerProps {
    text: string
    scrambleText: string
    font: any
    textColor: string
    scrambleSpeed: number
    triggerType: "hover" | "click"
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function ScramblerOnHoverAndClick(props: TextScramblerProps) {
    const {
        text = "Hover me",
        scrambleText = "SCRAMBLED",
        font,
        textColor,
        scrambleSpeed = 50,
        triggerType = "hover",
    } = props

    const [displayText, setDisplayText] = useState(text)
    const [isAnimating, setIsAnimating] = useState(false)
    const intervalRef = useRef<number | null>(null)
    const timeoutRef = useRef<number | null>(null)
    const isStatic = useIsStaticRenderer()

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"

    const scrambleToTarget = useCallback((targetText: string) => {
        if (isStatic) return

        const maxLength = Math.max(displayText.length, targetText.length)
        let iteration = 0

        if (intervalRef.current) {
            clearInterval(intervalRef.current)
        }

        startTransition(() => setIsAnimating(true))

        intervalRef.current = window.setInterval(() => {
            const newText = targetText
                .split("")
                .map((char, index) => {
                    if (index < iteration) {
                        return char
                    }
                    return characters[Math.floor(Math.random() * characters.length)]
                })
                .join("")

            startTransition(() => setDisplayText(newText))

            if (iteration >= targetText.length) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current)
                    intervalRef.current = null
                }
                startTransition(() => setIsAnimating(false))
            }

            iteration += 1 / 3
        }, scrambleSpeed)
    }, [displayText, scrambleSpeed, characters, isStatic])

    const handleClick = useCallback(() => {
        if (isStatic || isAnimating || triggerType !== "click") return

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        scrambleToTarget(scrambleText)
    }, [scrambleToTarget, scrambleText, isStatic, isAnimating, triggerType])

    const handleMouseEnter = useCallback(() => {
        if (isStatic || isAnimating || triggerType !== "hover") return

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        scrambleToTarget(scrambleText)
    }, [scrambleToTarget, scrambleText, isStatic, isAnimating, triggerType])

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    useEffect(() => {
        startTransition(() => setDisplayText(text))
    }, [text])

    const isFixedWidth = props?.style && props.style.width === "100%"

    return (
        <span
            style={{
                ...props.style,
                ...(isFixedWidth ? {} : { width: "max-content" }),
                color: textColor,
                cursor: "pointer",
                userSelect: "none",
                fontFamily: "monospace",
                ...font,
            }}
            onMouseEnter={triggerType === "hover" ? handleMouseEnter : undefined}
            onClick={triggerType === "click" ? handleClick : undefined}
        >
            {displayText}
        </span>
    )
}

addPropertyControls(ScramblerOnHoverAndClick, {
    text: {
        type: ControlType.String,
        title: "Original Text",
        defaultValue: "Hover me",
    },
    scrambleText: {
        type: ControlType.String,
        title: "Scramble Text",
        defaultValue: "SCRAMBLED",
    },
    triggerType: {
        type: ControlType.Enum,
        title: "Trigger Type",
        options: ["hover", "click"],
        optionTitles: ["Hover", "Click"],
        defaultValue: "hover",
        displaySegmentedControl: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "24px",
            variant: "Bold",
            letterSpacing: "0.05em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    scrambleSpeed: {
        type: ControlType.Number,
        title: "Scramble Speed",
        defaultValue: 50,
        min: 10,
        max: 200,
        step: 10,
        unit: "ms",
    },
})