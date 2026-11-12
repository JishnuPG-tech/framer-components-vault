import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "framer-motion"

// Story Breeze: a carousel of customer stories. The open story sits in the middle at full strength,
// the stories beside it fade back and blur. Each move dips every card to a slightly smaller size
// and lets it grow back, so the row breathes as it slides.

interface ImageValue {
    src: string
    srcSet?: string
    alt?: string
}

interface Story {
    stat?: string
    quote?: string
    name?: string
    role?: string
    brand?: string
    image?: ImageValue
    link?: string
    color?: string
}

interface StoryBreezeProps {
    stories: Story[]
    autoplay: boolean
    duration: number
    pauseOnHover: boolean
    speed: number
    dip: number
    sideOpacity: number
    sideBlur: number
    cardSize: number
    radius: number
    colorMode: "story" | "single"
    cardColor: string
    textColor: string
    labelColor: string
    accent: string
    buttonColor: string
    buttonIcon: string
    buttonAltColor: string
    buttonAltIcon: string
    quoteFont: CSSProperties
    statFont: CSSProperties
    tagFont: CSSProperties
    labelFont: CSSProperties
    style?: CSSProperties
}

const UNSPLASH = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&h=1200&q=80`

// Default content. Images fall back to these when a story has none.
const DEFAULT_STORIES: (Story & { focus?: string })[] = [
    {
        stat: "Paid 11 days sooner on average",
        quote: "Clients pay straight from the invoice link. I no longer chase wedding deposits.",
        name: "Maya Lindqvist",
        role: "Owner at Fern & Fable",
        brand: "Fern & Fable",
        image: { src: UNSPLASH("photo-1593011951342-8426e949371f"), alt: "Florist carrying a bucket of fresh flowers" },
        focus: "36% 50%",
    },
    {
        stat: "4 hours of admin saved every week",
        quote: "Tap, pay, done. The day’s takings are in my books before I lock up.",
        name: "Daniel Reyes",
        role: "Owner at Fade & Co.",
        brand: "Fade & Co.",
        image: { src: UNSPLASH("photo-1598524374912-6b0b0bab43dd"), alt: "Barber styling a client’s hair" },
    },
    {
        stat: "$9,400 in late invoices recovered",
        quote: "Friendly reminders go out on their own, so I never write the awkward email.",
        name: "Ana Ríos",
        role: "Founder at Bright Room Studio",
        brand: "Bright Room",
        image: { src: UNSPLASH("photo-1494790108377-be9c29b29330"), alt: "Smiling photographer in a red sweater" },
    },
    {
        stat: "Tax season done in one afternoon",
        quote: "Every sale is sorted as it happens. My accountant barely has to ask me anything.",
        name: "Ravi Menon",
        role: "Head chef at Copper Pot Kitchen",
        brand: "Copper Pot",
        image: { src: UNSPLASH("photo-1721924960760-bb134eb9c679"), alt: "Chef talking in a restaurant kitchen" },
    },
    {
        stat: "Projects start twice as fast",
        quote: "Deposits are paid the moment a proposal is signed, so work starts that day.",
        name: "Kwame Mensah",
        role: "Partner at Hollow Oak Studio",
        brand: "Hollow Oak",
        image: { src: UNSPLASH("photo-1506634572416-48cdfe530110"), alt: "Designer in a red sweater and glasses" },
    },
]

// Soft card colors, used in turn when a story has no color of its own.
const PALETTE = ["#F1E6D6", "#DCE9DD", "#E2E4F3", "#F4DFD8", "#D9EAEA"]

const SANS = '"Plus Jakarta Sans", "Inter", system-ui, sans-serif'
const EASE: [number, number, number, number] = [0.65, 0, 0.35, 1]

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const out = (t: number) => 1 - Math.pow(1 - t, 3)
const mod = (n: number, m: number) => ((n % m) + m) % m
const px = (v: unknown, fallback: number) => {
    const n = typeof v === "number" ? v : parseFloat(String(v ?? ""))
    return Number.isFinite(n) ? n : fallback
}
const mark = (v: number) => `rotate(-1.5deg) scaleX(${v})`

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

function ensureFont(id: string, href: string) {
    if (typeof document === "undefined" || document.getElementById(id)) return
    const link = document.createElement("link")
    link.id = id
    link.rel = "stylesheet"
    link.href = href
    document.head.appendChild(link)
}

// The result line is split around its first number, which counts up and gets the highlight.
// Without a number, the last two words get the highlight instead.
interface StatParts {
    pre: string
    num: string
    post: string
    value: number
    decimals: number
    commas: boolean
}
function splitStat(s: string): StatParts {
    const m = s.match(/\d[\d,]*(?:\.\d+)?/)
    if (m && m.index !== undefined) {
        const raw = m[0].replace(/,$/, "")
        return {
            pre: s.slice(0, m.index),
            num: raw,
            post: s.slice(m.index + raw.length),
            value: parseFloat(raw.replace(/,/g, "")),
            decimals: raw.includes(".") ? raw.split(".")[1].length : 0,
            commas: raw.includes(","),
        }
    }
    const words = s.trim().split(/\s+/)
    const tail = words.slice(-2).join(" ")
    const pre = words.length > 2 ? words.slice(0, -2).join(" ") + " " : ""
    return { pre, num: tail, post: "", value: NaN, decimals: 0, commas: false }
}
function formatNum(v: number, decimals: number, commas: boolean) {
    const s = v.toFixed(decimals)
    if (!commas) return s
    const [i, d] = s.split(".")
    return i.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (d ? "." + d : "")
}

interface Item {
    stat: StatParts
    quote: string
    name: string
    role: string
    brand: string
    link?: string
    image: ImageValue
    focus: string
    tint: string
}

interface Geo {
    W: number
    compact: boolean
    cw: number
    ch: number
    top: number
    step: number
    btn: number
    btnTop: number
    pad: number
    R: number
    photo: { x: number; y: number; w: number; h: number }
    text: { x: number; y: number; w: number; h: number }
    s: number
    reach: number
}

function computeGeo(W: number, H: number, size: number, radius: number): Geo {
    const compact = W < 640
    const btn = compact ? 46 : 52
    const btnGap = compact ? 18 : 26
    const share = compact ? 0.84 : W < 1000 ? 0.8 : clamp(size / 100, 0.4, 0.9)
    const cw = Math.min(W * share, compact ? 520 : 1040)
    const room = Math.max(200, H - btn - btnGap)
    const ch = Math.min(room, compact ? cw * 1.5 : cw * 0.56)
    const top = Math.max(0, (H - (ch + btnGap + btn)) / 2)
    const gap = compact ? 12 : clamp(W * 0.025, 16, 36)
    const R = Math.max(0, Math.min(radius, ch / 2, cw / 2))
    const pad = compact ? clamp(cw * 0.04, 10, 16) : clamp(cw * 0.022, 12, 20)
    let photo, text, s
    if (compact) {
        const pw = cw - 2 * pad
        const ph = clamp(ch * 0.44, 120, pw * 1.1)
        photo = { x: pad, y: pad, w: pw, h: ph }
        const ty = pad + ph + 16
        text = { x: pad + 6, y: ty, w: pw - 12, h: ch - ty - pad - 4 }
        s = Math.min(clamp(cw / 420, 0.56, 0.84), clamp(text.h / 400, 0.5, 0.84))
    } else {
        const ph = ch - 2 * pad
        const pw = Math.min(ph * 0.8, cw * 0.42)
        photo = { x: pad, y: pad, w: pw, h: ph }
        const tx = pad + pw + clamp(cw * 0.05, 20, 48)
        const inset = clamp(cw * 0.02, 10, 22)
        text = { x: tx, y: pad + inset, w: cw - tx - clamp(cw * 0.05, 20, 44), h: ph - inset * 2 }
        s = Math.min(clamp(text.w / 480, 0.58, 1.05), clamp(ph / 420, 0.58, 1.05))
    }
    // how many places out a card can sit and still touch the frame
    const reach = Math.ceil((W / 2 + cw / 2) / (cw + gap)) + 0.5
    return { W, compact, cw, ch, top, step: cw + gap, btn, btnTop: top + ch + btnGap, pad, R, photo, text, s, reach }
}

/**
 * Story Breeze
 * A carousel of customer stories. The open story sits in the middle, the ones beside it fade back
 * and blur, and every move shrinks the cards a little before they grow back.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 560
 */
export default function StoryBreeze(props: StoryBreezeProps) {
    const {
        stories,
        autoplay = false,
        duration = 5,
        pauseOnHover = true,
        speed = 0.75,
        dip = 8,
        sideOpacity = 0.45,
        sideBlur = 6,
        cardSize = 66,
        radius = 32,
        colorMode = "story",
        cardColor = "#FFFFFF",
        textColor = "#1B1A17",
        labelColor = "rgba(27, 26, 23, 0.62)",
        accent = "#FF6A3D",
        buttonColor = "#1B1A17",
        buttonIcon = "#FFFFFF",
        buttonAltColor = "#FFFFFF",
        buttonAltIcon = "#1B1A17",
        quoteFont = {},
        statFont = {},
        tagFont = {},
        labelFont = {},
        style,
    } = props

    const source = (stories && stories.length ? stories : DEFAULT_STORIES).slice(0, 12)
    const items: Item[] = source.map((st, i) => {
        const fallback = DEFAULT_STORIES[i % DEFAULT_STORIES.length]
        const own = !!st.image?.src
        return {
            stat: splitStat(st.stat ?? ""),
            quote: (st.quote ?? "").trim(),
            name: st.name ?? "",
            role: st.role ?? "",
            brand: st.brand ?? "",
            link: st.link,
            image: own ? (st.image as ImageValue) : fallback.image!,
            focus: own ? "50% 40%" : fallback.focus || "50% 40%",
            tint: colorMode === "single" ? cardColor : st.color || PALETTE[i % PALETTE.length],
        }
    })
    const n = items.length
    const loop = n >= 3

    const isStatic = useIsStaticRenderer()
    const reduced = useReducedMotion() ?? false

    useEffect(() => {
        if (![quoteFont, statFont, tagFont, labelFont].some((f) => !f || !f.fontFamily)) return
        ensureFont("story-breeze-font", "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap")
    }, [quoteFont?.fontFamily, statFont?.fontFamily, tagFont?.fontFamily, labelFont?.fontFamily])

    const rootRef = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState({ w: 1200, h: 560 })
    useIsoLayoutEffect(() => {
        const el = rootRef.current
        if (!el) return
        // offsetWidth ignores the canvas zoom, unlike getBoundingClientRect
        const measure = () => {
            const w = el.offsetWidth
            const h = el.offsetHeight
            if (w && h) setSize((s) => (s.w === w && s.h === h ? s : { w, h }))
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    const G = computeGeo(size.w, size.h, cardSize, radius)

    // pos is the story in the middle, as a continuous number. Whole numbers are at rest.
    const pos = useMotionValue(0)
    const [index, setIndex] = useState(0)
    const target = useRef({ to: 0, moving: false })
    useEffect(
        () =>
            pos.on("change", (v) => {
                const i = loop ? mod(Math.round(v), n) : clamp(Math.round(v), 0, n - 1)
                setIndex((c) => (c === i ? c : i))
            }),
        [n, loop]
    )

    const go = (to: number) => {
        let t = Math.round(to)
        if (!loop) t = clamp(t, 0, n - 1)
        target.current = { to: mod(t, n), moving: true }
        lastMove.current = Date.now()
        if (reduced || isStatic) {
            pos.set(t)
            target.current.moving = false
            return
        }
        animate(pos, t, {
            duration: Math.max(0.2, speed),
            ease: EASE,
            onComplete: () => {
                target.current.moving = false
            },
        })
    }
    const step = (dir: 1 | -1) => go(Math.round(pos.get()) + dir)

    // autoplay
    const hover = useRef(false)
    const inView = useRef(true)
    const lastMove = useRef(Date.now())
    const goRef = useRef(step)
    goRef.current = step
    useEffect(() => {
        if (!autoplay || isStatic || n < 2) return
        const id = window.setInterval(() => {
            if ((pauseOnHover && hover.current) || !inView.current || document.hidden || dragging.current) return
            if (Date.now() - lastMove.current < Math.max(1, duration) * 1000 - 50) return
            goRef.current(1)
        }, 200)
        return () => window.clearInterval(id)
    }, [autoplay, isStatic, n, pauseOnHover, duration])
    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(([e]) => (inView.current = e.isIntersecting), { threshold: 0.15 })
        io.observe(el)
        return () => io.disconnect()
    }, [])

    // drag or swipe the row
    const dragging = useRef(false)
    const drag = useRef({ x: 0, y: 0, start: 0, lastX: 0, lastT: 0, v: 0, moved: false, id: -1 })
    const onPointerDown = (e: ReactPointerEvent) => {
        if (isStatic || n < 2 || e.button !== 0) return
        const d = drag.current
        d.x = d.lastX = e.clientX
        d.y = e.clientY
        d.lastT = performance.now()
        d.v = 0
        d.start = pos.get()
        d.moved = false
        d.id = e.pointerId
        dragging.current = true
    }
    const onPointerMove = (e: ReactPointerEvent) => {
        const d = drag.current
        if (!dragging.current || e.pointerId !== d.id) return
        const dx = e.clientX - d.x
        if (!d.moved) {
            if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(e.clientY - d.y)) return
            d.moved = true
            pos.stop()
            target.current.moving = false
            ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
        }
        let v = d.start - dx / G.step
        if (!loop) v = v < 0 ? v * 0.3 : v > n - 1 ? n - 1 + (v - n + 1) * 0.3 : v
        pos.set(v)
        const now = performance.now()
        d.v = d.v * 0.5 + ((e.clientX - d.lastX) / Math.max(1, now - d.lastT)) * 0.5
        d.lastX = e.clientX
        d.lastT = now
    }
    const onPointerUp = (e: ReactPointerEvent) => {
        const d = drag.current
        if (!dragging.current || e.pointerId !== d.id) return
        dragging.current = false
        if (!d.moved) return
        const v = performance.now() - d.lastT > 80 ? 0 : d.v
        const cur = pos.get()
        const base = Math.round(d.start)
        let t = v < -0.3 ? Math.ceil(cur) : v > 0.3 ? Math.floor(cur) : Math.round(cur)
        t = clamp(t, base - 1, base + 1)
        go(t)
    }

    const label = `${index + 1} of ${n}`
    const fontOf = (f: CSSProperties, size: number, lh: string, weight: number, ls?: string, min = 10): CSSProperties => ({
        fontFamily: SANS,
        fontWeight: weight,
        letterSpacing: ls,
        ...f,
        fontSize: Math.max(min, px(f?.fontSize, size) * G.s),
        lineHeight: f?.lineHeight ?? lh,
    })
    const fonts = {
        quote: fontOf(quoteFont, 28, "1.3em", 500, "-0.015em", 15),
        stat: fontOf(statFont, 40, "1.1em", 600, "-0.03em", 19),
        name: fontOf(tagFont, 16, "1.3em", 700, "-0.01em", 13),
        label: fontOf(labelFont, 12, "1.2em", 700, "0.12em", 10),
    }
    const look = { dip: clamp(dip, 0, 40) / 100, sideOpacity: clamp(sideOpacity, 0, 1), sideBlur: Math.max(0, sideBlur) }

    return (
        <div
            ref={rootRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Customer stories"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "ArrowRight") {
                    e.preventDefault()
                    step(1)
                } else if (e.key === "ArrowLeft") {
                    e.preventDefault()
                    step(-1)
                }
            }}
            onPointerEnter={(e) => {
                if (e.pointerType === "mouse") hover.current = true
            }}
            onPointerLeave={() => (hover.current = false)}
            style={{ ...style, position: "relative", width: "100%", height: "100%", outline: "none", userSelect: "none", WebkitUserSelect: "none", overflow: "hidden" }}
        >
            <div
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                aria-live={autoplay ? "off" : "polite"}
                style={{ position: "absolute", left: 0, right: 0, top: G.top, height: G.ch, touchAction: "pan-y", cursor: n > 1 && !isStatic ? "grab" : "default" }}
            >
                {items.map((it, i) => (
                    <Card
                        key={i}
                        item={it}
                        i={i}
                        n={n}
                        loop={loop}
                        pos={pos}
                        G={G}
                        look={look}
                        target={target}
                        fonts={fonts}
                        textColor={textColor}
                        labelColor={labelColor}
                        accent={accent}
                        active={i === index}
                        onSelect={(off) => {
                            if (drag.current.moved) return
                            go(Math.round(pos.get()) + off)
                        }}
                    />
                ))}
            </div>
            {n > 1 && (
                <div style={{ position: "absolute", left: 0, right: 0, top: G.btnTop, height: G.btn, display: "flex", justifyContent: "center", gap: 12 }}>
                    <RoundButton label="Previous story" dir={-1} size={G.btn} bg={buttonAltColor} fg={buttonAltIcon} border onClick={() => step(-1)} disabled={!loop && index <= 0} />
                    <RoundButton label="Next story" dir={1} size={G.btn} bg={buttonColor} fg={buttonIcon} onClick={() => step(1)} disabled={!loop && index >= n - 1} />
                </div>
            )}
            <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>{`Story ${label}`}</span>
        </div>
    )
}

function RoundButton({ label, dir, size, bg, fg, border, onClick, disabled }: { label: string; dir: 1 | -1; size: number; bg: string; fg: string; border?: boolean; onClick: () => void; disabled: boolean }) {
    const [down, setDown] = useState(false)
    return (
        <button
            type="button"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            onPointerDown={() => setDown(true)}
            onPointerUp={() => setDown(false)}
            onPointerLeave={() => setDown(false)}
            style={{
                width: size,
                height: size,
                borderRadius: "50%",
                border: border ? "1px solid rgba(27, 26, 23, 0.12)" : "none",
                background: bg,
                color: fg,
                display: "grid",
                placeItems: "center",
                padding: 0,
                cursor: disabled ? "default" : "pointer",
                opacity: disabled ? 0.4 : 1,
                transform: down ? "scale(0.92)" : "scale(1)",
                transition: "transform 0.15s, opacity 0.2s",
                boxShadow: "0 10px 24px -14px rgba(27, 26, 23, 0.5)",
            }}
        >
            <svg width={size * 0.36} height={size * 0.36} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {dir < 0 ? <path d="M19 12H5M11 6l-6 6 6 6" /> : <path d="M5 12h14M13 6l6 6-6 6" />}
            </svg>
        </button>
    )
}

function Card({
    item,
    i,
    n,
    loop,
    pos,
    G,
    look,
    target,
    fonts,
    textColor,
    labelColor,
    accent,
    active,
    onSelect,
}: {
    item: Item
    i: number
    n: number
    loop: boolean
    pos: MotionValue<number>
    G: Geo
    look: { dip: number; sideOpacity: number; sideBlur: number }
    target: { current: { to: number; moving: boolean } }
    fonts: { quote: CSSProperties; stat: CSSProperties; name: CSSProperties; label: CSSProperties }
    textColor: string
    labelColor: string
    accent: string
    active: boolean
    onSelect: (offset: number) => void
}) {
    // signed distance from the middle, wrapped so the row loops
    const off = (p: number) => {
        let o = i - p
        if (loop) {
            o = mod(o + n / 2, n) - n / 2
        }
        return o
    }
    const side = (p: number) => Math.min(1, Math.abs(off(p)))
    // every card dips a little smaller halfway between two stories, then grows back
    const breathe = (p: number) => 1 - look.dip * Math.sin(Math.PI * (p - Math.floor(p)))
    const x = useTransform(pos, (p) => G.W / 2 - G.cw / 2 + off(p) * G.step)
    const scale = useTransform(pos, breathe)
    const opacity = useTransform(pos, (p) => mix(1, look.sideOpacity, side(p)))
    const filter = useTransform(pos, (p) => {
        const b = look.sideBlur * side(p)
        return b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none"
    })
    const zIndex = useTransform(pos, (p) => 100 - Math.round(Math.abs(off(p)) * 10))
    const display = useTransform(pos, (p) => (Math.abs(off(p)) > G.reach ? "none" : "block"))
    const photoScale = useTransform(pos, (p) => 1 + 0.06 * side(p))

    // the arriving story counts its result up and draws its highlight
    const numRef = useRef<HTMLSpanElement>(null)
    const markRef = useRef<HTMLSpanElement>(null)
    const { stat } = item
    useEffect(() => {
        const paint = (p: number) => {
            const t = target.current
            const arriving = t.moving && t.to === i
            const k = arriving ? out(1 - side(p)) : 1
            if (numRef.current && Number.isFinite(stat.value)) numRef.current.textContent = formatNum(stat.value * k, stat.decimals, stat.commas)
            if (markRef.current) markRef.current.style.transform = mark(arriving ? out(clamp((1 - side(p) - 0.4) / 0.6)) : 1)
        }
        paint(pos.get())
        return pos.on("change", paint)
    }, [stat.num, i, n])

    const P = G.photo
    const T = G.text
    const r = Math.max(6, G.R - G.pad)
    return (
        <motion.div
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${n}: ${item.name}`}
            aria-hidden={!active}
            onClick={() => {
                if (!active) onSelect(Math.round(off(pos.get())))
            }}
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: G.cw,
                height: G.ch,
                x,
                scale,
                opacity,
                filter,
                zIndex,
                display,
                borderRadius: G.R,
                background: item.tint,
                overflow: "hidden",
                cursor: active ? "inherit" : "pointer",
                boxShadow: "0 30px 70px -48px rgba(27, 26, 23, 0.5)",
                willChange: "transform, filter, opacity",
            }}
        >
            <div style={{ position: "absolute", left: P.x, top: P.y, width: P.w, height: P.h, borderRadius: r, overflow: "hidden", background: "rgba(0,0,0,0.06)" }}>
                <motion.img
                    src={item.image.src}
                    srcSet={item.image.srcSet}
                    alt={item.image.alt || item.name}
                    draggable={false}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: item.focus, display: "block", scale: photoScale }}
                />
                {item.brand && (
                    <span
                        style={{
                            ...fonts.label,
                            position: "absolute",
                            left: 12,
                            top: 12,
                            padding: "7px 12px 6px",
                            borderRadius: 999,
                            background: "rgba(255, 255, 255, 0.9)",
                            color: textColor,
                            textTransform: "uppercase",
                            fontSize: Math.max(9, (fonts.label.fontSize as number) * 0.92),
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                        }}
                    >
                        {item.brand}
                    </span>
                )}
            </div>
            <div style={{ position: "absolute", left: T.x, top: T.y, width: T.w, height: T.h, display: "flex", flexDirection: "column", color: textColor, pointerEvents: active ? "auto" : "none", overflow: "hidden" }}>
                <p style={{ ...fonts.quote, margin: 0, flex: "none" }}>
                    <span style={{ color: accent }}>“</span>
                    {item.quote}
                    <span>”</span>
                </p>
                <div style={{ marginTop: Math.max(10, 20 * G.s), flex: "none" }}>
                    <div style={{ ...fonts.name }}>{item.name}</div>
                    <div style={{ ...fonts.name, fontWeight: 500, fontSize: Math.max(12, (fonts.name.fontSize as number) * 0.88), color: labelColor, marginTop: 2 }}>{item.role}</div>
                </div>
                <div style={{ flex: 1, minHeight: Math.max(10, 14 * G.s) }} />
                <div style={{ borderTop: `1px solid color-mix(in srgb, ${textColor} 14%, transparent)`, paddingTop: Math.max(10, 18 * G.s), display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flex: "none" }}>
                    <div style={{ ...fonts.stat, minWidth: 0 }}>
                        {stat.pre}
                        <span style={{ position: "relative", display: "inline-block", whiteSpace: "nowrap" }}>
                            <span
                                ref={markRef}
                                aria-hidden
                                style={{ position: "absolute", left: "-0.1em", right: "-0.1em", top: "0.55em", bottom: "0.04em", background: accent, opacity: 0.34, borderRadius: "0.14em", transformOrigin: "0 50%", transform: mark(1) }}
                            />
                            <span style={{ position: "relative", visibility: Number.isFinite(stat.value) ? "hidden" : "visible" }}>{stat.num}</span>
                            {Number.isFinite(stat.value) && (
                                <span ref={numRef} style={{ position: "absolute", left: 0, top: 0 }}>
                                    {stat.num}
                                </span>
                            )}
                        </span>
                        {stat.post}
                    </div>
                    {item.link && (
                        <a
                            href={item.link}
                            style={{
                                ...fonts.name,
                                fontSize: Math.max(12, (fonts.name.fontSize as number) * 0.88),
                                flex: "none",
                                color: textColor,
                                textDecoration: "none",
                                padding: "9px 16px",
                                borderRadius: 999,
                                background: "rgba(255, 255, 255, 0.7)",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Read story →
                        </a>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

addPropertyControls(StoryBreeze, {
    stories: {
        type: ControlType.Array,
        title: "Stories",
        description: "One card per story. Photos are cropped to fit.",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                quote: { type: ControlType.String, title: "Quote", defaultValue: "Clients pay straight from the invoice link.", displayTextArea: true },
                name: { type: ControlType.String, title: "Name", defaultValue: "Maya Lindqvist" },
                role: { type: ControlType.String, title: "Role", defaultValue: "Owner at Fern & Fable" },
                brand: { type: ControlType.String, title: "Label", defaultValue: "Fern & Fable", description: "Short name on the photo, like the business name." },
                stat: {
                    type: ControlType.String,
                    title: "Result",
                    defaultValue: "Paid 11 days sooner on average",
                    displayTextArea: true,
                    description: "The first number counts up and gets the highlight. With no number, the last two words get it.",
                },
                image: { type: ControlType.ResponsiveImage, title: "Photo" },
                color: { type: ControlType.Color, title: "Color", optional: true, description: "Card color for this story. Leave it empty to use the built-in palette." },
                link: { type: ControlType.Link, title: "Link", description: "Adds a Read story button to the card." },
            },
        },
        defaultValue: DEFAULT_STORIES.map(({ stat, quote, name, role, brand }) => ({ stat, quote, name, role, brand })),
    },
    autoplay: { type: ControlType.Boolean, title: "Autoplay", defaultValue: false },
    duration: { type: ControlType.Number, title: "Duration", defaultValue: 5, min: 2, max: 20, step: 0.5, unit: "s", description: "How long each story stays in the middle.", hidden: (p: Partial<StoryBreezeProps>) => !p.autoplay },
    pauseOnHover: { type: ControlType.Boolean, title: "Pause on Hover", defaultValue: true, hidden: (p: Partial<StoryBreezeProps>) => !p.autoplay },
    speed: { type: ControlType.Number, title: "Transition", defaultValue: 0.75, min: 0.2, max: 2, step: 0.05, unit: "s", description: "How long one move takes." },
    dip: { type: ControlType.Number, title: "Shrink", defaultValue: 8, min: 0, max: 30, step: 1, unit: "%", description: "How much smaller the cards get halfway through a move, before they grow back." },
    sideOpacity: { type: ControlType.Number, title: "Side Opacity", defaultValue: 0.45, min: 0, max: 1, step: 0.05, description: "Opacity of the cards beside the middle one." },
    sideBlur: { type: ControlType.Number, title: "Side Blur", defaultValue: 6, min: 0, max: 30, step: 1, unit: "px", description: "Blur on the cards beside the middle one." },
    cardSize: { type: ControlType.Number, title: "Card Width", defaultValue: 66, min: 40, max: 90, step: 1, unit: "%", description: "Width of the middle card on wide screens. Tablets and phones use a wider card." },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 32, min: 0, max: 64, step: 1, description: "Card corner radius. The photo gets a matching inner radius." },
    colorMode: { type: ControlType.Enum, title: "Card Color", options: ["story", "single"], optionTitles: ["Per Story", "One Color"], displaySegmentedControl: true, defaultValue: "story" },
    cardColor: { type: ControlType.Color, title: "Card", defaultValue: "#FFFFFF", hidden: (p: Partial<StoryBreezeProps>) => p.colorMode !== "single" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#1B1A17" },
    labelColor: { type: ControlType.Color, title: "Muted Text", defaultValue: "rgba(27, 26, 23, 0.62)" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#FF6A3D", description: "The quote mark and the highlight behind the result." },
    buttonColor: { type: ControlType.Color, title: "Next Button", defaultValue: "#1B1A17" },
    buttonIcon: { type: ControlType.Color, title: "Next Icon", defaultValue: "#FFFFFF" },
    buttonAltColor: { type: ControlType.Color, title: "Back Button", defaultValue: "#FFFFFF" },
    buttonAltIcon: { type: ControlType.Color, title: "Back Icon", defaultValue: "#1B1A17" },
    quoteFont: { type: ControlType.Font, title: "Quote Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 28, lineHeight: "1.3em", letterSpacing: "-0.015em" } },
    statFont: { type: ControlType.Font, title: "Result Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 40, lineHeight: "1.1em", letterSpacing: "-0.03em" } },
    tagFont: { type: ControlType.Font, title: "Name Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 16, lineHeight: "1.3em" } },
    labelFont: { type: ControlType.Font, title: "Label Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 12, lineHeight: "1.2em", letterSpacing: "0.12em" } },
})
