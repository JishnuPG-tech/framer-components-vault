import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence } from "framer-motion"

type Plate = {
    image?: string
    imageUrl?: string
    title?: string
    caption?: string
    date?: string
    time?: string
    place?: string
    link?: string
}

type Strip = {
    position: number
    cardWidth: number
    cardHeight: number
    dropHeight: number
    gap: number
    radius: number
}

type Pace = {
    autoplay: boolean
    interval: number
    slide: number
    reveal: number
}

type Props = {
    plates: Plate[]
    strip: Strip
    pace: Pace
    headingFont: any
    metaFont: any
    textColor: string
    backdrop: string
    tint: string
    tintAmount: number
    sidePadding: number
    headingGap: number
    metaStart: number
    showNumbers: boolean
    newTab: boolean
}

const GLIDE: [number, number, number, number] = [0.76, 0, 0.24, 1]
const SETTLE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const pic = (p: Plate) => p.image || p.imageUrl || ""
const lines = (t?: string) => (t || "").split("\n").filter((l) => l.length)
const ring = (i: number, a: number, n: number) => {
    let d = (((i - a) % n) + n) % n
    if (d > n / 2) d -= n
    return d
}
const tag = (i: number) => String(i + 1).padStart(2, "0")
const stripMetrics = (s: Strip) => ({
    cw: Math.max(20, s.cardWidth),
    ch: Math.max(20, s.cardHeight),
    dh: Math.max(s.cardHeight, s.dropHeight),
    step: Math.max(20, s.cardWidth) + Math.max(0, s.gap),
})

/* ───────────────────────── live helpers ───────────────────────── */

function useOnScreen(ref: React.RefObject<HTMLElement>) {
    const [on, setOn] = useState(false)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            setOn(true)
            return
        }
        const io = new IntersectionObserver(
            (entries) => setOn(entries[0]?.isIntersecting ?? false),
            { threshold: 0.12 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])
    return on
}

function useTabAwake() {
    const [awake, setAwake] = useState(
        typeof document === "undefined" ? true : !document.hidden
    )
    useEffect(() => {
        if (typeof document === "undefined") return
        const sync = () => setAwake(!document.hidden)
        document.addEventListener("visibilitychange", sync)
        return () => document.removeEventListener("visibilitychange", sync)
    }, [])
    return awake
}

function useCalm() {
    const [calm, setCalm] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setCalm(mq.matches)
        sync()
        mq.addEventListener?.("change", sync)
        return () => mq.removeEventListener?.("change", sync)
    }, [])
    return calm
}

function useFrameBox(ref: React.RefObject<HTMLElement>) {
    const [box, setBox] = useState({ w: 700, h: 700 })
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const read = () =>
            setBox((b) => {
                const w = el.clientWidth || 700
                const h = el.clientHeight || 700
                return b.w === w && b.h === h ? b : { w, h }
            })
        read()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(read)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    return box
}

/* ───────────────────────── live view ───────────────────────── */

