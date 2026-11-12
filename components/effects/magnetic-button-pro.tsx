import { useEffect, useRef, type ReactNode } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useSpring } from "framer-motion"

type IconPreset =
    | "Arrow Right"
    | "Arrow Up Right"
    | "Arrow Left"
    | "Plus"
    | "Check"

type Props = {
    label: string
    backgroundColor: string
    textColor: string
    borderColor: string
    borderWidth: number
    showBorder: boolean
    showFill: boolean
    radius: number
    paddingX: number
    paddingY: number
    fontSize: number
    fontWeight: number
    fontFamily: string
    useIcon: boolean
    iconType: "Preset" | "Image"
    iconPreset: IconPreset
    iconImage: string
    iconSize: number
    iconPosition: "Left" | "Right"
    iconGap: number
    attractionRadius: number
    maxShift: number
    stiffness: number
    damping: number
}

/**
 * Built-in icons. Plain JSX paths (no raw HTML injection), colored by the
 * button's text color through `currentColor`.
 */
const ICON_PATHS: Record<IconPreset, string> = {
    "Arrow Right": "M5 12h14M13 6l6 6-6 6",
    "Arrow Up Right": "M7 17L17 7M8 7h9v9",
    "Arrow Left": "M19 12H5M11 6l-6 6 6 6",
    Plus: "M12 5v14M5 12h14",
    Check: "M5 12.5l4.5 4.5L19 7",
}

function PresetIcon({ name, size }: { name: IconPreset; size: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ display: "block", flexShrink: 0 }}
        >
            <path d={ICON_PATHS[name] ?? ICON_PATHS["Arrow Right"]} />
        </svg>
    )
}

