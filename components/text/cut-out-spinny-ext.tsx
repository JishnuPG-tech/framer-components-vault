// Three layer component with image background, animated middle layer, and image overlay
import { useState, useEffect, startTransition, useRef, useMemo, type CSSProperties } from "react"
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


interface LayeredImageProps {
    backgroundImage: { src: string; alt: string }
    overlayImage: { src: string; alt: string }
    rotatingTextContent: string
    rotatingTextColor: string
    rotatingTextFont: any
    rotatingTextSpeed: number
    rotatingTextAnchorX: number
    rotatingTextAnchorY: number
    rotatingTextDirection: "clockwise" | "counterclockwise"
    rotatingTextSize: number
    rotatingTextOpacity: number
    overlayOpacity: number
    borderRadius: number
    style?: CSSProperties
}

/**
 * Three Layer Component
 * 
 * A component with three layers: background image, rotating text middle layer, and overlay image
 *
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 200
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function LayeredImage(props: LayeredImageProps) {
    const {
        backgroundImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Background image"
        },
        overlayImage = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Overlay image"
        },
        rotatingTextContent = "ROTATING TEXT • ",
        rotatingTextColor = "#FFFFFF",
        rotatingTextFont,
        rotatingTextSpeed = 10,
        rotatingTextAnchorX = 50,
        rotatingTextAnchorY = 50,
        rotatingTextDirection = "clockwise",
        rotatingTextSize = 60,
        rotatingTextOpacity = 1,
        overlayOpacity = 0.8,
        borderRadius = 0
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const [containerWidth, setContainerWidth] = useState(300)
    const rotationDirection = rotatingTextDirection === "clockwise" ? 360 : -360
    
    // Calculate actual size based on percentage of container width
    const actualSize = (rotatingTextSize / 100) * containerWidth
    const radius = actualSize * 0.35
    const circumference = 2 * Math.PI * radius
    
    // Extract font properties with fallbacks
    const {
        fontFamily = "system-ui, sans-serif",
        fontWeight = 400,
        fontStyle = "normal",
        fontSize: fontSizeFromControl,
        letterSpacing = "0.05em"
    } = rotatingTextFont || {}
    
    // Calculate font size - use control value if provided, otherwise scale with ring
    const baseFontSize = fontSizeFromControl ? parseInt(fontSizeFromControl) : actualSize * 0.06
    
    // Calculate repetitions needed to fill the circle
    // Estimate character width as ~0.6em for typical fonts
    const avgCharWidth = baseFontSize * 0.6
    const textLength = rotatingTextContent.length * avgCharWidth
    const repetitions = Math.max(3, Math.ceil(circumference / textLength) + 1)
    const fullText = rotatingTextContent.repeat(repetitions)

    useEffect(() => {
        if (containerRef.current) {
            const updateWidth = () => {
                if (containerRef.current) {
                    startTransition(() => setContainerWidth(containerRef.current!.offsetWidth))
                }
            }
            updateWidth()
            window.addEventListener("resize", updateWidth)
            return () => window.removeEventListener("resize", updateWidth)
        }
    }, [])

    // Common SVG props
    const svgViewBox = `0 0 ${actualSize} ${actualSize}`
    const textPathD = `M ${actualSize / 2}, ${actualSize / 2} m -${radius}, 0 a ${radius},${radius} 0 1,1 ${radius * 2},0 a ${radius},${radius} 0 1,1 -${radius * 2},0`
    
    const textStyle = useMemo(() => ({
        fontSize: baseFontSize,
        fontFamily,
        fontWeight,
        fontStyle,
        letterSpacing
    }), [baseFontSize, fontFamily, fontWeight, fontStyle, letterSpacing])

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: `${borderRadius}px`
            }}
        >
            {/* Background Layer - Image */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url(${backgroundImage.src})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    zIndex: 1
                }}
                role="img"
                aria-label={backgroundImage.alt}
            />

            {/* Middle Layer - Rotating Text */}
            <div
                style={{
                    position: "absolute",
                    top: `${rotatingTextAnchorY}%`,
                    left: `${rotatingTextAnchorX}%`,
                    transform: "translate(-50%, -50%)",
                    zIndex: 2,
                    opacity: rotatingTextOpacity
                }}
            >
                {isStatic ? (
                    <svg
                        width={actualSize}
                        height={actualSize}
                        viewBox={svgViewBox}
                    >
                        <defs>
                            <path
                                id="staticTextPath"
                                d={textPathD}
                            />
                        </defs>
                        <text
                            fill={rotatingTextColor}
                            style={textStyle}
                        >
                            <textPath href="#staticTextPath">
                                {fullText}
                            </textPath>
                        </text>
                    </svg>
                ) : (
                    <motion.svg
                        width={actualSize}
                        height={actualSize}
                        viewBox={svgViewBox}
                        animate={{ rotate: rotationDirection }}
                        transition={{
                            duration: rotatingTextSpeed,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    >
                        <defs>
                            <path
                                id="textPath"
                                d={textPathD}
                            />
                        </defs>
                        <text
                            fill={rotatingTextColor}
                            style={textStyle}
                        >
                            <textPath href="#textPath">
                                {fullText}
                            </textPath>
                        </text>
                    </motion.svg>
                )}
            </div>

            {/* Top Layer - Overlay Image */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url(${overlayImage.src})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: overlayOpacity,
                    zIndex: 3,
                    mixBlendMode: "normal"
                }}
                role="img"
                aria-label={overlayImage.alt}
            />
        </div>
    )
}

addPropertyControls(LayeredImage, {
    backgroundImage: {
        type: ControlType.ResponsiveImage,
        title: "Background Image"
    },
    overlayImage: {
        type: ControlType.ResponsiveImage,
        title: "Overlay Image"
    },
    rotatingTextContent: {
        type: ControlType.String,
        title: "Text Content",
        defaultValue: "ROTATING TEXT • ",
        placeholder: "Enter text..."
    },
    rotatingTextColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF"
    },
    rotatingTextFont: {
        type: ControlType.Font,
        title: "Text Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            variant: "Bold",
            fontSize: "14px",
            letterSpacing: "0.1em"
        }
    },
    rotatingTextSpeed: {
        type: ControlType.Number,
        title: "Rotation Speed",
        defaultValue: 10,
        min: 1,
        max: 60,
        step: 1,
        unit: "s"
    },
    rotatingTextDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["clockwise", "counterclockwise"],
        optionTitles: ["Clockwise", "Counter-Clockwise"],
        defaultValue: "clockwise",
        displaySegmentedControl: true
    },
    rotatingTextAnchorX: {
        type: ControlType.Number,
        title: "Anchor X Position",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%"
    },
    rotatingTextAnchorY: {
        type: ControlType.Number,
        title: "Anchor Y Position",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%"
    },
    rotatingTextSize: {
        type: ControlType.Number,
        title: "Text Ring Size",
        defaultValue: 60,
        min: 10,
        max: 100,
        step: 1,
        unit: "%"
    },
    rotatingTextOpacity: {
        type: ControlType.Number,
        title: "Text Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.1
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay Opacity",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.1
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 0,
        min: 0,
        max: 50,
        step: 1,
        unit: "px"
    }
})