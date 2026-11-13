// TheScroller - Premium 3D Infinite Scroll Slider
// 
// High-performance 3D image carousel with scroll-driven animations, auto-scroll,
// and responsive breakpoint controls. Features three visual presets (Distortion,
// Carousel, Cards), motion blur, and full accessibility support.

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion"
import { useReducedMotion } from "framer-motion"
import {
    useRef,
    useLayoutEffect,
    useMemo,
    useState,
    useCallback,
    startTransition,
} from "react"
import type { CSSProperties } from "react"

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface SlideData {
    image: { src: string; alt?: string } | string
    title?: string
    aspectRatio?: number
    horizontalOffset?: number
    verticalOffset?: number
    showShadow?: boolean
    shadowIntensity?: number
}

type EffectPreset = "distortion" | "carousel" | "cards"
type Direction = "vertical" | "horizontal"
type Breakpoint = "desktop" | "tablet" | "mobile"
type MaskMode = "none" | "fadeBottom"
type AutoScrollDir = "forward" | "reverse"
type PerspectiveMode = "standard" | "convex" | "concave"

interface TheScrollerProps {
    images: SlideData[]
    direction: Direction

    // Breakpoint config
    breakpointSelector: Breakpoint
    tabletBreakpoint: number
    mobileBreakpoint: number
    minResponsiveWidth: number
    maxResponsiveWidth: number

    // Desktop
    slideHeightDesktop: number
    slideGapDesktop: number
    effectStrengthDesktop: number
    blurStrengthDesktop: number
    borderRadiusDesktop: number
    cardRotationDesktop: number
    animationSpeedDesktop: number
    animationSmoothDesktop: number
    scrollSpeedDesktop: number

    // Tablet
    slideHeightTablet: number
    slideGapTablet: number
    effectStrengthTablet: number
    blurStrengthTablet: number
    borderRadiusTablet: number
    cardRotationTablet: number
    animationSpeedTablet: number
    animationSmoothTablet: number
    scrollSpeedTablet: number

    // Mobile
    slideHeightMobile: number
    slideGapMobile: number
    effectStrengthMobile: number
    blurStrengthMobile: number
    borderRadiusMobile: number
    cardRotationMobile: number
    animationSpeedMobile: number
    animationSmoothMobile: number
    scrollSpeedMobile: number

    // Effects
    effectPreset: EffectPreset
    randomRotation: boolean
    blurWhileScrolling: boolean

    // Perspective
    perspectiveMode: PerspectiveMode
    perspective: number
    depthIntensity: number
    lensWarp: number
    edgeBlur: number
    parallaxIntensity: number
    velocityStretch: number

    // Auto-scroll (from CodePen infinite loop)
    autoScroll: boolean
    autoScrollSpeed: number
    autoScrollDirection: AutoScrollDir
    pauseOnHover: boolean

    // Scroll behavior
    infiniteScroll: boolean
    scrollRange: number

    // Virtual visibility
    visibilityMargin: number

    // Engine
    friction: number
    sensitivity: number
    magneticSnap: boolean

    // Accessibility
    ariaLabel: string
    style?: CSSProperties
}

// ─── DEFAULTS ────────────────────────────────────────────────────────────────

const DEFAULT_SLIDES: SlideData[] = [
    {
        image: {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Slide 1",
        },
        title: "Slide 1",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Slide 2",
        },
        title: "Slide 2",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            alt: "Slide 3",
        },
        title: "Slide 3",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            alt: "Slide 4",
        },
        title: "Slide 4",
    },
    {
        image: {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Slide 5",
        },
        title: "Slide 5",
    },
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getImgSrc(slide: SlideData): string {
    return typeof slide.image === "string" ? slide.image : slide.image.src
}

function getImgAlt(slide: SlideData): string {
    if (typeof slide.image === "string") return slide.title || ""
    return slide.image.alt ?? slide.title ?? ""
}

function pseudoRandom(idx: number): number {
    const t: number = Math.sin((idx + 1) * 999) * 10000
    return (t - Math.floor(t)) * 2 - 1
}

function useIsOnFramerCanvas(): boolean {
    return RenderTarget.current() === RenderTarget.canvas
}

// ─── SLIDE ITEM COMPONENT ────────────────────────────────────────────────────

interface SlideItemProps {
    slide: SlideData
    idx: number
    scrollPos: any
    smoothVelocity: any
    rv: {
        slideHeight: number
        borderRadius: number
    }
    actualGap: number
    isHorizontal: boolean
    containerWidth: number
    containerHeight: number
    perspectiveMode: PerspectiveMode
    lensWarp: number
    depthIntensity: number
    edgeBlur: number
    parallaxIntensity: number
    velocityStretch: number
    blurWhileScrolling: boolean
    blurFilter: any
    isSlideVisible: (offset: number) => boolean
    buildTransformTemplate: (
        slideOffset: number,
        slideWidth: number,
        cardRotationValue: number,
        userH: number,
        userV: number,
        cylindricalScaleValue: any,
        cylindricalRotationValue: any,
        cylindricalZValue: any,
        combinedScaleValue: any
    ) => any
    cardRotationValue: number
    totalSize: number
}

