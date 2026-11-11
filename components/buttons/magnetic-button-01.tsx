import { motion, useMotionValue, useSpring } from "framer-motion"
import { useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function Magnetic__Button({
    label = "Get started",
    strength = 0.4,
    radius = 120,
    borderRadius = 99,
    paddingX = 32,
    paddingY = 14,
    fontSize = 16,
    // Default state colors
    defaultBg = "#ffffff",
    defaultTextColor = "#000000",
    defaultBorderColor = "rgba(0,0,0,0.2)",
    // Hovered state colors
    hoverBg = "#000000",
    hoverTextColor = "#ffffff",
    hoverBorderColor = "transparent",
    // Drop shadow
    shadowEnabled = true,
    shadowColor = "rgba(0,0,0,0.25)",
    shadowX = 0,
    shadowY = 8,
    shadowBlur = 24,
    shadowSpread = 0,
    shadowHoverScale = 1.6,
    onTap,
}: Props) {
    const ref = useRef<HTMLDivElement>(null)
    const [hovered, setHovered] = useState(false)
    const [clicked, setClicked] = useState(false)

    const wrapX = useSpring(useMotionValue(0), {
        stiffness: 200,
        damping: 20,
        mass: 0.5,
    })
    const wrapY = useSpring(useMotionValue(0), {
        stiffness: 200,
        damping: 20,
        mass: 0.5,
    })
    const innerX = useSpring(useMotionValue(0), {
        stiffness: 250,
        damping: 18,
        mass: 0.3,
    })
    const innerY = useSpring(useMotionValue(0), {
        stiffness: 250,
        damping: 18,
        mass: 0.3,
    })

    // Build the box-shadow string from individual controls
    const buildShadow = (scale: number) => {
        if (!shadowEnabled) return "none"
        return `${shadowX}px ${shadowY * scale}px ${shadowBlur * scale}px ${shadowSpread}px ${shadowColor}`
    }

    function handleMouseMove(e: React.MouseEvent) {
        if (!ref.current) return
        const rect = ref.current.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = e.clientX - cx
        const dy = e.clientY - cy
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < radius) {
            setHovered(true)
            wrapX.set(dx * strength)
            wrapY.set(dy * strength)
            innerX.set(dx * strength * 0.3)
            innerY.set(dy * strength * 0.3)
        } else {
            handleMouseLeave()
        }
    }

    function handleMouseLeave() {
        setHovered(false)
        wrapX.set(0)
        wrapY.set(0)
        innerX.set(0)
        innerY.set(0)
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
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                ref={ref}
                style={{ x: wrapX, y: wrapY, display: "inline-flex" }}
            >
                <motion.button
                    onTapStart={() => setClicked(true)}
                    onTap={(e) => {
                        setClicked(false)
                        onTap?.()
                    }}
                    onTapCancel={() => setClicked(false)}
                    animate={{
                        backgroundColor: hovered ? hoverBg : defaultBg,
                        color: hovered ? hoverTextColor : defaultTextColor,
                        borderColor: hovered
                            ? hoverBorderColor
                            : defaultBorderColor,
                        scale: clicked ? 0.93 : hovered ? 1.04 : 1,
                        boxShadow: shadowEnabled
                            ? buildShadow(
                                  clicked ? 0.4 : hovered ? shadowHoverScale : 1
                              )
                            : "none",
                    }}
                    transition={{
                        scale: {
                            duration: clicked ? 0.08 : 0.2,
                            ease: "easeOut",
                        },
                        duration: 0.2,
                        ease: "easeOut",
                    }}
                    style={{
                        padding: `${paddingY}px ${paddingX}px`,
                        borderRadius: borderRadius,
                        border: "1px solid",
                        borderColor: defaultBorderColor,
                        backgroundColor: defaultBg,
                        color: defaultTextColor,
                        fontSize: fontSize,
                        fontWeight: 500,
                        cursor: "pointer",
                        outline: "none",
                        whiteSpace: "nowrap",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: shadowEnabled ? buildShadow(1) : "none",
                    }}
                >
                    <motion.span style={{ x: innerX, y: innerY }}>
                        {label}
                    </motion.span>
                </motion.button>
            </motion.div>
        </div>
    )
}

