import { useState, useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ImageMagnifierProps {
    image: {
        src: string
        alt: string
    }
    magnification: number
    magnifierSize: number
    magnifierBorderWidth: number
    magnifierBorderColor: string
    magnifierShadow: boolean
    magnifierShape: "circle" | "square"
    style?: CSSProperties
}

/**
 * Image Magnifier
 *
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ImageMagnifier(props: ImageMagnifierProps) {
    const {
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Sample image",
        },
        magnification = 2,
        magnifierSize = 150,
        magnifierBorderWidth = 2,
        magnifierBorderColor = "#FFFFFF",
        magnifierShadow = true,
        magnifierShape = "circle",
        style,
    } = props

    const [showMagnifier, setShowMagnifier] = useState(false)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const imageRef = useRef<HTMLImageElement>(null)

    const handleMouseEnter = () => {
        setShowMagnifier(true)
    }

    const handleMouseLeave = () => {
        setShowMagnifier(false)
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imageRef.current) return

        const rect = imageRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        setMousePosition({ x, y })
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                cursor: "none",
                ...style,
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
        >
            <img
                ref={imageRef}
                src={image.src}
                alt={image.alt}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                }}
            />

            {showMagnifier && (
                <div
                    style={{
                        position: "absolute",
                        left: `${mousePosition.x}%`,
                        top: `${mousePosition.y}%`,
                        width: `${magnifierSize}px`,
                        height: `${magnifierSize}px`,
                        transform: "translate(-50%, -50%)",
                        border: `${magnifierBorderWidth}px solid ${magnifierBorderColor}`,
                        borderRadius: magnifierShape === "circle" ? "50%" : "0%",
                        backgroundImage: `url(${image.src})`,
                        backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
                        backgroundSize: `${magnification * 100}%`,
                        backgroundRepeat: "no-repeat",
                        pointerEvents: "none",
                        boxShadow: magnifierShadow
                            ? "0 4px 12px rgba(0,0,0,0.3)"
                            : "none",
                        zIndex: 10,
                    }}
                />
            )}
        </div>
    )
}

addPropertyControls(ImageMagnifier, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    magnification: {
        type: ControlType.Number,
        title: "Zoom Level",
        defaultValue: 2,
        min: 1.5,
        max: 5,
        step: 0.5,
    },
    magnifierSize: {
        type: ControlType.Number,
        title: "Magnifier Size",
        defaultValue: 150,
        min: 50,
        max: 300,
        step: 10,
        unit: "px",
    },
    magnifierShape: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["circle", "square"],
        optionTitles: ["Circle", "Square"],
        defaultValue: "circle",
        displaySegmentedControl: true,
    },
    magnifierBorderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 2,
        min: 0,
        max: 10,
        step: 1,
        unit: "px",
    },
    magnifierBorderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#FFFFFF",
    },
    magnifierShadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
