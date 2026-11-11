import * as React from "react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type CardItem = {
    media?: "Image" | "Video"
    image?: { src?: string; srcSet?: string; alt?: string }
    imageUrl?: string
    video?: string
    videoUrl?: string
    poster?: { src?: string; srcSet?: string; alt?: string }
    posterUrl?: string
    title?: string
    caption?: string
    link?: string
    newTab?: boolean
}

type DeckCfg = {
    width: number
    height: number
    radius: number
    layers: number
    gap: number
    shrink: number
    shade: number
    shadow: boolean
    clip: boolean
}

type PhysicsCfg = {
    autoplay: boolean
    interval: number
    gravity: number
    push: number
    tilt: number
    stiffness: number
    bounce: number
    throwPower: number
    hoverLean: boolean
    pauseOnHover: boolean
    draggable: boolean
    clickAction: "Next Card" | "Open Link" | "None"
}

type CaptionCfg = {
    show: boolean
    titleFont?: React.CSSProperties
    captionFont?: React.CSSProperties
    color: string
    padding: number
}

const DECK_DEFAULTS: DeckCfg = {
    width: 420,
    height: 420,
    radius: 10,
    layers: 2,
    gap: 16,
    shrink: 0.06,
    shade: 0.35,
    shadow: true,
    clip: true,
}

const PHYSICS_DEFAULTS: PhysicsCfg = {
    autoplay: true,
    interval: 2.4,
    gravity: 2600,
    push: 240,
    tilt: -12,
    stiffness: 170,
    bounce: 0.2,
    throwPower: 1,
    hoverLean: true,
    pauseOnHover: true,
    draggable: true,
    clickAction: "Next Card",
}

const CAPTION_DEFAULTS: CaptionCfg = {
    show: false,
    color: "#FFFFFF",
    padding: 24,
}

const TITLE_FALLBACK: React.CSSProperties = {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    lineHeight: "1.1em",
}
const CAPTION_FALLBACK: React.CSSProperties = {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.02em",
    lineHeight: "1.3em",
}

const UNSPLASH = (id: string) =>
    `https://images.unsplash.com/${id}?w=900&q=80&auto=format&fit=crop`

const DEFAULT_CARDS: CardItem[] = [
    {
        media: "Image",
        imageUrl: UNSPLASH("photo-1505740420928-5e560c06d30e"),
        title: "Sound Object",
        caption: "Product",
    },
    {
        media: "Image",
        imageUrl: UNSPLASH("photo-1507003211169-0a1dd7228f2d"),
        title: "Portrait Study",
        caption: "People",
    },
    {
        media: "Video",
        videoUrl:
            "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        title: "In Bloom",
        caption: "Motion",
    },
    {
        media: "Image",
        imageUrl: UNSPLASH("photo-1523275335684-37898b6baf30"),
        title: "Daily Hours",
        caption: "Objects",
    },
    {
        media: "Image",
        imageUrl: UNSPLASH("photo-1441974231531-c6227db76b6e"),
        title: "Green Hour",
        caption: "Landscape",
    },
    {
        media: "Image",
        imageUrl: UNSPLASH("photo-1470071459604-3b5ec3a7fe05"),
        title: "Low Cloud",
        caption: "Landscape",
    },
]

/* ----------------------------- pure helpers ----------------------------- */

const clamp = (v: number, lo: number, hi: number) =>
    v < lo ? lo : v > hi ? hi : v
const unit = (v: number) => clamp(v, 0, 1)

const clipOf = (c: CardItem) => c?.video || c?.videoUrl || ""
const playsVideo = (c: CardItem) => c?.media === "Video" && !!clipOf(c)
const pictureOf = (c: CardItem) =>
    c?.media === "Video"
        ? c?.poster?.src || c?.posterUrl || ""
        : c?.image?.src || c?.imageUrl || ""
const srcSetOf = (c: CardItem) =>
    c?.media === "Video" ? c?.poster?.srcSet : c?.image?.srcSet

function settle(props: any) {
    return {
        cards: (Array.isArray(props.cards)
            ? props.cards
            : DEFAULT_CARDS) as CardItem[],
        deck: { ...DECK_DEFAULTS, ...(props.deck || {}) } as DeckCfg,
        physics: {
            ...PHYSICS_DEFAULTS,
            ...(props.physics || {}),
        } as PhysicsCfg,
        caption: {
            ...CAPTION_DEFAULTS,
            ...(props.caption || {}),
        } as CaptionCfg,
        background: props.background ?? "#0A0A0A",
    }
}

function frameBox(deck: DeckCfg): React.CSSProperties {
    const span = deck.layers * deck.gap
    return {
        position: "relative",
        width: `min(${deck.width}px, calc(100% - 32px))`,
        height: `min(${deck.height}px, calc(100% - ${32 + span}px))`,
        marginTop: span,
        flexShrink: 0,
    }
}

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Spillway(props: any) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StillDeck {...props} />
    return <LiveDeck {...props} />
}

