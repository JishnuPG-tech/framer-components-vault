import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Props = {
    text: string
    font: {
        fontSize?: string
        fontFamily?: string
        fontWeight?: string
        fontStyle?: string
        letterSpacing?: string
        lineHeight?: string
    }
    sourceType: "Upload" | "URL"
    uploadedMedia: string
    mediaURL: string
}

export default function TypeSplash({
    text,
    font,
    sourceType,
    uploadedMedia,
    mediaURL,
}: Props) {
    const effectiveMediaURL = sourceType === "Upload" ? uploadedMedia : mediaURL

    const textStyles: React.CSSProperties = {
        fontSize: font.fontSize || "80px",
        fontFamily: font.fontFamily || "Arial, sans-serif",
        fontWeight: font.fontWeight || "bold",
        fontStyle: font.fontStyle || "normal",
        letterSpacing: font.letterSpacing || "0",
        lineHeight: font.lineHeight || "1em",
        color: "transparent",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        whiteSpace: "nowrap",
        textAlign: "center",
        zIndex: 1,
        position: "relative",
        display: "inline-block",
        backgroundImage: `url(${effectiveMediaURL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div style={textStyles}>{text}</div>
        </div>
    )
}

// Framer Controls
addPropertyControls(TypeSplash, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Framer",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "80px",
            fontFamily: "Inter",
            fontWeight: "700",
            letterSpacing: "-0.05em",
            lineHeight: "1em",
        },
        controls: "extended",
    },
    sourceType: {
        type: ControlType.Enum,
        title: "Image Source",
        options: ["URL", "Upload"],
        optionTitles: ["URL", "Upload"],
        defaultValue: "URL",
    },
    uploadedMedia: {
        type: ControlType.Image,
        title: "Image Upload",
        hidden: ({ sourceType }) => sourceType !== "Upload",
    },
    mediaURL: {
        type: ControlType.String,
        title: "URL",
        defaultValue:
            "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        hidden: ({ sourceType }) => sourceType !== "URL",
    },
})
