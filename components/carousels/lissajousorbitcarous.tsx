// Lissajous Orbit Carousel
// Cards trace Lissajous figure paths (figure-8, clover, bow-tie) in 3D around center
// Each card staggered in phase creating flowing procession with a:b frequency ratio controlling path shape

import { useEffect, useRef, useState, useCallback, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ImageType {
    src: string
    alt?: string
}

interface LissajousOrbitCarouselProps {
    images: ImageType[]
    links: string[]
    itemCount: number
    xAmplitude: number
    yAmplitude: number
    zAmplitude: number
    ratioAB: string
    phaseOffset: number
    speed: number
    minScale: number
    fogEnabled: boolean
    perspective: number
    cardSize: number
    activeScale: number
    glowColor: string
    showGlow: boolean
    showOrbit: boolean
    centerContent: string
    centerImage: ImageType
    centerText: string
    dragEnabled: boolean
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function LissajousOrbitCarousel(props: LissajousOrbitCarouselProps) {
    const {
        images = [
            { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Image 1" },
            { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Image 2" },
            { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Image 3" },
            { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Image 4" },
            { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Image 5" },
        ],
        links = [
            "https://framer.link/dulaj80",
            "https://framer.link/dulaj80",
            "https://framer.link/dulaj80",
            "https://framer.link/dulaj80",
            "https://framer.link/dulaj80",
        ],
        itemCount = 8,
        xAmplitude = 240,
        yAmplitude = 120,
        zAmplitude = 80,
        ratioAB = "2:1",
        phaseOffset = 90,
        speed = 0.4,
        minScale = 0.6,
        fogEnabled = true,
        perspective = 1000,
        cardSize = 120,
        activeScale = 1.1,
        glowColor = "#6c47ff",
        showGlow = true,
        showOrbit = true,
        centerContent = "orb",
        centerImage = { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Center" },
        centerText = "●",
        dragEnabled = true,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const [time, setTime] = useState(0)
    const [activeIndex, setActiveIndex] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState(0)
    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })
    const [isVisible, setIsVisible] = useState(true)
    const dragStartRef = useRef({ x: 0, offset: 0 })
    const animationFrameRef = useRef<number>()
    const isStatic = useIsStaticRenderer()

    // Parse ratio
    const [a, b] = ratioAB.split(":").map(Number)
    const delta = (phaseOffset * Math.PI) / 180

    // Measure container size for responsive scaling
    useEffect(() => {
        if (!containerRef.current) return

        const updateSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                startTransition(() => {
                    setContainerSize({ width: rect.width, height: rect.height })
                })
            }
        }

        updateSize()

        if (typeof window !== "undefined") {
            window.addEventListener("resize", updateSize)
            return () => window.removeEventListener("resize", updateSize)
        }
    }, [])

    // Viewport visibility detection
    useEffect(() => {
        if (isStatic || !containerRef.current) return

        const observer = new IntersectionObserver(
            (entries) => {
                startTransition(() => {
                    setIsVisible(entries[0].isIntersecting)
                })
            },
            { threshold: 0, rootMargin: "50px" }
        )

        observer.observe(containerRef.current)

        return () => {
            observer.disconnect()
        }
    }, [isStatic])

    // Calculate responsive scaling factors
    const scaleFactor = Math.min(containerSize.width, containerSize.height) / 600
    const responsiveXAmp = xAmplitude * scaleFactor
    const responsiveYAmp = yAmplitude * scaleFactor
    const responsiveZAmp = zAmplitude * scaleFactor
    const responsiveCardSize = cardSize * scaleFactor

    // Animation loop
    useEffect(() => {
        // Skip animation in static renderer or when not visible
        if (isStatic || !isVisible) return

        let lastTime = Date.now()

        const animate = () => {
            const now = Date.now()
            const deltaTime = (now - lastTime) / 1000
            lastTime = now

            if (!isDragging) {
                setTime((prev) => prev + deltaTime)
            }

            animationFrameRef.current = requestAnimationFrame(animate)
        }

        animationFrameRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [isDragging, isStatic, isVisible])

    // Calculate positions for all cards
    const calculatePosition = useCallback(
        (index: number, currentTime: number) => {
            const N = itemCount
            const phaseStep = (2 * Math.PI) / N
            const phase_i = index * phaseStep

            const t = currentTime * speed + dragOffset

            const x = responsiveXAmp * Math.sin(a * t + phase_i + delta)
            const y = responsiveYAmp * Math.sin(b * t + phase_i)
            const z = responsiveZAmp * Math.sin(t + phase_i + Math.PI / 4)

            // Depth calculations
            const normalZ = (z + responsiveZAmp) / (2 * responsiveZAmp)
            const scale = minScale + normalZ * (1 - minScale)
            const opacity = fogEnabled ? 0.2 + normalZ * 0.8 : 1
            const zIndex = Math.round(normalZ * 100)

            return { x, y, z, scale, opacity, zIndex, normalZ }
        },
        [itemCount, speed, dragOffset, responsiveXAmp, responsiveYAmp, responsiveZAmp, a, b, delta, minScale, fogEnabled]
    )

    // Find active card (highest scale)
    useEffect(() => {
        let maxScale = 0
        let maxIndex = 0

        for (let i = 0; i < itemCount; i++) {
            const pos = calculatePosition(i, time)
            if (pos.scale > maxScale) {
                maxScale = pos.scale
                maxIndex = i
            }
        }

        startTransition(() => {
            setActiveIndex(maxIndex)
        })
    }, [time, itemCount, calculatePosition])

    // Drag handlers
    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (!dragEnabled) return
            e.preventDefault()
            setIsDragging(true)
            dragStartRef.current = {
                x: e.clientX,
                offset: dragOffset,
            }
        },
        [dragEnabled, dragOffset]
    )

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDragging || !dragEnabled) return

            const deltaX = e.clientX - dragStartRef.current.x
            const newOffset = dragStartRef.current.offset + deltaX * 0.01

            startTransition(() => {
                setDragOffset(newOffset)
            })
        },
        [isDragging, dragEnabled]
    )

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
    }, [])

    const handleCardClick = useCallback(
        (cardIndex: number) => (e: React.MouseEvent) => {
            // Only navigate if we didn't drag
            if (!isDragging) {
                e.stopPropagation()
                const imageIndex = cardIndex % images.length
                const cardLink = links[imageIndex] || "https://framer.link/dulaj80"
                if (typeof window !== "undefined" && cardLink) {
                    window.open(cardLink, "_blank", "noopener,noreferrer")
                }
            }
        },
        [isDragging, links, images.length]
    )

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove)
            window.addEventListener("mouseup", handleMouseUp)

            return () => {
                window.removeEventListener("mousemove", handleMouseMove)
                window.removeEventListener("mouseup", handleMouseUp)
            }
        }
    }, [isDragging, handleMouseMove, handleMouseUp])

    // Render cards
    const cards = []
    for (let i = 0; i < itemCount; i++) {
        const pos = calculatePosition(i, time)
        const isActive = i === activeIndex
        const imageIndex = i % images.length
        const image = images[imageIndex]

        const cardScale = isActive ? pos.scale * activeScale : pos.scale

        // Safely access image properties with fallback
        const imageSrc = image?.src || "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"
        const imageAlt = image?.alt || `Card ${i + 1}`

        cards.push(
            <div
                key={i}
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: responsiveCardSize,
                    height: responsiveCardSize,
                    transform: `translate(-50%, -50%) translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px) scale(${cardScale})`,
                    opacity: pos.opacity,
                    zIndex: pos.zIndex,
                    borderRadius: 12,
                    overflow: "hidden",
                    boxShadow: isActive && showGlow
                        ? `0 0 30px ${glowColor}, 0 10px 30px rgba(0,0,0,0.3)`
                        : "0 5px 15px rgba(0,0,0,0.2)",
                    transition: isActive ? "box-shadow 0.3s ease" : "none",
                    pointerEvents: "auto",
                    cursor: "pointer",
                    willChange: "transform, opacity",
                }}
                onClick={handleCardClick(i)}
            >
                <img
                    src={imageSrc}
                    alt={imageAlt}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            </div>
        )
    }

    // Center content
    const renderCenterContent = () => {
        if (centerContent === "none") return null

        // Disable pulsing animation in static renderer
        const pulseAnimation = isStatic
            ? ""
            : `
            @keyframes pulse {
                0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
                50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
            }
        `

        if (centerContent === "orb") {
            return (
                <>
                    {!isStatic && <style>{pulseAnimation}</style>}
                    <div
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: 40 * scaleFactor,
                            height: 40 * scaleFactor,
                            borderRadius: "50%",
                            background: `radial-gradient(circle, ${glowColor}, transparent)`,
                            boxShadow: showGlow ? `0 0 40px ${glowColor}` : "none",
                            animation: isStatic ? "none" : "pulse 2s ease-in-out infinite",
                            zIndex: 50,
                            pointerEvents: "none",
                        }}
                    />
                </>
            )
        }

        if (centerContent === "image") {
            const centerImageSrc = centerImage?.src || "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"
            const centerImageAlt = centerImage?.alt || "Center"

            return (
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 80 * scaleFactor,
                        height: 80 * scaleFactor,
                        borderRadius: "50%",
                        overflow: "hidden",
                        boxShadow: showGlow ? `0 0 30px ${glowColor}` : "0 5px 15px rgba(0,0,0,0.2)",
                        zIndex: 50,
                        pointerEvents: "none",
                    }}
                >
                    <img
                        src={centerImageSrc}
                        alt={centerImageAlt}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                </div>
            )
        }

        if (centerContent === "text") {
            return (
                <>
                    {!isStatic && <style>{pulseAnimation}</style>}
                    <div
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                            fontSize: 48 * scaleFactor,
                            color: glowColor,
                            textShadow: showGlow ? `0 0 20px ${glowColor}` : "none",
                            animation: isStatic ? "none" : "pulse 2s ease-in-out infinite",
                            zIndex: 50,
                            pointerEvents: "none",
                            fontWeight: "bold",
                        }}
                    >
                        {centerText}
                    </div>
                </>
            )
        }

        return null
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                perspective: perspective,
                cursor: dragEnabled ? (isDragging ? "grabbing" : "grab") : "default",
                userSelect: "none",
            }}
            onMouseDown={handleMouseDown}
        >
            <div
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    transformStyle: "preserve-3d",
                }}
            >
                {renderCenterContent()}
                {showOrbit && cards}
            </div>
        </div>
    )
}

