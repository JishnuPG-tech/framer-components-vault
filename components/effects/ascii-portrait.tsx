// ASCII Portrait: shows a photo and dissolves it into a dithered ASCII version generated live from that same photo.
// The artwork is built once, then each frame only copies the cells that changed, so it stays light even in a grid.
import { useEffect, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useReducedMotion } from "framer-motion"

interface Img {
    src?: string
    srcSet?: string
    alt?: string
    positionX?: string
    positionY?: string
}

type Direction = "Diagonal" | "Bottom to Top" | "Ripple"
type Trigger = "Hover" | "Variant"

interface Props {
    image?: Img
    trigger: Trigger
    active: boolean
    direction: Direction
    reverse: boolean
    duration: number
    playOnTouch: boolean
    grayscale: boolean
    color: string
    paper: string
    charset: "Blocks" | "Characters"
    characters: string
    cellSize: number
    contrast: number
    style?: CSSProperties
}

// Cells shown are always one unbroken run of the dissolve order: order[lo] up to order[hi - 1].
// Dissolving in grows hi. Dissolving out from a finished state grows lo, so the pattern
// clears in the same direction it arrived (a ripple leaves from the center, like it came).
interface Scene {
    art: HTMLCanvasElement
    order: Uint32Array
    cols: number
    cell: number
    lo: number
    hi: number
    leaving: boolean
    ripple: boolean
    reverse: boolean
}

const SAMPLE_SIZE = "512"
const BLOCK_SIZES = [0.2, 0.35, 0.5, 0.65, 0.8, 1]
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16 - 0.5)
const RESIZE_SETTLE_MS = 160

// Framer serves resized copies, so sampling never needs the full-size original
function sampleUrl(src: string) {
    try {
        const url = new URL(src, window.location.href)
        if (url.hostname === "framerusercontent.com") url.searchParams.set("scale-down-to", SAMPLE_SIZE)
        return url.href
    } catch {
        return src
    }
}

// Each cell gets a time, and cells appear in time order.
// Ripple spreads from the center; every other ring trails slightly, which draws the rings.
function dissolveTiming(direction: Direction, col: number, row: number, cols: number, rows: number) {
    const noise = Math.random()
    if (direction === "Bottom to Top") return (1 - row / rows) * 0.8 + noise * 0.2
    if (direction === "Ripple") {
        const distance = Math.hypot(col - cols / 2, row - rows / 2) / Math.hypot(cols / 2, rows / 2)
        const ring = Math.floor(distance * 10) % 2
        return distance + ring * 0.08 + noise * 0.03
    }
    return ((col / cols + row / rows) / 2) * 0.6 + noise * 0.4
}

const easeInOut = (t: number) => t * t * (3 - 2 * t)

function resolveColor(host: HTMLElement, value: string) {
    const probe = document.createElement("span")
    probe.style.color = value
    probe.style.display = "none"
    host.appendChild(probe)
    const resolved = getComputedStyle(probe).color || value
    probe.remove()
    return resolved
}

// Rough perceived brightness of a resolved "rgb(r, g, b)" color
function brightness(value: string) {
    const parts = value.match(/[\d.]+/g)
    if (!parts || parts.length < 3) return 0
    return 0.2126 * Number(parts[0]) + 0.7152 * Number(parts[1]) + 0.0722 * Number(parts[2])
}

