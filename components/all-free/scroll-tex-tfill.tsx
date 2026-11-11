import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    motion,
    useScroll,
    useTransform,
    useMotionTemplate,
} from "framer-motion"

type FillDirection =
    | "left-to-right"
    | "right-to-left"
    | "top-to-bottom"
    | "bottom-to-top"

type Props = {
    text: string
    font: any
    baseColor: string
    fillColor: string
    fillDirection: FillDirection
}

function directionToCss(dir: FillDirection): string {
    switch (dir) {
        case "left-to-right":
            return "to right"
        case "right-to-left":
            return "to left"
        case "top-to-bottom":
            return "to bottom"
        case "bottom-to-top":
            return "to top"
        default:
            return "to right"
    }
}

/**
 * Instructions:
 * Create only a single reusable component (not a full page section).
 * Create a scroll-based text color fill component using two separate text layers.
 * Bottom layer: base color text (always fully visible)
 * Top layer: fill color text (revealed by a mask)
 * Both text layers must have identical text, font, size, and alignment
 * The base text layer must always remain visible
 * Apply the mask ONLY to the fill color text layer
 * Do NOT apply any mask to the parent container or base text
 * Initial state: mask size = 0% (fill color completely hidden)
 * On scroll: gradually reveal the fill color text based on scroll progress
 * At 100% scroll: fill color fully visible
 * Fill direction options: left-to-right, right-to-left, top-to-bottom, bottom-to-top
 * Editable properties: text, fontFamily, fontSize, baseColor, fillColor, fillDirection
 * Important: Use mask clipping (not opacity). Base text must always be visible underneath.
 * Keep background transparent. Make it responsive and reusable.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
//@framerDisableUnlink
export default function ScrollTextFill(props: Props) {
    const {
        text,
        font,
        baseColor,
        fillColor,
        fillDirection = "left-to-right",
    } = props

    const isStatic = useIsStaticRenderer()
    const { scrollYProgress } = useScroll()
    const progress = useTransform(scrollYProgress, (v) => {
        if (isStatic) return 0
        const clamped = Math.max(0, Math.min(1, v))
        return clamped
    })
    const pct = useTransform(progress, (v) => `${Math.round(v * 1000) / 10}%`)
    const cssDir = directionToCss(fillDirection)

    // Hard-edge mask that reveals a rectangular area based on scroll progress.
    // Opaque area shows the fill text; transparent area hides it.
    const mask = useMotionTemplate`linear-gradient(${cssDir}, rgba(0,0,0,1) 0%, rgba(0,0,0,1) ${pct}, rgba(0,0,0,0) ${pct}, rgba(0,0,0,0) 100%)`

    const sharedTextStyle: React.CSSProperties = {
        ...font,
        width: "100%",
        height: "100%",
        margin: 0,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        overflowWrap: "break-word",
        background: "transparent",
        lineHeight: font?.lineHeight,
        letterSpacing: font?.letterSpacing,
        textAlign: font?.textAlign,
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                background: "transparent",
                overflow: "visible",
            }}
        >
            <div
                aria-hidden="true"
                style={{
                    ...sharedTextStyle,
                    color: baseColor,
                    position: "relative",
                }}
            >
                {text}
            </div>

            <motion.div
                style={{
                    ...sharedTextStyle,
                    color: fillColor,
                    position: "absolute",
                    inset: 0,
                    WebkitMaskImage: mask as any,
                    maskImage: mask as any,
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskSize: "100% 100%",
                    maskSize: "100% 100%",
                    WebkitMaskPosition: "0% 0%",
                    maskPosition: "0% 0%",
                    pointerEvents: "none",
                }}
            >
                {text}
            </motion.div>
        </div>
    )
}

addPropertyControls(ScrollTextFill, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Scroll to reveal this text fill.",
        displayTextArea: true,
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
            lineHeight: "1.1em",
            textAlign: "left",
        },
    },
    baseColor: {
        type: ControlType.Color,
        title: "Base Color",
        defaultValue: "#000000",
    },
    fillColor: {
        type: ControlType.Color,
        title: "Fill Color",
        defaultValue: "#CCCCCC",
    },
    fillDirection: {
        type: ControlType.Enum,
        title: "Direction",
        defaultValue: "left-to-right",
        options: [
            "left-to-right",
            "right-to-left",
            "top-to-bottom",
            "bottom-to-top",
        ],
        optionTitles: [
            "Left → Right",
            "Right → Left",
            "Top → Bottom",
            "Bottom → Top",
        ],
    },
})
