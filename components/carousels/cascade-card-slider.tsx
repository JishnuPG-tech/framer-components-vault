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

import { animate, useMotionValue } from "framer-motion"

/* ────────────────────────────────────────────────────────────────────────
   CascadeCardCarousel

   A carousel where the cards fall away from the front card in a diagonal
   3D cascade: earlier cards climb up and back to one side, later cards
   step down and back to the other. The front card faces the viewer in a
   frame with its caption; arrows, drag, swipe, trackpad, keyboard and
   autoplay move the cascade, and clicking a side card brings it forward.

   The position is one continuous number (a motion value). Every card's
   transform is computed from its distance to that number and written
   straight to the DOM, so motion never re-renders React. React only
   re-renders when the front card changes.
   ──────────────────────────────────────────────────────────────────────── */

/* ────────────────────────────────────────────────────────────────────────
   GUIDE FOR EDITING THIS FILE (people and AI coding agents)

   A Framer code component: one file, one default export, imports only
   from "react", "react-dom", "framer" and "framer-motion".

   ## Map
   1. Types and DEFAULT_* objects (one per control group)
   2. framerAsset() — media allowlist
   3. cardTransform() — the cascade math: distance → transform/opacity/dim
   4. CascadeCardCarousel component
        a. props merged with defaults, cards (or placeholders)
        b. fit-to-frame scale (ResizeObserver)
        c. position motion value → paint() writes every card's style
        d. navigation: go(), arrows, drag, wheel, keys, autoplay
        e. JSX: stage → cards (frame, media, caption, dim) → arrows
   5. addPropertyControls

   ## Rules
   - Keep control keys stable; renaming one resets it on placed instances.
   - useIsStaticRenderer() is true on the Framer canvas and in export:
     render the resting cascade, no listeners, no autoplay, no intro.
   - Media must come from Framer-managed assets: every image/video URL goes
     through framerAsset(); never add free-form URL fields (Framer
     Marketplace requirement). Links (ControlType.Link) are fine.
   - paint() writes transforms to refs; don't move that into React state.
   - Each card carries its own perspective() so stacking follows z-index
     (no 3D intersections); all cards share the stage centre as vanishing
     point because they are all positioned at the centre before moving.
   - Respect prefers-reduced-motion (reduced): jumps are instant.

   ## Common changes
   - Cascade shape: edit cardTransform(); every input is a "shape" prop.
   - New per-card field: add it to CardProp, the "cards" control, and the
     card JSX.
   - New arrow icon: add an option to arrows.icon and a path in ICONS.
   ──────────────────────────────────────────────────────────────────────── */

interface ImageValue {
    src?: string
    srcSet?: string
    alt?: string
}
interface CardProp {
    image?: ImageValue
    video?: string
    title?: string
    link?: string
    newTab?: boolean
}
interface Props {
    style?: React.CSSProperties
    cards: CardProp[]
    startIndex: number
    card: { width: number; height: number; fit: boolean; fitWidth: number; mobileWidth: number; radius: number; frame: number; frameColor: string; mediaFill: string; shadow: number }
    shape: { spreadX: number; spreadY: number; depth: number; turn: number; tilt: number; roll: number; perspective: number; visible: number; dim: number; dimColor: string; blur: number }
    caption: { show: "active" | "all" | "none"; font: any; color: string; gap: number; align: "left" | "center" | "right" }
    navigation: { loop: boolean; drag: boolean; wheel: boolean; keyboard: boolean; clickSide: boolean; transition: any }
    autoplay: { enabled: boolean; interval: number; pauseOnHover: boolean }
    arrows: {
        show: boolean
        icon: "triangle" | "chevron" | "arrow"
        size: number
        iconSize: number
        radius: number
        fill: string
        hoverFill: string
        color: string
        gap: number
        offset: number
        counter: boolean
        counterFont: any
        counterColor: string
    }
    pointer: { parallax: number; smoothing: number }
    intro: { effect: "none" | "fan" | "rise" | "fade"; duration: number; stagger: number }
    background: string
    onChange?: (index: number) => void
    onCardClick?: (index: number) => void
}

const DEFAULT_CARD = { width: 760, height: 480, fit: true, fitWidth: 48, mobileWidth: 82, radius: 0, frame: 20, frameColor: "#333333", mediaFill: "#EFEFEF", shadow: 0.35 }
const DEFAULT_SHAPE = { spreadX: 30, spreadY: 13, depth: 110, turn: 24, tilt: 0, roll: 0, perspective: 1600, visible: 4, dim: 0.16, dimColor: "#161616", blur: 0 }
const DEFAULT_CAPTION = { show: "active" as const, font: { fontSize: 18, fontWeight: 500, lineHeight: "1.3em" }, color: "#F2F2F2", gap: 16, align: "left" as const }
const DEFAULT_NAVIGATION = { loop: true, drag: true, wheel: true, keyboard: true, clickSide: true, transition: { type: "spring" as const, stiffness: 170, damping: 28, mass: 1 } as any }
const DEFAULT_AUTOPLAY = { enabled: false, interval: 4, pauseOnHover: true }
const DEFAULT_ARROWS = {
    show: true,
    icon: "triangle" as const,
    size: 52,
    iconSize: 14,
    radius: 0,
    fill: "#2E2E2E",
    hoverFill: "#444444",
    color: "#FFFFFF",
    gap: 12,
    offset: 56,
    counter: false,
    counterFont: { fontSize: 14, fontWeight: 500, letterSpacing: "0.04em" },
    counterColor: "#9A9A9A",
}
const DEFAULT_POINTER = { parallax: 0.4, smoothing: 0.5 }
const DEFAULT_INTRO = { effect: "fan" as const, duration: 1.2, stagger: 0.06 }

