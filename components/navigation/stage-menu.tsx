import * as React from "react"
import { createPortal, flushSync } from "react-dom"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/*
 * Stage Menu
 * The page steps back into a softly tilted card and the menu takes the stage.
 * Behind the page sits one slim sheet per link, like index dividers. Hovering a
 * link pulls its sheet out; a link to a section of the page also scrolls the
 * card there. Click or swipe the page card to return to it.
 */

// ---------------------------------------------------------------- types

interface MenuLink {
    label?: string
    link?: string
    newTab?: boolean
    tint?: string
}
interface FooterLink {
    label?: string
    link?: string
    newTab?: boolean
}
type FontValue = { [key: string]: unknown }
interface LogoProps {
    type?: "Text" | "Image" | "None"
    text?: string
    image?: { src?: string; srcSet?: string; alt?: string }
    height?: number
    link?: string
    newTab?: boolean
}
interface ButtonProps {
    label?: string
    closeLabel?: string
    showLabel?: boolean
    fill?: string
    color?: string
    closeStyle?: "Subtle" | "Solid"
}
interface HeaderProps {
    fill?: string
    /** material once the page has scrolled: Auto follows what is behind the header (light or dark) */
    glass?: "Auto" | "Light" | "Dark" | "Off"
    color?: string
    padding?: string
    font?: FontValue
}
interface SectionProps {
    preview?: boolean
    active?: boolean
}
interface MenuProps {
    side?: "Right" | "Left"
    width?: number
    title?: string
    font?: FontValue
    smallFont?: FontValue
    padding?: string
    stage?: string
    color?: string
    muted?: string
    closeOnClick?: boolean
}
interface PageProps {
    scale?: number
    tilt?: number
    radius?: string
    shadow?: string
    dim?: string
    border?: string
}
interface SpineProps {
    show?: boolean
    step?: number
    pull?: number
    labels?: boolean
}
interface MotionProps {
    duration?: number
    bounce?: number
    stagger?: number
}
interface StageMenuProps {
    links?: MenuLink[]
    footerLinks?: FooterLink[]
    logo?: LogoProps
    button?: ButtonProps
    header?: HeaderProps
    menu?: MenuProps
    page?: PageProps
    spines?: SpineProps
    motion?: MotionProps
    sections?: SectionProps
    phoneBreakpoint?: number
    focusRing?: string
    style?: React.CSSProperties
}

// ---------------------------------------------------------------- defaults

const SANS = '"Inter", "Inter Placeholder", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
// sheet papers: ivory, camel, deep sage, midnight — then stone, linen, moss, slate
const PALETTE = ["#E7E1D6", "#C9B79C", "#6F7C72", "#2F3A4A", "#A08C78", "#D8D2C4", "#4F5D57", "#8A93A3"]

const D = {
    links: [
        { label: "Work", link: "", newTab: false, tint: "#E7E1D6" },
        { label: "About", link: "", newTab: false, tint: "#C9B79C" },
        { label: "Journal", link: "", newTab: false, tint: "#6F7C72" },
        { label: "Contact", link: "", newTab: false, tint: "#2F3A4A" },
    ] as MenuLink[],
    footerLinks: [
        { label: "Instagram", link: "", newTab: false },
        { label: "LinkedIn", link: "", newTab: false },
        { label: "hello@studio.com", link: "", newTab: false },
    ] as FooterLink[],
    logo: { type: "Text", text: "Studio", height: 28, link: "", newTab: false } as LogoProps,
    button: { label: "Menu", closeLabel: "Close", showLabel: true, fill: "#111214", color: "#F5F5F7", closeStyle: "Subtle" } as ButtonProps,
    header: {
        fill: "rgba(0, 0, 0, 0)",
        glass: "Auto",
        color: "#111214",
        padding: "20px 32px 20px 32px",
    } as HeaderProps,
    menu: {
        side: "Right",
        width: 40,
        title: "Menu",
        padding: "40px 56px 40px 56px",
        stage: "#101113",
        color: "#F5F5F7",
        muted: "#8E8F97",
        closeOnClick: true,
    } as MenuProps,
    page: {
        scale: 0.86,
        tilt: 5,
        radius: "20px",
        shadow: "0px 40px 120px 0px rgba(0, 0, 0, 0.55)",
        dim: "rgba(0, 0, 0, 0.22)",
        border: "rgba(255, 255, 255, 0.10)",
    } as PageProps,
    spines: { show: true, step: 10, pull: 36, labels: true } as SpineProps,
    motion: { duration: 0.7, bounce: 0.1, stagger: 0.05 } as MotionProps,
    sections: { preview: true, active: true } as SectionProps,
    phoneBreakpoint: 760,
    focusRing: "#6EA8FE",
}

// ---------------------------------------------------------------- helpers

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const clamp01 = (v: number) => clamp(v, 0, 1)
const smooth = (x: number) => x * x * (3 - 2 * x)
/** spring progress over which the header's Menu and the stage's Close cross (held in one spot) */
const HANDOFF = 0.1
const num = (v: unknown, fb: number) => {
    const n = typeof v === "number" ? v : parseFloat(String(v))
    return Number.isFinite(n) ? n : fb
}
function pad4(v: unknown, fb: [number, number, number, number]): [number, number, number, number] {
    if (typeof v === "number") return [v, v, v, v]
    if (typeof v !== "string") return fb
    const p = v
        .trim()
        .split(/\s+/)
        .map((s) => parseFloat(s))
        .filter((n) => Number.isFinite(n))
    if (p.length === 1) return [p[0], p[0], p[0], p[0]]
    if (p.length === 2) return [p[0], p[1], p[0], p[1]]
    if (p.length === 3) return [p[0], p[1], p[2], p[1]]
    if (p.length >= 4) return [p[0], p[1], p[2], p[3]]
    return fb
}
const hasLink = (l?: string) => typeof l === "string" && l.trim().length > 0

