// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef } from "react"

/**
 * Rotating Particle Globe — a geodesic wireframe sphere wrapped in a glowing
 * particle field, with vertex sparkle glints, drifting starfield, warm heat
 * hotspots and editable location markers. All motion is a pure function of a
 * 12s looping clock, so scrubbing/export stay exact. Drop onto any frame; it
 * fills and re-centers itself and can be dragged to rotate (parallax on hover).
 */

const DUR = 12
const TAU = Math.PI * 2

// ---------------------------------------------------------------------------
// deterministic hash noise (unchanged from the source sketch)
// ---------------------------------------------------------------------------

function hash(x: number, y: number, z: number) {
    const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453
    return h - Math.floor(h)
}
function smooth(a: number) {
    return a * a * (3 - 2 * a)
}
function noise3(x: number, y: number, z: number) {
    const xi = Math.floor(x),
        yi = Math.floor(y),
        zi = Math.floor(z)
    const xf = x - xi,
        yf = y - yi,
        zf = z - zi
    let v = 0
    for (let dx = 0; dx < 2; dx++)
        for (let dy = 0; dy < 2; dy++)
            for (let dz = 0; dz < 2; dz++) {
                const w =
                    (dx ? smooth(xf) : 1 - smooth(xf)) *
                    (dy ? smooth(yf) : 1 - smooth(yf)) *
                    (dz ? smooth(zf) : 1 - smooth(zf))
                v += w * hash(xi + dx, yi + dy, zi + dz)
            }
    return v
}
function fbm(x: number, y: number, z: number) {
    return (
        noise3(x, y, z) * 0.55 +
        noise3(x * 2.1, y * 2.1, z * 2.1) * 0.3 +
        noise3(x * 4.3, y * 4.3, z * 4.3) * 0.15
    )
}

// ---------------------------------------------------------------------------
// static geometry — computed once at module load (deterministic, cheap)
// ---------------------------------------------------------------------------

interface Dot {
    x: number
    y: number
    z: number
    s: number
    tw: number
    d: number
}

// All candidate dots are generated once with their local density value `d`;
// the Density control filters them at draw time (higher density => lower
// threshold => more dots), so the field can thin/thicken without regenerating.
const DOT_FLOOR = 0.3
const ALL_DOTS: Dot[] = (() => {
    const out: Dot[] = []
    const latStep = 2.0
    for (let lat = -84; lat <= 84; lat += latStep) {
        const latR = (lat * Math.PI) / 180
        const circ = Math.cos(latR)
        const n = Math.max(6, Math.round(190 * circ))
        for (let i = 0; i < n; i++) {
            const lon = (i / n) * TAU + lat * 0.13
            const x = Math.cos(latR) * Math.cos(lon)
            const y = Math.sin(latR)
            const z = Math.cos(latR) * Math.sin(lon)
            const d = fbm(x * 2.2 + 7.3, y * 2.2 + 3.1, z * 2.2 + 11.8)
            if (d > DOT_FLOOR)
                out.push({
                    x,
                    y,
                    z,
                    s: 0.35 + hash(i, lat, 1) * 0.75,
                    tw: hash(i, lat, 2) * TAU,
                    d,
                })
        }
    }
    return out
})()

function ll(lat: number, lon: number) {
    const a = (lat * Math.PI) / 180,
        o = (lon * Math.PI) / 180
    return {
        x: Math.cos(a) * Math.cos(o),
        y: Math.sin(a),
        z: Math.cos(a) * Math.sin(o),
    }
}

