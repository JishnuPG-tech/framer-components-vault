import React, { useCallback, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export interface DrawLiquidButtonProps {
    text?: string
    themePreset?: "pink" | "blue" | "teal" | "custom"
    fontFamily?: { fontFamily?: string }
    fontSize?: number
    fontWeight?: string
    padding?: string
    lineColor?: string
    backColor?: string
    drawThickness?: number
    hoverLetterSpacing?: number
    fullWidth?: boolean
    textWrap?: boolean
    disabled?: boolean
    link?: string
    openInNewTab?: boolean
    ariaLabel?: string
    onClick?: (e: React.MouseEvent | React.KeyboardEvent) => void
}

const GLOBAL_STYLE_ID = "draw-liquid-button-global-styles"

function injectGlobalStyles() {
    if (
        typeof document === "undefined" ||
        document.getElementById(GLOBAL_STYLE_ID)
    ) {
        return
    }

    const styleEl = document.createElement("style")
    styleEl.id = GLOBAL_STYLE_ID
    styleEl.innerHTML = `
        .draw-liquid-wrapper {
            display: flex;
            justify-content: center;
            align-items: center;
            box-sizing: border-box;
        }

        .draw-liquid-wrapper.full-width {
            width: 100%;
        }

        .draw-liquid-btn {
            position: relative;
            z-index: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: var(--draw-btn-height);
            text-decoration: none;
            color: var(--draw-line-color);
            letter-spacing: 2px;
            transition: all 0.3s ease;
            box-sizing: border-box;
            background: transparent;
            border: none;
            cursor: pointer;
            outline: none;
            margin: 0;
            white-space: var(--draw-text-wrap);
            word-break: break-word;
            text-align: center;
        }

        .draw-liquid-btn.is-disabled {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
        }

        .draw-liquid-text {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
            z-index: 1;
        }

        .draw-liquid-btn::before,
        .draw-liquid-btn::after,
        .draw-liquid-text::before,
        .draw-liquid-text::after {
            content: "";
            position: absolute;
            height: 3px;
            border-radius: 2px;
            background: var(--draw-line-color);
            transition: all 0.5s ease;
        }

        .draw-liquid-btn::before {
            top: 0;
            left: var(--draw-btn-height);
            width: calc(100% - var(--draw-btn-height) * 2 - 16px);
        }

        .draw-liquid-btn::after {
            top: 0;
            right: var(--draw-btn-height);
            width: 8px;
        }

        .draw-liquid-text::before {
            bottom: 0;
            right: var(--draw-btn-height);
            width: calc(100% - var(--draw-btn-height) * 2 - 16px);
        }

        .draw-liquid-text::after {
            bottom: 0;
            left: var(--draw-btn-height);
            width: 8px;
        }

        .draw-liquid-line {
            position: absolute;
            top: 0;
            width: var(--draw-btn-height);
            height: 100%;
            overflow: hidden;
        }

        .draw-liquid-line::before {
            content: "";
            position: absolute;
            top: 0;
            width: 150%;
            height: 100%;
            box-sizing: border-box;
            border-radius: 300px;
            border: solid 3px var(--draw-line-color);
        }

        .draw-liquid-line:nth-child(1),
        .draw-liquid-line:nth-child(1)::before {
            left: 0;
        }

        .draw-liquid-line:nth-child(2),
        .draw-liquid-line:nth-child(2)::before {
            right: 0;
        }

        .draw-liquid-btn:not(.is-disabled):hover {
            letter-spacing: var(--draw-hover-spacing);
        }

        .draw-liquid-btn:not(.is-disabled):hover::before,
        .draw-liquid-btn:not(.is-disabled):hover .draw-liquid-text::before {
            width: 8px;
        }

        .draw-liquid-btn:not(.is-disabled):hover::after,
        .draw-liquid-btn:not(.is-disabled):hover .draw-liquid-text::after {
            width: calc(100% - var(--draw-btn-height) * 2 - 16px);
        }

        .draw-liquid-draw1,
        .draw-liquid-draw2 {
            position: absolute;
            z-index: -1;
            border-radius: var(--draw-radius);
            transform-origin: var(--draw-radius) var(--draw-radius);
        }

        .draw-liquid-draw1 {
            top: calc(var(--draw-radius) * -1);
            left: 40px;
            width: var(--draw-size);
            height: 0;
            transform: rotate(30deg);
        }

        .draw-liquid-draw2 {
            top: 44px;
            left: 77px;
            width: var(--draw-size);
            height: 0;
            transform: rotate(-127deg);
        }

        .draw-liquid-draw1::before,
        .draw-liquid-draw1::after,
        .draw-liquid-draw2::before,
        .draw-liquid-draw2::after {
            content: "";
            position: absolute;
        }

        .draw-liquid-draw1::before {
            bottom: 0;
            left: 0;
            width: 0;
            height: var(--draw-size);
            border-radius: var(--draw-radius);
            transform-origin: var(--draw-radius) var(--draw-radius);
            transform: rotate(-60deg);
        }

        .draw-liquid-draw1::after {
            top: -10px;
            left: 45px;
            width: 0;
            height: var(--draw-size);
            border-radius: var(--draw-radius);
            transform-origin: var(--draw-radius) var(--draw-radius);
            transform: rotate(69deg);
        }

        .draw-liquid-draw2::before {
            bottom: 0;
            left: 0;
            width: 0;
            height: var(--draw-size);
            border-radius: var(--draw-radius);
            transform-origin: var(--draw-radius) var(--draw-radius);
            transform: rotate(-146deg);
        }

        .draw-liquid-draw2::after {
            bottom: 26px;
            left: -40px;
            width: 0;
            height: var(--draw-size);
            border-radius: var(--draw-radius);
            transform-origin: var(--draw-radius) var(--draw-radius);
            transform: rotate(-262deg);
        }

        .draw-liquid-draw1,
        .draw-liquid-draw1::before,
        .draw-liquid-draw1::after,
        .draw-liquid-draw2,
        .draw-liquid-draw2::before,
        .draw-liquid-draw2::after {
            background: var(--draw-back-color);
        }

        .draw-liquid-btn:not(.is-disabled):hover .draw-liquid-draw1 {
            animation: draw1 ease-in 0.06s forwards;
        }

        .draw-liquid-btn:not(.is-disabled):hover .draw-liquid-draw1::before {
            animation: draw2 linear 0.08s 0.06s forwards;
        }

        .draw-liquid-btn:not(.is-disabled):hover .draw-liquid-draw1::after {
            animation: draw3 linear 0.03s 0.14s forwards;
        }

        .draw-liquid-btn:not(.is-disabled):hover .draw-liquid-draw2 {
            animation: draw4 linear 0.06s 0.2s forwards;
        }

        .draw-liquid-btn:not(.is-disabled):hover .draw-liquid-draw2::before {
            animation: draw3 linear 0.03s 0.26s forwards;
        }

        .draw-liquid-btn:not(.is-disabled):hover .draw-liquid-draw2::after {
            animation: draw5 linear 0.06s 0.32s forwards;
        }

        @keyframes draw1 {
            0% { height: 0; }
            100% { height: 100px; }
        }

        @keyframes draw2 {
            0% { width: 0; opacity: 0; }
            10% { opacity: 0; }
            11% { opacity: 1; }
            100% { width: 120px; }
        }

        @keyframes draw3 {
            0% { width: 0; }
            100% { width: 80px; }
        }

        @keyframes draw4 {
            0% { height: 0; }
            100% { height: 120px; }
        }

        @keyframes draw5 {
            0% { width: 0; }
            100% { width: 124px; }
        }
    `
    document.head.appendChild(styleEl)
}

export default function DrawLiquidButton({
    text = "ENTRY",
    themePreset = "teal",
    fontFamily = { fontFamily: "Inter, sans-serif" },
    fontSize = 14,
    fontWeight = "700",
    padding = "18px 48px",
    lineColor = "#00135c",
    backColor = "#defffa",
    drawThickness = 32,
    hoverLetterSpacing = 6,
    fullWidth = false,
    textWrap = false,
    disabled = false,
    link = "",
    openInNewTab = false,
    ariaLabel,
    onClick,
    ...restProps
}: DrawLiquidButtonProps) {
    const selectedFont = fontFamily?.fontFamily || "sans-serif"
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        injectGlobalStyles()
    }, [])

    const activeLineColor =
        themePreset === "custom"
            ? lineColor
            : themePreset === "pink"
              ? "#b80058"
              : themePreset === "blue"
                ? "#0055ff"
                : "#00135c"

    const activeBackColor =
        themePreset === "custom"
            ? backColor
            : themePreset === "pink"
              ? "#ffecf6"
              : themePreset === "blue"
                ? "#e9ecff"
                : "#defffa"

    const isLink = Boolean(link && link.trim() !== "") && !disabled
    const ElementTag: "a" | "button" = isLink ? "a" : "button"

    const handleAction = useCallback(
        (e: React.MouseEvent | React.KeyboardEvent) => {
            if (disabled) {
                e.preventDefault()
                return
            }
            if (!isLink && e.type === "click") {
                e.preventDefault()
            }
            if (onClick) onClick(e)
        },
        [onClick, isLink, disabled]
    )

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
                if (!isLink) e.preventDefault()
                handleAction(e)
            }
        },
        [handleAction, isLink]
    )

    const elementProps = isLink
        ? {
              href: link,
              target: openInNewTab ? "_blank" : undefined,
              rel: openInNewTab ? "noopener noreferrer" : undefined,
          }
        : {
              type: "button" as const,
              disabled: disabled,
          }

    // 1. STATIC FALLBACK FOR FRAMER CANVAS & EXPORTS
    if (isStatic) {
        return (
            <div
                className={`draw-liquid-wrapper ${fullWidth ? "full-width" : ""}`}
                {...restProps}
            >
                <ElementTag
                    {...elementProps}
                    aria-label={ariaLabel || text}
                    style={{
                        padding: padding,
                        fontSize: `${fontSize}px`,
                        fontWeight: fontWeight,
                        fontFamily: selectedFont,
                        color: activeLineColor,
                        backgroundColor: "transparent",
                        border: `3px solid ${activeLineColor}`,
                        borderRadius: "300px",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "56px",
                        boxSizing: "border-box",
                        letterSpacing: "2px",
                        cursor: disabled ? "not-allowed" : "pointer",
                        opacity: disabled ? 0.5 : 1,
                        whiteSpace: textWrap ? "normal" : "nowrap",
                        width: fullWidth ? "100%" : "auto",
                        textAlign: "center",
                    }}
                >
                    {text}
                </ElementTag>
            </div>
        )
    }

    // 2. INTERACTIVE RUNTIME RENDER
    return (
        <div
            className={`draw-liquid-wrapper ${fullWidth ? "full-width" : ""}`}
            {...restProps}
        >
            <ElementTag
                {...elementProps}
                aria-label={ariaLabel || text}
                className={`draw-liquid-btn theme-${themePreset} ${disabled ? "is-disabled" : ""}`}
                onClick={handleAction}
                onKeyDown={handleKeyDown}
                style={
                    {
                        padding: padding,
                        fontSize: `${fontSize}px`,
                        fontWeight: fontWeight,
                        fontFamily: selectedFont,
                        "--draw-line-color": activeLineColor,
                        "--draw-back-color": activeBackColor,
                        "--draw-btn-height": "56px",
                        "--draw-size": `${drawThickness}px`,
                        "--draw-radius": `${drawThickness / 2}px`,
                        "--draw-hover-spacing": `${hoverLetterSpacing}px`,
                        "--draw-text-wrap": textWrap ? "normal" : "nowrap",
                        width: fullWidth ? "100%" : "auto",
                    } as React.CSSProperties
                }
            >
                <div className="draw-liquid-line" />
                <div className="draw-liquid-line" />
                <span className="draw-liquid-text">{text}</span>
                <div className="draw-liquid-draw1" />
                <div className="draw-liquid-draw2" />
            </ElementTag>
        </div>
    )
}