/* Media is only loaded from Framer-managed assets (https on
   framerusercontent.com), so visitors' browsers never contact other hosts. */
const FRAMER_ASSET_HOST = "framerusercontent.com"
function framerAsset(src: string | undefined | null): string {
    if (!src || typeof src !== "string") return ""
    try {
        const url = new URL(src)
        if (url.protocol !== "https:") return ""
        const host = url.hostname.toLowerCase()
        return host === FRAMER_ASSET_HOST || host.endsWith("." + FRAMER_ASSET_HOST) ? url.href : ""
    } catch {
        return ""
    }
}
function framerSrcSet(srcSet: string | undefined): string | undefined {
    if (!srcSet) return undefined
    const kept = srcSet
        .split(",")
        .map((c) => c.trim())
        .filter((c) => framerAsset(c.split(/\s+/)[0]))
    return kept.length ? kept.join(", ") : undefined
}

const ICONS: Record<string, string> = {
    triangle: "M15 5 L7 12 L15 19 Z",
    chevron: "M15 4 L7 12 L15 20",
    arrow: "M20 12 H5 M11 5 L4 12 L11 19",
}

/* Placeholder cards keep an empty carousel readable on the canvas. */
const PLACEHOLDER_FILLS = [
    "linear-gradient(135deg,#E9E9E9,#BDBDBD)",
    "linear-gradient(135deg,#2B2B2B,#0E0E0E)",
    "linear-gradient(135deg,#D8D2C8,#A39A8C)",
    "linear-gradient(135deg,#C9472B,#6E2414)",
    "linear-gradient(135deg,#F4F4F4,#D6D6D6)",
    "linear-gradient(135deg,#4A5A52,#1F2824)",
]

function clamp(v: number, a: number, b: number) {
    return Math.min(b, Math.max(a, v))
}
/* Shortest signed distance from position p to card i on a loop of n. */
function loopDistance(i: number, p: number, n: number) {
    let d = (i - p) % n
    if (d > n / 2) d -= n
    if (d < -n / 2) d += n
    return d
}

interface CardPaint {
    transform: string
    opacity: number
    dim: number
    z: number
    blur: number
}
/* The cascade: distance d from the front card → where that card sits. */
function cardTransform(d: number, w: number, h: number, s: typeof DEFAULT_SHAPE, spread: number, par: { x: number; y: number }): CardPaint {
    const a = Math.abs(d)
    const x = d * (s.spreadX / 100) * w * spread
    const y = d * (s.spreadY / 100) * h * spread
    const z = -a * s.depth * spread
    const ry = -clamp(d, -1, 1) * s.turn * Math.min(1, a) + -Math.sign(d) * Math.max(0, a - 1) * s.turn * 0.25
    const opacity = clamp(s.visible + 1 - a, 0, 1)
    return {
        transform:
            "perspective(" + Math.max(200, s.perspective) + "px) rotateX(" + (s.tilt + par.y) + "deg) rotateY(" + par.x + "deg) rotateZ(" + s.roll + "deg) " +
            "translate3d(" + x + "px, " + y + "px, " + z + "px) rotateY(" + ry + "deg)",
        opacity,
        dim: clamp(a * s.dim, 0, 0.85),
        z: 1000 - Math.round(a * 10),
        blur: s.blur * Math.min(a, s.visible),
    }
}

function usePrefersReducedMotion() {
    const [reduced, setReduced] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(mq.matches)
        update()
        mq.addEventListener?.("change", update)
        return () => mq.removeEventListener?.("change", update)
    }, [])
    return reduced
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 760
 */
