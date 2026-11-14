import * as React from "react"
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
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

import { gsap } from "gsap"

// -----------------------------------------------------------------------
// createSuspendedRaf -- owns a requestAnimationFrame loop that auto-pauses
// when the tab is hidden or the root element scrolls offscreen. Inlined
// from registry/effects/_shared/createSuspendedRaf.ts (canonical source),
// unmodified logic.
// -----------------------------------------------------------------------

const DEFAULT_ROOT_MARGIN = "256px"

type RafRoot = Element | null | { current: Element | null } | (() => Element | null)

function resolveElement(root: RafRoot): Element | null {
    if (!root) return null
    if (typeof root === "function") return root() ?? null
    if (typeof root === "object" && "current" in root) return root.current ?? null
    return root
}

interface VisibilityGateOptions {
    root?: RafRoot
    rootMargin?: string
    threshold?: number
    observeTab?: boolean
    observeOffscreen?: boolean
    onChange?: (active: boolean) => void
}

interface VisibilityGate {
    readonly isActive: boolean
    observe: (nextRoot?: RafRoot) => void
    destroy: () => void
}

function createVisibilityGate({
    root = null,
    rootMargin = DEFAULT_ROOT_MARGIN,
    threshold = 0,
    observeTab = true,
    observeOffscreen = true,
    onChange,
}: VisibilityGateOptions = {}): VisibilityGate {
    let tabVisible = typeof document === "undefined" ? true : !document.hidden
    let onscreen = true
    let destroyed = false
    let observer: IntersectionObserver | null = null

    const isActive = () => {
        if (destroyed) return false
        if (observeTab && !tabVisible) return false
        if (observeOffscreen && resolveElement(root) && !onscreen) return false
        return true
    }

    let lastActive = isActive()

    const emit = () => {
        if (destroyed) return
        const next = isActive()
        if (next === lastActive) return
        lastActive = next
        onChange?.(next)
    }

    const onVisibilityChange = () => {
        tabVisible = !document.hidden
        emit()
    }

    if (observeTab && typeof document !== "undefined") {
        document.addEventListener("visibilitychange", onVisibilityChange)
    }

    const bindObserver = () => {
        if (!observeOffscreen || typeof IntersectionObserver === "undefined") {
            return
        }

        const el = resolveElement(root)
        if (!el) return

        observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    onscreen = entry.isIntersecting
                }
                emit()
            },
            { rootMargin, threshold }
        )

        observer.observe(el)
    }

    bindObserver()

    return {
        get isActive() {
            return isActive()
        },
        observe(nextRoot?: RafRoot) {
            if (destroyed) return
            if (nextRoot != null) root = nextRoot
            if (observer) {
                observer.disconnect()
                observer = null
            }
            onscreen = true
            bindObserver()
            emit()
        },
        destroy() {
            if (destroyed) return
            destroyed = true
            if (observeTab && typeof document !== "undefined") {
                document.removeEventListener("visibilitychange", onVisibilityChange)
            }
            if (observer) {
                observer.disconnect()
                observer = null
            }
        },
    }
}

interface SuspendedRafOptions {
    onFrame: (time: number) => void
    root?: RafRoot
    rootMargin?: string
    threshold?: number
    observeTab?: boolean
    observeOffscreen?: boolean
}

interface SuspendedRaf {
    start: () => void
    stop: () => void
    readonly isRunning: boolean
    readonly isActive: boolean
    observe: (nextRoot?: RafRoot) => void
    destroy: () => void
}

