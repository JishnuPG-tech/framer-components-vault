// Interactive 3-card showcase section with progress-based expansion
// Cards expand based on vertical progress bar, auto-advance to next card
// Desktop: horizontal layout with animations, Mobile: vertical stack without animations

import { useState, useEffect, useRef, startTransition, type CSSProperties } from "react"
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

interface CardData {
    number: string
    title: string
    description: string
    image: { src: string; alt: string }
    tag: string
}

interface CardShowcaseProps {
    cards: CardData[]
    progressColor: string
    animationSpeed: number
    loop: boolean
    textColor: string
    numberColor: string
    tagColor: string
    titleFont: CSSProperties
    descriptionFont: CSSProperties
    numberFont: CSSProperties
    tagFont: CSSProperties
    imageRadius: number
    padding: number
    contentImageGap: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function CardShowcase(props: CardShowcaseProps) {
    const {
        cards,
        progressColor,
        animationSpeed,
        loop,
        textColor,
        numberColor,
        tagColor,
        titleFont,
        descriptionFont,
        numberFont,
        tagFont,
        imageRadius,
        padding,
        contentImageGap,
    } = props

    const [activeIndex, setActiveIndex] = useState(0)
    const [progress, setProgress] = useState(0)
    const [isMobile, setIsMobile] = useState(false)
    const progressIntervalRef = useRef<number | null>(null)

    useEffect(() => {
        if (typeof window === "undefined") return

        const checkMobile = () => {
            startTransition(() => {
                setIsMobile(window.innerWidth < 768)
            })
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    useEffect(() => {
        if (isMobile) return

        const interval = 16
        const increment = (100 / (animationSpeed * 1000)) * interval

        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
        }

        progressIntervalRef.current = window.setInterval(() => {
            setProgress((prev) => {
                const newProgress = prev + increment
                if (newProgress >= 100) {
                    const nextIndex = activeIndex + 1
                    if (nextIndex >= cards.length) {
                        if (loop) {
                            startTransition(() => {
                                setActiveIndex(0)
                            })
                            return 0
                        } else {
                            if (progressIntervalRef.current) {
                                clearInterval(progressIntervalRef.current)
                            }
                            return 100
                        }
                    } else {
                        startTransition(() => {
                            setActiveIndex(nextIndex)
                        })
                        return 0
                    }
                }
                return newProgress
            })
        }, interval)

        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current)
            }
        }
    }, [activeIndex, animationSpeed, cards.length, loop, isMobile])

    const handleCardClick = (index: number) => {
        if (isMobile) return
        startTransition(() => {
            setActiveIndex(index)
            setProgress(0)
        })
    }

