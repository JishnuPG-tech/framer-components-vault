// Arc Text Carousel – titles turn along an arc. A typographic lens swells the focused title
// (width and weight of a variable font) and the image beside the arc rolls to it like liquid.
// Built by Matthias Ölschlegel · https://dub.sh/dsw13
// Built-in typeface: Mona Sans © GitHub, SIL Open Font License 1.1 (github.com/github/mona-sans)
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


type Img = { src?: string; srcSet?: string; alt?: string } | string | undefined

interface Item {
    title?: string
    caption?: string
    image?: Img
    link?: string
    newTab?: boolean
}

interface Props {
    linkDefault?: string
    linkDefaultTab?: boolean
    items?: Item[]
    typeface?: React.CSSProperties
    titleSize?: number
    tracking?: number
    responsiveText?: boolean
    lens?: { focusWeight?: number; restWeight?: number; focusWidth?: number; restWidth?: number; spread?: number; wave?: boolean; lean?: boolean }
    textColor?: string
    mutedColor?: string
    background?: { fill?: string; radius?: string; tint?: number; glow?: number; grain?: number }
    side?: "left" | "right"
    curve?: number
    spacing?: number
    edgeFade?: number
    padding?: string
    maxWidth?: number
    showIndex?: boolean
    float?: { width?: number; ratio?: number; transition?: "liquid" | "roll" | "fade"; distortion?: number; speed?: number; tilt?: number; idle?: boolean; caption?: boolean }
    imageRadius?: string
    cursor?: { label?: string; fill?: string; color?: string }
    motion?: { autoplay?: boolean; interval?: number; direction?: "down" | "up"; drag?: boolean; wheel?: boolean; ease?: number; intro?: boolean }
    sound?: { on?: boolean; style?: "soft" | "tick" | "glass"; volume?: number }
    label?: string
    style?: React.CSSProperties
}

// demo images: Lummi (free for commercial use), hosted on Framer's CDN
const FUC = (id: string) => `https://framerusercontent.com/images/${id}.jpg?scale-down-to=1600`

// a new instance links every project to the Default Link below, like the preview. Framer keeps no link inside the
// items' defaults, so the link lives in its own control, visible in the panel
const DEMO_LINK = "https://framer.link/fsd2pgh"
const DEFAULT_ITEMS: Item[] = [
    { title: "Casa Brava", caption: "Architecture — 2026", image: FUC("3T0toZcKna4QfRZeYP6Xrtp4Rlg") },
    { title: "Halcyon", caption: "Installation — 2026", image: FUC("J93X2col1ADFpF4dqWL2QcEoRBc") },
    { title: "Ondine", caption: "Set Design — 2026", image: FUC("KiW8rN3F0IbWWKfsoACwdzMTEWE") },
    { title: "Faro Atelier", caption: "Interior — 2025", image: FUC("lARnHhsfS5hsTPA1kspruUgyY") },
    { title: "Tessellate", caption: "Exhibition — 2025", image: FUC("Z6VbPC8S8eVeNIQQGwq2SYNPVPA") },
    { title: "Kiln & Co.", caption: "Object Design — 2025", image: FUC("rFyNQnV9z3xKqPySpFWnnIWumm8") },
    { title: "Norrø", caption: "Residence — 2024", image: FUC("adQ8oakWFWkYD01r5ZFANxFOkYw") },
]

const imgSrc = (i: Img) => (typeof i === "string" ? i : i?.src || "")
const imgSet = (i: Img) => (typeof i === "string" ? undefined : i?.srcSet)
const imgAlt = (i: Img, t?: string) => (typeof i === "string" ? t || "" : i?.alt || t || "")
const mod = (a: number, n: number) => ((a % n) + n) % n
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const pad2 = (n: number) => String(n).padStart(2, "0")
const px = (v: number | string | undefined, fb: number) => {
    if (typeof v === "number") return v
    const n = parseFloat(String(v ?? ""))
    return isFinite(n) ? n : fb
}
function parsePad(p: string | undefined) {
    const a = String(p ?? "0").trim().split(/\s+/).map((s) => parseFloat(s) || 0)
    const [t, r = t, b = t, l = r] = a
    return { t, r, b, l }
}
// the smallest srcSet candidate that is still sharp at the wanted width
function pickUrl(img: Img, want: number) {
    const set = imgSet(img)
    if (set) {
        let best: { u: string; w: number } | null = null
        let big: { u: string; w: number } | null = null
        for (const part of set.split(",")) {
            const [u, d] = part.trim().split(/\s+/)
            const wv = parseFloat(d || "")
            if (!u || !isFinite(wv)) continue
            if (wv >= want && (!best || wv < best.w)) best = { u, w: wv }
            if (!big || wv > big.w) big = { u, w: wv }
        }
        if (best) return best.u
        if (big) return big.u
    }
    // a Framer CDN image without a srcset is asked for in the size it is needed at, not its full size
    const u = imgSrc(img)
    if (/framerusercontent\.com\/images\//.test(u)) {
        try {
            const x = new URL(u)
            const cur = Number(x.searchParams.get("scale-down-to") || 0)
            const step = want <= 512 ? 512 : want <= 1024 ? 1024 : 2048
            if (!cur || cur > step) {
                x.searchParams.set("scale-down-to", String(step))
                return x.toString()
            }
        } catch {
            return u
        }
    }
    return u
}

// a small copy of an image for its first look (about a fifth of the bytes; Framer's CDN scales on request)
function previewUrl(img: Img) {
    const set = imgSet(img)
    if (set) {
        let best: { u: string; w: number } | null = null
        for (const part of set.split(",")) {
            const [u, d] = part.trim().split(/\s+/)
            const wv = parseFloat(d || "")
            if (u && isFinite(wv) && wv >= 480 && (!best || wv < best.w)) best = { u, w: wv }
        }
        if (best && best.w <= 800) return best.u
    }
    const u = imgSrc(img)
    if (/framerusercontent\.com\/images\//.test(u)) {
        try {
            const x = new URL(u)
            x.searchParams.set("scale-down-to", "512")
            return x.toString()
        } catch {
            return ""
        }
    }
    return ""
}

// ---------- background: the colours of the current image ----------
type RGBA = [number, number, number, number] // channels 0–255, alpha 0–1
function parseColor(c: string | undefined, fb: RGBA): RGBA {
    let s = String(c ?? "").trim()
    // Framer colour styles arrive as var(--token, fallback)
    for (let i = 0; i < 4 && /^var\(/i.test(s); i++) {
        const m = /^var\(\s*--[^,]+,\s*(.+)\)$/i.exec(s)
        if (!m) return fb
        s = m[1].trim()
    }
    const lc = s.toLowerCase()
    if (lc === "transparent") return [0, 0, 0, 0]
    let m = /^#([0-9a-f]{3,8})$/i.exec(s)
    if (m) {
        let h = m[1]
        if (h.length === 3 || h.length === 4) h = h.split("").map((x) => x + x).join("")
        if (h.length !== 6 && h.length !== 8) return fb
        const v = parseInt(h.slice(0, 6), 16)
        return [(v >> 16) & 255, (v >> 8) & 255, v & 255, h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1]
    }
    m = /^rgba?\(([^)]+)\)$/i.exec(s)
    if (m) {
        const p = m[1].split(/[\s,/]+/).filter(Boolean)
        const ch = (x: string) => (x.endsWith("%") ? (parseFloat(x) * 255) / 100 : parseFloat(x))
        const a = p[3] == null ? 1 : p[3].endsWith("%") ? parseFloat(p[3]) / 100 : parseFloat(p[3])
        const r = [ch(p[0]), ch(p[1]), ch(p[2]), a]
        if (r.every((x) => isFinite(x))) return [clamp(r[0], 0, 255), clamp(r[1], 0, 255), clamp(r[2], 0, 255), clamp(r[3], 0, 1)]
        return fb
    }
    // anything else (hsl(), colour names): the browser resolves it
    if (typeof document !== "undefined") {
        try {
            const x = document.createElement("canvas").getContext("2d")
            if (x) {
                x.fillStyle = "#010203"
                x.fillStyle = s
                const out = String(x.fillStyle)
                if (out !== "#010203" && /^(#|rgba?\()/i.test(out)) return parseColor(out, fb)
            }
        } catch {
            // keep the fallback
        }
    }
    return fb
}
// OKLab: mixing and lightening in it keeps the hue of a colour
const toLin = (v: number) => {
    v /= 255
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
const toByte = (v: number) => clamp(Math.round((v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(Math.max(0, v), 1 / 2.4) - 0.055) * 255), 0, 255)
function oklab(r: number, g: number, b: number): [number, number, number] {
    const R = toLin(r), G = toLin(g), B = toLin(b)
    const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
    const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
    const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]
}
function fromOklab(L: number, a: number, b: number): [number, number, number] {
    const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3)
    const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3)
    const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3)
    return [toByte(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), toByte(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), toByte(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)]
}
// the most chroma (up to C) a hue can have at lightness L and still be an sRGB colour
function fitChroma(L: number, ha: number, hb: number, C: number) {
    const ok = (c: number) => {
        const a = ha * c, b = hb * c
        const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3)
        const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3)
        const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3)
        const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
        const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
        const bb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
        return r >= -0.001 && r <= 1.001 && g >= -0.001 && g <= 1.001 && bb >= -0.001 && bb <= 1.001
    }
    if (ok(C)) return C
    let lo = 0, hi = C
    for (let i = 0; i < 12; i++) {
        const mid = (lo + hi) / 2
        if (ok(mid)) lo = mid
        else hi = mid
    }
    return lo
}
// a small copy is enough for the colours (Framer's CDN scales on request)
function smallUrl(img: Img) {
    const u = pickUrl(img, 200)
    if (/framerusercontent\.com\/images\//.test(u)) {
        try {
            const x = new URL(u)
            x.searchParams.set("scale-down-to", "256")
            return x.toString()
        } catch {
            return u
        }
    }
    return u
}
// what the background keeps of an image: its leading hue (OKLab direction) and how colourful it is
type BgData = { ha: number; hb: number; c: number; l: number }
function analyse(im: CanvasImageSource, iw: number, ih: number, ratio: number): BgData | null {
    const sw = 24
    const sh = Math.max(8, Math.round(sw / ratio))
    const c = document.createElement("canvas")
    c.width = sw
    c.height = sh
    const x = c.getContext("2d", { willReadFrequently: true } as any) as CanvasRenderingContext2D | null
    if (!x) return null
    let cw = iw
    let chh = iw / ratio
    if (chh > ih) {
        chh = ih
        cw = ih * ratio
    }
    x.imageSmoothingEnabled = true
    x.imageSmoothingQuality = "high"
    x.drawImage(im, (iw - cw) / 2, (ih - chh) / 2, cw, chh, 0, 0, sw, sh)
    let d: Uint8ClampedArray
    try {
        d = x.getImageData(0, 0, sw, sh).data
    } catch {
        return null // an image without CORS can't be read
    }
    const N = sw * sh
    const lab = new Float32Array(N * 3)
    // the leading hue is the one that covers the most area among the colourful pixels – a blue sky
    // leads over a small red sphere, and two opposite hues never average out into a muddy third one
    const BINS = 24
    const hist = new Float32Array(BINS)
    const hue = new Float32Array(N)
    const wts = new Float32Array(N)
    for (let i = 0; i < N; i++) {
        const o = oklab(d[i * 4], d[i * 4 + 1], d[i * 4 + 2])
        lab[i * 3] = o[0]
        lab[i * 3 + 1] = o[1]
        lab[i * 3 + 2] = o[2]
        const C = Math.hypot(o[1], o[2])
        const wt = clamp((C - 0.015) / 0.05, 0, 1)
        const hh = Math.atan2(o[2], o[1])
        hue[i] = hh
        wts[i] = wt
        if (wt > 0) hist[Math.floor(((hh / (2 * Math.PI) + 1) % 1) * BINS) % BINS] += wt
    }
    let peak = 0
    let best = -1
    for (let k = 0; k < BINS; k++) {
        const v = hist[(k + BINS - 1) % BINS] * 0.5 + hist[k] + hist[(k + 1) % BINS] * 0.5
        if (v > best) {
            best = v
            peak = k
        }
    }
    const ph = ((peak + 0.5) / BINS) * 2 * Math.PI
    let wa = 0, wb = 0, wc = 0, wl = 0, ws = 0, wall = 0
    for (let i = 0; i < N; i++) {
        if (wts[i] <= 0) continue
        wall += wts[i]
        let dh = Math.abs(hue[i] - ph) % (2 * Math.PI)
        if (dh > Math.PI) dh = 2 * Math.PI - dh
        if (dh > 0.7) continue
        const C = Math.hypot(lab[i * 3 + 1], lab[i * 3 + 2])
        wa += (lab[i * 3 + 1] / (C || 1)) * wts[i]
        wb += (lab[i * 3 + 2] / (C || 1)) * wts[i]
        wc += C * wts[i]
        wl += lab[i * 3] * wts[i]
        ws += wts[i]
    }
    // an image without one clear hue gets a quieter tint
    const share = wall > 0 ? Math.sqrt(ws / wall) : 0
    const hl = Math.hypot(wa, wb) || 1
    return { ha: wa / hl, hb: wb / hl, c: ws > 0 ? (wc / ws) * share : 0, l: ws > 0 ? wl / ws : 0.7 }
}
// film grain: one tile of noise, made once
let grainUrl = ""
function grainTile() {
    if (grainUrl || typeof document === "undefined") return grainUrl
    try {
        const S = 128
        const c = document.createElement("canvas")
        c.width = c.height = S
        const x = c.getContext("2d")
        if (!x) return ""
        const im = x.createImageData(S, S)
        let seed = 0x2f6b3a1
        for (let i = 0; i < im.data.length; i += 4) {
            seed = (Math.imul(seed, 1103515245) + 12345) | 0
            const v = (seed >>> 16) & 255
            im.data[i] = im.data[i + 1] = im.data[i + 2] = v
            im.data[i + 3] = 255
        }
        x.putImageData(im, 0, 0)
        grainUrl = c.toDataURL("image/png")
    } catch {
        grainUrl = ""
    }
    return grainUrl
}

