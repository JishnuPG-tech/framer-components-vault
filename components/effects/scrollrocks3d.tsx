import * as React from "react"
import { useRef, useState, useEffect } from "react"
import {
    motion,
    useSpring,
    useTransform,
    useMotionValue,
    useReducedMotion,
    type MotionValue,
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


/**
 * User request implemented:
 * - Thorough TypeScript + hook-safety audit
 * - Remove orientation state loop risk
 * - Marketplace-ready metadata, comments, and typed controls
 */

/**
 * @framer.description A 3D parallax scene with scroll-driven movement, optional pointer/device tilt interaction, idle float motion, entrance staggering, and atmospheric depth fog.
 *
 * SCROLL ROCKS 3D — Scroll-driven 3D parallax objects (alethia.earth style)
 *
 * Robust scroll tracking: uses direct scroll listeners + getBoundingClientRect,
 * so it works in Framer preview, published sites, and nested scroll containers.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 900
 * @framerDisableUnlink
 */
type Direction = "up" | "down"

interface RockImage {
    src: string
    srcSet?: string
    alt?: string
}

interface RockItem {
    image?: RockImage
    x?: number
    y?: number
    size?: number
    depth?: number
    driftX?: number
    rotateStart?: number
    rotateZ?: number
    rotateX?: number
    rotateY?: number
    blur?: number
    opacity?: number
    zIndex?: number
}

interface MyComponentProps {
    items: RockItem[]
    intensity: number
    direction: Direction
    smoothing: boolean
    smoothAmount: number
    scaleOnScroll: number
    depthBlur: number
    perspective: number
    mouseParallax: boolean
    mouseStrength: number
    deviceOrient: boolean
    idleFloat: boolean
    floatAmplitude: number
    floatSpeed: number
    entranceAnim: boolean
    entranceDelay: number
    backgroundColor: string
    depthFog: boolean
    fogColor: string
    previewProgress: number
    style?: React.CSSProperties
}

interface ParallaxObjectProps {
    index: number
    item: RockItem
    progress: MotionValue<number>
    intensity: number
    direction: Direction
    scaleOnScroll: number
    depthBlur: number
    mouseParallax: boolean
    mouseStrength: number
    smoothMouseX: MotionValue<number>
    smoothMouseY: MotionValue<number>
    idleFloat: boolean
    floatAmplitude: number
    floatSpeed: number
    entranceAnim: boolean
    entranceDelay: number
    depthFog: boolean
    fogColor: string
    sizeFactor: number
}

export default function ScrollRocks3D(props: MyComponentProps): JSX.Element {
    const {
        items,
        intensity,
        direction,
        smoothing,
        smoothAmount,
        scaleOnScroll,
        depthBlur,
        perspective,
        mouseParallax,
        mouseStrength,
        deviceOrient,
        idleFloat,
        floatAmplitude,
        floatSpeed,
        entranceAnim,
        entranceDelay,
        backgroundColor,
        depthFog,
        fogColor,
        previewProgress,
        style,
    } = props

    const containerRef = useRef<HTMLDivElement | null>(null)
    const isVisible = useRef<boolean>(true)
    const hasMoved = useRef<boolean>(false)
    const hasOrientData = useRef<boolean>(false)
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()

    // ---- responsive size factor ----
    const [width, setWidth] = useState<number>(1440)
    useEffect(() => {
        if (isStatic) return
        if (!containerRef.current || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            for (const e of entries) {
                setWidth(e.contentRect.width)
            }
        })
        ro.observe(containerRef.current)
        return () => ro.disconnect()
    }, [isStatic])
    const sizeFactor = Math.min(Math.max(width / 1440, 0.45), 1.15)

    // visibility gate to avoid unnecessary off-screen updates
    useEffect(() => {
        if (isStatic) return
        const el = containerRef.current
        if (
            !el ||
            typeof window === "undefined" ||
            typeof IntersectionObserver === "undefined"
        )
            return
        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0]
            if (!entry) return
            isVisible.current = entry.intersectionRatio > 0
        })
        observer.observe(el)
        return () => observer.disconnect()
    }, [isStatic])

    // ================= ROBUST SCROLL TRACKING =================
    // 0 → element top enters bottom of viewport
    // 1 → element bottom leaves top of viewport
    const rawProgress = useMotionValue(0.5)

    useEffect(() => {
        if (isStatic || isCanvas || reducedMotion) {
            rawProgress.set(0.5)
            return
        }
        if (typeof window === "undefined" || typeof document === "undefined") return
        const el = containerRef.current
        if (!el) return

        let rafId: number | null = null

        const update = () => {
            rafId = null
            if (!isVisible.current) return
            const rect = el.getBoundingClientRect()
            const vh =
                window.innerHeight ||
                document.documentElement.clientHeight
            const total = rect.height + vh
            if (total <= 0) return
            const p = (vh - rect.top) / total
            rawProgress.set(Math.min(Math.max(p, 0), 1))
        }

        const onScroll = () => {
            if (rafId == null) rafId = requestAnimationFrame(update)
        }

        // capture:true catches scrolling inside ANY nested scroll container too
        window.addEventListener("scroll", onScroll, {
            passive: true,
            capture: true,
        })
        window.addEventListener("resize", onScroll, { passive: true })
        // initial position
        update()

        return () => {
            window.removeEventListener("scroll", onScroll, {
                capture: true,
            })
            window.removeEventListener("resize", onScroll)
            if (rafId != null) cancelAnimationFrame(rafId)
        }
    }, [isStatic, isCanvas, rawProgress, reducedMotion])

    // smoothing spring
    const springProgress = useSpring(rawProgress, {
        stiffness: 260 - smoothAmount * 200,
        damping: 32,
        mass: 0.6,
        restDelta: 0.0001,
    })

    // canvas: static scrubbable preview
    const canvasProgress = useMotionValue(previewProgress)
    const reducedProgress = useMotionValue(0.5)
    useEffect(() => {
        canvasProgress.set(previewProgress)
    }, [previewProgress, canvasProgress])

    const progress: MotionValue<number> = reducedMotion
          ? reducedProgress
        : isCanvas
          ? canvasProgress
        : smoothing
          ? springProgress
          : rawProgress

    // ---- mouse parallax ----
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const smoothMouseX = useSpring(mouseX, { stiffness: 60, damping: 20 })
    const smoothMouseY = useSpring(mouseY, { stiffness: 60, damping: 20 })

    useEffect(() => {
        if (typeof window === "undefined") return
        if (
            isStatic ||
            !mouseParallax ||
            !deviceOrient ||
            isCanvas ||
            reducedMotion
        )
            return
        if (typeof DeviceOrientationEvent === "undefined") return

        // iOS may require explicit permission via DeviceOrientationEvent.requestPermission().
        // We intentionally do not auto-request here; we just listen and use data when available.
        const orientationCtor = DeviceOrientationEvent as
            | (typeof DeviceOrientationEvent & {
                  requestPermission?: () => Promise<"granted" | "denied">
              })
            | undefined
        if (
            orientationCtor &&
            typeof orientationCtor.requestPermission === "function"
        ) {
            // permission should be triggered by a user gesture; intentionally skipped here
        }
        const onDeviceOrientation = (event: DeviceOrientationEvent) => {
            if (hasMoved.current) return
            const gamma = event.gamma
            const beta = event.beta
            if (typeof gamma !== "number" || typeof beta !== "number") {
                return
            }
            hasOrientData.current = true
            const clamp = (value: number, min: number, max: number): number =>
                Math.min(Math.max(value, min), max)
            const normX = clamp(gamma, -30, 30) / 60
            const normY = clamp(beta - 45, -30, 30) / 60
            mouseX.set(normX)
            mouseY.set(normY)
        }

        window.addEventListener("deviceorientation", onDeviceOrientation, {
            passive: true,
        })
        return () =>
            window.removeEventListener(
                "deviceorientation",
                onDeviceOrientation
            )
    }, [
        isStatic,
        mouseParallax,
        deviceOrient,
        isCanvas,
        reducedMotion,
    ])

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
        if (!mouseParallax || isCanvas || reducedMotion || isStatic) return
        if (!hasMoved.current) hasMoved.current = true
        if (hasOrientData.current) hasOrientData.current = false
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect || rect.width === 0) return
        mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
        mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
    }

    useEffect(() => {
        if (!reducedMotion) return
        mouseX.set(0)
        mouseY.set(0)
    }, [reducedMotion, mouseX, mouseY])

    if (isStatic) {
        const dir = direction === "down" ? -1 : 1
        return (
            <div
                aria-hidden="true"
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    minHeight: 400,
                    overflow: "visible",
                    backgroundColor,
                    ...style,
                }}
            >
                {(items || []).map((item, i) => {
                    const depth = item.depth ?? 1
                    const travel = intensity * depth * dir
                    const p = Math.min(Math.max(previewProgress, 0), 1)
                    const staticY = travel + (-2 * travel) * p
                    const drift = (item.driftX ?? 0) * sizeFactor
                    const staticX = -drift + 2 * drift * p
                    const rotateStart = item.rotateStart ?? 0
                    const rotateZ = rotateStart + (item.rotateZ ?? 0) * p
                    const size = (item.size ?? 160) * sizeFactor
                    const imageBlur = item.blur ?? 0
                    const opacity = item.opacity ?? 1
                    const fogOpacity = Math.min(
                        Math.max(1 - depth * 0.7, 0),
                        1
                    )
                    const rockRadius =
                        "42% 58% 55% 45% / 48% 40% 60% 52%"

                    return (
                        <div
                            key={i}
                            style={{
                                position: "absolute",
                                left: `${item.x ?? 50}%`,
                                top: `${item.y ?? 50}%`,
                                transform: `translate(-50%, -50%) translate(${staticX}px, ${staticY}px) rotate(${rotateZ}deg)`,
                                zIndex: item.zIndex ?? Math.round(depth * 10),
                                pointerEvents: "none",
                            }}
                        >
                            {item.image?.src ? (
                                <div
                                    style={{
                                        position: "relative",
                                        display: "inline-block",
                                        opacity,
                                        filter:
                                            imageBlur > 0
                                                ? `blur(${imageBlur}px)`
                                                : "none",
                                    }}
                                >
                                    <img
                                        src={item.image.src}
                                        srcSet={item.image.srcSet}
                                        alt={item.image.alt || "object"}
                                        style={{
                                            width: size,
                                            height: "auto",
                                            display: "block",
                                            userSelect: "none",
                                        }}
                                        draggable={false}
                                    />
                                    {depthFog && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                pointerEvents: "none",
                                                borderRadius: 0,
                                                backgroundColor: fogColor,
                                                opacity: fogOpacity,
                                            }}
                                        />
                                    )}
                                </div>
                            ) : (
                                <div
                                    style={{
                                        position: "relative",
                                        width: size,
                                        height: size * 0.82,
                                        opacity,
                                        filter:
                                            imageBlur > 0
                                                ? `blur(${imageBlur}px)`
                                                : "none",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            borderRadius: rockRadius,
                                            background:
                                                "radial-gradient(circle at 32% 28%, #9aa094 0%, #6b7065 45%, #3f443c 100%)",
                                            boxShadow:
                                                "inset -12px -14px 30px rgba(0,0,0,0.45), inset 8px 10px 24px rgba(255,255,255,0.12)",
                                        }}
                                    />
                                    {depthFog && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                pointerEvents: "none",
                                                borderRadius: rockRadius,
                                                backgroundColor: fogColor,
                                                opacity: fogOpacity,
                                            }}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            onPointerMove={handlePointerMove}
            aria-hidden="true"
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: 400,
                overflow: "visible",
                backgroundColor,
                perspective: `${perspective}px`,
                transformStyle: "preserve-3d",
                ...style,
            }}
        >
            {(items || []).map((item, i) => (
                <ParallaxObject
                    key={i}
                    index={i}
                    item={item}
                    progress={progress}
                    intensity={intensity}
                    direction={direction}
                    scaleOnScroll={scaleOnScroll}
                    depthBlur={depthBlur}
                    mouseParallax={mouseParallax && !reducedMotion && !isStatic}
                    mouseStrength={mouseStrength}
                    smoothMouseX={smoothMouseX}
                    smoothMouseY={smoothMouseY}
                    idleFloat={idleFloat && !isCanvas && !reducedMotion && !isStatic}
                    floatAmplitude={floatAmplitude}
                    floatSpeed={floatSpeed}
                    entranceAnim={
                        entranceAnim && !isCanvas && !reducedMotion && !isStatic
                    }
                    entranceDelay={entranceDelay}
                    depthFog={depthFog}
                    fogColor={fogColor}
                    sizeFactor={sizeFactor}
                />
            ))}
        </div>
    )
}

