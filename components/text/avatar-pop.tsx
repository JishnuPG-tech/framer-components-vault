"use AvatarPop"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React, { useState } from "react"
import {
    motion,
    useTransform,
    AnimatePresence,
    useMotionValue,
    useSpring,
} from "framer-motion"

interface ResponsiveImageType {
    src: string
    srcSet?: string
    alt?: string
}

interface PopItem {
    name: string
    designation: string
    image: ResponsiveImageType
}

interface AvatarPopProps {
    items: PopItem[]
    gap?: number
    overlap?: number
    imageSize?: number
    borderWidth?: number
    borderColor?: string
    PopBackground?: string
    PopTextColor?: string
    designationColor?: string
    springStiffness?: number
    springDamping?: number
    nameFont?: any
    designationFont?: any
    style?: React.CSSProperties
}
/**
 * @framerDisableUnlink
 */
export default function AvatarPop(props: AvatarPopProps) {
    const {
        items = [],
        gap = 8,
        overlap = 16,
        imageSize = 56,
        borderWidth = 2,
        borderColor = "#FFFFFF",
        PopBackground = "#000000",
        PopTextColor = "#FFFFFF",
        designationColor = "#A0A0A0",
        springStiffness = 100,
        springDamping = 5,
        nameFont,
        designationFont,
        style,
    } = props

    const [hoveredIndex, setHoveredIndex] = useState<string | null>(null)

    // Generate stable unique ID for each item
    const generateUniqueId = (item: PopItem, index: number): string => {
        return `${item.name.toLowerCase().replace(/\s+/g, "-")}-${index}`
    }

    // Canvas preview with mock data
    if (RenderTarget.current === RenderTarget.canvas && items.length === 0) {
        return (
            <div
                style={{
                    ...style,
                    padding: "20px",
                    textAlign: "center",
                    color: "#999",
                    border: "2px dashed #ccc",
                    borderRadius: "8px",
                    minHeight: "100px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                👥 Add team members to preview
            </div>
        )
    }

    return (
        <div
            style={{
                ...style,
                display: "flex",
                alignItems: "center",
                gap: `${gap}px`,
            }}
        >
            {items.map((item, index) => {
                const uniqueId = generateUniqueId(item, index)
                const x = useMotionValue(0)
                const springConfig = {
                    stiffness: springStiffness,
                    damping: springDamping,
                }

                const rotate = useSpring(
                    useTransform(x, [-100, 100], [-45, 45]),
                    springConfig
                )

                const translateX = useSpring(
                    useTransform(x, [-100, 100], [-50, 50]),
                    springConfig
                )

                const handleMouseMove = (
                    event: React.MouseEvent<HTMLImageElement>
                ) => {
                    const target = event.currentTarget
                    const halfWidth = target.offsetWidth / 2
                    x.set(event.nativeEvent.offsetX - halfWidth)
                }

                return (
                    <div
                        key={uniqueId}
                        style={{
                            position: "relative",
                            marginRight:
                                index < items.length - 1
                                    ? `-${overlap}px`
                                    : "0",
                        }}
                        onMouseEnter={() => setHoveredIndex(uniqueId)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        <AnimatePresence mode="popLayout">
                            {hoveredIndex === uniqueId && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20, scale: 0.6 }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        scale: 1,
                                        transition: {
                                            type: "spring",
                                            stiffness: 260,
                                            damping: 10,
                                        },
                                    }}
                                    exit={{ opacity: 0, y: 20, scale: 0.6 }}
                                    style={{
                                        position: "absolute",
                                        top: "-64px",
                                        left: "50%",
                                        translateX: "-50%",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: "6px",
                                        backgroundColor: PopBackground,
                                        zIndex: 50,
                                        boxShadow:
                                            "0 10px 40px rgba(0, 0, 0, 0.2)",
                                        padding: "8px 16px",
                                        whiteSpace: "nowrap",
                                        rotateZ: rotate,
                                        x: translateX,
                                    }}
                                >
                                    {/* Gradient accents */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: "40%",
                                            right: "40%",
                                            zIndex: 30,
                                            bottom: "-1px",
                                            height: "1px",
                                            background:
                                                "linear-gradient(to right, transparent, #10b981, transparent)",
                                        }}
                                    />
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: "10%",
                                            width: "40%",
                                            zIndex: 30,
                                            bottom: "-1px",
                                            height: "1px",
                                            background:
                                                "linear-gradient(to right, transparent, #0ea5e9, transparent)",
                                        }}
                                    />

                                    {/* Content with custom fonts */}
                                    <div
                                        style={{
                                            fontWeight: "bold",
                                            color: PopTextColor,
                                            position: "relative",
                                            zIndex: 30,
                                            fontSize: "16px",
                                            ...nameFont,
                                        }}
                                    >
                                        {item.name}
                                    </div>
                                    <div
                                        style={{
                                            color: designationColor,
                                            fontSize: "12px",
                                            ...designationFont,
                                        }}
                                    >
                                        {item.designation}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.img
                            onMouseMove={handleMouseMove}
                            src={item.image?.src || item.image}
                            srcSet={item.image?.srcSet}
                            alt={item.image?.alt || item.name}
                            style={{
                                width: `${imageSize}px`,
                                height: `${imageSize}px`,
                                objectFit: "cover",
                                objectPosition: "top",
                                borderRadius: "50%",
                                border: `${borderWidth}px solid ${borderColor}`,
                                position: "relative",
                                cursor: "pointer",
                            }}
                            whileHover={{ scale: 1.05, zIndex: 30 }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                )
            })}
        </div>
    )
}

