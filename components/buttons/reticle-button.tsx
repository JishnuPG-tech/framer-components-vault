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


/**
 * Frame Link Button
 *
 * A button with animated "targeting frame" corners and dashed guide
 * lines that draw in on hover, plus a subtle grid-pattern reveal.
 *
 * Per Framer's guidelines, all animation (the hover-driven CSS
 * keyframes) is disabled in static contexts — the Canvas and
 * exports — via useIsStaticRenderer, falling back to a plain,
 * non-animated styled button in those cases.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 220
 * @framerIntrinsicHeight 56
 */
export default function ReticleButton(props) {
    const {
        text,
        font,
        textColor,
        hoverTextColor,
        backgroundColor,
        hoverBackgroundColor,
        dotColor,
        lineColor,
        gridColor,
        borderWidth,
        lineWeight,
        cornerRadius,
        padding,
        frameGap,
        animationSpeed,
        dotSize,
        showIcon,
        iconImage,
        iconSize,
        iconGap,
        link,
        newTab,
        onTap,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const { fontFamily, fontWeight, fontSize } = font || {}

    const imageSrc = iconImage
        ? typeof iconImage === "string"
            ? iconImage
            : iconImage.src
        : null

    const linkProps = link
        ? { href: link, target: newTab ? "_blank" : "_self", rel: "noopener" }
        : { role: "button", tabIndex: 0 }

    // When there's no link, this element behaves as a button but is still
    // an <a> under the hood (kept stable to avoid remounting the component
    // when Link is toggled). Native <a> elements don't activate on
    // Enter/Space the way <button> does, so we add that behavior manually.
    function handleKeyDown(e) {
        if (link) return
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
            e.preventDefault()
            if (onTap) {
                onTap(e)
            } else {
                e.currentTarget.click()
            }
        }
    }

    const icon = showIcon ? (
        <span
            style={{
                marginLeft: iconGap,
                width: iconSize,
                height: iconSize,
                display: "flex",
                flexShrink: 0,
            }}
        >
            {imageSrc ? (
                <img
                    src={imageSrc}
                    alt=""
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                    }}
                />
            ) : (
                <svg
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    width="100%"
                    height="100%"
                    style={{
                        stroke: "currentColor",
                        fill: "currentColor",
                        strokeWidth: 1,
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        opacity: 0.7,
                    }}
                >
                    <path d="M17.6744 11.4075L15.7691 17.1233C15.7072 17.309 15.5586 17.4529 15.3709 17.5087L3.69348 20.9803C3.22819 21.1186 2.79978 20.676 2.95328 20.2155L6.74467 8.84131C6.79981 8.67588 6.92419 8.54263 7.08543 8.47624L12.472 6.25822C12.696 6.166 12.9535 6.21749 13.1248 6.38876L17.5294 10.7935C17.6901 10.9542 17.7463 11.1919 17.6744 11.4075Z" />
                    <path d="M3.2959 20.6016L9.65986 14.2376" />
                    <path d="M17.7917 11.0557L20.6202 8.22724C21.4012 7.44619 21.4012 6.17986 20.6202 5.39881L18.4989 3.27749C17.7178 2.49645 16.4515 2.49645 15.6704 3.27749L12.842 6.10592" />
                    <path d="M11.7814 12.1163C11.1956 11.5305 10.2458 11.5305 9.66004 12.1163C9.07426 12.7021 9.07426 13.6519 9.66004 14.2376C10.2458 14.8234 11.1956 14.8234 11.7814 14.2376C12.3671 13.6519 12.3671 12.7021 11.7814 12.1163Z" />
                </svg>
            )}
        </span>
    ) : null

    // ---- Static context (Canvas / export): plain, non-animated fallback ----
    if (isStatic) {
        return (
            <a
                {...linkProps}
                onKeyDown={handleKeyDown}
                style={{
                    position: "relative",
                    display: "inline-flex",
                    boxSizing: "border-box",
                    textDecoration: "none",
                    ...style,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding,
                        borderRadius: cornerRadius,
                        background: backgroundColor,
                        color: textColor,
                        border: `${borderWidth}px solid ${gridColor}`,
                        textTransform: "capitalize",
                        fontFamily,
                        fontWeight,
                        fontSize,
                        boxSizing: "border-box",
                    }}
                >
                    <span style={{ whiteSpace: "pre" }}>{text}</span>
                    {icon}
                </div>
            </a>
        )
    }

    // ---- Live (Preview / published site): full interactive version ----
    const wrapperStyle = {
        "--dot-size": `${dotSize}px`,
        "--line-weight": `${lineWeight}px`,
        "--frame-gap": `${frameGap}px`,
        "--animation-speed": `${animationSpeed}s`,
        "--dot-color": dotColor,
        "--line-color": lineColor,
        "--grid-color": gridColor,
        "--border-width": `${borderWidth}px`,
        "--btn-bg": backgroundColor,
        "--btn-color": textColor,
        "--btn-hover-bg": hoverBackgroundColor,
        "--btn-hover-color": hoverTextColor,
        position: "relative",
        display: "inline-flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "var(--frame-gap)",
        boxSizing: "border-box",
        userSelect: "none",
        textDecoration: "none",
        ...style,
    }

    return (
        <a
            {...linkProps}
            onClick={onTap}
            onKeyDown={handleKeyDown}
            className="fl-btn-wrapper"
            style={wrapperStyle}
        >
            <style>{`
                .fl-btn-wrapper::after {
                    content: "";
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    border-radius: inherit;
                    pointer-events: none;
                    background-image: repeating-linear-gradient(45deg, var(--grid-color) 0 1px, transparent 2px 5px);
                    opacity: 0;
                    z-index: -1;
                }
                .fl-btn-wrapper:has(.fl-btn:hover)::after {
                    animation: fl-opacity calc(var(--animation-speed) * 4) ease-in-out forwards;
                }
                @keyframes fl-opacity {
                    80% { opacity: 0; }
                    100% { opacity: 1; }
                }
                .fl-btn-wrapper .fl-btn {
                    position: relative;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: var(--btn-bg);
                    color: var(--btn-color);
                    border: var(--border-width) solid var(--grid-color);
                    text-transform: capitalize;
                    cursor: pointer;
                    transition: transform .2s ease-in-out, letter-spacing .2s ease-in-out, background .2s ease-in-out, color .2s ease-in-out;
                    letter-spacing: -0.01em;
                }
                .fl-btn-wrapper .fl-btn:hover {
                    background: var(--btn-hover-bg);
                    color: var(--btn-hover-color);
                    transform: scale(1.05);
                    letter-spacing: .06em;
                }
                .fl-btn-wrapper .fl-btn:active {
                    background: var(--btn-hover-bg);
                    transform: scale(.98);
                    letter-spacing: .02em;
                }
                .fl-btn-wrapper .fl-dot {
                    position: absolute;
                    width: var(--dot-size);
                    aspect-ratio: 1;
                    border-radius: 2px;
                    background-color: var(--dot-color);
                    transition: all .3s ease-in-out;
                    opacity: 0;
                }
                .fl-btn-wrapper:has(.fl-btn:hover) .fl-dot.top.left {
                    top: 50%; left: 20%;
                    animation: fl-move-top-left var(--animation-speed) ease-in-out forwards;
                }
                @keyframes fl-move-top-left {
                    90% { opacity: .6; }
                    100% { top: calc(var(--dot-size) * -0.5); left: calc(var(--dot-size) * -0.5); opacity: 1; }
                }
                .fl-btn-wrapper:has(.fl-btn:hover) .fl-dot.top.right {
                    top: 50%; right: 20%;
                    animation: fl-move-top-right var(--animation-speed) ease-in-out forwards;
                    animation-delay: calc(var(--animation-speed)*.6);
                }
                @keyframes fl-move-top-right {
                    80% { opacity: .6; }
                    100% { top: calc(var(--dot-size) * -0.5); right: calc(var(--dot-size) * -0.5); opacity: 1; }
                }
                .fl-btn-wrapper:has(.fl-btn:hover) .fl-dot.bottom.right {
                    bottom: 50%; right: 20%;
                    animation: fl-move-bottom-right var(--animation-speed) ease-in-out forwards;
                    animation-delay: calc(var(--animation-speed)*1.2);
                }
                @keyframes fl-move-bottom-right {
                    80% { opacity: .6; }
                    100% { bottom: calc(var(--dot-size) * -0.5); right: calc(var(--dot-size) * -0.5); opacity: 1; }
                }
                .fl-btn-wrapper:has(.fl-btn:hover) .fl-dot.bottom.left {
                    bottom: 50%; left: 20%;
                    animation: fl-move-bottom-left var(--animation-speed) ease-in-out forwards;
                    animation-delay: calc(var(--animation-speed)*1.8);
                }
                @keyframes fl-move-bottom-left {
                    80% { opacity: .6; }
                    100% { bottom: calc(var(--dot-size) * -0.5); left: calc(var(--dot-size) * -0.5); opacity: 1; }
                }
                .fl-btn-wrapper .fl-line { position: absolute; transition: all .3s ease-in-out; }
                .fl-btn-wrapper .fl-line.horizontal {
                    height: var(--line-weight); width: 100%;
                    background-image: repeating-linear-gradient(90deg, transparent 0 calc(var(--line-weight)*2), var(--line-color) calc(var(--line-weight)*2) calc(var(--line-weight)*4));
                }
                .fl-btn-wrapper .fl-line.top {
                    top: calc(var(--line-weight)*-0.5);
                    transform-origin: top left;
                    transform: rotate(5deg) scaleX(0);
                }
                .fl-btn-wrapper:has(.fl-btn:hover) .fl-line.top {
                    animation: fl-draw-x var(--animation-speed) ease-in-out forwards;
                    animation-delay: calc(var(--animation-speed)*.8);
                }
                .fl-btn-wrapper .fl-line.bottom {
                    bottom: calc(var(--line-weight)*-0.5);
                    transform-origin: bottom right;
                    transform: rotate(5deg) scaleX(0);
                }
                .fl-btn-wrapper:has(.fl-btn:hover) .fl-line.bottom {
                    animation: fl-draw-x var(--animation-speed) ease-in-out forwards;
                    animation-delay: calc(var(--animation-speed)*2);
                }
                @keyframes fl-draw-x { 100% { transform: rotate(0deg) scaleX(1); } }
                .fl-btn-wrapper .fl-line.vertical {
                    width: var(--line-weight); height: 100%;
                    background-image: repeating-linear-gradient(0deg, transparent 0 calc(var(--line-weight)*2), var(--line-color) calc(var(--line-weight)*2) calc(var(--line-weight)*4));
                }
                .fl-btn-wrapper .fl-line.left {
                    left: calc(var(--line-weight)*-0.5);
                    transform-origin: bottom left;
                    transform: rotate(0deg) scaleY(0);
                }
                .fl-btn-wrapper:has(.fl-btn:hover) .fl-line.left {
                    animation: fl-draw-y var(--animation-speed) ease-in-out forwards;
                    animation-delay: calc(var(--animation-speed)*2.4);
                }
                .fl-btn-wrapper .fl-line.right {
                    right: calc(var(--line-weight)*-0.5);
                    transform-origin: top right;
                    transform: rotate(5deg) scaleY(0);
                }
                .fl-btn-wrapper:has(.fl-btn:hover) .fl-line.right {
                    animation: fl-draw-y var(--animation-speed) ease-in-out forwards;
                    animation-delay: calc(var(--animation-speed)*1.4);
                }
                @keyframes fl-draw-y { 100% { transform: rotate(0deg) scaleY(1); } }
            `}</style>

            <div className="fl-line horizontal top" />
            <div className="fl-line vertical right" />
            <div className="fl-line horizontal bottom" />
            <div className="fl-line vertical left" />

            <div className="fl-dot top left" />
            <div className="fl-dot top right" />
            <div className="fl-dot bottom right" />
            <div className="fl-dot bottom left" />

            <div
                className="fl-btn"
                style={{
                    padding,
                    borderRadius: cornerRadius,
                    fontFamily,
                    fontWeight,
                    fontSize,
                }}
            >
                <span style={{ whiteSpace: "pre" }}>{text}</span>
                {icon}
            </div>
        </a>
    )
}

