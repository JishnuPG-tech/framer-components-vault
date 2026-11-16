// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
} from "react"
import { useInView } from "framer-motion"

// User request: Create a new Framer "Infinite Grid" component with seamless infinite wrap-around tiling, unified drag + scroll momentum offset, edge fade mask, drag-velocity scale, hover lift, per-instance appear animation, and full property controls.

interface ResponsiveImageValue {
    src?: string
    srcSet?: string
    alt?: string
}

interface MyComponentProps {
    image1?: ResponsiveImageValue
    image2?: ResponsiveImageValue
    image3?: ResponsiveImageValue
    image4?: ResponsiveImageValue
    image5?: ResponsiveImageValue
    image6?: ResponsiveImageValue
    image7?: ResponsiveImageValue
    image8?: ResponsiveImageValue
    image9?: ResponsiveImageValue
    image10?: ResponsiveImageValue
    backgroundColor: string
    cellSize: number
    gridGap: number
    cellPadding: number
    rowOffset: number
    dragSpeed: number
    inertia: number
    scrollStrength: number
    edgeFadeAmount: number
    dragVelocityScaleAmount: number
    hoverLiftAmount: number
    appearAnimationAmount: number
    imageBorderRadius: number
    imageOpacity: number
}

type CellMeta = { row: number; col: number; image?: ResponsiveImageValue }
type CellAnimMeta = { wasVisible: boolean; enterTime: number }

