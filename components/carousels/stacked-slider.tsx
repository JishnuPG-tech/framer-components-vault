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
import { Children, useState, useRef, useEffect } from "react"

interface StackingSliderProps {
    children?: React.ReactNode
    cardGap: number
    stackOffset: number
    mobileStackOffset: number
    leftArrowIcon: string
    rightArrowIcon: string
    arrowSize: number
    arrowColor: string
    arrowBackgroundColor: string
    arrowHoverColor: string
    arrowBorderRadius: number
    arrowGap: number
    buttonPosition: "left" | "center" | "right"
    transition: any
    disabledArrowOpacity: number
}

export default function StackingSlider(props: Partial<StackingSliderProps>) {
    const {
        children,
        cardGap = 20,
        stackOffset = 20,
        mobileStackOffset = 0,
        leftArrowIcon,
        rightArrowIcon,
        arrowSize = 40,
        arrowColor = "#000000",
        arrowBackgroundColor = "#FFFFFF",
        arrowHoverColor = "#F0F0F0",
        arrowBorderRadius = 100,
        arrowGap = 20,
        buttonPosition = "left",
        transition,
        disabledArrowOpacity = 0.3,
    } = props

    const childrenArray = Children.toArray(children)
    const [currentIndex, setCurrentIndex] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])
    const [cardWidth, setCardWidth] = useState(0)
    const [isMobile, setIsMobile] = useState(false)
    const [hoveredButton, setHoveredButton] = useState<"left" | "right" | null>(
        null
    )

    // Get card width from first card
    useEffect(() => {
        const updateDimensions = () => {
            if (cardRefs.current[0]) {
                setCardWidth(cardRefs.current[0].offsetWidth)
            }
            setIsMobile(window.innerWidth < 992)
        }

        updateDimensions()
        setTimeout(updateDimensions, 100)

        window.addEventListener("resize", updateDimensions)
        return () => window.removeEventListener("resize", updateDimensions)
    }, [childrenArray.length])

    // Get active offset based on mobile/desktop
    const activeOffset = isMobile ? mobileStackOffset : stackOffset

    // Handle navigation
    const goToNext = () => {
        if (currentIndex < childrenArray.length - 1) {
            setCurrentIndex(currentIndex + 1)
        }
    }

    const goToPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
        }
    }

    // Calculate transform - cards move cumulatively, future cards follow current
    const getCardTransform = (index: number) => {
        if (index < currentIndex) {
            // Cards BEFORE current: each has its own stack position
            const slideMove = (cardWidth + cardGap - activeOffset) * index
            return -slideMove
        } else {
            // Current card AND cards after: all move together by current amount
            const slideMove =
                (cardWidth + cardGap - activeOffset) * currentIndex
            return -slideMove
        }
    }

    // Get transition settings
    const transitionSettings = {
        duration: transition?.duration || 0.35,
        ease: transition?.ease || "easeInOut",
        type: transition?.type || "tween",
    }

    // Canvas placeholder
    if (
        RenderTarget.current() === RenderTarget.canvas &&
        childrenArray.length === 0
    ) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(136, 85, 255, 0.1)",
                    border: "2px dashed rgba(136, 85, 255, 0.3)",
                    borderRadius: "12px",
                    color: "#8855FF",
                    fontSize: "14px",
                    fontWeight: 500,
                    textAlign: "center",
                    padding: "20px",
                }}
            >
                🎴 Stacking Slider
                <br />
                Connect components or layers
            </div>
        )
    }

    const isAtStart = currentIndex === 0
    const isAtEnd = currentIndex === childrenArray.length - 1

    // Get button alignment based on position prop
    const getButtonAlignment = () => {
        switch (buttonPosition) {
            case "center":
                return "center"
            case "right":
                return "flex-end"
            default:
                return "flex-start"
        }
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: `${arrowGap}px`,
            }}
        >
            {/* Slider Container */}
            <div
                ref={containerRef}
                style={{
                    flex: 1,
                    height: "100%",
                    position: "relative",
                    overflow: "visible",
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        height: "fit-content",
                        position: "relative",
                        gap: `${cardGap}px`,
                    }}
                >
                    {childrenArray.map((child, index) => (
                        <motion.div
                            key={index}
                            ref={(el) => (cardRefs.current[index] = el)}
                            animate={{
                                x: getCardTransform(index),
                            }}
                            transition={transitionSettings}
                            style={{
                                flexShrink: 0,
                                position: "relative",
                                // Z-index: first card = 1, second = 2, third = 3, etc
                                zIndex: index + 1,
                            }}
                        >
                            {child}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Navigation Buttons - Below slider, with alignment control */}
            {childrenArray.length > 0 && (
                <div
                    style={{
                        display: "flex",
                        gap: "20px",
                        alignItems: "center",
                        justifyContent: getButtonAlignment(),
                    }}
                >
                    {/* Left Arrow */}
                    <button
                        onClick={goToPrev}
                        disabled={isAtStart}
                        onMouseEnter={() => setHoveredButton("left")}
                        onMouseLeave={() => setHoveredButton(null)}
                        style={{
                            width: `${arrowSize}px`,
                            height: `${arrowSize}px`,
                            minWidth: `${arrowSize}px`,
                            minHeight: `${arrowSize}px`,
                            flexShrink: 0,
                            background:
                                hoveredButton === "left" && !isAtStart
                                    ? arrowHoverColor
                                    : arrowBackgroundColor,
                            border: "none",
                            borderRadius: `${arrowBorderRadius}px`,
                            cursor: isAtStart ? "not-allowed" : "pointer",
                            opacity: isAtStart ? disabledArrowOpacity : 1,
                            transition:
                                "opacity 0.2s ease, background 0.2s ease",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            outline: "none",
                        }}
                    >
                        {leftArrowIcon ? (
                            <img
                                src={leftArrowIcon}
                                alt="Previous"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    display: "block",
                                }}
                            />
                        ) : (
                            <svg
                                width={arrowSize * 0.5}
                                height={arrowSize * 0.5}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={arrowColor}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        )}
                    </button>

                    {/* Right Arrow */}
                    <button
                        onClick={goToNext}
                        disabled={isAtEnd}
                        onMouseEnter={() => setHoveredButton("right")}
                        onMouseLeave={() => setHoveredButton(null)}
                        style={{
                            width: `${arrowSize}px`,
                            height: `${arrowSize}px`,
                            minWidth: `${arrowSize}px`,
                            minHeight: `${arrowSize}px`,
                            flexShrink: 0,
                            background:
                                hoveredButton === "right" && !isAtEnd
                                    ? arrowHoverColor
                                    : arrowBackgroundColor,
                            border: "none",
                            borderRadius: `${arrowBorderRadius}px`,
                            cursor: isAtEnd ? "not-allowed" : "pointer",
                            opacity: isAtEnd ? disabledArrowOpacity : 1,
                            transition:
                                "opacity 0.2s ease, background 0.2s ease",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            outline: "none",
                        }}
                    >
                        {rightArrowIcon ? (
                            <img
                                src={rightArrowIcon}
                                alt="Next"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    display: "block",
                                }}
                            />
                        ) : (
                            <svg
                                width={arrowSize * 0.5}
                                height={arrowSize * 0.5}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={arrowColor}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        )}
                    </button>
                </div>
            )}
        </div>
    )
}

