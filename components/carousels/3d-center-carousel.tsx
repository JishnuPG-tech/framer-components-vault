import * as React from "react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type PanelImage = { src?: string; srcSet?: string; alt?: string }

type Panel = {
    media?: "image" | "video"
    image?: PanelImage
    imageUrl?: string
    video?: string
    videoUrl?: string
    poster?: PanelImage
    posterUrl?: string
    label?: string
    description?: string
    link?: string
    newTab?: boolean
}

type FontStyle = React.CSSProperties

type Props = {
    panels: Panel[]
    panelWidth: number
    panelHeight: number
    gutter: number
    openX: number
    openY: number
    cardAlign: "top" | "center" | "bottom"
    corner: number
    placeholder: string

    playMode: "centre" | "visible"
    restart: boolean
    muted: boolean
    loopVideo: boolean

    autoplay: boolean
    interval: number
    direction: "next" | "prev"
    pauseOnHover: boolean
    draggable: boolean
    throwPower: number
    wheel: "off" | "sideways" | "both"
    wheelPace: number

    easing: "glide" | "spring"
    travel: number
    curve: "glide" | "smooth" | "soft" | "linear"
    stiffness: number
    damping: number

    metaFont: FontStyle
    metaColor: string
    sideText: number
    descFont: FontStyle
    descColor: string
    descGap: number
    descSpace: number
    showIndex: boolean
    indexDigits: number
    indexGap: number
    labelGap: number

    imageZoom: number
    drift: number
    dim: number
    dimColor: string

    backdrop: boolean
    backdropBlur: number
    backdropZoom: number
    tint: string
    canvasColor: string
    fade: number
    edgeFade: number

    rowAlign: "top" | "center" | "bottom"
    rowShift: number
    pad: string
    compactBelow: number
    compactScale: number
    style?: React.CSSProperties
}

type Geometry = {
    seat: number
    wide: number
    low: number
    tall: number
    gap: number
}

type Spot = { x: number; w: number; t: number }

const EASE: Record<string, (k: number) => number> = {
    glide: (k) => 1 - Math.pow(1 - k, 4),
    smooth: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    soft: (k) => -(Math.cos(Math.PI * k) - 1) / 2,
    linear: (k) => k,
}

function wrap(v: number, n: number): number {
    return ((v % n) + n) % n
}

function clamp(v: number, lo: number, hi: number): number {
    return v < lo ? lo : v > hi ? hi : v
}

function isVideo(panel?: Panel): boolean {
    return !!panel && panel.media === "video"
}

function pickVideo(panel?: Panel): string {
    if (!panel) return ""
    const direct =
        typeof panel.videoUrl === "string" ? panel.videoUrl.trim() : ""
    if (direct) return direct
    return typeof panel.video === "string" ? panel.video : ""
}

function pickPoster(panel?: Panel): string {
    if (!panel) return ""
    const direct =
        typeof panel.posterUrl === "string" ? panel.posterUrl.trim() : ""
    if (direct) return direct
    return panel.poster && panel.poster.src ? panel.poster.src : ""
}

/** Still used for the blurred backdrop: image for image cards, poster for video cards. */
function pickStill(panel?: Panel): string {
    return isVideo(panel) ? pickPoster(panel) : pickSource(panel)
}

function pickSource(panel?: Panel): string {
    if (!panel) return ""
    const direct =
        typeof panel.imageUrl === "string" ? panel.imageUrl.trim() : ""
    if (direct) return direct
    return panel.image && panel.image.src ? panel.image.src : ""
}

function pickSrcSet(panel?: Panel): string | undefined {
    if (!panel) return undefined
    if (panel.imageUrl && panel.imageUrl.trim()) return undefined
    return panel.image && panel.image.srcSet ? panel.image.srcSet : undefined
}

function pickAlt(panel?: Panel): string {
    if (!panel) return ""
    return (panel.image && panel.image.alt) || panel.label || ""
}

function stamp(position: number, digits: number): string {
    const raw = String(position)
    if (raw.length >= digits) return raw
    return new Array(digits - raw.length + 1).join("0") + raw
}

