// Clean, minimalist Polaroid wind chime with 5 hanging images (3 standard, 2 smaller)
import { motion, useAnimation } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useRef, useEffect, type CSSProperties } from "react"

interface SwayloidProps {
    image1: { src: string; alt: string }
    image2: { src: string; alt: string }
    image3: { src: string; alt: string }
    image4: { src: string; alt: string }
    image5: { src: string; alt: string }
    caption1: string
    caption2: string
    caption3: string
    caption4: string
    caption5: string
    lineColor: string
    lineThickness: number
    connectorColor: string
    connectorThickness: number
    polaroidBackground: string
    captionColor: string
    captionFont: CSSProperties
    imageBackgroundColor: string
    spacing: number
    swingIntensity: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function Swayloid(props: SwayloidProps) {
    const {
        image1 = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Gradient 1",
        },
        image2 = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Gradient 2",
        },
        image3 = {
            src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            alt: "Adventure",
        },
        image4 = {
            src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            alt: "Gradient 4",
        },
        image5 = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Gradient 5",
        },
        caption1,
        caption2,
        caption3,
        caption4,
        caption5,
        lineColor,
        lineThickness,
        connectorColor,
        connectorThickness,
        polaroidBackground,
        captionColor,
        captionFont,
        imageBackgroundColor,
        spacing,
        swingIntensity,
    } = props

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const polaroids = [
        { image: image1, caption: caption1, isSmall: false },
        { image: image2, caption: caption2, isSmall: true },
        { image: image3, caption: caption3, isSmall: false },
        { image: image4, caption: caption4, isSmall: true },
        { image: image5, caption: caption5, isSmall: false },
    ]

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                overflow: "visible",
            }}
        >
            <div
                style={{
                    width: "100%",
                    height: lineThickness,
                    backgroundColor: lineColor,
                    position: "absolute",
                    top: 0,
                }}
            />

            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-evenly",
                    alignItems: "flex-start",
                    gap: spacing,
                    width: "100%",
                    paddingTop: lineThickness + 10,
                }}
            >
                {polaroids.map((polaroid, index) => {
                    const connectorHeight = 40 + index * 10
                    const polaroidSize = polaroid.isSmall ? 120 : 160
                    
                    return (
                        <PolaroidCard
                            key={index}
                            polaroid={polaroid}
                            index={index}
                            connectorHeight={connectorHeight}
                            polaroidSize={polaroidSize}
                            connectorThickness={connectorThickness}
                            connectorColor={connectorColor}
                            polaroidBackground={polaroidBackground}
                            captionColor={captionColor}
                            captionFont={captionFont}
                            imageBackgroundColor={imageBackgroundColor}
                            swingIntensity={swingIntensity}
                        />
                    )
                })}
            </div>
        </div>
    )
}

interface PolaroidCardProps {
    polaroid: any
    index: number
    connectorHeight: number
    polaroidSize: number
    connectorThickness: number
    connectorColor: string
    polaroidBackground: string
    captionColor: string
    captionFont: CSSProperties
    imageBackgroundColor: string
    swingIntensity: number
}

function PolaroidCard({
    polaroid,
    index,
    connectorHeight,
    polaroidSize,
    connectorThickness,
    connectorColor,
    polaroidBackground,
    captionColor,
    captionFont,
    imageBackgroundColor,
    swingIntensity,
}: PolaroidCardProps) {
    const controls = useAnimation()
    const [isHovered, setIsHovered] = useState(false)

    useEffect(() => {
        if (isHovered) {
            // Start continuous swinging motion
            controls.start({
                rotate: [0, swingIntensity * 0.5, -swingIntensity * 0.5, swingIntensity * 0.3, -swingIntensity * 0.3, 0],
                y: [0, 4, 0, -4, 0, 2, 0],
                transition: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    repeatType: "loop",
                },
            })
        } else {
            // Return to rest position smoothly
            controls.stop()
            controls.start({
                rotate: 0,
                y: 0,
                transition: {
                    type: "spring",
                    stiffness: 150,
                    damping: 18,
                },
            })
        }
    }, [isHovered, controls, swingIntensity])

    return (
        <motion.div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transformOrigin: "top center",
                position: "relative",
            }}
            animate={controls}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                style={{
                    width: connectorThickness,
                    height: connectorHeight,
                    backgroundColor: connectorColor,
                    marginBottom: 8,
                }}
            />

            <div
                style={{
                    backgroundColor: polaroidBackground,
                    padding: polaroid.isSmall ? 8 : 10,
                    paddingBottom: polaroid.isSmall ? 28 : 36,
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    width: polaroidSize,
                    minWidth: polaroidSize,
                }}
            >
                <div
                    style={{
                        width: "100%",
                        aspectRatio: "1",
                        overflow: "hidden",
                        backgroundColor: imageBackgroundColor,
                    }}
                >
                    <img
                        src={polaroid.image.src}
                        alt={polaroid.image.alt}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                </div>

                <div
                    style={{
                        marginTop: polaroid.isSmall ? 6 : 8,
                        textAlign: "center",
                        color: captionColor,
                        ...captionFont,
                        fontSize: polaroid.isSmall
                            ? `calc(${captionFont.fontSize || "14px"} * 0.85)`
                            : captionFont.fontSize,
                    }}
                >
                    {polaroid.caption}
                </div>
            </div>
        </motion.div>
    )
}

addPropertyControls(Swayloid, {
    image1: {
        type: ControlType.ResponsiveImage,
        title: "Photo 1",
    },
    caption1: {
        type: ControlType.String,
        title: "Caption 1",
        defaultValue: "Flora",
    },
    image2: {
        type: ControlType.ResponsiveImage,
        title: "Photo 2",
    },
    caption2: {
        type: ControlType.String,
        title: "Caption 2",
        defaultValue: "Blossom",
    },
    image3: {
        type: ControlType.ResponsiveImage,
        title: "Photo 3",
    },
    caption3: {
        type: ControlType.String,
        title: "Caption 3",
        defaultValue: "Wildlife",
    },
    image4: {
        type: ControlType.ResponsiveImage,
        title: "Photo 4",
    },
    caption4: {
        type: ControlType.String,
        title: "Caption 4",
        defaultValue: "Forest",
    },
    image5: {
        type: ControlType.ResponsiveImage,
        title: "Photo 5",
    },
    caption5: {
        type: ControlType.String,
        title: "Caption 5",
        defaultValue: "Fern",
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "#EEEEEE",
    },
    imageBackgroundColor: {
        type: ControlType.Color,
        title: "Image BG",
        defaultValue: "#F5F5F5",
    },
    lineThickness: {
        type: ControlType.Number,
        title: "Line Thickness",
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 1,
        unit: "px",
    },
    connectorColor: {
        type: ControlType.Color,
        title: "Connector Color",
        defaultValue: "#000000",
    },
    connectorThickness: {
        type: ControlType.Number,
        title: "Connector Width",
        defaultValue: 1,
        min: 1,
        max: 5,
        step: 1,
        unit: "px",
    },
    polaroidBackground: {
        type: ControlType.Color,
        title: "Polaroid Background",
        defaultValue: "#FFFFFF",
    },
    captionColor: {
        type: ControlType.Color,
        title: "Caption Color",
        defaultValue: "#000000",
    },
    captionFont: {
        type: ControlType.Font,
        title: "Caption Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    spacing: {
        type: ControlType.Number,
        title: "Card Spacing",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 5,
        unit: "px",
    },
    swingIntensity: {
        type: ControlType.Number,
        title: "Swing Intensity",
        defaultValue: 3,
        min: 0,
        max: 15,
        step: 1,
        unit: "deg",
    },
})