/* ------------------------------ static path ------------------------------ */

function StillDeck(props: any) {
    const { cards, deck, caption, background } = settle(props)
    const n = cards.length
    const visible = Math.min(n, deck.layers + 1)
    const shadow = deck.shadow ? "0 28px 60px -24px rgba(0,0,0,0.65)" : "none"
    const titleStyle = { ...TITLE_FALLBACK, ...(caption.titleFont || {}) }
    const captionStyle = { ...CAPTION_FALLBACK, ...(caption.captionFont || {}) }

    const layers: React.ReactNode[] = []
    for (let depth = visible - 1; depth >= 0; depth--) {
        const item = cards[depth]
        const pic = pictureOf(item)
        const scale = 1 - depth * deck.shrink
        const veil =
            depth === 0
                ? 0
                : deck.shade * Math.min(1, depth / Math.max(1, deck.layers))
        layers.push(
            <div
                key={depth}
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: deck.radius,
                    overflow: "hidden",
                    boxShadow: shadow,
                    background: "#111",
                    transformOrigin: "50% 0%",
                    transform: `translateY(${-depth * deck.gap}px) scale(${scale})`,
                    zIndex: 10 - depth,
                }}
            >
                {pic ? (
                    <img
                        src={pic}
                        srcSet={srcSetOf(item)}
                        alt={item?.image?.alt || item?.title || ""}
                        draggable={false}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background:
                                "linear-gradient(160deg, #2a2a2a, #121212)",
                        }}
                    />
                )}
                {caption.show && (item?.title || item?.caption) ? (
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            padding: caption.padding,
                            color: caption.color,
                            background:
                                "linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0))",
                        }}
                    >
                        <div style={titleStyle}>{item?.title}</div>
                        <div
                            style={{
                                ...captionStyle,
                                marginTop: 6,
                                opacity: 0.8,
                            }}
                        >
                            {item?.caption}
                        </div>
                    </div>
                ) : null}
                {veil > 0 ? (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: "#000",
                            opacity: veil,
                        }}
                    />
                ) : null}
            </div>
        )
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                background,
                overflow: deck.clip ? "hidden" : "visible",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div style={frameBox(deck)}>
                    {n === 0 ? (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: deck.radius,
                                border: "1px dashed rgba(255,255,255,0.25)",
                                color: "rgba(255,255,255,0.6)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 13,
                                fontFamily: "Inter, system-ui, sans-serif",
                            }}
                        >
                            Add cards in the properties panel
                        </div>
                    ) : (
                        layers
                    )}
                </div>
            </div>
        </div>
    )
}

/* ------------------------------- live path ------------------------------- */

const MODE_REST = 0
const MODE_HELD = 1
const MODE_FALL = 2

type Body = {
    mode: number
    x: number
    y: number
    vx: number
    vy: number
    r: number
    vr: number
    d: number
    vd: number
    lx: number
    ly: number
    vlx: number
    vly: number
    alpha: number
    age: number
    seq: number
}

type Engine = {
    bodies: Body[]
    queue: number[]
    held: null | { i: number; tx: number; ty: number; gy: number }
    press: null | {
        id: number
        x: number
        y: number
        moved: boolean
        trail: { x: number; y: number; t: number }[]
    }
    hover: boolean
    lean: { x: number; y: number }
    gate: { seen: boolean; page: boolean; calm: boolean }
    raf: number
    timer: any
    last: number
    carry: number
    seq: number
    shownLead: number
    shownPlaying: boolean
    box: {
        w: number
        h: number
        cw: number
        ch: number
        fx: number
        fy: number
        below: number
    }
}

const freshBody = (depth: number): Body => ({
    mode: MODE_REST,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    r: 0,
    vr: 0,
    d: depth,
    vd: 0,
    lx: 0,
    ly: 0,
    vlx: 0,
    vly: 0,
    alpha: 1,
    age: 0,
    seq: 0,
})

const SUBSTEP = 1 / 240

