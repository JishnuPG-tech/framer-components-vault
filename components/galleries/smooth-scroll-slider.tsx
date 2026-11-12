// Smooth Scroll Slider — Originkit
// Marketplace-safe: no runtime/CDN imports, static-renderer aware, idle-stopping rAF.

import { useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type ImageValue = string | { src?: string; srcSet?: string; alt?: string } | null | undefined

type ImageInput = ImageValue | { image?: ImageValue; offsetY?: number }

interface Slide {
    src: string | null
    srcSet?: string
    alt: string
    offsetY: number
}

interface SmoothScrollSliderProps {
    images?: ImageInput[]
    slideWidth?: number
    slideHeight?: number
    spacing?: number
    direction?: "right" | "left"
    smoothness?: number
    radius?: number
    dim?: number
    background?: string
    sensitivity?: number
    loop?: boolean
    responsive?: boolean
    wheel?: boolean
    style?: CSSProperties
}

const PLACEHOLDER_COUNT = 8
const MAX_SCALE = 2.5
const MIN_SCALE = 0.1
// Fraction of the container width a slide may take before it is scaled down.
const FIT_RATIO = 0.55
// Fallback width used when the static renderer never measures the box.
const STATIC_FALLBACK_WIDTH = 1200
const SETTLE = 0.05

const DEFAULT_IMAGES = [
    "https://images.unsplash.com/photo-1557747357-b3302a733ae4?w=900&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1637961239801-d0dfcc1a9340?w=900&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1579205149708-f5b24c5a04e5?w=900&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1748572495955-4f301f8e93ba?w=900&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1664705792423-89f2016228eb?w=900&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1758600433991-933fb663161f?w=900&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1643325297990-cbdde391d7c8?w=900&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1601233750964-940fc7080ba5?w=900&auto=format&fit=crop&q=60",
].map((src) => ({ image: { src, alt: "" }, offsetY: 0 }))

function wrap(value: number, span: number): number {
    return ((value % span) + span) % span
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

function toSlide(item: ImageInput): Slide | null {
    let value: ImageValue = item as ImageValue
    let offsetY = 0
    if (item && typeof item === "object" && ("image" in item || "offsetY" in item)) {
        value = (item as { image?: ImageValue }).image
        const o = (item as { offsetY?: number }).offsetY
        offsetY = typeof o === "number" && isFinite(o) ? o : 0
    }
    if (!value) return null
    if (typeof value === "string") return value ? { src: value, alt: "", offsetY } : null
    if (typeof value.src !== "string" || !value.src) return null
    return { src: value.src, srcSet: value.srcSet, alt: value.alt ?? "", offsetY }
}

function placeholderFill(index: number): string {
    const hue = (index * 47 + 210) % 360
    return `linear-gradient(150deg, hsl(${hue} 42% 34%), hsl(${(hue + 45) % 360} 55% 10%))`
}

interface Frame {
    count: number
    step: number
    slideWidth: number
    width: number
    ease: number
    dim: number
    loop: boolean
    flip: boolean
}

interface Placement {
    transform: string
    filter: string
}

// Pure layout for slide i at scroll offset `current` — shared by the static render and the rAF loop.
function place(i: number, c: Frame, current: number): Placement {
    const span = c.count * c.step
    const pad = (c.width - c.slideWidth) / 2
    const half = c.width / 2
    const raw = i * c.step - current + pad
    const x = c.loop ? wrap(raw + c.step, span) - c.step : raw
    const distance = x + c.slideWidth / 2 - half

    let scale: number
    let push = 0
    if (distance > 0) {
        scale = Math.min(MAX_SCALE, 1 + distance / c.width)
        push = (scale - 1) * c.slideWidth * 0.75
    } else {
        scale = Math.max(MIN_SCALE, 1 + distance / c.width)
    }

    const left = c.flip ? c.width - c.slideWidth - (x + push) : x + push
    let filter = "none"
    if (c.dim > 0 && scale < 1) {
        const t = (1 - scale) / (1 - MIN_SCALE)
        filter = `brightness(${(1 - t * c.dim).toFixed(3)})`
    }
    return { transform: `translate3d(${left.toFixed(2)}px, -50%, 0) scale(${scale.toFixed(4)})`, filter }
}

/**
 * Smooth Scroll Slider
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SmoothScrollSlider(props: SmoothScrollSliderProps) {
    const {
        images = DEFAULT_IMAGES,
        slideWidth: baseWidth = 400,
        slideHeight: baseHeight = 400,
        spacing = 2,
        direction = "right",
        smoothness = 10,
        radius = 16,
        dim = 10,
        background = "#000000",
        sensitivity = 5,
        loop = true,
        responsive = true,
        wheel = true,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement | null>(null)
    const nodes = useRef<(HTMLDivElement | null)[]>([])
    const target = useRef(0)
    const current = useRef(0)
    const [measured, setMeasured] = useState(0)
    const width = measured > 0 ? measured : isStatic ? STATIC_FALLBACK_WIDTH : 0

    const source = useMemo<Slide[]>(() => {
        const resolved: Slide[] = []
        for (const item of images ?? []) {
            const slide = toSlide(item)
            if (slide) resolved.push(slide)
        }
        return resolved.length
            ? resolved
            : Array.from({ length: PLACEHOLDER_COUNT }, () => ({ src: null, alt: "", offsetY: 0 }))
    }, [images])

    // Responsive: shrink slides (and their spacing) on narrow containers so the composition holds on phones.
    const fit = responsive && width > 0 ? Math.min(1, (width * FIT_RATIO) / Math.max(1, baseWidth)) : 1
    const slideWidth = baseWidth * fit
    const slideHeight = baseHeight * fit
    const step = slideWidth + clamp(spacing, 0, 10) * 20 * fit

    const ease = 0.15 - (clamp(smoothness, 0, 10) / 10) * 0.13
    const dimAmount = (clamp(dim, 0, 10) / 10) * 0.85
    const wheelMultiplier = 0.4 + (clamp(sensitivity, 0, 10) / 10) * 1.2
    const dragMultiplier = 0.6 + (clamp(sensitivity, 0, 10) / 10) * 1.8
    const flip = direction === "left"

    const repeats = useMemo(() => {
        if (!loop || width <= 0 || step <= 0) return 1
        return Math.max(1, Math.ceil((width + step * 2) / (source.length * step)))
    }, [loop, width, step, source.length])

    const slides = useMemo(() => {
        const out: Slide[] = []
        for (let r = 0; r < repeats; r += 1) out.push(...source)
        return out
    }, [source, repeats])

    const frame = useRef<Frame>({
        count: 0, step: 0, slideWidth: 0, width: 0, ease: 0.075, dim: 0, loop: true, flip: false,
    })
    frame.current = { count: slides.length, step, slideWidth, width, ease, dim: dimAmount, loop, flip }

    const input = useRef({ wheelMultiplier, dragMultiplier, flip })
    input.current = { wheelMultiplier, dragMultiplier, flip }

    // Wakes the idle-stopping animation loop; assigned by the loop effect.
    const wake = useRef<() => void>(() => {})

    useEffect(() => {
        const node = containerRef.current
        if (!node || typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver((entries) => {
            const w = Math.round(entries[0].contentRect.width)
            setMeasured((prev) => (prev === w ? prev : w))
        })
        observer.observe(node)
        setMeasured(Math.round(node.getBoundingClientRect().width))
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        nodes.current.length = slides.length
    }, [slides.length])

    // Re-lay out after any prop/size change (also covers non-animated contexts).
    useEffect(() => {
        wake.current()
    })

    // Animation loop — only runs while the slider is moving, never in the static renderer.
    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")
        let raf = 0
        let last = 0

        const render = () => {
            const c = frame.current
            for (let i = 0; i < c.count; i += 1) {
                const node = nodes.current[i]
                if (!node) continue
                const p = place(i, c, current.current)
                node.style.transform = p.transform
                node.style.filter = p.filter
            }
        }

        const tick = (now: number) => {
            raf = 0
            const c = frame.current
            const delta = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60
            last = now
            if (!c.count || c.step <= 0 || c.width <= 0) return

            const span = c.count * c.step
            if (c.loop) {
                if (current.current > span || current.current < -span) {
                    const shift = Math.trunc(current.current / span) * span
                    current.current -= shift
                    target.current -= shift
                }
            } else {
                target.current = clamp(target.current, 0, (c.count - 1) * c.step)
            }

            const k = reduced?.matches ? 1 : 1 - Math.pow(1 - c.ease, delta * 60)
            current.current += (target.current - current.current) * k
            if (Math.abs(target.current - current.current) < SETTLE) current.current = target.current

            render()

            if (current.current !== target.current) raf = requestAnimationFrame(tick)
            else last = 0
        }

        wake.current = () => {
            if (!raf) raf = requestAnimationFrame(tick)
        }
        wake.current()
        return () => {
            cancelAnimationFrame(raf)
            raf = 0
            wake.current = () => {}
        }
    }, [isStatic])

    useEffect(() => {
        const node = containerRef.current
        if (!node || isStatic || !wheel) return
        const onWheel = (event: WheelEvent) => {
            event.preventDefault()
            const dominant =
                Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
            target.current += dominant * input.current.wheelMultiplier
            wake.current()
        }
        node.addEventListener("wheel", onWheel, { passive: false })
        return () => node.removeEventListener("wheel", onWheel)
    }, [isStatic, wheel])

    useEffect(() => {
        const node = containerRef.current
        if (!node || isStatic) return
        let pointer: number | null = null
        let lastX = 0

        const onDown = (event: PointerEvent) => {
            if (pointer !== null) return
            pointer = event.pointerId
            lastX = event.clientX
            node.setPointerCapture(event.pointerId)
            node.style.cursor = "grabbing"
        }
        const onMove = (event: PointerEvent) => {
            if (pointer !== event.pointerId) return
            const dx = event.clientX - lastX
            lastX = event.clientX
            target.current += (input.current.flip ? dx : -dx) * input.current.dragMultiplier
            wake.current()
        }
        const onUp = (event: PointerEvent) => {
            if (pointer !== event.pointerId) return
            pointer = null
            node.style.cursor = "grab"
            if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId)
        }

        node.addEventListener("pointerdown", onDown)
        node.addEventListener("pointermove", onMove)
        node.addEventListener("pointerup", onUp)
        node.addEventListener("pointercancel", onUp)
        return () => {
            node.removeEventListener("pointerdown", onDown)
            node.removeEventListener("pointermove", onMove)
            node.removeEventListener("pointerup", onUp)
            node.removeEventListener("pointercancel", onUp)
        }
    }, [isStatic])

    const ready = width > 0

    return (
        <div
            ref={containerRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Image slider"
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background,
                cursor: isStatic ? "default" : "grab",
                touchAction: "pan-y",
                userSelect: "none",
                opacity: ready ? 1 : 0,
                transition: isStatic ? undefined : "opacity 0.35s ease",
                ...style,
            }}
        >
            {slides.map((slide, i) => {
                // Initial/static placement is computed in render so SSR and static renders show the composition.
                const p = ready ? place(i, frame.current, current.current) : null
                return (
                    <div
                        key={i}
                        ref={(el) => {
                            nodes.current[i] = el
                        }}
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: 0,
                            width: slideWidth,
                            height: slideHeight,
                            borderRadius: radius,
                            overflow: "hidden",
                            background: slide.src ? "#111" : placeholderFill(i),
                            willChange: isStatic ? undefined : "transform, filter",
                            transform: p ? p.transform : "translate3d(0, -50%, 0)",
                            filter: p ? p.filter : "none",
                            pointerEvents: "none",
                        }}
                    >
                        {slide.src ? (
                            <img
                                src={slide.src}
                                srcSet={slide.srcSet}
                                sizes={`${Math.ceil(slideWidth * MAX_SCALE)}px`}
                                alt={i < source.length ? slide.alt : ""}
                                aria-hidden={i >= source.length || undefined}
                                draggable={false}
                                decoding="async"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    objectPosition: `50% calc(50% + ${slide.offsetY}px)`,
                                    display: "block",
                                    userSelect: "none",
                                }}
                            />
                        ) : null}
                    </div>
                )
            })}
        </div>
    )
}

SmoothScrollSlider.displayName = "Smooth Scroll Slider"

addPropertyControls(SmoothScrollSlider, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                offsetY: {
                    type: ControlType.Number,
                    title: "Offset Y",
                    defaultValue: 0,
                    min: -200,
                    max: 200,
                    step: 1,
                    unit: "px",
                },
            },
        },
        defaultValue: DEFAULT_IMAGES,
    },
    slideWidth: { type: ControlType.Number, title: "Slide Width", defaultValue: 400, min: 80, max: 1200, step: 1, unit: "px" },
    slideHeight: { type: ControlType.Number, title: "Slide Height", defaultValue: 400, min: 80, max: 1200, step: 1, unit: "px" },
    responsive: {
        type: ControlType.Boolean,
        title: "Responsive",
        defaultValue: true,
        description: "Scales slides down on narrow screens.",
    },
    spacing: { type: ControlType.Number, title: "Spacing", defaultValue: 2, min: 0, max: 10, step: 0.5 },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["right", "left"],
        optionTitles: ["Right", "Left"],
        defaultValue: "right",
        displaySegmentedControl: true,
    },
    loop: { type: ControlType.Boolean, title: "Loop", defaultValue: true },
    smoothness: { type: ControlType.Number, title: "Smoothness", defaultValue: 10, min: 0, max: 10, step: 0.5 },
    sensitivity: { type: ControlType.Number, title: "Sensitivity", defaultValue: 5, min: 0, max: 10, step: 0.5 },
    wheel: {
        type: ControlType.Boolean,
        title: "Wheel",
        defaultValue: true,
        description: "Mouse wheel / trackpad scrolls the slider.",
    },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 16, min: 0, max: 200, step: 1, unit: "px" },
    dim: { type: ControlType.Number, title: "Dim", defaultValue: 10, min: 0, max: 10, step: 0.5 },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#000000" },
})
