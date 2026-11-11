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


type Item = {
    image?: string | { src?: string }
    video?: string | { src?: string }
    href?: string
    label?: string
    sublabel?: string
    title?: string
    note?: string
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const mod = (n: number, m: number) => ((n % m) + m) % m
// Converts a "per frame at 60fps" blend factor k into the equivalent
// framerate-independent blend factor for the actual elapsed dt. Without
// this, a lerp(x, target, k) applied once per RAF tick eases at a different
// real-world rate whenever frame timing isn't exactly 1/60s — the motion
// itself becomes inconsistent, not just the frame rate.
const smoothAlpha = (k: number, dt: number) => 1 - Math.pow(1 - k, dt * 60)

function zoneTarget(nx: number, ny: number, dead: number) {
    const ax = Math.abs(nx),
        ay = Math.abs(ny)
    const range = 0.5 - dead
    if (ax < dead && ay < dead) return { x: 0, y: 0 }
    if (ax >= ay) {
        const t = clamp((ax - dead) / range, 0, 1) ** 2
        return { x: (nx > 0 ? 1 : -1) * t * 0.5, y: 0 }
    }
    const t = clamp((ay - dead) / range, 0, 1) ** 2
    return { x: 0, y: (ny > 0 ? 1 : -1) * t * 0.5 }
}

function normalizeImage(v: any): string | null {
    if (!v) return null
    if (typeof v === "string") return v
    if (typeof v?.src === "string") return v.src
    return null
}
function normalizeVideo(v: any): string | null {
    if (!v) return null
    if (typeof v === "string") return v.trim() || null
    if (typeof v?.src === "string") return v.src.trim() || null
    return null
}
function normalizeHref(h: any): string | null {
    if (h && typeof h === "object" && typeof (h as any).href === "string") {
        const raw = (h as any).href as string
        const slug = (h as any).collectionItem
        const resolved =
            typeof slug === "string" && /\/:[A-Za-z0-9_-]+/.test(raw)
                ? raw.replace(/\/:[A-Za-z0-9_-]+/, `/${slug}`)
                : raw
        return normalizeHref(resolved)
    }
    if (!h || typeof h !== "string") return null
    const s = h.trim()
    if (!s) return null
    if (s.startsWith("http://") || s.startsWith("https://")) return s
    return s.startsWith("/") ? s : `/${s}`
}

const isSafari = () =>
    typeof navigator !== "undefined" &&
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

// Framer's CDN resizes via ?scale-down-to=N, where N caps the LONGEST side.
// These are the only values it accepts.
const SCALE_STEPS = [512, 1024, 2048, 4096]

// Pick a source sized for how the cell is actually drawn.
//
// This used to set `w`/`dpr`/`q` — Imgix-style params that framerusercontent
// ignores — and only for Safari, so in practice every browser loaded the
// untouched original. A 165x210 cell was being fed a 4320x5400 file: ~26x
// oversampled per axis, and with the whole grid resident that came to ~1,079
// decoded megapixels.
function hiDpiSrc(src: string, itemWidth: number, magnify: number) {
    if (!src) return src
    if (src.startsWith("data:") || src.startsWith("blob:")) return src

    let url: URL
    try {
        url = new URL(
            src,
            typeof window !== "undefined"
                ? window.location.href
                : "https://framerusercontent.com"
        )
    } catch {
        return src
    }
    if (!/(^|\.)framerusercontent\.com$/.test(url.hostname)) return src

    const dpr =
        typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
    // Widest the cell ever draws: its own width, at full magnification.
    const neededW = itemWidth * clamp(1 + magnify, 1, 2.2) * dpr

    // scale-down-to caps the longest side, so a portrait image resized to N
    // is only N * (w/h) wide. Convert the width we need into the longest-side
    // value that delivers it.
    const natW = Number(url.searchParams.get("width")) || 0
    const natH = Number(url.searchParams.get("height")) || 0
    const longest = Math.max(natW, natH)
    const ratio = longest > 0 && natW > 0 ? natW / longest : 1
    const neededLongest = neededW / ratio

    const step = SCALE_STEPS.find(
        (n) => n >= neededLongest && (longest === 0 || n < longest)
    )
    if (!step) return src

    url.searchParams.set("scale-down-to", String(step))
    return url.toString()
}

function mulberry32(seed: number) {
    let a = seed >>> 0
    return () => {
        a |= 0
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function hashString(s: string) {
    let h = 2166136261 >>> 0
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i)
        h = Math.imul(h, 16777619)
    }
    return h >>> 0
}

// Largest spacing that a given item count can actually satisfy. Keeping every
// cell in the (2r+1)² block around a position distinct needs that many items,
// so r is bounded by sqrt(n) — with 30 items the nearest repeat can be pushed
// to 3 cells away, no further. More items is the only way past that.
function spacingRadius(n: number) {
    return clamp(Math.floor((Math.sqrt(n) - 1) / 2), 1, 4)
}

function buildTile(
    n: number,
    tileW: number,
    tileH: number,
    seed: number
): Int32Array {
    const tile = new Int32Array(tileW * tileH).fill(-1)
    if (n <= 0) return tile.fill(0)
    const rnd = mulberry32(seed)
    const bag = Array.from({ length: n }, (_, i) => i)
    const shuffle = () => {
        for (let i = bag.length - 1; i > 0; i--) {
            const j = Math.floor(rnd() * (i + 1))
            ;[bag[i], bag[j]] = [bag[j], bag[i]]
        }
    }
    shuffle()
    let ptr = 0
    const next = () => {
        const v = bag[ptr++ % bag.length]
        if (ptr % bag.length === 0) shuffle()
        return v
    }
    // The tile repeats, so neighbourhoods are read toroidally — otherwise two
    // copies can sit side by side across the seam, which is exactly where a
    // repeat is most obvious.
    const r = Math.min(
        spacingRadius(n),
        Math.floor((Math.min(tileW, tileH) - 1) / 2)
    )
    const at = (x: number, y: number) =>
        tile[mod(y, tileH) * tileW + mod(x, tileW)]
    const conflicts = (x: number, y: number, di: number) => {
        for (let dy = -r; dy <= r; dy++)
            for (let dx = -r; dx <= r; dx++) {
                if (!dx && !dy) continue
                if (at(x + dx, y + dy) === di) return true
            }
        return false
    }

    // Deal every item into a random cell first, so a tile that can hold the
    // whole set contains no repeat at all. Only the cells left over after
    // that need the spacing check.
    const cellCount = tileW * tileH
    const order = Array.from({ length: cellCount }, (_, i) => i)
    for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1))
        ;[order[i], order[j]] = [order[j], order[i]]
    }
    for (let k = 0; k < cellCount; k++) {
        const pos = order[k]
        const x = pos % tileW
        const y = (pos - x) / tileW
        if (k < n) {
            tile[pos] = bag[k]
            continue
        }
        let di = next(),
            tries = 0
        while (tries++ < n * 4 && n > 1 && conflicts(x, y, di)) di = next()
        tile[pos] = di
    }

    // Filling row by row cannot see the cells below and to the right, so a
    // second pass repairs whatever the first could not know about.
    for (let pass = 0; pass < 6; pass++) {
        let fixed = 0
        for (let y = 0; y < tileH; y++) {
            for (let x = 0; x < tileW; x++) {
                const i = y * tileW + x
                if (!conflicts(x, y, tile[i])) continue
                for (let t = 0; t < n * 2; t++) {
                    const cand = next()
                    if (conflicts(x, y, cand)) continue
                    tile[i] = cand
                    fixed++
                    break
                }
            }
        }
        if (!fixed) break
    }
    return tile
}

type CellRec = {
    a: HTMLAnchorElement
    img: HTMLImageElement
    video: HTMLVideoElement
    wrapperEl: HTMLDivElement
    labelWrapEl: HTMLDivElement
    labelEl: HTMLDivElement
    sublabelEl: HTMLDivElement
    r: number
    c: number
    px: number
    py: number
    gx: number
    gy: number
    src: string
    vsrc: string
    vattached?: boolean
    href?: string
    label?: string
    sublabel?: string
    idx?: number
    s?: number
}

type Props = {
    items: Item[]
    itemWidth: number
    itemHeight: number
    gap: number
    maxSpeed: number
    damping: number
    magnify: number
    radius: number
    labelFont: any
    labelColor: string
    panelEnabled: boolean
    panelWidth: number
    panelBackground: string
    panelText: string
    panelMuted: string
    panelBorder: string
    panelTitleFont: any
    panelNoteFont: any
    panelLinkLabel: string
    panelImageWidth: number
    panelNoteLines: number
}

const COAST_FRICTION = 1.4
const FLICK_CAP = 2000
const VEL_WINDOW_MS = 80
// Extra cells rendered beyond full viewport coverage, on each side.
//
// At 4 this built a 35x31 grid — 1,085 cells (~6,700 DOM nodes) to show the
// ~15 that fit on screen. At 1 it's 23x19 = 437. The buffer only has to
// outrun a flick: FLICK_CAP is 2000px/s, so ~33px per frame against a cell
// step of ~315px, leaving many frames of headroom before an edge could show.
const OVERSCAN = 1

// Expo-out, the curve the reference leans on throughout.
const IG_EASE = "cubic-bezier(0.19, 1, 0.22, 1)"
// IG_EASE is expo-out: it covers ~85% of the distance in the first quarter of
// its duration, which reads as a snap no matter how long it runs. The mask
// reveals use a gentler cubic-out so the words actually travel.
const IG_RISE = "cubic-bezier(0.33, 1, 0.68, 1)"
const IG_LABEL_PARK = "translateY(calc(100% + 4px))"
// Runs the mask reveal again from the start. The read between the two writes
// is what makes it work — without it the browser coalesces them into one
// change and the text simply stays put.
function replayRise(el: HTMLElement) {
    el.style.transition = "none"
    el.style.transform = IG_LABEL_PARK
    void el.getBoundingClientRect()
    el.style.transition = `transform 0.68s ${IG_RISE}`
    el.style.transform = "translateY(0)"
}

// Framer registers the project's face as "Neue Montreal Medium" — there is no
// family called plain "Neue Montreal" on the page, so asking for it silently
// falls through to Inter. The Placeholder entry is Framer's metric-compatible
// stand-in while the webfont loads.
// Phone close button: sized to sit inside the title's own line box (~29px)
// so it reads as centred on the text rather than hanging off its bottom.
const CLOSE_NARROW = 28

const IG_FONT =
    '"Neue Montreal Medium", "Neue Montreal Medium Placeholder", Inter, sans-serif'
// A <video> with a src holds a decoder and a connection even when it is
// nowhere near the screen. The grid keeps hundreds of cells resident, so
// sources are attached only for the handful close to the viewport and torn
// down again the moment a cell drifts away.
const VIDEO_MARGIN = 120
const MAX_ACTIVE_VIDEOS = 12

