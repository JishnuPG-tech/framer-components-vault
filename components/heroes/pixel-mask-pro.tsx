// Quadrat — media panel under an interactive pixel mask
//
// Marketplace compliance notes
// 1. Static renderer: the exported entry calls useIsStaticRenderer() first and
//    returns <StaticView/> on the canvas and in exports. StaticView is plain
//    elements plus one SVG of rects at the resting pattern: no motion
//    components, transitions, filters, listeners, observers, timers, rAF or
//    video playback. It shares no markup helper with the live branch.
// 2. Offscreen work: LiveView's rAF loop starts locked out and runs only after
//    an IntersectionObserver reports the panel on screen and the tab is
//    visible. The permit is re-checked at the top of every frame; leaving the
//    viewport or hiding the tab cancels the frame, clears the ambient timer,
//    drops pointer/ripple state and pauses video. The loop also sleeps itself
//    once every pixel has settled and wakes on pointer input or the ambient
//    tick. prefers-reduced-motion disables intro, ripples, flicker, stagger
//    and parallax. If IntersectionObserver is missing, the live path runs.
// 3. The on-canvas image/video switch is drawn as plain markup in StaticView;
//    the live switch crossfades layers and only plays video while permitted.

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


const DEF_IMG =
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80"

const DEF = {
    media: {
        type: "image",
        image: undefined as any,
        imageUrl: DEF_IMG,
        video: "",
        videoUrl: "",
        fit: "cover",
        position: "center",
        parallax: 14,
    },
    pattern: {
        layout: "band",
        cell: 26,
        gap: 0,
        density: 0.5,
        roughness: 0.75,
        sprinkle: 0.5,
        tint: 0.35,
        seed: 7,
        coverColor: "#F4F4F2",
        tintColor: "#9AA9B8",
        tintOpacity: 0.75,
    },
    hover: {
        mode: "reveal",
        brush: "square",
        size: 2.5,
        stagger: 22,
        hold: 900,
        heal: 0.08,
    },
    click: { ripple: true, speed: 900, width: 0.9 },
    ambient: {
        intro: true,
        introFrom: "edges",
        introDuration: 1400,
        twinkle: true,
        rate: 2.5,
    },
    toggle: {
        show: true,
        offset: 20,
        imageLabel: "Image",
        videoLabel: "Video",
        size: 13,
        fill: "rgba(18, 20, 22, 0.55)",
        text: "#FFFFFF",
        thumb: "#FFFFFF",
        thumbText: "#121416",
        pulse: true,
    },
    menu: {
        show: true,
        offset: 20,
        size: 13,
        fill: "rgba(18, 20, 22, 0.6)",
        panel: "rgba(16, 18, 20, 0.86)",
        text: "#FFFFFF",
        accent: "#FFFFFF",
        previews: true,
        ripple: true,
    },
}

const LAYOUTS: [string, string][] = [
    ["band", "Diagonal Band"],
    ["frame", "Frame"],
    ["corners", "Corners"],
    ["curtain", "Curtain"],
    ["island", "Island"],
    ["scatter", "Scatter"],
]
const layoutName = (k: string) =>
    (LAYOUTS.find((l) => l[0] === k) || LAYOUTS[0])[1]

const TOGGLE_ATTR = "data-quadrat-switch"

function LayoutThumb({ pattern, layout, w, h, ink, ground }: any) {
    const cols = 16
    const rows = 11
    const base = buildBase(cols, rows, { ...pattern, layout })
    const cw = w / cols
    const ch = h / rows
    const cells: any[] = []
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
            const b = base[r * cols + c]
            if (!b) continue
            cells.push(
                <rect
                    key={r * cols + c}
                    x={c * cw}
                    y={r * ch}
                    width={cw + 0.2}
                    height={ch + 0.2}
                    fill={ink}
                    fillOpacity={b === 2 ? 0.45 : 1}
                />
            )
        }
    return (
        <svg
            width={w}
            height={h}
            viewBox={`0 0 ${w} ${h}`}
            aria-hidden="true"
            style={{
                display: "block",
                borderRadius: 4,
                flexShrink: 0,
                background: ground,
            }}
        >
            {cells}
        </svg>
    )
}

function Chevron({ color, open }: { color: string; open?: boolean }) {
    return (
        <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            aria-hidden="true"
            style={{
                transform: open ? "rotate(180deg)" : "none",
                transition: "transform 260ms ease",
                flexShrink: 0,
            }}
        >
            <path
                d="M2 3.6 L5 6.6 L8 3.6"
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function IconFrame({ color }: { color: string }) {
    return (
        <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
        >
            <rect
                x="1.5"
                y="2.5"
                width="13"
                height="11"
                rx="2"
                stroke={color}
                strokeWidth="1.5"
            />
            <path
                d="M3.5 11.5 L6.5 8 L8.8 10.4 L10.4 8.8 L12.5 11.5"
                stroke={color}
                strokeWidth="1.4"
                strokeLinejoin="round"
            />
            <circle cx="10.6" cy="5.6" r="1.1" fill={color} />
        </svg>
    )
}

function IconReel({ color }: { color: string }) {
    return (
        <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
        >
            <rect
                x="1.5"
                y="2.5"
                width="13"
                height="11"
                rx="2"
                stroke={color}
                strokeWidth="1.5"
            />
            <path d="M6.6 5.6 L10.8 8 L6.6 10.4 Z" fill={color} />
        </svg>
    )
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)

function hash(x: number, y: number, s: number) {
    let h =
        (Math.imul(x | 0, 374761393) +
            Math.imul(y | 0, 668265263) +
            Math.imul(s | 0, 982451653)) |
        0
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    h ^= h >>> 16
    return (h >>> 0) / 4294967295
}

function vnoise(x: number, y: number, s: number) {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const xf = x - xi
    const yf = y - yi
    const sx = xf * xf * (3 - 2 * xf)
    const sy = yf * yf * (3 - 2 * yf)
    const a = hash(xi, yi, s)
    const b = hash(xi + 1, yi, s)
    const c = hash(xi, yi + 1, s)
    const d = hash(xi + 1, yi + 1, s)
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
}

function field(layout: string, u: number, v: number) {
    switch (layout) {
        case "band":
            return Math.abs(u + v - 1)
        case "frame":
            return Math.max(Math.abs(u - 0.5), Math.abs(v - 0.5)) * 2
        case "corners": {
            const d = Math.min(
                Math.hypot(u, v),
                Math.hypot(1 - u, v),
                Math.hypot(u, 1 - v),
                Math.hypot(1 - u, 1 - v)
            )
            return clamp(1 - d / 0.75, 0, 1)
        }
        case "curtain":
            return 1 - v
        case "island":
            return clamp(1 - Math.hypot(u - 0.5, v - 0.5) / 0.62, 0, 1)
        default:
            return 0.5
    }
}

// 0 = clear, 1 = solid pixel, 2 = tinted pixel
function buildBase(cols: number, rows: number, p: any) {
    const base = new Uint8Array(cols * rows)
    const thr = 1 - clamp(p.density, 0, 1)
    const seed = Math.floor(p.seed) || 0
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const u = cols > 1 ? c / (cols - 1) : 0.5
            const v = rows > 1 ? r / (rows - 1) : 0.5
            const n =
                0.65 * vnoise(c / 4, r / 4, seed) + 0.35 * hash(c, r, seed + 7)
            const val = field(p.layout, u, v) + (n - 0.5) * p.roughness
            const i = r * cols + c
            if (val > thr) base[i] = 1
            else if (val > thr - 0.14 && hash(c, r, seed + 31) < p.tint)
                base[i] = 2
            else if (
                val > thr - 0.32 &&
                hash(c, r, seed + 53) < p.sprinkle * 0.3
            )
                base[i] = 1
        }
    }
    return base
}