// ================= Single 3D object =================
function ParallaxObject(props: ParallaxObjectProps): JSX.Element {
    const {
        index,
        item,
        progress,
        intensity,
        direction,
        scaleOnScroll,
        depthBlur,
        mouseParallax,
        mouseStrength,
        smoothMouseX,
        smoothMouseY,
        idleFloat,
        floatAmplitude,
        floatSpeed,
        entranceAnim,
        entranceDelay,
        depthFog,
        fogColor,
        sizeFactor,
    } = props

    const depth = item.depth ?? 1
    const dir = direction === "down" ? -1 : 1

    // vertical travel — deeper items travel further (parallax)
    const travel = intensity * depth * dir
    const y = useTransform(progress, [0, 1], [travel, -travel])

    // horizontal drift
    const drift = (item.driftX ?? 0) * sizeFactor
    const x = useTransform(progress, [0, 1], [-drift, drift])

    // 3D rotation over scroll
    const rotateZ = useTransform(
        progress,
        [0, 1],
        [item.rotateStart ?? 0, (item.rotateStart ?? 0) + (item.rotateZ ?? 0)]
    )
    const rotateX = useTransform(progress, [0, 1], [0, item.rotateX ?? 0])
    const rotateY = useTransform(progress, [0, 1], [0, item.rotateY ?? 0])

    // subtle scale breathing (biggest at mid-scroll)
    const scaleAmt = scaleOnScroll * depth
    const scale = useTransform(
        progress,
        [0, 0.5, 1],
        [1 - scaleAmt, 1, 1 - scaleAmt]
    )

    // mouse parallax — deeper objects react more
    const mX = useTransform(
        smoothMouseX,
        [-0.5, 0.5],
        [-mouseStrength * depth, mouseStrength * depth]
    )
    const mY = useTransform(
        smoothMouseY,
        [-0.5, 0.5],
        [-mouseStrength * depth * 0.6, mouseStrength * depth * 0.6]
    )
    const zeroMV = useMotionValue(0)

    const blurPx = (item.blur ?? 0) + depthBlur * Math.max(depth - 1, 0)
    const entranceTargetBlur = item.blur ?? 0
    const size = (item.size ?? 160) * sizeFactor
    const baseOpacity = item.opacity ?? 1
    const fogOpacity = Math.min(Math.max(1 - depth * 0.7, 0), 1)
    const isPlaceholder = !item.image?.src
    const contentHeight = isPlaceholder ? size * 0.82 : undefined

    return (
        <div
            style={{
                position: "absolute",
                left: `${item.x ?? 50}%`,
                top: `${item.y ?? 50}%`,
                transform: "translate(-50%, -50%)",
                zIndex: item.zIndex ?? Math.round(depth * 10),
                pointerEvents: "none",
                transformStyle: "preserve-3d",
            }}
        >
            {/* scroll-driven layer */}
            <motion.div
                style={{
                    y,
                    x,
                    rotateZ,
                    rotateX,
                    rotateY,
                    scale,
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                }}
            >
                {/* mouse-driven layer */}
                <motion.div
                    style={{
                        x: mouseParallax ? mX : zeroMV,
                        y: mouseParallax ? mY : zeroMV,
                        willChange: "transform",
                    }}
                >
                    {/* idle floating layer */}
                    <motion.div
                        animate={
                            idleFloat
                                ? {
                                      y: [
                                          -floatAmplitude,
                                          floatAmplitude,
                                          -floatAmplitude,
                                      ],
                                  }
                                : { y: 0 }
                        }
                        transition={
                            idleFloat
                                ? {
                                      duration: floatSpeed + index * 0.6,
                                      repeat: Infinity,
                                      ease: "easeInOut",
                                      delay: index * 0.35,
                                  }
                                : { duration: 0 }
                        }
                    >
                        {item.image?.src ? (
                            <motion.div
                                initial={
                                    entranceAnim
                                        ? {
                                              opacity: 0,
                                              scale: 0.7,
                                              filter: "blur(12px)",
                                          }
                                        : false
                                }
                                animate={
                                    entranceAnim
                                        ? {
                                              opacity: baseOpacity,
                                              scale: 1,
                                              filter:
                                                  entranceTargetBlur > 0
                                                      ? `blur(${entranceTargetBlur}px)`
                                                      : "none",
                                          }
                                        : undefined
                                }
                                transition={
                                    entranceAnim
                                        ? {
                                              type: "spring",
                                              stiffness: 80,
                                              damping: 18,
                                              mass: 0.8,
                                              delay: index * entranceDelay,
                                          }
                                        : undefined
                                }
                                style={{
                                    position: "relative",
                                    display: "inline-block",
                                    opacity: entranceAnim ? undefined : baseOpacity,
                                    filter:
                                        entranceAnim
                                            ? undefined
                                            : blurPx > 0
                                              ? `blur(${blurPx}px)`
                                              : "none",
                                }}
                            >
                                <img
                                    src={item.image.src}
                                    srcSet={item.image.srcSet}
                                    alt={item.image.alt || "object"}
                                    style={{
                                        width: size,
                                        height: "auto",
                                        display: "block",
                                        userSelect: "none",
                                    }}
                                    draggable={false}
                                />
                                {depthFog && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            pointerEvents: "none",
                                            borderRadius: 0,
                                            backgroundColor: fogColor,
                                            opacity: fogOpacity,
                                        }}
                                    />
                                )}
                            </motion.div>
                        ) : (
                            // placeholder "rock" until an image is added
                            <motion.div
                                initial={
                                    entranceAnim
                                        ? {
                                              opacity: 0,
                                              scale: 0.7,
                                              filter: "blur(12px)",
                                          }
                                        : false
                                }
                                animate={
                                    entranceAnim
                                        ? {
                                              opacity: baseOpacity,
                                              scale: 1,
                                              filter:
                                                  entranceTargetBlur > 0
                                                      ? `blur(${entranceTargetBlur}px)`
                                                      : "none",
                                          }
                                        : undefined
                                }
                                transition={
                                    entranceAnim
                                        ? {
                                              type: "spring",
                                              stiffness: 80,
                                              damping: 18,
                                              mass: 0.8,
                                              delay: index * entranceDelay,
                                          }
                                        : undefined
                                }
                                style={{
                                    position: "relative",
                                    width: size,
                                    height: contentHeight,
                                    opacity: entranceAnim ? undefined : baseOpacity,
                                    filter:
                                        entranceAnim
                                            ? undefined
                                            : blurPx > 0
                                              ? `blur(${blurPx}px)`
                                              : "none",
                                }}
                            >
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        borderRadius:
                                            "42% 58% 55% 45% / 48% 40% 60% 52%",
                                        background:
                                            "radial-gradient(circle at 32% 28%, #9aa094 0%, #6b7065 45%, #3f443c 100%)",
                                        boxShadow:
                                            "inset -12px -14px 30px rgba(0,0,0,0.45), inset 8px 10px 24px rgba(255,255,255,0.12)",
                                    }}
                                />
                                {depthFog && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            pointerEvents: "none",
                                            borderRadius:
                                                "42% 58% 55% 45% / 48% 40% 60% 52%",
                                            backgroundColor: fogColor,
                                            opacity: fogOpacity,
                                        }}
                                    />
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    )
}

