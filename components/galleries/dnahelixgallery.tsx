// User request: make animation loop safe for Framer editor/export and visibility-aware, add useIsStaticRenderer, avoid RAF in static renderers, render a representative static fallback, pause/resume with IntersectionObserver, and reduce per-frame React state updates with proper cleanup.
// DNA Double Helix Gallery - Two interleaved strands of image cards spiral around a vertical axis
import { useRef, useEffect, useState, useMemo, useCallback, startTransition, type CSSProperties } from "react"
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

interface DNAHelixGalleryProps {
    images: ResponsiveImage[]
    perStrand: number
    helixRadius: number
    turns: number
    totalHeight: number
    spinSpeed: number
    riseSpeed: number
    dragEnabled: boolean
    perspective: number
    tiltAngle: number
    depthFog: boolean
    strandAColor: string
    strandBColor: string
    connectorLines: boolean
    lineOpacity: number
    cardWidth: number
    cardHeight: number
    cardRadius: number
    link: string
    style?: CSSProperties
}

interface Card3D {
    x: number
    y: number
    z: number
    scale: number
    opacity: number
    zIndex: number
    image: ResponsiveImage
    strand: number
    index: number
}

/**
 * DNA Double Helix Gallery
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function DNAHelixGallery(props: DNAHelixGalleryProps) {
    const {
        images = [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Image 1",
            },
        ],
        perStrand,
        helixRadius,
        turns,
        totalHeight,
        spinSpeed,
        riseSpeed,
        dragEnabled,
        perspective,
        tiltAngle,
        depthFog,
        strandAColor,
        strandBColor,
        connectorLines,
        lineOpacity,
        cardWidth,
        cardHeight,
        cardRadius,
        link,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const [globalAngle, setGlobalAngle] = useState(0)
    const [globalY, setGlobalY] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [isInView, setIsInView] = useState(true)
    const lastMousePos = useRef({ x: 0, y: 0 })
    const animationFrameRef = useRef<number>()
    const lastTimeRef = useRef<number>(0)
    const lastRenderTimeRef = useRef<number>(0)
    const angleRef = useRef(0)
    const yRef = useRef(0)
    const [viewportWidth, setViewportWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200)

    const strandOffset = Math.PI
    const isStaticRenderer = useIsStaticRenderer()

    const isPreview = RenderTarget.current() === RenderTarget.preview
    const shouldAnimate = !isStaticRenderer && isInView

    // Detect viewport size and calculate responsive scale
    useEffect(() => {
        if (typeof window === "undefined") return

        const handleResize = () => {
            startTransition(() => {
                setViewportWidth(window.innerWidth)
            })
        }

        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    // Calculate responsive scaling factors
    const responsiveScale = useMemo(() => {
        // Mobile: < 768px, Tablet: 768-1024px, Desktop: > 1024px
        if (viewportWidth < 768) {
            return 0.5 // 50% scale for mobile
        } else if (viewportWidth < 1024) {
            return 0.7 // 70% scale for tablet
        }
        return 1 // 100% scale for desktop
    }, [viewportWidth])

    // Apply responsive scaling to parameters
    const scaledHelixRadius = helixRadius * responsiveScale
    const scaledTotalHeight = totalHeight * responsiveScale
    const scaledCardWidth = cardWidth * responsiveScale
    const scaledCardHeight = cardHeight * responsiveScale
    const scaledPerspective = perspective * responsiveScale
    const displayAngle = isStaticRenderer ? Math.PI * 0.2 : globalAngle
    const displayY = isStaticRenderer ? scaledTotalHeight * 0.08 : globalY

    // Calculate 3D positions for all cards
    const cards3D = useMemo((): Card3D[] => {
        const result: Card3D[] = []
        const imageCount = images.length

        // Safety check: ensure we have images
        if (imageCount === 0) return result

        for (let s = 0; s < 2; s++) {
            for (let i = 0; i < perStrand; i++) {
                const imageIndex = (s * perStrand + i) % imageCount
                if (imageIndex >= imageCount) continue

                // Safety check: ensure image exists
                const image = images[imageIndex]
                if (!image || !image.src) continue

                const t = i / Math.max(perStrand - 1, 1)
                const angle = t * turns * 2 * Math.PI + displayAngle + s * strandOffset
                
                const x = scaledHelixRadius * Math.cos(angle)
                const z = scaledHelixRadius * Math.sin(angle)
                let y = t * scaledTotalHeight - scaledTotalHeight / 2 + displayY

                // Wrap Y position for rise mode
                if (riseSpeed > 0) {
                    const wrapHeight = scaledTotalHeight + scaledCardHeight
                    while (y > scaledTotalHeight / 2 + scaledCardHeight) {
                        y -= wrapHeight
                    }
                    while (y < -scaledTotalHeight / 2 - scaledCardHeight) {
                        y += wrapHeight
                    }
                }

                const normalZ = (z + scaledHelixRadius) / (2 * scaledHelixRadius)
                const scale = 0.55 + normalZ * 0.45
                const opacity = depthFog ? (0.15 + normalZ * 0.85) : 1
                const zIndex = Math.round(normalZ * 100)

                result.push({
                    x,
                    y,
                    z,
                    scale,
                    opacity,
                    zIndex,
                    image: image,
                    strand: s,
                    index: i,
                })
            }
        }

        return result
    }, [images, perStrand, scaledHelixRadius, turns, scaledTotalHeight, displayAngle, displayY, depthFog, riseSpeed, scaledCardHeight])

    // Project 3D to 2D with perspective
    const project3DTo2D = (x: number, y: number, z: number) => {
        const perspectiveFactor = z / scaledPerspective + 1
        return {
            x: x / perspectiveFactor,
            y: y / perspectiveFactor,
        }
    }

    // Sync refs when values change from dragging/interaction
    useEffect(() => {
        angleRef.current = globalAngle
        yRef.current = globalY
    }, [globalAngle, globalY])

    // Track viewport visibility to pause animation when outside viewport
    useEffect(() => {
        if (typeof window === "undefined") return
        if (!containerRef.current) return

        if (typeof IntersectionObserver === "undefined") {
            startTransition(() => setIsInView(true))
            return
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                startTransition(() => setIsInView(entry?.isIntersecting ?? false))
            },
            { threshold: 0.05 }
        )

        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    // Animation loop
    useEffect(() => {
        if (!shouldAnimate) {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
            return
        }

        const targetFrameMs = 1000 / 30

        const animate = () => {
            const now = performance.now()
            if (lastTimeRef.current === 0) {
                lastTimeRef.current = now
                lastRenderTimeRef.current = now
            }

            const deltaTime = (now - lastTimeRef.current) / 1000
            lastTimeRef.current = now

            if (!isDragging) {
                angleRef.current += spinSpeed * deltaTime
            }

            if (riseSpeed > 0) {
                yRef.current += riseSpeed * deltaTime * 100
            }

            if (now - lastRenderTimeRef.current >= targetFrameMs) {
                lastRenderTimeRef.current = now
                const nextAngle = angleRef.current
                const nextY = yRef.current
                startTransition(() => {
                    setGlobalAngle(nextAngle)
                    setGlobalY(nextY)
                })
            }

            animationFrameRef.current = requestAnimationFrame(animate)
        }

        lastTimeRef.current = 0
        animationFrameRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [spinSpeed, riseSpeed, isDragging, shouldAnimate])

    // Mouse drag handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!dragEnabled) return
        startTransition(() => setIsDragging(true))
        lastMousePos.current = { x: e.clientX, y: e.clientY }
    }, [dragEnabled])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!dragEnabled || !isDragging) return

        const deltaX = e.clientX - lastMousePos.current.x
        const deltaY = e.clientY - lastMousePos.current.y

        const nextAngle = angleRef.current + deltaX * 0.01
        const nextY = yRef.current - deltaY * 0.5
        angleRef.current = nextAngle
        yRef.current = nextY

        startTransition(() => {
            setGlobalAngle(nextAngle)
            setGlobalY(nextY)
        })

        lastMousePos.current = { x: e.clientX, y: e.clientY }
    }, [dragEnabled, isDragging])

    const handleMouseUp = useCallback(() => {
        startTransition(() => setIsDragging(false))
    }, [])

    useEffect(() => {
        if (isDragging) {
            const handleGlobalMouseUp = () => {
                startTransition(() => setIsDragging(false))
            }
            window.addEventListener("mouseup", handleGlobalMouseUp)
            return () => window.removeEventListener("mouseup", handleGlobalMouseUp)
        }
    }, [isDragging])

    // Generate connector lines
    const connectorLineElements = useMemo(() => {
        if (!connectorLines) return null

        const lines: JSX.Element[] = []
        const strandACards = cards3D.filter((c) => c.strand === 0)
        const strandBCards = cards3D.filter((c) => c.strand === 1)

        const minLength = Math.min(strandACards.length, strandBCards.length)

        for (let i = 0; i < minLength; i++) {
            const cardA = strandACards[i]
            const cardB = strandBCards[i]

            const posA = project3DTo2D(cardA.x, cardA.y, cardA.z)
            const posB = project3DTo2D(cardB.x, cardB.y, cardB.z)

            const avgZ = (cardA.z + cardB.z) / 2
            const normalZ = (avgZ + scaledHelixRadius) / (2 * scaledHelixRadius)
            const lineZIndex = Math.round(normalZ * 100) - 1

            lines.push(
                <line
                    key={`line-${i}`}
                    x1={posA.x}
                    y1={posA.y}
                    x2={posB.x}
                    y2={posB.y}
                    stroke="#ffffff"
                    strokeWidth={1}
                    opacity={lineOpacity * (depthFog ? (0.15 + normalZ * 0.85) : 1)}
                    style={{ zIndex: lineZIndex }}
                />
            )
        }

        return lines
    }, [cards3D, connectorLines, lineOpacity, scaledHelixRadius, depthFog])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                cursor: dragEnabled ? (isDragging ? "grabbing" : "grab") : "default",
                perspective: `${scaledPerspective}px`,
                backgroundColor: "#000000",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    transformStyle: "preserve-3d",
                    transform: `rotateX(${tiltAngle}deg)`,
                }}
            >
                {/* SVG for connector lines */}
                {connectorLines && (
                    <svg
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            width: "100%",
                            height: "100%",
                            pointerEvents: "none",
                            overflow: "visible",
                        }}
                    >
                        <g transform={`translate(0, 0)`}>{connectorLineElements}</g>
                    </svg>
                )}

                {/* Render cards */}
                {cards3D.map((card, idx) => {
                    const pos2D = project3DTo2D(card.x, card.y, card.z)
                    const strandColor = card.strand === 0 ? strandAColor : strandBColor

                    const cardContent = (
                        <div
                            key={`card-${card.strand}-${card.index}-${idx}`}
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                width: `${scaledCardWidth}px`,
                                height: `${scaledCardHeight}px`,
                                transform: `translate(-50%, -50%) translate(${pos2D.x}px, ${pos2D.y}px) scale(${card.scale})`,
                                opacity: card.opacity,
                                zIndex: card.zIndex,
                                borderRadius: `${cardRadius}px`,
                                overflow: "hidden",
                                border: `2px solid ${strandColor}`,
                                boxShadow: `0 0 20px ${strandColor}80, 0 0 40px ${strandColor}40`,
                                pointerEvents: isPreview ? "auto" : "none",
                            }}
                        >
                            {card.image && card.image.src && (
                                <img
                                    src={card.image.src}
                                    srcSet={card.image.srcSet}
                                    alt={card.image.alt || ""}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />
                            )}
                        </div>
                    )

                    if (isPreview && link) {
                        return (
                            <a
                                key={`card-${card.strand}-${card.index}-${idx}`}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    textDecoration: "none",
                                    color: "inherit",
                                }}
                            >
                                {cardContent}
                            </a>
                        )
                    }

                    return cardContent
                })}
            </div>
        </div>
    )
}

