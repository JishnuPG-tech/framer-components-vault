import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Cell = { v: number; id: number; until: number; on: boolean } | null
type Media = { src: string; kind: "video" | "image" }
type Pool = Map<string, HTMLVideoElement | HTMLImageElement>

function shuffle<T>(a: T[]) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

// One element per file for the whole visit. Each file downloads once and is
// then moved between tiles, never re-requested.
function getEl(pool: Pool, m: Media) {
    const existing = pool.get(m.src)
    if (existing) return existing

    let el: HTMLVideoElement | HTMLImageElement
    if (m.kind === "video") {
        const v = document.createElement("video")
        v.muted = true
        v.defaultMuted = true
        v.loop = true
        v.playsInline = true
        v.setAttribute("muted", "")
        v.setAttribute("playsinline", "")
        v.setAttribute("disablepictureinpicture", "")
        v.preload = "auto"
        v.addEventListener(
            "loadedmetadata",
            () => {
                if (isFinite(v.duration) && v.duration > 1)
                    v.currentTime = Math.random() * v.duration * 0.8
            },
            { once: true }
        )
        v.src = m.src
        el = v
    } else {
        const img = new Image()
        img.decoding = "async"
        img.src = m.src
        el = img
    }
    Object.assign(el.style, {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        pointerEvents: "none",
    })
    pool.set(m.src, el)
    return el
}

// Pick a new start point only inside what's already downloaded, so a jump
// never triggers another network request.
function randomBufferedTime(v: HTMLVideoElement) {
    const b = v.buffered
    if (!b || !b.length) return null
    const i = Math.floor(Math.random() * b.length)
    const start = b.start(i)
    const end = b.end(i)
    if (end - start < 0.5) return null
    return start + Math.random() * (end - start) * 0.9
}

function Tile({
    media,
    pool,
    on,
    fade,
}: {
    media: Media
    pool: Pool
    on: boolean
    fade: number
}) {
    const box = useRef<HTMLDivElement>(null)
    const [ready, setReady] = useState(false)

    useLayoutEffect(() => {
        const host = box.current
        if (!host) return
        const el = getEl(pool, media)
        host.appendChild(el)
        let alive = true
        const mark = () => {
            if (alive) setReady(true)
        }

        if (el instanceof HTMLVideoElement) {
            const t = randomBufferedTime(el)
            if (t !== null) el.currentTime = t
            el.addEventListener("playing", mark)
            el.play()
                .then(mark)
                .catch(() => {})
            return () => {
                alive = false
                el.removeEventListener("playing", mark)
                el.pause()
                if (el.parentNode === host) host.removeChild(el)
            }
        }

        const img = el as HTMLImageElement
        if (img.complete && img.naturalWidth) mark()
        else img.addEventListener("load", mark, { once: true })
        return () => {
            alive = false
            img.removeEventListener("load", mark)
            if (img.parentNode === host) host.removeChild(img)
        }
    }, [media.src])

    useEffect(() => {
        const el = pool.get(media.src)
        if (!on && el instanceof HTMLVideoElement) el.pause()
    }, [on])

    return (
        <div
            ref={box}
            style={{
                position: "absolute",
                inset: 0,
                opacity: on && ready ? 1 : 0,
                transition: `opacity ${fade}ms linear`,
            }}
        />
    )
}

