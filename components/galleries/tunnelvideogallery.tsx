// 3D Tunnel Video Gallery - Multiple video streams flying toward viewer with perspective
import { useEffect, useRef, useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useAnimation } from "framer-motion"

interface VideoStream {
    videoUrl: string
    lane: "left" | "center" | "right"
    duration: number
    delay: number
    link?: string
}

interface TunnelVideoGalleryProps {
    title: string
    titleFont: CSSProperties
    titleColor: string
    glowColor: string
    backgroundColor: string
    videos: VideoStream[]
    style?: CSSProperties
}

/**
 * 3D Tunnel Video Gallery
 * 
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function TunnelVideoGallery(props: TunnelVideoGalleryProps) {
    const {
        title = "VIDEO GALLERY",
        titleFont,
        titleColor = "#00FFFF",
        glowColor = "#00FFFF",
        backgroundColor = "#000000",
        videos = [
            {
                videoUrl: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                lane: "center",
                duration: 8,
                delay: 0
            },
            {
                videoUrl: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                lane: "left",
                duration: 10,
                delay: 2
            },
            {
                videoUrl: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                lane: "right",
                duration: 9,
                delay: 4
            }
        ]
    } = props

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                backgroundColor,
                overflow: "hidden",
                perspective: "1000px",
                perspectiveOrigin: "50% 50%"
            }}
        >
            {/* Video Streams */}
            {videos.map((video, index) => (
                <VideoStream
                    key={index}
                    videoUrl={video.videoUrl}
                    lane={video.lane}
                    duration={video.duration}
                    delay={video.delay}
                    link={video.link}
                />
            ))}

            {/* Title Overlay */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 100,
                    pointerEvents: "none",
                    textAlign: "center",
                    width: "80%"
                }}
            >
                <h1
                    style={{
                        margin: 0,
                        color: titleColor,
                        textShadow: `
                            0 0 10px ${glowColor},
                            0 0 20px ${glowColor},
                            0 0 30px ${glowColor},
                            0 0 40px ${glowColor}
                        `,
                        ...titleFont,
                        whiteSpace: "nowrap"
                    }}
                >
                    {title}
                </h1>
            </div>
        </div>
    )
}

interface VideoStreamProps {
    videoUrl: string
    lane: "left" | "center" | "right"
    duration: number
    delay: number
    link?: string
}

function VideoStream({ videoUrl, lane, duration, delay, link }: VideoStreamProps) {
    const [isHovered, setIsHovered] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const controls = useAnimation()

    // Lane positioning
    const laneOffset = {
        left: -30,
        center: 0,
        right: 30
    }

    // Perspective rotation based on lane
    const laneRotation = {
        left: -15,
        center: 0,
        right: 15
    }

    // Add slight random variation for organic feel
    const randomVariation = useRef(Math.random() * 0.3 - 0.15).current

    useEffect(() => {
        const animate = async () => {
            await controls.start({
                scale: [0.1, 2.5],
                z: [-2000, 100],
                opacity: [0, 1, 1, 0],
                transition: {
                    duration: duration * (1 + randomVariation),
                    delay,
                    repeat: Infinity,
                    ease: "linear",
                    repeatDelay: 0
                }
            })
        }

        if (!isHovered) {
            animate()
        } else {
            controls.stop()
        }
    }, [controls, duration, delay, isHovered, randomVariation])

    // Video playback control
    useEffect(() => {
        if (videoRef.current) {
            if (isHovered) {
                videoRef.current.pause()
            } else {
                videoRef.current.play().catch(() => {
                    // Autoplay might be blocked
                })
            }
        }
    }, [isHovered])

    const handleClick = () => {
        if (link) {
            window.open(link, "_blank", "noopener,noreferrer")
        }
    }

    const content = (
        <motion.div
            animate={controls}
            style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "400px",
                height: "225px",
                x: `${laneOffset[lane]}%`,
                y: "-50%",
                transformStyle: "preserve-3d",
                cursor: link ? "pointer" : "default",
                willChange: "transform"
            }}
            onMouseEnter={() => startTransition(() => setIsHovered(true))}
            onMouseLeave={() => startTransition(() => setIsHovered(false))}
            onClick={handleClick}
        >
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    transform: `rotateY(${laneRotation[lane]}deg)`,
                    transformStyle: "preserve-3d",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: isHovered
                        ? "0 0 40px rgba(0, 255, 255, 0.6)"
                        : "0 10px 40px rgba(0, 0, 0, 0.5)",
                    transition: "box-shadow 0.3s ease",
                    border: isHovered ? "2px solid rgba(0, 255, 255, 0.8)" : "2px solid rgba(255, 255, 255, 0.1)"
                }}
            >
                <video
                    ref={videoRef}
                    src={videoUrl}
                    loop
                    muted
                    playsInline
                    autoPlay
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block"
                    }}
                />
            </div>
        </motion.div>
    )

    return content
}

addPropertyControls(TunnelVideoGallery, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "VIDEO GALLERY"
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "64px",
            variant: "Extra Bold",
            letterSpacing: "0.1em",
            lineHeight: "1em"
        }
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#00FFFF"
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "#00FFFF"
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000"
    },
    videos: {
        type: ControlType.Array,
        title: "Video Streams",
        control: {
            type: ControlType.Object,
            controls: {
                videoUrl: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"]
                },
                link: {
                    type: ControlType.Link,
                    title: "Link URL"
                },
                lane: {
                    type: ControlType.Enum,
                    title: "Lane",
                    options: ["left", "center", "right"],
                    optionTitles: ["Left", "Center", "Right"],
                    defaultValue: "center",
                    displaySegmentedControl: true
                },
                duration: {
                    type: ControlType.Number,
                    title: "Duration",
                    defaultValue: 8,
                    min: 3,
                    max: 20,
                    step: 0.5,
                    unit: "s"
                },
                delay: {
                    type: ControlType.Number,
                    title: "Delay",
                    defaultValue: 0,
                    min: 0,
                    max: 10,
                    step: 0.5,
                    unit: "s"
                }
            }
        },
        defaultValue: [
            {
                videoUrl: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                lane: "center",
                duration: 8,
                delay: 0
            },
            {
                videoUrl: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                lane: "left",
                duration: 10,
                delay: 2
            },
            {
                videoUrl: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                lane: "right",
                duration: 9,
                delay: 4
            }
        ],
        maxCount: 10
    }
})
