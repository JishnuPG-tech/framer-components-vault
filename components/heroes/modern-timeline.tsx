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


type Milestone = {
    image?: any
    imageUrl?: string
    year?: string
    title?: string
    caption?: string
    link?: string
}

type TrackSizes = {
    height?: number
    openWidth?: number
    shutWidth?: number
    spacing?: number
    radius?: number
}

type Shade = {
    tint?: string
    depth?: number
    scrim?: boolean
}

type Ruler = {
    show?: boolean
    step?: number
    tick?: string
    label?: string
    marker?: string
}

type Motion = {
    length?: number
    hold?: number
    morph?: number
    glide?: number
    hideBar?: boolean
    smoothWheel?: boolean
    mode?: "step" | "free"
    stepTime?: number
    wheelEase?: number
    entrance?: boolean
}

const PLACEHOLDER_TONES = [
    ["#D9D5CC", "#BDB8AD", "#EFEDE8"],
    ["#CFCAC0", "#A9A398", "#E9E6E0"],
    ["#C6C1B6", "#8F897E", "#E2DFD8"],
    ["#BEB8AC", "#7B766C", "#DCD8D0"],
    ["#D3CFC6", "#9E988C", "#ECE9E3"],
    ["#C9C4B9", "#868075", "#E5E2DB"],
]

const FALLBACK_ITEMS: Milestone[] = [
    {
        year: "2014",
        title: "Started in a spare room",
        caption: "Two desks, one idea and a lot of coffee.",
    },
    {
        year: "2016",
        title: "First client, first office",
        caption: "A small space with a big window.",
    },
    {
        year: "2018",
        title: "Grew to twenty people",
        caption: "New teams for design, build and care.",
    },
    {
        year: "2020",
        title: "Shipped our own product",
        caption: "Months of quiet work, out in the open.",
    },
    {
        year: "2022",
        title: "Opened a second studio",
        caption: "A new city and a new time zone.",
    },
    {
        year: "2025",
        title: "Ten years and counting",
        caption: "Still curious, still building.",
    },
]

function pickSource(m: Milestone): string {
    const typed = (m.imageUrl || "").trim()
    if (typed) return typed
    const up = m.image
    if (!up) return ""
    if (typeof up === "string") return up
    return up.src || ""
}

function pickAlt(m: Milestone): string {
    const up = m.image
    if (up && typeof up === "object" && up.alt) return up.alt
    return m.title || ""
}

function bound(v: number, lo = 0, hi = 1) {
    return v < lo ? lo : v > hi ? hi : v
}

function soften(t: number) {
    return t * t * (3 - 2 * t)
}

/* Pure geometry: card widths and offsets for a fractional focus index. */
function measureRow(
    count: number,
    focus: number,
    open: number,
    shut: number,
    spacing: number
) {
    const widths: number[] = []
    const starts: number[] = []
    let run = 0
    for (let i = 0; i < count; i++) {
        const nearness = 1 - Math.min(1, Math.abs(i - focus))
        widths[i] = shut + (open - shut) * soften(nearness)
        starts[i] = run
        run += widths[i] + spacing
    }
    const lo = Math.max(0, Math.min(count - 1, Math.floor(focus)))
    const hi = Math.min(count - 1, lo + 1)
    const frac = focus - lo
    const midLo = starts[lo] + widths[lo] / 2
    const midHi = starts[hi] + widths[hi] / 2
    return { widths, starts, middle: midLo + (midHi - midLo) * frac }
}

/* Pure sizing: shrinks the track to fit phone, tablet and desktop widths. */
type Fit = {
    open: number
    shut: number
    height: number
    gap: number
    step: number
    text: number
    edge: number
    band: number
}
function fitStage(W: number, H: number, track: TrackSizes, ruler: Ruler): Fit {
    const phone = W < 640
    const tablet = !phone && W < 1024
    const edge = phone ? 16 : tablet ? 24 : 32
    const shut = phone
        ? Math.min(track.shutWidth, Math.max(26, W * 0.085))
        : tablet
          ? Math.min(track.shutWidth, 60)
          : track.shutWidth
    const gap = phone
        ? Math.min(track.spacing, 6)
        : tablet
          ? Math.min(track.spacing, 10)
          : track.spacing
    const sides = phone ? shut * 1.1 + gap * 2 : shut * 2.2 + gap * 3
    const open = Math.max(150, Math.min(track.openWidth, W - edge * 2 - sides))
    const chrome = (ruler.show ? 46 : 0) + (phone ? 96 : tablet ? 130 : 150)
    const tall = phone ? Math.min(open * 1.4, track.height) : track.height
    const height = Math.max(200, Math.min(tall, H - chrome))
    const text = bound(
        open / Math.max(1, track.openWidth),
        phone ? 0.74 : 0.82,
        1
    )
    const step = Math.max(48, ruler.step * (phone ? 0.72 : tablet ? 0.86 : 1))
    const band = phone ? 16 : tablet ? 22 : 28
    return { open, shut, height, gap, step, text, edge, band }
}

