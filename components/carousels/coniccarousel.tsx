// Carousel with conic perspective - items rotate around central vertical axis with depth
import { useEffect, useState, useRef, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useSpring, animate, useInView } from "framer-motion"

interface CarouselItem {
    image: { src: string; alt: string }
    title: string
    link?: string
    shape?: "rectangle" | "rounded" | "circle" | "hexagon" | "custom"
    clipPath?: string
    cornerRadius?: number
}

interface ConicCarouselProps {
    items: CarouselItem[]
    autoRotate: boolean
    rotationSpeed: number
    itemWidth: number
    itemHeight: number
    radius: number
    tiltAngle: number
    initialLayout: "ring" | "row"
    initialLayoutDuration: number
    rowAngle: number
    backgroundColor: string
    titleColor: string
    titleFont: any
    onItemClick?: (item: CarouselItem, index: number) => void
    carouselEasing: string
    itemSpringStiffness: number
    itemSpringDamping: number
    openLinksInNewTab: boolean
    enable3DNavigation: boolean
    panSensitivity: number
    rotateSensitivity: number
    zoomSensitivity: number
    minZoom: number
    maxZoom: number
    animationStart: "immediate" | "inView"
    inViewPlayMode: "always" | "once"
    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ConicCarousel(props: ConicCarouselProps) {
    const {
        items = [],
        autoRotate = true,
        rotationSpeed = 20,
        itemWidth = 200,
        itemHeight = 280,
        radius = 300,
        tiltAngle = 15,
        initialLayout = "row",
        initialLayoutDuration = 1.2,
        rowAngle = 18,
        backgroundColor = "#F5F5F5",
        titleColor = "#000000",
        titleFont,
        onItemClick,
        carouselEasing = "linear",
        itemSpringStiffness = 220,
        itemSpringDamping = 26,
        openLinksInNewTab = false,
        enable3DNavigation = true,
        panSensitivity = 1,
        rotateSensitivity = 0.5,
        zoomSensitivity = 1,
        minZoom = -1200,
        maxZoom = 400,
        animationStart = "immediate",
        inViewPlayMode = "always",
        style,
    } = props

    const rotation = useMotionValue(0)
    const pitch = useMotionValue(tiltAngle)
    const panX = useMotionValue(0)
    const panY = useMotionValue(0)
    const zoom = useMotionValue(0)
    const layoutProgress = useMotionValue(initialLayout === "row" ? 0 : 1)

    const smoothRotation = useSpring(rotation, { stiffness: itemSpringStiffness, damping: itemSpringDamping })
    const smoothPitch = useSpring(pitch, { stiffness: itemSpringStiffness, damping: itemSpringDamping })
    const smoothLayout = useSpring(layoutProgress, { stiffness: itemSpringStiffness, damping: itemSpringDamping })

    const [layoutT, setLayoutT] = useState(() => smoothLayout.get())

    const [isDragging, setIsDragging] = useState(false)
    const dragStartX = useRef(0)
    const dragStartY = useRef(0)
    const dragStartRotation = useRef(0)
    const dragStartPitch = useRef(0)
    const dragStartPan = useRef({ x: 0, y: 0 })
    const touchMode = useRef<"none" | "rotate" | "pinch">("none")
    const touchStart = useRef({ x: 0, y: 0 })
    const touchStartRotation = useRef(0)
    const touchStartPitch = useRef(0)
    const touchStartPan = useRef({ x: 0, y: 0 })
    const touchStartZoom = useRef(0)
    const pinchStartDistance = useRef(0)
    const pinchStartMidpoint = useRef({ x: 0, y: 0 })
    const containerRef = useRef<HTMLDivElement>(null)
    const isStatic = RenderTarget.current() === RenderTarget.thumbnail
    const inView = useInView(containerRef, { amount: 0.2, once: inViewPlayMode === "once" })
    const shouldAnimate = !isStatic && (animationStart === "immediate" || inView)
    const introPlayedRef = useRef(false)
    const [itemRotations, setItemRotations] = useState<{ x: number; y: number }[]>([])
    const [draggingItemIndex, setDraggingItemIndex] = useState<number | null>(null)
    const itemDragStartPos = useRef({ x: 0, y: 0 })
    const itemDragStartRotation = useRef({ x: 0, y: 0 })

    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

    useEffect(() => {
        if (typeof window === "undefined") return
        if (!containerRef.current) return
        if (typeof ResizeObserver === "undefined") return

        const node = containerRef.current
        const ro = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (!entry) return
            const cr = entry.contentRect
            startTransition(() => setContainerSize({ width: cr.width, height: cr.height }))
        })

        ro.observe(node)
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        if (isStatic) return
        const unsubscribe = smoothLayout.on("change", (v) => {
            startTransition(() => setLayoutT(v))
        })
        return () => {
            unsubscribe()
        }
    }, [smoothLayout, isStatic])

    useEffect(() => {
        pitch.set(tiltAngle)
    }, [tiltAngle, pitch])

    useEffect(() => {
        layoutProgress.set(initialLayout === "row" ? 0 : 1)

        introPlayedRef.current = false

        if (isStatic) return
        if (initialLayout !== "row") return

        if (!shouldAnimate) return

        const controls = animate(layoutProgress, 1, {
            duration: Math.max(0.1, initialLayoutDuration),
            ease: "easeInOut",
        })

        introPlayedRef.current = true

        return () => controls.stop()
    }, [initialLayout, initialLayoutDuration, layoutProgress, isStatic, shouldAnimate])

    useEffect(() => {
        startTransition(() => setItemRotations(items.map(() => ({ x: 0, y: 0 }))))
    }, [items.length])

    useEffect(() => {
        if (isStatic || !autoRotate || isDragging) return
        if (!shouldAnimate) return

        const controls = animate(rotation, rotation.get() + 360, {
            duration: rotationSpeed,
            repeat: Number.POSITIVE_INFINITY,
            ease: carouselEasing as any,
        })

        return () => controls.stop()
    }, [autoRotate, rotationSpeed, isDragging, rotation, isStatic, carouselEasing, shouldAnimate])

    const handleMouseDown = (e: MouseEvent | React.MouseEvent) => {
        if (isStatic || !enable3DNavigation) return
        startTransition(() => setIsDragging(true))
        dragStartX.current = (e as MouseEvent).clientX
        dragStartY.current = (e as MouseEvent).clientY
        dragStartRotation.current = rotation.get()
        dragStartPitch.current = pitch.get()
        dragStartPan.current = { x: panX.get(), y: panY.get() }
    }

    const handleItemClick = (item: CarouselItem, index: number, e: React.MouseEvent) => {
        e.stopPropagation()
        if (isDragging || draggingItemIndex !== null) return
        if (onItemClick) {
            // If an explicit item click action is wired up, prefer it over navigation
            e.preventDefault()
            onItemClick(item, index)
        }
    }

    const handleItemMouseDown = (index: number, e: React.MouseEvent) => {
        e.stopPropagation()
        if (isStatic) return
        startTransition(() => setDraggingItemIndex(index))
        itemDragStartPos.current = { x: e.clientX, y: e.clientY }
        itemDragStartRotation.current = itemRotations[index] || { x: 0, y: 0 }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || isStatic || !enable3DNavigation) return

        const deltaX = e.clientX - dragStartX.current
        const deltaY = e.clientY - dragStartY.current

        // Shift = pan, otherwise rotate
        if (e.shiftKey) {
            panX.set(dragStartPan.current.x + deltaX * panSensitivity)
            panY.set(dragStartPan.current.y + deltaY * panSensitivity)
            return
        }

        const rotationDelta = deltaX * rotateSensitivity
        const pitchDelta = -deltaY * rotateSensitivity
        rotation.set(dragStartRotation.current + rotationDelta)
        pitch.set(dragStartPitch.current + pitchDelta)
    }

    const handleMouseUp = () => {
        if (isStatic) return
        startTransition(() => setIsDragging(false))
    }

    const handleWheel = (e: React.WheelEvent) => {
        if (isStatic || !enable3DNavigation) return
        e.preventDefault()

        const next = zoom.get() - e.deltaY * zoomSensitivity
        const clamped = Math.max(minZoom, Math.min(maxZoom, next))
        zoom.set(clamped)
    }

    const getTouchDistance = (t1: React.Touch, t2: React.Touch) => {
        const dx = t2.clientX - t1.clientX
        const dy = t2.clientY - t1.clientY
        return Math.hypot(dx, dy)
    }

    const getTouchMidpoint = (t1: React.Touch, t2: React.Touch) => {
        return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 }
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        if (isStatic || !enable3DNavigation) return
        if (e.touches.length === 1) {
            const t = e.touches[0]
            touchMode.current = "rotate"
            startTransition(() => setIsDragging(true))
            touchStart.current = { x: t.clientX, y: t.clientY }
            touchStartRotation.current = rotation.get()
            touchStartPitch.current = pitch.get()
            touchStartPan.current = { x: panX.get(), y: panY.get() }
        } else if (e.touches.length >= 2) {
            const t1 = e.touches[0]
            const t2 = e.touches[1]
            touchMode.current = "pinch"
            startTransition(() => setIsDragging(true))
            pinchStartDistance.current = getTouchDistance(t1, t2)
            pinchStartMidpoint.current = getTouchMidpoint(t1, t2)
            touchStartPan.current = { x: panX.get(), y: panY.get() }
            touchStartZoom.current = zoom.get()
        }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isStatic || !enable3DNavigation) return
        if (!isDragging) return

        if (touchMode.current === "rotate" && e.touches.length === 1) {
            const t = e.touches[0]
            const deltaX = t.clientX - touchStart.current.x
            const deltaY = t.clientY - touchStart.current.y
            const rotationDelta = deltaX * rotateSensitivity
            const pitchDelta = -deltaY * rotateSensitivity
            rotation.set(touchStartRotation.current + rotationDelta)
            pitch.set(touchStartPitch.current + pitchDelta)
            e.preventDefault()
            return
        }

        if (touchMode.current === "pinch" && e.touches.length >= 2) {
            const t1 = e.touches[0]
            const t2 = e.touches[1]

            const distance = getTouchDistance(t1, t2)
            const midpoint = getTouchMidpoint(t1, t2)

            const startDist = pinchStartDistance.current || 1
            const ratio = distance / startDist
            const deltaZoom = (ratio - 1) * 600 * zoomSensitivity
            const nextZoom = touchStartZoom.current + deltaZoom
            zoom.set(Math.max(minZoom, Math.min(maxZoom, nextZoom)))

            const deltaMidX = midpoint.x - pinchStartMidpoint.current.x
            const deltaMidY = midpoint.y - pinchStartMidpoint.current.y
            panX.set(touchStartPan.current.x + deltaMidX * panSensitivity)
            panY.set(touchStartPan.current.y + deltaMidY * panSensitivity)

            e.preventDefault()
        }
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (isStatic) return

        if (e.touches.length === 1) {
            // Downgrade back to rotate mode if one finger remains
            const t = e.touches[0]
            touchMode.current = "rotate"
            touchStart.current = { x: t.clientX, y: t.clientY }
            touchStartRotation.current = rotation.get()
            touchStartPitch.current = pitch.get()
            touchStartPan.current = { x: panX.get(), y: panY.get() }
            return
        }

        if (e.touches.length === 0) {
            touchMode.current = "none"
            startTransition(() => setIsDragging(false))
        }
    }

    useEffect(() => {
        if (isStatic) return

        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!isDragging || !enable3DNavigation) return
            const deltaX = e.clientX - dragStartX.current
            const deltaY = e.clientY - dragStartY.current

            // Shift = pan, otherwise rotate
            if (e.shiftKey) {
                panX.set(dragStartPan.current.x + deltaX * panSensitivity)
                panY.set(dragStartPan.current.y + deltaY * panSensitivity)
                return
            }

            const rotationDelta = deltaX * rotateSensitivity
            const pitchDelta = -deltaY * rotateSensitivity
            rotation.set(dragStartRotation.current + rotationDelta)
            pitch.set(dragStartPitch.current + pitchDelta)
        }

        const handleGlobalMouseUp = () => {
            startTransition(() => setIsDragging(false))
        }

        if (isDragging) {
            window.addEventListener("mousemove", handleGlobalMouseMove)
            window.addEventListener("mouseup", handleGlobalMouseUp)
        }

        return () => {
            window.removeEventListener("mousemove", handleGlobalMouseMove)
            window.removeEventListener("mouseup", handleGlobalMouseUp)
        }
    }, [isDragging, rotation, pitch, panX, panY, isStatic, enable3DNavigation, panSensitivity, rotateSensitivity])

    useEffect(() => {
        if (isStatic) return

        const handleItemDragMove = (e: MouseEvent) => {
            if (draggingItemIndex === null) return
            const deltaX = e.clientX - itemDragStartPos.current.x
            const deltaY = e.clientY - itemDragStartPos.current.y
            const rotationY = deltaX * 0.5
            const rotationX = -deltaY * 0.5
            
            startTransition(() => {
                setItemRotations(prev => {
                    const updated = [...prev]
                    updated[draggingItemIndex] = {
                        x: itemDragStartRotation.current.x + rotationX,
                        y: itemDragStartRotation.current.y + rotationY,
                    }
                    return updated
                })
            })
        }

        const handleItemDragEnd = () => {
            startTransition(() => setDraggingItemIndex(null))
        }

        if (draggingItemIndex !== null) {
            window.addEventListener("mousemove", handleItemDragMove)
            window.addEventListener("mouseup", handleItemDragEnd)
        }

        return () => {
            window.removeEventListener("mousemove", handleItemDragMove)
            window.removeEventListener("mouseup", handleItemDragEnd)
        }
    }, [draggingItemIndex, isStatic])

    const angleStep = 360 / Math.max(1, items.length)

    const responsiveScale = (() => {
        const w = containerSize.width
        const h = containerSize.height
        if (!w || !h) return 1
        // Designed around 800x600; scale down on smaller devices
        const s = Math.min(w / 800, h / 600)
        return Math.max(0.55, Math.min(1.15, s))
    })()

    const scaledItemWidth = itemWidth * responsiveScale
    const scaledItemHeight = itemHeight * responsiveScale
    const scaledRadius = radius * responsiveScale

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                backgroundColor,
                overflow: "hidden",
                cursor: isDragging ? "grabbing" : enable3DNavigation ? "grab" : "default",
                userSelect: "none",
                touchAction: "none",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            <motion.div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: 0,
                    height: 0,
                    transformStyle: "preserve-3d",
                    perspective: 1200,
                    x: panX,
                    y: panY,
                    z: zoom,
                }}
            >
                <motion.div
                    style={{
                        position: "relative",
                        width: 0,
                        height: 0,
                        transformStyle: "preserve-3d",
                        rotateY: smoothRotation,
                        rotateX: smoothPitch,
                    }}
                >
                    {items.map((item, index) => {
                        const angle = index * angleStep
                        const angleRad = (angle * Math.PI) / 180
                        const x = Math.sin(angleRad) * scaledRadius
                        const z = Math.cos(angleRad) * scaledRadius

                        const centerIndex = (items.length - 1) / 2
                        const offset = index - centerIndex
                        const rowX = offset * scaledItemWidth * 0.75
                        const rowZ = -Math.abs(offset) * (scaledItemWidth * 0.25)
                        const rowRotateY = -offset * rowAngle

                        const t = layoutT
                        const blendedX = rowX * (1 - t) + x * t
                        const blendedZ = rowZ * (1 - t) + z * t

                        const normalizedZ = (blendedZ + scaledRadius) / (scaledRadius * 2)
                        const scale = 0.5 + normalizedZ * 0.5

                        const itemImage = item.image || {
                            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                            alt: "Default Image",
                        }

                        const itemRotation = itemRotations[index] || { x: 0, y: 0 }

                        const shape = item.shape || "rounded"
                        const cornerRadius = item.cornerRadius ?? 12
                        const shapeBorderRadius =
                            shape === "circle" ? 9999 : shape === "rectangle" ? 0 : cornerRadius
                        const shapeClipPath =
                            shape === "hexagon"
                                ? "polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)"
                                : shape === "custom"
                                  ? item.clipPath || undefined
                                  : undefined

                        return (
                            <motion.div
                                key={index}
                                style={{
                                    position: "absolute",
                                    width: scaledItemWidth,
                                    height: scaledItemHeight,
                                    left: -scaledItemWidth / 2,
                                    top: -scaledItemHeight / 2,
                                    transformStyle: "preserve-3d",
                                    transform: `translate3d(${blendedX}px, 0, ${blendedZ}px) scale(${scale}) rotateY(${rowRotateY * (1 - t) + itemRotation.y}deg) rotateX(${itemRotation.x}deg)`,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 12 * responsiveScale,
                                    cursor: draggingItemIndex === index ? "grabbing" : "grab",
                                    transition: "filter 0.2s ease",
                                }}
                                onMouseDown={(e) => handleItemMouseDown(index, e)}
                                onHoverStart={() => {
                                    if (!isStatic && containerRef.current) {
                                        const element = containerRef.current.querySelector(`[data-item-index="${index}"]`) as HTMLElement
                                        if (element) element.style.filter = "brightness(1.1)"
                                    }
                                }}
                                onHoverEnd={() => {
                                    if (!isStatic && containerRef.current) {
                                        const element = containerRef.current.querySelector(`[data-item-index="${index}"]`) as HTMLElement
                                        if (element) element.style.filter = "brightness(1)"
                                    }
                                }}
                            >
                                <a
                                    href={item.link || undefined}
                                    target={item.link ? (openLinksInNewTab ? "_blank" : "_self") : undefined}
                                    rel={item.link && openLinksInNewTab ? "noreferrer noopener" : undefined}
                                    onClick={(e) => handleItemClick(item, index, e)}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        display: "block",
                                        textDecoration: "none",
                                        color: "inherit",
                                    }}
                                    aria-label={item.title || itemImage.alt}
                                >
                                    <div
                                        data-item-index={index}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            borderRadius: shapeBorderRadius,
                                            clipPath: shapeClipPath,
                                            overflow: "hidden",
                                            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                                            backgroundColor: "#fff",
                                        }}
                                    >
                                        <img
                                            src={itemImage.src}
                                            alt={itemImage.alt}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    </div>
                                    {item.title && (
                                        <div
                                            style={{
                                                ...titleFont,
                                                color: titleColor,
                                                textAlign: "center",
                                                width: "100%",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {item.title}
                                        </div>
                                    )}
                                </a>
                            </motion.div>
                        )
                    })}
                </motion.div>
            </motion.div>
        </div>
    )
}

