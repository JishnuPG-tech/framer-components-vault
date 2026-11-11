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


const { useRef, useState, useEffect, useLayoutEffect } = React

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type TabMode = "off" | "layer" | "letter" | "number"
type TabAlign = "stagger" | "left" | "center" | "right"
type HousingMode = "none" | "minimal" | "full"
type ScrollMode = "none" | "wheel" | "page"
type Mode = "list" | "slots" | "placeholder"

interface TabStyle {
    fill: string
    color: string
    activeFill: string
    activeColor: string
    font: React.CSSProperties
    width: number
    height: number
    radius: number
}

interface LayoutOptions {
    cardsBehind: number
    cardsInFront: number
    fanAngle: number
    spacing: number
    fallAngle: number
    depth: number
    tilt: number
    yaw: number
    perspective: number
    offsetY: number
    responsive: boolean
}

interface InteractionOptions {
    scroll: ScrollMode
    drag: boolean
    dragDistance: number
    clickCards: boolean
    keyboard: boolean
    flip: boolean
    snap: number
    momentum: number
}

interface CardOptions {
    paperColor: string
    backColor: string
    edgeColor: string
    inkColor: string
    radius: number
    texture: number
    thickness: number
    notches: "round" | "square" | "none"
    back: "auto" | "generated"
    ctaLabel: string
}

interface HousingOptions {
    material: "steel" | "painted"
    metalColor: string
    darkColor: string
    baseColor: string
    discSize: number
    spindle: number
}

interface MotionOptions {
    speed: number
    flipSpeed: number
    flutter: number
    riffleSpeed: number
    hoverLift: number
    detent: number
}

interface LightingOptions {
    direction: number
    shadows: number
    highlights: number
}

interface SoundOptions {
    flip: boolean
    detent: boolean
    volume: number
}

export interface RolodexProps {
    cards: React.ReactNode[]
    cardWidth: number
    cardHeight: number
    startIndex: number
    loop: boolean
    tabs: TabMode
    tabAlign: TabAlign
    tabStyle: TabStyle
    housing: HousingMode | boolean
    layout: LayoutOptions
    interaction: InteractionOptions
    cardStyle: CardOptions
    housingStyle: HousingOptions
    motion: MotionOptions
    lighting: LightingOptions
    sound: SoundOptions
    ariaLabel: string
    onChange?: (index: number) => void
    onFlip?: (open: boolean) => void
    style?: React.CSSProperties
}

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

const TAB_DEFAULTS: TabStyle = {
    fill: "#F2F0E9",
    color: "#242321",
    activeFill: "#252525",
    activeColor: "#F2F0E9",
    font: { fontSize: 17 },
    width: 34,
    height: 28,
    radius: 7,
}

const LAYOUT_DEFAULTS: LayoutOptions = {
    cardsBehind: 16,
    cardsInFront: 0,
    fanAngle: 12,
    spacing: 4.5,
    fallAngle: 100,
    depth: 0,
    tilt: 24,
    yaw: -27,
    perspective: 2200,
    offsetY: 0,
    responsive: true,
}

const INTERACTION_DEFAULTS: InteractionOptions = {
    scroll: "none",
    drag: true,
    dragDistance: 90,
    clickCards: true,
    keyboard: true,
    flip: true,
    snap: 0.6,
    momentum: 0.5,
}

const CARD_DEFAULTS: CardOptions = {
    paperColor: "#F2F0E9",
    backColor: "#F2F0E9",
    edgeColor: "#DCD8CF",
    inkColor: "#242321",
    radius: 12,
    texture: 0.5,
    thickness: 2,
    notches: "round",
    back: "auto",
    ctaLabel: "Open",
}

const HOUSING_DEFAULTS: HousingOptions = {
    material: "steel",
    metalColor: "#AEB2B0",
    darkColor: "#454747",
    baseColor: "#252525",
    discSize: 0.42,
    spindle: 16,
}

const MOTION_DEFAULTS: MotionOptions = {
    speed: 1,
    flipSpeed: 0.7,
    flutter: 0.4,
    riffleSpeed: 1,
    hoverLift: 0.6,
    detent: 0.5,
}

const LIGHTING_DEFAULTS: LightingOptions = { direction: -30, shadows: 0.6, highlights: 0.6 }
const SOUND_DEFAULTS: SoundOptions = { flip: false, detent: false, volume: 0.4 }

const DEFAULTS = {
    cardWidth: 520,
    cardHeight: 330,
    startIndex: 0,
    loop: true,
    tabs: "letter" as TabMode,
    tabAlign: "stagger" as TabAlign,
    housing: "full" as HousingMode,
    ariaLabel: "Card file",
}

const SERIF = "'Instrument Serif', 'Cormorant Garamond', Georgia, 'Times New Roman', serif"
const SANS = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif"
const MONO = "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
const HIGHLIGHT = "#E3E4DF"

const NOISE =
    'url("data:image/svg+xml,' +
    encodeURIComponent(
        "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.16 0 0 0 0 0.14 0 0 0 0 0.1 1.3 0 0 0 -0.52'/></filter><rect width='180' height='180' filter='url(#n)'/></svg>"
    ) +
    '")'

const PAPER_TEXTURE = "radial-gradient(130% 95% at 18% 8%, rgba(255,255,255,0.22), rgba(255,255,255,0) 60%), " + NOISE

/* Demo content shown until a Collection List is connected. */
const PLACEHOLDERS: [string, string, string, string, string][] = [
    ["Alder Pavilion", "Cultural", "Kyoto", "2024", "Cedar, Glass, Stone"],
    ["Birch Studio", "Workplace", "Oslo", "2023", "Birch, Steel, Wool"],
    ["Cove Residence", "Residential", "Lisbon", "2022", "Lime, Oak, Clay"],
    ["Dune House", "Residential", "Comporta", "2024", "Sand, Teak, Linen"],
    ["Ember Loft", "Residential", "Antwerp", "2021", "Brick, Iron, Walnut"],
    ["Fern Retreat", "Hospitality", "Madeira", "2023", "Cypress, Slate, Moss"],
    ["Granite Hall", "Cultural", "Porto", "2020", "Granite, Ash, Bronze"],
    ["Hillside House", "Residential", "Sintra", "2024", "Oak, Concrete, Linen"],
    ["Iris Gallery", "Cultural", "Milan", "2022", "Plaster, Brass, Silk"],
    ["Juniper Cabin", "Hospitality", "Tromsø", "2023", "Pine, Copper, Felt"],
    ["Kiln Workshop", "Workplace", "Valencia", "2021", "Terracotta, Elm, Zinc"],
    ["Linden Library", "Cultural", "Ghent", "2024", "Linden, Paper, Marble"],
]

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const mod = (a: number, n: number) => ((a % n) + n) % n
const smooth = (x: number) => {
    const t = clamp(x, 0, 1)
    return t * t * (3 - 2 * t)
}
const ease3 = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const pad2 = (n: number) => String(n).padStart(2, "0")

function pick<T>(d: T, o: any): T {
    const out: any = { ...d }
    if (o) for (const k in o) if (o[k] !== undefined && o[k] !== null) out[k] = o[k]
    return out
}

function resolveProps(props: Partial<RolodexProps>) {
    const base = pick(DEFAULTS, props)
    let housing: any = (props as any).housing
    if (housing === false) housing = "none"
    else if (housing === true || !housing) housing = DEFAULTS.housing
    return {
        ...base,
        housing: housing as HousingMode,
        cards: (props.cards || []) as React.ReactNode[],
        tabStyle: pick(TAB_DEFAULTS, props.tabStyle),
        layout: pick(LAYOUT_DEFAULTS, props.layout),
        interaction: pick(INTERACTION_DEFAULTS, props.interaction),
        cardStyle: pick(CARD_DEFAULTS, props.cardStyle),
        housingStyle: pick(HOUSING_DEFAULTS, props.housingStyle),
        motion: pick(MOTION_DEFAULTS, props.motion),
        lighting: pick(LIGHTING_DEFAULTS, props.lighting),
        sound: pick(SOUND_DEFAULTS, props.sound),
        onChange: props.onChange,
        onFlip: props.onFlip,
        style: props.style,
    }
}
type Resolved = ReturnType<typeof resolveProps>

