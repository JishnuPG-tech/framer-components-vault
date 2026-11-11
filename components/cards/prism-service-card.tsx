// Prism Service Cards – every card is a row of turning prisms, like a trivision billboard. On hover the prisms turn
// in a wave from where the pointer enters, from the side the card shows to its other side – colour to image or image
// to colour – and land with a soft knock.
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
type FontValue = {
    fontFamily?: string
    fontWeight?: number | string
    fontStyle?: string
    fontSize?: number | string
    letterSpacing?: number | string
    lineHeight?: number | string
}
// 0 is the colour side, 1 the image side
type Face = 0 | 1

interface Item {
    title?: string
    text?: string
    color?: string
    image?: Img
    side?: "color" | "image"
    link?: string
    newTab?: boolean
}

interface Props {
    items?: Item[]
    action?: string
    showIndex?: boolean
    titleFont?: FontValue
    textFont?: FontValue
    darkText?: string
    lightText?: string
    overlay?: number
    columns?: number
    balance?: boolean
    minWidth?: number
    gap?: string | number
    ratio?: number
    padding?: string
    maxWidth?: number
    radius?: string
    shadow?: string
    hover?: { turn?: boolean; lift?: number; shadow?: number }
    prism?: { count?: number; origin?: "pointer" | "left" | "center"; stagger?: number; speed?: number; bounce?: number; shade?: number }
    motion?: { intro?: boolean; lift?: boolean; autoplay?: boolean; interval?: number; touch?: "view" | "tap" }
    sound?: { on?: boolean; style?: "soft" | "tick" | "glass"; volume?: number }
    label?: string
    style?: React.CSSProperties
}

// demo images: Unsplash (free to use), hosted on Framer's CDN
const FUC = (id: string) => "https://framerusercontent.com/images/" + id + ".jpg?scale-down-to=1200"
const DEFAULT_ITEMS: Item[] = [
    {
        title: "Brand Identity",
        text: "Naming, logo systems and guidelines that give your company a voice people remember.",
        color: "#D6F36E",
        image: FUC("YNfi28KXr2iVTZ6pYehHSDSeJCo"),
        side: "color",
    },
    {
        title: "Web Design",
        text: "Editorial Framer websites that load fast and stay easy for your team to edit.",
        color: "#C9C3F7",
        image: FUC("XB52l4CwHVmBqfCltt5TtXUhyc"),
        side: "image",
    },
    {
        title: "Motion",
        text: "Interface animation, product films and social loops that make every launch move.",
        color: "#F2AA8F",
        image: FUC("BklOWwUNNpkZE1dUMA539TE4Q"),
        side: "image",
    },
    {
        title: "Art Direction",
        text: "Campaign concepts, shoots and visual worlds that hold together on every channel.",
        color: "#2B44F5",
        image: FUC("8D4IJfyObrYEypAq9C02mqMMpz4"),
        side: "color",
    },
]
const PALETTE = ["#D6F36E", "#C9C3F7", "#F2AA8F", "#2B44F5", "#F3A6CB", "#141413"]
const DEFAULT_SHADOW = "0px 1px 2px 0px rgba(20, 20, 19, 0.06), 0px 14px 32px -18px rgba(20, 20, 19, 0.35)"

