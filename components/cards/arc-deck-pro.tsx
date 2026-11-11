import * as React from "react"
import { useEffect, useId, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Img = { src?: string; srcSet?: string; alt?: string }

type CardEntry = {
    image?: Img
    imageUrl?: string
    videoUrl?: string
    handle?: string
    tint?: string
    pinned?: boolean
    link?: string
    newTab?: boolean
}

type FanGroup = {
    overlap: number
    tiltFrom: number
    tiltTo: number
    depth: number
    arc: number
    lean: number
    curve: number
    slices: number
    widthFill: number
    heightFill: number
    ratio: number
    stacking: "right" | "left" | "centre" | "edges"
    rowShift: number
}

type LookGroup = {
    background: string
    radius: number
    shade: number
    shadow: number
    shadowAlpha: number
    backColor: string
    outlineWidth: number
    outlineColor: string
}

type ArrivalGroup = {
    style: "deal" | "flip" | "rise" | "sweep"
    duration: number
    stagger: number
    delay: number
    hold: number
    shine: boolean
    replay: boolean
}

type HoverGroup = {
    lift: number
    spread: number
    scale: number
    straighten: number
    uncurl: number
    tilt3D: boolean
    tiltDepth: number
    sheen: boolean
    dim: number
    float: boolean
    floatAmp: number
}

type BubbleGroup = {
    prefix: string
    color: string
    padX: number
    padY: number
    radius: number
    gap: number
    align: "start" | "center" | "end"
    shadow: boolean
}

type ShingleProps = {
    cards?: CardEntry[]
    fan?: Partial<FanGroup>
    look?: Partial<LookGroup>
    arrival?: Partial<ArrivalGroup>
    hover?: Partial<HoverGroup>
    bubble?: Partial<BubbleGroup>
    labelFont?: React.CSSProperties
    style?: React.CSSProperties
}

const FAN_BASE: FanGroup = {
    overlap: 40,
    tiltFrom: -8,
    tiltTo: 6,
    depth: 14,
    arc: 11,
    lean: -7,
    curve: 44,
    slices: 14,
    widthFill: 90,
    heightFill: 56,
    ratio: 1.02,
    stacking: "right",
    rowShift: 5,
}

const LOOK_BASE: LookGroup = {
    background: "#EFEFEF",
    radius: 22,
    shade: 40,
    shadow: 28,
    shadowAlpha: 0.26,
    backColor: "#161616",
    outlineWidth: 0,
    outlineColor: "rgba(255,255,255,0.9)",
}

const ARRIVAL_BASE: ArrivalGroup = {
    style: "deal",
    duration: 1150,
    stagger: 85,
    delay: 120,
    hold: 380,
    shine: true,
    replay: false,
}

const HOVER_BASE: HoverGroup = {
    lift: 18,
    spread: 16,
    scale: 1.06,
    straighten: 60,
    uncurl: 55,
    tilt3D: true,
    tiltDepth: 9,
    sheen: true,
    dim: 12,
    float: true,
    floatAmp: 5,
}

const BUBBLE_BASE: BubbleGroup = {
    prefix: "@",
    color: "#FFFFFF",
    padX: 16,
    padY: 10,
    radius: 16,
    gap: 12,
    align: "start",
    shadow: true,
}

const BACKDROPS = [
    "linear-gradient(140deg,#ff5a3c,#ffb347)",
    "linear-gradient(140deg,#3e5bff,#9fb4ff)",
    "linear-gradient(140deg,#ffd23f,#ff9f1c)",
    "linear-gradient(140deg,#ff9a8b,#ffe0d3)",
    "linear-gradient(140deg,#d7263d,#ff7a59)",
    "linear-gradient(140deg,#1b998b,#7ae7c7)",
    "linear-gradient(140deg,#2d6a4f,#95d5b2)",
]

const SEED: CardEntry[] = [
    {
        imageUrl:
            "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=900&q=80&auto=format&fit=crop",
        handle: "inkhouse",
        tint: "#2F6BFF",
        pinned: false,
        newTab: true,
    },
    {
        imageUrl:
            "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=900&q=80&auto=format&fit=crop",
        handle: "paperlab",
        tint: "#FF5A3C",
        pinned: false,
        newTab: true,
    },
    {
        imageUrl:
            "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=900&q=80&auto=format&fit=crop",
        handle: "softfocus",
        tint: "#E8890C",
        pinned: false,
        newTab: true,
    },
    {
        imageUrl:
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&q=80&auto=format&fit=crop",
        handle: "dreamstate",
        tint: "#FF4F9A",
        pinned: false,
        newTab: true,
    },
    {
        imageUrl:
            "https://images.unsplash.com/photo-1549490349-8643362247b5?w=900&q=80&auto=format&fit=crop",
        handle: "redroom",
        tint: "#D7263D",
        pinned: false,
        newTab: true,
    },
    {
        imageUrl:
            "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=900&q=80&auto=format&fit=crop",
        handle: "posterclub",
        tint: "#7B5CFF",
        pinned: false,
        newTab: true,
    },
    {
        imageUrl:
            "https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=900&q=80&auto=format&fit=crop",
        handle: "greenline",
        tint: "#5E9C78",
        pinned: false,
        newTab: true,
    },
]

const EASE_GLIDE = "cubic-bezier(.2,.85,.22,1)"
const EASE_ROLL = "cubic-bezier(.26,1.32,.42,1)"
const EASE_TWIST = "cubic-bezier(.3,1.55,.5,1)"
const EASE_CURL = "cubic-bezier(.3,1.75,.48,1)"
const EASE_GATHER = "cubic-bezier(.22,1.25,.36,1)"
const EASE_SPRING = "cubic-bezier(.25,1.45,.45,1)"
const EASE_POP = "cubic-bezier(.34,1.56,.64,1)"

// ---------- pure math (numbers only, no styles) ----------

function tidy(cards?: CardEntry[]): CardEntry[] {
    return Array.isArray(cards) ? cards.filter(Boolean) : []
}

function pictureOf(c: CardEntry): string {
    return (c.image && c.image.src) || (c.imageUrl || "").trim()
}

function poseAt(i: number, n: number, f: FanGroup) {
    const u = n > 1 ? i / (n - 1) : 0.5
    const t = u * 2 - 1
    return {
        x: (i - (n - 1) / 2) * (1 - f.overlap / 100),
        y: (f.arc / 100) * t * t + (f.lean / 100) * t,
        deg: f.tiltFrom + (f.tiltTo - f.tiltFrom) * u,
        k: 1 - (f.depth / 100) * (1 - t * t),
    }
}

function layerOf(i: number, n: number, mode: FanGroup["stacking"]) {
    const mid = (n - 1) / 2
    if (mode === "left") return n - i
    if (mode === "centre") return n * 2 - Math.round(Math.abs(i - mid) * 2)
    if (mode === "edges") return Math.round(Math.abs(i - mid) * 2) + 1
    return i + 1
}

function cardUnit(n: number, f: FanGroup) {
    const span = 1 + Math.max(0, n - 1) * (1 - f.overlap / 100)
    const ratio = Math.max(0.3, f.ratio)
    return `min(${(f.widthFill / span).toFixed(3)}cqw, ${(
        f.heightFill / ratio
    ).toFixed(3)}cqh)`
}

function bubbleRise(k: number, deg: number, ratio: number) {
    const sink = ((1 - k) * ratio) / 2
    const corner = Math.sin((Math.abs(deg) * Math.PI) / 180) * k * 0.3
    return sink - corner
}

// Lays N vertical strips of a unit-wide card on a cylinder. Positive curve
// brings the side edges toward the viewer, negative bulges the middle out.
function cylinderStrips(count: number, curveDeg: number) {
    const n = Math.max(1, Math.round(count))
    const b = (curveDeg * Math.PI) / 180
    const flat = Math.abs(b) < 0.004
    const r = flat ? 0 : 1 / b
    const rim = flat ? 0 : 1 - Math.cos(b / 2)
    const out: { dx: number; dz: number; ry: number; lean: number }[] = []
    for (let j = 0; j < n; j++) {
        if (flat) {
            out.push({ dx: 0, dz: 0, ry: 0, lean: 0 })
            continue
        }
        const phi = -b / 2 + ((j + 0.5) * b) / n
        const home = (j + 0.5) / n - 0.5
        out.push({
            dx: r * Math.sin(phi) - home,
            dz: r * (1 - Math.cos(phi)),
            ry: (-phi * 180) / Math.PI,
            lean: rim > 0 ? (1 - Math.cos(phi)) / rim : 0,
        })
    }
    return out
}

// ---------- live helpers ----------

function useCalmPreference() {
    const [calm, setCalm] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const q = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setCalm(q.matches)
        sync()
        if (q.addEventListener) q.addEventListener("change", sync)
        else q.addListener(sync)
        return () => {
            if (q.removeEventListener) q.removeEventListener("change", sync)
            else q.removeListener(sync)
        }
    }, [])
    return calm
}

