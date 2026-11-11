import * as React from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// --- TypeScript Definitions ---
interface LayoutProps {
    mode: "horizontal" | "vertical"
    gap: number
    itemWidth: number
    itemHeight: number
    perspective: number
}

interface BehaviorProps {
    autoPlay: boolean
    autoPlaySpeed: number
    dragSensitivity: number
}

interface CarouselProps {
    images: string[]
    layout: LayoutProps
    behavior: BehaviorProps
}

export default function Cinematic3DCarousel(props: CarouselProps) {
    const {
        images = [],
        layout = {
            mode: "horizontal",
            gap: 20,
            itemWidth: 220,
            itemHeight: 160,
            perspective: 1200,
        },
        behavior = { autoPlay: true, autoPlaySpeed: 0.4, dragSensitivity: 0.4 },
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()
    const isHorizontal = layout.mode === "horizontal"

    // Core rotation values
    const rotationAngle = useMotionValue(0)
    const springAngle = useSpring(rotationAngle, { stiffness: 60, damping: 20 })

    const isDragging = React.useRef(false)
    const isInViewport = React.useRef(false) // Melacak visibilitas komponen di viewport
    const totalItems = images.length
    const angleStep = 360 / (totalItems || 1)

    // Dynamic 3D Radius calculation
    const calculatedRadius = React.useMemo(() => {
        if (totalItems <= 1) return 0
        const targetDimension = isHorizontal
            ? layout.itemWidth
            : layout.itemHeight
        const totalSegmentSize = targetDimension + layout.gap

        return totalSegmentSize / (2 * Math.sin(Math.PI / totalItems))
    }, [
        totalItems,
        layout.itemWidth,
        layout.itemHeight,
        layout.gap,
        isHorizontal,
    ])

    // Safe perspective handler: If 0, convert to "none" to safely turn off perspective distortion completely
    const perspectiveValue =
        layout.perspective === 0 ? "none" : `${layout.perspective}px`

    // --- Intersection Observer untuk Deteksi Viewport ---
    React.useEffect(() => {
        if (isStatic) return

        const currentContainer = containerRef.current
        if (!currentContainer) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                // Perbarui status apakah komponen masuk/keluar dari layar
                isInViewport.current = entry.isIntersecting
            },
            { threshold: 0.05 } // Memicu sesaat setelah bagian komponen terlihat di layar
        )

        observer.observe(currentContainer)

        return () => {
            if (currentContainer) observer.unobserve(currentContainer)
        }
    }, [isStatic])

    // --- Auto-play Loop Animation dengan Cek Viewport ---
    React.useEffect(() => {
        if (isStatic) return
        if (!behavior.autoPlay) return

        let animationFrameId: number

        const updateAutoPlay = () => {
            // Jalankan animasi HANYA jika komponen berada dalam viewport dan tidak sedang di-drag
            if (isInViewport.current && !isDragging.current) {
                rotationAngle.set(rotationAngle.get() - behavior.autoPlaySpeed)
            }

            animationFrameId = requestAnimationFrame(updateAutoPlay)
        }

        animationFrameId = requestAnimationFrame(updateAutoPlay)

        return () => cancelAnimationFrame(animationFrameId)
    }, [isStatic, behavior.autoPlay, behavior.autoPlaySpeed, rotationAngle])

    // --- Drag Interaction Handlers ---
    const handlePointerDown = () => {
        if (isStatic) return
        isDragging.current = true
    }

    const handlePointerMove = (event: React.PointerEvent) => {
        if (isStatic) return
        if (!isDragging.current) return

        const standardDelta = isHorizontal ? event.movementX : -event.movementY

        rotationAngle.set(
            rotationAngle.get() + standardDelta * behavior.dragSensitivity
        )
    }

    const handlePointerUpOrLeave = () => {
        isDragging.current = false
    }

    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    overflow: "hidden",
                    perspective: perspectiveValue,
                    background: "transparent",
                }}
            >
                <div
                    style={{
                        width: layout.itemWidth,
                        height: layout.itemHeight,
                        overflow: "hidden",
                        borderRadius: 8,
                        background: "#1c1c1c",
                        boxShadow: "0 10px 30px rgba(0,0,0,.35)",
                    }}
                >
                    {images[0] ? (
                        <img
                            src={images[0]}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                color: "#777",
                                fontFamily: "Inter",
                            }}
                        >
                            Preview
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUpOrLeave}
            onPointerLeave={handlePointerUpOrLeave}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                perspective: perspectiveValue,
                cursor: isStatic ? "default" : "grab",
                userSelect: "none",
            }}
        >
            {/* 3D Space Anchor */}
            <motion.div
                style={{
                    width: `${layout.itemWidth}px`,
                    height: `${layout.itemHeight}px`,
                    position: "relative",
                    transformStyle: "preserve-3d",
                    rotateY: isHorizontal ? (isStatic ? 0 : springAngle) : 0,
                    rotateX: isHorizontal ? -5 : isStatic ? 0 : springAngle,
                }}
            >
                {images.map((imageSrc, index) => {
                    const currentItemAngle = index * angleStep

                    const custom3DTransform = isHorizontal
                        ? `rotateY(${currentItemAngle}deg) translateZ(${calculatedRadius}px)`
                        : `rotateX(${currentItemAngle}deg) translateZ(${calculatedRadius}px)`

                    return (
                        <div
                            key={index}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                transformStyle: "preserve-3d",
                                transform: custom3DTransform,
                                backfaceVisibility: "visible",
                                borderRadius: "8px",
                                overflow: "hidden",
                                boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                                backgroundColor: "#1c1c1c",
                            }}
                        >
                            {imageSrc ? (
                                <img
                                    src={imageSrc}
                                    alt={`3D Item ${index + 1}`}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        pointerEvents: "none",
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#555",
                                        fontFamily: "monospace",
                                        fontSize: "11px",
                                    }}
                                >
                                    Slot {index + 1}
                                </div>
                            )}
                        </div>
                    )
                })}
            </motion.div>
        </div>
    )
}

