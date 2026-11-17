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


// Endless CMS Wall · v1.0.1 · Designed by Marso
// An endless, draggable masonry wall of your own cards. Put a Collection List (or a frame of repeated layers) into
// Content: every card keeps its own design, hover, link and text styles; the wall only sizes and places them, and
// repeats them (as hidden copies) until it is full. Framer's own CMS tools keep working on the list (filters,
// sorting, limits): when the list changes, the wall lays itself out again. No CMS? Add images to Images.
//
// Setup: 1. Insert it and give it a size (full screen: 100% × 100vh). 2. Put a Collection List of your card into
// Content, on the Desktop breakpoint; give the card a fixed size in the list (the wall sets its real size); the
// card's own link opens its page. 3. Adjust it in the panel and link the colours to your colour styles.
//
// Built from the wall of the Wallfolio template.

// ---------- types and defaults (the panel's defaults come from here too)
type Shape = "image" | "uniform"
type Order = "list" | "shuffle" | "visit"
type Wheel = "pan" | "page"
type Place = "bottom" | "bottom-left" | "bottom-right" | "top" | "top-left" | "top-right"

interface LayoutProps {
    columns: number
    columnsTablet: number
    columnsPhone: number
    tabletBelow: number
    phoneBelow: number
    gap: number
    shape: Shape
    ratio: number
    desync: number
    order: Order
    seed: number
    radius: number
}
interface MotionProps {
    drift: number
    direction: number
    pauseOnHover: boolean
    glide: number
}
interface HoverProps {
    dim: number
    scale: number
    spotlight: boolean
    strength: number
    size: number
}
interface InteractionProps {
    wheel: Wheel
    wheelSpeed: number
    pageScroll: boolean
    zoomOut: number
    keys: boolean
}
interface ButtonsProps {
    show: boolean
    position: Place
    shuffle: boolean
    zoom: boolean
}
interface TextBox {
    text: string
    font?: React.CSSProperties
    color: string
    fill: string
}
interface CaptionProps {
    show: boolean
    font?: React.CSSProperties
    color: string
}
interface ColorProps {
    tileFill: string
    buttonFill: string
    buttonIcon: string
    buttonBorder: string
    focus: string
    shade: string
}
interface A11yProps {
    wall: string
    shuffle: string
    zoom: string
}
interface ImageItem {
    image?: { src?: string; srcSet?: string; alt?: string }
    title?: string
    link?: string
}
interface Props {
    content?: React.ReactNode
    images?: ImageItem[]
    layout?: Partial<LayoutProps>
    motion?: Partial<MotionProps>
    hover?: Partial<HoverProps>
    interaction?: Partial<InteractionProps>
    buttons?: Partial<ButtonsProps>
    cursorLabel?: Partial<TextBox>
    hint?: Partial<TextBox>
    captions?: Partial<CaptionProps>
    colors?: Partial<ColorProps>
    a11y?: Partial<A11yProps>
    style?: React.CSSProperties
}

const LABEL_FONT = { fontSize: 12, lineHeight: "1.2em", letterSpacing: "0em" }
const D = {
    layout: { columns: 5, columnsTablet: 3, columnsPhone: 2, tabletBelow: 1200, phoneBelow: 810, gap: 14, shape: "image", ratio: 0.8, desync: 0.6, order: "list", seed: 7, radius: 14 } as LayoutProps,
    motion: { drift: 14, direction: 250, pauseOnHover: true, glide: 0.93 } as MotionProps,
    hover: { dim: 0.55, scale: 1, spotlight: false, strength: 0.65, size: 560 } as HoverProps,
    interaction: { wheel: "pan", wheelSpeed: 1, pageScroll: false, zoomOut: 0.6, keys: true } as InteractionProps,
    buttons: { show: true, position: "bottom", shuffle: true, zoom: true } as ButtonsProps,
    cursorLabel: { text: "View", color: "#FFFFFF", fill: "#111111" } as TextBox,
    hint: { text: "Drag to explore", color: "#FFFFFF", fill: "#111111" } as TextBox,
    captions: { show: true, color: "#FFFFFF" } as CaptionProps,
    colors: { tileFill: "rgba(128, 128, 128, 0.16)", buttonFill: "rgba(17, 17, 17, 0.72)", buttonIcon: "#FFFFFF", buttonBorder: "rgba(255, 255, 255, 0.14)", focus: "#2F6BFF", shade: "#000000" } as ColorProps,
    a11y: { wall: "Gallery", shuffle: "Shuffle", zoom: "Zoom out" } as A11yProps,
}

