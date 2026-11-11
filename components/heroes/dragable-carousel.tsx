// ═══════════════════════════════════════════════════════════════════════════
// DRAGGABLE 3D CAROUSEL — PHYSICS SNAP EDITION
// ═══════════════════════════════════════════════════════════════════════════
//
// WHAT THIS COMPONENT DOES:
// A physics-based 3D carousel with snap-to-slide behavior. Each slide
// transforms in 3D space (rotateY, translateZ, scale, opacity) based on
// its distance from the center — creating a cinematic coverflow effect
// that cannot be achieved with Framer's native tools.
//
// WHY CODE IS REQUIRED:
// - Per-slide 3D perspective transforms calculated from scroll position.
// - Real-time velocity tracking with projected snap targeting.
// - GSAP-powered snap animation with professional easing curves.
// - Distance-based scale, opacity, rotation computed per frame.
// - These behaviors require custom requestAnimationFrame logic and
//   direct DOM manipulation that Framer's native components cannot provide.
//
// KEY FEATURES:
// - 3D Coverflow: Each slide rotates and recedes in perspective space.
// - Physics Snap: Drag velocity determines which slide to land on.
// - Distance Transforms: Scale, opacity, Z-depth react to position.
// - Navigation: Optional arrows and pagination dots.
// - Autoplay: Timer-based advancement with pause-on-hover.
// - Touch Ready: Full touch/swipe support for mobile devices.
//
// HOW TO USE:
// 1. Upload images via the "Images" array in the property panel.
// 2. Adjust Slide Width/Height to match your layout.
// 3. Tune the 3D effect with Rotate, Depth, Scale, and Opacity controls.
// 4. Enable Arrows/Dots for navigation.
// 5. Preview the cinematic 3D carousel in action.
//
// ═══════════════════════════════════════════════════════════════════════════
// Created by AliThemes.com
// Powered by GSAP & Framer
// ═══════════════════════════════════════════════════════════════════════════

import * as React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
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

const PRESETS = {
    Default: {
        perspective: 1000,
        rotateY: 45,
        depth: 150,
        activeScale: 1.0,
        inactiveScale: 0.85,
        inactiveOpacity: 0.5,
        snapDuration: 0.6,
        snapEase: "power3.out",
    },
    "Flat Minimal": {
        perspective: 1000,
        rotateY: 0,
        depth: 0,
        activeScale: 1.0,
        inactiveScale: 0.9,
        inactiveOpacity: 0.4,
        snapDuration: 0.5,
        snapEase: "power2.out",
    },
    "Deep 3D": {
        perspective: 800,
        rotateY: 65,
        depth: 300,
        activeScale: 1.05,
        inactiveScale: 0.7,
        inactiveOpacity: 0.3,
        snapDuration: 0.8,
        snapEase: "power4.out",
    },
    "Soft Cover": {
        perspective: 1200,
        rotateY: 30,
        depth: 80,
        activeScale: 1.0,
        inactiveScale: 0.92,
        inactiveOpacity: 0.6,
        snapDuration: 0.7,
        snapEase: "power3.out",
    },
    "Elastic Pop": {
        perspective: 900,
        rotateY: 40,
        depth: 200,
        activeScale: 1.1,
        inactiveScale: 0.75,
        inactiveOpacity: 0.4,
        snapDuration: 0.8,
        snapEase: "elastic.out(1,0.5)",
    },
}

const FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80",
]

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function DragableCarousel(props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const slidesRef = useRef<(HTMLDivElement | null)[]>([])
    const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const indexRef = useRef(0)
    const trackX = useRef(0)
    const drag = useRef({
        active: false,
        startX: 0,
        startTrackX: 0,
        lastX: 0,
        lastTime: 0,
        velocity: 0,
    })

    const preset = props.preset !== "Custom" ? PRESETS[props.preset] : null

    const {
        images,
        slideWidth,
        slideHeight,
        gap,
        borderRadius,
        objectFit,
        showArrows,
        arrowColor,
        arrowSize,
        showDots,
        dotColor,
        dotSize,
        autoplay,
        autoplayDelay,
        pauseOnHover,
        loop,
    } = props

    const perspective = preset?.perspective ?? props.perspective
    const maxRotateY = preset?.rotateY ?? props.rotateY
    const depth = preset?.depth ?? props.depth
    const activeScale = preset?.activeScale ?? props.activeScale
    const inactiveScale = preset?.inactiveScale ?? props.inactiveScale
    const inactiveOpacity = preset?.inactiveOpacity ?? props.inactiveOpacity
    const snapDuration = preset?.snapDuration ?? props.snapDuration
    const snapEase = preset?.snapEase ?? props.snapEase

    const slides = images?.length > 0 ? images : FALLBACK_IMAGES
    const count = slides.length
    const step = slideWidth + gap

    const centerXFor = useCallback(
        (i: number) => {
            const el = containerRef.current
            if (!el) return -i * step
            return el.offsetWidth / 2 - i * step - slideWidth / 2
        },
        [step, slideWidth]
    )

    // Per-slide 3D transforms — the core logic that requires custom code
    const render = useCallback(() => {
        const el = containerRef.current
        const track = trackRef.current
        if (!el || !track) return

        track.style.transform = `translateX(${trackX.current}px)`
        const center = el.offsetWidth / 2

        slidesRef.current.forEach((slide, i) => {
            if (!slide) return
            const slideCenter = i * step + slideWidth / 2 + trackX.current
            const norm = (slideCenter - center) / step
            const abs = Math.abs(norm)

            const ry = norm * maxRotateY
            const tz = -abs * depth
            const sc = Math.max(
                inactiveScale,
                activeScale - abs * (activeScale - inactiveScale)
            )
            const op = Math.max(
                inactiveOpacity,
                1 - abs * (1 - inactiveOpacity)
            )

            slide.style.transform = `perspective(${perspective}px) rotateY(${ry}deg) translateZ(${tz}px) scale(${sc})`
            slide.style.opacity = `${op}`
            slide.style.zIndex = `${100 - Math.round(abs * 10)}`
        })
    }, [
        step,
        slideWidth,
        maxRotateY,
        depth,
        activeScale,
        inactiveScale,
        inactiveOpacity,
        perspective,
    ])

    const snapTo = useCallback(
        (i: number, instant = false) => {
            const target = loop
                ? ((i % count) + count) % count
                : Math.max(0, Math.min(count - 1, i))
            const x = centerXFor(target)

            if (instant) {
                trackX.current = x
                render()
                indexRef.current = target
                setActiveIndex(target)
                return
            }

            indexRef.current = target
            setActiveIndex(target)

            gsap.killTweensOf(trackX)
            gsap.to(trackX, {
                current: x,
                duration: snapDuration,
                ease: snapEase,
                onUpdate: render,
            })
        },
        [centerXFor, count, loop, snapDuration, snapEase, render]
    )

    // Initial render
    useEffect(() => {
        slidesRef.current = slidesRef.current.slice(0, count)
        snapTo(0, true)
    }, [count, slideWidth, gap])

    // Drag interaction with velocity tracking
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const onStart = (e: MouseEvent | TouchEvent) => {
            gsap.killTweensOf(trackX)
            drag.current.active = true
            const x = "touches" in e ? e.touches[0].clientX : e.clientX
            drag.current.startX = x
            drag.current.startTrackX = trackX.current
            drag.current.lastX = x
            drag.current.lastTime = Date.now()
            drag.current.velocity = 0
            container.style.cursor = "grabbing"
        }

        const onMove = (e: MouseEvent | TouchEvent) => {
            if (!drag.current.active) return
            if (e.cancelable) e.preventDefault()
            const x = "touches" in e ? e.touches[0].clientX : e.clientX
            const now = Date.now()
            const dt = now - drag.current.lastTime
            if (dt > 0) {
                drag.current.velocity = ((x - drag.current.lastX) / dt) * 1000
            }
            drag.current.lastX = x
            drag.current.lastTime = now
            trackX.current =
                drag.current.startTrackX + (x - drag.current.startX)
            render()
        }

        const onEnd = () => {
            if (!drag.current.active) return
            drag.current.active = false
            container.style.cursor = "grab"

            // Velocity-projected snap: project ahead based on drag speed
            const projected = trackX.current + drag.current.velocity * 0.12
            const center = container.offsetWidth / 2
            let best = 0
            let bestDist = Infinity
            for (let i = 0; i < count; i++) {
                const sc = i * step + slideWidth / 2 + projected
                const d = Math.abs(sc - center)
                if (d < bestDist) {
                    bestDist = d
                    best = i
                }
            }
            snapTo(best)
        }

        container.addEventListener("mousedown", onStart)
        window.addEventListener("mousemove", onMove)
        window.addEventListener("mouseup", onEnd)
        container.addEventListener("touchstart", onStart, {
            passive: true,
        })
        window.addEventListener("touchmove", onMove, { passive: false })
        window.addEventListener("touchend", onEnd)

        return () => {
            container.removeEventListener("mousedown", onStart)
            window.removeEventListener("mousemove", onMove)
            window.removeEventListener("mouseup", onEnd)
            container.removeEventListener("touchstart", onStart)
            window.removeEventListener("touchmove", onMove)
            window.removeEventListener("touchend", onEnd)
        }
    }, [count, step, slideWidth, render, snapTo])

    // Autoplay
    useEffect(() => {
        if (!autoplay || count <= 1) return

        const tick = () => {
            const next = indexRef.current + 1
            if (!loop && next >= count) snapTo(0)
            else snapTo(next)
        }

        const start = () => {
            if (autoplayRef.current) clearInterval(autoplayRef.current)
            autoplayRef.current = setInterval(tick, autoplayDelay)
        }
        const stop = () => {
            if (autoplayRef.current) clearInterval(autoplayRef.current)
        }

        start()

        const container = containerRef.current
        if (container && pauseOnHover) {
            container.addEventListener("mouseenter", stop)
            container.addEventListener("mouseleave", start)
        }

        return () => {
            stop()
            if (container && pauseOnHover) {
                container.removeEventListener("mouseenter", stop)
                container.removeEventListener("mouseleave", start)
            }
        }
    }, [autoplay, autoplayDelay, pauseOnHover, loop, count, snapTo])

    // Recalculate transforms when visual props change
    useEffect(() => {
        render()
    }, [
        maxRotateY,
        depth,
        activeScale,
        inactiveScale,
        inactiveOpacity,
        perspective,
        borderRadius,
    ])

    const goPrev = () => snapTo(indexRef.current - 1)
    const goNext = () => snapTo(indexRef.current + 1)

    return (
        <div ref={containerRef} style={wrapperStyle}>
            <div
                ref={trackRef}
                style={{ display: "flex", gap, alignItems: "center" }}
            >
                {slides.map((src, i) => (
                    <div
                        key={`${src}-${i}`}
                        ref={(el) => {
                            slidesRef.current[i] = el
                        }}
                        style={{
                            width: slideWidth,
                            height: slideHeight,
                            borderRadius,
                            overflow: "hidden",
                            flexShrink: 0,
                            willChange: "transform, opacity",
                        }}
                    >
                        <img
                            src={src}
                            alt=""
                            draggable={false}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit,
                                display: "block",
                                pointerEvents: "none",
                            }}
                        />
                    </div>
                ))}
            </div>

            {showArrows && (
                <>
                    <button
                        onClick={goPrev}
                        aria-label="Previous slide"
                        style={{ ...arrowBtnStyle(arrowSize), left: 12 }}
                    >
                        <svg
                            width={arrowSize * 0.45}
                            height={arrowSize * 0.45}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={arrowColor}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <button
                        onClick={goNext}
                        aria-label="Next slide"
                        style={{ ...arrowBtnStyle(arrowSize), right: 12 }}
                    >
                        <svg
                            width={arrowSize * 0.45}
                            height={arrowSize * 0.45}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={arrowColor}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="9 6 15 12 9 18" />
                        </svg>
                    </button>
                </>
            )}

            {showDots && (
                <div style={dotsRowStyle}>
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => snapTo(i)}
                            aria-label={`Slide ${i + 1}`}
                            style={{
                                width: dotSize,
                                height: dotSize,
                                borderRadius: "50%",
                                border: "none",
                                padding: 0,
                                cursor: "pointer",
                                background: dotColor,
                                opacity: i === activeIndex ? 1 : 0.3,
                                transform:
                                    i === activeIndex
                                        ? "scale(1.4)"
                                        : "scale(1)",
                                transition:
                                    "opacity 0.3s ease, transform 0.3s ease",
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ── Styles ─────────────────────────────────────────────────────────────────

const wrapperStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    cursor: "grab",
    userSelect: "none",
    position: "relative",
}

const arrowBtnStyle = (size: number): React.CSSProperties => ({
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 200,
    width: size,
    height: size,
    borderRadius: "50%",
    border: "none",
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
})

const dotsRowStyle: React.CSSProperties = {
    position: "absolute",
    bottom: 16,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: 8,
    zIndex: 200,
}

// ── Defaults ───────────────────────────────────────────────────────────────

DragableCarousel.defaultProps = {
    preset: "Default",
    images: [],
    slideWidth: 320,
    slideHeight: 400,
    gap: 20,
    borderRadius: 12,
    objectFit: "cover",
    perspective: 1000,
    rotateY: 45,
    depth: 150,
    activeScale: 1.0,
    inactiveScale: 0.85,
    inactiveOpacity: 0.5,
    snapDuration: 0.6,
    snapEase: "power3.out",
    showArrows: true,
    arrowColor: "#333333",
    arrowSize: 44,
    showDots: true,
    dotColor: "#333333",
    dotSize: 8,
    autoplay: false,
    autoplayDelay: 3000,
    pauseOnHover: true,
    loop: true,
}

// ── Property Controls ──────────────────────────────────────────────────────

const isCustom = (p) => p.preset === "Custom"

addPropertyControls(DragableCarousel, {
    // ── Preset ─────────────────────────────────────────────────────────────
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        options: [
            "Default",
            "Flat Minimal",
            "Deep 3D",
            "Soft Cover",
            "Elastic Pop",
            "Custom",
        ],
        optionTitles: [
            "Default",
            "Flat Minimal",
            "Deep 3D",
            "Soft Cover",
            "Elastic Pop",
            "Custom ✎",
        ],
    },

    // ── Images ─────────────────────────────────────────────────────────────
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.Image },
    },

    // ── Slide Layout ───────────────────────────────────────────────────────
    slideWidth: {
        type: ControlType.Number,
        title: "Slide Width",
        min: 80,
        max: 900,
        step: 10,
    },
    slideHeight: {
        type: ControlType.Number,
        title: "Slide Height",
        min: 80,
        max: 900,
        step: 10,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 100,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 100,
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
    },

    // ── 3D Effect (Custom only) ───────────────────────────────────────────
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        min: 200,
        max: 2000,
        step: 50,
        hidden: (p) => !isCustom(p),
    },
    rotateY: {
        type: ControlType.Number,
        title: "Rotate Y (°)",
        min: 0,
        max: 90,
        hidden: (p) => !isCustom(p),
    },
    depth: {
        type: ControlType.Number,
        title: "Z Depth",
        min: 0,
        max: 500,
        step: 10,
        hidden: (p) => !isCustom(p),
    },
    activeScale: {
        type: ControlType.Number,
        title: "Active Scale",
        min: 0.5,
        max: 1.5,
        step: 0.05,
        hidden: (p) => !isCustom(p),
    },
    inactiveScale: {
        type: ControlType.Number,
        title: "Side Scale",
        min: 0.3,
        max: 1,
        step: 0.05,
        hidden: (p) => !isCustom(p),
    },
    inactiveOpacity: {
        type: ControlType.Number,
        title: "Side Opacity",
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p) => !isCustom(p),
    },

    // ── Snap Animation (Custom only) ──────────────────────────────────────
    snapDuration: {
        type: ControlType.Number,
        title: "Snap Speed",
        min: 0.1,
        max: 2,
        step: 0.1,
        description: "Duration in seconds",
        hidden: (p) => !isCustom(p),
    },
    snapEase: {
        type: ControlType.Enum,
        title: "Snap Ease",
        options: [
            "power2.out",
            "power3.out",
            "power4.out",
            "back.out(1.7)",
            "elastic.out(1,0.5)",
        ],
        optionTitles: ["Smooth", "Smooth+", "Snappy", "Overshoot", "Elastic"],
        hidden: (p) => !isCustom(p),
    },

    // ── Navigation ─────────────────────────────────────────────────────────
    showArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        hidden: (p) => !p.showArrows,
    },
    arrowSize: {
        type: ControlType.Number,
        title: "Arrow Size",
        min: 28,
        max: 72,
        hidden: (p) => !p.showArrows,
    },
    showDots: {
        type: ControlType.Boolean,
        title: "Dots",
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        hidden: (p) => !p.showDots,
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        min: 4,
        max: 16,
        hidden: (p) => !p.showDots,
    },

    // ── Behavior ───────────────────────────────────────────────────────────
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoplayDelay: {
        type: ControlType.Number,
        title: "Delay (ms)",
        min: 500,
        max: 10000,
        step: 250,
        hidden: (p) => !p.autoplay,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause Hover",
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (p) => !p.autoplay,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
