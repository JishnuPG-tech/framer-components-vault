// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function ScrollToTop(props) {
    const {
        threshold,
        size,
        bottom,
        right,
        icon,
        strokeColor,
        strokeHoverColor,
    } = props

    const [visible, setVisible] = useState(false)
    const [hovered, setHovered] = useState(false)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const onScroll = () => {
            const scrollTop = window.scrollY
            const docHeight =
                document.documentElement.scrollHeight - window.innerHeight
            const scrolled = docHeight > 0 ? scrollTop / docHeight : 0
            setProgress(scrolled)
            setVisible(scrollTop > threshold)
        }
        window.addEventListener("scroll", onScroll)
        return () => window.removeEventListener("scroll", onScroll)
    }, [threshold])

    const handleClick = () => {
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const radius = (size - 4) / 2
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference * (1 - progress)
    const currentStroke = hovered ? strokeHoverColor : strokeColor

    const icons = {
        arrow: (
            <path
                d="M8 12.5V3.5M8 3.5L3.5 8M8 3.5L12.5 8"
                stroke={currentStroke}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transition: "stroke 0.2s ease" }}
            />
        ),
        chevron: (
            <path
                d="M3.5 10L8 5L12.5 10"
                stroke={currentStroke}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transition: "stroke 0.2s ease" }}
            />
        ),
        doubleChevron: (
            <>
                <path
                    d="M3.5 11.5L8 7L12.5 11.5"
                    stroke={currentStroke}
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transition: "stroke 0.2s ease" }}
                />
                <path
                    d="M3.5 7.5L8 3L12.5 7.5"
                    stroke={currentStroke}
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transition: "stroke 0.2s ease" }}
                />
            </>
        ),
        arrowCircle: (
            <>
                <circle
                    cx="8"
                    cy="8"
                    r="5.5"
                    stroke={currentStroke}
                    strokeWidth="1.4"
                    fill="none"
                    style={{ transition: "stroke 0.2s ease" }}
                />
                <path
                    d="M8 10.5V5.5M8 5.5L5.5 8M8 5.5L10.5 8"
                    stroke={currentStroke}
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transition: "stroke 0.2s ease" }}
                />
            </>
        ),
        home: (
            <path
                d="M2.5 7L8 2L13.5 7V13H10V9.5H6V13H2.5V7Z"
                stroke={currentStroke}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                style={{ transition: "stroke 0.2s ease" }}
            />
        ),
        rocket: (
            <>
                <path
                    d="M8 2C8 2 11 4 11 8C11 10 10 11.5 8 13C6 11.5 5 10 5 8C5 4 8 2 8 2Z"
                    stroke={currentStroke}
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    style={{ transition: "stroke 0.2s ease" }}
                />
                <circle
                    cx="8"
                    cy="7.5"
                    r="1.2"
                    stroke={currentStroke}
                    strokeWidth="1.2"
                    fill="none"
                    style={{ transition: "stroke 0.2s ease" }}
                />
                <path
                    d="M5.5 10.5L3.5 12.5M10.5 10.5L12.5 12.5"
                    stroke={currentStroke}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    style={{ transition: "stroke 0.2s ease" }}
                />
            </>
        ),
    }

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    style={{
                        position: "fixed",
                        bottom: bottom,
                        right: right,
                        width: size,
                        height: size,
                        zIndex: 9999,
                        cursor: "pointer",
                    }}
                    onClick={handleClick}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                >
                    {/* Progress ring */}
                    <svg
                        width={size}
                        height={size}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            transform: "rotate(-90deg)",
                        }}
                    >
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke="#2e2e2e"
                            strokeWidth="2"
                        />
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={hovered ? strokeHoverColor : strokeColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            style={{
                                transition:
                                    "stroke-dashoffset 0.1s linear, stroke 0.2s ease",
                            }}
                        />
                    </svg>

                    {/* Button inner */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 4,
                            borderRadius: "50%",
                            backgroundColor: hovered ? "#1c1c1c" : "#111111",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: hovered
                                ? "0 0 0 3px rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.6)"
                                : "0 4px 16px rgba(0,0,0,0.5)",
                            transition:
                                "background-color 0.2s ease, box-shadow 0.2s ease",
                        }}
                    >
                        <motion.svg
                            width={size * 0.38}
                            height={size * 0.38}
                            viewBox="0 0 16 16"
                            fill="none"
                            animate={{ y: hovered ? -2 : 0 }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 20,
                            }}
                        >
                            {icons[icon]}
                        </motion.svg>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

ScrollToTop.defaultProps = {
    threshold: 300,
    size: 48,
    bottom: 64,
    right: 32,
    icon: "arrow",
    strokeColor: "#24d7e0",
    strokeHoverColor: "#ffffff",
}

addPropertyControls(ScrollToTop, {
    icon: {
        type: ControlType.Enum,
        title: "Icon",
        defaultValue: "arrow",
        options: [
            "arrow",
            "chevron",
            "doubleChevron",
            "arrowCircle",
            "home",
            "rocket",
        ],
        optionTitles: [
            "↑ Arrow",
            "⌃ Chevron",
            "⌃⌃ Double Chevron",
            "⊙ Arrow Circle",
            "⌂ Home",
            "🚀 Rocket",
        ],
        displaySegmentedControl: false,
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#24d7e0",
    },
    strokeHoverColor: {
        type: ControlType.Color,
        title: "Hover Color",
        defaultValue: "#ffffff",
    },
    threshold: {
        type: ControlType.Number,
        title: "Show After (px)",
        defaultValue: 300,
        min: 0,
        max: 2000,
        step: 50,
        displayStepper: true,
    },
    size: {
        type: ControlType.Number,
        title: "Button Size",
        defaultValue: 48,
        min: 32,
        max: 80,
        step: 4,
        displayStepper: true,
    },
    bottom: {
        type: ControlType.Number,
        title: "Bottom Offset",
        defaultValue: 64,
        min: 8,
        max: 120,
        step: 4,
        displayStepper: true,
    },
    right: {
        type: ControlType.Number,
        title: "Right Offset",
        defaultValue: 32,
        min: 8,
        max: 120,
        step: 4,
        displayStepper: true,
    },
})
