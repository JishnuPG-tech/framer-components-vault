// Preloader component with color screen, logo with stagger text effect, underline animation, and center-split reveal
import { motion, useAnimation } from "framer-motion"
import { useEffect, useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface RevealPreloaderProps {
    logoText: string
    backgroundColor: string
    textColor: string
    underlineColor: string
    underlineThickness: number
    logoFont: CSSProperties
    autoStart: boolean
    blindsEasing: "linear" | "easeIn" | "easeOut" | "easeInOut" | "custom"
    zIndex: number
    onComplete?: () => void
    style?: CSSProperties
}

/**
 * Reveal Preloader component with stagger text animation and center-split reveal
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function RevealPreloader(props: RevealPreloaderProps) {
    const {
        logoText = "COMPANY",
        backgroundColor = "#000000",
        textColor = "#FFFFFF",
        underlineColor = "#FFFFFF",
        underlineThickness = 2,
        logoFont,
        autoStart = true,
        blindsEasing = "easeInOut",
        zIndex = 9999,
        onComplete,
    } = props

    const isStatic = useIsStaticRenderer()
    const [isVisible, setIsVisible] = useState(true)
    const [animationComplete, setAnimationComplete] = useState(false)
    const [shouldRender, setShouldRender] = useState(true)
    const topControls = useAnimation()
    const bottomControls = useAnimation()

    const letters = logoText.split("")
    const letterDelay = 0.075
    const underlineDelay = letters.length * letterDelay + 1
    const fadeOutDelay = underlineDelay + 0.6 + 1
    const blindsDelay = fadeOutDelay + 0.3

    const easingMap = {
        linear: [0, 0, 1, 1] as const,
        easeIn: [0.42, 0, 1, 1] as const,
        easeOut: [0, 0, 0.58, 1] as const,
        easeInOut: [0.42, 0, 0.58, 1] as const,
        custom: [0.76, 0, 0.24, 1] as const,
    }

    useEffect(() => {
        if (!autoStart) return
        if (isStatic) return

        const runAnimation = async () => {
            // Wait for all animations before blinds
            await new Promise((resolve) => setTimeout(resolve, blindsDelay * 1000))

            // Animate blinds opening from center vertically
            await Promise.all([
                topControls.start({
                    y: "-100%",
                    transition: { duration: 0.6, ease: easingMap[blindsEasing] },
                }),
                bottomControls.start({
                    y: "100%",
                    transition: { duration: 0.6, ease: easingMap[blindsEasing] },
                }),
            ])

            startTransition(() => {
                setAnimationComplete(true)
                setIsVisible(false)
                // Completely remove from DOM after a brief delay
                setTimeout(() => setShouldRender(false), 100)
            })
            if (onComplete) onComplete()
        }

        runAnimation()
    }, [autoStart, topControls, bottomControls, onComplete, blindsDelay, blindsEasing, isStatic])

    if (!shouldRender) return null

    // Render static final state for canvas/export
    if (isStatic) {
        return (
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    zIndex,
                    pointerEvents: "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 20,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            color: textColor,
                            ...logoFont,
                        }}
                    >
                        {logoText}
                    </div>
                    <div
                        style={{
                            width: "100%",
                            height: underlineThickness,
                            backgroundColor: underlineColor,
                        }}
                    />
                </div>
            </div>
        )
    }

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex,
                pointerEvents: animationComplete ? "none" : "auto",
            }}
        >
            {/* Top blind */}
            <motion.div
                animate={topControls}
                initial={{ y: 0 }}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "50%",
                    backgroundColor,
                    pointerEvents: animationComplete ? "none" : "auto",
                }}
            />

            {/* Bottom blind */}
            <motion.div
                animate={bottomControls}
                initial={{ y: 0 }}
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    height: "50%",
                    backgroundColor,
                    pointerEvents: animationComplete ? "none" : "auto",
                }}
            />

            {/* Centered logo and underline */}
            <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{
                    delay: fadeOutDelay,
                    duration: 0.3,
                }}
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 20,
                    zIndex: 10000,
                    pointerEvents: animationComplete ? "none" : "auto",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        color: textColor,
                        ...logoFont,
                    }}
                >
                    {letters.map((letter, index) => (
                        <motion.span
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                delay: index * letterDelay,
                                duration: 0.4,
                                ease: [0.25, 0.1, 0.25, 1],
                            }}
                            style={{
                                display: "inline-block",
                            }}
                        >
                            {letter === " " ? "\u00A0" : letter}
                        </motion.span>
                    ))}
                </div>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{
                        delay: underlineDelay,
                        duration: 0.6,
                        ease: [0.76, 0, 0.24, 1],
                    }}
                    style={{
                        height: underlineThickness,
                        backgroundColor: underlineColor,
                    }}
                />
            </motion.div>
        </div>
    )
}

addPropertyControls(RevealPreloader, {
    logoText: {
        type: ControlType.String,
        title: "Logo Text",
        defaultValue: "COMPANY",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    underlineColor: {
        type: ControlType.Color,
        title: "Underline",
        defaultValue: "#FFFFFF",
    },
    underlineThickness: {
        type: ControlType.Number,
        title: "Underline Thickness",
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 0.5,
        unit: "px",
    },
    logoFont: {
        type: ControlType.Font,
        title: "Logo Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "64px",
            variant: "Bold",
            letterSpacing: "0.05em",
            lineHeight: "1em",
        },
    },
    autoStart: {
        type: ControlType.Boolean,
        title: "Auto Start",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    blindsEasing: {
        type: ControlType.Enum,
        title: "Blinds Easing",
        options: ["linear", "easeIn", "easeOut", "easeInOut", "custom"],
        optionTitles: ["Linear", "Ease In", "Ease Out", "Ease In Out", "Custom (Subtle)"],
        defaultValue: "easeInOut",
    },
    zIndex: {
        type: ControlType.Number,
        title: "Z-Index",
        defaultValue: 9999,
        min: 0,
        max: 99999,
        step: 1,
    },
})