function LiveDeck(props: any) {
    const resolved = settle(props)
    const { cards, deck, physics, caption, background } = resolved
    const n = cards.length

    const rootRef = useRef<HTMLDivElement>(null)
    const frameRef = useRef<HTMLDivElement>(null)
    const cardEls = useRef<(HTMLDivElement | null)[]>([])
    const veilEls = useRef<(HTMLDivElement | null)[]>([])
    const clipEls = useRef<(HTMLVideoElement | null)[]>([])

    const live = useRef(resolved)
    live.current = resolved

    const engineRef = useRef<Engine | null>(null)
    if (!engineRef.current) {
        engineRef.current = {
            bodies: [],
            queue: [],
            held: null,
            press: null,
            hover: false,
            lean: { x: 0, y: 0 },
            gate: { seen: false, page: true, calm: false },
            raf: 0,
            timer: 0,
            last: 0,
            carry: 0,
            seq: 0,
            shownLead: -1,
            shownPlaying: false,
            box: {
                w: 400,
                h: 400,
                cw: 700,
                ch: 700,
                fx: 350,
                fy: 350,
                below: 600,
            },
        }
    }

    const [ops] = useState(() => {
        const E = engineRef.current as Engine
        const permitted = () => E.gate.seen && E.gate.page

        const reshape = (total: number) => {
            if (E.bodies.length === total) return
            E.bodies = Array.from({ length: total }, (_, i) => freshBody(i))
            E.queue = Array.from({ length: total }, (_, i) => i)
            E.held = null
            E.press = null
        }

        const measure = () => {
            const root = rootRef.current
            const frame = frameRef.current
            if (!root || !frame) return
            const w = frame.offsetWidth || 400
            const h = frame.offsetHeight || 400
            E.box.w = w
            E.box.h = h
            E.box.cw = root.clientWidth
            E.box.ch = root.clientHeight
            E.box.fx = frame.offsetLeft + w / 2
            E.box.fy = frame.offsetTop + h / 2
            E.box.below = Math.max(h, E.box.ch - frame.offsetTop) + h * 0.25
        }

        /* ---------- state changes ---------- */

        const recycle = (i: number) => {
            const b = E.bodies[i]
            const D = live.current.deck
            b.mode = MODE_REST
            b.x = b.y = b.r = 0
            b.vx = b.vy = b.vr = 0
            b.lx = b.ly = b.vlx = b.vly = 0
            b.alpha = 1
            E.queue.push(i)
            b.d = Math.max(E.queue.length - 1, D.layers + 1)
            b.vd = 0
        }

        const snapAll = () => {
            for (let k = 0; k < E.bodies.length; k++) {
                if (E.bodies[k].mode === MODE_FALL) recycle(k)
            }
            E.queue.forEach((i, slot) => {
                const b = E.bodies[i]
                b.mode = MODE_REST
                b.x = b.y = b.r = 0
                b.vx = b.vy = b.vr = 0
                b.lx = b.ly = b.vlx = b.vly = 0
                b.d = slot
                b.vd = 0
                b.alpha = 1
            })
            E.held = null
        }

        const launch = (vx: number, vy: number, vr: number) => {
            if (E.queue.length < 2) return false
            const i = E.queue.shift() as number
            const b = E.bodies[i]
            b.mode = MODE_FALL
            b.vx = vx
            b.vy = vy
            b.vr = vr
            b.alpha = 1
            b.age = 0
            b.seq = ++E.seq
            if (E.held && E.held.i === i) E.held = null
            if (E.gate.calm || !permitted()) snapAll()
            return true
        }

        const dropFront = () => {
            const P = live.current.physics
            const lean = P.tilt / 12
            return launch(-lean * 45, Math.max(0, P.push), P.tilt * 2.8)
        }

        const raiseLast = () => {
            if (E.queue.length < 2) return false
            const P = live.current.physics
            const i = E.queue.pop() as number
            E.queue.unshift(i)
            const b = E.bodies[i]
            b.mode = MODE_REST
            b.d = 0
            b.vd = 0
            b.x = (P.tilt / 12) * 30
            b.y = E.box.below
            b.r = P.tilt * 1.4
            b.vx = b.vy = b.vr = 0
            b.alpha = 1
            if (E.gate.calm || !permitted()) snapAll()
            return true
        }

        /* ---------- physics ---------- */

        const leanGoal = (slot: number, axis: "x" | "y") => {
            const on =
                slot === 0 &&
                live.current.physics.hoverLean &&
                E.hover &&
                !E.held
            if (!on) return 0
            return axis === "x" ? E.lean.x * 7 : -E.lean.y * 7
        }

        const integrate = (dt: number) => {
            const { physics: P, deck: D } = live.current
            const K = clamp(P.stiffness, 20, 800)
            const zeta = 1 - 0.6 * unit(P.bounce)
            const C = 2 * Math.sqrt(K) * zeta
            const Kp = K * 1.25
            const Cp = 2 * Math.sqrt(Kp) * zeta
            const half = E.box.h / 2

            const heldBody = E.held ? E.bodies[E.held.i] : null
            const pull = heldBody
                ? Math.min(
                      1,
                      Math.hypot(heldBody.x, heldBody.y) / (E.box.w * 0.8)
                  )
                : 0

            for (let slot = 0; slot < E.queue.length; slot++) {
                const b = E.bodies[E.queue[slot]]
                const target = slot === 0 ? 0 : Math.max(0, slot - pull * 0.45)
                b.vd += (-K * (b.d - target) - C * b.vd) * dt
                b.d += b.vd * dt

                if (b.mode === MODE_HELD && E.held) {
                    const kh = 520
                    const ch = 2 * Math.sqrt(kh) * 0.8
                    b.vx += (-kh * (b.x - E.held.tx) - ch * b.vx) * dt
                    b.vy += (-kh * (b.y - E.held.ty) - ch * b.vy) * dt
                    b.x += b.vx * dt
                    b.y += b.vy * dt
                    const swing = -(E.held.gy / Math.max(1, half)) * b.vx * 0.02
                    const rt = clamp(swing + b.x * 0.03, -24, 24)
                    const kr = 260
                    b.vr +=
                        (-kr * (b.r - rt) - 2 * Math.sqrt(kr) * 0.7 * b.vr) * dt
                    b.r += b.vr * dt
                } else {
                    b.vx += (-Kp * b.x - Cp * b.vx) * dt
                    b.vy += (-Kp * b.y - Cp * b.vy) * dt
                    b.vr += (-Kp * b.r - Cp * b.vr) * dt
                    b.x += b.vx * dt
                    b.y += b.vy * dt
                    b.r += b.vr * dt
                }

                const tlx = leanGoal(slot, "x")
                const tly = leanGoal(slot, "y")
                const kl = 150
                const cl = 2 * Math.sqrt(kl) * 0.8
                b.vlx += (-kl * (b.lx - tlx) - cl * b.vlx) * dt
                b.vly += (-kl * (b.ly - tly) - cl * b.vly) * dt
                b.lx += b.vlx * dt
                b.ly += b.vly * dt
            }

            const g = Math.max(0, P.gravity)
            const airLin = Math.exp(-0.35 * dt)
            const airRot = Math.exp(-1.4 * dt)
            const reach = Math.hypot(E.box.w, E.box.h) / 2
            let gone: number[] | null = null
            for (let i = 0; i < E.bodies.length; i++) {
                const b = E.bodies[i]
                if (b.mode !== MODE_FALL) continue
                b.vy += g * dt
                b.vx *= airLin
                b.vy *= airLin
                b.vr *= airRot
                b.x += b.vx * dt
                b.y += b.vy * dt
                b.r += b.vr * dt
                b.age += dt
                if (!D.clip && b.age > 0.2)
                    b.alpha = Math.max(0, b.alpha - dt * 2.4)
                const cx = E.box.fx + b.x
                const cy = E.box.fy + b.y
                const out =
                    cy - reach > E.box.ch ||
                    cy + reach < 0 ||
                    cx - reach > E.box.cw ||
                    cx + reach < 0 ||
                    b.alpha <= 0 ||
                    b.age > 6
                if (out) (gone || (gone = [])).push(i)
            }
            if (gone) gone.forEach(recycle)
        }

        const restful = () => {
            if (E.held) return false
            for (let i = 0; i < E.bodies.length; i++) {
                if (E.bodies[i].mode === MODE_FALL) return false
            }
            for (let slot = 0; slot < E.queue.length; slot++) {
                const b = E.bodies[E.queue[slot]]
                if (
                    Math.abs(b.d - slot) > 0.002 ||
                    Math.abs(b.vd) > 0.01 ||
                    Math.abs(b.x) > 0.05 ||
                    Math.abs(b.y) > 0.05 ||
                    Math.abs(b.vx) > 0.5 ||
                    Math.abs(b.vy) > 0.5 ||
                    Math.abs(b.r) > 0.01 ||
                    Math.abs(b.vr) > 0.1 ||
                    Math.abs(b.lx - leanGoal(slot, "x")) > 0.01 ||
                    Math.abs(b.ly - leanGoal(slot, "y")) > 0.01 ||
                    Math.abs(b.vlx) > 0.05 ||
                    Math.abs(b.vly) > 0.05
                )
                    return false
            }
            return true
        }

        const pin = () => {
            E.queue.forEach((i, slot) => {
                const b = E.bodies[i]
                b.d = slot
                b.vd = 0
                b.x = b.y = b.r = 0
                b.vx = b.vy = b.vr = 0
                b.lx = leanGoal(slot, "x")
                b.ly = leanGoal(slot, "y")
                b.vlx = b.vly = 0
            })
        }

        /* ---------- drawing ---------- */

        const paint = () => {
            const D = live.current.deck
            const half = E.box.h / 2
            const slotOf: number[] = []
            E.queue.forEach((i, slot) => (slotOf[i] = slot))

            for (let i = 0; i < E.bodies.length; i++) {
                const el = cardEls.current[i]
                const b = E.bodies[i]
                if (!el || !b) continue
                const depth = b.mode === MODE_FALL ? 0 : Math.max(0, b.d)
                const s = 1 - depth * D.shrink
                const lift = -depth * D.gap - (1 - s) * half
                let alpha = b.alpha
                if (depth > D.layers) alpha *= unit(1 - (depth - D.layers))
                const veil =
                    depth <= 0
                        ? 0
                        : D.shade * Math.min(1, depth / Math.max(1, D.layers))
                const slot = slotOf[i]
                const z =
                    b.mode === MODE_FALL
                        ? 4000 - (b.seq % 2000)
                        : 1000 - (slot === undefined ? 999 : slot)

                el.style.transform =
                    `translate3d(${b.x.toFixed(2)}px, ${(b.y + lift).toFixed(2)}px, 0) ` +
                    `perspective(1100px) rotateX(${b.ly.toFixed(3)}deg) rotateY(${b.lx.toFixed(
                        3
                    )}deg) rotate(${b.r.toFixed(3)}deg) scale(${s.toFixed(4)})`
                el.style.zIndex = String(z)
                el.style.opacity = String(alpha)
                el.style.visibility = alpha <= 0.001 ? "hidden" : "visible"
                el.setAttribute("aria-hidden", slot === 0 ? "false" : "true")
                const v = veilEls.current[i]
                if (v) v.style.opacity = String(veil)
            }
        }

        const syncClips = () => {
            const allow = permitted()
            const lead = E.queue.length ? E.queue[0] : -1
            if (lead === E.shownLead && allow === E.shownPlaying) return
            E.shownLead = lead
            E.shownPlaying = allow
            clipEls.current.forEach((v, i) => {
                if (!v) return
                if (allow && i === lead) {
                    v.muted = true
                    const p = v.play()
                    if (p && typeof p.catch === "function") p.catch(() => {})
                } else if (!v.paused) {
                    v.pause()
                }
            })
        }

        /* ---------- loop ---------- */

        const stopTimer = () => {
            if (E.timer) {
                clearTimeout(E.timer)
                E.timer = 0
            }
        }

        const armAutoplay = () => {
            const { physics: P, cards: list } = live.current
            if (E.timer || E.press || E.held) return
            if (!P.autoplay || E.gate.calm || list.length < 2) return
            if (P.pauseOnHover && E.hover) return
            E.timer = setTimeout(
                () => {
                    E.timer = 0
                    const cur = live.current.physics
                    if (!permitted() || E.press || E.held) return
                    if (cur.pauseOnHover && E.hover) return
                    advance()
                },
                Math.max(0.4, P.interval) * 1000
            )
        }

        const tick = (now: number) => {
            E.raf = 0
            if (!permitted()) {
                park()
                return
            }
            const elapsed = E.last
                ? Math.min(0.05, (now - E.last) / 1000)
                : 1 / 60
            E.last = now
            E.carry += elapsed
            while (E.carry >= SUBSTEP) {
                integrate(SUBSTEP)
                E.carry -= SUBSTEP
            }
            const still = restful()
            if (still) pin()
            paint()
            syncClips()
            if (still) {
                E.last = 0
                E.carry = 0
                armAutoplay()
            } else {
                E.raf = requestAnimationFrame(tick)
            }
        }

        const wake = () => {
            if (!E.raf && permitted()) E.raf = requestAnimationFrame(tick)
        }

        const park = () => {
            if (E.raf) {
                cancelAnimationFrame(E.raf)
                E.raf = 0
            }
            stopTimer()
            E.press = null
            E.hover = false
            snapAll()
            E.last = 0
            E.carry = 0
            paint()
            syncClips()
        }

        const advance = () => {
            stopTimer()
            if (dropFront()) {
                paint()
                syncClips()
                wake()
            }
        }

        const retreat = () => {
            stopTimer()
            if (raiseLast()) {
                paint()
                syncClips()
                wake()
            }
        }

        const activate = () => {
            const { cards: list, physics: P } = live.current
            if (P.clickAction === "None") return
            const item = list[E.queue[0]]
            if (P.clickAction === "Open Link" && item?.link) {
                if (typeof window !== "undefined") {
                    if (item.newTab)
                        window.open(item.link, "_blank", "noopener,noreferrer")
                    else window.location.href = item.link
                }
                return
            }
            advance()
        }

        /* ---------- input ---------- */

        const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
            if (e.pointerType === "mouse" && e.button !== 0) return
            if (!E.queue.length) return
            stopTimer()
            E.press = {
                id: e.pointerId,
                x: e.clientX,
                y: e.clientY,
                moved: false,
                trail: [{ x: e.clientX, y: e.clientY, t: e.timeStamp }],
            }
            if (live.current.physics.draggable) {
                measure()
                try {
                    e.currentTarget.setPointerCapture(e.pointerId)
                } catch {}
            }
        }

        const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
            const frame = frameRef.current
            if (e.pointerType === "mouse" && frame && !E.press) {
                const rect = frame.getBoundingClientRect()
                E.lean.x = clamp(
                    ((e.clientX - rect.left) / rect.width) * 2 - 1,
                    -1,
                    1
                )
                E.lean.y = clamp(
                    ((e.clientY - rect.top) / rect.height) * 2 - 1,
                    -1,
                    1
                )
                if (live.current.physics.hoverLean) wake()
            }
            const P = E.press
            if (!P || P.id !== e.pointerId) return
            const dx = e.clientX - P.x
            const dy = e.clientY - P.y
            P.trail.push({ x: e.clientX, y: e.clientY, t: e.timeStamp })
            if (P.trail.length > 8) P.trail.shift()
            if (!P.moved && Math.hypot(dx, dy) > 6) {
                P.moved = true
                if (
                    live.current.physics.draggable &&
                    E.queue.length > 1 &&
                    frame
                ) {
                    const i = E.queue[0]
                    const rect = frame.getBoundingClientRect()
                    E.bodies[i].mode = MODE_HELD
                    E.held = {
                        i,
                        tx: dx,
                        ty: dy,
                        gy: P.y - (rect.top + rect.height / 2),
                    }
                }
            }
            if (E.held) {
                E.held.tx = dx
                E.held.ty = dy
                wake()
            }
        }

        const release = (
            e: React.PointerEvent<HTMLDivElement>,
            cancelled: boolean
        ) => {
            const P = E.press
            if (!P || P.id !== e.pointerId) return
            E.press = null
            if (!P.moved) {
                if (!cancelled) activate()
                wake()
                return
            }
            const H = E.held
            if (!H) {
                wake()
                return
            }
            const b = E.bodies[H.i]
            const newest = P.trail[P.trail.length - 1]
            let oldest = P.trail[0]
            for (let k = P.trail.length - 1; k >= 0; k--) {
                if (newest.t - P.trail[k].t > 90) break
                oldest = P.trail[k]
            }
            const span = Math.max(8, newest.t - oldest.t) / 1000
            let vx =
                ((newest.x - oldest.x) / span) * live.current.physics.throwPower
            let vy =
                ((newest.y - oldest.y) / span) * live.current.physics.throwPower
            const speed = Math.hypot(vx, vy)
            const dist = Math.hypot(b.x, b.y)
            const flung = !cancelled && (speed > 650 || dist > E.box.w * 0.32)

            E.held = null
            if (flung) {
                if (speed < 900) {
                    const len = dist || 1
                    vx += (b.x / len) * (900 - speed)
                    vy += (b.y / len) * (900 - speed)
                }
                const half = Math.max(1, E.box.h / 2)
                const spin = clamp(
                    -(H.gy / half) * vx * 0.22 + vx * 0.05,
                    -720,
                    720
                )
                b.mode = MODE_REST
                launch(vx, vy, spin)
            } else {
                b.mode = MODE_REST
            }
            paint()
            syncClips()
            wake()
        }

        const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault()
                advance()
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault()
                retreat()
            } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                activate()
            }
        }

        const onEnter = (e: React.PointerEvent<HTMLDivElement>) => {
            if (e.pointerType !== "mouse") return
            E.hover = true
            if (live.current.physics.pauseOnHover) stopTimer()
            wake()
        }
        const onLeave = (e: React.PointerEvent<HTMLDivElement>) => {
            if (e.pointerType !== "mouse") return
            E.hover = false
            E.lean.x = 0
            E.lean.y = 0
            wake()
        }

        return {
            reshape,
            measure,
            paint,
            syncClips,
            stopTimer,
            wake,
            park,
            onPointerDown,
            onPointerMove,
            onPointerUp: (e: React.PointerEvent<HTMLDivElement>) =>
                release(e, false),
            onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) =>
                release(e, true),
            onKeyDown,
            onEnter,
            onLeave,
        }
    })

    // Keep the engine in step with property edits: rebuild bodies if the count changed,
    // re-measure, repaint and re-arm.
    useLayoutEffect(() => {
        const E = engineRef.current as Engine
        ops.reshape(n)
        ops.measure()
        ops.paint()
        E.shownLead = -2
        ops.syncClips()
        ops.stopTimer()
        ops.wake()
    })

    // Visibility gate: intersection + tab visibility + reduced motion.
    useEffect(() => {
        const E = engineRef.current as Engine
        const root = rootRef.current

        const mq =
            typeof window !== "undefined" && window.matchMedia
                ? window.matchMedia("(prefers-reduced-motion: reduce)")
                : null
        const onMotionPref = () => {
            E.gate.calm = !!mq?.matches
            ops.stopTimer()
            ops.wake()
        }
        onMotionPref()
        mq?.addEventListener?.("change", onMotionPref)

        const onPage = () => {
            E.gate.page = document.visibilityState !== "hidden"
            if (E.gate.page) ops.wake()
            else ops.park()
        }
        onPage()
        document.addEventListener("visibilitychange", onPage)

        let io: IntersectionObserver | null = null
        if (typeof IntersectionObserver === "undefined" || !root) {
            E.gate.seen = true
            ops.wake()
        } else {
            io = new IntersectionObserver(
                (entries) => {
                    const entry = entries[entries.length - 1]
                    E.gate.seen = !!entry?.isIntersecting
                    if (E.gate.seen) {
                        ops.measure()
                        ops.wake()
                    } else ops.park()
                },
                { threshold: 0 }
            )
            io.observe(root)
        }

        const onResize = () => ops.measure()
        window.addEventListener("resize", onResize)

        return () => {
            io?.disconnect()
            document.removeEventListener("visibilitychange", onPage)
            mq?.removeEventListener?.("change", onMotionPref)
            window.removeEventListener("resize", onResize)
            E.gate.seen = false
            ops.park()
        }
    }, [])

    const shadow = deck.shadow ? "0 28px 60px -24px rgba(0,0,0,0.65)" : "none"
    const titleStyle = { ...TITLE_FALLBACK, ...(caption.titleFont || {}) }
    const captionStyle = { ...CAPTION_FALLBACK, ...(caption.captionFont || {}) }

    return (
        <div
            ref={rootRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Card deck"
            tabIndex={0}
            onKeyDown={ops.onKeyDown}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                background,
                overflow: deck.clip ? "hidden" : "visible",
                outline: "none",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                }}
            >
                <div
                    ref={frameRef}
                    onPointerDown={ops.onPointerDown}
                    onPointerMove={ops.onPointerMove}
                    onPointerUp={ops.onPointerUp}
                    onPointerCancel={ops.onPointerCancel}
                    onPointerEnter={ops.onEnter}
                    onPointerLeave={ops.onLeave}
                    style={{
                        ...frameBox(deck),
                        pointerEvents: "auto",
                        touchAction: physics.draggable ? "none" : "auto",
                        cursor:
                            n > 1
                                ? physics.draggable
                                    ? "grab"
                                    : physics.clickAction === "None"
                                      ? "default"
                                      : "pointer"
                                : "default",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                    }}
                >
                    {n === 0 ? (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: deck.radius,
                                border: "1px dashed rgba(255,255,255,0.25)",
                                color: "rgba(255,255,255,0.6)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 13,
                                fontFamily: "Inter, system-ui, sans-serif",
                            }}
                        >
                            Add cards in the properties panel
                        </div>
                    ) : null}
                    {cards.map((item, i) => {
                        const pic = pictureOf(item)
                        const isClip = playsVideo(item)
                        return (
                            <div
                                key={i}
                                ref={(el) => {
                                    cardEls.current[i] = el
                                }}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: deck.radius,
                                    overflow: "hidden",
                                    boxShadow: shadow,
                                    background: "#111",
                                    transformOrigin: "50% 50%",
                                    willChange: "transform",
                                    backfaceVisibility: "hidden",
                                    pointerEvents: "none",
                                    visibility:
                                        i > deck.layers ? "hidden" : "visible",
                                }}
                            >
                                {isClip ? (
                                    <video
                                        ref={(el) => {
                                            clipEls.current[i] = el
                                            if (el) el.muted = true
                                        }}
                                        src={clipOf(item)}
                                        poster={pic || undefined}
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
                                ) : pic ? (
                                    <img
                                        src={pic}
                                        srcSet={srcSetOf(item)}
                                        alt={
                                            item?.image?.alt ||
                                            item?.title ||
                                            ""
                                        }
                                        draggable={false}
                                        loading={
                                            i <= deck.layers + 1
                                                ? "eager"
                                                : "lazy"
                                        }
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            background:
                                                "linear-gradient(160deg, #2a2a2a, #121212)",
                                        }}
                                    />
                                )}
                                {caption.show &&
                                (item?.title || item?.caption) ? (
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            padding: caption.padding,
                                            color: caption.color,
                                            background:
                                                "linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0))",
                                        }}
                                    >
                                        <div style={titleStyle}>
                                            {item?.title}
                                        </div>
                                        <div
                                            style={{
                                                ...captionStyle,
                                                marginTop: 6,
                                                opacity: 0.8,
                                            }}
                                        >
                                            {item?.caption}
                                        </div>
                                    </div>
                                ) : null}
                                <div
                                    ref={(el) => {
                                        veilEls.current[i] = el
                                    }}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: "#000",
                                        opacity: 0,
                                        pointerEvents: "none",
                                    }}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

