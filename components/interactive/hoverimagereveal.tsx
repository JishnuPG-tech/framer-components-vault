import * as React from "react"
import {
    motion,
    useMotionValue,
    useSpring,
    useMotionTemplate,
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
 * SPOTLIGHT REVEAL
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 * @framerDisableUnusedStyles
 */
export default function SpotlightReveal(props) {
    const {
        image,
        imageFit,
        maskSize,
        maskSoftness,
        background,
        blendMode,
        springStiffness,
        springDamping,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // Smooth motion setup
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const opacity = useMotionValue(isCanvas ? 0.5 : 0)

    const springConfig = { stiffness: springStiffness, damping: springDamping }
    const smoothX = useSpring(mouseX, springConfig)
    const smoothY = useSpring(mouseY, springConfig)
    const smoothOpacity = useSpring(opacity, { stiffness: 300, damping: 30 })

    // Dynamic Gradient Mask
    const maskImage = useMotionTemplate`radial-gradient(circle ${maskSize}px at ${smoothX}px ${smoothY}px, black 0%, black ${100 - maskSoftness}%, transparent 100%)`

    const handleMouseMove = (event) => {
        if (isCanvas) return
        const rect = event.currentTarget.getBoundingClientRect()
        mouseX.set(event.clientX - rect.left)
        mouseY.set(event.clientY - rect.top)
    }

    const handleMouseEnter = () => !isCanvas && opacity.set(1)
    const handleMouseLeave = () => !isCanvas && opacity.set(0)

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                backgroundColor: background,
                overflow: "hidden",
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* The Hidden Image Layer */}
            {image && (
                <motion.img
                    src={image}
                    alt="Reveal"
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: imageFit.toLowerCase(),
                        WebkitMaskImage: maskImage,
                        maskImage: maskImage,
                        opacity: smoothOpacity,
                        pointerEvents: "none",
                        mixBlendMode: blendMode,
                    }}
                />
            )}
        </div>
    )
}

// Default values for a "Premium" look
SpotlightReveal.defaultProps = {
    maskSize: 200,
    maskSoftness: 40,
    background: "#000000",
    imageFit: "cover",
    blendMode: "normal",
    springStiffness: 400,
    springDamping: 40,
}

// Grouped Property Controls
addPropertyControls(SpotlightReveal, {
    image: {
        type: ControlType.Image,
        title: "Reveal Image",
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Stretch"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
    background: {
        type: ControlType.Color,
        title: "BG Color",
        defaultValue: "#000000",
    },
    maskSize: {
        type: ControlType.Number,
        title: "Size",
        min: 10,
        max: 800,
        defaultValue: 200,
        unit: "px",
    },
    maskSoftness: {
        type: ControlType.Number,
        title: "Softness",
        min: 0,
        max: 100,
        defaultValue: 40,
        unit: "%",
        displaySegmentedControl: false,
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Blending",
        options: ["normal", "multiply", "screen", "overlay", "difference"],
        defaultValue: "normal",
    },
    springStiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        min: 0,
        max: 1000,
        defaultValue: 400,
        group: "Physics",
    },
    springDamping: {
        type: ControlType.Number,
        title: "Damping",
        min: 0,
        max: 100,
        defaultValue: 40,
        group: "Physics",
    },
})
