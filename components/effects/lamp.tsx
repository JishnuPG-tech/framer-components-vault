// Get Started: https://www.framer.com/developers

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

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 */
export default function Lamp(props) {
    const {
        beamColor,
        backgroundColor,
        animationDelay,
        animationDuration,
        beamStart,
        beamEnd,
        lampTop,
        overflowVisible,

        outerGlow,
        innerGlow,

        style,
    } = props

    // Width with its own unit
    const startWidthCss = `${beamStart.width}${beamStart.widthUnit}`
    const endWidthCss = `${beamEnd.width}${beamEnd.widthUnit}`

    // Blob width uses the same unit as width
    const startBlobWidth =
        beamStart.widthUnit === "px"
            ? `${beamStart.width * 0.53}px`
            : `${beamStart.width * 0.53}${beamStart.widthUnit}`

    const endBlobWidth =
        beamEnd.widthUnit === "px"
            ? `${beamEnd.width * 0.53}px`
            : `${beamEnd.width * 0.53}${beamEnd.widthUnit}`

    return (
        <div
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                overflow: overflowVisible ? "visible" : "hidden",
                backgroundColor,
                ...style,
            }}
        >
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    width: "100%",
                    flex: 1,
                    transform: "scaleY(1.25)",
                    alignItems: "center",
                    justifyContent: "center",
                    isolation: "isolate",
                    zIndex: 0,
                    marginTop: lampTop,
                }}
            >
                {/* Left beam */}
                <motion.div
                    initial={{
                        opacity: 0.5,
                        width: startWidthCss,
                    }}
                    animate={{
                        opacity: 1,
                        width: endWidthCss,
                    }}
                    transition={{
                        delay: animationDelay,
                        duration: animationDuration,
                        ease: "easeInOut",
                    }}
                    style={{
                        position: "absolute",
                        right: "50%",
                        height: "14rem",
                        overflow: "hidden",
                        backgroundImage: `conic-gradient(
                            from 70deg at center top,
                            ${beamColor},
                            transparent,
                            transparent
                        )`,
                        maskImage: `
                            linear-gradient(to bottom, white, transparent),
                            linear-gradient(to right, transparent, white 20%)
                        `,
                        maskComposite: "intersect",
                        WebkitMaskImage: `
                            linear-gradient(to bottom, white, transparent),
                            linear-gradient(to right, transparent, white 20%)
                        `,
                        WebkitMaskComposite: "source-in",
                        willChange: "width, opacity",
                        transform: "translateZ(0)",
                        backfaceVisibility: "hidden",
                    }}
                />

                {/* Right beam */}
                <motion.div
                    initial={{
                        opacity: 0.5,
                        width: startWidthCss,
                    }}
                    animate={{
                        opacity: 1,
                        width: endWidthCss,
                    }}
                    transition={{
                        delay: animationDelay,
                        duration: animationDuration,
                        ease: "easeInOut",
                    }}
                    style={{
                        position: "absolute",
                        left: "50%",
                        height: "14rem",
                        overflow: "hidden",
                        backgroundImage: `conic-gradient(
                            from 290deg at center top,
                            transparent,
                            transparent,
                            ${beamColor}
                        )`,
                        maskImage: `
                            linear-gradient(to bottom, white, transparent),
                            linear-gradient(to left, transparent, white 20%)
                        `,
                        maskComposite: "intersect",
                        WebkitMaskImage: `
                            linear-gradient(to bottom, white, transparent),
                            linear-gradient(to left, transparent, white 20%)
                        `,
                        WebkitMaskComposite: "source-in",
                        willChange: "width, opacity",
                        transform: "translateZ(0)",
                        backfaceVisibility: "hidden",
                    }}
                />

                {/* Blur overlay */}
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        height: "12rem",
                        width: "100%",
                        transform: "translateY(3rem) scaleX(1.5)",
                        backgroundColor,
                        filter: "blur(1rem)",
                    }}
                />

                {/* Outer glow */}
                {outerGlow.visible && (
                    <div
                        style={{
                            position: "absolute",
                            zIndex: 30,
                            height: `${outerGlow.height}rem`,
                            width: `${outerGlow.width}rem`,
                            transform: "translateY(-50%)",
                            borderRadius: "9999px",
                            backgroundColor: beamColor,
                            opacity: outerGlow.opacity,
                            filter: `blur(${outerGlow.blur}rem)`,
                        }}
                    />
                )}

                {/* Inner glow */}
                {innerGlow.visible && (
                    <motion.div
                        initial={{
                            width: startBlobWidth,
                        }}
                        animate={{
                            width: endBlobWidth,
                        }}
                        transition={{
                            delay: animationDelay,
                            duration: animationDuration,
                            ease: "easeInOut",
                        }}
                        style={{
                            position: "absolute",
                            zIndex: 50,
                            height: "9rem",
                            transform: "translateY(-6rem)",
                            borderRadius: "9999px",
                            backgroundColor: beamColor,
                            filter: `blur(${innerGlow.blur}rem)`,
                            opacity: innerGlow.opacity,
                        }}
                    />
                )}

                {/* Top cover */}
                <div
                    style={{
                        position: "absolute",
                        zIndex: 40,
                        height: "16rem",
                        width: "100%",
                        transform: "translateY(-15rem)",
                        backgroundColor,
                    }}
                />
            </div>
        </div>
    )
}

