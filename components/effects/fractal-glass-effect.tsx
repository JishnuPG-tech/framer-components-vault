// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useMemo, type CSSProperties } from "react"

/**
 * Fractal Glass Background
 *
 * A reeded/fluted glass effect component that creates vertical distortion bands.
 * Best used as a background layer or overlay.
 *
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 500
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
interface FractalGlassProps {
    pattern: "columns" | "rows" | "grid"
    columnCount: number
    rowCount: number
    opacity: number
    blur: number
    glassColor: string
    blendMode:
        | "normal"
        | "multiply"
        | "screen"
        | "overlay"
        | "soft-light"
        | "hard-light"
    isLoading: boolean
    loadingSpeed: number
    image?: { src: string; srcSet?: string; alt?: string }
    style?: CSSProperties
}

export default function FractalGlass(props: FractalGlassProps) {
    const {
        pattern = "columns",
        columnCount = 12,
        rowCount = 12,
        opacity = 0.8,
        blur = 10,
        glassColor = "rgba(10, 30, 80, 0.4)",
        blendMode = "overlay",
        isLoading = false,
        loadingSpeed = 2,
        image,
        style,
    } = props

    // Generate elements for the glass effect
    const elements = useMemo(() => {
        const isRows = pattern === "rows"
        const isGrid = pattern === "grid"

        const cols = Math.max(1, Math.floor(columnCount))
        const rows = Math.max(1, Math.floor(rowCount))
        const count = isGrid ? cols * rows : isRows ? rows : cols

        return Array.from({ length: count }).map((_, i) => {
            const style: CSSProperties = {
                flex: 1,
                width: "100%",
                height: "100%",
                backdropFilter: `blur(${blur}px)`,
                WebkitBackdropFilter: `blur(${blur}px)`,
            }

            if (isRows) {
                style.background = `linear-gradient(180deg, 
                    rgba(255,255,255,0.1) 0%, 
                    rgba(255,255,255,0.0) 20%, 
                    rgba(0,0,0,0.05) 50%, 
                    rgba(0,0,0,0.1) 80%, 
                    rgba(255,255,255,0.1) 100%)`
                style.borderBottom = "1px solid rgba(255,255,255,0.1)"
                style.borderTop = "1px solid rgba(255,255,255,0.05)"
                style.boxShadow = "inset 0 1px 2px rgba(255,255,255,0.1)"
            } else if (isGrid) {
                style.background = `linear-gradient(135deg, 
                    rgba(255,255,255,0.1) 0%, 
                    rgba(255,255,255,0.0) 20%, 
                    rgba(0,0,0,0.05) 50%, 
                    rgba(0,0,0,0.1) 80%, 
                    rgba(255,255,255,0.1) 100%)`
                style.border = "1px solid rgba(255,255,255,0.1)"
                style.boxShadow = "inset 1px 1px 2px rgba(255,255,255,0.1)"
            } else {
                // Columns
                style.background = `linear-gradient(90deg, 
                    rgba(255,255,255,0.1) 0%, 
                    rgba(255,255,255,0.0) 20%, 
                    rgba(0,0,0,0.05) 50%, 
                    rgba(0,0,0,0.1) 80%, 
                    rgba(255,255,255,0.1) 100%)`
                style.borderRight = "1px solid rgba(255,255,255,0.1)"
                style.borderLeft = "1px solid rgba(255,255,255,0.05)"
                style.boxShadow = "inset 1px 0 2px rgba(255,255,255,0.1)"
            }

            if (isLoading) {
                style.animation = `fractal-glass-pulse ${loadingSpeed}s ease-in-out infinite`
                const delay = isGrid
                    ? (Math.floor(i / cols) + (i % cols)) * 0.1
                    : i * 0.1
                style.animationDelay = `${delay}s`
            }

            return <div key={i} style={style} />
        })
    }, [pattern, columnCount, rowCount, blur, isLoading, loadingSpeed])

    const containerStyle: CSSProperties = {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: glassColor,
        opacity: opacity,
        mixBlendMode: blendMode,
        zIndex: 1,
        pointerEvents: "none",
        display: pattern === "grid" ? "grid" : "flex",
        flexDirection: pattern === "rows" ? "column" : "row",
        ...(pattern === "grid"
            ? {
                  gridTemplateColumns: `repeat(${Math.max(1, Math.floor(columnCount))}, 1fr)`,
                  gridTemplateRows: `repeat(${Math.max(1, Math.floor(rowCount))}, 1fr)`,
              }
            : {}),
    }

    return (
        <div
            style={{
                ...style,
                width: style?.width || "500px",
                height: style?.height || "500px",
                minWidth: "500px",
                minHeight: "500px",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {image && (
                <img
                    src={image.src}
                    srcSet={image.srcSet}
                    alt={image.alt || ""}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        zIndex: 0,
                    }}
                />
            )}
            {isLoading && (
                <style>
                    {`
                    @keyframes fractal-glass-pulse {
                        0% { opacity: 0.3; }
                        50% { opacity: 1; }
                        100% { opacity: 0.3; }
                    }
                    `}
                </style>
            )}
            {/* Glass Layer */}
            <div style={containerStyle}>{elements}</div>
        </div>
    )
}

addPropertyControls(FractalGlass, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image Fill",
    },
    pattern: {
        type: ControlType.Enum,
        title: "Pattern",
        options: ["columns", "rows", "grid"],
        optionTitles: ["Columns", "Rows", "Grid"],
        defaultValue: "columns",
    },
    columnCount: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 12,
        min: 2,
        max: 50,
        step: 1,
        hidden: (props) => props.pattern === "rows",
    },
    rowCount: {
        type: ControlType.Number,
        title: "Rows",
        defaultValue: 12,
        min: 2,
        max: 50,
        step: 1,
        hidden: (props) => props.pattern === "columns",
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 10,
        min: 0,
        max: 50,
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.05,
    },
    glassColor: {
        type: ControlType.Color,
        title: "Glass Tint",
        defaultValue: "rgba(10, 30, 80, 0.2)",
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Blend Mode",
        defaultValue: "hard-light",
        options: [
            "normal",
            "multiply",
            "screen",
            "overlay",
            "soft-light",
            "hard-light",
        ],
    },
    isLoading: {
        type: ControlType.Boolean,
        title: "Loading",
        defaultValue: false,
    },
    loadingSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 2,
        min: 0.5,
        max: 5,
        step: 0.1,
        hidden: (props) => !props.isLoading,
    },
})
