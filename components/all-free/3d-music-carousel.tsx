import React, { useState, useCallback, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Track {
    id: string
    title: string
    artist: string
    cover?: {
        src?: string
        srcSet?: string
        alt?: string
    }
    audioFile?: string
}

interface MusicCarouselProps {
    tracks: Track[]
    cardWidth: number
    cardHeight: number
    sideScale: number
    centerScale: number
    perspective: number
    gap: number
    reflection: {
        opacity: number
        blur: number
        height: number
    }
    colors: {
        backgroundColor: string
        textColor: string
        overlayColor: string
        navigationColor: string
    }
    artistFont: any
    titleFont: any
    showNavigation: boolean
    autoPlay: boolean
    autoPlayInterval: number
    borderRadius: number
    rotateY: number
    playButtonStyle: "light" | "dark"
}

const defaultImages = [
    { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Album 1" },
    { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Album 2" },
    { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Album 3" },
    { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Album 4" },
    { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Album 5" },
]

const defaultTracks: Track[] = [
    { id: "1", title: "Midnight Dreams", artist: "Luna Eclipse" },
    { id: "2", title: "Neon Nights", artist: "Cyber Pulse" },
    { id: "3", title: "Golden Hour", artist: "Sunset Collective" },
    { id: "4", title: "Deep Space", artist: "Cosmic Drift" },
    { id: "5", title: "Forest Echoes", artist: "Nature's Voice" },
]

/**
 * 3D Music Player Carousel with realistic reflections and V-shaped perspective
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 500
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function MusicCarousel(props: MusicCarouselProps) {
    const {
        tracks: tracksProp,
        cardWidth = 280,
        cardHeight = 280,
        sideScale = 0.6,
        centerScale = 1,
        perspective = 1200,
        gap = 80,
        reflection = { opacity: 0.4, blur: 4, height: 80 },
        colors = {
            backgroundColor: "#0a0a0a",
            textColor: "#ffffff",
            overlayColor: "rgba(0,0,0,0.7)",
            navigationColor: "#ffffff",
        },
        artistFont,
        titleFont,
        showNavigation = true,
        autoPlay = false,
        autoPlayInterval = 4000,
        borderRadius = 16,
        rotateY = 35,
        playButtonStyle = "light",
    } = props

    // Merge tracks with default images
    const tracks: Track[] = React.useMemo(() => {
        const inputTracks = tracksProp?.length > 0 ? tracksProp : defaultTracks
        return inputTracks.map((track, index) => ({
            ...track,
            cover: track.cover?.src ? track.cover : defaultImages[index % defaultImages.length],
        }))
    }, [tracksProp])

    const [currentIndex, setCurrentIndex] = useState(0)
    const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay)
    const [isPlaying, setIsPlaying] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const wasPlayingRef = useRef<boolean>(false)
    const dragStartXRef = useRef<number>(0)

    // Auto-play functionality
    useEffect(() => {
        if (!isAutoPlaying) return
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % tracks.length)
        }, autoPlayInterval)
        return () => clearInterval(interval)
    }, [isAutoPlaying, autoPlayInterval, tracks.length])

    // Update audio when track changes
    useEffect(() => {
        // Store current playing state before changing tracks
        const shouldAutoPlay = wasPlayingRef.current
        
        if (audioRef.current) {
            audioRef.current.pause()
            setIsPlaying(false)
        }
        
        const currentTrack = tracks[currentIndex]
        if (currentTrack?.audioFile) {
            audioRef.current = new Audio(currentTrack.audioFile)
            audioRef.current.addEventListener('ended', () => setIsPlaying(false))
            
            // If previous track was playing, auto-play the new track
            if (shouldAutoPlay) {
                audioRef.current.play().catch(() => {})
                setIsPlaying(true)
            }
        }
        
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.removeEventListener('ended', () => setIsPlaying(false))
            }
        }
    }, [currentIndex, tracks])

    const navigateTo = useCallback((index: number) => {
        setCurrentIndex(index)
    }, [])

    const goToPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + tracks.length) % tracks.length)
    }, [tracks.length])

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % tracks.length)
    }, [tracks.length])

    const handleDragEnd = useCallback((event: any, info: any) => {
        const { offset, velocity } = info
        const swipeThreshold = 50
        const swipeVelocityThreshold = 500

        // Determine if swipe was significant enough
        const shouldNavigate = Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > swipeVelocityThreshold

        if (shouldNavigate) {
            if (offset.x > 0) {
                // Swiped right, go to previous
                goToPrev()
            } else {
                // Swiped left, go to next
                goToNext()
            }
        }
    }, [goToPrev, goToNext])

    const togglePlay = useCallback(() => {
        if (!audioRef.current) return
        
        if (isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
            wasPlayingRef.current = false
        } else {
            audioRef.current.play().catch(() => {})
            setIsPlaying(true)
            wasPlayingRef.current = true
        }
    }, [isPlaying])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowLeft":
                    e.preventDefault()
                    goToPrev()
                    break
                case "ArrowRight":
                    e.preventDefault()
                    goToNext()
                    break
                case " ":
                case "Spacebar":
                    e.preventDefault()
                    if (tracks[currentIndex]?.audioFile) {
                        togglePlay()
                    }
                    break
                case "Home":
                    e.preventDefault()
                    navigateTo(0)
                    break
                case "End":
                    e.preventDefault()
                    navigateTo(tracks.length - 1)
                    break
                default:
                    // Number keys 1-9 for direct track selection
                    const num = parseInt(e.key)
                    if (!isNaN(num) && num >= 1 && num <= tracks.length) {
                        e.preventDefault()
                        navigateTo(num - 1)
                    }
                    break
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [goToPrev, goToNext, togglePlay, navigateTo, tracks, currentIndex])

    const getCardPosition = (index: number) => {
        let diff = index - currentIndex
        
        // Handle wrap-around for smooth infinite feel
        if (diff > tracks.length / 2) diff -= tracks.length
        if (diff < -tracks.length / 2) diff += tracks.length
        
        const absDistance = Math.abs(diff)
        const isCenter = diff === 0
        const isLeft = diff < 0
        
        // Scale: smaller as distance increases
        const distanceFactor = Math.min(absDistance, 3)
        const scale = isCenter ? centerScale : Math.max(0.4, sideScale - distanceFactor * 0.1)
        
        // X position: cards spread out with gap
        const direction = isLeft ? -1 : diff > 0 ? 1 : 0
        const xOffset = isCenter ? 0 : direction * (cardWidth * 0.5 + gap + absDistance * 30)
        
        // Z position: center card comes forward
        const zOffset = isCenter ? 100 : -absDistance * 50
        
        // Rotation: V-shape - left cards rotate right, right cards rotate left
        const yRotation = isCenter ? 0 : isLeft ? rotateY : -rotateY
        
        // Z-index for proper stacking
        const zIndex = 100 - absDistance
        
        return {
            x: xOffset,
            scale,
            z: zOffset,
            rotateY: yRotation,
            zIndex,
            isCenter,
        }
    }

    const handleCardClick = (index: number) => {
        if (index !== currentIndex) {
            navigateTo(index)
        }
    }

    if (tracks.length === 0) {
        return (
            <div style={{ width: "100%", height: "100%", backgroundColor: colors.backgroundColor, display: "flex", alignItems: "center", justifyContent: "center", color: colors.textColor }}>
                No tracks available
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: colors.backgroundColor,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                position: "relative",
                perspective: `${perspective}px`,
            }}
            onMouseEnter={() => autoPlay && setIsAutoPlaying(false)}
            onMouseLeave={() => autoPlay && setIsAutoPlaying(true)}
        >
            {/* Cards Container */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                style={{
                    position: "relative",
                    width: cardWidth,
                    height: cardHeight + reflection.height + 60,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    paddingTop: 40,
                    cursor: "grab",
                }}
                whileTap={{ cursor: "grabbing" }}
            >
                {tracks.map((track, index) => {
                    const pos = getCardPosition(index)
                    
                    return (
                        <motion.div
                            key={track.id}
                            animate={{
                                x: pos.x,
                                scale: pos.scale,
                                z: pos.z,
                                rotateY: pos.rotateY,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                                mass: 0.8,
                            }}
                            style={{
                                position: "absolute",
                                width: cardWidth,
                                height: cardHeight,
                                zIndex: pos.zIndex,
                                cursor: pos.isCenter ? "default" : "pointer",
                                transformStyle: "preserve-3d",
                                pointerEvents: "auto",
                            }}
                            onClick={() => handleCardClick(index)}
                        >
                            {/* Main Card */}
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: borderRadius,
                                    overflow: "hidden",
                                    position: "relative",
                                    boxShadow: "none",
                                    transition: "box-shadow 0.3s ease",
                                }}
                            >
                                {/* Album Cover Image */}
                                {track.cover?.src && (
                                    <img
                                        src={track.cover.src}
                                        srcSet={track.cover.srcSet}
                                        alt={track.cover.alt || track.title}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                )}
                                
                                {/* Gradient Overlay */}
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        height: "55%",
                                        background: `linear-gradient(to top, ${colors.overlayColor} 0%, transparent 100%)`,
                                        pointerEvents: "none",
                                    }}
                                />
                                
                                {/* Track Info */}
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        padding: "20px",
                                        color: colors.textColor,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: artistFont?.fontSize || "13px",
                                            fontWeight: artistFont?.fontWeight || 500,
                                            fontFamily: artistFont?.fontFamily,
                                            letterSpacing: "0.08em",
                                            textTransform: "uppercase",
                                            opacity: 0.75,
                                            marginBottom: "6px",
                                        }}
                                    >
                                        {track.artist}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: titleFont?.fontSize ? `${parseInt(titleFont.fontSize) + 4}px` : "18px",
                                            fontWeight: titleFont?.fontWeight || 600,
                                            fontFamily: titleFont?.fontFamily,
                                            letterSpacing: "-0.02em",
                                            lineHeight: 1.2,
                                        }}
                                    >
                                        {track.title}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Reflection */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    right: 0,
                                    height: reflection.height,
                                    overflow: "hidden",
                                    transform: "scaleY(-1)",
                                    opacity: reflection.opacity * pos.scale,
                                    pointerEvents: "none",
                                    marginTop: 4,
                                    borderRadius: borderRadius,
                                }}
                            >
                                {track.cover?.src && (
                                    <>
                                        <img
                                            src={track.cover.src}
                                            srcSet={track.cover.srcSet}
                                            alt=""
                                            style={{
                                                width: "100%",
                                                height: cardHeight,
                                                objectFit: "cover",
                                                display: "block",
                                            }}
                                        />
                                        {/* Fade gradient */}
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                background: `linear-gradient(to bottom, ${colors.backgroundColor} 0%, transparent 100%)`,
                                            }}
                                        />
                                        {/* Blur overlay */}
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                backdropFilter: `blur(${reflection.blur}px)`,
                                                WebkitBackdropFilter: `blur(${reflection.blur}px)`,
                                            }}
                                        />
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )
                })}
            </motion.div>

            {/* Play Button */}
            <motion.button
                onClick={togglePlay}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: playButtonStyle === "light" 
                        ? "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)"
                        : "#E6E6E6",
                    border: playButtonStyle === "light"
                        ? "1px solid rgba(255,255,255,0.3)"
                        : "1px solid rgba(0,0,0,0.1)",
                    cursor: tracks[currentIndex]?.audioFile ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: "20px",
                    boxShadow: playButtonStyle === "light"
                        ? "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)"
                        : "0 1px 5px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.1)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    zIndex: 200,
                    opacity: tracks[currentIndex]?.audioFile ? 1 : 0,
                    pointerEvents: tracks[currentIndex]?.audioFile ? "auto" : "none",
                    transition: "opacity 0.3s ease",
                }}
                aria-label={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={playButtonStyle === "light" ? "#ffffff" : "#000000"}>
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={playButtonStyle === "light" ? "#ffffff" : "#000000"}>
                        <path d="M8 5v14l11-7z" />
                    </svg>
                )}
            </motion.button>

            {/* Navigation Buttons */}
            {showNavigation && (
                <>
                    <button
                        onClick={goToPrev}
                        style={{
                            position: "absolute",
                            left: "30px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "50px",
                            height: "50px",
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.08)",
                            border: `1px solid ${colors.navigationColor}20`,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: colors.navigationColor,
                            backdropFilter: "blur(10px)",
                            WebkitBackdropFilter: "blur(10px)",
                            zIndex: 200,
                            transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.15)"
                            e.currentTarget.style.transform = "translateY(-50%) scale(1.05)"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.08)"
                            e.currentTarget.style.transform = "translateY(-50%) scale(1)"
                        }}
                        aria-label="Previous track"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <button
                        onClick={goToNext}
                        style={{
                            position: "absolute",
                            right: "30px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "50px",
                            height: "50px",
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.08)",
                            border: `1px solid ${colors.navigationColor}20`,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: colors.navigationColor,
                            backdropFilter: "blur(10px)",
                            WebkitBackdropFilter: "blur(10px)",
                            zIndex: 200,
                            transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.15)"
                            e.currentTarget.style.transform = "translateY(-50%) scale(1.05)"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.08)"
                            e.currentTarget.style.transform = "translateY(-50%) scale(1)"
                        }}
                        aria-label="Next track"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                </>
            )}

            {/* Pagination Dots */}
            <div
                style={{
                    position: "absolute",
                    bottom: "25px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: "8px",
                    zIndex: 200,
                }}
            >
                {tracks.map((track, index) => (
                    <button
                        key={track.id}
                        onClick={() => navigateTo(index)}
                        style={{
                            width: index === currentIndex ? "28px" : "8px",
                            height: "8px",
                            borderRadius: "4px",
                            background: colors.navigationColor,
                            opacity: index === currentIndex ? 1 : 0.3,
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                        }}
                        aria-label={`Go to ${track.title}`}
                    />
                ))}
            </div>
        </div>
    )
}

