// Customizable text component with image mask slideshow, adjustable image fit (cover, contain, percent), and font controls
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useMemo, useState, useEffect, type CSSProperties } from "react"

interface ImageMaskTextProps {
    text: string
    images: { src: string; alt: string }[]
    imageFit: "cover" | "contain" | "percent"
    imagePercent: number
    slideDuration: number
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
    const { text, images, imageFit, imagePercent, slideDuration, font, style } =
        props

    const validImages = useMemo(
        () => (images || []).filter((img) => img && img.src && img.src !== ""),
        [images]
    )

    const [currentIndex, setCurrentIndex] = useState(0)
    const [prevIndex, setPrevIndex] = useState<number | null>(null)
    const [fading, setFading] = useState(false)

    useEffect(() => {
        if (validImages.length <= 1) return
        const interval = setInterval(() => {
            setPrevIndex(currentIndex)
            setFading(true)
            setTimeout(() => {
                setCurrentIndex((i) => (i + 1) % validImages.length)
                setFading(false)
                setPrevIndex(null)
            }, 400) // crossfade duration in ms
        }, slideDuration * 1000)
        return () => clearInterval(interval)
    }, [validImages.length, currentIndex, slideDuration])

    const currentImage = validImages[currentIndex]
    const prevImage = prevIndex !== null ? validImages[prevIndex] : null

    const bgSize = useMemo(() => {
        if (imageFit === "cover") return "cover"
        if (imageFit === "contain") return "contain"
        return `${imagePercent}%`
    }, [imageFit, imagePercent])

    const justifyContent = useMemo(() => {
        const textAlign = font?.textAlign || "center"
        switch (textAlign) {
            case "left":
                return "flex-start"
            case "right":
                return "flex-end"
            default:
                return "center"
        }
    }, [font?.textAlign])

    const useImageMask = !!currentImage

    const textBaseStyle: CSSProperties = {
        ...font,
        width: "max-content",
        minWidth: 0,
        display: "inline-block",
        textAlign: font?.textAlign || "center",
        lineHeight: font?.lineHeight || 1.1,
        fontSize: font?.fontSize || 40,
        fontWeight: font?.fontWeight,
        fontStyle: font?.fontStyle,
        position: "relative",
    }

    const makeMaskedStyle = (src: string, opacity: number): CSSProperties => ({
        ...textBaseStyle,
        backgroundImage: `url(${src})`,
        backgroundSize: bgSize,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        color: "transparent",
        opacity,
        transition: "opacity 0.4s ease",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent,
        pointerEvents: "none",
    })

    return (
        <div
            style={{
                ...style,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent,
                position: "relative",
                overflow: "hidden",
            }}
        >
            {useImageMask ? (
                // Wrapper to stack the crossfading layers
                <div
                    style={{
                        position: "relative",
                        width: "max-content",
                        height: "1.2em",
                        fontSize: font?.fontSize || 40,
                        lineHeight: font?.lineHeight || 1.1,
                    }}
                    aria-label={text}
                >
                    {/* Invisible spacer to hold layout size */}
                    <span
                        style={{
                            ...textBaseStyle,
                            visibility: "hidden",
                            position: "relative",
                        }}
                    >
                        {text}
                    </span>

                    {/* Previous image (fading out) */}
                    {prevImage && fading && (
                        <div style={makeMaskedStyle(prevImage.src, 0)}>
                            <span style={textBaseStyle}>{text}</span>
                        </div>
                    )}

                    {/* Current image (fading in) */}
                    {currentImage && (
                        <div style={makeMaskedStyle(currentImage.src, 1)}>
                            <span
                                style={{ ...textBaseStyle, position: "static" }}
                            >
                                {text}
                            </span>
                        </div>
                    )}
                </div>
            ) : (
                <span
                    style={{
                        ...textBaseStyle,
                        color: props.textColor,
                    }}
                    aria-label={text}
                >
                    {text}
                </span>
            )}
        </div>
    )
}

addPropertyControls(ImageMaskText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Slider Mask Text",
    },
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
    },
    slideDuration: {
        type: ControlType.Number,
        title: "Duration (s)",
        defaultValue: 2,
        min: 0.2,
        max: 30,
        step: 0.5,
        unit: "s",
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
