/**
 * Liquid Pill Navbar — a simple floating pill navigation whose active indicator moves like one drop of ink:
 * it sets off softly, the round front runs ahead, the rear clings on and follows, the drop pulls into a liquid
 * neck while it stretches, flows back together and wobbles as it lands. A thin line of light runs along its top edge. The active
 * label colour is clipped to the exact drop shape.
 * Built by Matthias Ölschlegel — https://framer.link/fsd2pgh
 */
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


type Item = { title?: string; link?: string; newTab?: boolean }

type FontValue = React.CSSProperties & { [key: string]: unknown }

interface PillStyle {
    fill?: string
    blur?: number
    radius?: string
    padding?: string
    gap?: number
    border?: { borderWidth?: number | string; borderStyle?: string; borderColor?: string } | null
    shadow?: string
}

interface IndicatorStyle {
    fill?: string
    text?: string
    radius?: string
    gloss?: number
    shadow?: boolean
}

interface HoverStyle {
    effect?: "liquid" | "pill" | "none"
    /** v1–v3: on/off switch for the hover pill. */
    show?: boolean
    returnDelay?: number
    markActive?: boolean
    fill?: string
    text?: string
}

interface LiquidStyle {
    style?: "liquid" | "slide"
    amount?: number
    wobble?: number
    goo?: number
    speed?: number
    delay?: number
    /** v5–v6: droplets behind the drop (ignored since v7). */
    droplets?: number
}

interface Props {
    items?: Item[]
    active?: number
    matchPage?: boolean
    font?: FontValue
    color?: string
    itemPadding?: string
    pill?: PillStyle
    indicator?: IndicatorStyle
    hover?: HoverStyle
    liquid?: LiquidStyle
    style?: React.CSSProperties
}

const DEFAULT_ITEMS: Item[] = [
    { title: "Home", link: "", newTab: false },
    { title: "Work", link: "", newTab: false },
    { title: "About", link: "", newTab: false },
    { title: "Contact", link: "", newTab: false },
]

const STORE_KEY = "liquid-pill-nav:last"

/** Layout effect in the browser, a plain effect on the server (no SSR warning). */
const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function firstPx(value: string | number | undefined, fallback: number): number {
    if (typeof value === "number") return value
    if (!value) return fallback
    const n = parseFloat(String(value))
    return isFinite(n) ? n : fallback
}

/** Accepts 1–4 values (also Framer's per-side form) and always returns four valid lengths. */
function normPadding(value: string | number | undefined, fallback: string): string {
    if (typeof value === "number") return `${value}px`
    const parts = String(value ?? "")
        .trim()
        .split(/\s+/)
        .filter((t) => /^-?\d*\.?\d+(px|em|rem|%)?$/.test(t))
        .map((t) => (/^-?\d*\.?\d+$/.test(t) ? `${t}px` : t))
    if (parts.length === 0) return fallback
    const [t, r = t, b = t, l = r] = parts
    return `${t} ${r} ${b} ${l}`
}

function clamp(v: number, a: number, b: number) {
    return v < a ? a : v > b ? b : v
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t
}

function approach(v: number, to: number, maxStep: number) {
    return v < to ? Math.min(v + maxStep, to) : Math.max(v - maxStep, to)
}

function normPath(p: string) {
    const s = p.replace(/\/+$/, "")
    return s === "" ? "/" : s
}

function linkMatchesPage(link: string | undefined): boolean {
    if (!link || typeof window === "undefined") return false
    try {
        const url = new URL(link, window.location.href)
        if (url.origin !== window.location.origin) return false
        if (url.hash && normPath(url.pathname) === normPath(window.location.pathname)) {
            return url.hash === window.location.hash
        }
        return normPath(url.pathname) === normPath(window.location.pathname)
    } catch {
        return false
    }
}

function readStore(): { key: string; index: number } | null {
    try {
        const raw = window.sessionStorage.getItem(STORE_KEY)
        if (!raw) return null
        const v = JSON.parse(raw)
        return typeof v?.index === "number" && typeof v?.key === "string" ? v : null
    } catch {
        return null
    }
}

function writeStore(key: string, index: number) {
    try {
        window.sessionStorage.setItem(STORE_KEY, JSON.stringify({ key, index }))
    } catch {
        /* storage blocked: the next page simply starts at rest */
    }
}

/** Red, green, blue (0–255) and alpha of a hex or rgb() colour; null for anything else (colour tokens, names). */
function parseColor(color: string): [number, number, number, number] | null {
    const c = color.trim()
    const hex = /^#([0-9a-f]{3,8})$/i.exec(c)
    if (hex && hex[1].length !== 5 && hex[1].length !== 7) {
        let x = hex[1]
        if (x.length <= 4) x = x.replace(/./g, (ch) => ch + ch)
        const n = (i: number) => parseInt(x.slice(i, i + 2), 16)
        return [n(0), n(2), n(4), x.length === 8 ? n(6) / 255 : 1]
    }
    const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+)(%?))?\s*\)$/i.exec(c)
    if (rgb) return [+rgb[1], +rgb[2], +rgb[3], rgb[4] === undefined ? 1 : parseFloat(rgb[4]) / (rgb[5] ? 100 : 1)]
    return null
}

/** A colour at reduced opacity: hex and rgb() exactly, anything else (colour tokens, names) through color-mix. */
function withAlpha(color: string, alpha: number): string {
    const a = clamp(alpha, 0, 1)
    const p = parseColor(color)
    if (p) return `rgba(${p[0]}, ${p[1]}, ${p[2]}, ${+(p[3] * a).toFixed(3)})`
    return `color-mix(in srgb, ${color.trim()} ${Math.round(a * 1000) / 10}%, transparent)`
}

/**
 * Relative luminance (0 black … 1 white) of a hex or rgb() colour, or of a colour token's fallback
 * (`var(--token, rgb(…))`); null when it cannot be read.
 */
function luminance(color: string): number | null {
    const token = /^var\(\s*--[^,]+,\s*(.+)\)$/.exec(color.trim())
    const p = parseColor(token ? token[1] : color)
    if (!p) return null
    const lin = (v: number) => (v <= 10.31 ? v / 3294.6 : Math.pow((v / 255 + 0.055) / 1.055, 2.4))
    return 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2])
}

/** clip-path plus its -webkit- form. */
function setClip(el: HTMLElement | null, clip: string) {
    if (!el) return
    el.style.clipPath = clip
    ;(el.style as CSSStyleDeclaration & { webkitClipPath?: string }).webkitClipPath = clip
}

/** The drop is drawn as HTML layers clipped to its outline, so fill, light and labels share one exact edge. */
function supportsPathClip(): boolean {
    try {
        const p = 'path("M0 0L4 0L4 4Z")'
        return typeof CSS !== "undefined" && (CSS.supports("clip-path", p) || CSS.supports("-webkit-clip-path", p))
    } catch {
        return false
    }
}

type Rect = { x: number; w: number; y: number; h: number }

/** Damped spring for the hover pill, integrated with fixed sub-steps. */
type Spring = { x: number; v: number; k: number; z: number }

function stepSpring(s: Spring, target: number, dt: number) {
    const c = 2 * s.z * Math.sqrt(s.k)
    const a = -s.k * (s.x - target) - c * s.v
    s.v += a * dt
    s.x += s.v * dt
}

type Body = { x: number; v: number }

/** A push passed on in two stages: `a` still waits, `b` is flowing into its body. */
type Pulse = { a: number; b: number }

/**
 * What of a push reaches its body in this sub-step (`f` = 1 − e^(−dt/τ) per stage). Through two stages it arrives
 * softly: from nothing, strongest after τ and nearly all within 4 τ, so the body speeds up without a step.
 */
function pulse(p: Pulse, f: number): number {
    const out = p.b * f
    const flow = p.a * f
    p.a -= flow
    p.b += flow - out
    return out
}

/** One semi-implicit step of a damped value towards `to` (ω in rad/s). */
function stepBody(b: Body, to: number, w: number, z: number, dt: number) {
    b.v += (-w * w * (b.x - to) - 2 * z * w * b.v) * dt
    b.x += b.v * dt
}

/**
 * One physical end of the drop. `arm`: it is braked when it runs past its target; `base`: how far past its new
 * target it already was when that target was set (from there it may run on only a little).
 */
type End = { x: number; v: number; arm: boolean; base: number }

interface Drop {
    rects: Rect[]
    /** How far the drop may reach at the ends of the row (3 px inside the glass). */
    minX: number
    maxX: number
    L: End
    R: End
    /** Where the ends' springs pull: the target item's edges, reached softly (see stepDrop). */
    FL: Body
    FR: Body
    /** Rest width, smoothed so a new target never changes the shape in one frame. */
    W: Body
    /**
     * Landing squash of each end (relative length change, never above 0), kicked once per move and shared out by how
     * fast each end closes in (on a plain landing the rear; on a reversal often the head). Each end's squash springs
     * back on its own (`backL`, `backR` once it rebounds), so a new move never shifts a squash to the other end.
     */
    QL: Body
    QR: Body
    /** The landing's push on each squash, still on its way (see `pulse`). */
    KL: Pulse
    KR: Pulse
    backL: boolean
    backR: boolean
    kick: boolean
    /**
     * The left end's share of the hidden stretch (what the soft caps do not show). It follows how far each end reaches
     * past its target (`cutS`; while neither does, it keeps its last value): the lagging rear takes it, on a reversal
     * also the end that ran past its edge, and an end coming home sheds it as it arrives. A new target moves the split;
     * `cutT` takes up the difference and fades out smoothly, so the drop never jumps.
     */
    cutL: number
    cutS: number
    cutT: Body
    /** Largest stretch of the current move (px). */
    peak: number
    /** The rear stiffens once the head is home (0…1), so it catches up instead of creeping in. */
    ramp: number
    /** Light: slosh along the drop (px) and speed light (0…1); `vc` is the last centre speed. */
    P: Body
    G: Body
    vc: number
    /** Press swell (0…1) and whether the pointer is down on the drop. */
    S: Body
    press: number
    /**
     * Soft caps on the visible stretch (px): by travel distance, and a tighter one during fast hover sweeps (it is
     * lifted only once the drop rests). Mid-flight the travel cap glides to a new move's value, and so does the target
     * width it counts from (`rw`), so a new target never changes the shape abruptly.
     */
    cap: Body
    capTo: number
    sweep: number
    sweepTo: number
    rw: Body
    /** Drop time (s) and when the last move began. */
    time: number
    lastMove: number
    /** Travel direction and the cross-faded role: lead 1 = right end leads, 0 = left end leads. */
    dir: number
    lead: number
    /** Deformation (hover moves HOVER_AMOUNT, everything else 1), cross-faded. */
    amt: number
    amtTo: number
}