/** Accepts hex, rgb(a) and Framer color tokens (var(--token, fallback)). */
function rgba(c: string | undefined): [number, number, number, number] | null {
    if (!c) return null
    let s = c.trim()
    const v = s.match(/^var\([^,]+,\s*(.+)\)$/)
    if (v) s = v[1].trim()
    if (s.startsWith("#")) {
        let h = s.slice(1)
        if (h.length === 3 || h.length === 4)
            h = h
                .split("")
                .map((x) => x + x)
                .join("")
        const n = parseInt(h.slice(0, 6), 16)
        if (!Number.isFinite(n)) return null
        const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a]
    }
    const m = s.match(/rgba?\(([^)]+)\)/i)
    if (m) {
        const p = m[1]
            .split(/[\s,/]+/)
            .filter(Boolean)
            .map((x) => parseFloat(x))
        return [p[0] || 0, p[1] || 0, p[2] || 0, Number.isFinite(p[3]) ? p[3] : 1]
    }
    return null
}
function luminance(c: string | undefined) {
    const p = rgba(c)
    if (!p) return 1
    const f = (u: number) => {
        u /= 255
        return u <= 0.03928 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * f(p[0]) + 0.7152 * f(p[1]) + 0.0722 * f(p[2])
}
/** Event time in the performance.now() clock: real input time even when events arrive late in one batch. */
const evTime = (e: { timeStamp: number }) => {
    const now = performance.now()
    const t = e.timeStamp
    return t > 0 && t <= now + 1 && now - t < 1000 ? t : now
}
/** Blend two colors (a → b by t). Keeps a untouched (and Framer tokens live) when t is ~0. */
function mixColor(a: string, b: string, t: number): string {
    if (t < 0.002) return a
    const x = rgba(a)
    const y = rgba(b)
    if (!x || !y) return a
    const m = (i: number) => Math.round(x[i] + (y[i] - x[i]) * t)
    return x[3] < 1 ? `rgba(${m(0)}, ${m(1)}, ${m(2)}, ${x[3]})` : `rgb(${m(0)}, ${m(1)}, ${m(2)})`
}
/** Same color with its alpha multiplied by k (capped at 1). */
function withAlpha(c: string, k: number): string {
    const p = rgba(c)
    if (!p) return c
    return `rgba(${p[0]}, ${p[1]}, ${p[2]}, ${Math.min(1, p[3] * k).toFixed(3)})`
}
/** Header glass materials: fill, hairline, opaque fill for Reduce Transparency. */
const GLASS_LIGHT = { fill: "rgba(255, 255, 255, 0.72)", line: "rgba(0, 0, 0, 0.07)", solid: "#F7F7F8" }
const GLASS_DARK = { fill: "rgba(22, 23, 26, 0.62)", line: "rgba(255, 255, 255, 0.08)", solid: "#1A1B1E" }
/** A color that stays readable on light or dark glass (keeps the author's color when it already contrasts). */
function inkOn(c: string, tone: "light" | "dark") {
    const l = luminance(c)
    if (tone === "dark" && l < 0.4) return "#F5F5F7"
    if (tone === "light" && l > 0.6) return "#111214"
    return c
}
const tintOf = (l: MenuLink | undefined, i: number) => (l && l.tint && l.tint.trim()) || PALETTE[i % PALETTE.length]
const isTransparent = (c: string) => {
    const p = rgba(c)
    return !p || p[3] === 0
}

/** Turns Framer's font control value into CSS, with a safe fallback family. */
function fontCss(f: FontValue | undefined, fallbackSize: number, fallbackWeight: number): React.CSSProperties {
    const o: React.CSSProperties = {
        fontFamily: SANS,
        fontWeight: fallbackWeight,
        fontSize: fallbackSize,
    }
    if (f && typeof f === "object") {
        for (const k of Object.keys(f)) {
            const val = f[k]
            if (val === undefined || val === null || k === "variant") continue
            ;(o as Record<string, unknown>)[k] = val
        }
    }
    return o
}
const fontPx = (f: FontValue | undefined, fb: number) => num(f && f.fontSize, fb)

function samePage(href: string) {
    try {
        const u = new URL(href, window.location.href)
        const norm = (p: string) => p.replace(/\/+$/, "") || "/"
        return u.origin === window.location.origin && norm(u.pathname) === norm(window.location.pathname)
            ? u
            : null
    } catch {
        return null
    }
}

/** Element for a #hash; with duplicate ids (layers hidden per breakpoint) the visible one wins. */
function resolveId(hash: string): HTMLElement | null {
    let id = hash.charAt(0) === "#" ? hash.slice(1) : hash
    if (!id) return null
    try {
        id = decodeURIComponent(id)
    } catch {
        // keep the raw id
    }
    try {
        const sel = typeof CSS !== "undefined" && CSS.escape ? `[id="${CSS.escape(id)}"]` : `[id="${id.replace(/"/g, '\\"')}"]`
        const all = Array.from(document.querySelectorAll<HTMLElement>(sel))
        return all.find((el) => el.getClientRects().length > 0) || all[0] || null
    } catch {
        const el = document.getElementById(id)
        return el instanceof HTMLElement ? el : null
    }
}

/** The element a same-page #hash link points to, or null. */
function sectionOf(href: string | undefined): HTMLElement | null {
    if (!hasLink(href)) return null
    const u = samePage(href as string)
    if (!u || u.hash.length < 2) return null
    return resolveId(u.hash)
}

type Tone = "light" | "dark"
/** Light or dark by the first solid background from el upward; null when a picture or a mid tone decides it. */
function toneOf(el: Element | null): Tone | null {
    let a: Element | null = el
    while (a && a !== document.documentElement) {
        const cs = getComputedStyle(a)
        if (cs.backgroundImage && cs.backgroundImage !== "none") return null
        if (a.tagName === "IMG" || a.tagName === "VIDEO" || a.tagName === "CANVAS") return null
        const c = rgba(cs.backgroundColor)
        if (c && c[3] > 0.5) {
            const l = luminance(cs.backgroundColor)
            return l < 0.2 ? "dark" : l > 0.3 ? "light" : null
        }
        a = a.parentElement
    }
    const body = rgba(getComputedStyle(document.body).backgroundColor)
    return body && body[3] > 0.5 ? (luminance(getComputedStyle(document.body).backgroundColor) < 0.2 ? "dark" : "light") : null
}

/** What sits behind the header row right now (three probes along its middle), ignoring the header itself. */
function toneBehind(root: HTMLElement): Tone | null {
    const r = root.getBoundingClientRect()
    const y = Math.max(1, Math.min(window.innerHeight - 1, r.top + r.height / 2))
    let dark = 0
    let light = 0
    for (const f of [0.25, 0.5, 0.75]) {
        const x = window.innerWidth * f
        const stack = document.elementsFromPoint ? document.elementsFromPoint(x, y) : []
        const hit = stack.find((el) => el !== root && !el.contains(root) && !root.contains(el) && !el.closest(".stm-layer")) || null
        const t = hit ? toneOf(hit) : null
        if (t === "dark") dark++
        else if (t === "light") light++
    }
    return dark > light ? "dark" : light > dark ? "light" : null
}

/** "fixed" / "sticky" when the header (or a wrapper) is pinned to the window, else null. */
function pinOf(root: HTMLElement): "fixed" | "sticky" | null {
    let a: HTMLElement | null = root
    while (a && a !== document.body) {
        const p = getComputedStyle(a).position
        if (p === "fixed") return "fixed"
        if (p === "sticky") return "sticky"
        a = a.parentElement
    }
    return null
}

/** Index of the link whose section crosses the reading line (40 % down the window), or -1. */
function sectionInView(links: MenuLink[]): number {
    const line = window.innerHeight * 0.4
    let best = -1
    let bestTop = -Infinity
    links.forEach((l, i) => {
        const el = sectionOf(l.link)
        if (!el) return
        const r = el.getBoundingClientRect()
        // nested sections: the innermost (lowest top) one that holds the line wins
        if (r.height > 0 && r.top <= line && r.bottom > line && r.top > bestTop) {
            best = i
            bestTop = r.top
        }
    })
    return best
}

// ---------------------------------------------------------------- spring

/** Apple-style spring defined by perceptual duration and bounce. */
class Spring {
    value: number
    target: number
    velocity = 0
    k = 80
    c = 18
    constructor(v = 0) {
        this.value = v
        this.target = v
    }
    tune(duration: number, bounce: number) {
        const d = Math.max(0.08, duration)
        const b = clamp(bounce, 0, 0.8)
        this.k = Math.pow((2 * Math.PI) / d, 2)
        this.c = (4 * Math.PI * (1 - b)) / d
    }
    /** vmax: optional speed limit (units per second), applied in every substep so slow frames cannot exceed it */
    step(dt: number, vmax = Infinity) {
        const n = Math.max(1, Math.ceil(dt / (1 / 240)))
        const h = dt / n
        for (let i = 0; i < n; i++) {
            const a = -this.k * (this.value - this.target) - this.c * this.velocity
            this.velocity += a * h
            if (this.velocity > vmax) this.velocity = vmax
            else if (this.velocity < -vmax) this.velocity = -vmax
            this.value += this.velocity * h
        }
    }
    get resting() {
        return Math.abs(this.value - this.target) < 0.0004 && Math.abs(this.velocity) < 0.004
    }
    snap() {
        this.value = this.target
        this.velocity = 0
    }
}

// ---------------------------------------------------------------- engine

interface Geo {
    VW: number
    VH: number
    PL: number
    PW: number
    top: number
    bottom: number
    phone: boolean
    tablet: boolean
    side: 1 | -1
    panelW: number
    s: number
    tx: number
    ry: number
    persp: number
    r: number
    n: number
    step: number
    pull: number
    spines: boolean
    cols: 1 | 2
}

interface FixedRec {
    el: HTMLElement
    translate: string
    width: string
    height: string
    transition: string
    base: [string, string]
    dx: number
    dy: number
}
interface FixedSnap {
    x: number
    y: number
    w: string
    h: string
}
/** A position: sticky element of the page (window-scrolled): it follows the section preview like a real scroll would. */
interface StickyRec {
    el: HTMLElement
    translate: string
    transition: string
    base: [string, string]
    /** sticky top, height, natural document top, bottom of its containing block (document px) */
    T: number
    H: number
    N: number
    B: number
}
interface Saved {
    target: HTMLElement | null
    style: Record<string, string>
    inert: boolean
    fixed: FixedRec[]
    sticky: StickyRec[]
    scroll0: number
    /** the component's own header row and trigger: faded while open, restored exactly */
    head: HTMLElement | null
    headOpacity: string
    trigOpacity: string
    /** the trigger's own translate/scale/origin (it is held in place during the handoff) */
    trigPin: [string, string, string]
    /** the trigger's resolved fill + text color: Close starts in exactly that look */
    trigLook: [string, string] | null
    htmlOverflow: string
    htmlPadding: string
}

const TARGET_PROPS = [
    "transform",
    "transform-origin",
    "clip-path",
    "-webkit-clip-path",
    "will-change",
    "position",
    "z-index",
    "background-color",
    "backface-visibility",
]

/** A fixed element is only viewport-bound when no ancestor creates a containing block. */
function fixedToViewport(el: HTMLElement, stop: HTMLElement) {
    let a = el.parentElement
    while (a && a !== stop) {
        const cs = getComputedStyle(a)
        if (
            cs.transform !== "none" ||
            cs.perspective !== "none" ||
            (cs.filter && cs.filter !== "none") ||
            /transform|perspective|filter/.test(cs.willChange || "") ||
            /paint|layout|strict|content/.test(cs.contain || "")
        )
            return false
        a = a.parentElement
    }
    return true
}

function findPage(): HTMLElement | null {
    const main = document.getElementById("main")
    if (main && main.parentElement === document.body) return main
    const root = document.querySelector("[data-framer-root]")
    if (root instanceof HTMLElement && root !== document.body) return root
    return main
}

class StageEngine {
    get: () => Required<StageMenuProps>
    onClosed: () => void
    /** every close path (button, Escape, card tap, drag) reports here, so React state follows at once */
    onClosing: () => void = () => {}
    main = new Spring(0)
    pulls: Spring[] = []
    /** card dim while the pointer is over it, as a spring so it never jumps */
    hoverDim = new Spring(0)
    /** section preview: how far (px of page) the card has scrolled inside itself */
    peek = new Spring(0)
    peekTimer = 0 as ReturnType<typeof setTimeout> | 0
    /** a section link was chosen: the card keeps its preview and the window lands there on close */
    committed = false
    /** per link: its section's top inside the page (px), or null */
    sections: (number | null)[] = []
    /** per link: the tone behind the header bar at its landing spot */
    tones: (Tone | null)[] = []
    /** a long trip skips ahead once the card is visibly moving (NaN: no cut) */
    peekCut = NaN
    /** pointer hover intent: last pointer sample over the list, to wait until it rests */
    hoverSample: [number, number, number] = [0, 0, 0]
    peekIntent = 0
    /** the link whose section the preview is heading for (-1: where the visitor was) */
    peekIndex = -1
    peekSynced = 0
    /** while closing, the preview rides on the main spring so card and content land in the same frame */
    peekLinked = false
    peekFrom = 0
    peekTo = 0
    mFrom = 1
    /** height of the pinned header row: sections land just below it */
    headerOffset = 0
    /** the header row inside the card shows the state the page will have where the card is looking (null: as it was) */
    onGlass: (s: { y: number; tone: Tone | null } | null) => void = () => {}
    hover = -1
    press = { i: -1, x: 0, y: 0, timer: 0 as ReturnType<typeof setTimeout> | 0, lit: false }
    anchorMatched = false
    /** the trigger is held on its home spot right now */
    trigPinned = false
    /** Close starts as the header's Menu (same spot, look and word) and rolls over to Close on its own clock */
    swapOn = false
    /** the Close icon's own clock (= ↔ X) while Close rolls over: 0 = Menu lines, 1 = X */
    lines = new Spring(0)
    /** Close's own fill, text color, ring (inline), and whether a tint from the trigger replaces them now */
    closeLook: [string, string, string, string] | null = null
    closeTinted = false
    /** the trigger was hovered when it opened (its lower line is short): Close starts from that shape */
    hoverShort = false
    closeBox: [number, number] = [0, 0]
    pageDark = false
    raf = 0
    last = 0
    prepared = false
    reduced = false
    saved: Saved | null = null
    geo: Geo | null = null
    els: {
        back?: HTMLDivElement | null
        shadow?: HTMLDivElement | null
        spines: (HTMLDivElement | null)[]
        catcher?: HTMLDivElement | null
        dialog?: HTMLDivElement | null
        panel?: HTMLDivElement | null
        close?: HTMLButtonElement | null
        list?: HTMLUListElement | null
        trigger?: HTMLButtonElement | null
    } = { spines: [] }
    items: HTMLElement[] = []
    closeLines: SVGElement[] = []
    drag: { id: number; x0: number; y0: number; v0: number; samples: Array<[number, number]>; moved: boolean } | null = null
    pendingHash: URL | null = null
    scrollY = 0
    catcherHover = false
    anchor: { right: number; left: number; top: number; h: number } | null = null

    constructor(get: () => Required<StageMenuProps>, onClosed: () => void) {
        this.get = get
        this.onClosed = onClosed
        this.hoverDim.tune(0.26, 0)
        this.peek.tune(0.62, 0)
    }

    // ---- lifecycle
    open() {
        if (!this.prepared) this.prepare()
        if (this.peekLinked) {
            // turned around mid-close: the preview gets its own spring back, moving on at the speed it had
            this.peekLinked = false
            const m = this.main
            this.peek.velocity = ((this.peekFrom - this.peekTo) * m.velocity) / this.mFrom
        }
        if (this.committed || this.peekIndex >= 0) {
            // the card scrolls back to where the visitor was
            this.committed = false
            this.peekIndex = -1
            this.tunePeek(0)
            this.peek.target = 0
            this.emitGlass()
        }
        this.main.target = 1
        this.tune()
        this.setSwap("close")
        this.lines.tune(0.5, 0)
        this.lines.target = 1
        this.kick()
    }
    /** Close's own clock: the word rolls, the pill eases between the trigger's look and its own (CSS transitions). */
    setSwap(state: "menu" | "close") {
        const c = this.els.close
        if (!c || !this.swapOn || c.getAttribute("data-swap") === state) return
        // the starting look must be resolved before it changes, or nothing transitions on a freshly mounted button
        void c.offsetWidth
        c.setAttribute("data-swap", state)
    }
    close() {
        if (!this.prepared) return
        this.main.target = 0
        this.tune()
        this.clearPeekTimer()
        this.setSwap("menu")
        this.lines.target = 0
        // closing from Close under the pointer: the trigger comes back hovered (short lower line), so Close ends in that shape
        const close = this.els.close
        const trig = this.els.trigger
        try {
            this.hoverShort = !this.reduced && !!close && close.matches(":hover") && window.matchMedia("(hover: hover)").matches
        } catch {
            this.hoverShort = false
        }
        if (trig) {
            if (this.hoverShort) trig.setAttribute("data-stm-hover", "")
            else trig.removeAttribute("data-stm-hover")
        }
        // the preview glides home (or to the chosen section) on the main spring: both land in the same frame
        if (!this.committed) {
            this.peek.target = 0
            this.peekIndex = -1
            this.emitGlass()
        }
        const VH = this.geo ? this.geo.VH : 800
        const far = this.peek.target - this.peek.value
        if (this.main.value < 0.35) {
            // the card is nearly home already (e.g. thrown by a drag): the preview keeps its own spring and speed
            this.peekLinked = false
            this.peek.tune(num(this.get().motion.duration, 0.7) * 0.86 * 0.6, 0)
        } else {
            // several screens are not flown through: once the card is visibly moving, the content skips ahead
            // to 1.2 screens before its goal and glides the rest
            this.peekCut = !this.reduced && Math.abs(far) > 2.3 * VH ? this.peek.target - Math.sign(far) * 1.2 * VH : NaN
            this.peekFrom = this.peek.value
            this.peekTo = this.peek.target
            this.mFrom = Math.max(this.main.value, 0.001)
            this.peekLinked = true
            this.peek.velocity = 0
        }
        this.setHover(-1)
        this.onClosing()
        this.kick()
    }
    get isOpen() {
        return this.prepared && this.main.target === 1
    }
    tune() {
        const m = this.get().motion
        const d = num(m.duration, 0.7)
        const b = num(m.bounce, 0.1)
        // closing never bounces past home (that would flash the stage), so its bounce is capped
        this.main.tune(this.main.target === 0 ? d * 0.86 : d, this.main.target === 0 ? Math.min(b, 0.15) : b)
    }

    prepare() {
        const html = document.documentElement
        this.reduced = !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
        this.scrollY = window.scrollY
        const target = findPage()
        // sections land below the pinned header (Reduce Motion too); read before anything moves
        this.headerOffset = this.measureHeaderOffset()
        const saved: Saved = {
            target,
            style: {},
            inert: false,
            fixed: [],
            sticky: [],
            scroll0: window.scrollY,
            head: null,
            headOpacity: "",
            trigOpacity: "",
            trigPin: ["", "", ""],
            trigLook: null,
            htmlOverflow: html.style.overflow,
            htmlPadding: html.style.paddingRight,
        }
        const sbw = window.innerWidth - html.clientWidth
        let snap: FixedSnap[] = []
        if (target) {
            for (const p of TARGET_PROPS) saved.style[p] = target.style.getPropertyValue(p)
            saved.inert = target.inert
            if (!this.reduced) {
                const cs = getComputedStyle(target)
                if (cs.position === "static") target.style.position = "relative"
                target.style.zIndex = "1"
                if (isTransparent(cs.backgroundColor)) {
                    const first = target.querySelector(":scope > div") as HTMLElement | null
                    const candidates = [
                        first ? getComputedStyle(first).backgroundColor : "",
                        getComputedStyle(document.body).backgroundColor,
                        getComputedStyle(html).backgroundColor,
                    ]
                    const bg = candidates.find((c) => c && !isTransparent(c)) || "#ffffff"
                    target.style.backgroundColor = bg
                }
                this.pageDark = luminance(target.style.backgroundColor || cs.backgroundColor) < 0.03
                // position: fixed descendants would jump once the page is transformed.
                // Collect them before anything on the page creates a containing block.
                const all = target.getElementsByTagName("*")
                // sticky bars live near the top of the tree (nav wrappers): only the first levels are checked
                const stickies = Array.from(
                    target.querySelectorAll<HTMLElement>(
                        ":scope > *, :scope > * > *, :scope > * > * > *, :scope > * > * > * > *, :scope > * > * > * > * > *"
                    )
                ).filter((el) => getComputedStyle(el).position === "sticky")
                for (let i = 0; i < all.length; i++) {
                    const el = all[i] as HTMLElement
                    if (el.offsetParent !== null) continue
                    if (getComputedStyle(el).position !== "fixed") continue
                    if (!fixedToViewport(el, target)) continue
                    saved.fixed.push({
                        el,
                        translate: el.style.getPropertyValue("translate"),
                        width: el.style.getPropertyValue("width"),
                        height: el.style.getPropertyValue("height"),
                        transition: el.style.getPropertyValue("transition"),
                        base: ["0px", "0px"],
                        dx: 0,
                        dy: 0,
                    })
                    // our translate/size pins must never animate (site CSS like `transition: all .3s`)
                    el.style.setProperty("transition", "none")
                }
                // where they sit on screen right now (layout is still the closed one)
                snap = this.snapFixed(saved.fixed)
                saved.sticky = this.collectSticky(stickies, target)
                this.measureSections(target)
                target.style.willChange = "transform"
                target.style.backfaceVisibility = "hidden"
            }
        }
        html.style.overflow = "hidden"
        if (sbw > 0) {
            const cur = parseFloat(getComputedStyle(html).paddingRight) || 0
            html.style.paddingRight = cur + sbw + "px"
        }
        const trig = this.els.trigger
        if (trig) {
            saved.trigOpacity = trig.style.opacity
            saved.trigPin = [trig.style.translate, trig.style.scale, trig.style.transformOrigin]
            try {
                const cs = getComputedStyle(trig)
                // the lines carry the visible ink (the button's own color may say otherwise)
                const line = trig.querySelector(".stm-l1")
                const ink = line ? getComputedStyle(line).stroke : cs.color
                saved.trigLook = [cs.backgroundColor, ink]
            } catch {
                saved.trigLook = null
            }
            try {
                this.hoverShort = !this.reduced && trig.matches(":hover") && window.matchMedia("(hover: hover)").matches
            } catch {
                this.hoverShort = false
            }
            saved.head = trig.parentElement
            saved.headOpacity = saved.head ? saved.head.style.opacity : ""
        }
        this.saved = saved
        this.prepared = true
        const tr = trig ? trig.getBoundingClientRect() : null
        this.anchor =
            tr && tr.width > 0 ? { right: window.innerWidth - tr.right, left: tr.left, top: tr.top, h: tr.height } : null
        this.measure()
        this.placeFixed(snap)
        this.cacheItems()
        // focus moves into the dialog before the page becomes inert
        const dialog = this.els.dialog
        if (dialog) dialog.focus({ preventScroll: true })
        if (target) target.inert = true
        window.addEventListener("resize", this.onResize)
        window.addEventListener("scroll", this.onScroll, { passive: true })
        window.addEventListener("pageshow", this.onPageShow)
        document.addEventListener("keydown", this.onKey, true)
    }

    /** On-screen box + size of each fixed element while the page is not their containing block. */
    snapFixed(list: FixedRec[]): FixedSnap[] {
        return list.map((f) => {
            const cs = getComputedStyle(f.el)
            const tr = cs.translate && cs.translate !== "none" ? cs.translate.split(" ") : []
            f.base = [tr[0] || "0px", tr[1] || "0px"]
            const r = f.el.getBoundingClientRect()
            return { x: r.left, y: r.top, w: cs.width, h: cs.height }
        })
    }
    /** The page is their containing block now: keep their size and put them back on the same spot of the page. */
    placeFixed(snap: FixedSnap[]) {
        const s = this.saved
        const t = s ? s.target : null
        if (!s || !t || this.reduced || !s.fixed.length || snap.length !== s.fixed.length) return
        const tf = t.style.transform
        t.style.transform = "none"
        s.fixed.forEach((f, i) => {
            const cs = getComputedStyle(f.el)
            if (cs.width !== snap[i].w) f.el.style.setProperty("width", snap[i].w)
            if (cs.height !== snap[i].h) f.el.style.setProperty("height", snap[i].h)
        })
        s.fixed.forEach((f, i) => {
            const r1 = f.el.getBoundingClientRect()
            f.dx = snap[i].x - r1.left
            f.dy = snap[i].y - r1.top
        })
        s.scroll0 = window.scrollY
        t.style.transform = tf
        this.syncFixed()
    }
    /** Resize while open: measure the closed layout again (lock lifted, page not a containing block), then place. */
    measureFixed() {
        const s = this.saved
        const t = s ? s.target : null
        if (!s || !t || this.reduced || !s.fixed.length) return
        const html = document.documentElement
        const tf = t.style.transform
        const wc = t.style.willChange
        const ho = html.style.overflow
        const hp = html.style.paddingRight
        const put = (el: HTMLElement, p: string, v: string) => (v ? el.style.setProperty(p, v) : el.style.removeProperty(p))
        put(html, "overflow", s.htmlOverflow)
        put(html, "padding-right", s.htmlPadding)
        t.style.transform = "none"
        t.style.willChange = "auto"
        for (const f of s.fixed) {
            put(f.el, "translate", f.translate)
            put(f.el, "width", f.width)
            put(f.el, "height", f.height)
        }
        const snap = this.snapFixed(s.fixed)
        html.style.overflow = ho
        html.style.paddingRight = hp
        t.style.willChange = wc || "transform"
        t.style.transform = tf
        this.placeFixed(snap)
    }
    syncFixed() {
        const s = this.saved
        if (!s || this.reduced) return
        // fixed bars ride along with the section preview, so they stay at the top of the card
        this.peekSynced = this.peek.value
        const d = window.scrollY - s.scroll0 + this.peek.value
        const v = (base: string, px: number) => (base === "0px" ? `${+px.toFixed(2)}px` : `calc(${base} + ${px.toFixed(2)}px)`)
        for (const f of s.fixed) f.el.style.setProperty("translate", `${v(f.base[0], f.dx)} ${v(f.base[1], f.dy + d)}`)
        // sticky bars go where a real scroll to the previewed spot would put them
        const y = window.scrollY
        const pos = (r: StickyRec, sy: number) => clamp(sy + r.T, r.N, Math.max(r.N, r.B - r.H))
        for (const r of s.sticky) {
            const dy = pos(r, y + this.peek.value) - pos(r, y)
            r.el.style.setProperty("translate", `${r.base[0]} ${v(r.base[1], dy)}`)
        }
    }
    /** Sticky elements that stick to the window (no scrolling ancestor up to the page), measured untransformed. */
    collectSticky(list: HTMLElement[], target: HTMLElement): StickyRec[] {
        const out: StickyRec[] = []
        const y = window.scrollY
        for (const el of list) {
            const cs = getComputedStyle(el)
            if (cs.top === "auto") continue
            let a = el.parentElement
            let windowed = true
            while (a && a !== document.body) {
                const o = getComputedStyle(a)
                if (/(auto|scroll|hidden)/.test(o.overflowY + o.overflowX)) {
                    windowed = false
                    break
                }
                if (a === target) break
                a = a.parentElement
            }
            const parent = el.parentElement
            if (!windowed || !parent) continue
            const tr = cs.translate && cs.translate !== "none" ? cs.translate.split(" ") : []
            const inline = el.style.position
            el.style.position = "relative"
            const N = el.getBoundingClientRect().top + y
            el.style.position = inline
            const pr = parent.getBoundingClientRect()
            const pcs = getComputedStyle(parent)
            out.push({
                el,
                translate: el.style.getPropertyValue("translate"),
                transition: el.style.getPropertyValue("transition"),
                base: [tr[0] || "0px", tr[1] || "0px"],
                T: parseFloat(cs.top) || 0,
                H: el.getBoundingClientRect().height,
                N,
                B: pr.bottom + y - (parseFloat(pcs.paddingBottom) || 0) - (parseFloat(pcs.borderBottomWidth) || 0),
            })
            el.style.setProperty("transition", "none")
        }
        return out
    }
    /** Bottom of the pinned bar that holds this menu (fixed or stuck at the top), so sections land below it. */
    measureHeaderOffset() {
        const root = this.els.trigger ? this.els.trigger.parentElement : null
        let a: HTMLElement | null = root
        while (a && a !== document.body) {
            const p = getComputedStyle(a).position
            if (p === "fixed" || p === "sticky") {
                const r = a.getBoundingClientRect()
                const VH = window.innerHeight
                // a sticky bar counts where it will be stuck; a floating fixed bar (top: 16px) counts too
                const bottom = p === "sticky" ? (parseFloat(getComputedStyle(a).top) || 0) + r.height : r.bottom
                return r.top < VH * 0.3 && bottom > 0 ? clamp(bottom, 0, VH * 0.3) : 0
            }
            a = a.parentElement
        }
        return 0
    }

    /** Section tops inside the page, read while the page is untransformed. */
    measureSections(target: HTMLElement) {
        const tr = target.getBoundingClientRect()
        const root = this.els.trigger ? this.els.trigger.parentElement : null
        const hr = root ? root.getBoundingClientRect() : null
        // the bar's middle, relative to the window top (where toneBehind() will look after landing)
        const mid = hr && hr.height ? clamp(hr.top + hr.height / 2, 0, window.innerHeight) : 0
        const blocks = Array.from(target.querySelectorAll<HTMLElement>(":scope > *, :scope > * > *, :scope > * > * > *, :scope > * > * > * > *"))
        this.tones = []
        this.sections = this.get().links.map((l, i) => {
            const el = sectionOf(l.link)
            if (!el || !target.contains(el) || !el.getClientRects().length) return null
            const r = el.getBoundingClientRect()
            const y = r.top - tr.top - this.landingOffset(el)
            // which block sits behind the bar once landed: the header shows that tone while the card heads there
            if (root && mid) {
                const at = tr.top + y + mid
                let best: HTMLElement | null = null
                let bh = Infinity
                for (const b of blocks) {
                    if (b === root || b.contains(root) || root.contains(b)) continue
                    const br = b.getBoundingClientRect()
                    if (br.top <= at && br.bottom > at && br.left <= window.innerWidth / 2 && br.right > window.innerWidth / 2 && br.height < bh) {
                        best = b
                        bh = br.height
                    }
                }
                this.tones[i] = toneOf(best || el)
            } else this.tones[i] = toneOf(el)
            return y
        })
    }
    /**
     * The author's scroll-margin wins. Otherwise a section lands flush (the bar floats over its top padding, like any
     * anchor link) and only moves down by what the bar would hide of its content.
     */
    landingOffset(el: HTMLElement) {
        const cs = getComputedStyle(el)
        const m = parseFloat(cs.scrollMarginTop) || 0
        if (m > 0) return m
        return Math.max(0, this.headerOffset - (parseFloat(cs.paddingTop) || 0))
    }
    peekDur() {
        return clamp((0.62 * num(this.get().motion.duration, 0.7)) / 0.7, 0.45, 0.9)
    }
    /** Longer trips take a little longer (and the speed is capped in tick), so several screens never smear by. */
    tunePeek(to: number) {
        const VH = this.geo ? this.geo.VH : 800
        const dist = Math.abs(to - this.peek.value)
        this.peek.tune(this.peekDur() * clamp(1 + 0.35 * Math.log2(Math.max(1, dist / VH)), 1, 1.7), 0)
    }
    /** Tell the header row which state to show inside the card (the section the card is heading for). */
    emitGlass() {
        const s = this.saved
        if (!s) return
        const i = this.peekIndex
        if (i < 0 || (!this.committed && Math.abs(this.peek.target) < 0.5)) {
            this.onGlass(null)
            return
        }
        this.onGlass({ y: this.scrollY + this.peek.target, tone: this.tones[i] === undefined ? null : this.tones[i] })
    }
    /** How far the card scrolls inside itself to show link i's section (clamped to the page), or null. */
    peekDelta(i: number): number | null {
        const g = this.geo
        const y = i >= 0 ? this.sections[i] : null
        if (!g || y === null || y === undefined) return null
        return clamp(y - g.top, -g.top, g.bottom)
    }
    canPeek() {
        const g = this.geo
        return !!g && !g.phone && !this.reduced && !!(this.saved && this.saved.target) && this.get().sections.preview !== false
    }
    clearPeekTimer() {
        if (this.peekTimer) clearTimeout(this.peekTimer)
        this.peekTimer = 0
    }
    /**
     * Hover intent: a pointer must rest on a link (130 ms) before the card travels, keyboard focus is quicker (70 ms).
     * Coming home waits a little (240 ms), longer when focus only moves on inside the menu (650 ms), so Tab never swings the card.
     */
    schedulePeek(i: number, intent = 130, homeDelay = 240) {
        this.clearPeekTimer()
        this.peekIntent = 0
        if (this.committed || this.main.target !== 1) return
        const want = this.canPeek() ? this.peekDelta(i) : null
        const to = want === null ? 0 : want
        const index = want === null ? -1 : i
        if (Math.abs(to - this.peek.target) < 0.5) {
            this.peekIndex = index
            return
        }
        // pointer intent grows a little with the trip (up to +90 ms beyond 4 screens); keyboard stays quick
        if (want !== null && intent >= 130 && this.geo) intent += 30 * clamp(Math.abs(to - this.peek.value) / this.geo.VH - 1, 0, 3)
        if (want !== null && intent >= 130) this.peekIntent = intent
        this.peekTimer = setTimeout(
            () => {
                this.peekTimer = 0
                if (this.committed || this.main.target !== 1) return
                this.tunePeek(to)
                this.peek.target = to
                this.peekIndex = index
                this.emitGlass()
                this.kick()
            },
            want === null ? homeDelay : intent
        )
    }
    /** A section link was clicked: keep (or start) its preview; the window lands there when the page is back. */
    commit(i: number) {
        if (!this.prepared || this.reduced || this.get().sections.preview === false) return false
        const d = this.peekDelta(i)
        if (d === null) return false
        this.clearPeekTimer()
        this.committed = true
        this.peekIndex = i
        this.peek.target = d
        this.emitGlass()
        return true
    }

    cacheItems() {
        const dialog = this.els.dialog
        this.items = dialog ? Array.from(dialog.querySelectorAll<HTMLElement>("[data-stm-item]")) : []
        this.closeLines = this.els.close ? Array.from(this.els.close.querySelectorAll<SVGElement>("[data-line]")) : []
        const n = this.get().links.length
        while (this.pulls.length < n) {
            const s = new Spring(0)
            s.tune(0.42, 0)
            this.pulls.push(s)
        }
    }

    measure() {
        const p = this.get()
        const target = this.saved ? this.saved.target : null
        const VW = window.innerWidth
        const VH = window.innerHeight
        // the transform may already be in place: read layout values, not client rects
        const PL = target ? target.offsetLeft : 0
        const PW = target ? target.offsetWidth : document.documentElement.clientWidth
        const top = target ? Math.max(0, window.scrollY - (target.offsetTop || 0)) : 0
        const th = target ? target.offsetHeight : VH
        const bottom = Math.max(0, th - top - VH)
        const phone = VW < num(p.phoneBreakpoint, 760)
        const tablet = !phone && VW < 1100
        const side: 1 | -1 = p.menu.side === "Left" ? -1 : 1
        const links = p.links.length
        const spines = !!p.spines.show && !phone && !this.reduced && links > 0
        const step = clamp(num(p.spines.step, 10), 2, 24) * (tablet ? 0.8 : 1)
        const pull = clamp(num(p.spines.pull, 36), 0, 80)
        const widthPct = clamp(num(p.menu.width, 40), 20, 80)
        let panelW = phone
            ? VW - 60
            : tablet
              ? clamp((VW * Math.max(widthPct, 46)) / 100, 340, 560)
              : clamp((VW * widthPct) / 100, 360, 720)
        // short screens with many links: two columns instead of tiny type
        let cols: 1 | 2 = 1
        if (VH < 520 && links >= 5) {
            const wide = tablet ? clamp((VW * Math.max(widthPct, 54)) / 100, 340, 560) : panelW
            const one = this.linkFit(panelW, VH, phone, 1)
            const two = this.linkFit(wide, VH, phone, 2)
            if (one.natural < 36 && two.natural >= one.natural + 4) {
                cols = 2
                panelW = wide
            }
        }
        const baseScale = clamp(num(p.page.scale, 0.86), 0.6, 0.98)
        const s = phone ? Math.min(0.97, baseScale + 0.05) : tablet ? Math.min(0.97, baseScale + 0.02) : baseScale
        const gap = phone ? 0 : spines ? links * step + pull + 32 : 44
        let tx: number
        if (side === 1) {
            const edge = phone ? 60 : VW - panelW - gap
            tx = edge - (PL + PW / 2 + (PW * s) / 2)
        } else {
            const edge = phone ? VW - 60 : panelW + gap
            tx = edge - (PL + PW / 2 - (PW * s) / 2)
        }
        const ry = phone ? 0 : side * clamp(num(p.page.tilt, 5), 0, 18)
        this.geo = {
            VW,
            VH,
            PL,
            PW,
            top,
            bottom,
            phone,
            tablet,
            side,
            panelW,
            s,
            tx,
            ry,
            persp: Math.max(1200, VW * 1.35),
            r: clamp(pad4(p.page.radius, [20, 20, 20, 20])[0], 0, 80),
            n: links,
            step,
            pull,
            spines,
            cols,
        }
        this.layoutStatic()
    }

    /** Values that only change with geometry, not per frame. */
    layoutStatic() {
        const g = this.geo
        if (!g) return
        const p = this.get()
        const target = this.saved ? this.saved.target : null
        if (target && !this.reduced) {
            target.style.transformOrigin = `${g.PW / 2}px ${g.top + g.VH / 2}px`
        }
        const place = (el: HTMLElement | null | undefined) => {
            if (!el) return
            el.style.left = g.PL + "px"
            el.style.width = g.PW + "px"
            el.style.height = g.VH + "px"
            el.style.transformOrigin = `${g.PW / 2}px ${g.VH / 2}px`
        }
        place(this.els.catcher)
        place(this.els.shadow)
        // radii are fixed per geometry: blurred shadows and sheets are not re-rasterized every frame
        if (this.els.shadow) this.els.shadow.style.borderRadius = (g.r / Math.max(0.4, g.s)).toFixed(2) + "px"
        const catcher = this.els.catcher
        if (catcher) {
            // a thin top rim lifts the card off a dark stage
            const edge = p.page.border || D.page.border || "transparent"
            catcher.style.boxShadow = this.reduced
                ? `inset 0 0 0 1px ${edge}`
                : `inset 0 1px 0 0 ${withAlpha(edge, 1.8)}, inset 0 0 0 1px ${edge}`
        }
        this.els.spines.forEach((el) => place(el))
        this.els.spines.forEach((el, i) => {
            if (!el) return
            const k = 1 - (i + 1) * 0.026
            const sc = g.s * k
            el.style.borderRadius = (g.r / Math.max(0.4, sc)).toFixed(2) + "px"
            const label = el.firstElementChild as HTMLElement | null
            if (label) {
                label.style.width = 44 / sc + "px"
                label.style.fontSize = 12 / sc + "px"
                label.style.right = g.side === 1 ? "0px" : "auto"
                label.style.left = g.side === 1 ? "auto" : "0px"
            }
            el.style.display = g.spines && i < g.n ? "block" : "none"
        })
        const back = this.els.back
        if (back) {
            // soft backlight just past the sheet stack, so the card stands in light (dark stages only)
            const dark = luminance(p.menu.stage || D.menu.stage || "#101113") < 0.18
            const edge = g.PL + g.PW / 2 + g.side * ((g.PW * g.s) / 2) + g.tx + g.side * (g.spines ? g.n * g.step : 0)
            const rx = Math.round(Math.min(520, g.panelW * 0.85))
            const ry = Math.round(g.VH * 0.8)
            const a = this.pageDark ? 0.08 : 0.065
            const stops = [1, 0.72, 0.46, 0.25, 0.1, 0.025, 0]
                .map((f, i) => `rgba(255, 255, 255, ${(a * f).toFixed(4)}) ${Math.round((i / 6) * 100)}%`)
                .join(", ")
            back.style.backgroundImage =
                g.phone || this.reduced || !dark ? "none" : `radial-gradient(${rx}px ${ry}px at ${Math.round(edge)}px 48%, ${stops})`
        }
        const panel = this.els.panel
        if (panel) {
            panel.style.width = g.panelW + "px"
            panel.style.left = g.side === 1 ? "auto" : "0px"
            panel.style.right = g.side === 1 ? "0px" : "auto"
            panel.dataset.phone = g.phone ? "1" : "0"
        }
        this.placeClose()
        if (panel) this.fitLinks()
    }

    /** Link size for a panel: fits the longest label in the width and all rows in the height. */
    linkFit(panelW: number, VH: number, phone: boolean, cols: 1 | 2) {
        const p = this.get()
        const pad = pad4(p.menu.padding, [40, 56, 40, 56])
        const padX = phone ? Math.min(pad[1], 24) + Math.min(pad[3], 24) : pad[1] + pad[3]
        const innerW = panelW - padX
        const base = fontPx(p.menu.font, 56)
        const n = Math.max(1, p.links.length)
        const rows = Math.ceil(n / cols)
        const longest = p.links.reduce((m, l) => Math.max(m, (l.label || "").length), 4)
        const byWidth = (cols === 2 ? (innerW - 32) / 2 : innerW) / (longest * 0.56)
        const short = VH < 520
        const head = Math.max(phone ? 20 : pad[0], short ? 64 : 80)
        const footEl = this.els.panel ? (this.els.panel.querySelector(".stm-foot") as HTMLElement | null) : null
        const footH = p.footerLinks.length ? Math.max(footEl ? footEl.offsetHeight : 0, 34) + 14 : 0
        const foot = (phone ? 28 : short ? Math.min(pad[2], 16) : pad[2]) + footH
        const avail = VH - head - foot - (short ? 16 : 48)
        const byHeight = avail / (rows * 1.14)
        const natural = Math.min(base, byWidth, byHeight, phone ? 44 : base)
        return { size: Math.max(22, natural), natural, rows }
    }

    fitLinks() {
        const g = this.geo
        const p = this.get()
        const list = this.els.list
        const panel = this.els.panel
        if (!g || !list || !panel) return
        const f = this.linkFit(g.panelW, g.VH, g.phone, g.cols)
        list.dataset.cols = String(g.cols)
        list.style.setProperty("--stm-rows", String(f.rows))
        list.style.setProperty("--stm-size", f.size.toFixed(1) + "px")
        // the current-page dot hangs in the left padding (label column stays flush) when it fits there
        const pad = pad4(p.menu.padding, [40, 56, 40, 56])
        const pl = g.phone ? Math.min(pad[3], 24) : pad[3]
        list.dataset.hang = g.cols === 1 && (pl - f.size * 0.13) / 2 >= 6 ? "1" : "0"
        const nav = list.parentElement
        if (nav) nav.style.padding = g.VH < 520 ? "4px 0 12px" : "8px 0 32px"
    }

    /** Hold the trigger on its home spot (screen), whatever the card does underneath; off: its own values back. */
    pinTrigger(on: boolean) {
        const s = this.saved
        const trig = this.els.trigger
        const a = this.anchor
        if (!s || !trig) return
        const [t0, s0, o0] = s.trigPin
        const put = (p: string, v: string) => (v ? trig.style.setProperty(p, v) : trig.style.removeProperty(p))
        put("translate", t0)
        put("scale", s0)
        put("transform-origin", o0)
        this.trigPinned = false
        if (!on || !a) return
        const r = trig.getBoundingClientRect()
        const h = trig.offsetHeight
        if (!r.height || !h) return
        // the card's scale at the trigger; the trigger keeps its right edge + middle, at full size
        const k = r.height / h
        const dx = (window.innerWidth - a.right - r.right) / k
        const dy = (a.top + a.h / 2 - (r.top + r.height / 2)) / k
        trig.style.transformOrigin = "100% 50%"
        trig.style.translate = `${dx.toFixed(2)}px ${dy.toFixed(2)}px`
        trig.style.scale = (1 / k).toFixed(5)
        this.trigPinned = true
    }
    /** Opacity of a button's contents (label + icon); -1 hands it back to the stylesheet. */
    fadeKids(btn: HTMLElement, o: number) {
        const val = o < 0 ? "" : o.toFixed(3)
        for (const el of Array.from(btn.children) as HTMLElement[]) if (el.style.opacity !== val) el.style.opacity = val
    }
    /** Close begins in the trigger's own fill + ink and eases into its stage look (t = 1); fill = how much of its pill shows. */
    tintClose(t: number, fill = 1) {
        const close = this.els.close
        const look = this.saved ? this.saved.trigLook : null
        if (!close) return
        if (!this.closeLook)
            this.closeLook = [
                close.style.getPropertyValue("--stm-close-bg"),
                close.style.getPropertyValue("--stm-close-ink"),
                close.style.getPropertyValue("--stm-close-ring"),
                close.style.getPropertyValue("--stm-close-bg-h"),
            ]
        const [bg, fg, ring, bgh] = this.closeLook
        if ((t >= 1 && fill >= 1) || !look) {
            if (this.closeTinted) {
                close.style.setProperty("--stm-close-bg", bg)
                close.style.setProperty("--stm-close-ink", fg)
                close.style.setProperty("--stm-close-ring", ring)
                close.style.setProperty("--stm-close-bg-h", bgh)
                close.style.removeProperty("transition")
                this.closeTinted = false
            }
            return
        }
        const pc = (t * 100).toFixed(1)
        const fa = (clamp01(fill) * 100).toFixed(1)
        // driven per frame: the stylesheet's color easing would trail behind (and cover the label underneath)
        if (!this.closeTinted) close.style.transition = "transform 160ms ease, box-shadow 160ms ease"
        close.style.setProperty("--stm-close-bg", `color-mix(in srgb, color-mix(in srgb, ${bg} ${pc}%, ${look[0]}) ${fa}%, transparent)`)
        // under the pointer: the trigger's hover light (a 7 % white veil) on the way in, Close's own hover on the way out
        close.style.setProperty(
            "--stm-close-bg-h",
            `color-mix(in srgb, color-mix(in srgb, ${bgh} ${pc}%, color-mix(in srgb, #fff 7%, ${look[0]})) ${fa}%, transparent)`
        )
        close.style.setProperty("--stm-close-ink", `color-mix(in srgb, ${fg} ${pc}%, ${look[1]})`)
        close.style.setProperty("--stm-close-ring", ring && ring !== "none" ? `inset 0 0 0 1px color-mix(in srgb, ${ring.replace(/^inset 0 0 0 1px /, "")} ${pc}%, transparent)` : ring)
        this.closeTinted = true
    }

    placeClose() {
        const g = this.geo
        const close = this.els.close
        if (!g || !close) return
        const p = this.get()
        const pad = pad4(p.menu.padding, [40, 56, 40, 56])
        const pt = g.phone ? Math.min(pad[0], 20) : pad[0]
        const pr = g.phone ? Math.min(pad[1], 24) : pad[1]
        const pb = g.phone ? Math.min(pad[2], 28) : g.VH < 520 ? Math.min(pad[2], 16) : pad[2]
        const pl = g.phone ? Math.min(pad[3], 24) : pad[3]
        const cw = close.offsetWidth || 96
        const ch = close.offsetHeight || 44
        const panelLeft = g.side === 1 ? g.VW - g.panelW : 0
        const panelRight = panelLeft + g.panelW
        const a = this.anchor
        let x: number
        let y: number
        // keep the button exactly where the trigger was, so it reads as the same control
        const ax = a ? g.VW - a.right - cw : -1
        this.anchorMatched = !!a && ax >= panelLeft + 8 && ax + cw <= panelRight + 1 && a.top >= 0 && a.top < g.VH * 0.3
        if (a && this.anchorMatched) {
            x = ax
            y = a.top + (a.h - ch) / 2
        } else {
            const inset = Math.max(16, pr - 8)
            x = panelRight - inset - cw
            y = Math.max(16, pt - 8)
        }
        const target = this.saved ? this.saved.target : null
        const look = this.saved ? this.saved.trigLook : null
        this.swapOn = !!(a && this.anchorMatched && target && !this.reduced && look && close.dataset.canSwap === "1")
        if (this.swapOn && a && look) {
            // anchored by its right edge like the trigger, so the pill can change width (Menu ↔ Close) in place
            close.style.left = "auto"
            close.style.right = a.right + "px"
            close.style.setProperty("--stm-trig-bg", look[0])
            close.style.setProperty("--stm-trig-ink", look[1])
            const sw = close.querySelector<HTMLElement>(".stm-swap")
            if (sw) {
                const [wm, wc] = Array.from(sw.children).map((el) => Math.ceil((el as HTMLElement).scrollWidth))
                close.style.setProperty("--stm-w-menu", (wm || 0) + "px")
                close.style.setProperty("--stm-w-close", (wc || 0) + "px")
            }
            close.setAttribute("data-swapping", "")
        } else {
            close.style.right = "auto"
            close.style.left = Math.round(x) + "px"
            close.removeAttribute("data-swapping")
            close.setAttribute("data-swap", "close")
        }
        close.style.top = Math.round(y) + "px"
        this.closeBox = [Math.round(x), cw]
        const panel = this.els.panel
        if (panel) {
            const top = Math.max(pt, y + ch + 16)
            panel.style.padding = `${top}px ${pr}px ${pb}px ${pl}px`
            panel.style.setProperty("--stm-pl", pl + "px")
            panel.style.setProperty("--stm-head-top", Math.round(y) + "px")
            panel.style.setProperty("--stm-head-h", ch + "px")
        }
    }

    // ---- frame
    frame() {
        const g = this.geo
        if (!g) return
        const v = this.main.value
        // past the open position the card eases into a soft limit instead of a hard stop
        const u = v > 1 ? 1 + 0.08 * Math.tanh((v - 1) / 0.08) : Math.max(0, v)
        const p01 = clamp01(v)
        const props = this.get()
        const target = this.saved ? this.saved.target : null
        const move = !!target && !this.reduced
        const sc = 1 + (g.s - 1) * u
        const tx = g.tx * u
        const ry = g.ry * u
        const rl = (g.r * p01) / Math.max(0.4, sc)
        const tf = `perspective(${g.persp.toFixed(0)}px) translate3d(${tx.toFixed(2)}px, 0px, 0px) scale(${sc.toFixed(5)}) rotateY(${ry.toFixed(3)}deg)`
        if (move && target) {
            // section preview: the page scrolls inside the card (content up, visible window down by the same amount)
            const pk = Math.abs(this.peek.value) < 0.01 ? 0 : this.peek.value
            target.style.transform = pk ? `${tf} translate3d(0px, ${(-pk).toFixed(2)}px, 0px)` : tf
            const clip = `inset(${Math.max(0, g.top + pk).toFixed(2)}px 0px ${Math.max(0, g.bottom - pk).toFixed(2)}px 0px round ${rl.toFixed(2)}px)`
            target.style.setProperty("clip-path", clip)
            target.style.setProperty("-webkit-clip-path", clip)
            if (this.saved && (this.saved.fixed.length || this.saved.sticky.length) && Math.abs(this.peek.value - this.peekSynced) > 0.01)
                this.syncFixed()
        }
        const catcher = this.els.catcher
        if (catcher) {
            catcher.style.transform = move ? tf : "none"
            catcher.style.borderRadius = (move ? rl : 0).toFixed(2) + "px"
            catcher.style.opacity = String(p01 * (1 - 0.45 * clamp01(this.hoverDim.value)))
            catcher.style.pointerEvents = this.main.target === 1 ? "auto" : "none"
        }
        const shadow = this.els.shadow
        if (shadow) {
            shadow.style.transform = tf
            shadow.style.opacity = move ? String(p01) : "0"
        }
        // the card's outer edge and the edge of the sheet stack (the panel and Close are uncovered there)
        const cardEdge = g.PL + g.PW / 2 + g.side * ((g.PW * sc) / 2) + tx
        const outer = cardEdge + g.side * (g.spines ? g.n * g.step * p01 : 0)
        // spines: one sheet per link behind the page card
        if (g.spines && move) {
            const stage = props.menu.stage || D.menu.stage || "#101113"
            for (let i = 0; i < g.n; i++) {
                const el = this.els.spines[i]
                if (!el) continue
                const sp = clamp01((v - 0.1 - i * 0.035) / 0.55)
                const pull = this.pulls[i] ? clamp(this.pulls[i].value, -0.2, 1.3) : 0
                const k = 1 - (i + 1) * 0.026
                const sci = sc * k
                // a pulled sheet always clears the whole stack by Pull, whichever link it belongs to
                const expose = sp * (i + 1) * g.step + pull * (g.pull + (g.n - 1 - i) * g.step) * p01
                const edge = cardEdge + g.side * expose
                const cx = edge - g.side * ((g.PW * sci) / 2)
                const txi = cx - (g.PL + g.PW / 2)
                el.style.transform = `perspective(${g.persp.toFixed(0)}px) translate3d(${txi.toFixed(2)}px, 0px, 0px) scale(${sci.toFixed(5)}) rotateY(${ry.toFixed(3)}deg)`
                el.style.opacity = String(clamp01(sp * 1.6))
                // deeper sheets sit in shade; the pulled one comes into full light
                const shade = Math.min(0.3, 0.12 + 0.045 * i) * (1 - clamp01(pull)) * p01
                el.style.backgroundColor = mixColor(tintOf(props.links[i], i), stage, shade)
                const label = el.firstElementChild as HTMLElement | null
                if (label && props.spines.labels) label.style.opacity = String(clamp01(pull * 1.4 - 0.25))
            }
        }
        // the trigger hands over to Close in place; on phone the whole header leaves the peeking card
        const s = this.saved
        const trig = this.els.trigger
        // Menu and Close cross in one spot: the trigger rides on the card, so it is held at its home spot while they cross
        const pinned = move && this.anchorMatched && !!this.anchor && !this.swapOn
        const hand = this.reduced ? p01 : smooth(clamp01(v / (pinned ? HANDOFF : 0.035)))
        if (s && trig && this.swapOn) {
            // Close has taken the trigger's place and look: the trigger rests hidden until the card is home
            if (trig.style.opacity !== "0") trig.style.opacity = "0"
            if (s.head)
                s.head.style.opacity = g.phone ? (1 - (this.reduced ? p01 : smooth(clamp01(v / 0.3)))).toFixed(3) : s.headOpacity
        } else if (s && trig) {
            this.pinTrigger(pinned && hand < 1 && v > 0)
            // held in place, the trigger stays solid under Close (which starts in its colors): only the labels cross
            trig.style.opacity = pinned ? (hand >= 1 ? "0" : "1") : (1 - hand).toFixed(3)
            // only the contents cross: Menu's label + lines leave while Close's arrive on one unchanging pill
            const crossing = pinned && hand > 0 && hand < 1
            // overlapping, so the label never reads empty in the middle
            this.fadeKids(trig, crossing ? clamp01((1 - hand) * 1.3) : -1)
            if (this.els.close) this.fadeKids(this.els.close, crossing ? clamp01(hand * 1.3) : -1)
            // phone: the header leaves only after Menu has handed over (a fading header would thin the crossing labels)
            const lead = pinned ? HANDOFF : 0
            if (s.head)
                s.head.style.opacity = g.phone ? (1 - (this.reduced ? p01 : smooth(clamp01((v - lead) / 0.3)))).toFixed(3) : s.headOpacity
        }
        const close = this.els.close
        if (close && this.swapOn) {
            if (close.style.opacity !== "1") close.style.opacity = "1"
        } else if (close) {
            if (!move || this.anchorMatched) {
                // held handoff: Close's pill is fully there (its fill rises over the identical trigger pill), its contents fade
                close.style.opacity = pinned && hand > 0 ? "1" : (move ? hand : p01).toFixed(3)
                this.tintClose(pinned ? smooth(clamp01(v / (HANDOFF * 2.4))) : 1, pinned ? hand : 1)
            }
            else {
                // Close elsewhere: it appears once the stage under it is uncovered, never over the card
                const [cx, cw] = this.closeBox
                const open = g.side === 1 ? (cx + cw - outer) / cw : (outer - cx) / cw
                close.style.opacity = (smooth(clamp01(open)) * clamp01(v / 0.2)).toFixed(3)
            }
        }
        // panel content arrives in a short cascade, and leaves in reverse
        const count = this.items.length
        // the whole cascade always completes before the spring settles
        const per = Math.min(clamp(num(props.motion.stagger, 0.05), 0, 0.2), 0.32 / Math.max(1, count - 1))
        const shift = this.reduced ? 0 : 24
        for (let k = 0; k < count; k++) {
            const el = this.items[k]
            const order = num(el.dataset.stmItem, k)
            const q = clamp01((v - 0.22 - order * per) / 0.42)
            el.style.opacity = String(q)
            // a layer only while moving: at rest the text is painted crisp on whole pixels
            el.style.transform = shift && q < 1 ? `translate3d(${(g.side * shift * (1 - q)).toFixed(2)}px, 0px, 0px)` : "none"
            const wc = shift && q > 0 && q < 1 ? "transform, opacity" : "auto"
            if (el.style.willChange !== wc) el.style.willChange = wc
        }
        if (this.closeLines.length === 2) {
            // the lines meet while Close is still faint, then turn into the X
            // rolling over: the icon keeps time with the word (its own clock); otherwise it follows the card
            const lv = this.swapOn ? this.lines.value : v
            const mm = this.reduced ? 1 : this.swapOn ? smooth(clamp01(lv / 0.38)) : smooth(clamp01((v - 0.1) / 0.16))
            const r = this.reduced
                ? 1
                : 1 - Math.pow(1 - clamp01(this.swapOn ? (lv - 0.28) / 0.72 : (v - 0.24) / 0.34), 3)
            this.closeLines[0].setAttribute("transform", `rotate(${(45 * r).toFixed(2)} 12 12) translate(0 ${(3.5 * mm).toFixed(2)})`)
            this.closeLines[1].setAttribute("transform", `rotate(${(-45 * r).toFixed(2)} 12 12) translate(0 ${(-3.5 * mm).toFixed(2)})`)
            // a trigger opened from hover hands over its short lower line, which grows back while the lines meet
            const len = this.hoverShort ? 0.55 + 0.45 * mm : 1
            this.closeLines[1].setAttribute("x2", (5 + 14 * len).toFixed(2))
        }
        const panel = this.els.panel
        if (panel) {
            const sheet = this.reduced || !target
            panel.style.backgroundColor = sheet ? props.menu.stage || D.menu.stage || "#101113" : "transparent"
            panel.style.opacity = sheet ? String(p01) : "1"
            if (sheet) {
                panel.style.clipPath = "none"
            } else {
                // the menu is uncovered by the page sliding away, never drawn on top of it
                const panelLeft = g.side === 1 ? g.VW - g.panelW : 0
                const reveal = g.side === 1 ? clamp(outer - panelLeft, 0, g.panelW) : clamp(g.panelW - outer, 0, g.panelW)
                panel.style.clipPath =
                    g.side === 1 ? `inset(0px 0px 0px ${reveal.toFixed(1)}px)` : `inset(0px ${reveal.toFixed(1)}px 0px 0px)`
            }
        }
        const back = this.els.back
        if (back) back.style.visibility = move ? "visible" : "hidden"
    }

    // ---- loop
    kick() {
        if (this.raf) return
        this.last = performance.now()
        this.raf = requestAnimationFrame(this.tick)
    }
    tick = (now: number) => {
        this.raf = 0
        const dt = Math.min(0.05, Math.max(0.001, (now - this.last) / 1000))
        this.last = now
        const m = this.main
        if (!this.drag) m.step(dt)
        // closing lands flush at home: no overshoot past full screen
        if (!this.drag && m.target === 0 && m.value <= 0) {
            m.value = 0
            m.velocity = 0
        }
        const ln = this.lines
        if (this.swapOn) {
            ln.step(dt)
            if (ln.resting) ln.snap()
        }
        const hd = this.hoverDim
        hd.target = this.catcherHover && m.target === 1 ? 1 : m.target === 0 ? hd.target : 0
        hd.step(dt)
        let busy = !this.drag && !m.resting
        if (this.swapOn && !ln.resting) busy = true
        if (!hd.resting) busy = true
        else hd.snap()
        for (let i = 0; i < this.pulls.length; i++) {
            const s = this.pulls[i]
            s.target = i === this.hover && m.target === 1 ? 1 : 0
            s.step(dt)
            if (!s.resting) busy = true
            else s.snap()
        }
        const pk = this.peek
        const g = this.geo
        let peekDone = true
        if (this.peekLinked && m.target === 0 && !this.drag) {
            // closing: the preview follows the card's own progress
            this.linkPeek()
        } else {
            // a speed limit: several screens glide by at ~110 px per frame at most, never as a smear
            pk.step(dt, 6500)
            // the preview spring rests in px: a quarter pixel is still
            peekDone = Math.abs(pk.value - pk.target) < 0.25 && Math.abs(pk.velocity) < 2
            if (!peekDone) busy = true
            else pk.snap()
        }
        if (!busy && !this.drag && m.resting) m.snap()
        // release the page as soon as the remaining motion is below a pixel (energy, not value)
        if (!this.drag && this.prepared && m.target === 0 && g && peekDone) {
            const travel = this.reduced ? 255 : Math.abs(g.tx) + (g.VW * (1 - g.s)) / 2
            const rest = Math.hypot(m.value, m.velocity / Math.sqrt(m.k))
            // linked content travels further than the card: both must be under a pixel
            const content = this.peekLinked ? (rest * Math.abs(this.peekFrom - this.peekTo)) / this.mFrom : 0
            // the icon is back to the Menu lines too, so the trigger takes over in the very same shape
            if (rest * travel < 0.75 && content < 0.75 && (!this.swapOn || ln.value < 0.01)) {
                m.snap()
                if (this.peekLinked) this.linkPeek()
                this.frame()
                this.teardown()
                return
            }
        }
        this.frame()
        if (this.drag) {
            // the card follows the pointer; preview, sheet pulls and dim keep animating underneath
            if (busy) this.raf = requestAnimationFrame(this.tick)
            return
        }
        if (busy) {
            this.raf = requestAnimationFrame(this.tick)
            return
        }
        if (m.target === 0 && this.prepared) this.teardown()
    }

    /** Pointer moving over the list: a pending preview waits until the pointer (nearly) rests. */
    listMove = (e: React.PointerEvent) => {
        if (e.pointerType !== "mouse") return
        const [x0, y0, t0] = this.hoverSample
        const t = evTime(e)
        this.hoverSample = [e.clientX, e.clientY, t]
        const speed = t > t0 ? Math.hypot(e.clientX - x0, e.clientY - y0) / (t - t0) : 0
        if (this.peekTimer && this.peekIntent && speed > 0.15 && this.hover >= 0) {
            const intent = this.peekIntent
            this.clearPeekTimer()
            const to = this.peekDelta(this.hover)
            const index = this.hover
            this.peekTimer = setTimeout(() => {
                this.peekTimer = 0
                this.peekIntent = 0
                if (this.committed || this.main.target !== 1 || to === null || this.hover !== index) return
                this.tunePeek(to)
                this.peek.target = to
                this.peekIndex = index
                this.emitGlass()
                this.kick()
            }, intent)
        }
    }
    /** Peek progress tied to the main spring while closing (from the value at close() to the landing spot). */
    linkPeek() {
        const m = this.main
        const k = clamp01(m.value / this.mFrom)
        if (!Number.isNaN(this.peekCut) && k < 0.85 && k > 0) {
            // rebase so the lerp continues from the cut point
            this.peekFrom = this.peekTo + (this.peekCut - this.peekTo) / k
            this.peekCut = NaN
        }
        this.peek.value = this.peekTo + (this.peekFrom - this.peekTo) * k
        this.peek.velocity = 0
    }

    /** opts.peek false: light the link and pull its sheet only (touch presses never move the card) */
    setHover(i: number, opts: { peek?: boolean; intent?: number; homeDelay?: number } = {}) {
        if (this.hover === i) return
        this.hover = i
        if (opts.peek !== false || i < 0) this.schedulePeek(i, opts.intent, opts.homeDelay)
        const list = this.els.list
        if (list) {
            list.classList.toggle("stm-dim", i >= 0)
            Array.from(list.children).forEach((li, k) => li.classList.toggle("is-hot", k === i))
        }
        this.kick()
    }

    // touch has no hover: a press lights its link and pulls its sheet (after 100 ms, so scrolling never lights)
    pressStart(i: number, x: number, y: number) {
        this.pressStop()
        const t = this.press
        t.i = i
        t.x = x
        t.y = y
        t.timer = setTimeout(this.pressLight, 100)
    }
    pressLight = () => {
        const t = this.press
        if (t.i >= 0 && this.main.target === 1) {
            t.lit = true
            this.setHover(t.i, { peek: false })
        }
    }
    pressMove(x: number, y: number) {
        const t = this.press
        if (t.i >= 0 && Math.hypot(x - t.x, y - t.y) > 10) this.pressStop()
    }
    pressEnd() {
        const t = this.press
        if (t.i < 0) return
        if (t.timer) clearTimeout(t.timer)
        if (!t.lit) this.pressLight()
        t.timer = setTimeout(() => this.pressStop(), 260)
    }
    pressStop() {
        const t = this.press
        if (t.timer) clearTimeout(t.timer)
        t.timer = 0
        if (t.lit && this.hover === t.i) this.setHover(-1)
        t.i = -1
        t.lit = false
    }

    // ---- events
    onResize = () => {
        if (!this.prepared) return
        this.measure()
        const s = this.saved
        const t = s ? s.target : null
        if (t && !this.reduced) {
            // sections move with the new layout: read them untransformed, then aim the preview again
            const tf = t.style.transform
            t.style.transform = "none"
            this.measureSections(t)
            t.style.transform = tf
            const d = this.committed || this.canPeek() ? this.peekDelta(this.peekIndex) : null
            this.peek.target = d === null ? 0 : d
            if (d === null) this.peekIndex = -1
            if (this.peekLinked) this.peekTo = this.peek.target
        }
        this.measureFixed()
        this.frame()
        this.kick()
    }
    onPageShow = (e: PageTransitionEvent) => {
        if (!e.persisted || !this.prepared) return
        this.main.target = 0
        this.main.snap()
        this.teardown()
    }
    onScroll = () => {
        // something scrolled the window anyway (e.g. a smooth-scroll library): follow it
        if (!this.prepared || Math.abs(window.scrollY - this.scrollY) < 1) return
        const ds = window.scrollY - this.scrollY
        this.scrollY = window.scrollY
        this.measure()
        if (!this.reduced && this.peekIndex >= 0 && !this.peekLinked) {
            // keep showing the same section: the window moved, so the preview offset moves the other way
            const d = this.peekDelta(this.peekIndex)
            if (d !== null) {
                this.peek.target = d
                this.peek.value -= ds
            } else {
                this.peek.target = 0
                this.peekIndex = -1
            }
            this.kick()
        }
        this.syncFixed()
        this.frame()
    }
    onKey = (e: KeyboardEvent) => {
        if (!this.prepared || this.main.target !== 1) return
        if (e.key === "Escape") {
            e.preventDefault()
            e.stopPropagation()
            this.close()
            return
        }
        // leave browser and OS tab shortcuts alone
        if (e.key !== "Tab" || e.ctrlKey || e.metaKey) return
        const dialog = this.els.dialog
        if (!dialog) return
        const f = Array.from(
            dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"]')
        ).filter((el) => el.offsetParent !== null || el.getClientRects().length > 0)
        if (!f.length) {
            e.preventDefault()
            return
        }
        // move focus ourselves: the same cycle in every browser (Safari's default Tab skips links)
        e.preventDefault()
        const a = document.activeElement as HTMLElement | null
        const i = a ? f.indexOf(a) : -1
        const next = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : i < 0 || i >= f.length - 1 ? 0 : i + 1
        f[next].focus()
    }

    // swipe / drag the page card back into place
    onCatcherDown = (e: React.PointerEvent) => {
        if (!this.geo || this.main.target !== 1) return
        if (e.button !== 0) return
        try {
            ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        } catch {
            // synthetic or already released pointers cannot be captured; dragging still works
        }
        this.drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, v0: this.main.value, samples: [[evTime(e), e.clientX]], moved: false }
    }
    /** Release velocity in px/ms from the last 100 ms only; 0 when the finger rested before lifting. */
    releaseVelocity(d: NonNullable<StageEngine["drag"]>, x: number, now: number) {
        const s = d.samples.filter(([t]) => now - t <= 100)
        const last = d.samples[d.samples.length - 1]
        if (!last || now - last[0] > 60 || s.length < 2) return 0
        const first = s[0]
        return (x - first[1]) / Math.max(16, now - first[0])
    }
    onCatcherMove = (e: React.PointerEvent) => {
        const d = this.drag
        const g = this.geo
        if (!d || !g || d.id !== e.pointerId) return
        const now = evTime(e)
        const dx = e.clientX - d.x0
        // a tap is a short press in both axes; a vertical swipe on the card is not a tap
        if (Math.hypot(dx, e.clientY - d.y0) > 8) d.moved = true
        // Reduce Motion: a tap still closes, but the card never follows the pointer
        if (this.reduced) return
        const travel = Math.max(80, Math.abs(g.tx))
        // dragging toward the closed position (opposite of tx) lowers progress
        const toward = -Math.sign(g.tx || -1) * dx
        // past the open position the card resists like a rubber band
        const raw = d.v0 - toward / travel
        this.main.value = raw > 1 ? 1 + 0.1 * (1 - 1 / (((raw - 1) * 0.55) / 0.1 + 1)) : Math.max(0, raw)
        this.main.velocity = 0
        d.samples.push([now, e.clientX])
        if (d.samples.length > 12) d.samples.shift()
        this.frame()
    }
    onCatcherUp = (e: React.PointerEvent) => {
        const d = this.drag
        const g = this.geo
        if (!d || d.id !== e.pointerId) return
        this.drag = null
        if (!d.moved || !g || this.reduced) {
            if (!d.moved || !g) this.close()
            return
        }
        const travel = Math.max(80, Math.abs(g.tx))
        const towardV = -Math.sign(g.tx || -1) * this.releaseVelocity(d, e.clientX, evTime(e)) // px per ms toward closed
        const shouldClose = this.main.value < 0.62 || towardV > 0.45
        // keep the fling, but never throw the card past home or far past open
        this.main.velocity = clamp((-towardV * 1000) / travel, -8, shouldClose ? 0 : 1.5)
        if (shouldClose) {
            this.close()
            return
        }
        this.main.target = 1
        this.tune()
        this.kick()
    }
    // touch: swiping the menu back toward its side closes it, like a drawer
    swipe: { id: number; x0: number; y0: number; v0: number } | null = null
    onPanelDown = (e: React.PointerEvent) => {
        if (e.pointerType === "mouse" || !this.geo || this.reduced || this.main.target !== 1) return
        this.swipe = { id: e.pointerId, x0: e.clientX, y0: e.clientY, v0: this.main.value }
    }
    onPanelMove = (e: React.PointerEvent) => {
        if (e.pointerType !== "mouse") this.pressMove(e.clientX, e.clientY)
        const w = this.swipe
        if (w && !this.drag && w.id === e.pointerId) {
            const dx = e.clientX - w.x0
            const dy = e.clientY - w.y0
            const g = this.geo
            const toward = g ? -Math.sign(g.tx || -1) * dx : 0
            if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) {
                this.swipe = null
                return
            }
            if (toward > 12 && Math.abs(dx) > Math.abs(dy) * 1.2) {
                try {
                    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
                } catch {
                    // ignore
                }
                this.drag = { id: e.pointerId, x0: w.x0, y0: w.y0, v0: w.v0, samples: [[evTime(e), e.clientX]], moved: true }
            }
        }
        if (this.drag && this.drag.id === e.pointerId) this.onCatcherMove(e)
    }
    onPanelUp = (e: React.PointerEvent) => {
        this.swipe = null
        if (this.drag && this.drag.id === e.pointerId) this.onCatcherUp(e)
    }
    onCatcherEnter = (e: React.PointerEvent) => {
        if (e.pointerType === "touch") return
        this.catcherHover = true
        this.kick()
    }
    onCatcherLeave = () => {
        this.catcherHover = false
        this.kick()
    }
    onCatcherCancel = () => {
        if (!this.drag) return
        this.drag = null
        this.main.target = 1
        this.kick()
    }

    // ---- teardown
    teardown(notify = true) {
        if (!this.prepared) return
        const s = this.saved
        cancelAnimationFrame(this.raf)
        this.raf = 0
        window.removeEventListener("resize", this.onResize)
        window.removeEventListener("scroll", this.onScroll)
        window.removeEventListener("pageshow", this.onPageShow)
        document.removeEventListener("keydown", this.onKey, true)
        if (s) {
            const html = document.documentElement
            html.style.overflow = s.htmlOverflow
            html.style.paddingRight = s.htmlPadding
            const t = s.target
            if (t) {
                for (const p of TARGET_PROPS) {
                    const val = s.style[p]
                    if (val) t.style.setProperty(p, val)
                    else t.style.removeProperty(p)
                }
                t.inert = s.inert
            }
            for (const f of s.fixed) {
                for (const [p, v] of [
                    ["translate", f.translate],
                    ["width", f.width],
                    ["height", f.height],
                ] as const) {
                    if (v) f.el.style.setProperty(p, v)
                    else f.el.style.removeProperty(p)
                }
            }
            for (const r of s.sticky) {
                if (r.translate) r.el.style.setProperty("translate", r.translate)
                else r.el.style.removeProperty("translate")
            }
            if (s.fixed.length || s.sticky.length) {
                // settle the restored values before the site's transitions come back, so nothing animates home
                void document.documentElement.offsetWidth
                for (const f of [...s.fixed, ...s.sticky]) {
                    if (f.transition) f.el.style.setProperty("transition", f.transition)
                    else f.el.style.removeProperty("transition")
                }
            }
            const trig = this.els.trigger
            if (trig) {
                trig.style.opacity = s.trigOpacity
                this.pinTrigger(false)
                this.fadeKids(trig, -1)
                // the hovered look stays until the pointer really leaves the trigger (no flick while hover is re-read)
                if (trig.hasAttribute("data-stm-hover")) {
                    const off = () => trig.removeAttribute("data-stm-hover")
                    requestAnimationFrame(() =>
                        requestAnimationFrame(() => {
                            let over = false
                            try {
                                over = trig.matches(":hover")
                            } catch {
                                over = false
                            }
                            if (over) trig.addEventListener("pointerleave", off, { once: true })
                            else off()
                        })
                    )
                }
            }
            this.tintClose(1)
            this.closeLook = null
            if (s.head) s.head.style.opacity = s.headOpacity
            // a chosen section: the card already shows it, so the window jumps there in the same frame (no visible scroll)
            if (this.committed && Math.abs(this.peek.target) >= 0.5) {
                const sb = html.style.scrollBehavior
                html.style.scrollBehavior = "auto"
                window.scrollTo(window.scrollX, Math.round(window.scrollY + this.peek.target))
                html.style.scrollBehavior = sb
            }
        }
        // where focus goes after a section link: into that section, like a native in-page link
        const links = this.get().links
        const land = this.committed && this.peekIndex >= 0 && links[this.peekIndex] ? sectionOf(links[this.peekIndex].link) : null
        this.clearPeekTimer()
        this.committed = false
        this.peekLinked = false
        this.peekCut = NaN
        this.peekIndex = -1
        this.peek.value = 0
        this.peek.velocity = 0
        this.peek.target = 0
        this.peekSynced = 0
        this.pressStop()
        this.catcherHover = false
        this.hoverDim.value = 0
        this.hoverDim.velocity = 0
        this.hoverDim.target = 0
        this.saved = null
        this.prepared = false
        this.drag = null
        this.hover = -1
        this.main.value = 0
        this.lines.value = 0
        this.lines.velocity = 0
        this.lines.target = 0
        this.main.velocity = 0
        this.main.target = 0
        for (const p of this.pulls) {
            p.value = 0
            p.velocity = 0
        }
        const hash = this.pendingHash
        this.pendingHash = null
        if (notify) this.onClosed()
        if (land) focusSection(land)
        if (hash && hash.hash) {
            const el = resolveId(hash.hash)
            if (el) {
                focusSection(el)
                const y = el.getBoundingClientRect().top + window.scrollY - this.landingOffset(el)
                window.scrollTo({ top: Math.max(0, y), behavior: this.reduced ? "auto" : "smooth" })
            }
        }
    }
    destroy() {
        this.clearPeekTimer()
        if (this.prepared) {
            this.main.target = 0
            this.teardown(false)
        }
        cancelAnimationFrame(this.raf)
        this.raf = 0
    }
}

