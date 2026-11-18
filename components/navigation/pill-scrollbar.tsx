import { motion, useScroll } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface PillScrollBarProps {
    progressColor: string
    unprogressColor: string
    radius: number // 🚨 Added Radius state control
    style?: React.CSSProperties
}

/**
 * Custom Framer Component: PillScrollBar
 * Clean state: Tracks page scroll smoothly, safely resizable via Framer UI.
 */
export default function PillScrollBar(props: PillScrollBarProps) {
    const { scrollYProgress } = useScroll()

    // Canvas Check: Show 50% split on design canvas, track scroll in preview/live
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const finalScaleY = isCanvas ? 0.5 : scrollYProgress

    return (
        <div
            style={{
                ...props.style, // Inherits Framer's sizing directly
                backgroundColor: props.unprogressColor,
                borderRadius: `${props.radius}px`, // 🚨 Dynamic editable radius mapping
                overflow: "hidden",
                position: "relative",
            }}
        >
            <motion.div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: props.progressColor,
                    originY: 0, // Fill starts from the top
                    scaleY: finalScaleY,
                }}
            />
        </div>
    )
}

// Default styles matching your specifications
PillScrollBar.defaultProps = {
    unprogressColor: "#E5E5E5",
    progressColor: "#000000",
    radius: 100, // 🚨 Default pill capsule radius setting
}

// Safe property controls that will never break the preview engine
addPropertyControls(PillScrollBar, {
    unprogressColor: {
        type: ControlType.Color,
        title: "Unprogress",
    },
    progressColor: {
        type: ControlType.Color,
        title: "Progress",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 500,
        step: 1,
    },
})
