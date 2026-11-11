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

type Entry = {
    quote?: string
    name?: string
    role?: string
    rating?: number
    photo?: { src?: string; alt?: string }
    photoUrl?: string
    color?: string
    textColor?: string
    link?: string
}

type Shape = {
    sizing?: "ratio" | "fill"
    ratio?: number
    tabWidth?: number
    gap?: number
    inset?: number
    hoverGrow?: number
    radius?: number
    padding?: number
}

type Extras = {
    showMark?: boolean
    showCount?: boolean
    showStars?: boolean
    showRule?: boolean
    tabAvatar?: boolean
    photoSize?: number
    photoRadius?: number
}

type Behaviour = {
    trigger?: "click" | "hover"
    autoplay?: boolean
    interval?: number
    pauseOnHover?: boolean
    newTab?: boolean
}

type Feel = {
    duration?: number
    drift?: number
    curve?: "smooth" | "snappy" | "gentle"
}

type Props = {
    items?: Entry[]
    startAt?: number
    shape?: Shape
    extras?: Extras
    behaviour?: Behaviour
    feel?: Feel
    quoteFont?: React.CSSProperties
    nameFont?: React.CSSProperties
    metaFont?: React.CSSProperties
    labelFont?: React.CSSProperties
    background?: string
    style?: React.CSSProperties
}

const CURVES: Record<string, [number, number, number, number]> = {
    smooth: [0.62, 0.02, 0.28, 1],
    snappy: [0.8, 0, 0.15, 1],
    gentle: [0.4, 0, 0.2, 1],
}

const portrait = (id: string) =>
    `https://images.unsplash.com/${id}?w=400&h=400&q=80&auto=format&fit=crop&crop=faces`

const SAMPLE: Entry[] = [
    {
        quote: "We rebuilt our whole onboarding in a week. The flow finally feels calm, and sign-ups jumped the month we shipped it.",
        name: "Ines Valcourt",
        role: "Head of Product",
        rating: 5,
        photoUrl: portrait("photo-1494790108377-be9c29b29330"),
        color: "#E9E2D4",
        textColor: "#16130F",
    },
    {
        quote: "Every detail is considered. Our team stopped arguing about pixels and started shipping things people actually notice.",
        name: "Tobias Achterberg",
        role: "Founder",
        rating: 5,
        photoUrl: portrait("photo-1500648767791-00dcc994a43e"),
        color: "#D9714A",
        textColor: "#1C0E07",
    },
    {
        quote: "It slotted straight into our site. Clients now ask who made it, which is the best kind of compliment we get.",
        name: "Noor Haddad",
        role: "Design Lead",
        rating: 5,
        photoUrl: portrait("photo-1438761681033-6461ffad8d80"),
        color: "#2F4A3F",
        textColor: "#EEE8DB",
    },
    {
        quote: "Fast, thoughtful and genuinely easy to work with. It felt like adding a senior designer to the team overnight.",
        name: "Rafael Quintero",
        role: "Marketing Director",
        rating: 4,
        photoUrl: portrait("photo-1507003211169-0a1dd7228f2d"),
        color: "#C6B9E2",
        textColor: "#17142B",
    },
    {
        quote: "Our landing page went from forgettable to the thing people screenshot. Bookings followed within the first week.",
        name: "Saoirse Doyle",
        role: "Studio Owner",
        rating: 5,
        photoUrl: portrait("photo-1534528741775-53994a69daeb"),
        color: "#F0C65C",
        textColor: "#1D1605",
    },
    {
        quote: "Polished, flexible and quick to customise. It is the first section our visitors interact with, and they stay longer.",
        name: "Kenji Arakawa",
        role: "Creative Director",
        rating: 5,
        photoUrl: portrait("photo-1506794778202-cad84cf45f1d"),
        color: "#782C3A",
        textColor: "#F7E9E4",
    },
]

