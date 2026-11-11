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

import { useReducedMotion } from "framer-motion"

// User request: Update infinite_3d_carousel in place to a centered overlapping 3D coverflow-style infinite draggable carousel matching the provided visual direction, preserving inertial drag/loop/autoplay/reduced-motion, keeping existing editable content controls, and avoiding heart-related UI.

interface CarouselItem {
    imageUrl: {
        src: string
        srcSet?: string
        alt?: string
    }
    link?: string
}

interface MyComponentProps {
    items: CarouselItem[]
    cardWidth: number
    cardHeight: number
    radius: number
    background: string
    blurAmount: number
    dragSensitivity: number
    autoPlay: boolean
    autoPlaySpeed: number
    autoPlayDirection: "Forward" | "Backward"
    perspective: number
    sideRotation: number
    sideTilt: number
    overlap: number
}

const FALLBACK_ITEMS: CarouselItem[] = [
    {
        imageUrl: {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Carousel image 1",
        },
    },
    {
        imageUrl: {
            src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            alt: "Carousel image 2",
        },
    },
    {
        imageUrl: {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Carousel image 3",
        },
    },
    {
        imageUrl: {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Carousel image 4",
        },
    },
]

function toSignedWrap(value: number, cycle: number): number {
    if (cycle <= 0) return 0
    const wrapped = ((((value + cycle / 2) % cycle) + cycle) % cycle) - cycle / 2
    return wrapped
}

function smoothstep(edge0: number, edge1: number, x: number): number {
    if (edge0 === edge1) return x < edge0 ? 0 : 1
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
    return t * t * (3 - 2 * t)
}

