import * as React from "react"
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react"
import {
    motion,
    AnimatePresence,
    motionValue,
    useMotionValue,
    useSpring,
    useTransform,
    animate,
    MotionValue,
} from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * Stack Deck — a tactile card stack you flick through.
 * Throw the top card left or right, it tucks back under the pile.
 *
 * In the Framer canvas and during export it renders a still preview of the
 * stack: no autoplay loop, springs, transitions, drag or hover effects.
 *
 * @framerIntrinsicWidth 1280
 * @framerIntrinsicHeight 800
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */

// ─── Types & helpers ─────────────────────────────────────────

type Item = {
    title?: string
    subtitle?: string
    image?: any
    accent?: string
    link?: string
}

const EASE = [0.22, 1, 0.36, 1] as const
const EASE_IN = [0.55, 0, 0.75, 0.06] as const
const SPREAD = [0, -5, 4, -3, 2.5, -2]
const INSTANT = { duration: 0 }

/** True while rendering in a static context (Framer canvas or export). */
const StaticContext = createContext(false)

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const imgSrc = (img: any) => (typeof img === "string" ? img : img?.src)

function toRgb(c: string) {
    const s = (c || "").trim()
    const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
    if (hex) {
        let h = hex[1]
        if (h.length === 3)
            h = h
                .split("")
                .map((x) => x + x)
                .join("")
        const n = parseInt(h, 16)
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
    }
    const fn = s.match(/rgba?\(([^)]+)\)/)
    if (fn) {
        const [r, g, b] = fn[1].split(",").map((x) => parseFloat(x))
        return { r, g, b }
    }
    return { r: 255, g: 255, b: 255 }
}
const rgba = (c: string, a: number) => {
    const { r, g, b } = toRgb(c)
    return `rgba(${r},${g},${b},${a})`
}
const mix = (a: string, b: string, t: number) => {
    const A = toRgb(a)
    const B = toRgb(b)
    return `rgb(${Math.round(lerp(A.r, B.r, t))},${Math.round(lerp(A.g, B.g, t))},${Math.round(lerp(A.b, B.b, t))})`
}
const isLight = (c: string) => {
    const { r, g, b } = toRgb(c)
    return 0.299 * r + 0.587 * g + 0.114 * b > 150
}

function useReducedMotion() {
    const [r, setR] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const q = window.matchMedia("(prefers-reduced-motion: reduce)")
        setR(q.matches)
        const fn = () => setR(q.matches)
        q.addEventListener?.("change", fn)
        return () => q.removeEventListener?.("change", fn)
    }, [])
    return r
}

// ─── Artwork ─────────────────────────────────────────────────

function FadeImg({ src, alt }: { src: string; alt: string }) {
    const isStatic = useContext(StaticContext)
    const [ok, setOk] = useState(false)
    // Static: show the image straight away, no fade or scale transition
    const shown = ok || isStatic
    return (
        <img
            src={src}
            alt={alt}
            draggable={false}
            onLoad={() => setOk(true)}
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                opacity: shown ? 1 : 0,
                transform: isStatic ? undefined : `scale(${shown ? 1 : 1.06})`,
                transition: isStatic
                    ? undefined
                    : "opacity .8s ease, transform 1.2s cubic-bezier(.22,1,.36,1)",
            }}
        />
    )
}