/**
 * Rows Desktop / Rows Mobile:
 *   > 0  -> exactly that many rows; the component's height follows the grid (use Height: Fit)
 *   0    -> fill the component's height (use Height: Fixed, e.g. 100vh, or Fill)
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function RandomVideoGrid(props) {
    const {
        columnsDesktop,
        columnsMobile,
        rowsDesktop,
        rowsMobile,
        breakpoint,
        aspect,
        gap,
        radius,
        fade,
        tick,
        background,
        alignRows,
        style,
    } = props
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // Videos and images go into one shuffled pool. Duplicate files are dropped,
    // since each file can only be on screen once.
    const videoList: string[] = props.videos || []
    const imageList: string[] = props.images || []
    const mediaKey = videoList.join("|") + "||" + imageList.join("|")
    const media: Media[] = useMemo(() => {
        const seen = new Set<string>()
        const out: Media[] = []
        const add = (src: string, kind: Media["kind"]) => {
            if (!src || seen.has(src)) return
            seen.add(src)
            out.push({ src, kind })
        }
        videoList.forEach((s) => add(s, "video"))
        imageList.forEach((s) => add(s, "image"))
        return out
    }, [mediaKey])

    const opts = useRef(props)
    opts.current = props
    const mediaRef = useRef(media)
    mediaRef.current = media

    const poolRef = useRef<Pool>(new Map())
    const ref = useRef<HTMLDivElement>(null)
    const idRef = useRef(0)
    const [size, setSize] = useState({ w: 0, h: 0 })
    const [cells, setCells] = useState<Cell[]>([])
    const [visible, setVisible] = useState(true)

    // Release everything only when the component itself goes away
    useEffect(() => {
        const pool = poolRef.current
        return () => {
            pool.forEach((el) => {
                if (el instanceof HTMLVideoElement) {
                    el.pause()
                    el.removeAttribute("src")
                    el.load()
                }
            })
            pool.clear()
        }
    }, [])

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const ro = new ResizeObserver(([e]) => {
            const w = Math.round(e.contentRect.width)
            const h = Math.round(e.contentRect.height)
            setSize((s) => (s.w === w && s.h === h ? s : { w, h }))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        const el = ref.current
        if (!el) return
        let inView = true
        const update = () =>
            setVisible(inView && document.visibilityState === "visible")
        const io = new IntersectionObserver(([e]) => {
            inView = e.isIntersecting
            update()
        })
        io.observe(el)
        document.addEventListener("visibilitychange", update)
        return () => {
            io.disconnect()
            document.removeEventListener("visibilitychange", update)
        }
    }, [])

    // Pause everything off screen, resume what's attached when back
    useEffect(() => {
        poolRef.current.forEach((el) => {
            if (!(el instanceof HTMLVideoElement)) return
            if (!visible) el.pause()
            else if (el.isConnected) el.play().catch(() => {})
        })
    }, [visible])

    const isMobile = size.w > 0 && size.w < breakpoint
    const cols = Math.max(1, isMobile ? columnsMobile : columnsDesktop)
    const cellW = size.w > 0 ? (size.w - gap * (cols - 1)) / cols : 0
    const cellH = cellW / aspect

    const fixedRows = isMobile ? rowsMobile : rowsDesktop
    const fillMode = !(fixedRows > 0)
    const rows =
        cellH <= 0
            ? 0
            : fillMode
              ? Math.max(1, Math.ceil((size.h + gap) / (cellH + gap)))
              : fixedRows
    const total = cols * rows

    useEffect(() => {
        idRef.current++
        setCells(Array(total).fill(null))
    }, [total, cols, mediaKey])

    useEffect(() => {
        if (!total || isCanvas || !visible) return

        const step = () => {
            const { density, minLife, maxLife, fade, maxDesktop, maxMobile } =
                opts.current
            const list = mediaRef.current
            if (!list.length) return
            const now = performance.now()
            // Each file can only be in one tile at a time
            const cap = Math.min(isMobile ? maxMobile : maxDesktop, list.length)

            setCells((prev) => {
                if (prev.length !== total) return prev
                let changed = false
                const next = prev.slice()
                const justClosed = new Set<number>()

                next.forEach((c, i) => {
                    if (!c || c.until > now) return
                    changed = true
                    if (c.on) {
                        next[i] = { ...c, on: false, until: now + fade + 50 }
                        justClosed.add(i)
                    } else {
                        next[i] = null
                    }
                })

                const mounted = next.filter(Boolean).length
                const active = next.filter((c) => c && c.on).length
                const target = Math.min(
                    cap,
                    Math.round(total * density * (0.8 + Math.random() * 0.4))
                )
                const maxAdd = Math.max(1, Math.round(target * 0.15))

                const empty = shuffle(
                    next
                        .map((c, i) => (c || justClosed.has(i) ? -1 : i))
                        .filter((i) => i >= 0)
                )
                // Includes fading tiles: they still hold their element
                const inUse = new Set(next.filter(Boolean).map((c) => c!.v))

                let added = 0
                let count = active
                let held = mounted
                while (
                    count < target &&
                    held < cap &&
                    added < maxAdd &&
                    empty.length
                ) {
                    const free = list
                        .map((_, k) => k)
                        .filter((k) => !inUse.has(k))
                    if (!free.length) break
                    const v = free[Math.floor(Math.random() * free.length)]
                    const i = empty.pop()!
                    inUse.add(v)
                    next[i] = {
                        v,
                        id: idRef.current++,
                        on: true,
                        until:
                            now + minLife + Math.random() * (maxLife - minLife),
                    }
                    count++
                    held++
                    added++
                    changed = true
                }
                return changed ? next : prev
            })
        }

        step()
        const t = setInterval(step, tick)
        return () => clearInterval(t)
    }, [total, tick, isCanvas, visible, isMobile, mediaKey])

    const shown: Cell[] =
        cells.length === total ? cells : Array(total).fill(null)

    return (
        <div
            ref={ref}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: fillMode ? "100%" : "auto",
                minHeight: fillMode ? undefined : "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: alignRows,
                overflow: "hidden",
                background,
            }}
        >
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridAutoRows: cellH || 0,
                    gap,
                    width: "100%",
                    ...(fillMode
                        ? {
                              position: "absolute",
                              inset: 0,
                              overflow: "hidden",
                              alignContent: "start",
                          }
                        : {}),
                }}
            >
                {shown.map((c, i) => (
                    <div
                        key={i}
                        style={{
                            position: "relative",
                            overflow: "hidden",
                            borderRadius: radius,
                            background: isCanvas
                                ? "rgba(255,255,255,0.07)"
                                : "transparent",
                        }}
                    >
                        {!isCanvas && c && media[c.v] && (
                            <Tile
                                key={c.id}
                                media={media[c.v]}
                                pool={poolRef.current}
                                on={c.on}
                                fade={fade}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

RandomVideoGrid.defaultProps = {
    videos: [],
    images: [],
    columnsDesktop: 6,
    columnsMobile: 3,
    rowsDesktop: 5,
    rowsMobile: 7,
    breakpoint: 810,
    aspect: 1.75,
    gap: 16,
    radius: 14,
    density: 0.35,
    maxDesktop: 8,
    maxMobile: 4,
    minLife: 1200,
    maxLife: 4000,
    tick: 250,
    fade: 120,
    background: "#000000",
    alignRows: "center",
}

addPropertyControls(RandomVideoGrid, {
    videos: {
        type: ControlType.Array,
        title: "Videos",
        control: {
            type: ControlType.File,
            allowedFileTypes: ["mp4", "webm", "mov"],
        },
    },
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.File,
            allowedFileTypes: ["jpg", "jpeg", "png", "webp", "avif", "gif"],
        },
    },
    columnsDesktop: {
        type: ControlType.Number,
        title: "Cols Desktop",
        min: 1,
        max: 12,
        step: 1,
    },
    columnsMobile: {
        type: ControlType.Number,
        title: "Cols Mobile",
        min: 1,
        max: 8,
        step: 1,
    },
    rowsDesktop: {
        type: ControlType.Number,
        title: "Rows Desktop",
        min: 0,
        max: 20,
        step: 1,
        description: "0 = fill height",
    },
    rowsMobile: {
        type: ControlType.Number,
        title: "Rows Mobile",
        min: 0,
        max: 30,
        step: 1,
        description: "0 = fill height",
    },
    breakpoint: {
        type: ControlType.Number,
        title: "Breakpoint",
        min: 300,
        max: 1600,
        step: 10,
        unit: "px",
    },
    aspect: {
        type: ControlType.Number,
        title: "Tile W/H",
        min: 0.5,
        max: 3,
        step: 0.05,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
    density: {
        type: ControlType.Number,
        title: "Density",
        min: 0.05,
        max: 1,
        step: 0.05,
    },
    maxDesktop: {
        type: ControlType.Number,
        title: "Max On Desk",
        min: 1,
        max: 30,
        step: 1,
    },
    maxMobile: {
        type: ControlType.Number,
        title: "Max On Mob",
        min: 1,
        max: 20,
        step: 1,
    },
    minLife: {
        type: ControlType.Number,
        title: "Min Life",
        min: 100,
        max: 10000,
        step: 50,
        unit: "ms",
    },
    maxLife: {
        type: ControlType.Number,
        title: "Max Life",
        min: 100,
        max: 15000,
        step: 50,
        unit: "ms",
    },
    tick: {
        type: ControlType.Number,
        title: "Tick",
        min: 50,
        max: 2000,
        step: 10,
        unit: "ms",
    },
    fade: {
        type: ControlType.Number,
        title: "Fade",
        min: 0,
        max: 1500,
        step: 10,
        unit: "ms",
    },
    background: { type: ControlType.Color, title: "Background" },
    alignRows: {
        type: ControlType.Enum,
        title: "Align Rows",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Top", "Center", "Bottom"],
        displaySegmentedControl: true,
    },
})
