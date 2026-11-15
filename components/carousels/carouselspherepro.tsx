// Carousel Sphere — media items arranged on a rotating 3D sphere with CSS perspective,
// drag interaction, and depth-of-field blur effects
import { useRef, useState, useEffect, useMemo, useCallback, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useAnimationFrame } from "framer-motion"

interface ImageItem {
    src: any
    label: string
    linkUrl: string
}

interface CarouselSphereProps {
    itemCount: number
    sphereRadius: number
    itemSize: number
    perspective: number
    containerSize: number
    autoRotateX: number
    autoRotateY: number
    dragSensitivity: number
    inertiaDamping: number
    hoverScaleUp: number
    itemBorderRadius: number
    itemBorder: string
    fogNear: string
    fogFar: string
    background: string
    images: ImageItem[]
    showLabels: boolean
    labelFont: string
    autoRotate: boolean
    pauseOnHover: boolean
    enableDrag: boolean
    clickToOpen: boolean
    depthBlur: boolean
    defaultLinkUrl: string
    openInNewTab: boolean
    showArrows: boolean
    showDots: boolean
    arrowColor: string
    arrowSize: number
    dotColor: string
    dotActiveColor: string
    dotSize: number
    navigationStep: number
}

interface SphereItem {
    id: number
    theta: number
    phi: number
    x: number
    y: number
    z: number
    scale: number
    opacity: number
    blur: number
    zIndex: number
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight fixed
 */
export default function CarouselSphere(props: CarouselSphereProps) {
    const {
        itemCount = 16,
        sphereRadius = 280,
        itemSize = 90,
        perspective = 900,
        containerSize = 640,
        autoRotateX = 0.2,
        autoRotateY = 0.5,
        dragSensitivity = 0.35,
        inertiaDamping = 0.94,
        hoverScaleUp = 1.18,
        itemBorderRadius = 10,
        itemBorder = "rgba(255,255,255,0.12)",
        fogNear = "rgba(8,8,14,0.0)",
        fogFar = "rgba(8,8,14,0.85)",
        background = "transparent",
        images = [],
        showLabels = false,
        labelFont = "Inter, sans-serif",
        autoRotate = true,
        pauseOnHover = false,
        enableDrag = true,
        clickToOpen = true,
        depthBlur = true,
        defaultLinkUrl = "https://framer.link/dulaj80",
        openInNewTab = true,
        showArrows = true,
        showDots = true,
        arrowColor = "rgba(255,255,255,0.9)",
        arrowSize = 40,
        dotColor = "rgba(255,255,255,0.4)",
        dotActiveColor = "rgba(255,255,255,1)",
        dotSize = 10,
        navigationStep = 30,
    } = props

    const rotationX = useMotionValue(0)
    const rotationY = useMotionValue(0)
    const velocityX = useRef(0)
    const velocityY = useRef(0)
    const isDragging = useRef(false)
    const lastMouseX = useRef(0)
    const lastMouseY = useRef(0)
    const [isHovered, setIsHovered] = useState(false)
    const [items, setItems] = useState<SphereItem[]>([])
    const [activeItemIndex, setActiveItemIndex] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const [containerWidth, setContainerWidth] = useState(containerSize)
    const isStatic = useIsStaticRenderer()

    // Responsive adjustments
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined") return
        const checkMobile = () => {
            startTransition(() => {
                setIsMobile(window.innerWidth < 768)
            })
        }
        checkMobile()
        window.addEventListener("resize", checkMobile)
        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    // Track container width for responsive sphere
    useEffect(() => {
        if (typeof window === "undefined" || !containerRef.current) return

        const updateWidth = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth
                startTransition(() => {
                    setContainerWidth(Math.min(width, containerSize))
                })
            }
        }

        updateWidth()
        window.addEventListener("resize", updateWidth)
        return () => window.removeEventListener("resize", updateWidth)
    }, [containerSize])

    const effectiveItemCount = isMobile ? Math.min(8, itemCount) : itemCount
    const effectiveRadius = isMobile ? sphereRadius * 0.8 : sphereRadius
    const effectiveDragEnabled = isMobile ? false : enableDrag

    // Initialize sphere positions using Fibonacci sphere algorithm
    const initialPositions = useMemo(() => {
        const positions: Array<{ theta: number; phi: number; id: number }> = []
        const goldenRatio = (1 + Math.sqrt(5)) / 2
        const angleIncrement = Math.PI * 2 * goldenRatio

        for (let i = 0; i < effectiveItemCount; i++) {
            const t = i / effectiveItemCount
            const phi = Math.acos(1 - 2 * t)
            const theta = angleIncrement * i

            positions.push({ id: i, theta, phi })
        }

        return positions
    }, [effectiveItemCount])

    // Compute 3D positions and depth effects
    const computeItemTransforms = useCallback(
        (rotX: number, rotY: number) => {
            const newItems: SphereItem[] = []

            initialPositions.forEach((pos) => {
                // Spherical to Cartesian
                let x = effectiveRadius * Math.sin(pos.phi) * Math.cos(pos.theta)
                let y = effectiveRadius * Math.sin(pos.phi) * Math.sin(pos.theta)
                let z = effectiveRadius * Math.cos(pos.phi)

                // Apply rotations
                const cosX = Math.cos(rotX)
                const sinX = Math.sin(rotX)
                const cosY = Math.cos(rotY)
                const sinY = Math.sin(rotY)

                // Rotate around X axis
                const y1 = y * cosX - z * sinX
                const z1 = y * sinX + z * cosX

                // Rotate around Y axis
                const x2 = x * cosY + z1 * sinY
                const z2 = -x * sinY + z1 * cosY

                // Depth-based effects
                const depth = (z2 + effectiveRadius) / (effectiveRadius * 2) // 0 to 1
                const scale = 0.5 + depth * 0.5 // Scale from 0.5 to 1
                const opacity = depthBlur ? 0.3 + depth * 0.7 : 1
                const blur = depthBlur ? (1 - depth) * 8 : 0

                newItems.push({
                    id: pos.id,
                    theta: pos.theta,
                    phi: pos.phi,
                    x: x2,
                    y: y1,
                    z: z2,
                    scale,
                    opacity,
                    blur,
                    zIndex: Math.round(z2),
                })
            })

            // Sort by Z for correct paint order
            newItems.sort((a, b) => a.z - b.z)

            return newItems
        },
        [initialPositions, effectiveRadius, depthBlur]
    )

    // Animation loop
    useAnimationFrame(() => {
        // Skip animation in static/thumbnail renders
        if (isStatic || RenderTarget.current() === RenderTarget.thumbnail) {
            return
        }

        let rotX = rotationX.get()
        let rotY = rotationY.get()

        // Auto-rotate
        if (autoRotate && !isDragging.current && (!pauseOnHover || !isHovered)) {
            velocityX.current = autoRotateX * (Math.PI / 180)
            velocityY.current = autoRotateY * (Math.PI / 180)
        }

        // Apply velocity
        rotX += velocityX.current
        rotY += velocityY.current

        // Apply damping
        if (!isDragging.current) {
            velocityX.current *= inertiaDamping
            velocityY.current *= inertiaDamping
        }

        rotationX.set(rotX)
        rotationY.set(rotY)

        // Update item transforms
        const newItems = computeItemTransforms(rotX, rotY)
        startTransition(() => {
            setItems(newItems)
        })
    })

    // Initialize items on mount for static renders
    useEffect(() => {
        if (isStatic || RenderTarget.current() === RenderTarget.thumbnail) {
            const initialItems = computeItemTransforms(0, 0)
            startTransition(() => {
                setItems(initialItems)
            })
        }
    }, [isStatic, computeItemTransforms])

    // Drag handlers
    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (!effectiveDragEnabled) return
            isDragging.current = true
            lastMouseX.current = e.clientX
            lastMouseY.current = e.clientY
            velocityX.current = 0
            velocityY.current = 0
        },
        [effectiveDragEnabled]
    )

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDragging.current || !effectiveDragEnabled) return

            const deltaX = e.clientX - lastMouseX.current
            const deltaY = e.clientY - lastMouseY.current

            velocityX.current = -deltaY * dragSensitivity * 0.01
            velocityY.current = deltaX * dragSensitivity * 0.01

            lastMouseX.current = e.clientX
            lastMouseY.current = e.clientY
        },
        [dragSensitivity, effectiveDragEnabled]
    )

    const handleMouseUp = useCallback(() => {
        isDragging.current = false
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("mouseup", handleMouseUp)
        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
        }
    }, [handleMouseMove, handleMouseUp])

    // Handle item click
    const handleItemClick = useCallback(
        (item: SphereItem) => {
            if (!clickToOpen) return

            const imageData = images[item.id % images.length]
            const url = imageData?.linkUrl || defaultLinkUrl

            if (typeof window !== "undefined" && url) {
                if (openInNewTab) {
                    window.open(url, "_blank", "noopener,noreferrer")
                } else {
                    window.location.href = url
                }
            }
        },
        [clickToOpen, images, defaultLinkUrl, openInNewTab]
    )

    // Navigation handlers
    const rotateLeft = useCallback(() => {
        velocityY.current = navigationStep * (Math.PI / 180)
        velocityX.current = 0
    }, [navigationStep])

    const rotateRight = useCallback(() => {
        velocityY.current = -navigationStep * (Math.PI / 180)
        velocityX.current = 0
    }, [navigationStep])

    const rotateUp = useCallback(() => {
        velocityX.current = navigationStep * (Math.PI / 180)
        velocityY.current = 0
    }, [navigationStep])

    const rotateDown = useCallback(() => {
        velocityX.current = -navigationStep * (Math.PI / 180)
        velocityY.current = 0
    }, [navigationStep])

    const jumpToItem = useCallback(
        (index: number) => {
            const targetPos = initialPositions[index]
            if (!targetPos) return

            // Calculate rotation needed to bring item to front
            const targetRotY = -targetPos.theta
            const targetRotX = -targetPos.phi + Math.PI / 2

            // Smoothly transition to target rotation
            const currentRotX = rotationX.get()
            const currentRotY = rotationY.get()

            const deltaX = targetRotX - currentRotX
            const deltaY = targetRotY - currentRotY

            velocityX.current = deltaX * 0.1
            velocityY.current = deltaY * 0.1

            startTransition(() => {
                setActiveItemIndex(index)
            })
        },
        [initialPositions, rotationX, rotationY]
    )

    // Update active item based on closest to front
    useEffect(() => {
        if (items.length === 0) return

        // Find item with highest Z (closest to front)
        const frontItem = items.reduce((max, item) => (item.z > max.z ? item : max), items[0])

        if (frontItem && frontItem.id !== activeItemIndex) {
            startTransition(() => {
                setActiveItemIndex(frontItem.id)
            })
        }
    }, [items])

    // Parse fog colors
    const fogNearColor = useMemo(() => {
        const match = fogNear.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
        return match ? `rgb(${match[1]}, ${match[2]}, ${match[3]})` : "rgb(8, 8, 14)"
    }, [fogNear])

    const fogFarColor = useMemo(() => {
        const match = fogFar.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
        return match ? `rgb(${match[1]}, ${match[2]}, ${match[3]})` : "rgb(8, 8, 14)"
    }, [fogFar])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: containerSize,
                position: "relative",
                overflow: "hidden",
                background,
                cursor: effectiveDragEnabled ? (isDragging.current ? "grabbing" : "grab") : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
            onMouseDown={handleMouseDown}
            onMouseEnter={() => startTransition(() => setIsHovered(true))}
            onMouseLeave={() => startTransition(() => setIsHovered(false))}
        >
            <div
                style={{
                    width: containerWidth,
                    height: containerSize,
                    maxWidth: "100%",
                    position: "relative",
                    perspective: `${perspective}px`,
                    transformStyle: "preserve-3d",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: 0,
                        height: 0,
                        transformStyle: "preserve-3d",
                        transform: "translateZ(0)", // GPU acceleration
                    }}
                >
                    {items.map((item) => {
                        const imageData = images[item.id % images.length]
                        const rawSrc = imageData?.src as any
                        const resolvedSrc = typeof rawSrc === "string" ? rawSrc : rawSrc?.src
                        const imageSrc =
                            resolvedSrc ||
                            "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"
                        const label = imageData?.label || `Item ${item.id + 1}`

                        return (
                            <motion.div
                                key={item.id}
                                style={{
                                    position: "absolute",
                                    width: itemSize,
                                    height: itemSize,
                                    transform: `translate3d(${item.x}px, ${item.y}px, ${item.z}px) scale(${item.scale})`,
                                    opacity: item.opacity,
                                    filter: `blur(${item.blur}px)`,
                                    borderRadius: itemBorderRadius,
                                    border: `1px solid ${itemBorder}`,
                                    overflow: "hidden",
                                    cursor: clickToOpen ? "pointer" : "default",
                                    pointerEvents: "auto",
                                    backgroundImage: `linear-gradient(to bottom, ${fogNearColor}, ${fogFarColor}), url(${imageSrc})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    backgroundBlendMode: "multiply",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                    willChange: "transform, opacity, filter",
                                }}
                                whileHover={{
                                    scale: item.scale * hoverScaleUp,
                                    transition: { duration: 0.2 },
                                }}
                                onClick={() => handleItemClick(item)}
                            >
                                <img
                                    src={imageSrc}
                                    alt={label}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                        pointerEvents: "none",
                                    }}
                                />
                                {showLabels && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            padding: "6px 8px",
                                            background: "rgba(0,0,0,0.7)",
                                            color: "white",
                                            fontSize: 11,
                                            fontFamily: labelFont,
                                            textAlign: "center",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        {label}
                                    </div>
                                )}
                            </motion.div>
                        )
                    })}
                </div>
            </div>

            {/* Arrow Navigation */}
            {showArrows && (
                <>
                    {/* Left Arrow */}
                    <motion.button
                        style={{
                            position: "absolute",
                            left: 20,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: arrowSize,
                            height: arrowSize,
                            borderRadius: "50%",
                            border: "none",
                            background: "rgba(0,0,0,0.3)",
                            backdropFilter: "blur(10px)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                            color: arrowColor,
                        }}
                        whileHover={{ scale: 1.1, background: "rgba(0,0,0,0.5)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={rotateLeft}
                        aria-label="Rotate left"
                    >
                        <svg width={arrowSize * 0.5} height={arrowSize * 0.5} viewBox="0 0 24 24" fill="none">
                            <path
                                d="M15 18L9 12L15 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </motion.button>

                    {/* Right Arrow */}
                    <motion.button
                        style={{
                            position: "absolute",
                            right: 20,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: arrowSize,
                            height: arrowSize,
                            borderRadius: "50%",
                            border: "none",
                            background: "rgba(0,0,0,0.3)",
                            backdropFilter: "blur(10px)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                            color: arrowColor,
                        }}
                        whileHover={{ scale: 1.1, background: "rgba(0,0,0,0.5)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={rotateRight}
                        aria-label="Rotate right"
                    >
                        <svg width={arrowSize * 0.5} height={arrowSize * 0.5} viewBox="0 0 24 24" fill="none">
                            <path
                                d="M9 18L15 12L9 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </motion.button>

                    {/* Up Arrow */}
                    <motion.button
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: 20,
                            transform: "translateX(-50%)",
                            width: arrowSize,
                            height: arrowSize,
                            borderRadius: "50%",
                            border: "none",
                            background: "rgba(0,0,0,0.3)",
                            backdropFilter: "blur(10px)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                            color: arrowColor,
                        }}
                        whileHover={{ scale: 1.1, background: "rgba(0,0,0,0.5)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={rotateUp}
                        aria-label="Rotate up"
                    >
                        <svg width={arrowSize * 0.5} height={arrowSize * 0.5} viewBox="0 0 24 24" fill="none">
                            <path
                                d="M18 15L12 9L6 15"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </motion.button>

                    {/* Down Arrow */}
                    <motion.button
                        style={{
                            position: "absolute",
                            left: "50%",
                            bottom: 20,
                            transform: "translateX(-50%)",
                            width: arrowSize,
                            height: arrowSize,
                            borderRadius: "50%",
                            border: "none",
                            background: "rgba(0,0,0,0.3)",
                            backdropFilter: "blur(10px)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                            color: arrowColor,
                        }}
                        whileHover={{ scale: 1.1, background: "rgba(0,0,0,0.5)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={rotateDown}
                        aria-label="Rotate down"
                    >
                        <svg width={arrowSize * 0.5} height={arrowSize * 0.5} viewBox="0 0 24 24" fill="none">
                            <path
                                d="M6 9L12 15L18 9"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </motion.button>
                </>
            )}

            {/* Pagination Dots */}
            {showDots && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 60,
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        gap: 8,
                        padding: "8px 12px",
                        background: "rgba(0,0,0,0.3)",
                        backdropFilter: "blur(10px)",
                        borderRadius: 20,
                        zIndex: 10,
                        maxWidth: "80%",
                        overflowX: "auto",
                        scrollbarWidth: "none",
                    }}
                >
                    {Array.from({ length: effectiveItemCount }).map((_, index) => (
                        <motion.button
                            key={index}
                            style={{
                                width: dotSize,
                                height: dotSize,
                                borderRadius: "50%",
                                border: "none",
                                background: index === activeItemIndex ? dotActiveColor : dotColor,
                                cursor: "pointer",
                                padding: 0,
                                flexShrink: 0,
                            }}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => jumpToItem(index)}
                            aria-label={`Go to item ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

addPropertyControls(CarouselSphere, {
    // LAYOUT
    itemCount: {
        type: ControlType.Number,
        title: "Item Count",
        defaultValue: 16,
        min: 6,
        max: 32,
        step: 1,
        displayStepper: true,
    },
    sphereRadius: {
        type: ControlType.Number,
        title: "Sphere Radius",
        defaultValue: 280,
        min: 100,
        max: 500,
        step: 10,
    },
    itemSize: {
        type: ControlType.Number,
        title: "Item Size",
        defaultValue: 90,
        min: 40,
        max: 200,
        step: 5,
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 900,
        min: 400,
        max: 2000,
        step: 50,
    },
    containerSize: {
        type: ControlType.Number,
        title: "Container Size",
        defaultValue: 640,
        min: 400,
        max: 1200,
        step: 20,
    },

    // ANIMATION
    autoRotateX: {
        type: ControlType.Number,
        title: "Auto Rotate X",
        defaultValue: 0.2,
        min: -2,
        max: 2,
        step: 0.1,
        unit: "°",
    },
    autoRotateY: {
        type: ControlType.Number,
        title: "Auto Rotate Y",
        defaultValue: 0.5,
        min: -2,
        max: 2,
        step: 0.1,
        unit: "°",
    },
    dragSensitivity: {
        type: ControlType.Number,
        title: "Drag Sensitivity",
        defaultValue: 0.35,
        min: 0.1,
        max: 1,
        step: 0.05,
    },
    inertiaDamping: {
        type: ControlType.Number,
        title: "Inertia Damping",
        defaultValue: 0.94,
        min: 0.8,
        max: 0.99,
        step: 0.01,
    },
    hoverScaleUp: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.18,
        min: 1,
        max: 1.5,
        step: 0.05,
    },

    // COLORS
    itemBorderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 10,
        min: 0,
        max: 50,
        step: 1,
    },
    itemBorder: {
        type: ControlType.Color,
        title: "Item Border",
        defaultValue: "rgba(255,255,255,0.12)",
    },
    fogNear: {
        type: ControlType.Color,
        title: "Fog Near",
        defaultValue: "rgba(8,8,14,0.0)",
    },
    fogFar: {
        type: ControlType.Color,
        title: "Fog Far",
        defaultValue: "rgba(8,8,14,0.85)",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "transparent",
    },

    // CONTENT
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            controls: {
                src: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Item",
                },
                linkUrl: {
                    type: ControlType.String,
                    title: "Link URL",
                    defaultValue: "",
                },
            },
        },
        defaultValue: [
            {
                src: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Gradient 1 - Blue",
                },
                label: "Blue",
                linkUrl: "",
            },
            {
                src: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Gradient 2 - Purple",
                },
                label: "Purple",
                linkUrl: "",
            },
            {
                src: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Gradient 3 - Orange",
                },
                label: "Orange",
                linkUrl: "",
            },
            {
                src: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Gradient 4 - Yellow",
                },
                label: "Yellow",
                linkUrl: "",
            },
            {
                src: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Gradient 5 - Green",
                },
                label: "Green",
                linkUrl: "",
            },
        ],
    },
    showLabels: {
        type: ControlType.Boolean,
        title: "Show Labels",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    labelFont: {
        type: ControlType.String,
        title: "Label Font",
        defaultValue: "Inter, sans-serif",
        hidden: (props) => !props.showLabels,
    },

    // BEHAVIOR
    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto Rotate",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on Hover",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    enableDrag: {
        type: ControlType.Boolean,
        title: "Enable Drag",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    clickToOpen: {
        type: ControlType.Boolean,
        title: "Click to Open",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    depthBlur: {
        type: ControlType.Boolean,
        title: "Depth Blur",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    // NAVIGATION
    showArrows: {
        type: ControlType.Boolean,
        title: "Show Arrows",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showDots: {
        type: ControlType.Boolean,
        title: "Show Dots",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "rgba(255,255,255,0.9)",
        hidden: (props) => !props.showArrows,
    },
    arrowSize: {
        type: ControlType.Number,
        title: "Arrow Size",
        defaultValue: 40,
        min: 24,
        max: 64,
        step: 4,
        hidden: (props) => !props.showArrows,
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "rgba(255,255,255,0.4)",
        hidden: (props) => !props.showDots,
    },
    dotActiveColor: {
        type: ControlType.Color,
        title: "Active Dot Color",
        defaultValue: "rgba(255,255,255,1)",
        hidden: (props) => !props.showDots,
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 10,
        min: 6,
        max: 16,
        step: 1,
        hidden: (props) => !props.showDots,
    },
    navigationStep: {
        type: ControlType.Number,
        title: "Navigation Step",
        defaultValue: 30,
        min: 10,
        max: 90,
        step: 5,
        unit: "°",
    },

    // LINK
    defaultLinkUrl: {
        type: ControlType.String,
        title: "Default Link",
        defaultValue: "https://framer.link/dulaj80",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "Open in New Tab",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
})
