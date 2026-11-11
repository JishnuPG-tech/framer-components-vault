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


export default function FuturisticDonutChart(props: any) {
    const {
        value,
        max,
        size,
        thickness,
        skin,
        gradientStart,
        gradientEnd,
        trackColor,
        textColor,
        fontFamily,
        showValue,
        unit,
        centerIcon,
    } = props

    const percentage = Math.min(100, (value / max) * 100)
    const radius = (size - thickness) / 2
    const circumference = 2 * Math.PI * radius
    const progress = (percentage / 100) * circumference

    // Skins styles
    const skins: Record<string, React.CSSProperties> = {
        minimal: { filter: "none" },
        glass: {
            backdropFilter: "blur(8px)",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "50%",
        },
        neon: {
            filter: "drop-shadow(0 0 8px " + gradientEnd + ")",
        },
        glow: {
            filter: "drop-shadow(0 0 20px " + gradientEnd + ")",
        },
    }

    return (
        <div
            style={{
                width: size,
                height: size,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...skins[skin],
            }}
        >
            <svg width={size} height={size}>
                {/* Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={trackColor}
                    strokeWidth={thickness}
                    fill="none"
                />
                {/* Progress */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={`url(#grad)`}
                    strokeWidth={thickness}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - progress }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                />
                {/* Gradient Defs */}
                <defs>
                    <linearGradient
                        id="grad"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                    >
                        <stop offset="0%" stopColor={gradientStart} />
                        <stop offset="100%" stopColor={gradientEnd} />
                    </linearGradient>
                </defs>
            </svg>

            {/* Center Content */}
            <div
                style={{
                    position: "absolute",
                    textAlign: "center",
                    fontFamily: fontFamily,
                    color: textColor,
                }}
            >
                {centerIcon ? (
                    <img src={centerIcon} width={30} height={30} alt="icon" />
                ) : (
                    showValue && (
                        <div style={{ fontSize: size * 0.15, fontWeight: 600 }}>
                            {Math.round(value)}
                            {unit}
                        </div>
                    )
                )}
            </div>
        </div>
    )
}

// Framer Controls
addPropertyControls(FuturisticDonutChart, {
    value: { type: ControlType.Number, defaultValue: 65, min: 0, max: 100 },
    max: { type: ControlType.Number, defaultValue: 100, min: 1, max: 1000 },
    size: { type: ControlType.Number, defaultValue: 200, min: 80, max: 500 },
    thickness: { type: ControlType.Number, defaultValue: 20, min: 5, max: 60 },
    skin: {
        type: ControlType.Enum,
        options: ["minimal", "glass", "neon", "glow"],
        optionTitles: ["Minimal", "Glass", "Neon", "Glow"],
        defaultValue: "neon",
    },
    gradientStart: { type: ControlType.Color, defaultValue: "#00f5ff" },
    gradientEnd: { type: ControlType.Color, defaultValue: "#ff00ff" },
    trackColor: { type: ControlType.Color, defaultValue: "#222" },
    textColor: { type: ControlType.Color, defaultValue: "#fff" },
    fontFamily: { type: ControlType.String, defaultValue: "Inter" },
    showValue: { type: ControlType.Boolean, defaultValue: true },
    unit: { type: ControlType.String, defaultValue: "%" },
    centerIcon: { type: ControlType.Image },
})
