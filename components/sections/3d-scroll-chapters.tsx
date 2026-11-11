import * as React from "react"
import {
    useCallback,
    useEffect,
    useLayoutEffect,
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

import { motion } from "framer-motion"

type Chapter = {
    name?: string
    kicker?: string
    headline?: string
    summary?: string
    photo?: any
    photoUrl?: string
    link?: string
}

const SEED: Chapter[] = [
    {
        name: "Valley",
        kicker: "Stage one · First light",
        headline: "Begin where the morning breaks",
        summary:
            "The route opens on the valley floor before sunrise, when the granite turns from slate to gold and the only sound is water moving somewhere below the trail.",
        photoUrl:
            "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1800&q=80",
    },
    {
        name: "Forest",
        kicker: "Stage two · Under canopy",
        headline: "Walk slower beneath the trees",
        summary:
            "Old growth closes overhead and the pace drops on its own. Light arrives in thin columns, the ground is soft with needles and every bend smells of rain.",
        photoUrl:
            "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1800&q=80",
    },
    {
        name: "Lake",
        kicker: "Stage three · Open water",
        headline: "Let the quiet carry you",
        summary:
            "By midday the path meets the lake. A wooden boat waits at the jetty, the far ridge doubles in the surface and there is nothing to do but drift.",
        photoUrl:
            "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1800&q=80",
    },
    {
        name: "Shore",
        kicker: "Stage four · Salt air",
        headline: "End with sand underfoot",
        summary:
            "The last miles fall toward the coast. Boots come off, the tide erases the day's footprints and the horizon takes over where the trail stops.",
        photoUrl:
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1800&q=80",
    },
]

const BASE = {
    chapters: SEED,
    drive: "wheel",
    wheelTravel: 260,
    autoplay: false,
    dwell: 5,
    pageSpan: 110,
    pinOffset: 0,
    tempo: 1.1,
    heading: "The long way round",
    subheading: "Four stages",
    reelLabel: "Reel",
    ctaLabel: "See the route",
    showHeader: true,
    showCounter: true,
    showReel: true,
    showTabs: true,
    inkColor: "#FFFFFF",
    veilColor: "#0A0A09",
    veilStrength: 1,
    backdrop: "#0E0E0D",
    titleSize: 96,
    summarySize: 16,
    labelSize: 13,
    edge: 48,
    corner: 0,
    stackBelow: 860,
}

/* ───────── pure value helpers (strings and numbers only) ───────── */

function withBase(props: any) {
    const out: any = { ...BASE }
    for (const k in props) if (props[k] !== undefined) out[k] = props[k]
    return out
}

function roster(raw: any): Chapter[] {
    return Array.isArray(raw) && raw.length ? raw : SEED
}

function srcFor(c: Chapter): string {
    const ph = c?.photo
    if (ph && typeof ph === "object" && ph.src) return ph.src
    if (typeof ph === "string" && ph) return ph
    return c?.photoUrl || ""
}

function two(n: number): string {
    return n < 10 ? "0" + n : String(n)
}

// size that follows the stage width (1440 reference), capped at the set px
function fit(px: number, floor = 0.52): string {
    return `max(${Math.round(px * floor)}px, min(${px}px, ${(px / 14.4).toFixed(3)}cqw))`
}

function face(font: any): Record<string, any> {
    if (!font || typeof font !== "object") return {}
    const copy: Record<string, any> = { ...font }
    delete copy.fontSize
    return copy
}

// thumbnails shrink with the stage height and the number of chapters
function thumbSize(stageH: number, count: number) {
    const room = stageH * 0.52 - 47 - 12 * (count - 1)
    const h = Math.max(28, Math.min(76, room / (count + 0.6)))
    return {
        sw: Math.round(h * 0.79),
        sh: Math.round(h),
        bw: Math.round(h * 1.26),
        bh: Math.round(h * 1.6),
    }
}

function edgePx(edge: number, stageW: number) {
    return Math.max(
        Math.round(edge * 0.5),
        Math.min(edge, (edge / 1440) * stageW)
    )
}

const OPEN = "inset(0% 0% 0% 0%)"
const GLIDE = [0.62, 0.02, 0.12, 1] as any

/* ───────── live-only hooks ───────── */

function useCalm() {
    const [calm, setCalm] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const q = window.matchMedia("(prefers-reduced-motion: reduce)")
        const read = () => setCalm(q.matches)
        read()
        q.addEventListener?.("change", read)
        return () => q.removeEventListener?.("change", read)
    }, [])
    return calm
}

// on-screen + tab-visible gate; `wake` is set by whichever effect needs frames
function useGate(target: React.RefObject<HTMLElement>) {
    const gate = useRef({ near: false, awake: true, wake: () => {} })
    useEffect(() => {
        const el = target.current
        if (!el) return
        let watcher: IntersectionObserver | null = null
        if (typeof IntersectionObserver === "undefined") {
            gate.current.near = true
            gate.current.wake()
        } else {
            watcher = new IntersectionObserver((entries) => {
                gate.current.near = entries[entries.length - 1].isIntersecting
                if (gate.current.near) gate.current.wake()
            })
            watcher.observe(el)
        }
        const onTab = () => {
            gate.current.awake = !document.hidden
            if (gate.current.awake) gate.current.wake()
        }
        onTab()
        document.addEventListener("visibilitychange", onTab)
        return () => {
            watcher?.disconnect()
            document.removeEventListener("visibilitychange", onTab)
        }
    }, [])
    return gate
}

