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

import { motion, AnimatePresence } from "framer-motion"

interface PreloaderProps {
    logo: {
        src: string
        alt: string
    }
    logoSize: number
    backgroundColor: string
    counterColor: string
    counterFont: any
    duration: number
    exitEffect: "fade" | "slideUp" | "slideDown"
    onComplete?: () => void
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 *
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 900
 */
function SmoothPreloader(props: PreloaderProps) {
    const {
        logo = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Logo",
        },
        logoSize,
        backgroundColor,
        counterColor,
        counterFont,
        duration,
        exitEffect,
        onComplete,
        style,
    } = props

    const [counter, setCounter] = useState(10)
    const [isVisible, setIsVisible] = useState(true)
    const isStatic = useIsStaticRenderer()

    const getExitAnimation = () => {
        switch (exitEffect) {
            case "fade":
                return { opacity: 0 }
            case "slideUp":
                return { y: "-100%" }
            case "slideDown":
                return { y: "100%" }
            default:
                return { opacity: 0 }
        }
    }

    // Counter animation (disabled in static mode)
    useEffect(() => {
        if (isStatic) return

        const increment = 90 / ((duration * 1000) / 50)

        const interval = setInterval(() => {
            startTransition(() => {
                setCounter((prev) => {
                    const next = prev + increment

                    if (next >= 100) {
                        clearInterval(interval)

                        setTimeout(() => {
                            startTransition(() => {
                                setIsVisible(false)
                                onComplete?.()
                            })
                        }, 200)

                        return 100
                    }

                    return next
                })
            })
        }, 50)

        return () => clearInterval(interval)
    }, [duration, onComplete, isStatic])

    // STATIC RENDER (Canvas / Export safe)
    if (isStatic) {
        return (
            <div
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    backgroundColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <img
                    src={logo.src}
                    alt={logo.alt}
                    style={{
                        maxWidth: `${logoSize}px`,
                        maxHeight: `${logoSize}px`,
                        objectFit: "contain",
                    }}
                />

                <div
                    style={{
                        position: "absolute",
                        bottom: "40px",
                        right: "40px",
                        color: counterColor,
                        ...counterFont,
                    }}
                >
                    55%
                </div>
            </div>
        )
    }

    return (
        <div
            style={{
                ...style,
                width: "100%",
                height: "100%",
                position: "relative",
            }}
        >
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        exit={{
                            ...getExitAnimation(),
                            transition: {
                                duration: 0.8,
                                ease: [0.6, 0.01, 0.05, 0.95],
                            },
                        }}
                        style={{
                            position: "fixed", // ✅ KEY FIX
                            inset: 0, // ✅ FULL SCREEN
                            backgroundColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "auto", // ✅ SCROLL LOCAL
                            zIndex: 9999,
                        }}
                    >
                        <motion.img
                            src={logo.src}
                            alt={logo.alt}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                                delay: 0.3,
                                duration: 0.6,
                            }}
                            style={{
                                maxWidth: `${logoSize}px`,
                                maxHeight: `${logoSize}px`,
                                objectFit: "contain",
                            }}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                delay: 0.5,
                                duration: 0.4,
                            }}
                            style={{
                                position: "absolute",
                                bottom: "40px",
                                right: "40px",
                                color: counterColor,
                                ...counterFont,
                            }}
                        >
                            {Math.round(counter)}%
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(SmoothPreloader, {
    logo: {
        type: ControlType.ResponsiveImage,
        title: "Logo",
    },
    logoSize: {
        type: ControlType.Number,
        title: "Logo Size",
        defaultValue: 200,
        min: 50,
        max: 500,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    counterColor: {
        type: ControlType.Color,
        title: "Counter Color",
        defaultValue: "#000000",
    },
    counterFont: {
        type: ControlType.Font,
        title: "Counter Font",
        controls: "extended",
        defaultValue: {
            fontSize: "80px",
            lineHeight: "1em",
            letterSpacing: "-0.02em",
        },
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 3,
        min: 1,
        max: 10,
    },
    exitEffect: {
        type: ControlType.Enum,
        title: "Exit Effect",
        options: ["fade", "slideUp", "slideDown"],
        optionTitles: ["Fade", "Slide Up", "Slide Down"],
        defaultValue: "fade",
    },
    onComplete: {
        type: ControlType.EventHandler,
    },
})

export default SmoothPreloader
