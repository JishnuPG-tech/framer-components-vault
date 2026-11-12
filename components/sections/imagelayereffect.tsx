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

import gsap from "https://esm.sh/gsap@3.12.5"

// ─── Shape data ───────────────────────────────────────────────────────────────

type ShapeKey = "rectangle" | "triangle" | "chevron" | "oval"
type EffectKey = "stroke" | "shade"

const SHAPES: Record<ShapeKey, { clipPath: string; svgPath: string }> = {
    rectangle: {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        svgPath: "M 0 0 L 100 0 L 100 100 L 0 100 Z",
    },
    triangle: {
        clipPath: "polygon(50% 5%, 10% 95%, 90% 95%)",
        svgPath: "M 50 5 L 10 95 L 90 95 Z",
    },
    chevron: {
        clipPath:
            "polygon(75% 0%, 100% 50%, 75% 100%, 0% 100%, 25% 50%, 0% 0%)",
        svgPath: "M 75 0 L 100 50 L 75 100 L 0 100 L 25 50 L 0 0 Z",
    },
    oval: {
        clipPath: "ellipse(45% 35% at 50% 50%)",
        svgPath:
            "M 50 15 C 74.85 15 95 31.32 95 50 C 95 68.68 74.85 85 50 85 C 25.15 85 5 68.68 5 50 C 5 31.32 25.15 15 50 15 Z",
    },
}

