import { useEffect, useState, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    motion,
    useMotionValue,
    useSpring,
    useVelocity,
    useTransform,
} from "framer-motion"
import type { CSSProperties } from "react"

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function KineticMediaTrail(props) {
    const {
        mode = "image",
        image = {
            src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
            alt: "Default Smooth Trail",
        },
        videoSourceType = "url",
        videoFile,
        // URL direta em .mp4 do Pexels para garantir o funcionamento imediato
        videoUrl = "https://www.pexels.com/pt-br/download/video/10678758/",
        cursorWidth = 200,
        cursorHeight = 160,
        borderRadius = "4px",
        boxShadow,
        disableOnMobile = true,
        physics = {
            stiffness: 200,
            damping: 40,
            mass: 0.1,
            angle: 15,
            smoothness: 40,
        },
        style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const containerRef = useRef<HTMLDivElement>(null)
    const [isVisible, setIsVisible] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    // --- Device Detection (SSR Safe) ---
    useEffect(() => {
        if (!disableOnMobile || isCanvas) {
            setIsMobile(false)
            return
        }

        const checkMobile = () => {
            const isTouch = window.matchMedia("(pointer: coarse)").matches
            const isSmallScreen = window.innerWidth <= 768
            setIsMobile(isTouch || isSmallScreen)
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [disableOnMobile, isCanvas])

    // --- Physics Engine ---
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    const springConfig = {
        stiffness: physics.stiffness,
        damping: physics.damping,
        mass: physics.mass,
    }

    const x = useSpring(mouseX, springConfig)
    const y = useSpring(mouseY, springConfig)

    // --- Rotation Physics ---
    const velocityX = useVelocity(x)
    const rawRotate = useTransform(
        velocityX,
        [-1500, 1500],
        [-physics.angle, physics.angle]
    )

    const smoothRotate = useSpring(rawRotate, {
        stiffness: 200,
        damping: physics.smoothness,
        mass: 0.1,
    })

    // --- Hybrid Tracking Logic ---
    useEffect(() => {
        if (isCanvas || isMobile) return

        const handleGlobalMove = (e: MouseEvent) => {
            const container = containerRef.current
            if (!container) return

            const rect = container.getBoundingClientRect()

            const isInside =
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom

            if (isInside) {
                if (!isVisible) setIsVisible(true)
                mouseX.set(e.clientX - rect.left)
                mouseY.set(e.clientY - rect.top)
            } else {
                if (isVisible) setIsVisible(false)
            }
        }

        window.addEventListener("mousemove", handleGlobalMove)
        return () => window.removeEventListener("mousemove", handleGlobalMove)
    }, [isVisible, isCanvas, isMobile, mouseX, mouseY])

    // --- Content Renderer ---
    const renderContent = () => {
        const commonStyle: CSSProperties = {
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            pointerEvents: "none",
            userSelect: "none",
        }

        if (mode === "video") {
            const fallbackUrl =
                "https://www.pexels.com/pt-br/download/video/10678758/"
            let currentVideoSrc =
                videoSourceType === "upload" ? videoFile : videoUrl

            if (!currentVideoSrc) {
                currentVideoSrc = fallbackUrl
            }

            return (
                <video
                    src={currentVideoSrc}
                    style={commonStyle}
                    autoPlay
                    muted
                    loop
                    playsInline
                />
            )
        }

        if (mode === "image" && image?.src) {
            return (
                <img
                    src={image.src}
                    srcSet={image.srcSet}
                    alt={image.alt || "Media Trail Element"}
                    style={commonStyle}
                />
            )
        }

        const fallbackStyle: CSSProperties = {
            ...commonStyle,
            background: "#111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#666",
            fontSize: 12,
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
        }

        return <div style={fallbackStyle}>Media Required</div>
    }

    // --- Canvas Preview ---
    if (isCanvas) {
        return (
            <div
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "rgba(153, 102, 255, 0.05)",
                    border: "1px dashed rgba(153, 102, 255, 0.3)",
                    borderRadius: 8,
                }}
            >
                <div style={{ textAlign: "center", padding: 24 }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
                    <h3
                        style={{
                            margin: "0 0 8px 0",
                            color: "#9966FF",
                            fontFamily: "Inter, sans-serif",
                            fontSize: 16,
                            fontWeight: 600,
                        }}
                    >
                        Kinetic Media Trail
                    </h3>
                    <p
                        style={{
                            margin: 0,
                            color: "#666",
                            fontFamily: "Inter, sans-serif",
                            fontSize: 12,
                            lineHeight: 1.5,
                            maxWidth: 260,
                        }}
                    >
                        Adjust properties panel to set your media. This area
                        defines the hover boundaries.
                    </p>
                </div>
            </div>
        )
    }

    // --- Live Component ---
    return (
        <div
            ref={containerRef}
            style={{
                ...style, // Critical for layout system
                position: "relative",
                overflow: "hidden",
                pointerEvents: "none",
                zIndex: 0,
            }}
        >
            {!isMobile && (
                <motion.div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: cursorWidth,
                        height: cursorHeight,
                        x,
                        y,
                        rotate: smoothRotate,
                        translateX: "-50%",
                        translateY: "-50%",
                        opacity: isVisible ? 1 : 0,
                        willChange: "transform, opacity",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: borderRadius,
                            overflow: "hidden",
                            transform: "translateZ(0)",
                            boxShadow: boxShadow,
                        }}
                    >
                        {renderContent()}
                    </div>
                </motion.div>
            )}
        </div>
    )
}

