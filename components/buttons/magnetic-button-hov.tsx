import * as React from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Props {
    label: string
    background: string
    color: string
    radius: number
    strength: number
    paddingVertical: number
    paddingHorizontal: number
    font: any
    fontSize: number
    enableHoverScale: boolean
    scaleAmount: number
    showArrow: boolean
    arrowBehavior: "always" | "onHover"
    arrowAngle: number
    textAnimation: "none" | "roll" | "stagger"
    link: string
    openInNewTab: boolean
}

export default function WillexMotionMagneticButton(props: Props) {
    const {
        label,
        background,
        color,
        radius,
        strength,
        paddingVertical,
        paddingHorizontal,
        font,
        fontSize,
        enableHoverScale,
        scaleAmount,
        showArrow,
        arrowBehavior,
        arrowAngle,
        textAnimation,
        link,
        openInNewTab,
    } = props

    const [isHovered, setIsHovered] = React.useState(false)
    const ref = React.useRef<HTMLDivElement>(null)

    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const springX = useSpring(x, { stiffness: 180, damping: 15 })
    const springY = useSpring(y, { stiffness: 180, damping: 15 })

    function handleMove(e: React.MouseEvent) {
        if (!ref.current) return
        const rect = ref.current.getBoundingClientRect()
        x.set((e.clientX - rect.left - rect.width / 2) * strength)
        y.set((e.clientY - rect.top - rect.height / 2) * strength)
    }

    function handleLeave() {
        x.set(0)
        y.set(0)
    }

    const renderAnimatedText = () => {
        if (textAnimation === "stagger") {
            return label.split("").map((char, i) => (
                <motion.span
                    key={i}
                    style={{
                        display: "inline-block",
                        whiteSpace: char === " " ? "pre" : "normal",
                    }}
                    animate={{ y: isHovered ? -3 : 0 }}
                    transition={{ duration: 0.2, delay: i * 0.02 }}
                >
                    {char}
                </motion.span>
            ))
        }

        if (textAnimation === "roll") {
            return (
                <span
                    style={{
                        position: "relative",
                        overflow: "hidden",
                        display: "inline-block",
                    }}
                >
                    <motion.span
                        style={{ display: "inline-block" }}
                        animate={{ y: isHovered ? "-100%" : "0%" }}
                        transition={{ duration: 0.3, ease: [0.76, 0, 0.24, 1] }}
                    >
                        {label}
                    </motion.span>
                    <motion.span
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            display: "inline-block",
                        }}
                        animate={{ y: isHovered ? "-100%" : "0%" }}
                        transition={{ duration: 0.3, ease: [0.76, 0, 0.24, 1] }}
                    >
                        {label}
                    </motion.span>
                </span>
            )
        }

        return label
    }

    const buttonContent = (
        <motion.div
            style={{
                x: springX,
                y: springY,
                background,
                color,
                border: "none",
                borderRadius: radius,
                padding: `${paddingVertical}px ${paddingHorizontal}px`,
                fontSize,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
                whiteSpace: "nowrap",
                textDecoration: "none",
                ...font,
            }}
            whileHover={enableHoverScale ? { scale: scaleAmount } : undefined}
            whileTap={{ scale: 0.96 }}
        >
            <span
                style={{
                    display: "inline-flex",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                {renderAnimatedText()}
            </span>

            {showArrow && (
                <motion.span
                    style={{
                        display: "inline-block",
                        rotate: arrowAngle,
                    }}
                    animate={
                        arrowBehavior === "onHover"
                            ? {
                                  opacity: isHovered ? 1 : 0,
                                  x: isHovered ? 0 : -6,
                                  y: isHovered ? 0 : 6,
                              }
                            : {}
                    }
                    transition={{ duration: 0.2 }}
                >
                    ↗
                </motion.span>
            )}
        </motion.div>
    )

    return (
        <div
            ref={ref}
            onMouseMove={handleMove}
            onMouseLeave={() => {
                handleLeave()
                setIsHovered(false)
            }}
            onMouseEnter={() => setIsHovered(true)}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {link ? (
                <a
                    href={link}
                    target={openInNewTab ? "_blank" : "_self"}
                    rel={openInNewTab ? "noopener noreferrer" : undefined}
                    style={{ textDecoration: "none" }}
                >
                    {buttonContent}
                </a>
            ) : (
                buttonContent
            )}
        </div>
    )
}

WillexMotionMagneticButton.defaultProps = {
    label: "Get Started",
    background: "#FFFFFF",
    color: "#080808",
    radius: 100,
    strength: 0.18,
    paddingVertical: 18,
    paddingHorizontal: 30,
    font: { fontFamily: "Inter", fontStyle: "normal", fontWeight: 600 },
    fontSize: 15,
    enableHoverScale: true,
    scaleAmount: 1.06,
    showArrow: true,
    arrowBehavior: "always",
    arrowAngle: 0,
    textAnimation: "roll",
    link: "",
    openInNewTab: false,
}

addPropertyControls(WillexMotionMagneticButton, {
    label: { type: ControlType.String, title: "Label" },
    background: { type: ControlType.Color, title: "Background" },
    color: { type: ControlType.Color, title: "Text Color" },
    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 100 },
    strength: {
        type: ControlType.Number,
        title: "Strength",
        min: 0,
        max: 0.5,
        step: 0.01,
    },
    paddingVertical: {
        type: ControlType.Number,
        title: "Padding Y",
        min: 0,
        max: 100,
    },
    paddingHorizontal: {
        type: ControlType.Number,
        title: "Padding X",
        min: 0,
        max: 100,
    },
    font: { type: ControlType.Font, title: "Font", defaultFont: "Inter" },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        min: 10,
        max: 30,
    },
    enableHoverScale: { type: ControlType.Boolean, title: "Hover Scale" },
    scaleAmount: {
        type: ControlType.Number,
        title: "Scale Amount",
        min: 1,
        max: 1.3,
        step: 0.01,
        hidden(props) {
            return !props.enableHoverScale
        },
    },
    showArrow: { type: ControlType.Boolean, title: "Show Arrow" },
    arrowBehavior: {
        type: ControlType.Enum,
        title: "Arrow State",
        options: ["always", "onHover"],
        optionTitles: ["Always Visible", "Appear on Hover"],
        hidden(props) {
            return !props.showArrow
        },
    },
    arrowAngle: {
        type: ControlType.Number,
        title: "Arrow Angle",
        min: -180,
        max: 180,
        step: 15,
        unit: "°",
        hidden(props) {
            return !props.showArrow
        },
    },
    textAnimation: {
        type: ControlType.Enum,
        title: "Text Hover",
        options: ["none", "roll", "stagger"],
        optionTitles: ["None", "Text Roll", "Fade Stagger"],
    },
    link: { type: ControlType.Link, title: "Link" },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        hidden(props) {
            return !props.link
        },
    },
})