function SlideItem(props: SlideItemProps) {
    const {
        slide,
        idx,
        scrollPos,
        smoothVelocity,
        rv,
        actualGap,
        isHorizontal,
        containerWidth,
        containerHeight,
        perspectiveMode,
        lensWarp,
        depthIntensity,
        edgeBlur,
        parallaxIntensity,
        velocityStretch,
        blurWhileScrolling,
        blurFilter,
        isSlideVisible,
        buildTransformTemplate,
        cardRotationValue,
        totalSize,
    } = props

    const aspectRatio: number = slide.aspectRatio || 1.5
    const slideWidth: number = rv.slideHeight * aspectRatio
    const slideOffset: number = idx * (rv.slideHeight + actualGap)

    const userH: number = slide.horizontalOffset || 0
    const userV: number = slide.verticalOffset || 0

    const showShadow: boolean = slide.showShadow ?? false
    const shadowIntensity: number = slide.shadowIntensity ?? 5
    const shadowBlur: number = shadowIntensity * 4
    const shadowSpread: number = shadowIntensity * 0.5
    const shadowOpacity: number = Math.min(0.5, shadowIntensity * 0.05)
    const boxShadow: string = showShadow
        ? `0 ${shadowIntensity * 2}px ${shadowBlur}px ${shadowSpread}px rgba(0, 0, 0, ${shadowOpacity})`
        : "none"

    // ─── VIRTUAL VISIBILITY CHECK ────────────────────────────────────────────
    const isVisible: boolean = isSlideVisible(slideOffset)

    // ─── CYLINDRICAL PERSPECTIVE SYSTEM ──────────────────────────────────────
    const containerCenter: number = isHorizontal ? containerWidth / 2 : containerHeight / 2
    const itemSize: number = isHorizontal ? slideWidth : rv.slideHeight

    // Calculate focal point range for useTransform
    const range: number = containerCenter * 1.5
    const focalPoint: number = slideOffset

    // Create motion values for cylindrical perspective
    const trackPosition = scrollPos

    // Static array transforms based on perspective mode
    const cylindricalScale =
        perspectiveMode !== "standard"
            ? useTransform(
                  trackPosition,
                  [focalPoint - range, focalPoint, focalPoint + range],
                  perspectiveMode === "convex" ? [0.85, 1, 0.85] : [1.15, 1, 1.15]
              )
            : useMotionValue(1)

    const cylindricalRotation =
        perspectiveMode !== "standard"
            ? useTransform(
                  trackPosition,
                  [focalPoint - range, focalPoint, focalPoint + range],
                  [45 * lensWarp, 0, -45 * lensWarp]
              )
            : useMotionValue(0)

    const cylindricalZ =
        perspectiveMode !== "standard"
            ? useTransform(
                  trackPosition,
                  [focalPoint - range, focalPoint, focalPoint + range],
                  perspectiveMode === "convex"
                      ? [-depthIntensity, 0, -depthIntensity]
                      : [depthIntensity, 0, depthIntensity]
              )
            : useMotionValue(0)

    // ─── PROGRESSIVE BLUR EFFECT ─────────────────────────────────────────────
    // 5-point static array: center is sharp, edges are blurred
    const progressiveBlurValue = useTransform(
        trackPosition,
        [focalPoint - range, focalPoint - 250, focalPoint, focalPoint + 250, focalPoint + range],
        [edgeBlur, 0, 0, 0, edgeBlur]
    )

    const progressiveBlurFilter = useTransform(
        progressiveBlurValue,
        (v: number) => (v > 0.01 ? `blur(${v.toFixed(2)}px)` : "none")
    )

    // Opacity fade: items beyond 80% of range fade to 0
    const opacityFade = useTransform(
        trackPosition,
        [focalPoint - range, focalPoint - range * 0.8, focalPoint + range * 0.8, focalPoint + range],
        [0, 1, 1, 0]
    )

    // ─── INTERNAL PARALLAX ───────────────────────────────────────────────────
    // Image moves independently inside container
    const parallaxOffset = useTransform(
        trackPosition,
        [focalPoint - range, focalPoint + range],
        [-100 * parallaxIntensity, 100 * parallaxIntensity]
    )

    // ─── VELOCITY-BASED SCALE DEFORMATION ───────────────────────────────────
    // Squash & stretch based on scroll speed
    const velocityScale = useTransform(
        smoothVelocity,
        [-20, 0, 20],
        [1 + velocityStretch, 1, 1 + velocityStretch]
    )

    // Combine cylindrical scale with velocity scale
    const combinedScale = useTransform(
        [cylindricalScale, velocityScale],
        ([cylScale, velScale]: [number, number]) => cylScale * velScale
    )

    // ─── SYNC CYLINDRICAL VALUES TO REFS FOR TRANSFORM TEMPLATE ─────────────
    const cylindricalScaleRef = useRef<number>(1)
    const cylindricalRotationRef = useRef<number>(0)
    const cylindricalZRef = useRef<number>(0)
    const combinedScaleRef = useRef<number>(1)

    useLayoutEffect(() => {
        if (typeof window === "undefined") return

        const unsubscribers = [
            cylindricalScale.on("change", (v: number) => {
                cylindricalScaleRef.current = Number.isFinite(v) ? v : 1
            }),
            cylindricalRotation.on("change", (v: number) => {
                cylindricalRotationRef.current = Number.isFinite(v) ? v : 0
            }),
            cylindricalZ.on("change", (v: number) => {
                cylindricalZRef.current = Number.isFinite(v) ? v : 0
            }),
            combinedScale.on("change", (v: number) => {
                combinedScaleRef.current = Number.isFinite(v) ? v : 1
            }),
        ]

        return () => {
            unsubscribers.forEach((unsub) => unsub())
        }
    }, [cylindricalScale, cylindricalRotation, cylindricalZ, combinedScale])

    // ─── CONSOLIDATED STYLE OBJECT ───────────────────────────────────────────
    const slideStyle: CSSProperties = {
        position: "absolute",
        width: slideWidth,
        height: rv.slideHeight,
        left: -slideWidth / 2,
        top: -rv.slideHeight / 2,
        transformStyle: "preserve-3d",
        willChange: "transform, opacity",
        backfaceVisibility: "hidden",
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? "auto" : "none",
        overflow: "hidden",
    }

    const imgStyle: CSSProperties = {
        width: "120%",
        height: "120%",
        objectFit: "cover",
        borderRadius: `${rv.borderRadius}px`,
        pointerEvents: "none",
        userSelect: "none",
        display: "block",
        willChange: "filter, transform",
        backfaceVisibility: "hidden",
        boxShadow: boxShadow,
        position: "absolute",
        top: "-10%",
        left: "-10%",
    }

    return (
        <motion.div
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${idx + 1} of ${totalSize}`}
            style={{
                ...slideStyle,
                // Remove x/y from style - let transformTemplate handle all positioning
                opacity: opacityFade,
            }}
            transformTemplate={buildTransformTemplate(
                slideOffset,
                slideWidth,
                cardRotationValue,
                userH,
                userV,
                cylindricalScaleRef,
                cylindricalRotationRef,
                cylindricalZRef,
                combinedScaleRef
            )}
        >
            {isVisible && (
                <motion.img
                    src={getImgSrc(slide)}
                    alt={getImgAlt(slide)}
                    loading="lazy"
                    draggable={false}
                    style={{
                        ...imgStyle,
                        filter: blurWhileScrolling ? blurFilter : progressiveBlurFilter,
                        x: isHorizontal ? parallaxOffset : 0,
                        y: isHorizontal ? 0 : parallaxOffset,
                    }}
                />
            )}
        </motion.div>
    )
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

/**
 * TheScroller — Premium Infinite 3D Scroll Slider
 *
 * High-performance 3D image slider with scroll-driven + auto-scroll modes.
 * Features: Distortion / Carousel / Cards presets, motion blur, fade mask,
 * auto-scroll loop with pause-on-hover, spring physics, and granular
 * breakpoint controls for Desktop / Tablet / Mobile.
 * 
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TheScroller(props: Partial<TheScrollerProps>) {
    const {
        images = DEFAULT_SLIDES,
        direction = "vertical",

        breakpointSelector = "desktop",
        tabletBreakpoint = 768,
        mobileBreakpoint = 480,
        minResponsiveWidth = 0,
        maxResponsiveWidth = 0,

        slideHeightDesktop = 600,
        slideGapDesktop = 10,
        effectStrengthDesktop = 5,
        blurStrengthDesktop = 5,
        borderRadiusDesktop = 0,
        cardRotationDesktop = 5,
        animationSpeedDesktop = 5,
        animationSmoothDesktop = 5,
        scrollSpeedDesktop = 5,

        slideHeightTablet = 450,
        slideGapTablet = 8,
        effectStrengthTablet = 4,
        blurStrengthTablet = 4,
        borderRadiusTablet = 0,
        cardRotationTablet = 4,
        animationSpeedTablet = 5,
        animationSmoothTablet = 5,
        scrollSpeedTablet = 5,

        slideHeightMobile = 300,
        slideGapMobile = 5,
        effectStrengthMobile = 3,
        blurStrengthMobile = 3,
        borderRadiusMobile = 0,
        cardRotationMobile = 3,
        animationSpeedMobile = 5,
        animationSmoothMobile = 5,
        scrollSpeedMobile = 5,

        effectPreset = "carousel",
        randomRotation = false,
        blurWhileScrolling = false,

        perspectiveMode = "standard",
        perspective = 1500,
        depthIntensity = 100,
        lensWarp = 0.15,
        edgeBlur = 4,
        parallaxIntensity = 0.2,
        velocityStretch = 0.1,

        autoScroll = false,
        autoScrollSpeed = 50,
        autoScrollDirection = "forward",
        pauseOnHover = true,

        infiniteScroll = true,
        scrollRange = 5,

        visibilityMargin = 1.5,

        friction = 0.95,
        sensitivity = 1,
        magneticSnap = true,

        ariaLabel = "3D image slider",
        style,
    } = props

    const isCanvas: boolean = useIsOnFramerCanvas()
    const prefersReduced: boolean = !!useReducedMotion()
    const isHorizontal: boolean = direction === "horizontal"
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView: boolean = useInView(containerRef, { amount: 0.05 })

    // ─── CACHED DIMENSIONS VIA RESIZEOBSERVER ────────────────────────────────
    const [containerWidth, setContainerWidth] = useState<number>(0)
    const [containerHeight, setContainerHeight] = useState<number>(0)
    const [isHovered, setIsHovered] = useState<boolean>(false)

    useLayoutEffect(() => {
        if (typeof window === "undefined" || !containerRef.current) return

        const el: HTMLElement = containerRef.current

        const update = (): void => {
            const rect: DOMRect = el.getBoundingClientRect()
            const w: number = rect.width
            const h: number = rect.height
            startTransition(() => {
                setContainerWidth(Number.isFinite(w) && w > 0 ? w : 0)
                setContainerHeight(Number.isFinite(h) && h > 0 ? h : 0)
            })
        }

        update()

        const ro = new ResizeObserver(() => update())
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // ─── BREAKPOINT RESOLUTION ───────────────────────────────────────────────

    const activeBreakpoint = useMemo<Breakpoint>(() => {
        const wRaw: number = containerWidth || 1200
        const minW: number = Math.max(0, minResponsiveWidth)
        const maxW: number = Math.max(0, maxResponsiveWidth)
        const w: number =
            maxW > 0
                ? Math.min(Math.max(wRaw, minW), maxW)
                : Math.max(wRaw, minW)
        const t: number = Math.max(0, tabletBreakpoint)
        const m: number = Math.max(0, mobileBreakpoint)
        const mobileMax: number = Math.min(m, t)
        const tabletMax: number = Math.max(m, t)

        if (w <= tabletMax) {
            return w <= mobileMax ? "mobile" : "tablet"
        }
        return "desktop"
    }, [
        containerWidth,
        maxResponsiveWidth,
        minResponsiveWidth,
        mobileBreakpoint,
        tabletBreakpoint,
    ])

    // ─── RESPONSIVE VALUES ───────────────────────────────────────────────────

    const rv = useMemo(() => {
        const pick = (d: number, t: number, m: number): number => {
            const bp: Breakpoint = activeBreakpoint
            return bp === "mobile" ? m : bp === "tablet" ? t : d
        }

        return {
            slideHeight: pick(
                slideHeightDesktop,
                slideHeightTablet,
                slideHeightMobile
            ),
            slideGap: pick(slideGapDesktop, slideGapTablet, slideGapMobile),
            effectStrength: pick(
                effectStrengthDesktop,
                effectStrengthTablet,
                effectStrengthMobile
            ),
            blurStrength: pick(
                blurStrengthDesktop,
                blurStrengthTablet,
                blurStrengthMobile
            ),
            borderRadius: pick(
                borderRadiusDesktop,
                borderRadiusTablet,
                borderRadiusMobile
            ),
            cardRotation: pick(
                cardRotationDesktop,
                cardRotationTablet,
                cardRotationMobile
            ),
            animationSpeed: pick(
                animationSpeedDesktop,
                animationSpeedTablet,
                animationSpeedMobile
            ),
            animationSmooth: pick(
                animationSmoothDesktop,
                animationSmoothTablet,
                animationSmoothMobile
            ),
            scrollSpeed: pick(
                scrollSpeedDesktop,
                scrollSpeedTablet,
                scrollSpeedMobile
            ),
        }
    }, [
        activeBreakpoint,
        animationSmoothDesktop,
        animationSmoothMobile,
        animationSmoothTablet,
        animationSpeedDesktop,
        animationSpeedMobile,
        animationSpeedTablet,
        blurStrengthDesktop,
        blurStrengthMobile,
        blurStrengthTablet,
        borderRadiusDesktop,
        borderRadiusMobile,
        borderRadiusTablet,
        cardRotationDesktop,
        cardRotationMobile,
        cardRotationTablet,
        effectStrengthDesktop,
        effectStrengthMobile,
        effectStrengthTablet,
        scrollSpeedDesktop,
        scrollSpeedMobile,
        scrollSpeedTablet,
        slideGapDesktop,
        slideGapMobile,
        slideGapTablet,
        slideHeightDesktop,
        slideHeightMobile,
        slideHeightTablet,
    ])

    // ─── DERIVED CALCULATIONS ────────────────────────────────────────────────

    const validImages = useMemo<SlideData[]>(
        () => images.filter((s: SlideData) => s.image),
        [images]
    )
    const imageCount: number = validImages.length

    const actualGap = useMemo<number>(() => {
        const gapPercent: number = rv.slideGap || 0
        const height: number = rv.slideHeight || 0
        return Math.max(0, (gapPercent / 100) * height)
    }, [rv.slideGap, rv.slideHeight])

    const totalSize = useMemo<number>(() => {
        const size: number = imageCount * (rv.slideHeight + actualGap)
        return size > 0 ? size : 1
    }, [actualGap, imageCount, rv.slideHeight])

    const animationParams = useMemo(() => {
        const stiffness: number = 50 + rv.animationSpeed * 15
        const damping: number = 10 + rv.animationSmooth * 3
        const mass: number = 0.1 + (10 - rv.animationSpeed) * 0.05
        const wheelSpeed: number = 0.5 + rv.scrollSpeed * 0.15
        return { stiffness, damping, mass, wheelSpeed }
    }, [rv.animationSmooth, rv.animationSpeed, rv.scrollSpeed])

    const effectParams = useMemo(() => {
        const rotation: number = 5 + rv.effectStrength * 3
        const depth: number = 50 + rv.effectStrength * 50
        const distortion: number = rv.effectStrength * 10
        const perspectiveValue: number = perspectiveMode === "standard" ? 800 + rv.effectStrength * 200 : perspective
        return {
            rotation,
            depth,
            distortion,
            perspective: perspectiveValue,
            cardRotation: rv.cardRotation,
        }
    }, [rv.cardRotation, rv.effectStrength, perspectiveMode, perspective])

    const slideOffsets = useMemo(() => {
        return validImages.map((_: SlideData, idx: number) => ({
            rotationVariation: pseudoRandom(idx) * rv.cardRotation,
        }))
    }, [rv.cardRotation, validImages])

    // ─── MOTION VALUES ───────────────────────────────────────────────────────

    const velocityRef = useRef<number>(0)
    const scrollPos = useMotionValue(0)

    const velocityMotion = useMotionValue(0)
    const smoothVelocity = useSpring(velocityMotion, {
        damping: 20,
        stiffness: 60,
        mass: 0.1,
    })

    const blurFilter = useMotionValue<string>("none")

    // Track velocity value in a ref for transform template
    const velocityForTransformRef = useRef<number>(0)

    // ─── VIRTUAL VISIBILITY SYSTEM ───────────────────────────────────────────
    const [currentScrollValue, setCurrentScrollValue] = useState<number>(0)

    useLayoutEffect(() => {
        if (typeof window === "undefined") return

        const unsubscribe = scrollPos.on("change", (v: number) => {
            setCurrentScrollValue(Number.isFinite(v) ? v : 0)
        })

        return () => unsubscribe()
    }, [scrollPos])

    const isSlideVisible = useCallback(
        (slideOffset: number): boolean => {
            const viewportSize: number = isHorizontal ? containerWidth : containerHeight
            if (viewportSize === 0) return true

            let pos: number = slideOffset - (currentScrollValue % totalSize)
            const halfTotal: number = totalSize / 2
            if (pos > halfTotal) pos -= totalSize
            if (pos < -halfTotal) pos += totalSize

            const margin: number = viewportSize * visibilityMargin
            return Math.abs(pos) <= margin
        },
        [containerHeight, containerWidth, currentScrollValue, isHorizontal, totalSize, visibilityMargin]
    )

    // ─── SYNC VELOCITY TO REF ────────────────────────────────────────────────

    useLayoutEffect(() => {
        if (typeof window === "undefined") return

        const unsubscribe = smoothVelocity.on("change", (v: number) => {
            velocityForTransformRef.current = Number.isFinite(v) ? v : 0
        })

        return () => unsubscribe()
    }, [smoothVelocity])

    // ─── MOTION BLUR SYNC ────────────────────────────────────────────────────

    useLayoutEffect(() => {
        if (typeof window === "undefined") return

        if (!blurWhileScrolling || !isInView || isCanvas || prefersReduced) {
            blurFilter.set("none")
            return
        }

        const unsubscribe = smoothVelocity.on("change", (v: number) => {
            const vv: number = Number.isFinite(v) ? Math.abs(v) : 0
            const maxBlurPx: number = Math.max(0, rv.blurStrength) * 0.35
            const t: number = Math.min(1, Math.sqrt(vv / 8000))
            const amount: number = maxBlurPx * t
            blurFilter.set(
                amount > 0.01 ? `blur(${amount.toFixed(2)}px)` : "none"
            )
        })

        return () => unsubscribe()
    }, [
        blurFilter,
        blurWhileScrolling,
        isCanvas,
        isHorizontal,
        isInView,
        prefersReduced,
        rv.blurStrength,
        smoothVelocity,
    ])

    // ─── FRAME LOOP ENGINE ───────────────────────────────────────────────────

    useLayoutEffect(() => {
        if (typeof window === "undefined") return
        if (prefersReduced || !isInView) return

        let frameId: number = 0
        let lastTime: number = 0

        const tick = (time: number): void => {
            // Calculate delta time
            const dt: number = lastTime > 0 ? Math.min(time - lastTime, 50) : 0
            lastTime = time

            // Auto-scroll injection
            if (autoScroll && (!isHovered || !pauseOnHover)) {
                const pxPerSecond: number =
                    autoScrollDirection === "reverse"
                        ? -autoScrollSpeed
                        : autoScrollSpeed
                const autoVelocity: number = pxPerSecond * (dt * 0.06) / 1000
                velocityRef.current += autoVelocity
            }

            // Apply friction
            velocityRef.current *= friction

            // Magnetic snapping
            if (magneticSnap && !autoScroll && Math.abs(velocityRef.current) < 0.5) {
                const currentPos: number = scrollPos.get()
                
                // Find closest item's focal point
                let closestDistance: number = Infinity
                let closestFocalPoint: number = 0
                
                for (let i = 0; i < imageCount; i++) {
                    const slideOffset: number = i * (rv.slideHeight + actualGap)
                    const focalPoint: number = slideOffset
                    
                    // Calculate wrapped distance
                    let distance: number = focalPoint - (currentPos % totalSize)
                    const halfTotal: number = totalSize / 2
                    if (distance > halfTotal) distance -= totalSize
                    if (distance < -halfTotal) distance += totalSize
                    
                    const absDistance: number = Math.abs(distance)
                    if (absDistance < closestDistance) {
                        closestDistance = absDistance
                        closestFocalPoint = focalPoint
                    }
                }
                
                // Apply pull force
                const targetPos: number = closestFocalPoint - (currentPos % totalSize)
                let pullTarget: number = targetPos
                const halfTotal: number = totalSize / 2
                if (pullTarget > halfTotal) pullTarget -= totalSize
                if (pullTarget < -halfTotal) pullTarget += totalSize
                
                const pullForce: number = pullTarget * 0.1
                velocityRef.current += pullForce
            }

            // Apply velocity to position
            const currentPos: number = scrollPos.get()
            const newPos: number = currentPos + velocityRef.current

            // Infinite wrapping
            const fullLoopSize: number = totalSize
            let wrappedPos: number = newPos

            if (wrappedPos < -fullLoopSize) {
                wrappedPos += fullLoopSize
            } else if (wrappedPos > 0) {
                wrappedPos -= fullLoopSize
            }

            scrollPos.set(wrappedPos)

            // Update velocity motion for blur and stretch
            velocityMotion.set(velocityRef.current)

            frameId = requestAnimationFrame(tick)
        }

        frameId = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frameId)
    }, [
        actualGap,
        autoScroll,
        autoScrollDirection,
        autoScrollSpeed,
        friction,
        imageCount,
        isHovered,
        isInView,
        magneticSnap,
        pauseOnHover,
        prefersReduced,
        rv.slideHeight,
        scrollPos,
        totalSize,
        velocityMotion,
    ])

    // ─── WHEEL SCROLL CAPTURE ────────────────────────────────────────────────

    useLayoutEffect(() => {
        if (typeof window === "undefined" || !containerRef.current) return
        if (!isInView || isCanvas || prefersReduced) return

        const el: HTMLElement = containerRef.current

        const onWheel = (e: WheelEvent): void => {
            const delta: number = isHorizontal ? e.deltaX || e.deltaY : e.deltaY || e.deltaX
            if (!delta) return

            e.preventDefault()

            // Inject velocity, not position
            velocityRef.current += delta * 0.05 * sensitivity
        }

        el.addEventListener("wheel", onWheel, { passive: false })
        return () => {
            el.removeEventListener("wheel", onWheel)
        }
    }, [
        isCanvas,
        isHorizontal,
        isInView,
        prefersReduced,
        sensitivity,
    ])

    // ─── TOUCH / DRAG SUPPORT ────────────────────────────────────────────────

    const touchStartRef = useRef<number>(0)
    const touchLastRef = useRef<number>(0)

    useLayoutEffect(() => {
        if (typeof window === "undefined" || !containerRef.current) return
        if (isCanvas || prefersReduced) return

        const el: HTMLElement = containerRef.current

        const onTouchStart = (e: TouchEvent): void => {
            const touch: Touch = e.touches[0]
            const pos: number = isHorizontal ? touch.clientX : touch.clientY
            touchStartRef.current = pos
            touchLastRef.current = pos
        }

        const onTouchMove = (e: TouchEvent): void => {
            const touch: Touch = e.touches[0]
            const pos: number = isHorizontal ? touch.clientX : touch.clientY
            const delta: number = touchLastRef.current - pos
            touchLastRef.current = pos

            if (Math.abs(delta) > 1) {
                e.preventDefault()
                // Inject velocity
                velocityRef.current += delta * 0.15
            }
        }

        const onTouchEnd = (): void => {
            // Velocity continues naturally via friction
        }

        el.addEventListener("touchstart", onTouchStart, { passive: true })
        el.addEventListener("touchmove", onTouchMove, { passive: false })
        el.addEventListener("touchend", onTouchEnd, { passive: true })

        return () => {
            el.removeEventListener("touchstart", onTouchStart)
            el.removeEventListener("touchmove", onTouchMove)
            el.removeEventListener("touchend", onTouchEnd)
        }
    }, [
        isCanvas,
        isHorizontal,
        isInView,
        prefersReduced,
    ])

    // ─── KEYBOARD HANDLER ────────────────────────────────────────────────────

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent): void => {
            const step: number = rv.slideHeight * 0.25
            if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                e.preventDefault()
                velocityRef.current += step * 0.5
            }
            if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                e.preventDefault()
                velocityRef.current -= step * 0.5
            }
            if (e.key === "Home") {
                e.preventDefault()
                scrollPos.set(0)
                velocityRef.current = 0
            }
        },
        [rv.slideHeight, scrollPos]
    )

    // ─── HOVER HANDLERS ─────────────────────────────────────────────────────

    const handleMouseEnter = useCallback((): void => {
        setIsHovered(true)
    }, [])

    const handleMouseLeave = useCallback((): void => {
        setIsHovered(false)
    }, [])

    // ─── TRANSFORM TEMPLATE ─────────────────────────────────────────────────

    const buildTransformTemplate = useCallback(
        (
            slideOffset: number,
            slideWidth: number,
            cardRotationValue: number,
            userHorizontalOffset: number,
            userVerticalOffset: number,
            cylindricalScaleRef: any,
            cylindricalRotationRef: any,
            cylindricalZRef: any,
            combinedScaleRef: any
        ) => {
            return (
                transform: Record<string, string | number>,
                generatedTransform: string
            ): string => {
                const xVal = transform?.x
                const yVal = transform?.y

                const scrollValue: number = isHorizontal
                    ? typeof xVal === "string"
                        ? parseFloat(xVal)
                        : Number(xVal) || 0
                    : typeof yVal === "string"
                      ? parseFloat(yVal)
                      : Number(yVal) || 0

                const velocityValue: number = velocityForTransformRef.current

                let pos: number = slideOffset - (scrollValue % totalSize)
                const halfTotal: number = totalSize / 2
                if (pos > halfTotal) pos -= totalSize
                if (pos < -halfTotal) pos += totalSize

                const norm: number =
                    pos / (isHorizontal ? slideWidth : rv.slideHeight)

                const scrollX: number = isHorizontal ? pos : 0
                const scrollYPos: number = isHorizontal ? 0 : pos
                const finalX: number = scrollX + userHorizontalOffset
                const finalY: number = scrollYPos + userVerticalOffset

                // Get cylindrical perspective values from refs
                const cylScale: number = combinedScaleRef.current
                const cylRotation: number = cylindricalRotationRef.current
                const cylZ: number = cylindricalZRef.current

                switch (effectPreset) {
                    case "distortion": {
                        const distortionFactor: number =
                            Math.abs(velocityValue) *
                            effectParams.distortion *
                            0.00003
                        let scaleX: number = isHorizontal
                            ? 1 + distortionFactor * 0.3
                            : 1 - distortionFactor * 0.15
                        let scaleY: number = isHorizontal
                            ? 1 - distortionFactor * 0.15
                            : 1 + distortionFactor * 0.3
                        scaleX = Math.max(0.97, Math.min(1.08, scaleX)) * cylScale
                        scaleY = Math.max(0.97, Math.min(1.08, scaleY)) * cylScale
                        
                        if (isHorizontal) {
                            return `translate3d(${finalX}px, ${finalY}px, ${cylZ}px) scaleX(${scaleX}) scaleY(${scaleY}) rotateY(${cylRotation}deg)`
                        }
                        return `translate3d(${finalX}px, ${finalY}px, ${cylZ}px) scaleX(${scaleX}) scaleY(${scaleY}) rotateX(${cylRotation}deg)`
                    }
                    case "carousel": {
                        const depthZ: number =
                            -Math.abs(norm) * effectParams.depth + cylZ
                        if (isHorizontal) {
                            return `translate3d(${finalX}px, ${finalY}px, ${depthZ}px) rotateY(${-norm * effectParams.rotation + cylRotation}deg) scale(${cylScale})`
                        }
                        return `translate3d(${finalX}px, ${finalY}px, ${depthZ}px) rotateX(${norm * effectParams.rotation + cylRotation}deg) scale(${cylScale})`
                    }
                    case "cards": {
                        const depthZ2: number =
                            -Math.abs(norm) * effectParams.depth + cylZ
                        if (isHorizontal) {
                            return `translate3d(${finalX}px, ${finalY}px, ${depthZ2}px) rotateY(${cardRotationValue + cylRotation}deg) rotateZ(${cardRotationValue * 0.5}deg) scale(${cylScale})`
                        }
                        return `translate3d(${finalX}px, ${finalY}px, ${depthZ2}px) rotateX(${cardRotationValue + cylRotation}deg) rotateZ(${cardRotationValue * 0.5}deg) scale(${cylScale})`
                    }
                    default:
                        if (isHorizontal) {
                            return `translate3d(${finalX}px, ${finalY}px, ${cylZ}px) scale(${cylScale}) rotateY(${cylRotation}deg)`
                        }
                        return `translate3d(${finalX}px, ${finalY}px, ${cylZ}px) scale(${cylScale}) rotateX(${cylRotation}deg)`
                }
            }
        },
        [
            effectParams.depth,
            effectParams.distortion,
            effectParams.rotation,
            effectPreset,
            isHorizontal,
            rv.slideHeight,
            totalSize,
        ]
    )

    // ─── LIVE INTERACTIVE RENDER ─────────────────────────────────────────────

    // ─── CANVAS / REDUCED MOTION STATIC PREVIEW ──────────────────────────────
    if (isCanvas || prefersReduced) {
        const previewImages = validImages.slice(0, 3)
        
        return (
            <section
                role="region"
                aria-roledescription="carousel"
                aria-label={ariaLabel}
                ref={containerRef}
                style={{
                    ...style,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: isHorizontal ? "row" : "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: `${actualGap}px`,
                }}
            >
                {previewImages.map((slide: SlideData, idx: number) => {
                    const aspectRatio: number = slide.aspectRatio || 1.5
                    const slideWidth: number = rv.slideHeight * aspectRatio
                    const slideHeight: number = rv.slideHeight

                    const showShadow: boolean = slide.showShadow ?? false
                    const shadowIntensity: number = slide.shadowIntensity ?? 5
                    const shadowBlur: number = shadowIntensity * 4
                    const shadowSpread: number = shadowIntensity * 0.5
                    const shadowOpacity: number = Math.min(0.5, shadowIntensity * 0.05)
                    const boxShadow: string = showShadow
                        ? `0 ${shadowIntensity * 2}px ${shadowBlur}px ${shadowSpread}px rgba(0, 0, 0, ${shadowOpacity})`
                        : "none"

                    return (
                        <div
                            key={idx}
                            style={{
                                width: `${slideWidth}px`,
                                height: `${slideHeight}px`,
                                flexShrink: 0,
                                overflow: "hidden",
                                borderRadius: `${rv.borderRadius}px`,
                                boxShadow: boxShadow,
                            }}
                        >
                            <img
                                src={getImgSrc(slide)}
                                alt={getImgAlt(slide)}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                        </div>
                    )
                })}
            </section>
        )
    }

    return (
        <section
            role="region"
            aria-roledescription="carousel"
            aria-label={ariaLabel}
            ref={containerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                cursor: "grab",
                perspective: `${effectParams.perspective}px`,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <motion.div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        willChange: "transform",
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
                        }}
                    >
                        {validImages.map((slide: SlideData, idx: number) => (
                            <SlideItem
                                key={idx}
                                slide={slide}
                                idx={idx}
                                scrollPos={scrollPos}
                                smoothVelocity={smoothVelocity}
                                rv={rv}
                                actualGap={actualGap}
                                isHorizontal={isHorizontal}
                                containerWidth={containerWidth}
                                containerHeight={containerHeight}
                                perspectiveMode={perspectiveMode}
                                lensWarp={lensWarp}
                                depthIntensity={depthIntensity}
                                edgeBlur={edgeBlur}
                                parallaxIntensity={parallaxIntensity}
                                velocityStretch={velocityStretch}
                                blurWhileScrolling={blurWhileScrolling}
                                blurFilter={blurFilter}
                                isSlideVisible={isSlideVisible}
                                buildTransformTemplate={buildTransformTemplate}
                                cardRotationValue={rv.cardRotation}
                                totalSize={totalSize}
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

// ─── PROPERTY CONTROLS ───────────────────────────────────────────────────────

TheScroller.displayName = "TheScroller"

addPropertyControls(TheScroller, {
    // ─── BREAKPOINT SELECTOR (TOP) ───────────────────────────────────────────
    breakpointSelector: {
        type: ControlType.Enum,
        title: "Configure",
        description:
            "Choose which device settings to edit. Breakpoints are auto-detected from container width.",
        options: ["desktop", "tablet", "mobile"],
        optionTitles: ["Desktop", "Tablet", "Mobile"],
        defaultValue: "desktop",
        displaySegmentedControl: true,
    },

    // ─── CONTENT ─────────────────────────────────────────────────────────────
    images: {
        type: ControlType.Array,
        title: "Slides",
        description:
            "Add images to the carousel. Supports drag-and-drop.",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    description: "The image to display in this slide.",
                },
                title: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Slide",
                    description: "Accessibility label and slide name.",
                },
                aspectRatio: {
                    type: ControlType.Number,
                    title: "Aspect Ratio",
                    min: 0.5,
                    max: 3,
                    step: 0.1,
                    defaultValue: 1.5,
                    description: "Width ÷ height ratio for this slide.",
                },
                horizontalOffset: {
                    type: ControlType.Number,
                    title: "H Offset",
                    description: "Shift slide left or right.",
                    min: -500,
                    max: 500,
                    step: 10,
                    defaultValue: 0,
                    unit: "px",
                },
                verticalOffset: {
                    type: ControlType.Number,
                    title: "V Offset",
                    description: "Shift slide up or down.",
                    min: -500,
                    max: 500,
                    step: 10,
                    defaultValue: 0,
                    unit: "px",
                },
                showShadow: {
                    type: ControlType.Boolean,
                    title: "Shadow",
                    description: "Enable drop shadow for this slide.",
                    defaultValue: false,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                },
                shadowIntensity: {
                    type: ControlType.Number,
                    title: "Shadow Intensity",
                    description: "Strength of the drop shadow effect.",
                    min: 0,
                    max: 10,
                    step: 0.1,
                    defaultValue: 5,
                    hidden: (props: Record<string, unknown>) => !props.showShadow,
                },
            },
        },
        defaultValue: DEFAULT_SLIDES.map((s: SlideData) => ({
            ...s,
            aspectRatio: 1.5,
            horizontalOffset: 0,
            verticalOffset: 0,
            showShadow: false,
            shadowIntensity: 5,
        })),
        maxCount: 20,
    },

    direction: {
        type: ControlType.Enum,
        title: "Direction",
        description: "Scroll direction. Vertical scrolls up/down, horizontal scrolls left/right.",
        options: ["vertical", "horizontal"],
        optionTitles: ["Vertical", "Horizontal"],
        defaultValue: "vertical",
        displaySegmentedControl: true,
    },

    ariaLabel: {
        type: ControlType.String,
        title: "ARIA Label",
        description: "Screen-reader label for the carousel region.",
        defaultValue: "3D image slider",
    },

    // ─── BREAKPOINT CONFIGURATION ────────────────────────────────────────────
    tabletBreakpoint: {
        type: ControlType.Number,
        title: "Tablet ≤",
        description:
            "Switch to Tablet settings at or below this container width.",
        min: 240,
        max: 1920,
        step: 10,
        unit: "px",
        defaultValue: 768,
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile ≤",
        description:
            "Switch to Mobile settings at or below this container width.",
        min: 240,
        max: 1920,
        step: 10,
        unit: "px",
        defaultValue: 480,
    },
    minResponsiveWidth: {
        type: ControlType.Number,
        title: "Min Width",
        description:
            "Clamp measured width to at least this value (0 = off).",
        min: 0,
        max: 3840,
        step: 10,
        unit: "px",
        defaultValue: 0,
    },
    maxResponsiveWidth: {
        type: ControlType.Number,
        title: "Max Width",
        description: "Clamp measured width to at most this value (0 = off).",
        min: 0,
        max: 3840,
        step: 10,
        unit: "px",
        defaultValue: 0,
    },

    // ─── LAYOUT: DESKTOP ─────────────────────────────────────────────────────
    slideHeightDesktop: {
        type: ControlType.Number,
        title: "Slide Height",
        description: "Height of each slide at desktop.",
        min: 200,
        max: 1000,
        step: 10,
        defaultValue: 600,
        unit: "px",
        hidden: (props: Record<string, unknown>) =>
            props.breakpointSelector !== "desktop",
    },
    slideGapDesktop: {
        type: ControlType.Number,
        title: "Slide Gap",
        description: "Space between slides as percentage of height.",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 10,
        unit: "%",
        hidden: (props: Record<string, unknown>) =>
            props.breakpointSelector !== "desktop",
    },
    borderRadiusDesktop: {
        type: ControlType.Number,
        title: "Corner Radius",
        description: "Rounded corners for slides at desktop.",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 0,
        unit: "px",
        hidden: (props: Record<string, unknown>) =>
            props.breakpointSelector !== "desktop",
    },
    effectStrengthDesktop: {
        type: ControlType.Number,
        title: "Effect Intensity",
        description: "Intensity of the 3D effect. Higher = more dramatic transforms.",
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 5,
        hidden: (props: Record<string, unknown>) =>
            props.breakpointSelector !== "desktop",
    },
    cardRotationDesktop: {
        type: ControlType.Number,
        title: "Card Rotation",
        description: "Additional Z-axis rotation for the Cards preset.",
        min: -10,
        max: 10,
        step: 0.1,
        defaultValue: 5,
        unit: "°",
        hidden: (props: Record<string, unknown>) =>
            props.effectPreset !== "cards" ||
            props.randomRotation === true ||
            props.breakpointSelector !== "desktop",
    },
    blurStrengthDesktop: {
        type: ControlType.Number,
        title: "Blur Intensity",
        description: "Maximum motion blur applied during fast scrolling.",
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 5,
        hidden: (props: Record<string, unknown>) =>
            props.breakpointSelector !== "desktop",
    },
    animationSpeedDesktop: {
        type: ControlType.Number,
        title: "Animation Speed",
        description: "Spring stiffness. Higher = snappier response to input.",
        min: 1,
        max: 10,
        step: 0.1,
        defaultValue: 5,
        hidden: (props: Record<string, unknown>) =>
            props.breakpointSelector !== "desktop",
    },
    animationSmoothDesktop: {
        type: ControlType.Number,
        title: "Animation Smooth",
        description: "Spring damping. Higher = smoother, less bouncy.",
        min: 1,
        max: 10,
        step: 0.1,
        defaultValue: 5,
        hidden: (props: Record<string, unknown>) =>
            props.breakpointSelector !== "desktop",
    },
    scrollSpeedDesktop: {
        type: ControlType.Number,
        title: "Scroll Speed",
        description: "Wheel/touch sensitivity multiplier.",
        min: 1,
        max: 10,
        step: 0.1,
        defaultValue: 5,
        hidden: (props: Record<string, unknown>) =>
            props.breakpointSelector !== "desktop",
    },

    // ─── LAYOUT: TABLET ──────────────────────────────────────────────────────
    slideHeightTablet: {
        type: ControlType.Number,
        title: "Slide Height",
        description: "Height of each slide at tablet.",
        min: 200,
        max: 1000,
        step: 10,
        defaultValue: 450,
        unit: "px",
        hidden: (props: Record<string, unknown>) =>
            props.breakpointSelector !== "tablet",
    },
    slideGapTablet: {
        type: ControlType.Number,
        title: "Slide Gap",
        description: "Space between slides as percentage of height.",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 8,
        unit: "%",
        hidden: (props: Record<string, unknown>) =>
            props.breakpointSelector !== "tablet",
    },
    borderRadiusTablet: {
        type: ControlType.Number,
        title: "Corner Radius",
        description: "Rounded corners for slides at tablet.",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 0,
        unit: "px",
        hidden: (props: Record<string, unknown>) =>
            props.breakpointSelector !== "tablet",
    },
    effectStrengthTablet: {
        type: ControlType.Number,
        title: "Effect Intensity",
        description: "Intensity of the 3D effect. Higher = more dramatic transforms.",
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 4,
        hidden: (props: Record<string, unknown>) =>
            props.breakpointSelector !== "tablet",
    },
    cardRotationTablet: {
        type: ControlType.Number,
        title: "Card Rotation",
        description: "Additional Z-axis rotation for the Cards preset.",
        min: -10,
        max: 10,
        step: 0.1,
        defaultValue: 4,
        unit: "°",
        hidden: (props: Record<string, unknown>) =>
            props.effectPreset !== "cards" ||
            props.randomRotation === true ||
            props.breakpointSelector !== "tablet",
    },
    blurStrengthTablet: {
        type: ControlType.Number,
        title: "Blur Intensity",
        description: "Maximum motion blur applied during fast scrolling.",
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 4,
        hidden: (props: Record<string, unknown>) =>
            props.breakpointSelector !== "tablet",
    },
    animationSpeedTablet: {
        type: ControlType.Number,
        title: "Animation Speed",
        description: "Spring stiffness. Higher = snappier response to input.",
        min: 1,
        max: 10,
        step: 0.1,
        defaultValue: 5,
        hidden: (props: Record<string, unknown>) =>
            props.breakpointSelector !== "tablet",
    },
    animationSmoothTablet: {
        type: ControlType.Number,
        title: "Animation Smooth",
        description: "Spring damping. Higher = smoother, less bouncy.",
        min: 1,
        max: 10,
        step: 0.1,
        defaultValue: 5,
        hidden: (props: Record<string, unknown>) =>
            props.breakpointSelector !== "tablet",
    },
    scrollSpeedTablet: {
        type: ControlType.Number,
        title: "Scroll Speed",
        description: "Wheel/touch sensitivity multiplier.",
        min: 1,
        max: 10,
        step: 0.1,
        defaultValue: 5,
        hidden: (props: Record<string, unknown>) =>
            props.breakpointSelector !== "tablet",
    },

    // ─── LAYOUT: MOBILE ──────────────────────────────────────────────────────
    slideHeightMobile: {
        type: ControlType.Number,
        title: "Slide Height",
        description: "Height of each slide at mobile.",
        min: 200,
        max: 1000,
        step: 10,
        defaultValue: 300,
        unit: "px",
        hidden: (props: Record<string, unknown>) =>
            props.breakpointSelector !== "mobile",
    },
    slideGapMobile: {
        type: ControlType.Number,
        title: "Slide Gap",
        description: "Space between slides as percentage of height.",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 5,
        unit: "%",
        hidden: (props: Record<string, unknown>) =>
            props.breakpointSelector !== "mobile",
    },
    borderRadiusMobile: {
        type: ControlType.Number,
        title: "Corner Radius",
        description: "Rounded corners for slides at mobile.",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 0,
        unit: "px",
        hidden: (props: Record<string, unknown>) =>
            props.breakpointSelector !== "mobile",
    },
    effectStrengthMobile: {
        type: ControlType.Number,
        title: "Effect Intensity",
        description: "Intensity of the 3D effect. Higher = more dramatic transforms.",
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 3,
        hidden: (props: Record<string, unknown>) =>
            props.breakpointSelector !== "mobile",
    },
    cardRotationMobile: {
        type: ControlType.Number,
        title: "Card Rotation",
        description: "Additional Z-axis rotation for the Cards preset.",
        min: -10,
        max: 10,
        step: 0.1,
        defaultValue: 3,
        unit: "°",
        hidden: (props: Record<string, unknown>) =>
            props.effectPreset !== "cards" ||
            props.randomRotation === true ||
            props.breakpointSelector !== "mobile",
    },
    blurStrengthMobile: {
        type: ControlType.Number,
        title: "Blur Intensity",
        description: "Maximum motion blur applied during fast scrolling.",
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 3,
        hidden: (props: Record<string, unknown>) =>
            props.breakpointSelector !== "mobile",
    },
    animationSpeedMobile: {
        type: ControlType.Number,
        title: "Animation Speed",
        description: "Spring stiffness. Higher = snappier response to input.",
        min: 1,
        max: 10,
        step: 0.1,
        defaultValue: 5,
        hidden: (props: Record<string, unknown>) =>
            props.breakpointSelector !== "mobile",
    },
    animationSmoothMobile: {
        type: ControlType.Number,
        title: "Animation Smooth",
        description: "Spring damping. Higher = smoother, less bouncy.",
        min: 1,
        max: 10,
        step: 0.1,
        defaultValue: 5,
        hidden: (props: Record<string, unknown>) =>
            props.breakpointSelector !== "mobile",
    },
    scrollSpeedMobile: {
        type: ControlType.Number,
        title: "Scroll Speed",
        description: "Wheel/touch sensitivity multiplier.",
        min: 1,
        max: 10,
        step: 0.1,
        defaultValue: 5,
        hidden: (props: Record<string, unknown>) =>
            props.breakpointSelector !== "mobile",
    },

    // ─── OPTICS: GLOBAL ──────────────────────────────────────────────────────
    effectPreset: {
        type: ControlType.Enum,
        title: "3D Effect",
        description:
            "Visual style. Distortion: velocity-based warping. Carousel: cylindrical 3D rotation. Cards: stacked card perspective.",
        options: ["distortion", "carousel", "cards"],
        optionTitles: ["Distortion", "Carousel", "Cards"],
        defaultValue: "carousel",
        displaySegmentedControl: true,
    },

    perspectiveMode: {
        type: ControlType.Enum,
        title: "Perspective Mode",
        description: "Cylindrical perspective system: Standard, Convex (Cylinder), or Concave (Theater).",
        options: ["standard", "convex", "concave"],
        optionTitles: ["Standard", "Convex (Cylinder)", "Concave (Theater)"],
        defaultValue: "standard",
        displaySegmentedControl: true,
    },

    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        description: "CSS perspective distance for 3D depth.",
        min: 500,
        max: 3000,
        step: 50,
        defaultValue: 1500,
        unit: "px",
        hidden: (props: Record<string, unknown>) => props.perspectiveMode === "standard",
    },

    depthIntensity: {
        type: ControlType.Number,
        title: "Z-Depth",
        description: "Z-axis travel distance for cylindrical effect.",
        min: 0,
        max: 500,
        step: 10,
        defaultValue: 100,
        unit: "px",
        hidden: (props: Record<string, unknown>) => props.perspectiveMode === "standard",
    },

    lensWarp: {
        type: ControlType.Number,
        title: "Lens Warp",
        description: "Rotation intensity for cylindrical warping.",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.15,
        hidden: (props: Record<string, unknown>) => props.perspectiveMode === "standard",
    },

    edgeBlur: {
        type: ControlType.Number,
        title: "Progressive Blur",
        description: "Maximum blur at the edges. Center is always sharp. Creates a depth-of-field effect.",
        min: 0,
        max: 10,
        step: 0.5,
        defaultValue: 4,
        unit: "px",
    },

    parallaxIntensity: {
        type: ControlType.Number,
        title: "Internal Parallax",
        description: "Image shifts inside its container during scroll. Creates layered depth.",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.2,
    },

    velocityStretch: {
        type: ControlType.Number,
        title: "Velocity Stretch",
        description: "Squash & stretch based on scroll speed. Adds organic, liquid momentum.",
        min: 0,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.1,
    },

    randomRotation: {
        type: ControlType.Boolean,
        title: "Random Rotation",
        description: "Add slight random rotation variation to each slide for an organic feel.",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props: Record<string, unknown>) => props.effectPreset !== "cards",
    },

    blurWhileScrolling: {
        type: ControlType.Boolean,
        title: "Motion Blur",
        description: "Apply gaussian blur proportional to scroll velocity.",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    // ─── SCROLL BEHAVIOR ─────────────────────────────────────────────────────
    infiniteScroll: {
        type: ControlType.Boolean,
        title: "Infinite Scroll",
        description: "Enable seamless infinite looping of all slides.",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    scrollRange: {
        type: ControlType.Number,
        title: "Scroll Range",
        description: "How far the user can scroll before hitting the boundary (non-infinite mode).",
        min: 1,
        max: 10,
        step: 0.5,
        defaultValue: 5,
        hidden: (props: Record<string, unknown>) => props.infiniteScroll === true,
    },

    // ─── PERFORMANCE ─────────────────────────────────────────────────────────
    visibilityMargin: {
        type: ControlType.Number,
        title: "Visibility Margin",
        description: "Render slides within this viewport multiplier.",
        min: 1,
        max: 3,
        step: 0.1,
        defaultValue: 1.5,
    },

    // ─── ENGINE ──────────────────────────────────────────────────────────────
    friction: {
        type: ControlType.Number,
        title: "Friction",
        description: "Velocity decay per frame (higher = smoother coast).",
        min: 0.8,
        max: 0.99,
        step: 0.01,
        defaultValue: 0.95,
    },
    sensitivity: {
        type: ControlType.Number,
        title: "Sensitivity",
        description: "Input responsiveness multiplier.",
        min: 0.1,
        max: 3,
        step: 0.1,
        defaultValue: 1,
    },
    magneticSnap: {
        type: ControlType.Boolean,
        title: "Magnetic Snap",
        description: "Gently pulls the nearest slide to center when velocity drops. Creates a settling feel.",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    // ─── AUTO-SCROLL ─────────────────────────────────────────────────────────
    autoScroll: {
        type: ControlType.Boolean,
        title: "Auto-Scroll",
        description: "Enable automatic continuous scrolling.",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoScrollSpeed: {
        type: ControlType.Number,
        title: "Auto-Scroll Speed",
        description: "Speed of automatic scrolling in pixels per second.",
        min: 0,
        max: 200,
        step: 5,
        defaultValue: 50,
        unit: "px/s",
        hidden: (props: Record<string, unknown>) => !props.autoScroll,
    },
    autoScrollDirection: {
        type: ControlType.Enum,
        title: "Auto-Scroll Direction",
        description: "Direction of automatic scrolling.",
        options: ["forward", "reverse"],
        optionTitles: ["Forward", "Reverse"],
        defaultValue: "forward",
        displaySegmentedControl: true,
        hidden: (props: Record<string, unknown>) => !props.autoScroll,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on Hover",
        description: "Pause auto-scroll when mouse hovers over the component.",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props: Record<string, unknown>) => !props.autoScroll,
    },
})
// ... existing code ...