/** Physics sub-step. The landing squash needs ≥ 1 kHz: coarser semi-implicit steps damp it numerically. */
const SUB_STEP = 1 / 1000

/** Hover moves deform this much of a click. */
const HOVER_AMOUNT = 0.9

/**
 * The liquid drop runs at this share of Motion › Speed: calm enough that the stretch and the neck stay in view for
 * about 200 ms and a long jump moves no more than about 40 px per 60 Hz frame. (Slide keeps v6's pace.)
 */
const LIQUID_PACE = 0.85

/** Each of the landing push's two stages (s at Speed 1): the squash builds up within about 30 ms. */
const KICK_STAGE = 0.008

/** Extra braking an end needs to stop within `stop` of its target; only what its own spring does not give. */
function brakeNeed(over: number, vOut: number, stop: number, springBrake: number, dt: number): number {
    if (vOut <= 0) return 0
    const left = Math.max(stop - over, 0.02)
    // Never more than stops it within this sub-step, so the brake cannot throw it back.
    return Math.min(Math.max(0, (vOut * vOut) / (2 * left) - springBrake), vOut / dt)
}

/**
 * One end's landing squash (relative to the drop's length `len`): ≈ 5.4 Hz, softer with more Wobble (`wobble` 0…1),
 * so the drop squashes, rings once a little past rest and settles like a liquid. On the way back it never passes its
 * end while that is still coming home (`home` px past its edge, closing at `pace` px/s; after a reversal the end comes
 * back from past its edge): it eases in behind the end, at the end's pace plus a rate that shrinks with the distance
 * left, so the end settles from inside instead of stepping out again, and never stops dead. Returns whether the
 * squash is on its way back.
 */
function stepSquash(Q: Body, back: boolean, home: number, pace: number, len: number, h: number, s: number, wobble: number, dt: number) {
    const q0 = Q.x
    stepBody(Q, 0, 34 * s, back ? lerp(0.8, 0.34, wobble) : lerp(0.45, 0.3, wobble), dt)
    const rebound = back || (Q.x < 0 && Q.v > 0)
    const ring = 0.035 * wobble
    if (Q.x > ring) {
        Q.x = ring
        if (Q.v > 0) Q.v = 0
    } else if (Q.x < -0.16) {
        Q.x = -0.16
        if (Q.v < 0) Q.v = 0
    }
    if (rebound && q0 < 0 && home < 0.25 * h) {
        const vMax = Math.max(0, pace / len) + 60 * s * Math.max(-home / len - q0, 0)
        if (Q.v > vMax) {
            Q.v = vMax
            Q.x = q0 + vMax * dt
        }
    }
    return rebound
}

/**
 * Physics of the drop. Both ends are springs to the edges of the target item: the leading end is quick with a
 * little overshoot, the trailing end slower, so the drop stretches from the front and the stretch follows from
 * motion alone (more on long jumps, barely on short ones). Once the head is home the rear stiffens and catches up
 * with momentum; its closing speed gives the squash one soft push (the landing). Without liquid it is a rigid pill.
 */
function stepDrop(S: Drop, r: Rect, dt: number, liquid: number, s: number, wobble: number) {
    const h = Math.max(r.h, 1)
    const TL = r.x
    const TR = r.x + r.w
    S.time += dt
    S.amt += (S.amtTo - S.amt) * (1 - Math.exp(-dt / 0.02))
    // Roles swap only when the drop as a whole turns around; the cross-fade keeps every end continuous.
    const vc = (S.L.v + S.R.v) / 2
    if (S.dir * vc < -0.4 * h) S.dir = -S.dir
    S.lead = approach(S.lead, S.dir > 0 ? 1 : 0, dt / 0.05)
    const lr = S.lead
    const ll = 1 - lr
    // How far the leading end still is from its edge.
    const gap = lr * Math.abs(TR - S.R.x) + ll * Math.abs(S.L.x - TL)
    let wH: number, zH: number, wT: number, zT: number
    if (liquid <= 0) {
        // A rigid pill (Style › Slide, Liquid 0): both ends on v6's critically damped spring, at v6's pace.
        wH = wT = 16.1 * s
        zH = zT = 1
    } else {
        // Home stretch: once the head is close to its edge both ends firm up (ω 36, ζ 0.9), so the rear catches up
        // with momentum instead of creeping in and the last pixels settle quickly.
        if (gap < 0.2 * h) S.ramp = approach(S.ramp, 1, dt / 0.04)
        wH = lerp(28, 36, S.ramp) * s
        zH = lerp(Math.max(0.74, 1 - 0.3 * liquid), 0.9, S.ramp)
        wT = lerp(28 * (1 - 0.55 * liquid), 36, S.ramp) * s
        zT = lerp(0.84, 0.9, S.ramp)
    }
    const wR = lerp(wT, wH, lr)
    const zR = lerp(zT, zH, lr)
    const wL = lerp(wT, wH, ll)
    const zL = lerp(zT, zH, ll)
    // The springs pull towards edges that glide to the new item within ≈ 30 ms (critically damped), so the drop sets
    // off from standstill and turns on a new target without a jolt. A rigid pill pulls straight to the edges, like v6.
    stepBody(S.FL, TL, 110 * s, 1, dt)
    stepBody(S.FR, TR, 110 * s, 1, dt)
    const fl = liquid > 0 ? S.FL.x : TL
    const fr = liquid > 0 ? S.FR.x : TR
    let aR = -wR * wR * (S.R.x - fr) - 2 * zR * wR * S.R.v
    let aL = -wL * wL * (S.L.x - fl) - 2 * zL * wL * S.L.v
    // An end running past its item (the head on arrival, any end after a new target) stops within 0.15 h beyond it,
    // or beyond where it already was, and always inside the glass. A rigid pill moves exactly like v6's: no brake.
    const oR = S.R.x - TR
    const oL = TL - S.L.x
    if (oR <= 0) S.R.base = 0
    if (oL <= 0) S.L.base = 0
    if (liquid > 0 && S.R.arm && oR > 0) aR -= brakeNeed(oR, S.R.v, Math.min(S.maxX - TR, S.R.base + 0.15 * h), -aR, dt)
    if (liquid > 0 && S.L.arm && oL > 0) aL += brakeNeed(oL, -S.L.v, Math.min(TL - S.minX, S.L.base + 0.15 * h), aL, dt)
    // A liquid barely compresses: pushed shorter than its rest width (a rear catching up hard, a reversal), its ends
    // push apart firmly, so the drop is never squeezed out of shape behind the scenes.
    const squeeze = S.W.x - (S.R.x - S.L.x)
    if (liquid > 0 && squeeze > 0) {
        const wc = 60 * s
        const f = wc * wc * squeeze - 2 * 0.9 * wc * Math.min(S.R.v - S.L.v, 0)
        aR += f / 2
        aL -= f / 2
    }
    S.R.v += aR * dt
    S.R.x += S.R.v * dt
    S.L.v += aL * dt
    S.L.x += S.L.v * dt
    if (S.R.x > S.maxX) {
        S.R.x = S.maxX
        if (S.R.v > 0) S.R.v = 0
    }
    if (S.L.x < S.minX) {
        S.L.x = S.minX
        if (S.L.v < 0) S.L.v = 0
    }
    // Never inside out, even when the row shrinks under a moving drop.
    if (S.R.x < S.L.x + 1) {
        const m = clamp((S.L.x + S.R.x) / 2, S.minX + 0.5, Math.max(S.maxX - 0.5, S.minX + 0.5))
        S.L.x = m - 0.5
        S.R.x = m + 0.5
        S.L.v = S.R.v = (S.L.v + S.R.v) / 2
    }
    // Where the drop reaches past its target takes the hidden stretch (see cutL).
    // The split follows smoothly (≈ 25 ms), so an end crossing its edge never shifts the drop within a frame.
    const pastL = Math.max(TL - S.L.x, 0)
    const pastR = Math.max(S.R.x - TR, 0)
    if (pastL + pastR > 0.05) S.cutS += (pastL / (pastL + pastR) - S.cutS) * (1 - Math.exp(-dt / 0.025))
    stepBody(S.cutT, 0, 45, 1, dt)
    S.cutL = clamp(S.cutS + S.cutT.x, 0, 1)
    stepBody(S.W, r.w, 30 * s, 1, dt)
    const W = Math.max(S.W.x, 1)
    stepBody(S.cap, S.capTo, 30 * s, 1, dt)
    stepBody(S.rw, r.w, 60 * s, 1, dt)
    S.sweep += (S.sweepTo - S.sweep) * (1 - Math.exp(-dt / 0.04))
    // Landing: late in the contraction, with the head home, the closing speed kicks the ends' squash once.
    const E = S.R.x - S.L.x - W
    if (E > S.peak) S.peak = E
    const closing = S.L.v - S.R.v
    if (liquid > 0 && S.kick && S.peak > 0.04 * W && E < 0.25 * S.peak && closing > 0 && gap < 0.25 * h) {
        // The squash goes to the end that is closing in, and starts once that end is nearly home, so it peaks as the
        // end arrives.
        const inL = Math.max(S.L.v, 0)
        const inR = Math.max(-S.R.v, 0)
        const qL = inL + inR > 0 ? inL / (inL + inR) : S.lead
        if (qL * pastL + (1 - qL) * pastR < 0.25 * h) {
            const k = Math.min(7 * wobble * S.amt * Math.sqrt((s * closing) / W), 9 * s)
            S.kick = false
            S.KL.a += k * qL
            S.KR.a += k * (1 - qL)
            if (qL > 0.02) S.backL = false
            if (qL < 0.98) S.backR = false
        }
    }
    // The push reaches the squash softly (see KICK_STAGE), so the closing end flows in instead of clicking in.
    const kf = 1 - Math.exp((-dt * s) / KICK_STAGE)
    S.QL.v -= pulse(S.KL, kf)
    S.QR.v -= pulse(S.KR, kf)
    const len = Math.max(S.R.x - S.L.x, 1)
    S.backL = stepSquash(S.QL, S.backL, pastL, S.L.v, len, h, s, wobble, dt)
    S.backR = stepSquash(S.QR, S.backR, pastR, -S.R.v, len, h, s, wobble, dt)
    // Light: it lags when the drop sets off and surges forward when it brakes, like the surface of a liquid, and
    // brightens a little with speed. Both settle with the body; long drops slosh no further than 0.2 h.
    const acc = (vc - S.vc) / dt
    S.vc = vc
    const slosh = -0.16 * (W + Math.max(E, 0)) * Math.tanh(acc / (1500 * h * s * s))
    stepBody(S.P, Math.sign(slosh) * softCap(Math.abs(slosh), 0.2 * h, 8), 26 * s, 0.7, dt)
    const vHead = lr * Math.abs(S.R.v) + ll * Math.abs(S.L.v)
    stepBody(S.G, Math.tanh(vHead / (50 * h * s)), 30 * s, 1, dt)
    // Pressing the drop swells it a little; letting go relaxes it.
    stepBody(S.S, S.press, S.press ? 50 : 28, 1, dt)
}

