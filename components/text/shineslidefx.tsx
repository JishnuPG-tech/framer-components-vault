// Shiny text component with animated gradient effect
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { type CSSProperties } from "react"

interface ShinyTextProps {
    text: string
    disabled: boolean
    speed: number
    textColor: string
    shineColor: string
    font: any
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function ShinyText(props: ShinyTextProps) {
    const { text, disabled, speed, textColor, shineColor, font } = props

    const animationDuration = `${speed}s`

    const shinyTextStyle: CSSProperties = {
        color: textColor,
        background: `linear-gradient(
            120deg,
            rgba(255, 255, 255, 0) 40%,
            ${shineColor} 50%,
            rgba(255, 255, 255, 0) 60%
        )`,
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        display: "inline-block",
        animation: disabled
            ? "none"
            : `shine ${animationDuration} linear infinite`,
        ...font,
    }

    return (
        <>
            <style>
                {`
                @keyframes shine {
                    0% {
                        background-position: 100%;
                    }
                    100% {
                        background-position: -100%;
                    }
                }
                `}
            </style>
            <div style={shinyTextStyle}>{text}</div>
        </>
    )
}

addPropertyControls(ShinyText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Just some shiny text!",
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    speed: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 5,
        min: 1,
        max: 10,
        step: 0.5,
        unit: "s",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#b5b5b5a4",
        description: "You have to use less than 100% opacity to see the effect",
    },
    shineColor: {
        type: ControlType.Color,
        title: "Shine Color",
        defaultValue: "rgba(255, 255, 255, 0.8)",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "32px",
            variant: "Semibold",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        description:
            "More Components at [DiverseKit](https://framer.link/se2heI4)",
    },
})
