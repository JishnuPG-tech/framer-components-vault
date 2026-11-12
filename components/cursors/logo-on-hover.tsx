// Image hover component with CSS filters and custom cursor logo that follows mouse movement
import {
    useState,
    useRef,
    useEffect,
    startTransition,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useSpring } from "framer-motion"

interface ImageHoverFilterProps {
    image: {
        src: string
        alt?: string
    }
    objectFit: "fill" | "cover" | "contain" | "none" | "scale-down"
    filterType:
        | "grayscale"
        | "blur"
        | "brightness"
        | "contrast"
        | "saturate"
        | "sepia"
        | "hue-rotate"
        | "invert"
    filterStrength: number
    useSvgUpload: boolean
    logoSvg: string
    logoSvgFile: string
    logoOffsetX: number
    logoOffsetY: number
    cursorTransition: any
    enableZoom: boolean
    zoomScale: number
    enableRotate: boolean
    rotateAngle: number
    blendMode: string
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ImageHoverFilter(props: ImageHoverFilterProps) {
    const {
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Image",
        },
        objectFit = "cover",
        filterType = "grayscale",
        filterStrength = 100,
        useSvgUpload = false,
        logoSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
        logoSvgFile = "",
        logoOffsetX = 20,
        logoOffsetY = 20,
        cursorTransition,
        enableZoom = false,
        zoomScale = 1.1,
        enableRotate = false,
        rotateAngle = 5,
        blendMode = "normal",
    } = props

    const [isHovered, setIsHovered] = useState(false)
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
    const [svgContent, setSvgContent] = useState(logoSvg)
    const containerRef = useRef<HTMLDivElement>(null)

    // Add spring animation for delayed follow effect
    const springX = useSpring(0, { stiffness: 150, damping: 20 })
    const springY = useSpring(0, { stiffness: 150, damping: 20 })

    useEffect(() => {
        springX.set(cursorPosition.x)
        springY.set(cursorPosition.y)
    }, [cursorPosition.x, cursorPosition.y, springX, springY])

    // Fetch SVG content from uploaded file
    useEffect(() => {
        if (useSvgUpload && logoSvgFile) {
            fetch(logoSvgFile)
                .then((response) => response.text())
                .then((text) => {
                    startTransition(() => {
                        setSvgContent(text)
                    })
                })
                .catch((error) => {
                    console.error("Error loading SVG file:", error)
                    startTransition(() => {
                        setSvgContent(logoSvg)
                    })
                })
        } else {
            startTransition(() => {
                setSvgContent(logoSvg)
            })
        }
    }, [useSvgUpload, logoSvgFile, logoSvg])

    const getFilterValue = () => {
        switch (filterType) {
            case "grayscale":
                return `grayscale(${filterStrength}%)`
            case "blur":
                return `blur(${filterStrength / 10}px)`
            case "brightness":
                return `brightness(${filterStrength}%)`
            case "contrast":
                return `contrast(${filterStrength}%)`
            case "saturate":
                return `saturate(${filterStrength}%)`
            case "sepia":
                return `sepia(${filterStrength}%)`
            case "hue-rotate":
                return `hue-rotate(${filterStrength * 3.6}deg)`
            case "invert":
                return `invert(${filterStrength}%)`
            default:
                return "none"
        }
    }

    const getTransform = () => {
        const transforms = []

        if (isHovered && enableZoom) {
            transforms.push(`scale(${zoomScale})`)
        }

        if (isHovered && enableRotate) {
            transforms.push(`rotate(${rotateAngle}deg)`)
        }

        return transforms.length > 0 ? transforms.join(" ") : "none"
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        startTransition(() => {
            setCursorPosition({ x, y })
        })
    }

    const handleMouseEnter = () => {
        startTransition(() => {
            setIsHovered(true)
        })
    }

