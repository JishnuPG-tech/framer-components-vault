import * as React from "react"
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

import {
    motion,
    AnimatePresence,
    animate,
    useMotionValue,
    useTransform,
    MotionValue,
} from "framer-motion"

type Leaf = {
    image?: string
    imageUrl?: string
    title?: string
    link?: string
}

type Dial = {
    top: number
    reach: number
    cardWidth: number
    cardHeight: number
    spacing: number
    lift: number
    corner: number
}

type Tempo = {
    autoplay: boolean
    every: number
    spin: number
    bloom: number
}

type Finish = {
    grain: number
    vignette: number
    sideFade: number
    dimSides: number
    halo: boolean
    parallax: boolean
}

type Props = {
    leaves: Leaf[]
    dial: Dial
    tempo: Tempo
    finish: Finish
    titleFont: any
    labelFont: any
    ink: string
    ground: string
    wash: string
    washAmount: number
    showScale: boolean
    scaleColor: string
    showSteppers: boolean
    linkLabel: string
    edge: number
    newTab: boolean
}

const RAD = Math.PI / 180
const SWEEP: [number, number, number, number] = [0.65, 0, 0.35, 1]
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]
const GRAIN =
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23g)'/></svg>\")"

const srcFor = (l: Leaf) => l.image || l.imageUrl || ""
const rows = (t?: string) => (t || "").split("\n").filter((r) => r.length)
const two = (v: number) => String(v).padStart(2, "0")
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const fold = (deg: number, span: number) =>
    ((((deg + span / 2) % span) + span) % span) - span / 2
const along = (theta: number, reach: number) => ({
    dx: reach * Math.sin(theta * RAD),
    dy: reach - reach * Math.cos(theta * RAD),
})
const dialShape = (d: Dial) => {
    const w = Math.max(24, d.cardWidth)
    const h = Math.max(24, d.cardHeight)
    const reach = Math.max(80, d.reach)
    const step = Math.max(2, d.spacing)
    const ringR = Math.max(20, reach - h / 2 - 24)
    return { w, h, reach, step, ringR }
}
const tickSet = (step: number) => {
    const fine = step / 4
    const count = Math.min(900, Math.floor(360 / fine))
    return Array.from({ length: count }, (_, k) => ({
        deg: k * fine,
        major: k % 4 === 0,
    }))
}
const edgeFade = (t: number, span: number, step: number, n: number) =>
    n < 3 ? 1 : clamp01((span / 2 - Math.abs(t)) / (step * 0.9))
const sideShade = (t: number, step: number, dim: number) =>
    clamp01(Math.abs(t) / (step * 4)) * (dim / 100)
const drift = (t: number, step: number, w: number) =>
    Math.max(-w * 0.14, Math.min(w * 0.14, (-t / (step * 3)) * w * 0.14))
const sideMask = (fade: number) =>
    fade > 0
        ? `linear-gradient(90deg, transparent 0%, #000 ${fade}%, #000 ${100 - fade}%, transparent 100%)`
        : "none"
const vignetteBg = (wash: string) =>
    `radial-gradient(ellipse 75% 70% at 50% 45%, transparent 40%, ${wash} 100%)`
const washBg = (wash: string) =>
    `linear-gradient(180deg, ${wash} 0%, transparent 40%, transparent 60%, ${wash} 100%)`

/* ───────────────────────── live hooks ───────────────────────── */

function useSeen(ref: React.RefObject<HTMLElement>) {
    const [seen, setSeen] = useState(false)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            setSeen(true)
            return
        }
        const io = new IntersectionObserver(
            ([entry]) => setSeen(!!entry && entry.isIntersecting),
            { threshold: 0.1 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])
    return seen
}

function usePageShown() {
    const [shown, setShown] = useState(
        typeof document === "undefined"
            ? true
            : document.visibilityState !== "hidden"
    )
    useEffect(() => {
        if (typeof document === "undefined") return
        const on = () => setShown(document.visibilityState !== "hidden")
        document.addEventListener("visibilitychange", on)
        return () => document.removeEventListener("visibilitychange", on)
    }, [])
    return shown
}

function usePrefersStill() {
    const [still, setStill] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const q = window.matchMedia("(prefers-reduced-motion: reduce)")
        const on = () => setStill(q.matches)
        on()
        q.addEventListener?.("change", on)
        return () => q.removeEventListener?.("change", on)
    }, [])
    return still
}

function useMeasure(ref: React.RefObject<HTMLElement>) {
    const [size, setSize] = useState({ w: 700, h: 700 })
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const take = () => {
            const w = el.clientWidth || 700
            const h = el.clientHeight || 700
            setSize((s) => (s.w === w && s.h === h ? s : { w, h }))
        }
        take()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(take)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    return size
}

