import {
    useEffect,
    useId,
    useMemo,
    useReducer,
    useRef,
    useState,
    type CSSProperties,
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

import { motion, AnimatePresence } from "framer-motion"

const SAMPLE_CLIP =
    "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4"

const TONES = [
    ["#e9dfd2", "#c9b49a", "#8a6f55"],
    ["#d8e2dc", "#a9c1b4", "#5f7f73"],
    ["#dfe3ee", "#aab4d0", "#5c6790"],
    ["#f0dcd6", "#dba99c", "#a0604f"],
    ["#e6e1ec", "#bcaed2", "#74619a"],
]

// Self-contained placeholder artwork so the component looks finished
// before any media is assigned.
function placeholderArt(n: number): string {
    const [a, b, c] = TONES[n % TONES.length]
    const tilt = (n * 37) % 60
    const svg =
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'>` +
        `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
        `<stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/>` +
        `</linearGradient></defs>` +
        `<rect width='600' height='600' fill='url(#g)'/>` +
        `<ellipse cx='300' cy='470' rx='170' ry='22' fill='${c}' opacity='0.25'/>` +
        `<g transform='rotate(${tilt - 30} 300 300)'>` +
        `<rect x='205' y='150' width='190' height='300' rx='${40 + n * 12}' fill='${c}'/>` +
        `<rect x='225' y='172' width='60' height='256' rx='30' fill='#ffffff' opacity='0.18'/>` +
        `</g></svg>`
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const STARTER_ITEMS = [
    { kind: "image", label: "Front view" },
    { kind: "video", videoUrl: SAMPLE_CLIP, label: "In motion" },
    { kind: "image", label: "Side profile" },
    { kind: "image", label: "Detail" },
    { kind: "image", label: "In use" },
]

const RAIL_BASE = {
    side: "left",
    size: 76,
    spacing: 10,
    radius: 12,
    align: "start",
    ringColor: "#111111",
    ringWidth: 2,
    restOpacity: 0.62,
}

const STAGE_BASE = {
    fit: "contain",
    radius: 20,
    fill: "#F1EFEC",
    motion: "slide",
    speed: 0.5,
    zoom: true,
    zoomAmount: 2,
    swipe: true,
}

const ARROW_BASE = {
    show: true,
    side: "right",
    size: 40,
    radius: 20,
    fill: "#FFFFFF",
    icon: "#111111",
    hoverFill: "#111111",
    hoverIcon: "#FFFFFF",
    outline: "rgba(0,0,0,0.08)",
}

const BADGE_BASE = {
    show: true,
    fill: "rgba(17,17,17,0.72)",
    color: "#FFFFFF",
    showLabel: true,
}

const PLAY_BASE = {
    autoAdvance: false,
    hold: 4,
    pauseOnHover: true,
    loopVideo: true,
    startMuted: true,
    videoButtons: true,
    accent: "#FFFFFF",
}

/* ------------------------------------------------------------------ */
/* Data helpers (no markup)                                            */
/* ------------------------------------------------------------------ */

function pickSrc(upload: any, url: any): string {
    if (typeof url === "string" && url.trim()) return url.trim()
    if (upload && typeof upload === "object" && upload.src) return upload.src
    if (typeof upload === "string" && upload) return upload
    return ""
}

function pickSrcSet(upload: any, url: any): string | undefined {
    if (typeof url === "string" && url.trim()) return undefined
    return upload && typeof upload === "object" ? upload.srcSet : undefined
}

function tidyItems(raw: any): any[] {
    const list = Array.isArray(raw) && raw.length ? raw : STARTER_ITEMS
    return list.map((entry: any, n: number) => {
        const e = entry || {}
        const clip = pickSrc(e.videoFile, e.videoUrl)
        const isClip = e.kind === "video" && !!clip
        const picture = pickSrc(e.image, e.imageUrl)
        const cover = pickSrc(e.poster, e.posterUrl)
        const still =
            (isClip || e.kind === "video" ? cover || picture : picture) ||
            placeholderArt(n)
        return {
            id: `m${n}`,
            isClip,
            clip,
            still,
            stillSet:
                e.kind === "video"
                    ? pickSrcSet(e.poster, e.posterUrl)
                    : pickSrcSet(e.image, e.imageUrl),
            label: typeof e.label === "string" ? e.label : "",
        }
    })
}

function twoDigits(n: number): string {
    return n < 10 ? `0${n}` : `${n}`
}

function fontOf(f: any, fallbackSize: number): CSSProperties {
    return {
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: fallbackSize,
        fontWeight: 500,
        lineHeight: 1,
        letterSpacing: "0.02em",
        ...(f || {}),
    }
}

/* ------------------------------------------------------------------ */
/* Live-only hooks                                                     */
/* ------------------------------------------------------------------ */

// Starts false ("locked out"); flips true only once the observer confirms the
// node is on screen and the tab is visible.
function useOnScreen(node: { current: HTMLElement | null }): boolean {
    const [seen, setSeen] = useState(false)
    const [tabOpen, setTabOpen] = useState(
        typeof document === "undefined" ? true : !document.hidden
    )

    useEffect(() => {
        const el = node.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            setSeen(true)
            return
        }
        const watcher = new IntersectionObserver(
            (hits) => setSeen(hits[hits.length - 1].isIntersecting),
            { threshold: 0.05 }
        )
        watcher.observe(el)
        return () => watcher.disconnect()
    }, [node])

    useEffect(() => {
        const sync = () => setTabOpen(!document.hidden)
        document.addEventListener("visibilitychange", sync)
        return () => document.removeEventListener("visibilitychange", sync)
    }, [])

    return seen && tabOpen
}

function useCalmMotion(): boolean {
    const [calm, setCalm] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const q = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setCalm(q.matches)
        sync()
        if (q.addEventListener) {
            q.addEventListener("change", sync)
            return () => q.removeEventListener("change", sync)
        }
        q.addListener(sync)
        return () => q.removeListener(sync)
    }, [])
    return calm
}

function useBoxWidth(node: { current: HTMLElement | null }): number {
    const [w, setW] = useState(0)
    useEffect(() => {
        const el = node.current
        if (!el) return
        setW(el.clientWidth)
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((rows) => {
            const next = Math.round(rows[0].contentRect.width)
            setW((prev) => (prev === next ? prev : next))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [node])
    return w
}

/* ------------------------------------------------------------------ */
/* Stage transitions                                                   */
/* ------------------------------------------------------------------ */

const STAGE_MOVES: Record<string, any> = {
    fade: {
        from: () => ({ opacity: 0 }),
        rest: { opacity: 1 },
        to: () => ({ opacity: 0 }),
    },
    slide: {
        from: (way: number) => ({ x: way >= 0 ? "100%" : "-100%", opacity: 1 }),
        rest: { x: "0%", opacity: 1 },
        to: (way: number) => ({ x: way >= 0 ? "-100%" : "100%", opacity: 1 }),
    },
    lift: {
        from: (way: number) => ({ y: way >= 0 ? "100%" : "-100%", opacity: 1 }),
        rest: { y: "0%", opacity: 1 },
        to: (way: number) => ({ y: way >= 0 ? "-100%" : "100%", opacity: 1 }),
    },
    zoom: {
        from: () => ({ opacity: 0, scale: 1.08 }),
        rest: { opacity: 1, scale: 1 },
        to: () => ({ opacity: 0, scale: 0.94 }),
    },
}

function cursorReducer(state: { at: number; way: number }, next: any) {
    if (next.at === state.at) return state
    return { at: next.at, way: next.way }
}

/* ------------------------------------------------------------------ */
/* Live pieces                                                         */
/* ------------------------------------------------------------------ */

function ZoomStill({ src, srcSet, alt, fit, zoom, amount }: any) {
    const pic = useRef<HTMLImageElement | null>(null)

    const follow = (e: any) => {
        if (!zoom || e.pointerType !== "mouse" || !pic.current) return
        const box = e.currentTarget.getBoundingClientRect()
        if (!box.width || !box.height) return
        const px = ((e.clientX - box.left) / box.width) * 100
        const py = ((e.clientY - box.top) / box.height) * 100
        pic.current.style.transformOrigin = `${px}% ${py}%`
        pic.current.style.transform = `scale(${amount})`
    }
    const release = () => {
        if (pic.current) pic.current.style.transform = "scale(1)"
    }

    return (
        <div
            onPointerMove={follow}
            onPointerLeave={release}
            onPointerDown={release}
            style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                cursor: zoom ? "zoom-in" : "default",
            }}
        >
            <img
                ref={pic}
                src={src}
                srcSet={srcSet}
                alt={alt}
                draggable={false}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: fit,
                    display: "block",
                    userSelect: "none",
                    transition:
                        "transform 0.28s cubic-bezier(0.2, 0.7, 0.2, 1)",
                }}
            />
        </div>
    )
}

function ClipPlayer({
    src,
    poster,
    fit,
    allowed,
    loop,
    startMuted,
    buttons,
    accent,
    label,
    onFinish,
}: any) {
    const tape = useRef<HTMLVideoElement | null>(null)
    const meter = useRef<HTMLDivElement | null>(null)
    const [wantPlay, setWantPlay] = useState(true)
    const [rolling, setRolling] = useState(false)
    const [silent, setSilent] = useState(startMuted)

    // Playback only while the gallery is on screen and the viewer has not
    // paused it; parked otherwise.
    useEffect(() => {
        const v = tape.current
        if (!v) return
        if (allowed && wantPlay) {
            const attempt = v.play()
            if (attempt && attempt.catch) attempt.catch(() => {})
        } else {
            v.pause()
        }
    }, [allowed, wantPlay, src])

    useEffect(() => {
        const v = tape.current
        return () => {
            if (v) v.pause()
        }
    }, [])

    const onTick = () => {
        const v = tape.current
        if (!v || !meter.current || !v.duration) return
        meter.current.style.transform = `scaleX(${v.currentTime / v.duration})`
    }

    const chip: CSSProperties = {
        width: 34,
        height: 34,
        borderRadius: 17,
        border: "none",
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(17,17,17,0.55)",
        color: accent,
        cursor: "pointer",
    }

    return (
        <div style={{ position: "absolute", inset: 0 }}>
            <video
                ref={tape}
                src={src}
                poster={poster || undefined}
                muted={silent}
                loop={loop}
                playsInline
                preload="metadata"
                aria-label={label || "Product video"}
                onPlay={() => setRolling(true)}
                onPause={() => setRolling(false)}
                onTimeUpdate={onTick}
                onEnded={() => {
                    if (!loop && onFinish) onFinish()
                }}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: fit,
                    display: "block",
                }}
            />
            {buttons && (
                <div
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                        position: "absolute",
                        top: 14,
                        right: 14,
                        display: "flex",
                        gap: 8,
                    }}
                >
                    <button
                        type="button"
                        aria-label={rolling ? "Pause video" : "Play video"}
                        onClick={() => setWantPlay(!rolling)}
                        style={chip}
                    >
                        {rolling ? (
                            <svg width="14" height="14" viewBox="0 0 14 14">
                                <rect
                                    x="2.5"
                                    y="2"
                                    width="3"
                                    height="10"
                                    rx="1"
                                    fill="currentColor"
                                />
                                <rect
                                    x="8.5"
                                    y="2"
                                    width="3"
                                    height="10"
                                    rx="1"
                                    fill="currentColor"
                                />
                            </svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 14 14">
                                <path
                                    d="M4 2.2v9.6a.6.6 0 0 0 .92.5l7.3-4.8a.6.6 0 0 0 0-1L4.92 1.7A.6.6 0 0 0 4 2.2z"
                                    fill="currentColor"
                                />
                            </svg>
                        )}
                    </button>
                    <button
                        type="button"
                        aria-label={silent ? "Unmute video" : "Mute video"}
                        onClick={() => setSilent((s: boolean) => !s)}
                        style={chip}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                        >
                            <path
                                d="M2 6.2h2.4L8 3.2v9.6l-3.6-3H2z"
                                fill="currentColor"
                            />
                            {silent ? (
                                <path
                                    d="M10.6 6.2l3.4 3.6m0-3.6l-3.4 3.6"
                                    stroke="currentColor"
                                    strokeWidth="1.4"
                                    strokeLinecap="round"
                                />
                            ) : (
                                <path
                                    d="M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 4a5.7 5.7 0 0 1 0 8"
                                    stroke="currentColor"
                                    strokeWidth="1.4"
                                    strokeLinecap="round"
                                />
                            )}
                        </svg>
                    </button>
                </div>
            )}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 3,
                    background: "rgba(17,17,17,0.18)",
                    pointerEvents: "none",
                }}
            >
                <div
                    ref={meter}
                    style={{
                        width: "100%",
                        height: "100%",
                        background: accent,
                        transformOrigin: "0 50%",
                        transform: "scaleX(0)",
                    }}
                />
            </div>
        </div>
    )
}

function StepButton({ way, look, onGo }: any) {
    const [over, setOver] = useState(false)
    return (
        <motion.button
            type="button"
            aria-label={way < 0 ? "Previous media" : "Next media"}
            onClick={onGo}
            onPointerDown={(e) => e.stopPropagation()}
            onHoverStart={() => setOver(true)}
            onHoverEnd={() => setOver(false)}
            whileTap={{ scale: 0.92 }}
            animate={{
                backgroundColor: over ? look.hoverFill : look.fill,
                color: over ? look.hoverIcon : look.icon,
            }}
            transition={{ duration: 0.2 }}
            style={{
                width: look.size,
                height: look.size,
                flex: "none",
                borderRadius: look.radius,
                border: `1px solid ${look.outline}`,
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
            }}
        >
            <svg
                width={look.size * 0.42}
                height={look.size * 0.42}
                viewBox="0 0 24 24"
                fill="none"
                style={{ transform: way < 0 ? "none" : "scaleX(-1)" }}
            >
                <path
                    d="M19 12H5.5M11 6l-6 6 6 6"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </motion.button>
    )
}

/* ------------------------------------------------------------------ */
/* Live view                                                           */
/* ------------------------------------------------------------------ */

function LiveGallery(props: any) {
    const rail = { ...RAIL_BASE, ...(props.rail || {}) }
    const stage = { ...STAGE_BASE, ...(props.stage || {}) }
    const arrows = { ...ARROW_BASE, ...(props.arrows || {}) }
    const badge = { ...BADGE_BASE, ...(props.badge || {}) }
    const play = { ...PLAY_BASE, ...(props.playback || {}) }
    const gap = props.gap ?? 14
    const inset = props.padding ?? 14

    const items = useMemo(() => tidyItems(props.items), [props.items])
    const total = items.length

    const [cursor, send] = useReducer(cursorReducer, { at: 0, way: 1 })
    const at = Math.min(cursor.at, total - 1)
    const shown = items[at]

    const shell = useRef<HTMLDivElement | null>(null)
    const strip = useRef<HTMLDivElement | null>(null)
    const press = useRef<{ x: number; y: number } | null>(null)
    const [hovering, setHovering] = useState(false)

    const onScreen = useOnScreen(shell)
    const calm = useCalmMotion()
    const width = useBoxWidth(shell)
    const scope = useId().replace(/[^a-zA-Z0-9]/g, "")

    const stacked = rail.side === "bottom" || (width > 0 && width < 460)
    const thumb = stacked ? Math.min(rail.size, 64) : rail.size

    // Latest values for handlers that outlive a render.
    const live = useRef({ at, total })
    live.current = { at, total }

    const jump = (to: number) => {
        const now = live.current
        if (to === now.at || to < 0 || to >= now.total) return
        send({ at: to, way: to > now.at ? 1 : -1 })
    }
    const step = (way: number) => {
        const now = live.current
        if (now.total < 2) return
        send({ at: (now.at + way + now.total) % now.total, way })
    }

    // Keep the chosen thumbnail inside the rail without scrolling the page.
    useEffect(() => {
        const box = strip.current
        if (!box) return
        const cell = box.children[at] as HTMLElement | undefined
        if (!cell) return
        const lead = stacked ? cell.offsetLeft : cell.offsetTop
        const span = stacked ? cell.offsetWidth : cell.offsetHeight
        const view = stacked ? box.clientWidth : box.clientHeight
        const target = lead - (view - span) / 2
        box.scrollTo({
            [stacked ? "left" : "top"]: Math.max(0, target),
            behavior: calm ? "auto" : "smooth",
        } as any)
    }, [at, stacked, calm])

    // Optional auto-advance: a single timeout per slide, only while on
    // screen. Videos hand over when they finish instead.
    const clipLoops = play.loopVideo && !play.autoAdvance
    useEffect(() => {
        if (!play.autoAdvance || !onScreen || calm || total < 2) return
        if (play.pauseOnHover && hovering) return
        if (shown.isClip) return
        const wait = setTimeout(() => step(1), Math.max(1, play.hold) * 1000)
        return () => clearTimeout(wait)
    }, [
        play.autoAdvance,
        play.hold,
        play.pauseOnHover,
        onScreen,
        calm,
        hovering,
        at,
        total,
        shown.isClip,
    ])

    const onKey = (e: any) => {
        const back = stacked ? "ArrowLeft" : "ArrowUp"
        const fwd = stacked ? "ArrowRight" : "ArrowDown"
        if (e.key === "ArrowLeft" || e.key === back) {
            e.preventDefault()
            step(-1)
        } else if (e.key === "ArrowRight" || e.key === fwd) {
            e.preventDefault()
            step(1)
        } else if (e.key === "Home") {
            e.preventDefault()
            jump(0)
        } else if (e.key === "End") {
            e.preventDefault()
            jump(total - 1)
        }
    }

    const swipeStart = (e: any) => {
        if (!stage.swipe) return
        press.current = { x: e.clientX, y: e.clientY }
    }
    const swipeEnd = (e: any) => {
        const from = press.current
        press.current = null
        if (!from) return
        const dx = e.clientX - from.x
        const dy = e.clientY - from.y
        if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) {
            step(dx < 0 ? 1 : -1)
        }
    }

    const moves = STAGE_MOVES[calm ? "fade" : stage.motion] || STAGE_MOVES.slide
    const tempo = calm ? 0.15 : stage.speed
    const arrowsOnLeft = arrows.side === "left"

    return (
        <div
            ref={shell}
            role="region"
            aria-roledescription="carousel"
            aria-label="Product media"
            tabIndex={0}
            onKeyDown={onKey}
            onPointerEnter={() => setHovering(true)}
            onPointerLeave={() => setHovering(false)}
            style={{
                ...props.style,
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: stacked
                    ? "column-reverse"
                    : rail.side === "right"
                      ? "row-reverse"
                      : "row",
                gap,
                padding: inset,
                background: props.background,
                borderRadius: props.radius,
                overflow: "hidden",
                outline: "none",
                minWidth: 0,
                minHeight: 0,
            }}
        >
            <style>{`.${scope}-strip{scrollbar-width:none;-ms-overflow-style:none}.${scope}-strip::-webkit-scrollbar{display:none}`}</style>

            {/* Thumbnail rail */}
            <motion.div
                ref={strip}
                layoutScroll
                className={`${scope}-strip`}
                style={{
                    flex: "none",
                    display: "flex",
                    flexDirection: stacked ? "row" : "column",
                    gap: rail.spacing,
                    padding: 4,
                    margin: -4,
                    boxSizing: "content-box",
                    width: stacked ? "auto" : thumb,
                    height: stacked ? thumb : "auto",
                    overflowX: stacked ? "auto" : "hidden",
                    overflowY: stacked ? "hidden" : "auto",
                    justifyContent: "flex-start",
                    position: "relative",
                }}
            >
                {items.map((item, n) => {
                    const chosen = n === at
                    const pushStart =
                        n === 0 && rail.align !== "start" ? "auto" : undefined
                    const pushEnd =
                        n === total - 1 && rail.align === "center"
                            ? "auto"
                            : undefined
                    return (
                        <motion.button
                            key={item.id}
                            type="button"
                            aria-label={`Show ${item.label || `media ${n + 1}`}`}
                            aria-current={chosen ? "true" : undefined}
                            onClick={() => jump(n)}
                            whileHover={{ opacity: 1 }}
                            whileTap={{ scale: 0.95 }}
                            animate={{ opacity: chosen ? 1 : rail.restOpacity }}
                            transition={{ duration: 0.2 }}
                            style={{
                                position: "relative",
                                flex: "none",
                                width: thumb,
                                height: thumb,
                                padding: 0,
                                border: "none",
                                background: "transparent",
                                borderRadius: rail.radius,
                                cursor: "pointer",
                                marginTop: stacked ? undefined : pushStart,
                                marginBottom: stacked ? undefined : pushEnd,
                                marginLeft: stacked ? pushStart : undefined,
                                marginRight: stacked ? pushEnd : undefined,
                            }}
                        >
                            <span
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: rail.radius,
                                    overflow: "hidden",
                                    background: stage.fill,
                                    display: "block",
                                }}
                            >
                                <img
                                    src={item.still}
                                    alt=""
                                    draggable={false}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                                {item.isClip && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            left: "50%",
                                            top: "50%",
                                            width: 26,
                                            height: 26,
                                            margin: -13,
                                            borderRadius: 13,
                                            background: "rgba(17,17,17,0.6)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <svg
                                            width="10"
                                            height="10"
                                            viewBox="0 0 10 10"
                                        >
                                            <path
                                                d="M2.6 1.2v7.6l6-3.8z"
                                                fill="#fff"
                                            />
                                        </svg>
                                    </span>
                                )}
                            </span>
                            {chosen && rail.ringWidth > 0 && (
                                <motion.span
                                    layoutId={`${scope}-ring`}
                                    transition={
                                        calm
                                            ? { duration: 0 }
                                            : {
                                                  type: "spring",
                                                  stiffness: 420,
                                                  damping: 34,
                                              }
                                    }
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        borderRadius: rail.radius,
                                        boxShadow: `inset 0 0 0 ${rail.ringWidth}px ${rail.ringColor}`,
                                        pointerEvents: "none",
                                    }}
                                />
                            )}
                        </motion.button>
                    )
                })}
            </motion.div>

            {/* Stage */}
            <div
                onPointerDown={swipeStart}
                onPointerUp={swipeEnd}
                onPointerCancel={() => (press.current = null)}
                style={{
                    position: "relative",
                    flex: 1,
                    minWidth: 0,
                    minHeight: 0,
                    borderRadius: stage.radius,
                    background: stage.fill,
                    overflow: "hidden",
                    touchAction: "pan-y",
                }}
            >
                <AnimatePresence initial={false} custom={cursor.way}>
                    <motion.div
                        key={shown.id}
                        custom={cursor.way}
                        variants={{
                            from: moves.from,
                            rest: moves.rest,
                            to: moves.to,
                        }}
                        initial="from"
                        animate="rest"
                        exit="to"
                        transition={{
                            duration: tempo,
                            ease: [0.32, 0.72, 0, 1],
                        }}
                        style={{ position: "absolute", inset: 0 }}
                    >
                        {shown.isClip ? (
                            <ClipPlayer
                                src={shown.clip}
                                poster={shown.still}
                                fit={stage.fit}
                                allowed={onScreen}
                                loop={clipLoops}
                                startMuted={play.startMuted}
                                buttons={play.videoButtons}
                                accent={play.accent}
                                label={shown.label}
                                onFinish={() => {
                                    if (play.autoAdvance) step(1)
                                }}
                            />
                        ) : (
                            <ZoomStill
                                src={shown.still}
                                srcSet={shown.stillSet}
                                alt={shown.label || `Product media ${at + 1}`}
                                fit={stage.fit}
                                zoom={stage.zoom}
                                amount={stage.zoomAmount}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>

                {badge.show && (
                    <div
                        aria-live="polite"
                        style={{
                            position: "absolute",
                            bottom: 16,
                            left: arrowsOnLeft ? "auto" : 16,
                            right: arrowsOnLeft ? 16 : "auto",
                            maxWidth: "55%",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "9px 12px",
                            borderRadius: 999,
                            background: badge.fill,
                            color: badge.color,
                            pointerEvents: "none",
                            whiteSpace: "nowrap",
                            ...fontOf(badge.font, 12),
                        }}
                    >
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>
                            {twoDigits(at + 1)} / {twoDigits(total)}
                        </span>
                        {badge.showLabel && shown.label && (
                            <span
                                style={{
                                    opacity: 0.75,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {shown.label}
                            </span>
                        )}
                    </div>
                )}

                {arrows.show && total > 1 && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: 16,
                            left: arrowsOnLeft ? 16 : "auto",
                            right: arrowsOnLeft ? "auto" : 16,
                            display: "flex",
                            gap: 8,
                        }}
                    >
                        <StepButton
                            way={-1}
                            look={arrows}
                            onGo={() => step(-1)}
                        />
                        <StepButton
                            way={1}
                            look={arrows}
                            onGo={() => step(1)}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Static view (canvas + export): plain elements only                  */
/* ------------------------------------------------------------------ */

function StillFrame(props: any) {
    const rail = { ...RAIL_BASE, ...(props.rail || {}) }
    const stage = { ...STAGE_BASE, ...(props.stage || {}) }
    const arrows = { ...ARROW_BASE, ...(props.arrows || {}) }
    const badge = { ...BADGE_BASE, ...(props.badge || {}) }
    const gap = props.gap ?? 14
    const inset = props.padding ?? 14
    const items = tidyItems(props.items)
    const first = items[0]
    const flat = rail.side === "bottom"
    const cell = flat ? Math.min(rail.size, 64) : rail.size
    const arrowsLeft = arrows.side === "left"

    const knob: CSSProperties = {
        width: arrows.size,
        height: arrows.size,
        flex: "none",
        boxSizing: "border-box",
        borderRadius: arrows.radius,
        border: `1px solid ${arrows.outline}`,
        background: arrows.fill,
        color: arrows.icon,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    }

    return (
        <div
            style={{
                ...props.style,
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: flat
                    ? "column-reverse"
                    : rail.side === "right"
                      ? "row-reverse"
                      : "row",
                gap,
                padding: inset,
                background: props.background,
                borderRadius: props.radius,
                overflow: "hidden",
                minWidth: 0,
                minHeight: 0,
            }}
        >
            <div
                style={{
                    flex: "none",
                    display: "flex",
                    flexDirection: flat ? "row" : "column",
                    justifyContent:
                        rail.align === "center"
                            ? "center"
                            : rail.align === "end"
                              ? "flex-end"
                              : "flex-start",
                    gap: rail.spacing,
                    width: flat ? "auto" : cell,
                    height: flat ? cell : "auto",
                    overflow: "hidden",
                }}
            >
                {items.map((item, n) => (
                    <div
                        key={item.id}
                        style={{
                            position: "relative",
                            flex: "none",
                            width: cell,
                            height: cell,
                            borderRadius: rail.radius,
                            overflow: "hidden",
                            background: stage.fill,
                            opacity: n === 0 ? 1 : rail.restOpacity,
                        }}
                    >
                        <img
                            src={item.still}
                            alt=""
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                        {item.isClip && (
                            <div
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: "50%",
                                    width: 26,
                                    height: 26,
                                    margin: -13,
                                    borderRadius: 13,
                                    background: "rgba(17,17,17,0.6)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <svg width="10" height="10" viewBox="0 0 10 10">
                                    <path d="M2.6 1.2v7.6l6-3.8z" fill="#fff" />
                                </svg>
                            </div>
                        )}
                        {n === 0 && rail.ringWidth > 0 && (
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: rail.radius,
                                    boxShadow: `inset 0 0 0 ${rail.ringWidth}px ${rail.ringColor}`,
                                }}
                            />
                        )}
                    </div>
                ))}
            </div>

            <div
                style={{
                    position: "relative",
                    flex: 1,
                    minWidth: 0,
                    minHeight: 0,
                    borderRadius: stage.radius,
                    background: stage.fill,
                    overflow: "hidden",
                }}
            >
                <img
                    src={first.still}
                    srcSet={first.stillSet}
                    alt={first.label || "Product media 1"}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: stage.fit,
                        display: "block",
                    }}
                />
                {badge.show && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: 16,
                            left: arrowsLeft ? "auto" : 16,
                            right: arrowsLeft ? 16 : "auto",
                            maxWidth: "55%",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "9px 12px",
                            borderRadius: 999,
                            background: badge.fill,
                            color: badge.color,
                            whiteSpace: "nowrap",
                            ...fontOf(badge.font, 12),
                        }}
                    >
                        <span>01 / {twoDigits(items.length)}</span>
                        {badge.showLabel && first.label && (
                            <span style={{ opacity: 0.75 }}>{first.label}</span>
                        )}
                    </div>
                )}
                {arrows.show && items.length > 1 && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: 16,
                            left: arrowsLeft ? 16 : "auto",
                            right: arrowsLeft ? "auto" : 16,
                            display: "flex",
                            gap: 8,
                        }}
                    >
                        <div style={knob}>
                            <svg
                                width={arrows.size * 0.42}
                                height={arrows.size * 0.42}
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <path
                                    d="M19 12H5.5M11 6l-6 6 6 6"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                        <div style={knob}>
                            <svg
                                width={arrows.size * 0.42}
                                height={arrows.size * 0.42}
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <path
                                    d="M5 12h13.5M13 6l6 6-6 6"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Entry                                                               */
/* ------------------------------------------------------------------ */

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Etagere(props) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StillFrame {...props} />
    return <LiveGallery {...props} />
}

addPropertyControls(Etagere, {
    items: {
        type: ControlType.Array,
        title: "Media",
        maxCount: 24,
        defaultValue: STARTER_ITEMS,
        control: {
            type: ControlType.Object,
            controls: {
                kind: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (item) => item.kind === "video",
                },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…",
                    hidden: (item) => item.kind === "video",
                },
                videoFile: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (item) => item.kind !== "video",
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://…",
                    hidden: (item) => item.kind !== "video",
                },
                poster: {
                    type: ControlType.ResponsiveImage,
                    title: "Poster",
                    hidden: (item) => item.kind !== "video",
                },
                posterUrl: {
                    type: ControlType.String,
                    title: "Poster URL",
                    placeholder: "https://…",
                    hidden: (item) => item.kind !== "video",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    placeholder: "Short description",
                },
            },
        },
    },
    rail: {
        type: ControlType.Object,
        title: "Thumbnails",
        controls: {
            side: {
                type: ControlType.Enum,
                title: "Position",
                options: ["left", "right", "bottom"],
                optionTitles: ["Left", "Right", "Bottom"],
                defaultValue: RAIL_BASE.side,
                displaySegmentedControl: true,
            },
            align: {
                type: ControlType.Enum,
                title: "Align",
                options: ["start", "center", "end"],
                optionTitles: ["Start", "Center", "End"],
                defaultValue: RAIL_BASE.align,
                displaySegmentedControl: true,
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: RAIL_BASE.size,
                min: 36,
                max: 140,
                step: 1,
                unit: "px",
            },
            spacing: {
                type: ControlType.Number,
                title: "Spacing",
                defaultValue: RAIL_BASE.spacing,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: RAIL_BASE.radius,
                min: 0,
                max: 70,
                step: 1,
                unit: "px",
            },
            ringColor: {
                type: ControlType.Color,
                title: "Ring",
                defaultValue: RAIL_BASE.ringColor,
            },
            ringWidth: {
                type: ControlType.Number,
                title: "Ring Width",
                defaultValue: RAIL_BASE.ringWidth,
                min: 0,
                max: 6,
                step: 0.5,
                unit: "px",
            },
            restOpacity: {
                type: ControlType.Number,
                title: "Idle Opacity",
                defaultValue: RAIL_BASE.restOpacity,
                min: 0.2,
                max: 1,
                step: 0.02,
            },
        },
    },
    stage: {
        type: ControlType.Object,
        title: "Stage",
        controls: {
            fit: {
                type: ControlType.Enum,
                title: "Fit",
                options: ["contain", "cover"],
                optionTitles: ["Fit", "Fill"],
                defaultValue: STAGE_BASE.fit,
                displaySegmentedControl: true,
            },
            fill: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: STAGE_BASE.fill,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: STAGE_BASE.radius,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
            },
            motion: {
                type: ControlType.Enum,
                title: "Transition",
                options: ["slide", "lift", "fade", "zoom"],
                optionTitles: ["Slide", "Lift", "Fade", "Zoom"],
                defaultValue: STAGE_BASE.motion,
            },
            speed: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: STAGE_BASE.speed,
                min: 0.1,
                max: 1.5,
                step: 0.05,
                unit: "s",
            },
            zoom: {
                type: ControlType.Boolean,
                title: "Hover Zoom",
                defaultValue: STAGE_BASE.zoom,
            },
            zoomAmount: {
                type: ControlType.Number,
                title: "Zoom",
                defaultValue: STAGE_BASE.zoomAmount,
                min: 1.2,
                max: 4,
                step: 0.1,
                unit: "×",
                hidden: (s) => !s.zoom,
            },
            swipe: {
                type: ControlType.Boolean,
                title: "Swipe",
                defaultValue: STAGE_BASE.swipe,
            },
        },
    },
    arrows: {
        type: ControlType.Object,
        title: "Arrows",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Visible",
                defaultValue: ARROW_BASE.show,
            },
            side: {
                type: ControlType.Enum,
                title: "Corner",
                options: ["left", "right"],
                optionTitles: ["Left", "Right"],
                defaultValue: ARROW_BASE.side,
                displaySegmentedControl: true,
                hidden: (a) => !a.show,
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: ARROW_BASE.size,
                min: 24,
                max: 72,
                step: 1,
                unit: "px",
                hidden: (a) => !a.show,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: ARROW_BASE.radius,
                min: 0,
                max: 36,
                step: 1,
                unit: "px",
                hidden: (a) => !a.show,
            },
            fill: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: ARROW_BASE.fill,
                hidden: (a) => !a.show,
            },
            icon: {
                type: ControlType.Color,
                title: "Icon",
                defaultValue: ARROW_BASE.icon,
                hidden: (a) => !a.show,
            },
            hoverFill: {
                type: ControlType.Color,
                title: "Hover Fill",
                defaultValue: ARROW_BASE.hoverFill,
                hidden: (a) => !a.show,
            },
            hoverIcon: {
                type: ControlType.Color,
                title: "Hover Icon",
                defaultValue: ARROW_BASE.hoverIcon,
                hidden: (a) => !a.show,
            },
            outline: {
                type: ControlType.Color,
                title: "Outline",
                defaultValue: ARROW_BASE.outline,
                hidden: (a) => !a.show,
            },
        },
    },
    badge: {
        type: ControlType.Object,
        title: "Counter",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Visible",
                defaultValue: BADGE_BASE.show,
            },
            showLabel: {
                type: ControlType.Boolean,
                title: "Label",
                defaultValue: BADGE_BASE.showLabel,
                hidden: (b) => !b.show,
            },
            fill: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: BADGE_BASE.fill,
                hidden: (b) => !b.show,
            },
            color: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: BADGE_BASE.color,
                hidden: (b) => !b.show,
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 12,
                    variant: "Medium",
                    lineHeight: "1em",
                    letterSpacing: "0.02em",
                },
                hidden: (b) => !b.show,
            },
        },
    },
    playback: {
        type: ControlType.Object,
        title: "Playback",
        controls: {
            autoAdvance: {
                type: ControlType.Boolean,
                title: "Auto Advance",
                defaultValue: PLAY_BASE.autoAdvance,
            },
            hold: {
                type: ControlType.Number,
                title: "Hold",
                defaultValue: PLAY_BASE.hold,
                min: 1,
                max: 20,
                step: 0.5,
                unit: "s",
                hidden: (p) => !p.autoAdvance,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Hover Pause",
                defaultValue: PLAY_BASE.pauseOnHover,
                hidden: (p) => !p.autoAdvance,
            },
            loopVideo: {
                type: ControlType.Boolean,
                title: "Loop Video",
                defaultValue: PLAY_BASE.loopVideo,
                hidden: (p) => p.autoAdvance,
            },
            startMuted: {
                type: ControlType.Boolean,
                title: "Start Muted",
                defaultValue: PLAY_BASE.startMuted,
            },
            videoButtons: {
                type: ControlType.Boolean,
                title: "Video Buttons",
                defaultValue: PLAY_BASE.videoButtons,
            },
            accent: {
                type: ControlType.Color,
                title: "Video Accent",
                defaultValue: PLAY_BASE.accent,
            },
        },
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 14,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 14,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 28,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
})
