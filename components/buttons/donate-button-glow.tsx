import React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function DonateButton(props) {
    const {
        text,
        fontFamily,
        fontSize,
        fontWeight,
        textColor,
        gradientColor1,
        gradientColor2,
        borderRadius,
        buttonWidth,
        buttonHeight,
        padding,
        onClick,
    } = props

    // Check if rendering in a static context (Framer Canvas or SSG/SSR Export)
    const isStatic = useIsStaticRenderer()

    const selectedFont = fontFamily?.fontFamily || "sans-serif"

    // Parse padding (ControlType.Padding provides "10px 22px 10px 22px" string or { top, right, bottom, left } object)
    const paddingTop =
        typeof padding === "object" ? (padding?.top ?? 10) : undefined
    const paddingRight =
        typeof padding === "object" ? (padding?.right ?? 22) : undefined
    const paddingBottom =
        typeof padding === "object" ? (padding?.bottom ?? 10) : undefined
    const paddingLeft =
        typeof padding === "object" ? (padding?.left ?? 22) : undefined

    const paddingValue =
        typeof padding === "string"
            ? padding
            : `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`

    return (
        <>
            <div className="btn-donate-container">
                <button
                    type="button"
                    className={`btn-donate ${isStatic ? "is-static" : ""}`}
                    onClick={isStatic ? undefined : onClick}
                    style={
                        {
                            fontFamily: selectedFont,
                            fontSize: `${fontSize}px`,
                            fontWeight: fontWeight,
                            color: textColor,
                            width: buttonWidth ? `${buttonWidth}px` : "auto",
                            height: buttonHeight ? `${buttonHeight}px` : "auto",
                            padding: paddingValue,
                            borderRadius: `${borderRadius}px`,
                            "--btn-bg-1": gradientColor1,
                            "--btn-bg-2": gradientColor2,
                            "--btn-bg-color": textColor,
                        } as React.CSSProperties
                    }
                >
                    {text}
                </button>
            </div>

            <style>{`
                .btn-donate-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .btn-donate {
                    --btn-bg-1: #60c9ff;
                    --btn-bg-2: #1f75ff;
                    --btn-bg-color: #ffffff;
                    
                    cursor: pointer;
                    min-width: 120px;
                    min-height: 44px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.8s ease;
                    background-size: 280% auto;
                    background-image: linear-gradient(
                        325deg,
                        var(--btn-bg-2) 0%,
                        var(--btn-bg-1) 55%,
                        var(--btn-bg-2) 90%
                    );
                    border: none;
                    outline: none;
                    box-shadow:
                        0px 0px 20px rgba(71, 184, 255, 0.5),
                        0px 5px 5px -1px rgba(58, 125, 233, 0.25),
                        inset 4px 4px 8px rgba(175, 230, 255, 0.5),
                        inset -4px -4px 8px rgba(19, 95, 216, 0.35);
                }

                .btn-donate:hover {
                    background-position: right top;
                }

                .btn-donate:is(:focus, :focus-visible, :active) {
                    outline: none;
                    box-shadow:
                        0 0 0 3px var(--btn-bg-color),
                        0 0 0 6px var(--btn-bg-2);
                }

                /* Static renderer overrides for Framer Canvas and Export */
                .btn-donate.is-static {
                    transition: none !important;
                    animation: none !important;
                }

                .btn-donate.is-static:hover {
                    background-position: initial !important;
                }

                @media (prefers-reduced-motion: reduce) {
                    .btn-donate {
                        transition: linear;
                    }
                }
            `}</style>
        </>
    )
}

DonateButton.defaultProps = {
    text: "Donate now",
    fontFamily: { fontFamily: "sans-serif" },
    fontSize: 16,
    fontWeight: 500,
    textColor: "#ffffff",
    gradientColor1: "#60c9ff",
    gradientColor2: "#1f75ff",
    borderRadius: 8,
    buttonWidth: 160,
    buttonHeight: 48,
    padding: "10px 22px 10px 22px",
}

// --- Framer Controls Panel ---
addPropertyControls(DonateButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Donate now",
    },
    fontFamily: {
        type: ControlType.Font,
        title: "Font",
        controls: "font-family",
        defaultValue: { fontFamily: "sans-serif" },
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 16,
        min: 10,
        max: 36,
        step: 1,
    },
    fontWeight: {
        type: ControlType.Enum,
        title: "Weight",
        options: [400, 500, 600, 700, 800],
        optionTitles: ["Regular", "Medium", "SemiBold", "Bold", "ExtraBold"],
        defaultValue: 500,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#ffffff",
    },
    gradientColor1: {
        type: ControlType.Color,
        title: "Glow Color 1",
        defaultValue: "#60c9ff",
    },
    gradientColor2: {
        type: ControlType.Color,
        title: "Glow Color 2",
        defaultValue: "#1f75ff",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 1,
    },
    buttonWidth: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 160,
        min: 80,
        max: 400,
        step: 5,
    },
    buttonHeight: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 48,
        min: 32,
        max: 100,
        step: 2,
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "10px 22px 10px 22px",
        description: "Made with ❤️ by [@karimsaif](https://x.com/karimsaif0)",
    },
})
