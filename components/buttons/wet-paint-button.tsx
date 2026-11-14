// Wet Paint Button - A button with animated paint drips
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

import type { CSSProperties } from "react"

interface WetPaintButtonProps {
    label: string
    backgroundColor: string
    textColor: string
    dripCount: number
    speed: number
    font: CSSProperties
    style?: CSSProperties
}

interface DripConfig {
    left: string
    height: number
    delay: number
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function WetPaintButton(props: WetPaintButtonProps) {
    const {
        label,
        backgroundColor,
        textColor,
        dripCount,
        speed,
        font,
    } = props

    const isStatic = useIsStaticRenderer()

    const dripConfigs: DripConfig[] = [
        { left: "10%", height: 24, delay: 0.5 },
        { left: "30%", height: 20, delay: 3 },
        { left: "57%", height: 10, delay: 4.25 },
        { left: "85%", height: 16, delay: 1.5 },
    ]

    const visibleDrips = dripConfigs.slice(0, dripCount)

    return (
        <button
            style={{
                position: "relative",
                borderRadius: 8,
                background: backgroundColor,
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 10,
                paddingBottom: 10,
                color: textColor,
                border: "none",
                cursor: "pointer",
                transition: "filter 0.2s",
                ...font,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(1.1)"
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.filter = "brightness(1)"
            }}
        >
            {label}
            {!isStatic && visibleDrips.map((config, index) => (
                <Drip
                    key={index}
                    left={config.left}
                    height={config.height}
                    delay={config.delay}
                    color={backgroundColor}
                    speed={speed}
                />
            ))}
            {isStatic && visibleDrips.length > 0 && (
                <StaticDrip
                    left={visibleDrips[0].left}
                    height={visibleDrips[0].height}
                    color={backgroundColor}
                />
            )}
        </button>
    )
}

interface DripProps {
    left: string
    height: number
    delay: number
    color: string
    speed: number
}

function Drip({ left, height, delay, color, speed }: DripProps) {
    const duration = 2 / speed
    const repeatDelay = 2 / speed
    
    return (
        <motion.div
            style={{
                position: "absolute",
                top: "99%",
                left,
                transformOrigin: "top",
            }}
            initial={{ scaleY: 0.75 }}
            animate={{ scaleY: [0.75, 1, 0.75] }}
            transition={{
                duration,
                times: [0, 0.25, 1],
                delay,
                ease: "easeIn",
                repeat: Infinity,
                repeatDelay,
            }}
        >
            <div
                style={{
                    height,
                    width: 8,
                    borderBottomLeftRadius: 9999,
                    borderBottomRightRadius: 9999,
                    background: color,
                }}
            />
            <svg
                width="6"
                height="6"
                viewBox="0 0 6 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    position: "absolute",
                    left: "100%",
                    top: 0,
                }}
            >
                <g clipPath="url(#clip0_1077_28)">
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5.4 0H0V5.4C0 2.41765 2.41766 0 5.4 0Z"
                        fill={color}
                    />
                </g>
                <defs>
                    <clipPath id="clip0_1077_28">
                        <rect width="6" height="6" fill="white" />
                    </clipPath>
                </defs>
            </svg>
            <svg
                width="6"
                height="6"
                viewBox="0 0 6 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    position: "absolute",
                    right: "100%",
                    top: 0,
                    transform: "rotate(90deg)",
                }}
            >
                <g clipPath="url(#clip0_1077_28)">
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5.4 0H0V5.4C0 2.41765 2.41766 0 5.4 0Z"
                        fill={color}
                    />
                </g>
                <defs>
                    <clipPath id="clip0_1077_28">
                        <rect width="6" height="6" fill="white" />
                    </clipPath>
                </defs>
            </svg>

            <motion.div
                initial={{ y: -8, opacity: 1 }}
                animate={{ y: [-8, 50], opacity: [1, 0] }}
                transition={{
                    duration,
                    times: [0, 1],
                    delay,
                    ease: "easeIn",
                    repeat: Infinity,
                    repeatDelay,
                }}
                style={{
                    position: "absolute",
                    top: "100%",
                    height: 8,
                    width: 8,
                    borderRadius: 9999,
                    background: color,
                }}
            />
        </motion.div>
    )
}

function StaticDrip({ left, height, color }: { left: string; height: number; color: string }) {
    return (
        <div
            style={{
                position: "absolute",
                top: "99%",
                left,
                transformOrigin: "top",
            }}
        >
            <div
                style={{
                    height,
                    width: 8,
                    borderBottomLeftRadius: 9999,
                    borderBottomRightRadius: 9999,
                    background: color,
                }}
            />
            <svg
                width="6"
                height="6"
                viewBox="0 0 6 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    position: "absolute",
                    left: "100%",
                    top: 0,
                }}
            >
                <g clipPath="url(#clip0_1077_28)">
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5.4 0H0V5.4C0 2.41765 2.41766 0 5.4 0Z"
                        fill={color}
                    />
                </g>
                <defs>
                    <clipPath id="clip0_1077_28">
                        <rect width="6" height="6" fill="white" />
                    </clipPath>
                </defs>
            </svg>
            <svg
                width="6"
                height="6"
                viewBox="0 0 6 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    position: "absolute",
                    right: "100%",
                    top: 0,
                    transform: "rotate(90deg)",
                }}
            >
                <g clipPath="url(#clip0_1077_28)">
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5.4 0H0V5.4C0 2.41765 2.41766 0 5.4 0Z"
                        fill={color}
                    />
                </g>
                <defs>
                    <clipPath id="clip0_1077_28">
                        <rect width="6" height="6" fill="white" />
                    </clipPath>
                </defs>
            </svg>
        </div>
    )
}

addPropertyControls(WetPaintButton, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Wet Paint Button",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#8B5CF6",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    dripCount: {
        type: ControlType.Number,
        title: "Drip Count",
        defaultValue: 4,
        min: 0,
        max: 4,
        step: 1,
        displayStepper: true,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.25,
        max: 3,
        step: 0.25,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
})