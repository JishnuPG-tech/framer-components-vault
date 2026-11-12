// Vertical compartments with hover image slide-in and click-to-expand functionality
import { useState, startTransition, type CSSProperties } from "react"
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


interface CompartmentItem {
    title: string
    image: {
        src: string
        alt: string
    }
}

interface VerticalCompartmentsProps {
    compartments: CompartmentItem[]
    titleFont: CSSProperties
    titleColor: string
    imageHeight: number
    transitionDuration: number
    hoverTransition: any
    overlayColor: string
    overlayOpacity: number
    style?: CSSProperties
}

/**
 * Vertical Compartments with Hover Image and Click Expand
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function VerticalCompartments(props: VerticalCompartmentsProps) {
    const {
        compartments = [
            {
                title: "Home",
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Home image",
                },
            },
            {
                title: "Origin",
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Origin image",
                },
            },
            {
                title: "The Team",
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Team image",
                },
            },
            {
                title: "Products",
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Products image",
                },
            },
        ],
        titleFont,
        titleColor,
        imageHeight,
        transitionDuration,
        hoverTransition,
        overlayColor,
        overlayOpacity,
    } = props

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

    const handleClick = (index: number) => {
        startTransition(() => {
            setExpandedIndex(expandedIndex === index ? null : index)
        })
    }

    const handleMouseEnter = (index: number) => {
        startTransition(() => {
            setHoveredIndex(index)
        })
    }

    const handleMouseLeave = () => {
        startTransition(() => {
            setHoveredIndex(null)
        })
    }

    const getCompartmentWidth = (index: number) => {
        if (expandedIndex === null) {
            return `${100 / compartments.length}%`
        }
        if (expandedIndex === index) {
            return "100%"
        }
        return "0%"
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "row",
                overflow: "hidden",
                position: "relative",
            }}
        >
            {compartments.map((compartment, index) => (
                <motion.div
                    key={index}
                    style={{
                        height: "100%",
                        position: "relative",
                        overflow: "hidden",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        paddingBottom: 40,
                    }}
                    animate={{
                        width: getCompartmentWidth(index),
                    }}
                    transition={{
                        duration: transitionDuration,
                        ease: "easeInOut",
                    }}
                    onClick={() => handleClick(index)}
                    onMouseEnter={() => handleMouseEnter(index)}
                    onMouseLeave={handleMouseLeave}
                >
                    <motion.div
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            width: "100%",
                            height: `${imageHeight}%`,
                            backgroundImage: `url(${compartment.image?.src || ""})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            pointerEvents: "none",
                        }}
                        animate={{
                            scale: hoveredIndex === index ? 1.05 : 1,
                        }}
                        transition={hoverTransition}
                        role="img"
                        aria-label={compartment.image?.alt || ""}
                    >
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                backgroundColor: overlayColor,
                                opacity: overlayOpacity,
                                pointerEvents: "none",
                            }}
                        />
                    </motion.div>

                    <h2
                        style={{
                            ...titleFont,
                            color: titleColor,
                            margin: 0,
                            zIndex: 1,
                            position: "relative",
                            textAlign: "center",
                            width: "max-content",
                        }}
                    >
                        {compartment.title}
                    </h2>
                </motion.div>
            ))}
        </div>
    )
}

addPropertyControls(VerticalCompartments, {
    compartments: {
        type: ControlType.Array,
        title: "Compartments",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Section",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
            },
        },
        defaultValue: [
            {
                title: "Carol",
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Home image",
                },
            },
            {
                title: "Jenie",
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Origin image",
                },
            },
            {
                title: "Becka",
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Team image",
                },
            },
            {
                title: "Paola",
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Products image",
                },
            },
        ],
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#000000",
    },
    imageHeight: {
        type: ControlType.Number,
        title: "Image Height",
        defaultValue: 100,
        min: 50,
        max: 100,
        step: 5,
        unit: "%",
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Transition Speed",
        defaultValue: 0.4,
        min: 0.2,
        max: 2,
        step: 0.1,
        unit: "s",
    },
    hoverTransition: {
        type: ControlType.Transition,
        title: "Hover Transition",
        defaultValue: {
            type: "tween",
            duration: 0.3,
            ease: "easeIn",
        },
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        defaultValue: "#000000",
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay Opacity",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.05,
    },
})