function useWarmImages(srcs: string[], go: boolean) {
    const key = srcs.join("|")
    useEffect(() => {
        if (!go || typeof Image === "undefined") return
        srcs.forEach((s) => {
            if (!s) return
            const im = new Image()
            im.decoding = "async"
            im.src = s
        })
    }, [key, go])
}

/* ───────────────────────── live dial card ───────────────────────── */

function Spoke(props: {
    turn: MotionValue<number>
    index: number
    total: number
    step: number
    reach: number
    w: number
    h: number
    top: number
    lift: number
    corner: number
    chosen: boolean
    awake: boolean
    order: number
    still: boolean
    leaf: Leaf
    finish: Finish
    labelStyle: React.CSSProperties
    linkLabel: string
    onPick: () => void
}) {
    const {
        turn,
        index,
        total,
        step,
        reach,
        w,
        h,
        top,
        lift,
        corner,
        chosen,
        finish,
    } = props
    const span = total * step
    const theta = useTransform(turn, (v) => fold(index * step + v, span))
    const x = useTransform(theta, (t) => along(t, reach).dx - w / 2)
    const y = useTransform(theta, (t) => along(t, reach).dy - h / 2)
    const fade = useTransform(theta, (t) => edgeFade(t, span, step, total))
    const shade = useTransform(theta, (t) =>
        sideShade(t, step, finish.dimSides)
    )
    const shift = useTransform(theta, (t) =>
        finish.parallax ? drift(t, step, w) : 0
    )
    const [over, setOver] = useState(false)
    const src = srcFor(props.leaf)
    const hasLink = !!props.leaf.link

    return (
        <motion.div
            style={{
                position: "absolute",
                left: "50%",
                top: `${top}%`,
                width: w,
                height: h,
                x,
                y,
                rotate: theta,
                opacity: fade,
                zIndex: chosen ? 3 : 1,
                pointerEvents: "auto",
            }}
        >
            {finish.halo && src && (
                <motion.img
                    src={src}
                    alt=""
                    draggable={false}
                    initial={false}
                    animate={{
                        opacity: chosen ? 0.55 : 0,
                        scale: chosen ? lift * 1.08 : 0.9,
                    }}
                    transition={{
                        duration: props.still ? 0 : 0.9,
                        ease: EASE_OUT,
                    }}
                    style={{
                        position: "absolute",
                        inset: "6%",
                        width: "88%",
                        height: "88%",
                        objectFit: "cover",
                        filter: "blur(26px) saturate(1.3)",
                        pointerEvents: "none",
                        y: 18,
                    }}
                />
            )}
            <motion.div
                role="button"
                aria-label={
                    rows(props.leaf.title).join(" ") || `Item ${index + 1}`
                }
                aria-current={chosen ? "true" : undefined}
                onClick={props.onPick}
                onMouseEnter={() => setOver(true)}
                onMouseLeave={() => setOver(false)}
                initial={false}
                animate={{
                    scale: chosen ? lift : over && !props.still ? 1.06 : 1,
                    opacity: props.awake ? 1 : 0,
                    y: props.awake
                        ? over && !chosen && !props.still
                            ? -8
                            : 0
                        : 56,
                }}
                transition={
                    props.still
                        ? { duration: 0 }
                        : {
                              scale: {
                                  type: "spring",
                                  stiffness: 210,
                                  damping: 26,
                                  mass: 0.9,
                              },
                              opacity: { duration: 0.8, ease: EASE_OUT },
                              y: {
                                  type: "spring",
                                  stiffness: 160,
                                  damping: 22,
                              },
                          }
                }
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: corner,
                    overflow: "hidden",
                    cursor: chosen
                        ? hasLink
                            ? "pointer"
                            : "default"
                        : "pointer",
                    background: "rgba(0,0,0,0.3)",
                    boxShadow: chosen
                        ? "0 30px 70px -22px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.14)"
                        : "0 14px 34px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
                    transition: "box-shadow 0.6s ease",
                }}
            >
                {src && (
                    <motion.img
                        src={src}
                        alt=""
                        draggable={false}
                        decoding="async"
                        style={{
                            position: "absolute",
                            top: 0,
                            left: "-15%",
                            width: "130%",
                            height: "100%",
                            objectFit: "cover",
                            pointerEvents: "none",
                            x: shift,
                        }}
                    />
                )}
                <motion.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "#000",
                        opacity: shade,
                        pointerEvents: "none",
                    }}
                />
                <motion.div
                    initial={false}
                    animate={{ opacity: chosen ? 0 : over ? 1 : 0.8 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        ...props.labelStyle,
                        position: "absolute",
                        top: 7,
                        left: 8,
                        textShadow: "0 1px 8px rgba(0,0,0,0.55)",
                    }}
                >
                    {two(index + 1)}
                </motion.div>
                {hasLink && (
                    <motion.div
                        initial={false}
                        animate={{
                            opacity: chosen ? 1 : 0,
                            y: chosen ? 0 : 10,
                        }}
                        transition={{
                            duration: props.still ? 0 : 0.5,
                            ease: EASE_OUT,
                            delay: chosen ? 0.35 : 0,
                        }}
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            padding: "18px 8px 8px",
                            background:
                                "linear-gradient(180deg, transparent, rgba(0,0,0,0.55))",
                            display: "flex",
                            justifyContent: "center",
                            pointerEvents: "none",
                        }}
                    >
                        <span style={{ ...props.labelStyle, fontSize: 8 }}>
                            {props.linkLabel} ↗
                        </span>
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    )
}

