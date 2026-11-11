/*
 * Marketplace compliance notes
 * 1. Static renderer: the exported entry calls useIsStaticRenderer() first and
 *    returns <StillPlate /> on the canvas / export. That branch is plain divs
 *    only: no motion, no transitions, no keyframes, no listeners, no observers,
 *    no timers, no video playback (videos show their poster image).
 * 2. Offscreen work: the live branch starts locked out. A frame loop only runs
 *    while the component is intersecting the viewport AND the tab is visible,
 *    and the permit is re-checked on every frame. The loop also puts itself to
 *    sleep once the dock has settled, so it idles at zero frames even when on
 *    screen. Autoplay timers and hero video playback follow the same permit.
 *    prefers-reduced-motion disables magnify, crossfade and autoplay.
 * 3. Cross-browser: dock motion is transform-only (no per-frame layout), tiles
 *    are drawn at full size and scaled down so they stay sharp in Safari, no
 *    flex `gap` or `inset` shorthand, rounded clipping is forced for video in
 *    Safari, iOS inline muted autoplay attributes are set on the element, and
 *    the dock fits itself to narrow screens and supports touch scrubbing.
 */
import * as React from "react"
import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
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


type Picture =
    | { src?: string; srcSet?: string; alt?: string }
    | string
    | undefined

interface Slide {
    image?: Picture
    imageUrl?: string
    video?: string
    videoUrl?: string
    label?: string
    title?: string
    link?: string
}

interface LunetteProps {
    slides: Slide[]
    startAt: number
    surface: string
    inset: number
    stackGap: number
    hero: {
        radius: number
        shade: number
        fit: "cover" | "contain"
        fadeMs: number
        openInNewTab: boolean
    }
    caption: {
        labelFont: any
        titleFont: any
        ink: string
        labelInk: string
        edge: number
        entry: "instant" | "fade" | "rise"
    }
    dock: {
        restSize: number
        peakSize: number
        reach: number
        spacing: number
        tileRadius: number
        trayFill: string
        trayLine: string
        trayRadius: number
        trayPad: number
        lifted: boolean
        markerInk: string
        markerSize: number
        snappiness: number
    }
    cycle: {
        enabled: boolean
        everySec: number
        holdOnHover: boolean
    }
    style?: React.CSSProperties
}

/* ---------- pure data helpers (no markup) ---------- */

function pictureSrc(s: Slide | undefined): string {
    if (!s) return ""
    const typed = (s.imageUrl || "").trim()
    if (typed) return typed
    if (typeof s.image === "string") return s.image
    return s.image?.src || ""
}

function pictureSet(s: Slide | undefined): string | undefined {
    if (!s || (s.imageUrl || "").trim()) return undefined
    if (s.image && typeof s.image === "object") return s.image.srcSet
    return undefined
}

function pictureAlt(s: Slide | undefined): string {
    if (!s) return ""
    if (s.image && typeof s.image === "object" && s.image.alt)
        return s.image.alt
    return s.title || ""
}

function clipSrc(s: Slide | undefined): string {
    if (!s) return ""
    return (s.videoUrl || "").trim() || s.video || ""
}

function wrapIndex(i: number, n: number) {
    if (n <= 0) return 0
    return ((i % n) + n) % n
}

function bell(distance: number, reach: number) {
    if (reach <= 0) return 0
    const u = Math.abs(distance) / reach
    if (u >= 1) return 0
    return (Math.cos(Math.PI * u) + 1) / 2
}

function num(v: unknown, fallback: number) {
    const x = typeof v === "number" ? v : parseFloat(String(v))
    return Number.isFinite(x) ? x : fallback
}

// Explicit edges instead of the `inset` shorthand (older Safari ignores it)
const pinAll: React.CSSProperties = {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
}

const flatPanel = "linear-gradient(135deg, #d9dcd6 0%, #b9bfb5 100%)"

/* ======================================================================
 * Entry
 * ==================================================================== */

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Lunette(incoming: Partial<LunetteProps>) {
    const still = useIsStaticRenderer()
    const props = fillIn(incoming)
    if (still) return <StillPlate {...props} />
    return <LivePlate {...props} />
}

/* ======================================================================
 * Static branch — plain divs only
 * ==================================================================== */