addPropertyControls(ConicCarousel, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Item",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    defaultValue: "",
                },
                shape: {
                    type: ControlType.Enum,
                    title: "Shape",
                    options: ["rounded", "rectangle", "circle", "hexagon", "custom"],
                    optionTitles: ["Rounded", "Rectangle", "Circle", "Hexagon", "Custom"],
                    defaultValue: "rounded",
                },
                cornerRadius: {
                    type: ControlType.Number,
                    title: "Corner Radius",
                    defaultValue: 12,
                    min: 0,
                    max: 100,
                    step: 1,
                    unit: "px",
                    hidden: (itemProps) => itemProps.shape !== "rounded",
                },
                clipPath: {
                    type: ControlType.String,
                    title: "Custom Clip Path",
                    defaultValue: "",
                    placeholder: "polygon(...)",
                    hidden: (itemProps) => itemProps.shape !== "custom",
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Image 1",
                },
                title: "Item 1",
                link: "",
                shape: "rounded",
                cornerRadius: 12,
                clipPath: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Image 2",
                },
                title: "Item 2",
                link: "",
                shape: "rounded",
                cornerRadius: 12,
                clipPath: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Image 3",
                },
                title: "Item 3",
                link: "",
                shape: "rounded",
                cornerRadius: 12,
                clipPath: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Image 4",
                },
                title: "Item 4",
                link: "",
                shape: "rounded",
                cornerRadius: 12,
                clipPath: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Image 5",
                },
                title: "Item 5",
                link: "",
                shape: "rounded",
                cornerRadius: 12,
                clipPath: "",
            },
        ],
    },
    openLinksInNewTab: {
        type: ControlType.Boolean,
        title: "Open Links in New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    enable3DNavigation: {
        type: ControlType.Boolean,
        title: "Enable 3D Navigation",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    rotateSensitivity: {
        type: ControlType.Number,
        title: "Rotate Sensitivity",
        defaultValue: 0.5,
        min: 0.1,
        max: 2,
        step: 0.1,
        hidden: (props) => !props.enable3DNavigation,
    },
    panSensitivity: {
        type: ControlType.Number,
        title: "Pan Sensitivity",
        defaultValue: 1,
        min: 0.2,
        max: 3,
        step: 0.1,
        hidden: (props) => !props.enable3DNavigation,
    },
    zoomSensitivity: {
        type: ControlType.Number,
        title: "Zoom Sensitivity",
        defaultValue: 1,
        min: 0.2,
        max: 5,
        step: 0.1,
        hidden: (props) => !props.enable3DNavigation,
    },
    minZoom: {
        type: ControlType.Number,
        title: "Min Zoom",
        defaultValue: -1200,
        min: -3000,
        max: 0,
        step: 50,
        unit: "px",
        hidden: (props) => !props.enable3DNavigation,
    },
    maxZoom: {
        type: ControlType.Number,
        title: "Max Zoom",
        defaultValue: 400,
        min: 0,
        max: 2000,
        step: 50,
        unit: "px",
        hidden: (props) => !props.enable3DNavigation,
    },
    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto Rotate",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Rotation Speed",
        defaultValue: 20,
        min: 5,
        max: 60,
        step: 1,
        unit: "s",
        hidden: (props) => !props.autoRotate,
    },
    carouselEasing: {
        type: ControlType.Enum,
        title: "Rotation Easing",
        options: ["linear", "easeIn", "easeOut", "easeInOut", "circIn", "circOut", "circInOut", "backIn", "backOut", "backInOut"],
        optionTitles: ["Linear", "Ease In", "Ease Out", "Ease In Out", "Circ In", "Circ Out", "Circ In Out", "Back In", "Back Out", "Back In Out"],
        defaultValue: "linear",
        hidden: (props) => !props.autoRotate,
    },
    itemSpringStiffness: {
        type: ControlType.Number,
        title: "Item Spring Stiffness",
        defaultValue: 220,
        min: 50,
        max: 800,
        step: 10,
    },
    itemSpringDamping: {
        type: ControlType.Number,
        title: "Item Spring Damping",
        defaultValue: 26,
        min: 5,
        max: 120,
        step: 1,
    },
    animationStart: {
        type: ControlType.Enum,
        title: "Animation Start",
        options: ["immediate", "inView"],
        optionTitles: ["Immediate", "On Scroll View"],
        defaultValue: "immediate",
        hidden: (props) => !props.autoRotate && props.initialLayout !== "row",
    },
    inViewPlayMode: {
        type: ControlType.Enum,
        title: "In View Mode",
        options: ["always", "once"],
        optionTitles: ["Always", "Once"],
        defaultValue: "always",
        hidden: (props) => props.animationStart !== "inView" || (!props.autoRotate && props.initialLayout !== "row"),
    },
    initialLayout: {
        type: ControlType.Enum,
        title: "Start Layout",
        options: ["row", "ring"],
        optionTitles: ["Row", "Ring"],
        defaultValue: "row",
    },
    initialLayoutDuration: {
        type: ControlType.Number,
        title: "Intro Duration",
        defaultValue: 1.2,
        min: 0.1,
        max: 10,
        step: 0.1,
        unit: "s",
        hidden: (props) => props.initialLayout !== "row",
    },
    rowAngle: {
        type: ControlType.Number,
        title: "Row Angle",
        defaultValue: 18,
        min: 0,
        max: 60,
        step: 1,
        unit: "deg",
        hidden: (props) => props.initialLayout !== "row",
    },
    itemWidth: {
        type: ControlType.Number,
        title: "Item Width",
        defaultValue: 200,
        min: 100,
        max: 400,
        step: 10,
        unit: "px",
    },
    itemHeight: {
        type: ControlType.Number,
        title: "Item Height",
        defaultValue: 280,
        min: 100,
        max: 500,
        step: 10,
        unit: "px",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 300,
        min: 200,
        max: 600,
        step: 10,
        unit: "px",
    },
    tiltAngle: {
        type: ControlType.Number,
        title: "Tilt Angle",
        defaultValue: 15,
        min: 0,
        max: 45,
        step: 1,
        unit: "deg",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F5F5F5",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#000000",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
})