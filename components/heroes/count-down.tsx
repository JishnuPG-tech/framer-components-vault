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

import { motion, AnimatePresence } from "framer-motion"

/**
 * PRO COUNTDOWN (GOOGLE FONTS EDITION)
 * - Selects from a curated list of top Google Fonts
 * - Automatically loads the font file for you
 *
 * @framerSupported
 */

export default function ProCountdown(props) {
    const {
        targetDate,
        tint,
        labelColor,
        fontSize,
        gap,
        showSeparators,
        fontFamily,
        fontWeight,
    } = props

    // 1. DYNAMIC FONT LOADER
    // This injects the font from Google into your page automatically
    React.useEffect(() => {
        if (!fontFamily) return

        const linkId = `font-${fontFamily.replace(/\s+/g, "-")}`
        if (!document.getElementById(linkId)) {
            const link = document.createElement("link")
            link.id = linkId
            link.href = `https://fonts.googleapis.com/css?family=${fontFamily.replace(/\s+/g, "+")}:300,400,500,600,700,800,900&display=swap`
            link.rel = "stylesheet"
            document.head.appendChild(link)
        }
    }, [fontFamily])

    // 2. TIMER LOGIC
    const [timeLeft, setTimeLeft] = React.useState(
        calculateTimeLeft(targetDate)
    )

    React.useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft(targetDate))
        }, 1000)
        return () => clearInterval(timer)
    }, [targetDate])

    const time = timeLeft || { days: 0, hours: 0, minutes: 0, seconds: 0 }

    const style = {
        ...containerStyle,
        gap: gap,
        color: tint,
        fontFamily: `"${fontFamily}", sans-serif`, // Apply the font
        fontWeight: fontWeight,
    }

    return (
        <div style={style}>
            <NumberGroup value={time.days} label="DAYS" {...props} />
            {showSeparators && (
                <Separator
                    fontSize={fontSize}
                    tint={tint}
                    fontFamily={fontFamily}
                />
            )}
            <NumberGroup value={time.hours} label="HOURS" {...props} />
            {showSeparators && (
                <Separator
                    fontSize={fontSize}
                    tint={tint}
                    fontFamily={fontFamily}
                />
            )}
            <NumberGroup value={time.minutes} label="MINUTES" {...props} />
            {showSeparators && (
                <Separator
                    fontSize={fontSize}
                    tint={tint}
                    fontFamily={fontFamily}
                />
            )}
            <NumberGroup value={time.seconds} label="SECONDS" {...props} />
        </div>
    )
}

function Separator({ fontSize, tint, fontFamily }) {
    return (
        <div
            style={{
                ...separatorStyle,
                fontSize: fontSize,
                color: tint,
                fontFamily: `"${fontFamily}", sans-serif`,
            }}
        >
            :
        </div>
    )
}

function NumberGroup({ value, label, tint, labelColor, fontSize, fontFamily }) {
    const digits = (value < 10 ? `0${value}` : `${value}`).split("")

    return (
        <div style={groupContainerStyle}>
            <div style={digitsRowStyle}>
                {digits.map((digit, index) => (
                    <Digit
                        key={index}
                        value={digit}
                        fontSize={fontSize}
                        tint={tint}
                        fontFamily={fontFamily}
                    />
                ))}
            </div>
            <div
                style={{
                    ...labelStyle,
                    color: labelColor,
                    fontFamily: `"${fontFamily}", sans-serif`,
                }}
            >
                {label}
            </div>
        </div>
    )
}

function Digit({ value, fontSize, tint, fontFamily }) {
    return (
        <div
            style={{
                position: "relative",
                height: fontSize * 1.1,
                width: fontSize * 0.65,
                overflow: "hidden",
                display: "flex",
                justifyContent: "center",
            }}
        >
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                    key={value}
                    style={{
                        fontSize: fontSize,
                        lineHeight: 1,
                        color: tint,
                        position: "absolute",
                        fontFamily: `"${fontFamily}", sans-serif`, // Explicitly pass font to motion component
                        fontWeight: "inherit",
                    }}
                    initial={{ y: "-60%", opacity: 0, filter: "blur(6px)" }}
                    animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
                    exit={{ y: "60%", opacity: 0, filter: "blur(6px)" }}
                    transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 35,
                        mass: 1,
                    }}
                >
                    {value}
                </motion.span>
            </AnimatePresence>
        </div>
    )
}

/* --- LOGIC --- */
const calculateTimeLeft = (targetDate) => {
    const difference = +new Date(targetDate) - +new Date()
    if (difference > 0) {
        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
        }
    }
    return null
}

/* --- STYLES --- */
const containerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    height: "auto",
}

const groupContainerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
}

const digitsRowStyle = {
    display: "flex",
    justifyContent: "center",
}

const separatorStyle = {
    fontWeight: "bold",
    lineHeight: 1,
    opacity: 0.2,
    marginTop: "-2px",
}

const labelStyle = {
    fontSize: "10px",
    fontWeight: 600,
    letterSpacing: "1px",
    textTransform: "uppercase",
    marginTop: "6px",
    textAlign: "center",
}

/* --- PROPERTY CONTROLS --- */

// The curated list of Google Fonts
const fontOptions = [
    "Inter",
    "Roboto",
    "Poppins",
    "DM Sans",
    "Oswald",
    "Montserrat",
    "Open Sans",
    "Lato",
    "Playfair Display",
    "Nunito",
    "Raleway",
    "Bebas Neue",
    "Anton",
    "Fraunces",
    "Space Mono",
]

addPropertyControls(ProCountdown, {
    targetDate: {
        type: ControlType.Date,
        title: "Target Date",
        defaultValue: new Date(Date.now() + 86400000),
    },
    fontFamily: {
        type: ControlType.Enum,
        title: "Font",
        defaultValue: "Inter",
        options: fontOptions, // Use our list
    },
    fontWeight: {
        type: ControlType.Enum,
        title: "Weight",
        defaultValue: 700,
        options: [100, 300, 400, 500, 700, 900],
        optionTitles: ["Thin", "Light", "Regular", "Medium", "Bold", "Black"],
    },
    fontSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 60,
        min: 20,
        max: 200,
    },
    gap: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 30,
        min: 0,
        max: 100,
    },
    showSeparators: {
        type: ControlType.Boolean,
        title: "Separators",
        defaultValue: false,
    },
    tint: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "#888888",
    },
})
