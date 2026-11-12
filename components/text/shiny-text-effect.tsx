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
    useMotionValue,
    useAnimationFrame,
    useTransform,
} from "motion/react"
import { useState, useCallback, useEffect, useRef } from "react"

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function ShinyText(props) {
    const {
        text,
        disabled,
        speed,
        color,
        shineColor,
        spread,
        yoyo,
        pauseOnHover,
        direction,
        delay,
        font,
    } = props

    const [isPaused, setIsPaused] = useState(false)
    const isStatic = useIsStaticRenderer()

    const progress = useMotionValue(0)
    const elapsedRef = useRef(0)
    const lastTimeRef = useRef(null)
    const directionRef = useRef(direction === "left" ? 1 : -1)

    const animationDuration = speed * 1000
    const delayDuration = delay * 1000

    useAnimationFrame((time) => {
        // Disable animation during static rendering, when disabled, or when paused
        if (isStatic || disabled || isPaused) {
            lastTimeRef.current = null
            return
        }

        if (lastTimeRef.current === null) {
            lastTimeRef.current = time
            return
        }

        const delta = time - lastTimeRef.current
        lastTimeRef.current = time
        elapsedRef.current += delta

        if (yoyo) {
            const cycleDuration = animationDuration + delayDuration
            const fullCycle = cycleDuration * 2
            const cycleTime = elapsedRef.current % fullCycle

            if (cycleTime < animationDuration) {
                const p = (cycleTime / animationDuration) * 100
                progress.set(directionRef.current === 1 ? p : 100 - p)
            } else if (cycleTime < cycleDuration) {
                progress.set(directionRef.current === 1 ? 100 : 0)
            } else if (cycleTime < cycleDuration + animationDuration) {
                const reverseTime = cycleTime - cycleDuration
                const p = 100 - (reverseTime / animationDuration) * 100
                progress.set(directionRef.current === 1 ? p : 100 - p)
            } else {
                progress.set(directionRef.current === 1 ? 0 : 100)
            }
        } else {
            const cycleDuration = animationDuration + delayDuration
            const cycleTime = elapsedRef.current % cycleDuration

            if (cycleTime < animationDuration) {
                const p = (cycleTime / animationDuration) * 100
                progress.set(directionRef.current === 1 ? p : 100 - p)
            } else {
                progress.set(directionRef.current === 1 ? 100 : 0)
            }
        }
    })

    useEffect(() => {
        directionRef.current = direction === "left" ? 1 : -1
        elapsedRef.current = 0
        progress.set(0)
    }, [direction])

    const backgroundPosition = useTransform(
        progress,
        (p) => `${150 - p * 2}% center`
    )

    const gradientStyle = {
        backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
        backgroundSize: "200% auto",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
    }

    const style = {
        ...font,
        display: "inline-block",
        whiteSpace: "nowrap",
    }

    const handleMouseEnter = useCallback(() => {
        if (pauseOnHover) setIsPaused(true)
    }, [pauseOnHover])

    const handleMouseLeave = useCallback(() => {
        if (pauseOnHover) setIsPaused(false)
    }, [pauseOnHover])

    return (
        <motion.span
            style={{
                ...style,
                ...gradientStyle,
                backgroundPosition: isStatic
                    ? "150% center"
                    : backgroundPosition,
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {text}
        </motion.span>
    )
}

ShinyText.defaultProps = {
    text: "Hey! Shiny Text Effect This Side",
    disabled: false,
    speed: 2,
    color: "#b5b5b5",
    shineColor: "#ffffff",
    spread: 120,
    yoyo: false,
    pauseOnHover: false,
    direction: "left",
    delay: 0,
    font: {
        fontSize: 64,
        fontWeight: 700,
        fontFamily: "Inter",
    },
}

addPropertyControls(ShinyText, {
    text: {
        type: ControlType.String,
        title: "Text",
    },
    font: {
        type: ControlType.Font,
        controls: "extended",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
    },
    shineColor: {
        type: ControlType.Color,
        title: "Shine",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.2,
        max: 10,
        step: 0.1,
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        min: 0,
        max: 10,
        step: 0.1,
    },
    spread: {
        type: ControlType.Number,
        title: "Spread",
        min: 30,
        max: 180,
        step: 1,
    },
    direction: {
        type: ControlType.Enum,
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
    },
    disabled: {
        type: ControlType.Boolean,
    },
    yoyo: {
        type: ControlType.Boolean,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause Hover",
    },
})
