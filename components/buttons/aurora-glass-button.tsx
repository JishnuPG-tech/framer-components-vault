import React, { useState } from "react"
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
 * Aurora Glass Button
 * A stunning glassmorphic button with vibrant gradient and animated cloud effects
 *
 * @framerIntrinsicWidth 320
 * @framerIntrinsicHeight 96
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function AuroraGlassButton(props) {
    const {
        text,
        showEmoji,
        emoji,
        onClick,
        link,
        openInNewTab,
        fontFamily,
        fontSize,
        textColor,
        primaryColor,
        secondaryColor,
        accentColor,
        borderRadius,
    } = props

    const [isHovered, setIsHovered] = useState(false)

    const containerWidth = props.style?.width || 320
    const containerHeight = props.style?.height || 96

    const scaleX = typeof containerWidth === "number" ? containerWidth / 320 : 1
    const scaleY =
        typeof containerHeight === "number" ? containerHeight / 96 : 1

    const resolvedFontFamily = () => {
        if (!fontFamily)
            return { family: "Inter", weight: 600, style: "normal" }
        if (typeof fontFamily === "string")
            return { family: fontFamily, weight: 600, style: "normal" }
        return {
            family: fontFamily.fontFamily || "Inter",
            weight: fontFamily.fontWeight || fontFamily.weight || 600,
            style: fontFamily.fontStyle || "normal",
        }
    }

    const resolvedFont = resolvedFontFamily()
    const fontFamilyName = resolvedFont.family
    const fontWeightValue = resolvedFont.weight
    const fontStyleValue = resolvedFont.style

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (onClick) onClick(e)
        if (link) {
            if (openInNewTab) {
                window.open(link, "_blank", "noopener,noreferrer")
            } else {
                window.location.href = link
            }
        }
    }

    const buttonStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
        borderTop: `${2 * scaleY}px double #ffffff92`,
        borderBottom: "none",
        borderLeft: `${2 * scaleX}px outset #0000007e`,
        borderRight: `${2 * scaleX}px solid #e94fcab3`,
        borderRadius: `${borderRadius * Math.min(scaleX, scaleY)}px`,
        backgroundOrigin: "border-box",
        backgroundClip: "content-box, border-box",
        filter: isHovered
            ? "hue-rotate(-365deg) drop-shadow(0px 30px 10px #00000028) saturate(2)"
            : "hue-rotate(-15deg) drop-shadow(0px 30px 10px #00000028) saturate(2)",
        background: `linear-gradient(
            64.14deg,
            ${primaryColor} 0%,
            #5b8ef7 10%,
            ${secondaryColor} 25%,
            #a78ff7 40%,
            #b87cf6 50%,
            #c96ff5 60%,
            ${accentColor} 75%,
            #f060a8 85%,
            #ea5ba3 92%,
            ${primaryColor} 100%
        )`,
        transition: "all 0.5s ease",
        transform: isHovered ? "scale(1.1)" : "scale(1)",
        boxSizing: "border-box",
    }

    const glassStyle: React.CSSProperties = {
        zIndex: 10,
        position: "absolute",
        inset: `${4 * scaleY}px`,
        display: "flex",
        border: `double ${2 * Math.min(scaleX, scaleY)}px rgba(255, 255, 255, 0.263)`,
        backdropFilter: "blur(2px)",
        filter: "blur(1px) brightness(1.1) saturate(50%) hue-rotate(30deg)",
        borderRadius: `${(borderRadius - 3) * Math.min(scaleX, scaleY)}px`,
        width: `calc(100% - ${8 * scaleY}px)`,
        height: `calc(100% - ${8 * scaleY}px)`,
        padding: `${16 * Math.min(scaleX, scaleY)}px`,
        backgroundColor: "#ffffff1c",
        backgroundOrigin: "content-box",
        backgroundClip: "content-box, border-box",
        boxShadow: "inset 0 0 10px #a84fd88d",
    }

    const innerGlassStyle: React.CSSProperties = {
        zIndex: 10,
        display: "flex",
        borderLeft: "1px solid rgba(255, 255, 255, 0.564)",
        borderRight: "1px solid rgb(255, 255, 255)",
        backdropFilter: "blur(40px)",
        boxShadow: "inset 0 0 20px rgba(246, 142, 213, 0.86)",
        WebkitBackdropFilter: "blur(5px)",
        borderRadius: `${(borderRadius - 19) * Math.min(scaleX, scaleY)}px`,
        width: "100%",
        height: "100%",
        backgroundOrigin: "border-box",
        backgroundClip: "content-box, border-box",
        filter: "brightness(140%)",
    }

    const titleStyle: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        display: "flex",
        textAlign: "center",
        width: "100%",
        height: "100%",
        zIndex: 90,
        alignItems: "center",
        justifyContent: "center",
        color: textColor,
        fontFamily: fontFamilyName,
        fontWeight: fontWeightValue,
        fontStyle: fontStyleValue,
        fontSize: `${fontSize * Math.min(scaleX, scaleY)}px`,
        gap: `${8 * Math.min(scaleX, scaleY)}px`,
    }

    const thunderStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        filter: "grayscale(100%) brightness(0)",
        fontSize: `${fontSize * 1.2 * Math.min(scaleX, scaleY)}px`,
    }

    const descriptionStyle: React.CSSProperties = {
        fontSize: isHovered
            ? `${1.2 * fontSize * Math.min(scaleX, scaleY)}px`
            : `${fontSize * Math.min(scaleX, scaleY)}px`,
        fontWeight: isHovered ? 800 : fontWeightValue,
        transition: "all 0.8s ease",
    }

    const smokeStyle: React.CSSProperties = {
        zIndex: 90,
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
    }

    // Invisible sizing helper — prevents collapse in Fit Content, no user control
    const sizingHelperStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: `${8 * Math.min(scaleX, scaleY)}px`,
        padding: "32px 48px", // Fixed inner space — matches your original design
        opacity: 0,
        pointerEvents: "none",
    }

    const clouds = [
        {
            filter: "blur(3px) drop-shadow(-2px 0 3px #ffffff)",
            left: `${25.6 * scaleX}px`,
            top: `${3.2 * scaleY}px`,
            width: `${160 * scaleX}px`,
            height: `${16 * scaleY}px`,
            background:
                "linear-gradient(to right, rgba(255, 255, 255, 0.868) 30%, transparent 100%)",
        },
        {
            left: `${40 * scaleX}px`,
            top: `${32 * scaleY}px`,
            width: `${64 * scaleX}px`,
            height: `${32 * scaleY}px`,
            background:
                "radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 70%)",
            filter: "drop-shadow(-10px 10px 3px #d277cc)",
        },
        {
            left: `${160 * scaleX}px`,
            top: `${8 * scaleY}px`,
            width: `${80 * scaleX}px`,
            height: `${80 * scaleY}px`,
            background:
                "radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 50%)",
            filter: "drop-shadow(-5px -5px 7px #ff5500b4)",
        },
        {
            left: `${272 * scaleX}px`,
            top: `${16 * scaleY}px`,
            width: `${54.4 * scaleX}px`,
            height: `${64 * scaleY}px`,
            background:
                "radial-gradient(circle, rgba(255, 255, 255, 1) 0%, transparent 70%)",
            filter: "drop-shadow(-1px 0 30px #ff002f)",
        },
        {
            top: `${8 * scaleY}px`,
            width: "100%",
            height: `${11.2 * scaleY}px`,
            background:
                "radial-gradient(circle, rgba(255, 255, 255, 0.293) 30%, rgba(255, 181, 21, 0.164) 50%, rgba(234, 44, 255, 0.419) 60%, rgba(255, 255, 255, 0) 90%)",
        },
        {
            left: `${281.6 * scaleX}px`,
            top: `${-1.6 * scaleY}px`,
            width: `${32 * scaleX}px`,
            height: `${32 * scaleY}px`,
            background:
                "radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 70%)",
        },
        {
            left: `${121.6 * scaleX}px`,
            transform: "rotate(-35deg)",
            top: `${-32 * scaleY}px`,
            width: `${32 * scaleX}px`,
            height: `${80 * scaleY}px`,
            background:
                "radial-gradient(circle, rgba(255, 255, 255, 0.614) 0%, #fd87602d 60%, rgba(255, 255, 255, 0) 100%)",
        },
        {
            left: `${88 * scaleX}px`,
            top: `${-16 * scaleY}px`,
            width: `${48 * scaleX}px`,
            height: `${48 * scaleY}px`,
            background:
                "radial-gradient(circle, rgba(255, 255, 255, 0.614) 0%, rgba(255, 255, 255, 0) 80%)",
        },
        {
            filter: "blur(1px) drop-shadow(0px 0 3px #ffffff)",
            left: `${8 * scaleX}px`,
            bottom: `${22.4 * scaleY}px`,
            width: "100%",
            height: `${1.6 * scaleY}px`,
            background:
                "radial-gradient(circle, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0) 90%)",
        },
        {
            filter: "blur(1px) drop-shadow(0px 0 3px #ffffff)",
            left: `${4.8 * scaleX}px`,
            top: `${16 * scaleY}px`,
            width: `${16 * scaleX}px`,
            height: `${48 * scaleY}px`,
            borderTop: "1px solid white",
            borderRight: "1px solid white",
            background:
                "linear-gradient(to bottom, rgba(255, 255, 255, 0.419) 0%, transparent 50%)",
        },
        {
            borderRadius: "100%",
            filter: "blur(4px) drop-shadow(0px -10px 10px #ff5107fb)",
            left: `${192 * scaleX}px`,
            top: `${56 * scaleY}px`,
            width: `${80 * scaleX}px`,
            height: `${28.8 * scaleY}px`,
            background:
                "radial-gradient(circle, rgba(255, 255, 255, 0.773) 10%, rgba(255, 255, 255, 0.159) 60%)",
        },
        {
            filter: "blur(2px) drop-shadow(0px -10px 10px #f36b9d)",
            left: `${176 * scaleX}px`,
            top: `${17.6 * scaleY}px`,
            width: `${96 * scaleX}px`,
            height: `${4.8 * scaleY}px`,
            background:
                "radial-gradient(circle, rgba(255, 255, 255, 0.973) 30%, rgba(255, 255, 255, 0.159) 100%)",
        },
        {
            filter: "blur(3px) drop-shadow(-15px 0 5px #f8283d9e)",
            left: `${128 * scaleX}px`,
            top: `${59.2 * scaleY}px`,
            width: `${88 * scaleX}px`,
            height: `${27.2 * scaleY}px`,
            background:
                "radial-gradient(circle, rgba(255, 255, 255, 0.762) 10%, rgba(255, 255, 255, 0.159) 70%)",
        },
        {
            filter: "blur(1px) drop-shadow(10px -10px 10px #6f0424)",
            transform: "rotate(-35deg)",
            left: `${8 * scaleX}px`,
            bottom: `${4.8 * scaleY}px`,
            width: `${8 * scaleX}px`,
            height: `${19.2 * scaleY}px`,
            background:
                "radial-gradient(circle, rgba(255, 255, 255, 0.848) 0%, rgba(255, 255, 255, 0.159) 60%)",
        },
    ]

    return (
        <button
            type="button"
            style={buttonStyle}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Invisible helper — prevents collapse in Fit Content */}
            <div style={sizingHelperStyle}>
                {showEmoji && <span style={thunderStyle}>{emoji}</span>}
                <strong style={descriptionStyle}>{text}</strong>
            </div>

            <div style={smokeStyle}>
                {clouds.map((cloud, index) => (
                    <div
                        key={index}
                        style={{
                            position: "absolute",
                            borderRadius: "9999px",
                            ...cloud,
                        }}
                    />
                ))}
            </div>

            <div style={titleStyle}>
                {showEmoji && <span style={thunderStyle}>{emoji}</span>}
                <strong style={descriptionStyle}>{text}</strong>
            </div>

            <div style={glassStyle}>
                <div style={innerGlassStyle}></div>
            </div>
        </button>
    )
}

