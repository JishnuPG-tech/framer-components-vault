// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import type { CSSProperties } from "react"
import { motion } from "framer-motion"
import { useMemo, useRef, useEffect } from "react"

interface Avatar {
    image: { src: string; alt?: string }
    text: string
    useText: boolean
    textBackgroundColor: string
    textFont: CSSProperties
    textColor: string
}

interface SocialProofCardProps {
    avatars: Avatar[]
    overlapDistance: number
    zIndexDirection: "leftToRight" | "rightToLeft"
    avatarSize: number
    avatarBorder: boolean
    avatarBorderWidth: number
    avatarBorderColor: string
    avatarShadow: boolean
    avatarBackgroundColor: string
    avatarBorderRadius: number
    avatarRotation: number
    gap: number
    message: string
    messageFont: CSSProperties
    messageColor: string
    messageTextShadow: {
        inset: boolean
        x: number
        y: number
        blur: number
        spread: number
        color: string
    }
    cardBackground: string
    cardBorderRadius: number
    cardBorder: boolean
    cardBorderWidth: number
    cardBorderColor: string
    cardShadow: boolean
    cardPadding: string
    cardBackdropBlur: number
    layout: "horizontal" | "vertical"
    avatarTextFont: CSSProperties
    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 420
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function SocialProofCard(props: SocialProofCardProps) {
    const {
        avatars = [],
        overlapDistance = 12,
        zIndexDirection = "leftToRight",
        avatarSize = 48,
        avatarBorder = true,
        avatarBorderWidth = 3,
        avatarBorderColor = "#FFFFFF",
        avatarShadow = true,
        avatarBackgroundColor = "#CCCCCC",
        avatarBorderRadius = 50,
        avatarRotation = 0,
        gap = 16,
        message = "Trusted by 2000+ users",
        messageFont,
        messageColor = "#000000",
        messageTextShadow = {
            inset: false,
            x: 0,
            y: 0,
            blur: 0,
            spread: 0,
            color: "rgba(0, 0, 0, 0)",
        },
        cardBackground = "#FFFFFF",
        cardBorderRadius = 16,
        cardBorder = false,
        cardBorderWidth = 1,
        cardBorderColor = "#EEEEEE",
        cardShadow = true,
        cardPadding = "24px",
        cardBackdropBlur = 0,
        layout = "horizontal",
        avatarTextFont,
        style,
    } = props

    const isHorizontal = layout === "horizontal"
    const totalAvatars = avatars.length
    const avatarContainerWidth =
        totalAvatars > 0
            ? avatarSize + (totalAvatars - 1) * (avatarSize - overlapDistance)
            : avatarSize

    const getStableRotation = (index: number, maxRotation: number) => {
        if (maxRotation === 0) return 0
        const seed = index * 2654435761
        const random = ((seed ^ (seed >>> 16)) & 0x7fffffff) / 0x7fffffff
        return random * maxRotation * 2 - maxRotation
    }

    const messageTextShadowValue = useMemo(() => {
        if (!messageTextShadow) return "none"
        const { x, y, blur, color } = messageTextShadow
        return `${x}px ${y}px ${blur}px ${color}`
    }, [messageTextShadow])

    return (
        <div
            style={{
                ...style,
                width: style?.width || "100%",
                height: style?.height || "auto",
                display: "flex",
                flexDirection: isHorizontal ? "row" : "column",
                alignItems: "center",
                justifyContent: "center",
                gap: isHorizontal ? gap : gap,
                backgroundColor: cardBackground,
                borderRadius: cardBorderRadius,
                border: cardBorder
                    ? `${cardBorderWidth}px solid ${cardBorderColor}`
                    : "none",
                boxShadow: cardShadow
                    ? "0 4px 12px rgba(0, 0, 0, 0.1)"
                    : "none",
                padding: cardPadding,
                backdropFilter:
                    cardBackdropBlur > 0
                        ? `blur(${cardBackdropBlur}px)`
                        : "none",
                WebkitBackdropFilter:
                    cardBackdropBlur > 0
                        ? `blur(${cardBackdropBlur}px)`
                        : "none",
                boxSizing: "border-box",
            }}
        >
            {/* Avatar Group */}
            <div
                style={{
                    position: "relative",
                    width: avatarContainerWidth,
                    height: avatarSize,
                    flexShrink: 0,
                }}
            >
                {avatars.map((avatar, index) => {
                    const zIndex =
                        zIndexDirection === "leftToRight"
                            ? totalAvatars - index
                            : index + 1
                    const leftPosition = index * (avatarSize - overlapDistance)

                    const avatarImage = avatar.image || {
                        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                        alt: `Avatar ${index + 1}`,
                    }

                    const randomRotation = getStableRotation(
                        index,
                        avatarRotation
                    )
                    const bgColor =
                        avatar.useText && avatar.textBackgroundColor
                            ? avatar.textBackgroundColor
                            : avatarBackgroundColor

                    return (
                        <motion.div
                            key={index}
                            style={{
                                position: "absolute",
                                left: leftPosition,
                                top: 0,
                                width: avatarSize,
                                height: avatarSize,
                                borderRadius: `${avatarBorderRadius}%`,
                                backgroundColor: bgColor,
                                border: avatarBorder
                                    ? `${avatarBorderWidth}px solid ${avatarBorderColor}`
                                    : "none",
                                boxShadow: avatarShadow
                                    ? "0 2px 8px rgba(0, 0, 0, 0.15)"
                                    : "none",
                                zIndex,
                                overflow: "hidden",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transform: `rotate(${randomRotation}deg)`,
                            }}
                        >
                            {avatar.useText ? (
                                <span
                                    style={{
                                        ...avatar.textFont,
                                        color: avatar.textColor || "#000000",
                                        userSelect: "none",
                                    }}
                                >
                                    {avatar.text}
                                </span>
                            ) : (
                                <img
                                    src={avatarImage.src}
                                    alt={
                                        avatarImage.alt || `Avatar ${index + 1}`
                                    }
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />
                            )}
                        </motion.div>
                    )
                })}
            </div>

            {/* Message Text */}
            <span
                style={{
                    color: messageColor,
                    ...messageFont,
                    textAlign: isHorizontal ? "left" : "center",
                    textShadow: messageTextShadowValue,
                }}
            >
                {message}
            </span>
        </div>
    )
}

addPropertyControls(SocialProofCard, {
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
    },

    avatars: {
        type: ControlType.Array,
        title: "Avatars",
        description: "Avatar Settings",
        control: {
            type: ControlType.Object,
            controls: {
                useText: {
                    type: ControlType.Boolean,
                    title: "Use Text",
                    defaultValue: false,
                    enabledTitle: "Text",
                    disabledTitle: "Image",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (props) => props.useText === true,
                },
                text: {
                    type: ControlType.String,
                    title: "Text",
                    defaultValue: "2000+",
                    hidden: (props) => props.useText === false,
                },
                textColor: {
                    type: ControlType.Color,
                    title: "Text Color",
                    defaultValue: "#FFFFFF",
                    hidden: (props) => props.useText === false,
                },
                textFont: {
                    type: ControlType.Font,
                    title: "Text Font",
                    controls: "extended",
                    defaultFontType: "sans-serif",
                    defaultValue: {
                        fontSize: "14px",
                        variant: "Semibold",
                        letterSpacing: "-0.01em",
                        lineHeight: "1em",
                    },
                    hidden: (props) => props.useText === false,
                },
                textBackgroundColor: {
                    type: ControlType.Color,
                    title: "Text Background",
                    defaultValue: "#C2B19F",
                    hidden: (props) => props.useText === false,
                },
            },
        },
        defaultValue: [
            {
                useText: false,
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Avatar 1",
                },
                text: "",
                textColor: "#FFFFFF",
                textFont: {
                    fontSize: "14px",
                    variant: "Semibold",
                    letterSpacing: "-0.01em",
                    lineHeight: "1em",
                },
                textBackgroundColor: "#C2B19F",
            },
            {
                useText: false,
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Avatar 2",
                },
                text: "",
                textColor: "#FFFFFF",
                textFont: {
                    fontSize: "14px",
                    variant: "Semibold",
                    letterSpacing: "-0.01em",
                    lineHeight: "1em",
                },
                textBackgroundColor: "#C2B19F",
            },
            {
                useText: false,
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Avatar 3",
                },
                text: "",
                textColor: "#FFFFFF",
                textFont: {
                    fontSize: "14px",
                    variant: "Semibold",
                    letterSpacing: "-0.01em",
                    lineHeight: "1em",
                },
                textBackgroundColor: "#C2B19F",
            },
            {
                useText: true,
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Avatar 4",
                },
                text: "2000+",
                textColor: "#FFFFFF",
                textFont: {
                    fontSize: "14px",
                    variant: "Semibold",
                    letterSpacing: "-0.01em",
                    lineHeight: "1em",
                },
                textBackgroundColor: "#C2B19F",
            },
        ],
    },
    avatarSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 52,
        min: 24,
        max: 120,
        step: 4,
        unit: "px",
    },
    overlapDistance: {
        type: ControlType.Number,
        title: "Overlap",
        defaultValue: 10,
        min: 0,
        max: 40,
        step: 2,
        unit: "px",
    },
    zIndexDirection: {
        type: ControlType.Enum,
        title: "Stack Order",
        options: ["leftToRight", "rightToLeft"],
        optionTitles: ["Left to Right", "Right to Left"],
        defaultValue: "rightToLeft",
        displaySegmentedControl: true,
    },
    avatarRotation: {
        type: ControlType.Number,
        title: "Random Rotation",
        defaultValue: 23,
        min: -45,
        max: 45,
        step: 1,
        unit: "deg",
    },
    avatarBorderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 50,
        min: 0,
        max: 50,
        step: 1,
        unit: "%",
    },
    avatarBackgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#CCCCCC",
    },
    avatarBorder: {
        type: ControlType.Boolean,
        title: "Border",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    avatarBorderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 1,
        unit: "px",
        hidden: (props) => !props.avatarBorder,
    },
    avatarBorderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#FFFFFF",
        hidden: (props) => !props.avatarBorder,
    },
    avatarShadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    message: {
        type: ControlType.String,
        title: "Message",
        description: "Message Settings",
        defaultValue: "Trusted by 2000+ users",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 14,
        min: 0,
        max: 80,
        step: 2,
        unit: "px",
    },
    messageColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#FFFFFF",
    },
    messageFont: {
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
    messageTextShadow: {
        type: ControlType.Object,
        title: "Text Shadow",
        controls: {
            x: {
                type: ControlType.Number,
                title: "X",
                defaultValue: 0,
                min: -50,
                max: 50,
                step: 1,
                unit: "px",
            },
            y: {
                type: ControlType.Number,
                title: "Y",
                defaultValue: 2,
                min: -50,
                max: 50,
                step: 1,
                unit: "px",
            },
            blur: {
                type: ControlType.Number,
                title: "Blur",
                defaultValue: 5,
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "rgba(0, 0, 0, 0.3)",
            },
        },
        defaultValue: {
            x: 0,
            y: 2,
            blur: 5,
            color: "rgba(0, 0, 0, 0.3)",
        },
    },

    cardBackground: {
        type: ControlType.Color,
        title: "Background",
        description: "Background Settings",
        defaultValue: "rgba(255, 255, 255, 0.35)",
    },
    cardBorderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 18,
        min: 0,
        max: 48,
        step: 2,
        unit: "px",
    },
    cardPadding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "8px 20px 8px 20px",
    },
    cardBorder: {
        type: ControlType.Boolean,
        title: "Border",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    cardBorderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 1,
        min: 1,
        max: 10,
        step: 1,
        unit: "px",
        hidden: (props) => !props.cardBorder,
    },
    cardBorderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "rgba(237, 237, 237, 0.45)",
        hidden: (props) => !props.cardBorder,
    },
    cardShadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    cardBackdropBlur: {
        type: ControlType.Number,
        title: "Backdrop Blur",
        defaultValue: 2,
        min: 0,
        max: 40,
        step: 2,
        unit: "px",
    },
})