    const handleMouseLeave = () => {
        startTransition(() => {
            setIsHovered(false)
        })
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                cursor: "pointer",
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <img
                src={image.src}
                alt={image.alt || ""}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: objectFit,
                    filter: isHovered ? getFilterValue() : "none",
                    transform: getTransform(),
                    transition: "filter 0.3s ease, transform 0.3s ease",
                }}
            />

            {isHovered && (
                <motion.div
                    style={{
                        position: "absolute",
                        left: springX,
                        top: springY,
                        x: logoOffsetX,
                        y: logoOffsetY,
                        width: 40,
                        height: 40,
                        pointerEvents: "none",
                        transform: "translate(-50%, -50%)",
                        color: "#FFFFFF",
                        mixBlendMode: blendMode as any,
                    }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={cursorTransition}
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                />
            )}
        </div>
    )
}

addPropertyControls(ImageHoverFilter, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["fill", "cover", "contain", "none", "scale-down"],
        optionTitles: ["Fill", "Cover", "Contain", "None", "Scale Down"],
        defaultValue: "cover",
    },
    filterType: {
        type: ControlType.Enum,
        title: "Filter Type",
        options: [
            "grayscale",
            "blur",
            "brightness",
            "contrast",
            "saturate",
            "sepia",
            "hue-rotate",
            "invert",
        ],
        optionTitles: [
            "Grayscale",
            "Blur",
            "Brightness",
            "Contrast",
            "Saturate",
            "Sepia",
            "Hue Rotate",
            "Invert",
        ],
        defaultValue: "grayscale",
    },
    filterStrength: {
        type: ControlType.Number,
        title: "Filter Strength",
        defaultValue: 100,
        min: 0,
        max: 100,
        step: 1,
    },
    useSvgUpload: {
        type: ControlType.Boolean,
        title: "Logo Input",
        defaultValue: false,
        enabledTitle: "Upload",
        disabledTitle: "Paste",
    },
    logoSvgFile: {
        type: ControlType.File,
        title: "Logo SVG File",
        allowedFileTypes: ["svg"],
        hidden: ({ useSvgUpload }) => !useSvgUpload,
    },
    logoSvg: {
        type: ControlType.String,
        title: "Logo SVG",
        displayTextArea: true,
        defaultValue:
            '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
        hidden: ({ useSvgUpload }) => useSvgUpload,
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Blend Mode",
        options: [
            "normal",
            "multiply",
            "screen",
            "overlay",
            "darken",
            "lighten",
            "color-dodge",
            "color-burn",
            "hard-light",
            "soft-light",
            "difference",
            "exclusion",
            "hue",
            "saturation",
            "color",
            "luminosity",
        ],
        optionTitles: [
            "Normal",
            "Multiply",
            "Screen",
            "Overlay",
            "Darken",
            "Lighten",
            "Color Dodge",
            "Color Burn",
            "Hard Light",
            "Soft Light",
            "Difference",
            "Exclusion",
            "Hue",
            "Saturation",
            "Color",
            "Luminosity",
        ],
        defaultValue: "normal",
    },
    logoOffsetX: {
        type: ControlType.Number,
        title: "Offset X",
        defaultValue: 20,
        min: -100,
        max: 100,
        step: 1,
    },
    logoOffsetY: {
        type: ControlType.Number,
        title: "Offset Y",
        defaultValue: 20,
        min: -100,
        max: 100,
        step: 1,
    },
    cursorTransition: {
        type: ControlType.Transition,
        title: "Cursor Transition",
    },
    enableZoom: {
        type: ControlType.Boolean,
        title: "Enable Zoom",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    zoomScale: {
        type: ControlType.Number,
        title: "Zoom Scale",
        defaultValue: 1.1,
        min: 1,
        max: 2,
        step: 0.1,
        hidden: ({ enableZoom }) => !enableZoom,
    },
    enableRotate: {
        type: ControlType.Boolean,
        title: "Enable Rotate",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    rotateAngle: {
        type: ControlType.Number,
        title: "Rotate Angle",
        defaultValue: 5,
        min: -180,
        max: 180,
        step: 1,
        unit: "deg",
        hidden: ({ enableRotate }) => !enableRotate,
    },
})