/* -------------------------------- controls -------------------------------- */

const notVideo = (p: any) => p?.media !== "Video"
const isVideo = (p: any) => p?.media === "Video"

addPropertyControls(Spillway, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 24,
        control: {
            type: ControlType.Object,
            controls: {
                media: {
                    type: ControlType.Enum,
                    title: "Media",
                    options: ["Image", "Video"],
                    optionTitles: ["Image", "Video"],
                    displaySegmentedControl: true,
                    defaultValue: "Image",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: isVideo,
                },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…",
                    defaultValue: "",
                    hidden: isVideo,
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: notVideo,
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://…/clip.mp4",
                    defaultValue: "",
                    hidden: notVideo,
                },
                poster: {
                    type: ControlType.ResponsiveImage,
                    title: "Poster",
                    description: "Optional still shown before the video plays.",
                    hidden: notVideo,
                },
                posterUrl: {
                    type: ControlType.String,
                    title: "Poster URL",
                    placeholder: "https://…",
                    defaultValue: "",
                    hidden: notVideo,
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Card Title",
                },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    defaultValue: "Caption",
                },
                link: { type: ControlType.Link, title: "CMS Link" },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: true,
                    enabledTitle: "Yes",
                    disabledTitle: "No",
                },
            },
        },
        defaultValue: DEFAULT_CARDS,
    },
    deck: {
        type: ControlType.Object,
        title: "Deck",
        controls: {
            width: {
                type: ControlType.Number,
                title: "Card Width",
                defaultValue: DECK_DEFAULTS.width,
                min: 120,
                max: 1400,
                step: 1,
                unit: "px",
            },
            height: {
                type: ControlType.Number,
                title: "Card Height",
                defaultValue: DECK_DEFAULTS.height,
                min: 120,
                max: 1400,
                step: 1,
                unit: "px",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: DECK_DEFAULTS.radius,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
            },
            layers: {
                type: ControlType.Number,
                title: "Peek Cards",
                defaultValue: DECK_DEFAULTS.layers,
                min: 0,
                max: 5,
                step: 1,
                displayStepper: true,
            },
            gap: {
                type: ControlType.Number,
                title: "Peek Offset",
                defaultValue: DECK_DEFAULTS.gap,
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
            },
            shrink: {
                type: ControlType.Number,
                title: "Peek Shrink",
                defaultValue: DECK_DEFAULTS.shrink,
                min: 0,
                max: 0.2,
                step: 0.01,
            },
            shade: {
                type: ControlType.Number,
                title: "Depth Shade",
                defaultValue: DECK_DEFAULTS.shade,
                min: 0,
                max: 1,
                step: 0.05,
            },
            shadow: {
                type: ControlType.Boolean,
                title: "Shadow",
                defaultValue: DECK_DEFAULTS.shadow,
            },
            clip: {
                type: ControlType.Boolean,
                title: "Clip Edges",
                defaultValue: DECK_DEFAULTS.clip,
            },
        },
    },
    physics: {
        type: ControlType.Object,
        title: "Physics",
        controls: {
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: PHYSICS_DEFAULTS.autoplay,
            },
            interval: {
                type: ControlType.Number,
                title: "Interval",
                defaultValue: PHYSICS_DEFAULTS.interval,
                min: 0.6,
                max: 12,
                step: 0.1,
                unit: "s",
                hidden: (p: any) => !p?.autoplay,
            },
            gravity: {
                type: ControlType.Number,
                title: "Gravity",
                defaultValue: PHYSICS_DEFAULTS.gravity,
                min: 400,
                max: 8000,
                step: 50,
            },
            push: {
                type: ControlType.Number,
                title: "Drop Push",
                defaultValue: PHYSICS_DEFAULTS.push,
                min: 0,
                max: 1500,
                step: 10,
            },
            tilt: {
                type: ControlType.Number,
                title: "Drop Tilt",
                defaultValue: PHYSICS_DEFAULTS.tilt,
                min: -45,
                max: 45,
                step: 1,
                unit: "°",
            },
            stiffness: {
                type: ControlType.Number,
                title: "Spring",
                defaultValue: PHYSICS_DEFAULTS.stiffness,
                min: 40,
                max: 600,
                step: 5,
            },
            bounce: {
                type: ControlType.Number,
                title: "Bounce",
                defaultValue: PHYSICS_DEFAULTS.bounce,
                min: 0,
                max: 1,
                step: 0.05,
            },
            draggable: {
                type: ControlType.Boolean,
                title: "Drag to Throw",
                defaultValue: PHYSICS_DEFAULTS.draggable,
            },
            throwPower: {
                type: ControlType.Number,
                title: "Throw Power",
                defaultValue: PHYSICS_DEFAULTS.throwPower,
                min: 0.3,
                max: 3,
                step: 0.1,
                hidden: (p: any) => !p?.draggable,
            },
            hoverLean: {
                type: ControlType.Boolean,
                title: "Hover Lean",
                defaultValue: PHYSICS_DEFAULTS.hoverLean,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Hover Pause",
                defaultValue: PHYSICS_DEFAULTS.pauseOnHover,
            },
            clickAction: {
                type: ControlType.Enum,
                title: "On Click",
                options: ["Next Card", "Open Link", "None"],
                optionTitles: ["Next Card", "Open Link", "None"],
                defaultValue: PHYSICS_DEFAULTS.clickAction,
            },
        },
    },
    caption: {
        type: ControlType.Object,
        title: "Caption",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: CAPTION_DEFAULTS.show,
            },
            titleFont: {
                type: ControlType.Font,
                title: "Title",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 22,
                    variant: "Semibold",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.1em",
                },
                hidden: (p: any) => !p?.show,
            },
            captionFont: {
                type: ControlType.Font,
                title: "Caption",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 12,
                    variant: "Medium",
                    letterSpacing: "0.02em",
                    lineHeight: "1.3em",
                },
                hidden: (p: any) => !p?.show,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: CAPTION_DEFAULTS.color,
                hidden: (p: any) => !p?.show,
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                defaultValue: CAPTION_DEFAULTS.padding,
                min: 8,
                max: 80,
                step: 1,
                unit: "px",
                hidden: (p: any) => !p?.show,
            },
        },
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0A0A0A",
    },
})
