import * as React from "react"
import { useEffect, useRef } from "react"
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
 * Gravity Bubbles
 * A physics bubble chart. Bubble size = value. Bubbles gather in the center.
 * Push them with your cursor, drag and throw them, click one to focus it.
 * Static on the Framer canvas and in exports (see useIsStaticRenderer).
 */

type Datum = { label: string; value: number; color: string }

type FontValue = {
    fontFamily?: string
    fontWeight?: number | string
    fontSize?: number | string
}

type Props = {
    data: Datum[]
    variant: "glass" | "solid"
    prefix: string
    suffix: string
    background: string
    textColor: string
    font: FontValue
    showLabels: boolean
    showValues: boolean
    showHint: boolean
    glow: boolean
    gravity: number
    repel: number
    bounce: number
    sizeScale: number
    animate: boolean
    touchDrag: boolean
    cornerRadius: number
    padding: number
    style?: React.CSSProperties
}

const DEFAULT_DATA: Datum[] = [
    { label: "Organic", value: 78, color: "#7C5CFF" },
    { label: "Ads", value: 64, color: "#22D3EE" },
    { label: "Social", value: 56, color: "#FF5C8A" },
    { label: "Direct", value: 42, color: "#FFB84D" },
    { label: "Email", value: 31, color: "#4ADE80" },
    { label: "Referral", value: 24, color: "#60A5FA" },
]

type Item = {
    x: number
    y: number
    vx: number
    vy: number
    r: number
    appear: number
    av: number
    hover: number
    focus: number
    phase: number
}

