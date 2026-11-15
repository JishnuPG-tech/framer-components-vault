import * as React from "react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Slide = {
    kind?: "image" | "video"
    image?: { src?: string; srcSet?: string; alt?: string }
    imageUrl?: string
    video?: string
    videoUrl?: string
    alt?: string
    link?: string
    newTab?: boolean
}

type TextGroup = {
    first?: string
    second?: string
    font?: Record<string, any>
    color?: string
    liftColor?: string
    rowGap?: number
    fit?: boolean
    padding?: number
}

type FrameGroup = {
    width?: number
    height?: number
    radius?: number
    clearance?: number
    spread?: number
    edgeScale?: number
    fill?: string
    shadow?: string
    zoom?: number
    mono?: boolean
}

type MotionGroup = {
    drive?: "auto" | "scroll" | "wheel"
    flow?: "toLeft" | "toRight"
    autoplay?: boolean
    pace?: number
    hold?: number
    glide?: number
    settle?: number
    tilt?: number
    stretch?: number
    hoverHalt?: boolean
    drag?: boolean
    intro?: "rise" | "fade" | "none"
    scrollHold?: number
    wheelSpeed?: number
    snap?: boolean
    loop?: boolean
}

type Props = {
    text?: TextGroup
    slides?: Slide[]
    frame?: FrameGroup
    motion?: MotionGroup
    background?: string
    style?: React.CSSProperties
}

type Glyph = { x: number; y: number; hw: number; hh: number }
type Geo = {
    glyphs: Glyph[]
    els: HTMLElement[]
    cx: number
    cy: number
    midLocal: number
    reach: number
    em: number
}
type Body = { x: number; y: number; hw: number; hh: number; k: number }

const WINDOW = 0.56

/* ---------- pure helpers (no markup) ---------- */

function textOf(p: Props) {
    const t = p.text || {}
    const color = t.color || "#F4F4F2"
    return {
        first: t.first ?? "Every picture tells",
        second: t.second ?? "a story worth seeing",
        font: t.font || {},
        color,
        liftColor: t.liftColor || color,
        rowGap: t.rowGap ?? 4,
        fit: t.fit ?? true,
        padding: Math.max(0, t.padding ?? 32),
    }
}

function frameOf(p: Props) {
    const f = p.frame || {}
    return {
        width: Math.max(10, f.width ?? 88),
        height: Math.max(10, f.height ?? 106),
        radius: f.radius ?? 3,
        clearance: f.clearance ?? 6,
        spread: f.spread ?? 40,
        edgeScale: Math.min(1, Math.max(0.01, f.edgeScale ?? 0.12)),
        fill: f.fill || "#1C1C1F",
        shadow: f.shadow || "",
        zoom: Math.max(0, f.zoom ?? 0.25),
        mono: !!f.mono,
    }
}

function motionOf(p: Props) {
    const m = p.motion || {}
    return {
        drive: m.drive === "scroll" || m.drive === "auto" ? m.drive : "wheel",
        wheelSpeed: Math.max(0.1, m.wheelSpeed ?? 1),
        snap: m.snap ?? true,
        loop: m.loop ?? true,
        flow: m.flow === "toRight" ? "toRight" : "toLeft",
        autoplay: m.autoplay ?? true,
        pace: Math.max(0.2, m.pace ?? 1.1),
        hold: Math.max(0, m.hold ?? 0.35),
        glide: Math.max(1, m.glide ?? 1.8),
        settle: Math.max(1, m.settle ?? 9),
        tilt: Math.max(0, m.tilt ?? 0),
        stretch: Math.max(0, m.stretch ?? 0.35),
        hoverHalt: m.hoverHalt ?? true,
        drag: m.drag ?? true,
        intro: m.intro === "none" || m.intro === "fade" ? m.intro : "rise",
        scrollHold: Math.min(0.85, Math.max(0, m.scrollHold ?? 0.35)),
    }
}

function sourcesOf(s?: Slide) {
    const img = (s?.imageUrl && s.imageUrl.trim()) || s?.image?.src || ""
    const vid =
        s?.kind === "video"
            ? (s.videoUrl && s.videoUrl.trim()) || s.video || ""
            : ""
    return { img, vid }
}

function wordsOf(line: string): string[][] {
    return (line || "")
        .split(" ")
        .filter((w) => w.length > 0)
        .map((w) => Array.from(w))
}

function baseSizeOf(font: Record<string, any>) {
    const v = font?.fontSize
    if (typeof v === "number") return v
    const n = parseFloat(v)
    return isFinite(n) && n > 0 ? n : 56
}

function headStyleOf(
    font: Record<string, any>,
    fit: number
): React.CSSProperties {
    return {
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 500,
        letterSpacing: "-0.04em",
        lineHeight: "1em",
        ...font,
        fontSize: baseSizeOf(font) * fit,
    }
}

function clamp01(v: number) {
    return v < 0 ? 0 : v > 1 ? 1 : v
}

function easeOut(t: number) {
    return 1 - Math.pow(1 - t, 3)
}

function mixColor(lift: string, base: string, amount: number) {
    if (amount <= 0.001 || lift === base) return ""
    return `color-mix(in srgb, ${lift} ${Math.round(amount * 100)}%, ${base})`
}

function fitFor(stageW: number, rowW: number, fit: number, padding: number) {
    const natural = rowW / Math.max(0.01, fit)
    return Math.min(
        1,
        Math.max(40, stageW - padding * 2) / Math.max(1, natural)
    )
}

