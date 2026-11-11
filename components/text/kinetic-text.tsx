// Kinetic Typography Breaker - Text that fragments into letters/words and rearranges itself on scroll or hover
import React, {
    useState,
    useEffect,
    useRef,
    useMemo,
    startTransition,
} from "react"
import { motion, useInView, useAnimation } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface KineticTypographyProps {
    text: string
    animationType: "explode-and-reform" | "wave" | "scramble"
    trigger: "scroll" | "hover" | "load"
    speed: number
    scatterDistance: number
    textColor: string
    hoverColor: string
    font: any
    fragmentBy: "letters" | "words"
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 60
 */
export default function KineticTypography(props: KineticTypographyProps) {
    const {
        text = "KINETIC TEXT",
        animationType = "explode-and-reform",
        trigger = "hover",
        speed = 1,
        scatterDistance = 100,
        textColor = "#000000",
        hoverColor = "#0099FF",
        font,
        fragmentBy = "letters",
        style,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: false, margin: "-20%" })
    const controls = useAnimation()
    const [isHovered, setIsHovered] = useState(false)
    const [hasLoaded, setHasLoaded] = useState(false)
    const isStatic = useIsStaticRenderer()

    // Fragment text into letters or words
    const fragments = useMemo(() => {
        if (fragmentBy === "words") {
            return text.split(" ").map((word, index) => ({
                content: word,
                index,
                isSpace: false,
            }))
        } else {
            return text.split("").map((char, index) => ({
                content: char,
                index,
                isSpace: char === " ",
            }))
        }
    }, [text, fragmentBy])

    // Determine if animation should be active
    const shouldAnimate = useMemo(() => {
        if (isStatic) return false
        switch (trigger) {
            case "scroll":
                return isInView
            case "hover":
                return isHovered
            case "load":
                return hasLoaded
            default:
                return false
        }
    }, [trigger, isInView, isHovered, hasLoaded, isStatic])

    // Load trigger effect
    useEffect(() => {
        if (trigger === "load") {
            const timer = setTimeout(() => {
                startTransition(() => setHasLoaded(true))
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [trigger])

    // Animation variants for different types
    const getAnimationVariants = (fragmentIndex: number) => {
        const delay = fragmentIndex * (0.1 / speed)
        const randomX = (Math.random() - 0.5) * scatterDistance * 2
        const randomY = (Math.random() - 0.5) * scatterDistance * 2
        const randomRotation = (Math.random() - 0.5) * 360

        switch (animationType) {
            case "explode-and-reform":
                return {
                    initial: {
                        x: 0,
                        y: 0,
                        rotate: 0,
                        opacity: 1,
                        color: textColor,
                    },
                    animate: shouldAnimate
                        ? {
                              x: [0, randomX, 0],
                              y: [0, randomY, 0],
                              rotate: [0, randomRotation, 0],
                              opacity: [1, 0.7, 1],
                              color: [textColor, hoverColor, textColor],
                              transition: {
                                  duration: 2 / speed,
                                  delay,
                                  ease: "easeInOut",
                              },
                          }
                        : {
                              x: 0,
                              y: 0,
                              rotate: 0,
                              opacity: 1,
                              color: textColor,
                          },
                }

            case "wave":
                return {
                    initial: {
                        y: 0,
                        rotate: 0,
                        color: textColor,
                    },
                    animate: shouldAnimate
                        ? {
                              y: [0, -scatterDistance * 0.5, 0],
                              rotate: [0, 10, 0],
                              color: [textColor, hoverColor, textColor],
                              transition: {
                                  duration: 0.6 / speed,
                                  delay,
                                  ease: "easeOut",
                              },
                          }
                        : {
                              y: 0,
                              rotate: 0,
                              color: textColor,
                          },
                }

            case "scramble":
                const scramblePositions = Array.from({ length: 5 }, () => ({
                    x: (Math.random() - 0.5) * scatterDistance,
                    y: (Math.random() - 0.5) * scatterDistance * 0.5,
                    rotate: (Math.random() - 0.5) * 180,
                }))

                return {
                    initial: {
                        x: 0,
                        y: 0,
                        rotate: 0,
                        color: textColor,
                    },
                    animate: shouldAnimate
                        ? {
                              x: [...scramblePositions.map((p) => p.x), 0],
                              y: [...scramblePositions.map((p) => p.y), 0],
                              rotate: [
                                  ...scramblePositions.map((p) => p.rotate),
                                  0,
                              ],
                              color: [
                                  textColor,
                                  hoverColor,
                                  hoverColor,
                                  hoverColor,
                                  textColor,
                              ],
                              transition: {
                                  duration: 3 / speed,
                                  delay,
                                  ease: "easeInOut",
                              },
                          }
                        : {
                              x: 0,
                              y: 0,
                              rotate: 0,
                              color: textColor,
                          },
                }

            default:
                return {
                    initial: { color: textColor },
                    animate: { color: textColor },
                }
        }
    }

    const handleMouseEnter = () => {
        if (trigger === "hover") {
            startTransition(() => setIsHovered(true))
        }
    }

    const handleMouseLeave = () => {
        if (trigger === "hover") {
            startTransition(() => setIsHovered(false))
        }
    }

    return (
        <div
            ref={containerRef}
            style={{
                // Base styles that can be overridden
                position: "relative",
                cursor: trigger === "hover" ? "pointer" : "default",
                // Apply font styles
                ...font,
                // CRITICAL: Spread style prop LAST to allow Framer to control sizing
                // This passes through width, height, flexGrow, flexBasis, etc.
                ...style,
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: fragmentBy === "words" ? "0.25em" : "0",
                    width: "100%",
                    height: "100%",
                }}
            >
                {fragments.map((fragment, index) => {
                    const variants = getAnimationVariants(index)

                    if (fragment.isSpace && fragmentBy === "letters") {
                        return (
                            <span
                                key={index}
                                style={{
                                    width: "0.25em",
                                    display: "inline-block",
                                }}
                            />
                        )
                    }

                    return (
                        <motion.span
                            key={index}
                            variants={variants}
                            initial="initial"
                            animate="animate"
                            style={{
                                display: "inline-block",
                                transformOrigin: "center center",
                                whiteSpace: "pre",
                            }}
                        >
                            {fragment.content}
                        </motion.span>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(KineticTypography, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "KINETIC TEXT",
        displayTextArea: true,
    },
    fragmentBy: {
        type: ControlType.Enum,
        title: "Fragment By",
        options: ["letters", "words"],
        optionTitles: ["Letters", "Words"],
        defaultValue: "letters",
        displaySegmentedControl: true,
    },
    animationType: {
        type: ControlType.Enum,
        title: "Animation Type",
        options: ["explode-and-reform", "wave", "scramble"],
        optionTitles: ["Explode & Reform", "Wave", "Scramble"],
        defaultValue: "explode-and-reform",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["scroll", "hover"],
        optionTitles: ["Scroll", "Hover"],
        defaultValue: "hover",
        displaySegmentedControl: true,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
    },
    scatterDistance: {
        type: ControlType.Number,
        title: "Scatter Distance",
        defaultValue: 100,
        min: 20,
        max: 300,
        step: 10,
        unit: "px",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    hoverColor: {
        type: ControlType.Color,
        title: "Animation Color",
        defaultValue: "#0099FF",
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
})

KineticTypography.displayName = "Kinetic Text"