// ---------- helpers ----------
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const mod = (a: number, n: number) => ((a % n) + n) % n
const pad2 = (n: number) => (n < 10 ? "0" : "") + n
const r3 = (v: number) => Math.round(v * 1000) / 1000
const num = (v: unknown, fb: number) => {
    const n = typeof v === "number" ? v : parseFloat(String(v === undefined || v === null ? "" : v))
    return isFinite(n) ? n : fb
}
const imgSrc = (i: Img) => (typeof i === "string" ? i : (i && i.src) || "")
const imgSet = (i: Img) => (typeof i === "string" ? undefined : (i && i.srcSet) || undefined)
const imgAlt = (i: Img) => (typeof i === "string" ? "" : (i && i.alt) || "")
function parsePad(p: string | undefined) {
    const a = String(p === undefined || p === null ? "40px" : p)
        .trim()
        .split(/\s+/)
        .map((s) => parseFloat(s) || 0)
    const t = a[0] || 0
    const r = a.length > 1 ? a[1] : t
    const b = a.length > 2 ? a[2] : t
    const l = a.length > 3 ? a[3] : r
    return { t, r, b, l }
}
function parseGap(g: string | number | undefined) {
    if (typeof g === "number" && isFinite(g)) return { row: Math.max(0, g), col: Math.max(0, g) }
    const a = String(g === undefined || g === null ? "12px" : g)
        .trim()
        .split(/\s+/)
        .map((s) => parseFloat(s))
    const row = isFinite(a[0]) ? a[0] : 12
    const col = a.length > 1 && isFinite(a[1]) ? a[1] : row
    return { row: Math.max(0, row), col: Math.max(0, col) }
}
type RGBA = [number, number, number, number]
function parseColor(c: string | undefined): RGBA | null {
    if (!c) return null
    let s = String(c).trim()
    const v = /^var\([^,]+,\s*(.+)\)$/.exec(s)
    if (v) s = v[1].trim()
    let m = /^#([0-9a-f]{3,8})$/i.exec(s)
    if (m) {
        let h = m[1]
        if (h.length === 3 || h.length === 4)
            h = h
                .split("")
                .map((x) => x + x)
                .join("")
        const n = parseInt(h.slice(0, 6), 16)
        const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a]
    }
    m = /^rgba?\(([^)]+)\)$/i.exec(s)
    if (m) {
        const p = m[1]
            .split(/[\s,\/]+/)
            .filter(Boolean)
            .map((x) => parseFloat(x))
        if (p.length >= 3 && p.every((x) => isFinite(x))) return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]
    }
    return null
}
function luminance(c: RGBA) {
    const f = (x: number) => {
        const v = x / 255
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2])
}
// the text colour with more contrast on a card colour
function readable(bg: string, dark: string, light: string) {
    const b = parseColor(bg)
    const d = parseColor(dark)
    const l = parseColor(light)
    if (!b || !d || !l) return dark
    const lb = luminance(b)
    const ratio = (x: number, y: number) => (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
    return ratio(lb, luminance(d)) >= ratio(lb, luminance(l)) ? dark : light
}
// a dark tint for the image overlay and the lift shadow: the dark text colour while it is dark, otherwise black
function tintOf(dark: string) {
    const c = parseColor(dark)
    if (!c || luminance(c) > 0.3) return "0, 0, 0"
    return Math.round(c[0]) + ", " + Math.round(c[1]) + ", " + Math.round(c[2])
}
// the image darkens towards its text: a little at the top for the index, more at the bottom for the title
function scrimOf(tint: string, amt: number) {
    const a = (x: number) => "rgba(" + tint + ", " + r3(clamp(x, 0, 1)) + ")"
    return "linear-gradient(180deg, " + a(amt * 0.5) + " 0%, " + a(0) + " 30%, " + a(0) + " 46%, " + a(amt) + " 100%)"
}
// a flat face either shows, or steps aside without catching the pointer or a text selection
function layer(el: HTMLElement | null, on: boolean) {
    if (!el) return
    el.style.opacity = on ? "1" : "0"
    el.style.pointerEvents = on ? "" : "none"
}

// the radius a layer needs to sit d px inside a rounded box
function innerRadius(r: string, d: number) {
    return String(r || "0")
        .trim()
        .split(/s+/)
        .map((s) => Math.max(0, (parseFloat(s) || 0) - d) + "px")
        .join(" ")
}

// the most columns that fit, but never a single card alone in the last row when fewer columns avoid it
function balancedCols(n: number, fit: number) {
    if (n <= fit) return Math.max(1, n)
    const lo = fit >= 2 ? Math.max(2, Math.ceil(fit * 0.6)) : 1
    let best = fit
    let bestEmpty = Infinity
    for (let c = fit; c >= lo; c--) {
        const empty = (c - (n % c)) % c
        if (empty <= Math.floor(c / 3)) return c
        if (empty < bestEmpty) {
            best = c
            bestEmpty = empty
        }
    }
    return best
}
// The columns come from container queries on the instance's own width, so the page has its final layout before any
// script runs – no jump from one layout to another while the site loads. Older browsers fall back to auto-fill
function gridCss(id: string, n: number, cols: number, minW: number, gapCol: number, maxW: number, balance: boolean) {
    const L = "." + id + "-l"
    const rep = (c: number) => L + "{grid-template-columns:repeat(" + c + ",minmax(0,1fr))}"
    const pick = (k: number) => (balance ? balancedCols(n, k) : k)
    let q = "." + id + "{container:" + id + "/inline-size}" + rep(pick(1))
    for (let k = 2; k <= cols; k++) {
        const need = k * minW + (k - 1) * gapCol - 0.5
        if (need > maxW) break
        q += "@container " + id + " (min-width:" + r3(need) + "px){" + rep(pick(k)) + "}"
    }
    const track = "minmax(min(100%,max(" + minW + "px,calc((100% - " + (cols - 1) * gapCol + "px)/" + cols + " - 0.1px))),1fr)"
    return L + "{grid-template-columns:repeat(auto-fill," + track + ")}@supports (container-type:inline-size){" + q + "}"
}

// ---------- type ----------
const FAMILY = "PSC Mona Sans"
const META_FONT = '"' + FAMILY + '", "Mona Sans", sans-serif'
const FONT_CSS =
    '@font-face{font-family:"' +
    FAMILY +
    '";src:url(https://framerusercontent.com/assets/NPkPCVHX4GBpfjimdkpuR96Iuo.woff2) format("woff2");font-weight:200 900;font-stretch:75% 125%;font-style:normal;font-display:swap;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}' +
    '@font-face{font-family:"' +
    FAMILY +
    '";src:url(https://framerusercontent.com/assets/ALbBidskZ8UKW4CWsETHBeA.woff2) format("woff2");font-weight:200 900;font-stretch:75% 125%;font-style:normal;font-display:swap;unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF}'
const BASE_CSS =
    ".psc-root{-webkit-tap-highlight-color:transparent}" +
    ".psc-list{list-style:none;margin:0;padding:0}" +
    ".psc-li{position:relative;min-width:0;list-style:none;container-type:inline-size}" +
    ".psc-card{position:relative;display:block;width:100%;text-decoration:none;color:inherit;outline:none;container-type:inline-size;isolation:isolate;-webkit-tap-highlight-color:transparent}" +
    // whole-pixel card heights, so no edge of a card is ever drawn between two pixels
    "@supports (height:round(1px,1px)){.psc-card{height:round(calc(100cqw / var(--psc-r,0.78)),1px)}}" +
    ".psc-card:focus-visible .psc-ring{opacity:1!important}" +
    ".psc-face{position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden}" +
    ".psc-slice{position:absolute;top:0;height:100%;container-type:inline-size}" +
    ".psc-img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;display:block;-webkit-user-drag:none}"

interface FontSpec {
    size: number
    css: any
}
// one font setting per text: left empty – or set to Mona Sans, which Framer only loads in single styles – it uses the
// built-in variable Mona Sans, set wide with its width axis. Any other font replaces it
function fontSpec(f: FontValue | undefined, d: { size: number; weight: number; stretch: number; lh: string; ls: string }): FontSpec {
    const face = f || {}
    const fam = typeof face.fontFamily === "string" ? face.fontFamily.trim() : ""
    const builtin = !fam || /^["']?Mona Sans["']?\s*(,|$)/i.test(fam)
    return {
        size: clamp(num(face.fontSize, d.size), 6, 400),
        css: {
            fontFamily: builtin ? META_FONT : fam,
            fontWeight: fam ? face.fontWeight || d.weight : d.weight,
            fontStyle: face.fontStyle || "normal",
            fontStretch: builtin ? d.stretch + "%" : undefined,
            letterSpacing: face.letterSpacing === undefined ? d.ls : face.letterSpacing,
            lineHeight: face.lineHeight === undefined ? d.lh : face.lineHeight,
        },
    }
}

// ---------- prisms ----------
const TURN = 120 // a triangular prism shows its next face every 120°
const APOTHEM = 1 / (2 * Math.tan(Math.PI / 3)) // prism axis to face, in face widths
const BEVEL = "linear-gradient(90deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 26%, rgba(0,0,0,0) 64%, rgba(0,0,0,0.3) 100%)"
const wrap180 = (a: number) => mod(a + 180, 360) - 180
// faces darken as they turn away from the viewer, a little more on the far side of the light
function shadeOf(phi: number, amt: number) {
    const a = wrap180(phi)
    const r = Math.abs(a)
    if (r >= 90) return amt
    return clamp((1 - Math.cos((r * Math.PI) / 180)) * 1.6 * amt * (a > 0 ? 1.15 : 0.85), 0, 0.94)
}
// the lit and shaded edges only show while a face is turned
const bevelOf = (phi: number) => clamp(Math.abs(Math.sin((wrap180(phi) * Math.PI) / 180)) * 1.8, 0, 1)
// face 0 shows the colour, face 1 the image, face 2 (the back) stays dark. s picks the side the image sits on
const faceAngle = (f: number, s: number) => (f === 0 ? 0 : f === 1 ? s * TURN : -s * TURN)
// Speed and Bounce become one spring for every prism
function spring(speed: number, bounce: number) {
    const w = 5 + (speed / 100) * 17
    const z = 1 - (bounce / 100) * 0.72
    return { k: w * w, c: 2 * z * w }
}

interface Slat {
    th: number // angle
    v: number // angular speed
    tgt: number
    pend: number | null // next target, once the wave reaches this prism
    at: number
    s: number
    landed: boolean
}
interface Sim {
    slats: Slat[]
    raf: number
    last: number
    face: Face
    live: boolean
    snd: boolean
    base: Face // the side the card rests on
    hits: number // prisms landed in this turn, for its sound
    need: number // prisms that still have to land in this turn
}
// a set of prisms at rest on the card's side; the image face rests at -s × 120°, and s starts at -1
const makeSim = (n: number, base: Face): Sim => ({
    slats: Array.from({ length: n }, () => ({ th: base ? TURN : 0, v: 0, tgt: base ? TURN : 0, pend: null, at: 0, s: -1, landed: true })),
    raf: 0,
    last: 0,
    face: base,
    live: false,
    snd: false,
    base,
    hits: 0,
    need: 0,
})

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

// ---------- sound ----------
// One AudioContext for every instance. Browsers only allow sound after a click, tap or key press on the page, so the
// context starts with the first of those. Where the browser knows audio sessions it is "ambient": the knocks never
// stop music in another app and stay silent on a muted phone
let actx: AudioContext | null = null
let audioArmed = false
let noiseBuf: AudioBuffer | null = null
let outBus: { ctx: BaseAudioContext; input: AudioNode } | null = null
function startAudio(): AudioContext | null {
    if (actx || typeof window === "undefined") return actx
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AC) return null
    try {
        const ses = (navigator as any).audioSession
        if (ses && "type" in ses) ses.type = "ambient"
    } catch (e) {}
    try {
        actx = new AC({ latencyHint: "interactive" }) as AudioContext
    } catch (e) {
        actx = null
    }
    return actx
}
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
// a running context, or null while the browser still waits for the first gesture
function audioReady(): AudioContext | null {
    if (typeof navigator === "undefined") return null
    const ua = (navigator as any).userActivation
    let c = actx
    if (!c) {
        // the page may already have had its first click before this card asked for sound
        if (!ua || !ua.hasBeenActive) return null
        c = startAudio()
        if (!c) return null
    }
    if (c.state !== "running") {
        if (!ua || ua.hasBeenActive) c.resume().catch(() => {})
        armAudio()
        return null
    }
    return c
}
// a very short, dry stereo room: the clicks sit in a space without washing out
function roomIR(c: BaseAudioContext) {
    const len = Math.max(1, Math.round(c.sampleRate * 0.12))
    const b = c.createBuffer(2, len, c.sampleRate)
    for (let ch = 0; ch < 2; ch++) {
        const d = b.getChannelData(ch)
        let seed = ch ? 0x2f6b1 : 0x51ed3
        for (let i = 0; i < len; i++) {
            seed = (Math.imul(seed, 1103515245) + 12345) | 0
            const t = i / c.sampleRate
            d[i] = (((seed >>> 8) & 0xffff) / 32768 - 1) * Math.exp(-t / 0.022) * Math.min(1, t / 0.002)
        }
    }
    return b
}
// The shared output: a trace of room, everything under 60 Hz cut and a gentle compressor, so waves that overlap stay clean
function bus(c: BaseAudioContext): AudioNode {
    if (outBus && outBus.ctx === c) return outBus.input
    const input = c.createGain()
    const hp = c.createBiquadFilter()
    hp.type = "highpass"
    hp.frequency.value = 60
    hp.Q.value = 0.7
    let end: AudioNode = hp
    try {
        const comp = c.createDynamicsCompressor()
        comp.threshold.value = -18
        comp.knee.value = 12
        comp.ratio.value = 3
        comp.attack.value = 0.001
        comp.release.value = 0.08
        hp.connect(comp)
        end = comp
    } catch (e) {}
    end.connect(c.destination)
    input.connect(hp)
    try {
        const room = c.createConvolver()
        room.buffer = roomIR(c)
        const wet = c.createGain()
        wet.gain.value = 0.07
        input.connect(room)
        room.connect(wet)
        wet.connect(hp)
    } catch (e) {}
    outBus = { ctx: c, input }
    return input
}
// Every prism that lands makes one tiny click: a burst of filtered noise for the edge meeting its stop (band, Q, decay)
// and a short tone for the body (frequency, level, decay), with an optional shimmer above it (ratio, level, decay).
// The last prism latches the card: the same click, then a lighter, higher one right behind it
const MATERIALS: { click: number[]; body: number[]; ring: number[] | null }[] = [
    // soft: felt-damped paper, a muted riffle
    { click: [2600, 0.9, 0.0018], body: [1150, 0.3, 0.006], ring: null },
    // tick: crisp mechanical detents, like a split-flap board
    { click: [5200, 1.4, 0.0011], body: [2500, 0.24, 0.004], ring: null },
    // glass: fine glassy taps with a short shimmer
    { click: [7000, 1.1, 0.0009], body: [2900, 0.22, 0.016], ring: [2.41, 0.08, 0.011] },
]
function voice(c: BaseAudioContext, v: number, pan: number) {
    const out = c.createGain()
    out.gain.value = v
    const sp: StereoPannerNode | null = typeof (c as any).createStereoPanner === "function" ? (c as any).createStereoPanner() : null
    if (sp) {
        sp.pan.value = clamp(pan, -0.75, 0.75)
        out.connect(sp)
        sp.connect(bus(c))
    } else out.connect(bus(c))
    const done = (ms: number) =>
        window.setTimeout(() => {
            try {
                out.disconnect()
                if (sp) sp.disconnect()
            } catch (e) {}
        }, ms)
    return { out, done }
}
function tone(c: BaseAudioContext, to: AudioNode, t: number, f: number, level: number, decay: number) {
    const o = c.createOscillator()
    o.type = "sine"
    o.frequency.setValueAtTime(f, t)
    const g = c.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(level, t + 0.0006)
    g.gain.setTargetAtTime(0, t + 0.0006, decay)
    o.connect(g)
    g.connect(to)
    o.start(t)
    o.stop(t + 0.001 + decay * 7)
}
function burst(c: BaseAudioContext, to: AudioNode, t: number, type: BiquadFilterType, f: number, q: number, level: number, decay: number) {
    const n = c.createBufferSource()
    n.buffer = noise(c)
    const bp = c.createBiquadFilter()
    bp.type = type
    bp.frequency.value = f
    bp.Q.value = q
    const g = c.createGain()
    g.gain.setValueAtTime(level, t)
    g.gain.setTargetAtTime(0, t, decay)
    n.connect(bp)
    bp.connect(g)
    g.connect(to)
    n.start(t)
    n.stop(t + Math.min(0.05, decay * 8 + 0.004))
}
// one prism's click, or with latch the last one locking the card in place
function tick(style: number, vol: number, pitch: number, pan: number, latch: boolean, gate: { t: number }) {
    if (vol <= 0) return
    const m = MATERIALS[style] || MATERIALS[0]
    const c = audioReady()
    if (!c) return
    const t = c.currentTime + 0.003
    // clicks of one card closer than 6 ms are skipped, so a dense wave stays a riffle and never turns into a buzz; the
    // latch always plays, and two cards turning at once never take clicks from each other
    if (!latch && t - gate.t < 0.006) return
    gate.t = t
    // every click a little harder or softer and a touch higher or lower than the last, so no two sound the same
    const v = vol * 0.6 * (0.85 + Math.random() * 0.3)
    if (v < 0.0005) return
    const f = pitch * (1 + (Math.random() - 0.5) * 0.03)
    const vo = voice(c, v, pan)
    burst(c, vo.out, t, "bandpass", m.click[0] * f, m.click[1], 0.9, m.click[2])
    tone(c, vo.out, t, m.body[0] * f, m.body[1], m.body[2])
    if (m.ring) tone(c, vo.out, t + 0.0004, m.body[0] * f * m.ring[0], m.ring[1], m.ring[2])
    if (latch) {
        // the catch: a lighter, brighter click 13 ms later, like a detent clicking home
        const t2 = t + 0.013
        burst(c, vo.out, t2, "bandpass", m.click[0] * f * 1.35, m.click[1] * 1.3, 0.6, m.click[2] * 0.8)
        tone(c, vo.out, t2, m.body[0] * f * 1.5, m.body[1] * 0.5, m.body[2] * 0.7)
    }
    vo.done(300)
}

// ---------- faces ----------
function Arrow(props: { size?: number }) {
    const s = props.size || 12
    return (
        <svg width={s} height={s} viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false" style={{ display: "block", flex: "none" }}>
            <path d="M3.25 8.75L8.75 3.25M8.75 3.25H4.25M8.75 3.25V7.75" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

const FILL: React.CSSProperties = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }

interface FaceProps {
    kind: Face
    slice?: boolean
    item: Item
    index: number
    color: string
    ink: string
    light: string
    dark: string
    scrim: string
    title: FontSpec
    body: FontSpec
    showIndex: boolean
    action: string
    hasLink: boolean
    sizes: string
}
// the same layout draws the flat faces and every slice of them on the prisms, so a slice lines up to the pixel
function FaceContent(f: FaceProps) {
    const tSize = "min(" + f.title.size + "px, " + r3(f.title.size / 2.6) + "cqw)"
    const bSize = "clamp(" + Math.min(12, f.body.size) + "px, " + r3(f.body.size / 2.6) + "cqw, " + f.body.size + "px)"
    const titleCss: any = { ...f.title.css, fontSize: tSize, margin: 0, textWrap: "balance", overflowWrap: "anywhere" }
    const bodyCss: any = { ...f.body.css, fontSize: bSize, margin: 0, textWrap: "pretty" }
    const meta: any = {
        fontFamily: META_FONT,
        fontSize: 12,
        fontWeight: 560,
        letterSpacing: "0.02em",
        lineHeight: "16px",
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "nowrap",
    }
    const wrap: any = {
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "clamp(14px, 7cqw, 24px)",
        boxSizing: "border-box",
    }
    const top: any = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }
    const dot: any = { width: 30, height: 30, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }
    const H: any = f.slice ? "div" : "h3"
    const Pg: any = f.slice ? "div" : "p"
    const no = pad2(f.index + 1)
    const title = f.item.title
    if (f.kind === 0) {
        return (
            <div style={{ ...FILL, background: f.color, color: f.ink }}>
                <div style={wrap}>
                    <div style={top}>
                        <span aria-hidden="true" style={{ ...meta, opacity: f.showIndex ? 0.7 : 0 }}>
                            {no}
                        </span>
                        {f.hasLink ? (
                            <span aria-hidden="true" style={{ ...dot, background: f.ink, color: f.color }}>
                                <Arrow />
                            </span>
                        ) : null}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.65em" }}>
                        {title ? <H style={titleCss}>{title}</H> : null}
                        {f.item.text ? <Pg style={{ ...bodyCss, opacity: 0.76 }}>{f.item.text}</Pg> : null}
                    </div>
                </div>
            </div>
        )
    }
    const src = imgSrc(f.item.image)
    return (
        <div style={{ ...FILL, background: src ? undefined : f.dark, color: f.light }}>
            {/* the colour waits behind the picture while it loads, a pixel inside the edge so it never tints the corners */}
            {src ? <div style={{ position: "absolute", top: 1, left: 1, right: 1, bottom: 1, background: f.color }} /> : null}
            {src ? (
                <img
                    className="psc-img"
                    src={src}
                    srcSet={imgSet(f.item.image)}
                    sizes={f.sizes}
                    alt={f.slice ? "" : imgAlt(f.item.image)}
                    draggable={false}
                    decoding="async"
                    loading={f.slice ? undefined : "lazy"}
                />
            ) : null}
            <div style={{ ...FILL, background: f.scrim }} />
            <div aria-hidden="true" style={wrap}>
                <div style={top}>
                    <span style={{ ...meta, opacity: f.showIndex ? 0.9 : 0 }}>{no}</span>
                    {f.hasLink ? (
                        <span style={{ ...dot, background: f.light, color: f.dark }}>
                            <Arrow />
                        </span>
                    ) : null}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85em", alignItems: "flex-start" }}>
                    {title ? <div style={titleCss}>{title}</div> : null}
                    {f.hasLink && f.action ? (
                        <span
                            style={{
                                ...meta,
                                fontSize: 13,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 7,
                                padding: "8px 12px 8px 14px",
                                borderRadius: 999,
                                background: f.light,
                                color: f.dark,
                            }}
                        >
                            {f.action}
                            <Arrow size={10} />
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

// ---------- card ----------
interface CardApi {
    // open: turn to the other side; closed: back to the side the card rests on
    turn: (open: boolean, origin: number | null, snd: boolean) => void
    open: () => boolean
}
interface CardProps {
    item: Item
    index: number
    cards: number
    base: Face
    count: number
    ratio: number
    radius: string
    shadow: string
    glow: string
    scrim: string
    darkText: string
    lightText: string
    title: FontSpec
    body: FontSpec
    showIndex: boolean
    action: string
    origin: "pointer" | "left" | "center"
    stagger: number
    k: number
    c: number
    shade: number
    hoverTurn: boolean
    liftPx: number
    isStatic: boolean
    reduced: boolean
    canHover: boolean
    touch: "view" | "tap"
    soundOn: boolean
    soundStyle: number
    volume: number
    apis: React.MutableRefObject<(CardApi | null)[]>
    onHover: (i: number, on: boolean) => void
    onPick: (i: number) => void
}

function Card(p: CardProps) {
    const { item, index, base } = p
    const N = p.count
    const href = typeof item.link === "string" ? item.link.trim() : ""
    const hasLink = href.length > 0
    const color = item.color || PALETTE[index % PALETTE.length]
    const ink = readable(color, p.darkText, p.lightText)
    const cfg = React.useRef(p)
    cfg.current = p
    const liRef = React.useRef<HTMLLIElement>(null)
    const liftRef = React.useRef<HTMLDivElement>(null)
    const glowRef = React.useRef<HTMLSpanElement>(null)
    const cardRef = React.useRef<any>(null)
    const aRef = React.useRef<HTMLDivElement>(null)
    const bRef = React.useRef<HTMLDivElement>(null)
    const prismRef = React.useRef<HTMLDivElement>(null)
    const slatEls = React.useRef<(HTMLDivElement | null)[]>([])
    const faceEls = React.useRef<(HTMLDivElement | null)[]>([])
    const shadeEls = React.useRef<(HTMLDivElement | null)[]>([])
    const bevelEls = React.useRef<(HTMLDivElement | null)[]>([])
    const hovering = React.useRef(false)
    const queued = React.useRef<{ face: Face; o: number | null; snd: boolean } | null>(null)
    const [mounted, setMounted] = React.useState(false)
    const mountedRef = React.useRef(false)
    mountedRef.current = mounted
    const [box, setBox] = React.useState({ w: 0, h: 0 })
    // The prisms' state lives outside React and is painted straight onto them. A new prism count or side starts a
    // fresh set, at rest on the card's side
    const simR = React.useRef<Sim | null>(null)
    if (!simR.current || simR.current.slats.length !== N || simR.current.base !== base) {
        const old = simR.current
        if (old && old.raf && typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(old.raf)
        simR.current = makeSim(N, base)
    }
    const S = simR.current
    const sim = () => simR.current as Sim
    // the lift is a spring as well, drawn on whole device pixels so the card's edges stay sharp while it rises
    const liftR = React.useRef({ y: 0, v: 0, t: 0, raf: 0, last: 0 })
    const W = box.w
    const sw = N > 0 ? W / N : 0
    const depth = sw * APOTHEM
    const geo = React.useRef({ sw: 0, depth: 0 })
    geo.current = { sw, depth }
    const sizes = W > 0 ? Math.round(W) + "px" : "(min-width: 1200px) 25vw, (min-width: 810px) 50vw, 100vw"
    // prism boundaries fall on whole pixels of the card
    const edge = (j: number) => (N > 0 ? Math.round((j * W) / N) : 0)

    const paintSlat = React.useCallback((j: number) => {
        const sl = sim().slats[j]
        if (!sl) return
        const g = geo.current
        const el = slatEls.current[j]
        if (el) el.style.transform = "translateZ(" + -g.depth + "px) rotateY(" + sl.th + "deg)"
        const amt = cfg.current.shade
        for (let f = 0; f < 2; f++) {
            const phi = sl.th + faceAngle(f, sl.s)
            const sh = shadeEls.current[j * 2 + f]
            if (sh) sh.style.opacity = String(shadeOf(phi, amt))
            const bv = bevelEls.current[j * 2 + f]
            if (bv) bv.style.opacity = String(bevelOf(phi) * Math.min(1, amt * 1.4))
        }
    }, [])

    const placeFaces = React.useCallback((j: number) => {
        const sl = sim().slats[j]
        if (!sl) return
        const g = geo.current
        for (let f = 1; f < 3; f++) {
            const el = faceEls.current[j * 3 + f]
            if (el) el.style.transform = "rotateY(" + faceAngle(f, sl.s) + "deg) translateZ(" + g.depth + "px)"
        }
    }, [])

    const paintAll = React.useCallback(() => {
        const n = sim().slats.length
        for (let j = 0; j < n; j++) {
            placeFaces(j)
            paintSlat(j)
        }
    }, [])

    const showFlat = React.useCallback((face: Face) => {
        if (prismRef.current) prismRef.current.style.display = "none"
        layer(aRef.current, face === 0)
        layer(bRef.current, face === 1)
    }, [])

    // every prism at rest on the same face: the flat face takes over, crisp and selectable
    const settle = React.useCallback(() => {
        const s = sim()
        const allA = s.slats.every((sl) => sl.tgt === 0 && sl.th === 0)
        const allB = s.slats.every((sl) => sl.tgt !== 0 && sl.th === sl.tgt)
        if (!allA && !allB) return
        s.live = false
        s.face = allB ? 1 : 0
        showFlat(s.face)
    }, [])

    // The turn's sound follows the wave: every prism clicks as it lands, from its own place across the card, so the
    // clicks travel the way the prisms turn. The first ones land loudest and the wave thins out, the clicks climb a few
    // percent on the way over and fall on the way back, and the last prism latches with a light double click. Turning
    // back is a quieter echo of turning over. Each card sits a few percent higher than the one before it
    const gate = React.useRef({ t: -1 })
    const cue = (j: number, k: number, n: number, open: boolean) => {
        const c = cfg.current
        if (!c.soundOn) return
        let pan = 0
        let spread = 0
        const el = liRef.current
        if (el && typeof window !== "undefined" && window.innerWidth > 0) {
            const rc = el.getBoundingClientRect()
            pan = ((rc.left + rc.width / 2) / window.innerWidth - 0.5) * 0.9
            spread = (rc.width / window.innerWidth) * 0.9
        }
        const mid = (c.cards - 1) / 2
        const card = 1 + (mid > 0 ? ((c.index - mid) / mid) * 0.03 : 0)
        const prog = n > 1 ? (k - 1) / (n - 1) : 0
        const lvl = (open ? 1 : 0.45) * (1 - prog * 0.5)
        const pitch = card * (1 + (open ? 1 : -1) * prog * 0.06) * (open ? 1 : 0.94)
        const last = k === n
        tick(c.soundStyle, c.volume * (last ? (open ? 0.7 : 0.35) : lvl), pitch, pan + ((j + 0.5) / cfg.current.count - 0.5) * spread, last, gate.current)
    }

    const step = React.useCallback((now: number) => {
        const s = sim()
        s.raf = 0
        const c = cfg.current
        const dt = Math.min(0.05, Math.max(0, (now - s.last) / 1000))
        s.last = now
        const sub = Math.max(1, Math.ceil(dt / 0.004))
        const h = dt / sub
        let moving = false
        for (let j = 0; j < s.slats.length; j++) {
            const sl = s.slats[j]
            if (sl.pend !== null && now >= sl.at) {
                if (sl.pend !== sl.tgt) sl.landed = false
                sl.tgt = sl.pend
                sl.pend = null
            }
            if (sl.pend !== null) moving = true
            const before = sl.th - sl.tgt
            if (before === 0 && sl.v === 0) continue
            for (let q = 0; q < sub; q++) {
                const a = -c.k * (sl.th - sl.tgt) - c.c * sl.v
                sl.v += a * h
                sl.th += sl.v * h
            }
            const after = sl.th - sl.tgt
            if (!sl.landed && (after * before <= 0 || Math.abs(after) < 1.5)) {
                sl.landed = true
                if (s.snd) {
                    s.hits++
                    if (s.hits <= s.need) cue(j, s.hits, s.need, s.face !== s.base)
                }
            }
            if (Math.abs(after) < 0.04 && Math.abs(sl.v) < 0.8) {
                sl.th = sl.tgt
                sl.v = 0
            } else moving = true
            paintSlat(j)
        }
        if (moving) s.raf = requestAnimationFrame(step)
        else settle()
    }, [])

    // straight to a face, without turning (reduced motion)
    const jump = React.useCallback((face: Face) => {
        const s = sim()
        if (s.raf && typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(s.raf)
        s.raf = 0
        for (const sl of s.slats) {
            sl.th = sl.tgt = face === 1 ? -sl.s * TURN : 0
            sl.v = 0
            sl.pend = null
            sl.landed = true
        }
        s.live = false
        s.face = face
        // the colour side sits under the image side: it shows at once and leaves only after the image has faded in
        if (aRef.current) aRef.current.style.transitionDelay = face === 0 ? "0s" : "0.35s"
        showFlat(face)
    }, [])

    // Turn every prism to a face. The wave starts at the origin (a prism index) and rolls outwards; a prism that is
    // still turning keeps its momentum until the wave reaches it
    const flip = React.useCallback((face: Face, o: number | null, snd: boolean) => {
        const c = cfg.current
        if (c.isStatic) return
        const s = sim()
        if (!s.live && s.face === face) {
            // already resting there
            queued.current = null
            return
        }
        if (c.reduced) {
            jump(face)
            return
        }
        const pr = prismRef.current
        if (!mountedRef.current || geo.current.sw <= 0 || !pr) {
            queued.current = { face, o, snd }
            if (!mountedRef.current) setMounted(true)
            return
        }
        const n = s.slats.length
        const origin = o === null ? (c.origin === "center" ? (n - 1) / 2 : 0) : clamp(o, -0.5, n - 0.5)
        const now = performance.now()
        const wake = !s.live
        let need = 0
        for (let j = 0; j < n; j++) {
            const sl = s.slats[j]
            // a prism resting on the card's side picks the way it turns, so the wave opens outwards from the origin
            // and the way back retraces it
            if (face !== s.base && sl.pend === null && sl.v === 0 && sl.th === sl.tgt && (sl.th === 0 ? 0 : 1) === s.base) {
                const out = j >= origin ? 1 : -1
                const side = s.base === 0 ? -out : out
                if (side !== sl.s) {
                    sl.s = side
                    if (s.base === 1) sl.th = sl.tgt = -side * TURN
                    placeFaces(j)
                    if (!wake) paintSlat(j)
                }
            }
            sl.pend = face === 1 ? -sl.s * TURN : 0
            sl.at = now + Math.abs(j - origin) * c.stagger
            // a turn reversed half way: only the prisms that still move count towards the wave and its latch
            if (sl.pend !== sl.tgt || !sl.landed) need++
        }
        s.need = need
        s.face = face
        s.snd = snd && c.soundOn
        s.hits = 0
        if (wake) {
            s.live = true
            paintAll()
            pr.style.display = "block"
            layer(aRef.current, false)
            layer(bRef.current, false)
        }
        if (!s.raf) {
            s.last = now
            s.raf = requestAnimationFrame(step)
        }
    }, [])

    const turn = React.useCallback((open: boolean, o: number | null, snd: boolean) => {
        const b = cfg.current.base
        flip(open ? ((1 - b) as Face) : b, o, snd)
    }, [])

    React.useEffect(() => {
        const api: CardApi = { turn, open: () => sim().face !== cfg.current.base }
        const list = p.apis.current
        list[index] = api
        return () => {
            if (list[index] === api) list[index] = null
        }
    }, [index, turn, p.apis])

    // size of the card, without transforms, for the prisms
    useIsoLayoutEffect(() => {
        const el = cardRef.current as HTMLElement | null
        if (!el || p.isStatic) return
        const set = (w: number, h: number) =>
            setBox((b) => (Math.abs(b.w - w) < 0.1 && Math.abs(b.h - h) < 0.1 ? b : { w, h }))
        set(el.offsetWidth, el.offsetHeight)
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((es) => {
            const e: any = es[0]
            if (!e) return
            const bs = e.borderBoxSize
            const b = bs && (bs[0] || bs)
            if (b && b.inlineSize) set(b.inlineSize, b.blockSize)
            else set(e.contentRect.width, e.contentRect.height)
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [p.isStatic, hasLink])

    // the prisms are built once the card comes near the screen
    React.useEffect(() => {
        if (p.isStatic || p.reduced || mounted) return
        const el = liRef.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            setMounted(true)
            return
        }
        let dead = false
        const io = new IntersectionObserver(
            (es) => {
                if (!dead && es.some((e) => e.isIntersecting)) {
                    io.disconnect()
                    setMounted(true)
                }
            },
            { rootMargin: "400px 0px" }
        )
        io.observe(el)
        return () => {
            dead = true
            io.disconnect()
        }
    }, [p.isStatic, p.reduced, mounted])

    // the picture is decoded before the first turn, so no prism ever shows an empty face
    React.useEffect(() => {
        if (!mounted || typeof Image === "undefined") return
        const src = imgSrc(item.image)
        if (!src) return
        const im = new Image()
        const set = imgSet(item.image)
        if (set) {
            im.sizes = sizes
            im.srcset = set
        }
        im.src = src
        if (im.decode) im.decode().catch(() => {})
    }, [mounted, item.image, sizes])

    // a fresh set of prisms shows its side flat, and every prism stands where its state says
    useIsoLayoutEffect(() => {
        const s = sim()
        if (s.live) return
        showFlat(s.face)
        paintAll()
    }, [N, base, mounted])

    useIsoLayoutEffect(() => {
        if (!mounted || W <= 0) return
        const q = queued.current
        if (q) {
            queued.current = null
            flip(q.face, q.o, q.snd)
        }
    }, [mounted, W])

    // phones and tablets: the card in the middle of the screen turns to its other side, quietly – it follows the scroll
    React.useEffect(() => {
        if (p.isStatic || p.canHover || p.touch !== "view") return
        const el = liRef.current
        if (!el || typeof IntersectionObserver === "undefined") return
        let dead = false
        const io = new IntersectionObserver(
            (es) => {
                if (dead) return
                for (const e of es) turn(e.isIntersecting, null, false)
            },
            { rootMargin: "-42% 0px -42% 0px", threshold: 0 }
        )
        io.observe(el)
        return () => {
            dead = true
            io.disconnect()
            turn(false, null, false)
        }
    }, [p.isStatic, p.canHover, p.touch])

    React.useEffect(
        () => () => {
            const s = sim()
            if (s.raf) cancelAnimationFrame(s.raf)
            s.raf = 0
            const L = liftR.current
            if (L.raf) cancelAnimationFrame(L.raf)
            L.raf = 0
        },
        []
    )

    const originAt = (clientX: number) => {
        const c = cfg.current
        if (c.origin === "left") return 0
        if (c.origin === "center") return (c.count - 1) / 2
        const el = liRef.current
        if (!el) return 0
        const rc = el.getBoundingClientRect()
        const x = rc.width > 0 ? (clientX - rc.left) / rc.width : 0
        return clamp(x, 0, 1) * c.count - 0.5
    }
    // The lift springs to its height. Every frame lands on a whole device pixel, so the card never sits between two
    // pixels and its edges stay sharp; the deeper shadow follows the height
    const paintLift = () => {
        const L = liftR.current
        const dpr = typeof window !== "undefined" && window.devicePixelRatio > 0 ? window.devicePixelRatio : 1
        const y = Math.round(L.y * dpr) / dpr
        if (liftRef.current) liftRef.current.style.transform = y !== 0 ? "translateY(" + y + "px)" : ""
        const max = cfg.current.liftPx
        if (glowRef.current) glowRef.current.style.opacity = max > 0 ? String(r3(clamp(-L.y / max, 0, 1))) : "0"
    }
    const liftStep = React.useCallback((now: number) => {
        const L = liftR.current
        L.raf = 0
        const c = cfg.current
        const dt = Math.min(0.05, Math.max(0, (now - L.last) / 1000))
        L.last = now
        const sub = Math.max(1, Math.ceil(dt / 0.004))
        const h = dt / sub
        for (let q = 0; q < sub; q++) {
            const a = -c.k * (L.y - L.t) - c.c * L.v
            L.v += a * h
            L.y += L.v * h
        }
        // it never sinks below its resting line
        if (L.t === 0 && L.y > 0) {
            L.y = 0
            L.v = 0
        }
        const done = Math.abs(L.y - L.t) < 0.02 && Math.abs(L.v) < 0.5
        if (done) {
            L.y = L.t
            L.v = 0
        }
        paintLift()
        if (!done) L.raf = requestAnimationFrame(liftStep)
    }, [])
    const setLift = (on: boolean) => {
        const c = cfg.current
        const L = liftR.current
        const target = on && !c.reduced && !c.isStatic ? -c.liftPx : 0
        if (L.t === target && (L.raf || L.y === target)) return
        L.t = target
        if (!L.raf) {
            L.last = performance.now()
            L.raf = requestAnimationFrame(liftStep)
        }
    }
    const focusVisible = () => {
        const el = cardRef.current
        try {
            return !!el && el.matches(":focus-visible")
        } catch (err) {
            return false
        }
    }
    const onEnter = (e: React.PointerEvent) => {
        if (e.pointerType === "touch" || cfg.current.isStatic) return
        hovering.current = true
        cfg.current.onHover(index, true)
        setLift(true)
        if (cfg.current.hoverTurn) turn(true, originAt(e.clientX), true)
    }
    const onLeave = (e: React.PointerEvent) => {
        if (e.pointerType === "touch" || cfg.current.isStatic) return
        hovering.current = false
        // a card with keyboard focus stays turned until the focus moves on
        if (focusVisible()) return
        cfg.current.onHover(index, false)
        setLift(false)
        turn(false, originAt(e.clientX), true)
    }
    const onFocus = () => {
        if (hovering.current || !focusVisible()) return
        cfg.current.onHover(index, true)
        setLift(true)
        if (cfg.current.hoverTurn) turn(true, null, true)
    }
    const onBlur = () => {
        if (hovering.current) return
        cfg.current.onHover(index, false)
        setLift(false)
        turn(false, null, true)
    }
    // Tap mode: the first tap turns the card, the second opens its link
    const onClick = (e: React.MouseEvent) => {
        const c = cfg.current
        if (c.isStatic || c.canHover || c.touch !== "tap") return
        const open = sim().face !== c.base
        c.onPick(index)
        if (!open) {
            e.preventDefault()
            turn(true, null, true)
        } else if (!hasLink) turn(false, null, true)
    }

    // The card paints nothing of its own under the faces: a dark layer there would show through the anti-aliased
    // rounded corners and edges as a grey rim
    const Tag: any = hasLink ? "a" : "div"
    const linkProps: any = hasLink ? { href, target: item.newTab ? "_blank" : undefined, rel: item.newTab ? "noopener noreferrer" : undefined } : {}
    const faceProps = {
        item,
        index,
        color,
        ink,
        light: p.lightText,
        dark: p.darkText,
        scrim: p.scrim,
        title: p.title,
        body: p.body,
        showIndex: p.showIndex,
        action: p.action,
        hasLink,
        sizes,
    }
    const fadeA = p.reduced ? "opacity 0s linear" : undefined
    const fadeB = p.reduced ? "opacity 0.35s ease" : undefined
    const showA = !S.live && S.face === 0
    const showB = !S.live && S.face === 1
    const usePrisms = mounted && W > 0 && !p.reduced && !p.isStatic
    const cardStyle: any = {
        aspectRatio: String(p.ratio),
        borderRadius: p.radius,
        overflow: "hidden",
        cursor: hasLink ? "pointer" : "default",
        userSelect: hasLink ? "none" : undefined,
        WebkitUserSelect: hasLink ? "none" : undefined,
    }
    cardStyle["--psc-r"] = String(p.ratio)

    const slats: React.ReactNode[] = []
    if (usePrisms) {
        for (let j = 0; j < N; j++) {
            const sl = S.slats[j]
            const x0 = edge(j)
            const x1 = edge(j + 1)
            const faces: React.ReactNode[] = []
            for (let f = 0; f < 3; f++) {
                const phi = sl.th + faceAngle(f, sl.s)
                faces.push(
                    <div
                        key={f}
                        ref={(el) => {
                            faceEls.current[j * 3 + f] = el
                        }}
                        className="psc-face"
                        style={{ transform: "rotateY(" + faceAngle(f, sl.s) + "deg) translateZ(" + depth + "px)", background: f === 2 ? p.darkText : undefined }}
                    >
                        {f < 2 ? (
                            <React.Fragment>
                                <div className="psc-slice" style={{ left: -x0, width: W }}>
                                    <FaceContent kind={f === 0 ? 0 : 1} slice {...faceProps} />
                                </div>
                                <div
                                    ref={(el) => {
                                        bevelEls.current[j * 2 + f] = el
                                    }}
                                    style={{ ...FILL, background: BEVEL, opacity: bevelOf(phi) * Math.min(1, p.shade * 1.4) }}
                                />
                                <div
                                    ref={(el) => {
                                        shadeEls.current[j * 2 + f] = el
                                    }}
                                    style={{ ...FILL, background: "#000", opacity: shadeOf(phi, p.shade) }}
                                />
                            </React.Fragment>
                        ) : null}
                    </div>
                )
            }
            slats.push(
                <div
                    key={j}
                    ref={(el) => {
                        slatEls.current[j] = el
                    }}
                    style={{
                        position: "absolute",
                        top: 0,
                        height: "100%",
                        left: x0,
                        width: x1 - x0 + (j < N - 1 ? 0.75 : 0),
                        transformStyle: "preserve-3d",
                        transform: "translateZ(" + -depth + "px) rotateY(" + sl.th + "deg)",
                    }}
                >
                    {faces}
                </div>
            )
        }
    }

    return (
        <li ref={liRef} className="psc-li" onPointerEnter={onEnter} onPointerLeave={onLeave}>
            <div ref={liftRef} className="psc-lift" style={{ position: "relative", borderRadius: p.radius, boxShadow: p.shadow || "none" }}>
                {p.glow ? (
                    <span ref={glowRef} aria-hidden="true" style={{ ...FILL, borderRadius: p.radius, boxShadow: p.glow, opacity: 0, pointerEvents: "none" }} />
                ) : null}
                <Tag ref={cardRef} className="psc-card" {...linkProps} onFocus={onFocus} onBlur={onBlur} onClick={onClick} style={cardStyle}>
                    <div ref={aRef} style={{ ...FILL, opacity: showA ? 1 : 0, pointerEvents: showA ? undefined : "none", transition: fadeA }}>
                        <FaceContent kind={0} {...faceProps} />
                    </div>
                    <div ref={bRef} style={{ ...FILL, opacity: showB ? 1 : 0, pointerEvents: showB ? undefined : "none", transition: fadeB }}>
                        <FaceContent kind={1} {...faceProps} />
                    </div>
                    {/* Only shown while the prisms turn. Its dark backdrop for the gaps sits a pixel inside the card, so it never
                    shows through the rounded edge, and nothing but the card itself clips the corners */}
                    {usePrisms ? (
                        <div ref={prismRef} aria-hidden="true" style={{ ...FILL, display: S.live ? "block" : "none", pointerEvents: "none" }}>
                            <div style={{ position: "absolute", top: 1, left: 1, right: 1, bottom: 1, borderRadius: innerRadius(p.radius, 1), background: p.darkText }} />
                            <div style={{ ...FILL, perspective: Math.max(480, W * 2.8) + "px", transformStyle: "preserve-3d" }}>{slats}</div>
                        </div>
                    ) : null}
                    <span
                        className="psc-ring"
                        aria-hidden="true"
                        style={{
                            ...FILL,
                            borderRadius: p.radius,
                            pointerEvents: "none",
                            opacity: 0,
                            transition: "opacity 0.2s",
                            boxShadow: "inset 0 0 0 2px " + p.darkText + ", inset 0 0 0 4px " + p.lightText,
                        }}
                    />
                </Tag>
            </div>
        </li>
    )
}

/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 560
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerDisableUnlink
 */
export default function PrismServiceCards(props: Props) {
    const isStatic = useIsStaticRenderer()
    const raw = props.items && props.items.length ? props.items : DEFAULT_ITEMS
    // Framer keeps no pictures inside the items' defaults, so a new instance would start without them: a demo service
    // that is still untouched (its title, no picture of its own) gets its picture, colour and side back
    const items = raw.filter(Boolean).map((it, i) => {
        let x = it
        const d = DEFAULT_ITEMS[i]
        if (d && x.title === d.title) {
            if (!imgSrc(x.image)) x = { ...x, image: d.image }
            if (!x.color) x = { ...x, color: d.color }
            if (!x.side) x = { ...x, side: d.side }
        }
        return x
    })
    const n = items.length
    const darkText = props.darkText || "#141413"
    const lightText = props.lightText || "#FFFFFF"
    const showIndex = props.showIndex === undefined ? true : props.showIndex
    const action = props.action === undefined ? "Learn more" : props.action
    const overlay = clamp(num(props.overlay, 60), 0, 100) / 100
    const cols = Math.max(1, Math.min(Math.round(clamp(num(props.columns, 4), 1, 12)), n || 1))
    const balance = props.balance === undefined ? true : props.balance
    const minW = clamp(num(props.minWidth, 260), 60, 4000)
    const gap = parseGap(props.gap)
    const ratio = clamp(num(props.ratio, 0.78), 0.2, 5)
    const pad = parsePad(props.padding)
    const maxW = clamp(num(props.maxWidth, 1280), 100, 10000)
    const radius = props.radius || "12px"
    const shadow = props.shadow === undefined ? DEFAULT_SHADOW : props.shadow
    const P = props.prism || {}
    const count = Math.round(clamp(num(P.count, 10), 2, 48))
    const origin = P.origin === "left" || P.origin === "center" ? P.origin : "pointer"
    const stagger = clamp(num(P.stagger, 32), 0, 400)
    const sp = spring(clamp(num(P.speed, 50), 0, 100), clamp(num(P.bounce, 35), 0, 100))
    const shade = clamp(num(P.shade, 45), 0, 100) / 100
    const M = props.motion || {}
    const intro = M.intro === undefined ? true : M.intro
    const autoplay = !!M.autoplay
    const interval = clamp(num(M.interval, 3.5), 1, 60)
    const touch = M.touch === "tap" ? "tap" : "view"
    const HV = props.hover || {}
    const hoverTurn = HV.turn === undefined ? true : HV.turn
    // Lift used to be a switch under Motion; an instance that turned it off keeps it off
    const liftPx = clamp(num(HV.lift, M.lift === false ? 0 : 4), 0, 40)
    const glowAmt = clamp(num(HV.shadow, 100), 0, 100) / 100
    const SND = props.sound || {}
    const soundOn = SND.on === undefined ? true : SND.on
    const soundStyle = SND.style === "tick" ? 1 : SND.style === "glass" ? 2 : 0
    const volume = clamp(num(SND.volume, 50), 0, 100) / 100
    const label = props.label === undefined ? "Services" : props.label
    const tint = tintOf(darkText)
    const scrim = scrimOf(tint, overlay)
    // a deeper shadow grows under a lifted card
    const glow = liftPx > 0 && glowAmt > 0 ? "0px 30px 48px -28px rgba(" + tint + ", " + r3(0.42 * glowAmt) + ")" : ""
    // one class per grid setup: instances with the same setup share the same rules
    const gid = ("psc-" + [n, cols, minW, gap.col, maxW, balance ? 1 : 0].join("-")).replace(/[^a-zA-Z0-9_-]/g, "_")
    const title = React.useMemo(
        () => fontSpec(props.titleFont, { size: 26, weight: 600, stretch: 112, lh: "1.04em", ls: "-0.025em" }),
        [props.titleFont]
    )
    const body = React.useMemo(() => fontSpec(props.textFont, { size: 14, weight: 430, stretch: 100, lh: "1.45em", ls: "0em" }), [props.textFont])

    const [reduced, setReduced] = React.useState(false)
    const [canHover, setCanHover] = React.useState(true)
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mr = window.matchMedia("(prefers-reduced-motion: reduce)")
        const mh = window.matchMedia("(hover: hover) and (pointer: fine)")
        const upd = () => {
            setReduced(mr.matches)
            setCanHover(mh.matches)
        }
        upd()
        const on = (m: MediaQueryList) => (m.addEventListener ? m.addEventListener("change", upd) : (m as any).addListener(upd))
        const off = (m: MediaQueryList) => (m.removeEventListener ? m.removeEventListener("change", upd) : (m as any).removeListener(upd))
        on(mr)
        on(mh)
        return () => {
            off(mr)
            off(mh)
        }
    }, [])

    const rootRef = React.useRef<HTMLElement>(null)
    const apis = React.useRef<(CardApi | null)[]>([])
    const hoverIdx = React.useRef(-1)
    const autoIdx = React.useRef(-1)
    const inView = React.useRef(false)
    // until when the intro owns the cards; autoplay waits for it
    const introEnd = React.useRef(0)
    // The first hover, tap or keyboard focus on a card hands the cards to the visitor: the intro stops where it is and
    // nothing turns on its own any more
    const taken = React.useRef(false)
    const stopIntro = React.useRef<((keep: number) => void) | null>(null)
    const takeOver = React.useCallback((i: number) => {
        if (taken.current) return
        taken.current = true
        if (stopIntro.current) stopIntro.current(i)
    }, [])

    const onHover = React.useCallback((i: number, on: boolean) => {
        if (on) {
            hoverIdx.current = i
            takeOver(i)
            const a = autoIdx.current
            if (a >= 0 && a !== i) {
                const api = apis.current[a]
                if (api) api.turn(false, null, false)
            }
            autoIdx.current = -1
        } else if (hoverIdx.current === i) hoverIdx.current = -1
    }, [])
    const onPick = React.useCallback((i: number) => {
        takeOver(i)
        apis.current.forEach((a, j) => {
            if (a && j !== i && a.open()) a.turn(false, null, false)
        })
        autoIdx.current = -1
    }, [])

    React.useEffect(() => {
        if (!isStatic && soundOn) armAudio()
    }, [isStatic, soundOn])

    React.useEffect(() => {
        const el = rootRef.current
        if (isStatic || !el || typeof IntersectionObserver === "undefined") {
            inView.current = true
            return
        }
        const io = new IntersectionObserver(
            (es) => {
                for (const e of es) inView.current = e.isIntersecting
            },
            { threshold: 0 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic])

    // Intro: once the section comes into view, the cards turn to their other side and back, one after another – once,
    // and only while the visitor has not touched the cards yet
    const touchView = !canHover && touch === "view"
    React.useEffect(() => {
        const el = rootRef.current
        if (isStatic || !intro || reduced || touchView || n < 1 || !el || typeof IntersectionObserver === "undefined" || taken.current) {
            introEnd.current = 0
            return
        }
        let dead = false
        let done = false
        const timers: number[] = []
        const shown = new Set<number>()
        let io: IntersectionObserver | null = null
        // stop where it is: every card the intro turned goes back, except the one the visitor is on
        const stop = (keep: number) => {
            dead = true
            if (io) io.disconnect()
            timers.forEach((t) => window.clearTimeout(t))
            timers.length = 0
            shown.forEach((i) => {
                const a = apis.current[i]
                if (a && i !== keep && i !== hoverIdx.current) a.turn(false, null, false)
            })
            shown.clear()
            introEnd.current = 0
        }
        introEnd.current = Infinity
        io = new IntersectionObserver(
            (es) => {
                if (dead || done || !es.some((e) => e.isIntersecting)) return
                done = true
                if (io) io.disconnect()
                introEnd.current = Date.now() + 260 + (n - 1) * 170 + 1150 + 900
                for (let i = 0; i < n; i++) {
                    const t0 = 260 + i * 170
                    timers.push(
                        window.setTimeout(() => {
                            const a = apis.current[i]
                            if (a && hoverIdx.current < 0) {
                                shown.add(i)
                                a.turn(true, null, false)
                            }
                        }, t0)
                    )
                    timers.push(
                        window.setTimeout(() => {
                            shown.delete(i)
                            const a = apis.current[i]
                            if (a && hoverIdx.current !== i && autoIdx.current !== i) a.turn(false, null, false)
                        }, t0 + 1150)
                    )
                }
            },
            { rootMargin: "0px 0px -20% 0px", threshold: 0 }
        )
        io.observe(el)
        stopIntro.current = stop
        return () => {
            if (stopIntro.current === stop) stopIntro.current = null
            stop(-1)
        }
    }, [isStatic, intro, reduced, touchView, n])

    // Autoplay: one card after another shows its other side – until the visitor points at or taps a card
    React.useEffect(() => {
        if (isStatic || !autoplay || reduced || touchView || n < 1) return
        let alive = true
        let timer = 0
        const tick = () => {
            if (!alive || taken.current) return
            if (Date.now() < introEnd.current) {
                timer = window.setTimeout(tick, 400)
                return
            }
            if (hoverIdx.current < 0 && inView.current && !document.hidden) {
                const prev = autoIdx.current
                // a single card turns and comes back on alternate ticks
                const next = prev + 1 < n ? prev + 1 : n > 1 ? 0 : -1
                if (prev >= 0 && prev !== next) {
                    const a = apis.current[prev]
                    if (a) a.turn(false, null, false)
                }
                if (next >= 0) {
                    const b = apis.current[next]
                    if (b) b.turn(true, null, false)
                }
                autoIdx.current = next
            }
            timer = window.setTimeout(tick, interval * 1000)
        }
        timer = window.setTimeout(tick, 1200)
        return () => {
            alive = false
            window.clearTimeout(timer)
            const ai = autoIdx.current
            const a = ai >= 0 ? apis.current[ai] : null
            if (a && ai !== hoverIdx.current) a.turn(false, null, false)
            autoIdx.current = -1
        }
    }, [isStatic, autoplay, reduced, touchView, n, interval])

    return (
        <section
            ref={rootRef as any}
            className={"psc-root " + gid}
            aria-label={label || undefined}
            style={{
                ...props.style,
                position: "relative",
                boxSizing: "border-box",
                padding: pad.t + "px " + pad.r + "px " + pad.b + "px " + pad.l + "px",
            }}
        >
            <style>{FONT_CSS + BASE_CSS + gridCss(gid, n, cols, minW, gap.col, maxW, balance)}</style>
            <ul
                className={"psc-list " + gid + "-l"}
                role="list"
                style={{
                    display: "grid",
                    gap: gap.row + "px " + gap.col + "px",
                    width: "100%",
                    maxWidth: maxW,
                    margin: "0 auto",
                }}
            >
                {items.map((it, i) => (
                    <Card
                        key={i}
                        item={it}
                        index={i}
                        cards={n}
                        base={it.side === "image" ? 1 : 0}
                        count={count}
                        ratio={ratio}
                        radius={radius}
                        shadow={shadow}
                        glow={glow}
                        scrim={scrim}
                        darkText={darkText}
                        lightText={lightText}
                        title={title}
                        body={body}
                        showIndex={showIndex}
                        action={action}
                        origin={origin}
                        stagger={stagger}
                        k={sp.k}
                        c={sp.c}
                        shade={shade}
                        hoverTurn={hoverTurn}
                        liftPx={liftPx}
                        isStatic={isStatic}
                        reduced={reduced}
                        canHover={canHover}
                        touch={touch}
                        soundOn={soundOn}
                        soundStyle={soundStyle}
                        volume={volume}
                        apis={apis}
                        onHover={onHover}
                        onPick={onPick}
                    />
                ))}
            </ul>
        </section>
    )
}

addPropertyControls(PrismServiceCards, {
    items: {
        type: ControlType.Array,
        title: "Services",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "Service" },
                text: { type: ControlType.String, title: "Text", defaultValue: "A short line about this service.", displayTextArea: true },
                color: { type: ControlType.Color, title: "Color", defaultValue: "#D6F36E" },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                side: {
                    type: ControlType.Enum,
                    title: "Side",
                    options: ["color", "image"],
                    optionTitles: ["Color", "Image"],
                    displaySegmentedControl: true,
                    defaultValue: "color",
                    description: "The side the card shows at rest. It turns to the other one on hover.",
                },
                link: { type: ControlType.Link, title: "Link" },
                newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false, enabledTitle: "Yes", disabledTitle: "No" },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    action: {
        type: ControlType.String,
        title: "Action",
        defaultValue: "Learn more",
        placeholder: "Off",
        description: "The button on the image side of cards with a link.",
    },
    showIndex: { type: ControlType.Boolean, title: "Index", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    titleFont: {
        type: ControlType.Font,
        title: "Title",
        controls: "extended",
        displayTextAlignment: false,
        defaultValue: { fontSize: 26, letterSpacing: "-0.025em", lineHeight: "1.04em" },
        description: "Mona Sans is built in, set wide with its width axis. Pick another font to replace it.",
    },
    textFont: {
        type: ControlType.Font,
        title: "Text",
        controls: "extended",
        displayTextAlignment: false,
        defaultValue: { fontSize: 14, letterSpacing: "0em", lineHeight: "1.45em" },
    },
    darkText: { type: ControlType.Color, title: "Dark Text", defaultValue: "#141413" },
    lightText: {
        type: ControlType.Color,
        title: "Light Text",
        defaultValue: "#FFFFFF",
        description: "Each card picks the text colour that reads best on its colour. The image side always uses Light Text.",
    },
    overlay: {
        type: ControlType.Number,
        title: "Overlay",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 60,
        unit: "%",
        description: "Darkens the image behind its text.",
    },
    columns: { type: ControlType.Number, title: "Columns", min: 1, max: 6, step: 1, defaultValue: 4, displayStepper: true },
    balance: {
        type: ControlType.Boolean,
        title: "Balance",
        defaultValue: true,
        description: "Uses fewer columns instead of leaving one card alone in the last row.",
    },
    minWidth: {
        type: ControlType.Number,
        title: "Min Width",
        min: 120,
        max: 800,
        step: 10,
        defaultValue: 260,
        unit: "px",
        description: "Cards move into fewer columns before they get narrower than this.",
    },
    gap: { type: ControlType.Gap, title: "Gap", defaultValue: "12px" },
    ratio: { type: ControlType.Number, title: "Ratio", min: 0.4, max: 2, step: 0.01, defaultValue: 0.78, description: "Card width ÷ height." },
    padding: { type: ControlType.Padding, title: "Padding", defaultValue: "40px" },
    maxWidth: { type: ControlType.Number, title: "Max Width", min: 200, max: 4000, step: 10, defaultValue: 1280, unit: "px" },
    radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "12px" },
    shadow: { type: ControlType.BoxShadow, title: "Shadow", defaultValue: DEFAULT_SHADOW },
    hover: {
        type: ControlType.Object,
        title: "Hover",
        controls: {
            turn: {
                type: ControlType.Boolean,
                title: "Turn",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
                description: "Turns the card to its other side. Off, the card only lifts.",
            },
            lift: { type: ControlType.Number, title: "Lift", min: 0, max: 16, step: 1, defaultValue: 4, unit: "px", description: "How far the card rises." },
            shadow: {
                type: ControlType.Number,
                title: "Shadow",
                min: 0,
                max: 100,
                step: 1,
                defaultValue: 100,
                unit: "%",
                description: "The deeper shadow under the raised card.",
                hidden: (p: any) => p.lift === 0,
            },
        },
    },
    prism: {
        type: ControlType.Object,
        title: "Prisms",
        controls: {
            count: { type: ControlType.Number, title: "Count", min: 3, max: 32, step: 1, defaultValue: 10, displayStepper: true },
            origin: {
                type: ControlType.Enum,
                title: "Wave",
                options: ["pointer", "left", "center"],
                optionTitles: ["Pointer", "Left", "Center"],
                displaySegmentedControl: true,
                defaultValue: "pointer",
                description: "Where the turn starts. Pointer starts it where the cursor enters and rolls outwards.",
            },
            stagger: { type: ControlType.Number, title: "Stagger", min: 0, max: 150, step: 1, defaultValue: 32, unit: "ms" },
            speed: { type: ControlType.Number, title: "Speed", min: 0, max: 100, step: 1, defaultValue: 50 },
            bounce: { type: ControlType.Number, title: "Bounce", min: 0, max: 100, step: 1, defaultValue: 35 },
            shade: {
                type: ControlType.Number,
                title: "Shading",
                min: 0,
                max: 100,
                step: 1,
                defaultValue: 45,
                description: "Light and shadow on the turning faces.",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            intro: {
                type: ControlType.Boolean,
                title: "Intro",
                defaultValue: true,
                description: "The cards turn once, one after another, when they come into view. The first hover or tap stops it.",
            },
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: false,
                description: "Keeps turning one card after another until the visitor points at or taps a card.",
            },
            interval: { type: ControlType.Number, title: "Interval", min: 1.5, max: 20, step: 0.5, defaultValue: 3.5, unit: "s", hidden: (p: any) => !p.autoplay },
            touch: {
                type: ControlType.Enum,
                title: "Touch",
                options: ["view", "tap"],
                optionTitles: ["In View", "Tap"],
                displaySegmentedControl: true,
                defaultValue: "view",
                description: "Phones and tablets: turn the card in the middle of the screen, or turn it on the first tap and open its link on the second.",
            },
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
                description: "A fine riffle of clicks that travels with the wave, one per prism, and a light double click as the card locks in. Turning back is a quieter echo. Sound starts after the first click, tap or key press on the page.",
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
        defaultValue: "Services",
        description: "Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)",
    },
})
