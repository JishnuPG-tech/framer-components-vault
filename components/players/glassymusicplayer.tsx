// Apple-style GlassyMusicPlayer with glassmorphism, SF-style icons, and interactive controls.
import {
    useState,
    useRef,
    useEffect,
    useMemo,
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


/**
 * Apple Music Pill Player (Glassmorphism)
 *
 * Modern, glassy, interactive music player pill with Apple-inspired look.
 *
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 120
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function GlassyMusicPlayer(props) {
    // Glassmorphism defaults
    const glassBg = useMemo(
        () =>
            "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(120,140,255,0.16) 35%, rgba(40,45,60,0.7) 100%)",
        []
    )
    const {
        albumCover = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Album Cover",
        },
        songTitle = "Apple Music",
        artistName = "Framer Artists",
        // removed external progress & duration props; now driven by audio element
        autoplay = false,
        // new audio file prop
        audioFile = "https://framerusercontent.com/assets/8w3IUatLX9a5JVJ6XPCVuHi94.mp3",
        backgroundColor = "rgba(40, 45, 54, 0.7)",
        blur = 18,
        shadowColor = "rgba(0,0,0,0.25)",
        shadowBlur = 40,
        shadowSpread = 0,
        shadowX = 0,
        shadowY = 12,
        barColor = "#fff",
        barBG = "rgba(255,255,255,0.12)",
        radius = 32,
        iconColor = "#fff",
        textColor = "#fff",
        subTextOpacity = 0.65,
        style,
        fontSong,
        fontArtist,
        // width for responsive layout
        // ... existing code ...
    } = props

    // For play state
    const isStatic = useIsStaticRenderer()
    const [isPlaying, setIsPlaying] = useState(autoplay)
    const [internalProgress, setInternalProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const audioRef = useRef(null)
    const titleContainerRef = useRef<HTMLDivElement | null>(null)
    const titleTextRef = useRef<HTMLSpanElement | null>(null)
    const [shouldScrollTitle, setShouldScrollTitle] = useState(false)

    // Sync autoplay into play state when mounted
    useEffect(() => {
        if (isStatic) return
        if (autoplay) {
            startTransition(() => setIsPlaying(true))
        }
    }, [autoplay, isStatic])

    // Control actual audio playback when isPlaying changes
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return
        if (isStatic) return
        if (isPlaying) {
            const playPromise = audio.play()
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(() => {
                    // ignore play interruption
                })
            }
        } else {
            audio.pause()
        }
    }, [isPlaying, isStatic])

    // Attach audio element event listeners for time/duration updates
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handleLoaded = () => {
            const d = isFinite(audio.duration) ? audio.duration : 0
            startTransition(() => {
                setDuration(d)
                setInternalProgress(audio.currentTime || 0)
            })
        }

        const handleTimeUpdate = () => {
            startTransition(() => setInternalProgress(audio.currentTime || 0))
        }

        const handleEnded = () => {
            startTransition(() => {
                setIsPlaying(false)
                setInternalProgress(audio.duration || 0)
            })
        }

        audio.addEventListener("loadedmetadata", handleLoaded)
        audio.addEventListener("timeupdate", handleTimeUpdate)
        audio.addEventListener("ended", handleEnded)

        // reset when source changes
        startTransition(() => {
            setDuration(isFinite(audio.duration) ? audio.duration : 0)
            setInternalProgress(audio.currentTime || 0)
        })

        return () => {
            audio.removeEventListener("loadedmetadata", handleLoaded)
            audio.removeEventListener("timeupdate", handleTimeUpdate)
            audio.removeEventListener("ended", handleEnded)
        }
    }, [audioFile])

    // Measure title width vs container to decide if marquee scrolling is needed
    useEffect(() => {
        if (typeof window === "undefined") return
        const container = titleContainerRef.current
        const text = titleTextRef.current
        if (!container || !text) return

        const measure = () => {
            const containerWidth = container.getBoundingClientRect().width
            const textWidth = text.getBoundingClientRect().width
            const needsScroll = textWidth > containerWidth + 1
            startTransition(() => setShouldScrollTitle(needsScroll))
        }

        measure()
        window.addEventListener("resize", measure)
        return () => {
            window.removeEventListener("resize", measure)
        }
    }, [songTitle])

    // Toggle play/pause
    function togglePlay() {
        startTransition(() => setIsPlaying((p) => !p))
    }
    // Previous/Next jump (5s)
    function handlePrev() {
        const audio = audioRef.current
        if (audio) {
            const nextTime = Math.max(0, (audio.currentTime || 0) - 5)
            audio.currentTime = nextTime
            startTransition(() => setInternalProgress(nextTime))
        } else {
            startTransition(() => setInternalProgress((p) => Math.max(0, p - 5)))
        }
    }
    function handleNext() {
        const audio = audioRef.current
        if (audio) {
            const nextTime = Math.min(duration || 0, (audio.currentTime || 0) + 5)
            audio.currentTime = nextTime
            startTransition(() => setInternalProgress(nextTime))
        } else {
            startTransition(() => setInternalProgress((p) => Math.min(duration || 0, p + 5)))
        }
    }

    // Progress bar width
    const progressPercent = duration ? Math.min(100, 100 * (internalProgress / duration)) : 0
    // Format time mm:ss
    const formatTime = (s) => {
        const m = Math.floor(s / 60)
        const sec = Math.floor(s % 60)
        return `${m}:${sec < 10 ? "0" : ""}${sec}`
    }
    // Shadow
    const shadow = useMemo(() => {
        return `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor}`
    }, [shadowX, shadowY, shadowBlur, shadowSpread, shadowColor])
    // Variants: dark-optimized
    // Use white text, white icons, dark glass
    // Border
    const border = `1.5px solid rgba(255,255,255,0.18)`
    // Glass overlay
    const frostedGlass: CSSProperties = {
        background: `${backgroundColor || "rgba(20, 22, 30, 0.4)"}`,
        backgroundImage:
            "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.24) 0, transparent 40%)," +
            "radial-gradient(circle at 100% 0%, rgba(160,190,255,0.18) 0, transparent 45%)," +
            "radial-gradient(circle at 10% 100%, rgba(255,140,200,0.14) 0, transparent 55%)",
        backdropFilter: `blur(${Math.max(18, blur)}px) saturate(1.4)`,
        WebkitBackdropFilter: `blur(${Math.max(18, blur)}px) saturate(1.4)`,
        borderRadius: radius,
        border: `1.2px solid rgba(255,255,255,0.32)`,
        boxShadow: shadow,
        overflow: "visible",
        minHeight: 88,
        display: "flex",
        alignItems: "center",
        padding: 0,
        position: "relative",
        ...style,
    }

    // Sizing for pill
    const pillWidth = 420
    const pillHeight = 128
    const albumSize = pillHeight - 24 * 2 // match right panel height inside padding
    const iconSize = 26
    const iconBtnSize = 36 // pill/circle
    const gap = 18

    // Responsive: compact if width < 350 (disabled, fixed size pill)
    const isCompact = false

    // Anim. Compact/progress row
    // SF Symbols-style minimal icons (inline SVG)
    function ControlButton({
        onClick,
        children,
        ariaLabel,
        tabIndex = 0,
        style: extra,
        bg,
        shadow,
        disabled,
    }) {
        // glass blur and animation
        const [hovered, setHovered] = useState(false)
        const [pressed, setPressed] = useState(false)
        return (
            <button
                aria-label={ariaLabel}
                disabled={disabled}
                onClick={onClick}
                onMouseDown={() => startTransition(() => setPressed(true))}
                onMouseUp={() => startTransition(() => setPressed(false))}
                onMouseLeave={() => startTransition(() => setPressed(false))}
                onMouseEnter={() => setHovered(true)}
                onMouseOut={() => setHovered(false)}
                tabIndex={tabIndex}
                style={{
                    margin: 0,
                    background: bg || "rgba(255,255,255,0.18)",
                    border: "none",
                    outline: "none",
                    borderRadius: 99,
                    width: iconBtnSize,
                    height: iconBtnSize,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: disabled ? "default" : "pointer",
                    boxShadow: shadow ? "0 2px 16px 0 rgba(0,0,0,0.12), 0 0 0.5px 0.5px rgba(255,255,255,0.13)" : "none",
                    transition: "box-shadow 0.14s, background 0.15s, filter 0.12s, transform 0.12s",
                    filter: hovered ? "brightness(1.16) saturate(1.13)" : "none",
                    transform: pressed ? "scale(0.92)" : "scale(1)",
                    borderWidth: hovered ? "1.5px" : "1px",
                    borderStyle: "solid",
                    borderColor: hovered ? "rgba(255,255,255,0.23)" : "rgba(255,255,255,0.17)",
                    ...extra,
                }}
            >
                {children}
            </button>
        )
    }
    // New chevron.circle SF Symbol icons for prev/next
    function PrevIcon() {
        return (
            <svg width={iconSize} height={iconSize} aria-hidden="true" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" fill="rgba(255,255,255,0.19)"/>
                <path d="M17.5 19L12.5 14L17.5 9" stroke={iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        )
    }
    function NextIcon() {
        return (
            <svg width={iconSize} height={iconSize} aria-hidden="true" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" fill="rgba(255,255,255,0.19)"/>
                <path d="M10.5 9L15.5 14L10.5 19" stroke={iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        )
    }
    function PlayPauseIcon() {
        return isPlaying ? (
            <svg width={iconSize+4} height={iconSize+4} viewBox="0 0 32 32" aria-hidden="true" fill="none">
                <circle cx="16" cy="16" r="15" fill="rgba(255,255,255,0.23)" />
                <rect x="11" y="10" width="3.5" height="12" rx="1" fill={iconColor} />
                <rect x="17.5" y="10" width="3.5" height="12" rx="1" fill={iconColor} />
            </svg>
        ) : (
            <svg width={iconSize+4} height={iconSize+4} viewBox="0 0 32 32" aria-hidden="true" fill="none">
                <circle cx="16" cy="16" r="15" fill="rgba(255,255,255,0.23)" />
                <polygon points="12,10 12,22 22,16" fill={iconColor} />
            </svg>
        )
    }

    // --- MAIN RETURN ---
    return (
        <div
            style={{
                ...frostedGlass,
                width: pillWidth,
                height: pillHeight,
                minHeight: pillHeight,
                maxHeight: pillHeight,
                justifyContent: "flex-start",
                flexDirection: "row",
                transition:
                    "min-height 0.3s, max-height 0.3s, padding 0.28s, width 0.3s, height 0.3s",
                boxSizing: "border-box",
            }}
        >
            <style>
                {`@keyframes glassy-music-player-marquee {
                    0% { transform: translateX(0); }
                    10% { transform: translateX(0); }
                    90% { transform: translateX(-50%); }
                    100% { transform: translateX(-50%); }
                }`}
            </style>
            {/* Vignette overlay for depth */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    borderRadius: radius,
                    zIndex: 1,
                    background:
                        "radial-gradient(ellipse at 60% 85%, rgba(255,255,255,0.10) 0%, rgba(70,70,120,0.14) 42%, transparent 100%)",
                    boxShadow:
                        "inset 0 0 0 0.5px rgba(255,255,255,0.18), inset 0 18px 36px rgba(255,255,255,0.08)",
                }}
            />

            {/* Inner content container with consistent padding to avoid clipping against rounded edges */}
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    width: "100%",
                    height: "100%",
                    padding: isCompact ? "11px 24px" : "20px 24px 20px 24px",
                    boxSizing: "border-box",
                    gap: 22,
                }}
            >
                {/* Left Column: Album Cover */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        minHeight: albumSize,
                        minWidth: albumSize,
                        flexShrink: 0,
                    }}
                >
                    <img
                        {...albumCover}
                        alt="album cover"
                        style={{
                            width: albumSize,
                            height: albumSize,
                            borderRadius: 14,
                            objectFit: "cover",
                            background: "#262633",
                            boxShadow: "0 1.6px 7px rgba(0,0,0,0.17)",
                            userSelect: "none",
                            display: "block",
                        }}
                        draggable={false}
                    />
                </div>

                {/* Right Columns: Top Row (Title, Artist, Controls) & Bottom Row (Progress) */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        gap: 6,
                        flex: 1,
                        height: "100%",
                        minHeight: albumSize,
                        minWidth: 0,
                    }}
                >
                    {/* Top Row: Title, Artist, Controls */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            width: "100%",
                            gap: gap,
                            zIndex: 2,
                            minWidth: 0,
                        }}
                    >
                        {/* TextBlock */}
                        <div
                            style={{
                                flex: 1,
                                minWidth: 0,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                gap: 3,
                                position: "relative",
                                minHeight: 40,
                            }}
                        >
                            <div style={{ width: "100%", overflow: "hidden" }} ref={titleContainerRef}>
                                <div
                                    style={{
                                        color: textColor,
                                        fontWeight: 700,
                                        fontSize: fontSong?.fontSize || 18,
                                        letterSpacing: fontSong?.letterSpacing || "-0.01em",
                                        lineHeight: fontSong?.lineHeight || "1.18em",
                                        fontVariant: fontSong?.variant,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        ...fontSong,
                                        userSelect: "none",
                                    }}
                                    aria-label="Song Title"
                                >
                                    <span
                                        ref={titleTextRef}
                                        style={{
                                            display: "inline-block",
                                            paddingRight: shouldScrollTitle ? 64 : 0,
                                            animation: shouldScrollTitle && !isStatic ? "glassy-music-player-marquee 12s linear infinite 1.2s" : "none",
                                        }}
                                    >
                                        {songTitle}
                                    </span>
                                </div>
                            </div>
                            <div
                                style={{
                                    color: textColor,
                                    opacity: subTextOpacity,
                                    fontWeight: 400,
                                    fontSize: fontArtist?.fontSize || 14,
                                    letterSpacing: fontArtist?.letterSpacing || "-0.01em",
                                    lineHeight: fontArtist?.lineHeight || "1.18em",
                                    marginTop: 1,
                                    whiteSpace: "nowrap",
                                    textOverflow: "ellipsis",
                                    overflow: "hidden",
                                    ...fontArtist,
                                    userSelect: "none",
                                }}
                                aria-label="Artist Name"
                            >
                                {artistName}
                            </div>
                        </div>
                        {/* Controls/Buttons in fixed-width, right-aligned frame with internal right padding */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                gap: 8,
                                flexShrink: 0,
                                paddingRight: 4,
                                minWidth: 0,
                            }}
                        >
                            <ControlButton
                                ariaLabel="Previous"
                                onClick={handlePrev}
                                shadow={true}
                                style={{}}
                                bg={undefined}
                                disabled={undefined}
                            >
                                <PrevIcon />
                            </ControlButton>
                            <ControlButton
                                ariaLabel={isPlaying ? "Pause" : "Play"}
                                onClick={togglePlay}
                                bg="rgba(255,255,255,0.26)"
                                shadow={true}
                                style={{}}
                                disabled={undefined}
                            >
                                <PlayPauseIcon />
                            </ControlButton>
                            <ControlButton
                                ariaLabel="Next"
                                onClick={handleNext}
                                shadow={true}
                                style={{}}
                                bg={undefined}
                                disabled={undefined}
                            >
                                <NextIcon />
                            </ControlButton>
                        </div>
                    </div>

                    {/* Bottom Row: progress bar + time */}
                    <div
                        aria-label="Progress Bar Row"
                        style={{
                            transition: "opacity 0.28s, max-height 0.28s",
                            opacity: 1,
                            maxHeight: 42,
                            minHeight: 0,
                            pointerEvents: "auto",
                            overflow: "hidden",
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            position: "relative",
                            zIndex: 3,
                            gap: 0,
                            marginTop: 4,
                        }}
                    >
                        <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, position: "relative", height: 13 }}>
                            <div
                                aria-label="Current Time"
                                style={{
                                    fontSize: 11,
                                    color: textColor,
                                    opacity: 0.64,
                                    fontWeight: 500,
                                    letterSpacing: "-0.01em",
                                    userSelect: "none",
                                    minWidth: 34,
                                    textAlign: "left",
                                    zIndex: 3,
                                }}
                            >
                                {formatTime(internalProgress)}
                            </div>
                            <div
                                style={{
                                    position: "relative",
                                    flex: 1,
                                    height: 8,
                                    background: barBG,
                                    borderRadius: 5,
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        width: `${progressPercent}%`,
                                        height: 8,
                                        background: `linear-gradient(90deg, rgba(255,255,255,0.9), ${barColor})`,
                                        borderRadius: 6,
                                        transition: "width 0.27s cubic-bezier(.4,1,.7,1)",
                                        boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                                        zIndex: 2,
                                    }}
                                />
                            </div>
                            <div
                                aria-label="Total Duration"
                                style={{
                                    fontSize: 11,
                                    color: textColor,
                                    opacity: 0.62,
                                    fontWeight: 400,
                                    letterSpacing: "-0.01em",
                                    userSelect: "none",
                                    minWidth: 34,
                                    textAlign: "right",
                                    zIndex: 3,
                                }}
                            >
                                {formatTime(duration)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden audio element driving playback */}
            <audio
                ref={audioRef}
                src={audioFile}
                preload="metadata"
                style={{ display: "none" }}
            />
        </div>
    )
}

