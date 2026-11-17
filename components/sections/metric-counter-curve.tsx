/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 300
 *
 * Arcmetric — static thumbnail now renders at full frame size
 * (top-anchored with margins only when the frame is taller than 300·s).
 */

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useSpring } from "framer-motion"
import React, { useEffect, useMemo, useRef, useState } from "react"

type Feel = "Smooth" | "Snappy" | "Bouncy"

interface Props {
    timeline: {
        months: string[]
        startAt: number
        rowGap: number
        fadeOut: number
        labelSize: number
        labelInk: string
        litInk: string
        showTick: boolean
        tickSize: number
        textGap: number
        reverse: boolean
    }
    curve: {
        bendMode: "Soft" | "Deep" | "Custom"
        bendSize: number
        bendWide: number
        lineInk: string
        glowInk: string
        lineThick: number
        glowHaze: boolean
        hazeSize: number
        fadeEnds: boolean
    }
    button: {
        btnSize: number
        btnFill: string
        ringInk: string
        chevron: "Double" | "Single" | "Arrow"
        chevInk: string
        pulseOn: boolean
        pulseRate: number
    }
    profile: {
        photo?: any
        photoSize: number
        photoRing: string
        name: string
        nameSize: number
        nameInk: string
        badgeOn: boolean
        badgeInk: string
        caption: string
        captionSize: number
        captionInk: string
    }
    counter: {
        values: number[]
        glyphSet: "Digital" | "Clean"
        digitSize: number
        digitInk: string
        segGap: number
        digitWeight: number
        digitGap: number
        rollFeel: Feel
        stagger: number
        blurRoll: boolean
        commas: boolean
    }
    motion: {
        scrollMode: "Off" | "Wheel" | "Page"
        sticky: boolean
        pinHeight: number
        wheelSpan: number
        scrollSmooth: number
        scrollFlip: boolean
        autoPlay: boolean
        holdTime: number
        loopIt: boolean
        pauseHover: boolean
        slideFeel: Feel
    }
    layout: {
        lineX: number
        axisY: number
        tickGap: number
        btnGap: number
        rightGap: number
        stackGap: number
        avatarGap: number
    }
    type: { labelFont?: any; uiFont?: any; digitFont?: any }
    surface: { backdrop: string; corner: number; rootScale: number }
    onStepChange?: (i: number) => void
}

/* ── utils ─ */
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const mod10 = (x: number) => ((x % 10) + 10) % 10

const FEELS: Record<
    Feel,
    { stiffness: number; damping: number; mass: number }
> = {
    Smooth: { stiffness: 170, damping: 24, mass: 0.9 },
    Snappy: { stiffness: 430, damping: 34, mass: 0.7 },
    Bouncy: { stiffness: 310, damping: 15, mass: 0.9 },
}
const FAST = { stiffness: 520, damping: 42, mass: 0.8 }

function parseColor(c: any): [number, number, number] {
    if (typeof c !== "string") return [138, 138, 138]
    const s = c.trim()
    if (s[0] === "#") {
        let h = s.slice(1)
        if (h.length === 3)
            h = h
                .split("")
                .map((x) => x + x)
                .join("")
        const n = parseInt(h.slice(0, 6), 16)
        if (!isNaN(n)) return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
        return [138, 138, 138]
    }
    const m = s.match(/rgba?\(([^)]+)\)/)
    if (m) {
        const p = m[1]
            .split(/[,\s]+/)
            .filter(Boolean)
            .map(parseFloat)
        return [p[0] || 0, p[1] || 0, p[2] || 0]
    }
    return [138, 138, 138]
}
function mixHex(a: any, b: any, t: number) {
    const A = parseColor(a),
        B = parseColor(b),
        k = clamp(t, 0, 1)
    return (
        "rgb(" +
        Math.round(A[0] + (B[0] - A[0]) * k) +
        "," +
        Math.round(A[1] + (B[1] - A[1]) * k) +
        "," +
        Math.round(A[2] + (B[2] - A[2]) * k) +
        ")"
    )
}
function rgba(c: any, a: number) {
    const p = parseColor(c)
    return "rgba(" + p[0] + "," + p[1] + "," + p[2] + "," + a + ")"
}
function isTransparent(c: any): boolean {
    if (typeof c !== "string") return false
    const m = c.trim().match(/rgba?\(([^)]+)\)/)
    if (m) {
        const p = m[1]
            .split(/[,\s]+/)
            .filter(Boolean)
            .map(parseFloat)
        return (p[3] != null ? p[3] : 1) < 0.05
    }
    return false
}
function fam(font: any, fallback: string) {
    if (font && typeof font === "object" && font.fontFamily)
        return font.fontFamily
    if (typeof font === "string" && font) return font
    return fallback
}
function fwt(font: any, fallback: number) {
    if (font && typeof font === "object" && font.fontWeight != null)
        return Number(font.fontWeight) || fallback
    return fallback
}
function findScroller(el: HTMLElement | null): HTMLElement | null {
    let n = el ? el.parentElement : null
    while (n) {
        const s = window.getComputedStyle(n)
        if (
            /(auto|scroll)/.test(s.overflowY + s.overflow) &&
            n.scrollHeight > n.clientHeight + 4
        )
            return n
        n = n.parentElement
    }
    return null
}
function makeBend(depth: number, span: number) {
    const h = span / 2
    return (dy: number) => {
        const a = Math.abs(dy)
        if (a >= h) return 0
        return depth * (0.5 + 0.5 * Math.cos((Math.PI * a) / h))
    }
}
const UI_FALLBACK =
    "Inter, -apple-system, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif"