function StillPlate(props: LunetteProps) {
    const {
        slides = [],
        startAt = 1,
        surface,
        inset,
        stackGap,
        hero,
        caption,
        dock,
        style,
    } = props
    const n = slides.length
    const at = wrapIndex((startAt || 1) - 1, n)
    const s = slides[at]
    const src = pictureSrc(s)
    const rest = Math.max(8, num(dock.restSize, 40))
    const peak = Math.max(rest, num(dock.peakSize, 84))
    const pad = Math.max(0, num(dock.trayPad, 10))
    const trayHeight = peak + pad * 2

    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                background: surface,
                padding: inset,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                WebkitFontSmoothing: "antialiased",
            }}
        >
            <div
                style={{
                    position: "relative",
                    flex: "1 1 0%",
                    minHeight: 0,
                    borderRadius: hero.radius,
                    overflow: "hidden",
                    background: src ? "#111" : flatPanel,
                }}
            >
                {src ? (
                    <img
                        src={src}
                        srcSet={pictureSet(s)}
                        sizes="100vw"
                        alt={pictureAlt(s)}
                        style={{
                            ...pinAll,
                            width: "100%",
                            height: "100%",
                            objectFit: hero.fit,
                            display: "block",
                        }}
                    />
                ) : null}
                <div
                    style={{
                        ...pinAll,
                        background: `linear-gradient(to top, rgba(0,0,0,${hero.shade}) 0%, rgba(0,0,0,0) 55%)`,
                    }}
                />
                {s ? (
                    <div
                        style={{
                            position: "absolute",
                            left: caption.edge,
                            right: caption.edge,
                            bottom: caption.edge,
                        }}
                    >
                        {s.label ? (
                            <div
                                style={{
                                    ...caption.labelFont,
                                    color: caption.labelInk,
                                    textTransform: "uppercase",
                                    marginBottom: 6,
                                }}
                            >
                                {s.label}
                            </div>
                        ) : null}
                        <div
                            style={{
                                ...caption.titleFont,
                                color: caption.ink,
                                margin: 0,
                            }}
                        >
                            {s.title}
                        </div>
                    </div>
                ) : null}
            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    flexShrink: 0,
                    height: trayHeight,
                    marginTop: stackGap,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-end",
                        padding: pad,
                        height: trayHeight,
                        maxWidth: "100%",
                        boxSizing: "border-box",
                        background: dock.trayFill,
                        border: `1px solid ${dock.trayLine}`,
                        borderRadius: dock.trayRadius,
                        boxShadow: dock.lifted
                            ? "0 10px 30px rgba(0,0,0,0.06)"
                            : "none",
                    }}
                >
                    {slides.map((item, i) => {
                        const tSrc = pictureSrc(item)
                        return (
                            <div
                                key={i}
                                style={{
                                    position: "relative",
                                    flex: `0 1 ${rest}px`,
                                    width: rest,
                                    minWidth: 0,
                                    marginLeft: i === 0 ? 0 : dock.spacing,
                                }}
                            >
                                <div
                                    style={{
                                        position: "relative",
                                        width: "100%",
                                        paddingBottom: "100%",
                                        borderRadius: dock.tileRadius,
                                        overflow: "hidden",
                                        background: tSrc ? "#ddd" : flatPanel,
                                    }}
                                >
                                    {tSrc ? (
                                        <img
                                            src={tSrc}
                                            alt=""
                                            style={{
                                                ...pinAll,
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block",
                                            }}
                                        />
                                    ) : null}
                                </div>
                                {i === at ? (
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: "50%",
                                            bottom:
                                                -(pad / 2) -
                                                dock.markerSize / 2,
                                            width: dock.markerSize,
                                            height: dock.markerSize,
                                            marginLeft: -dock.markerSize / 2,
                                            borderRadius: "50%",
                                            background: dock.markerInk,
                                        }}
                                    />
                                ) : null}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

/* ======================================================================
 * Live branch
 * ==================================================================== */

const useBeforePaint =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

function useRunPermit(target: React.RefObject<HTMLElement>) {
    const permit = useRef(false)
    const calm = useRef(false)
    const [running, setRunning] = useState(false)
    const [calmState, setCalmState] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined") return
        const node = target.current
        let inView = false
        let tabShown = typeof document === "undefined" ? true : !document.hidden
        const mq =
            typeof window.matchMedia === "function"
                ? window.matchMedia("(prefers-reduced-motion: reduce)")
                : null

        const settle = () => {
            const next = inView && tabShown
            if (next !== permit.current) {
                permit.current = next
                setRunning(next)
            }
        }

        let watcher: IntersectionObserver | null = null
        if (typeof IntersectionObserver === "undefined" || !node) {
            inView = true
        } else {
            watcher = new IntersectionObserver(
                (entries) => {
                    const last = entries[entries.length - 1]
                    inView = !!last && last.isIntersecting
                    settle()
                },
                { threshold: 0 }
            )
            watcher.observe(node)
        }

        const onTab = () => {
            tabShown = !document.hidden
            settle()
        }
        const onCalm = () => {
            calm.current = !!(mq && mq.matches)
            setCalmState(calm.current)
        }
        onCalm()
        document.addEventListener("visibilitychange", onTab)
        if (mq) {
            if (typeof mq.addEventListener === "function")
                mq.addEventListener("change", onCalm)
            else if (typeof (mq as any).addListener === "function")
                (mq as any).addListener(onCalm)
        }
        settle()

        return () => {
            if (watcher) watcher.disconnect()
            document.removeEventListener("visibilitychange", onTab)
            if (mq) {
                if (typeof mq.removeEventListener === "function")
                    mq.removeEventListener("change", onCalm)
                else if (typeof (mq as any).removeListener === "function")
                    (mq as any).removeListener(onCalm)
            }
            permit.current = false
        }
    }, [])

    return { permit, calm, running, calmState }
}