function textSize(font?: FontStyle, fallback = 13): number {
    if (!font) return fallback
    const parsed = parseFloat(String(font.fontSize))
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function openness(d: number): number {
    return Math.max(0, 1 - Math.abs(d))
}

/** Lays out virtual cards around a fractional position; x is relative to the centre line. */
function placeRange(
    pos: number,
    from: number,
    to: number,
    g: Geometry
): Map<number, Spot> {
    const base = Math.floor(pos)
    const frac = pos - base
    const out = new Map<number, Spot>()
    const lo = Math.min(from, base)
    const hi = Math.max(to, base + 1)

    let edge = 0
    for (let v = base; v <= hi; v++) {
        const t = openness(v - pos)
        const w = g.seat + (g.wide - g.seat) * t
        out.set(v, { x: edge, w, t })
        edge += w + g.gap
    }
    edge = 0
    for (let v = base - 1; v >= lo; v--) {
        const t = openness(v - pos)
        const w = g.seat + (g.wide - g.seat) * t
        edge -= w + g.gap
        out.set(v, { x: edge, w, t })
    }

    const a = out.get(base) as Spot
    const b = out.get(base + 1) as Spot
    const ca = a.x + a.w / 2
    const cb = b.x + b.w / 2
    const focus = ca + (cb - ca) * frac
    out.forEach((spot) => {
        spot.x -= focus
    })
    return out
}

function lift(align: Props["cardAlign"], h: number, tall: number): number {
    if (align === "center") return (tall - h) / 2
    if (align === "bottom") return tall - h
    return 0
}

function frameHeight(t: number, g: Geometry): number {
    return g.low + (g.tall - g.low) * t
}

function textReveal(t: number): number {
    return clamp((t - 0.7) / 0.3, 0, 1)
}

function geometryOf(p: Props, scale: number): Geometry {
    return {
        seat: Math.max(24, p.panelWidth * scale),
        wide: Math.max(24, p.panelWidth * p.openX * scale),
        low: Math.max(24, p.panelHeight * scale),
        tall: Math.max(24, p.panelHeight * Math.max(1, p.openY) * scale),
        gap: p.gutter,
    }
}

function edgeMask(px: number): string | undefined {
    if (!px || px <= 0) return undefined
    return `linear-gradient(to right, transparent 0px, #000 ${px}px, #000 calc(100% - ${px}px), transparent 100%)`
}

/* ------------------------------------------------------------------ *
 * Canvas / export branch — plain markup only
 * ------------------------------------------------------------------ */

function RestView(props: Props) {
    const list = Array.isArray(props.panels) ? props.panels : []
    const n = list.length
    const g = geometryOf(props, 1)
    const metaLine = Math.round(textSize(props.metaFont) * 1.5)
    const head = props.showIndex ? props.indexGap + metaLine : 0
    const box =
        head +
        g.tall +
        props.labelGap +
        metaLine +
        props.descGap +
        props.descSpace
    const reach = 6
    const spots = placeRange(0, -reach, reach, g)
    const mask = edgeMask(props.edgeFade)

    const cards: React.ReactNode[] = []
    for (let v = -reach; v <= reach; v++) {
        const spot = spots.get(v) as Spot
        const card = n ? list[wrap(v, n)] : undefined
        const video = isVideo(card)
        const source = video ? "" : pickSource(card)
        const clip = video ? pickVideo(card) : ""
        const still = video ? pickPoster(card) : ""
        const h = frameHeight(spot.t, g)
        const textOpacity = props.sideText + (1 - props.sideText) * spot.t
        const reveal = textReveal(spot.t)
        cards.push(
            <div
                key={v}
                style={{
                    position: "absolute",
                    top: 0,
                    left: `calc(50% + ${spot.x}px)`,
                    width: spot.w,
                    height: box,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: head + lift(props.cardAlign, h, g.tall),
                        height: h,
                    }}
                >
                    {props.showIndex && n ? (
                        <div
                            style={{
                                ...props.metaFont,
                                color: props.metaColor,
                                position: "absolute",
                                left: 0,
                                bottom: `calc(100% + ${props.indexGap}px)`,
                                opacity: textOpacity,
                                whiteSpace: "nowrap",
                            }}
                        >
                            {stamp(wrap(v, n) + 1, props.indexDigits)}
                        </div>
                    ) : null}
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: "100%",
                            height: "100%",
                            overflow: "hidden",
                            borderRadius: props.corner,
                            background: props.placeholder,
                        }}
                    >
                        {source ? (
                            <img
                                src={source}
                                srcSet={pickSrcSet(card)}
                                alt={pickAlt(card)}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        ) : null}
                        {video && still ? (
                            <img
                                src={still}
                                alt={pickAlt(card)}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        ) : null}
                        {video && !still && clip ? (
                            <video
                                src={clip}
                                muted
                                playsInline
                                autoPlay={false}
                                preload="none"
                                style={{
                                    display: "block",
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        ) : null}
                        <div
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                right: 0,
                                bottom: 0,
                                background: props.dimColor,
                                opacity: props.dim * (1 - spot.t),
                            }}
                        />
                    </div>
                    {card && card.label ? (
                        <div
                            style={{
                                ...props.metaFont,
                                color: props.metaColor,
                                position: "absolute",
                                left: 0,
                                top: `calc(100% + ${props.labelGap}px)`,
                                opacity: textOpacity,
                                whiteSpace: "nowrap",
                            }}
                        >
                            {card.label}
                        </div>
                    ) : null}
                    {card && card.description && reveal > 0 ? (
                        <div
                            style={{
                                ...props.descFont,
                                color: props.descColor,
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top:
                                    h +
                                    props.labelGap +
                                    metaLine +
                                    props.descGap,
                                opacity: reveal,
                            }}
                        >
                            {card.description}
                        </div>
                    ) : null}
                </div>
            </div>
        )
    }

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: box + 80,
                overflow: "hidden",
                background: props.canvasColor,
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    background: props.tint,
                }}
            />
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    height: "100%",
                    padding: props.pad,
                    boxSizing: "border-box",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: box,
                        flex: "0 0 auto",
                        marginTop: props.rowAlign === "top" ? 0 : "auto",
                        marginBottom: props.rowAlign === "bottom" ? 0 : "auto",
                        top: props.rowShift,
                        WebkitMaskImage: mask,
                        maskImage: mask,
                    }}
                >
                    {cards}
                </div>
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ *
 * Live branch
 * ------------------------------------------------------------------ */

const useMeasureEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

function useCalm(): boolean {
    const [calm, setCalm] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        setCalm(query.matches)
        const sync = () => setCalm(query.matches)
        if (query.addEventListener) {
            query.addEventListener("change", sync)
            return () => query.removeEventListener("change", sync)
        }
        query.addListener(sync)
        return () => query.removeListener(sync)
    }, [])
    return calm
}

type SlotNodes = {
    root?: HTMLDivElement | null
    plate?: HTMLDivElement | null
    shift?: HTMLDivElement | null
    img?: HTMLImageElement | null
    video?: HTMLVideoElement | null
    shade?: HTMLDivElement | null
    number?: HTMLDivElement | null
    label?: HTMLDivElement | null
    desc?: HTMLDivElement | null
}

type Engine = {
    pos: number
    target: number
    vel: number
    from: number
    start: number
    dur: number
    lastTick: number
    frame: number
    timer: ReturnType<typeof setTimeout> | null
    visible: boolean
    pageShown: boolean
    hover: boolean
    dragging: boolean
    captured: boolean
    pointerId: number
    startX: number
    startPos: number
    lastX: number
    lastT: number
    flick: number
    moved: number
    wheelSum: number
    wheelLast: number
    wheelLock: number
    anchor: number
}