function detachCellVideo(cell: any) {
    const v = cell.video as HTMLVideoElement | undefined
    if (!v) return
    cell.vattached = false
    if (!v.getAttribute("src")) return
    v.pause()
    v.removeAttribute("src")
    v.load()
    v.style.display = "none"
}

const IG_SCROLL = "ig-scroll"
const IG_CC = "ig-cc"
// Every cell writes its own inline cursor, so hiding the pointer has to
// out-rank them — hence the !important rather than a style on the root.
const IG_CSS = `.${IG_SCROLL}{scrollbar-width:none;-ms-overflow-style:none}.${IG_SCROLL}::-webkit-scrollbar{width:0;height:0;display:none}.${IG_CC},.${IG_CC} *{cursor:none !important}`

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 600
 */
export default function InfinityGrid(props: Props) {
    const {
        items,
        itemWidth = 165,
        itemHeight = 210,
        gap = 40,
        maxSpeed = 260,
        damping = 0.85,
        magnify = 0.45,
        panelEnabled = true,
        panelWidth = 36,
        panelBackground = "#FAFAFA",
        panelText = "#0A0A0A",
        panelMuted = "#6B6B6B",
        panelBorder = "rgba(10, 10, 10, 0.14)",
        panelTitleFont,
        panelNoteFont,
        panelLinkLabel = "Read more",
        panelImageWidth = 100,
        panelNoteLines = 2,
        radius = 220,
        labelFont,
        labelColor = "#000000",
    } = props

    // Framer's canvas/thumbnail renderer: paint the grid, run no loop.
    const isStatic = useIsStaticRenderer()
    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const worldRef = React.useRef<HTMLDivElement | null>(null)
    const [size, setSize] = React.useState({ w: 0, h: 0 })

    // Motion state — all in refs, never triggers re-renders
    const inside = React.useRef(false)
    const target = React.useRef({ x: 0, y: 0 })
    const smooth = React.useRef({ x: 0, y: 0 })
    const pointerPx = React.useRef({ x: 0, y: 0, has: false })
    const offset = React.useRef({ x: 0, y: 0 })
    const vel = React.useRef({ x: 0, y: 0 })
    const cellsRef = React.useRef<CellRec[]>([])
    const suppressClickRef = React.useRef(false)
    // Tracks which cell indices (r*cols+c) currently have a non-1 --s value,
    // so the magnify pass only ever touches cells near the pointer instead
    // of looping the whole (overscanned) grid every frame.
    const prevMagCellsRef = React.useRef<Set<number>>(new Set())
    // Seconds since the last play/pause sweep — see the RAF tick.
    const videoClockRef = React.useRef(0)
    // The tile, the flying element and the drawer hero are three different
    // DOM nodes. Without carrying the playhead between them each one starts
    // its clip from zero, which reads as the video "resetting" mid-flight.
    // imgSrc is the exact source the tile had already decoded, so the flight
    // never has to fetch a differently-sized image just to show one frame.
    const handoffRef = React.useRef({ t: 0, imgSrc: "" })
    const seekToHandoff = React.useCallback(
        (e: React.SyntheticEvent<HTMLVideoElement>) => {
            const v = e.currentTarget
            const t = handoffRef.current.t
            if (t > 0 && Number.isFinite(v.duration) && t < v.duration) {
                try {
                    v.currentTime = t
                } catch {}
            }
            v.play().catch(() => {})
        },
        []
    )
    const trackHandoff = React.useCallback(
        (e: React.SyntheticEvent<HTMLVideoElement>) => {
            handoffRef.current.t = e.currentTarget.currentTime
        },
        []
    )
    // the pointer the magnify reads from, smoothed — see the tick
    const magPointer = React.useRef({ x: 0, y: 0, has: false })

    // Mirrors the visitor's prefers-reduced-motion setting; kept in sync by
    // the effect beside the animation loop.
    const reduceRef = React.useRef(false)
    const dragRef = React.useRef({
        active: false,
        pointerId: null as number | null,
        lastX: 0,
        lastY: 0,
        startX: 0,
        startY: 0,
        samples: [] as { t: number; x: number; y: number }[],
    })

    // ─── Computed layout ────────────────────────────────────────────────────────
    const stepX = Math.max(1, itemWidth + gap)
    const stepY = Math.max(1, itemHeight + gap)
    // How many columns/rows are needed to cover the viewport + overscan
    // buffer on their own, independent of the repeating tile size.
    const bufCols = Math.max(1, Math.ceil(size.w / stepX) + 2 * OVERSCAN)
    const bufRows = Math.max(1, Math.ceil(size.h / stepY) + 2 * OVERSCAN)

    // liveRef — always current, safe for imperative handlers with stale closures
    const liveRef = React.useRef({
        stepX,
        stepY,
        itemWidth,
        itemHeight,
        magnify,
        radius,
        maxSpeed,
        damping,
        cols: 1,
        rows: 1,
        bufCols: 1,
        bufRows: 1,
        viewW: 0,
        viewH: 0,
        tile: new Int32Array(0),
        tileW: 1,
        tileH: 1,
        data: [] as Array<{
            src: string
            video?: string
            href?: string
            label?: string
            sublabel?: string
            title?: string
            note?: string
        }>,
    })
    // Update every render (before any hooks that might read it)
    liveRef.current.stepX = stepX
    liveRef.current.stepY = stepY
    liveRef.current.itemWidth = itemWidth
    liveRef.current.itemHeight = itemHeight
    liveRef.current.magnify = magnify
    liveRef.current.radius = radius
    liveRef.current.maxSpeed = maxSpeed
    liveRef.current.damping = damping
    liveRef.current.viewW = size.w
    liveRef.current.viewH = size.h

    // ─── Data ───────────────────────────────────────────────────────────────────
    const data = React.useMemo(() => {
        const out: Array<{
            src: string
            video?: string
            href?: string
            label?: string
            sublabel?: string
            title?: string
            note?: string
        }> = []
        for (const it of items || []) {
            // An item needs one or the other: a poster-less video is fine,
            // and so is a plain image.
            const src = normalizeImage((it as any).image)
            const video = normalizeVideo((it as any).video) ?? undefined
            if (!src && !video) continue
            const href = normalizeHref((it as any).href) ?? undefined
            const label =
                typeof (it as any).label === "string" &&
                (it as any).label.trim()
                    ? (it as any).label
                    : undefined
            const sublabel =
                typeof (it as any).sublabel === "string" &&
                (it as any).sublabel.trim()
                    ? (it as any).sublabel
                    : undefined
            const title =
                typeof (it as any).title === "string" ? (it as any).title : ""
            const note =
                typeof (it as any).note === "string" ? (it as any).note : ""
            out.push({ src: src ?? "", video, href, label, sublabel, title, note })
        }
        return out
    }, [items])

    // ─── Detail panel ───────────────────────────────────────────────────────────
    // stage 0 idle · 1 image flying + panel sliding · 2 title · 3 chrome
    const [selected, setSelected] = React.useState<number | null>(null)
    const [stage, setStage] = React.useState(0)
    // once the flight ends the image hands off to the one inside the
    // scrolling gallery, so it can scroll with the rest of the column
    const [landed, setLanded] = React.useState(false)
    // the flying element cross-fades out over the landed hero instead of
    // being swapped for it — a swap shows a frame of whichever hasn't painted
    const [heroMount, setHeroMount] = React.useState(false)
    const [flyGone, setFlyGone] = React.useState(false)
    // a second tile tapped while the panel is open: the contents cross-fade
    // in place rather than flying home and out again
    const [swapping, setSwapping] = React.useState(false)
    const skipFlightRef = React.useRef(false)
    const swapRef = React.useRef<{ idx: number; anchor: HTMLElement } | null>(
        null
    )
    const [ctaHover, setCtaHover] = React.useState(false)
    const [narrow, setNarrow] = React.useState(false)
    const [flyBox, setFlyBox] = React.useState<{
        x: number
        y: number
        w: number
        h: number
    } | null>(null)
    const selectedItem = selected == null ? null : (data[selected] ?? null)
    // Items that share a title came from the same Index Grid row, so the rest
    // of that project's images are the gallery — no second copy of the data.
    const gallery = React.useMemo(() => {
        if (!selectedItem) return [] as string[]
        const seen = new Set<string>()
        const out: string[] = []
        // When an item carries a video the hero plays it and the item's own
        // image is spent as the poster frame, never seen in its own right.
        // Showing it below gives the drawer a second frame to scroll to.
        if (selectedItem.video && selectedItem.src) {
            seen.add(selectedItem.src)
            out.push(selectedItem.src)
        }
        if (selectedItem.title) {
            data.forEach((d, i) => {
                if (i === selected) return
                if (d.title !== selectedItem.title) return
                // a video-only sibling has no image to contribute, and an
                // empty src would resolve to the page itself
                if (!d.src || seen.has(d.src)) return
                seen.add(d.src)
                out.push(d.src)
            })
        }
        return out
    }, [data, selected, selectedItem])

    const originRef = React.useRef<DOMRect | null>(null)
    const slotRef = React.useRef<HTMLDivElement | null>(null)
    const flyRef = React.useRef<HTMLImageElement | null>(null)
    const timersRef = React.useRef<number[]>([])
    const hiddenCellRef = React.useRef<HTMLElement | null>(null)
    const hiddenCellsRef = React.useRef<HTMLElement[]>([])
    const hoverLabelRef = React.useRef<HTMLDivElement | null>(null)
    const titleRef = React.useRef<HTMLDivElement | null>(null)
    const [titleMid, setTitleMid] = React.useState(0)
    const scrollerRef = React.useRef<HTMLDivElement | null>(null)
    const thumbRef = React.useRef<HTMLDivElement | null>(null)

    const updateProgress = React.useCallback(() => {
        const el = scrollerRef.current
        const th = thumbRef.current
        if (!el || !th) return
        const max = el.scrollHeight - el.clientHeight
        if (max <= 1) {
            th.style.opacity = "0"
            th.style.transform = "scaleY(0)"
            return
        }
        th.style.opacity = "1"
        // scaleY on a full-height line: the divider fills as you read down
        th.style.transform = `scaleY(${Math.min(1, Math.max(0, el.scrollTop / max))})`
    }, [])
    const closingRef = React.useRef<{ to: DOMRect } | null>(null)
    // a tile clicked while the panel is open: it waits for the close to
    // finish, so the sequence plays out rather than cutting between items
    const pendingRef = React.useRef<{
        idx: number
        anchor: HTMLElement
    } | null>(null)
    const labelPos = React.useRef({ x: 0, y: 0, shown: false })
    const selectedRef = React.useRef<number | null>(null)
    selectedRef.current = selected
    const landedRef = React.useRef(false)
    landedRef.current = landed
    const narrowRef = React.useRef(false)
    narrowRef.current = narrow
    const panelWidthRef = React.useRef(36)
    panelWidthRef.current = panelWidth
    const panelRef = React.useRef<HTMLDivElement | null>(null)
    const closeCursorRef = React.useRef<HTMLDivElement | null>(null)
    const hoverLabelTextRef = React.useRef<HTMLDivElement | null>(null)
    // the × rides the pointer while the panel is open and the pointer is out
    // on the canvas; owned by the tick, so it is not synced from render
    const [cursorClose, setCursorClose] = React.useState(false)
    const cursorCloseRef = React.useRef(false)
    const heroMediaRef = React.useRef<
        HTMLImageElement | HTMLVideoElement | null
    >(null)

    const clearTimers = React.useCallback(() => {
        for (const t of timersRef.current) window.clearTimeout(t)
        timersRef.current = []
    }, [])

    const openItem = React.useCallback(
        (idx: number, anchor: HTMLElement) => {
            // measured now, not when it was queued — the canvas may have
            // drifted while the previous item was flying home
            // kill any residual momentum so the grid is dead still for the
            // whole flight, in both directions
            vel.current.x = 0
            vel.current.y = 0
            target.current = { x: 0, y: 0 }
            smooth.current = { x: 0, y: 0 }
            dragRef.current.active = false
            originRef.current = anchor.getBoundingClientRect()
            for (const el of hiddenCellsRef.current) el.style.visibility = ""
            hiddenCellsRef.current = []
            // every cell currently showing this item, not just the one tapped
            for (const c of cellsRef.current) {
                if (!c || c.idx !== idx) continue
                c.a.style.visibility = "hidden"
                hiddenCellsRef.current.push(c.a)
            }
            if (!hiddenCellsRef.current.includes(anchor as HTMLElement)) {
                anchor.style.visibility = "hidden"
                hiddenCellsRef.current.push(anchor)
            }
            // Snapshot what the tile was showing so the flight can continue
            // from it rather than starting over.
            const rec = cellsRef.current.find((c) => c && c.a === anchor)
            handoffRef.current = {
                t: rec?.video && rec.vattached ? rec.video.currentTime : 0,
                imgSrc: rec?.img?.currentSrc || rec?.img?.src || "",
            }

            hiddenCellRef.current = anchor
            setSelected(idx)
        },
        []
    )

    const showSourceCell = React.useCallback(() => {
        for (const el of hiddenCellsRef.current) el.style.visibility = ""
        hiddenCellsRef.current = []
        hiddenCellRef.current = null
    }, [])

    // Measure the panel's reserved image slot. Nothing in the panel is
    // transformed, so this rect is the image's true landing place even while
    // the background is still sliding in behind it.
    React.useLayoutEffect(() => {
        if (selected == null) {
            setFlyBox(null)
            return
        }
        if (closingRef.current) return
        const slot = slotRef.current
        const root = rootRef.current
        if (!slot || !root) return
        const s = slot.getBoundingClientRect()
        const r = root.getBoundingClientRect()
        const ox = narrow ? 0 : r.left
        const oy = narrow ? 0 : r.top
        setFlyBox({
            x: s.left - ox,
            y: s.top - oy,
            w: s.width,
            h: s.height,
        })
    }, [selected, narrow, panelWidth])

    // FLIP: the image is laid out over the slot, thrown back onto the tile it
    // came from, then released. It lives at the root, not inside the panel —
    // a child would be carried along by the panel's own slide.
    React.useLayoutEffect(() => {
        const img = flyRef.current
        const root = rootRef.current
        if (!flyBox || !img || !root) return
        const r = root.getBoundingClientRect()
        const closing = closingRef.current

        // where the image has to end up: the tile on the way out, the panel
        // slot on the way in
        const target = closing ? closing.to : originRef.current
        if (!target) return
        const ox = narrow ? 0 : r.left
        const oy = narrow ? 0 : r.top
        const tx = target.left - ox
        const ty = target.top - oy
        const scale = Math.max(target.width / flyBox.w, target.height / flyBox.h)
        const dx = tx + target.width / 2 - (flyBox.x + flyBox.w / 2)
        const dy = ty + target.height / 2 - (flyBox.y + flyBox.h / 2)
        const offset = `translate(${dx}px, ${dy}px) scale(${scale})`

        img.style.transformOrigin = "center center"
        img.style.transition = "none"
        img.style.transform = closing ? "translate(0px, 0px) scale(1)" : offset
        void img.getBoundingClientRect()
        img.style.transition = `transform ${
            closing ? "1.4s" : "1.45s"
        } ${IG_EASE}, opacity 0.36s linear`
        img.style.transform = closing ? offset : "translate(0px, 0px) scale(1)"

        if (closing) {
            timersRef.current.push(
                window.setTimeout(() => {
                    closingRef.current = null
                    setSelected(null)
                    showSourceCell()
                    const queued = pendingRef.current
                    if (queued) {
                        pendingRef.current = null
                        timersRef.current.push(
                            window.setTimeout(
                                () => openItem(queued.idx, queued.anchor),
                                0
                            )
                        )
                    }
                }, 1480)
            )
        }
    }, [flyBox, showSourceCell, openItem, narrow])

    // staged reveal
    React.useEffect(() => {
        setCtaHover(false)
        if (selected == null) {
            setLanded(false)
            setHeroMount(false)
            setFlyGone(false)
            setStage(0)
            return
        }
        // swapped in place — the panel is already open and already landed,
        // so none of the flight stages replay
        if (skipFlightRef.current) {
            skipFlightRef.current = false
            return
        }
        setLanded(false)
        setFlyGone(false)
        clearTimers()
        const raf = window.requestAnimationFrame(() => setStage(1))
        timersRef.current.push(window.setTimeout(() => setStage(2), 600))
        timersRef.current.push(window.setTimeout(() => setHeroMount(true), 620))
        // landed fires with ~190ms of travel left: the easing has all but
        // stopped by then, so the two elements cross-fade in place
        timersRef.current.push(window.setTimeout(() => setLanded(true), 1260))
        timersRef.current.push(window.setTimeout(() => setStage(3), 1360))
        timersRef.current.push(window.setTimeout(() => setStage(4), 1500))
        timersRef.current.push(window.setTimeout(() => setFlyGone(true), 1700))
        return () => window.cancelAnimationFrame(raf)
    }, [selected, clearTimers])

    const closePanel = React.useCallback(() => {
        clearTimers()
        setStage(0)
        const root = rootRef.current
        const slot = slotRef.current
        const cell = hiddenCellRef.current
        // Both ends are measured now, not remembered: the gallery may have
        // been scrolled and the canvas may have been dragged since opening.
        if (!root || !slot || !cell) {
            setSelected(null)
            showSourceCell()
            return
        }
        const r = root.getBoundingClientRect()
        const sRect = slot.getBoundingClientRect()
        const vh = window.innerHeight || 0
        // scrolled out of view — a flight from here would come from off-screen
        if (sRect.bottom < 40 || sRect.top > vh - 40) {
            setSelected(null)
            showSourceCell()
            return
        }
        const ox = narrow ? 0 : r.left
        const oy = narrow ? 0 : r.top
        const hero = heroMediaRef.current
        handoffRef.current = {
            t:
                hero && "currentTime" in hero
                    ? (hero as HTMLVideoElement).currentTime
                    : 0,
            imgSrc:
                hero && hero.tagName === "IMG"
                    ? (hero as HTMLImageElement).currentSrc ||
                      (hero as HTMLImageElement).src
                    : handoffRef.current.imgSrc,
        }
        closingRef.current = { to: cell.getBoundingClientRect() }
        setFlyGone(false)
        setLanded(false)
        setFlyBox({
            x: sRect.left - ox,
            y: sRect.top - oy,
            w: sRect.width,
            h: sRect.height,
        })
    }, [clearTimers, showSourceCell, narrow])

    React.useEffect(() => {
        if (selected == null) return
        const id = window.requestAnimationFrame(updateProgress)
        return () => window.cancelAnimationFrame(id)
    }, [selected, stage, updateProgress])

    React.useLayoutEffect(() => {
        if (!narrow || selected == null) {
            setTitleMid(0)
            return
        }
        const el = titleRef.current
        const parent = el?.parentElement
        // The title mounts with the panel but the button only appears at stage 3,
        // so a pass that runs before the ref is attached simply measures nothing
        // and the next one — driven by `stage` below — picks it up.
        if (!el || !parent) return
        // offsetTop/offsetHeight ignore the title's entrance transform, so this
        // lands on its final resting line rather than 12px above it.
        const measure = () =>
            setTitleMid(
                parent.getBoundingClientRect().top +
                    el.offsetTop +
                    el.offsetHeight / 2
            )
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        window.addEventListener("resize", measure)
        return () => {
            ro.disconnect()
            window.removeEventListener("resize", measure)
        }
    }, [narrow, selected, stage, selectedItem?.title])

    React.useEffect(() => {
        if (selected == null) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closePanel()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [selected, closePanel])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const update = () => setNarrow(window.innerWidth < 820)
        update()
        window.addEventListener("resize", update)
        window.addEventListener("orientationchange", update)
        return () => {
            window.removeEventListener("resize", update)
            window.removeEventListener("orientationchange", update)
        }
    }, [])

    React.useEffect(
        () => () => {
            clearTimers()
            showSourceCell()
            pendingRef.current = null
        },
        [clearTimers, showSourceCell]
    )

    React.useEffect(() => {
        if (selected == null) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closePanel()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [selected, closePanel])

    React.useEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => {
            setNarrow(el.getBoundingClientRect().width < 820)
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Preload every unique image once data is known, instead of only ever
    // requesting one the moment a cell needs it. The grid only ever cycles
    // through this fixed, small set of images (recycled across many cells),
    // so warming the browser's cache here means every later `img.src`
    // assignment — first paint or a mid-drag recycle — is a cache hit
    // instead of a fresh network+decode, which is what was showing up as
    // empty cells during fast dragging.
    const preloadRef = React.useRef<HTMLImageElement[]>([])
    React.useEffect(() => {
        const imgs: HTMLImageElement[] = []
        for (const item of data) {
            if (!item.src) continue
            const img = new Image()
            img.decoding = "async"
            img.src = hiDpiSrc(item.src, itemWidth, magnify)
            imgs.push(img)
        }
        preloadRef.current = imgs
    }, [data, itemWidth, magnify])

    // One tile is one period of the pattern, so how big it is decides how
    // close two copies of the same item can get. It used to be ~100 cells for
    // any item count, which meant each item was laid down several times per
    // period and two copies could land a couple of cells apart. Now the tile
    // is just big enough to overflow the viewport — a period boundary is then
    // always off screen — and items are dealt into it one at a time.
    const tileDims = React.useMemo(() => {
        const n = Math.max(1, data.length)
        const needW = size.w > 0 ? Math.ceil(size.w / stepX) + 1 : 0
        const needH = size.h > 0 ? Math.ceil(size.h / stepY) + 1 : 0
        const w = Math.max(2, Math.ceil(Math.sqrt(n)), needW)
        const h = Math.max(2, Math.ceil(n / w), needH)
        return { w, h }
    }, [data.length, size.w, size.h, stepX, stepY])

    const tileW = tileDims.w,
        tileH = tileDims.h

    // Total static grid size: one full repeating tile period plus a buffer
    // of bufCols/bufRows on EACH side. Because the tile pattern repeats
    // exactly every tileW/tileH steps, this fixed block can be rendered once
    // and never touched again — scrolling further just wraps the offset by
    // one whole period (see checkPeriodWrap), which is visually seamless
    // since the content on either side of that jump is identical.
    const cols = tileW + 2 * bufCols
    const rows = tileH + 2 * bufRows

    const tile = React.useMemo(() => {
        let srcHash = 0
        for (let i = 0; i < data.length; i++) srcHash ^= hashString(data[i].src)
        const seed =
            ((data.length * 1315423911 +
                tileW * 374761393 +
                tileH * 668265263 +
                Math.floor(itemWidth * 7) +
                Math.floor(itemHeight * 11) +
                Math.floor(gap * 3)) ^
                srcHash) >>>
            0
        return buildTile(data.length, tileW, tileH, seed)
    }, [data, tileW, tileH, itemWidth, itemHeight, gap])

    // Keep liveRef tile/data in sync every render
    liveRef.current.tile = tile as typeof liveRef.current.tile
    liveRef.current.tileW = tileW
    liveRef.current.tileH = tileH
    liveRef.current.data = data
    liveRef.current.cols = cols
    liveRef.current.rows = rows
    liveRef.current.bufCols = bufCols
    liveRef.current.bufRows = bufRows

    // ─── ResizeObserver ──────────────────────────────────────────────────────────
    React.useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const ro = new ResizeObserver((entries) => {
            const r = entries[0]?.contentRect
            if (r && r.width > 10 && r.height > 10)
                setSize({ w: r.width, h: r.height })
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // ─── Cell content (imperative DOM, reads from liveRef) ───────────────────────
    // Assigns the image/label/link for ONE cell at a given world coordinate.
    // Called only for cells that actually need new content (initial mount, or
    // a cell that just wrapped to the opposite edge of the grid) — never for
    // the whole grid on every scroll step.
    const assignContent = React.useCallback(
        (cell: CellRec, gx: number, gy: number) => {
            const {
                data: d,
                tile: t,
                tileW: tw,
                tileH: th,
                itemWidth: iw,
                magnify: mg,
            } = liveRef.current
            if (!d.length) return

            const idx = t[mod(gy, th) * tw + mod(gx, tw)] % d.length
            const item = d[idx]
            if (!item) return
            if (cell.idx !== idx) {
                cell.idx = idx
                cell.a.dataset.idx = String(idx)
            }
            const hasPanel = !!(item.title || item.note)

            const src = item.src ? hiDpiSrc(item.src, iw, mg) : ""
            if (cell.src !== src) {
                cell.src = src
                if (src) {
                    cell.img.src = src
                    cell.img.style.display = "block"
                } else {
                    // Never assign src="" — it resolves to the page URL and
                    // fires a bogus request.
                    cell.img.removeAttribute("src")
                    cell.img.style.display = "none"
                }
            }

            const vsrc = item.video ?? ""
            if (cell.vsrc !== vsrc) {
                // Only record what this cell *should* play. Whether it holds
                // the media is decided by the sweep below, against the
                // viewport — a recycled cell must not inherit a decoder.
                cell.vsrc = vsrc
                detachCellVideo(cell)
            }

            const label = item.label ?? ""
            const sublabel = item.sublabel ?? ""
            if (cell.label !== label) {
                cell.label = label
                cell.labelEl.textContent = label
            }
            if (cell.sublabel !== sublabel) {
                cell.sublabel = sublabel
                cell.sublabelEl.textContent = sublabel
                cell.sublabelEl.style.display = sublabel ? "block" : "none"
            }

            const href = item.href
            if (href) {
                if (cell.href !== href) {
                    cell.href = href
                    cell.a.href = href
                }
                const ext =
                    href.startsWith("http://") || href.startsWith("https://")
                if (ext) {
                    cell.a.target = "_blank"
                    cell.a.rel = "noopener noreferrer"
                } else {
                    cell.a.removeAttribute("target")
                    cell.a.removeAttribute("rel")
                }
                cell.a.style.pointerEvents = "auto"
                cell.a.style.cursor = "pointer"
            } else {
                cell.href = undefined
                cell.a.removeAttribute("href")
                cell.a.removeAttribute("target")
                cell.a.removeAttribute("rel")
                // A cell with a note is still clickable even without a link —
                // the click opens the panel rather than navigating.
                cell.a.style.pointerEvents = hasPanel ? "auto" : "none"
                cell.a.style.cursor = hasPanel ? "pointer" : "default"
            }
        },
        []
    )

    // Full (re)initialization — every cell gets its PERMANENT world
    // coordinate (c - bufCols, r - bufRows) and a one-time content
    // assignment. Content is never reassigned again after this: because the
    // tile pattern repeats exactly every tileW/tileH steps, and the grid
    // covers a full period plus buffer on every side, the same static DOM
    // stays correct for any scroll position once checkPeriodWrap keeps the
    // offset folded into a single period (see below). Only used on mount and
    // when layout/data changes, never during scrolling.
    const resetAllCells = React.useCallback(() => {
        if (!liveRef.current.data.length) return
        const { bufCols, bufRows } = liveRef.current
        for (const cell of cellsRef.current) {
            const gx = cell.c - bufCols
            const gy = cell.r - bufRows
            cell.gx = gx
            cell.gy = gy
            cell.src = ""
            cell.vsrc = ""
            detachCellVideo(cell)
            cell.label = undefined
            cell.sublabel = undefined
            cell.href = undefined
            assignContent(cell, gx, gy)
        }
    }, [assignContent])

    // applyWorldTransform — writes the world div transform from current offset.
    // SAFE to call from both RAF AND onDragMove (pointermove handler): it's a
    // pure O(1) write, no per-cell work happens here at all.
    const applyWorldTransform = React.useCallback(() => {
        const world = worldRef.current
        if (!world) return
        world.style.transform = `translate3d(${-offset.current.x}px, ${-offset.current.y}px, 0)`
    }, [])

    // checkPeriodWrap — once per animation frame, an O(1) check (no per-cell
    // work at all): keeps offset.x/y folded into a single tile period
    // [0, tileW*stepX) / [0, tileH*stepY). Since content repeats exactly
    // every tileW/tileH steps, snapping offset back by one whole period the
    // moment it exits that range is completely invisible — the static grid
    // (sized to a full period + buffer on every side, see `cols`/`rows`
    // above) is still correct on the other side of the jump. This is what
    // replaced per-cell recycling: no cell content or position is ever
    // touched again after the initial render.
    const checkPeriodWrap = React.useCallback(() => {
        const { stepX: sx, stepY: sy, tileW: tw, tileH: th } = liveRef.current
        const periodX = tw * sx
        const periodY = th * sy
        // while (not if): a single native pointermove can in rare cases
        // report a delta larger than one period, so fold back however many
        // times are actually needed. Guarded for safety.
        if (periodX > 0) {
            let guard = 0
            while (offset.current.x >= periodX && guard++ < 8)
                offset.current.x -= periodX
            guard = 0
            while (offset.current.x < 0 && guard++ < 8)
                offset.current.x += periodX
        }
        if (periodY > 0) {
            let guard = 0
            while (offset.current.y >= periodY && guard++ < 8)
                offset.current.y -= periodY
            guard = 0
            while (offset.current.y < 0 && guard++ < 8)
                offset.current.y += periodY
        }
    }, [])

    // ─── Reset when layout/data changes ────────────────────────────────────────
    React.useEffect(() => {
        offset.current.x = 0
        offset.current.y = 0
        vel.current.x = 0
        vel.current.y = 0
        requestAnimationFrame(() => {
            resetAllCells()
            applyWorldTransform()
        })
    }, [
        cols,
        rows,
        data.length,
        tileW,
        tileH,
        itemWidth,
        itemHeight,
        gap,
        resetAllCells,
        applyWorldTransform,
    ])

    // ─── Hover (mouse only, not during drag) ────────────────────────────────────
    React.useEffect(() => {
        const onMove = (e: PointerEvent) => {
            if (e.pointerType !== "mouse" || dragRef.current.active) return
            const el = rootRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            const x = e.clientX - rect.left,
                y = e.clientY - rect.top
            const isIn = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height
            inside.current = isIn
            if (!isIn) {
                target.current = { x: 0, y: 0 }
                pointerPx.current = { x: 0, y: 0, has: false }
                return
            }
            pointerPx.current = { x, y, has: true }
            target.current = reduceRef.current
                ? { x: 0, y: 0 }
                : zoneTarget(
                      x / rect.width - 0.5,
                      y / rect.height - 0.5,
                      0.16
                  )
        }
        const onBlur = () => {
            inside.current = false
            target.current = { x: 0, y: 0 }
            pointerPx.current = { x: 0, y: 0, has: false }
        }
        window.addEventListener("pointermove", onMove, { capture: true })
        window.addEventListener("blur", onBlur)
        return () => {
            window.removeEventListener(
                "pointermove",
                onMove as any,
                true as any
            )
            window.removeEventListener("blur", onBlur)
        }
    }, [])

    // ─── Drag handlers ──────────────────────────────────────────────────────────
    // All handlers use refs only — safe to add/remove from window imperatively.

    const onDragMove = React.useCallback(
        (e: PointerEvent) => {
            const d = dragRef.current
            if (!d.active || e.pointerId !== d.pointerId) return

            // Delta-based: avoids origin-capture drift
            offset.current.x -= e.clientX - d.lastX
            offset.current.y -= e.clientY - d.lastY
            d.lastX = e.clientX
            d.lastY = e.clientY

            // ← KEY: apply transform immediately here, not waiting for next RAF
            applyWorldTransform()

            const now = performance.now()
            d.samples.push({ t: now, x: e.clientX, y: e.clientY })
            while (d.samples.length > 2 && d.samples[0].t < now - VEL_WINDOW_MS)
                d.samples.shift()

            // NOTE: pointerPx is intentionally not updated here. inside.current
            // is false for the whole drag (see onPointerDown), so the magnify
            // pass never reads it while dragging — updating it required a
            // getBoundingClientRect() on every pointermove, which forces a
            // synchronous layout flush right after the transform write above.
            // That was the main source of drag jank.
        },
        [applyWorldTransform]
    )

    const endDrag = React.useCallback(
        (e: PointerEvent) => {
            const d = dragRef.current
            if (!d.active || e.pointerId !== d.pointerId) return

            if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 8)
                suppressClickRef.current = true

            const first = d.samples[0]
            if (first && first.t < performance.now() - 10) {
                const elapsed = (performance.now() - first.t) / 1000
                vel.current.x = clamp(
                    (first.x - e.clientX) / elapsed,
                    -FLICK_CAP,
                    FLICK_CAP
                )
                vel.current.y = clamp(
                    (first.y - e.clientY) / elapsed,
                    -FLICK_CAP,
                    FLICK_CAP
                )
            } else {
                vel.current.x = 0
                vel.current.y = 0
            }

            d.active = false
            d.pointerId = null
            d.samples = []
            inside.current = false
            pointerPx.current = { x: 0, y: 0, has: false }
            target.current = { x: 0, y: 0 }
            smooth.current = { x: 0, y: 0 }

            window.removeEventListener("pointermove", onDragMove)
            window.removeEventListener("pointerup", endDrag)
            window.removeEventListener("pointercancel", endDrag)
        },
        [onDragMove]
    )

    const onPointerDown = React.useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (selectedRef.current != null || closingRef.current) {
                target.current = { x: 0, y: 0 }
                smooth.current = { x: 0, y: 0 }
                vel.current.x = 0
                vel.current.y = 0
                return
            }
            inside.current = false
            target.current = { x: 0, y: 0 }
            smooth.current = { x: 0, y: 0 }
            vel.current.x = 0
            vel.current.y = 0
            dragRef.current = {
                active: true,
                pointerId: e.pointerId,
                lastX: e.clientX,
                lastY: e.clientY,
                startX: e.clientX,
                startY: e.clientY,
                samples: [{ t: performance.now(), x: e.clientX, y: e.clientY }],
            }
            window.addEventListener("pointermove", onDragMove, {
                passive: true,
            })
            window.addEventListener("pointerup", endDrag)
            window.addEventListener("pointercancel", endDrag)
        },
        [onDragMove, endDrag]
    )

    const onClickCapture = React.useCallback((e: React.MouseEvent) => {
        if (suppressClickRef.current) {
            suppressClickRef.current = false
            e.preventDefault()
            e.stopPropagation()
            return
        }
        const target = e.target as HTMLElement | null
        if (selectedRef.current != null && !narrowRef.current) {
            const panel = panelRef.current
            if (!panel || !target || !panel.contains(target)) {
                e.preventDefault()
                e.stopPropagation()
                if (!closingRef.current) closePanel()
                return
            }
        }
        const anchor = target?.closest?.("a") as HTMLAnchorElement | null
        if (!anchor) return
        // Resolve through the cell registry and the tile map rather than a
        // data attribute: every cell has a grid coordinate, so this is exact
        // for all of them, not just ones that happened to be re-assigned.
        const rec = cellsRef.current.find((c) => c && c.a === anchor)
        if (!rec) return
        const {
            tile: tl,
            tileW: tw,
            tileH: th,
            data: d,
        } = liveRef.current
        if (!d.length || !tl) return
        const idx = tl[mod(rec.gy, th) * tw + mod(rec.gx, tw)] % d.length
        const item = d[idx]
        // Nothing to show — let the anchor navigate as it always did.
        if (!item || (!item.title && !item.note)) return
        e.preventDefault()
        e.stopPropagation()
        // already closing — ignore, so a flurry of clicks can't stack up
        if (closingRef.current) return
        if (selectedRef.current != null) {
            if (selectedRef.current === idx) return
            // mid-flight: let the arrival finish rather than freezing the
            // flying element in place
            if (!landedRef.current) return
            // Flying home and straight back out again reads as a stall, so
            // the open panel cross-fades to the new item in place.
            if (swapRef.current) return
            swapRef.current = { idx, anchor }
            setSwapping(true)
            timersRef.current.push(
                window.setTimeout(() => {
                    const next = swapRef.current
                    swapRef.current = null
                    if (!next) return
                    skipFlightRef.current = true
                    showSourceCell()
                    for (const c of cellsRef.current) {
                        if (!c || c.idx !== next.idx) continue
                        c.a.style.visibility = "hidden"
                        hiddenCellsRef.current.push(c.a)
                    }
                    if (!hiddenCellsRef.current.includes(next.anchor)) {
                        next.anchor.style.visibility = "hidden"
                        hiddenCellsRef.current.push(next.anchor)
                    }
                    hiddenCellRef.current = next.anchor
                    originRef.current = next.anchor.getBoundingClientRect()
                    const rec = cellsRef.current.find(
                        (c) => c && c.a === next.anchor
                    )
                    handoffRef.current = {
                        t:
                            rec?.video && rec.vattached
                                ? rec.video.currentTime
                                : 0,
                        imgSrc: rec?.img?.currentSrc || rec?.img?.src || "",
                    }
                    const sc = scrollerRef.current
                    if (sc) sc.scrollTop = 0
                    setSelected(next.idx)
                    // one frame at zero with the new contents, then fade up
                    window.requestAnimationFrame(() => setSwapping(false))
                }, 300)
            )
            return
        }
        openItem(idx, anchor)
    }, [closePanel, openItem, showSourceCell])

    React.useEffect(() => {
        return () => {
            window.removeEventListener("pointermove", onDragMove)
            window.removeEventListener("pointerup", endDrag)
            window.removeEventListener("pointercancel", endDrag)
        }
    }, [onDragMove, endDrag])

    // With reduced motion asked for, the canvas moves only when it is
    // dragged: no drift toward the pointer, and no tiles swelling under it.
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => {
            reduceRef.current = mq.matches
            if (mq.matches) {
                target.current = { x: 0, y: 0 }
                smooth.current = { x: 0, y: 0 }
            }
        }
        sync()
        mq.addEventListener("change", sync)
        return () => mq.removeEventListener("change", sync)
    }, [])

    // ─── Animation loop (coast + hover + magnify) ────────────────────────────────
    React.useEffect(() => {
        if (!data.length || isStatic) return
        let raf = 0,
            last = performance.now()

        const tick = () => {
            const now = performance.now()
            const dt = Math.min(0.033, (now - last) / 1000)
            last = now

            // This runs before the idle bail-out below: an untouched page is
            // exactly when videos still need to start, and the sweep is a few
            // hundred cheap comparisons every 200ms.
            // Videos: play only what is actually on screen. Several hundred
            // cells stay resident, so letting every <video> run would saturate
            // the decoder for frames nobody can see. Positions are static, so
            // this is pure arithmetic against the current offset — no layout
            // reads — and a 200ms sweep is far finer than the eye needs.
            videoClockRef.current += dt
            if (videoClockRef.current >= 0.2) {
                videoClockRef.current = 0

                // With the drawer open the grid is behind it, and the flying
                // element plus the hero are both decoding the same clip. Hand
                // them the decoder by pausing every tile. Pause rather than
                // detach: detaching would reload on close and lose the frame.
                if (selectedRef.current != null || closingRef.current) {
                    for (const cell of cellsRef.current) {
                        if (cell?.vattached && !cell.video.paused)
                            cell.video.pause()
                    }
                }
                const {
                    viewW: vw,
                    viewH: vh,
                    itemWidth: viw,
                    itemHeight: vih,
                } = liveRef.current
                const ox = offset.current.x
                const oy = offset.current.y
                const cx = vw / 2
                const cy = vh / 2

                // Rank every video cell by how far its centre is from the
                // middle of the viewport. Positions are static and the world
                // moves by transform, so this is arithmetic — no layout reads.
                const ranked: Array<{ cell: any; d: number }> = []
                for (const cell of cellsRef.current) {
                    if (!cell || !cell.vsrc) continue
                    const x = cell.px - ox
                    const y = cell.py - oy
                    if (
                        x + viw < -VIDEO_MARGIN ||
                        x > vw + VIDEO_MARGIN ||
                        y + vih < -VIDEO_MARGIN ||
                        y > vh + VIDEO_MARGIN
                    ) {
                        if (cell.vattached) detachCellVideo(cell)
                        continue
                    }
                    const dx = x + viw / 2 - cx
                    const dy = y + vih / 2 - cy
                    ranked.push({ cell, d: dx * dx + dy * dy })
                }

                // A hard ceiling matters on wide screens, where "near the
                // viewport" can still be dozens of tiles.
                ranked.sort((a, b) => a.d - b.d)
                for (let i = 0; i < ranked.length; i++) {
                    const cell = ranked[i].cell
                    if (i >= MAX_ACTIVE_VIDEOS) {
                        if (cell.vattached) detachCellVideo(cell)
                        continue
                    }
                    const v = cell.video as HTMLVideoElement
                    if (!cell.vattached) {
                        cell.vattached = true
                        v.src = cell.vsrc
                        v.style.display = "block"
                    }
                    if (selectedRef.current == null && v.paused)
                        v.play().catch(() => {})
                }
            }

            const dragging = dragRef.current.active
            const hasVel =
                Math.abs(vel.current.x) > 0.02 || Math.abs(vel.current.y) > 0.02
            const hasSmooth =
                Math.abs(smooth.current.x) > 0.0005 ||
                Math.abs(smooth.current.y) > 0.0005
            const hadMag = prevMagCellsRef.current.size > 0
            const isActive =
                dragging || inside.current || hasVel || hasSmooth || hadMag

            // Nothing to animate and no magnified cells to reset — skip the
            // frame entirely instead of touching every cell's style every tick.
            if (!isActive) {
                raf = requestAnimationFrame(tick)
                return
            }

            // During drag: onDragMove already applied offset + transform synchronously.
            // RAF only needs to handle physics (coast/hover) and magnify.
            if (!dragging) {
                const { maxSpeed: ms, damping: da } = liveRef.current
                const k = clamp(1 - da, 0.03, 0.35)
                const a1 = smoothAlpha(k, dt)
                const a2 = smoothAlpha(k * 0.6, dt)
                const decay = Math.exp(-COAST_FRICTION * dt)
                vel.current.x *= decay
                vel.current.y *= decay

                if (inside.current) {
                    smooth.current.x = lerp(
                        smooth.current.x,
                        target.current.x,
                        a1
                    )
                    smooth.current.y = lerp(
                        smooth.current.y,
                        target.current.y,
                        a1
                    )
                    vel.current.x = lerp(
                        vel.current.x,
                        (smooth.current.x / 0.5) * ms,
                        a2
                    )
                    vel.current.y = lerp(
                        vel.current.y,
                        (smooth.current.y / 0.5) * ms,
                        a2
                    )
                } else {
                    smooth.current.x = lerp(smooth.current.x, 0, a1)
                    smooth.current.y = lerp(smooth.current.y, 0, a1)
                }

                offset.current.x += vel.current.x * dt
                offset.current.y += vel.current.y * dt
                applyWorldTransform()
            }

            // O(1): fold offset back into a single tile period if needed.
            checkPeriodWrap()

            // Magnify — only touch cells within the falloff radius, not the
            // whole grid. Positions are static now (nothing is recycled
            // during scrolling), so this is just each cell's fixed px/py
            // against the current offset — no per-cell DOM work competes
            // with this anymore, so it's safe to run any time the pointer is
            // over the grid, panning or not.
            const {
                magnify: mg,
                radius: rad,
                itemWidth: iw,
                itemHeight: ih,
            } = liveRef.current
            const hasFocus =
                inside.current &&
                pointerPx.current.has &&
                !reduceRef.current &&
                mg > 0 &&
                rad > 0 &&
                selectedRef.current == null
            const prevActive = prevMagCellsRef.current

            // Scale used to be written straight from the raw pointer, and
            // cells leaving the radius snapped back to 1 in a single frame.
            // Both the focus point and each cell's scale are eased now, so
            // the effect glides instead of tracking every jitter.
            const mp = magPointer.current
            if (hasFocus) {
                if (!mp.has) {
                    mp.x = pointerPx.current.x
                    mp.y = pointerPx.current.y
                    mp.has = true
                }
                const pk = smoothAlpha(0.2, dt)
                mp.x = lerp(mp.x, pointerPx.current.x, pk)
                mp.y = lerp(mp.y, pointerPx.current.y, pk)
            } else {
                mp.has = false
            }

            const sigma = rad * 0.62
            const sigma2 = 2 * sigma * sigma
            const cutoff2 = (sigma * 3) ** 2
            const ox = offset.current.x,
                oy = offset.current.y
            const ease = smoothAlpha(0.15, dt)

            const touched = new Set<number>()
            if (hasFocus) {
                for (let i = 0; i < cellsRef.current.length; i++) {
                    const cell = cellsRef.current[i]
                    const cx = cell.px - ox + iw / 2,
                        cy = cell.py - oy + ih / 2
                    if ((cx - mp.x) ** 2 + (cy - mp.y) ** 2 > cutoff2) continue
                    touched.add(i)
                }
            }
            // anything still scaled keeps easing home after the pointer goes
            for (const idx of prevActive) touched.add(idx)

            const stillActive = new Set<number>()
            for (const i of touched) {
                const cell = cellsRef.current[i]
                if (!cell) continue
                let targetS = 1
                if (hasFocus) {
                    const cx = cell.px - ox + iw / 2,
                        cy = cell.py - oy + ih / 2
                    const d2 = (cx - mp.x) ** 2 + (cy - mp.y) ** 2
                    if (d2 <= cutoff2)
                        targetS = 1 + mg * Math.exp(-d2 / sigma2)
                }
                const cur = cell.s ?? 1
                let next = lerp(cur, targetS, ease)
                if (Math.abs(next - 1) < 0.0015) next = 1
                if (next !== cur) {
                    cell.s = next
                    cell.a.style.setProperty(
                        "--s",
                        String(Math.round(next * 1000) / 1000)
                    )
                }
                if (next !== 1) stillActive.add(i)
            }
            prevMagCellsRef.current = stillActive

            // Hover label — trails the cursor instead of sitting on the tile.
            const lab = hoverLabelRef.current
            if (lab) {
                const p = pointerPx.current
                const {
                    stepX: lsx,
                    stepY: lsy,
                    itemWidth: liw,
                    itemHeight: lih,
                    tile: ltl,
                    tileW: ltw,
                    tileH: lth,
                    data: ld,
                } = liveRef.current
                let title = ""
                if (
                    inside.current &&
                    p.has &&
                    selectedRef.current == null &&
                    ld.length &&
                    ltl
                ) {
                    const wx = p.x + offset.current.x
                    const wy = p.y + offset.current.y
                    const gx = Math.floor(wx / lsx)
                    const gy = Math.floor(wy / lsy)
                    if (wx - gx * lsx <= liw && wy - gy * lsy <= lih) {
                        const di =
                            ltl[mod(gy, lth) * ltw + mod(gx, ltw)] % ld.length
                        title = ld[di]?.title || ""
                    }
                }
                const labTx = hoverLabelTextRef.current
                if (!title) {
                    if (labelPos.current.shown) {
                        labelPos.current.shown = false
                        // the text is left where it is and re-parked on the
                        // way back in, so the chip never fades out empty
                        lab.style.opacity = "0"
                    }
                } else {
                    // A different tile is a different label, so it arrives
                    // the same way the first one did rather than swapping
                    // its letters in place.
                    const changed = !!labTx && labTx.textContent !== title
                    if (changed && labTx) labTx.textContent = title
                    if (!labelPos.current.shown) {
                        labelPos.current.shown = true
                        labelPos.current.x = p.x
                        labelPos.current.y = p.y
                        lab.style.opacity = "1"
                        if (labTx) replayRise(labTx)
                    } else if (changed && labTx) {
                        replayRise(labTx)
                    }
                    const k = smoothAlpha(0.18, dt)
                    labelPos.current.x = lerp(labelPos.current.x, p.x, k)
                    labelPos.current.y = lerp(labelPos.current.y, p.y, k)
                    lab.style.transform = `translate3d(${labelPos.current.x + 16}px, ${labelPos.current.y + 16}px, 0)`
                }
            }

            // Close cursor. Tracked exactly, with no smoothing — a × that
            // trails the pointer reads as broken rather than as the cursor.
            {
                const cc = closeCursorRef.current
                const cp = pointerPx.current
                const edge = Math.max(
                    360,
                    (liveRef.current.viewW * panelWidthRef.current) / 100
                )
                const want =
                    selectedRef.current != null &&
                    !narrowRef.current &&
                    !closingRef.current &&
                    inside.current &&
                    cp.has &&
                    cp.x > edge
                if (cc && want)
                    cc.style.transform = `translate3d(${cp.x}px, ${cp.y}px, 0) translate(-50%, -50%)`
                if (want !== cursorCloseRef.current) {
                    cursorCloseRef.current = want
                    setCursorClose(want)
                }
            }
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [data.length, applyWorldTransform, checkPeriodWrap, isStatic])

    // ─── Render ─────────────────────────────────────────────────────────────────
    if (!data.length) {
        return (
            <div
                ref={rootRef}
                style={{
                    width: "100%",
                    height: "100%",
                }}
            />
        )
    }

    // Built once per grid shape. This used to run on every render, wiping
    // cellsRef mid-render and re-registering all ~437 cells — harmless while
    // the component held no state, fatal once opening a panel caused renders.
    const nodes = React.useMemo(() => {
        cellsRef.current = []
        const out: React.ReactNode[] = []
    const labelStyle: React.CSSProperties = {
        ...(labelFont || {}),
        color: labelColor,
        lineHeight: 1.3,
        whiteSpace: "normal",
        wordBreak: "break-word",
        pointerEvents: "none",
        userSelect: "none",
    }
    const loadingAttr = isSafari() ? "eager" : "lazy"

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            // Shifted so column c's static position already equals its
            // world coordinate (c - bufCols) times stepX — i.e. px === gx *
            // stepX at all times, matching how gx is defined everywhere
            // else (magnify, resetAllCells).
            const px = (c - bufCols) * stepX,
                py = (r - bufRows) * stepY
            // Same lookup assignContent does, so the markup Framer serves is
            // already correct and the client has nothing to repaint.
            const seedIdx = data.length
                ? (tile[
                      mod(r - bufRows, tileH) * tileW + mod(c - bufCols, tileW)
                  ] || 0) % data.length
                : 0
            const seedItem = data[seedIdx]
            const seedSrc = seedItem?.src
                ? hiDpiSrc(seedItem.src, itemWidth, magnify)
                : undefined
            out.push(
                <a
                    key={`${r}-${c}`}
                    ref={(el) => {
                        if (!el) return
                        const img = el.querySelector("img") as HTMLImageElement
                        const video = el.querySelector(
                            "[data-video]"
                        ) as HTMLVideoElement
                        const wrapperEl = el.querySelector(
                            "[data-imgwrap]"
                        ) as HTMLDivElement
                        const labelWrapEl = el.querySelector(
                            "[data-labelwrap]"
                        ) as HTMLDivElement
                        const labelEl = el.querySelector(
                            "[data-label]"
                        ) as HTMLDivElement
                        const sublabelEl = el.querySelector(
                            "[data-sublabel]"
                        ) as HTMLDivElement
                        if (
                            !img ||
                            !video ||
                            !wrapperEl ||
                            !labelWrapEl ||
                            !labelEl ||
                            !sublabelEl
                        )
                            return
                        el.style.setProperty("--s", "1")
                        el.style.pointerEvents = "none"
                        el.style.cursor = "default"
                        if (cellsRef.current.some((x) => x.a === el)) return
                        cellsRef.current.push({
                            a: el,
                            img,
                            video,
                            wrapperEl,
                            labelWrapEl,
                            labelEl,
                            sublabelEl,
                            r,
                            c,
                            px,
                            py,
                            gx: c - bufCols,
                            gy: r - bufRows,
                            src: "",
                            vsrc: "",
                            href: undefined,
                            label: undefined,
                            sublabel: undefined,
                        })
                    }}
                    style={{
                        position: "absolute",
                        left: px,
                        top: py,
                        width: itemWidth,
                        height: itemHeight,
                        display: "block",
                        overflow: "visible",
                        background: "transparent",
                        transform: "scale(var(--s, 1))",
                        transformOrigin: "center center",
                        willChange: "transform",
                        textDecoration: "none",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                    }}
                >
                    <div
                        data-imgwrap=""
                        style={{
                            position: "relative",
                            width: itemWidth,
                            height: itemHeight,
                            overflow: "hidden",
                        }}
                    >
                        <img
                            src={seedSrc}
                            alt=""
                            draggable={false}
                            loading={loadingAttr as any}
                            decoding="async"
                            style={{
                                width: "100%",
                                height: "100%",
                                // a srcless <img> still paints a broken-image
                                // box, and assignContent only hides it after
                                // hydration — too late for the served markup
                                display: seedSrc ? "block" : "none",
                                objectFit: "cover",
                                objectPosition: "center",
                                transform: "translateZ(0)",
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                pointerEvents: "none",
                            }}
                        />
                        {/* Sits on top of the image, so a poster shows until
                            the first frame is ready. Hidden unless the item
                            recycled into this cell actually has a video. */}
                        <video
                            data-video=""
                            muted
                            loop
                            playsInline
                            preload="none"
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                display: "none",
                                objectFit: "cover",
                                objectPosition: "center",
                                transform: "translateZ(0)",
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                pointerEvents: "none",
                            }}
                        />
                    </div>
                    <div
                        data-labelwrap=""
                        style={{
                            position: "absolute",
                            top: 0,
                            left: itemWidth + 4,
                            width: Math.round(itemWidth * 0.65),
                        }}
                    >
                        <div data-label="" style={labelStyle} />
                        <div
                            data-sublabel=""
                            style={{
                                ...labelStyle,
                                display: "none",
                                marginTop: 2,
                                opacity: 0.6,
                            }}
                        />
                    </div>
                </a>
            )
        }
    }
        return out
    }, [
        rows,
        cols,
        bufCols,
        bufRows,
        stepX,
        stepY,
        itemWidth,
        itemHeight,
        data,
        tile,
        tileW,
        tileH,
        magnify,
        labelFont,
        labelColor,
    ])

    return (
        <div
            ref={rootRef}
            className={cursorClose ? IG_CC : undefined}
            onPointerDown={onPointerDown}
            onClickCapture={onClickCapture}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                background: "transparent",
                userSelect: "none",
                touchAction: "none",
                cursor: "grab",
            }}
        >
            <style>{IG_CSS}</style>
            <div
                ref={hoverLabelRef}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 9px",
                    borderRadius: 2,
                    background: "rgba(10, 10, 10, 0.86)",
                    color: "#FAFAFA",
                    fontFamily: IG_FONT,
                    fontWeight: 500,
                    fontSize: 11,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    opacity: 0,
                    transition: "opacity 0.2s ease-out",
                    zIndex: 9,
                    willChange: "transform, opacity",
                }}
            >
                <svg
                    width={7}
                    height={7}
                    viewBox="0 0 8 8"
                    aria-hidden="true"
                    style={{
                        display: "block",
                        flex: "0 0 auto",
                        opacity: 0.75,
                    }}
                >
                    <path
                        d="M4 0.5v7M0.5 4h7"
                        stroke="currentColor"
                        strokeWidth="1.1"
                        fill="none"
                    />
                </svg>
                {/* Only the words are masked — the chip and the + arrive
                    with it. The padding/margin pair widens the clip box by a
                    pixel so descenders are not shaved off the baseline. */}
                <div
                    style={{
                        overflow: "hidden",
                        paddingBottom: 1,
                        marginBottom: -1,
                    }}
                >
                    <div
                        ref={hoverLabelTextRef}
                        style={{
                            transform: "translateY(calc(100% + 4px))",
                            transition: `transform 0.68s ${IG_RISE}`,
                            willChange: "transform",
                        }}
                    />
                </div>
            </div>
            <div
                ref={worldRef}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: cols * stepX,
                    height: rows * stepY,
                    transform: "translate3d(0px,0px,0)",
                    willChange: "transform",
                }}
            >
                {nodes}
            </div>

            {panelEnabled && selectedItem ? (
                <>
                    <div
                        ref={panelRef}
                        onPointerDown={(e) => e.stopPropagation()}
                        style={{
                            position: narrow ? "fixed" : "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            right: narrow ? 0 : undefined,
                            width: narrow ? "auto" : `${panelWidth}%`,
                            minWidth: narrow ? undefined : 360,
                            zIndex: 5,
                            pointerEvents: stage >= 1 ? "auto" : "none",
                            cursor: "default",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: panelBackground,
                                borderRight: narrow
                                    ? "none"
                                    : `1px solid ${panelBorder}`,
                                transform:
                                    stage >= 1
                                        ? "translateX(0)"
                                        : "translateX(-100%)",
                                transition:
                                    stage >= 1
                                        ? `transform 0.95s ${IG_EASE} 0.06s`
                                        : `transform 0.9s ${IG_EASE}`,
                                willChange: "transform",
                            }}
                        />
                        {!narrow ? (
                            <div
                                ref={thumbRef}
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    right: 0,
                                    top: 0,
                                    width: 1,
                                    height: "100%",
                                    background: panelText,
                                    transformOrigin: "top",
                                    transform: "scaleY(0)",
                                    opacity: 0,
                                    transition: "opacity 0.4s ease-out",
                                    pointerEvents: "none",
                                    zIndex: 6,
                                }}
                            />
                        ) : null}
                        <div
                            style={{
                                position: "relative",
                                height: "100%",
                                boxSizing: "border-box",
                                display: "flex",
                                flexDirection: "column",
                                gap: narrow ? 16 : 22,
                                padding: narrow ? "76px 0 0 0" : "60px 0 0 0",
                                overflow: "hidden",
                            }}
                        >
                            {/* Same treatment as the hover label: the words
                                rise out from under their own edge rather than
                                fading up. titleRef stays on the outer box so
                                the narrow × keeps measuring the title's
                                resting line — the clipper's negative margin
                                cancels its slack, so the height is unchanged. */}
                            <div
                                ref={titleRef}
                                style={{
                                    flex: "0 0 auto",
                                    padding: narrow ? "0 24px" : "0 32px",
                                }}
                            >
                                <div
                                    style={{
                                        overflow: "hidden",
                                        paddingBottom: 3,
                                        marginBottom: -3,
                                    }}
                                >
                                    <div
                                        style={{
                                            ...(panelTitleFont || {}),
                                            color: panelText,
                                            // offset in px, not %, so it
                                            // clears the clip box whatever
                                            // size the title font is set to
                                            transform:
                                                stage >= 2
                                                    ? "translateY(0)"
                                                    : "translateY(calc(100% + 6px))",
                                            transition:
                                                stage >= 2
                                                    ? `transform 1.1s ${IG_RISE}`
                                                    : "transform 0.2s ease-in",
                                            willChange: "transform",
                                        }}
                                    >
                                        {selectedItem.title}
                                    </div>
                                </div>
                            </div>

                            {/* the gallery: one column, each image full width */}
                            <div
                                style={{
                                    position: "relative",
                                    flex: 1,
                                    minHeight: 0,
                                    display: "flex",
                                }}
                            >
                            <div
                                ref={scrollerRef}
                                className={IG_SCROLL}
                                onScroll={updateProgress}
                                onWheel={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                style={{
                                    flex: 1,
                                    minHeight: 0,
                                    overflowY: "auto",
                                    overflowX: "hidden",
                                    overscrollBehavior: "contain",
                                    scrollBehavior: "smooth",
                                    contain: "paint",
                                    display: "flex",
                                    flexDirection: "column",
                                    // the copy sits at 24 on narrow and 32
                                    // on wide; the images line up with it
                                    // instead of running full bleed
                                    gap: 12,
                                    paddingLeft: narrow ? 24 : 32,
                                    paddingRight: narrow ? 24 : 32,
                                    paddingBottom: 8,
                                    opacity: swapping ? 0 : 1,
                                    transition: "opacity 0.3s linear",
                                }}
                            >
                                {/* first frame — what the tile flies into */}
                                <div
                                    ref={slotRef}
                                    style={{
                                        flex: "0 0 auto",
                                        width: narrow
                                            ? "100%"
                                            : `${panelImageWidth}%`,
                                        maxWidth: "100%",
                                        aspectRatio: `${itemWidth} / ${itemHeight}`,
                                        ...(narrow
                                            ? {}
                                            : {
                                                  height: "100%",
                                                  width: "auto",
                                              }),
                                        overflow: "hidden",
                                        backgroundImage:
                                            landed && selectedItem.src
                                                ? `url(${hiDpiSrc(selectedItem.src, itemWidth, magnify)})`
                                                : "none",
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                    }}
                                >
                                    {heroMount && selectedItem.video ? (
                                        <video
                                            ref={heroMediaRef as any}
                                            src={selectedItem.video}
                                            onLoadedMetadata={seekToHandoff}
                                            onTimeUpdate={trackHandoff}
                                            poster={
                                                selectedItem.src
                                                    ? hiDpiSrc(
                                                          selectedItem.src,
                                                          760,
                                                          0
                                                      )
                                                    : undefined
                                            }
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block",
                                                opacity: landed ? 1 : 0,
                                                // revealed instantly beneath
                                                // the flight, which fades off
                                                // it, and gone the instant a
                                                // close starts — it eases out
                                                // fast enough to uncover
                                                // anything left here.
                                            }}
                                        />
                                    ) : heroMount && selectedItem.src ? (
                                        <img
                                            ref={heroMediaRef as any}
                                            src={hiDpiSrc(
                                                selectedItem.src,
                                                760,
                                                0
                                            )}
                                            alt=""
                                            draggable={false}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block",
                                                opacity: landed ? 1 : 0,
                                                // revealed instantly beneath
                                                // the flight, which fades off
                                                // it, and gone the instant a
                                                // close starts — it eases out
                                                // fast enough to uncover
                                                // anything left here.
                                            }}
                                        />
                                    ) : null}
                                </div>

                                {(stage >= 4 ? gallery : []).map((g) => (
                                    <img
                                        key={g}
                                        src={hiDpiSrc(g, 760, 0)}
                                        alt=""
                                        draggable={false}
                                        loading="lazy"
                                        decoding="async"
                                        style={{
                                            flex: "0 0 auto",
                                            width: narrow
                                                ? "100%"
                                                : `${panelImageWidth}%`,
                                            height: "auto",
                                            display: "block",
                                            opacity: stage >= 4 ? 1 : 0,
                                            transition:
                                                "opacity 0.5s ease-out",
                                        }}
                                    />
                                ))}

                            </div>
                            </div>

                            {/* copy stays put while the images scroll past */}
                            <div
                                style={{
                                    flex: "0 0 auto",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 12,
                                    paddingTop: 12,
                                    paddingBottom: narrow ? 56 : 22,
                                    paddingLeft: narrow ? 24 : 32,
                                    paddingRight: narrow ? 24 : 32,
                                    background: panelBackground,
                                    willChange: "transform, opacity",
                                    opacity: stage >= 3 ? 1 : 0,
                                    transform:
                                        stage >= 3
                                            ? "translateY(0)"
                                            : "translateY(12px)",
                                    // leaving is not the reverse of
                                    // arriving: the image is already on its
                                    // way home, so the copy gets out of the
                                    // way rather than easing out behind it
                                    transition:
                                        stage >= 3
                                            ? `opacity 0.7s ease-out, transform 0.7s ${IG_EASE}`
                                            : "opacity 0.2s ease-in, transform 0.2s ease-in",
                                }}
                            >
                                {selectedItem.note ? (
                                    <div
                                        title={selectedItem.note}
                                        style={{
                                            ...(panelNoteFont || {}),
                                            color: panelMuted,
                                            maxWidth: "46ch",
                                            display: "-webkit-box",
                                            WebkitBoxOrient: "vertical",
                                            WebkitLineClamp: panelNoteLines,
                                            overflow: "hidden",
                                        }}
                                    >
                                        {selectedItem.note}
                                    </div>
                                ) : null}
                                {selectedItem.href ? (
                                    <a
                                        href={selectedItem.href}
                                        onMouseEnter={() => setCtaHover(true)}
                                        onMouseLeave={() => setCtaHover(false)}
                                        style={{
                                            alignSelf: "flex-start",
                                            display: "block",
                                            background: panelText,
                                            border: `1px solid ${panelText}`,
                                            color: panelBackground,
                                            textDecoration: "none",
                                            padding: "12px 18px 8px 18px",
                                            overflow: "hidden",
                                            fontFamily: IG_FONT,
                                            fontWeight: 500,
                                            fontSize: 14,
                                            letterSpacing: "-0.02em",
                                            lineHeight: "20px",
                                        }}
                                    >
                                        <span
                                            style={{
                                                display: "block",
                                                position: "relative",
                                                height: 20,
                                                overflow: "hidden",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    display: "block",
                                                    height: 20,
                                                    lineHeight: "20px",
                                                    transform: ctaHover
                                                        ? "translateY(-20px)"
                                                        : "translateY(0)",
                                                    transition: `transform 0.5s ${IG_EASE}`,
                                                }}
                                            >
                                                {panelLinkLabel}
                                            </span>
                                            <span
                                                aria-hidden="true"
                                                style={{
                                                    display: "block",
                                                    height: 20,
                                                    lineHeight: "20px",
                                                    transform: ctaHover
                                                        ? "translateY(-20px)"
                                                        : "translateY(0)",
                                                    transition: `transform 0.5s ${IG_EASE}`,
                                                }}
                                            >
                                                {panelLinkLabel}
                                            </span>
                                        </span>
                                    </a>
                                ) : null}

                                {/* index marker — sits under the copy, rising
                                    with the rest of the bottom chrome */}
                                {selected != null ? (
                                    <div
                                        style={{
                                            overflow: "hidden",
                                            paddingBottom: 2,
                                            marginBottom: -2,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontFamily: IG_FONT,
                                                fontSize: 11,
                                                fontWeight: 500,
                                                letterSpacing: "0.08em",
                                                lineHeight: 1.2,
                                                color: panelMuted,
                                                transform:
                                                    stage >= 3
                                                        ? "translateY(0)"
                                                        : "translateY(calc(100% + 4px))",
                                                transition:
                                                    stage >= 3
                                                        ? `transform 0.9s ${IG_RISE} 0.1s`
                                                        : "transform 0.2s ease-in",
                                                willChange: "transform",
                                            }}
                                        >
                                            {String(selected + 1).padStart(
                                                2,
                                                "0"
                                            )}
                                            <span style={{ opacity: 0.5 }}>
                                                {" / "}
                                                {String(
                                                    data.length
                                                ).padStart(2, "0")}
                                            </span>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {!flyGone && flyBox && selectedItem.video ? (
                        <video
                            ref={flyRef as any}
                            src={selectedItem.video}
                            poster={handoffRef.current.imgSrc || undefined}
                            autoPlay
                            loop
                            muted
                            playsInline
                            onLoadedMetadata={seekToHandoff}
                            onTimeUpdate={trackHandoff}
                            style={{
                                position: narrow ? "fixed" : "absolute",
                                left: flyBox.x,
                                top: flyBox.y,
                                width: flyBox.w,
                                height: flyBox.h,
                                objectFit: "cover",
                                display: "block",
                                zIndex: 7,
                                opacity: landed ? 0 : 1,
                                pointerEvents: "none",
                                willChange: "transform",
                                backfaceVisibility: "hidden",
                            }}
                        />
                    ) : !flyGone && flyBox ? (
                        <img
                            ref={flyRef}
                            src={
                                handoffRef.current.imgSrc ||
                                hiDpiSrc(selectedItem.src, 760, 0)
                            }
                            alt=""
                            draggable={false}
                            style={{
                                position: narrow ? "fixed" : "absolute",
                                left: flyBox.x,
                                top: flyBox.y,
                                width: flyBox.w,
                                height: flyBox.h,
                                objectFit: "cover",
                                display: "block",
                                zIndex: 7,
                                opacity: landed ? 0 : 1,
                                pointerEvents: "none",
                                willChange: "transform",
                                backfaceVisibility: "hidden",
                            }}
                        />
                    ) : null}

                    {narrow ? (
                        <button
                            type="button"
                            aria-label="Close"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={closePanel}
                            style={{
                                position: "fixed",
                                top:
                                    titleMid > 0
                                        ? titleMid - CLOSE_NARROW / 2
                                        : 26,
                                right: 16,
                                width: CLOSE_NARROW,
                                height: CLOSE_NARROW,
                                display: "grid",
                                placeItems: "center",
                                padding: 0,
                                background: panelBackground,
                                border: `1px solid ${panelBorder}`,
                                color: panelText,
                                cursor: "pointer",
                                zIndex: 8,
                                opacity: stage >= 3 ? 1 : 0,
                                transition:
                                    stage >= 3
                                        ? "opacity 0.6s ease-out"
                                        : "opacity 0.2s ease-in",
                            }}
                        >
                            <svg
                                width={9}
                                height={9}
                                viewBox="0 0 12 12"
                                aria-hidden="true"
                            >
                                <path
                                    d="M1 1l10 10M11 1L1 11"
                                    stroke="currentColor"
                                    strokeWidth="1.2"
                                    fill="none"
                                />
                            </svg>
                        </button>
                    ) : (
                        /* Pointer-bound on desktop: the whole canvas is the
                           close target, so this is a cursor, not a button —
                           it never takes the press itself. The transform is
                           written by the tick. */
                        <div
                            ref={closeCursorRef}
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                width: 40,
                                height: 40,
                                display: "grid",
                                placeItems: "center",
                                background: panelBackground,
                                border: `1px solid ${panelBorder}`,
                                color: panelText,
                                pointerEvents: "none",
                                zIndex: 9,
                                opacity: cursorClose && stage >= 3 ? 1 : 0,
                                transition: "opacity 0.18s linear",
                                willChange: "transform",
                            }}
                        >
                            <svg
                                width={12}
                                height={12}
                                viewBox="0 0 12 12"
                                aria-hidden="true"
                            >
                                <path
                                    d="M1 1l10 10M11 1L1 11"
                                    stroke="currentColor"
                                    strokeWidth="1.2"
                                    fill="none"
                                />
                            </svg>
                        </div>
                    )}
                </>
            ) : null}
        </div>
    )
}


