// Component that displays a blurred floating image that unblurs on hover
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

import type { CSSProperties } from "react"

interface FloatingImageProps {
    image: {
        src: string
        alt?: string
    }
    image2: {
        src: string
        alt?: string
    }
    blurAmount: number
    floatDistance: number
    floatDuration: number
    unblurDuration: number
    borderRadius: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function FloatingImage(props: FloatingImageProps) {
    const {
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Gradient 1 - Blue",
        },
        image2 = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Gradient 2 - Purple",
        },
        blurAmount,
        floatDistance,
        floatDuration,
        unblurDuration,
        borderRadius,
    } = props

    return (
        <motion.div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
            animate={{
                y: [0, -floatDistance, 0],
            }}
            transition={{
                duration: floatDuration,
                repeat: Infinity,
                ease: "easeInOut",
            }}
            whileHover={{
                scale: 0.95,
                z: -20,
            }}
        >
            <motion.div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    borderRadius,
                    overflow: "hidden",
                }}
            >
                <motion.img
                    src={image.src}
                    alt={image.alt || ""}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        position: "absolute",
                        top: 0,
                        left: 0,
                    }}
                    initial={{
                        filter: `blur(${blurAmount}px)`,
                        opacity: 1,
                    }}
                    whileHover={{
                        opacity: 0,
                    }}
                    transition={{
                        duration: unblurDuration,
                        ease: "easeOut",
                    }}
                />
                <motion.img
                    src={image2.src}
                    alt={image2.alt || ""}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        position: "absolute",
                        top: 0,
                        left: 0,
                    }}
                    initial={{
                        opacity: 0,
                    }}
                    whileHover={{
                        opacity: 1,
                    }}
                    transition={{
                        duration: unblurDuration,
                        ease: "easeOut",
                    }}
                />
            </motion.div>
        </motion.div>
    )
}

addPropertyControls(FloatingImage, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image 1 (Blurred)",
    },
    image2: {
        type: ControlType.ResponsiveImage,
        title: "Image 2 (Hover)",
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur Amount",
        defaultValue: 20,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    floatDistance: {
        type: ControlType.Number,
        title: "Float Distance",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    floatDuration: {
        type: ControlType.Number,
        title: "Float Duration",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    unblurDuration: {
        type: ControlType.Number,
        title: "Unblur Duration",
        defaultValue: 0.4,
        min: 0.1,
        max: 2,
        step: 0.1,
        unit: "s",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 8,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
})