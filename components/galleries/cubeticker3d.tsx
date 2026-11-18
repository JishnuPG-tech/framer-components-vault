// 3D Cube Gallery with infinite scroll marquee, hover interactions, and video/image support
import { useState, useRef, useEffect, useMemo, startTransition, type CSSProperties } from "react"
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

interface CubeFace {
    type: "image" | "video"
    image?: ResponsiveImage
    videoSrc?: string
}

interface CubeData {
    name: string
    faces: [CubeFace, CubeFace, CubeFace, CubeFace, CubeFace, CubeFace]
    animationDelay: number
}

interface CubeGalleryProps {
    brandName: string
    headline: string
    subtext: string
    cubes: CubeData[]
    backgroundColor: string
    textColor: string
    accentColor1: string
    accentColor2: string
    accentColor3: string
    cubeSize: number
    scrollSpeed: number
    autoSpin: boolean
    showStats: boolean
    borderRadius: number
    perspective: number
    headlineFont: CSSProperties
    bodyFont: CSSProperties
    brandFont: CSSProperties
    style?: CSSProperties
}

/**
 * 3D Cube Gallery
 *
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function CubeGallery(props: CubeGalleryProps) {
    const {
        brandName = "Cube Gallery",
        headline = "Media lives in three dimensions",
        subtext = "Hover to pause · Each face is an image or video · Infinite seamless scroll",
        cubes: rawCubes = [],
        backgroundColor = "#05050d",
        textColor = "#FFFFFF",
        accentColor1 = "#a78bfa",
        accentColor2 = "#ec4899",
        accentColor3 = "#fb923c",
        cubeSize = 190,
        scrollSpeed = 32,
        autoSpin = true,
        showStats = true,
        borderRadius = 24,
        perspective = 700,
        headlineFont,
        bodyFont,
        brandFont,
    } = props

    const [scrollPaused, setScrollPaused] = useState(false)
    const [spinPaused, setSpinPaused] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isInView, setIsInView] = useState(true)
    const trackRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    // Detect mobile breakpoint
    useEffect(() => {
        if (typeof window === "undefined") return

        const checkMobile = () => {
            startTransition(() => setIsMobile(window.innerWidth < 768))
        }

        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    // Add IntersectionObserver for viewport visibility
    useEffect(() => {
        if (typeof window === "undefined" || isStatic) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    startTransition(() => setIsInView(entry.isIntersecting))
                })
            },
            { threshold: 0.1 }
        )

        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        return () => {
            if (containerRef.current) {
                observer.unobserve(containerRef.current)
            }
        }
    }, [isStatic])

    // Responsive values
    const responsiveCubeSize = isMobile ? Math.min(cubeSize * 0.6, 120) : cubeSize
    const responsivePadding = isMobile ? "16px 20px" : "28px 36px"
    const responsiveHeadlinePadding = isMobile ? "16px 20px 8px" : "22px 36px 8px"
    const responsiveStagePadding = isMobile ? "20px 0 24px" : "30px 0 32px"
    const responsiveBottomPadding = isMobile ? "14px 20px 20px" : "18px 36px 26px"
    const responsiveFadeWidth = isMobile ? 60 : 120
    const responsiveGap = isMobile ? 30 : 60

    // Transform raw cubes data from property controls into proper CubeData format
    const cubes = useMemo(() => {
        if (!rawCubes || rawCubes.length === 0) return defaultCubes
        
        return rawCubes.map((cube: any) => ({
            name: cube.name || "Cube",
            animationDelay: cube.animationDelay || 0,
            faces: [
                {
                    type: cube.face1Type || "image",
                    image: cube.face1Image || { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Face 1" },
                    videoSrc: cube.face1Video || "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                },
                {
                    type: cube.face2Type || "image",
                    image: cube.face2Image || { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Face 2" },
                    videoSrc: cube.face2Video || "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                },
                {
                    type: cube.face3Type || "image",
                    image: cube.face3Image || { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Face 3" },
                    videoSrc: cube.face3Video || "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                },
                {
                    type: cube.face4Type || "image",
                    image: cube.face4Image || { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Face 4" },
                    videoSrc: cube.face4Video || "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                },
                {
                    type: cube.face5Type || "image",
                    image: cube.face5Image || { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Face 5" },
                    videoSrc: cube.face5Video || "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                },
                {
                    type: cube.face6Type || "image",
                    image: cube.face6Image || { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Face 6" },
                    videoSrc: cube.face6Video || "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                },
            ] as [CubeFace, CubeFace, CubeFace, CubeFace, CubeFace, CubeFace],
        }))
    }, [rawCubes])

    const toggleScroll = () => {
        startTransition(() => setScrollPaused(!scrollPaused))
    }

    const toggleSpin = () => {
        startTransition(() => setSpinPaused(!spinPaused))
    }

    const stats = useMemo(() => {
        const totalFaces = cubes.length * 6
        const videoCount = cubes.reduce(
            (acc, cube) => acc + (cube.faces ? cube.faces.filter((f) => f.type === "video").length : 0),
            0
        )
        return {
            cubes: cubes.length,
            faces: totalFaces,
            videos: videoCount,
        }
    }, [cubes])

    const duplicatedCubes = useMemo(() => [...cubes, ...cubes], [cubes])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                background: backgroundColor,
                borderRadius,
                overflow: "hidden",
                position: "relative",
                color: textColor,
            }}
        >
            {/* Background Grid */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                    pointerEvents: "none",
                }}
            />

            {/* Background Orbs */}
            <div
                style={{
                    position: "absolute",
                    width: 400,
                    height: 400,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${accentColor1}20 0%, transparent 70%)`,
                    top: -100,
                    left: -80,
                    pointerEvents: "none",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    width: 300,
                    height: 300,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${accentColor2}1A 0%, transparent 70%)`,
                    bottom: -80,
                    right: -40,
                    pointerEvents: "none",
                }}
            />

            {/* Top Bar */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: responsivePadding,
                    paddingBottom: 0,
                    position: "relative",
                    zIndex: 2,
                    flexWrap: isMobile ? "wrap" : "nowrap",
                    gap: isMobile ? 12 : 0,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                        style={{
                            width: isMobile ? 6 : 8,
                            height: isMobile ? 6 : 8,
                            borderRadius: "50%",
                            background: `linear-gradient(135deg, ${accentColor1}, ${accentColor2})`,
                            animation: "dot-pulse 2s ease-in-out infinite",
                        }}
                    />
                    <div
                        style={{
                            fontSize: isMobile ? 11 : 13,
                            fontWeight: 700,
                            color: "rgba(255,255,255,0.5)",
                            letterSpacing: isMobile ? 1.5 : 2,
                            textTransform: "uppercase",
                            ...brandFont,
                        }}
                    >
                        {brandName}
                    </div>
                </div>
                <div style={{ display: "flex", gap: isMobile ? 6 : 8, flexWrap: "wrap" }}>
                    <Badge color="#60a5fa" label="Image" isMobile={isMobile} />
                    <Badge color="#f472b6" label="Video" isMobile={isMobile} />
                    <Badge color="#34d399" label="Live" isLive isMobile={isMobile} />
                </div>
            </div>

            {/* Headline */}
            <div style={{ padding: responsiveHeadlinePadding, position: "relative", zIndex: 2 }}>
                <h1
                    style={{
                        fontSize: isMobile ? 20 : 32,
                        fontWeight: 800,
                        letterSpacing: isMobile ? -0.5 : -1,
                        lineHeight: 1.05,
                        margin: 0,
                        ...headlineFont,
                    }}
                >
                    {headline.split("three dimensions").map((part, i) =>
                        i === 0 ? (
                            <span key={i}>
                                {part}
                                <em
                                    style={{
                                        fontStyle: "normal",
                                        background: `linear-gradient(90deg, ${accentColor1} 0%, ${accentColor2} 50%, ${accentColor3} 100%)`,
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                    }}
                                >
                                    three dimensions
                                </em>
                            </span>
                        ) : (
                            part
                        )
                    )}
                </h1>
                <div
                    style={{
                        fontSize: isMobile ? 10 : 12,
                        color: "rgba(255,255,255,0.28)",
                        marginTop: isMobile ? 4 : 6,
                        letterSpacing: 0.3,
                        ...bodyFont,
                    }}
                >
                    {subtext}
                </div>
            </div>

            {/* Stage */}
            <div style={{ padding: responsiveStagePadding, position: "relative", overflow: "hidden" }}>
                {/* Fade Edges */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        height: "100%",
                        width: responsiveFadeWidth,
                        background: `linear-gradient(to right, ${backgroundColor} 0%, transparent 100%)`,
                        zIndex: 10,
                        pointerEvents: "none",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        height: "100%",
                        width: responsiveFadeWidth,
                        background: `linear-gradient(to left, ${backgroundColor} 0%, transparent 100%)`,
                        zIndex: 10,
                        pointerEvents: "none",
                    }}
                />

                {/* Track */}
                <div
                    ref={trackRef}
                    style={{
                        display: "flex",
                        gap: responsiveGap,
                        alignItems: "center",
                        width: "max-content",
                        animation: isStatic || !isInView ? "none" : `marquee ${scrollSpeed}s linear infinite`,
                        animationPlayState: isStatic || scrollPaused || !isInView ? "paused" : "running",
                        padding: isMobile ? "0 20px" : "0 40px",
                    }}
                    onMouseEnter={() => !isStatic && startTransition(() => setScrollPaused(true))}
                    onMouseLeave={() => !isStatic && startTransition(() => setScrollPaused(false))}
                >
                    {duplicatedCubes.map((cube, idx) => (
                        <CubeUnit
                            key={idx}
                            cube={cube}
                            cubeSize={responsiveCubeSize}
                            autoSpin={autoSpin && !spinPaused && isInView && !isStatic}
                            accentColor1={accentColor1}
                            accentColor2={accentColor2}
                            bodyFont={bodyFont}
                            perspective={perspective}
                            isMobile={isMobile}
                            isStatic={isStatic}
                            isInView={isInView}
                        />
                    ))}
                </div>
            </div>

            {/* Bottom Bar */}
            {showStats && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: responsiveBottomPadding,
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                        position: "relative",
                        zIndex: 2,
                        flexDirection: isMobile ? "column" : "row",
                        gap: isMobile ? 16 : 0,
                    }}
                >
                    <div style={{ display: "flex", gap: isMobile ? 16 : 28 }}>
                        <Stat label="Cubes" value={stats.cubes.toString()} font={bodyFont} isMobile={isMobile} />
                        <Stat label="Faces" value={stats.faces.toString()} font={bodyFont} isMobile={isMobile} />
                        <Stat label="Videos" value={stats.videos.toString()} font={bodyFont} isMobile={isMobile} />
                        <Stat label="Loop" value="∞" font={bodyFont} isMobile={isMobile} />
                    </div>
                    <div style={{ display: "flex", gap: isMobile ? 6 : 8, flexWrap: "wrap", width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "center" : "flex-start" }}>
                        <ControlButton
                            label={scrollPaused ? "Resume scroll" : "Pause scroll"}
                            active={!scrollPaused}
                            onClick={toggleScroll}
                            font={bodyFont}
                            isMobile={isMobile}
                        />
                        <ControlButton
                            label={spinPaused ? "Resume spin" : "Pause spin"}
                            active={!spinPaused}
                            onClick={toggleSpin}
                            font={bodyFont}
                            isMobile={isMobile}
                        />
                    </div>
                </div>
            )}

            <style>
                {`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes dot-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.75); }
          }
          @keyframes auto-spin {
            0% { transform: rotateX(-18deg) rotateY(0deg); }
            100% { transform: rotateX(-18deg) rotateY(360deg); }
          }
        `}
            </style>
        </div>
    )
}