addPropertyControls(LissajousOrbitCarousel, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
        maxCount: 20,
        defaultValue: [
            { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Image 1" },
            { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Image 2" },
            { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Image 3" },
            { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Image 4" },
            { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Image 5" },
        ],
    },
    links: {
        type: ControlType.Array,
        title: "Links",
        control: {
            type: ControlType.Link,
        },
        maxCount: 20,
        defaultValue: [
            "https://framer.link/dulaj80",
            "https://framer.link/dulaj80",
            "https://framer.link/dulaj80",
            "https://framer.link/dulaj80",
            "https://framer.link/dulaj80",
        ],
    },
    showOrbit: {
        type: ControlType.Boolean,
        title: "Show Orbit",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    itemCount: {
        type: ControlType.Number,
        title: "Item Count",
        min: 3,
        max: 20,
        step: 1,
        defaultValue: 8,
        hidden: ({ showOrbit }) => !showOrbit,
    },
    xAmplitude: {
        type: ControlType.Number,
        title: "X Amplitude",
        min: 80,
        max: 500,
        step: 10,
        defaultValue: 240,
    },
    yAmplitude: {
        type: ControlType.Number,
        title: "Y Amplitude",
        min: 40,
        max: 300,
        step: 10,
        defaultValue: 120,
    },
    zAmplitude: {
        type: ControlType.Number,
        title: "Z Amplitude",
        min: 0,
        max: 200,
        step: 10,
        defaultValue: 80,
    },
    ratioAB: {
        type: ControlType.Enum,
        title: "Ratio A:B",
        options: ["1:1", "2:1", "3:1", "3:2", "4:3", "5:4"],
        optionTitles: ["1:1 Ellipse", "2:1 Figure-8", "3:1 Triple", "3:2 Three-leaf", "4:3 Four-leaf", "5:4 Five-leaf"],
        defaultValue: "2:1",
    },
    phaseOffset: {
        type: ControlType.Number,
        title: "Phase Offset",
        min: 0,
        max: 360,
        step: 1,
        unit: "°",
        defaultValue: 90,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.1,
        max: 2,
        step: 0.1,
        defaultValue: 0.4,
    },
    minScale: {
        type: ControlType.Number,
        title: "Min Scale",
        min: 0.3,
        max: 0.9,
        step: 0.05,
        defaultValue: 0.6,
    },
    fogEnabled: {
        type: ControlType.Boolean,
        title: "Fog Enabled",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        min: 400,
        max: 2000,
        step: 50,
        defaultValue: 1000,
    },
    cardSize: {
        type: ControlType.Number,
        title: "Card Size",
        min: 60,
        max: 240,
        step: 10,
        unit: "px",
        defaultValue: 120,
    },
    activeScale: {
        type: ControlType.Number,
        title: "Active Scale",
        min: 1,
        max: 1.5,
        step: 0.05,
        defaultValue: 1.1,
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "#6c47ff",
    },
    showGlow: {
        type: ControlType.Boolean,
        title: "Show Glow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    centerContent: {
        type: ControlType.Enum,
        title: "Center Content",
        options: ["none", "orb", "image", "text"],
        optionTitles: ["None", "Orb", "Image", "Text"],
        defaultValue: "orb",
    },
    centerImage: {
        type: ControlType.ResponsiveImage,
        title: "Center Image",
        hidden: ({ centerContent }) => centerContent !== "image",
    },
    centerText: {
        type: ControlType.String,
        title: "Center Text",
        defaultValue: "●",
        hidden: ({ centerContent }) => centerContent !== "text",
    },
    dragEnabled: {
        type: ControlType.Boolean,
        title: "Drag Enabled",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
