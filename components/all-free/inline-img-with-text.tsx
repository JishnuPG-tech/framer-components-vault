// Component that replaces asterisks (*) in text with images sequentially
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

interface InlineImageComProps {
    text: string
    images: Array<{ src: string; alt: string }>
    font: CSSProperties
    textColor: string
    imageSize: number
    style?: CSSProperties
}

/**
 * Inline Image Text
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 200
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function InlineImgTxt(props: InlineImageComProps) {
    const {
        text = "The fiber-rich * protein-packed * prebiotic oatmeal * for regularity, energy, and digestion *",
        images = [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Image 1",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Image 2",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Image 3",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Image 4",
            },
        ],
        font,
        textColor = "#7A9B7E",
        imageSize = 20,
        style,
    } = props

    const content = useMemo(() => {
        const parts = text.split("*")
        const elements: JSX.Element[] = []
        let imageIndex = 0

        parts.forEach((part, index) => {
            if (part) {
                elements.push(
                    <span key={`text-${index}`} style={{ color: textColor }}>
                        {part}
                    </span>
                )
            }

            if (index < parts.length - 1 && imageIndex < images.length) {
                const image = images[imageIndex]
                elements.push(
                    <img
                        key={`image-${imageIndex}`}
                        src={image.src}
                        alt={image.alt}
                        style={{
                            width: imageSize,
                            height: imageSize,
                            display: "inline-block",
                            verticalAlign: "middle",
                            margin: "0 2px",
                            objectFit: "cover",
                        }}
                    />
                )
                imageIndex++
            }
        })

        return elements
    }, [text, images, textColor, imageSize])

    const isFixedWidth = style?.width === "100%"
    const isFixedHeight = style?.height === "100%"

    return (
        <div
            style={{
                ...style,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
                overflow: "hidden",
                ...(isFixedWidth ? {} : { width: "max-content" }),
                ...(isFixedHeight ? {} : { height: "max-content" }),
            }}
        >
            <p
                style={{
                    margin: 0,
                    ...font,
                    color: textColor,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                }}
            >
                {content}
            </p>
        </div>
    )
}

addPropertyControls(InlineImgTxt, {
    text: {
        type: ControlType.String,
        title: "Text Content",
        defaultValue:
            "The fiber-rich * protein-packed * prebiotic oatmeal * for regularity, energy, and digestion *",
        displayTextArea: true,
    },
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
        maxCount: 10,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "18px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.4em",
            textAlign: "left",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#7A9B7E",
    },
    imageSize: {
        type: ControlType.Number,
        title: "Image Size",
        defaultValue: 20,
        min: 10,
        step: 1,
        unit: "px",
    },
})
