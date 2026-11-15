// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useState } from "react"

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function CMSFileSize(props) {
    const {
        attachment,
        fallback = "—",
        fontFamily = "inherit",
        fontSize = 14,
        fontWeight = "400",
        color = "inherit",
        letterSpacing = 0,
        textAlign = "left",
        style,
    } = props

    const [displaySize, setDisplaySize] = useState(fallback)

    useEffect(() => {
        let fileUrl: string | undefined

        if (typeof attachment === "string") {
            fileUrl = attachment
        } else if (attachment && typeof attachment === "object") {
            fileUrl =
                attachment.url ||
                attachment.src ||
                attachment.href ||
                (attachment.assetId
                    ? `https://framerusercontent.com/assets/${attachment.assetId}`
                    : undefined)
        }

        if (!fileUrl || fileUrl.trim() === "" || fileUrl === "#") {
            setDisplaySize(fallback)
            return
        }

        const cleanUrl = fileUrl.split("?")[0]
        let isMounted = true

        function formatSize(bytes: number) {
            if (bytes >= 1048576) {
                return `${(bytes / 1048576).toFixed(1)} MB`
            }

            return `${Math.round(bytes / 1024)} KB`
        }

        fetch(cleanUrl, { method: "HEAD" })
            .then((response) => {
                const lengthHeader = response.headers.get("content-length")

                if (lengthHeader && isMounted) {
                    setDisplaySize(formatSize(parseInt(lengthHeader, 10)))
                    return
                }

                // Fallback when the host does not expose Content-Length for HEAD.
                return fetch(cleanUrl)
                    .then((response) => response.blob())
                    .then((blob) => {
                        if (isMounted) {
                            setDisplaySize(formatSize(blob.size))
                        }
                    })
            })
            .catch(() => {
                if (isMounted) {
                    setDisplaySize(fallback)
                }
            })

        return () => {
            isMounted = false
        }
    }, [attachment, fallback])

    return (
        <span
            style={{
                display: "inline-block",
                fontFamily,
                fontSize: `${fontSize}px`,
                fontWeight,
                color,
                letterSpacing: `${letterSpacing}px`,
                textAlign,
                lineHeight: 1.2,
                ...style,
            }}
        >
            {displaySize}
        </span>
    )
}

addPropertyControls(CMSFileSize, {
    attachment: {
        type: ControlType.File,
        title: "Attachment",
        allowedFileTypes: [
            "pdf",
            "zip",
            "png",
            "jpg",
            "jpeg",
            "webp",
            "svg",
            "gif",
            "mp4",
            "mov",
            "doc",
            "docx",
        ],
    },

    fallback: {
        type: ControlType.String,
        title: "Fallback",
        defaultValue: "—",
    },

    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 14,
        min: 8,
        max: 96,
        step: 1,
        unit: "px",
    },

    fontWeight: {
        type: ControlType.Enum,
        title: "Weight",
        defaultValue: "400",
        options: ["300", "400", "500", "600", "700", "800"],
        optionTitles: [
            "Light",
            "Regular",
            "Medium",
            "Semi Bold",
            "Bold",
            "Extra Bold",
        ],
    },

    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#666666",
    },

    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: "Inter, sans-serif",
    },

    letterSpacing: {
        type: ControlType.Number,
        title: "Tracking",
        defaultValue: 0,
        min: -5,
        max: 10,
        step: 0.1,
        unit: "px",
    },

    textAlign: {
        type: ControlType.Enum,
        title: "Align",
        defaultValue: "left",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
    },
})
