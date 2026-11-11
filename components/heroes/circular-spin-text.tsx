/**
 * SpinCircularText Component for Framer
 *
 * This component creates a circular text arrangement that rotates continuously.
 * It uses trigonometry to place each character perfectly along a circle and
 * Framer Motion to handle smooth, interactive rotation animations.
 */
import React, { useEffect } from "react"
import {
    motion,
    useAnimation,
    useMotionValue,
    type MotionValue,
    type Transition,
} from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * Props interface defining all configurable properties in the Framer UI.
 */
interface CircularSpinTextProps {
    text: string // String to display in the circle
    spinDuration: number // Seconds for one full 360-degree rotation
    onHover: "slowDown" | "speedUp" | "pause" | "goBonkers" | "none" // Interaction mode
    size: number // Total width/height of the interactive area
    fontSize: number // Size of individual letters
    fontWeight: number // Thickness of letters
    textColor: string // Color of the text
    radius: number // Distance from center to the center of characters
    letterSpacing: number
    direction: "clockwise" | "counterclockwise"
    showCircleBorder: boolean // Show subtle circle background and border
}

/**
 * Helper to generate a continuous rotation transition.
 *
 * @param duration Seconds for the rotation
 * @param from Current rotation value (to ensure smooth transitions from where it currently is)
 * @param direction Direction of spin
 * @param loop Whether to repeat infinitely
 */
const getRotationTransition = (
    duration: number,
    from: number,
    direction: "clockwise" | "counterclockwise",
    loop: boolean = true
) => ({
    from,
    to: direction === "clockwise" ? from + 360 : from - 360,
    ease: "linear" as const, // Linear ease is essential for a steady spin
    duration,
    type: "tween" as const,
    repeat: loop ? Infinity : 0,
})

/**
 * Generates a full transition object including scale effects for interactions.
 */
const getTransition = (
    duration: number,
    from: number,
    direction: "clockwise" | "counterclockwise"
) => ({
    rotate: getRotationTransition(duration, from, direction),
    scale: {
        type: "spring" as const, // Use spring for satisfying interactive scaling
        damping: 20,
        stiffness: 300,
    },
})