function Badge({ color, label, isLive, isMobile }: { color: string; label: string; isLive?: boolean; isMobile?: boolean }) {
    return (
        <div
            style={{
                fontSize: isMobile ? 8 : 10,
                fontWeight: 600,
                letterSpacing: isMobile ? 0.8 : 1,
                textTransform: "uppercase",
                padding: isMobile ? "4px 10px" : "5px 12px",
                borderRadius: isMobile ? 16 : 20,
                background: `${color}20`,
                color: color,
                border: `1px solid ${color}33`,
                display: "flex",
                alignItems: "center",
                gap: isMobile ? 4 : 5,
            }}
        >
            {isLive && (
                <div
                    style={{
                        width: isMobile ? 4 : 5,
                        height: isMobile ? 4 : 5,
                        borderRadius: "50%",
                        background: color,
                        animation: "dot-pulse 1.4s infinite",
                    }}
                />
            )}
            {label}
        </div>
    )
}

function CubeUnit({
    cube,
    cubeSize,
    autoSpin,
    accentColor1,
    accentColor2,
    bodyFont,
    perspective,
    isMobile,
    isStatic,
    isInView,
}: {
    cube: CubeData
    cubeSize: number
    autoSpin: boolean
    accentColor1: string
    accentColor2: string
    bodyFont: CSSProperties
    perspective: number
    isMobile?: boolean
    isStatic?: boolean
    isInView?: boolean
}) {
    const [hoverY, setHoverY] = useState(30)
    const [rotation, setRotation] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [dragRotation, setDragRotation] = useState({ x: -20, y: 0 })
    const animationFrameRef = useRef<number>()

    useEffect(() => {
        if (!autoSpin || isDragging || isStatic || !isInView) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = undefined
            }
            return
        }

        let startTime = Date.now() + cube.animationDelay * 1000
        
        const animate = () => {
            const elapsed = Date.now() - startTime
            const newRotation = (elapsed / 10000) * 360
            setRotation(newRotation)
            animationFrameRef.current = requestAnimationFrame(animate)
        }

        animationFrameRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = undefined
            }
        }
    }, [autoSpin, cube.animationDelay, isDragging, isStatic, isInView])

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isStatic) return
        e.preventDefault()
        setIsDragging(true)
        setDragStart({ x: e.clientX, y: e.clientY })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isStatic) return
        if (!isDragging) {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            const normalizedX = (x / rect.width - 0.5) * 2
            setHoverY(normalizedX * 60)
            return
        }

        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y

        setDragRotation({
            x: dragRotation.x + deltaY * 0.5,
            y: dragRotation.y + deltaX * 0.5,
        })
        setDragStart({ x: e.clientX, y: e.clientY })
    }

    const handleMouseUp = () => {
        if (isStatic) return
        setIsDragging(false)
    }

    useEffect(() => {
        if (!isDragging || isStatic) return

        const handleGlobalMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - dragStart.x
            const deltaY = e.clientY - dragStart.y

            setDragRotation({
                x: dragRotation.x + deltaY * 0.5,
                y: dragRotation.y + deltaX * 0.5,
            })
            setDragStart({ x: e.clientX, y: e.clientY })
        }

        const handleGlobalMouseUp = () => {
            setIsDragging(false)
        }

        window.addEventListener("mousemove", handleGlobalMouseMove)
        window.addEventListener("mouseup", handleGlobalMouseUp)

        return () => {
            window.removeEventListener("mousemove", handleGlobalMouseMove)
            window.removeEventListener("mouseup", handleGlobalMouseUp)
        }
    }, [isDragging, dragStart, dragRotation, isStatic])

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, flexShrink: 0 }}>
            <div
                style={{
                    perspective: perspective,
                    width: cubeSize,
                    height: cubeSize,
                    cursor: isStatic ? "default" : (isDragging ? "grabbing" : "grab"),
                }}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => {
                    if (!isDragging && !isStatic) {
                        setHoverY(30)
                    }
                }}
            >
                <div
                    style={{
                        width: cubeSize,
                        height: cubeSize,
                        position: "relative",
                        transformStyle: "preserve-3d",
                        transform: isStatic 
                            ? `rotateX(-20deg) rotateY(30deg)` 
                            : (isDragging 
                                ? `rotateX(${dragRotation.x}deg) rotateY(${dragRotation.y}deg)` 
                                : `rotateX(-20deg) rotateY(${rotation + hoverY}deg) scale(1.04)`),
                        transition: isDragging || isStatic ? "none" : "transform 0.3s ease",
                    }}
                >
                    {cube.faces.map((face, idx) => (
                        <CubeFace
                            key={idx}
                            face={face}
                            position={["front", "back", "right", "left", "top", "bottom"][idx] as any}
                            cubeSize={cubeSize}
                            accentColor1={accentColor1}
                            accentColor2={accentColor2}
                            isMobile={isMobile}
                            isStatic={isStatic}
                            isInView={isInView}
                        />
                    ))}
                </div>
            </div>

        </div>
    )
}