/** Visibility gate — pauses drives/autoplay while the pin is far offscreen. */
function useOnscreen(ref: React.RefObject<HTMLElement | null>): boolean {
    const [on, setOn] = useState(true)
    useEffect(() => {
        const el = ref.current
        if (!el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(
            (es) => setOn(es[es.length - 1].isIntersecting),
            { rootMargin: "240px" }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [ref])
    return on
}

/* ── glyphs ─ */
const SEG = [
    [1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 0, 0, 0, 0],
    [1, 1, 0, 1, 1, 0, 1],
    [1, 1, 1, 1, 0, 0, 1],
    [0, 1, 1, 0, 0, 1, 1],
    [1, 0, 1, 1, 0, 1, 1],
    [1, 0, 1, 1, 1, 1, 1],
    [1, 1, 1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 1],
]
function hPts(a: number, b: number, yc: number, t: number) {
    const h = t / 2
    return (
        a +
        "," +
        yc +
        " " +
        (a + h) +
        "," +
        (yc - h) +
        " " +
        (b - h) +
        "," +
        (yc - h) +
        " " +
        b +
        "," +
        yc +
        " " +
        (b - h) +
        "," +
        (yc + h) +
        " " +
        (a + h) +
        "," +
        (yc + h)
    )
}
function vPts(xc: number, a: number, b: number, t: number) {
    const h = t / 2
    return (
        xc +
        "," +
        a +
        " " +
        (xc + h) +
        "," +
        (a + h) +
        " " +
        (xc + h) +
        "," +
        (b - h) +
        " " +
        xc +
        "," +
        b +
        " " +
        (xc - h) +
        "," +
        (b - h) +
        " " +
        (xc - h) +
        "," +
        (a + h)
    )
}
function SegGlyph(p: { d: number; ink: string; gap: number }) {
    const s = SEG[clamp(Math.round(p.d), 0, 9)]
    const g = p.gap,
        T = 4.1
    const P: string[] = []
    if (s[0]) P.push(hPts(5.6 + g, 22.4 - g, 3.1, T))
    if (s[1]) P.push(vPts(24.9, 5.4 + g, 17.7 - g, T))
    if (s[2]) P.push(vPts(24.9, 22.3 + g, 34.6 - g, T))
    if (s[3]) P.push(hPts(5.6 + g, 22.4 - g, 36.9, T))
    if (s[4]) P.push(vPts(3.1, 22.3 + g, 34.6 - g, T))
    if (s[5]) P.push(vPts(3.1, 5.4 + g, 17.7 - g, T))
    if (s[6]) P.push(hPts(5.6 + g, 22.4 - g, 20, T))
    return (
        <svg
            viewBox="0 0 28 40"
            style={{ width: "100%", height: "100%", display: "block" }}
            aria-hidden="true"
        >
            {P.map((pts, i) => (
                <polygon key={i} points={pts} fill={p.ink} />
            ))}
        </svg>
    )
}
function CommaGlyph(p: { ink: string }) {
    return (
        <svg
            viewBox="0 0 12 40"
            style={{ width: "100%", height: "100%", display: "block" }}
            aria-hidden="true"
        >
            <polygon points="4.4,26 7.6,24.2 7.6,36 4.4,36" fill={p.ink} />
        </svg>
    )
}
function VerifiedBadge(p: { ink: string }) {
    return (
        <svg width="100%" height="100%" viewBox="0 0 24 24" aria-hidden="true">
            <g fill={p.ink}>
                <circle cx="12" cy="12" r="8" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => {
                    const r = (a * Math.PI) / 180
                    return (
                        <circle
                            key={i}
                            cx={12 + 8 * Math.cos(r)}
                            cy={12 + 8 * Math.sin(r)}
                            r="2.6"
                        />
                    )
                })}
            </g>
            <path
                d="M8 12.4l2.6 2.7 5.4-5.9"
                fill="none"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}
function ChevronIcon(p: { kind: string; ink: string }) {
    const s = {
        fill: "none",
        stroke: p.ink,
        strokeWidth: 2,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
    }
    return (
        <svg width="100%" height="100%" viewBox="0 0 20 20" aria-hidden="true">
            {p.kind === "Arrow" ? (
                <React.Fragment>
                    <path d="M10 16V5" {...s} />
                    <path d="M5.5 9.5L10 5l4.5 4.5" {...s} />
                </React.Fragment>
            ) : p.kind === "Single" ? (
                <path d="M5.2 12.4L10 7.6l4.8 4.8" {...s} />
            ) : (
                <React.Fragment>
                    <path d="M5.8 10.2L10 6l4.2 4.2" {...s} />
                    <path d="M5.8 14.8L10 10.6l4.2 4.2" {...s} />
                </React.Fragment>
            )}
        </svg>
    )
}

/* ── rolling digit (bounded 30-cell strip) ── */
const STRIP = Array.from({ length: 30 }, (_, i) => i % 10)
const BASE = 10
interface ColProps {
    digit: number
    place: number
    count: number
    cell: number
    wid: number
    ink: string
    glyph: "Digital" | "Clean"
    segGap: number
    family: string
    weight: number
    feel: Feel
    stagger: number
    blur: boolean
    instant: boolean
    fast: boolean
}
function DigitColumn(p: ColProps) {
    const unwrapped = useRef(BASE + Math.round(p.digit))
    const springY = useMotionValue(-unwrapped.current * p.cell)
    const spring = useSpring(
        springY,
        p.fast ? FAST : { ...FEELS[p.feel], restDelta: 0.1 }
    )

    const stripEl = useRef<HTMLDivElement>(null)
    const prevY = useRef(springY.get())
    useEffect(() => {
        if (!p.blur || p.instant) return
        return spring.on("change", (v) => {
            const delta = Math.abs(v - prevY.current)
            prevY.current = v
            if (stripEl.current) {
                const b = delta > 8 ? Math.min(2.5, delta * 0.015) : 0
                stripEl.current.style.filter =
                    b > 0.1 ? "blur(" + b + "px)" : "none"
            }
        })
    }, [spring, p.blur, p.instant])

    const timer = useRef<number | null>(null)
    useEffect(() => {
        const cur = mod10(unwrapped.current)
        let delta = p.digit - cur
        if (delta > 5) delta -= 10
        if (delta < -5) delta += 10
        if (delta === 0) return
        unwrapped.current += delta
        const ty = -unwrapped.current * p.cell
        if (timer.current !== null) {
            window.clearTimeout(timer.current)
            timer.current = null
        }
        if (p.instant) {
            springY.set(ty)
            spring.set(ty)
            return
        }
        const delay = p.fast
            ? 0
            : Math.abs(delta) > 1.5
              ? p.place * p.stagger
              : 0
        if (delay > 0)
            timer.current = window.setTimeout(() => springY.set(ty), delay)
        else springY.set(ty)
    }, [
        p.digit,
        p.cell,
        p.place,
        p.count,
        p.stagger,
        p.instant,
        p.fast,
        spring,
        springY,
    ])
    useEffect(
        () => () => {
            if (timer.current !== null) window.clearTimeout(timer.current)
        },
        []
    )

    const digital = p.glyph === "Digital"
    const strip = useMemo(
        () =>
            STRIP.map((d, i) =>
                digital ? (
                    <div
                        key={i}
                        style={{
                            height: p.cell,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <div
                            style={{
                                width: p.wid * 0.82,
                                height: p.cell * 0.88,
                            }}
                        >
                            <SegGlyph d={d} ink={p.ink} gap={p.segGap} />
                        </div>
                    </div>
                ) : (
                    <div
                        key={i}
                        style={{
                            height: p.cell,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: p.cell * 0.76,
                            fontWeight: p.weight,
                            color: p.ink,
                            fontVariantNumeric: "tabular-nums",
                            fontFamily: p.family,
                        }}
                    >
                        {d}
                    </div>
                )
            ),
        [digital, p.cell, p.wid, p.ink, p.segGap, p.family, p.weight]
    )

    return (
        <div
            style={{
                width: p.wid,
                height: p.cell,
                overflow: "hidden",
                position: "relative",
                flex: "none",
            }}
        >
            <motion.div
                ref={stripEl as any}
                style={{
                    y: spring,
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    willChange: "transform",
                }}
            >
                {strip}
            </motion.div>
        </div>
    )
}

/* ── label stack ── */
interface StackProps {
    months: string[]
    idx: any
    step: number
    s: number
    fade: number
    ink: string
    lit: string
    size: number
    tick: boolean
    tickSize: number
    gap: number
    bend: (dy: number) => number
    family: string
    baseWeight: number
    rev: boolean
    total: number
    onPick: (i: number) => void
}
function LabelStack(p: StackProps) {
    const [v, setV] = useState<number>(p.idx.get())
    useEffect(() => p.idx.on("change", setV), [p.idx])
    const pv = p.rev ? p.total - 1 - v : v
    return (
        <React.Fragment>
            {p.months.map((m, i) => {
                const pi = p.rev ? p.total - 1 - i : i
                const dy = (pi - pv) * p.step
                const d = Math.abs(pi - pv)
                const act = clamp(1 - d, 0, 1)
                return (
                    <button
                        key={i}
                        type="button"
                        onClick={() => p.onPick(i)}
                        style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            transform:
                                "translate(" +
                                (-p.bend(dy) * p.s).toFixed(2) +
                                "px," +
                                (dy * p.s).toFixed(2) +
                                "px)",
                            opacity: Math.max(0.08, Math.pow(1 - p.fade, d)),
                            display: "flex",
                            alignItems: "center",
                            gap: p.gap * p.s,
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            height: 16 * p.s,
                            willChange: "transform,opacity",
                        }}
                    >
                        <span
                            style={{
                                color: mixHex(p.ink, p.lit, act),
                                fontSize: p.size * p.s,
                                letterSpacing: "0.07em",
                                whiteSpace: "nowrap",
                                fontWeight:
                                    p.baseWeight + Math.round(act) * 100,
                                fontFamily: p.family,
                            }}
                        >
                            {m}
                        </span>
                        <span
                            style={{
                                opacity: p.tick ? (1 - act) * 0.8 : 0,
                                width: p.tickSize * p.s,
                                height: 1,
                                background: p.ink,
                                flex: "none",
                            }}
                        />
                    </button>
                )
            })}
        </React.Fragment>
    )
}

/* ═══════════════ component ═══════════════ */
function Arcmetric(props: Props) {
    const tl = props.timeline || ({} as any),
        cv = props.curve || ({} as any),
        bt = props.button || ({} as any)
    const pf = props.profile || ({} as any),
        ct = props.counter || ({} as any),
        mc = props.motion || ({} as any)
    const lay = props.layout || ({} as any),
        ty = props.type || ({} as any),
        sf = props.surface || ({} as any)

    const months =
        tl.months && tl.months.length
            ? tl.months
            : ["July 2024", "Aug 2024", "Sept 2024", "Oct 2024", "Nov 2024"]
    const values =
        ct.values && ct.values.length
            ? ct.values
            : [5120, 5874, 6652, 7340, 8015]
    const N = months.length

    /* static contexts: Canvas + export stay frozen; reduced-motion respected */
    const isStaticRenderer =
        typeof useIsStaticRenderer === "function"
            ? useIsStaticRenderer()
            : false
    const reduced =
        typeof window !== "undefined" &&
        !!window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const instant = isStaticRenderer || reduced
    const scrollDriven = mc.scrollMode !== "Off" && !instant

    const [active, setActive] = useState(() =>
        clamp(Math.round(tl.startAt != null ? tl.startAt : 2), 0, N - 1)
    )
    const activeRef = useRef(active)

    const rootRef = useRef<HTMLDivElement>(null)
    const pinRef = useRef<HTMLDivElement>(null)
    const onscreen = useOnscreen(pinRef)

    /* responsive scale — fills the frame; static top-margin only when taller */
    const [ms, setMs] = useState(1)
    const [mh, setMh] = useState(0)
    useEffect(() => {
        const el = rootRef.current,
            pin = pinRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => {
            const r = el.getBoundingClientRect()
            const ph = pin ? pin.getBoundingClientRect().height : r.height
            const hh = instant ? r.height : ph
            setMh(r.height)
            if (r.width > 4 && hh > 4)
                setMs(clamp(Math.min(r.width / 420, hh / 300), 0.35, 4))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [instant])
    const s = ms * (sf.rootScale != null ? sf.rootScale : 1)
    /* hero margin only when the static frame is taller than the composed shot */
    const padTop = instant && mh - 300 * s > 48 ? 24 * s : 0

    const scrollCfg =
        mc.scrollMode !== "Off"
            ? {
                  stiffness: clamp(
                      320 -
                          (mc.scrollSmooth != null ? mc.scrollSmooth : 0.6) *
                              280,
                      30,
                      320
                  ),
                  damping: 40,
                  mass: 1,
              }
            : FEELS[mc.slideFeel || "Smooth"]
    const target = useMotionValue(active)
    const idx = useSpring(target, scrollCfg)

    const wheelSpan = Math.max(120, mc.wheelSpan != null ? mc.wheelSpan : 900)
    const accRef = useRef((active / Math.max(1, N - 1)) * wheelSpan)

    const commit = (n: number) => {
        const k = ((n % N) + N) % N
        if (k === activeRef.current) return
        activeRef.current = k
        setActive(k)
        target.set(k)
        accRef.current = (k / Math.max(1, N - 1)) * wheelSpan
        if (props.onStepChange) props.onStepChange(k)
    }
    const commitRef = useRef(commit)
    commitRef.current = commit

    /* static: jump straight to the configured frame */
    useEffect(() => {
        if (!instant) return
        const k = clamp(
            Math.round(tl.startAt != null ? tl.startAt : 2),
            0,
            N - 1
        )
        activeRef.current = k
        setActive(k)
        target.set(k)
        idx.set(k)
    }, [tl.startAt, instant, N, target, idx])

    useEffect(
        () =>
            idx.on("change", (v) => {
                const r = clamp(Math.round(v), 0, N - 1)
                if (r !== activeRef.current) {
                    activeRef.current = r
                    setActive(r)
                    if (props.onStepChange) props.onStepChange(r)
                }
            }),
        [idx, N]
    )

    const [fval, setFval] = useState<number>(
        values[clamp(active, 0, values.length - 1)] || 0
    )
    useEffect(() => {
        const fromIdx = (v: number) =>
            setFval(values[clamp(Math.round(v), 0, values.length - 1)] || 0)
        if (!scrollDriven) {
            fromIdx(active)
            return
        }
        fromIdx(idx.get())
        return idx.on("change", fromIdx)
    }, [scrollDriven, idx, active, N, values])

    /* pulse activity flag (bounded timer) */
    const [scrolling, setScrolling] = useState(false)
    const scrollingRef = useRef(false)
    const scrollT = useRef<number | null>(null)
    const ping = () => {
        if (!scrollingRef.current) {
            scrollingRef.current = true
            setScrolling(true)
        }
        if (scrollT.current !== null) window.clearTimeout(scrollT.current)
        scrollT.current = window.setTimeout(() => {
            scrollingRef.current = false
            setScrolling(false)
            scrollT.current = null
        }, 650)
    }
    useEffect(
        () => () => {
            if (scrollT.current !== null) window.clearTimeout(scrollT.current)
        },
        []
    )

    /* wheel drive — only fires while hovered, i.e. onscreen */
    useEffect(() => {
        const el = rootRef.current
        if (!el || mc.scrollMode !== "Wheel" || instant) return
        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            ping()
            const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
            accRef.current = clamp(accRef.current + d, 0, wheelSpan)
            let t = accRef.current / wheelSpan
            if (mc.scrollFlip) t = 1 - t
            target.set(t * (N - 1))
        }
        el.addEventListener("wheel", onWheel, { passive: false })
        return () => el.removeEventListener("wheel", onWheel)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mc.scrollMode, mc.scrollFlip, instant, N, target, wheelSpan])

    /* page drive — listeners attach only while onscreen; rAF coalesces bursts */
    useEffect(() => {
        const wrap = rootRef.current,
            pin = pinRef.current
        if (!wrap || !pin || mc.scrollMode !== "Page" || instant || !onscreen)
            return
        const sc = findScroller(wrap)
        let raf = 0
        let first = true
        const read = () => {
            raf = 0
            ping()
            const wr = wrap.getBoundingClientRect()
            const pinPx = pin.offsetHeight || window.innerHeight
            const range = wr.height - pinPx
            let t = range > 4 ? clamp(-wr.top / range, 0, 1) : 0
            if (mc.scrollFlip) t = 1 - t
            accRef.current = t * wheelSpan
            target.set(t * (N - 1))
            if (first) {
                idx.set(t * (N - 1))
                first = false
            }
        }
        const on = () => {
            if (!raf) raf = requestAnimationFrame(read)
        }
        read()
        const win: any = sc || window
        win.addEventListener("scroll", on, { passive: true })
        win.addEventListener("resize", on)
        return () => {
            win.removeEventListener("scroll", on)
            win.removeEventListener("resize", on)
            if (raf) cancelAnimationFrame(raf)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        mc.scrollMode,
        mc.scrollFlip,
        instant,
        onscreen,
        N,
        target,
        idx,
        wheelSpan,
    ])

    /* autoplay — never runs offscreen or in static contexts */
    const hoverRef = useRef(false)
    useEffect(() => {
        if (!mc.autoPlay || mc.scrollMode !== "Off" || instant || !onscreen)
            return
        const id = window.setInterval(
            () => {
                if (hoverRef.current && mc.pauseHover) return
                const a = activeRef.current
                if (a >= N - 1 && !mc.loopIt) return
                commitRef.current(a + 1)
            },
            Math.max(0.8, mc.holdTime != null ? mc.holdTime : 2.5) * 1000
        )
        return () => window.clearInterval(id)
    }, [
        mc.autoPlay,
        mc.holdTime,
        mc.loopIt,
        mc.pauseHover,
        mc.scrollMode,
        instant,
        onscreen,
        N,
    ])

    const [hov, setHov] = useState(false)
    const [prs, setPrs] = useState(false)

    const axisY = lay.axisY != null ? lay.axisY : 150
    const lineX = lay.lineX != null ? lay.lineX : 160
    const tickGap = lay.tickGap != null ? lay.tickGap : 12
    const btnGap = lay.btnGap != null ? lay.btnGap : 8
    const rightGap = lay.rightGap != null ? lay.rightGap : 20
    const stackGap = lay.stackGap != null ? lay.stackGap : 7
    const avatarGap = lay.avatarGap != null ? lay.avatarGap : 8

    const tickSize = tl.tickSize != null ? tl.tickSize : 12
    const textGap = tl.textGap != null ? tl.textGap : 8
    const tickRight = lineX - tickGap
    const step = (tl.rowGap != null ? tl.rowGap : 45) + 12

    const depth =
        cv.bendMode === "Soft"
            ? 18
            : cv.bendMode === "Deep"
              ? 26
              : cv.bendSize != null
                ? cv.bendSize
                : 18
    const span =
        cv.bendMode === "Soft"
            ? 96
            : cv.bendMode === "Deep"
              ? 122
              : cv.bendWide != null
                ? cv.bendWide
                : 96
    const bend = useMemo(() => makeBend(depth, span), [depth, span])

    const btnSize = (bt.btnSize != null ? bt.btnSize : 52) * s
    const btnCX = (lineX + btnGap) * s + btnSize / 2
    const rightX = btnCX + btnSize / 2 + rightGap * s

    const path = useMemo(() => {
        let d = ""
        for (let yy = -20; yy <= 320; yy += 3) {
            const xx = lineX - bend(yy - axisY)
            d += (d ? " L " : "M ") + xx.toFixed(2) + " " + yy
        }
        return d
    }, [bend, lineX, axisY])

    const gradId = useMemo(
        () => "ftg" + Math.random().toString(36).slice(2, 8),
        []
    )
    const glowInk = cv.glowInk || "#7CFF2E"
    const thick = cv.lineThick != null ? cv.lineThick : 1.6
    const stops =
        cv.fadeEnds === false
            ? [
                  { o: 0, c: glowInk, op: 1 },
                  { o: 1, c: glowInk, op: 1 },
              ]
            : [
                  { o: 0, c: glowInk, op: 0 },
                  { o: 0.12, c: glowInk, op: 0 },
                  { o: 0.2, c: glowInk, op: 1 },
                  { o: 0.36, c: glowInk, op: 1 },
                  { o: 0.64, c: glowInk, op: 1 },
                  { o: 0.8, c: glowInk, op: 1 },
                  { o: 0.88, c: glowInk, op: 0 },
                  { o: 1, c: glowInk, op: 0 },
              ]

    const valueText = Math.max(0, Math.round(fval)).toLocaleString("en-US")

    const size = (ct.digitSize != null ? ct.digitSize : 46) * s
    const cell = Math.round(size * 1.16)
    const dWid =
        ct.glyphSet === "Clean"
            ? Math.round(size * 0.62)
            : Math.round(size * 0.72)
    const dGap = (ct.digitGap != null ? ct.digitGap : 1) * s

    /* thumbnail-safe backdrop: solid base when transparent in static renders */
    const backdropRaw = sf.backdrop || "#0b0c0e"
    const backdrop =
        instant && isTransparent(backdropRaw) ? "#0b0c0e" : backdropRaw

    const labelFamily = fam(ty.labelFont, UI_FALLBACK)
    const labelWeight = fwt(ty.labelFont, 400)
    const uiFamily = fam(ty.uiFont, UI_FALLBACK)
    const uiWeight = fwt(ty.uiFont, 600)
    const digitFamily = fam(ty.digitFont, UI_FALLBACK)
    const digitWeight =
        ct.digitWeight != null ? ct.digitWeight : fwt(ty.digitFont, 600)

    const parts = useMemo(() => {
        const txt = Math.max(0, Math.round(fval)).toLocaleString("en-US", {
            useGrouping: ct.commas !== false,
        })
        const raw: Array<{ t: "d" | "s"; left: number }> = []
        let di = 0
        for (const ch of txt) {
            if (ch >= "0" && ch <= "9") raw.push({ t: "d", left: di++ })
            else raw.push({ t: "s", left: -1 })
        }
        const total = di
        return raw.map((e) => {
            if (e.t === "s") return { t: "s" as const, dv: -1, place: -1 }
            const place = total - 1 - e.left
            return {
                t: "d" as const,
                dv: Math.floor(fval / Math.pow(10, place)) % 10,
                place,
            }
        })
    }, [fval, ct.commas])
    const digitCount = parts.filter((q) => q.t === "d").length

    const pinVh = mc.pinHeight != null ? mc.pinHeight : 100

    return (
        <div
            ref={rootRef}
            onMouseEnter={() => {
                hoverRef.current = true
            }}
            onMouseLeave={() => {
                hoverRef.current = false
            }}
            style={
                {
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    background: backdrop,
                    borderRadius: sf.corner != null ? sf.corner : 0,
                    overflow: instant ? "hidden" : "visible",
                    color: "#e8e8e8",
                    WebkitFontSmoothing: "antialiased",
                } as any
            }
        >
            {/* static-only vignette: quiet depth for the workspace thumbnail */}
            {instant && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        background:
                            "radial-gradient(120% 90% at 72% 6%, " +
                            rgba(glowInk, 0.06) +
                            ", rgba(0,0,0,0) 55%), radial-gradient(90% 70% at 16% 92%, rgba(255,255,255,0.03), rgba(0,0,0,0) 60%)",
                    }}
                />
            )}

            <div
                ref={pinRef}
                style={{
                    position:
                        mc.sticky !== false && !instant ? "sticky" : "relative",
                    top: 0,
                    height: instant ? "100%" : pinVh + "vh",
                    width: "100%",
                    display: "flex",
                    alignItems: instant ? "flex-start" : "center",
                    justifyContent: "center",
                    paddingTop: padTop,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: 420 * s,
                        height: 300 * s,
                        position: "relative",
                        flex: "none",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            top: axisY * s,
                            width: tickRight * s,
                            height: 0,
                        }}
                    >
                        <LabelStack
                            months={months}
                            idx={idx}
                            step={step}
                            s={s}
                            fade={tl.fadeOut != null ? tl.fadeOut : 0.42}
                            ink={tl.labelInk || "#8a8a8a"}
                            lit={tl.litInk || "#e8e8e8"}
                            size={tl.labelSize != null ? tl.labelSize : 11}
                            tick={tl.showTick !== false}
                            tickSize={tickSize}
                            gap={textGap}
                            bend={bend}
                            family={labelFamily}
                            baseWeight={labelWeight}
                            rev={tl.reverse === true}
                            total={N}
                            onPick={commit}
                        />
                    </div>

                    <svg
                        width={420 * s}
                        height={300 * s}
                        viewBox="0 0 420 300"
                        style={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                            overflow: "visible",
                        }}
                    >
                        <defs>
                            <linearGradient
                                id={gradId}
                                gradientUnits="userSpaceOnUse"
                                x1="0"
                                y1={axisY - span * 1.6}
                                x2="0"
                                y2={axisY + span * 1.6}
                            >
                                {stops.map((q, i) => (
                                    <stop
                                        key={i}
                                        offset={q.o}
                                        stopColor={q.c}
                                        stopOpacity={q.op}
                                    />
                                ))}
                            </linearGradient>
                        </defs>
                        {cv.glowHaze !== false && (
                            <path
                                d={path}
                                fill="none"
                                stroke={"url(#" + gradId + ")"}
                                strokeWidth={
                                    thick +
                                    (cv.hazeSize != null ? cv.hazeSize : 7)
                                }
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                opacity={0.22}
                                style={{
                                    filter:
                                        "blur(" +
                                        Math.max(
                                            2,
                                            (cv.hazeSize != null
                                                ? cv.hazeSize
                                                : 7) * 0.9
                                        ) +
                                        "px)",
                                }}
                            />
                        )}
                        {cv.glowHaze !== false && (
                            <path
                                d={path}
                                fill="none"
                                stroke={"url(#" + gradId + ")"}
                                strokeWidth={thick + 2.4}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                opacity={0.5}
                                style={{ filter: "blur(2.5px)" }}
                            />
                        )}
                        <path
                            d={path}
                            fill="none"
                            stroke={"url(#" + gradId + ")"}
                            strokeWidth={thick}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />
                    </svg>

                    <div
                        style={{
                            position: "absolute",
                            left: btnCX,
                            top: axisY * s,
                            transform: "translate(-50%,-50%)",
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                width: btnSize,
                                height: btnSize,
                            }}
                        >
                            {bt.pulseOn !== false && !instant && scrolling && (
                                <span
                                    style={{
                                        position: "absolute",
                                        inset: -2 * s,
                                        borderRadius: "50%",
                                        border:
                                            1.5 * s +
                                            "px solid " +
                                            rgba(glowInk, 0.8),
                                        animation:
                                            "ftPulse " +
                                            (bt.pulseRate != null
                                                ? bt.pulseRate
                                                : 2.8) +
                                            "s ease-out infinite",
                                        pointerEvents: "none",
                                    }}
                                />
                            )}
                            <button
                                type="button"
                                aria-label="Advance to next month"
                                onClick={() => commit(activeRef.current + 1)}
                                onPointerEnter={() => setHov(true)}
                                onPointerLeave={() => {
                                    setHov(false)
                                    setPrs(false)
                                }}
                                onPointerDown={() => setPrs(true)}
                                onPointerUp={() => setPrs(false)}
                                style={{
                                    width: btnSize,
                                    height: btnSize,
                                    borderRadius: "50%",
                                    background:
                                        "radial-gradient(120% 120% at 32% 26%, " +
                                        mixHex(
                                            bt.btnFill || "#14161a",
                                            "#ffffff",
                                            0.07
                                        ) +
                                        " 0%, " +
                                        (bt.btnFill || "#14161a") +
                                        " 52%, " +
                                        mixHex(
                                            bt.btnFill || "#14161a",
                                            "#000000",
                                            0.4
                                        ) +
                                        " 100%)",
                                    border:
                                        "1px solid " +
                                        (hov
                                            ? mixHex(
                                                  bt.ringInk || "#2b2f36",
                                                  "#ffffff",
                                                  0.4
                                              )
                                            : bt.ringInk || "#2b2f36"),
                                    boxShadow:
                                        "inset 0 " +
                                        2 * s +
                                        "px " +
                                        8 * s +
                                        "px rgba(0,0,0,.65), 0 " +
                                        6 * s +
                                        "px " +
                                        18 * s +
                                        "px rgba(0,0,0,.5)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    padding: 0,
                                    outline: "none",
                                    transform: prs ? "scale(0.94)" : "scale(1)",
                                    transition:
                                        "transform .15s ease, border-color .2s ease",
                                }}
                            >
                                <span
                                    style={{
                                        display: "block",
                                        width: 18 * s,
                                        height: 18 * s,
                                        transform: hov
                                            ? "translateY(-1px)"
                                            : "none",
                                        transition: "transform .2s ease",
                                        filter:
                                            "drop-shadow(0 0 " +
                                            3 * s +
                                            "px " +
                                            rgba(
                                                bt.chevInk || "#7CFF2E",
                                                0.45
                                            ) +
                                            ")",
                                    }}
                                >
                                    <ChevronIcon
                                        kind={bt.chevron || "Double"}
                                        ink={bt.chevInk || "#7CFF2E"}
                                    />
                                </span>
                            </button>
                        </div>
                    </div>

                    <div
                        style={{
                            position: "absolute",
                            left: rightX,
                            top: axisY * s,
                            transform: "translateY(-50%)",
                            display: "flex",
                            flexDirection: "column",
                            gap: stackGap * s,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: avatarGap * s,
                            }}
                        >
                            <span
                                style={{
                                    width:
                                        (pf.photoSize != null
                                            ? pf.photoSize
                                            : 28) * s,
                                    height:
                                        (pf.photoSize != null
                                            ? pf.photoSize
                                            : 28) * s,
                                    borderRadius: "50%",
                                    overflow: "hidden",
                                    flex: "none",
                                    border:
                                        1.5 * s +
                                        "px solid " +
                                        (pf.photoRing || "#e8e8e8"),
                                    background:
                                        "linear-gradient(135deg,#3a4148,#181b1f)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {pf.photo ? (
                                    <img
                                        src={
                                            typeof pf.photo === "string"
                                                ? pf.photo
                                                : pf.photo.src
                                        }
                                        alt={pf.name || "Praha"}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                ) : (
                                    <svg
                                        width="72%"
                                        height="72%"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <circle
                                            cx="12"
                                            cy="9"
                                            r="4"
                                            fill="#9aa3ab"
                                        />
                                        <path
                                            d="M4 21c1.6-4.4 5-6.4 8-6.4s6.4 2 8 6.4"
                                            fill="#9aa3ab"
                                        />
                                    </svg>
                                )}
                            </span>
                            <span
                                style={{
                                    fontSize:
                                        (pf.nameSize != null
                                            ? pf.nameSize
                                            : 15) * s,
                                    fontWeight: uiWeight,
                                    color: pf.nameInk || "#fff",
                                    letterSpacing: "0.01em",
                                    fontFamily: uiFamily,
                                }}
                            >
                                {pf.name || "Praha"}
                            </span>
                            {pf.badgeOn !== false && (
                                <span
                                    style={{
                                        width: 15 * s,
                                        height: 15 * s,
                                        flex: "none",
                                    }}
                                >
                                    <VerifiedBadge
                                        ink={pf.badgeInk || "#1d9bf0"}
                                    />
                                </span>
                            )}
                        </div>

                        <div
                            aria-live="polite"
                            style={{ position: "relative" }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                }}
                                aria-hidden="true"
                            >
                                {parts.map((pt, i) =>
                                    pt.t === "d" ? (
                                        <div
                                            key={
                                                "d" +
                                                (digitCount - 1 - pt.place)
                                            }
                                            style={{ marginRight: dGap }}
                                        >
                                            <DigitColumn
                                                digit={pt.dv}
                                                place={pt.place}
                                                count={digitCount}
                                                cell={cell}
                                                wid={dWid}
                                                ink={ct.digitInk || "#fff"}
                                                glyph={ct.glyphSet || "Digital"}
                                                segGap={
                                                    ct.segGap != null
                                                        ? ct.segGap
                                                        : 1.3
                                                }
                                                family={digitFamily}
                                                weight={digitWeight}
                                                feel={ct.rollFeel || "Smooth"}
                                                stagger={
                                                    ct.stagger != null
                                                        ? ct.stagger
                                                        : 90
                                                }
                                                blur={ct.blurRoll !== false}
                                                instant={instant}
                                                fast={scrollDriven}
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            key={"s" + i}
                                            style={{
                                                width: Math.round(size * 0.28),
                                                height: cell,
                                                flex: "none",
                                                display: "flex",
                                                alignItems: "flex-end",
                                                justifyContent: "center",
                                                paddingBottom: cell * 0.1,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: "46%",
                                                    height: "68%",
                                                }}
                                            >
                                                <CommaGlyph
                                                    ink={ct.digitInk || "#fff"}
                                                />
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                            <span
                                style={{
                                    position: "absolute",
                                    width: 1,
                                    height: 1,
                                    overflow: "hidden",
                                    clip: "rect(0 0 0 0)",
                                }}
                            >
                                {valueText}
                            </span>
                        </div>

                        <div
                            style={{
                                fontSize:
                                    (pf.captionSize != null
                                        ? pf.captionSize
                                        : 13) * s,
                                color: pf.captionInk || "#8a8a8a",
                                letterSpacing: "0.02em",
                                fontFamily: uiFamily,
                            }}
                        >
                            {pf.caption || "Followers"}
                        </div>
                    </div>
                </div>
            </div>

            <style>
                {
                    "@keyframes ftPulse{0%{transform:scale(1);opacity:0}45%{transform:scale(1.4);opacity:.5}100%{transform:scale(1.45);opacity:0}}"
                }
            </style>
        </div>
    )
}

/* ═══════════════ controls ═══════════════ */
addPropertyControls(Arcmetric, {
    timeline: {
        type: ControlType.Object,
        title: "Timeline",
        controls: {
            months: {
                type: ControlType.Array,
                title: "Months",
                control: { type: ControlType.String },
                defaultValue: [
                    "July 2024",
                    "Aug 2024",
                    "Sept 2024",
                    "Oct 2024",
                    "Nov 2024",
                ],
            },
            startAt: {
                type: ControlType.Number,
                title: "Start At",
                min: 0,
                max: 4,
                step: 1,
                defaultValue: 2,
            },
            reverse: {
                type: ControlType.Boolean,
                title: "Reverse",
                defaultValue: false,
            },
            rowGap: {
                type: ControlType.Number,
                title: "Row Gap",
                min: 20,
                max: 90,
                defaultValue: 45,
            },
            fadeOut: {
                type: ControlType.Number,
                title: "Fade Out",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0.42,
            },
            labelSize: {
                type: ControlType.Number,
                title: "Label Size",
                min: 8,
                max: 20,
                defaultValue: 11,
            },
            labelInk: {
                type: ControlType.Color,
                title: "Label Ink",
                defaultValue: "#8a8a8a",
            },
            litInk: {
                type: ControlType.Color,
                title: "Lit Ink",
                defaultValue: "#e8e8e8",
            },
            showTick: {
                type: ControlType.Boolean,
                title: "Show Tick",
                defaultValue: true,
            },
            tickSize: {
                type: ControlType.Number,
                title: "Tick Size",
                min: 4,
                max: 30,
                defaultValue: 12,
                hidden: (p) => p.showTick === false,
            },
            textGap: {
                type: ControlType.Number,
                title: "Text Gap",
                min: 2,
                max: 24,
                defaultValue: 8,
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            lineX: {
                type: ControlType.Number,
                title: "Line X",
                min: 80,
                max: 260,
                defaultValue: 160,
            },
            axisY: {
                type: ControlType.Number,
                title: "Axis Y",
                min: 60,
                max: 240,
                defaultValue: 150,
            },
            tickGap: {
                type: ControlType.Number,
                title: "Tick Gap",
                min: 2,
                max: 40,
                defaultValue: 12,
            },
            btnGap: {
                type: ControlType.Number,
                title: "Btn Gap",
                min: 0,
                max: 60,
                defaultValue: 8,
            },
            rightGap: {
                type: ControlType.Number,
                title: "Right Gap",
                min: 4,
                max: 80,
                defaultValue: 20,
            },
            stackGap: {
                type: ControlType.Number,
                title: "Stack Gap",
                min: 0,
                max: 40,
                defaultValue: 7,
            },
            avatarGap: {
                type: ControlType.Number,
                title: "Avatar Gap",
                min: 2,
                max: 30,
                defaultValue: 8,
            },
        },
    },
    type: {
        type: ControlType.Object,
        title: "Type",
        controls: {
            labelFont: { type: ControlType.Font, title: "Label Font" },
            uiFont: { type: ControlType.Font, title: "Ui Font" },
            digitFont: { type: ControlType.Font, title: "Digit Font" },
        },
    },
    curve: {
        type: ControlType.Object,
        title: "Curve",
        controls: {
            bendMode: {
                type: ControlType.Enum,
                title: "Bend Mode",
                options: ["Soft", "Deep", "Custom"],
                optionTitles: ["Soft Bend", "Deep Bend", "Custom Bend"],
                defaultValue: "Soft",
            },
            bendSize: {
                type: ControlType.Number,
                title: "Bend Size",
                min: 6,
                max: 44,
                defaultValue: 18,
                hidden: (p) => p.bendMode !== "Custom",
            },
            bendWide: {
                type: ControlType.Number,
                title: "Bend Wide",
                min: 40,
                max: 200,
                defaultValue: 96,
                hidden: (p) => p.bendMode !== "Custom",
            },
            lineInk: {
                type: ControlType.Color,
                title: "Line Ink",
                defaultValue: "#24272b",
            },
            glowInk: {
                type: ControlType.Color,
                title: "Glow Ink",
                defaultValue: "#7CFF2E",
            },
            lineThick: {
                type: ControlType.Number,
                title: "Line Thick",
                min: 0.1,
                max: 5,
                step: 0.2,
                defaultValue: 1.6,
            },
            glowHaze: {
                type: ControlType.Boolean,
                title: "Glow Haze",
                defaultValue: true,
            },
            hazeSize: {
                type: ControlType.Number,
                title: "Haze Size",
                min: 2,
                max: 18,
                defaultValue: 7,
                hidden: (p) => p.glowHaze === false,
            },
            fadeEnds: {
                type: ControlType.Boolean,
                title: "Fade Ends",
                defaultValue: true,
            },
        },
    },
    button: {
        type: ControlType.Object,
        title: "Button",
        controls: {
            btnSize: {
                type: ControlType.Number,
                title: "Btn Size",
                min: 30,
                max: 90,
                defaultValue: 52,
            },
            btnFill: {
                type: ControlType.Color,
                title: "Btn Fill",
                defaultValue: "#14161a",
            },
            ringInk: {
                type: ControlType.Color,
                title: "Ring Ink",
                defaultValue: "#2b2f36",
            },
            chevron: {
                type: ControlType.Enum,
                title: "Chevron",
                options: ["Double", "Single", "Arrow"],
                optionTitles: ["Double Up", "Single Up", "Arrow Up"],
                defaultValue: "Double",
            },
            chevInk: {
                type: ControlType.Color,
                title: "Chev Ink",
                defaultValue: "#7CFF2E",
            },
            pulseOn: {
                type: ControlType.Boolean,
                title: "Pulse On",
                defaultValue: true,
            },
            pulseRate: {
                type: ControlType.Number,
                title: "Pulse Rate",
                min: 1,
                max: 6,
                step: 0.5,
                defaultValue: 2.8,
                hidden: (p) => p.pulseOn === false,
            },
        },
    },
    profile: {
        type: ControlType.Object,
        title: "Profile",
        controls: {
            photo: { type: ControlType.Image, title: "Photo" },
            photoSize: {
                type: ControlType.Number,
                title: "Photo Size",
                min: 16,
                max: 64,
                defaultValue: 28,
            },
            photoRing: {
                type: ControlType.Color,
                title: "Photo Ring",
                defaultValue: "#e8e8e8",
            },
            name: {
                type: ControlType.String,
                title: "Name",
                defaultValue: "Praha",
            },
            nameSize: {
                type: ControlType.Number,
                title: "Name Size",
                min: 8,
                max: 40,
                defaultValue: 15,
            },
            nameInk: {
                type: ControlType.Color,
                title: "Name Ink",
                defaultValue: "#ffffff",
            },
            badgeOn: {
                type: ControlType.Boolean,
                title: "Badge On",
                defaultValue: true,
            },
            badgeInk: {
                type: ControlType.Color,
                title: "Badge Ink",
                defaultValue: "#1d9bf0",
                hidden: (p) => p.badgeOn === false,
            },
            caption: {
                type: ControlType.String,
                title: "Caption",
                defaultValue: "Followers",
            },
            captionSize: {
                type: ControlType.Number,
                title: "Caption Size",
                min: 8,
                max: 30,
                defaultValue: 13,
            },
            captionInk: {
                type: ControlType.Color,
                title: "Caption Ink",
                defaultValue: "#8a8a8a",
            },
        },
    },
    counter: {
        type: ControlType.Object,
        title: "Counter",
        controls: {
            values: {
                type: ControlType.Array,
                title: "Values",
                control: { type: ControlType.Number },
                defaultValue: [5120, 5874, 6652, 7340, 8015],
            },
            glyphSet: {
                type: ControlType.Enum,
                title: "Glyph Set",
                options: ["Digital", "Clean"],
                optionTitles: ["Digital LED", "Clean Type"],
                defaultValue: "Digital",
            },
            digitSize: {
                type: ControlType.Number,
                title: "Digit Size",
                min: 24,
                max: 96,
                defaultValue: 46,
            },
            digitInk: {
                type: ControlType.Color,
                title: "Digit Ink",
                defaultValue: "#ffffff",
            },
            segGap: {
                type: ControlType.Number,
                title: "Seg Gap",
                min: 0,
                max: 3,
                step: 0.2,
                defaultValue: 1.3,
                hidden: (p) => p.glyphSet !== "Digital",
            },
            digitWeight: {
                type: ControlType.Number,
                title: "Digit Weight",
                min: 100,
                max: 900,
                step: 100,
                defaultValue: 600,
                hidden: (p) => p.glyphSet !== "Clean",
            },
            digitGap: {
                type: ControlType.Number,
                title: "Digit Gap",
                min: 0,
                max: 12,
                defaultValue: 1,
            },
            rollFeel: {
                type: ControlType.Enum,
                title: "Roll Feel",
                options: ["Smooth", "Snappy", "Bouncy"],
                optionTitles: ["Smooth Roll", "Snappy Roll", "Bouncy Roll"],
                defaultValue: "Smooth",
            },
            stagger: {
                type: ControlType.Number,
                title: "Stagger",
                min: 0,
                max: 200,
                step: 5,
                defaultValue: 90,
            },
            blurRoll: {
                type: ControlType.Boolean,
                title: "Blur Roll",
                defaultValue: true,
            },
            commas: {
                type: ControlType.Boolean,
                title: "Commas",
                defaultValue: true,
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            scrollMode: {
                type: ControlType.Enum,
                title: "Scroll Mode",
                options: ["Off", "Wheel", "Page"],
                optionTitles: ["No Scrolling", "Wheel Drive", "Page Drive"],
                defaultValue: "Off",
            },
            sticky: {
                type: ControlType.Boolean,
                title: "Sticky Pin",
                defaultValue: true,
                hidden: (p) => p.scrollMode !== "Page",
            },
            pinHeight: {
                type: ControlType.Number,
                title: "Pin Height",
                min: 30,
                max: 200,
                step: 5,
                defaultValue: 100,
                hidden: (p) => p.scrollMode !== "Page",
            },
            wheelSpan: {
                type: ControlType.Number,
                title: "Wheel Span",
                min: 120,
                max: 3000,
                step: 20,
                defaultValue: 900,
                hidden: (p) => p.scrollMode !== "Wheel",
            },
            scrollSmooth: {
                type: ControlType.Number,
                title: "Scroll Smooth",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0.6,
                hidden: (p) => p.scrollMode === "Off",
            },
            scrollFlip: {
                type: ControlType.Boolean,
                title: "Scroll Flip",
                defaultValue: false,
                hidden: (p) => p.scrollMode === "Off",
            },
            autoPlay: {
                type: ControlType.Boolean,
                title: "Auto Play",
                defaultValue: false,
                hidden: (p) => p.scrollMode !== "Off",
            },
            holdTime: {
                type: ControlType.Number,
                title: "Hold Time",
                min: 0.8,
                max: 10,
                step: 0.5,
                defaultValue: 2.5,
                hidden: (p) => p.autoPlay === false || p.scrollMode !== "Off",
            },
            loopIt: {
                type: ControlType.Boolean,
                title: "Loop It",
                defaultValue: true,
                hidden: (p) => p.autoPlay === false || p.scrollMode !== "Off",
            },
            pauseHover: {
                type: ControlType.Boolean,
                title: "Pause Hover",
                defaultValue: true,
                hidden: (p) => p.autoPlay === false || p.scrollMode !== "Off",
            },
            slideFeel: {
                type: ControlType.Enum,
                title: "Slide Feel",
                options: ["Smooth", "Snappy", "Bouncy"],
                optionTitles: ["Smooth Glide", "Snappy Glide", "Bouncy Glide"],
                defaultValue: "Smooth",
            },
        },
    },
    surface: {
        type: ControlType.Object,
        title: "Surface",
        controls: {
            backdrop: {
                type: ControlType.Color,
                title: "Backdrop",
                defaultValue: "#0b0c0e",
            },
            corner: {
                type: ControlType.Number,
                title: "Corner",
                min: 0,
                max: 48,
                defaultValue: 0,
            },
            rootScale: {
                type: ControlType.Number,
                title: "Root Scale",
                min: 0.5,
                max: 2,
                step: 0.05,
                defaultValue: 1,
            },
        },
    },
    onStepChange: { type: ControlType.EventHandler, title: "On Step Change" },
})

export default Arcmetric
