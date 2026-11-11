// Tilt card effect that tilts on hover and flips on click to show image details
import * as React from "react"
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface TiltFlipCardProps {
    image: { src: string; alt?: string }
    title: string
    description: string
    radius: number
    tiltStrength: number
    backgroundColor: string
    textColor: string
    titleFont: any
    descriptionFont: any
    shimmerEnabled: boolean
    shimmerColor: string
    shimmerSpeed: number
    textGap: number
    textAlign: "flex-start" | "center" | "flex-end"
    showSide: "front" | "back"
    descriptionWidth: number
    enableFlip: boolean
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function TiltFlipCard(props: TiltFlipCardProps) {
    const {
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Gradient 1 - Blue",
        },
        title,
        description,
        radius,
        tiltStrength,
        backgroundColor,
        textColor,
        titleFont,
        descriptionFont,
        shimmerEnabled,
        shimmerColor,
        shimmerSpeed,
        textGap,
        textAlign,
        showSide,
        descriptionWidth,
        enableFlip,
    } = props

    const [flipped, setFlipped] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)

    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const flipRotation = useMotionValue(0)

    const rotateX = useTransform(y, [-0.5, 0.5], [tiltStrength, -tiltStrength])
    const rotateY = useTransform(x, [-0.5, 0.5], [-tiltStrength, tiltStrength])

    const smoothRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 })
    const smoothRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 })

    const smoothFlipRotation = useSpring(flipRotation, { stiffness: 200, damping: 25 })

    const combinedRotateY = useTransform(
        [smoothRotateY, smoothFlipRotation],
        ([tilt, flip]: [number, number]) => tilt + flip
    )

    React.useEffect(() => {
        flipRotation.set(flipped ? 180 : 0)
    }, [flipped, flipRotation])

    React.useEffect(() => {
        if (showSide === "back") {
            flipRotation.set(180)
        } else {
            flipRotation.set(0)
        }
    }, [showSide, flipRotation])

    function handleMouseMove(e) {
        const rect = e.currentTarget.getBoundingClientRect()
        const px = (e.clientX - rect.left) / rect.width - 0.5
        const py = (e.clientY - rect.top) / rect.height - 0.5
        x.set(px)
        y.set(py)
    }

    function handleMouseLeave() {
        x.set(0)
        y.set(0)
        setIsHovered(false)
    }

    function handleMouseEnter() {
        setIsHovered(true)
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                perspective: 1200,
            }}
        >
            <motion.div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    transformStyle: "preserve-3d",
                    borderRadius: radius,
                    cursor: "pointer",
                    rotateX: smoothRotateX,
                    rotateY: combinedRotateY,
                }}
                animate={{
                    scale: isHovered ? 1.05 : 1,
                }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onMouseEnter={handleMouseEnter}
                onClick={() => enableFlip && React.startTransition(() => setFlipped(!flipped))}
            >
                {/* Front */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backfaceVisibility: "hidden",
                        borderRadius: radius,
                        overflow: "hidden",
                    }}
                >
                    <img
                        src={image.src}
                        alt={image.alt || ""}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                    {shimmerEnabled && (
                        <motion.div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: "-100%",
                                width: "100%",
                                height: "100%",
                                background: `linear-gradient(90deg, transparent, ${shimmerColor}, transparent)`,
                                pointerEvents: "none",
                            }}
                            animate={{
                                left: ["−100%", "100%"],
                            }}
                            transition={{
                                duration: shimmerSpeed,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                        />
                    )}
                </div>

                {/* Back */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: backgroundColor,
                        color: textColor,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: textAlign,
                        alignItems: "center",
                        padding: 20,
                        textAlign: "center",
                        transform: "rotateY(180deg)",
                        backfaceVisibility: "hidden",
                        borderRadius: radius,
                    }}
                >
                    <h3 style={{ marginBottom: textGap, ...titleFont }}>
                        {title}
                    </h3>
                    <p style={{ margin: 0, maxWidth: `${descriptionWidth}%`, ...descriptionFont }}>
                        {description}
                    </p>
                    {shimmerEnabled && (
                        <motion.div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: "-100%",
                                width: "100%",
                                height: "100%",
                                background: `linear-gradient(90deg, transparent, ${shimmerColor}, transparent)`,
                                pointerEvents: "none",
                            }}
                            animate={{
                                left: ["-100%", "100%"],
                            }}
                            transition={{
                                duration: shimmerSpeed,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                        />
                    )}
                </div>
            </motion.div>
        </div>
    )
}

addPropertyControls(TiltFlipCard, {
    showSide: {
        type: ControlType.Enum,
        title: "Show Side",
        options: ["front", "back"],
        optionTitles: ["Front", "Back"],
        defaultValue: "front",
        displaySegmentedControl: true,
    },
    enableFlip: {
        type: ControlType.Boolean,
        title: "Enable Flip",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Card Title",
    },
    description: {
        type: ControlType.String,
        title: "Description",
        defaultValue: "Details about this image go here.",
        displayTextArea: true,
    },
    descriptionWidth: {
        type: ControlType.Number,
        title: "Description Width",
        defaultValue: 100,
        min: 20,
        max: 100,
        step: 5,
        unit: "%",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 50,
    },
    tiltStrength: {
        type: ControlType.Number,
        title: "Tilt Strength",
        defaultValue: 15,
        min: 0,
        max: 40,
    },
    shimmerEnabled: {
        type: ControlType.Boolean,
        title: "Shimmer",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    shimmerColor: {
        type: ControlType.Color,
        title: "Shimmer Color",
        defaultValue: "rgba(255, 255, 255, 0.3)",
        hidden: ({ shimmerEnabled }) => !shimmerEnabled,
    },
    shimmerSpeed: {
        type: ControlType.Number,
        title: "Shimmer Speed",
        defaultValue: 2,
        min: 0.5,
        max: 5,
        step: 0.5,
        unit: "s",
        hidden: ({ shimmerEnabled }) => !shimmerEnabled,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Back Color",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Description Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    textGap: {
        type: ControlType.Number,
        title: "Text Gap",
        defaultValue: 8,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Vertical Align",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },
})