/* Pure data: every tick on an edge-to-edge ruler, milestones labelled. */
function rulerMarks(count: number, step: number) {
    const reach = Math.ceil(2400 / Math.max(20, step))
    const marks: { x: number; major: boolean; index: number }[] = []
    for (let k = -reach * 4; k <= (count - 1 + reach) * 4; k++) {
        const major = k % 4 === 0
        const index = major ? k / 4 : -1
        marks.push({
            x: (k * step) / 4,
            major,
            index: index >= 0 && index < count ? index : -1,
        })
    }
    return marks
}

function pad2(n: number) {
    return n < 10 ? "0" + n : String(n)
}

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerDisableUnlink
 */
export default function Isthmus(props) {
    const still = useIsStaticRenderer()
    if (still) return <StillTrack {...props} />
    return <MovingTrack {...props} />
}

function resolve(props) {
    const items: Milestone[] =
        props.items && props.items.length ? props.items : FALLBACK_ITEMS
    const track: TrackSizes = {
        height: 430,
        openWidth: 380,
        shutWidth: 72,
        spacing: 12,
        radius: 14,
        ...(props.track || {}),
    }
    const shade: Shade = {
        tint: "#141414",
        depth: 0.55,
        scrim: true,
        ...(props.shade || {}),
    }
    const ruler: Ruler = {
        show: true,
        step: 96,
        tick: "#3E3E3C",
        label: "#6A6A68",
        marker: "#F1F0EC",
        ...(props.ruler || {}),
    }
    const motion: Motion = {
        length: 80,
        hold: 0.18,
        morph: 0.6,
        glide: 0.72,
        hideBar: true,
        smoothWheel: true,
        wheelEase: 7,
        mode: "step",
        stepTime: 1.1,
        entrance: true,
        ...(props.motion || {}),
    }
    return { items, track, shade, ruler, motion }
}

/* ---------------- Static branch: plain markup, resting at the first milestone ---------------- */

function StillTrack(props) {
    const { items, track, shade, ruler } = resolve(props)
    const count = items.length
    const row = measureRow(
        count,
        0,
        track.openWidth,
        track.shutWidth,
        track.spacing
    )
    const textColor = props.textColor || "#FFFFFF"
    const captionColor = props.captionColor || "rgba(255,255,255,0.78)"
    const stillHeight = Math.max(
        700,
        track.height + (ruler.show ? 72 : 0) + 160
    )

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: stillHeight,
                background: props.background,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                justifyContent: "center",
                gap: 28,
            }}
        >
            {props.showCounter && (
                <div
                    style={{
                        position: "absolute",
                        left: 24,
                        top: 22,
                        color: props.counterColor,
                        ...props.labelFont,
                    }}
                >
                    {pad2(1) + " / " + pad2(count)}
                </div>
            )}
            <div
                style={{
                    position: "relative",
                    height: track.height,
                    flexShrink: 0,
                }}
            >
                {items.map((m, i) => {
                    const far = Math.min(1, Math.abs(i))
                    const src = pickSource(m)
                    const tone = PLACEHOLDER_TONES[i % PLACEHOLDER_TONES.length]
                    return (
                        <div
                            key={i}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: "50%",
                                height: track.height,
                                width: row.widths[i],
                                transform: `translateX(${row.starts[i] - row.middle}px)`,
                                borderRadius: track.radius,
                                overflow: "hidden",
                                background: tone[0],
                            }}
                        >
                            {src ? (
                                <img
                                    src={src}
                                    alt={pickAlt(m)}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: tone[0],
                                    }}
                                >
                                    <div
                                        style={{
                                            position: "absolute",
                                            right: "22%",
                                            top: "16%",
                                            width: 34,
                                            height: 34,
                                            borderRadius: "50%",
                                            background: tone[2],
                                        }}
                                    />
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: "-35%",
                                            right: "-35%",
                                            bottom: "-30%",
                                            height: "62%",
                                            borderRadius: "50%",
                                            background: tone[1],
                                        }}
                                    />
                                </div>
                            )}
                            {shade.scrim && (
                                <div
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        height: "55%",
                                        background:
                                            "linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0))",
                                        opacity: 1 - far,
                                    }}
                                />
                            )}
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: shade.tint,
                                    opacity: far * shade.depth,
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    left: 20,
                                    bottom: 18,
                                    width: track.openWidth - 40,
                                    opacity: far > 0 ? 0 : 1,
                                }}
                            >
                                <div
                                    style={{
                                        color: textColor,
                                        ...props.yearFont,
                                    }}
                                >
                                    {m.year}
                                </div>
                                <div
                                    style={{
                                        color: textColor,
                                        marginTop: 6,
                                        ...props.titleFont,
                                    }}
                                >
                                    {m.title}
                                </div>
                                {m.caption ? (
                                    <div
                                        style={{
                                            color: captionColor,
                                            marginTop: 4,
                                            ...props.captionFont,
                                        }}
                                    >
                                        {m.caption}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )
                })}
            </div>
            {ruler.show && (
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: 46,
                        overflow: "hidden",
                        flexShrink: 0,
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: 0,
                            height: 1,
                            background: ruler.tick,
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: 0,
                            width: 1,
                            height: 18,
                            background: ruler.marker,
                            zIndex: 2,
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: 0,
                            height: 46,
                        }}
                    >
                        {rulerMarks(count, ruler.step).map((t, k) => (
                            <React.Fragment key={k}>
                                <div
                                    style={{
                                        position: "absolute",
                                        left: t.x,
                                        top: 0,
                                        width: 1,
                                        height:
                                            t.index >= 0 ? 12 : t.major ? 8 : 5,
                                        background: ruler.tick,
                                    }}
                                />
                                {t.index >= 0 && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: t.x - 40,
                                            width: 80,
                                            top: 22,
                                            textAlign: "center",
                                            color: ruler.label,
                                            whiteSpace: "nowrap",
                                            ...props.labelFont,
                                        }}
                                    >
                                        {items[t.index].year}
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

/* ---------------- Live branch: scroll-driven, self-sleeping ---------------- */

function useQuietMotionPref() {
    const [quiet, setQuiet] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setQuiet(mq.matches)
        sync()
        if (mq.addEventListener) mq.addEventListener("change", sync)
        else mq.addListener(sync)
        return () => {
            if (mq.removeEventListener) mq.removeEventListener("change", sync)
            else mq.removeListener(sync)
        }
    }, [])
    return quiet
}