function useWatch(ref: React.RefObject<HTMLElement>) {
    const [seen, setSeen] = useState(false)
    const [pageOn, setPageOn] = useState(true)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            setSeen(true)
            return
        }
        const io = new IntersectionObserver(
            (entries) => {
                const e = entries[entries.length - 1]
                if (e) setSeen(e.isIntersecting)
            },
            { threshold: 0.2 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [ref])
    useEffect(() => {
        if (typeof document === "undefined") return
        const sync = () => setPageOn(document.visibilityState !== "hidden")
        sync()
        document.addEventListener("visibilitychange", sync)
        return () => document.removeEventListener("visibilitychange", sync)
    }, [])
    return { seen, pageOn }
}

type Phase = "veiled" | "gather" | "arriving" | "rested"

type Pose = {
    X: number
    Y: number
    lift: number
    deg: number
    k: number
    flip: number
    curve: number
    alpha: number
}

// ---------- live branch ----------

function ShingleLive(p: ShingleProps) {
    const fan = { ...FAN_BASE, ...p.fan }
    const look = { ...LOOK_BASE, ...p.look }
    const arr = { ...ARRIVAL_BASE, ...p.arrival }
    const hov = { ...HOVER_BASE, ...p.hover }
    const bub = { ...BUBBLE_BASE, ...p.bubble }

    const rootRef = useRef<HTMLDivElement>(null)
    const faces = useRef<(HTMLDivElement | null)[]>([])
    const vids = useRef<(HTMLVideoElement | null)[]>([])
    const tag = "shg" + useId().replace(/[^a-zA-Z0-9]/g, "")
    const calm = useCalmPreference()
    const { seen, pageOn } = useWatch(rootRef)

    const list = useMemo(() => tidy(p.cards), [p.cards])
    const n = list.length
    const mid = (n - 1) / 2
    const sliceCount = Math.max(4, Math.min(28, Math.round(fan.slices)))

    const [phase, setPhase] = useState<Phase>("veiled")
    const [hot, setHot] = useState(-1)

    const D = Math.max(200, arr.duration)
    const waitFor = (i: number) => {
        if (arr.style === "deal") return Math.abs(i - mid) * arr.stagger
        if (arr.style === "sweep") return (n - 1 - i) * arr.stagger
        return i * arr.stagger
    }
    let latest = 0
    for (let i = 0; i < n; i++) latest = Math.max(latest, waitFor(i))
    const shineEnd = arr.shine ? D * 0.55 + 1000 : 0
    const settleAt = latest + Math.max(D * 1.3, shineEnd) + 120
    const gatherFor = 560 + n * 28

    useEffect(() => {
        if (calm) {
            setPhase("rested")
            return
        }
        if (phase === "veiled") {
            if (!seen) return
            const id = setTimeout(
                () => setPhase(arr.style === "deal" ? "gather" : "arriving"),
                Math.max(0, arr.delay)
            )
            return () => clearTimeout(id)
        }
        if (phase === "gather") {
            const id = setTimeout(
                () => setPhase("arriving"),
                gatherFor + Math.max(0, arr.hold)
            )
            return () => clearTimeout(id)
        }
        if (phase === "arriving") {
            const id = setTimeout(() => setPhase("rested"), settleAt)
            return () => clearTimeout(id)
        }
        if (phase === "rested" && !seen && arr.replay) {
            setHot(-1)
            setPhase("veiled")
        }
    }, [
        calm,
        seen,
        phase,
        arr.style,
        arr.delay,
        arr.hold,
        arr.replay,
        gatherFor,
        settleAt,
    ])

    const running = seen && pageOn && !calm
    useEffect(() => {
        const go = running && phase !== "veiled"
        vids.current.forEach((v) => {
            if (!v) return
            if (go) {
                const pr = v.play()
                if (pr && typeof pr.catch === "function") pr.catch(() => {})
            } else v.pause()
        })
    }, [running, phase, list])

    const live = phase === "rested" ? hot : -1

    const settleFace = (i: number) => {
        const face = faces.current[i]
        if (face) face.style.transform = "rotateX(0deg) rotateY(0deg)"
    }

    const steerFace = (e: React.PointerEvent<HTMLElement>, i: number) => {
        if (calm || phase !== "rested") return
        const face = faces.current[i]
        if (!face) return
        const r = e.currentTarget.getBoundingClientRect()
        if (!r.width || !r.height) return
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        face.style.setProperty("--gx", `${((px + 0.5) * 100).toFixed(1)}%`)
        face.style.setProperty("--gy", `${((py + 0.5) * 100).toFixed(1)}%`)
        if (!hov.tilt3D) return
        face.style.transform = `rotateX(${(-py * hov.tiltDepth).toFixed(
            2
        )}deg) rotateY(${(px * hov.tiltDepth).toFixed(2)}deg)`
    }

    const enter = (i: number) => setHot(i)
    const leave = (i: number) => {
        settleFace(i)
        setHot((h) => (h === i ? -1 : h))
    }

    const shadowRest = `0 ${look.shadow * 0.5}px ${look.shadow}px -${
        look.shadow * 0.35
    }px rgba(0,0,0,${look.shadowAlpha})`
    const shadowHot = `0 ${look.shadow}px ${look.shadow * 1.8}px -${
        look.shadow * 0.4
    }px rgba(0,0,0,${Math.min(1, look.shadowAlpha * 1.35)})`

    const floatOn = hov.float && !calm && phase === "rested" && running
    const tailSide =
        bub.align === "start"
            ? { left: 14 }
            : bub.align === "end"
              ? { right: 14 }
              : { left: "calc(50% - 7px)" }
    const anchor: React.CSSProperties =
        bub.align === "start"
            ? { left: "6%" }
            : bub.align === "end"
              ? { right: "6%" }
              : { left: "50%" }
    const popOrigin =
        bub.align === "start"
            ? "20px 100%"
            : bub.align === "end"
              ? "calc(100% - 20px) 100%"
              : "50% 100%"

    const keyframes =
        `@keyframes ${tag}-bob{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,calc(var(--bob) * -1),0)}}` +
        `@keyframes ${tag}-hop{0%{transform:translate3d(0,0,0);animation-timing-function:cubic-bezier(.2,.7,.35,1)}40%{transform:translate3d(0,calc(var(--hop) * -1),0);animation-timing-function:cubic-bezier(.55,0,.7,.45)}78%{transform:translate3d(0,calc(var(--hop) * .06),0);animation-timing-function:cubic-bezier(.3,0,.4,1)}100%{transform:translate3d(0,0,0)}}` +
        `@keyframes ${tag}-shine{0%{background-position:130% 0}100%{background-position:-30% 0}}`

    return (
        <div
            ref={rootRef}
            role="list"
            onPointerLeave={() => setHot(-1)}
            style={
                {
                    ...p.style,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    containerType: "size",
                    background: look.background,
                    overflow: "visible",
                    ["--s" as any]: cardUnit(n, fan),
                } as React.CSSProperties
            }
        >
            <style>{keyframes}</style>
            {list.map((c, i) => {
                const rest = poseAt(i, n, fan)
                const isHot = live === i
                let push = 0
                if (live >= 0 && i !== live) {
                    const gap = Math.abs(i - live)
                    push =
                        Math.sign(i - live) *
                        (hov.spread / 100) *
                        Math.pow(0.62, gap - 1)
                }

                const pose: Pose = {
                    X: rest.x + push,
                    Y: rest.y,
                    lift: 0,
                    deg: rest.deg,
                    k: rest.k,
                    flip: 0,
                    curve: fan.curve,
                    alpha: 1,
                }

                const deckDeg = (i - mid) * 1.6 + (i % 2 === 0 ? -0.8 : 0.8)
                if (phase === "veiled" || phase === "gather") {
                    if (arr.style === "deal") {
                        pose.X = (i - mid) * 0.018
                        pose.Y = phase === "gather" ? 0.06 - i * 0.004 : 0.7
                        pose.deg = phase === "gather" ? deckDeg : deckDeg * 3
                        pose.k = phase === "gather" ? 0.84 : 0.66
                        pose.curve = 0
                        pose.alpha = phase === "gather" ? 1 : 0
                    } else if (arr.style === "flip") {
                        pose.Y = rest.y - 0.22
                        pose.deg = rest.deg * 0.3
                        pose.k = rest.k * 0.92
                        pose.flip = 180
                        pose.curve = 0
                        pose.alpha = 0
                    } else if (arr.style === "rise") {
                        pose.Y = rest.y + 1.2
                        pose.deg = rest.deg * -2
                        pose.k = rest.k * 0.88
                        pose.curve = fan.curve * -0.7
                        pose.alpha = 0
                    } else {
                        pose.X = -((n - 1) / 2) - 1.5
                        pose.deg = -24
                        pose.k = rest.k * 0.9
                        pose.curve = 0
                        pose.alpha = 0
                    }
                } else if (isHot) {
                    pose.deg = rest.deg * (1 - hov.straighten / 100)
                    pose.k = rest.k * hov.scale
                    pose.lift = hov.lift
                    pose.curve = fan.curve * (1 - hov.uncurl / 100)
                }

                const w = waitFor(i)
                const fade = Math.round(Math.min(260, D * 0.25))
                let tSlot = "none"
                let tSway = "none"
                let tTilt = "none"
                let tFlip = "none"
                let tStrip = "none"
                if (phase === "gather") {
                    const g = i * 28
                    tSlot = `transform 560ms ${EASE_GATHER} ${g}ms, opacity 240ms ease ${g}ms`
                    tSway = `transform 560ms ${EASE_GATHER} ${g}ms`
                    tTilt = `transform 640ms ${EASE_GATHER} ${g}ms`
                } else if (phase === "arriving") {
                    tSlot = `transform ${D}ms ${EASE_GLIDE} ${w}ms, opacity ${fade}ms ease ${w}ms`
                    tSway = `transform ${D}ms ${EASE_ROLL} ${w}ms`
                    tTilt = `transform ${Math.round(D * 1.1)}ms ${EASE_TWIST} ${w}ms`
                    tFlip = `transform ${D}ms cubic-bezier(.2,1.15,.35,1) ${w}ms`
                    const cw = Math.round(w + D * 0.4)
                    tStrip = `transform ${Math.round(D * 0.9)}ms ${EASE_CURL} ${cw}ms, opacity ${Math.round(D * 0.9)}ms ease ${cw}ms`
                } else if (phase === "rested") {
                    tSlot = `transform 560ms ${EASE_SPRING}, opacity 300ms ease, z-index 0s linear ${
                        isHot ? 0 : 280
                    }ms`
                    tSway = `transform 560ms ${EASE_SPRING}`
                    tTilt = `transform 560ms ${EASE_SPRING}`
                    tFlip = "transform 400ms ease"
                    tStrip = `transform 620ms cubic-bezier(.3,1.35,.5,1), opacity 500ms ease`
                }

                const z = isHot ? 999 : layerOf(i, n, fan.stacking)
                const picture = pictureOf(c)
                const clip = calm ? "" : (c.videoUrl || "").trim()
                const showBubble = phase === "rested" && (isHot || !!c.pinned)
                const rise = bubbleRise(pose.k, pose.deg, fan.ratio)
                const dimmed = live >= 0 && !isHot
                const handle = (c.handle || "").trim()
                const href = (c.link || "").trim()
                const backdrop = BACKDROPS[i % BACKDROPS.length]
                const hopping =
                    phase === "arriving" &&
                    (arr.style === "deal" || arr.style === "sweep")
                const shining = phase === "arriving" && arr.shine
                const strips = clip
                    ? cylinderStrips(1, 0)
                    : cylinderStrips(sliceCount, pose.curve)
                const pieces = strips.length

                const overlays = (
                    <>
                        {hov.sheen && (
                            <div
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    pointerEvents: "none",
                                    background:
                                        "radial-gradient(circle at var(--gx,50%) var(--gy,30%), rgba(255,255,255,0.38), rgba(255,255,255,0) 58%)",
                                    opacity: isHot ? 1 : 0,
                                    transition: "opacity 320ms ease",
                                }}
                            />
                        )}
                        {shining && (
                            <div
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    pointerEvents: "none",
                                    backgroundImage:
                                        "linear-gradient(105deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 60%)",
                                    backgroundSize: "300% 100%",
                                    backgroundRepeat: "no-repeat",
                                    mixBlendMode: "soft-light",
                                    animation: `${tag}-shine 1000ms cubic-bezier(.4,0,.2,1) ${Math.round(
                                        w + D * 0.55
                                    )}ms both`,
                                }}
                            />
                        )}
                        <div
                            aria-hidden
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                background: "#000",
                                opacity: dimmed ? hov.dim / 100 : 0,
                                transition: "opacity 360ms ease",
                            }}
                        />
                    </>
                )

                const media = (
                    <>
                        {picture ? (
                            <img
                                src={picture}
                                srcSet={c.image && c.image.srcSet}
                                alt=""
                                draggable={false}
                                onError={(e) =>
                                    (e.currentTarget.style.visibility =
                                        "hidden")
                                }
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                    userSelect: "none",
                                }}
                            />
                        ) : null}
                        {clip ? (
                            <video
                                ref={(v) => (vids.current[i] = v)}
                                src={clip}
                                poster={picture || undefined}
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                        ) : null}
                    </>
                )

                const face = (
                    <div
                        ref={(el) => (faces.current[i] = el)}
                        style={{
                            position: "absolute",
                            inset: 0,
                            transformStyle: "preserve-3d",
                            transform: "rotateX(0deg) rotateY(0deg)",
                            transition: "transform 260ms ease-out",
                        }}
                    >
                        <div
                            aria-hidden
                            style={{
                                position: "absolute",
                                inset: "3% 4%",
                                borderRadius: look.radius,
                                boxShadow: isHot ? shadowHot : shadowRest,
                                transform: `translateZ(calc(var(--s) * ${Math.min(
                                    0,
                                    ...strips.map((s) => s.dz)
                                ).toFixed(4)} - 2px))`,
                                transition: `box-shadow 420ms ease${
                                    tStrip === "none"
                                        ? ""
                                        : ", " + tStrip.split(", opacity")[0]
                                }`,
                            }}
                        />
                        {strips.map((s, j) => (
                            <div
                                key={j}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    bottom: 0,
                                    left: `${(j * 100) / pieces}%`,
                                    width:
                                        pieces > 1
                                            ? `calc(${100 / pieces}% + 0.8px)`
                                            : "100%",
                                    overflow: "hidden",
                                    backfaceVisibility: "hidden",
                                    WebkitBackfaceVisibility: "hidden",
                                    transform: `translate3d(calc(var(--s) * ${s.dx.toFixed(
                                        5
                                    )}), 0, calc(var(--s) * ${s.dz.toFixed(
                                        5
                                    )})) rotateY(${s.ry.toFixed(3)}deg)`,
                                    transition: tStrip,
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        bottom: 0,
                                        left: `calc(var(--s) * ${(-j / pieces).toFixed(5)})`,
                                        width: "var(--s)",
                                        borderRadius: look.radius,
                                        overflow: "hidden",
                                        background: backdrop,
                                        outline:
                                            look.outlineWidth > 0
                                                ? `${look.outlineWidth}px solid ${look.outlineColor}`
                                                : undefined,
                                        outlineOffset:
                                            look.outlineWidth > 0
                                                ? -look.outlineWidth
                                                : undefined,
                                    }}
                                >
                                    {media}
                                    {overlays}
                                    {pieces > 1 && (
                                        <div
                                            aria-hidden
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                pointerEvents: "none",
                                                background: "#000",
                                                opacity: (
                                                    (look.shade / 100) *
                                                    0.55 *
                                                    s.lean
                                                ).toFixed(3),
                                                transition: tStrip,
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )

                const shared = {
                    onPointerEnter: () => enter(i),
                    onPointerLeave: () => leave(i),
                    onPointerMove: (e: React.PointerEvent<HTMLElement>) =>
                        steerFace(e, i),
                    onFocus: () => enter(i),
                    onBlur: () => leave(i),
                    "aria-label": handle
                        ? `${bub.prefix}${handle}`
                        : `Card ${i + 1}`,
                    style: {
                        position: "absolute" as const,
                        inset: 0,
                        display: "block",
                        cursor: href ? "pointer" : "default",
                        outline: "none",
                        WebkitTapHighlightColor: "transparent",
                        textDecoration: "none",
                        transformStyle: "preserve-3d" as const,
                    },
                }

                return (
                    <div
                        key={i}
                        role="listitem"
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: `${50 + fan.rowShift}%`,
                            width: "var(--s)",
                            height: `calc(var(--s) * ${fan.ratio})`,
                            marginLeft: "calc(var(--s) * -0.5)",
                            marginTop: `calc(var(--s) * ${-fan.ratio / 2})`,
                            zIndex: z,
                            opacity: pose.alpha,
                            transform: `translate3d(calc(var(--s) * ${pose.X.toFixed(
                                4
                            )}), 0, 0)`,
                            transition: tSlot,
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                transform: `translate3d(0, calc(var(--s) * ${pose.Y.toFixed(
                                    4
                                )} - ${pose.lift}px), 0)`,
                                transition: tSway,
                            }}
                        >
                            <div
                                style={
                                    {
                                        position: "absolute",
                                        inset: 0,
                                        ["--hop" as any]: `calc(var(--s) * ${(
                                            0.18 +
                                            Math.abs(i - mid) * 0.05
                                        ).toFixed(3)})`,
                                        animation: hopping
                                            ? `${tag}-hop ${D}ms linear ${w}ms both`
                                            : undefined,
                                    } as React.CSSProperties
                                }
                            >
                                <div
                                    style={
                                        {
                                            position: "absolute",
                                            inset: 0,
                                            ["--bob" as any]: `${hov.floatAmp}px`,
                                            animation: hov.float
                                                ? `${tag}-bob ${(
                                                      5.4 +
                                                      (i % 3) * 0.9
                                                  ).toFixed(1)}s ease-in-out ${(
                                                      -i * 0.85
                                                  ).toFixed(2)}s infinite`
                                                : undefined,
                                            animationPlayState: floatOn
                                                ? "running"
                                                : "paused",
                                        } as React.CSSProperties
                                    }
                                >
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            perspective: "calc(var(--s) * 2.8)",
                                            transform: `rotate(${pose.deg.toFixed(
                                                3
                                            )}deg) scale(${pose.k.toFixed(4)})`,
                                            transformOrigin: "50% 50%",
                                            transition: tTilt,
                                        }}
                                    >
                                        <div
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                transformStyle: "preserve-3d",
                                                transform: `rotateY(${pose.flip}deg)`,
                                                transition: tFlip,
                                            }}
                                        >
                                            {href ? (
                                                <a
                                                    href={href}
                                                    target={
                                                        c.newTab
                                                            ? "_blank"
                                                            : undefined
                                                    }
                                                    rel={
                                                        c.newTab
                                                            ? "noopener noreferrer"
                                                            : undefined
                                                    }
                                                    {...shared}
                                                >
                                                    {face}
                                                </a>
                                            ) : (
                                                <div tabIndex={0} {...shared}>
                                                    {face}
                                                </div>
                                            )}
                                            <div
                                                aria-hidden
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    borderRadius: look.radius,
                                                    backgroundColor:
                                                        look.backColor,
                                                    backgroundImage:
                                                        "radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1.4px)",
                                                    backgroundSize: "12px 12px",
                                                    transform:
                                                        "rotateY(180deg) translateZ(1px)",
                                                    backfaceVisibility:
                                                        "hidden",
                                                    WebkitBackfaceVisibility:
                                                        "hidden",
                                                    pointerEvents: "none",
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {handle ? (
                                        <div
                                            aria-hidden
                                            style={{
                                                position: "absolute",
                                                bottom: `calc(100% + ${bub.gap}px)`,
                                                ...anchor,
                                                pointerEvents: "none",
                                                zIndex: 2,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    transformOrigin: popOrigin,
                                                    transform: `translate(${
                                                        bub.align === "center"
                                                            ? "-50%"
                                                            : "0"
                                                    }, calc(var(--s) * ${rise.toFixed(
                                                        4
                                                    )} + ${showBubble ? 0 : 12}px)) scale(${
                                                        showBubble ? 1 : 0.5
                                                    })`,
                                                    opacity: showBubble ? 1 : 0,
                                                    transition: `transform 480ms ${EASE_POP}, opacity 220ms ease`,
                                                    filter: bub.shadow
                                                        ? "drop-shadow(0 8px 14px rgba(0,0,0,0.18))"
                                                        : undefined,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        position: "relative",
                                                        background:
                                                            c.tint || "#2F6BFF",
                                                        color: bub.color,
                                                        padding: `${bub.padY}px ${bub.padX}px`,
                                                        borderRadius:
                                                            bub.radius,
                                                        whiteSpace: "nowrap",
                                                        ...p.labelFont,
                                                    }}
                                                >
                                                    {bub.prefix}
                                                    {handle}
                                                    <svg
                                                        width="14"
                                                        height="10"
                                                        viewBox="0 0 14 10"
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            top: "100%",
                                                            marginTop: -1,
                                                            ...tailSide,
                                                            display: "block",
                                                        }}
                                                    >
                                                        <path
                                                            d="M0 0H14L5.2 8.9C4.3 9.8 3 9.2 3 7.9V0Z"
                                                            fill={
                                                                c.tint ||
                                                                "#2F6BFF"
                                                            }
                                                        />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ---------- static branch (plain divs only) ----------