// Default props
AvatarPop.defaultProps = {
    items: [
        {
            name: "John Doe",
            designation: "Software Engineer",
            image: {
                src: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&q=80",
                alt: "John Doe",
            },
        },
        {
            name: "Jane Smith",
            designation: "Product Designer",
            image: {
                src: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
                alt: "Jane Smith",
            },
        },
        {
            name: "Mike Johnson",
            designation: "Data Scientist",
            image: {
                src: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80",
                alt: "Mike Johnson",
            },
        },
    ],
    gap: 8,
    overlap: 16,
    imageSize: 56,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    PopBackground: "#000000",
    PopTextColor: "#FFFFFF",
    designationColor: "#A0A0A0",
    springStiffness: 100,
    springDamping: 5,
}

// Property Controls
addPropertyControls(AvatarPop, {
    items: {
        type: ControlType.Array,
        title: "Team Members",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Team Member",
                },
                designation: {
                    type: ControlType.String,
                    title: "Subtext",
                    defaultValue: "Position",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Upload Image",
                },
            },
        },
        defaultValue: AvatarPop.defaultProps.items,
        maxCount: 12,
    },

    // Layout Controls
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 50,
        unit: "px",
        defaultValue: 8,
    },
    overlap: {
        type: ControlType.Number,
        title: "Overlap",
        min: 0,
        max: 100,
        unit: "px",
        defaultValue: 16,
    },
    imageSize: {
        type: ControlType.Number,
        title: "Image Size",
        min: 30,
        max: 150,
        unit: "px",
        defaultValue: 56,
    },

    // Style Controls
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        min: 0,
        max: 10,
        unit: "px",
        defaultValue: 2,
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#FFFFFF",
    },
    PopBackground: {
        type: ControlType.Color,
        title: "Pop Background",
        defaultValue: "#000000",
    },
    PopTextColor: {
        type: ControlType.Color,
        title: "Pop Text",
        defaultValue: "#FFFFFF",
    },
    designationColor: {
        type: ControlType.Color,
        title: "Subtext Color",
        defaultValue: "#A0A0A0",
    },

    // Typography Controls
    nameFont: {
        type: ControlType.Font,
        title: "Name Font",
        controls: "extended",
    },
    designationFont: {
        type: ControlType.Font,
        title: "Subtext Font",
        controls: "extended",
    },

    // Animation Controls
    springStiffness: {
        type: ControlType.Number,
        title: "Spring Stiffness",
        min: 50,
        max: 300,
        defaultValue: 100,
    },
    springDamping: {
        type: ControlType.Number,
        title: "Spring Damping",
        min: 1,
        max: 50,
        defaultValue: 16,
    },
    bottomEdgeColor: {
        type: ControlType.Color,
        title: "Bottom Edge Color",
        defaultValue: "#141001",
        description:
            "Follow [Rayan Yasser](https://x.com/rayanyasserouan) for more components",
    },
})
