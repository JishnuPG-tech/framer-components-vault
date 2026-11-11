import { useEffect, useRef, useState } from "react"
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
 * TICKER MARQUEE
 * ----------------------------------------------------
 * An infinite scrolling row of images that rides a sine wave — the same
 * idea as the footer strip on holisticism.com, which traces icon
 * positions along an SVG path.
 *
 * The wave shape is drawn as a real <path> element, and each item's
 * position is read directly off that path via getPointAtLength() — not
 * approximated with a standalone Math.sin() call. A lookup table is
 * sampled from the path once per shape/size change (not every frame,
 * for performance), then a requestAnimationFrame loop looks up each
 * item's y for its current x every frame. The path can optionally be
 * drawn visibly ("Show Wave Line"), independent of whether it's driving
 * the motion — it always drives the motion when Wave Motion is on.
 *
 * If no images are supplied, a set of colored placeholder circles is
 * shown so the layer never looks broken on canvas.
 *
 * The scroll/spin animation loop is disabled entirely in static
 * rendering contexts (the Framer canvas thumbnail and export), via
 * useIsStaticRenderer — items still render, using the same position
 * formula as the live loop evaluated at rest (offset 0, time 0), just
 * without the continuous requestAnimationFrame updates.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 160
 */

type Direction = "left" | "right"
type Fit = "contain" | "cover"

interface ImageItem {
    src: string
    srcSet?: string
    alt?: string
}

interface TickerProps {
    items: ImageItem[]
    itemSize: number
    fit: Fit
    gap: number
    speed: number
    direction: Direction
    waveMotion: boolean
    waveHeight: number
    waveLength: number
    showPath: boolean
    pathColor: string
    pathWidth: number
    spinItems: boolean
    spinSpeed: number
    pauseOnHover: boolean
}

// Real, currently-live photos from Unsplash's CDN (images.unsplash.com),
// used under the free Unsplash License. Hotlinked directly — no API key
// needed for this. (Note: source.unsplash.com, the old "random photo"
// shortcut, was fully shut down in 2024 and no longer works — these use
// the actual photo CDN instead, which is stable.)
function unsplash(id: string, alt: string): ImageItem {
    const base = `https://images.unsplash.com/photo-${id}`
    return {
        src: `${base}?q=80&w=200&h=200&fit=crop&auto=format`,
        srcSet: `${base}?q=80&w=200&h=200&fit=crop&auto=format 1x, ${base}?q=80&w=400&h=400&fit=crop&auto=format 2x`,
        alt,
    }
}

const DEFAULT_ITEMS: ImageItem[] = [
    unsplash("1762571909617-373e01ef8275", "Letterpress type blocks"),
    unsplash("1750653345581-77d5f260b049", "Vintage typewriter keys"),
    unsplash("1758882207168-f1649fc7c0c6", "Neon sign"),
    unsplash("1759503497905-8b04db30ee80", "Open book pages"),
    unsplash("1683234803972-cc87e51d4af1", "Wooden alphabet blocks"),
    unsplash("1633158834806-766387547d2c", "Chalkboard lettering"),
    unsplash("1705056508591-5b18b341369c", "Scrabble tiles"),
    unsplash("1642789665204-80f5131ae4db", "Newspaper close-up"),
    unsplash("1521587760476-6c12a4b040da", "Book spines on a shelf"),
    unsplash("1560091549-c6c2e6fdce59", "Typewriter with paper"),
]

interface PathTable {
    x: number[]
    y: number[]
}

// Interpolated lookup into a table of {x, y} points sampled off a real
// SVGPathElement via getPointAtLength(). Assumes x is monotonically
// increasing along the table (true for this left-to-right wave shape).
function lookupY(table: PathTable, targetX: number): number {
    const { x, y } = table
    if (x.length === 0) return 0
    const clamped = Math.min(Math.max(targetX, x[0]), x[x.length - 1])

    let lo = 0
    let hi = x.length - 1
    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1
        if (x[mid] < clamped) lo = mid
        else hi = mid
    }

    const x0 = x[lo]
    const x1 = x[hi]
    const t = x1 === x0 ? 0 : (clamped - x0) / (x1 - x0)
    return y[lo] + t * (y[hi] - y[lo])
}

