import * as React from "react"
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


interface SplashGradientButtonProps {
    text: string
    fontStyle: React.CSSProperties
    textColor: string
    hoverTextColor: string
    gradientColors: string[]
    buttonBackgroundColor: string
    paddingTop: number
    paddingRight: number
    paddingBottom: number
    paddingLeft: number
    borderRadius: number
    borderWidth: number
    showIcon: boolean
    icon: string
    iconPosition: "Left" | "Right"
    gap: number
    iconSize: number
    link?: string
    onClick?: React.MouseEventHandler<HTMLElement>
    style?: React.CSSProperties
}

const blobTransition = {
    repeat: Infinity,
    repeatType: "mirror" as const,
    ease: "easeInOut" as const,
}

const patterns = [
    {
        x: ["-20%", "20%", "-10%", "10%", "-20%"],
        y: ["-20%", "10%", "20%", "-10%", "-20%"],
        scale: [1, 1.5, 0.8, 1.2, 1],
    },
    {
        x: ["20%", "-20%", "10%", "-10%", "20%"],
        y: ["20%", "-10%", "-20%", "10%", "20%"],
        scale: [0.8, 1.2, 1.5, 1, 0.8],
    },
    {
        x: ["0%", "20%", "-20%", "0%", "0%"],
        y: ["-20%", "20%", "0%", "-20%", "-20%"],
        scale: [1.2, 0.8, 1.2, 1.2, 1.2],
    },
    {
        x: ["-15%", "15%", "-15%", "15%", "-15%"],
        y: ["15%", "-15%", "15%", "-15%", "15%"],
        scale: [0.9, 1.3, 0.9, 1.3, 0.9],
    },
]

/**
 * @framerIntrinsicWidth 180
 * @framerIntrinsicHeight 50
 */
export default function SplashGradientButton(props: SplashGradientButtonProps) {
    const {
        text = "Hover Me",
        fontStyle = {
            fontFamily: "Inter",
            fontSize: "16px",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            lineHeight: "1.5em",
        },
        textColor = "#FFFFFF",
        hoverTextColor = "#FFFFFF",
        gradientColors = ["#FF0080", "#7928CA", "#FF4D4D"],
        buttonBackgroundColor = "#000000",
        paddingTop = 16,
        paddingRight = 32,
        paddingBottom = 16,
        paddingLeft = 32,
        borderRadius = 12,
        borderWidth = 2,
        showIcon = false,
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>',
        iconPosition = "Left",
        gap = 8,
        iconSize = 20,
        link,
        style,
        ...rest
    } = props

    const safeColors = React.useMemo(
        () =>
            gradientColors && gradientColors.length > 0
                ? gradientColors
                : ["#FF0080", "#7928CA", "#FF4D4D"],
        [gradientColors]
    )

    const renderIcon = () => {
        if (!showIcon || !icon) return null

        const formattedIcon = icon.includes("<svg")
            ? icon.replace(/<svg/, '<svg style="width: 100%; height: 100%;"')
            : icon

        return (
            <motion.div
                variants={{
                    hover: { color: hoverTextColor },
                }}
                transition={{ duration: 0.3 }}
                style={{
                    color: textColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: iconSize,
                    height: iconSize,
                    zIndex: 2,
                    flexShrink: 0,
                    userSelect: "none",
                    WebkitUserSelect: "none",
                }}
                dangerouslySetInnerHTML={{ __html: formattedIcon }}
            />
        )
    }

    return (
        <motion.a
            href={link}
            whileHover="hover"
            initial="rest"
            animate="rest"
            style={{
                ...style,
                textDecoration: "none",
                padding: borderWidth,
                borderRadius: borderRadius,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "stretch",
                cursor: "pointer",
                backgroundColor: buttonBackgroundColor,
            }}
            {...rest}
        >
            {/* Animated Gradient Background */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 0,
                    overflow: "hidden",
                    borderRadius: borderRadius,
                }}
            >
                {safeColors.map((color, index) => (
                    <motion.div
                        key={index}
                        animate={patterns[index % patterns.length]}
                        transition={{
                            ...blobTransition,
                            duration: 4 + (index % 4),
                        }}
                        style={{
                            position: "absolute",
                            top: "-50%",
                            left: "-50%",
                            width: "200%",
                            height: "200%",
                            background: `radial-gradient(circle at 50% 50%, ${color}, transparent 50%)`,
                            filter: "blur(20px)",
                        }}
                    />
                ))}
            </div>

            {/* Inner Button Content */}
            <motion.div
                variants={{
                    hover: { backgroundColor: buttonBackgroundColor },
                }}
                transition={{ duration: 0.3 }}
                style={{
                    backgroundColor: "rgba(0, 0, 0, 0)",
                    paddingTop,
                    paddingRight,
                    paddingBottom,
                    paddingLeft,
                    borderRadius: Math.max(0, borderRadius - borderWidth),
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "row",
                    gap: gap,
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                }}
            >
                {iconPosition === "Left" && renderIcon()}

                <motion.span
                    variants={{
                        hover: { color: hoverTextColor },
                    }}
                    transition={{ duration: 0.3 }}
                    style={{
                        ...fontStyle,
                        color: textColor,
                        position: "relative",
                        zIndex: 2,
                        whiteSpace: "nowrap",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                    }}
                >
                    {text}
                </motion.span>

                {iconPosition === "Right" && renderIcon()}
            </motion.div>
        </motion.a>
    )
}

addPropertyControls(SplashGradientButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Hover Me",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    fontStyle: {
        type: ControlType.Font,
        title: "Typography",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 16,
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.5em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text",
        defaultValue: "#FFFFFF",
    },
    gradientColors: {
        type: ControlType.Array,
        title: "Blob Colors",
        defaultValue: ["#FF0080", "#7928CA", "#FF4D4D"],
        control: {
            type: ControlType.Color,
        },
    },
    buttonBackgroundColor: {
        type: ControlType.Color,
        title: "Bg Color",
        defaultValue: "#000000",
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Show Icon",
        defaultValue: false,
    },
    iconPosition: {
        type: ControlType.Enum,
        title: "Position",
        options: ["Left", "Right"],
        defaultValue: "Left",
        hidden: (props) => !props.showIcon,
    },
    icon: {
        type: ControlType.String,
        title: "SVG Code",
        displayTextArea: true,
        defaultValue:
            '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>',
        hidden: (props) => !props.showIcon,
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        min: 8,
        max: 100,
        defaultValue: 20,
        displayStepper: true,
        hidden: (props) => !props.showIcon,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 100,
        defaultValue: 8,
        displayStepper: true,
        hidden: (props) => !props.showIcon,
    },
    paddingTop: {
        type: ControlType.Number,
        title: "Top Pad",
        min: 0,
        max: 100,
        defaultValue: 16,
        displayStepper: true,
    },
    paddingRight: {
        type: ControlType.Number,
        title: "Right Pad",
        min: 0,
        max: 100,
        defaultValue: 32,
        displayStepper: true,
    },
    paddingBottom: {
        type: ControlType.Number,
        title: "Bottom Pad",
        min: 0,
        max: 100,
        defaultValue: 16,
        displayStepper: true,
    },
    paddingLeft: {
        type: ControlType.Number,
        title: "Left Pad",
        min: 0,
        max: 100,
        defaultValue: 32,
        displayStepper: true,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 999,
        defaultValue: 12,
        displayStepper: true,
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border",
        min: 0,
        max: 20,
        defaultValue: 2,
        displayStepper: true,
    },
})