// iOS Safari only autoplays inline when these are real attributes/properties
function armClip(el: HTMLVideoElement | null) {
    if (!el) return
    el.muted = true
    el.defaultMuted = true
    el.setAttribute("muted", "")
    el.setAttribute("playsinline", "")
    el.setAttribute("webkit-playsinline", "")
}

interface Metrics {
    rest: number
    peak: number
    box: number
    gap: number
    reach: number
    pad: number
}

function measureDock(d: LunetteProps["dock"], fit: number): Metrics {
    const restRaw = Math.max(8, num(d.restSize, 40))
    const box = Math.max(restRaw, num(d.peakSize, 84))
    return {
        rest: restRaw * fit,
        peak: box * fit,
        box,
        gap: Math.max(0, num(d.spacing, 8)) * fit,
        reach: Math.max(1, num(d.reach, 150)) * fit,
        pad: Math.max(0, num(d.trayPad, 10)),
    }
}

// centre offsets of each tile relative to the dock's centre line
function lineUp(sizes: number[], gap: number) {
    const count = sizes.length
    let total = 0
    for (let i = 0; i < count; i++) total += sizes[i]
    total += gap * Math.max(0, count - 1)
    const mids = new Array<number>(count)
    let run = -total / 2
    for (let i = 0; i < count; i++) {
        mids[i] = run + sizes[i] / 2
        run += sizes[i] + gap
    }
    return { mids, total }
}

function tileTransform(mid: number, size: number, box: number) {
    return `translate3d(${(mid - box / 2).toFixed(2)}px, 0px, 0px) scale(${(size / box).toFixed(4)})`
}

