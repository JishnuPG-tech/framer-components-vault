import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type GalleryItem = {
    image?: string | { src?: string; url?: string; alt?: string }
    title?: string
    alt?: string
    link?: string
}

type SceneSettings = {
    density: number
    cardWidth: number
    aspect: number
    depth: number
    perspective: number
    spreadX: number
    spreadY: number
    seed: number
    responsive: boolean
}

type MotionSettings = {
    dragSpeed: number
    zoomSpeed: number
    inertia: number
    autoSpeed: number
    parallax: number
    scrollTravel: boolean
    wheelMode: "capture" | "page" | "off"
    touchDrag: boolean
}

type AppearanceSettings = {
    background: string
    radius: number
    borderWidth: number
    borderColor: string
    shadow: string
    imageFit: "cover" | "contain"
    imageDim: number
    caption: "off" | "hover" | "always"
    captionColor: string
    captionBackground: string
    captionSize: number
}

type Props = {
    items: GalleryItem[]
    scene: SceneSettings
    motion: MotionSettings
    appearance: AppearanceSettings
    clickAction: "fullscreen" | "link" | "none"
    linkTarget: "_self" | "_blank"
    showHint: boolean
    hintText: string
    hintColor: string
    style?: React.CSSProperties
}

type Slot = {
    id: number
    itemIndex: number
    x: number
    y: number
    z: number
    tilt: number
}

type Point = { x: number; y: number }

type Runtime = {
    panX: number
    panY: number
    depth: number
    velocityX: number
    velocityY: number
    velocityZ: number
    pointerX: number
    pointerY: number
    targetPointerX: number
    targetPointerY: number
    pointers: Map<number, Point>
    lastPointer: Point | null
    lastPointerTime: number
    lastPinchDistance: number
    dragging: boolean
    moved: boolean
    travel: number
}

const DEFAULT_ITEMS: GalleryItem[] = [
    {
        image: "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=1200&q=85",
        title: "Chromatic Field",
        alt: "Colorful abstract artwork",
    },
    {
        image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=85",
        title: "Quiet Portrait",
        alt: "Portrait painting",
    },
    {
        image: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1200&q=85",
        title: "Soft Geometry",
        alt: "Abstract geometric artwork",
    },
    {
        image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=85",
        title: "Afterimage",
        alt: "Vivid abstract painting",
    },
    {
        image: "https://images.unsplash.com/photo-1573221566340-81bdde00e00b?auto=format&fit=crop&w=1200&q=85",
        title: "Blue Study",
        alt: "Blue abstract artwork",
    },
    {
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85",
        title: "Elsewhere",
        alt: "Atmospheric landscape",
    },
]

const DEFAULT_SCENE: SceneSettings = {
    density: 38,
    cardWidth: 250,
    aspect: 1.25,
    depth: 1800,
    perspective: 720,
    spreadX: 2.5,
    spreadY: 2.2,
    seed: 14,
    responsive: true,
}

const DEFAULT_MOTION: MotionSettings = {
    dragSpeed: 1,
    zoomSpeed: 1,
    inertia: 0.92,
    autoSpeed: 18,
    parallax: 34,
    scrollTravel: true,
    wheelMode: "capture",
    touchDrag: true,
}

const DEFAULT_APPEARANCE: AppearanceSettings = {
    background: "#F2F0EA",
    radius: 2,
    borderWidth: 0,
    borderColor: "rgba(255,255,255,0.45)",
    shadow: "0 18px 55px rgba(25, 20, 12, 0.16)",
    imageFit: "cover",
    imageDim: 0,
    caption: "hover",
    captionColor: "#FFFFFF",
    captionBackground: "rgba(0,0,0,0.34)",
    captionSize: 12,
}

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value))

const mod = (value: number, divisor: number) =>
    ((value % divisor) + divisor) % divisor

const wrapCentered = (value: number, span: number) =>
    mod(value + span / 2, span) - span / 2

const smoothstep = (edge0: number, edge1: number, value: number) => {
    const t = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)
}

const random = (seed: number) => {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
    return x - Math.floor(x)
}

const imageSource = (image: GalleryItem["image"]) => {
    if (typeof image === "string") return image
    return image?.src || image?.url || ""
}

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

const createRuntime = (): Runtime => ({
    panX: 0,
    panY: 0,
    depth: 0,
    velocityX: 0,
    velocityY: 0,
    velocityZ: 0,
    pointerX: 0,
    pointerY: 0,
    targetPointerX: 0,
    targetPointerY: 0,
    pointers: new Map(),
    lastPointer: null,
    lastPointerTime: 0,
    lastPinchDistance: 0,
    dragging: false,
    moved: false,
    travel: 0,
})

/**
 * Infinite Canvas 3D
 *
 * An infinite, dependency-free media space for Framer. Drag to explore and
 * use the wheel or a two-finger pinch to travel through depth.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 760
 */