function ShingleStill(p: ShingleProps) {
    const fan = { ...FAN_BASE, ...p.fan }
    const look = { ...LOOK_BASE, ...p.look }
    const bub = { ...BUBBLE_BASE, ...p.bubble }
    const list = tidy(p.cards)
    const n = list.length
    const sliceCount = Math.max(4, Math.min(28, Math.round(fan.slices)))

    return (
        <div
            style={
                {
                    ...p.style,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    containerType: "size",
                    background: look.background,
                    overflow: "visible",
                    ["--s" as any]: cardUnit(n, fan),
                } as React.CSSProperties
            }
        >
            {list.map((c, i) => {
                const rest = poseAt(i, n, fan)
                const picture = pictureOf(c)
                const handle = (c.handle || "").trim()
                const rise = bubbleRise(rest.k, rest.deg, fan.ratio)
                const strips = (c.videoUrl || "").trim()
                    ? cylinderStrips(1, 0)
                    : cylinderStrips(sliceCount, fan.curve)
                const pieces = strips.length
                return (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: `${50 + fan.rowShift}%`,
                            width: "var(--s)",
                            height: `calc(var(--s) * ${fan.ratio})`,
                            marginLeft: "calc(var(--s) * -0.5)",
                            marginTop: `calc(var(--s) * ${-fan.ratio / 2})`,
                            zIndex: layerOf(i, n, fan.stacking),
                            transform: `translate(calc(var(--s) * ${rest.x.toFixed(
                                4
                            )}), calc(var(--s) * ${rest.y.toFixed(4)}))`,
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                perspective: "calc(var(--s) * 2.8)",
                                transform: `rotate(${rest.deg.toFixed(
                                    3
                                )}deg) scale(${rest.k.toFixed(4)})`,
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    transformStyle: "preserve-3d",
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: "3% 4%",
                                        borderRadius: look.radius,
                                        boxShadow: `0 ${look.shadow * 0.5}px ${
                                            look.shadow
                                        }px -${look.shadow * 0.35}px rgba(0,0,0,${
                                            look.shadowAlpha
                                        })`,
                                        transform: `translateZ(calc(var(--s) * ${Math.min(
                                            0,
                                            ...strips.map((s) => s.dz)
                                        ).toFixed(4)} - 2px))`,
                                    }}
                                />
                                {strips.map((s, j) => (
                                    <div
                                        key={j}
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            bottom: 0,
                                            left: `${(j * 100) / pieces}%`,
                                            width:
                                                pieces > 1
                                                    ? `calc(${100 / pieces}% + 0.8px)`
                                                    : "100%",
                                            overflow: "hidden",
                                            transform: `translate3d(calc(var(--s) * ${s.dx.toFixed(
                                                5
                                            )}), 0, calc(var(--s) * ${s.dz.toFixed(
                                                5
                                            )})) rotateY(${s.ry.toFixed(3)}deg)`,
                                        }}
                                    >
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                bottom: 0,
                                                left: `calc(var(--s) * ${(-j / pieces).toFixed(5)})`,
                                                width: "var(--s)",
                                                borderRadius: look.radius,
                                                overflow: "hidden",
                                                background:
                                                    BACKDROPS[
                                                        i % BACKDROPS.length
                                                    ],
                                                outline:
                                                    look.outlineWidth > 0
                                                        ? `${look.outlineWidth}px solid ${look.outlineColor}`
                                                        : undefined,
                                                outlineOffset:
                                                    look.outlineWidth > 0
                                                        ? -look.outlineWidth
                                                        : undefined,
                                            }}
                                        >
                                            {picture ? (
                                                <img
                                                    src={picture}
                                                    alt=""
                                                    style={{
                                                        position: "absolute",
                                                        inset: 0,
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                        display: "block",
                                                    }}
                                                />
                                            ) : null}
                                            {pieces > 1 && (
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        inset: 0,
                                                        background: "#000",
                                                        opacity: (
                                                            (look.shade / 100) *
                                                            0.55 *
                                                            s.lean
                                                        ).toFixed(3),
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {handle && c.pinned ? (
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: `calc(100% + ${bub.gap}px)`,
                                    ...(bub.align === "start"
                                        ? { left: "6%" }
                                        : bub.align === "end"
                                          ? { right: "6%" }
                                          : { left: "50%" }),
                                    zIndex: 2,
                                    transform: `translate(${
                                        bub.align === "center" ? "-50%" : "0"
                                    }, calc(var(--s) * ${rise.toFixed(4)}))`,
                                }}
                            >
                                <div
                                    style={{
                                        position: "relative",
                                        background: c.tint || "#2F6BFF",
                                        color: bub.color,
                                        padding: `${bub.padY}px ${bub.padX}px`,
                                        borderRadius: bub.radius,
                                        whiteSpace: "nowrap",
                                        ...p.labelFont,
                                    }}
                                >
                                    {bub.prefix}
                                    {handle}
                                    <svg
                                        width="14"
                                        height="10"
                                        viewBox="0 0 14 10"
                                        style={{
                                            position: "absolute",
                                            top: "100%",
                                            marginTop: -1,
                                            display: "block",
                                            ...(bub.align === "start"
                                                ? { left: 14 }
                                                : bub.align === "end"
                                                  ? { right: 14 }
                                                  : {
                                                        left: "calc(50% - 7px)",
                                                    }),
                                        }}
                                    >
                                        <path
                                            d="M0 0H14L5.2 8.9C4.3 9.8 3 9.2 3 7.9V0Z"
                                            fill={c.tint || "#2F6BFF"}
                                        />
                                    </svg>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )
            })}
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
export default function Shingle(props: ShingleProps) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <ShingleStill {...props} />
    return <ShingleLive {...props} />
}