function LiveView(props: Props) {
    const list = Array.isArray(props.panels) ? props.panels : []
    const n = list.length

    const shell = useRef<HTMLDivElement>(null)
    const row = useRef<HTMLDivElement>(null)
    const propsRef = useRef(props)
    propsRef.current = props

    const calm = useCalm()
    const calmRef = useRef(calm)
    calmRef.current = calm

    const [wide, setWide] = useState(0)
    const [anchor, setAnchor] = useState(0)

    const scale = wide > 0 && wide < props.compactBelow ? props.compactScale : 1
    const g = geometryOf(props, scale)
    const metaLine = Math.round(textSize(props.metaFont) * 1.5)
    const head = props.showIndex ? props.indexGap + metaLine : 0
    const box =
        head +
        g.tall +
        props.labelGap +
        metaLine +
        props.descGap +
        props.descSpace
    const reach =
        wide > 0
            ? Math.ceil((wide / 2 + g.wide) / Math.max(g.seat + g.gap, 8)) + 1
            : 4

    const layoutRef = useRef({ g, head, wide, reach, metaLine })
    layoutRef.current = { g, head, wide, reach, metaLine }

    const engine = useRef<Engine>({
        pos: 0,
        target: 0,
        vel: 0,
        from: 0,
        start: 0,
        dur: 0,
        lastTick: 0,
        frame: 0,
        timer: null,
        visible: false,
        pageShown: true,
        hover: false,
        dragging: false,
        captured: false,
        pointerId: -1,
        startX: 0,
        startPos: 0,
        lastX: 0,
        lastT: 0,
        flick: 0,
        moved: 0,
        wheelSum: 0,
        wheelLast: 0,
        wheelLock: 0,
        anchor: 0,
    }).current

    const nodes = useRef(new Map<number, SlotNodes>()).current
    const hazeClips = useRef(new Map<number, HTMLVideoElement>()).current

    const bindHaze = (index: number) => (el: HTMLVideoElement | null) => {
        if (el) hazeClips.set(index, el)
        else hazeClips.delete(index)
    }

    const bind = (v: number, key: keyof SlotNodes) => (el: any) => {
        let slot = nodes.get(v)
        if (!el) {
            if (slot) {
                slot[key] = null
                if (!slot.root && !slot.plate) nodes.delete(v)
            }
            return
        }
        if (!slot) {
            slot = {}
            nodes.set(v, slot)
        }
        slot[key] = el
    }

    const permitted = () => engine.visible && engine.pageShown

    const syncPlayback = () => {
        const p = propsRef.current
        const live = permitted()
        const centre = Math.round(engine.pos)
        const R = layoutRef.current.reach
        const count = Array.isArray(p.panels) ? p.panels.length : 0
        const lead = count ? wrap(centre, count) : -1
        let leadClip: HTMLVideoElement | null = null
        nodes.forEach((slot, v) => {
            const clip = slot.video
            if (!clip) return
            const wanted =
                live &&
                (p.playMode === "visible"
                    ? Math.abs(v - centre) <= R
                    : v === centre)
            if (v === centre) leadClip = clip
            if (wanted) {
                if (clip.paused) {
                    if (p.restart && p.playMode === "centre") {
                        try {
                            clip.currentTime = 0
                        } catch (e) {}
                    }
                    const run = clip.play()
                    if (run && typeof run.catch === "function") {
                        run.catch(() => {})
                    }
                }
            } else if (!clip.paused) {
                clip.pause()
            }
        })
        hazeClips.forEach((haze, index) => {
            const wanted = live && p.backdrop && index === lead
            if (wanted) {
                if (haze.paused) {
                    if (leadClip && isFinite(leadClip.currentTime)) {
                        try {
                            haze.currentTime = leadClip.currentTime
                        } catch (e) {}
                    }
                    const run = haze.play()
                    if (run && typeof run.catch === "function") {
                        run.catch(() => {})
                    }
                }
            } else if (!haze.paused) {
                haze.pause()
            }
        })
    }

    const applySlot = (slot: SlotNodes, spot: Spot) => {
        const p = propsRef.current
        const L = layoutRef.current
        const h = frameHeight(spot.t, L.g)
        const textOpacity = p.sideText + (1 - p.sideText) * spot.t
        const reveal = textReveal(spot.t)
        if (slot.root) {
            slot.root.style.visibility = "visible"
            slot.root.style.width = `${spot.w}px`
            slot.root.style.transform = `translate3d(${L.wide / 2 + spot.x}px,0,0)`
        }
        if (slot.plate) {
            slot.plate.style.top = `${L.head + lift(p.cardAlign, h, L.g.tall)}px`
            slot.plate.style.height = `${h}px`
        }
        const zoom = `scale(${1 + (p.imageZoom - 1) * spot.t})`
        if (slot.img) slot.img.style.transform = zoom
        if (slot.video) slot.video.style.transform = zoom
        if (slot.shade) slot.shade.style.opacity = String(p.dim * (1 - spot.t))
        if (slot.number) slot.number.style.opacity = String(textOpacity)
        if (slot.label) slot.label.style.opacity = String(textOpacity)
        if (slot.desc) {
            slot.desc.style.top = `${h + p.labelGap + L.metaLine + p.descGap}px`
            slot.desc.style.opacity = String(reveal)
            slot.desc.style.transform = `translate3d(0,${(1 - reveal) * 10}px,0)`
        }
        if (slot.shift && spot.t < 0.5) {
            slot.shift.style.transform = "translate3d(0,0,0)"
        }
    }

    const paint = () => {
        const L = layoutRef.current
        if (!L.wide) return
        const a = Math.round(engine.pos)
        const spots = placeRange(
            engine.pos,
            a - L.reach - 1,
            a + L.reach + 1,
            L.g
        )
        nodes.forEach((slot, v) => {
            const spot = spots.get(v)
            if (!spot) {
                if (slot.root) slot.root.style.visibility = "hidden"
                return
            }
            applySlot(slot, spot)
        })
        if (a !== engine.anchor) {
            engine.anchor = a
            setAnchor(a)
            syncPlayback()
        }
    }

    const disarm = () => {
        if (engine.timer !== null) {
            clearTimeout(engine.timer)
            engine.timer = null
        }
    }

    const arm = () => {
        disarm()
        const p = propsRef.current
        const count = Array.isArray(p.panels) ? p.panels.length : 0
        if (
            !p.autoplay ||
            count < 2 ||
            calmRef.current ||
            !permitted() ||
            engine.dragging ||
            engine.frame ||
            (engine.hover && p.pauseOnHover)
        )
            return
        engine.timer = setTimeout(
            () => {
                engine.timer = null
                if (!permitted()) return
                const step = propsRef.current.direction === "prev" ? -1 : 1
                goTo(Math.round(engine.target) + step)
            },
            Math.max(0.3, p.interval) * 1000
        )
    }

    const tick = (now: number) => {
        engine.frame = 0
        if (!permitted()) return
        const p = propsRef.current
        const dt = engine.lastTick
            ? Math.min(0.05, (now - engine.lastTick) / 1000)
            : 1 / 60
        engine.lastTick = now
        let busy = engine.dragging

        if (!engine.dragging) {
            if (calmRef.current) {
                engine.pos = engine.target
                engine.vel = 0
            } else if (p.easing === "spring") {
                let rest = dt
                while (rest > 0) {
                    const h = Math.min(rest, 1 / 120)
                    const pull =
                        p.stiffness * (engine.target - engine.pos) -
                        p.damping * engine.vel
                    engine.vel += pull * h
                    engine.pos += engine.vel * h
                    rest -= h
                }
                if (
                    Math.abs(engine.target - engine.pos) < 0.0008 &&
                    Math.abs(engine.vel) < 0.003
                ) {
                    engine.pos = engine.target
                    engine.vel = 0
                } else {
                    busy = true
                }
            } else {
                const k =
                    engine.dur > 0
                        ? Math.min(
                              1,
                              (now - engine.start) / (engine.dur * 1000)
                          )
                        : 1
                const curve = EASE[p.curve] || EASE.glide
                engine.pos =
                    engine.from + (engine.target - engine.from) * curve(k)
                if (k < 1) busy = true
                else engine.pos = engine.target
            }
        }

        paint()

        if (busy && permitted()) {
            engine.frame = requestAnimationFrame(tick)
        } else {
            engine.lastTick = 0
            arm()
        }
    }

    const wake = () => {
        if (engine.frame || !permitted()) return
        engine.lastTick = 0
        engine.frame = requestAnimationFrame(tick)
    }

    const sleep = () => {
        if (engine.frame) cancelAnimationFrame(engine.frame)
        engine.frame = 0
        engine.lastTick = 0
    }

    const goTo = (dest: number) => {
        disarm()
        engine.from = engine.pos
        engine.target = dest
        engine.start =
            typeof performance !== "undefined" ? performance.now() : 0
        engine.dur = Math.max(0.05, propsRef.current.travel)
        wake()
    }

    const park = () => {
        sleep()
        disarm()
        engine.dragging = false
        engine.captured = false
        engine.vel = 0
        engine.flick = 0
        engine.wheelSum = 0
        engine.target = Math.round(engine.pos)
        engine.pos = engine.target
        paint()
        syncPlayback()
    }

    // measure the track width
    useMeasureEffect(() => {
        const node = row.current
        if (!node) return
        const read = () => setWide(node.getBoundingClientRect().width)
        read()
        if (typeof ResizeObserver !== "undefined") {
            const ro = new ResizeObserver(read)
            ro.observe(node)
            return () => ro.disconnect()
        }
        if (typeof window !== "undefined") {
            window.addEventListener("resize", read)
            return () => window.removeEventListener("resize", read)
        }
        return undefined
    }, [])

    // on-screen gate
    useEffect(() => {
        const node = shell.current
        if (!node) return
        if (typeof IntersectionObserver === "undefined") {
            engine.visible = true
            wake()
            syncPlayback()
            return
        }
        const io = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (!entry) return
                engine.visible = entry.isIntersecting
                if (engine.visible) {
                    wake()
                    syncPlayback()
                } else park()
            },
            { threshold: 0 }
        )
        io.observe(node)
        return () => io.disconnect()
    }, [])

    // tab visibility gate
    useEffect(() => {
        if (typeof document === "undefined") return
        const sync = () => {
            engine.pageShown = !document.hidden
            if (engine.pageShown) {
                wake()
                syncPlayback()
            } else park()
        }
        sync()
        document.addEventListener("visibilitychange", sync)
        return () => document.removeEventListener("visibilitychange", sync)
    }, [])

    // wheel stepping (non-passive so the page does not scroll underneath)
    useEffect(() => {
        const node = row.current
        if (!node) return
        const onWheel = (event: WheelEvent) => {
            const p = propsRef.current
            if (p.wheel === "off") return
            const sideways = Math.abs(event.deltaX) > Math.abs(event.deltaY)
            if (!sideways && p.wheel !== "both") return
            event.preventDefault()
            const now = performance.now()
            if (now - engine.wheelLast > 220) engine.wheelSum = 0
            engine.wheelLast = now
            if (now < engine.wheelLock) return
            engine.wheelSum += sideways ? event.deltaX : event.deltaY
            if (Math.abs(engine.wheelSum) >= 36) {
                const step = engine.wheelSum > 0 ? 1 : -1
                engine.wheelSum = 0
                engine.wheelLock = now + Math.max(0.1, p.wheelPace) * 1000
                goTo(Math.round(engine.target) + step)
            }
        }
        node.addEventListener("wheel", onWheel, { passive: false })
        return () => node.removeEventListener("wheel", onWheel)
    }, [])

    // unmount
    useEffect(() => {
        return () => {
            sleep()
            disarm()
        }
    }, [])

    // keep painted state and autoplay in step with prop edits / resizes
    useEffect(() => {
        if (!engine.frame && !engine.dragging) {
            paint()
            arm()
        }
        syncPlayback()
    })

    /* ---------------- pointer handlers ---------------- */

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!propsRef.current.draggable || n < 2) return
        if (event.pointerType === "mouse" && event.button !== 0) return
        sleep()
        disarm()
        engine.dragging = true
        engine.captured = false
        engine.pointerId = event.pointerId
        engine.startX = event.clientX
        engine.startPos = engine.pos
        engine.lastX = event.clientX
        engine.lastT = performance.now()
        engine.flick = 0
        engine.moved = 0
        engine.vel = 0
    }

    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!engine.dragging || event.pointerId !== engine.pointerId) return
        const dx = event.clientX - engine.startX
        engine.moved = Math.max(engine.moved, Math.abs(dx))
        if (!engine.captured && engine.moved > 5 && row.current) {
            engine.captured = true
            try {
                row.current.setPointerCapture(event.pointerId)
            } catch (e) {}
        }
        const pitch = Math.max(
            8,
            layoutRef.current.g.seat + layoutRef.current.g.gap
        )
        engine.pos = engine.startPos - dx / pitch
        engine.target = engine.pos
        const now = performance.now()
        const span = now - engine.lastT
        if (span > 0) {
            const instant =
                -(event.clientX - engine.lastX) / pitch / (span / 1000)
            engine.flick = engine.flick * 0.6 + instant * 0.4
        }
        engine.lastX = event.clientX
        engine.lastT = now
        paint()
    }

    const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!engine.dragging || event.pointerId !== engine.pointerId) return
        engine.dragging = false
        if (engine.captured && row.current) {
            try {
                row.current.releasePointerCapture(event.pointerId)
            } catch (e) {}
        }
        engine.captured = false
        if (performance.now() - engine.lastT > 120) engine.flick = 0
        const p = propsRef.current
        const toss = clamp(engine.flick * p.throwPower, -4, 4)
        engine.vel = p.easing === "spring" ? clamp(engine.flick, -30, 30) : 0
        goTo(Math.round(engine.pos + toss))
    }

    const onCardClick = (event: React.MouseEvent, v: number) => {
        if (engine.moved > 6) {
            event.preventDefault()
            engine.moved = 0
            return
        }
        if (Math.round(engine.target) !== v) {
            event.preventDefault()
            goTo(v)
        }
    }

    const onCardDrift = (event: React.PointerEvent<HTMLElement>, v: number) => {
        const p = propsRef.current
        if (engine.dragging || p.drift <= 0 || calmRef.current) return
        if (Math.round(engine.pos) !== v) return
        const slot = nodes.get(v)
        if (!slot || !slot.shift) return
        const rect = (
            event.currentTarget as HTMLElement
        ).getBoundingClientRect()
        if (!rect.width || !rect.height) return
        const fx = (event.clientX - rect.left) / rect.width - 0.5
        const fy = (event.clientY - rect.top) / rect.height - 0.5
        slot.shift.style.transform = `translate3d(${-fx * p.drift * 2}px,${-fy * p.drift * 2}px,0)`
    }

    const onCardLeave = (v: number) => {
        const slot = nodes.get(v)
        if (slot && slot.shift)
            slot.shift.style.transform = "translate3d(0,0,0)"
    }

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (n < 2) return
        if (event.key === "ArrowRight") {
            event.preventDefault()
            goTo(Math.round(engine.target) + 1)
        } else if (event.key === "ArrowLeft") {
            event.preventDefault()
            goTo(Math.round(engine.target) - 1)
        }
    }

    /* ---------------- render ---------------- */

    const spots =
        wide > 0
            ? placeRange(engine.pos, anchor - reach, anchor + reach, g)
            : null
    const focus = n ? wrap(anchor, n) : -1
    const mask = edgeMask(props.edgeFade)
    const fadeTiming = calm
        ? { duration: 0 }
        : { duration: props.fade, ease: [0.22, 1, 0.36, 1] }

    const cards: React.ReactNode[] = []
    for (let v = anchor - reach; v <= anchor + reach; v++) {
        const spot = spots ? spots.get(v) : undefined
        const card = n ? list[wrap(v, n)] : undefined
        const video = isVideo(card)
        const source = video ? "" : pickSource(card)
        const clip = video ? pickVideo(card) : ""
        const still = video ? pickPoster(card) : ""
        const t = spot ? spot.t : v === anchor ? 1 : 0
        const w = spot ? spot.w : g.seat
        const h = frameHeight(t, g)
        const textOpacity = props.sideText + (1 - props.sideText) * t
        const reveal = textReveal(t)
        const hasLink = !!(card && card.link)
        const Face: any = hasLink ? "a" : "div"

        cards.push(
            <div
                key={v}
                ref={bind(v, "root")}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: w,
                    height: box,
                    transform: `translate3d(${wide / 2 + (spot ? spot.x : 0)}px,0,0)`,
                    visibility: spot ? "visible" : "hidden",
                    willChange: "transform, width",
                }}
            >
                <div
                    ref={bind(v, "plate")}
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: head + lift(props.cardAlign, h, g.tall),
                        height: h,
                    }}
                >
                    {props.showIndex && n ? (
                        <div
                            ref={bind(v, "number")}
                            style={{
                                ...props.metaFont,
                                color: props.metaColor,
                                position: "absolute",
                                left: 0,
                                bottom: `calc(100% + ${props.indexGap}px)`,
                                opacity: textOpacity,
                                whiteSpace: "nowrap",
                                pointerEvents: "none",
                            }}
                        >
                            {stamp(wrap(v, n) + 1, props.indexDigits)}
                        </div>
                    ) : null}

                    <Face
                        href={hasLink ? card!.link : undefined}
                        target={hasLink && card!.newTab ? "_blank" : undefined}
                        rel={
                            hasLink && card!.newTab
                                ? "noopener noreferrer"
                                : undefined
                        }
                        draggable={false}
                        onClick={(event: React.MouseEvent) =>
                            onCardClick(event, v)
                        }
                        onPointerMove={(
                            event: React.PointerEvent<HTMLElement>
                        ) => onCardDrift(event, v)}
                        onPointerLeave={() => onCardLeave(v)}
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: "100%",
                            height: "100%",
                            display: "block",
                            overflow: "hidden",
                            borderRadius: props.corner,
                            background: props.placeholder,
                            textDecoration: "none",
                            cursor: props.draggable
                                ? "grab"
                                : hasLink
                                  ? "pointer"
                                  : "default",
                            WebkitTapHighlightColor: "transparent",
                        }}
                    >
                        <div
                            ref={bind(v, "shift")}
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                right: 0,
                                bottom: 0,
                                transition: calm
                                    ? "none"
                                    : "transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)",
                            }}
                        >
                            {source ? (
                                <img
                                    ref={bind(v, "img")}
                                    src={source}
                                    srcSet={pickSrcSet(card)}
                                    alt={pickAlt(card)}
                                    draggable={false}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        userSelect: "none",
                                        pointerEvents: "none",
                                        transform: `scale(${1 + (props.imageZoom - 1) * t})`,
                                        willChange: "transform",
                                    }}
                                />
                            ) : null}
                            {video && clip ? (
                                <video
                                    ref={bind(v, "video") as any}
                                    src={clip}
                                    poster={still || undefined}
                                    muted={props.muted}
                                    loop={props.loopVideo}
                                    playsInline
                                    autoPlay={false}
                                    preload="metadata"
                                    disablePictureInPicture
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        pointerEvents: "none",
                                        transform: `scale(${1 + (props.imageZoom - 1) * t})`,
                                        willChange: "transform",
                                    }}
                                />
                            ) : null}
                            {video && !clip && still ? (
                                <img
                                    ref={bind(v, "img")}
                                    src={still}
                                    alt={pickAlt(card)}
                                    draggable={false}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        userSelect: "none",
                                        pointerEvents: "none",
                                        transform: `scale(${1 + (props.imageZoom - 1) * t})`,
                                    }}
                                />
                            ) : null}
                        </div>
                        <div
                            ref={bind(v, "shade")}
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                right: 0,
                                bottom: 0,
                                background: props.dimColor,
                                opacity: props.dim * (1 - t),
                                pointerEvents: "none",
                            }}
                        />
                    </Face>

                    {card && card.label ? (
                        <div
                            ref={bind(v, "label")}
                            style={{
                                ...props.metaFont,
                                color: props.metaColor,
                                position: "absolute",
                                left: 0,
                                top: `calc(100% + ${props.labelGap}px)`,
                                opacity: textOpacity,
                                whiteSpace: "nowrap",
                                pointerEvents: "none",
                            }}
                        >
                            {card.label}
                        </div>
                    ) : null}

                    {card && card.description ? (
                        <div
                            ref={bind(v, "desc")}
                            style={{
                                ...props.descFont,
                                color: props.descColor,
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top:
                                    h +
                                    props.labelGap +
                                    metaLine +
                                    props.descGap,
                                opacity: reveal,
                                transform: `translate3d(0,${(1 - reveal) * 10}px,0)`,
                                pointerEvents: "none",
                            }}
                        >
                            {card.description}
                        </div>
                    ) : null}
                </div>
            </div>
        )
    }

    return (
        <div
            ref={shell}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            onKeyDown={onKeyDown}
            onPointerEnter={() => {
                engine.hover = true
                if (propsRef.current.pauseOnHover) disarm()
            }}
            onPointerLeave={() => {
                engine.hover = false
                if (!engine.frame && !engine.dragging) arm()
            }}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: box + 80,
                overflow: "hidden",
                background: props.canvasColor,
                boxSizing: "border-box",
                outline: "none",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 0,
                    pointerEvents: "none",
                }}
            >
                {props.backdrop
                    ? list.map((panel, index) => {
                          const still = pickStill(panel)
                          const clip = isVideo(panel) ? pickVideo(panel) : ""
                          if (clip) {
                              return (
                                  <motion.div
                                      key={index}
                                      initial={false}
                                      animate={{
                                          opacity: focus === index ? 1 : 0,
                                      }}
                                      transition={fadeTiming}
                                      style={{
                                          position: "absolute",
                                          left: 0,
                                          top: 0,
                                          right: 0,
                                          bottom: 0,
                                          overflow: "hidden",
                                          willChange: "opacity",
                                      }}
                                  >
                                      <video
                                          ref={bindHaze(index)}
                                          src={clip}
                                          poster={still || undefined}
                                          muted
                                          loop
                                          playsInline
                                          autoPlay={false}
                                          preload="metadata"
                                          aria-hidden="true"
                                          tabIndex={-1}
                                          style={{
                                              position: "absolute",
                                              left: 0,
                                              top: 0,
                                              width: "100%",
                                              height: "100%",
                                              objectFit: "cover",
                                              filter: `blur(${props.backdropBlur}px)`,
                                              transform: `scale(${props.backdropZoom})`,
                                          }}
                                      />
                                  </motion.div>
                              )
                          }
                          const source = still
                          if (!source) return null
                          return (
                              <motion.div
                                  key={index}
                                  initial={false}
                                  animate={{ opacity: focus === index ? 1 : 0 }}
                                  transition={fadeTiming}
                                  style={{
                                      position: "absolute",
                                      left: 0,
                                      top: 0,
                                      right: 0,
                                      bottom: 0,
                                      backgroundImage: `url(${source})`,
                                      backgroundSize: "cover",
                                      backgroundPosition: "center",
                                      filter: `blur(${props.backdropBlur}px)`,
                                      transform: `scale(${props.backdropZoom})`,
                                      willChange: "opacity",
                                  }}
                              />
                          )
                      })
                    : null}
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                        background: props.tint,
                    }}
                />
            </div>

            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    height: "100%",
                    padding: props.pad,
                    boxSizing: "border-box",
                }}
            >
                <div
                    ref={row}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    style={{
                        position: "relative",
                        width: "100%",
                        height: box,
                        flex: "0 0 auto",
                        marginTop: props.rowAlign === "top" ? 0 : "auto",
                        marginBottom: props.rowAlign === "bottom" ? 0 : "auto",
                        top: props.rowShift,
                        touchAction: "pan-y",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        WebkitMaskImage: mask,
                        maskImage: mask,
                    }}
                >
                    {wide > 0 ? cards : null}
                </div>
            </div>
        </div>
    )
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 820
 * @framerDisableUnlink
 */
