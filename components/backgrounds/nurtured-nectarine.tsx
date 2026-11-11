import { useState, useCallback, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence, type Variants, type Easing } from "framer-motion"

interface CardData {
    id: number
    title: string
    description: string
    icon: string
}

interface CardSliderProps {
    backgroundColor: string
    cardBackground: string
    textColor: string
    accentColor: string
    buttonColor: string
    buttonTextColor: string
    glassBlur: number
    borderRadius: number
    shadowIntensity: number
    titleFont: any
    descriptionFont: any
    buttonFont: any
    showProgress: boolean
    autoLoop: boolean
}

const defaultCards: CardData[] = [
    {
        id: 1,
        title: "Welcome to Framer",
        description: "Framer empowers designers and developers to create stunning, interactive websites with powerful design tools and seamless publishing. Build prototypes that feel real.",
        icon: "✨",
    },
    {
        id: 2,
        title: "Advanced Animations",
        description: "Create breathtaking interactions with Framer Motion integration. Animate anything with spring physics, gestures, and scroll-triggered effects that bring your designs to life.",
        icon: "🎨",
    },
    {
        id: 3,
        title: "Publish & Launch",
        description: "Deploy professional websites in seconds with Framer's powerful hosting. Get SEO optimization, custom domains, and analytics to grow your online presence.",
        icon: "🚀",
    },
]

const customEase: Easing = [0.23, 1, 0.32, 1]