type Layout = {
    data: Datum[]
    n: number
    pad: number
    cx: number
    cy: number
    fs: number
    base: number[]
    focusR: number
    sum: number
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 440
 */
export default function GravityBubbles(props: Props) {
    const { background, cornerRadius, touchDrag, style } = props
    const isStatic = useIsStaticRenderer()
    const wrapRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const live = useRef(props)
    live.current = props
    const renderStaticRef = useRef<(() => void) | null>(null)

    useEffect(() => {
        const wrap = wrapRef.current
        const canvas = canvasRef.current
        if (!wrap || !canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const interactive = !isStatic
        const reduced =
            !!window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches

        // ---- colour resolver ----
        // Lets the browser resolve any CSS colour, including Framer color
        // tokens (var(--token-...)), so canvas drawing matches the theme.
        const resolver = document.createElement("span")
        resolver.setAttribute("aria-hidden", "true")
        resolver.style.cssText =
            "position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none"
        wrap.appendChild(resolver)
        const cache = new Map<string, number[]>()
        let cacheStamp = 0
        const rgb = (c: string): number[] => {
            const now = performance.now()
            if (now - cacheStamp > 1000) {
                cache.clear()
                cacheStamp = now
            }
            const hit = cache.get(c)
            if (hit) return hit
            let out = [128, 128, 128]
            resolver.style.color = ""
            resolver.style.color = c
            const m = getComputedStyle(resolver).color.match(/[\d.]+/g)
            if (m && m.length >= 3)
                out = [Math.round(+m[0]), Math.round(+m[1]), Math.round(+m[2])]
            cache.set(c, out)
            return out
        }
        const rgba = (c: number[], a: number) =>
            `rgba(${c[0]},${c[1]},${c[2]},${clamp(a, 0, 1)})`
        const mix = (c: number[], t: number[], k: number) =>
            `rgb(${Math.round(c[0] + (t[0] - c[0]) * k)},${Math.round(
                c[1] + (t[1] - c[1]) * k
            )},${Math.round(c[2] + (t[2] - c[2]) * k)})`

        // ---- size ----
        let W = 640,
            H = 440,
            dpr = 1
        const resize = () => {
            dpr = Math.min(window.devicePixelRatio || 1, 2)
            // offsetWidth/Height ignore CSS transforms, so this stays correct
            // when the Framer canvas is zoomed.
            const r = wrap.getBoundingClientRect()
            W = Math.max(1, wrap.offsetWidth || r.width)
            H = Math.max(1, wrap.offsetHeight || r.height)
            canvas.width = Math.round(W * dpr)
            canvas.height = Math.round(H * dpr)
            canvas.style.width = W + "px"
            canvas.style.height = H + "px"
        }
        resize()
        const ro = new ResizeObserver(() => {
            resize()
            // Resizing a <canvas> wipes it, so the static frame must be redrawn.
            if (!interactive) {
                staticSig = ""
                renderStatic()
            }
        })
        ro.observe(wrap)

        let visible = !interactive
        let io: IntersectionObserver | null = null
        if (interactive) {
            io = new IntersectionObserver(
                ([e]) => (visible = e.isIntersecting),
                { threshold: 0.15 }
            )
            io.observe(wrap)
        }

        // ---- state ----
        const items: Item[] = []
        const ptr = { x: -999, y: -999, vx: 0, vy: 0, active: false, lt: 0 }
        const S = {
            focus: -1,
            drag: -1,
            gx: 0,
            gy: 0,
            moved: false,
            dx: 0,
            dy: 0,
            hint: 0,
        }
        let rEff: number[] = []
        let hoverIdx = -1
        let t = 0
        let startT = -1
        let cursor = ""

        const pos = (e: PointerEvent) => {
            const r = wrap.getBoundingClientRect()
            const sx = r.width / (wrap.offsetWidth || r.width || 1)
            const sy = r.height / (wrap.offsetHeight || r.height || 1)
            return {
                x: (e.clientX - r.left) / (sx || 1),
                y: (e.clientY - r.top) / (sy || 1),
            }
        }
        // smallest bubble under a point
        const hit = (x: number, y: number) => {
            let best = -1,
                br = Infinity
            for (let i = 0; i < items.length; i++) {
                const d = Math.hypot(items[i].x - x, items[i].y - y)
                const r = rEff[i] || 0
                if (d <= r + 3 && r < br) {
                    br = r
                    best = i
                }
            }
            return best
        }

        const onMove = (e: PointerEvent) => {
            const p = pos(e)
            const now = performance.now()
            if (ptr.active && now > ptr.lt) {
                const k = 1000 / (now - ptr.lt)
                ptr.vx = ptr.vx * 0.5 + (p.x - ptr.x) * k * 0.5
                ptr.vy = ptr.vy * 0.5 + (p.y - ptr.y) * k * 0.5
            }
            ptr.x = p.x
            ptr.y = p.y
            ptr.lt = now
            ptr.active = true
            if (S.drag >= 0 && Math.hypot(p.x - S.dx, p.y - S.dy) > 5)
                S.moved = true
        }
        const onDown = (e: PointerEvent) => {
            if (e.pointerType === "mouse" && e.button !== 0) return
            onMove(e)
            S.hint = 1
            const i = hit(ptr.x, ptr.y)
            S.moved = false
            S.dx = ptr.x
            S.dy = ptr.y
            if (i >= 0) {
                S.drag = i
                S.gx = ptr.x - items[i].x
                S.gy = ptr.y - items[i].y
                try {
                    wrap.setPointerCapture(e.pointerId)
                } catch (er) {
                    /* ignore */
                }
            } else {
                S.drag = -1
            }
        }
        const release = (e: PointerEvent) => {
            try {
                wrap.releasePointerCapture(e.pointerId)
            } catch (er) {
                /* ignore */
            }
        }
        const onUp = (e: PointerEvent) => {
            if (S.drag >= 0) {
                if (!S.moved) S.focus = S.focus === S.drag ? -1 : S.drag
            } else if (!S.moved) {
                S.focus = -1
            }
            S.drag = -1
            if (e.pointerType === "touch") {
                ptr.active = false
                ptr.vx = ptr.vy = 0
            }
            release(e)
        }
        // browser took over (e.g. the page started scrolling): just let go
        const onCancel = (e: PointerEvent) => {
            S.drag = -1
            ptr.active = false
            ptr.vx = ptr.vy = 0
            release(e)
        }
        const onLeave = () => {
            if (S.drag < 0) {
                ptr.active = false
                ptr.vx = ptr.vy = 0
            }
        }
        if (interactive) {
            wrap.addEventListener("pointermove", onMove)
            wrap.addEventListener("pointerdown", onDown)
            wrap.addEventListener("pointerup", onUp)
            wrap.addEventListener("pointercancel", onCancel)
            wrap.addEventListener("pointerleave", onLeave)
        }

        // ---- font helpers (Framer Font control) ----
        const fontInfo = (P: Props) => {
            const f = P.font || {}
            const size = parseFloat(String(f.fontSize)) || 16
            const family =
                f.fontFamily || '"Inter", "Helvetica Neue", sans-serif'
            const weight = f.fontWeight || 600
            return { size, family, weight }
        }

        // ---- layout ----
        const layout = (P: Props): Layout => {
            const data = P.data && P.data.length ? P.data : DEFAULT_DATA
            const n = data.length
            const pad = P.padding
            // bubble AREA is proportional to value
            const sum = data.reduce((a, d) => a + Math.max(d.value, 0), 0) || 1
            const area = Math.max(1, (W - pad * 2) * (H - pad * 2))
            const k = Math.sqrt((0.36 * area) / (Math.PI * sum)) * P.sizeScale
            const maxR = Math.min(W, H) * 0.32
            return {
                data,
                n,
                pad,
                cx: W / 2,
                cy: H / 2,
                fs: fontInfo(P).size,
                base: data.map((d) =>
                    clamp(k * Math.sqrt(Math.max(d.value, 0)), 8, maxR)
                ),
                focusR: Math.min(W, H) * 0.27,
                sum,
            }
        }

        const sync = (L: Layout) => {
            while (items.length < L.n) {
                const a = items.length * 2.4 // golden-ish spread, no randomness
                items.push({
                    x: L.cx + Math.cos(a) * 8,
                    y: L.cy + Math.sin(a) * 8,
                    vx: Math.cos(a) * 260,
                    vy: Math.sin(a) * 260,
                    r: 10,
                    appear: 0,
                    av: 0,
                    hover: 0,
                    focus: 0,
                    phase: items.length * 1.7,
                })
            }
            items.length = L.n
            if (S.focus >= L.n) S.focus = -1
            if (S.drag >= L.n) S.drag = -1
        }

        // ---- physics ----
        const simulate = (dt: number, P: Props, L: Layout) => {
            const { n, pad, cx, cy, base, focusR } = L
            t += dt
            if (startT < 0) startT = t

            hoverIdx =
                interactive && ptr.active && S.drag < 0 ? hit(ptr.x, ptr.y) : -1
            if (
                interactive &&
                ptr.active &&
                Math.abs(ptr.vx) + Math.abs(ptr.vy) > 400
            )
                S.hint = Math.min(1, S.hint + dt)

            for (let i = 0; i < n; i++) {
                const it = items[i]
                if (!P.animate || reduced || !interactive) {
                    it.appear = 1
                    it.av = 0
                } else if (t - startT > i * 0.07) {
                    it.av += (120 * (1 - it.appear) - 11 * it.av) * dt
                    it.appear += it.av * dt
                    if (it.appear < 0) {
                        it.appear = 0
                        it.av = 0
                    }
                }
                const hv = hoverIdx === i || S.drag === i ? 1 : 0
                it.hover += (hv - it.hover) * (1 - Math.exp(-dt * 12))
                it.focus +=
                    ((S.focus === i ? 1 : 0) - it.focus) *
                    (1 - Math.exp(-dt * 7))
                let tr = base[i] * (1 + it.hover * 0.08)
                if (S.focus >= 0)
                    tr =
                        S.focus === i
                            ? Math.max(base[i] * 1.15, focusR)
                            : base[i] * 0.7
                it.r += (tr - it.r) * (1 - Math.exp(-dt * 8))
            }
            rEff = items.map((it) =>
                Math.max(0.01, it.r * clamp(it.appear, 0, 1.2))
            )

            const g = P.gravity * 3
            const SUB = 2
            const h = dt / SUB
            const calm = reduced || !interactive
            for (let s = 0; s < SUB; s++) {
                // keep the whole cluster centred: pull its centre of mass to the middle
                let mx = 0,
                    my = 0,
                    mw = 0
                for (let i = 0; i < n; i++) {
                    const w = rEff[i] * rEff[i]
                    mx += items[i].x * w
                    my += items[i].y * w
                    mw += w
                }
                const offX = mw > 0 ? cx - mx / mw : 0
                const offY = mw > 0 ? cy - my / mw : 0

                for (let i = 0; i < n; i++) {
                    const it = items[i]
                    if (S.drag === i) {
                        const tx = ptr.x - S.gx,
                            ty = ptr.y - S.gy
                        it.vx = clamp((tx - it.x) * 18, -1800, 1800)
                        it.vy = clamp((ty - it.y) * 18, -1800, 1800)
                    } else {
                        let ax = 0,
                            ay = 0
                        if (S.focus >= 0) {
                            if (i === S.focus) {
                                ax = (cx - it.x) * 30
                                ay = (cy - it.y) * 30
                            } else {
                                const j = i < S.focus ? i : i - 1
                                const m = Math.max(1, n - 1)
                                const a =
                                    (j / m) * Math.PI * 2 +
                                    t * 0.12 -
                                    Math.PI / 2
                                const Rx = Math.max(10, W / 2 - pad - 8 - it.r)
                                const Ry = Math.max(10, H / 2 - pad - 8 - it.r)
                                ax = (cx + Math.cos(a) * Rx - it.x) * 6
                                ay = (cy + Math.sin(a) * Ry - it.y) * 6
                            }
                        } else {
                            ax = (cx - it.x) * g + offX * g
                            ay = (cy - it.y) * g + offY * g
                        }
                        if (!calm) {
                            ax += Math.sin(t * 0.7 + it.phase) * 5
                            ay += Math.cos(t * 0.6 + it.phase * 1.3) * 5
                        }
                        // cursor pushes bubbles away and drags them along
                        if (
                            interactive &&
                            ptr.active &&
                            S.drag < 0 &&
                            !reduced
                        ) {
                            const dx = it.x - ptr.x,
                                dy = it.y - ptr.y
                            const dd = Math.hypot(dx, dy) || 0.01
                            const lim = 120 + rEff[i]
                            if (dd < lim) {
                                const f = Math.pow(1 - dd / lim, 2)
                                ax +=
                                    (dx / dd) * f * P.repel * 1500 +
                                    ptr.vx * f * 1.2
                                ay +=
                                    (dy / dd) * f * P.repel * 1500 +
                                    ptr.vy * f * 1.2
                            }
                        }
                        it.vx += ax * h
                        it.vy += ay * h
                        const damp = Math.exp(-h * (S.focus === i ? 6 : 2.6))
                        it.vx *= damp
                        it.vy *= damp
                    }
                    it.x += it.vx * h
                    it.y += it.vy * h
                }

                // collisions
                for (let iter = 0; iter < 3; iter++) {
                    for (let i = 0; i < n; i++) {
                        for (let j = i + 1; j < n; j++) {
                            const a = items[i],
                                b = items[j]
                            const dx = b.x - a.x,
                                dy = b.y - a.y
                            const d = Math.hypot(dx, dy) || 0.001
                            const min = rEff[i] + rEff[j] + 3
                            if (d >= min) continue
                            const nx = dx / d,
                                ny = dy / d
                            const ov = min - d
                            const ma =
                                S.focus === i || S.drag === i
                                    ? 1e5
                                    : rEff[i] * rEff[i]
                            const mb =
                                S.focus === j || S.drag === j
                                    ? 1e5
                                    : rEff[j] * rEff[j]
                            const tot = ma + mb
                            a.x -= nx * ov * (mb / tot)
                            a.y -= ny * ov * (mb / tot)
                            b.x += nx * ov * (ma / tot)
                            b.y += ny * ov * (ma / tot)
                            if (iter === 0) {
                                const rel =
                                    (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
                                if (rel < 0) {
                                    const e = P.bounce
                                    const imp =
                                        (-(1 + e) * rel) / (1 / ma + 1 / mb)
                                    a.vx -= (imp / ma) * nx
                                    a.vy -= (imp / ma) * ny
                                    b.vx += (imp / mb) * nx
                                    b.vy += (imp / mb) * ny
                                }
                            }
                        }
                    }
                }
                // walls
                for (let i = 0; i < n; i++) {
                    const it = items[i],
                        r = rEff[i]
                    const x0 = pad + r,
                        x1 = W - pad - r,
                        y0 = pad + r,
                        y1 = H - pad - r
                    if (x1 > x0) {
                        if (it.x < x0) {
                            it.x = x0
                            if (it.vx < 0) it.vx *= -0.5
                        }
                        if (it.x > x1) {
                            it.x = x1
                            if (it.vx > 0) it.vx *= -0.5
                        }
                    } else it.x = cx
                    if (y1 > y0) {
                        if (it.y < y0) {
                            it.y = y0
                            if (it.vy < 0) it.vy *= -0.5
                        }
                        if (it.y > y1) {
                            it.y = y1
                            if (it.vy > 0) it.vy *= -0.5
                        }
                    } else it.y = cy
                }
            }
        }

        // ---- draw ----
        const draw = (P: Props, L: Layout) => {
            const { data, n, pad, cx, fs, sum } = L
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.clearRect(0, 0, W, H)
            const text = rgb(P.textColor)
            const bg = rgb(P.background)
            const fi = fontInfo(P)
            const fam = fi.family
            const total = sum
            let hoverAny = 0
            for (const it of items) hoverAny = Math.max(hoverAny, it.hover)

            const order = items
                .map((_, i) => i)
                .sort(
                    (a, b) =>
                        items[a].focus +
                        items[a].hover * 0.5 -
                        (items[b].focus + items[b].hover * 0.5)
                )
            const pills: Array<() => void> = []

            for (const i of order) {
                if (i >= n) continue
                const it = items[i],
                    d = data[i]
                const c = rgb(d.color || "#7C5CFF")
                const r = rEff[i]
                const x = it.x,
                    y = it.y
                const alpha =
                    S.focus >= 0
                        ? S.focus === i
                            ? 1
                            : 0.55 + 0.45 * it.hover
                        : 1 - 0.55 * hoverAny * (1 - it.hover)
                const solid = P.variant === "solid"

                ctx.save()
                ctx.globalAlpha = alpha * clamp(it.appear, 0, 1)

                // body
                if (solid) {
                    const g1 = ctx.createRadialGradient(
                        x - r * 0.35,
                        y - r * 0.4,
                        r * 0.05,
                        x,
                        y,
                        r
                    )
                    g1.addColorStop(0, mix(c, [255, 255, 255], 0.55))
                    g1.addColorStop(0.4, mix(c, [255, 255, 255], 0))
                    g1.addColorStop(1, mix(c, [0, 0, 0], 0.5))
                    if (P.glow) {
                        ctx.shadowColor = rgba(c, 0.55 + 0.35 * it.hover)
                        ctx.shadowBlur = 16 + it.hover * 26 + it.focus * 20
                    }
                    ctx.beginPath()
                    ctx.arc(x, y, r, 0, Math.PI * 2)
                    ctx.fillStyle = g1
                    ctx.fill()
                    ctx.shadowBlur = 0
                } else {
                    const g1 = ctx.createRadialGradient(x, y, r * 0.15, x, y, r)
                    g1.addColorStop(0, rgba(c, 0.08))
                    g1.addColorStop(0.7, rgba(c, 0.22))
                    g1.addColorStop(1, rgba(c, 0.8))
                    ctx.beginPath()
                    ctx.arc(x, y, r, 0, Math.PI * 2)
                    ctx.fillStyle = g1
                    ctx.fill()
                    if (P.glow) {
                        ctx.shadowColor = rgba(c, 0.9)
                        ctx.shadowBlur = 14 + it.hover * 26 + it.focus * 20
                    }
                    ctx.lineWidth = 1.5 + it.hover
                    ctx.strokeStyle = rgba(c, 0.55 + 0.4 * it.hover)
                    ctx.stroke()
                    ctx.shadowBlur = 0
                }

                // gloss
                ctx.beginPath()
                ctx.ellipse(
                    x - r * 0.3,
                    y - r * 0.42,
                    r * 0.34,
                    r * 0.2,
                    -0.6,
                    0,
                    Math.PI * 2
                )
                ctx.fillStyle = solid
                    ? "rgba(255,255,255,0.28)"
                    : "rgba(255,255,255,0.2)"
                ctx.fill()

                // focus / hover ring
                if (it.hover > 0.02 || it.focus > 0.02) {
                    const rr = r + 7 + Math.sin(t * 4) * 1.5
                    ctx.beginPath()
                    ctx.arc(x, y, rr, 0, Math.PI * 2)
                    ctx.lineWidth = 1.5
                    ctx.strokeStyle = rgba(
                        c,
                        0.55 * Math.max(it.hover, it.focus)
                    )
                    ctx.stroke()
                }

                // text
                const lum = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255
                const onBubble = solid
                    ? lum > 0.72
                        ? "rgba(20,20,26,0.92)"
                        : "rgba(255,255,255,0.96)"
                    : rgba(text, 0.95)
                const focused = it.focus > 0.5
                const showInside = r >= 30 || focused
                const pctStr =
                    Math.round((Math.max(d.value, 0) / total) * 100) +
                    "% of total"
                const valStr =
                    P.prefix +
                    (
                        Math.max(d.value, 0) * clamp(it.appear, 0, 1)
                    ).toLocaleString(undefined, {
                        maximumFractionDigits: Math.abs(d.value) < 100 ? 1 : 0,
                    }) +
                    P.suffix
                ctx.textAlign = "center"
                ctx.textBaseline = "alphabetic"
                if (showInside && (P.showLabels || P.showValues)) {
                    const lSize = focused
                        ? clamp(r * 0.13, fs, fs * 1.5)
                        : clamp(r * 0.26, 10, fs * 1.1)
                    const vSize = focused
                        ? clamp(r * 0.34, fs * 1.4, fs * 3.2)
                        : clamp(r * 0.36, 12, fs * 2.1)
                    const showVal = P.showValues && (r >= 36 || focused)
                    ctx.fillStyle = onBubble
                    if (showVal) {
                        const yl = y - vSize * 0.15
                        if (P.showLabels) {
                            ctx.font = `500 ${lSize}px ${fam}`
                            ctx.globalAlpha *= 0.85
                            ctx.fillText(d.label, x, yl)
                            ctx.globalAlpha /= 0.85
                        }
                        ctx.font = `${fi.weight} ${vSize}px ${fam}`
                        ctx.fillText(valStr, x, y + vSize * 0.85)
                        if (focused) {
                            ctx.font = `500 ${fs * 0.8}px ${fam}`
                            ctx.globalAlpha *= 0.7 * it.focus
                            ctx.fillText(pctStr, x, y + vSize * 0.85 + fs * 1.5)
                        }
                    } else if (P.showLabels) {
                        ctx.font = `${fi.weight} ${lSize}px ${fam}`
                        ctx.fillText(d.label, x, y + lSize * 0.35)
                    }
                } else if (it.hover > 0.05) {
                    // small bubble: info pill drawn on top of everything
                    const hv = it.hover
                    pills.push(() => {
                        const txt = d.label + "  " + valStr
                        ctx.font = `${fi.weight} ${fs * 0.85}px ${fam}`
                        const tw = ctx.measureText(txt).width
                        const pw = tw + 20,
                            ph = fs * 0.85 + 14
                        const px = clamp(x, pw / 2 + 4, W - pw / 2 - 4)
                        const py = Math.max(y - r - 16, ph / 2 + 4)
                        ctx.save()
                        ctx.globalAlpha = hv
                        ctx.fillStyle = rgba(text, 1)
                        ctx.beginPath()
                        const rx = px - pw / 2,
                            ry = py - ph / 2,
                            rad = ph / 2
                        ctx.moveTo(rx + rad, ry)
                        ctx.arcTo(rx + pw, ry, rx + pw, ry + ph, rad)
                        ctx.arcTo(rx + pw, ry + ph, rx, ry + ph, rad)
                        ctx.arcTo(rx, ry + ph, rx, ry, rad)
                        ctx.arcTo(rx, ry, rx + pw, ry, rad)
                        ctx.fill()
                        ctx.fillStyle = rgba(bg, 1)
                        ctx.textAlign = "center"
                        ctx.fillText(txt, px, py + fs * 0.3)
                        ctx.restore()
                    })
                }
                ctx.restore()
            }
            pills.forEach((fn) => fn())

            // hint (interactive only)
            if (interactive && P.showHint) {
                const a = 0.42 * (1 - clamp(S.hint, 0, 1))
                if (a > 0.01) {
                    ctx.save()
                    ctx.globalAlpha = a
                    ctx.fillStyle = rgba(text, 1)
                    ctx.font = `500 ${Math.max(11, fs * 0.75)}px ${fam}`
                    ctx.textAlign = "center"
                    ctx.fillText(
                        "Push, drag or click a bubble",
                        cx,
                        H - Math.max(10, pad * 0.5)
                    )
                    ctx.restore()
                }
            }
        }

        // ---- main loop ----
        let raf = 0
        let last = performance.now()
        let staticSig = ""
        let alive = true

        // Static renderer (Framer Canvas / Export): settle once, draw once,
        // stay still. Runs immediately, on resize, and whenever props change.
        const renderStatic = () => {
            if (!alive) return
            const P = live.current
            const sig = JSON.stringify([
                P.data,
                P.variant,
                P.prefix,
                P.suffix,
                P.background,
                P.textColor,
                P.font,
                P.showLabels,
                P.showValues,
                P.glow,
                P.sizeScale,
                P.gravity,
                P.padding,
                W,
                H,
            ])
            if (sig === staticSig) return
            staticSig = sig
            items.length = 0
            S.focus = -1
            S.drag = -1
            t = 0
            startT = -1
            const L = layout(P)
            sync(L)
            for (let k = 0; k < 240; k++) simulate(1 / 60, P, L)
            draw(P, L)
        }

        const frame = (now: number) => {
            raf = requestAnimationFrame(frame)
            const P = live.current

            if (!visible) {
                last = now
                return
            }
            const dt = Math.min(0.033, (now - last) / 1000)
            last = now
            ptr.vx *= Math.exp(-dt * 6)
            ptr.vy *= Math.exp(-dt * 6)

            const L = layout(P)
            sync(L)
            simulate(dt, P, L)
            const cur = S.drag >= 0 ? "grabbing" : hoverIdx >= 0 ? "grab" : ""
            if (cur !== cursor) {
                cursor = cur
                wrap.style.cursor = cur
            }
            draw(P, L)
        }
        if (interactive) {
            raf = requestAnimationFrame(frame)
        } else {
            renderStaticRef.current = renderStatic
            renderStatic()
            // redraw once fonts have loaded so text uses the chosen font
            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(() => {
                    staticSig = ""
                    renderStatic()
                })
            }
        }

        return () => {
            alive = false
            renderStaticRef.current = null
            cancelAnimationFrame(raf)
            ro.disconnect()
            if (io) io.disconnect()
            if (interactive) {
                wrap.removeEventListener("pointermove", onMove)
                wrap.removeEventListener("pointerdown", onDown)
                wrap.removeEventListener("pointerup", onUp)
                wrap.removeEventListener("pointercancel", onCancel)
                wrap.removeEventListener("pointerleave", onLeave)
            }
            wrap.style.cursor = ""
            if (resolver.parentNode) resolver.parentNode.removeChild(resolver)
        }
    }, [isStatic])

    // On the Framer canvas: redraw whenever properties change (cheap, it
    // skips work if nothing relevant changed).
    useEffect(() => {
        if (renderStaticRef.current) renderStaticRef.current()
    })

    const summary = (
        props.data && props.data.length ? props.data : DEFAULT_DATA
    )
        .map((d) => `${d.label}: ${d.value}`)
        .join(", ")

    return (
        <div
            ref={wrapRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                background,
                borderRadius: cornerRadius,
                overflow: "hidden",
                // pan-y keeps page scrolling working on phones unless the
                // user turns on "Touch Drag".
                touchAction: touchDrag ? "none" : "pan-y",
                userSelect: "none",
            }}
        >
            <canvas
                ref={canvasRef}
                role="img"
                aria-label={`Bubble chart. ${summary}`}
                style={{ display: "block", position: "absolute", inset: 0 }}
            />
        </div>
    )
}

GravityBubbles.defaultProps = {
    data: DEFAULT_DATA,
    variant: "glass",
    prefix: "",
    suffix: "k",
    background: "#0B0C10",
    textColor: "#F2F3F7",
    font: { fontFamily: "Inter", fontWeight: 600, fontSize: "16px" },
    showLabels: true,
    showValues: true,
    showHint: true,
    glow: true,
    gravity: 1.2,
    repel: 1,
    bounce: 0.6,
    sizeScale: 1,
    animate: true,
    touchDrag: false,
    cornerRadius: 24,
    padding: 20,
}

addPropertyControls(GravityBubbles, {
    data: {
        type: ControlType.Array,
        title: "Data",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Label",
                },
                value: {
                    type: ControlType.Number,
                    title: "Value",
                    defaultValue: 50,
                    min: 0,
                },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#7C5CFF",
                },
            },
        },
        defaultValue: DEFAULT_DATA,
    },
    variant: {
        type: ControlType.Enum,
        title: "Style",
        options: ["glass", "solid"],
        optionTitles: ["Glass", "Solid"],
        defaultValue: "glass",
        displaySegmentedControl: true,
    },
    prefix: {
        type: ControlType.String,
        title: "Prefix",
        defaultValue: "",
        placeholder: "$",
        description: "Text shown before each number, for example $",
    },
    suffix: {
        type: ControlType.String,
        title: "Suffix",
        defaultValue: "k",
        placeholder: "%",
        description: "Text shown after each number, for example %",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0B0C10",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#F2F3F7",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        defaultFontType: "sans-serif",
        defaultFontSize: "16px",
        displayFontSize: true,
        defaultValue: {
            fontSize: "16px",
            variant: "Semibold",
        },
    },
    showLabels: {
        type: ControlType.Boolean,
        title: "Labels",
        defaultValue: true,
    },
    showValues: {
        type: ControlType.Boolean,
        title: "Values",
        defaultValue: true,
    },
    showHint: {
        type: ControlType.Boolean,
        title: "Hint Text",
        defaultValue: true,
    },
    glow: { type: ControlType.Boolean, title: "Glow", defaultValue: true },
    sizeScale: {
        type: ControlType.Number,
        title: "Bubble Size",
        min: 0.5,
        max: 1.5,
        step: 0.05,
        defaultValue: 1,
    },
    gravity: {
        type: ControlType.Number,
        title: "Center Pull",
        min: 0.2,
        max: 3,
        step: 0.1,
        defaultValue: 1.2,
        description: "Higher = bubbles stay tighter in the center",
    },
    repel: {
        type: ControlType.Number,
        title: "Cursor Push",
        min: 0,
        max: 3,
        step: 0.1,
        defaultValue: 1,
    },
    bounce: {
        type: ControlType.Number,
        title: "Bounce",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.6,
    },
    animate: {
        type: ControlType.Boolean,
        title: "Intro",
        defaultValue: true,
    },
    touchDrag: {
        type: ControlType.Boolean,
        title: "Touch Drag",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "On: dragging bubbles works on phones, but the page can't scroll over the chart.",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 60,
        step: 1,
        defaultValue: 24,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 64,
        step: 1,
        defaultValue: 20,
    },
})
