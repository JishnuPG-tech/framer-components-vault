// Video mask component that uses text to mask a video with full text control
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

interface TextVideoMaskProps {
    useVideoFile: boolean
    videoFile: string
    videoUrl: string
    text: string
    font: any
    textColor: string
    backgroundColor: string
    autoplay: boolean
    loop: boolean
    muted: boolean
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TextVideoMask(props: TextVideoMaskProps) {
    const {
        useVideoFile = true,
        videoFile = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        videoUrl = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        text = "VIDEO",
        font,
        textColor = "#FFFFFF",
        backgroundColor = "#000000",
        autoplay = true,
        loop = true,
        muted = true,
    } = props

    const maskId = `video-mask-${Math.random().toString(36).substr(2, 9)}`
    const videoSource = useVideoFile ? videoFile : videoUrl

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                backgroundColor,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <svg
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                }}
            >
                <defs>
                    <mask id={maskId}>
                        <rect width="100%" height="100%" fill="black" />
                        <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="white"
                            style={{
                                fontSize: font?.fontSize || "48px",
                                fontFamily: font?.fontFamily || "Inter",
                                fontWeight: font?.fontWeight || 700,
                                fontStyle: font?.fontStyle || "normal",
                                letterSpacing: font?.letterSpacing || "-0.02em",
                            }}
                        >
                            {text}
                        </text>
                    </mask>
                </defs>
            </svg>

            <video
                src={videoSource}
                autoPlay={autoplay}
                loop={loop}
                muted={muted}
                playsInline
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    mask: `url(#${maskId})`,
                    WebkitMask: `url(#${maskId})`,
                }}
            />
        </div>
    )
}

addPropertyControls(TextVideoMask, {
    useVideoFile: {
        type: ControlType.Boolean,
        title: "Video",
        defaultValue: true,
        enabledTitle: "Upload",
        disabledTitle: "URL",
    },
    videoFile: {
        type: ControlType.File,
        allowedFileTypes: ["mp4", "webm", "mov"],
        title: "Upload",
        hidden: ({ useVideoFile }) => !useVideoFile,
    },
    videoUrl: {
        type: ControlType.String,
        title: "Video URL",
        defaultValue: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        placeholder: "Enter video URL...",
        hidden: ({ useVideoFile }) => useVideoFile,
    },
    text: {
        type: ControlType.String,
        title: "Mask Text",
        defaultValue: "VIDEO",
    },
    font: {
        type: ControlType.Font,
        title: "Text Font",
        defaultValue: {
            fontSize: "48px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
            textAlign: "center",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#000000",
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    muted: {
        type: ControlType.Boolean,
        title: "Muted",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})