function CubeFace({
    face,
    position,
    cubeSize,
    accentColor1,
    accentColor2,
    isMobile,
    isStatic,
    isInView,
}: {
    face: CubeFace
    position: "front" | "back" | "right" | "left" | "top" | "bottom"
    cubeSize: number
    accentColor1: string
    accentColor2: string
    isMobile?: boolean
    isStatic?: boolean
    isInView?: boolean
}) {
    const videoRef = useRef<HTMLVideoElement>(null)

    // Manage video playback based on visibility and static rendering
    useEffect(() => {
        if (!videoRef.current || face.type !== "video") return

        if (isStatic || !isInView) {
            videoRef.current.pause()
        } else {
            videoRef.current.play().catch(() => {})
        }
    }, [isStatic, isInView, face.type])

    const transforms = {
        front: `translateZ(${cubeSize / 2}px)`,
        back: `rotateY(180deg) translateZ(${cubeSize / 2}px)`,
        right: `rotateY(90deg) translateZ(${cubeSize / 2}px)`,
        left: `rotateY(-90deg) translateZ(${cubeSize / 2}px)`,
        top: `rotateX(90deg) translateZ(${cubeSize / 2}px)`,
        bottom: `rotateX(-90deg) translateZ(${cubeSize / 2}px)`,
    }

    const imageData = face.image || {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Default image"
    }
    const videoSrc = face.videoSrc || "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4"

    return (
        <div
            style={{
                position: "absolute",
                width: cubeSize,
                height: cubeSize,
                overflow: "hidden",
                borderRadius: isMobile ? 8 : 12,
                border: "1px solid rgba(255,255,255,0.1)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: transforms[position],
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: isMobile ? 6 : 8,
                    right: isMobile ? 6 : 8,
                    zIndex: 2,
                    fontSize: isMobile ? 7 : 8,
                    fontWeight: 700,
                    letterSpacing: isMobile ? 0.8 : 1,
                    textTransform: "uppercase",
                    padding: isMobile ? "2px 6px" : "3px 8px",
                    borderRadius: isMobile ? 8 : 10,
                    background: face.type === "video" ? "rgba(244,114,182,0.85)" : "rgba(96,165,250,0.85)",
                    color: "#fff",
                }}
            >
                {face.type === "video" ? "VID" : "IMG"}
            </div>
            {face.type === "video" ? (
                <video
                    ref={videoRef}
                    autoPlay={false}
                    muted
                    loop
                    playsInline
                    src={videoSrc}
                    poster={imageData.src}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
            ) : (
                <img
                    src={imageData?.src || "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"}
                    srcSet={imageData?.srcSet}
                    alt={imageData?.alt || ""}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
            )}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.55) 100%)",
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

