// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { steps } from "@motionone/easing"

interface GrainProps {
    animate: boolean
    animationSpeed: number
    opacity: number
    grainSize: number
    style?: React.CSSProperties
}

/**
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 300
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */

export default function Grain({
    animate,
    animationSpeed,
    opacity,
    grainSize,
    style,
}: GrainProps) {
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const keyframesX = [
        "0%",
        "-5%",
        "-15%",
        "7%",
        "-5%",
        "-15%",
        "15%",
        "0%",
        "3%",
        "-10%",
    ]
    const keyframesY = [
        "0%",
        "-10%",
        "5%",
        "-25%",
        "25%",
        "10%",
        "0%",
        "15%",
        "35%",
        "10%",
    ]

    const containerStyle: React.CSSProperties = {
        background: `url('https://framerusercontent.com/images/rR6HYXBrMmX4cRpXfXUOvpvpB0.png')`,
        backgroundSize: `${grainSize}px ${grainSize}px`,
        backgroundRepeat: "repeat",
        position: "absolute",
        inset: isCanvas ? 0 : "-200%",
        width: isCanvas ? "100%" : "400%",
        height: isCanvas ? "100%" : "400%",
        opacity,
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                ...style,
            }}
        >
            <motion.div
                style={containerStyle}
                animate={
                    !isCanvas && animate
                        ? { x: keyframesX, y: keyframesY }
                        : undefined
                }
                transition={{
                    ease: steps(10, "start"),
                    repeat: Infinity,
                    duration: 8 / animationSpeed,
                }}
            />
        </div>
    )
}

Grain.defaultProps = {
    animate: true,
    animationSpeed: 1,
    opacity: 0.25,
    grainSize: 250,
}

addPropertyControls(Grain, {
    animate: {
        title: "Animate",
        type: ControlType.Boolean,
        defaultValue: true,
    },
    animationSpeed: {
        title: "Speed",
        type: ControlType.Number,
        min: 0.1,
        max: 3,
        step: 0.1,
        defaultValue: 1,
        displayStepper: true,
        hidden: (props) => !props.animate,
    },
    opacity: {
        title: "Opacity",
        type: ControlType.Number,
        step: 0.01,
        displayStepper: true,
        max: 1,
        min: 0,
        defaultValue: 0.25,
    },
    grainSize: {
        title: "Size",
        type: ControlType.Number,
        min: 50,
        max: 550,
        step: 10,
        defaultValue: 250,
        unit: "px",
    },
})
