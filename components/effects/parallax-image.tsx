// ParallaxFixedImage: A parallax image component where the image stays fixed in place while the user scrolls. Supports image upload, opacity, overlay color, border radius, and responsive sizing.
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useMemo, type CSSProperties } from "react"

const defaultImage = {
    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
    alt: "Gradient 1 - Blue"
}

interface ParallaxFixedImageProps {
    image: { src: string; alt?: string }
    opacity: number
    overlayColor: string
    overlayOpacity: number
    borderRadius: string
    imagePosition: string
    style?: CSSProperties
}

/**
 * ParallaxFixedImage
 *
 * @framerSupportedLayoutWidth 100%
 * @framerSupportedLayoutHeight fixed
 */
export default function ParallaxFixedImage(props: ParallaxFixedImageProps) {
    const {
        image = defaultImage,
        opacity = 1,
        overlayColor = "#000000",
        overlayOpacity = 0,
        borderRadius = "0px",
        imagePosition = "center",
        style = {},
    } = props

    const overlayRGBA = useMemo(() => {
        // Convert hex to rgba
        let hex = overlayColor.replace("#", "")
        if (hex.length === 3) hex = hex.split("").map(x => x + x).join("")
        const num = parseInt(hex, 16)
        const r = (num >> 16) & 255
        const g = (num >> 8) & 255
        const b = num & 255
        return `rgba(${r},${g},${b},${overlayOpacity})`
    }, [overlayColor, overlayOpacity])

    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius,
                display: "flex",
                alignItems: "stretch",
                justifyContent: "stretch",
                background: "transparent",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    zIndex: 1,
                    pointerEvents: "none",
                    borderRadius,
                    background: overlayOpacity > 0 ? overlayRGBA : undefined,
                    width: "100%",
                    height: "100%",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    zIndex: 0,
                    pointerEvents: "none",
                    borderRadius,
                    backgroundImage: `url(${image.src})`,
                    backgroundSize: "cover",
                    backgroundPosition: imagePositionToCSS(imagePosition),
                    backgroundRepeat: "no-repeat",
                    backgroundAttachment: "fixed",
                    opacity,
                    transition: "opacity 0.2s cubic-bezier(.4,0,.2,1)",
                    width: "100%",
                    height: "100%",
                }}
                aria-label={image.alt || "Parallax image"}
                role="img"
            />
        </div>
    )
}

function imagePositionToCSS(position) {
    switch (position) {
        case "center":
            return "center";
        case "topLeft":
            return "left top";
        case "topRight":
            return "right top";
        case "bottomLeft":
            return "left bottom";
        case "bottomRight":
            return "right bottom";
        default:
            return "center";
    }
}

addPropertyControls(ParallaxFixedImage, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    opacity: {
        type: ControlType.Number,
        title: "Image Opacity",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 1,
        unit: "",
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        defaultValue: "#000000",
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay Opacity",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0,
        unit: "",
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Border Radius",
        defaultValue: "0px",
    },
    imagePosition: {
        type: ControlType.Enum,
        title: "Image Position",
        options: ["center", "topLeft", "topRight", "bottomLeft", "bottomRight"],
        defaultValue: "center",
    },
})
