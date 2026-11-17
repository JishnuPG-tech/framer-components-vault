// Instructions: Create a Framer component that follows the Framer component rules and achieves the user's goal.
// Goal: A “DVD-style” bouncing image animation. It allows users to customize the image, its bouncing speed, border radius, size, and shadow. The image bounces within its parent container, adapting to its dimensions.

import type { CSSProperties } from "react"
import { startTransition, useEffect, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView } from "framer-motion"

type ResponsiveImage = {
    src: string
    srcSet?: string
    alt?: string
}

type FitMode = "cover" | "contain"

interface DVDBounceImageProps {
    images?: ResponsiveImage[]
    imageSeconds: number
    speed: number
    size: number // px
    showTrail: boolean
    borderRadius: string
    shadow: string
    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 260
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function DVDBounceImage(props: DVDBounceImageProps) {
    const {
        images = [
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Bouncing image 1",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Bouncing image 2",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Bouncing image 3",
            },
        ],
        imageSeconds,
        speed,
        size,
        showTrail = true,
        borderRadius,
        shadow,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement | null>(null)
    const itemRef = useRef<HTMLDivElement | null>(null)
    const trailRefs = useRef<Array<HTMLDivElement | null>>([])
    const positionHistoryRef = useRef<Array<{ x: number; y: number }>>([])

    const inView = useInView(containerRef, { amount: 0.05 })

    const safeImages = useMemo(() => {
        const list = Array.isArray(images) ? images.filter((img) => !!img?.src) : []
        return list.length > 0
            ? list
            : [
                  {
                      src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                      alt: "Bouncing image",
                  },
              ]
    }, [images])

    const [activeIndex, setActiveIndex] = useState(0)
    const [previousIndex, setPreviousIndex] = useState<number | null>(null)
    const [transitionId, setTransitionId] = useState(0)

    const prefersReducedMotion = useMemo(() => {
        if (typeof window === "undefined") return true
        return !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
    }, [])

    useEffect(() => {
        if (isStatic) return
        if (!inView) return
        if (prefersReducedMotion) return
        if (typeof window === "undefined") return
        if (safeImages.length <= 1) return

        const intervalMs = Math.max(0.2, imageSeconds) * 1000
        const fadeMs = 450

        let timeoutId: number | null = null

        const id = window.setInterval(() => {
            startTransition(() => {
                setActiveIndex((current) => {
                    setPreviousIndex(current)
                    const next = (current + 1) % safeImages.length
                    return next
                })
                setTransitionId((v) => v + 1)
            })

            if (timeoutId !== null) window.clearTimeout(timeoutId)
            timeoutId = window.setTimeout(() => {
                startTransition(() => {
                    setPreviousIndex(null)
                })
            }, fadeMs)
        }, intervalMs)

        return () => {
            window.clearInterval(id)
            if (timeoutId !== null) window.clearTimeout(timeoutId)
        }
    }, [imageSeconds, inView, isStatic, prefersReducedMotion, safeImages.length])

    useEffect(() => {
        if (isStatic) return
        if (!inView) return
        if (prefersReducedMotion) return
        if (typeof window === "undefined") return

        const container = containerRef.current
        const item = itemRef.current
        if (!container || !item) return

        let rafId = 0
        let lastT = performance.now()

        const state = {
            x: 0,
            y: 0,
            vx: 1,
            vy: 1,
            cw: 0,
            ch: 0,
        }

        const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

        const measure = () => {
            const rect = container.getBoundingClientRect()
            const cw = rect.width
            const ch = rect.height

            state.cw = cw
            state.ch = ch

            const maxX = Math.max(0, cw - size)
            const maxY = Math.max(0, ch - size)

            // Initialize position once, using current dimensions.
            if (state.x === 0 && state.y === 0) {
                state.x = Math.random() * maxX
                state.y = Math.random() * maxY
                state.vx = Math.random() < 0.5 ? 1 : -1
                state.vy = Math.random() < 0.5 ? 1 : -1
            } else {
                state.x = clamp(state.x, 0, maxX)
                state.y = clamp(state.y, 0, maxY)
            }

            // Reset history so the trail doesn't jump after resizes.
            positionHistoryRef.current = [{ x: state.x, y: state.y }]
        }

        measure()

        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => {
                measure()
            })
            ro.observe(container)
        } else {
            const onResize = () => measure()
            window.addEventListener("resize", onResize)
            ;(ro as any) = { disconnect: () => window.removeEventListener("resize", onResize) }
        }

        const tick = (t: number) => {
            const dt = Math.min(0.05, Math.max(0, (t - lastT) / 1000))
            lastT = t

            const maxX = Math.max(0, state.cw - size)
            const maxY = Math.max(0, state.ch - size)

            const baseSpeed = 120
            const distance = speed * baseSpeed * dt

            state.x += state.vx * distance
            state.y += state.vy * distance

            if (state.x <= 0) {
                state.x = 0
                state.vx = 1
            } else if (state.x >= maxX) {
                state.x = maxX
                state.vx = -1
            }

            if (state.y <= 0) {
                state.y = 0
                state.vy = 1
            } else if (state.y >= maxY) {
                state.y = maxY
                state.vy = -1
            }

            const transform = `translate3d(${state.x}px, ${state.y}px, 0)`

            if (itemRef.current) {
                itemRef.current.style.transform = transform
            }

            // Motion trail
            const history = positionHistoryRef.current
            history.unshift({ x: state.x, y: state.y })
            const maxHistory = 80
            if (history.length > maxHistory) history.length = maxHistory

            const count = Math.max(0, Math.min(4, Math.floor(showTrail ? 3 : 0)))
            const lagFrames = 3

            for (let i = 0; i < count; i++) {
                const idx = Math.min(history.length - 1, (i + 1) * lagFrames)
                const p = history[idx] || history[history.length - 1] || { x: state.x, y: state.y }
                const el = trailRefs.current[i]
                if (el) el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`
            }

            rafId = window.requestAnimationFrame(tick)
        }

        rafId = window.requestAnimationFrame(tick)

        return () => {
            if (ro) ro.disconnect()
            if (typeof window !== "undefined") window.cancelAnimationFrame(rafId)
        }
    }, [inView, isStatic, prefersReducedMotion, speed, size, showTrail])

    // Static renderer / reduced motion: centered preview
    const staticTransform =
        isStatic || prefersReducedMotion ? "translate3d(calc(50% - 0.5 * var(--dvd-size)), calc(50% - 0.5 * var(--dvd-size)), 0)" : undefined

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                userSelect: "none",
                WebkitUserSelect: "none",
                touchAction: "none",
                ["--dvd-size" as any]: `${Math.max(1, size)}px`,
            }}
            aria-label="Bouncing image"
            role="img"
        >
            {!isStatic && !prefersReducedMotion && Math.max(0, Math.min(4, Math.floor(showTrail ? 3 : 0))) > 0 &&
                Array.from({ length: Math.max(0, Math.min(4, Math.floor(showTrail ? 3 : 0))) }).map((_, i) => {
                    const count = Math.max(1, Math.min(4, Math.floor(showTrail ? 3 : 0)))
                    const opacity = 0.35 * Math.pow((count - i) / (count + 1), 1.2)
                    return (
                        <div
                            key={`trail-${i}`}
                            ref={(el) => {
                                trailRefs.current[i] = el
                            }}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: Math.max(1, size),
                                height: Math.max(1, size),
                                borderRadius,
                                overflow: "hidden",
                                boxShadow: shadow,
                                opacity,
                                pointerEvents: "none",
                                willChange: "transform",
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                transform: staticTransform,
                                zIndex: 0,
                            }}
                            aria-hidden="true"
                        >
                            <img
                                src={safeImages[activeIndex]?.src}
                                srcSet={safeImages[activeIndex]?.srcSet}
                                alt=""
                                draggable={false}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                    pointerEvents: "none",
                                }}
                            />
                        </div>
                    )
                })}
            <div
                ref={itemRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: Math.max(1, size),
                    height: Math.max(1, size),
                    borderRadius,
                    overflow: "hidden",
                    boxShadow: shadow,
                    transform: staticTransform,
                    willChange: isStatic || prefersReducedMotion ? undefined : "transform",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    zIndex: 1,
                }}
            >
                <style
                    // Keyed animations ensure the fade runs reliably across React batching.
                    dangerouslySetInnerHTML={{
                        __html: `@keyframes dvdFadeIn{from{opacity:0}to{opacity:1}}@keyframes dvdFadeOut{from{opacity:1}to{opacity:0}}`,
                    }}
                />
                {previousIndex !== null && !prefersReducedMotion && !isStatic && (
                    <img
                        key={`prev-${previousIndex}-${transitionId}`}
                        src={safeImages[previousIndex]?.src}
                        srcSet={safeImages[previousIndex]?.srcSet}
                        alt={safeImages[previousIndex]?.alt ?? ""}
                        draggable={false}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            pointerEvents: "none",
                            opacity: 1,
                            animation: "dvdFadeOut 450ms ease forwards",
                        }}
                    />
                )}
                <img
                    key={`active-${activeIndex}-${transitionId}`}
                    src={safeImages[activeIndex]?.src}
                    srcSet={safeImages[activeIndex]?.srcSet}
                    alt={safeImages[activeIndex]?.alt ?? ""}
                    draggable={false}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        pointerEvents: "none",
                        opacity: 1,
                        animation:
                            prefersReducedMotion || isStatic || previousIndex === null
                                ? undefined
                                : "dvdFadeIn 450ms ease forwards",
                    }}
                />
            </div>
        </div>
    )
}

addPropertyControls(DVDBounceImage, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.ResponsiveImage },
        maxCount: 10,
        defaultValue: [
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Bouncing image 1",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Bouncing image 2",
            },
        ],
    },
    imageSeconds: {
        type: ControlType.Number,
        title: "Image Sec",
        defaultValue: 2,
        min: 0.2,
        max: 30,
        step: 0.1,
        unit: "s",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.1,
        max: 10,
        step: 0.1,
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 96,
        min: 8,
        max: 600,
        step: 1,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "16px",
    },
    shadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
        defaultValue: "0 10px 30px rgba(0,0,0,0.18)",
    },
    showTrail: {
        type: ControlType.Boolean,
        title: "Trail",
        description:
            "Add it to the card container using absolute position, place it on top, and set pointer to none so it doesn’t block the content.",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
})