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


/* ------------------------------------------------------------------ */
/*  Twine Gallery                                                      */
/*  Cards hang from a twine that follows the bottom arc of a ring.     */
/*  Scrolling spins the ring; every card swings on its own spring.     */
/*  Hovering a card gives it its own left-right wobble and two lines   */
/*  of text.                                                           */
/*                                                                     */
/*  Performance: the animation loop and video playback only run when   */
/*  the component is live (not canvas / export) and in or near the     */
/*  viewport. Static contexts get a single rendered frame.             */
/* ------------------------------------------------------------------ */

type Item = {
    kind?: "image" | "video"
    image?: any
    video?: string
    title?: string
    subtitle?: string
}

type Props = {
    items: Item[]
    hang: "tape" | "peg" | "pin"
    sway: number
    curve: number
    twineHeight: number
    cardScale: number
    ratio: number
    radius: number
    twineColor: string
    textColor: string
    scrollMode: "page" | "wheel" | "both" | "none"
    snap: boolean
    allowUpload: boolean
    titleFont?: React.CSSProperties
    subtitleFont?: React.CSSProperties
    style?: React.CSSProperties
}

/* ---------- helpers ---------- */
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

function rng(seed: number) {
    return () => {
        seed |= 0
        seed = (seed + 0x6d2b79f5) | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

// Generated sample art, so the component looks finished before you add media.
function art(c1: string, c2: string, c3: string, seed: number) {
    const r = rng(seed)
    const w = 90 + r() * 70,
        ax = 120 + r() * 360,
        cr = 90 + r() * 90,
        cx = 80 + r() * 440,
        cy = 170 + r() * 250
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 780'><defs><linearGradient id='g' x1='0' y1='0' x2='.5' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient><filter id='b' x='-50%' y='-50%' width='200%' height='200%'><feGaussianBlur stdDeviation='46'/></filter><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' seed='${seed}'/><feColorMatrix type='saturate' values='0'/></filter></defs><rect width='600' height='780' fill='url(#g)'/><g filter='url(#b)' opacity='.85'><circle cx='${600 - cx}' cy='${700 - cy}' r='190' fill='${c3}'/></g><circle cx='${cx}' cy='${cy}' r='${cr}' fill='${c3}'/><path d='M${ax - w} 780 V520 A${w} ${w} 0 0 1 ${ax + w} 520 V780 Z' fill='${c2}' opacity='.55'/><rect width='600' height='780' filter='url(#n)' opacity='.16'/></svg>`
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg)
}

const DEMO: [string, string, string, string, string][] = [
    [
        "Salt air",
        "Windows open, hair everywhere",
        "#6aa8ff",
        "#dff0ff",
        "#ff9a73",
    ],
    [
        "Slow mornings",
        "Coffee goes cold, nobody minds",
        "#f4c37d",
        "#ffe9c4",
        "#e0654a",
    ],
    ["Marigold", "The market closes at nine", "#ffb02e", "#ff6b3d", "#fff2c9"],
    [
        "Paper boats",
        "Floating past the bus stop",
        "#8fd3c4",
        "#1f6f78",
        "#f6f1d8",
    ],
    [
        "Night shift",
        "Streetlights hum back at you",
        "#2d3a8c",
        "#0e1233",
        "#ff7ab6",
    ],
    [
        "Clay and light",
        "Warm hands, wet wheel",
        "#d98b6a",
        "#7a3b3b",
        "#ffd9b8",
    ],
    [
        "Tidepool",
        "Small worlds, shallow and bright",
        "#4fb3d9",
        "#103c5e",
        "#ffe27a",
    ],
    [
        "Fig season",
        "Sticky fingers, long tables",
        "#a47ad6",
        "#3b2466",
        "#f6b3a0",
    ],
]

const DEFAULT_ITEMS: Item[] = DEMO.map((d, i) => ({
    kind: "image",
    image: art(d[2], d[3], d[4], i * 97 + 11),
    title: d[0],
    subtitle: d[1],
}))

const TAPES: [string, string][] = [
    ["rgba(159,216,200,.92)", "#2fa58a"],
    ["rgba(255,210,122,.94)", "#e3a21a"],
    ["rgba(247,168,184,.94)", "#e0587a"],
    ["rgba(169,196,255,.94)", "#4d79e6"],
    ["rgba(213,184,255,.94)", "#8a5ce0"],
]

const imgSrc = (v: any): string => (typeof v === "string" ? v : v?.src || "")

/* ---------- fasteners ---------- */
function Fastener({
    kind,
    tape,
    tilt,
}: {
    kind: Props["hang"]
    tape: [string, string]
    tilt: number
}) {
    const base: React.CSSProperties = {
        position: "absolute",
        left: 0,
        top: 0,
        zIndex: 5,
        pointerEvents: "none",
    }
    if (kind === "peg") {
        return (
            <div
                style={{
                    ...base,
                    width: 15,
                    height: 50,
                    margin: "-12px 0 0 -7.5px",
                    borderRadius: "3px 3px 6px 6px",
                    background:
                        "linear-gradient(90deg,#7d5230,#c18c58 45%,#7d5230)",
                    boxShadow: "0 3px 5px rgba(0,0,0,.3)",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        left: -1,
                        right: -1,
                        top: 17,
                        height: 5,
                        background: "linear-gradient(#efe0ae,#a98b3d)",
                        borderRadius: 1,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: 24,
                        bottom: 3,
                        width: 2,
                        marginLeft: -1,
                        background: "rgba(0,0,0,.35)",
                    }}
                />
            </div>
        )
    }
    if (kind === "pin") {
        return (
            <div
                style={{
                    ...base,
                    width: 20,
                    height: 20,
                    margin: "-3px 0 0 -10px",
                    borderRadius: "50%",
                    background: `radial-gradient(circle at 34% 30%, rgba(255,255,255,.75), rgba(255,255,255,0) 42%), ${tape[1]}`,
                    boxShadow:
                        "0 4px 6px rgba(0,0,0,.35), inset 0 -3px 4px rgba(0,0,0,.2)",
                }}
            />
        )
    }
    return (
        <div
            style={{
                ...base,
                width: 64,
                height: 26,
                margin: "-8px 0 0 -32px",
                transform: `rotate(${tilt}deg)`,
                background: `repeating-linear-gradient(135deg, rgba(255,255,255,.38) 0 5px, rgba(255,255,255,0) 5px 10px), ${tape[0]}`,
                clipPath:
                    "polygon(0 0,100% 0,98% 20%,100% 40%,98% 60%,100% 80%,98% 100%,0 100%,2% 80%,0 60%,2% 40%,0 20%)",
                filter: "drop-shadow(0 2px 2px rgba(0,0,0,.18))",
            }}
        />
    )
}

/**
 * Twine Gallery
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 640
 */
export default function TwineGallery(props: Props) {
    const {
        items,
        hang,
        radius,
        twineColor,
        textColor,
        scrollMode,
        allowUpload,
        titleFont,
        subtitleFont,
        style,
    } = props

    // True on the canvas and in static exports / thumbnails. In those
    // contexts we draw a single frame: no animation loop, no video playback,
    // no input handling.
    const isCanvas = useIsStaticRenderer()

    const rootRef = React.useRef<HTMLDivElement>(null)
    const twineRef = React.useRef<SVGPathElement>(null)
    const twine2Ref = React.useRef<SVGPathElement>(null)
    const fileRef = React.useRef<HTMLInputElement>(null)
    const slotEls = React.useRef<(HTMLDivElement | null)[]>([])
    const swayEls = React.useRef<(HTMLDivElement | null)[]>([])
    const cardEls = React.useRef<(HTMLDivElement | null)[]>([])
    const videoEls = React.useRef<(HTMLVideoElement | null)[]>([])

    // Draws one frame on demand (set only in static contexts).
    const renderOnce = React.useRef<(() => void) | null>(null)

    // Whether the component is in or near the viewport.
    const [inView, setInView] = React.useState(false)

    const [local, setLocal] = React.useState<Item[]>([])
    const all = React.useMemo<Item[]>(
        () => [...(items || []), ...local],
        [items, local]
    )
    const N = all.length
    const M = N ? N * Math.ceil(11 / N) : 0

    // Live values the animation loop reads without restarting.
    const live = React.useRef<any>({})
    live.current = { ...props, N, M }

    const S = React.useRef({
        offset: 0,
        vel: 0,
        dragging: false,
        pressed: false,
        moved: 0,
        lx: 0,
        lt: 0,
        sx: 0,
        lastInput: 0,
        W: 0,
        H: 0,
        slots: [] as any[],
        layoutKey: "",
    })

    const touchOnly =
        typeof window !== "undefined" &&
        window.matchMedia?.("(hover: none)").matches
    const reduce =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

    /* ---------- size ---------- */
    React.useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const measure = () => {
            S.current.W = el.clientWidth
            S.current.H = el.clientHeight
            // In static contexts there is no loop, so redraw on resize.
            renderOnce.current?.()
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [M])

    /* ---------- visibility (in or near the viewport) ---------- */
    React.useEffect(() => {
        const el = rootRef.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }
        const io = new IntersectionObserver(
            ([entry]) => setInView(entry.isIntersecting),
            { rootMargin: "200px" }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [M])

    /* ---------- animation loop ---------- */
    React.useEffect(() => {
        if (!M) return
        const st = S.current
        while (st.slots.length < M) {
            const r = rng(st.slots.length * 131 + 7)
            st.slots.push({
                a: 0,
                w: 0,
                pv: 0,
                px: null,
                hov: 0,
                hover: false,
                lastHv: 0,
                off: true,
                playing: false,
                ph: r() * 6.28,
                k: 70 + r() * 45,
                c: 5.5 + r() * 3.5,
            })
        }
        st.slots.length = M

        let raf = 0
        let last = performance.now()

        // One step of the simulation + render. Does not schedule itself.
        const frame = (now: number) => {
            const L = live.current
            const dt = Math.min(0.033, Math.max(0.001, (now - last) / 1000))
            last = now
            const root = rootRef.current
            const { W, H } = st
            if (!root || !W || !H) return

            /* layout */
            let cw = clamp(W * 0.2 * L.cardScale, 110, 340)
            let ch = cw * L.ratio
            if (ch > H * 0.58) {
                ch = H * 0.58
                cw = ch / L.ratio
            }
            const spacing = cw * 1.12 + 14
            const R = W * (3.6 - L.curve * 2.4)
            const cy = H * L.twineHeight - R
            const key = [
                W,
                H,
                cw.toFixed(1),
                ch.toFixed(1),
                L.curve,
                L.twineHeight,
            ].join("|")
            if (key !== st.layoutKey) {
                st.layoutKey = key
                root.style.setProperty("--cw", cw + "px")
                root.style.setProperty("--ch", ch + "px")
                let d = ""
                const n = 64
                for (let k = 0; k <= n; k++) {
                    const x = -40 + ((W + 80) * k) / n
                    const dx = x - W / 2
                    d +=
                        (k ? "L" : "M") +
                        x.toFixed(1) +
                        " " +
                        (cy + Math.sqrt(Math.max(0, R * R - dx * dx))).toFixed(
                            1
                        )
                }
                twineRef.current?.setAttribute("d", d)
                twine2Ref.current?.setAttribute("d", d)
            }

            /* ring motion */
            if (!st.dragging) {
                st.offset += st.vel * dt
                st.vel *= Math.exp(-dt * 2.2)
                if (
                    L.snap &&
                    now - st.lastInput > 160 &&
                    Math.abs(st.vel) < 0.7
                ) {
                    const tgt = Math.round(st.offset)
                    st.vel += ((tgt - st.offset) * 70 - st.vel * 14) * dt
                }
            }

            const sec = now / 1000
            const sway = reduce ? Math.min(L.sway, 0.25) : L.sway

            for (let i = 0; i < M; i++) {
                const s = st.slots[i]
                const el = slotEls.current[i]
                const sw = swayEls.current[i]
                const card = cardEls.current[i]
                if (!el || !sw || !card) continue

                let t = (((i - st.offset) % M) + M) % M
                if (t > M / 2) t -= M
                const th = (t * spacing) / R
                const x = W / 2 + R * Math.sin(th)
                const y = cy + R * Math.cos(th)

                const off = Math.abs(x - W / 2) > W / 2 + cw * 1.3
                if (off !== s.off) {
                    s.off = off
                    el.style.visibility = off ? "hidden" : "visible"
                    if (off) {
                        s.a = 0
                        s.w = 0
                        s.pv = 0
                    }
                }
                if (off) {
                    s.px = x
                    const v = videoEls.current[i]
                    if (v && s.playing) {
                        v.pause()
                        s.playing = false
                    }
                    continue
                }

                /* spring-pendulum: the card trails the peg, overshoots, settles */
                let raw = s.px == null ? 0 : (x - s.px) / dt
                if (s.px != null && Math.abs(x - s.px) > 260) raw = 0
                s.px = x
                s.pv += (raw - s.pv) * Math.min(1, dt * 16)
                const target = clamp(s.pv * 0.011 * sway, -24, 24)
                s.w += (-s.k * (s.a - target) - s.c * s.w) * dt
                s.a += s.w * dt

                const sp = Math.min(Math.abs(s.pv), 1800)
                const tremor =
                    (Math.sin(now * 0.031 + s.ph) +
                        0.5 * Math.sin(now * 0.053 + s.ph * 2)) *
                    Math.min(sp * 0.0011, 1.5) *
                    sway
                const bob =
                    Math.sin(now * 0.026 + s.ph) *
                    Math.min(sp * 0.0013, 2.4) *
                    sway
                const ry = clamp(s.w * 0.1, -14, 14) * sway

                /* hover */
                s.hov += ((s.hover ? 1 : 0) - s.hov) * Math.min(1, dt * 9)
                const hv = s.hov < 0.002 ? 0 : s.hov
                const hk = reduce ? 0.3 : 1
                const wob = Math.sin(sec * 7.5 + s.ph) * hv * 4.5 * hk
                const sc = 1 - (0.05 * Math.min(Math.abs(t), 3)) / 3

                el.style.transform = `translate3d(${x.toFixed(2)}px,${(y + bob).toFixed(2)}px,0) rotate(${(-th * 0.45 * 57.2958).toFixed(2)}deg) scale(${sc.toFixed(3)})`
                sw.style.transform = `rotate(${(s.a + tremor + wob).toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${(1 + 0.045 * hv).toFixed(3)})`
                el.style.zIndex = String(
                    hv > 0.05 ? 50 : 20 - Math.round(Math.abs(t))
                )

                if (hv > 0 || s.lastHv > 0) {
                    card.style.setProperty("--hov", hv.toFixed(3))
                    card.style.setProperty(
                        "--t1",
                        (Math.sin(sec * 7.5 + 1.1) * hv * 7 * hk).toFixed(2) +
                            "px"
                    )
                    card.style.setProperty(
                        "--t2",
                        (Math.sin(sec * 7.5 + 2.3) * hv * 11 * hk).toFixed(2) +
                            "px"
                    )
                }
                s.lastHv = hv

                const v = videoEls.current[i]
                if (v) {
                    // Never play in static contexts; only near the centre.
                    const want = !isCanvas && Math.abs(t) < 4.6
                    if (want && !s.playing) {
                        s.playing = true
                        const p = v.play()
                        if (p && p.catch)
                            p.catch(() => {
                                s.playing = false
                            })
                    } else if (!want && s.playing) {
                        v.pause()
                        s.playing = false
                    }
                }
            }
        }

        const stopVideos = () => {
            videoEls.current.forEach((v, i) => {
                if (v) v.pause()
                if (st.slots[i]) st.slots[i].playing = false
            })
        }

        // Static (canvas / export): draw a single frame. No loop, no playback.
        if (isCanvas) {
            renderOnce.current = () => frame(performance.now())
            renderOnce.current()
            return () => {
                renderOnce.current = null
            }
        }

        // Offscreen: no loop, and any playing video is paused.
        if (!inView) {
            stopVideos()
            return
        }

        const loop = (now: number) => {
            frame(now)
            raf = requestAnimationFrame(loop)
        }
        last = performance.now() // avoid a large dt after resuming
        raf = requestAnimationFrame(loop)
        return () => {
            cancelAnimationFrame(raf)
            stopVideos()
        }
    }, [M, isCanvas, inView])

    /* ---------- page scroll + wheel ---------- */
    React.useEffect(() => {
        // Skip in static contexts and while offscreen so scroll
        // velocity doesn't build up while the loop is stopped.
        if (isCanvas || !inView) return
        const root = rootRef.current
        if (!root) return
        const kick = (d: number) => {
            const st = S.current
            st.vel = clamp(st.vel + d * 0.012, -9, 9)
            st.lastInput = performance.now()
        }
        const useWheel = scrollMode === "wheel" || scrollMode === "both"
        const usePage = scrollMode === "page" || scrollMode === "both"

        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            const d =
                Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
            kick(e.deltaMode === 1 ? d * 16 : d)
        }
        let lastY = window.scrollY
        const onScroll = () => {
            const y = window.scrollY
            kick(y - lastY)
            lastY = y
        }
        if (useWheel)
            root.addEventListener("wheel", onWheel, { passive: false })
        if (usePage)
            window.addEventListener("scroll", onScroll, { passive: true })
        return () => {
            root.removeEventListener("wheel", onWheel)
            window.removeEventListener("scroll", onScroll)
        }
    }, [scrollMode, isCanvas, inView])

    /* ---------- drag + keys ---------- */
    const onPointerDown = (e: React.PointerEvent) => {
        if (isCanvas) return
        if ((e.target as HTMLElement).closest("button")) return
        const st = S.current
        st.pressed = true
        st.dragging = false
        st.moved = 0
        st.sx = st.lx = e.clientX
        st.lt = performance.now()
    }
    const onPointerMove = (e: React.PointerEvent) => {
        const st = S.current
        if (!st.pressed) return
        const now = performance.now()
        const spacing = st.W * 0.2 * live.current.cardScale * 1.12 + 14
        if (!st.dragging) {
            if (Math.abs(e.clientX - st.sx) < 5) return
            st.dragging = true
            try {
                ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
            } catch (_) {}
            st.lx = e.clientX
            st.lt = now
            st.vel = 0
            return
        }
        const dx = e.clientX - st.lx
        const dts = Math.max(0.001, (now - st.lt) / 1000)
        st.moved += Math.abs(dx)
        st.offset -= dx / spacing
        st.vel += (clamp(-dx / spacing / dts, -12, 12) - st.vel) * 0.45
        st.lx = e.clientX
        st.lt = now
        st.lastInput = now
    }
    const endPointer = () => {
        const st = S.current
        if (!st.pressed) return
        st.pressed = false
        const now = performance.now()
        if (st.dragging && now - st.lt > 90) st.vel *= 0.2
        st.dragging = false
        st.lastInput = now
        setTimeout(() => {
            st.moved = 0
        }, 0)
    }
    const onKeyDown = (e: React.KeyboardEvent) => {
        const st = S.current
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            st.vel += 2.4
            st.lastInput = performance.now()
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            st.vel -= 2.4
            st.lastInput = performance.now()
        }
    }

    /* ---------- visitor uploads (optional) ---------- */
    const addFiles = (list: FileList | null) => {
        if (!list) return
        const files = Array.from(list).filter((f) =>
            /^(image|video)\//.test(f.type)
        )
        if (!files.length) return
        const added: Item[] = files.map((f) => {
            const url = URL.createObjectURL(f)
            const isVideo = f.type.startsWith("video")
            const name =
                f.name
                    .replace(/\.[^.]+$/, "")
                    .replace(/[_-]+/g, " ")
                    .trim()
                    .slice(0, 28) || "Untitled"
            return {
                kind: isVideo ? "video" : "image",
                image: isVideo ? undefined : url,
                video: isVideo ? url : undefined,
                title: name[0].toUpperCase() + name.slice(1),
                subtitle: isVideo ? "Video" : "Photo",
            }
        })
        const st = S.current
        st.offset = all.length - 1
        st.vel = 2.3
        st.lastInput = performance.now()
        setLocal((prev) => [...prev, ...added])
    }

    /* ---------- render ---------- */
    const root: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        touchAction: "pan-y",
        cursor: isCanvas ? "default" : "grab",
        userSelect: "none",
        WebkitUserSelect: "none",
        outline: "none",
        ...style,
    }

    if (!M) {
        return (
            <div
                style={{
                    ...root,
                    display: "grid",
                    placeItems: "center",
                    color: "#888",
                    font: "500 14px system-ui",
                }}
            >
                Add cards in the properties panel
            </div>
        )
    }

    return (
        <div
            ref={rootRef}
            style={root}
            tabIndex={0}
            role="region"
            aria-label="Hanging media gallery. Scroll, drag, or use arrow keys to move."
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            onKeyDown={onKeyDown}
        >
            <svg
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    overflow: "visible",
                }}
                aria-hidden="true"
            >
                <path
                    ref={twineRef}
                    d=""
                    fill="none"
                    stroke={twineColor}
                    strokeWidth={2.4}
                    strokeLinecap="round"
                />
                <path
                    ref={twine2Ref}
                    d=""
                    fill="none"
                    stroke={twineColor}
                    strokeWidth={1.2}
                    strokeDasharray="2 5"
                    opacity={0.45}
                    style={{ mixBlendMode: "screen" }}
                />
            </svg>

            {Array.from({ length: M }).map((_, i) => {
                const item = all[i % N]
                const tp = TAPES[(i % N) % TAPES.length]
                const tilt = rng(i * 31 + 5)() * 10 - 5
                const src =
                    item.kind === "video"
                        ? typeof item.video === "string"
                            ? item.video
                            : ""
                        : imgSrc(item.image)
                return (
                    <div
                        key={i}
                        ref={(el) => {
                            slotEls.current[i] = el
                        }}
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: 0,
                            height: 0,
                            perspective: 900,
                            willChange: "transform",
                            visibility: "hidden",
                        }}
                    >
                        <div
                            ref={(el) => {
                                swayEls.current[i] = el
                            }}
                            style={{
                                position: "absolute",
                                left: "calc(var(--cw) / -2)",
                                top: 7,
                                width: "var(--cw)",
                                height: "var(--ch)",
                                transformOrigin: "50% 0",
                                willChange: "transform",
                            }}
                        >
                            <div
                                ref={(el) => {
                                    cardEls.current[i] = el
                                }}
                                onMouseEnter={() => {
                                    const s = S.current.slots[i]
                                    if (!s || touchOnly || isCanvas) return
                                    s.hover = true
                                    s.w +=
                                        (Math.random() < 0.5 ? -1 : 1) *
                                        70 *
                                        Math.max(0.3, live.current.sway)
                                }}
                                onMouseLeave={() => {
                                    const s = S.current.slots[i]
                                    if (s) s.hover = false
                                }}
                                onClick={() => {
                                    if (!touchOnly || S.current.moved > 6)
                                        return
                                    const slots = S.current.slots
                                    const on = !slots[i].hover
                                    slots.forEach((o) => (o.hover = false))
                                    if (on) {
                                        slots[i].hover = true
                                        slots[i].w += 60
                                    }
                                }}
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: radius,
                                    overflow: "hidden",
                                    background: "#cfd7e0",
                                    boxShadow:
                                        "0 22px 34px -16px rgba(20,30,50,.45), 0 2px 6px rgba(0,0,0,.12)",
                                }}
                            >
                                {item.kind === "video" ? (
                                    <video
                                        ref={(el) => {
                                            videoEls.current[i] = el
                                        }}
                                        src={src || undefined}
                                        muted
                                        loop
                                        playsInline
                                        preload="metadata"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                            pointerEvents: "none",
                                        }}
                                    />
                                ) : src ? (
                                    <img
                                        src={src}
                                        alt={item.title || ""}
                                        draggable={false}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                            pointerEvents: "none",
                                        }}
                                    />
                                ) : null}

                                <div
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        padding: "54px 16px 16px",
                                        pointerEvents: "none",
                                        color: textColor,
                                        background:
                                            "linear-gradient(to top, rgba(8,10,14,.74), rgba(8,10,14,0))",
                                        opacity: "var(--hov, 0)" as any,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 22,
                                            fontWeight: 700,
                                            lineHeight: 1.05,
                                            letterSpacing: "-0.01em",
                                            ...titleFont,
                                            transform:
                                                "translateX(var(--t1, 0px))",
                                        }}
                                    >
                                        {item.title}
                                    </div>
                                    <div
                                        style={{
                                            marginTop: 6,
                                            fontSize: 13,
                                            opacity: 0.88,
                                            ...subtitleFont,
                                            transform:
                                                "translateX(var(--t2, 0px))",
                                        }}
                                    >
                                        {item.subtitle}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Fastener kind={hang} tape={tp} tilt={tilt} />
                    </div>
                )
            })}

            {allowUpload && !isCanvas && (
                <>
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        style={{
                            position: "absolute",
                            left: "50%",
                            bottom: 16,
                            transform: "translateX(-50%)",
                            zIndex: 100,
                            border: 0,
                            borderRadius: 999,
                            padding: "12px 18px",
                            minHeight: 44,
                            cursor: "pointer",
                            font: "600 14px system-ui, sans-serif",
                            background: "#e0492b",
                            color: "#fff",
                        }}
                    >
                        Add photos or videos
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        hidden
                        onChange={(e) => {
                            addFiles(e.target.files)
                            e.target.value = ""
                        }}
                    />
                </>
            )}
        </div>
    )
}

TwineGallery.defaultProps = {
    items: DEFAULT_ITEMS,
    hang: "tape",
    sway: 1,
    curve: 0.5,
    twineHeight: 0.27,
    cardScale: 1,
    ratio: 1.32,
    radius: 16,
    twineColor: "#8f7f66",
    textColor: "#ffffff",
    scrollMode: "page",
    snap: true,
    allowUpload: false,
    width: 1200,
    height: 640,
}

addPropertyControls(TwineGallery, {
    items: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                kind: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                image: {
                    type: ControlType.Image,
                    title: "Image",
                    hidden: (p: any) => p.kind === "video",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (p: any) => p.kind !== "video",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "New card",
                },
                subtitle: {
                    type: ControlType.String,
                    title: "Second line",
                    defaultValue: "A line about this one",
                },
            },
        },
        defaultValue: DEFAULT_ITEMS as any,
    },
    hang: {
        type: ControlType.Enum,
        title: "Fastener",
        options: ["tape", "peg", "pin"],
        optionTitles: ["Washi tape", "Wooden pegs", "Push pins"],
        defaultValue: "tape",
    },
    scrollMode: {
        type: ControlType.Enum,
        title: "Scroll by",
        options: ["page", "wheel", "both", "none"],
        optionTitles: ["Page scroll", "Wheel over it", "Both", "Drag only"],
        defaultValue: "page",
    },
    sway: {
        type: ControlType.Number,
        title: "Sway",
        min: 0,
        max: 2,
        step: 0.05,
        defaultValue: 1,
    },
    curve: {
        type: ControlType.Number,
        title: "Twine curve",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.5,
    },
    twineHeight: {
        type: ControlType.Number,
        title: "Twine height",
        min: 0.08,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.27,
    },
    cardScale: {
        type: ControlType.Number,
        title: "Card size",
        min: 0.6,
        max: 1.6,
        step: 0.05,
        defaultValue: 1,
    },
    ratio: {
        type: ControlType.Number,
        title: "Card ratio",
        min: 0.9,
        max: 1.8,
        step: 0.02,
        defaultValue: 1.32,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 16,
    },
    twineColor: {
        type: ControlType.Color,
        title: "Twine",
        defaultValue: "#8f7f66",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#ffffff",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            fontWeight: 700,
            lineHeight: "1.05em",
        },
    } as any,
    subtitleFont: {
        type: ControlType.Font,
        title: "Line 2 font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            fontWeight: 400,
            lineHeight: "1.3em",
        },
    } as any,
    snap: {
        type: ControlType.Boolean,
        title: "Snap to card",
        defaultValue: true,
    },
    allowUpload: {
        type: ControlType.Boolean,
        title: "Visitor upload",
        defaultValue: false,
    },
})
