import { useEffect, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// @framerDisableUnlink

export default function EqualizerScrollbar(props) {
    const {
        direction,
        colorStart,
        colorMid,
        colorEnd,
        segments,
        barWidth,
        gap,
        backgroundColor,
        inactiveColor,
        outlineColor,
        hideWhenIdle,
        segmentShape,
        pulseEffect,
        glowIntensity,
        animationSpeed,
        rippleEffect,
        gradientDirection,
        spacingStyle,
        clickToJump,
        hoverEffect,
        dualColors,
        colorStart2,
        colorMid2,
        colorEnd2,
        variableHeights,
        mirrorMode,
        multipleBars,
        numberOfBars,
        mobileResponsive,
        fadeDelay,
        accessibilityMode,
    } = props

    const [scrollPercentage, setScrollPercentage] = useState(0)
    const [isScrolling, setIsScrolling] = useState(false)
    const [hoveredSegment, setHoveredSegment] = useState(null)
    const [rippleIndex, setRippleIndex] = useState(-1)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }

        if (mobileResponsive) {
            checkMobile()
            window.addEventListener("resize", checkMobile)
            return () => window.removeEventListener("resize", checkMobile)
        }
    }, [mobileResponsive])

    useEffect(() => {
        let timeout = null

        const handleScroll = () => {
            const winScroll = document.documentElement.scrollTop
            const height =
                document.documentElement.scrollHeight -
                document.documentElement.clientHeight
            const scrolled = (winScroll / height) * 100
            setScrollPercentage(scrolled)

            if (hideWhenIdle) {
                setIsScrolling(true)

                if (timeout) {
                    clearTimeout(timeout)
                }

                timeout = setTimeout(() => {
                    setIsScrolling(false)
                }, fadeDelay)
            }

            if (rippleEffect) {
                const newIndex = Math.floor((scrolled / 100) * segments)
                setRippleIndex(newIndex)
                setTimeout(() => setRippleIndex(-1), 300)
            }
        }

        window.addEventListener("scroll", handleScroll)
        handleScroll()

        return () => {
            window.removeEventListener("scroll", handleScroll)
            if (timeout) {
                clearTimeout(timeout)
            }
        }
    }, [hideWhenIdle, fadeDelay, rippleEffect, segments])

    const isInverted = direction === "inverted"
    const activeSegments = isInverted
        ? segments - Math.floor((scrollPercentage / 100) * segments)
        : Math.floor((scrollPercentage / 100) * segments)

    const getSegmentStyle = () => {
        switch (segmentShape) {
            case "round":
                return { borderRadius: "50%", aspectRatio: "1/1" }
            case "square":
                return { borderRadius: "2px", aspectRatio: "1/1" }
            case "rectangle":
                return { borderRadius: "1px", aspectRatio: "auto" }
            default:
                return { borderRadius: "1px", aspectRatio: "auto" }
        }
    }

    const shapeStyle = getSegmentStyle()

    const getSegmentHeight = (index) => {
        if (!variableHeights) return "auto"
        const heights = [0.7, 1, 0.85, 0.95, 0.75, 0.9, 0.8, 1, 0.7, 0.85]
        return heights[index % heights.length]
    }

    const handleSegmentClick = (index) => {
        if (!clickToJump) return

        const percentage = (index / segments) * 100
        const height =
            document.documentElement.scrollHeight -
            document.documentElement.clientHeight
        const scrollTo = (percentage / 100) * height

        window.scrollTo({
            top: scrollTo,
            behavior: "smooth",
        })
    }

    const getSegmentColors = (segmentIndex, isActive) => {
        const ratio = segmentIndex / segments
        let color1, color2

        if (ratio < 0.33) {
            color1 = colorStart
            color2 = dualColors ? colorStart2 : colorStart
        } else if (ratio < 0.66) {
            color1 = colorMid
            color2 = dualColors ? colorMid2 : colorMid
        } else {
            color1 = colorEnd
            color2 = dualColors ? colorEnd2 : colorEnd
        }

        const gradientDir =
            gradientDirection === "horizontal" ? "to right" : "to bottom"

        return {
            background: isActive
                ? dualColors
                    ? `linear-gradient(${gradientDir}, ${color1}, ${color2})`
                    : color1
                : inactiveColor,
            boxShadow: isActive
                ? `0 0 ${glowIntensity}px ${color1}${Math.round(glowIntensity * 2.55).toString(16)}`
                : "none",
        }
    }

    const renderBar = (barOffset = 0) => {
        return (
            <div
                className="equalizer-scrollbar-inner"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: `${gap}px`,
                    flex: 1,
                    justifyContent:
                        spacingStyle === "random"
                            ? "space-around"
                            : segmentShape !== "rectangle"
                              ? "space-around"
                              : "flex-start",
                }}
            >
                {Array.from({ length: segments }).map((_, i) => {
                    const segmentIndex = isInverted ? segments - 1 - i : i
                    const isActive = mirrorMode
                        ? Math.abs(i - segments / 2) <=
                          Math.abs(activeSegments - segments / 2)
                        : isInverted
                          ? i >= activeSegments
                          : i < activeSegments

                    const heightMultiplier = getSegmentHeight(i)
                    const colors = getSegmentColors(segmentIndex, isActive)
                    const isHovered =
                        hoveredSegment === i + barOffset * segments
                    const isRippling = rippleIndex === i

                    return (
                        <div
                            key={i}
                            className={`eq-segment ${isActive ? "active" : ""} ${pulseEffect && isActive ? "pulse" : ""} ${isRippling ? "ripple" : ""}`}
                            style={{
                                flex:
                                    segmentShape === "rectangle"
                                        ? heightMultiplier
                                        : 0,
                                height:
                                    segmentShape !== "rectangle"
                                        ? `${(barWidth - gap * 2) * heightMultiplier}px`
                                        : undefined,
                                background: colors.background,
                                borderRadius: shapeStyle.borderRadius,
                                aspectRatio:
                                    shapeStyle.aspectRatio !== "auto"
                                        ? shapeStyle.aspectRatio
                                        : undefined,
                                border: `1px solid ${outlineColor}`,
                                boxShadow: colors.boxShadow,
                                cursor: clickToJump ? "pointer" : "default",
                                transform:
                                    isHovered && hoverEffect
                                        ? "scale(1.1)"
                                        : "scale(1)",
                                opacity: isHovered && hoverEffect ? 0.8 : 1,
                                transition: `all ${animationSpeed}ms ease`,
                            }}
                            onClick={() => handleSegmentClick(i)}
                            onMouseEnter={() =>
                                setHoveredSegment(i + barOffset * segments)
                            }
                            onMouseLeave={() => setHoveredSegment(null)}
                        />
                    )
                })}
            </div>
        )
    }

    if (mobileResponsive && isMobile) {
        return null
    }

    return (
        <>
            <style>{`
                ::-webkit-scrollbar {
                    width: ${barWidth * (multipleBars ? numberOfBars : 1) + gap * (numberOfBars - 1)}px;
                }
                
                ::-webkit-scrollbar-track {
                    background: ${backgroundColor};
                }
                
                ::-webkit-scrollbar-thumb {
                    background: transparent;
                }

                .equalizer-scrollbar {
                    position: fixed;
                    right: 0;
                    top: 0;
                    width: ${barWidth * (multipleBars ? numberOfBars : 1) + gap * (numberOfBars - 1) + gap * 2}px;
                    height: 100vh;
                    background: ${accessibilityMode ? "#ffffff" : backgroundColor};
                    z-index: 9999;
                    display: flex;
                    flex-direction: row;
                    gap: ${gap}px;
                    padding: ${gap}px;
                    border-left: 1px solid ${accessibilityMode ? "#000000" : outlineColor};
                    opacity: ${hideWhenIdle ? 0 : 1};
                    transform: translateX(${hideWhenIdle ? "100%" : "0"});
                    transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
                }

                .equalizer-scrollbar.visible {
                    opacity: 1;
                    transform: translateX(0);
                }

                @keyframes pulse {
                    0%, 100% { transform: scaleY(1); }
                    50% { transform: scaleY(1.05); }
                }

                .eq-segment.pulse {
                    animation: pulse 0.8s ease-in-out infinite;
                }

                @keyframes ripple {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }

                .eq-segment.ripple {
                    animation: ripple 0.3s ease-out;
                }
            `}</style>

            <div
                className={`equalizer-scrollbar ${isScrolling || !hideWhenIdle ? "visible" : ""}`}
            >
                {multipleBars
                    ? Array.from({ length: numberOfBars }).map((_, i) => (
                          <div
                              key={i}
                              style={{
                                  width: `${barWidth}px`,
                                  display: "flex",
                                  flexDirection: "column",
                              }}
                          >
                              {renderBar(i)}
                          </div>
                      ))
                    : renderBar()}
            </div>
        </>
    )
}