export default function CascadeCardCarousel(props: Props) {
    const isStatic = useIsStaticRenderer()
    const reduced = usePrefersReducedMotion()

    const card = { ...DEFAULT_CARD, ...props.card }
    const shape = { ...DEFAULT_SHAPE, ...props.shape }
    const caption = { ...DEFAULT_CAPTION, ...props.caption }
    const nav = { ...DEFAULT_NAVIGATION, ...props.navigation }
    const auto = { ...DEFAULT_AUTOPLAY, ...props.autoplay }
    const arrows = { ...DEFAULT_ARROWS, ...props.arrows }
    const pointer = { ...DEFAULT_POINTER, ...props.pointer }
    const intro = { ...DEFAULT_INTRO, ...props.intro }
    const background = props.background ?? "#161616"

    /* ── a. cards ─────────────────────────────────────────────────────── */
    const userCards = Array.isArray(props.cards) ? props.cards : []
    const placeholder = userCards.length === 0
    const cards = React.useMemo(() => {
        if (!placeholder)
            return userCards.map((c, i) => ({
                src: framerAsset(c?.image?.src),
                srcSet: framerSrcSet(c?.image?.srcSet),
                alt: c?.image?.alt || c?.title || "",
                video: framerAsset(c?.video),
                title: c?.title || "",
                link: c?.link || "",
                newTab: !!c?.newTab,
                fill: "",
                key: i,
            }))
        return PLACEHOLDER_FILLS.map((fill, i) => ({ src: "", srcSet: undefined, alt: "", video: "", title: "Card " + (i + 1), link: "", newTab: false, fill, key: i }))
    }, [userCards, placeholder])
    const n = cards.length
    const loop = nav.loop && n > 2
    const start = clamp(Math.round(props.startIndex ?? 0), 0, Math.max(0, n - 1))

    /* ── b. fit-to-frame scale ────────────────────────────────────────── */
    const rootRef = React.useRef<HTMLDivElement>(null)
    const [box, setBox] = React.useState({ w: 1200, h: 760 })
    React.useLayoutEffect(() => {
        const el = rootRef.current
        if (!el) return
        const measure = () => {
            const r = el.getBoundingClientRect()
            if (r.width > 0 && r.height > 0) setBox((b) => (Math.abs(b.w - r.width) > 0.5 || Math.abs(b.h - r.height) > 0.5 ? { w: r.width, h: r.height } : b))
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    const captionSpace = caption.show === "none" ? 0 : (parseFloat(String(caption.font?.fontSize ?? 18)) || 18) * 1.4 + caption.gap
    const frameW = card.width + card.frame * 2
    const frameH = card.height + card.frame * 2 + captionSpace
    const arrowSpace = arrows.show ? arrows.size + arrows.offset * 0.6 : 0
    // Below 640px wide the front card takes the larger mobile share of the width.
    const widthShare = (box.w < 640 ? card.mobileWidth : card.fitWidth) / 100
    const fit = card.fit ? Math.min(1, (box.w * widthShare) / frameW, ((box.h - arrowSpace) * 0.8) / frameH) : 1

    /* ── c. position → paint ──────────────────────────────────────────── */
    const position = useMotionValue(start)
    const introMv = useMotionValue(isStatic || intro.effect === "none" ? 1 : 0)
    const cardRefs = React.useRef<(HTMLDivElement | null)[]>([])
    const dimRefs = React.useRef<(HTMLDivElement | null)[]>([])
    const par = React.useRef({ x: 0, y: 0, tx: 0, ty: 0 })
    const [active, setActive] = React.useState(start)
    const activeRef = React.useRef(start)

    const paint = React.useCallback(() => {
        const p = position.get()
        const t = introMv.get()
        for (let i = 0; i < n; i++) {
            const el = cardRefs.current[i]
            if (!el) continue
            const d = loop ? loopDistance(i, p, n) : i - p
            const local = intro.effect === "none" ? 1 : clamp(t * (1 + intro.stagger * shape.visible) - Math.abs(d) * intro.stagger, 0, 1)
            const e = 1 - Math.pow(1 - local, 3)
            const spread = intro.effect === "fan" ? e : 1
            const c = cardTransform(d, frameW, frameH, shape, spread, par.current)
            const rise = intro.effect === "rise" ? (1 - e) * 120 : 0
            el.style.transform = "translateY(" + rise + "px) " + c.transform
            el.style.opacity = String(c.opacity * (intro.effect === "none" ? 1 : e))
            el.style.zIndex = String(c.z)
            el.style.visibility = c.opacity <= 0.001 ? "hidden" : "visible"
            el.style.filter = c.blur > 0.05 ? "blur(" + c.blur.toFixed(2) + "px)" : ""
            const dim = dimRefs.current[i]
            if (dim) dim.style.opacity = String(c.dim)
        }
    }, [n, loop, frameW, frameH, shape.spreadX, shape.spreadY, shape.depth, shape.turn, shape.tilt, shape.roll, shape.perspective, shape.visible, shape.dim, shape.blur, intro.effect, intro.stagger])

    React.useLayoutEffect(() => {
        paint()
    })
    React.useEffect(() => {
        const a = position.on("change", () => {
            paint()
            const p = position.get()
            const idx = ((Math.round(p) % n) + n) % n
            if (idx !== activeRef.current) {
                activeRef.current = idx
                setActive(idx)
            }
        })
        const b = introMv.on("change", paint)
        return () => {
            a()
            b()
        }
    }, [paint, n])

    // Keep the position valid when cards are added or removed.
    React.useEffect(() => {
        if (activeRef.current >= n) {
            position.set(Math.max(0, n - 1))
        }
    }, [n])
    // Canvas: follow the Start control.
    React.useEffect(() => {
        if (isStatic) {
            position.set(start)
            target.current = start
            activeRef.current = start
            setActive(start)
        }
    }, [isStatic, start])

    /* ── intro, once the carousel is on screen ── */
    const [inView, setInView] = React.useState(false)
    React.useEffect(() => {
        const el = rootRef.current
        if (!el || isStatic || typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }
        const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 })
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic])
    const introDone = React.useRef(false)
    React.useEffect(() => {
        if (isStatic || intro.effect === "none" || reduced) {
            introMv.set(1)
            return
        }
        if (!inView || introDone.current) return
        introDone.current = true
        const total = Math.max(0.05, intro.duration)
        const ctl = animate(introMv, 1, { duration: total, ease: "linear" })
        return () => ctl.stop()
    }, [inView, isStatic, intro.effect, reduced])

    /* ── d. navigation ────────────────────────────────────────────────── */
    const anim = React.useRef<{ stop: () => void } | null>(null)
    // Where the cascade is heading; repeated clicks add up from here.
    const target = React.useRef(start)
    const onChangeRef = React.useRef(props.onChange)
    onChangeRef.current = props.onChange
    const go = React.useCallback(
        (to: number) => {
            if (n === 0) return
            const t = loop ? to : clamp(to, 0, n - 1)
            target.current = t
            anim.current?.stop()
            if (reduced) position.set(t)
            else anim.current = animate(position, t, nav.transition || DEFAULT_NAVIGATION.transition)
            const idx = ((Math.round(t) % n) + n) % n
            onChangeRef.current?.(idx)
        },
        [n, loop, reduced, nav.transition]
    )
    const step = React.useCallback((dir: number) => go(Math.round(target.current) + dir), [go])
    const goTo = React.useCallback(
        (i: number) => {
            if (!loop) return go(i)
            const p = target.current
            go(p + loopDistance(i, p, n))
        },
        [go, loop, n]
    )

    // Pointer: parallax + hover state for autoplay.
    const hovering = React.useRef(false)
    const [paused, setPaused] = React.useState(false)
    React.useEffect(() => {
        if (isStatic || reduced || pointer.parallax <= 0) return
        let raf = 0
        const tick = () => {
            const q = par.current
            const k = 1 - Math.pow(clamp(pointer.smoothing, 0, 0.98), 0.35)
            const nx = q.x + (q.tx - q.x) * k
            const ny = q.y + (q.ty - q.y) * k
            if (Math.abs(nx - q.x) > 0.001 || Math.abs(ny - q.y) > 0.001) {
                q.x = nx
                q.y = ny
                paint()
            }
            raf = requestAnimationFrame(tick)
        }
        if (inView) raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [isStatic, reduced, pointer.parallax, pointer.smoothing, inView, paint])
    const onPointerMove = (e: React.PointerEvent) => {
        if (isStatic || reduced || pointer.parallax <= 0 || e.pointerType !== "mouse") return
        const r = rootRef.current?.getBoundingClientRect()
        if (!r) return
        const nx = (e.clientX - r.left) / r.width - 0.5
        const ny = (e.clientY - r.top) / r.height - 0.5
        par.current.tx = nx * 10 * pointer.parallax
        par.current.ty = -ny * 8 * pointer.parallax
    }
    const onPointerLeave = () => {
        par.current.tx = 0
        par.current.ty = 0
        hovering.current = false
        if (auto.pauseOnHover) setPaused(false)
    }
    const onPointerEnter = () => {
        hovering.current = true
        if (auto.pauseOnHover) setPaused(true)
    }

    // Drag / swipe.
    const drag = React.useRef<{ id: number; x0: number; p0: number; last: number; lt: number; v: number; moved: boolean } | null>(null)
    const suppressClick = React.useRef(false)
    const stepPx = Math.max(40, (shape.spreadX / 100) * frameW * fit)
    const onPointerDown = (e: React.PointerEvent) => {
        if (isStatic || !nav.drag || e.button !== 0) return
        if ((e.target as HTMLElement).closest("[data-cc-control]")) return
        anim.current?.stop()
        drag.current = { id: e.pointerId, x0: e.clientX, p0: position.get(), last: e.clientX, lt: performance.now(), v: 0, moved: false }
        suppressClick.current = false
    }
    React.useEffect(() => {
        if (isStatic || !nav.drag) return
        const move = (e: PointerEvent) => {
            const d = drag.current
            if (!d || e.pointerId !== d.id) return
            const dx = e.clientX - d.x0
            if (!d.moved && Math.abs(dx) > 6) {
                d.moved = true
                suppressClick.current = true
                rootRef.current?.setPointerCapture?.(e.pointerId)
            }
            if (!d.moved) return
            const now = performance.now()
            const dt = Math.max(1, now - d.lt)
            d.v = 0.8 * ((e.clientX - d.last) / dt) + 0.2 * d.v
            d.last = e.clientX
            d.lt = now
            let p = d.p0 - dx / stepPx
            if (!loop) {
                if (p < 0) p = p * 0.3
                if (p > n - 1) p = n - 1 + (p - (n - 1)) * 0.3
            }
            position.set(p)
        }
        const up = (e: PointerEvent) => {
            const d = drag.current
            if (!d || e.pointerId !== d.id) return
            drag.current = null
            if (!d.moved) return
            const throwCards = clamp((-d.v * 220) / stepPx, -3, 3)
            go(Math.round(position.get() + throwCards))
        }
        window.addEventListener("pointermove", move)
        window.addEventListener("pointerup", up)
        window.addEventListener("pointercancel", up)
        return () => {
            window.removeEventListener("pointermove", move)
            window.removeEventListener("pointerup", up)
            window.removeEventListener("pointercancel", up)
        }
    }, [isStatic, nav.drag, stepPx, loop, n, go])

    // Trackpad / wheel: horizontal swipes step one card at a time.
    React.useEffect(() => {
        const el = rootRef.current
        if (!el || isStatic || !nav.wheel) return
        let acc = 0
        let lock = 0
        const onWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
            e.preventDefault()
            const now = performance.now()
            if (now < lock) return
            acc += e.deltaX
            if (Math.abs(acc) > 40) {
                step(acc > 0 ? 1 : -1)
                acc = 0
                lock = now + 380
            }
        }
        el.addEventListener("wheel", onWheel, { passive: false })
        return () => el.removeEventListener("wheel", onWheel)
    }, [isStatic, nav.wheel, step])

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (!nav.keyboard || isStatic) return
        if (e.key === "ArrowRight") {
            e.preventDefault()
            step(1)
        } else if (e.key === "ArrowLeft") {
            e.preventDefault()
            step(-1)
        } else if (e.key === "Home" && !loop) {
            e.preventDefault()
            go(0)
        } else if (e.key === "End" && !loop) {
            e.preventDefault()
            go(n - 1)
        }
    }

    // Autoplay.
    const [focusWithin, setFocusWithin] = React.useState(false)
    React.useEffect(() => {
        if (isStatic || reduced || !auto.enabled || !inView || paused || focusWithin || n < 2) return
        const id = window.setInterval(() => {
            if (drag.current) return
            if (!loop && Math.round(position.get()) >= n - 1) go(0)
            else step(1)
        }, Math.max(1, auto.interval) * 1000)
        return () => window.clearInterval(id)
    }, [isStatic, reduced, auto.enabled, auto.interval, inView, paused, focusWithin, n, loop, step, go])

    const onCardClick = (i: number, e: React.MouseEvent) => {
        if (suppressClick.current) {
            e.preventDefault()
            suppressClick.current = false
            return
        }
        if (i !== activeRef.current) {
            e.preventDefault()
            if (nav.clickSide) goTo(i)
            return
        }
        props.onCardClick?.(i)
    }

    /* ── e. render ────────────────────────────────────────────────────── */
    const fontSize = caption.font?.fontSize
    const captionStyle: React.CSSProperties = {
        ...caption.font,
        fontSize: typeof fontSize === "number" ? fontSize + "px" : fontSize,
        color: caption.color,
        textAlign: caption.align,
        margin: 0,
        marginTop: caption.gap,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    }
    const counterFontSize = arrows.counterFont?.fontSize
    const showCounter = arrows.counter && n > 0
    const arrowPath = ICONS[arrows.icon] || ICONS.triangle
    const strokeIcon = arrows.icon !== "triangle"

    return (
        <div
            ref={rootRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Carousel"
            tabIndex={nav.keyboard && !isStatic ? 0 : undefined}
            onKeyDown={onKeyDown}
            onPointerMove={onPointerMove}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            onPointerDown={onPointerDown}
            onFocus={() => setFocusWithin(true)}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusWithin(false)
            }}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background,
                touchAction: nav.drag ? "pan-y" : undefined,
                cursor: nav.drag && !isStatic ? "grab" : undefined,
                userSelect: "none",
                WebkitUserSelect: "none",
                outline: "none",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "calc(50% - " + arrowSpace / 2 + "px)",
                    width: 0,
                    height: 0,
                    transform: "scale(" + fit + ")",
                }}
            >
                {cards.map((c, i) => {
                    const isActive = i === active
                    const showCaption = caption.show === "all" || (caption.show === "active" && isActive)
                    const Frame: any = c.link ? "a" : "div"
                    const near = n <= 1 ? true : Math.abs(loop ? loopDistance(i, active, n) : i - active) <= shape.visible + 1
                    return (
                        <div
                            key={c.key}
                            ref={(el) => {
                                cardRefs.current[i] = el
                            }}
                            role="group"
                            aria-roledescription="slide"
                            aria-label={i + 1 + " of " + n + (c.title ? ": " + c.title : "")}
                            aria-hidden={!isActive}
                            style={{
                                position: "absolute",
                                left: -frameW / 2,
                                top: -frameH / 2,
                                width: frameW,
                                height: frameH,
                                willChange: isStatic ? undefined : "transform, opacity",
                                backfaceVisibility: "hidden",
                            }}
                        >
                            <Frame
                                href={c.link || undefined}
                                target={c.link && c.newTab ? "_blank" : undefined}
                                rel={c.link && c.newTab ? "noopener noreferrer" : undefined}
                                tabIndex={isActive ? undefined : -1}
                                draggable={false}
                                onClick={(e: React.MouseEvent) => onCardClick(i, e)}
                                style={{
                                    display: "block",
                                    position: "relative",
                                    width: "100%",
                                    height: "100%",
                                    boxSizing: "border-box",
                                    padding: card.frame,
                                    background: card.frameColor,
                                    borderRadius: card.radius,
                                    overflow: "hidden",
                                    textDecoration: "none",
                                    color: "inherit",
                                    cursor: isActive ? (c.link || props.onCardClick ? "pointer" : "inherit") : nav.clickSide ? "pointer" : "inherit",
                                    boxShadow: card.shadow > 0 ? "0 " + 30 * card.shadow + "px " + 80 * card.shadow + "px rgba(0,0,0," + 0.55 * card.shadow + ")" : undefined,
                                }}
                            >
                                <div
                                    style={{
                                        position: "relative",
                                        width: "100%",
                                        height: card.height,
                                        overflow: "hidden",
                                        background: c.fill || card.mediaFill,
                                        borderRadius: Math.max(0, card.radius - card.frame),
                                    }}
                                >
                                    {c.video && near && !isStatic ? (
                                        <video
                                            src={c.video}
                                            poster={c.src || undefined}
                                            autoPlay
                                            muted
                                            loop
                                            playsInline
                                            aria-label={c.alt || undefined}
                                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
                                        />
                                    ) : c.src ? (
                                        <img
                                            src={c.src}
                                            srcSet={c.srcSet}
                                            sizes={Math.round(card.width) + "px"}
                                            alt={c.alt}
                                            draggable={false}
                                            loading={near ? "eager" : "lazy"}
                                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
                                        />
                                    ) : null}
                                </div>
                                {caption.show !== "none" && (
                                    <p style={{ ...captionStyle, opacity: showCaption ? 1 : 0, transition: "opacity 0.4s ease" }}>{c.title || " "}</p>
                                )}
                                <div
                                    ref={(el) => {
                                        dimRefs.current[i] = el
                                    }}
                                    aria-hidden
                                    style={{ position: "absolute", inset: 0, background: shape.dimColor, opacity: 0, pointerEvents: "none" }}
                                />
                            </Frame>
                        </div>
                    )
                })}
            </div>

            {arrows.show && n > 1 && (
                <div
                    data-cc-control
                    style={{
                        position: "absolute",
                        left: "50%",
                        bottom: arrows.offset,
                        transform: "translateX(-50%)",
                        display: "flex",
                        alignItems: "center",
                        gap: arrows.gap,
                        zIndex: 2000,
                    }}
                >
                    <ArrowButton dir={-1} label="Previous card" path={arrowPath} stroke={strokeIcon} a={arrows} onClick={() => step(-1)} disabled={!loop && active === 0} />
                    {showCounter && (
                        <span
                            aria-hidden
                            style={{
                                ...arrows.counterFont,
                                fontSize: typeof counterFontSize === "number" ? counterFontSize + "px" : counterFontSize,
                                color: arrows.counterColor,
                                fontVariantNumeric: "tabular-nums",
                                minWidth: "4.5em",
                                textAlign: "center",
                            }}
                        >
                            {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
                        </span>
                    )}
                    <ArrowButton dir={1} label="Next card" path={arrowPath} stroke={strokeIcon} a={arrows} onClick={() => step(1)} disabled={!loop && active === n - 1} />
                </div>
            )}

            <div aria-live="polite" aria-atomic="true" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>
                {n > 0 ? "Card " + (active + 1) + " of " + n + (cards[active]?.title ? ": " + cards[active].title : "") : ""}
            </div>
        </div>
    )
}