addPropertyControls(Shingle, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 14,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…",
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "Optional .mp4 (shown flat)",
                },
                handle: {
                    type: ControlType.String,
                    title: "Username",
                    defaultValue: "username",
                },
                tint: {
                    type: ControlType.Color,
                    title: "Bubble",
                    defaultValue: "#2F6BFF",
                },
                pinned: {
                    type: ControlType.Boolean,
                    title: "Pin Bubble",
                    defaultValue: false,
                    enabledTitle: "Yes",
                    disabledTitle: "No",
                },
                link: { type: ControlType.Link, title: "Link" },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: true,
                    hidden: (c: any) => !c.link,
                },
            },
        },
        defaultValue: SEED,
    },
    fan: {
        type: ControlType.Object,
        title: "Fan",
        controls: {
            curve: {
                type: ControlType.Number,
                title: "Card Curve",
                min: -90,
                max: 90,
                step: 1,
                unit: "°",
                defaultValue: FAN_BASE.curve,
            },
            slices: {
                type: ControlType.Number,
                title: "Curve Detail",
                min: 4,
                max: 28,
                step: 1,
                defaultValue: FAN_BASE.slices,
            },
            overlap: {
                type: ControlType.Number,
                title: "Overlap",
                min: 0,
                max: 70,
                step: 1,
                unit: "%",
                defaultValue: FAN_BASE.overlap,
            },
            tiltFrom: {
                type: ControlType.Number,
                title: "Tilt Start",
                min: -30,
                max: 30,
                step: 0.5,
                unit: "°",
                defaultValue: FAN_BASE.tiltFrom,
            },
            tiltTo: {
                type: ControlType.Number,
                title: "Tilt End",
                min: -30,
                max: 30,
                step: 0.5,
                unit: "°",
                defaultValue: FAN_BASE.tiltTo,
            },
            depth: {
                type: ControlType.Number,
                title: "Depth",
                min: 0,
                max: 40,
                step: 1,
                unit: "%",
                defaultValue: FAN_BASE.depth,
            },
            arc: {
                type: ControlType.Number,
                title: "Arc",
                min: -40,
                max: 40,
                step: 1,
                unit: "%",
                defaultValue: FAN_BASE.arc,
            },
            lean: {
                type: ControlType.Number,
                title: "Lean",
                min: -40,
                max: 40,
                step: 1,
                unit: "%",
                defaultValue: FAN_BASE.lean,
            },
            ratio: {
                type: ControlType.Number,
                title: "Height Ratio",
                min: 0.5,
                max: 2,
                step: 0.01,
                defaultValue: FAN_BASE.ratio,
            },
            widthFill: {
                type: ControlType.Number,
                title: "Width Fill",
                min: 30,
                max: 120,
                step: 1,
                unit: "%",
                defaultValue: FAN_BASE.widthFill,
            },
            heightFill: {
                type: ControlType.Number,
                title: "Height Fill",
                min: 20,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: FAN_BASE.heightFill,
            },
            rowShift: {
                type: ControlType.Number,
                title: "Offset Y",
                min: -30,
                max: 30,
                step: 1,
                unit: "%",
                defaultValue: FAN_BASE.rowShift,
            },
            stacking: {
                type: ControlType.Enum,
                title: "On Top",
                options: ["right", "left", "centre", "edges"],
                optionTitles: ["Right", "Left", "Centre", "Edges"],
                defaultValue: FAN_BASE.stacking,
            },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: LOOK_BASE.background,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 80,
                step: 1,
                defaultValue: LOOK_BASE.radius,
            },
            shade: {
                type: ControlType.Number,
                title: "Curve Shade",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: LOOK_BASE.shade,
            },
            shadow: {
                type: ControlType.Number,
                title: "Shadow",
                min: 0,
                max: 80,
                step: 1,
                defaultValue: LOOK_BASE.shadow,
            },
            shadowAlpha: {
                type: ControlType.Number,
                title: "Shadow Alpha",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: LOOK_BASE.shadowAlpha,
            },
            backColor: {
                type: ControlType.Color,
                title: "Card Back",
                defaultValue: LOOK_BASE.backColor,
            },
            outlineWidth: {
                type: ControlType.Number,
                title: "Outline",
                min: 0,
                max: 12,
                step: 1,
                defaultValue: LOOK_BASE.outlineWidth,
            },
            outlineColor: {
                type: ControlType.Color,
                title: "Outline Color",
                defaultValue: LOOK_BASE.outlineColor,
                hidden: (l: any) => !l.outlineWidth,
            },
        },
    },
    arrival: {
        type: ControlType.Object,
        title: "Entrance",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["deal", "flip", "rise", "sweep"],
                optionTitles: ["Deal", "Flip", "Rise", "Sweep"],
                defaultValue: ARRIVAL_BASE.style,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                min: 300,
                max: 3000,
                step: 50,
                unit: "ms",
                defaultValue: ARRIVAL_BASE.duration,
            },
            stagger: {
                type: ControlType.Number,
                title: "Stagger",
                min: 0,
                max: 400,
                step: 5,
                unit: "ms",
                defaultValue: ARRIVAL_BASE.stagger,
            },
            delay: {
                type: ControlType.Number,
                title: "Delay",
                min: 0,
                max: 3000,
                step: 50,
                unit: "ms",
                defaultValue: ARRIVAL_BASE.delay,
            },
            hold: {
                type: ControlType.Number,
                title: "Deck Hold",
                min: 0,
                max: 2000,
                step: 20,
                unit: "ms",
                defaultValue: ARRIVAL_BASE.hold,
                hidden: (a: any) => a.style !== "deal",
            },
            shine: {
                type: ControlType.Boolean,
                title: "Shine",
                defaultValue: ARRIVAL_BASE.shine,
            },
            replay: {
                type: ControlType.Boolean,
                title: "Replay",
                defaultValue: ARRIVAL_BASE.replay,
                enabledTitle: "On Re-enter",
                disabledTitle: "Once",
            },
        },
    },
    hover: {
        type: ControlType.Object,
        title: "Hover",
        controls: {
            lift: {
                type: ControlType.Number,
                title: "Lift",
                min: 0,
                max: 80,
                step: 1,
                defaultValue: HOVER_BASE.lift,
            },
            spread: {
                type: ControlType.Number,
                title: "Push Aside",
                min: 0,
                max: 80,
                step: 1,
                unit: "%",
                defaultValue: HOVER_BASE.spread,
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                min: 1,
                max: 1.4,
                step: 0.01,
                defaultValue: HOVER_BASE.scale,
            },
            straighten: {
                type: ControlType.Number,
                title: "Straighten",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: HOVER_BASE.straighten,
            },
            uncurl: {
                type: ControlType.Number,
                title: "Uncurl",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: HOVER_BASE.uncurl,
            },
            tilt3D: {
                type: ControlType.Boolean,
                title: "3D Tilt",
                defaultValue: HOVER_BASE.tilt3D,
            },
            tiltDepth: {
                type: ControlType.Number,
                title: "Tilt Amount",
                min: 0,
                max: 30,
                step: 1,
                unit: "°",
                defaultValue: HOVER_BASE.tiltDepth,
                hidden: (h: any) => !h.tilt3D,
            },
            sheen: {
                type: ControlType.Boolean,
                title: "Sheen",
                defaultValue: HOVER_BASE.sheen,
            },
            dim: {
                type: ControlType.Number,
                title: "Dim Others",
                min: 0,
                max: 80,
                step: 1,
                unit: "%",
                defaultValue: HOVER_BASE.dim,
            },
            float: {
                type: ControlType.Boolean,
                title: "Idle Float",
                defaultValue: HOVER_BASE.float,
            },
            floatAmp: {
                type: ControlType.Number,
                title: "Float Amount",
                min: 0,
                max: 20,
                step: 1,
                defaultValue: HOVER_BASE.floatAmp,
                hidden: (h: any) => !h.float,
            },
        },
    },
    bubble: {
        type: ControlType.Object,
        title: "Bubble",
        controls: {
            prefix: {
                type: ControlType.String,
                title: "Prefix",
                defaultValue: BUBBLE_BASE.prefix,
            },
            color: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: BUBBLE_BASE.color,
            },
            align: {
                type: ControlType.Enum,
                title: "Align",
                options: ["start", "center", "end"],
                optionTitles: ["Start", "Center", "End"],
                displaySegmentedControl: true,
                defaultValue: BUBBLE_BASE.align,
            },
            padX: {
                type: ControlType.Number,
                title: "Padding X",
                min: 0,
                max: 40,
                step: 1,
                defaultValue: BUBBLE_BASE.padX,
            },
            padY: {
                type: ControlType.Number,
                title: "Padding Y",
                min: 0,
                max: 30,
                step: 1,
                defaultValue: BUBBLE_BASE.padY,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 999,
                step: 1,
                defaultValue: BUBBLE_BASE.radius,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: -40,
                max: 60,
                step: 1,
                defaultValue: BUBBLE_BASE.gap,
            },
            shadow: {
                type: ControlType.Boolean,
                title: "Shadow",
                defaultValue: BUBBLE_BASE.shadow,
            },
        },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Bubble Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 17,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
})
