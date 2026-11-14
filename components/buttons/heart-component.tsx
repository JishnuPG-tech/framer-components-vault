// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, type CSSProperties } from "react"

interface HeartCheckboxProps {
    heartColor: string
    size: number
    defaultChecked: boolean
    padding: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function Heart(props: HeartCheckboxProps) {
    const { heartColor, size, defaultChecked, padding } = props
    const [isChecked, setIsChecked] = useState(defaultChecked)
    const [animationKey, setAnimationKey] = useState(0)

    const handleChange = (e) => {
        setIsChecked(e.target.checked)
        setAnimationKey((prev) => prev + 1)
    }

    return (
        <div
            style={{
                position: "relative",
                transition: "0.3s",
                overflow: "visible",
            }}
        >
            <div
                style={{
                    width: size,
                    height: size,
                    position: "relative",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    margin: `${padding}px`,
                }}
            >
                <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={handleChange}
                    style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        opacity: 0,
                        zIndex: 20,
                        cursor: "pointer",
                    }}
                />
                <svg
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                        fill: heartColor,
                        position: "absolute",
                        display: isChecked ? "none" : "block",
                    }}
                >
                    <path d="M17.5,1.917a6.4,6.4,0,0,0-5.5,3.3,6.4,6.4,0,0,0-5.5-3.3A6.8,6.8,0,0,0,0,8.967c0,4.547,4.786,9.513,8.8,12.88a4.974,4.974,0,0,0,6.4,0C19.214,18.48,24,13.514,24,8.967A6.8,6.8,0,0,0,17.5,1.917Zm-3.585,18.4a2.973,2.973,0,0,1-3.83,0C4.947,16.006,2,11.87,2,8.967a4.8,4.8,0,0,1,4.5-5.05A4.8,4.8,0,0,1,11,8.967a1,1,0,0,0,2,0,4.8,4.8,0,0,1,4.5-5.05A4.8,4.8,0,0,1,22,8.967C22,11.87,19.053,16.006,13.915,20.313Z" />
                </svg>
                <svg
                    key={`filled-${animationKey}`}
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                        fill: heartColor,
                        position: "absolute",
                        display: isChecked ? "block" : "none",
                        animation: isChecked
                            ? "keyframes-svg-filled 1s"
                            : "none",
                    }}
                >
                    <path d="M17.5,1.917a6.4,6.4,0,0,0-5.5,3.3,6.4,6.4,0,0,0-5.5-3.3A6.8,6.8,0,0,0,0,8.967c0,4.547,4.786,9.513,8.8,12.88a4.974,4.974,0,0,0,6.4,0C19.214,18.48,24,13.514,24,8.967A6.8,6.8,0,0,0,17.5,1.917Z" />
                </svg>
                {isChecked && (
                    <svg
                        key={`celebrate-${animationKey}`}
                        width={size * 2}
                        height={size * 2}
                        viewBox="0 0 100 100"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                            position: "absolute",
                            animation: "keyframes-svg-celebrate 0.5s forwards",
                            stroke: heartColor,
                            fill: heartColor,
                            strokeWidth: "2px",
                            left: "50%",
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                            pointerEvents: "none",
                        }}
                    >
                        <polygon points="10,10 20,20" />
                        <polygon points="10,50 20,50" />
                        <polygon points="20,80 30,70" />
                        <polygon points="90,10 80,20" />
                        <polygon points="90,50 80,50" />
                        <polygon points="80,80 70,70" />
                    </svg>
                )}
            </div>
            <style>
                {`
                    @keyframes keyframes-svg-filled {
                        0% {
                            transform: scale(0);
                        }
                        25% {
                            transform: scale(1.2);
                        }
                        50% {
                            transform: scale(1);
                            filter: brightness(1.5);
                        }
                    }
                    @keyframes keyframes-svg-celebrate {
                        0% {
                            transform: translate(-50%, -50%) scale(0);
                        }
                        50% {
                            opacity: 1;
                            filter: brightness(1.5);
                            transform: translate(-50%, -50%) scale(1);
                        }
                        100% {
                            transform: translate(-50%, -50%) scale(1.4);
                            opacity: 0;
                        }
                    }
                `}
            </style>
        </div>
    )
}

addPropertyControls(Heart, {
    heartColor: {
        type: ControlType.Color,
        title: "Heart Color",
        defaultValue: "rgb(255, 91, 137)",
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 50,
        min: 20,
        max: 200,
        step: 1,
        unit: "px",
    },
    defaultChecked: {
        type: ControlType.Boolean,
        title: "Default Checked",
        defaultValue: false,
        enabledTitle: "Checked",
        disabledTitle: "Unchecked",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 10,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
})