/** Text-free generative artwork, used when an item has no image. */
function Poster({
    accent,
    index,
    light,
}: {
    accent: string
    index: number
    light: boolean
}) {
    const base = light ? "#FFFFFF" : "#060607"
    const top = mix(accent, base, 0.6)
    const bottom = mix(accent, base, 0.86)
    const deep = light
        ? mix(accent, "#0A0A0C", 0.35)
        : mix(accent, "#FFFFFF", 0.2)
    const hi = mix(accent, "#FFFFFF", 0.5)
    const line = light ? rgba(deep, 0.35) : "rgba(255,255,255,0.35)"
    const id = `sd${index}${accent.replace(/[^0-9a-z]/gi, "")}`
    const kind = index % 6

    let art: React.ReactNode
    if (kind === 0)
        art = (
            <>
                <defs>
                    <radialGradient id={id + "o"} cx="36%" cy="30%" r="75%">
                        <stop offset="0" stopColor={hi} />
                        <stop offset="0.5" stopColor={accent} />
                        <stop
                            offset="1"
                            stopColor={mix(accent, "#0A0A0C", 0.45)}
                        />
                    </radialGradient>
                    <filter id={id + "b"}>
                        <feGaussianBlur stdDeviation="24" />
                    </filter>
                </defs>
                <circle
                    cx="150"
                    cy="200"
                    r="112"
                    fill={accent}
                    opacity="0.45"
                    filter={`url(#${id}b)`}
                />
                <circle cx="150" cy="200" r="92" fill={`url(#${id}o)`} />
                <ellipse
                    cx="150"
                    cy="200"
                    rx="150"
                    ry="26"
                    fill="none"
                    stroke={line}
                    transform="rotate(-14 150 200)"
                />
            </>
        )
    else if (kind === 1)
        art = (
            <>
                <circle cx="150" cy="220" r="96" fill={accent} />
                <rect x="0" y="220" width="300" height="180" fill={bottom} />
                {Array.from({ length: 8 }).map((_, k) => (
                    <rect
                        key={k}
                        x="40"
                        y={236 + k * 18}
                        width="220"
                        height={Math.max(1, 8 - k)}
                        rx="2"
                        fill={accent}
                        opacity={1 - k * 0.11}
                    />
                ))}
            </>
        )
    else if (kind === 2)
        art = (
            <>
                {Array.from({ length: 11 * 15 }).map((_, k) => {
                    const cx = 20 + (k % 11) * 26
                    const cy = 18 + Math.floor(k / 11) * 26
                    const on = Math.abs(cx - 150) + Math.abs(cy - 200) < 92
                    return (
                        <circle
                            key={k}
                            cx={cx}
                            cy={cy}
                            r={on ? 4.4 : 1.3}
                            fill={on ? accent : line}
                        />
                    )
                })}
            </>
        )
    else if (kind === 3)
        art = (
            <>
                <defs>
                    <clipPath id={id + "c"}>
                        <circle cx="150" cy="200" r="116" />
                    </clipPath>
                </defs>
                <g clipPath={`url(#${id}c)`}>
                    {Array.from({ length: 28 }).map((_, k) => (
                        <line
                            key={k}
                            x1={-60 + k * 16}
                            y1="380"
                            x2={90 + k * 16}
                            y2="20"
                            stroke={k % 3 === 0 ? hi : accent}
                            strokeWidth={k % 3 === 0 ? 3 : 6}
                            opacity={0.4 + (k % 5) * 0.12}
                        />
                    ))}
                </g>
                <circle cx="150" cy="200" r="116" fill="none" stroke={line} />
            </>
        )
    else if (kind === 4)
        art = (
            <>
                {Array.from({ length: 9 }).map((_, k) => (
                    <circle
                        key={k}
                        cx="0"
                        cy="400"
                        r={40 + k * 34}
                        fill="none"
                        stroke={accent}
                        strokeWidth={1.5}
                        opacity={1 - k * 0.09}
                    />
                ))}
                <circle cx="0" cy="400" r="40" fill={accent} />
                <circle
                    cx="232"
                    cy="100"
                    r="28"
                    fill="none"
                    stroke={deep}
                    strokeWidth="1.5"
                    opacity="0.6"
                />
                <circle cx="232" cy="100" r="6" fill={deep} opacity="0.8" />
            </>
        )
    else
        art = (
            <g transform="rotate(-24 150 200)">
                <rect
                    x="50"
                    y="110"
                    width="200"
                    height="54"
                    rx="27"
                    fill={accent}
                />
                <rect
                    x="30"
                    y="176"
                    width="240"
                    height="54"
                    rx="27"
                    fill="none"
                    stroke={accent}
                    strokeWidth="2"
                />
                <rect
                    x="70"
                    y="242"
                    width="160"
                    height="54"
                    rx="27"
                    fill={deep}
                    opacity={light ? 0.75 : 0.9}
                />
            </g>
        )

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                background: `linear-gradient(170deg, ${top} 0%, ${bottom} 70%)`,
            }}
        >
            <svg
                viewBox="0 0 300 400"
                preserveAspectRatio="xMidYMid slice"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                }}
            >
                {art}
            </svg>
        </div>
    )
}

function Art({
    item,
    index,
    light,
    fallback,
}: {
    item: Item
    index: number
    light: boolean
    fallback: string
}) {
    const src = imgSrc(item.image)
    if (src)
        return <FadeImg src={src} alt={item.image?.alt || item.title || ""} />
    return (
        <Poster accent={item.accent || fallback} index={index} light={light} />
    )
}

// ─── Card in the stack ───────────────────────────────────────

