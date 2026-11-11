// CursorSpotlightReveal — cursor-following spotlight reveal for video and image
import {
    useState,
    useEffect,
    useRef,
    startTransition,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface CursorSpotlightRevealProps {
    mediaType: "video" | "image"
    videoSource: "upload" | "url"
    videoFile: string
    videoUrl: string
    videoAltText: string
    imageSource: "upload" | "url"
    imageUpload?: { imageFile?: string; altText?: string }
    imageUrl: string
    imageFit: "fit" | "fill"
    spotlightSize: number
    backgroundColor: string
    blur: number
    style?: CSSProperties
}

const DEFAULT_VIDEO_URL =
    "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4"
const DEFAULT_IMAGE_URL =
    "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"

function safeHttpUrl(input: string, fallback: string): string {
    try {
        const url = new URL(input)
        return url.protocol === "http:" || url.protocol === "https:"
            ? input
            : fallback
    } catch {
        return fallback
    }
}

/**
 * CursorSpotlightReveal
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 */
export default function CursorSpotlightReveal(props: CursorSpotlightRevealProps) {
    const {
        spotlightSize = 200,
        backgroundColor = "#000000",
        blur = 50,
        mediaType = "video",
        videoSource = "url",
        videoFile = "",
        videoUrl = DEFAULT_VIDEO_URL,
        videoAltText = "",
        imageSource = "url",
        imageUpload,
        imageUrl = DEFAULT_IMAGE_URL,
        imageFit = "fill",
        style,
    } = props
    const imageFile = imageUpload?.imageFile ?? ""
    const altText = imageUpload?.altText ?? ""

    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [isHovering, setIsHovering] = useState(false)
    const [isRevealed, setIsRevealed] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
    const [isVisible, setIsVisible] = useState(true)
    const containerRef = useRef<HTMLDivElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        if (isStatic) return

        const checkMobile = () => {
            const mobile = window.innerWidth < 810
            setIsMobile(mobile)
            if (mobile) setIsRevealed(true)
        }
        checkMobile()
        window.addEventListener("resize", checkMobile)

        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        setPrefersReducedMotion(mq.matches)
        const handler = (e: MediaQueryListEvent) =>
            setPrefersReducedMotion(e.matches)
        mq.addEventListener("change", handler)

        return () => {
            window.removeEventListener("resize", checkMobile)
            mq.removeEventListener("change", handler)
        }
    }, [isStatic])

    useEffect(() => {
        if (isStatic) return

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current || isRevealed) return
            const rect = containerRef.current.getBoundingClientRect()
            startTransition(() => {
                setMousePosition({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                })
            })
        }

        const handleMouseEnter = () => {
            if (isRevealed) return
            startTransition(() => setIsHovering(true))
        }

        const handleMouseLeave = () => {
            if (isRevealed) return
            startTransition(() => setIsHovering(false))
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (!containerRef.current || isRevealed) return
            const rect = containerRef.current.getBoundingClientRect()
            const touch = e.touches[0]
            startTransition(() => {
                setMousePosition({
                    x: touch.clientX - rect.left,
                    y: touch.clientY - rect.top,
                })
            })
        }

        const handleTouchStart = (e: TouchEvent) => {
            if (!containerRef.current || isRevealed) return
            const rect = containerRef.current.getBoundingClientRect()
            const touch = e.touches[0]
            startTransition(() => {
                setMousePosition({
                    x: touch.clientX - rect.left,
                    y: touch.clientY - rect.top,
                })
                setIsHovering(true)
            })
        }

        const handleTouchEnd = () => {
            if (isRevealed) return
            startTransition(() => setIsHovering(false))
        }

        const container = containerRef.current
        if (container) {
            container.addEventListener("mousemove", handleMouseMove)
            container.addEventListener("mouseenter", handleMouseEnter)
            container.addEventListener("mouseleave", handleMouseLeave)
            container.addEventListener("touchmove", handleTouchMove)
            container.addEventListener("touchstart", handleTouchStart)
            container.addEventListener("touchend", handleTouchEnd)
        }

        return () => {
            if (container) {
                container.removeEventListener("mousemove", handleMouseMove)
                container.removeEventListener("mouseenter", handleMouseEnter)
                container.removeEventListener("mouseleave", handleMouseLeave)
                container.removeEventListener("touchmove", handleTouchMove)
                container.removeEventListener("touchstart", handleTouchStart)
                container.removeEventListener("touchend", handleTouchEnd)
            }
        }
    }, [isStatic, isRevealed])

    useEffect(() => {
        setIsRevealed(false)
        setIsHovering(false)
    }, [mediaType])

    useEffect(() => {
        if (isStatic || !containerRef.current) return

        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold: 0 }
        )
        observer.observe(containerRef.current)

        return () => observer.disconnect()
    }, [isStatic])

    useEffect(() => {
        if (isStatic || !videoRef.current || mediaType !== "video") return

        if (isRevealed && !prefersReducedMotion && isVisible) {
            videoRef.current.play().catch(() => {})
        } else {
            videoRef.current.pause()
        }
    }, [isStatic, isRevealed, mediaType, prefersReducedMotion, isVisible])

    const handleClick = () => {
        if (isMobile) return
        startTransition(() => setIsRevealed(!isRevealed))
    }

    const spotlightMask = (x: string, y: string) =>
        `radial-gradient(circle ${spotlightSize / 2}px at ${x} ${y}, transparent 0%, transparent ${Math.max(0, spotlightSize / 2 - blur)}px, black ${spotlightSize / 2}px, black 100%)`

    const activeMask = isStatic
        ? spotlightMask("50%", "50%")
        : isHovering
          ? spotlightMask(`${mousePosition.x}px`, `${mousePosition.y}px`)
          : undefined

    const overlayStyle: CSSProperties = {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: backgroundColor,
        pointerEvents: "none",
        zIndex: 1,
        maskImage: activeMask,
        WebkitMaskImage: activeMask,
        transition:
            isStatic || prefersReducedMotion
                ? "none"
                : "opacity 0.3s ease-out, mask-image 0.05s ease-out, -webkit-mask-image 0.05s ease-out",
        opacity: isRevealed ? 0 : 1,
    }

    const mediaStyle: CSSProperties = {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        zIndex: 0,
    }

    const imageStyle: CSSProperties = {
        ...mediaStyle,
        objectFit: imageFit === "fill" ? "cover" : "contain",
    }

    const resolvedVideoSrc =
        videoSource === "url"
            ? safeHttpUrl(videoUrl, DEFAULT_VIDEO_URL)
            : videoFile || DEFAULT_VIDEO_URL

    const resolvedImageSrc =
        imageSource === "url"
            ? safeHttpUrl(imageUrl, DEFAULT_IMAGE_URL)
            : imageFile || DEFAULT_IMAGE_URL

    return (
        <div
            ref={containerRef}
            role={isMobile ? undefined : "button"}
            aria-label={
                isMobile
                    ? undefined
                    : isRevealed
                      ? "Hide media"
                      : "Reveal media"
            }
            tabIndex={isMobile ? undefined : 0}
            onKeyDown={
                isMobile
                    ? undefined
                    : (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              handleClick()
                          }
                      }
            }
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                cursor: isMobile ? "auto" : "pointer",
                touchAction: isMobile ? "auto" : "none",
            }}
            onClick={handleClick}
        >
            {mediaType === "video" ? (
                <video
                    ref={videoRef}
                    src={resolvedVideoSrc}
                    aria-label={videoAltText || undefined}
                    style={mediaStyle}
                    loop
                    muted
                    playsInline
                />
            ) : (
                <img
                    src={resolvedImageSrc}
                    alt={altText}
                    style={imageStyle}
                />
            )}
            <div style={overlayStyle} />
        </div>
    )
}

