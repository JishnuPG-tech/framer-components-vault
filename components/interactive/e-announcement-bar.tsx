import * as React from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function RichAnnouncementBar(props) {
    const {
        text,
        showEmoji,
        emoji,
        emojiPosition,
        textAlign,
        showButton,
        buttonText,
        buttonUrl,
        backgroundType,
        backgroundColor,
        backgroundGradient,
        backgroundVideoUrl,
        backgroundImageOpacity,
        textColor,
        font,
        fontSize,
        fontWeight,
        borderRadius,
        emojiGap,
        buttonGap,
        marqueeBlockGap,
        carouselMessages,
        buttonBackgroundColor,
        buttonTextColor,
        buttonBorderColor,
        showButtonBorder,
        animationType,
        animationDuration,
        showCloseButton,
    } = props

    const [visible, setVisible] = React.useState(true)
    const [carouselIndex, setCarouselIndex] = React.useState(0)

    const defaultCarouselMessages = [
        "Enjoy 20% off all products!",
        "🚚 Free shipping on orders over $50",
        "⚡ Limited time offer ends soon!",
        "✨ New arrivals just dropped!",
    ]

    const messages =
        carouselMessages && carouselMessages.length > 0
            ? carouselMessages
            : defaultCarouselMessages

    React.useEffect(() => {
        if (animationType === "carousel") {
            const interval = setInterval(() => {
                setCarouselIndex((prev) => (prev + 1) % messages.length)
            }, animationDuration * 1000)
            return () => clearInterval(interval)
        }
    }, [animationType, animationDuration, messages.length])

    const animationVariants = {
        none: {},
        slideDown: {
            initial: { y: -80, opacity: 0 },
            animate: { y: 0, opacity: 1 },
        },
        fadeIn: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
        },
        zoomIn: {
            initial: { scale: 0.8, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
        },
        bounce: {
            initial: { y: -50, opacity: 0 },
            animate: {
                y: [-50, 0, -15, 0],
                opacity: 1,
                transition: { duration: 0.8, ease: "easeOut" },
            },
        },
        shake: {
            initial: { y: 0 },
            animate: {
                y: [-2, 2, -1, 1, 0],
                transition: {
                    duration: 0.6,
                    ease: "easeInOut",
                    repeat: Infinity,
                },
            },
        },
    }

    const selectedVariant =
        animationVariants[animationType] || animationVariants.none

    const getBackgroundStyle = () => {
        if (backgroundType === "solid") return backgroundColor
        if (backgroundType === "gradient") return backgroundGradient
        return "transparent"
    }

    const wrapperStyle = {
        width: "100%",
        height: "100%",
        minHeight: 66,
        paddingRight: showCloseButton ? 48 : 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: getBackgroundStyle(),
        borderRadius,
        boxSizing: "border-box",
        overflow: "hidden",
        zIndex: 9999,
        position: "relative",
    }

    const textToRender =
        animationType === "carousel" ? messages[carouselIndex] : text

    const renderEmoji = () => (
        <span style={{ fontSize: fontSize + 4 }}>{emoji}</span>
    )

    const contentStyle = {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent:
            textAlign === "left"
                ? "flex-start"
                : textAlign === "right"
                  ? "flex-end"
                  : "center",
        width: "100%",
        height: "100%",
        gap: buttonGap,
        overflow: "visible",
        position: "relative",
        zIndex: 1,
    }

    const normalTextBlock = (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: emojiGap,
                fontFamily: font,
                fontSize,
                fontWeight,
                color: textColor,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
            }}
        >
            {showEmoji &&
                (emojiPosition === "before" || emojiPosition === "both") &&
                renderEmoji()}
            <span dangerouslySetInnerHTML={{ __html: textToRender }} />
            {showEmoji &&
                (emojiPosition === "after" || emojiPosition === "both") &&
                renderEmoji()}
        </div>
    )

    if (!visible) return null

    return (
        <motion.div
            initial={selectedVariant.initial}
            animate={selectedVariant.animate}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ width: "100%", height: "100%" }}
        >
            <div style={wrapperStyle}>
                {backgroundType === "video" && backgroundVideoUrl && (
                    <video
                        src={backgroundVideoUrl}
                        autoPlay
                        muted
                        loop
                        playsInline
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            opacity: backgroundImageOpacity,
                            zIndex: 0,
                        }}
                    />
                )}

                <div style={contentStyle}>
                    {animationType === "marquee" ? (
                        <div
                            style={{
                                flex: 1,
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                            }}
                        >
                            <motion.div
                                animate={{ x: ["0%", "-50%"] }}
                                transition={{
                                    duration: animationDuration,
                                    ease: "linear",
                                    repeat: Infinity,
                                }}
                                style={{ display: "flex", width: "auto" }}
                            >
                                {[...Array(6)].map((_, index, arr) => (
                                    <div
                                        key={index}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            // if there’s no button, use emojiGap instead of buttonGap
                                            gap: showButton
                                                ? buttonGap
                                                : emojiGap,
                                            fontFamily: font,
                                            fontSize,
                                            fontWeight,
                                            color: textColor,
                                            whiteSpace: "nowrap",
                                            // gap only between blocks, not after the last one
                                            paddingRight:
                                                index === arr.length - 1
                                                    ? 0
                                                    : marqueeBlockGap,
                                        }}
                                    >
                                        {showEmoji &&
                                            (emojiPosition === "before" ||
                                                emojiPosition === "both") &&
                                            renderEmoji()}
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: text,
                                            }}
                                        />
                                        {showEmoji &&
                                            (emojiPosition === "after" ||
                                                emojiPosition === "both") &&
                                            renderEmoji()}
                                        {showButton &&
                                            buttonText &&
                                            buttonUrl && (
                                                <a
                                                    href={buttonUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        backgroundColor:
                                                            buttonBackgroundColor,
                                                        color: buttonTextColor,
                                                        border: showButtonBorder
                                                            ? `1px solid ${buttonBorderColor}`
                                                            : "none",
                                                        padding: "8px 16px",
                                                        borderRadius: 6,
                                                        textDecoration: "none",
                                                        fontWeight: 600,
                                                        fontSize:
                                                            fontSize * 0.9,
                                                        whiteSpace: "nowrap",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {buttonText}
                                                </a>
                                            )}
                                    </div>
                                ))}
                            </motion.div>
                        </div>
                    ) : (
                        <>
                            {normalTextBlock}
                            {showButton && buttonText && buttonUrl && (
                                <a
                                    href={buttonUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        backgroundColor: buttonBackgroundColor,
                                        color: buttonTextColor,
                                        border: showButtonBorder
                                            ? `1px solid ${buttonBorderColor}`
                                            : "none",
                                        padding: "8px 16px",
                                        borderRadius: 6,
                                        textDecoration: "none",
                                        fontWeight: 600,
                                        fontSize: fontSize * 0.9,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {buttonText}
                                </a>
                            )}
                        </>
                    )}
                </div>

                {showCloseButton && (
                    <motion.div
                        onClick={() => setVisible(false)}
                        whileHover={{
                            backgroundColor: "rgba(255,255,255,0.35)",
                        }}
                        style={{
                            position: "absolute",
                            top: "50%",
                            right: 12,
                            transform: "translateY(-50%)",
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: "rgba(255,255,255,0.2)",
                            color: "#fff",
                            fontSize: 16,
                            fontWeight: "bold",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            zIndex: 10,
                            transition: "background-color 0.2s ease",
                        }}
                    >
                        ×
                    </motion.div>
                )}
            </div>
        </motion.div>
    )
}