const pick = <T,>(v: T | undefined, d: T): T =>
    v === undefined || v === null ? d : v
const srcOf = (e: Entry) => (e.photo && e.photo.src) || e.photoUrl || ""
const initials = (n?: string) =>
    (n || "")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]!.toUpperCase())
        .join("")
const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`)

const MARK_PATH =
    "M0 20.5V12C0 5.4 3.6 1.3 10.2 0l1.3 2.6C7.9 3.8 6 6.3 5.8 9.6H11v10.9H0zm15 0V12c0-6.6 3.6-10.7 10.2-12l1.3 2.6c-3.6 1.2-5.5 3.7-5.7 7H26v10.9H15z"

function starPoints(r: number, cx: number, cy: number) {
    const pts: string[] = []
    for (let k = 0; k < 10; k++) {
        const rad = k % 2 === 0 ? r : r * 0.46
        const a = -Math.PI / 2 + (k * Math.PI) / 5
        pts.push(
            `${(cx + Math.cos(a) * rad).toFixed(2)},${(cy + Math.sin(a) * rad).toFixed(2)}`
        )
    }
    return pts.join(" ")
}
const STAR = starPoints(6, 6, 6.4)

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Pennant(props: Props) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <PennantStill {...props} />
    return <PennantLive {...props} />
}

/* ------------------------------------------------------------------ */
/* Canvas / export branch — plain divs only                            */
/* ------------------------------------------------------------------ */

function PennantStill(props: Props) {
    const list = props.items && props.items.length ? props.items : SAMPLE
    const count = list.length
    const s = props.shape || {}
    const x = props.extras || {}
    const tabW = pick(s.tabWidth, 48)
    const gap = pick(s.gap, 4)
    const inset = pick(s.inset, 40)
    const radius = pick(s.radius, 14)
    const pad = pick(s.padding, 22)
    const fill = s.sizing === "fill"
    const ratio = Math.max(0.1, pick(s.ratio, 0.62))
    const on = Math.min(count - 1, Math.max(0, pick(props.startAt, 1) - 1))
    const showMark = pick(x.showMark, true)
    const showCount = pick(x.showCount, true)
    const showStars = pick(x.showStars, true)
    const showRule = pick(x.showRule, true)
    const tabAvatar = pick(x.tabAvatar, true)
    const photo = pick(x.photoSize, 52)
    const photoR = pick(x.photoRadius, 12)
    const dot = Math.max(16, tabW - 12)

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: pick(props.background, "#0B0B0C"),
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap,
                    width: "100%",
                    height: fill ? "100%" : undefined,
                    aspectRatio: fill ? undefined : `${1 / ratio}`,
                    maxHeight: "100%",
                }}
            >
                {list.map((e, i) => {
                    const ink = e.textColor || "#16130F"
                    const src = srcOf(e)
                    if (i !== on) {
                        return (
                            <div
                                key={i}
                                style={{
                                    flex: "none",
                                    position: "relative",
                                    width: tabW,
                                    height: `calc(100% - ${inset * 2}px)`,
                                    borderRadius: tabW / 2,
                                    background: e.color || "#E9E2D4",
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        paddingBottom: tabAvatar ? dot + 6 : 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <span
                                        style={{
                                            writingMode: "vertical-rl",
                                            transform: "rotate(180deg)",
                                            whiteSpace: "nowrap",
                                            color: ink,
                                            ...props.labelFont,
                                        }}
                                    >
                                        {e.name}
                                    </span>
                                </div>
                                {tabAvatar ? (
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: (tabW - dot) / 2,
                                            bottom: (tabW - dot) / 2,
                                            width: dot,
                                            height: dot,
                                            borderRadius: "50%",
                                            overflow: "hidden",
                                            background: "rgba(0,0,0,0.12)",
                                        }}
                                    >
                                        {src ? (
                                            <img
                                                src={src}
                                                alt=""
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    display: "block",
                                                }}
                                            />
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        )
                    }
                    const stars = Math.max(
                        0,
                        Math.min(5, Math.round(pick(e.rating, 5)))
                    )
                    return (
                        <div
                            key={i}
                            style={{
                                flex: "1 1 0",
                                minWidth: 0,
                                position: "relative",
                                height: "100%",
                                borderRadius: radius,
                                background: e.color || "#E9E2D4",
                                overflow: "hidden",
                                color: ink,
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    top: pad,
                                    left: pad,
                                    right: pad,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                }}
                            >
                                {showMark ? (
                                    <svg
                                        width={30}
                                        height={24}
                                        viewBox="0 0 26 21"
                                        style={{ display: "block" }}
                                    >
                                        <path d={MARK_PATH} fill={ink} />
                                    </svg>
                                ) : (
                                    <span />
                                )}
                                {showCount ? (
                                    <span
                                        style={{
                                            opacity: 0.6,
                                            ...props.metaFont,
                                        }}
                                    >
                                        {pad2(i + 1)} / {pad2(count)}
                                    </span>
                                ) : null}
                            </div>
                            <p
                                style={{
                                    position: "absolute",
                                    top: pad + (showMark ? 46 : 8),
                                    left: pad,
                                    right: pad,
                                    margin: 0,
                                    ...props.quoteFont,
                                }}
                            >
                                {e.quote}
                            </p>
                            <div
                                style={{
                                    position: "absolute",
                                    left: pad,
                                    right: pad,
                                    bottom: pad,
                                    paddingTop: showRule ? 16 : 0,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                }}
                            >
                                {showRule ? (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: 1,
                                            background: ink,
                                            opacity: 0.25,
                                        }}
                                    />
                                ) : null}
                                <div
                                    style={{
                                        position: "relative",
                                        flex: "none",
                                        width: photo,
                                        height: photo,
                                        borderRadius: photoR,
                                        overflow: "hidden",
                                        background: "rgba(0,0,0,0.12)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        ...props.nameFont,
                                    }}
                                >
                                    {initials(e.name)}
                                    {src ? (
                                        <img
                                            src={src}
                                            alt={
                                                (e.photo && e.photo.alt) ||
                                                e.name ||
                                                ""
                                            }
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    ) : null}
                                </div>
                                <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                                    <div style={{ ...props.nameFont }}>
                                        {e.name}
                                    </div>
                                    <div
                                        style={{
                                            opacity: 0.65,
                                            marginTop: 3,
                                            ...props.metaFont,
                                        }}
                                    >
                                        {e.role}
                                    </div>
                                </div>
                                {showStars && stars > 0 ? (
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 2,
                                            flex: "none",
                                        }}
                                    >
                                        {Array.from({ length: 5 }).map(
                                            (_, k) => (
                                                <svg
                                                    key={k}
                                                    width={13}
                                                    height={13}
                                                    viewBox="0 0 12 12"
                                                >
                                                    <polygon
                                                        points={STAR}
                                                        fill={ink}
                                                        opacity={
                                                            k < stars ? 1 : 0.22
                                                        }
                                                    />
                                                </svg>
                                            )
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Live branch                                                         */
/* ------------------------------------------------------------------ */

function useReducedMotion() {
    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setReduced(mq.matches)
        sync()
        mq.addEventListener
            ? mq.addEventListener("change", sync)
            : mq.addListener(sync)
        return () => {
            mq.removeEventListener
                ? mq.removeEventListener("change", sync)
                : mq.removeListener(sync)
        }
    }, [])
    return reduced
}

function useOnScreen(ref: React.RefObject<HTMLElement>) {
    const [seen, setSeen] = useState(false)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            setSeen(true)
            return
        }
        const io = new IntersectionObserver(
            (rows) => {
                for (const r of rows) setSeen(r.isIntersecting)
            },
            { threshold: 0.05 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [ref])
    return seen
}

function usePageShown() {
    const [shown, setShown] = useState(true)
    useEffect(() => {
        if (typeof document === "undefined") return
        const sync = () => setShown(document.visibilityState !== "hidden")
        sync()
        document.addEventListener("visibilitychange", sync)
        return () => document.removeEventListener("visibilitychange", sync)
    }, [])
    return shown
}

function Face({
    src,
    name,
    alt,
    size,
    round,
    font,
}: {
    src: string
    name?: string
    alt: string
    size: number
    round: number | string
    font?: React.CSSProperties
}) {
    const [broken, setBroken] = useState(false)
    return (
        <div
            style={{
                position: "relative",
                flex: "none",
                width: size,
                height: size,
                borderRadius: round,
                overflow: "hidden",
                background: "rgba(0,0,0,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...font,
            }}
        >
            {initials(name)}
            {src && !broken ? (
                <img
                    src={src}
                    alt={alt}
                    draggable={false}
                    onError={() => setBroken(true)}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        userSelect: "none",
                    }}
                />
            ) : null}
        </div>
    )
}

function PennantLive(props: Props) {
    const list = props.items && props.items.length ? props.items : SAMPLE
    const count = list.length
    const s = props.shape || {}
    const x = props.extras || {}
    const b = props.behaviour || {}
    const f = props.feel || {}

    const tabW = pick(s.tabWidth, 48)
    const gap = pick(s.gap, 4)
    const inset = pick(s.inset, 40)
    const lift = pick(s.hoverGrow, 6)
    const radius = pick(s.radius, 14)
    const pad = pick(s.padding, 22)
    const fill = s.sizing === "fill"
    const ratio = Math.max(0.1, pick(s.ratio, 0.62))
    const trigger = pick(b.trigger, "click")
    const showMark = pick(x.showMark, true)
    const showCount = pick(x.showCount, true)
    const showStars = pick(x.showStars, true)
    const showRule = pick(x.showRule, true)
    const tabAvatar = pick(x.tabAvatar, true)
    const photo = pick(x.photoSize, 52)
    const photoR = pick(x.photoRadius, 12)
    const dot = Math.max(16, tabW - 12)

    const reduced = useReducedMotion()
    const dur = reduced ? 0 : Math.max(0.05, pick(f.duration, 0.46))
    const ease = CURVES[pick(f.curve, "smooth")] || CURVES.smooth
    const drift = reduced ? 0 : pick(f.drift, 22)

    const shellRef = useRef<HTMLDivElement>(null)
    const [box, setBox] = useState({ w: 700, h: 700 })

    useLayoutEffect(() => {
        const el = shellRef.current
        if (!el) return
        const read = () => {
            const r = el.getBoundingClientRect()
            setBox((p) =>
                Math.abs(p.w - r.width) < 0.5 && Math.abs(p.h - r.height) < 0.5
                    ? p
                    : { w: r.width, h: r.height }
            )
        }
        read()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(read)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const first = Math.min(count - 1, Math.max(0, pick(props.startAt, 1) - 1))
    const [pair, setPair] = useState({ on: first, was: first })
    const on = Math.min(pair.on, count - 1)
    const was = Math.min(pair.was, count - 1)
    const [hot, setHot] = useState(-1)

    // Each panel pins its content to the edge that stays put while it grows
    // or shrinks, so the moving edge reveals / covers it instead of sliding it.
    const sides = useRef<boolean[]>([])
    if (on !== was) {
        sides.current[on] = on > was
        sides.current[was] = was > on
    }

    const open = useCallback((i: number) => {
        setPair((p) => (p.on === i ? p : { on: i, was: p.on }))
    }, [])

    /* autoplay — starts locked, armed only while permitted */
    const seen = useOnScreen(shellRef)
    const shown = usePageShown()
    const paused = !!b.pauseOnHover && hot !== -1
    const permit =
        !!b.autoplay && seen && shown && !reduced && !paused && count > 1
    const permitRef = useRef(permit)
    permitRef.current = permit

    useEffect(() => {
        if (!permit) return
        const wait = Math.max(1, pick(b.interval, 5)) * 1000
        const t = window.setTimeout(() => {
            if (!permitRef.current) return
            open((on + 1) % count)
        }, wait)
        return () => window.clearTimeout(t)
    }, [permit, on, count, b.interval, open])

    const rowW = box.w
    const rowH = fill ? box.h : Math.min(box.h, box.w * ratio)
    const openW = Math.max(tabW, rowW - (count - 1) * (tabW + gap))
    const restH = Math.max(0, rowH - inset * 2)
    const hotH = Math.max(0, rowH - Math.max(0, inset - lift) * 2)

    const sweep = { duration: dur, ease }
    const settle = {
        duration: reduced ? 0 : 0.32,
        ease: [0.25, 0.8, 0.3, 1] as [number, number, number, number],
    }

    const onKey = (ev: React.KeyboardEvent) => {
        if (ev.key === "ArrowRight" || ev.key === "ArrowDown") {
            ev.preventDefault()
            open((on + 1) % count)
        } else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") {
            ev.preventDefault()
            open((on - 1 + count) % count)
        }
    }

    return (
        <div
            ref={shellRef}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: pick(props.background, "#0B0B0C"),
                overflow: "hidden",
            }}
        >
            <div
                role="tablist"
                aria-label="Testimonials"
                aria-orientation="horizontal"
                onKeyDown={onKey}
                onMouseLeave={() => setHot(-1)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap,
                    width: rowW,
                    height: rowH,
                }}
            >
                {list.map((e, i) => {
                    const active = i === on
                    const right = !!sides.current[i]
                    const ink = e.textColor || "#16130F"
                    const src = srcOf(e)
                    const h = active ? rowH : hot === i ? hotH : restH
                    const moving = i === on || i === was
                    const stars = Math.max(
                        0,
                        Math.min(5, Math.round(pick(e.rating, 5)))
                    )

                    return (
                        <motion.div
                            key={i}
                            role="tab"
                            aria-selected={active}
                            aria-label={e.name}
                            tabIndex={active ? 0 : -1}
                            initial={false}
                            animate={{
                                width: active ? openW : tabW,
                                height: h,
                                borderRadius: active ? radius : tabW / 2,
                            }}
                            transition={{
                                width: sweep,
                                borderRadius: sweep,
                                height:
                                    moving && (active || hot !== i)
                                        ? sweep
                                        : settle,
                            }}
                            onMouseEnter={() => {
                                setHot(i)
                                if (trigger === "hover") open(i)
                            }}
                            onClick={() => {
                                if (!active) {
                                    open(i)
                                    return
                                }
                                if (e.link && typeof window !== "undefined") {
                                    window.open(
                                        e.link,
                                        b.newTab ? "_blank" : "_self"
                                    )
                                }
                            }}
                            style={{
                                position: "relative",
                                flex: "none",
                                overflow: "hidden",
                                background: e.color || "#E9E2D4",
                                color: ink,
                                cursor: active
                                    ? e.link
                                        ? "pointer"
                                        : "default"
                                    : "pointer",
                                outline: "none",
                                WebkitTapHighlightColor: "transparent",
                                isolation: "isolate",
                            }}
                        >
                            {/* open testimonial, pinned to the stationary edge */}
                            <motion.div
                                aria-hidden={!active}
                                initial={false}
                                animate={{
                                    x: active ? 0 : right ? -drift : drift,
                                }}
                                transition={active ? { duration: 0 } : sweep}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: right ? "auto" : 0,
                                    right: right ? 0 : "auto",
                                    width: openW,
                                    height: rowH,
                                    pointerEvents: active ? "auto" : "none",
                                }}
                            >
                                <motion.div
                                    initial={false}
                                    animate={{
                                        opacity: active ? 1 : 0,
                                        y: active ? 0 : 8,
                                    }}
                                    transition={
                                        active
                                            ? {
                                                  delay: dur * 0.18,
                                                  duration: dur * 0.5,
                                                  ease: "easeOut",
                                              }
                                            : {
                                                  delay: dur * 0.5,
                                                  duration: dur * 0.3,
                                              }
                                    }
                                    style={{
                                        position: "absolute",
                                        top: pad,
                                        left: pad,
                                        right: pad,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        {showMark ? (
                                            <svg
                                                width={30}
                                                height={24}
                                                viewBox="0 0 26 21"
                                                style={{ display: "block" }}
                                            >
                                                <path
                                                    d={MARK_PATH}
                                                    fill={ink}
                                                />
                                            </svg>
                                        ) : (
                                            <span />
                                        )}
                                        {showCount ? (
                                            <span
                                                style={{
                                                    opacity: 0.6,
                                                    ...props.metaFont,
                                                }}
                                            >
                                                {pad2(i + 1)} / {pad2(count)}
                                            </span>
                                        ) : null}
                                    </div>
                                    <p
                                        style={{
                                            margin: 0,
                                            marginTop: showMark ? 22 : 8,
                                            ...props.quoteFont,
                                        }}
                                    >
                                        {e.quote}
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={false}
                                    animate={{ opacity: active ? 1 : 0 }}
                                    transition={
                                        active
                                            ? {
                                                  delay: dur * 0.4,
                                                  duration: dur * 0.5,
                                              }
                                            : { duration: dur * 0.28 }
                                    }
                                    style={{
                                        position: "absolute",
                                        left: pad,
                                        right: pad,
                                        bottom: pad,
                                        paddingTop: showRule ? 16 : 0,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                    }}
                                >
                                    {showRule ? (
                                        <motion.div
                                            initial={false}
                                            animate={{ scaleX: active ? 1 : 0 }}
                                            transition={
                                                active
                                                    ? {
                                                          delay: dur * 0.45,
                                                          duration: dur * 1.1,
                                                          ease: [
                                                              0.22, 1, 0.36, 1,
                                                          ],
                                                      }
                                                    : { duration: 0 }
                                            }
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                height: 1,
                                                background: ink,
                                                opacity: 0.25,
                                                transformOrigin: "0% 50%",
                                            }}
                                        />
                                    ) : null}
                                    <Face
                                        src={src}
                                        name={e.name}
                                        alt={
                                            (e.photo && e.photo.alt) ||
                                            e.name ||
                                            ""
                                        }
                                        size={photo}
                                        round={photoR}
                                        font={props.nameFont}
                                    />
                                    <div
                                        style={{
                                            flex: "1 1 auto",
                                            minWidth: 0,
                                        }}
                                    >
                                        <div style={{ ...props.nameFont }}>
                                            {e.name}
                                        </div>
                                        <div
                                            style={{
                                                opacity: 0.65,
                                                marginTop: 3,
                                                ...props.metaFont,
                                            }}
                                        >
                                            {e.role}
                                        </div>
                                    </div>
                                    {showStars && stars > 0 ? (
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 2,
                                                flex: "none",
                                            }}
                                        >
                                            {Array.from({ length: 5 }).map(
                                                (_, k) => (
                                                    <motion.svg
                                                        key={k}
                                                        width={13}
                                                        height={13}
                                                        viewBox="0 0 12 12"
                                                        initial={false}
                                                        animate={{
                                                            scale: active
                                                                ? 1
                                                                : 0.4,
                                                            opacity: active
                                                                ? 1
                                                                : 0,
                                                        }}
                                                        transition={
                                                            active
                                                                ? {
                                                                      delay:
                                                                          dur *
                                                                              0.55 +
                                                                          k *
                                                                              0.05,
                                                                      type: "spring",
                                                                      stiffness: 520,
                                                                      damping: 22,
                                                                  }
                                                                : {
                                                                      duration: 0.15,
                                                                  }
                                                        }
                                                    >
                                                        <polygon
                                                            points={STAR}
                                                            fill={ink}
                                                            opacity={
                                                                k < stars
                                                                    ? 1
                                                                    : 0.22
                                                            }
                                                        />
                                                    </motion.svg>
                                                )
                                            )}
                                        </div>
                                    ) : null}
                                </motion.div>
                            </motion.div>

                            {/* collapsed tab: vertical name + avatar, on the same edge */}
                            <motion.div
                                aria-hidden
                                initial={false}
                                animate={{ opacity: active ? 0 : 1 }}
                                transition={
                                    active
                                        ? { duration: dur * 0.55 }
                                        : {
                                              delay: dur * 0.2,
                                              duration: dur * 0.5,
                                          }
                                }
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    bottom: 0,
                                    left: right ? "auto" : 0,
                                    right: right ? 0 : "auto",
                                    width: tabW,
                                    pointerEvents: "none",
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        paddingBottom: tabAvatar ? dot + 6 : 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <span
                                        style={{
                                            writingMode: "vertical-rl",
                                            transform: "rotate(180deg)",
                                            whiteSpace: "nowrap",
                                            color: ink,
                                            ...props.labelFont,
                                        }}
                                    >
                                        {e.name}
                                    </span>
                                </div>
                                {tabAvatar ? (
                                    <motion.div
                                        initial={false}
                                        animate={{
                                            scale:
                                                hot === i && !active ? 1.08 : 1,
                                        }}
                                        transition={settle}
                                        style={{
                                            position: "absolute",
                                            left: (tabW - dot) / 2,
                                            bottom: (tabW - dot) / 2,
                                        }}
                                    >
                                        <Face
                                            src={src}
                                            name={e.name}
                                            alt=""
                                            size={dot}
                                            round="50%"
                                            font={{
                                                ...props.metaFont,
                                                fontSize: Math.round(
                                                    dot * 0.36
                                                ),
                                            }}
                                        />
                                    </motion.div>
                                ) : null}
                            </motion.div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Property controls                                                   */
/* ------------------------------------------------------------------ */

addPropertyControls(Pennant, {
    items: {
        type: ControlType.Array,
        title: "Testimonials",
        maxCount: 10,
        control: {
            type: ControlType.Object,
            controls: {
                quote: {
                    type: ControlType.String,
                    title: "Quote",
                    displayTextArea: true,
                    defaultValue:
                        "A short, honest line about the experience of working together.",
                },
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Full Name",
                },
                role: {
                    type: ControlType.String,
                    title: "Role",
                    defaultValue: "Job Title",
                },
                rating: {
                    type: ControlType.Number,
                    title: "Rating",
                    min: 0,
                    max: 5,
                    step: 1,
                    displayStepper: true,
                    defaultValue: 5,
                },
                photo: { type: ControlType.ResponsiveImage, title: "Photo" },
                photoUrl: {
                    type: ControlType.String,
                    title: "Photo URL",
                    placeholder: "https://…",
                    defaultValue: "",
                },
                color: {
                    type: ControlType.Color,
                    title: "Fill",
                    defaultValue: "#E9E2D4",
                },
                textColor: {
                    type: ControlType.Color,
                    title: "Text Color",
                    defaultValue: "#16130F",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: SAMPLE,
    },
    startAt: {
        type: ControlType.Number,
        title: "Open First",
        min: 1,
        max: 10,
        step: 1,
        displayStepper: true,
        defaultValue: 1,
    },
    shape: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            sizing: {
                type: ControlType.Enum,
                title: "Height",
                options: ["ratio", "fill"],
                optionTitles: ["Ratio", "Fill"],
                displaySegmentedControl: true,
                defaultValue: "ratio",
            },
            ratio: {
                type: ControlType.Number,
                title: "Ratio",
                min: 0.2,
                max: 1.5,
                step: 0.01,
                defaultValue: 0.62,
                hidden: (p: any) => p.sizing === "fill",
            },
            tabWidth: {
                type: ControlType.Number,
                title: "Tab Width",
                min: 24,
                max: 160,
                step: 1,
                unit: "px",
                defaultValue: 48,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                defaultValue: 4,
            },
            inset: {
                type: ControlType.Number,
                title: "Tab Inset",
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
                defaultValue: 40,
            },
            hoverGrow: {
                type: ControlType.Number,
                title: "Hover Grow",
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
                defaultValue: 6,
            },
            radius: {
                type: ControlType.Number,
                title: "Card Radius",
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                defaultValue: 14,
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                defaultValue: 22,
            },
        },
    },
    extras: {
        type: ControlType.Object,
        title: "Card",
        controls: {
            showMark: {
                type: ControlType.Boolean,
                title: "Quote Mark",
                defaultValue: true,
            },
            showCount: {
                type: ControlType.Boolean,
                title: "Counter",
                defaultValue: true,
            },
            showStars: {
                type: ControlType.Boolean,
                title: "Stars",
                defaultValue: true,
            },
            showRule: {
                type: ControlType.Boolean,
                title: "Divider",
                defaultValue: true,
            },
            tabAvatar: {
                type: ControlType.Boolean,
                title: "Tab Avatar",
                defaultValue: true,
            },
            photoSize: {
                type: ControlType.Number,
                title: "Photo Size",
                min: 24,
                max: 120,
                step: 1,
                unit: "px",
                defaultValue: 52,
            },
            photoRadius: {
                type: ControlType.Number,
                title: "Photo Radius",
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
                defaultValue: 12,
            },
        },
    },
    behaviour: {
        type: ControlType.Object,
        title: "Interaction",
        controls: {
            trigger: {
                type: ControlType.Enum,
                title: "Open On",
                options: ["click", "hover"],
                optionTitles: ["Click", "Hover"],
                displaySegmentedControl: true,
                defaultValue: "click",
            },
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: false,
            },
            interval: {
                type: ControlType.Number,
                title: "Every",
                min: 1,
                max: 20,
                step: 0.5,
                unit: "s",
                defaultValue: 5,
                hidden: (p: any) => !p.autoplay,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Hover Pause",
                defaultValue: true,
                hidden: (p: any) => !p.autoplay,
            },
            newTab: {
                type: ControlType.Boolean,
                title: "Links New Tab",
                defaultValue: false,
            },
        },
    },
    feel: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            duration: {
                type: ControlType.Number,
                title: "Duration",
                min: 0.1,
                max: 2,
                step: 0.01,
                unit: "s",
                defaultValue: 0.46,
            },
            curve: {
                type: ControlType.Enum,
                title: "Curve",
                options: ["smooth", "snappy", "gentle"],
                optionTitles: ["Smooth", "Snappy", "Gentle"],
                defaultValue: "smooth",
            },
            drift: {
                type: ControlType.Number,
                title: "Content Drift",
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                defaultValue: 22,
            },
        },
    },
    quoteFont: {
        type: ControlType.Font,
        title: "Quote Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 28,
            fontWeight: 500,
            lineHeight: "1.12em",
            letterSpacing: "-0.03em",
        },
    },
    nameFont: {
        type: ControlType.Font,
        title: "Name Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 15,
            fontWeight: 600,
            lineHeight: "1.2em",
            letterSpacing: "-0.01em",
        },
    },
    metaFont: {
        type: ControlType.Font,
        title: "Role Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 12,
            fontWeight: 500,
            lineHeight: "1.3em",
            letterSpacing: "0em",
        },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Tab Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 12,
            fontWeight: 500,
            lineHeight: "1em",
            letterSpacing: "-0.01em",
        },
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0B0B0C",
    },
})
