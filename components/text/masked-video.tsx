// Video text masking component with customizable text, video source, and background
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useRef, useEffect, useState, startTransition, type CSSProperties } from "react"

interface TextVideoMaskProps {
    text: string
    videoSource: string
    videoUrl: string
    useVideoUrl: boolean
    backgroundColor: string
    overlayOpacity: number
    font: any
    textAlign: "left" | "center" | "right"
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function TextVideoMask(props: TextVideoMaskProps) {
    const {
        text = "MASKED",
        videoSource = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        videoUrl = "",
        useVideoUrl = false,
        backgroundColor = "#000000",
        overlayOpacity = 0,
        font,
        textAlign = "center"
    } = props

    const videoRef = useRef<HTMLVideoElement>(null)
    const [isVideoLoaded, setIsVideoLoaded] = useState(false)

    // Determine which video source to use
    const finalVideoSource = useVideoUrl && videoUrl ? videoUrl : videoSource

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handleLoadedData = () => {
            startTransition(() => setIsVideoLoaded(true))
        }

        const handleCanPlay = () => {
            video.play().catch(() => {
                // Autoplay failed, but that's okay
            })
        }

        video.addEventListener('loadeddata', handleLoadedData)
        video.addEventListener('canplay', handleCanPlay)
        
        return () => {
            video.removeEventListener('loadeddata', handleLoadedData)
            video.removeEventListener('canplay', handleCanPlay)
        }
    }, [finalVideoSource])

    // Calculate text dimensions based on font size with better accuracy
    const fontSize = parseInt(font?.fontSize || '120')
    
    // Split text into lines for multiline support
    const lines = text.split('\n')
    const lineHeight = font?.lineHeight ? parseFloat(font.lineHeight) * fontSize : fontSize * 1.2
    
    const textWidth = Math.max(Math.max(...lines.map(line => line.length)) * fontSize * 0.8, fontSize * 2)
    const textHeight = lines.length * lineHeight
    
    // Use auto dimensions
    const containerWidth = textWidth
    const containerHeight = textHeight
    const videoWidth = textWidth
    const videoHeight = textHeight
    
    // Create SVG text with multiline support
    const createSVGText = () => {
        const startY = textHeight / 2 - ((lines.length - 1) * lineHeight) / 2
        let textAnchor = "middle"
        let xPosition = "50%"
        
        if (textAlign === "left") {
            textAnchor = "start"
            xPosition = "0%"
        } else if (textAlign === "right") {
            textAnchor = "end"
            xPosition = "100%"
        }
        
        return lines.map((line, index) => 
            `<tspan x="${xPosition}" y="${startY + (index * lineHeight)}" text-anchor="${textAnchor}" dominant-baseline="central">${line}</tspan>`
        ).join('')
    }
    
    return (
        <div
            style={{
                display: "inline-block",
                position: "relative",
                backgroundColor,
                width: containerWidth,
                height: containerHeight,
                ...props.style
            }}
        >
            {/* Video with text mask */}
            <video
                ref={videoRef}
                src={finalVideoSource}
                autoPlay
                loop
                muted
                playsInline
                style={{
                    position: "absolute",
                    top: "0px",
                    left: "0px",
                    width: videoWidth,
                    height: videoHeight,
                    objectFit: "cover",
                    WebkitMask: `url("data:image/svg+xml,${encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${textWidth} ${textHeight}">
                            <text font-family="system-ui, -apple-system, sans-serif" 
                                  font-size="${fontSize}px" 
                                  font-weight="900"
                                  letter-spacing="${font?.letterSpacing || '-0.02em'}"
                                  fill="white">
                                ${createSVGText()}
                            </text>
                        </svg>
                    `)}")`,
                    mask: `url("data:image/svg+xml,${encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${textWidth} ${textHeight}">
                            <text font-family="system-ui, -apple-system, sans-serif" 
                                  font-size="${fontSize}px" 
                                  font-weight="900"
                                  letter-spacing="${font?.letterSpacing || '-0.02em'}"
                                  fill="white">
                                ${createSVGText()}
                            </text>
                        </svg>
                    `)}")`,
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    filter: overlayOpacity > 0 ? `brightness(${1 - (overlayOpacity / 100)})` : "none"
                }}
            />
        </div>
    )
}

addPropertyControls(TextVideoMask, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "MASKED",
        displayTextArea: true
    },
    useVideoUrl: {
        type: ControlType.Boolean,
        title: "Video Source",
        enabledTitle: "URL",
        disabledTitle: "Upload",
        defaultValue: false
    },
    videoSource: {
        type: ControlType.File,
        title: "Upload Video",
        allowedFileTypes: ["mp4", "webm", "mov"],
        hidden: ({ useVideoUrl }) => useVideoUrl
    },
    videoUrl: {
        type: ControlType.String,
        title: "Video URL",
        placeholder: "https://example.com/video.mp4",
        defaultValue: "",
        hidden: ({ useVideoUrl }) => !useVideoUrl
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#000000"
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Video Overlay",
        defaultValue: 0,
        min: 0,
        max: 50,
        step: 1,
        unit: "%"
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "120px",
            variant: "Black",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em"
        },
        controls: "extended",
        defaultFontType: "sans-serif"
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Text Alignment",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true
    }
})