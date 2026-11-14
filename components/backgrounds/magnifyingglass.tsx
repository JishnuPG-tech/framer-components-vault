// Magnifying glass component with circular lens that follows mouse, zooms image, and shows overlay content
import { useState, useRef, useEffect, useCallback, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface MagnifyingGlassProps {
    mediaType: "image" | "video"
    image: {
        src: string
        alt: string
    }
    videoFile: string
    lensSize: number
    zoomLevel: number
    borderWidth: number
    borderColor: string
    showShadow: boolean
    overlayText: string
    showOverlayText: boolean
    overlayTextColor: string
    overlayFont: CSSProperties
    enableLink: boolean
    linkUrl: string
    openInNewTab: boolean
    style?: CSSProperties
}

/**
 * Magnifying Glass Component
 * 
 * A circular lens that follows the mouse cursor and magnifies the underlying image.
 * Includes customizable border, shadow, zoom level, and overlay text.
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function MagnifyingGlass(props: MagnifyingGlassProps) {
    const {
        mediaType = "image",
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Magnified image"
        },
        videoFile = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        lensSize = 150,
        zoomLevel = 2,
        borderWidth = 4,
        borderColor = "#FFFFFF",
        showShadow = true,
        overlayText = "Zoom",
        showOverlayText = false,
        overlayTextColor = "#FFFFFF",
        overlayFont,
        enableLink = false,
        linkUrl = "https://www.framer.com",
        openInNewTab = true,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const lensVideoRef = useRef<HTMLVideoElement>(null)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isHovering, setIsHovering] = useState(false)
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
    const isStatic = useIsStaticRenderer()

    // Update container size on mount and resize
    useEffect(() => {
        if (!containerRef.current || isStatic) return

        const updateSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                startTransition(() => {
                    setContainerSize({ width: rect.width, height: rect.height })
                })
            }
        }

        updateSize()
        window.addEventListener("resize", updateSize)
        return () => window.removeEventListener("resize", updateSize)
    }, [isStatic])

    // Sync video playback between base and lens videos
    useEffect(() => {
        if (mediaType !== "video" || !videoRef.current || !lensVideoRef.current) return

        const baseVideo = videoRef.current
        const lensVideo = lensVideoRef.current

        const syncVideos = () => {
            if (Math.abs(baseVideo.currentTime - lensVideo.currentTime) > 0.1) {
                lensVideo.currentTime = baseVideo.currentTime
            }
        }

        const handlePlay = () => lensVideo.play()
        const handlePause = () => lensVideo.pause()
        const handleSeeking = () => {
            lensVideo.currentTime = baseVideo.currentTime
        }

        baseVideo.addEventListener("timeupdate", syncVideos)
        baseVideo.addEventListener("play", handlePlay)
        baseVideo.addEventListener("pause", handlePause)
        baseVideo.addEventListener("seeking", handleSeeking)

        return () => {
            baseVideo.removeEventListener("timeupdate", syncVideos)
            baseVideo.removeEventListener("play", handlePlay)
            baseVideo.removeEventListener("pause", handlePause)
            baseVideo.removeEventListener("seeking", handleSeeking)
        }
    }, [mediaType])

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        startTransition(() => {
            setMousePosition({ x, y })
        })
    }, [])

    const handleMouseEnter = useCallback(() => {
        startTransition(() => {
            setIsHovering(true)
        })
    }, [])

    const handleMouseLeave = useCallback(() => {
        startTransition(() => {
            setIsHovering(false)
        })
    }, [])

    // Calculate the background position for the zoomed image
    const backgroundX = -(mousePosition.x * zoomLevel - lensSize / 2)
    const backgroundY = -(mousePosition.y * zoomLevel - lensSize / 2)

    // Calculate clip position for video
    const clipX = mousePosition.x * zoomLevel - lensSize / 2
    const clipY = mousePosition.y * zoomLevel - lensSize / 2

    const content = (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                cursor: isStatic ? "default" : enableLink ? "pointer" : "none",
            }}
            onMouseMove={isStatic ? undefined : handleMouseMove}
            onMouseEnter={isStatic ? undefined : handleMouseEnter}
            onMouseLeave={isStatic ? undefined : handleMouseLeave}
        >
            {/* Base Media */}
            {mediaType === "image" ? (
                <img
                    src={image.src}
                    alt={image.alt}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        userSelect: "none",
                        pointerEvents: "none",
                    }}
                    draggable={false}
                />
            ) : (
                <video
                    ref={videoRef}
                    src={videoFile}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        userSelect: "none",
                    }}
                    autoPlay
                    loop
                    muted
                    playsInline
                />
            )}

            {/* Magnifying Lens */}
            {(isHovering || isStatic) && (
                <div
                    style={{
                        position: "absolute",
                        left: isStatic ? "50%" : mousePosition.x,
                        top: isStatic ? "50%" : mousePosition.y,
                        width: lensSize,
                        height: lensSize,
                        borderRadius: "50%",
                        border: `${borderWidth}px solid ${borderColor}`,
                        boxShadow: showShadow ? "0 8px 24px rgba(0, 0, 0, 0.3)" : "none",
                        transform: "translate(-50%, -50%)",
                        overflow: "hidden",
                        pointerEvents: "none",
                        zIndex: 10,
                        ...(mediaType === "image" && {
                            backgroundImage: `url(${image.src})`,
                            backgroundSize: `${containerSize.width * zoomLevel}px ${containerSize.height * zoomLevel}px`,
                            backgroundPosition: isStatic 
                                ? `${-(containerSize.width / 2) * zoomLevel + lensSize / 2}px ${-(containerSize.height / 2) * zoomLevel + lensSize / 2}px`
                                : `${backgroundX}px ${backgroundY}px`,
                            backgroundRepeat: "no-repeat",
                        }),
                    }}
                >
                    {/* Zoomed Video */}
                    {mediaType === "video" && (
                        <video
                            ref={lensVideoRef}
                            src={videoFile}
                            style={{
                                position: "absolute",
                                width: `${containerSize.width * zoomLevel}px`,
                                height: `${containerSize.height * zoomLevel}px`,
                                objectFit: "cover",
                                left: isStatic 
                                    ? `${-(containerSize.width / 2) * zoomLevel + lensSize / 2}px`
                                    : `${-clipX}px`,
                                top: isStatic 
                                    ? `${-(containerSize.height / 2) * zoomLevel + lensSize / 2}px`
                                    : `${-clipY}px`,
                            }}
                            autoPlay
                            loop
                            muted
                            playsInline
                        />
                    )}

                    {/* Overlay Text */}
                    {showOverlayText && overlayText && (
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: overlayTextColor,
                                textAlign: "center",
                                padding: "10px",
                                backgroundColor: "rgba(0, 0, 0, 0.3)",
                                ...overlayFont,
                            }}
                        >
                            {overlayText}
                        </div>
                    )}
                </div>
            )}
        </div>
    )

    if (enableLink && linkUrl) {
        return (
            <a
                href={linkUrl}
                target={openInNewTab ? "_blank" : "_self"}
                rel={openInNewTab ? "noopener noreferrer" : undefined}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    textDecoration: "none",
                }}
            >
                {content}
            </a>
        )
    }

    return content
}

