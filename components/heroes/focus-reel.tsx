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


type Mode = "image" | "video"
type WheelMode = "off" | "horizontal" | "any"
type Align = "bottom" | "center"
type Behavior = "loop" | "play"

type Item = {
    image?: any
    video?: string
    videoUrl?: string
    videoPoster?: any
    left?: string
    right?: string
    videoRight?: string
    // older items stored the name as `title` / `videoTitle`
    title?: string
    videoTitle?: string
}

type Props = {
    items?: Item[]
    mode?: Mode
    showToggle?: boolean
    initialIndex?: number
    centerWidth?: number
    aspect?: number
    sideScale?: number
    gap?: number
    radius?: number
    speed?: number
    pin?: boolean
    behavior?: Behavior
    scrollPerItem?: number
    stageHeight?: number
    dwell?: number
    drag?: boolean
    wheel?: WheelMode
    keyboard?: boolean
    leftFont?: React.CSSProperties
    leftColor?: string
    rightFont?: React.CSSProperties
    rightColor?: string
    font?: React.CSSProperties
    toggleTrack?: string
    togglePill?: string
    toggleText?: string
    toggleActiveText?: string
    showIndicator?: boolean
    barsPerItem?: number
    barWidth?: number
    barGap?: number
    barMinHeight?: number
    barMaxHeight?: number
    align?: Align
    activeColor?: string
    inactiveColor?: string
    indicatorBottom?: number
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const mod = (n: number, m: number) => ((n % m) + m) % m
// Shortest signed distance on a ring of size m, in [-m/2, m/2)
const wrap = (v: number, m: number) => mod(v + m / 2, m) - m / 2

// Opacity by distance from the focused slot (0 = centre).
const FADE = [1, 1, 0.86, 0.74, 0.64, 0.27, 0]
const VISIBLE = FADE.length - 1
const fadeAt = (a: number) => {
    if (a >= VISIBLE) return 0
    const i = Math.floor(a)
    return lerp(FADE[i], FADE[i + 1], a - i)
}

const MIN_SLOTS = 11 // enough virtual slots to fill ±5 either side
const CAPTION_GAP = 14
const CAPTION_H = 22
const BUCKETS = [512, 1024, 2048, 4096]

const useIsoLayoutEffect =
    typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

/**
 * Framer's CDN resizes via ?scale-down-to=N (caps the longest side).
 * A plain <img> would otherwise download the untouched original upload.
 */
function resolveImage(img: any, needPx: number) {
    if (!img) return null
    const raw: string | undefined = typeof img === "string" ? img : img.src
    if (!raw) return null
    const srcSet = typeof img === "object" && img.srcSet ? img.srcSet : undefined
    if (srcSet) return { src: raw, srcSet }
    try {
        const u = new URL(raw)
        if (u.hostname.endsWith("framerusercontent.com")) {
            const n =
                BUCKETS.find((b) => b >= needPx * 0.9) ?? BUCKETS[BUCKETS.length - 1]
            u.searchParams.set("scale-down-to", String(n))
            return { src: u.toString(), srcSet: undefined }
        }
    } catch {}
    return { src: raw, srcSet: undefined }
}

type Layout = {
    n: number
    m: number
    cw: number
    ch: number
    side: number
    S: number // centre → first neighbour
    step: number // neighbour → neighbour
    radius: number
    bpi: number
    bars: number
    loop: boolean
    center: boolean
    minH: number
    maxH: number
}

function itemVisual(d: number, L: Layout) {
    const a = Math.abs(d)
    if (a >= VISIBLE) return { visibility: "hidden" as const }
    const sc = lerp(1, L.side, Math.min(a, 1))
    const x = Math.sign(d) * (a <= 1 ? a * L.S : L.S + (a - 1) * L.step)
    return {
        visibility: "visible" as const,
        opacity: fadeAt(a),
        zIndex: 100 - Math.round(a * 10),
        transform: `translate3d(${x.toFixed(2)}px,0,0) scale(${sc.toFixed(4)})`,
        borderRadius: L.radius / sc,
    }
}

function captionVisual(d: number) {
    const o = clamp(1 - Math.abs(d) * 2.2, 0, 1)
    return {
        opacity: o,
        visibility: o > 0 ? ("visible" as const) : ("hidden" as const),
        transform: `translate3d(0,${(clamp(d, -1, 1) * 6).toFixed(2)}px,0)`,
    }
}

// Indicator bar k: only the bar nearest the carousel position is raised. When
// looping the distance is circular, so the raised bar hops from the last bar
// to the first; when playing left to right it just travels along the row.
function barAt(k: number, pos: number, L: Layout) {
    let dist: number
    if (L.loop) {
        const dd = Math.abs(k / L.bpi - mod(pos, L.n))
        dist = Math.min(dd, L.n - dd)
    } else {
        dist = Math.abs(k / L.bpi - clamp(pos, 0, L.n - 1))
    }
    let f = Math.max(0, 1 - dist * L.bpi)
    f = f * f * (3 - 2 * f)
    const h = lerp(L.minH, L.maxH, f)
    return { h, f, bottom: L.center ? (L.maxH - h) / 2 : 0 }
}

// Scroll progress (0-1) -> carousel position, with a short rest on each item.
// `steps` is how many item-to-item moves the scroll covers; n steps is a full
// lap, so the last move wraps back onto the first item.
function progressToPos(progress: number, steps: number, dwell: number) {
    if (steps < 1) return 0
    const u = clamp(progress, 0, 1) * steps
    const i = Math.min(Math.floor(u), steps - 1)
    const d = clamp(dwell / 100, 0, 0.45)
    const x = clamp((u - i - d) / (1 - 2 * d), 0, 1)
    return i + x * x * (3 - 2 * x)
}

const hasImage = (it: Item) => {
    const img = it.image
    const src = typeof img === "string" ? img : img?.src
    return typeof src === "string" && !!src.trim()
}
const videoSrc = (it: Item) =>
    (it.video && it.video.trim()) || (it.videoUrl && it.videoUrl.trim()) || ""
const hasVideo = (it: Item) => !!videoSrc(it)
const hasMedia = (it: Item) => hasImage(it) || hasVideo(it)

const fill: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    pointerEvents: "none",
    userSelect: "none",
}