function DeckCard({
    item,
    index,
    depth,
    x,
    geo,
    o,
    light,
    isTop,
    still,
    interactive,
    onRelease,
    onTap,
}: any) {
    const inner = useRef<HTMLDivElement>(null)
    const glare = useRef<HTMLDivElement>(null)
    const dragRot = useTransform(
        x as MotionValue<number>,
        [-geo.cardW * 2, 0, geo.cardW * 2],
        [-o.throwTilt, 0, o.throwTilt]
    )
    const moved = useRef(false)

    const visible = depth <= o.visibleCards
    const k = Math.min(depth, o.visibleCards)
    const target = {
        y: -k * geo.cardH * 0.045 * o.stackOffset,
        scale: 1 - k * 0.055,
        rotate: depth === 0 ? 0 : SPREAD[depth % SPREAD.length] * o.spread,
        opacity: visible ? 1 : 0,
    }

    const resetHover = () => {
        if (inner.current)
            inner.current.style.transform = "rotateX(0deg) rotateY(0deg)"
        if (glare.current) glare.current.style.opacity = "0"
    }
    useEffect(() => {
        if (!isTop) resetHover()
    }, [isTop])

    const onMove = (e: React.PointerEvent) => {
        if (
            !interactive ||
            !o.hoverTilt ||
            !isTop ||
            e.pointerType !== "mouse" ||
            !inner.current
        )
            return
        const r = e.currentTarget.getBoundingClientRect()
        const lx = clamp((e.clientX - r.left) / r.width)
        const ly = clamp((e.clientY - r.top) / r.height)
        inner.current.style.transform = `rotateX(${(0.5 - ly) * 10}deg) rotateY(${(lx - 0.5) * 12}deg)`
        if (glare.current) {
            glare.current.style.opacity = "1"
            glare.current.style.background = `radial-gradient(circle at ${lx * 100}% ${ly * 100}%, rgba(255,255,255,0.5), rgba(255,255,255,0) 55%)`
        }
    }

    const canDrag = interactive && isTop && o.drag

    return (
        <motion.div
            initial={false}
            animate={target}
            transition={
                still
                    ? INSTANT
                    : { type: "spring", stiffness: 170, damping: 22, mass: 0.9 }
            }
            style={{
                position: "absolute",
                left: geo.sx - geo.cardW / 2,
                top: geo.sy - geo.cardH / 2,
                width: geo.cardW,
                height: geo.cardH,
                zIndex: 100 - depth,
                pointerEvents: interactive && isTop ? "auto" : "none",
            }}
        >
            <motion.div
                drag={canDrag ? "x" : false}
                dragMomentum={false}
                dragElastic={0.9}
                onDragStart={() => {
                    moved.current = true
                    resetHover()
                }}
                onDragEnd={(_, info) => onRelease(index, info)}
                onPointerDown={() => (moved.current = false)}
                onPointerMove={onMove}
                onPointerLeave={resetHover}
                onClick={() => interactive && !moved.current && onTap(index)}
                whileTap={canDrag ? { cursor: "grabbing" } : undefined}
                style={{
                    x,
                    rotate: dragRot,
                    position: "absolute",
                    inset: 0,
                    cursor:
                        interactive && isTop
                            ? o.drag
                                ? "grab"
                                : "pointer"
                            : "default",
                    touchAction: "pan-y",
                    transformPerspective: 1200,
                }}
            >
                <div
                    ref={inner}
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: o.radius,
                        overflow: "hidden",
                        background: light ? "#E9E8E4" : "#0D0D10",
                        boxShadow: light
                            ? `0 ${depth === 0 ? 40 : 18}px ${depth === 0 ? 70 : 40}px -30px rgba(20,20,30,${depth === 0 ? 0.45 : 0.3}), 0 2px 6px rgba(20,20,30,0.06)`
                            : `0 40px 70px -24px rgba(0,0,0,0.7)`,
                        transition: still
                            ? undefined
                            : "transform .6s cubic-bezier(.22,1,.36,1), box-shadow .6s",
                    }}
                >
                    <Art
                        item={item}
                        index={index}
                        light={light}
                        fallback={o.accent}
                    />
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: o.radius,
                            boxShadow: `inset 0 0 0 1px ${light ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.12)"}, inset 0 1px 0 rgba(255,255,255,0.35)`,
                            background:
                                "linear-gradient(155deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 30%)",
                            pointerEvents: "none",
                        }}
                    />
                    {interactive && (
                        <div
                            ref={glare}
                            style={{
                                position: "absolute",
                                inset: 0,
                                opacity: 0,
                                mixBlendMode: "overlay",
                                transition: "opacity .5s",
                                pointerEvents: "none",
                            }}
                        />
                    )}
                    <motion.div
                        initial={false}
                        animate={{ opacity: clamp(k * o.dim * 0.5) }}
                        transition={still ? INSTANT : { duration: 0.5 }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: o.background,
                            pointerEvents: "none",
                        }}
                    />
                </div>
            </motion.div>
        </motion.div>
    )
}

// ─── Text reveal ─────────────────────────────────────────────