function LiveScrim(p: Props) {
    const plates = (p.plates || []).filter(Boolean)
    const n = plates.length
    const rootRef = useRef<HTMLDivElement>(null)
    const box = useFrameBox(rootRef)
    const onScreen = useOnScreen(rootRef)
    const awake = useTabAwake()
    const calm = useCalm()

    const [current, setCurrent] = useState(0)
    const currentRef = useRef(0)
    const [sheets, setSheets] = useState<
        { id: number; at: number; fresh: boolean }[]
    >([{ id: 0, at: 0, fresh: false }])
    const sheetSeq = useRef(1)
    const [hovered, setHovered] = useState(-1)
    const [lingering, setLingering] = useState(false)
    const [arrived, setArrived] = useState(false)
    const lastSpots = useRef<number[]>([])
    const swipe = useRef<{ x: number; moved: boolean } | null>(null)
    const blockClick = useRef(false)

    const a = n ? ((current % n) + n) % n : 0
    const { cw, ch, dh, step } = stripMetrics(p.strip)
    const top = (box.h * p.strip.position) / 100
    const left = box.w / 2 - cw / 2
    const r = p.strip.radius

    const shift = useCallback(
        (target: number) => {
            if (!n) return
            const next = ((target % n) + n) % n
            if (next === currentRef.current) return
            currentRef.current = next
            setCurrent(next)
            setSheets((s) => [
                ...s.slice(-2),
                { id: sheetSeq.current++, at: next, fresh: true },
            ])
        },
        [n]
    )

    useEffect(() => {
        if (onScreen && !arrived) setArrived(true)
    }, [onScreen, arrived])

    useEffect(() => {
        lastSpots.current = plates.map((_, i) => ring(i, a, n))
    })

    useEffect(() => {
        if (
            !p.pace.autoplay ||
            !onScreen ||
            !awake ||
            calm ||
            lingering ||
            n < 2
        )
            return
        const t = window.setTimeout(
            () => shift(currentRef.current + 1),
            Math.max(1.5, p.pace.interval) * 1000
        )
        return () => window.clearTimeout(t)
    }, [
        p.pace.autoplay,
        p.pace.interval,
        onScreen,
        awake,
        calm,
        lingering,
        current,
        n,
        shift,
    ])

    if (!n) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background: p.backdrop,
                }}
            />
        )
    }

    const active = plates[a]
    const startClip = `inset(${top}px ${Math.max(0, box.w - left - cw)}px ${Math.max(
        0,
        box.h - top - dh
    )}px ${left}px round ${r}px)`
    const endClip = "inset(0px 0px 0px 0px round 0px)"
    const slideT = Math.max(0.2, p.pace.slide)
    const revealT = Math.max(0.2, p.pace.reveal)
    const textStyle = { ...p.headingFont, color: p.textColor, margin: 0 }
    const metaStyle = {
        ...p.metaFont,
        color: p.textColor,
        textTransform: "uppercase" as const,
        whiteSpace: "nowrap" as const,
    }

    const openPlate = (pl: Plate) => {
        if (!pl.link || typeof window === "undefined") return
        window.open(pl.link, p.newTab ? "_blank" : "_self", "noopener")
    }

    return (
        <div
            ref={rootRef}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label={lines(active.title).join(" ")}
            onKeyDown={(e) => {
                if (e.key === "ArrowRight") shift(currentRef.current + 1)
                if (e.key === "ArrowLeft") shift(currentRef.current - 1)
            }}
            onMouseEnter={() => setLingering(true)}
            onMouseLeave={() => setLingering(false)}
            onPointerDown={(e) => {
                swipe.current = { x: e.clientX, moved: false }
            }}
            onPointerUp={(e) => {
                const s = swipe.current
                swipe.current = null
                if (!s) return
                const dx = e.clientX - s.x
                if (Math.abs(dx) > 40) {
                    blockClick.current = true
                    shift(currentRef.current + (dx < 0 ? 1 : -1))
                    window.setTimeout(() => (blockClick.current = false), 0)
                }
            }}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: p.backdrop,
                outline: "none",
                userSelect: "none",
                touchAction: "pan-y",
            }}
        >
            {/* backdrop sheets — each new one pours out of the dropped card */}
            {sheets.map((sh) => {
                const src = pic(plates[sh.at % n] || {})
                const animated = sh.fresh && !calm
                return (
                    <motion.div
                        key={sh.id}
                        initial={animated ? { clipPath: startClip } : false}
                        animate={{ clipPath: endClip }}
                        transition={{
                            duration: revealT,
                            ease: GLIDE,
                            delay: slideT * 0.7,
                        }}
                        onAnimationComplete={() =>
                            setSheets((s) =>
                                s.length > 1 && s[s.length - 1].id === sh.id
                                    ? [sh]
                                    : s
                            )
                        }
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
                                background: p.backdrop,
                            }}
                        />
                        {src && (
                            <motion.img
                                src={src}
                                alt=""
                                draggable={false}
                                initial={animated ? { scale: 1.16 } : false}
                                animate={{ scale: 1 }}
                                transition={{
                                    duration: revealT * 1.5,
                                    ease: SETTLE,
                                    delay: slideT * 0.7,
                                }}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    pointerEvents: "none",
                                }}
                            />
                        )}
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: p.tint,
                                opacity: p.tintAmount / 100,
                            }}
                        />
                    </motion.div>
                )
            })}

            {/* heading */}
            <div
                style={{
                    position: "absolute",
                    left: p.sidePadding,
                    bottom: `calc(${100 - p.strip.position}% + ${p.headingGap}px)`,
                    zIndex: 3,
                    pointerEvents: "none",
                }}
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.h2
                        key={`h${a}`}
                        style={{ ...textStyle, display: "block" }}
                    >
                        {lines(active.title).map((ln, li) => (
                            <span
                                key={li}
                                style={{
                                    display: "block",
                                    overflow: "hidden",
                                    paddingBottom: "0.06em",
                                }}
                            >
                                <motion.span
                                    style={{ display: "block" }}
                                    initial={calm ? false : { y: "115%" }}
                                    animate={{ y: "0%" }}
                                    exit={
                                        calm ? { opacity: 0 } : { y: "-115%" }
                                    }
                                    transition={{
                                        duration: calm ? 0 : 0.6,
                                        ease: GLIDE,
                                        delay: calm ? 0 : li * 0.07,
                                    }}
                                >
                                    {ln}
                                </motion.span>
                            </span>
                        ))}
                    </motion.h2>
                </AnimatePresence>
            </div>

            {/* meta row */}
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={`m${a}`}
                    initial={calm ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={calm ? { opacity: 0 } : { opacity: 0, y: -6 }}
                    transition={{ duration: calm ? 0 : 0.35, ease: SETTLE }}
                    style={{
                        position: "absolute",
                        left: `${p.metaStart}%`,
                        right: p.sidePadding,
                        bottom: `calc(${100 - p.strip.position}% + 10px)`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        gap: 16,
                        zIndex: 3,
                        pointerEvents: "none",
                    }}
                >
                    <span style={metaStyle}>{active.caption}</span>
                    <span
                        style={{
                            display: "flex",
                            gap: "clamp(12px, 6vw, 72px)",
                        }}
                    >
                        {active.date && (
                            <span style={metaStyle}>{active.date}</span>
                        )}
                        {active.time && (
                            <span style={metaStyle}>{active.time}</span>
                        )}
                        {active.place && (
                            <span style={metaStyle}>{active.place}</span>
                        )}
                    </span>
                </motion.div>
            </AnimatePresence>

            {/* strip */}
            {plates.map((pl, i) => {
                const spot = ring(i, a, n)
                const was = lastSpots.current[i]
                const wrapped =
                    was !== undefined && Math.abs(spot - was) > n / 2
                const centred = spot === 0
                const src = pic(pl)
                const quick = calm || wrapped
                const ripple = Math.abs(spot) * 0.07
                return (
                    <motion.div
                        key={i}
                        role="button"
                        aria-label={
                            lines(pl.title).join(" ") || `Item ${i + 1}`
                        }
                        aria-current={centred ? "true" : undefined}
                        initial={false}
                        animate={{
                            x: spot * step,
                            height: centred ? dh : ch,
                            opacity: arrived ? 1 : 0,
                            y: arrived ? 0 : 28,
                        }}
                        transition={
                            quick
                                ? { duration: 0 }
                                : {
                                      x: { duration: slideT, ease: GLIDE },
                                      height: {
                                          duration: slideT * 0.75,
                                          ease: GLIDE,
                                          delay: centred ? slideT * 0.45 : 0,
                                      },
                                      opacity: {
                                          duration: 0.6,
                                          ease: SETTLE,
                                          delay: ripple,
                                      },
                                      y: {
                                          duration: 0.9,
                                          ease: SETTLE,
                                          delay: ripple,
                                      },
                                  }
                        }
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(-1)}
                        onClick={() => {
                            if (blockClick.current) return
                            if (centred) openPlate(pl)
                            else shift(i)
                        }}
                        style={{
                            position: "absolute",
                            left,
                            top,
                            width: cw,
                            borderRadius: r,
                            overflow: "hidden",
                            cursor: centred
                                ? pl.link
                                    ? "pointer"
                                    : "default"
                                : "pointer",
                            zIndex: centred ? 2 : 1,
                            background: p.backdrop,
                        }}
                    >
                        {src && (
                            <motion.img
                                src={src}
                                alt=""
                                draggable={false}
                                animate={{
                                    scale:
                                        hovered === i && !centred && !calm
                                            ? 1.07
                                            : 1,
                                }}
                                transition={{ duration: 0.6, ease: SETTLE }}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    pointerEvents: "none",
                                }}
                            />
                        )}
                        {p.showNumbers && !centred && (
                            <motion.span
                                animate={{ opacity: hovered === i ? 1 : 0.7 }}
                                style={{
                                    ...metaStyle,
                                    position: "absolute",
                                    left: 7,
                                    bottom: 6,
                                    textShadow: "0 1px 6px rgba(0,0,0,0.45)",
                                }}
                            >
                                {tag(i)}
                            </motion.span>
                        )}
                    </motion.div>
                )
            })}
        </div>
    )
}

