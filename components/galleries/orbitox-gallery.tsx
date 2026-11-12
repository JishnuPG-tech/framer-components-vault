import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface SpinImageItem {
    src: string
    srcSet?: string
    alt?: string
}

interface SpinImageEntry {
    image: SpinImageItem
    link?: string
}

interface SpinImageProps {
    images: SpinImageEntry[]
    imageWidth: number
    imageHeight: number
    direction: "clockwise" | "anticlockwise"
    path: "curved" | "straight"
    xCurve: number
    yCurve: number
    rounded: number
    orbitUnit: "%" | "px"
    orbitWidthPx: number
    orbitWidthPct: number
    speed: number
    depthEffect: "none" | "blur" | "pixelate"
    maxBlur: number
    pixelSize: number
    draggable: boolean
    style?: CSSProperties
}

const DEG_TO_RAD = Math.PI / 180

const DEFAULT_IMAGES: SpinImageEntry[] = [
    { image: { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Gradient 1" } },
    { image: { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Gradient 2" } },
    { image: { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Gradient 3" } },
    { image: { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Gradient 4" } },
    { image: { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Gradient 5" } },
]

const DRAG_CLICK_THRESHOLD = 5
const MOMENTUM_DECAY = 0.94
const MOMENTUM_MIN = 0.0005

interface LayoutFrame {
    x: number
    y: number
    scale: number
    zIndex: number
    outOfFocus: number // 0 = fully sharp (nearest), 1 = fully defocused (farthest)
    opacity: number
}

function computeFrame(angleDeg: number, radius: number, xFactor: number, yFactor: number, curved: boolean): LayoutFrame {
    const rad = angleDeg * DEG_TO_RAD
    const cx = Math.cos(rad)
    // `depth` drives scale, stacking order, and focus. It comes straight from the
    // angle around the loop, so every image always has a distinct depth no matter how
    // xCurve/yCurve are set - the orbit never collapses onto a single flat plane.
    const depth = Math.sin(rad)
    const nearness = (depth + 1) / 2 // 0 = farthest, 1 = nearest

    // xCurve/yCurve tilt the ellipse in 3D by letting depth bleed into the screen
    // position - this is what turns a flat ring into a diagonally tilted orbit.
    const x = radius * cx + radius * depth * xFactor * 0.6
    const y = radius * depth * yFactor * 0.6
    const zIndex = Math.round(depth * 1000)

    // Like a camera focused on the nearest image: the farther back an image sits,
    // the more out of focus it gets, which sells the sense of depth naturally.
    const outOfFocus = 1 - nearness
    const opacity = 0.82 + nearness * 0.18

    if (!curved) {
        return { x, y, scale: 1, zIndex, outOfFocus, opacity }
    }

    const scale = 0.55 + nearness * 0.8
    return { x, y, scale, zIndex, outOfFocus, opacity }
}

function pixelBlockCount(size: number, pixelSize: number): number {
    const clamped = Math.max(2, pixelSize)
    return Math.max(1, Math.round(size / clamped))
}

// Draws `src` into `canvas` cover-cropped to the canvas's own (tiny) pixel buffer.
// The canvas is then displayed at full size via CSS with `image-rendering: pixelated`,
// which is what actually produces reliably blocky output - unlike scaling an <img> up
// with a CSS transform, whose upscale is smoothed by the compositor regardless of
// `image-rendering`.
function drawPixelated(canvas: HTMLCanvasElement, src: string, blocksX: number, blocksY: number) {
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const img = new Image()
    img.onload = () => {
        canvas.width = blocksX
        canvas.height = blocksY
        const srcAspect = img.naturalWidth / img.naturalHeight
        const dstAspect = blocksX / blocksY
        let sx = 0
        let sy = 0
        let sw = img.naturalWidth
        let sh = img.naturalHeight
        if (srcAspect > dstAspect) {
            sw = img.naturalHeight * dstAspect
            sx = (img.naturalWidth - sw) / 2
        } else {
            sh = img.naturalWidth / dstAspect
            sy = (img.naturalHeight - sh) / 2
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
    }
    img.src = src
}

/**
 * Spin Image
 *
 * Orbit a set of images along a tilted 3D ellipse with continuous spin, depth-based
 * scaling, front-to-back layering, drag-to-spin with momentum, and optional
 * per-image links.
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SpinImage(props: SpinImageProps) {
    const {
        images = DEFAULT_IMAGES,
        imageWidth = 150,
        imageHeight = 150,
        direction = "anticlockwise",
        path = "curved",
        xCurve = -90,
        yCurve = -90,
        rounded = 3,
        orbitUnit = "%",
        orbitWidthPx = 600,
        orbitWidthPct = 60,
        speed = 3,
        depthEffect = "blur",
        maxBlur = 6,
        pixelSize = 14,
        draggable = true,
        style,
    } = props

    const safeImages = images && images.length > 0 ? images : DEFAULT_IMAGES
    const count = safeImages.length

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const itemRefs = useRef<(HTMLDivElement | null)[]>([])
    const pixelCanvasRefs = useRef<(HTMLCanvasElement | null)[]>([])
    const angleRef = useRef(0)
    const frameRef = useRef<number | null>(null)
    const [containerWidth, setContainerWidth] = useState(600)

    // These are refs (not state) on purpose: position and drag are applied
    // imperatively every frame via `applyLayout`, so changing them should never force
    // a React re-render (which would otherwise reset the DOM back to the JSX-declared
    // angle-zero pose and cause a visible snap).
    const isDraggingRef = useRef(false)
    const lastPointerXRef = useRef(0)
    const lastPointerTimeRef = useRef(0)
    const velocityRef = useRef(0) // deg per ms
    const momentumRef = useRef(0) // deg per ms, decays after release
    const dragDistanceRef = useRef(0)
    const reduceMotionRef = useRef(false)
    const isVisibleRef = useRef(true)

    const rawFocusId = useId().replace(/[^a-zA-Z0-9]/g, "")
    const focusClass = `spin-image-focus-${rawFocusId}`

    useEffect(() => {
        const node = containerRef.current
        if (!node || typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (entry) setContainerWidth(entry.contentRect.width)
        })
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        const node = containerRef.current
        if (!node || typeof IntersectionObserver === "undefined") return
        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0]
            if (entry) isVisibleRef.current = entry.isIntersecting
        })
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") return
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
        reduceMotionRef.current = mediaQuery.matches
        const handleChange = (e: MediaQueryListEvent) => {
            reduceMotionRef.current = e.matches
        }
        mediaQuery.addEventListener?.("change", handleChange)
        return () => mediaQuery.removeEventListener?.("change", handleChange)
    }, [])

    const radius = orbitUnit === "px" ? orbitWidthPx / 2 : (containerWidth * orbitWidthPct) / 100 / 2
    const directionSign = direction === "clockwise" ? 1 : -1
    const xFactor = Math.sin(xCurve * DEG_TO_RAD)
    const yFactor = Math.sin(yCurve * DEG_TO_RAD)
    const curved = path === "curved"
    const borderRadius = `${Math.min(Math.max(rounded, 0), 20) * 2.5}%`
    const blocksX = pixelBlockCount(imageWidth, pixelSize)
    const blocksY = pixelBlockCount(imageHeight, pixelSize)

    useEffect(() => {
        if (depthEffect !== "pixelate") return
        safeImages.forEach((entry, i) => {
            const canvas = pixelCanvasRefs.current[i]
            const src = entry.image?.src
            if (!canvas || !src) return
            drawPixelated(canvas, src, blocksX, blocksY)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [depthEffect, blocksX, blocksY, JSON.stringify(safeImages.map((entry) => entry.image?.src))])

    const applyLayout = (angleDeg: number) => {
        for (let i = 0; i < count; i++) {
            const el = itemRefs.current[i]
            if (!el) continue
            const theta = (360 / count) * i + angleDeg
            const frame = computeFrame(theta, radius, xFactor, yFactor, curved)
            const { scale, zIndex, opacity, outOfFocus } = frame

            el.style.transform = `translate3d(${frame.x}px, ${frame.y}px, 0) scale(${scale})`
            el.style.zIndex = String(zIndex + 1000)
            el.style.opacity = String(opacity)

            if (depthEffect === "blur") {
                const blurPx = outOfFocus * maxBlur
                el.style.filter = blurPx > 0.05 ? `blur(${blurPx.toFixed(2)}px)` : "none"
            } else {
                el.style.filter = "none"
            }

            if (depthEffect === "pixelate") {
                const overlay = pixelCanvasRefs.current[i]
                if (overlay) overlay.style.opacity = String(outOfFocus)
            }
        }
    }

    useLayoutEffect(() => {
        applyLayout(angleRef.current)
        if (isStatic) return

        let lastTime: number | null = null
        const tick = (time: number) => {
            if (lastTime === null) lastTime = time
            const delta = (time - lastTime) / 1000
            lastTime = time

            const isCoasting = Math.abs(momentumRef.current) > MOMENTUM_MIN
            if (!isVisibleRef.current && !isDraggingRef.current && !isCoasting) {
                // Off-screen and nothing user-driven happening: skip the per-frame
                // math and style writes entirely to save CPU/battery.
                frameRef.current = requestAnimationFrame(tick)
                return
            }

            if (isDraggingRef.current) {
                // position already advanced directly inside the pointer-move handler
            } else if (isCoasting) {
                angleRef.current += momentumRef.current * 1000 * delta
                momentumRef.current *= Math.pow(MOMENTUM_DECAY, Math.max(delta, 0.001) * 60)
            } else if (speed !== 0 && !reduceMotionRef.current) {
                // Ambient auto-spin is skipped for users who prefer reduced motion;
                // drag-to-spin and its momentum above still work since that's
                // motion the visitor asked for directly.
                angleRef.current += directionSign * speed * 12 * delta
            }

            applyLayout(angleRef.current)
            frameRef.current = requestAnimationFrame(tick)
        }
        frameRef.current = requestAnimationFrame(tick)
        return () => {
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStatic, speed, directionSign, count, radius, curved, xFactor, yFactor, depthEffect, maxBlur])

    const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
        if (!draggable) return
        isDraggingRef.current = true
        momentumRef.current = 0
        velocityRef.current = 0
        dragDistanceRef.current = 0
        lastPointerXRef.current = e.clientX
        lastPointerTimeRef.current = performance.now()
        e.currentTarget.setPointerCapture?.(e.pointerId)
        if (containerRef.current) containerRef.current.style.cursor = "grabbing"
    }

    const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
        if (!isDraggingRef.current) return
        const now = performance.now()
        const dx = e.clientX - lastPointerXRef.current
        const dt = Math.max(now - lastPointerTimeRef.current, 1)
        const safeRadius = Math.max(radius, 1)
        const dTheta = (dx / safeRadius) * (180 / Math.PI)
        angleRef.current += dTheta
        velocityRef.current = dTheta / dt
        dragDistanceRef.current += Math.abs(dx)
        lastPointerXRef.current = e.clientX
        lastPointerTimeRef.current = now
        applyLayout(angleRef.current)
    }

    const endDrag = () => {
        if (!isDraggingRef.current) return
        isDraggingRef.current = false
        momentumRef.current = velocityRef.current
        if (containerRef.current) containerRef.current.style.cursor = draggable ? "grab" : "default"
    }

    const handleItemActivate = (entry: SpinImageEntry) => {
        if (!entry.link) return
        if (dragDistanceRef.current > DRAG_CLICK_THRESHOLD) {
            dragDistanceRef.current = 0
            return
        }
        if (typeof window !== "undefined") {
            window.location.href = entry.link
        }
    }

    return (
        <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerLeave={endDrag}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                touchAction: draggable ? "none" : undefined,
                cursor: draggable ? "grab" : undefined,
                ...style,
            }}
        >
            <style>{`.${focusClass} { outline: none; } .${focusClass}:focus-visible { outline: 2px solid #0A84FF; outline-offset: 2px; }`}</style>
            <div style={{ position: "absolute", top: "50%", left: "50%", width: 0, height: 0 }}>
                {safeImages.map((entry, i) => {
                    const initial = computeFrame((360 / count) * i, radius, xFactor, yFactor, curved)
                    const hasLink = Boolean(entry.link)
                    const initialBlur = depthEffect === "blur" ? initial.outOfFocus * maxBlur : 0
                    return (
                        <div
                            key={i}
                            ref={(node) => {
                                itemRefs.current[i] = node
                            }}
                            className={hasLink ? focusClass : undefined}
                            role={hasLink ? "link" : undefined}
                            tabIndex={hasLink ? 0 : undefined}
                            onClick={hasLink ? () => handleItemActivate(entry) : undefined}
                            onKeyDown={
                                hasLink
                                    ? (e: KeyboardEvent<HTMLDivElement>) => {
                                          if (e.key === "Enter" || e.key === " ") {
                                              e.preventDefault()
                                              handleItemActivate(entry)
                                          }
                                      }
                                    : undefined
                            }
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: imageWidth,
                                height: imageHeight,
                                marginLeft: -imageWidth / 2,
                                marginTop: -imageHeight / 2,
                                borderRadius,
                                overflow: "hidden",
                                willChange: "transform, filter, opacity",
                                cursor: hasLink ? "pointer" : draggable ? "grab" : "default",
                                transform: `translate3d(${initial.x}px, ${initial.y}px, 0) scale(${initial.scale})`,
                                zIndex: initial.zIndex + 1000,
                                filter: initialBlur > 0.05 ? `blur(${initialBlur.toFixed(2)}px)` : "none",
                                opacity: initial.opacity,
                            }}
                        >
                            <img
                                src={entry.image?.src}
                                srcSet={entry.image?.srcSet}
                                alt={entry.image?.alt ?? ""}
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
                            {depthEffect === "pixelate" && (
                                <canvas
                                    ref={(node) => {
                                        pixelCanvasRefs.current[i] = node
                                    }}
                                    width={blocksX}
                                    height={blocksY}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        width: "100%",
                                        height: "100%",
                                        imageRendering: "pixelated",
                                        pointerEvents: "none",
                                        opacity: initial.outOfFocus,
                                    }}
                                />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(SpinImage, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        maxCount: 30,
        defaultValue: DEFAULT_IMAGES,
    },
    imageWidth: {
        type: ControlType.Number,
        title: "Image Width",
        defaultValue: 150,
        min: 20,
        max: 800,
        step: 1,
        unit: "px",
    },
    imageHeight: {
        type: ControlType.Number,
        title: "Image Height",
        defaultValue: 150,
        min: 20,
        max: 800,
        step: 1,
        unit: "px",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        defaultValue: "anticlockwise",
        options: ["anticlockwise", "clockwise"],
        optionTitles: ["Anticlockwise", "Clockwise"],
        displaySegmentedControl: true,
    },
    path: {
        type: ControlType.Enum,
        title: "Path",
        defaultValue: "curved",
        options: ["curved", "straight"],
        optionTitles: ["Curved", "Straight"],
        displaySegmentedControl: true,
    },
    xCurve: {
        type: ControlType.Number,
        title: "X Curve",
        defaultValue: -90,
        min: -90,
        max: 90,
        step: 1,
        unit: "deg",
    },
    yCurve: {
        type: ControlType.Number,
        title: "Y Curve",
        defaultValue: -90,
        min: -90,
        max: 90,
        step: 1,
        unit: "deg",
    },
    rounded: {
        type: ControlType.Number,
        title: "Rounded",
        defaultValue: 3,
        min: 0,
        max: 20,
        step: 1,
    },
    orbitUnit: {
        type: ControlType.Enum,
        title: "Orbit Unit",
        defaultValue: "%",
        options: ["%", "px"],
        optionTitles: ["Percent", "Pixels"],
        displaySegmentedControl: true,
    },
    orbitWidthPct: {
        type: ControlType.Number,
        title: "Orbit Width",
        defaultValue: 60,
        min: 10,
        max: 200,
        step: 1,
        unit: "%",
        hidden: (props) => props.orbitUnit !== "%",
    },
    orbitWidthPx: {
        type: ControlType.Number,
        title: "Orbit Width",
        defaultValue: 600,
        min: 100,
        max: 2000,
        step: 10,
        unit: "px",
        hidden: (props) => props.orbitUnit !== "px",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 3,
        min: 0,
        max: 10,
        step: 0.1,
    },
    draggable: {
        type: ControlType.Boolean,
        title: "Drag to Spin",
        defaultValue: true,
    },
    depthEffect: {
        type: ControlType.Enum,
        title: "Depth Effect",
        defaultValue: "blur",
        options: ["none", "blur", "pixelate"],
        optionTitles: ["None", "Blur", "Pixelate"],
        displaySegmentedControl: true,
    },
    maxBlur: {
        type: ControlType.Number,
        title: "Max Blur",
        defaultValue: 6,
        min: 0,
        max: 20,
        step: 0.5,
        unit: "px",
        hidden: (props) => props.depthEffect !== "blur",
    },
    pixelSize: {
        type: ControlType.Number,
        title: "Pixel Size",
        defaultValue: 14,
        min: 2,
        max: 60,
        step: 1,
        unit: "px",
        hidden: (props) => props.depthEffect !== "pixelate",
    },
})
