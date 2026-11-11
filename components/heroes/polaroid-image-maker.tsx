// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useCallback } from "react"
import { motion } from "framer-motion"

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 340
 * @framerIntrinsicHeight 400
 */
export default function PolaroidMaker(props) {
    const {
        image,
        frameColor,
        rotation,
        shadowIntensity,
        customShadow,
        enableAnimation,
        vintageEffect,
        grainIntensity,
        lightLeak,
        vignette,
        imageFit,
        style,
    } = props

    const [isHovered, setIsHovered] = useState(false)

    const handleHover = useCallback(() => {
        if (enableAnimation) {
            setIsHovered(true)
        }
    }, [enableAnimation])

    const handleHoverEnd = useCallback(() => {
        if (enableAnimation) {
            setIsHovered(false)
        }
    }, [enableAnimation])

    // Classic Polaroid proportions
    const topBorder = 16
    const sideBorder = 16
    const bottomBorder = 60

    const getShadow = () => {
        // If custom shadow is enabled and has values, use it
        if (shadowIntensity === "custom") {
            const { offsetX, offsetY, blur, spread, color, opacity } =
                customShadow
            const shadowColor = `${color}${Math.round(opacity * 2.55)
                .toString(16)
                .padStart(2, "0")}`
            return `${offsetX}px ${offsetY}px ${blur}px ${spread}px ${shadowColor}`
        }

        // Otherwise use preset shadows
        switch (shadowIntensity) {
            case "none":
                return "none"
            case "light":
                return "0 4px 12px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.08)"
            case "medium":
                return "0 8px 24px rgba(0,0,0,0.15), 0 3px 8px rgba(0,0,0,0.12)"
            case "heavy":
                return "0 12px 40px rgba(0,0,0,0.25), 0 5px 16px rgba(0,0,0,0.18)"
            default:
                return "0 8px 24px rgba(0,0,0,0.15), 0 3px 8px rgba(0,0,0,0.12)"
        }
    }

    const getImageStyle = () => {
        const baseStyle = {
            width: "100%",
            height: "100%",
            display: "block",
        }

        switch (imageFit) {
            case "cover":
                return {
                    ...baseStyle,
                    objectFit: "cover",
                    objectPosition: `${image.positionX || "50%"} ${image.positionY || "50%"}`,
                }
            case "contain":
                return {
                    ...baseStyle,
                    objectFit: "contain",
                    objectPosition: `${image.positionX || "50%"} ${image.positionY || "50%"}`,
                }
            case "fill":
                return {
                    ...baseStyle,
                    objectFit: "fill",
                }
            case "scaleDown":
                return {
                    ...baseStyle,
                    objectFit: "scale-down",
                    objectPosition: `${image.positionX || "50%"} ${image.positionY || "50%"}`,
                }
            case "none":
                return {
                    ...baseStyle,
                    objectFit: "none",
                    objectPosition: `${image.positionX || "50%"} ${image.positionY || "50%"}`,
                }
            default:
                return {
                    ...baseStyle,
                    objectFit: "cover",
                    objectPosition: `${image.positionX || "50%"} ${image.positionY || "50%"}`,
                }
        }
    }

    return (
        <motion.div
            style={{
                ...style,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                perspective: "1200px",
            }}
            onHoverStart={handleHover}
            onHoverEnd={handleHoverEnd}
        >
            <motion.div
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: frameColor,
                    position: "relative",
                    boxShadow: getShadow(),
                }}
                animate={{
                    rotate: isHovered ? 0 : rotation,
                    scale: isHovered ? 1.05 : 1,
                    y: isHovered ? -8 : 0,
                }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                }}
            >
                {/* Top border */}
                <div style={{ height: `${topBorder}px` }} />

                {/* Image Container with side borders */}
                <div
                    style={{
                        padding: `0 ${sideBorder}px`,
                        height: `calc(100% - ${topBorder + bottomBorder}px)`,
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            backgroundColor: "#e8e8e8",
                            overflow: "hidden",
                            position: "relative",
                        }}
                    >
                        {image?.src ? (
                            <>
                                <img
                                    src={image.src}
                                    srcSet={image.srcSet}
                                    alt={image.alt || "Polaroid photo"}
                                    style={getImageStyle()}
                                />

                                {/* Vintage film effects */}
                                {vintageEffect && (
                                    <>
                                        {/* Film grain effect */}
                                        {grainIntensity > 0 && (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    backgroundImage:
                                                        "url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=)",
                                                    backgroundSize:
                                                        "180px 180px",
                                                    opacity:
                                                        grainIntensity / 100,
                                                    pointerEvents: "none",
                                                }}
                                            />
                                        )}

                                        {/* Light leak effect */}
                                        {lightLeak && (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    background:
                                                        "radial-gradient(circle at 20% 30%, rgba(255,200,150,0.2) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(150,180,255,0.15) 0%, transparent 40%)",
                                                    mixBlendMode: "screen",
                                                    pointerEvents: "none",
                                                }}
                                            />
                                        )}

                                        {/* Vignette effect */}
                                        {vignette > 0 && (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    background: `radial-gradient(circle at center, transparent 0%, rgba(0,0,0,${vignette / 100}) 100%)`,
                                                    pointerEvents: "none",
                                                }}
                                            />
                                        )}
                                    </>
                                )}
                            </>
                        ) : (
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#999",
                                    fontSize: "14px",
                                    fontFamily:
                                        "system-ui, -apple-system, sans-serif",
                                }}
                            >
                                Upload Image
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom border */}
                <div style={{ height: `${bottomBorder}px` }} />

                {/* Paper texture overlay */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage:
                            "url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIgLz48ZmVDb2xvck1hdHJpeCB0eXBlPSJzYXR1cmF0ZSIgdmFsdWVzPSIwIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==)",
                        pointerEvents: "none",
                        opacity: 0.5,
                    }}
                />
            </motion.div>
        </motion.div>
    )
}

