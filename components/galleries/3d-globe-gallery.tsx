import * as React from "react"
import {
    motion,
    useMotionValue,
    animate,
    useAnimationFrame,
    useSpring,
    useTransform,
} from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function InteractiveGlobe(incomingProps) {
    // PREVENT DOM WARNINGS: Separate Framer's layout/style props from our custom UI controls
    const { layout, appearance, interaction, ...framerDomProps } = incomingProps

    // STEP 1: Intercept & Flatten
    const props = {
        ...incomingProps,
        ...(layout || {}),
        ...(appearance || {}),
        ...(interaction || {}),
    }

    const {
        images = [],
        itemCount = 50,
        radius = 400,
        globalScale = 1,
        itemWidth = 160,
        itemHeight = 100,
        itemRadius = 2,
        showSpaceBackground = false,
        showBackface = true,
        appearDuration = 3.5,
        autoRotate = true,
        autoRotateSpeed = 0.12,
        dragSensitivity = 0.4,
        zoomLevel = 3,
        layoutType = "organized",
        enableParallax = true,
        parallaxIntensity = 30,
        damping = 30,
    } = props

    const containerRef = React.useRef(null)
    const [containerSize, setContainerSize] = React.useState({
        width: 1000,
        height: 1000,
    })

    const rotationX = useMotionValue(0)
    const rotationY = useMotionValue(0)
    const panX = useMotionValue(0)
    const panY = useMotionValue(0)
    const scale = useMotionValue(1)

    // Parallax Motion Values
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const smoothMouseX = useSpring(mouseX, { stiffness: 120, damping })
    const smoothMouseY = useSpring(mouseY, { stiffness: 120, damping })

    // Parallax Transforms
    const globePanX = useTransform(smoothMouseX, (v) =>
        enableParallax ? v * parallaxIntensity : 0
    )
    const globePanY = useTransform(smoothMouseY, (v) =>
        enableParallax ? v * parallaxIntensity : 0
    )

    // 3D Depth Star Parallax
    const stars1X = useTransform(smoothMouseX, (v) =>
        enableParallax ? v * -5 : 0
    )
    const stars1Y = useTransform(smoothMouseY, (v) =>
        enableParallax ? v * -5 : 0
    )
    const stars2X = useTransform(smoothMouseX, (v) =>
        enableParallax ? v * -15 : 0
    )
    const stars2Y = useTransform(smoothMouseY, (v) =>
        enableParallax ? v * -15 : 0
    )
    const stars3X = useTransform(smoothMouseX, (v) =>
        enableParallax ? v * -35 : 0
    )
    const stars3Y = useTransform(smoothMouseY, (v) =>
        enableParallax ? v * -35 : 0
    )

    const isDragging = React.useRef(false)
    const isZoomed = React.useRef(false)
    const isIntersecting = React.useRef(true) // Viewport Gating
    const [isGrabbing, setIsGrabbing] = React.useState(false)

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // Responsive scaling & Intersection Observer
    React.useEffect(() => {
        if (!containerRef.current) return

        // Handle Resizing safely
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setContainerSize({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                })
            }
        })
        resizeObserver.observe(containerRef.current)

        // Viewport gating to save battery/CPU
        const intersectionObserver = new IntersectionObserver(([entry]) => {
            isIntersecting.current = entry.isIntersecting
        })
        intersectionObserver.observe(containerRef.current)

        return () => {
            resizeObserver.disconnect()
            intersectionObserver.disconnect()
        }
    }, [])

    const requiredSpace = radius * 2.5
    const responsiveScale =
        containerSize.width > 0
            ? Math.min(
                  1,
                  containerSize.width / requiredSpace,
                  containerSize.height / requiredSpace
              )
            : 1

    // Handle Auto-Rotation (Optimized 60fps Loop)
    useAnimationFrame((time, delta) => {
        if (!isIntersecting.current) return // Prevent off-screen rendering
        if (
            autoRotate &&
            !isDragging.current &&
            !isZoomed.current &&
            !isCanvas
        ) {
            const normalizedSpeed = autoRotateSpeed * (delta / 16.666)
            rotationY.set(rotationY.get() + normalizedSpeed)
        }
    })

    const getShortestPath = (current, target) => {
        let diff = (target - current) % 360
        if (diff > 180) diff -= 360
        if (diff < -180) diff += 360
        return current + diff
    }

    // Ultra-Premium GSAP Expo-Out Curve for Interaction
    const interactionTransition = { duration: 2.2, ease: [0.85, 0, 0.15, 1] }

    const handleZoomOut = () => {
        if (isZoomed.current) {
            animate(scale, 1, interactionTransition)
            animate(panX, 0, interactionTransition)
            animate(panY, 0, interactionTransition).then(() => {
                isZoomed.current = false
            })
        }
    }

    const handleItemClick = (e, item) => {
        if (e && e.stopPropagation) e.stopPropagation()
        if (isDragging.current || !item.imageUrl) return

        isZoomed.current = true

        const targetX = -item.rx
        const targetY = -item.ry

        const finalX = getShortestPath(rotationX.get(), targetX)
        const finalY = getShortestPath(rotationY.get(), targetY)

        animate(rotationX, finalX, interactionTransition)
        animate(rotationY, finalY, interactionTransition)
        animate(panX, -item.tx, interactionTransition)
        animate(panY, -item.ty, interactionTransition)
        animate(scale, zoomLevel, interactionTransition)
    }

    const handlePanStart = () => {
        isDragging.current = true
        setIsGrabbing(true)
        handleZoomOut()
    }

    const handlePanEnd = () => {
        setTimeout(() => {
            isDragging.current = false
        }, 50)
        setIsGrabbing(false)
    }

    const handlePan = (e, info) => {
        const currentScale = scale.get()
        rotationY.set(
            rotationY.get() + (info.delta.x * dragSensitivity) / currentScale
        )
        rotationX.set(
            rotationX.get() - (info.delta.y * dragSensitivity) / currentScale
        )
    }

    const handlePointerMove = (e) => {
        if (isCanvas || !enableParallax) return
        const rect = containerRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        const y = ((e.clientY - rect.top) / rect.height) * 2 - 1
        mouseX.set(x)
        mouseY.set(y)
    }

    const handlePointerLeave = () => {
        mouseX.set(0)
        mouseY.set(0)
    }

    // High Quality 3-Layer Starfield Generation
    const starsBg = React.useMemo(() => {
        if (!showSpaceBackground) return null
        const generateStars = (count, maxRadius, minOpacity, maxOpacity) => {
            return Array.from({ length: count }).map(() => ({
                x: Math.random() * 100,
                y: Math.random() * 100,
                r: Math.random() * maxRadius + 0.5,
                o: Math.random() * (maxOpacity - minOpacity) + minOpacity,
            }))
        }
        return {
            layer1: generateStars(200, 1, 0.1, 0.4),
            layer2: generateStars(100, 1.5, 0.3, 0.7),
            layer3: generateStars(40, 2, 0.6, 1),
        }
    }, [showSpaceBackground])

    // Math Engine: Distribute Items flawlessly on a Sphere
    const items = React.useMemo(() => {
        const count = Math.max(itemCount, images?.length || 1)
        const result = []

        const getImg = (idx) => {
            if (!images || images.length === 0) return ""
            const imageIndex = idx % images.length
            let imageUrl = images[imageIndex]

            if (imageUrl && imageUrl.includes("scale-down-to")) {
                imageUrl = imageUrl.replace(
                    /scale-down-to=[0-9]+/,
                    "scale-down-to=2048"
                )
            }
            return imageUrl
        }

        if (layoutType === "organized") {
            // Precise Latitude/Longitude Grid Distribution Algorithm
            const numRings = Math.max(2, Math.round(Math.sqrt(count)))
            const ringCounts = []
            let totalAssigned = 0

            for (let i = 0; i < numRings; i++) {
                const v = (i + 0.5) / numRings
                const lat = (1 - 2 * v) * 90
                const radiusAtLat = Math.cos(lat * (Math.PI / 180))
                const ideal = Math.max(
                    1,
                    Math.round((radiusAtLat * count * (Math.PI / 2)) / numRings)
                )
                ringCounts.push(ideal)
                totalAssigned += ideal
            }

            let diff = count - totalAssigned
            while (diff !== 0) {
                let maxRingIdx = Math.floor(numRings / 2)
                let maxVal = -1
                for (let i = 0; i < numRings; i++) {
                    if (ringCounts[i] > maxVal) {
                        maxVal = ringCounts[i]
                        maxRingIdx = i
                    }
                }
                if (diff > 0) {
                    ringCounts[maxRingIdx]++
                    diff--
                } else {
                    if (ringCounts[maxRingIdx] > 1) {
                        ringCounts[maxRingIdx]--
                        diff++
                    } else break
                }
            }

            let itemsPlaced = 0
            for (let i = 0; i < numRings; i++) {
                const v = (i + 0.5) / numRings
                const lat = (1 - 2 * v) * 90

                for (let j = 0; j < ringCounts[i]; j++) {
                    if (itemsPlaced >= count) break
                    const offset = i % 2 === 0 ? 0 : 180 / ringCounts[i]
                    const lon = (j / ringCounts[i]) * 360 + offset

                    result.push({
                        id: itemsPlaced,
                        rx: -lat,
                        ry: lon,
                        tx: 0,
                        ty: 0,
                        tz: radius,
                        imageUrl: getImg(itemsPlaced),
                    })
                    itemsPlaced++
                }
            }
        } else {
            // Fibonacci Golden Spiral Algorithm
            const phi = Math.PI * (3 - Math.sqrt(5))
            for (let i = 0; i < count; i++) {
                const y = count > 1 ? 1 - (i / (count - 1)) * 2 : 0
                const r = Math.sqrt(1 - y * y)
                const theta = phi * i

                const x = Math.cos(theta) * r
                const z = Math.sin(theta) * r

                const lat = Math.asin(y) * (180 / Math.PI)
                const lon = Math.atan2(x, z) * (180 / Math.PI)

                result.push({
                    id: i,
                    rx: -lat,
                    ry: lon,
                    tx: 0,
                    ty: 0,
                    tz: radius,
                    imageUrl: getImg(i),
                })
            }
        }

        return result
    }, [itemCount, images, layoutType, radius])

    return (
        <div
            {...framerDomProps}
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100, // Fixes 0x0 canvas mounting bug
                minHeight: 100, // Fixes 0x0 canvas mounting bug
                position: "relative",
                overflow: "hidden",
                backgroundColor: "transparent",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                userSelect: "none",
                WebkitUserSelect: "none",
                WebkitTapHighlightColor: "transparent",
                ...(framerDomProps.style || {}), // Properly merges Framer's injected layout styles
            }}
            onPointerDown={handleZoomOut}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
        >
            {/* Space Background Layer */}
            {showSpaceBackground && starsBg && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "radial-gradient(circle at 50% 50%, #0d111a 0%, #020204 100%)",
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    <motion.svg
                        style={{
                            position: "absolute",
                            width: "110%",
                            height: "110%",
                            left: "-5%",
                            top: "-5%",
                            x: stars1X,
                            y: stars1Y,
                        }}
                    >
                        {starsBg.layer1.map((s, i) => (
                            <circle
                                key={i}
                                cx={`${s.x}%`}
                                cy={`${s.y}%`}
                                r={s.r}
                                fill={`rgba(255,255,255,${s.o})`}
                            />
                        ))}
                    </motion.svg>
                    <motion.svg
                        style={{
                            position: "absolute",
                            width: "110%",
                            height: "110%",
                            left: "-5%",
                            top: "-5%",
                            x: stars2X,
                            y: stars2Y,
                        }}
                    >
                        {starsBg.layer2.map((s, i) => (
                            <circle
                                key={i}
                                cx={`${s.x}%`}
                                cy={`${s.y}%`}
                                r={s.r}
                                fill={`rgba(255,255,255,${s.o})`}
                            />
                        ))}
                    </motion.svg>
                    <motion.svg
                        style={{
                            position: "absolute",
                            width: "110%",
                            height: "110%",
                            left: "-5%",
                            top: "-5%",
                            x: stars3X,
                            y: stars3Y,
                        }}
                    >
                        {starsBg.layer3.map((s, i) => (
                            <circle
                                key={i}
                                cx={`${s.x}%`}
                                cy={`${s.y}%`}
                                r={s.r}
                                fill={`rgba(255,255,255,${s.o})`}
                            />
                        ))}
                    </motion.svg>
                </div>
            )}

            {/* Parallax Engine */}
            <motion.div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    x: globePanX,
                    y: globePanY,
                }}
            >
                <motion.div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        transform: `scale(${responsiveScale * globalScale})`,
                    }}
                >
                    {/* Interactable Core Hub */}
                    <motion.div
                        initial={isCanvas ? false : { opacity: 0, scale: 0.3 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            duration: appearDuration,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            perspective: `${Math.max(1800, radius * 4.5)}px`,
                            cursor: isGrabbing ? "grabbing" : "grab",
                        }}
                        onPanStart={handlePanStart}
                        onPan={handlePan}
                        onPanEnd={handlePanEnd}
                    >
                        {/* Hardware Accelerated Rotation Group */}
                        <motion.div
                            style={{
                                position: "relative",
                                width: 0,
                                height: 0,
                                x: panX,
                                y: panY,
                                rotateX: rotationX,
                                rotateY: rotationY,
                                scale: scale,
                                transformStyle: "preserve-3d",
                                willChange: "transform",
                            }}
                        >
                            {items.map((item) => {
                                const UPSCALE = 2
                                const downscale = 1 / UPSCALE

                                return (
                                    <div
                                        key={`item-${item.id}`}
                                        style={{
                                            position: "absolute",
                                            left: `${-(itemWidth * UPSCALE) / 2}px`,
                                            top: `${-(itemHeight * UPSCALE) / 2}px`,
                                            width: itemWidth * UPSCALE,
                                            height: itemHeight * UPSCALE,
                                            transform: `rotateY(${item.ry}deg) rotateX(${item.rx}deg) translateX(${item.tx}px) translateY(${item.ty}px) translateZ(${item.tz}px) scale(${downscale})`,
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            backfaceVisibility: showBackface
                                                ? "visible"
                                                : "hidden",
                                        }}
                                    >
                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            onTap={(e) =>
                                                handleItemClick(e, item)
                                            }
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                backgroundColor: item.imageUrl
                                                    ? "transparent"
                                                    : "rgba(200, 200, 200, 0.2)",
                                                border: item.imageUrl
                                                    ? "none"
                                                    : `${1 * UPSCALE}px solid rgba(150, 150, 150, 0.4)`,
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                cursor: item.imageUrl
                                                    ? "pointer"
                                                    : "default",
                                                overflow: "hidden",
                                                borderRadius: `${itemRadius * UPSCALE}px`,
                                                outline: "none",
                                            }}
                                        >
                                            {item.imageUrl ? (
                                                <img
                                                    src={item.imageUrl}
                                                    alt={`Globe Gallery Asset ${item.id}`}
                                                    decoding="async"
                                                    draggable={false}
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                        pointerEvents: "none",
                                                        WebkitUserDrag: "none",
                                                    }}
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        color: "rgba(150, 150, 150, 0.8)",
                                                        fontSize: `${12 * UPSCALE}px`,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    IMG
                                                </div>
                                            )}
                                        </motion.div>
                                    </div>
                                )
                            })}
                        </motion.div>
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    )
}