addPropertyControls(Magnetic__Button, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Get started",
    },

    // ── Interaction ──────────────────────────────────────────
    strength: {
        type: ControlType.Number,
        title: "Pull strength",
        defaultValue: 0.4,
        min: 0.1,
        max: 1.0,
        step: 0.05,
        displayStepper: true,
    },
    radius: {
        type: ControlType.Number,
        title: "Trigger radius",
        defaultValue: 120,
        min: 60,
        max: 240,
        step: 10,
        unit: "px",
    },

    // ── Default state colors ──────────────────────────────────
    defaultBg: {
        type: ControlType.Color,
        title: "Default BG",
        defaultValue: "#ffffff",
    },
    defaultTextColor: {
        type: ControlType.Color,
        title: "Default text",
        defaultValue: "#000000",
    },
    defaultBorderColor: {
        type: ControlType.Color,
        title: "Default border",
        defaultValue: "rgba(0,0,0,0.2)",
    },

    // ── Hover state colors ────────────────────────────────────
    hoverBg: {
        type: ControlType.Color,
        title: "Hover BG",
        defaultValue: "#000000",
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover text",
        defaultValue: "#ffffff",
    },
    hoverBorderColor: {
        type: ControlType.Color,
        title: "Hover border",
        defaultValue: "transparent",
    },

    // ── Drop shadow ───────────────────────────────────────────
    shadowEnabled: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow color",
        defaultValue: "rgba(0,0,0,0.25)",
        hidden(props) {
            return !props.shadowEnabled
        },
    },
    shadowX: {
        type: ControlType.Number,
        title: "Shadow X",
        defaultValue: 0,
        min: -40,
        max: 40,
        step: 1,
        unit: "px",
        hidden(props) {
            return !props.shadowEnabled
        },
    },
    shadowY: {
        type: ControlType.Number,
        title: "Shadow Y",
        defaultValue: 8,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        hidden(props) {
            return !props.shadowEnabled
        },
    },
    shadowBlur: {
        type: ControlType.Number,
        title: "Shadow blur",
        defaultValue: 24,
        min: 0,
        max: 80,
        step: 2,
        unit: "px",
        hidden(props) {
            return !props.shadowEnabled
        },
    },
    shadowSpread: {
        type: ControlType.Number,
        title: "Shadow spread",
        defaultValue: 0,
        min: -20,
        max: 20,
        step: 1,
        unit: "px",
        hidden(props) {
            return !props.shadowEnabled
        },
    },
    shadowHoverScale: {
        type: ControlType.Number,
        title: "Shadow on hover",
        defaultValue: 1.6,
        min: 1,
        max: 4,
        step: 0.1,
        displayStepper: true,
        hidden(props) {
            return !props.shadowEnabled
        },
    },

    // ── Layout ────────────────────────────────────────────────
    borderRadius: {
        type: ControlType.Number,
        title: "Corner radius",
        defaultValue: 99,
        min: 0,
        max: 99,
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        defaultValue: 32,
        min: 8,
        max: 80,
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        defaultValue: 14,
        min: 4,
        max: 40,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font size",
        defaultValue: 15,
        min: 12,
        max: 24,
    },

    onTap: {
        type: ControlType.EventHandler,
    },
})

interface Props {
    label?: string
    strength?: number
    radius?: number
    borderRadius?: number
    paddingX?: number
    paddingY?: number
    fontSize?: number
    defaultBg?: string
    defaultTextColor?: string
    defaultBorderColor?: string
    hoverBg?: string
    hoverTextColor?: string
    hoverBorderColor?: string
    shadowEnabled?: boolean
    shadowColor?: string
    shadowX?: number
    shadowY?: number
    shadowBlur?: number
    shadowSpread?: number
    shadowHoverScale?: number
    onTap?: () => void
}
