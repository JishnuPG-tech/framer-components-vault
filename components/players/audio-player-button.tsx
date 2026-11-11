import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView } from "framer-motion"

/**
 * LIQUID GLASS MUSIC PLAYER (Final Polish)
 * - Added 'Track Color' control for the empty progress bar.
 * - Added inner shadow to progress track for "carved glass" depth.
 */

// --- ICONS ---
const IconArrowLeft = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="m12 19-7-7 7-7" />
        <path d="M19 12H5" />
    </svg>
)
const IconArrowRight = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
    </svg>
)
const IconPlay = ({ fill }) => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill={fill}
        stroke={fill}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
)
const IconPause = ({ fill }) => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill={fill}
        stroke={fill}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
    </svg>
)
const IconMore = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
    </svg>
)

// --- STYLES ---
const LIQUID_SHADOWS = `
    0 0 6px rgba(0,0,0,0.03),
    0 2px 6px rgba(0,0,0,0.08),
    inset 3px 3px 0.5px -3px rgba(255,255,255,0.9),
    inset -3px -3px 0.5px -3px rgba(255,255,255,0.85),
    inset 1px 1px 1px -0.5px rgba(255,255,255,0.6),
    inset -1px -1px 1px -0.5px rgba(255,255,255,0.6),
    inset 0 0 6px 6px rgba(255,255,255,0.12),
    inset 0 0 2px 2px rgba(255,255,255,0.06),
    0 0 12px rgba(255,255,255,0.15)
`

// --- HELPER COMPONENTS ---

const LiquidGlassFilter = ({ id }) => (
    <svg
        style={{
            position: "absolute",
            width: 0,
            height: 0,
            overflow: "hidden",
        }}
    >
        <defs>
            <filter
                id={id}
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
                colorInterpolationFilters="sRGB"
            >
                <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.05 0.05"
                    numOctaves="1"
                    seed="1"
                    result="turbulence"
                />
                <feGaussianBlur
                    in="turbulence"
                    stdDeviation="2"
                    result="blurredNoise"
                />
                <feDisplacementMap
                    in="SourceGraphic"
                    in2="blurredNoise"
                    scale="30"
                    xChannelSelector="R"
                    yChannelSelector="B"
                    result="displaced"
                />
                <feGaussianBlur
                    in="displaced"
                    stdDeviation="1"
                    result="finalBlur"
                />
                <feComposite in="finalBlur" in2="finalBlur" operator="over" />
            </filter>
        </defs>
    </svg>
)

const LiquidButton = ({ children, onClick, color }: any) => {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
                position: "relative",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: color,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    boxShadow: LIQUID_SHADOWS,
                }}
            />
            <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
        </motion.button>
    )
}

const VolumeBars = ({
    isPlaying,
    color,
}: {
    isPlaying: boolean
    color: string
}) => {
    const bars = [0, 1, 2, 3, 4, 5, 6, 7]
    return (
        <div
            style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 2,
                height: 24,
                marginBottom: 6,
            }}
        >
            {bars.map((i) => (
                <motion.div
                    key={i}
                    animate={
                        isPlaying
                            ? { height: [4, 16, 8, 20, 6] }
                            : { height: 6 }
                    }
                    transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: i * 0.1,
                        ease: "linear",
                    }}
                    style={{
                        width: 3,
                        borderRadius: 2,
                        backgroundColor: color,
                    }}
                />
            ))}
        </div>
    )
}

