// Crack Button – a CTA cut from stone. A press fractures the slab at the exact point of impact:
// cracks race outward, shards shift and tilt, splinters fall, then the surface heals.
// Hovering reveals fine stress lines under the pointer.
// Canvas 2D: one material texture per size, shards are clipped copies of it.
// © Matthias Ölschlegel
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


const CREDIT = "Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)"

// ─── Looks ────────────────────────────────────────────────────────────────────
type Look = {
    key: string
    title: string
    surface: string
    shade: string
    depth: string
    edge: string
    text: string
    grain: number
    veins: number
    pores: number
    gloss: number
    glow: string
    glowAmt: number
}
const LOOKS: Look[] = [
    { key: "magma", title: "Magma", surface: "#40372F", shade: "#17120E", depth: "#000000", edge: "#FFC98A", text: "#FFF3E4", grain: 30, veins: 10, pores: 12, gloss: 70, glow: "#FF7A1A", glowAmt: 100 },
    { key: "volt", title: "Volt", surface: "#2B3550", shade: "#0B101C", depth: "#000000", edge: "#A8D8FF", text: "#FFFFFF", grain: 18, veins: 14, pores: 0, gloss: 85, glow: "#35B4FF", glowAmt: 100 },
    { key: "concrete", title: "Concrete", surface: "#DCDAD5", shade: "#B8B5AE", depth: "#2E2C29", edge: "#FFFFFF", text: "#1E1D1B", grain: 60, veins: 0, pores: 60, gloss: 25, glow: "#FFB070", glowAmt: 0 },
    { key: "obsidian", title: "Obsidian", surface: "#2B2E35", shade: "#0B0C0F", depth: "#000000", edge: "#A9BEDC", text: "#FFFFFF", grain: 22, veins: 12, pores: 0, gloss: 85, glow: "#9CC4FF", glowAmt: 60 },
    { key: "marble", title: "Marble", surface: "#F5F3EF", shade: "#DAD6CE", depth: "#4B4640", edge: "#FFFFFF", text: "#22201D", grain: 18, veins: 75, pores: 0, gloss: 50, glow: "#FFD9A8", glowAmt: 0 },
    { key: "glacier", title: "Glacier", surface: "#E2F3F9", shade: "#A6D0E4", depth: "#234F68", edge: "#FFFFFF", text: "#0D3145", grain: 14, veins: 40, pores: 0, gloss: 70, glow: "#7FE3FF", glowAmt: 0 },
    { key: "terracotta", title: "Terracotta", surface: "#CC7450", shade: "#9C4A2E", depth: "#32120A", edge: "#FFD9C6", text: "#FFFFFF", grain: 70, veins: 0, pores: 45, gloss: 15, glow: "#FFB36B", glowAmt: 0 },
]
const LOOK_BY_KEY: Record<string, Look> = Object.fromEntries(LOOKS.map((l) => [l.key, l]))

// ─── Props ────────────────────────────────────────────────────────────────────
type ColorsProps = { custom?: boolean; surface?: string; shade?: string; depth?: string; edge?: string; glow?: string }
type MaterialProps = { auto?: boolean; grain?: number; veins?: number; pores?: number; gloss?: number; seed?: number }
type BreakProps = { cracks?: number; rings?: number; jagged?: number; reach?: number; shift?: number; tilt?: number; facets?: number; splinters?: number; hold?: number; heal?: number; glow?: number }
type TextProps = { font?: React.CSSProperties; colorAuto?: boolean; color?: string; textCase?: "none" | "upper" }
type BorderProps = { width?: number; color?: string }
type HoverProps = { crack?: number; stress?: number; light?: number; press?: number; focus?: string }
type Props = {
    title?: string
    link?: string
    newTab?: boolean
    linkDelay?: number
    look?: string
    colors?: ColorsProps
    material?: MaterialProps
    fracture?: BreakProps
    text?: TextProps
    border?: BorderProps
    padding?: string
    radius?: string
    shadow?: string | string[]
    hover?: HoverProps
    onClick?: (e: React.MouseEvent) => void
    label?: string
    style?: React.CSSProperties
    thickness?: number
}

const DEF = {
    title: "Get Started",
    padding: "22px 46px 22px 46px",
    radius: "18px",
    shadow: "0px 8px 10px -4px rgba(0, 0, 0, 0.3), 0px 30px 50px -18px rgba(0, 0, 0, 0.6)",
    fontSize: 17,
    linkDelay: 0.5,
}

type Palette = { surface: string; shade: string; depth: string; edge: string; text: string; glow: string; glowAmt: number }
type Material = { grain: number; veins: number; pores: number; gloss: number; seed: number }

function palette(p: Props): Palette {
    const base = LOOK_BY_KEY[p.look ?? "magma"] ?? LOOKS[0]
    const c = p.colors ?? {}
    const pal: Palette = c.custom
        ? { surface: c.surface ?? base.surface, shade: c.shade ?? base.shade, depth: c.depth ?? base.depth, edge: c.edge ?? base.edge, text: base.text, glow: c.glow ?? base.glow, glowAmt: 1 }
        : { surface: base.surface, shade: base.shade, depth: base.depth, edge: base.edge, text: base.text, glow: base.glow, glowAmt: base.glowAmt / 100 }
    pal.glowAmt *= clamp((p.fracture?.glow ?? 100) / 100, 0, 1)
    const t = p.text ?? {}
    if (t.colorAuto === false && t.color) pal.text = t.color
    else if (c.custom) pal.text = luminance(parseColor(pal.surface)) > 0.5 ? "#1E1D1B" : "#FFFFFF"
    return pal
}
function material(p: Props): Material {
    const base = LOOK_BY_KEY[p.look ?? "magma"] ?? LOOKS[0]
    const m = p.material ?? {}
    const seed = Math.max(1, Math.round(m.seed ?? 7))
    if (m.auto !== false) return { grain: base.grain, veins: base.veins, pores: base.pores, gloss: base.gloss, seed }
    return { grain: m.grain ?? base.grain, veins: m.veins ?? base.veins, pores: m.pores ?? base.pores, gloss: m.gloss ?? base.gloss, seed }
}