function buildGlyphs(ink: string, charset: Props["charset"], characters: string, cell: number) {
    const chars = Array.from(characters).filter((c) => c.trim() !== "")
    const useChars = charset === "Characters" && chars.length > 0
    const levels = useChars ? chars.length : BLOCK_SIZES.length
    const atlas = document.createElement("canvas")
    atlas.width = cell * levels
    atlas.height = cell
    const ctx = atlas.getContext("2d")
    if (!ctx) return { atlas, levels }
    ctx.fillStyle = ink
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.font = Math.round(cell * 1.05) + "px ui-monospace, Menlo, Consolas, monospace"
    for (let level = 0; level < levels; level++) {
        const originX = level * cell
        if (useChars) {
            ctx.fillText(chars[level], originX + cell / 2, cell / 2)
            continue
        }
        const size = Math.max(1, Math.round(cell * BLOCK_SIZES[level]))
        const inset = Math.floor((cell - size) / 2)
        ctx.fillRect(originX + inset, inset, size, size)
    }
    return { atlas, levels }
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 300
 */
export default function AsciiPortrait(props: Props) {
    const { image, trigger = "Hover", active = false, playOnTouch = true, style } = props
    const live = {
        direction: props.direction ?? "Diagonal",
        reverse: props.reverse ?? false,
        duration: props.duration ?? 0.7,
        grayscale: props.grayscale ?? true,
        color: props.color ?? "#0055FF",
        paper: props.paper ?? "#EFF0FF",
        charset: props.charset ?? "Blocks",
        characters: props.characters ?? ".:-+*#%@",
        cellSize: props.cellSize ?? 3,
        contrast: props.contrast ?? 1,
    }

    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const sceneRef = useRef<Scene | null>(null)
    const progressRef = useRef(0)
    const latchedRef = useRef<typeof live | null>(null)
    const [source, setSource] = useState<HTMLImageElement | null>(null)
    const [near, setNear] = useState(false)
    const [touchOn, setTouchOn] = useState(false)
    const [hovered, setHovered] = useState(false)
    const reduceMotion = useReducedMotion()
    // On the canvas and in exported images the component stays still and shows the "Effect On" state
    const isStatic = useIsStaticRenderer()
    const on = isStatic ? active : (trigger === "Hover" ? hovered : active) || touchOn

    // In a hover variant, the settings seen while the effect is on are kept for the way out too,
    // so a direction or cell size changed only on the hover state can't flip or rebuild mid-effect.
    if (on) latchedRef.current = live
    const settings = isStatic || on ? live : latchedRef.current ?? live
    const { direction, reverse, duration, grayscale, color, paper, charset, characters, cellSize, contrast } = settings

    // Colors are read once for the canvas, so draw again when the system theme changes
    const [themeTick, setThemeTick] = useState(0)
    useEffect(() => {
        const redraw = () => setThemeTick((tick) => tick + 1)
        const query = window.matchMedia("(prefers-color-scheme: dark)")
        query.addEventListener("change", redraw)
        return () => query.removeEventListener("change", redraw)
    }, [])

    // Load the sampling copy only when the card is close to the screen
    useEffect(() => {
        const root = rootRef.current
        if (!root) return
        const isTouch = playOnTouch && window.matchMedia("(hover: none)").matches
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setNear(true)
                if (isTouch) setTouchOn(entry.intersectionRatio >= 0.6)
            },
            { rootMargin: "200px", threshold: [0, 0.6] }
        )
        observer.observe(root)
        return () => observer.disconnect()
    }, [playOnTouch])

    // Load once per photo. Hovering must not reload it, or the whole artwork rebuilds mid-effect.
    const wanted = near || active || hovered
    useEffect(() => {
        if (!image?.src || !wanted) return
        let cancelled = false
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
            if (!cancelled) setSource(img)
        }
        img.src = sampleUrl(image.src)
        return () => {
            cancelled = true
        }
    }, [image?.src, wanted])

    const paint = (progress: number, entering: boolean) => {
        const scene = sceneRef.current
        const ctx = canvasRef.current?.getContext("2d")
        if (!scene || !ctx) return
        const { art, order, cols, cell } = scene
        const total = order.length
        const show = (k: number) => {
            const index = order[k]
            const x = (index % cols) * cell
            const y = Math.floor(index / cols) * cell
            ctx.drawImage(art, x, y, cell, cell, x, y, cell, cell)
        }
        const hide = (k: number) => {
            const index = order[k]
            ctx.clearRect((index % cols) * cell, Math.floor(index / cols) * cell, cell, cell)
        }
        // A ring's area grows with its radius squared, so this keeps the ripple's front moving at a steady pace,
        // whether it spreads out from the center or closes in from the edges
        const spread = (t: number) => {
            const eased = easeInOut(t)
            if (!scene.ripple) return eased
            return scene.reverse ? 1 - (1 - eased) * (1 - eased) : eased * eased
        }

        if (!entering && scene.lo === 0 && scene.hi === total) scene.leaving = true
        if (scene.leaving) {
            const lo = Math.round(spread(1 - progress) * total)
            for (; scene.lo < lo; scene.lo++) hide(scene.lo)
            for (; scene.lo > lo; scene.lo--) show(scene.lo - 1)
            if (scene.lo >= total) {
                scene.lo = scene.hi = 0
                scene.leaving = false
            }
            return
        }
        const hi = Math.round(spread(progress) * total)
        for (; scene.hi < hi; scene.hi++) show(scene.hi)
        for (; scene.hi > hi; scene.hi--) hide(scene.hi - 1)
    }

    // Build the artwork from the photo, and again once the card settles at a new size
    useEffect(() => {
        const canvas = canvasRef.current
        const root = rootRef.current
        if (!canvas || !root || !source) return
        const pixel = Math.min(2, Math.max(1, Math.round(window.devicePixelRatio || 1)))
        const ink = resolveColor(root, color)
        const background = resolveColor(root, paper)
        let builtWidth = 0
        let builtHeight = 0

        const build = () => {
            const width = Math.round(canvas.clientWidth * pixel)
            const height = Math.round(canvas.clientHeight * pixel)
            if (width === 0 || height === 0) return
            if (width === builtWidth && height === builtHeight) return
            builtWidth = width
            builtHeight = height
            canvas.width = width
            canvas.height = height
            const cell = Math.max(2, Math.round(cellSize * pixel))
            const cols = Math.ceil(width / cell)
            const rows = Math.ceil(height / cell)

            const sample = document.createElement("canvas")
            sample.width = cols
            sample.height = rows
            const sampleCtx = sample.getContext("2d", { willReadFrequently: true })
            if (!sampleCtx) return
            const scale = Math.max(cols / source.naturalWidth, rows / source.naturalHeight)
            const sourceW = cols / scale
            const sourceH = rows / scale
            const focusX = parseFloat(image?.positionX ?? "50") / 100
            const focusY = parseFloat(image?.positionY ?? "50") / 100
            sampleCtx.imageSmoothingQuality = "high"
            sampleCtx.drawImage(source, (source.naturalWidth - sourceW) * focusX, (source.naturalHeight - sourceH) * focusY, sourceW, sourceH, 0, 0, cols, rows)
            let pixels: Uint8ClampedArray
            try {
                pixels = sampleCtx.getImageData(0, 0, cols, rows).data
            } catch {
                // The image host blocked pixel access: keep showing the plain photo
                sceneRef.current = null
                return
            }

            const art = document.createElement("canvas")
            art.width = width
            art.height = height
            const artCtx = art.getContext("2d")
            if (!artCtx) return
            artCtx.fillStyle = background
            artCtx.fillRect(0, 0, width, height)
            const { atlas, levels } = buildGlyphs(ink, charset, characters, cell)
            // With light ink on dark paper, bright areas get the dense glyphs, so the portrait doesn't read as a negative
            const lightInk = brightness(ink) > brightness(background)
            const total = cols * rows
            const timing = new Float32Array(total)
            const lightness = new Float32Array(total)
            for (let i = 0; i < total; i++) lightness[i] = (0.2126 * pixels[i * 4] + 0.7152 * pixels[i * 4 + 1] + 0.0722 * pixels[i * 4 + 2]) / 255
            // Stretch each photo to its own tonal range so any portrait reads clearly
            const sorted = Float32Array.from(lightness).sort()
            const low = sorted[Math.floor(total * 0.02)]
            const high = Math.max(low + 0.01, sorted[Math.floor(total * 0.98)])
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const index = row * cols + col
                    const tone = Math.min(1, Math.max(0, (lightness[index] - low) / (high - low)))
                    const dark = ((lightInk ? tone : 1 - tone) - 0.5) * contrast + 0.5 + BAYER[(row % 4) * 4 + (col % 4)] * 0.1
                    // Lightest areas keep the smallest dot, so backgrounds stay textured
                    const level = Math.max(1, Math.min(levels, Math.floor(dark * (levels + 1))))
                    artCtx.drawImage(atlas, (level - 1) * cell, 0, cell, cell, col * cell, row * cell, cell, cell)
                    timing[index] = dissolveTiming(direction, col, row, cols, rows)
                }
            }
            const order = Uint32Array.from({ length: total }, (_, i) => i).sort((a, b) => timing[a] - timing[b])
            // Reverse plays the same pattern from the other end: bottom-right first, top to bottom, or edges inward
            if (reverse) order.reverse()
            const ctx = canvas.getContext("2d")
            ctx?.clearRect(0, 0, width, height)
            sceneRef.current = { art, order, cols, cell, lo: 0, hi: 0, leaving: false, ripple: direction === "Ripple", reverse }
            paint(progressRef.current, true)
        }

        build()
        // While the card is animating its size, the canvas just stretches; rebuild once it stops
        let settle = 0
        const observer = new ResizeObserver(() => {
            window.clearTimeout(settle)
            settle = window.setTimeout(build, RESIZE_SETTLE_MS)
        })
        observer.observe(canvas)
        return () => {
            window.clearTimeout(settle)
            observer.disconnect()
        }
    }, [source, color, paper, charset, characters, cellSize, contrast, image?.positionX, image?.positionY, themeTick, direction, reverse])

    // Runs only while the effect is changing, so idle cards cost nothing
    useEffect(() => {
        const target = on ? 1 : 0
        const entering = target === 1
        const animate = !isStatic && !reduceMotion
        if (!animate) {
            progressRef.current = target
            paint(target, entering)
            return
        }
        let frame = 0
        let last = performance.now()
        const tick = (now: number) => {
            // Cap the step so a slow frame skips ahead a little instead of jumping
            const step = Math.min(50, now - last) / 1000 / Math.max(0.01, duration)
            last = now
            const next = progressRef.current + (entering ? step : -step)
            progressRef.current = entering ? Math.min(1, next) : Math.max(0, next)
            paint(progressRef.current, entering)
            if (progressRef.current !== target) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [on, source, reduceMotion, duration, isStatic])

    const hoverable = trigger === "Hover" && !isStatic
    return (
        <div
            ref={rootRef}
            onPointerEnter={hoverable ? (event) => event.pointerType === "mouse" && setHovered(true) : undefined}
            onPointerLeave={hoverable ? () => setHovered(false) : undefined}
            style={{ ...style, position: "relative", width: "100%", height: "100%", overflow: "hidden", background: paper }}
        >
            {image?.src && (
                <img
                    src={image.src}
                    srcSet={image.srcSet}
                    alt={image.alt ?? ""}
                    loading="lazy"
                    draggable={false}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: (image.positionX ?? "50%") + " " + (image.positionY ?? "50%"),
                        filter: grayscale ? "grayscale(1)" : undefined,
                    }}
                />
            )}
            <canvas ref={canvasRef} aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", pointerEvents: "none" }} />
        </div>
    )
}