function LivePlate(props: LunetteProps) {
    const {
        slides = [],
        startAt = 1,
        surface,
        inset,
        stackGap,
        hero,
        caption,
        dock,
        cycle,
        style,
    } = props
    const n = slides.length

    const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const fadeName = `lnt-fade-${uid}`
    const liftName = `lnt-lift-${uid}`
    const showName = `lnt-show-${uid}`

    const shellRef = useRef<HTMLDivElement>(null)
    const dockRef = useRef<HTMLDivElement>(null)
    const trayRef = useRef<HTMLDivElement>(null)
    const markRef = useRef<HTMLSpanElement>(null)
    const tileRefs = useRef<(HTMLButtonElement | null)[]>([])
    const clipRef = useRef<HTMLVideoElement | null>(null)

    const { permit, calm, running, calmState } = useRunPermit(shellRef)

    const [focus, setFocus] = useState(() => wrapIndex((startAt || 1) - 1, n))
    const [trail, setTrail] = useState<number | null>(null)
    const [stamp, setStamp] = useState(0)
    const [hovering, setHovering] = useState(false)
    const [fit, setFit] = useState(1)

    // live mirrors for the frame loop and handlers
    const live = useRef(props)
    live.current = props
    const fitNow = useRef(fit)
    fitNow.current = fit
    const focusNow = useRef(focus)
    focusNow.current = focus

    // dock physics state (effective px, already multiplied by fit)
    const sizes = useRef<number[]>([])
    const speeds = useRef<number[]>([])
    const pointer = useRef<number | null>(null) // offset from dock centre line
    const span = useRef(0) // current tray content width
    const room = useRef(0) // measured dock width
    const frame = useRef(0)
    const lastT = useRef(0)

    const restNow = measureDock(dock, fit).rest
    if (sizes.current.length !== n) {
        sizes.current = Array.from(
            { length: n },
            (_, i) => sizes.current[i] ?? restNow
        )
        speeds.current = Array.from(
            { length: n },
            (_, i) => speeds.current[i] ?? 0
        )
    }

    useEffect(() => {
        if (focus > n - 1) setFocus(Math.max(0, n - 1))
    }, [n, focus])

    const paint = useCallback(() => {
        const m = measureDock(live.current.dock, fitNow.current)
        const { mids, total } = lineUp(sizes.current, m.gap)
        span.current = total
        const list = tileRefs.current
        for (let i = 0; i < mids.length; i++) {
            const el = list[i]
            if (el)
                el.style.transform = tileTransform(
                    mids[i],
                    sizes.current[i],
                    m.box
                )
        }
        const tray = trayRef.current
        if (tray) {
            const w = total + m.pad * 2 + 2
            tray.style.width = `${w.toFixed(2)}px`
            tray.style.transform = `translate3d(${(-w / 2).toFixed(2)}px, 0px, 0px)`
        }
        const mark = markRef.current
        const at = focusNow.current
        if (mark && mids[at] != null) {
            mark.style.transform = `translate3d(${mids[at].toFixed(2)}px, 0px, 0px)`
        }
    }, [])

    const step = useCallback(
        (now: number) => {
            frame.current = 0
            if (!permit.current) return

            const m = measureDock(live.current.dock, fitNow.current)
            const count = sizes.current.length
            const dt = lastT.current
                ? Math.min((now - lastT.current) / 16.667, 3)
                : 1
            lastT.current = now

            const px = pointer.current
            const { mids } = lineUp(sizes.current, m.gap)
            const k =
                0.03 +
                Math.max(
                    1,
                    Math.min(10, num(live.current.dock.snappiness, 6))
                ) *
                    0.018
            const damp = 2 * Math.sqrt(k) * 0.92
            let moving = false

            // goals, capped so the whole tray always fits inside the frame
            const goals = new Array<number>(count)
            let extra = 0
            for (let i = 0; i < count; i++) {
                goals[i] =
                    px == null || calm.current
                        ? m.rest
                        : m.rest +
                          (m.peak - m.rest) * bell(px - mids[i], m.reach)
                extra += goals[i] - m.rest
            }
            if (room.current > 0 && extra > 0) {
                const spare =
                    room.current -
                    m.pad * 2 -
                    2 -
                    (count * m.rest + Math.max(0, count - 1) * m.gap)
                if (extra > spare) {
                    const squeeze = Math.max(0, spare) / extra
                    for (let i = 0; i < count; i++)
                        goals[i] = m.rest + (goals[i] - m.rest) * squeeze
                }
            }

            for (let i = 0; i < count; i++) {
                const goal = goals[i]
                if (calm.current) {
                    sizes.current[i] = goal
                    speeds.current[i] = 0
                    continue
                }
                const diff = goal - sizes.current[i]
                speeds.current[i] += (diff * k - speeds.current[i] * damp) * dt
                sizes.current[i] += speeds.current[i] * dt
                if (Math.abs(diff) > 0.04 || Math.abs(speeds.current[i]) > 0.04)
                    moving = true
                else {
                    sizes.current[i] = goal
                    speeds.current[i] = 0
                }
            }

            paint()

            if (moving) frame.current = requestAnimationFrame(step)
            else lastT.current = 0
        },
        [paint]
    )

    const wake = useCallback(() => {
        if (!permit.current || frame.current) return
        lastT.current = 0
        frame.current = requestAnimationFrame(step)
    }, [step])

    const settleAtRest = useCallback(() => {
        const r = measureDock(live.current.dock, fitNow.current).rest
        for (let i = 0; i < sizes.current.length; i++) {
            sizes.current[i] = r
            speeds.current[i] = 0
        }
        paint()
    }, [paint])

    // every render: re-apply positions before the browser paints
    useBeforePaint(() => {
        paint()
    })

    // permit changes: park or resume
    useEffect(() => {
        if (!running) {
            if (frame.current) cancelAnimationFrame(frame.current)
            frame.current = 0
            pointer.current = null
            settleAtRest()
            return
        }
        wake()
    }, [running, wake, settleAtRest])

    // size / fit changes snap the dock to its new resting line
    useBeforePaint(() => {
        settleAtRest()
        wake()
    }, [
        fit,
        dock.restSize,
        dock.peakSize,
        dock.spacing,
        dock.trayPad,
        n,
        settleAtRest,
        wake,
    ])

    // shrink the dock to fit narrow frames (phones)
    useEffect(() => {
        const node = dockRef.current
        if (!node) return
        const measure = () => {
            const avail = node.getBoundingClientRect().width
            if (!avail) return
            room.current = avail
            const m = measureDock(live.current.dock, 1)
            const count = live.current.slides?.length || 0
            const line = count * m.rest + Math.max(0, count - 1) * m.gap
            // leave headroom so the magnified swell never runs past the edges
            const swell =
                (m.peak - m.rest) *
                Math.min(count, Math.max(1, m.reach / (m.rest + m.gap)))
            const usable = avail - m.pad * 2 - 2
            const next =
                line + swell > usable
                    ? Math.max(0.2, usable / (line + swell))
                    : 1
            if (Math.abs(next - fitNow.current) > 0.002) setFit(next)
        }
        measure()
        if (typeof ResizeObserver !== "undefined") {
            const ro = new ResizeObserver(measure)
            ro.observe(node)
            return () => ro.disconnect()
        }
        window.addEventListener("resize", measure)
        return () => window.removeEventListener("resize", measure)
    }, [n, dock.restSize, dock.spacing, dock.trayPad])

    useEffect(
        () => () => {
            if (frame.current) cancelAnimationFrame(frame.current)
            frame.current = 0
        },
        []
    )

    const choose = useCallback((next: number) => {
        const count = live.current.slides?.length || 0
        if (!count) return
        const target = wrapIndex(next, count)
        const prev = focusNow.current
        if (prev === target) return
        focusNow.current = target
        setTrail(
            calm.current || num(live.current.hero.fadeMs, 600) <= 0
                ? null
                : prev
        )
        setStamp((s) => s + 1)
        setFocus(target)
    }, [])

    const fadeMs = calmState ? 0 : Math.max(0, num(hero.fadeMs, 600))

    // fallback in case a browser skips animationend (backgrounded tab, etc.)
    useEffect(() => {
        if (trail == null) return
        const id = window.setTimeout(() => setTrail(null), fadeMs + 120)
        return () => window.clearTimeout(id)
    }, [trail, stamp, fadeMs])

    // autoplay — gated by the same permit
    useEffect(() => {
        if (!cycle.enabled || !running || calmState || n < 2) return
        if (cycle.holdOnHover && hovering) return
        const id = window.setTimeout(
            () => {
                if (!permit.current) return
                choose(focusNow.current + 1)
            },
            Math.max(1, num(cycle.everySec, 5)) * 1000
        )
        return () => window.clearTimeout(id)
    }, [
        cycle.enabled,
        cycle.everySec,
        cycle.holdOnHover,
        hovering,
        running,
        calmState,
        focus,
        n,
        choose,
    ])

    // hero video plays only while permitted
    useEffect(() => {
        const v = clipRef.current
        if (!v) return
        armClip(v)
        if (running) {
            const go = v.play()
            if (go && typeof go.catch === "function") go.catch(() => {})
        } else v.pause()
    }, [running, focus, stamp])

    /* ---------- pointer: mouse hover + touch scrub ---------- */

    const track = (clientX: number) => {
        const node = dockRef.current
        if (!node) return
        const r = node.getBoundingClientRect()
        const off = clientX - (r.left + r.width / 2)
        const m = measureDock(live.current.dock, fitNow.current)
        const half = span.current / 2 + m.pad
        pointer.current = Math.abs(off) <= half ? off : null
        wake()
    }
    const release = () => {
        if (pointer.current == null) return
        pointer.current = null
        wake()
    }
    // touch: slide a finger along the dock to magnify, lift to pick that tile
    const scrub = useRef<{ x: number; moved: boolean } | null>(null)
    const skipClickUntil = useRef(0)

    const onDockMove = (e: React.PointerEvent) => {
        if (e.pointerType !== "mouse") {
            if (!scrub.current) return
            if (Math.abs(e.clientX - scrub.current.x) > 8)
                scrub.current.moved = true
        }
        track(e.clientX)
    }
    const onDockDown = (e: React.PointerEvent) => {
        if (e.pointerType === "mouse") return
        scrub.current = { x: e.clientX, moved: false }
        track(e.clientX)
    }
    const onDockUp = (e: React.PointerEvent) => {
        if (e.pointerType === "mouse") return
        const s = scrub.current
        scrub.current = null
        if (s && s.moved && pointer.current != null) {
            const { mids } = lineUp(
                sizes.current,
                measureDock(live.current.dock, fitNow.current).gap
            )
            let best = 0
            for (let i = 1; i < mids.length; i++) {
                if (
                    Math.abs(mids[i] - pointer.current) <
                    Math.abs(mids[best] - pointer.current)
                )
                    best = i
            }
            skipClickUntil.current =
                (typeof performance !== "undefined"
                    ? performance.now()
                    : Date.now()) + 450
            choose(best)
        }
        release()
    }
    const onDockCancel = () => {
        scrub.current = null
        release()
    }
    const onTileClick = (i: number) => {
        const now =
            typeof performance !== "undefined" ? performance.now() : Date.now()
        if (now < skipClickUntil.current) return
        choose(i)
    }

    const onKey = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowRight") {
            e.preventDefault()
            choose(focusNow.current + 1)
        } else if (e.key === "ArrowLeft") {
            e.preventDefault()
            choose(focusNow.current - 1)
        }
    }

    const current = slides[focus]
    const behind = trail != null ? slides[trail] : undefined
    const m0 = measureDock(dock, fit)
    const dockHeight = m0.peak + m0.pad * 2
    const tileCorner =
        num(dock.tileRadius, 12) * (m0.box / Math.max(1, m0.rest / fit))

    // first-paint positions (also what server-rendered HTML shows)
    const restLine = useMemo(
        () => lineUp(new Array(n).fill(m0.rest), m0.gap),
        [n, m0.rest, m0.gap]
    )
    const restTrayW = restLine.total + m0.pad * 2 + 2

    const sheet = useMemo(
        () => `
@keyframes ${fadeName} { from { opacity: 0 } to { opacity: 1 } }
@keyframes ${showName} { from { opacity: 0 } to { opacity: 1 } }
@keyframes ${liftName} { from { opacity: 0; -webkit-transform: translate3d(0,10px,0); transform: translate3d(0,10px,0) } to { opacity: 1; -webkit-transform: none; transform: none } }
.${fadeName}-tile { cursor: pointer; -webkit-appearance: none; appearance: none; -webkit-tap-highlight-color: transparent; outline: none; }
.${fadeName}-tile::-moz-focus-inner { border: 0; padding: 0; }
.${fadeName}-tile:focus-visible { box-shadow: 0 0 0 3px ${dock.markerInk}; }
.${fadeName}-tile img, .${fadeName}-tile video { -webkit-user-drag: none; user-select: none; -webkit-user-select: none; }
`,
        [fadeName, showName, liftName, dock.markerInk]
    )

    const captionAnim =
        calmState || caption.entry === "instant"
            ? undefined
            : caption.entry === "fade"
              ? `${showName} 420ms ease both`
              : `${liftName} 520ms cubic-bezier(0.22, 1, 0.36, 1) both`

    const layer = (s: Slide | undefined, top: boolean) => {
        const src = pictureSrc(s)
        const vid = clipSrc(s)
        const media: React.CSSProperties = {
            ...pinAll,
            width: "100%",
            height: "100%",
            objectFit: hero.fit,
            display: "block",
        }
        const fading = top && trail != null && fadeMs > 0
        return (
            <div
                key={top ? `top-${stamp}` : `under-${trail}`}
                onAnimationEnd={top ? () => setTrail(null) : undefined}
                style={{
                    ...pinAll,
                    background: src || vid ? "transparent" : flatPanel,
                    animation: fading
                        ? `${fadeName} ${fadeMs}ms ease both`
                        : undefined,
                    WebkitAnimation: fading
                        ? `${fadeName} ${fadeMs}ms ease both`
                        : undefined,
                }}
            >
                {vid ? (
                    <video
                        ref={(el) => {
                            armClip(el)
                            if (top) clipRef.current = el
                        }}
                        src={vid}
                        poster={src || undefined}
                        muted
                        loop
                        playsInline
                        preload={top ? "auto" : "none"}
                        disablePictureInPicture
                        style={media}
                    />
                ) : src ? (
                    <img
                        src={src}
                        srcSet={pictureSet(s)}
                        sizes="100vw"
                        alt={top ? pictureAlt(s) : ""}
                        decoding="async"
                        draggable={false}
                        style={media}
                    />
                ) : null}
            </div>
        )
    }

    const heroBody = (
        <>
            {behind ? layer(behind, false) : null}
            {layer(current, true)}
            <div
                style={{
                    ...pinAll,
                    pointerEvents: "none",
                    background: `linear-gradient(to top, rgba(0,0,0,${hero.shade}) 0%, rgba(0,0,0,0) 55%)`,
                }}
            />
            {current ? (
                <div
                    key={`cap-${focus}`}
                    style={{
                        position: "absolute",
                        left: caption.edge,
                        right: caption.edge,
                        bottom: caption.edge,
                        pointerEvents: "none",
                        animation: captionAnim,
                        WebkitAnimation: captionAnim,
                    }}
                >
                    {current.label ? (
                        <div
                            style={{
                                ...caption.labelFont,
                                color: caption.labelInk,
                                textTransform: "uppercase",
                                marginBottom: 6,
                            }}
                        >
                            {current.label}
                        </div>
                    ) : null}
                    <div
                        style={{
                            ...caption.titleFont,
                            color: caption.ink,
                            margin: 0,
                        }}
                    >
                        {current.title}
                    </div>
                </div>
            ) : null}
        </>
    )

    const heroFrame: React.CSSProperties = {
        position: "relative",
        display: "block",
        flex: "1 1 0%",
        minHeight: 0,
        borderRadius: hero.radius,
        overflow: "hidden",
        background: "#111",
        textDecoration: "none",
        isolation: "isolate",
        // Safari: forces rounded clipping of video / composited children
        WebkitMaskImage: "-webkit-radial-gradient(white, black)",
        transform: "translateZ(0)",
        WebkitTapHighlightColor: "transparent",
    }

    return (
        <div
            ref={shellRef}
            tabIndex={0}
            role="region"
            aria-roledescription="gallery"
            aria-label="Image gallery"
            onKeyDown={onKey}
            onPointerEnter={(e) => {
                if (e.pointerType === "mouse") setHovering(true)
            }}
            onPointerLeave={() => setHovering(false)}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                background: surface,
                padding: inset,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                WebkitFontSmoothing: "antialiased",
                outline: "none",
            }}
        >
            <style>{sheet}</style>

            {current?.link ? (
                <a
                    href={current.link}
                    target={hero.openInNewTab ? "_blank" : undefined}
                    rel={hero.openInNewTab ? "noopener noreferrer" : undefined}
                    style={heroFrame}
                >
                    {heroBody}
                </a>
            ) : (
                <div style={heroFrame}>{heroBody}</div>
            )}

            <div
                ref={dockRef}
                role="tablist"
                aria-label="Choose image"
                onPointerMove={onDockMove}
                onPointerDown={onDockDown}
                onPointerUp={onDockUp}
                onPointerCancel={onDockCancel}
                onPointerLeave={(e) => {
                    if (e.pointerType === "mouse") release()
                }}
                style={
                    {
                        position: "relative",
                        flexShrink: 0,
                        width: "100%",
                        height: dockHeight,
                        marginTop: stackGap,
                        touchAction: "pan-y",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        WebkitTouchCallout: "none",
                    } as React.CSSProperties
                }
            >
                <div
                    ref={trayRef}
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: "50%",
                        bottom: 0,
                        height: dockHeight,
                        width: restTrayW,
                        transform: `translate3d(${(-restTrayW / 2).toFixed(2)}px, 0px, 0px)`,
                        boxSizing: "border-box",
                        background: dock.trayFill,
                        border: `1px solid ${dock.trayLine}`,
                        borderRadius: dock.trayRadius,
                        boxShadow: dock.lifted
                            ? "0 10px 30px rgba(0,0,0,0.06)"
                            : "none",
                        pointerEvents: "none",
                    }}
                />
                {slides.map((item, i) => {
                    const tSrc = pictureSrc(item)
                    const tVid = clipSrc(item)
                    const on = i === focus
                    return (
                        <button
                            key={i}
                            ref={(el) => {
                                tileRefs.current[i] = el
                            }}
                            type="button"
                            role="tab"
                            aria-selected={on}
                            aria-label={item.title || `Item ${i + 1}`}
                            tabIndex={on ? 0 : -1}
                            className={`${fadeName}-tile`}
                            onClick={() => onTileClick(i)}
                            style={{
                                position: "absolute",
                                left: "50%",
                                bottom: m0.pad,
                                width: m0.box,
                                height: m0.box,
                                margin: 0,
                                padding: 0,
                                border: "none",
                                borderRadius: tileCorner,
                                overflow: "hidden",
                                background: tSrc || tVid ? "#ddd" : flatPanel,
                                transformOrigin: "50% 100%",
                                WebkitTransformOrigin: "50% 100%",
                                transform: tileTransform(
                                    restLine.mids[i] ?? 0,
                                    m0.rest,
                                    m0.box
                                ),
                                willChange: "transform",
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                            }}
                        >
                            {tSrc ? (
                                <img
                                    src={tSrc}
                                    alt=""
                                    decoding="async"
                                    draggable={false}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                        pointerEvents: "none",
                                    }}
                                />
                            ) : tVid ? (
                                <video
                                    ref={armClip}
                                    src={`${tVid}#t=0.1`}
                                    muted
                                    playsInline
                                    preload="metadata"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                        pointerEvents: "none",
                                    }}
                                />
                            ) : null}
                        </button>
                    )
                })}
                <span
                    ref={markRef}
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: "50%",
                        bottom: m0.pad / 2 - dock.markerSize / 2,
                        width: dock.markerSize,
                        height: dock.markerSize,
                        marginLeft: -dock.markerSize / 2,
                        borderRadius: "50%",
                        background: dock.markerInk,
                        pointerEvents: "none",
                        transform: `translate3d(${(restLine.mids[focus] ?? 0).toFixed(2)}px, 0px, 0px)`,
                    }}
                />
            </div>
        </div>
    )
}