// Geodesic wireframe: icosahedron subdivided twice, reduced to unique edges.
const ICO = (() => {
    const t = (1 + Math.sqrt(5)) / 2
    const V: number[][] = [
        [-1, t, 0],
        [1, t, 0],
        [-1, -t, 0],
        [1, -t, 0],
        [0, -1, t],
        [0, 1, t],
        [0, -1, -t],
        [0, 1, -t],
        [t, 0, -1],
        [t, 0, 1],
        [-t, 0, -1],
        [-t, 0, 1],
    ].map((v) => {
        const l = Math.hypot(v[0], v[1], v[2])
        return [v[0] / l, v[1] / l, v[2] / l]
    })
    let F: number[][] = [
        [0, 11, 5],
        [0, 5, 1],
        [0, 1, 7],
        [0, 7, 10],
        [0, 10, 11],
        [1, 5, 9],
        [5, 11, 4],
        [11, 10, 2],
        [10, 7, 6],
        [7, 1, 8],
        [3, 9, 4],
        [3, 4, 2],
        [3, 2, 6],
        [3, 6, 8],
        [3, 8, 9],
        [4, 9, 5],
        [2, 4, 11],
        [6, 2, 10],
        [8, 6, 7],
        [9, 8, 1],
    ]
    function subdivide(faces: number[][]) {
        const cache: Record<string, number> = {}
        const mid = (a: number, b: number) => {
            const k = a < b ? a + "_" + b : b + "_" + a
            if (cache[k] !== undefined) return cache[k]
            const m = [
                (V[a][0] + V[b][0]) / 2,
                (V[a][1] + V[b][1]) / 2,
                (V[a][2] + V[b][2]) / 2,
            ]
            const l = Math.hypot(m[0], m[1], m[2])
            V.push([m[0] / l, m[1] / l, m[2] / l])
            return (cache[k] = V.length - 1)
        }
        const out: number[][] = []
        for (const [a, b, c] of faces) {
            const ab = mid(a, b),
                bc = mid(b, c),
                ca = mid(c, a)
            out.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca])
        }
        return out
    }
    const F2 = subdivide(subdivide(F))
    const eset = new Set<string>(),
        E: number[][] = []
    for (const [a, b, c] of F2) {
        for (const [p, q] of [
            [a, b],
            [b, c],
            [c, a],
        ]) {
            const k = p < q ? p + "_" + q : q + "_" + p
            if (!eset.has(k)) {
                eset.add(k)
                E.push([p, q])
            }
        }
    }
    return { V, E }
})()

const STARS = Array.from({ length: 160 }, (_, i) => ({
    x: hash(i, 1, 0),
    y: hash(i, 2, 0),
    s: hash(i, 3, 0),
    p: hash(i, 4, 0) * TAU,
}))

// ---------------------------------------------------------------------------
// color helpers — resolve any Framer color into an "r, g, b" triple
// ---------------------------------------------------------------------------

// A color is [r, g, b] or [r, g, b, a]; a missing 4th slot means fully opaque.
type Col = number[]
let probeEl: HTMLElement | null = null
function toRGB(color: string, fallback: Col): Col {
    if (typeof document === "undefined") return fallback
    if (!probeEl) {
        probeEl = document.createElement("span")
        probeEl.style.display = "none"
        document.body.appendChild(probeEl)
    }
    probeEl.style.color = ""
    probeEl.style.color = color
    // Keep the alpha channel too — the browser normalizes to rgb(a) or the
    // "rgb(r g b / a)" form, so accept comma OR slash before the alpha.
    const m = getComputedStyle(probeEl).color.match(
        /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/i
    )
    if (m)
        return [
            Math.round(+m[1]),
            Math.round(+m[2]),
            Math.round(+m[3]),
            m[4] !== undefined ? +m[4] : 1,
        ]
    return fallback
}
const mix = (a: Col, b: Col, p: number): Col => [
    Math.round(a[0] + (b[0] - a[0]) * p),
    Math.round(a[1] + (b[1] - a[1]) * p),
    Math.round(a[2] + (b[2] - a[2]) * p),
]
// The color's own alpha (if any) multiplies the per-element alpha, so a control
// set to e.g. 40% makes that layer proportionally more transparent everywhere.
const rgba = (c: Col, a: number) =>
    `rgba(${c[0]},${c[1]},${c[2]},${(a * (c.length > 3 ? c[3] : 1)).toFixed(3)})`

// ---------------------------------------------------------------------------
// render config + mutable interaction state
// ---------------------------------------------------------------------------

interface Marker {
    name: string
    sub: string
    p: { x: number; y: number; z: number }
    accent: boolean
}

interface RenderConfig {
    speed: number
    autoPlay: boolean
    threshold: number
    dotScale: number
    showWireframe: boolean
    showStars: boolean
    showHotspots: boolean
    showMarkers: boolean
    enableDrag: boolean
    enableParallax: boolean
    bgCenter: Col
    bgEdge: Col
    dotColor: Col
    dotCore: Col
    wireColor: Col
    markerColor: Col
    accentColor: Col
    hotColor: Col
    markers: Marker[]
}

const HOTSPOTS = [
    { c: ll(18, 40), r: 0.55, ph: 0.0 },
    { c: ll(-14, -60), r: 0.45, ph: 2.4 },
]

function rot(p: { x: number; y: number; z: number }, ay: number, ax: number) {
    const cy = Math.cos(ay),
        sy = Math.sin(ay)
    const x = p.x * cy + p.z * sy,
        z = -p.x * sy + p.z * cy,
        y = p.y
    const cx = Math.cos(ax),
        sx = Math.sin(ax)
    return { x, y: y * cx - z * sx, z: y * sx + z * cx }
}