function ArrowButton({ dir, label, path, stroke, a, onClick, disabled }: { dir: number; label: string; path: string; stroke: boolean; a: Props["arrows"]; onClick: () => void; disabled: boolean }) {
    const [hover, setHover] = React.useState(false)
    return (
        <button
            type="button"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            onPointerEnter={() => setHover(true)}
            onPointerLeave={() => setHover(false)}
            style={{
                width: a.size,
                height: a.size,
                padding: 0,
                border: "none",
                borderRadius: a.radius,
                background: hover && !disabled ? a.hoverFill : a.fill,
                color: a.color,
                display: "grid",
                placeItems: "center",
                cursor: disabled ? "default" : "pointer",
                opacity: disabled ? 0.4 : 1,
                transition: "background 0.2s ease, opacity 0.2s ease",
            }}
        >
            <svg width={a.iconSize} height={a.iconSize} viewBox="0 0 24 24" aria-hidden style={{ transform: dir > 0 ? "scaleX(-1)" : undefined }}>
                <path
                    d={path}
                    fill={stroke ? "none" : "currentColor"}
                    stroke={stroke ? "currentColor" : "none"}
                    strokeWidth={stroke ? 2.4 : 0}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    )
}

addPropertyControls(CascadeCardCarousel, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 40,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                video: { type: ControlType.File, title: "Video", allowedFileTypes: ["mp4", "webm", "mov"], description: "Optional. Plays instead of the image; the image is its poster." },
                title: { type: ControlType.String, title: "Title", defaultValue: "Card title" },
                link: { type: ControlType.Link, title: "Link" },
                newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false, hidden: (p: any) => !p.link },
            },
        },
        defaultValue: [],
    },
    startIndex: { type: ControlType.Number, title: "Start", min: 0, max: 39, step: 1, defaultValue: 0, displayStepper: true },
    card: {
        type: ControlType.Object,
        title: "Card",
        controls: {
            width: { type: ControlType.Number, title: "Width", min: 120, max: 2000, step: 10, unit: "px", defaultValue: DEFAULT_CARD.width },
            height: { type: ControlType.Number, title: "Height", min: 80, max: 2000, step: 10, unit: "px", defaultValue: DEFAULT_CARD.height },
            fit: { type: ControlType.Boolean, title: "Fit Frame", defaultValue: DEFAULT_CARD.fit, description: "Scales the cascade down to fit smaller frames." },
            fitWidth: { type: ControlType.Number, title: "Fit Width", min: 20, max: 100, unit: "%", defaultValue: DEFAULT_CARD.fitWidth, hidden: (p: any) => !p.fit, description: "Largest share of the frame width the front card may take." },
            mobileWidth: { type: ControlType.Number, title: "Mobile Width", min: 20, max: 100, unit: "%", defaultValue: DEFAULT_CARD.mobileWidth, hidden: (p: any) => !p.fit, description: "Used when the frame is narrower than 640px." },
            radius: { type: ControlType.Number, title: "Radius", min: 0, max: 80, unit: "px", defaultValue: DEFAULT_CARD.radius },
            frame: { type: ControlType.Number, title: "Frame", min: 0, max: 80, unit: "px", defaultValue: DEFAULT_CARD.frame },
            frameColor: { type: ControlType.Color, title: "Frame Color", defaultValue: DEFAULT_CARD.frameColor },
            mediaFill: { type: ControlType.Color, title: "Media Fill", defaultValue: DEFAULT_CARD.mediaFill },
            shadow: { type: ControlType.Number, title: "Shadow", min: 0, max: 1, step: 0.05, defaultValue: DEFAULT_CARD.shadow },
        },
    },
    shape: {
        type: ControlType.Object,
        title: "Cascade",
        controls: {
            spreadX: { type: ControlType.Number, title: "Step X", min: -100, max: 100, unit: "%", defaultValue: DEFAULT_SHAPE.spreadX },
            spreadY: { type: ControlType.Number, title: "Step Y", min: -100, max: 100, unit: "%", defaultValue: DEFAULT_SHAPE.spreadY },
            depth: { type: ControlType.Number, title: "Depth", min: 0, max: 800, unit: "px", defaultValue: DEFAULT_SHAPE.depth },
            turn: { type: ControlType.Number, title: "Turn", min: -60, max: 60, unit: "°", defaultValue: DEFAULT_SHAPE.turn },
            tilt: { type: ControlType.Number, title: "Tilt", min: -45, max: 45, unit: "°", defaultValue: DEFAULT_SHAPE.tilt },
            roll: { type: ControlType.Number, title: "Roll", min: -45, max: 45, unit: "°", defaultValue: DEFAULT_SHAPE.roll },
            perspective: { type: ControlType.Number, title: "Perspective", min: 300, max: 5000, step: 50, unit: "px", defaultValue: DEFAULT_SHAPE.perspective },
            visible: { type: ControlType.Number, title: "Side Cards", min: 1, max: 10, step: 1, displayStepper: true, defaultValue: DEFAULT_SHAPE.visible },
            dim: { type: ControlType.Number, title: "Dim", min: 0, max: 0.5, step: 0.01, defaultValue: DEFAULT_SHAPE.dim, description: "Darkening added per step away from the front card." },
            dimColor: { type: ControlType.Color, title: "Dim Color", defaultValue: DEFAULT_SHAPE.dimColor, hidden: (p: any) => p.dim === 0 },
            blur: { type: ControlType.Number, title: "Blur", min: 0, max: 8, step: 0.25, unit: "px", defaultValue: DEFAULT_SHAPE.blur, description: "Blur added per step away from the front card." },
        },
    },
    caption: {
        type: ControlType.Object,
        title: "Caption",
        controls: {
            show: { type: ControlType.Enum, title: "Show", options: ["active", "all", "none"], optionTitles: ["Front", "All", "None"], defaultValue: DEFAULT_CAPTION.show, displaySegmentedControl: true },
            font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: DEFAULT_CAPTION.font, hidden: (p: any) => p.show === "none" },
            color: { type: ControlType.Color, title: "Color", defaultValue: DEFAULT_CAPTION.color, hidden: (p: any) => p.show === "none" },
            gap: { type: ControlType.Number, title: "Gap", min: 0, max: 80, unit: "px", defaultValue: DEFAULT_CAPTION.gap, hidden: (p: any) => p.show === "none" },
            align: {
                type: ControlType.Enum,
                title: "Align",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: DEFAULT_CAPTION.align,
                displaySegmentedControl: true,
                hidden: (p: any) => p.show === "none",
            },
        },
    },
    navigation: {
        type: ControlType.Object,
        title: "Navigation",
        controls: {
            loop: { type: ControlType.Boolean, title: "Loop", defaultValue: DEFAULT_NAVIGATION.loop },
            drag: { type: ControlType.Boolean, title: "Drag", defaultValue: DEFAULT_NAVIGATION.drag },
            wheel: { type: ControlType.Boolean, title: "Trackpad", defaultValue: DEFAULT_NAVIGATION.wheel, description: "Horizontal trackpad swipes move one card." },
            keyboard: { type: ControlType.Boolean, title: "Keyboard", defaultValue: DEFAULT_NAVIGATION.keyboard },
            clickSide: { type: ControlType.Boolean, title: "Click Side", defaultValue: DEFAULT_NAVIGATION.clickSide, description: "Clicking a side card brings it to the front." },
            transition: { type: ControlType.Transition, title: "Transition", defaultValue: DEFAULT_NAVIGATION.transition },
        },
    },
    autoplay: {
        type: ControlType.Object,
        title: "Autoplay",
        controls: {
            enabled: { type: ControlType.Boolean, title: "Autoplay", defaultValue: DEFAULT_AUTOPLAY.enabled },
            interval: { type: ControlType.Number, title: "Interval", min: 1, max: 20, step: 0.5, unit: "s", defaultValue: DEFAULT_AUTOPLAY.interval, hidden: (p: any) => !p.enabled },
            pauseOnHover: { type: ControlType.Boolean, title: "Pause Hover", defaultValue: DEFAULT_AUTOPLAY.pauseOnHover, hidden: (p: any) => !p.enabled },
        },
    },
    arrows: {
        type: ControlType.Object,
        title: "Arrows",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: DEFAULT_ARROWS.show },
            icon: {
                type: ControlType.Enum,
                title: "Icon",
                options: ["triangle", "chevron", "arrow"],
                optionTitles: ["Triangle", "Chevron", "Arrow"],
                defaultValue: DEFAULT_ARROWS.icon,
                hidden: (p: any) => !p.show,
            },
            size: { type: ControlType.Number, title: "Size", min: 24, max: 120, unit: "px", defaultValue: DEFAULT_ARROWS.size, hidden: (p: any) => !p.show },
            iconSize: { type: ControlType.Number, title: "Icon Size", min: 6, max: 60, unit: "px", defaultValue: DEFAULT_ARROWS.iconSize, hidden: (p: any) => !p.show },
            radius: { type: ControlType.Number, title: "Radius", min: 0, max: 60, unit: "px", defaultValue: DEFAULT_ARROWS.radius, hidden: (p: any) => !p.show },
            fill: { type: ControlType.Color, title: "Fill", defaultValue: DEFAULT_ARROWS.fill, hidden: (p: any) => !p.show },
            hoverFill: { type: ControlType.Color, title: "Hover Fill", defaultValue: DEFAULT_ARROWS.hoverFill, hidden: (p: any) => !p.show },
            color: { type: ControlType.Color, title: "Icon Color", defaultValue: DEFAULT_ARROWS.color, hidden: (p: any) => !p.show },
            gap: { type: ControlType.Number, title: "Gap", min: 0, max: 80, unit: "px", defaultValue: DEFAULT_ARROWS.gap, hidden: (p: any) => !p.show },
            offset: { type: ControlType.Number, title: "Bottom", min: 0, max: 300, unit: "px", defaultValue: DEFAULT_ARROWS.offset, hidden: (p: any) => !p.show },
            counter: { type: ControlType.Boolean, title: "Counter", defaultValue: DEFAULT_ARROWS.counter, hidden: (p: any) => !p.show },
            counterFont: {
                type: ControlType.Font,
                title: "Counter Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: DEFAULT_ARROWS.counterFont,
                hidden: (p: any) => !p.show || !p.counter,
            },
            counterColor: { type: ControlType.Color, title: "Counter Color", defaultValue: DEFAULT_ARROWS.counterColor, hidden: (p: any) => !p.show || !p.counter },
        },
    },
    pointer: {
        type: ControlType.Object,
        title: "Parallax",
        controls: {
            parallax: { type: ControlType.Number, title: "Strength", min: 0, max: 2, step: 0.05, defaultValue: DEFAULT_POINTER.parallax },
            smoothing: { type: ControlType.Number, title: "Smoothing", min: 0, max: 0.95, step: 0.05, defaultValue: DEFAULT_POINTER.smoothing, hidden: (p: any) => p.parallax === 0 },
        },
    },
    intro: {
        type: ControlType.Object,
        title: "Intro",
        controls: {
            effect: { type: ControlType.Enum, title: "Effect", options: ["none", "fan", "rise", "fade"], optionTitles: ["None", "Fan Out", "Rise", "Fade"], defaultValue: DEFAULT_INTRO.effect },
            duration: { type: ControlType.Number, title: "Duration", min: 0.2, max: 4, step: 0.1, unit: "s", defaultValue: DEFAULT_INTRO.duration, hidden: (p: any) => p.effect === "none" },
            stagger: { type: ControlType.Number, title: "Stagger", min: 0, max: 0.4, step: 0.01, defaultValue: DEFAULT_INTRO.stagger, hidden: (p: any) => p.effect === "none" },
        },
    },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#161616" },
    onChange: { type: ControlType.EventHandler, title: "On Change" },
    onCardClick: { type: ControlType.EventHandler, title: "On Card Click" },
})