function MovingTrack(props) {
    const { items, track, shade, ruler, motion } = resolve(props)
    const count = items.length
    const quiet = useQuietMotionPref()
    const [arrived, setArrived] = useState(false)

    const rootRef = useRef<HTMLDivElement>(null)
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])
    const imgRefs = useRef<(HTMLElement | null)[]>([])
    const veilRefs = useRef<(HTMLDivElement | null)[]>([])
    const scrimRefs = useRef<(HTMLDivElement | null)[]>([])
    const noteRefs = useRef<(HTMLDivElement | null)[]>([])
    const stripRef = useRef<HTMLDivElement>(null)
    const labelRefs = useRef<(HTMLDivElement | null)[]>([])
    const counterRef = useRef<HTMLDivElement>(null)

    const live = useRef({
        props,
        track,
        shade,
        ruler,
        motion,
        count,
        quiet,
        fit: null as Fit | null,
    })
    live.current = {
        props,
        track,
        shade,
        ruler,
        motion,
        count,
        quiet,
        fit: live.current.fit,
    }

    const engine = useRef({
        shown: 0,
        aim: 0,
        frame: 0,
        onScreen: false,
        tabOpen: true,
        stamp: 0,
        speed: 0,
        focusNow: 0,
    })
    const jumpRef = useRef<(index: number) => void>(() => {})
    const [fit, setFit] = useState<Fit>(() =>
        typeof window === "undefined"
            ? fitStage(1200, 800, track, ruler)
            : fitStage(window.innerWidth, window.innerHeight, track, ruler)
    )
    live.current.fit = fit

    /* Re-fit on resize or when sizing props change; only commit real changes. */
    const refit = () => {
        const root = rootRef.current
        if (!root || typeof window === "undefined") return
        const L = live.current
        const next = fitStage(
            root.clientWidth || window.innerWidth,
            window.innerHeight,
            L.track,
            L.ruler
        )
        const prev = L.fit
        if (
            !prev ||
            Object.keys(next).some(
                (k) => Math.abs((next as any)[k] - (prev as any)[k]) > 0.5
            )
        ) {
            L.fit = next
            setFit(next)
        }
    }
    useEffect(() => {
        refit()
    }, [
        track.openWidth,
        track.shutWidth,
        track.spacing,
        track.height,
        ruler.step,
        ruler.show,
    ])

    /* Each milestone holds for part of its scroll, then glides to the next. */
    const toFocus = (pos: number) => {
        const L = live.current
        const last = Math.max(0, L.count - 1)
        const raw = pos * last
        const base = Math.min(last, Math.floor(raw))
        if (base >= last) return last
        if ((L.motion.mode ?? "step") === "step") return raw
        const hold = bound(L.motion.hold ?? 0.18, 0, 0.45)
        const t = bound((raw - base - hold) / (1 - hold * 2))
        return base + soften(t)
    }

    const draw = (pos: number) => {
        const L = live.current
        const n = L.count
        const focus = toFocus(pos)
        engine.current.focusNow = focus
        const F = L.fit || fitStage(1200, 800, L.track, L.ruler)
        const row = measureRow(n, focus, F.open, F.shut, F.gap)
        /* Morph: strongest halfway between two milestones, gone at rest. */
        const between = focus - Math.floor(focus)
        const morph =
            Math.sin(Math.PI * between) * bound(L.motion.morph ?? 0.6, 0, 1)
        const squeeze = morph * F.height * 0.08
        const round = L.track.radius + morph * Math.min(F.open, 200) * 0.22
        for (let i = 0; i < n; i++) {
            const card = cardRefs.current[i]
            if (!card) continue
            const far = Math.min(1, Math.abs(i - focus))
            const cut = (F.open - row.widths[i]) / 2
            const centre = row.starts[i] + row.widths[i] / 2 - row.middle
            card.style.transform = `translate3d(${centre}px,0,0)`
            const lift =
                squeeze * (0.6 + 0.4 * (1 - Math.min(1, Math.abs(i - focus))))
            card.style.clipPath = `inset(${lift}px ${cut}px ${lift}px ${cut}px round ${round}px)`
            const veil = veilRefs.current[i]
            if (veil) veil.style.opacity = String(far * L.shade.depth)
            const scrim = scrimRefs.current[i]
            if (scrim) scrim.style.opacity = String(1 - far)
            const note = noteRefs.current[i]
            if (note)
                note.style.setProperty("--show", String(bound(1 - far * 1.8)))
            const pic = imgRefs.current[i]
            if (pic) {
                const drift =
                    Math.max(-1, Math.min(1, i - focus)) * F.open * 0.06
                pic.style.transform = `translate3d(${drift}px,0,0) scale(${1 + far * 0.05 + morph * 0.09})`
            }
        }
        if (stripRef.current)
            stripRef.current.style.transform = `translate3d(${-focus * F.step}px,0,0)`
        for (let i = 0; i < n; i++) {
            const tag = labelRefs.current[i]
            if (!tag) continue
            const near = 1 - Math.min(1, Math.abs(i - focus))
            tag.style.color = near > 0.5 ? L.ruler.marker : L.ruler.label
        }
        if (counterRef.current) {
            const at = Math.round(focus) + 1
            counterRef.current.textContent = pad2(at) + " / " + pad2(n)
        }
    }

    /* Raw runway progress: 0 when the stage pins, 1 when it releases. */
    const runwayRaw = (): { raw: number; top: number; travel: number } => {
        const root = rootRef.current
        if (!root || typeof window === "undefined")
            return { raw: 0, top: 0, travel: 0 }
        const vh = window.innerHeight || 1
        const box = root.getBoundingClientRect()
        const travel = box.height - vh
        return {
            raw: travel > 1 ? bound(-box.top / travel) : 0,
            top: box.top,
            travel,
        }
    }

    const sample = (): number => runwayRaw().raw

    const permitted = () => engine.current.onScreen && engine.current.tabOpen

    /* Frame-rate independent damping, so the glide feels the same at 60 and 120 Hz. */
    const step = (now: number) => {
        const e = engine.current
        e.frame = 0
        if (!permitted()) {
            e.stamp = 0
            return
        }
        const L = live.current
        const dt = e.stamp ? Math.min(0.05, (now - e.stamp) / 1000) : 1 / 60
        e.stamp = now
        if (L.quiet) {
            e.shown = e.aim
            e.speed = 0
        } else {
            const glide = bound(L.motion.glide ?? 0.72, 0, 0.97)
            const stiff = 30 + (1 - glide) * 600
            const damp = 2 * Math.sqrt(stiff)
            let left = dt
            while (left > 0) {
                const h = Math.min(left, 1 / 240)
                e.speed += ((e.aim - e.shown) * stiff - e.speed * damp) * h
                e.shown += e.speed * h
                left -= h
            }
        }
        if (Math.abs(e.aim - e.shown) < 0.00008 && Math.abs(e.speed) < 0.0004) {
            e.shown = e.aim
            e.speed = 0
        }
        draw(e.shown)
        if (e.shown !== e.aim) e.frame = requestAnimationFrame(step)
        else e.stamp = 0
    }

    const nudge = () => {
        const e = engine.current
        if (!permitted()) return
        e.aim = sample()
        if (!e.frame) e.frame = requestAnimationFrame(step)
    }

    useEffect(() => {
        const e = engine.current
        e.aim = sample()
        e.shown = e.aim
        draw(e.shown)

        let onScrollExtra = () => {}
        const onScroll = () => {
            nudge()
            onScrollExtra()
        }

        /* Paging: in "step" mode one wheel gesture moves exactly one milestone.
           In "free" mode the wheel glides smoothly. Either way only while permitted. */
        const wheel = { target: 0, frame: 0, active: false, stamp: 0 }
        const page = {
            frame: 0,
            busy: false,
            from: 0,
            to: 0,
            t0: 0,
            dur: 900,
            lastWheel: 0,
            lastMag: 0,
            lockUntil: 0,
            settle: 0 as any,
        }

        const runwayInfo = () => {
            const root = rootRef.current
            const vh = window.innerHeight || 1
            if (!root) return null
            const box = root.getBoundingClientRect()
            const travel = box.height - vh
            if (travel <= 1) return null
            return {
                box,
                travel,
                absTop: box.top + window.scrollY,
                pinned: box.top <= 1 && box.bottom >= vh - 1,
            }
        }
        const cardY = (
            info: { absTop: number; travel: number },
            index: number
        ) => {
            const last = Math.max(1, live.current.count - 1)
            return info.absTop + (index / last) * info.travel
        }
        /* Gentle sine ease: soft start, soft landing. */
        const curve = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t)
        const pageStep = (now: number) => {
            page.frame = 0
            if (!permitted()) {
                page.busy = false
                return
            }
            const t = bound((now - page.t0) / page.dur)
            window.scrollTo(0, page.from + (page.to - page.from) * curve(t))
            if (t < 1) page.frame = requestAnimationFrame(pageStep)
            else {
                page.busy = false
                page.lockUntil = now + 260
            }
        }
        const glideTo = (y: number, stretch = 1) => {
            if (wheel.frame) {
                cancelAnimationFrame(wheel.frame)
                wheel.frame = 0
                wheel.active = false
            }
            page.from = window.scrollY
            page.to = y
            const span = Math.abs(page.to - page.from)
            if (span < 1) return
            page.dur =
                Math.max(300, (live.current.motion.stepTime ?? 1.1) * 1000) *
                stretch
            page.t0 = performance.now()
            page.busy = true
            if (!page.frame) page.frame = requestAnimationFrame(pageStep)
        }
        const dropSettle = () => {
            if (page.settle) {
                clearTimeout(page.settle)
                page.settle = 0
            }
        }
        const settleNearest = () => {
            page.settle = 0
            if (!permitted() || page.busy || wheel.active || live.current.quiet)
                return
            if ((live.current.motion.mode ?? "step") !== "step") return
            const info = runwayInfo()
            if (!info || !info.pinned) return
            const last = Math.max(1, live.current.count - 1)
            const raw = bound(-info.box.top / info.travel)
            const nearest = Math.round(raw * last)
            const y = cardY(info, nearest)
            if (Math.abs(y - window.scrollY) > 2) glideTo(y)
        }

        const wheelStep = (now: number) => {
            wheel.frame = 0
            if (!permitted()) {
                wheel.active = false
                wheel.stamp = 0
                return
            }
            const dt = wheel.stamp
                ? Math.min(0.05, (now - wheel.stamp) / 1000)
                : 1 / 60
            wheel.stamp = now
            const cur = window.scrollY
            const pull =
                1 - Math.exp(-(live.current.motion.wheelEase ?? 7) * dt)
            let next = cur + (wheel.target - cur) * pull
            if (Math.abs(wheel.target - next) < 0.5) {
                next = wheel.target
                wheel.active = false
            }
            window.scrollTo(0, next)
            if (wheel.active) wheel.frame = requestAnimationFrame(wheelStep)
            else wheel.stamp = 0
        }
        const freeWheel = (ev: WheelEvent) => {
            ev.preventDefault()
            if (!wheel.active) wheel.target = window.scrollY
            const unit =
                ev.deltaMode === 1
                    ? 16
                    : ev.deltaMode === 2
                      ? window.innerHeight
                      : 1
            const top = Math.max(
                0,
                document.documentElement.scrollHeight - window.innerHeight
            )
            wheel.target = bound(wheel.target + ev.deltaY * unit, 0, top)
            wheel.active = true
            if (!wheel.frame) wheel.frame = requestAnimationFrame(wheelStep)
        }
        const onWheel = (ev: WheelEvent) => {
            const L = live.current
            if (L.quiet || ev.ctrlKey || !permitted()) return
            if (Math.abs(ev.deltaX) > Math.abs(ev.deltaY) || ev.deltaY === 0)
                return
            if ((L.motion.mode ?? "step") !== "step") {
                if (L.motion.smoothWheel) freeWheel(ev)
                return
            }
            const info = runwayInfo()
            if (!info || !info.pinned) return
            const now = performance.now()
            const mag = Math.abs(ev.deltaY)
            const gap = now - page.lastWheel
            /* A fresh gesture is a pause, or a clear surge over a fading trackpad tail. */
            const fresh = gap > 160 || mag > page.lastMag * 1.6 + 4
            page.lastWheel = now
            page.lastMag = mag
            const last = Math.max(1, L.count - 1)
            const dir = ev.deltaY > 0 ? 1 : -1
            const raw = bound(-info.box.top / info.travel)
            const here = page.busy
                ? Math.round(((page.to - info.absTop) / info.travel) * last)
                : Math.round(raw * last)
            const atEdge = (dir > 0 && here >= last) || (dir < 0 && here <= 0)
            if (atEdge && !page.busy && fresh && now >= page.lockUntil) return
            ev.preventDefault()
            dropSettle()
            if (page.busy || !fresh || now < page.lockUntil || atEdge) return
            glideTo(cardY(info, here + dir))
        }
        window.addEventListener("wheel", onWheel, { passive: false })
        /* Touch paging: a swipe while pinned moves one milestone; edges scroll natively. */
        const touch = { y: 0, live: false, dir: 0 }
        const onTouchStart = (ev: TouchEvent) => {
            if (ev.touches.length !== 1) {
                touch.live = false
                return
            }
            touch.y = ev.touches[0].clientY
            touch.dir = 0
            const info = runwayInfo()
            touch.live =
                !!info &&
                info.pinned &&
                permitted() &&
                (live.current.motion.mode ?? "step") === "step" &&
                !live.current.quiet
        }
        const onTouchMove = (ev: TouchEvent) => {
            if (!touch.live || ev.touches.length !== 1) return
            const dy = touch.y - ev.touches[0].clientY
            if (Math.abs(dy) < 6) return
            const dir = dy > 0 ? 1 : -1
            const last = Math.max(1, live.current.count - 1)
            const here = Math.round(engine.current.focusNow)
            const atEdge = (dir > 0 && here >= last) || (dir < 0 && here <= 0)
            if (atEdge && !page.busy) {
                touch.live = false
                return
            }
            touch.dir = dir
            if (ev.cancelable) ev.preventDefault()
        }
        const onTouchEnd = (ev: TouchEvent) => {
            if (!touch.live) return
            touch.live = false
            const end = ev.changedTouches[0]
            const dy = end ? touch.y - end.clientY : 0
            if (Math.abs(dy) < 34 || page.busy) return
            const info = runwayInfo()
            if (!info) return
            const last = Math.max(1, live.current.count - 1)
            const here = Math.round(engine.current.focusNow)
            const next = Math.max(0, Math.min(last, here + (dy > 0 ? 1 : -1)))
            dropSettle()
            if (next !== here) glideTo(cardY(info, next))
        }
        window.addEventListener("touchstart", onTouchStart, { passive: true })
        window.addEventListener("touchmove", onTouchMove, { passive: false })
        window.addEventListener("touchend", onTouchEnd, { passive: true })

        jumpRef.current = (index: number) => {
            if (!permitted()) return
            const info = runwayInfo()
            if (!info) return
            dropSettle()
            const from = Math.round(engine.current.focusNow)
            const hops = Math.abs(index - from)
            glideTo(cardY(info, index), 1 + Math.max(0, hops - 1) * 0.22)
        }
        onScrollExtra = () => {
            dropSettle()
            if (
                !page.busy &&
                !wheel.active &&
                permitted() &&
                (live.current.motion.mode ?? "step") === "step" &&
                !live.current.quiet
            )
                page.settle = setTimeout(settleNearest, 180)
        }
        const onResize = () => {
            refit()
            draw(e.shown)
            nudge()
        }
        const onTab = () => {
            e.tabOpen = !document.hidden
            if (e.tabOpen) nudge()
            else {
                dropSettle()
                if (e.frame) {
                    cancelAnimationFrame(e.frame)
                    e.frame = 0
                }
            }
        }
        e.tabOpen = !document.hidden

        let watcher: IntersectionObserver | null = null
        if (typeof IntersectionObserver === "undefined") {
            e.onScreen = true
            setArrived(true)
        } else {
            watcher = new IntersectionObserver(
                (entries) => {
                    const seen = entries.some((x) => x.isIntersecting)
                    e.onScreen = seen
                    if (seen) {
                        setArrived(true)
                        nudge()
                    } else {
                        dropSettle()
                        if (e.frame) {
                            cancelAnimationFrame(e.frame)
                            e.frame = 0
                        }
                        e.aim = sample()
                        e.shown = e.aim
                        e.speed = 0
                        e.stamp = 0
                        draw(e.shown)
                    }
                },
                { threshold: 0 }
            )
            if (rootRef.current) watcher.observe(rootRef.current)
        }

        document.addEventListener("scroll", onScroll, {
            passive: true,
            capture: true,
        })
        window.addEventListener("resize", onResize)
        document.addEventListener("visibilitychange", onTab)

        return () => {
            if (watcher) watcher.disconnect()
            document.removeEventListener("scroll", onScroll, {
                capture: true,
            } as any)
            window.removeEventListener("resize", onResize)
            document.removeEventListener("visibilitychange", onTab)
            window.removeEventListener("wheel", onWheel as any)
            window.removeEventListener("touchstart", onTouchStart as any)
            window.removeEventListener("touchmove", onTouchMove as any)
            window.removeEventListener("touchend", onTouchEnd as any)
            if (wheel.frame) cancelAnimationFrame(wheel.frame)
            if (page.frame) cancelAnimationFrame(page.frame)
            dropSettle()
            if (e.frame) cancelAnimationFrame(e.frame)
            e.frame = 0
        }
    }, [])

    useEffect(() => {
        draw(engine.current.shown)
    })

    const playIn = motion.entrance && !quiet
    const textColor = props.textColor || "#FFFFFF"
    const captionColor = props.captionColor || "rgba(255,255,255,0.78)"
    const rise = "cubic-bezier(.16,1,.3,1)"
    const perCard = Math.max(30, motion.length ?? 90)
    const runway = `calc(100svh + ${Math.max(1, count - 1) * perCard}svh)`

    return (
        <div
            ref={rootRef}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: runway,
            }}
        >
            {motion.hideBar && (
                <style>{`html{scrollbar-width:none;-ms-overflow-style:none}html::-webkit-scrollbar,body::-webkit-scrollbar{width:0;height:0;display:none}`}</style>
            )}
            <div
                style={{
                    position: "sticky",
                    top: 0,
                    width: "100%",
                    height: "100svh",
                    background: props.background,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    justifyContent: "center",
                    gap: fit.band,
                }}
            >
                {props.showCounter && (
                    <div
                        ref={counterRef}
                        style={{
                            position: "absolute",
                            left: fit.edge,
                            top: fit.edge,
                            color: props.counterColor,
                            opacity: !playIn || arrived ? 1 : 0,
                            transition: playIn
                                ? "opacity .8s ease .5s"
                                : "none",
                            ...props.labelFont,
                        }}
                    >
                        {"01 / " + pad2(count)}
                    </div>
                )}
                <div
                    style={{
                        position: "relative",
                        height: fit.height,
                        flexShrink: 0,
                    }}
                >
                    {items.map((m, i) => {
                        const src = pickSource(m)
                        const tone =
                            PLACEHOLDER_TONES[i % PLACEHOLDER_TONES.length]
                        const body = (
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: track.radius,
                                    overflow: "hidden",
                                    background: tone[0],
                                    opacity: !playIn || arrived ? 1 : 0,
                                    transform:
                                        !playIn || arrived
                                            ? "none"
                                            : "translate3d(0,56px,0)",
                                    transition: playIn
                                        ? `opacity .8s ease ${0.07 * i}s, transform 1.1s ${rise} ${0.07 * i}s`
                                        : "none",
                                }}
                            >
                                {src ? (
                                    <img
                                        ref={(el) => (imgRefs.current[i] = el)}
                                        src={src}
                                        alt={pickAlt(m)}
                                        draggable={false}
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: "50%",
                                            width: fit.open * 1.14,
                                            marginLeft: -fit.open * 0.57,
                                            height: "100%",
                                            objectFit: "cover",
                                            transformOrigin: "50% 50%",
                                            willChange: "transform",
                                        }}
                                    />
                                ) : (
                                    <div
                                        ref={(el) => (imgRefs.current[i] = el)}
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: "50%",
                                            width: fit.open * 1.14,
                                            marginLeft: -fit.open * 0.57,
                                            height: "100%",
                                            background: tone[0],
                                            willChange: "transform",
                                        }}
                                    >
                                        <div
                                            style={{
                                                position: "absolute",
                                                right: "22%",
                                                top: "16%",
                                                width: 34,
                                                height: 34,
                                                borderRadius: "50%",
                                                background: tone[2],
                                            }}
                                        />
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: "-35%",
                                                right: "-35%",
                                                bottom: "-30%",
                                                height: "62%",
                                                borderRadius: "50%",
                                                background: tone[1],
                                            }}
                                        />
                                    </div>
                                )}
                                {shade.scrim && (
                                    <div
                                        ref={(el) =>
                                            (scrimRefs.current[i] = el)
                                        }
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            height: "55%",
                                            background:
                                                "linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0))",
                                        }}
                                    />
                                )}
                                <div
                                    ref={(el) => (veilRefs.current[i] = el)}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: shade.tint,
                                    }}
                                />
                                <div
                                    ref={(el) => (noteRefs.current[i] = el)}
                                    style={{
                                        position: "absolute",
                                        left: fit.open < 260 ? 14 : 20,
                                        bottom: fit.open < 260 ? 14 : 18,
                                        width:
                                            (fit.open -
                                                (fit.open < 260 ? 28 : 40)) /
                                            fit.text,
                                        transform: `scale(${fit.text})`,
                                        transformOrigin: "0% 100%",
                                        ["--show" as any]: i === 0 ? 1 : 0,
                                    }}
                                >
                                    <div
                                        style={{
                                            color: textColor,
                                            opacity:
                                                "calc(var(--show) * 1.6)" as any,
                                            transform:
                                                "translate3d(0, calc((1 - var(--show)) * 22px), 0)",
                                            ...props.yearFont,
                                        }}
                                    >
                                        {m.year}
                                    </div>
                                    <div
                                        style={{
                                            color: textColor,
                                            marginTop: 6,
                                            opacity:
                                                "calc(var(--show) * 1.6 - 0.3)" as any,
                                            transform:
                                                "translate3d(0, calc((1 - var(--show)) * 30px), 0)",
                                            ...props.titleFont,
                                        }}
                                    >
                                        {m.title}
                                    </div>
                                    {m.caption ? (
                                        <div
                                            style={{
                                                color: captionColor,
                                                marginTop: 4,
                                                opacity:
                                                    "calc(var(--show) * 1.6 - 0.6)" as any,
                                                transform:
                                                    "translate3d(0, calc((1 - var(--show)) * 38px), 0)",
                                                ...props.captionFont,
                                            }}
                                        >
                                            {m.caption}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        )
                        return (
                            <div
                                key={i}
                                ref={(el) => (cardRefs.current[i] = el)}
                                onClick={(ev) => {
                                    if (
                                        i !==
                                        Math.round(engine.current.focusNow)
                                    ) {
                                        ev.preventDefault()
                                        jumpRef.current(i)
                                    }
                                }}
                                style={{
                                    position: "absolute",
                                    cursor: "pointer",
                                    top: 0,
                                    left: "50%",
                                    width: fit.open,
                                    marginLeft: -fit.open / 2,
                                    height: fit.height,
                                    willChange: "transform, clip-path",
                                }}
                            >
                                {m.link ? (
                                    <a
                                        href={m.link}
                                        target={
                                            props.newTab ? "_blank" : undefined
                                        }
                                        rel={
                                            props.newTab
                                                ? "noopener noreferrer"
                                                : undefined
                                        }
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            display: "block",
                                            color: "inherit",
                                            textDecoration: "none",
                                        }}
                                    >
                                        {body}
                                    </a>
                                ) : (
                                    body
                                )}
                            </div>
                        )
                    })}
                </div>
                {ruler.show && (
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            height: 46,
                            overflow: "hidden",
                            flexShrink: 0,
                            opacity: !playIn || arrived ? 1 : 0,
                            transition: playIn
                                ? "opacity .9s ease .45s"
                                : "none",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: 0,
                                height: 1,
                                background: ruler.tick,
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: 0,
                                width: 1,
                                height: 18,
                                background: ruler.marker,
                                zIndex: 2,
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: 0,
                                height: 46,
                            }}
                        >
                            <div
                                ref={stripRef}
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    height: 46,
                                    willChange: "transform",
                                }}
                            >
                                {rulerMarks(count, fit.step).map((t, k) => (
                                    <React.Fragment key={k}>
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: t.x,
                                                top: 0,
                                                width: 1,
                                                height:
                                                    t.index >= 0
                                                        ? 12
                                                        : t.major
                                                          ? 8
                                                          : 5,
                                                background: ruler.tick,
                                            }}
                                        />
                                        {t.index >= 0 && (
                                            <div
                                                ref={(el) =>
                                                    (labelRefs.current[
                                                        t.index
                                                    ] = el)
                                                }
                                                style={{
                                                    position: "absolute",
                                                    left: t.x - 40,
                                                    width: 80,
                                                    top: 22,
                                                    textAlign: "center",
                                                    color: ruler.label,
                                                    whiteSpace: "nowrap",
                                                    ...props.labelFont,
                                                }}
                                            >
                                                {items[t.index].year}
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

addPropertyControls(Isthmus, {
    items: {
        type: ControlType.Array,
        title: "Milestones",
        maxCount: 20,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…",
                },
                year: {
                    type: ControlType.String,
                    title: "Year",
                    defaultValue: "2024",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "A new milestone",
                },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    displayTextArea: true,
                    defaultValue: "A short line about this moment.",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: FALLBACK_ITEMS,
    },
    newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: true },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#141414",
    },
    track: {
        type: ControlType.Object,
        title: "Track",
        controls: {
            height: {
                type: ControlType.Number,
                title: "Height",
                min: 160,
                max: 900,
                step: 1,
                unit: "px",
                defaultValue: 430,
            },
            openWidth: {
                type: ControlType.Number,
                title: "Open Width",
                min: 160,
                max: 900,
                step: 1,
                unit: "px",
                defaultValue: 380,
            },
            shutWidth: {
                type: ControlType.Number,
                title: "Closed Width",
                min: 24,
                max: 300,
                step: 1,
                unit: "px",
                defaultValue: 72,
            },
            spacing: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
                defaultValue: 12,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
                defaultValue: 14,
            },
        },
    },
    shade: {
        type: ControlType.Object,
        title: "Shade",
        controls: {
            tint: {
                type: ControlType.Color,
                title: "Dim Color",
                defaultValue: "#141414",
            },
            depth: {
                type: ControlType.Number,
                title: "Dim",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.55,
            },
            scrim: {
                type: ControlType.Boolean,
                title: "Text Scrim",
                defaultValue: true,
            },
        },
    },
    yearFont: {
        type: ControlType.Font,
        title: "Year Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 34,
            variant: "Medium",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 16,
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    captionFont: {
        type: ControlType.Font,
        title: "Caption Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 13, variant: "Regular", lineHeight: "1.5em" },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
    },
    captionColor: {
        type: ControlType.Color,
        title: "Caption",
        defaultValue: "rgba(255,255,255,0.78)",
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 11,
            variant: "Regular",
            letterSpacing: "0.02em",
            lineHeight: "1em",
        },
    },
    showCounter: {
        type: ControlType.Boolean,
        title: "Counter",
        defaultValue: true,
    },
    counterColor: {
        type: ControlType.Color,
        title: "Counter Color",
        defaultValue: "#6A6A68",
        hidden: (p) => !p.showCounter,
    },
    ruler: {
        type: ControlType.Object,
        title: "Ruler",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
            },
            step: {
                type: ControlType.Number,
                title: "Spacing",
                min: 40,
                max: 240,
                step: 1,
                unit: "px",
                defaultValue: 96,
            },
            tick: {
                type: ControlType.Color,
                title: "Ticks",
                defaultValue: "#3E3E3C",
            },
            label: {
                type: ControlType.Color,
                title: "Labels",
                defaultValue: "#6A6A68",
            },
            marker: {
                type: ControlType.Color,
                title: "Marker",
                defaultValue: "#F1F0EC",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            length: {
                type: ControlType.Number,
                title: "Scroll / Card",
                min: 30,
                max: 300,
                step: 5,
                unit: "vh",
                defaultValue: 80,
            },
            morph: {
                type: ControlType.Number,
                title: "Morph",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.6,
            },
            hold: {
                type: ControlType.Number,
                title: "Card Hold",
                min: 0,
                max: 0.45,
                step: 0.01,
                defaultValue: 0.18,
            },
            glide: {
                type: ControlType.Number,
                title: "Smoothness",
                min: 0,
                max: 0.97,
                step: 0.01,
                defaultValue: 0.72,
            },
            hideBar: {
                type: ControlType.Boolean,
                title: "Hide Scrollbar",
                defaultValue: true,
            },
            mode: {
                type: ControlType.Enum,
                title: "Scroll",
                options: ["step", "free"],
                optionTitles: ["One Card", "Free"],
                defaultValue: "step",
                displaySegmentedControl: true,
            },
            stepTime: {
                type: ControlType.Number,
                title: "Step Time",
                min: 0.3,
                max: 2,
                step: 0.05,
                unit: "s",
                defaultValue: 1.1,
            },
            smoothWheel: {
                type: ControlType.Boolean,
                title: "Smooth Wheel",
                defaultValue: true,
            },
            wheelEase: {
                type: ControlType.Number,
                title: "Wheel Ease",
                min: 3,
                max: 20,
                step: 0.5,
                defaultValue: 7,
            },
            entrance: {
                type: ControlType.Boolean,
                title: "Entrance",
                defaultValue: true,
            },
        },
    },
})