function readGeometry(
    wrap: HTMLElement,
    a: HTMLElement | null,
    b: HTMLElement | null
): Geo | null {
    if (!a || !b) return null
    const glyphs: Glyph[] = []
    const els: HTMLElement[] = []
    for (const row of [a, b]) {
        const ox = wrap.offsetLeft + row.offsetLeft
        const oy = wrap.offsetTop + row.offsetTop
        row.querySelectorAll<HTMLElement>("[data-glyph]").forEach((el) => {
            els.push(el)
            glyphs.push({
                x: ox + el.offsetLeft + el.offsetWidth / 2,
                y: oy + el.offsetTop + el.offsetHeight / 2,
                hw: el.offsetWidth / 2,
                hh: el.offsetHeight * 0.36,
            })
        })
    }
    const midLocal = (a.offsetTop + a.offsetHeight + b.offsetTop) / 2
    return {
        glyphs,
        els,
        cx: wrap.offsetLeft + wrap.offsetWidth / 2,
        cy: wrap.offsetTop + midLocal,
        midLocal,
        reach: Math.max(a.offsetWidth, b.offsetWidth) / 2,
        em: a.offsetHeight,
    }
}

// Glyphs keep their column and slide vertically onto the rim of an ellipse around
// each media body: the top row domes over it, the bottom row bowls under it.
// out holds [lift, tilt-degrees] per glyph.
function part(
    glyphs: Glyph[],
    bodies: Body[],
    out: Float32Array,
    tilt: number
) {
    for (let i = 0; i < glyphs.length; i++) {
        const g = glyphs[i]
        let sy = 0
        let best = 0
        let angle = 0
        for (let j = 0; j < bodies.length; j++) {
            const b = bodies[j]
            const rx = b.hw + g.hw * b.k
            const ry = b.hh + g.hh * b.k
            if (rx < 0.5 || ry < 0.5) continue
            const ux = (g.x - b.x) / rx
            if (ux <= -1 || ux >= 1) continue
            const root = Math.sqrt(1 - ux * ux)
            const rim = ry * root
            const dy = g.y - b.y
            const ady = Math.abs(dy)
            if (ady >= rim) continue
            const side = dy > 0 ? 1 : -1
            const push = rim - ady
            sy += side * push
            if (push > best && tilt > 0) {
                best = push
                const slope = (-side * ry * ux) / (rx * Math.max(0.3, root))
                angle = (Math.atan(slope) * 180) / Math.PI
            }
        }
        const a = Math.max(-50, Math.min(50, angle * tilt))
        out[i * 2] = sy
        out[i * 2 + 1] = a
    }
}

function placeAt(offset: number, glide: number) {
    const t = Math.min(1, Math.abs(offset) / WINDOW)
    return Math.sign(offset) * Math.pow(t, glide)
}

function sizeAt(g: number, edge: number) {
    return edge + (1 - edge) * Math.pow(1 - Math.abs(g), 1.25)
}

function fadeAt(g: number) {
    return clamp01((1 - Math.abs(g)) / 0.14)
}

function holdWarp(x: number, hold: number) {
    const whole = Math.floor(x)
    const u = x - whole
    const h = hold / 2
    if (u <= h) return whole
    if (u >= 1 - h) return whole + 1
    return whole + (u - h) / Math.max(1e-4, 1 - hold)
}

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Caesura(props: Props) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <CaesuraStill {...props} />
    return <CaesuraLive {...props} />
}

/* ---------- canvas / export branch ---------- */