// ---------- small helpers
const useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function mulberry32(seed: number): () => number {
    let a = seed >>> 0
    return function () {
        a |= 0
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}
function mod(n: number, m: number): number {
    return ((n % m) + m) % m
}
function clamp(v: number, a: number, b: number): number {
    return Math.max(a, Math.min(b, v))
}
function num(v: unknown, fallback: number): number {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
}
// a link from the panel: web, mail, phone, a path or an anchor; nothing that runs code
function safeHref(s?: string): string | undefined {
    const v = (s || "").trim()
    if (!v) return undefined
    if (/^(https?:|mailto:|tel:|\/|#|\.|\?)/i.test(v)) return v
    if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return undefined
    return v
}

// ---------- the cards: the repeated layers of whatever is in Content, found by structure
const SKIP = /^(STYLE|SCRIPT|TEMPLATE|NOSCRIPT)$/
// element children, looking through wrappers that take no box (display: contents)
function kids(el: Element): HTMLElement[] {
    const out: HTMLElement[] = []
    for (const c of Array.from(el.children) as HTMLElement[]) {
        if (SKIP.test(c.tagName)) continue
        const d = window.getComputedStyle(c).display
        if (d === "contents") out.push(...kids(c))
        // a card the wall itself has put aside is still one of the cards
        else if (d !== "none" || c.hasAttribute("data-ecw-rest")) out.push(c)
    }
    return out
}
const hasMedia = (el: Element) => el.matches("img,video") || !!el.querySelector("img,video")
// siblings are compared with each other only (never with a name or class we expect): no class = the tag
const firstClass = (el: Element) => (el.getAttribute("class") || "").split(" ").filter(Boolean)[0] || el.tagName
// a layer that is a card's own content, not a wrapper around cards
const LEAF = "p,h1,h2,h3,h4,h5,h6,span,img,video,svg,picture,[data-framer-background-image-wrapper]"
const isCardRoot = (el: Element) => el.matches("a[href],button") || Array.from(el.children).some((c) => c.matches(LEAF))

// Walk down through single wrappers until a level holds two or more siblings that look alike (a list's items); a
// single card is recognised by its link or its own content. `media`: the level is told by the layers with an image
// or a video. `depthWanted`: how many layers in the cards sat the last time the list held two or more, so a single
// card left by a filter is taken at that same depth (not one layer deeper, inside itself). Structure only.
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
// The cards: the repeated siblings of that level (also those without an image); the list's own extras, such as a
// Load More button, are left alone.
// a layer with something in it (an empty Collection List is not a card)
const filled = (el: Element) => hasMedia(el) || el.children.length > 0 || !!(el.textContent || "").trim()
function cardsIn(root: Element, depthWanted: number): { cards: HTMLElement[]; depth: number } {
    let found = levelOf(root, true, depthWanted)
    let level = found.level
    let ref = level.filter(hasMedia)
    if (!ref.length) {
        found = levelOf(root, false, depthWanted)
        level = found.level.filter(filled)
        ref = level
    }
    if (level.length <= 1) return { cards: level, depth: found.depth }
    const counts: Record<string, number> = {}
    for (const m of ref) counts[firstClass(m)] = (counts[firstClass(m)] || 0) + 1
    const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]
    return { cards: top && counts[top] >= 2 ? level.filter((m) => firstClass(m) === top) : ref, depth: found.depth }
}

// a card's width / height: from its first image (Framer writes the real size on the <img>), else its own box
function ratioOf(el: HTMLElement, own: WeakMap<HTMLElement, number>): number {
    const img = el.querySelector("img") as HTMLImageElement | null
    if (img) {
        let w = parseFloat(img.getAttribute("width") || "")
        let h = parseFloat(img.getAttribute("height") || "")
        if (!(w > 0 && h > 0)) {
            const m = /[?&]width=(\d+)&height=(\d+)/.exec(img.currentSrc || img.src || "")
            if (m) {
                w = Number(m[1])
                h = Number(m[2])
            }
        }
        if (!(w > 0 && h > 0)) {
            w = img.naturalWidth
            h = img.naturalHeight
        }
        if (w > 0 && h > 0) return w / h
    }
    const video = el.querySelector("video") as HTMLVideoElement | null
    if (video && video.videoWidth > 0 && video.videoHeight > 0) return video.videoWidth / video.videoHeight
    const known = own.get(el)
    if (known) return known
    if (el.offsetWidth > 0 && el.offsetHeight > 0) {
        const r = el.offsetWidth / el.offsetHeight
        own.set(el, r)
        return r
    }
    return 0.8
}

// the part of a card that is not its image, in px: `h` a title strip under the image (or a frame above and below it),
// `w` a frame beside it. First read at the card's own size, before the wall sizes it. A title can wrap onto a second
// line in a narrower column, so a card with a strip is read again, once, at each column width the wall gives it (at
// the card's own height), and again after a web font arrives (`gen`). The wall sizes the card so that its image keeps
// its exact shape whatever the card looks like
interface Extra {
    w: number
    h: number
}
interface ExtraRec {
    ownW: number
    ownH: number
    base: Extra
    at: Map<string, Extra>
}
const NO_EXTRA: Extra = { w: 0, h: 0 }
function mediaLayer(el: HTMLElement): HTMLElement | null {
    const media = el.querySelector("img,video") as HTMLElement | null
    if (!media) return null
    const wrap = media.closest("[data-framer-background-image-wrapper]") as HTMLElement | null
    return (wrap && wrap.parentElement) || media
}
function readExtra(el: HTMLElement, layer: HTMLElement): Extra {
    const h = el.offsetHeight
    const lh = layer.offsetHeight
    const w = el.offsetWidth
    const lw = layer.offsetWidth
    return { w: w > 0 && lw > 0 && lw < w - 1 ? Math.round(w - lw) : 0, h: h > 0 && lh > 0 && lh < h - 1 ? Math.round(h - lh) : 0 }
}
function extrasAt(els: HTMLElement[], cache: WeakMap<HTMLElement, ExtraRec>, colW: number, gen: number): { at: Extra[]; own: Extra[] } {
    const recs = els.map((el) => {
        let rec = cache.get(el)
        if (!rec) {
            const layer = mediaLayer(el)
            rec = { ownW: el.offsetWidth, ownH: el.offsetHeight, base: layer ? readExtra(el, layer) : NO_EXTRA, at: new Map() }
            cache.set(el, rec)
        }
        return rec
    })
    const key = Math.round(colW) + ":" + gen
    // the cards still to read at this width are all set to it first, then read together (one layout), then put back.
    // Each is read as the wall draws it: a card not yet in the wall is marked for the moment, so the card inside a
    // list item that only hugs it (a linked frame around an instance) fills the new width too
    const todo: { rec: ExtraRec; el: HTMLElement; layer: HTMLElement; keep: string[]; mark: boolean }[] = []
    recs.forEach((rec, i) => {
        if (!rec.base.h || !(rec.ownW > 0 && rec.ownH > 0) || (gen === 0 && Math.abs(rec.ownW - colW) < 1) || rec.at.has(key)) return
        const el = els[i]
        const layer = mediaLayer(el)
        if (!layer) return
        const s = el.style
        todo.push({ rec, el, layer, keep: [s.getPropertyValue("width"), s.getPropertyPriority("width"), s.getPropertyValue("height"), s.getPropertyPriority("height")], mark: !el.hasAttribute("data-ecw-item") })
    })
    for (const t of todo) {
        if (t.mark) t.el.setAttribute("data-ecw-item", "")
        t.el.style.setProperty("width", colW + "px", "important")
        t.el.style.setProperty("height", t.rec.ownH + "px", "important")
    }
    for (const t of todo) {
        const e = readExtra(t.el, t.layer)
        // nothing to read (hidden just now): read again next time
        if (e.h > 0) t.rec.at.set(key, e)
    }
    for (const t of todo) {
        const s = t.el.style
        if (t.mark) t.el.removeAttribute("data-ecw-item")
        if (t.keep[0]) s.setProperty("width", t.keep[0], t.keep[1])
        else s.removeProperty("width")
        if (t.keep[2]) s.setProperty("height", t.keep[2], t.keep[3])
        else s.removeProperty("height")
    }
    return { at: recs.map((rec) => rec.at.get(key) || rec.base), own: recs.map((rec) => rec.base) }
}
// a card's height in the wall: its image at the column's width less the frame beside it, plus the rest of the card
const tileH = (colW: number, r: number, e: Extra | undefined) => Math.max(20, colW - (e ? e.w : 0)) / clamp(r, 0.3, 3) + (e ? e.h : 0)

// ---------- layout
interface Placed {
    copy: number
    index: number
    col: number
    y: number
    h: number
}
interface Grid {
    colW: number
    gap: number
    C: number
    W: number
    heights: number[]
    offsets: number[]
    maxH: number[]
    tiles: Placed[]
    ox: number
    oy: number
}
interface LayoutRun extends LayoutProps {
    seedNow: number
    shuffled: boolean
}

// the columns for the wall's own width; one more column peeks in at the edges, so the wall reads as something to drag
function columnsFor(width: number, L: LayoutProps): { colW: number; visible: number } {
    const gap = Math.max(0, L.gap)
    const n = Math.max(1, Math.round(width < L.phoneBelow ? L.columnsPhone : width < L.tabletBelow ? L.columnsTablet : L.columns))
    const colW = Math.max(60, (width + gap) / (n + 0.35) - gap)
    return { colW, visible: n + 0.35 }
}

// at most ~240 cards in all, however few the list has
function maxCopiesFor(count: number): number {
    return clamp(Math.floor(240 / Math.max(1, count)), 12, 60)
}

// `reach` (≥ 1): how much more of the wall comes into view at the farthest zoom; laid out for it from the start
function copiesFor(count: number, ratios: number[], extras: Extra[], width: number, height: number, L: LayoutProps, reach: number): number {
    if (count === 0) return 1
    const { colW } = columnsFor(width, L)
    const gap = Math.max(0, L.gap)
    const C = Math.ceil((width * reach + gap) / (colW + gap)) + 2
    let sum = 0
    let maxH = 0
    ratios.forEach((r, i) => {
        const h = tileH(colW, r, extras[i])
        sum += h + gap
        maxH = Math.max(maxH, h)
    })
    const avg = sum / ratios.length
    const perColumn = Math.ceil((height * reach + 2 * maxH + 2 * gap) / avg) + 1
    return clamp(Math.ceil((C * perColumn) / count), 1, maxCopiesFor(count))
}

function buildGrid(ratios: number[], extras: Extra[], copies: number, width: number, height: number, L: LayoutRun, reach: number): Grid {
    const gap = Math.max(0, L.gap)
    const { colW, visible } = columnsFor(width, L)
    const C = Math.ceil((width * reach + gap) / (colW + gap)) + 2
    const W = C * (colW + gap)
    const N = ratios.length
    const rand = mulberry32(Math.round(L.seedNow) * 7919 + 17)
    const hOf = (i: number) => Math.round(tileH(colW, ratios[i], extras[i]))

    // the first set in the list's order (unless shuffled), the copies shuffled
    const order: { copy: number; index: number }[] = []
    for (let c = 0; c < copies; c++) {
        const idx = Array.from({ length: N }, (_, i) => i)
        if (c > 0 || L.shuffled) {
            for (let i = idx.length - 1; i > 0; i--) {
                const j = Math.floor(rand() * (i + 1))
                const t = idx[i]
                idx[i] = idx[j]
                idx[j] = t
            }
        }
        for (const i of idx) order.push({ copy: c, index: i })
    }

    // the columns on screen first, the middle ones before the edges; the first set fills about a screen and a half
    // of them before anything goes off screen, so the wall shows complete while its copies still render
    const shown = Math.min(C, Math.ceil(visible))
    const ox0 = Math.round((width - (Math.min(visible, C) * (colW + gap) - gap)) / 2)
    const peekLeft = ox0 > gap && C - 1 >= shown
    const onScreen = (c: number) => c < shown || (peekLeft && c === C - 1)
    const rank: number[] = []
    for (let c = 0; c < C; c++) rank[c] = c < shown ? Math.abs(c - (shown - 1) / 2) : onScreen(c) ? shown / 2 + 0.5 : 100 + c
    const firstDepth = height * 1.6

    const heights = new Array(C).fill(0)
    const maxH = new Array(C).fill(0)
    const byColumn: { index: number; y: number }[][] = Array.from({ length: C }, () => [])
    const tiles: Placed[] = []
    const score = new Array(C).fill(0)
    for (const t of order) {
        const h = hOf(t.index)
        let low = Infinity
        for (let c = 0; c < C; c++) {
            score[c] = heights[c] + rank[c] * 0.5 + (t.copy === 0 && !onScreen(c) ? firstDepth : 0)
            low = Math.min(low, score[c])
        }
        // the same card is kept apart from itself, but only among the columns that are about as short as the
        // shortest: the columns stay even, so every one is long enough to fill the view at the farthest zoom
        let best = 0
        let bestScore = Infinity
        for (let c = 0; c < C; c++) {
            if (score[c] > low + h + gap) continue
            let s = score[c]
            if (N >= 4)
                for (const d of [-1, 0, 1]) {
                    const cc = mod(c + d, C)
                    for (const o of byColumn[cc]) if (o.index === t.index && Math.abs(o.y - heights[c]) < height + h) s += 1e6
                }
            if (s < bestScore) {
                bestScore = s
                best = c
            }
        }
        const y = heights[best]
        tiles.push({ copy: t.copy, index: t.index, col: best, y, h })
        byColumn[best].push({ index: t.index, y })
        heights[best] = y + h + gap
        maxH[best] = Math.max(maxH[best], h)
    }

    const avg = N ? colW / (ratios.reduce((a, r) => a + clamp(r, 0.3, 3), 0) / N) : colW
    const offsets: number[] = []
    for (let c = 0; c < C; c++) offsets[c] = c < shown && !L.shuffled && L.desync === 0 ? 0 : -Math.round(rand() * Math.max(0, L.desync) * avg)

    const used = Math.min(visible, C) * (colW + gap) - gap
    return { colW, gap, C, W, heights: heights.map((h) => Math.max(h, 1)), offsets, maxH, tiles, ox: Math.round((width - used) / 2), oy: gap }
}

// ---------- the style: a constant text; every setting reaches it as a CSS variable on the root
const EASE = "cubic-bezier(.22,1,.36,1)"
function css(c: string): string {
    const R = "." + c
    return (
        // clip, not hidden: a card that gets the keyboard focus must not scroll the wall (the browser would)
        R + "{position:relative;overflow:hidden;overflow:clip;touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab;-webkit-tap-highlight-color:transparent;outline:none}" +
        R + "[data-ecw-page]{touch-action:pan-y}" +
        R + ":focus-visible{box-shadow:inset 0 0 0 2px var(--ecw-focus)}" +
        R + "[data-ecw-dragging]," + R + "[data-ecw-dragging] *{cursor:grabbing!important}" +
        R + " img{-webkit-user-drag:none}" +
        R + "-layer{position:absolute;inset:0;isolation:isolate;transform-origin:50% 50%}" +
        R + "-zoom{position:absolute;inset:0;transform-origin:50% 50%}" +
        R + ":not([data-ecw-ready]) [data-ecw-copy]{opacity:0}" +
        R + " [data-ecw-copy]{position:absolute;inset:0;pointer-events:none}" +
        R + " [data-ecw-copy]:not([data-ecw-placed]){opacity:0}" +
        R + " [data-ecw-item]{pointer-events:auto;position:absolute!important;left:0!important;top:0!important;right:auto!important;bottom:auto!important;margin:0!important;flex:none!important;transition:opacity .7s " + EASE + ",scale .7s " + EASE + ",filter .35s ease}" +
        // a list item's card fills its place, whatever size its instance has in the list (only a wrapper's only child:
        // a card that is itself the item keeps its own layers)
        R + " [data-ecw-item]>:only-child{width:100%!important;height:100%!important;max-width:none!important;max-height:none!important}" +
        R + " [data-ecw-item]:not([data-ecw-in]){opacity:0;scale:var(--ecw-from)}" +
        R + "[data-ecw-instant] [data-ecw-item]{transition:none!important}" +
        R + "[data-ecw-settled] [data-ecw-item]{transition:scale .45s " + EASE + ",filter .35s ease}" +
        R + "[data-ecw-fading] [data-ecw-item]{transition:opacity .5s " + EASE + ",scale .5s " + EASE + ",filter .35s ease!important}" +
        R + "[data-ecw-swap] [data-ecw-item]{opacity:0!important;scale:.97;transition:none!important}" +
        R + "[data-ecw-leaving] [data-ecw-item]{opacity:0!important;scale:.94!important;transition:opacity .3s ease,scale .34s " + EASE + "!important}" +
        R + " [data-ecw-item][data-ecw-off]{opacity:0;pointer-events:none}" +
        R + " [data-ecw-dupe][data-ecw-off]{visibility:hidden}" +
        R + " [data-ecw-item][data-ecw-hover]{scale:var(--ecw-scale);z-index:2}" +
        R + "[data-ecw-dim][data-ecw-hovering]:not([data-ecw-dragging]) [data-ecw-item]:not([data-ecw-hover]){filter:opacity(var(--ecw-others))}" +
        // the Images cards
        R + "-own{display:block;position:relative;overflow:hidden;background:var(--ecw-fill);border-radius:var(--ecw-radius);text-decoration:none}" +
        R + "-own img{display:block;width:100%;height:100%;object-fit:cover;pointer-events:none}" +
        R + "-cap{position:absolute;left:0;right:0;bottom:0;padding:28px 12px 11px;background:linear-gradient(0deg,rgba(0,0,0,.55),rgba(0,0,0,0));opacity:0;translate:0 6px;transition:opacity .3s ease,translate .4s " + EASE + "}" +
        R + "-cap p{margin:0}" +
        R + "-own:hover " + R + "-cap," + R + "-own:focus-visible " + R + "-cap{opacity:1;translate:0 0}" +
        R + "-own:focus-visible{outline:2px solid var(--ecw-focus);outline-offset:2px}" +
        // the cursor label and the hint
        R + "-label{position:absolute;left:0;top:0;z-index:4;pointer-events:none;padding:6px 10px 7px;border-radius:999px;background:var(--ecw-label-fill);opacity:0;scale:.85;transition:opacity .2s ease,scale .25s " + EASE + ";white-space:nowrap}" +
        R + "[data-ecw-hovering]:not([data-ecw-dragging]) " + R + "-label{opacity:1;scale:1}" +
        R + "-hint{position:absolute;left:50%;top:50%;z-index:4;pointer-events:none;padding:9px 14px 10px;border-radius:999px;background:var(--ecw-hint-fill);translate:-50% -40%;opacity:0;transition:opacity .4s ease,translate .5s " + EASE + ";white-space:nowrap}" +
        R + "-hint[data-on]{opacity:1;translate:-50% -50%}" +
        R + "-label p," + R + "-hint p{margin:0}" +
        // the spotlight
        R + "-light{position:absolute;left:-50%;top:-50%;width:200%;height:200%;z-index:3;pointer-events:none;opacity:var(--ecw-light);background:radial-gradient(circle at 50% 50%,transparent 0px,transparent var(--ecw-light-in),var(--ecw-shade) var(--ecw-light-out))}" +
        // the buttons
        R + "-bar{position:absolute;z-index:5;display:flex;gap:4px;padding:4px;border-radius:16px;background:var(--ecw-btn-fill);box-shadow:inset 0 0 0 1px var(--ecw-btn-border);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);cursor:default;touch-action:manipulation}" +
        // --ecw-lift: how much of the wall's bottom a phone browser's bar covers (set while it does)
        R + "-bar[data-pos^=bottom]{bottom:calc(16px + var(--ecw-lift, 0px))}" +
        R + "-bar[data-pos^=top]{top:16px}" +
        R + "-bar[data-pos=bottom]," + R + "-bar[data-pos=top]{left:50%;translate:-50% 0}" +
        R + "-bar[data-pos$=left]{left:16px}" +
        R + "-bar[data-pos$=right]{right:16px}" +
        R + "-btn{all:unset;box-sizing:border-box;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:12px;color:var(--ecw-btn-icon);cursor:pointer;transition:background-color .2s ease}" +
        R + "-btn:hover{background-color:rgba(128,128,128,.24)}" +
        R + "-btn:focus-visible{box-shadow:0 0 0 2px var(--ecw-focus)}" +
        R + "-btn svg{width:18px;height:18px;display:block}" +
        R + "-empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font:500 13px/1.45 system-ui,sans-serif;color:rgba(128,128,128,1);pointer-events:none}" +
        R + "[data-ecw-ready]:not([data-ecw-empty]) " + R + "-empty[data-ecw-hint-empty=list]{display:none}" +
        R + "[data-ecw-empty] " + R + "-bar," + R + "[data-ecw-empty] " + R + "-hint," + R + "[data-ecw-empty] " + R + "-label{display:none}" +
        "@media (prefers-reduced-motion: reduce){" + R + " [data-ecw-item]{transition:none!important}" + R + "-hint," + R + "-label," + R + "-btn{transition:none}}"
    )
}

// ---------- icons (stroke = the Icon colour)
const Svg = (p: { children: React.ReactNode }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        {p.children}
    </svg>
)
const ShuffleIcon = () => (
    <Svg>
        <path d="M16 3h5v5" />
        <path d="M4 20 21 3" />
        <path d="M21 16v5h-5" />
        <path d="m15 15 6 6" />
        <path d="M4 4l5 5" />
    </Svg>
)
const ZoomOutIcon = () => (
    <Svg>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
        <path d="M8 11h6" />
    </Svg>
)
const ZoomInIcon = () => (
    <Svg>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
        <path d="M8 11h6" />
        <path d="M11 8v6" />
    </Svg>
)

interface Item {
    el: HTMLElement
    t: Placed
    videos: HTMLVideoElement[]
    playing: boolean | null
    off: boolean | null
    sx?: number
    sy?: number
}

/**
 * Endless CMS Wall
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function EndlessCMSWall(props: Props) {
    const L: LayoutProps = { ...D.layout, ...(props.layout || {}) }
    const M: MotionProps = { ...D.motion, ...(props.motion || {}) }
    const HV: HoverProps = { ...D.hover, ...(props.hover || {}) }
    const I: InteractionProps = { ...D.interaction, ...(props.interaction || {}) }
    const B: ButtonsProps = { ...D.buttons, ...(props.buttons || {}) }
    const CL: TextBox = { ...D.cursorLabel, ...(props.cursorLabel || {}) }
    const HN: TextBox = { ...D.hint, ...(props.hint || {}) }
    const CP: CaptionProps = { ...D.captions, ...(props.captions || {}) }
    const CO: ColorProps = { ...D.colors, ...(props.colors || {}) }
    const A: A11yProps = { ...D.a11y, ...(props.a11y || {}) }
    const images = (Array.isArray(props.images) ? props.images : []).filter((im) => !!(im && im.image && im.image.src))
    // the slot's element, kept the same while only the wall's own state changes (see the copies below)
    const slot = React.useMemo(() => React.Children.toArray(props.content)[0] || null, [props.content])
    const manual = !slot && images.length > 0

    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const cls = "ecw" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
    const zoomOn = num(I.zoomOut, 0.6) < 0.999

    const rootRef = React.useRef<HTMLDivElement>(null)
    const zoomRef = React.useRef<HTMLDivElement>(null)
    const labelRef = React.useRef<HTMLDivElement>(null)
    const lightRef = React.useRef<HTMLDivElement>(null)
    const [copies, setCopies] = React.useState(1)
    const [hint, setHint] = React.useState(false)
    // the zoom button: whether zoom is there (a short list may leave no room for it) and whether the wall is zoomed out
    const [zoomState, setZoomState] = React.useState({ available: zoomOn, zoomed: false })

    // everything the loop needs lives in one mutable object, never in React state
    const S = React.useRef<any>(null)
    if (!S.current) {
        S.current = {
            items: [] as Item[],
            grid: null as Grid | null,
            sig: "",
            ox: 0,
            oy: 0,
            vx: 0,
            vy: 0,
            px: 0,
            py: 0,
            down: null,
            dragging: false,
            suppress: false,
            lastInput: 0,
            hoverEl: null as HTMLElement | null,
            raf: 0,
            running: false,
            width: 0,
            height: 0,
            driftAmt: 0,
            zs: 1,
            zt: 1,
            zMin: 1,
            zc: null,
            pinch: null,
            touches: new Map<number, { x: number; y: number }>(),
            revealed: false,
            reduce: false,
            visible: true,
            shuffleSeed: 0,
            visitSeed: 0,
            own: new WeakMap<HTMLElement, number>(),
            extra: new WeakMap<HTMLElement, ExtraRec>(),
            fontGen: 0,
        }
    }
    const opts = React.useRef<any>({})
    opts.current = { L, M, HV, I, B, isStatic, isCanvas }

    // ---------- zoom state for the button, only when it changes (a transition: it may land while the page hydrates)
    const announceZoom = () => {
        const st = S.current
        const available = st.zMin < 0.999
        const zoomed = available && st.zt < 0.99
        const key = (available ? "a" : "-") + (zoomed ? "z" : "1")
        if (st.zAnn === key) return
        st.zAnn = key
        React.startTransition(() => setZoomState((p) => (p.available === available && p.zoomed === zoomed ? p : { available, zoomed })))
    }

    // ---------- collect the cards of every copy and lay them out
    const collect = React.useCallback(() => {
        const root = rootRef.current
        const st = S.current
        if (!root) return
        const o = opts.current
        const width = root.offsetWidth
        const height = root.offsetHeight
        if (!width || !height) return
        st.reduce = !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const copyEls = Array.from(root.querySelectorAll("[data-ecw-copy]")) as HTMLElement[]
        const perCopy: HTMLElement[][] = []
        const depthWanted = typeof st.cardDepth === "number" ? st.cardDepth : -1
        for (const ce of copyEls) {
            const { cards: found, depth } = cardsIn(ce, depthWanted)
            const copy = Number(ce.getAttribute("data-ecw-copy"))
            perCopy[copy] = found
            // where the cards sit, learnt while the list holds two or more (structure only: no names, no classes)
            if (copy === 0 && found.length >= 2) st.cardDepth = depth
            // the list and its wrappers must not clip or position the cards: the copy layer does
            let p = found[0] ? found[0].parentElement : null
            while (p && p !== ce) {
                p.style.setProperty("position", "static", "important")
                p.style.setProperty("overflow", "visible", "important")
                p.style.setProperty("transform", "none", "important")
                p = p.parentElement
            }
        }
        const base = perCopy[0] || []
        const uniform = o.L.shape === "uniform"
        const ratios = base.map((el) => (uniform ? clamp(num(o.L.ratio, 0.8), 0.2, 5) : ratioOf(el, st.own)))
        // each card's strip and frame at the column width the wall gives it (a title may wrap there)
        const { at: extras, own: ownExtras } = extrasAt(base, st.extra, columnsFor(width, o.L).colW, st.fontGen)
        // when the cards change (a CMS filter, an edit), Framer has already removed some: the rest is hidden at once,
        // laid out again and faded back in from the middle; cards never fly across each other (a new width is no change)
        const itemsSig = base.length + ":" + ratios.map((r, i) => r.toFixed(3) + "+" + ownExtras[i].w + "x" + ownExtras[i].h).join(",")
        const animated = st.revealed && !o.isStatic && !st.reduce
        if (st.grid && st.itemsSig !== undefined && itemsSig !== st.itemsSig && animated && !st.swap) {
            st.swap = "ready"
            window.clearTimeout(st.fadeTimer)
            root.removeAttribute("data-ecw-fading")
            root.setAttribute("data-ecw-swap", "")
        }
        // the order: the list's, a fixed shuffle (Seed), or a new one each visit (picked here, after the page is up)
        if (o.L.order === "visit" && !st.visitSeed) st.visitSeed = 1 + Math.floor(Math.random() * 998)
        const seedNow = st.shuffleSeed || (o.L.order === "visit" ? st.visitSeed : num(o.L.seed, 7))
        const run: LayoutRun = { ...o.L, seedNow, shuffled: !!st.shuffleSeed || o.L.order !== "list" }
        // Zoom Out: laid out for the farthest zoom; with few cards that would take too many copies, so the reach shrinks
        const zMinWanted = o.isStatic ? 1 : clamp(num(o.I.zoomOut, 0.6), 0.3, 1)
        let reach = zMinWanted < 0.999 ? 1 / zMinWanted : 1
        while (reach > 1 && copiesFor(base.length, ratios, extras, width, height, run, reach) >= maxCopiesFor(base.length)) reach = Math.max(1, reach - 0.1)
        st.zMin = 1 / reach
        if (st.zt < st.zMin) st.zt = st.zMin
        if (!o.isStatic) announceZoom()
        const want = copiesFor(base.length, ratios, extras, width, height, run, reach)
        // the wall shows the first set at once; the copies it needs step into their places as they render. First asked
        // as a transition (it lands once the page allows). While the rest of the page is still hydrating (a slow phone)
        // the transition can be held back for good, and a plain update then would make React redraw parts that are not
        // ready ("recoverable error" #421; both found on Endless CMS Reel, 2026-10-30): so the wall waits until the
        // page has gone quiet, then asks again with a plain update, and looks once more until the copies are there
        if (base.length && want !== copyEls.length) {
            const now = performance.now()
            if (st.copiesAsked !== want) {
                st.copiesAsked = want
                st.asks = 0
            }
            if (!st.asks || (st.quiet && now - st.askedAt > 400)) {
                const plain = st.asks > 0
                st.asks++
                st.askedAt = now
                const ask = () => (plain ? setCopies(want) : React.startTransition(() => setCopies(want)))
                if (st.revealed || plain) ask()
                else window.requestAnimationFrame(() => window.setTimeout(ask, 0))
            }
            if (!st.quiet && !st.waitingQuiet) {
                // quiet: two idle moments of the browser (or, without idle callbacks, a second and a half after the
                // page has loaded); at most 10 s
                st.waitingQuiet = true
                const t0 = performance.now()
                const done = () => {
                    st.quiet = true
                    if (S.current.collect) S.current.collect()
                }
                if (typeof window.requestIdleCallback === "function") {
                    let calm = 0
                    const idle = (d: IdleDeadline) => {
                        calm = d.didTimeout ? 0 : calm + 1
                        if (calm >= 2 || performance.now() - t0 > 10000) done()
                        else st.idleId = window.requestIdleCallback(idle, { timeout: 2000 })
                    }
                    st.idleId = window.requestIdleCallback(idle, { timeout: 2000 })
                } else {
                    const go = () => {
                        st.quietTimer = window.setTimeout(done, 1500)
                    }
                    st.quietGo = go
                    if (document.readyState === "complete") go()
                    else window.addEventListener("load", go, { once: true })
                }
            }
            window.clearTimeout(st.copyTimer)
            st.copyTimer = window.setTimeout(() => {
                if (S.current.collect) S.current.collect()
            }, 450)
        } else if (want === copyEls.length) {
            st.copiesAsked = 0
            st.asks = 0
            window.clearTimeout(st.copyTimer)
        }
        const useCopies = base.length ? want : Math.min(want, copyEls.length)

        const sig = [width, height, useCopies, reach.toFixed(2), JSON.stringify(run), itemsSig, extras.map((e) => e.w + "x" + e.h).join(",")].join("|")
        if (sig !== st.sig) {
            const G = buildGrid(ratios, extras, useCopies, width, height, run, reach)
            if (!st.grid) {
                st.ox = G.ox
                st.oy = G.oy
            }
            st.grid = G
            st.sig = sig
        }
        const G: Grid = st.grid
        st.width = width
        st.height = height
        if (st.lx === undefined) {
            st.lx = width / 2
            st.ly = height / 2
        }

        const items: Item[] = []
        const placed = new Set<HTMLElement>()
        for (const t of G.tiles) {
            const el = perCopy[t.copy] && perCopy[t.copy][t.index]
            if (!el) continue
            placed.add(el)
            el.setAttribute("data-ecw-item", "")
            el.removeAttribute("data-ecw-rest")
            el.style.removeProperty("display")
            if (t.copy > 0) {
                el.setAttribute("data-ecw-dupe", "")
                el.querySelectorAll("a,button,input,select,textarea,[tabindex]").forEach((a) => a.setAttribute("tabindex", "-1"))
            }
            el.style.setProperty("width", G.colW + "px", "important")
            el.style.setProperty("height", t.h + "px", "important")
            const videos = Array.from(el.querySelectorAll("video")) as HTMLVideoElement[]
            for (const v of videos) {
                v.muted = true
                v.playsInline = true
                v.loop = true
            }
            items.push({ el, t, videos, playing: null, off: null })
        }
        // cards left over (more copies than needed) are put aside, hidden, and still found next time
        const cards = new Set<HTMLElement>()
        for (const list of perCopy)
            for (const el of list || []) {
                cards.add(el)
                if (placed.has(el)) continue
                el.removeAttribute("data-ecw-item")
                el.setAttribute("data-ecw-rest", "")
                el.style.setProperty("display", "none")
            }
        // a layer the wall placed before that is no longer a card (the list changed under it) gets its own look back
        for (const ce of copyEls)
            for (const el of Array.from(ce.querySelectorAll("[data-ecw-item],[data-ecw-rest]")) as HTMLElement[]) {
                if (cards.has(el)) continue
                for (const a of ["data-ecw-item", "data-ecw-rest", "data-ecw-dupe", "data-ecw-in", "data-ecw-off", "data-ecw-hover"]) el.removeAttribute(a)
                for (const k of ["width", "height", "translate", "display", "transition-delay"]) el.style.removeProperty(k)
            }
        for (const ce of copyEls) ce.setAttribute("data-ecw-placed", "")
        st.items = items
        st.itemsSig = itemsSig
        // an empty list (no items, or a filter that finds none): the canvas says so, the live site shows nothing
        if (items.length) root.removeAttribute("data-ecw-empty")
        else root.setAttribute("data-ecw-empty", "")
        place(true)
        root.setAttribute("data-ecw-ready", "")
        if (!st.revealed && items.length) reveal()
        else for (const it of items) it.el.setAttribute("data-ecw-in", "")
        if (st.swap === "ready") {
            st.swap = null
            fadeIn()
        }
        kick()
    }, [copies])
    S.current.collect = collect

    // ---------- Shuffle: the wall fades out in place, takes a new random order and fades back in from the middle
    const shuffle = () => {
        const st = S.current
        const root = rootRef.current
        if (!root || !st.grid) return
        const animate = !st.reduce && !opts.current.isStatic
        const apply = () => {
            let seed = st.shuffleSeed
            while (seed === st.shuffleSeed) seed = 1 + Math.floor(Math.random() * 998)
            st.shuffleSeed = seed
            st.sig = ""
            st.vx = st.vy = st.px = st.py = 0
            setHover(null)
            if (animate) root.setAttribute("data-ecw-swap", "")
            root.removeAttribute("data-ecw-leaving")
            if (st.collect) st.collect()
            if (animate) window.requestAnimationFrame(fadeIn)
        }
        window.clearTimeout(st.shuffleT)
        st.lastInput = performance.now()
        setHint(false)
        if (animate) {
            root.setAttribute("data-ecw-leaving", "")
            st.shuffleT = window.setTimeout(apply, 340)
        } else apply()
    }

    // ---------- after a change of cards: back in, from the middle outwards
    const fadeIn = () => {
        const st = S.current
        const root = rootRef.current
        if (!root || !st.grid) return
        const cx = st.width / 2
        const cy = st.height / 2
        const diag = Math.hypot(cx, cy) || 1
        for (const it of st.items as Item[]) {
            const d = Math.hypot((it.sx || 0) + st.grid.colW / 2 - cx, (it.sy || 0) + it.t.h / 2 - cy)
            it.el.style.transitionDelay = Math.round((d / diag) * 320) + "ms"
        }
        root.setAttribute("data-ecw-fading", "")
        void root.offsetWidth
        root.removeAttribute("data-ecw-swap")
        window.clearTimeout(st.fadeTimer)
        st.fadeTimer = window.setTimeout(() => {
            root.removeAttribute("data-ecw-fading")
            for (const it of st.items as Item[]) it.el.style.transitionDelay = ""
        }, 1000)
    }

    // ---------- the first cards: they simply show (no opening of its own: the wall is one part of a page, and an entrance
    // is the site's choice, for example a native appear effect on the wall)
    const reveal = () => {
        const st = S.current
        const root = rootRef.current
        st.revealed = true
        if (root) root.setAttribute("data-ecw-instant", "")
        for (const it of st.items as Item[]) it.el.setAttribute("data-ecw-in", "")
        window.setTimeout(() => {
            if (!rootRef.current) return
            rootRef.current.setAttribute("data-ecw-settled", "")
            rootRef.current.removeAttribute("data-ecw-instant")
        }, 50)
    }

    // ---------- positions
    const place = (force?: boolean) => {
        const st = S.current
        const G: Grid | null = st.grid
        if (!G) return
        const zs = st.zs
        const margin = 120
        const bufX = G.colW + G.gap
        const ex = zs < 1 ? (st.width / 2) * (1 / zs - 1) : 0
        const ey = zs < 1 ? (st.height / 2) * (1 / zs - 1) : 0
        const playable = st.visible && !st.reduce && !opts.current.isStatic
        for (const it of st.items as Item[]) {
            const t = it.t
            const H = G.heights[t.col]
            const bufY = G.maxH[t.col] + G.gap
            const x = mod(t.col * (G.colW + G.gap) + st.ox + bufX + ex, G.W) - bufX - ex
            const y = mod(t.y + G.offsets[t.col] + st.oy + bufY + ey, H) - bufY - ey
            const off = x + G.colW < -margin - ex || x > st.width + margin + ex || y + t.h < -margin - ey || y > st.height + margin + ey
            if (force || it.sx !== x || it.sy !== y) {
                it.el.style.setProperty("translate", x.toFixed(1) + "px " + y.toFixed(1) + "px 0px")
                it.sx = x
                it.sy = y
            }
            if (off !== it.off) {
                it.off = off
                if (off) it.el.setAttribute("data-ecw-off", "")
                else it.el.removeAttribute("data-ecw-off")
            }
            const play = !off && playable
            if (it.videos.length && play !== it.playing) {
                it.playing = play
                for (const v of it.videos) {
                    if (play) {
                        const p = v.play()
                        if (p && p.catch) p.catch(() => {})
                    } else v.pause()
                }
            }
        }
    }

    // ---------- zoom to s around st.zc (the wall's px; the middle when null): what is under that point stays there
    const zoomTo = (s: number) => {
        const st = S.current
        const old = st.zs
        if (s === old) return
        const cx = st.width / 2
        const cy = st.height / 2
        const p = st.zc || { x: cx, y: cy }
        st.ox += (p.x - cx) * (1 / s - 1 / old)
        st.oy += (p.y - cy) * (1 / s - 1 / old)
        st.zs = s
    }
    const zoomRequest = (target: number, p: { x: number; y: number } | null) => {
        const st = S.current
        if (st.zMin >= 0.999) return
        st.zc = p
        st.zt = clamp(target, st.zMin, 1)
        st.lastInput = performance.now()
        setHint(false)
        announceZoom()
        kick()
    }

    // ---------- the loop runs only while something moves (never on the canvas or in an export)
    const kick = () => {
        const st = S.current
        if (st.running || opts.current.isStatic) return
        st.running = true
        let last = performance.now()
        const step = (now: number) => {
            const o = opts.current
            const dt = Math.min(48, now - last) / 16.667
            last = now
            let moving = false
            if (!st.dragging) {
                // wheel and key input ease in, a flick glides out
                const ex = st.px * 0.22
                const ey = st.py * 0.22
                st.px -= ex
                st.py -= ey
                st.ox += ex + st.vx * dt
                st.oy += ey + st.vy * dt
                const f = Math.pow(clamp(num(o.M.glide, 0.93), 0.5, 0.995), dt)
                st.vx *= f
                st.vy *= f
                if (Math.abs(st.vx) < 0.02) st.vx = 0
                if (Math.abs(st.vy) < 0.02) st.vy = 0
                if (Math.abs(st.px) < 0.1) st.px = 0
                if (Math.abs(st.py) < 0.1) st.py = 0
                moving = !!(st.vx || st.vy || st.px || st.py)
            }
            const deg = num(o.M.direction, 250)
            const a = (deg * Math.PI) / 180
            // the slow drift: paused while the visitor is busy, over a card (Pause on Hover) or the wall is off screen
            const speed = Math.max(0, num(o.M.drift, 0))
            const idle = now - st.lastInput > 2500 && !st.down && !(o.M.pauseOnHover && st.hoverEl)
            const target = speed > 0 && idle && !st.reduce && st.visible ? 1 : 0
            st.driftAmt += (target - st.driftAmt) * 0.03 * dt
            if (st.driftAmt < 0.001 && target === 0) st.driftAmt = 0
            if (st.driftAmt > 0) {
                st.ox += Math.cos(a) * speed * st.driftAmt * (dt / 60)
                st.oy += Math.sin(a) * speed * st.driftAmt * (dt / 60)
                moving = true
                // the wall moves under a still cursor: now and then check which card is under it
                if (st.mouse && !st.dragging && (st.frame = (st.frame || 0) + 1) % 8 === 0) {
                    const hit = document.elementFromPoint(st.mouse.x, st.mouse.y) as HTMLElement | null
                    const item = hit && rootRef.current && rootRef.current.contains(hit) ? (hit.closest("[data-ecw-item]") as HTMLElement | null) : null
                    setHover(item)
                }
            }
            // zoom eases to its target around its point
            if (st.zs !== st.zt) {
                let ns = st.reduce ? st.zt : st.zs + (st.zt - st.zs) * (1 - Math.pow(0.72, dt))
                if (Math.abs(ns - st.zt) < 0.0008) ns = st.zt
                zoomTo(ns)
                moving = true
            }
            const zoomer = zoomRef.current
            if (zoomer) zoomer.style.transform = st.zs !== 1 ? "scale(" + st.zs.toFixed(4) + ")" : ""
            place()
            // the spotlight eases after the cursor, and back to the middle when the cursor leaves
            let lighting = false
            const light = lightRef.current
            if (light && st.lx !== undefined) {
                const tx = st.lightTarget ? st.lightTarget.x : st.width / 2
                const ty = st.lightTarget ? st.lightTarget.y : st.height / 2
                const k = 1 - Math.pow(0.86, dt)
                st.lx += (tx - st.lx) * k
                st.ly += (ty - st.ly) * k
                if (Math.abs(tx - st.lx) < 0.3 && Math.abs(ty - st.ly) < 0.3) {
                    st.lx = tx
                    st.ly = ty
                } else lighting = true
                light.style.translate = (st.lx - st.width / 2).toFixed(1) + "px " + (st.ly - st.height / 2).toFixed(1) + "px"
            }
            const drifting = speed > 0 && !st.reduce && st.visible
            if (moving || lighting || st.dragging || st.zs !== st.zt || drifting || st.driftAmt > 0) st.raf = window.requestAnimationFrame(step)
            else st.running = false
        }
        st.raf = window.requestAnimationFrame(step)
    }

    const setHover = (el: HTMLElement | null) => {
        const st = S.current
        if (st.hoverEl === el) return
        if (st.hoverEl) st.hoverEl.removeAttribute("data-ecw-hover")
        st.hoverEl = el
        const root = rootRef.current
        if (el) {
            el.setAttribute("data-ecw-hover", "")
            if (root) root.setAttribute("data-ecw-hovering", "")
        } else if (root) root.removeAttribute("data-ecw-hovering")
        if (!el) kick()
    }

    // ---------- measure and lay out after every render, and whenever the size, the list or an image changes
    useIso(() => {
        collect()
    })
    React.useEffect(() => {
        const root = rootRef.current
        if (!root) return
        const st = S.current
        let timer = 0
        const later = () => {
            window.clearTimeout(timer)
            timer = window.setTimeout(collect, 60)
        }
        const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(later) : null
        if (ro) ro.observe(root)
        // the list changes (a filter, a CMS edit): only the wall's own copies are watched
        const mo = typeof MutationObserver !== "undefined" ? new MutationObserver(later) : null
        if (mo) root.querySelectorAll("[data-ecw-copy]").forEach((c) => mo.observe(c, { childList: true, subtree: true }))
        const onLoad = (e: Event) => {
            const t = e.target as HTMLElement
            if (t && (t.tagName === "IMG" || t.tagName === "VIDEO")) later()
        }
        root.addEventListener("load", onLoad, true)
        root.addEventListener("loadedmetadata", onLoad, true)
        // a web font that arrives after the cards were read can wrap a title differently: they are read again
        const fonts = typeof document !== "undefined" ? (document.fonts as FontFaceSet | undefined) : undefined
        const onFonts = () => {
            st.fontGen++
            later()
        }
        if (fonts && fonts.addEventListener) fonts.addEventListener("loadingdone", onFonts)
        // off screen: the drift and the videos pause, and start again when the wall comes back
        const io =
            typeof IntersectionObserver !== "undefined"
                ? new IntersectionObserver((entries) => {
                      const v = entries.some((e) => e.isIntersecting)
                      if (v === st.visible) return
                      st.visible = v
                      place(true)
                      if (v) kick()
                  })
                : null
        if (io) io.observe(root)
        return () => {
            window.clearTimeout(timer)
            window.clearTimeout(st.copyTimer)
            window.clearTimeout(st.quietTimer)
            if (st.idleId && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(st.idleId)
            if (st.quietGo) window.removeEventListener("load", st.quietGo)
            st.waitingQuiet = false
            if (ro) ro.disconnect()
            if (mo) mo.disconnect()
            if (io) io.disconnect()
            root.removeEventListener("load", onLoad, true)
            root.removeEventListener("loadedmetadata", onLoad, true)
            if (fonts && fonts.removeEventListener) fonts.removeEventListener("loadingdone", onFonts)
        }
    }, [collect, copies])

    // ---------- a phone browser's bar over the wall's bottom (a 100vh wall on iOS Safari): the buttons rise above it.
    // Only a small cover counts (up to 160 px, while the wall's top is well in view); a wall further down the page
    // keeps its buttons where they are.
    React.useEffect(() => {
        const root = rootRef.current
        if (!root || isStatic) return
        const st = S.current
        let frame = 0
        const measure = () => {
            frame = 0
            const vv = window.visualViewport
            const visibleBottom = vv ? vv.offsetTop + vv.height : window.innerHeight
            const r = root.getBoundingClientRect()
            const covered = r.bottom - visibleBottom
            const lift = covered > 0 && covered < 160 && r.top < visibleBottom - 160 ? Math.round(covered) : 0
            if (lift !== st.lift) {
                st.lift = lift
                root.style.setProperty("--ecw-lift", lift + "px")
            }
        }
        const later = () => {
            if (!frame) frame = window.requestAnimationFrame(measure)
        }
        measure()
        window.addEventListener("resize", later)
        window.addEventListener("scroll", later, { passive: true })
        const vv = window.visualViewport
        if (vv) {
            vv.addEventListener("resize", later)
            vv.addEventListener("scroll", later)
        }
        return () => {
            if (frame) window.cancelAnimationFrame(frame)
            window.removeEventListener("resize", later)
            window.removeEventListener("scroll", later)
            if (vv) {
                vv.removeEventListener("resize", later)
                vv.removeEventListener("scroll", later)
            }
        }
    }, [isStatic])

    // ---------- pointer, wheel, keys and focus (the live site and Preview only)
    React.useEffect(() => {
        const root = rootRef.current
        if (!root || isStatic) return
        const st = S.current
        // a finger moves a little even in a tap: up to 10 px is still a tap
        const slop = (e: PointerEvent) => (e.pointerType === "mouse" ? 6 : 10)
        const inBar = (t: EventTarget | null) => !!(t && (t as HTMLElement).closest && (t as HTMLElement).closest("[data-ecw-bar]"))
        const linkOf = (el: HTMLElement) => (el.matches("a[href]") ? el : el.querySelector("a[href]")) as HTMLAnchorElement | null
        // opens a card's own link: Framer opens links on a press on phones and on a click on computers, so it gets both
        const openLink = (a: HTMLElement) => {
            const r = a.getBoundingClientRect()
            const o: PointerEventInit = { bubbles: true, cancelable: true, composed: true, isPrimary: true, pointerId: 77, pointerType: "touch", button: 0, buttons: 1, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }
            try {
                a.dispatchEvent(new PointerEvent("pointerdown", o))
                a.dispatchEvent(new PointerEvent("pointerup", { ...o, buttons: 0 }))
            } catch (err) {}
            a.click()
        }
        // a point on screen in the wall's own px (the page may be scaled)
        const rootPoint = (x: number, y: number) => {
            const r = root.getBoundingClientRect()
            const k = root.offsetWidth ? r.width / root.offsetWidth : 1
            return { x: (x - r.left) / k, y: (y - r.top) / k }
        }
        const aim = (e: PointerEvent) => {
            if (!lightRef.current) return
            const r = root.getBoundingClientRect()
            const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
            st.lightTarget = inside ? rootPoint(e.clientX, e.clientY) : null
            kick()
        }

        // while a pointer is down, its moves and its end are followed even outside the wall
        let follow = false
        const startFollow = () => {
            if (follow) return
            follow = true
            window.addEventListener("pointermove", onMove)
            window.addEventListener("pointerup", onUp)
            window.addEventListener("pointercancel", onUp)
        }
        const stopFollow = () => {
            if (!follow || st.down || st.touches.size) return
            follow = false
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerup", onUp)
            window.removeEventListener("pointercancel", onUp)
        }

        const onDown = (e: PointerEvent) => {
            if ((e.button !== 0 && e.pointerType === "mouse") || !e.isTrusted || inBar(e.target)) return
            const tg = e.target as HTMLElement
            // a finger's tap is recognised on pointer-up (browsers may drop the click of the first tap after a drag)
            st.tap = e.pointerType !== "mouse" && (!st.touches.size || e.pointerType !== "touch") ? { id: e.pointerId, x: e.clientX, y: e.clientY, t0: performance.now(), target: tg, moving: Math.hypot(st.vx || 0, st.vy || 0) > 2 } : null
            startFollow()
            if (e.pointerType === "touch") {
                st.touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
                // a second finger: pinch to zoom (it takes over from the drag the first finger began)
                if (st.touches.size === 2 && st.zMin < 0.999) {
                    const [p1, p2] = Array.from(st.touches.values()) as { x: number; y: number }[]
                    const m = rootPoint((p1.x + p2.x) / 2, (p1.y + p2.y) / 2)
                    st.pinch = { d0: Math.max(10, Math.hypot(p1.x - p2.x, p1.y - p2.y)), s0: st.zs, mx: m.x, my: m.y }
                    st.zt = st.zs
                    st.down = null
                    st.dragging = false
                    root.removeAttribute("data-ecw-dragging")
                    st.vx = st.vy = st.px = st.py = 0
                    setHover(null)
                    setHint(false)
                    st.lastInput = performance.now()
                    kick()
                    return
                }
                if (st.pinch) return
            }
            st.down = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, lt: performance.now() }
            st.vx = 0
            st.vy = 0
            st.lastInput = performance.now()
            if (e.pointerType !== "mouse") aim(e)
            kick()
        }
        // hover and the cursor label (the mouse over the wall, no button down)
        const onHoverMove = (e: PointerEvent) => {
            if (e.pointerType !== "mouse" || st.down) return
            st.mouse = { x: e.clientX, y: e.clientY }
            const item = !inBar(e.target) && (e.target as HTMLElement).closest ? ((e.target as HTMLElement).closest("[data-ecw-item]") as HTMLElement | null) : null
            setHover(item)
            const label = labelRef.current
            if (label) {
                const p = rootPoint(e.clientX, e.clientY)
                label.style.translate = (p.x + 14).toFixed(1) + "px " + (p.y + 14).toFixed(1) + "px"
            }
            aim(e)
        }
        const onMove = (e: PointerEvent) => {
            if (e.pointerType === "touch" && st.touches.has(e.pointerId)) {
                st.touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
                if (st.pinch && st.touches.size >= 2) {
                    // the fingers' middle carries the wall, their distance zooms it
                    const [p1, p2] = Array.from(st.touches.values()) as { x: number; y: number }[]
                    const m = rootPoint((p1.x + p2.x) / 2, (p1.y + p2.y) / 2)
                    const P = st.pinch
                    st.ox += (m.x - P.mx) / st.zs
                    st.oy += (m.y - P.my) / st.zs
                    P.mx = m.x
                    P.my = m.y
                    st.zc = m
                    const s = clamp((P.s0 * Math.hypot(p1.x - p2.x, p1.y - p2.y)) / P.d0, st.zMin, 1)
                    zoomTo(s)
                    st.zt = s
                    announceZoom()
                    st.lastInput = performance.now()
                    kick()
                    return
                }
            }
            if (st.down) aim(e)
            if (st.tap && st.tap.id === e.pointerId && Math.hypot(e.clientX - st.tap.x, e.clientY - st.tap.y) > slop(e)) st.tap = null
            const d = st.down
            if (!d || d.id !== e.pointerId) return
            const dx = e.clientX - d.lx
            const dy = e.clientY - d.ly
            if (!st.dragging && Math.hypot(e.clientX - d.x, e.clientY - d.y) > slop(e)) {
                // Page Scroll: a finger that starts mostly up or down is the page's (the browser scrolls it)
                if (opts.current.I.pageScroll && e.pointerType !== "mouse" && Math.abs(e.clientY - d.y) > Math.abs(e.clientX - d.x)) {
                    st.down = null
                    st.tap = null
                    return
                }
                st.dragging = true
                root.setAttribute("data-ecw-dragging", "")
                setHover(null)
                try {
                    root.setPointerCapture(e.pointerId)
                } catch (err) {}
                setHint(false)
            }
            if (st.dragging) {
                const now = performance.now()
                const dt = Math.max(1, now - d.lt) / 16.667
                st.ox += dx / st.zs
                st.oy += dy / st.zs
                st.vx = st.vx * 0.6 + (dx / st.zs / dt) * 0.4
                st.vy = st.vy * 0.6 + (dy / st.zs / dt) * 0.4
                d.lt = now
                st.lastInput = now
            }
            d.lx = e.clientX
            d.ly = e.clientY
        }
        const onUp = (e: PointerEvent) => {
            if (!e.isTrusted) return
            const tap = st.tap
            st.tap = null
            if (tap && tap.id === e.pointerId && e.type === "pointerup" && !tap.moving && !st.pinch && !st.dragging && performance.now() - tap.t0 < 700) onTap(tap.target)
            if (e.pointerType === "touch") {
                st.touches.delete(e.pointerId)
                if (st.pinch) {
                    if (st.touches.size < 2) {
                        st.pinch = null
                        st.suppress = true
                        window.setTimeout(() => (st.suppress = false), 0)
                        st.lastInput = performance.now()
                        kick()
                    }
                    stopFollow()
                    return
                }
            }
            const d = st.down
            if (d && d.id === e.pointerId) {
                if (st.dragging) {
                    st.suppress = true
                    window.setTimeout(() => (st.suppress = false), 0)
                    // a cancelled touch (the browser took it over) or a pause before letting go: no glide
                    if (e.type === "pointercancel" || performance.now() - d.lt > 80) {
                        st.vx = 0
                        st.vy = 0
                    }
                }
                st.dragging = false
                st.down = null
                root.removeAttribute("data-ecw-dragging")
                st.lastInput = performance.now()
                if (e.pointerType !== "mouse") st.lightTarget = null
                kick()
            }
            stopFollow()
        }
        // a finger's tap opens the card it landed on; the browser's own click, if it still comes, is then left out
        const onTap = (target: HTMLElement | null) => {
            if (!target || !target.closest || !root.contains(target) || inBar(target)) return
            const item = target.closest("[data-ecw-item]") as HTMLElement | null
            const a = item ? linkOf(item) : null
            if (!item || !a) return
            st.tapAt = performance.now()
            openLink(a)
        }
        const onClick = (e: MouseEvent) => {
            if (inBar(e.target)) return
            if (e.isTrusted && st.tapAt && performance.now() - st.tapAt < 800) {
                e.preventDefault()
                e.stopPropagation()
                return
            }
            if (st.suppress) {
                e.preventDefault()
                e.stopPropagation()
                st.suppress = false
            }
        }
        const onWheel = (e: WheelEvent) => {
            const o = opts.current
            const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? st.height : 1
            // Ctrl / ⌘ + wheel and a trackpad pinch: zoom around the cursor (without zoom it stays the page zoom)
            if (e.ctrlKey || e.metaKey) {
                if (st.zMin < 0.999) {
                    e.preventDefault()
                    zoomRequest(st.zt * Math.exp(-e.deltaY * unit * 0.0022), rootPoint(e.clientX, e.clientY))
                }
                return
            }
            if (o.I.wheel !== "pan") return
            e.preventDefault()
            let dx = e.deltaX * unit
            let dy = e.deltaY * unit
            if (e.shiftKey && !dx) {
                dx = dy
                dy = 0
            }
            const k = clamp(num(o.I.wheelSpeed, 1), 0.1, 5)
            st.px -= (dx * k) / st.zs
            st.py -= (dy * k) / st.zs
            st.lastInput = performance.now()
            setHint(false)
            kick()
        }
        // keys act only while the wall (or something in it) has the focus
        const onKey = (e: KeyboardEvent) => {
            const o = opts.current
            if (!o.I.keys || e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey) return
            const t = e.target as HTMLElement
            if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
            if (inBar(t) && (e.key === "Enter" || e.key === " ")) return
            if (e.key === "-" || e.key === "_" || e.key === "+" || e.key === "=" || e.key === "0") {
                if (st.zMin >= 0.999) return
                const levels = [1, (1 + st.zMin) / 2, st.zMin]
                let to = 1
                if (e.key === "-" || e.key === "_") {
                    const out = levels.find((l) => l < st.zt - 0.01)
                    to = out === undefined ? st.zMin : out
                } else if (e.key !== "0") {
                    const up = levels.slice().reverse().find((l) => l > st.zt + 0.01)
                    to = up === undefined ? 1 : up
                }
                e.preventDefault()
                zoomRequest(to, null)
                return
            }
            const step = Math.round((st.height * 0.35) / st.zs)
            let dx = 0
            let dy = 0
            if (e.key === "ArrowLeft") dx = step
            else if (e.key === "ArrowRight") dx = -step
            else if (e.key === "ArrowUp") dy = step
            else if (e.key === "ArrowDown") dy = -step
            else return
            e.preventDefault()
            st.px += dx
            st.py += dy
            st.lastInput = performance.now()
            setHint(false)
            kick()
        }
        // a card reached with Tab slides fully into view
        const onFocus = (e: FocusEvent) => {
            const item = (e.target as HTMLElement).closest ? ((e.target as HTMLElement).closest("[data-ecw-item]") as HTMLElement | null) : null
            if (!item || !st.grid) return
            const it = (st.items as Item[]).find((x) => x.el === item)
            if (!it || it.sx === undefined || it.sy === undefined) return
            const z = st.zs
            const cx = st.width / 2
            const cy = st.height / 2
            const pad = 48 / z
            const Lb = cx - cx / z + pad
            const Rb = cx + cx / z - pad
            const Tb = cy - cy / z + pad
            const Bb = cy + cy / z - pad
            let dx = 0
            let dy = 0
            if (it.sx < Lb) dx = Lb - it.sx
            else if (it.sx + st.grid.colW > Rb) dx = Rb - (it.sx + st.grid.colW)
            if (it.sy < Tb) dy = Tb - it.sy
            else if (it.sy + it.t.h > Bb) dy = Bb - (it.sy + it.t.h)
            st.px += dx
            st.py += dy
            st.lastInput = performance.now()
            kick()
        }
        const onLeave = (e: PointerEvent) => {
            st.mouse = null
            setHover(null)
            if (e.pointerType === "mouse" && st.lightTarget) {
                st.lightTarget = null
                kick()
            }
        }
        const noDrag = (e: Event) => e.preventDefault()
        // older browsers without overflow: clip scroll the wall to a focused card: put it back
        const onScroll = () => {
            if (root.scrollLeft || root.scrollTop) {
                root.scrollLeft = 0
                root.scrollTop = 0
            }
        }
        // Safari's trackpad pinch comes as gesture events
        const onGesture = (e: any) => {
            if (st.zMin >= 0.999) return
            e.preventDefault()
            if (st.touches.size) return
            if (e.type === "gesturestart") st.gs0 = st.zt
            else if (e.type === "gesturechange") zoomRequest((st.gs0 || st.zt) * e.scale, rootPoint(e.clientX, e.clientY))
        }

        root.addEventListener("pointerdown", onDown)
        root.addEventListener("pointermove", onHoverMove)
        root.addEventListener("pointerleave", onLeave)
        root.addEventListener("click", onClick, true)
        root.addEventListener("wheel", onWheel, { passive: false })
        root.addEventListener("keydown", onKey)
        root.addEventListener("focusin", onFocus)
        root.addEventListener("dragstart", noDrag)
        root.addEventListener("scroll", onScroll)
        for (const g of ["gesturestart", "gesturechange", "gestureend"]) root.addEventListener(g, onGesture)
        kick()
        return () => {
            root.removeEventListener("pointerdown", onDown)
            root.removeEventListener("pointermove", onHoverMove)
            root.removeEventListener("pointerleave", onLeave)
            root.removeEventListener("click", onClick, true)
            root.removeEventListener("wheel", onWheel)
            root.removeEventListener("keydown", onKey)
            root.removeEventListener("focusin", onFocus)
            root.removeEventListener("dragstart", noDrag)
            root.removeEventListener("scroll", onScroll)
            for (const g of ["gesturestart", "gesturechange", "gestureend"]) root.removeEventListener(g, onGesture)
            follow = true
            st.down = null
            st.touches.clear()
            stopFollow()
            window.cancelAnimationFrame(st.raf)
            window.clearTimeout(st.shuffleT)
            window.clearTimeout(st.fadeTimer)
            st.running = false
        }
    }, [isStatic])

    // ---------- the hint: once per visit (the session), shown a moment after the wall opens, gone at the first move
    React.useEffect(() => {
        if (isStatic || !HN.text) return
        let seen = false
        try {
            seen = window.sessionStorage.getItem("ecw-hint") === "1"
            window.sessionStorage.setItem("ecw-hint", "1")
        } catch (e) {}
        if (seen) return
        const show = window.setTimeout(() => setHint(true), 900)
        const hide = window.setTimeout(() => setHint(false), 5200)
        return () => {
            window.clearTimeout(show)
            window.clearTimeout(hide)
        }
    }, [isStatic, !!HN.text])

    // ---------- render
    const rootStyle = {
        ...props.style,
        position: "relative",
        "--ecw-focus": CO.focus,
        "--ecw-fill": CO.tileFill,
        "--ecw-radius": Math.max(0, num(L.radius, 14)) + "px",
        "--ecw-from": 1,
        "--ecw-scale": clamp(num(HV.scale, 1), 0.8, 1.3),
        "--ecw-others": 1 - clamp(num(HV.dim, 0), 0, 0.95),
        "--ecw-label-fill": CL.fill,
        "--ecw-hint-fill": HN.fill,
        "--ecw-btn-fill": CO.buttonFill,
        "--ecw-btn-icon": CO.buttonIcon,
        "--ecw-btn-border": CO.buttonBorder,
        "--ecw-shade": CO.shade,
        "--ecw-light": clamp(num(HV.strength, 0.65), 0, 1),
        "--ecw-light-in": Math.round(Math.max(40, num(HV.size, 560)) * 0.18) + "px",
        "--ecw-light-out": Math.round(Math.max(40, num(HV.size, 560))) + "px",
    } as React.CSSProperties

    const renderOwn = () => (
        <div data-ecw-own="">
            {images.map((im, i) => {
                const img = im.image || {}
                const href = safeHref(im.link)
                const inner = (
                    <>
                        <img src={img.src} srcSet={img.srcSet} alt={img.alt || im.title || ""} draggable={false} loading="lazy" decoding="async" />
                        {CP.show && im.title ? (
                            <div className={cls + "-cap"}>
                                <p style={{ ...CP.font, color: CP.color }}>{im.title}</p>
                            </div>
                        ) : null}
                    </>
                )
                return href ? (
                    <a key={i} className={cls + "-own"} href={href} draggable={false} aria-label={im.title || undefined}>
                        {inner}
                    </a>
                ) : (
                    <div key={i} className={cls + "-own"}>
                        {inner}
                    </div>
                )
            })}
        </div>
    )

    const body = slot ? slot : manual ? renderOwn() : null
    // The first set is kept as the very same element while only the copies change, so adding copies never redraws it
    // (on a slow page its cards may still be hydrating). Each copy loads inside its own Suspense, so a card part that
    // is still loading waits there and never reaches the rest of the page.
    const firstSlotSet = React.useMemo(
        () =>
            slot ? (
                <div key={0} data-ecw-copy={0}>
                    {slot}
                </div>
            ) : null,
        [slot]
    )
    const layers: React.ReactNode[] = []
    if (body) {
        layers.push(
            slot ? (
                firstSlotSet
            ) : (
                <div key={0} data-ecw-copy={0}>
                    {body}
                </div>
            )
        )
        for (let i = 1; i < copies; i++) {
            layers.push(
                <React.Suspense key={i} fallback={null}>
                    <div data-ecw-copy={i} aria-hidden={true}>
                        {body}
                    </div>
                </React.Suspense>
            )
        }
    }
    const showShuffle = B.show && B.shuffle && !!body
    const showZoom = B.show && B.zoom && zoomOn && zoomState.available && !!body

    return (
        <div
            ref={rootRef}
            className={cls}
            style={rootStyle}
            tabIndex={0}
            role="region"
            aria-label={A.wall || undefined}
            data-lenis-prevent=""
            data-ecw-dim={num(HV.dim, 0) > 0 ? "" : undefined}
            data-ecw-page={I.pageScroll ? "" : undefined}
        >
            <style dangerouslySetInnerHTML={{ __html: css(cls) }} />
            {showShuffle || showZoom ? (
                <div className={cls + "-bar"} data-ecw-bar="" data-pos={B.position}>
                    {showShuffle ? (
                        <button type="button" className={cls + "-btn"} aria-label={A.shuffle || undefined} onClick={shuffle}>
                            <ShuffleIcon />
                        </button>
                    ) : null}
                    {showZoom ? (
                        <button type="button" className={cls + "-btn"} aria-label={A.zoom || undefined} aria-pressed={zoomState.zoomed} onClick={() => zoomRequest(zoomState.zoomed ? 1 : S.current.zMin, null)}>
                            {zoomState.zoomed ? <ZoomInIcon /> : <ZoomOutIcon />}
                        </button>
                    ) : null}
                </div>
            ) : null}
            <div className={cls + "-layer"}>
                <div ref={zoomRef} className={cls + "-zoom"}>
                    {layers}
                </div>
            </div>
            {HV.spotlight ? <div ref={lightRef} className={cls + "-light"} aria-hidden="true" /> : null}
            {isCanvas ? (
                <div className={cls + "-empty"} data-ecw-hint-empty={body ? "list" : "none"}>
                    {body ? "Content has no cards yet." : "Put a Collection List of your cards into Content, or add Images."}
                </div>
            ) : null}
            {CL.text ? (
                <div ref={labelRef} className={cls + "-label"} aria-hidden="true">
                    <p style={{ ...LABEL_FONT, ...CL.font, color: CL.color }}>{CL.text}</p>
                </div>
            ) : null}
            {HN.text ? (
                <div className={cls + "-hint"} data-on={hint ? "" : undefined} aria-hidden="true">
                    <p style={{ ...LABEL_FONT, ...HN.font, color: HN.color }}>{HN.text}</p>
                </div>
            ) : null}
        </div>
    )
}

// ---------- the panel
const fontDefault = { ...LABEL_FONT, variant: "Medium" as const }
EndlessCMSWall.displayName = "Endless CMS Wall"
addPropertyControls(EndlessCMSWall, {
    content: {
        type: ControlType.Slot,
        title: "Content",
        maxCount: 1,
        description: "A Collection List of your card (or a frame of cards). Set it on the Desktop breakpoint.",
    },
    images: {
        type: ControlType.Array,
        title: "Images",
        description: "Used when Content is empty.",
        maxCount: 120,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: { type: ControlType.String, title: "Title", defaultValue: "" },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: [],
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        icon: "object",
        controls: {
            columns: { type: ControlType.Number, title: "Columns", min: 1, max: 12, step: 1, displayStepper: true, defaultValue: D.layout.columns },
            columnsTablet: { type: ControlType.Number, title: "Columns (Tablet)", min: 1, max: 10, step: 1, displayStepper: true, defaultValue: D.layout.columnsTablet },
            columnsPhone: { type: ControlType.Number, title: "Columns (Phone)", min: 1, max: 6, step: 1, displayStepper: true, defaultValue: D.layout.columnsPhone },
            tabletBelow: { type: ControlType.Number, title: "Tablet Below", min: 400, max: 2400, step: 10, unit: "px", defaultValue: D.layout.tabletBelow, description: "The wall's own width, not the page's." },
            phoneBelow: { type: ControlType.Number, title: "Phone Below", min: 300, max: 1600, step: 10, unit: "px", defaultValue: D.layout.phoneBelow },
            gap: { type: ControlType.Number, title: "Gap", min: 0, max: 64, step: 1, unit: "px", defaultValue: D.layout.gap },
            shape: { type: ControlType.Enum, title: "Shape", options: ["image", "uniform"], optionTitles: ["From Image", "Uniform"], displaySegmentedControl: true, defaultValue: D.layout.shape, description: "From Image keeps each card's image shape; Uniform gives every image the same Ratio. A strip under the image (a title) or a frame around it is added to the card." },
            ratio: { type: ControlType.Number, title: "Ratio", min: 0.3, max: 3, step: 0.05, defaultValue: D.layout.ratio, description: "Width ÷ height: 0.8 = 4:5, 1 = square, 1.5 = 3:2.", hidden: (p: any) => p.shape !== "uniform" },
            desync: { type: ControlType.Number, title: "Desync", min: 0, max: 1, step: 0.05, defaultValue: D.layout.desync, description: "How far the columns are offset from each other." },
            order: { type: ControlType.Enum, title: "Order", options: ["list", "shuffle", "visit"], optionTitles: ["As Listed", "Shuffled", "New Each Visit"], defaultValue: D.layout.order },
            seed: { type: ControlType.Number, title: "Seed", min: 1, max: 999, step: 1, displayStepper: true, defaultValue: D.layout.seed, description: "Change it for another shuffle.", hidden: (p: any) => p.order !== "shuffle" },
            radius: { type: ControlType.Number, title: "Radius", min: 0, max: 48, step: 1, unit: "px", defaultValue: D.layout.radius, description: "For Images. Your own cards keep their radius." },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        icon: "interaction",
        controls: {
            drift: { type: ControlType.Number, title: "Drift", min: 0, max: 120, step: 1, unit: "px/s", defaultValue: D.motion.drift, description: "The wall's slow move while nobody touches it. 0 = still." },
            direction: { type: ControlType.Number, title: "Direction", min: 0, max: 359, step: 1, unit: "°", defaultValue: D.motion.direction, description: "The way the wall drifts (270° = straight up)." },
            pauseOnHover: { type: ControlType.Boolean, title: "Pause on Hover", defaultValue: D.motion.pauseOnHover, hidden: (p: any) => !p.drift },
            glide: { type: ControlType.Number, title: "Glide", min: 0.8, max: 0.98, step: 0.01, defaultValue: D.motion.glide, description: "How far the wall glides after a flick." },
        },
    },
    hover: {
        type: ControlType.Object,
        title: "Hover",
        icon: "effect",
        controls: {
            dim: { type: ControlType.Number, title: "Dim Others", min: 0, max: 0.9, step: 0.05, defaultValue: D.hover.dim },
            scale: { type: ControlType.Number, title: "Scale", min: 1, max: 1.1, step: 0.005, defaultValue: D.hover.scale },
            spotlight: { type: ControlType.Boolean, title: "Spotlight", defaultValue: D.hover.spotlight, description: "A soft light follows the cursor; the rest of the wall falls into Shade." },
            strength: { type: ControlType.Number, title: "Strength", min: 0, max: 1, step: 0.05, defaultValue: D.hover.strength, hidden: (p: any) => !p.spotlight },
            size: { type: ControlType.Number, title: "Size", min: 160, max: 1600, step: 10, unit: "px", defaultValue: D.hover.size, hidden: (p: any) => !p.spotlight },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        icon: "interaction",
        controls: {
            wheel: { type: ControlType.Enum, title: "Wheel", options: ["pan", "page"], optionTitles: ["Pan Wall", "Scroll Page"], displaySegmentedControl: true, defaultValue: D.interaction.wheel },
            wheelSpeed: { type: ControlType.Number, title: "Wheel Speed", min: 0.2, max: 3, step: 0.1, defaultValue: D.interaction.wheelSpeed, hidden: (p: any) => p.wheel !== "pan" },
            pageScroll: { type: ControlType.Boolean, title: "Page Scroll", defaultValue: D.interaction.pageScroll, description: "For a wall inside a page: on touch screens an up-down swipe scrolls the page; a drag that starts sideways moves the wall." },
            zoomOut: { type: ControlType.Number, title: "Zoom Out", min: 0.3, max: 1, step: 0.05, defaultValue: D.interaction.zoomOut, description: "How far visitors can zoom out: pinch, Ctrl/⌘ + wheel, − / + keys or the button. 1 = no zoom." },
            keys: { type: ControlType.Boolean, title: "Arrow Keys", defaultValue: D.interaction.keys, description: "While the wall has the focus." },
        },
    },
    buttons: {
        type: ControlType.Object,
        title: "Buttons",
        icon: "interaction",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: D.buttons.show },
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: ["bottom", "bottom-left", "bottom-right", "top", "top-left", "top-right"],
                optionTitles: ["Bottom", "Bottom Left", "Bottom Right", "Top", "Top Left", "Top Right"],
                defaultValue: D.buttons.position,
                hidden: (p: any) => !p.show,
            },
            shuffle: { type: ControlType.Boolean, title: "Shuffle", defaultValue: D.buttons.shuffle, hidden: (p: any) => !p.show },
            zoom: { type: ControlType.Boolean, title: "Zoom", defaultValue: D.buttons.zoom, hidden: (p: any) => !p.show },
        },
    },
    cursorLabel: {
        type: ControlType.Object,
        title: "Cursor Label",
        icon: "object",
        controls: {
            text: { type: ControlType.String, title: "Text", defaultValue: D.cursorLabel.text, placeholder: "None", description: "Follows the cursor over a card. Empty = none." },
            font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: fontDefault },
            color: { type: ControlType.Color, title: "Text Color", defaultValue: D.cursorLabel.color },
            fill: { type: ControlType.Color, title: "Fill", defaultValue: D.cursorLabel.fill },
        },
    },
    hint: {
        type: ControlType.Object,
        title: "Hint",
        icon: "object",
        controls: {
            text: { type: ControlType.String, title: "Text", defaultValue: D.hint.text, placeholder: "None", description: "Shown once per visit until the first move. Empty = none." },
            font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: fontDefault },
            color: { type: ControlType.Color, title: "Text Color", defaultValue: D.hint.color },
            fill: { type: ControlType.Color, title: "Fill", defaultValue: D.hint.fill },
        },
    },
    captions: {
        type: ControlType.Object,
        title: "Captions",
        icon: "object",
        description: "For Images: the title over the image on hover.",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: D.captions.show },
            font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 13, lineHeight: "1.4em", letterSpacing: "0em", variant: "Medium" as const }, hidden: (p: any) => !p.show },
            color: { type: ControlType.Color, title: "Text Color", defaultValue: D.captions.color, hidden: (p: any) => !p.show },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        icon: "color",
        description: "Link them to your colour styles so light and dark follow.",
        controls: {
            tileFill: { type: ControlType.Color, title: "Tile Fill", defaultValue: D.colors.tileFill, description: "Behind an Images card while it loads." },
            buttonFill: { type: ControlType.Color, title: "Button Fill", defaultValue: D.colors.buttonFill },
            buttonIcon: { type: ControlType.Color, title: "Button Icon", defaultValue: D.colors.buttonIcon },
            buttonBorder: { type: ControlType.Color, title: "Button Border", defaultValue: D.colors.buttonBorder },
            focus: { type: ControlType.Color, title: "Focus Ring", defaultValue: D.colors.focus, description: "Shown around the wall and its buttons for keyboard users." },
            shade: { type: ControlType.Color, title: "Shade", defaultValue: D.colors.shade, description: "What the wall falls into away from the Spotlight." },
        },
    },
    a11y: {
        type: ControlType.Object,
        title: "Accessibility",
        icon: "object",
        description: "Read out by screen readers.",
        controls: {
            wall: { type: ControlType.String, title: "Wall Label", defaultValue: D.a11y.wall },
            shuffle: { type: ControlType.String, title: "Shuffle Label", defaultValue: D.a11y.shuffle },
            zoom: { type: ControlType.String, title: "Zoom Label", defaultValue: D.a11y.zoom },
        },
    },
})