function rgbOf(c: string): number[] {
    if (!c) return [128, 128, 128]
    const m = c.match(/rgba?\(([^)]+)\)/)
    if (m) return m[1].split(",").slice(0, 3).map((v) => parseFloat(v))
    const h = c.match(/#([0-9a-fA-F]{3,8})/)
    if (!h) return [128, 128, 128]
    let x = h[1]
    if (x.length === 3 || x.length === 4) x = x.slice(0, 3).split("").map((q) => q + q).join("")
    const n = parseInt(x.slice(0, 6), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function mix(a: string, b: string, t: number) {
    const A = rgbOf(a)
    const B = rgbOf(b)
    const k = clamp(t, 0, 1)
    return "rgb(" + A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",") + ")"
}
function rgba(c: string, a: number) {
    return "rgba(" + rgbOf(c).join(",") + "," + a + ")"
}

/* Light vector pointing toward the light (y is down in CSS space). */
function lightVec(direction: number) {
    const az = (clamp(direction, -90, 90) * Math.PI) / 180
    const el = 0.85
    return [Math.sin(az) * Math.cos(el), -Math.sin(el), Math.cos(az) * Math.cos(el)]
}

/* Rounded card outline with two notches cut into the bottom edge. */
function cardMask(w: number, h: number, radius: number, style: string, xs: number[], nw: number, nh: number) {
    const r = clamp(radius, 0, Math.min(w, h) / 2)
    let d =
        r > 0
            ? "M" + r + " 0H" + (w - r) + "A" + r + " " + r + " 0 0 1 " + w + " " + r + "V" + (h - r) + "A" + r + " " + r + " 0 0 1 " + (w - r) + " " + h +
              "H" + r + "A" + r + " " + r + " 0 0 1 0 " + (h - r) + "V" + r + "A" + r + " " + r + " 0 0 1 " + r + " 0Z"
            : "M0 0H" + w + "V" + h + "H0Z"
    if (style !== "none") {
        for (const cx of xs) {
            const x0 = cx - nw / 2
            const x1 = cx + nw / 2
            if (style === "round") {
                const rr = nw / 2
                d += "M" + x0 + " " + h + "V" + (h - nh + rr) + "A" + rr + " " + rr + " 0 0 1 " + x1 + " " + (h - nh + rr) + "V" + h + "Z"
            } else {
                const f = 3
                d += "M" + x0 + " " + h + "V" + (h - nh + f) + "Q" + x0 + " " + (h - nh) + " " + (x0 + f) + " " + (h - nh) + "H" + (x1 - f) +
                    "Q" + x1 + " " + (h - nh) + " " + x1 + " " + (h - nh + f) + "V" + h + "Z"
            }
        }
    }
    const svg =
        "<svg xmlns='http://www.w3.org/2000/svg' width='" + w + "' height='" + h + "' viewBox='0 0 " + w + " " + h +
        "'><path fill='#000' fill-rule='evenodd' d='" + d + "'/></svg>"
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")'
}

/* ------------------------------------------------------------------ */
/* Geometry. Everything is positioned relative to the spindle axis.    */
/* ------------------------------------------------------------------ */

function computeGeo(p: Resolved, W: number, H: number) {
    const L = p.layout
    const hs = p.housingStyle
    const compact = L.responsive && W > 0 && W < 600 && H >= W * 0.9 // narrow portrait frames (phones)
    const tablet = L.responsive && !compact && W > 0 && W < 960
    const cw = Math.max(80, p.cardWidth)
    const ch = Math.max(60, p.cardHeight)
    const rodR = clamp(hs.spindle, 6, 30) / 2
    const nw = rodR * 2 + 12
    const nh = rodR * 2 + 8
    const pb = nh - rodR - 3 // spindle centre above the card's bottom edge
    const pivot = ch - pb // spindle centre measured from the card's top edge
    const housing = p.housing
    const R = ch * clamp(hs.discSize, 0.2, 0.7)
    const T = Math.max(14, R * 0.2) * (compact ? 0.55 : 1)
    const gapX = compact ? 8 : 14
    const showKnob = housing === "full" && !compact
    const knobR = R * 0.3
    const knobL = 18
    const slabH = 10
    const slabD = R * 1.5
    const brk = 22
    const xLr = -cw / 2 - gapX
    const xRr = cw / 2 + gapX
    let leftExt: number, rightExt: number, botExt: number
    if (housing === "full") {
        leftExt = Math.min(xLr - T - 18, xLr - T / 2 - R * 0.62)
        rightExt = Math.max(xRr + T + 18 + (showKnob ? knobL : 0), xRr + T / 2 + R * 0.62)
        botExt = R + brk + slabH + 6
    } else if (housing === "minimal") {
        leftExt = xLr - 10
        rightExt = xRr + 10
        botExt = Math.max(pb, rodR * 2.4) + 30
    } else {
        leftExt = -cw / 2 - 10
        rightExt = cw / 2 + 10
        botExt = pb + 30
    }
    const tabH = p.tabs === "off" ? 0 : p.tabStyle.height + 6
    const topExt = -pivot - tabH - 8
    const objW = rightExt - leftExt
    const objH = botExt - topExt
    let s = 1
    if (L.responsive && W > 0 && H > 0) s = Math.min(1, (W - 24) / objW, (H - 24) / objH)
    s = Math.max(0.2, s)
    const axisX = W / 2 - (s * (leftExt + rightExt)) / 2
    const axisY = H / 2 - (s * (topExt + botExt)) / 2 + L.offsetY
    const left = axisX - cw / 2
    const top = axisY - pivot
    const yawK = compact ? 0 : tablet ? 0.5 : 1
    return {
        W, H, s, compact, tablet, cw, ch, rodR, nw, nh, pb, pivot, housing, R, T, knobR, knobL, showKnob, slabH, slabD,
        axisX, axisY, left, top,
        xL: axisX + xLr,
        xR: axisX + xRr,
        floorY: axisY + R + brk,
        notchX: [cw * 0.27, cw * 0.73],
        tilt: compact ? Math.max(L.tilt, 30) : L.tilt,
        yaw: L.yaw * yawK,
        perspective: L.perspective * (compact ? 0.85 : 1),
        behind: clamp(Math.round(L.cardsBehind), 1, 20) - (compact ? Math.max(0, Math.round(L.cardsBehind) - 6) : 0),
        front: clamp(Math.round(L.cardsInFront), 0, 6),
        fan: L.fanAngle,
        spacing: L.spacing * (compact ? 1.35 : 1),
        fall: L.fallAngle,
        depth: clamp(L.depth, 0, 1) * (tablet ? 0.8 : compact ? 0.6 : 1),
    }
}
type Geo = ReturnType<typeof computeGeo>

/* ------------------------------------------------------------------ */
/* DOM helpers for CMS content                                         */
/* ------------------------------------------------------------------ */

function unwrap(el: HTMLElement): HTMLElement {
    let e = el
    for (let k = 0; k < 4; k++) {
        const child = e.firstElementChild as HTMLElement | null
        if (child && getComputedStyle(e).display === "contents") e = child
        else break
    }
    return e
}

function asLayer(el: HTMLElement) {
    const s = el.style
    s.position = "absolute"
    s.left = "0px"
    s.top = "0px"
    s.width = "100%"
    s.height = "100%"
    s.margin = "0px"
    s.transform = "none"
    s.transformStyle = "preserve-3d"
    s.overflow = "visible"
    s.pointerEvents = "none"
}

// One slot = a Collection List (its repeated items become cards); several slots = one card per slot.
function collect(host: HTMLElement, mode: Mode): HTMLElement[] {
    const out: HTMLElement[] = []
    const slots = Array.from(host.children) as HTMLElement[]
    if (mode === "placeholder") return slots
    for (const slot of slots) {
        if (mode === "slots") {
            const c = slot.firstElementChild as HTMLElement | null
            if (c) out.push(unwrap(c))
            continue
        }
        let cur = slot.firstElementChild as HTMLElement | null
        let depth = 0
        while (cur && cur.children.length === 1 && depth < 3) {
            asLayer(cur)
            cur = cur.firstElementChild as HTMLElement | null
            depth++
        }
        if (cur && cur.children.length > 1) {
            asLayer(cur)
            for (const c of Array.from(cur.children)) out.push(unwrap(c as HTMLElement))
        } else if (cur) out.push(cur)
    }
    return out
}

const SKIP_SEL = '[data-framer-name="Tab" i], [data-framer-name="Back" i]'

function findBack(el: HTMLElement) {
    return el.querySelector('[data-framer-name="Back" i]') as HTMLElement | null
}

function firstHeading(el: HTMLElement): HTMLElement | null {
    const hs = el.querySelectorAll("h1, h2, h3, h4, h5, h6")
    for (const h of Array.from(hs)) if (!h.closest(SKIP_SEL)) return h as HTMLElement
    return null
}

function readLabel(el: HTMLElement, mode: TabMode, i: number): string {
    if (mode === "off") return ""
    if (mode === "number") return pad2(i + 1)
    if (mode === "layer") {
        const tab = el.querySelector('[data-framer-name="Tab" i]') as HTMLElement | null
        if (tab) {
            const t = (tab.textContent || "").trim()
            tab.style.display = "none"
            if (t) return t
        }
    }
    const heading = firstHeading(el)
    const text = ((heading && heading.textContent) || el.textContent || "").trim()
    const m = text.match(/\p{L}/u) || text.match(/\p{N}/u)
    return m ? m[0].toUpperCase() : ""
}

function make(doc: Document, tag: string, css: string, text?: string) {
    const e = doc.createElement(tag)
    e.style.cssText = css
    if (text != null) e.textContent = text
    return e
}

// Back face built from the card's own CMS text when it has no "Back" layer.
function generatedBack(card: HTMLElement, i: number, N: number, q: Resolved): HTMLElement {
    const doc = card.ownerDocument
    const cs = q.cardStyle
    const wrap = make(doc, "div", "position:absolute;inset:0;box-sizing:border-box;padding:24px 28px 38px;display:flex;flex-direction:column;gap:10px;text-align:left;font-family:" + SANS + ";color:" + cs.inkColor)
    const head = make(doc, "div", "display:flex;justify-content:space-between;font-family:" + MONO + ";font-size:10px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.55")
    head.appendChild(make(doc, "span", "", "No. " + pad2(i + 1) + " / " + pad2(N)))
    head.appendChild(make(doc, "span", "", "Reverse"))
    wrap.appendChild(head)
    const h = firstHeading(card)
    const title = ((h && h.textContent) || "").trim()
    if (title) wrap.appendChild(make(doc, "div", "font-family:" + SERIF + ";font-size:32px;line-height:1.02;letter-spacing:-0.01em;margin-top:6px", title))
    const seen = new Set<string>([title])
    const lines: string[] = []
    card.querySelectorAll("p, li").forEach((n) => {
        if (lines.length >= 5 || n.closest(SKIP_SEL)) return
        const t = (n.textContent || "").trim()
        if (!t || seen.has(t) || t.length > 240) return
        seen.add(t)
        lines.push(t)
    })
    lines.forEach((t, k) => wrap.appendChild(make(doc, "div", "font-size:" + (k === 0 ? 14 : 12.5) + "px;line-height:1.45;opacity:" + (k === 0 ? 0.85 : 0.68), t)))
    const link = (card.closest("a") || card.querySelector("a")) as HTMLAnchorElement | null
    const href = link && link.getAttribute("href")
    const foot = make(doc, "div", "margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:12px")
    if (href) {
        const a = make(doc, "a", "display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:999px;background:" + cs.inkColor + ";color:" + cs.paperColor + ";font-size:12px;letter-spacing:0.04em;text-decoration:none", (cs.ctaLabel || "Open") + "  →") as HTMLAnchorElement
        a.setAttribute("href", href)
        if (link && link.target) a.target = link.target
        foot.appendChild(a)
    } else foot.appendChild(make(doc, "span", ""))
    foot.appendChild(make(doc, "span", "font-family:" + MONO + ";font-size:9.5px;letter-spacing:0.1em;text-transform:uppercase;opacity:0.45", "Click to turn back"))
    wrap.appendChild(foot)
    return wrap
}

/* ------------------------------------------------------------------ */
/* Optional sound (synthesised, no files)                              */
/* ------------------------------------------------------------------ */

let audioCtx: any = null
let noiseBuf: any = null
function audio() {
    if (typeof window === "undefined") return null
    // Browsers block audio until the visitor has clicked, tapped or pressed a key.
    // Scrolling alone does not count, so stay silent until then instead of logging warnings.
    const ua = (navigator as any).userActivation
    if (ua && !ua.hasBeenActive) return null
    if (!audioCtx) {
        const C = (window as any).AudioContext || (window as any).webkitAudioContext
        if (!C) return null
        audioCtx = new C()
    }
    if (audioCtx.state === "suspended") audioCtx.resume()
    if (!noiseBuf) {
        noiseBuf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 0.4), audioCtx.sampleRate)
        const d = noiseBuf.getChannelData(0)
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    }
    return audioCtx
}
function playTick(vol: number) {
    const ctx = audio()
    if (!ctx) return
    const t = ctx.currentTime
    const src = ctx.createBufferSource()
    src.buffer = noiseBuf
    const f = ctx.createBiquadFilter()
    f.type = "bandpass"
    f.frequency.value = 3400
    f.Q.value = 3
    const g = ctx.createGain()
    g.gain.setValueAtTime(vol * 0.6, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.022)
    src.connect(f)
    f.connect(g)
    g.connect(ctx.destination)
    src.start(t)
    src.stop(t + 0.03)
}
function playSwish(vol: number) {
    const ctx = audio()
    if (!ctx) return
    const t = ctx.currentTime
    const src = ctx.createBufferSource()
    src.buffer = noiseBuf
    const f = ctx.createBiquadFilter()
    f.type = "bandpass"
    f.Q.value = 0.9
    f.frequency.setValueAtTime(700, t)
    f.frequency.exponentialRampToValueAtTime(2600, t + 0.2)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol * 0.35, t + 0.04)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26)
    src.connect(f)
    f.connect(g)
    g.connect(ctx.destination)
    src.start(t)
    src.stop(t + 0.3)
}

const HIDDEN_TEXT: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
}

/* ------------------------------------------------------------------ */
/* Housing (static DOM, positioned from the spindle axis)              */
/* ------------------------------------------------------------------ */

