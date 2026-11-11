// Kern_InfiniteCarousel3D — Premium Infinite 3D Media Carousel
// Built by KERN Studio — builtbykern
// Version: 2.1.0 — Viewport-aware + Error Handling
//
// Architecture: useAnimationFrame physics loop + useMotionValue position tracking
// v2.1.0 changes:
//   - IntersectionObserver pauses animation + video when off-screen
//   - onError handlers with fallback placeholder for broken media

// @framerDisableUnlink
// @framerSupportedLayoutWidth any-prefer-fixed
// @framerSupportedLayoutHeight any-prefer-fixed

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    useReducedMotion,
    useMotionValue,
    useAnimationFrame,
    motion,
    useTransform,
} from "framer-motion"
import {
    useRef,
    useLayoutEffect,
    useEffect,
    useState,
    useCallback,
    useMemo,
    startTransition,
} from "react"
import type { CSSProperties } from "react"

// ─── TYPES ───────────────────────────────────────────────────────────────────

type MediaType = "image" | "video"
type HoverEffect = "none" | "flatten" | "scale" | "lift"
type MaskMode = "none" | "fadeBottom" | "fadeEdges"
type ObjectFitMode = "cover" | "contain" | "fill"
type OverflowMode = "hidden" | "visible"
type ScrollDirection = "left" | "right"
type ScalingMode = "standard" | "convex" | "concave"

interface SlideItem {
    mediaType: MediaType
    image: string | { src: string; alt?: string }
    video: string
    alt: string
}

interface ItemEffect {
    lensScale: number
    lensSkew: number
    depthZ: number
    normalizedPos: number
    dynamicScale: number
    dynamicDepthZ: number
}

// ── Nested group interfaces ──────────────────────────────────────────────────

interface LayoutGroup {
    itemWidth: number
    itemWidthTablet: number
    itemWidthMobile: number
    itemHeight: number
    itemHeightTablet: number
    itemHeightMobile: number
    gap: number
    containerHeight: number
    containerHeightTablet: number
    containerHeightMobile: number
}

interface AnimationGroup {
    direction: ScrollDirection
    speed: number
    pauseOnHover: boolean
    inertiaWeight: number
    friction: number
}

interface Effect3DGroup {
    rotateY: number
    perspective: number
    lensDistortionStrength: number
    tiltIntensity: number
    tiltActiveDuration: number
    tiltResetDuration: number
    scalingMode: ScalingMode
    scalingIntensity: number
}

interface HoverGroup {
    hoverEffect: HoverEffect
    hoverLift: number
    hoverScale: number
    hoverTransitionDuration: number
}

interface MediaGroup {
    objectFit: ObjectFitMode
    borderRadius: number
    imageMask: MaskMode
    maskIntensity: number
}

interface VideoGroup {
    videoAutoplay: boolean
    videoMuted: boolean
    videoLoop: boolean
}

interface StyleGroup {
    backgroundColor: string
    itemBackgroundColor: string
    overflow: OverflowMode
}

interface Props {
    slides: SlideItem[]
    ariaLabel: string
    layout: LayoutGroup
    animation: AnimationGroup
    effect3D: Effect3DGroup | undefined
    hover: HoverGroup
    media: MediaGroup
    video: VideoGroup
    style: StyleGroup
}

// ─── DEFAULTS ────────────────────────────────────────────────────────────────

const DEFAULT_SLIDES: SlideItem[] = [
    {
        mediaType: "image",
        image: {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Gradient 5 - Green",
        },
        video: "",
        alt: "Slide 1",
    },
    {
        mediaType: "image",
        image: {
            src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            alt: "Gradient 4 - Yellow",
        },
        video: "",
        alt: "Slide 2",
    },
    {
        mediaType: "video",
        image: {
            src: "",
            alt: "",
        },
        video: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        alt: "Slide 3",
    },
    {
        mediaType: "image",
        image: {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Gradient 2 - Purple",
        },
        video: "",
        alt: "Slide 4",
    },
    {
        mediaType: "image",
        image: {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Gradient 1 - Blue",
        },
        video: "",
        alt: "Slide 5",
    },
    {
        mediaType: "image",
        image: {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Gradient 5 - Green",
        },
        video: "",
        alt: "Slide 6",
    },
    {
        mediaType: "image",
        image: {
            src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            alt: "Gradient 4 - Yellow",
        },
        video: "",
        alt: "Slide 7",
    },
    {
        mediaType: "image",
        image: {
            src: "https://framerusercontent.com/images/BYnxEV1zjYb7bhWh1IwBZ1ZoS60.jpg",
            alt: "Gradient 3 - Orange",
        },
        video: "",
        alt: "Slide 8",
    },
]

// ─── GROUP DEFAULTS ──────────────────────────────────────────────────────────

const LAYOUT_DEFAULTS: LayoutGroup = {
    itemWidth: 300,
    itemWidthTablet: 250,
    itemWidthMobile: 200,
    itemHeight: 300,
    itemHeightTablet: 250,
    itemHeightMobile: 200,
    gap: 20,
    containerHeight: 350,
    containerHeightTablet: 300,
    containerHeightMobile: 250,
}

const ANIMATION_DEFAULTS: AnimationGroup = {
    direction: "left",
    speed: 30,
    pauseOnHover: false,
    inertiaWeight: 0.5,
    friction: 0.5,
}

