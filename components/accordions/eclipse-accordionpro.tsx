import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
interface CardItem {
    title: string
    description: string
    mediaType: "color" | "image" | "video"
    bgColor: string
    image: string
    videoUrl: string
}

interface FontStyle {
    fontFamily?: string
    fontWeight?: string | number
    fontStyle?: string
}

interface EclipseAccordionProProps {
    items: CardItem[]
    cardRadius: number
    cardOpacity: number
    transitionDuration: number
    containerHeight: number
    cardGap: number
    cardPadding: number
    titleFont: FontStyle
    titleColor: string
    titleSize: number
    descFont: FontStyle
    descColor: string
    descSize: number
    navColor: string
    navActiveColor: string
    navSize: number
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------
export default function EclipseAccordionPro(props: EclipseAccordionProProps) {
    const {
        items = [],
        cardRadius,
        cardOpacity,
        transitionDuration,
        containerHeight,
        cardGap,
        cardPadding,
        titleFont,
        titleColor,
        titleSize,
        descFont,
        descColor,
        descSize,
        navColor,
        navActiveColor,
        navSize,
    } = props

    const [activeIndex, setActiveIndex] = useState(0)
    const isStatic = useIsStaticRenderer()

    if (!items || items.length === 0) {
        return (
            <div
                style={{
                    padding: 20,
                    color: "#ffffff",
                    background: "#111111",
                    borderRadius: 0,
                    textAlign: "center",
                    width: "100%",
                    fontSize: 14,
                    fontFamily: "sans-serif",
                }}
            >
                Please add at least one item to the list.
            </div>
        )
    }

    // Safety check for activeIndex boundaries
    const safeActiveIndex = Math.min(activeIndex, items.length - 1)

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 20,
                padding: cardPadding,
                boxSizing: "border-box",
                overflow: "hidden",
            }}
        >
            {/* Responsive Slice Accordion Container */}
            <div
                style={{
                    display: "flex",
                    gap: cardGap,
                    width: "100%",
                    height: containerHeight,
                    alignItems: "stretch",
                    justifyContent: "center",
                }}
            >
                {items.map((item, index) => {
                    const isActive = index === safeActiveIndex

                    return (
                        <motion.div
                            key={`card-${index}`}
                            onClick={() => setActiveIndex(index)}
                            animate={{
                                flex: isActive ? 3.5 : 1,
                                opacity: cardOpacity,
                            }}
                            transition={{
                                duration: transitionDuration,
                                ease: [0.32, 0.72, 0, 1],
                            }}
                            style={{
                                position: "relative",
                                cursor: "pointer",
                                overflow: "hidden",
                                borderRadius: cardRadius,
                                height: "100%",
                                minWidth: 0, // Prevents flex overflow
                            }}
                        >
                            {/* Media Layer */}
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    zIndex: 0,
                                    backgroundColor: item.bgColor || "#000000",
                                }}
                            >
                                {item.mediaType === "image" && item.image && (
                                    <img
                                        src={item.image}
                                        alt={item.title || `Slide ${index + 1}`}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                )}

                                {item.mediaType === "video" &&
                                    item.videoUrl && (
                                        <video
                                            src={item.videoUrl}
                                            autoPlay={!isStatic}
                                            loop
                                            muted
                                            playsInline
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    )}
                            </div>

                            {/* Gradient Overlay */}
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    zIndex: 1,
                                    background:
                                        "linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, transparent 70%)",
                                    pointerEvents: "none",
                                    opacity: isActive ? 1 : 0,
                                    transition: `opacity ${transitionDuration}s ease`,
                                }}
                            />

                            {/* Content Layer (Animated on active) */}
                            {isActive && (
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        zIndex: 2,
                                        padding: "16px 12px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 4,
                                        boxSizing: "border-box",
                                    }}
                                >
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={`content-${safeActiveIndex}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{
                                                duration:
                                                    transitionDuration * 0.5,
                                            }}
                                        >
                                            <h3
                                                style={{
                                                    margin: 0,
                                                    color: titleColor,
                                                    fontSize: titleSize,
                                                    fontFamily:
                                                        titleFont?.fontFamily ||
                                                        "sans-serif",
                                                    fontWeight:
                                                        titleFont?.fontWeight ||
                                                        700,
                                                    fontStyle:
                                                        titleFont?.fontStyle ||
                                                        "normal",
                                                    lineHeight: 1.2,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                            >
                                                {item.title}
                                            </h3>
                                            <p
                                                style={{
                                                    margin: "4px 0 0 0",
                                                    color: descColor,
                                                    fontSize: descSize,
                                                    fontFamily:
                                                        descFont?.fontFamily ||
                                                        "sans-serif",
                                                    fontWeight:
                                                        descFont?.fontWeight ||
                                                        400,
                                                    fontStyle:
                                                        descFont?.fontStyle ||
                                                        "normal",
                                                    lineHeight: 1.3,
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                    overflow: "hidden",
                                                }}
                                            >
                                                {item.description}
                                            </p>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            )}
                        </motion.div>
                    )
                })}
            </div>

            {/* Navigation Dots */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    zIndex: 3,
                }}
            >
                {items.map((_, index) => {
                    const isActive = index === safeActiveIndex
                    return (
                        <motion.button
                            key={`nav-${index}`}
                            onClick={() => setActiveIndex(index)}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                            aria-label={`Go to slide ${index + 1}`}
                            style={{
                                border: "none",
                                outline: "none",
                                padding: 0,
                                margin: 0,
                                cursor: "pointer",
                                appearance: "none",
                                WebkitAppearance: "none",
                                width: isActive ? navSize * 2.5 : navSize,
                                height: navSize,
                                borderRadius: navSize / 2,
                                backgroundColor: isActive
                                    ? navActiveColor
                                    : navColor,
                                transition: `background-color 0.2s, width ${
                                    transitionDuration * 0.6
                                }s ease`,
                            }}
                        />
                    )
                })}
            </div>
        </div>
    )
}

// -----------------------------------------------------------------------------
// Defaults & Property Controls
// -----------------------------------------------------------------------------
EclipseAccordionPro.defaultProps = {
    items: [
        {
            title: "Heading 01",
            description:
                "Description for the first slide to demonstrate text layout.",
            mediaType: "color",
            bgColor: "#000000",
            image: "",
            videoUrl: "",
        },
        {
            title: "Heading 02",
            description:
                "Second slide showcasing the smooth expandable accordion effect.",
            mediaType: "color",
            bgColor: "#1A1A1A",
            image: "",
            videoUrl: "",
        },
        {
            title: "Heading 03",
            description:
                "Third slide for testing media content and navigation controls.",
            mediaType: "color",
            bgColor: "#2B2B2B",
            image: "",
            videoUrl: "",
        },
    ],
    cardRadius: 0,
    cardOpacity: 1,
    transitionDuration: 1,
    containerHeight: 480,
    cardGap: 8,
    cardPadding: 0,

    titleColor: "#FFFFFF",
    titleSize: 24,

    descColor: "#E0E0E0",
    descSize: 14,

    navColor: "rgba(255, 255, 255, 0.3)",
    navActiveColor: "#FFFFFF",
    navSize: 8,
}

addPropertyControls(EclipseAccordionPro, {
    items: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Heading",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Slide description text...",
                },
                mediaType: {
                    type: ControlType.Enum,
                    title: "Media Type",
                    options: ["color", "image", "video"],
                    optionTitles: ["Solid Color", "Image", "Video"],
                    defaultValue: "color",
                },
                bgColor: {
                    type: ControlType.Color,
                    title: "BG Color",
                    defaultValue: "#000000",
                    hidden: (props) => props?.mediaType !== "color",
                },
                image: {
                    type: ControlType.Image,
                    title: "Image",
                    hidden: (props) => props?.mediaType !== "image",
                },
                videoUrl: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm"],
                    hidden: (props) => props?.mediaType !== "video",
                },
            },
        },
    },

    // --- Animation & Speed Controls ---
    transitionDuration: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.1,
        max: 3,
        step: 0.1,
        unit: "s",
        defaultValue: 1,
    },

    // --- Layout Controls ---
    cardRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 100,
        unit: "px",
        step: 1,
        defaultValue: 0,
    },
    cardOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 1,
    },
    containerHeight: {
        type: ControlType.Number,
        title: "Height",
        min: 200,
        max: 1000,
        unit: "px",
        defaultValue: 480,
    },
    cardGap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 50,
        unit: "px",
        defaultValue: 8,
    },
    cardPadding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 100,
        unit: "px",
        defaultValue: 0,
    },

    // --- Title Styling ---
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#FFFFFF",
    },
    titleSize: {
        type: ControlType.Number,
        title: "Title Size",
        min: 12,
        max: 100,
        unit: "px",
        defaultValue: 24,
    },

    // --- Description Styling ---
    descFont: {
        type: ControlType.Font,
        title: "Desc Font",
        controls: "extended",
    },
    descColor: {
        type: ControlType.Color,
        title: "Desc Color",
        defaultValue: "#E0E0E0",
    },
    descSize: {
        type: ControlType.Number,
        title: "Desc Size",
        min: 10,
        max: 40,
        unit: "px",
        defaultValue: 14,
    },

    // --- Navigation Controls ---
    navColor: {
        type: ControlType.Color,
        title: "Nav Color",
        defaultValue: "rgba(255, 255, 255, 0.3)",
    },
    navActiveColor: {
        type: ControlType.Color,
        title: "Active Color",
        defaultValue: "#FFFFFF",
    },
    navSize: {
        type: ControlType.Number,
        title: "Nav Size",
        min: 4,
        max: 32,
        unit: "px",
        defaultValue: 8,
    },
})
