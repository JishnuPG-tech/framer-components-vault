// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useMemo, type CSSProperties } from "react"

interface TextBloom {
    text: string
    textColor: string
    font: CSSProperties
    animationDuration: number
    AnimationVariation: "start" | "center" | "end"
    style?: CSSProperties
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */

export default function TextBloom(props: TextBloom) {
    const {
        text,
        textColor,
        font,
        animationDuration,
        AnimationVariation,
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

    const animationName = useMemo(() => "helloAnim", [])

    useEffect(() => {
        const styleId = "text-bloom"

        if (
            typeof document !== "undefined" &&
            !document.getElementById(styleId)
        ) {
            const styleElement = document.createElement("style")
            styleElement.id = styleId
            styleElement.textContent = `
                @keyframes ${animationName} {
                    0% {
                        letter-spacing: -1ch;
                        color: transparent;
                        opacity: 0;
                    }
                    40% {
                        opacity: 1;
                    }
                    100% {
                        letter-spacing: 0ch;
                        opacity: 1;

                    word-break: break-word;
                    overflow-wrap: break-word;
                    }
                }
            `
            document.head.appendChild(styleElement)
        }
    }, [])

    return (
        <div
            style={{
                ...style,
                width: "100%",
                display: "flex",
                justifyContent: AnimationVariation,
            }}
        >
            <p
                style={{
                    margin: 0,

                    animation: `${animationName} ${animationDuration}s forwards`,
                    opacity: 0,
                    color: textColor,
                    maxWidth: "100%",

                    ...font,
                }}
            >
                {text}
            </p>
        </div>
    )
}

addPropertyControls(
    TextBloom,

    {
        text: {
            type: ControlType.String,
            title: "Text",
            defaultValue: "TextBloom",
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
                fontSize: "20px",
                variant: "Regular",
                letterSpacing: "0em",
                lineHeight: "1.2em",
            },
        },
        AnimationVariation: {
            type: ControlType.Enum,
            title: "Animation Variation",
            options: ["start", "center", "end"],
            optionTitles: ["start", "center", "end"],
            defaultValue: "center",
            displaySegmentedControl: true,
        },
        animationDuration: {
            type: ControlType.Number,
            title: "Animation Duration",
            defaultValue: 1.2,
            description:
                "[Component by Tanjir i.](https://www.linkedin.com/in/tanjir-i-5ab6b6373/)",

            min: 0.1,
            max: 5,
            step: 0.1,
            unit: "s",
        },
    }
)