PolaroidMaker.defaultProps = {
    frameColor: "#F8F8F5",
    rotation: 2,
    shadowIntensity: "medium",
    customShadow: {
        offsetX: 0,
        offsetY: 8,
        blur: 24,
        spread: 0,
        color: "#000000",
        opacity: 15,
    },
    enableAnimation: true,
    vintageEffect: true,
    grainIntensity: 40,
    lightLeak: true,
    vignette: 30,
    imageFit: "cover",
}

addPropertyControls(PolaroidMaker, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Photo",
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain", "fill", "scaleDown", "none"],
        optionTitles: ["Cover", "Contain", "Fill", "Scale Down", "None"],
        defaultValue: "cover",
        displaySegmentedControl: false,
    },
    frameColor: {
        type: ControlType.Color,
        title: "Frame Color",
        defaultValue: "#F8F8F5",
    },
    rotation: {
        type: ControlType.Number,
        title: "Rotation",
        min: -15,
        max: 15,
        step: 0.5,
        unit: "°",
        displayStepper: true,
        defaultValue: 2,
    },
    shadowIntensity: {
        type: ControlType.Enum,
        title: "Shadow",
        options: ["none", "light", "medium", "heavy", "custom"],
        optionTitles: ["None", "Light", "Medium", "Heavy", "Custom"],
        defaultValue: "medium",
        displaySegmentedControl: false,
    },
    customShadow: {
        type: ControlType.Object,
        title: "Custom Shadow",
        controls: {
            offsetX: {
                type: ControlType.Number,
                title: "Offset X",
                min: -50,
                max: 50,
                step: 1,
                unit: "px",
                defaultValue: 0,
            },
            offsetY: {
                type: ControlType.Number,
                title: "Offset Y",
                min: -50,
                max: 50,
                step: 1,
                unit: "px",
                defaultValue: 8,
            },
            blur: {
                type: ControlType.Number,
                title: "Blur",
                min: 0,
                max: 100,
                step: 1,
                unit: "px",
                defaultValue: 24,
            },
            spread: {
                type: ControlType.Number,
                title: "Spread",
                min: -50,
                max: 50,
                step: 1,
                unit: "px",
                defaultValue: 0,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#000000",
            },
            opacity: {
                type: ControlType.Number,
                title: "Opacity",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 15,
            },
        },
        hidden: (props) => props.shadowIntensity !== "custom",
    },
    vintageEffect: {
        type: ControlType.Boolean,
        title: "Vintage Effects",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    grainIntensity: {
        type: ControlType.Number,
        title: "Film Grain",
        min: 0,
        max: 100,
        step: 5,
        unit: "%",
        displayStepper: true,
        defaultValue: 40,
        hidden: (props) => !props.vintageEffect,
    },
    lightLeak: {
        type: ControlType.Boolean,
        title: "Light Leaks",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
        hidden: (props) => !props.vintageEffect,
    },
    vignette: {
        type: ControlType.Number,
        title: "Vignette",
        min: 0,
        max: 100,
        step: 5,
        unit: "%",
        displayStepper: true,
        defaultValue: 30,
        hidden: (props) => !props.vintageEffect,
    },
    enableAnimation: {
        type: ControlType.Boolean,
        title: "Hover Animation",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
})
