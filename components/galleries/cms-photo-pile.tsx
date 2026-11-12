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


// CMS Photo Pile · v1.0.0 · Designed by Marso
// Your CMS items as a pile of photos on a table. Put a Collection List of your card (a picture and a title, a link if
// you like) into Content: the pile reads each card's picture, title and link and draws its own photo of it. The photos
// drop onto the table when it comes into view; a visitor picks one up, drags it (held by a corner it turns), throws it
// (it glides on and bounces off the edges), and clicks it to open its page. Tidy lays them out in a neat grid, Scatter
// throws them back into a pile. The pile never changes your list or your cards: it only reads them.
//
// Setup: 1. Insert it and give it a size in Framer's panel (Fit = 640 px). 2. Put a Collection List of your card into
// Content: the card's largest picture becomes the photo, its largest text the caption, its link the click (Frame
// Card: the photo is your card itself). 3. Adjust the photos, the motion and the Tidy button in the panel and link the
// colours to your colour styles.

// ---------- types and defaults (the panel's defaults come from here too)
type Ratio = "4:5" | "1:1" | "3:4" | "3:2"
type Frame = "polaroid" | "print" | "none" | "card"
type Corner = "bottom-center" | "bottom-right" | "bottom-left" | "top-center" | "top-right" | "top-left"

interface LayoutProps {
    photoWidth: number
    spread: number
    tilt: number
    seed: number
}
interface MotionProps {
    drag: boolean
    glide: number
    spin: number
    bounce: number
    intro: boolean
    clickOpens: boolean
}
interface TidyProps {
    show: boolean
    tidyLabel: string
    scatterLabel: string
    corner: Corner
    inset: number
    gap: number
}
interface LookProps {
    frame: Frame
    ratio: Ratio
    frameColor: string
    radius: number
    shadow: number
    caption: boolean
    captionFont?: React.CSSProperties
    captionColor: string
    font?: React.CSSProperties
    text: string
    surface: string
    border: string
    focus: string
}
interface A11yProps {
    pile: string
}
interface Props {
    content?: React.ReactNode
    layout?: Partial<LayoutProps>
    motion?: Partial<MotionProps>
    tidy?: Partial<TidyProps>
    look?: Partial<LookProps>
    a11y?: Partial<A11yProps>
    style?: React.CSSProperties
}

const D = {
    layout: { photoWidth: 240, spread: 55, tilt: 14, seed: 7 } as LayoutProps,
    motion: { drag: true, glide: 75, spin: 60, bounce: 45, intro: true, clickOpens: true } as MotionProps,
    tidy: { show: true, tidyLabel: "Tidy up", scatterLabel: "Scatter", corner: "bottom-center", inset: 16, gap: 16 } as TidyProps,
    look: {
        frame: "polaroid",
        ratio: "4:5",
        frameColor: "#F4F2EC",
        radius: 3,
        shadow: 60,
        caption: true,
        captionFont: { fontSize: 13, lineHeight: "1.2em", letterSpacing: "0em" },
        captionColor: "#1C1C1A",
        font: { fontSize: 13, lineHeight: "1em", letterSpacing: "0.02em" },
        text: "#FFFFFF",
        surface: "rgba(17, 17, 17, 0.84)",
        border: "rgba(255, 255, 255, 0.12)",
        focus: "#2F6BFF",
    } as const,
    a11y: { pile: "Photo pile" } as A11yProps,
}

// the most photos the pile draws (the first ones of your list); with Frame Card each photo draws a copy of your whole
// list (to show one card of it), so fewer
const MAX = 40
const CARD_MAX = 20
// the pile's class prefix (and nothing else's): fixed, the same on the server and in the browser. A new prefix when a
// version changes the CSS, so two versions on one page never share rules.
const CLS = "cpp10"
// a size for Fit (the pile needs room to lie on; its photos lie loose, so they give it no size of their own)
const FIT_HEIGHT = 640
const FIT_WIDTH = 640
const RATIO: Record<Ratio, number> = { "4:5": 0.8, "1:1": 1, "3:4": 0.75, "3:2": 1.5 }
const EASE = "cubic-bezier(.22,1,.36,1)"

// ---------- small helpers
const useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect
function clamp(v: number, a: number, b: number): number {
    return Math.max(a, Math.min(b, v))
}
// when the event happened, not when a busy page got to it (a throw is read from these), on performance.now()'s clock
function stamp(e: Event): number {
    const n = performance.now()
    const t = e.timeStamp
    return t > 0 && t <= n + 1 && n - t < 2000 ? t : n
}
function num(v: unknown, fallback: number): number {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
}
// a set size (Fixed, Fill, vh): Framer then passes the instance's size as the root's own (100 %); Fit passes none
const setSize = (v: unknown) => v !== undefined && v !== null && v !== "" && v !== "auto"
// the same numbers on every visit for the same item: a small seeded generator
function rng(seed: number): () => number {
    let a = seed >>> 0
    return () => {
        a = (a + 0x6d2b79f5) >>> 0
        let t = a
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}
function hash(s: string): number {
    let h = 0x811c9dc5
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i)
        h = Math.imul(h, 0x01000193) >>> 0
    }
    return h
}
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
// a landing: a little past, then back (a photo dropped onto a table)
const easeLand = (t: number) => {
    const c = 1.5
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}