/* ───────────────────────── static view ───────────────────────── */

function StillScrim(p: Props) {
    const plates = (p.plates || []).filter(Boolean)
    const n = plates.length
    if (!n)
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background: p.backdrop,
                }}
            />
        )
    const first = plates[0]
    const { cw, ch, dh, step } = stripMetrics(p.strip)
    const metaStyle = {
        ...p.metaFont,
        color: p.textColor,
        textTransform: "uppercase" as const,
        whiteSpace: "nowrap" as const,
    }
    const bg = pic(first)
    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: p.backdrop,
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
                    }}
                />
            )}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: p.tint,
                    opacity: p.tintAmount / 100,
                }}
            />
            <div
                style={{
                    position: "absolute",
                    left: p.sidePadding,
                    bottom: `calc(${100 - p.strip.position}% + ${p.headingGap}px)`,
                    zIndex: 3,
                }}
            >
                <h2 style={{ ...p.headingFont, color: p.textColor, margin: 0 }}>
                    {lines(first.title).map((ln, li) => (
                        <span
                            key={li}
                            style={{
                                display: "block",
                                paddingBottom: "0.06em",
                            }}
                        >
                            {ln}
                        </span>
                    ))}
                </h2>
            </div>
            <div
                style={{
                    position: "absolute",
                    left: `${p.metaStart}%`,
                    right: p.sidePadding,
                    bottom: `calc(${100 - p.strip.position}% + 10px)`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    gap: 16,
                    zIndex: 3,
                }}
            >
                <span style={metaStyle}>{first.caption}</span>
                <span
                    style={{ display: "flex", gap: "clamp(12px, 6vw, 72px)" }}
                >
                    {first.date && <span style={metaStyle}>{first.date}</span>}
                    {first.time && <span style={metaStyle}>{first.time}</span>}
                    {first.place && (
                        <span style={metaStyle}>{first.place}</span>
                    )}
                </span>
            </div>
            {plates.map((pl, i) => {
                const spot = ring(i, 0, n)
                const centred = spot === 0
                const src = pic(pl)
                return (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            left: `calc(50% - ${cw / 2}px + ${spot * step}px)`,
                            top: `${p.strip.position}%`,
                            width: cw,
                            height: centred ? dh : ch,
                            borderRadius: p.strip.radius,
                            overflow: "hidden",
                            zIndex: centred ? 2 : 1,
                            background: p.backdrop,
                        }}
                    >
                        {src && (
                            <img
                                src={src}
                                alt=""
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        )}
                        {p.showNumbers && !centred && (
                            <span
                                style={{
                                    ...metaStyle,
                                    position: "absolute",
                                    left: 7,
                                    bottom: 6,
                                    opacity: 0.7,
                                }}
                            >
                                {tag(i)}
                            </span>
                        )}
                    </div>
                )
            })}
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
export default function Scrim(props: Props) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StillScrim {...props} />
    return <LiveScrim {...props} />
}