    if (isMobile) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    padding: `${padding}px`,
                    overflowY: "auto",
                    overflowX: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                }}
                className="hide-scrollbar"
            >
                <style>{`
                    .hide-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px",
                        minHeight: "100%",
                        flex: 1,
                    }}
                >
                    {cards.map((card, index) => {
                        const cardImage = card.image || {
                            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                            alt: "Default image",
                        }
                        return (
                            <div
                                key={index}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: `${contentImageGap}px`,
                                    height: "100%",
                                }}
                            >
                                <div
                                    style={{
                                        ...numberFont,
                                        color: numberColor,
                                    }}
                                >
                                    {card.number}
                                </div>
                                <div
                                    style={{
                                        ...titleFont,
                                        color: textColor,
                                    }}
                                >
                                    {card.title}
                                </div>
                                <div
                                    style={{
                                        ...descriptionFont,
                                        color: textColor,
                                        opacity: 0.8,
                                    }}
                                >
                                    {card.description}
                                </div>
                                <div
                                    style={{
                                        width: "100%",
                                        height: "200px",
                                        overflow: "hidden",
                                        flex: 1,
                                        display: "flex",
                                    }}
                                >
                                    <img
                                        src={cardImage.src}
                                        alt={cardImage.alt}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "fill",
                                            borderRadius: `${imageRadius}px`,
                                        }}
                                    />
                                </div>
                                {card.tag && (
                                    <div
                                        style={{
                                            ...tagFont,
                                            color: tagColor,
                                            alignSelf: "flex-start",
                                            marginTop: `${contentImageGap}px`,
                                        }}
                                    >
                                        {card.tag}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                padding: `${padding}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flex: 1,
                minHeight: 0,
            }}
            className="hide-scrollbar"
        >
            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
            <div
                style={{
                    display: "flex",
                    gap: "20px",
                    width: "100%",
                    height: "100%",
                    maxWidth: "1200px",
                    minHeight: 0,
                    alignItems: "stretch",
                }}
            >
                {cards.map((card, index) => {
                    const isActive = index === activeIndex
                    const cardImage = card.image || {
                        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                        alt: "Default image",
                    }
                    return (
                        <motion.div
                            key={index}
                            onClick={() => handleCardClick(index)}
                            style={{
                                padding: "24px",
                                cursor: "pointer",
                                position: "relative",
                                overflow: "hidden",
                                display: "flex",
                                flexDirection: "column",
                                gap: `${contentImageGap}px`,
                                minHeight: 0,
                            }}
                            animate={{
                                flex: isActive ? 2 : 1,
                            }}
                            transition={{
                                duration: 0.5,
                                ease: "easeInOut",
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    width: "2px",
                                    height: "100%",
                                    backgroundColor: "rgba(0,0,0,0.1)",
                                }}
                            >
                                {isActive && (
                                    <motion.div
                                        style={{
                                            position: "absolute",
                                            bottom: 0,
                                            left: 0,
                                            width: "100%",
                                            backgroundColor: progressColor,
                                        }}
                                        animate={{
                                            height: `${progress}%`,
                                        }}
                                        transition={{
                                            duration: 0,
                                        }}
                                    />
                                )}
                            </div>

                            {/* Align number, title, description to top of progress bar */}
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
                                <div
                                    style={{
                                        ...numberFont,
                                        color: numberColor,
                                        opacity: isActive ? 1 : 0.5,
                                    }}
                                >
                                    {card.number}
                                </div>

                                <div
                                    style={{
                                        ...titleFont,
                                        color: textColor,
                                        opacity: isActive ? 1 : 0.7,
                                    }}
                                >
                                    {card.title}
                                </div>
                            </div>

                            <AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            flex: 1,
                                            justifyContent: "space-between",
                                            minHeight: 0,
                                            height: "100%",
                                            gap: `${contentImageGap}px`,
                                        }}
                                    >
                                        <div
                                            style={{
                                                ...descriptionFont,
                                                color: textColor,
                                                opacity: 0.8,
                                                alignSelf: "flex-start",
                                            }}
                                        >
                                            {card.description}
                                        </div>

                                        {/* Image in the middle */}
                                        <div
                                            style={{
                                                flex: 1,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                minHeight: 0,
                                                height: "100%",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: "100%",
                                                    aspectRatio: "1/1",
                                                    overflow: "hidden",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    minHeight: 0,
                                                    height: "100%",
                                                }}
                                            >
                                                <img
                                                    src={cardImage.src}
                                                    alt={cardImage.alt}
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                        borderRadius: `${imageRadius}px`,
                                                        display: "block",
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Tag at the bottom */}
                                        {card.tag && (
                                            <div
                                                style={{
                                                    ...tagFont,
                                                    color: tagColor,
                                                    marginTop: `${contentImageGap}px`,
                                                    alignSelf: "flex-start",
                                                }}
                                            >
                                                {card.tag}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(CardShowcase, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                number: {
                    type: ControlType.String,
                    title: "Number",
                    defaultValue: "01",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Project Title",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "A brief description of this amazing project and what makes it special.",
                    displayTextArea: true,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                tag: {
                    type: ControlType.String,
                    title: "Tag",
                    defaultValue: "Design",
                },
            },
        },
        defaultValue: [
            {
                number: "01",
                title: "Creative Design",
                description: "A brief description of this amazing project and what makes it special.",
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Gradient 1 - Blue",
                },
                tag: "Design",
            },
            {
                number: "02",
                title: "Development",
                description: "Building innovative solutions with modern technologies and best practices.",
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Gradient 2 - Purple",
                },
                tag: "Development",
            },
            {
                number: "03",
                title: "Strategy",
                description: "Planning and executing comprehensive strategies for digital success.",
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Gradient 3 - Orange",
                },
                tag: "Strategy",
            },
        ],
    },
    progressColor: {
        type: ControlType.Color,
        title: "Progress Color",
        defaultValue: "#FF0000",
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Speed (seconds)",
        defaultValue: 5,
        min: 1,
        max: 20,
        step: 0.5,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    numberColor: {
        type: ControlType.Color,
        title: "Number Color",
        defaultValue: "#CCCCCC",
    },
    tagColor: {
        type: ControlType.Color,
        title: "Tag Color",
        defaultValue: "#000000",
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
    numberFont: {
        type: ControlType.Font,
        title: "Number Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
    },
    tagFont: {
        type: ControlType.Font,
        title: "Tag Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    imageRadius: {
        type: ControlType.Number,
        title: "Image Radius",
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 1,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 40,
        min: 0,
        max: 100,
        step: 1,
    },
    contentImageGap: {
        type: ControlType.Number,
        title: "Content-Image Gap",
        defaultValue: 16,
        min: 0,
        max: 100,
        step: 1,
    },
})