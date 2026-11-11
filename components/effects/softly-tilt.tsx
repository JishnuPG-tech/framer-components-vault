// TiltCard.tsx — 3D cursor tilt with glare for Framer
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useRef, useState } from "react"

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 280
 * @framerIntrinsicHeight 360
 */
//@framerDisableUnlink
export default function SoftlyTilt(props) {
    const {
        image,
        radius,
        maxTilt,
        scale,
        glare,
        background,
        borderColor,
        borderWidth,
        slot,
        useSlot,
        style,
    } = props
    const ref = useRef(null)
    const [tf, setTf] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, lit: false })
    // Disable tilt/glare/mouse-tracking in static contexts (canvas, export, thumbnail).
    const isStatic = useIsStaticRenderer()

    const move = (e) => {
        if (isStatic) return
        const el = ref.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width
        const py = (e.clientY - r.top) / r.height
        setTf({
            rx: (0.5 - py) * maxTilt,
            ry: (px - 0.5) * maxTilt,
            gx: px * 100,
            gy: py * 100,
            lit: true,
        })
    }
    const leave = () => setTf({ rx: 0, ry: 0, gx: 50, gy: 50, lit: false })

    const content =
        useSlot && Array.isArray(slot) && slot.length > 0 ? slot[0] : null

    return (
        <div
            style={{
                perspective: 900,
                width: "100%",
                height: "100%",
                ...style,
            }}
        >
            <div
                ref={ref}
                onMouseMove={isStatic ? undefined : move}
                onMouseLeave={isStatic ? undefined : leave}
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: radius,
                    background: image
                        ? `center/cover no-repeat url(${image?.src ?? image})`
                        : background,
                    border: `${borderWidth}px solid ${borderColor}`,
                    transformStyle: "preserve-3d",
                    transform: isStatic
                        ? "none"
                        : `rotateX(${tf.rx}deg) rotateY(${tf.ry}deg) scale(${tf.lit ? scale : 1})`,
                    transition: "transform 0.15s ease",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {content ? (
                    <div style={{ position: "absolute", inset: 0 }}>
                        {content}
                    </div>
                ) : null}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        borderRadius: radius,
                        background: `radial-gradient(circle at ${tf.gx}% ${tf.gy}%, rgba(255,255,255,${glare}), transparent 55%)`,
                        opacity: isStatic ? 0 : tf.lit ? 1 : 0,
                        transition: "opacity 0.2s ease",
                    }}
                />
            </div>
        </div>
    )
}

SoftlyTilt.defaultProps = {
    image: null,
    useSlot: false,
    slot: null,
    radius: 18,
    maxTilt: 18,
    scale: 1.04,
    glare: 0.25,
    background: "linear-gradient(150deg,#1b1d29,#0e0f16)",
    borderColor: "#2a2c3a",
    borderWidth: 1,
}

addPropertyControls(SoftlyTilt, {
    useSlot: {
        type: ControlType.Boolean,
        title: "Content",
        enabledTitle: "Slot",
        disabledTitle: "Image",
        defaultValue: false,
    },
    slot: {
        type: ControlType.ComponentInstance,
        title: "Slot",
        hidden: (p) => !p.useSlot,
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        hidden: (p) => p.useSlot,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#16182a",
        hidden: (p) => p.useSlot,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 18,
        min: 0,
        max: 60,
        unit: "px",
    },
    maxTilt: {
        type: ControlType.Number,
        title: "Max tilt",
        defaultValue: 18,
        min: 0,
        max: 40,
        unit: "°",
    },
    scale: {
        type: ControlType.Number,
        title: "Hover scale",
        defaultValue: 1.04,
        min: 1,
        max: 1.2,
        step: 0.01,
    },
    glare: {
        type: ControlType.Number,
        title: "Glare",
        defaultValue: 0.25,
        min: 0,
        max: 0.8,
        step: 0.05,
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border",
        defaultValue: 1,
        min: 0,
        max: 6,
        unit: "px",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border color",
        defaultValue: "#2a2c3a",
        description:
            "More free & paid components at [Softly Supply](https://softly.supply)",
    },
})