addPropertyControls(MusicCarousel, {
    tracks: {
        type: ControlType.Array,
        title: "Tracks",
        maxCount: 10,
        defaultValue: [
            { id: "1", title: "Midnight Dreams", artist: "Luna Eclipse", audioFile: "https://framerusercontent.com/assets/8w3IUatLX9a5JVJ6XPCVuHi94.mp3" },
            { id: "2", title: "Neon Nights", artist: "Cyber Pulse", audioFile: "https://framerusercontent.com/assets/8w3IUatLX9a5JVJ6XPCVuHi94.mp3" },
            { id: "3", title: "Golden Hour", artist: "Sunset Collective", audioFile: "https://framerusercontent.com/assets/8w3IUatLX9a5JVJ6XPCVuHi94.mp3" },
            { id: "4", title: "Deep Space", artist: "Cosmic Drift", audioFile: "https://framerusercontent.com/assets/8w3IUatLX9a5JVJ6XPCVuHi94.mp3" },
            { id: "5", title: "Forest Echoes", artist: "Nature's Voice", audioFile: "https://framerusercontent.com/assets/8w3IUatLX9a5JVJ6XPCVuHi94.mp3" },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                id: { type: ControlType.String, defaultValue: "1", title: "ID" },
                title: { type: ControlType.String, defaultValue: "Track Title", title: "Title" },
                artist: { type: ControlType.String, defaultValue: "Artist Name", title: "Artist" },
                cover: { type: ControlType.ResponsiveImage, title: "Cover" },
                audioFile: { type: ControlType.File, allowedFileTypes: ["mp3", "wav", "ogg", "aac"], title: "Audio File" },
            },
        },
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 280,
        min: 150,
        max: 400,
        step: 10,
        unit: "px",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 280,
        min: 150,
        max: 400,
        step: 10,
        unit: "px",
    },
    sideScale: {
        type: ControlType.Number,
        title: "Side Scale",
        defaultValue: 0.6,
        min: 0.3,
        max: 0.9,
        step: 0.05,
    },
    centerScale: {
        type: ControlType.Number,
        title: "Center Scale",
        defaultValue: 1,
        min: 0.8,
        max: 1.3,
        step: 0.05,
    },
    rotateY: {
        type: ControlType.Number,
        title: "Rotation",
        defaultValue: 35,
        min: 0,
        max: 60,
        step: 5,
        unit: "deg",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 1200,
        min: 500,
        max: 3000,
        step: 100,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 80,
        min: 0,
        max: 200,
        step: 10,
        unit: "px",
    },
    reflection: {
        type: ControlType.Object,
        title: "Reflection",
        description: "Configure the mirror reflection effect below each card",
        controls: {
            opacity: {
                type: ControlType.Number,
                title: "Opacity",
                description: "Controls the transparency of the reflection effect",
                defaultValue: 0.4,
                min: 0,
                max: 1,
                step: 0.05,
            },
            blur: {
                type: ControlType.Number,
                title: "Blur",
                description: "Controls the blur intensity applied to the reflection",
                defaultValue: 4,
                min: 0,
                max: 20,
                step: 1,
                unit: "px",
            },
            height: {
                type: ControlType.Number,
                title: "Height",
                description: "Controls the vertical size of the reflection below each card",
                defaultValue: 80,
                min: 30,
                max: 150,
                step: 10,
                unit: "px",
            },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#0a0a0a",
            },
            textColor: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#ffffff",
            },
            overlayColor: {
                type: ControlType.Color,
                title: "Overlay",
                defaultValue: "rgba(0,0,0,0.7)",
            },
            navigationColor: {
                type: ControlType.Color,
                title: "Navigation",
                defaultValue: "#ffffff",
            },
        },
    },
    artistFont: {
        type: ControlType.Font,
        title: "Artist Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            variant: "Medium",
            fontSize: "13px",
            letterSpacing: "0em",
            lineHeight: "1.3em",
        },
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            variant: "Medium",
            fontSize: "13px",
            letterSpacing: "0em",
            lineHeight: "1.3em",
        },
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    showNavigation: {
        type: ControlType.Boolean,
        title: "Navigation",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoPlayInterval: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: 4000,
        min: 1000,
        max: 10000,
        step: 500,
        unit: "ms",
        hidden: ({ autoPlay }) => !autoPlay,
    },
    playButtonStyle: {
        type: ControlType.Enum,
        title: "Play Button",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
        defaultValue: "light",
        displaySegmentedControl: true,
    },
})