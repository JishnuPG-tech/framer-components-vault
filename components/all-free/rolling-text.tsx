// Rolling Text Animation by Robbi Firmansah - Bie Lab

import {
    useState,
    useEffect,
    useRef,
    startTransition,
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

import { motion, useInView } from "framer-motion"

interface RollingTextProps {
    text: string
    duplicateCount: number
    rollDuration: number
    staggerDelay: number
    blurIntensity: number
    autoPlay: boolean
    backgroundColor: string
    textColor: string
    font: any
    animationPattern: "sequential" | "alternating"
    style?: CSSProperties
}

/**
 * Vertical Text Rolling Animation
 *
 * Each character position shows a vertical column of the SAME target letter repeated multiple times, rolling to reveal the final character.
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 120
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function RollingText(props: RollingTextProps) {
    const {
        text = "ROLLING",
        duplicateCount = 8,
        rollDuration = 2,
        staggerDelay = 0.1,
        blurIntensity = 8,
        autoPlay = true,
        backgroundColor = "#000000",
        textColor = "#FFFFFF",
        font,
        animationPattern = "sequential",
    } = props

    const [isAnimating, setIsAnimating] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: true })
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        if (autoPlay && isInView && !isStatic) {
            const timer = setTimeout(() => {
                startTransition(() => setIsAnimating(true))
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [autoPlay, isInView, isStatic])

    const handleReplay = () => {
        startTransition(() => {
            setIsAnimating(false)
            setTimeout(() => {
                startTransition(() => setIsAnimating(true))
            }, 50)
        })
    }

    const characters = text.split("")

    return (
        <div
            ref={containerRef}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                backgroundColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                cursor: "pointer",
                userSelect: "none",
            }}
            onClick={isStatic ? undefined : handleReplay}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.05em",
                    ...font,
                }}
            >
                {characters.map((char, index) => (
                    <CharacterColumn
                        key={`${char}-${index}`}
                        character={char}
                        duplicateCount={duplicateCount}
                        rollDuration={rollDuration}
                        delay={index * staggerDelay}
                        blurIntensity={blurIntensity}
                        isAnimating={isAnimating}
                        textColor={textColor}
                        font={font}
                        isStatic={isStatic}
                        animationPattern={animationPattern}
                        characterIndex={index}
                    />
                ))}
            </div>
        </div>
    )
}

interface CharacterColumnProps {
    character: string
    duplicateCount: number
    rollDuration: number
    delay: number
    blurIntensity: number
    isAnimating: boolean
    textColor: string
    font: any
    isStatic: boolean
    animationPattern: "sequential" | "alternating"
    characterIndex: number
}

function CharacterColumn({
    character,
    duplicateCount,
    rollDuration,
    delay,
    blurIntensity,
    isAnimating,
    textColor,
    font,
    isStatic,
    animationPattern,
    characterIndex,
}: CharacterColumnProps) {
    // Create array of duplicate characters
    const duplicates = Array(duplicateCount).fill(character)

    // Calculate the height needed to show one character
    const lineHeight = parseFloat(font?.lineHeight || "1em")
    const fontSize = parseFloat(font?.fontSize || "60px")
    const characterHeight = fontSize * lineHeight

    // Calculate total scroll distance (all duplicates minus the final visible one)
    const totalScrollDistance = characterHeight * (duplicateCount - 1)

    // Determine animation direction based on pattern and character position
    const isOddPosition = characterIndex % 2 === 0 // 0-indexed, so 0,2,4... are "odd" positions (1st, 3rd, 5th...)
    const shouldRollFromBottom =
        animationPattern === "alternating" && !isOddPosition

    // Set initial and final positions based on direction
    const initialY = shouldRollFromBottom ? -totalScrollDistance : 0
    const finalY = shouldRollFromBottom ? 0 : -totalScrollDistance

    if (isStatic) {
        return (
            <div
                style={{
                    position: "relative",
                    height: `${characterHeight}px`,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <span
                    style={{
                        color: textColor,
                        ...font,
                        lineHeight: font?.lineHeight || "1em",
                    }}
                >
                    {character}
                </span>
            </div>
        )
    }

    return (
        <div
            style={{
                position: "relative",
                height: `${characterHeight}px`,
                overflow: "hidden",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
            }}
        >
            <motion.div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
                initial={{ y: initialY }}
                animate={isAnimating ? { y: finalY } : { y: initialY }}
                transition={{
                    duration: rollDuration,
                    delay: delay,
                    ease: [0.25, 0.46, 0.45, 0.94], // ease-out curve
                    type: "tween",
                }}
            >
                {duplicates.map((char, index) => (
                    <motion.span
                        key={index}
                        style={{
                            color: textColor,
                            height: `${characterHeight}px`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            ...font,
                            lineHeight: font?.lineHeight || "1em",
                        }}
                        initial={{ filter: "blur(0px)" }}
                        animate={
                            isAnimating
                                ? {
                                      filter: [
                                          "blur(0px)",
                                          `blur(${blurIntensity}px)`,
                                          `blur(${blurIntensity}px)`,
                                          "blur(0px)",
                                      ],
                                  }
                                : { filter: "blur(0px)" }
                        }
                        transition={{
                            duration: rollDuration,
                            delay: delay,
                            times: [0, 0.2, 0.8, 1],
                            ease: "easeOut",
                        }}
                    >
                        {char}
                    </motion.span>
                ))}
            </motion.div>
        </div>
    )
}

addPropertyControls(RollingText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "ROLLING",
    },
    animationPattern: {
        type: ControlType.Enum,
        title: "Animation Pattern",
        options: ["sequential", "alternating"],
        optionTitles: ["Sequential", "Alternating"],
        defaultValue: "sequential",
        displaySegmentedControl: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "60px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    duplicateCount: {
        type: ControlType.Number,
        title: "Duplicate Count",
        defaultValue: 8,
        min: 3,
        max: 20,
        step: 1,
    },
    rollDuration: {
        type: ControlType.Number,
        title: "Roll Duration",
        defaultValue: 2,
        min: 0.5,
        max: 5,
        step: 0.1,
        unit: "s",
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger Delay",
        defaultValue: 0.1,
        min: 0,
        max: 0.5,
        step: 0.01,
        unit: "s",
    },
    blurIntensity: {
        type: ControlType.Number,
        title: "Blur Intensity",
        defaultValue: 8,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
})
