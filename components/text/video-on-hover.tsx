// Testo che mostra un video sopra il mouse quando si passa sopra il testo, seguendo il mouse finché non si esce dal box
import { useState, useRef, useCallback, useMemo, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence } from "framer-motion"

interface HoverVideoProps {
    label: string
    useVideoFile: boolean
    videoFile: string
    videoUrl: string
    videoWidth: number
    videoHeight: number
    borderRadius: number
    boxShadow: any
    font: any
    background: string
    textColor: string
    mouseVideoDistance: number
    style?: CSSProperties
}

/**
 * Testo con video on hover che segue il mouse
 *
 * @framerIntrinsicWidth 220
 * @framerIntrinsicHeight 220
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function HoverVideo(props: HoverVideoProps) {
    const {
        label,
        useVideoFile,
        videoFile = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        videoUrl = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        videoWidth,
        videoHeight,
        borderRadius,
        boxShadow,
        font,
        background,
        textColor,
        mouseVideoDistance,
        style,
    } = props

    const [show, setShow] = useState(false)
    const [mouse, setMouse] = useState({ x: 0, y: 0 })
    const boxRef = useRef<HTMLDivElement>(null)

    // Memoize video source to prevent unnecessary re-renders
    const videoSrc = useMemo(() => useVideoFile ? videoFile : videoUrl, [useVideoFile, videoFile, videoUrl])

    // Memoize video position calculation
    const videoPos = useMemo(() => {
        const x = mouse.x - videoWidth / 2
        const y = mouse.y - videoHeight - mouseVideoDistance
        return { x, y }
    }, [mouse.x, mouse.y, videoWidth, videoHeight, mouseVideoDistance])

    // Memoize text styles to prevent re-creation
    const textStyles = useMemo(() => ({
        color: textColor,
        fontSize: font.fontSize,
        fontWeight: font.fontWeight,
        fontFamily: font.fontFamily,
        lineHeight: font.lineHeight,
        letterSpacing: font.letterSpacing,
        ...font,
        userSelect: "none" as const,
        cursor: "pointer" as const,
        position: "relative" as const,
        background: "transparent",
        padding: 0,
        borderRadius: 0,
        boxShadow: undefined,
        minWidth: undefined,
        minHeight: undefined,
        display: "inline-block" as const,
    }), [textColor, font])

    // Memoize video container styles
    const videoContainerStyles = useMemo(() => ({
        position: "absolute" as const,
        left: videoPos.x,
        top: videoPos.y,
        width: videoWidth,
        height: videoHeight,
        borderRadius,
        boxShadow: boxShadow,
        pointerEvents: "none" as const,
        zIndex: 10,
        overflow: "hidden" as const,
    }), [videoPos.x, videoPos.y, videoWidth, videoHeight, borderRadius, boxShadow])

    // Memoize video styles
    const videoStyles = useMemo(() => ({
        width: "100%",
        height: "100%",
        objectFit: "cover" as const,
        borderRadius,
        display: "block" as const,
    }), [borderRadius])

    // Optimized mouse move handler with throttling
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!boxRef.current) return
        const rect = boxRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        setMouse({ x, y })
    }, [])

    // Show video on enter
    const handleMouseEnter = useCallback(() => {
        setShow(true)
    }, [])

    // Hide video on leave
    const handleMouseLeave = useCallback(() => {
        setShow(false)
    }, [])

    return (
        <div
            ref={boxRef}
            style={{
                ...style,
                width: "fit-content",
                height: "fit-content",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                position: "relative",
                overflow: "visible",
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {RenderTarget.current() !== RenderTarget.thumbnail && (
                <AnimatePresence mode="wait">
                    {show && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ 
                                duration: 0.15, 
                                ease: [0.4, 0, 0.2, 1] 
                            }}
                            style={videoContainerStyles}
                        >
                            <video
                                src={videoSrc}
                                width={videoWidth}
                                height={videoHeight}
                                autoPlay
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                style={videoStyles}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
            <span style={textStyles}>
                {label}
            </span>
        </div>
    )
}

addPropertyControls(HoverVideo, {
    useVideoFile: {
        type: ControlType.Boolean,
        title: "Video Type",
        defaultValue: true,
        enabledTitle: "File",
        disabledTitle: "URL",
    },
    videoFile: {
        type: ControlType.File,
        allowedFileTypes: ["mp4", "webm", "mov"],
        hidden: ({ useVideoFile }) => !useVideoFile,
    },
    videoUrl: {
        type: ControlType.String,
        title: "Video URL",
        defaultValue: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        placeholder: "Enter video URL...",
        hidden: ({ useVideoFile }) => useVideoFile,
    },
    label: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Hover here",
    },
    font: {
        type: ControlType.Font,
        title: "Text Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 20,
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#222",
    },
    videoWidth: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 220,
        min: 80,
        max: 400,
        step: 1,
        unit: "px",
    },
    videoHeight: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 120,
        min: 40,
        max: 300,
        step: 1,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Video Border",
        defaultValue: 24,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },
    mouseVideoDistance: {
        type: ControlType.Number,
        title: "Mouse-Video Distance",
        defaultValue: 16,
        min: 0,
        max: 100,
        step: 0.1,
        unit: "px",
    },
    boxShadow: {
        type: ControlType.BoxShadow,
        title: "Video Shadow",
        defaultValue: {
            x: 0,
            y: 35,
            blur: 24,
            spread: 0,
            color: "#000000",
            alpha: 0.18,
            enabled: true,
        },
    },
})