addPropertyControls(InfinityGrid, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.Image,
                    title: "Image",
                    description: "Also the poster frame when a video is set.",
                },
                // A File control does not survive inside an Array item — the
                // value is stored but never reaches the component — so this
                // takes the asset URL directly. Upload the file to the project,
                // then paste its URL here.
                video: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://…/clip.mp4",
                },
                href: { type: ControlType.Link, title: "Link" },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    placeholder: "Title…",
                },
                sublabel: {
                    type: ControlType.String,
                    title: "Sublabel",
                    placeholder: "Subtitle…",
                },
                title: {
                    type: ControlType.String,
                    title: "Panel Title",
                    placeholder: "Project name…",
                },
                note: {
                    type: ControlType.String,
                    title: "Panel Note",
                    displayTextArea: true,
                    placeholder: "Short note…",
                },

            },
        },
        // A dropped instance has to show something, so the array ships with a
        // few items rather than the empty state.
        defaultValue: [
            {
                image: "https://framerusercontent.com/images/BY6z6wTfAlBXl4vk0x5O6omfyy0.jpg",
                title: "First Project",
                note: "A short line about the work.",
            },
            {
                image: "https://framerusercontent.com/images/kb1XeIyn1jP7eYq1PTpEt8DLxEM.jpg",
                title: "Second Project",
                note: "A short line about the work.",
            },
            {
                image: "https://framerusercontent.com/images/syWtsaXOeG84Q53c3b49KoCQ.jpg",
                title: "Third Project",
                note: "A short line about the work.",
            },
        ],
    },
    itemWidth: {
        type: ControlType.Number,
        title: "Item Width",
        min: 60,
        max: 600,
        step: 5,
        defaultValue: 165,
    },
    itemHeight: {
        type: ControlType.Number,
        title: "Item Height",
        min: 60,
        max: 600,
        step: 5,
        defaultValue: 210,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 260,
        step: 5,
        defaultValue: 40,
    },
    maxSpeed: {
        type: ControlType.Number,
        title: "Max Speed",
        min: 0,
        max: 1200,
        step: 20,
        defaultValue: 260,
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        min: 0,
        max: 0.9,
        step: 0.05,
        defaultValue: 0.85,
    },
    magnify: {
        type: ControlType.Number,
        title: "Magnify",
        min: 0,
        max: 1.5,
        step: 0.05,
        defaultValue: 0.45,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 60,
        max: 700,
        step: 10,
        defaultValue: 220,
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultValue: { fontSize: "13px", variant: "Regular" },
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "#000000",
    },
    panelEnabled: {
        type: ControlType.Boolean,
        title: "Detail Panel",
        defaultValue: true,
    },
    panelWidth: {
        type: ControlType.Number,
        title: "Panel Width",
        min: 25,
        max: 70,
        step: 1,
        unit: "%",
        defaultValue: 36,
        hidden: (p: any) => !p.panelEnabled,
    },
    panelBackground: {
        type: ControlType.Color,
        title: "Panel BG",
        defaultValue: "#FAFAFA",
        hidden: (p: any) => !p.panelEnabled,
    },
    panelText: {
        type: ControlType.Color,
        title: "Panel Text",
        defaultValue: "#0A0A0A",
        hidden: (p: any) => !p.panelEnabled,
    },
    panelMuted: {
        type: ControlType.Color,
        title: "Panel Muted",
        defaultValue: "#6B6B6B",
        hidden: (p: any) => !p.panelEnabled,
    },
    panelBorder: {
        type: ControlType.Color,
        title: "Panel Border",
        defaultValue: "rgba(10, 10, 10, 0.14)",
        hidden: (p: any) => !p.panelEnabled,
    },
    panelTitleFont: {
        type: ControlType.Font,
        title: "Panel Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            variant: "Medium",
            lineHeight: "1.1em",
            letterSpacing: "-0.02em",
        },
        hidden: (p: any) => !p.panelEnabled,
    },
    panelNoteFont: {
        type: ControlType.Font,
        title: "Panel Note Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "15px", variant: "Regular", lineHeight: "1.5em" },
        hidden: (p: any) => !p.panelEnabled,
    },
    panelLinkLabel: {
        type: ControlType.String,
        title: "Panel Link Label",
        defaultValue: "Read more",
        hidden: (p: any) => !p.panelEnabled,
    },
    panelImageWidth: {
        type: ControlType.Number,
        title: "Panel Image Width",
        min: 40,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: 100,
        hidden: (p: any) => !p.panelEnabled,
    },
    panelNoteLines: {
        type: ControlType.Number,
        title: "Note Lines",
        min: 1,
        max: 8,
        step: 1,
        defaultValue: 2,
        hidden: (p: any) => !p.panelEnabled,
    },
})