/** Move focus into a section without scrolling (tabindex and outline are lent only until focus leaves). */
function focusSection(el: HTMLElement) {
    const lent = !el.hasAttribute("tabindex")
    const outline = el.style.outline
    if (lent) {
        el.setAttribute("tabindex", "-1")
        el.style.outline = "none"
        el.addEventListener(
            "blur",
            () => {
                el.removeAttribute("tabindex")
                el.style.outline = outline
            },
            { once: true }
        )
    }
    try {
        el.focus({ preventScroll: true })
    } catch {
        // focus is best effort
    }
}

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

// ---------------------------------------------------------------- icons

function LinesIcon({ color }: { color: string }) {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: "block" }}>
            <line className="stm-l1" x1="5" y1="8.5" x2="19" y2="8.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
            <line className="stm-l2" x1="5" y1="15.5" x2="19" y2="15.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    )
}

// ---------------------------------------------------------------- component

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 * @framerDisableUnlink
 */
export default function StageMenu(rawProps: StageMenuProps) {
    const props = {
        ...D,
        ...rawProps,
        logo: { ...D.logo, ...(rawProps.logo || {}) },
        button: { ...D.button, ...(rawProps.button || {}) },
        header: { ...D.header, ...(rawProps.header || {}) },
        menu: { ...D.menu, ...(rawProps.menu || {}) },
        page: { ...D.page, ...(rawProps.page || {}) },
        spines: { ...D.spines, ...(rawProps.spines || {}) },
        motion: { ...D.motion, ...(rawProps.motion || {}) },
        sections: { ...D.sections, ...(rawProps.sections || {}) },
        links: Array.isArray(rawProps.links) ? rawProps.links : D.links,
        footerLinks: Array.isArray(rawProps.footerLinks) ? rawProps.footerLinks : D.footerLinks,
    } as Required<StageMenuProps>
    const { style } = rawProps
    const isStatic = useIsStaticRenderer()
    const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const dialogId = "stm-dialog-" + uid

    const propsRef = React.useRef(props)
    propsRef.current = props
    const [mounted, setMounted] = React.useState(false)
    const [expanded, setExpanded] = React.useState(false)
    /** link of the section in view when the menu opened (-1: none) */
    const [active, setActive] = React.useState(-1)
    // header glass: scrolled + the tone behind the bar; while open, the card's target spot overrides both (virt)
    const [scrolled, setScrolled] = React.useState(false)
    const [tone, setTone] = React.useState<Tone>("light")
    const [virt, setVirt] = React.useState<{ y: number; tone: Tone | null } | null>(null)
    const readHeader = React.useRef<() => void>(() => {})
    const pinRef = React.useRef<"fixed" | "sticky" | null>(null)
    const rootRef = React.useRef<HTMLDivElement>(null)
    const wantOpen = React.useRef(false)
    const triggerRef = React.useRef<HTMLButtonElement>(null)
    const engineRef = React.useRef<StageEngine | null>(null)

    const engine = React.useMemo(() => {
        if (typeof window === "undefined") return null
        const e = new StageEngine(
            () => propsRef.current,
            () => {
                wantOpen.current = false
                // unmount the layers in the same frame the page is restored (no dark frame, no stale "mounted" gap);
                // the header reads the landed spot in the same commit, so nothing changes after landing
                flushSync(() => {
                    setMounted(false)
                    setExpanded(false)
                })
                // read the header once the stage layers are gone (still before the next paint); the landed state
                // replaces the card's state in one commit, so no transition starts from an in-between value
                flushSync(() => {
                    readHeader.current()
                    setVirt(null)
                })
                const t = triggerRef.current
                if (t) t.focus({ preventScroll: true })
            }
        )
        e.onClosing = () => {
            wantOpen.current = false
            setExpanded(false)
        }
        e.onGlass = (v) => setVirt(v)
        return e
    }, [])
    engineRef.current = engine

    React.useEffect(() => {
        return () => {
            if (engineRef.current) engineRef.current.destroy()
        }
    }, [])

    // the portal exists only while the menu is open or animating
    useIsoLayoutEffect(() => {
        const e = engineRef.current
        if (!e || !mounted || isStatic) return
        e.els.trigger = triggerRef.current
        if (wantOpen.current) e.open()
    }, [mounted, isStatic])

    // live control changes while open
    useIsoLayoutEffect(() => {
        const e = engineRef.current
        if (!e || !e.prepared) return
        e.cacheItems()
        e.measure()
        e.tune()
        e.frame()
    })

    // header glass: on once the window has scrolled and the bar is pinned (never in the static canvas render)
    const glassMode = props.header.glass || "Auto"
    const glassOn = !isStatic && glassMode !== "Off"
    React.useEffect(() => {
        const root = rootRef.current
        if (!glassOn || !root) {
            readHeader.current = () => {}
            setScrolled(false)
            return
        }
        let raf = 0
        const read = () => {
            raf = 0
            // while the menu is open the window is locked: the engine drives the header (virt)
            const e = engineRef.current
            if (e && e.prepared) return
            const r = root.getBoundingClientRect()
            // a bar that scrolls away with the page never turns into glass
            const on = !!pinRef.current && r.top >= -1 && r.bottom > 0 && window.scrollY > 8
            setScrolled(on)
            if (on && propsRef.current.header.glass !== "Light" && propsRef.current.header.glass !== "Dark") {
                const t = toneBehind(root)
                if (t) setTone(t)
            }
        }
        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(read)
        }
        const onResize = () => {
            pinRef.current = pinOf(root)
            onScroll()
        }
        pinRef.current = pinOf(root)
        readHeader.current = read
        read()
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onResize)
        return () => {
            readHeader.current = () => {}
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onResize)
            if (raf) cancelAnimationFrame(raf)
        }
    }, [glassOn])

    const openMenu = React.useCallback(() => {
        const e = engineRef.current
        if (!e || isStatic) return
        // read before the page turns into the card (a turn-around mid-close keeps the last value)
        if (!e.prepared) setActive(propsRef.current.sections.active === false ? -1 : sectionInView(propsRef.current.links))
        wantOpen.current = true
        setExpanded(true)
        if (!mounted) setMounted(true)
        else e.open()
    }, [mounted, isStatic])
    const closeMenu = React.useCallback(() => {
        const e = engineRef.current
        wantOpen.current = false
        setExpanded(false)
        if (e) e.close()
    }, [])

    const onLink = React.useCallback(
        (ev: React.MouseEvent, href: string | undefined, newTab: boolean | undefined, index = -1) => {
            const e = engineRef.current
            const p = propsRef.current
            if (!hasLink(href)) {
                ev.preventDefault()
                return
            }
            if (newTab) {
                if (p.menu.closeOnClick) closeMenu()
                return
            }
            const same = samePage(href as string)
            if (same && same.hash) {
                ev.preventDefault()
                // a footer link to a menu section uses that section's preview too
                if (index < 0)
                    index = p.links.findIndex((l) => {
                        const s = hasLink(l.link) ? samePage(l.link as string) : null
                        return !!s && s.hash === same.hash
                    })
                // a previewed section: the card carries it home; otherwise scroll there once the page is back
                if (e && !e.commit(index)) e.pendingHash = same
                closeMenu()
                return
            }
            if (same) {
                ev.preventDefault()
                closeMenu()
                return
            }
            if (p.menu.closeOnClick) wantOpen.current = false
        },
        [closeMenu]
    )

    // ---------------------------------------------------------- header (always rendered, static-safe)
    const hp = pad4(props.header.padding, [20, 32, 20, 32])
    const headerFont = fontCss(props.header.font, 17, 600)
    const smallFont = fontCss(props.menu.smallFont, 13, 500)
    // glass state shown now: while the menu is open the card's target spot decides (virt), else the real scroll
    const pinned = !!pinRef.current
    const glassy = glassOn && (virt && pinned ? virt.y > 8 : scrolled)
    const glassTone: Tone = glassMode === "Light" ? "light" : glassMode === "Dark" ? "dark" : (virt && virt.tone) || tone
    const glass = glassTone === "dark" ? GLASS_DARK : GLASS_LIGHT
    // on glass, inks keep their color unless they would vanish into it
    const logoColor = glassy ? inkOn(props.header.color || D.header.color!, glassTone) : props.header.color
    let btnFill = props.button.fill || "#111214"
    let btnColor = props.button.color || "#F5F5F7"
    if (glassy && ((glassTone === "dark" && luminance(btnFill) < 0.25) || (glassTone === "light" && luminance(btnFill) > 0.75))) {
        ;[btnFill, btnColor] = [btnColor, btnFill]
    }
    const showLabel = props.button.showLabel !== false && !!(props.button.label || "").trim()
    const logo = props.logo
    const logoType = logo.type || "Text"
    const logoInner =
        logoType === "Image" && logo.image && logo.image.src ? (
            <img
                src={logo.image.src}
                srcSet={logo.image.srcSet}
                alt={logo.image.alt || logo.text || ""}
                style={{ display: "block", height: clamp(num(logo.height, 28), 8, 120), width: "auto" }}
                draggable={false}
            />
        ) : logoType === "None" ? null : (
            <span className="stm-logo-text" style={{ ...headerFont, color: logoColor, whiteSpace: "nowrap" }}>
                {logo.text || "Studio"}
            </span>
        )

    const focusRing = props.focusRing || D.focusRing
    const css = `
.stm-root, .stm-root * , .stm-layer, .stm-layer * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
.stm-root { background-color: var(--stm-h-fill); transition: background-color 320ms cubic-bezier(.2,.8,.2,1), box-shadow 320ms cubic-bezier(.2,.8,.2,1), -webkit-backdrop-filter 320ms cubic-bezier(.2,.8,.2,1), backdrop-filter 320ms cubic-bezier(.2,.8,.2,1); }
.stm-root[data-scrolled="1"] { background-color: var(--stm-h-glass); -webkit-backdrop-filter: saturate(1.8) blur(20px); backdrop-filter: saturate(1.8) blur(20px); box-shadow: 0 1px 0 0 var(--stm-h-line); }
.stm-logo-text, .stm-btn.stm-trigger, .stm-trigger span { transition: color 320ms cubic-bezier(.2,.8,.2,1), background-color 320ms cubic-bezier(.2,.8,.2,1), transform 160ms ease, box-shadow 160ms ease; }
.stm-btn { appearance: none; border: 0; margin: 0; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; height: 44px; border-radius: 999px; font: inherit; user-select: none; -webkit-user-select: none; transition: transform 160ms ease, box-shadow 160ms ease, background-color 200ms ease; }
.stm-btn:active { transform: scale(0.97); }
.stm-btn:focus { outline: none; }
.stm-btn:focus-visible { box-shadow: 0 0 0 2px ${focusRing}; }
.stm-btn .stm-l1, .stm-btn .stm-l2 { transition: transform 460ms cubic-bezier(.22,1,.36,1), stroke 320ms cubic-bezier(.2,.8,.2,1); transform-box: fill-box; transform-origin: left center; }
@media (hover: hover) {
  .stm-trigger:hover .stm-l2, .stm-trigger[data-stm-hover] .stm-l2 { transform: scaleX(0.55); }
  .stm-trigger:hover, .stm-trigger[data-stm-hover] { box-shadow: inset 0 0 0 999px rgba(255, 255, 255, 0.07); }
  .stm-trigger:hover:focus-visible { box-shadow: 0 0 0 2px ${focusRing}, inset 0 0 0 999px rgba(255, 255, 255, 0.07); }
}
.stm-logo { text-decoration: none; display: inline-flex; align-items: center; min-height: 44px; border-radius: 10px; outline: none; }
.stm-logo:focus-visible { outline: 2px solid ${focusRing}; outline-offset: 4px; }
.stm-dialog { outline: none; }
.stm-close { color: var(--stm-close-ink); background-color: var(--stm-close-bg); box-shadow: var(--stm-close-ring, none); transition: background-color 440ms cubic-bezier(.22,1,.36,1), color 440ms cubic-bezier(.22,1,.36,1), box-shadow 440ms cubic-bezier(.22,1,.36,1), transform 160ms ease; }
.stm-close[data-swap="menu"][data-swapping] { background-color: var(--stm-trig-bg); color: var(--stm-trig-ink); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.09); }
.stm-swap { display: inline-grid; justify-items: start; align-items: center; height: 24px; overflow: hidden; width: var(--stm-w-close, auto); transition: width 440ms cubic-bezier(.22,1,.36,1); -webkit-mask-image: linear-gradient(180deg, transparent, #000 16%, #000 84%, transparent); mask-image: linear-gradient(180deg, transparent, #000 16%, #000 84%, transparent); }
.stm-swap > span { grid-area: 1 / 1; white-space: nowrap; transition: transform 440ms cubic-bezier(.22,1,.36,1), opacity 300ms cubic-bezier(.2,.8,.2,1), filter 440ms cubic-bezier(.22,1,.36,1); }
.stm-close[data-swap="close"] .stm-sw-menu { transform: translateY(-115%); opacity: 0; filter: blur(2px); }
.stm-close[data-swap="menu"] .stm-sw-close { transform: translateY(115%); opacity: 0; filter: blur(2px); }
.stm-close[data-swap="menu"] .stm-swap { width: var(--stm-w-menu, auto); }
@media (hover: hover) {
  .stm-close:hover { background-color: var(--stm-close-bg-h); }
  .stm-close[data-swap="menu"][data-swapping]:hover { background-color: var(--stm-trig-bg); box-shadow: inset 0 0 0 999px rgba(255, 255, 255, 0.07), inset 0 0 0 1px rgba(255, 255, 255, 0.09); }
}
.stm-close:focus-visible { box-shadow: 0 0 0 2px ${focusRing}; }
.stm-list[data-cols="2"] { display: grid; grid-auto-flow: column; grid-template-rows: repeat(var(--stm-rows, 4), auto); column-gap: 32px; }
.stm-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: calc(var(--stm-size, 56px) * 0.08); }
.stm-list > li { display: block; }
.stm-link { position: relative; display: inline-flex; align-items: center; gap: 0.32em; text-decoration: none; font-size: var(--stm-size, 56px) !important; border-radius: 12px; outline: none; transition: opacity 220ms ease, color 220ms ease; cursor: pointer; }
.stm-link[aria-disabled="true"] { cursor: default; }
.stm-link:focus-visible { outline: 2px solid ${focusRing}; outline-offset: 0.12em; }
.stm-dim > li > .stm-link { opacity: 0.38; }
.stm-dim > li.is-hot > .stm-link { opacity: 1; }
.stm-cur { width: 0.16em; height: 0.16em; border-radius: 50%; flex: none; }
.stm-list[data-hang="1"] .stm-cur { position: absolute; right: 100%; top: 50%; width: 0.13em; height: 0.13em; margin: -0.065em min(0.26em, calc((var(--stm-pl, 56px) - 0.13em) / 2)) 0 0; pointer-events: none; }
.stm-foot a, .stm-foot span { display: inline-block; padding: 8px 0; text-decoration: none; outline: none; border-radius: 6px; transition: color 180ms ease; }
.stm-foot a:focus-visible { outline: 2px solid ${focusRing}; outline-offset: 4px; }
.stm-foot a { position: relative; }
.stm-foot a::after { content: ""; position: absolute; left: -10px; right: -10px; top: 50%; height: max(100%, 44px); transform: translateY(-50%); }
.stm-spine { position: fixed; top: 0; will-change: transform; cursor: default; }
.stm-spine[data-linked] { cursor: pointer; }
.stm-spine-label { position: absolute; top: 0; bottom: 0; display: flex; align-items: center; justify-content: center; writing-mode: vertical-rl; transform: rotate(180deg); white-space: nowrap; overflow: hidden; opacity: 0; pointer-events: none; font-weight: 600; }
@media (prefers-reduced-motion: reduce) { .stm-root, .stm-btn, .stm-link, .stm-btn .stm-l1, .stm-btn .stm-l2, .stm-swap, .stm-swap > span { transition: none !important; } }
@media (prefers-reduced-transparency: reduce) { .stm-root[data-scrolled="1"] { -webkit-backdrop-filter: none; backdrop-filter: none; background-color: var(--stm-h-solid); } }
@media (prefers-contrast: more) { .stm-dim > li > .stm-link { opacity: 0.62; } }
@media (forced-colors: active) { .stm-btn { border: 1px solid ButtonText; } .stm-link:focus-visible, .stm-btn:focus-visible { outline: 2px solid Highlight; } .stm-cur { background: CanvasText !important; } }
`

    const triggerContent = (
        <>
            {showLabel ? (
                <span style={{ ...smallFont, fontSize: 14, color: btnColor, lineHeight: "1em", letterSpacing: "-0.005em" }}>
                    {props.button.label}
                </span>
            ) : null}
            <LinesIcon color={btnColor} />
        </>
    )

    // the menu links also live in the server HTML (hidden), so search engines see the site navigation
    const crawl = props.links.filter((l) => hasLink(l.link) && (l.label || "").trim())

    const header = (
        <div
            className="stm-root"
            style={{
                ...style,
                position: style && style.position ? style.position : "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: logoType === "None" ? "flex-end" : "space-between",
                gap: 16,
                padding: `${hp[0]}px ${hp[1]}px ${hp[2]}px ${hp[3]}px`,
                ["--stm-h-fill" as string]: props.header.fill || "rgba(0, 0, 0, 0)",
                ["--stm-h-glass" as string]: glass.fill,
                ["--stm-h-line" as string]: glass.line,
                ["--stm-h-solid" as string]: glass.solid,
                width: style && style.width !== undefined ? style.width : "100%",
            }}
            ref={rootRef}
            data-scrolled={glassy ? "1" : undefined}
        >
            {/* dangerouslySetInnerHTML keeps selectors like > and "quotes" intact in server-rendered HTML */}
            <style dangerouslySetInnerHTML={{ __html: css }} />
            {logoType === "None" ? null : hasLink(logo.link) ? (
                <a
                    className="stm-logo"
                    href={logo.link}
                    target={logo.newTab ? "_blank" : undefined}
                    rel={logo.newTab ? "noopener noreferrer" : undefined}
                >
                    {logoInner}
                </a>
            ) : (
                <span className="stm-logo">{logoInner}</span>
            )}
            <button
                ref={triggerRef}
                type="button"
                className="stm-btn stm-trigger"
                aria-expanded={expanded}
                aria-controls={mounted ? dialogId : undefined}
                aria-haspopup="dialog"
                aria-label={showLabel ? undefined : props.button.label || "Menu"}
                onClick={() => (expanded ? closeMenu() : openMenu())}
                style={{
                    backgroundColor: btnFill,
                    padding: showLabel ? "0 14px 0 18px" : 0,
                    width: showLabel ? undefined : 44,
                    justifyContent: "center",
                }}
            >
                {triggerContent}
            </button>
            {crawl.length ? (
                <nav hidden aria-label={(props.menu.title || "").trim() || "Menu"} style={{ display: "none" }}>
                    {crawl.map((l, i) => (
                        <a key={i} href={l.link} tabIndex={-1}>
                            {l.label}
                        </a>
                    ))}
                </nav>
            ) : null}
            {mounted && !isStatic && engine && typeof document !== "undefined"
                ? createPortal(
                      <StageLayers
                          props={props}
                          engine={engine}
                          dialogId={dialogId}
                          onClose={closeMenu}
                          onOpen={openMenu}
                          onLink={onLink}
                          active={active}
                      />,
                      document.body
                  )
                : null}
        </div>
    )
    return header
}