// ---------- your cards: READ ONLY. The pile finds the repeated layers of your Content by structure (as Endless CMS
// Feed) and reads each one's picture, title and link. It never writes anything into your Content.
const SKIP = /^(STYLE|SCRIPT|TEMPLATE|NOSCRIPT)$/
function kids(el: Element): HTMLElement[] {
    const out: HTMLElement[] = []
    for (const c of Array.from(el.children) as HTMLElement[]) {
        if (SKIP.test(c.tagName)) continue
        const d = window.getComputedStyle(c).display
        if (d === "contents") out.push(...kids(c))
        else if (d !== "none") out.push(c)
    }
    return out
}
const hasMedia = (el: Element) => el.matches("img,video") || !!el.querySelector("img,video")
const firstClass = (el: Element) => (el.getAttribute("class") || "").split(" ").filter(Boolean)[0] || el.tagName
const LEAF = "p,h1,h2,h3,h4,h5,h6,span,img,video,svg,picture,[data-framer-background-image-wrapper]"
const isCardRoot = (el: Element) => el.matches("a[href],button") || Array.from(el.children).some((c) => c.matches(LEAF))
// Walk down through single wrappers until a level holds two or more siblings that look alike (a list's items); a
// single card is recognised by its link or its own content. `depthWanted`: how many layers in the cards sat the last
// time the list held two or more, so a single card left by a filter is taken at that same depth (not one layer
// deeper, inside itself). Structure only (as Endless CMS Feed).
function levelOf(root: Element, media: boolean, depthWanted: number): { level: HTMLElement[]; depth: number } {
    const ok = (el: Element) => !media || hasMedia(el)
    let level = kids(root)
    let depth = 0
    for (let guard = 0; guard < 16 && level.length === 1; guard++) {
        if (depthWanted >= 0 ? depth === depthWanted : isCardRoot(level[0])) break
        const next = kids(level[0])
        const cand = next.filter(ok)
        const counts: Record<string, number> = {}
        let best = 0
        for (const m of cand) {
            const k = firstClass(m)
            counts[k] = (counts[k] || 0) + 1
            best = Math.max(best, counts[k])
        }
        if (cand.length >= 2 && best >= 2) {
            level = next
            depth++
            break
        }
        if (next.length === 1) {
            level = next
            depth++
            continue
        }
        break
    }
    return { level, depth }
}
const filled = (el: Element) => hasMedia(el) || el.children.length > 0 || !!(el.textContent || "").trim()
// the cards: your layers one by one, or the repeated siblings found inside your one layer (a list, a frame); the
// list's own extras, such as a Load More button, are left out
function cardsIn(root: Element, depthWanted: number): { cards: HTMLElement[]; depth: number; list: boolean } {
    const layers = kids(root).filter(filled)
    if (layers.length > 1) return { cards: layers, depth: -1, list: false }
    let found = levelOf(root, true, depthWanted)
    let level = found.level
    let ref = level.filter(hasMedia)
    if (!ref.length) {
        found = levelOf(root, false, depthWanted)
        level = found.level.filter(filled)
        ref = level
    }
    if (level.length <= 1) return { cards: level, depth: found.depth, list: true }
    const counts: Record<string, number> = {}
    for (const m of ref) counts[firstClass(m)] = (counts[firstClass(m)] || 0) + 1
    const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]
    return { cards: top && counts[top] >= 2 ? level.filter((m) => firstClass(m) === top) : ref, depth: found.depth, list: true }
}
function mediaOf(el: HTMLElement): HTMLElement | null {
    let best: HTMLElement | null = null
    let area = 0
    for (const m of Array.from(el.querySelectorAll("img,video")) as HTMLElement[]) {
        const a = m.offsetWidth * m.offsetHeight
        if (a > area || !best) {
            area = a
            best = m
        }
    }
    return best
}
// the card's own link: the card itself when it is a link (a Link field, a linked frame around it), else the link that
// covers most of the card (not a small tag link that happens to come first)
function linkOf(el: HTMLElement): HTMLAnchorElement | null {
    if (el.matches("a[href]")) return el as HTMLAnchorElement
    let best: HTMLAnchorElement | null = null
    let area = -1
    for (const a of Array.from(el.querySelectorAll("a[href]")) as HTMLAnchorElement[]) {
        const r = a.getBoundingClientRect()
        if (r.width * r.height > area) {
            area = r.width * r.height
            best = a
        }
    }
    return best
}
// opens a card's own link (Framer's router keeps the page transition): Framer opens links on a press on phones and on
// a click on computers, so it gets both
function openLink(a: HTMLElement) {
    const r = a.getBoundingClientRect()
    const o: PointerEventInit = { bubbles: true, cancelable: true, composed: true, isPrimary: true, pointerId: 77, pointerType: "touch", button: 0, buttons: 1, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }
    try {
        a.dispatchEvent(new PointerEvent("pointerdown", o))
        a.dispatchEvent(new PointerEvent("pointerup", { ...o, buttons: 0 }))
    } catch (err) {}
    a.click()
}
// a file of the card's picture at the size the photo needs: Framer's image host gets a size; any other address as is
function sized(src: string, px: number): string {
    try {
        const u = new URL(src, window.location.href)
        if (/(^|\.)framerusercontent\.com$/.test(u.hostname)) return u.origin + u.pathname + "?scale-down-to=" + (px <= 512 ? 512 : px <= 1024 ? 1024 : 2048)
        return u.href
    } catch (err) {
        return src
    }
}
function pictureOf(el: HTMLElement, px: number): string {
    const m = mediaOf(el)
    if (!m) return ""
    const s = m.tagName === "IMG" ? (m as HTMLImageElement).getAttribute("src") || (m as HTMLImageElement).currentSrc || "" : m.getAttribute("poster") || ""
    return s ? sized(s, px) : ""
}
// a text that is there (laid out, not hidden). Opacity is not asked: your card is never shown inside the pile, so a
// text waiting for its Appear effect, or one your card shows on hover, still counts
function seen(e: HTMLElement): boolean {
    return !!e.getClientRects().length && window.getComputedStyle(e).visibility !== "hidden"
}
// the card's title: its largest text (the biggest font size; the first one on a tie), else its link's label
function titleOf(el: HTMLElement): string {
    let best: HTMLElement | null = null
    let size = 0
    for (const e of Array.from(el.querySelectorAll("*")) as HTMLElement[]) {
        if (SKIP.test(e.tagName) || e.closest("svg")) continue
        let own = false
        for (const n of Array.from(e.childNodes)) {
            if (n.nodeType === 3 && (n.nodeValue || "").trim()) {
                own = true
                break
            }
        }
        if (!own || !seen(e)) continue
        const fs = parseFloat(window.getComputedStyle(e).fontSize) || 0
        if (fs > size + 0.1) {
            size = fs
            best = e
        }
    }
    let t = best ? (best.textContent || "").replace(/\s+/g, " ").trim() : ""
    if (!t) {
        // no text: the link's label, the card's label, else its picture's alt
        const a = linkOf(el)
        const m = mediaOf(el)
        t = ((a && a.getAttribute("aria-label")) || el.getAttribute("aria-label") || (m && m.getAttribute("alt")) || "").trim()
    }
    return t.length > 140 ? t.slice(0, 139) + "…" : t
}

// ---------- the photos the pile draws (its own elements)
interface Item {
    key: string
    title: string
    src: string
    // the card's own link address ("" = none): the photo is a real link to it (Ctrl / ⌘ / middle click: a new tab)
    href: string
    // Frame Card: where the card sits in your Content and its own size and corner radius (0 width: not laid out)
    cx: number
    cy: number
    cw: number
    ch: number
    cr: number
}
interface Tween {
    f: number[]
    t: number[]
    t0: number
    dur: number
    ease: (t: number) => number
    lift: boolean
}
interface Body {
    key: string
    el: HTMLElement
    x: number
    y: number
    a: number
    s: number
    o: number
    vx: number
    vy: number
    va: number
    z: number
    grabbed: boolean
    tw: Tween | null
    // its own shown size with Frame Card (a card keeps its proportions); 0: the photos' common size
    w: number
    h: number
}
// a press on a photo: where it started, where the photo is held (in its own turned frame), whether it is in hand
interface Drag {
    id: number
    b: Body
    rx: number
    ry: number
    sx: number
    sy: number
    t0: number
    moved: boolean
    far: boolean
    picked: boolean
    taken: boolean
    touch: boolean
    hold: number
    samples: { t: number; x: number; y: number; a: number }[]
}

const sameItems = (a: Item[], b: Item[]) =>
    a.length === b.length && a.every((x, i) => x.key === b[i].key && x.title === b[i].title && x.src === b[i].src && x.href === b[i].href && x.cx === b[i].cx && x.cy === b[i].cy && x.cw === b[i].cw && x.ch === b[i].ch && x.cr === b[i].cr)
// a card's corner radius: its own, or that of the one layer of its size inside it (a list item around a card)
function radiusOf(el: HTMLElement): number {
    let n: HTMLElement | null = el
    for (let guard = 0; n && guard < 6; guard++) {
        const r = parseFloat(window.getComputedStyle(n).borderTopLeftRadius) || 0
        if (r > 0) return r
        const only: HTMLElement | null = n.children.length === 1 ? (n.children[0] as HTMLElement) : null
        if (!only || Math.abs(only.offsetWidth - n.offsetWidth) > 1 || Math.abs(only.offsetHeight - n.offsetHeight) > 1) break
        n = only
    }
    return 0
}

function css(c: string): string {
    const R = "." + c
    const at = (k: Corner, rule: string) => R + "-btn[data-corner=" + k + "]{" + rule + "}"
    return (
        R + "{position:relative;overflow:hidden;overflow:clip;outline:none;touch-action:pan-y;-webkit-tap-highlight-color:transparent}" +
        R + ":not([data-cpp-sized]){height:" + FIT_HEIGHT + "px}" +
        R + ":not([data-cpp-wsized]){width:" + FIT_WIDTH + "px;max-width:100%}" +
        R + "[data-cpp-dragging]," + R + "[data-cpp-dragging] " + R + "-photo{cursor:grabbing}" +
        // your Content: laid out (so its sizes can be read) but not shown, not focusable, its pictures never asked for
        R + "-src{position:absolute;left:0;top:0;width:100%;height:0;overflow:hidden;opacity:0;pointer-events:none}" +
        R + "-table{position:absolute;inset:0}" +
        // a finger that moves up or down scrolls the page; one that moves sideways, or holds a photo for a moment, picks it up
        R + "-photo{position:absolute;left:0;top:0;display:block;width:var(--cpp-w);opacity:0;outline:none;color:inherit;text-decoration:none;touch-action:pan-y;cursor:grab;will-change:transform;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-user-drag:none}" +
        R + "[data-cpp-still] " + R + "-photo{cursor:pointer}" +
        R + "-card{position:relative;box-sizing:border-box;width:100%;padding:var(--cpp-pad) var(--cpp-pad) var(--cpp-padb);background:var(--cpp-frame);border-radius:var(--cpp-radius);box-shadow:0 1px 2px rgba(0,0,0,calc(.32 * var(--cpp-sh))),0 12px 26px -8px rgba(0,0,0,calc(.5 * var(--cpp-sh)));transition:transform .28s " + EASE + "}" +
        // a picked photo's deeper shadow: its own layer that fades in (only transform and opacity ever animate)
        R + "-card::after{content:'';position:absolute;inset:0;border-radius:inherit;box-shadow:0 34px 60px -12px rgba(0,0,0,calc(.5 * var(--cpp-sh)));opacity:0;pointer-events:none;transition:opacity .28s " + EASE + "}" +
        R + "-photo[data-lift] " + R + "-card{transform:scale(1.045)}" +
        R + "-photo[data-lift] " + R + "-card::after{opacity:1}" +
        R + "-photo:focus-visible " + R + "-card{box-shadow:0 0 0 2px var(--cpp-focus),0 12px 26px -8px rgba(0,0,0,calc(.5 * var(--cpp-sh)))}" +
        R + "-pic{position:relative;width:100%;height:var(--cpp-ih);overflow:hidden;background:rgba(128,128,128,.16);border-radius:var(--cpp-pr)}" +
        R + "-pic img{display:block;width:100%;height:100%;object-fit:cover;pointer-events:none;-webkit-user-drag:none}" +
        // Frame Card: the window (the card's own size, scaled to the photo), the copy of your Content in it, the pile's
        // own layer over it (the press, the focus ring, the link)
        R + "-photo[data-cpp-card] " + R + "-card{height:100%;padding:0}" +
        R + "-win{position:absolute;left:0;top:0;overflow:hidden;transform:scale(var(--cpp-k,1));transform-origin:0 0;pointer-events:none}" +
        R + "-copy{position:absolute;left:0;top:0;width:var(--cpp-srcw,100%)}" +
        R + "-hit{position:absolute;inset:0;z-index:1;display:block;outline:none;cursor:inherit;-webkit-tap-highlight-color:transparent;-webkit-user-drag:none}" +
        R + "-hit:focus-visible{box-shadow:0 0 0 2px var(--cpp-focus)}" +
        R + "-word{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;box-sizing:border-box;padding:12%;text-align:center;color:var(--cpp-cap);overflow:hidden}" +
        R + "-cap{position:absolute;left:var(--cpp-pad);right:var(--cpp-pad);bottom:0;height:var(--cpp-padb);display:flex;align-items:center;color:var(--cpp-cap)}" +
        R + "-cap span{display:block;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}" +
        R + "-btn{all:unset;position:absolute;z-index:4000;box-sizing:border-box;display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:0 16px;border-radius:999px;background:var(--cpp-surface);box-shadow:inset 0 0 0 1px var(--cpp-border);color:var(--cpp-text);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);cursor:pointer;white-space:nowrap;touch-action:manipulation;transition:scale .25s " + EASE + "}" +
        R + "-btn:active{scale:.97}" +
        R + "-btn:focus-visible{box-shadow:inset 0 0 0 2px var(--cpp-focus)}" +
        R + "-btn svg{width:14px;height:14px;flex:none;display:block}" +
        at("bottom-center", "left:50%;bottom:var(--cpp-inset);translate:-50% 0") +
        at("bottom-left", "left:var(--cpp-inset);bottom:var(--cpp-inset)") +
        at("bottom-right", "right:var(--cpp-inset);bottom:var(--cpp-inset)") +
        at("top-center", "left:50%;top:var(--cpp-inset);translate:-50% 0") +
        at("top-left", "left:var(--cpp-inset);top:var(--cpp-inset)") +
        at("top-right", "right:var(--cpp-inset);top:var(--cpp-inset)") +
        R + "-hint{position:absolute;inset:16px;display:flex;align-items:center;justify-content:center;box-sizing:border-box;padding:24px;border-radius:12px;border:1px dashed rgba(128,128,128,.5);text-align:center;font:500 13px/1.45 system-ui,sans-serif;color:rgba(128,128,128,1);pointer-events:none}" +
        "@media (hover:hover){" + R + ":not([data-cpp-dragging]) " + R + "-photo:hover " + R + "-card{transform:scale(1.015)}}" +
        "@media (prefers-reduced-motion: reduce){" + R + "-card," + R + "-card::after," + R + "-btn{transition:none}}"
    )
}