Lamp.defaultProps = {
    beamColor: "#FF008C",
    backgroundColor: "#000000",
    animationDelay: 0.3,
    animationDuration: 0.8,

    beamStart: {
        width: 240,
        widthUnit: "px",
    },

    beamEnd: {
        width: 480,
        widthUnit: "px",
    },

    lampTop: 216,
    overflowVisible: false,

    outerGlow: {
        visible: true,
        opacity: 0.2,
        blur: 20,
        width: 1,
        height: 1,
    },

    innerGlow: {
        visible: true,
        opacity: 0.9,
        blur: 4.7,
    },
}

addPropertyControls(Lamp, {
    beamColor: {
        title: "Beam Color",
        type: ControlType.Color,
        defaultValue: "#FF008C",
    },

    backgroundColor: {
        title: "Background",
        type: ControlType.Color,
        defaultValue: "#000000",
    },

    beamStart: {
        title: "Beam Start",
        type: ControlType.Object,
        controls: {
            width: {
                title: "Width",
                type: ControlType.Number,
                defaultValue: 240,
                min: 0,
                max: 2000,
            },

            widthUnit: {
                title: "Width Unit",
                type: ControlType.Enum,
                options: ["px", "%"],
                optionTitles: ["px", "%"],
                defaultValue: "px",
            },
        },
    },

    beamEnd: {
        title: "Beam End",
        type: ControlType.Object,
        controls: {
            width: {
                title: "Width",
                type: ControlType.Number,
                defaultValue: 480,
                min: 0,
                max: 2000,
            },

            widthUnit: {
                title: "Width Unit",
                type: ControlType.Enum,
                options: ["px", "%"],
                optionTitles: ["px", "%"],
                defaultValue: "px",
            },
        },
    },

    lampTop: {
        title: "Lamp Top",
        type: ControlType.Number,
        defaultValue: 216,
        min: -400,
        max: 400,
        step: 1,
        unit: "px",
    },

    overflowVisible: {
        title: "Overflow Visible",
        type: ControlType.Boolean,
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    outerGlow: {
        title: "Outer Glow",
        type: ControlType.Object,
        controls: {
            visible: {
                title: "Visible",
                type: ControlType.Boolean,
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },

            opacity: {
                title: "Opacity",
                type: ControlType.Number,
                defaultValue: 0.2,
                min: 0,
                max: 1,
                step: 0.01,
            },

            blur: {
                title: "Blur",
                type: ControlType.Number,
                defaultValue: 20,
                min: 0,
                max: 20,
                step: 0.1,
                unit: "rem",
            },

            width: {
                title: "Width",
                type: ControlType.Number,
                defaultValue: 1,
                min: 1,
                max: 100,
                step: 0.5,
                unit: "rem",
            },

            height: {
                title: "Height",
                type: ControlType.Number,
                defaultValue: 1,
                min: 1,
                max: 50,
                step: 0.5,
                unit: "rem",
            },
        },
    },

    innerGlow: {
        title: "Inner Glow",
        type: ControlType.Object,
        controls: {
            visible: {
                title: "Visible",
                type: ControlType.Boolean,
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },

            opacity: {
                title: "Opacity",
                type: ControlType.Number,
                defaultValue: 0.9,
                min: 0,
                max: 1,
                step: 0.01,
            },

            blur: {
                title: "Blur",
                type: ControlType.Number,
                defaultValue: 4.7,
                min: 0,
                max: 20,
                step: 0.1,
                unit: "rem",
            },
        },
    },

    animationDelay: {
        title: "Anim Delay",
        type: ControlType.Number,
        defaultValue: 0.3,
        min: 0,
        max: 10,
        step: 0.1,
        unit: "s",
    },

    animationDuration: {
        title: "Anim Duration",
        type: ControlType.Number,
        defaultValue: 0.8,
        min: 0.1,
        max: 10,
        step: 0.1,
        unit: "s",
    },
})
