// Text component where hovering on a character reveals an image instead
import { useState, useMemo, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface CharacterImageRevealProps {
    text: string
    images: Array<{
        src: string
        alt: string
    }>
    textColor: string
    imageSize: number
    font: CSSProperties
    offsetX: number
    offsetY: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function CharacterImageReveal(props: CharacterImageRevealProps) {
    const {
        text = "Hover Me",
        images = [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Gradient 1 - Blue",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Gradient 2 - Purple",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Gradient 3 - Orange",
            },
        ],
        textColor,
        imageSize,
        font,
        offsetX = 0,
        offsetY = 0,
    } = props

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    const characters = useMemo(() => {
        return text.split("").map((char, index) => ({
            char,
            index,
            isSpace: char === " ",
        }))
    }, [text])

    return (
        <div
            style={{
                position: "relative",
                display: "inline-flex",
                flexWrap: "wrap",
                gap: 0,
                ...font,
                color: textColor,
                ...props.style,
            }}
        >
            {characters.map(({ char, index, isSpace }) => {
                const image = images[index % images.length]
                return (
                    <span
                        key={index}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        style={{
                            position: "relative",
                            display: "inline-block",
                            whiteSpace: "pre",
                        }}
                    >
                        <span
                            style={{
                                opacity: hoveredIndex === index ? 0 : 1,
                                transition: "opacity 0.2s ease",
                            }}
                        >
                            {char}
                        </span>
                        {hoveredIndex === index && !isSpace && image && (
                            <img
                                src={image.src}
                                alt={image.alt}
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
                                    width: imageSize,
                                    height: imageSize,
                                    objectFit: "cover",
                                    borderRadius: 4,
                                    pointerEvents: "none",
                                    zIndex: 10,
                                }}
                            />
                        )}
                    </span>
                )
            })}
        </div>
    )
}

addPropertyControls(CharacterImageReveal, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Hover Me",
    },
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
        defaultValue: [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Gradient 1 - Blue",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Gradient 2 - Purple",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Gradient 3 - Orange",
            },
        ],
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    imageSize: {
        type: ControlType.Number,
        title: "Image Size",
        defaultValue: 60,
        min: 20,
        max: 200,
        step: 5,
        unit: "px",
    },
    offsetX: {
        type: ControlType.Number,
        title: "Offset X",
        defaultValue: 0,
        min: -200,
        max: 200,
        step: 1,
        unit: "px",
    },
    offsetY: {
        type: ControlType.Number,
        title: "Offset Y",
        defaultValue: 0,
        min: -200,
        max: 200,
        step: 1,
        unit: "px",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
    },
})