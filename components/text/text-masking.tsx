// Masked text animation
import { motion, useAnimationFrame } from "framer-motion"
import { useRef, useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface TextMaskingProps {
    text: string
    backgroundImage?: {
        src: string
        alt: string
    }
    font: CSSProperties
    animationSpeed: number
    animationDirection: "left" | "right" | "up" | "down"
    scale: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function TextMasking(props: TextMaskingProps) {
    const {
        text,
        backgroundImage,
        font,
        animationSpeed,
        animationDirection,
        scale,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const [offset, setOffset] = useState(0)
    const lastTimeRef = useRef<number>(0)

    const isFillWidth = style?.width === "100%"
    const isFillHeight = style?.height === "100%"

    useAnimationFrame((time) => {
        if (isStatic) return
        if (!lastTimeRef.current) {
            lastTimeRef.current = time
            return
        }

        const deltaTime = time - lastTimeRef.current
        lastTimeRef.current = time

        const speed = animationSpeed * 10
        const increment = (deltaTime / 1000) * speed
        startTransition(() => setOffset((prev) => prev + increment))
    })

    const getBackgroundPosition = () => {
        const move = offset * scale
        switch (animationDirection) {
            case "left":
                return `${-move}px 0px`
            case "right":
                return `${move}px 0px`
            case "up":
                return `0px ${-move}px`
            case "down":
                return `0px ${move}px`
            default:
                return `${move}px 0px`
        }
    }

    const hasImage = backgroundImage && backgroundImage.src

    const textStyle: CSSProperties = {
        margin: 0,
        padding: 0,
        paddingBottom: "0.25em",
        background: hasImage
            ? `url(${backgroundImage.src}) repeat`
            : "linear-gradient(90deg, #aaa, #ccc)",
        backgroundSize: `${200 * scale}% ${200 * scale}%`,
        backgroundPosition: getBackgroundPosition(),
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent",
        whiteSpace: isFillWidth ? "normal" : "nowrap",
        wordBreak: "break-word",
        overflowWrap: "break-word",
        width: isFillWidth ? "100%" : "auto",
        textAlign: isFillWidth ? "center" : undefined,
        lineHeight: "1.2em",
        display: "inline-flex",
        alignItems: "center",
        overflow: "visible",
        ...font,
    }

    if (isStatic) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: isFillWidth ? "100%" : "auto",
                    height: isFillHeight ? "100%" : "auto",
                    overflow: "visible",
                    ...style,
                }}
            >
                <h1 style={textStyle}>{text}</h1>
            </div>
        )
    }

    return (
        <div
            style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: isFillWidth ? "100%" : "max-content",
                height: isFillHeight ? "100%" : "auto",
                overflow: "visible",
                ...style,
            }}
        >
            <motion.h1 style={textStyle}>{text}</motion.h1>
        </div>
    )
}

addPropertyControls(TextMasking, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Text Masking",
    },
    backgroundImage: {
        type: ControlType.ResponsiveImage,
        title: "Background",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "80px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1.2em",
        },
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 5,
        min: 0,
        max: 20,
        step: 0.1,
    },
    animationDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right", "up", "down"],
        optionTitles: ["Left", "Right", "Up", "Down"],
        defaultValue: "right",
        displaySegmentedControl: true,
    },
    scale: {
        type: ControlType.Number,
        title: "Image Scale",
        defaultValue: 1,
        min: 1,
        max: 3,
        step: 0.1,
    },
})
