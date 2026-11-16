// Animated ball bouncing on a rotating bar
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import type { CSSProperties } from "react"

interface BouncingBallProps {
    barColor: string
    ballColor: string
    ballEyeColor: string
    barWidth: number
    barHeight: number
    ballSize: number
    animationDuration: number
    animationPreset: string
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function BouncingBall(props: BouncingBallProps) {
    const {
        barColor,
        ballColor,
        ballEyeColor,
        barWidth,
        barHeight,
        ballSize,
        animationDuration,
        animationPreset,
        style,
    } = props

    // Check if component is in static renderer (Canvas or Export)
    const isStatic = useIsStaticRenderer()

    // Detect if component is in fill mode
    const isWidthFill = style?.width === "100%"
    const isHeightFill = style?.height === "100%"

    // Calculate required height for the animation
    // Ball is positioned above bar by its own size
    // Bar rotates ±15deg which needs clearance
    // Total height needed: ball size + ball offset + bar height + rotation clearance + extra bottom space
    const ballOffset = ballSize
    const rotationClearance = 30
    const extraBottomSpace = 40
    const calculatedHeight =
        ballSize + ballOffset + barHeight + rotationClearance + extraBottomSpace

    // Animation presets configuration
    const presets = {
        Classic: {
            barRotateFrom: -15,
            barRotateTo: 15,
            ballRotateFrom: 360,
            ballRotateTo: 0,
            easing: "ease-in-out",
            duration: animationDuration,
        },
        "Fast Bounce": {
            barRotateFrom: -25,
            barRotateTo: 25,
            ballRotateFrom: 720,
            ballRotateTo: 0,
            easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
            duration: animationDuration * 0.6,
        },
        "Slow Roll": {
            barRotateFrom: -10,
            barRotateTo: 10,
            ballRotateFrom: 180,
            ballRotateTo: 0,
            easing: "ease",
            duration: animationDuration * 1.5,
        },
        Energetic: {
            barRotateFrom: -30,
            barRotateTo: 30,
            ballRotateFrom: 540,
            ballRotateTo: 0,
            easing: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            duration: animationDuration * 0.8,
        },
        "Smooth Glide": {
            barRotateFrom: -8,
            barRotateTo: 8,
            ballRotateFrom: 360,
            ballRotateTo: 0,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            duration: animationDuration * 1.2,
        },
    }

    const currentPreset = presets[animationPreset] || presets["Classic"]

    // Calculate mid-point position for static preview
    const staticBallPosition = `calc(50% - ${ballSize * 0.5}px)`

    return (
        <div
            style={{
                ...style,
                ...(isWidthFill ? { width: "100%" } : { width: "max-content" }),
                ...(isHeightFill
                    ? { height: "100%" }
                    : { height: `${calculatedHeight}px` }),
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                position: "relative",
                overflow: "visible",
            }}
        >
            {!isStatic && (
                <style>
                    {`
                    @keyframes up-down6123 {
                        from {
                            transform: rotate(${currentPreset.barRotateFrom}deg);
                        }
                        to {
                            transform: rotate(${currentPreset.barRotateTo}deg);
                        }
                    }

                    @keyframes ball-move8234 {
                        from {
                            left: calc(100% - ${ballSize * 0.8}px);
                            transform: rotate(${currentPreset.ballRotateFrom}deg);
                        }
                        to {
                            left: calc(0% - ${ballSize * 0.4}px);
                            transform: rotate(${currentPreset.ballRotateTo}deg);
                        }
                    }
                `}
                </style>
            )}
            <div
                className="bar"
                style={{
                    width: `${barWidth}px`,
                    height: `${barHeight}px`,
                    background: barColor,
                    borderRadius: "30px",
                    transform: isStatic
                        ? "rotate(0deg)"
                        : `rotate(${currentPreset.barRotateFrom}deg)`,
                    animation: isStatic
                        ? "none"
                        : `up-down6123 ${currentPreset.duration}s ${currentPreset.easing} 1s infinite alternate`,
                    position: "relative",
                    marginBottom: "30px",
                }}
            >
                <div
                    className="ball"
                    style={{
                        position: "relative",
                        bottom: `${ballSize}px`,
                        left: isStatic
                            ? staticBallPosition
                            : `calc(100% - ${ballSize * 0.4}px)`,
                        width: `${ballSize}px`,
                        height: `${ballSize}px`,
                        background: ballColor,
                        borderRadius: "50%",
                        animation: isStatic
                            ? "none"
                            : `ball-move8234 ${currentPreset.duration}s ${currentPreset.easing} 1s infinite alternate`,
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            content: '""',
                            top: `${ballSize * 0.5}px`,
                            right: `${ballSize * 0.1}px`,
                            width: `${ballSize * 0.1}px`,
                            height: `${ballSize * 0.1}px`,
                            background: ballEyeColor,
                            borderRadius: "50%",
                        }}
                    />
                </div>
            </div>
        </div>
    )
}

addPropertyControls(BouncingBall, {
    barColor: {
        type: ControlType.Color,
        title: "Bar Color",
        defaultValue: "#FFDAAF",
    },
    ballColor: {
        type: ControlType.Color,
        title: "Ball Color",
        defaultValue: "#FFFFFF",
    },
    ballEyeColor: {
        type: ControlType.Color,
        title: "Ball Eye Color",
        defaultValue: "#000000",
    },
    barWidth: {
        type: ControlType.Number,
        title: "Bar Width",
        defaultValue: 740,
        min: 100,
        step: 10,
        unit: "px",
        displayStepper: true,
    },
    barHeight: {
        type: ControlType.Number,
        title: "Bar Height",
        defaultValue: 24,
        min: 5,
        max: 50,
        step: 0.5,
        unit: "px",
        displayStepper: true,
    },
    ballSize: {
        type: ControlType.Number,
        title: "Ball Size",
        defaultValue: 100,
        min: 20,
        max: 100,
        step: 5,
        unit: "px",
        displayStepper: true,
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 0.5,
        unit: "s",
        displayStepper: true,
    },
    animationPreset: {
        type: ControlType.Enum,
        description:
            "More components at [Hamim Reza @hreza](https://hreza.lemonsqueezy.com)",
        title: "Animation Preset",
        options: [
            "Classic",
            "Fast Bounce",
            "Slow Roll",
            "Energetic",
            "Smooth Glide",
        ],
        defaultValue: "Slow Roll",
    },
})
