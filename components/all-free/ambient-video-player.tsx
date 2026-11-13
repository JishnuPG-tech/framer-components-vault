// Ambient Mode Glow Effect - A video component with dynamic glow based on video content
import {
    useEffect,
    useRef,
    useState,
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


interface ResponsiveImage {
    src: string
    srcSet?: string
    alt?: string
}

interface AmbientVideoProps {
    videoFile: string
    poster?: ResponsiveImage
    autoplay: boolean
    muted: boolean
    loop: boolean
    controls: boolean
    glowIntensity: number
    glowBlur: number
    glowSpread: number
    borderRadius: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
function AmbientVideo(props: AmbientVideoProps) {
    const {
        videoFile = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        poster,
        autoplay = true,
        muted = true,
        loop = true,
        controls = true,
        glowIntensity = 0.6,
        glowBlur = 40,
        glowSpread = 20,
        borderRadius = 12,
    } = props

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [glowColor, setGlowColor] = useState("rgba(100, 100, 100, 0.3)")
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        if (isStatic) return
        if (!videoRef.current || !canvasRef.current) return

        const video = videoRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")

        if (!ctx) return

        let intervalId: number

        const extractColorFromFrame = (): string | null => {
            if (video.readyState < 2) return null

            try {
                canvas.width = 1
                canvas.height = 1

                ctx.drawImage(video, 0, 0, 1, 1)
                const imageData = ctx.getImageData(0, 0, 1, 1)
                const [r, g, b] = imageData.data

                return `rgba(${r}, ${g}, ${b}, ${glowIntensity})`
            } catch (error) {
                return null
            }
        }

        const updateGlowColor = () => {
            if (video.readyState < 2) return

            const newColor = extractColorFromFrame()
            if (newColor) {
                startTransition(() => {
                    setGlowColor(newColor)
                })
            }
        }

        const startGlowUpdates = () => {
            // Clear any existing interval
            if (intervalId) {
                clearInterval(intervalId)
            }

            // Start immediate extraction
            updateGlowColor()

            // Continue extracting at regular intervals
            intervalId = setInterval(updateGlowColor, 50)
        }

        const stopGlowUpdates = () => {
            if (intervalId) {
                clearInterval(intervalId)
                intervalId = 0
            }
        }

        // Start glow updates as soon as video can play
        const handleCanPlay = () => {
            startGlowUpdates()
        }

        const handlePlay = () => {
            startGlowUpdates()
        }

        const handlePause = () => {
            stopGlowUpdates()
        }

        const handleEnded = () => {
            stopGlowUpdates()
        }

        // Add event listeners
        video.addEventListener("canplay", handleCanPlay)
        video.addEventListener("loadedmetadata", handleCanPlay)
        video.addEventListener("play", handlePlay)
        video.addEventListener("pause", handlePause)
        video.addEventListener("ended", handleEnded)

        // If video is already ready, start immediately
        if (video.readyState >= 3) {
            startGlowUpdates()
        }

        return () => {
            stopGlowUpdates()
            video.removeEventListener("canplay", handleCanPlay)
            video.removeEventListener("loadedmetadata", handleCanPlay)
            video.removeEventListener("play", handlePlay)
            video.removeEventListener("pause", handlePause)
            video.removeEventListener("ended", handleEnded)
        }
    }, [glowIntensity, isStatic])

    const outerContainerStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    }

    const innerContainerStyle: CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius,
        overflow: "visible",
    }

    const videoStyle: CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius,
        zIndex: 1,
        display: "block",
        boxShadow: `0 0 ${glowBlur}px ${glowSpread}px ${glowColor}`,
        transition: "box-shadow 0.4s ease-in-out",
    }

    return (
        <div style={outerContainerStyle}>
            <div style={innerContainerStyle}>
                <video
                    ref={videoRef}
                    src={videoFile}
                    poster={poster?.src || undefined}
                    autoPlay={autoplay && !isStatic}
                    muted={muted}
                    loop={loop}
                    controls={controls}
                    style={videoStyle}
                    playsInline
                    crossOrigin="anonymous"
                />
            </div>
            <canvas
                ref={canvasRef}
                style={{ display: "none" }}
                width={1}
                height={1}
            />
        </div>
    )
}

export default AmbientVideo

addPropertyControls(AmbientVideo, {
    videoFile: {
        type: ControlType.File,
        title: "Video File",
        allowedFileTypes: ["mp4", "webm", "mov"],
    },
    poster: {
        type: ControlType.ResponsiveImage,
        title: "Poster Image",
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
    },
    muted: {
        type: ControlType.Boolean,
        title: "Muted",
        defaultValue: true,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
    },
    controls: {
        type: ControlType.Boolean,
        title: "Show Controls",
        defaultValue: true,
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Intensity",
        defaultValue: 0.6,
        min: 0,
        max: 1,
        step: 0.1,
    },
    glowBlur: {
        type: ControlType.Number,
        title: "Glow Blur",
        defaultValue: 50,
        min: 10,
        max: 100,
        step: 5,
        unit: "px",
    },
    glowSpread: {
        type: ControlType.Number,
        title: "Glow Spread",
        defaultValue: 20,
        min: 0,
        max: 50,
        step: 5,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 12,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
})