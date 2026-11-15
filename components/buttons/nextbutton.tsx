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


export default function NextButton(props) {
    const {
        label,
        fontSizeCustom,
        font,
        paddingX,
        paddingY,
        iconScale,
        colorPreset,
        textColor,
        bgColor,
        bgHover,
        outlineColor,
        shadowColor,
        cornerRadius,
    } = props

    const fontSize = fontSizeCustom
    const iconSize = fontSize * iconScale // ⭐ separate icon size control

    // ---- COLOR PRESETS ----
    const presets = {
        Pink: {
            text: "#ffffff",
            bg: "#ff135a",
            hover: "#ff1472",
            outline: "rgba(255,20,90,0.25)",
            shadow: "rgba(0,0,0,0.25)",
        },
        Blue: {
            text: "#ffffff",
            bg: "#2563eb",
            hover: "#1d4ed8",
            outline: "rgba(37,99,235,0.4)",
            shadow: "rgba(0,0,0,0.4)",
        },
        Black: {
            text: "#ffffff",
            bg: "#0f172a",
            hover: "#020617",
            outline: "rgba(15,23,42,0.5)",
            shadow: "rgba(0,0,0,0.6)",
        },
        White: {
            text: "#111827",
            bg: "#ffffff",
            hover: "#f9fafb",
            outline: "rgba(148,163,184,0.7)",
            shadow: "rgba(0,0,0,0.25)",
        },
    }

    const preset = presets[colorPreset] || presets.Pink

    const currentText = textColor || preset.text
    const currentBg = bgColor || preset.bg
    const currentHover = bgHover || preset.hover
    const currentOutline = outlineColor || preset.outline
    const currentShadow = shadowColor || preset.shadow

    const fontStyle = font || {
        fontFamily: "Poppins",
        fontWeight: 600,
        fontStyle: "normal",
    }

    return (
        <div style={{ display: "inline-flex" }}>
            <button
                className="next-btn"
                style={{
                    "--color-text": currentText,
                    "--color-background": currentBg,
                    "--color-background-hover": currentHover,
                    "--color-outline": currentOutline,
                    "--color-shadow": currentShadow,

                    ...fontStyle,
                    fontSize,
                    color: currentText,
                    borderRadius: cornerRadius,

                    paddingTop: paddingY,
                    paddingBottom: paddingY,
                    paddingLeft: paddingX,
                    paddingRight: paddingX,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: paddingX * 0.4,

                    border: "none",
                    outline: "none",
                    cursor: "pointer",
                    boxSizing: "border-box",
                    background: currentBg,
                }}
            >
                <span style={{ ...fontStyle, fontSize, color: currentText }}>
                    {label}
                </span>

                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 66 43"
                    style={{
                        height: iconSize, // ⭐ controlled by Icon Size
                        fill: currentText,
                        transition: "0.5s",
                    }}
                >
                    <polygon points="39.58,4.46 44.11,0 66,21.5 44.11,43 39.58,38.54 56.94,21.5" />
                    <polygon points="19.79,4.46 24.32,0 46.21,21.5 24.32,43 19.79,38.54 37.15,21.5" />
                    <polygon points="0,4.46 4.53,0 26.42,21.5 4.53,43 0,38.54 17.36,21.5" />
                </svg>
            </button>

            <style>{`
                .next-btn {
                    box-shadow: 0 0 0.2em var(--color-background);
                    transition: 0.3s ease;
                }

                .next-btn:active {
                    transform: scale(0.96);
                }

                .next-btn:hover {
                    background: var(--color-background-hover);
                    box-shadow: 0 0 1em var(--color-background);
                    outline: 0.1em solid transparent;
                    outline-offset: 0.2em;
                    animation: ripple 1s linear infinite, colorize 1s infinite;
                }

                .next-btn:hover span {
                    text-shadow: 5px 5px 5px var(--color-shadow);
                }

                .next-btn:hover svg {
                    transform: translateX(0.2em);
                    filter: drop-shadow(5px 5px 2.5px var(--color-shadow));
                }

                @keyframes colorize {
                    0% { background: var(--color-background); }
                    50% { background: var(--color-background-hover); }
                    100% { background: var(--color-background); }
                }

                @keyframes ripple {
                    0% { outline-offset: -0.1em; }
                    50% { outline: 0.2em solid var(--color-outline); outline-offset: 0.2em; }
                    100% { outline: 0.4em solid transparent; outline-offset: 0.4em; }
                }
            `}</style>
        </div>
    )
}

NextButton.defaultProps = {
    label: "NEXT",

    fontSizeCustom: 18,
    iconScale: 1, // ⭐ new

    paddingX: 28,
    paddingY: 12,

    font: {
        fontFamily: "Poppins",
        fontWeight: 600,
        fontStyle: "normal",
    },

    colorPreset: "Pink",
    textColor: "",
    bgColor: "",
    bgHover: "",
    outlineColor: "",
    shadowColor: "",
    cornerRadius: 999,
}

addPropertyControls(NextButton, {
    label: {
        title: "Text",
        type: ControlType.String,
        defaultValue: "NEXT",
    },

    fontSizeCustom: {
        title: "Font Size",
        type: ControlType.Number,
        defaultValue: 18,
        min: 10,
        max: 80,
        step: 1,
    },

    iconScale: {
        title: "Icon Size",
        type: ControlType.Number,
        defaultValue: 1,
        min: 0.5,
        max: 2,
        step: 0.05,
    },

    font: {
        title: "Font",
        type: ControlType.Font,
        defaultValue: {
            fontFamily: "Poppins",
            fontWeight: 600,
            fontStyle: "normal",
        },
    },

    paddingX: {
        title: "Padding X",
        type: ControlType.Number,
        defaultValue: 28,
        min: 4,
        max: 80,
        step: 1,
    },

    paddingY: {
        title: "Padding Y",
        type: ControlType.Number,
        defaultValue: 12,
        min: 2,
        max: 40,
        step: 1,
    },

    colorPreset: {
        title: "Color Preset",
        type: ControlType.Enum,
        options: ["Pink", "Blue", "Black", "White"],
        optionTitles: ["Pink", "Blue", "Black", "White"],
        defaultValue: "Pink",
    },

    textColor: { title: "Text Override", type: ControlType.Color },
    bgColor: { title: "BG Override", type: ControlType.Color },
    bgHover: { title: "Hover Override", type: ControlType.Color },
    outlineColor: { title: "Outline Override", type: ControlType.Color },
    shadowColor: { title: "Shadow Override", type: ControlType.Color },

    cornerRadius: {
        title: "Radius",
        type: ControlType.Number,
        defaultValue: 999,
        min: 0,
        max: 300,
    },
})