function Stat({ label, value, font, isMobile }: { label: string; value: string; font: CSSProperties; isMobile?: boolean }) {
    return (
        <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: isMobile ? 14 : 17, fontWeight: 800, color: "#fff", ...font }}>{value}</div>
            <div
                style={{
                    fontSize: isMobile ? 8 : 9,
                    color: "rgba(255,255,255,0.22)",
                    textTransform: "uppercase",
                    letterSpacing: isMobile ? 1 : 1.2,
                    marginTop: 2,
                    ...font,
                }}
            >
                {label}
            </div>
        </div>
    )
}

function ControlButton({
    label,
    active,
    onClick,
    font,
    isMobile,
}: {
    label: string
    active: boolean
    onClick: () => void
    font: CSSProperties
    isMobile?: boolean
}) {
    return (
        <button
            onClick={onClick}
            style={{
                fontSize: isMobile ? 10 : 11,
                fontWeight: 600,
                letterSpacing: 0.4,
                padding: isMobile ? "6px 12px" : "7px 16px",
                borderRadius: isMobile ? 16 : 20,
                cursor: "pointer",
                border: active ? "1px solid rgba(167,139,250,0.35)" : "1px solid rgba(255,255,255,0.1)",
                background: active ? "rgba(167,139,250,0.18)" : "rgba(255,255,255,0.04)",
                color: active ? "#c4b5fd" : "rgba(255,255,255,0.45)",
                transition: "all 0.18s",
                ...font,
            }}
        >
            {label}
        </button>
    )
}