// ---------------------------------------------------------------------------
// the draw pass — a pure function of (time, config, interaction, size)
// ---------------------------------------------------------------------------

function draw(
    ctx: CanvasRenderingContext2D,
    time: number,
    cfg: RenderConfig,
    itx: { mouse: any; drag: any },
    W: number,
    H: number,
    DPR: number
) {
    const { mouse, drag } = itx

    // smooth mouse follow + parallax tilt
    if (cfg.enableParallax && mouse.tx > -1e5) {
        if (mouse.x < -1e5) {
            mouse.x = mouse.tx
            mouse.y = mouse.ty
        }
        mouse.x += (mouse.tx - mouse.x) * 0.15
        mouse.y += (mouse.ty - mouse.y) * 0.15
    } else {
        mouse.x = -1e6
        mouse.y = -1e6
    }
    const tTiltY =
        cfg.enableParallax && mouse.tx > -1e5 ? (mouse.tx / W - 0.5) * 0.22 : 0
    const tTiltX =
        cfg.enableParallax && mouse.ty > -1e5 ? (mouse.ty / H - 0.5) * 0.18 : 0
    mouse.tiltY += (tTiltY - mouse.tiltY) * 0.06
    mouse.tiltX += (tTiltX - mouse.tiltX) * 0.06

    // momentum after a drag release
    if (!drag.on) {
        drag.offY += drag.velY
        drag.offX = Math.max(-1.0, Math.min(1.0, drag.offX + drag.velX))
        drag.velY *= 0.955
        drag.velX *= 0.955
        if (Math.abs(drag.velY) < 1e-5) drag.velY = 0
        if (Math.abs(drag.velX) < 1e-5) drag.velX = 0
    }

    const ay = (time / DUR) * TAU + mouse.tiltY + drag.offY
    const ax = -0.25 + mouse.tiltX + drag.offX
    for (const hs of HOTSPOTS)
        (hs as any).pulse =
            0.72 + 0.28 * Math.sin((time / DUR) * TAU * 3 + hs.ph)

    function hotHeat(p: { x: number; y: number; z: number }) {
        if (!cfg.showHotspots) return 0
        let h = 0
        for (const hs of HOTSPOTS) {
            const dot = p.x * hs.c.x + p.y * hs.c.y + p.z * hs.c.z
            const ang = Math.acos(Math.max(-1, Math.min(1, dot)))
            if (ang < hs.r)
                h = Math.max(
                    h,
                    Math.pow(1 - ang / hs.r, 1.6) * (hs as any).pulse
                )
        }
        return h
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalCompositeOperation = "source-over"
    // Clear first so a translucent background composites over the page instead
    // of accumulating trails from the previous frame.
    ctx.clearRect(0, 0, W, H)
    const g = ctx.createRadialGradient(
        W / 2,
        H / 2,
        0,
        W / 2,
        H / 2,
        Math.max(W, H) * 0.7
    )
    g.addColorStop(0, rgba(cfg.bgCenter, 1))
    g.addColorStop(1, rgba(cfg.bgEdge, 1))
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)

    // starfield
    if (cfg.showStars) {
        for (const s of STARS) {
            const a = 0.12 + 0.14 * Math.sin((time / DUR) * TAU * 2 + s.p)
            ctx.fillStyle = `rgba(200,210,255,${a.toFixed(3)})`
            const r = (0.5 + s.s) * DPR
            ctx.fillRect(s.x * W, s.y * H, r, r)
        }
    }

    const R = Math.min(W, H) * 0.4
    const cx = W / 2,
        cy = H / 2
    const persp = (z: number) => 1 / (1 - z * 0.28)

    ctx.globalCompositeOperation = "lighter"

    // pass 1: back dots (dim)
    for (const d of ALL_DOTS) {
        if (d.d <= cfg.threshold) continue
        const p = rot(d, ay, ax)
        if (p.z >= 0) continue
        const k = persp(p.z)
        const b = 0.7 + (d.d - cfg.threshold) * 2.2
        const heat = hotHeat(d)
        const a = b * 0.1
        ctx.fillStyle =
            heat > 0.15
                ? rgba(
                      mix(
                          cfg.hotColor,
                          [255, 255, 255],
                          Math.max(0, 0.35 - heat * 0.3)
                      ),
                      +(a * (0.6 + heat)).toFixed(3)
                  )
                : rgba(cfg.dotColor, +a.toFixed(3))
        ctx.beginPath()
        ctx.arc(
            cx + p.x * R * k,
            cy - p.y * R * k,
            d.s * cfg.dotScale * DPR * 0.8 * k,
            0,
            7
        )
        ctx.fill()
    }

    // pass 2: wireframe + vertex sparkles
    if (cfg.showWireframe) {
        const WR = R * 1.06
        const pv = ICO.V.map((v) =>
            rot({ x: v[0], y: v[1], z: v[2] }, ay * 0.32, ax)
        )
        for (const [a, b] of ICO.E) {
            const p1 = pv[a],
                p2 = pv[b]
            const zm = (p1.z + p2.z) / 2
            const alpha = 0.05 + Math.max(0, zm) * 0.55
            const k1 = persp(p1.z),
                k2 = persp(p2.z)
            ctx.strokeStyle = rgba(cfg.wireColor, +alpha.toFixed(3))
            ctx.lineWidth = (zm > 0 ? 1.1 : 0.6) * DPR
            ctx.beginPath()
            ctx.moveTo(cx + p1.x * WR * k1, cy - p1.y * WR * k1)
            ctx.lineTo(cx + p2.x * WR * k2, cy - p2.y * WR * k2)
            ctx.stroke()
        }
        for (let i = 0; i < pv.length; i++) {
            const p = pv[i]
            if (p.z < 0.1 || hash(i, 9, 3) > 0.22) continue
            const k = persp(p.z)
            const X = cx + p.x * WR * k,
                Y = cy - p.y * WR * k
            const flick = 0.5 + 0.5 * Math.sin((time / DUR) * TAU * 4 + i * 1.7)
            const s = (2.5 + 5 * flick * p.z) * DPR
            const gg = ctx.createRadialGradient(X, Y, 0, X, Y, s * 3)
            gg.addColorStop(0, `rgba(255,255,255,${(0.5 * p.z).toFixed(3)})`)
            gg.addColorStop(1, "rgba(255,255,255,0)")
            ctx.fillStyle = gg
            ctx.fillRect(X - s * 3, Y - s * 3, s * 6, s * 6)
            ctx.strokeStyle = `rgba(255,255,255,${(0.35 * p.z * flick).toFixed(3)})`
            ctx.lineWidth = DPR * 0.8
            ctx.beginPath()
            ctx.moveTo(X - s * 2.2, Y)
            ctx.lineTo(X + s * 2.2, Y)
            ctx.moveTo(X, Y - s * 2.2)
            ctx.lineTo(X, Y + s * 2.2)
            ctx.stroke()
        }
    }

    // pass 2.5: location markers
    if (cfg.showMarkers) {
        ctx.globalCompositeOperation = "source-over"
        for (const m of cfg.markers) {
            const p = rot(m.p, ay, ax)
            if (p.z < 0.12) continue
            const k = persp(p.z)
            const X = cx + p.x * R * k,
                Y = cy - p.y * R * k
            const vis = Math.min(1, (p.z - 0.12) / 0.3)
            let mh = 0
            if (mouse.x > -1e5) {
                const dist = Math.hypot(X - mouse.x, Y - mouse.y)
                if (dist < 60 * DPR) mh = 1 - dist / (60 * DPR)
            }
            const pulse =
                0.5 + 0.5 * Math.sin((time / DUR) * TAU * 4 + m.p.x * 9)
            const col = m.accent ? cfg.accentColor : cfg.markerColor
            ctx.strokeStyle = rgba(
                col,
                +(vis * (0.35 + 0.35 * pulse + mh * 0.3)).toFixed(3)
            )
            ctx.lineWidth = DPR
            ctx.beginPath()
            ctx.arc(X, Y, (5 + 3 * pulse + mh * 4) * DPR, 0, 7)
            ctx.stroke()
            ctx.fillStyle = rgba(col, +(vis * (0.85 + mh * 0.15)).toFixed(3))
            ctx.beginPath()
            ctx.arc(X, Y, 2.2 * DPR, 0, 7)
            ctx.fill()
            const lx = X + 16 * DPR,
                ly = Y - 16 * DPR
            ctx.strokeStyle = `rgba(255,255,255,${(vis * 0.4).toFixed(3)})`
            ctx.lineWidth = DPR * 0.8
            ctx.beginPath()
            ctx.moveTo(X + 4 * DPR, Y - 4 * DPR)
            ctx.lineTo(lx, ly)
            ctx.lineTo(lx + 10 * DPR, ly)
            ctx.stroke()
            ctx.textBaseline = "bottom"
            ctx.textAlign = "left"
            ctx.font = `600 ${11 * DPR}px Helvetica, Arial, sans-serif`
            ctx.fillStyle = `rgba(240,246,255,${(vis * (0.8 + mh * 0.2)).toFixed(3)})`
            ctx.fillText(m.name, lx + 14 * DPR, ly + 4 * DPR)
            if (m.sub) {
                ctx.font = `400 ${9 * DPR}px Helvetica, Arial, sans-serif`
                ctx.fillStyle = `rgba(170,185,220,${(vis * 0.7).toFixed(3)})`
                ctx.fillText(m.sub, lx + 14 * DPR, ly + 15 * DPR)
            }
        }
        ctx.globalCompositeOperation = "lighter"
    }

    // pass 3: front dots (bright, glowing)
    for (const d of ALL_DOTS) {
        if (d.d <= cfg.threshold) continue
        const p = rot(d, ay, ax)
        if (p.z < 0) continue
        const k = persp(p.z)
        const X = cx + p.x * R * k,
            Y = cy - p.y * R * k
        const b = 0.7 + (d.d - cfg.threshold) * 2.2
        const tw = 0.75 + 0.25 * Math.sin((time / DUR) * TAU * 6 + d.tw)
        const heat = hotHeat(d)
        let hov = 0
        if (mouse.x > -1e5) {
            const dist = Math.hypot(X - mouse.x, Y - mouse.y),
                rad = R * 0.22
            if (dist < rad) hov = Math.pow(1 - dist / rad, 1.8)
        }
        const a = Math.min(1, b * (0.35 + 0.65 * p.z) * tw * (1 + hov * 1.6))
        const sz =
            d.s * cfg.dotScale * DPR * (0.9 + p.z * 0.6) * k * (1 + hov * 1.4)
        if (heat > 0.1) {
            const hb = Math.min(1, a * (0.9 + heat * 1.5))
            const gs = sz * (3 + heat * 4)
            // Bloom: near-white hot center -> saturated hotspot color -> transparent.
            const inner = mix(
                cfg.hotColor,
                [255, 255, 255],
                Math.min(1, 0.6 + heat * 0.35)
            )
            const midC = mix(cfg.hotColor, [255, 255, 255], 0.12)
            const gg = ctx.createRadialGradient(X, Y, 0, X, Y, gs)
            gg.addColorStop(0, rgba(inner, +hb.toFixed(3)))
            gg.addColorStop(0.3, rgba(midC, +(hb * 0.8).toFixed(3)))
            gg.addColorStop(1, rgba(cfg.hotColor, 0))
            ctx.fillStyle = gg
            ctx.fillRect(X - gs, Y - gs, gs * 2, gs * 2)
            ctx.fillStyle = rgba(
                mix(cfg.hotColor, [255, 255, 255], 0.9),
                +hb.toFixed(3)
            )
            ctx.beginPath()
            ctx.arc(X, Y, sz * (1 + heat * 0.8), 0, 7)
            ctx.fill()
        } else {
            ctx.fillStyle = rgba(cfg.dotColor, +(a * 0.35).toFixed(3))
            ctx.beginPath()
            ctx.arc(X, Y, sz * 2.2, 0, 7)
            ctx.fill()
            ctx.fillStyle = rgba(cfg.dotCore, +a.toFixed(3))
            ctx.beginPath()
            ctx.arc(X, Y, sz, 0, 7)
            ctx.fill()
            if (hov > 0.35) {
                const hs2 = sz * 3.5
                const gg = ctx.createRadialGradient(X, Y, 0, X, Y, hs2)
                gg.addColorStop(
                    0,
                    rgba(cfg.accentColor, +(hov * 0.5).toFixed(3))
                )
                gg.addColorStop(1, rgba(cfg.accentColor, 0))
                ctx.fillStyle = gg
                ctx.fillRect(X - hs2, Y - hs2, hs2 * 2, hs2 * 2)
            }
        }
    }

    // soft cursor lens glow
    if (mouse.x > -1e5) {
        const lr = R * 0.22
        const gg = ctx.createRadialGradient(
            mouse.x,
            mouse.y,
            0,
            mouse.x,
            mouse.y,
            lr
        )
        gg.addColorStop(0, rgba(cfg.accentColor, 0.05))
        gg.addColorStop(1, rgba(cfg.accentColor, 0))
        ctx.fillStyle = gg
        ctx.fillRect(mouse.x - lr, mouse.y - lr, lr * 2, lr * 2)
    }
}

