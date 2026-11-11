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
 * NOISE OVERLAY
 *
 * A customizable noise overlay to add film grain texture to your designs.
 * Place on top of any element and adjust blend mode for best results.
 *
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 300
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function NoiseOverlay(props) {
    const {
        opacity,
        blendMode,
        grainSize,
        grainColor,
        animated,
        animationSpeed,
        numOctaves,
    } = props

    const filterId = `grainFilter-${grainSize}-${numOctaves}`
    const animDuration = `${(1 / animationSpeed).toFixed(2)}s`
    const baseFrequency = (1 / grainSize) * 0.5

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                pointerEvents: "none",
                opacity: opacity,
                mixBlendMode: blendMode,
            }}
        >
            <svg
                width="100%"
                height="100%"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: "block" }}
            >
                <filter id={filterId} x="0%" y="0%" width="100%" height="100%">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency={baseFrequency}
                        numOctaves={numOctaves}
                        stitchTiles="stitch"
                        seed="2"
                        result="noise"
                    >
                        {animated && (
                            <animate
                                attributeName="seed"
                                values="0;200"
                                dur={animDuration}
                                repeatCount="indefinite"
                            />
                        )}
                    </feTurbulence>
                    <feFlood floodColor={grainColor} result="color" />
                    <feComposite in="color" in2="noise" operator="in" />
                </filter>
                <rect width="100%" height="100%" filter={`url(#${filterId})`} />
            </svg>
        </div>
    )
}

NoiseOverlay.defaultProps = {
    opacity: 0.8,
    blendMode: "normal",
    grainSize: 0.3,
    grainColor: "#306967",
    animated: true,
    animationSpeed: 8,
    numOctaves: 2,
}

addPropertyControls(NoiseOverlay, {
    grainColor: {
        type: ControlType.Color,
        title: "Color",
        description: "Base tint color of the grain.",
        defaultValue: "#306967",
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        description: "Overall visibility of the grain layer.",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: true,
    },
    grainSize: {
        type: ControlType.Number,
        title: "Grain Size",
        description:
            "Controls the frequency of the noise pattern. Lower = finer grain.",
        defaultValue: 0.3,
        min: 0.1,
        max: 5,
        step: 0.05,
        displayStepper: true,
    },
    numOctaves: {
        type: ControlType.Number,
        title: "Detail",
        description: "Number of noise layers. Higher = more complex texture.",
        defaultValue: 2,
        min: 1,
        max: 8,
        step: 1,
        displayStepper: true,
    },
    animated: {
        type: ControlType.Boolean,
        title: "Animated",
        description: "Animates the grain for a live film effect.",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Speed",
        description: "How fast the grain animates (frames per second).",
        defaultValue: 8,
        min: 1,
        max: 30,
        step: 1,
        unit: "fps",
        displayStepper: true,
        hidden: (props) => !props.animated,
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Blend Mode",
        description:
            "How the grain blends with content beneath it. \n\nMade by [Maraslux](https://framer.link/marasluxx)",
        defaultValue: "normal",
        options: [
            "normal",
            "multiply",
            "screen",
            "overlay",
            "darken",
            "lighten",
            "color-dodge",
            "color-burn",
            "hard-light",
            "soft-light",
            "difference",
            "exclusion",
        ],
        optionTitles: [
            "Normal",
            "Multiply",
            "Screen",
            "Overlay",
            "Darken",
            "Lighten",
            "Color Dodge",
            "Color Burn",
            "Hard Light",
            "Soft Light",
            "Difference",
            "Exclusion",
        ],
    },
})