const f2 = (n: number) => n.toFixed(2)

/** Soft limit: about linear up to `c`, never beyond it (a larger `n` keeps it linear for longer). */
function softCap(e: number, c: number, n = 4) {
    return e <= 0 ? e : e / Math.pow(1 + Math.pow(e / Math.max(c, 0.01), n), 1 / n)
}

/**
 * The drop's current geometry: its ends, the axis, its height, how far its flanks swell (px) and which end leads
 * (`lead` 1: the right one). `corner` ≥ 0: a rounded rectangle with this corner radius instead of a capsule.
 */
interface Geo {
    xl: number
    xr: number
    cy: number
    H: number
    lead: number
    swell: number
    /** Liquid neck: how deep it pinches each flank (px), where (0 rear circle … 1 head circle) and how wide (same unit). */
    neck: number
    neckAt: number
    neckW: number
    corner: number
}

/** The swell leans this much towards the head: it peaks 43 % behind it and stays convex all along the flank. */
const SKEW = 0.8
const PEAK = (2 * SKEW - 2 + Math.sqrt((2 * SKEW - 2) * (2 * SKEW - 2) + 12 * SKEW)) / (6 * SKEW)
const NORM = 1 / (PEAK * (1 - PEAK) * (1 + SKEW * PEAK))

/** The swell along the flank (u = 0 at the rear circle, 1 at the head's): value 0…1 and slope, 0 at both ends. */
function swellAt(u: number, o: number[], at: number) {
    o[at] = NORM * u * (1 - u) * (1 + SKEW * u)
    o[at + 1] = NORM * (1 + (2 * SKEW - 2) * u - 3 * SKEW * u * u)
}

const SEG = 12
const pts = new Float64Array((SEG + 1) * 4)
const sw = [0, 0, 0, 0]

/**
 * Samples the upper edge of the drop shrunk by `inset`: the envelope of circles along the axis whose radius is the
 * end radius plus the swell, so it meets both end circles tangentially and shrinks exactly (an inner offset is the
 * same envelope with smaller circles). Writes x, y and the unit tangent per sample into `pts`; returns false when the
 * edge is straight (the capsule).
 */
function sampleTop(g: Geo, inset: number, cL: number, cR: number): boolean {
    const curved = g.swell > 1e-3 || g.neck > 1e-3
    const span = Math.max(cR - cL, 1e-3)
    for (let i = 0; i <= SEG; i++) {
        const u = i / SEG
        let r = g.H / 2 - inset
        let dr = 0
        if (curved) {
            // The swell leans towards whichever end leads; the roles cross-fade, so it never jumps sides. Its slope
            // stays gentle (draw() gives short flanks less swell), so the envelope always exists.
            swellAt(u, sw, 0)
            swellAt(1 - u, sw, 2)
            r += g.swell * lerp(sw[2], sw[0], g.lead)
            dr = (g.swell * lerp(-sw[3], sw[1], g.lead)) / span
            // The neck: a smooth dip (biweight) that leaves both ends round; draw() keeps it wide enough for its depth,
            // so the outline never folds over.
            const x = (u - g.neckAt) / Math.max(g.neckW, 1e-3)
            if (g.neck > 0 && Math.abs(x) < 1) {
                const b = 1 - x * x
                r -= g.neck * b * b
                dr += (4 * g.neck * x * b) / (Math.max(g.neckW, 1e-3) * span)
            }
            dr = clamp(dr, -0.6, 0.6)
        }
        const q = Math.sqrt(Math.max(1 - dr * dr, 0))
        pts[i * 4] = cL + u * span - r * dr
        pts[i * 4 + 1] = g.cy - r * q
        pts[i * 4 + 2] = q
        pts[i * 4 + 3] = -dr
    }
    return curved
}

/** One flank through the samples as cubics: along the top or mirrored to the bottom, forwards or backwards. */
function flank(cy: number, ox: number, oy: number, mirror: boolean, back: boolean): string {
    let d = ""
    const sg = back ? -1 : 1
    const Y = (y: number) => f2((mirror ? 2 * cy - y : y) + oy)
    for (let k = 0; k < SEG; k++) {
        const i = back ? SEG - k : k
        const j = back ? i - 1 : i + 1
        const ax = pts[i * 4]
        const ay = pts[i * 4 + 1]
        const bx = pts[j * 4]
        const by = pts[j * 4 + 1]
        const c = Math.hypot(bx - ax, by - ay) / 3
        d +=
            `C${f2(ax + sg * c * pts[i * 4 + 2] + ox)} ${Y(ay + sg * c * pts[i * 4 + 3])} ` +
            `${f2(bx - sg * c * pts[j * 4 + 2] + ox)} ${Y(by - sg * c * pts[j * 4 + 3])} ${f2(bx + ox)} ${Y(by)}`
    }
    return d
}

/**
 * The drop outline, shrunk by `inset` and shifted by (ox, oy). Both ends are circles of the same radius, each drawn
 * as two arcs of at most 90° (no large-arc flag that could flip), joined above and below by the swelling flanks; top
 * and bottom mirror each other, so the drop never leans or wedges. At rest it is exactly a CSS capsule. With a smaller
 * Indicator › Radius it is a rounded rectangle.
 */
function outlinePath(g: Geo, inset: number, ox: number, oy: number): string {
    const { xl, xr, cy } = g
    const X = (x: number) => f2(x + ox)
    const Y = (y: number) => f2(y + oy)
    const B = (y: number) => f2(2 * cy - y + oy)
    if (g.corner >= 0) {
        const k = Math.max(g.corner - inset, 0)
        const l = xl + inset
        const r = xr - inset
        const t = cy - g.H / 2 + inset
        const b = cy + g.H / 2 - inset
        // Square corners (Radius 0) are plain lines, so the label clip serialises exactly like the fill in every engine.
        const corner = (x: number, y: number) => (k < 0.005 ? `L${X(x)} ${Y(y)}` : `A${f2(k)} ${f2(k)} 0 0 1 ${X(x)} ${Y(y)}`)
        return (
            `M${X(l + k)} ${Y(t)}L${X(r - k)} ${Y(t)}${corner(r, t + k)}L${X(r)} ${Y(b - k)}${corner(r - k, b)}` +
            `L${X(l + k)} ${Y(b)}${corner(l, b - k)}L${X(l)} ${Y(t + k)}${corner(l + k, t)}Z`
        )
    }
    const rad = g.H / 2
    const curved = sampleTop(g, inset, xl + rad, xr - rad)
    const x0 = pts[0]
    const y0 = pts[1]
    const xN = pts[SEG * 4]
    const yN = pts[SEG * 4 + 1]
    const a = f2(rad - inset)
    return (
        `M${X(x0)} ${Y(y0)}${curved ? flank(cy, ox, oy, false, false) : `L${X(xN)} ${Y(yN)}`}` +
        `A${a} ${a} 0 0 1 ${X(xr - inset)} ${Y(cy)}A${a} ${a} 0 0 1 ${X(xN)} ${B(yN)}` +
        `${curved ? flank(cy, ox, oy, true, true) : `L${X(x0)} ${B(y0)}`}` +
        `A${a} ${a} 0 0 1 ${X(xl + inset)} ${Y(cy)}A${a} ${a} 0 0 1 ${X(x0)} ${Y(y0)}Z`
    )
}

/**
 * The meniscus: a thin band (`width` px, `inset` px inside the edge) along the top flank and its mirror along the
 * bottom, between the centres of the end circles. Its light fades out before the caps, so the band's ends never show.
 */
function bandPath(g: Geo, inset: number, width: number, ox: number, oy: number): string {
    const { cy } = g
    const X = (x: number) => f2(x + ox)
    const Y = (y: number) => f2(y + oy)
    const B = (y: number) => f2(2 * cy - y + oy)
    if (g.corner >= 0) {
        const a = X(g.xl + g.corner)
        const b = X(g.xr - g.corner)
        const t1 = Y(cy - g.H / 2 + inset)
        const t2 = Y(cy - g.H / 2 + inset + width)
        const b1 = B(cy - g.H / 2 + inset)
        const b2 = B(cy - g.H / 2 + inset + width)
        return `M${a} ${t1}L${b} ${t1}L${b} ${t2}L${a} ${t2}ZM${a} ${b2}L${b} ${b2}L${b} ${b1}L${a} ${b1}Z`
    }
    const cL = g.xl + g.H / 2
    const cR = g.xr - g.H / 2
    // The outer edge forwards and the inner edge backwards, along the top; the bottom band is their mirror image.
    const curved = sampleTop(g, inset, cL, cR)
    const o0 = `${X(pts[0])} ${Y(pts[1])}`
    const oN = `${X(pts[SEG * 4])} ${Y(pts[SEG * 4 + 1])}`
    const ob0 = `${X(pts[0])} ${B(pts[1])}`
    const obN = `${X(pts[SEG * 4])} ${B(pts[SEG * 4 + 1])}`
    const outerTop = curved ? flank(cy, ox, oy, false, false) : `L${oN}`
    const outerBottomBack = curved ? flank(cy, ox, oy, true, true) : `L${ob0}`
    sampleTop(g, inset + width, cL, cR)
    const i0 = `${X(pts[0])} ${Y(pts[1])}`
    const iN = `${X(pts[SEG * 4])} ${Y(pts[SEG * 4 + 1])}`
    const ib0 = `${X(pts[0])} ${B(pts[1])}`
    const ibN = `${X(pts[SEG * 4])} ${B(pts[SEG * 4 + 1])}`
    const innerTopBack = curved ? flank(cy, ox, oy, false, true) : `L${i0}`
    const innerBottom = curved ? flank(cy, ox, oy, true, false) : `L${ibN}`
    return `M${o0}${outerTop}L${iN}${innerTopBack}ZM${ib0}${innerBottom}L${obN}${outerBottomBack}Z`
}