/**
 * Magnetic Interaction
 *
 * A customizable magnetic button. The button background stays fixed while
 * its text and optional icon move toward the cursor.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function MagneticInteraction(props: Props) {
    const {
        label,
        backgroundColor,
        textColor,
        borderColor,
        borderWidth,
        showBorder,
        showFill,
        radius,
        paddingX,
        paddingY,
        fontSize,
        fontWeight,
        fontFamily,
        useIcon,
        iconType,
        iconPreset,
        iconImage,
        iconSize,
        iconPosition,
        iconGap,
        attractionRadius,
        maxShift,
        stiffness,
        damping,
    } = props

    const isStatic = useIsStaticRenderer()
    const buttonRef = useRef<HTMLButtonElement>(null)
    const targetX = useMotionValue(0)
    const targetY = useMotionValue(0)

    const x = useSpring(targetX, {
        stiffness,
        damping,
        mass: 0.35,
    })
    const y = useSpring(targetY, {
        stiffness,
        damping,
        mass: 0.35,
    })

    useEffect(() => {
        const element = buttonRef.current
        if (!element || isStatic) return

        let listening = false
        let frame = 0
        let lastEvent: MouseEvent | null = null

        const reset = () => {
            targetX.set(0)
            targetY.set(0)
        }

        const update = () => {
            frame = 0
            const event = lastEvent
            if (!event) return

            const rect = element.getBoundingClientRect()
            const nearestX = Math.max(
                rect.left,
                Math.min(event.clientX, rect.right)
            )
            const nearestY = Math.max(
                rect.top,
                Math.min(event.clientY, rect.bottom)
            )
            const distance = Math.hypot(
                event.clientX - nearestX,
                event.clientY - nearestY
            )

            if (distance >= attractionRadius) {
                reset()
                return
            }

            const dx = event.clientX - (rect.left + rect.width / 2)
            const dy = event.clientY - (rect.top + rect.height / 2)
            const length = Math.hypot(dx, dy) || 1
            const strength = 1 - distance / attractionRadius

            targetX.set((dx / length) * maxShift * strength)
            targetY.set((dy / length) * maxShift * strength)
        }

        // At most one geometry calculation per animation frame
        const handleMove = (event: MouseEvent) => {
            lastEvent = event
            if (!frame) frame = requestAnimationFrame(update)
        }

        const start = () => {
            if (listening) return
            listening = true
            window.addEventListener("mousemove", handleMove, {
                passive: true,
            })
            window.addEventListener("blur", reset)
        }

        const stop = () => {
            if (!listening) return
            listening = false
            window.removeEventListener("mousemove", handleMove)
            window.removeEventListener("blur", reset)
            if (frame) cancelAnimationFrame(frame)
            frame = 0
            lastEvent = null
            reset()
        }

        // Only listen while the button (plus its attraction radius) is on screen
        if (typeof IntersectionObserver === "undefined") {
            start()
            return stop
        }

        const observer = new IntersectionObserver(
            ([entry]) => (entry.isIntersecting ? start() : stop()),
            { rootMargin: `${attractionRadius}px` }
        )
        observer.observe(element)

        return () => {
            observer.disconnect()
            stop()
        }
    }, [isStatic, attractionRadius, maxShift, targetX, targetY])

    const buttonStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        minHeight: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        padding: `${paddingY}px ${paddingX}px`,
        borderRadius: radius,
        border: showBorder ? `${borderWidth}px solid ${borderColor}` : "none",
        background: showFill ? backgroundColor : "transparent",
        color: textColor,
        fontSize,
        fontWeight,
        fontFamily: fontFamily || "Inter, sans-serif",
        lineHeight: 1.2,
        cursor: "pointer",
        appearance: "none",
        outline: "none",
        overflow: "visible",
    }

    let iconContent: ReactNode = null
    if (useIcon) {
        if (iconType === "Image") {
            // Rendered through <img>, so scripts or event handlers inside an
            // uploaded SVG never execute.
            iconContent = iconImage ? (
                <img
                    src={iconImage}
                    alt=""
                    aria-hidden="true"
                    style={{
                        width: iconSize,
                        height: iconSize,
                        objectFit: "contain",
                        display: "block",
                        flexShrink: 0,
                    }}
                />
            ) : null
        } else {
            iconContent = <PresetIcon name={iconPreset} size={iconSize} />
        }
    }

    const contentStyle: CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: iconContent ? iconGap : 0,
        whiteSpace: "nowrap",
        pointerEvents: "none",
    }

    const content = (
        <>
            {iconPosition === "Left" && iconContent}
            <span>{label}</span>
            {iconPosition === "Right" && iconContent}
        </>
    )

    return (
        <button ref={buttonRef} type="button" style={buttonStyle}>
            {isStatic ? (
                // Canvas / export: simple non-animated fallback
                <span style={contentStyle}>{content}</span>
            ) : (
                <motion.span style={{ ...contentStyle, x, y }}>
                    {content}
                </motion.span>
            )}
        </button>
    )
}

MagneticInteraction.defaultProps = {
    label: "Explore my work",
    backgroundColor: "#FF6848",
    textColor: "#FFFFFF",
    borderColor: "#FF6848",
    borderWidth: 1,
    showBorder: true,
    showFill: true,
    radius: 999,
    paddingX: 24,
    paddingY: 14,
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "Inter",
    useIcon: true,
    iconType: "Preset",
    iconPreset: "Arrow Right",
    iconSize: 18,
    iconPosition: "Right",
    iconGap: 8,
    attractionRadius: 170,
    maxShift: 8,
    stiffness: 180,
    damping: 18,
}

addPropertyControls(MagneticInteraction, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Explore my work",
    },
    useIcon: {
        type: ControlType.Boolean,
        title: "Show Icon",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    iconType: {
        type: ControlType.Enum,
        title: "Icon Type",
        options: ["Preset", "Image"],
        optionTitles: ["Preset", "Image"],
        defaultValue: "Preset",
        displaySegmentedControl: true,
        hidden(props) {
            return !props.useIcon
        },
    },
    iconPreset: {
        type: ControlType.Enum,
        title: "Icon",
        options: [
            "Arrow Right",
            "Arrow Up Right",
            "Arrow Left",
            "Plus",
            "Check",
        ],
        optionTitles: [
            "Arrow Right",
            "Arrow Up Right",
            "Arrow Left",
            "Plus",
            "Check",
        ],
        defaultValue: "Arrow Right",
        hidden(props) {
            return !props.useIcon || props.iconType !== "Preset"
        },
    },
    iconImage: {
        type: ControlType.Image,
        title: "Icon Image",
        hidden(props) {
            return !props.useIcon || props.iconType !== "Image"
        },
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 18,
        min: 8,
        max: 96,
        step: 1,
        unit: "px",
        hidden(props) {
            return !props.useIcon
        },
    },
    iconPosition: {
        type: ControlType.Enum,
        title: "Icon Position",
        options: ["Left", "Right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "Right",
        hidden(props) {
            return !props.useIcon
        },
    },
    iconGap: {
        type: ControlType.Number,
        title: "Icon Gap",
        defaultValue: 8,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        hidden(props) {
            return !props.useIcon
        },
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Fill Color",
        defaultValue: "#FF6848",
        hidden(props) {
            return !props.showFill
        },
    },
    showFill: {
        type: ControlType.Boolean,
        title: "Show Fill",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    showBorder: {
        type: ControlType.Boolean,
        title: "Show Border",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#FF6848",
        hidden(props) {
            return !props.showBorder
        },
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 1,
        min: 0,
        max: 8,
        step: 1,
        unit: "px",
        hidden(props) {
            return !props.showBorder
        },
    },
    radius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 999,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        defaultValue: 24,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        defaultValue: 14,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 15,
        min: 8,
        max: 48,
        step: 1,
        unit: "px",
    },
    fontWeight: {
        type: ControlType.Enum,
        title: "Font Weight",
        options: [400, 500, 600, 700, 800],
        optionTitles: ["Regular", "Medium", "Semibold", "Bold", "Extra Bold"],
        defaultValue: 600,
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: "Inter",
        placeholder: "Inter, Arial, sans-serif",
    },
    attractionRadius: {
        type: ControlType.Number,
        title: "Radius",
        description:
            "Sets the distance around the button where the magnetic effect activates.",
        defaultValue: 170,
        min: 20,
        max: 500,
        step: 10,
        unit: "px",
    },
    maxShift: {
        type: ControlType.Number,
        title: "Max Shift",
        description:
            "Sets the maximum distance the text moves toward the cursor.",
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    stiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        description:
            "Controls how quickly the text responds to cursor movement.",
        defaultValue: 180,
        min: 10,
        max: 500,
        step: 10,
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        description: "Controls how much the text oscillates before settling.",
        defaultValue: 18,
        min: 1,
        max: 50,
        step: 1,
    },
})