/**
 * Interactive Card Slider
 *
 * A modern glassmorphism card slider with smooth animations.
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 520
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CardSlider(props: CardSliderProps) {
    const {
        backgroundColor = "#0a0a0a",
        cardBackground = "rgba(255, 255, 255, 0.08)",
        textColor = "#ffffff",
        accentColor = "#6366f1",
        buttonColor = "#6366f1",
        buttonTextColor = "#ffffff",
        glassBlur = 20,
        borderRadius = 24,
        shadowIntensity = 0.3,
        titleFont,
        descriptionFont,
        buttonFont,
        showProgress = true,
        autoLoop = true,
    } = props

    const [currentIndex, setCurrentIndex] = useState(0)
    const [direction, setDirection] = useState(0)

    const currentCard = defaultCards[currentIndex]
    const isLastCard = currentIndex === defaultCards.length - 1

    const handleNext = useCallback(() => {
        setDirection(1)
        if (isLastCard && autoLoop) {
            startTransition(() => setCurrentIndex(0))
        } else {
            startTransition(() => setCurrentIndex((prev) => (prev + 1) % defaultCards.length))
        }
    }, [isLastCard, autoLoop])

    const slideVariants: Variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
            scale: 0.85,
            rotateY: direction > 0 ? 15 : -15,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
            rotateY: 0,
            transition: {
                duration: 0.5,
                ease: customEase,
            },
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 300 : -300,
            opacity: 0,
            scale: 0.85,
            rotateY: direction < 0 ? 15 : -15,
            transition: {
                duration: 0.4,
                ease: customEase,
            },
        }),
    }

    const containerStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: backgroundColor,
        padding: "24px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
    }

    const cardContainerStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        maxWidth: "380px",
        height: "380px",
        perspective: "1200px",
    }

    const cardStyle: React.CSSProperties = {
        position: "absolute",
        width: "100%",
        height: "100%",
        background: cardBackground,
        backdropFilter: `blur(${glassBlur}px)`,
        WebkitBackdropFilter: `blur(${glassBlur}px)`,
        borderRadius: `${borderRadius}px`,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: `0 25px 50px -12px rgba(0, 0, 0, ${shadowIntensity})`,
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        boxSizing: "border-box",
        cursor: "pointer",
        transformStyle: "preserve-3d",
    }

    const iconStyle: React.CSSProperties = {
        fontSize: "64px",
        marginBottom: "24px",
        filter: "drop-shadow(0 0 20px rgba(99, 102, 241, 0.4))",
    }

    const titleStyle: React.CSSProperties = {
        color: textColor,
        margin: "0 0 16px 0",
        ...titleFont,
    }

    const descriptionStyle: React.CSSProperties = {
        color: `${textColor}cc`,
        margin: 0,
        lineHeight: "1.6",
        ...descriptionFont,
    }

    const buttonStyle: React.CSSProperties = {
        marginTop: "24px",
        padding: "16px 32px",
        background: buttonColor,
        color: buttonTextColor,
        border: "none",
        borderRadius: "12px",
        cursor: "pointer",
        ...buttonFont,
        boxShadow: `0 4px 14px 0 rgba(99, 102, 241, 0.4)`,
    }

    const progressContainerStyle: React.CSSProperties = {
        display: "flex",
        gap: "8px",
        marginTop: "20px",
    }

    const progressTextStyle: React.CSSProperties = {
        color: `${textColor}80`,
        fontSize: "14px",
        marginTop: "12px",
        fontWeight: 500,
    }

    return (
        <div style={containerStyle}>
            <div style={cardContainerStyle}>
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        style={cardStyle}
                        whileHover={{
                            scale: 1.03,
                            boxShadow: `0 35px 60px -12px rgba(99, 102, 241, 0.25), 0 0 40px rgba(99, 102, 241, 0.1)`,
                            borderColor: "rgba(99, 102, 241, 0.3)",
                            transition: { duration: 0.3 },
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                        }}
                    >
                        <motion.div
                            style={iconStyle}
                            animate={{
                                y: [0, -8, 0],
                                rotate: [0, 5, -5, 0],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        >
                            {currentCard.icon}
                        </motion.div>
                        <h2 style={titleStyle}>{currentCard.title}</h2>
                        <p style={descriptionStyle}>{currentCard.description}</p>
                    </motion.div>
                </AnimatePresence>
            </div>

            <motion.button
                style={buttonStyle}
                onClick={handleNext}
                whileHover={{
                    scale: 1.05,
                    boxShadow: `0 6px 20px 0 rgba(99, 102, 241, 0.6)`,
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
            >
                {isLastCard && autoLoop ? "Start Again" : "Next"}
            </motion.button>

            {showProgress && (
                <>
                    <div style={progressContainerStyle}>
                        {defaultCards.map((_, index) => (
                            <motion.div
                                key={index}
                                style={{
                                    width: "32px",
                                    height: "4px",
                                    borderRadius: "2px",
                                    background:
                                        index === currentIndex
                                            ? accentColor
                                            : `${textColor}30`,
                                }}
                                animate={{
                                    scale: index === currentIndex ? 1 : 0.9,
                                    opacity: index === currentIndex ? 1 : 0.5,
                                }}
                                transition={{ duration: 0.3 }}
                            />
                        ))}
                    </div>
                    <span style={progressTextStyle}>
                        Card {currentIndex + 1}/{defaultCards.length}
                    </span>
                </>
            )}

            {/* Background glow effect */}
            <div
                style={{
                    position: "absolute",
                    width: "500px",
                    height: "500px",
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)`,
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            />
        </div>
    )
}

addPropertyControls(CardSlider, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0a0a0a",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "rgba(255, 255, 255, 0.08)",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#ffffff",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#6366f1",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button",
        defaultValue: "#6366f1",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text",
        defaultValue: "#ffffff",
    },
    glassBlur: {
        type: ControlType.Number,
        title: "Glass Blur",
        defaultValue: 20,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 24,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    shadowIntensity: {
        type: ControlType.Number,
        title: "Shadow",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.1,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "28px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Desc Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Regular",
            letterSpacing: "0",
            lineHeight: "1.6em",
        },
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Semibold",
            letterSpacing: "0",
            lineHeight: "1em",
        },
    },
    showProgress: {
        type: ControlType.Boolean,
        title: "Progress",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    autoLoop: {
        type: ControlType.Boolean,
        title: "Auto Loop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})