function renderHousing(g: Geo, p: Resolved): React.ReactNode[] {
    const out: React.ReactNode[] = []
    const hs = p.housingStyle
    const steel = hs.material !== "painted"
    const metal = hs.metalColor
    const dark = hs.darkColor
    const base = hs.baseColor
    const L = lightVec(p.lighting.direction)
    const sh = clamp(p.lighting.shadows, 0, 1)
    const hl = clamp(p.lighting.highlights, 0, 1)
    const tiltDeg = g.tilt

    // Polished steel: luminance of a studio environment, by reflected elevation (deg).
    // -90 floor, 0 the wall behind the camera, +90 ceiling, 180 the wall behind the object.
    const ENV: [number, number][] = [
        [-180, 0.26], [-70, 0.08], [-25, 0.2], [-6, 0.32], [0, 0.9], [9, 0.56], [21, 0.34], [33, 0.6], [44, 1], [53, 0.72], [70, 0.44], [120, 0.5], [180, 0.3],
    ]
    const envLum = (phi: number) => {
        if (phi <= ENV[0][0]) return ENV[0][1]
        for (let k = 1; k < ENV.length; k++) {
            const [x1, y1] = ENV[k]
            if (phi <= x1) {
                const [x0, y0] = ENV[k - 1]
                return y0 + ((phi - x0) / (x1 - x0)) * (y1 - y0)
            }
        }
        return ENV[ENV.length - 1][1]
    }
    const metalAt = (lum: number, col: string) => {
        const v = clamp(lum, 0, 1)
        if (v < 0.5) return mix(mix(dark, "#141414", 0.35), col, v * 2)
        return mix(col, "#fbfbf8", (v - 0.5) * 2 * (0.55 + 0.45 * hl))
    }
    const lambert = (col: string, lam: number) => {
        const t = 0.5 + 0.5 * lam
        return t < 0.5 ? mix(mix(col, dark, 0.8), col, t * 2) : mix(col, HIGHLIGHT, (t - 0.5) * 2 * 0.25)
    }
    // colour of a surface whose normal sits at angle a (deg) around the x axis (0 = facing the viewer, +90 = up)
    const shadeAt = (col: string, a: number) => {
        const r = (a * Math.PI) / 180
        const lam = Math.sin(r) * -L[1] + Math.cos(r) * L[2]
        if (!steel) return lambert(col, lam)
        let n = ((a + 180) % 360 + 360) % 360 - 180
        return metalAt(envLum(2 * n + tiltDeg) + 0.08 * lam, col)
    }

    // Cylinder along the x axis. Every facet carries a gradient across its arc so the surface reads smooth.
    const cylX = (
        key: string, x0: number, len: number, r: number, n: number, col: string,
        opt: { knurl?: boolean; bg?: string; y?: number; z?: number; alongZ?: boolean } = {}
    ) => {
        const step = 360 / n
        const fh = (2 * Math.PI * r) / n + 0.9
        const yc = opt.y === undefined ? g.axisY : opt.y
        const pre = (opt.z ? "translateZ(" + opt.z.toFixed(2) + "px) " : "") + (opt.alongZ ? "rotateY(90deg) " : "")
        for (let k = 0; k < n; k++) {
            const ang = k * step
            let c0 = shadeAt(col, ang + step / 2)
            let c1 = shadeAt(col, ang)
            let c2 = shadeAt(col, ang - step / 2)
            if (opt.knurl && k % 2) {
                c0 = mix(c0, "#000000", 0.38)
                c1 = mix(c1, "#000000", 0.38)
                c2 = mix(c2, "#000000", 0.38)
            }
            out.push(
                <div
                    key={key + k}
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: x0,
                        top: yc - fh / 2,
                        width: len,
                        height: fh,
                        background: (opt.bg ? opt.bg + ", " : "") + "linear-gradient(to bottom, " + c0 + ", " + c1 + " 50%, " + c2 + ")",
                        transform: pre + "rotateX(" + ang + "deg) translateZ(" + r + "px)",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                    }}
                />
            )
        }
    }

    // Circular face in the YZ plane; facing +1 looks toward +x.
    const discFace = (key: string, x: number, r: number, facing: number, detail: "boss" | "plain" | "cap", col = metal) => {
        const lam = facing * L[0]
        const lift = clamp(0.5 + lam * 0.35, 0.15, 0.85)
        const hi = mix(col, "#fbfbf8", (0.55 + 0.4 * hl) * lift + 0.1)
        const mid = mix(col, "#ffffff", 0.18 * lift)
        const lo = mix(col, dark, 0.55 - 0.3 * lift)
        const from = (p.lighting.direction + 200).toFixed(1)
        const bg = steel
            ? "radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 55%, rgba(0,0,0,0.10) 100%), " +
              "repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.045) 0 0.8px, rgba(0,0,0,0.03) 0.8px 1.9px), " +
              "conic-gradient(from " + from + "deg, " + hi + " 0%, " + mid + " 7%, " + lo + " 19%, " + mid + " 31%, " + mix(hi, mid, 0.35) + " 44%, " + mid + " 52%, " + lo + " 67%, " + mid + " 84%, " + hi + " 100%)"
            : "radial-gradient(circle at 40% 35%, " + mix(col, "#ffffff", 0.12 * lift) + ", " + mix(col, dark, 0.25 - 0.15 * lift) + ")"
        const boss = r * 0.22
        out.push(
            <div
                key={key}
                aria-hidden
                style={{
                    position: "absolute",
                    left: x - r,
                    top: g.axisY - r,
                    width: r * 2,
                    height: r * 2,
                    borderRadius: "50%",
                    background: bg,
                    boxShadow:
                        "inset 0 0 0 1px rgba(0,0,0,0.30), inset 0 0 0 2.5px rgba(255,255,255," + (0.35 + 0.3 * lift).toFixed(2) + "), inset 0 0 0 4px rgba(0,0,0,0.10)",
                    transform: "rotateY(" + facing * 90 + "deg)",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                }}
            >
                {detail === "boss" && (
                    <div
                        style={{
                            position: "absolute",
                            left: r - boss / 2,
                            top: r - boss / 2,
                            width: boss,
                            height: boss,
                            borderRadius: "50%",
                            background: steel ? "conic-gradient(from " + from + "deg, " + hi + ", " + lo + " 25%, " + hi + " 50%, " + lo + " 75%, " + hi + ")" : mid,
                            boxShadow: "0 0 0 1px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.5)",
                        }}
                    />
                )}
            </div>
        )
    }

    const floorShadow = (key: string, cx: number, y: number, w: number, d: number, a: number, spread: number, z = 0) =>
        out.push(
            <div
                key={key}
                aria-hidden
                style={{
                    position: "absolute",
                    left: cx - w / 2,
                    top: y - d / 2,
                    width: w,
                    height: d,
                    background: "radial-gradient(closest-side, rgba(20,18,15," + (a * sh).toFixed(3) + "), rgba(20,18,15," + (a * sh * 0.45).toFixed(3) + ") " + spread * 50 + "%, rgba(20,18,15,0) 100%)",
                    transform: (z ? "translateZ(" + z.toFixed(2) + "px) " : "") + "rotateX(90deg)",
                }}
            />
        )

    const edgeLines = "linear-gradient(90deg, rgba(255,255,255,0.55) 0, rgba(255,255,255,0) 1.6px, rgba(0,0,0,0) calc(100% - 1.6px), rgba(255,255,255,0.5) 100%)"

    const mode = g.housing
    if (mode === "none") {
        floorShadow("fs", g.axisX, g.axisY + g.pb + 26, g.cw + 140, g.ch * 0.9, 0.3, 0.6)
        return out
    }

    // Spindle and the retaining clips over the notches
    cylX("rod", g.xL, g.xR - g.xL, g.rodR, 18, metal)
    const clipL = g.nw - 6
    g.notchX.forEach((nx, k) => {
        const cx = g.left + nx
        cylX("clip" + k, cx - clipL / 2, clipL, g.rodR + 3, 16, metal, { bg: edgeLines })
        discFace("clipA" + k, cx - clipL / 2, g.rodR + 3, -1, "plain")
        discFace("clipB" + k, cx + clipL / 2, g.rodR + 3, 1, "plain")
    })

    if (mode === "minimal") {
        const hr = g.rodR * 2.3
        cylX("hubL", g.xL - 8, 8, hr, 28, metal, { bg: edgeLines })
        cylX("hubR", g.xR, 8, hr, 28, metal, { bg: edgeLines })
        discFace("hubLf", g.xL - 8, hr, -1, "boss")
        discFace("hubRf", g.xR + 8, hr, 1, "boss")
        floorShadow("fs", g.axisX, g.axisY + Math.max(g.pb, hr) + 26, g.cw + 160, g.ch * 0.9, 0.3, 0.6)
        return out
    }

    // Full: bent steel frame, polished drums, knurled knob
    const R = g.R
    const T = g.T
    const fy = g.floorY
    const cL = g.xL - T / 2
    const cR = g.xR + T / 2
    const D = R * 1.15
    const strap = Math.max(7, R * 0.1)
    const legBot = R * 1.2
    const hh = fy - g.axisY
    const frameCol = steel ? metal : base

    floorShadow("fsw", (cL + cR) / 2, fy, cR - cL + 220, D + 170, 0.3, 0.45)
    floorShadow("fsc", (cL + cR) / 2, fy, cR - cL + legBot + 30, D + 40, 0.5, 0.7)
    ;[1, -1].forEach((zs) => floorShadow("fsr" + zs, (cL + cR) / 2, fy, cR - cL + legBot + strap * 4, strap * 3.6, 0.95, 0.5, zs * (D / 2 - strap / 2 - 1)))
    ;[cL - legBot / 2, cL + legBot / 2, cR - legBot / 2, cR + legBot / 2].forEach((x, k) => floorShadow("fse" + k, x, fy, strap * 3.6, D + strap * 3, 0.95, 0.5))
    ;[cL, cR].forEach((x, k) => floorShadow("fsd" + k, x, fy, T + R * 0.9, R * 1.1, 0.45, 0.4))

    const s2 = strap / 2
    // legs: an A-frame of bent tube under each drum, standing on the floor frame
    const legH = hh - s2
    const leg = (key: string, cx: number) => {
        const w = legBot + strap
        const tubeSvg =
            "<svg xmlns='http://www.w3.org/2000/svg' width='" + w.toFixed(1) + "' height='" + legH.toFixed(1) + "' viewBox='0 0 " + w.toFixed(1) + " " + legH.toFixed(1) + "'>" +
            "<path d='M " + (s2 + 0.5).toFixed(1) + " " + legH.toFixed(1) + " L " + (w / 2).toFixed(1) + " " + (s2 + 1).toFixed(1) + " L " + (w - s2 - 0.5).toFixed(1) + " " + legH.toFixed(1) +
            "' fill='none' stroke='#000' stroke-width='" + strap.toFixed(1) + "' stroke-linejoin='round'/></svg>"
        const m = 'url("data:image/svg+xml,' + encodeURIComponent(tubeSvg) + '")'
        // a tube seen side-on: bright core line, darker flanks
        const c0 = shadeAt(frameCol, 70)
        const c1 = shadeAt(frameCol, 30)
        const c2 = shadeAt(frameCol, 0)
        const c3 = shadeAt(frameCol, -40)
        const bg = steel
            ? "linear-gradient(90deg, " + c3 + ", " + c2 + " 22%, " + c0 + " 30%, " + c1 + " 40%, " + c2 + " 50%, " + c1 + " 60%, " + c0 + " 70%, " + c2 + " 78%, " + c3 + ")"
            : "linear-gradient(to bottom, " + mix(frameCol, "#ffffff", 0.1) + ", " + mix(frameCol, "#000000", 0.18) + ")"
        out.push(
            <div
                key={key}
                aria-hidden
                style={{
                    position: "absolute",
                    left: cx - w / 2,
                    top: g.axisY,
                    width: w,
                    height: legH,
                    background: bg,
                    WebkitMaskImage: m,
                    maskImage: m,
                    WebkitMaskSize: "100% 100%",
                    maskSize: "100% 100%",
                }}
            />
        )
    }
    leg("legL", cL)
    leg("legR", cR)
    // floor frame: a closed rectangle of tube, front and back rails plus the two ends
    ;[1, -1].forEach((zs) => cylX("rail" + zs, cL - legBot / 2, cR - cL + legBot, s2, 10, frameCol, { y: fy - s2, z: zs * (D / 2 - s2) }))
    ;[cL - legBot / 2, cL + legBot / 2, cR - legBot / 2, cR + legBot / 2].forEach((x, k) => cylX("end" + k, x - D / 2, D, s2, 10, frameCol, { y: fy - s2, alongZ: true }))
    ;[cL - legBot / 2, cR + legBot / 2].forEach((x, k) => cylX("foot" + k, x - s2, strap, s2 * 1.15, 10, mix(frameCol, dark, 0.5), { y: fy - s2, z: D / 2 - s2 }))

    // drums: polished rim band plus brushed faces
    cylX("rimL", g.xL - T, T, R, 48, metal, { bg: edgeLines })
    cylX("rimR", g.xR, T, R, 48, metal, { bg: edgeLines })
    discFace("dLo", g.xL - T, R, -1, "boss")
    discFace("dLi", g.xL, R, 1, "plain")
    discFace("dRi", g.xR, R, -1, "plain")
    discFace("dRo", g.xR + T, R, 1, g.showKnob ? "plain" : "boss")
    // collars where the spindle meets the drums
    cylX("flL", g.xL, 4, g.rodR * 1.9, 20, metal, { bg: edgeLines })
    cylX("flR", g.xR - 4, 4, g.rodR * 1.9, 20, metal, { bg: edgeLines })
    if (g.showKnob) {
        const kc = mix(metal, dark, 0.6)
        cylX("neck", g.xR + T, 4, g.knobR * 0.55, 16, metal)
        cylX("knob", g.xR + T + 4, g.knobL - 4, g.knobR, 36, kc, { knurl: steel })
        discFace("knobCap", g.xR + T + g.knobL, g.knobR, 1, "boss", mix(metal, dark, 0.2))
    }
    return out
}