/* ======================================================================
 * Defaults & controls
 * ==================================================================== */

const pic = (id: string) =>
    `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`

const seedSlides: Slide[] = [
    {
        imageUrl: pic("1464822759023-fed622ff2c3b"),
        label: "Summit Journal",
        title: "Granite at First Light",
    },
    {
        imageUrl: pic("1470071459604-3b5ec3a7fe05"),
        label: "Quiet Hours",
        title: "Mist Over the Pines",
    },
    {
        imageUrl: pic("1501785888041-af3ef285b470"),
        label: "Still Waters",
        title: "A Lake Holding Its Breath",
    },
    {
        imageUrl: pic("1506905925346-21bda4d32df4"),
        label: "Upper Air",
        title: "Islands Above the Cloud",
    },
    {
        imageUrl: pic("1441974231531-c6227db76b6e"),
        label: "Forest Diary",
        title: "Cathedral of Tall Trees",
    },
    {
        imageUrl: pic("1472214103451-9374bd1c798e"),
        label: "Open Country",
        title: "Hills in Soft Velvet",
    },
    {
        imageUrl: pic("1433086966358-54859d0ed716"),
        label: "Water Notes",
        title: "The River Lets Go",
    },
    {
        imageUrl: pic("1469474968028-56623f02e42e"),
        label: "Golden Hour",
        title: "Ember on the Horizon",
    },
    {
        imageUrl: pic("1500530855697-b586d89ba3ee"),
        label: "Wayfinding",
        title: "Roads That Wander Home",
    },
]