/**
 * Circular Spin Text Component
 *
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 200
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function CircularSpinText(props: CircularSpinTextProps) {
    // Destructure props with smart defaults
    const {
        text = "CIRCULAR TEXT • SPIN •",
        spinDuration = 20,
        onHover = "speedUp",
        size = 200,
        fontSize = 24,
        fontWeight = 900,
        textColor = "#ffffff",
        radius = 80,
        letterSpacing = 0,
        direction = "clockwise",
        showCircleBorder = true,
    } = props

    // State & Refs
    const letters = Array.from(text)
    const controls = useAnimation() // Manual control over the rotation animation
    const rotation: MotionValue<number> = useMotionValue(0) // Tracks current rotation degree

    // Safety check: Avoid running transitions in the Framer thumbnail view
    const isStatic = RenderTarget.current() === RenderTarget.thumbnail

    /**
     * Effect to start or update the animation whenever spin parameters change.
     */
    useEffect(() => {
        if (isStatic) return

        const start = rotation.get() // Get current degree to prevent "jumps" when duration changes
        controls.start({
            rotate: direction === "clockwise" ? start + 360 : start - 360,
            scale: 1,
            transition: getTransition(spinDuration, start, direction),
        })
    }, [spinDuration, text, onHover, controls, direction, isStatic])

    /**
     * Handles the interaction when the mouse enters the circle.
     */
    const handleHoverStart = () => {
        if (isStatic || onHover === "none") return

        const start = rotation.get() // Continue from current position

        // Handle special cases that need custom animation logic
        if (onHover === "pause") {
            // Pause stops at current position with a subtle spring
            controls.start({
                rotate: start, // Stay at current rotation instead of continuing
                scale: 1.05, // Slight scale up to indicate pause state
                transition: {
                    rotate: {
                        type: "spring",
                        damping: 25,
                        stiffness: 400,
                    },
                    scale: { type: "spring", damping: 20, stiffness: 300 },
                },
            })
            return // Early return to avoid the generic animation call below
        }

        let transitionConfig: ReturnType<typeof getTransition>
        let scaleVal = 1

        // Apply specific logic based on the chosen hover mode
        switch (onHover) {
            case "slowDown":
                transitionConfig = getTransition(
                    spinDuration * 2,
                    start,
                    direction
                )
                break
            case "speedUp":
                transitionConfig = getTransition(
                    spinDuration / 4,
                    start,
                    direction
                )
                break
            case "goBonkers":
                // Fast spin + slight shrink for a "compressed" energy effect
                transitionConfig = getTransition(
                    spinDuration / 20,
                    start,
                    direction
                )
                scaleVal = 0.85
                break
            default:
                transitionConfig = getTransition(spinDuration, start, direction)
        }

        controls.start({
            rotate: direction === "clockwise" ? start + 360 : start - 360,
            scale: scaleVal,
            transition: transitionConfig,
        })
    }

    /**
     * Resets parameters to default spin when mouse leaves.
     */
    const handleHoverEnd = () => {
        if (isStatic || onHover === "none") return

        const start = rotation.get()
        controls.start({
            rotate: direction === "clockwise" ? start + 360 : start - 360,
            scale: 1,
            transition: getTransition(spinDuration, start, direction),
        })
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <motion.div
                style={{
                    margin: "0 auto",
                    borderRadius: "50%",
                    width: size,
                    position: "relative",
                    height: size,
                    fontWeight,
                    color: textColor,
                    textAlign: "center",
                    cursor: onHover !== "none" ? "pointer" : "default",
                    transformOrigin: "50% 50%",
                    WebkitTransformOrigin: "50% 50%",
                    rotate: rotation, // This binds the motion value to the actual rotation
                    // Subtle background to show the circle size boundary (optional)
                    backgroundColor: showCircleBorder
                        ? "rgba(255, 255, 255, 0.03)"
                        : "transparent",
                    border: showCircleBorder
                        ? "1px solid rgba(255, 255, 255, 0.05)"
                        : "none",
                }}
                initial={{ rotate: 0 }}
                animate={controls}
                onMouseEnter={handleHoverStart}
                onMouseLeave={handleHoverEnd}
            >
                {letters.map((letter, i) => {
                    // -- Trigonometry for Character Placement --

                    // 1. Calculate the base rotation for this specific character in degrees
                    const rotationDeg = (360 / letters.length) * i

                    // 2. Convert degrees to radians for use with Math.sin/cos
                    const angle = (rotationDeg * Math.PI) / 180

                    // 3. Calculate X and Y coordinates on the circumference
                    // Sin gives X (horizontal), Cos gives Y (vertical)
                    const x = Math.sin(angle) * radius
                    const y = -Math.cos(angle) * radius // Negative because HTML coordinates grow downwards

                    // 4. Combine translations:
                    // - translate(-50%, -50%): Centering characters on their anchor points
                    // - translate(x, y): Moving characters to their spot on the circle
                    // - rotate(rotationDeg): Tilting characters to align with the circle's curve
                    const transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotationDeg}deg)`

                    return (
                        <span
                            key={i}
                            style={{
                                position: "absolute",
                                display: "inline-block",
                                left: "50%",
                                top: "50%",
                                fontSize,
                                letterSpacing,
                                transition:
                                    "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                transform,
                                WebkitTransform: transform,
                                userSelect: "none",
                            }}
                        >
                            {letter}
                        </span>
                    )
                })}
            </motion.div>
        </div>
    )
}

CircularSpinText.defaultProps = {
    width: 200,
    height: 200,
}

CircularSpinText.displayName = "Circular Spin Text"

// -- Property Controls --
addPropertyControls(CircularSpinText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "CIRCULAR TEXT • SPIN •",
        placeholder: "Enter your text...",
        // description: "The text that will wrap around the circle.",
    },
    spinDuration: {
        type: ControlType.Number,
        title: "Spin Duration",
        defaultValue: 20,
        min: 1,
        max: 60,
        step: 1,
        unit: "s",
        displayStepper: true,
        description: "Time in seconds for one complete rotation.",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["clockwise", "counterclockwise"],
        optionTitles: ["Clockwise", "Anti-Clockwise"],
        defaultValue: "clockwise",
        displaySegmentedControl: true,
        // description: "The rotation direction of the spin.",
    },
    onHover: {
        type: ControlType.Enum,
        title: "Hover Effect",
        options: ["none", "slowDown", "speedUp", "pause", "goBonkers"],
        optionTitles: ["None", "Slow Down", "Speed Up", "Pause", "Go Bonkers"],
        defaultValue: "speedUp",
        // description: "Interaction behavior when hovering over the circle.",
    },
    size: {
        type: ControlType.Number,
        title: "Hit Area Size",
        defaultValue: 200,
        min: 100,
        max: 600,
        step: 10,
        unit: "px",
        displayStepper: true,
        description:
            "Diameter of the invisible hover area. The animation starts when the mouse enters this circle.",
    },
    showCircleBorder: {
        type: ControlType.Boolean,
        title: "Show Hit Area Guide",
        defaultValue: true,
        enabledTitle: "Visible",
        disabledTitle: "Hidden",
        description:
            "Shows a semi-transparent circle that visually marks the hover hit area.",
    },
    radius: {
        type: ControlType.Number,
        title: "Text Circle Radius",
        defaultValue: 80,
        min: 30,
        max: 300,
        step: 5,
        unit: "px",
        displayStepper: true,
        description:
            "Radius of the circle on which the text is laid out. Controls how tight or wide the text wraps.",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 24,
        min: 8,
        max: 72,
        step: 1,
        unit: "px",
        displayStepper: true,
        // description: "Size of individual characters.",
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Font Weight",
        defaultValue: 900,
        min: 100,
        max: 900,
        step: 100,
        displayStepper: true,
        // description: "Weight/boldness of the text characters.",
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: 0,
        min: -5,
        max: 20,
        step: 0.5,
        unit: "px",
        displayStepper: true,
        // description: "Spacing between individual letters.",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
        // description: "Color of the text characters.",
    },
})
