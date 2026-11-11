// Animated airplane switch component with street/sky background transition
import { useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface PlaneSwitchProps {
    defaultChecked: boolean
    onToggle: (checked: boolean) => void
    streetColor: string
    skyColor1: string
    skyColor2: string
    dotColor: string
    streetLineColor: string
    streetLineMidColor: string
    lightColor1: string
    lightColor2: string
    cloudColor: string
    size: number
    dotSize: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function PlaneSwitch(props: PlaneSwitchProps) {
    const {
        defaultChecked = false,
        onToggle,
        streetColor = "#6B6D76",
        skyColor1 = "#60A7FA",
        skyColor2 = "#2F8EFC",
        dotColor = "#FFFFFF",
        streetLineColor = "#A8AAB4",
        streetLineMidColor = "#C0C2C8",
        lightColor1 = "rgba(255, 233, 0, 1)",
        lightColor2 = "rgba(255, 233, 0, 0.3)",
        cloudColor = "#FFFFFF",
        size = 1,
    } = props

    const [isChecked, setIsChecked] = useState(defaultChecked)

    const handleToggle = () => {
        const newChecked = !isChecked
        startTransition(() => setIsChecked(newChecked))
        if (onToggle) {
            onToggle(newChecked)
        }
    }

    const switchWidth = 50 * size
    const switchHeight = 25 * size

    const switchStyles: CSSProperties = {
        position: "relative",
        overflow: "hidden",
        width: switchWidth,
        height: switchHeight,
        padding: 1 * size,
        borderRadius: 13 * size,
        background: `linear-gradient(90deg, ${streetColor} 0%, ${streetColor} 25%, ${skyColor1} 75%, ${skyColor2} 100%)`,
        backgroundPosition: isChecked ? "100% 0" : "0% 0",
        backgroundSize: "400% auto",
        transition: "background-position 0.6s",
        WebkitMaskImage: "-webkit-radial-gradient(white, black)",
    }

    const streetLinesStyles: CSSProperties = {
        content: '""',
        display: "block",
        position: "absolute",
        width: 42 * size,
        right: 2 * size,
        top: 4 * size,
        height: 1 * size,
        background: streetLineColor,
        boxShadow: `0 ${16 * size}px 0 0 ${streetLineColor}`,
        transform: isChecked ? `translateX(-${50 * size}px)` : "translateX(0)",
        transition: "transform 0.3s",
    }

    const lightsStyles: CSSProperties = {
        content: '""',
        display: "block",
        position: "absolute",
        width: 2 * size,
        height: 2 * size,
        borderRadius: "50%",
        left: 23 * size,
        top: 1 * size,
        animation: `lights-${Math.round(size * 100)} 2s linear infinite`,
        boxShadow: `inset 0 0 0 ${2 * size}px ${lightColor1}, 0 ${21 * size}px 0 ${lightColor1}, ${8 * size}px 0 0 ${lightColor2}, ${8 * size}px ${21 * size}px 0 ${lightColor2}, ${16 * size}px 0 0 ${lightColor2}, ${16 * size}px ${21 * size}px 0 ${lightColor2}`,
        transform: isChecked ? `translateX(-${50 * size}px)` : "translateX(0)",
        transition: "transform 0.3s",
    }

    const streetMiddleStyles: CSSProperties = {
        position: "absolute",
        top: 12 * size,
        left: 21 * size,
        width: 3 * size,
        height: 1 * size,
        background: streetLineMidColor,
        boxShadow: `${5 * size}px 0 0 ${streetLineMidColor}, ${10 * size}px 0 0 ${streetLineMidColor}, ${15 * size}px 0 0 ${streetLineMidColor}, ${20 * size}px 0 0 ${streetLineMidColor}, ${25 * size}px 0 0 ${streetLineMidColor}`,
        transform: isChecked ? `translateX(-${50 * size}px)` : "translateX(0)",
        transition: "transform 0.3s",
    }

    const cloudBaseStyles: CSSProperties = {
        position: "absolute",
        width: 12 * size,
        height: 4 * size,
        borderRadius: 2 * size,
        background: cloudColor,
        left: "100%",
        transition: "opacity 0.3s",
        animation: `clouds-${Math.round(size * 100)} 2s linear infinite`,
    }

    const cloud1Styles: CSSProperties = {
        ...cloudBaseStyles,
        top: 8 * size,
        opacity: isChecked ? 0.8 : 0,
        animationDelay: "0s",
    }

    const cloud2Styles: CSSProperties = {
        ...cloudBaseStyles,
        top: 20 * size,
        opacity: isChecked ? 0.6 : 0,
        animationDelay: "1s",
    }

    const dotStyles: CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: 1,
        padding: 5 * size,
        width: 23 * size * props.dotSize,
        height: 23 * size * props.dotSize,
        borderRadius: "50%",
        background: dotColor,
        transform: isChecked ? `translateX(${25 * size}px)` : "translateX(0)",
        transition: "transform 0.6s cubic-bezier(0.2, 0.8, 0.35, 1.2)",
    }

    const svgStyles: CSSProperties = {
        width: 13 * size,
        height: 13 * size,
        display: "block",
        color: isChecked ? skyColor2 : streetColor,
        transition: "color 0.6s",
    }

    const animationId = Math.round(size * 100)

    return (
        <div
            style={{
                ...props.style,
                display: "inline-block",
                width: switchWidth + 2 * size,
                height: switchHeight + 2 * size,
            }}
        >
            <style>
                {`
                @keyframes lights-${animationId} {
                    20%, 30% {
                        box-shadow: inset 0 0 0 ${2 * size}px ${lightColor2}, 0 ${21 * size}px 0 ${lightColor2}, ${8 * size}px 0 0 ${lightColor1}, ${8 * size}px ${21 * size}px 0 ${lightColor1}, ${16 * size}px 0 0 ${lightColor2}, ${16 * size}px ${21 * size}px 0 ${lightColor2};
                    }
                    55%, 65% {
                        box-shadow: inset 0 0 0 ${2 * size}px ${lightColor2}, 0 ${21 * size}px 0 ${lightColor2}, ${8 * size}px 0 0 ${lightColor2}, ${8 * size}px ${21 * size}px 0 ${lightColor2}, ${16 * size}px 0 0 ${lightColor1}, ${16 * size}px ${21 * size}px 0 ${lightColor1};
                    }
                    90%, 100% {
                        box-shadow: inset 0 0 0 ${2 * size}px ${lightColor1}, 0 ${21 * size}px 0 ${lightColor1}, ${8 * size}px 0 0 ${lightColor2}, ${8 * size}px ${21 * size}px 0 ${lightColor2}, ${16 * size}px 0 0 ${lightColor2}, ${16 * size}px ${21 * size}px 0 ${lightColor2};
                    }
                }
                @keyframes clouds-${animationId} {
                    0% {
                        transform: translateX(0);
                        visibility: visible;
                    }
                    97% {
                        transform: translateX(-${72 * size}px);
                        visibility: visible;
                    }
                    98%, 100% {
                        visibility: hidden;
                        transform: translateX(-${72 * size}px);
                    }
                }
                `}
            </style>
            <label
                style={{
                    cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                    display: "inline-block",
                }}
                onClick={handleToggle}
            >
                <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    style={{ display: "none" }}
                />
                <div style={switchStyles}>
                    <div style={streetLinesStyles} />
                    <div style={lightsStyles} />
                    <span style={streetMiddleStyles} />
                    <span style={cloud1Styles}>
                        <span
                            style={{
                                position: "absolute",
                                borderRadius: "50%",
                                width: 5 * size,
                                height: 5 * size,
                                background: cloudColor,
                                bottom: 1 * size,
                                left: 1 * size,
                            }}
                        />
                        <span
                            style={{
                                position: "absolute",
                                borderRadius: "50%",
                                width: 6 * size,
                                height: 6 * size,
                                background: cloudColor,
                                bottom: 1 * size,
                                left: 5 * size,
                            }}
                        />
                    </span>
                    <span style={cloud2Styles}>
                        <span
                            style={{
                                position: "absolute",
                                borderRadius: "50%",
                                width: 5 * size,
                                height: 5 * size,
                                background: cloudColor,
                                bottom: 1 * size,
                                left: 1 * size,
                            }}
                        />
                        <span
                            style={{
                                position: "absolute",
                                borderRadius: "50%",
                                width: 6 * size,
                                height: 6 * size,
                                background: cloudColor,
                                bottom: 1 * size,
                                left: 5 * size,
                            }}
                        />
                    </span>
                    <div style={dotStyles}>
                        <svg viewBox="0 0 13 13" style={svgStyles}>
                            <path
                                d="M1.55989957,5.41666667 L5.51582215,5.41666667 L4.47015462,0.108333333 L4.47015462,0.108333333 C4.47015462,0.0634601974 4.49708054,0.0249592654 4.5354546,0.00851337035 L4.57707145,0 L5.36229752,0 C5.43359776,0 5.50087375,0.028779451 5.55026392,0.0782711996 L5.59317877,0.134368264 L7.13659662,2.81558333 L8.29565964,2.81666667 C8.53185377,2.81666667 8.72332694,3.01067661 8.72332694,3.25 C8.72332694,3.48932339 8.53185377,3.68333333 8.29565964,3.68333333 L7.63589819,3.68225 L8.63450135,5.41666667 L11.9308317,5.41666667 C12.5213171,5.41666667 13,5.90169152 13,6.5 C13,7.09830848 12.5213171,7.58333333 11.9308317,7.58333333 L8.63450135,7.58333333 L7.63589819,9.31666667 L8.29565964,9.31666667 C8.53185377,9.31666667 8.72332694,9.51067661 8.72332694,9.75 C8.72332694,9.98932339 8.53185377,10.1833333 8.29565964,10.1833333 L7.13659662,10.1833333 L5.59317877,12.8656317 C5.55725264,12.9280353 5.49882018,12.9724157 5.43174295,12.9907056 L5.36229752,13 L4.57707145,13 L4.55610333,12.9978962 C4.51267695,12.9890959 4.48069792,12.9547924 4.47230803,12.9134397 L4.47223088,12.8704208 L5.51582215,7.58333333 L1.55989957,7.58333333 L0.891288881,8.55114605 C0.853775374,8.60544678 0.798421006,8.64327676 0.73629202,8.65879796 L0.672314689,8.66666667 L0.106844414,8.66666667 L0.0715243949,8.66058466 L0.0715243949,8.66058466 C0.0297243066,8.6457608 0.00275502199,8.60729104 0,8.5651586 L0.00593007386,8.52254537 L0.580855011,6.85813984 C0.64492547,6.67265611 0.6577034,6.47392717 0.619193545,6.28316421 L0.580694768,6.14191703 L0.00601851064,4.48064746 C0.00203480725,4.4691314 0,4.45701613 0,4.44481314 C0,4.39994001 0.0269259152,4.36143908 0.0652999725,4.34499318 L0.106916826,4.33647981 L0.672546853,4.33647981 C0.737865848,4.33647981 0.80011301,4.36066329 0.848265401,4.40322477 L0.89131128,4.45169723 L1.55989957,5.41666667 Z"
                                fill="currentColor"
                            />
                        </svg>
                    </div>
                </div>
            </label>
        </div>
    )
}

addPropertyControls(PlaneSwitch, {
    defaultChecked: {
        type: ControlType.Boolean,
        title: "Default State",
        defaultValue: false,
        enabledTitle: "Sky",
        disabledTitle: "Street",
    },
    onToggle: {
        type: ControlType.EventHandler,
        title: "On Toggle",
    },
    streetColor: {
        type: ControlType.Color,
        title: "Street Color",
        defaultValue: "#6B6D76",
    },
    skyColor1: {
        type: ControlType.Color,
        title: "Sky Color 1",
        defaultValue: "#60A7FA",
    },
    skyColor2: {
        type: ControlType.Color,
        title: "Sky Color 2",
        defaultValue: "#2F8EFC",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#FFFFFF",
    },
    streetLineColor: {
        type: ControlType.Color,
        title: "Street Lines",
        defaultValue: "#A8AAB4",
    },
    streetLineMidColor: {
        type: ControlType.Color,
        title: "Street Middle",
        defaultValue: "#C0C2C8",
    },
    lightColor1: {
        type: ControlType.Color,
        title: "Light Color 1",
        defaultValue: "rgba(255, 233, 0, 1)",
    },
    lightColor2: {
        type: ControlType.Color,
        title: "Light Color 2",
        defaultValue: "rgba(255, 233, 0, 0.3)",
    },
    cloudColor: {
        type: ControlType.Color,
        title: "Cloud Color",
        defaultValue: "#FFFFFF",
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 1,
        min: 0.5,
        max: 3,
        step: 0.1,
        description: "\n Made with ❤️ by [Pixelcot](https://www.pixelcot.com)",
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 1,
        min: 0.5,
        max: 2,
        step: 0.1,
        hidden: () => true,
    },
})