StackingSlider.displayName = "Stacking Slider"

addPropertyControls(StackingSlider, {
    children: {
        type: ControlType.Array,
        title: "Slides",
        control: {
            type: ControlType.ComponentInstance,
        },
    },
    cardGap: {
        type: ControlType.Number,
        title: "Card Gap",
        min: 0,
        max: 100,
        step: 4,
        defaultValue: 20,
        unit: "px",
        displayStepper: true,
        description: "Space between cards",
    },
    stackOffset: {
        type: ControlType.Number,
        title: "Stack Offset",
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 20,
        unit: "px",
        displayStepper: true,
        description: "Visible offset of stacked cards (desktop)",
    },
    mobileStackOffset: {
        type: ControlType.Number,
        title: "Mobile Stack Offset",
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 0,
        unit: "px",
        displayStepper: true,
        description: "Visible offset on mobile (<992px)",
    },
    leftArrowIcon: {
        type: ControlType.Image,
        title: "Left Arrow Icon",
        description: "Custom icon for left arrow",
    },
    rightArrowIcon: {
        type: ControlType.Image,
        title: "Right Arrow Icon",
        description: "Custom icon for right arrow",
    },
    arrowSize: {
        type: ControlType.Number,
        title: "Arrow Size",
        min: 20,
        max: 80,
        step: 4,
        defaultValue: 40,
        unit: "px",
        displayStepper: true,
        description: "Size of arrow buttons",
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#000000",
        description: "Color for default arrow icons",
    },
    arrowBackgroundColor: {
        type: ControlType.Color,
        title: "Arrow Background",
        defaultValue: "#FFFFFF",
        description: "Background color of arrow buttons",
    },
    arrowHoverColor: {
        type: ControlType.Color,
        title: "Arrow Hover",
        defaultValue: "#F0F0F0",
        description: "Background color on hover",
    },
    arrowBorderRadius: {
        type: ControlType.Number,
        title: "Arrow Radius",
        min: 0,
        max: 100,
        step: 4,
        defaultValue: 100,
        unit: "px",
        displayStepper: true,
        description: "Border radius of arrow buttons",
    },
    buttonPosition: {
        type: ControlType.Enum,
        title: "Button Position",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        description: "Horizontal alignment of navigation buttons",
    },
    arrowGap: {
        type: ControlType.Number,
        title: "Button Gap",
        min: 0,
        max: 60,
        step: 4,
        defaultValue: 20,
        unit: "px",
        displayStepper: true,
        description: "Space between slider and buttons",
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: {
            duration: 0.35,
            ease: "easeInOut",
        },
    },
    disabledArrowOpacity: {
        type: ControlType.Number,
        title: "Disabled Opacity",
        min: 0,
        max: 1,
        step: 0.1,
        defaultValue: 0.3,
        displayStepper: true,
        description: "Opacity of disabled arrows",
    },
})
