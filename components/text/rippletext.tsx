// Ripple text effect component with water ripple animation

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

interface RippleTextProps {
    text: string
    textColor: string
    font: CSSProperties
    turbulenceFrequency: number
    displacementScale: number
    animationDuration: number
    style?: CSSProperties
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto

 */
export default function RippleText(props: RippleTextProps) {
    const {
        text,
        textColor,
        font,
        turbulenceFrequency,
        displacementScale,
        animationDuration,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    // Static fallback
    if (isStatic) {
        return (
            <p
                style={{
                    ...style,
                    color: textColor,
                    margin: 0,
                    maxWidth: "100%",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    ...font,
                }}
            >
                {text}
            </p>
        )
    }

    // Animated version
    const filterId = "water-ripple-filter"
    const minFreq = turbulenceFrequency * 0.4
    const maxFreq = turbulenceFrequency

    return (
        <div
            style={{
                ...style,
                position: "relative",
                display: "inline-block",
                width: "100%",
            }}
        >
            <svg
                style={{
                    position: "absolute",
                    width: 0,
                    height: 0,
                    pointerEvents: "none",
                }}
            >
                <filter id={filterId}>
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency={turbulenceFrequency}
                        numOctaves={2}
                        result="ripple"
                    >
                        <animate
                            attributeName="baseFrequency"
                            dur={`${animationDuration}s`}
                            values={`${minFreq};${maxFreq};${minFreq}`}
                            repeatCount="indefinite"
                        />
                    </feTurbulence>
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="ripple"
                        scale={displacementScale}
                    />
                </filter>
            </svg>

            <p
                style={{
                    filter: `url(#${filterId})`,
                    color: textColor,
                    margin: 0,
                    maxWidth: "100%",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    ...font,
                }}
            >
                {text}
            </p>
        </div>
    )
}

addPropertyControls(RippleText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Breathe",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "48px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
    },
    turbulenceFrequency: {
        type: ControlType.Number,
        title: "Ripple Frequency",
        defaultValue: 0.05,
        min: 0.01,
        max: 0.2,
        step: 0.01,
    },
    displacementScale: {
        type: ControlType.Number,
        title: "Ripple Intensity",
        defaultValue: 5,
        min: 0,
        max: 20,
        step: 1,
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 10,

        description:
            "[Component by Tanjir i.](https://www.linkedin.com/in/tanjir-i-5ab6b6373/)",
        min: 1,
        max: 30,
        step: 1,
        unit: "s",
    },
})