/* ───────────────────────── live view ───────────────────────── */

function VolvelleLive(p: Props) {
    const leaves = (p.leaves || []).filter(Boolean)
    const n = leaves.length
    const hostRef = useRef<HTMLDivElement>(null)
    const size = useMeasure(hostRef)
    const seen = useSeen(hostRef)
    const shown = usePageShown()
    const still = usePrefersStill()
    useWarmImages(leaves.map(srcFor), seen)

    const { w, h, reach, step, ringR } = dialShape(p.dial)
    const span = Math.max(1, n) * step
    const turn = useMotionValue(0)

    const [pick, setPick] = useState(0)
    const pickRef = useRef(0)
    const [pours, setPours] = useState([{ id: 0, at: 0, live: false }])
    const pourSeq = useRef(1)
    const [resting, setResting] = useState(false)
    const grab = useRef<{
        x: number
        base: number
        pulling: boolean
        id: number
        lastX: number
        lastT: number
        v: number
    } | null>(null)
    const dragged = useRef(false)
    const wheelAt = useRef(0)

    const a = n ? ((pick % n) + n) % n : 0
    const degPerPx = step / (w + 34)

    const nearestTurn = (idx: number) => {
        const goal = -idx * step
        const k = Math.round((turn.get() - goal) / span)
        return goal + k * span
    }
    const glideTo = (idx: number, soft = false) => {
        const target = nearestTurn(idx)
        if (still) turn.set(target)
        else if (soft)
            animate(turn, target, {
                type: "spring",
                stiffness: 90,
                damping: 20,
                mass: 1,
            })
        else
            animate(turn, target, {
                duration: Math.max(0.2, p.tempo.spin),
                ease: SWEEP,
            })
    }
    const choose = (target: number, soft = false) => {
        if (!n) return
        const next = ((target % n) + n) % n
        if (next === pickRef.current) {
            glideTo(next, soft)
            return
        }
        pickRef.current = next
        setPick(next)
        glideTo(next, soft)
        setPours((s) => [
            ...s.slice(-2),
            { id: pourSeq.current++, at: next, live: true },
        ])
    }

    const ticking =
        p.tempo.autoplay && seen && shown && !still && !resting && n > 1
    const every = Math.max(1.5, p.tempo.every)

    useEffect(() => {
        if (!ticking) return
        const t = window.setTimeout(
            () => choose(pickRef.current + 1),
            every * 1000
        )
        return () => window.clearTimeout(t)
    }, [ticking, every, pick])

    if (!n)
        return (
            <div
                style={{ width: "100%", height: "100%", background: p.ground }}
            />
        )

    const leaf = leaves[a]
    const ox = size.w / 2
    const oy = (size.h * p.dial.top) / 100
    const far =
        Math.hypot(Math.max(ox, size.w - ox), Math.max(oy, size.h - oy)) + 6
    const lift = Math.max(1, p.dial.lift)
    const seed = (Math.min(w, h) * lift) / 2
    const spinT = Math.max(0.2, p.tempo.spin)
    const bloomT = Math.max(0.2, p.tempo.bloom)
    const bloomDelay = spinT * 0.5
    const label: React.CSSProperties = {
        ...p.labelFont,
        color: p.ink,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
    }
    const ticks = p.showScale ? tickSet(step) : []
    const notchTop = `calc(${p.dial.top}% + ${reach - ringR}px)`

    return (
        <div
            ref={hostRef}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label={rows(leaf.title).join(" ")}
            onKeyDown={(e) => {
                if (e.key === "ArrowRight") choose(pickRef.current + 1)
                if (e.key === "ArrowLeft") choose(pickRef.current - 1)
            }}
            onWheel={(e) => {
                if (
                    Math.abs(e.deltaX) < 8 ||
                    Math.abs(e.deltaX) < Math.abs(e.deltaY)
                )
                    return
                const now = Date.now()
                if (now - wheelAt.current < 520) return
                wheelAt.current = now
                choose(pickRef.current + (e.deltaX > 0 ? 1 : -1))
            }}
            onMouseEnter={() => setResting(true)}
            onMouseLeave={() => setResting(false)}
            onPointerDown={(e) => {
                const now = performance.now()
                grab.current = {
                    x: e.clientX,
                    base: turn.get(),
                    pulling: false,
                    id: e.pointerId,
                    lastX: e.clientX,
                    lastT: now,
                    v: 0,
                }
                dragged.current = false
                turn.stop()
            }}
            onPointerMove={(e) => {
                const g = grab.current
                if (!g) return
                const dx = e.clientX - g.x
                if (!g.pulling && Math.abs(dx) > 6) {
                    g.pulling = true
                    dragged.current = true
                    try {
                        hostRef.current?.setPointerCapture(g.id)
                    } catch {}
                }
                if (!g.pulling) return
                const now = performance.now()
                const dt = Math.max(1, now - g.lastT)
                g.v = g.v * 0.6 + ((e.clientX - g.lastX) / dt) * 0.4
                g.lastX = e.clientX
                g.lastT = now
                turn.set(g.base + dx * degPerPx)
            }}
            onPointerUp={() => {
                const g = grab.current
                grab.current = null
                if (!g || !g.pulling) return
                const thrown = turn.get() + g.v * 220 * degPerPx
                choose(Math.round(-thrown / step), true)
                window.setTimeout(() => (dragged.current = false), 0)
            }}
            onPointerCancel={() => {
                grab.current = null
                glideTo(pickRef.current, true)
            }}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: p.ground,
                outline: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
                touchAction: "pan-y",
                cursor: "grab",
            }}
        >
            {/* blooming backdrops */}
            {pours.map((po) => {
                const src = srcFor(leaves[po.at % n] || {})
                const play = po.live && !still
                return (
                    <motion.div
                        key={po.id}
                        initial={
                            play
                                ? {
                                      clipPath: `circle(${seed}px at ${ox}px ${oy}px)`,
                                  }
                                : false
                        }
                        animate={{
                            clipPath: play
                                ? `circle(${far}px at ${ox}px ${oy}px)`
                                : "none",
                        }}
                        transition={
                            play
                                ? {
                                      duration: bloomT,
                                      ease: SWEEP,
                                      delay: bloomDelay,
                                  }
                                : { duration: 0 }
                        }
                        onAnimationComplete={() => {
                            if (!po.live) return
                            setPours((s) =>
                                s[s.length - 1].id === po.id
                                    ? [{ ...po, live: false }]
                                    : s
                            )
                        }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: p.ground,
                            }}
                        />
                        {src && (
                            <motion.img
                                src={src}
                                alt=""
                                draggable={false}
                                decoding="async"
                                initial={
                                    play
                                        ? {
                                              scale: 1.28,
                                              rotate: -5,
                                              filter: "blur(10px)",
                                          }
                                        : false
                                }
                                animate={{
                                    scale: 1.02,
                                    rotate: 0,
                                    filter: "blur(0px)",
                                }}
                                transition={{
                                    duration: bloomT * 1.5,
                                    ease: EASE_OUT,
                                    delay: bloomDelay,
                                }}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    pointerEvents: "none",
                                    transformOrigin: `50% ${p.dial.top}%`,
                                }}
                            />
                        )}
                    </motion.div>
                )
            })}

            {/* expanding rim that rides the bloom edge */}
            <svg
                width="100%"
                height="100%"
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                    pointerEvents: "none",
                    overflow: "visible",
                }}
            >
                {!still &&
                    pours
                        .filter((po) => po.live)
                        .map((po) => (
                            <motion.circle
                                key={`rim${po.id}`}
                                cx={ox}
                                cy={oy}
                                fill="none"
                                stroke={p.ink}
                                initial={{
                                    r: seed,
                                    opacity: 0,
                                    strokeWidth: 1.5,
                                }}
                                animate={{
                                    r: far,
                                    opacity: [0, 0.7, 0],
                                    strokeWidth: 0.5,
                                }}
                                transition={{
                                    duration: bloomT,
                                    ease: SWEEP,
                                    delay: bloomDelay,
                                }}
                            />
                        ))}
            </svg>

            {/* finish layers */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: washBg(p.wash),
                    opacity: p.washAmount / 100,
                    pointerEvents: "none",
                    zIndex: 1,
                }}
            />
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: vignetteBg(p.wash),
                    opacity: p.finish.vignette / 100,
                    pointerEvents: "none",
                    zIndex: 1,
                }}
            />

            {/* title + details */}
            <div
                style={{
                    position: "absolute",
                    left: p.edge,
                    right: p.edge,
                    top: p.edge,
                    textAlign: "left",
                    zIndex: 4,
                    pointerEvents: "none",
                }}
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div key={`t${a}`}>
                        <h2 style={{ ...p.titleFont, color: p.ink, margin: 0 }}>
                            {rows(leaf.title).map((r, ri) => (
                                <span
                                    key={ri}
                                    style={{
                                        display: "block",
                                        overflow: "hidden",
                                        padding: "0 0.06em 0.1em 0",
                                    }}
                                >
                                    {Array.from(r).map((ch, ci) => (
                                        <motion.span
                                            key={ci}
                                            initial={
                                                still
                                                    ? false
                                                    : {
                                                          y: "105%",
                                                          opacity: 0,
                                                          filter: "blur(8px)",
                                                      }
                                            }
                                            animate={{
                                                y: "0%",
                                                opacity: 1,
                                                filter: "blur(0px)",
                                            }}
                                            exit={
                                                still
                                                    ? { opacity: 0 }
                                                    : {
                                                          y: "-60%",
                                                          opacity: 0,
                                                          filter: "blur(6px)",
                                                      }
                                            }
                                            transition={{
                                                duration: still ? 0 : 0.7,
                                                ease: EASE_OUT,
                                                delay: still
                                                    ? 0
                                                    : bloomDelay * 0.6 +
                                                      ri * 0.09 +
                                                      ci * 0.022,
                                            }}
                                            style={{
                                                display: "inline-block",
                                                whiteSpace: "pre",
                                            }}
                                        >
                                            {ch}
                                        </motion.span>
                                    ))}
                                </span>
                            ))}
                        </h2>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* dial scale */}
            {p.showScale && (
                <>
                    <motion.svg
                        width={ringR * 2}
                        height={ringR * 2}
                        viewBox={`${-ringR} ${-ringR} ${ringR * 2} ${ringR * 2}`}
                        style={{
                            position: "absolute",
                            left: `calc(50% - ${ringR}px)`,
                            top: `calc(${p.dial.top}% + ${reach - ringR}px)`,
                            rotate: turn,
                            zIndex: 2,
                            pointerEvents: "none",
                            overflow: "visible",
                        }}
                    >
                        <circle
                            r={ringR}
                            fill="none"
                            stroke={p.scaleColor}
                            strokeWidth={1}
                        />
                        <circle
                            r={ringR - 18}
                            fill="none"
                            stroke={p.scaleColor}
                            strokeWidth={1}
                            strokeDasharray="1 5"
                            opacity={0.6}
                        />
                        {ticks.map((t, k) => {
                            const len = t.major ? 12 : 5
                            const s = Math.sin(t.deg * RAD)
                            const c = -Math.cos(t.deg * RAD)
                            return (
                                <line
                                    key={k}
                                    x1={s * ringR}
                                    y1={c * ringR}
                                    x2={s * (ringR - len)}
                                    y2={c * (ringR - len)}
                                    stroke={p.scaleColor}
                                    strokeWidth={t.major ? 1.2 : 0.8}
                                />
                            )
                        })}
                    </motion.svg>
                    <svg
                        width={28}
                        height={28}
                        viewBox="-14 -14 28 28"
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: notchTop,
                            marginLeft: -14,
                            marginTop: -14,
                            zIndex: 2,
                            pointerEvents: "none",
                            overflow: "visible",
                        }}
                    >
                        <circle
                            r={10}
                            fill="none"
                            stroke={p.ink}
                            strokeOpacity={0.18}
                            strokeWidth={1}
                        />
                        {ticking && (
                            <motion.circle
                                key={`tick${a}`}
                                r={10}
                                fill="none"
                                stroke={p.ink}
                                strokeWidth={1.4}
                                strokeLinecap="round"
                                transform="rotate(-90)"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: every, ease: "linear" }}
                            />
                        )}
                        <circle r={3} fill={p.ink} />
                    </svg>
                </>
            )}

            {/* dial cards */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 3,
                    pointerEvents: "none",
                    WebkitMaskImage: sideMask(p.finish.sideFade),
                    maskImage: sideMask(p.finish.sideFade),
                }}
            >
                {leaves.map((lf, i) => (
                    <Spoke
                        key={i}
                        turn={turn}
                        index={i}
                        total={n}
                        step={step}
                        reach={reach}
                        w={w}
                        h={h}
                        top={p.dial.top}
                        lift={lift}
                        corner={p.dial.corner}
                        chosen={i === a}
                        awake
                        order={Math.abs(fold((i - a) * step, span)) / step}
                        still={still}
                        leaf={lf}
                        finish={p.finish}
                        labelStyle={label}
                        linkLabel={p.linkLabel}
                        onPick={() => {
                            if (dragged.current) return
                            if (i === a) {
                                if (lf.link && typeof window !== "undefined")
                                    window.open(
                                        lf.link,
                                        p.newTab ? "_blank" : "_self",
                                        "noopener"
                                    )
                            } else choose(i)
                        }}
                    />
                ))}
            </div>

            {/* grain */}
            {p.finish.grain > 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: GRAIN,
                        backgroundSize: "180px 180px",
                        opacity: p.finish.grain / 100,
                        mixBlendMode: "overlay",
                        pointerEvents: "none",
                        zIndex: 6,
                    }}
                />
            )}

            {/* steppers */}
            {p.showSteppers && (
                <div
                    style={{
                        position: "absolute",
                        left: p.edge,
                        right: p.edge,
                        bottom: p.edge,
                        display: "flex",
                        justifyContent: "space-between",
                        zIndex: 7,
                        pointerEvents: "none",
                    }}
                >
                    {[-1, 1].map((d) => (
                        <motion.button
                            key={d}
                            type="button"
                            aria-label={d < 0 ? "Previous" : "Next"}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => choose(pickRef.current + d)}
                            initial={false}
                            whileHover={
                                still
                                    ? undefined
                                    : {
                                          scale: 1.08,
                                          backgroundColor:
                                              "rgba(255,255,255,0.16)",
                                      }
                            }
                            whileTap={still ? undefined : { scale: 0.94 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 22,
                            }}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 40,
                                border: "1px solid rgba(255,255,255,0.28)",
                                background: "rgba(255,255,255,0.04)",
                                color: p.ink,
                                display: "grid",
                                placeItems: "center",
                                cursor: "pointer",
                                padding: 0,
                                pointerEvents: "auto",
                            }}
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 14 14"
                                fill="none"
                            >
                                <path
                                    d={
                                        d < 0
                                            ? "M8.5 2.5 4 7l4.5 4.5"
                                            : "M5.5 2.5 10 7l-4.5 4.5"
                                    }
                                    stroke="currentColor"
                                    strokeWidth="1.3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </motion.button>
                    ))}
                </div>
            )}
        </div>
    )
}

