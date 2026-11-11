// Image hover effect with scale-in animation from circular to square
// Relative image stays in place, absolute image scales from 0 to 1 with border-radius from 100% to 0
// No reverse animation on hover out

import { useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

interface ScaleInImageProps {
    image: {
        src: string
        alt: string
    }
    duration: number
    radius: number
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight any
 */
export default function ScaleInImage(props: ScaleInImageProps) {
    const {
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Image",
        },
        duration = 1,
        radius = 0,
    } = props

    const [isHovered, setIsHovered] = useState(false)
    const [key, setKey] = useState(0)
    const isStatic = useIsStaticRenderer()

    const handleMouseEnter = () => {
        if (isStatic) return
        startTransition(() => {
            setIsHovered(true)
            setKey((prev) => prev + 1)
        })
    }

    const handleMouseLeave = () => {
        if (isStatic) return
        startTransition(() => {
            setIsHovered(false)
        })
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: `${radius}px`,
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <img
                src={image.src}
                alt={image.alt}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                }}
            />

            {isHovered && !isStatic && (
                <motion.img
                    key={key}
                    src={image.src}
                    alt={image.alt}
                    initial={{
                        scale: 0,
                        borderRadius: "100%",
                    }}
                    animate={{
                        scale: 1,
                        borderRadius: `${radius}px`,
                    }}
                    transition={{
                        duration: duration,
                        ease: "easeOut",
                    }}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            )}
        </div>
    )
}

addPropertyControls(ScaleInImage, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
        unit: "s",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
})