// --- Neatly Grouped Property Controls ---
addPropertyControls(Cinematic3DCarousel, {
    images: {
        title: "Images Array",
        type: ControlType.Array,
        control: {
            type: ControlType.Image,
        },
        defaultValue: [
            "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600",
            "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600",
            "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600",
            "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600",
            "https://images.unsplash.com/photo-1535498730771-e735b998cd64?q=80&w=600",
            "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600",
        ],
    },
    layout: {
        title: "Layout 3D",
        type: ControlType.Object,
        controls: {
            mode: {
                title: "Mode",
                type: ControlType.Enum,
                options: ["horizontal", "vertical"],
                optionTitles: ["Horizontal", "Vertical"],
                defaultValue: "horizontal",
            },
            gap: {
                title: "Card Gap",
                type: ControlType.Number,
                min: 0,
                max: 200,
                defaultValue: 25,
                unit: "px",
            },
            itemWidth: {
                title: "Card Width",
                type: ControlType.Number,
                min: 100,
                max: 600,
                defaultValue: 220,
                unit: "px",
            },
            itemHeight: {
                title: "Card Height",
                type: ControlType.Number,
                min: 100,
                max: 600,
                defaultValue: 160,
                unit: "px",
            },
            perspective: {
                title: "Lens Depth",
                type: ControlType.Number,
                min: 0,
                max: 2500,
                defaultValue: 1200,
                unit: "px",
                description: "Setting to 0px creates an isometric flat 2D look",
            },
        },
    },
    behavior: {
        title: "Behavior",
        type: ControlType.Object,
        controls: {
            autoPlay: {
                title: "Auto Spin",
                type: ControlType.Boolean,
                defaultValue: true,
            },
            autoPlaySpeed: {
                title: "Spin Speed",
                type: ControlType.Number,
                min: -3,
                max: 3,
                step: 0.1,
                defaultValue: 0.4,
            },
            dragSensitivity: {
                title: "Drag Feel",
                type: ControlType.Number,
                min: 0.1,
                max: 2,
                step: 0.05,
                defaultValue: 0.4,
            },
        },
    },
})