// ---------------------------------------------------------------- layers (portal)

function StageLayers({
    props,
    engine,
    dialogId,
    onClose,
    onOpen,
    onLink,
    active,
}: {
    props: Required<StageMenuProps>
    engine: StageEngine
    dialogId: string
    onClose: () => void
    onOpen: () => void
    onLink: (ev: React.MouseEvent, href: string | undefined, newTab: boolean | undefined, index?: number) => void
    active: number
}) {
    const m = props.menu
    const links = props.links
    const footer = props.footerLinks.filter((f) => (f.label || "").trim())
    const linkFont = fontCss(m.font, 56, 500)
    const smallFont = fontCss(m.smallFont, 13, 500)
    const pad = pad4(m.padding, [40, 56, 40, 56])
    const stage = m.stage || D.menu.stage!
    const color = m.color || D.menu.color!
    const muted = m.muted || D.menu.muted!
    // Subtle: the dark material of the stage, lifted a little; Solid: the v2 look (text-colored pill)
    const solid = props.button.closeStyle === "Solid"
    const closeFill = solid ? color : `color-mix(in srgb, ${color} 11%, ${stage})`
    const closeFillHover = solid ? color : `color-mix(in srgb, ${color} 17%, ${stage})`
    const closeColor = solid ? stage : color
    const side = m.side === "Left" ? -1 : 1
    const crease = `${side * 2}px 0px 4px -1px rgba(0, 0, 0, 0.28)`
    const showLabel = props.button.showLabel !== false && !!(props.button.closeLabel || "").trim()
    // the header's Menu shows a word too: Close carries it for the roll-over
    const menuLabel = props.button.showLabel !== false && !!(props.button.label || "").trim()
    const labelStyle: React.CSSProperties = { ...smallFont, fontSize: 14, color: "inherit", lineHeight: "1em", letterSpacing: "-0.005em" }
    const els = engine.els
    let order = 0

    // keep wheel and touch gestures away from smooth-scroll libraries on the window
    const stop = (e: React.SyntheticEvent) => e.stopPropagation()

    return (
        <>
            {/* back layer: stage, card shadow (falls on the stage only), then the sheets, painted under the page */}
            <div
                ref={(el) => {
                    els.back = el
                }}
                className="stm-layer"
                aria-hidden="true"
                data-lenis-prevent=""
                onWheel={stop}
                onTouchMove={stop}
                style={{ position: "fixed", inset: 0, zIndex: 0, backgroundColor: stage, overflow: "hidden" }}
            >
                <div
                    ref={(el) => {
                        els.shadow = el
                    }}
                    style={{ position: "fixed", top: 0, boxShadow: props.page.shadow || D.page.shadow, opacity: 0 }}
                />
                {links
                    .map((l, i) => ({ l, i }))
                    .reverse()
                    .map(({ l, i }) => {
                        const tint = tintOf(l, i)
                        const ink = luminance(tint) > 0.42 ? "rgba(17, 18, 20, 0.86)" : "rgba(255, 255, 255, 0.92)"
                        return (
                            <div
                                key={i}
                                ref={(el) => {
                                    els.spines[i] = el
                                }}
                                className="stm-spine"
                                data-linked={hasLink(l.link) ? "" : undefined}
                                style={{ backgroundColor: tint, boxShadow: `0 0 0 0.5px rgba(0, 0, 0, 0.10), ${crease}` }}
                                onPointerEnter={(e) => {
                                    if (e.pointerType !== "touch") engine.setHover(i)
                                }}
                                onPointerLeave={(e) => {
                                    if (e.pointerType !== "touch") engine.setHover(-1)
                                }}
                                onClick={() => {
                                    // same path as the menu link itself (new tab, hash, same page, close on click)
                                    const li = els.list ? els.list.children[i] : null
                                    const a = li ? li.querySelector("a[href]") : null
                                    if (a instanceof HTMLElement) a.click()
                                }}
                            >
                                <span className="stm-spine-label" style={{ ...smallFont, color: ink, fontSize: 12 }}>
                                    {l.label}
                                </span>
                            </div>
                        )
                    })}
            </div>

            {/* front layer: card hit area, dialog with the menu */}
            <div
                className="stm-layer"
                style={{ position: "fixed", inset: 0, zIndex: 2147483000, pointerEvents: "none" }}
                data-lenis-prevent=""
                onWheel={stop}
                onTouchMove={stop}
            >
                <div
                    ref={(el) => {
                        els.catcher = el
                    }}
                    aria-hidden="true"
                    onPointerDown={engine.onCatcherDown}
                    onPointerMove={engine.onCatcherMove}
                    onPointerUp={engine.onCatcherUp}
                    onPointerCancel={engine.onCatcherCancel}
                    onPointerEnter={engine.onCatcherEnter}
                    onPointerLeave={engine.onCatcherLeave}
                    style={{
                        position: "fixed",
                        top: 0,
                        backgroundColor: props.page.dim || D.page.dim,
                        cursor: "pointer",
                        touchAction: "none",
                        opacity: 0,
                        pointerEvents: "auto",
                    }}
                />
                <div
                    ref={(el) => {
                        els.dialog = el
                    }}
                    id={dialogId}
                    className="stm-dialog"
                    role="dialog"
                    aria-modal="true"
                    aria-label={(m.title || "").trim() || "Menu"}
                    tabIndex={-1}
                    style={{ position: "fixed", inset: 0, pointerEvents: "none" }}
                >
                    <button
                        ref={(el) => {
                            els.close = el
                        }}
                        type="button"
                        className="stm-btn stm-close"
                        aria-label={showLabel && !menuLabel ? undefined : props.button.closeLabel || "Close"}
                        data-swap="menu"
                        data-can-swap={showLabel === menuLabel ? "1" : "0"}
                        // a toggle while the card travels: a second click turns a close back around
                        onClick={() => (engine.isOpen ? onClose() : engine.prepared ? onOpen() : undefined)}
                        style={{
                            position: "fixed",
                            zIndex: 2,
                            pointerEvents: "auto",
                            ["--stm-close-ink" as string]: closeColor,
                            ["--stm-close-bg" as string]: closeFill,
                            ["--stm-close-bg-h" as string]: closeFillHover,
                            ["--stm-close-ring" as string]: solid ? "none" : `inset 0 0 0 1px ${closeFillHover}`,
                            padding: showLabel ? "0 14px 0 18px" : 0,
                            width: showLabel ? undefined : 44,
                            justifyContent: "center",
                            opacity: 0,
                        }}
                    >
                        {showLabel && menuLabel ? (
                            // both words live in Close: it starts as the header's Menu and rolls over to Close (and back)
                            <span className="stm-swap" aria-hidden="true">
                                <span className="stm-sw-menu" style={labelStyle}>
                                    {props.button.label}
                                </span>
                                <span className="stm-sw-close" style={labelStyle}>
                                    {props.button.closeLabel}
                                </span>
                            </span>
                        ) : showLabel ? (
                            <span style={labelStyle}>{props.button.closeLabel}</span>
                        ) : null}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: "block" }}>
                            <line data-line="1" x1="5" y1="8.5" x2="19" y2="8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            <line data-line="2" x1="5" y1="15.5" x2="19" y2="15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                    </button>
                    <div
                        ref={(el) => {
                            els.panel = el
                        }}
                        className="stm-panel"
                        onWheel={stop}
                        onPointerDown={engine.onPanelDown}
                        onPointerMove={engine.onPanelMove}
                        onPointerUp={engine.onPanelUp}
                        onPointerCancel={engine.onPanelUp}
                        style={{
                            position: "fixed",
                            zIndex: 1,
                            top: 0,
                            bottom: 0,
                            display: "flex",
                            flexDirection: "column",
                            padding: `${pad[0]}px ${pad[1]}px ${pad[2]}px ${pad[3]}px`,
                            backgroundColor: stage,
                            color,
                            overflowY: "auto",
                            overscrollBehavior: "contain",
                            touchAction: "pan-y",
                            pointerEvents: "auto",
                        }}
                    >
                        {(m.title || "").trim() ? (
                            <div
                                style={{
                                    position: "absolute",
                                    left: "var(--stm-pl, 56px)",
                                    top: "var(--stm-head-top, 20px)",
                                    height: "var(--stm-head-h, 44px)",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <span data-stm-item={order++} style={{ ...smallFont, color: muted, opacity: 0 }}>
                                    {m.title}
                                </span>
                            </div>
                        ) : null}
                        <nav aria-label={(m.title || "").trim() || "Menu"} style={{ flex: "1 1 auto", display: "flex", alignItems: "center", padding: "8px 0 32px" }}>
                            <ul
                                ref={(el) => {
                                    els.list = el
                                }}
                                className="stm-list"
                                onPointerMove={engine.listMove}
                                onPointerLeave={(e) => {
                                    if (e.pointerType !== "touch") engine.setHover(-1)
                                }}
                            >
                                {links.map((l, i) => {
                                    const linked = hasLink(l.link)
                                    const same = linked ? samePage(l.link as string) : null
                                    const page = !!same && !same.hash
                                    // one dot only: the section in view wins; the page link keeps it when no section is in view
                                    const here = i === active
                                    const current = here || (page && active < 0)
                                    const item = ++order
                                    return (
                                        <li key={i} data-stm-item={item} style={{ opacity: 0 }}>
                                            <a
                                                className="stm-link"
                                                href={linked ? l.link : undefined}
                                                target={linked && l.newTab ? "_blank" : undefined}
                                                rel={linked && l.newTab ? "noopener noreferrer" : undefined}
                                                aria-current={page ? "page" : here ? "location" : undefined}
                                                aria-disabled={linked ? undefined : "true"}
                                                onClick={(ev) => onLink(ev, l.link, l.newTab, i)}
                                                onPointerEnter={(e) => {
                                                    if (e.pointerType !== "touch") engine.setHover(i)
                                                }}
                                                onPointerDown={(e) => {
                                                    if (e.pointerType !== "mouse") engine.pressStart(i, e.clientX, e.clientY)
                                                }}
                                                onPointerUp={(e) => {
                                                    if (e.pointerType !== "mouse") engine.pressEnd()
                                                }}
                                                onPointerCancel={() => engine.pressStop()}
                                                onFocus={(e) => {
                                                    let visible = true
                                                    try {
                                                        visible = (e.target as HTMLElement).matches(":focus-visible")
                                                    } catch {
                                                        visible = true
                                                    }
                                                    if (visible) engine.setHover(i, { intent: 70 })
                                                }}
                                                onBlur={(ev) => {
                                                    if (engine.hover !== i) return
                                                    // focus moving on inside the menu (Tab through Close): no swing home and back
                                                    const to = ev.relatedTarget as Node | null
                                                    const inside = !!(to && engine.els.dialog && engine.els.dialog.contains(to))
                                                    engine.setHover(-1, { homeDelay: inside ? 650 : 240 })
                                                }}
                                                style={{ ...linkFont, color, fontSize: undefined }}
                                            >
                                                {current ? <span className="stm-cur" style={{ backgroundColor: color }} /> : null}
                                                {l.label}
                                            </a>
                                        </li>
                                    )
                                })}
                            </ul>
                        </nav>
                        {footer.length ? (
                            <div
                                className="stm-foot"
                                data-stm-item={++order}
                                style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", opacity: 0 }}
                            >
                                {footer.map((f, i) =>
                                    hasLink(f.link) ? (
                                        <a
                                            key={i}
                                            href={f.link}
                                            target={f.newTab ? "_blank" : undefined}
                                            rel={f.newTab ? "noopener noreferrer" : undefined}
                                            onClick={(ev) => onLink(ev, f.link, f.newTab)}
                                            style={{ ...smallFont, color: muted }}
                                            onPointerEnter={(e) => ((e.currentTarget as HTMLElement).style.color = color)}
                                            onPointerLeave={(e) => ((e.currentTarget as HTMLElement).style.color = muted)}
                                        >
                                            {f.label}
                                        </a>
                                    ) : (
                                        <span key={i} style={{ ...smallFont, color: muted }}>
                                            {f.label}
                                        </span>
                                    )
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </>
    )
}

// ---------------------------------------------------------------- controls

addPropertyControls(StageMenu, {
    links: {
        type: ControlType.Array,
        title: "Links",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Link" },
                link: { type: ControlType.Link, title: "Link" },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                    enabledTitle: "Yes",
                    disabledTitle: "No",
                    hidden: (p: MenuLink) => !hasLink(p.link),
                },
                tint: { type: ControlType.Color, title: "Sheet", optional: true },
            },
        },
        defaultValue: D.links,
    },
    footerLinks: {
        type: ControlType.Array,
        title: "Footer",
        maxCount: 6,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Link" },
                link: { type: ControlType.Link, title: "Link" },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                    enabledTitle: "Yes",
                    disabledTitle: "No",
                    hidden: (p: FooterLink) => !hasLink(p.link),
                },
            },
        },
        defaultValue: D.footerLinks,
    },
    logo: {
        type: ControlType.Object,
        title: "Logo",
        controls: {
            type: {
                type: ControlType.Enum,
                title: "Type",
                options: ["Text", "Image", "None"],
                optionTitles: ["Text", "Image", "None"],
                displaySegmentedControl: true,
                defaultValue: "Text",
            },
            text: {
                type: ControlType.String,
                title: "Text",
                defaultValue: "Studio",
                hidden: (p: LogoProps) => p.type !== "Text",
            },
            image: { type: ControlType.ResponsiveImage, title: "Image", hidden: (p: LogoProps) => p.type !== "Image" },
            height: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: 28,
                min: 8,
                max: 120,
                step: 1,
                unit: "px",
                hidden: (p: LogoProps) => p.type !== "Image",
            },
            link: { type: ControlType.Link, title: "Link", hidden: (p: LogoProps) => p.type === "None" },
            newTab: {
                type: ControlType.Boolean,
                title: "New Tab",
                defaultValue: false,
                enabledTitle: "Yes",
                disabledTitle: "No",
                hidden: (p: LogoProps) => p.type === "None" || !hasLink(p.link),
            },
        },
    },
    button: {
        type: ControlType.Object,
        title: "Button",
        controls: {
            label: { type: ControlType.String, title: "Label", defaultValue: "Menu" },
            closeLabel: {
                type: ControlType.String,
                title: "Close Label",
                defaultValue: "Close",
                description: "Also the screen-reader name when the label is hidden.",
            },
            showLabel: { type: ControlType.Boolean, title: "Show Label", defaultValue: true, enabledTitle: "Yes", disabledTitle: "No" },
            fill: { type: ControlType.Color, title: "Fill", defaultValue: "#111214" },
            color: { type: ControlType.Color, title: "Text", defaultValue: "#F5F5F7" },
            closeStyle: {
                type: ControlType.Enum,
                title: "Close",
                options: ["Subtle", "Solid"],
                optionTitles: ["Subtle", "Solid"],
                displaySegmentedControl: true,
                defaultValue: "Subtle",
            },
        },
    },
    header: {
        type: ControlType.Object,
        title: "Header",
        controls: {
            fill: { type: ControlType.Color, title: "Fill", defaultValue: "rgba(0, 0, 0, 0)" },
            glass: {
                type: ControlType.Enum,
                title: "Glass",
                options: ["Auto", "Light", "Dark", "Off"],
                optionTitles: ["Auto", "Light", "Dark", "Off"],
                defaultValue: "Auto",
                description: "Frosted bar once the page scrolls. Auto turns light or dark with the section behind it.",
            },
            color: { type: ControlType.Color, title: "Logo", defaultValue: "#111214" },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: 17, variant: "Semibold", letterSpacing: "-0.01em", lineHeight: "1em" },
            },
            padding: { type: ControlType.Padding, title: "Padding", defaultValue: "20px 32px 20px 32px" },
        },
    },
    menu: {
        type: ControlType.Object,
        title: "Menu",
        controls: {
            side: {
                type: ControlType.Enum,
                title: "Side",
                options: ["Right", "Left"],
                optionTitles: ["Right", "Left"],
                displaySegmentedControl: true,
                defaultValue: "Right",
            },
            width: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 40,
                min: 20,
                max: 80,
                step: 1,
                unit: "%",
                description: "Of the window. Desktop 360–720 px, tablet 340–560 px, phone all but 60 px.",
            },
            title: { type: ControlType.String, title: "Title", defaultValue: "Menu" },
            font: {
                type: ControlType.Font,
                title: "Links",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: 56, variant: "Medium", letterSpacing: "-0.035em", lineHeight: "1.05em" },
            },
            smallFont: {
                type: ControlType.Font,
                title: "Small",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: 13, variant: "Medium", letterSpacing: "0em", lineHeight: "1.4em" },
            },
            padding: { type: ControlType.Padding, title: "Padding", defaultValue: "40px 56px 40px 56px" },
            stage: { type: ControlType.Color, title: "Stage", defaultValue: "#101113" },
            color: { type: ControlType.Color, title: "Text", defaultValue: "#F5F5F7" },
            muted: { type: ControlType.Color, title: "Muted", defaultValue: "#8E8F97" },
            closeOnClick: {
                type: ControlType.Boolean,
                title: "Close on Click",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
            },
        },
    },
    page: {
        type: ControlType.Object,
        title: "Page",
        controls: {
            scale: { type: ControlType.Number, title: "Scale", defaultValue: 0.86, min: 0.6, max: 0.98, step: 0.01 },
            tilt: { type: ControlType.Number, title: "Tilt", defaultValue: 5, min: 0, max: 18, step: 0.5, unit: "°" },
            radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "20px" },
            shadow: { type: ControlType.BoxShadow, title: "Shadow", defaultValue: "0px 40px 120px 0px rgba(0, 0, 0, 0.55)" },
            dim: { type: ControlType.Color, title: "Dim", defaultValue: "rgba(0, 0, 0, 0.22)" },
            border: { type: ControlType.Color, title: "Edge", defaultValue: "rgba(255, 255, 255, 0.10)" },
        },
    },
    spines: {
        type: ControlType.Object,
        title: "Sheets",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: true, enabledTitle: "Yes", disabledTitle: "No" },
            step: {
                type: ControlType.Number,
                title: "Step",
                defaultValue: 10,
                min: 2,
                max: 24,
                step: 1,
                unit: "px",
                hidden: (p: SpineProps) => p.show === false,
            },
            pull: {
                type: ControlType.Number,
                title: "Pull",
                defaultValue: 36,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                description: "How far a hovered sheet clears the stack.",
                hidden: (p: SpineProps) => p.show === false,
            },
            labels: {
                type: ControlType.Boolean,
                title: "Labels",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
                hidden: (p: SpineProps) => p.show === false,
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            duration: { type: ControlType.Number, title: "Duration", defaultValue: 0.7, min: 0.2, max: 2, step: 0.05, unit: "s" },
            bounce: {
                type: ControlType.Number,
                title: "Bounce",
                defaultValue: 0.1,
                min: 0,
                max: 0.6,
                step: 0.01,
                description: "Bounce of the opening. Closing always lands softly.",
            },
            stagger: { type: ControlType.Number, title: "Stagger", defaultValue: 0.05, min: 0, max: 0.2, step: 0.01, unit: "s" },
        },
    },
    sections: {
        type: ControlType.Object,
        title: "Sections",
        description: "For links to sections of this page (#id).",
        controls: {
            preview: {
                type: ControlType.Boolean,
                title: "Preview",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
                description: "Hover a link and the page card scrolls to its section. A click lands there.",
            },
            active: {
                type: ControlType.Boolean,
                title: "Active",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
                description: "Marks the link of the section in view.",
            },
        },
    },
    phoneBreakpoint: {
        type: ControlType.Number,
        title: "Phone Below",
        defaultValue: 760,
        min: 320,
        max: 1200,
        step: 10,
        unit: "px",
        description: "Below this width the card peeks from the edge, without sheets.",
    },
    focusRing: {
        type: ControlType.Color,
        title: "Focus Ring",
        defaultValue: "#6EA8FE",
        description: "Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)",
    },
})