export default function TickerMarquee(props: TickerProps) {
    const isStatic = useIsStaticRenderer()
    const {
        items,
        itemSize,
        fit,
        gap,
        speed,
        direction,
        waveMotion,
        waveHeight,
        waveLength,
        showPath,
        pathColor,
        pathWidth,
        spinItems,
        spinSpeed,
        pauseOnHover,
    } = props

    const validItems = (items || []).filter(
        (item): item is ImageItem => !!item && !!item.src
    )
    const list = validItems.length ? validItems : DEFAULT_ITEMS
    const itemSpacing = itemSize + gap

    const containerRef = useRef<HTMLDivElement>(null)
    const pathRef = useRef<SVGPathElement>(null)
    const itemRefs = useRef<(HTMLImageElement | null)[]>([])
    const offsetRef = useRef(0)
    const pausedRef = useRef(false)
    const lookupRef = useRef<PathTable>({ x: [], y: [] })

    // How many item slots are needed to always cover the container width
    // plus a buffer on each side for the wraparound.
    const [count, setCount] = useState(list.length * 2)
    // Tracked only so the visible wave line (if enabled) can be drawn at
    // the right size — the scroll/positioning logic doesn't need this.
    const [size, setSize] = useState({ width: 600, height: 160 })

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const measure = () => {
            const rect = el.getBoundingClientRect()
            const width =
                rect.width ||
                (typeof window !== "undefined" ? window.innerWidth : 1200)
            const needed = Math.ceil(width / itemSpacing) + list.length + 2
            setCount(needed)
            setSize({ width, height: rect.height || 160 })
        }
        measure()

        if (typeof ResizeObserver !== "undefined") {
            const ro = new ResizeObserver(measure)
            ro.observe(el)
            return () => ro.disconnect()
        }

        // Fallback for contexts without ResizeObserver support (e.g. some
        // preview/thumbnail renderers) — window resize is a safe stand-in.
        window.addEventListener("resize", measure)
        return () => window.removeEventListener("resize", measure)
    }, [itemSpacing, list.length])

    // The wave's domain spans the full wrap-around range (not just the
    // visible width), so items never run past the sampled portion of the
    // path while they're wrapping around off-screen.
    const totalWidth = count * itemSpacing
    const midY = size.height / 2
    let pathD = ""
    if (waveMotion) {
        const sampleStep = 6
        const points: string[] = []
        for (let x = 0; x <= totalWidth; x += sampleStep) {
            const y =
                midY + waveHeight * Math.sin((x / waveLength) * Math.PI * 2)
            points.push(`${x},${y.toFixed(1)}`)
        }
        pathD = `M ${points.join(" L ")}`
    }

    // Shared by both the live requestAnimationFrame loop and the static
    // (offset 0, time 0) frame used when useIsStaticRenderer() is true —
    // one formula, two callers, so the static fallback is guaranteed to
    // match the animation's own resting position rather than drifting
    // out of sync with a separately hand-written approximation.
    function computeItemTransform(i: number, offset: number, time: number) {
        let x = i * itemSpacing - offset
        x = ((x % totalWidth) + totalWidth) % totalWidth
        if (x > totalWidth - itemSpacing) x -= totalWidth

        // Prefer the real sampled path; fall back to the equivalent
        // formula if this environment couldn't sample it (see the
        // guarded effect below) so the wave still looks right.
        const y = !waveMotion
            ? 0
            : lookupRef.current.x.length > 0
              ? lookupY(lookupRef.current, x) - midY
              : waveHeight * Math.sin((x / waveLength) * Math.PI * 2)

        const rotate = spinItems ? ((time / 1000 / spinSpeed) * 360) % 360 : 0

        return `translate(${x}px, ${y}px)${
            spinItems ? ` rotate(${rotate}deg)` : ""
        }`
    }

    // Read real points off the <path> DOM node via getPointAtLength() and
    // cache them in a lookup table. This runs once per shape/size change,
    // not per frame — the animation loop below only does cheap table
    // lookups, it never calls getPointAtLength() itself.
    useEffect(() => {
        const path = pathRef.current
        if (
            !waveMotion ||
            !path ||
            typeof path.getTotalLength !== "function" ||
            typeof path.getPointAtLength !== "function"
        ) {
            lookupRef.current = { x: [], y: [] }
            return
        }
        try {
            const total = path.getTotalLength()
            const samples = 300
            const xs: number[] = []
            const ys: number[] = []
            for (let i = 0; i <= samples; i++) {
                const pt = path.getPointAtLength((i / samples) * total)
                xs.push(pt.x)
                ys.push(pt.y)
            }
            lookupRef.current = { x: xs, y: ys }
        } catch {
            // Some rendering contexts (certain preview/thumbnail sandboxes)
            // don't fully implement SVG geometry queries. Leaving the table
            // empty makes the animation loop fall back to the plain trig
            // formula below instead of crashing.
            lookupRef.current = { x: [], y: [] }
        }
    }, [waveMotion, pathD])

    useEffect(() => {
        // Static rendering contexts (Framer canvas thumbnail, export) get
        // no continuous animation at all — the JSX below already renders
        // each item at its resting (offset 0, time 0) position via the
        // same computeItemTransform() used here, so there's nothing left
        // to do but skip starting the loop.
        if (isStatic) return

        const dirSign = direction === "left" ? 1 : -1
        let raf = 0
        let lastTime: number | null = null

        const step = (time: number) => {
            if (lastTime == null) lastTime = time
            const dt = (time - lastTime) / 1000
            lastTime = time

            if (!pausedRef.current) {
                offsetRef.current += speed * dt * dirSign
                offsetRef.current =
                    ((offsetRef.current % totalWidth) + totalWidth) % totalWidth
            }

            for (let i = 0; i < count; i++) {
                const el = itemRefs.current[i]
                if (!el) continue
                el.style.transform = computeItemTransform(
                    i,
                    offsetRef.current,
                    time
                )
            }

            raf = requestAnimationFrame(step)
        }

        raf = requestAnimationFrame(step)
        return () => cancelAnimationFrame(raf)
    }, [
        isStatic,
        count,
        itemSpacing,
        totalWidth,
        speed,
        direction,
        waveMotion,
        waveHeight,
        waveLength,
        midY,
        spinItems,
        spinSpeed,
    ])

    return (
        <div
            ref={containerRef}
            onMouseEnter={() => {
                if (pauseOnHover) pausedRef.current = true
            }}
            onMouseLeave={() => {
                if (pauseOnHover) pausedRef.current = false
            }}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
            }}
        >
            {pathD && (
                <svg
                    width={size.width}
                    height={size.height}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        overflow: "visible",
                        pointerEvents: "none",
                    }}
                >
                    <path
                        ref={pathRef}
                        d={pathD}
                        fill="none"
                        stroke={showPath ? pathColor : "none"}
                        strokeWidth={pathWidth}
                        strokeLinecap="round"
                    />
                </svg>
            )}
            {Array.from({ length: count }).map((_, i) => {
                const img = list[i % list.length]
                return (
                    <img
                        key={i}
                        ref={(el) => {
                            itemRefs.current[i] = el
                        }}
                        src={img.src}
                        srcSet={img.srcSet}
                        alt={img.alt || ""}
                        draggable={false}
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: 0,
                            marginTop: -itemSize / 2,
                            width: itemSize,
                            height: itemSize,
                            objectFit: fit,
                            display: "block",
                            pointerEvents: "none",
                            willChange: isStatic ? undefined : "transform",
                            transform: computeItemTransform(i, 0, 0),
                        }}
                    />
                )
            })}
        </div>
    )
}