function Words({ text, style, delay = 0, still = false }: any) {
    // Static: plain text, no word-by-word reveal
    if (still) return <span style={{ display: "block", ...style }}>{text}</span>

    const words = String(text || "").split(" ")
    return (
        <span style={{ display: "block", ...style }}>
            {words.map((w, k) => (
                <span
                    key={k}
                    style={{
                        display: "inline-block",
                        overflow: "hidden",
                        verticalAlign: "top",
                        paddingBottom: "0.1em",
                        marginBottom: "-0.1em",
                    }}
                >
                    <motion.span
                        initial={{ y: "110%" }}
                        animate={{
                            y: "0%",
                            transition: {
                                duration: 0.85,
                                ease: EASE,
                                delay: delay + k * 0.06,
                            },
                        }}
                        exit={{
                            y: "-110%",
                            transition: {
                                duration: 0.35,
                                ease: EASE_IN,
                                delay: k * 0.02,
                            },
                        }}
                        style={{ display: "inline-block" }}
                    >
                        {w}
                        {k < words.length - 1 ? " " : ""}
                    </motion.span>
                </span>
            ))}
        </span>
    )
}

// ─── Controls ────────────────────────────────────────────────

function Btn({
    onClick,
    label,
    children,
    fg,
    size = 46,
    solid = false,
    bg,
    interactive = true,
}: any) {
    const tx = useMotionValue(0)
    const ty = useMotionValue(0)
    const x = useSpring(tx, { stiffness: 260, damping: 18, mass: 0.6 })
    const y = useSpring(ty, { stiffness: 260, damping: 18, mass: 0.6 })
    return (
        <motion.button
            onClick={interactive ? onClick : undefined}
            aria-label={label}
            onPointerMove={(e) => {
                if (!interactive || e.pointerType !== "mouse") return
                const r = e.currentTarget.getBoundingClientRect()
                tx.set((e.clientX - r.left - r.width / 2) * 0.35)
                ty.set((e.clientY - r.top - r.height / 2) * 0.35)
            }}
            onPointerLeave={() => {
                tx.set(0)
                ty.set(0)
            }}
            whileHover={interactive ? { scale: 1.06 } : undefined}
            whileTap={interactive ? { scale: 0.92 } : undefined}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{
                x,
                y,
                position: "relative",
                width: size,
                height: size,
                borderRadius: 999,
                border: solid ? "none" : `1px solid ${rgba(fg, 0.12)}`,
                background: solid ? fg : "transparent",
                color: solid ? bg : fg,
                display: "grid",
                placeItems: "center",
                cursor: interactive ? "pointer" : "default",
                padding: 0,
            }}
        >
            {children}
        </motion.button>
    )
}

function PlayRing({ progress, fg, accent, size }: any) {
    const r = size / 2 + 1
    const C = 2 * Math.PI * r
    const off = useTransform(progress, (v: number) => C * (1 - v))
    const s = size + 6
    return (
        <svg
            width={s}
            height={s}
            viewBox={`0 0 ${s} ${s}`}
            style={{
                position: "absolute",
                inset: -3,
                pointerEvents: "none",
                transform: "rotate(-90deg)",
            }}
        >
            <motion.circle
                cx={s / 2}
                cy={s / 2}
                r={r}
                fill="none"
                stroke={accent}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={C}
                style={{ strokeDashoffset: off }}
            />
        </svg>
    )
}

const Arrow = ({ dir = 1 }: { dir?: 1 | -1 }) => (
    <svg
        width="15"
        height="15"
        viewBox="0 0 14 14"
        fill="none"
        style={{ transform: dir === -1 ? "scaleX(-1)" : undefined }}
    >
        <path
            d="M2 7h10M8 3l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

function Progress({
    n,
    active,
    progress,
    fg,
    accent,
    onSelect,
    still,
    interactive,
}: any) {
    return (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {Array.from({ length: n }).map((_, i) => (
                <button
                    key={i}
                    onClick={interactive ? () => onSelect(i) : undefined}
                    aria-label={`Go to item ${i + 1}`}
                    style={{
                        padding: "8px 0",
                        background: "none",
                        border: 0,
                        cursor: interactive ? "pointer" : "default",
                    }}
                >
                    <motion.span
                        initial={false}
                        animate={{ width: i === active ? 28 : 6 }}
                        transition={
                            still
                                ? INSTANT
                                : {
                                      type: "spring",
                                      stiffness: 300,
                                      damping: 30,
                                  }
                        }
                        style={{
                            display: "block",
                            position: "relative",
                            height: 6,
                            borderRadius: 6,
                            background: rgba(fg, 0.14),
                            overflow: "hidden",
                        }}
                    >
                        {i === active && (
                            <motion.span
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: accent,
                                    scaleX: progress,
                                    transformOrigin: "0 50%",
                                    borderRadius: 6,
                                }}
                            />
                        )}
                    </motion.span>
                </button>
            ))}
        </div>
    )
}

// ─── Main ────────────────────────────────────────────────────