function createSuspendedRaf({
    onFrame,
    root = null,
    rootMargin = DEFAULT_ROOT_MARGIN,
    threshold = 0,
    observeTab = true,
    observeOffscreen = true,
}: SuspendedRafOptions): SuspendedRaf {
    let rafId: number | null = null
    let running = false
    let destroyed = false

    const stopRaf = () => {
        if (rafId != null) {
            cancelAnimationFrame(rafId)
            rafId = null
        }
    }

    const tick = (time: number) => {
        rafId = null
        if (destroyed || !running || !gate.isActive) return
        onFrame(time)
        if (!destroyed && running && gate.isActive) {
            rafId = requestAnimationFrame(tick)
        }
    }

    const sync = () => {
        if (destroyed) return
        if (running && gate.isActive) {
            if (rafId == null) {
                rafId = requestAnimationFrame(tick)
            }
        } else {
            stopRaf()
        }
    }

    const gate = createVisibilityGate({
        root,
        rootMargin,
        threshold,
        observeTab,
        observeOffscreen,
        onChange: sync,
    })

    return {
        start() {
            if (destroyed) return
            running = true
            sync()
        },
        stop() {
            running = false
            stopRaf()
        },
        get isRunning() {
            return running
        },
        get isActive() {
            return gate.isActive
        },
        observe(nextRoot?: RafRoot) {
            gate.observe(nextRoot)
            sync()
        },
        destroy() {
            if (destroyed) return
            destroyed = true
            running = false
            stopRaf()
            gate.destroy()
        },
    }
}

// -----------------------------------------------------------------------
// Mouse tracking, scoped to the component's own container element (not
// `window`) so multiple instances on one page never react to each other's
// pointer movement.
// -----------------------------------------------------------------------

const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b

function usePrefersReducedMotion() {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setPrefersReducedMotion(mediaQuery.matches)
        update()
        mediaQuery.addEventListener("change", update)
        return () => mediaQuery.removeEventListener("change", update)
    }, [])

    return prefersReducedMotion
}

const MOBILE_POINTER_QUERY = "(pointer: coarse)"
const OFFSCREEN_POSITION = -9999
const DEFAULT_IDLE_DISTANCE_THRESHOLD = 2
const DEFAULT_TRIGGER_DISTANCE_THRESHOLD = 100
const INITIAL_Z_INDEX = 1

// Resting layout used by the static renderer (canvas / export) and for
// prefers-reduced-motion: a frozen diagonal trail, positioned in plain CSS.
const STATIC_TRAIL = [
    { left: 12, top: 56, rotate: -8 },
    { left: 24, top: 42, rotate: 5 },
    { left: 36, top: 29, rotate: -4 },
    { left: 48, top: 17, rotate: 7 },
    { left: 60, top: 6, rotate: -5 },
]

const DEFAULT_IMAGES = [
    {
        src: "https://pub-8abee449136941f5b0a1cd2c014534e9.r2.dev/vault-listing-images/assets-images/h-11.jpg",
        alt: "Gradient 1",
    },
    {
        src: "https://pub-8abee449136941f5b0a1cd2c014534e9.r2.dev/vault-listing-images/assets-images/h-12.jpg",
        alt: "Gradient 2",
    },
    {
        src: "https://pub-8abee449136941f5b0a1cd2c014534e9.r2.dev/vault-listing-images/assets-images/h-13.jpg",
        alt: "Gradient 3",
    },
    {
        src: "https://pub-8abee449136941f5b0a1cd2c014534e9.r2.dev/vault-listing-images/assets-images/h-14.jpg",
        alt: "Gradient 4",
    },
    {
        src: "https://pub-8abee449136941f5b0a1cd2c014534e9.r2.dev/vault-listing-images/assets-images/h-15.jpg",
        alt: "Gradient 5",
    },
    {
        src: "https://pub-8abee449136941f5b0a1cd2c014534e9.r2.dev/vault-listing-images/assets-images/h-01.jpg",
        alt: "Gradient 6",
    },
    {
        src: "https://pub-8abee449136941f5b0a1cd2c014534e9.r2.dev/vault-listing-images/assets-images/h-02.jpg",
        alt: "Gradient 7",
    },
]

interface PhantomImage {
    src: string
    alt: string
}