const SCALE_INTERVAL = 0.06
const DRAG_LERP = 0.1

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function ImageLayerEffect(props: {
    image?: string
    shape?: ShapeKey
    effect?: EffectKey
    innerTotal?: number
    parallaxStrength?: number
    duration?: number
    borderRadius?: number
    style?: React.CSSProperties
}) {
    const {
        image,
        shape = "rectangle",
        effect = "stroke",
        innerTotal = 10,
        parallaxStrength = 20,
        duration = 0.8,
        borderRadius = 20,
        style,
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)
    const layerRefs = React.useRef<(HTMLDivElement | null)[]>([])
    const outlineRefs = React.useRef<(HTMLDivElement | null)[]>([])
    const shadowRefs = React.useRef<(HTMLDivElement | null)[]>([])
    const hoverTlRef = React.useRef<any>(null)
    const rafRef = React.useRef<number>(0)

    const stateRef = React.useRef({
        mouseX: 0,
        mouseY: 0,
        isDragging: false,
        dragStartY: 0,
        dragDistance: 0,
        smoothDragDistance: 0,
        isHovered: false,
        isRotationActive: false,
        centerX: 0,
        centerY: 0,
    })

    // Live refs — always current without re-running stable effects
    const effectRef = React.useRef<EffectKey>(effect)
    const parallaxRef = React.useRef<number>(parallaxStrength)
    effectRef.current = effect
    parallaxRef.current = parallaxStrength

    // ── Rebuild hover timeline on shape / count / duration change ────────────
    React.useEffect(() => {
        const state = stateRef.current

        // Reset transforms & drag state
        state.isRotationActive = false
        state.dragDistance = 0
        state.smoothDragDistance = 0

        const allLayers = layerRefs.current.filter(Boolean) as HTMLDivElement[]
        allLayers.forEach((el, i) => {
            if (i === 0) return
            gsap.set(el, {
                x: 0,
                y: 0,
                z: 0,
                rotationX: 0,
                rotationY: 0,
                rotationZ: 0,
                scale: 1,
            })
        })

        const outlines = outlineRefs.current.filter(Boolean) as HTMLDivElement[]
        const shadows = shadowRefs.current.filter(Boolean) as HTMLDivElement[]
        outlines.forEach((el) => {
            el.style.opacity = "0"
        })
        shadows.forEach((el) => {
            el.style.opacity = "0"
        })

        if (hoverTlRef.current) hoverTlRef.current.kill()

        const nonBase = allLayers.slice(1)
        if (nonBase.length === 0) return

        const reversed = [...nonBase].reverse()
        hoverTlRef.current = gsap.timeline({ paused: true }).to(reversed, {
            scale: (_i: number, target: Element) => {
                const idx = allLayers.indexOf(target as HTMLDivElement)
                return Math.max(1 - SCALE_INTERVAL * idx, 0)
            },
            duration,
            ease: "power2.inOut",
            stagger: 0.1,
        })

        if (state.isHovered) hoverTlRef.current.play()

        return () => {
            hoverTlRef.current?.kill()
        }
    }, [shape, innerTotal, duration])

    // ── RAF animation loop ────────────────────────────────────────────────────
    React.useEffect(() => {
        const container = containerRef.current
        const state = stateRef.current

        const updateCenter = () => {
            if (!container) return
            const rect = container.getBoundingClientRect()
            state.centerX = rect.left + rect.width / 2
            state.centerY = rect.top + rect.height / 2
        }

        const setEffectVisibility = (active: boolean) => {
            const cur = effectRef.current
            const outlines = outlineRefs.current.filter(
                Boolean
            ) as HTMLDivElement[]
            const shadows = shadowRefs.current.filter(
                Boolean
            ) as HTMLDivElement[]
            outlines.forEach((el) => {
                el.style.opacity = cur === "stroke" && active ? "0.5" : "0"
            })
            shadows.forEach((el) => {
                el.style.opacity = cur === "shade" && active ? "1" : "0"
            })
        }

        const doParallax = () => {
            if (!container) return
            const dx =
                (state.mouseX - state.centerX) / (container.offsetWidth / 2)
            const dy =
                (state.mouseY - state.centerY) / (container.offsetHeight / 2)
            const ps = parallaxRef.current
            const layers = layerRefs.current.filter(Boolean) as HTMLDivElement[]
            layers.forEach((el, i) => {
                if (i === 0) return
                const lm = i * 0.2
                gsap.set(el, {
                    x: dx * ps * lm * 0.5,
                    y: dy * ps * lm * 0.5,
                    z: i * 10,
                    transformPerspective: 1000,
                })
            })
        }

        const doDragRotation = () => {
            if (!container) return
            const sd = state.smoothDragDistance
            const rp = Math.min(Math.abs(sd) / 100, 1)
            const dx =
                (state.mouseX - state.centerX) / (container.offsetWidth / 2)
            const dy =
                (state.mouseY - state.centerY) / (container.offsetHeight / 2)
            const ps = parallaxRef.current
            const layers = layerRefs.current.filter(Boolean) as HTMLDivElement[]
            layers.forEach((el, i) => {
                if (i === 0) return
                const lm = i * 0.3
                const rot = (sd / 2) * rp * (i * 0.3)
                gsap.set(el, {
                    x: dx * ps * lm,
                    y: dy * ps * lm,
                    z: i * 15,
                    rotationX: dy * 15 * rp,
                    rotationY: dx * -15 * rp,
                    rotationZ: rot,
                    transformPerspective: 1000,
                    transformStyle: "preserve-3d",
                })
            })
        }

        updateCenter()

        const tick = () => {
            state.smoothDragDistance +=
                (state.dragDistance - state.smoothDragDistance) * DRAG_LERP
            if (state.isHovered) {
                if (state.isRotationActive) {
                    doDragRotation()
                    setEffectVisibility(true)
                } else if (!state.isDragging) {
                    doParallax()
                    setEffectVisibility(false)
                }
            }
            rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)

        const ro = new ResizeObserver(updateCenter)
        if (container) ro.observe(container)

        return () => {
            cancelAnimationFrame(rafRef.current)
            ro.disconnect()
        }
    }, [])

    // ── Event listeners ───────────────────────────────────────────────────────
    React.useEffect(() => {
        const container = containerRef.current
        if (!container) return
        const state = stateRef.current

        const resetTransforms = () => {
            const layers = layerRefs.current.filter(Boolean) as HTMLDivElement[]
            layers.forEach((el, i) => {
                if (i === 0) return
                gsap.to(el, {
                    x: 0,
                    y: 0,
                    z: 0,
                    rotationX: 0,
                    rotationY: 0,
                    rotationZ: 0,
                    duration: 0.6,
                    ease: "power2.out",
                })
            })
            gsap.to(state, {
                smoothDragDistance: 0,
                duration: 0.6,
                ease: "power2.out",
            })
            state.isRotationActive = false
            const outlines = outlineRefs.current.filter(
                Boolean
            ) as HTMLDivElement[]
            const shadows = shadowRefs.current.filter(
                Boolean
            ) as HTMLDivElement[]
            outlines.forEach((el) => {
                el.style.opacity = "0"
            })
            shadows.forEach((el) => {
                el.style.opacity = "0"
            })
        }

        const onEnter = () => {
            state.isHovered = true
            const rect = container.getBoundingClientRect()
            state.centerX = rect.left + rect.width / 2
            state.centerY = rect.top + rect.height / 2
            hoverTlRef.current?.play()
        }

        const onLeave = () => {
            state.isHovered = false
            hoverTlRef.current?.reverse()
            resetTransforms()
        }

        const onMouseMove = (e: MouseEvent) => {
            state.mouseX = e.clientX
            state.mouseY = e.clientY
        }

        const onMouseDown = (e: MouseEvent) => {
            state.isDragging = true
            state.dragStartY = e.clientY
            container.style.cursor = "grabbing"
            e.preventDefault()
        }

        const onDocMouseMove = (e: MouseEvent) => {
            if (!state.isDragging) return
            state.dragDistance = e.clientY - state.dragStartY
            if (Math.abs(state.dragDistance) > 30 && !state.isRotationActive) {
                state.isRotationActive = true
            }
        }

        const onDocMouseUp = () => {
            if (!state.isDragging) return
            state.isDragging = false
            container.style.cursor = "grab"
            gsap.to(state, {
                dragDistance: 0,
                duration: 0.5,
                ease: "power2.out",
            })
        }

        const onTouchStart = (e: TouchEvent) => {
            state.isDragging = true
            state.dragStartY = e.touches[0].clientY
            e.preventDefault()
        }

        const onTouchMove = (e: TouchEvent) => {
            if (!state.isDragging) return
            state.dragDistance = e.touches[0].clientY - state.dragStartY
            if (Math.abs(state.dragDistance) > 30 && !state.isRotationActive) {
                state.isRotationActive = true
            }
        }

        const onTouchEnd = () => {
            if (!state.isDragging) return
            state.isDragging = false
            gsap.to(state, {
                dragDistance: 0,
                duration: 0.5,
                ease: "power2.out",
            })
        }

        container.addEventListener("mouseenter", onEnter)
        container.addEventListener("mouseleave", onLeave)
        container.addEventListener("mousemove", onMouseMove)
        container.addEventListener("mousedown", onMouseDown)
        document.addEventListener("mousemove", onDocMouseMove)
        document.addEventListener("mouseup", onDocMouseUp)
        container.addEventListener("touchstart", onTouchStart, {
            passive: false,
        })
        document.addEventListener("touchmove", onTouchMove)
        document.addEventListener("touchend", onTouchEnd)

        return () => {
            container.removeEventListener("mouseenter", onEnter)
            container.removeEventListener("mouseleave", onLeave)
            container.removeEventListener("mousemove", onMouseMove)
            container.removeEventListener("mousedown", onMouseDown)
            document.removeEventListener("mousemove", onDocMouseMove)
            document.removeEventListener("mouseup", onDocMouseUp)
            container.removeEventListener("touchstart", onTouchStart)
            document.removeEventListener("touchmove", onTouchMove)
            document.removeEventListener("touchend", onTouchEnd)
        }
    }, [])

    // ── Render ────────────────────────────────────────────────────────────────
    const shapeData = SHAPES[shape] || SHAPES.rectangle

    return (
        <div
            ref={containerRef}
            style={{
                width: 400,
                height: 500,
                ...style,
                position: "relative",
                overflow: "hidden",
                borderRadius,
                cursor: "grab",
                userSelect: "none",
            }}
        >
            {Array.from({ length: innerTotal }, (_, i) => {
                const isBase = i === 0
                const clipPath = isBase
                    ? SHAPES.rectangle.clipPath
                    : shapeData.clipPath

                return (
                    <div
                        key={i}
                        ref={(el) => {
                            layerRefs.current[i] = el
                        }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage: image
                                ? `url(${image})`
                                : undefined,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            clipPath,
                            zIndex: isBase ? 1 : 2,
                            willChange: "transform",
                        }}
                    >
                        {!isBase && (
                            <>
                                {/* Stroke outline */}
                                <div
                                    ref={(el) => {
                                        outlineRefs.current[i - 1] = el
                                    }}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        pointerEvents: "none",
                                        zIndex: 15,
                                        opacity: 0,
                                        transition: "opacity 0.3s ease",
                                    }}
                                >
                                    <svg
                                        viewBox="0 0 100 100"
                                        preserveAspectRatio="none"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            overflow: "visible",
                                        }}
                                    >
                                        <path
                                            d={shapeData.svgPath}
                                            stroke="#ffffff"
                                            strokeWidth="1"
                                            fill="none"
                                            vectorEffect="non-scaling-stroke"
                                            style={{
                                                filter: "drop-shadow(0 0 2px rgba(255,255,255,0.5))",
                                            }}
                                        />
                                    </svg>
                                </div>

                                {/* Shadow layer */}
                                <div
                                    ref={(el) => {
                                        shadowRefs.current[i - 1] = el
                                    }}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        pointerEvents: "none",
                                        zIndex: 14,
                                        opacity: 0,
                                        transition: "opacity 0.3s ease",
                                        filter: "blur(4px)",
                                    }}
                                >
                                    <svg
                                        viewBox="0 0 100 100"
                                        preserveAspectRatio="none"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            overflow: "visible",
                                        }}
                                    >
                                        {[0, 1, 2].map((sl) => (
                                            <path
                                                key={sl}
                                                d={shapeData.svgPath}
                                                fill="none"
                                                stroke={`rgba(0,0,0,${0.4 - sl * 0.08})`}
                                                strokeWidth={3 - sl * 0.8}
                                                vectorEffect="non-scaling-stroke"
                                            />
                                        ))}
                                    </svg>
                                </div>
                            </>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

