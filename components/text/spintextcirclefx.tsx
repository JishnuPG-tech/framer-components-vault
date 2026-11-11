import * as React from "react"
import { motion, useAnimation, useMotionValue } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


function CircularText({
    text = "*DIVERSEKIT*COMPONENT",
    spinDuration = 20,
    onHover = "speedUp",
    size = 200,
    fontSize = 20,
    fontWeight = 700,
    fontFamily = "Arial, sans-serif",
    color = "#ffffff",
    className = "",
    style = {},
    ...rest
}) {
    const letters = React.useMemo(() => Array.from(String(text || "")), [text])

    const controls = useAnimation()
    const rotate = useMotionValue(0)

    const startSpin = React.useCallback(
        (duration) => {
            const start = rotate.get() || 0
            controls.start({
                rotate: [start, start + 360],
                scale: 1,
                transition: {
                    duration: Math.max(0.0001, duration),
                    ease: "linear",
                    repeat: Infinity,
                },
            })
        },
        [controls, rotate]
    )

    React.useEffect(() => {
        startSpin(spinDuration)
    }, [spinDuration, text, startSpin])

    const handleHoverStart = () => {
        const start = rotate.get() || 0
        if (!onHover || onHover === "none") return

        switch (onHover) {
            case "slowDown":
                controls.start({
                    rotate: [start, start + 360],
                    scale: 1,
                    transition: {
                        duration: Math.max(0.0001, spinDuration * 2),
                        ease: "linear",
                        repeat: Infinity,
                    },
                })
                break
            case "speedUp":
                controls.start({
                    rotate: [start, start + 360],
                    scale: 1.05,
                    transition: {
                        duration: Math.max(0.0001, spinDuration / 4),
                        ease: "linear",
                        repeat: Infinity,
                    },
                })
                break
            case "pause":
                controls.stop()
                rotate.set(start)
                controls.start({
                    scale: 1,
                    transition: { type: "spring", damping: 20, stiffness: 300 },
                })
                break
            case "goBonkers":
                controls.start({
                    rotate: [start, start + 360],
                    scale: 0.9,
                    transition: {
                        duration: Math.max(0.0001, spinDuration / 20),
                        ease: "linear",
                        repeat: Infinity,
                    },
                })
                break
            default:
                controls.start({
                    rotate: [start, start + 360],
                    scale: 1,
                    transition: {
                        duration: spinDuration,
                        ease: "linear",
                        repeat: Infinity,
                    },
                })
        }
    }

    const handleHoverEnd = () => {
        const start = rotate.get() || 0
        controls.start({
            rotate: [start, start + 360],
            scale: 1,
            transition: {
                duration: Math.max(0.0001, spinDuration),
                ease: "linear",
                repeat: Infinity,
            },
        })
    }

    const radius = Math.max(10, size / 2 - fontSize / 2)

    const baseContainerStyle = {
        width: size,
        height: size,
        position: "relative",
        borderRadius: "50%",
        display: "inline-block",
        overflow: "visible",
        WebkitTransformOrigin: "50% 50%",
        transformOrigin: "50% 50%",
    }

    const letterBaseStyle = {
        position: "absolute",
        left: "50%",
        top: "50%",
        transformOrigin: "0 0",
        display: "inline-block",
        userSelect: "none",
        pointerEvents: "none",
        color,
        fontSize,
        fontWeight,
        fontFamily,
    }

    return (
        <motion.div
            {...rest}
            className={`circular-text ${className}`.trim()}
            style={{ ...baseContainerStyle, ...style, rotate }}
            initial={{ rotate: 0, scale: 1 }}
            animate={controls}
            onMouseEnter={handleHoverStart}
            onMouseLeave={handleHoverEnd}
            onTouchStart={handleHoverStart}
            onTouchEnd={handleHoverEnd}
        >
            {letters.map((letter, i) => {
                const angle = (360 / Math.max(1, letters.length)) * i
                const transform = `rotate(${angle}deg) translate(${radius}px) rotate(90deg)`

                const spanStyle = {
                    ...letterBaseStyle,
                    transform,
                    WebkitTransform: transform,
                    lineHeight: 1,
                    whiteSpace: "pre",
                }

                return (
                    <span className="letter" key={i} style={spanStyle}>
                        {letter}
                    </span>
                )
            })}
        </motion.div>
    )
}

addPropertyControls(CircularText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "*DIVERSEKIT*COMPONENT",
    },
    spinDuration: {
        type: ControlType.Number,
        title: "Spin (s)",
        min: 0.05,
        max: 120,
        step: 0.1,
        defaultValue: 20,
    },
    onHover: {
        type: ControlType.Enum,
        title: "On Hover",
        options: ["none", "speedUp", "slowDown", "pause", "goBonkers"],
        optionTitles: ["none", "speedUp", "slowDown", "pause", "goBonkers"],
        defaultValue: "speedUp",
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        min: 32,
        max: 1000,
        step: 1,
        defaultValue: 200,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        min: 8,
        max: 120,
        step: 1,
        defaultValue: 20,
    },
    fontWeight: {
        type: ControlType.Enum,
        title: "Weight",
        options: [100, 200, 300, 400, 500, 600, 700, 800, 900],
        optionTitles: [
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
        ],
        defaultValue: 700,
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: "Arial, sans-serif",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#ffffff",
        description:
            "More Components at [DiverseKit](https://framer.link/se2heI4)",
    },
})

export default CircularText