RichAnnouncementBar.defaultProps = {
    width: 1200,
    height: 66,
}

// ✨ CONTROLS
addPropertyControls(RichAnnouncementBar, {
    animationType: {
        type: ControlType.Enum,
        title: "Animation",
        options: [
            "none",
            "slideDown",
            "fadeIn",
            "zoomIn",
            "bounce",
            "marquee",
            "carousel",
            "shake",
        ],
        optionTitles: [
            "None",
            "Slide Down",
            "Fade In",
            "Zoom In",
            "Bounce",
            "Marquee",
            "Carousel",
            "Shake",
        ],
        defaultValue: "slideDown",
    },

    carouselMessages: {
        type: ControlType.Array,
        title: "Carousel Messages",
        propertyControl: { type: ControlType.String },
        defaultValue: [],
        hidden: ({ animationType }) => animationType !== "carousel",
    },

    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 8,
        min: 1,
        max: 30,
        hidden: ({ animationType }) => animationType === "shake",
    },

    text: { type: ControlType.String, title: "Text" },

    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },

    textAlign: {
        type: ControlType.Enum,
        title: "Text Align",
        options: ["left", "center", "right"],
        defaultValue: "center",
    },

    font: {
        type: ControlType.String,
        title: "Font",
    },

    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 16,
        min: 10,
        max: 40,
    },

    fontWeight: {
        type: ControlType.Enum,
        title: "Font Weight",
        options: ["300", "400", "500", "600", "700"],
        defaultValue: "600",
    },

    showEmoji: {
        type: ControlType.Boolean,
        title: "Show Emoji",
        defaultValue: true,
    },

    emoji: {
        type: ControlType.String,
        title: "Emoji",
        defaultValue: "🔥",
        hidden: ({ showEmoji }) => !showEmoji,
    },

    emojiPosition: {
        type: ControlType.Enum,
        title: "Emoji Position",
        options: ["before", "after", "both"],
        defaultValue: "before",
        hidden: ({ showEmoji }) => !showEmoji,
    },

    emojiGap: {
        type: ControlType.Number,
        title: "Emoji Gap",
        defaultValue: 8,
        min: 0,
        max: 100,
    },

    showButton: {
        type: ControlType.Boolean,
        title: "Show Button",
        defaultValue: true,
    },

    // ⭐ Button controls must appear HERE — immediately after showButton
    buttonText: {
        type: ControlType.String,
        title: "Button Text",
        hidden: ({ showButton }) => !showButton,
    },
    buttonUrl: {
        type: ControlType.String,
        title: "Button URL",
        hidden: ({ showButton }) => !showButton,
    },
    buttonBackgroundColor: {
        type: ControlType.Color,
        title: "Button Background",
        hidden: ({ showButton }) => !showButton,
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text",
        hidden: ({ showButton }) => !showButton,
    },
    showButtonBorder: {
        type: ControlType.Boolean,
        title: "Show Border",
        defaultValue: true,
        hidden: ({ showButton }) => !showButton,
    },
    buttonBorderColor: {
        type: ControlType.Color,
        title: "Button Border",
        hidden: ({ showButton, showButtonBorder }) =>
            !showButton || !showButtonBorder,
    },
    buttonGap: {
        type: ControlType.Number,
        title: "Button Gap",
        defaultValue: 16,
        min: 0,
        max: 100,
        hidden: ({ showButton }) => !showButton,
    },

    // ⭐ Background comes AFTER button cluster
    backgroundType: {
        type: ControlType.Enum,
        title: "Background",
        options: ["solid", "gradient", "video"],
        optionTitles: ["Solid", "Gradient", "Video"],
        defaultValue: "gradient",
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Solid Color",
        defaultValue: "#000000",
        hidden: ({ backgroundType }) => backgroundType !== "solid",
    },

    backgroundGradient: {
        type: ControlType.String,
        title: "Gradient",
        defaultValue: "linear-gradient(to right, #00f2fe, #4facfe)",
        hidden: ({ backgroundType }) => backgroundType !== "gradient",
    },

    backgroundVideoUrl: {
        type: ControlType.String,
        title: "Video URL",
        hidden: ({ backgroundType }) => backgroundType !== "video",
    },

    backgroundImageOpacity: {
        type: ControlType.Number,
        title: "Video Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: ({ backgroundType }) => backgroundType !== "video",
    },

    showCloseButton: {
        type: ControlType.Boolean,
        title: "Show Close Button",
        defaultValue: true,
    },
    marqueeBlockGap: {
        type: ControlType.Number,
        title: "Block Gap",
        defaultValue: 64,
        min: 0,
        max: 300,
        hidden: ({ animationType }) => animationType !== "marquee",
    },
})
