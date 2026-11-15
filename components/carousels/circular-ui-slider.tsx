import * as React from "react"
import { useRef, useEffect } from "react"
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
 * 3D RING CAROUSEL
 *
 * UPDATE: FRONT-SAFE DEPTH FADING & SMART CAMERA
 * Implemented a 'fadeStart' threshold. Items within this front angle stay 100%
 * native and fully opaque. Features manual frame pushing to keep the editor
 * live preview 100% accurate and interactive without draining CPU via infinite loops.
 */

export default function RingCarousel3D(incomingProps) {
    // FRAMER STATIC RENDER CHECK (Rule 12)
    const isStatic = useIsStaticRenderer()

    // STEP 1: Intercept & Flatten (Framer Prop-Flattening Rule)
    const props = {
        ...incomingProps,
        ...(incomingProps.content || {}),
        ...(incomingProps.layout || {}),
        ...(incomingProps.behavior || {}),
    }

    const editorPreview = props.editorPreview ?? true
    const shouldAnimate = !isStatic && editorPreview

    // Core Refs
    const mountRef = useRef(null)
    const containerRef = useRef(null)
    const itemRefs = useRef([])
    const rafId = useRef(null)
    const isIntersecting = useRef(true)
    const renderLoopRef = useRef(null)

    // Animation & Physics Refs (Bypassing React State)
    const rotation = useRef(0)
    const targetRotation = useRef(0)
    const velocity = useRef(0)
    const isDragging = useRef(false)
    const lastMouseX = useRef(0)

    // Smart Spacing Refs
    const itemAngles = useRef([])
    const lastWidths = useRef([])
    const lastRadius = useRef(props.radius)

    // VIEWPORT GATING: Pause execution when off-screen
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                isIntersecting.current = entry.isIntersecting
            },
            { threshold: 0.1 }
        )
        if (mountRef.current) observer.observe(mountRef.current)
        return () => observer.disconnect()
    }, [])

    // HIGH-PERFORMANCE ANIMATION & TRANSFORM LOOP
    useEffect(() => {
        let lastTime = performance.now()
        let lastRenderTime = performance.now()

        const renderLoop = (time = performance.now()) => {
            if (shouldAnimate) {
                rafId.current = requestAnimationFrame(renderLoop)
            }

            if (!isIntersecting.current && shouldAnimate) return

            const inEditor = RenderTarget.current() === RenderTarget.canvas

            // EDITOR FPS CONTROL: Throttle frame rate in editor canvas
            if (inEditor && props.editorFPS < 60 && shouldAnimate) {
                const minFrameTime = 1000 / props.editorFPS
                if (time - lastRenderTime < minFrameTime) {
                    return // Skip rendering this frame
                }
                lastRenderTime = time
            }

            const delta = (time - lastTime) / 1000
            lastTime = time

            // 0. SMART SPACING CALCULATION (Equal Gaps via Arc Length)
            const currentWidths = itemRefs.current.map((el) =>
                el ? el.offsetWidth : 0
            )
            let needsRecalc = false

            if (currentWidths.length !== lastWidths.current.length) {
                needsRecalc = true
            } else {
                for (let i = 0; i < currentWidths.length; i++) {
                    if (currentWidths[i] !== lastWidths.current[i]) {
                        needsRecalc = true
                        break
                    }
                }
            }

            if (props.radius !== lastRadius.current) needsRecalc = true

            if (needsRecalc && currentWidths.length > 0) {
                lastWidths.current = currentWidths
                lastRadius.current = props.radius

                const totalWidth = currentWidths.reduce((a, b) => a + b, 0)
                const circumference = 2 * Math.PI * props.radius
                const gapArc =
                    (circumference - totalWidth) / currentWidths.length

                const newAngles = []
                let currentAngle = 0

                for (let i = 0; i < currentWidths.length; i++) {
                    newAngles.push(currentAngle)
                    const nextI = (i + 1) % currentWidths.length
                    const arcToNext =
                        currentWidths[i] / 2 + gapArc + currentWidths[nextI] / 2
                    const angleToNext = (arcToNext / circumference) * 360
                    currentAngle += angleToNext
                }

                itemAngles.current = newAngles
            } else if (itemAngles.current.length !== currentWidths.length) {
                itemAngles.current = currentWidths.map(
                    (_, i) => i * (360 / (currentWidths.length || 1))
                )
            }

            // 1. Physics & Rotation Calculation
            if (!isDragging.current) {
                if (props.autoRotate && shouldAnimate) {
                    targetRotation.current -= props.autoRotateSpeed * delta * 15
                } else {
                    targetRotation.current +=
                        velocity.current * props.dragSensitivity
                    if (shouldAnimate) velocity.current *= 0.92
                }
            }

            // BYPASS LERP IN STATIC MODE (Snaps instantly for live preview accuracy)
            if (!shouldAnimate) {
                rotation.current = targetRotation.current
            } else {
                rotation.current +=
                    (targetRotation.current - rotation.current) * 0.08
            }

            // 2. Apply calculated Flat-3D Transforms to Items
            if (itemRefs.current.length > 0) {
                const currentRot = rotation.current

                itemRefs.current.forEach((el, i) => {
                    if (!el) return
                    const baseAngle = itemAngles.current[i] || 0
                    const absoluteAngle = currentRot + baseAngle

                    // Combined transform injection
                    el.style.transform = `
                        perspective(${props.perspective}px)
                        translateZ(${-props.radius}px) 
                        rotateX(${props.tilt}deg) 
                        rotateY(${absoluteAngle}deg) 
                        translateZ(${props.radius}px)
                    `

                    // Depth Sorting (Z-Index)
                    const rad = absoluteAngle * (Math.PI / 180)
                    const zDepth = Math.cos(rad)
                    el.style.zIndex = Math.round((zDepth + 1) * 1000)

                    // Depth Fading
                    let normalizedAngle = absoluteAngle % 360
                    if (normalizedAngle < -180) normalizedAngle += 360
                    if (normalizedAngle > 180) normalizedAngle -= 360

                    let opacity = 1
                    if (props.enableFade) {
                        const absAngle = Math.abs(normalizedAngle)
                        if (absAngle <= props.fadeStart) {
                            opacity = 1
                        } else {
                            const fadeRange = props.fadeAngle - props.fadeStart
                            if (fadeRange > 0) {
                                opacity =
                                    1 - (absAngle - props.fadeStart) / fadeRange
                            } else {
                                opacity = 1 - absAngle / props.fadeAngle
                            }
                        }
                        opacity = Math.max(0, Math.min(1, opacity))
                        el.style.opacity = opacity.toFixed(3)
                    }

                    el.style.pointerEvents = opacity < 0.2 ? "none" : "auto"

                    // Accessibility: dynamically hide back-facing items from screen readers
                    if (opacity < 0.2) {
                        el.setAttribute("aria-hidden", "true")
                    } else {
                        el.removeAttribute("aria-hidden")
                    }
                })
            }
        }

        renderLoopRef.current = renderLoop

        if (shouldAnimate) {
            rafId.current = requestAnimationFrame(renderLoop)
        } else {
            // Manual push when loop is paused
            renderLoop()
            // Double push to ensure DOM reflow calculates widths correctly
            setTimeout(() => renderLoop(), 50)
        }

        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current)
        }
    }, [
        shouldAnimate,
        props.autoRotate,
        props.autoRotateSpeed,
        props.radius,
        props.tilt,
        props.perspective,
        props.editorFPS,
        props.enableFade,
        props.fadeStart,
        props.fadeAngle,
        props.dragSensitivity,
    ])

    // RESIZE OBSERVER (Async media & layout safety for paused loop)
    useEffect(() => {
        if (!containerRef.current) return
        const ro = new ResizeObserver(() => {
            if (!shouldAnimate && renderLoopRef.current) {
                renderLoopRef.current()
            }
        })
        ro.observe(containerRef.current)
        itemRefs.current.forEach((el) => {
            if (el) ro.observe(el)
        })
        return () => ro.disconnect()
    }, [shouldAnimate, props.children])

    // INTERACTION HANDLERS
    const handleKeyDown = (e) => {
        const numItems = itemRefs.current.length || 1
        const snapAngle = 360 / numItems
        let delta = 0

        if (e.key === "ArrowLeft") delta = snapAngle
        else if (e.key === "ArrowRight") delta = -snapAngle

        if (delta !== 0) {
            e.preventDefault() // prevent standard scrolling
            targetRotation.current += delta

            // Push frame manually if the auto loop is paused
            if (!shouldAnimate && renderLoopRef.current) {
                renderLoopRef.current()
            }
        }
    }

    const handlePointerDown = (e) => {
        isDragging.current = true
        lastMouseX.current = e.clientX
        velocity.current = 0
        if (mountRef.current) mountRef.current.style.cursor = "grabbing"
    }

    const handlePointerMove = (e) => {
        if (!isDragging.current) return
        const deltaX = e.clientX - lastMouseX.current
        lastMouseX.current = e.clientX

        targetRotation.current += deltaX * props.dragSensitivity
        velocity.current = deltaX

        if (Math.abs(deltaX) > 3 && containerRef.current) {
            containerRef.current.style.pointerEvents = "none"
        }

        // PUSH FRAME MANUALLY IF PAUSED
        if (!shouldAnimate && renderLoopRef.current) {
            renderLoopRef.current()
        }
    }

    const handlePointerUp = () => {
        isDragging.current = false
        if (mountRef.current) mountRef.current.style.cursor = "grab"
        if (containerRef.current)
            containerRef.current.style.pointerEvents = "auto"
    }

    // CHILD LAYOUT & AUTO-FILL CALCULATION
    const childrenArray = React.Children.toArray(props.children)
    let displayChildren = childrenArray

    if (props.autoFill && childrenArray.length > 0) {
        displayChildren = Array.from({ length: props.fillCount }).map(
            (_, i) => childrenArray[i % childrenArray.length]
        )
    }

    const numChildren = displayChildren.length
    itemRefs.current.length = numChildren

    // EDITOR QUALITY CONTROL
    const inEditor = RenderTarget.current() === RenderTarget.canvas
    const qualityScale = inEditor ? Math.max(0.1, props.editorQuality / 100) : 1
    const currentZoom = props.zoom !== undefined ? props.zoom : 1

    return (
        <div
            ref={mountRef}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label="3D Ring Carousel"
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "visible",
                cursor: "grab",
                ...props.style,
            }}
            onKeyDown={handleKeyDown}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: `scale(${1 / qualityScale})`,
                    transformOrigin: "center center",
                    pointerEvents: "none",
                }}
            >
                <div
                    ref={containerRef}
                    style={{
                        width: "100%",
                        height: "100%",
                        position: "absolute",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transform: `scale(${qualityScale * currentZoom}) translateZ(0)`,
                        transformOrigin: "center center",
                        pointerEvents: "auto",
                        opacity: qualityScale < 1 ? 0.999 : 1,
                        filter:
                            qualityScale < 1
                                ? "drop-shadow(0px 0px 0px rgba(0,0,0,0))"
                                : "none",
                        contain: qualityScale < 1 ? "paint" : "none",
                        willChange:
                            qualityScale < 1
                                ? "transform, opacity, filter"
                                : "auto",
                    }}
                >
                    {displayChildren.map((child, index) => {
                        return (
                            <div
                                key={index}
                                ref={(el) => (itemRefs.current[index] = el)}
                                role="group"
                                aria-roledescription="slide"
                                aria-label={`Item ${index + 1} of ${displayChildren.length}`}
                                style={{
                                    position: "absolute",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "max-content",
                                    height: "max-content",
                                }}
                            >
                                {child}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// STEP 2: Nested Defaults
RingCarousel3D.defaultProps = {
    children: [],
    editorPreview: true,
    editorFPS: 60,
    editorQuality: 100,
    content: { autoFill: false, fillCount: 8 },
    layout: { radius: 600, tilt: -5, perspective: 1200, zoom: 1 },
    behavior: {
        autoRotate: true,
        autoRotateSpeed: 1,
        dragSensitivity: 0.6,
        enableFade: true,
        fadeStart: 60,
        fadeAngle: 110,
    },
}

// STEP 3: UI Categorization
addPropertyControls(RingCarousel3D, {
    editorPreview: {
        title: "Preview",
        type: ControlType.Boolean,
        defaultValue: true,
        description: "Run animation loop inside Framer canvas.",
    },
    editorFPS: {
        title: "Editor FPS",
        type: ControlType.Number,
        defaultValue: 60,
        min: 1,
        max: 60,
        step: 1,
        description:
            "Limit the preview frame rate in the Framer canvas to save CPU.",
        hidden(props) {
            return !props.editorPreview
        },
    },
    editorQuality: {
        title: "Editor Quality",
        type: ControlType.Number,
        defaultValue: 100,
        min: 10,
        max: 100,
        step: 1,
        unit: "%",
        description:
            "Lower rendering resolution in the Framer canvas to save GPU resources.",
        hidden(props) {
            return !props.editorPreview
        },
    },
    children: {
        title: "Cards",
        type: ControlType.Array,
        control: { type: ControlType.ComponentInstance },
        description: "Connect native Framer components to form the ring.",
    },
    content: {
        title: "Content",
        type: ControlType.Object,
        controls: {
            autoFill: {
                title: "Auto Fill",
                type: ControlType.Boolean,
                defaultValue: false,
                description:
                    "Repeat attached frames to fill the ring automatically.",
            },
            fillCount: {
                title: "Total Slots",
                type: ControlType.Number,
                defaultValue: 8,
                min: 3,
                max: 30,
                step: 1,
                unit: "x",
                hidden(props) {
                    return !props.autoFill
                },
                description: "The total number of slots to generate.",
            },
        },
    },
    layout: {
        title: "3D Layout",
        type: ControlType.Object,
        controls: {
            radius: {
                title: "Ring Radius",
                type: ControlType.Number,
                defaultValue: 600,
                min: 200,
                max: 3000,
                step: 10,
                unit: "px",
                displaySegmentedControl: false,
                description: "Distance from the center (px).",
            },
            tilt: {
                title: "Camera Tilt",
                type: ControlType.Number,
                defaultValue: -5,
                min: -45,
                max: 45,
                step: 1,
                unit: "deg",
                description: "Up/down viewing angle (deg).",
            },
            perspective: {
                title: "Perspective",
                type: ControlType.Number,
                defaultValue: 1200,
                min: 300,
                max: 4000,
                step: 50,
                unit: "px",
                description: "3D distortion intensity (px).",
            },
            zoom: {
                title: "Camera Zoom",
                type: ControlType.Number,
                defaultValue: 1,
                min: 0.1,
                max: 5,
                step: 0.1,
                unit: "x",
                description: "Zoom in or out of the 3D scene.",
            },
        },
    },
    behavior: {
        title: "Behavior",
        type: ControlType.Object,
        controls: {
            autoRotate: {
                title: "Auto Spin",
                type: ControlType.Boolean,
                defaultValue: true,
                description: "Continuously rotate the ring.",
            },
            autoRotateSpeed: {
                title: "Spin Speed",
                type: ControlType.Number,
                defaultValue: 1,
                min: -10,
                max: 10,
                step: 0.1,
                unit: "x",
                description: "Multiplier for auto rotation.",
            },
            dragSensitivity: {
                title: "Drag Swipe",
                type: ControlType.Number,
                defaultValue: 0.6,
                min: 0.1,
                max: 5,
                step: 0.1,
                unit: "x",
                description: "Sensitivity of mouse/touch drag.",
            },
            enableFade: {
                title: "Depth Fade",
                type: ControlType.Boolean,
                defaultValue: true,
                description: "Fade out items in the background.",
            },
            fadeStart: {
                title: "Fade Start",
                type: ControlType.Number,
                defaultValue: 60,
                min: 0,
                max: 180,
                step: 1,
                unit: "deg",
                hidden(props) {
                    return !props.enableFade
                },
                description: "Angle where front items begin to fade (deg).",
            },
            fadeAngle: {
                title: "Fade Limit",
                type: ControlType.Number,
                defaultValue: 110,
                min: 45,
                max: 180,
                step: 1,
                unit: "deg",
                hidden(props) {
                    return !props.enableFade
                },
                description: "Angle at which items fully vanish (deg).",
            },
        },
    },
})