addPropertyControls(MagnifyingGlass, {
    mediaType: {
        type: ControlType.Enum,
        title: "Media Type",
        options: ["image", "video"],
        optionTitles: ["Image", "Video"],
        defaultValue: "image",
        displaySegmentedControl: true,
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        hidden: ({ mediaType }) => mediaType !== "image",
    },
    videoFile: {
        type: ControlType.File,
        title: "Video",
        allowedFileTypes: ["mp4", "webm", "mov"],
        hidden: ({ mediaType }) => mediaType !== "video",
    },
    lensSize: {
        type: ControlType.Number,
        title: "Lens Size",
        defaultValue: 150,
        min: 50,
        max: 400,
        step: 10,
        unit: "px",
    },
    zoomLevel: {
        type: ControlType.Number,
        title: "Zoom Level",
        defaultValue: 2,
        min: 1.5,
        max: 5,
        step: 0.1,
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 4,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#FFFFFF",
    },
    showShadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showOverlayText: {
        type: ControlType.Boolean,
        title: "Overlay Text",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    overlayText: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Zoom",
        hidden: ({ showOverlayText }) => !showOverlayText,
    },
    overlayTextColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showOverlayText }) => !showOverlayText,
    },
    overlayFont: {
        type: ControlType.Font,
        title: "Text Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Bold",
            letterSpacing: "0em",
            lineHeight: "1.2em",
        },
        hidden: ({ showOverlayText }) => !showOverlayText,
    },
    enableLink: {
        type: ControlType.Boolean,
        title: "Link",
        defaultValue: false,
        enabledTitle: "Enabled",
        disabledTitle: "Disabled",
    },
    linkUrl: {
        type: ControlType.Link,
        title: "URL",
        defaultValue: "https://www.framer.com",
        hidden: ({ enableLink }) => !enableLink,
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "Open in New Tab",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: ({ enableLink }) => !enableLink,
    },
})