// ---------- sound ----------
// One AudioContext for every instance. Browsers only allow sound after a click, tap or key press on the page (a
// wheel does not count), so the context starts with the first of those. Where the browser knows audio sessions it
// is "ambient": the clicks never stop music in another app and stay silent on a muted phone
let actx: AudioContext | null = null
let audioArmed = false
let lastClick = -1
let noiseBuf: AudioBuffer | null = null
function startAudio(): AudioContext | null {
    if (actx || typeof window === "undefined") return actx
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AC) return null
    try {
        const ses = (navigator as any).audioSession
        if (ses && "type" in ses) ses.type = "ambient"
    } catch {}
    try {
        actx = new AC({ latencyHint: "interactive" }) as AudioContext
    } catch {
        actx = null
    }
    return actx
}
// the listeners stay until sound really runs: a touch only counts when the finger lifts, and a phone can suspend
// sound again later (then clickSound arms them once more)
function armAudio() {
    if (audioArmed || typeof window === "undefined") return
    audioArmed = true
    const evs = ["pointerdown", "pointerup", "touchend", "keydown", "click"]
    const go = () => {
        const ua = (navigator as any).userActivation
        if (ua && !ua.isActive) return
        const c = startAudio()
        if (c && c.state !== "running") {
            c.resume().catch(() => {})
            return
        }
        for (const ev of evs) window.removeEventListener(ev, go, true)
        audioArmed = !c
    }
    for (const ev of evs) window.addEventListener(ev, go, { capture: true, passive: true })
}
// a short burst of white noise, made once
function noise(c: BaseAudioContext) {
    if (noiseBuf && noiseBuf.sampleRate === c.sampleRate) return noiseBuf
    const len = Math.round(c.sampleRate * 0.05)
    const b = c.createBuffer(1, len, c.sampleRate)
    const d = b.getChannelData(0)
    let seed = 0x5eed1
    for (let i = 0; i < len; i++) {
        seed = (Math.imul(seed, 1103515245) + 12345) | 0
        d[i] = ((seed >>> 8) & 0xffff) / 32768 - 1
    }
    noiseBuf = b
    return b
}
// one envelope: silent start (no click), a quick rise, an exponential fade
function env(c: BaseAudioContext, t: number, peak: number, rise: number, tau: number) {
    const g = c.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(peak, t + rise)
    g.gain.setTargetAtTime(0, t + rise, tau)
    return g
}
const GLASS = [523.25, 587.33, 659.25, 783.99, 880] // C major pentatonic, C5 to A5
// the three voices – short, and rounded off by one gentle lowpass so nothing is sharp:
// soft  = a cushioned tap of wood, no pitch glide, gone in about 60 ms (the default)
// tick  = a fine detent, like the crown of a watch, about 25 ms
// glass = a small, quiet bell whose note follows the title, so a scroll plays a soft scale, about half a second
function voice(c: BaseAudioContext, out: AudioNode, t: number, style: number, pm: number, k: number) {
    const lp = c.createBiquadFilter()
    lp.type = "lowpass"
    lp.frequency.value = style === 1 ? 5200 : style === 2 ? 5600 : 2400
    lp.Q.value = 0.5
    lp.connect(out)
    const tone = (f0: number, f1: number, peak: number, rise: number, tau: number, len: number) => {
        const o = c.createOscillator()
        o.type = "sine"
        o.frequency.setValueAtTime(f0, t)
        if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + 0.03)
        const g = env(c, t, peak, rise, tau)
        o.connect(g)
        g.connect(lp)
        o.start(t)
        o.stop(t + len)
        return o
    }
    const hiss = (freq: number, q: number, peak: number, tau: number) => {
        const n = c.createBufferSource()
        n.buffer = noise(c)
        const bp = c.createBiquadFilter()
        bp.type = "bandpass"
        bp.frequency.value = freq
        bp.Q.value = q
        const g = env(c, t, peak, 0.001, tau)
        n.connect(bp)
        bp.connect(g)
        g.connect(lp)
        n.start(t)
        n.stop(t + 0.03)
        return n
    }
    if (style === 1) {
        hiss(2800 * pm, 0.9, 2.1, 0.0015)
        return tone(1400 * pm, 1380 * pm, 0.4, 0.001, 0.004, 0.04)
    }
    if (style === 2) {
        const f = GLASS[mod(k, GLASS.length)] * pm
        tone(f * 2, f * 2, 0.04, 0.004, 0.045, 0.3)
        return tone(f, f, 0.29, 0.005, 0.09, 0.55)
    }
    hiss(1300 * pm, 0.7, 0.22, 0.0025)
    return tone(410 * pm, 380 * pm, 1, 0.003, 0.012, 0.09)
}
function clickSound(style: number, vol: number, speed: number, k: number) {
    const ua = typeof navigator !== "undefined" ? (navigator as any).userActivation : null
    let c = actx
    if (!c) {
        // the page may already have had its first click before this instance asked for sound
        if (!ua || !ua.hasBeenActive) return
        c = startAudio()
        if (!c) return
    }
    if (c.state !== "running") {
        if (!ua || ua.hasBeenActive) c.resume().catch(() => {})
        armAudio()
        return
    }
    const t = c.currentTime + 0.002
    // calm, never a rattle: the faster the arc turns, the further apart and the quieter the clicks
    if (t - lastClick < 0.06 + Math.min(0.07, speed * 0.005)) return
    lastClick = t
    const g0 = (vol * (0.88 + Math.random() * 0.24)) / (1 + speed / 9)
    if (g0 < 0.0005) return
    const out = c.createGain()
    out.gain.value = g0
    out.connect(c.destination)
    const o = voice(c, out, t, style, 1 + (Math.random() - 0.5) * 0.06, k)
    o.onended = () => out.disconnect()
}

const FAMILY = "ATA Mona Sans"
const FONT_CSS =
    `@font-face{font-family:"${FAMILY}";src:url(https://framerusercontent.com/assets/NPkPCVHX4GBpfjimdkpuR96Iuo.woff2) format("woff2");font-weight:200 900;font-stretch:75% 125%;font-style:normal;font-display:swap;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}` +
    `@font-face{font-family:"${FAMILY}";src:url(https://framerusercontent.com/assets/ALbBidskZ8UKW4CWsETHBeA.woff2) format("woff2");font-weight:200 900;font-stretch:75% 125%;font-style:normal;font-display:swap;unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF}`

const BASE_CSS = `
.ata-root{-webkit-tap-highlight-color:transparent}
.ata-root:focus{outline:none}
.ata-root:focus-visible .ata-ring{opacity:1}
.ata-row{user-select:none;-webkit-user-select:none}
.ata-hit,.ata-card{cursor:pointer}
`

// background defaults: a section in the colour of the current image, its light, a little grain
const BG_RADIUS = "0px"
const BG_TINT = 70
const BG_GLOW = 60
const BG_GRAIN = 30
const MAX_W = 1040 // widest the arc and the image spread before they stay together in the middle
const GLOW_RX = 2.1 // the light's reach around the card, in card widths and heights
const GLOW_RY = 1.55
// the light is drawn small (one pixel per 8) and stretched by the browser: its smooth falloff loses nothing,
// the layer stays tiny on any screen, and a colour change only refills a few thousand pixels
const GLOW_T = 8

const WAVE_S = 0.7 // seconds one letter takes to swell and settle
const WHEEL_TAU = 80 // ms over which the wheel's recent speed is measured
const EXT = 0.16 // texture margin above and below the card for the parallax inside it

// the letters of a title for the wave (whole grapheme clusters, so accents and emoji stay intact)
let segmenter: any
function letters(t: string): string[] {
    try {
        if (segmenter === undefined) {
            const Seg = typeof Intl !== "undefined" ? (Intl as any).Segmenter : null
            segmenter = Seg ? new Seg(undefined, { granularity: "grapheme" }) : null
        }
        if (segmenter) return Array.from(segmenter.segment(t), (x: any) => String(x.segment))
    } catch {
        segmenter = null
    }
    return Array.from(t)
}

// WebKit drops the kerning between separate letter spans – there the titles stay whole and the wave rests
let splitKerns: boolean | null = null
function lettersKeepKerning(): boolean {
    if (splitKerns != null) return splitKerns
    if (typeof document === "undefined" || !document.body) return true
    try {
        const width = (split: boolean) => {
            const d = document.createElement("span")
            d.style.cssText =
                "position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;font:400 100px/1 Helvetica,Arial,sans-serif;font-kerning:normal"
            if (split)
                for (const c of "AVAVAVAV") {
                    const l = document.createElement("span")
                    l.textContent = c
                    d.appendChild(l)
                }
            else d.textContent = "AVAVAVAV"
            document.body.appendChild(d)
            const w = d.getBoundingClientRect().width
            d.remove()
            return w
        }
        splitKerns = Math.abs(width(true) - width(false)) < 1
    } catch {
        splitKerns = true
    }
    return splitKerns
}

// decodes off the main thread where the browser can (fetch → createImageBitmap), otherwise via <img>
function loadImage(url: string, done: (src: CanvasImageSource | null, w: number, h: number) => void, prio: "high" | "low" | "auto" = "auto") {
    const viaImg = () => {
        const im = new Image()
        im.crossOrigin = "anonymous"
        im.decoding = "async"
        im.onload = () => done(im, im.naturalWidth || im.width, im.naturalHeight || im.height)
        im.onerror = () => done(null, 0, 0)
        im.src = url
    }
    if (typeof fetch !== "function" || typeof createImageBitmap !== "function") return viaImg()
    // the image on screen first, the colour reads after it (priority hints where the browser knows them)
    fetch(url, { mode: "cors", credentials: "omit", priority: prio } as RequestInit)
        .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
        .then((b) => createImageBitmap(b, { imageOrientation: "from-image" } as ImageBitmapOptions))
        .then((bm) => done(bm, bm.width, bm.height), viaImg)
}