export default function InfiniteCanvas3D(props: Props) {
    const {
        items = DEFAULT_ITEMS,
        scene: sceneProp,
        motion: motionProp,
        appearance: appearanceProp,
        clickAction = "fullscreen",
        linkTarget = "_self",
        showHint = true,
        hintText = "DRAG TO EXPLORE  ·  SCROLL TO TRAVEL",
        hintColor = "rgba(24, 22, 18, 0.52)",
        style,
    } = props

    const scene = React.useMemo(
        () => ({ ...DEFAULT_SCENE, ...sceneProp }),
        [sceneProp]
    )
    const motion = React.useMemo(
        () => ({ ...DEFAULT_MOTION, ...motionProp }),
        [motionProp]
    )
    const appearance = React.useMemo(
        () => ({ ...DEFAULT_APPEARANCE, ...appearanceProp }),
        [appearanceProp]
    )
    const safeItems = items?.length ? items : DEFAULT_ITEMS
    const [activeIndex, setActiveIndex] = React.useState<number | null>(null)
    const rootRef = React.useRef<HTMLDivElement>(null)
    const cardRefs = React.useRef<Array<HTMLDivElement | null>>([])
    const runtimeRef = React.useRef<Runtime>(createRuntime())
    const sizeRef = React.useRef({ width: 1200, height: 760 })
    const frameRef = React.useRef<number | null>(null)
    const reducedMotionRef = React.useRef(false)
    const isStatic = useIsStaticRenderer()
    const reactId = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const className = `infinite-canvas-${reactId}`

    const density = Math.round(clamp(scene.density, 8, 80))
    const slots = React.useMemo<Slot[]>(() => {
        return Array.from({ length: density }, (_, index) => {
            const base = scene.seed * 1009 + index * 97
            return {
                id: index,
                itemIndex: index % safeItems.length,
                x: random(base + 1) - 0.5,
                y: random(base + 2) - 0.5,
                z: (index + random(base + 3) * 0.72) / density,
                tilt: (random(base + 4) - 0.5) * 5,
            }
        })
    }, [density, scene.seed, safeItems.length])

    const renderFrame = React.useCallback(() => {
        const width = Math.max(1, sizeRef.current.width)
        const height = Math.max(1, sizeRef.current.height)
        const state = runtimeRef.current
        const depthSpan = Math.max(300, scene.depth)
        const near = 12
        const fieldWidth = Math.max(
            width * scene.spreadX,
            width + scene.cardWidth
        )
        const fieldHeight = Math.max(
            height * scene.spreadY,
            height + scene.cardWidth
        )
        const baseWidth = scene.responsive
            ? Math.min(scene.cardWidth, width * 0.68)
            : scene.cardWidth
        const cardHeight = baseWidth / Math.max(0.3, scene.aspect)
        const focal = Math.max(180, scene.perspective)

        slots.forEach((slot, index) => {
            const node = cardRefs.current[index]
            if (!node) return

            const z = near + mod(slot.z * depthSpan - state.depth, depthSpan)
            const projection = focal / (focal + z)
            const worldX = wrapCentered(
                slot.x * fieldWidth + state.panX,
                fieldWidth
            )
            const worldY = wrapCentered(
                slot.y * fieldHeight + state.panY,
                fieldHeight
            )
            const depthRatio = z / depthSpan
            const parallaxX =
                -state.pointerX * motion.parallax * (0.25 + depthRatio * 0.75)
            const parallaxY =
                -state.pointerY * motion.parallax * (0.25 + depthRatio * 0.75)
            const x = (worldX + parallaxX) * projection
            const y = (worldY + parallaxY) * projection
            const nearFade = smoothstep(
                near,
                near + Math.min(110, depthSpan * 0.1),
                z
            )
            const farFade =
                1 - smoothstep(depthSpan * 0.68, depthSpan + near, z)
            const opacity = clamp(nearFade * farFade, 0, 1)
            const rotate = slot.tilt * (0.3 + projection * 0.7)

            node.style.width = `${baseWidth}px`
            node.style.height = `${cardHeight}px`
            node.style.opacity = `${opacity}`
            node.style.zIndex = `${Math.round((1 - depthRatio) * 1000)}`
            node.style.pointerEvents = opacity > 0.35 ? "auto" : "none"
            node.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${projection}) rotate(${rotate}deg)`
        })
    }, [motion.parallax, scene, slots])

    React.useLayoutEffect(() => {
        if (isStatic) return

        const root = rootRef.current
        if (!root) return

        const measure = () => {
            const rect = root.getBoundingClientRect()
            sizeRef.current = {
                width: rect.width || 1200,
                height: rect.height || 760,
            }
            renderFrame()
        }

        measure()
        const observer =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(measure)
                : null
        observer?.observe(root)
        return () => observer?.disconnect()
    }, [isStatic, renderFrame])

    React.useEffect(() => {
        const root = rootRef.current
        if (!root || isStatic) return

        reducedMotionRef.current =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        renderFrame()

        if (activeIndex !== null) return

        let lastTime = performance.now()
        let running = false
        let inViewport = typeof IntersectionObserver === "undefined"
        let documentVisible = document.visibilityState !== "hidden"

        const stop = () => {
            running = false
            if (frameRef.current !== null) {
                cancelAnimationFrame(frameRef.current)
                frameRef.current = null
            }
        }

        const start = () => {
            if (running || !inViewport || !documentVisible) return
            running = true
            lastTime = performance.now()
            frameRef.current = requestAnimationFrame(tick)
        }

        const tick = (now: number) => {
            if (!running) return
            const state = runtimeRef.current
            const dt = Math.min(0.04, Math.max(0.001, (now - lastTime) / 1000))
            lastTime = now
            const decay = Math.pow(clamp(motion.inertia, 0.7, 0.985), dt * 60)
            const autoSpeed = reducedMotionRef.current ? 0 : motion.autoSpeed

            state.panX += state.velocityX * dt
            state.panY += state.velocityY * dt
            state.depth += (state.velocityZ + autoSpeed) * dt
            state.velocityX *= decay
            state.velocityY *= decay
            state.velocityZ *= decay
            state.pointerX +=
                (state.targetPointerX - state.pointerX) * Math.min(1, dt * 7)
            state.pointerY +=
                (state.targetPointerY - state.pointerY) * Math.min(1, dt * 7)

            const width = Math.max(1, sizeRef.current.width)
            const height = Math.max(1, sizeRef.current.height)
            state.panX = wrapCentered(
                state.panX,
                Math.max(width * scene.spreadX, width + scene.cardWidth)
            )
            state.panY = wrapCentered(
                state.panY,
                Math.max(height * scene.spreadY, height + scene.cardWidth)
            )
            state.depth = mod(state.depth, Math.max(300, scene.depth))

            renderFrame()
            frameRef.current = requestAnimationFrame(tick)
        }

        const intersectionObserver =
            typeof IntersectionObserver !== "undefined"
                ? new IntersectionObserver(
                      (entries) => {
                          inViewport = entries.some(
                              (entry) => entry.isIntersecting
                          )
                          if (inViewport && documentVisible) start()
                          else stop()
                      },
                      { threshold: 0.01 }
                  )
                : null

        const onVisibilityChange = () => {
            documentVisible = document.visibilityState !== "hidden"
            if (documentVisible && inViewport) start()
            else stop()
        }

        intersectionObserver?.observe(root)
        document.addEventListener("visibilitychange", onVisibilityChange)
        if (!intersectionObserver) start()

        return () => {
            intersectionObserver?.disconnect()
            document.removeEventListener("visibilitychange", onVisibilityChange)
            stop()
        }
    }, [
        activeIndex,
        isStatic,
        motion.autoSpeed,
        motion.inertia,
        renderFrame,
        scene,
    ])

    const updateNormalizedPointer = React.useCallback(
        (clientX: number, clientY: number) => {
            const rect = rootRef.current?.getBoundingClientRect()
            if (!rect) return
            const state = runtimeRef.current
            state.targetPointerX = clamp(
                ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1,
                -1,
                1
            )
            state.targetPointerY = clamp(
                ((clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1,
                -1,
                1
            )
        },
        []
    )

    const onPointerDown = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (isStatic) return
            if (event.pointerType === "touch" && !motion.touchDrag) return
            const state = runtimeRef.current
            state.pointers.set(event.pointerId, {
                x: event.clientX,
                y: event.clientY,
            })
            state.dragging = true
            state.moved = false
            state.travel = 0
            state.lastPointer = { x: event.clientX, y: event.clientY }
            state.lastPointerTime = performance.now()
            if (state.pointers.size === 2) {
                const points = Array.from(state.pointers.values())
                state.lastPinchDistance = distance(points[0], points[1])
            }
            const eventTarget = event.target
            const interactiveTarget =
                eventTarget instanceof Element
                    ? (eventTarget.closest(".ic3d-inner") as HTMLElement | null)
                    : null
            const captureTarget = interactiveTarget || event.currentTarget
            captureTarget.setPointerCapture?.(event.pointerId)
            event.currentTarget.style.cursor = "grabbing"
        },
        [isStatic, motion.touchDrag]
    )

    const onPointerMove = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            updateNormalizedPointer(event.clientX, event.clientY)
            const state = runtimeRef.current
            if (!state.pointers.has(event.pointerId)) return

            const previous = state.pointers.get(event.pointerId)!
            const next = { x: event.clientX, y: event.clientY }
            state.pointers.set(event.pointerId, next)

            if (state.pointers.size >= 2) {
                const points = Array.from(state.pointers.values())
                const nextDistance = distance(points[0], points[1])
                if (state.lastPinchDistance > 0) {
                    const delta = nextDistance - state.lastPinchDistance
                    state.depth += delta * motion.zoomSpeed * 1.35
                    state.velocityZ = delta * motion.zoomSpeed * 18
                    state.travel += Math.abs(delta)
                    if (state.travel > 6) state.moved = true
                }
                state.lastPinchDistance = nextDistance
                return
            }

            const dx = next.x - previous.x
            const dy = next.y - previous.y
            const now = performance.now()
            const elapsed = Math.max(8, now - state.lastPointerTime)
            state.panX += dx * motion.dragSpeed
            state.panY += dy * motion.dragSpeed
            state.velocityX = (dx * motion.dragSpeed * 1000) / elapsed
            state.velocityY = (dy * motion.dragSpeed * 1000) / elapsed
            state.travel += Math.hypot(dx, dy)
            if (state.travel > 6) state.moved = true
            state.lastPointer = next
            state.lastPointerTime = now
        },
        [motion.dragSpeed, motion.zoomSpeed, updateNormalizedPointer]
    )

    const releasePointer = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            const state = runtimeRef.current
            state.pointers.delete(event.pointerId)
            state.lastPinchDistance = 0
            if (state.pointers.size === 0) {
                state.dragging = false
                state.lastPointer = null
                event.currentTarget.style.cursor = "grab"
            } else {
                const point = Array.from(state.pointers.values())[0]
                state.lastPointer = point
                state.lastPointerTime = performance.now()
            }
        },
        []
    )

    React.useEffect(() => {
        const root = rootRef.current
        if (
            !root ||
            isStatic ||
            !motion.scrollTravel ||
            motion.wheelMode === "off"
        )
            return

        const onWheel = (event: WheelEvent) => {
            if (motion.wheelMode === "capture") event.preventDefault()
            const state = runtimeRef.current
            const delta = clamp(event.deltaY, -160, 160)
            state.velocityZ += delta * motion.zoomSpeed * 3.2
        }

        root.addEventListener("wheel", onWheel, {
            passive: motion.wheelMode !== "capture",
        })
        return () => root.removeEventListener("wheel", onWheel)
    }, [isStatic, motion.scrollTravel, motion.wheelMode, motion.zoomSpeed])

    const onMouseLeave = React.useCallback(() => {
        const state = runtimeRef.current
        if (!state.dragging) {
            state.targetPointerX = 0
            state.targetPointerY = 0
        }
    }, [])

    const onLinkClick = React.useCallback(
        (event: React.MouseEvent<HTMLAnchorElement>) => {
            if (runtimeRef.current.moved) event.preventDefault()
        },
        []
    )

    const onFullscreenClick = React.useCallback(
        (event: React.MouseEvent<HTMLButtonElement>, itemIndex: number) => {
            if (runtimeRef.current.moved || isStatic) {
                event.preventDefault()
                return
            }

            const source = imageSource(safeItems[itemIndex]?.image)
            const useNativeMobileViewer =
                typeof window !== "undefined" &&
                (window.matchMedia?.("(hover: none) and (pointer: coarse)")
                    .matches ||
                    (typeof navigator !== "undefined" &&
                        navigator.maxTouchPoints > 0 &&
                        window.innerWidth <= 1024))

            if (useNativeMobileViewer && source) {
                event.preventDefault()
                window.location.assign(source)
                return
            }

            setActiveIndex(itemIndex)
        },
        [isStatic, safeItems]
    )

    const closeLightbox = React.useCallback(() => {
        setActiveIndex(null)
    }, [])

    const moveLightbox = React.useCallback(
        (direction: number) => {
            setActiveIndex((current) => {
                if (current === null) return null
                return mod(current + direction, safeItems.length)
            })
        },
        [safeItems.length]
    )

    React.useEffect(() => {
        if (isStatic || activeIndex === null || typeof document === "undefined")
            return

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeLightbox()
            if (event.key === "ArrowLeft") moveLightbox(-1)
            if (event.key === "ArrowRight") moveLightbox(1)
        }

        document.addEventListener("keydown", onKeyDown)
        return () => {
            document.body.style.overflow = previousOverflow
            document.removeEventListener("keydown", onKeyDown)
        }
    }, [activeIndex, closeLightbox, isStatic, moveLightbox])

    const activeItem = activeIndex === null ? null : safeItems[activeIndex]
    const activeSource = activeItem ? imageSource(activeItem.image) : ""
    const activeAlt =
        activeItem?.alt ||
        (typeof activeItem?.image === "object" ? activeItem.image.alt : "") ||
        activeItem?.title ||
        "Gallery image"

    const lightbox =
        !isStatic && activeIndex !== null && activeItem && activeSource ? (
            <div
                role="dialog"
                aria-modal="true"
                aria-label={activeItem.title || "Fullscreen image viewer"}
                onPointerDown={(event) => {
                    event.stopPropagation()
                    if (event.target === event.currentTarget) closeLightbox()
                }}
                style={{
                    position: "absolute",
                    inset: 0,
                    margin: 0,
                    border: 0,
                    width: "100%",
                    height: "100%",
                    maxWidth: "none",
                    maxHeight: "none",
                    zIndex: 2147483647,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "72px 16px 76px",
                    boxSizing: "border-box",
                    overflow: "hidden",
                    overscrollBehavior: "contain",
                    touchAction: "none",
                    background: "#0A0A0A",
                    pointerEvents: "auto",
                }}
            >
                <button
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        closeLightbox()
                    }}
                    autoFocus
                    aria-label="Close fullscreen image"
                    style={{
                        position: "absolute",
                        top: "calc(16px + env(safe-area-inset-top, 0px))",
                        right: "calc(16px + env(safe-area-inset-right, 0px))",
                        zIndex: 3,
                        width: 48,
                        height: 48,
                        border: "1px solid rgba(255,255,255,0.22)",
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.08)",
                        color: "#FFFFFF",
                        font: "300 30px/1 Inter, ui-sans-serif, system-ui, sans-serif",
                        cursor: "pointer",
                        touchAction: "manipulation",
                        WebkitTapHighlightColor: "transparent",
                    }}
                >
                    ×
                </button>

                {safeItems.length > 1 && (
                    <>
                        <button
                            type="button"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={(event) => {
                                event.preventDefault()
                                event.stopPropagation()
                                moveLightbox(-1)
                            }}
                            aria-label="Previous image"
                            style={{
                                position: "absolute",
                                left: "calc(16px + env(safe-area-inset-left, 0px))",
                                bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
                                zIndex: 3,
                                width: 48,
                                height: 48,
                                border: "1px solid rgba(255,255,255,0.22)",
                                borderRadius: 999,
                                background: "rgba(255,255,255,0.08)",
                                color: "#FFFFFF",
                                font: "400 24px/1 Inter, ui-sans-serif, system-ui, sans-serif",
                                cursor: "pointer",
                                touchAction: "manipulation",
                                WebkitTapHighlightColor: "transparent",
                            }}
                        >
                            ←
                        </button>
                        <button
                            type="button"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={(event) => {
                                event.preventDefault()
                                event.stopPropagation()
                                moveLightbox(1)
                            }}
                            aria-label="Next image"
                            style={{
                                position: "absolute",
                                right: "calc(16px + env(safe-area-inset-right, 0px))",
                                bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
                                zIndex: 3,
                                width: 48,
                                height: 48,
                                border: "1px solid rgba(255,255,255,0.22)",
                                borderRadius: 999,
                                background: "rgba(255,255,255,0.08)",
                                color: "#FFFFFF",
                                font: "400 24px/1 Inter, ui-sans-serif, system-ui, sans-serif",
                                cursor: "pointer",
                                touchAction: "manipulation",
                                WebkitTapHighlightColor: "transparent",
                            }}
                        >
                            →
                        </button>
                    </>
                )}

                <figure
                    onPointerDown={(event) => event.stopPropagation()}
                    style={{
                        position: "relative",
                        zIndex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 16,
                        maxWidth: "100%",
                        maxHeight: "100%",
                        margin: 0,
                        pointerEvents: "auto",
                    }}
                >
                    <img
                        key={activeSource}
                        src={activeSource}
                        alt={activeAlt}
                        draggable={false}
                        style={{
                            display: "block",
                            maxWidth: "calc(100vw - 32px)",
                            maxHeight: activeItem.title
                                ? "calc(100vh - 180px)"
                                : "calc(100vh - 140px)",
                            width: "auto",
                            height: "auto",
                            objectFit: "contain",
                            borderRadius: Math.min(appearance.radius, 24),
                            boxShadow: "0 28px 100px rgba(0,0,0,0.52)",
                        }}
                    />
                    {activeItem.title && (
                        <figcaption
                            style={{
                                color: "rgba(255,255,255,0.82)",
                                font: "500 13px/1.3 Inter, ui-sans-serif, system-ui, sans-serif",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                            }}
                        >
                            {activeItem.title}
                        </figcaption>
                    )}
                </figure>
            </div>
        ) : null

    const cursor = runtimeRef.current.dragging ? "grabbing" : "grab"
    const touchAction =
        motion.touchDrag && motion.scrollTravel ? "none" : "pan-y"
    const visibleSlots = isStatic
        ? slots.slice(0, Math.min(slots.length, 24))
        : slots

    return (
        <>
            <div
                ref={rootRef}
                className={className}
                style={{
                    ...style,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    minWidth: 1,
                    minHeight: 1,
                    overflow: "hidden",
                    background: appearance.background,
                    cursor: isStatic ? "default" : cursor,
                    touchAction: isStatic ? "auto" : touchAction,
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    isolation: "isolate",
                }}
                onPointerDown={isStatic ? undefined : onPointerDown}
                onPointerMove={isStatic ? undefined : onPointerMove}
                onPointerUp={isStatic ? undefined : releasePointer}
                onPointerCancel={isStatic ? undefined : releasePointer}
                onMouseLeave={isStatic ? undefined : onMouseLeave}
                aria-label="Interactive infinite media gallery"
            >
                <style>{`
                .${className} .ic3d-card {
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform-origin: center;
                    will-change: ${isStatic ? "auto" : "transform, opacity"};
                    backface-visibility: hidden;
                }
                .${className} .ic3d-inner {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    display: block;
                    overflow: hidden;
                    text-decoration: none;
                    color: inherit;
                    outline: none;
                    -webkit-tap-highlight-color: transparent;
                }
                .${className} .ic3d-image {
                    width: 100%;
                    height: 100%;
                    display: block;
                    pointer-events: none;
                    transition: ${isStatic ? "none" : "transform 500ms cubic-bezier(.2,.7,.2,1), filter 300ms ease"};
                }
                .${className} .ic3d-inner:hover .ic3d-image,
                .${className} .ic3d-inner:focus-visible .ic3d-image {
                    transform: scale(1.035);
                }
                .${className} .ic3d-caption {
                    position: absolute;
                    left: 10px;
                    right: 10px;
                    bottom: 10px;
                    width: max-content;
                    max-width: calc(100% - 20px);
                    padding: 6px 9px;
                    border-radius: 999px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    line-height: 1.15;
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    transition: ${isStatic ? "none" : "opacity 220ms ease, transform 220ms ease"};
                    pointer-events: none;
                }
                .${className} .ic3d-caption-hover {
                    opacity: 0;
                    transform: translateY(5px);
                }
                .${className} .ic3d-inner:hover .ic3d-caption-hover,
                .${className} .ic3d-inner:focus-visible .ic3d-caption-hover {
                    opacity: 1;
                    transform: translateY(0);
                }
                @media (prefers-reduced-motion: reduce) {
                    .${className} .ic3d-image,
                    .${className} .ic3d-caption { transition: none; }
                }
            `}</style>

                {visibleSlots.map((slot, index) => {
                    const item = safeItems[slot.itemIndex] || safeItems[0]
                    const src = imageSource(item?.image)
                    const alt =
                        item?.alt ||
                        (typeof item?.image === "object"
                            ? item.image.alt
                            : "") ||
                        item?.title ||
                        ""
                    const hasLink =
                        !isStatic &&
                        clickAction === "link" &&
                        Boolean(item?.link)
                    const opensFullscreen =
                        clickAction === "fullscreen" &&
                        Boolean(src) &&
                        !isStatic
                    const staticDepth = mod(slot.z + 0.08, 1)
                    const staticScale = 0.3 + (1 - staticDepth) * 0.72
                    const cardStyle: React.CSSProperties = isStatic
                        ? {
                              left: `${50 + slot.x * 88}%`,
                              top: `${50 + slot.y * 80}%`,
                              width: scene.responsive
                                  ? `min(${scene.cardWidth}px, 38%)`
                                  : scene.cardWidth,
                              aspectRatio: `${Math.max(0.3, scene.aspect)}`,
                              opacity: clamp(
                                  0.16 + (1 - staticDepth) * 0.84,
                                  0,
                                  1
                              ),
                              zIndex: Math.round((1 - staticDepth) * 1000),
                              pointerEvents: "none",
                              transform: `translate(-50%, -50%) scale(${staticScale}) rotate(${slot.tilt}deg)`,
                          }
                        : { opacity: 0 }
                    const innerStyle: React.CSSProperties = {
                        borderRadius: appearance.radius,
                        border: `${appearance.borderWidth}px solid ${appearance.borderColor}`,
                        boxShadow: appearance.shadow,
                        background: src
                            ? "rgba(255,255,255,0.08)"
                            : "linear-gradient(135deg, #D9D2C3, #A6A093)",
                    }

                    const content = (
                        <>
                            {src ? (
                                <img
                                    className="ic3d-image"
                                    src={src}
                                    alt={alt}
                                    draggable={false}
                                    loading={index < 10 ? "eager" : "lazy"}
                                    decoding="async"
                                    style={{
                                        objectFit: appearance.imageFit,
                                        filter:
                                            appearance.imageDim > 0
                                                ? `brightness(${1 - appearance.imageDim / 100})`
                                                : undefined,
                                    }}
                                />
                            ) : (
                                <div
                                    className="ic3d-image"
                                    aria-label={alt || "Empty gallery card"}
                                />
                            )}
                            {appearance.caption !== "off" && item?.title && (
                                <span
                                    className={`ic3d-caption ${appearance.caption === "hover" ? "ic3d-caption-hover" : ""}`}
                                    style={{
                                        color: appearance.captionColor,
                                        background:
                                            appearance.captionBackground,
                                        fontSize: appearance.captionSize,
                                        fontFamily:
                                            "Inter, ui-sans-serif, system-ui, sans-serif",
                                        fontWeight: 500,
                                    }}
                                >
                                    {item.title}
                                </span>
                            )}
                        </>
                    )

                    return (
                        <div
                            key={slot.id}
                            ref={(node) => {
                                cardRefs.current[index] = node
                            }}
                            className="ic3d-card"
                            style={cardStyle}
                        >
                            {opensFullscreen ? (
                                <button
                                    type="button"
                                    className="ic3d-inner"
                                    style={{
                                        ...innerStyle,
                                        padding: 0,
                                        cursor: "zoom-in",
                                    }}
                                    onClick={(event) =>
                                        onFullscreenClick(event, slot.itemIndex)
                                    }
                                    aria-label={`View ${item.title || alt || "gallery image"} fullscreen`}
                                >
                                    {content}
                                </button>
                            ) : hasLink ? (
                                <a
                                    className="ic3d-inner"
                                    style={innerStyle}
                                    href={item.link}
                                    target={linkTarget}
                                    rel={
                                        linkTarget === "_blank"
                                            ? "noopener noreferrer"
                                            : undefined
                                    }
                                    onClick={onLinkClick}
                                    aria-label={
                                        item.title || alt || "Open gallery item"
                                    }
                                >
                                    {content}
                                </a>
                            ) : (
                                <div className="ic3d-inner" style={innerStyle}>
                                    {content}
                                </div>
                            )}
                        </div>
                    )
                })}

                {showHint && (
                    <div
                        style={{
                            position: "absolute",
                            left: 20,
                            bottom: 18,
                            zIndex: 2000,
                            color: hintColor,
                            font: "500 10px/1.2 Inter, ui-sans-serif, system-ui, sans-serif",
                            letterSpacing: "0.12em",
                            pointerEvents: "none",
                        }}
                    >
                        {hintText}
                    </div>
                )}
                {lightbox}
            </div>
        </>
    )
}

InfiniteCanvas3D.defaultProps = {
    items: DEFAULT_ITEMS,
    scene: DEFAULT_SCENE,
    motion: DEFAULT_MOTION,
    appearance: DEFAULT_APPEARANCE,
    clickAction: "fullscreen",
    linkTarget: "_self",
    showHint: true,
    hintText: "DRAG TO EXPLORE  ·  SCROLL TO TRAVEL",
    hintColor: "rgba(24, 22, 18, 0.52)",
}

addPropertyControls(InfiniteCanvas3D as React.ComponentType<any>, {
    items: {
        type: ControlType.Array,
        title: "Images",
        maxCount: 24,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.Image, title: "Image" },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Artwork",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt Text",
                    defaultValue: "",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    clickAction: {
        type: ControlType.Enum,
        title: "On Click",
        options: ["fullscreen", "link", "none"],
        optionTitles: ["Fullscreen", "Link", "None"],
        defaultValue: "fullscreen",
        displaySegmentedControl: true,
    },
    linkTarget: {
        type: ControlType.Enum,
        title: "Links",
        options: ["_self", "_blank"],
        optionTitles: ["Same Tab", "New Tab"],
        defaultValue: "_self",
        displaySegmentedControl: true,
        hidden: (props) => props.clickAction !== "link",
    },
    scene: {
        type: ControlType.Object,
        title: "Scene",
        controls: {
            density: {
                type: ControlType.Number,
                title: "Density",
                min: 8,
                max: 80,
                step: 1,
                defaultValue: DEFAULT_SCENE.density,
            },
            cardWidth: {
                type: ControlType.Number,
                title: "Card Width",
                min: 80,
                max: 600,
                step: 1,
                unit: "px",
                defaultValue: DEFAULT_SCENE.cardWidth,
            },
            aspect: {
                type: ControlType.Number,
                title: "Aspect",
                min: 0.5,
                max: 2.2,
                step: 0.05,
                defaultValue: DEFAULT_SCENE.aspect,
            },
            depth: {
                type: ControlType.Number,
                title: "Depth",
                min: 500,
                max: 3200,
                step: 10,
                defaultValue: DEFAULT_SCENE.depth,
            },
            perspective: {
                type: ControlType.Number,
                title: "Perspective",
                min: 250,
                max: 1500,
                step: 10,
                defaultValue: DEFAULT_SCENE.perspective,
            },
            spreadX: {
                type: ControlType.Number,
                title: "Horizontal",
                min: 1.1,
                max: 5,
                step: 0.1,
                defaultValue: DEFAULT_SCENE.spreadX,
            },
            spreadY: {
                type: ControlType.Number,
                title: "Vertical",
                min: 1.1,
                max: 5,
                step: 0.1,
                defaultValue: DEFAULT_SCENE.spreadY,
            },
            seed: {
                type: ControlType.Number,
                title: "Layout Seed",
                min: 1,
                max: 999,
                step: 1,
                defaultValue: DEFAULT_SCENE.seed,
            },
            responsive: {
                type: ControlType.Boolean,
                title: "Responsive",
                defaultValue: DEFAULT_SCENE.responsive,
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            dragSpeed: {
                type: ControlType.Number,
                title: "Drag",
                min: 0.2,
                max: 2.5,
                step: 0.1,
                defaultValue: DEFAULT_MOTION.dragSpeed,
            },
            zoomSpeed: {
                type: ControlType.Number,
                title: "Zoom",
                min: 0.1,
                max: 3,
                step: 0.1,
                defaultValue: DEFAULT_MOTION.zoomSpeed,
            },
            inertia: {
                type: ControlType.Number,
                title: "Inertia",
                min: 0.7,
                max: 0.985,
                step: 0.005,
                defaultValue: DEFAULT_MOTION.inertia,
            },
            autoSpeed: {
                type: ControlType.Number,
                title: "Auto Travel",
                min: -100,
                max: 100,
                step: 1,
                defaultValue: DEFAULT_MOTION.autoSpeed,
            },
            parallax: {
                type: ControlType.Number,
                title: "Parallax",
                min: 0,
                max: 120,
                step: 1,
                defaultValue: DEFAULT_MOTION.parallax,
            },
            scrollTravel: {
                type: ControlType.Boolean,
                title: "Scroll Travel",
                defaultValue: DEFAULT_MOTION.scrollTravel,
            },
            wheelMode: {
                type: ControlType.Enum,
                title: "Page Scroll",
                options: ["capture", "page"],
                optionTitles: ["Lock Page", "Allow Page"],
                defaultValue: DEFAULT_MOTION.wheelMode,
                hidden: (value) => !value.scrollTravel,
            },
            touchDrag: {
                type: ControlType.Boolean,
                title: "Touch Drag",
                defaultValue: DEFAULT_MOTION.touchDrag,
            },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: DEFAULT_APPEARANCE.background,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                defaultValue: DEFAULT_APPEARANCE.radius,
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Border",
                min: 0,
                max: 8,
                step: 1,
                unit: "px",
                defaultValue: DEFAULT_APPEARANCE.borderWidth,
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border Color",
                defaultValue: DEFAULT_APPEARANCE.borderColor,
                hidden: (value) => value.borderWidth === 0,
            },
            shadow: {
                type: ControlType.BoxShadow,
                title: "Shadow",
                defaultValue: DEFAULT_APPEARANCE.shadow,
            },
            imageFit: {
                type: ControlType.Enum,
                title: "Image Fit",
                options: ["cover", "contain"],
                optionTitles: ["Cover", "Contain"],
                displaySegmentedControl: true,
                defaultValue: DEFAULT_APPEARANCE.imageFit,
            },
            imageDim: {
                type: ControlType.Number,
                title: "Image Dim",
                min: 0,
                max: 80,
                step: 1,
                unit: "%",
                defaultValue: DEFAULT_APPEARANCE.imageDim,
            },
            caption: {
                type: ControlType.Enum,
                title: "Captions",
                options: ["off", "hover", "always"],
                optionTitles: ["Off", "On Hover", "Always"],
                defaultValue: DEFAULT_APPEARANCE.caption,
            },
            captionColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: DEFAULT_APPEARANCE.captionColor,
                hidden: (value) => value.caption === "off",
            },
            captionBackground: {
                type: ControlType.Color,
                title: "Text Backdrop",
                defaultValue: DEFAULT_APPEARANCE.captionBackground,
                hidden: (value) => value.caption === "off",
            },
            captionSize: {
                type: ControlType.Number,
                title: "Text Size",
                min: 8,
                max: 28,
                step: 1,
                unit: "px",
                defaultValue: DEFAULT_APPEARANCE.captionSize,
                hidden: (value) => value.caption === "off",
            },
        },
    },
    showHint: {
        type: ControlType.Boolean,
        title: "Controls Hint",
        defaultValue: true,
    },
    hintText: {
        type: ControlType.String,
        title: "Hint Text",
        defaultValue: "DRAG TO EXPLORE  ·  SCROLL TO TRAVEL",
        hidden: (props) => !props.showHint,
    },
    hintColor: {
        type: ControlType.Color,
        title: "Hint Color",
        defaultValue: "rgba(24, 22, 18, 0.52)",
        hidden: (props) => !props.showHint,
    },
})