/**
 * Light on the drop (alphas × Gloss): a crisp meniscus line just inside the top edge that fades out before the caps,
 * a faint return line along the bottom, and a narrow sheen over the top 30 %. No rim around the caps. A light ink
 * cannot catch white light: there the lines turn into a faint shade (`shade` × the alphas) and the sheen is left out.
 */
const LIGHT = { inset: 0.5, width: 0.75, top: 0.7, bottom: 0.18, sheen: 0.08, sheenDepth: 0.3, fade: 0.25, shade: 0.35 }

/**
 * A light line across a tile: clear at both ends, full over the middle half. `shift` (a fraction of the tile) moves
 * the bright middle along the line while both ends stay clear.
 */
function lineImage(alpha: number, ink: string, shift = 0) {
    const c = (a: number) => `rgba(${ink}, ${+clamp(a, 0, 1).toFixed(3)})`
    const a = +((LIGHT.fade + shift) * 100).toFixed(2)
    const b = +((1 - LIGHT.fade + shift) * 100).toFixed(2)
    return `linear-gradient(90deg, ${c(0)} 0%, ${c(alpha)} ${a}%, ${c(alpha)} ${b}%, ${c(0)} 100%)`
}

/** The sheen: light from above on the top of the drop, gone by the bottom of its tile. */
function sheenImage(alpha: number) {
    return `linear-gradient(180deg, rgba(255, 255, 255, ${+clamp(alpha, 0, 1).toFixed(3)}) 0%, rgba(255, 255, 255, 0) 100%)`
}

/**
 * Drop layers reach up to this far past the row, so a drop pressed against the glass is never cut by its layer box,
 * but never past the glass's outer edge (they would widen the page).
 */
const LAYER_PAD = 10

/** The write cache of one nav when nothing is written yet. */
const EMPTY_OUT = { d: "", band: "", size: "", pos: "", img: "", sheen: "", op: "", shadow: "", hover: "", pad: "" }

/**
 * What both renderers take from the props: resolved values and the styles of the glass, the row, the labels and the
 * still pill (the static renderer and the first paint show the drop at rest with the same light and shadow).
 */
function resolve(props: Props) {
    const {
        items: rawItems,
        active = 1,
        font,
        color = "rgba(17, 17, 17, 0.62)",
        itemPadding: rawItemPadding,
        pill = {},
        indicator = {},
        style,
    } = props
    const itemPadding = normPadding(rawItemPadding, "10px 18px 10px 18px")
    const items = rawItems && rawItems.length > 0 ? rawItems : DEFAULT_ITEMS
    const count = items.length
    const fallbackIndex = clamp(Math.round(active) - 1, 0, count - 1)

    const pillBlur = pill.blur ?? 18
    const pillGap = pill.gap ?? 2
    const border = pill.border
    const borderWidth = border ? firstPx(border.borderWidth as string | number, 0) : 0

    const indFill = indicator.fill ?? "#111111"
    const indText = indicator.text ?? "#FFFFFF"
    const indRadius = indicator.radius ?? "999px"
    const indShadow = indicator.shadow ?? true
    const gloss = clamp((indicator.gloss ?? 60) / 100, 0, 1)

    const navStyle: React.CSSProperties = {
        ...style,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        padding: normPadding(pill.padding, "5px 5px 5px 5px"),
        borderRadius: pill.radius ?? "999px",
        background: pill.fill ?? "rgba(255, 255, 255, 0.72)",
        backdropFilter: pillBlur > 0 ? `blur(${pillBlur}px) saturate(1.6)` : undefined,
        WebkitBackdropFilter: pillBlur > 0 ? `blur(${pillBlur}px) saturate(1.6)` : undefined,
        boxShadow: pill.shadow ?? "0px 10px 30px -10px rgba(0, 0, 0, 0.25), 0px 1px 2px 0px rgba(0, 0, 0, 0.06)",
        border:
            border && borderWidth > 0
                ? `${borderWidth}px ${border.borderStyle ?? "solid"} ${border.borderColor ?? "rgba(0,0,0,0.08)"}`
                : undefined,
    }

    const fontStyle: React.CSSProperties = {
        fontFamily: "inherit",
        fontSize: 15,
        fontWeight: 500,
        letterSpacing: "-0.01em",
        lineHeight: "1.2em",
        ...(font as React.CSSProperties),
    }

    const labelBase: React.CSSProperties = {
        ...fontStyle,
        padding: itemPadding,
        borderRadius: indRadius,
        whiteSpace: "nowrap",
        flex: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        textDecoration: "none",
        position: "relative",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTapHighlightColor: "transparent",
    }

    const rowStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        gap: pillGap,
        position: "relative",
    }

    // The light (alphas × Gloss). On a light ink (white, pastels) it is a faint shade instead, and the shadow is neutral:
    // a shadow in the ink's own colour would glow.
    const lightInk = (luminance(indFill) ?? 0) > 0.6
    const ink = lightInk ? "0, 0, 0" : "255, 255, 255"
    const lineTop = LIGHT.top * gloss * (lightInk ? LIGHT.shade : 1)
    const lineBottom = LIGHT.bottom * gloss * (lightInk ? LIGHT.shade : 1)
    const sheen = lightInk ? 0 : LIGHT.sheen * gloss

    // The still pill: a plain capsule with the light and shadow of the drop at rest. The meniscus runs between the cap
    // centres like the live one; their radius comes from the expected item height.
    const fs = firstPx(fontStyle.fontSize as string | number, 15)
    const lh = String(fontStyle.lineHeight)
    let lhPx = firstPx(lh, 1.2 * fs)
    if (typeof fontStyle.lineHeight === "number") lhPx = fontStyle.lineHeight * fs
    else if (/em$/.test(lh)) lhPx = parseFloat(lh) * fs
    else if (/%$/.test(lh)) lhPx = (parseFloat(lh) / 100) * fs
    const padY = itemPadding.split(" ").map((t) => (/em$/.test(t) ? parseFloat(t) * fs : firstPx(t, 0)))
    const capR = Math.min(firstPx(indRadius, 999), ((isFinite(lhPx) ? lhPx : 1.2 * fs) + padY[0] + padY[2]) / 2)
    const at = (f: number) => `calc(${f2(capR * (1 - 2 * f))}px + ${f * 100}%)`
    const stillLine = (alpha: number) => {
        const c = (x: number) => `rgba(${ink}, ${+clamp(x, 0, 1).toFixed(3)})`
        return `linear-gradient(90deg, ${c(0)} ${at(0)}, ${c(alpha)} ${at(LIGHT.fade)}, ${c(alpha)} ${at(1 - LIGHT.fade)}, ${c(0)} ${at(1)})`
    }
    const { inset, width } = LIGHT
    const stillFill =
        gloss > 0
            ? [
                  ...(sheen > 0 ? [`${sheenImage(sheen)} 0px 0px / 100% ${LIGHT.sheenDepth * 100}% no-repeat`] : []),
                  `${stillLine(lineTop)} 0px ${inset}px / 100% ${width}px no-repeat`,
                  `${stillLine(lineBottom)} 0px calc(100% - ${inset}px) / 100% ${width}px no-repeat`,
                  indFill,
              ].join(", ")
            : indFill
    const shadowColor = lightInk ? "rgba(0, 0, 0, 0.18)" : withAlpha(indFill, 0.14)
    const shadow = indShadow ? `0px 2px 11px 0px ${shadowColor}` : undefined

    return {
        items,
        count,
        fallbackIndex,
        itemPadding,
        pillGap,
        color,
        indFill,
        indText,
        indRadius,
        indShadow,
        gloss,
        navStyle,
        rowStyle,
        labelBase,
        ink,
        lineTop,
        lineBottom,
        sheen,
        stillFill,
        shadow,
    }
}

type ItemProps = React.HTMLAttributes<HTMLElement> & { ref?: (el: HTMLElement | null) => void; style: React.CSSProperties }

/** One item: a link when it has one (a new tab opens without access to this page), otherwise a button. */
function itemElement(item: Item, i: number, isActive: boolean, common: ItemProps) {
    const title = item.title ?? ""
    return item.link ? (
        <a
            key={i}
            {...common}
            href={item.link}
            target={item.newTab ? "_blank" : undefined}
            rel={item.newTab ? "noopener noreferrer" : undefined}
            aria-current={isActive ? "page" : undefined}
        >
            {title}
        </a>
    ) : (
        <button
            key={i}
            type="button"
            {...common}
            aria-current={isActive ? "page" : undefined}
            style={{ ...common.style, border: "none", margin: 0, appearance: "none", WebkitAppearance: "none", textTransform: "none" }}
        >
            {title}
        </button>
    )
}

