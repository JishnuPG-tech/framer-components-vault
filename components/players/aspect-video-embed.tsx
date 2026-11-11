import { useEffect, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Props {
    url: string
    radius: number
    style?: CSSProperties
}

/**
 * Aspect Embed
 *
 * The component fills the available width and calculates its height
 * from the detected Aspect media ratio.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 540
 * @framerDisableUnlink
 */
export default function AspectEmbed({ url, radius, style }: Props) {
    const [ratio, setRatio] = useState(16 / 9)

    useEffect(() => {
        const shareId = url?.match(/\/share\/([0-9a-f-]{36})/i)?.[1]

        if (!shareId) {
            setRatio(16 / 9)
            return
        }

        const image = new Image()

        image.onload = () => {
            if (image.naturalWidth > 0 && image.naturalHeight > 0) {
                setRatio(image.naturalWidth / image.naturalHeight)
            }
        }

        image.onerror = () => {
            setRatio(16 / 9)
        }

        image.src = `https://api.aspect.inc/shares/${shareId}/social-card-image`

        return () => {
            image.onload = null
            image.onerror = null
        }
    }, [url])

    return (
        <div
            style={{
                ...style,
                width: "100%",
                aspectRatio: String(ratio),
                position: "relative",
                overflow: "hidden",
                borderRadius: radius,
                background: "#000",
            }}
        >
            {url ? (
                <iframe
                    src={url}
                    title="Aspect video"
                    loading="lazy"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
                    allowFullScreen
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        border: 0,
                        display: "block",
                    }}
                />
            ) : (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                        background: "#1a1a1a",
                        color: "#888",
                        fontSize: 13,
                        fontFamily: "Inter, sans-serif",
                    }}
                >
                    Paste an Aspect URL
                </div>
            )}
        </div>
    )
}

AspectEmbed.defaultProps = {
    url: "",
    radius: 12,
}

addPropertyControls(AspectEmbed, {
    url: {
        type: ControlType.String,
        title: "URL",
        placeholder: "https://app.aspect.inc/share/…/embed",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },
})
