// Polaroid-style 3D flip card with hover tilt & click-to-flip
import React, {
    useState,
    useRef,
    useCallback,
    type CSSProperties,
    type MouseEvent,
} from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
    image: string
    caption: string
    backNote: string
    framePadding: number
    bottomPadding: number
    frameColor: string
    imageFit: "cover" | "contain" | "fill"
    captionFont: any
    captionColor: string
    noteFont: any
    noteColor: string
    borderEnabled: boolean
    borderColor: string
    borderWidth: number
    radius: number
    shadowStrength: number
    tiltStrength: number
    style?: CSSProperties
}

// ─── Springs ─────────────────────────────────────────────────────────────────

const TILT_SPRING = { damping: 30, stiffness: 120, mass: 0.8 }
const FLIP_SPRING = {
    type: "spring" as const,
    damping: 24,
    stiffness: 240,
    mass: 0.7,
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 340
 * @framerIntrinsicHeight 400
 */
export default function PolaroidFlipCard(props: Props) {
    const {
        image = "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        caption = "12/07/24",
        backNote = "Nice to meet you ♡",
        framePadding = 12,
        bottomPadding = 64,
        frameColor = "#ffffff",
        imageFit = "cover",
        captionFont,
        captionColor = "#333333",
        noteFont,
        noteColor = "#333333",
        borderEnabled = false,
        borderColor = "#e0e0e0",
        borderWidth = 1,
        radius = 4,
        shadowStrength = 0.2,
        tiltStrength = 15,
        style,
    } = props

    const [isFlipped, setIsFlipped] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    // ── Tilt ─────────────────────────────────────────────────────────────
    const mx = useMotionValue(0)
    const my = useMotionValue(0)
    const tiltX = useSpring(
        useTransform(my, [-0.5, 0.5], [tiltStrength, -tiltStrength]),
        TILT_SPRING
    )
    const tiltY = useSpring(
        useTransform(mx, [-0.5, 0.5], [-tiltStrength, tiltStrength]),
        TILT_SPRING
    )

    const onMove = useCallback(
        (e: MouseEvent<HTMLDivElement>) => {
            if (!ref.current) return
            const r = ref.current.getBoundingClientRect()
            mx.set((e.clientX - r.left) / r.width - 0.5)
            my.set((e.clientY - r.top) / r.height - 0.5)
        },
        [mx, my]
    )

    const onLeave = useCallback(() => {
        mx.set(0)
        my.set(0)
    }, [mx, my])

    const onClick = useCallback(() => {
        mx.set(0)
        my.set(0)
        setIsFlipped((f) => !f)
    }, [mx, my])

    // ── Derived ──────────────────────────────────────────────────────────
    const border = borderEnabled
        ? `${borderWidth}px solid ${borderColor}`
        : "none"
    const captionHeight = bottomPadding - framePadding
    const innerRadius = Math.max(0, radius - 2)
    const shadow = `0 8px 24px rgba(0,0,0,${shadowStrength}), 0 2px 8px rgba(0,0,0,${shadowStrength * 0.5})`

    const face: CSSProperties = {
        position: "absolute",
        inset: 0,
        background: frameColor,
        borderRadius: radius,
        border,
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        overflow: "hidden",
        boxShadow: shadow,
    }

    const textBase: CSSProperties = {
        margin: 0,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        textAlign: "center",
    }

    // ── Render ───────────────────────────────────────────────────────────
    return (
        <div
            ref={ref}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            onClick={onClick}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                perspective: 1000,
                cursor: "pointer",
            }}
        >
            {/* Tilt layer — always active */}
            <motion.div
                style={{
                    position: "absolute",
                    inset: 0,
                    transformStyle: "preserve-3d",
                    rotateX: tiltX,
                    rotateY: tiltY,
                }}
            >
                {/* Flip layer */}
                <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={FLIP_SPRING}
                    style={{
                        position: "absolute",
                        inset: 0,
                        transformStyle: "preserve-3d",
                    }}
                >
                    {/* Front */}
                    <div style={face}>
                        <div
                            style={{
                                position: "absolute",
                                top: framePadding,
                                left: framePadding,
                                right: framePadding,
                                bottom: bottomPadding,
                                borderRadius: innerRadius,
                                overflow: "hidden",
                                background:
                                    imageFit === "contain"
                                        ? "#f0f0f0"
                                        : "transparent",
                            }}
                        >
                            <img
                                src={image}
                                alt={caption || "Polaroid photo"}
                                draggable={false}
                                loading="lazy"
                                style={{
                                    display: "block",
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: imageFit,
                                    objectPosition: "center",
                                    userSelect: "none",
                                    pointerEvents: "none",
                                }}
                            />
                        </div>
                        {caption && (
                            <div
                                style={{
                                    position: "absolute",
                                    left: framePadding + 4,
                                    right: framePadding + 4,
                                    bottom: 0,
                                    height: captionHeight,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <p
                                    style={{
                                        ...textBase,
                                        width: "100%",
                                        lineHeight: 1.3,
                                        fontSize: 20,
                                        ...(captionFont &&
                                        typeof captionFont === "object"
                                            ? captionFont
                                            : {}),
                                        color: captionColor,
                                    }}
                                >
                                    {caption}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Back */}
                    <div
                        style={{
                            ...face,
                            transform: "rotateY(180deg)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <p
                            style={{
                                ...textBase,
                                maxWidth: "80%",
                                lineHeight: 1.5,
                                fontSize: 20,
                                ...(noteFont && typeof noteFont === "object"
                                    ? noteFont
                                    : {}),
                                color: noteColor,
                            }}
                        >
                            {backNote}
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    )
}

// ─── Property Controls ───────────────────────────────────────────────────────

addPropertyControls(PolaroidFlipCard, {
    image: {
        type: ControlType.Image,
        title: "Photo",
    },
    caption: {
        type: ControlType.String,
        title: "Caption",
        placeholder: "Front caption…",
        defaultValue: "12/07/24",
    },
    backNote: {
        type: ControlType.String,
        title: "Back Note",
        placeholder: "Write something…",
        defaultValue: "Nice to meet you ♡",
        displayTextArea: true,
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
        defaultValue: "cover",
    },
    framePadding: {
        type: ControlType.Number,
        title: "Frame Padding",
        min: 4,
        max: 30,
        step: 1,
        unit: "px",
        defaultValue: 12,
    },
    bottomPadding: {
        type: ControlType.Number,
        title: "Caption Area",
        min: 20,
        max: 120,
        step: 2,
        unit: "px",
        defaultValue: 64,
    },
    frameColor: {
        type: ControlType.Color,
        title: "Frame Color",
        defaultValue: "#ffffff",
    },
    radius: {
        type: ControlType.Number,
        title: "Corner Radius",
        min: 0,
        max: 30,
        step: 1,
        unit: "px",
        defaultValue: 4,
    },
    borderEnabled: {
        type: ControlType.Boolean,
        title: "Border",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#e0e0e0",
        hidden: (p: any) => !p.borderEnabled,
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        min: 1,
        max: 8,
        step: 1,
        unit: "px",
        defaultValue: 1,
        hidden: (p: any) => !p.borderEnabled,
    },
    shadowStrength: {
        type: ControlType.Number,
        title: "Shadow",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.2,
    },
    tiltStrength: {
        type: ControlType.Number,
        title: "Tilt Amount",
        description: "3D tilt intensity on hover",
        min: 0,
        max: 30,
        step: 1,
        unit: "°",
        defaultValue: 15,
    },
    captionFont: {
        type: ControlType.Font,
        title: "Caption Font",
        defaultFontType: "sans-serif",
        controls: "extended",
    } as any,
    captionColor: {
        type: ControlType.Color,
        title: "Caption Color",
        defaultValue: "#333333",
    },
    noteFont: {
        type: ControlType.Font,
        title: "Note Font",
        defaultFontType: "sans-serif",
        controls: "extended",
    } as any,
    noteColor: {
        type: ControlType.Color,
        title: "Note Color",
        defaultValue: "#333333",
    },
})
