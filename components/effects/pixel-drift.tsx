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


type Point = { x: number; y: number; scale?: number }
type Props = {
    image?: { src: string; srcSet?: string; alt?: string }
    overlay?: string
    pixelSize?: number
    revealSize?: number
    trailDuration?: number
    initialReveal?: number
    style?: React.CSSProperties
}

const SHAPES = [
    [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
    ],
    [
        [0, 0],
        [-1, 0],
        [1, 0],
        [0, 1],
    ],
    [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 2],
    ],
    [
        [0, 0],
        [1, 0],
        [0, 1],
        [-1, 1],
    ],
    [
        [0, 0],
        [-1, 0],
        [1, 0],
        [2, 0],
    ],
    [
        [0, 0],
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
    ],
    [
        [0, 0],
        [1, 0],
        [2, 0],
        [0, 1],
        [1, 1],
        [2, 1],
    ],
]

function randomShape(random = Math.random): Point[] {
    const shape = SHAPES[Math.floor(random() * SHAPES.length)]
    const turns = Math.floor(random() * 4)
    const mirror = random() < 0.5 ? -1 : 1
    return shape.map(([x, y]) => {
        x *= mirror
        for (let i = 0; i < turns; i++) [x, y] = [-y, x]
        return { x, y }
    })
}