const EFFECT3D_DEFAULTS: Effect3DGroup = {
    rotateY: -10,
    perspective: 3,
    lensDistortionStrength: 1,
    tiltIntensity: 12,
    tiltActiveDuration: 0.08,
    tiltResetDuration: 0.15,
    scalingMode: "standard",
    scalingIntensity: 0.15,
}

const HOVER_DEFAULTS: HoverGroup = {
    hoverEffect: "flatten",
    hoverLift: 10,
    hoverScale: 1.05,
    hoverTransitionDuration: 0.5,
}

const MEDIA_DEFAULTS: MediaGroup = {
    objectFit: "cover",
    borderRadius: 0,
    imageMask: "fadeBottom",
    maskIntensity: 70,
}

const VIDEO_DEFAULTS: VideoGroup = {
    videoAutoplay: true,
    videoMuted: true,
    videoLoop: true,
}

const STYLE_DEFAULTS: StyleGroup = {
    backgroundColor: "transparent",
    itemBackgroundColor: "#ffffff",
    overflow: "hidden",
}

// ─── FALLBACK PLACEHOLDER STYLE ──────────────────────────────────────────────

const FALLBACK_STYLE: CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "system-ui, sans-serif",
    fontSize: "12px",
    color: "#999",
    backgroundColor: "#f0f0f0",
    borderRadius: "inherit",
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function resolveMediaSrc(slide: SlideItem): { type: MediaType; src: string } {
    if (slide.mediaType === "video" && slide.video) {
        return { type: "video", src: slide.video }
    }
    const img: string | { src: string; alt?: string } = slide.image
    const src: string = typeof img === "string" ? img : img?.src || ""
    return { type: "image", src }
}

function isSlideValid(slide: SlideItem): boolean {
    if (slide.mediaType === "video") return !!slide.video
    const img: string | { src: string; alt?: string } = slide.image
    return typeof img === "string" ? !!img : !!img?.src
}

function calculateResponsiveValue(
    viewportWidth: number,
    mobile: number,
    tablet: number,
    desktop: number
): number {
    if (viewportWidth <= 390) return mobile
    if (viewportWidth <= 810) {
        const t = (viewportWidth - 390) / 420
        return mobile + (tablet - mobile) * t
    }
    if (viewportWidth <= 1440) {
        const t = (viewportWidth - 810) / 630
        return tablet + (desktop - tablet) * t
    }
    return desktop
}

function getMaskGradient(mode: MaskMode, intensity: number): string {
    if (mode === "fadeBottom") {
        return `linear-gradient(to bottom, black ${intensity}%, transparent 100%)`
    }
    if (mode === "fadeEdges") {
        const edge = 100 - intensity
        return `linear-gradient(to right, transparent 0%, black ${edge}%, black ${intensity}%, transparent 100%)`
    }
    return "none"
}

function calculateLensDistortion(
    normalizedPosition: number,
    strength: number
): { scale: number; skew: number } {
    const absPos = Math.abs(normalizedPosition)
    const distortionFactor = absPos * absPos

    const scale = 1 - distortionFactor * 0.04 * strength
    const skew = normalizedPosition * distortionFactor * 2 * strength

    return { scale, skew }
}

function calculateDepthParallax(normalizedPosition: number): number {
    const absPos = Math.abs(normalizedPosition)
    return (1 - Math.pow(absPos, 2.5)) * 20
}

function calculateDynamicScale(
    normalizedPosition: number,
    mode: ScalingMode,
    intensity: number
): { scale: number; depthZ: number } {
    if (mode === "standard") {
        return { scale: 1, depthZ: 0 }
    }

    const absPos = Math.abs(normalizedPosition)
    const distanceFactor = Math.pow(absPos, 1.8)

    if (mode === "convex") {
        const scale = 1 - distanceFactor * intensity * 0.5
        const depthZ = (1 - distanceFactor) * intensity * 150

        return { scale: Math.max(scale, 0.5), depthZ }
    } else {
        const scale = 1 - intensity * 0.3 + distanceFactor * intensity * 0.3
        const depthZ = -(1 - distanceFactor) * intensity * 150

        return { scale: Math.max(scale, 0.5), depthZ }
    }
}

