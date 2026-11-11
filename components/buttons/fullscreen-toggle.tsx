// Fullscreen toggle button component

import { useState, startTransition, type CSSProperties, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface FullscreenToggleProps {
    iconColor: string
    backgroundColor: string
    borderColor: string
    borderWidth: number
    radius: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function FullscreenToggle(props: FullscreenToggleProps) {
    const {
        iconColor,
        backgroundColor,
        borderColor,
        borderWidth,
        radius,
        style,
    } = props

    const [isFull, setIsFull] = useState(false)
    const [isHovered, setIsHovered] = useState(false)

    // Check if component is in responsive mode (width/height set to 100%)
    const isResponsiveWidth = style?.width === "100%"
    const isResponsiveHeight = style?.height === "100%"

    useEffect(() => {
        if (typeof document === "undefined") return

        const handleFullscreenChange = () => {
            startTransition(() => setIsFull(!!document.fullscreenElement))
        }

        document.addEventListener("fullscreenchange", handleFullscreenChange)
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange)
        }
    }, [])

    const toggleFullScreen = () => {
        if (typeof document === "undefined") return

        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
            startTransition(() => setIsFull(true))
        } else {
            document.exitFullscreen()
            startTransition(() => setIsFull(false))
        }
    }

    return (
        <div
            onClick={toggleFullScreen}
            onMouseEnter={() => startTransition(() => setIsHovered(true))}
            onMouseLeave={() => startTransition(() => setIsHovered(false))}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 24,
                minHeight: 24,
                background: backgroundColor,
                border: `${borderWidth}px solid ${borderColor}`,
                borderRadius: radius,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transform: isHovered ? "scale(1.05)" : "scale(1)",
                opacity: isHovered ? 0.8 : 1,
                transition: "transform 0.2s ease, opacity 0.2s ease",
            }}
        >
            <svg
                width="60%"
                height="60%"
                viewBox="0 0 24 24"
                fill="none"
                stroke={iconColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    pointerEvents: "none",
                    userSelect: "none",
                }}
            >
                {!isFull && (
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" style={{ pointerEvents: "none" }} />
                )}
                {isFull && (
                    <>
                        <polyline points="4 14 10 14 10 20" style={{ pointerEvents: "none" }} />
                        <polyline points="20 10 14 10 14 4" style={{ pointerEvents: "none" }} />
                        <polyline points="14 20 14 14 20 14" style={{ pointerEvents: "none" }} />
                        <polyline points="10 4 10 10 4 10" style={{ pointerEvents: "none" }} />
                    </>
                )}
            </svg>
        </div>
    )
}

addPropertyControls(FullscreenToggle, {
    iconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#000000",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#FFFFFF",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#000000",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 2,
        min: 0,
        max: 10,
        step: 1,
    },
    radius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 12,
        min: 0,
        max: 200,
    },
})