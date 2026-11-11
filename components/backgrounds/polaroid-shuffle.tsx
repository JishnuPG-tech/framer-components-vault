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
import { useState } from "react"

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 450
 * @framerIntrinsicHeight 500
 */
export default function PolaroidShuffle(props) {
    const {
        images,
        polaroidBgColor,
        borderWidth,
        captionFont,
        stackSpread,
        rotationVariation,
        polaroidWidth,
        polaroidHeight,
        shadow,
        imageFit,
        style,
    } = props

    const [stackOrder, setStackOrder] = useState(
        images.map((_, index) => index)
    )

    const handleDragEnd = (event, info) => {
        const swipeThreshold = 100

        if (Math.abs(info.offset.x) > swipeThreshold) {
            setStackOrder((prev) => {
                const newOrder = [...prev]
                const first = newOrder.shift()
                newOrder.push(first)
                return newOrder
            })
        }
    }

    // Generate consistent random values based on index
    const getCardTransform = (imageIndex, stackIndex) => {
        const seed = imageIndex * 2654435761
        const pseudoRandom = (seed % 1000) / 1000

        return {
            rotation: (pseudoRandom - 0.5) * rotationVariation,
            offsetX: (pseudoRandom - 0.5) * stackSpread,
            offsetY: (((seed * 7) % 1000) / 1000 - 0.5) * (stackSpread * 0.5),
        }
    }

    // Calculate the total dimensions needed for the polaroid with borders and caption
    const totalPolaroidHeight = polaroidHeight + borderWidth * 3.5 + 20 // 20px for caption area
    const totalPolaroidWidth = polaroidWidth + borderWidth * 2 // Left and right borders

    return (
        <div
            style={{
                ...style,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "visible",
                width: `${totalPolaroidWidth}px`,
                height: `${totalPolaroidHeight}px`,
            }}
        >
            {stackOrder.map((imageIndex, stackIndex) => {
                const image = images[imageIndex]
                const isTop = stackIndex === 0
                const transform = getCardTransform(imageIndex, stackIndex)
                const depth = stackOrder.length - stackIndex

                return (
                    <motion.div
                        key={imageIndex}
                        drag={isTop ? "x" : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.7}
                        onDragEnd={isTop ? handleDragEnd : undefined}
                        initial={false}
                        animate={{
                            scale: isTop ? 1 : 0.98,
                            y: isTop ? 0 : transform.offsetY - stackIndex * 2,
                            rotate: isTop ? 0 : transform.rotation,
                            x: isTop ? 0 : transform.offsetX,
                            opacity: 1,
                            zIndex: depth,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                        }}
                        whileDrag={{
                            scale: 1.05,
                            cursor: "grabbing",
                        }}
                        style={{
                            position: "absolute",
                            cursor: isTop ? "grab" : "default",
                            filter: `brightness(${isTop ? 1 : 0.95 - stackIndex * 0.02})`,
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: polaroidBgColor,
                                boxShadow: shadow,
                                borderRadius: "3px",
                                userSelect: "none",
                                display: "inline-block",
                            }}
                        >
                            {/* Top and side borders */}
                            <div
                                style={{
                                    padding: `${borderWidth}px ${borderWidth}px 0 ${borderWidth}px`,
                                }}
                            >
                                <div
                                    style={{
                                        width: `${polaroidWidth}px`,
                                        height: `${polaroidHeight}px`,
                                        backgroundColor: "#000",
                                        overflow: "hidden",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {image && image.image ? (
                                        <img
                                            src={image.image}
                                            alt={image.caption || ""}
                                            draggable={false}
                                            style={{
                                                width:
                                                    imageFit === "fill"
                                                        ? "100%"
                                                        : imageFit === "contain"
                                                          ? "auto"
                                                          : "100%",
                                                height:
                                                    imageFit === "fill"
                                                        ? "100%"
                                                        : imageFit === "contain"
                                                          ? "auto"
                                                          : "100%",
                                                maxWidth:
                                                    imageFit === "contain"
                                                        ? "100%"
                                                        : "none",
                                                maxHeight:
                                                    imageFit === "contain"
                                                        ? "100%"
                                                        : "none",
                                                objectFit: imageFit,
                                                display: "block",
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                color: "#666",
                                                textAlign: "center",
                                                padding: "20px",
                                            }}
                                        >
                                            <svg
                                                width="64"
                                                height="64"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                style={{ marginBottom: "10px" }}
                                            >
                                                <rect
                                                    x="3"
                                                    y="3"
                                                    width="18"
                                                    height="18"
                                                    rx="2"
                                                />
                                                <circle
                                                    cx="8.5"
                                                    cy="8.5"
                                                    r="1.5"
                                                />
                                                <path d="M21 15l-5-5L5 21" />
                                            </svg>
                                            <div style={{ fontSize: "13px" }}>
                                                Add Photo
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bottom caption area */}
                            <div
                                style={{
                                    padding: `${borderWidth}px ${borderWidth}px ${borderWidth * 2.5}px ${borderWidth}px`,
                                    minHeight: `${borderWidth * 2.5}px`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {image && image.caption && (
                                    <p
                                        style={{
                                            margin: 0,
                                            ...captionFont,
                                            textAlign: "center",
                                            lineHeight: "1.4",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            width: "100%",
                                        }}
                                    >
                                        {image.caption}
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}

PolaroidShuffle.defaultProps = {
    images: [
        { caption: "Summer 2024", image: "" },
        { caption: "Golden Hour", image: "" },
        { caption: "Adventures", image: "" },
        { caption: "Memories", image: "" },
    ],
    polaroidBgColor: "#FFFFFF",
    borderWidth: 16,
    captionFont: {
        fontFamily: "Courier New, monospace",
        fontSize: 13,
        fontWeight: "400",
        color: "#2a2a2a",
        lineHeight: "1.4em",
        letterSpacing: "0em",
    },
    stackSpread: 60,
    rotationVariation: 25,
    polaroidWidth: 280,
    polaroidHeight: 280,
    shadow: "0 10px 40px rgba(0, 0, 0, 0.25)",
    imageFit: "cover",
}

addPropertyControls(PolaroidShuffle, {
    images: {
        type: ControlType.Array,
        title: "Polaroids",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.Image,
                    title: "Photo",
                },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    placeholder: "Add caption...",
                },
            },
        },
        defaultValue: [
            { caption: "Summer 2024", image: "" },
            { caption: "Golden Hour", image: "" },
            { caption: "Adventures", image: "" },
            { caption: "Memories", image: "" },
        ],
        maxCount: 12,
    },

    // Polaroid Dimensions
    polaroidWidth: {
        type: ControlType.Number,
        title: "Polaroid Width",
        min: 150,
        max: 400,
        step: 10,
        defaultValue: 280,
        displayStepper: true,
    },
    polaroidHeight: {
        type: ControlType.Number,
        title: "Polaroid Height",
        min: 150,
        max: 400,
        step: 10,
        defaultValue: 280,
        displayStepper: true,
    },

    // Image Fit Options
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain", "fill", "none", "scale-down"],
        optionTitles: ["Cover", "Contain", "Fill", "None", "Scale Down"],
        defaultValue: "cover",
        displaySegmentedControl: false,
    },

    // Colors
    polaroidBgColor: {
        type: ControlType.Color,
        title: "Frame Color",
        defaultValue: "#FFFFFF",
    },

    // Frame & Border
    borderWidth: {
        type: ControlType.Number,
        title: "Frame Border",
        min: 10,
        max: 40,
        step: 2,
        defaultValue: 16,
        displayStepper: true,
    },

    // Shadow Control
    shadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
        defaultValue: "0 10px 40px rgba(0, 0, 0, 0.25)",
    },

    // Caption Typography
    captionFont: {
        type: ControlType.Font,
        title: "Caption Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Courier New, monospace",
            fontSize: 13,
            fontWeight: "400",
            color: "#2a2a2a",
            lineHeight: "1.4em",
            letterSpacing: "0em",
        },
    },

    // Stack Controls
    stackSpread: {
        type: ControlType.Number,
        title: "Stack Spread",
        min: 0,
        max: 120,
        step: 10,
        defaultValue: 60,
        displayStepper: true,
    },
    rotationVariation: {
        type: ControlType.Number,
        title: "Rotation Angle",
        min: 0,
        max: 45,
        step: 5,
        defaultValue: 25,
        displayStepper: true,
    },
})