function CaesuraStill(p: Props) {
    const t = textOf(p)
    const f = frameOf(p)
    const m = motionOf(p)
    const slides = p.slides || []
    const N = slides.length
    const first = slides[0]
    const src = sourcesOf(first)

    const stageRef = useRef<HTMLDivElement>(null)
    const wrapRef = useRef<HTMLDivElement>(null)
    const rowA = useRef<HTMLDivElement>(null)
    const rowB = useRef<HTMLDivElement>(null)
    const sigRef = useRef("")
    const [fit, setFit] = useState(1)
    const [lay, setLay] = useState<{ shift: number[]; mid: number | null }>({
        shift: [],
        mid: null,
    })
    const [, bump] = useState(0)
    const rows = useMemo(
        () => [wordsOf(t.first), wordsOf(t.second)],
        [t.first, t.second]
    )

    const fw = f.width * fit
    const fh = f.height * fit

    useEffect(() => {
        let alive = true
        const fonts = (document as any).fonts
        if (fonts && fonts.ready)
            fonts.ready.then(() => alive && bump((n) => n + 1))
        return () => {
            alive = false
        }
    }, [])

    // Layout read on every render; state only changes when the result does.
    useLayoutEffect(() => {
        const stage = stageRef.current
        const wrap = wrapRef.current
        const a = rowA.current
        const b = rowB.current
        if (!stage || !wrap || !a || !b) return
        const next = t.fit
            ? fitFor(
                  stage.clientWidth,
                  Math.max(a.offsetWidth, b.offsetWidth),
                  fit,
                  t.padding
              )
            : 1
        if (Math.abs(next - fit) > 0.004) {
            setFit(next)
            return
        }
        const geo = readGeometry(wrap, a, b)
        if (!geo) return
        const out = new Float32Array(geo.glyphs.length * 2)
        if (N) {
            part(
                geo.glyphs,
                [
                    {
                        x: geo.cx,
                        y: geo.cy,
                        hw: fw / 2 + f.spread * fit,
                        hh: fh / 2 + f.clearance * fit,
                        k: 1,
                    },
                ],
                out,
                m.tilt
            )
        }
        const shift = Array.from(out)
        const sig =
            shift.map((v) => v.toFixed(1)).join(",") +
            `|${geo.midLocal.toFixed(1)}`
        if (sig !== sigRef.current) {
            sigRef.current = sig
            setLay({ shift, mid: geo.midLocal })
        }
    })

    const tintSpan = Math.max(1, fh * 0.5)
    let n = 0

    return (
        <div
            ref={stageRef}
            style={{
                ...p.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: p.background ?? "#0B0B0D",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div
                ref={wrapRef}
                style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: t.rowGap * fit,
                    color: t.color,
                    ...headStyleOf(t.font, fit),
                }}
            >
                {N > 0 && (
                    <div
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: lay.mid ?? "50%",
                            width: fw,
                            height: fh,
                            marginLeft: -fw / 2,
                            marginTop: -fh / 2,
                            borderRadius: f.radius,
                            overflow: "hidden",
                            background: f.fill,
                            boxShadow: f.shadow || undefined,
                        }}
                    >
                        {src.img ? (
                            <img
                                src={src.img}
                                alt={first?.alt || ""}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                        ) : src.vid ? (
                            <video
                                src={src.vid}
                                muted
                                playsInline
                                autoPlay={false}
                                preload="none"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                        ) : null}
                    </div>
                )}
                {rows.map((words, r) => (
                    <div
                        key={r}
                        ref={r === 0 ? rowA : rowB}
                        style={{
                            position: "relative",
                            width: "max-content",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {words.map((w, wi) => (
                            <React.Fragment key={wi}>
                                {wi > 0 ? " " : null}
                                <span style={{ whiteSpace: "nowrap" }}>
                                    {w.map((ch, ci) => {
                                        const i = n++
                                        const dy = lay.shift[i * 2] || 0
                                        const rot = lay.shift[i * 2 + 1] || 0
                                        const tint = mixColor(
                                            t.liftColor,
                                            t.color,
                                            clamp01(Math.abs(dy) / tintSpan)
                                        )
                                        return (
                                            <span
                                                key={ci}
                                                data-glyph=""
                                                style={{
                                                    display: "inline-block",
                                                    color: tint || undefined,
                                                    transform:
                                                        dy || rot
                                                            ? `translate(0px, ${dy}px) rotate(${rot}deg)`
                                                            : undefined,
                                                }}
                                            >
                                                {ch}
                                            </span>
                                        )
                                    })}
                                </span>
                            </React.Fragment>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ---------- published-site branch ---------- */

type DragState = {
    id: number
    x0: number
    P0: number
    lx: number
    lt: number
    v: number
    live: boolean
}

function CaesuraLive(p: Props) {
    const t = textOf(p)
    const f = frameOf(p)
    const m = motionOf(p)
    const slides = p.slides || []
    const N = slides.length

    const stageRef = useRef<HTMLDivElement>(null)
    const wrapRef = useRef<HTMLDivElement>(null)
    const rowA = useRef<HTMLDivElement>(null)
    const rowB = useRef<HTMLDivElement>(null)

    const propsRef = useRef(p)
    propsRef.current = p

    const geoRef = useRef<Geo | null>(null)
    const curRef = useRef(new Float32Array(0))
    const goalRef = useRef(new Float32Array(0))
    const tintRef = useRef(new Float32Array(0))
    const fitRef = useRef(1)
    const slotEls = useRef(new Map<number, HTMLDivElement>())
    const innerEls = useRef(new Map<number, HTMLElement>())
    const vidEls = useRef(new Map<number, HTMLVideoElement>())
    const permitRef = useRef(false)
    const calmRef = useRef(false)
    const rafRef = useRef(0)
    const wakeRef = useRef<() => void>(() => {})
    const stillRef = useRef<() => void>(() => {})
    const st = useRef({
        P: 0,
        T: 0,
        phase: "hold" as "hold" | "run" | "seek" | "drag" | "wheel",
        holdT: 0,
        last: 0,
        hover: false,
        primed: false,
        base: 0,
        introStart: -1,
        introDone: false,
        lastWheel: 0,
        wheelDir: 0,
        moved: false,
        drag: null as DragState | null,
        prevX: new Map<number, number>(),
    }).current

    const [base, setBase] = useState(0)
    const [fit, setFit] = useState(1)
    const rows = useMemo(
        () => [wordsOf(t.first), wordsOf(t.second)],
        [t.first, t.second]
    )
    const fontKey = JSON.stringify(t.font)
    const fw = f.width * fit
    const fh = f.height * fit
    const interactive = m.drive !== "scroll" && m.drag && N > 0
    const bounded = m.drive === "scroll" || (m.drive === "wheel" && !m.loop)
    const introOn = m.intro !== "none"

    const clearIntro = () => {
        const geo = geoRef.current
        if (geo) for (const el of geo.els) el.style.opacity = ""
    }

    // Layout read: fit-to-width, then rest positions of every glyph.
    useLayoutEffect(() => {
        const stage = stageRef.current
        const wrap = wrapRef.current
        if (!stage || !wrap) return
        let alive = true
        const measure = () => {
            if (!alive) return
            const a = rowA.current
            const b = rowB.current
            if (!a || !b) return
            const q = propsRef.current
            const tq = textOf(q)
            const next = tq.fit
                ? fitFor(
                      stage.clientWidth,
                      Math.max(a.offsetWidth, b.offsetWidth),
                      fitRef.current,
                      tq.padding
                  )
                : 1
            if (Math.abs(next - fitRef.current) > 0.004) {
                fitRef.current = next
                setFit(next)
                return
            }
            const geo = readGeometry(wrap, a, b)
            if (!geo) return
            const len = geo.glyphs.length * 2
            if (curRef.current.length !== len) {
                curRef.current = new Float32Array(len)
                goalRef.current = new Float32Array(len)
                tintRef.current = new Float32Array(geo.glyphs.length).fill(-1)
            }
            geoRef.current = geo
            if (st.introDone) clearIntro()
            if (calmRef.current) stillRef.current()
            else wakeRef.current()
        }
        measure()
        const fonts = (document as any).fonts
        if (fonts && fonts.ready) fonts.ready.then(measure)
        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(measure)
            ro.observe(stage)
        }
        return () => {
            alive = false
            if (ro) ro.disconnect()
        }
    }, [t.first, t.second, fontKey, t.rowGap, t.fit, t.padding, fit])

    // Loop, visibility gating and listeners.
    useEffect(() => {
        const stage = stageRef.current
        if (!stage) return

        const pxPer = () => Math.max(120, (geoRef.current?.reach || 260) * 1.15)

        const scrollGoal = () => {
            const q = propsRef.current
            const count = (q.slides || []).length
            if (count === 0) return 0
            const r = stage.getBoundingClientRect()
            const vh = window.innerHeight || 1
            const k = clamp01((vh - r.top) / (vh + r.height))
            const lin = -WINDOW + k * (count - 1 + 2 * WINDOW)
            return holdWarp(lin, motionOf(q).scrollHold)
        }

        const paint = (dt: number, snap: boolean, now: number) => {
            const geo = geoRef.current
            if (!geo) return false
            const q = propsRef.current
            const fr = frameOf(q)
            const mo = motionOf(q)
            const tx = textOf(q)
            const ft = fitRef.current
            const w = fr.width * ft
            const h = fr.height * ft
            const count = (q.slides || []).length
            const dir = mo.flow === "toRight" ? -1 : 1
            const travel = geo.reach + w * 0.5 * fr.edgeScale

            let introT = Infinity
            if (!st.introDone && mo.intro !== "none") {
                introT = st.introStart < 0 ? 0 : (now - st.introStart) / 1000
            }
            const mediaIn =
                introT === Infinity ? 1 : easeOut(clamp01((introT - 0.3) / 0.8))
            const bodies: Body[] = []

            slotEls.current.forEach((el, j) => {
                const off = j - st.P
                const vid = vidEls.current.get(j)
                if (count === 0 || Math.abs(off) >= WINDOW) {
                    el.style.visibility = "hidden"
                    st.prevX.delete(j)
                    if (vid && !vid.paused) vid.pause()
                    return
                }
                const g = placeAt(off, mo.glide)
                const s = sizeAt(g, fr.edgeScale) * mediaIn
                const x = geo.cx + g * travel * dir
                const prev = st.prevX.get(j)
                const vx =
                    prev === undefined || dt <= 0 || snap ? 0 : (x - prev) / dt
                st.prevX.set(j, x)
                const sx =
                    1 + Math.min(0.35, (Math.abs(vx) / 1600) * mo.stretch)
                el.style.visibility = "visible"
                el.style.opacity = String(fadeAt(g) * mediaIn)
                el.style.transform = `translate3d(${(x - w / 2).toFixed(2)}px, ${(
                    geo.cy -
                    h / 2
                ).toFixed(
                    2
                )}px, 0) scale(${(s * sx).toFixed(4)}, ${(s / Math.sqrt(sx)).toFixed(4)})`
                const inner = innerEls.current.get(j)
                if (inner) {
                    inner.style.transform = `scale(${(1 + fr.zoom * Math.abs(g)).toFixed(4)})`
                    const mono = fr.mono
                        ? `grayscale(${clamp01(Math.abs(g) * 1.6).toFixed(3)})`
                        : ""
                    if (inner.style.filter !== mono) inner.style.filter = mono
                }
                bodies.push({
                    x,
                    y: geo.cy,
                    hw: (w / 2 + fr.spread * ft) * s,
                    hh: (h / 2 + fr.clearance * ft) * s,
                    k: Math.min(1, s * 2.5),
                })
                if (vid) {
                    const want = permitRef.current && Math.abs(g) < 0.97
                    if (want && vid.paused) {
                        const pr = vid.play()
                        if (pr && pr.catch) pr.catch(() => {})
                    } else if (!want && !vid.paused) vid.pause()
                }
            })

            const cur = curRef.current
            const goal = goalRef.current
            const tintPrev = tintRef.current
            part(geo.glyphs, bodies, goal, mo.tilt)
            const a = snap ? 1 : 1 - Math.exp(-dt * mo.settle)
            const glyphCount = geo.els.length
            const stagger = Math.min(0.03, 0.7 / Math.max(1, glyphCount))
            const rise = mo.intro === "rise" ? geo.em * 0.75 : 0
            const tinting = tx.liftColor !== tx.color
            const tintSpan = Math.max(1, h * 0.5)
            let gap = 0
            for (let i = 0; i < glyphCount; i++) {
                const iy = i * 2
                const ir = iy + 1
                cur[iy] += (goal[iy] - cur[iy]) * a
                cur[ir] += (goal[ir] - cur[ir]) * a
                gap = Math.max(
                    gap,
                    Math.abs(goal[iy] - cur[iy]),
                    Math.abs(goal[ir] - cur[ir])
                )
                let y = cur[iy]
                const el = geo.els[i]
                if (introT !== Infinity) {
                    const e = easeOut(clamp01((introT - i * stagger) / 0.75))
                    y += (1 - e) * rise
                    el.style.opacity = e.toFixed(3)
                }
                const r = cur[ir]
                el.style.transform =
                    `translate3d(0px, ${y.toFixed(2)}px, 0)` +
                    (Math.abs(r) > 0.05 ? ` rotate(${r.toFixed(2)}deg)` : "")
                const tv = tinting
                    ? Math.round(clamp01(Math.abs(cur[iy]) / tintSpan) * 20) /
                      20
                    : 0
                if (tv !== tintPrev[i]) {
                    tintPrev[i] = tv
                    el.style.color = tinting
                        ? mixColor(tx.liftColor, tx.color, tv)
                        : ""
                }
            }

            if (
                introT !== Infinity &&
                introT > glyphCount * stagger + 0.8 &&
                introT > 1.15
            ) {
                st.introDone = true
                clearIntro()
            }
            return gap > 0.05 || introT !== Infinity
        }

        const tick = (now: number) => {
            rafRef.current = 0
            if (!permitRef.current) {
                st.last = 0
                return
            }
            const dt = st.last ? Math.min(0.05, (now - st.last) / 1000) : 1 / 60
            st.last = now
            const q = propsRef.current
            const mo = motionOf(q)
            const count = (q.slides || []).length
            if (st.introStart < 0) st.introStart = now
            const introBusy = !st.introDone && mo.intro !== "none"
            let busy = false

            if (mo.drive === "scroll") {
                const goal = scrollGoal()
                if (!st.primed) {
                    st.P = goal
                    st.primed = true
                }
                const diff = goal - st.P
                st.P += diff * (1 - Math.exp(-dt * 7))
                if (Math.abs(diff) > 0.0008) busy = true
                st.phase = "hold"
            } else if (mo.drive === "wheel") {
                if (st.primed) {
                    st.primed = false
                    st.P = Math.round(st.P)
                    st.T = st.P
                }
                const max = Math.max(0, count - 1)
                if (st.phase === "run" || st.phase === "hold")
                    st.T = Math.round(st.P)
                if (count === 0) st.phase = "hold"
                else if (st.phase === "drag") busy = true
                else {
                    if (st.phase === "wheel" && now - st.lastWheel > 170) {
                        // Settle on the next item in the direction of travel.
                        if (mo.snap) {
                            st.T =
                                st.wheelDir > 0
                                    ? Math.ceil(st.T - 0.12)
                                    : st.wheelDir < 0
                                      ? Math.floor(st.T + 0.12)
                                      : Math.round(st.T)
                        }
                        st.phase = "seek"
                    }
                    if (!mo.loop) st.T = Math.max(0, Math.min(max, st.T))
                    const diff = st.T - st.P
                    st.P += diff * (1 - Math.exp(-dt * 8))
                    if (st.phase === "wheel" || Math.abs(diff) > 0.0015)
                        busy = true
                    else {
                        st.P = st.T
                        st.phase = "hold"
                    }
                }
            } else {
                if (st.primed) {
                    st.primed = false
                    st.P = Math.round(st.P)
                }
                if (count === 0) st.phase = "hold"
                else if (st.phase === "drag") busy = true
                else if (st.phase === "wheel") {
                    busy = true
                    if (now - st.lastWheel > 160) {
                        st.T = Math.round(st.P)
                        st.phase = "seek"
                    }
                } else if (st.phase === "seek") {
                    busy = true
                    st.P += (st.T - st.P) * (1 - Math.exp(-dt * 6))
                    if (Math.abs(st.T - st.P) < 0.0015) {
                        st.P = st.T
                        st.phase = "hold"
                        st.holdT = -1.2
                    }
                } else if (st.phase === "run") {
                    busy = true
                    st.P += dt / mo.pace
                    if (st.P >= st.T) {
                        st.P = st.T
                        st.phase = "hold"
                        st.holdT = 0
                    }
                } else {
                    const halted = mo.hoverHalt && st.hover
                    if (mo.autoplay && !halted && !introBusy) {
                        busy = true
                        st.holdT += dt
                        if (st.holdT >= mo.hold) {
                            st.phase = "run"
                            st.T = Math.round(st.P) + 1
                        }
                    }
                }
            }

            const b = Math.round(st.P)
            if (b !== st.base) {
                st.base = b
                setBase(b)
            }
            const moving = paint(dt, false, now)
            if (permitRef.current && (busy || moving || introBusy)) {
                rafRef.current = requestAnimationFrame(tick)
            } else {
                st.last = 0
            }
        }

        const wake = () => {
            if (!rafRef.current && permitRef.current) {
                st.last = 0
                rafRef.current = requestAnimationFrame(tick)
            }
        }
        wakeRef.current = wake

        const still = () => {
            st.P = 0
            st.T = 0
            st.phase = "hold"
            st.introDone = true
            clearIntro()
            if (st.base !== 0) {
                st.base = 0
                setBase(0)
            }
            paint(0, true, 0)
        }
        stillRef.current = still

        const park = () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            rafRef.current = 0
            st.last = 0
            st.hover = false
            if (st.phase === "drag" || st.phase === "wheel") {
                st.T = Math.round(st.P)
                st.phase = "seek"
            }
            st.drag = null
            vidEls.current.forEach((v) => {
                if (!v.paused) v.pause()
            })
        }

        let inView = typeof IntersectionObserver === "undefined"
        let pageOn = document.visibilityState !== "hidden"
        const mq =
            typeof window.matchMedia === "function"
                ? window.matchMedia("(prefers-reduced-motion: reduce)")
                : null
        calmRef.current = !!(mq && mq.matches)

        const sync = () => {
            const ok = inView && pageOn && !calmRef.current
            permitRef.current = ok
            if (ok) wake()
            else {
                park()
                if (calmRef.current) still()
            }
        }

        let io: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver((entries) => {
                const e = entries[entries.length - 1]
                inView = !!(e && e.isIntersecting)
                sync()
            })
            io.observe(stage)
        }
        const onVis = () => {
            pageOn = document.visibilityState !== "hidden"
            sync()
        }
        const onMotionPref = () => {
            calmRef.current = !!(mq && mq.matches)
            sync()
        }
        const onScroll = () => {
            if (motionOf(propsRef.current).drive === "scroll") wake()
        }
        const onWheel = (e: WheelEvent) => {
            const q = propsRef.current
            const mo = motionOf(q)
            const count = (q.slides || []).length
            if (!permitRef.current || !count || mo.drive === "scroll") return
            if (mo.drive === "wheel") {
                let d =
                    Math.abs(e.deltaY) >= Math.abs(e.deltaX)
                        ? e.deltaY
                        : e.deltaX
                if (e.deltaMode === 1) d *= 32
                else if (e.deltaMode === 2) d *= 400
                if (Math.abs(d) < 0.5) return
                const max = count - 1
                const from =
                    st.phase === "wheel" || st.phase === "seek" ? st.T : st.P
                const step = (d * mo.wheelSpeed) / pxPer()
                if (mo.loop) {
                    e.preventDefault()
                    st.T = from + step
                } else {
                    // At either end the wheel is handed back to the page.
                    if (
                        (d < 0 && from <= 0.001) ||
                        (d > 0 && from >= max - 0.001)
                    )
                        return
                    e.preventDefault()
                    st.T = Math.max(0, Math.min(max, from + step))
                }
                st.phase = "wheel"
                st.wheelDir = d > 0 ? 1 : -1
                st.lastWheel = performance.now()
                wake()
                return
            }
            if (!mo.drag) return
            if (
                Math.abs(e.deltaX) <= Math.abs(e.deltaY) ||
                Math.abs(e.deltaX) < 1
            )
                return
            e.preventDefault()
            const dirV = mo.flow === "toRight" ? -1 : 1
            if (st.phase !== "wheel") st.phase = "wheel"
            st.P += (e.deltaX * dirV) / (pxPer() * 1.4)
            st.lastWheel = performance.now()
            wake()
        }
        document.addEventListener("visibilitychange", onVis)
        if (mq) {
            if (mq.addEventListener) mq.addEventListener("change", onMotionPref)
            else if ((mq as any).addListener)
                (mq as any).addListener(onMotionPref)
        }
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", wake)
        stage.addEventListener("wheel", onWheel, { passive: false })
        sync()

        return () => {
            permitRef.current = false
            park()
            if (io) io.disconnect()
            document.removeEventListener("visibilitychange", onVis)
            if (mq) {
                if (mq.removeEventListener)
                    mq.removeEventListener("change", onMotionPref)
                else if ((mq as any).removeListener)
                    (mq as any).removeListener(onMotionPref)
            }
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", wake)
            stage.removeEventListener("wheel", onWheel)
        }
    }, [])

    // Property edits take effect without tearing the loop down.
    useEffect(() => {
        if (st.introDone) clearIntro()
        if (calmRef.current) stillRef.current()
        else wakeRef.current()
    }, [p])

    /* ----- interaction ----- */

    const seek = (target: number) => {
        st.T = bounded ? Math.max(0, Math.min(N - 1, target)) : target
        st.phase = "seek"
        wakeRef.current()
    }

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!interactive || e.button !== 0 || !permitRef.current) return
        st.moved = false
        st.drag = {
            id: e.pointerId,
            x0: e.clientX,
            P0: st.P,
            lx: e.clientX,
            lt: performance.now(),
            v: 0,
            live: false,
        }
    }

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const d = st.drag
        if (!d || d.id !== e.pointerId) return
        const dx = e.clientX - d.x0
        const stage = stageRef.current
        if (!d.live) {
            if (Math.abs(dx) < 6) return
            d.live = true
            st.moved = true
            st.phase = "drag"
            d.P0 = st.P
            d.x0 = e.clientX
            if (stage) {
                stage.style.cursor = "grabbing"
                try {
                    stage.setPointerCapture(e.pointerId)
                } catch (_) {}
            }
            return
        }
        const dirV = motionOf(propsRef.current).flow === "toRight" ? -1 : 1
        const per = Math.max(120, (geoRef.current?.reach || 260) * 1.15)
        let next = d.P0 - (dx * dirV) / per
        if (bounded) {
            const max = Math.max(0, N - 1)
            if (next < 0) next = next * 0.3
            else if (next > max) next = max + (next - max) * 0.3
        }
        st.P = next
        const now = performance.now()
        const span = Math.max(8, now - d.lt) / 1000
        const inst = (-(e.clientX - d.lx) * dirV) / per / span
        d.v = d.v * 0.6 + inst * 0.4
        d.lx = e.clientX
        d.lt = now
        wakeRef.current()
    }

    const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
        const d = st.drag
        if (!d || d.id !== e.pointerId) return
        st.drag = null
        if (!d.live) return
        const stage = stageRef.current
        if (stage) {
            stage.style.cursor = "grab"
            try {
                stage.releasePointerCapture(e.pointerId)
            } catch (_) {}
        }
        const fling = Math.max(-1.5, Math.min(1.5, d.v * 0.2))
        seek(Math.round(st.P + fling))
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!interactive) return
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
        e.preventDefault()
        const from = st.phase === "seek" ? st.T : Math.round(st.P)
        seek(from + (e.key === "ArrowRight" ? 1 : -1))
    }

    /* ----- render ----- */

    const slotIds: number[] = []
    if (N > 0) {
        for (let j = base - 1; j <= base + 1; j++) {
            if (bounded && (j < 0 || j > N - 1)) continue
            slotIds.push(j)
        }
    }
    const label = `${t.first} ${t.second}`.trim()

    return (
        <div
            ref={stageRef}
            role="region"
            aria-roledescription="carousel"
            aria-label={label}
            tabIndex={interactive ? 0 : undefined}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClickCapture={(e) => {
                if (st.moved) {
                    e.preventDefault()
                    e.stopPropagation()
                    st.moved = false
                }
            }}
            style={{
                ...p.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: p.background ?? "#0B0B0D",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: interactive ? "grab" : undefined,
                touchAction: interactive ? "pan-y" : undefined,
                outline: "none",
            }}
        >
            {slotIds.map((j) => {
                const s = slides[((j % N) + N) % N]
                const src = sourcesOf(s)
                const setInner = (el: HTMLElement | null) => {
                    if (el) innerEls.current.set(j, el)
                    else innerEls.current.delete(j)
                }
                const fill: React.CSSProperties = {
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    userSelect: "none",
                    pointerEvents: "none",
                }
                const media = src.vid ? (
                    <video
                        ref={(el) => {
                            setInner(el)
                            if (el) vidEls.current.set(j, el)
                            else vidEls.current.delete(j)
                        }}
                        src={src.vid}
                        poster={src.img || undefined}
                        muted
                        loop
                        playsInline
                        preload="auto"
                        style={fill}
                    />
                ) : src.img ? (
                    <img
                        ref={setInner}
                        src={src.img}
                        srcSet={s?.imageUrl ? undefined : s?.image?.srcSet}
                        alt={s?.alt || s?.image?.alt || ""}
                        draggable={false}
                        style={fill}
                    />
                ) : null
                return (
                    <div
                        key={j}
                        ref={(el) => {
                            if (el) slotEls.current.set(j, el)
                            else slotEls.current.delete(j)
                        }}
                        onPointerEnter={() => {
                            st.hover = true
                        }}
                        onPointerLeave={() => {
                            st.hover = false
                            wakeRef.current()
                        }}
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: fw,
                            height: fh,
                            borderRadius: f.radius,
                            overflow: "hidden",
                            background: f.fill,
                            boxShadow: f.shadow || undefined,
                            visibility: "hidden",
                            willChange: "transform, opacity",
                            zIndex: 2,
                        }}
                    >
                        {s?.link ? (
                            <a
                                href={s.link}
                                target={s.newTab ? "_blank" : undefined}
                                rel={
                                    s.newTab ? "noopener noreferrer" : undefined
                                }
                                draggable={false}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    height: "100%",
                                }}
                            >
                                {media}
                            </a>
                        ) : (
                            media
                        )}
                    </div>
                )
            })}

            <div
                ref={wrapRef}
                style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: t.rowGap * fit,
                    color: t.color,
                    pointerEvents: "none",
                    userSelect: "none",
                    zIndex: 3,
                    ...headStyleOf(t.font, fit),
                }}
            >
                {rows.map((words, r) => (
                    <div
                        key={r}
                        ref={r === 0 ? rowA : rowB}
                        aria-hidden="true"
                        style={{
                            position: "relative",
                            width: "max-content",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {words.map((w, wi) => (
                            <React.Fragment key={wi}>
                                {wi > 0 ? " " : null}
                                <span style={{ whiteSpace: "nowrap" }}>
                                    {w.map((ch, ci) => (
                                        <span
                                            key={ci}
                                            data-glyph=""
                                            style={{
                                                display: "inline-block",
                                                willChange: "transform",
                                                opacity: introOn
                                                    ? 0
                                                    : undefined,
                                            }}
                                        >
                                            {ch}
                                        </span>
                                    ))}
                                </span>
                            </React.Fragment>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

const img = (id: string) =>
    `https://images.unsplash.com/${id}?w=600&q=80&auto=format&fit=crop`

const driveOf = (v: any) => v?.drive ?? v?.motion?.drive ?? "wheel"
const isScroll = (v: any) => driveOf(v) === "scroll"
const notAuto = (v: any) => driveOf(v) !== "auto"
const notWheel = (v: any) => driveOf(v) !== "wheel"

addPropertyControls(Caesura, {
    text: {
        type: ControlType.Object,
        title: "Text",
        controls: {
            first: {
                type: ControlType.String,
                title: "Line 1",
                defaultValue: "Every picture tells",
            },
            second: {
                type: ControlType.String,
                title: "Line 2",
                defaultValue: "a story worth seeing",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 56,
                    letterSpacing: "-0.04em",
                    lineHeight: "1em",
                    variant: "Medium",
                },
            } as any,
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#F4F4F2",
            },
            liftColor: {
                type: ControlType.Color,
                title: "Lift Color",
                defaultValue: "#F4F4F2",
            },
            rowGap: {
                type: ControlType.Number,
                title: "Row Gap",
                defaultValue: 4,
                min: -40,
                max: 160,
                step: 1,
                unit: "px",
            },
            fit: {
                type: ControlType.Boolean,
                title: "Fit Width",
                defaultValue: true,
            },
            padding: {
                type: ControlType.Number,
                title: "Side Space",
                defaultValue: 32,
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
                hidden: (v: any) => (v?.fit ?? v?.text?.fit) === false,
            },
        },
    },
    slides: {
        type: ControlType.Array,
        title: "Media",
        maxCount: 24,
        control: {
            type: ControlType.Object,
            controls: {
                kind: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    displaySegmentedControl: true,
                    defaultValue: "image",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (s: any) => s?.kind !== "video",
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://…/clip.mp4",
                    hidden: (s: any) => s?.kind !== "video",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt Text",
                    defaultValue: "",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                    hidden: (s: any) => !s?.link,
                },
            },
        },
        defaultValue: [
            {
                kind: "image",
                imageUrl: img("photo-1534528741775-53994a69daeb"),
                alt: "Portrait",
            },
            {
                kind: "image",
                imageUrl: img("photo-1470071459604-3b5ec3a7fe05"),
                alt: "Misty hills",
            },
            {
                kind: "image",
                imageUrl: img("photo-1524504388940-b1c1722653e1"),
                alt: "Portrait",
            },
            {
                kind: "image",
                imageUrl: img("photo-1501785888041-af3ef285b470"),
                alt: "Lake view",
            },
            {
                kind: "image",
                imageUrl: img("photo-1469474968028-56623f02e42e"),
                alt: "Landscape",
            },
        ],
    },
    frame: {
        type: ControlType.Object,
        title: "Frame",
        controls: {
            width: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 88,
                min: 20,
                max: 600,
                step: 1,
                unit: "px",
            },
            height: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: 106,
                min: 20,
                max: 600,
                step: 1,
                unit: "px",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 3,
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
            },
            clearance: {
                type: ControlType.Number,
                title: "Clearance",
                defaultValue: 6,
                min: -40,
                max: 160,
                step: 1,
                unit: "px",
            },
            spread: {
                type: ControlType.Number,
                title: "Spread",
                defaultValue: 40,
                min: 0,
                max: 300,
                step: 1,
                unit: "px",
            },
            edgeScale: {
                type: ControlType.Number,
                title: "Edge Size",
                defaultValue: 0.12,
                min: 0.02,
                max: 1,
                step: 0.01,
            },
            zoom: {
                type: ControlType.Number,
                title: "Inner Zoom",
                defaultValue: 0.25,
                min: 0,
                max: 1,
                step: 0.01,
            },
            mono: {
                type: ControlType.Boolean,
                title: "Mono Edges",
                defaultValue: false,
            },
            fill: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "#1C1C1F",
            },
            shadow: {
                type: ControlType.BoxShadow,
                title: "Shadow",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            drive: {
                type: ControlType.Enum,
                title: "Drive",
                options: ["wheel", "auto", "scroll"],
                optionTitles: ["Wheel", "Auto", "Scroll"],
                displaySegmentedControl: true,
                defaultValue: "wheel",
            },
            flow: {
                type: ControlType.Enum,
                title: "Flow",
                options: ["toLeft", "toRight"],
                optionTitles: ["To Left", "To Right"],
                displaySegmentedControl: true,
                defaultValue: "toLeft",
            },
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: true,
                hidden: notAuto,
            },
            pace: {
                type: ControlType.Number,
                title: "Pace",
                defaultValue: 1.1,
                min: 0.3,
                max: 8,
                step: 0.1,
                unit: "s",
                hidden: notAuto,
            },
            hold: {
                type: ControlType.Number,
                title: "Hold",
                defaultValue: 0.35,
                min: 0,
                max: 6,
                step: 0.05,
                unit: "s",
                hidden: notAuto,
            },
            scrollHold: {
                type: ControlType.Number,
                title: "Scroll Hold",
                defaultValue: 0.35,
                min: 0,
                max: 0.85,
                step: 0.01,
                hidden: (v: any) => !isScroll(v),
            },
            wheelSpeed: {
                type: ControlType.Number,
                title: "Wheel Speed",
                defaultValue: 1,
                min: 0.2,
                max: 4,
                step: 0.1,
                hidden: notWheel,
            },
            snap: {
                type: ControlType.Boolean,
                title: "Snap",
                defaultValue: true,
                hidden: notWheel,
            },
            loop: {
                type: ControlType.Boolean,
                title: "Loop",
                defaultValue: true,
                hidden: notWheel,
            },
            drag: {
                type: ControlType.Boolean,
                title: "Drag & Swipe",
                defaultValue: true,
                hidden: isScroll,
            },
            hoverHalt: {
                type: ControlType.Boolean,
                title: "Hover Pause",
                defaultValue: true,
                hidden: notAuto,
            },
            glide: {
                type: ControlType.Number,
                title: "Center Ease",
                defaultValue: 1.8,
                min: 1,
                max: 3.5,
                step: 0.1,
            },
            settle: {
                type: ControlType.Number,
                title: "Response",
                defaultValue: 9,
                min: 2,
                max: 30,
                step: 0.5,
            },
            tilt: {
                type: ControlType.Number,
                title: "Arc Tilt",
                defaultValue: 0,
                min: 0,
                max: 1,
                step: 0.05,
            },
            stretch: {
                type: ControlType.Number,
                title: "Stretch",
                defaultValue: 0.35,
                min: 0,
                max: 1,
                step: 0.05,
            },
            intro: {
                type: ControlType.Enum,
                title: "Intro",
                options: ["rise", "fade", "none"],
                optionTitles: ["Rise", "Fade", "None"],
                displaySegmentedControl: true,
                defaultValue: "rise",
            },
        },
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0B0B0D",
    },
})