/* ───────── live view ───────── */

function Reel(raw: any) {
    const p = withBase(raw)
    const list = roster(p.chapters)
    const n = list.length
    const calm = useCalm()
    const drive: "wheel" | "page" = p.drive === "page" ? "page" : "wheel"

    const shellRef = useRef<HTMLDivElement>(null)
    const deckRef = useRef<HTMLDivElement>(null)
    const fills = useRef<(HTMLDivElement | null)[]>([])
    const gate = useGate(shellRef)

    // one continuous position: whole part = chapter, fraction = tab fill
    const pos = useRef(0)
    const atRef = useRef(0)
    const touchedAt = useRef(-1e9)
    const hovering = useRef(false)
    const cfg = useRef<any>(p)
    cfg.current = { ...p, n }

    const [at, setAt] = useState(0)
    const [was, setWas] = useState(-1)
    const [heading, setHeading] = useState(1)
    const [box, setBox] = useState({ w: 700, h: 700 })

    const paint = useCallback(() => {
        const v = pos.current
        const whole = Math.floor(v)
        const els = fills.current
        for (let k = 0; k < els.length; k++) {
            const el = els[k]
            if (!el) continue
            const amt = k < whole ? 1 : k === whole ? v - whole : 0
            el.style.transform = `scaleX(${amt.toFixed(4)})`
        }
    }, [])

    const move = useCallback(
        (target: number, sense?: number) => {
            const total = cfg.current.n
            const v = Math.min(total - 0.0005, Math.max(0, target))
            pos.current = v
            paint()
            const whole = Math.floor(v)
            if (whole !== atRef.current) {
                const before = atRef.current
                atRef.current = whole
                setHeading(sense ?? (whole > before ? 1 : -1))
                setWas(before)
                setAt(whole)
            }
        },
        [paint]
    )

    useLayoutEffect(() => {
        paint()
    })

    useEffect(() => {
        if (atRef.current > n - 1) move(n - 1)
    }, [n, move])

    // stage size → compact layout + thumbnail sizes
    useEffect(() => {
        const deck = deckRef.current
        if (!deck || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            const r = entries[0]?.contentRect
            if (!r || !r.width) return
            const w = Math.round(r.width)
            const h = Math.round(r.height)
            setBox((b) => (b.w === w && b.h === h ? b : { w, h }))
        })
        ro.observe(deck)
        return () => ro.disconnect()
    }, [])

    // wheel drive — input events only, no loop
    useEffect(() => {
        if (drive !== "wheel") return
        const el = shellRef.current
        if (!el) return
        let coolUntil = 0
        let lastY = 0

        const atEdge = (sense: number) => {
            const v = pos.current
            return sense > 0 ? v >= cfg.current.n - 0.002 : v <= 0.0001
        }
        // returns true when a chapter boundary was crossed
        const nudge = (amount: number) => {
            const total = cfg.current.n
            const v = pos.current
            const whole = Math.floor(v)
            let next = v + Math.max(-0.45, Math.min(0.45, amount))
            let crossed = false
            if (next >= whole + 1) {
                if (whole + 1 <= total - 1) {
                    next = whole + 1
                    crossed = true
                } else next = total - 0.001
            } else if (next < whole) {
                if (whole - 1 >= 0) {
                    next = whole - 0.001
                    crossed = true
                } else next = 0
            }
            touchedAt.current = performance.now()
            move(next)
            return crossed
        }
        const rest = () => Math.max(260, (cfg.current.tempo ?? 1.1) * 880)

        const onWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
            const sense = e.deltaY > 0 ? 1 : -1
            const now = performance.now()
            if (now >= coolUntil && atEdge(sense)) return
            e.preventDefault()
            if (now < coolUntil) return
            const px =
                e.deltaMode === 1
                    ? e.deltaY * 32
                    : e.deltaMode === 2
                      ? e.deltaY * 600
                      : e.deltaY
            if (nudge(px / Math.max(60, cfg.current.wheelTravel ?? 260)))
                coolUntil = now + rest()
        }
        const onTouchStart = (e: TouchEvent) => {
            lastY = e.touches[0]?.clientY ?? 0
        }
        const onTouchMove = (e: TouchEvent) => {
            const y = e.touches[0]?.clientY ?? 0
            const dy = lastY - y
            lastY = y
            if (!dy) return
            const sense = dy > 0 ? 1 : -1
            const now = performance.now()
            if (now >= coolUntil && atEdge(sense)) return
            if (e.cancelable) e.preventDefault()
            if (now < coolUntil) return
            if (
                nudge(dy / Math.max(40, (cfg.current.wheelTravel ?? 260) * 0.7))
            )
                coolUntil = now + rest()
        }
        const onKey = (e: KeyboardEvent) => {
            const fwd = e.key === "ArrowDown" || e.key === "ArrowRight"
            const back = e.key === "ArrowUp" || e.key === "ArrowLeft"
            if (!fwd && !back) return
            const goal = atRef.current + (fwd ? 1 : -1)
            if (goal < 0 || goal > cfg.current.n - 1) return
            e.preventDefault()
            touchedAt.current = performance.now()
            move(goal)
        }

        el.addEventListener("wheel", onWheel, { passive: false })
        el.addEventListener("touchstart", onTouchStart, { passive: true })
        el.addEventListener("touchmove", onTouchMove, { passive: false })
        el.addEventListener("keydown", onKey)
        return () => {
            el.removeEventListener("wheel", onWheel)
            el.removeEventListener("touchstart", onTouchStart)
            el.removeEventListener("touchmove", onTouchMove)
            el.removeEventListener("keydown", onKey)
        }
    }, [drive, move])

    // autoplay — the only repeating loop; parked unless on screen and awake
    useEffect(() => {
        if (drive !== "wheel" || !p.autoplay || calm) return
        let frame = 0
        let stamp = 0
        const permitted = () => gate.current.near && gate.current.awake
        const tick = (t: number) => {
            frame = 0
            if (!permitted()) return
            const dt = stamp ? Math.min(80, t - stamp) : 0
            stamp = t
            if (!hovering.current && t - touchedAt.current > 2200) {
                const span = Math.max(1.5, cfg.current.dwell ?? 5) * 1000
                const next = pos.current + dt / span
                if (next >= cfg.current.n - 0.0005) move(0, 1)
                else move(next)
            }
            frame = requestAnimationFrame(tick)
        }
        const start = () => {
            if (frame || !permitted()) return
            stamp = 0
            frame = requestAnimationFrame(tick)
        }
        gate.current.wake = start
        start()
        return () => {
            if (frame) cancelAnimationFrame(frame)
            frame = 0
            gate.current.wake = () => {}
        }
    }, [drive, p.autoplay, calm, move])

    // page drive — sticky stage, one measurement frame per scroll event
    useEffect(() => {
        if (drive !== "page") return
        const shell = shellRef.current
        const deck = deckRef.current
        if (!shell || !deck) return
        let frame = 0
        let manual = false

        const gauge = () => {
            frame = 0
            if (!gate.current.near || !gate.current.awake) return
            const offset = Math.max(0, cfg.current.pinOffset ?? 0)
            const r = shell.getBoundingClientRect()
            const room = r.height - deck.offsetHeight
            const into = Math.min(
                Math.max(0, offset - r.top),
                Math.max(0, room)
            )
            if (!manual && room > 0) {
                // an ancestor with overflow/transform can break CSS sticky
                const seen = deck.getBoundingClientRect().top
                if (Math.abs(seen - (r.top + into)) > 2) {
                    manual = true
                    deck.style.position = "relative"
                    deck.style.top = "0px"
                }
            }
            if (manual) deck.style.transform = `translate3d(0, ${into}px, 0)`
            move(room > 0 ? (into / room) * cfg.current.n : 0)
        }
        const request = () => {
            if (frame || !gate.current.near || !gate.current.awake) return
            frame = requestAnimationFrame(gauge)
        }
        gate.current.wake = request
        request()
        window.addEventListener("scroll", request, {
            passive: true,
            capture: true,
        })
        window.addEventListener("resize", request, { passive: true })
        return () => {
            window.removeEventListener("scroll", request, {
                capture: true,
            } as any)
            window.removeEventListener("resize", request)
            if (frame) cancelAnimationFrame(frame)
            frame = 0
            gate.current.wake = () => {}
            deck.style.transform = ""
            deck.style.position = ""
            deck.style.top = ""
        }
    }, [drive, move])

    const jump = (i: number) => {
        touchedAt.current =
            typeof performance !== "undefined" ? performance.now() : 0
        if (drive === "wheel") {
            move(i)
            return
        }
        const shell = shellRef.current
        const deck = deckRef.current
        if (!shell || !deck) return
        const offset = Math.max(0, p.pinOffset ?? 0)
        const r = shell.getBoundingClientRect()
        const room = r.height - deck.offsetHeight
        const y = window.scrollY + r.top - offset + room * ((i + 0.03) / n)
        window.scrollTo({ top: y, behavior: calm ? "auto" : "smooth" })
    }

    /* ── derived look ── */
    const T = calm ? 0 : Math.max(0.2, p.tempo ?? 1.1)
    const ink = p.inkColor
    const tight = box.w < (p.stackBelow ?? 860)
    const pad = fit(p.edge ?? 48, 0.5)
    const th = thumbSize(box.h, n)
    const reelOn = p.showReel && n > 1
    // keep the caption clear of the reel when the stage is short
    const padPx = edgePx(p.edge ?? 48, box.w)
    const reelTop = padPx + Math.round(box.h * 0.085) + 22
    const reelEnd = reelTop + 26 + (n - 1) * (th.sh + 12) + th.bh + 12
    const dodge =
        reelOn && reelEnd > box.h - padPx - (tight ? 200 : 255) ? th.bw + 28 : 0
    const titleFace = face(p.titleFont)
    const textFace = face(p.textFont)
    const labelFace = face(p.labelFont)
    const labelPx = p.labelSize ?? 13
    const veilK = Math.max(0, Math.min(1.4, p.veilStrength ?? 1))
    const closedFrom =
        heading > 0 ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 100% 0%)"
    const driftFrom = heading > 0 ? "8%" : "-8%"
    const current = list[Math.min(at, n - 1)]

    return (
        <div
            ref={shellRef}
            tabIndex={drive === "wheel" ? 0 : undefined}
            onPointerEnter={() => (hovering.current = true)}
            onPointerLeave={() => (hovering.current = false)}
            style={{
                ...p.style,
                position: "relative",
                width: "100%",
                height:
                    drive === "wheel"
                        ? "100%"
                        : `${n * Math.max(40, p.pageSpan ?? 110)}vh`,
                outline: "none",
            }}
        >
            <div
                ref={deckRef}
                style={
                    {
                        position: drive === "wheel" ? "relative" : "sticky",
                        top:
                            drive === "wheel"
                                ? 0
                                : Math.max(0, p.pinOffset ?? 0),
                        width: "100%",
                        height:
                            drive === "wheel"
                                ? "100%"
                                : `calc(100vh - ${Math.max(0, p.pinOffset ?? 0)}px)`,
                        overflow: "hidden",
                        containerType: "size",
                        borderRadius: p.corner ?? 0,
                        background: p.backdrop,
                        color: ink,
                        fontFamily:
                            "'Inter Tight', 'Inter', system-ui, sans-serif",
                    } as any
                }
            >
                {/* photographs: the incoming one rises like a shutter, the old one sinks back and dims */}
                {list.map((c, i) => {
                    const role = i === at ? "live" : i === was ? "prev" : "idle"
                    const src = srcFor(c)
                    return (
                        <motion.div
                            key={i}
                            initial={false}
                            animate={{
                                clipPath:
                                    role === "live" ? [closedFrom, OPEN] : OPEN,
                            }}
                            transition={{
                                duration: role === "live" ? T : 0,
                                ease: GLIDE,
                            }}
                            style={{
                                position: "absolute",
                                inset: 0,
                                overflow: "hidden",
                                zIndex:
                                    role === "live"
                                        ? 3
                                        : role === "prev"
                                          ? 2
                                          : 1,
                            }}
                        >
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: role === "prev" ? 1 : 1.1,
                                    y:
                                        role === "live"
                                            ? [driftFrom, "0%"]
                                            : "0%",
                                }}
                                transition={{
                                    duration: role === "idle" ? 0 : T * 1.12,
                                    ease: GLIDE,
                                }}
                                style={{ position: "absolute", inset: 0 }}
                            >
                                {src ? (
                                    <img
                                        src={src}
                                        alt={c.headline || c.name || ""}
                                        draggable={false}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                ) : null}
                            </motion.div>
                            <motion.div
                                aria-hidden
                                initial={false}
                                animate={{
                                    opacity: role === "prev" ? 0.62 : 0,
                                }}
                                transition={{
                                    duration: role === "idle" ? 0 : T,
                                    ease: "linear",
                                }}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: p.veilColor,
                                }}
                            />
                        </motion.div>
                    )
                })}

                {/* legibility veil */}
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 4,
                        pointerEvents: "none",
                        opacity: Math.min(1, 0.44 * veilK),
                        background: `linear-gradient(180deg, ${p.veilColor} 0%, transparent 36%)`,
                    }}
                />
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 4,
                        pointerEvents: "none",
                        opacity: Math.min(1, 0.9 * veilK),
                        background: `linear-gradient(0deg, ${p.veilColor} 0%, transparent 72%)`,
                    }}
                />

                {/* thumbnail reel */}
                {reelOn && (
                    <div
                        style={{
                            position: "absolute",
                            zIndex: 6,
                            right: pad,
                            top: `calc(${pad} + ${Math.round(box.h * 0.085) + 22}px)`,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            gap: 12,
                        }}
                    >
                        {p.reelLabel ? (
                            <div
                                style={{
                                    fontSize: 11,
                                    letterSpacing: "0.16em",
                                    textTransform: "uppercase",
                                    opacity: 0.8,
                                    ...labelFace,
                                }}
                            >
                                {p.reelLabel}
                            </div>
                        ) : null}
                        {list.map((c, i) => {
                            const on = i === at
                            const src = srcFor(c)
                            return (
                                <motion.button
                                    key={i}
                                    type="button"
                                    aria-label={`Show ${c.name || "chapter " + (i + 1)}`}
                                    onClick={() => jump(i)}
                                    initial={false}
                                    animate={{
                                        width: on ? th.bw : th.sw,
                                        height: on ? th.bh : th.sh,
                                        opacity: on ? 1 : 0.55,
                                        marginTop: on ? 6 : 0,
                                        marginBottom: on ? 6 : 0,
                                        marginRight: on ? 6 : 0,
                                    }}
                                    whileHover={{ opacity: 1 }}
                                    transition={{
                                        duration: T * 0.75,
                                        ease: GLIDE,
                                    }}
                                    style={{
                                        position: "relative",
                                        padding: 0,
                                        border: "none",
                                        background: p.backdrop,
                                        color: "inherit",
                                        cursor: "pointer",
                                        flex: "none",
                                    }}
                                >
                                    {src ? (
                                        <img
                                            src={src}
                                            alt=""
                                            draggable={false}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block",
                                            }}
                                        />
                                    ) : null}
                                    <motion.span
                                        aria-hidden
                                        initial={false}
                                        animate={{
                                            opacity: on ? 1 : 0,
                                            scale: on ? 1 : 0.9,
                                        }}
                                        transition={{
                                            duration: T * 0.6,
                                            delay: on ? T * 0.3 : 0,
                                            ease: GLIDE,
                                        }}
                                        style={{
                                            position: "absolute",
                                            inset: -6,
                                            border: `1px solid ${ink}`,
                                            pointerEvents: "none",
                                        }}
                                    />
                                    <motion.span
                                        aria-hidden
                                        initial={false}
                                        animate={{ opacity: on ? 1 : 0 }}
                                        transition={{
                                            duration: T * 0.4,
                                            delay: on ? T * 0.4 : 0,
                                        }}
                                        style={{
                                            position: "absolute",
                                            left: 8,
                                            top: 6,
                                            fontSize: 11,
                                            fontWeight: 500,
                                            fontVariantNumeric: "tabular-nums",
                                            ...labelFace,
                                        }}
                                    >
                                        {two(i + 1)}
                                    </motion.span>
                                </motion.button>
                            )
                        })}
                    </div>
                )}

                {/* copy */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 5,
                        boxSizing: "border-box",
                        padding: pad,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 16,
                            fontSize: labelPx,
                            letterSpacing: "0.04em",
                            ...labelFace,
                        }}
                    >
                        {p.showHeader ? (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 14,
                                    minWidth: 0,
                                }}
                            >
                                <span
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: ink,
                                        flex: "none",
                                    }}
                                />
                                <span
                                    style={{
                                        fontWeight: 500,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {p.heading}
                                </span>
                                {p.subheading && !tight ? (
                                    <span
                                        style={{
                                            opacity: 0.78,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {p.subheading}
                                    </span>
                                ) : null}
                            </div>
                        ) : (
                            <span />
                        )}
                        {p.showCounter ? (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    fontVariantNumeric: "tabular-nums",
                                    perspective: 300,
                                }}
                            >
                                <span
                                    style={{
                                        display: "inline-grid",
                                        fontWeight: 600,
                                    }}
                                >
                                    {list.map((_, i) => (
                                        <motion.span
                                            key={i}
                                            initial={false}
                                            animate={{
                                                rotateX:
                                                    i === at
                                                        ? 0
                                                        : i < at
                                                          ? 85
                                                          : -85,
                                                opacity: i === at ? 1 : 0,
                                            }}
                                            transition={{
                                                duration: T * 0.55,
                                                delay: i === at ? T * 0.2 : 0,
                                                ease: GLIDE,
                                            }}
                                            style={{
                                                gridArea: "1 / 1",
                                                display: "inline-block",
                                                transformOrigin: "50% 50%",
                                            }}
                                            aria-hidden={i !== at}
                                        >
                                            {two(i + 1)}
                                        </motion.span>
                                    ))}
                                </span>
                                <span
                                    style={{
                                        width: 36,
                                        height: 1,
                                        background: ink,
                                        opacity: 0.7,
                                    }}
                                />
                                <span style={{ opacity: 0.78 }}>{two(n)}</span>
                            </div>
                        ) : null}
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: fit(40, 0.6),
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                flexDirection: tight ? "column" : "row",
                                justifyContent: "space-between",
                                alignItems: tight ? "stretch" : "flex-end",
                                gap: tight ? 18 : fit(64),
                            }}
                        >
                            {/* kicker + headline, one stacked block per chapter */}
                            <div
                                style={{
                                    display: "grid",
                                    flex: tight ? "none" : "1 1 0",
                                    minWidth: 0,
                                    maxWidth: tight ? "none" : "62cqw",
                                    paddingRight:
                                        tight && reelOn ? th.bw + 26 : 0,
                                }}
                            >
                                {list.map((c, i) => {
                                    const on = i === at
                                    const words = String(c.headline || "")
                                        .split(/\s+/)
                                        .filter(Boolean)
                                    return (
                                        <div
                                            key={i}
                                            aria-hidden={!on}
                                            style={{
                                                gridArea: "1 / 1",
                                                alignSelf: "end",
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: fit(22, 0.6),
                                            }}
                                        >
                                            {c.kicker ? (
                                                <motion.div
                                                    initial={false}
                                                    animate={{
                                                        opacity: on ? 0.88 : 0,
                                                        letterSpacing: on
                                                            ? "0.18em"
                                                            : "0.42em",
                                                    }}
                                                    transition={{
                                                        duration: on
                                                            ? T * 0.8
                                                            : T * 0.25,
                                                        delay: on ? T * 0.3 : 0,
                                                        ease: GLIDE,
                                                    }}
                                                    style={{
                                                        fontSize: Math.max(
                                                            10,
                                                            labelPx - 1
                                                        ),
                                                        textTransform:
                                                            "uppercase",
                                                        whiteSpace: "nowrap",
                                                        ...labelFace,
                                                    }}
                                                >
                                                    {c.kicker}
                                                </motion.div>
                                            ) : null}
                                            <div
                                                style={{
                                                    margin: 0,
                                                    fontSize: fit(
                                                        p.titleSize ?? 96
                                                    ),
                                                    fontWeight: 500,
                                                    lineHeight: 0.96,
                                                    letterSpacing: "-0.045em",
                                                    ...titleFace,
                                                }}
                                            >
                                                {words.map((w, k) => (
                                                    <React.Fragment key={k}>
                                                        <motion.span
                                                            initial={false}
                                                            animate={{
                                                                opacity: on
                                                                    ? 1
                                                                    : 0,
                                                                filter: on
                                                                    ? "blur(0px)"
                                                                    : "blur(14px)",
                                                                y: on
                                                                    ? "0em"
                                                                    : "0.28em",
                                                            }}
                                                            transition={{
                                                                duration: on
                                                                    ? T * 0.72
                                                                    : T * 0.26,
                                                                delay: on
                                                                    ? T * 0.34 +
                                                                      k * 0.07
                                                                    : 0,
                                                                ease: GLIDE,
                                                            }}
                                                            style={{
                                                                display:
                                                                    "inline-block",
                                                            }}
                                                        >
                                                            {w}
                                                        </motion.span>{" "}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* summary + link */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: tight ? 8 : 20,
                                    width: tight ? "auto" : fit(340, 0.7),
                                    flex: "none",
                                    paddingBottom: tight ? 0 : 8,
                                    marginRight: dodge,
                                }}
                            >
                                <div style={{ display: "grid" }}>
                                    {list.map((c, i) => {
                                        const on = i === at
                                        return (
                                            <motion.p
                                                key={i}
                                                aria-hidden={!on}
                                                initial={false}
                                                animate={{
                                                    opacity: on ? 0.9 : 0,
                                                    clipPath: on
                                                        ? OPEN
                                                        : "inset(0% 100% 0% 0%)",
                                                }}
                                                transition={{
                                                    opacity: {
                                                        duration: on
                                                            ? T * 0.5
                                                            : T * 0.22,
                                                        delay: on ? T * 0.5 : 0,
                                                    },
                                                    clipPath: {
                                                        duration: on
                                                            ? T * 0.85
                                                            : 0,
                                                        delay: on
                                                            ? T * 0.5
                                                            : T * 0.24,
                                                        ease: GLIDE,
                                                    },
                                                }}
                                                style={{
                                                    gridArea: "1 / 1",
                                                    alignSelf: "end",
                                                    margin: 0,
                                                    fontSize: fit(
                                                        p.summarySize ?? 16,
                                                        0.85
                                                    ),
                                                    lineHeight: 1.5,
                                                    ...textFace,
                                                }}
                                            >
                                                {c.summary}
                                            </motion.p>
                                        )
                                    })}
                                </div>
                                {p.ctaLabel ? (
                                    <motion.a
                                        href={current?.link || undefined}
                                        initial="rest"
                                        animate="rest"
                                        whileHover="lift"
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            alignSelf: "flex-start",
                                            gap: 10,
                                            minHeight: 44,
                                            color: ink,
                                            textDecoration: "none",
                                            fontSize: Math.max(12, labelPx + 1),
                                            fontWeight: 500,
                                            pointerEvents: "auto",
                                            cursor: current?.link
                                                ? "pointer"
                                                : "default",
                                            ...labelFace,
                                        }}
                                    >
                                        {p.ctaLabel}
                                        <motion.svg
                                            aria-hidden
                                            width="18"
                                            height="18"
                                            viewBox="0 0 18 18"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            variants={{
                                                rest: { x: 0 },
                                                lift: { x: 5 },
                                            }}
                                            transition={{
                                                duration: 0.35,
                                                ease: GLIDE,
                                            }}
                                        >
                                            <path d="M3 9h12M10 4l5 5-5 5" />
                                        </motion.svg>
                                    </motion.a>
                                ) : null}
                            </div>
                        </div>

                        {/* chapter tabs; the line of the current tab fills with scroll */}
                        {p.showTabs ? (
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
                                    gap: tight ? 10 : 20,
                                    pointerEvents: "auto",
                                }}
                            >
                                {list.map((c, i) => {
                                    const on = i === at
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => jump(i)}
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 14,
                                                padding: "0 0 4px",
                                                margin: 0,
                                                border: "none",
                                                background: "none",
                                                color: "inherit",
                                                font: "inherit",
                                                textAlign: "left",
                                                cursor: "pointer",
                                                minWidth: 0,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    position: "relative",
                                                    display: "block",
                                                    height: 2,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        position: "absolute",
                                                        inset: 0,
                                                        background: ink,
                                                        opacity: 0.28,
                                                    }}
                                                />
                                                <span
                                                    ref={(el) => {
                                                        fills.current[i] =
                                                            el as any
                                                    }}
                                                    style={{
                                                        position: "absolute",
                                                        inset: 0,
                                                        background: ink,
                                                        transformOrigin:
                                                            "0% 50%",
                                                        willChange: "transform",
                                                    }}
                                                />
                                            </span>
                                            <motion.span
                                                initial={false}
                                                animate={{
                                                    opacity: on ? 1 : 0.72,
                                                }}
                                                transition={{
                                                    duration: T * 0.5,
                                                }}
                                                style={{
                                                    display: "flex",
                                                    gap: tight ? 8 : 12,
                                                    fontSize: Math.max(
                                                        11,
                                                        labelPx +
                                                            (tight ? 0 : 2)
                                                    ),
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    ...labelFace,
                                                    fontWeight: on
                                                        ? 600
                                                        : (labelFace.fontWeight ??
                                                          400),
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontVariantNumeric:
                                                            "tabular-nums",
                                                    }}
                                                >
                                                    {two(i + 1)}
                                                </span>
                                                <span
                                                    style={{
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                    }}
                                                >
                                                    {c.name}
                                                </span>
                                            </motion.span>
                                        </button>
                                    )
                                })}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ───────── static view (canvas, thumbnails, export) ───────── */