/**
 * Focus Reel
 *
 * It turns a plain gallery into a moment people stay for. One image or video
 * sits centre-screen in full focus, while its neighbours scale back and fade
 * away on either side. Scroll, swipe or drag and the sequence glides round in
 * a seamless loop, locked into the viewport. Or switch it to play once from
 * left to right, then hand the page back. Every piece gets a clean numbered
 * caption, and a row of slim lines below tracks where you are.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 760
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function FocusReel(props: Props) {
    const {
        items = [],
        mode: modeProp = "image",
        showToggle = true,
        initialIndex = 0,
        centerWidth = 400,
        aspect = 0.75,
        sideScale = 0.52,
        gap = 22,
        radius = 4,
        speed = 1,
        pin = true,
        behavior = "loop",
        scrollPerItem = 70,
        stageHeight = 100,
        dwell = 25,
        drag = true,
        wheel = "horizontal",
        keyboard = true,
        leftFont,
        leftColor = "#111111",
        rightFont,
        rightColor = "#111111",
        font,
        toggleTrack = "#EFEFEF",
        togglePill = "#111111",
        toggleText = "#8A8A8A",
        toggleActiveText = "#FFFFFF",
        showIndicator = true,
        barsPerItem = 4,
        barWidth = 2,
        barGap = 5,
        barMinHeight = 12,
        barMaxHeight = 28,
        align = "bottom",
        activeColor = "#111111",
        inactiveColor = "#C9C9C9",
        indicatorBottom = 24,
    } = props

    const isStatic = useIsStaticRenderer()
    const [mode, setMode] = React.useState<Mode>(modeProp)
    const all = React.useMemo(
        () => (Array.isArray(items) ? items.filter(Boolean) : []),
        [items]
    )
    // Each mode shows only its own media, so videos and images never mix. Items
    // without that media are left out (no blank tiles). If nothing matches yet,
    // fall back to whatever has any media, then to every item.
    const list = React.useMemo(() => {
        const own = all.filter(mode === "video" ? hasVideo : hasImage)
        if (own.length) return own
        const any = all.filter(hasMedia)
        return any.length ? any : all
    }, [all, mode])
    const n = list.length
    // Two caption fields sit at opposite ends under the image. The left one
    // defaults to the item number (01, 02, ...); the right one is the name, and
    // in Video mode it can differ since an item's video may show something else.
    const captionOf = (it: Item, idx: number) => {
        const inVideo = mode === "video" && hasVideo(it)
        const right =
            (inVideo && (it.videoRight || it.videoTitle)) ||
            it.right ||
            it.title ||
            ""
        const left = it.left && it.left.trim() ? it.left : String(idx + 1).padStart(2, "0")
        return { left, right }
    }
    const live = pin && !isStatic && n > 1
    // locked ("loop"): full-viewport stage, wheel/swipe/drag loop it forever,
    // the page stays put.
    const locked = live && behavior === "loop"
    // pinned ("play"): tall scroll track; scrolling plays the images once from
    // first to last (no wrap-around), then the page carries on.
    const pinned = live && behavior === "play"
    const m = n ? (pinned ? n : n * Math.ceil(MIN_SLOTS / n)) : 0
    const bpi = Math.round(clamp(barsPerItem, 1, 8))
    const bars = n > 1 ? (pinned ? (n - 1) * bpi + 1 : n * bpi) : 0
    const anyVideo = all.some(hasVideo)

    const [size, setSize] = React.useState({ w: 1200, h: 700 })
    // Videos that failed to start or load (keyed by source). They fall back to a still.
    const [failedVideos, setFailedVideos] = React.useState<Record<string, boolean>>({})
    const toggleRefs = React.useRef<(HTMLButtonElement | null)[]>([])
    const liveRef = React.useRef<HTMLDivElement>(null)
    const labelsRef = React.useRef<string[]>([])
    labelsRef.current = list.map((it, i) => captionOf(it, i).right)

    const rootRef = React.useRef<HTMLDivElement>(null)
    const trackRef = React.useRef<HTMLDivElement>(null)
    const midRef = React.useRef<HTMLDivElement>(null)
    const itemEls = React.useRef<(HTMLDivElement | null)[]>([])
    const capEls = React.useRef<(HTMLDivElement | null)[]>([])
    const dialBars = React.useRef<(HTMLDivElement | null)[]>([])
    const dialFills = React.useRef<(HTMLDivElement | null)[]>([])
    const videoEls = React.useRef<(HTMLVideoElement | null)[]>([])
    const playing = React.useRef<(boolean | undefined)[]>([])
    // Whether the carousel is on screen and the tab is visible. Animation and
    // video playback only run while this is true.
    const inView = React.useRef(true)

    const start = n ? mod(Math.round(initialIndex), n) : 0
    const st = React.useRef({
        pos: start,
        target: start,
        vel: 0,
        raf: 0,
        last: 0,
        dragging: false,
        pending: false,
        moved: false,
        pid: -1,
        downX: 0,
        downY: 0,
        originX: 0,
        originY: 0,
        originTarget: 0,
        samples: [] as { t: number; v: number }[],
        wheelTimer: 0 as any,
        wheelOrigin: 0,
        lastActive: -1,
        readScroll: null as null | (() => void),
    }).current

    // ---- layout ---------------------------------------------------------
    const capBlock = CAPTION_GAP + CAPTION_H
    const asp = clamp(aspect, 0.3, 3)
    const cw = Math.max(
        40,
        Math.min(
            centerWidth,
            size.w * 0.8,
            (size.h - capBlock - 16) * asp
        )
    )
    const side = clamp(sideScale, 0.2, 1)
    const sw = cw * side
    const layout: Layout = {
        n,
        m,
        cw,
        ch: cw / asp,
        side,
        S: (cw + sw) / 2 + gap,
        step: sw + gap,
        radius,
        bpi,
        bars,
        loop: !pinned,
        center: align === "center",
        minH: Math.max(1, barMinHeight),
        maxH: Math.max(barMinHeight, barMaxHeight),
    }
    const layoutRef = React.useRef(layout)
    layoutRef.current = layout
    const dOf = (i: number) => (layout.loop ? wrap(i - st.pos, m) : i - st.pos)

    // Bucket is derived from props only, so it stays stable across resizes.
    const needPx = Math.max(centerWidth, centerWidth / asp) * 2

    // Everything in the row is snapped to whole pixels so the lines render
    // evenly. If the row would not fit, the spacing tightens (never the bars).
    const barW = Math.max(1, Math.round(barWidth))
    const wantPitch = barW + Math.max(1, Math.round(barGap))
    const pitch = bars
        ? Math.max(barW + 1, Math.min(wantPitch, Math.floor((size.w - 48) / bars)))
        : wantPitch
    const rowW = bars * pitch
    const rowLeft = Math.round((size.w - rowW) / 2)
    const barInset = Math.floor((pitch - barW) / 2)

    const propsRef = React.useRef({ speed, mode, isStatic, drag, wheel, pinned, locked, dwell })
    propsRef.current = { speed, mode, isStatic, drag, wheel, pinned, locked, dwell }

    // ---- imperative frame update ---------------------------------------
    const apply = () => {
        const L = layoutRef.current
        const P = propsRef.current
        if (!L.m) return
        const pos = st.pos
        for (let i = 0; i < L.m; i++) {
            const d = L.loop ? wrap(i - pos, L.m) : i - pos
            const a = Math.abs(d)

            // Every video on screen plays, active or not; only off-screen ones rest.
            const v = videoEls.current[i]
            if (v) {
                const want =
                    P.mode === "video" &&
                    a < VISIBLE &&
                    !P.isStatic &&
                    inView.current
                if (want !== playing.current[i]) {
                    playing.current[i] = want
                    if (want) {
                        const key = v.getAttribute("src") || ""
                        v.play().catch((err: any) => {
                            // a pause() right after play() is not a failure
                            if (err && err.name === "AbortError") return
                            // blocked autoplay / unplayable media: show a still instead
                            setFailedVideos((f) => (f[key] ? f : { ...f, [key]: true }))
                        })
                    } else v.pause()
                }
            }

            const el = itemEls.current[i]
            if (el) setStyles(el, toStyle(itemVisual(d, L)))
            const cap = capEls.current[i]
            if (cap) setStyles(cap, toStyle(captionVisual(d)))
        }
        for (let k = 0; k < L.bars; k++) {
            const bar = dialBars.current[k]
            if (!bar) continue
            const bv = barAt(k, pos, L)
            bar.style.height = `${bv.h.toFixed(2)}px`
            bar.style.bottom = `${bv.bottom.toFixed(2)}px`
            const f = dialFills.current[k]
            if (f) f.style.opacity = bv.f.toFixed(3)
        }
        const idx = mod(Math.round(pos), L.n)
        if (idx !== st.lastActive) {
            st.lastActive = idx
            // announce the new item without re-rendering the carousel
            if (liveRef.current) liveRef.current.textContent = labelsRef.current[idx] || ""
        }
    }

    const loop = (now: number) => {
        // off screen: stop the frame loop until the carousel is visible again
        if (!inView.current) {
            st.raf = 0
            return
        }
        const P = propsRef.current
        // scroll-driven mode: read the scroll position at the start of each frame
        if (P.pinned && st.readScroll) st.readScroll()
        const dt = Math.min(0.05, (now - st.last) / 1000)
        st.last = now
        if (st.dragging) {
            const prev = st.pos
            st.pos += (st.target - st.pos) * (1 - Math.exp(-dt * 28))
            st.vel = dt > 0 ? (st.pos - prev) / dt : 0
        } else {
            const reduce =
                typeof window !== "undefined" &&
                window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
            const w = Math.sqrt(120 * P.speed * (reduce ? 4 : 1))
            const c = 2 * 0.95 * w
            let rem = dt
            while (rem > 0) {
                const h = Math.min(rem, 1 / 240)
                st.vel += (-w * w * (st.pos - st.target) - c * st.vel) * h
                st.pos += st.vel * h
                rem -= h
            }
        }
        apply()
        const settled =
            !st.dragging &&
            Math.abs(st.pos - st.target) < 0.0004 &&
            Math.abs(st.vel) < 0.002
        if (settled) {
            const L = layoutRef.current
            const shift = L.m ? Math.floor(st.target / L.m) * L.m : 0
            st.pos = st.target - shift
            st.target -= shift
            st.vel = 0
            apply()
            st.raf = 0
            return
        }
        st.raf = requestAnimationFrame(loop)
    }

    const kick = () => {
        if (st.raf || !inView.current) return
        st.last = performance.now()
        st.raf = requestAnimationFrame(loop)
    }

    // ---- effects --------------------------------------------------------
    React.useEffect(() => {
        const el = midRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            const r = entries[0].contentRect
            setSize((s) =>
                Math.abs(s.w - r.width) < 0.5 && Math.abs(s.h - r.height) < 0.5
                    ? s
                    : { w: r.width, h: r.height }
            )
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    React.useEffect(() => {
        setMode(modeProp)
    }, [modeProp])

    // Jump to the starting slot when it (or the item count) changes in the editor.
    useIsoLayoutEffect(() => {
        st.pos = st.target = start
        st.vel = 0
    }, [start, n])

    // Re-sync DOM after any layout / mode change, before paint.
    useIsoLayoutEffect(() => {
        apply()
    })

    React.useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const onWheel = (e: WheelEvent) => {
            const P = propsRef.current
            const wheelMode = P.locked ? "any" : P.wheel
            if (wheelMode === "off" || P.pinned || !layoutRef.current.m) return
            const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY)
            if (wheelMode === "horizontal" && !horizontal) return
            const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1
            const delta = (horizontal ? e.deltaX : e.deltaY) * unit
            e.preventDefault()
            if (!st.wheelTimer) st.wheelOrigin = st.target
            st.target = clamp(st.target + delta / 260, st.pos - 3, st.pos + 3)
            clearTimeout(st.wheelTimer)
            st.wheelTimer = setTimeout(() => {
                st.wheelTimer = 0
                const g = st.target - st.wheelOrigin
                // settle on the nearest item, leaning the way the gesture was going
                st.target = Math.round(
                    st.target + Math.sign(g) * 0.3 + clamp(st.vel, -6, 6) * 0.08
                )
                kick()
            }, 140)
            kick()
        }
        el.addEventListener("wheel", onWheel, { passive: false })
        return () => {
            el.removeEventListener("wheel", onWheel)
            clearTimeout(st.wheelTimer)
            st.wheelTimer = 0
        }
    }, [])

    // Pinned mode: the page scroll inside the tall track drives the carousel.
    useIsoLayoutEffect(() => {
        if (!pinned) return
        const track = trackRef.current
        const stage = rootRef.current
        if (!track || !stage) return
        const read = (jump: boolean) => {
            const range = track.offsetHeight - stage.offsetHeight
            const progress =
                range > 0 ? -track.getBoundingClientRect().top / range : 0
            const t = progressToPos(
                progress,
                layoutRef.current.n - 1,
                propsRef.current.dwell
            )
            st.target = t
            if (jump) {
                st.pos = t
                st.vel = 0
                apply()
            } else kick()
        }
        read(true)
        st.readScroll = () => read(false)
        const onScroll = () => read(false)
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onScroll)
        return () => {
            st.readScroll = null
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onScroll)
        }
    }, [pinned, n, dwell])

    React.useEffect(
        () => () => {
            if (st.raf) cancelAnimationFrame(st.raf)
            st.raf = 0
        },
        []
    )

    // Pause the frame loop and all videos while the carousel is off screen or
    // the tab is hidden; resume both when it comes back into view.
    const hasItems = n > 0
    React.useEffect(() => {
        const el = rootRef.current
        if (!el || isStatic) return
        let intersecting = true
        const update = () => {
            const next =
                intersecting &&
                (typeof document === "undefined" || !document.hidden)
            if (next === inView.current) return
            inView.current = next
            if (next) {
                kick()
            } else if (st.raf) {
                cancelAnimationFrame(st.raf)
                st.raf = 0
            }
            apply()
        }
        let io: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver(
                (entries) => {
                    intersecting = entries[entries.length - 1].isIntersecting
                    update()
                },
                { rootMargin: "100px 0px" }
            )
            io.observe(el)
        }
        document.addEventListener("visibilitychange", update)
        update()
        return () => {
            io?.disconnect()
            document.removeEventListener("visibilitychange", update)
        }
    }, [hasItems, isStatic])

    // ---- interaction ----------------------------------------------------
    const scrollToIndex = (idx: number) => {
        const track = trackRef.current
        const stage = rootRef.current
        if (!track || !stage) return
        const range = track.offsetHeight - stage.offsetHeight
        const top = window.scrollY + track.getBoundingClientRect().top
        const steps = Math.max(1, n - 1)
        const i = clamp(idx, 0, steps)
        window.scrollTo({
            top: top + (i / steps) * range,
            behavior: "smooth",
        })
    }

    const goToDelta = (delta: number) => {
        if (!delta) return
        const base = Math.round(st.target)
        if (pinned) return scrollToIndex(base + delta)
        st.target = base + delta
        kick()
    }

    const goToSlot = (i: number) => {
        const base = Math.round(st.target)
        goToDelta(
            layoutRef.current.loop
                ? Math.round(wrap(i - base, layoutRef.current.m))
                : i - base
        )
    }

    const onPointerDown = (e: React.PointerEvent) => {
        if (Object.keys(failedVideos).length) setFailedVideos({})
        const P = propsRef.current
        if ((!P.drag && !P.locked) || P.pinned) return
        if (e.pointerType === "mouse" && e.button !== 0) return
        st.pid = e.pointerId
        st.downX = e.clientX
        st.downY = e.clientY
        st.pending = true
        st.moved = false
        st.samples = []
    }

    const onPointerMove = (e: React.PointerEvent) => {
        if (!st.pending || e.pointerId !== st.pid) return
        if (!st.moved) {
            const travel = propsRef.current.locked
                ? Math.hypot(e.clientX - st.downX, e.clientY - st.downY)
                : Math.abs(e.clientX - st.downX)
            if (travel < 6) return
            st.moved = true
            st.dragging = true
            st.originX = e.clientX
            st.originY = e.clientY
            st.originTarget = st.target
            try {
                midRef.current?.setPointerCapture(e.pointerId)
            } catch {}
            kick()
        }
        // Locked mode follows swipes in any direction: left/up = next.
        const along =
            e.clientX -
            st.originX +
            (propsRef.current.locked ? e.clientY - st.originY : 0)
        st.target = st.originTarget - along / layoutRef.current.S
        const t = performance.now()
        st.samples.push({ t, v: st.target })
        while (st.samples.length > 2 && t - st.samples[0].t > 120)
            st.samples.shift()
    }

    const endDrag = (e: React.PointerEvent) => {
        if (!st.pending || e.pointerId !== st.pid) return
        st.pending = false
        if (!st.moved) return
        st.dragging = false
        try {
            midRef.current?.releasePointerCapture(e.pointerId)
        } catch {}
        let v = 0
        if (st.samples.length > 1) {
            const a = st.samples[0]
            const b = st.samples[st.samples.length - 1]
            const dt = (b.t - a.t) / 1000
            if (dt > 0.01) v = (b.v - a.v) / dt
        }
        const origin = Math.round(st.originTarget)
        st.target = clamp(
            Math.round(st.target + clamp(v, -12, 12) * 0.18),
            origin - 3,
            origin + 3
        )
        kick()
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (!keyboard || !m) return
        if (pinned) {
            const cur = Math.round(st.target)
            if (e.key === "ArrowRight" || e.key === "ArrowDown")
                scrollToIndex(cur + 1)
            else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
                scrollToIndex(cur - 1)
            else return
            e.preventDefault()
            return
        }
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            st.target = Math.round(st.target) + 1
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            st.target = Math.round(st.target) - 1
        } else return
        e.preventDefault()
        kick()
    }

    const pickMode = (next: Mode) => setMode(next)

    // Radio-group keys: arrows move and select, Home/End jump. Space and Enter
    // select the focused option through the native button click.
    const onToggleKeyDown = (e: React.KeyboardEvent) => {
        const ids: Mode[] = ["image", "video"]
        const cur = Math.max(0, ids.indexOf(mode))
        let next = -1
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (cur + 1) % ids.length
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
            next = (cur - 1 + ids.length) % ids.length
        else if (e.key === "Home") next = 0
        else if (e.key === "End") next = ids.length - 1
        else return
        e.preventDefault()
        e.stopPropagation() // don't also move the carousel
        pickMode(ids[next])
        toggleRefs.current[next]?.focus()
    }

    // ---- render ---------------------------------------------------------
    const baseText: React.CSSProperties = {
        fontSize: 13,
        lineHeight: `${CAPTION_H}px`,
    }
    const fontStyle: React.CSSProperties = { ...baseText, ...font } // toggle
    const leftStyle: React.CSSProperties = {
        ...baseText,
        ...leftFont,
        color: leftColor,
        fontVariantNumeric: "tabular-nums",
    }
    const rightStyle: React.CSSProperties = {
        ...baseText,
        ...rightFont,
        color: rightColor,
    }
    const showTog = showToggle && anyVideo

    if (!n) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    color: "#111111",
                    opacity: 0.6,
                    ...fontStyle,
                }}
            >
                Add items to the carousel
            </div>
        )
    }

    const trackVh = stageHeight + (n - 1) * scrollPerItem

    const body = (
        <div
            ref={rootRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Focus reel"
            tabIndex={keyboard ? 0 : -1}
            onKeyDown={onKeyDown}
            className={pinned || locked ? `fcs-${Math.round(stageHeight)}` : undefined}
            style={{
                position: pinned ? "sticky" : "relative",
                top: pinned ? 0 : undefined,
                width: "100%",
                // In the editor a pinned carousel shows as a normal fixed stage.
                height: pinned || locked ? undefined : pin ? 760 : "100%",
                touchAction: locked ? "none" : undefined,
                overscrollBehavior: locked ? "contain" : undefined,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                outline: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
                color: "#111111",
            }}
        >
            <style>
                {`@keyframes fcFade{from{opacity:0}to{opacity:1}}.fcb:focus-visible,.fct:focus-visible{outline:2px solid #09f;outline-offset:2px}.fcs-${Math.round(stageHeight)}{height:${stageHeight}vh}@supports (height:1svh){.fcs-${Math.round(stageHeight)}{height:${stageHeight}svh}}`}
            </style>
            {showTog && (
                <div
                    role="radiogroup"
                    aria-label="Media type"
                    onKeyDown={onToggleKeyDown}
                    style={{
                        flex: "none",
                        position: "relative",
                        zIndex: 300,
                        marginTop: 24,
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        padding: 3,
                        borderRadius: 999,
                        background: toggleTrack,
                        ...fontStyle,
                        lineHeight: 1,
                    }}
                >
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            top: 3,
                            bottom: 3,
                            left: 3,
                            width: "calc(50% - 3px)",
                            borderRadius: 999,
                            background: togglePill,
                            transform: `translateX(${mode === "image" ? 0 : 100}%)`,
                            transition:
                                "transform 450ms cubic-bezier(0.22, 1, 0.36, 1)",
                        }}
                    />
                    {(["image", "video"] as Mode[]).map((id, idx) => (
                        <button
                            key={id}
                            ref={(el) => {
                                toggleRefs.current[idx] = el
                            }}
                            className="fct"
                            type="button"
                            role="radio"
                            aria-checked={mode === id}
                            tabIndex={mode === id ? 0 : -1}
                            onClick={() => pickMode(id)}
                            style={{
                                position: "relative",
                                height: 29,
                                padding: "0 18px",
                                border: 0,
                                background: "none",
                                cursor: "pointer",
                                font: "inherit",
                                color: mode === id ? toggleActiveText : toggleText,
                                transition: "color 300ms ease",
                            }}
                        >
                            {id === "image" ? "Image" : "Video"}
                        </button>
                    ))}
                </div>
            )}

            <div
                ref={midRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                style={{
                    flex: 1,
                    minHeight: 0,
                    width: "100%",
                    position: "relative",
                    overflow: "hidden",
                    touchAction: locked ? "none" : "pan-y",
                    cursor: (drag || locked) && !pinned ? "grab" : "default",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: layout.cw,
                        height: layout.ch + capBlock,
                        transform: "translate(-50%, -50%)",
                    }}
                >
                    {Array.from({ length: m }, (_, i) => {
                        const item = list[i % n]
                        const vsrc = videoSrc(item)
                        const useVideo = mode === "video" && !!vsrc && !failedVideos[vsrc]
                        // If a video can't play, fall back to a still of that video (its
                        // thumbnail), else the item's image.
                        const img = useVideo
                            ? null
                            : resolveImage(
                                  mode === "video" && vsrc ? item.videoPoster || item.image : item.image,
                                  needPx
                              )
                        // a frame of the video itself (not the item's image)
                        const poster = useVideo
                            ? resolveImage(item.videoPoster, needPx)?.src
                            : undefined
                        const d = dOf(i)
                        const alt = captionOf(item, i % n).right
                        return (
                            <div
                                key={i}
                                ref={(el) => {
                                    itemEls.current[i] = el
                                }}
                                role="group"
                                aria-hidden={i >= n || undefined}
                                aria-label={`${(i % n) + 1} of ${n}`}
                                onClick={() => {
                                    if (!st.moved) goToSlot(i)
                                }}
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    width: layout.cw,
                                    height: layout.ch,
                                    overflow: "hidden",
                                    background: "#E6E6E6",
                                    willChange: "transform, opacity",
                                    backfaceVisibility: "hidden",
                                    ...itemVisual(d, layout),
                                }}
                            >
                                {useVideo ? (
                                    <video
                                        key={`v-${vsrc}`}
                                        ref={(el) => {
                                            videoEls.current[i] = el
                                            // fresh element: let apply() start/stop it
                                            if (el) playing.current[i] = undefined
                                        }}
                                        src={isStatic ? `${vsrc}#t=0.1` : vsrc}
                                        poster={poster}
                                        onError={() =>
                                            setFailedVideos((f) => (f[vsrc] ? f : { ...f, [vsrc]: true }))
                                        }
                                        muted
                                        loop
                                        playsInline
                                        preload="auto"
                                        style={{
                                            ...fill,
                                            animation: "fcFade 450ms ease both",
                                        }}
                                    />
                                ) : img ? (
                                    <img
                                        key={`i-${img.src}`}
                                        src={img.src}
                                        srcSet={img.srcSet}
                                        sizes={
                                            img.srcSet
                                                ? `${Math.ceil(layout.cw)}px`
                                                : undefined
                                        }
                                        alt={alt}
                                        draggable={false}
                                        loading="eager"
                                        decoding="async"
                                        style={fill}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            ...fill,
                                            background: `linear-gradient(160deg, hsl(${(i % n) * 37} 18% 80%), hsl(${(i % n) * 37} 22% 54%))`,
                                        }}
                                    />
                                )}
                            </div>
                        )
                    })}

                    {Array.from({ length: m }, (_, i) => {
                        const item = list[i % n]
                        const d = dOf(i)
                        return (
                            <div
                                key={i}
                                ref={(el) => {
                                    capEls.current[i] = el
                                }}
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: layout.ch + CAPTION_GAP,
                                    width: layout.cw,
                                    height: CAPTION_H,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 16,
                                    whiteSpace: "nowrap",
                                    pointerEvents: "none",
                                    willChange: "transform, opacity",
                                    zIndex: 400,
                                    ...captionVisual(d),
                                }}
                            >
                                <span style={leftStyle}>
                                    {captionOf(item, i % n).left}
                                </span>
                                <span style={rightStyle}>
                                    {captionOf(item, i % n).right}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {bars > 0 && showIndicator && (
                <div
                    role="group"
                    aria-label="Choose an item"
                    style={{
                        flex: "none",
                        position: "relative",
                        alignSelf: "flex-start",
                        marginLeft: rowLeft,
                        width: rowW,
                        height: layout.maxH,
                        marginBottom: indicatorBottom,
                        zIndex: 300,
                        contain: "layout style",
                    }}
                >
                    {Array.from({ length: bars }, (_, k) => {
                        const bv = barAt(k, st.pos, layout)
                        // One tab stop per item; the in-between lines are mouse-only.
                        const major = k % bpi === 0
                        const itemIdx = Math.round(k / bpi) % n
                        const itemName = labelsRef.current[itemIdx] || ""
                        return (
                            <button
                                key={k}
                                type="button"
                                className="fcb"
                                aria-label={
                                    major
                                        ? `Go to ${String(itemIdx + 1).padStart(2, "0")}${itemName ? ", " + itemName : ""}`
                                        : undefined
                                }
                                aria-hidden={major ? undefined : true}
                                tabIndex={major ? 0 : -1}
                                onClick={() =>
                                    goToDelta(
                                        layout.loop
                                            ? Math.round(
                                                  wrap(
                                                      k / bpi -
                                                          mod(Math.round(st.target), n),
                                                      n
                                                  )
                                              )
                                            : Math.round(k / bpi - Math.round(st.target))
                                    )
                                }
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: k * pitch,
                                    width: pitch,
                                    height: "100%",
                                    padding: 0,
                                    border: 0,
                                    background: "transparent",
                                    font: "inherit",
                                    cursor: "pointer",
                                }}
                            >
                                <div
                                    ref={(el) => {
                                        dialBars.current[k] = el
                                    }}
                                    style={{
                                        position: "absolute",
                                        left: barInset,
                                        bottom: bv.bottom,
                                        width: barW,
                                        height: bv.h,
                                        borderRadius: barW / 2,
                                        background: inactiveColor,
                                    }}
                                >
                                    <div
                                        ref={(el) => {
                                            dialFills.current[k] = el
                                        }}
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            borderRadius: "inherit",
                                            background: activeColor,
                                            opacity: bv.f,
                                        }}
                                    />
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}

            <div
                ref={liveRef}
                aria-live="polite"
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                    clip: "rect(0 0 0 0)",
                    whiteSpace: "nowrap",
                }}
            >
                {labelsRef.current[mod(Math.round(st.pos), n)] || ""}
            </div>
        </div>
    )

    return pinned ? (
        <div
            ref={trackRef}
            style={{ position: "relative", width: "100%", height: `${trackVh}vh` }}
        >
            {body}
        </div>
    ) : (
        body
    )
}

// Only touch the style properties that actually changed since the last frame.
function setStyles(el: HTMLElement, v: Record<string, string>) {
    const cache: Record<string, string> =
        (el as any).__fc || ((el as any).__fc = {})
    for (const key in v) {
        if (cache[key] !== v[key]) {
            cache[key] = v[key]
            ;(el.style as any)[key] = v[key]
        }
    }
}

// Object.assign onto el.style needs plain strings/numbers with units.
function toStyle(v: Record<string, any>) {
    const out: Record<string, string> = {}
    for (const key in v) {
        const val = v[key]
        if (key === "opacity") out[key] = String(val)
        else if (key === "zIndex") out[key] = String(val)
        else if (key === "borderRadius") out[key] = `${val}px`
        else out[key] = val
    }
    return out
}

const DEFAULT_IMAGES = [
    "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
    "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
    "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
    "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
    "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
]

const placeholder = (i: number): Item => ({
    image: {
        src: DEFAULT_IMAGES[i % DEFAULT_IMAGES.length],
        alt: `Untitled ${String(i + 1).padStart(2, "0")}`,
    },
    right: `Untitled ${String(i + 1).padStart(2, "0")}`,
})

addPropertyControls(FocusReel, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://…/clip.mp4",
                },
                videoPoster: {
                    type: ControlType.ResponsiveImage,
                    title: "Video thumbnail",
                    description:
                        "A frame from the video. Gives you a visual preview here and shows while the video loads.",
                },
                left: {
                    type: ControlType.String,
                    title: "Left",
                    placeholder: "01, 02… (auto)",
                    description: "Left end of the caption. Empty = the item number.",
                },
                right: {
                    type: ControlType.String,
                    title: "Right",
                    placeholder: "Name",
                },
                videoRight: {
                    type: ControlType.String,
                    title: "Right (Video)",
                    description: "Optional. Shown instead of Right in Video mode.",
                },
            },
        },
        defaultValue: Array.from({ length: 10 }, (_, i) => placeholder(i)),
    },
    mode: {
        type: ControlType.Enum,
        displaySegmentedControl: true,
        title: "Media",
        options: ["image", "video"],
        optionTitles: ["Image", "Video"],
        defaultValue: "image",
    },
    showToggle: {
        type: ControlType.Boolean,
        title: "Toggle",
        defaultValue: true,
        description: "Shown once at least one item has a video.",
    },
    initialIndex: {
        type: ControlType.Number,
        title: "Start at",
        min: 0,
        max: 50,
        step: 1,
        displayStepper: true,
        defaultValue: 0,
    },
    centerWidth: {
        type: ControlType.Number,
        title: "Centre width",
        min: 120,
        max: 900,
        step: 1,
        defaultValue: 400,
    },
    aspect: {
        type: ControlType.Number,
        title: "Aspect (W/H)",
        min: 0.4,
        max: 2,
        step: 0.01,
        defaultValue: 0.75,
    },
    sideScale: {
        type: ControlType.Number,
        title: "Side scale",
        min: 0.2,
        max: 1,
        step: 0.01,
        defaultValue: 0.52,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 22,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 64,
        step: 1,
        defaultValue: 4,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.4,
        max: 2.5,
        step: 0.05,
        defaultValue: 1,
    },
    pin: {
        type: ControlType.Boolean,
        title: "Pin on scroll",
        defaultValue: true,
        description:
            "Locks the carousel into the viewport and drives it by scrolling. Set the layer's height to Auto.",
    },
    behavior: {
        type: ControlType.Enum,
        title: "Behavior",
        options: ["loop", "play"],
        optionTitles: ["Loop (locked)", "Play left to right"],
        defaultValue: "loop",
        description:
            "Loop: the page stays locked and scroll / swipe cycles the images forever. Play left to right: scrolling plays first to last once, then the page carries on.",
        hidden: (p) => !p.pin,
    },
    stageHeight: {
        type: ControlType.Number,
        title: "Stage height",
        min: 40,
        max: 100,
        step: 1,
        unit: "vh",
        defaultValue: 100,
        hidden: (p) => !p.pin,
    },
    scrollPerItem: {
        type: ControlType.Number,
        title: "Scroll / item",
        min: 20,
        max: 200,
        step: 5,
        unit: "vh",
        defaultValue: 70,
        hidden: (p) => !p.pin || p.behavior !== "play",
    },
    dwell: {
        type: ControlType.Number,
        title: "Rest on item",
        min: 0,
        max: 45,
        step: 1,
        unit: "%",
        defaultValue: 25,
        hidden: (p) => !p.pin || p.behavior !== "play",
    },
    drag: {
        type: ControlType.Boolean,
        title: "Drag",
        defaultValue: true,
        hidden: (p) => !!p.pin,
    },
    wheel: {
        type: ControlType.Enum,
        title: "Wheel",
        options: ["off", "horizontal", "any"],
        optionTitles: ["Off", "Horizontal", "Any (hijacks page scroll)"],
        defaultValue: "horizontal",
        hidden: (p) => !!p.pin,
    },
    keyboard: {
        type: ControlType.Boolean,
        title: "Keyboard",
        defaultValue: true,
    },
    leftFont: {
        type: ControlType.Font,
        title: "Left font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.5em",
        },
    },
    leftColor: {
        type: ControlType.Color,
        title: "Left color",
        defaultValue: "#111111",
    },
    rightFont: {
        type: ControlType.Font,
        title: "Right font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.5em",
        },
    },
    rightColor: {
        type: ControlType.Color,
        title: "Right color",
        defaultValue: "#111111",
    },
    font: {
        type: ControlType.Font,
        title: "Toggle font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.5em",
        },
        hidden: (p) => !p.showToggle,
    },
    toggleTrack: {
        type: ControlType.Color,
        title: "Toggle bg",
        defaultValue: "#EFEFEF",
        hidden: (p) => !p.showToggle,
    },
    togglePill: {
        type: ControlType.Color,
        title: "Toggle pill",
        defaultValue: "#111111",
        hidden: (p) => !p.showToggle,
    },
    toggleText: {
        type: ControlType.Color,
        title: "Toggle text",
        defaultValue: "#8A8A8A",
        hidden: (p) => !p.showToggle,
    },
    toggleActiveText: {
        type: ControlType.Color,
        title: "Toggle active",
        defaultValue: "#FFFFFF",
        hidden: (p) => !p.showToggle,
    },
    showIndicator: {
        type: ControlType.Boolean,
        title: "Indicator",
        defaultValue: true,
    },
    barsPerItem: {
        type: ControlType.Number,
        title: "Bars / item",
        min: 1,
        max: 8,
        step: 1,
        displayStepper: true,
        defaultValue: 4,
        hidden: (p) => !p.showIndicator,
    },
    barWidth: {
        type: ControlType.Number,
        title: "Bar width",
        min: 1,
        max: 12,
        step: 0.5,
        defaultValue: 2,
        hidden: (p) => !p.showIndicator,
    },
    barGap: {
        type: ControlType.Number,
        title: "Bar gap",
        min: 1,
        max: 30,
        step: 1,
        defaultValue: 5,
        hidden: (p) => !p.showIndicator,
    },
    barMinHeight: {
        type: ControlType.Number,
        title: "Min height",
        min: 2,
        max: 60,
        step: 1,
        defaultValue: 12,
        hidden: (p) => !p.showIndicator,
    },
    barMaxHeight: {
        type: ControlType.Number,
        title: "Max height",
        min: 8,
        max: 120,
        step: 1,
        defaultValue: 28,
        hidden: (p) => !p.showIndicator,
    },
    align: {
        type: ControlType.Enum,
        displaySegmentedControl: true,
        title: "Align",
        options: ["bottom", "center"],
        optionTitles: ["Bottom", "Center"],
        defaultValue: "bottom",
        hidden: (p) => !p.showIndicator,
    },
    activeColor: {
        type: ControlType.Color,
        title: "Active",
        defaultValue: "#111111",
        hidden: (p) => !p.showIndicator,
    },
    inactiveColor: {
        type: ControlType.Color,
        title: "Inactive",
        defaultValue: "#C9C9C9",
        hidden: (p) => !p.showIndicator,
    },
    indicatorBottom: {
        type: ControlType.Number,
        title: "Bottom",
        min: 0,
        max: 120,
        step: 1,
        defaultValue: 24,
        hidden: (p) => !p.showIndicator,
    },
})