export default function Crescendo(props: Props) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <RestView {...props} />
    return <LiveView {...props} />
}

Crescendo.defaultProps = {
    panelWidth: 220,
    panelHeight: 320,
    gutter: 8,
    openX: 2.2,
    openY: 1.45,
    cardAlign: "bottom",
    corner: 0,
    placeholder: "rgba(255,255,255,0.14)",

    playMode: "centre",
    restart: false,
    muted: true,
    loopVideo: true,

    autoplay: true,
    interval: 3,
    direction: "next",
    pauseOnHover: true,
    draggable: true,
    throwPower: 0.35,
    wheel: "sideways",
    wheelPace: 0.5,

    easing: "glide",
    travel: 0.95,
    curve: "glide",
    stiffness: 120,
    damping: 20,

    metaColor: "#ffffff",
    sideText: 0.55,
    descColor: "rgba(255,255,255,0.78)",
    descGap: 10,
    descSpace: 64,
    showIndex: true,
    indexDigits: 3,
    indexGap: 12,
    labelGap: 14,

    imageZoom: 1.06,
    drift: 7,
    dim: 0.3,
    dimColor: "#101010",

    backdrop: true,
    backdropBlur: 44,
    backdropZoom: 1.25,
    tint: "rgba(20,20,20,0.16)",
    canvasColor: "#b4b1ac",
    fade: 0.7,
    edgeFade: 0,

    rowAlign: "center",
    rowShift: 0,
    pad: "40px",
    compactBelow: 700,
    compactScale: 0.7,
}

