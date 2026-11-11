import { useEffect, useState, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, animate, useAnimation } from "framer-motion"

/**
 * Circular Preloader Component
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 */
export default function CircularPreloader(props) {
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const bgControls = useAnimation() // Controls the background/container
    const [isInteractable, setIsInteractable] = useState(true)

    // Combine global font styles
    const textStyle = {
        ...props.font,
        color: props.color,
        fontVariantNumeric: "tabular-nums",
    }

    const fontSize = parseFloat(props.font.fontSize) || 16
    const gap = props.ringGap
    let currentRadius = props.baseRadius

    // Handle the Exit Sequence
    const handleLoadingComplete = async () => {
        if (props.onLoadComplete) props.onLoadComplete()

        if (props.exitSettings.behavior === "none" || isCanvas) return

        // Wait for delay
        const delayMs = props.exitSettings.delay * 1000
        await new Promise((resolve) => setTimeout(resolve, delayMs))

        // Configure the transition
        const transition = {
            duration: props.exitSettings.duration,
            ease: props.exitSettings.ease,
        }

        // --- EXIT LOGIC ---
        const behavior = props.exitSettings.behavior

        // Map behaviors to specific clip-path "wipes" (Curtain Effect)
        const wipes = {
            "slide-up": "inset(0% 0% 100% 0%)", // Bottom moves up
            "slide-down": "inset(100% 0% 0% 0%)", // Top moves down
            "slide-left": "inset(0% 100% 0% 0%)", // Right moves left
            "slide-right": "inset(0% 0% 0% 100%)", // Left moves right
        }

        if (behavior === "fade") {
            await bgControls.start({
                opacity: 0,
                transition: transition,
            })
        } else if (wipes[behavior]) {
            // Apply the directional wipe
            await bgControls.start({
                clipPath: wipes[behavior],
                transition: transition,
            })
        }

        // Hide completely to unblock clicks
        setIsInteractable(false)
    }

    return (
        <motion.div
            animate={bgControls}
            style={{
                ...props.style,
                position: "relative",
                display: isInteractable ? "flex" : "none",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                backgroundColor: props.backgroundColor,
                // Initialize clip-path full visibility
                clipPath: "inset(0% 0% 0% 0%)",
            }}
        >
            {/* Wrapper for Content
              We wrap the rings/counter in this div so they stay centered
              even while the parent clips them away.
            */}
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    position: "relative",
                }}
            >
                {/* Render Rings */}
                {props.rings.map((ring, index) => {
                    const radius = currentRadius
                    currentRadius += fontSize + gap

                    return (
                        <TextRing
                            key={index + ring.text}
                            text={ring.text.toUpperCase()}
                            radius={radius}
                            duration={ring.duration}
                            reverse={ring.reverse}
                            style={textStyle}
                            isCanvas={isCanvas}
                        />
                    )
                })}

                {/* Render Percentage Counter */}
                {props.showPercentage && (
                    <PercentageCounter
                        duration={props.loadingDuration}
                        style={textStyle}
                        isCanvas={isCanvas}
                        onComplete={handleLoadingComplete}
                    />
                )}
            </div>
        </motion.div>
    )
}

// --- Sub-components ---