const defaultCubes: CubeData[] = [
    {
        name: "Nature",
        animationDelay: 0,
        faces: [
            {
                type: "image",
                image: { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Gradient 1" },
            },
            {
                type: "image",
                image: { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Gradient 2" },
            },
            {
                type: "image",
                image: { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Gradient 3" },
            },
            {
                type: "image",
                image: { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Gradient 4" },
            },
            {
                type: "image",
                image: { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Gradient 5" },
            },
            {
                type: "image",
                image: { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Gradient 1" },
            },
        ],
    },
    {
        name: "Cities",
        animationDelay: -2.5,
        faces: [
            {
                type: "video",
                videoSrc: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
            },
            {
                type: "image",
                image: { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Gradient 2" },
            },
            {
                type: "video",
                videoSrc: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
            },
            {
                type: "image",
                image: { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Gradient 3" },
            },
            {
                type: "image",
                image: { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Gradient 4" },
            },
            {
                type: "image",
                image: { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Gradient 5" },
            },
        ],
    },
    {
        name: "Ocean",
        animationDelay: -5,
        faces: [
            {
                type: "video",
                videoSrc: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
            },
            {
                type: "video",
                videoSrc: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
            },
            {
                type: "image",
                image: { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Gradient 1" },
            },
            {
                type: "image",
                image: { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Gradient 2" },
            },
            {
                type: "image",
                image: { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Gradient 3" },
            },
            {
                type: "image",
                image: { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Gradient 4" },
            },
        ],
    },
    {
        name: "Cosmos",
        animationDelay: -7.5,
        faces: [
            {
                type: "image",
                image: { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Gradient 5" },
            },
            {
                type: "video",
                videoSrc: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
            },
            {
                type: "image",
                image: { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Gradient 1" },
            },
            {
                type: "image",
                image: { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Gradient 2" },
            },
            {
                type: "image",
                image: { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Gradient 3" },
            },
            {
                type: "image",
                image: { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Gradient 4" },
            },
        ],
    },
    {
        name: "Architecture",
        animationDelay: -1.8,
        faces: [
            {
                type: "image",
                image: { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Gradient 5" },
            },
            {
                type: "image",
                image: { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Gradient 1" },
            },
            {
                type: "video",
                videoSrc: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
            },
            {
                type: "image",
                image: { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Gradient 2" },
            },
            {
                type: "image",
                image: { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Gradient 3" },
            },
            {
                type: "image",
                image: { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Gradient 4" },
            },
        ],
    },
]

addPropertyControls(CubeGallery, {
    brandName: {
        type: ControlType.String,
        title: "Brand Name",
        defaultValue: "Cube Gallery",
    },
    headline: {
        type: ControlType.String,
        title: "Headline",
        defaultValue: "Media lives in three dimensions",
    },
    subtext: {
        type: ControlType.String,
        title: "Subtext",
        defaultValue: "Hover to pause · Each face is an image or video · Infinite seamless scroll",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#05050d",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    accentColor1: {
        type: ControlType.Color,
        title: "Accent 1",
        defaultValue: "#a78bfa",
    },
    accentColor2: {
        type: ControlType.Color,
        title: "Accent 2",
        defaultValue: "#ec4899",
    },
    accentColor3: {
        type: ControlType.Color,
        title: "Accent 3",
        defaultValue: "#fb923c",
    },
    cubeSize: {
        type: ControlType.Number,
        title: "Cube Size",
        defaultValue: 190,
        min: 100,
        max: 300,
        step: 10,
        unit: "px",
    },
    scrollSpeed: {
        type: ControlType.Number,
        title: "Scroll Speed",
        defaultValue: 32,
        min: 10,
        max: 60,
        step: 1,
        unit: "s",
    },
    autoSpin: {
        type: ControlType.Boolean,
        title: "Auto Spin",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showStats: {
        type: ControlType.Boolean,
        title: "Show Stats",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 24,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 700,
        min: 300,
        max: 2000,
        step: 50,
        unit: "px",
    },
    cubes: {
        type: ControlType.Array,
        title: "Cubes",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Cube",
                },
                animationDelay: {
                    type: ControlType.Number,
                    title: "Animation Delay",
                    defaultValue: 0,
                    min: -10,
                    max: 10,
                    step: 0.5,
                    unit: "s",
                },
                face1Type: {
                    type: ControlType.Enum,
                    title: "Face 1 Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                },
                face1Image: {
                    type: ControlType.ResponsiveImage,
                    title: "Face 1 Image",
                    hidden: (props) => props.face1Type === "video",
                },
                face1Video: {
                    type: ControlType.File,
                    title: "Face 1 Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (props) => props.face1Type === "image",
                },
                face2Type: {
                    type: ControlType.Enum,
                    title: "Face 2 Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                },
                face2Image: {
                    type: ControlType.ResponsiveImage,
                    title: "Face 2 Image",
                    hidden: (props) => props.face2Type === "video",
                },
                face2Video: {
                    type: ControlType.File,
                    title: "Face 2 Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (props) => props.face2Type === "image",
                },
                face3Type: {
                    type: ControlType.Enum,
                    title: "Face 3 Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                },
                face3Image: {
                    type: ControlType.ResponsiveImage,
                    title: "Face 3 Image",
                    hidden: (props) => props.face3Type === "video",
                },
                face3Video: {
                    type: ControlType.File,
                    title: "Face 3 Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (props) => props.face3Type === "image",
                },
                face4Type: {
                    type: ControlType.Enum,
                    title: "Face 4 Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                },
                face4Image: {
                    type: ControlType.ResponsiveImage,
                    title: "Face 4 Image",
                    hidden: (props) => props.face4Type === "video",
                },
                face4Video: {
                    type: ControlType.File,
                    title: "Face 4 Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (props) => props.face4Type === "image",
                },
                face5Type: {
                    type: ControlType.Enum,
                    title: "Face 5 Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                },
                face5Image: {
                    type: ControlType.ResponsiveImage,
                    title: "Face 5 Image",
                    hidden: (props) => props.face5Type === "video",
                },
                face5Video: {
                    type: ControlType.File,
                    title: "Face 5 Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (props) => props.face5Type === "image",
                },
                face6Type: {
                    type: ControlType.Enum,
                    title: "Face 6 Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                },
                face6Image: {
                    type: ControlType.ResponsiveImage,
                    title: "Face 6 Image",
                    hidden: (props) => props.face6Type === "video",
                },
                face6Video: {
                    type: ControlType.File,
                    title: "Face 6 Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (props) => props.face6Type === "image",
                },
            },
        },
        defaultValue: defaultCubes,
    },
    headlineFont: {
        type: ControlType.Font,
        title: "Headline Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            variant: "Extra Bold",
            letterSpacing: "-0.03em",
            lineHeight: "1.05em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Medium",
            letterSpacing: "0.3px",
            lineHeight: "1.4em",
        },
    },
    brandFont: {
        type: ControlType.Font,
        title: "Brand Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Bold",
            letterSpacing: "2px",
            lineHeight: "1em",
        },
    },
})