// ─── Small helpers (no DOM, SSR safe) ────────────────────────────────────────
type RGB = [number, number, number]
function parseColor(input: string | undefined): RGB {
    const s = (input ?? "").trim().toLowerCase()
    let m = s.match(/^#([0-9a-f]{3,8})$/)
    if (m) {
        let h = m[1]
        if (h.length === 3 || h.length === 4) h = h.split("").map((ch) => ch + ch).join("")
        const n = parseInt(h.slice(0, 6), 16)
        return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
    }
    m = s.match(/^rgba?\(([^)]+)\)$/)
    if (m) {
        const parts = m[1].split(/[\s,\/]+/).filter(Boolean)
        const v = parts.slice(0, 3).map((x) => (x.endsWith("%") ? parseFloat(x) * 2.55 : parseFloat(x)) / 255)
        if (v.every((x) => isFinite(x))) return [v[0], v[1], v[2]]
    }
    m = s.match(/^hsla?\(([^)]+)\)$/)
    if (m) {
        const [hh, ss, ll] = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat)
        const h = (((hh % 360) + 360) % 360) / 360, sat = ss / 100, l = ll / 100
        const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat, p = 2 * l - q
        const f = (t: number) => {
            t = (t + 1) % 1
            return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p
        }
        return [f(h + 1 / 3), f(h), f(h - 1 / 3)]
    }
    return [0.5, 0.5, 0.5]
}
const luminance = (c: RGB) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const clamp01 = (v: number) => clamp(v, 0, 1)
const rgba = (c: string, a: number) => {
    const [r, g, b] = parseColor(c)
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`
}
const mix = (a: string, b: string, t: number) => {
    const x = parseColor(a), y = parseColor(b)
    return `rgb(${[0, 1, 2].map((i) => Math.round((x[i] + (y[i] - x[i]) * t) * 255)).join(", ")})`
}
function rng(seed: number) {
    let a = seed >>> 0
    return () => {
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}
const easeOutBack = (x: number) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2)
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const smooth = (x: number) => {
    x = clamp01(x)
    return x * x * (3 - 2 * x)
}

// ─── Material texture ─────────────────────────────────────────────────────────
function makeCanvas(wPx: number, hPx: number) {
    const c = document.createElement("canvas")
    c.width = Math.max(1, Math.round(wPx))
    c.height = Math.max(1, Math.round(hPx))
    return c
}

function noiseCanvas(wPx: number, hPx: number, rnd: () => number, alpha: number, mono = true) {
    const c = makeCanvas(wPx, hPx)
    const x = c.getContext("2d")!
    const img = x.createImageData(c.width, c.height)
    const d = img.data
    for (let i = 0; i < d.length; i += 4) {
        const v = rnd()
        const g = mono ? (v < 0.5 ? 0 : 255) : Math.round(v * 255)
        d[i] = d[i + 1] = d[i + 2] = g
        d[i + 3] = Math.round((mono ? Math.abs(v - 0.5) * 2 : 1) * alpha * 255)
    }
    x.putImageData(img, 0, 0)
    return c
}

function buildTexture(w: number, h: number, dpr: number, pal: Palette, mat: Material): HTMLCanvasElement {
    const c = makeCanvas(w * dpr, h * dpr)
    const x = c.getContext("2d")!
    const rnd = rng(mat.seed * 7919 + 13)
    x.scale(dpr, dpr)
    const grain = mat.grain / 100, veins = mat.veins / 100, pores = mat.pores / 100, gloss = mat.gloss / 100
    const lightBg = luminance(parseColor(pal.surface)) > 0.5

    const g = x.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, pal.surface)
    g.addColorStop(1, pal.shade)
    x.fillStyle = g
    x.fillRect(0, 0, w, h)

    // soft mottling in two sizes
    if (grain > 0) {
        for (const [cell, a] of [[11, 0.16], [4, 0.1]] as const) {
            const n = noiseCanvas(Math.ceil(w / cell) + 3, Math.ceil(h / cell) + 3, rnd, 1, false)
            x.save()
            x.globalAlpha = a * grain * (lightBg ? 1 : 0.8)
            x.globalCompositeOperation = "soft-light"
            x.imageSmoothingEnabled = true
            x.drawImage(n, -cell, -cell, n.width * cell, n.height * cell)
            x.restore()
        }
        // fine speckle at device pixels
        const sp = noiseCanvas(c.width, c.height, rnd, 0.16 * grain)
        x.save()
        x.setTransform(1, 0, 0, 1, 0, 0)
        x.drawImage(sp, 0, 0)
        x.restore()
    }

    // veins: long wandering lines with a soft halo
    if (veins > 0) {
        const count = Math.round(2 + veins * 5 + (w * h) / 9000)
        const veinCol = mix(pal.depth, pal.surface, lightBg ? 0.45 : 0.25)
        const lightVein = !lightBg || pal.depth === "#234F68"
        for (let k = 0; k < count; k++) {
            let px = rnd() * w, py = rnd() * h
            let ang = (rnd() - 0.5) * 1.6 + (rnd() < 0.5 ? 0.35 : -0.35)
            const pts: number[] = [px, py]
            const steps = 5 + Math.floor(rnd() * 7)
            for (let s = 0; s < steps; s++) {
                ang += (rnd() - 0.5) * 0.9
                const len = (6 + rnd() * 16) * (0.6 + h / 90)
                px += Math.cos(ang) * len
                py += Math.sin(ang) * len * 0.8
                pts.push(px, py)
            }
            const strength = (0.35 + rnd() * 0.65) * veins
            x.beginPath()
            x.moveTo(pts[0], pts[1])
            for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1])
            x.lineJoin = "round"
            x.lineCap = "round"
            x.strokeStyle = lightVein ? rgba(pal.edge, 0.1 * strength) : rgba(veinCol, 0.1 * strength)
            x.lineWidth = 3.2
            x.stroke()
            x.strokeStyle = lightVein ? rgba(pal.edge, 0.34 * strength) : rgba(veinCol, 0.42 * strength)
            x.lineWidth = 0.7
            x.stroke()
        }
    }

    // pores: tiny air bubbles with a lit lower lip
    if (pores > 0) {
        const count = Math.round(((w * h) / 520) * pores)
        for (let k = 0; k < count; k++) {
            const px = rnd() * w, py = rnd() * h, r = 0.35 + rnd() * rnd() * 1.3
            x.fillStyle = rgba(pal.depth, 0.22 + rnd() * 0.3)
            x.beginPath()
            x.ellipse(px, py, r, r * (0.7 + rnd() * 0.3), 0, 0, Math.PI * 2)
            x.fill()
            x.strokeStyle = rgba(pal.edge, 0.35)
            x.lineWidth = 0.5
            x.beginPath()
            x.arc(px, py + 0.35, r, 0.15 * Math.PI, 0.85 * Math.PI)
            x.stroke()
        }
    }

    // polish: light from above, a little weight below
    if (gloss > 0) {
        const s = x.createLinearGradient(0, 0, 0, h)
        s.addColorStop(0, rgba(pal.edge, 0.3 * gloss))
        s.addColorStop(0.44, rgba(pal.edge, 0.07 * gloss))
        s.addColorStop(0.5, rgba(pal.edge, 0))
        x.fillStyle = s
        x.fillRect(0, 0, w, h)
    }
    const b = x.createLinearGradient(0, h * 0.55, 0, h)
    b.addColorStop(0, "rgba(0, 0, 0, 0)")
    b.addColorStop(1, `rgba(0, 0, 0, ${lightBg ? 0.07 : 0.22})`)
    x.fillStyle = b
    x.fillRect(0, 0, w, h)
    return c
}

/** Fine stress lines across the slab; hovering reveals the ones near the pointer. */
function buildStress(w: number, h: number, dpr: number, pal: Palette, seed: number): HTMLCanvasElement {
    const c = makeCanvas(w * dpr, h * dpr)
    const x = c.getContext("2d")!
    const rnd = rng(seed * 104729 + 71)
    x.scale(dpr, dpr)
    x.lineJoin = "round"
    x.lineCap = "round"
    const count = Math.round(3 + (w * h) / 3800)
    const lines: number[][] = []
    const walk = (px: number, py: number, ang: number, steps: number, scale: number) => {
        const pts = [px, py]
        for (let s = 0; s < steps; s++) {
            ang += (rnd() - 0.5) * 0.75
            const len = (5 + rnd() * 11) * scale
            px += Math.cos(ang) * len
            py += Math.sin(ang) * len
            pts.push(px, py)
            if (s > 0 && rnd() < 0.16) walk(px, py, ang + (rnd() < 0.5 ? 0.9 : -0.9), 1 + Math.floor(rnd() * 2), scale * 0.7)
        }
        lines.push(pts)
    }
    const scale = 0.7 + h / 110
    for (let k = 0; k < count; k++) walk(rnd() * w, rnd() * h, rnd() * Math.PI * 2, 3 + Math.floor(rnd() * 4), scale)
    const path = (pts: number[], dy: number) => {
        x.beginPath()
        x.moveTo(pts[0], pts[1] + dy)
        for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1] + dy)
    }
    for (const pts of lines) {
        path(pts, 0.7)
        x.strokeStyle = rgba(pal.edge, 0.45)
        x.lineWidth = 0.5
        x.stroke()
        path(pts, 0)
        x.strokeStyle = rgba(pal.depth, 0.6)
        x.lineWidth = 0.5
        x.stroke()
    }
    return c
}

// ─── Fracture geometry ────────────────────────────────────────────────────────
type Shard = { pts: number[]; cx: number; cy: number; d: number; t0: number; ox: number; oy: number; rot: number; shade: number }
type Fracture = { x: number; y: number; t: number; end: number; rmax: number; shards: Shard[]; tails: number[][]; hold: number; heal: number; gain: number; gainT: number; held: boolean; spread: number; dur: number; soft: boolean; lit: number; litT: number }

function buildFracture(px: number, py: number, w: number, h: number, B: BreakProps, seed: number): Fracture {
    const rnd = rng(seed)
    const n = clamp(Math.round(B.cracks ?? 12), 3, 24)
    const m = clamp(Math.round(B.rings ?? 3), 1, 6)
    const jag = (B.jagged ?? 60) / 100
    const reach = (B.reach ?? 100) / 100
    const corner = Math.max(Math.hypot(px, py), Math.hypot(w - px, py), Math.hypot(px, h - py), Math.hypot(w - px, h - py)) + 8
    const rmax = Math.max(12, Math.min(h * 0.75, corner) + (corner - Math.min(h * 0.75, corner)) * reach)
    const a0 = rnd() * Math.PI * 2
    const step = (Math.PI * 2) / n
    // vertex grid: V[i][j], j = 0 is the impact point
    const V: number[][][] = []
    for (let i = 0; i < n; i++) {
        const base = a0 + (i + (rnd() - 0.5) * 0.9 * jag) * step
        const row: number[][] = [[px, py]]
        for (let j = 1; j <= m; j++) {
            const r = rmax * Math.pow(j / m, 1.45) * (j === m ? 1 : 1 + (rnd() - 0.5) * 1.05 * jag)
            const a = base + (rnd() - 0.5) * 0.85 * jag * step
            row.push([px + Math.cos(a) * Math.max(4, r), py + Math.sin(a) * Math.max(4, r)])
        }
        V.push(row)
    }
    const midpoint = (a: number[], b: number[], amt: number) => {
        const dx = b[0] - a[0], dy = b[1] - a[1]
        const t = 0.35 + rnd() * 0.3
        const o = (rnd() - 0.5) * amt * jag
        return [a[0] + dx * t - dy * o, a[1] + dy * t + dx * o]
    }
    const M: number[][][] = [] // along rays, between ring j and j + 1
    const N: number[][][] = [] // along rings, between ray i and i + 1
    for (let i = 0; i < n; i++) {
        M.push([])
        N.push([])
        for (let j = 0; j < m; j++) M[i].push(midpoint(V[i][j], V[i][j + 1], 0.3))
        for (let j = 0; j <= m; j++) N[i].push(j === 0 ? [px, py] : midpoint(V[i][j], V[(i + 1) % n][j], 0.42))
    }
    const shiftPx = ((B.shift ?? 55) / 100) * clamp(h * 0.075, 2.5, 7)
    const tilt = ((B.tilt ?? 50) / 100) * 0.06
    const facets = ((B.facets ?? 50) / 100) * 0.16
    const shards: Shard[] = []
    for (let i = 0; i < n; i++) {
        const k = (i + 1) % n
        for (let j = 0; j < m; j++) {
            const poly =
                j === 0
                    ? [V[i][0], M[i][0], V[i][1], N[i][1], V[k][1], M[k][0]]
                    : [V[i][j], N[i][j], V[k][j], M[k][j], V[k][j + 1], N[i][j + 1], V[i][j + 1], M[i][j]]
            const pts: number[] = []
            let cx = 0, cy = 0
            for (const p of poly) {
                pts.push(p[0], p[1])
                cx += p[0]
                cy += p[1]
            }
            cx /= poly.length
            cy /= poly.length
            const d = Math.hypot(cx - px, cy - py)
            const fall = 1 / (1 + d / (h * 0.85))
            const amp = shiftPx * fall * (0.5 + rnd() * 0.9)
            const dx = (cx - px) / (d || 1), dy = (cy - py) / (d || 1)
            shards.push({
                pts, cx, cy, d,
                t0: (d / rmax) * 0.13,
                ox: dx * amp,
                oy: dy * amp + amp * 0.22,
                rot: (rnd() - 0.5) * 2 * tilt * (0.35 + fall),
                shade: (rnd() - 0.5) * 2 * facets,
            })
        }
    }
    // hairline tails beyond the last ring when the break does not reach the edge
    const tails: number[][] = []
    if (reach < 0.999) {
        for (let i = 0; i < n; i++) {
            const o = V[i][m]
            let ang = Math.atan2(o[1] - py, o[0] - px)
            const pts = [o[0], o[1]]
            let qx = o[0], qy = o[1]
            const segs = 2 + Math.floor(rnd() * 2)
            for (let s = 0; s < segs; s++) {
                ang += (rnd() - 0.5) * 0.7 * jag
                const len = rmax * (0.1 + rnd() * 0.14)
                qx += Math.cos(ang) * len
                qy += Math.sin(ang) * len
                pts.push(qx, qy)
            }
            tails.push(pts)
        }
    }
    const hold = Math.max(0, B.hold ?? 0.35), heal = Math.max(0.1, B.heal ?? 0.9)
    return { x: px, y: py, t: 0, end: 0.18 + hold + heal * 1.2, rmax, shards, tails, hold, heal, gain: 1, gainT: 1, held: false, spread: 1.5, dur: 0.42, soft: false, lit: 1, litT: 1 }
}

function shardAmount(f: Fracture, s: Shard): number {
    const u = f.t - s.t0 * f.spread
    if (u <= 0) return -1
    const x = Math.min(1, u / f.dur)
    // hover: the slab gives way slowly, no bounce. click: a short settle.
    const out = f.soft ? 1 - Math.pow(1 - x, 3) : 1 + 1.15 * Math.pow(x - 1, 3) + 0.15 * Math.pow(x - 1, 2)
    const healStart = 0.18 + f.hold + (1 - s.d / f.rmax) * 0.25 * f.heal
    const back = 1 - easeInOut(clamp01((f.t - healStart) / (f.heal * 0.6)))
    return out * back * f.gain
}
const lineAlpha = (f: Fracture) => 1 - smooth((f.t - (0.18 + f.hold + f.heal * 0.85)) / (f.heal * 0.35))

type Splinter = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; size: number; life: number; max: number; color: string; a: number; b: number; hot?: boolean }

// ─── Painter (shared by the live button and the still on the canvas) ─────────
type Scene = {
    w: number
    h: number
    dpr: number
    tex: HTMLCanvasElement
    texText: HTMLCanvasElement | null
    stress: HTMLCanvasElement | null
    scratch: HTMLCanvasElement | null
    always?: boolean
}
function paint(ctx: CanvasRenderingContext2D, sc: Scene, pal: Palette, f: Fracture | null, hov: { x: number; y: number; pres: number; stress: number; light: number }) {
    const { w, h, dpr } = sc
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    const T = (f || sc.always) && sc.texText ? sc.texText : sc.tex
    ctx.drawImage(T, 0, 0, w, h)

    if (hov.pres > 0.01) {
        const R = Math.max(26, h * 0.95)
        if (hov.light > 0) {
            const g = ctx.createRadialGradient(hov.x, hov.y, 0, hov.x, hov.y, R * 1.5)
            g.addColorStop(0, rgba(pal.edge, 0.2 * hov.light * hov.pres))
            g.addColorStop(1, rgba(pal.edge, 0))
            ctx.fillStyle = g
            ctx.fillRect(0, 0, w, h)
        }
        if (hov.stress > 0 && sc.stress && sc.scratch && !f) {
            const m = sc.scratch.getContext("2d")!
            m.setTransform(dpr, 0, 0, dpr, 0, 0)
            m.globalCompositeOperation = "source-over"
            m.clearRect(0, 0, w, h)
            m.drawImage(sc.stress, 0, 0, w, h)
            m.globalCompositeOperation = "destination-in"
            const g = m.createRadialGradient(hov.x, hov.y, 0, hov.x, hov.y, R)
            g.addColorStop(0, `rgba(0, 0, 0, ${Math.min(1, hov.stress * 1.1) * hov.pres})`)
            g.addColorStop(0.45, `rgba(0, 0, 0, ${0.55 * hov.stress * hov.pres})`)
            g.addColorStop(1, "rgba(0, 0, 0, 0)")
            m.fillStyle = g
            m.fillRect(0, 0, w, h)
            ctx.drawImage(sc.scratch, 0, 0, w, h)
        }
    }
    if (!f) return

    const la = lineAlpha(f)
    const lightBg = luminance(parseColor(pal.surface)) > 0.5
    const trace = (pts: number[]) => {
        ctx.beginPath()
        ctx.moveTo(pts[0], pts[1])
        for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1])
        ctx.closePath()
    }
    ctx.lineJoin = "round"
    // the hollow behind every loose shard
    const GA = pal.glowAmt
    if (GA > 0) {
        // the hollow glows: white-hot at the impact, the glow colour further out
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, Math.max(20, f.rmax))
        g.addColorStop(0, mix(pal.glow, "#FFFFFF", 0.75))
        g.addColorStop(0.22, mix(pal.glow, "#FFFFFF", 0.2))
        g.addColorStop(0.6, pal.glow)
        g.addColorStop(1, mix(pal.glow, "#000000", 0.45))
        ctx.fillStyle = mix(pal.depth, "#000000", 0)
        ctx.globalAlpha = la
        for (const s of f.shards) {
            if (shardAmount(f, s) < 0) continue
            trace(s.pts)
            ctx.fill()
        }
        ctx.fillStyle = g
        ctx.globalAlpha = la * Math.min(1, GA * (0.45 + 0.55 * f.lit))
    } else {
        ctx.fillStyle = pal.depth
        ctx.globalAlpha = la
    }
    for (const s of f.shards) {
        if (shardAmount(f, s) < 0) continue
        trace(s.pts)
        ctx.fill()
    }
    ctx.globalAlpha = 1
    for (const s of f.shards) {
        const k = shardAmount(f, s)
        if (k < 0) continue
        ctx.save()
        ctx.translate(s.cx + s.ox * k, s.cy + s.oy * k)
        ctx.rotate(s.rot * k)
        ctx.translate(-s.cx, -s.cy)
        trace(s.pts)
        ctx.clip()
        ctx.drawImage(T, 0, 0, w, h)
        const sh = s.shade * Math.min(1, Math.abs(k) * 1.4)
        if (Math.abs(sh) > 0.003) {
            ctx.fillStyle = sh > 0 ? rgba(pal.edge, sh) : `rgba(0, 0, 0, ${-sh * (lightBg ? 0.8 : 1.6)})`
            ctx.fillRect(-20, -20, w + 40, h + 40)
        }
        // a fine dark hairline with a faint lit edge: reads as a crack, not as an outline
        const u = f.t - s.t0 * f.spread
        const lineIn = smooth(clamp01(u / 0.32))
        const near = 1 - 0.55 * Math.min(1, s.d / f.rmax)
        const rim = la * lineIn * near
        trace(s.pts)
        ctx.lineWidth = 0.9
        ctx.strokeStyle = rgba(pal.depth, (lightBg ? 0.5 : 0.75) * rim)
        ctx.stroke()
        ctx.translate(0.9, 0.9)
        trace(s.pts)
        ctx.lineWidth = 0.7
        ctx.strokeStyle = rgba(pal.edge, (lightBg ? 0.5 : 0.22) * rim * Math.min(1, 0.35 + Math.abs(k) * 2))
        ctx.stroke()
        ctx.restore()
    }
    if (GA > 0) {
        // bloom along every open crack; it flares as the crack opens, then breathes
        const breathe = 0.92 + 0.08 * Math.sin(f.t * 2.2)
        ctx.save()
        ctx.globalCompositeOperation = "lighter"
        ctx.lineJoin = "round"
        ctx.shadowColor = pal.glow
        for (const s of f.shards) {
            const u = f.t - s.t0 * f.spread
            if (u <= 0) continue
            const near = 1 - 0.6 * Math.min(1, s.d / f.rmax)
            const flare = 0.5 + 1.7 * Math.exp(-u * 3.2)
            // on hover the cracks nearest the pointer burn brightest and follow it
            const prox = f.soft ? 0.35 + 1.15 * Math.exp(-Math.hypot(s.cx - hov.x, s.cy - hov.y) / (h * 0.75)) : 1
            const a = la * smooth(clamp01(u / 0.38)) * near * GA * flare * breathe * f.lit * prox
            if (a < 0.01) continue
            ctx.shadowBlur = (7 + 9 * near) * dpr
            trace(s.pts)
            ctx.lineWidth = 0.9 + 0.9 * near
            ctx.strokeStyle = rgba(mix(pal.glow, "#FFFFFF", 0.35 * near), Math.min(1, a * 0.55))
            ctx.stroke()
        }
        // the flash of the hit itself
        if (!f.soft && f.t < 0.5) {
            const p = f.t / 0.5
            const R = Math.max(30, h * (0.6 + 1.6 * p))
            const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, R)
            const k = (1 - p) * (1 - p) * GA
            g.addColorStop(0, rgba(mix(pal.glow, "#FFFFFF", 0.7), 0.85 * k))
            g.addColorStop(0.4, rgba(pal.glow, 0.35 * k))
            g.addColorStop(1, rgba(pal.glow, 0))
            ctx.shadowBlur = 0
            ctx.fillStyle = g
            ctx.fillRect(0, 0, w, h)
        }
        ctx.restore()
    }
    // hairlines that run on past the break
    if (f.tails.length) {
        const grow = clamp01((f.t - 0.1) / 0.16)
        ctx.lineCap = "round"
        for (const pts of f.tails) {
            const last = Math.max(1, Math.ceil(grow * (pts.length / 2 - 1)))
            ctx.beginPath()
            ctx.moveTo(pts[0], pts[1])
            for (let i = 1; i <= last; i++) ctx.lineTo(pts[i * 2], pts[i * 2 + 1])
            ctx.strokeStyle = GA > 0 ? rgba(pal.glow, 0.7 * la * grow * GA) : rgba(pal.depth, 0.6 * la * grow)
            ctx.lineWidth = 0.8
            ctx.stroke()
        }
    }
    // dust at the point of impact
    if (f.t < 0.3) {
        const p = f.t / 0.3
        const R = 6 + p * Math.min(60, h * 0.9)
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, R)
        g.addColorStop(0, rgba(pal.edge, 0.3 * (1 - p) * f.gain))
        g.addColorStop(1, rgba(pal.edge, 0))
        ctx.fillStyle = g
        ctx.fillRect(f.x - R, f.y - R, R * 2, R * 2)
    }
}

// ─── Component ────────────────────────────────────────────────────────────────
const FX = { side: 70, top: 60, bottom: 150 }
const REST_GLOW = 0.14 // a faint ember under the slab even at rest
const useIsoLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

function useUid() {
    const id = (React as unknown as { useId?: () => string }).useId?.() ?? "x"
    return "ckb-" + id.replace(/[^a-zA-Z0-9_-]/g, "")
}

function CrackButtonInner(props: Props & { isStatic: boolean }) {
    const { isStatic } = props
    const pal = palette(props)
    const mat = material(props)
    const uid = useUid()
    const { title = DEF.title, link, newTab, text = {}, border = {}, hover = {}, padding = DEF.padding, radius = DEF.radius, shadow = DEF.shadow, label, style } = props
    const font = text.font ?? {}
    const upper = (text.textCase ?? "none") === "upper"
    const hasLink = typeof link === "string" && link.trim() !== ""
    const [pressed, setPressed] = React.useState(false)

    const rootRef = React.useRef<HTMLElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const fxRef = React.useRef<HTMLCanvasElement>(null)
    const labelRef = React.useRef<HTMLSpanElement>(null)
    const probeRef = React.useRef<HTMLSpanElement>(null)
    const haloRef = React.useRef<HTMLSpanElement>(null)
    const navTimer = React.useRef(0)

    // the engine reads everything from here, so prop changes never rebuild listeners
    const live = React.useRef({
        pal, mat,
        brk: props.fracture ?? {},
        stress: (hover.stress ?? 60) / 100,
        light: (hover.light ?? 50) / 100,
        hoverBreak: (hover.crack ?? 60) / 100,
        upper,
        rebuild: () => {},
        crack: (_x: number | null, _y: number | null) => {},
    })
    live.current.pal = pal
    live.current.mat = mat
    live.current.brk = props.fracture ?? {}
    live.current.stress = (hover.stress ?? 60) / 100
    live.current.light = (hover.light ?? 50) / 100
    live.current.hoverBreak = (hover.crack ?? 60) / 100
    live.current.upper = upper

    const key = JSON.stringify([pal, mat, title, upper, font, padding, radius])
    React.useEffect(() => {
        live.current.rebuild()
    }, [key])

    useIsoLayoutEffect(() => {
        const root = rootRef.current, canvas = canvasRef.current
        if (!root || !canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const L = live.current
        const reduce = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null
        const sc: Scene = { w: 0, h: 0, dpr: 1, tex: canvas, texText: null, stress: null, scratch: null, always: !isStatic }
        let ready = false, disposed = false
        let frac: Fracture | null = null
        let parts: Splinter[] = []
        let raf = 0, running = false, last = 0, visible = true, onScreen = true
        let pres = 0, target = 0, ptrX = 0, ptrY = 0, breakCount = 0, armed = true, hoverTimer = 0

        const restLabel = () => showLabel(!(sc.always && sc.texText))
        const showLabel = (on: boolean) => {
            const el = labelRef.current
            if (el) el.style.opacity = on ? "" : "0"
        }

        /** Material with the label engraved into it, so shards carry their piece of the text. */
        const buildTextTexture = (): HTMLCanvasElement | null => {
            const el = labelRef.current, probe = probeRef.current
            const node = el?.firstChild
            if (!el || !probe || !node || node.nodeType !== 3 || typeof document.createRange !== "function") return null
            const str = node.textContent ?? ""
            if (!str) return null
            const rr = root.getBoundingClientRect()
            const s = rr.width / (root.offsetWidth || rr.width || 1) || 1
            const cs = getComputedStyle(el)
            const base = (probe.getBoundingClientRect().bottom - rr.top) / s
            const c = makeCanvas(sc.tex.width, sc.tex.height)
            const x = c.getContext("2d")!
            x.drawImage(sc.tex, 0, 0)
            x.scale(sc.dpr, sc.dpr)
            x.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
            x.textBaseline = "alphabetic"
            x.fillStyle = L.pal.text
            const lightText = luminance(parseColor(L.pal.text)) > 0.5
            x.shadowColor = lightText ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.55)"
            x.shadowOffsetY = 1 * sc.dpr
            x.shadowBlur = lightText ? 1.5 * sc.dpr : 0
            const range = document.createRange()
            let off = 0
            for (const ch of Array.from(str)) {
                range.setStart(node, off)
                range.setEnd(node, off + ch.length)
                off += ch.length
                if (!ch.trim()) continue
                const r = range.getBoundingClientRect()
                if (!r.width) return null
                x.fillText(L.upper ? ch.toUpperCase() : ch, (r.left - rr.left) / s, base)
            }
            return c
        }

        const rebuild = () => {
            if (disposed) return
            const w = root.offsetWidth, h = root.offsetHeight
            if (w < 2 || h < 2) return
            const dpr = Math.min(2.5, Math.max(1, (typeof window !== "undefined" && window.devicePixelRatio) || 1))
            sc.w = w
            sc.h = h
            sc.dpr = isStatic ? Math.max(2, dpr) : dpr
            canvas.width = Math.round(w * sc.dpr)
            canvas.height = Math.round(h * sc.dpr)
            sc.tex = buildTexture(w, h, sc.dpr, L.pal, L.mat)
            sc.texText = null
            sc.stress = null
            sc.scratch = null
            if (!isStatic) {
                sc.stress = buildStress(w, h, sc.dpr, L.pal, L.mat.seed)
                sc.scratch = makeCanvas(canvas.width, canvas.height)
                try {
                    sc.texText = buildTextTexture()
                } catch {
                    sc.texText = null
                }
            }
            ready = true
            frac = null
            restLabel()
            draw()
        }
        L.rebuild = rebuild

        const draw = () => {
            if (!ready) return
            paint(ctx, sc, L.pal, frac, { x: ptrX, y: ptrY, pres, stress: L.stress, light: L.light })
        }

        const drawFx = () => {
            const fx = fxRef.current
            if (!fx) return
            const x = fx.getContext("2d")
            if (!x) return
            if (!parts.length) {
                if (fx.style.display !== "none") {
                    x.setTransform(1, 0, 0, 1, 0, 0)
                    x.clearRect(0, 0, fx.width, fx.height)
                    fx.style.display = "none"
                }
                return
            }
            const W = sc.w + FX.side * 2, H = sc.h + FX.top + FX.bottom
            if (fx.width !== Math.round(W * sc.dpr) || fx.height !== Math.round(H * sc.dpr)) {
                fx.width = Math.round(W * sc.dpr)
                fx.height = Math.round(H * sc.dpr)
            }
            fx.style.display = "block"
            x.setTransform(sc.dpr, 0, 0, sc.dpr, 0, 0)
            x.clearRect(0, 0, W, H)
            for (const p of parts) {
                const a = Math.min(1, (p.life / p.max) * 3.2)
                x.save()
                x.translate(p.x + FX.side, p.y + FX.top)
                x.rotate(p.rot)
                x.globalAlpha = a
                x.globalCompositeOperation = p.hot ? "lighter" : "source-over"
                x.shadowColor = p.hot ? p.color : "transparent"
                x.shadowBlur = p.hot ? 8 * sc.dpr : 0
                x.fillStyle = p.color
                x.beginPath()
                x.moveTo(-p.size * 0.6, -p.size * p.a)
                x.lineTo(p.size * 0.7, -p.size * 0.1)
                x.lineTo(-p.size * p.b, p.size * 0.6)
                x.closePath()
                x.fill()
                x.restore()
            }
        }

        const setHalo = () => {
            const halo = haloRef.current
            if (!halo) return
            const GA = L.pal.glowAmt
            let lv = GA * REST_GLOW
            if (frac && GA > 0) {
                const open = smooth(clamp01(frac.t / 0.5))
                const hit = frac.soft ? 0 : 0.9 * Math.exp(-frac.t * 3.5)
                lv += GA * lineAlpha(frac) * (open * frac.lit * (frac.soft ? 0.45 : 0.7) * (0.92 + 0.08 * Math.sin(frac.t * 2.6)) + hit)
            }
            halo.style.opacity = Math.min(1, lv).toFixed(3)
        }

        const frame = (now: number) => {
            raf = 0
            if (disposed || !visible) {
                running = false
                return
            }
            const dt = clamp((now - (last || now)) / 1000, 0, 1 / 20)
            last = now
            pres += (target - pres) * Math.min(1, dt * 9)
            if (frac) {
                frac.gain += (frac.gainT - frac.gain) * Math.min(1, dt * (frac.soft ? 5 : 12))
                frac.lit += (frac.litT - frac.lit) * Math.min(1, dt * 4)
                frac.t += dt
                if (frac.t >= frac.end) {
                    frac = null
                    restLabel()
                }
            }
            if (parts.length) {
                for (const p of parts) {
                    p.vy += (p.hot ? 520 : 1300) * dt
                    p.vx *= 1 - 0.8 * dt
                    p.x += p.vx * dt
                    p.y += p.vy * dt
                    p.rot += p.vr * dt
                    p.life -= dt
                }
                parts = parts.filter((p) => p.life > 0 && p.y < sc.h + FX.bottom)
            }
            draw()
            drawFx()
            setHalo()
            // a hover break that has settled just holds its pose: no need to keep painting
            const resting = !!frac && frac.held && L.pal.glowAmt <= 0 && frac.t > 1.5 && Math.abs(frac.gainT - frac.gain) < 0.004
            if ((frac && !resting) || parts.length || Math.abs(target - pres) > 0.004) raf = requestAnimationFrame(frame)
            else {
                running = false
                last = 0
            }
        }
        const kick = () => {
            if (disposed || running || !visible || !ready) return
            running = true
            last = 0
            raf = requestAnimationFrame(frame)
        }

        const crack = (x: number | null, y: number | null) => {
            if (!ready || reduce?.matches) return
            const px = x == null ? sc.w / 2 : clamp(x, 0, sc.w), py = y == null ? sc.h / 2 : clamp(y, 0, sc.h)
            breakCount++
            const seed = L.mat.seed * 977 + breakCount * 7919 + Math.round(px * 13 + py * 31)
            frac = buildFracture(px, py, sc.w, sc.h, L.brk, seed)
            frac.gain = frac.gainT = 1.55
            if (sc.texText) showLabel(false)
            try {
                canvas.parentElement?.animate?.(
                    [{ transform: "translate(0, 0)" }, { transform: "translate(1.2px, 1.6px)" }, { transform: "translate(-0.8px, -0.5px)" }, { transform: "translate(0.3px, 0.2px)" }, { transform: "translate(0, 0)" }],
                    { duration: 260, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" }
                )
            } catch {}
            const amount = (L.brk.splinters ?? 50) / 100
            const hotAmt = L.pal.glowAmt
            const count = Math.round(amount * (hotAmt > 0 ? 34 : 18))
            const rnd = rng(seed + 5)
            const cols = [L.pal.surface, L.pal.shade, mix(L.pal.shade, L.pal.depth, 0.35), mix(L.pal.surface, L.pal.edge, 0.4)]
            parts = parts.slice(-40)
            for (let i = 0; i < count; i++) {
                const ang = rnd() * Math.PI * 2
                const sp = 50 + rnd() * rnd() * 300
                const max = 0.55 + rnd() * 0.6
                parts.push({
                    x: px + Math.cos(ang) * 3, y: py + Math.sin(ang) * 3,
                    vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp * 0.8 - 90 - rnd() * 120,
                    rot: rnd() * 6.28, vr: (rnd() - 0.5) * 22,
                    size: (0.8 + rnd() * rnd() * 2.6) * clamp(sc.h / 66, 0.8, 1.8),
                    life: max, max, color: cols[Math.floor(rnd() * cols.length)], a: 0.3 + rnd() * 0.5, b: 0.1 + rnd() * 0.5,
                })
                // embers: small, bright, slower to fall
                if (hotAmt > 0 && i % 2 === 0) {
                    const q = parts[parts.length - 1]
                    q.hot = true
                    q.size *= 0.55
                    q.color = mix(L.pal.glow, "#FFFFFF", 0.25 + rnd() * 0.5)
                    q.vy -= 60 + rnd() * 80
                    q.max = q.life = max * 1.5
                }
            }
            kick()
        }
        L.crack = crack

        // hover: the slab gives way under the pointer and holds that pose until the pointer leaves
        const hoverCrack = (x: number, y: number) => {
            if (!ready || reduce?.matches || frac || !armed || L.hoverBreak <= 0) return
            breakCount++
            const px = clamp(x, 0, sc.w), py = clamp(y, 0, sc.h)
            const f = buildFracture(px, py, sc.w, sc.h, L.brk, L.mat.seed * 977 + breakCount * 7919 + Math.round(px * 13 + py * 31))
            f.hold = 1e6
            f.end = Infinity
            f.held = true
            f.gain = 0
            f.gainT = L.hoverBreak * 0.3 // on hover the slab barely moves: light does the work
            f.lit = 0
            f.litT = Math.min(1, L.hoverBreak * 1.3)
            f.spread = 4.2
            f.dur = 0.7
            f.soft = true
            frac = f
            if (sc.texText) showLabel(false)
            kick()
        }
        const release = () => {
            if (!frac || !frac.held) return
            frac.held = false
            frac.hold = Math.max(0, frac.t - 0.18) + 0.04
            frac.end = 0.18 + frac.hold + frac.heal * 1.2
            kick()
        }

        rebuild()
        const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => (root.offsetWidth !== sc.w || root.offsetHeight !== sc.h) && rebuild()) : null
        ro?.observe(root)
        let fontsDone = false
        ;(document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready.then(() => {
            if (!disposed && !fontsDone) {
                fontsDone = true
                rebuild()
            }
        })
        if (isStatic) {
            return () => {
                disposed = true
                ro?.disconnect()
                L.rebuild = () => {}
            }
        }

        const local = (e: PointerEvent) => {
            const r = root.getBoundingClientRect()
            const sx = r.width / (sc.w || r.width || 1) || 1, sy = r.height / (sc.h || r.height || 1) || 1
            return { x: (e.clientX - r.left) / sx, y: (e.clientY - r.top) / sy }
        }
        const onEnter = (e: PointerEvent) => {
            const p = local(e)
            ptrX = p.x
            ptrY = p.y
            if (e.pointerType === "mouse") {
                target = 1
                // wait until the pointer has come in a little, so the break starts under it and not at the rim
                window.clearTimeout(hoverTimer)
                hoverTimer = window.setTimeout(() => hoverCrack(ptrX, ptrY), 110)
            }
            kick()
        }
        const onMove = (e: PointerEvent) => {
            const p = local(e)
            ptrX = p.x
            ptrY = p.y
            if (e.pointerType === "mouse") {
                target = 1
                const m = Math.min(p.x, p.y, sc.w - p.x, sc.h - p.y)
                if (m > sc.h * 0.22) {
                    window.clearTimeout(hoverTimer)
                    hoverCrack(p.x, p.y)
                }
            }
            kick()
        }
        const onLeave = () => {
            target = 0
            armed = true
            window.clearTimeout(hoverTimer)
            release()
            kick()
        }
        const onDown = (e: PointerEvent) => {
            if (e.button !== 0) return
            const p = local(e)
            ptrX = p.x
            ptrY = p.y
            window.clearTimeout(hoverTimer)
            armed = false // after a click the slab heals and stays whole until the pointer comes back
            crack(p.x, p.y)
        }
        const onKey = (e: KeyboardEvent) => {
            if ((e.key === "Enter" || e.key === " ") && !e.repeat) crack(null, null)
        }
        root.addEventListener("pointerenter", onEnter)
        root.addEventListener("pointermove", onMove)
        root.addEventListener("pointerleave", onLeave)
        root.addEventListener("pointerdown", onDown)
        root.addEventListener("keydown", onKey)

        const sync = () => {
            const was = visible
            visible = onScreen && !document.hidden
            if (visible && !was) kick()
        }
        const io =
            typeof IntersectionObserver === "function"
                ? new IntersectionObserver((entries) => {
                      onScreen = entries[entries.length - 1].isIntersecting
                      sync()
                  })
                : null
        io?.observe(root)
        document.addEventListener("visibilitychange", sync)
        const onReduce = () => {
            if (reduce?.matches) {
                frac = null
                parts = []
                restLabel()
                draw()
                drawFx()
            }
        }
        reduce?.addEventListener?.("change", onReduce)

        return () => {
            disposed = true
            if (raf) cancelAnimationFrame(raf)
            L.rebuild = () => {}
            L.crack = () => {}
            window.clearTimeout(hoverTimer)
            root.removeEventListener("pointerenter", onEnter)
            root.removeEventListener("pointermove", onMove)
            root.removeEventListener("pointerleave", onLeave)
            root.removeEventListener("pointerdown", onDown)
            root.removeEventListener("keydown", onKey)
            io?.disconnect()
            ro?.disconnect()
            document.removeEventListener("visibilitychange", sync)
            reduce?.removeEventListener?.("change", onReduce)
        }
    }, [isStatic])

    React.useEffect(() => () => window.clearTimeout(navTimer.current), [])

    const onClick = (e: React.MouseEvent<HTMLElement>) => {
        props.onClick?.(e)
        if (isStatic || !hasLink || newTab || e.defaultPrevented) return
        const delay = props.linkDelay ?? DEF.linkDelay
        if (delay <= 0 || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) return
        // same tab: let the break play, then follow the link
        const href = (e.currentTarget as HTMLAnchorElement).href
        if (!href) return
        e.preventDefault()
        window.clearTimeout(navTimer.current)
        navTimer.current = window.setTimeout(() => window.location.assign(href), delay * 1000)
    }

    const pressScale = (hover.press ?? 98) / 100
    const th = Math.max(0, props.thickness ?? 5)
    const sideCol = mix(mix(pal.shade, pal.depth, 0.5), "#000000", 0.18)
    const userShadow = (Array.isArray(shadow) ? shadow.join(", ") : shadow) || ""
    const slab = th > 0 ? `0px ${(pressed ? th * 0.3 : th).toFixed(1)}px 0px 0px ${sideCol}` : ""
    const bw = border.width ?? 1
    const focus = hover.focus ?? "#4D8DFF"
    const lightBg = luminance(parseColor(pal.surface)) > 0.5
    const lightText = luminance(parseColor(pal.text)) > 0.5
    const Tag = (hasLink ? "a" : "button") as "a"
    const linkAttrs = hasLink
        ? { href: link, target: newTab ? "_blank" : undefined, rel: newTab ? "noopener noreferrer" : undefined }
        : { type: "button" as const }
    const press = isStatic
        ? {}
        : {
              onPointerDown: () => setPressed(true),
              onPointerUp: () => setPressed(false),
              onPointerLeave: () => setPressed(false),
              onPointerCancel: () => setPressed(false),
          }

    return (
        <Tag
            ref={rootRef as React.Ref<HTMLAnchorElement>}
            className={uid}
            aria-label={label || undefined}
            onClick={onClick}
            {...linkAttrs}
            {...press}
            style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
                padding,
                borderRadius: radius,
                isolation: "isolate",
                border: "none",
                margin: 0,
                font: "inherit",
                textDecoration: "none",
                cursor: "pointer",
                userSelect: "none",
                WebkitUserSelect: "none",
                touchAction: "manipulation",
                background: "transparent",
                boxShadow: [slab, userShadow].filter(Boolean).join(", ") || undefined,
                transform: pressed ? `translateY(${(th * 0.7 + 1).toFixed(1)}px) scale(${pressScale})` : "translateY(0px) scale(1)",
                transition: "transform 0.22s cubic-bezier(0.3, 1.4, 0.5, 1), box-shadow 0.16s ease-out",
                ...style,
            }}
        >
            <span
                ref={haloRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "inherit",
                    pointerEvents: "none",
                    zIndex: -1,
                    opacity: pal.glowAmt > 0 ? REST_GLOW * pal.glowAmt : 0,
                    boxShadow: pal.glowAmt > 0 ? `0 0 46px 2px ${rgba(pal.glow, 0.55)}, 0 0 120px 10px ${rgba(pal.glow, 0.3)}` : "none",
                    willChange: "opacity",
                }}
            />
            <style>{`.${uid}:focus-visible{outline:2px solid ${focus};outline-offset:3px}.${uid}{-webkit-tap-highlight-color:transparent}`}</style>
            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "inherit",
                    overflow: "hidden",
                    pointerEvents: "none",
                    zIndex: 0,
                    // plain CSS stone shows until the first paint and where canvas is unavailable
                    background: `linear-gradient(180deg, ${pal.surface} 0%, ${pal.shade} 100%)`,
                }}
            >
                <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
            </span>
            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "inherit",
                    pointerEvents: "none",
                    zIndex: 1,
                    boxShadow: [
                        bw > 0 ? `inset 0 0 0 ${bw}px ${border.color ?? "rgba(0, 0, 0, 0.1)"}` : "",
                        lightBg ? "" : `inset 0 0 0 1px ${rgba(pal.edge, 0.14)}`,
                        `inset 0 1.5px 0 ${rgba(pal.edge, lightBg ? 0.75 : 0.45)}`,
                        `inset 0 -1.5px 0 rgba(0, 0, 0, ${lightBg ? 0.16 : 0.45})`,
                        `inset 0 -12px 18px -14px rgba(0, 0, 0, ${lightBg ? 0.22 : 0.55})`,
                    ]
                        .filter(Boolean)
                        .join(", "),
                }}
            />
            {!isStatic && (
                <canvas
                    ref={fxRef}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: -FX.side,
                        top: -FX.top,
                        width: `calc(100% + ${FX.side * 2}px)`,
                        height: `calc(100% + ${FX.top + FX.bottom}px)`,
                        display: "none",
                        pointerEvents: "none",
                        zIndex: 3,
                    }}
                />
            )}
            <span
                ref={labelRef}
                style={{
                    position: "relative",
                    zIndex: 2,
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                    color: pal.text,
                    fontSize: DEF.fontSize,
                    fontWeight: 500,
                    letterSpacing: "-0.01em",
                    lineHeight: "1.2em",
                    ...font,
                    textTransform: upper ? "uppercase" : "none",
                    textShadow: lightText ? "0 1px 1.5px rgba(0, 0, 0, 0.3)" : "0 1px 0 rgba(255, 255, 255, 0.55)",
                }}
            >
                {title}
                <span ref={probeRef} aria-hidden="true" style={{ display: "inline-block", width: 0, height: 0 }} />
            </span>
        </Tag>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-auto
 * @framerSupportedLayoutHeight any-prefer-auto
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 64
 * @framerDisableUnlink
 */
export default function CrackButton(props: Props) {
    const isStatic = useIsStaticRenderer()
    return <CrackButtonInner {...props} isStatic={isStatic} />
}

CrackButton.displayName = "Crack Button"

const notCustom = (c: ColorsProps) => c.custom !== true
const autoMat = (m: MaterialProps) => m.auto !== false

addPropertyControls(CrackButton, {
    title: { type: ControlType.String, title: "Title", defaultValue: DEF.title },
    link: { type: ControlType.Link, title: "Link", defaultValue: "" },
    newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false, enabledTitle: "Yes", disabledTitle: "No" },
    linkDelay: {
        type: ControlType.Number,
        title: "Link Delay",
        defaultValue: DEF.linkDelay,
        min: 0,
        max: 2,
        step: 0.05,
        unit: "s",
        description: "Same-tab links wait this long so the break is seen. 0 = at once.",
        hidden: (p: Props) => !p.link || p.newTab === true,
    },
    look: {
        type: ControlType.Enum,
        title: "Look",
        options: LOOKS.map((l) => l.key),
        optionTitles: LOOKS.map((l) => l.title),
        defaultValue: "magma",
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            custom: { type: ControlType.Boolean, title: "Mode", defaultValue: false, enabledTitle: "Custom", disabledTitle: "Look" },
            surface: { type: ControlType.Color, title: "Surface", defaultValue: LOOKS[0].surface, hidden: notCustom },
            shade: { type: ControlType.Color, title: "Shade", defaultValue: LOOKS[0].shade, hidden: notCustom, description: "The lower end of the slab." },
            depth: { type: ControlType.Color, title: "Cracks", defaultValue: LOOKS[0].depth, hidden: notCustom },
            edge: { type: ControlType.Color, title: "Edge Light", defaultValue: LOOKS[0].edge, hidden: notCustom },
            glow: { type: ControlType.Color, title: "Glow", defaultValue: LOOKS[0].glow, hidden: notCustom, description: "The light inside the cracks." },
        },
    },
    material: {
        type: ControlType.Object,
        title: "Material",
        controls: {
            auto: { type: ControlType.Boolean, title: "Finish", defaultValue: true, enabledTitle: "Look", disabledTitle: "Custom" },
            grain: { type: ControlType.Number, title: "Grain", defaultValue: 60, min: 0, max: 100, step: 1, unit: "%", hidden: autoMat },
            veins: { type: ControlType.Number, title: "Veins", defaultValue: 0, min: 0, max: 100, step: 1, unit: "%", hidden: autoMat },
            pores: { type: ControlType.Number, title: "Pores", defaultValue: 60, min: 0, max: 100, step: 1, unit: "%", hidden: autoMat },
            gloss: { type: ControlType.Number, title: "Polish", defaultValue: 25, min: 0, max: 100, step: 1, unit: "%", hidden: autoMat },
            seed: { type: ControlType.Number, title: "Variation", defaultValue: 7, min: 1, max: 99, step: 1, displayStepper: true, description: "Another piece of the same stone." },
        },
    },
    fracture: {
        type: ControlType.Object,
        title: "Break",
        controls: {
            cracks: { type: ControlType.Number, title: "Cracks", defaultValue: 12, min: 3, max: 24, step: 1, description: "Lines running out from the point of impact." },
            rings: { type: ControlType.Number, title: "Rings", defaultValue: 3, min: 1, max: 6, step: 1, description: "More rings, smaller shards." },
            jagged: { type: ControlType.Number, title: "Jagged", defaultValue: 60, min: 0, max: 100, step: 1, unit: "%" },
            reach: { type: ControlType.Number, title: "Reach", defaultValue: 100, min: 0, max: 100, step: 1, unit: "%", description: "100 % breaks the whole button, less keeps it around the press." },
            shift: { type: ControlType.Number, title: "Shift", defaultValue: 55, min: 0, max: 100, step: 1, unit: "%", description: "How far shards move apart." },
            tilt: { type: ControlType.Number, title: "Tilt", defaultValue: 50, min: 0, max: 100, step: 1, unit: "%" },
            facets: { type: ControlType.Number, title: "Facets", defaultValue: 50, min: 0, max: 100, step: 1, unit: "%", description: "Loose shards catch the light differently." },
            glow: { type: ControlType.Number, title: "Glow", defaultValue: 100, min: 0, max: 100, step: 1, unit: "%", description: "Light inside the cracks and around the button (Magma, Volt, Obsidian and custom colors). 0 = plain dark cracks." },
            splinters: { type: ControlType.Number, title: "Splinters", defaultValue: 50, min: 0, max: 100, step: 1, unit: "%", description: "Chips that fly off and fall. 0 = none." },
            hold: { type: ControlType.Number, title: "Hold", defaultValue: 0.35, min: 0, max: 3, step: 0.05, unit: "s" },
            heal: { type: ControlType.Number, title: "Heal", defaultValue: 0.9, min: 0.1, max: 4, step: 0.05, unit: "s" },
        },
    },
    text: {
        type: ControlType.Object,
        title: "Text",
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: DEF.fontSize, variant: "Medium", letterSpacing: "-0.01em", lineHeight: "1.2em" },
            },
            textCase: {
                type: ControlType.Enum,
                title: "Case",
                options: ["none", "upper"],
                optionTitles: ["As Typed", "Uppercase"],
                displaySegmentedControl: true,
                defaultValue: "none",
            },
            colorAuto: { type: ControlType.Boolean, title: "Color", defaultValue: true, enabledTitle: "Auto", disabledTitle: "Custom", description: "Auto follows the look." },
            color: { type: ControlType.Color, title: " ", defaultValue: "#1E1D1B", hidden: (t: TextProps) => t.colorAuto !== false },
        },
    },
    border: {
        type: ControlType.Object,
        title: "Border",
        controls: {
            width: { type: ControlType.Number, title: "Width", defaultValue: 1, min: 0, max: 8, step: 0.5, unit: "px" },
            color: { type: ControlType.Color, title: "Color", defaultValue: "rgba(0, 0, 0, 0.1)", hidden: (b: BorderProps) => b.width === 0 },
        },
    },
    padding: { type: ControlType.Padding, title: "Padding", defaultValue: DEF.padding },
    radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: DEF.radius },
    shadow: { type: ControlType.BoxShadow, title: "Shadow", defaultValue: DEF.shadow },
    thickness: { type: ControlType.Number, title: "Thickness", defaultValue: 5, min: 0, max: 24, step: 1, unit: "px", description: "The visible side of the slab. It sinks in on press." },
    hover: {
        type: ControlType.Object,
        title: "Hover",
        controls: {
            crack: { type: ControlType.Number, title: "Hover Break", defaultValue: 60, min: 0, max: 100, step: 1, unit: "%", description: "The slab already gives way under the pointer and holds until it leaves. A click breaks it fully. 0 = off." },
            stress: { type: ControlType.Number, title: "Stress Lines", defaultValue: 60, min: 0, max: 100, step: 1, unit: "%", description: "Hairline cracks show under the pointer." },
            light: { type: ControlType.Number, title: "Light", defaultValue: 50, min: 0, max: 100, step: 1, unit: "%" },
            press: { type: ControlType.Number, title: "Press Scale", defaultValue: 98, min: 85, max: 100, step: 1, unit: "%" },
            focus: { type: ControlType.Color, title: "Focus Ring", defaultValue: "#4D8DFF" },
        },
    },
    onClick: { type: ControlType.EventHandler },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "",
        placeholder: "Accessible name (optional)",
        description: CREDIT,
    },
})