/* ───────────────────────── static view ───────────────────────── */

function VolvelleStill(p: Props) {
    const leaves = (p.leaves || []).filter(Boolean)
    const n = leaves.length
    if (!n)
        return (
            <div
                style={{ width: "100%", height: "100%", background: p.ground }}
            />
        )
    const leaf = leaves[0]
    const { w, h, reach, step, ringR } = dialShape(p.dial)
    const span = n * step
    const lift = Math.max(1, p.dial.lift)
    const label: React.CSSProperties = {
        ...p.labelFont,
        color: p.ink,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
    }
    const bg = srcFor(leaf)
    const ticks = p.showScale ? tickSet(step) : []
    const notchTop = `calc(${p.dial.top}% + ${reach - ringR}px)`

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: p.ground,
            }}
        >
            {bg && (
                <img
                    src={bg}
                    alt=""
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transform: "scale(1.02)",
                    }}
                />
            )}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: washBg(p.wash),
                    opacity: p.washAmount / 100,
                    zIndex: 1,
                }}
            />
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: vignetteBg(p.wash),
                    opacity: p.finish.vignette / 100,
                    zIndex: 1,
                }}
            />
            <div
                style={{
                    position: "absolute",
                    left: p.edge,
                    right: p.edge,
                    top: p.edge,
                    textAlign: "left",
                    zIndex: 4,
                }}
            >
                <h2 style={{ ...p.titleFont, color: p.ink, margin: 0 }}>
                    {rows(leaf.title).map((r, ri) => (
                        <span
                            key={ri}
                            style={{
                                display: "block",
                                padding: "0 0.06em 0.1em 0",
                            }}
                        >
                            {r}
                        </span>
                    ))}
                </h2>
            </div>
            {p.showScale && (
                <>
                    <svg
                        width={ringR * 2}
                        height={ringR * 2}
                        viewBox={`${-ringR} ${-ringR} ${ringR * 2} ${ringR * 2}`}
                        style={{
                            position: "absolute",
                            left: `calc(50% - ${ringR}px)`,
                            top: `calc(${p.dial.top}% + ${reach - ringR}px)`,
                            zIndex: 2,
                            overflow: "visible",
                        }}
                    >
                        <circle
                            r={ringR}
                            fill="none"
                            stroke={p.scaleColor}
                            strokeWidth={1}
                        />
                        <circle
                            r={ringR - 18}
                            fill="none"
                            stroke={p.scaleColor}
                            strokeWidth={1}
                            strokeDasharray="1 5"
                            opacity={0.6}
                        />
                        {ticks.map((t, k) => {
                            const len = t.major ? 12 : 5
                            const s = Math.sin(t.deg * RAD)
                            const c = -Math.cos(t.deg * RAD)
                            return (
                                <line
                                    key={k}
                                    x1={s * ringR}
                                    y1={c * ringR}
                                    x2={s * (ringR - len)}
                                    y2={c * (ringR - len)}
                                    stroke={p.scaleColor}
                                    strokeWidth={t.major ? 1.2 : 0.8}
                                />
                            )
                        })}
                    </svg>
                    <svg
                        width={28}
                        height={28}
                        viewBox="-14 -14 28 28"
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: notchTop,
                            marginLeft: -14,
                            marginTop: -14,
                            zIndex: 2,
                            overflow: "visible",
                        }}
                    >
                        <circle
                            r={10}
                            fill="none"
                            stroke={p.ink}
                            strokeOpacity={0.18}
                            strokeWidth={1}
                        />
                        <circle r={3} fill={p.ink} />
                    </svg>
                </>
            )}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 3,
                    WebkitMaskImage: sideMask(p.finish.sideFade),
                    maskImage: sideMask(p.finish.sideFade),
                }}
            >
                {leaves.map((lf, i) => {
                    const theta = fold(i * step, span)
                    const { dx, dy } = along(theta, reach)
                    const chosen = i === 0
                    const src = srcFor(lf)
                    const shift = p.finish.parallax ? drift(theta, step, w) : 0
                    return (
                        <div
                            key={i}
                            style={{
                                position: "absolute",
                                left: `calc(50% + ${dx - w / 2}px)`,
                                top: `calc(${p.dial.top}% + ${dy - h / 2}px)`,
                                width: w,
                                height: h,
                                transform: `rotate(${theta}deg) scale(${chosen ? lift : 1})`,
                                opacity: edgeFade(theta, span, step, n),
                                zIndex: chosen ? 3 : 1,
                                borderRadius: p.dial.corner,
                                overflow: "hidden",
                                background: "rgba(0,0,0,0.3)",
                                boxShadow: chosen
                                    ? "0 30px 70px -22px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.14)"
                                    : "0 14px 34px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
                            }}
                        >
                            {src && (
                                <img
                                    src={src}
                                    alt=""
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: "-15%",
                                        width: "130%",
                                        height: "100%",
                                        objectFit: "cover",
                                        transform: `translateX(${shift}px)`,
                                    }}
                                />
                            )}
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: "#000",
                                    opacity: sideShade(
                                        theta,
                                        step,
                                        p.finish.dimSides
                                    ),
                                }}
                            />
                            {!chosen && (
                                <span
                                    style={{
                                        ...label,
                                        position: "absolute",
                                        top: 7,
                                        left: 8,
                                        opacity: 0.8,
                                        textShadow:
                                            "0 1px 8px rgba(0,0,0,0.55)",
                                    }}
                                >
                                    {two(i + 1)}
                                </span>
                            )}
                        </div>
                    )
                })}
            </div>
            {p.finish.grain > 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: GRAIN,
                        backgroundSize: "180px 180px",
                        opacity: p.finish.grain / 100,
                        mixBlendMode: "overlay",
                        zIndex: 6,
                    }}
                />
            )}
            {p.showSteppers && (
                <div
                    style={{
                        position: "absolute",
                        left: p.edge,
                        right: p.edge,
                        bottom: p.edge,
                        display: "flex",
                        justifyContent: "space-between",
                        zIndex: 7,
                    }}
                >
                    {[-1, 1].map((d) => (
                        <div
                            key={d}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 40,
                                border: "1px solid rgba(255,255,255,0.28)",
                                background: "rgba(255,255,255,0.04)",
                                color: p.ink,
                                display: "grid",
                                placeItems: "center",
                            }}
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 14 14"
                                fill="none"
                            >
                                <path
                                    d={
                                        d < 0
                                            ? "M8.5 2.5 4 7l4.5 4.5"
                                            : "M5.5 2.5 10 7l-4.5 4.5"
                                    }
                                    stroke="currentColor"
                                    strokeWidth="1.3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

/* ───────────────────────── entry ───────────────────────── */

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Volvelle(props: Props) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <VolvelleStill {...props} />
    return <VolvelleLive {...props} />
}

const pic = (id: string) =>
    `https://images.unsplash.com/${id}?w=1600&q=80&auto=format&fit=crop`

Volvelle.defaultProps = {
    leaves: [
        {
            imageUrl: pic("photo-1529626455594-4ff0802cfb7e"),
            title: "Afterglow\nIndex",
            link: "",
        },
        {
            imageUrl: pic("photo-1519085360753-af0119f7cbe7"),
            title: "Paper\nMoons",
            link: "",
        },
        {
            imageUrl: pic("photo-1531746020798-e6953c6e8e04"),
            title: "Long\nExposure",
            link: "",
        },
        {
            imageUrl: pic("photo-1492562080023-ab3db95bfbce"),
            title: "Blue Hour\nClub",
            link: "",
        },
        {
            imageUrl: pic("photo-1488426862026-3ee34a7d66df"),
            title: "Kiln\n& Ash",
            link: "",
        },
        {
            imageUrl: pic("photo-1539571696357-5a69c17a67c6"),
            title: "Static\nBloom",
            link: "",
        },
        {
            imageUrl: pic("photo-1544005313-94ddf0286df2"),
            title: "Cold\nOrchard",
            link: "",
        },
        {
            imageUrl: pic("photo-1508214751196-bcfd4ca60f91"),
            title: "Half\nLight",
            link: "",
        },
    ],
    dial: {
        top: 67,
        reach: 540,
        cardWidth: 104,
        cardHeight: 144,
        spacing: 15,
        lift: 1.32,
        corner: 8,
    },
    tempo: { autoplay: true, every: 5, spin: 0.95, bloom: 1.25 },
    finish: {
        grain: 22,
        vignette: 70,
        sideFade: 10,
        dimSides: 45,
        halo: true,
        parallax: true,
    },
    ink: "#FFFFFF",
    ground: "#16120F",
    wash: "#0A0806",
    washAmount: 60,
    showScale: true,
    scaleColor: "rgba(255,255,255,0.4)",
    showSteppers: true,
    linkLabel: "View",
    edge: 22,
    newTab: true,
}

addPropertyControls(Volvelle, {
    leaves: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 30,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.Image, title: "Image" },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    displayTextArea: true,
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
    },
    dial: {
        type: ControlType.Object,
        title: "Dial",
        controls: {
            top: {
                type: ControlType.Number,
                title: "Top",
                min: 20,
                max: 95,
                unit: "%",
                step: 1,
            },
            reach: {
                type: ControlType.Number,
                title: "Radius",
                min: 150,
                max: 2000,
                step: 5,
            },
            cardWidth: {
                type: ControlType.Number,
                title: "Card Width",
                min: 40,
                max: 400,
                step: 1,
            },
            cardHeight: {
                type: ControlType.Number,
                title: "Card Height",
                min: 40,
                max: 500,
                step: 1,
            },
            spacing: {
                type: ControlType.Number,
                title: "Spacing",
                min: 4,
                max: 45,
                step: 0.5,
                unit: "°",
            },
            lift: {
                type: ControlType.Number,
                title: "Active Scale",
                min: 1,
                max: 2,
                step: 0.02,
            },
            corner: {
                type: ControlType.Number,
                title: "Corner",
                min: 0,
                max: 40,
                step: 1,
            },
        },
    },
    tempo: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            autoplay: { type: ControlType.Boolean, title: "Autoplay" },
            every: {
                type: ControlType.Number,
                title: "Every",
                min: 1.5,
                max: 20,
                step: 0.5,
                unit: "s",
                hidden: (t: Tempo) => !t.autoplay,
            },
            spin: {
                type: ControlType.Number,
                title: "Spin",
                min: 0.2,
                max: 3,
                step: 0.05,
                unit: "s",
            },
            bloom: {
                type: ControlType.Number,
                title: "Bloom",
                min: 0.2,
                max: 3,
                step: 0.05,
                unit: "s",
            },
        },
    },
    finish: {
        type: ControlType.Object,
        title: "Finish",
        controls: {
            grain: {
                type: ControlType.Number,
                title: "Grain",
                min: 0,
                max: 100,
                unit: "%",
                step: 1,
            },
            vignette: {
                type: ControlType.Number,
                title: "Vignette",
                min: 0,
                max: 100,
                unit: "%",
                step: 1,
            },
            sideFade: {
                type: ControlType.Number,
                title: "Side Fade",
                min: 0,
                max: 40,
                unit: "%",
                step: 1,
            },
            dimSides: {
                type: ControlType.Number,
                title: "Dim Sides",
                min: 0,
                max: 100,
                unit: "%",
                step: 1,
            },
            halo: { type: ControlType.Boolean, title: "Halo" },
            parallax: { type: ControlType.Boolean, title: "Parallax" },
        },
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title",
        controls: "extended",
        defaultFontType: "serif",
        defaultValue: {
            fontSize: 68,
            fontWeight: 400,
            letterSpacing: "-0.035em",
            lineHeight: "0.9em",
        },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Labels",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: 10,
            letterSpacing: "0.1em",
            lineHeight: "1.2em",
        },
    },
    ink: { type: ControlType.Color, title: "Text" },
    ground: { type: ControlType.Color, title: "Backdrop" },
    wash: { type: ControlType.Color, title: "Shade" },
    washAmount: {
        type: ControlType.Number,
        title: "Shade Amount",
        min: 0,
        max: 100,
        unit: "%",
        step: 1,
    },
    showScale: { type: ControlType.Boolean, title: "Dial Scale" },
    scaleColor: {
        type: ControlType.Color,
        title: "Scale Color",
        hidden: (p: Props) => !p.showScale,
    },
    showSteppers: { type: ControlType.Boolean, title: "Arrows" },
    linkLabel: { type: ControlType.String, title: "Link Label" },
    edge: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 120,
        step: 1,
    },
    newTab: { type: ControlType.Boolean, title: "New Tab" },
})