addPropertyControls(Crescendo, {
    panels: {
        type: ControlType.Array,
        title: "Panels",
        control: {
            type: ControlType.Object,
            title: "Panel",
            controls: {
                media: {
                    type: ControlType.Enum,
                    title: "Media",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    displaySegmentedControl: true,
                    defaultValue: "image",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (c: Panel) => c.media === "video",
                },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…",
                    description: "Overrides the upload when filled",
                    hidden: (c: Panel) => c.media === "video",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (c: Panel) => c.media !== "video",
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://….mp4",
                    description: "Overrides the upload when filled",
                    hidden: (c: Panel) => c.media !== "video",
                },
                poster: {
                    type: ControlType.ResponsiveImage,
                    title: "Poster",
                    hidden: (c: Panel) => c.media !== "video",
                },
                posterUrl: {
                    type: ControlType.String,
                    title: "Poster URL",
                    placeholder: "https://…",
                    description:
                        "Shown before playback and used for the backdrop",
                    hidden: (c: Panel) => c.media !== "video",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "collection one",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "",
                    placeholder: "Shown under the centre panel",
                    displayTextArea: true,
                },
                link: {
                    type: ControlType.Link,
                    title: "CMS Link",
                },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    enabledTitle: "Yes",
                    disabledTitle: "No",
                    defaultValue: false,
                },
            },
        },
        defaultValue: [
            { label: "collection one" },
            { label: "collection two" },
            { label: "collection three" },
            { label: "collection four" },
            { label: "collection five" },
            { label: "collection six" },
        ],
    },

    panelWidth: {
        type: ControlType.Number,
        title: "Panel Width",
        min: 60,
        max: 640,
        step: 2,
        unit: "px",
        defaultValue: 220,
    },
    panelHeight: {
        type: ControlType.Number,
        title: "Panel Height",
        min: 80,
        max: 900,
        step: 2,
        unit: "px",
        defaultValue: 320,
    },
    gutter: {
        type: ControlType.Number,
        title: "Gutter",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        defaultValue: 8,
    },
    openX: {
        type: ControlType.Number,
        title: "Centre Width",
        min: 1,
        max: 4,
        step: 0.02,
        unit: "×",
        defaultValue: 2.2,
    },
    openY: {
        type: ControlType.Number,
        title: "Centre Height",
        min: 1,
        max: 3.2,
        step: 0.02,
        unit: "×",
        defaultValue: 1.45,
    },
    cardAlign: {
        type: ControlType.Enum,
        title: "Card Align",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Middle", "Bottom"],
        displaySegmentedControl: true,
        defaultValue: "bottom",
    },
    corner: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        defaultValue: 0,
    },
    placeholder: {
        type: ControlType.Color,
        title: "Empty Fill",
        defaultValue: "rgba(255,255,255,0.14)",
    },

    playMode: {
        type: ControlType.Enum,
        title: "Video Play",
        options: ["centre", "visible"],
        optionTitles: ["Centre", "All Visible"],
        displaySegmentedControl: true,
        defaultValue: "centre",
        description: "Centre plays only the open card and pauses the rest",
    },
    restart: {
        type: ControlType.Boolean,
        title: "Restart",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: false,
        description: "Start the video from the top when it reaches the centre",
        hidden: (p: Props) => p.playMode !== "centre",
    },
    muted: {
        type: ControlType.Boolean,
        title: "Muted",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: true,
        description: "Browsers block unmuted playback without a tap",
    },
    loopVideo: {
        type: ControlType.Boolean,
        title: "Loop Video",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: true,
    },

    autoplay: {
        type: ControlType.Boolean,
        title: "Auto Advance",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    interval: {
        type: ControlType.Number,
        title: "Hold",
        min: 0.5,
        max: 12,
        step: 0.1,
        unit: "s",
        defaultValue: 3,
        description: "Pause on each card before stepping",
        hidden: (p: Props) => !p.autoplay,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["next", "prev"],
        optionTitles: ["Forward", "Backward"],
        displaySegmentedControl: true,
        defaultValue: "next",
        hidden: (p: Props) => !p.autoplay,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Hover Pause",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: true,
        hidden: (p: Props) => !p.autoplay,
    },
    draggable: {
        type: ControlType.Boolean,
        title: "Drag",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    throwPower: {
        type: ControlType.Number,
        title: "Throw",
        min: 0,
        max: 1.5,
        step: 0.05,
        defaultValue: 0.35,
        description: "How far a quick flick carries",
        hidden: (p: Props) => !p.draggable,
    },
    wheel: {
        type: ControlType.Enum,
        title: "Wheel",
        options: ["off", "sideways", "both"],
        optionTitles: ["Off", "Sideways", "Both"],
        displaySegmentedControl: true,
        defaultValue: "sideways",
        description: "Both also steps on vertical scroll over the row",
    },
    wheelPace: {
        type: ControlType.Number,
        title: "Wheel Pace",
        min: 0.1,
        max: 1.5,
        step: 0.05,
        unit: "s",
        defaultValue: 0.5,
        hidden: (p: Props) => p.wheel === "off",
    },

    easing: {
        type: ControlType.Enum,
        title: "Motion",
        options: ["glide", "spring"],
        optionTitles: ["Glide", "Spring"],
        displaySegmentedControl: true,
        defaultValue: "glide",
    },
    travel: {
        type: ControlType.Number,
        title: "Step Time",
        min: 0.1,
        max: 2.5,
        step: 0.05,
        unit: "s",
        defaultValue: 0.95,
        hidden: (p: Props) => p.easing === "spring",
    },
    curve: {
        type: ControlType.Enum,
        title: "Curve",
        options: ["glide", "smooth", "soft", "linear"],
        optionTitles: ["Glide", "Smooth", "Soft", "Linear"],
        defaultValue: "glide",
        hidden: (p: Props) => p.easing === "spring",
    },
    stiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        min: 20,
        max: 400,
        step: 5,
        defaultValue: 120,
        hidden: (p: Props) => p.easing !== "spring",
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        min: 4,
        max: 60,
        step: 1,
        defaultValue: 20,
        hidden: (p: Props) => p.easing !== "spring",
    },

    metaFont: {
        type: ControlType.Font,
        title: "Meta Type",
        controls: "extended",
        defaultFontType: "sans",
        defaultValue: {
            fontSize: 13,
            lineHeight: 1.4,
            fontWeight: 400,
            letterSpacing: "0em",
        },
    },
    metaColor: {
        type: ControlType.Color,
        title: "Meta Fill",
        defaultValue: "#ffffff",
    },
    sideText: {
        type: ControlType.Number,
        title: "Side Text",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.55,
        description: "Label opacity on the cards beside the centre",
    },
    descFont: {
        type: ControlType.Font,
        title: "Description Type",
        controls: "extended",
        defaultFontType: "sans",
        defaultValue: {
            fontSize: 14,
            lineHeight: 1.45,
            fontWeight: 400,
            letterSpacing: "0em",
        },
    },
    descColor: {
        type: ControlType.Color,
        title: "Description Fill",
        defaultValue: "rgba(255,255,255,0.78)",
    },
    descGap: {
        type: ControlType.Number,
        title: "Description Gap",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        defaultValue: 10,
    },
    descSpace: {
        type: ControlType.Number,
        title: "Description Space",
        min: 0,
        max: 240,
        step: 4,
        unit: "px",
        defaultValue: 64,
        description: "Height reserved under the centre panel for the text",
    },
    showIndex: {
        type: ControlType.Boolean,
        title: "Numbering",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    indexDigits: {
        type: ControlType.Number,
        title: "Digits",
        min: 1,
        max: 5,
        step: 1,
        displayStepper: true,
        defaultValue: 3,
        hidden: (p: Props) => !p.showIndex,
    },
    indexGap: {
        type: ControlType.Number,
        title: "Number Gap",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        defaultValue: 12,
        hidden: (p: Props) => !p.showIndex,
    },
    labelGap: {
        type: ControlType.Number,
        title: "Label Gap",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        defaultValue: 14,
    },

    imageZoom: {
        type: ControlType.Number,
        title: "Image Settle",
        min: 1,
        max: 1.3,
        step: 0.01,
        unit: "×",
        defaultValue: 1.06,
        description: "Photo scale while a card sits in the centre",
    },
    drift: {
        type: ControlType.Number,
        title: "Pointer Drift",
        min: 0,
        max: 30,
        step: 1,
        unit: "px",
        defaultValue: 7,
    },
    dim: {
        type: ControlType.Number,
        title: "Side Dim",
        min: 0,
        max: 0.8,
        step: 0.01,
        defaultValue: 0.3,
    },
    dimColor: {
        type: ControlType.Color,
        title: "Dim Fill",
        defaultValue: "#101010",
    },

    backdrop: {
        type: ControlType.Boolean,
        title: "Backdrop",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    backdropBlur: {
        type: ControlType.Number,
        title: "Blur",
        min: 0,
        max: 140,
        step: 1,
        unit: "px",
        defaultValue: 44,
        hidden: (p: Props) => !p.backdrop,
    },
    backdropZoom: {
        type: ControlType.Number,
        title: "Zoom",
        min: 1,
        max: 2,
        step: 0.01,
        unit: "×",
        defaultValue: 1.25,
        hidden: (p: Props) => !p.backdrop,
    },
    fade: {
        type: ControlType.Number,
        title: "Backdrop Fade",
        min: 0.05,
        max: 2,
        step: 0.05,
        unit: "s",
        defaultValue: 0.7,
        hidden: (p: Props) => !p.backdrop,
    },
    tint: {
        type: ControlType.Color,
        title: "Tint",
        defaultValue: "rgba(20,20,20,0.16)",
    },
    canvasColor: {
        type: ControlType.Color,
        title: "Base Fill",
        defaultValue: "#b4b1ac",
    },
    edgeFade: {
        type: ControlType.Number,
        title: "Edge Fade",
        min: 0,
        max: 300,
        step: 2,
        unit: "px",
        defaultValue: 0,
    },

    rowAlign: {
        type: ControlType.Enum,
        title: "Row Place",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Middle", "Bottom"],
        displaySegmentedControl: true,
        defaultValue: "center",
    },
    rowShift: {
        type: ControlType.Number,
        title: "Row Nudge",
        min: -400,
        max: 400,
        step: 2,
        unit: "px",
        defaultValue: 0,
    },
    pad: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "40px",
    },
    compactBelow: {
        type: ControlType.Number,
        title: "Compact Below",
        min: 0,
        max: 1200,
        step: 10,
        unit: "px",
        defaultValue: 700,
    },
    compactScale: {
        type: ControlType.Number,
        title: "Compact Scale",
        min: 0.3,
        max: 1,
        step: 0.05,
        defaultValue: 0.7,
        hidden: (p: Props) => p.compactBelow <= 0,
    },
})