addPropertyControls(CursorSpotlightReveal, {
    mediaType: {
        type: ControlType.Enum,
        title: "Media",
        options: ["video", "image"],
        optionTitles: ["Video", "Image"],
        displaySegmentedControl: true,
        defaultValue: "video",
    },
    videoSource: {
        type: ControlType.Enum,
        title: "Source",
        options: ["upload", "url"],
        optionTitles: ["Upload", "URL"],
        displaySegmentedControl: true,
        defaultValue: "url",
        hidden: ({ mediaType }) => mediaType !== "video",
    },
    videoFile: {
        type: ControlType.File,
        title: "File",
        allowedFileTypes: ["mp4", "webm", "mov"],
        hidden: ({ mediaType, videoSource }) =>
            mediaType !== "video" || videoSource !== "upload",
    },
    videoUrl: {
        type: ControlType.String,
        title: "URL",
        placeholder: "https://...",
        defaultValue: DEFAULT_VIDEO_URL,
        hidden: ({ mediaType, videoSource }) =>
            mediaType !== "video" || videoSource !== "url",
    },
    videoAltText: {
        type: ControlType.String,
        title: "Alt Text",
        description: "Describes the video for screen readers and assistive technologies.",
        placeholder: "Describe the video...",
        defaultValue: "",
        hidden: ({ mediaType }) => mediaType !== "video",
    },
    imageSource: {
        type: ControlType.Enum,
        title: "Source",
        options: ["upload", "url"],
        optionTitles: ["Upload", "URL"],
        displaySegmentedControl: true,
        defaultValue: "url",
        hidden: ({ mediaType }) => mediaType !== "image",
    },
    imageUpload: {
        type: ControlType.Object,
        title: "Upload",
        buttonTitle: "Image",
        controls: {
            imageFile: {
                type: ControlType.Image,
                title: "Image",
            },
            altText: {
                type: ControlType.String,
                title: "Alt Text",
                placeholder: "Describe the image...",
                defaultValue: "",
            },
        },
        hidden: ({ mediaType, imageSource }) =>
            mediaType !== "image" || imageSource !== "upload",
    },
    imageUrl: {
        type: ControlType.String,
        title: "URL",
        placeholder: "https://...",
        defaultValue: DEFAULT_IMAGE_URL,
        hidden: ({ mediaType, imageSource }) =>
            mediaType !== "image" || imageSource !== "url",
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["fill", "fit"],
        optionTitles: ["Fill", "Fit"],
        displaySegmentedControl: true,
        defaultValue: "fill",
        hidden: ({ mediaType }) => mediaType !== "image",
    },
    spotlightSize: {
        type: ControlType.Number,
        title: "Spotlight Size",
        description: "Diameter of the spotlight area in pixels.",
        defaultValue: 200,
        min: 50,
        max: 1000,
        step: 10,
        unit: "px",
    },
    blur: {
        type: ControlType.Number,
        title: "Spotlight Blur",
        description: "Softness of the spotlight edge. Higher values create a smoother fade.",
        defaultValue: 50,
        min: 0,
        max: 500,
        step: 5,
        unit: "px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        description: "Color of the overlay outside the spotlight area.",
        defaultValue: "#000000",
    },
})