const defaultProps: MyComponentProps = {
    items: [
        { x: 18, y: 30, size: 150, depth: 1.4, rotateStart: -12, rotateZ: 40, rotateX: 15, rotateY: -20, driftX: 60, blur: 0, opacity: 1 },
        { x: 78, y: 22, size: 110, depth: 0.7, rotateStart: 20, rotateZ: -30, rotateX: -10, rotateY: 15, driftX: -40, blur: 1, opacity: 1 },
        { x: 62, y: 62, size: 220, depth: 1.8, rotateStart: 0, rotateZ: 55, rotateX: 25, rotateY: 30, driftX: 90, blur: 0, opacity: 1 },
        { x: 30, y: 74, size: 90, depth: 0.5, rotateStart: 35, rotateZ: -20, rotateX: 0, rotateY: -25, driftX: -70, blur: 2, opacity: 0.9 },
        { x: 88, y: 70, size: 130, depth: 1.1, rotateStart: -25, rotateZ: 35, rotateX: 20, rotateY: 10, driftX: 30, blur: 0, opacity: 1 },
        { x: 46, y: 18, size: 70, depth: 0.35, rotateStart: 10, rotateZ: -15, rotateX: -15, rotateY: 20, driftX: -25, blur: 3, opacity: 0.8 },
    ],
    intensity: 260,
    direction: "up",
    smoothing: true,
    smoothAmount: 0.5,
    scaleOnScroll: 0.08,
    depthBlur: 0,
    perspective: 1200,
    mouseParallax: true,
    mouseStrength: 30,
    deviceOrient: true,
    idleFloat: true,
    floatAmplitude: 8,
    floatSpeed: 4,
    entranceAnim: true,
    entranceDelay: 0.12,
    backgroundColor: "rgba(0,0,0,0)",
    depthFog: false,
    fogColor: "rgba(255,255,255,0.6)",
    previewProgress: 0.5,
}
ScrollRocks3D.defaultProps = defaultProps

