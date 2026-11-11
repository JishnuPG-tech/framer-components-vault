// Text reveal animation on scroll with circular mask
import { useScroll, useTransform, motion } from "framer-motion"
import { useRef, type CSSProperties } from "react"
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

interface CircularTextRevealProps {
    text?: string
    shape?: React.ReactNode
    textColor: string
    font: CSSProperties
    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 100
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function CircularTextReveal(props: CircularTextRevealProps) {
    const {
        text = "Your text here",
        shape,
        textColor = "#000000",
        font,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()
    
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    })

    const clipPath = useTransform(
        scrollYProgress,
        [0, 0.5, 1],
        [
            "circle(0% at 50% 50%)",
            "circle(50% at 50% 50%)",
            "circle(150% at 50% 50%)"
        ]
    )

    const isFixedWidth = props?.style?.width !== "100%"
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // Split text by {image} placeholder
    const parts = text.split("[]")

    return (
        <div
            ref={containerRef}
            style={{
                ...props.style,
                position: "relative",
                overflow: "visible",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <motion.div
                style={{
                    clipPath: isCanvas || isStatic ? "none" : clipPath,
                    width: isFixedWidth ? "max-content" : "100%",
                    color: textColor,
                    display: "inline",
                    position: "relative",
                    ...font,
                }}
            >
                {parts.map((part, index) => (
                    <React.Fragment key={index}>
                        {part}
                        {index < parts.length - 1 && (
                            <span style={{ display: "inline-block", verticalAlign: "middle" }}>
                                {shape}
                            </span>
                        )}
                    </React.Fragment>
                ))}
            </motion.div>
        </div>
    )
}

addPropertyControls(CircularTextReveal, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Your text here",
        displayTextArea: true,
    },
    shape: {
        type: ControlType.Slot,
        title: "Shape",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
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