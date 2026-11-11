// Zoom Image component that magnifies content on hover with cursor-based transform origin
import { motion } from "framer-motion"
import { useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ZoomImageProps {
    image: { src: string; alt?: string }
    zoomScale: number
    transition: any // New property for full transition object
    backgroundColor: string
    borderRadius: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 200
 */
export default function ZoomImage(props: ZoomImageProps) {
    const {
        image = { src: "https://framerusercontent.com/images/70D908ZnP0cnDre3T7DlePO12M.jpeg", alt: "3D Gradient Waves" },
        zoomScale,
        transition,
        backgroundColor,
        borderRadius,
    } = props

    const [isHovered, setIsHovered] = useState(false)
    const isStatic = useIsStaticRenderer()

    const zoomInStyle = {
        scale: zoomScale,
    }

    const zoomOutStyle = {
        scale: 1,
    }

    const updateTransformOrigin = (e) => {
        if (isStatic) return
        
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const childElement = e.currentTarget.firstChild
        
        if (childElement) {
            // Only set transformOrigin, do not set transition here
            childElement.style.transformOrigin = `${x}px ${y}px`
        }
    }

    const handleMouseEnter = () => {
        if (!isStatic) {
            startTransition(() => setIsHovered(true))
        }
    }

    const handleMouseLeave = () => {
        if (!isStatic) {
            startTransition(() => setIsHovered(false))
        }
    }

    return (
        <motion.div
            style={{
                ...props.style,
                overflow: "hidden",
                position: "relative",
                backgroundColor,
                borderRadius,
                width: "100%",
                height: "100%",
            }}
            onMouseMove={isStatic ? undefined : updateTransformOrigin}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                animate={isHovered ? zoomInStyle : zoomOutStyle}
                transition={transition}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <img
                    {...image}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: undefined, // Remove inline transition
                    }}
                />
            </motion.div>
        </motion.div>
    )
}

addPropertyControls(ZoomImage, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    zoomScale: {
        type: ControlType.Number,
        title: "Zoom Scale",
        defaultValue: 2.5,
        min: 1.1,
        max: 5,
        step: 0.1,
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: { duration: 0.1, ease: "easeInOut" },
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
})