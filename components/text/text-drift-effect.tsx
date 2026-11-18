// Piece by Piece text animation with exploding and reforming letters
import { motion, useAnimation } from "framer-motion"
import { useEffect, useState, useMemo, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface TextExplosionProps {
    text: string
    font: CSSProperties
    textColor: string
    animationDuration: number
    staggerDelay: number
    explosionRadius: number
    blurAmount: number
    enableBlur: boolean
    loop: boolean
    enableHover: boolean
    enableClick: boolean
    style?: CSSProperties
}

/**
 * Piece by Piece Text Animation
 * 
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TextExplosion(props: TextExplosionProps) {
    const {
        text = "EXPLODE",
        font,
        textColor,
        animationDuration,
        staggerDelay,
        explosionRadius,
        loop,
        enableHover,
        enableClick,
        style
    } = props

    const [isExploded, setIsExploded] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const [isClicked, setIsClicked] = useState(false)
    const controls = useAnimation()
    const isStatic = useIsStaticRenderer()

    // Check if component is in responsive mode
    const isResponsive = style?.width === "100%" || style?.height === "100%"

    // Generate random positions for each letter
    const letterPositions = useMemo(() => {
        return text.split('').map(() => ({
            x: (Math.random() - 0.5) * explosionRadius * 2,
            y: (Math.random() - 0.5) * explosionRadius * 2,
            rotate: (Math.random() - 0.5) * 360
        }))
    }, [text, explosionRadius])

    const containerVariants = {
        exploded: {
            transition: {
                staggerChildren: staggerDelay,
                delayChildren: 0
            }
        },
        reformed: {
            transition: {
                staggerChildren: staggerDelay,
                delayChildren: 0
            }
        }
    }

    const letterVariants = {
        exploded: (i: number) => ({
            x: letterPositions[i]?.x || 0,
            y: letterPositions[i]?.y || 0,
            rotate: letterPositions[i]?.rotate || 0,
            opacity: 0.3,
            scale: 0.8,
            transition: {
                duration: animationDuration,
                ease: "easeOut"
            }
        }),
        reformed: {
            x: 0,
            y: 0,
            rotate: 0,
            opacity: 1,
            scale: 1,
            transition: {
                duration: animationDuration,
                ease: "easeInOut"
            }
        }
    }

    useEffect(() => {
        if (isStatic) return

        // If hover or click interactions are enabled, don't auto-animate
        if (enableHover || enableClick) {
            // Trigger explosion based on hover or click state
            if (isHovered || isClicked) {
                setIsExploded(true)
                controls.start("exploded")
            } else {
                setIsExploded(false)
                controls.start("reformed")
            }
            return
        }

        // Original loop animation logic
        const animateSequence = async () => {
            // Start with reformed state
            await controls.start("reformed")
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // Explode
            setIsExploded(true)
            await controls.start("exploded")
            await new Promise(resolve => setTimeout(resolve, 800))
            
            // Reform
            setIsExploded(false)
            await controls.start("reformed")
            await new Promise(resolve => setTimeout(resolve, 1200))
        }

        const runAnimation = () => {
            animateSequence().then(() => {
                // Continue the loop only if loop is enabled
                if (loop) {
                    setTimeout(runAnimation, 100)
                }
            })
        }

        runAnimation()
    }, [controls, animationDuration, isStatic, loop, enableHover, enableClick, isHovered, isClicked])

    if (isStatic) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: isResponsive ? "100%" : "max-content",
                    height: isResponsive ? "100%" : "auto",
                    ...style,
                    ...font,
                    color: textColor,
                    letterSpacing: "0.1em"
                }}
            >
                {text.split('').map((letter, index) => (
                    <span
                        key={index}
                        style={{
                            display: "inline-block",
                            marginRight: letter === ' ' ? '0.5em' : '0.05em'
                        }}
                    >
                        {letter === ' ' ? '\u00A0' : letter}
                    </span>
                ))}
            </div>
        )
    }

    return (
        <motion.div
            variants={containerVariants}
            animate={controls}
            initial="reformed"
            onMouseEnter={() => enableHover && setIsHovered(true)}
            onMouseLeave={() => enableHover && setIsHovered(false)}
            onClick={() => {
                if (enableClick) {
                    setIsClicked(!isClicked)
                }
            }}
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: isResponsive ? "100%" : "max-content",
                height: isResponsive ? "100%" : "auto",
                cursor: (enableHover || enableClick) ? "pointer" : "default",
                ...style,
                ...font,
                color: textColor,
                letterSpacing: "0.1em"
            }}
        >
            {text.split('').map((letter, index) => (
                <motion.span
                    key={index}
                    custom={index}
                    variants={letterVariants}
                    style={{
                        display: "inline-block",
                        marginRight: letter === ' ' ? '0.5em' : '0.05em',
                        transformOrigin: "center"
                    }}
                >
                    {letter === ' ' ? '\u00A0' : letter}
                </motion.span>
            ))}
        </motion.div>
    )
}

addPropertyControls(TextExplosion, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "EXPLODE"
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "48px",
            variant: "Bold",
            letterSpacing: "0.1em",
            lineHeight: "1em"
        },
        controls: "extended",
        defaultFontType: "sans-serif"
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000"
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop Animation",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off"
    },
    enableHover: {
        type: ControlType.Boolean,
        title: "Hover Interaction",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off"
    },
    enableClick: {
        type: ControlType.Boolean,
        title: "Click Interaction",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off"
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 0.8,
        min: 0.2,
        max: 3,
        step: 0.1,
        unit: "s"
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger Delay",
        defaultValue: 0.05,
        min: 0,
        max: 0.2,
        step: 0.01,
        unit: "s"
    },
    explosionRadius: {
        type: ControlType.Number,
        title: "Explosion Radius",
        defaultValue: 100,
        min: 50,
        max: 300,
        step: 10,
        unit: "px"
    }
})