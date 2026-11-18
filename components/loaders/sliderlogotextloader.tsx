// TextLoader component with Text or Image reveal animation
import { useState, useEffect, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

interface TextLoaderProps {
    text: string
    duration: number
    textColor: string
    font: any
    autoStart: boolean
    showOnComplete: boolean
    delayAfterComplete: number
    useImage: boolean
    image: string
    imageWidth: number
    imageHeight: number
}

/**
 *
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function TextLoader(props: TextLoaderProps) {
    const {
        text = "Zafron",
        duration = 1,
        textColor = "#FFFFFF",
        font,
        autoStart = true,
        showOnComplete = false,
        delayAfterComplete = 2,
        useImage = false,
        image = "",
        imageWidth = 120,
        imageHeight = 60,
    } = props

    const [progress, setProgress] = useState(0)
    const [isComplete, setIsComplete] = useState(false)
    const [shouldHide, setShouldHide] = useState(false)
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        if (isStatic || !autoStart) {
            startTransition(() => setProgress(50))
            return
        }

        const interval = setInterval(() => {
            startTransition(() => {
                setProgress((prev) => {
                    const newProgress = prev + 100 / (duration * 60)
                    if (newProgress >= 100) {
                        setIsComplete(true)
                        clearInterval(interval)

                        // Set timeout to hide after delay
                        setTimeout(() => {
                            startTransition(() => setShouldHide(true))
                        }, delayAfterComplete * 1000)

                        return 100
                    }
                    return newProgress
                })
            })
        }, 1000 / 60)

        return () => clearInterval(interval)
    }, [duration, autoStart, isStatic, delayAfterComplete])

    if (shouldHide && !showOnComplete && !isStatic) {
        return null
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
            }}
        >
            {useImage && image ? (
                // Image Reveal
                <motion.img
                    src={image}
                    alt="Loader Logo"
                    style={{
                        width: imageWidth,
                        height: imageHeight,
                        objectFit: "contain",
                        clipPath: `inset(0 ${100 - progress}% 0 0)`,
                    }}
                    animate={{
                        clipPath: `inset(0 ${100 - progress}% 0 0)`,
                    }}
                    transition={{
                        duration: 0.1,
                        ease: "easeOut",
                    }}
                />
            ) : (
                // Text Reveal
                <div
                    style={{
                        position: "relative",
                        ...font,
                        color: textColor,
                    }}
                >
                    {/* Background shadow text */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            color: "rgba(96, 63, 46, 0.16)",
                            zIndex: 1,
                        }}
                    >
                        {text}
                    </div>

                    <motion.div
                        style={{
                            position: "relative",
                            zIndex: 2,
                            clipPath: `inset(0 ${100 - progress}% 0 0)`,
                            color: textColor,
                        }}
                        animate={{
                            clipPath: `inset(0 ${100 - progress}% 0 0)`,
                        }}
                        transition={{
                            duration: 0.1,
                            ease: "easeOut",
                        }}
                    >
                        {text}
                    </motion.div>
                </div>
            )}
        </div>
    )
}

// Control panel
addPropertyControls(TextLoader, {
    useImage: {
        type: ControlType.Boolean,
        title: "Use Image",
        defaultValue: false,
        enabledTitle: "Image",
        disabledTitle: "Text",
    },
    image: {
        type: ControlType.Image,
        title: "Logo/Image",
        hidden: ({ useImage }) => !useImage,
    },
    imageWidth: {
        type: ControlType.Number,
        title: "Image Width",
        defaultValue: 120,
        min: 20,
        max: 1000,
        step: 1,
        unit: "px",
        hidden: ({ useImage }) => !useImage,
    },
    imageHeight: {
        type: ControlType.Number,
        title: "Image Height",
        defaultValue: 60,
        min: 20,
        max: 1000,
        step: 1,
        unit: "px",
        hidden: ({ useImage }) => !useImage,
    },
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "BRAND NAME",
        hidden: ({ useImage }) => useImage,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1,
        min: 0.1,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#603F2E",
        hidden: ({ useImage }) => useImage,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "48px",
            variant: "Bold",
            letterSpacing: "0.1em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        hidden: ({ useImage }) => useImage,
    },
    autoStart: {
        type: ControlType.Boolean,
        title: "Auto Start",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showOnComplete: {
        type: ControlType.Boolean,
        title: "Show When Complete",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    delayAfterComplete: {
        type: ControlType.Number,
        title: "Delay After Complete",
        defaultValue: 2,
        min: 0,
        max: 10,
        step: 0.5,
        unit: "s",
        hidden: ({ showOnComplete }) => showOnComplete,
    },
})