addPropertyControls(KineticMediaTrail, {
    mode: {
        type: ControlType.Enum,
        title: "Media Type",
        options: ["image", "video"],
        optionTitles: ["Image", "Video"],
        displaySegmentedControl: true,
        defaultValue: "image",
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Source",
        hidden: (props) => props.mode !== "image",
    },
    videoSourceType: {
        type: ControlType.Enum,
        title: "Video From",
        options: ["upload", "url"],
        optionTitles: ["Upload", "URL"],
        displaySegmentedControl: true,
        hidden: (props) => props.mode !== "video",
        defaultValue: "url",
    },
    videoFile: {
        type: ControlType.File,
        title: "File",
        allowedFileTypes: ["mp4", "mov", "webm"],
        hidden: (props) =>
            props.mode !== "video" || props.videoSourceType !== "upload",
    },
    videoUrl: {
        type: ControlType.String,
        title: "URL",
        placeholder: "https://your-cdn.com/video.mp4",
        hidden: (props) =>
            props.mode !== "video" || props.videoSourceType !== "url",
        defaultValue: "https://www.pexels.com/pt-br/download/video/10678758/",
    },
    disableOnMobile: {
        type: ControlType.Boolean,
        title: "Hide on Mobile",
        defaultValue: true,
        description:
            "Unmounts media and stops physics on touch devices to save battery and network data.",
    },
    cursorWidth: {
        type: ControlType.Number,
        title: "Width",
        min: 10,
        max: 800,
        unit: "px",
        defaultValue: 200,
    },
    cursorHeight: {
        type: ControlType.Number,
        title: "Height",
        min: 10,
        max: 800,
        unit: "px",
        defaultValue: 160,
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "4px",
    },
    boxShadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
    },
    physics: {
        type: ControlType.Object,
        title: "Physics",
        defaultValue: {
            stiffness: 200,
            damping: 40,
            mass: 0.1,
            angle: 15,
            smoothness: 40,
        },
        controls: {
            stiffness: {
                type: ControlType.Number,
                title: "Stiffness",
                min: 10,
                max: 500,
                defaultValue: 200,
            },
            damping: {
                type: ControlType.Number,
                title: "Damping",
                min: 1,
                max: 100,
                defaultValue: 40,
            },
            mass: {
                type: ControlType.Number,
                title: "Mass",
                min: 0.1,
                max: 5,
                step: 0.1,
                defaultValue: 0.1,
            },
            angle: {
                type: ControlType.Number,
                title: "Max Angle",
                min: 0,
                max: 90,
                unit: "°",
                defaultValue: 15,
            },
            smoothness: {
                type: ControlType.Number,
                title: "Smoothness",
                min: 10,
                max: 100,
                defaultValue: 40,
            },
        },
    },
})
