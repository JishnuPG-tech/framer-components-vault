/**
 * Advanced Interactive 3D Cube Component
 * A WebGL-inspired portfolio cube with mouse/touch rotation, inertia physics,
 * and customizable image grids on all six faces.
 */

import {
    useRef,
    useMemo,
    useCallback,
    useEffect,
    useState,
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

import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion"

// Default images: F1, MotoGP, Hyperbikes, Supercars — all unique, no repeats
// Source: Wikimedia Commons (free to use, permanent CDN URLs)
// Default images: F1 cars, MotoGP bikes, Hyperbikes, Supercars — 54 unique images
// Source: Wikimedia Commons — free, open license, works in browser context
const W = "https://upload.wikimedia.org/wikipedia/commons"
const defaultImages = {
    // FRONT — F1 cars
    front: [
        "https://picsum.photos/seed/cube-f1/400/400",
        "https://picsum.photos/seed/cube-f2/400/400",
        "https://picsum.photos/seed/cube-f3/400/400",
        "https://picsum.photos/seed/cube-f4/400/400",
        "https://picsum.photos/seed/cube-f5/400/400",
        "https://picsum.photos/seed/cube-f6/400/400",
        "https://picsum.photos/seed/cube-f7/400/400",
        "https://picsum.photos/seed/cube-f8/400/400",
        "https://picsum.photos/seed/cube-f9/400/400",
        "https://picsum.photos/seed/cube-f9/400/400",
    ],
    // BACK — F1 cars
    back: [
        "https://picsum.photos/seed/cube-b1/400/400",
        "https://picsum.photos/seed/cube-b2/400/400",
        "https://picsum.photos/seed/cube-b3/400/400",
        "https://picsum.photos/seed/cube-b4/400/400",
        "https://picsum.photos/seed/cube-b5/400/400",
        "https://picsum.photos/seed/cube-b6/400/400",
        "https://picsum.photos/seed/cube-b7/400/400",
        "https://picsum.photos/seed/cube-b8/400/400",
        "https://picsum.photos/seed/cube-b9/400/400",
    ],
    // RIGHT — MotoGP bikes
    right: [
        "https://picsum.photos/seed/cube-r1/400/400",
        "https://picsum.photos/seed/cube-r2/400/400",
        "https://picsum.photos/seed/cube-r3/400/400",
        "https://picsum.photos/seed/cube-r4/400/400",
        "https://picsum.photos/seed/cube-r5/400/400",
        "https://picsum.photos/seed/cube-r6/400/400",
        "https://picsum.photos/seed/cube-r7/400/400",
        "https://picsum.photos/seed/cube-r8/400/400",
        "https://picsum.photos/seed/cube-r9/400/400",
    ],
    // LEFT — Hyperbikes
    left: [
        "https://picsum.photos/seed/cube-l1/400/400",
        "https://picsum.photos/seed/cube-l2/400/400",
        "https://picsum.photos/seed/cube-l3/400/400",
        "https://picsum.photos/seed/cube-l4/400/400",
        "https://picsum.photos/seed/cube-l5/400/400",
        "https://picsum.photos/seed/cube-l6/400/400",
        "https://picsum.photos/seed/cube-l7/400/400",
        "https://picsum.photos/seed/cube-l8/400/400",
        "https://picsum.photos/seed/cube-l9/400/400",
    ],
    // TOP — Supercars
    top: [
        "https://picsum.photos/seed/cube-t1/400/400",
        "https://picsum.photos/seed/cube-t2/400/400",
        "https://picsum.photos/seed/cube-t3/400/400",
        "https://picsum.photos/seed/cube-t4/400/400",
        "https://picsum.photos/seed/cube-t5/400/400",
        "https://picsum.photos/seed/cube-t6/400/400",
        "https://picsum.photos/seed/cube-t7/400/400",
        "https://picsum.photos/seed/cube-t8/400/400",
        "https://picsum.photos/seed/cube-t9/400/400",
    ],
    // BOTTOM — Supercars
    bottom: [
        "https://picsum.photos/seed/cube-bot1/400/400",
        "https://picsum.photos/seed/cube-bot2/400/400",
        "https://picsum.photos/seed/cube-bot3/400/400",
        "https://picsum.photos/seed/cube-bot4/400/400",
        "https://picsum.photos/seed/cube-bot5/400/400",
        "https://picsum.photos/seed/cube-bot6/400/400",
        "https://picsum.photos/seed/cube-bot7/400/400",
        "https://picsum.photos/seed/cube-bot8/400/400",
        "https://picsum.photos/seed/cube-bot9/400/400",
    ],
}

// Utility: Normalize angle to 0-360
const normalizeAngle = (angle) => ((angle % 360) + 360) % 360

// Utility: Snap to nearest grid angle
const snapToGrid = (angle, snapIncrement) => {
    if (snapIncrement <= 0) return angle
    return Math.round(angle / snapIncrement) * snapIncrement
}

/**
 * 3D Cube Gallery
 *
 * An interactive 3D cube component with customizable image grids on all six faces.
 * Features smooth physics-based rotation, auto-rotate, idle animations, and dynamic lighting.
 *
 * Perfect for:
 * - Portfolio showcases
 * - Product galleries
 * - Interactive presentations
 * - Creative hero sections
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function Cube3D(props) {
    const {
        rotationSensitivityX = 1,
        rotationSensitivityY = 1,
        springStiffness = 100,
        springDamping = 20,
        autoRotate = false,
        autoRotateSpeed = 0.5,
        autoRotateAxis = "y",
        gridDensity = 3,
        tileGap = 4,
        cubeSize = 300,
        perspective = 1000,
        lightingIntensity = 0.3,
        hoverScale = 1.05,
        enableHoverEffect = true,
        enableGrayscale = false,
        edgeSmoothing = 1,
        enableSnap = false,
        snapAngle = 90,
        enableMomentum = true,
        idleAnimation = true,
        idleSpeed = 0.2,
        resetKey = 0,
        frontImages = [],
        backImages = [],
        rightImages = [],
        leftImages = [],
        topImages = [],
        bottomImages = [],
        style,
    } = props

    // Add overlay state
    const [overlayImage, setOverlayImage] = useState<string | null>(null)

    // Build images object per face:
    // - Array length === 0 (untouched): use default images so cube looks great on drop
    // - Array length > 0 (user has added slots): map 1:1 — each slot is the user image or null (empty space)
    // resolveImages:
    // - userArr empty → default images fill all slots
    // - userArr has items → each item is { image, position } where position is 1-based slot index
    //   This avoids Framer compacting the array when a slot is cleared
    const resolveImages = (userArr, defaults, totalSlots) => {
        if (userArr.length === 0) return defaults
        // Build a sparse array indexed by slot position
        const result: (string | null)[] = Array(totalSlots).fill(null)
        userArr.forEach((item) => {
            if (!item) return
            const src =
                item.image?.src ||
                (typeof item.image === "string" ? item.image : null)
            const pos = (item.position ?? 1) - 1 // convert 1-based to 0-based
            if (src && src.trim() !== "" && pos >= 0 && pos < totalSlots) {
                result[pos] = src
            }
        })
        return result
    }
    const totalSlots = gridDensity * gridDensity
    const images = useMemo(
        () => ({
            front: resolveImages(frontImages, defaultImages.front, totalSlots),
            back: resolveImages(backImages, defaultImages.back, totalSlots),
            right: resolveImages(rightImages, defaultImages.right, totalSlots),
            left: resolveImages(leftImages, defaultImages.left, totalSlots),
            top: resolveImages(topImages, defaultImages.top, totalSlots),
            bottom: resolveImages(
                bottomImages,
                defaultImages.bottom,
                totalSlots
            ),
        }),
        [
            frontImages,
            backImages,
            rightImages,
            leftImages,
            topImages,
            bottomImages,
            totalSlots,
        ]
    )

    const containerRef = useRef(null)
    const cubeRef = useRef(null)
    const isStatic = useIsStaticRenderer()

    const targetRotation = useRef({ x: -15, y: 25 })
    const currentRotation = useRef({ x: -15, y: 25 })
    const velocity = useRef({ x: 0, y: 0 })
    const isDragging = useRef(false)
    const lastMouse = useRef({ x: 0, y: 0 })
    const animationFrame = useRef(null)
    const idleTime = useRef(0)
    const isIdle = useRef(true)

    const springConfig = useMemo(
        () => ({ stiffness: springStiffness, damping: springDamping, mass: 1 }),
        [springStiffness, springDamping]
    )

    const rotateX = useMotionValue(currentRotation.current.x)
    const rotateY = useMotionValue(currentRotation.current.y)
    const springX = useSpring(rotateX, springConfig)
    const springY = useSpring(rotateY, springConfig)

    const halfSize = cubeSize / 2

    const faces = useMemo(
        () => [
            {
                name: "front",
                transform: `translateZ(${halfSize}px)`,
                images: images.front,
            },
            {
                name: "back",
                transform: `rotateY(180deg) translateZ(${halfSize}px)`,
                images: images.back,
            },
            {
                name: "right",
                transform: `rotateY(90deg) translateZ(${halfSize}px)`,
                images: images.right,
            },
            {
                name: "left",
                transform: `rotateY(-90deg) translateZ(${halfSize}px)`,
                images: images.left,
            },
            {
                name: "top",
                transform: `rotateX(90deg) translateZ(${halfSize}px)`,
                images: images.top,
            },
            {
                name: "bottom",
                transform: `rotateX(-90deg) translateZ(${halfSize}px)`,
                images: images.bottom,
            },
        ],
        [images, halfSize]
    )

    const getLighting = useCallback(
        (faceName) => {
            const rx = normalizeAngle(currentRotation.current.x)
            const ry = normalizeAngle(currentRotation.current.y)
            let brightness = 1
            switch (faceName) {
                case "front":
                    brightness =
                        1 -
                        Math.abs(Math.sin((ry * Math.PI) / 180)) *
                            lightingIntensity
                    break
                case "back":
                    brightness =
                        1 -
                        Math.abs(Math.sin(((ry + 180) * Math.PI) / 180)) *
                            lightingIntensity
                    break
                case "right":
                    brightness =
                        1 -
                        Math.abs(Math.sin(((ry - 90) * Math.PI) / 180)) *
                            lightingIntensity
                    break
                case "left":
                    brightness =
                        1 -
                        Math.abs(Math.sin(((ry + 90) * Math.PI) / 180)) *
                            lightingIntensity
                    break
                case "top":
                    brightness =
                        1 -
                        Math.abs(Math.sin((rx * Math.PI) / 180)) *
                            lightingIntensity
                    break
                case "bottom":
                    brightness =
                        1 -
                        Math.abs(Math.sin(((rx + 180) * Math.PI) / 180)) *
                            lightingIntensity
                    break
            }
            return Math.max(0.3, Math.min(1, brightness))
        },
        [lightingIntensity]
    )

    const animate = useCallback(() => {
        if (isStatic) return
        if (
            autoRotate &&
            !isDragging.current &&
            !velocity.current.x &&
            !velocity.current.y
        ) {
            const speed = autoRotateSpeed * 0.5
            if (autoRotateAxis === "y" || autoRotateAxis === "both")
                targetRotation.current.y += speed
            if (autoRotateAxis === "x" || autoRotateAxis === "both")
                targetRotation.current.x += speed
        }
        if (
            idleAnimation &&
            isIdle.current &&
            !autoRotate &&
            !isDragging.current
        ) {
            idleTime.current += 0.016
            targetRotation.current.y +=
                Math.sin(idleTime.current * idleSpeed) * 0.1
            targetRotation.current.x +=
                Math.cos(idleTime.current * idleSpeed * 0.7) * 0.05
        }
        if (enableMomentum && !isDragging.current) {
            targetRotation.current.x += velocity.current.x
            targetRotation.current.y += velocity.current.y
            velocity.current.x *= 0.95
            velocity.current.y *= 0.95
            if (Math.abs(velocity.current.x) < 0.01) velocity.current.x = 0
            if (Math.abs(velocity.current.y) < 0.01) velocity.current.y = 0
        }
        if (
            enableSnap &&
            !isDragging.current &&
            !velocity.current.x &&
            !velocity.current.y
        ) {
            targetRotation.current.x = snapToGrid(
                targetRotation.current.x,
                snapAngle
            )
            targetRotation.current.y = snapToGrid(
                targetRotation.current.y,
                snapAngle
            )
        }
        rotateX.set(targetRotation.current.x)
        rotateY.set(targetRotation.current.y)
        animationFrame.current = requestAnimationFrame(animate)
    }, [
        autoRotate,
        autoRotateSpeed,
        autoRotateAxis,
        idleAnimation,
        idleSpeed,
        enableMomentum,
        enableSnap,
        snapAngle,
        isStatic,
        rotateX,
        rotateY,
    ])

    const handleStart = useCallback((clientX, clientY) => {
        isDragging.current = true
        isIdle.current = false
        lastMouse.current = { x: clientX, y: clientY }
        velocity.current = { x: 0, y: 0 }
    }, [])

    const handleMove = useCallback(
        (clientX, clientY) => {
            if (!isDragging.current) return
            let deltaX = clientX - lastMouse.current.x
            let deltaY = clientY - lastMouse.current.y
            const normalizedRy = normalizeAngle(currentRotation.current.y)
            const normalizedRx = normalizeAngle(currentRotation.current.x)
            if (normalizedRy > 90 && normalizedRy < 270) deltaX = -deltaX
            if (normalizedRx > 90 && normalizedRx < 270) deltaY = -deltaY
            targetRotation.current.y += deltaX * rotationSensitivityX * 0.3
            targetRotation.current.x -= deltaY * rotationSensitivityY * 0.3
            velocity.current.y = deltaX * rotationSensitivityX * 0.3
            velocity.current.x = -deltaY * rotationSensitivityY * 0.3
            lastMouse.current = { x: clientX, y: clientY }
        },
        [rotationSensitivityX, rotationSensitivityY]
    )

    const handleEnd = useCallback(() => {
        isDragging.current = false
        setTimeout(() => {
            isIdle.current = true
            idleTime.current = 0
        }, 2000)
    }, [])

    const onMouseDown = useCallback(
        (e) => {
            e.preventDefault()
            handleStart(e.clientX, e.clientY)
        },
        [handleStart]
    )
    const onMouseMove = useCallback(
        (e) => {
            handleMove(e.clientX, e.clientY)
        },
        [handleMove]
    )
    const onMouseUp = useCallback(() => {
        handleEnd()
    }, [handleEnd])
    const onMouseLeave = useCallback(() => {
        if (isDragging.current) handleEnd()
    }, [handleEnd])
    const onTouchStart = useCallback(
        (e) => {
            const t = e.touches[0]
            handleStart(t.clientX, t.clientY)
        },
        [handleStart]
    )
    const onTouchMove = useCallback(
        (e) => {
            e.preventDefault()
            const t = e.touches[0]
            handleMove(t.clientX, t.clientY)
        },
        [handleMove]
    )
    const onTouchEnd = useCallback(() => {
        handleEnd()
    }, [handleEnd])

    useEffect(() => {
        targetRotation.current = { x: -15, y: 25 }
        velocity.current = { x: 0, y: 0 }
    }, [resetKey])

    useEffect(() => {
        if (!isStatic) animationFrame.current = requestAnimationFrame(animate)
        return () => {
            if (animationFrame.current)
                cancelAnimationFrame(animationFrame.current)
        }
    }, [animate, isStatic])

    useEffect(() => {
        if (isStatic) return
        const up = () => {
            if (isDragging.current) handleEnd()
        }
        window.addEventListener("mouseup", up)
        window.addEventListener("touchend", up)
        return () => {
            window.removeEventListener("mouseup", up)
            window.removeEventListener("touchend", up)
        }
    }, [handleEnd, isStatic])

    // ── Generate grid tiles ───────────────────────────────────────────────────
    // Each slot in the grid renders either:
    //   • An image  — if the user supplied one at that index
    //   • Empty space — if no image was supplied (slot beyond array length, or array is empty)
    const generateTiles = useCallback(
        (faceImages, faceName) => {
            const tiles = []
            const totalTiles = gridDensity * gridDensity
            const tileSize =
                (cubeSize - tileGap * (gridDensity - 1)) / gridDensity

            for (let i = 0; i < totalTiles; i++) {
                const row = Math.floor(i / gridDensity)
                const col = i % gridDensity
                // Get the image for this slot — null/undefined means empty
                const imageSrc = faceImages[i] ?? null

                tiles.push(
                    <motion.div
                        key={`${faceName}-${i}`}
                        style={{
                            width: tileSize,
                            height: tileSize,
                            position: "absolute",
                            left: col * (tileSize + tileGap),
                            top: row * (tileSize + tileGap),
                            overflow: "hidden",
                            borderRadius: edgeSmoothing * 2,
                            transform: `translateZ(${i * 0.5}px)`,
                            willChange: "transform",
                            // Empty tiles show the configurable empty color, no border/placeholder
                            backgroundColor: "transparent",
                            cursor: imageSrc ? "pointer" : "default",
                        }}
                        whileHover={
                            enableHoverEffect && imageSrc
                                ? {
                                      scale: hoverScale,
                                      zIndex: 10,
                                      transition: { duration: 0.2 },
                                  }
                                : undefined
                        }
                        onClick={(e) => {
                            if (imageSrc) {
                                e.stopPropagation()
                                startTransition(() => setOverlayImage(imageSrc))
                            }
                        }}
                    >
                        {imageSrc && (
                            <img
                                src={imageSrc}
                                alt={`${faceName} tile ${i}`}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    filter: enableGrayscale
                                        ? "grayscale(100%)"
                                        : "none",
                                    transition: "filter 0.3s ease",
                                }}
                            />
                        )}
                    </motion.div>
                )
            }

            return tiles
        },
        [
            gridDensity,
            tileGap,
            cubeSize,
            edgeSmoothing,
            enableHoverEffect,
            hoverScale,
            enableGrayscale,
        ]
    )

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                perspective: `${perspective}px`,
                overflow: "hidden",
                cursor: isDragging.current ? "grabbing" : "grab",
                userSelect: "none",
                ...style,
            }}
            onMouseDown={isStatic ? undefined : onMouseDown}
            onMouseMove={isStatic ? undefined : onMouseMove}
            onMouseUp={isStatic ? undefined : onMouseUp}
            onMouseLeave={isStatic ? undefined : onMouseLeave}
            onTouchStart={isStatic ? undefined : onTouchStart}
            onTouchMove={isStatic ? undefined : onTouchMove}
            onTouchEnd={isStatic ? undefined : onTouchEnd}
        >
            <motion.div
                ref={cubeRef}
                style={{
                    width: cubeSize,
                    height: cubeSize,
                    position: "relative",
                    transformStyle: "preserve-3d",
                    rotateX: springX,
                    rotateY: springY,
                    willChange: "transform",
                }}
            >
                {faces.map((face) => {
                    const brightness = getLighting(face.name)
                    return (
                        <div
                            key={face.name}
                            data-face={face.name}
                            style={{
                                position: "absolute",
                                width: cubeSize,
                                height: cubeSize,
                                transform: face.transform,
                                backfaceVisibility: "visible",
                                backgroundColor: "transparent",
                                filter: `brightness(${0.7 + brightness * 0.3})`,
                                transition: "filter 0.3s ease",
                                willChange: "filter, transform",
                                opacity: 0.95,
                            }}
                        >
                            {generateTiles(face.images, face.name)}
                        </div>
                    )
                })}
            </motion.div>

            <div
                style={{
                    position: "absolute",
                    width: cubeSize * 1.5,
                    height: cubeSize * 1.5,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, rgba(100,100,255,0.1) 0%, transparent 70%)`,
                    pointerEvents: "none",
                    transform: `translateZ(-${cubeSize}px)`,
                    opacity: 0.5,
                }}
            />

            {/* Image Overlay */}
            <AnimatePresence>
                {overlayImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            width: "100vw",
                            height: "100vh",
                            backgroundColor: "rgba(0, 0, 0, 0.9)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 9999,
                            cursor: "default",
                        }}
                        onClick={() => startTransition(() => setOverlayImage(null))}
                    >
                        {/* Close Button */}
                        <button
                            style={{
                                position: "fixed",
                                top: 20,
                                right: 20,
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                backgroundColor: "rgba(255, 255, 255, 0.2)",
                                border: "2px solid rgba(255, 255, 255, 0.5)",
                                color: "white",
                                fontSize: 24,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s ease",
                                zIndex: 10000,
                            }}
                            onClick={(e) => {
                                e.stopPropagation()
                                startTransition(() => setOverlayImage(null))
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    "rgba(255, 255, 255, 0.3)"
                                e.currentTarget.style.transform = "scale(1.1)"
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    "rgba(255, 255, 255, 0.2)"
                                e.currentTarget.style.transform = "scale(1)"
                            }}
                            aria-label="Close overlay"
                        >
                            ×
                        </button>

                        {/* Image Container */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            style={{
                                maxWidth: "95vw",
                                maxHeight: "95vh",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={overlayImage}
                                alt="Enlarged view"
                                style={{
                                    maxWidth: "100%",
                                    maxHeight: "100%",
                                    objectFit: "contain",
                                    borderRadius: 8,
                                    boxShadow:
                                        "0 20px 60px rgba(0, 0, 0, 0.5)",
                                }}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(Cube3D, {
    rotationSensitivityX: {
        type: ControlType.Number,
        title: "Sensitivity X",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
        unit: "x",
    },
    rotationSensitivityY: {
        type: ControlType.Number,
        title: "Sensitivity Y",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
        unit: "x",
    },
    springStiffness: {
        type: ControlType.Number,
        title: "Spring Stiffness",
        defaultValue: 100,
        min: 50,
        max: 300,
        step: 10,
    },
    springDamping: {
        type: ControlType.Number,
        title: "Spring Damping",
        defaultValue: 20,
        min: 5,
        max: 50,
        step: 1,
    },
    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto Rotate",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoRotateSpeed: {
        type: ControlType.Number,
        title: "Auto Speed",
        defaultValue: 0.5,
        min: 0.1,
        max: 2,
        step: 0.1,
        hidden: ({ autoRotate }) => !autoRotate,
    },
    autoRotateAxis: {
        type: ControlType.Enum,
        title: "Auto Axis",
        options: ["x", "y", "both"],
        defaultValue: "y",
        displaySegmentedControl: true,
        hidden: ({ autoRotate }) => !autoRotate,
    },
    gridDensity: {
        type: ControlType.Number,
        title: "Grid Density",
        defaultValue: 3,
        min: 2,
        max: 6,
        step: 1,
        unit: "x",
    },
    tileGap: {
        type: ControlType.Number,
        title: "Tile Gap",
        defaultValue: 4,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    cubeSize: {
        type: ControlType.Number,
        title: "Cube Size",
        defaultValue: 300,
        min: 150,
        max: 600,
        step: 10,
        unit: "px",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 1000,
        min: 500,
        max: 2000,
        step: 50,
        unit: "px",
    },
    lightingIntensity: {
        type: ControlType.Number,
        title: "Lighting",
        defaultValue: 0.3,
        min: 0,
        max: 0.8,
        step: 0.1,
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.05,
        min: 1,
        max: 1.2,
        step: 0.01,
    },
    enableHoverEffect: {
        type: ControlType.Boolean,
        title: "Hover Effect",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    enableGrayscale: {
        type: ControlType.Boolean,
        title: "Grayscale",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    edgeSmoothing: {
        type: ControlType.Number,
        title: "Edge Smooth",
        defaultValue: 1,
        min: 0,
        max: 5,
        step: 0.5,
        unit: "px",
    },
    enableSnap: {
        type: ControlType.Boolean,
        title: "Snap to Angle",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    snapAngle: {
        type: ControlType.Number,
        title: "Snap Angle",
        defaultValue: 90,
        min: 30,
        max: 180,
        step: 30,
        unit: "°",
        hidden: ({ enableSnap }) => !enableSnap,
    },
    enableMomentum: {
        type: ControlType.Boolean,
        title: "Momentum",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    idleAnimation: {
        type: ControlType.Boolean,
        title: "Idle Animation",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    idleSpeed: {
        type: ControlType.Number,
        title: "Idle Speed",
        defaultValue: 0.2,
        min: 0.1,
        max: 1,
        step: 0.1,
        hidden: ({ idleAnimation }) => !idleAnimation,
    },
    frontImages: {
        type: ControlType.Array,
        title: "Front Images",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                position: {
                    type: ControlType.Number,
                    title: "Slot",
                    min: 1,
                    max: 36,
                    step: 1,
                    defaultValue: 1,
                    description:
                        "Which slot (1 = top-left, counts left→right, top→bottom)",
                },
            },
        },
        maxCount: 36,
        defaultValue: [],
    },
    backImages: {
        type: ControlType.Array,
        title: "Back Images",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                position: {
                    type: ControlType.Number,
                    title: "Slot",
                    min: 1,
                    max: 36,
                    step: 1,
                    defaultValue: 1,
                    description:
                        "Which slot (1 = top-left, counts left→right, top→bottom)",
                },
            },
        },
        maxCount: 36,
        defaultValue: [],
    },
    rightImages: {
        type: ControlType.Array,
        title: "Right Images",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                position: {
                    type: ControlType.Number,
                    title: "Slot",
                    min: 1,
                    max: 36,
                    step: 1,
                    defaultValue: 1,
                    description:
                        "Which slot (1 = top-left, counts left→right, top→bottom)",
                },
            },
        },
        maxCount: 36,
        defaultValue: [],
    },
    leftImages: {
        type: ControlType.Array,
        title: "Left Images",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                position: {
                    type: ControlType.Number,
                    title: "Slot",
                    min: 1,
                    max: 36,
                    step: 1,
                    defaultValue: 1,
                    description:
                        "Which slot (1 = top-left, counts left→right, top→bottom)",
                },
            },
        },
        maxCount: 36,
        defaultValue: [],
    },
    topImages: {
        type: ControlType.Array,
        title: "Top Images",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                position: {
                    type: ControlType.Number,
                    title: "Slot",
                    min: 1,
                    max: 36,
                    step: 1,
                    defaultValue: 1,
                    description:
                        "Which slot (1 = top-left, counts left→right, top→bottom)",
                },
            },
        },
        maxCount: 36,
        defaultValue: [],
    },
    bottomImages: {
        type: ControlType.Array,
        title: "Bottom Images",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                position: {
                    type: ControlType.Number,
                    title: "Slot",
                    min: 1,
                    max: 36,
                    step: 1,
                    defaultValue: 1,
                    description:
                        "Which slot (1 = top-left, counts left→right, top→bottom)",
                },
            },
        },
        maxCount: 36,
        defaultValue: [],
    },
    resetKey: {
        type: ControlType.Number,
        title: "Reset Rotation",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
    },
})

Cube3D.displayName = "Cube Gallery"
