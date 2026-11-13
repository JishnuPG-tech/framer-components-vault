// Text animation that splits words in half, with first half coming from left and second half from right, bouncing when they meet
import { motion, useInView } from "framer-motion"
import { useRef, useMemo, type CSSProperties, useState, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface SplitBounceTextProps {
    leftText: string
    rightText: string
    font: CSSProperties
    textColor: string
    animationDuration: number
    bounceIntensity: number
    startDelay: number
    fullScreenEntry: boolean
    enableStroke: boolean
    strokeWidth: number
    strokeColor: string
    responsiveFontSize: boolean
    fontSizePercent: number
    style?: CSSProperties
}

/**
 * Split Bounce Text Animation
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function SplitBounceText(props: SplitBounceTextProps) {
    const {
        leftText,
        rightText,
        font,
        textColor,
        animationDuration,
        bounceIntensity,
        startDelay,
        fullScreenEntry,
        enableStroke,
        strokeWidth,
        strokeColor,
        responsiveFontSize,
        fontSizePercent,
    } = props

    const containerRef = useRef(null)
    const isInView = useInView(containerRef, { once: true })
    const [viewportWidth, setViewportWidth] = useState(
        typeof window !== "undefined" ? window.innerWidth : 1200
    )

    useEffect(() => {
        if (typeof window === "undefined") return

        const handleResize = () => {
            setViewportWidth(window.innerWidth)
        }

        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    // Always show final rendering in editor
    const showAnimation = RenderTarget.current() === RenderTarget.preview

    const startDistance = fullScreenEntry ? viewportWidth : viewportWidth * 0.15
    const negativeStartDistance = fullScreenEntry ? -viewportWidth : -viewportWidth * 0.15

    const responsiveFontStyles = responsiveFontSize
        ? { fontSize: `${fontSizePercent}vw` }
        : {}

    const strokeStyle = useMemo(() => {
        if (!enableStroke) return {}
        
        // Create multiple text shadows to simulate stroke
        const shadows = []
        const steps = 16 // Number of shadow directions
        for (let i = 0; i < steps; i++) {
            const angle = (i * 2 * Math.PI) / steps
            const x = Math.cos(angle) * strokeWidth
            const y = Math.sin(angle) * strokeWidth
            shadows.push(`${x}px ${y}px 0 ${strokeColor}`)
        }
        
        return {
            textShadow: shadows.join(", "),
        }
    }, [enableStroke, strokeWidth, strokeColor])

    return (
        <div
            ref={containerRef}
            style={{
                ...props.style,
                display: "flex",
                alignItems: "center",
                width: "max-content",
                position: "relative",
                overflow: "visible",
            }}
        >
            {showAnimation ? (
                <>
                    <motion.span
                        initial={{ x: negativeStartDistance, opacity: 0, scale: 1 }}
                        animate={
                            showAnimation
                                ? {
                                      x: [negativeStartDistance, 0],
                                      opacity: 1,
                                      transition: {
                                          x: {
                                              duration: animationDuration,
                                              ease: [0.34, bounceIntensity, 0.64, 1],
                                              delay: startDelay,
                                          },
                                          opacity: {
                                              duration: animationDuration,
                                              ease: [0.34, bounceIntensity, 0.64, 1],
                                              delay: startDelay,
                                          },
                                      },
                                  }
                                : {}
                        }
                        style={{
                            ...font,
                            ...responsiveFontStyles,
                            color: textColor,
                            ...strokeStyle,
                            display: "inline-block",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                        }}
                    >
                        {leftText}
                    </motion.span>
                    <motion.span
                        initial={{ x: startDistance, opacity: 0, scale: 1 }}
                        animate={
                            showAnimation
                                ? {
                                      x: [startDistance, 0],
                                      opacity: 1,
                                      transition: {
                                          x: {
                                              duration: animationDuration,
                                              ease: [0.34, bounceIntensity, 0.64, 1],
                                              delay: startDelay,
                                          },
                                          opacity: {
                                              duration: animationDuration,
                                              ease: [0.34, bounceIntensity, 0.64, 1],
                                              delay: startDelay,
                                          },
                                      },
                                  }
                                : {}
                        }
                        style={{
                            ...font,
                            ...responsiveFontStyles,
                            color: textColor,
                            ...strokeStyle,
                            display: "inline-block",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                        }}
                    >
                        {rightText}
                    </motion.span>
                </>
            ) : (
                <span
                    style={{
                        ...font,
                        ...responsiveFontStyles,
                        color: textColor,
                        ...strokeStyle,
                        display: "inline-block",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                    }}
                >
                    {leftText}{rightText}
                </span>
            )}
        </div>
    )
}

addPropertyControls(SplitBounceText, {
    leftText: {
        type: ControlType.String,
        title: "Left",
        defaultValue: "Heeel",
        displayTextArea: true,
    },
    rightText: {
        type: ControlType.String,
        title: "Right",
        defaultValue: "looo",
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "200px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
    },
    responsiveFontSize: {
        type: ControlType.Boolean,
        title: "Responsive Font",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    fontSizePercent: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 18,
        min: 1,
        max: 30,
        step: 0.5,
        unit: "vw",
        hidden: ({ responsiveFontSize }) => !responsiveFontSize,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    enableStroke: {
        type: ControlType.Boolean,
        title: "Enable Stroke",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 0.5,
        unit: "px",
        hidden: ({ enableStroke }) => !enableStroke,
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Stroke Color",
        defaultValue: "#000000",
        hidden: ({ enableStroke }) => !enableStroke,
    },
    fullScreenEntry: {
        type: ControlType.Boolean,
        title: "Full Screen Entry",
        defaultValue: true,
        enabledTitle: "100vw",
        disabledTitle: "Default",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.8,
        min: 0.1,
        max: 3,
        step: 0.1,
        unit: "s",
    },
    bounceIntensity: {
        type: ControlType.Number,
        title: "Bounce",
        defaultValue: 1.34,
        min: 1,
        max: 2,
        step: 0.01,
    },
    startDelay: {
        type: ControlType.Number,
        title: "Start Delay",
        defaultValue: 0.5,
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
    },
})