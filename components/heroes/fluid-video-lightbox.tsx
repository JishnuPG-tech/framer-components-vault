import * as React from "react"
import {
    useState,
    useEffect,
    useCallback,
    useRef,
    useLayoutEffect,
} from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence, useInView } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// --- Helper functions for parsing Embed URLs ---
function getYouTubeId(url: string) {
    if (!url) return null
    const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
}

function getVimeoId(url: string) {
    if (!url) return null
    const match = url.match(
        /(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:[a-zA-Z0-9_\-]+)?/i
    )
    return match && match[1] ? match[1] : null
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 300
 */
export default function VideoLightbox(props) {
    const {
        sourceType,
        srcUrl,
        srcFile,
        youtubeUrl,
        vimeoUrl,
        hasPoster,
        poster, // Renamed to "Custom Image" in property controls
        playing,
        loop,
        muted,
        controls,
        objectFit,
        backgroundColor,
        borderRadius,
        startTime,
        backdropColor,
        lightboxMaxWidth,
        lightboxMaxHeight,
        zIndex,
        transition,
        lockScroll,
        style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const [isOpen, setIsOpen] = useState(false)
    const [isAnimatingOut, setIsAnimatingOut] = useState(false)

    // Tracks if ANY lightbox on the page is currently open to optimize performance
    const [isGlobalLightboxOpen, setIsGlobalLightboxOpen] = useState(false)

    useEffect(() => {
        const handleGlobalOpen = () => setIsGlobalLightboxOpen(true)
        const handleGlobalClose = () => setIsGlobalLightboxOpen(false)

        window.addEventListener("lightbox-opened", handleGlobalOpen)
        window.addEventListener("lightbox-closed", handleGlobalClose)

        return () => {
            window.removeEventListener("lightbox-opened", handleGlobalOpen)
            window.removeEventListener("lightbox-closed", handleGlobalClose)
        }
    }, [])

    // Bounds tracking for flawless FLIP animation
    const [bounds, setBounds] = useState({
        top: 0,
        left: 0,
        width: 0,
        height: 0,
    })
    const [targetBounds, setTargetBounds] = useState({
        top: 0,
        left: 0,
        width: 0,
        height: 0,
    })

    const inlineRef = useRef<HTMLDivElement>(null)
    const videoContainerRef = useRef<HTMLDivElement>(null)
    const mediaRef = useRef<HTMLElement | null>(null)
    const [isReady, setIsReady] = useState(false)
    const [aspectRatio, setAspectRatio] = useState(16 / 9)

    const isInView = useInView(inlineRef, { margin: "0px 0px 200px 0px" })

    // 1. Create a single, permanent Media Element (Video or IFrame)
    useEffect(() => {
        if (typeof document === "undefined") return

        const isEmbed = sourceType === "YouTube" || sourceType === "Vimeo"
        let el: HTMLElement

        if (isEmbed) {
            el = document.createElement("iframe")
            el.setAttribute("frameBorder", "0")
            el.setAttribute("allow", "autoplay; fullscreen; picture-in-picture")
            // Disable interactions while in grid to allow clicking the lightbox wrapper
            el.style.pointerEvents = "none"
        } else {
            el = document.createElement("video")
            ;(el as HTMLVideoElement).playsInline = true
        }

        mediaRef.current = el
        setIsReady(true)

        return () => {
            if (!isEmbed && el) {
                const v = el as HTMLVideoElement
                v.pause()
                v.removeAttribute("src")
                v.load()
            }

            // FIX: Safely remove the element from the DOM to prevent stacking
            // ghost elements when changing sourceType on the canvas
            if (el && el.parentElement) {
                el.parentElement.removeChild(el)
            }

            mediaRef.current = null
            setIsReady(false)
        }
    }, [sourceType])

    // 2. Fetch Automatic Thumbnails for YouTube & Vimeo
    const [fetchedThumbnail, setFetchedThumbnail] = useState("")

    useEffect(() => {
        let isMounted = true

        const fetchThumbnails = async () => {
            if (sourceType === "YouTube") {
                const id = getYouTubeId(youtubeUrl)
                if (id && isMounted) {
                    setFetchedThumbnail(
                        `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
                    )
                }
            } else if (sourceType === "Vimeo") {
                const id = getVimeoId(vimeoUrl)
                if (id) {
                    try {
                        // Switch to Vimeo's v2 API which is extremely permissive with CORS
                        const res = await fetch(
                            `https://vimeo.com/api/v2/video/${id}.json`
                        )
                        const data = await res.json()

                        if (isMounted && data[0] && data[0].thumbnail_large) {
                            // Extract URL and upgrade width from 640px to 1280px for a sharper poster
                            let highResThumb = data[0].thumbnail_large
                            highResThumb = highResThumb.replace(
                                /_640$/,
                                "_1280"
                            )
                            setFetchedThumbnail(highResThumb)
                        }
                    } catch (error) {
                        console.error("Vimeo Thumbnail Fetch Error:", error)
                        if (isMounted) setFetchedThumbnail("")
                    }
                }
            } else {
                if (isMounted) setFetchedThumbnail("")
            }
        }

        if (hasPoster && !poster) {
            fetchThumbnails()
        } else {
            setFetchedThumbnail("")
        }

        return () => {
            isMounted = false
        }
    }, [sourceType, youtubeUrl, vimeoUrl, hasPoster, poster])

    // Fallback logic: Custom Poster -> Auto-Fetched Thumbnail -> None
    const activePoster = hasPoster ? poster || fetchedThumbnail : ""

    // 3. Sync Framer Props to the Media Element
    useEffect(() => {
        const el = mediaRef.current
        if (!el) return

        const isEmbed = sourceType === "YouTube" || sourceType === "Vimeo"

        if (isEmbed) {
            const iframe = el as HTMLIFrameElement
            let embedUrl = ""
            const playParam = playing ? 1 : 0
            const muteParam = muted ? 1 : 0
            const loopParam = loop ? 1 : 0
            const controlsParam = controls ? 1 : 0

            if (sourceType === "YouTube") {
                const id = getYouTubeId(youtubeUrl)
                if (id) {
                    embedUrl = `https://www.youtube.com/embed/${id}?autoplay=${playParam}&mute=${muteParam}&loop=${loopParam}&playlist=${id}&controls=${controlsParam}&playsinline=1&rel=0`
                }
            } else if (sourceType === "Vimeo") {
                const id = getVimeoId(vimeoUrl)
                if (id) {
                    if (!controls && muted && loop && playing) {
                        embedUrl = `https://player.vimeo.com/video/${id}?background=1`
                    } else {
                        embedUrl = `https://player.vimeo.com/video/${id}?autoplay=${playParam}&muted=${muteParam}&loop=${loopParam}&controls=${controlsParam}`
                    }
                }
            }

            if (iframe.src !== embedUrl) iframe.src = embedUrl
            iframe.style.pointerEvents = isOpen ? "auto" : "none"
        } else {
            const v = el as HTMLVideoElement
            const activeSrc = sourceType === "URL" ? srcUrl : srcFile

            if (v.src !== activeSrc) v.src = activeSrc
            v.muted = muted
            v.loop = loop

            if (activePoster) v.poster = activePoster
            else v.removeAttribute("poster")

            // Handle auto-play logic and global performance pausing
            if (isOpen && playing) {
                v.play().catch(() => {})
            } else if (
                playing &&
                isInView &&
                !isGlobalLightboxOpen &&
                !isCanvas
            ) {
                v.play().catch(() => {})
            } else {
                v.pause()
            }
            v.style.objectFit = objectFit
        }

        el.style.width = "100%"
        el.style.height = "100%"
        el.style.display = "block"
        el.style.backgroundColor = "transparent"
        el.style.outline = "none"
    }, [
        isReady,
        sourceType,
        srcUrl,
        srcFile,
        youtubeUrl,
        vimeoUrl,
        muted,
        loop,
        activePoster,
        objectFit,
        playing,
        isOpen,
        isCanvas,
        isInView,
        isGlobalLightboxOpen,
        controls,
    ])

    // 4. Start Time & Aspect Ratio Setup (HTML5 Video Only)
    const hasSetStartTime = useRef(false)
    useEffect(() => {
        hasSetStartTime.current = false
    }, [srcUrl, srcFile, sourceType])

    useEffect(() => {
        const v = mediaRef.current as HTMLVideoElement
        if (!v || sourceType === "YouTube" || sourceType === "Vimeo") return

        const applyMetadata = () => {
            if (v.videoWidth && v.videoHeight) {
                setAspectRatio(v.videoWidth / v.videoHeight)
            }
            if (!hasSetStartTime.current && startTime > 0 && v.duration > 0) {
                v.currentTime = (startTime / 100) * v.duration
                hasSetStartTime.current = true
            }
        }

        v.addEventListener("loadedmetadata", applyMetadata)
        if (v.readyState >= 1) applyMetadata()

        return () => v.removeEventListener("loadedmetadata", applyMetadata)
    }, [isReady, startTime, sourceType])

    // 5. Target Bounds Math
    const getTargetBounds = useCallback(() => {
        const v = mediaRef.current as HTMLVideoElement
        // Fallback to default 16/9 for iframes since videoWidth is undefined
        const vidAspect =
            v && v.videoWidth && v.videoHeight
                ? v.videoWidth / v.videoHeight
                : aspectRatio

        const maxW = (window.innerWidth * lightboxMaxWidth) / 100
        const maxH = (window.innerHeight * lightboxMaxHeight) / 100

        let targetW = maxW
        let targetH = maxW / vidAspect

        if (targetH > maxH) {
            targetH = maxH
            targetW = maxH * vidAspect
        }

        return {
            top: (window.innerHeight - targetH) / 2,
            left: (window.innerWidth - targetW) / 2,
            width: targetW,
            height: targetH,
        }
    }, [lightboxMaxWidth, lightboxMaxHeight, aspectRatio])

    // 6. Initial Mount to Inline Container
    useLayoutEffect(() => {
        if (
            !isOpen &&
            !isAnimatingOut &&
            isReady &&
            videoContainerRef.current &&
            mediaRef.current
        ) {
            if (mediaRef.current.parentElement !== videoContainerRef.current) {
                videoContainerRef.current.appendChild(mediaRef.current)
            }
        }
    }, [isReady, isOpen, isAnimatingOut])

    // 7. Open / Close Handlers
    const handleOpen = useCallback(() => {
        if (isCanvas || !inlineRef.current) return

        const rect = inlineRef.current.getBoundingClientRect()
        setBounds({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
        })
        setTargetBounds(getTargetBounds())

        if (
            mediaRef.current &&
            (sourceType === "URL" || sourceType === "Upload")
        ) {
            ;(mediaRef.current as HTMLVideoElement).controls = controls
        }

        // Broadcast that a lightbox is opening
        window.dispatchEvent(new Event("lightbox-opened"))
        setIsOpen(true)
    }, [isCanvas, controls, getTargetBounds, sourceType])

    const handleClose = useCallback(() => {
        if (!inlineRef.current) return

        const rect = inlineRef.current.getBoundingClientRect()
        setBounds({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
        })

        if (
            mediaRef.current &&
            (sourceType === "URL" || sourceType === "Upload")
        ) {
            ;(mediaRef.current as HTMLVideoElement).controls = false
        }

        // Broadcast that grid videos can resume
        window.dispatchEvent(new Event("lightbox-closed"))
        setIsAnimatingOut(true)
        setIsOpen(false)
    }, [sourceType])

    // 8. Responsive Resize while Open
    useEffect(() => {
        if (!isOpen) return
        const handleResize = () => setTargetBounds(getTargetBounds())
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [isOpen, getTargetBounds])

    // 9. Escape Key & Scroll Lock
    useEffect(() => {
        if (isCanvas || !isOpen) return

        const originalOverflow = document.body.style.overflow
        if (lockScroll) document.body.style.overflow = "hidden"

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose()
        }
        window.addEventListener("keydown", handleKeyDown)

        return () => {
            if (lockScroll) document.body.style.overflow = originalOverflow
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [isOpen, isCanvas, lockScroll, handleClose])

    // 10. Portal Transport logic
    const portalVideoRef = useCallback((node: HTMLDivElement | null) => {
        if (node && mediaRef.current) {
            node.appendChild(mediaRef.current)
        }
    }, [])

    const handleExitComplete = () => {
        setIsAnimatingOut(false)
    }

    return (
        <div
            ref={inlineRef}
            style={{
                ...style,
                width: "100%",
                height: "100%",
            }}
        >
            {/* INNER WRAPPER: Uses CSS Grid to stack elements in the same cell */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    backgroundColor:
                        isOpen || isAnimatingOut
                            ? "transparent"
                            : backgroundColor,
                    borderRadius: borderRadius,
                    overflow: "hidden",
                    display: "grid",
                    cursor: "pointer",
                }}
                onClick={handleOpen}
            >
                {/* INVISIBLE PLACEHOLDER */}
                {(isOpen || isAnimatingOut) && (
                    <div
                        style={{
                            gridArea: "1 / 1",
                            width: bounds.width || "100%",
                            height: bounds.height || "100%",
                            pointerEvents: "none",
                        }}
                    />
                )}

                {/* POSTER OVERLAY FOR EMBEDS: Simulates native poster for YT/Vimeo during grid state */}
                {(sourceType === "YouTube" || sourceType === "Vimeo") &&
                    activePoster &&
                    !isOpen &&
                    !isAnimatingOut && (
                        <img
                            src={activePoster}
                            alt="Video thumbnail"
                            onError={(e) => {
                                // Fallback for YouTube videos missing a maxresdefault image
                                if (
                                    e.currentTarget.src.includes(
                                        "maxresdefault.jpg"
                                    )
                                ) {
                                    e.currentTarget.src =
                                        e.currentTarget.src.replace(
                                            "maxresdefault.jpg",
                                            "hqdefault.jpg"
                                        )
                                }
                            }}
                            style={{
                                gridArea: "1 / 1",
                                width: "100%",
                                height: "100%",
                                objectFit: objectFit as any,
                                pointerEvents: "none",
                                zIndex: 1,
                            }}
                        />
                    )}

                {/* VIDEO CONTAINER */}
                <div
                    ref={videoContainerRef}
                    style={{
                        gridArea: "1 / 1",
                        width: "100%",
                        height: "100%",
                    }}
                />
            </div>

            {!isCanvas &&
                typeof document !== "undefined" &&
                createPortal(
                    <AnimatePresence onExitComplete={handleExitComplete}>
                        {isOpen && (
                            <motion.div
                                initial={{
                                    backgroundColor: "rgba(0, 0, 0, 0)",
                                }}
                                animate={{ backgroundColor: backdropColor }}
                                exit={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
                                transition={transition}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleClose()
                                }}
                                style={{
                                    position: "fixed",
                                    inset: 0,
                                    zIndex: zIndex,
                                    pointerEvents: "auto",
                                }}
                            >
                                <motion.div
                                    ref={portalVideoRef}
                                    onClick={(e) => e.stopPropagation()}
                                    initial={{
                                        top: bounds.top,
                                        left: bounds.left,
                                        width: bounds.width,
                                        height: bounds.height,
                                        borderRadius: borderRadius,
                                    }}
                                    animate={{
                                        top: targetBounds.top,
                                        left: targetBounds.left,
                                        width: targetBounds.width,
                                        height: targetBounds.height,
                                        borderRadius: borderRadius,
                                    }}
                                    exit={{
                                        top: bounds.top,
                                        left: bounds.left,
                                        width: bounds.width,
                                        height: bounds.height,
                                        borderRadius: borderRadius,
                                    }}
                                    transition={transition}
                                    style={{
                                        position: "absolute",
                                        backgroundColor: backgroundColor,
                                        overflow: "hidden",
                                        willChange:
                                            "transform, width, height, top, left",
                                    }}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
        </div>
    )
}

VideoLightbox.defaultProps = {
    sourceType: "URL",
    srcUrl: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    vimeoUrl: "https://vimeo.com/76979871",
    playing: true,
    borderRadius: 0,
    hasPoster: true,
    backgroundColor: "#000000",
    startTime: 0,
    loop: true,
    objectFit: "cover",
    controls: true,
    muted: true,
    backdropColor: "rgba(0, 0, 0, 0.85)",
    lightboxMaxWidth: 90,
    lightboxMaxHeight: 90,
    zIndex: 99,
    lockScroll: true,
    transition: {
        type: "spring",
        stiffness: 280,
        damping: 40,
        mass: 0.9,
        restSpeed: 0.001,
        restDelta: 0.001,
    },
}

addPropertyControls(VideoLightbox, {
    sourceType: {
        type: ControlType.Enum,
        title: "Source",
        options: ["URL", "Upload", "YouTube", "Vimeo"],
    },
    srcUrl: {
        type: ControlType.String,
        title: "URL",
        defaultValue:
            "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        hidden: (props) => props.sourceType !== "URL",
    },
    srcFile: {
        type: ControlType.File,
        title: "File",
        allowedFileTypes: ["mp4", "webm"],
        hidden: (props) => props.sourceType !== "Upload",
    },
    youtubeUrl: {
        type: ControlType.String,
        title: "YouTube URL",
        defaultValue: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        hidden: (props) => props.sourceType !== "YouTube",
    },
    vimeoUrl: {
        type: ControlType.String,
        title: "Vimeo URL",
        defaultValue: "https://vimeo.com/76979871",
        hidden: (props) => props.sourceType !== "Vimeo",
    },
    playing: {
        type: ControlType.Boolean,
        title: "Playing",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: 0,
    },
    hasPoster: {
        type: ControlType.Boolean,
        title: "Poster",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    poster: {
        type: ControlType.Image,
        title: "Custom Image", // Clarified Title
        hidden: (props) => !props.hasPoster,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    startTime: {
        type: ControlType.Number,
        title: "Start Time",
        defaultValue: 0,
        min: 0,
        max: 100,
        unit: "%",
        displayStepper: true,
        hidden: (props) =>
            props.sourceType === "YouTube" || props.sourceType === "Vimeo",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "fill", "contain", "scale-down", "none"],
        optionTitles: ["Cover", "Fill", "Contain", "Scale Down", "None"],
        defaultValue: "cover",
    },
    controls: {
        type: ControlType.Boolean,
        title: "Controls",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    muted: {
        type: ControlType.Boolean,
        title: "Muted",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
    },
    backdropColor: {
        type: ControlType.Color,
        title: "Lightbox BG",
        defaultValue: "rgba(0, 0, 0, 0.85)",
    },
    lightboxMaxWidth: {
        type: ControlType.Number,
        title: "Max Width (vw)",
        defaultValue: 90,
        min: 10,
        max: 100,
        displayStepper: true,
    },
    lightboxMaxHeight: {
        type: ControlType.Number,
        title: "Max Height (vh)",
        defaultValue: 90,
        min: 10,
        max: 100,
        displayStepper: true,
    },
    zIndex: {
        type: ControlType.Number,
        title: "Z-Index",
        defaultValue: 99,
        min: 0,
        max: 999999,
        displayStepper: false,
    },
    lockScroll: {
        type: ControlType.Boolean,
        title: "Lock Scroll",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        description:
            "Explore [more components](https://dub.sh/daniyal-framer)\nMade by [Daniyal](https://dub.sh/daniyal-threads)",
    },
})