const BASELINE: LunetteProps = {
    slides: seedSlides,
    startAt: 1,
    surface: "#FFFFFF",
    inset: 20,
    stackGap: 16,
    hero: {
        radius: 22,
        shade: 0.55,
        fit: "cover",
        fadeMs: 600,
        openInNewTab: true,
    },
    caption: {
        labelFont: {
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.12em",
            lineHeight: "1.2em",
        },
        titleFont: {
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: "1.1em",
        },
        ink: "#FFFFFF",
        labelInk: "rgba(255,255,255,0.75)",
        edge: 24,
        entry: "instant",
    },
    dock: {
        restSize: 40,
        peakSize: 84,
        reach: 150,
        spacing: 8,
        tileRadius: 12,
        trayFill: "#F4F4F4",
        trayLine: "rgba(0,0,0,0.05)",
        trayRadius: 20,
        trayPad: 10,
        lifted: false,
        markerInk: "#1A1A1A",
        markerSize: 4,
        snappiness: 6,
    },
    cycle: { enabled: false, everySec: 5, holdOnHover: true },
}

function fillIn(p: Partial<LunetteProps>): LunetteProps {
    return {
        ...BASELINE,
        ...p,
        slides: Array.isArray(p.slides) ? p.slides : BASELINE.slides,
        hero: { ...BASELINE.hero, ...(p.hero || {}) },
        caption: { ...BASELINE.caption, ...(p.caption || {}) },
        dock: { ...BASELINE.dock, ...(p.dock || {}) },
        cycle: { ...BASELINE.cycle, ...(p.cycle || {}) },
    }
}

