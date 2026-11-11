// Glitching text effect with Cyberpunk 2077 aesthetics
import {
    useState,
    useEffect,
    useMemo,
    startTransition,
    type CSSProperties,
} from "react"
import { motion, useAnimation } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface CyberpunkGlitchTextProps {
    text: string
    primaryColor: string
    glitchColor1: string
    glitchColor2: string
    backgroundColor: string
    font: any
    glitchIntensity: number
    glitchSpeed: number
    enableScanlines: boolean
    enableGlow: boolean
    glowIntensity: number
    blurIntensity: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function CyberpunkGlitchText(props: CyberpunkGlitchTextProps) {
    const {
        text = "CYBERPUNK",
        primaryColor = "#00FFFF",
        glitchColor1 = "#FF0080",
        glitchColor2 = "#FFFF00",
        backgroundColor = "#000000",
        font,
        glitchIntensity = 50,
        glitchSpeed = 2,
        enableScanlines = true,
        enableGlow = true,
        glowIntensity = 20,
        blurIntensity = 0.5,
    } = props

    const [isGlitching, setIsGlitching] = useState(false)
    const [glitchText, setGlitchText] = useState(text)
    const isStatic = useIsStaticRenderer()
    const controls = useAnimation()

    const glitchChars = "!@#$%^&*()_+-=[]{}|;:,.<>?~`"
    const interval = 1000 / glitchSpeed

    useEffect(() => {
        if (isStatic) return

        const glitchInterval = setInterval(() => {
            if (Math.random() < glitchIntensity / 100) {
                startTransition(() => setIsGlitching(true))

                // Create glitched text
                const chars = text.split("")
                const glitched = chars
                    .map((char) => {
                        if (Math.random() < 0.3) {
                            return glitchChars[
                                Math.floor(Math.random() * glitchChars.length)
                            ]
                        }
                        return char
                    })
                    .join("")

                startTransition(() => setGlitchText(glitched))

                // Trigger animation
                controls.start({
                    x: [0, -2, 2, -1, 1, 0],
                    y: [0, 1, -1, 0],
                    transition: { duration: 0.1 },
                })

                setTimeout(() => {
                    startTransition(() => {
                        setIsGlitching(false)
                        setGlitchText(text)
                    })
                }, 100)
            }
        }, interval)

        return () => clearInterval(glitchInterval)
    }, [text, glitchIntensity, glitchSpeed, interval, controls, isStatic])

    const textShadow = useMemo(() => {
        if (!enableGlow) return "none"
        return `
            0 0 5px ${primaryColor},
            0 0 ${glowIntensity / 2}px ${primaryColor},
            0 0 ${glowIntensity}px ${primaryColor},
            0 0 ${glowIntensity * 1.5}px ${primaryColor}
        `
    }, [primaryColor, enableGlow, glowIntensity])

    const glitchShadow = useMemo(() => {
        return `
            -2px 0 ${glitchColor1},
            2px 0 ${glitchColor2},
            0 0 5px ${primaryColor}
        `
    }, [glitchColor1, glitchColor2, primaryColor])

    return (
        <div
            style={{
                position: "relative",
                display: "inline-block",
                backgroundColor,
                padding: "20px",
                overflow: "hidden",
                ...props.style,
            }}
        >
            {/* Scanlines overlay */}
            {enableScanlines && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `repeating-linear-gradient(
                            0deg,
                            transparent,
                            transparent 2px,
                            rgba(0, 255, 255, 0.03) 2px,
                            rgba(0, 255, 255, 0.03) 4px
                        )`,
                        pointerEvents: "none",
                        zIndex: 2,
                    }}
                />
            )}

            {/* Main text */}
            <motion.div
                animate={controls}
                style={{
                    position: "relative",
                    zIndex: 1,
                }}
            >
                <span
                    style={{
                        color: primaryColor,
                        textShadow: isGlitching ? glitchShadow : textShadow,
                        fontFamily: font?.fontFamily || "monospace",
                        fontSize: font?.fontSize || "48px",
                        fontWeight: font?.fontWeight || "bold",
                        letterSpacing: font?.letterSpacing || "0.1em",
                        lineHeight: font?.lineHeight || "1.2em",
                        textTransform: "uppercase",
                        userSelect: "none",
                        filter: isGlitching
                            ? `blur(${blurIntensity}px)`
                            : "none",
                        transition: "filter 0.1s ease",
                    }}
                >
                    {isGlitching ? glitchText : text}
                </span>
            </motion.div>

            {/* Glitch layers */}
            {isGlitching && !isStatic && (
                <>
                    <div
                        style={{
                            position: "absolute",
                            top: "20px",
                            left: "18px",
                            color: glitchColor1,
                            fontFamily: font?.fontFamily || "monospace",
                            fontSize: font?.fontSize || "48px",
                            fontWeight: font?.fontWeight || "bold",
                            letterSpacing: font?.letterSpacing || "0.1em",
                            lineHeight: font?.lineHeight || "1.2em",
                            textTransform: "uppercase",
                            opacity: 0.8,
                            zIndex: 0,
                        }}
                    >
                        {glitchText}
                    </div>
                    <div
                        style={{
                            position: "absolute",
                            top: "20px",
                            left: "22px",
                            color: glitchColor2,
                            fontFamily: font?.fontFamily || "monospace",
                            fontSize: font?.fontSize || "48px",
                            fontWeight: font?.fontWeight || "bold",
                            letterSpacing: font?.letterSpacing || "0.1em",
                            lineHeight: font?.lineHeight || "1.2em",
                            textTransform: "uppercase",
                            opacity: 0.6,
                            zIndex: 0,
                        }}
                    >
                        {glitchText}
                    </div>
                </>
            )}
        </div>
    )
}

CyberpunkGlitchText.displayName = "Cyberpunk Text"

addPropertyControls(CyberpunkGlitchText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "CYBERPUNK 2077",
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#00FFFF",
    },
    glitchColor1: {
        type: ControlType.Color,
        title: "Glitch Color 1",
        defaultValue: "#FF0080",
    },
    glitchColor2: {
        type: ControlType.Color,
        title: "Glitch Color 2",
        defaultValue: "#FFFF00",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "48px",
            variant: "Bold",
            letterSpacing: "0.1em",
            lineHeight: "1.2em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    glitchIntensity: {
        type: ControlType.Number,
        title: "Glitch Intensity",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    glitchSpeed: {
        type: ControlType.Number,
        title: "Glitch Speed",
        defaultValue: 2,
        min: 0.5,
        max: 10,
        step: 0.5,
        unit: "Hz",
    },
    enableScanlines: {
        type: ControlType.Boolean,
        title: "Scanlines",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    enableGlow: {
        type: ControlType.Boolean,
        title: "Glow Effect",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Intensity",
        defaultValue: 20,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
        hidden: ({ enableGlow }) => !enableGlow,
    },
})
