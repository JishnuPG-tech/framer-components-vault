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


export default function KeycapButton(props) {
    const {
        text,
        fontSize,
        fontFamily,
        textColor,
        width,
        height,
        keycapStyle = {},
        layoutPadding = {},
    } = props

    const baseColor = keycapStyle.baseColor ?? "#F2F2F5"
    const topColor = keycapStyle.topColor ?? "#FFFFFF"
    const borderRadius = keycapStyle.borderRadius ?? 36
    const depth = keycapStyle.depth ?? 16

    const pTop = layoutPadding.pTop ?? 24
    const pBottom = layoutPadding.pBottom ?? 32
    const pLeft = layoutPadding.pLeft ?? 40
    const pRight = layoutPadding.pRight ?? 40

    // State Kontrol Interaksi
    const [isPressed, setIsPressed] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)

    // Logika Kedalaman Dinamis
    const hoverLift = isHovered && !isPressed ? 2 : 0
    const currentDepth = isPressed
        ? Math.max(1, depth * 0.1)
        : depth + hoverLift
    const translateY = isPressed ? depth - currentDepth : -hoverLift

    const fontStyles =
        typeof fontFamily === "object" ? fontFamily : { fontFamily: fontFamily }

    // PERBAIKAN CONTAINER: Menggunakan display inline-block agar tidak memakan space kosong di luar komponen
    const containerStyle = {
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        display: "inline-block",
        position: "relative",
        userSelect: "none",
        boxSizing: "border-box",
    }

    const keycapStyleCSS = {
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: baseColor,
        borderRadius: `${borderRadius}px`,
        transform: `translateY(${translateY}px)`,
        transition:
            "transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.14s cubic-bezier(0.34, 1.56, 0.64, 1)",
        cursor: "pointer",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        boxSizing: "border-box",

        // SANGAT BERSIH: Sama sekali tidak ada rgb/rgba bayangan hitam di luar area 3D tombol.
        boxShadow: isPressed
            ? `
                inset 0 4px 8px rgba(0, 0, 0, 0.12),
                inset 0 -2px 6px rgba(255, 255, 255, 0.8),
                0 ${currentDepth}px 0 ${baseColor}
              `
            : `
                inset 0 ${isHovered ? "8px" : "6px"} 8px rgba(255, 255, 255, 1),
                inset 6px 0 10px rgba(255, 255, 255, 0.6),
                inset -6px 0 10px rgba(0, 0, 0, 0.03),
                inset 0 -10px 16px rgba(0, 0, 0, 0.06),
                0 ${currentDepth}px 0 ${baseColor}
              `,
    }

    const dishStyleCSS = {
        position: "relative",
        width: "100%",
        height: "100%",
        margin: "6px",
        borderRadius: `${Math.max(8, borderRadius - 6)}px`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: isHovered
            ? `radial-gradient(circle at 50% 15%, ${topColor} 20%, ${baseColor} 100%)`
            : `radial-gradient(circle at 50% 20%, ${topColor} 0%, ${baseColor} 100%)`,
        boxShadow: isHovered
            ? `
                inset 0 14px 20px rgba(0, 0, 0, 0.06),
                inset 0 -6px 14px rgba(255, 255, 255, 1)
              `
            : `
                inset 0 12px 16px rgba(0, 0, 0, 0.05),
                inset 0 -6px 12px rgba(255, 255, 255, 0.95)
              `,
        paddingTop: `${pTop}px`,
        paddingBottom: `${pBottom}px`,
        paddingLeft: `${pLeft}px`,
        paddingRight: `${pRight}px`,
        boxSizing: "border-box",
        transition: "background 0.14s ease, box-shadow 0.14s ease",
    }

    const textStyleCSS = {
        ...fontStyles,
        fontSize: `${fontSize}px`,
        color: textColor,
        fontWeight: fontStyles.fontWeight ?? "700",
        textAlign: "center",
        lineHeight: 1,
        whiteSpace: "nowrap",
        textShadow: isPressed
            ? "0px -0.5px 0.5px rgba(0, 0, 0, 0.1), 0px 0.5px 1px rgba(255, 255, 255, 0.6)"
            : "0px 0.5px 0.5px rgba(255, 255, 255, 0.9)",
        opacity: isPressed ? 0.75 : 1,
        transform: isPressed
            ? "scale(0.95)"
            : isHovered
              ? "scale(1.02)"
              : "none",
        transition:
            "transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.12s ease",
    }

    return (
        <div style={containerStyle}>
            <div
                style={keycapStyleCSS}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => {
                    setIsHovered(false)
                    setIsPressed(false)
                }}
                onMouseDown={() => setIsPressed(true)}
                onMouseUp={() => setIsPressed(false)}
                onTouchStart={() => setIsPressed(true)}
                onTouchEnd={() => {
                    setIsPressed(false)
                    setIsHovered(false)
                }}
            >
                <div style={dishStyleCSS}>
                    <span style={textStyleCSS}>{text}</span>
                </div>
            </div>
        </div>
    )
}

KeycapButton.defaultProps = {
    text: "go",
    fontSize: 32,
    fontFamily: { fontFamily: "Inter", fontWeight: "700" },
    textColor: "#1C1C1E",
    width: "auto",
    height: "auto",
    keycapStyle: {
        baseColor: "#EBF0F5",
        topColor: "#FFFFFF",
        borderRadius: 38,
        depth: 18,
    },
    layoutPadding: {
        pTop: 24,
        pBottom: 32,
        pLeft: 40,
        pRight: 40,
    },
}

addPropertyControls(KeycapButton, {
    text: {
        type: ControlType.String,
        title: "Legend",
        defaultValue: KeycapButton.defaultProps.text,
    },
    fontFamily: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: KeycapButton.defaultProps.fontFamily,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Size",
        min: 12,
        max: 80,
        defaultValue: KeycapButton.defaultProps.fontSize,
    },
    textColor: {
        type: ControlType.Color,
        title: "Font Color",
        defaultValue: KeycapButton.defaultProps.textColor,
    },

    keycapStyle: {
        type: ControlType.Object,
        title: "Keycap Structure",
        controls: {
            baseColor: {
                type: ControlType.Color,
                title: "Body Tone",
            },
            topColor: {
                type: ControlType.Color,
                title: "Top Shading",
            },
            depth: {
                type: ControlType.Number,
                title: "3D Thickness",
                min: 4,
                max: 40,
                step: 1,
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Roundness",
                min: 8,
                max: 60,
                step: 1,
            },
        },
    },

    layoutPadding: {
        type: ControlType.Object,
        title: "Keycap Padding",
        controls: {
            pTop: {
                type: ControlType.Number,
                title: "Top",
                min: 0,
                max: 100,
            },
            pBottom: {
                type: ControlType.Number,
                title: "Bottom",
                min: 0,
                max: 100,
            },
            pLeft: {
                type: ControlType.Number,
                title: "Left",
                min: 0,
                max: 150,
            },
            pRight: {
                type: ControlType.Number,
                title: "Right",
                min: 0,
                max: 150,
            },
        },
    },
})

KeycapButton.displayName = "Keycap Button"
