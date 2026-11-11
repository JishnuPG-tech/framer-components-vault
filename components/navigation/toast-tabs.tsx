// Interactive tabs slider with avatar navigation and testimonial content

import { useState, startTransition, useEffect, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

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


interface Testimonial {
    text: string
    avatar: {
        src: string
        alt: string
    }
}

interface TabsSliderProps {
    testimonials: Testimonial[]
    cardBackground: string
    cardBorder: any
    cardBorderRadius: number
    textColor: string
    textFont: any
    showAvatars: boolean
    avatarSize: number
    avatarBorderColor: string
    avatarBorderWidth: number
    inactiveAvatarOpacity: number
    autoPlay: boolean
    autoPlayInterval: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TabsSlider(props: TabsSliderProps) {
    const {
        testimonials = [
            {
                text: "One of the best brands we've worked with, so professional and very good at what they do",
                avatar: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Avatar 1",
                },
            },
            {
                text: "Amazing experience working with this team. Highly recommend their services!",
                avatar: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Avatar 2",
                },
            },
            {
                text: "Professional, creative, and delivered beyond our expectations.",
                avatar: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Avatar 3",
                },
            },
        ],
        cardBackground,
        cardBorder,
        cardBorderRadius,
        textColor,
        textFont,
        showAvatars,
        avatarSize,
        avatarBorderColor,
        avatarBorderWidth,
        inactiveAvatarOpacity,
        autoPlay,
        autoPlayInterval,
    } = props

    const [activeIndex, setActiveIndex] = useState(0)

    useEffect(() => {
        if (!autoPlay || testimonials.length <= 1) return

        const interval = setInterval(() => {
            startTransition(() => {
                setActiveIndex((prev) => (prev + 1) % testimonials.length)
            })
        }, autoPlayInterval * 1000)

        return () => clearInterval(interval)
    }, [autoPlay, autoPlayInterval, testimonials.length])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                e.preventDefault()
                startTransition(() => {
                    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
                })
            } else if (e.key === "ArrowRight") {
                e.preventDefault()
                startTransition(() => {
                    setActiveIndex((prev) => (prev + 1) % testimonials.length)
                })
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [testimonials.length])

    const handleAvatarClick = (index: number) => {
        startTransition(() => setActiveIndex(index))
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 40,
                position: "relative",
            }}
        >
            {/* Testimonial Card */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: 400,
                    minHeight: 200,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ 
                            duration: 0.25,
                            ease: [0.4, 0.0, 0.2, 1]
                        }}
                        style={{
                            width: "100%",
                            backgroundColor: cardBackground,
                            ...cardBorder,
                            borderRadius: cardBorderRadius,
                            padding: 32,
                            boxSizing: "border-box",
                            boxShadow: "0 1px 1px rgba(0, 0, 0, 0.1)",
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                color: textColor,
                                ...textFont,
                            }}
                        >
                            {testimonials[activeIndex]?.text}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Avatar Navigation */}
            {showAvatars && (
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {testimonials.map((testimonial, index) => {
                        const isActive = index === activeIndex
                        const avatarSrc = testimonial?.avatar?.src || "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"
                        const avatarAlt = testimonial?.avatar?.alt || `Avatar ${index + 1}`
                        
                        return (
                            <motion.button
                                key={index}
                                onClick={() => handleAvatarClick(index)}
                                style={{
                                    width: isActive ? avatarSize + avatarBorderWidth * 2 + 4 : avatarSize,
                                    height: isActive ? avatarSize + avatarBorderWidth * 2 + 4 : avatarSize,
                                    borderRadius: "50%",
                                    border: `${avatarBorderWidth}px solid ${isActive ? avatarBorderColor : "transparent"}`,
                                    padding: 0,
                                    cursor: "pointer",
                                    overflow: "hidden",
                                    background: "transparent",
                                    opacity: isActive ? 1 : inactiveAvatarOpacity,
                                    transition: "opacity 0.3s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                aria-label={`View testimonial ${index + 1}`}
                            >
                                <div
                                    style={{
                                        width: avatarSize,
                                        height: avatarSize,
                                        borderRadius: "50%",
                                        overflow: "hidden",
                                    }}
                                >
                                    <img
                                        src={avatarSrc}
                                        alt={avatarAlt}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            borderRadius: "50%",
                                        }}
                                    />
                                </div>
                            </motion.button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

addPropertyControls(TabsSlider, {
    testimonials: {
        type: ControlType.Array,
        title: "Testimonials",
        control: {
            type: ControlType.Object,
            controls: {
                text: {
                    type: ControlType.String,
                    title: "Text",
                    defaultValue: "One of the best brands we've worked with",
                    displayTextArea: true,
                },
                avatar: {
                    type: ControlType.ResponsiveImage,
                    title: "Avatar",
                },
            },
        },
        defaultValue: [
            {
                text: "One of the best brands we've worked with, so professional and very good at what they do",
                avatar: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Avatar 1",
                },
            },
            {
                text: "Amazing experience working with this team. Highly recommend their services!",
                avatar: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Avatar 2",
                },
            },
            {
                text: "Professional, creative, and delivered beyond our expectations.",
                avatar: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Avatar 3",
                },
            },
        ],
    },
    showAvatars: {
        type: ControlType.Boolean,
        title: "Show Avatars",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoPlayInterval: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 0.5,
        unit: "s",
        hidden: ({ autoPlay }) => !autoPlay,
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Background",
        defaultValue: "#F7F7F7",
    },
    cardBorder: {
        type: ControlType.Border,
        title: "Card Border",
        defaultValue: {
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "rgba(0, 0, 0, 0.1)",
        },
    },
    cardBorderRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 16,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    textFont: {
        type: ControlType.Font,
        title: "Text Font",
        defaultValue: {
            fontSize: "18px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.5em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    avatarSize: {
        type: ControlType.Number,
        title: "Avatar Size",
        defaultValue: 60,
        min: 40,
        max: 100,
        step: 1,
        unit: "px",
        hidden: ({ showAvatars }) => !showAvatars,
    },
    avatarBorderColor: {
        type: ControlType.Color,
        title: "Active Border",
        defaultValue: "#000000",
        hidden: ({ showAvatars }) => !showAvatars,
    },
    avatarBorderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 3,
        min: 1,
        max: 8,
        step: 1,
        unit: "px",
        hidden: ({ showAvatars }) => !showAvatars,
    },
    inactiveAvatarOpacity: {
        type: ControlType.Number,
        title: "Inactive Opacity",
        defaultValue: 0.4,
        min: 0,
        max: 1,
        step: 0.1,
        hidden: ({ showAvatars }) => !showAvatars,
    },
})