function normalizeImages(images: any): PhantomImage[] {
    if (!Array.isArray(images) || images.length === 0) {
        return DEFAULT_IMAGES
    }

    const validImages = images
        .map((image: any, index: number) => {
            if (typeof image === "string") {
                return { src: image, alt: `Trail ${index + 1}` }
            }
            if (image?.src) {
                return { src: image.src, alt: image.alt || `Trail ${index + 1}` }
            }
            return null
        })
        .filter(Boolean) as PhantomImage[]

    return validImages.length > 0 ? validImages : DEFAULT_IMAGES
}

const STYLE_ID = "hpx-phantom-trail-styles"

const CSS = `
.hpx-pit-container {
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
}
.hpx-pit-image {
  pointer-events: none;
  position: absolute;
  left: 0;
  top: 0;
  max-width: none;
  height: 18vw;
  width: 17vw;
  border-radius: 0.7vw;
  object-fit: cover;
  opacity: 0;
  will-change: transform, opacity;
}
.hpx-pit-image.hpx-pit-rest {
  opacity: 1;
  will-change: auto;
}
@media (max-width: 1025px) {
  .hpx-pit-image {
    height: 24vh;
    width: 24vw;
    border-radius: 1.2vw;
  }
}
@media (max-width: 767.98px) {
  .hpx-pit-image {
    height: 38vw;
    width: 38vw;
    border-radius: 3vw;
  }
}
`

function injectStyles() {
    if (typeof document === "undefined") return
    let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null
    if (!styleEl) {
        styleEl = document.createElement("style")
        styleEl.id = STYLE_ID
        document.head.appendChild(styleEl)
    }
    if (styleEl.textContent !== CSS) {
        styleEl.textContent = CSS
    }
}