addPropertyControls(DNAHelixGallery, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
        maxCount: 32,
        defaultValue: [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Image 1",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Image 2",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Image 3",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Image 4",
            },
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Image 5",
            },
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Image 6",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Image 7",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Image 8",
            },
        ],
    },
    link: {
        type: ControlType.Link,
        title: "Link",
        defaultValue: "https://framer.link/dulaj80",
    },
    perStrand: {
        type: ControlType.Number,
        title: "Per Strand",
        defaultValue: 8,
        min: 3,
        max: 16,
        step: 1,
    },
    helixRadius: {
        type: ControlType.Number,
        title: "Helix Radius",
        defaultValue: 180,
        min: 80,
        max: 400,
        step: 10,
        unit: "px",
    },
    turns: {
        type: ControlType.Number,
        title: "Turns",
        defaultValue: 1.5,
        min: 0.5,
        max: 4,
        step: 0.1,
    },
    totalHeight: {
        type: ControlType.Number,
        title: "Total Height",
        defaultValue: 600,
        min: 200,
        max: 1200,
        step: 50,
        unit: "px",
    },
    spinSpeed: {
        type: ControlType.Number,
        title: "Spin Speed",
        defaultValue: 0.4,
        min: 0.05,
        max: 2,
        step: 0.05,
    },
    riseSpeed: {
        type: ControlType.Number,
        title: "Rise Speed",
        defaultValue: 0,
        min: 0,
        max: 2,
        step: 0.1,
    },
    dragEnabled: {
        type: ControlType.Boolean,
        title: "Drag Enabled",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 1000,
        min: 400,
        max: 2000,
        step: 100,
        unit: "px",
    },
    tiltAngle: {
        type: ControlType.Number,
        title: "Tilt Angle",
        defaultValue: 10,
        min: -30,
        max: 30,
        step: 1,
        unit: "deg",
    },
    depthFog: {
        type: ControlType.Boolean,
        title: "Depth Fog",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    strandAColor: {
        type: ControlType.Color,
        title: "Strand A Color",
        defaultValue: "#6c47ff",
    },
    strandBColor: {
        type: ControlType.Color,
        title: "Strand B Color",
        defaultValue: "#47ffcc",
    },
    connectorLines: {
        type: ControlType.Boolean,
        title: "Connector Lines",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    lineOpacity: {
        type: ControlType.Number,
        title: "Line Opacity",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.1,
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 140,
        min: 80,
        max: 280,
        step: 10,
        unit: "px",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 100,
        min: 60,
        max: 200,
        step: 10,
        unit: "px",
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 10,
        min: 0,
        max: 24,
        step: 1,
        unit: "px",
    },
})