const ProgressBar = ({
    currentTime,
    totalDuration,
    onSeek,
    tintColor,
    textColor,
    trackColor,
}: any) => {
    const safeDuration = totalDuration > 0 ? totalDuration : 1
    const progress = (currentTime / safeDuration) * 100
    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00"
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, "0")}`
    }
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (totalDuration <= 0) return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        onSeek((x / rect.width) * totalDuration)
    }

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 8,
            }}
        >
            {/* PROGRESS TRACK CONTAINER */}
            <div
                onClick={handleClick}
                style={{
                    position: "relative",
                    height: 8, // Slightly thicker for better visibility
                    width: "100%",
                    backgroundColor: trackColor, // User defined color
                    borderRadius: 99,
                    cursor: "pointer",
                    overflow: "hidden",
                    // This inset shadow gives it the "carved" look
                    boxShadow:
                        "inset 0 1px 3px rgba(0,0,0,0.15), inset 0 0 0 0.5px rgba(0,0,0,0.05)",
                }}
            >
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{
                        height: "100%",
                        backgroundColor: tintColor,
                        borderRadius: 99,
                        boxShadow: "0 0 10px rgba(0,0,0,0.1)", // Slight glow on the fill
                    }}
                />
            </div>
        </div>
    )
}

const IconVolume = ({ size = 24 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
)

const IconVolumeMute = ({ size = 24 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
)

// --- MAIN COMPONENT ---

/**
 * MUTE/UNMUTE BUTTON
 * - Single circular button to toggle audio mute/unmute
 * - Customizable shadow
 *
 * @framerIntrinsicWidth 80
 * @framerIntrinsicHeight 80
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */

export default function SimpleAudioPlayer(props) {
    const {
        audioFile,
        buttonColor,
        backgroundColor,
        borderWidth,
        borderColor,
        borderStyle,
        shadowBlur,
        shadowSpread,
        shadowColor,
        shadowX,
        shadowY,
        defaultMuted,
        fadeDuration,
        iconSize,
    } = props

    const audioRef = React.useRef<HTMLAudioElement>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [isMuted, setIsMuted] = React.useState(defaultMuted)
    const fadeIntervalRef = React.useRef<number | null>(null)
    const isInView = useInView(containerRef, { amount: 0.5 })

    // Ensure audio loops and set initial muted state
    React.useEffect(() => {
        if (!audioRef.current) return
        audioRef.current.loop = true
        audioRef.current.muted = defaultMuted
        audioRef.current.volume = defaultMuted ? 0 : 1
        setIsMuted(defaultMuted)
    }, [defaultMuted])

    // Cleanup fade interval on unmount
    React.useEffect(() => {
        return () => {
            if (fadeIntervalRef.current !== null) {
                clearInterval(fadeIntervalRef.current)
            }
        }
    }, [])

    const fadeVolume = (targetVolume: number, duration: number) => {
        if (!audioRef.current) return

        // Clear any existing fade
        if (fadeIntervalRef.current !== null) {
            clearInterval(fadeIntervalRef.current)
        }

        const audio = audioRef.current
        const startVolume = audio.volume
        const volumeDiff = targetVolume - startVolume
        const steps = 50 // Number of steps for smooth fade
        const stepDuration = duration / steps
        const volumeStep = volumeDiff / steps
        let currentStep = 0

        fadeIntervalRef.current = window.setInterval(() => {
            currentStep++
            if (currentStep >= steps) {
                audio.volume = targetVolume
                if (fadeIntervalRef.current !== null) {
                    clearInterval(fadeIntervalRef.current)
                    fadeIntervalRef.current = null
                }
                // If fading out, pause after fade completes
                if (targetVolume === 0) {
                    audio.pause()
                }
            } else {
                audio.volume = Math.max(0, Math.min(1, startVolume + volumeStep * currentStep))
            }
        }, stepDuration)
    }

    const toggleMute = () => {
        if (!audioRef.current) return
        const newMutedState = !isMuted
        setIsMuted(newMutedState)
        
        if (newMutedState) {
            // Muting - fade out then pause
            fadeVolume(0, fadeDuration)
        } else {
            // Unmuting - play then fade in
            audioRef.current.muted = false
            audioRef.current.play().catch(err => {
                console.log("Audio play failed:", err)
            })
            fadeVolume(1, fadeDuration)
        }
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <audio ref={audioRef} src={audioFile} />

            <motion.button
                onClick={toggleMute}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    border: `${borderWidth}px ${borderStyle} ${borderColor}`,
                    background: backgroundColor,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: buttonColor,
                    borderRadius: "50%",
                    boxShadow: `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor}`,
                }}
            >
                <div style={{ position: "relative", zIndex: 2 }}>
                    {isMuted ? <IconVolumeMute size={iconSize} /> : <IconVolume size={iconSize} />}
                </div>
            </motion.button>
        </div>
    )
}

addPropertyControls(SimpleAudioPlayer, {
    audioFile: {
        type: ControlType.File,
        allowedFileTypes: ["mp3", "wav", "aac"],
        title: "Audio",
    },
    defaultMuted: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Default State",
        enabledTitle: "Muted",
        disabledTitle: "Unmuted",
    },
    fadeDuration: {
        type: ControlType.Number,
        defaultValue: 500,
        min: 0,
        max: 3000,
        step: 100,
        title: "Fade Duration",
        unit: "ms",
    },
    iconSize: {
        type: ControlType.Number,
        defaultValue: 24,
        min: 12,
        max: 64,
        step: 1,
        title: "Icon Size",
        unit: "px",
    },
    buttonColor: {
        type: ControlType.Color,
        defaultValue: "#333333",
        title: "Icon Color",
    },
    backgroundColor: {
        type: ControlType.Color,
        defaultValue: "#FFFFFF",
        title: "Background",
    },
    borderWidth: {
        type: ControlType.Number,
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 1,
        title: "Border Width",
        unit: "px",
    },
    borderColor: {
        type: ControlType.Color,
        defaultValue: "#000000",
        title: "Border Color",
    },
    borderStyle: {
        type: ControlType.Enum,
        defaultValue: "solid",
        options: ["solid", "dashed", "dotted"],
        optionTitles: ["Solid", "Dashed", "Dotted"],
        title: "Border Style",
    },
    shadowX: {
        type: ControlType.Number,
        defaultValue: 0,
        min: -50,
        max: 50,
        step: 1,
        title: "Shadow X",
        unit: "px",
    },
    shadowY: {
        type: ControlType.Number,
        defaultValue: 4,
        min: -50,
        max: 50,
        step: 1,
        title: "Shadow Y",
        unit: "px",
    },
    shadowBlur: {
        type: ControlType.Number,
        defaultValue: 10,
        min: 0,
        max: 100,
        step: 1,
        title: "Shadow Blur",
        unit: "px",
    },
    shadowSpread: {
        type: ControlType.Number,
        defaultValue: 0,
        min: -50,
        max: 50,
        step: 1,
        title: "Shadow Spread",
        unit: "px",
    },
    shadowColor: {
        type: ControlType.Color,
        defaultValue: "rgba(0,0,0,0.1)",
        title: "Shadow Color",
    },
})
