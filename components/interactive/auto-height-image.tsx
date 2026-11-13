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
    src: string
    width: number
    alt: string
}

// @framerDisableUnlink
export default function AutoHeightImage({ src, width, alt = "Image" }: Props) {
    // Return null or a placeholder div if no image is provided
    if (!src) {
        return (
            <div
                style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    backgroundColor: "#f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#999",
                    fontSize: "14px",
                    padding: "20px",
                }}
            >
                Select an image in
                <br />
                the properties panel
            </div>
        )
    }

    return (
        <img
            src={src}
            style={{ width: "100%", height: "auto", display: "block" }}
            alt={alt}
        />
    )
}

// Property Controls for Framer UI
addPropertyControls(AutoHeightImage, {
    src: {
        type: ControlType.Image,
        title: "Image",
    },
    alt: {
        type: ControlType.String,
        title: "Alt Text",
        defaultValue: "Image",
        placeholder: "Describe this image...",
    },
})