addPropertyControls(ScrollRocks3D, {
    // ---------- OBJECTS ----------
    items: {
        type: ControlType.Array,
        title: "Objects",
        control: {
            type: ControlType.Object,
            title: "Object",
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    description: "Transparent PNG/WebP works best",
                },
                x: {
                    type: ControlType.Number,
                    title: "X Position",
                    min: -20,
                    max: 120,
                    unit: "%",
                    defaultValue: 50,
                },
                y: {
                    type: ControlType.Number,
                    title: "Y Position",
                    min: -20,
                    max: 120,
                    unit: "%",
                    defaultValue: 50,
                },
                size: {
                    type: ControlType.Number,
                    title: "Size",
                    min: 20,
                    max: 800,
                    unit: "px",
                    defaultValue: 160,
                },
                depth: {
                    type: ControlType.Number,
                    title: "Depth (speed)",
                    min: 0.1,
                    max: 2.5,
                    step: 0.05,
                    defaultValue: 1,
                    description: "Higher = closer + faster",
                },
                driftX: {
                    type: ControlType.Number,
                    title: "Drift X",
                    min: -400,
                    max: 400,
                    unit: "px",
                    defaultValue: 0,
                },
                rotateStart: {
                    type: ControlType.Number,
                    title: "Rotation Start",
                    min: -180,
                    max: 180,
                    unit: "°",
                    defaultValue: 0,
                },
                rotateZ: {
                    type: ControlType.Number,
                    title: "Spin Z",
                    min: -360,
                    max: 360,
                    unit: "°",
                    defaultValue: 30,
                },
                rotateX: {
                    type: ControlType.Number,
                    title: "Tilt X (3D)",
                    min: -180,
                    max: 180,
                    unit: "°",
                    defaultValue: 0,
                },
                rotateY: {
                    type: ControlType.Number,
                    title: "Tilt Y (3D)",
                    min: -180,
                    max: 180,
                    unit: "°",
                    defaultValue: 0,
                },
                blur: {
                    type: ControlType.Number,
                    title: "Blur",
                    min: 0,
                    max: 20,
                    unit: "px",
                    defaultValue: 0,
                },
                opacity: {
                    type: ControlType.Number,
                    title: "Opacity",
                    min: 0,
                    max: 1,
                    step: 0.05,
                    defaultValue: 1,
                },
                zIndex: {
                    type: ControlType.Number,
                    title: "Z Index",
                    min: 0,
                    max: 50,
                    defaultValue: 10,
                },
            },
        },
    },

    // ---------- SCROLL MOTION ----------
    intensity: {
        type: ControlType.Number,
        title: "Scroll Intensity",
        min: 0,
        max: 800,
        unit: "px",
        defaultValue: 260,
        description: "Max parallax travel distance",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["up", "down"],
        optionTitles: ["Up", "Down"],
        displaySegmentedControl: true,
        defaultValue: "up",
    },
    smoothing: {
        type: ControlType.Boolean,
        title: "Smoothing",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    smoothAmount: {
        type: ControlType.Number,
        title: "↳ Amount",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.5,
        hidden: (p: MyComponentProps) => !p.smoothing,
        description: "How much easing is applied to scroll response.",
    },
    scaleOnScroll: {
        type: ControlType.Number,
        title: "Scale Effect",
        min: 0,
        max: 0.4,
        step: 0.01,
        defaultValue: 0.08,
    },
    depthBlur: {
        type: ControlType.Number,
        title: "Depth Blur",
        min: 0,
        max: 10,
        step: 0.5,
        defaultValue: 0,
        description: "Auto-blur for deep objects",
    },
    perspective: {
        type: ControlType.Number,
        title: "3D Perspective",
        min: 300,
        max: 3000,
        unit: "px",
        defaultValue: 1200,
    },

    // ---------- MOUSE ----------
    mouseParallax: {
        type: ControlType.Boolean,
        title: "Mouse Parallax",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    mouseStrength: {
        type: ControlType.Number,
        title: "↳ Strength",
        min: 0,
        max: 120,
        unit: "px",
        defaultValue: 30,
        hidden: (p: MyComponentProps) => !p.mouseParallax,
        description: "Maximum pointer/device offset in pixels.",
    },
    deviceOrient: {
        type: ControlType.Boolean,
        title: "Device Tilt",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
        hidden: (p: MyComponentProps) => !p.mouseParallax,
        description: "Uses phone/tablet tilt until pointer interaction begins.",
    },

    // ---------- IDLE FLOAT ----------
    idleFloat: {
        type: ControlType.Boolean,
        title: "Idle Float",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    floatAmplitude: {
        type: ControlType.Number,
        title: "↳ Amplitude",
        min: 0,
        max: 40,
        unit: "px",
        defaultValue: 8,
        hidden: (p: MyComponentProps) => !p.idleFloat,
    },
    floatSpeed: {
        type: ControlType.Number,
        title: "↳ Speed",
        min: 1,
        max: 12,
        step: 0.5,
        unit: "s",
        defaultValue: 4,
        hidden: (p: MyComponentProps) => !p.idleFloat,
    },
    entranceAnim: {
        type: ControlType.Boolean,
        title: "Entrance Animation",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    entranceDelay: {
        type: ControlType.Number,
        title: "Stagger Delay",
        min: 0,
        max: 0.5,
        step: 0.01,
        unit: "s",
        defaultValue: 0.12,
        hidden: (p: MyComponentProps) => !p.entranceAnim,
        description: "Per-object delay for entrance staggering.",
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(0,0,0,0)",
    },
    depthFog: {
        type: ControlType.Boolean,
        title: "Depth Fog",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: false,
    },
    fogColor: {
        type: ControlType.Color,
        title: "Fog Color",
        defaultValue: "rgba(255,255,255,0.6)",
        hidden: (p: MyComponentProps) => !p.depthFog,
    },

    // ---------- CANVAS PREVIEW ----------
    previewProgress: {
        type: ControlType.Number,
        title: "Preview Scrub",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.5,
        description: "Canvas-only: scrub scroll position to preview the effect",
    },
})