// ---------- WebGL image card ----------
const VS = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}"
const FS = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uA;
uniform sampler2D uB;
uniform vec2 uRes;
uniform vec4 uCard;
uniform float uRad;
uniform float uF;
uniform float uVel;
uniform float uVis;
uniform float uTime;
uniform float uAmt;
uniform float uMode;
uniform float uDir;
uniform float uZoom;
uniform float uHasA;
uniform float uHasB;
float sdR(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float ns(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1.,0.)),u.x),mix(hs(i+vec2(0.,1.)),hs(i+vec2(1.,1.)),u.x),u.y);}
vec2 tuv(vec2 q){q=(q-.5)/(1.+.045*uZoom)+.5;return vec2(q.x,(q.y+${EXT.toFixed(3)})/${(1 + 2 * EXT).toFixed(3)});}
vec4 smp(sampler2D t,vec2 q,float has,float ca){
 if(has<.5)return vec4(.07,.07,.07,.14);
 vec2 uv=clamp(tuv(q),.001,.999);
 if(ca<.0004)return vec4(texture2D(t,uv).rgb,1.);
 vec2 o=vec2(0.,ca);
 return vec4(texture2D(t,clamp(uv+o,.001,.999)).r,texture2D(t,uv).g,texture2D(t,clamp(uv-o,.001,.999)).b,1.);
}
void main(){
 vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);
 vec2 q=(p-uCard.xy)/uCard.zw;
 float v=clamp(uVel*.16,-1.6,1.6)*uAmt;
 q.y+=v*.042*sin(q.x*3.14159);
 q.y=(q.y-.5)/(1.+abs(v)*.07)+.5;
 vec2 lp=(q-.5)*uCard.zw;
 float m=clamp(.5-sdR(lp,uCard.zw*.5,uRad),0.,1.);
 float wv=(ns(vec2(q.x*2.2,uTime*.4))-.5)*.06-sin(q.x*3.14159)*.1;
 float yv=1.06-uVis*1.32+wv*(1.-uVis);
 m*=smoothstep(yv-.004,yv+.004,q.y);
 if(m<=0.){gl_FragColor=vec4(0.);return;}
 float f=uF;
 vec4 col;
 if(uMode>1.5){
  vec4 a=smp(uA,(q-.5)/(1.+.05*f)+.5,uHasA,0.);
  vec4 b=smp(uB,(q-.5)/(1.08-.08*f)+.5,uHasB,0.);
  col=mix(a,b,f*f*(3.-2.*f));
 }else{
  float s=sin(f*3.14159);
  float lq=uMode<.5?1.:0.;
  float wave=lq*s*(.09*sin(q.x*3.14159)+.07*(ns(vec2(q.x*3.,f*3.+uTime*.3))-.5))*(.35+uAmt)*uDir;
  float yb=1.-f-wave;
  float aa=1.5/uCard.w;
  float inB=f>0.?smoothstep(yb-aa,yb+aa,q.y):0.;
  float dn=(q.y-yb)/.09;
  float near=lq*exp(-dn*dn)*s;
  vec2 qa=q;qa.y+=f*.22+near*.05*uAmt;qa=(qa-.5)/(1.+.06*f)+.5;
  vec2 qb=q;qb.y-=(1.-f)*.22-near*.05*uAmt;qb=(qb-.5)/(1.1-.1*f)+.5;
  float ca=(abs(v)*.004+near*.005)*uAmt;
  vec4 a=smp(uA,qa,uHasA,ca);a.rgb*=1.-.42*f;
  vec4 b=smp(uB,qb,uHasB,ca);
  col=mix(a,b,inB);
  col.rgb+=near*.05*uAmt*col.a;
 }
 gl_FragColor=col*m;
}`

interface GLTex {
    t: WebGLTexture | null
    st: number // 1 loading, 2 ready, 3 failed, 4 no image
    key: string
    tw: number
    next?: string // ticket of a replacement that is loading
    pv?: boolean // a small first look, replaced by the sharp image as soon as that is in
}
interface GLCtx {
    gl: WebGLRenderingContext
    U: Record<string, WebGLUniformLocation | null>
    tex: Map<number, GLTex>
    dummy: WebGLTexture | null
    lost: boolean
}

function makeGL(canvas: HTMLCanvasElement): GLCtx | null {
    let gl: WebGLRenderingContext | null = null
    try {
        gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false }) as WebGLRenderingContext | null
    } catch {
        gl = null
    }
    if (!gl) return null
    const g = gl
    const shader = (type: number, src: string) => {
        const s = g.createShader(type)
        if (!s) return null
        g.shaderSource(s, src)
        g.compileShader(s)
        return g.getShaderParameter(s, g.COMPILE_STATUS) ? s : null
    }
    const vs = shader(g.VERTEX_SHADER, VS)
    const fs = shader(g.FRAGMENT_SHADER, FS)
    const pr = g.createProgram()
    if (!vs || !fs || !pr) return null
    g.attachShader(pr, vs)
    g.attachShader(pr, fs)
    g.linkProgram(pr)
    if (!g.getProgramParameter(pr, g.LINK_STATUS)) return null
    g.useProgram(pr)
    const buf = g.createBuffer()
    g.bindBuffer(g.ARRAY_BUFFER, buf)
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW)
    const al = g.getAttribLocation(pr, "a")
    g.enableVertexAttribArray(al)
    g.vertexAttribPointer(al, 2, g.FLOAT, false, 0, 0)
    const U: Record<string, WebGLUniformLocation | null> = {}
    for (const n of ["uA", "uB", "uRes", "uCard", "uRad", "uF", "uVel", "uVis", "uTime", "uAmt", "uMode", "uDir", "uZoom", "uHasA", "uHasB"])
        U[n] = g.getUniformLocation(pr, n)
    g.uniform1i(U.uA, 0)
    g.uniform1i(U.uB, 1)
    // a 1×1 stand-in so no texture unit is ever empty
    const dummy = g.createTexture()
    g.bindTexture(g.TEXTURE_2D, dummy)
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, 1, 1, 0, g.RGBA, g.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]))
    return { gl: g, U, tex: new Map(), dummy, lost: false }
}

/**
 * Arc Text Carousel
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight fixed
 * @framerDisableUnlink
 */
export default function ArcTextCarousel(props: Props) {
    const isStatic = useIsStaticRenderer()
    // projects without a link of their own use the Default Link
    const linkFb = typeof props.linkDefault === "string" ? props.linkDefault.trim() : ""
    const linkFbTab = props.linkDefaultTab ?? true
    const items = (props.items && props.items.length ? props.items : DEFAULT_ITEMS).filter(Boolean).map((it, i) => {
        let x = it
        // Framer keeps no pictures inside the items' defaults, so a new instance would start without them: a demo
        // project that is still untouched (its title, no picture of its own) gets its picture back
        const d = DEFAULT_ITEMS[i]
        if (d && !imgSrc(x.image) && x.title === d.title) x = { ...x, image: d.image }
        if (!x.link && linkFb) x = { ...x, link: linkFb, newTab: linkFbTab }
        return x
    })
    const n = items.length
    const side = props.side === "right" ? "right" : "left"
    const curve = clamp(props.curve ?? 60, 0, 100)
    const spacingMul = clamp(props.spacing ?? 1.08, 0.8, 3)
    const edgeFade = clamp(props.edgeFade ?? 16, 0, 50)
    // one font setting: left empty – or set to Mona Sans, which Framer only loads in single styles – the titles use
    // the built-in variable Mona Sans, whose width and weight axes drive the lens. Any other font replaces it
    const face = props.typeface || {}
    const faceFamily = typeof face.fontFamily === "string" ? face.fontFamily.trim() : ""
    const builtin = !faceFamily || /^["']?Mona Sans["']?\s*(,|$)/i.test(faceFamily)
    const baseSize = clamp(props.titleSize ?? 64, 12, 240)
    const textColor = props.textColor || "#141413"
    const mutedColor = props.mutedColor || "rgba(20,20,19,0.2)"
    // background: a fill, the hue of the current image (tint), its light around it (glow), film grain
    const bgP = props.background || {}
    const bgFill = bgP.fill || "rgba(0,0,0,0)"
    const bgRadius = bgP.radius || BG_RADIUS
    const tintAmt = clamp(bgP.tint ?? BG_TINT, 0, 100) / 100
    const glowAmt = clamp(bgP.glow ?? BG_GLOW, 0, 100) / 100
    const grainAmt = clamp(bgP.grain ?? BG_GRAIN, 0, 100) / 100
    const fillC = React.useMemo(() => parseColor(bgFill, [0, 0, 0, 0]), [bgFill])
    const textC = React.useMemo(() => parseColor(textColor, [20, 20, 19, 1]), [textColor])
    const fillL = oklab(fillC[0], fillC[1], fillC[2])[0]
    // light or dark surroundings: the fill tells, and without one the text colour does
    const darkBg = fillC[3] >= 0.5 ? fillL < 0.5 : oklab(textC[0], textC[1], textC[2])[0] > 0.6
    const bgLref = fillC[3] >= 0.5 ? clamp(fillL, 0.16, 0.965) : darkBg ? 0.19 : 0.945
    const bgOn = fillC[3] > 0 || tintAmt > 0 || glowAmt > 0 || grainAmt > 0
    const showIndex = props.showIndex ?? false
    const L = props.lens || {}
    const fl = props.float || {}
    const idle = fl.idle ?? true
    const capOn = fl.caption ?? true
    const cur = props.cursor || {}
    const cursorLabel = cur.label ?? "View"
    const pad0 = parsePad(props.padding ?? "40px")
    const maxW = clamp(props.maxWidth ?? MAX_W, 200, 10000)
    const m = props.motion || {}
    const autoplay = m.autoplay ?? true
    const interval = clamp(m.interval ?? 3.5, 1, 20)
    const dir = m.direction === "up" ? -1 : 1
    const allowDrag = m.drag ?? true
    const allowWheel = m.wheel ?? true
    // arc spring (per second): about as quick as before, but it eases in as well as out
    const springW = (3 + clamp(m.ease ?? 50, 0, 100) * 0.09) * 1.5
    const introOn = m.intro ?? true
    const snd = props.sound || {}
    const soundOn = (snd.on ?? true) && !isStatic
    const soundStyle = snd.style === "tick" ? 1 : snd.style === "glass" ? 2 : 0
    // quiet by default: about −25 dBFS at the peak at volume 50, −16 dBFS at 100
    const soundVol = 0.16 * Math.pow(clamp(snd.volume ?? 50, 0, 100) / 100, 1.5)

    const rootRef = React.useRef<HTMLDivElement>(null)
    const uid = React.useId()
    const [size, setSize] = React.useState({ w: 1040, h: 640 })
    const [base, setBase] = React.useState(0)
    const [active, setActive] = React.useState(0)
    const [reduce, setReduce] = React.useState(false)
    const [glOn, setGlOn] = React.useState(false)
    const [glFail, setGlFail] = React.useState(false)
    const [kernOk, setKernOk] = React.useState(true)
    const waveProp = props.lens?.wave ?? true
    React.useEffect(() => {
        if (waveProp && !isStatic) setKernOk(lettersKeepKerning())
    }, [waveProp, isStatic])

    React.useLayoutEffect(() => {
        const el = rootRef.current
        if (!el) return
        const measure = () => {
            const w = el.clientWidth, h = el.clientHeight
            if (w > 0 && h > 0) setSize((s) => (Math.abs(s.w - w) > 0.5 || Math.abs(s.h - h) > 0.5 ? { w, h } : s))
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [isStatic])

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const on = () => setReduce(mq.matches)
        on()
        mq.addEventListener?.("change", on)
        return () => mq.removeEventListener?.("change", on)
    }, [])

    // ---------- geometry ----------
    const { w, h } = size
    // wide sections: the arc and the image stay together in the middle, the background fills the whole width
    const room = w - pad0.l - pad0.r
    const extra = room > maxW ? (room - maxW) / 2 : 0
    const pads = { ...pad0, l: pad0.l + extra, r: pad0.r + extra }
    const lw = w - 2 * extra
    const scale = props.responsiveText ?? true ? clamp(lw / 1000, 0.5, 1) : 1
    // whole pixels: a resize does not build a new font instance for every in-between size
    const fs = Math.max(1, Math.round(baseSize * scale))
    const lineH = fs * 1.08
    const sp = fs * spacingMul
    const R = h * (3.2 - (curve / 100) * 2.5) // large → nearly flat, small → strong curve
    const textX = side === "left" ? pads.l : w - pads.r
    const rowW = Math.max(120, w - pads.l - pads.r)
    const narrow = lw < 560
    const ratio = clamp(fl.ratio ?? 0.8, 0.4, 2.5)
    const capFs = Math.max(10, 13 * (0.85 + 0.15 * scale))
    const capLine = Math.round(capFs * 1.4)
    const capGap = Math.round(10 + 4 * scale)
    // narrow layouts (a phone) stack: the image spans the content width like a cover, one line of caption
    // and counter below it (the focused title follows right after, so the caption skips its own title), then
    // the list starts at the focus and bends away downward; titles above it slip away under the image
    const capRows = narrow ? 1 : 2
    const capH = capOn ? capLine * capRows + capGap : 0
    // (on a short phone the image keeps the full width and is cropped a little wider instead of shrinking)
    const cw = narrow ? Math.max(40, rowW) : Math.max(40, Math.min(clamp(fl.width ?? 400, 80, 900) * (0.6 + 0.4 * scale), lw * 0.42, (h - capH - 24) * ratio))
    const ch = narrow ? Math.max(40, Math.min(cw / ratio, h * 0.52 - capH)) : cw / ratio
    const cardX = narrow ? (side === "left" ? pads.l : w - pads.r - cw) : side === "left" ? w - pads.r - cw : pads.l
    const cardY = narrow ? Math.max(8, pads.t) : Math.max(8, (h - ch - capH) / 2)
    const cardBottom = cardY + ch + capH
    // the focus never sinks into the bottom fade
    const cyLow = Math.min(h - lineH, h - h * (edgeFade / 100) - lineH * 1.1)
    const cyArc = narrow ? Math.min(cyLow, cardBottom + Math.round(lineH * 0.45 + 6) + lineH / 2) : h / 2
    const clearOfCard = !narrow || cyArc - lineH / 2 > cardBottom
    const P = Math.ceil(ch * 0.12) // canvas bleed so the card can bend past its edges
    // without a surface the grain only lives where the image's light falls
    const grainMask = `radial-gradient(${Math.round(cw * GLOW_RX)}px ${Math.round(ch * GLOW_RY)}px at ${Math.round(cardX + cw / 2)}px ${Math.round(cardY + ch / 2)}px, #000 40%, transparent 100%)`
    const wRest = clamp(L.restWeight ?? 280, 100, 1000)
    const wFocus = clamp(L.focusWeight ?? 720, 100, 1000)
    const sRest = clamp(L.restWidth ?? 78, 25, 200)
    const sFocus0 = clamp(L.focusWidth ?? 118, 25, 200)
    // the focused title keeps clear of the image when there is no room below it
    const sFocus = clearOfCard ? sFocus0 : Math.min(sFocus0, Math.max(sRest, 100))
    const spread = clamp(L.spread ?? 1, 0.3, 4)
    const wave = waveProp && !reduce && kernOk
    const lean = (L.lean ?? true) && !reduce
    const trans = reduce ? 2 : fl.transition === "fade" ? 2 : fl.transition === "roll" ? 1 : 0
    const amt = reduce ? 0 : clamp(fl.distortion ?? 60, 0, 100) / 100
    const rollK = 40 + clamp(fl.speed ?? 50, 0, 100) * 1.6 // film strip spring stiffness
    const tiltK = reduce ? 0 : clamp(fl.tilt ?? 50, 0, 100) / 50
    const G = sp * 0.5
    const pivotX = side === "left" ? textX - R : textX + R
    const cy = cyArc
    const V = Math.min(20, Math.ceil((Math.max(cy, h - cy) * 1.5 + G) / sp) + 1)
    const radius = props.imageRadius || "2px"
    const radPx = px(String(radius).split(/\s+/)[0], 2)
    const dpr = typeof window === "undefined" ? 1 : Math.min(2, window.devicePixelRatio || 1)
    const startOff = !isStatic && introOn ? -1.6 * dir : 0

    // ---------- animation state (refs, no re-render per frame) ----------
    const st = React.useRef({
        pos: startOff, target: 0, vel: 0, pv: 0, lastPos: startOff, lean: 0, autoTimer: 0 as any,
        dragging: false, dragLive: false, downX: 0, downY: 0, downMoving: false, downDir: 0, downItem: 0,
        dragStartX: 0, dragStartY: 0, dragStartPos: 0, lastX: 0, lastY: 0, lastT: 0, moved: 0, axisX: false,
        lockX: 0, lockY: 0, calm: 0, introWait: 0, wantT: 0,
        hover: false, focus: false, visible: true, restT: 0, autoT: 0, wheelT: 0, raf: 0, last: 0,
        pin: false, mouse: false, px: 0, py: 0, clientX: 0, clientY: 0, hoverK: null as number | null, hitT: 0, miss: false, overCard: false,
        av: 0, glideK: 0, wOn: false, wFrom: 0, wRaw: 0, wR: 0, wLast: 0, wCount: 0, moving: false, wasMoving: false, settled: false, hoverLock: false, focusK: null as number | null,
        lensC: 0, lensV: 0, lensInit: false, lensAmp: startOff ? 0 : 1, waves: new Map<number, number>(), waveRel: new Map<number, number>(), waveK: null as number | null,
        waveCand: null as number | null, waveCandT: 0, userT: -1e9, tickK: null as number | null,
        introPending: startOff !== 0, introT: -1e9,
        vis: isStatic ? 1 : 0, cx: 0, cy: 0, cvx: 0, cvy: 0, rz: 0, ox: 0, oy: 0.5, placed: false,
        stp: 0, stv: 0, sdir: 1, glT: 0, glLive: false, glDirty: true, glSig: "", zoom: 0, capA: -1, capB: -1, cssShown: true,
        bx: -999, by: -999, bvx: 0, bvy: 0, bs: 0, bsv: 0, cardBusy: false, bubBusy: false,
        bgInit: false, bgBusy: false, bgCss: "", bgTf: "", tc: [0, 0, 0] as number[], tcv: [0, 0, 0] as number[], tk: 0, tkv: 0,
        gc: [0, 0, 0] as number[], gcv: [0, 0, 0] as number[], gk: 0, gkv: 0, glKey: "",
    })
    const rowRefs = React.useRef<Map<number, HTMLDivElement>>(new Map())
    const textRefs = React.useRef<Map<number, HTMLElement>>(new Map())
    const letterRefs = React.useRef<Map<number, HTMLElement[]>>(new Map())
    const goRefs = React.useRef<Map<number, HTMLElement>>(new Map())
    const lensKey = React.useRef(new WeakMap<HTMLElement, string>()).current
    const itemsRef = React.useRef(items)
    itemsRef.current = items
    const cardRef = React.useRef<HTMLDivElement>(null)
    const cardClipRef = React.useRef<HTMLDivElement>(null)
    const cardInnerRef = React.useRef<HTMLDivElement>(null)
    const cardShadeRef = React.useRef<HTMLDivElement>(null)
    const layerRefs = React.useRef<{ w: HTMLDivElement | null; i: HTMLImageElement | null }[]>([])
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const glRef = React.useRef<GLCtx | null>(null)
    const capWrapRef = React.useRef<HTMLDivElement>(null)
    const capTrackRef = React.useRef<HTMLDivElement>(null)
    const capARef = React.useRef<HTMLDivElement>(null)
    const capBRef = React.useRef<HTMLDivElement>(null)
    const cntTrackRef = React.useRef<HTMLDivElement>(null)
    const cntARef = React.useRef<HTMLDivElement>(null)
    const cntBRef = React.useRef<HTMLDivElement>(null)
    const bubbleRef = React.useRef<HTMLDivElement>(null)
    const linkRef = React.useRef<HTMLAnchorElement>(null)
    const bgRef = React.useRef<HTMLDivElement>(null)
    const glowRef = React.useRef<HTMLCanvasElement>(null)
    const glowProf = React.useRef<{ w: number; h: number; p: Float32Array; im: ImageData } | null>(null)
    const grainRef = React.useRef<HTMLDivElement>(null)
    const ditherRef = React.useRef<HTMLDivElement>(null)
    // per item: the analysed image and its two colours (OKLab): the tint of the surroundings and the light around the card
    const bgData = React.useRef(new Map<number, { key: string; d: BgData | null; tint: [number, number, number] | null; glow: [number, number, number] | null; ready: number }>())
    const fontOk = React.useRef(!builtin)
    const cmix = React.useRef(true)
    const gv = {
        sp, G, R, pivotX, cy, lineH, side, n, edgeFade, h, w, rowW, cw, ch, P, cardX, cardY, capLine, capOn, capRows, stacked: narrow, radius, radPx, dpr,
        isStatic, glFail, instant: isStatic || reduce, idle, tiltK, rollK, trans, amt, wRest, wFocus, sRest, sFocus, spread, wave, lean,
        text: textColor, muted: mutedColor, cmix: cmix.current,
        bgOn, tintAmt, glowAmt, darkBg, bgLref, fillC, soundOn, soundStyle, soundVol,
    }
    const geo = React.useRef(gv)
    geo.current = gv

    // ---------- textures for the WebGL card ----------
    const ensureTex = (i: number) => {
        const G = glRef.current
        if (!G || G.lost) return
        const g = geo.current
        const full = Math.round(Math.min(1600, g.cw * g.dpr * 1.15))
        const old = G.tex.get(i)
        // an image's first look is a small copy, so the card opens sooner on a slow line; the sharp image takes
        // its place as soon as it is in (a ready texture stays on screen until its replacement has loaded)
        if (old && old.pv && old.st === 1) return
        const pv = !old && full > 640 ? previewUrl(itemsRef.current[i]?.image) : ""
        const tw = pv ? 512 : full
        const url = pv || pickUrl(itemsRef.current[i]?.image, tw)
        const key = url + "|" + (g.cw / g.ch).toFixed(3)
        if (old && old.key === key && (old.st !== 2 || old.tw >= tw * 0.75)) return
        if (old && old.next === key + "@" + tw) return
        if (!url) {
            if (old?.t) G.gl.deleteTexture(old.t)
            G.tex.set(i, { t: null, st: 4, key, tw })
            return
        }
        // a ready texture stays on screen until its sharper or new replacement has loaded
        const keep = !!old && old.st === 2 && !!old.t
        const rec: GLTex = keep ? (old as GLTex) : { t: null, st: 1, key, tw, pv: !!pv }
        const ticket = key + "@" + tw
        rec.next = ticket
        if (!keep) {
            if (old?.t) G.gl.deleteTexture(old.t)
            G.tex.set(i, rec)
        }
        const stale = () => G.tex.get(i) !== rec || rec.next !== ticket || G.lost
        const free = (im: CanvasImageSource | null) => {
            if (typeof ImageBitmap !== "undefined" && im instanceof ImageBitmap) im.close()
        }
        const upload = (im: CanvasImageSource, iw: number, ih: number) => {
            if (stale()) return free(im)
            try {
                // crop to the card (plus the parallax margin) and scale down once, so the GPU never minifies
                const ra = g.cw / g.ch / (1 + 2 * EXT)
                let sw = iw
                let sh = iw / ra
                if (sh > ih) {
                    sh = ih
                    sw = ih * ra
                }
                const W = Math.max(2, Math.round(Math.min(sw, tw)))
                const H = Math.max(2, Math.round(W / ra))
                const c = document.createElement("canvas")
                c.width = W
                c.height = H
                const x = c.getContext("2d")
                if (!x) throw new Error("2d")
                x.imageSmoothingEnabled = true
                x.imageSmoothingQuality = "high"
                x.drawImage(im, (iw - sw) / 2, (ih - sh) / 2, sw, sh, 0, 0, W, H)
                const gl = G.gl
                const t = gl.createTexture()
                gl.bindTexture(gl.TEXTURE_2D, t)
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
                if (rec.t) gl.deleteTexture(rec.t)
                rec.t = t
                rec.st = 2
                rec.key = key
                rec.tw = tw
                rec.pv = !!pv
                rec.next = undefined
                st.current.glDirty = true
            } catch {
                // an image without CORS taints the canvas – the CSS card takes over
                rec.st = 3
                setGlFail(true)
            }
            free(im)
            kick.current()
        }
        loadImage(url, (im, iw, ih) => {
            if (stale()) return free(im)
            if (!im) {
                rec.st = 3
                setGlFail(true)
                return
            }
            // uploads wait in a queue: one per frame, the image on screen first
            upQ.current.push({ i, run: () => upload(im, iw, ih) })
            kick.current()
        }, "high")
    }

    // one texture upload per frame, the images on screen first – the rest waits until the intro has played
    const upQ = React.useRef<{ i: number; run: () => void }[]>([])
    const runUpload = (t: number) => {
        const q = upQ.current
        const s = st.current
        const n0 = geo.current.n
        if (!q.length || !n0) return
        const near = (i: number) =>
            [s.stp, s.pos, s.target, s.focusK ?? s.pos].some((c) => {
                const d = mod(i - c, n0)
                return Math.min(d, n0 - d) < 1.5
            })
        let at = q.findIndex((x) => near(x.i))
        if (at < 0) {
            if (s.introPending || t - s.introT < 900) return
            at = 0
        }
        q.splice(at, 1)[0].run()
    }

    // a CSS card layer gets its image only when it is about to be shown
    const cssImg = (i: number) => {
        const l = layerRefs.current[i]
        const im = l && l.i
        if (!im || im.getAttribute("src")) return
        const it = itemsRef.current[i]
        const set = imgSet(it?.image)
        if (set) im.srcset = set
        im.src = imgSrc(it?.image)
    }
    // the first reveal waits for its image, so the card never opens on an empty frame
    const imageReady = (p: number) => {
        const g = geo.current
        const Gl = glRef.current
        const j = Math.floor(p + 1e-6)
        for (const i of p - j > 0.0004 ? [mod(j, g.n), mod(j + 1, g.n)] : [mod(j, g.n)]) {
            if (!imgSrc(itemsRef.current[i]?.image)) continue
            if (Gl && !Gl.lost) {
                ensureTex(i)
                const t = Gl.tex.get(i)
                if (!t || t.st === 1) return false
            } else if (!g.glFail) return false
            else {
                cssImg(i)
                const im = layerRefs.current[i]?.i
                if (im && !im.complete) return false
            }
        }
        return true
    }

    // ---------- per frame: rows, lens, card, cursor label ----------
    const apply = React.useCallback((dt: number = 0) => {
        const s = st.current
        const g = geo.current
        const now = typeof performance !== "undefined" ? performance.now() : 0
        // lens centre: the focused title, otherwise the centre of the arc
        const lcT = s.focusK != null ? s.focusK : s.pos
        if (g.instant || !s.lensInit) {
            s.lensC = lcT
            s.lensV = 0
            s.lensInit = true
        } else if (dt > 0) {
            const K = s.focusK == null && s.moving ? 320 : 140
            const C = 2 * Math.sqrt(K)
            const steps = Math.ceil(dt / (1 / 120))
            const hh = dt / steps
            for (let i = 0; i < steps; i++) {
                s.lensV += (K * (lcT - s.lensC) - C * s.lensV) * hh
                s.lensC += s.lensV * hh
            }
            if (Math.abs(lcT - s.lensC) < 0.0005 && Math.abs(s.lensV) < 0.01) {
                s.lensC = lcT
                s.lensV = 0
            }
        }
        // a letter wave runs through every title that newly takes the focus
        const fr = s.focusK != null ? Math.round(s.focusK) : null
        if (g.wave && !s.moving && !s.introPending) {
            // only after the focus has rested on a title for a moment, so quick sweeps stay calm
            if (fr == null) s.waveK = null
            if (fr !== s.waveCand) {
                s.waveCand = fr
                s.waveCandT = now
            } else if (fr != null && fr !== s.waveK && now - s.waveCandT > 110) {
                s.waveK = fr
                s.waves.set(fr, now)
                s.waveRel.delete(fr)
            }
        }
        const fadeIn = s.introPending ? 0 : clamp((now - s.introT) / 320, 0, 1)
        const lensQ = Math.abs(s.lensV) > 0.8 || s.lensAmp < 1 ? 64 : 192
        const leanT = g.lean && Math.abs(s.lean) > 0.05 ? ` skewX(${s.lean.toFixed(2)}deg)` : ""
        rowRefs.current.forEach((el, k) => {
            const d = k - s.pos
            const a = (d * g.sp) / g.R
            const vis = Math.abs(a) < 1.45
            el.style.visibility = vis ? "visible" : "hidden"
            if (!vis) return
            // the titles keep their places on the arc – only the lens changes them, so nothing shifts when the focus moves
            const y = g.cy
            const deg = (a * 180) / Math.PI
            el.style.transform =
                g.side === "left"
                    ? `translate3d(${g.pivotX}px,${y}px,0) rotate(${deg}deg) translate3d(${g.R}px,0,0)${leanT} translate3d(0,${-g.lineH / 2}px,0)`
                    : `translate3d(${g.pivotX}px,${y}px,0) rotate(${-deg}deg) translate3d(${-g.R - g.rowW}px,0,0)${leanT} translate3d(0,${-g.lineH / 2}px,0)`
            const dy = Math.abs(y + Math.sin(a) * g.R - g.h / 2)
            let op = (g.edgeFade > 0 ? clamp((g.h / 2 - dy - g.lineH * 0.6) / (g.h * (g.edgeFade / 100)), 0, 1) : 1) * fadeIn
            if (g.stacked) {
                // the list starts at the focus: a title moving up past it slips away under the image
                const up = clamp((-Math.sin(a) * g.R) / (g.sp * 0.9), 0, 1)
                op *= Math.pow(1 - up, 1.5)
            }
            // typographic lens: width, weight and ink follow the distance to the focus – in coarse steps while the
            // lens moves fast (invisible in motion, few font instances) and three times finer as it comes to rest
            // (about 2 weight units, 0.2 % width), so the titles next to the focus glide to rest instead of ticking
            const dd = (k - s.lensC) / g.spread
            const e = Math.round(s.lensAmp * Math.exp(-dd * dd) * lensQ) / lensQ
            const txt = textRefs.current.get(k)
            if (txt) {
                // titles faded into the edge can neither be hovered nor clicked
                const pe = op > 0.3 ? "auto" : "none"
                if (txt.style.pointerEvents !== pe) txt.style.pointerEvents = pe
                const wv = Math.round(g.wRest + (g.wFocus - g.wRest) * e)
                const sv = Math.round((g.sRest + (g.sFocus - g.sRest) * e) * 10) / 10
                const cp = Math.round(Math.pow(e, 1.25) * 100)
                const key = `${wv}|${sv}|${cp}|${g.text}|${g.muted}|${g.cmix}|${g.wRest}|${g.sRest}`
                if (lensKey.get(txt) !== key) {
                    lensKey.set(txt, key)
                    txt.style.fontWeight = String(wv)
                    txt.style.fontStretch = sv + "%"
                    txt.style.color = !g.cmix || cp >= 100 ? g.text : cp <= 0 ? g.muted : `color-mix(in srgb, ${g.text} ${cp}%, ${g.muted})`
                }
                if (!g.cmix) op *= 0.22 + 0.78 * (cp / 100)
                const t0 = s.waves.get(k)
                if (t0 != null) {
                    const ls = letterRefs.current.get(k) || []
                    const N = ls.length
                    const stag = Math.min(0.045, 0.4 / Math.max(1, N))
                    const T = (now - t0) / 1000
                    // a title that loses the focus lets its wave go within 120 ms
                    let rel = s.waveRel.get(k)
                    if (rel == null && k !== fr) {
                        rel = now
                        s.waveRel.set(k, now)
                    }
                    const keep = rel == null ? 1 : Math.pow(Math.max(0, 1 - (now - rel) / 120), 2)
                    if (T > (N - 1) * stag + WAVE_S || !g.wave || keep <= 0) {
                        for (const l of ls) {
                            l.style.fontWeight = ""
                            l.style.fontStretch = ""
                        }
                        s.waves.delete(k)
                        s.waveRel.delete(k)
                    } else {
                        // each letter breathes in (heavier, wider) and settles back, left to right
                        const dW = Math.max(0, Math.min(90, 1000 - wv))
                        const amp = e * keep
                        for (let i = 0; i < N; i++) {
                            const u = (T - i * stag) / WAVE_S
                            const raw = u <= 0 || u >= 1 ? 0 : 0.5 - 0.5 * Math.cos(u * Math.PI * 2)
                            // eight steps per swell: smooth to the eye, few font instances
                            const hm = Math.round(raw * amp * 8) / 8
                            const l = ls[i]
                            if (hm <= 0) {
                                if (l.style.fontWeight) {
                                    l.style.fontWeight = ""
                                    l.style.fontStretch = ""
                                }
                                continue
                            }
                            const lw = String(Math.round((wv + dW * hm) / 4) * 4)
                            const lsv = Math.round((sv + 3 * hm) * 2) / 2 + "%"
                            if (l.style.fontWeight !== lw) l.style.fontWeight = lw
                            if (l.style.fontStretch !== lsv) l.style.fontStretch = lsv
                        }
                    }
                }
            }
            const go = goRefs.current.get(k)
            if (go) {
                const ga = clamp((e - 0.55) / 0.4, 0, 1)
                const gs = ga * ga * (3 - 2 * ga)
                const gk = gs.toFixed(3)
                if (go.dataset.a !== gk) {
                    go.dataset.a = gk
                    go.style.opacity = gk
                    go.style.transform = `translate3d(${(gs - 1) * 0.12}em,${(1 - gs) * 0.12}em,0)`
                }
            }
            el.style.opacity = String(op)
        })
        // waves of rows that scrolled out of view
        s.waves.forEach((t0, k) => {
            if (now - t0 > 2500 || !rowRefs.current.has(k)) {
                s.waves.delete(k)
                s.waveRel.delete(k)
            }
        })
        updateCard(dt, now)
        updateBubble(dt)
    }, [])

    // ---------- background ----------
    // the colours of an analysed image, both in its leading hue: the tint of the surroundings and the light around the card
    const tintOf = (r: { d: BgData | null; tint: [number, number, number] | null; glow: [number, number, number] | null }) => {
        const g = geo.current
        const d = r.d
        if (!d) return
        const Lr = g.bgLref
        // light ground: pastel paper in the hue (OKLCH chroma ≤ 0.05); dark ground: a deep shade of it
        const Ct = g.darkBg ? Math.min(0.045, d.c * 0.45) : Math.min(0.05, d.c * 0.5)
        r.tint = [Lr, d.ha * Ct, d.hb * Ct]
        // the light is the same hue, richer: on light ground between the hue's own lightness in the image and the
        // paper – never far below the paper, so a dark image never leaves a grey smudge – and on dark ground a lit
        // colour above the surroundings. A grey image gives a quiet light
        const Lg = g.darkBg ? clamp(Lr + 0.15, 0.22, 0.62) : clamp(d.l + (Lr - d.l) * 0.43, Lr - 0.16, Lr - 0.02)
        const Cg = fitChroma(Lg, d.ha, d.hb, g.darkBg ? Math.min(0.13, d.c * 1.2) : Math.min(0.15, d.c * 1.35))
        r.glow = [Lg, d.ha * Cg, d.hb * Cg]
    }
    // the light: one soft pool, (1 − r²)^2.2 – full in the middle, smooth all the way to its rim – in one colour
    const drawGlow = (cv: HTMLCanvasElement, c: [number, number, number], a: number) => {
        const g = geo.current
        const W = Math.max(8, Math.round((g.cw * GLOW_RX * 2) / GLOW_T))
        const H = Math.max(8, Math.round((g.ch * GLOW_RY * 2) / GLOW_T))
        const x = cv.getContext("2d")
        if (!x) return
        let pr = glowProf.current
        if (!pr || pr.w !== W || pr.h !== H || cv.width !== W || cv.height !== H) {
            cv.width = W
            cv.height = H
            const p = new Float32Array(W * H)
            for (let yy = 0; yy < H; yy++)
                for (let xx = 0; xx < W; xx++) {
                    const u = ((xx + 0.5) / W) * 2 - 1
                    const v = ((yy + 0.5) / H) * 2 - 1
                    p[yy * W + xx] = Math.pow(1 - Math.min(1, u * u + v * v), 2.2)
                }
            pr = glowProf.current = { w: W, h: H, p, im: x.createImageData(W, H) }
        }
        const o = pr.im.data
        const A = a * 255
        for (let i = 0, j = 0; i < pr.p.length; i++, j += 4) {
            o[j] = c[0]
            o[j + 1] = c[1]
            o[j + 2] = c[2]
            o[j + 3] = Math.round(pr.p[i] * A)
        }
        x.putImageData(pr.im, 0, 0)
    }
    // per frame: the background glides to the image on screen. Colour and light follow their own soft springs,
    // so a fast scroll does not flash through every title in between – it drifts once from the old to the new mood
    const updateBg = (dt: number, ev: number) => {
        const s = st.current
        const g = geo.current
        const B = bgRef.current
        if (!B || !g.n || !g.bgOn) {
            s.bgBusy = false
            return
        }
        const snap = g.instant || !s.bgInit || s.vis < 0.002
        s.bgInit = true
        const cur = mod(Math.round(s.stp), g.n)
        const W = 6
        let busy = false
        // a critically damped spring: no jump in speed at the start, no overshoot at the end
        const spring = (x: number, v: number, to: number): [number, number] => {
            if (snap || dt <= 0) return snap ? [to, 0] : [x, v]
            const steps = Math.ceil(dt / (1 / 120))
            const hh = dt / steps
            for (let i = 0; i < steps; i++) {
                v += (W * W * (to - x) - 2 * W * v) * hh
                x += v * hh
            }
            if (Math.abs(to - x) < 0.0006 && Math.abs(v) < 0.004) return [to, 0]
            busy = true
            return [x, v]
        }
        // tint: the hue of the image on screen over the fill
        const F = g.fillC
        let css = ""
        if (g.tintAmt > 0) {
            const rc = bgData.current.get(cur)
            const tt = rc && rc.tint ? rc.tint : null
            if (tt && s.tk < 0.002) {
                // the first colour starts where it belongs, it only fades in
                s.tc = tt.slice()
                s.tcv = [0, 0, 0]
            }
            if (tt)
                for (let k = 0; k < 3; k++) {
                    const r = spring(s.tc[k], s.tcv[k], tt[k])
                    s.tc[k] = r[0]
                    s.tcv[k] = r[1]
                }
            const rk = spring(s.tk, s.tkv, tt ? 1 : 0)
            s.tk = clamp(rk[0], 0, 1)
            s.tkv = rk[1]
            const t = clamp(g.tintAmt * (g.idle ? 1 : ev) * s.tk, 0, 1)
            if (t > 0.001) {
                const c = fromOklab(s.tc[0], s.tc[1], s.tc[2])
                const af = F[3]
                const ao = t + af * (1 - t)
                const mix = (k: number) => Math.round((c[k] * t + F[k] * af * (1 - t)) / ao)
                css = `rgba(${mix(0)},${mix(1)},${mix(2)},${ao.toFixed(3)})`
            }
        }
        if (!css) css = `rgba(${Math.round(F[0])},${Math.round(F[1])},${Math.round(F[2])},${F[3]})`
        if (css !== s.bgCss) {
            s.bgCss = css
            B.style.backgroundColor = css
        }
        // glow: one pool of light whose colour glides like the tint – a change of image never crossfades two lights
        const gl = glowRef.current
        if (g.glowAmt > 0 && gl) {
            const rc = bgData.current.get(cur)
            const gt = rc && rc.glow ? rc.glow : null
            if (gt && s.gk < 0.002) {
                s.gc = gt.slice()
                s.gcv = [0, 0, 0]
            }
            if (gt)
                for (let k = 0; k < 3; k++) {
                    const r = spring(s.gc[k], s.gcv[k], gt[k])
                    s.gc[k] = r[0]
                    s.gcv[k] = r[1]
                }
            const rk = spring(s.gk, s.gkv, gt ? 1 : 0)
            s.gk = clamp(rk[0], 0, 1)
            s.gkv = rk[1]
            const a = clamp(g.glowAmt * ev * s.gk * (g.darkBg ? 0.85 : 1.3), 0, 1)
            const c = fromOklab(s.gc[0], s.gc[1], s.gc[2])
            const key = a > 0.002 ? `${c[0]},${c[1]},${c[2]},${Math.round(a * 1000)}` : "0"
            if (key !== s.glKey) {
                s.glKey = key
                drawGlow(gl, c, a > 0.002 ? Math.round(a * 1000) / 1000 : 0)
            }
            // the light follows the card a little when it moves with the pointer
            const tf = s.placed ? `translate3d(${((s.cx - g.cardX) * 0.6).toFixed(1)}px,${((s.cy - g.cardY) * 0.6).toFixed(1)}px,0)` : "none"
            if (tf !== s.bgTf) {
                s.bgTf = tf
                gl.style.transform = tf
            }
        }
        s.bgBusy = busy
    }

    // the image card: one calm spot beside the arc. Its images lie on a vertical film strip that
    // rolls to the focused title – continuous, so fast scrolling rolls through instead of restarting
    const updateCard = (dt: number, now: number) => {
        const s = st.current
        const g = geo.current
        const card = cardRef.current
        if (!card || !g.n) return
        const instant = g.instant
        const fk = s.focusK
        const hov = fk != null
        const pT = hov ? (fk as number) : s.pos
        let show = g.isStatic || (!s.introPending && now - s.introT > 140 && (hov || g.idle || (s.pin && s.moving)))
        // the card only opens once its image is in (or after 2.5 s), never on an empty frame
        let waiting = false
        if (show && !g.isStatic && s.vis < 0.01) {
            if (!s.wantT) s.wantT = now
            if (now - s.wantT < 2500 && !imageReady(pT)) {
                show = false
                waiting = true
            }
        } else s.wantT = 0
        let tx = g.cardX
        let ty = g.cardY
        if (s.pin && s.mouse && !instant) {
            tx += clamp((s.px - (g.cardX + g.cw / 2)) * 0.03, -18, 18)
            ty += clamp((s.py - g.h / 2) * 0.05, -g.ch * 0.08, g.ch * 0.08)
        }
        const rz = 0
        const vT = show ? 1 : 0
        if (vT > 0 && s.vis < 0.01) {
            s.cx = tx
            s.cy = ty
            s.cvx = s.cvy = 0
            s.ox = g.side === "left" ? 0 : 1
            s.oy = s.pin ? clamp((s.py - ty) / g.ch, 0, 1) : 0.5
            s.stp = pT
            s.stv = 0
        }
        if (instant) s.vis = vT
        else s.vis += (vT - s.vis) * (1 - Math.exp(-(vT > s.vis ? 4.5 : 7) * dt))
        if (Math.abs(vT - s.vis) < 0.002) s.vis = vT
        // position spring (soft) and film strip spring (critically damped, locked to the arc while it turns)
        if (instant || !s.placed) {
            s.cx = tx
            s.cy = ty
            s.cvx = s.cvy = 0
            s.stp = pT
            s.stv = 0
            s.placed = true
        } else if (dt > 0) {
            const steps = Math.ceil(dt / (1 / 120))
            const hh = dt / steps
            const K = 120
            const C = 2 * Math.sqrt(K) * 0.9
            const KS = s.moving ? Math.max(g.rollK * 4, 420) : g.rollK
            const CS = 2 * Math.sqrt(KS)
            for (let i = 0; i < steps; i++) {
                s.cvx += (K * (tx - s.cx) - C * s.cvx) * hh
                s.cvy += (K * (ty - s.cy) - C * s.cvy) * hh
                s.cx += s.cvx * hh
                s.cy += s.cvy * hh
                s.stv += (KS * (pT - s.stp) - CS * s.stv) * hh
                s.stp += s.stv * hh
            }
        }
        if (Math.abs(pT - s.stp) < 0.0004 && Math.abs(s.stv) < 0.02) {
            s.stp = pT
            s.stv = 0
        }
        if (Math.abs(s.stv) > 0.25) s.sdir += ((s.stv > 0 ? 1 : -1) - s.sdir) * (1 - Math.exp(-10 * dt))
        const zT = s.overCard && s.mouse ? 1 : 0
        s.zoom += (zT - s.zoom) * (instant ? 1 : 1 - Math.exp(-6 * dt))
        if (Math.abs(zT - s.zoom) < 0.002) s.zoom = zT
        const roll = clamp(s.stv, -12, 12)
        const ry = clamp(s.cvx * 0.02 * g.tiltK, -6, 6)
        const rx = clamp(-s.cvy * 0.02 * g.tiltK, -6, 6) + clamp(-roll * 0.2 * g.tiltK, -2.5, 2.5)
        s.rz += (rz - s.rz) * (instant ? 1 : 1 - Math.exp(-8 * dt))
        card.style.transform = `translate3d(${s.cx}px,${s.cy}px,0) perspective(1000px) rotate(${s.rz}deg) rotateX(${rx}deg) rotateY(${ry}deg)`
        card.style.visibility = s.vis > 0.002 ? "visible" : "hidden"
        card.style.pointerEvents = s.vis > 0.6 ? "auto" : "none"
        const ev = 1 - Math.pow(1 - s.vis, 3)
        const j = Math.floor(s.stp + 1e-6)
        let f = s.stp - j
        if (f < 0.0004) f = 0
        const ia = mod(j, g.n)
        const ib = mod(j + 1, g.n)
        // WebGL as soon as its textures are ready, the CSS layers until then (and as fallback)
        const Gl = glRef.current
        let useGL = false
        if (Gl && !Gl.lost && !g.isStatic) {
            ensureTex(ia)
            ensureTex(ib)
            const ta = Gl.tex.get(ia)
            const tb = Gl.tex.get(ib)
            const okA = !!ta && (ta.st === 2 || ta.st === 4)
            const okB = f === 0 || (!!tb && (tb.st === 2 || tb.st === 4))
            useGL = s.glLive || (okA && okB)
            const cv = canvasRef.current
            if (useGL && cv) {
                s.glLive = true
                const W = Math.round((g.cw + 2 * g.P) * g.dpr)
                const H = Math.round((g.ch + 2 * g.P) * g.dpr)
                if (cv.width !== W || cv.height !== H) {
                    cv.width = W
                    cv.height = H
                    s.glDirty = true
                }
                const animGL = f > 0 || (s.vis > 0 && s.vis < 1)
                if (animGL && dt > 0) s.glT = (s.glT + dt) % 600
                const hasA = ta && ta.st === 2 ? 1 : 0
                const hasB = tb && tb.st === 2 ? 1 : 0
                const sig = `${f.toFixed(4)}|${s.stv.toFixed(3)}|${ev.toFixed(4)}|${s.zoom.toFixed(3)}|${ia}|${ib}|${hasA}${hasB}|${W}x${H}|${g.trans}|${g.amt}|${g.radPx}|${s.sdir.toFixed(2)}|${animGL ? s.glT.toFixed(3) : ""}`
                if (s.vis > 0 && (s.glDirty || sig !== s.glSig)) {
                    s.glDirty = false
                    s.glSig = sig
                    const gl = Gl.gl
                    const U = Gl.U
                    gl.viewport(0, 0, W, H)
                    gl.clearColor(0, 0, 0, 0)
                    gl.clear(gl.COLOR_BUFFER_BIT)
                    gl.activeTexture(gl.TEXTURE0)
                    gl.bindTexture(gl.TEXTURE_2D, (hasA && ta?.t) || Gl.dummy)
                    gl.activeTexture(gl.TEXTURE1)
                    gl.bindTexture(gl.TEXTURE_2D, (hasB && tb?.t) || Gl.dummy)
                    gl.uniform2f(U.uRes, W, H)
                    gl.uniform4f(U.uCard, g.P * g.dpr, g.P * g.dpr, g.cw * g.dpr, g.ch * g.dpr)
                    gl.uniform1f(U.uRad, Math.min(g.radPx, g.cw / 2) * g.dpr)
                    gl.uniform1f(U.uF, f)
                    gl.uniform1f(U.uVel, s.stv)
                    gl.uniform1f(U.uVis, ev)
                    gl.uniform1f(U.uTime, s.glT)
                    gl.uniform1f(U.uAmt, g.amt)
                    gl.uniform1f(U.uMode, g.trans)
                    gl.uniform1f(U.uDir, s.sdir)
                    gl.uniform1f(U.uZoom, s.zoom)
                    gl.uniform1f(U.uHasA, hasA)
                    gl.uniform1f(U.uHasB, hasB)
                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
                }
            }
        }
        if (useGL === s.cssShown) {
            s.cssShown = !useGL
            if (cardClipRef.current) cardClipRef.current.style.visibility = useGL ? "hidden" : "visible"
            if (canvasRef.current) canvasRef.current.style.visibility = useGL ? "visible" : "hidden"
        }
        if (!useGL) {
            // CSS: the card opens like an iris out of the pointer, images roll with a parallax
            const q = (1 - ev) * 100
            if (cardClipRef.current)
                cardClipRef.current.style.clipPath = `inset(${q * s.oy}% ${q * (1 - s.ox)}% ${q * (1 - s.oy)}% ${q * s.ox}% round ${g.radius})`
            if (cardInnerRef.current) cardInnerRef.current.style.transform = `scale(${(1.18 - 0.18 * ev) * (1 + 0.04 * s.zoom)})`
            const rl = g.trans !== 2
            const ls = layerRefs.current
            cssImg(ia)
            if (f > 0) cssImg(ib)
            for (let i = 0; i < g.n; i++) {
                const l = ls[i]
                if (!l || !l.w) continue
                const isA = i === ia
                const isB = !isA && i === ib && f > 0
                l.w.style.visibility = isA || isB ? "visible" : "hidden"
                if (isA) {
                    l.w.style.zIndex = "1"
                    l.w.style.clipPath = "none"
                    l.w.style.opacity = "1"
                    if (l.i) l.i.style.transform = f ? (rl ? `translate3d(0,${-f * 24}%,0) scale(${1 + 0.06 * f})` : `scale(${1 + 0.05 * f})`) : "none"
                } else if (isB) {
                    l.w.style.zIndex = "3"
                    l.w.style.clipPath = rl ? `inset(${(1 - f) * 100}% 0 0 0)` : "none"
                    l.w.style.opacity = rl ? "1" : String(f)
                    if (l.i) l.i.style.transform = rl ? `translate3d(0,${(1 - f) * 24}%,0) scale(${1.1 - 0.1 * f})` : `scale(${1.08 - 0.08 * f})`
                }
            }
            if (cardShadeRef.current) cardShadeRef.current.style.opacity = String(rl ? 0.42 * f : 0)
        }
        // caption and counter roll in step with the strip
        if (g.capOn) {
            if (s.capA !== ia || s.capB !== ib) {
                s.capA = ia
                s.capB = ib
                const put = (el: HTMLDivElement | null, i: number) => {
                    if (!el) return
                    const it = itemsRef.current[i]
                    const t = el.children[0] as HTMLElement | undefined
                    const c = el.children[1] as HTMLElement | undefined
                    if (t) t.textContent = it?.title || ""
                    if (c) c.textContent = it?.caption || ""
                }
                put(capARef.current, ia)
                put(capBRef.current, ib)
                if (cntARef.current) cntARef.current.textContent = pad2(ia + 1)
                if (cntBRef.current) cntBRef.current.textContent = pad2(ib + 1)
            }
            if (capTrackRef.current) capTrackRef.current.style.transform = `translate3d(0,${-f * g.capLine * g.capRows}px,0)`
            if (cntTrackRef.current) cntTrackRef.current.style.transform = `translate3d(0,${-f * g.capLine}px,0)`
            if (capWrapRef.current) capWrapRef.current.style.opacity = String(clamp((s.vis - 0.45) / 0.55, 0, 1))
        }
        updateBg(dt, ev)
        s.cardBusy =
            waiting ||
            s.vis !== vT || s.stp !== pT || s.zoom !== zT || Math.abs(s.cvx) + Math.abs(s.cvy) > 2 || Math.abs(tx - s.cx) + Math.abs(ty - s.cy) > 0.5 || Math.abs(rz - s.rz) > 0.05
    }

    // the "View" label trails the pointer over the image when it has a link
    const updateBubble = (dt: number) => {
        const s = st.current
        const g = geo.current
        const b = bubbleRef.current
        if (!b || !g.n) {
            s.bubBusy = false
            return
        }
        const item = (k: number | null) => (k == null ? undefined : itemsRef.current[mod(k, g.n)])
        const want = s.pin && s.mouse && !s.dragLive && s.overCard && s.vis > 0.6 && !!item(Math.round(s.stp))?.link
        const tx = s.px + 14
        const ty = s.py + 16
        if (s.bx < -900 || g.instant) {
            s.bx = tx
            s.by = ty
            s.bvx = s.bvy = 0
        }
        const bT = want ? 1 : 0
        if (g.instant) {
            s.bs = bT
            s.bsv = 0
        } else if (dt > 0) {
            const steps = Math.ceil(dt / (1 / 120))
            const hh = dt / steps
            const K = 380
            const C = 2 * Math.sqrt(K)
            const KS = 260
            const CS = 2 * Math.sqrt(KS) * 0.72
            for (let i = 0; i < steps; i++) {
                s.bvx += (K * (tx - s.bx) - C * s.bvx) * hh
                s.bvy += (K * (ty - s.by) - C * s.bvy) * hh
                s.bx += s.bvx * hh
                s.by += s.bvy * hh
                s.bsv += (KS * (bT - s.bs) - CS * s.bsv) * hh
                s.bs += s.bsv * hh
            }
        }
        if (Math.abs(bT - s.bs) < 0.002 && Math.abs(s.bsv) < 0.01) {
            s.bs = bT
            s.bsv = 0
        }
        const sc = Math.max(0, s.bs)
        b.style.transform = `translate3d(${s.bx}px,${s.by}px,0) scale(${0.5 + 0.5 * Math.min(1.2, sc)})`
        b.style.opacity = String(clamp(sc * 1.4, 0, 1))
        b.style.visibility = sc > 0.01 ? "visible" : "hidden"
        s.bubBusy = s.bs !== bT || Math.abs(s.bvx) + Math.abs(s.bvy) > 1 || Math.abs(tx - s.bx) + Math.abs(ty - s.by) > 0.5
    }

    // which title is under the pointer (also while the titles move under a resting pointer)
    const hitTest = () => {
        const s = st.current
        if (!s.pin || typeof document === "undefined") return
        const el = document.elementFromPoint(s.clientX, s.clientY) as HTMLElement | null
        const inCard = !!(el && el.closest && el.closest(".ata-card"))
        s.overCard = inCard
        const now = performance.now()
        if (inCard) {
            // the image keeps the title it came from, so it can be clicked
            s.miss = false
            s.hitT = now
            return
        }
        const row = el && el.closest ? (el.closest(".ata-hit")?.closest("[data-k]") as HTMLElement | null) : null
        if (row && rootRef.current && rootRef.current.contains(row)) {
            if (s.moving || s.hoverLock) return
            s.hoverK = Number(row.dataset.k)
            s.hitT = now
            s.miss = false
        } else if (s.hoverK != null && !s.moving && !s.hoverLock) {
            // a short grace keeps the focus while the pointer crosses the gap between titles
            s.miss = true
            if (now - s.hitT > 160) {
                s.hoverK = null
                s.miss = false
            }
        }
    }

    const activeIndex = mod(active, Math.max(1, n))

    const openLink = (idx: number) => {
        const a = linkRef.current
        const it = items[idx]
        if (!a || !it || !it.link) return
        a.setAttribute("href", it.link)
        if (it.newTab) {
            a.setAttribute("target", "_blank")
            a.setAttribute("rel", "noopener noreferrer")
        } else {
            a.removeAttribute("target")
            a.removeAttribute("rel")
        }
        a.click()
    }

    // ---------- main loop ----------
    const kick = React.useRef<() => void>(() => {})
    const baseRef = React.useRef(0)
    const activeRef = React.useRef(0)
    React.useEffect(() => {
        if (isStatic) return
        const s = st.current
        let dead = false
        const step = (t: number) => {
            s.raf = 0
            if (dead) return
            const gap = s.last ? t - s.last : 0
            const dt = clamp((t - (s.last || t)) / 1000, 1 / 240, 1 / 20)
            s.last = t
            if (s.introPending && reduce) {
                // no intro with reduced motion: everything stands in place at once
                s.introPending = false
                s.introT = -1e9
                s.pos = s.target
                s.lastPos = s.pos
                s.lensAmp = 1
            } else if (s.introPending && s.visible && fontOk.current) {
                // the intro starts on calm frames, not while the page is still busy loading
                if (!s.introWait) s.introWait = t
                s.calm = gap > 0 && gap < 24 ? s.calm + 1 : 0
                if (s.calm >= 3 || t - s.introWait > 350) {
                    s.introPending = false
                    s.introT = t
                }
            }
            runUpload(t)
            if (s.wOn) wheelTarget(t)
            if (!s.dragging && !s.introPending) {
                if (reduce) {
                    s.pos += (s.target - s.pos) * (1 - Math.exp(-60 * dt))
                    s.av = 0
                } else if (s.glideK > 0) {
                    // a thrown arc glides out with the speed it was let go with and lands on its title
                    const np = s.pos + (s.target - s.pos) * (1 - Math.exp(-s.glideK * dt))
                    s.av = (np - s.pos) / dt
                    s.pos = np
                } else {
                    // everything else follows a critically damped spring: the speed never jumps, so new targets
                    // (wheel, keys, autoplay) blend in and every stop is one smooth deceleration
                    const W = springW
                    const steps = Math.ceil(dt / (1 / 240))
                    const hh = dt / steps
                    for (let i = 0; i < steps; i++) {
                        s.av += (W * W * (s.target - s.pos) - 2 * W * s.av) * hh
                        s.pos += s.av * hh
                    }
                }
                if (Math.abs(s.target - s.pos) < 0.0005 && Math.abs(s.av) < 0.02) {
                    s.pos = s.target
                    s.av = 0
                    s.glideK = 0
                }
            }
            // sound: a quiet click for every title that passes the focus while someone scrolls, drags or steps –
            // never for autoplay or the intro
            const kNow = Math.round(s.pos)
            if (kNow !== s.tickK) {
                const gg = geo.current
                if (s.tickK !== null && gg.soundOn && t - s.userT < 1500 && !s.introPending) clickSound(gg.soundStyle, gg.soundVol, Math.abs(s.pv), kNow)
                s.tickK = kNow
            }
            // speed lean: titles tilt into fast turns
            const pv = (s.pos - s.lastPos) / dt
            s.lastPos = s.pos
            s.pv += (pv - s.pv) * (1 - Math.exp(-14 * dt))
            const leanT = geo.current.lean ? clamp(-s.pv * 1.6, -8, 8) : 0
            s.lean += (leanT - s.lean) * (1 - Math.exp(-10 * dt))
            if (Math.abs(leanT - s.lean) < 0.02 && Math.abs(leanT) < 0.02) s.lean = 0
            if (!s.introPending && s.lensAmp < 1) {
                const r = t - s.introT > 120 ? 1 - Math.exp(-(reduce ? 60 : 3.2) * dt) : 0
                s.lensAmp += (1 - s.lensAmp) * r
                if (1 - s.lensAmp < 0.002) s.lensAmp = 1
            }
            // a press alone is no motion – only a real drag, a turn or the wheel
            const moving = s.dragLive || s.wOn || Math.abs(s.target - s.pos) > 0.004 || Math.abs(s.av) > 0.05 || t - s.wheelT < 160
            if (moving) s.restT = t
            const settled = !moving && t - s.restT > (reduce ? 0 : 140)
            s.settled = settled
            s.moving = moving
            if (moving) {
                // while the arc turns the lens and the image stay with the centre – titles sliding under a
                // resting pointer do not flicker, and the hover only returns once the mouse moves again
                if (s.pin) {
                    if (!s.hoverLock) {
                        s.lockX = s.clientX
                        s.lockY = s.clientY
                    }
                    s.hoverLock = true
                }
                s.hoverK = null
                s.miss = false
                s.focusK = null
            } else {
                if (s.pin && s.miss && !s.hoverLock) hitTest()
                s.focusK = s.hoverLock ? null : s.hoverK
            }
            s.wasMoving = moving
            const b = Math.round(s.pos)
            if (b !== baseRef.current) {
                baseRef.current = b
                setBase(b)
            }
            const ai = Math.round(s.target)
            if (ai !== activeRef.current) {
                activeRef.current = ai
                setActive(ai)
            }
            // autoplay: advance once the arc has rested for `interval`
            const canAuto = autoplay && !reduce && !s.hover && !s.focus && !s.dragging && s.visible && !s.introPending && t - s.introT > 900
            if (canAuto && settled) {
                if (!s.autoT) s.autoT = t
                if (t - s.autoT > interval * 1000) {
                    s.autoT = 0
                    s.glideK = 0
                    s.target = Math.round(s.target) + dir
                }
            } else s.autoT = 0
            apply(dt)
            const lensT = s.focusK != null ? s.focusK : s.pos
            // the target can change after `moving` was measured (autoplay advances here) – the arc then still has to go
            const busy =
                moving || !settled || s.target !== s.pos || s.cardBusy || s.bubBusy || s.miss || s.lensC !== lensT || s.lensAmp < 1 ||
                (t - s.introT < 450) || s.waves.size > 0 || (s.waveCand != null && s.waveCand !== s.waveK && geo.current.wave) || s.lean !== 0 ||
                upQ.current.length > 0 || s.bgBusy
            if (s.visible && (s.introPending ? fontOk.current : busy)) s.raf = requestAnimationFrame(step)
            else {
                s.last = 0
                // resting between autoplay steps costs no frames: a timer wakes the loop
                if (canAuto && settled && s.autoT && !s.autoTimer) {
                    const left = Math.max(16, interval * 1000 - (t - s.autoT) + 8)
                    s.autoTimer = setTimeout(() => {
                        s.autoTimer = 0
                        kick.current()
                    }, left)
                }
            }
        }
        kick.current = () => {
            if (dead) return
            if (s.autoTimer) {
                clearTimeout(s.autoTimer)
                s.autoTimer = 0
            }
            if (!s.raf && s.visible) s.raf = requestAnimationFrame(step)
        }
        kick.current()
        return () => {
            dead = true
            if (s.raf) cancelAnimationFrame(s.raf)
            s.raf = 0
            if (s.autoTimer) clearTimeout(s.autoTimer)
            s.autoTimer = 0
            kick.current = () => {}
        }
    }, [isStatic, reduce, springW, autoplay, interval, dir, apply])

    // sound is only allowed after the first click, tap or key on the page: listen for it once
    React.useEffect(() => {
        if (soundOn) armAudio()
    }, [soundOn])

    // the built-in font is in before the intro starts
    React.useEffect(() => {
        if (isStatic || !builtin || typeof document === "undefined") {
            fontOk.current = true
            return
        }
        let live = true
        const fin = () => {
            if (!live) return
            fontOk.current = true
            kick.current()
        }
        const timer = setTimeout(fin, 700)
        try {
            const fonts = (document as any).fonts
            if (fonts && fonts.load) fonts.load(`400 64px "${FAMILY}"`).then(fin, fin)
            else fin()
        } catch {
            fin()
        }
        return () => {
            live = false
            clearTimeout(timer)
        }
    }, [isStatic, builtin])

    React.useEffect(() => {
        try {
            cmix.current = typeof CSS === "undefined" || !CSS.supports ? true : CSS.supports("color", "color-mix(in srgb, red 50%, blue)")
        } catch {
            cmix.current = true
        }
    }, [])

    // visibility: pause offscreen
    React.useEffect(() => {
        if (isStatic) return
        const el = rootRef.current
        if (!el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(([e]) => {
            st.current.visible = e.isIntersecting
            if (e.isIntersecting) kick.current()
        })
        // unknown until the first report, so the intro never plays off screen
        st.current.visible = false
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic])

    // WebGL card (falls back to the CSS card without WebGL, on context loss or CORS errors)
    React.useEffect(() => {
        if (isStatic || glFail || n === 0) return
        const cv = canvasRef.current
        if (!cv) return
        const Gx = makeGL(cv)
        if (!Gx) {
            setGlFail(true)
            return
        }
        glRef.current = Gx
        const lost = (e: Event) => {
            e.preventDefault()
            Gx.lost = true
            glRef.current = null
            setGlFail(true)
        }
        cv.addEventListener("webglcontextlost", lost)
        setGlOn(true)
        return () => {
            cv.removeEventListener("webglcontextlost", lost)
            Gx.tex.forEach((t) => t.t && Gx.gl.deleteTexture(t.t))
            Gx.tex.clear()
            // queued uploads are stale now – running them only frees their decoded images
            const q = upQ.current
            upQ.current = []
            q.forEach((j) => j.run())
            if (glRef.current === Gx) glRef.current = null
            // hand the card back to the CSS layers
            st.current.glLive = false
            st.current.cssShown = true
            st.current.capA = st.current.capB = -1
            if (cardClipRef.current) cardClipRef.current.style.visibility = "visible"
            setGlOn(false)
            kick.current()
            // on unmount the context goes too (the canvas is already detached then)
            if (!cv.isConnected) Gx.gl.getExtension("WEBGL_lose_context")?.loseContext()
        }
    }, [isStatic, glFail, n > 0])

    // warm every texture, nearest first, so pointer hops never roll through empty frames
    const itemsKey = items.map((it) => imgSrc(it.image)).join("|")
    React.useEffect(() => {
        const Gx = glRef.current
        if (!glOn || !Gx) return
        Gx.tex.forEach((t, i) => {
            if (i >= n) {
                if (t.t) Gx.gl.deleteTexture(t.t)
                Gx.tex.delete(i)
            }
        })
        const c = Math.round(st.current.stp)
        for (let d = 0; d < n; d++) ensureTex(mod(c + (d % 2 ? (d + 1) / 2 : -d / 2), n))
        st.current.glDirty = true
        kick.current()
    }, [glOn, itemsKey, n, Math.round(cw), ratio])

    // background: read the colours of every image once (small copies, nearest first)
    const bgPoke = () => {
        if (isStatic) apply(0)
        else kick.current()
    }
    const bgRead = bgOn && (tintAmt > 0 || glowAmt > 0) && n > 0
    const cardRatio = (cw / ch).toFixed(3)
    React.useEffect(() => {
        if (!bgRead || typeof document === "undefined") return
        let dead = false
        const map = bgData.current
        map.forEach((_, i) => i >= n && map.delete(i))
        const want = Number(cardRatio)
        const c = Math.round(st.current.stp)
        for (let d = 0; d < n; d++) {
            const i = mod(c + (d % 2 ? (d + 1) / 2 : -d / 2), n)
            const url = smallUrl(itemsRef.current[i]?.image)
            const key = url + "|" + cardRatio
            const old = map.get(i)
            if (old && old.key === key) continue
            const rec = { key, d: null as BgData | null, tint: null as [number, number, number] | null, glow: null as [number, number, number] | null, ready: 0, done: false }
            map.set(i, rec)
            if (!url) {
                rec.done = true
                continue
            }
            loadImage(url, (im, iw, ih) => {
                const free = () => typeof ImageBitmap !== "undefined" && im instanceof ImageBitmap && im.close()
                if (dead || map.get(i) !== rec) return free()
                rec.done = true
                if (im && iw > 0 && ih > 0) {
                    try {
                        rec.d = analyse(im, iw, ih, want)
                    } catch {
                        rec.d = null
                    }
                }
                free()
                if (rec.d) tintOf(rec)
                bgPoke()
            }, "low")
        }
        return () => {
            dead = true
            // unfinished reads start again next time
            map.forEach((r: any, i) => !r.done && map.delete(i))
        }
    }, [bgRead, itemsKey, n, cardRatio])

    // new surroundings or settings: recolour from what was read
    React.useEffect(() => {
        bgData.current.forEach((r) => r.d && tintOf(r))
        bgPoke()
    }, [glowAmt, tintAmt, darkBg, bgLref, n, bgOn])

    // film grain and the light's dither: a tile of noise, set after mount so the server markup stays the same
    React.useLayoutEffect(() => {
        const u = grainTile()
        if (!u) return
        // one grain per screen pixel: finer than the image's detail, felt more than seen
        const gd = clamp(typeof window === "undefined" ? 1 : window.devicePixelRatio || 1, 1, 2)
        for (const el of [grainRef.current, ditherRef.current]) {
            if (!el) continue
            el.style.backgroundImage = `url(${u})`
            el.style.backgroundSize = `${128 / gd}px ${128 / gd}px`
        }
    }, [grainAmt > 0, glowAmt > 0, bgOn])

    // re-apply after any render (geometry / slot changes)
    React.useLayoutEffect(() => {
        st.current.glDirty = true
        st.current.capA = st.current.capB = -1
        st.current.bgCss = ""
        st.current.bgTf = "-"
        st.current.glKey = ""
        apply()
        if (!isStatic) kick.current()
    })

    const goTo = (k: number) => {
        const s = st.current
        s.userT = performance.now()
        s.target = k
        s.glideK = 0
        s.wOn = false
        s.autoT = 0
        kick.current()
    }
    // the wheel's target: a fast wheel is followed directly, and as it slows down the target slides onto the whole
    // title ahead – so the arc comes to rest in one deceleration and never stops, then moves on or springs back
    const wheelTarget = (t: number) => {
        const s = st.current
        const age = t - s.wLast
        const a = Math.abs(s.wRaw)
        const sign = Math.sign(s.wRaw)
        // a single slow notch that scrolled less than a twelfth of a title still moves on by one
        const steps = a >= 0.08 ? Math.max(1, Math.ceil(a - 0.3)) : a > 0.001 && s.wCount <= 2 && age > 110 ? 1 : 0
        const snapT = s.wFrom + sign * steps
        const rawT = s.wFrom + s.wRaw
        if (age > 260) {
            s.target = snapT
            s.wOn = false
            return
        }
        const vin = (s.wR * Math.exp(-Math.max(0, age) / WHEEL_TAU)) / (WHEEL_TAU / 1000) // titles per second
        const w = Math.max(clamp(1 - vin / 3, 0, 1), clamp((age - 40) / 200, 0, 1))
        s.target = rawT + (snapT - rawT) * w * w * (3 - 2 * w)
    }
    // the next whole title in the direction the arc is travelling (the nearest one when it stands)
    const catchAt =(p: number, d: number) => (d > 0 ? Math.ceil(p - 0.02) : d < 0 ? Math.floor(p + 0.02) : Math.round(p))
    // letting go of a drag: a throw glides out with its own speed onto the title it reaches, a slow release eases
    // into the nearest title – the speed carries over, so nothing jumps when the finger or mouse lets go
    const release = (v0: number) => {
        const s = st.current
        s.av = v0
        if (Math.abs(v0) < 2.5) {
            s.glideK = 0
            s.target = Math.round(s.pos + v0 * 0.12)
            return
        }
        let tgt = Math.round(s.pos + clamp(v0 * 0.16, -5, 5))
        if (v0 > 0 && tgt <= s.pos + 0.05) tgt = Math.ceil(s.pos + 0.05)
        if (v0 < 0 && tgt >= s.pos - 0.05) tgt = Math.floor(s.pos - 0.05)
        s.target = tgt
        s.glideK = clamp(Math.abs(v0) / Math.max(0.05, Math.abs(tgt - s.pos)), 3, 16)
    }

    // wheel (non-passive so the page does not scroll while turning)
    React.useEffect(() => {
        if (isStatic || !allowWheel) return
        const el = rootRef.current
        if (!el) return
        // one wheel gesture lives in the state (where it started, how far it scrolled, how fast, how many events) –
        // the main loop turns it into the arc's target every frame (see wheelTarget)
        const onWheel = (e: WheelEvent) => {
            const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
            if (!d) return
            e.preventDefault()
            const s = st.current
            const now = performance.now()
            if (!s.wOn) {
                s.wOn = true
                s.wFrom = Math.round(s.target)
                s.wRaw = 0
                s.wR = 0
                s.wCount = 0
            }
            // a line notch (3 lines) is one title, pixels scale with the type
            const rows = e.deltaMode === 1 ? d / 3 : e.deltaMode === 2 ? Math.sign(d) : d / Math.max(90, geo.current.sp * 1.6)
            s.wR = s.wR * Math.exp(-(now - s.wLast) / WHEEL_TAU) + Math.abs(rows)
            s.wRaw += rows
            s.wLast = now
            s.wCount++
            s.glideK = 0
            s.wheelT = now
            s.userT = now
            kick.current()
        }
        el.addEventListener("wheel", onWheel, { passive: false })
        return () => el.removeEventListener("wheel", onWheel)
    }, [isStatic, allowWheel])

    // pointer: drag along the arc (vertical with a mouse, horizontal on touch so the page keeps
    // scrolling), click or tap a title or the image
    const downK = React.useRef<number | null>(null)
    const downCard = React.useRef(false)
    const downId = React.useRef<number | null>(null)
    const clearDown = () => {
        downK.current = null
        downCard.current = false
        downId.current = null
    }
    const onPointerDown = (e: React.PointerEvent) => {
        if (isStatic) return
        if (e.pointerType === "mouse" && e.button !== 0) return
        const s = st.current
        const tg = e.target as HTMLElement
        downId.current = e.pointerId
        downCard.current = !!tg.closest?.(".ata-card")
        downK.current = null
        const row = downCard.current ? null : (tg.closest?.("[data-k]") as HTMLElement | null)
        if (row) downK.current = Number(row.dataset.k)
        // the image opens the project it shows at the moment of the press
        s.downItem = mod(Math.round(s.stp), Math.max(1, n))
        // a press takes the arc over from a running wheel gesture
        const wheeling = s.wOn
        s.wOn = false
        // a press on a turning arc only catches it – it never opens a link
        const dp = s.target - s.pos
        s.downMoving = wheeling || Math.abs(dp) > 0.02 || Math.abs(s.av) > 0.3 || Math.abs(s.pv) > 0.3 || performance.now() - s.wheelT < 160
        s.downDir = Math.abs(s.av) > 0.3 ? Math.sign(s.av) : Math.abs(dp) > 0.02 ? Math.sign(dp) : Math.sign(s.pv)
        s.moved = 0
        s.downX = e.clientX
        s.downY = e.clientY
        if (!allowDrag) return
        s.dragging = true
        s.dragLive = false
        s.axisX = e.pointerType !== "mouse"
        s.vel = 0
        s.av = 0
        s.glideK = 0
        ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
        kick.current()
    }
    const onPointerMove = (e: React.PointerEvent) => {
        const s = st.current
        if (e.pointerType === "mouse" && rootRef.current) {
            const r = rootRef.current.getBoundingClientRect()
            s.px = e.clientX - r.left
            s.py = e.clientY - r.top
            // after a turn the focus stays on the title the arc stopped on: only a deliberate move away from where
            // the pointer rested (not a nudge, not the synthetic event browsers send after scrolling) wakes the hover
            if (!s.pin || Math.hypot(e.clientX - s.lockX, e.clientY - s.lockY) > Math.max(24, geo.current.sp * 0.4)) s.hoverLock = false
            s.clientX = e.clientX
            s.clientY = e.clientY
            s.pin = true
            s.mouse = true
            hitTest()
            if (!s.moving) s.focusK = s.hoverK
            kick.current()
        } else s.mouse = false
        if (downId.current !== e.pointerId) return
        // any movement in any direction turns a press into a drag, never a click
        s.moved = Math.max(s.moved, Math.hypot(e.clientX - s.downX, e.clientY - s.downY))
        if (!s.dragging) return
        // the arc only follows once the press has really become a drag, so a click does not nudge it
        if (!s.dragLive) {
            if (s.moved <= 6) return
            s.dragLive = true
            s.dragStartX = e.clientX
            s.dragStartY = e.clientY
            s.dragStartPos = s.pos
            s.lastX = e.clientX
            s.lastY = e.clientY
            s.lastT = performance.now()
        }
        const d = s.axisX ? e.clientX - s.dragStartX : e.clientY - s.dragStartY
        s.pos = s.dragStartPos - d / geo.current.sp
        s.target = s.pos
        const now = performance.now()
        const dtm = Math.max(1, now - s.lastT)
        const v = -(s.axisX ? e.clientX - s.lastX : e.clientY - s.lastY) / geo.current.sp / (dtm / 1000)
        s.vel = s.vel * 0.6 + v * 0.4
        s.lastX = e.clientX
        s.lastY = e.clientY
        s.lastT = now
        s.userT = now
        kick.current()
    }
    const onPointerUp = (e: React.PointerEvent) => {
        const s = st.current
        if (downId.current !== e.pointerId) return
        const wasDrag = s.dragLive
        s.dragging = false
        s.dragLive = false
        const tap = s.moved <= 6
        const onCard = downCard.current
        const k = downK.current
        clearDown()
        if (!tap) {
            if (wasDrag) {
                // a pointer that rested before letting go does not throw the arc
                if (performance.now() - s.lastT > 80) s.vel = 0
                release(s.vel)
            } else if (s.downMoving) {
                s.glideK = 0
                s.target = catchAt(s.pos, s.downDir)
            }
            kick.current()
            return
        }
        if (s.downMoving) {
            // the tap caught the turning arc: it settles on the next title in its direction, nothing opens
            s.glideK = 0
            s.target = catchAt(s.pos, s.downDir)
            kick.current()
            return
        }
        if (onCard) {
            openLink(s.downItem)
        } else if (k != null && e.pointerType === "mouse") {
            // with a mouse every title is directly a link (or turns into place when it has none)
            const it = items[mod(k, n)]
            if (it && it.link) openLink(mod(k, n))
            else goTo(k)
        } else if (k != null) {
            if (k === Math.round(s.target)) openLink(mod(k, n))
            else goTo(k)
        }
        kick.current()
    }
    // a cancelled pointer (page scroll, system gesture) only ends the drag – it never clicks
    const onPointerCancel = (e: React.PointerEvent) => {
        const s = st.current
        if (downId.current !== e.pointerId) return
        if (s.dragLive) s.target = Math.round(s.pos)
        else if (s.dragging && s.downMoving) s.target = catchAt(s.pos, s.downDir)
        s.glideK = 0
        s.dragging = false
        s.dragLive = false
        clearDown()
        kick.current()
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
        const s = st.current
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
            e.preventDefault()
            goTo(Math.round(s.target) + 1)
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
            e.preventDefault()
            goTo(Math.round(s.target) - 1)
        } else if (e.key === "Enter" || e.key === " ") {
            if ((e.target as HTMLElement).tagName === "A") return
            e.preventDefault()
            openLink(mod(Math.round(s.target), Math.max(1, n)))
        }
    }

    // ---------- render ----------
    const family = builtin ? `"${FAMILY}", "Helvetica Neue", Helvetica, Arial, sans-serif` : faceFamily
    const titleStyle: React.CSSProperties = {
        fontFamily: family,
        fontSize: fs,
        lineHeight: `${lineH}px`,
        letterSpacing: `${clamp(props.tracking ?? -0.025, -0.2, 0.3)}em`,
        whiteSpace: "nowrap",
        fontStyle: builtin ? "normal" : (face.fontStyle as any) || "normal",
    }
    const capStyle: React.CSSProperties = {
        fontFamily: family,
        fontSize: capFs,
        lineHeight: `${capLine}px`,
        letterSpacing: "0",
        fontStyle: "normal",
        fontWeight: builtin ? undefined : (face.fontWeight as any),
        ...(builtin ? { fontStretch: "100%" } : {}),
    }
    const capLineStyle: React.CSSProperties = { height: capLine, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }

    const slots: number[] = []
    if (n > 0) for (let k = base - V; k <= base + V; k++) slots.push(k)
    const it0 = items[0]
    const it1 = items[mod(1, Math.max(1, n))]

    return (
        <div
            ref={rootRef}
            className="ata-root"
            role="listbox"
            aria-label={props.label || "Projects"}
            aria-activedescendant={n ? `${uid}opt${activeIndex}` : undefined}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onPointerEnter={() => ((st.current.hover = true), kick.current())}
            onPointerLeave={() => {
                const s = st.current
                s.hover = false
                s.pin = false
                s.hoverK = null
                s.focusK = null
                s.hoverLock = false
                s.miss = false
                s.overCard = false
                kick.current()
            }}
            onFocus={(e) => {
                // only keyboard focus pauses autoplay – a click focuses the list too
                let kb = true
                try {
                    kb = e.currentTarget.matches(":focus-visible")
                } catch {
                    kb = true
                }
                st.current.focus = kb
                kick.current()
            }}
            onBlur={() => ((st.current.focus = false), kick.current())}
            style={{
                position: "relative",
                width: 1040,
                height: 640,
                overflow: "hidden",
                touchAction: allowDrag ? "pan-y pinch-zoom" : "auto",
                userSelect: "none",
                WebkitUserSelect: "none",
                color: textColor,
                ...props.style,
            }}
        >
            <style dangerouslySetInnerHTML={{ __html: (builtin ? FONT_CSS : "") + BASE_CSS }} />
            {bgOn && (
                <div
                    ref={bgRef}
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 0,
                        overflow: "hidden",
                        borderRadius: bgRadius,
                        backgroundColor: bgFill,
                        pointerEvents: "none",
                    }}
                >
                    {glowAmt > 0 && (
                        <canvas
                            ref={glowRef}
                            style={{
                                position: "absolute",
                                left: Math.round(cardX + cw / 2 - cw * GLOW_RX),
                                top: Math.round(cardY + ch / 2 - ch * GLOW_RY),
                                width: Math.round(cw * GLOW_RX * 2),
                                height: Math.round(ch * GLOW_RY * 2),
                            }}
                        />
                    )}
                    {glowAmt > 0 && (
                        <div
                            ref={ditherRef}
                            style={{
                                // ±1–2 levels of noise on every pixel, the same on light and dark ground: the light's
                                // soft falloff never shows the rings of an 8-bit gradient. Too fine and faint to see as grain
                                position: "absolute",
                                inset: 0,
                                opacity: 0.011,
                                ...(fillC[3] < 0.5 && tintAmt <= 0 ? { WebkitMaskImage: grainMask, maskImage: grainMask } : {}),
                            }}
                        />
                    )}
                    {grainAmt > 0 && (
                        <div
                            ref={grainRef}
                            style={{
                                position: "absolute",
                                inset: 0,
                                opacity: grainAmt * (darkBg ? 0.2 : 0.14),
                                mixBlendMode: "overlay",
                                // without a surface the grain only lives where the image's light falls
                                ...(fillC[3] < 0.5 && tintAmt <= 0 ? { WebkitMaskImage: grainMask, maskImage: grainMask } : {}),
                            }}
                        />
                    )}
                </div>
            )}
            {slots.map((k) => {
                const idx = mod(k, n)
                const it = items[idx]
                const title = it.title || ""
                const isAct = k === active
                return (
                    <div
                        key={k + ":" + title}
                        data-k={k}
                        id={isAct ? `${uid}opt${idx}` : undefined}
                        role="option"
                        aria-selected={isAct}
                        aria-label={title}
                        className="ata-row"
                        ref={(el) => {
                            if (el) {
                                rowRefs.current.set(k, el)
                                textRefs.current.set(k, el.firstElementChild as HTMLElement)
                                letterRefs.current.set(k, Array.from(el.querySelectorAll<HTMLElement>(".ata-l")))
                                const go = el.querySelector<HTMLElement>(".ata-go")
                                if (go) goRefs.current.set(k, go)
                                else goRefs.current.delete(k)
                            } else {
                                goRefs.current.delete(k)
                                rowRefs.current.delete(k)
                                textRefs.current.delete(k)
                                letterRefs.current.delete(k)
                            }
                        }}
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            height: lineH,
                            width: rowW,
                            transformOrigin: "0 0",
                            display: "flex",
                            justifyContent: side === "left" ? "flex-start" : "flex-end",
                            alignItems: "center",
                            willChange: "transform",
                            visibility: "hidden",
                            pointerEvents: "none",
                        }}
                    >
                        <span
                            className="ata-hit"
                            aria-hidden
                            style={{ ...titleStyle, display: "block", pointerEvents: "auto" }}
                        >
                            {wave
                                ? letters(title).map((c, i) => (
                                      <span key={i} className="ata-l">
                                          {c}
                                      </span>
                                  ))
                                : title}
                            {showIndex && (
                                <span
                                    style={{
                                        fontSize: Math.max(9, fs * 0.2),
                                        fontWeight: 500,
                                        fontStretch: "100%",
                                        letterSpacing: "0.02em",
                                        verticalAlign: "top",
                                        lineHeight: 1,
                                        marginLeft: fs * 0.08,
                                        position: "relative",
                                        top: fs * 0.16,
                                        opacity: 0.6,
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    {pad2(idx + 1)}
                                </span>
                            )}
                            {it.link ? (
                                <span
                                    className="ata-go"
                                    style={{
                                        display: "inline-block",
                                        width: "0.3em",
                                        height: "0.3em",
                                        marginLeft: "0.14em",
                                        verticalAlign: "top",
                                        position: "relative",
                                        top: "0.2em",
                                        opacity: 0,
                                        fontStretch: "100%",
                                    }}
                                >
                                    <svg viewBox="0 0 10 10" width="100%" height="100%" fill="none" style={{ display: "block", overflow: "visible" }}>
                                        <path d="M1.5 8.5L8.5 1.5M2.8 1.5H8.5V7.2" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                            ) : null}
                        </span>
                    </div>
                )
            })}

            {n > 0 && (
                <div
                    ref={cardRef}
                    className="ata-card"
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: cw,
                        height: ch,
                        zIndex: 2,
                        pointerEvents: "none",
                        visibility: "hidden",
                        willChange: "transform",
                    }}
                >
                    <div
                        ref={cardClipRef}
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 1,
                            borderRadius: radius,
                            overflow: "hidden",
                            background: "rgba(127,127,127,0.14)",
                            clipPath: "inset(50% 50% 50% 50%)",
                        }}
                    >
                        <div ref={cardInnerRef} style={{ position: "absolute", inset: 0, transformOrigin: "50% 50%" }}>
                            {items.map((it, i) =>
                                imgSrc(it.image) ? (
                                    <div
                                        key={i + "|" + imgSrc(it.image)}
                                        ref={(el) => {
                                            layerRefs.current[i] = { ...layerRefs.current[i], w: el }
                                        }}
                                        style={{ position: "absolute", inset: 0, overflow: "hidden", visibility: "hidden" }}
                                    >
                                        <img
                                            ref={(el) => {
                                                layerRefs.current[i] = { ...layerRefs.current[i], i: el }
                                            }}
                                            src={i === 0 ? imgSrc(it.image) : undefined}
                                            srcSet={i === 0 ? imgSet(it.image) : undefined}
                                            sizes={`${Math.round(cw)}px`}
                                            alt={imgAlt(it.image, it.title)}
                                            decoding="async"
                                            draggable={false}
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block",
                                                transformOrigin: "50% 50%",
                                            }}
                                        />
                                    </div>
                                ) : null
                            )}
                            <div
                                ref={cardShadeRef}
                                style={{ position: "absolute", inset: 0, zIndex: 2, background: "#000", opacity: 0, pointerEvents: "none" }}
                            />
                        </div>
                    </div>
                    {!isStatic && !glFail && (
                        <canvas
                            ref={canvasRef}
                            style={{
                                position: "absolute",
                                left: -P,
                                top: -P,
                                zIndex: 1,
                                width: cw + 2 * P,
                                height: ch + 2 * P,
                                pointerEvents: "none",
                                visibility: "hidden",
                            }}
                        />
                    )}
                    {capOn && (
                        // the caption lies behind the image: when the image bends past its edge while rolling,
                        // it covers the caption instead of the text being drawn across the picture
                        <div
                            ref={capWrapRef}
                            style={{
                                ...capStyle,
                                position: "absolute",
                                left: 0,
                                top: ch + capGap,
                                zIndex: 0,
                                width: cw,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                gap: 12,
                                color: textColor,
                                opacity: isStatic ? 1 : 0,
                                pointerEvents: "none",
                            }}
                        >
                            <div style={{ height: capLine * capRows, overflow: "hidden", minWidth: 0, flex: "1 1 auto" }}>
                                <div ref={capTrackRef} style={{ willChange: "transform" }}>
                                    <div ref={capARef}>
                                        <div style={{ ...capLineStyle, fontWeight: builtin ? 560 : undefined, ...(narrow ? { display: "none" } : {}) }}>{it0?.title}</div>
                                        <div style={{ ...capLineStyle, opacity: 0.55 }}>{it0?.caption}</div>
                                    </div>
                                    <div ref={capBRef}>
                                        <div style={{ ...capLineStyle, fontWeight: builtin ? 560 : undefined, ...(narrow ? { display: "none" } : {}) }}>{it1?.title}</div>
                                        <div style={{ ...capLineStyle, opacity: 0.55 }}>{it1?.caption}</div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: "flex", flex: "none", height: capLine, fontVariantNumeric: "tabular-nums" }}>
                                <div style={{ height: capLine, overflow: "hidden" }}>
                                    <div ref={cntTrackRef} style={{ willChange: "transform" }}>
                                        <div ref={cntARef} style={{ height: capLine }}>
                                            {pad2(1)}
                                        </div>
                                        <div ref={cntBRef} style={{ height: capLine }}>
                                            {pad2(Math.min(2, n))}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ opacity: 0.4 }}>/{pad2(n)}</div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {n > 0 && <a ref={linkRef} tabIndex={-1} aria-hidden style={{ display: "none" }} />}

            {!isStatic && cursorLabel && n > 0 && (
                <div
                    ref={bubbleRef}
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        zIndex: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "7px 11px 7px 12px",
                        borderRadius: 999,
                        background: cur.fill || textColor,
                        color: cur.color || "#FFFFFF",
                        fontFamily: family,
                        fontSize: 12,
                        fontWeight: 600,
                        fontStretch: builtin ? "108%" : undefined,
                        letterSpacing: "0.01em",
                        lineHeight: "14px",
                        whiteSpace: "nowrap",
                        transformOrigin: "0 0",
                        visibility: "hidden",
                        opacity: 0,
                        pointerEvents: "none",
                        willChange: "transform",
                    }}
                >
                    {cursorLabel}
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
                        <path d="M2 7L7 2M3.2 2H7v3.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            )}

            <div
                className="ata-ring"
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 2,
                    borderRadius: bgOn && px(bgRadius, 0) > 6 ? bgRadius : 6,
                    boxShadow: `0 0 0 1.5px ${textColor}`,
                    opacity: 0,
                    pointerEvents: "none",
                    transition: "opacity .2s",
                }}
            />
        </div>
    )
}