AuroraGlassButton.defaultProps = {
    text: "Join now",
    showEmoji: true,
    emoji: "⚡",
    fontFamily: { fontFamily: "Inter", fontWeight: 600, fontStyle: "normal" },
    fontSize: 20,
    textColor: "#000000",
    primaryColor: "#3b82f6",
    secondaryColor: "#8b5cf6",
    accentColor: "#ec4899",
    borderRadius: 28,
    link: "",
    openInNewTab: true,
}

addPropertyControls(AuroraGlassButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Join now",
    },
    showEmoji: {
        type: ControlType.Boolean,
        title: "Show Emoji",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    emoji: {
        type: ControlType.String,
        title: "Emoji",
        defaultValue: "⚡",
        hidden: (props) => !props.showEmoji,
    },
    fontFamily: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 600,
            fontStyle: "normal",
        },
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        min: 12,
        max: 48,
        step: 1,
        defaultValue: 20,
        displayStepper: true,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#3b82f6",
    },
    secondaryColor: {
        type: ControlType.Color,
        title: "Secondary Color",
        defaultValue: "#8b5cf6",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#ec4899",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 28,
        displayStepper: true,
    },
    link: {
        type: ControlType.String,
        title: "Link",
        placeholder: "https://example.com",
        defaultValue: "",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "Open in New Tab",
        defaultValue: true,
        enabledTitle: "New Tab",
        disabledTitle: "Same Tab",
        hidden: (props) => !props.link || props.link === "",
    },
    onClick: {
        type: ControlType.EventHandler,
    },
})