// a window on a copy of your Content is only a picture: never focused, never pressed (set on the pile's own wrapper)
function inertOn(el: HTMLElement | null) {
    if (el) el.setAttribute("inert", "")
}

function TidyIcon(p: { on: boolean }) {
    return p.on ? (
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">
            <rect x="2.2" y="3" width="5.4" height="5.4" rx="1.2" transform="rotate(-12 5 5.7)" />
            <rect x="8.6" y="2.2" width="5.4" height="5.4" rx="1.2" transform="rotate(10 11.3 4.9)" />
            <rect x="4.6" y="8.6" width="5.4" height="5.4" rx="1.2" transform="rotate(6 7.3 11.3)" />
        </svg>
    ) : (
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">
            <rect x="2" y="2" width="5" height="5" rx="1.2" />
            <rect x="9" y="2" width="5" height="5" rx="1.2" />
            <rect x="2" y="9" width="5" height="5" rx="1.2" />
            <rect x="9" y="9" width="5" height="5" rx="1.2" />
        </svg>
    )
}

/**
 * CMS Photo Pile
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 720
 */
export default function CMSPhotoPile(props: Props) {
    const L: LayoutProps = { ...D.layout, ...(props.layout || {}) }
    const M: MotionProps = { ...D.motion, ...(props.motion || {}) }
    const T: TidyProps = { ...D.tidy, ...(props.tidy || {}) }
    const LK: LookProps = { ...D.look, ...(props.look || {}) }
    const A: A11yProps = { ...D.a11y, ...(props.a11y || {}) }
    const sizedBox = setSize(props.style && props.style.height)
    const sizedWide = setSize(props.style && props.style.width)

    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const cls = CLS

    const rootRef = React.useRef<HTMLDivElement>(null)
    const srcRef = React.useRef<HTMLDivElement>(null)
    const tableRef = React.useRef<HTMLDivElement>(null)
    const [items, setItems] = React.useState<Item[]>([])
    const [tidyOn, setTidyOn] = React.useState(false)
    const [, rerender] = React.useReducer((n: number) => n + 1, 0)

    // the latest settings and photos, for the handlers and the loop
    const opts = React.useRef({ L, M, T, LK, isStatic })
    opts.current = { L, M, T, LK, isStatic }
    const itemsRef = React.useRef<Item[]>([])
    itemsRef.current = items

    // ---------- the pile's own state (never React state: it changes every frame)
    const S = React.useRef({
        bodies: new Map<string, Body>(),
        W: 0,
        H: 0,
        pw: 0,
        ph: 0,
        maxZ: 1,
        raf: 0,
        last: 0,
        visible: false,
        introDone: false,
        tidy: false,
        scatter: 0,
        drag: null as null | Drag,
        // each photo's card, by the photo's key (never by place in a list: the list and the photos change apart)
        cardOf: new Map<string, HTMLElement>(),
        // how deep the cards sat in your list the last time it held two or more (-1: not learnt yet)
        cardDepth: -1,
        wantItems: [] as Item[],
        asks: 0,
        askRaf: 0,
        onLoad: null as null | (() => void),
        // the last press was a drag (its click opens nothing); the photo the pointer last pressed, and when
        wasDrag: false,
        pressK: "",
        pressAt: 0,
        quiet: false,
        waitingQuiet: false,
        idleId: 0,
        quietTimer: 0,
        retryTimer: 0,
        readTimer: 0,
        reduce: false,
        sig: "",
    })

    // ---------- reading your cards (after every change of your Content)
    const read = React.useCallback(() => {
        const src = srcRef.current
        const root = rootRef.current
        const st = S.current
        if (!src || !root) return
        const px = Math.round(Math.max(1, num(opts.current.L.photoWidth, 240)) * Math.min(2, window.devicePixelRatio || 1))
        const found = cardsIn(src, st.cardDepth)
        // where the cards sit, learnt while the list holds two or more (structure only: no names, no classes)
        if (found.list && found.cards.length >= 2) st.cardDepth = found.depth
        const asCards = opts.current.LK.frame === "card"
        const cards = found.cards.slice(0, asCards ? CARD_MAX : MAX)
        // Frame Card: each card's place and size in your Content, in the page's own pixels (the canvas may be zoomed)
        const sr = src.getBoundingClientRect()
        const zoom = src.offsetWidth ? sr.width / src.offsetWidth : 1
        if (asCards) root.style.setProperty("--cpp-srcw", src.offsetWidth + "px")
        const used: Record<string, number> = {}
        const cardOf = new Map<string, HTMLElement>()
        const next: Item[] = cards.map((card, i) => {
            const a = linkOf(card)
            const href = a ? a.getAttribute("href") || "" : ""
            const pic = pictureOf(card, px)
            const title = titleOf(card)
            let key = href || pic || title || "card" + i
            used[key] = (used[key] || 0) + 1
            if (used[key] > 1) key += "#" + used[key]
            cardOf.set(key, card)
            const r = card.getBoundingClientRect()
            const box = asCards && r.width > 0 && r.height > 0 ? { cx: Math.round((r.left - sr.left) / zoom), cy: Math.round((r.top - sr.top) / zoom), cw: Math.round(r.width / zoom), ch: Math.round(r.height / zoom), cr: radiusOf(card) } : { cx: 0, cy: 0, cw: 0, ch: 0, cr: 0 }
            return { key, title, src: pic, href, ...box }
        })
        st.cardOf = cardOf
        st.wantItems = next
        root.setAttribute("data-cpp-ready", "")
        ask()
    }, [])

    // the photos are asked for as a transition (they land once the page allows); while the rest of the page is still
    // hydrating that transition can be held back, so the pile waits until the page is quiet and asks again with a
    // plain update (as Endless CMS Feed: a plain update too early is React's "recoverable error" #421)
    const ask = React.useCallback(() => {
        const st = S.current
        window.clearTimeout(st.retryTimer)
        const plain = st.asks > 0 && st.quiet
        st.asks++
        const want = st.wantItems
        window.cancelAnimationFrame(st.askRaf)
        st.askRaf = window.requestAnimationFrame(() => {
            st.askRaf = 0
            if (plain) setItems((prev) => (sameItems(prev, want) ? prev : want))
            else React.startTransition(() => setItems((prev) => (sameItems(prev, want) ? prev : want)))
        })
        if (!st.quiet && !st.waitingQuiet) {
            st.waitingQuiet = true
            const t0 = performance.now()
            const done = () => {
                st.quiet = true
            }
            if (typeof window.requestIdleCallback === "function") {
                let calm = 0
                const idle = (d: IdleDeadline) => {
                    calm = d.didTimeout ? 0 : calm + 1
                    if (calm >= 2 || performance.now() - t0 > 10000) done()
                    else st.idleId = window.requestIdleCallback(idle, { timeout: 2000 })
                }
                st.idleId = window.requestIdleCallback(idle, { timeout: 2000 })
            } else if (document.readyState === "complete") st.quietTimer = window.setTimeout(done, 1500)
            else {
                st.onLoad = () => {
                    st.onLoad = null
                    st.quietTimer = window.setTimeout(done, 1500)
                }
                window.addEventListener("load", st.onLoad, { once: true })
            }
        }
        // looks again until the photos are there
        st.retryTimer = window.setTimeout(() => {
            const table = tableRef.current
            const have = table ? table.children.length : 0
            if (have !== S.current.wantItems.length && S.current.asks < 40) ask()
        }, 450)
    }, [])

    useIso(() => {
        const src = srcRef.current
        if (!src) return
        // your Content is never reached by Tab or a screen reader inside the pile (the pile's own wrapper, not your nodes)
        src.setAttribute("inert", "")
        read()
        const st = S.current
        const later = () => {
            window.clearTimeout(st.readTimer)
            st.readTimer = window.setTimeout(read, 120)
        }
        // your list changes (a filter, a CMS edit): only the pile's own wrapper is watched, never changed
        const mo = typeof MutationObserver !== "undefined" ? new MutationObserver(later) : null
        if (mo) mo.observe(src, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["src", "srcset", "href"] })
        return () => {
            if (mo) mo.disconnect()
            window.clearTimeout(st.readTimer)
            window.clearTimeout(st.retryTimer)
            window.clearTimeout(st.quietTimer)
            window.cancelAnimationFrame(st.askRaf)
            if (st.onLoad) window.removeEventListener("load", st.onLoad)
            if (st.idleId && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(st.idleId)
        }
    }, [read])

    // Frame Card: each photo has its card's own proportions at the photo's width (the card's window scaled to fit);
    // the other frames: the photos' common height
    const fitCards = () => {
        const st = S.current
        const cardsOn = opts.current.LK.frame === "card"
        const byKey = new Map<string, Item>()
        for (const it of itemsRef.current) byKey.set(it.key, it)
        st.bodies.forEach((b) => {
            const it = byKey.get(b.key)
            if (cardsOn && it && it.cw > 0) {
                // at the photo's width, never larger than you designed it
                const k = Math.min(1, st.pw / it.cw)
                b.w = Math.round(it.cw * k)
                b.h = Math.round(it.ch * k)
                b.el.style.width = b.w + "px"
                b.el.style.height = b.h + "px"
                b.el.style.setProperty("--cpp-k", k.toFixed(5))
            } else if (b.h) {
                b.w = b.h = 0
                b.el.style.width = b.el.style.height = ""
            }
        })
    }

    // ---------- sizes: the photo's width follows the pile's own width (a phone gets smaller photos)
    const measure = React.useCallback(() => {
        const root = rootRef.current
        const st = S.current
        if (!root) return false
        const W = root.clientWidth
        const H = root.clientHeight
        if (!W || !H) return false
        const o = opts.current
        const r = RATIO[o.LK.ratio] || 0.8
        const pw = Math.round(clamp(num(o.L.photoWidth, 240), 60, W * (W < 640 ? 0.46 : 0.34)))
        const frame = o.LK.frame
        const pad = frame === "polaroid" ? Math.round(pw * 0.05) : frame === "print" ? Math.round(pw * 0.03) : 0
        const capH = o.LK.caption && frame === "polaroid" ? Math.round(Math.max(pad * 3.6, 30)) : pad * (frame === "polaroid" ? 3 : 1)
        let ih = Math.round((pw - pad * 2) / r)
        let ph = pad + ih + capH
        let lw = pw
        if (frame === "card") {
            // each card keeps its own proportions at the photo's width (never larger than designed); the widest and the
            // tallest set the room a photo takes in the pile and in the grid
            let wide = 0
            let tall = 0
            for (const it of itemsRef.current)
                if (it.cw > 0) {
                    const k = Math.min(1, pw / it.cw)
                    wide = Math.max(wide, it.cw * k)
                    tall = Math.max(tall, it.ch * k)
                }
            if (wide) lw = Math.round(wide)
            ih = ph = Math.round(tall || pw / r)
        }
        root.style.setProperty("--cpp-w", pw + "px")
        root.style.setProperty("--cpp-pad", pad + "px")
        root.style.setProperty("--cpp-padb", capH + "px")
        root.style.setProperty("--cpp-ih", ih + "px")
        if (st.W && st.H && (st.W !== W || st.H !== H)) {
            // the table changed size: every photo keeps its place in proportion
            st.bodies.forEach((b) => {
                b.x *= W / st.W
                b.y *= H / st.H
            })
        }
        st.W = W
        st.H = H
        st.pw = lw
        st.ph = ph
        fitCards()
        return true
    }, [])

    // where a photo lies in the pile: the same place on every visit (your seed and the item), around the middle
    const pilePlace = (key: string) => {
        const st = S.current
        const o = opts.current
        const r = rng(hash(key) + num(o.L.seed, 7) * 7919 + st.scatter * 104729)
        const spread = clamp(num(o.L.spread, 55), 0, 100) / 100
        const rx = Math.max(0, st.W / 2 - st.pw * 0.55) * spread
        const ry = Math.max(0, st.H / 2 - st.ph * 0.55) * spread
        const t = r() * Math.PI * 2
        const u = Math.sqrt(r())
        const tilt = clamp(num(o.L.tilt, 14), 0, 45)
        return { x: st.W / 2 + Math.cos(t) * u * rx, y: st.H / 2 + Math.sin(t) * u * ry, a: (r() * 2 - 1) * tilt }
    }
    // the neat grid of Tidy: as many columns as give the largest photos, all of it inside the table
    const gridPlaces = (keys: string[]) => {
        const st = S.current
        const o = opts.current
        const n = keys.length
        const gap = Math.max(0, num(o.T.gap, 16))
        const btn = o.T.show ? 40 + 2 * Math.max(0, num(o.T.inset, 16)) : 24
        const top = o.T.corner.indexOf("top") === 0
        const W = st.W - 48
        const H = st.H - 24 - btn
        let best = { cols: 1, s: 0 }
        for (let cols = 1; cols <= n; cols++) {
            const rows = Math.ceil(n / cols)
            const s = Math.min(1, (W - (cols - 1) * gap) / (cols * st.pw), (H - (rows - 1) * gap) / (rows * st.ph))
            if (s > best.s + 0.001) best = { cols, s }
        }
        const s = Math.max(0.1, best.s)
        const cols = best.cols
        const rows = Math.ceil(n / cols)
        const cw = st.pw * s
        const ch = st.ph * s
        const gw = cols * cw + (cols - 1) * gap
        const gh = rows * ch + (rows - 1) * gap
        const x0 = (st.W - gw) / 2 + cw / 2
        const y0 = (top ? btn : 12) + (H - gh) / 2 + ch / 2
        const out: Record<string, { x: number; y: number; s: number }> = {}
        keys.forEach((k, i) => {
            const row = Math.floor(i / cols)
            const inRow = row === rows - 1 ? n - row * cols : cols
            const rowX0 = x0 + ((cols - inRow) * (cw + gap)) / 2
            out[k] = { x: rowX0 + (i % cols) * (cw + gap), y: y0 + row * (ch + gap), s }
        })
        return out
    }

    // ---------- drawing a photo where its body is
    const paint = (b: Body) => {
        const st = S.current
        b.el.style.transform = "translate3d(" + (b.x - (b.w || st.pw) / 2).toFixed(2) + "px," + (b.y - (b.h || st.ph) / 2).toFixed(2) + "px,0) rotate(" + b.a.toFixed(3) + "deg) scale(" + b.s.toFixed(4) + ")"
        b.el.style.zIndex = String(b.z)
        b.el.style.opacity = String(b.o)
        // a photo not shown yet (waiting for its drop) is not there for a press either: the one you see is pressed
        const pe = b.o < 0.5 ? "none" : ""
        if (b.el.style.pointerEvents !== pe) b.el.style.pointerEvents = pe
    }
    const bounds = () => {
        const st = S.current
        const mx = Math.min(st.W / 2, st.pw * 0.32)
        const my = Math.min(st.H / 2, st.ph * 0.32)
        return { x0: mx, x1: st.W - mx, y0: my, y1: st.H - my }
    }
    const toTop = (b: Body) => {
        const st = S.current
        if (st.maxZ > 900) {
            // keeps the stacking numbers small: the same order, renumbered from 1
            const all = Array.from(st.bodies.values()).sort((p, q) => p.z - q.z)
            all.forEach((x, i) => (x.z = i + 1))
            st.maxZ = all.length
        }
        if (b.z !== st.maxZ) b.z = ++st.maxZ
    }
    const tween = (b: Body, to: number[], delay: number, dur: number, ease: (t: number) => number, lift: boolean) => {
        b.tw = { f: [b.x, b.y, b.a, b.s, b.o], t: to, t0: performance.now() + delay, dur, ease, lift }
        b.vx = b.vy = b.va = 0
        // a move that is no lift ends a lift still showing (a drop or a Scatter cut short by Tidy, a key)
        if (!lift && !b.grabbed) b.el.removeAttribute("data-lift")
    }

    // ---------- the loop: runs only while something moves and the pile is on screen
    const step = React.useCallback((now: number) => {
        const st = S.current
        st.raf = 0
        const dt = clamp((now - (st.last || now)) / 1000, 0, 1 / 30)
        st.last = now
        const o = opts.current
        const glide = clamp(num(o.M.glide, 75), 0, 100) / 100
        const kf = 14 - 12.5 * glide
        const bounce = clamp(num(o.M.bounce, 45), 0, 100) / 100
        const bd = bounds()
        let busy = false
        st.bodies.forEach((b) => {
            if (b.tw) {
                const t = (now - b.tw.t0) / b.tw.dur
                if (t < 0) {
                    busy = true
                    return
                }
                const k = b.tw.ease(clamp(t, 0, 1))
                // a dropped photo is solid at once (90 ms): photos are not see-through; a fade (reduced motion) follows the ease
                const op = b.tw.lift ? clamp((now - b.tw.t0) / 90, 0, 1) : k
                const v = b.tw.f.map((f, i) => f + (b.tw!.t[i] - f) * (i === 4 ? op : k))
                b.x = v[0]
                b.y = v[1]
                b.a = v[2]
                b.s = v[3]
                b.o = v[4]
                if (b.tw.lift) b.el.setAttribute("data-lift", "")
                if (t >= 1) {
                    if (b.tw.lift && !b.grabbed) b.el.removeAttribute("data-lift")
                    b.tw = null
                } else busy = true
                paint(b)
                return
            }
            if (b.grabbed) return
            if (Math.abs(b.vx) + Math.abs(b.vy) < 4 && Math.abs(b.va) < 4) {
                b.vx = b.vy = b.va = 0
                return
            }
            busy = true
            b.x += b.vx * dt
            b.y += b.vy * dt
            b.a += b.va * dt
            const f = Math.exp(-kf * dt)
            b.vx *= f
            b.vy *= f
            b.va *= Math.exp(-(kf + 2) * dt)
            if (b.x < bd.x0 || b.x > bd.x1) {
                b.x = clamp(b.x, bd.x0, bd.x1)
                b.vx = -b.vx * bounce
                b.va += b.vy * 0.04 * (b.x < st.W / 2 ? -1 : 1)
            }
            if (b.y < bd.y0 || b.y > bd.y1) {
                b.y = clamp(b.y, bd.y0, bd.y1)
                b.vy = -b.vy * bounce
                b.va += b.vx * 0.04 * (b.y < st.H / 2 ? 1 : -1)
            }
            paint(b)
        })
        if (busy && st.visible) st.raf = window.requestAnimationFrame(step)
    }, [])
    const kick = React.useCallback(() => {
        const st = S.current
        if (st.raf || opts.current.isStatic) return
        st.last = performance.now()
        st.raf = window.requestAnimationFrame(step)
    }, [step])

    // ---------- the photos on the table: every render places new photos and lets gone ones go
    useIso(() => {
        const table = tableRef.current
        const st = S.current
        if (!table) return
        if (!measure()) return
        st.reduce = !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const els = Array.from(table.children) as HTMLElement[]
        const seenKeys: Record<string, boolean> = {}
        const fresh: Body[] = []
        els.forEach((el, i) => {
            const key = el.getAttribute("data-k") || ""
            seenKeys[key] = true
            const b = st.bodies.get(key)
            if (b) {
                b.el = el
                paint(b)
                return
            }
            const p = pilePlace(key)
            // the first pile: your order, the last card on top; a photo that comes later lands on top
            const z = st.introDone ? ++st.maxZ : i + 1
            const nb: Body = { key, el, x: p.x, y: p.y, a: p.a, s: 1, o: 0, vx: 0, vy: 0, va: 0, z, grabbed: false, tw: null, w: 0, h: 0 }
            st.maxZ = Math.max(st.maxZ, z)
            st.bodies.set(key, nb)
            fresh.push(nb)
        })
        st.bodies.forEach((b, k) => {
            if (!seenKeys[k]) st.bodies.delete(k)
        })
        // Frame Card: every photo at its card's proportions (also a photo React has just drawn anew)
        if (opts.current.LK.frame === "card" || fresh.length < els.length) {
            fitCards()
            st.bodies.forEach((b) => paint(b))
        }
        const o = opts.current
        // a new Spread, Tilt, Shuffle or photo size in the panel: the pile is laid again at once (the canvas shows it)
        const sig = [o.L.spread, o.L.tilt, o.L.seed, o.L.photoWidth, o.LK.ratio, o.LK.frame, o.LK.caption].join("|")
        const relay = st.sig !== "" && st.sig !== sig
        st.sig = sig
        if (relay && !st.tidy)
            els.forEach((el) => {
                const b = st.bodies.get(el.getAttribute("data-k") || "")
                if (!b || b.grabbed) return
                const p = pilePlace(b.key)
                b.x = p.x
                b.y = p.y
                b.a = p.a
                b.s = 1
                b.vx = b.vy = b.va = 0
                if (b.tw) b.tw.t = [p.x, p.y, p.a, 1, b.tw.t[4]]
                paint(b)
            })
        if (st.tidy && (fresh.length || relay)) {
            const g = gridPlaces(els.map((e) => e.getAttribute("data-k") || ""))
            st.bodies.forEach((b) => {
                const t = g[b.key]
                if (t) {
                    b.x = t.x
                    b.y = t.y
                    b.a = 0
                    b.s = t.s
                    paint(b)
                }
            })
        }
        if (o.isStatic || !o.M.intro) {
            fresh.forEach((b) => {
                b.o = 1
                paint(b)
            })
            st.introDone = true
            return
        }
        if (!st.introDone) {
            // waits until the table comes into view: the drop is the first thing a visitor sees
            fresh.forEach((b) => paint(b))
            if (st.visible) drop()
            return
        }
        fresh.forEach((b, i) => land(b, i * 60))
        kick()
    })

    // a photo dropped onto the table: from a little above, larger, then lands (with reduced motion: it fades in)
    const land = (b: Body, delay: number) => {
        const st = S.current
        const x = b.x
        const y = b.y
        const a = b.a
        if (st.reduce) {
            b.o = 0
            tween(b, [x, y, a, b.s, 1], delay, 320, easeOut, false)
            return
        }
        b.y = y - 26
        b.a = a + (a >= 0 ? 9 : -9)
        b.s = b.s * 1.22
        b.o = 0
        tween(b, [x, y, a, b.s / 1.22, 1], delay, 620, easeLand, true)
        paint(b)
    }
    const drop = () => {
        const st = S.current
        if (st.introDone) return
        st.introDone = true
        const all = Array.from(st.bodies.values()).sort((p, q) => p.z - q.z)
        all.forEach((b, i) => land(b, i * (all.length > 16 ? 45 : 70)))
        kick()
    }

    // ---------- on screen: the drop starts the first time the table is in view; off screen nothing runs
    React.useEffect(() => {
        const root = rootRef.current
        const st = S.current
        if (!root || isStatic) {
            st.visible = true
            return
        }
        if (typeof IntersectionObserver === "undefined") {
            st.visible = true
            drop()
            return
        }
        // enough of the table in view: a quarter of it, or half the screen when the table is taller than that (a tall
        // table never shows a quarter of itself); while only a little shows, the page's scroll is watched
        const enough = () => {
            const r = root.getBoundingClientRect()
            const vh = window.innerHeight || document.documentElement.clientHeight
            const shown = Math.min(r.bottom, vh) - Math.max(r.top, 0)
            return r.height > 0 && shown > 0 && (shown >= r.height * 0.25 || shown >= vh * 0.5)
        }
        let watching = false
        const check = () => {
            if (!st.introDone && enough()) drop()
            if (st.introDone) unwatch()
        }
        const watch = () => {
            if (watching || st.introDone) return
            watching = true
            window.addEventListener("scroll", check, { passive: true, capture: true })
            window.addEventListener("resize", check, { passive: true })
        }
        const unwatch = () => {
            if (!watching) return
            watching = false
            window.removeEventListener("scroll", check, { capture: true })
            window.removeEventListener("resize", check)
        }
        const io = new IntersectionObserver(
            (entries) => {
                const e = entries[entries.length - 1]
                st.visible = e.isIntersecting
                if (e.isIntersecting) {
                    const vh = e.rootBounds ? e.rootBounds.height : window.innerHeight
                    if (e.intersectionRatio >= 0.25 || e.intersectionRect.height >= vh * 0.5) drop()
                    else watch()
                    kick()
                } else unwatch()
            },
            { threshold: [0, 0.1, 0.25, 0.5] }
        )
        io.observe(root)
        return () => {
            io.disconnect()
            unwatch()
        }
    }, [isStatic, kick])

    // ---------- the table's size: photos keep their places in proportion (and the grid is laid out again)
    React.useEffect(() => {
        const root = rootRef.current
        if (!root || typeof ResizeObserver === "undefined") return
        const st = S.current
        const ro = new ResizeObserver(() => {
            if (!measure()) return
            // Frame Card: your cards may sit elsewhere at the new width; they are read again
            if (opts.current.LK.frame === "card") {
                window.clearTimeout(st.readTimer)
                st.readTimer = window.setTimeout(read, 120)
            }
            // the table has a size now and some photos were never placed (it had none at first): render again
            const table = tableRef.current
            if (table && table.children.length !== st.bodies.size) {
                rerender()
                return
            }
            if (st.tidy) {
                const g = gridPlaces(Array.from(st.bodies.keys()))
                st.bodies.forEach((b) => {
                    const t = g[b.key]
                    if (t) {
                        b.x = t.x
                        b.y = t.y
                        b.s = t.s
                    }
                })
            }
            const bd = bounds()
            st.bodies.forEach((b) => {
                if (!st.tidy) {
                    b.x = clamp(b.x, bd.x0, bd.x1)
                    b.y = clamp(b.y, bd.y0, bd.y1)
                }
                paint(b)
            })
        })
        ro.observe(root)
        return () => ro.disconnect()
    }, [measure, read])

    // Frame Card on or off: your cards are read again (their places and sizes, and how many)
    const cardsOn = LK.frame === "card"
    const lastCards = React.useRef(cardsOn)
    React.useEffect(() => {
        if (lastCards.current === cardsOn) return
        lastCards.current = cardsOn
        read()
    }, [cardsOn, read])

    // ---------- Tidy and Scatter
    const toggleTidy = () => {
        const st = S.current
        const keys = Array.from(st.bodies.values())
            .sort((p, q) => itemsRef.current.findIndex((x) => x.key === p.key) - itemsRef.current.findIndex((x) => x.key === q.key))
            .map((b) => b.key)
        st.reduce = !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const next = !st.tidy
        st.tidy = next
        if (!next) st.scatter++
        const g = next ? gridPlaces(keys) : null
        keys.forEach((k, i) => {
            const b = st.bodies.get(k)
            if (!b) return
            let to: number[]
            if (g) to = [g[k].x, g[k].y, 0, g[k].s, 1]
            else {
                const p = pilePlace(k)
                to = [p.x, p.y, p.a, 1, 1]
            }
            b.grabbed = false
            if (st.reduce) {
                b.x = to[0]
                b.y = to[1]
                b.a = to[2]
                b.s = to[3]
                b.o = 1
                b.tw = null
                b.el.removeAttribute("data-lift")
                paint(b)
            } else tween(b, to, i * 16, 700, easeOut, !next)
        })
        // the scattered photos land in a new order, the last one on top
        if (!next) keys.forEach((k) => toTop(st.bodies.get(k)!))
        kick()
        setTidyOn(next)
    }

    // ---------- pointer: pick up, drag (held by a corner it turns), throw; a click opens the card's link. A finger: up or
    // down scrolls the page, sideways or after a short hold it picks the photo up
    React.useEffect(() => {
        const table = tableRef.current
        const root = rootRef.current
        if (!table || !root || isStatic) return
        const st = S.current
        const local = (e: PointerEvent) => {
            const r = root.getBoundingClientRect()
            const k = root.offsetWidth ? r.width / root.offsetWidth : 1
            return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k }
        }
        // the photo in hand: one still on its way (the drop, Tidy, a key) is taken where it is now, at its own size (a
        // photo not shown yet lands where it was going); the point it is held by is kept
        const take = (d: Drag, p: { x: number; y: number }, t: number, lift: boolean) => {
            const b = d.b
            if (b.tw) {
                const to = b.tw.t
                if (b.o < 1 || performance.now() < b.tw.t0) {
                    b.x = to[0]
                    b.y = to[1]
                    b.a = to[2]
                }
                b.s = to[3]
                b.tw = null
            }
            b.o = 1
            const th = (-b.a * Math.PI) / 180
            const dx = p.x - b.x
            const dy = p.y - b.y
            d.rx = (dx * Math.cos(th) - dy * Math.sin(th)) / b.s
            d.ry = (dx * Math.sin(th) + dy * Math.cos(th)) / b.s
            d.samples = [{ t, x: p.x, y: p.y, a: b.a }]
            d.taken = true
            d.picked = lift
            b.grabbed = true
            b.vx = b.vy = b.va = 0
            toTop(b)
            if (lift) b.el.setAttribute("data-lift", "")
            else b.el.removeAttribute("data-lift")
            paint(b)
        }
        const down = (e: PointerEvent) => {
            if ((e.pointerType === "mouse" && e.button !== 0) || !e.isTrusted) return
            const el = (e.target as HTMLElement).closest("[data-k]") as HTMLElement | null
            if (!el || !table.contains(el)) return
            const b = st.bodies.get(el.getAttribute("data-k") || "")
            if (!b) return
            const p = local(e)
            const touch = e.pointerType !== "mouse"
            const canDrag = opts.current.M.drag
            const d: Drag = { id: e.pointerId, b, rx: 0, ry: 0, sx: p.x, sy: p.y, t0: stamp(e), moved: false, far: false, picked: false, taken: false, touch, hold: 0, samples: [{ t: stamp(e), x: p.x, y: p.y, a: b.a }] }
            st.drag = d
            st.wasDrag = false
            st.pressK = b.key
            st.pressAt = performance.now()
            // a mouse holds the photo at once; a finger only once it moves sideways or holds still (a finger that
            // scrolls the page leaves the photo as it is)
            if (!touch) take(d, p, stamp(e), canDrag)
            try {
                el.setPointerCapture(e.pointerId)
            } catch (err) {}
            if (!touch && canDrag) e.preventDefault()
            // a finger held still for a moment picks the photo up (it lifts)
            if (touch && canDrag)
                d.hold = window.setTimeout(() => {
                    if (st.drag === d && !d.moved && !d.taken) take(d, { x: d.sx, y: d.sy }, performance.now(), true)
                }, 220)
        }
        const move = (e: PointerEvent) => {
            const d = st.drag
            if (!d || e.pointerId !== d.id) return
            const p = local(e)
            const ax = Math.abs(p.x - d.sx)
            const ay = Math.abs(p.y - d.sy)
            // moved this far, it is no click, also with Drag off (a finger's tap allows 10 px)
            if (Math.hypot(ax, ay) > (d.touch ? 10 : 5)) d.far = true
            if (!d.picked) {
                // a finger: sideways picks the photo up; up or down is the page's (the browser scrolls and cancels)
                if (!opts.current.M.drag || !d.touch || Math.max(ax, ay) <= 10) return
                if (ax > ay) take(d, p, stamp(e), true)
                else {
                    window.clearTimeout(d.hold)
                    return
                }
            }
            if (!d.moved && Math.hypot(ax, ay) > 5) {
                d.moved = true
                root.setAttribute("data-cpp-dragging", "")
            }
            if (!d.moved) return
            const b = d.b
            const last = d.samples[d.samples.length - 1]
            const mx = p.x - last.x
            const my = p.y - last.y
            // a pull off the middle turns the photo (more the further from the middle it is held)
            const th = (b.a * Math.PI) / 180
            const rx = (d.rx * Math.cos(th) - d.ry * Math.sin(th)) * b.s
            const ry = (d.rx * Math.sin(th) + d.ry * Math.cos(th)) * b.s
            const spin = clamp(num(opts.current.M.spin, 60), 0, 100) / 100
            const torque = (rx * my - ry * mx) / (rx * rx + ry * ry + st.pw * st.pw * 0.18)
            b.a += clamp(((torque * 180) / Math.PI) * spin * 0.9, -7, 7)
            const th2 = (b.a * Math.PI) / 180
            b.x = p.x - (d.rx * Math.cos(th2) - d.ry * Math.sin(th2)) * b.s
            b.y = p.y - (d.rx * Math.sin(th2) + d.ry * Math.cos(th2)) * b.s
            const now = stamp(e)
            d.samples.push({ t: now, x: p.x, y: p.y, a: b.a })
            while (d.samples.length > 2 && now - d.samples[0].t > 90) d.samples.shift()
            paint(b)
        }
        const up = (e: PointerEvent) => {
            const d = st.drag
            if (!d || e.pointerId !== d.id) return
            st.drag = null
            window.clearTimeout(d.hold)
            root.removeAttribute("data-cpp-dragging")
            const b = d.b
            b.grabbed = false
            b.el.removeAttribute("data-lift")
            const now = stamp(e)
            const o = opts.current
            st.wasDrag = d.far
            if (!d.far && e.type === "pointerup" && now - d.t0 < (d.picked && d.touch ? 0 : 600)) {
                // a click: the card's own link (Framer's router), if it has one; Ctrl / ⌘ / Shift / Alt + click is the
                // browser's own (the photo is a real link: a new tab)
                if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
                const card = st.cardOf.get(b.key)
                const a = card ? linkOf(card) : null
                if (a && o.M.clickOpens) openLink(a)
                return
            }
            // a photo never in hand (a finger that scrolled the page) is not thrown
            if (!d.picked || !o.M.drag || st.reduce || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
            const s0 = d.samples[0]
            const s1 = d.samples[d.samples.length - 1]
            const dt = Math.max(16, now - s0.t) / 1000
            const fresh = now - s1.t < 60
            b.vx = fresh ? clamp((s1.x - s0.x) / dt, -3200, 3200) : 0
            b.vy = fresh ? clamp((s1.y - s0.y) / dt, -3200, 3200) : 0
            b.va = fresh ? clamp((s1.a - s0.a) / dt, -720, 720) : 0
            kick()
        }
        table.addEventListener("pointerdown", down)
        window.addEventListener("pointermove", move, { passive: true })
        window.addEventListener("pointerup", up)
        window.addEventListener("pointercancel", up)
        // a picture never starts the browser's own drag
        const noDrag = (e: Event) => e.preventDefault()
        table.addEventListener("dragstart", noDrag)
        // a photo picked up by a finger keeps the page from scrolling while it is moved
        const holdPage = (e: TouchEvent) => {
            if (st.drag && st.drag.picked && e.cancelable) e.preventDefault()
        }
        table.addEventListener("touchmove", holdPage, { passive: false })
        return () => {
            table.removeEventListener("pointerdown", down)
            window.removeEventListener("pointermove", move)
            window.removeEventListener("pointerup", up)
            window.removeEventListener("pointercancel", up)
            table.removeEventListener("dragstart", noDrag)
            table.removeEventListener("touchmove", holdPage)
            if (st.drag) window.clearTimeout(st.drag.hold)
            st.drag = null
            if (st.raf) window.cancelAnimationFrame(st.raf)
            st.raf = 0
        }
    }, [isStatic])

    // ---------- keys: Enter opens a photo's page (a link), the arrows move it while Drag is on (Shift: further); a focused
    // photo comes to the top
    const onKey = (e: React.KeyboardEvent<HTMLElement>) => {
        const st = S.current
        const el = e.currentTarget
        const b = st.bodies.get(el.getAttribute("data-k") || "")
        if (!b) return
        if (e.key === "Enter") {
            // only a photo that is a link opens; Ctrl / ⌘ / Shift + Enter are the browser's own (a new tab or window)
            if (el.tagName !== "A" || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
            const card = st.cardOf.get(b.key)
            const a = card ? linkOf(card) : null
            e.preventDefault()
            if (a) openLink(a)
            return
        }
        if (!opts.current.M.drag) return
        const step = e.shiftKey ? 96 : 24
        const d: Record<string, number[]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
        const m = d[e.key]
        if (!m || isStatic) return
        e.preventDefault()
        const bd = bounds()
        toTop(b)
        // from where the last key sent it (keys pressed quickly add up)
        const from = b.tw ? b.tw.t : [b.x, b.y, b.a, b.s, 1]
        const to = [clamp(from[0] + m[0], bd.x0, bd.x1), clamp(from[1] + m[1], bd.y0, bd.y1), from[2], from[3], 1]
        if (st.reduce) {
            b.x = to[0]
            b.y = to[1]
            paint(b)
        } else {
            tween(b, to, 0, 220, easeOut, false)
            kick()
        }
    }
    const onFocus = (e: React.FocusEvent<HTMLElement>) => {
        const st = S.current
        const b = st.bodies.get(e.currentTarget.getAttribute("data-k") || "")
        if (!b) return
        toTop(b)
        paint(b)
    }
    // a photo that is a link: the pile opens a plain click itself on pointer-up (through the card's own link), so the
    // browser's click goes nowhere; after a drag nothing opens; Ctrl / ⌘ / Shift / Alt + click is the browser's own
    const onClick = (e: React.MouseEvent<HTMLElement>) => {
        const st = S.current
        const key = e.currentTarget.getAttribute("data-k") || ""
        // a press the pile followed from pointer-down (anything else is a screen reader's or a script's click)
        const ours = st.pressK === key && performance.now() - st.pressAt < 5000
        const drag = ours && st.wasDrag
        st.pressK = ""
        st.wasDrag = false
        const plain = e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey
        if (!plain && !drag) return
        e.preventDefault()
        if (!plain || ours) return
        const card = st.cardOf.get(key)
        const a = card ? linkOf(card) : null
        if (a) openLink(a)
    }

    // ---------- render
    const ratio = RATIO[LK.ratio] || 0.8
    const rootStyle = {
        ...props.style,
        position: "relative",
        "--cpp-frame": LK.frame === "none" || LK.frame === "card" ? "transparent" : LK.frameColor,
        "--cpp-radius": Math.max(0, num(LK.radius, 3)) + "px",
        "--cpp-pr": LK.frame === "none" ? Math.max(0, num(LK.radius, 3)) + "px" : Math.max(0, num(LK.radius, 3) - 2) + "px",
        "--cpp-sh": clamp(num(LK.shadow, 60), 0, 100) / 100,
        "--cpp-cap": LK.captionColor,
        "--cpp-text": LK.text,
        "--cpp-surface": LK.surface,
        "--cpp-border": LK.border,
        "--cpp-focus": LK.focus,
        "--cpp-inset": Math.max(0, num(T.inset, 16)) + "px",
        // a first guess at the photo's size until the table is measured (the photos stay hidden until then)
        "--cpp-w": Math.max(60, num(L.photoWidth, 240)) + "px",
        "--cpp-ih": Math.round(Math.max(60, num(L.photoWidth, 240)) / ratio) + "px",
        "--cpp-pad": "0px",
        "--cpp-padb": "0px",
    } as React.CSSProperties
    const cap = LK.caption && LK.frame === "polaroid"
    const photos = items.map((it) => {
        // Frame Card: the photo shows your card itself: a window on a copy of your whole Content, moved so that this
        // card fills it, scaled to the photo's width (the pile's own wrappers only: nothing inside your Content is
        // changed). The copy is only a picture (inert); a layer of the pile's own over it takes the press, the focus
        // and the link.
        if (cardsOn && it.cw > 0) {
            const hit = { "data-k": it.key, className: cls + "-hit", "aria-label": it.title || undefined, onKeyDown: onKey, onFocus: onFocus, style: { borderRadius: "calc(" + it.cr + "px * var(--cpp-k, 1))" } }
            return (
                <div key={it.key} data-k={it.key} className={cls + "-photo"} data-cpp-card="">
                    <div className={cls + "-card"} style={{ borderRadius: "calc(" + it.cr + "px * var(--cpp-k, 1))" }}>
                        <div ref={inertOn} className={cls + "-win"} aria-hidden="true" style={{ width: it.cw, height: it.ch, borderRadius: it.cr }}>
                            <div className={cls + "-copy"} style={{ transform: "translate(" + -it.cx + "px," + -it.cy + "px)" }}>
                                {props.content}
                            </div>
                        </div>
                    </div>
                    {it.href && M.clickOpens ? <a {...hit} href={it.href} draggable={false} onClick={onClick} /> : <div {...hit} role="img" tabIndex={M.drag ? 0 : -1} />}
                </div>
            )
        }
        const inner = (
            <div className={cls + "-card"}>
                <div className={cls + "-pic"}>
                    {it.src ? (
                        <img src={it.src} alt="" draggable={false} loading="lazy" decoding="async" />
                    ) : (
                        <div className={cls + "-word"} style={LK.captionFont}>
                            {it.title}
                        </div>
                    )}
                </div>
                {cap && it.src ? (
                    <div className={cls + "-cap"} style={LK.captionFont}>
                        <span>{it.title}</span>
                    </div>
                ) : null}
            </div>
        )
        // a card with a link: the photo is a real link to the same address (a plain click goes through the card's own
        // link, Framer's router; Ctrl / ⌘ / Shift / middle click and the right-click menu are the browser's own)
        if (it.href && M.clickOpens)
            return (
                <a key={it.key} data-k={it.key} className={cls + "-photo"} href={it.href} draggable={false} aria-label={it.title || undefined} onKeyDown={onKey} onFocus={onFocus} onClick={onClick}>
                    {inner}
                </a>
            )
        // no link: a picture; Tab still reaches it while it can be moved (the arrow keys move it)
        return (
            <div key={it.key} data-k={it.key} className={cls + "-photo"} role="img" tabIndex={M.drag ? 0 : -1} aria-label={it.title || undefined} onKeyDown={onKey} onFocus={onFocus}>
                {inner}
            </div>
        )
    })
    const hasContent = React.Children.toArray(props.content).length > 0
    return (
        <div
            ref={rootRef}
            className={cls}
            style={rootStyle}
            role="region"
            aria-label={A.pile || undefined}
            data-cpp-sized={sizedBox ? "" : undefined}
            data-cpp-wsized={sizedWide ? "" : undefined}
            data-cpp-still={M.drag ? undefined : ""}
        >
            <style dangerouslySetInnerHTML={{ __html: css(cls) }} />
            <div ref={srcRef} className={cls + "-src"} aria-hidden="true">
                {props.content}
            </div>
            <div ref={tableRef} className={cls + "-table"}>
                {photos}
            </div>
            {T.show && items.length > 1 ? (
                <button type="button" className={cls + "-btn"} data-corner={T.corner} style={LK.font} onClick={toggleTidy}>
                    <TidyIcon on={tidyOn} />
                    <span>{tidyOn ? T.scatterLabel : T.tidyLabel}</span>
                </button>
            ) : null}
            {isCanvas && !items.length ? <div className={cls + "-hint"}>{hasContent ? "Content has no cards yet." : "Put a Collection List of your card (a picture and a title) into Content."}</div> : null}
        </div>
    )
}

// ---------- the panel
CMSPhotoPile.displayName = "CMS Photo Pile"
addPropertyControls(CMSPhotoPile, {
    content: {
        type: ControlType.Slot,
        title: "Content",
        maxCount: MAX,
        description: "A Collection List of your card: its largest picture becomes the photo, its largest text the caption, its link the click (Frame Card: the card itself). Or your cards one by one. Set it on the Desktop breakpoint. The first 40 cards become photos (Frame Card: 20): use the list's Limit (its Load More is not shown inside the pile).",
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        icon: "object",
        controls: {
            photoWidth: { type: ControlType.Number, title: "Photo Width", min: 80, max: 480, step: 4, unit: "px", defaultValue: D.layout.photoWidth, description: "At most a third of the pile's width (a phone: about half). Frame Card: your card at this width, its proportions kept, never larger than you designed it." },
            spread: { type: ControlType.Number, title: "Spread", min: 0, max: 100, step: 1, unit: "%", defaultValue: D.layout.spread, description: "How far the pile spreads over the table: 0 = one stack in the middle." },
            tilt: { type: ControlType.Number, title: "Tilt", min: 0, max: 45, step: 1, unit: "°", defaultValue: D.layout.tilt, description: "The most a photo lies turned." },
            seed: { type: ControlType.Number, title: "Shuffle", min: 1, max: 99, step: 1, defaultValue: D.layout.seed, description: "Another number, another pile. The same pile on every visit." },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        icon: "interaction",
        controls: {
            drag: { type: ControlType.Boolean, title: "Drag", defaultValue: D.motion.drag, description: "Visitors pick photos up, move and throw them." },
            glide: { type: ControlType.Number, title: "Glide", min: 0, max: 100, step: 1, unit: "%", defaultValue: D.motion.glide, description: "How far a thrown photo slides on.", hidden: (p: any) => p.drag === false },
            spin: { type: ControlType.Number, title: "Spin", min: 0, max: 100, step: 1, unit: "%", defaultValue: D.motion.spin, description: "How much a photo turns when it is pulled by a corner.", hidden: (p: any) => p.drag === false },
            bounce: { type: ControlType.Number, title: "Bounce", min: 0, max: 100, step: 1, unit: "%", defaultValue: D.motion.bounce, description: "How much a photo bounces off the table's edges.", hidden: (p: any) => p.drag === false },
            intro: { type: ControlType.Boolean, title: "Drop In", defaultValue: D.motion.intro, description: "The photos drop onto the table the first time it comes into view (with reduced motion they fade in)." },
            clickOpens: { type: ControlType.Boolean, title: "Click Opens", defaultValue: D.motion.clickOpens, description: "A click (not a drag) opens the card's link. Off: photos only move." },
        },
    },
    tidy: {
        type: ControlType.Object,
        title: "Tidy Button",
        icon: "interaction",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: D.tidy.show, description: "Lays the photos out in a neat grid and back into a pile." },
            tidyLabel: { type: ControlType.String, title: "Tidy", defaultValue: D.tidy.tidyLabel, hidden: (p: any) => p.show === false },
            scatterLabel: { type: ControlType.String, title: "Scatter", defaultValue: D.tidy.scatterLabel, hidden: (p: any) => p.show === false },
            corner: {
                type: ControlType.Enum,
                title: "Position",
                options: ["bottom-center", "bottom-left", "bottom-right", "top-center", "top-left", "top-right"],
                optionTitles: ["Bottom Center", "Bottom Left", "Bottom Right", "Top Center", "Top Left", "Top Right"],
                defaultValue: D.tidy.corner,
                hidden: (p: any) => p.show === false,
            },
            inset: { type: ControlType.Number, title: "Inset", min: 0, max: 64, step: 1, unit: "px", defaultValue: D.tidy.inset, description: "The button's distance from the pile's edges.", hidden: (p: any) => p.show === false },
            gap: { type: ControlType.Number, title: "Grid Gap", min: 0, max: 64, step: 1, unit: "px", defaultValue: D.tidy.gap, description: "The space between the photos when tidied.", hidden: (p: any) => p.show === false },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Style",
        icon: "color",
        controls: {
            frame: {
                type: ControlType.Enum,
                title: "Frame",
                options: ["polaroid", "print", "none", "card"],
                optionTitles: ["Polaroid", "Print", "None", "Card"],
                displaySegmentedControl: true,
                defaultValue: D.look.frame,
                description: "Card: each photo is your card itself, as you designed it (its look at rest; the pile's own lift instead of its hover). At most 20.",
            },
            ratio: { type: ControlType.Enum, title: "Ratio", options: ["4:5", "1:1", "3:4", "3:2"], optionTitles: ["4:5", "1:1", "3:4", "3:2"], displaySegmentedControl: true, defaultValue: D.look.ratio, hidden: (p: any) => p.frame === "card" },
            frameColor: { type: ControlType.Color, title: "Frame Color", defaultValue: D.look.frameColor, hidden: (p: any) => p.frame === "none" || p.frame === "card" },
            radius: { type: ControlType.Number, title: "Radius", min: 0, max: 32, step: 1, unit: "px", defaultValue: D.look.radius, hidden: (p: any) => p.frame === "card" },
            shadow: { type: ControlType.Number, title: "Shadow", min: 0, max: 100, step: 1, unit: "%", defaultValue: D.look.shadow },
            caption: { type: ControlType.Boolean, title: "Caption", defaultValue: D.look.caption, description: "The card's title under the picture (Polaroid frame).", hidden: (p: any) => p.frame !== "polaroid" },
            captionFont: { type: ControlType.Font, title: "Caption Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: D.look.captionFont, description: "Also the title on a card that has no picture.", hidden: (p: any) => p.frame === "card" },
            captionColor: { type: ControlType.Color, title: "Caption Color", defaultValue: D.look.captionColor, hidden: (p: any) => p.frame === "card" },
            font: { type: ControlType.Font, title: "Button Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: D.look.font },
            text: { type: ControlType.Color, title: "Button Text", defaultValue: D.look.text },
            surface: { type: ControlType.Color, title: "Button Fill", defaultValue: D.look.surface },
            border: { type: ControlType.Color, title: "Button Border", defaultValue: D.look.border },
            focus: { type: ControlType.Color, title: "Focus Ring", defaultValue: D.look.focus, description: "Link the colours to colour styles with light and dark values to follow the theme." },
        },
    },
    a11y: {
        type: ControlType.Object,
        title: "Accessibility",
        icon: "object",
        controls: {
            pile: { type: ControlType.String, title: "Pile Label", defaultValue: D.a11y.pile, description: "Read by screen readers for the whole pile. Each photo is named by its card's title." },
        },
    },
})