export default function StackDeck(props: any) {
    const o = { ...props, ...(THEMES[props.theme] || {}) }
    const items: Item[] = o.items && o.items.length ? o.items : DEFAULT_ITEMS
    const n = items.length
    const fg = o.foreground
    const light = isLight(o.background)
    const reduced = useReducedMotion()

    // Canvas / export → one still frame: no loops, springs or interaction
    const isStatic = useIsStaticRenderer()
    const interactive = !isStatic
    const still = isStatic || reduced

    // Size & layout
    const root = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState({ w: 1280, h: 800 })
    useLayoutEffect(() => {
        const el = root.current
        if (!el) return
        const upd = () => {
            const w = el.offsetWidth || 1280
            const h = el.offsetHeight || 800
            setSize((s) =>
                Math.abs(s.w - w) < 1 && Math.abs(s.h - h) < 1 ? s : { w, h }
            )
        }
        upd()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(upd)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const geo = useMemo(() => {
        const W = size.w
        const H = size.h
        const portrait = W < H * 1.05
        const a = o.cardAspect
        const cardH =
            (portrait
                ? Math.min(H * 0.46, (W * 0.64) / a)
                : Math.min(H * 0.64, (W * 0.3) / a)) * o.cardScale
        const cardW = cardH * a
        const textLeft = o.textSide === "left"
        const sx = portrait ? W / 2 : textLeft ? W * 0.68 : W * 0.32
        const sy = portrait ? H * 0.4 : H * 0.52
        return {
            W,
            H,
            portrait,
            cardW,
            cardH,
            sx,
            sy,
            pad: portrait ? 22 : Math.max(32, W * 0.06),
        }
    }, [size.w, size.h, o.cardAspect, o.cardScale, o.textSide])

    // Deck state
    const start = clamp(Math.round(o.startIndex), 0, n - 1)
    const initialOrder = () =>
        Array.from({ length: n }, (_, k) => (start + k) % n)
    const [order, setOrder] = useState<number[]>(initialOrder)
    const orderRef = useRef(order)
    orderRef.current = order
    useEffect(() => setOrder(initialOrder()), [n, start])

    const xs = useMemo(
        () => Array.from({ length: n }, () => motionValue(0)),
        [n]
    )
    const active = order[0] ?? 0
    const progress = useMotionValue(0)
    const [playing, setPlaying] = useState(o.autoplay && !isStatic)
    const hovering = useRef(false)
    const busy = useRef(false)

    useEffect(() => setPlaying(o.autoplay && !isStatic), [o.autoplay, isStatic])
    useEffect(() => {
        if (isStatic) return
        o.onChange?.(active)
    }, [active, isStatic])

    // "auto" throws away from the text so the card never flies across it
    const throwDir: 1 | -1 =
        o.throwDirection === "auto"
            ? geo.portrait || o.textSide === "left"
                ? 1
                : -1
            : o.throwDirection === "right"
              ? 1
              : -1

    const throwTop = useCallback(
        async (dir: 1 | -1, velocity = 0) => {
            if (isStatic || busy.current || n < 2) return
            busy.current = true
            progress.set(0)
            const top = orderRef.current[0]
            const x = xs[top]
            if (!still)
                await animate(x, dir * (geo.cardW * 1.25 + 40), {
                    type: "spring",
                    stiffness: 260,
                    damping: 30,
                    velocity,
                    restDelta: 20,
                })
            setOrder((ord) => [...ord.slice(1), ord[0]])
            if (still) x.set(0)
            else
                animate(x, 0, {
                    type: "spring",
                    stiffness: 140,
                    damping: 20,
                    delay: 0.05,
                })
            setTimeout(() => (busy.current = false), still ? 0 : 260)
        },
        [xs, n, geo.cardW, still, isStatic, progress]
    )

    const bringBack = useCallback(() => {
        if (isStatic || busy.current || n < 2) return
        busy.current = true
        progress.set(0)
        const last = orderRef.current[n - 1]
        const x = xs[last]
        if (!still) x.set(throwDir * (geo.cardW * 1.25 + 40))
        setOrder((ord) => [ord[n - 1], ...ord.slice(0, n - 1)])
        if (!still)
            animate(x, 0, { type: "spring", stiffness: 150, damping: 20 })
        setTimeout(() => (busy.current = false), still ? 0 : 320)
    }, [xs, n, geo.cardW, still, isStatic, progress, throwDir])

    const next = useCallback(() => throwTop(throwDir), [throwTop, throwDir])

    const goTo = useCallback(
        (i: number) => {
            if (isStatic || i === orderRef.current[0] || busy.current) return
            progress.set(0)
            // reorder so i is on top, cards before it move to the back
            setOrder((ord) => {
                const at = ord.indexOf(i)
                return [...ord.slice(at), ...ord.slice(0, at)]
            })
            if (!still) {
                const x = xs[i]
                x.set(throwDir * geo.cardW)
                animate(x, 0, { type: "spring", stiffness: 150, damping: 20 })
            }
        },
        [xs, geo.cardW, still, isStatic, progress, throwDir]
    )

    const onRelease = (i: number, info: any) => {
        if (isStatic) return
        const x = xs[i]
        const dx = info.offset.x
        const vx = info.velocity.x
        if (Math.abs(dx) > geo.cardW * 0.28 || Math.abs(vx) > 550)
            throwTop(dx + vx * 0.1 > 0 ? 1 : -1, vx)
        else animate(x, 0, { type: "spring", stiffness: 320, damping: 26 })
    }

    const onTap = (i: number) => {
        if (isStatic) return
        const it = items[i]
        if (it.link && typeof window !== "undefined")
            window.open(it.link, o.newTab ? "_blank" : "_self")
        else next()
    }

    // Autoplay — never runs in a static context
    useEffect(() => {
        if (isStatic || !playing) return
        let raf = 0
        let last = performance.now()
        const loop = (t: number) => {
            const dt = Math.min(0.1, (t - last) / 1000)
            last = t
            const paused =
                (o.pauseOnHover && hovering.current) ||
                busy.current ||
                document.hidden
            if (!paused) {
                const v = progress.get() + dt / Math.max(0.8, o.interval)
                if (v >= 1) {
                    progress.set(0)
                    next()
                } else progress.set(v)
            }
            raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(raf)
    }, [isStatic, playing, o.interval, o.pauseOnHover, next, progress])

    // Stack parallax with the mouse (live only)
    const mx = useMotionValue(0)
    const my = useMotionValue(0)
    const rotY = useSpring(
        useTransform(mx, (v: number) => v * o.tilt),
        { stiffness: 90, damping: 18 }
    )
    const rotX = useSpring(
        useTransform(my, (v: number) => -v * o.tilt),
        { stiffness: 90, damping: 18 }
    )

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (isStatic || !o.keyboard) return
        if (e.key === "ArrowRight") (e.preventDefault(), next())
        else if (e.key === "ArrowLeft") (e.preventDefault(), bringBack())
        else if (e.key === " ") (e.preventDefault(), setPlaying((v) => !v))
    }

    const cur = items[active] || {}
    const accent = cur.accent || o.accent
    const titleSize =
        (geo.portrait
            ? Math.min(34, geo.W * 0.085)
            : Math.min(68, geo.W * 0.048)) * o.titleScale

    const textBlock: React.CSSProperties = geo.portrait
        ? { position: "absolute", left: geo.pad, right: geo.pad, bottom: 26 }
        : o.textSide === "left"
          ? {
                position: "absolute",
                left: geo.pad,
                width: geo.W * 0.36,
                top: "50%",
                transform: "translateY(-50%)",
            }
          : {
                position: "absolute",
                right: geo.pad,
                width: geo.W * 0.36,
                top: "50%",
                transform: "translateY(-50%)",
            }

    const subtitleStyle = {
        lineHeight: 1.55,
        color: rgba(fg, 0.55),
        maxWidth: 400,
        ...o.bodyFont,
        fontSize: geo.portrait ? 14 : 16,
    } as any

    const titleStyle = {
        lineHeight: 0.98,
        letterSpacing: "-0.04em",
        fontWeight: 500,
        color: fg,
        ...o.titleFont,
        fontSize: titleSize,
    }

    const textGap = geo.portrait ? 10 : 16

    return (
        <StaticContext.Provider value={isStatic}>
            <div
                ref={root}
                role="region"
                aria-roledescription="carousel"
                aria-label="Card deck"
                tabIndex={interactive && o.keyboard ? 0 : -1}
                onKeyDown={onKeyDown}
                onMouseEnter={() => (hovering.current = true)}
                onMouseLeave={() => {
                    hovering.current = false
                    mx.set(0)
                    my.set(0)
                }}
                onPointerMove={(e) => {
                    if (isStatic || e.pointerType !== "mouse") return
                    const r = root.current?.getBoundingClientRect()
                    if (!r) return
                    mx.set((e.clientX - r.left) / r.width - 0.5)
                    my.set((e.clientY - r.top) / r.height - 0.5)
                }}
                style={{
                    ...o.style,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    background: o.background,
                    color: fg,
                    fontFamily:
                        "Inter, 'SF Pro Display', system-ui, sans-serif",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    outline: "none",
                }}
            >
                {/* Soft colour glow behind the stack */}
                {o.glow > 0 && (
                    <div
                        aria-hidden
                        style={{
                            position: "absolute",
                            left: geo.sx,
                            top: geo.sy,
                            width: geo.cardW * 2.6,
                            height: geo.cardH * 1.6,
                            transform: "translate(-50%, -50%)",
                            color: accent,
                            transition: still ? undefined : "color 1.2s ease",
                            background:
                                "radial-gradient(closest-side, currentColor, transparent)",
                            opacity: (light ? 0.22 : 0.28) * o.glow,
                            filter: "blur(40px)",
                            pointerEvents: "none",
                        }}
                    />
                )}

                {/* Stack */}
                <motion.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        rotateX: isStatic ? 0 : rotX,
                        rotateY: isStatic ? 0 : rotY,
                        transformPerspective: 1400,
                        transformOrigin: `${geo.sx}px ${geo.sy}px`,
                    }}
                >
                    {items.map((it, i) => {
                        const depth = order.indexOf(i)
                        return (
                            <DeckCard
                                key={i}
                                item={it}
                                index={i}
                                depth={depth < 0 ? n : depth}
                                x={xs[i]}
                                geo={geo}
                                o={o}
                                light={light}
                                isTop={depth === 0}
                                still={still}
                                interactive={interactive}
                                onRelease={onRelease}
                                onTap={onTap}
                            />
                        )
                    })}
                </motion.div>

                {/* Text + controls */}
                <div
                    style={{
                        ...textBlock,
                        display: "flex",
                        flexDirection: "column",
                        gap: geo.portrait ? 18 : 30,
                    }}
                >
                    <div aria-live="polite" style={{ display: "grid" }}>
                        {isStatic ? (
                            // Static fallback: plain text, no reveal animation
                            <div
                                style={{
                                    gridArea: "1 / 1",
                                    alignSelf: "end",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: textGap,
                                }}
                            >
                                <Words
                                    text={cur.title}
                                    style={titleStyle}
                                    still
                                />
                                {o.showSubtitle && cur.subtitle && (
                                    <div style={subtitleStyle}>
                                        {cur.subtitle}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <AnimatePresence initial={false}>
                                <motion.div
                                    key={active}
                                    exit={{ opacity: 1 }}
                                    style={{
                                        gridArea: "1 / 1",
                                        alignSelf: "end",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: textGap,
                                    }}
                                >
                                    <Words
                                        text={cur.title}
                                        style={titleStyle}
                                        still={reduced}
                                    />
                                    {o.showSubtitle && cur.subtitle && (
                                        <motion.div
                                            initial={
                                                reduced
                                                    ? false
                                                    : {
                                                          opacity: 0,
                                                          y: 10,
                                                          filter: "blur(6px)",
                                                      }
                                            }
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                filter: "blur(0px)",
                                                transition: reduced
                                                    ? INSTANT
                                                    : {
                                                          duration: 0.8,
                                                          ease: EASE,
                                                          delay: 0.18,
                                                      },
                                            }}
                                            exit={{
                                                opacity: 0,
                                                transition: {
                                                    duration: reduced ? 0 : 0.2,
                                                },
                                            }}
                                            style={subtitleStyle}
                                        >
                                            {cur.subtitle}
                                        </motion.div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>

                    {(o.showControls || o.showProgress) && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 20,
                                flexWrap: "wrap",
                            }}
                        >
                            {o.showControls && (
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 10,
                                        alignItems: "center",
                                    }}
                                >
                                    <Btn
                                        onClick={bringBack}
                                        label="Previous"
                                        fg={fg}
                                        interactive={interactive}
                                    >
                                        <Arrow dir={-1} />
                                    </Btn>
                                    <Btn
                                        onClick={next}
                                        label="Next"
                                        fg={fg}
                                        solid
                                        bg={o.background}
                                        interactive={interactive}
                                    >
                                        {o.autoplay && playing && !isStatic && (
                                            <PlayRing
                                                progress={progress}
                                                fg={fg}
                                                accent={accent}
                                                size={46}
                                            />
                                        )}
                                        <Arrow />
                                    </Btn>
                                </div>
                            )}
                            {o.showProgress && (
                                <Progress
                                    n={n}
                                    active={active}
                                    progress={progress}
                                    fg={fg}
                                    accent={accent}
                                    onSelect={goTo}
                                    still={still}
                                    interactive={interactive}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </StaticContext.Provider>
    )
}

// ─── Defaults ────────────────────────────────────────────────

const THEMES: Record<string, any> = {
    light: { background: "#F2F1ED", foreground: "#141416" },
    dark: { background: "#0A0A0C", foreground: "#F4F4F5" },
    custom: {},
}

const DEFAULT_ITEMS: Item[] = [
    {
        title: "Blank Canvas",
        subtitle:
            "Cleared the slate and set one intent: make fewer things, better.",
        accent: "#6F7CFF",
    },
    {
        title: "First Retainer",
        subtitle: "A cold message turned into our first long-term client.",
        accent: "#FF7A45",
    },
    {
        title: "Brand System",
        subtitle: "Type, colour and motion rules that finally felt like us.",
        accent: "#9DBB2C",
    },
    {
        title: "Launch Week",
        subtitle: "Shipped the new site in seven very long days.",
        accent: "#22B8A8",
    },
    {
        title: "Late Nights",
        subtitle: "Mostly Figma, mostly coffee, occasionally breakthroughs.",
        accent: "#9B6BFF",
    },
    {
        title: "Offsite",
        subtitle: "Two days, no laptops and a whiteboard full of ideas.",
        accent: "#F2557F",
    },
]

StackDeck.defaultProps = {
    items: DEFAULT_ITEMS,
    theme: "light",
    background: "#F2F1ED",
    foreground: "#141416",
    accent: "#6F7CFF",
    textSide: "left",
    startIndex: 0,
    autoplay: true,
    interval: 3.5,
    pauseOnHover: true,
    drag: true,
    keyboard: true,
    throwDirection: "auto",
    throwTilt: 14,
    visibleCards: 3,
    stackOffset: 1.4,
    spread: 1,
    cardAspect: 0.78,
    cardScale: 1,
    radius: 22,
    dim: 0.35,
    tilt: 6,
    hoverTilt: true,
    glow: 1,
    titleScale: 1,
    showSubtitle: true,
    showControls: true,
    showProgress: true,
    newTab: false,
}

addPropertyControls(StackDeck, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 20,
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Title",
                },
                subtitle: {
                    type: ControlType.String,
                    title: "Subtitle",
                    displayTextArea: true,
                },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                accent: {
                    type: ControlType.Color,
                    title: "Accent",
                    defaultValue: "#6F7CFF",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },

    // Look
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["light", "dark", "custom"],
        optionTitles: ["Light", "Dark", "Custom"],
        displaySegmentedControl: true,
        defaultValue: "light",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F2F1ED",
        hidden: (p: any) => p.theme !== "custom",
    },
    foreground: {
        type: ControlType.Color,
        title: "Foreground",
        defaultValue: "#141416",
        hidden: (p: any) => p.theme !== "custom",
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#6F7CFF",
    },
    glow: {
        type: ControlType.Number,
        title: "Glow",
        min: 0,
        max: 2,
        step: 0.05,
        defaultValue: 1,
    },
    textSide: {
        type: ControlType.Enum,
        title: "Text Side",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        displaySegmentedControl: true,
        defaultValue: "left",
    },

    // Behaviour
    startIndex: {
        type: ControlType.Number,
        title: "Start",
        min: 0,
        max: 19,
        step: 1,
        defaultValue: 0,
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
    },
    interval: {
        type: ControlType.Number,
        title: "Interval",
        min: 1,
        max: 15,
        step: 0.1,
        unit: "s",
        defaultValue: 3.5,
        hidden: (p: any) => !p.autoplay,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Hover Pause",
        defaultValue: true,
        hidden: (p: any) => !p.autoplay,
    },
    drag: { type: ControlType.Boolean, title: "Swipe", defaultValue: true },
    keyboard: {
        type: ControlType.Boolean,
        title: "Keyboard",
        defaultValue: true,
    },
    throwDirection: {
        type: ControlType.Enum,
        title: "Throw To",
        options: ["auto", "left", "right"],
        optionTitles: ["Auto", "Left", "Right"],
        displaySegmentedControl: true,
        defaultValue: "auto",
    },

    // Stack
    visibleCards: {
        type: ControlType.Number,
        title: "Visible",
        min: 1,
        max: 6,
        step: 1,
        displayStepper: true,
        defaultValue: 3,
    },
    stackOffset: {
        type: ControlType.Number,
        title: "Offset",
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1.4,
    },
    spread: {
        type: ControlType.Number,
        title: "Messiness",
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1,
    },
    throwTilt: {
        type: ControlType.Number,
        title: "Throw Tilt",
        min: 0,
        max: 40,
        unit: "°",
        defaultValue: 14,
    },
    tilt: {
        type: ControlType.Number,
        title: "Mouse Tilt",
        min: 0,
        max: 20,
        step: 0.5,
        unit: "°",
        defaultValue: 6,
    },
    hoverTilt: {
        type: ControlType.Boolean,
        title: "Card Tilt",
        defaultValue: true,
    },

    // Cards
    cardAspect: {
        type: ControlType.Number,
        title: "Aspect",
        min: 0.5,
        max: 1.6,
        step: 0.01,
        defaultValue: 0.78,
    },
    cardScale: {
        type: ControlType.Number,
        title: "Card Size",
        min: 0.5,
        max: 1.5,
        step: 0.05,
        defaultValue: 1,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 60,
        unit: "px",
        defaultValue: 22,
    },
    dim: {
        type: ControlType.Number,
        title: "Dim Back",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.35,
    },

    // Typography
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    titleScale: {
        type: ControlType.Number,
        title: "Title Size",
        min: 0.5,
        max: 2,
        step: 0.05,
        defaultValue: 1,
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },

    // Interface
    showSubtitle: {
        type: ControlType.Boolean,
        title: "Subtitle",
        defaultValue: true,
    },
    showControls: {
        type: ControlType.Boolean,
        title: "Buttons",
        defaultValue: true,
    },
    showProgress: {
        type: ControlType.Boolean,
        title: "Progress",
        defaultValue: true,
    },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
    },

    onChange: { type: ControlType.EventHandler },
})