addPropertyControls(Lunette, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        maxCount: 16,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…",
                },
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
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "New Chapter",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Untitled Scene",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: seedSlides,
    },
    startAt: {
        type: ControlType.Number,
        title: "Start At",
        min: 1,
        max: 16,
        step: 1,
        displayStepper: true,
        defaultValue: 1,
    },
    surface: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    inset: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 80,
        step: 1,
        defaultValue: 20,
    },
    stackGap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 80,
        step: 1,
        defaultValue: 16,
    },
    hero: {
        type: ControlType.Object,
        title: "Hero",
        controls: {
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 60,
                defaultValue: 22,
            },
            shade: {
                type: ControlType.Number,
                title: "Shade",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0.55,
            },
            fit: {
                type: ControlType.Enum,
                title: "Fit",
                options: ["cover", "contain"],
                optionTitles: ["Fill", "Fit"],
                displaySegmentedControl: true,
                defaultValue: "cover",
            },
            fadeMs: {
                type: ControlType.Number,
                title: "Crossfade",
                min: 0,
                max: 2000,
                step: 50,
                unit: "ms",
                defaultValue: 600,
            },
            openInNewTab: {
                type: ControlType.Boolean,
                title: "New Tab",
                defaultValue: true,
            },
        },
    },
    caption: {
        type: ControlType.Object,
        title: "Caption",
        controls: {
            labelFont: {
                type: ControlType.Font,
                title: "Label",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    lineHeight: "1.2em",
                },
            },
            titleFont: {
                type: ControlType.Font,
                title: "Title",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 26,
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    lineHeight: "1.1em",
                },
            },
            ink: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#FFFFFF",
            },
            labelInk: {
                type: ControlType.Color,
                title: "Label Text",
                defaultValue: "rgba(255,255,255,0.75)",
            },
            edge: {
                type: ControlType.Number,
                title: "Inset",
                min: 0,
                max: 80,
                defaultValue: 24,
            },
            entry: {
                type: ControlType.Enum,
                title: "Change",
                options: ["instant", "fade", "rise"],
                optionTitles: ["Instant", "Fade", "Rise"],
                displaySegmentedControl: true,
                defaultValue: "instant",
            },
        },
    },
    dock: {
        type: ControlType.Object,
        title: "Dock",
        controls: {
            restSize: {
                type: ControlType.Number,
                title: "Size",
                min: 20,
                max: 120,
                defaultValue: 40,
            },
            peakSize: {
                type: ControlType.Number,
                title: "Hover Size",
                min: 20,
                max: 200,
                defaultValue: 84,
            },
            reach: {
                type: ControlType.Number,
                title: "Spread",
                min: 40,
                max: 400,
                defaultValue: 150,
            },
            snappiness: {
                type: ControlType.Number,
                title: "Snappiness",
                min: 1,
                max: 10,
                step: 0.5,
                defaultValue: 6,
            },
            spacing: {
                type: ControlType.Number,
                title: "Spacing",
                min: 0,
                max: 40,
                defaultValue: 8,
            },
            tileRadius: {
                type: ControlType.Number,
                title: "Tile Radius",
                min: 0,
                max: 60,
                defaultValue: 12,
            },
            trayFill: {
                type: ControlType.Color,
                title: "Tray",
                defaultValue: "#F4F4F4",
            },
            trayLine: {
                type: ControlType.Color,
                title: "Tray Border",
                defaultValue: "rgba(0,0,0,0.05)",
            },
            trayRadius: {
                type: ControlType.Number,
                title: "Tray Radius",
                min: 0,
                max: 60,
                defaultValue: 20,
            },
            trayPad: {
                type: ControlType.Number,
                title: "Tray Padding",
                min: 0,
                max: 40,
                defaultValue: 10,
            },
            lifted: {
                type: ControlType.Boolean,
                title: "Shadow",
                defaultValue: false,
            },
            markerInk: {
                type: ControlType.Color,
                title: "Dot",
                defaultValue: "#1A1A1A",
            },
            markerSize: {
                type: ControlType.Number,
                title: "Dot Size",
                min: 0,
                max: 12,
                defaultValue: 4,
            },
        },
    },
    cycle: {
        type: ControlType.Object,
        title: "Autoplay",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: false,
            },
            everySec: {
                type: ControlType.Number,
                title: "Every",
                min: 1,
                max: 30,
                step: 0.5,
                unit: "s",
                defaultValue: 5,
            },
            holdOnHover: {
                type: ControlType.Boolean,
                title: "Pause Hover",
                defaultValue: true,
            },
        },
    },
})
