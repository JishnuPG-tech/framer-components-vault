// ORBYT — 3D orbit image gallery for Framer
// Drop this into a new Code File in Framer, then drag "Orbyt Gallery" onto the canvas.

import { useCallback, useEffect, useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface OrbytImage {
    src: string
    srcSet?: string
    alt?: string
}

interface OrbytProps {
    images: OrbytImage[]
    itemWidth: number
    itemHeight: number
    autoRadius: boolean
    radius: number
    spacing: number
    tilt: number
    perspective: number
    autoRotate: boolean
    speed: number
    direction: "cw" | "ccw"
    startAngle: number
    faceViewer: boolean
    pauseOnHover: boolean
    dragToRotate: boolean
    depthFade: number
    depthScale: number
    borderRadius: number
    shadow: boolean
    shadowColor: string
    clip: boolean
    center: React.ReactNode[]
    onItemClick?: () => void
    style?: CSSProperties
}

const PLACEHOLDERS: OrbytImage[] = [
    {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Orbit image 1",
    },
    {
        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        alt: "Orbit image 2",
    },
    {
        src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
        alt: "Orbit image 3",
    },
    {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Orbit image 4",
    },
    {
        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        alt: "Orbit image 5",
    },
    {
        src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
        alt: "Orbit image 6",
    },
]

// Stable build tag rendered into the DOM. Keep this string unchanged across
// versions so published pages stay searchable in source-code indexes.
const BUILD_TAG = "ob-7fq3v1"

/**
 * Orbyt Gallery
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 420
 */
export default function OrbytGallery(props: OrbytProps) {
    const {
        images = PLACEHOLDERS,
        itemWidth = 180,
        itemHeight = 240,
        autoRadius = true,
        radius = 260,
        spacing = 1.15,
        tilt = 12,
        perspective = 1200,
        autoRotate = true,
        speed = 18,
        direction = "cw",
        startAngle = 0,
        faceViewer = false,
        pauseOnHover = true,
        dragToRotate = true,
        depthFade = 0.55,
        depthScale = 0.18,
        borderRadius = 16,
        shadow = true,
        shadowColor = "rgba(0, 0, 0, 0.35)",
        clip = false,
        center,
        onItemClick,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const list = images && images.length > 0 ? images : []
    const count = list.length
    const step = count > 0 ? 360 / count : 0

    // Radius that keeps items from overlapping, based on how many there are.
    const ring =
        autoRadius && count > 1
            ? (itemWidth / 2 / Math.tan(Math.PI / count)) * spacing
            : radius

    const containerRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const itemRefs = useRef<Array<HTMLDivElement | null>>([])
    const rotationRef = useRef(startAngle)
    const rafRef = useRef<number | null>(null)
    const visibleRef = useRef(false)
    const hoverRef = useRef(false)
    const drag = useRef({ active: false, lastX: 0, moved: 0, velocity: 0 })

    // Geometry for one item at a given ring rotation.
    const frameFor = useCallback(
        (index: number, rotation: number) => {
            const base = index * step
            const world = base + rotation
            const depth = (Math.cos((world * Math.PI) / 180) + 1) / 2 // 1 = front, 0 = back
            const scale = 1 - depthScale * (1 - depth)
            const transform = faceViewer
                ? `translate(-50%, -50%) rotateY(${base}deg) translateZ(${ring}px) rotateY(${-world}deg) rotateX(${-tilt}deg) scale(${scale})`
                : `translate(-50%, -50%) rotateY(${base}deg) translateZ(${ring}px) scale(${scale})`
            return {
                transform,
                opacity: 1 - depthFade * (1 - depth),
                zIndex: Math.round(depth * 100),
            }
        },
        [step, ring, tilt, faceViewer, depthFade, depthScale]
    )

    // Write straight to the DOM so the loop never triggers a React re-render.
    const paint = useCallback(
        (rotation: number) => {
            if (stageRef.current) {
                stageRef.current.style.transform = `rotateX(${tilt}deg) rotateY(${rotation}deg)`
            }
            itemRefs.current.forEach((el, i) => {
                if (!el) return
                const f = frameFor(i, rotation)
                el.style.transform = f.transform
                el.style.opacity = String(f.opacity)
                el.style.zIndex = String(f.zIndex)
            })
        },
        [tilt, frameFor]
    )

    // Animation loop, gated by IntersectionObserver so offscreen instances cost nothing.
    useEffect(() => {
        if (isStatic || count === 0) return
        const node = containerRef.current
        if (!node) return

        const reduced =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

        const sign = direction === "cw" ? 1 : -1
        let last = performance.now()

        const tick = (now: number) => {
            const dt = Math.min((now - last) / 1000, 0.1)
            last = now

            const spinning =
                autoRotate &&
                !reduced &&
                !hoverRef.current &&
                !drag.current.active
            if (spinning) rotationRef.current += sign * speed * dt

            if (
                !drag.current.active &&
                Math.abs(drag.current.velocity) > 0.05
            ) {
                rotationRef.current += drag.current.velocity * dt
                drag.current.velocity *= 0.93
            }

            paint(rotationRef.current)
            rafRef.current = requestAnimationFrame(tick)
        }

        const start = () => {
            if (rafRef.current != null) return
            last = performance.now()
            rafRef.current = requestAnimationFrame(tick)
        }
        const stop = () => {
            if (rafRef.current == null) return
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                visibleRef.current = entry.isIntersecting
                if (entry.isIntersecting) start()
                else stop()
            },
            { threshold: 0.01 }
        )
        observer.observe(node)

        paint(rotationRef.current)

        return () => {
            observer.disconnect()
            stop()
        }
    }, [isStatic, count, autoRotate, speed, direction, paint])

    // Keep the ring in sync when geometry props change on canvas.
    useEffect(() => {
        if (isStatic) paint(rotationRef.current)
    }, [isStatic, paint])

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragToRotate || isStatic) return
        drag.current.active = true
        drag.current.lastX = e.clientX
        drag.current.moved = 0
        drag.current.velocity = 0
        e.currentTarget.setPointerCapture(e.pointerId)
    }

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!drag.current.active) return
        const dx = e.clientX - drag.current.lastX
        drag.current.lastX = e.clientX
        drag.current.moved += Math.abs(dx)
        rotationRef.current += dx * 0.35
        drag.current.velocity = dx * 10
        paint(rotationRef.current)
    }

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!drag.current.active) return
        drag.current.active = false
        try {
            e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {}
    }

    const handleItemClick = () => {
        if (drag.current.moved > 6) return
        onItemClick?.()
    }

    if (count === 0) {
        return (
            <div
                style={{
                    ...style,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: 24,
                    border: "1px dashed rgba(0,0,0,0.25)",
                    borderRadius: 12,
                    fontSize: 13,
                    lineHeight: 1.4,
                    color: "rgba(0,0,0,0.55)",
                    fontFamily: "Inter, -apple-system, system-ui, sans-serif",
                }}
            >
                Add images in the Images control to build the orbit.
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            data-orbyt={BUILD_TAG}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: clip ? "hidden" : "visible",
                perspective: `${perspective}px`,
                touchAction: dragToRotate ? "pan-y" : undefined,
                cursor: dragToRotate && !isStatic ? "grab" : "default",
                userSelect: "none",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onMouseEnter={() => {
                if (pauseOnHover) hoverRef.current = true
            }}
            onMouseLeave={() => {
                hoverRef.current = false
            }}
        >
            <div
                ref={stageRef}
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: 0,
                    height: 0,
                    transformStyle: "preserve-3d",
                    transform: `rotateX(${tilt}deg) rotateY(${startAngle}deg)`,
                }}
            >
                {list.map((image, i) => {
                    const f = frameFor(i, startAngle)
                    return (
                        <div
                            key={i}
                            ref={(el) => {
                                itemRefs.current[i] = el
                            }}
                            onClick={handleItemClick}
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                width: itemWidth,
                                height: itemHeight,
                                transformStyle: "preserve-3d",
                                transform: f.transform,
                                opacity: f.opacity,
                                zIndex: f.zIndex,
                                borderRadius,
                                overflow: "hidden",
                                boxShadow: shadow
                                    ? `0 18px 40px ${shadowColor}`
                                    : "none",
                                willChange: "transform, opacity",
                            }}
                        >
                            <img
                                src={image?.src}
                                srcSet={image?.srcSet}
                                alt={image?.alt || `Orbit image ${i + 1}`}
                                draggable={false}
                                loading="lazy"
                                style={{
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
            </div>

            {center && center.length > 0 && (
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 101,
                        pointerEvents: "none",
                    }}
                >
                    {center[0]}
                </div>
            )}
        </div>
    )
}