function TextRing({ text, radius, duration, reverse, style, isCanvas }) {
    const chars = text.split("")
    const angleStep = 360 / chars.length

    return (
        <motion.div
            style={{
                position: "absolute",
                width: 0,
                height: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
            animate={isCanvas ? {} : { rotate: reverse ? -360 : 360 }}
            transition={{
                duration: duration,
                ease: "linear",
                repeat: Infinity,
            }}
        >
            {chars.map((char, i) => (
                <span
                    key={i}
                    style={{
                        ...style,
                        position: "absolute",
                        transform: `rotate(${
                            i * angleStep
                        }deg) translateY(-${radius}px)`,
                        transformOrigin: "center center",
                    }}
                >
                    {char}
                </span>
            ))}
        </motion.div>
    )
}

function PercentageCounter({ duration, style, isCanvas, onComplete }) {
    const count = useMotionValue(0)
    const textRef = useRef(null)

    useEffect(() => {
        if (isCanvas) {
            if (textRef.current) textRef.current.textContent = "100%"
            return
        }

        const controls = animate(count, 100, {
            duration: duration,
            ease: "easeInOut",
            onComplete: () => {
                if (onComplete) onComplete()
            },
        })

        const unsubscribe = count.on("change", (latest) => {
            if (textRef.current) {
                textRef.current.textContent = Math.round(latest) + "%"
            }
        })

        return () => {
            controls.stop()
            unsubscribe()
        }
    }, [duration, isCanvas])

    return (
        <span
            ref={textRef}
            style={{
                ...style,
                position: "absolute",
                zIndex: 10,
            }}
        >
            0%
        </span>
    )
}

// --- Default Props ---

CircularPreloader.defaultProps = {
    width: 400,
    height: 400,
    backgroundColor: "#d4d4ce",
    color: "#333333",
    showPercentage: true,
    loadingDuration: 5,
    baseRadius: 70,
    ringGap: 10,
    rings: [
        {
            text: "design • code • create • ",
            duration: 15,
            reverse: false,
        },
        {
            text: "creative frontend development ",
            duration: 20,
            reverse: true,
        },
        {
            text: "interaction design • ui • ux • ",
            duration: 30,
            reverse: false,
        },
        {
            text: "digital experiences • 2025 • ",
            duration: 25,
            reverse: true,
        },
    ],
    // Defaults for the new exit behavior
    exitSettings: {
        behavior: "none",
        delay: 0.5,
        duration: 0.8,
        ease: "easeInOut",
    },
}

// --- Property Controls ---

addPropertyControls(CircularPreloader, {
    // 1. MAIN CONTENT
    rings: {
        type: ControlType.Array,
        title: "Text Rings",
        control: {
            type: ControlType.Object,
            controls: {
                text: {
                    type: ControlType.String,
                    title: "Text",
                    defaultValue: "RING TEXT",
                },
                duration: {
                    type: ControlType.Number,
                    title: "Speed (s)",
                    defaultValue: 20,
                    min: 1,
                    description: "Time for one full rotation",
                },
                reverse: {
                    type: ControlType.Boolean,
                    title: "Reverse",
                    defaultValue: false,
                    description: "Rotate counter-clockwise",
                },
            },
        },
    },

    // 2. SECONDARY CONTENT
    showPercentage: {
        type: ControlType.Boolean,
        title: "Show %",
        defaultValue: true,
    },
    loadingDuration: {
        type: ControlType.Number,
        title: "Load Time (s)",
        defaultValue: 5,
        min: 0.5,
        max: 60,
        step: 0.5,
        hidden(props) {
            return !props.showPercentage
        },
    },

    // 3. STYLING
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 400,
            fontSize: 16,
            letterSpacing: "0em",
            lineHeight: "1.2em",
            textAlign: "center",
        },
    },
    color: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#333333",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Bg Color",
        defaultValue: "#d4d4ce",
    },

    // 4. LAYOUT
    baseRadius: {
        type: ControlType.Number,
        title: "Start Radius",
        defaultValue: 70,
        min: 0,
        step: 1,
    },
    ringGap: {
        type: ControlType.Number,
        title: "Ring Gap",
        defaultValue: 10,
        min: 0,
        step: 1,
    },

    // 5. EXIT BEHAVIOR
    exitSettings: {
        type: ControlType.Object,
        title: "Exit Behavior",
        controls: {
            behavior: {
                type: ControlType.Enum,
                title: "Effect",
                defaultValue: "none",
                // Updated options: No scale, added directions
                options: [
                    "none",
                    "fade",
                    "slide-up",
                    "slide-down",
                    "slide-left",
                    "slide-right",
                ],
                optionTitles: [
                    "None",
                    "Fade Out",
                    "Slide Up",
                    "Slide Down",
                    "Slide Left",
                    "Slide Right",
                ],
            },
            delay: {
                type: ControlType.Number,
                title: "Delay (s)",
                defaultValue: 0.5,
                min: 0,
                max: 5,
                step: 0.1,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration (s)",
                defaultValue: 1.2,
                min: 0.1,
                max: 5,
                step: 0.1,
            },
            ease: {
                type: ControlType.Enum,
                title: "Easing",
                defaultValue: "easeInOut",
                options: [
                    "linear",
                    "easeIn",
                    "easeOut",
                    "easeInOut",
                    "circIn",
                    "circOut",
                    "backIn",
                    "backOut",
                ],
                optionTitles: [
                    "Linear",
                    "Ease In",
                    "Ease Out",
                    "Ease In Out",
                    "Circular In",
                    "Circular Out",
                    "Back In",
                    "Back Out",
                ],
            },
        },
    },

    // 6. INTERACTIONS
    onLoadComplete: {
        type: ControlType.EventHandler,
    },
})
