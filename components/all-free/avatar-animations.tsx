import { useState, type CSSProperties } from "react"
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

interface Avatar {
    src?:
        | {
              src: string
              alt?: string
          }
        | string
    fallback: string
    tooltip: string
}

interface AvatarGroupEditableProps {
    avatars: Avatar[]
    size: number
    spacing: number
    borderWidth: number
    borderColor: string
    backgroundColor: string
    textColor: string
    font: CSSProperties
    showTooltips: boolean
    enableAnimations: boolean
    entranceAnimation: "slide" | "scale" | "bounce" | "flip"
    entranceDelay: number
    hoverAnimation: "scale" | "lift" | "rotate" | "up"
    hoverScale: number
    animationDuration: number
    bounce: number
}

/**
 * Avatar Group component with configurable avatars, tooltips, and custom animations
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function AvatarGroupEditable(props: AvatarGroupEditableProps) {
    const {
        avatars,
        size,
        spacing,
        borderWidth,
        borderColor,
        backgroundColor,
        textColor,
        font,
        showTooltips,
        enableAnimations,
        entranceAnimation,
        entranceDelay,
        hoverAnimation,
        hoverScale,
        animationDuration,
        bounce,
    } = props

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // Animation variants for entrance animations
    const getEntranceVariants = (index: number) => {
        const baseDelay = entranceDelay

        switch (entranceAnimation) {
            case "flip":
                return {
                    initial: { rotateY: -90, scale: 0.8 },
                    animate: { rotateY: 0, scale: 1 },
                    transition: {
                        delay: baseDelay,
                        type: "spring",
                        stiffness: 400,
                        damping: 18,
                        mass: 0.8,
                    },
                }
            case "slide":
                return {
                    initial: { x: 20 },
                    animate: { x: 0 },
                    transition: {
                        delay: baseDelay,
                        type: "spring",
                        stiffness: 400,
                        damping: 18,
                        mass: 0.8,
                    },
                }
            case "scale":
                return {
                    initial: { scale: 0.8 },
                    animate: { scale: 1 },
                    transition: {
                        delay: baseDelay,
                        type: "spring",
                        stiffness: 500,
                        damping: 20,
                        mass: 0.8,
                    },
                }
            case "bounce":
                return {
                    initial: { scale: 0.8, y: 20 },
                    animate: { scale: 1, y: 0 },
                    transition: {
                        delay: baseDelay,
                        type: "spring",
                        stiffness: 500,
                        damping: 18, // fixed value for entrance
                        mass: 0.6,
                    },
                }
            default:
                return {}
        }
    }

    // Animation variants for hover animations
    const getHoverVariants = () => {
        switch (hoverAnimation) {
            case "scale":
                return {
                    whileHover: { scale: hoverScale },
                    transition: {
                        type: "spring",
                        stiffness: 400,
                        damping: bounce, // use bounce for hover
                        mass: 0.8,
                    },
                }
            case "lift":
                return {
                    whileHover: { y: -4, scale: hoverScale },
                    transition: {
                        type: "spring",
                        stiffness: 400,
                        damping: bounce, // use bounce for hover
                        mass: 0.8,
                    },
                }
            case "rotate":
                return {
                    whileHover: { rotate: 5, scale: hoverScale },
                    transition: {
                        type: "spring",
                        stiffness: 400,
                        damping: bounce, // use bounce for hover
                        mass: 0.8,
                    },
                }
            case "up":
                return {
                    whileHover: { y: -8 },
                    transition: {
                        type: "spring",
                        stiffness: 400,
                        damping: bounce, // use bounce for hover
                        mass: 0.8,
                    },
                }
            default:
                return {}
        }
    }

    const AvatarWrapper = enableAnimations && !isCanvas ? motion.div : "div"

    return (
        <div
            style={{
                position: "relative", // Needed for absolute positioning of children
                height: `${size}px`,
                // Calculate the total width of the group
                width: `${avatars.length * size - (avatars.length > 0 ? (avatars.length - 1) * spacing : 0)}px`,
            }}
        >
            {avatars.map((avatar, index) => (
                <AvatarWrapper
                    key={index}
                    style={{
                        // Position each avatar absolutely
                        position: "absolute",
                        left: `${index * (size - spacing)}px`, // Calculate left offset for overlap
                        top: 0,
                        width: `${size}px`,
                        height: `${size}px`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: avatars.length - index,
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    {...(enableAnimations
                        ? {
                              ...getEntranceVariants(index),
                              ...getHoverVariants(),
                          }
                        : {})}
                >
                    <div
                        style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            borderRadius: "50%",
                            border: `${borderWidth}px solid ${borderColor}`,
                            backgroundColor: backgroundColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            position: "relative",
                            cursor: enableAnimations ? "pointer" : "default",
                        }}
                    >
                        {avatar.src &&
                        (typeof avatar.src === "object"
                            ? avatar.src.src
                            : avatar.src) ? (
                            <img
                                src={
                                    typeof avatar.src === "object"
                                        ? avatar.src.src
                                        : avatar.src
                                }
                                alt={
                                    typeof avatar.src === "object"
                                        ? avatar.src.alt || avatar.tooltip
                                        : avatar.tooltip
                                }
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                                onError={(e) => {
                                    e.currentTarget.style.display = "none"
                                    const nextSibling = e.currentTarget
                                        .nextElementSibling as HTMLElement
                                    if (nextSibling) {
                                        nextSibling.style.display = "flex"
                                    }
                                }}
                            />
                        ) : null}
                        <span
                            style={{
                                color: textColor,
                                fontSize: `${size * 0.4}px`,
                                fontWeight: "600",
                                display:
                                    avatar.src &&
                                    (typeof avatar.src === "object"
                                        ? avatar.src.src
                                        : avatar.src)
                                        ? "none"
                                        : "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "100%",
                                height: "100%",
                                ...font,
                            }}
                        >
                            {avatar.fallback}
                        </span>
                    </div>

                    {showTooltips && hoveredIndex === index && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                position: "absolute",
                                bottom: `${size + 8}px`,

                                transform: "translateX(-50%)",
                                backgroundColor: "#000",
                                color: "#fff",
                                padding: "6px 8px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                whiteSpace: "nowrap",
                                zIndex: 1000,
                                pointerEvents: "none",
                                ...font,
                            }}
                        >
                            {avatar.tooltip}
                            <div
                                style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    width: 0,
                                    height: 0,
                                    borderLeft: "4px solid transparent",
                                    borderRight: "4px solid transparent",
                                    borderTop: "4px solid #000",
                                }}
                            />
                        </motion.div>
                    )}
                </AvatarWrapper>
            ))}
        </div>
    )
}

addPropertyControls(AvatarGroupEditable, {
    avatars: {
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                src: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                fallback: {
                    type: ControlType.String,
                    title: "Fallback Text",
                    defaultValue: "AB",
                },
                tooltip: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "User Name",
                },
            },
        },
        defaultValue: [
            {
                src: {
                    src: "https://framerusercontent.com/images/48RBDKcUQaZQKSIpgF8AQqE2E.png",
                    alt: "User 1",
                },
                fallback: "U1",
                tooltip: "User 1",
            },
            {
                src: {
                    src: "https://framerusercontent.com/images/kQSIpgF8AQqE2E48RBDKcUQaZ.png",
                    alt: "User 2",
                },
                fallback: "U2",
                tooltip: "User 2",
            },
            {
                src: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "User 3",
                },
                fallback: "U3",
                tooltip: "User 3",
            },
            {
                src: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "User 4",
                },
                fallback: "U4",
                tooltip: "User 4",
            },
            {
                src: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "User 5",
                },
                fallback: "U5",
                tooltip: "User 5",
            },
        ],
        maxCount: 10,
    },
    size: {
        type: ControlType.Number,
        title: "Avatar Size",
        defaultValue: 48,
        min: 24,
        max: 120,
        step: 4,
        unit: "px",
    },
    spacing: {
        type: ControlType.Number,
        title: "Overlap",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 2,
        unit: "px",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 3,
        min: 0,
        max: 8,
        step: 1,
        unit: "px",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#FFFFFF",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F5F5F5",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    showTooltips: {
        type: ControlType.Boolean,
        title: "Show Tooltips",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    enableAnimations: {
        type: ControlType.Boolean,
        title: "Enable Animations",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    hoverAnimation: {
        type: ControlType.Enum,
        title: "Hover Animation",
        options: ["scale", "lift", "rotate", "up"],
        optionTitles: ["Scale", "Lift", "Rotate", "Up"],
        defaultValue: "scale",
        displaySegmentedControl: true,
        hidden: ({ enableAnimations }) => !enableAnimations,
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.1,
        min: 1,
        max: 1.5,
        step: 0.05,
        hidden: ({ enableAnimations }) => !enableAnimations,
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 0.3,
        min: 0.1,
        max: 2,
        step: 0.1,
        unit: "s",
        hidden: ({ enableAnimations }) => !enableAnimations,
    },
    bounce: {
        type: ControlType.Number,
        title: "Bounce Damping",
        defaultValue: 15,
        min: 5,
        max: 40,
        step: 1,
        hidden: ({ enableAnimations, hoverAnimation }) =>
            !enableAnimations ||
            !["scale", "lift", "rotate", "up"].includes(hoverAnimation),
    },
    // Add bounce property control visibility for all animation types
})