// A deterministic preview of the starting reveal. This is just SVG markup:
// no canvas, measurements, animation frames, observers, or pointer listeners.
function staticRevealPath(pixelSize: number, initialReveal: number): string {
    const size = Math.max(8, pixelSize)
    const columns = Math.max(6, Math.min(30, Math.round(720 / size)))
    const rows = Math.max(5, Math.min(24, Math.round(480 / size)))
    const total = columns * rows
    const target = Math.round(
        total * Math.min(1, Math.max(0, initialReveal / 100))
    )

    let seed = 83427
    const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
        return seed / 4294967296
    }
    const indices = Array.from({ length: total }, (_, index) => index)
    for (let i = total - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1))
        const selected = indices[i]
        indices[i] = indices[j]
        indices[j] = selected
    }

    const cellWidth = 100 / columns
    const cellHeight = 100 / rows
    return indices
        .slice(0, target)
        .map((index) => {
            const x = (index % columns) * cellWidth
            const y = Math.floor(index / columns) * cellHeight
            return `M${x} ${y}h${cellWidth}v${cellHeight}h${-cellWidth}Z`
        })
        .join(" ")
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function PixelReveal({
    image,
    overlay = "#FFFFFF",
    pixelSize = 54,
    revealSize = 1,
    trailDuration = 1.1,
    initialReveal = 28,
    style,
}: Props) {
    const isStaticRenderer = useIsStaticRenderer()
    const rootRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const staticMaskId = React.useId().replace(/:/g, "")
    const staticHoles = React.useMemo(
        () =>
            isStaticRenderer ? staticRevealPath(pixelSize, initialReveal) : "",
        [isStaticRenderer, pixelSize, initialReveal]
    )

    React.useEffect(() => {
        // Framer Canvas and export must not start browser-only behavior.
        if (isStaticRenderer) return

        const root = rootRef.current
        const canvas = canvasRef.current
        const ctx = canvas?.getContext("2d")
        if (!root || !canvas || !ctx) return
        const size = Math.max(8, pixelSize)
        const brushScale = Math.min(1.75, Math.max(0.25, revealSize))
        const brushPixelSize = size * brushScale
        const duration = Math.max(100, trailDuration * 1000)
        const baseline = new Map<string, Point>()
        const trail = new Map<string, Point & { time: number }>()
        let active: Point[] = []
        let pointer: Point | null = null
        let previous: (Point & { time: number }) | null = null
        let shape = randomShape()
        let shapeTime = -Infinity
        let lastStampTime = -Infinity
        let width = 0,
            height = 0,
            ratio = 1,
            frame = 0
        const key = (p: Point) => `${p.x}:${p.y}:${p.scale ?? 1}`
        const inside = (p: Point) =>
            p.x >= 0 && p.y >= 0 && p.x * size < width && p.y * size < height
        const cellsAt = (point: Point, offsets: Point[], scale = 1) =>
            offsets
                .map((offset) => ({
                    x:
                        (Math.floor(point.x / (size * scale)) + offset.x) *
                        scale,
                    y:
                        (Math.floor(point.y / (size * scale)) + offset.y) *
                        scale,
                    scale,
                }))
                .filter(inside)

        function schedule() {
            if (!frame) frame = requestAnimationFrame(draw)
        }
        function draw(now: number) {
            frame = 0
            ctx!.setTransform(ratio, 0, 0, ratio, 0, 0)
            ctx!.globalCompositeOperation = "source-over"
            ctx!.globalAlpha = 1
            ctx!.clearRect(0, 0, width, height)
            ctx!.fillStyle = overlay
            ctx!.fillRect(0, 0, width, height)
            // Merge overlapping cells before erasing the cover.
            const holes = new Map<string, { point: Point; opacity: number }>()
            for (const [id, point] of baseline)
                holes.set(id, { point, opacity: 1 })
            for (const [id, cell] of trail) {
                const age = (now - cell.time) / duration
                if (age >= 1) {
                    trail.delete(id)
                    continue
                }
                const opacity = 1 - Math.max(0, (age - 0.18) / 0.82)
                if (!holes.has(id)) holes.set(id, { point: cell, opacity })
            }
            for (const point of active)
                holes.set(key(point), { point, opacity: 1 })
            ctx!.globalCompositeOperation = "destination-out"
            ctx!.fillStyle = "#000"
            for (const { point, opacity } of holes.values()) {
                ctx!.globalAlpha = opacity
                const x = Math.round(point.x * size * ratio) / ratio
                const y = Math.round(point.y * size * ratio) / ratio
                const right =
                    Math.round((point.x + (point.scale ?? 1)) * size * ratio) /
                    ratio
                const bottom =
                    Math.round((point.y + (point.scale ?? 1)) * size * ratio) /
                    ratio
                ctx!.fillRect(x, y, right - x, bottom - y)
            }
            ctx!.globalAlpha = 1
            ctx!.globalCompositeOperation = "source-over"
            if (trail.size) schedule()
        }

        const resize = () => {
            width = root.clientWidth
            height = root.clientHeight
            ratio = Math.min(window.devicePixelRatio || 1, 2)
            canvas.width = Math.max(1, Math.round(width * ratio))
            canvas.height = Math.max(1, Math.round(height * ratio))
            baseline.clear()
            trail.clear()
            active = []
            pointer = previous = null
            shapeTime = lastStampTime = -Infinity
            // Repeatable starting mosaic; randomness changes only during interaction.
            let seed = 83427
            const random = () => {
                seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
                return seed / 4294967296
            }
            const columns = Math.ceil(width / size),
                rows = Math.ceil(height / size)
            const target = Math.round(
                columns * rows * Math.min(1, Math.max(0, initialReveal / 100))
            )
            let attempts = 0
            while (baseline.size < target && attempts++ < columns * rows * 20) {
                const origin = {
                    x: Math.floor(random() * columns) * size,
                    y: Math.floor(random() * rows) * size,
                }
                const offsets =
                    random() < 0.35 ? [{ x: 0, y: 0 }] : randomShape(random)
                for (const point of cellsAt(origin, offsets)) {
                    if (baseline.size >= target) break
                    baseline.set(key(point), point)
                }
            }
            schedule()
        }

        const move = (event: PointerEvent) => {
            if (
                event.pointerType === "touch" &&
                event.type !== "pointerdown" &&
                !event.buttons
            )
                return
            const bounds = root.getBoundingClientRect()
            if (!bounds.width || !bounds.height) return
            const now = performance.now()
            const next = {
                x: ((event.clientX - bounds.left) * width) / bounds.width,
                y: ((event.clientY - bounds.top) * height) / bounds.height,
            }
            const changedCell =
                !pointer ||
                Math.floor(next.x / brushPixelSize) !==
                    Math.floor(pointer.x / brushPixelSize) ||
                Math.floor(next.y / brushPixelSize) !==
                    Math.floor(pointer.y / brushPixelSize)
            const speed = previous
                ? Math.hypot(next.x - previous.x, next.y - previous.y) /
                  Math.max(1, now - previous.time)
                : 0
            if (changedCell && now - shapeTime >= 65) {
                shape = randomShape()
                shapeTime = now
            }
            if (changedCell || now - lastStampTime >= 40) {
                for (const point of active)
                    trail.set(key(point), { ...point, time: now })
                lastStampTime = now
                // Fast motion leaves detached patches instead of a solid painted line.
                if (speed > 0.8 && Math.random() < 0.65) {
                    const scatter = {
                        x: next.x + (Math.random() - 0.5) * brushPixelSize * 6,
                        y: next.y + (Math.random() - 0.5) * brushPixelSize * 6,
                    }
                    for (const point of cellsAt(
                        scatter,
                        randomShape(),
                        brushScale
                    ))
                        trail.set(key(point), { ...point, time: now })
                }
            }
            pointer = next
            previous = { ...next, time: now }
            active = cellsAt(next, shape, brushScale)
            schedule()
        }
        const leave = () => {
            const now = performance.now()
            for (const point of active)
                trail.set(key(point), { ...point, time: now })
            active = []
            pointer = previous = null
            schedule()
        }
        const up = (event: PointerEvent) => {
            if (event.pointerType !== "mouse") leave()
        }
        const visibility = () => {
            if (document.hidden) leave()
        }
        resize()
        const observer = new ResizeObserver(resize)
        observer.observe(root)
        root.addEventListener("pointerenter", move)
        root.addEventListener("pointermove", move)
        root.addEventListener("pointerdown", move)
        root.addEventListener("pointerleave", leave)
        root.addEventListener("pointercancel", leave)
        window.addEventListener("pointerup", up)
        window.addEventListener("blur", leave)
        document.addEventListener("visibilitychange", visibility)
        return () => {
            cancelAnimationFrame(frame)
            observer.disconnect()
            root.removeEventListener("pointerenter", move)
            root.removeEventListener("pointermove", move)
            root.removeEventListener("pointerdown", move)
            root.removeEventListener("pointerleave", leave)
            root.removeEventListener("pointercancel", leave)
            window.removeEventListener("pointerup", up)
            window.removeEventListener("blur", leave)
            document.removeEventListener("visibilitychange", visibility)
        }
    }, [
        isStaticRenderer,
        overlay,
        pixelSize,
        revealSize,
        trailDuration,
        initialReveal,
    ])

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                touchAction: "pan-y",
                backgroundColor: overlay,
            }}
        >
            {image?.src && (
                <img
                    src={image.src}
                    srcSet={image.srcSet}
                    alt={image.alt || ""}
                    draggable={false}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        pointerEvents: "none",
                        userSelect: "none",
                    }}
                />
            )}
            {isStaticRenderer ? (
                <svg
                    aria-hidden="true"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                    }}
                >
                    <defs>
                        <mask id={staticMaskId} maskUnits="userSpaceOnUse">
                            <rect width="100" height="100" fill="white" />
                            <path d={staticHoles} fill="black" />
                        </mask>
                    </defs>
                    <rect
                        width="100"
                        height="100"
                        fill={overlay}
                        mask={`url(#${staticMaskId})`}
                    />
                </svg>
            ) : (
                <canvas
                    ref={canvasRef}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                    }}
                />
            )}
        </div>
    )
}

addPropertyControls(PixelReveal, {
    image: { type: ControlType.ResponsiveImage, title: "Image" },
    overlay: {
        type: ControlType.Color,
        title: "Cover",
        defaultValue: "#FFFFFF",
    },
    pixelSize: {
        type: ControlType.Number,
        title: "Pixel Size",
        defaultValue: 54,
        min: 8,
        max: 200,
        step: 1,
        unit: "px",
    },
    revealSize: {
        type: ControlType.Number,
        title: "Reveal Size",
        defaultValue: 1,
        min: 0.25,
        max: 1.75,
        step: 0.05,
        unit: "×",
        displayStepper: false,
        description:
            "Cursor reveal scale. Original size is 1× at the slider midpoint. Keeps the starting pattern unchanged.",
    },
    trailDuration: {
        type: ControlType.Number,
        title: "Trail Life",
        defaultValue: 1.1,
        min: 0.1,
        max: 5,
        step: 0.1,
        unit: "s",
    },
    initialReveal: {
        type: ControlType.Number,
        title: "Start Reveal",
        defaultValue: 28,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
})

