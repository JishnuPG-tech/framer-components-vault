// Animated countdown component with staggered digit animations sliding up from bottom
import React, { useState, useEffect, startTransition, useRef, type CSSProperties } from "react"
import { animate, useInView } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface StaggeredCountdownProps {
    targetNumber: string
    duration: number
    font: any
    color: string
    prefix: string
    suffix: string
    prefixColor: string
    suffixColor: string
    easing: string
    spacing: number
    direction: "up" | "down"
    style?: CSSProperties
}

/**
 * Animated Countdown Number with Staggered Animation
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function StaggeredCountdown(props: StaggeredCountdownProps) {
    const {
        targetNumber = "1234",
        duration = 2,
        font,
        color = "#000000",
        prefix = "",
        suffix = "",
        prefixColor = "#000000",
        suffixColor = "#000000",
        easing = "easeInOut",
        spacing = 0,
        direction = "up",
    } = props

    const isStatic = useIsStaticRenderer()
    const ref = useRef<HTMLDivElement | null>(null)
    const isInView = useInView(ref, { amount: 0.5 })
    const hasAnimated = useRef(false)

    // Ensure targetNumber is treated as a string to avoid type errors
    const targetString = (targetNumber ?? "").toString()
    const targetChars = targetString.split("")
    const digitIndices: number[] = []
    let digitCounter = 0
    for (const ch of targetChars) {
        if (ch >= "0" && ch <= "9") {
            digitIndices.push(digitCounter)
            digitCounter += 1
        } else {
            digitIndices.push(-1)
        }
    }
    const digitCount = digitCounter

    // State to hold current animated values for each digit
    const [animatedDigits, setAnimatedDigits] = useState<number[]>(
        Array(digitCount).fill(0)
    )

    // Start animations when component mounts / enters view
    useEffect(() => {
        // In static or server environments, skip animation and jump to final value
        if (isStatic || typeof window === "undefined") {
            const finalDigits: number[] = Array(digitCount).fill(0)
            targetChars.forEach((ch, charIndex) => {
                const digitIndex = digitIndices[charIndex]
                if (digitIndex === -1) return
                const parsed = parseInt(ch, 10)
                finalDigits[digitIndex] = isNaN(parsed) ? 0 : parsed
            })
            startTransition(() => {
                setAnimatedDigits(finalDigits)
            })
            return
        }

        if (!isInView || hasAnimated.current) return

        hasAnimated.current = true

        // Reset to 0 before animating
        startTransition(() => {
            setAnimatedDigits(Array(digitCount).fill(0))
        })

        const timeouts: number[] = []

        // Animate each digit with stagger
        targetChars.forEach((digitChar, charIndex) => {
            const digitIndex = digitIndices[charIndex]
            if (digitIndex === -1) return

            const targetDigit = parseInt(digitChar, 10)
            const isSingleDigitRolling = digitCount === 1 && targetDigit < 9
            const animateTo = isSingleDigitRolling ? 10 + targetDigit : targetDigit
            const staggerDelay = digitIndex * 0.1 // 100ms stagger
            const digitDuration = duration * 0.8 // Slightly shorter than total duration

            const timeoutId = window.setTimeout(() => {
                animate(0, animateTo, {
                    duration: digitDuration,
                    ease: easing as any,
                    onUpdate: (value) => {
                        startTransition(() => {
                            setAnimatedDigits((prev) => {
                                const newDigits = [...prev]
                                newDigits[digitIndex] = isSingleDigitRolling
                                    ? value
                                    : Math.max(0, Math.min(9, value))
                                return newDigits
                            })
                        })
                    },
                })
            }, staggerDelay * 1000)

            timeouts.push(timeoutId)
        })

        return () => {
            timeouts.forEach((id) => window.clearTimeout(id))
        }
    }, [isStatic, isInView, targetChars.join(""), duration, easing])

    const isFixedWidth = props?.style && props.style.width === "100%"

    return (
        <div
            ref={ref}
            style={{
                ...props.style,
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "visible",
                ...(isFixedWidth ? {} : { width: "max-content" }),
                ...font,
                color,
            }}
        >
            {prefix && (
                <span style={{ ...font, color: prefixColor }}>{prefix}</span>
            )}

            <div
                style={{
                    position: "relative",
                    overflow: "hidden",
                    height: "1.2em",
                    display: "inline-flex",
                    alignItems: "center",
                    minWidth: "max-content",
                    gap: `${spacing}px`,
                    ...font,
                }}
            >
                {targetChars.map((ch, charIndex) => {
                    const digitIndex = digitIndices[charIndex]

                    if (digitIndex === -1) {
                        return (
                            <span
                                key={charIndex}
                                style={{
                                    ...font,
                                    color,
                                    display: "inline-block",
                                    lineHeight: 1,
                                    textAlign: "center",
                                    minWidth: "0.3em",
                                }}
                            >
                                {ch}
                            </span>
                        )
                    }

                    const animatedValue = animatedDigits[digitIndex] ?? 0
                    const currentDigit = Math.floor(animatedValue) % 10
                    const progress = animatedValue - Math.floor(animatedValue)
                    const nextDigit = (currentDigit + 1) % 10

                    return (
                        <div
                            key={charIndex}
                            style={{
                                position: "relative",
                                overflow: "hidden",
                                height: "1.2em",
                                display: "inline-flex",
                                alignItems: "center",
                                minWidth: "0.6em",
                                justifyContent: "center",
                                ...font,
                            }}
                        >
                            {/* Current digit */}
                            <div
                                style={{
                                    ...font,
                                    color,
                                    fontVariantNumeric: "tabular-nums",
                                    display: "inline-block",
                                    lineHeight: 1,
                                    textAlign: "center",
                                    width: "100%",
                                    position: "absolute",
                                    transform:
                                        direction === "up"
                                            ? `translateY(${progress * -100}%)`
                                            : `translateY(${progress * 100}%)`,
                                }}
                            >
                                {currentDigit}
                            </div>

                            {/* Next digit (sliding up or down) */}
                            {progress > 0 && nextDigit <= 9 && (
                                <div
                                    style={{
                                        ...font,
                                        color,
                                        fontVariantNumeric: "tabular-nums",
                                        display: "inline-block",
                                        lineHeight: 1,
                                        textAlign: "center",
                                        width: "100%",
                                        position: "absolute",
                                        transform:
                                            direction === "up"
                                                ? `translateY(${(1 - progress) * 100}%)`
                                                : `translateY(${(1 - progress) * -100}%)`,
                                    }}
                                >
                                    {nextDigit}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {suffix && (
                <span style={{ ...font, color: suffixColor }}>{suffix}</span>
            )}
        </div>
    )
}