function mod(value: number, size: number): number {
    if (size <= 0) return 0
    return ((value % size) + size) % size
}

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v))
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function FilatovInfiniteGrid(props: MyComponentProps) {
    const {
        image1 = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Gradient 5 - Green",
        },
        image2 = {
            src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            alt: "Gradient 4 - Yellow",
        },
        image3 = {
            src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            alt: "Gradient 3 - Orange",
        },
        image4 = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Gradient 2 - Purple",
        },
        image5 = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Gradient 1 - Blue",
        },
        image6,
        image7,
        image8,
        image9,
        image10,
        backgroundColor,
        cellSize,
        gridGap,
        cellPadding,
        rowOffset,
        dragSpeed,
        inertia,
        scrollStrength,
        edgeFadeAmount,
        dragVelocityScaleAmount,
        hoverLiftAmount,
        appearAnimationAmount,
        imageBorderRadius,
        imageOpacity,
    } = props

    const rootRef = useRef<HTMLDivElement | null>(null)
    const frameRef = useRef(0)
    const cellRefs = useRef<Array<HTMLDivElement | null>>([])
    const animMetaRef = useRef<CellAnimMeta[]>([])
    const pointerIdRef = useRef<number | null>(null)
    const draggingRef = useRef(false)
    const lastPointerRef = useRef({ x: 0, y: 0, t: 0 })
    const velocityRef = useRef({ x: 0, y: 0 })
    const offsetRef = useRef({ x: 0, y: 0 })
    const lastFrameRef = useRef(0)
    const lastScrollRef = useRef({ x: 0, y: 0 })
    const dragSpeedPxRef = useRef(0)

    const staticRenderer = useIsStaticRenderer()
    const inView = useInView(rootRef, { amount: 0 })
    const [viewport, setViewport] = useState({ width: 1200, height: 800 })

    const images = useMemo(() => {
        return [
            image1,
            image2,
            image3,
            image4,
            image5,
            image6,
            image7,
            image8,
            image9,
            image10,
        ].filter((image) => !!image?.src)
    }, [
        image1,
        image2,
        image3,
        image4,
        image5,
        image6,
        image7,
        image8,
        image9,
        image10,
    ])

    const metrics = useMemo(() => {
        const step = Math.max(4, cellSize + gridGap)
        const visibleCols = Math.ceil(viewport.width / step)
        const visibleRows = Math.ceil(viewport.height / step)
        const staggerCols = Math.ceil(Math.abs(rowOffset) / step)
        const renderCols = visibleCols + 8 + staggerCols
        const renderRows = visibleRows + 8
        return {
            step,
            renderCols,
            renderRows,
            totalWidth: renderCols * step,
            totalHeight: renderRows * step,
            startX: viewport.width / 2 - (renderCols * step) / 2,
            startY: viewport.height / 2 - (renderRows * step) / 2,
        }
    }, [cellSize, gridGap, rowOffset, viewport.width, viewport.height])

    const cells = useMemo<CellMeta[]>(() => {
        const output: CellMeta[] = []
        let index = 0
        for (let row = 0; row < metrics.renderRows; row++) {
            for (let col = 0; col < metrics.renderCols; col++) {
                output.push({
                    row,
                    col,
                    image:
                        images.length > 0
                            ? images[index % images.length]
                            : undefined,
                })
                index++
            }
        }
        return output
    }, [images, metrics.renderCols, metrics.renderRows])

    useEffect(() => {
        animMetaRef.current = cells.map(() => ({
            wasVisible: false,
            enterTime: 0,
        }))
        cellRefs.current.length = cells.length
    }, [cells])

    const applyTransforms = useCallback(
        (now: number) => {
            const root = rootRef.current
            if (!root) return

            const { step, totalWidth, totalHeight, startX, startY } = metrics
            const scaleDrop =
                clamp(dragSpeedPxRef.current / 1800, 0, 1) *
                dragVelocityScaleAmount
            const globalScale = 1 - scaleDrop
            const appearDuration =
                220 + 380 * clamp(appearAnimationAmount, 0, 2)
            const appearStartScale =
                1 - 0.3 * clamp(appearAnimationAmount, 0, 1.5)
            const appearStartOpacity =
                1 - 0.65 * clamp(appearAnimationAmount, 0, 1.5)

            for (let i = 0; i < cells.length; i++) {
                const cell = cells[i]
                const node = cellRefs.current[i]
                if (!node) continue

                const stagger = cell.row * rowOffset
                const x =
                    mod(
                        cell.col * step + stagger + offsetRef.current.x,
                        totalWidth
                    ) + startX
                const y =
                    mod(cell.row * step + offsetRef.current.y, totalHeight) +
                    startY
                const visible =
                    x + cellSize > 0 &&
                    x < viewport.width &&
                    y + cellSize > 0 &&
                    y < viewport.height
                const meta = animMetaRef.current[i]

                if (visible && !meta.wasVisible) {
                    meta.wasVisible = true
                    meta.enterTime = now
                } else if (!visible && meta.wasVisible) {
                    meta.wasVisible = false
                }

                const elapsed =
                    meta.enterTime > 0 ? now - meta.enterTime : appearDuration
                const appearProgress = clamp(elapsed / appearDuration, 0, 1)
                const eased = 1 - (1 - appearProgress) * (1 - appearProgress)
                const localScale =
                    appearStartScale + (1 - appearStartScale) * eased
                const localOpacity =
                    appearStartOpacity + (1 - appearStartOpacity) * eased

                node.style.transform = `translate3d(${x}px, ${y}px, 0px) scale(${globalScale})`
                node.style.opacity = `${clamp(localOpacity, 0, 1)}`
                node.style.setProperty("--content-scale", `${localScale}`)
            }
        },
        [
            appearAnimationAmount,
            cells,
            cellSize,
            dragVelocityScaleAmount,
            metrics,
            rowOffset,
            viewport.height,
            viewport.width,
        ]
    )

    useEffect(() => {
        const element = rootRef.current
        if (!element) return
        const observer = new ResizeObserver((entries) => {
            const rect = entries[0]?.contentRect
            if (!rect) return
            startTransition(() => {
                setViewport({
                    width: Math.max(1, rect.width),
                    height: Math.max(1, rect.height),
                })
            })
        })
        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        lastScrollRef.current = { x: window.scrollX, y: window.scrollY }

        const onWindowScroll = () => {
            const dx = window.scrollX - lastScrollRef.current.x
            const dy = window.scrollY - lastScrollRef.current.y
            lastScrollRef.current = { x: window.scrollX, y: window.scrollY }
            offsetRef.current.x += dx * scrollStrength
            offsetRef.current.y += dy * scrollStrength
            velocityRef.current.x += dx * scrollStrength * 6
            velocityRef.current.y += dy * scrollStrength * 6
        }

        window.addEventListener("scroll", onWindowScroll, { passive: true })
        return () => window.removeEventListener("scroll", onWindowScroll)
    }, [scrollStrength])

    useEffect(() => {
        const root = rootRef.current
        if (!root || staticRenderer) return

        const onPointerDown = (event: PointerEvent) => {
            draggingRef.current = true
            pointerIdRef.current = event.pointerId
            lastPointerRef.current = {
                x: event.clientX,
                y: event.clientY,
                t: performance.now(),
            }
            velocityRef.current = { x: 0, y: 0 }
            dragSpeedPxRef.current = 0
            root.style.cursor = "grabbing"
            root.setPointerCapture(event.pointerId)
        }

        const onPointerMove = (event: PointerEvent) => {
            if (
                !draggingRef.current ||
                pointerIdRef.current !== event.pointerId
            )
                return
            const now = performance.now()
            const prev = lastPointerRef.current
            const dt = Math.max(1, now - prev.t)
            const dx = (event.clientX - prev.x) * dragSpeed
            const dy = (event.clientY - prev.y) * dragSpeed

            offsetRef.current.x += dx
            offsetRef.current.y += dy
            velocityRef.current.x = (dx / dt) * 1000
            velocityRef.current.y = (dy / dt) * 1000
            dragSpeedPxRef.current = Math.hypot(
                velocityRef.current.x,
                velocityRef.current.y
            )
            lastPointerRef.current = {
                x: event.clientX,
                y: event.clientY,
                t: now,
            }
        }

        const onPointerUp = (event: PointerEvent) => {
            if (pointerIdRef.current !== event.pointerId) return
            draggingRef.current = false
            pointerIdRef.current = null
            root.style.cursor = "grab"
            if (root.hasPointerCapture(event.pointerId)) {
                root.releasePointerCapture(event.pointerId)
            }
        }

        const onWheel = (event: WheelEvent) => {
            offsetRef.current.x += event.deltaX * scrollStrength
            offsetRef.current.y += event.deltaY * scrollStrength
            velocityRef.current.x += event.deltaX * scrollStrength * 2
            velocityRef.current.y += event.deltaY * scrollStrength * 2
        }

        root.addEventListener("pointerdown", onPointerDown)
        root.addEventListener("pointermove", onPointerMove)
        root.addEventListener("pointerup", onPointerUp)
        root.addEventListener("pointercancel", onPointerUp)
        root.addEventListener("wheel", onWheel, { passive: true })

        return () => {
            root.removeEventListener("pointerdown", onPointerDown)
            root.removeEventListener("pointermove", onPointerMove)
            root.removeEventListener("pointerup", onPointerUp)
            root.removeEventListener("pointercancel", onPointerUp)
            root.removeEventListener("wheel", onWheel)
        }
    }, [dragSpeed, scrollStrength, staticRenderer])

    useEffect(() => {
        if (staticRenderer) {
            const time =
                typeof performance !== "undefined" ? performance.now() : 0
            applyTransforms(time)
            return
        }

        const tick = (now: number) => {
            if (lastFrameRef.current === 0) {
                lastFrameRef.current = now
            }
            const dt = Math.min(0.05, (now - lastFrameRef.current) / 1000)
            lastFrameRef.current = now

            if (inView) {
                if (!draggingRef.current) {
                    const damping = clamp(inertia, 0.7, 0.9999)
                    const decay = Math.pow(damping, dt * 60)
                    velocityRef.current.x *= decay
                    velocityRef.current.y *= decay
                    offsetRef.current.x += velocityRef.current.x * dt
                    offsetRef.current.y += velocityRef.current.y * dt
                }
                dragSpeedPxRef.current *= Math.pow(0.92, dt * 60)
                applyTransforms(now)
            }

            frameRef.current = requestAnimationFrame(tick)
        }

        frameRef.current = requestAnimationFrame(tick)
        return () => {
            cancelAnimationFrame(frameRef.current)
            frameRef.current = 0
            lastFrameRef.current = 0
        }
    }, [applyTransforms, inertia, inView, staticRenderer])

    const fade = clamp(edgeFadeAmount, 0, 0.45)
    const fadePx = `${Math.round(fade * 100)}%`
    const maskImage =
        fade <= 0
            ? undefined
            : `linear-gradient(to right, transparent 0%, black ${fadePx}, black calc(100% - ${fadePx}), transparent 100%), linear-gradient(to bottom, transparent 0%, black ${fadePx}, black calc(100% - ${fadePx}), transparent 100%)`

    const cellStyle = useMemo(
        () => ({
            position: "absolute" as const,
            width: `${cellSize}px`,
            height: `${cellSize}px`,
            willChange: "transform, opacity",
            contain: "layout style paint" as const,
        }),
        [cellSize]
    )

    const contentStyle = useMemo(
        () => ({
            width: "100%",
            height: "100%",
            padding: `${Math.max(0, cellPadding)}px`,
            boxSizing: "border-box" as const,
            transform: "scale(var(--content-scale, 1))",
            transition: `transform ${260 + hoverLiftAmount * 90}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${280 + hoverLiftAmount * 90}ms ease`,
            pointerEvents: "auto" as const,
        }),
        [cellPadding, hoverLiftAmount]
    )

    return (
        <div
            ref={rootRef}
            role="img"
            aria-label="Infinite draggable image grid"
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                backgroundColor,
                cursor: staticRenderer ? "default" : "grab",
                touchAction: "none",
                userSelect: "none",
                WebkitMaskImage: maskImage,
                maskImage,
                WebkitMaskComposite: maskImage
                    ? ("source-in" as never)
                    : undefined,
                maskComposite: maskImage ? ("intersect" as never) : undefined,
            }}
        >
            {cells.map((cell, index) => {
                const image = cell.image
                return (
                    <div
                        key={`${cell.row}-${cell.col}`}
                        ref={(node) => {
                            cellRefs.current[index] = node
                        }}
                        style={cellStyle}
                    >
                        <div
                            style={contentStyle}
                            onPointerEnter={(event) => {
                                const target =
                                    event.currentTarget as HTMLDivElement
                                const liftScale =
                                    1 + clamp(hoverLiftAmount, 0, 0.5)
                                target.style.transform = `scale(calc(var(--content-scale, 1) * ${liftScale}))`
                                target.style.boxShadow =
                                    "0 16px 36px rgba(0,0,0,0.22)"
                            }}
                            onPointerLeave={(event) => {
                                const target =
                                    event.currentTarget as HTMLDivElement
                                target.style.transform =
                                    "scale(var(--content-scale, 1))"
                                target.style.boxShadow = "none"
                            }}
                        >
                            {image?.src ? (
                                <img
                                    src={image.src}
                                    srcSet={image.srcSet}
                                    alt={image.alt || ""}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "contain",
                                        borderRadius: `${Math.max(0, imageBorderRadius)}px`,
                                        opacity: clamp(imageOpacity, 0, 1),
                                        display: "block",
                                        pointerEvents: "none",
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: `${Math.max(0, imageBorderRadius)}px`,
                                        opacity: clamp(imageOpacity, 0, 1),
                                        background: "rgba(255,255,255,0.14)",
                                        pointerEvents: "none",
                                    }}
                                />
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

addPropertyControls(FilatovInfiniteGrid, {
    image1: { type: ControlType.ResponsiveImage, title: "Image 1" },
    image2: { type: ControlType.ResponsiveImage, title: "Image 2" },
    image3: { type: ControlType.ResponsiveImage, title: "Image 3" },
    image4: { type: ControlType.ResponsiveImage, title: "Image 4" },
    image5: { type: ControlType.ResponsiveImage, title: "Image 5" },
    image6: { type: ControlType.ResponsiveImage, title: "Image 6" },
    image7: { type: ControlType.ResponsiveImage, title: "Image 7" },
    image8: { type: ControlType.ResponsiveImage, title: "Image 8" },
    image9: { type: ControlType.ResponsiveImage, title: "Image 9" },
    image10: { type: ControlType.ResponsiveImage, title: "Image 10" },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    cellSize: {
        type: ControlType.Number,
        title: "Cell Size",
        defaultValue: 160,
        min: 40,
        max: 480,
        unit: "px",
        step: 1,
    },
    gridGap: {
        type: ControlType.Number,
        title: "Grid Gap",
        defaultValue: 18,
        min: 0,
        max: 160,
        unit: "px",
        step: 1,
    },
    cellPadding: {
        type: ControlType.Number,
        title: "Cell Padding",
        defaultValue: 10,
        min: 0,
        max: 80,
        unit: "px",
        step: 1,
    },
    rowOffset: {
        type: ControlType.Number,
        title: "Row Stagger",
        defaultValue: 70,
        min: -300,
        max: 300,
        unit: "px",
        step: 1,
    },
    dragSpeed: {
        type: ControlType.Number,
        title: "Drag Speed",
        defaultValue: 1,
        min: 0.2,
        max: 3,
        step: 0.01,
    },
    inertia: {
        type: ControlType.Number,
        title: "Inertia",
        defaultValue: 0.93,
        min: 0.7,
        max: 0.9999,
        step: 0.0001,
    },
    scrollStrength: {
        type: ControlType.Number,
        title: "Scroll Strength",
        defaultValue: 0.2,
        min: 0,
        max: 2,
        step: 0.01,
    },
    edgeFadeAmount: {
        type: ControlType.Number,
        title: "Edge Fade",
        defaultValue: 0.14,
        min: 0,
        max: 0.45,
        step: 0.01,
    },
    dragVelocityScaleAmount: {
        type: ControlType.Number,
        title: "Velocity Scale",
        defaultValue: 0.12,
        min: 0,
        max: 1,
        step: 0.01,
    },
    hoverLiftAmount: {
        type: ControlType.Number,
        title: "Hover Lift",
        defaultValue: 0.08,
        min: 0,
        max: 0.4,
        step: 0.01,
    },
    appearAnimationAmount: {
        type: ControlType.Number,
        title: "Appear Amount",
        defaultValue: 0.7,
        min: 0,
        max: 2,
        step: 0.01,
    },
    imageBorderRadius: {
        type: ControlType.Number,
        title: "Image Radius",
        defaultValue: 14,
        min: 0,
        max: 64,
        unit: "px",
        step: 1,
    },
    imageOpacity: {
        type: ControlType.Number,
        title: "Image Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
    },
})