const u = (id: string) =>
    `https://images.unsplash.com/${id}?w=1600&q=80&auto=format&fit=crop`

Scrim.defaultProps = {
    plates: [
        {
            imageUrl: u("photo-1524504388940-b1c1722653e1"),
            title: "Low Tide\nSignals",
            caption: "By North Room",
            date: "Fri Apr 18",
            time: "10–2 AM",
            place: "Lisbon",
            link: "",
        },
        {
            imageUrl: u("photo-1534528741775-53994a69daeb"),
            title: "Copper\nHours",
            caption: "By Slow Current",
            date: "Sat Apr 19",
            time: "9–1 AM",
            place: "Oslo",
            link: "",
        },
        {
            imageUrl: u("photo-1506794778202-cad84cf45f1d"),
            title: "Soft\nStatic",
            caption: "By Field Unit",
            date: "Thu Apr 24",
            time: "11–3 AM",
            place: "Seoul",
            link: "",
        },
        {
            imageUrl: u("photo-1517841905240-472988babdf9"),
            title: "Night\nFerry",
            caption: "By Grey Atlas",
            date: "Fri Apr 25",
            time: "10–4 AM",
            place: "Porto",
            link: "",
        },
        {
            imageUrl: u("photo-1500648767791-00dcc994a43e"),
            title: "Glass\nOrchard",
            caption: "By Open Hours",
            date: "Sat May 03",
            time: "8–12 PM",
            place: "Kyoto",
            link: "",
        },
        {
            imageUrl: u("photo-1438761681033-6461ffad8d80"),
            title: "Quiet\nEngines",
            caption: "By Room Tone",
            date: "Fri May 09",
            time: "10–2 AM",
            place: "Montréal",
            link: "",
        },
        {
            imageUrl: u("photo-1507003211169-0a1dd7228f2d"),
            title: "Salt\nArchive",
            caption: "By Lowlight",
            date: "Sat May 17",
            time: "9–3 AM",
            place: "Tbilisi",
            link: "",
        },
        {
            imageUrl: u("photo-1494790108377-be9c29b29330"),
            title: "Velvet\nGrid",
            caption: "By Second Shore",
            date: "Fri May 23",
            time: "11–5 AM",
            place: "Athens",
            link: "",
        },
    ],
    strip: {
        position: 54,
        cardWidth: 124,
        cardHeight: 84,
        dropHeight: 168,
        gap: 4,
        radius: 3,
    },
    pace: { autoplay: false, interval: 5, slide: 0.85, reveal: 1.1 },
    textColor: "#FFFFFF",
    backdrop: "#8A2A22",
    tint: "#3B0D09",
    tintAmount: 18,
    sidePadding: 18,
    headingGap: 4,
    metaStart: 36,
    showNumbers: true,
    newTab: true,
}