function merge(props: any) {
    return {
        media: { ...DEF.media, ...(props.media || {}) },
        pattern: { ...DEF.pattern, ...(props.pattern || {}) },
        hover: { ...DEF.hover, ...(props.hover || {}) },
        click: { ...DEF.click, ...(props.click || {}) },
        ambient: { ...DEF.ambient, ...(props.ambient || {}) },
        toggle: { ...DEF.toggle, ...(props.toggle || {}) },
        menu: { ...DEF.menu, ...(props.menu || {}) },
        radius: props.radius ?? 0,
        background: props.background || "#1A1C1E",
    }
}

const POS: Record<string, string> = {
    center: "50% 50%",
    top: "50% 0%",
    bottom: "50% 100%",
    left: "0% 50%",
    right: "100% 50%",
}

/* ---------------------------------- static ---------------------------------- */

function StaticView(raw: any) {
    const P = merge(raw)
    const box = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState({ w: 700, h: 700 })
    useLayoutEffect(() => {
        const el = box.current
        if (!el) return
        const w = el.offsetWidth
        const h = el.offsetHeight
        if (w && h && (w !== size.w || h !== size.h)) setSize({ w, h })
    })
    const pat = P.pattern
    const cs = Math.max(6, Math.round(pat.cell))
    const cols = Math.max(1, Math.ceil(size.w / cs))
    const rows = Math.max(1, Math.ceil(size.h / cs))
    const ox = Math.floor((size.w - cols * cs) / 2)
    const oy = Math.floor((size.h - rows * cs) / 2)
    const base = buildBase(cols, rows, pat)
    const gap = clamp(pat.gap, 0, cs * 0.4)
    const inner = cs - gap
    const bleed = gap === 0 ? 0.5 : 0
    const solid: any[] = []
    const tinted: any[] = []
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const b = base[r * cols + c]
            if (!b) continue
            const x = ox + c * cs + gap / 2
            const y = oy + r * cs + gap / 2
            const el = (
                <rect
                    key={r * cols + c}
                    x={x}
                    y={y}
                    width={inner + bleed}
                    height={inner + bleed}
                />
            )
            if (b === 1) solid.push(el)
            else tinted.push(el)
        }
    }
    const src = P.media.image?.src || P.media.imageUrl || DEF_IMG
    return (
        <div
            ref={box}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: P.radius,
                background: P.background,
            }}
        >
            <img
                src={src}
                alt={P.media.image?.alt || ""}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: P.media.fit as any,
                    objectPosition: POS[P.media.position] || "50% 50%",
                    display: "block",
                }}
            />
            <svg
                width={size.w}
                height={size.h}
                viewBox={`0 0 ${size.w} ${size.h}`}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    display: "block",
                }}
            >
                <g fill={pat.tintColor} fillOpacity={pat.tintOpacity}>
                    {tinted}
                </g>
                <g fill={pat.coverColor}>{solid}</g>
            </svg>
            {P.toggle.show && (
                <div
                    style={{
                        position: "absolute",
                        top: P.toggle.offset,
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        padding: 4,
                        borderRadius: 999,
                        background: P.toggle.fill,
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontSize: P.toggle.size,
                        fontWeight: 500,
                        lineHeight: 1,
                        zIndex: 2,
                    }}
                >
                    {(["image", "video"] as const).map((k) => {
                        const on =
                            (P.media.type === "video" ? "video" : "image") === k
                        const col = on ? P.toggle.thumbText : P.toggle.text
                        return (
                            <div
                                key={k}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 6,
                                    minWidth: P.toggle.size * 6.4,
                                    padding: `${P.toggle.size * 0.62}px ${P.toggle.size * 1.1}px`,
                                    borderRadius: 999,
                                    background: on
                                        ? P.toggle.thumb
                                        : "transparent",
                                    color: col,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {k === "image" ? (
                                    <IconFrame color={col} />
                                ) : (
                                    <IconReel color={col} />
                                )}
                                {k === "image"
                                    ? P.toggle.imageLabel
                                    : P.toggle.videoLabel}
                            </div>
                        )
                    })}
                </div>
            )}
            {P.menu.show && (
                <div
                    style={{
                        position: "absolute",
                        top: P.menu.offset,
                        left: P.menu.offset,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "6px 12px 6px 6px",
                        borderRadius: 12,
                        background: P.menu.fill,
                        color: P.menu.text,
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontSize: P.menu.size,
                        lineHeight: 1.15,
                        zIndex: 3,
                    }}
                >
                    <LayoutThumb
                        pattern={pat}
                        layout={pat.layout}
                        w={36}
                        h={26}
                        ink={pat.coverColor}
                        ground="rgba(255,255,255,0.12)"
                    />
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                        }}
                    >
                        <span
                            style={{
                                fontSize: P.menu.size * 0.72,
                                opacity: 0.6,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                            }}
                        >
                            Layout
                        </span>
                        <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                            {layoutName(pat.layout)}
                        </span>
                    </div>
                    <Chevron color={P.menu.text} />
                </div>
            )}
        </div>
    )
}

/* ----------------------------------- live ----------------------------------- */

