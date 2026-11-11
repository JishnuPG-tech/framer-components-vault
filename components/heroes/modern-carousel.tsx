import { useState, useCallback, useEffect, useRef } from "react"
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


/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 650
 * @framerIntrinsicHeight 370
 */
export default function ModernCarousel(props) {
    const {
        images,
        autoPlay,
        autoPlayInterval,
        transitionDuration,
        buttonBackground = "#000000",
        buttonTextColor = "#F5F5F5",
        prevText = "BACK",
        nextText = "NEXT",
        buttonFontSize = 14,
        iconSize = 16,
        borderRadius = 10,
        style,
        onSlideChange,
    } = props

    const [currentIndex, setCurrentIndex] = useState(0)
    const autoPlayRef = useRef(null)

    // Auto Play Logic
    useEffect(() => {
        if (autoPlay && images.length > 1) {
            autoPlayRef.current = setInterval(() => {
                handleNext()
            }, autoPlayInterval)
        }

        return () => {
            if (autoPlayRef.current) {
                clearInterval(autoPlayRef.current)
            }
        }
    }, [autoPlay, autoPlayInterval, images.length, currentIndex])

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    }, [images.length])

    const handlePrev = useCallback(() => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    }, [images.length])

    // SVG Right Arrow
    const RightArrowIcon = ({ size }) => (
        <svg
            width={size}
            height={size}
            viewBox="0 0 1024 1024"
            style={{ flexShrink: 0, display: "block" }}
        >
            <path
                d="M885.113 489.373L628.338 232.599c-12.496-12.497-32.758-12.497-45.254 0-12.497 12.497-12.497 32.758 0 45.255l203.3 203.3H158.025c-17.036 0-30.846 13.811-30.846 30.846 0 17.036 13.811 30.846 30.846 30.846h628.36L583.084 746.147c-12.497 12.496-12.497 32.758 0 45.255 6.248 6.248 14.438 9.372 22.627 9.372s16.379-3.124 22.627-9.372l256.775-256.775a31.999 31.999 0 0 0 0-45.254z"
                fill="currentColor"
            />
        </svg>
    )

    // SVG Left Arrow
    const LeftArrowIcon = ({ size }) => (
        <svg
            width={size}
            height={size}
            viewBox="0 0 1024 1024"
            style={{
                flexShrink: 0,
                transform: "rotate(180deg)",
                display: "block",
            }}
        >
            <path
                d="M885.113 489.373L628.338 232.599c-12.496-12.497-32.758-12.497-45.254 0-12.497 12.497-12.497 32.758 0 45.255l203.3 203.3H158.025c-17.036 0-30.846 13.811-30.846 30.846 0 17.036 13.811 30.846 30.846 30.846h628.36L583.084 746.147c-12.497 12.496-12.497 32.758 0 45.255 6.248 6.248 14.438 9.372 22.627 9.372s16.379-3.124 22.627-9.372l256.775-256.775a31.999 31.999 0 0 0 0-45.254z"
                fill="currentColor"
            />
        </svg>
    )

    // Helper to get image source string
    const getImageSrc = (img) => {
        if (!img) return ""
        return typeof img === "string" ? img : img.src
    }

    // Shared Button Style
    const buttonContainerStyle = {
        all: "unset",
        boxSizing: "border-box",
        margin: 0,
        fontSize: `${buttonFontSize}px`,
        fontWeight: 400,
        letterSpacing: "-0.3px",
        lineHeight: 1,
        textTransform: "uppercase",
        cursor: "pointer",
        userSelect: "none",
        alignItems: "center",
        display: "flex",
        justifyContent: "flex-end",
        gap: "12px",
        padding: "12px 24px",
        position: "relative",
        width: "100%",
        backgroundColor: buttonBackground,
        color: buttonTextColor,
        // 关键修改：移除单独的 borderRadius，依靠父容器裁切
        // borderRadius: `0 0 ${borderRadius}px ${borderRadius}px`,
    }

    const navItemStyle = {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        borderRadius: "4px",
        transition: "all 0.3s ease",
        height: "auto",
    }

    // Canvas Preview Mode
    if (RenderTarget.current() === RenderTarget.canvas) {
        const hasImages = images.length > 0
        const firstImage = hasImages ? getImageSrc(images[0]) : null

        return (
            <div
                style={{
                    ...style,
                    display: "flex",
                    flexDirection: "column",
                    background: hasImages
                        ? "transparent"
                        : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    // 关键：父容器控制圆角和溢出隐藏
                    borderRadius: `${borderRadius}px`,
                    overflow: "hidden",
                    color: "white",
                }}
            >
                {/* Image Preview Area */}
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                        fontWeight: "bold",
                        overflow: "hidden",
                        position: "relative",
                        width: "100%",
                        backgroundColor: hasImages ? "#000" : "transparent",
                        // 移除这里的 borderRadius
                    }}
                >
                    {hasImages ? (
                        <img
                            src={firstImage}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                // 移除这里的 borderRadius
                            }}
                            alt="Preview"
                        />
                    ) : (
                        <div>Carousel ({images.length} Images)</div>
                    )}
                </div>

                {/* Bottom Buttons */}
                <div style={buttonContainerStyle}>
                    <div style={{ ...navItemStyle, opacity: 0.5 }}>
                        <LeftArrowIcon size={iconSize} />
                        <span>{prevText}</span>
                    </div>
                    <div style={{ ...navItemStyle, opacity: 0.5 }}>
                        <span>{nextText}</span>
                        <RightArrowIcon size={iconSize} />
                    </div>
                </div>
            </div>
        )
    }

    // Empty State (Published/Preview but no images)
    if (images.length === 0) {
        return (
            <div
                style={{
                    ...style,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#f5f5f5",
                    // 关键：父容器控制圆角
                    borderRadius: `${borderRadius}px`,
                    overflow: "hidden",
                    color: "#666",
                    fontSize: "14px",
                }}
            >
                <div
                    style={{
                        padding: "40px",
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    Please add images
                </div>
                <div style={buttonContainerStyle}>
                    <div style={{ ...navItemStyle, opacity: 0.5 }}>
                        <LeftArrowIcon size={iconSize} />
                        <span>{prevText}</span>
                    </div>
                    <div style={{ ...navItemStyle, opacity: 0.5 }}>
                        <span>{nextText}</span>
                        <RightArrowIcon size={iconSize} />
                    </div>
                </div>
            </div>
        )
    }

    // Main Component
    return (
        <div
            style={{
                ...style,
                display: "flex",
                flexDirection: "column",
                // 修复核心：父容器统一管理圆角，裁切所有子元素
                borderRadius: `${borderRadius}px`,
                overflow: "hidden",
                position: "relative",
            }}
        >
            {/* Carousel Body */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    flex: 1,
                    overflow: "hidden",
                    // 移除这里的 borderRadius，让父级裁切
                }}
            >
                <AnimatePresence initial={false}>
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: 1,
                            transition: {
                                duration: transitionDuration / 1000,
                                ease: "easeInOut",
                            },
                        }}
                        exit={{
                            opacity: 0,
                            transition: {
                                duration: transitionDuration / 1000,
                                ease: "easeInOut",
                            },
                        }}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            overflow: "hidden",
                        }}
                    >
                        <img
                            src={getImageSrc(images[currentIndex])}
                            alt={`Slide ${currentIndex + 1}`}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                userSelect: "none",
                                // 移除这里的 borderRadius，确保图片底部和按钮无缝衔接
                            }}
                            draggable={false}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Navigation Buttons */}
            <div style={{ ...buttonContainerStyle, zIndex: 5 }}>
                <div
                    onClick={handlePrev}
                    style={{
                        ...navItemStyle,
                        cursor: "pointer",
                        border: `1px solid ${buttonTextColor}20`,
                        opacity: 0.5,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = "1"
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "0.5"
                    }}
                >
                    <LeftArrowIcon size={iconSize} />
                    <span>{prevText}</span>
                </div>

                <div
                    onClick={handleNext}
                    style={{
                        ...navItemStyle,
                        cursor: "pointer",
                        border: `1px solid ${buttonTextColor}20`,
                        opacity: 0.5,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = "1"
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "0.5"
                    }}
                >
                    <span>{nextText}</span>
                    <RightArrowIcon size={iconSize} />
                </div>
            </div>
        </div>
    )
}

