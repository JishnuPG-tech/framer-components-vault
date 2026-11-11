import {
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
    type CSSProperties,
    type ReactElement,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useInView, useReducedMotion } from "framer-motion"

// ---------- Types ----------

type ImageSource = { src: string; srcSet?: string; alt?: string }
type Fit = "cover" | "contain"
type Layout = "masonry" | "grid"

interface Props {
    images?: ImageSource[]
    layout?: Layout
    cellWidth?: number
    cellHeight?: number
    gap?: number
    radius?: number
    fit?: Fit
    cellBg?: string
    background?: string
    dragPan?: boolean
    wheelPan?: boolean
    glide?: number
    drift?: number
    driftAngle?: number
    pauseOnHover?: boolean
    hoverZoom?: number
    edgeFade?: boolean
    reveal?: Reveal
    revealDuration?: number
    revealScale?: number
    style?: CSSProperties
}

type Reveal = "none" | "fade" | "scale" | "blur"

type Sim = {
    x: number
    y: number
    vx: number
    vy: number
    raf: number
    last: number
    dragging: boolean
}

type ColumnItem = { idx: number; top: number; height: number }
type Column = { items: ColumnItem[]; period: number; offset: number }

// ---------- Helpers ----------

const PLACEHOLDERS = [
    "linear-gradient(135deg, #FFD1A8, #FF8A5B)",
    "linear-gradient(135deg, #B8E1FF, #4C8DFF)",
    "linear-gradient(135deg, #D4FC79, #2AA876)",
    "linear-gradient(135deg, #FDDB92, #F6A04D)",
    "linear-gradient(135deg, #E0C3FC, #8E54E9)",
    "linear-gradient(135deg, #FFC3D8, #E8467C)",
]
// Varied shapes for placeholders so masonry is visible before images are added
const PLACEHOLDER_RATIOS = [0.8, 1.33, 0.75, 1, 1.5, 0.67]

const clamp = (v: number, min: number, max: number): number =>
    v < min ? min : v > max ? max : v

const mod = (a: number, n: number): number => ((a % n) + n) % n

const DEFAULT_W = 1200
const DEFAULT_H = 720

// Small seeded random generator, so the shuffle is the same every load
const seeded = (seed: number) => () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// A different order of all images for each column
const columnOrder = (c: number, n: number): number[] => {
    const order = Array.from({ length: n }, (_, i) => i)
    const rand = seeded(c * 9973 + n * 31 + 7)
    for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1))
        const t = order[i]
        order[i] = order[j]
        order[j] = t
    }
    return order
}

// Which image a grid cell shows. Rows and columns are shifted so the
// same image never sits directly next to or under itself.
const pick = (c: number, r: number, n: number): number => {
    const shift = n > 3 ? Math.max(2, Math.round(n * 0.4)) : 1
    return mod(c * shift + r, n)
}

/**
 * Image Canvas
 * An endless wall of images you can pan in any direction. Masonry keeps
 * every image's real shape with the same gap all around; Grid puts them
 * in equal boxes. Drag with a soft glide, or scroll and swipe with a
 * trackpad. The wall moves as one layer, so panning stays smooth and
 * images never reload.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 720
 */