// ---------------------------------------------------------------------------
// component
// ---------------------------------------------------------------------------

interface MarkerInput {
    name: string
    latitude: number
    longitude: number
    accent: boolean
}

interface ParticleGlobeProps {
    style?: React.CSSProperties
    motion: {
        speed: number
        autoPlay: boolean
        density: number
        particleSize: number
    }
    layers: {
        showWireframe: boolean
        showStars: boolean
        showHotspots: boolean
        showMarkers: boolean
    }
    interaction: {
        enableDrag: boolean
        enableParallax: boolean
    }
    appearance: {
        bgCenter: string
        bgEdge: string
        dotColor: string
        wireColor: string
        markerColor: string
        accentColor: string
        hotColor: string
        cornerRadius: string
    }
    markers: MarkerInput[]
}

const DEFAULT_MARKERS: MarkerInput[] = [
    { name: "SAN FRANCISCO", latitude: 37.7, longitude: -122.4, accent: false },
    { name: "LONDON", latitude: 51.5, longitude: -0.1, accent: false },
    { name: "TOKYO", latitude: 35.7, longitude: 139.7, accent: false },
    { name: "SÃO PAULO", latitude: -23.5, longitude: -46.6, accent: false },
    { name: "NAIROBI", latitude: -1.3, longitude: 36.8, accent: false },
]

