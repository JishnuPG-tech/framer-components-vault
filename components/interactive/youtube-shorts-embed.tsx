// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function ShortsEmbed({ videoUrl, borderRadius }) {
    const isYouTubeShort = videoUrl?.includes("youtube.com/shorts")

    const getEmbedUrl = () => {
        if (!videoUrl) return null
        if (isYouTubeShort) {
            return videoUrl.replace("/shorts/", "/embed/")
        }
        return null
    }

    const embedUrl = getEmbedUrl()

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                minWidth: "300px",
                minHeight: "533px",
                position: "relative",
                borderRadius: borderRadius,
                overflow: "hidden",
                backgroundColor: "#000",
            }}
        >
            {embedUrl ? (
                <iframe
                    src={embedUrl}
                    frameBorder="0"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        border: "none",
                    }}
                ></iframe>
            ) : (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        color: "#999",
                        textAlign: "center",
                        fontSize: "14px",
                        padding: "20px",
                    }}
                >
                    Add your Shorts video link here
                </div>
            )}
        </div>
    )
}

ShortsEmbed.defaultProps = {
    width: 300,
    height: 533,
}

addPropertyControls(ShortsEmbed, {
    videoUrl: {
        type: ControlType.String,
        title: "Video URL",
        placeholder: "Add Shorts link here",
        defaultValue: "",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 0,
        min: 0,
        max: 50,
        unit: "px",
    },
})