function Still(raw: any) {
    const p = withBase(raw)
    const list = roster(p.chapters)
    const n = list.length
    const first = list[0]
    const ink = p.inkColor
    const pad = fit(p.edge ?? 48, 0.5)
    const labelPx = p.labelSize ?? 13
    const titleFace = face(p.titleFont)
    const textFace = face(p.textFont)
    const labelFace = face(p.labelFont)
    const veilK = Math.max(0, Math.min(1.4, p.veilStrength ?? 1))
    const hero = srcFor(first)
    const small = `clamp(28px, calc((52cqh - ${47 + 12 * (n - 1)}px) / ${n + 0.6}), 76px)`
    // huge when the stage is narrower than the stack width, negative otherwise
    const narrow = `calc((${p.stackBelow ?? 860}px - 100cqw) * 999)`

    return (
        <div
            style={
                {
                    ...p.style,
                    position: "relative",
                    width: "100%",
                    height: p.drive === "page" ? "100vh" : "100%",
                    overflow: "hidden",
                    containerType: "size",
                    borderRadius: p.corner ?? 0,
                    background: p.backdrop,
                    color: ink,
                    fontFamily: "'Inter Tight', 'Inter', system-ui, sans-serif",
                } as any
            }
        >
            {hero ? (
                <img
                    src={hero}
                    alt={first.headline || ""}
                    style={{
                        position: "absolute",
                        left: "-5%",
                        top: "-5%",
                        width: "110%",
                        height: "110%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            ) : null}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    opacity: Math.min(1, 0.44 * veilK),
                    background: `linear-gradient(180deg, ${p.veilColor} 0%, transparent 36%)`,
                }}
            />
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    opacity: Math.min(1, 0.9 * veilK),
                    background: `linear-gradient(0deg, ${p.veilColor} 0%, transparent 72%)`,
                }}
            />

            {p.showReel && n > 1 ? (
                <div
                    style={{
                        position: "absolute",
                        right: pad,
                        top: `calc(${pad} + 8.5cqh + 22px)`,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 12,
                    }}
                >
                    {p.reelLabel ? (
                        <div
                            style={{
                                fontSize: 11,
                                letterSpacing: "0.16em",
                                textTransform: "uppercase",
                                opacity: 0.8,
                                ...labelFace,
                            }}
                        >
                            {p.reelLabel}
                        </div>
                    ) : null}
                    {list.map((c, i) => {
                        const pic = srcFor(c)
                        const lead = i === 0
                        return (
                            <div
                                key={i}
                                style={{
                                    position: "relative",
                                    height: lead
                                        ? `calc(${small} * 1.6)`
                                        : small,
                                    aspectRatio: "0.79",
                                    margin: lead ? "6px 6px 6px 0" : 0,
                                    opacity: lead ? 1 : 0.55,
                                    background: p.backdrop,
                                }}
                            >
                                {pic ? (
                                    <img
                                        src={pic}
                                        alt=""
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                ) : null}
                                {lead ? (
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: -6,
                                            border: `1px solid ${ink}`,
                                        }}
                                    />
                                ) : null}
                                {lead ? (
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: 8,
                                            top: 6,
                                            fontSize: 11,
                                            fontWeight: 500,
                                            ...labelFace,
                                        }}
                                    >
                                        01
                                    </div>
                                ) : null}
                            </div>
                        )
                    })}
                </div>
            ) : null}

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    boxSizing: "border-box",
                    padding: pad,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 16,
                        fontSize: labelPx,
                        letterSpacing: "0.04em",
                        ...labelFace,
                    }}
                >
                    {p.showHeader ? (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 14,
                            }}
                        >
                            <div
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: ink,
                                }}
                            />
                            <div
                                style={{
                                    fontWeight: 500,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {p.heading}
                            </div>
                        </div>
                    ) : (
                        <div />
                    )}
                    {p.showCounter ? (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <div style={{ fontWeight: 600 }}>01</div>
                            <div
                                style={{
                                    width: 36,
                                    height: 1,
                                    background: ink,
                                    opacity: 0.7,
                                }}
                            />
                            <div style={{ opacity: 0.78 }}>{two(n)}</div>
                        </div>
                    ) : null}
                </div>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: fit(40, 0.6),
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            justifyContent: "space-between",
                            alignItems: "flex-end",
                            gap: 18,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: fit(22, 0.6),
                                flex: "1 1 0px",
                                flexBasis: `max(0px, ${narrow})`,
                                maxWidth: `max(62cqw, ${narrow})`,
                                minWidth: 0,
                                boxSizing: "border-box",
                                paddingRight:
                                    p.showReel && n > 1
                                        ? `clamp(0px, ${narrow}, calc(${small} * 2.02 + 26px))`
                                        : 0,
                            }}
                        >
                            {first.kicker ? (
                                <div
                                    style={{
                                        fontSize: Math.max(10, labelPx - 1),
                                        letterSpacing: "0.18em",
                                        textTransform: "uppercase",
                                        opacity: 0.88,
                                        ...labelFace,
                                    }}
                                >
                                    {first.kicker}
                                </div>
                            ) : null}
                            <div
                                style={{
                                    fontSize: fit(p.titleSize ?? 96),
                                    fontWeight: 500,
                                    lineHeight: 0.96,
                                    letterSpacing: "-0.045em",
                                    ...titleFace,
                                }}
                            >
                                {first.headline}
                            </div>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 12,
                                flex: "0 1 auto",
                                width: `min(100%, max(${fit(340, 0.7)}, ${narrow}))`,
                                paddingBottom: 8,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: fit(p.summarySize ?? 16, 0.85),
                                    lineHeight: 1.5,
                                    opacity: 0.9,
                                    ...textFace,
                                }}
                            >
                                {first.summary}
                            </div>
                            {p.ctaLabel ? (
                                <div
                                    style={{
                                        fontSize: Math.max(12, labelPx + 1),
                                        fontWeight: 500,
                                        ...labelFace,
                                    }}
                                >
                                    {p.ctaLabel} →
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {p.showTabs ? (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
                                gap: 14,
                            }}
                        >
                            {list.map((c, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 14,
                                        minWidth: 0,
                                    }}
                                >
                                    <div
                                        style={{
                                            height: 2,
                                            background: ink,
                                            opacity: i === 0 ? 1 : 0.28,
                                        }}
                                    />
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 10,
                                            fontSize: Math.max(11, labelPx),
                                            fontWeight: i === 0 ? 600 : 400,
                                            opacity: i === 0 ? 1 : 0.72,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            ...labelFace,
                                        }}
                                    >
                                        <div>{two(i + 1)}</div>
                                        <div
                                            style={{
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {c.name}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Ascender(props: any) {
    const frozen = useIsStaticRenderer()
    if (frozen) return <Still {...props} />
    return <Reel {...props} />
}

addPropertyControls(Ascender, {
    chapters: {
        type: ControlType.Array,
        title: "Chapters",
        maxCount: 8,
        defaultValue: SEED,
        control: {
            type: ControlType.Object,
            controls: {
                photo: { type: ControlType.ResponsiveImage, title: "Image" },
                photoUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    defaultValue: "",
                },
                name: {
                    type: ControlType.String,
                    title: "Tab Name",
                    defaultValue: "Stage",
                },
                headline: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "A new stage of the journey",
                },
                kicker: {
                    type: ControlType.String,
                    title: "Kicker",
                    defaultValue: "Stage · Subtitle",
                },
                summary: {
                    type: ControlType.String,
                    title: "Caption",
                    displayTextArea: true,
                    defaultValue:
                        "Two or three sentences that set the scene for this stage.",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
    },
    drive: {
        type: ControlType.Enum,
        title: "Driven By",
        options: ["wheel", "page"],
        optionTitles: ["Wheel", "Page Sticky"],
        displaySegmentedControl: true,
        defaultValue: BASE.drive,
    },
    wheelTravel: {
        type: ControlType.Number,
        title: "Wheel Travel",
        description: "Scroll distance needed to fill one tab.",
        min: 60,
        max: 1200,
        step: 20,
        unit: "px",
        defaultValue: BASE.wheelTravel,
        hidden: (p: any) => p.drive === "page",
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: BASE.autoplay,
        hidden: (p: any) => p.drive === "page",
    },
    dwell: {
        type: ControlType.Number,
        title: "Time / Chapter",
        min: 1.5,
        max: 20,
        step: 0.5,
        unit: "s",
        defaultValue: BASE.dwell,
        hidden: (p: any) => p.drive === "page" || !p.autoplay,
    },
    pageSpan: {
        type: ControlType.Number,
        title: "Scroll / Chapter",
        min: 40,
        max: 300,
        step: 5,
        unit: "vh",
        defaultValue: BASE.pageSpan,
        hidden: (p: any) => p.drive !== "page",
    },
    pinOffset: {
        type: ControlType.Number,
        title: "Pin Offset",
        min: 0,
        max: 300,
        unit: "px",
        defaultValue: BASE.pinOffset,
        hidden: (p: any) => p.drive !== "page",
    },
    tempo: {
        type: ControlType.Number,
        title: "Transition",
        min: 0.2,
        max: 3,
        step: 0.05,
        unit: "s",
        defaultValue: BASE.tempo,
    },
    showHeader: {
        type: ControlType.Boolean,
        title: "Header",
        defaultValue: BASE.showHeader,
    },
    heading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: BASE.heading,
        hidden: (p: any) => !p.showHeader,
    },
    subheading: {
        type: ControlType.String,
        title: "Subheading",
        defaultValue: BASE.subheading,
        hidden: (p: any) => !p.showHeader,
    },
    showCounter: {
        type: ControlType.Boolean,
        title: "Counter",
        defaultValue: BASE.showCounter,
    },
    showReel: {
        type: ControlType.Boolean,
        title: "Thumbnails",
        defaultValue: BASE.showReel,
    },
    reelLabel: {
        type: ControlType.String,
        title: "Reel Label",
        defaultValue: BASE.reelLabel,
        hidden: (p: any) => !p.showReel,
    },
    showTabs: {
        type: ControlType.Boolean,
        title: "Tabs",
        defaultValue: BASE.showTabs,
    },
    ctaLabel: {
        type: ControlType.String,
        title: "Button Text",
        defaultValue: BASE.ctaLabel,
    },
    inkColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: BASE.inkColor,
    },
    veilColor: {
        type: ControlType.Color,
        title: "Shade",
        defaultValue: BASE.veilColor,
    },
    veilStrength: {
        type: ControlType.Number,
        title: "Shade Amount",
        min: 0,
        max: 1.4,
        step: 0.05,
        defaultValue: BASE.veilStrength,
    },
    backdrop: {
        type: ControlType.Color,
        title: "Backdrop",
        defaultValue: BASE.backdrop,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            variant: "Medium",
            letterSpacing: "-0.045em",
            lineHeight: "0.96em",
        },
    },
    titleSize: {
        type: ControlType.Number,
        title: "Title Size",
        min: 24,
        max: 180,
        defaultValue: BASE.titleSize,
    },
    textFont: {
        type: ControlType.Font,
        title: "Caption Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { variant: "Regular", lineHeight: "1.5em" },
    },
    summarySize: {
        type: ControlType.Number,
        title: "Caption Size",
        min: 10,
        max: 32,
        defaultValue: BASE.summarySize,
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    labelSize: {
        type: ControlType.Number,
        title: "Label Size",
        min: 9,
        max: 22,
        defaultValue: BASE.labelSize,
    },
    edge: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 120,
        defaultValue: BASE.edge,
    },
    corner: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 80,
        defaultValue: BASE.corner,
    },
    stackBelow: {
        type: ControlType.Number,
        title: "Stack Below",
        min: 320,
        max: 1400,
        unit: "px",
        defaultValue: BASE.stackBelow,
    },
})