TickerMarquee.defaultProps = {
    items: DEFAULT_ITEMS,
    itemSize: 64,
    fit: "contain",
    gap: 32,
    speed: 80,
    direction: "left",
    waveMotion: true,
    waveHeight: 18,
    waveLength: 420,
    showPath: false,
    pathColor: "rgba(0,0,0,0.15)",
    pathWidth: 2,
    spinItems: false,
    spinSpeed: 3,
    pauseOnHover: true,
}

addPropertyControls(TickerMarquee, {
    items: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
        defaultValue: DEFAULT_ITEMS,
    },
    itemSize: {
        type: ControlType.Number,
        title: "Item Size",
        min: 12,
        max: 300,
        defaultValue: 64,
    },
    fit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["contain", "cover"],
        optionTitles: ["Contain", "Cover"],
        defaultValue: "contain",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 200,
        defaultValue: 32,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 5,
        max: 400,
        defaultValue: 80,
        description: "Pixels per second.",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
    },
    waveMotion: {
        type: ControlType.Boolean,
        title: "Wave Motion",
        defaultValue: true,
        description: "Trace a sine curve instead of a flat line.",
    },
    waveHeight: {
        type: ControlType.Number,
        title: "Wave Height",
        min: 0,
        max: 100,
        defaultValue: 18,
        hidden: (props) => !props.waveMotion,
    },
    waveLength: {
        type: ControlType.Number,
        title: "Wave Length",
        min: 50,
        max: 1200,
        defaultValue: 420,
        description: "Pixels per full wave cycle.",
        hidden: (props) => !props.waveMotion,
    },
    showPath: {
        type: ControlType.Boolean,
        title: "Show Wave Line",
        defaultValue: false,
        description: "Draw the sine curve the items are riding.",
        hidden: (props) => !props.waveMotion,
    },
    pathColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "rgba(0,0,0,0.15)",
        hidden: (props) => !props.waveMotion || !props.showPath,
    },
    pathWidth: {
        type: ControlType.Number,
        title: "Line Width",
        min: 1,
        max: 20,
        defaultValue: 2,
        hidden: (props) => !props.waveMotion || !props.showPath,
    },
    spinItems: {
        type: ControlType.Boolean,
        title: "Spin Items",
        defaultValue: false,
        description: "Rotate each item in place as it scrolls.",
    },
    spinSpeed: {
        type: ControlType.Number,
        title: "Spin Speed",
        min: 0.5,
        max: 20,
        defaultValue: 3,
        hidden: (props) => !props.spinItems,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on Hover",
        defaultValue: true,
        description: "  \nMade by [KaiSudio ](https://kaistudioco.com/)",
    },
})