addPropertyControls(ArcTextCarousel, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 24,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "Project" },
                caption: { type: ControlType.String, title: "Caption", defaultValue: "Category — 2026" },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                link: { type: ControlType.Link, title: "Link" },
                newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false, enabledTitle: "Yes", disabledTitle: "No" },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    linkDefault: {
        type: ControlType.Link,
        title: "Default Link",
        defaultValue: DEMO_LINK,
        description: "Opens for every project without a link of its own. Clear it for none.",
    },
    linkDefaultTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (p: any) => !p.linkDefault,
    },
    typeface: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        displayFontSize: false,
        displayTextAlignment: false,
        description: "Mona Sans is built in, with the width and weight axes the lens needs. Pick another font to replace it.",
    },
    titleSize: { type: ControlType.Number, title: "Size", min: 16, max: 200, step: 1, defaultValue: 64, unit: "px" },
    tracking: { type: ControlType.Number, title: "Tracking", min: -0.1, max: 0.1, step: 0.005, defaultValue: -0.025 },
    responsiveText: {
        type: ControlType.Boolean,
        title: "Scale Text",
        defaultValue: true,
        description: "Shrinks the titles on narrow layouts.",
    },
    lens: {
        type: ControlType.Object,
        title: "Lens",
        controls: {
            focusWeight: { type: ControlType.Number, title: "Focus Weight", min: 100, max: 900, step: 10, defaultValue: 720 },
            restWeight: { type: ControlType.Number, title: "Rest Weight", min: 100, max: 900, step: 10, defaultValue: 280 },
            focusWidth: {
                type: ControlType.Number,
                title: "Focus Width",
                min: 75,
                max: 125,
                step: 1,
                defaultValue: 118,
                unit: "%",
                description: "Width needs the built-in Mona Sans; other fonts only change weight.",
            },
            restWidth: { type: ControlType.Number, title: "Rest Width", min: 75, max: 125, step: 1, defaultValue: 78, unit: "%" },
            spread: { type: ControlType.Number, title: "Spread", min: 0.4, max: 3, step: 0.1, defaultValue: 1, description: "How many titles the lens reaches." },
            wave: { type: ControlType.Boolean, title: "Letter Wave", defaultValue: true },
            lean: { type: ControlType.Boolean, title: "Speed Lean", defaultValue: true, description: "Titles lean into fast turns." },
        },
    },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#141413" },
    mutedColor: { type: ControlType.Color, title: "Muted", defaultValue: "rgba(20,20,19,0.2)" },
    background: {
        type: ControlType.Object,
        title: "Background",
        controls: {
            fill: { type: ControlType.Color, title: "Fill", defaultValue: "rgba(0, 0, 0, 0)" },
            radius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: BG_RADIUS,
                hidden: (p: any) => (p.tint ?? BG_TINT) <= 0 && parseColor(p.fill, [0, 0, 0, 0])[3] === 0,
            },
            tint: {
                type: ControlType.Number,
                title: "Tint",
                min: 0,
                max: 100,
                step: 1,
                defaultValue: BG_TINT,
                description: "Takes on the colour of the current image.",
            },
            glow: {
                type: ControlType.Number,
                title: "Glow",
                min: 0,
                max: 100,
                step: 1,
                defaultValue: BG_GLOW,
                description: "The image lights the background around it.",
            },
            grain: { type: ControlType.Number, title: "Grain", min: 0, max: 100, step: 1, defaultValue: BG_GRAIN, description: "Fine film grain on the background." },
        },
    },
    side: {
        type: ControlType.Enum,
        title: "Side",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        displaySegmentedControl: true,
        defaultValue: "left",
    },
    curve: { type: ControlType.Number, title: "Curve", min: 0, max: 100, step: 1, defaultValue: 60, unit: "%" },
    spacing: { type: ControlType.Number, title: "Spacing", min: 0.8, max: 3, step: 0.05, defaultValue: 1.08, description: "Line spacing as a multiple of the title size." },
    edgeFade: { type: ControlType.Number, title: "Edge Fade", min: 0, max: 50, step: 1, defaultValue: 16, unit: "%" },
    padding: { type: ControlType.Padding, title: "Padding", defaultValue: "40px", description: "Space between the edges and the arc and image." },
    maxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        min: 200,
        max: 4000,
        step: 10,
        defaultValue: MAX_W,
        unit: "px",
        description: "Keeps the arc and the image together on wide sections. The background still fills the full width.",
    },
    showIndex: { type: ControlType.Boolean, title: "Index", defaultValue: false },
    float: {
        type: ControlType.Object,
        title: "Image",
        controls: {
            width: { type: ControlType.Number, title: "Width", min: 80, max: 900, step: 1, defaultValue: 400, unit: "px", description: "On phones the image spans the full width above the list." },
            ratio: { type: ControlType.Number, title: "Ratio", min: 0.4, max: 2.5, step: 0.05, defaultValue: 0.8, description: "Width ÷ height." },
            transition: {
                type: ControlType.Enum,
                title: "Transition",
                options: ["liquid", "roll", "fade"],
                optionTitles: ["Liquid", "Roll", "Fade"],
                displaySegmentedControl: true,
                defaultValue: "liquid",
                description: "Liquid and Roll move the images like a film strip in step with the arc.",
            },
            distortion: {
                type: ControlType.Number,
                title: "Distortion",
                min: 0,
                max: 100,
                step: 1,
                defaultValue: 60,
                description: "Bend, wave and colour fringe while the images move.",
                hidden: (p: any) => p.transition === "fade",
            },
            speed: { type: ControlType.Number, title: "Speed", min: 0, max: 100, step: 1, defaultValue: 50 },
            tilt: { type: ControlType.Number, title: "Tilt", min: 0, max: 100, step: 1, defaultValue: 50 },
            idle: {
                type: ControlType.Boolean,
                title: "At Rest",
                defaultValue: true,
                description: "Shows the image of the centred title while the pointer is away.",
            },
            caption: { type: ControlType.Boolean, title: "Caption", defaultValue: true },
        },
    },
    imageRadius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "2px" },
    cursor: {
        type: ControlType.Object,
        title: "Cursor",
        controls: {
            label: { type: ControlType.String, title: "Label", defaultValue: "View", placeholder: "Off", description: "Trails the pointer over the image when it has a link." },
            fill: { type: ControlType.Color, title: "Fill", defaultValue: "#141413" },
            color: { type: ControlType.Color, title: "Text", defaultValue: "#FFFFFF" },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            autoplay: { type: ControlType.Boolean, title: "Autoplay", defaultValue: true },
            interval: { type: ControlType.Number, title: "Interval", min: 1, max: 20, step: 0.5, defaultValue: 3.5, unit: "s", hidden: (p: any) => !p.autoplay },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["down", "up"],
                optionTitles: ["Down", "Up"],
                displaySegmentedControl: true,
                defaultValue: "down",
                hidden: (p: any) => !p.autoplay,
            },
            ease: { type: ControlType.Number, title: "Speed", min: 0, max: 100, step: 1, defaultValue: 50 },
            drag: { type: ControlType.Boolean, title: "Drag", defaultValue: true },
            wheel: { type: ControlType.Boolean, title: "Wheel", defaultValue: true },
            intro: { type: ControlType.Boolean, title: "Intro", defaultValue: true, description: "The arc turns in and the image rises when it comes into view." },
        },
    },
    sound: {
        type: ControlType.Object,
        title: "Sound",
        controls: {
            on: {
                type: ControlType.Boolean,
                title: "Sound",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "A soft click for the titles that pass while you scroll, drag or use the arrow keys. Browsers start sound after the first click, tap or key press on the page.",
            },
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["soft", "tick", "glass"],
                optionTitles: ["Soft", "Tick", "Glass"],
                displaySegmentedControl: true,
                defaultValue: "soft",
                hidden: (p: any) => !p.on,
            },
            volume: { type: ControlType.Number, title: "Volume", min: 0, max: 100, step: 1, defaultValue: 50, hidden: (p: any) => !p.on },
        },
    },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Projects",
        description: "Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)",
    },
})