ModernCarousel.defaultProps = {
    images: [],
    autoPlay: true,
    autoPlayInterval: 3000,
    transitionDuration: 500,
    buttonBackground: "#000000",
    buttonTextColor: "#F5F5F5",
    prevText: "BACK",
    nextText: "NEXT",
    buttonFontSize: 14,
    iconSize: 16,
    borderRadius: 10,
}

addPropertyControls(ModernCarousel, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Image,
            title: "Image",
        },
        maxCount: 20,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        min: 0,
        max: 50,
        defaultValue: 10,
        unit: "px",
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        defaultValue: true,
    },
    autoPlayInterval: {
        type: ControlType.Number,
        title: "Interval",
        min: 1000,
        max: 10000,
        step: 500,
        unit: "ms",
        defaultValue: 3000,
        hidden: (props) => !props.autoPlay,
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Duration",
        min: 100,
        max: 2000,
        step: 100,
        unit: "ms",
        defaultValue: 500,
    },
    buttonBackground: {
        type: ControlType.Color,
        title: "Button Bg",
        defaultValue: "#000000",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#F5F5F5",
    },
    buttonFontSize: {
        type: ControlType.Number,
        title: "Font Size",
        min: 10,
        max: 40,
        defaultValue: 14,
        unit: "px",
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        min: 10,
        max: 40,
        defaultValue: 16,
        unit: "px",
    },
    prevText: {
        type: ControlType.String,
        title: "Prev Label",
        defaultValue: "BACK",
    },
    nextText: {
        type: ControlType.String,
        title: "Next Label",
        defaultValue: "NEXT",
    },
    onSlideChange: {
        type: ControlType.EventHandler,
        title: "On Change",
    },
})