addPropertyControls(DrawLiquidButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "ENTRY",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        hidden(props) {
            return !props.link
        },
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
    },
    fullWidth: {
        type: ControlType.Boolean,
        title: "Fill Width",
        defaultValue: false,
    },
    textWrap: {
        type: ControlType.Boolean,
        title: "Allow Wrap",
        defaultValue: false,
        description: "Enables multi-line text wrapping for long labels",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "18px 48px",
    },
    drawThickness: {
        type: ControlType.Number,
        title: "Drip Thickness",
        defaultValue: 32,
        min: 16,
        max: 64,
        step: 2,
        displayStepper: true,
    },
    hoverLetterSpacing: {
        type: ControlType.Number,
        title: "Hover Spacing",
        defaultValue: 6,
        min: 0,
        max: 16,
        unit: "px",
    },
    themePreset: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["pink", "blue", "teal", "custom"],
        optionTitles: ["Pink", "Blue", "Teal", "Custom"],
        defaultValue: "teal",
        description: "Made with ❤️ by [@karimsaif](https://x.com/karimsaif0)",
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "#00135c",
        hidden(props) {
            return props.themePreset !== "custom"
        },
    },
    backColor: {
        type: ControlType.Color,
        title: "Fill Color",
        defaultValue: "#defffa",
        hidden(props) {
            return props.themePreset !== "custom"
        },
    },
    fontFamily: {
        type: ControlType.Font,
        title: "Font",
        controls: "font-family",
        defaultValue: { fontFamily: "Inter, sans-serif" },
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 14,
        min: 10,
        max: 32,
        step: 1,
    },
    fontWeight: {
        type: ControlType.Enum,
        title: "Weight",
        options: ["400", "500", "600", "700", "800"],
        optionTitles: ["Regular", "Medium", "SemiBold", "Bold", "ExtraBold"],
        defaultValue: "700",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        description: "Accessible label for screen readers",
    },
})