function calculateItemTransform(
    index: number,
    hoveredIndex: number | null,
    mousePosition: { x: number; y: number },
    effects: ItemEffect,
    enable3D: boolean,
    rotateY: number,
    hoverEffect: HoverEffect,
    hoverLift: number,
    hoverScale: number,
    tiltOnHover: boolean,
    tiltIntensity: number
): string {
    const isHovered = hoveredIndex === index
    const transforms: string[] = []

    if (enable3D) {
        if (isHovered && hoverEffect === "flatten") {
            transforms.push("rotateY(0deg)")
        } else {
            transforms.push(`rotateY(${rotateY}deg)`)
        }
    }

    if (tiltOnHover && isHovered) {
        const tiltX = (mousePosition.y - 0.5) * -tiltIntensity
        const tiltY = (mousePosition.x - 0.5) * tiltIntensity
        transforms.push(`rotateX(${tiltX}deg) rotateY(${tiltY}deg)`)
    }

    transforms.push(`scale(${effects.dynamicScale})`)
    transforms.push(`scale(${effects.lensScale})`)
    transforms.push(`skewY(${effects.lensSkew}deg)`)

    const totalDepthZ = effects.depthZ + effects.dynamicDepthZ
    transforms.push(`translateZ(${totalDepthZ}px)`)

    if (isHovered && hoverEffect !== "none") {
        if (hoverEffect === "lift" || (hoverEffect === "flatten" && enable3D)) {
            transforms.push(`translateY(-${hoverLift}%)`)
        }

        if (hoverEffect === "scale") {
            transforms.push(`scale(${hoverScale})`)
        }
    }

    return transforms.join(" ")
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

/**
 * Kern_InfiniteCarousel3D
 *
 * A continuously looping carousel with 3D perspective, lens distortion,
 * dynamic scaling, tilt-on-hover, and image+video support.
 * Hardware-accelerated 60/120fps physics engine.
 *
 * v2.1.0 — IntersectionObserver viewport pause + media error fallbacks
 */
export default function InfiniteCarousel3D(props: Partial<Props>) {
    // ── Top-level props ──────────────────────────────────────────────────────
    const slides = props.slides ?? DEFAULT_SLIDES
    const ariaLabel = props.ariaLabel ?? "Infinite media carousel"

    // ── Nested group destructuring ───────────────────────────────────────────
    const {
        itemWidth = LAYOUT_DEFAULTS.itemWidth,
        itemWidthTablet = LAYOUT_DEFAULTS.itemWidthTablet,
        itemWidthMobile = LAYOUT_DEFAULTS.itemWidthMobile,
        itemHeight = LAYOUT_DEFAULTS.itemHeight,
        itemHeightTablet = LAYOUT_DEFAULTS.itemHeightTablet,
        itemHeightMobile = LAYOUT_DEFAULTS.itemHeightMobile,
        gap = LAYOUT_DEFAULTS.gap,
        containerHeight = LAYOUT_DEFAULTS.containerHeight,
        containerHeightTablet = LAYOUT_DEFAULTS.containerHeightTablet,
        containerHeightMobile = LAYOUT_DEFAULTS.containerHeightMobile,
    } = props.layout ?? LAYOUT_DEFAULTS

    const {
        direction = ANIMATION_DEFAULTS.direction,
        speed = ANIMATION_DEFAULTS.speed,
        pauseOnHover = ANIMATION_DEFAULTS.pauseOnHover,
        inertiaWeight = ANIMATION_DEFAULTS.inertiaWeight,
        friction = ANIMATION_DEFAULTS.friction,
    } = props.animation ?? ANIMATION_DEFAULTS

    // effect3D is optional — undefined means 3D is OFF
    const enable3D = props.effect3D !== undefined
    const {
        rotateY = EFFECT3D_DEFAULTS.rotateY,
        perspective = EFFECT3D_DEFAULTS.perspective,
        lensDistortionStrength = EFFECT3D_DEFAULTS.lensDistortionStrength,
        tiltIntensity = EFFECT3D_DEFAULTS.tiltIntensity,
        tiltActiveDuration = EFFECT3D_DEFAULTS.tiltActiveDuration,
        tiltResetDuration = EFFECT3D_DEFAULTS.tiltResetDuration,
        scalingMode = EFFECT3D_DEFAULTS.scalingMode,
        scalingIntensity = EFFECT3D_DEFAULTS.scalingIntensity,
    } = props.effect3D ?? EFFECT3D_DEFAULTS

    const {
        hoverEffect = HOVER_DEFAULTS.hoverEffect,
        hoverLift = HOVER_DEFAULTS.hoverLift,
        hoverScale = HOVER_DEFAULTS.hoverScale,
        hoverTransitionDuration = HOVER_DEFAULTS.hoverTransitionDuration,
    } = props.hover ?? HOVER_DEFAULTS

    const {
        objectFit = MEDIA_DEFAULTS.objectFit,
        borderRadius = MEDIA_DEFAULTS.borderRadius,
        imageMask = MEDIA_DEFAULTS.imageMask,
        maskIntensity = MEDIA_DEFAULTS.maskIntensity,
    } = props.media ?? MEDIA_DEFAULTS

    const {
        videoAutoplay = VIDEO_DEFAULTS.videoAutoplay,
        videoMuted = VIDEO_DEFAULTS.videoMuted,
        videoLoop = VIDEO_DEFAULTS.videoLoop,
    } = props.video ?? VIDEO_DEFAULTS

    const {
        backgroundColor = STYLE_DEFAULTS.backgroundColor,
        itemBackgroundColor = STYLE_DEFAULTS.itemBackgroundColor,
        overflow = STYLE_DEFAULTS.overflow,
    } = props.style ?? STYLE_DEFAULTS

    // tilt is optional — undefined means tilt is OFF
    const tiltOnHover = props.effect3D !== undefined

    // ── Hooks ────────────────────────────────────────────────────────────────

    const [viewportWidth, setViewportWidth] = useState<number>(1440)
    const containerRef = useRef<HTMLDivElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const isStaticRenderer = useIsStaticRenderer()
    const prefersReduced: boolean = !!useReducedMotion()
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [mousePosition, setMousePosition] = useState<{
        x: number
        y: number
    }>({ x: 0, y: 0 })
    const [itemPositions, setItemPositions] = useState<Map<number, ItemEffect>>(
        new Map()
    )

    // ── Viewport visibility (IntersectionObserver) ───────────────────────────
    const isInViewportRef = useRef<boolean>(true)
    const [isInViewport, setIsInViewport] = useState<boolean>(true)
    const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map())

    useLayoutEffect(() => {
        const el = containerRef.current
        if (!el || typeof IntersectionObserver === "undefined") return

        const observer = new IntersectionObserver(
            ([entry]) => {
                const visible = entry.isIntersecting
                isInViewportRef.current = visible
                setIsInViewport(visible)

                // Pause/resume all video elements
                videoRefs.current.forEach((video) => {
                    if (visible) {
                        if (videoAutoplay) {
                            video.play().catch(() => {})
                        }
                    } else {
                        video.pause()
                    }
                })
            },
            { threshold: 0 }
        )

        observer.observe(el)

        return () => {
            observer.disconnect()
        }
    }, [videoAutoplay])

    // ── Media error tracking ─────────────────────────────────────────────────
    const [failedMedia, setFailedMedia] = useState<Set<number>>(new Set())

    const handleMediaError = useCallback((slideIndex: number) => {
        setFailedMedia((prev) => {
            const next = new Set(prev)
            next.add(slideIndex)
            return next
        })
    }, [])

    // Physics state
    const x = useMotionValue(0)
    const velocityRef = useRef<number>(0)
    const targetVelocityRef = useRef<number>(0)
    const isPausedRef = useRef<boolean>(false)
    const itemWidthRef = useRef<number>(0)
    const totalWidthRef = useRef<number>(0)
    const containerCenterXRef = useRef<number>(0)
    const rafIdRef = useRef<number>(0)

    // Cache for item effects to avoid recalculation
    const itemEffectsCache = useRef<Map<number, ItemEffect>>(new Map())

    useEffect(() => {
        if (typeof window === "undefined") return
        const update = () => {
            startTransition(() => setViewportWidth(window.innerWidth || 1440))
        }
        update()
        window.addEventListener("resize", update)
        return () => window.removeEventListener("resize", update)
    }, [])

    // Filter valid slides once - memoized
    const validSlides = useMemo(() => slides.filter(isSlideValid), [slides])
    const totalItems = validSlides.length

    // Duplicate for seamless loop - memoized
    const duplicatedSlides = useMemo(
        () =>
            totalItems > 0
                ? [...validSlides, ...validSlides, ...validSlides]
                : [],
        [validSlides, totalItems]
    )

    // Responsive values using interpolation
    const responsiveItemWidth = useMemo(() => {
        const min = itemWidthMobile
        const max = itemWidth
        const preferred = itemWidthTablet
        return calculateResponsiveValue(viewportWidth, min, preferred, max)
    }, [viewportWidth, itemWidthMobile, itemWidthTablet, itemWidth])

    const responsiveItemHeight = useMemo(() => {
        const min = itemHeightMobile
        const max = itemHeight
        const preferred = itemHeightTablet
        return calculateResponsiveValue(viewportWidth, min, preferred, max)
    }, [viewportWidth, itemHeightMobile, itemHeightTablet, itemHeight])

    const responsiveContainerHeight = useMemo(() => {
        const min = containerHeightMobile
        const max = containerHeight
        const preferred = containerHeightTablet
        return calculateResponsiveValue(viewportWidth, min, preferred, max)
    }, [
        viewportWidth,
        containerHeightMobile,
        containerHeightTablet,
        containerHeight,
    ])

    const isStatic = isStaticRenderer || prefersReduced
    const maskImageValue = useMemo(
        () => getMaskGradient(imageMask, maskIntensity),
        [imageMask, maskIntensity]
    )

    // Map perspective from 0-10 scale to 200-3000px - memoized
    const perspectiveValue = useMemo(
        () => 200 + perspective * 280,
        [perspective]
    )

    // Initialize all physics values and dimensions synchronously
    useLayoutEffect(() => {
        if (isStatic || totalItems === 0 || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        containerCenterXRef.current = rect.left + rect.width / 2

        itemWidthRef.current = responsiveItemWidth + gap

        totalWidthRef.current = itemWidthRef.current * totalItems

        const pixelsPerSecond = totalWidthRef.current / speed
        const pixelsPerFrame = pixelsPerSecond / 60

        targetVelocityRef.current =
            direction === "left" ? -pixelsPerFrame : pixelsPerFrame

        velocityRef.current = targetVelocityRef.current

        x.set(-totalWidthRef.current)

        const handleResize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                containerCenterXRef.current = rect.left + rect.width / 2
            }
        }

        if (typeof window !== "undefined") {
            window.addEventListener("resize", handleResize)
            return () => window.removeEventListener("resize", handleResize)
        }
    }, [isStatic, totalItems, responsiveItemWidth, gap, speed, direction, x])

    // Calculate item effects based on x position
    useEffect(() => {
        if (isStatic || totalItems === 0 || !containerRef.current) return

        let frameId: number | null = null

        const updatePositions = (currentX: number) => {
            const rect = containerRef.current?.getBoundingClientRect()
            if (!rect) return

            const containerCenterX = rect.left + rect.width / 2
            const newPositions = new Map<number, ItemEffect>()

            const visibleRange =
                Math.ceil(rect.width / itemWidthRef.current) + 2
            const startIndex = Math.max(
                0,
                Math.floor(-currentX / itemWidthRef.current) - 1
            )
            const endIndex = Math.min(
                duplicatedSlides.length,
                startIndex + visibleRange
            )

            for (let i = startIndex; i < endIndex; i++) {
                const itemOffset = i * itemWidthRef.current
                const itemCenterX =
                    rect.left + currentX + itemOffset + responsiveItemWidth / 2
                const distanceFromCenter = itemCenterX - containerCenterX
                const normalizedPos = distanceFromCenter / (rect.width / 2)

                const cacheKey = Math.round(normalizedPos * 100) / 100
                let effects: ItemEffect

                if (itemEffectsCache.current.has(cacheKey)) {
                    effects = itemEffectsCache.current.get(cacheKey)!
                } else {
                    const { scale: lensScale, skew: lensSkew } =
                        calculateLensDistortion(
                            normalizedPos,
                            lensDistortionStrength
                        )
                    const { scale: dynamicScale, depthZ: dynamicDepthZ } =
                        calculateDynamicScale(
                            normalizedPos,
                            scalingMode,
                            scalingIntensity
                        )
                    const depthZ = calculateDepthParallax(normalizedPos)

                    effects = {
                        lensScale,
                        lensSkew,
                        depthZ,
                        normalizedPos,
                        dynamicScale,
                        dynamicDepthZ,
                    }

                    if (itemEffectsCache.current.size > 100) {
                        const firstKey = itemEffectsCache.current
                            .keys()
                            .next().value
                        itemEffectsCache.current.delete(firstKey)
                    }
                    itemEffectsCache.current.set(cacheKey, effects)
                }

                newPositions.set(i, effects)
            }

            startTransition(() => setItemPositions(newPositions))
            frameId = null
        }

        const unsubscribe = x.on("change", (currentX) => {
            if (frameId === null) {
                frameId = requestAnimationFrame(() => updatePositions(currentX))
            }
        })

        return () => {
            unsubscribe()
            if (frameId !== null) {
                cancelAnimationFrame(frameId)
            }
        }
    }, [
        isStatic,
        totalItems,
        duplicatedSlides.length,
        responsiveItemWidth,
        lensDistortionStrength,
        scalingMode,
        scalingIntensity,
        x,
    ])

    // Custom animation frame loop with physics
    // Skips work entirely when off-screen via isInViewportRef
    useAnimationFrame((time, delta) => {
        if (isStatic || totalItems === 0) return

        // ── VIEWPORT GATE: skip physics when off-screen ──
        if (!isInViewportRef.current) return

        const clampedDelta = Math.min(delta, 32)

        const acceleration = 0.12 - inertiaWeight * 0.08
        const damping = 0.98 - friction * 0.06

        const targetVel = isPausedRef.current ? 0 : targetVelocityRef.current

        const lerpFactor = isPausedRef.current ? 0.95 : 0.98
        velocityRef.current =
            velocityRef.current * lerpFactor + targetVel * (1 - lerpFactor)

        velocityRef.current *= damping

        const currentX = x.get()
        const newX = currentX + velocityRef.current

        const singleSetWidth = totalWidthRef.current

        if (direction === "left") {
            if (newX <= -singleSetWidth * 2) {
                x.set(newX + singleSetWidth)
            } else {
                x.set(newX)
            }
        } else {
            if (newX >= 0) {
                x.set(newX - singleSetWidth)
            } else {
                x.set(newX)
            }
        }
    })

    // Cleanup animation frame on unmount
    useEffect(() => {
        return () => {
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current)
            }
        }
    }, [])

    // Hover handlers with smooth deceleration
    const handleMouseEnter = useCallback(() => {
        if (pauseOnHover) {
            isPausedRef.current = true
        }
    }, [pauseOnHover])

    const handleMouseLeave = useCallback(() => {
        if (pauseOnHover) {
            isPausedRef.current = false
        }
        startTransition(() => setHoveredIndex(null))
    }, [pauseOnHover])

    // Mouse move handler for tilt effect with smoothing
    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!tiltOnHover) return

            const rect = e.currentTarget.getBoundingClientRect()
            const mx = (e.clientX - rect.left) / rect.width
            const my = (e.clientY - rect.top) / rect.height

            startTransition(() => {
                setMousePosition({ x: mx, y: my })
            })
        },
        [tiltOnHover]
    )

    // Calculate item position effects - memoized
    const getItemEffects = useCallback(
        (index: number): ItemEffect => {
            return (
                itemPositions.get(index) || {
                    lensScale: 1,
                    lensSkew: 0,
                    depthZ: 0,
                    normalizedPos: 0,
                    dynamicScale: 1,
                    dynamicDepthZ: 0,
                }
            )
        },
        [itemPositions]
    )

    const getHoverTransform = useCallback(
        (index: number): string => {
            const effects = getItemEffects(index)
            return calculateItemTransform(
                index,
                hoveredIndex,
                mousePosition,
                effects,
                enable3D,
                rotateY,
                hoverEffect,
                hoverLift,
                hoverScale,
                tiltOnHover,
                tiltIntensity
            )
        },
        [
            hoveredIndex,
            mousePosition,
            getItemEffects,
            enable3D,
            rotateY,
            hoverEffect,
            hoverLift,
            hoverScale,
            tiltOnHover,
            tiltIntensity,
        ]
    )

    // ── Video ref registration ───────────────────────────────────────────────
    const registerVideoRef = useCallback(
        (index: number, el: HTMLVideoElement | null) => {
            if (el) {
                videoRefs.current.set(index, el)
            } else {
                videoRefs.current.delete(index)
            }
        },
        []
    )

    // ─── STYLES ──────────────────────────────────────────────────────────────

    const containerStyle: CSSProperties = {
        width: "100%",
        height: `${responsiveContainerHeight}px`,
        backgroundColor,
        overflow,
        display: "flex",
        alignItems: "center",
        position: "relative",
    }

    const itemBaseStyle: CSSProperties = {
        flexShrink: 0,
        width: `${responsiveItemWidth}px`,
        height: `${responsiveItemHeight}px`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        perspective: enable3D ? `${perspectiveValue}px` : "none",
        transformStyle: enable3D || tiltOnHover ? "preserve-3d" : "flat",
        cursor: hoverEffect !== "none" || tiltOnHover ? "pointer" : "default",
    }

    // ─── RENDER MEDIA ────────────────────────────────────────────────────────

    const renderMedia = useCallback(
        (slide: SlideItem, index: number): JSX.Element => {
            const originalIndex = index % totalItems
            const media = resolveMediaSrc(slide)
            const isHovered = hoveredIndex === index

            // ── Error fallback ───────────────────────────────────────────
            if (failedMedia.has(originalIndex)) {
                return (
                    <div
                        style={FALLBACK_STYLE}
                        aria-label="Media failed to load"
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#bbb"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <rect
                                x="3"
                                y="3"
                                width="18"
                                height="18"
                                rx="2"
                                ry="2"
                            />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                    </div>
                )
            }

            const opacity = 1

            const mediaStyle: CSSProperties = {
                width: "100%",
                height: "100%",
                objectFit,
                backgroundColor: itemBackgroundColor,
                transform: getHoverTransform(index),
                transition:
                    tiltOnHover && isHovered
                        ? `transform ${tiltActiveDuration}s ease-out`
                        : tiltOnHover && !isHovered
                          ? `transform ${tiltResetDuration}s cubic-bezier(0.34, 1.56, 0.64, 1)`
                          : `transform ${hoverTransitionDuration}s cubic-bezier(0.4, 0, 0.2, 1)`,
                borderRadius: `${borderRadius}px`,
                WebkitMaskImage: maskImageValue,
                maskImage: maskImageValue,
                display: "block",
                pointerEvents: "none",
                opacity,
                willChange: "transform",
            }

            if (media.type === "video") {
                return (
                    <video
                        ref={(el) => registerVideoRef(index, el)}
                        src={media.src}
                        autoPlay={videoAutoplay && !isStatic && isInViewport}
                        muted={videoMuted}
                        loop={videoLoop}
                        playsInline
                        draggable={false}
                        style={mediaStyle}
                        aria-label={
                            slide.alt ||
                            `Carousel video ${(index % totalItems) + 1}`
                        }
                        onError={() => handleMediaError(originalIndex)}
                    />
                )
            }

            return (
                <img
                    src={media.src}
                    alt={
                        slide.alt ||
                        `Carousel image ${(index % totalItems) + 1}`
                    }
                    loading="lazy"
                    draggable={false}
                    style={mediaStyle}
                    onError={() => handleMediaError(originalIndex)}
                />
            )
        },
        [
            hoveredIndex,
            objectFit,
            itemBackgroundColor,
            getHoverTransform,
            tiltOnHover,
            tiltActiveDuration,
            tiltResetDuration,
            hoverTransitionDuration,
            borderRadius,
            maskImageValue,
            videoAutoplay,
            isStatic,
            isInViewport,
            videoMuted,
            videoLoop,
            totalItems,
            failedMedia,
            handleMediaError,
            registerVideoRef,
        ]
    )

    // ── EMPTY STATE ─────────────────────────────────────────────────────────

    if (totalItems === 0) {
        return (
            <section
                ref={containerRef}
                style={{
                    ...containerStyle,
                    justifyContent: "center",
                    textAlign: "center",
                    color: "#999",
                    fontFamily: "system-ui, sans-serif",
                    fontSize: "14px",
                }}
                aria-label={ariaLabel}
                role="region"
            >
                Add media via property controls
            </section>
        )
    }

    // ─── MAIN RENDER ─────────────────────────────────────────────────────────

    return (
        <section
            ref={containerRef}
            style={containerStyle}
            aria-label={ariaLabel}
            role="region"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
        >
            <motion.div
                ref={trackRef}
                style={{
                    display: "flex",
                    gap: `${gap}px`,
                    alignItems: "center",
                    height: "100%",
                    willChange: "transform",
                    x,
                }}
            >
                {duplicatedSlides.map((slide: SlideItem, index: number) => {
                    const effects = getItemEffects(index)
                    const isVisible = Math.abs(effects.normalizedPos) < 3

                    if (!isVisible) {
                        return (
                            <div
                                key={`item-${index}`}
                                style={{
                                    ...itemBaseStyle,
                                    visibility: "hidden",
                                }}
                            />
                        )
                    }

                    return (
                        <div
                            key={`item-${index}`}
                            style={itemBaseStyle}
                            onMouseEnter={() =>
                                startTransition(() => setHoveredIndex(index))
                            }
                            onMouseLeave={() =>
                                startTransition(() => setHoveredIndex(null))
                            }
                        >
                            {renderMedia(slide, index)}
                        </div>
                    )
                })}
            </motion.div>
        </section>
    )
}

