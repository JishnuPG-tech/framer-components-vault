// Customizable text component with image mask, adjustable image fit (cover, contain, percent), and font controls
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

interface ImageMaskTextProps {
    text: string
    image: { src: string; alt: string }
    imageFit: "cover" | "contain" | "percent"
    imagePercent: number
    font: any
    textColor: string
    style?: CSSProperties
}

/**
 * ImageMaskText
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ImageMaskText(props: ImageMaskTextProps) {
    const { text, image, imageFit, imagePercent, font, style } = props

    // Calculate background size and position
    const bgSize = useMemo(() => {
        if (imageFit === "cover") return "cover"
        if (imageFit === "contain") return "contain"
        // percent
        return `${imagePercent}%`
    }, [imageFit, imagePercent])

    const bgPosition = useMemo(() => {
        if (imageFit === "percent") return "center"
        return "center"
    }, [imageFit])

    // Map text alignment to flex justifyContent
    const justifyContent = useMemo(() => {
        const textAlign = font?.textAlign || "center"
        switch (textAlign) {
            case "left":
                return "flex-start"
            case "right":
                return "flex-end"
            case "center":
            default:
                return "center"
        }
    }, [font?.textAlign])

    const useImageMask =
        image && image.src && imageFit !== undefined && image.src !== ""

    return (
        <div
            style={{
                ...style,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: justifyContent,
                position: "relative",
                overflow: "hidden",
            }}
        >
            <span
                style={{
                    ...font,
                    width: "max-content",
                    minWidth: 0,
                    ...(useImageMask
                        ? {
                              backgroundImage: `url(${image.src})`,
                              backgroundSize: bgSize,
                              backgroundPosition: bgPosition,
                              backgroundRepeat: "no-repeat",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              backgroundClip: "text",
                              color: "transparent",
                          }
                        : {
                              color: props.textColor,
                          }),
                    display: "inline-block",
                    textAlign: font?.textAlign || "center",
                    lineHeight: font?.lineHeight || 1.1,
                    fontSize: font?.fontSize || 40,
                    fontWeight: font?.fontWeight,
                    fontStyle: font?.fontStyle,
                }}
                aria-label={text}
            >
                {text}
            </span>
        </div>
    )
}

addPropertyControls(ImageMaskText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Masked Text",
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain", "percent"],
        optionTitles: ["Cover", "Contain", "Percent"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
    imagePercent: {
        type: ControlType.Number,
        title: "Image %",
        defaultValue: 100,
        min: 10,
        max: 200,
        step: 1,
        unit: "%",
        hidden: ({ imageFit }) => imageFit !== "percent",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 64,
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
            textAlign: "center",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
        description:
            "Component by [Joseph Alexander](https://framer.link/0iVitu4)",
    },
})
