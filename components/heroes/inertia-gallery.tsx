// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, animate, useInView, useMotionValue, useSpring, useTransform, type MotionValue, type PanInfo } from "framer-motion"
import * as React from "react"

/**
Instructions:
Create a Framer component that follows the Framer component rules and achieves the user's goal.
Goal:
Create Inertia effect component and give option to ad images.
*/

type Img = { src: string; srcSet?: string; alt?: string }

type Props = {
    images: Img[]
    caption: string
    showCaption: boolean
    direction: "horizontal" | "vertical"
    itemSize: number
    itemRadius: number
    gap: number
    padding: number
    background: string
    showShadow: boolean
    shadow: string
    grabCursor: boolean
    dragElastic: number
    autoMove: boolean
    autoSpeed: number
    perspective: number
    tiltX: number
    radiusScale: number
    style?: React.CSSProperties
}

/**
 * Inertia Gallery
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 460
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function InertiaGallery(props: Props) {
    const {
        images = [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Gradient 1 - Blue",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Gradient 2 - Purple",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Gradient 3 - Orange",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Gradient 4 - Yellow",
            },
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Gradient 5 - Green",
            },
        ],
        showCaption = true,
        caption = "Spin the shapes and let go. Notice inertia is preserved.",
        direction = "horizontal",
        itemSize = 240,
        itemRadius = 28,
        gap = 44,
        padding = 60,
        background = "#000000",
        showShadow = true,
        shadow = "0 25px 80px rgba(0,0,0,0.55)",
        grabCursor = true,
        dragElastic = 0.08,
        autoMove = true,
        autoSpeed = 0.35,
        perspective = 800,
        tiltX = -20,
        radiusScale = 0.45,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = React.useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { amount: 0.2 })

    const rot = useMotionValue(0)
    const smoothRot = useSpring(rot, { stiffness: 140, damping: 28, mass: 0.6 })

    const animatorRef = React.useRef<ReturnType<typeof animate> | null>(null)
    const autoRafRef = React.useRef<number | null>(null)
    const autoLastTimeRef = React.useRef<number>(0)
    const [isDragging, setIsDragging] = React.useState(false)
    const [containerSize, setContainerSize] = React.useState({ width: 0, height: 0 })
    const startRotRef = React.useRef(0)
    const dragStartRef = React.useRef(0)

    const count = Math.max(1, images?.length || 0)
    const radius = Math.min(containerSize.width || 0, containerSize.height || 0) * radiusScale

    const dragDistancePerRotation = React.useMemo(() => {
        const base = Math.min(containerSize.width || 0, containerSize.height || 0)
        // Higher = slower rotation per pixel, resulting in a smoother drag feel
        const derived = base > 0 ? base * 2.6 : 2000
        return Math.max(800, Math.min(6000, derived))
    }, [containerSize.height, containerSize.width])

    const stopAnimation = React.useCallback(() => {
        animatorRef.current?.stop?.()
        animatorRef.current = null
    }, [])

    const stopAuto = React.useCallback(() => {
        if (typeof window === "undefined") return
        if (autoRafRef.current != null) {
            window.cancelAnimationFrame(autoRafRef.current)
            autoRafRef.current = null
        }
    }, [])

    const measure = React.useCallback(() => {
        const container = containerRef.current
        if (!container) return
        const c = container.getBoundingClientRect()
        React.startTransition(() => setContainerSize({ width: c.width, height: c.height }))
    }, [])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic) return

        measure()

        const ro = new ResizeObserver(() => measure())
        if (containerRef.current) ro.observe(containerRef.current)

        const onResize = () => measure()
        window.addEventListener("resize", onResize)

        return () => {
            window.removeEventListener("resize", onResize)
            ro.disconnect()
        }
    }, [isStatic, measure])

    React.useEffect(() => {
        if (isStatic) return
        if (!isInView) {
            stopAnimation()
            stopAuto()
        }
    }, [isInView, isStatic, stopAnimation, stopAuto])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic) return
        if (!isInView) {
            stopAuto()
            return
        }
        if (!autoMove || isDragging) {
            stopAuto()
            return
        }

        stopAuto()

        const degPerSec = Math.max(0, autoSpeed * 18)
        autoLastTimeRef.current = performance.now()

        const tick = (t: number) => {
            const last = autoLastTimeRef.current || t
            const dt = Math.min(0.05, Math.max(0, (t - last) / 1000))
            autoLastTimeRef.current = t
            rot.set(rot.get() + degPerSec * dt)
            autoRafRef.current = window.requestAnimationFrame(tick)
        }

        autoRafRef.current = window.requestAnimationFrame(tick)
        return () => stopAuto()
    }, [autoMove, autoSpeed, isDragging, isInView, isStatic, rot, stopAuto])

    const onDragStart = React.useCallback(
        (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            if (isStatic) return
            stopAuto()
            stopAnimation()
            startRotRef.current = rot.get()
            dragStartRef.current = info.point.x
            React.startTransition(() => setIsDragging(true))
        },
        [isStatic, rot, stopAnimation, stopAuto]
    )

    const onDrag = React.useCallback(
        (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            if (isStatic) return
            const delta = dragStartRef.current - info.point.x
            const progress = delta / Math.max(1, dragDistancePerRotation)
            rot.set(startRotRef.current + progress * 360)
        },
        [dragDistancePerRotation, isStatic, rot]
    )

    const onDragEnd = React.useCallback(
        (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            if (isStatic) return
            React.startTransition(() => setIsDragging(false))
            if (!isInView) return

            stopAnimation()

            const velProgressPerSec = -info.velocity.x / Math.max(1, dragDistancePerRotation)
            const velDegPerSec = velProgressPerSec * 360

            animatorRef.current = animate(rot, rot.get(), {
                type: "inertia",
                velocity: velDegPerSec,
                bounceStiffness: 0,
                bounceDamping: 0,
                timeConstant: 420,
            })
        },
        [dragDistancePerRotation, isInView, isStatic, rot, stopAnimation]
    )

    const isFixedW = style?.width === "100%"
    const isFixedH = style?.height === "100%"

    const containerStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background,
        boxShadow: showShadow ? shadow : "none",
        userSelect: "none",
        touchAction: "pan-y",
        borderRadius: 9,
        ...(isFixedW && isFixedH ? {} : { minWidth: isFixedW ? undefined : 240, minHeight: isFixedH ? undefined : 180 }),
        ...style,
    }

    const carouselStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: showCaption ? "80%" : "100%",
        perspective,
        transformStyle: "preserve-3d",
        transform: `rotateX(${tiltX}deg)`,
    }

    const itemStyle: React.CSSProperties = {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: `${itemSize}px`,
        height: `${itemSize}px`,
        borderRadius: itemRadius,
        overflow: "hidden",
        background: "rgba(255,255,255,0.06)",
        transformStyle: "preserve-3d",
        willChange: "transform",
        pointerEvents: "none",
    }

    const imgStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        pointerEvents: "none",
    }

    const cursor = !grabCursor || isStatic ? undefined : (isStatic ? undefined : "grab")

    return (
        <div ref={containerRef} style={containerStyle} aria-label="Inertia gallery" role="region">
            <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div className="carousel" style={carouselStyle} aria-hidden={RenderTarget.current() === RenderTarget.thumbnail}>
                    {(images || []).map((img, i) => (
                        <GalleryItem
                            key={i}
                            img={img}
                            index={i}
                            count={count}
                            rot={smoothRot}
                            radius={radius}
                            itemStyle={itemStyle}
                            imgStyle={imgStyle}
                        />
                    ))}

                    <motion.div
                        aria-label="Spin"
                        role="slider"
                        aria-valuemin={0}
                        aria-valuemax={360}
                        aria-valuenow={((rot.get() % 360) + 360) % 360}
                        style={{
                            position: "absolute",
                            inset: 0,
                            cursor,
                            background: "transparent",
                            touchAction: "pan-y",
                        }}
                        drag={isStatic ? false : "x"}
                        dragElastic={dragElastic}
                        dragMomentum={false}
                        onDragStart={onDragStart}
                        onDrag={onDrag}
                        onDragEnd={onDragEnd}
                        onPointerDown={() => {
                            if (isStatic) return
                            if (!grabCursor) return
                            if (typeof document === "undefined") return
                            try {
                                document.body.style.cursor = "grabbing"
                            } catch {}
                        }}
                        onPointerUp={() => {
                            if (isStatic) return
                            if (!grabCursor) return
                            if (typeof document === "undefined") return
                            try {
                                document.body.style.cursor = ""
                            } catch {}
                        }}
                    />
                </div>

                {showCaption ? (
                    <h4
                        style={{
                            color: "rgba(255,255,255,0.7)",
                            position: "relative",
                            width: "100%",
                            textAlign: "center",
                            pointerEvents: "none",
                            padding: "0px 8px",
                            boxSizing: "border-box",
                            margin: 0,
                            marginTop: "12px",
                            fontSize: 14,
                            fontWeight: 500,
                            lineHeight: "1.3em",
                        }}
                    >
                        {caption}
                    </h4>
                ) : null}
            </div>
        </div>
    )
}

type GalleryItemProps = {
    img: Img
    index: number
    count: number
    rot: MotionValue<number>
    radius: number
    itemStyle: React.CSSProperties
    imgStyle: React.CSSProperties
}

function GalleryItem(props: GalleryItemProps) {
    const { img, index, count, rot, radius, itemStyle, imgStyle } = props

    const alt = img?.alt ?? ""

    const transform = useTransform(rot, (v) => {
        const deg = (index * 360) / Math.max(1, count) + v
        const r = Number.isFinite(radius) ? radius : 0
        return `translate(-50%, -50%) rotateY(${deg}deg) translateZ(${r}px)`
    })

    return (
        <motion.div
            style={{
                ...itemStyle,
                transform,
            }}
            aria-label={alt || `Image ${index + 1}`}
            role="img"
        >
            <img src={img?.src} srcSet={img?.srcSet} alt={alt} style={imgStyle} draggable={false} />
        </motion.div>
    )
}

addPropertyControls(InertiaGallery, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.ResponsiveImage },
        maxCount: 24,
    },
    showCaption: {
        type: ControlType.Boolean,
        title: "Caption",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    caption: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Drag to spin the gallery, then release to feel the inertia.",
        displayTextArea: true,
        hidden: (p) => !p.showCaption,
    },
    autoMove: {
        type: ControlType.Boolean,
        title: "Auto Move",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoSpeed: {
        type: ControlType.Number,
        title: "Auto Speed",
        defaultValue: 0.35,
        min: 0.05,
        max: 2,
        step: 0.01,
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        description: "3D depth (smaller = more dramatic).",
        defaultValue: 800,
        min: 200,
        max: 2400,
        step: 10,
        unit: "px",
    },
    tiltX: {
        type: ControlType.Number,
        title: "Tilt X",
        description: "Tilts the carousel up/down.",
        defaultValue: -20,
        min: -75,
        max: 75,
        step: 1,
        unit: "deg",
    },
    radiusScale: {
        type: ControlType.Number,
        title: "Radius",
        description: "How far items sit from the center.",
        defaultValue: 0.45,
        min: 0.1,
        max: 0.9,
        step: 0.01,
    },
    itemSize: {
        type: ControlType.Number,
        title: "Item Size",
        defaultValue: 240,
        min: 40,
        max: 520,
        step: 1,
        unit: "px",
    },
    itemRadius: {
        type: ControlType.Number,
        title: "Item Radius",
        defaultValue: 28,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    showShadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    shadow: {
        type: ControlType.BoxShadow,
        title: "Shadow Style",
        defaultValue: "0 25px 80px rgba(0,0,0,0.55)",
        hidden: (p) => !p.showShadow,
    },
    grabCursor: {
        type: ControlType.Boolean,
        title: "Grab Cursor",
        description: "Shows grab/grabbing cursor while dragging.",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    dragElastic: {
        type: ControlType.Number,
        title: "Elastic",
        description: "How much the drag feels stretchy.",
        defaultValue: 0.08,
        min: 0,
        max: 0.6,
        step: 0.01,
    },
})