function fmtLL(lat: number, lon: number) {
    return `${Math.abs(lat).toFixed(1)}°${lat < 0 ? "S" : "N"} ${Math.abs(lon).toFixed(1)}°${lon < 0 ? "W" : "E"}`
}

export default function ParticleGlobe(props: Partial<ParticleGlobeProps>) {
    const {
        style,
        motion = {} as any,
        layers = {} as any,
        interaction = {} as any,
        appearance = {} as any,
        markers = DEFAULT_MARKERS,
    } = props

    const {
        speed = 1,
        autoPlay = true,
        density = 55,
        particleSize = 1,
    } = motion
    const {
        showWireframe = true,
        showStars = true,
        showHotspots = true,
        showMarkers = true,
    } = layers
    const { enableDrag = true, enableParallax = true } = interaction
    const {
        bgCenter = "#0a0a10",
        bgEdge = "#040406",
        dotColor = "#b9c8ff",
        wireColor = "#d7e1ff",
        markerColor = "#ffffff",
        accentColor = "#8ce1ff",
        hotColor = "#ff5a2d",
        cornerRadius = "0px",
    } = appearance

    const isStatic = useIsStaticRenderer()
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const wrapRef = useRef<HTMLDivElement>(null)
    const cfgRef = useRef<RenderConfig | null>(null)
    const itxRef = useRef({
        mouse: { x: -1e6, y: -1e6, tx: -1e6, ty: -1e6, tiltX: 0, tiltY: 0 },
        drag: {
            on: false,
            lastX: 0,
            lastY: 0,
            offY: 0,
            offX: 0,
            velY: 0,
            velX: 0,
        },
    })
    const timeRef = useRef(0)

    // Rebuild the render config on every React render so control edits take
    // effect immediately without tearing down the animation loop.
    const dotRGB = toRGB(dotColor, [185, 200, 255])
    cfgRef.current = {
        speed,
        autoPlay,
        // Density 20-100 => threshold 0.62 (sparse) down to 0.30 (dense).
        threshold:
            0.62 - ((Math.max(20, Math.min(100, density)) - 20) / 80) * 0.32,
        dotScale: particleSize,
        showWireframe,
        showStars,
        showHotspots,
        showMarkers,
        enableDrag,
        enableParallax,
        bgCenter: toRGB(bgCenter, [10, 10, 16]),
        bgEdge: toRGB(bgEdge, [4, 4, 6]),
        dotColor: dotRGB,
        dotCore: mix(dotRGB, [255, 255, 255], 0.6),
        wireColor: toRGB(wireColor, [215, 225, 255]),
        markerColor: toRGB(markerColor, [255, 255, 255]),
        accentColor: toRGB(accentColor, [140, 220, 255]),
        hotColor: toRGB(hotColor, [255, 90, 45]),
        markers: (markers && markers.length ? markers : DEFAULT_MARKERS).map(
            (m) => ({
                name: (m.name || "").toUpperCase(),
                sub: fmtLL(m.latitude ?? 0, m.longitude ?? 0),
                p: ll(m.latitude ?? 0, m.longitude ?? 0),
                accent: !!m.accent,
            })
        ),
    }

    // Interaction listeners (drag to rotate, mouse parallax).
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || isStatic) return
        const DPRof = () => Math.min(window.devicePixelRatio || 1, 2)
        const itx = itxRef.current

        const onMove = (e: PointerEvent) => {
            if (!cfgRef.current?.enableParallax) return
            const rect = canvas.getBoundingClientRect()
            const DPR = DPRof()
            itx.mouse.tx = (e.clientX - rect.left) * DPR
            itx.mouse.ty = (e.clientY - rect.top) * DPR
        }
        const onLeave = () => {
            itx.mouse.tx = -1e6
            itx.mouse.ty = -1e6
        }
        const onDown = (e: PointerEvent) => {
            if (!cfgRef.current?.enableDrag) return
            itx.drag.on = true
            itx.drag.lastX = e.clientX
            itx.drag.lastY = e.clientY
            itx.drag.velY = 0
            itx.drag.velX = 0
            canvas.setPointerCapture(e.pointerId)
        }
        const onDrag = (e: PointerEvent) => {
            const d = itx.drag
            if (!d.on) return
            const dx = e.clientX - d.lastX,
                dy = e.clientY - d.lastY
            d.lastX = e.clientX
            d.lastY = e.clientY
            const s =
                1 / (Math.min(canvas.clientWidth, canvas.clientHeight) * 0.4)
            d.offY += dx * s * 2.2
            d.offX = Math.max(-1.0, Math.min(1.0, d.offX - dy * s * 2.2))
            d.velY = dx * s * 2.2
            d.velX = -dy * s * 2.2
        }
        const endDrag = () => {
            itx.drag.on = false
        }

        canvas.addEventListener("pointermove", onMove)
        canvas.addEventListener("pointerleave", onLeave)
        canvas.addEventListener("pointerdown", onDown)
        canvas.addEventListener("pointermove", onDrag)
        canvas.addEventListener("pointerup", endDrag)
        canvas.addEventListener("pointercancel", endDrag)
        return () => {
            canvas.removeEventListener("pointermove", onMove)
            canvas.removeEventListener("pointerleave", onLeave)
            canvas.removeEventListener("pointerdown", onDown)
            canvas.removeEventListener("pointermove", onDrag)
            canvas.removeEventListener("pointerup", endDrag)
            canvas.removeEventListener("pointercancel", endDrag)
        }
    }, [isStatic])

    // Render: keep the canvas backing store sized to its own box (the box can be
    // 0 at mount on the Framer canvas) and paint. When Framer flags this as a
    // static render we draw a single frame and repaint on resize instead of
    // running the loop, so export/thumbnails stay cheap but the artboard still
    // shows the globe rather than a blank frame.
    useEffect(() => {
        const canvas = canvasRef.current,
            wrap = wrapRef.current
        if (!canvas || !wrap) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const syncSize = () => {
            const DPR = Math.min(window.devicePixelRatio || 1, 2)
            const w = Math.max(1, Math.round(wrap.clientWidth * DPR))
            const h = Math.max(1, Math.round(wrap.clientHeight * DPR))
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w
                canvas.height = h
            }
            return DPR
        }

        if (isStatic) {
            let raf = 0
            const paint = () => {
                const DPR = syncSize()
                draw(
                    ctx,
                    timeRef.current,
                    cfgRef.current!,
                    itxRef.current,
                    canvas.width,
                    canvas.height,
                    DPR
                )
            }
            raf = requestAnimationFrame(paint)
            const ro = new ResizeObserver(paint)
            ro.observe(wrap)
            return () => {
                cancelAnimationFrame(raf)
                ro.disconnect()
            }
        }

        // Animated: only run the loop while the component is actually on screen
        // (an IntersectionObserver starts/stops it) so a component scrolled out
        // of the viewport stops burning CPU/GPU on rotation + physics.
        let raf = 0
        let running = false
        let last: number | null = null
        const frame = (now: number) => {
            const cfg = cfgRef.current!
            const DPR = syncSize()
            if (last == null) last = now
            if (cfg.autoPlay)
                timeRef.current =
                    (timeRef.current + ((now - last) / 1000) * cfg.speed) % DUR
            last = now
            draw(
                ctx,
                timeRef.current,
                cfg,
                itxRef.current,
                canvas.width,
                canvas.height,
                DPR
            )
            raf = requestAnimationFrame(frame)
        }
        const start = () => {
            if (running) return
            running = true
            last = null // avoid a time jump after being paused
            raf = requestAnimationFrame(frame)
        }
        const stop = () => {
            if (!running) return
            running = false
            cancelAnimationFrame(raf)
            // release drag momentum so it doesn't lurch on resume
            itxRef.current.drag.velX = 0
            itxRef.current.drag.velY = 0
        }

        // Paint a single frame up front so the component is never blank in the
        // gap before the observer first reports visibility; the *continuous*
        // loop stays gated on visibility below.
        const seed = requestAnimationFrame(() => {
            if (running) return
            const DPR = syncSize()
            draw(
                ctx,
                timeRef.current,
                cfgRef.current!,
                itxRef.current,
                canvas.width,
                canvas.height,
                DPR
            )
        })

        let io: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver((entries) => {
                if (entries.some((e) => e.isIntersecting)) start()
                else stop()
            })
            io.observe(wrap)
        } else {
            start() // no IO support: fall back to always-on
        }

        return () => {
            cancelAnimationFrame(seed)
            stop()
            io?.disconnect()
        }
    }, [isStatic])

    // In a static context (the Framer canvas) there's no animation loop reading
    // the config each frame, so a color/marker/layer edit would re-render the
    // component without ever repainting the canvas. This effect has no
    // dependency array — it runs after every render — and repaints from the
    // latest config whenever static, so canvas edits update like preview/live.
    useEffect(() => {
        if (!isStatic) return
        const canvas = canvasRef.current,
            wrap = wrapRef.current
        if (!canvas || !wrap) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const raf = requestAnimationFrame(() => {
            const DPR = Math.min(window.devicePixelRatio || 1, 2)
            const w = Math.max(1, Math.round(wrap.clientWidth * DPR))
            const h = Math.max(1, Math.round(wrap.clientHeight * DPR))
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w
                canvas.height = h
            }
            draw(
                ctx,
                timeRef.current,
                cfgRef.current!,
                itxRef.current,
                canvas.width,
                canvas.height,
                DPR
            )
        })
        return () => cancelAnimationFrame(raf)
    })

    return (
        <div
            ref={wrapRef}
            style={{
                position: "relative",
                overflow: "hidden",
                background: bgEdge,
                borderRadius: cornerRadius,
                width: "100%",
                height: "100%",
                minWidth: 120,
                minHeight: 120,
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    cursor: enableDrag ? "grab" : "default",
                }}
            />
        </div>
    )
}