addPropertyControls(GlassyMusicPlayer, {
    albumCover: {
        type: ControlType.ResponsiveImage,
        title: "Album Cover",
    },
    songTitle: {
        type: ControlType.String,
        title: "Song Title",
        defaultValue: "Apple Music",
        placeholder: "Song Title",
    },
    artistName: {
        type: ControlType.String,
        title: "Artist Name",
        defaultValue: "Framer Artists",
        placeholder: "Artist Name",
    },
    // removed manual progress and duration controls; progress is now driven by audio
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
    },
    audioFile: {
        type: ControlType.File,
        title: "Audio File",
        allowedFileTypes: ["mp3", "wav", "ogg"],
    },
    // Glass options
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(40, 45, 54, 0.7)",
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        min: 6,
        max: 40,
        defaultValue: 18,
        step: 1,
        displayStepper: false,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 14,
        max: 44,
        defaultValue: 32,
        step: 2,
    },
    barColor: {
        type: ControlType.Color,
        title: "Progress Color",
        defaultValue: "#fff",
    },
    barBG: {
        type: ControlType.Color,
        title: "Bar Background",
        defaultValue: "rgba(255,255,255,0.12)",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "rgba(0,0,0,0.25)",
    },
    shadowX: {
        type: ControlType.Number,
        title: "Shadow X",
        defaultValue: 0,
        min: -50,
        max: 50,
        step: 1,
        unit: "px",
    },
    shadowY: {
        type: ControlType.Number,
        title: "Shadow Y",
        defaultValue: 12,
        min: -50,
        max: 100,
        step: 1,
        unit: "px",
    },
    shadowBlur: {
        type: ControlType.Number,
        title: "Shadow Blur",
        defaultValue: 40,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    shadowSpread: {
        type: ControlType.Number,
        title: "Shadow Spread",
        defaultValue: 0,
        min: -20,
        max: 50,
        step: 1,
        unit: "px",
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon",
        defaultValue: "#fff",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#fff",
    },
    fontSong: {
        type: ControlType.Font,
        title: "Song Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            variant: "Semibold",
            fontSize: "18px",
            letterSpacing: "-0.01em",
            lineHeight: "1.18em",
        },
    },
    fontArtist: {
        type: ControlType.Font,
        title: "Artist Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            variant: "Regular",
            fontSize: "14px",
            letterSpacing: "-0.01em",
            lineHeight: "1.18em",
        },
    },
})
