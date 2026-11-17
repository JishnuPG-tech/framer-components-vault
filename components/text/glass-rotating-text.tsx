import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
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
 * Rotating Pill — a glassy chip that tumbles (3D rotateX) through a list of
 * logo + label items, morphing its width to fit each one. Self-contained.
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */

const FACE_H = "1.45em"
const RADIUS = "0.725em" // half of FACE_H, so the faces meet at the cube edge
const PAD_X = "0.85em"
const GAP = "0.25em"

const faceRow = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: GAP,
    whiteSpace: "nowrap",
    height: FACE_H,
}

function Face({ item, showIcon }) {
    return (
        <>
            {showIcon && item.icon ? (
                <img
                    src={item.icon}
                    alt=""
                    aria-hidden="true"
                    style={{
                        width: "0.74em",
                        height: "0.74em",
                        objectFit: "contain",
                    }}
                />
            ) : null}
            <span>{item.name}</span>
        </>
    )
}

export default function RotatingPill(props) {
    const {
        items = [],
        intervalSec = 2.2,
        flipSec = 0.7,
        fontSize = 48,
        fontWeight = 500,
        textColor = "#171717",
        pillBackground = "rgba(255, 255, 255, 0.25)",
        pillBorder = "rgba(255, 255, 255, 0.5)",
        glassBlur = true,
        showIcon = true,
        style,
    } = props

    const transition = { duration: flipSec, ease: [0.65, 0, 0.35, 1] }

    const [step, setStep] = useState(0)
    const [width, setWidth] = useState<number>()
    const sizerRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        if (items.length < 2) return
        const id = setInterval(() => setStep((s) => s + 1), intervalSec * 1000)
        return () => clearInterval(id)
    }, [intervalSec, items.length])

    // Measure the current label so the pill can morph its width to fit.
    useLayoutEffect(() => {
        if (sizerRef.current) setWidth(sizerRef.current.offsetWidth)
    }, [step, items, fontSize, showIcon])

    const len = items.length
    if (!len) {
        return (
            <span style={{ fontSize, color: textColor, opacity: 0.4 }}>
                Add items →
            </span>
        )
    }

    const at = (s: number) => items[((s % len) + len) % len]
    const faces = [step - 1, step] // outgoing + incoming stay mounted through the turn

    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                fontSize,
                fontWeight,
                color: textColor,
                lineHeight: 1,
                perspective: "700px",
                ...style,
            }}
        >
            <motion.span
                style={{
                    position: "relative",
                    display: "inline-block",
                    height: FACE_H,
                    borderRadius: "0.32em",
                    background: pillBackground,
                    border: `1px solid ${pillBorder}`,
                    backdropFilter: glassBlur ? "blur(4px)" : undefined,
                    WebkitBackdropFilter: glassBlur ? "blur(4px)" : undefined,
                    boxShadow:
                        "0 4px 20px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.65)",
                }}
                animate={width != null ? { width } : undefined}
                transition={transition}
            >
                {/* Invisible in-flow copy of the current label: sizes the pill and
                    is measured for the width morph (keeps it solid under Framer
                    auto-layout, since the cube faces below are all absolute). */}
                <span
                    ref={sizerRef}
                    aria-hidden="true"
                    style={{
                        ...faceRow,
                        paddingLeft: PAD_X,
                        paddingRight: PAD_X,
                        visibility: "hidden",
                    }}
                >
                    <Face item={at(step)} showIcon={showIcon} />
                </span>

                {/* Tumbling cube */}
                <motion.span
                    style={{
                        position: "absolute",
                        inset: 0,
                        transformStyle: "preserve-3d",
                        willChange: "transform",
                    }}
                    animate={{ rotateX: -90 * step }}
                    transition={transition}
                >
                    {faces.map((s) => (
                        <motion.span
                            key={s}
                            style={{
                                ...faceRow,
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                transform: `translate(-50%, -50%) rotateX(${90 * s}deg) translateZ(${RADIUS})`,
                                backfaceVisibility: "hidden",
                            }}
                            initial={{ opacity: s === step ? 1 : 0 }}
                            animate={{ opacity: s === step ? 1 : 0 }}
                            transition={transition}
                        >
                            <Face item={at(s)} showIcon={showIcon} />
                        </motion.span>
                    ))}
                </motion.span>
            </motion.span>
        </span>
    )
}

addPropertyControls(RotatingPill, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Label",
                },
                icon: { type: ControlType.Image, title: "Icon" },
            },
        },
        defaultValue: [
            { name: "Claude" },
            { name: "Cursor" },
            { name: "Hermes" },
            { name: "OpenClaw" },
        ],
    },
    intervalSec: {
        type: ControlType.Number,
        title: "Hold Time",
        description: "Seconds each item stays before flipping.",
        defaultValue: 2.2,
        min: 0.5,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    flipSec: {
        type: ControlType.Number,
        title: "Flip Speed",
        description: "Seconds for one tumble. Lower is snappier.",
        defaultValue: 0.7,
        min: 0.1,
        max: 2,
        step: 0.05,
        unit: "s",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 48,
        min: 12,
        max: 160,
        step: 1,
        unit: "px",
    },
    fontWeight: {
        type: ControlType.Enum,
        title: "Weight",
        options: ["300", "400", "500", "600", "700"],
        optionTitles: ["Light", "Regular", "Medium", "Semibold", "Bold"],
        defaultValue: "500",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#171717",
    },
    pillBackground: {
        type: ControlType.Color,
        title: "Pill Fill",
        defaultValue: "rgba(255, 255, 255, 0.25)",
    },
    pillBorder: {
        type: ControlType.Color,
        title: "Pill Border",
        defaultValue: "rgba(255, 255, 255, 0.5)",
    },
    glassBlur: {
        type: ControlType.Boolean,
        title: "Glass Blur",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Show Icons",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
})
