// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    motion,
    useMotionTemplate,
    useMotionValue,
    useSpring,
    useTime,
    useTransform,
    useInView,
} from "framer-motion"
import React, { useEffect, useRef, useState, startTransition } from "react"

/**
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 100
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ChromeReflectText(props) {
    const {
        text,
        font,
        colorTone,
        animationType,
        highlightSpeed,
        reflectStrength,
        shadowDepth,
        baseColor,
        textAlign,
    } = props

    const containerRef = useRef(null)
    const isStatic = useIsStaticRenderer()
    const isInView = useInView(containerRef, { once: false, amount: 0.1 })

    const mouseX = useMotionValue(0.5)
    const mouseY = useMotionValue(0.5)

    const smoothMouseX = useSpring(mouseX, {
        damping: 20,
        stiffness: 200,
        mass: 0.5,
    })
    const smoothMouseY = useSpring(mouseY, {
        damping: 20,
        stiffness: 200,
        mass: 0.5,
    })

    const time = useTime()

    const loopX = useTransform(time, (t) => {
        if (!isInView || animationType !== "loop") return 0.5
        return (Math.sin(t * 0.001 * highlightSpeed) + 1) / 2
    })
    const loopY = useTransform(time, (t) => {
        if (!isInView || animationType !== "loop") return 0.5
        return (Math.cos(t * 0.0013 * highlightSpeed) + 1) / 2
    })

    const activeX = animationType === "mouse" ? smoothMouseX : loopX
    const activeY = animationType === "mouse" ? smoothMouseY : loopY

    const handleMouseMove = (e) => {
        if (!containerRef.current || !isInView) return
        const rect = containerRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width
        const y = (e.clientY - rect.top) / rect.height
        mouseX.set(x)
        mouseY.set(y)
    }

    const getGradients = () => {
        switch (colorTone) {
            case "gold":
                return {
                    base: "linear-gradient(180deg, #BF953F 0%, #FCF6BA 25%, #B38728 50%, #FBF5B7 75%, #AA771C 100%)",
                    highlight:
                        "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.9) 0%, rgba(255,236,179,0.4) 25%, rgba(191,149,63,0) 70%)",
                }

            case "custom":
                const color = baseColor

                return {
                    base: `linear-gradient(180deg, 
                        color-mix(in srgb, ${color}, black 40%) 0%, 
                        ${color} 25%, 
                        white 50%, 
                        ${color} 75%, 
                        color-mix(in srgb, ${color}, black 40%) 100%)`,
                    highlight:
                        "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.4) 30%, rgba(255,255,255,0) 70%)",
                }
            case "silver":
            default:
                return {
                    base: "linear-gradient(180deg, #A0A0A0 0%, #FFFFFF 25%, #808080 50%, #E0E0E0 75%, #909090 100%)",
                    highlight:
                        "radial-gradient(circle at 50% 50%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.5) 25%, rgba(128,128,128,0) 70%)",
                }
        }
    }

    const gradients = getGradients()

    const highlightX = useTransform(activeX, [0, 1], ["0%", "100%"])
    const highlightY = useTransform(activeY, [0, 1], ["0%", "100%"])
    const highlightPos = useMotionTemplate`${highlightX} ${highlightY}`

    const shadowX = useTransform(activeX, [0, 1], [shadowDepth, -shadowDepth])
    const shadowY = useTransform(activeY, [0, 1], [shadowDepth, -shadowDepth])

    const shouldRenderStatic = isStatic

    if (shouldRenderStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "visible",
                    backgroundColor: "transparent",
                }}
            >
                <div style={{ position: "relative", width: "100%" }}>
                    <span
                        key={`${colorTone}-${baseColor}`}
                        style={{
                            ...font,
                            display: "block",
                            background: gradients.base,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            color: "transparent",
                            position: "relative",
                            zIndex: 1,
                            filter: `drop-shadow(0px ${shadowDepth}px ${
                                shadowDepth * 2
                            }px rgba(0,0,0,0.6))`,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            textAlign: textAlign,
                        }}
                    >
                        {text}
                    </span>
                </div>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "visible",
                cursor: animationType === "mouse" ? "default" : "auto",
                backgroundColor: "transparent",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: "100%",
                }}
            >
                <motion.span
                    key={`base-${colorTone}-${baseColor}`}
                    style={{
                        ...font,
                        display: "block",
                        background: gradients.base,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        color: "transparent",
                        position: "relative",
                        zIndex: 1,
                        filter: `drop-shadow(0px ${shadowDepth}px ${
                            shadowDepth * 2
                        }px rgba(0,0,0,0.6))`,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        textAlign: textAlign,
                    }}
                >
                    {text}
                </motion.span>

                <motion.span
                    key={`highlight-${colorTone}-${baseColor}`}
                    style={{
                        ...font,
                        display: "block",
                        position: "absolute",
                        top: 0,
                        width: "100%",
                        background: gradients.highlight,
                        backgroundSize: "150% 150%",
                        backgroundPosition: highlightPos,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        color: "transparent",
                        zIndex: 2,
                        opacity: reflectStrength,
                        mixBlendMode: "overlay",
                        pointerEvents: "none",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        textAlign: textAlign,
                    }}
                    aria-hidden="true"
                >
                    {text}
                </motion.span>

                <motion.span
                    key={`overlay-${colorTone}-${baseColor}`}
                    style={{
                        ...font,
                        display: "block",
                        position: "absolute",
                        top: 0,
                        width: "100%",
                        background:
                            "linear-gradient(135deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 60%)",
                        backgroundSize: "200% 200%",
                        backgroundPosition: highlightPos,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        color: "transparent",
                        zIndex: 3,
                        opacity: reflectStrength * 0.8,
                        mixBlendMode: "color-dodge",
                        pointerEvents: "none",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        textAlign: textAlign,
                    }}
                    aria-hidden="true"
                >
                    {text}
                </motion.span>
            </div>
        </div>
    )
}

addPropertyControls(ChromeReflectText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "CHROME",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 80,
            variant: "Regular",
            letterSpacing: "-0.05em",
        },
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },
    colorTone: {
        type: ControlType.Enum,
        title: "Tone",
        options: ["silver", "gold", "custom"],
        optionTitles: ["Silver", "Gold", "Custom"],
        defaultValue: "silver",
    },
    baseColor: {
        type: ControlType.Color,
        title: "Base Color",
        defaultValue: "#333333",
        hidden: (props) => props.colorTone !== "custom",
    },
    animationType: {
        type: ControlType.Enum,
        title: "Animation",
        options: ["mouse", "loop"],
        optionTitles: ["Mouse Follow", "Auto Loop"],
        defaultValue: "mouse",
    },
    highlightSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        hidden: (props) => props.animationType !== "loop",
    },
    reflectStrength: {
        type: ControlType.Number,
        title: "Reflection",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.05,
    },
    shadowDepth: {
        type: ControlType.Number,
        title: "Depth",
        defaultValue: 10,
        min: 0,
        max: 50,
        step: 1,
    },
})