// STEP 2: Nested Defaults
InteractiveGlobe.defaultProps = {
    layout: {
        layoutType: "organized",
        itemCount: 50,
        radius: 400,
        globalScale: 1,
    },
    appearance: {
        images: [],
        itemWidth: 160,
        itemHeight: 100,
        itemRadius: 2,
        showSpaceBackground: false,
        showBackface: true,
        appearDuration: 3.5,
    },
    interaction: {
        autoRotate: true,
        autoRotateSpeed: 0.12,
        dragSensitivity: 0.4,
        zoomLevel: 3,
        enableParallax: true,
        parallaxIntensity: 30,
        damping: 30,
    },
}

// STEP 3: UI Categorization Panel Setup
addPropertyControls(InteractiveGlobe, {
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            layoutType: {
                type: ControlType.Enum,
                title: "Globe Layout",
                options: ["default", "organized"],
                optionTitles: [
                    "Spiral (Fibonacci)",
                    "Grid (Latitude/Longitude)",
                ],
                defaultValue: "organized",
            },
            itemCount: {
                type: ControlType.Number,
                title: "Base Count",
                defaultValue: 50,
                min: 10,
                max: 200,
                step: 1,
                description:
                    "Count stretches automatically to fit uploaded images.",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius Size",
                defaultValue: 400,
                min: 100,
                max: 2000,
                step: 10,
            },
            globalScale: {
                type: ControlType.Number,
                title: "Global Scale",
                defaultValue: 1,
                min: 0.1,
                max: 10,
                step: 0.1,
            },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            images: {
                type: ControlType.Array,
                control: { type: ControlType.Image },
                title: "Images",
            },
            itemWidth: {
                type: ControlType.Number,
                title: "Item Width",
                defaultValue: 160,
                min: 10,
                max: 600,
            },
            itemHeight: {
                type: ControlType.Number,
                title: "Item Height",
                defaultValue: 100,
                min: 10,
                max: 600,
            },
            itemRadius: {
                type: ControlType.Number,
                title: "Pic Radius",
                defaultValue: 2,
                min: 0,
                max: 300,
                step: 1,
            },
            showBackface: {
                type: ControlType.Boolean,
                title: "Show Back",
                defaultValue: true,
                description:
                    "Turn off to improve framerate and fix Z-clipping bugs.",
            },
            showSpaceBackground: {
                type: ControlType.Boolean,
                title: "Space BG",
                defaultValue: false,
            },
            appearDuration: {
                type: ControlType.Number,
                title: "Appear Time",
                defaultValue: 3.5,
                min: 0,
                max: 10,
                step: 0.1,
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        controls: {
            autoRotate: {
                type: ControlType.Boolean,
                title: "Auto Rotate",
                defaultValue: true,
            },
            autoRotateSpeed: {
                type: ControlType.Number,
                title: "Spin Speed",
                defaultValue: 0.12,
                min: 0.01,
                max: 2,
                step: 0.01,
                hidden: (props) => !props.autoRotate,
            },
            dragSensitivity: {
                type: ControlType.Number,
                title: "Drag Sens.",
                defaultValue: 0.4,
                min: 0.1,
                max: 2,
                step: 0.1,
            },
            zoomLevel: {
                type: ControlType.Number,
                title: "Zoom Depth",
                defaultValue: 3,
                min: 1,
                max: 10,
                step: 0.1,
            },
            enableParallax: {
                type: ControlType.Boolean,
                title: "Cursor Pan",
                defaultValue: true,
            },
            parallaxIntensity: {
                type: ControlType.Number,
                title: "Pan Str.",
                defaultValue: 30,
                min: 5,
                max: 200,
                step: 1,
                hidden: (props) => !props.enableParallax,
            },
            damping: {
                type: ControlType.Number,
                title: "Damping",
                defaultValue: 30,
                min: 0,
                max: 200,
                step: 1,
                hidden: (props) => !props.enableParallax,
            },
        },
    },
})