/* ------------------------------------------------------------------ */
/* Placeholder cards                                                   */
/* ------------------------------------------------------------------ */

function PlaceholderCard({ i, n, cs }: { i: number; n: number; cs: CardOptions }) {
    const [name, cat, loc, year, mat] = PLACEHOLDERS[i]
    const hue = [28, 150, 200, 38, 14, 110, 215, 32, 345, 170, 20, 48][i % 12]
    const bx = 14 + ((i * 37) % 40)
    const bw = 30 + ((i * 23) % 28)
    const bh = 34 + ((i * 17) % 26)
    const label: React.CSSProperties = { fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.55 }
    return (
        <div
            style={{
                boxSizing: "border-box",
                width: "100%",
                height: "100%",
                background: cs.paperColor,
                color: cs.inkColor,
                padding: "14px 14px 34px",
                display: "flex",
                flexDirection: "column",
                fontFamily: SANS,
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    position: "relative",
                    flex: "0 0 57%",
                    borderRadius: Math.max(2, cs.radius - 7),
                    overflow: "hidden",
                    background: "linear-gradient(180deg, hsl(" + hue + ",22%,84%), hsl(" + hue + ",18%,72%))",
                }}
            >
                <div style={{ position: "absolute", left: "62%", top: "14%", width: 46, height: 46, borderRadius: "50%", background: "radial-gradient(circle, hsla(" + hue + ",60%,96%,0.9), hsla(" + hue + ",60%,96%,0) 70%)" }} />
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "24%", background: "linear-gradient(180deg, hsl(" + hue + ",14%,58%), hsl(" + hue + ",16%,46%))" }} />
                <div style={{ position: "absolute", left: bx + "%", bottom: "20%", width: bw + "%", height: bh + "%", background: "linear-gradient(180deg, hsl(" + hue + ",10%,40%), hsl(" + hue + ",12%,28%))" }} />
                <div style={{ position: "absolute", left: bx + bw - 6 + "%", bottom: "20%", width: "22%", height: bh * 0.62 + "%", background: "linear-gradient(180deg, hsl(" + hue + ",12%,90%), hsl(" + hue + ",10%,78%))" }} />
                <div style={{ position: "absolute", left: bx + 4 + "%", bottom: "28%", width: bw * 0.5 + "%", height: "6%", background: "hsla(" + hue + ",40%,85%,0.85)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, padding: "12px 4px 0", flex: 1, minHeight: 0 }}>
                <div style={{ minWidth: 0 }}>
                    <div style={label}>{cat}</div>
                    <h3 style={{ margin: "6px 0 0", fontFamily: SERIF, fontWeight: 400, fontSize: 32, lineHeight: 1, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{name}</h3>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ ...label, opacity: 0.7 }}>{pad2(i + 1) + " / " + pad2(n)}</div>
                    <div style={{ fontSize: 11.5, opacity: 0.62, marginTop: 5, fontStyle: "italic", fontFamily: SERIF }}>{loc + ", " + year}</div>
                </div>
            </div>
            <div
                data-framer-name="Back"
                data-rdx-display="flex"
                style={{ display: "none", flexDirection: "column", boxSizing: "border-box", padding: "24px 28px 38px", gap: 12, fontFamily: SANS, color: cs.inkColor }}
            >
                <div style={{ ...label, display: "flex", justifyContent: "space-between" }}>
                    <span>{"No. " + pad2(i + 1) + " — " + cat}</span>
                    <span>{loc + ", " + year}</span>
                </div>
                <div style={{ fontFamily: SERIF, fontSize: 34, lineHeight: 1, letterSpacing: "-0.01em", marginTop: 4 }}>{name}</div>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, opacity: 0.8, maxWidth: 400 }}>
                    {"A " + cat.toLowerCase() + " project in " + loc + ", built from " + mat.toLowerCase() + ". Connect a Collection List to show your own content here."}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 12, marginTop: 2 }}>
                    {[
                        ["Materials", mat],
                        ["Year", year],
                        ["Location", loc],
                    ].map(([k, v]) => (
                        <div key={k}>
                            <div style={label}>{k}</div>
                            <div style={{ fontSize: 12.5, marginTop: 4 }}>{v}</div>
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ display: "inline-flex", padding: "9px 16px", borderRadius: 999, background: cs.inkColor, color: cs.paperColor, fontSize: 12, letterSpacing: "0.04em" }}>
                        {"View project  →"}
                    </span>
                    <span style={{ ...label, opacity: 0.45 }}>Click to turn back</span>
                </div>
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/**
 * 3D Rolodex Carousel
 * A rotary card file for Framer CMS Collection Lists or individual cards.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 680
 */
export default function Rolodex(props: Partial<RolodexProps>) {
    const p = resolveProps(props)
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    // Static renderers (thumbnails, exports, static previews): lay the scene out once and stop.
    // In this mode no observers, animation frames, event listeners or audio are ever started.
    const isStatic = useIsStaticRenderer()
    const cards = (p.cards || []).filter(Boolean) as React.ReactNode[]
    const mode: Mode = cards.length === 0 ? "placeholder" : cards.length === 1 ? "list" : "slots"

    const rootRef = useRef<HTMLDivElement>(null)
    const hostRef = useRef<HTMLDivElement>(null)
    const overlayRef = useRef<HTMLDivElement>(null)
    const liveRef = useRef<HTMLSpanElement>(null)
    const measureRef = useRef<HTMLSpanElement>(null)
    const propsRef = useRef(p)
    propsRef.current = p
    const engine = useRef<any>(null)

    const [size, setSize] = useState({ w: 0, h: 0 })
    const [ring, setRing] = useState(false)
    // Build the heavy 3D scene only when the Rolodex is near the viewport. Instances further down
    // the page then cost nothing at load, and the one in view starts sooner.
    const [live, setLive] = useState(isCanvas || isStatic)

    useEffect(() => {
        if (live || isStatic) return
        const root = rootRef.current
        if (!root || typeof IntersectionObserver === "undefined") {
            setLive(true)
            return
        }
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setLive(true)
                    io.disconnect()
                }
            },
            { rootMargin: "600px 0px" }
        )
        io.observe(root)
        return () => io.disconnect()
    }, [live, isStatic])

    const g = computeGeo(p, size.w, size.h)
    const poolSize = g.behind + g.front + 3

    useLayoutEffect(() => {
        const root = rootRef.current
        const host = hostRef.current
        const overlay = overlayRef.current
        if (!live || !root || !host || !overlay) return

        const s: any = {
            items: [] as HTMLElement[],
            index: new Map<HTMLElement, number>(),
            info: [] as { label: string; first: boolean; group: number }[],
            tabX: [] as number[],
            tabW: [] as number[],
            jit: [] as number[][],
            pool: [] as any[],
            shown: new Set<number>(),
            backCache: new Map<number, HTMLElement>(),
            geo: null as Geo | null,
            light: [0, -0.75, 0.66],
            pos: 0,
            target: 0,
            vel: 0,
            mode: "idle",
            tween: null as any,
            raf: 0,
            last: 0,
            dragging: false,
            justDragged: false,
            hoverFront: false,
            lift: 0,
            leanX: 0,
            leanY: 0,
            tLeanX: 0,
            tLeanY: 0,
            flip: 0,
            flipTarget: 0,
            flipIdx: -1,
            front: -1,
            interacted: false,
            started: false,
            reduced: typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
            wheelAcc: 0,
            wheelLast: 0,
            wheelTimer: 0 as any,
            track: null as HTMLElement | null,
            scrollIdx: -1,
            scrollRaf: 0,
            lastTick: 0,
        }

        const n = () => s.items.length
        const loopOn = () => propsRef.current.loop && n() > 1
        const frontOf = (pos: number) => {
            const N = n()
            const k = Math.round(pos)
            return loopOn() ? mod(k, N) : clamp(k, 0, N - 1)
        }

        const showEl = (el: HTMLElement) => {
            el.style.display = el.dataset.rdxDisp || ""
        }
        const hideEl = (el: HTMLElement) => {
            el.style.display = "none"
        }

        const prepare = () => {
            const q = propsRef.current
            const W = root.offsetWidth
            const H = root.offsetHeight
            const gg = computeGeo(q, W, H)
            s.geo = gg
            s.light = lightVec(q.lighting.direction)
            const mask = cardMask(gg.cw, gg.ch, q.cardStyle.radius, q.cardStyle.notches, gg.notchX, gg.nw, gg.nh)
            for (const slot of Array.from(host.children) as HTMLElement[]) asLayer(slot)
            const items = collect(host, mode)
            s.items = items
            s.index = new Map()
            items.forEach((el, i) => {
                s.index.set(el, i)
                const st = el.style
                if (el.dataset.rdxDisp === undefined) el.dataset.rdxDisp = st.display || ""
                st.display = el.dataset.rdxDisp
                st.position = "absolute"
                st.left = gg.left + "px"
                st.top = gg.top + "px"
                st.width = gg.cw + "px"
                st.height = gg.ch + "px"
                st.margin = "0px"
                st.transformOrigin = "50% " + gg.pivot + "px"
                st.backfaceVisibility = "hidden"
                ;(st as any).webkitBackfaceVisibility = "hidden"
                st.pointerEvents = "auto"
                st.maskImage = mask
                ;(st as any).webkitMaskImage = mask
                st.maskSize = "100% 100%"
                ;(st as any).webkitMaskSize = "100% 100%"
                st.maskRepeat = "no-repeat"
                ;(st as any).webkitMaskRepeat = "no-repeat"
                st.willChange = isCanvas || isStatic ? "" : "transform"
                st.touchAction = gg.compact ? "none" : ""
                el.setAttribute("draggable", "false")
                const back = findBack(el)
                if (back) {
                    if (back.dataset.rdxDisp === undefined) back.dataset.rdxDisp = back.dataset.rdxDisplay || back.style.display || ""
                    back.style.display = "none"
                }
            })
            s.shown = new Set(items.map((_, i) => i))

            // labels + tab geometry (measured once here, never per frame)
            const labels = items.map((el, i) => readLabel(el, q.tabs, i))
            let group = -1
            s.info = labels.map((label, i) => {
                const first = q.tabs !== "off" && !!label && (q.tabs === "number" || i === 0 || label !== labels[i - 1])
                if (first) group++
                return { label, first, group: Math.max(0, group) }
            })
            const ts = q.tabStyle
            const meas = measureRef.current
            const wCache = new Map<string, number>()
            s.tabW = labels.map((l) => {
                if (!l || !meas) return ts.width
                let w = wCache.get(l)
                if (w === undefined) {
                    meas.textContent = l
                    w = Math.max(ts.width, Math.ceil(meas.offsetWidth) + 18)
                    wCache.set(l, w)
                }
                return w
            })
            const maxW = s.tabW.length ? Math.max(ts.width, ...s.tabW) : ts.width
            const slots = clamp(Math.floor((gg.cw - 20 + 4) / (maxW + 4)), 1, 26)
            s.tabX = s.info.map((c: any, i: number) => {
                const w = s.tabW[i]
                if (q.tabAlign === "right") return gg.cw - 10 - w
                if (q.tabAlign === "center") return (gg.cw - w) / 2
                if (q.tabAlign === "left") return 10
                return 10 + (c.group % slots) * ((gg.cw - 20 - maxW) / Math.max(1, slots - 1)) + (maxW - w) / 2
            })
            s.jit = items.map((_, i) => [0, 1, 2].map((salt) => {
                const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453
                return (x - Math.floor(x)) * 2 - 1
            }))

            // pooled overlay units (virtualised: only the visible window uses them)
            s.pool = (Array.from(overlay.children) as HTMLElement[]).map((el) => ({
                el,
                back: el.querySelector('[data-part="back"]') as HTMLElement,
                content: el.querySelector('[data-part="content"]') as HTMLElement,
                front: el.querySelector('[data-part="front"]') as HTMLElement,
                shade: el.querySelector('[data-part="shade"]') as HTMLElement,
                ao: el.querySelector('[data-part="ao"]') as HTMLElement,
                gloss: el.querySelector('[data-part="gloss"]') as HTMLElement,
                tab: el.querySelector('[data-part="tab"]') as HTMLElement,
                k: NaN,
                tabKey: "",
                vis: false,
            }))
            s.backCache = new Map()

            if (!s.started) {
                s.started = true
                const N = items.length
                const start = N ? clamp(Math.round(q.startIndex), 0, N - 1) : 0
                s.pos = s.target = start
            }
            const N = items.length
            if (N && !loopOn()) {
                s.pos = clamp(s.pos, 0, N - 1)
                s.target = clamp(s.target, 0, N - 1)
            }

            s.track = null
            if (q.interaction.scroll === "page") {
                let el = root.parentElement
                while (el && el !== document.body) {
                    const pos = getComputedStyle(el).position
                    if (pos === "sticky" || pos === "-webkit-sticky") {
                        s.track = el.parentElement
                        break
                    }
                    el = el.parentElement
                }
            }
        }

        const backFor = (i: number): HTMLElement => {
            let node = s.backCache.get(i)
            if (node) return node
            const q = propsRef.current
            const el = s.items[i] as HTMLElement
            const layer = q.cardStyle.back === "auto" ? findBack(el) : null
            if (layer) {
                node = layer.cloneNode(true) as HTMLElement
                const st = node.style
                st.display = layer.dataset.rdxDisp || ""
                st.position = "absolute"
                st.left = "0px"
                st.top = "0px"
                st.width = "100%"
                st.height = "100%"
                st.margin = "0px"
                st.transform = "none"
                node.removeAttribute("data-rdx-disp")
            } else node = generatedBack(el, i, n(), q)
            s.backCache.set(i, node)
            return node
        }

        const updateTab = (u: any, i: number, front: number) => {
            const q = propsRef.current
            const inf = s.info[i]
            const show = !!inf && !!inf.label && q.tabs !== "off" && (inf.first || i === front)
            const on = i === front
            const key = (show ? "1" : "0") + (on ? "1" : "0") + i
            if (u.tabKey === key || !u.tab) return
            u.tabKey = key
            const t = u.tab as HTMLElement
            t.style.display = show ? "flex" : "none"
            if (!show) return
            const ts = q.tabStyle
            t.textContent = inf.label
            t.dataset.index = String(i)
            t.style.left = s.tabX[i] + "px"
            t.style.width = s.tabW[i] + "px"
            t.style.background = on ? ts.activeFill : ts.fill
            t.style.color = on ? ts.activeColor : ts.color
            const th = ts.height + (on ? 6 : 0)
            t.style.height = th + "px"
            t.style.top = -th + 1 + "px"
        }

        const announce = (i: number) => {
            const q = propsRef.current
            if (liveRef.current) {
                const h = firstHeading(s.items[i])
                const name = ((h && h.textContent) || "").trim()
                liveRef.current.textContent = (name ? name + ", " : "") + "card " + (i + 1) + " of " + n()
            }
            if (q.onChange) q.onChange(i)
        }

        const layout = () => {
            const q = propsRef.current
            const gg: Geo | null = s.geo
            const N = n()
            if (!N || !gg) return
            const loop = loopOn()
            const F = Math.min(gg.front, N - 1)
            const B = loop ? Math.max(0, Math.min(gg.behind, N - F - 2)) : gg.behind
            let kMin = Math.ceil(s.pos - F - 1 + 1e-4)
            let kMax = Math.floor(s.pos + B + 1 - 1e-4)
            if (!loop) {
                kMin = Math.max(0, kMin)
                kMax = Math.min(N - 1, kMax)
            }
            const P = s.pool.length
            if (kMax - kMin + 1 > P) kMax = kMin + P - 1
            const frontK = loop ? Math.round(s.pos) : clamp(Math.round(s.pos), 0, N - 1)
            const frontIdx = frontOf(s.pos)
            const speed = clamp(Math.abs(s.vel) / 6, 0, 1)
            const Lv = s.light
            const lam0 = Lv[2]
            const sh = clamp(q.lighting.shadows, 0, 1)
            const hl = clamp(q.lighting.highlights, 0, 1)
            const flutter = s.reduced ? 0 : clamp(q.motion.flutter, 0, 1)
            const hover = clamp(q.motion.hoverLift, 0, 1)
            const flipE = ease3(clamp(s.flip, 0, 1))
            const used = new Set<number>()
            const shown = new Set<number>()

            for (let k = kMin; k <= kMax; k++) {
                const i = loop ? mod(k, N) : k
                if (shown.has(i)) continue
                shown.add(i)
                const el = s.items[i] as HTMLElement
                if (!s.shown.has(i)) showEl(el)
                const d = k - s.pos
                const a = Math.abs(d)
                const m = Math.min(1, a)
                const jt = s.jit[i] || [0, 0, 0]
                let rx: number
                let ry = 0
                let sc = 1
                let tx = jt[1] * 1.2 * m
                let ty = jt[2] * 1.0 * m
                let tz = 0
                const rz = jt[0] * 0.35 * m
                if (d >= 0) {
                    const r = Math.max(0, d - 1)
                    rx = gg.fan * smooth(m) + gg.spacing * (r - 0.018 * r * r)
                    sc = 1 - gg.depth * 0.014 * Math.min(d, 14)
                    if (d < 1) rx += flutter * 3 * Math.sin(Math.PI * d) * speed
                } else {
                    const e = 1 - (1 - m) * (1 - m)
                    rx = -(gg.fall * e + gg.spacing * 0.5 * Math.max(0, a - 1))
                    if (a < 1) rx -= flutter * 8 * Math.sin(Math.PI * a) * speed
                }
                const isFront = k === frontK
                if (isFront) {
                    // hover: tip the card toward the viewer around the spindle only, so the notches stay on the rod
                    const lift = s.lift * hover
                    rx -= (6 - 2.5 * s.leanY) * lift
                }
                if (i === s.flipIdx && s.flip > 0) {
                    const up = smooth(s.flip * 2.2)
                    const turn = ease3(clamp((s.flip - 0.18) / 0.82, 0, 1))
                    ty -= (gg.nh + 12) * up
                    tz += 44 * up + 26 * Math.sin(Math.PI * turn)
                    rx -= rx * up
                    ry += 180 * turn
                }
                let op = 1
                if (d > B) op = clamp(B + 1 - d, 0, 1)
                if (d < -F) op = clamp(F + 1 + d, 0, 1)

                const tf =
                    "translate3d(" + tx.toFixed(2) + "px," + ty.toFixed(2) + "px," + tz.toFixed(2) + "px) rotateX(" + rx.toFixed(3) + "deg) rotateY(" +
                    ry.toFixed(3) + "deg) rotateZ(" + rz.toFixed(3) + "deg) scale(" + sc.toFixed(4) + ")"
                const st = el.style
                const vis = op > 0.002
                st.visibility = vis ? "visible" : "hidden"
                st.transform = tf
                st.opacity = op < 0.999 ? op.toFixed(3) : ""
                const flippedFront = i === s.flipIdx && s.flip > 0.5
                if ((el as any).inert !== flippedFront) (el as any).inert = flippedFront

                // lighting: lambert term relative to an upright card
                const ar = (rx * Math.PI) / 180
                const lam = -Math.sin(ar) * Lv[1] + Math.cos(ar) * Lv[2]
                const shadeOp = sh * clamp((lam0 - lam) * 1.3 + 0.03 * Math.max(0, d) + (d < 0 ? 0.18 * m : 0), 0, 0.75)
                let aoOp = d > 0.02 ? sh * smooth(d) * (0.85 - 0.035 * Math.min(d, 12)) : 0
                if (d > 0.3 && d < 1.7) aoOp += sh * 0.3 * s.lift * hover * (1 - Math.abs(d - 1))
                const glossOp = hl * clamp(0.55 + (lam - lam0) * 2.2, 0, 1)

                const u = s.pool[mod(k, P)]
                if (u) {
                    used.add(mod(k, P))
                    if (u.k !== k || u.i !== i) {
                        u.k = k
                        u.i = i
                        u.el.dataset.index = String(i)
                        u.tabKey = ""
                        if (u.content) {
                            const node = backFor(i)
                            if (u.content.firstChild !== node) u.content.replaceChildren(node)
                        }
                    }
                    const us = u.el.style
                    us.visibility = vis ? "visible" : "hidden"
                    us.transform = tf
                    us.opacity = st.opacity
                    if (u.shade) u.shade.style.opacity = shadeOp.toFixed(3)
                    if (u.ao) u.ao.style.opacity = aoOp.toFixed(3)
                    if (u.gloss) u.gloss.style.opacity = glossOp.toFixed(3)
                    const backLive = flippedFront
                    if (u.back) u.back.style.pointerEvents = backLive ? "auto" : "none"
                    if (u.content && (u.content as any).inert === backLive) (u.content as any).inert = !backLive
                    if (u.el.getAttribute("aria-hidden") !== (backLive ? "false" : "true")) u.el.setAttribute("aria-hidden", backLive ? "false" : "true")
                    updateTab(u, i, frontIdx)
                }
            }
            s.shown.forEach((i: number) => {
                if (!shown.has(i) && s.items[i]) hideEl(s.items[i])
            })
            s.shown = shown
            s.pool.forEach((u: any, idx: number) => {
                if (!used.has(idx) && u.el.style.visibility !== "hidden") u.el.style.visibility = "hidden"
            })

            if (frontIdx !== s.front) {
                const prev = s.front
                s.front = frontIdx
                if (s.flipTarget === 1 && s.flipIdx !== frontIdx) setFlip(false)
                if (s.interacted && prev !== -1) announce(frontIdx)
            }
        }

        const frame = (t: number) => {
            s.raf = 0
            const q = propsRef.current
            const dt = s.last ? Math.min(0.05, (t - s.last) / 1000) : 1 / 60
            s.last = t
            let busy = false
            const prevPos = s.pos
            if (s.mode === "spring") {
                if (s.reduced) {
                    s.pos = s.target
                    s.vel = 0
                    s.mode = "idle"
                } else {
                    const sp = clamp(q.motion.speed, 0.3, 3)
                    const snapK = 0.45 + clamp(q.interaction.snap, 0, 1) * 1.1
                    const w = 2 * Math.PI * 1.9 * sp * snapK
                    const detent = clamp(q.motion.detent, 0, 1)
                    const zeta = 1 - detent * 0.3
                    const steps = Math.max(1, Math.ceil(dt / 0.008))
                    const h = dt / steps
                    for (let k = 0; k < steps; k++) {
                        const x = s.pos - s.target
                        let acc = -w * w * x - 2 * zeta * w * s.vel
                        // ratchet: each card position is a shallow well the stack passes through
                        if (Math.abs(x) > 0.55) acc -= detent * w * w * 0.05 * Math.sin(2 * Math.PI * s.pos)
                        s.vel += acc * h
                        s.pos += s.vel * h
                    }
                    if (Math.abs(s.pos - s.target) < 0.0006 && Math.abs(s.vel) < 0.004) {
                        s.pos = s.target
                        s.vel = 0
                        s.mode = "idle"
                    } else busy = true
                }
            } else if (s.mode === "tween") {
                const tw = s.tween
                const pr = s.reduced ? 1 : clamp((t - tw.t0) / (tw.dur * 1000), 0, 1)
                const np = tw.from + (tw.to - tw.from) * ease3(pr)
                s.vel = (np - s.pos) / dt
                s.pos = np
                if (pr >= 1) {
                    s.pos = tw.to
                    s.target = tw.to
                    s.vel = Math.sign(tw.to - tw.from) * 0.9 * clamp(q.motion.detent, 0, 1)
                    s.mode = s.reduced ? "idle" : "spring"
                }
                busy = true
            } else if (s.mode === "drag") busy = true

            if (q.sound.detent && !isStatic && !s.reduced && Math.round(prevPos) !== Math.round(s.pos) && t - s.lastTick > 28) {
                s.lastTick = t
                playTick(clamp(q.sound.volume, 0, 1))
            }

            if (s.flip !== s.flipTarget) {
                const step = s.reduced ? 1 : dt / Math.max(0.15, q.motion.flipSpeed)
                s.flip = s.flipTarget > s.flip ? Math.min(s.flipTarget, s.flip + step) : Math.max(s.flipTarget, s.flip - step)
                busy = true
            } else if (s.flip === 0 && s.flipIdx !== -1 && s.flipTarget === 0) s.flipIdx = -1

            const near = Math.abs(s.pos - Math.round(s.pos)) < 0.2
            const want = !s.reduced && s.hoverFront && !s.dragging && near ? 1 : 0
            const kx = Math.min(1, dt * 12)
            s.lift += (want - s.lift) * kx
            s.leanX += (s.tLeanX * want - s.leanX) * kx
            s.leanY += (s.tLeanY * want - s.leanY) * kx
            if (Math.abs(s.lift - want) > 0.002 || Math.abs(s.leanX - s.tLeanX * want) > 0.002 || Math.abs(s.leanY - s.tLeanY * want) > 0.002) busy = true
            else {
                s.lift = want
                s.leanX = s.tLeanX * want
                s.leanY = s.tLeanY * want
            }
            layout()
            if (busy) kick()
            else s.last = 0
        }

        const kick = () => {
            if (isCanvas || isStatic) {
                layout()
                return
            }
            if (!s.raf) s.raf = requestAnimationFrame(frame)
        }

        const setFlip = (open: boolean) => {
            const q = propsRef.current
            if (open && (!q.interaction.flip || !n())) return
            const target = open ? 1 : 0
            if (s.flipTarget === target) return
            if (open) s.flipIdx = frontOf(s.pos)
            s.flipTarget = target
            if (q.sound.flip && !isStatic) playSwish(clamp(q.sound.volume, 0, 1))
            if (q.onFlip) q.onFlip(open)
            kick()
        }

        const nearestK = (i: number) => {
            const N = n()
            const cur = Math.round(s.mode === "tween" ? s.tween.to : s.mode === "idle" ? s.pos : s.target)
            if (!loopOn()) return clamp(i, 0, N - 1)
            let diff = i - mod(cur, N)
            if (diff > N / 2) diff -= N
            if (diff < -N / 2) diff += N
            return cur + diff
        }

        const goTo = (i: number) => {
            const q = propsRef.current
            if (!n()) return
            s.interacted = true
            setFlip(false)
            const k = nearestK(i)
            const dist = Math.abs(k - s.pos)
            if (dist > 2.5 && !s.reduced) {
                s.mode = "tween"
                s.tween = { from: s.pos, to: k, t0: performance.now(), dur: clamp((0.2 + 0.05 * dist) / clamp(q.motion.riffleSpeed, 0.25, 4), 0.18, 1.6) }
            } else s.mode = "spring"
            s.target = k
            kick()
        }

        const stepBy = (dir: number) => {
            const N = n()
            if (!N) return
            s.interacted = true
            setFlip(false)
            let t = Math.round(s.mode === "tween" ? s.tween.to : s.mode === "idle" ? s.pos : s.target) + dir
            if (!loopOn()) t = clamp(t, 0, N - 1)
            s.target = t
            s.mode = "spring"
            kick()
        }

        const syncScroll = (instant: boolean) => {
            const q = propsRef.current
            const N = n()
            if (q.interaction.scroll !== "page" || !N) return
            const vh = window.innerHeight || 1
            let prog = -1
            if (s.track) {
                // pinned layout: progress through the tall section that contains the sticky frame
                const r = s.track.getBoundingClientRect()
                const total = r.height - vh
                if (total > vh * 0.2) prog = clamp(-r.top / total, 0, 1)
            }
            if (prog < 0) {
                // unpinned: progress while the component travels through the viewport
                const r = root.getBoundingClientRect()
                prog = clamp((vh * 0.85 - r.top) / (vh * 0.7 + r.height * 0.6), 0, 1)
            }
            const idx = Math.round(prog * (N - 1))
            if (idx === s.scrollIdx) return
            s.scrollIdx = idx
            if (instant) {
                s.pos = s.target = idx
                s.vel = 0
                s.mode = "idle"
                layout()
                return
            }
            s.interacted = true
            setFlip(false)
            s.target = idx
            if (s.mode !== "drag") s.mode = "spring"
            kick()
        }

        engine.current = {
            goTo,
            stepBy,
            setFlip,
            refresh: () => {
                if (isStatic) measure()
                prepare()
                layout()
                if (!isStatic) syncScroll(true)
            },
        }

        const measure = () => {
            const w = root.offsetWidth
            const h = root.offsetHeight
            setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }))
        }

        measure()
        prepare()
        layout()

        if (isStatic) {
            // Static fallback: one layout pass only. Prop and size changes arrive through the
            // refresh effect below, which re-measures without any observer.
            return () => {
                engine.current = null
            }
        }

        const ro = new ResizeObserver(() => {
            measure()
            prepare()
            layout()
        })
        ro.observe(root)

        let moRaf = 0
        const mo = new MutationObserver(() => {
            if (moRaf) return
            moRaf = requestAnimationFrame(() => {
                moRaf = 0
                prepare()
                layout()
            })
        })
        mo.observe(host, { childList: true, subtree: true })

        if (isCanvas) {
            return () => {
                ro.disconnect()
                mo.disconnect()
                if (moRaf) cancelAnimationFrame(moRaf)
            }
        }

        syncScroll(true)

        /* ---------------- interaction ---------------- */
        let startX = 0
        let startY = 0
        let startPos = 0
        let axis: "" | "x" | "y" = ""
        let pointerType = ""
        let lastT = 0
        let tracking = false
        let startOnCard = false

        const itemIndexOf = (target: EventTarget | null) => {
            let el = target as HTMLElement | null
            while (el && el !== root) {
                const k = s.index.get(el)
                if (k !== undefined) return k
                el = el.parentElement
            }
            return -1
        }

        const onDown = (e: PointerEvent) => {
            const q = propsRef.current
            if (q.interaction.keyboard && document.activeElement !== root && !root.contains(document.activeElement)) {
                root.dataset.rdxPointer = "1"
                root.focus({ preventScroll: true })
                delete root.dataset.rdxPointer
            }
            if (!q.interaction.drag || e.button !== 0 || !n()) return
            tracking = true
            axis = ""
            pointerType = e.pointerType
            startX = e.clientX
            startY = e.clientY
            startPos = s.pos
            lastT = performance.now()
            startOnCard = itemIndexOf(e.target) !== -1
            window.addEventListener("pointermove", onMove)
            window.addEventListener("pointerup", onUp)
            window.addEventListener("pointercancel", onUp)
        }

        const onMove = (e: PointerEvent) => {
            if (!tracking) return
            const q = propsRef.current
            const gg: Geo = s.geo
            const dx = e.clientX - startX
            const dy = e.clientY - startY
            if (!axis) {
                if (Math.hypot(dx, dy) < 6) return
                axis = Math.abs(dy) >= Math.abs(dx) ? "y" : "x"
                if (axis === "y" && pointerType === "touch" && !(gg && gg.compact && startOnCard)) {
                    onUp()
                    return
                }
                s.dragging = true
                s.mode = "drag"
                s.interacted = true
                s.vel = 0
                setFlip(false)
                root.style.userSelect = "none"
                ;(root.style as any).webkitUserSelect = "none"
                const sel = window.getSelection && window.getSelection()
                if (sel && sel.removeAllRanges) sel.removeAllRanges()
            }
            const delta = axis === "y" ? dy : -dx
            const sc = gg ? gg.s : 1
            let pos = startPos + delta / Math.max(10, q.interaction.dragDistance * sc)
            const N = n()
            if (!loopOn()) {
                if (pos < 0) pos = pos * 0.35
                if (pos > N - 1) pos = N - 1 + (pos - (N - 1)) * 0.35
            }
            const now = performance.now()
            const dtm = Math.max(1, now - lastT) / 1000
            const v = (pos - s.pos) / dtm
            s.vel = s.vel * 0.6 + v * 0.4
            lastT = now
            s.pos = pos
            kick()
        }

        const onUp = () => {
            const q = propsRef.current
            tracking = false
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerup", onUp)
            window.removeEventListener("pointercancel", onUp)
            if (s.dragging) {
                s.dragging = false
                s.justDragged = true
                setTimeout(() => (s.justDragged = false), 60)
                root.style.userSelect = ""
                ;(root.style as any).webkitUserSelect = ""
                // momentum: project where the stack would coast to, then settle into that detent
                if (performance.now() - lastT > 90) s.vel = 0
                const mom = clamp(q.interaction.momentum, 0, 1)
                const reach = 1 + mom * 6
                const N = n()
                let t = Math.round(s.pos + clamp(s.vel * (0.06 + mom * 0.24), -reach, reach))
                if (!loopOn()) t = clamp(t, 0, N - 1)
                s.target = t
                s.mode = "spring"
                kick()
            }
        }

        const onClick = (e: MouseEvent) => {
            const q = propsRef.current
            if (s.justDragged) {
                e.preventDefault()
                e.stopPropagation()
                return
            }
            const target = e.target as HTMLElement
            if (!target || !target.closest) return
            const tabEl = target.closest("[data-rdx-tab]") as HTMLElement | null
            if (tabEl && root.contains(tabEl)) {
                e.preventDefault()
                e.stopPropagation()
                goTo(Number(tabEl.dataset.index || 0))
                return
            }
            const backEl = target.closest('[data-part="back"]')
            if (backEl && root.contains(backEl)) {
                if (target.closest("a")) return
                e.preventDefault()
                e.stopPropagation()
                setFlip(false)
                return
            }
            const k = itemIndexOf(target)
            if (k === -1) return
            if (k !== frontOf(s.pos)) {
                if (!q.interaction.clickCards) return
                e.preventDefault()
                e.stopPropagation()
                goTo(k)
                return
            }
            if (!q.interaction.flip) return
            const card = s.items[k] as HTMLElement
            const a = target.closest("a")
            if (a && a !== card && card.contains(a)) return // inner CMS link: let it navigate
            e.preventDefault()
            e.stopPropagation()
            s.interacted = true
            setFlip(s.flipTarget !== 1)
        }

        const onWheel = (e: WheelEvent) => {
            const q = propsRef.current
            if (q.interaction.scroll !== "wheel" || !n()) return
            const N = n()
            const dy = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX
            if (!dy) return
            if (!loopOn()) {
                const r = Math.round(s.target)
                if ((dy < 0 && r <= 0) || (dy > 0 && r >= N - 1)) return // let the page scroll past the ends
            }
            e.preventDefault()
            const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? 800 : 1
            if (Math.sign(dy) !== Math.sign(s.wheelAcc)) s.wheelAcc = 0
            s.wheelAcc += dy * unit
            const now = performance.now()
            clearTimeout(s.wheelTimer)
            s.wheelTimer = setTimeout(() => (s.wheelAcc = 0), 180)
            if (Math.abs(s.wheelAcc) >= 48 && now - s.wheelLast > 110) {
                s.wheelLast = now
                stepBy(Math.sign(s.wheelAcc))
                s.wheelAcc = 0
            }
        }

        const onKey = (e: KeyboardEvent) => {
            const q = propsRef.current
            if (!q.interaction.keyboard) return
            const tg = e.target as HTMLElement
            if (tg && tg !== root && (tg.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName))) return
            const k = e.key
            if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown") {
                e.preventDefault()
                stepBy(1)
            } else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp") {
                e.preventDefault()
                stepBy(-1)
            } else if (k === "Home") {
                e.preventDefault()
                goTo(0)
            } else if (k === "End") {
                e.preventDefault()
                goTo(n() - 1)
            } else if (k === "Enter" && tg === root) {
                e.preventDefault()
                s.interacted = true
                setFlip(s.flipTarget !== 1)
            } else if (k === "Escape" && s.flipTarget === 1) {
                e.preventDefault()
                setFlip(false)
            }
        }

        const onPointerMove = (e: PointerEvent) => {
            if (e.pointerType === "touch" || s.dragging) return
            const gg: Geo = s.geo
            if (!gg) return
            const target = e.target as HTMLElement
            const k = itemIndexOf(target)
            const onBack = !!(target && target.closest && target.closest('[data-part="back"]'))
            const over = k === frontOf(s.pos) || onBack
            if (over) {
                const r = root.getBoundingClientRect()
                const cx = r.left + gg.axisX
                const cy = r.top + gg.axisY + gg.s * (gg.ch / 2 - gg.pivot)
                s.tLeanX = clamp((e.clientX - cx) / ((gg.s * gg.cw) / 2), -1, 1)
                s.tLeanY = clamp((e.clientY - cy) / ((gg.s * gg.ch) / 2), -1, 1)
            }
            if (over !== s.hoverFront || over) {
                s.hoverFront = over
                kick()
            }
        }
        const onLeave = () => {
            s.hoverFront = false
            kick()
        }
        const onFocusIn = (e: FocusEvent) => {
            const k = itemIndexOf(e.target)
            if (k !== -1 && k !== frontOf(s.pos)) goTo(k)
        }
        const onDragStart = (e: DragEvent) => e.preventDefault()
        const onScroll = () => {
            if (s.scrollRaf) return
            s.scrollRaf = requestAnimationFrame(() => {
                s.scrollRaf = 0
                syncScroll(false)
            })
        }

        root.addEventListener("pointerdown", onDown)
        root.addEventListener("click", onClick, true)
        root.addEventListener("wheel", onWheel, { passive: false })
        root.addEventListener("keydown", onKey)
        root.addEventListener("pointermove", onPointerMove)
        root.addEventListener("pointerleave", onLeave)
        root.addEventListener("focusin", onFocusIn)
        root.addEventListener("dragstart", onDragStart)
        window.addEventListener("scroll", onScroll, { passive: true, capture: true })

        return () => {
            ro.disconnect()
            mo.disconnect()
            if (moRaf) cancelAnimationFrame(moRaf)
            if (s.raf) cancelAnimationFrame(s.raf)
            if (s.scrollRaf) cancelAnimationFrame(s.scrollRaf)
            clearTimeout(s.wheelTimer)
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerup", onUp)
            window.removeEventListener("pointercancel", onUp)
            window.removeEventListener("scroll", onScroll, true)
            root.removeEventListener("pointerdown", onDown)
            root.removeEventListener("click", onClick, true)
            root.removeEventListener("wheel", onWheel)
            root.removeEventListener("keydown", onKey)
            root.removeEventListener("pointermove", onPointerMove)
            root.removeEventListener("pointerleave", onLeave)
            root.removeEventListener("focusin", onFocusIn)
            root.removeEventListener("dragstart", onDragStart)
            engine.current = null
        }
    }, [mode, cards.length, isCanvas, isStatic, live])

    // Props or size changed: re-measure the cards and redraw (never runs during a drag).
    useEffect(() => {
        if (engine.current) engine.current.refresh()
    })

    const ts = p.tabStyle
    const cs = p.cardStyle
    const cw = g.cw
    const ch = g.ch
    const t = clamp(cs.thickness, 0, 6)
    const r = clamp(cs.radius, 0, Math.min(cw, ch) / 2)
    const mask = cardMask(cw, ch, cs.radius, cs.notches, g.notchX, g.nw, g.nh)
    const origin = "50% " + g.pivot + "px"
    const dir = clamp(p.lighting.direction, -90, 90)
    const maskStyle: React.CSSProperties = { maskImage: mask, WebkitMaskImage: mask, maskSize: "100% 100%", WebkitMaskSize: "100% 100%", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat" } as any
    const texOp = clamp(cs.texture, 0, 1) * 0.55

    const onFocus = (e: React.FocusEvent<HTMLDivElement>) => {
        if (e.target !== e.currentTarget) return
        if (e.currentTarget.dataset.rdxPointer) {
            setRing(false)
            return
        }
        let fv = false
        try {
            fv = e.currentTarget.matches(":focus-visible")
        } catch (_) {}
        setRing(fv)
    }

    return (
        <div
            ref={rootRef}
            tabIndex={p.interaction.keyboard && !isStatic ? 0 : -1}
            role="region"
            aria-roledescription="rolodex"
            aria-label={p.ariaLabel}
            aria-keyshortcuts="ArrowLeft ArrowRight Enter Escape"
            onFocus={onFocus}
            onBlur={() => setRing(false)}
            style={{
                width: 1000,
                height: 680,
                ...p.style,
                position: "relative",
                overflow: "visible",
                // The server render has no measured size, so its geometry is wrong. Stay invisible
                // until the first measurement, then fade in; otherwise a cached reload shows a jump.
                opacity: size.w > 0 && size.h > 0 ? 1 : 0,
                transition: isStatic ? "none" : "opacity 0.35s ease",
                perspective: g.perspective + "px",
                perspectiveOrigin: g.axisX + "px " + (g.axisY + g.s * (ch / 2 - g.pivot)) + "px",
                touchAction: "pan-y",
                cursor: p.interaction.drag && !isStatic ? "grab" : "default",
                outline: "none",
                boxShadow: ring ? "inset 0 0 0 2px rgba(255,255,255,0.9), inset 0 0 0 4px rgba(0,0,0,0.55)" : "none",
                borderRadius: 4,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    transformStyle: "preserve-3d",
                    transformOrigin: g.axisX + "px " + g.axisY + "px",
                    transform: "scale(" + g.s.toFixed(4) + ") rotateX(" + -g.tilt + "deg) rotateY(" + g.yaw + "deg)",
                    pointerEvents: "none",
                }}
            >
                {g.W > 0 && renderHousing(g, p)}
                <div ref={hostRef} style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", pointerEvents: "none" }}>
                    {mode === "placeholder"
                        ? PLACEHOLDERS.map((_, i) => (
                              <div key={i} data-rdx-card="">
                                  <PlaceholderCard i={i} n={PLACEHOLDERS.length} cs={cs} />
                              </div>
                          ))
                        : cards.map((c, i) => (
                              <div key={i} data-rolodex-slot="">
                                  {c}
                              </div>
                          ))}
                </div>
                <div ref={overlayRef} style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", pointerEvents: "none" }}>
                    {live && Array.from({ length: poolSize }, (_, u) => (
                        <div
                            key={u}
                            data-rdx-unit=""
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: g.left,
                                top: g.top,
                                width: cw,
                                height: ch,
                                transformOrigin: origin,
                                transformStyle: "preserve-3d",
                                visibility: "hidden",
                                pointerEvents: "none",
                            }}
                        >
                            <div
                                data-part="back"
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: cs.backColor,
                                    color: cs.inkColor,
                                    overflow: "hidden",
                                    ...maskStyle,
                                    transform: "translateZ(" + (t > 0 ? -t : -0.01) + "px) rotateY(180deg)",
                                    backfaceVisibility: "hidden",
                                    WebkitBackfaceVisibility: "hidden",
                                    pointerEvents: "none",
                                    cursor: "pointer",
                                }}
                            >
                                <div data-part="content" style={{ position: "absolute", inset: 0 }} />
                                <div style={{ position: "absolute", inset: 0, background: PAPER_TEXTURE, opacity: texOp, pointerEvents: "none" }} />
                                <div style={{ position: "absolute", inset: 0, borderRadius: r, boxShadow: "inset 0 0 0 1px rgba(36,35,33,0.10), inset 0 1px 0 rgba(255,255,255,0.7)", pointerEvents: "none" }} />
                            </div>
                            {t > 0 && (
                                <>
                                    <div style={{ position: "absolute", left: r, top: 0, width: cw - 2 * r, height: t, background: mix(cs.edgeColor, "#ffffff", 0.35), transformOrigin: "50% 0", transform: "rotateX(-90deg)" }} />
                                    <div style={{ position: "absolute", left: 0, top: r, width: t, height: ch - 2 * r, background: cs.edgeColor, transformOrigin: "0 50%", transform: "rotateY(90deg)" }} />
                                    <div style={{ position: "absolute", left: cw - t, top: r, width: t, height: ch - 2 * r, background: mix(cs.edgeColor, "#000000", 0.06), transformOrigin: "100% 50%", transform: "rotateY(-90deg)" }} />
                                </>
                            )}
                            <div
                                data-part="front"
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    ...maskStyle,
                                    transform: "translateZ(0.3px)",
                                    backfaceVisibility: "hidden",
                                    WebkitBackfaceVisibility: "hidden",
                                    pointerEvents: "none",
                                }}
                            >
                                <div style={{ position: "absolute", inset: 0, background: PAPER_TEXTURE, opacity: texOp * 0.7 }} />
                                <div data-part="shade" style={{ position: "absolute", inset: 0, background: "linear-gradient(" + (180 + dir) + "deg, rgba(24,22,18,0.05) 10%, rgba(24,22,18,0.6) 100%)", opacity: 0 }} />
                                <div data-part="ao" style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(20,18,14,0.72) 0%, rgba(20,18,14,0.34) 20%, rgba(20,18,14,0.08) 52%, rgba(20,18,14,0) 80%)", opacity: 0 }} />
                                <div
                                    data-part="gloss"
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        borderRadius: r,
                                        background: "linear-gradient(" + dir + "deg, rgba(255,255,255,0.2), rgba(255,255,255,0) 40%)",
                                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75), inset " + (dir <= 0 ? 1 : -1) + "px 0 0 rgba(255,255,255,0.35), inset 0 0 0 1px rgba(36,35,33,0.08)",
                                        opacity: 0,
                                    }}
                                />
                            </div>
                            {p.tabs !== "off" && (
                                <div
                                    data-part="tab"
                                    data-rdx-tab=""
                                    style={{
                                        position: "absolute",
                                        top: -ts.height + 1,
                                        left: 10,
                                        minWidth: ts.width,
                                        height: ts.height,
                                        padding: "0 8px",
                                        boxSizing: "border-box",
                                        display: "none",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: ts.radius + "px " + ts.radius + "px 0 0",
                                        background: ts.fill,
                                        color: ts.color,
                                        border: "1px solid rgba(36,35,33,0.12)",
                                        borderBottom: "none",
                                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
                                        fontFamily: SERIF,
                                        ...ts.font,
                                        lineHeight: 1,
                                        whiteSpace: "nowrap",
                                        backfaceVisibility: "hidden",
                                        WebkitBackfaceVisibility: "hidden",
                                        pointerEvents: "auto",
                                        cursor: "pointer",
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <span ref={measureRef} aria-hidden style={{ position: "absolute", left: -9999, top: 0, visibility: "hidden", whiteSpace: "nowrap", fontFamily: SERIF, ...ts.font, lineHeight: 1 }} />
            <span ref={liveRef} aria-live="polite" style={HIDDEN_TEXT} />
        </div>
    )
}

Rolodex.displayName = "3D Rolodex Carousel"

/* ------------------------------------------------------------------ */
/* Property controls                                                   */
/* ------------------------------------------------------------------ */

addPropertyControls(Rolodex, {
    /* ---------------- Content ---------------- */
    cards: {
        type: ControlType.Array,
        title: "Cards",
        control: { type: ControlType.ComponentInstance },
        description: "Connect one Collection List, or add cards one by one. Leave empty to preview with demo cards.",
    },
    cardWidth: { type: ControlType.Number, title: "Card Width", min: 80, max: 1400, step: 1, unit: "px", defaultValue: DEFAULTS.cardWidth },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        min: 60,
        max: 1200,
        step: 1,
        unit: "px",
        defaultValue: DEFAULTS.cardHeight,
        description: "Match the size of your CMS card so it fills the paper exactly.",
    },
    startIndex: {
        type: ControlType.Number,
        title: "Start Card",
        min: 0,
        max: 500,
        step: 1,
        displayStepper: true,
        defaultValue: 0,
        description: "0 is the first card.",
    },
    loop: { type: ControlType.Boolean, title: "Loop", defaultValue: true, enabledTitle: "Yes", disabledTitle: "No" },

    /* ---------------- Index tabs ---------------- */
    tabs: {
        type: ControlType.Enum,
        title: "Index Tabs",
        options: ["letter", "layer", "number", "off"],
        optionTitles: ["First Letter", "Tab Layer", "Number", "Off"],
        defaultValue: "letter",
        description: "Tab Layer reads a text layer named “Tab” in each card. Bind it to a CMS field, such as a category.",
    },
    tabAlign: {
        type: ControlType.Enum,
        title: "Tab Position",
        options: ["stagger", "left", "center", "right"],
        optionTitles: ["Stagger", "Left", "Center", "Right"],
        defaultValue: "stagger",
        hidden: (p: any) => p.tabs === "off",
    },
    tabStyle: {
        type: ControlType.Object,
        title: "Tab Style",
        hidden: (p: any) => p.tabs === "off",
        controls: {
            fill: { type: ControlType.Color, title: "Fill", defaultValue: TAB_DEFAULTS.fill },
            color: { type: ControlType.Color, title: "Text", defaultValue: TAB_DEFAULTS.color },
            activeFill: { type: ControlType.Color, title: "Active Fill", defaultValue: TAB_DEFAULTS.activeFill },
            activeColor: { type: ControlType.Color, title: "Active Text", defaultValue: TAB_DEFAULTS.activeColor },
            font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "serif", defaultValue: { fontSize: 17 } as any },
            width: { type: ControlType.Number, title: "Min Width", min: 16, max: 200, step: 1, unit: "px", defaultValue: TAB_DEFAULTS.width },
            height: { type: ControlType.Number, title: "Height", min: 10, max: 80, step: 1, unit: "px", defaultValue: TAB_DEFAULTS.height },
            radius: { type: ControlType.Number, title: "Radius", min: 0, max: 40, step: 1, unit: "px", defaultValue: TAB_DEFAULTS.radius },
        },
    },

    /* ---------------- Look ---------------- */
    cardStyle: {
        type: ControlType.Object,
        title: "Card Style",
        controls: {
            paperColor: { type: ControlType.Color, title: "Paper", defaultValue: CARD_DEFAULTS.paperColor },
            inkColor: { type: ControlType.Color, title: "Ink", defaultValue: CARD_DEFAULTS.inkColor },
            edgeColor: { type: ControlType.Color, title: "Paper Edge", defaultValue: CARD_DEFAULTS.edgeColor },
            radius: { type: ControlType.Number, title: "Radius", min: 0, max: 40, step: 1, unit: "px", defaultValue: CARD_DEFAULTS.radius },
            notches: { type: ControlType.Enum, title: "Notches", options: ["round", "square", "none"], optionTitles: ["Round", "Square", "None"], displaySegmentedControl: true, defaultValue: "round" },
            thickness: { type: ControlType.Number, title: "Thickness", min: 0, max: 6, step: 0.5, unit: "px", defaultValue: CARD_DEFAULTS.thickness },
            texture: { type: ControlType.Number, title: "Paper Grain", min: 0, max: 1, step: 0.05, defaultValue: CARD_DEFAULTS.texture },
            back: {
                type: ControlType.Enum,
                title: "Back Face",
                options: ["auto", "generated"],
                optionTitles: ["Back Layer", "Generated"],
                displaySegmentedControl: true,
                defaultValue: "auto",
                description: "Back Layer uses a layer named “Back” in the card. Without one, a back is built from the card’s text.",
                hidden: (_: any, r: any) => r && r.interaction && r.interaction.flip === false,
            },
            backColor: { type: ControlType.Color, title: "Back Paper", defaultValue: CARD_DEFAULTS.backColor, hidden: (_: any, r: any) => r && r.interaction && r.interaction.flip === false },
            ctaLabel: {
                type: ControlType.String,
                title: "Back Button",
                defaultValue: CARD_DEFAULTS.ctaLabel,
                description: "Shown on generated backs when the card links somewhere.",
                hidden: (_: any, r: any) => r && r.interaction && r.interaction.flip === false,
            },
        },
    },
    housing: {
        type: ControlType.Enum,
        title: "Housing",
        options: ["full", "minimal", "none"],
        optionTitles: ["Full", "Rod", "None"],
        displaySegmentedControl: true,
        defaultValue: "full",
    },
    housingStyle: {
        type: ControlType.Object,
        title: "Housing Style",
        hidden: (p: any) => p.housing === "none" || p.housing === false,
        controls: {
            material: { type: ControlType.Enum, title: "Finish", options: ["steel", "painted"], optionTitles: ["Polished", "Painted"], displaySegmentedControl: true, defaultValue: "steel" },
            metalColor: { type: ControlType.Color, title: "Metal", defaultValue: HOUSING_DEFAULTS.metalColor },
            darkColor: { type: ControlType.Color, title: "Shadow Metal", defaultValue: HOUSING_DEFAULTS.darkColor },
            baseColor: { type: ControlType.Color, title: "Base", defaultValue: HOUSING_DEFAULTS.baseColor, hidden: (_: any, r: any) => r && r.housing === "minimal" },
            discSize: { type: ControlType.Number, title: "Drum Size", min: 0.25, max: 0.6, step: 0.01, defaultValue: HOUSING_DEFAULTS.discSize, hidden: (_: any, r: any) => r && r.housing === "minimal" },
            spindle: { type: ControlType.Number, title: "Rod Thickness", min: 8, max: 24, step: 1, unit: "px", defaultValue: HOUSING_DEFAULTS.spindle },
        },
    },
    lighting: {
        type: ControlType.Object,
        title: "Lighting",
        controls: {
            direction: { type: ControlType.Number, title: "Direction", min: -90, max: 90, step: 1, unit: "°", defaultValue: LIGHTING_DEFAULTS.direction, description: "Negative values light from the left." },
            shadows: { type: ControlType.Number, title: "Shadows", min: 0, max: 1, step: 0.05, defaultValue: LIGHTING_DEFAULTS.shadows },
            highlights: { type: ControlType.Number, title: "Highlights", min: 0, max: 1, step: 0.05, defaultValue: LIGHTING_DEFAULTS.highlights },
        },
    },

    /* ---------------- Camera & stack ---------------- */
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            tilt: { type: ControlType.Number, title: "Camera Tilt", min: -20, max: 50, step: 1, unit: "°", defaultValue: LAYOUT_DEFAULTS.tilt },
            yaw: { type: ControlType.Number, title: "Camera Turn", min: -60, max: 60, step: 1, unit: "°", defaultValue: LAYOUT_DEFAULTS.yaw },
            perspective: { type: ControlType.Number, title: "Perspective", min: 600, max: 6000, step: 50, unit: "px", defaultValue: LAYOUT_DEFAULTS.perspective, description: "Lower values exaggerate depth." },
            cardsBehind: { type: ControlType.Number, title: "Cards Behind", min: 1, max: 20, step: 1, displayStepper: true, defaultValue: LAYOUT_DEFAULTS.cardsBehind },
            cardsInFront: { type: ControlType.Number, title: "Cards In Front", min: 0, max: 6, step: 1, displayStepper: true, defaultValue: LAYOUT_DEFAULTS.cardsInFront, description: "0 lets fallen cards fade out." },
            fanAngle: { type: ControlType.Number, title: "Fan Angle", min: 0, max: 40, step: 0.5, unit: "°", defaultValue: LAYOUT_DEFAULTS.fanAngle },
            spacing: { type: ControlType.Number, title: "Card Spacing", min: 0.5, max: 12, step: 0.1, unit: "°", defaultValue: LAYOUT_DEFAULTS.spacing },
            fallAngle: { type: ControlType.Number, title: "Front Fall", min: 30, max: 110, step: 1, unit: "°", defaultValue: LAYOUT_DEFAULTS.fallAngle, description: "How far a card drops forward after it passes the front." },
            depth: { type: ControlType.Number, title: "Depth Shrink", min: 0, max: 1, step: 0.05, defaultValue: LAYOUT_DEFAULTS.depth },
            offsetY: { type: ControlType.Number, title: "Offset Y", min: -600, max: 600, step: 1, unit: "px", defaultValue: 0 },
            responsive: { type: ControlType.Boolean, title: "Fit to Frame", defaultValue: true, enabledTitle: "Yes", disabledTitle: "No", description: "Scales the object to its frame. Narrow portrait frames switch to a compact, front-on view." },
        },
    },

    /* ---------------- Behaviour ---------------- */
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        controls: {
            scroll: {
                type: ControlType.Enum,
                title: "Scroll",
                options: ["none", "wheel", "page"],
                optionTitles: ["Off", "Wheel", "Page"],
                displaySegmentedControl: true,
                defaultValue: "none",
                description: "Page scrubs through the cards as the page scrolls. Put the Rolodex in a sticky frame inside a tall section.",
            },
            drag: { type: ControlType.Boolean, title: "Drag", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
            dragDistance: { type: ControlType.Number, title: "Drag Per Card", min: 20, max: 400, step: 1, unit: "px", defaultValue: INTERACTION_DEFAULTS.dragDistance, hidden: (o: any) => o && o.drag === false },
            momentum: { type: ControlType.Number, title: "Momentum", min: 0, max: 1, step: 0.05, defaultValue: INTERACTION_DEFAULTS.momentum, hidden: (o: any) => o && o.drag === false },
            snap: { type: ControlType.Number, title: "Snap Strength", min: 0, max: 1, step: 0.05, defaultValue: INTERACTION_DEFAULTS.snap },
            clickCards: { type: ControlType.Boolean, title: "Click to Jump", defaultValue: true, enabledTitle: "On", disabledTitle: "Off", description: "Click a card or tab to bring it to the front." },
            flip: { type: ControlType.Boolean, title: "Flip Card", defaultValue: true, enabledTitle: "On", disabledTitle: "Off", description: "Click the front card or press Enter to turn it over. Escape turns it back." },
            keyboard: { type: ControlType.Boolean, title: "Keyboard", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            speed: { type: ControlType.Number, title: "Spin Speed", min: 0.3, max: 3, step: 0.05, defaultValue: MOTION_DEFAULTS.speed },
            riffleSpeed: { type: ControlType.Number, title: "Jump Speed", min: 0.25, max: 4, step: 0.05, defaultValue: MOTION_DEFAULTS.riffleSpeed, description: "Speed of a jump to a card or tab." },
            detent: { type: ControlType.Number, title: "Detent", min: 0, max: 1, step: 0.05, defaultValue: MOTION_DEFAULTS.detent, description: "How strongly the stack ticks into each card." },
            flutter: { type: ControlType.Number, title: "Flutter", min: 0, max: 1, step: 0.05, defaultValue: MOTION_DEFAULTS.flutter },
            hoverLift: { type: ControlType.Number, title: "Hover Lean", min: 0, max: 1, step: 0.05, defaultValue: MOTION_DEFAULTS.hoverLift },
            flipSpeed: { type: ControlType.Number, title: "Flip Duration", min: 0.2, max: 2, step: 0.05, unit: "s", defaultValue: MOTION_DEFAULTS.flipSpeed, hidden: (_: any, r: any) => r && r.interaction && r.interaction.flip === false },
        },
    },
    sound: {
        type: ControlType.Object,
        title: "Sound",
        controls: {
            detent: { type: ControlType.Boolean, title: "Tick", defaultValue: false, enabledTitle: "On", disabledTitle: "Off" },
            flip: { type: ControlType.Boolean, title: "Flip Swish", defaultValue: false, enabledTitle: "On", disabledTitle: "Off" },
            volume: { type: ControlType.Number, title: "Volume", min: 0, max: 1, step: 0.05, defaultValue: SOUND_DEFAULTS.volume, hidden: (o: any) => !o || (!o.flip && !o.detent) },
        },
    },

    /* ---------------- Accessibility & events ---------------- */
    ariaLabel: { type: ControlType.String, title: "Screen Reader Label", defaultValue: DEFAULTS.ariaLabel },
    onChange: { type: ControlType.EventHandler, title: "On Change" },
    onFlip: { type: ControlType.EventHandler, title: "On Flip" },
})