// ─── PROPERTY CONTROLS ───────────────────────────────────────────────────────

addPropertyControls(InfiniteCarousel3D, {
    // ── CONTENT ──────────────────────────────────────────────────────────────
    slides: {
        type: ControlType.Array,
        title: "Slides",
        description:
            "Add images or videos.\nMinimum 3 slides recommended for smooth infinite looping.",
        maxCount: 30,
        defaultValue: DEFAULT_SLIDES,
        control: {
            type: ControlType.Object,
            controls: {
                mediaType: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                    description:
                        "Choose between image or video for this slide.",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    description: "Pick an image from assets or paste a URL.",
                    hidden: (props: Record<string, unknown>) =>
                        props.mediaType === "video",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    description: "Upload a video file (mp4, webm, mov).",
                    hidden: (props: Record<string, unknown>) =>
                        props.mediaType !== "video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt / Label",
                    defaultValue: "",
                    description: "Accessible description for screen readers.",
                },
            },
        },
    },

    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "Infinite media carousel",
        description:
            "Accessible label for screen readers describing the carousel.",
    },

    // ── LAYOUT (Object group) ────────────────────────────────────────────────
    layout: {
        type: ControlType.Object,
        title: "Layout",
        buttonTitle: "Layout",
        icon: "object",
        description:
            "Item dimensions, gaps, and container height across breakpoints.",
        controls: {
            itemWidth: {
                type: ControlType.Number,
                title: "Width — Desktop",
                defaultValue: 300,
                min: 100,
                max: 800,
                step: 10,
                displayStepper: true,
                unit: "px",
                description: "Item width at desktop (≥1440px).",
            },
            itemWidthTablet: {
                type: ControlType.Number,
                title: "Width — Tablet",
                defaultValue: 250,
                min: 80,
                max: 600,
                step: 10,
                displayStepper: true,
                unit: "px",
                description: "Item width at tablet (~810px).",
            },
            itemWidthMobile: {
                type: ControlType.Number,
                title: "Width — Mobile",
                defaultValue: 200,
                min: 60,
                max: 400,
                step: 10,
                displayStepper: true,
                unit: "px",
                description: "Item width at mobile (~390px).",
            },
            itemHeight: {
                type: ControlType.Number,
                title: "Height — Desktop",
                defaultValue: 300,
                min: 100,
                max: 800,
                step: 10,
                displayStepper: true,
                unit: "px",
                description: "Item height at desktop.",
            },
            itemHeightTablet: {
                type: ControlType.Number,
                title: "Height — Tablet",
                defaultValue: 250,
                min: 80,
                max: 600,
                step: 10,
                displayStepper: true,
                unit: "px",
                description: "Item height at tablet.",
            },
            itemHeightMobile: {
                type: ControlType.Number,
                title: "Height — Mobile",
                defaultValue: 200,
                min: 60,
                max: 400,
                step: 10,
                displayStepper: true,
                unit: "px",
                description: "Item height at mobile.",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 20,
                min: 0,
                max: 100,
                step: 1,
                unit: "px",
                description: "Space between carousel items.",
            },
            containerHeight: {
                type: ControlType.Number,
                title: "Container — Desktop",
                defaultValue: 350,
                min: 100,
                max: 1000,
                step: 10,
                displayStepper: true,
                unit: "px",
                description: "Total container height at desktop.",
            },
            containerHeightTablet: {
                type: ControlType.Number,
                title: "Container — Tablet",
                defaultValue: 300,
                min: 80,
                max: 800,
                step: 10,
                displayStepper: true,
                unit: "px",
                description: "Container height at tablet.",
            },
            containerHeightMobile: {
                type: ControlType.Number,
                title: "Container — Mobile",
                defaultValue: 250,
                min: 60,
                max: 600,
                step: 10,
                displayStepper: true,
                unit: "px",
                description: "Container height at mobile.",
            },
        },
    },

    // ── ANIMATION (Object group) ─────────────────────────────────────────────
    animation: {
        type: ControlType.Object,
        title: "Animation",
        buttonTitle: "Animation",
        icon: "interaction",
        description: "Direction, speed, and pause behavior.",
        controls: {
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["left", "right"],
                optionTitles: ["← Left", "→ Right"],
                defaultValue: "left",
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
                description: "Scroll direction of the carousel loop.",
            },
            speed: {
                type: ControlType.Enum,
                title: "Speed",
                options: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
                optionTitles: [
                    "10s",
                    "15s",
                    "20s",
                    "25s",
                    "30s",
                    "35s",
                    "40s",
                    "45s",
                    "50s",
                    "55s",
                    "60s",
                ],
                defaultValue: 30,
                segmentedControlDirection: "vertical",
                description:
                    "Loop duration in seconds.\nHigher = slower animation.",
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Pause on Hover",
                defaultValue: false,
                description: "Pause carousel when user hovers.",
            },
            inertiaWeight: {
                type: ControlType.Number,
                title: "Inertia",
                defaultValue: 0.5,
                min: 0,
                max: 1,
                step: 0.05,
                description: "How long to stop.\n0 = instant, 1 = very heavy.",
            },
            friction: {
                type: ControlType.Number,
                title: "Friction",
                defaultValue: 0.5,
                min: 0,
                max: 1,
                step: 0.05,
                description: "Resistance to movement.\n0 = none, 1 = maximum.",
            },
        },
    },

    // ── 3D EFFECT (optional Object — toggle on/off) ──────────────────────────
    effect3D: {
        type: ControlType.Object,
        title: "3D Effect",
        buttonTitle: "3D Effect",
        icon: "effect",
        optional: true,
        description:
            "Enable 3D perspective rotation on carousel items.\nToggle off to disable all 3D transforms.",
        controls: {
            rotateY: {
                type: ControlType.Number,
                title: "Rotate Y",
                defaultValue: -10,
                min: -15,
                max: 15,
                step: 1,
                unit: "°",
                description:
                    "Y-axis rotation angle.\nCapped at ±15° for subtle effect.",
            },
            perspective: {
                type: ControlType.Number,
                title: "Perspective",
                defaultValue: 3,
                min: 0,
                max: 10,
                step: 0.1,
                description: "3D depth. 0 = subtle, 10 = dramatic.",
            },
            lensDistortionStrength: {
                type: ControlType.Number,
                title: "Lens Distortion",
                defaultValue: 1,
                min: 0,
                max: 2,
                step: 0.1,
                description: "Wide-angle lens warp.\n0 = none, 2 = extreme.",
            },
            tiltIntensity: {
                type: ControlType.Number,
                title: "Tilt Intensity",
                defaultValue: 12,
                min: 0,
                max: 30,
                step: 1,
                unit: "°",
                description:
                    "Maximum rotation angle.\n0 = no tilt, 30 = extreme tilt.",
            },
            tiltActiveDuration: {
                type: ControlType.Number,
                title: "Tilt Active Speed",
                defaultValue: 0.08,
                min: 0.01,
                max: 0.3,
                step: 0.01,
                unit: "s",
                description:
                    "Transition speed while hovering and moving mouse.",
            },
            tiltResetDuration: {
                type: ControlType.Number,
                title: "Tilt Reset Speed",
                defaultValue: 0.15,
                min: 0.05,
                max: 0.5,
                step: 0.05,
                unit: "s",
                description:
                    "How long tilt returns to normal after mouse leaves.",
            },
            scalingMode: {
                type: ControlType.Enum,
                title: "Scaling Mode",
                options: ["standard", "convex", "concave"],
                optionTitles: [
                    "Standard",
                    "Convex (Cylinder)",
                    "Concave (Theater)",
                ],
                defaultValue: "standard",
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
                description:
                    "Standard = fixed. Convex = largest center. Concave = smallest center.",
            },
            scalingIntensity: {
                type: ControlType.Number,
                title: "Scaling Intensity",
                defaultValue: 0.15,
                min: 0,
                max: 0.2,
                step: 0.01,
                hidden: (props: Record<string, unknown>) =>
                    props.scalingMode === "standard",
                description:
                    "How much items shrink/grow.\n0 = none, 0.2 = maximum.",
            },
        },
    },

    // ── HOVER (Object group) ─────────────────────────────────────────────────
    hover: {
        type: ControlType.Object,
        title: "Hover",
        buttonTitle: "Hover",
        description: "Visual effect when user hovers items.",
        controls: {
            hoverEffect: {
                type: ControlType.Enum,
                title: "Effect",
                options: ["none", "flatten", "scale", "lift"],
                optionTitles: ["None", "Flatten 3D", "Scale Up", "Lift Up"],
                defaultValue: "flatten",
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
                description: "Visual effect applied on mouse hover.",
            },
            hoverLift: {
                type: ControlType.Number,
                title: "Lift Amount",
                defaultValue: 10,
                min: 0,
                max: 50,
                step: 1,
                unit: "%",
                hidden: (props: Record<string, unknown>) =>
                    props.hoverEffect !== "lift" &&
                    props.hoverEffect !== "flatten",
                description: "Vertical lift distance on hover.",
            },
            hoverScale: {
                type: ControlType.Number,
                title: "Scale Factor",
                defaultValue: 1.05,
                min: 1,
                max: 1.5,
                step: 0.01,
                hidden: (props: Record<string, unknown>) =>
                    props.hoverEffect !== "scale",
                description: "Scale multiplier on hover.",
            },
            hoverTransitionDuration: {
                type: ControlType.Number,
                title: "Transition Speed",
                defaultValue: 0.5,
                min: 0.1,
                max: 2,
                step: 0.05,
                unit: "s",
                hidden: (props: Record<string, unknown>) =>
                    props.hoverEffect === "none",
                description: "Duration of the hover transition.",
            },
        },
    },

    // ── MEDIA (Object group) ─────────────────────────────────────────────────
    media: {
        type: ControlType.Object,
        title: "Media",
        buttonTitle: "Media",
        description: "How media fills its container, rounding, and masking.",
        controls: {
            objectFit: {
                type: ControlType.Enum,
                title: "Object Fit",
                options: ["cover", "contain", "fill"],
                optionTitles: ["Cover", "Contain", "Fill"],
                defaultValue: "cover",
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
                description: "How media fills its container.",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Border Radius",
                defaultValue: 0,
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
                description: "Corner rounding of each item.",
            },
            imageMask: {
                type: ControlType.Enum,
                title: "Mask",
                options: ["none", "fadeBottom", "fadeEdges"],
                optionTitles: ["None", "Fade Bottom", "Fade Edges"],
                defaultValue: "fadeBottom",
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
                description: "Gradient mask for visual fading.",
            },
            maskIntensity: {
                type: ControlType.Number,
                title: "Mask Intensity",
                defaultValue: 70,
                min: 10,
                max: 95,
                step: 1,
                unit: "%",
                hidden: (props: Record<string, unknown>) =>
                    props.imageMask === "none",
                description: "How much media remains visible before fading.",
            },
        },
    },

    // ── STYLE (Object group) ─────────────────────────────────────────────────
    style: {
        type: ControlType.Object,
        title: "Style",
        buttonTitle: "Style",
        description: "Colors and overflow behavior.",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "transparent",
                description: "Background color of the container.",
            },
            itemBackgroundColor: {
                type: ControlType.Color,
                title: "Item Background",
                defaultValue: "#ffffff",
                description: "Fallback color while media loads.",
            },
            overflow: {
                type: ControlType.Enum,
                title: "Overflow",
                options: ["hidden", "visible"],
                optionTitles: ["Hidden", "Visible"],
                defaultValue: "hidden",
                displaySegmentedControl: true,
                description: "Whether items outside container are clipped.",
            },
        },
    },
})