addPropertyControls(AsciiPortrait, {
    image: { type: ControlType.ResponsiveImage, title: "Photo" },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["Hover", "Variant"],
        defaultValue: "Hover",
        displaySegmentedControl: true,
        description: "Hover plays when the mouse is over the photo. Variant lets a component's hover variant switch it with Effect On.",
    },
    active: {
        type: ControlType.Boolean,
        title: "Effect On",
        defaultValue: false,
        description: "With Hover, this previews the effect on the canvas. With Variant, turn it on in the hover variant and keep the other options the same in both variants.",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["Diagonal", "Bottom to Top", "Ripple"],
        defaultValue: "Diagonal",
        description: "Plays the same way in and out.",
    },
    reverse: {
        type: ControlType.Boolean,
        title: "Reverse",
        defaultValue: false,
        description: "Starts from the other end: bottom-right, top to bottom, or the edges inward.",
    },
    duration: { type: ControlType.Number, title: "Duration", defaultValue: 0.7, min: 0.1, max: 3, step: 0.1, unit: "s", displayStepper: true, description: "Time to dissolve in or out. Lower is faster." },
    playOnTouch: { type: ControlType.Boolean, title: "Touch Screens", defaultValue: true, enabledTitle: "In View", disabledTitle: "Off" },
    grayscale: { type: ControlType.Boolean, title: "Grayscale", defaultValue: true },
    color: { type: ControlType.Color, title: "Ink", defaultValue: "#0055FF" },
    paper: { type: ControlType.Color, title: "Paper", defaultValue: "#EFF0FF" },
    charset: { type: ControlType.Enum, title: "Charset", options: ["Blocks", "Characters"], defaultValue: "Blocks", displaySegmentedControl: true },
    characters: {
        type: ControlType.String,
        title: "Characters",
        defaultValue: ".:-+*#%@",
        description: "Listed from lightest to darkest.",
        hidden: (p) => p.charset !== "Characters",
    },
    cellSize: { type: ControlType.Number, title: "Cell Size", defaultValue: 3, min: 2, max: 24, step: 1, unit: "px" },
    contrast: { type: ControlType.Number, title: "Contrast", defaultValue: 1, min: 0.5, max: 2.5, step: 0.05 },
})