EqualizerScrollbar.defaultProps = {
    direction: "normal",
    colorStart: "#10b981",
    colorMid: "#f59e0b",
    colorEnd: "#ef4444",
    segments: 20,
    barWidth: 16,
    gap: 2,
    backgroundColor: "#0a0a0a",
    inactiveColor: "#1a1a1a",
    outlineColor: "#333333",
    hideWhenIdle: false,
    segmentShape: "rectangle",
    pulseEffect: false,
    glowIntensity: 8,
    animationSpeed: 200,
    rippleEffect: false,
    gradientDirection: "horizontal",
    spacingStyle: "even",
    clickToJump: false,
    hoverEffect: false,
    dualColors: false,
    colorStart2: "#34d399",
    colorMid2: "#fbbf24",
    colorEnd2: "#f87171",
    variableHeights: false,
    mirrorMode: false,
    multipleBars: false,
    numberOfBars: 2,
    mobileResponsive: false,
    fadeDelay: 1500,
    accessibilityMode: false,
}

addPropertyControls(EqualizerScrollbar, {
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["normal", "inverted"],
        optionTitles: ["Normal (Bottom to Top)", "Inverted (Top to Bottom)"],
    },
    colorStart: {
        type: ControlType.Color,
        title: "Start Color",
    },
    colorMid: {
        type: ControlType.Color,
        title: "Mid Color",
    },
    colorEnd: {
        type: ControlType.Color,
        title: "End Color",
    },
    dualColors: {
        type: ControlType.Boolean,
        title: "Dual Colors",
        defaultValue: false,
    },
    colorStart2: {
        type: ControlType.Color,
        title: "Start Color 2",
        hidden: (props) => !props.dualColors,
    },
    colorMid2: {
        type: ControlType.Color,
        title: "Mid Color 2",
        hidden: (props) => !props.dualColors,
    },
    colorEnd2: {
        type: ControlType.Color,
        title: "End Color 2",
        hidden: (props) => !props.dualColors,
    },
    segments: {
        type: ControlType.Number,
        title: "Segments",
        min: 10,
        max: 50,
        step: 1,
    },
    barWidth: {
        type: ControlType.Number,
        title: "Bar Width",
        min: 8,
        max: 32,
        step: 2,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap Size",
        min: 1,
        max: 4,
        step: 1,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
    },
    inactiveColor: {
        type: ControlType.Color,
        title: "Inactive Segment Color",
    },
    outlineColor: {
        type: ControlType.Color,
        title: "Outline Color",
    },
    segmentShape: {
        type: ControlType.Enum,
        title: "Segment Shape",
        options: ["rectangle", "square", "round"],
        optionTitles: ["Rectangle (Horizontal)", "Square", "Round (Circle)"],
    },
    hideWhenIdle: {
        type: ControlType.Boolean,
        title: "Hide When Not Scrolling",
    },
    fadeDelay: {
        type: ControlType.Number,
        title: "Fade Delay (ms)",
        min: 500,
        max: 5000,
        step: 100,
        hidden: (props) => !props.hideWhenIdle,
    },
    pulseEffect: {
        type: ControlType.Boolean,
        title: "Pulse Effect",
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Intensity",
        min: 0,
        max: 20,
        step: 1,
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Animation Speed (ms)",
        min: 50,
        max: 500,
        step: 50,
    },
    rippleEffect: {
        type: ControlType.Boolean,
        title: "Ripple Effect",
    },
    gradientDirection: {
        type: ControlType.Enum,
        title: "Gradient Direction",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
    },
    spacingStyle: {
        type: ControlType.Enum,
        title: "Spacing Style",
        options: ["even", "random"],
        optionTitles: ["Even", "Random"],
    },
    clickToJump: {
        type: ControlType.Boolean,
        title: "Click to Jump",
    },
    hoverEffect: {
        type: ControlType.Boolean,
        title: "Hover Effect",
    },
    variableHeights: {
        type: ControlType.Boolean,
        title: "Variable Heights",
    },
    mirrorMode: {
        type: ControlType.Boolean,
        title: "Mirror Mode",
    },
    multipleBars: {
        type: ControlType.Boolean,
        title: "Multiple Bars",
    },
    numberOfBars: {
        type: ControlType.Number,
        title: "Number of Bars",
        min: 2,
        max: 4,
        step: 1,
        hidden: (props) => !props.multipleBars,
    },
    mobileResponsive: {
        type: ControlType.Boolean,
        title: "Hide on Mobile",
    },
    accessibilityMode: {
        type: ControlType.Boolean,
        title: "High Contrast Mode",
        description:
            "Get more Framer stuff at [primo.com](https://primopixel.gumroad.com/)",
    },
})
