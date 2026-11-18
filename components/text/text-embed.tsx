// Text embed component that allows integrating elements directly into the text layer, in-line

import { type CSSProperties, type ReactNode, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

interface TextEmbedProps {
    text: string
    textColor: string
    font: CSSProperties
    slots?: ReactNode
    elementSettings: {
        align: "top" | "middle" | "bottom" | "baseline"
        hoverScale: number
        hoverRotation: number
    }
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function TextEmbed(props: TextEmbedProps) {
    const {
        text = "This is some text with an inline element [] here.",
        textColor = "#000000",
        font,
        slots,
        elementSettings = {
            align: "middle",
            hoverScale: 1.1,
            hoverRotation: 10,
        },
        style,
    } = props

    const {
        align = "middle",
        hoverScale = 1.1,
        hoverRotation = 10,
    } = elementSettings

    // Convert slots to array
    const slotsArray = useMemo(() => {
        return slots ? (Array.isArray(slots) ? slots : [slots]) : []
    }, [slots])

    // Split text by [] placeholder and create parts array
    const parts = useMemo(() => {
        const result: (string | { isSlot: boolean; slotIndex: number })[] = []
        const segments = text.split("[]")

        segments.forEach((segment, index) => {
            // Add text segment if not empty
            if (segment) {
                result.push(segment)
            }
            // Add slot reference if not the last segment
            if (index < segments.length - 1) {
                result.push({ isSlot: true, slotIndex: index })
            }
        })

        // If no parts were created, return the original text
        return result.length > 0 ? result : [text]
    }, [text])

    const isFixedWidth = style?.width === "100%"

    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: isFixedWidth ? "100%" : undefined,
                color: textColor,
                ...font,
            }}
        >
            {parts.map((part, index) => {
                if (typeof part === "string") {
                    return <span key={index}>{part}</span>
                } else {
                    const slotContent = slotsArray[part.slotIndex]
                    const rotation = Math.sin(index * 123.45) * hoverRotation

                    return (
                        <motion.span
                            key={index}
                            style={{
                                display: "inline-block",
                                verticalAlign: align,
                                maxWidth: "100%",
                                cursor: "default",
                            }}
                            whileHover={{ scale: hoverScale, rotate: rotation }}
                        >
                            {slotContent || (
                                <span
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        border: "1px dashed #CCCCCC",
                                        borderRadius: 4,
                                        padding: "4px 8px",
                                        fontSize: "12px",
                                        color: "#CCCCCC",
                                        minWidth: 60,
                                        minHeight: 24,
                                    }}
                                >
                                    []
                                </span>
                            )}
                        </motion.span>
                    )
                }
            })}
        </div>
    )
}

addPropertyControls(TextEmbed, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "This is some text with an inline element [] here.",
        displayTextArea: true,
        description:
            "Enter text with [] placeholders where you want to insert inline elements.",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
        description: "Sets the color of the text.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        description:
            "Configure font family, size, weight, and spacing for the text.",
    },
    slots: {
        type: ControlType.Slot,
        title: "Slots",
        maxCount: 10,
        description:
            "Add elements to insert inline at [] positions in the text.",
    },
    elementSettings: {
        type: ControlType.Object,
        title: "Elements",
        description:
            "More components at [8ighty8 Studio](https://8ighty8studio.lemonsqueezy.com)",
        controls: {
            align: {
                type: ControlType.Enum,
                title: "Align",
                options: ["top", "middle", "bottom", "baseline"],
                optionTitles: ["Top", "Middle", "Bottom", "Baseline"],
                defaultValue: "middle",
                displaySegmentedControl: true,
            },
            hoverScale: {
                type: ControlType.Number,
                title: "Hover Scale",
                defaultValue: 1.1,
                min: 1,
                max: 2,
                step: 0.1,
                displayStepper: true,
            },
            hoverRotation: {
                type: ControlType.Number,
                title: "Hover Rotate",
                defaultValue: 10,
                min: 0,
                max: 360,
                unit: "deg",
            },
        },
        defaultValue: {
            align: "middle",
            hoverScale: 1.1,
            hoverRotation: 10,
        },
    },
})
