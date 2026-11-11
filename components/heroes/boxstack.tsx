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


interface BoxStackProps {
    boxes: Array<{ text: string; image?: { src: string; alt?: string }; link?: string }>
    gap: number
    boxWidth: number
    boxHeight: number
    backgroundColor: string
    textColor: string
    hoverOffset: number
    font: any
    borderRadius: number
    paddingTop: number
    paddingBottom: number
    paddingLeft: number
    paddingRight: number
}

/**
 * Horizontal stack of boxes that move upward on hover
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function BoxStack(props: BoxStackProps) {
    const {
        boxes,
        gap,
        boxWidth,
        boxHeight,
        backgroundColor,
        textColor,
        hoverOffset,
        font,
        borderRadius,
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
    } = props

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "row",
                gap: gap,
                alignItems: "flex-end",
                height: "100%",
                width: "100%",
                position: "relative",
                paddingTop: paddingTop,
                paddingBottom: paddingBottom,
                paddingLeft: paddingLeft,
                paddingRight: paddingRight,
                boxSizing: "border-box",
            }}
        >
            {boxes.map((box, index) => {
                const content = (
                    <motion.div
                        key={index}
                        style={{
                            flex: 1,
                            height: boxHeight,
                            backgroundColor: backgroundColor,
                            borderRadius: borderRadius,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: textColor,
                            ...font,
                        }}
                        whileHover={{
                            flex: 3,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 25,
                        }}
                    >
                    {box.image && box.image.src ? (
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                position: "relative",
                                overflow: "hidden",
                                borderRadius: borderRadius,
                            }}
                        >
                            <img
                                src={box.image.src}
                                alt={box.image.alt || ""}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                }}
                            />
                            {box.text && (
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        padding: "16px",
                                        background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                                        color: "#FFFFFF",
                                        textAlign: "center",
                                    }}
                                >
                                    <span>{box.text}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <span
                            style={{
                                textAlign: "center",
                                padding: "0 16px",
                            }}
                        >
                            {box.text}
                        </span>
                    )}
                    </motion.div>
                )

                if (box.link) {
                    return (
                        <a
                            key={index}
                            href={box.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                textDecoration: "none",
                                color: "inherit",
                            }}
                        >
                            {content}
                        </a>
                    )
                }

                return content
            })}
        </div>
    )
}

addPropertyControls(BoxStack, {
    boxes: {
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                text: {
                    type: ControlType.String,
                    defaultValue: "Box",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
            },
        },
        defaultValue: [
            { text: "Box 1" },
            { text: "Box 2" },
            { text: "Box 3" },
            { text: "Box 4" },
        ],
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 16,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    boxWidth: {
        type: ControlType.Number,
        title: "Box Width",
        defaultValue: 120,
        min: 50,
        max: 300,
        step: 1,
        unit: "px",
    },
    boxHeight: {
        type: ControlType.Number,
        title: "Box Height",
        defaultValue: 120,
        min: 50,
        max: 300,
        step: 1,
        unit: "px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },

    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    paddingTop: {
        type: ControlType.Number,
        title: "Padding Top",
        defaultValue: 20,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    paddingBottom: {
        type: ControlType.Number,
        title: "Padding Bottom",
        defaultValue: 0,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    paddingLeft: {
        type: ControlType.Number,
        title: "Padding Left",
        defaultValue: 0,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    paddingRight: {
        type: ControlType.Number,
        title: "Padding Right",
        defaultValue: 0,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
})