addPropertyControls(StaggeredCountdown, {
    targetNumber: {
        type: ControlType.String,
        title: "Target Number",
        defaultValue: "1234",
        placeholder: "e.g. 99.9",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 2,
        min: 0.5,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    prefix: {
        type: ControlType.String,
        title: "Prefix",
        defaultValue: "",
        placeholder: "$, #, etc.",
    },
    prefixColor: {
        type: ControlType.Color,
        title: "Prefix Color",
        defaultValue: "#000000",
    },
    suffix: {
        type: ControlType.String,
        title: "Suffix",
        defaultValue: "",
        placeholder: "%, +, etc.",
    },
    suffixColor: {
        type: ControlType.Color,
        title: "Suffix Color",
        defaultValue: "#000000",
    },
    color: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        defaultValue: "easeInOut",
        options: [
            "linear",
            "easeIn",
            "easeOut",
            "easeInOut",
            "circIn",
            "circOut",
            "circInOut",
            "backIn",
            "backOut",
            "backInOut",
        ],
        optionTitles: [
            "Linear",
            "Ease In",
            "Ease Out",
            "Ease In Out",
            "Circ In",
            "Circ Out",
            "Circ In Out",
            "Back In",
            "Back Out",
            "Back In Out",
        ],
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 0,
        min: 0,
        max: 20,
        step: 0.1,
        unit: "px",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "48px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        defaultValue: "up",
        options: ["up", "down"],
        optionTitles: ["Up", "Down"],
        displaySegmentedControl: true,
    },
})