export default function ImageCanvas(props: Props) {
    const {
        images = [],
        layout = "masonry",
        cellWidth = 240,
        cellHeight = 300,
        gap = 24,
        radius = 12,
        fit = "cover",
        cellBg = "transparent",
        background = "#F3F1EF",
        dragPan = true,
        wheelPan = true,
        glide = 60,
        drift = 0,
        driftAngle = 45,
        pauseOnHover = true,
        hoverZoom = 1.04,
        edgeFade = false,
        reveal = "scale",
        revealDuration = 0.6,
        revealScale = 0.9,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const reduceMotion = useReducedMotion()
    const masonry = layout === "masonry"

    const list = images.filter((img) => img && img.src)
    const count = list.length || PLACEHOLDERS.length

    const rootRef = useRef<HTMLDivElement>(null)
    const layerRef = useRef<HTMLDivElement>(null)
    const colRefs = useRef<(HTMLDivElement | null)[]>([])
    const inView = useInView(rootRef, { amount: 0 })
    const cellClass = `ic-${useId().replace(/[^a-zA-Z0-9]/g, "")}`

    const [size, setSize] = useState({ w: 0, h: 0 })

    /* ── Image shapes, read once per image ─────────────── */
    const [ratios, setRatios] = useState<Record<string, number>>({})
    const srcKey = list.map((i) => i.src).join("|")
    useEffect(() => {
        if (!masonry || typeof window === "undefined") return
        let alive = true
        const found: Record<string, number> = {}
        let pending = 0
        list.forEach((item) => {
            if (ratios[item.src]) return
            pending++
            const probe = new Image()
            probe.decoding = "async"
            probe.onload = () => {
                if (probe.naturalWidth && probe.naturalHeight) {
                    found[item.src] = probe.naturalWidth / probe.naturalHeight
                }
                if (--pending === 0 && alive)
                    setRatios((cur) => ({ ...cur, ...found }))
            }
            probe.onerror = () => {
                if (--pending === 0 && alive)
                    setRatios((cur) => ({ ...cur, ...found }))
            }
            probe.src = item.src
        })
        return () => {
            alive = false
        }
    }, [srcKey, masonry])

    const ratioOf = (idx: number): number => {
        if (!list.length)
            return PLACEHOLDER_RATIOS[idx % PLACEHOLDER_RATIOS.length]
        const src = list[idx % list.length].src
        return ratios[src] || cellWidth / Math.max(1, cellHeight)
    }

    /* ── Geometry ──────────────────────────────────────── */
    const stepX = Math.max(8, cellWidth + gap)
    const stepY = Math.max(8, cellHeight + gap)
    const tileCols = size.w ? Math.max(2, Math.ceil(size.w / stepX) + 1) : 0
    const tileRows = size.h ? Math.max(2, Math.ceil(size.h / stepY) + 1) : 0
    const tileW = tileCols * stepX
    const tileH = tileRows * stepY

    // Masonry: each column is its own endless loop of images at their
    // real shape, with the same gap everywhere
    const columns: Column[] = []
    if (masonry && tileCols && size.h) {
        for (let c = 0; c < tileCols; c++) {
            const items: ColumnItem[] = []
            const order = columnOrder(c, count)
            let top = 0
            let r = 0
            // Long enough to cover the frame, and at least one full set of images
            while (top < size.h + cellWidth * 2 || r < count) {
                const idx = order[r % count]
                const height = Math.round(cellWidth / ratioOf(idx))
                items.push({ idx, top, height })
                top += height + gap
                r++
                if (r > 200) break
            }
            // Columns start at different heights for a natural, staggered look
            columns.push({ items, period: top, offset: ((c * 0.37) % 1) * top })
        }
    }

    const sim = useRef<Sim>({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        raf: 0,
        last: 0,
        dragging: false,
    })
    const hovering = useRef(false)

    const settings = useRef({
        masonry,
        tileW,
        tileH,
        columns,
        glide,
        drift,
        driftAngle,
        pauseOnHover,
        animate: true,
    })
    settings.current = {
        masonry,
        tileW,
        tileH,
        columns,
        glide,
        drift,
        driftAngle,
        pauseOnHover,
        animate: !isStatic && !reduceMotion,
    }

    /* ── Reveal bookkeeping ─────────────────────────────
       Every image exists as a few identical twins so the wall can loop.
       Twins share one key. An entrance plays only when a key becomes
       visible for the first time, never when one twin hands over to
       another at a loop seam, so there is nothing to flicker. */
    type Tracked = {
        el: HTMLElement
        key: string
        x: number
        y: number
        h: number
        col: number
    }
    const tracked = useRef<Tracked[]>([])
    const visibleKeys = useRef<Set<string>>(new Set())
    const revealSettings = useRef({
        reveal,
        revealDuration,
        revealScale,
        cellWidth,
        w: size.w,
        h: size.h,
    })
    revealSettings.current = {
        reveal,
        revealDuration,
        revealScale,
        cellWidth,
        w: size.w,
        h: size.h,
    }

    const runReveal = (
        layerX: number,
        layerY: number,
        colY: number[] | null
    ) => {
        const rs = revealSettings.current
        const animate = settings.current.animate && rs.reveal !== "none"
        const now = new Set<string>()
        const entering: HTMLElement[] = []
        const margin = 1
        for (const t of tracked.current) {
            const x = layerX + t.x
            const y = (colY ? (colY[t.col] ?? 0) : layerY) + t.y
            const visible =
                x < rs.w - margin &&
                x + rs.cellWidth > margin &&
                y < rs.h - margin &&
                y + t.h > margin
            if (!visible) continue
            now.add(t.key)
            if (animate && !visibleKeys.current.has(t.key)) entering.push(t.el)
        }
        visibleKeys.current = now
        if (!entering.length) return
        const from: Keyframe =
            rs.reveal === "fade"
                ? { opacity: 0 }
                : rs.reveal === "blur"
                  ? { opacity: 0, filter: "blur(12px)" }
                  : {
                        opacity: 0,
                        transform: `scale(${clamp(rs.revealScale, 0, 1)})`,
                    }
        const to: Keyframe =
            rs.reveal === "fade"
                ? { opacity: 1 }
                : rs.reveal === "blur"
                  ? { opacity: 1, filter: "blur(0px)" }
                  : { opacity: 1, transform: "scale(1)" }
        const duration = clamp(rs.revealDuration, 0.1, 2) * 1000
        for (const el of entering) {
            el.animate([from, to], {
                duration,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            })
        }
    }

    /* ── Paint ─────────────────────────────────────────── */
    const paint = () => {
        const layer = layerRef.current
        const cfg = settings.current
        if (!layer || !cfg.tileW) return
        const s = sim.current

        // Sideways: the whole wall moves as one layer
        s.x = mod(s.x, cfg.tileW)
        layer.style.transform = `translate3d(${(s.x - cfg.tileW).toFixed(2)}px, ${
            cfg.masonry ? 0 : (mod(s.y, cfg.tileH) - cfg.tileH).toFixed(2)
        }px, 0)`

        const layerX = s.x - cfg.tileW
        if (!cfg.masonry) {
            s.y = mod(s.y, cfg.tileH)
            runReveal(layerX, s.y - cfg.tileH, null)
            return
        }
        // Up and down: each column loops on its own length
        const total = cfg.columns.length
        const colY: number[] = []
        for (let k = 0; k < total * 2; k++) {
            const col = colRefs.current[k]
            const data = cfg.columns[k % total]
            if (!data || !data.period) continue
            const y = mod(s.y + data.offset, data.period) - data.period
            colY[k] = y
            if (col)
                col.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`
        }
        runReveal(layerX, 0, colY)
    }

    /* ── Loop: glide after a throw, and the optional drift ── */
    const driftActive = () => {
        const cfg = settings.current
        return (
            cfg.animate &&
            cfg.drift > 0 &&
            !sim.current.dragging &&
            !(cfg.pauseOnHover && hovering.current)
        )
    }

    const tick = (now: number) => {
        const s = sim.current
        const cfg = settings.current
        const dt = s.last ? clamp((now - s.last) / 16.67, 0, 2.5) : 1
        s.last = now

        const keep = 0.86 + (clamp(cfg.glide, 0, 100) / 100) * 0.12
        const decay = Math.pow(keep, dt)
        s.vx *= decay
        s.vy *= decay
        s.x += s.vx * dt
        s.y += s.vy * dt

        if (driftActive()) {
            const a = (cfg.driftAngle * Math.PI) / 180
            const speed = cfg.drift * 0.06 * dt
            s.x -= Math.cos(a) * speed
            s.y -= Math.sin(a) * speed
        }

        paint()

        const gliding = Math.abs(s.vx) > 0.05 || Math.abs(s.vy) > 0.05
        if (!gliding) {
            s.vx = 0
            s.vy = 0
        }
        if (gliding || driftActive()) {
            s.raf = requestAnimationFrame(tick)
        } else {
            s.raf = 0
            s.last = 0
        }
    }

    const wake = () => {
        const s = sim.current
        if (!settings.current.animate || s.raf) return
        s.last = 0
        s.raf = requestAnimationFrame(tick)
    }

    const stop = () => {
        const s = sim.current
        if (s.raf) cancelAnimationFrame(s.raf)
        s.raf = 0
        s.last = 0
    }

    /* ── Size ──────────────────────────────────────────── */
    useLayoutEffect(() => {
        const root = rootRef.current
        if (!root) return
        const measure = () => {
            const w = root.clientWidth
            const h = root.clientHeight
            setSize((cur) => (cur.w === w && cur.h === h ? cur : { w, h }))
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        ro.observe(root)
        return () => ro.disconnect()
    }, [])

    // Centre once, then keep everything placed after any layout change
    const centred = useRef(false)
    const layoutKey = `${masonry}-${tileCols}-${tileRows}-${srcKey}-${cellWidth}-${cellHeight}-${gap}-${size.w}-${size.h}`
    const lastLayout = useRef("")
    useLayoutEffect(() => {
        if (!tileW) return
        const root = rootRef.current
        if (root) {
            tracked.current = Array.from(
                root.querySelectorAll<HTMLElement>(`.${cellClass}`)
            ).map((el) => ({
                el,
                key: el.dataset.twin || "",
                x: Number(el.dataset.bx) || 0,
                y: Number(el.dataset.by) || 0,
                h: el.offsetHeight,
                col: Number(el.dataset.col),
            }))
        }
        // A new layout replays the entrance for what is on screen
        if (lastLayout.current !== layoutKey) {
            lastLayout.current = layoutKey
            visibleKeys.current = new Set()
        }
        if (!centred.current) {
            sim.current.x = ((size.w % stepX) - gap) / 2
            sim.current.y = 0
            centred.current = true
        }
        paint()
    })

    useEffect(() => {
        if (inView && drift > 0) wake()
        if (!inView) stop()
    }, [inView, drift, driftAngle])

    useEffect(() => {
        if (typeof document === "undefined") return
        const onVisibility = () => {
            if (document.visibilityState !== "visible") stop()
            else if (inView && drift > 0) wake()
        }
        document.addEventListener("visibilitychange", onVisibility)
        return () =>
            document.removeEventListener("visibilitychange", onVisibility)
    }, [inView, drift])

    useEffect(() => () => stop(), [])

    /* ── Wheel and trackpad panning ───────────────────── */
    useEffect(() => {
        const root = rootRef.current
        if (!root || isStatic || !wheelPan) return
        let frame = 0
        let px = 0
        let py = 0
        const flush = () => {
            frame = 0
            sim.current.x -= px
            sim.current.y -= py
            px = 0
            py = 0
            paint()
        }
        const onWheel = (e: WheelEvent) => {
            if (e.ctrlKey) return // pinch zoom
            e.preventDefault()
            const unit =
                e.deltaMode === 1
                    ? 16
                    : e.deltaMode === 2
                      ? root.clientHeight
                      : 1
            const s = sim.current
            s.vx = 0
            s.vy = 0
            const sideways = e.shiftKey && !e.deltaX
            px += (sideways ? e.deltaY : e.deltaX) * unit
            py += (sideways ? 0 : e.deltaY) * unit
            if (!frame) frame = requestAnimationFrame(flush)
        }
        root.addEventListener("wheel", onWheel, { passive: false })
        return () => {
            root.removeEventListener("wheel", onWheel)
            if (frame) cancelAnimationFrame(frame)
        }
    }, [isStatic, wheelPan])

    /* ── Dragging ──────────────────────────────────────── */
    const drag = useRef<{ x: number; y: number; t: number; id: number } | null>(
        null
    )
    const [grabbing, setGrabbing] = useState(false)
    const interactive = !isStatic && dragPan

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!interactive || (e.pointerType === "mouse" && e.button !== 0))
            return
        try {
            e.currentTarget.setPointerCapture(e.pointerId)
        } catch {}
        stop()
        const s = sim.current
        s.vx = 0
        s.vy = 0
        s.dragging = true
        drag.current = {
            x: e.clientX,
            y: e.clientY,
            t: performance.now(),
            id: e.pointerId,
        }
        setGrabbing(true)
    }

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const d = drag.current
        if (!d || d.id !== e.pointerId) return
        const now = performance.now()
        const dx = e.clientX - d.x
        const dy = e.clientY - d.y
        const frames = Math.max(1, (now - d.t) / 16.67)
        const s = sim.current
        s.x += dx
        s.y += dy
        s.vx = s.vx * 0.4 + (dx / frames) * 0.6
        s.vy = s.vy * 0.4 + (dy / frames) * 0.6
        d.x = e.clientX
        d.y = e.clientY
        d.t = now
        paint()
    }

    const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
        const d = drag.current
        if (!d) return
        drag.current = null
        try {
            e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {}
        sim.current.dragging = false
        setGrabbing(false)
        if (performance.now() - d.t > 80) {
            sim.current.vx = 0
            sim.current.vy = 0
        }
        wake()
    }

    /* ── Keyboard ──────────────────────────────────────── */
    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (isStatic) return
        const s = sim.current
        const push = 14
        if (e.key === "ArrowLeft") s.vx = push
        else if (e.key === "ArrowRight") s.vx = -push
        else if (e.key === "ArrowUp") s.vy = push
        else if (e.key === "ArrowDown") s.vy = -push
        else return
        e.preventDefault()
        wake()
    }

    /* ── Render ────────────────────────────────────────── */
    const width = style?.width ?? DEFAULT_W
    const height = style?.height ?? DEFAULT_H
    const fade =
        "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent), linear-gradient(to bottom, transparent, #000 8%, #000 92%, transparent)"

    const renderCell = (
        key: string,
        idx: number,
        cellStyle: CSSProperties,
        objectFit: Fit,
        twin: string,
        bx: number,
        by: number,
        col: number
    ) => {
        const source = list.length ? list[idx % list.length] : null
        return (
            <div
                key={key}
                className={cellClass}
                data-twin={twin}
                data-bx={bx}
                data-by={by}
                data-col={col}
                style={{
                    position: "absolute",
                    borderRadius: radius,
                    overflow: "hidden",
                    backgroundColor: cellBg,
                    backgroundImage: source
                        ? undefined
                        : PLACEHOLDERS[idx % PLACEHOLDERS.length],
                    transition: isStatic
                        ? undefined
                        : "transform 240ms cubic-bezier(0.22, 1, 0.36, 1)",
                    ...cellStyle,
                }}
            >
                {source && (
                    <img
                        src={source.src}
                        srcSet={source.srcSet}
                        sizes={`${cellWidth}px`}
                        alt={source.alt || ""}
                        draggable={false}
                        decoding="async"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit,
                            display: "block",
                            pointerEvents: "none",
                        }}
                    />
                )}
            </div>
        )
    }

    let content: ReactElement | null = null

    if (masonry && columns.length) {
        // Two copies of the column set side by side for the sideways loop
        content = (
            <div
                ref={layerRef}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: tileW * 2,
                    height: "100%",
                    willChange: isStatic ? undefined : "transform",
                }}
            >
                {Array.from({ length: columns.length * 2 }, (_, k) => {
                    const col = columns[k % columns.length]
                    return (
                        <div
                            key={`col-${k}`}
                            ref={(node) => {
                                colRefs.current[k] = node
                            }}
                            style={{
                                position: "absolute",
                                left: k * stepX,
                                top: 0,
                                width: cellWidth,
                                height: col.period * 2,
                                willChange: isStatic ? undefined : "transform",
                            }}
                        >
                            {/* Each column stacked twice for its own vertical loop */}
                            {[0, 1].map((copy) =>
                                col.items.map((item, r) =>
                                    renderCell(
                                        `${k}-${copy}-${r}`,
                                        item.idx,
                                        {
                                            left: 0,
                                            top: copy * col.period + item.top,
                                            width: cellWidth,
                                            height: item.height,
                                        },
                                        "cover",
                                        `${k % columns.length}-${r}`,
                                        k * stepX,
                                        copy * col.period + item.top,
                                        k
                                    )
                                )
                            )}
                        </div>
                    )
                })}
            </div>
        )
    } else if (!masonry && tileCols && tileRows) {
        const cells: ReactElement[] = []
        for (let ty = 0; ty < 2; ty++) {
            for (let tx = 0; tx < 2; tx++) {
                for (let r = 0; r < tileRows; r++) {
                    for (let c = 0; c < tileCols; c++) {
                        cells.push(
                            renderCell(
                                `${tx}${ty}-${c}-${r}`,
                                pick(c, r, count),
                                {
                                    left: tx * tileW + c * stepX,
                                    top: ty * tileH + r * stepY,
                                    width: cellWidth,
                                    height: cellHeight,
                                },
                                fit,
                                `${c}-${r}`,
                                tx * tileW + c * stepX,
                                ty * tileH + r * stepY,
                                -1
                            )
                        )
                    }
                }
            }
        }
        content = (
            <div
                ref={layerRef}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: tileW * 2,
                    height: tileH * 2,
                    willChange: isStatic ? undefined : "transform",
                }}
            >
                {cells}
            </div>
        )
    }

    return (
        <div
            ref={rootRef}
            role="region"
            aria-roledescription="image canvas"
            aria-label="Image wall. Drag or use the arrow keys to explore"
            tabIndex={isStatic ? -1 : 0}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerEnter={() => {
                hovering.current = true
            }}
            onPointerLeave={() => {
                hovering.current = false
                if (drift > 0 && inView) wake()
            }}
            style={{
                ...style,
                width,
                height,
                position: "relative",
                overflow: "hidden",
                background,
                touchAction: interactive ? "none" : "auto",
                userSelect: "none",
                WebkitUserSelect: "none",
                cursor: interactive
                    ? grabbing
                        ? "grabbing"
                        : "grab"
                    : "default",
                WebkitMaskImage: edgeFade ? fade : undefined,
                maskImage: edgeFade ? fade : undefined,
                WebkitMaskComposite: edgeFade ? "source-in" : undefined,
                maskComposite: edgeFade ? "intersect" : undefined,
            }}
        >
            {content}

            {!isStatic && hoverZoom > 1 && (
                <style>{`@media (hover: hover) { .${cellClass}:hover { transform: scale(${hoverZoom}); } }`}</style>
            )}
        </div>
    )
}

ImageCanvas.displayName = "Image Canvas"

addPropertyControls(ImageCanvas, {
    images: {
        type: ControlType.Array,
        title: "Images",
        maxCount: 60,
        control: { type: ControlType.ResponsiveImage },
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["masonry", "grid"],
        optionTitles: ["Masonry", "Grid"],
        defaultValue: "masonry",
        displaySegmentedControl: true,
        description:
            "Masonry keeps each image's shape with equal gaps. Grid uses equal boxes",
    },
    cellWidth: {
        type: ControlType.Number,
        title: "Image Width",
        defaultValue: 240,
        min: 40,
        max: 800,
        step: 4,
        unit: "px",
    },
    cellHeight: {
        type: ControlType.Number,
        title: "Image Height",
        defaultValue: 300,
        min: 40,
        max: 800,
        step: 4,
        unit: "px",
        hidden: (p: Props) => p.layout !== "grid",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 24,
        min: 0,
        max: 200,
        step: 4,
        unit: "px",
    },
    fit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Fill", "Fit"],
        defaultValue: "cover",
        displaySegmentedControl: true,
        description:
            "Fill makes every image fill its box. Fit shows the whole image",
        hidden: (p: Props) => p.layout !== "grid",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 12,
        min: 0,
        max: 200,
        step: 4,
        unit: "px",
    },
    cellBg: {
        type: ControlType.Color,
        title: "Image Fill",
        defaultValue: "transparent",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F3F1EF",
    },
    dragPan: { type: ControlType.Boolean, title: "Drag", defaultValue: true },
    wheelPan: {
        type: ControlType.Boolean,
        title: "Scroll to Pan",
        defaultValue: true,
        description:
            "Mouse wheel and trackpad pan the canvas while the pointer is over it",
    },
    glide: {
        type: ControlType.Number,
        title: "Glide",
        defaultValue: 60,
        min: 0,
        max: 100,
        step: 1,
        description: "How far it keeps moving after a throw",
    },
    drift: {
        type: ControlType.Number,
        title: "Auto Drift",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        description: "Slowly moves on its own. 0 is off",
    },
    driftAngle: {
        type: ControlType.Number,
        title: "Drift Angle",
        defaultValue: 45,
        min: 0,
        max: 360,
        step: 15,
        unit: "°",
        hidden: (p: Props) => !p.drift,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on Hover",
        defaultValue: true,
        hidden: (p: Props) => !p.drift,
    },
    hoverZoom: {
        type: ControlType.Number,
        title: "Hover Zoom",
        defaultValue: 1.04,
        min: 1,
        max: 1.4,
        step: 0.02,
    },
    edgeFade: {
        type: ControlType.Boolean,
        title: "Edge Fade",
        defaultValue: false,
    },
    reveal: {
        type: ControlType.Enum,
        title: "Reveal",
        options: ["scale", "fade", "blur", "none"],
        optionTitles: ["Fade + Scale", "Fade", "Fade + Blur", "None"],
        defaultValue: "scale",
        description: "How images appear as they come into view while panning",
    },
    revealScale: {
        type: ControlType.Number,
        title: "Start Scale",
        defaultValue: 0.9,
        min: 0,
        max: 1,
        step: 0.05,
        description:
            "Size images grow from. 0 pops in from nothing, 1 is no scale",
        hidden: (p: Props) => p.reveal !== "scale",
    },
    revealDuration: {
        type: ControlType.Number,
        title: "Reveal Speed",
        defaultValue: 0.6,
        min: 0.1,
        max: 2,
        step: 0.05,
        unit: "s",
        hidden: (p: Props) => p.reveal === "none",
    },
})
