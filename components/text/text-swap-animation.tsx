import * as React from "react"
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

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function ScrambleText(props) {
    const {
        text,
        duration,
        delay,
        trigger,
        font,
        fontSize,
        responsiveFontSize,
        minFontSize,
        maxFontSize,
        color,
        scrambleSpeed,
        characterSet,
        onHoverStart,
        onHoverEnd,
        style,
    } = props

    const [displayText, setDisplayText] = React.useState(text)
    const isAnimating = React.useRef(false)
    const cleanupRef = React.useRef(null)
    const containerRef = React.useRef(null)
    const isInView = useInView(containerRef, { once: true })
    const isStatic = useIsStaticRenderer()

    // Character sets for scrambling
    const chars = React.useMemo(() => {
        switch (characterSet) {
            case "numbers":
                return "0123456789"
            case "alphabet":
                return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
            case "binary":
                return "01"
            case "matrix":
                return "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$+-*/=%"
            case "original":
                return text.replace(/\s/g, "")
            default: // "all"
                return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?"
        }
    }, [characterSet, text])

    const animate = React.useCallback(() => {
        if (isAnimating.current) return

        if (cleanupRef.current) cleanupRef.current()

        isAnimating.current = true
        const startTime = Date.now()
        const totalDuration = duration * 1000
        const delayMs = delay * 1000
        const interval = 1000 / scrambleSpeed
        let lastUpdate = 0
        let frameId

        const tick = () => {
            const now = Date.now()
            const elapsed = now - startTime

            if (elapsed < delayMs) {
                frameId = requestAnimationFrame(tick)
                return
            }

            const progress = Math.min((elapsed - delayMs) / totalDuration, 1)

            if (now - lastUpdate >= interval || progress === 1) {
                lastUpdate = now
                const revealIndex = Math.floor(text.length * progress)

                const scrambled = text
                    .split("")
                    .map((char, index) => {
                        if (char === " " || char === "\n") return char
                        if (index < revealIndex) return text[index]
                        return chars[Math.floor(Math.random() * chars.length)]
                    })
                    .join("")

                setDisplayText(scrambled)
            }

            if (progress < 1) {
                frameId = requestAnimationFrame(tick)
            } else {
                isAnimating.current = false
                setDisplayText(text)
                cleanupRef.current = null
            }
        }

        frameId = requestAnimationFrame(tick)

        cleanupRef.current = () => {
            cancelAnimationFrame(frameId)
            isAnimating.current = false
        }
    }, [text, duration, delay, chars, scrambleSpeed])

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (cleanupRef.current) cleanupRef.current()
        }
    }, [])

    // Handle Triggers
    React.useEffect(() => {
        if (isStatic) return

        if (trigger === "onLoad") {
            animate()
        } else if (trigger === "onInView" && isInView) {
            animate()
        }
    }, [trigger, isInView, animate, isStatic])

    const handleMouseEnter = () => {
        if (trigger === "onHover") {
            animate()
        }
        if (onHoverStart) onHoverStart()
    }

    const handleMouseLeave = () => {
        if (onHoverEnd) onHoverEnd()
    }

    // Reset display text when prop changes
    React.useEffect(() => {
        if (cleanupRef.current) cleanupRef.current()
        setDisplayText(text)
    }, [text])

    // Calculate responsive font size
    const [computedFontSize, setComputedFontSize] = React.useState(fontSize)

    React.useEffect(() => {
        if (!responsiveFontSize) {
            setComputedFontSize(fontSize)
            return
        }

        const handleResize = () => {
            const vw = window.innerWidth
            const vh = window.innerHeight
            const baseSize = Math.min(vw, vh)
            const scaledSize = (baseSize / 100) * (fontSize / 10)

            setComputedFontSize(
                Math.max(minFontSize, Math.min(maxFontSize, scaledSize))
            )
        }

        handleResize()

        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [responsiveFontSize, fontSize, minFontSize, maxFontSize])

    return (
        <motion.div
            ref={containerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                ...style,
                ...font,
                fontSize: computedFontSize,
                color: color,
                display: "inline-block",
                whiteSpace: "nowrap",
                overflowWrap: "break-word",
                overflow: "visible",
            }}
        >
            {displayText}
        </motion.div>
    )
}

addPropertyControls(ScrambleText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Scramble Effect",
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            variant: "Bold",
            fontSize: 18,
        },
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 18,
        min: 1,
        max: 200,
        step: 1,
    },
    responsiveFontSize: {
        type: ControlType.Boolean,
        title: "Responsive Size",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    minFontSize: {
        type: ControlType.Number,
        title: "Min Size",
        defaultValue: 16,
        min: 8,
        max: 100,
        step: 1,
        hidden: ({ responsiveFontSize }) => !responsiveFontSize,
    },
    maxFontSize: {
        type: ControlType.Number,
        title: "Max Size",
        defaultValue: 64,
        min: 20,
        max: 200,
        step: 1,
        hidden: ({ responsiveFontSize }) => !responsiveFontSize,
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["onLoad", "onHover", "onInView"],
        optionTitles: ["On Load", "On Hover", "In View"],
        defaultValue: "onHover",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1.5,
        min: 0.1,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 0,
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
    },
    scrambleSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 30,
        min: 1,
        max: 60,
        step: 1,
        displayStepper: true,
        description: "Updates per second",
    },
    characterSet: {
        type: ControlType.Enum,
        title: "Characters",
        options: ["all", "alphabet", "numbers", "binary", "matrix", "original"],
        optionTitles: [
            "All",
            "Alphabet",
            "Numbers",
            "Binary",
            "Matrix",
            "Original",
        ],
        defaultValue: "Original",
    },
    onHoverStart: {
        type: ControlType.EventHandler,
    },
    onHoverEnd: {
        type: ControlType.EventHandler,
    },
})