/** Framer's static renderer (canvas, thumbnails): the glass with the still pill on the Active item, no motion at all. */
function StaticNav(props: Props) {
    const R = resolve(props)
    return (
        <nav aria-label="Main" style={R.navStyle}>
            <div style={R.rowStyle}>
                {R.items.map((item, i) => {
                    const isActive = i === R.fallbackIndex
                    return itemElement(item, i, isActive, {
                        className: "lpn-item",
                        style: {
                            ...R.labelBase,
                            color: isActive ? R.indText : R.color,
                            background: isActive ? R.stillFill : "transparent",
                            boxShadow: isActive ? R.shadow : undefined,
                            cursor: "pointer",
                        },
                    })
                })}
            </div>
        </nav>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-auto
 * @framerSupportedLayoutHeight any-prefer-auto
 * @framerDisableUnlink
 */
export default function LiquidPillNavbar(props: Props) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StaticNav {...props} />
    return <LiveNav {...props} />
}

/** The live nav: measures its items and moves the drop. It also renders on the server, with the still pill until measured. */
function LiveNav(props: Props) {
    const { matchPage = true, hover = {}, liquid = {} } = props
    const R = resolve(props)
    const { items, count, fallbackIndex, itemPadding, pillGap, color, indFill, indText, indRadius, indShadow, gloss, labelBase, rowStyle } = R

    // Liquid: the drop itself flows to the hovered item (clicking usually leaves the page, so hover is where the motion
    // is seen). Pill: a soft pill follows the pointer and the drop stays on the active item.
    const hoverMode = hover.show === false ? "none" : (hover.effect ?? "liquid")
    const showHover = hoverMode === "pill"
    const markActive = hoverMode === "liquid" && (hover.markActive ?? true)
    const returnDelay = clamp(hover.returnDelay ?? 0.15, 0, 2)
    const hoverFill = hover.fill ?? "rgba(0, 0, 0, 0.06)"
    const hoverText = hover.text ?? "#111111"

    const mode = liquid.style ?? "liquid"
    const amount = mode === "slide" ? 0 : clamp((liquid.amount ?? 70) / 100, 0, 1)
    const wobble = mode === "slide" ? 0 : clamp((liquid.wobble ?? 50) / 100, 0, 1)
    const goo = mode === "slide" ? 0 : clamp((liquid.goo ?? 60) / 100, 0, 1)
    const speed = clamp(liquid.speed ?? 1, 0.3, 3)
    const linkDelay = clamp(liquid.delay ?? 0.3, 0, 2)

    const [current, setCurrent] = React.useState(fallbackIndex)
    const [hovered, setHovered] = React.useState(-1)
    const [measured, setMeasured] = React.useState(false)
    const [clipOk, setClipOk] = React.useState(true)

    const navRef = React.useRef<HTMLElement>(null)
    const rowRef = React.useRef<HTMLDivElement>(null)
    const itemRefs = React.useRef<(HTMLElement | null)[]>([])
    const fillRef = React.useRef<HTMLDivElement>(null)
    const lightRef = React.useRef<HTMLDivElement>(null)
    const shadowRef = React.useRef<HTMLDivElement>(null)
    const topRef = React.useRef<HTMLDivElement>(null)
    const hoverRef = React.useRef<HTMLDivElement>(null)

    const sim = React.useRef({
        drop: {
            rects: [],
            minX: -1e9,
            maxX: 1e9,
            L: { x: 0, v: 0, arm: true, base: 0 },
            R: { x: 0, v: 0, arm: true, base: 0 },
            FL: { x: 0, v: 0 },
            FR: { x: 0, v: 0 },
            W: { x: 0, v: 0 },
            QL: { x: 0, v: 0 },
            QR: { x: 0, v: 0 },
            KL: { a: 0, b: 0 },
            KR: { a: 0, b: 0 },
            backL: false,
            backR: false,
            kick: false,
            cutL: 1,
            cutS: 1,
            cutT: { x: 0, v: 0 },
            peak: 0,
            ramp: 0,
            P: { x: 0, v: 0 },
            G: { x: 0, v: 0 },
            vc: 0,
            S: { x: 0, v: 0 },
            press: 0,
            cap: { x: 1e6, v: 0 },
            capTo: 1e6,
            sweep: 1e6,
            sweepTo: 1e6,
            rw: { x: 0, v: 0 },
            time: 0,
            lastMove: -1,
            dir: 1,
            lead: 1,
            amt: 1,
            amtTo: 1,
        } as Drop,
        HX: { x: 0, v: 0, k: 520, z: 1 } as Spring,
        HW: { x: 0, v: 0, k: 520, z: 1 } as Spring,
        hoverOpacity: 0,
        target: 0,
        hoverTarget: -1,
        /** Last target and whether it came from hover, to tell hover moves from commits. */
        shownLast: -1,
        fromHover: false,
        hoverMove: false,
        /** The target the current move was armed for. */
        armed: -1,
        raf: 0,
        last: 0,
        ready: false,
        reduced: false,
        /** Item the drop is first drawn at (the previous page's item when arriving from another page). */
        start: -1,
        /** How far the drop layers reach past the row (left, top, right, bottom): up to the glass's outer edge. */
        pad: [LAYER_PAD, LAYER_PAD, LAYER_PAD, LAYER_PAD],
        /** What was last written to the DOM, so unchanged values are not written again. */
        out: { ...EMPTY_OUT },
    })

    const look = { gloss, radius: firstPx(indRadius, 999), ink: R.ink, lineTop: R.lineTop, lineBottom: R.lineBottom }
    const params = React.useRef({ amount, speed, wobble, goo, ...look })
    params.current = { amount, speed, wobble, goo, ...look }

    const itemsKey = items.map((it) => it.title ?? "").join("|")
    const storeKey = itemsKey

    // Which item is active: the one linking to this page (Match Page), otherwise Active. Resolved before the first
    // paint, so the drop never starts at the wrong item. Runs after hydration, so SSR and hydration still agree.
    const resolved = React.useRef(false)
    useIsoLayoutEffect(() => {
        let next = fallbackIndex
        if (matchPage) {
            const hit = items.findIndex((it) => linkMatchesPage(it.link))
            if (hit >= 0) next = hit
        }
        if (!resolved.current) {
            // Arriving from another page that uses this nav: start at the previous item and flow to the new one.
            const prev = readStore()
            sim.current.start = prev && prev.key === storeKey && prev.index >= 0 && prev.index < count ? prev.index : next
        }
        resolved.current = true
        writeStore(storeKey, next)
        setCurrent(next)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matchPage, fallbackIndex, itemsKey])

    useIsoLayoutEffect(() => setClipOk(supportsPathClip()), [])

    const draw = React.useCallback(() => {
        const S = sim.current
        const D = S.drop
        const r = D.rects[S.target]
        if (!r) return
        const { amount: liquidAmt, radius, gloss: g, wobble, goo } = params.current
        const h = r.h
        const cy = r.y + h / 2
        const W = Math.max(D.W.x, 1)
        // Visible stretch: soft-capped by the travel distance (≈ 1.3 W for one item, ≤ 1.5 W for long jumps) and less
        // on hover moves; the end that reaches past the target (the trailing one, on a reversal the one that ran past)
        // takes up the difference. Squeezed, the drop gives way only a little. Without liquid (Slide, Liquid 0) the pill
        // is drawn exactly where its ends are.
        const rigid = liquidAmt <= 0
        const E = D.R.x - D.L.x - W
        // (Coming from a wider item, the cap counts from the new item's width, so the drop never exceeds 1.5 × that.)
        const cap = Math.max(D.cap.x - Math.max(0, W - D.rw.x), 0.1 * D.rw.x)
        const squeezed = -0.05 * W * Math.tanh(-E / (0.05 * W))
        const Ev = rigid ? E : E > 0 ? softCap(D.amt * softCap(E, cap), D.sweep) : squeezed
        const cut = E - Ev
        let xl = D.L.x + D.cutL * cut
        let xr = D.R.x - (1 - D.cutL) * cut
        // Landing squash: the end that was closing in gives way (on a plain landing the rear; the front holds). Squeezed
        // and squashed together the drop gets at most about 5 % shorter (at Wobble 50, two thirds of that on hover
        // moves), so a landing after a fast reversal is no deeper than any other. What the limit gives back is shared
        // like the squash, or like the hidden stretch where there is no squash.
        let dqL = rigid ? 0 : (xr - xl) * D.QL.x
        let dqR = rigid ? 0 : (xr - xl) * D.QR.x
        const short = W - (xr - xl) - dqL - dqR
        if (short > 0 && !rigid) {
            const back = short - softCap(short, (0.03 + 0.11 * wobble) * D.amt * W, 8)
            const toL = (0.5 * D.cutL - dqL) / (0.5 - dqL - dqR)
            dqL += back * toL
            dqR += back * (1 - toL)
        }
        xl -= dqL
        xr += dqR
        // Press swell, around the centre.
        const grow = 1 + 0.025 * D.S.x
        const mid = (xl + xr) / 2
        xl = Math.max(mid - (mid - xl) * grow, D.minX)
        xr = Math.min(mid + (xr - mid) * grow, D.maxX)
        if (xr < xl + 1) {
            xl = mid - 0.5
            xr = mid + 0.5
        }
        const len = xr - xl
        // Keeps its area: longer is thinner (never below 64 %, so the labels stay inside), squashed a little taller. With
        // Goo the ends stay fuller and the neck does the thinning.
        const ratio = (W * grow) / Math.max(len, 1)
        const thin = Math.min(1, liquidAmt * 5)
        const H = h * grow * lerp(1, clamp(Math.pow(ratio, ratio < 1 ? lerp(0.5, 0.3, goo) : 0.6), lerp(0.64, 0.74, goo), 1.08), thin)
        // The running drop swells a little along its flanks, widest just behind the head: a liquid body rather than a
        // rod. Both ends keep the same radius, so top and bottom never converge into a wedge. Short flanks (narrow
        // items) swell less, so the outline stays gentle.
        const st = Math.max(1 / ratio - 1, 0)
        const room = clamp((len - H) / (0.75 * h), 0, 1)
        const geo: Geo = { xl, xr, cy, H, lead: D.lead, swell: 0.035 * h * thin * room * Math.tanh(st / 0.2), neck: 0, neckAt: 0.5, neckW: 0.5, corner: -1 }
        // Goo: while it stretches the drop pulls into a liquid neck between a full head and a smaller rear. On long
        // drops the neck sits a little nearer the rear; on short ones (a move to the next item) it moves to the middle,
        // where it has room to be wider and so deeper. It is kept wide enough for its depth (r·r'' ≥ −0.7), so it
        // stays smooth, and it forms early in the stretch (fully deep from 1.5 × the rest width).
        const span = len - H
        if (goo > 0 && span > 1) {
            const at = lerp(0.5, lerp(0.6, 0.4, D.lead), clamp((span - 1.2 * h) / (1.5 * h), 0, 1))
            const wU = Math.min(clamp(0.5 * span, 0.9 * h, 1.4 * h) / span, 0.95 * Math.min(at, 1 - at))
            const wPx = wU * span
            const t = clamp((st - 0.03) / 0.47, 0, 1)
            const want = goo * 0.75 * (H / 2) * t * t * (3 - 2 * t)
            // (A soft limit, so the neck stops deepening smoothly where its width runs out.)
            geo.neck = softCap(want, (0.7 * wPx * wPx) / (8 * (H / 2)), 6)
            geo.neckAt = at
            geo.neckW = wU
        }
        if (radius < H / 2 - 0.01 || len < H + 0.1) {
            geo.corner = Math.max(0, Math.min(radius, H / 2, len / 2))
            geo.swell = 0
            geo.neck = 0
        } else {
            // With Indicator › Radius just below half the height the outline switches to a rounded rectangle as the
            // drop thins; the swell fades out towards that switch, so both outlines agree where they meet.
            geo.swell *= clamp((radius - H / 2) / (0.1 * h), 0, 1)
            geo.neck *= clamp((radius - H / 2) / (0.1 * h), 0, 1)
        }
        // Path coordinates are relative to the drop layers, which reach `pad` past the row.
        const [ox, oy] = S.pad
        const out = S.out
        const pad = S.pad.join("|")
        if (pad !== out.pad) {
            out.pad = pad
            const [pl, pt, pr, pb] = S.pad
            for (const el of [fillRef.current, lightRef.current, topRef.current]) {
                if (!el) continue
                el.style.left = `${-pl}px`
                el.style.top = `${-pt}px`
                el.style.right = `${-pr}px`
                el.style.bottom = `${-pb}px`
            }
            if (topRef.current) topRef.current.style.padding = `${pt}px ${pr}px ${pb}px ${pl}px`
        }
        const d = outlinePath(geo, 0, ox, oy)
        if (d !== out.d) {
            out.d = d
            const clip = `path("${d}")`
            setClip(fillRef.current, clip)
            setClip(topRef.current, clip)
        }
        // The shadow: the same capsule softly blurred (the flanks' swell of about a pixel does not show through a 5.5 px
        // blur), so it stretches and squashes with the drop at the cost of one rounded box-shadow.
        const sh = shadowRef.current
        if (sh) {
            const k = geo.corner >= 0 ? geo.corner : H / 2
            const key = `${f2(xl)}|${f2(cy - H / 2)}|${f2(len)}|${f2(H)}|${f2(k)}`
            if (key !== out.shadow) {
                out.shadow = key
                sh.style.transform = `translate(${f2(xl)}px, ${f2(cy - H / 2)}px)`
                sh.style.width = `${f2(len)}px`
                sh.style.height = `${f2(H)}px`
                sh.style.borderRadius = `${f2(k)}px`
            }
        }
        const light = lightRef.current
        if (g > 0 && light) {
            const band = bandPath(geo, LIGHT.inset, LIGHT.width, ox, oy)
            if (band !== out.band) {
                out.band = band
                setClip(light, `path("${band}")`)
            }
            // The line's tiles span the flank between the end circles' centres and reach up to its swollen edge. The
            // slosh moves the bright middle along the line while its faded ends stay put, so it always fades out
            // before the caps.
            const end = geo.corner >= 0 ? geo.corner : H / 2
            const span = Math.max(len - 2 * end, 0)
            const lift = geo.swell + LIGHT.inset
            const size = `${f2(span)}px ${f2(H / 2 + lift)}px`
            const x = f2(xl + end + ox)
            const pos = `${x}px ${f2(cy - H / 2 - lift + oy)}px, ${x}px ${f2(cy + oy)}px`
            if (size !== out.size) {
                out.size = size
                light.style.backgroundSize = `${size}, ${size}`
            }
            if (pos !== out.pos) {
                out.pos = pos
                light.style.backgroundPosition = pos
            }
            // (Pre-scaled for the speed light: the layer runs at 1 / 1.15 opacity at rest.)
            const { ink, lineTop, lineBottom } = params.current
            const shift = Math.round(clamp(D.P.x / Math.max(span, 1), -0.15, 0.15) * 400) / 400
            const img = `${shift}|${ink}|${lineTop}|${lineBottom}`
            if (img !== out.img) {
                out.img = img
                light.style.backgroundImage = `${lineImage(lineTop * 1.15, ink, shift)}, ${lineImage(lineBottom * 1.15, ink, shift)}`
            }
            const op = f2((1 + 0.15 * D.G.x) / 1.15)
            if (op !== out.op) {
                out.op = op
                light.style.opacity = op
            }
        }
        const fill = fillRef.current
        if (g > 0 && fill) {
            // The sheen sits on the drop's current top edge (also where the flank swells) and covers its top 30 %.
            const top = f2(cy - H / 2 - geo.swell + oy)
            const depth = f2(LIGHT.sheenDepth * H + geo.swell)
            if (`${top}|${depth}` !== out.sheen) {
                out.sheen = `${top}|${depth}`
                fill.style.backgroundPosition = `0px ${top}px`
                fill.style.backgroundSize = `100% ${depth}px`
            }
        }
        const hv = hoverRef.current
        if (hv) {
            const hr = D.rects[S.hoverTarget >= 0 ? S.hoverTarget : S.target]
            if (hr) {
                const key = `${S.HX.x.toFixed(2)}|${hr.y}|${Math.max(S.HW.x, 0).toFixed(2)}|${hr.h}|${S.hoverOpacity.toFixed(3)}`
                if (key !== out.hover) {
                    out.hover = key
                    hv.style.transform = `translate3d(${S.HX.x.toFixed(2)}px, ${hr.y}px, 0)`
                    hv.style.width = `${Math.max(S.HW.x, 0).toFixed(2)}px`
                    hv.style.height = `${hr.h}px`
                    hv.style.opacity = S.hoverOpacity.toFixed(3)
                }
            }
        }
    }, [])

    /** Puts the drop at rest on the target item. */
    const settle = React.useCallback(() => {
        const S = sim.current
        const D = S.drop
        const r = D.rects[S.target]
        if (!r) return
        D.L.x = r.x
        D.R.x = r.x + r.w
        D.L.v = D.R.v = 0
        D.FL.x = r.x
        D.FR.x = r.x + r.w
        D.FL.v = D.FR.v = 0
        D.L.arm = D.R.arm = true
        D.L.base = D.R.base = 0
        D.W.x = D.rw.x = r.w
        D.W.v = D.rw.v = 0
        D.QL.x = D.QL.v = D.QR.x = D.QR.v = 0
        D.KL.a = D.KL.b = D.KR.a = D.KR.b = 0
        D.backL = D.backR = false
        D.P.x = D.P.v = 0
        D.G.x = D.G.v = 0
        D.S.x = D.press
        D.S.v = 0
        D.vc = 0
        D.kick = false
        D.amt = D.amtTo
        D.lead = D.cutL = D.cutS = D.dir > 0 ? 1 : 0
        D.cutT.x = D.cutT.v = 0
    }, [])

    const tick = React.useCallback(
        (now: number) => {
            const S = sim.current
            const D = S.drop
            S.raf = 0
            // The clock starts when the motion is triggered, so the very first frame already moves.
            const dtAll = clamp((now - (S.last || now)) / 1000, 0, 1 / 20)
            S.last = now
            const r = D.rects[S.target]
            if (!r) return
            const { amount: liquidAmt, speed: s, wobble: wb } = params.current
            const steps = Math.max(1, Math.ceil(dtAll / SUB_STEP - 1e-6))
            const dt = dtAll / steps
            const hr = D.rects[S.hoverTarget]
            const hoverOn = S.hoverTarget >= 0 && S.hoverTarget !== S.target && !!hr
            for (let i = 0; i < steps && dt > 0; i++) {
                stepDrop(D, r, dt, liquidAmt, liquidAmt > 0 ? s * LIQUID_PACE : s, wb)
                if (hr) {
                    stepSpring(S.HX, hr.x, dt)
                    stepSpring(S.HW, hr.w, dt)
                }
            }
            const op = hoverOn ? 1 : 0
            S.hoverOpacity += (op - S.hoverOpacity) * (1 - Math.exp(-dtAll * 14))
            draw()
            // At rest once every end is within 0.25 px and slower than 2 px/s, and shape and light are below sight.
            const W = Math.max(r.w, 1)
            const moving =
                Math.abs(D.L.x - r.x) > 0.25 ||
                Math.abs(D.R.x - (r.x + r.w)) > 0.25 ||
                Math.abs(D.FL.x - r.x) > 0.25 ||
                Math.abs(D.FR.x - (r.x + r.w)) > 0.25 ||
                Math.abs(D.L.v) > 2 ||
                Math.abs(D.R.v) > 2 ||
                Math.abs(D.W.x - r.w) > 0.05 ||
                Math.abs(D.W.v) > 2 ||
                (Math.abs(D.QL.x) + Math.abs(D.QR.x)) * W > 0.25 ||
                (Math.abs(D.QL.v) + Math.abs(D.QR.v)) * W > 2 ||
                (D.KL.a + D.KL.b + D.KR.a + D.KR.b) * W > 2 ||
                Math.abs(D.P.x) > 0.25 ||
                Math.abs(D.P.v) > 2 ||
                D.G.x > 0.03 ||
                Math.abs(D.S.x - D.press) > 0.002 ||
                Math.abs(D.S.v) > 0.02 ||
                (hr && (Math.abs(S.HX.x - hr.x) > 0.05 || Math.abs(S.HW.x - hr.w) > 0.05)) ||
                Math.abs(S.hoverOpacity - op) > 0.002
            if (moving) {
                S.raf = requestAnimationFrame(tick)
            } else {
                settle()
                S.hoverOpacity = op
                draw()
            }
        },
        [draw, settle]
    )

    const kick = React.useCallback(() => {
        const S = sim.current
        if (!S.ready) return
        if (S.reduced) {
            settle()
            const hr = S.drop.rects[S.hoverTarget]
            if (hr) {
                S.HX.x = hr.x
                S.HW.x = hr.w
            }
            S.hoverOpacity = S.hoverTarget >= 0 && S.hoverTarget !== S.target ? 1 : 0
            draw()
            return
        }
        if (!S.raf) {
            S.last = typeof performance !== "undefined" ? performance.now() : 0
            S.raf = requestAnimationFrame(tick)
        }
    }, [draw, settle, tick])

    // Measure items relative to the row; re-measure on resize and font load.
    useIsoLayoutEffect(() => {
        const row = rowRef.current
        const nav = navRef.current
        if (!row || !nav) return
        const S = sim.current
        const D = S.drop
        S.reduced = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

        const measure = () => {
            // Sub-pixel boxes, so the drop keeps exactly 3 px from the glass. The scale compares with the computed size
            // (offsetWidth is rounded and would skew every position a little). Boxes map back only under a plain scale:
            // below a rotated, skewed or tilted ancestor (an Appear effect, say) the layout offsets are used instead,
            // whole pixels but independent of transforms.
            const rb = row.getBoundingClientRect()
            const rcs = window.getComputedStyle(row)
            const cssW = parseFloat(rcs.width)
            const cssH = parseFloat(rcs.height)
            const scale = cssW > 0 && rb.width > 0 ? rb.width / cssW : 1
            const flat = cssH > 0 && Math.abs(rb.height / cssH - scale) < 0.002 * scale
            const rects = itemRefs.current.slice(0, count).map((el) => {
                if (!el) return { x: 0, w: 0, y: 0, h: 0 }
                if (!flat) return { x: el.offsetLeft, w: el.offsetWidth, y: el.offsetTop, h: el.offsetHeight }
                const b = el.getBoundingClientRect()
                return { x: (b.left - rb.left) / scale, w: b.width / scale, y: (b.top - rb.top) / scale, h: b.height / scale }
            })
            if (!rects.length || rects.every((q) => q.w === 0)) return
            // The glass's outer edges around the row. The drop layers may use the room up to there (whole pixels, so the
            // white labels sit exactly on the grey ones), never more: past the glass they would widen the page.
            const nb = nav.getBoundingClientRect()
            const navL = flat ? (nb.left - rb.left) / scale : -row.offsetLeft - nav.clientLeft
            const navT = flat ? (nb.top - rb.top) / scale : -row.offsetTop - nav.clientTop
            const navR = flat ? (nb.right - rb.left) / scale : navL + nav.offsetWidth
            const navB = flat ? (nb.bottom - rb.top) / scale : navT + nav.offsetHeight
            const rowW = flat ? cssW : row.offsetWidth
            const rowH = flat ? cssH : row.offsetHeight
            const room = (v: number) => clamp(Math.floor(v + 0.01), 0, LAYER_PAD)
            S.pad = [room(-navL), room(-navT), room(navR - rowW), room(navB - rowH)]
            // Room between the outer items and the glass: the drop may run into it, but stays ≥ 3 px inside.
            const cs = window.getComputedStyle(nav)
            const glassL = navL + (parseFloat(cs.borderLeftWidth) || 0)
            const glassR = navR - (parseFloat(cs.borderRightWidth) || 0)
            const left = Math.min(...rects.map((q) => q.x))
            const right = Math.max(...rects.map((q) => q.x + q.w))
            const hMax = Math.max(...rects.map((q) => q.h))
            D.minX = left - clamp(left - glassL - 3, 0, 0.08 * hMax)
            D.maxX = right + clamp(glassR - right - 3, 0, 0.08 * hMax)
            const first = !S.ready
            const before = D.rects[S.target]
            D.rects = rects
            const r = rects[S.target] ?? rects[0]
            if (first) {
                const from = (!S.reduced && rects[S.start]) || r
                D.L.x = from.x
                D.R.x = from.x + from.w
                D.W.x = D.rw.x = from.w
                D.FL.x = from.x
                D.FR.x = from.x + from.w
                S.HX.x = r.x
                S.HW.x = r.w
                S.ready = true
                setMeasured(true)
                draw()
            } else if (
                !S.raf ||
                !before ||
                Math.abs(r.x - before.x) > r.h ||
                Math.abs(r.w - before.w) > r.h ||
                D.L.x < D.minX - 1 ||
                D.R.x > D.maxX + 1
            ) {
                // At rest, or the layout changed a lot under a moving drop (other items, sizes): it starts again from
                // rest on its item instead of springing in from outside the row.
                settle()
                draw()
            }
        }
        measure()
        const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null
        ro?.observe(row)
        ro?.observe(nav)
        itemRefs.current.forEach((el) => el && ro?.observe(el))
        const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
        fonts?.ready.then(measure).catch(() => {})
        return () => ro?.disconnect()
    }, [count, itemsKey, itemPadding, pillGap, draw, settle])

    // Where the drop sits: the hovered item in Liquid hover mode, otherwise the active one.
    const fromHover = hoverMode === "liquid" && hovered >= 0 && hovered < count
    const shown = fromHover ? hovered : current

    React.useEffect(() => {
        const S = sim.current
        const D = S.drop
        S.target = shown
        // Hover moves (enter, move, return) deform two thirds of a click; clicks, keys and page changes get the full motion.
        if (shown !== S.shownLast) {
            S.hoverMove = fromHover || S.fromHover
            S.shownLast = shown
        }
        S.fromHover = fromHover
        D.amtTo = S.hoverMove ? HOVER_AMOUNT : 1
        if (!S.ready) return
        const r = D.rects[shown]
        if (!r) return
        const h = Math.max(r.h, 1)
        // From rest the travel direction decides which end leads. A drop that is almost still but still landing only
        // turns its direction, and stepDrop cross-fades the roles, so its squash never jumps to the other end.
        // Mid-flight the roles follow the motion itself.
        const slow =
            !S.raf || (Math.abs(D.L.v) < 0.4 * h && Math.abs(D.R.v) < 0.4 * h && Math.abs(D.R.x - D.L.x - D.W.x) < 0.5)
        const resting =
            !S.raf || (slow && Math.abs(D.QL.x) + Math.abs(D.QR.x) < 0.002 && Math.abs(D.QL.v) + Math.abs(D.QR.v) < 0.05)
        const centreNow = (D.L.x + D.R.x) / 2
        const centreTo = r.x + r.w / 2
        if (slow && Math.abs(centreTo - centreNow) > 0.5) D.dir = centreTo > centreNow ? 1 : -1
        if (resting) {
            D.lead = D.cutL = D.cutS = D.dir > 0 ? 1 : 0
            D.cutT.x = D.cutT.v = 0
            D.amt = D.amtTo
        }
        if (shown !== S.armed) {
            S.armed = shown
            // A new move: both ends are braked again past their new edges (an end already beyond its edge may run on
            // only a little), the landing is armed and the rear starts soft again. An end that is already beyond its
            // new edge and still running away comes back on the firm springs right away, so it never drifts back.
            D.L.arm = D.R.arm = true
            D.R.base = Math.max(0, D.R.x - (r.x + r.w))
            D.L.base = Math.max(0, r.x - D.L.x)
            // The hidden stretch splits anew for the new edges; the offset keeps its share where it was for now.
            D.cutS = (D.L.base + D.cutS) / (D.L.base + D.R.base + 1)
            D.cutT.x = D.cutL - D.cutS
            D.cutT.v = 0
            const away = (D.R.base > 0.15 * h && D.R.v > 0) || (D.L.base > 0.15 * h && D.L.v < 0)
            D.ramp = away ? 1 : 0
            D.peak = Math.max(0, D.R.x - D.L.x - D.W.x)
            D.kick = true
            // Visible stretch: about 0.6 W for one item, up to 1.1 W for jumps of three and more. A fast hover sweep
            // (a new target within 120 ms) stays at 0.6 W until the drop rests, so letting go of it never pops.
            const j = clamp((Math.abs(centreTo - centreNow) / Math.max(r.w, 1) - 1) / 2, 0, 1)
            D.capTo = lerp(0.6, 1.1, j) * r.w
            if (S.raf && S.hoverMove && D.time - D.lastMove < 0.12) D.sweepTo = 0.6 * r.w
            else if (resting) D.sweepTo = 10 * r.w
            if (resting) {
                D.cap.x = D.capTo
                D.rw.x = r.w
                D.cap.v = D.rw.v = 0
                D.sweep = D.sweepTo
            }
            D.lastMove = D.time
        }
        S.HX.k = S.HW.k = 520 * speed * speed
        draw()
        kick()
    }, [shown, fromHover, amount, speed, measured, draw, kick])

    // The soft pill: follows the pointer (Pill), or marks the active item while the drop is elsewhere (Liquid).
    const pillAt = showHover ? hovered : markActive && shown !== current ? current : -1
    React.useEffect(() => {
        const S = sim.current
        S.hoverTarget = pillAt
        const pr = S.drop.rects[pillAt]
        if (pillAt >= 0 && S.hoverOpacity < 0.02 && pr) {
            S.HX.x = pr.x
            S.HW.x = pr.w
            S.HX.v = S.HW.v = 0
        }
        kick()
    }, [pillAt, kick])

    // Leaving the row: wait a moment before the drop flows back, so crossing a gap or brushing the edge stays calm.
    const leaveTimer = React.useRef<number>(0)
    React.useEffect(() => () => window.clearTimeout(leaveTimer.current), [])
    const onRowLeave = () => {
        window.clearTimeout(leaveTimer.current)
        if (returnDelay <= 0) setHovered(-1)
        else leaveTimer.current = window.setTimeout(() => setHovered(-1), returnDelay * 1000)
    }

    // Pressing the drop swells it a little; letting go anywhere relaxes it.
    React.useEffect(() => {
        const release = () => {
            const D = sim.current.drop
            if (!D.press) return
            D.press = 0
            kick()
        }
        // (Safari ends a link drag without pointerup or pointercancel.)
        const events = ["pointerup", "pointercancel", "dragend", "blur"]
        events.forEach((t) => window.addEventListener(t, release))
        return () => events.forEach((t) => window.removeEventListener(t, release))
    }, [kick])

    // A cancelled frame leaves no stale id behind, so a remount (StrictMode) can start the loop again.
    React.useEffect(
        () => () => {
            cancelAnimationFrame(sim.current.raf)
            sim.current.raf = 0
        },
        []
    )

    const live = measured && clipOk

    // Redraw when the look changes while at rest (also right when the layers appear, before the first paint); layers
    // that just mounted get every value written again.
    useIsoLayoutEffect(() => {
        sim.current.out = { ...EMPTY_OUT }
        draw()
    }, [live, indRadius, amount, gloss, R.ink, indShadow, draw])

    const navigateTimer = React.useRef<number>(0)
    React.useEffect(() => () => window.clearTimeout(navigateTimer.current), [])

    const onItemClick = (index: number, e: React.MouseEvent<HTMLElement>) => {
        const item = items[index]
        const link = item?.link
        const leaving = current
        // A click on the item the drop is still flowing to (a hover move) gives that move the full click energy.
        const S = sim.current
        if (S.target === index && S.raf) {
            S.hoverMove = false
            S.drop.amtTo = 1
        }
        setCurrent(index)
        if (!link) return
        if (item.newTab || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
        const isHash = link.startsWith("#")
        if (isHash || linkDelay <= 0 || sim.current.reduced) {
            // Leaving right away: the next page lets the drop flow over from the item we left.
            if (!isHash) writeStore(storeKey, leaving)
            return
        }
        e.preventDefault()
        window.clearTimeout(navigateTimer.current)
        navigateTimer.current = window.setTimeout(() => {
            // The drop has arrived here already, so the next page shows it at rest.
            writeStore(storeKey, index)
            window.location.assign(link)
        }, linkDelay * 1000)
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return
        const focusIndex = itemRefs.current.findIndex((el) => el === document.activeElement)
        if (focusIndex < 0) return
        e.preventDefault()
        let next = focusIndex
        if (e.key === "ArrowRight") next = (focusIndex + 1) % count
        if (e.key === "ArrowLeft") next = (focusIndex - 1 + count) % count
        if (e.key === "Home") next = 0
        if (e.key === "End") next = count - 1
        itemRefs.current[next]?.focus()
    }

    const uid = React.useId().replace(/:/g, "")

    // The drop layers: draw() sets how far they reach past the row, their light and their clip.
    const layerStyle: React.CSSProperties = {
        position: "absolute",
        pointerEvents: "none",
        backgroundRepeat: "no-repeat",
        clipPath: "inset(50%)",
        WebkitClipPath: "inset(50%)",
    }

    return (
        <nav ref={navRef} aria-label="Main" style={R.navStyle}>
            <style>{`.lpn-${uid} .lpn-item:focus-visible{outline:2px solid ${indFill};outline-offset:2px}`}</style>
            <div className={`lpn-${uid}`} style={rowStyle} onKeyDown={onKeyDown} onPointerLeave={onRowLeave} ref={rowRef}>
                {/* Hover pill */}
                {(showHover || markActive) && live && (
                    <div
                        ref={hoverRef}
                        aria-hidden
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: 0,
                            height: 0,
                            borderRadius: indRadius,
                            background: hoverFill,
                            opacity: 0,
                            pointerEvents: "none",
                            willChange: "transform, width, opacity",
                        }}
                    />
                )}
                {/* The drop: one outline for the shadow, the fill, the light and the label clip. */}
                {live && indShadow && (
                    <div
                        ref={shadowRef}
                        aria-hidden
                        data-lpn="shadow"
                        style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, boxShadow: R.shadow, pointerEvents: "none" }}
                    />
                )}
                {/* Fill and light are HTML layers clipped to the outline: an <svg> box snaps to whole pixels and would
                    drift up to half a pixel from the white labels. */}
                {live && (
                    <div
                        ref={fillRef}
                        aria-hidden
                        data-lpn="fill"
                        style={{ ...layerStyle, backgroundColor: indFill, backgroundImage: R.sheen > 0 ? sheenImage(R.sheen) : undefined }}
                    />
                )}
                {live && gloss > 0 && <div ref={lightRef} aria-hidden data-lpn="light" style={{ ...layerStyle, opacity: 1 / 1.15 }} />}
                {items.map((item, i) => {
                    const isActive = i === current
                    const isHover = i === hovered && !isActive && showHover
                    return itemElement(item, i, isActive, {
                        className: "lpn-item",
                        ref: (el: HTMLElement | null) => {
                            itemRefs.current[i] = el
                        },
                        onPointerEnter: (e: React.PointerEvent) => {
                            if (e.pointerType !== "mouse") return
                            window.clearTimeout(leaveTimer.current)
                            setHovered(i)
                        },
                        onPointerDown: (e: React.PointerEvent) => {
                            const S = sim.current
                            if (e.button !== 0 || S.target !== i || S.reduced || !S.ready) return
                            S.drop.press = 1
                            kick()
                        },
                        onClick: (e: React.MouseEvent<HTMLElement>) => onItemClick(i, e),
                        style: {
                            ...labelBase,
                            color: !live && isActive ? indText : isHover ? hoverText : color,
                            background: !live && isActive ? R.stillFill : "transparent",
                            boxShadow: !live && isActive ? R.shadow : undefined,
                            transition: "color 0.2s ease",
                            cursor: "pointer",
                        },
                    })
                })}
                {/* Active label colour, clipped to the drop (the layer reaches past the row like the drop layers, and its
                    padding puts the labels back on the row's) */}
                {live && (
                    <div ref={topRef} aria-hidden data-lpn="labels" style={{ ...rowStyle, ...layerStyle, backgroundRepeat: undefined }}>
                        {items.map((item, i) => (
                            <span key={i} style={{ ...labelBase, color: indText }}>
                                {item.title ?? ""}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </nav>
    )
}

LiquidPillNavbar.displayName = "Liquid Pill Navbar"

addPropertyControls(LiquidPillNavbar, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "Item" },
                link: { type: ControlType.Link, title: "Link", defaultValue: "" },
                newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false, enabledTitle: "Yes", disabledTitle: "No" },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    active: {
        type: ControlType.Number,
        title: "Active",
        defaultValue: 1,
        min: 1,
        max: 8,
        step: 1,
        displayStepper: true,
        description: "Starting item. With Match Page on, the item linking to the current page wins.",
    },
    matchPage: {
        type: ControlType.Boolean,
        title: "Match Page",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 15, variant: "Medium", letterSpacing: "-0.01em", lineHeight: "1.2em" },
    },
    color: { type: ControlType.Color, title: "Text", defaultValue: "rgba(17, 17, 17, 0.62)" },
    itemPadding: { type: ControlType.Padding, title: "Item Padding", defaultValue: "10px 18px 10px 18px" },
    pill: {
        type: ControlType.Object,
        title: "Pill",
        controls: {
            fill: { type: ControlType.Color, title: "Fill", defaultValue: "rgba(255, 255, 255, 0.72)" },
            blur: { type: ControlType.Number, title: "Blur", defaultValue: 18, min: 0, max: 60, step: 1, unit: "px" },
            radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "999px" },
            padding: { type: ControlType.Padding, title: "Padding", defaultValue: "5px" },
            gap: { type: ControlType.Number, title: "Gap", defaultValue: 2, min: 0, max: 40, step: 1, unit: "px" },
            border: {
                type: ControlType.Border,
                title: "Border",
                defaultValue: { borderWidth: 1, borderStyle: "solid", borderColor: "rgba(255, 255, 255, 0.6)" },
            },
            shadow: {
                type: ControlType.BoxShadow,
                title: "Shadow",
                defaultValue: "0px 10px 30px -10px rgba(0, 0, 0, 0.25), 0px 1px 2px 0px rgba(0, 0, 0, 0.06)",
            },
        },
    },
    indicator: {
        type: ControlType.Object,
        title: "Indicator",
        controls: {
            fill: { type: ControlType.Color, title: "Fill", defaultValue: "#111111" },
            text: { type: ControlType.Color, title: "Text", defaultValue: "#FFFFFF" },
            radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "999px" },
            gloss: {
                type: ControlType.Number,
                title: "Gloss",
                defaultValue: 60,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                description: "A thin line of light along the drop's top edge. 0 is flat ink.",
            },
            shadow: { type: ControlType.Boolean, title: "Shadow", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
        },
    },
    hover: {
        type: ControlType.Object,
        title: "Hover",
        controls: {
            effect: {
                type: ControlType.Enum,
                title: "Effect",
                options: ["liquid", "pill", "none"],
                optionTitles: ["Liquid", "Pill", "None"],
                defaultValue: "liquid",
                displaySegmentedControl: true,
                description: "Liquid: the drop flows to the hovered item.",
            },
            returnDelay: {
                type: ControlType.Number,
                title: "Return",
                defaultValue: 0.15,
                min: 0,
                max: 2,
                step: 0.05,
                unit: "s",
                description: "Wait before the drop flows back after the pointer leaves.",
                hidden: (p: HoverStyle) => (p.effect ?? "liquid") !== "liquid",
            },
            markActive: {
                type: ControlType.Boolean,
                title: "Mark Active",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
                description: "Soft pill on the current page's item while the drop is elsewhere.",
                hidden: (p: HoverStyle) => (p.effect ?? "liquid") !== "liquid",
            },
            fill: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "rgba(0, 0, 0, 0.06)",
                hidden: (p: HoverStyle) => {
                    const e = p.effect ?? "liquid"
                    return e === "none" || (e === "liquid" && p.markActive === false)
                },
            },
            text: { type: ControlType.Color, title: "Text", defaultValue: "#111111", hidden: (p: HoverStyle) => p.effect !== "pill" },
        },
    },
    liquid: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["liquid", "slide"],
                optionTitles: ["Liquid", "Slide"],
                displaySegmentedControl: true,
                defaultValue: "liquid",
            },
            amount: {
                type: ControlType.Number,
                title: "Liquid",
                defaultValue: 70,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                description: "How far the drop stretches while it travels.",
                hidden: (p: LiquidStyle) => p.style === "slide",
            },
            wobble: {
                type: ControlType.Number,
                title: "Wobble",
                defaultValue: 50,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                description: "How much the drop squashes and wobbles when it lands. 0 lands dead.",
                hidden: (p: LiquidStyle) => p.style === "slide",
            },
            goo: {
                type: ControlType.Number,
                title: "Goo",
                defaultValue: 60,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                description: "How much the drop pulls into a liquid neck while it stretches.",
                hidden: (p: LiquidStyle) => p.style === "slide",
            },
            speed: { type: ControlType.Number, title: "Speed", defaultValue: 1, min: 0.3, max: 3, step: 0.1 },
            delay: {
                type: ControlType.Number,
                title: "Link Delay",
                defaultValue: 0.3,
                min: 0,
                max: 2,
                step: 0.05,
                unit: "s",
                description: "Lets the drop arrive before the next page opens.",
            },
        },
        description: "Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)",
    },
})