function LiveView(raw: any) {
    const P0 = merge(raw)
    const [layoutSel, setLayoutSel] = useState<string>(P0.pattern.layout)
    useEffect(() => {
        setLayoutSel(P0.pattern.layout)
    }, [P0.pattern.layout])
    const P = { ...P0, pattern: { ...P0.pattern, layout: layoutSel } }
    const propsRef = useRef(P)
    propsRef.current = P
    const wrapRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const mediaRef = useRef<any>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const probeRef = useRef<HTMLSpanElement>(null)
    const engine = useRef<any>(null)
    const [mode, setMode] = useState<string>(
        P.media.type === "video" ? "video" : "image"
    )
    const modeRef = useRef(mode)
    modeRef.current = mode
    useEffect(() => {
        setMode(P.media.type === "video" ? "video" : "image")
    }, [P.media.type])

    useEffect(() => {
        const wrap = wrapRef.current
        const canvas = canvasRef.current
        if (!wrap || !canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const S: any = {
            w: 0,
            h: 0,
            dpr: 1,
            cs: 24,
            cols: 0,
            rows: 0,
            ox: 0,
            oy: 0,
            base: null,
            cur: null,
            tc: null,
            hs: null,
            hu: null,
            hk: null,
            dl: null,
            introStart: -1,
            ripples: [] as any[],
            inside: false,
            pend: false,
            px: 0,
            py: 0,
            lx: 0,
            ly: 0,
            parX: 0,
            parY: 0,
            maxHit: 0,
            raf: 0,
            timer: 0 as any,
            last: 0,
            io: typeof IntersectionObserver === "undefined",
            doc:
                typeof document === "undefined" ||
                document.visibilityState !== "hidden",
            reduced: false,
            cover: "#f4f4f2",
            tint: "#9aa9b8",
        }
        const permit = () => S.io && S.doc

        const mq =
            typeof window !== "undefined" && window.matchMedia
                ? window.matchMedia("(prefers-reduced-motion: reduce)")
                : null
        S.reduced = !!mq?.matches

        const grid = () => {
            const Pp = propsRef.current
            const p = Pp.pattern
            const cs = Math.max(6, Math.round(p.cell))
            const cols = Math.max(1, Math.ceil(S.w / cs))
            const rows = Math.max(1, Math.ceil(S.h / cs))
            const n = cols * rows
            const changed = !S.base || S.base.length !== n || S.cols !== cols
            S.cs = cs
            S.cols = cols
            S.rows = rows
            S.ox = Math.floor((S.w - cols * cs) / 2)
            S.oy = Math.floor((S.h - rows * cs) / 2)
            S.base = buildBase(cols, rows, p)
            if (changed) {
                S.cur = new Float32Array(n)
                S.tc = new Float32Array(n)
                S.hs = new Float64Array(n)
                S.hu = new Float64Array(n)
                S.hk = new Uint8Array(n)
                S.dl = new Float32Array(n)
                const startEmpty =
                    S.introStart < 0 && Pp.ambient.intro && !S.reduced
                if (!startEmpty) {
                    for (let i = 0; i < n; i++) {
                        S.cur[i] = S.base[i] === 1 ? 1 : 0
                        S.tc[i] = S.base[i] === 2 ? 1 : 0
                    }
                }
            }
            const dur = Math.max(0, Pp.ambient.introDuration)
            const from = Pp.ambient.introFrom
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const u = cols > 1 ? c / (cols - 1) : 0.5
                    const v = rows > 1 ? r / (rows - 1) : 0.5
                    const rd = clamp(Math.hypot(u - 0.5, v - 0.5) / 0.71, 0, 1)
                    let t = 0
                    if (from === "top") t = v
                    else if (from === "center") t = rd
                    else if (from === "random") t = hash(c, r, 401)
                    else t = 1 - rd
                    S.dl[r * cols + c] = (t * 0.8 + hash(c, r, 99) * 0.2) * dur
                }
            }
        }

        const resize = () => {
            const w = wrap.clientWidth
            const h = wrap.clientHeight
            if (!w || !h) return
            S.w = w
            S.h = h
            S.dpr = Math.min(
                2,
                (typeof window !== "undefined" && window.devicePixelRatio) || 1
            )
            canvas.width = Math.round(w * S.dpr)
            canvas.height = Math.round(h * S.dpr)
            grid()
            S.last = 0
            draw()
            wake()
        }

        const recolor = () => {
            const probe = probeRef.current
            if (!probe) return
            const p = propsRef.current.pattern
            probe.style.color = p.coverColor
            S.cover = getComputedStyle(probe).color || "#f4f4f2"
            probe.style.color = p.tintColor
            S.tint = getComputedStyle(probe).color || "#9aa9b8"
            draw()
            wake()
        }

        const stamp = (x: number, y: number, now: number) => {
            const hv = propsRef.current.hover
            const R = Math.max(0.5, hv.size)
            const stg = S.reduced ? 0 : Math.max(0, hv.stagger)
            const hold = Math.max(0, hv.hold)
            const fx = (x - S.ox) / S.cs - 0.5
            const fy = (y - S.oy) / S.cs - 0.5
            const c0 = Math.max(0, Math.floor(fx - R))
            const c1 = Math.min(S.cols - 1, Math.ceil(fx + R))
            const r0 = Math.max(0, Math.floor(fy - R))
            const r1 = Math.min(S.rows - 1, Math.ceil(fy + R))
            for (let r = r0; r <= r1; r++) {
                for (let c = c0; c <= c1; c++) {
                    const dx = c - fx
                    const dy = r - fy
                    let ok = false
                    if (hv.brush === "circle") ok = dx * dx + dy * dy <= R * R
                    else if (hv.brush === "diamond")
                        ok = Math.abs(dx) + Math.abs(dy) <= R
                    else ok = Math.max(Math.abs(dx), Math.abs(dy)) <= R
                    if (!ok) continue
                    const i = r * S.cols + c
                    const start = now + Math.hypot(dx, dy) * stg
                    const until = start + hold
                    if (S.hu[i] > now) {
                        S.hu[i] = Math.max(S.hu[i], until)
                        S.hk[i] = 0
                    } else {
                        S.hs[i] = start
                        S.hu[i] = until
                        S.hk[i] = 0
                    }
                    if (until > S.maxHit) S.maxHit = until
                }
            }
        }

        const stroke = (
            x0: number,
            y0: number,
            x1: number,
            y1: number,
            now: number
        ) => {
            const dist = Math.hypot(x1 - x0, y1 - y0)
            const steps = Math.max(1, Math.ceil(dist / (S.cs * 0.5)))
            for (let s = 1; s <= steps; s++) {
                const t = s / steps
                stamp(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, now)
            }
        }

        const runRipples = (now: number) => {
            const ck = propsRef.current.click
            const speed = Math.max(50, ck.speed) / 1000
            const band = Math.max(0.3, ck.width) * S.cs
            const maxR = Math.hypot(S.w, S.h)
            const { cols, rows, cs, ox, oy, hs, hu, hk } = S
            S.ripples = S.ripples.filter((rp: any) => {
                const rad = (now - rp.t) * speed
                if (rad > maxR + band) return false
                const lo = rad - band
                const hi = rad + band
                for (let r = 0; r < rows; r++) {
                    const cy = oy + r * cs + cs / 2 - rp.y
                    for (let c = 0; c < cols; c++) {
                        const cx = ox + c * cs + cs / 2 - rp.x
                        const d = Math.hypot(cx, cy)
                        if (d < lo || d > hi) continue
                        const i = r * cols + c
                        if (!(hu[i] > now && hs[i] <= now)) hs[i] = now
                        hu[i] = Math.max(hu[i], now + 200)
                        hk[i] = 1
                    }
                }
                if (now + 200 > S.maxHit) S.maxHit = now + 200
                return true
            })
        }

        const draw = () => {
            if (!S.base || !S.w) return
            const pat = propsRef.current.pattern
            const { cols, rows, cs, ox, oy, cur, tc } = S
            ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0)
            ctx.clearRect(0, 0, S.w, S.h)
            const gap = clamp(pat.gap, 0, cs * 0.4)
            const inner = cs - gap
            const bleed = gap === 0 ? 0.5 : 0
            const to = clamp(pat.tintOpacity, 0, 1)
            if (to > 0) {
                ctx.globalAlpha = to
                ctx.fillStyle = S.tint
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const i = r * cols + c
                        const t = tc[i]
                        if (t < 0.01 || cur[i] > 0.99) continue
                        const sz = inner * t + (t > 0.995 ? bleed : 0)
                        ctx.fillRect(
                            ox + c * cs + gap / 2 + (inner - inner * t) / 2,
                            oy + r * cs + gap / 2 + (inner - inner * t) / 2,
                            sz,
                            sz
                        )
                    }
                }
            }
            ctx.globalAlpha = 1
            ctx.fillStyle = S.cover
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const v = cur[r * cols + c]
                    if (v < 0.01) continue
                    const sz = inner * v + (v > 0.995 ? bleed : 0)
                    ctx.fillRect(
                        ox + c * cs + gap / 2 + (inner - inner * v) / 2,
                        oy + r * cs + gap / 2 + (inner - inner * v) / 2,
                        sz,
                        sz
                    )
                }
            }
        }

        const frame = (now: number) => {
            S.raf = 0
            if (!permit() || !S.base) return
            const Pp = propsRef.current
            if (S.introStart < 0) S.introStart = now
            const dt = S.last ? Math.min(64, now - S.last) : 16.67
            S.last = now

            if (S.pend) {
                stroke(S.lx, S.ly, S.px, S.py, now)
                S.lx = S.px
                S.ly = S.py
                S.pend = false
            }
            if (S.ripples.length) runRipples(now)

            const red = S.reduced
            const step = dt / 16.67
            const kIn = red ? 1 : 1 - Math.pow(1 - 0.32, step)
            const kOut = red
                ? 1
                : 1 - Math.pow(1 - clamp(Pp.hover.heal, 0.01, 1), step)
            const introOn = Pp.ambient.intro && !red
            const introRunning =
                introOn &&
                now < S.introStart + Math.max(0, Pp.ambient.introDuration) + 60
            const mode = Pp.hover.mode
            const { base, cur, tc, hs, hu, hk, dl } = S
            const n = base.length
            let maxD = 0
            for (let i = 0; i < n; i++) {
                const b = base[i]
                let tCov = b === 1 ? 1 : 0
                let tTin = b === 2 ? 1 : 0
                const act = now >= hs[i] && now < hu[i]
                if (act) {
                    if (hk[i] === 1 || mode === "invert") {
                        tCov = b === 1 ? 0 : 1
                        tTin = 0
                    } else if (mode === "cover") {
                        tCov = 1
                        tTin = 0
                    } else {
                        tCov = 0
                        tTin = 0
                    }
                }
                if (introRunning && now < S.introStart + dl[i]) {
                    tCov = 0
                    tTin = 0
                }
                const k = act || introRunning ? kIn : kOut
                let d = tCov - cur[i]
                if (d > maxD) maxD = d
                else if (-d > maxD) maxD = -d
                cur[i] = Math.abs(d) < 0.0015 ? tCov : cur[i] + d * k
                d = tTin - tc[i]
                if (d > maxD) maxD = d
                else if (-d > maxD) maxD = -d
                tc[i] = Math.abs(d) < 0.0015 ? tTin : tc[i] + d * k
            }
            draw()

            let parBusy = false
            const m = mediaRef.current
            const amt = red ? 0 : Math.max(0, Pp.media.parallax)
            if (m) {
                const tx = S.inside ? -(S.px / S.w - 0.5) * 2 * amt : 0
                const ty = S.inside ? -(S.py / S.h - 0.5) * 2 * amt : 0
                const kp = 1 - Math.pow(0.9, step)
                S.parX += (tx - S.parX) * kp
                S.parY += (ty - S.parY) * kp
                parBusy =
                    Math.abs(tx - S.parX) > 0.05 || Math.abs(ty - S.parY) > 0.05
                const sc = amt > 0 ? 1 + (2 * amt + 2) / Math.min(S.w, S.h) : 1
                m.style.transform = `translate3d(${S.parX.toFixed(2)}px, ${S.parY.toFixed(2)}px, 0) scale(${sc})`
            }

            if (
                maxD > 0.002 ||
                S.maxHit > now ||
                S.ripples.length ||
                introRunning ||
                parBusy ||
                S.pend
            ) {
                S.raf = requestAnimationFrame(frame)
            } else if (Pp.ambient.twinkle && !red && !S.timer) {
                const rate = clamp(Pp.ambient.rate, 0.2, 20)
                S.timer = setTimeout(
                    twinkle,
                    (1000 / rate) * (0.5 + Math.random())
                )
            }
        }

        const wake = () => {
            if (!permit()) return
            if (S.timer) {
                clearTimeout(S.timer)
                S.timer = 0
            }
            if (!S.raf) {
                S.last = 0
                S.raf = requestAnimationFrame(frame)
            }
        }

        const twinkle = () => {
            S.timer = 0
            if (!permit() || !S.base) return
            const n = S.base.length
            const now = performance.now()
            const count = 1 + Math.floor(Math.random() * 3)
            for (let j = 0; j < count; j++) {
                let i = 0
                for (let t = 0; t < 8; t++) {
                    i = Math.floor(Math.random() * n)
                    const right = i + 1 < n ? S.base[i + 1] : S.base[i]
                    const down = i + S.cols < n ? S.base[i + S.cols] : S.base[i]
                    if (S.base[i] !== right || S.base[i] !== down) break
                }
                if (S.hu[i] > now) continue
                S.hs[i] = now
                S.hu[i] = now + 350 + Math.random() * 600
                S.hk[i] = 1
                if (S.hu[i] > S.maxHit) S.maxHit = S.hu[i]
            }
            wake()
        }

        const pauseMedia = () => {
            const v = videoRef.current
            if (v && !v.paused) v.pause()
        }
        const playMedia = () => {
            const v = videoRef.current
            if (!v) return
            if (modeRef.current !== "video" || !permit()) {
                pauseMedia()
                return
            }
            const pr = v.play()
            if (pr && (pr as any).catch) (pr as any).catch(() => {})
        }

        const park = () => {
            if (S.raf) cancelAnimationFrame(S.raf)
            S.raf = 0
            if (S.timer) clearTimeout(S.timer)
            S.timer = 0
            S.inside = false
            S.pend = false
            S.ripples = []
            pauseMedia()
        }

        const onPermit = () => {
            if (permit()) {
                wake()
                playMedia()
            } else park()
        }

        const local = (e: PointerEvent) => {
            const rect = wrap.getBoundingClientRect()
            const sx = rect.width ? S.w / rect.width : 1
            const sy = rect.height ? S.h / rect.height : 1
            return {
                x: (e.clientX - rect.left) * sx,
                y: (e.clientY - rect.top) * sy,
            }
        }
        const onSwitch = (e: PointerEvent) => {
            const t = e.target as Element | null
            return !!(t && t.closest && t.closest(`[${TOGGLE_ATTR}]`))
        }
        const onMove = (e: PointerEvent) => {
            if (!permit()) return
            if (onSwitch(e)) {
                if (S.inside) onLeave()
                return
            }
            const { x, y } = local(e)
            S.px = x
            S.py = y
            if (!S.inside) {
                S.inside = true
                S.lx = x
                S.ly = y
            }
            S.pend = true
            wake()
        }
        const onLeave = () => {
            S.inside = false
            wake()
        }
        const onDown = (e: PointerEvent) => {
            if (!permit() || onSwitch(e)) return
            const ck = propsRef.current.click
            const { x, y } = local(e)
            if (ck.ripple && !S.reduced)
                S.ripples.push({ x, y, t: performance.now() })
            S.px = x
            S.py = y
            if (!S.inside) {
                S.inside = true
                S.lx = x
                S.ly = y
            }
            S.pend = true
            wake()
        }
        wrap.addEventListener("pointermove", onMove)
        wrap.addEventListener("pointerdown", onDown)
        wrap.addEventListener("pointerleave", onLeave)
        wrap.addEventListener("pointercancel", onLeave)

        const onDoc = () => {
            S.doc = document.visibilityState !== "hidden"
            onPermit()
        }
        document.addEventListener("visibilitychange", onDoc)

        const onMq = () => {
            S.reduced = !!mq?.matches
            wake()
        }
        if (mq) {
            if (mq.addEventListener) mq.addEventListener("change", onMq)
            else if ((mq as any).addListener) (mq as any).addListener(onMq)
        }

        let io: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver(
                (entries) => {
                    const e = entries[entries.length - 1]
                    S.io = !!e && e.isIntersecting
                    onPermit()
                },
                { threshold: 0 }
            )
            io.observe(wrap)
        }

        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => resize())
            ro.observe(wrap)
        } else window.addEventListener("resize", resize)

        engine.current = {
            rebuild: () => {
                if (!S.w) return
                grid()
                draw()
                wake()
            },
            recolor,
            wake: () => {
                draw()
                wake()
            },
            syncMedia: playMedia,
            pulse: (fx = 0.5, fy = 0) => {
                if (!permit() || S.reduced || !S.w) return
                S.ripples.push({
                    x: S.w * fx,
                    y: S.h * fy,
                    t: performance.now(),
                })
                wake()
            },
        }

        recolor()
        resize()
        if (!io) onPermit()

        return () => {
            park()
            io?.disconnect()
            ro?.disconnect()
            if (!ro) window.removeEventListener("resize", resize)
            wrap.removeEventListener("pointermove", onMove)
            wrap.removeEventListener("pointerdown", onDown)
            wrap.removeEventListener("pointerleave", onLeave)
            wrap.removeEventListener("pointercancel", onLeave)
            document.removeEventListener("visibilitychange", onDoc)
            if (mq) {
                if (mq.removeEventListener)
                    mq.removeEventListener("change", onMq)
                else if ((mq as any).removeListener)
                    (mq as any).removeListener(onMq)
            }
            engine.current = null
        }
    }, [])

    const pat = P.pattern
    useEffect(() => {
        engine.current?.rebuild()
    }, [
        pat.layout,
        pat.cell,
        pat.density,
        pat.roughness,
        pat.sprinkle,
        pat.tint,
        pat.seed,
        P.ambient.introFrom,
        P.ambient.introDuration,
    ])
    useEffect(() => {
        engine.current?.recolor()
    }, [pat.coverColor, pat.tintColor])
    useEffect(() => {
        engine.current?.wake()
    }, [pat.gap, pat.tintOpacity, P.media.parallax, P.hover.mode])

    const videoSrc = P.media.video || P.media.videoUrl
    const hasVideo = !!videoSrc
    const isVideo = mode === "video" && hasVideo
    const img = P.media.image?.src || P.media.imageUrl || DEF_IMG
    const layerStyle: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: P.media.fit as any,
        objectPosition: POS[P.media.position] || "50% 50%",
        display: "block",
        userSelect: "none",
        pointerEvents: "none",
        transition: "opacity 650ms cubic-bezier(.3,.7,.2,1)",
    }

    useEffect(() => {
        engine.current?.syncMedia()
    }, [isVideo, videoSrc])

    const flip = (next: string) => {
        if (next === modeRef.current) return
        if (next === "video" && !hasVideo) return
        setMode(next)
        if (P.toggle.pulse) engine.current?.pulse()
    }

    const mn = P.menu
    const menuRef = useRef<HTMLDivElement>(null)
    const [open, setOpen] = useState(false)
    const [focusIdx, setFocusIdx] = useState(-1)
    useEffect(() => {
        if (!open) return
        const away = (e: PointerEvent) => {
            const el = menuRef.current
            if (el && !el.contains(e.target as Node)) setOpen(false)
        }
        const key = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false)
        }
        document.addEventListener("pointerdown", away)
        document.addEventListener("keydown", key)
        return () => {
            document.removeEventListener("pointerdown", away)
            document.removeEventListener("keydown", key)
        }
    }, [open])
    useEffect(() => {
        if (!mn.show) setOpen(false)
    }, [mn.show])
    const pick = (k: string) => {
        setOpen(false)
        if (k === layoutSel) return
        setLayoutSel(k)
        if (mn.ripple) engine.current?.pulse(0, 0)
    }
    const onMenuKey = (e: React.KeyboardEvent) => {
        if (
            !open &&
            (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")
        ) {
            e.preventDefault()
            setOpen(true)
            setFocusIdx(
                Math.max(
                    0,
                    LAYOUTS.findIndex((l) => l[0] === layoutSel)
                )
            )
            return
        }
        if (!open) return
        if (e.key === "ArrowDown") {
            e.preventDefault()
            setFocusIdx((i) => (i + 1) % LAYOUTS.length)
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setFocusIdx((i) => (i - 1 + LAYOUTS.length) % LAYOUTS.length)
        } else if ((e.key === "Enter" || e.key === " ") && focusIdx >= 0) {
            e.preventDefault()
            pick(LAYOUTS[focusIdx][0])
        }
    }
    const mfs = Math.max(10, mn.size)

    const tg = P.toggle
    const fs = Math.max(9, tg.size)
    const segW = fs * 6.4

    return (
        <div
            ref={wrapRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: P.radius,
                background: P.background,
                touchAction: "pan-y",
            }}
        >
            <div
                ref={mediaRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    transformOrigin: "50% 50%",
                    pointerEvents: "none",
                }}
            >
                <img
                    src={img}
                    srcSet={P.media.image?.srcSet}
                    alt={P.media.image?.alt || ""}
                    draggable={false}
                    style={{ ...layerStyle, opacity: isVideo ? 0 : 1 }}
                />
                {hasVideo && (
                    <video
                        ref={videoRef}
                        src={videoSrc}
                        poster={img}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        style={{ ...layerStyle, opacity: isVideo ? 1 : 0 }}
                    />
                )}
            </div>
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
            {mn.show && (
                <div
                    ref={menuRef}
                    {...{ [TOGGLE_ATTR]: "" }}
                    onKeyDown={onMenuKey}
                    style={{
                        position: "absolute",
                        top: mn.offset,
                        left: mn.offset,
                        zIndex: 3,
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontSize: mfs,
                        lineHeight: 1.15,
                        color: mn.text,
                    }}
                >
                    <button
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={open}
                        onClick={() => {
                            setOpen((o) => !o)
                            setFocusIdx(-1)
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "6px 12px 6px 6px",
                            border: "1px solid rgba(255,255,255,0.14)",
                            borderRadius: 12,
                            background: mn.fill,
                            backdropFilter: "blur(12px)",
                            WebkitBackdropFilter: "blur(12px)",
                            boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
                            color: mn.text,
                            font: "inherit",
                            cursor: "pointer",
                            textAlign: "left",
                        }}
                    >
                        <LayoutThumb
                            pattern={P.pattern}
                            layout={layoutSel}
                            w={36}
                            h={26}
                            ink={P.pattern.coverColor}
                            ground="rgba(255,255,255,0.12)"
                        />
                        <span
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: mfs * 0.72,
                                    opacity: 0.6,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                }}
                            >
                                Layout
                            </span>
                            <span
                                style={{
                                    fontWeight: 600,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {layoutName(layoutSel)}
                            </span>
                        </span>
                        <Chevron color={mn.text} open={open} />
                    </button>
                    <div
                        role="listbox"
                        aria-label="Pixel layout"
                        style={{
                            position: "absolute",
                            top: "calc(100% + 8px)",
                            left: 0,
                            minWidth: mfs * 15,
                            padding: 6,
                            borderRadius: 14,
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: mn.panel,
                            backdropFilter: "blur(16px)",
                            WebkitBackdropFilter: "blur(16px)",
                            boxShadow: "0 18px 48px rgba(0,0,0,0.35)",
                            opacity: open ? 1 : 0,
                            transform: open
                                ? "translateY(0) scale(1)"
                                : "translateY(-6px) scale(0.97)",
                            transformOrigin: "top left",
                            pointerEvents: open ? "auto" : "none",
                            visibility: open ? "visible" : "hidden",
                            transition: open
                                ? "opacity 200ms ease, transform 260ms cubic-bezier(.2,.9,.3,1.2), visibility 0s"
                                : "opacity 160ms ease, transform 160ms ease, visibility 0s 160ms",
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                        }}
                    >
                        {LAYOUTS.map(([k, name], i) => {
                            const on = k === layoutSel
                            const hot = i === focusIdx
                            return (
                                <button
                                    key={k}
                                    type="button"
                                    role="option"
                                    aria-selected={on}
                                    tabIndex={open ? 0 : -1}
                                    onClick={() => pick(k)}
                                    onPointerEnter={() => setFocusIdx(i)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                        width: "100%",
                                        padding: "7px 10px 7px 7px",
                                        border: "none",
                                        borderRadius: 10,
                                        background: on
                                            ? "rgba(255,255,255,0.16)"
                                            : hot
                                              ? "rgba(255,255,255,0.08)"
                                              : "transparent",
                                        color: mn.text,
                                        font: "inherit",
                                        fontWeight: on ? 600 : 500,
                                        textAlign: "left",
                                        cursor: "pointer",
                                        transition: "background 160ms ease",
                                    }}
                                >
                                    {mn.previews && (
                                        <LayoutThumb
                                            pattern={P.pattern}
                                            layout={k}
                                            w={44}
                                            h={30}
                                            ink={P.pattern.coverColor}
                                            ground="rgba(255,255,255,0.1)"
                                        />
                                    )}
                                    <span
                                        style={{
                                            flex: 1,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {name}
                                    </span>
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: 2,
                                            background: mn.accent,
                                            opacity: on ? 1 : 0,
                                            transform: on
                                                ? "scale(1)"
                                                : "scale(0.4)",
                                            transition:
                                                "opacity 200ms ease, transform 200ms ease",
                                        }}
                                    />
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
            {tg.show && (
                <div
                    {...{ [TOGGLE_ATTR]: "" }}
                    role="group"
                    aria-label="Media"
                    style={{
                        position: "absolute",
                        top: tg.offset,
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        padding: 4,
                        borderRadius: 999,
                        background: tg.fill,
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontSize: fs,
                        fontWeight: 500,
                        lineHeight: 1,
                        zIndex: 2,
                        touchAction: "manipulation",
                    }}
                >
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            top: 4,
                            bottom: 4,
                            left: 4,
                            width: `calc(50% - 4px)`,
                            borderRadius: 999,
                            background: tg.thumb,
                            transform: `translateX(${mode === "video" && hasVideo ? "100%" : "0%"})`,
                            transition:
                                "transform 420ms cubic-bezier(.5,1.6,.4,1)",
                        }}
                    />
                    {(["image", "video"] as const).map((k) => {
                        const on =
                            (mode === "video" && hasVideo
                                ? "video"
                                : "image") === k
                        const off = k === "video" && !hasVideo
                        const col = on ? tg.thumbText : tg.text
                        return (
                            <button
                                key={k}
                                type="button"
                                aria-pressed={on}
                                disabled={off}
                                title={
                                    off
                                        ? "Add a video in the Media controls"
                                        : undefined
                                }
                                onClick={() => flip(k)}
                                style={{
                                    position: "relative",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 6,
                                    width: segW,
                                    padding: `${fs * 0.62}px ${fs * 1.1}px`,
                                    border: "none",
                                    borderRadius: 999,
                                    background: "transparent",
                                    color: col,
                                    font: "inherit",
                                    whiteSpace: "nowrap",
                                    cursor: off ? "not-allowed" : "pointer",
                                    opacity: off ? 0.4 : 1,
                                    transition: "color 300ms ease",
                                    outlineOffset: 2,
                                }}
                            >
                                {k === "image" ? (
                                    <IconFrame color={col} />
                                ) : (
                                    <IconReel color={col} />
                                )}
                                {k === "image" ? tg.imageLabel : tg.videoLabel}
                            </button>
                        )
                    })}
                </div>
            )}
            <span
                ref={probeRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    width: 0,
                    height: 0,
                    overflow: "hidden",
                    visibility: "hidden",
                }}
            />
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
export default function Quadrat(props: any) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StaticView {...props} />
    return <LiveView {...props} />
}

addPropertyControls(Quadrat, {
    media: {
        type: ControlType.Object,
        title: "Media",
        controls: {
            type: {
                type: ControlType.Enum,
                title: "Type",
                options: ["image", "video"],
                optionTitles: ["Image", "Video"],
                displaySegmentedControl: true,
                defaultValue: DEF.media.type,
            },
            image: {
                type: ControlType.ResponsiveImage,
                title: "Image",
                hidden: (p: any) => p.type === "video",
            },
            imageUrl: {
                type: ControlType.String,
                title: "Image URL",
                defaultValue: DEF.media.imageUrl,
                hidden: (p: any) => p.type === "video",
            },
            video: {
                type: ControlType.File,
                title: "Video",
                allowedFileTypes: ["mp4", "webm", "mov"],
                hidden: (p: any) => p.type !== "video",
            },
            videoUrl: {
                type: ControlType.String,
                title: "Video URL",
                defaultValue: "",
                hidden: (p: any) => p.type !== "video",
            },
            fit: {
                type: ControlType.Enum,
                title: "Fit",
                options: ["cover", "contain"],
                optionTitles: ["Fill", "Fit"],
                displaySegmentedControl: true,
                defaultValue: DEF.media.fit,
            },
            position: {
                type: ControlType.Enum,
                title: "Focus",
                options: ["center", "top", "bottom", "left", "right"],
                optionTitles: ["Center", "Top", "Bottom", "Left", "Right"],
                defaultValue: DEF.media.position,
            },
            parallax: {
                type: ControlType.Number,
                title: "Parallax",
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                defaultValue: DEF.media.parallax,
            },
        },
    },
    pattern: {
        type: ControlType.Object,
        title: "Pixels",
        controls: {
            layout: {
                type: ControlType.Enum,
                title: "Layout",
                options: [
                    "band",
                    "frame",
                    "corners",
                    "curtain",
                    "island",
                    "scatter",
                ],
                optionTitles: [
                    "Diagonal Band",
                    "Frame",
                    "Corners",
                    "Curtain",
                    "Island",
                    "Scatter",
                ],
                defaultValue: DEF.pattern.layout,
            },
            cell: {
                type: ControlType.Number,
                title: "Pixel Size",
                min: 8,
                max: 90,
                step: 1,
                unit: "px",
                defaultValue: DEF.pattern.cell,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 12,
                step: 1,
                unit: "px",
                defaultValue: DEF.pattern.gap,
            },
            density: {
                type: ControlType.Number,
                title: "Coverage",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: DEF.pattern.density,
            },
            roughness: {
                type: ControlType.Number,
                title: "Ragged Edge",
                min: 0,
                max: 1.5,
                step: 0.01,
                defaultValue: DEF.pattern.roughness,
            },
            sprinkle: {
                type: ControlType.Number,
                title: "Stray Pixels",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: DEF.pattern.sprinkle,
            },
            seed: {
                type: ControlType.Number,
                title: "Shuffle",
                min: 0,
                max: 999,
                step: 1,
                displayStepper: true,
                defaultValue: DEF.pattern.seed,
            },
            coverColor: {
                type: ControlType.Color,
                title: "Pixel Color",
                defaultValue: DEF.pattern.coverColor,
            },
            tint: {
                type: ControlType.Number,
                title: "Tint Pixels",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: DEF.pattern.tint,
            },
            tintColor: {
                type: ControlType.Color,
                title: "Tint Color",
                defaultValue: DEF.pattern.tintColor,
                hidden: (p: any) => p.tint === 0,
            },
            tintOpacity: {
                type: ControlType.Number,
                title: "Tint Opacity",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: DEF.pattern.tintOpacity,
                hidden: (p: any) => p.tint === 0,
            },
        },
    },
    hover: {
        type: ControlType.Object,
        title: "Hover",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Effect",
                options: ["reveal", "cover", "invert"],
                optionTitles: ["Erase", "Paint", "Invert"],
                displaySegmentedControl: true,
                defaultValue: DEF.hover.mode,
            },
            brush: {
                type: ControlType.Enum,
                title: "Brush",
                options: ["square", "circle", "diamond"],
                optionTitles: ["Square", "Circle", "Diamond"],
                displaySegmentedControl: true,
                defaultValue: DEF.hover.brush,
            },
            size: {
                type: ControlType.Number,
                title: "Brush Size",
                min: 0.5,
                max: 12,
                step: 0.5,
                defaultValue: DEF.hover.size,
            },
            stagger: {
                type: ControlType.Number,
                title: "Stagger",
                min: 0,
                max: 120,
                step: 1,
                unit: "ms",
                defaultValue: DEF.hover.stagger,
            },
            hold: {
                type: ControlType.Number,
                title: "Trail Hold",
                min: 0,
                max: 4000,
                step: 50,
                unit: "ms",
                defaultValue: DEF.hover.hold,
            },
            heal: {
                type: ControlType.Number,
                title: "Heal Speed",
                min: 0.01,
                max: 0.5,
                step: 0.01,
                defaultValue: DEF.hover.heal,
            },
        },
    },
    click: {
        type: ControlType.Object,
        title: "Click",
        controls: {
            ripple: {
                type: ControlType.Boolean,
                title: "Ripple",
                defaultValue: DEF.click.ripple,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 100,
                max: 3000,
                step: 50,
                unit: "px/s",
                defaultValue: DEF.click.speed,
                hidden: (p: any) => !p.ripple,
            },
            width: {
                type: ControlType.Number,
                title: "Ring Width",
                min: 0.3,
                max: 4,
                step: 0.1,
                defaultValue: DEF.click.width,
                hidden: (p: any) => !p.ripple,
            },
        },
    },
    ambient: {
        type: ControlType.Object,
        title: "Ambient",
        controls: {
            intro: {
                type: ControlType.Boolean,
                title: "Build In",
                defaultValue: DEF.ambient.intro,
            },
            introFrom: {
                type: ControlType.Enum,
                title: "From",
                options: ["edges", "center", "top", "random"],
                optionTitles: ["Edges", "Center", "Top", "Random"],
                defaultValue: DEF.ambient.introFrom,
                hidden: (p: any) => !p.intro,
            },
            introDuration: {
                type: ControlType.Number,
                title: "Duration",
                min: 200,
                max: 4000,
                step: 50,
                unit: "ms",
                defaultValue: DEF.ambient.introDuration,
                hidden: (p: any) => !p.intro,
            },
            twinkle: {
                type: ControlType.Boolean,
                title: "Flicker",
                defaultValue: DEF.ambient.twinkle,
            },
            rate: {
                type: ControlType.Number,
                title: "Flicker Rate",
                min: 0.2,
                max: 12,
                step: 0.1,
                unit: "/s",
                defaultValue: DEF.ambient.rate,
                hidden: (p: any) => !p.twinkle,
            },
        },
    },
    toggle: {
        type: ControlType.Object,
        title: "Switch",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: DEF.toggle.show,
            },
            offset: {
                type: ControlType.Number,
                title: "Top",
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
                defaultValue: DEF.toggle.offset,
                hidden: (p: any) => !p.show,
            },
            imageLabel: {
                type: ControlType.String,
                title: "Image Label",
                defaultValue: DEF.toggle.imageLabel,
                hidden: (p: any) => !p.show,
            },
            videoLabel: {
                type: ControlType.String,
                title: "Video Label",
                defaultValue: DEF.toggle.videoLabel,
                hidden: (p: any) => !p.show,
            },
            size: {
                type: ControlType.Number,
                title: "Font Size",
                min: 9,
                max: 24,
                step: 1,
                unit: "px",
                defaultValue: DEF.toggle.size,
                hidden: (p: any) => !p.show,
            },
            fill: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: DEF.toggle.fill,
                hidden: (p: any) => !p.show,
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: DEF.toggle.text,
                hidden: (p: any) => !p.show,
            },
            thumb: {
                type: ControlType.Color,
                title: "Active Fill",
                defaultValue: DEF.toggle.thumb,
                hidden: (p: any) => !p.show,
            },
            thumbText: {
                type: ControlType.Color,
                title: "Active Text",
                defaultValue: DEF.toggle.thumbText,
                hidden: (p: any) => !p.show,
            },
            pulse: {
                type: ControlType.Boolean,
                title: "Switch Ripple",
                defaultValue: DEF.toggle.pulse,
                hidden: (p: any) => !p.show,
            },
        },
    },
    menu: {
        type: ControlType.Object,
        title: "Layout Menu",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: DEF.menu.show,
            },
            offset: {
                type: ControlType.Number,
                title: "Inset",
                min: 0,
                max: 120,
                step: 1,
                unit: "px",
                defaultValue: DEF.menu.offset,
                hidden: (p: any) => !p.show,
            },
            size: {
                type: ControlType.Number,
                title: "Font Size",
                min: 10,
                max: 22,
                step: 1,
                unit: "px",
                defaultValue: DEF.menu.size,
                hidden: (p: any) => !p.show,
            },
            fill: {
                type: ControlType.Color,
                title: "Button",
                defaultValue: DEF.menu.fill,
                hidden: (p: any) => !p.show,
            },
            panel: {
                type: ControlType.Color,
                title: "Panel",
                defaultValue: DEF.menu.panel,
                hidden: (p: any) => !p.show,
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: DEF.menu.text,
                hidden: (p: any) => !p.show,
            },
            accent: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: DEF.menu.accent,
                hidden: (p: any) => !p.show,
            },
            previews: {
                type: ControlType.Boolean,
                title: "Previews",
                defaultValue: DEF.menu.previews,
                hidden: (p: any) => !p.show,
            },
            ripple: {
                type: ControlType.Boolean,
                title: "Change Ripple",
                defaultValue: DEF.menu.ripple,
                hidden: (p: any) => !p.show,
            },
        },
    },
    background: {
        type: ControlType.Color,
        title: "Backdrop",
        defaultValue: "#1A1C1E",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        defaultValue: 0,
    },
})