export interface HyperiuxPhantomImageTrailProps {
    images?: (string | { src: string; alt?: string })[]
    imageMultiplier?: number
    enableRotation?: boolean
    maxStartRotation?: number
    maxExitRotation?: number
    idleSpawn?: boolean
    idleDelay?: number
    idleDistanceThreshold?: number
    triggerDistance?: number
    cursorOffsetX?: number
    cursorOffsetY?: number
    popOutDuration?: number
    fadeOutDuration?: number
    idlePopOutMultiplier?: number
    idleFadeMultiplier?: number
    startScale?: number
    endScale?: number
    exitScale?: number
    smoothMouse?: boolean
    lerpFactor?: number
    disableOnMobile?: boolean
    enableMobileTap?: boolean
    popEase?: string
    idlePopEase?: string
    fadeEase?: string
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 900
 */
export default function HyperiuxPhantomImageTrail({
    images,
    imageMultiplier = 3,

    enableRotation = true,
    maxStartRotation = 35,
    maxExitRotation = 15,

    idleSpawn = true,
    idleDelay = 300,
    idleDistanceThreshold = DEFAULT_IDLE_DISTANCE_THRESHOLD,
    triggerDistance = DEFAULT_TRIGGER_DISTANCE_THRESHOLD,

    cursorOffsetX = -12,
    cursorOffsetY = -12,

    popOutDuration = 1,
    fadeOutDuration = 0.7,
    idlePopOutMultiplier = 1.8,
    idleFadeMultiplier = 1.5,

    startScale = 0.2,
    endScale = 1,
    exitScale = 0,

    smoothMouse = true,
    lerpFactor = 0.1,

    disableOnMobile = false,
    enableMobileTap = true,

    popEase = "expo.out",
    idlePopEase = "power1.out",
    fadeEase = "power4.inOut",

    style,
}: HyperiuxPhantomImageTrailProps) {
    const isStatic = useIsStaticRenderer()
    injectStyles()

    const minStartRotation = -maxStartRotation
    const minExitRotation = -maxExitRotation

    const prefersReducedMotion = usePrefersReducedMotion()
    // Canvas / export and reduced-motion users get the frozen trail; the
    // spawning loop, listeners and tweens never start.
    const showStatic = isStatic || prefersReducedMotion
    const resolvedImages = useMemo(() => normalizeImages(images), [images])

    const safeImageMultiplier = Math.max(1, Number(imageMultiplier) || 1)
    const totalImages = resolvedImages.length * safeImageMultiplier

    const imagesRef = useRef<(HTMLImageElement | null)[]>([])
    const containerRef = useRef<HTMLDivElement | null>(null)
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const isMobileRef = useRef(false)

    const mouse = useRef({ x: 0, y: 0 })
    const smoothedMouse = useRef({ x: 0, y: 0 })

    const lastTriggerPositionRef = useRef({ x: 0, y: 0 })
    const lastIdleSpawnPositionRef = useRef({
        x: OFFSCREEN_POSITION,
        y: OFFSCREEN_POSITION,
    })

    const zIndexRef = useRef(INITIAL_Z_INDEX)
    const imageIndexRef = useRef(0)

    useEffect(() => {
        imagesRef.current = imagesRef.current.slice(0, totalImages)
        imageIndexRef.current = totalImages ? imageIndexRef.current % totalImages : 0
        zIndexRef.current = INITIAL_Z_INDEX
    }, [totalImages, resolvedImages])

    const getMouseDistance = useCallback(() => {
        const currentMouse = mouse.current
        const lastTriggerPosition = lastTriggerPositionRef.current
        return Math.hypot(
            currentMouse.x - lastTriggerPosition.x,
            currentMouse.y - lastTriggerPosition.y
        )
    }, [])

    const getIdleDistance = useCallback(() => {
        const currentMouse = mouse.current
        const lastIdleSpawnPosition = lastIdleSpawnPositionRef.current
        return Math.hypot(
            currentMouse.x - lastIdleSpawnPosition.x,
            currentMouse.y - lastIdleSpawnPosition.y
        )
    }, [])

    const getCenteredPosition = useCallback(
        (width: number, height: number, useSmoothedMouse: boolean = false) => {
            const mouseSource = useSmoothedMouse ? smoothedMouse.current : mouse.current
            return {
                x: mouseSource.x - width / 2 + cursorOffsetX,
                y: mouseSource.y - height / 2 + cursorOffsetY,
            }
        },
        [cursorOffsetX, cursorOffsetY]
    )

    const showNextImage = useCallback(
        ({
            lockToCursor = false,
            isIdle = false,
            overridePosition = null,
        }: {
            lockToCursor?: boolean
            isIdle?: boolean
            overridePosition?: { x: number; y: number } | null
        } = {}) => {
            if (!totalImages) return

            const image = imagesRef.current[imageIndexRef.current]
            if (!image) return

            const width = image.offsetWidth
            const height = image.offsetHeight

            gsap.killTweensOf(image)

            const startRotation = enableRotation
                ? gsap.utils.random(minStartRotation, maxStartRotation)
                : 0
            const exitRotation = enableRotation
                ? gsap.utils.random(minExitRotation, maxExitRotation)
                : 0

            let startPosition: { x: number; y: number }
            let endPosition: { x: number; y: number }

            if (overridePosition) {
                startPosition = {
                    x: overridePosition.x - width / 2 + cursorOffsetX,
                    y: overridePosition.y - height / 2 + cursorOffsetY,
                }
                endPosition = startPosition
            } else {
                startPosition = lockToCursor
                    ? getCenteredPosition(width, height)
                    : getCenteredPosition(width, height, true)
                endPosition = getCenteredPosition(width, height)
            }

            const finalPopOutDuration = isIdle
                ? popOutDuration * idlePopOutMultiplier
                : popOutDuration
            const finalFadeOutDuration = isIdle
                ? fadeOutDuration * idleFadeMultiplier
                : fadeOutDuration

            gsap
                .timeline()
                .set(image, {
                    opacity: 1,
                    scale: startScale,
                    rotateZ: startRotation,
                    zIndex: zIndexRef.current,
                    x: startPosition.x,
                    y: startPosition.y,
                })
                .to(image, {
                    ease: isIdle ? idlePopEase : popEase,
                    rotateZ: 0,
                    opacity: 1,
                    scale: endScale,
                    duration: finalPopOutDuration,
                    x: endPosition.x,
                    y: endPosition.y,
                })
                .to(image, {
                    ease: fadeEase,
                    opacity: 0,
                    rotateZ: exitRotation,
                    duration: finalFadeOutDuration,
                    delay: -finalFadeOutDuration,
                    scale: exitScale,
                })

            zIndexRef.current += 1
            imageIndexRef.current = (imageIndexRef.current + 1) % totalImages
        },
        [
            totalImages,
            enableRotation,
            minStartRotation,
            maxStartRotation,
            minExitRotation,
            maxExitRotation,
            cursorOffsetX,
            cursorOffsetY,
            getCenteredPosition,
            popOutDuration,
            idlePopOutMultiplier,
            fadeOutDuration,
            idleFadeMultiplier,
            startScale,
            endScale,
            exitScale,
            idlePopEase,
            popEase,
            fadeEase,
        ]
    )

    const scheduleIdleSpawn = useCallback(
        function scheduleIdleSpawn() {
            if (!idleSpawn || (disableOnMobile && isMobileRef.current)) return

            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current)
            }

            idleTimerRef.current = setTimeout(() => {
                if (getIdleDistance() < idleDistanceThreshold) {
                    showNextImage({ lockToCursor: true, isIdle: true })
                }
                lastIdleSpawnPositionRef.current = { ...mouse.current }
                scheduleIdleSpawn()
            }, idleDelay)
        },
        [idleSpawn, disableOnMobile, getIdleDistance, idleDistanceThreshold, showNextImage, idleDelay]
    )

    const runAnimationLoop = useCallback(
        function runAnimationLoop() {
            if (disableOnMobile && isMobileRef.current) return
            if (isMobileRef.current) return

            if (getMouseDistance() > triggerDistance) {
                showNextImage()
                lastTriggerPositionRef.current = { ...mouse.current }
                lastIdleSpawnPositionRef.current = { ...mouse.current }
                if (idleSpawn) {
                    scheduleIdleSpawn()
                }
            }

            const allImagesInactive = imagesRef.current.every((image) => {
                return image && !gsap.isTweening(image) && image.style.opacity === "0"
            })

            if (allImagesInactive) {
                zIndexRef.current = INITIAL_Z_INDEX
            }
        },
        [disableOnMobile, getMouseDistance, triggerDistance, showNextImage, idleSpawn, scheduleIdleSpawn]
    )

    const onTap = useCallback(
        (event: React.MouseEvent | React.TouchEvent) => {
            if (!enableMobileTap || !isMobileRef.current) return
            const container = containerRef.current
            const rect = container?.getBoundingClientRect()
            const touch = (event as any).changedTouches?.[0] || event

            const tapPosition = {
                x: touch.clientX - (rect?.left ?? 0),
                y: touch.clientY - (rect?.top ?? 0),
            }

            showNextImage({ overridePosition: tapPosition })
        },
        [enableMobileTap, showNextImage]
    )

    useEffect(() => {
        if (showStatic) return

        const container = containerRef.current
        if (!container) return

        const updatePointerType = () => {
            isMobileRef.current =
                typeof window !== "undefined" &&
                window.matchMedia(MOBILE_POINTER_QUERY).matches
        }
        updatePointerType()

        const mediaQuery =
            typeof window !== "undefined" ? window.matchMedia(MOBILE_POINTER_QUERY) : null
        mediaQuery?.addEventListener?.("change", updatePointerType)

        const handleMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect()
            mouse.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            }
        }
        container.addEventListener("mousemove", handleMouseMove)

        const mouseLoop = createSuspendedRaf({
            root: container,
            onFrame: () => {
                const { x, y } = mouse.current
                if (smoothMouse) {
                    smoothedMouse.current.x = lerp(smoothedMouse.current.x, x, lerpFactor)
                    smoothedMouse.current.y = lerp(smoothedMouse.current.y, y, lerpFactor)
                } else {
                    smoothedMouse.current.x = x
                    smoothedMouse.current.y = y
                }
            },
        })
        mouseLoop.start()

        const loop = createSuspendedRaf({
            root: container,
            onFrame: runAnimationLoop,
        })
        loop.start()

        if (idleSpawn && !(disableOnMobile && isMobileRef.current)) {
            scheduleIdleSpawn()
        }

        return () => {
            loop.destroy()
            mouseLoop.destroy()
            container.removeEventListener("mousemove", handleMouseMove)

            if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current)
            }

            mediaQuery?.removeEventListener?.("change", updatePointerType)

            imagesRef.current.forEach((image) => {
                if (image) {
                    gsap.killTweensOf(image)
                }
            })
        }
    }, [showStatic, idleSpawn, disableOnMobile, runAnimationLoop, scheduleIdleSpawn, smoothMouse, lerpFactor])

    // Static renderer (canvas / export) and reduced motion: a frozen trail of
    // images at rest. No refs, no listeners, no RAF, no GSAP, and visibility
    // comes from a CSS class rather than a JS-applied style.
    if (showStatic) {
        return (
            <div className="hpx-pit-container" style={style}>
                {STATIC_TRAIL.map((pos, index) => {
                    const image = resolvedImages[index % resolvedImages.length]
                    return (
                        <img
                            key={`static-${index}`}
                            src={image.src}
                            alt={image.alt}
                            draggable={false}
                            className="hpx-pit-image hpx-pit-rest"
                            style={{
                                left: `${pos.left}%`,
                                top: `${pos.top}%`,
                                transform: `rotate(${enableRotation ? pos.rotate : 0}deg)`,
                                zIndex: index + 1,
                            }}
                        />
                    )
                })}
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            className="hpx-pit-container"
            style={style}
            onClick={onTap}
            onTouchStart={onTap}
        >
            {Array.from({ length: totalImages }).map((_, index) => {
                const baseImageIndex = index % resolvedImages.length
                const image = resolvedImages[baseImageIndex]

                return (
                    <img
                        key={`${image.src}-${index}`}
                        ref={(element) => {
                            if (element) imagesRef.current[index] = element
                        }}
                        src={image.src}
                        alt={image.alt}
                        draggable={false}
                        className="hpx-pit-image"
                    />
                )
            })}
        </div>
    )
}