addPropertyControls(Scrim, {
    plates: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 24,
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
                caption: { type: ControlType.String, title: "Caption" },
                date: { type: ControlType.String, title: "Date" },
                time: { type: ControlType.String, title: "Time" },
                place: { type: ControlType.String, title: "Place" },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
    },
    strip: {
        type: ControlType.Object,
        title: "Strip",
        controls: {
            position: {
                type: ControlType.Number,
                title: "Top",
                min: 10,
                max: 80,
                unit: "%",
                step: 1,
            },
            cardWidth: {
                type: ControlType.Number,
                title: "Card Width",
                min: 40,
                max: 600,
                step: 1,
            },
            cardHeight: {
                type: ControlType.Number,
                title: "Card Height",
                min: 30,
                max: 600,
                step: 1,
            },
            dropHeight: {
                type: ControlType.Number,
                title: "Drop Height",
                min: 30,
                max: 900,
                step: 1,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 60,
                step: 1,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 40,
                step: 1,
            },
        },
    },
    pace: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            autoplay: { type: ControlType.Boolean, title: "Autoplay" },
            interval: {
                type: ControlType.Number,
                title: "Every",
                min: 1.5,
                max: 20,
                step: 0.5,
                unit: "s",
                hidden: (pace: Pace) => !pace.autoplay,
            },
            slide: {
                type: ControlType.Number,
                title: "Slide",
                min: 0.2,
                max: 3,
                step: 0.05,
                unit: "s",
            },
            reveal: {
                type: ControlType.Number,
                title: "Reveal",
                min: 0.2,
                max: 3,
                step: 0.05,
                unit: "s",
            },
        },
    },
    headingFont: {
        type: ControlType.Font,
        title: "Heading",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 58,
            fontWeight: 600,
            letterSpacing: "-0.045em",
            lineHeight: "0.9em",
        },
    },
    metaFont: {
        type: ControlType.Font,
        title: "Meta",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: 10,
            letterSpacing: "0.04em",
            lineHeight: "1.2em",
        },
    },
    textColor: { type: ControlType.Color, title: "Text" },
    backdrop: { type: ControlType.Color, title: "Backdrop" },
    tint: { type: ControlType.Color, title: "Tint" },
    tintAmount: {
        type: ControlType.Number,
        title: "Tint Amount",
        min: 0,
        max: 100,
        unit: "%",
        step: 1,
    },
    sidePadding: {
        type: ControlType.Number,
        title: "Side Padding",
        min: 0,
        max: 120,
        step: 1,
    },
    headingGap: {
        type: ControlType.Number,
        title: "Heading Gap",
        min: -40,
        max: 120,
        step: 1,
    },
    metaStart: {
        type: ControlType.Number,
        title: "Meta Start",
        min: 0,
        max: 90,
        unit: "%",
        step: 1,
    },
    showNumbers: { type: ControlType.Boolean, title: "Numbers" },
    newTab: { type: ControlType.Boolean, title: "New Tab" },
})