ReticleButton.defaultProps = {
    text: "Start Creating",
    textColor: "rgba(255,255,255,0.87)",
    hoverTextColor: "#ffffff",
    backgroundColor: "rgba(255,255,255,0)",
    hoverBackgroundColor: "#25358b",
    dotColor: "rgba(255,255,255,0.67)",
    lineColor: "rgba(255,255,255,0.67)",
    gridColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    lineWeight: 1,
    cornerRadius: 6,
    padding: "13px 20px",
    frameGap: 14,
    animationSpeed: 0.35,
    dotSize: 8,
    showIcon: true,
    iconSize: 24,
    iconGap: 8,
    link: "",
    newTab: false,
    font: {
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        fontWeight: 600,
        fontSize: 16,
    },
}

addPropertyControls(ReticleButton, {
    text: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Start Creating",
    },
    font: {
        type: ControlType.Font,
        title: "Typography",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
            fontWeight: 600,
            fontSize: 16,
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "rgba(255,255,255,0.87)",
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text Color",
        defaultValue: "#ffffff",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(255,255,255,0)",
    },
    hoverBackgroundColor: {
        type: ControlType.Color,
        title: "Hover Background",
        defaultValue: "#25358b",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "rgba(255,255,255,0.67)",
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        min: 2,
        max: 20,
        defaultValue: 8,
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "rgba(255,255,255,0.67)",
    },
    lineWeight: {
        type: ControlType.Number,
        title: "Line Width",
        min: 1,
        max: 6,
        defaultValue: 1,
    },
    gridColor: {
        type: ControlType.Color,
        title: "Border / Grid Color",
        defaultValue: "rgba(255,255,255,0.2)",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        min: 0,
        max: 8,
        defaultValue: 1,
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Show Icon",
        defaultValue: true,
    },
    iconImage: {
        type: ControlType.Image,
        title: "Icon Image",
        hidden: (props) => !props.showIcon,
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        min: 8,
        max: 64,
        defaultValue: 24,
        hidden: (props) => !props.showIcon,
    },
    iconGap: {
        type: ControlType.Number,
        title: "Icon Gap",
        min: 0,
        max: 60,
        defaultValue: 8,
        hidden: (props) => !props.showIcon,
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    newTab: {
        type: ControlType.Boolean,
        title: "Open In New Tab",
        defaultValue: false,
        hidden: (props) => !props.link,
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 40,
        defaultValue: 6,
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "13px 20px",
    },
    frameGap: {
        type: ControlType.Number,
        title: "Frame Gap",
        min: 0,
        max: 40,
        defaultValue: 14,
        description: "Space around the button where the corner marks sit",
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Anim. Speed",
        min: 0.1,
        max: 1.5,
        step: 0.05,
        defaultValue: 0.35,
        unit: "s",
    },
})