ParticleGlobe.displayName = "Rotating Particle Globe"
ParticleGlobe.defaultProps = {
    width: 600,
    height: 600,
}

addPropertyControls(ParticleGlobe, {
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0,
                max: 4,
                step: 0.1,
                defaultValue: 1,
            },
            density: {
                type: ControlType.Number,
                title: "Density",
                min: 20,
                max: 100,
                step: 5,
                defaultValue: 55,
            },
            particleSize: {
                type: ControlType.Number,
                title: "Particle Size",
                min: 0.3,
                max: 3,
                step: 0.1,
                defaultValue: 1,
            },
            autoPlay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: true,
            },
        },
    },
    layers: {
        type: ControlType.Object,
        title: "Layers",
        controls: {
            showWireframe: {
                type: ControlType.Boolean,
                title: "Wireframe",
                defaultValue: true,
            },
            showStars: {
                type: ControlType.Boolean,
                title: "Starfield",
                defaultValue: true,
            },
            showHotspots: {
                type: ControlType.Boolean,
                title: "Hotspots",
                defaultValue: true,
            },
            showMarkers: {
                type: ControlType.Boolean,
                title: "Markers",
                defaultValue: true,
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        controls: {
            enableDrag: {
                type: ControlType.Boolean,
                title: "Drag to Rotate",
                defaultValue: true,
            },
            enableParallax: {
                type: ControlType.Boolean,
                title: "Hover Parallax",
                defaultValue: true,
            },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            bgCenter: {
                type: ControlType.Color,
                title: "BG Center",
                defaultValue: "#0a0a10",
            },
            bgEdge: {
                type: ControlType.Color,
                title: "BG Edge",
                defaultValue: "#040406",
            },
            dotColor: {
                type: ControlType.Color,
                title: "Particles",
                defaultValue: "#b9c8ff",
            },
            wireColor: {
                type: ControlType.Color,
                title: "Wireframe",
                defaultValue: "#d7e1ff",
            },
            markerColor: {
                type: ControlType.Color,
                title: "Markers",
                defaultValue: "#ffffff",
            },
            accentColor: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: "#8ce1ff",
            },
            hotColor: {
                type: ControlType.Color,
                title: "Hotspot",
                defaultValue: "#ff5a2d",
            },
            cornerRadius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "0px",
            },
        },
    },
    markers: {
        type: ControlType.Array,
        title: "Markers",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "CITY",
                },
                latitude: {
                    type: ControlType.Number,
                    title: "Lat",
                    min: -90,
                    max: 90,
                    step: 0.1,
                    defaultValue: 0,
                },
                longitude: {
                    type: ControlType.Number,
                    title: "Lon",
                    min: -180,
                    max: 180,
                    step: 0.1,
                    defaultValue: 0,
                },
                accent: {
                    type: ControlType.Boolean,
                    title: "Accent",
                    defaultValue: false,
                },
            },
        },
        defaultValue: DEFAULT_MARKERS,
    },
})
