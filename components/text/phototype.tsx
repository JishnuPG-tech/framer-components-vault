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

interface PhotoTypeProps {
    text: string
    backgroundImage: {
        src: string
        alt: string
    }
    font: CSSProperties
    backgroundSize: "cover" | "contain" | "custom"
    backgroundScale: number
    backgroundPosition: string
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function PhotoType(props: PhotoTypeProps) {
    const {
        text,
        backgroundImage = {
            src: "https://cdn.leonardo.ai/users/0e0b0752-6cb4-4669-ac04-141bba3c52f2/generations/e48d0491-d7e0-4077-a99f-6008baa50846/segments/4:4:1/Lucid_Origin_a_cinematic_photo_of_a_Night_city_street_at_dusk__3.jpg",
            alt: "Background",
        },
        font,
        backgroundSize = "cover",
        backgroundScale = 100,
        backgroundPosition = "center",
        style,
    } = props

    const isFixedWidth = style?.width === "100%"

    const actualBackgroundSize =
        backgroundSize === "custom" ? `${backgroundScale}%` : backgroundSize

    return (
        <div
            style={{
                ...style,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                ...(isFixedWidth ? {} : { width: "max-content" }),
            }}
        >
            <h1
                style={{
                    margin: 0,
                    padding: 0,
                    backgroundImage: `url(${backgroundImage.src})`,
                    backgroundSize: actualBackgroundSize,
                    backgroundPosition: backgroundPosition,
                    backgroundRepeat: "no-repeat",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "transparent",
                    textTransform: "uppercase",
                    whiteSpace: isFixedWidth ? "normal" : "nowrap",
                    wordBreak: isFixedWidth ? "break-word" : "normal",
                    ...font,
                }}
            >
                {text}
            </h1>
        </div>
    )
}

addPropertyControls(PhotoType, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "The Name Is SHammo",
    },
    backgroundImage: {
        type: ControlType.ResponsiveImage,
        title: "Background Image",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "120px",
            variant: "Black",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    backgroundSize: {
        type: ControlType.Enum,
        title: "Image Size",
        options: ["cover", "contain", "custom"],
        optionTitles: ["Cover", "Contain", "Custom"],
        defaultValue: "cover",
    },
    backgroundScale: {
        type: ControlType.Number,
        title: "Scale",
        defaultValue: 100,
        min: 10,
        max: 500,
        step: 1,
        unit: "%",
        hidden: ({ backgroundSize }) => backgroundSize !== "custom",
    },
    backgroundPosition: {
        type: ControlType.Enum,
        title: "Image Position",
        options: [
            "center",
            "top",
            "bottom",
            "left",
            "right",
            "top left",
            "top right",
            "bottom left",
            "bottom right",
        ],
        optionTitles: [
            "Center",
            "Top",
            "Bottom",
            "Left",
            "Right",
            "Top Left",
            "Top Right",
            "Bottom Left",
            "Bottom Right",
        ],
        defaultValue: "center",
    },
})
