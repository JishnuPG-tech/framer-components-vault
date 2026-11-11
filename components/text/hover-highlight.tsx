import { useState } from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 350
 * @framerIntrinsicHeight 150
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
// @framerDisableUnlink
export default function HoverHighlighter_Basic(props) {
    const {
        text = "Hover to draw\na highlight!",
        textColor = "#111111",
        link = "",
        penColor = "#EAFF00",
        penOpacity = 45,
        penLeft = 0,
        penRight = 0,
        penHeight = 55,
        penOffset = 4,
        penRadius = 0,
        transition = {
            type: "tween",
            duration: 0.5,
            ease: [0.25, 1, 0.5, 1],
        },
        font = {
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: "32px",
            lineHeight: "1.4em",
            letterSpacing: "0em",
            textAlign: "left",
        },
        style,
    } = props

    const [isHovered, setIsHovered] = useState(false)
    const isOnCanvas = RenderTarget.current() === RenderTarget.canvas

    // Split text by newlines to support multiline enter spacing
    const lines = (text || "").split("\n")

    // Opacity & Ink Bleeding Gradient:
    // Main body uses custom opacity (e.g. 45%), while the rightmost 8px uses 100% opacity to mimic ink accumulation.
    const colorLight = `color-mix(in srgb, ${penColor} ${penOpacity}%, transparent)`
    const colorDark = penColor
    const gradientBackground = `linear-gradient(to right, ${colorLight} 0%, ${colorLight} calc(100% - 8px), ${colorDark} calc(100% - 8px), ${colorDark} 100%)`

    // Extract the text alignment from the unified 'font' extended control
    const textAlign = font?.textAlign || "left"
    let alignItemsValue = "flex-start"
    if (textAlign === "center") {
        alignItemsValue = "center"
    } else if (textAlign === "right") {
        alignItemsValue = "flex-end"
    }

    // Dynamic semantic tag switching for SEO and accessibility
    const isLinkActive = link && link.trim() !== ""
    const Tag = isLinkActive ? "a" : "div"

    // Convert penLeft and penRight properties into safe numbers
    const pLeft = Number(penLeft) || 0
    const pRight = Number(penRight) || 0

    // Compute the target layout width including the left & right offsets
    const targetWidth = `calc(100% + ${pLeft + pRight}px)`

    return (
        <Tag
            href={isLinkActive ? link : undefined}
            target={isLinkActive ? "_blank" : undefined}
            rel={isLinkActive ? "noopener noreferrer" : undefined}
            style={{
                ...style,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: alignItemsValue,
                cursor: "pointer",
                overflow: "visible",
                textDecoration: "none", // Prevents native link underline styles
                color: "inherit", // Prevents native link purple/blue color override
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {lines.map((line, index) => (
                <div
                    key={index}
                    style={{
                        display: "block",
                        width: "100%",
                        textAlign: textAlign, // Apply alignment explicitly to the line container
                        margin: 0,
                        padding: 0,
                    }}
                >
                    <div
                        style={{
                            display: "inline-flex", // Upgraded to inline-flex to prevent absolute layout stretch bugs
                            position: "relative",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            width: "auto",
                            maxWidth: "100%",
                            margin: 0,
                            padding: 0,
                        }}
                    >
                        {/* Highlighter Background Layer (Guarantees Left-to-Right Drawing Animation under all alignments) */}
                        {line.trim() !== "" && (
                            <motion.div
                                style={{
                                    position: "absolute",
                                    bottom: penOffset,
                                    height: `${penHeight}%`,
                                    background: gradientBackground,
                                    borderRadius: penRadius, // Native Border Radius applied
                                    zIndex: 0,
                                    left: -pLeft, // Always anchored on the left relative to the text block bounds
                                    right: "auto",
                                    transform: "none",
                                    width: isOnCanvas ? targetWidth : "0%", // Fix: Explicit CSS width forces initial 0% width paint
                                }}
                                initial={
                                    isOnCanvas
                                        ? { width: targetWidth }
                                        : { width: "0%" }
                                }
                                animate={
                                    isOnCanvas
                                        ? { width: targetWidth }
                                        : {
                                              width: isHovered
                                                  ? targetWidth
                                                  : "0%",
                                          }
                                }
                                transition={
                                    isOnCanvas ? { duration: 0 } : transition
                                }
                            />
                        )}

                        {/* Text Typography Layer */}
                        <span
                            style={{
                                ...font, // Spread entire font object to naturally support all native Framer units (px, rem, em, %)
                                color: textColor, // Text Color remains a convenient root control
                                position: "relative",
                                zIndex: 1,
                                display: "inline-block",
                                whiteSpace: "pre",
                            }}
                        >
                            {line || "\u00A0"}
                        </span>
                    </div>
                </div>
            ))}
        </Tag>
    )
}

HoverHighlighter_Basic.defaultProps = {
    text: "Hover to draw\na highlight!",
    textColor: "#111111",
    link: "",
    penColor: "#EAFF00",
    penOpacity: 45,
    penLeft: 0,
    penRight: 0,
    penHeight: 55,
    penOffset: 4,
    penRadius: 0,
    transition: {
        type: "tween",
        duration: 0.5,
        ease: [0.25, 1, 0.5, 1],
    },
    font: {
        fontFamily: "Inter, sans-serif",
        fontWeight: 700,
        fontSize: "32px",
        lineHeight: "1.4em",
        letterSpacing: "0em",
        textAlign: "left",
    },
}

addPropertyControls(HoverHighlighter_Basic, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Hover to draw\na highlight!",
        displayTextArea: true,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#111111",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    font: {
        type: ControlType.Font,
        title: "Font Style",
        controls: "extended", // Clean popup containing all typography attributes (Family, Weight, Size, Line Height, Letter Spacing, Align)
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 700,
            fontSize: "32px",
            lineHeight: "1.4em",
            letterSpacing: "0em",
            textAlign: "left",
        },
    },
    penColor: {
        type: ControlType.Color,
        title: "Pen Color",
        defaultValue: "#EAFF00",
    },
    penOpacity: {
        type: ControlType.Number,
        title: "Pen Opacity (%)",
        defaultValue: 45,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    penLeft: {
        type: ControlType.Number,
        title: "Pen Left (px)",
        defaultValue: 0,
        min: -50,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    penRight: {
        type: ControlType.Number,
        title: "Pen Right (px)",
        defaultValue: 0,
        min: -50,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    penHeight: {
        type: ControlType.Number,
        title: "Pen Height (%)",
        defaultValue: 55,
        min: 10,
        max: 150,
        step: 1,
        displayStepper: true,
    },
    penOffset: {
        type: ControlType.Number,
        title: "Pen Offset (px)",
        defaultValue: 4,
        min: -50,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    penRadius: {
        type: ControlType.BorderRadius,
        title: "Pen Radius",
        defaultValue: 0,
        min: 0,
        max: 10,
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: {
            type: "tween",
            duration: 0.5,
            ease: [0.25, 1, 0.5, 1],
        },
    },
})