ImageLayerEffect.defaultProps = {
    image: "https://i.ibb.co.com/CsTwgYpN/Futuristic-Corridor-Walk.png",
    shape: "rectangle",
    effect: "stroke",
    innerTotal: 10,
    parallaxStrength: 20,
    duration: 0.8,
    borderRadius: 20,
}

addPropertyControls(ImageLayerEffect, {
    image: {
        title: "Image",
        type: ControlType.Image,
    },
    shape: {
        title: "Shape",
        type: ControlType.Enum,
        options: ["rectangle", "triangle", "chevron", "oval"],
        optionTitles: ["Rectangle", "Triangle", "Chevron", "Oval"],
        defaultValue: "rectangle",
    },
    effect: {
        title: "Effect",
        type: ControlType.Enum,
        options: ["stroke", "shade"],
        optionTitles: ["Stroke", "Shade"],
        defaultValue: "stroke",
        displaySegmentedControl: true,
    },
    innerTotal: {
        title: "Layers",
        type: ControlType.Number,
        defaultValue: 10,
        min: 2,
        max: 20,
        step: 1,
        displayStepper: true,
    },
    parallaxStrength: {
        title: "Parallax",
        type: ControlType.Number,
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 1,
    },
    duration: {
        title: "Duration",
        type: ControlType.Number,
        defaultValue: 0.8,
        min: 0.1,
        max: 3,
        step: 0.1,
        unit: "s",
    },
    borderRadius: {
        title: "Radius",
        type: ControlType.Number,
        defaultValue: 20,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
})