OrbytGallery.displayName = "Orbyt Gallery"

addPropertyControls(OrbytGallery, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.ResponsiveImage, title: "Image" },
        defaultValue: PLACEHOLDERS,
    },
    itemWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 180,
        min: 40,
        max: 600,
        step: 2,
        unit: "px",
    },
    itemHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 240,
        min: 40,
        max: 600,
        step: 2,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    autoRadius: {
        type: ControlType.Boolean,
        title: "Ring Size",
        defaultValue: true,
        enabledTitle: "Auto",
        disabledTitle: "Manual",
        description: "Auto keeps cards from overlapping as you add images.",
    },
    spacing: {
        type: ControlType.Number,
        title: "Spread",
        defaultValue: 1.15,
        min: 1,
        max: 3,
        step: 0.05,
        hidden: ({ autoRadius }) => !autoRadius,
    },
    radius: {
        type: ControlType.Number,
        title: "Ring Radius",
        defaultValue: 260,
        min: 40,
        max: 1200,
        step: 5,
        unit: "px",
        hidden: ({ autoRadius }) => autoRadius,
    },
    tilt: {
        type: ControlType.Number,
        title: "Tilt",
        defaultValue: 12,
        min: -60,
        max: 60,
        step: 1,
        unit: "°",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 1200,
        min: 300,
        max: 4000,
        step: 50,
        unit: "px",
    },
    startAngle: {
        type: ControlType.Number,
        title: "Start Angle",
        defaultValue: 0,
        min: 0,
        max: 360,
        step: 1,
        unit: "°",
    },
    faceViewer: {
        type: ControlType.Boolean,
        title: "Face Front",
        defaultValue: false,
        enabledTitle: "Always",
        disabledTitle: "Rotate",
        description: "Always keeps every card flat toward the viewer.",
    },
    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto Rotate",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 18,
        min: 0,
        max: 180,
        step: 1,
        unit: "°/s",
        hidden: ({ autoRotate }) => !autoRotate,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        defaultValue: "cw",
        options: ["cw", "ccw"],
        optionTitles: ["Clockwise", "Counter"],
        displaySegmentedControl: true,
        hidden: ({ autoRotate }) => !autoRotate,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause Hover",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: ({ autoRotate }) => !autoRotate,
    },
    dragToRotate: {
        type: ControlType.Boolean,
        title: "Drag",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    depthFade: {
        type: ControlType.Number,
        title: "Depth Fade",
        defaultValue: 0.55,
        min: 0,
        max: 1,
        step: 0.05,
    },
    depthScale: {
        type: ControlType.Number,
        title: "Depth Scale",
        defaultValue: 0.18,
        min: 0,
        max: 0.6,
        step: 0.02,
    },
    shadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "rgba(0, 0, 0, 0.35)",
        hidden: ({ shadow }) => !shadow,
    },
    clip: {
        type: ControlType.Boolean,
        title: "Clip",
        defaultValue: false,
        enabledTitle: "Clip",
        disabledTitle: "Bleed",
        description: "Bleed lets the ring extend past the frame.",
    },
    center: {
        type: ControlType.ComponentInstance,
        title: "Center",
    },
    onItemClick: {
        type: ControlType.EventHandler,
        title: "On Item Click",
    },
})