HyperiuxPhantomImageTrail.defaultProps = {
    imageMultiplier: 3,
    enableRotation: true,
    maxStartRotation: 35,
    maxExitRotation: 15,
    idleSpawn: true,
    idleDelay: 300,
    idleDistanceThreshold: DEFAULT_IDLE_DISTANCE_THRESHOLD,
    triggerDistance: DEFAULT_TRIGGER_DISTANCE_THRESHOLD,
    cursorOffsetX: -12,
    cursorOffsetY: -12,
    popOutDuration: 1,
    fadeOutDuration: 0.7,
    idlePopOutMultiplier: 1.8,
    idleFadeMultiplier: 1.5,
    startScale: 0.2,
    endScale: 1,
    exitScale: 0,
    smoothMouse: true,
    lerpFactor: 0.1,
    disableOnMobile: false,
    enableMobileTap: true,
    popEase: "expo.out",
    idlePopEase: "power1.out",
    fadeEase: "power4.inOut",
}

addPropertyControls(HyperiuxPhantomImageTrail, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                alt: { type: ControlType.String, title: "Alt" },
            },
        },
    },
    imageMultiplier: {
        type: ControlType.Number,
        title: "Multiplier",
        min: 1,
        max: 8,
        step: 1,
        defaultValue: 3,
        description: "How many copies of the image set can be in flight.",
    },
    triggerDistance: {
        type: ControlType.Number,
        title: "Trigger Distance",
        min: 10,
        max: 400,
        step: 1,
        defaultValue: 100,
        description: "Distance the cursor must move before spawning a new image.",
    },
    smoothMouse: {
        type: ControlType.Boolean,
        title: "Smooth Mouse",
        defaultValue: true,
    },
    lerpFactor: {
        type: ControlType.Number,
        title: "Lerp Factor",
        min: 0.02,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.1,
    },
    popOutDuration: {
        type: ControlType.Number,
        title: "Pop-Out Duration",
        min: 0.1,
        max: 2.5,
        step: 0.05,
        defaultValue: 1,
    },
    fadeOutDuration: {
        type: ControlType.Number,
        title: "Fade-Out Duration",
        min: 0.1,
        max: 2.5,
        step: 0.05,
        defaultValue: 0.7,
    },
    popEase: {
        type: ControlType.Enum,
        title: "Pop Ease",
        options: ["expo.out", "power1.out", "power2.out", "power3.out", "power4.out", "back.out"],
        defaultValue: "expo.out",
    },
    fadeEase: {
        type: ControlType.Enum,
        title: "Fade Ease",
        options: ["power4.inOut", "power2.inOut", "power1.inOut", "expo.inOut", "sine.inOut"],
        defaultValue: "power4.inOut",
    },
    startScale: {
        type: ControlType.Number,
        title: "Start Scale",
        min: 0,
        max: 2,
        step: 0.05,
        defaultValue: 0.2,
    },
    endScale: {
        type: ControlType.Number,
        title: "End Scale",
        min: 0.2,
        max: 2,
        step: 0.05,
        defaultValue: 1,
    },
    exitScale: {
        type: ControlType.Number,
        title: "Exit Scale",
        min: 0,
        max: 1.5,
        step: 0.05,
        defaultValue: 0,
    },
    enableRotation: {
        type: ControlType.Boolean,
        title: "Rotation",
        defaultValue: true,
    },
    maxStartRotation: {
        type: ControlType.Number,
        title: "Start Tilt",
        min: 0,
        max: 90,
        step: 1,
        defaultValue: 35,
        hidden: (props: any) => !props.enableRotation,
    },
    maxExitRotation: {
        type: ControlType.Number,
        title: "Exit Tilt",
        min: 0,
        max: 90,
        step: 1,
        defaultValue: 15,
        hidden: (props: any) => !props.enableRotation,
    },
    idleSpawn: {
        type: ControlType.Boolean,
        title: "Idle Spawn",
        defaultValue: true,
        description: "Spawns images while the cursor rests.",
    },
    idleDelay: {
        type: ControlType.Number,
        title: "Idle Delay",
        min: 0,
        max: 2000,
        step: 10,
        defaultValue: 300,
        hidden: (props: any) => !props.idleSpawn,
    },
    idlePopOutMultiplier: {
        type: ControlType.Number,
        title: "Idle Pop Mult.",
        min: 0.5,
        max: 4,
        step: 0.1,
        defaultValue: 1.8,
        hidden: (props: any) => !props.idleSpawn,
    },
    idleFadeMultiplier: {
        type: ControlType.Number,
        title: "Idle Fade Mult.",
        min: 0.5,
        max: 4,
        step: 0.1,
        defaultValue: 1.5,
        hidden: (props: any) => !props.idleSpawn,
    },
    disableOnMobile: {
        type: ControlType.Boolean,
        title: "Disable On Mobile",
        defaultValue: false,
    },
    enableMobileTap: {
        type: ControlType.Boolean,
        title: "Mobile Tap",
        defaultValue: true,
    },
})