function useSafeInView(ref: React.RefObject<Element | null>, options?: IntersectionObserverInit) {
    const [isInView, setIsInView] = React.useState(true)

    React.useEffect(() => {
        if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
            return
        }
        const el = ref.current
        if (!el) return

        const observer = new IntersectionObserver(([entry]) => {
            setIsInView(entry.isIntersecting)
        }, options)

        observer.observe(el)
        return () => observer.disconnect()
    }, [ref, options])

    return isInView
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function Infinite_3d_Carousel(props: MyComponentProps) {
    const {
        items = FALLBACK_ITEMS,
        cardWidth = 430,
        cardHeight = 440,
        radius = 20,
        background = "#FFFFFF",
        blurAmount = 8,
        dragSensitivity = 1,
        autoPlay = true,
        autoPlaySpeed = 28,
        autoPlayDirection = "Forward",
        perspective = 1800,
        sideRotation = 14,
        sideTilt = 6,
        overlap = 300,
    } = props

    const isStaticRenderer = useIsStaticRenderer()
    const trackRef = React.useRef<HTMLDivElement | null>(null)
    const isInView = useSafeInView(trackRef, { threshold: 0.2 })
    const prefersReducedMotion = useReducedMotion()
    const pointerActiveRef = React.useRef(false)
    const pointerIdRef = React.useRef<number | null>(null)
    const lastXRef = React.useRef(0)
    const dragMovedRef = React.useRef(false)
    const lastPointerTimeRef = React.useRef(0)
    const lastFrameTimeRef = React.useRef(0)
    const velocityRef = React.useRef(0)
    const renderedVelocityRef = React.useRef(0)
    const targetOffsetRef = React.useRef(0)
    const renderedOffsetRef = React.useRef(0)
    const rafRef = React.useRef<number | null>(null)
    const stepRef = React.useRef<(time: number) => void>(() => {})
    const cardRefs = React.useRef<Array<HTMLElement | null>>([])
    const imageRefs = React.useRef<Array<HTMLImageElement | null>>([])
    const imageAssignmentCacheRef = React.useRef<
        Array<{
            itemIndex: number
            src: string
            srcSet: string
            alt: string
            link: string
        } | null>
    >([null, null, null, null, null])

    const safeItems = React.useMemo(() => {
        return items.length > 0 ? items : FALLBACK_ITEMS
    }, [items])

    const cardStep = React.useMemo(() => {
        return Math.max(70, cardWidth - overlap)
    }, [cardWidth, overlap])

    const cycle = React.useMemo(() => {
        return safeItems.length * cardStep
    }, [safeItems.length, cardStep])

    const shouldAnimateRef = React.useRef(false)
    const maxMomentumVelocity = React.useMemo(() => {
        return Math.max(1400, cardStep * 14)
    }, [cardStep])
    const autoPlayDirectionFactor = React.useMemo(() => {
        return autoPlayDirection === "Backward" ? 1 : -1
    }, [autoPlayDirection])

    const applyFrameStyles = React.useCallback(
        (rendered: number) => {
            if (safeItems.length === 0) return
            const signed = toSignedWrap(rendered, cycle)
            const activeFloatIndex = -signed / cardStep
            const nearestCenter = Math.round(activeFloatIndex)

            for (let slot = 0; slot < 5; slot++) {
                const cardEl = cardRefs.current[slot]
                const imageEl = imageRefs.current[slot]
                if (!cardEl || !imageEl) continue

                const virtualIndex = nearestCenter + (slot - 2)
                const wrappedItemIndex =
                    ((virtualIndex % safeItems.length) + safeItems.length) % safeItems.length
                const item = safeItems[wrappedItemIndex]
                const rawDistance = virtualIndex - activeFloatIndex
                const absDistance = Math.abs(rawDistance)
                const clampedDistance = Math.min(absDistance, 2.25)
                const direction = rawDistance === 0 ? 0 : rawDistance > 0 ? 1 : -1
                const eased = Math.min(1, clampedDistance / 2)
                const depthEase = Math.pow(eased, 0.9)
                const translateX = rawDistance * cardStep
                const rotateY = -direction * depthEase * sideRotation
                const rotateZ = direction * depthEase * sideTilt
                const scale = 1 - depthEase * 0.24
                const translateZ = 110 - depthEase * 160
                const zIndex = 1000 - Math.round(clampedDistance * 100)
                const fadeStartDistance = 1.35
                const fadeEndDistance = 2.85
                const edgeOpacity = Math.max(
                    0,
                    Math.min(1, 1 - smoothstep(fadeStartDistance, fadeEndDistance, absDistance))
                )
                const blurDepth = smoothstep(0.35, 2.25, absDistance)
                const blurPx = blurAmount <= 0 ? 0 : blurAmount * blurDepth
                const shadowEase = smoothstep(0, 1.5, absDistance)
                const shadowYOffset = 20 - shadowEase * 8
                const shadowBlur = 40 - shadowEase * 12
                const shadowAlpha = 0.16 - shadowEase * 0.05

                cardEl.style.zIndex = String(zIndex)
                cardEl.style.opacity = String(edgeOpacity)
                cardEl.style.transform = `translate3d(calc(-50% + ${translateX}px), -50%, ${translateZ}px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`
                cardEl.style.filter = blurPx > 0 ? `blur(${blurPx}px)` : "none"
                cardEl.style.boxShadow = `0 ${shadowYOffset}px ${shadowBlur}px rgba(0, 0, 0, ${Math.max(
                    0.08,
                    shadowAlpha
                )})`

                const fallback = FALLBACK_ITEMS[wrappedItemIndex % FALLBACK_ITEMS.length].imageUrl
                const nextSrc = item.imageUrl?.src || fallback.src
                const nextSrcSet = item.imageUrl?.srcSet || ""
                const nextAlt = item.imageUrl?.alt || `Carousel image ${wrappedItemIndex + 1}`
                const nextLink = typeof item.link === "string" ? item.link.trim() : ""
                const cached = imageAssignmentCacheRef.current[slot]
                const changed =
                    !cached ||
                    cached.itemIndex !== wrappedItemIndex ||
                    cached.src !== nextSrc ||
                    cached.srcSet !== nextSrcSet ||
                    cached.alt !== nextAlt ||
                    cached.link !== nextLink

                if (changed) {
                    imageEl.src = nextSrc
                    imageEl.srcset = nextSrcSet
                    imageEl.alt = nextAlt
                    imageAssignmentCacheRef.current[slot] = {
                        itemIndex: wrappedItemIndex,
                        src: nextSrc,
                        srcSet: nextSrcSet,
                        alt: nextAlt,
                        link: nextLink,
                    }
                }

                const anchorEl = cardEl as HTMLAnchorElement
                if (nextLink) {
                    anchorEl.href = nextLink
                    anchorEl.setAttribute("aria-label", `Open link for ${nextAlt}`)
                    anchorEl.removeAttribute("tabindex")
                } else {
                    anchorEl.removeAttribute("href")
                    anchorEl.removeAttribute("aria-label")
                    anchorEl.setAttribute("tabindex", "-1")
                }
            }
        },
        [blurAmount, cardStep, cycle, safeItems, sideRotation, sideTilt]
    )

    const requestAnimationIfNeeded = React.useCallback(() => {
        if (typeof window === "undefined") return
        if (isStaticRenderer) return
        if (rafRef.current !== null) return
        if (!shouldAnimateRef.current) return
        lastFrameTimeRef.current = 0
        rafRef.current = window.requestAnimationFrame(stepRef.current)
    }, [isStaticRenderer])

    const step = React.useCallback(
        (time: number) => {
            if (isStaticRenderer) {
                if (typeof window !== "undefined" && rafRef.current !== null) {
                    window.cancelAnimationFrame(rafRef.current)
                }
                rafRef.current = null
                shouldAnimateRef.current = false
                renderedVelocityRef.current = 0
                return
            }
            rafRef.current = null
            const previousTime = lastFrameTimeRef.current
            const dt =
                previousTime > 0
                    ? Math.min(Math.max((time - previousTime) / 1000, 1 / 240), 1 / 30)
                    : 1 / 60
            lastFrameTimeRef.current = time

            let target = targetOffsetRef.current
            let rendered = renderedOffsetRef.current
            let renderedVelocity = renderedVelocityRef.current

            if (prefersReducedMotion) {
                velocityRef.current = 0
                renderedVelocity = 0
                rendered = target
            } else {
                if (!isStaticRenderer && isInView && autoPlay) {
                    target += autoPlayDirectionFactor * autoPlaySpeed * dt
                }

                target += velocityRef.current * dt
                velocityRef.current *= Math.pow(0.94, dt * 60)
                if (Math.abs(velocityRef.current) < 0.2) velocityRef.current = 0

                const springStiffness = pointerActiveRef.current ? 240 : 170
                const springDamping = pointerActiveRef.current ? 30 : 24
                const displacement = target - rendered
                const acceleration = displacement * springStiffness - renderedVelocity * springDamping
                renderedVelocity += acceleration * dt
                rendered += renderedVelocity * dt
            }

            targetOffsetRef.current = target
            renderedOffsetRef.current = rendered
            renderedVelocityRef.current = renderedVelocity
            applyFrameStyles(rendered)

            const remainingDisplacement = Math.abs(targetOffsetRef.current - renderedOffsetRef.current)
            const remainingRenderedVelocity = Math.abs(renderedVelocityRef.current)
            const shouldContinue =
                !isStaticRenderer &&
                isInView &&
                (!prefersReducedMotion ||
                    pointerActiveRef.current ||
                    remainingDisplacement > 0.015 ||
                    remainingRenderedVelocity > 0.015 ||
                    Math.abs(velocityRef.current) > 0.015)

            shouldAnimateRef.current = shouldContinue

            if (shouldContinue && typeof window !== "undefined") {
                rafRef.current = window.requestAnimationFrame(step)
            }
        },
        [
            applyFrameStyles,
            autoPlay,
            autoPlayDirectionFactor,
            autoPlaySpeed,
            isInView,
            isStaticRenderer,
            prefersReducedMotion,
        ]
    )

    React.useEffect(() => {
        stepRef.current = step
    }, [step])

    React.useEffect(() => {
        applyFrameStyles(renderedOffsetRef.current)
    }, [applyFrameStyles])

    React.useEffect(() => {
        const shouldStart = !isStaticRenderer && isInView && !prefersReducedMotion && autoPlay
        shouldAnimateRef.current = shouldStart
        if (shouldStart) {
            requestAnimationIfNeeded()
        } else if (rafRef.current !== null && typeof window !== "undefined") {
            window.cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
        return () => {
            if (rafRef.current !== null && typeof window !== "undefined") {
                window.cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
        }
    }, [autoPlay, isInView, isStaticRenderer, prefersReducedMotion, requestAnimationIfNeeded])

    const endPointerInteraction = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (pointerIdRef.current !== event.pointerId) return
            event.preventDefault()
            pointerActiveRef.current = false
            const target = event.currentTarget
            if (
                typeof target.hasPointerCapture === "function" &&
                typeof target.releasePointerCapture === "function" &&
                target.hasPointerCapture(event.pointerId)
            ) {
                target.releasePointerCapture(event.pointerId)
            } else if (typeof target.releasePointerCapture === "function") {
                target.releasePointerCapture(event.pointerId)
            }
            pointerIdRef.current = null

            if (isStaticRenderer) {
                return
            }
            if (prefersReducedMotion) {
                renderedOffsetRef.current = targetOffsetRef.current
                renderedVelocityRef.current = 0
                applyFrameStyles(renderedOffsetRef.current)
            } else {
                shouldAnimateRef.current = true
                requestAnimationIfNeeded()
            }
        },
        [applyFrameStyles, isStaticRenderer, prefersReducedMotion, requestAnimationIfNeeded]
    )

    const onPointerDown = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        event.preventDefault()
        if (isStaticRenderer) return
        pointerActiveRef.current = true
        pointerIdRef.current = event.pointerId
        dragMovedRef.current = false
        lastXRef.current = event.clientX
        lastPointerTimeRef.current = event.timeStamp
        targetOffsetRef.current = renderedOffsetRef.current
        velocityRef.current = 0
        renderedVelocityRef.current = 0
        event.currentTarget.setPointerCapture(event.pointerId)
        shouldAnimateRef.current = true
        requestAnimationIfNeeded()
    }, [isStaticRenderer, requestAnimationIfNeeded])

    const onPointerMove = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (!pointerActiveRef.current || pointerIdRef.current !== event.pointerId) return
            event.preventDefault()
            if (isStaticRenderer) return
            const dx = event.clientX - lastXRef.current
            if (!dragMovedRef.current && Math.abs(dx) > 3) {
                dragMovedRef.current = true
            }
            const dt = Math.max((event.timeStamp - lastPointerTimeRef.current) / 1000, 0.001)
            lastXRef.current = event.clientX
            lastPointerTimeRef.current = event.timeStamp

            const scaledDx = dx * dragSensitivity
            const next = targetOffsetRef.current + scaledDx
            targetOffsetRef.current = next
            if (prefersReducedMotion) {
                velocityRef.current = 0
                renderedOffsetRef.current = next
                applyFrameStyles(next)
            } else {
                const instantaneousVelocity = scaledDx / dt
                const clampedVelocity = Math.max(
                    -maxMomentumVelocity,
                    Math.min(maxMomentumVelocity, instantaneousVelocity)
                )
                const smoothing = 1 - Math.exp(-20 * dt)
                velocityRef.current =
                    velocityRef.current +
                    (clampedVelocity - velocityRef.current) * smoothing
            }
        },
        [applyFrameStyles, dragSensitivity, isStaticRenderer, maxMomentumVelocity, prefersReducedMotion]
    )

    const onKeyDown = React.useCallback(
        (event: React.KeyboardEvent<HTMLElement>) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
            event.preventDefault()
            if (isStaticRenderer) return
            const direction = event.key === "ArrowRight" ? -1 : 1
            const nextTarget = targetOffsetRef.current + direction * cardStep
            targetOffsetRef.current = nextTarget
            if (prefersReducedMotion) {
                renderedOffsetRef.current = nextTarget
                velocityRef.current = 0
                applyFrameStyles(nextTarget)
            } else {
                shouldAnimateRef.current = true
                requestAnimationIfNeeded()
            }
        },
        [applyFrameStyles, cardStep, isStaticRenderer, prefersReducedMotion, requestAnimationIfNeeded]
    )

    const onPointerUp = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            endPointerInteraction(event)
        },
        [endPointerInteraction]
    )

    const onPointerCancel = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (pointerIdRef.current === event.pointerId) {
                endPointerInteraction(event)
            }
        },
        [endPointerInteraction]
    )

    const onPointerLeave = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (pointerActiveRef.current && pointerIdRef.current === event.pointerId) {
                endPointerInteraction(event)
            }
        },
        [endPointerInteraction]
    )

    const onClickCapture = React.useCallback(
        (event: React.MouseEvent<HTMLElement>) => {
            if (dragMovedRef.current) {
                dragMovedRef.current = false
                event.preventDefault()
                event.stopPropagation()
                return
            }
        },
        []
    )

    React.useEffect(() => {
        if (safeItems.length > 0) return
        for (let i = 0; i < imageAssignmentCacheRef.current.length; i++) {
            imageAssignmentCacheRef.current[i] = null
        }
    }, [safeItems.length])

    return (
        <section
            ref={trackRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background,
                touchAction: "pan-y",
                userSelect: "none",
                WebkitUserSelect: "none",
                WebkitTapHighlightColor: "transparent",
                fontFamily:
                    "Satoshi, Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onPointerLeave={onPointerLeave}
            onClickCapture={onClickCapture}
            onKeyDown={onKeyDown}
            tabIndex={0}
            role="region"
            aria-label="Infinite draggable carousel"
            aria-roledescription="carousel"
        >
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        perspective: `${perspective}px`,
                        transformStyle: "preserve-3d",
                    }}
                >
                    {[...Array(5)].map((_, slot) => {
                        const nearestCenter = 0
                        const virtualIndex = nearestCenter + (slot - 2)
                        const wrappedItemIndex =
                            ((virtualIndex % safeItems.length) + safeItems.length) % safeItems.length
                        const item = safeItems[wrappedItemIndex]
                        const rawDistance = virtualIndex
                        const absDistance = Math.abs(rawDistance)
                        const clampedDistance = Math.min(absDistance, 2.25)
                        const direction = rawDistance === 0 ? 0 : rawDistance > 0 ? 1 : -1
                        const eased = Math.min(1, clampedDistance / 2)
                        const depthEase = Math.pow(eased, 0.9)
                        const translateX = rawDistance * cardStep
                        const rotateY = -direction * depthEase * sideRotation
                        const rotateZ = direction * depthEase * sideTilt
                        const scale = 1 - depthEase * 0.24
                        const translateZ = 110 - depthEase * 160
                        const zIndex = 1000 - Math.round(clampedDistance * 100)
                        const fadeStartDistance = 2.0
                        const fadeEndDistance = 2.45
                        const edgeOpacity = 1 - smoothstep(fadeStartDistance, fadeEndDistance, absDistance)
                        const blurDepth = smoothstep(0.35, 2.25, absDistance)
                        const blurPx = blurAmount <= 0 ? 0 : blurAmount * blurDepth

                        const cardStyle: React.CSSProperties = {
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: `${cardWidth}px`,
                            minWidth: `${cardWidth}px`,
                            height: `${cardHeight}px`,
                            borderRadius: `${radius}px`,
                            overflow: "hidden",
                            background: "#FFFFFF",
                            boxShadow:
                                absDistance < 0.15
                                    ? "0 20px 40px rgba(0, 0, 0, 0.16)"
                                    : "0 12px 28px rgba(0, 0, 0, 0.11)",
                            display: "flex",
                            flexDirection: "column",
                            zIndex,
                            opacity: edgeOpacity,
                            filter: blurPx > 0 ? `blur(${blurPx}px)` : "none",
                            transformStyle: "preserve-3d",
                            transform: `translate3d(calc(-50% + ${translateX}px), -50%, ${translateZ}px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
                            willChange: "transform, filter",
                            userSelect: "none",
                            WebkitUserSelect: "none",
                        }
                        const imageAlt =
                            item.imageUrl?.alt || `Carousel image ${wrappedItemIndex + 1}`
                        const imageNode = (
                            <img
                                ref={(el) => {
                                    imageRefs.current[slot] = el
                                }}
                                src={
                                    item.imageUrl?.src ||
                                    FALLBACK_ITEMS[
                                        wrappedItemIndex % FALLBACK_ITEMS.length
                                    ].imageUrl.src
                                }
                                srcSet={item.imageUrl?.srcSet}
                                alt={imageAlt}
                                loading="eager"
                                decoding="async"
                                draggable={false}
                                onDragStart={(event) => event.preventDefault()}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                    pointerEvents: "none",
                                    userSelect: "none",
                                    WebkitUserSelect: "none",
                                }}
                            />
                        )
                        const linkHref =
                            typeof item.link === "string" ? item.link.trim() : ""
                        const card = (
                            <a
                                ref={(el) => {
                                    cardRefs.current[slot] = el
                                }}
                                href={linkHref || undefined}
                                aria-label={
                                    linkHref ? `Open link for ${imageAlt}` : undefined
                                }
                                tabIndex={linkHref ? undefined : -1}
                                draggable={false}
                                onDragStart={(event) => event.preventDefault()}
                                style={{
                                    ...cardStyle,
                                    textDecoration: "none",
                                    color: "inherit",
                                }}
                            >
                                {imageNode}
                            </a>
                        )

                        return <div key={`slot-${slot}`}>{card}</div>
                    })}
                </div>
            </div>
        </section>
    )
}

addPropertyControls(Infinite_3d_Carousel, {
    items: {
        type: ControlType.Array,
        title: "Items",
        defaultValue: FALLBACK_ITEMS,
        control: {
            type: ControlType.Object,
            controls: {
                imageUrl: { type: ControlType.ResponsiveImage },
                link: { type: ControlType.Link, title: "Link" },
            },
            defaultValue: FALLBACK_ITEMS,
        },
    },
    cardWidth: { type: ControlType.Number, defaultValue: 430, min: 220, max: 720, step: 1, unit: "px" },
    cardHeight: { type: ControlType.Number, defaultValue: 440, min: 220, max: 760, step: 1, unit: "px" },
    radius: { type: ControlType.Number, defaultValue: 20, min: 0, max: 60, step: 1, unit: "px" },
    background: { type: ControlType.Color, defaultValue: "#FFFFFF" },
    blurAmount: { type: ControlType.Number, title: "Blur", defaultValue: 8, min: 0, max: 32, step: 0.5 },
    dragSensitivity: { type: ControlType.Number, defaultValue: 1, min: 0.2, max: 2.5, step: 0.05 },
    autoPlay: { type: ControlType.Boolean, defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    autoPlaySpeed: { type: ControlType.Number, defaultValue: 28, min: 0, max: 180, step: 1 },
    autoPlayDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["Forward", "Backward"],
        optionTitles: ["Forward", "Backward"],
        defaultValue: "Forward",
    },
    perspective: { type: ControlType.Number, defaultValue: 1800, min: 800, max: 3200, step: 10 },
    sideRotation: { type: ControlType.Number, defaultValue: 14, min: 0, max: 30, step: 1, unit: "deg" },
    sideTilt: { type: ControlType.Number, defaultValue: 6, min: 0, max: 16, step: 1, unit: "deg" },
    overlap: { type: ControlType.Number, defaultValue: 300, min: 120, max: 420, step: 1, unit: "px" },
})