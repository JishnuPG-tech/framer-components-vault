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


// Endless CMS Feed · v1.2.1 · Designed by Marso
// An endless vertical feed of your own cards, with a navigator. Put a vertical Collection List (or a frame of cards, or
// your cards one by one) into Content. The feed never changes your list or your cards: it draws its own wrappers, puts
// your whole Content into each of them (the first one and its repeats, end to end) and moves only those, so the loop
// never shows a reset. The wheel, a trackpad, a drag, a finger and the keys move it, smoothly and with momentum. A
// small counter ("03 / 12") follows the feed; a click opens a panel with every card (its picture and its title, read
// from the card) to jump to it or open its page. Effects on the feed's own layers: Skew on Speed, Zoom on Drag, Edge
// Blur and Edge Fade.
//
// Its height is Framer's own (the Height in the panel, per breakpoint): a set height (Fixed, Fill, vh) gives a feed of
// that height at every width, and the page's scroll moves it along. Fit is Full Page: the feed fills the screen and
// takes the wheel once it does; narrower than 810 px (a phone) it is then a plain list in the page, with the same
// counter and panel.
//
// Setup: 1. Insert it, set its width to Fill and its height in Framer's panel (Fit = Full Page). 2. Put a vertical
// Collection List of your card into Content, on the Desktop breakpoint, with the card set to Fill inside the list
// (Layout → Width Fill makes the list as wide as the feed). 3. Set Gap to your list's own gap. 4. Adjust it in the
// panel and link the colours to your colour styles.

// ---------- types and defaults (the panel's defaults come from here too)
type Align = "left" | "center" | "right"
type Corner = "bottom-center" | "bottom-right" | "bottom-left" | "top-center" | "top-right" | "top-left"
type PanelClick = "scroll" | "open"

interface LayoutProps {
    width: "fill" | "own"
    scrollLink: number
    gap: number
    align: Align
}
interface MotionProps {
    drag: boolean
    glide: number
}
interface EffectProps {
    skew: boolean
    skewAngle: number
    zoom: boolean
    zoomTo: number
    edgeBlur: boolean
    blurHeight: number
    blur: number
    edgeFade: boolean
    fadeHeight: number
}
interface NavigatorProps {
    show: boolean
    corner: Corner
    panelClick: PanelClick
    panelWidth: number
    panelHeight: number
    inset: number
}
interface StyleProps {
    font: React.CSSProperties
    rowFont: React.CSSProperties
    text: string
    muted: string
    surface: string
    hover: string
    border: string
    focus: string
    radius: number
}
interface A11yProps {
    feed: string
    counter: string
    panel: string
}
interface Props {
    content?: React.ReactNode
    layout?: Partial<LayoutProps>
    motion?: Partial<MotionProps>
    effect?: Partial<EffectProps>
    navigator?: Partial<NavigatorProps>
    look?: Partial<StyleProps>
    a11y?: Partial<A11yProps>
    style?: React.CSSProperties
}

const D = {
    layout: { width: "fill", align: "center", gap: 24, scrollLink: 1 } as LayoutProps,
    motion: { drag: true, glide: 0.95 } as MotionProps,
    effect: { skew: true, skewAngle: 3, zoom: true, zoomTo: 94, edgeBlur: true, blurHeight: 140, blur: 16, edgeFade: false, fadeHeight: 80 } as EffectProps,
    navigator: { show: true, corner: "bottom-center", panelClick: "scroll", panelWidth: 320, panelHeight: 440, inset: 16 } as NavigatorProps,
    look: {
        font: { fontSize: 13, lineHeight: "1em", letterSpacing: "0.02em" },
        rowFont: { fontSize: 14, lineHeight: "1.3em", letterSpacing: "0em" },
        text: "#FFFFFF",
        muted: "rgba(255, 255, 255, 0.56)",
        surface: "rgba(17, 17, 17, 0.84)",
        hover: "rgba(255, 255, 255, 0.08)",
        border: "rgba(255, 255, 255, 0.12)",
        focus: "#2F6BFF",
        radius: 16,
    } as const,
    a11y: { feed: "Feed", counter: "Item {n} of {total}. Show all items", panel: "All items" } as A11yProps,
}
// Full Page (Fit): from this width of its own up the feed loops; narrower (a phone) it is a plain list in the page.
// A set height loops at every width.
const LOOP_FROM = 810
// the feed's class prefix (and its container's name): fixed, the same on the server and in the browser. A new prefix
// when a version changes the CSS, so two versions on one page never share rules.
const CLS = "ecf12"
// a set height (Fixed, Fill, vh): Framer then passes the instance's size as the root's own height (100 %); Fit passes none
const setHeight = (s?: React.CSSProperties) => {
    const h = s && s.height
    return h !== undefined && h !== null && h !== "" && h !== "auto"
}
// Width Fill: the layer as Framer passes it, with the width 100 % added to its own style
const stretch = (c: React.ReactElement<any>) => React.cloneElement(c, { style: { ...((c.props && c.props.style) || {}), width: "100%" } })
// the most repeats of your Content the feed keeps in the page (the first one included)
const MAX_COPIES = 40
// Skew on Speed: the speed (px/s) at which the lean reaches about three quarters of its Angle
const SKEW_SPEED = 1600
// the panel's pictures: Framer's image host scales on request, so a 160 px file (about 5 KB) is asked for
const SMALL = 160
// Edge Blur and Edge Fade keep their height on a feed this tall or taller; a shorter feed (a set height) gets them shorter
// in proportion, never more than a fifth of the feed at each end (as Endless CMS Reel's edges). In CSS alone (a
// percentage of the feed), so the first frame is already right.
const TALL = 900
const edgeH = (px: string, n: string) => "min(var(" + px + "),calc(100% * var(" + n + ") / " + TALL + "),22%)"

// ---------- small helpers
const useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect
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
// "03", or "003" when there are 100 or more
function pad(n: number, total: number): string {
    let s = String(n)
    const w = Math.max(2, String(total).length)
    while (s.length < w) s = "0" + s
    return s
}
const fillIn = (t: string, n: number, total: number) => t.replace(/\{n\}/g, String(n)).replace(/\{total\}/g, String(total)).trim()

// ---------- the cards, for the navigator: READ ONLY. The feed finds the repeated layers of your Content by structure
// (as Endless CMS Wall) to count them, to know where each one sits and to read its title and picture for the panel.
// It never writes anything into your Content.
const SKIP = /^(STYLE|SCRIPT|TEMPLATE|NOSCRIPT)$/
// element children, looking through wrappers that take no box (display: contents)
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
// a layer with something in it (an empty Collection List is not a card)
const filled = (el: Element) => hasMedia(el) || el.children.length > 0 || !!(el.textContent || "").trim()
// The cards: the repeated siblings of that level (also those without an image); the list's own extras, such as a
// Load More button, are left out of the count.
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
// the card's main picture: its largest image or video
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
const linkOf = (el: HTMLElement) => (el.matches("a[href]") ? el : el.querySelector("a[href]")) as HTMLAnchorElement | null
// opens a card's own link: Framer opens links on a press on phones and on a click on computers, so it gets both
function openLink(a: HTMLElement) {
    const r = a.getBoundingClientRect()
    const o: PointerEventInit = { bubbles: true, cancelable: true, composed: true, isPrimary: true, pointerId: 77, pointerType: "touch", button: 0, buttons: 1, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }
    try {
        a.dispatchEvent(new PointerEvent("pointerdown", o))
        a.dispatchEvent(new PointerEvent("pointerup", { ...o, buttons: 0 }))
    } catch (err) {}
    a.click()
}
// where a layer sits inside one of the feed's own layers (px, from its top), through the layers' own offsets, so a
// transform (the loop, Zoom on Drag, Skew on Speed) never changes it; null when it cannot be told that way
function offsetIn(el: HTMLElement, stop: HTMLElement): number | null {
    let y = 0
    let n: HTMLElement | null = el
    for (let guard = 0; n && n !== stop && guard < 64; guard++) {
        y += n.offsetTop
        n = n.offsetParent as HTMLElement | null
    }
    return n === stop ? y : null
}

// ---------- the panel's rows, read from each card when the panel opens (Marso, 2026-10-30: one slot)
interface Row {
    i: number
    title: string
    src: string
}
// a small file of the card's picture: Framer's image host gets a size; any other address is used as it is
function smallSrc(src: string): string {
    try {
        const u = new URL(src, window.location.href)
        if (/(^|\.)framerusercontent\.com$/.test(u.hostname)) return u.origin + u.pathname + "?scale-down-to=" + SMALL
        return u.href
    } catch (err) {
        return src
    }
}
function thumbOf(el: HTMLElement): string {
    const m = mediaOf(el)
    if (!m) return ""
    if (m.tagName === "IMG") {
        const img = m as HTMLImageElement
        const s = img.currentSrc || img.getAttribute("src") || ""
        return s ? smallSrc(s) : ""
    }
    const poster = m.getAttribute("poster") || ""
    return poster ? smallSrc(poster) : ""
}
// shown on the page: drawn, not hidden, not see-through (up to the card)
function seen(e: HTMLElement, stop: HTMLElement): boolean {
    if (!e.getClientRects().length || window.getComputedStyle(e).visibility === "hidden") return false
    for (let n: HTMLElement | null = e; n && n !== stop.parentElement; n = n.parentElement) if (Number(window.getComputedStyle(n).opacity) === 0) return false
    return true
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
        if (!own || !seen(e, el)) continue
        const fs = parseFloat(window.getComputedStyle(e).fontSize) || 0
        if (fs > size + 0.1) {
            size = fs
            best = e
        }
    }
    let t = best ? (best.textContent || "").replace(/\s+/g, " ").trim() : ""
    if (!t) {
        const a = linkOf(el)
        t = ((a && a.getAttribute("aria-label")) || el.getAttribute("aria-label") || "").trim()
    }
    return t.length > 140 ? t.slice(0, 139) + "…" : t
}
// can this element (or one between it and the page) still scroll that way by itself?
function scrollsItself(start: Element | null, dy: number): boolean {
    for (let n = start as HTMLElement | null; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
        const oy = window.getComputedStyle(n).overflowY
        if ((oy === "auto" || oy === "scroll") && n.scrollHeight > n.clientHeight + 1) {
            if (dy > 0 && n.scrollTop + n.clientHeight < n.scrollHeight - 1) return true
            if (dy < 0 && n.scrollTop > 0) return true
        }
    }
    return false
}

const EASE = "cubic-bezier(.22,1,.36,1)"
// the loop's rules, under the root selector P (Full Page from 810 px up, or a set height at every width)
function loopCss(R: string, P: string): string {
    return (
        P + " " + R + "-frame{overflow:hidden;overflow:clip}" +
        P + "[data-ecf-drag] " + R + "-frame{cursor:grab}" +
        P + "[data-ecf-dragging] " + R + "-shield{display:block}" +
        P + " " + R + "-view{position:absolute;inset:0}" +
        // the stage: Zoom on Drag and Skew on Speed act on it, from its middle
        P + " " + R + "-stage{position:absolute;inset:0;transform-origin:50% 50%}" +
        P + " " + R + "-copy{position:absolute;left:0;right:0;top:0}" +
        // before the feed is ready the first copy shows as the list draws it; the repeats wait for their places
        P + " " + R + "-copy:not([data-ecf-placed]):not([data-ecf-copy=\"0\"]){visibility:hidden}" +
        P + " " + R + "-empty{position:absolute;inset:0;min-height:0}" +
        P + " " + R + "-blur{display:block}" +
        P + "[data-ecf-lite] " + R + "-blur{display:none}" +
        // Edge Fade: the feed fades out at the top and the bottom
        P + "[data-ecf-fade] " + R + "-view{--w:" + edgeH("--ecf-fade", "--ecf-fade-n") + ";-webkit-mask-image:linear-gradient(180deg,transparent,#000 var(--w),#000 calc(100% - var(--w)),transparent);mask-image:linear-gradient(180deg,transparent,#000 var(--w),#000 calc(100% - var(--w)),transparent)}"
    )
}
// Every rule below styles the feed's own elements only (its root, frame, view, stage, copies, cells, fit layers, blur,
// shield, navigator and hints); nothing reaches into your Content.
function css(c: string): string {
    const R = "." + c
    const corner = (k: string, origin: string) => R + "-nav[data-corner=" + k + "] " + R + "-panel{transform-origin:" + origin + "}"
    return (
        // the component is its own size container: in Full Page, whether it loops is told by its own width, from the
        // first frame
        R + "{position:relative;container-type:inline-size;container-name:" + c + ";outline:none;-webkit-tap-highlight-color:transparent}" +
        R + ":focus-visible{box-shadow:inset 0 0 0 2px var(--ecf-focus)}" +
        R + "[data-ecf-dragging]{user-select:none;-webkit-user-select:none}" +
        R + "-frame{position:relative}" +
        R + "-view{position:relative}" +
        R + "-stage{position:relative}" +
        // one copy: your whole Content in a column of the feed's own cells
        R + "-copy{position:relative;display:flex;flex-direction:column;gap:var(--ecf-gap)}" +
        R + "-copy[data-ecf-spare]{display:none}" +
        R + "-cell{position:relative;flex:none}" +
        // a cell's fit layer: places your layer by Align; a layer wider than the feed (a list with a fixed width) is
        // drawn smaller here to fit, the list itself keeps its own width
        R + "-fit{position:relative;width:100%;display:flex;flex-direction:column;align-items:var(--ecf-align);transform-origin:0 0}" +
        // while a drag lasts, a clear layer over the cards keeps the grabbing hand and lets no card hover
        R + "-shield{position:absolute;inset:0;z-index:4;display:none;cursor:grabbing}" +
        // the navigator: a rail laid over the whole feed (it takes no room), and in it a row as tall as the counter and
        // its inset, held at the top or bottom of the screen while the feed is on screen. The rail is the row's limit, so
        // the counter never leaves the feed: with only the feed's first lines on screen it stays inside them, never over
        // the content above (Feed Buyer Test, 2026-10-31)
        R + "-rail{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;pointer-events:none}" +
        R + "-rail[data-corner^=bottom]{justify-content:flex-end}" +
        R + "-nav{position:sticky;flex:none;height:calc(40px + 2 * var(--ecf-inset));pointer-events:none}" +
        R + "-nav[data-corner^=top]{top:0}" +
        R + "-nav[data-corner^=bottom]{bottom:0}" +
        R + "-dock{position:absolute;display:flex;gap:8px;pointer-events:none;transition:opacity .25s ease,visibility 0s}" +
        R + "-nav[data-corner^=top] " + R + "-dock{top:var(--ecf-inset);flex-direction:column}" +
        R + "-nav[data-corner^=bottom] " + R + "-dock{bottom:var(--ecf-inset);flex-direction:column-reverse}" +
        R + "-nav[data-corner$=left] " + R + "-dock{left:var(--ecf-inset);align-items:flex-start}" +
        R + "-nav[data-corner$=right] " + R + "-dock{right:var(--ecf-inset);align-items:flex-end}" +
        // in the middle (Marso, 2026-10-30: the default)
        R + "-nav[data-corner$=center] " + R + "-dock{left:50%;translate:-50% 0;align-items:center}" +
        R + ":not([data-ecf-ready]) " + R + "-dock," + R + "[data-ecf-few] " + R + "-dock{opacity:0;visibility:hidden;transition:opacity .25s ease,visibility 0s .25s}" +
        // the counter
        R + "-btn{all:unset;pointer-events:auto;box-sizing:border-box;display:inline-flex;align-items:center;gap:10px;min-height:40px;padding:0 16px 0 14px;border-radius:999px;background:var(--ecf-surface);box-shadow:inset 0 0 0 1px var(--ecf-border);color:var(--ecf-text);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);cursor:pointer;white-space:nowrap;font-variant-numeric:tabular-nums;touch-action:manipulation;transition:scale .25s " + EASE + "}" +
        R + "-btn:hover{scale:1.01}" +
        R + "-btn:active{scale:.99}" +
        R + "-btn:focus-visible{box-shadow:inset 0 0 0 1px var(--ecf-border),0 0 0 2px var(--ecf-focus)}" +
        R + "-btn svg{width:14px;height:14px;flex:none;display:block;color:var(--ecf-muted)}" +
        R + "-of{color:var(--ecf-muted)}" +
        // the panel
        R + "-panel{position:relative;pointer-events:auto;box-sizing:border-box;width:min(var(--ecf-pw),calc(100cqw - 2 * var(--ecf-inset)));max-height:min(var(--ecf-ph),calc(100vh - 2 * var(--ecf-inset) - 56px));overflow:auto;overscroll-behavior:contain;touch-action:pan-y;padding:6px;border-radius:var(--ecf-radius);background:var(--ecf-surface);box-shadow:inset 0 0 0 1px var(--ecf-border),0 24px 60px -12px rgba(0,0,0,.45);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);scrollbar-width:none;-ms-overflow-style:none;opacity:0;visibility:hidden;scale:.97;transition:opacity .2s ease,scale .25s " + EASE + ",visibility 0s .25s}" +
        R + "-panel[data-open]{opacity:1;visibility:visible;scale:1;transition:opacity .2s ease,scale .25s " + EASE + ",visibility 0s}" +
        // the panel scrolls (wheel, finger, keys) without a scrollbar showing (Marso, 2026-10-31)
        R + "-panel::-webkit-scrollbar{display:none;width:0;height:0}" +
        corner("bottom-center", "50% 100%") +
        corner("top-center", "50% 0") +
        corner("bottom-right", "100% 100%") +
        corner("bottom-left", "0 100%") +
        corner("top-right", "100% 0") +
        corner("top-left", "0 0") +
        R + "-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}" +
        R + "-row{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:12px;width:100%;min-height:44px;padding:6px 12px 6px 6px;border-radius:max(4px,calc(var(--ecf-radius) - 6px));color:var(--ecf-text);cursor:pointer}" +
        R + "-row:hover," + R + "-row[aria-current=true]{background:var(--ecf-hover)}" +
        R + "-row:focus-visible{box-shadow:inset 0 0 0 2px var(--ecf-focus)}" +
        R + "-thumb{flex:none;width:44px;height:44px;border-radius:max(2px,calc(var(--ecf-radius) - 8px));overflow:hidden;background:var(--ecf-hover);display:flex;align-items:center;justify-content:center;color:var(--ecf-muted);font-variant-numeric:tabular-nums}" +
        R + "-pic{display:block;width:100%;height:100%;object-fit:cover}" +
        R + "-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
        R + "-num{flex:none;color:var(--ecf-muted);font-variant-numeric:tabular-nums}" +
        // the setup hints (canvas only)
        R + "-empty{position:relative;min-height:160px;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;text-align:center;font:500 13px/1.45 system-ui,sans-serif;color:rgba(128,128,128,1);pointer-events:none}" +
        R + "[data-ecf-ready]:not([data-ecf-empty]) " + R + "-empty[data-ecf-hint=list]{display:none}" +
        R + "-wide{display:none;position:absolute;left:12px;right:12px;top:12px;z-index:6;padding:10px 12px;border-radius:10px;background:rgba(128,128,128,.92);color:rgba(255,255,255,1);font:500 12px/1.4 system-ui,sans-serif;text-align:center;pointer-events:none}" +
        R + "[data-ecf-wide] " + R + "-wide{display:block}" +
        // Edge Blur (Marso, 2026-10-31, as the reel): at the top and the bottom of the loop, three layers each, the
        // stronger blur nearer the edge, each fading out inwards. Not on a phone's list; off on a slow device.
        R + "-blur{display:none;position:absolute;left:0;right:0;z-index:3;height:" + edgeH("--ecf-blur-h", "--ecf-blur-n") + ";pointer-events:none}" +
        R + "-blur[data-side=t]{top:0;--d:180deg}" +
        R + "-blur[data-side=b]{bottom:0;--d:0deg}" +
        R + "-blur i{position:absolute;inset:0;-webkit-backdrop-filter:blur(var(--b)) saturate(var(--s));backdrop-filter:blur(var(--b)) saturate(var(--s))}" +
        R + "-blur i:nth-child(1){--b:calc(var(--ecf-blur) * .25);--s:1.1;-webkit-mask-image:linear-gradient(var(--d),#000 40%,transparent 100%);mask-image:linear-gradient(var(--d),#000 40%,transparent 100%)}" +
        R + "-blur i:nth-child(2){--b:calc(var(--ecf-blur) * .55);--s:1.2;-webkit-mask-image:linear-gradient(var(--d),#000 20%,transparent 66%);mask-image:linear-gradient(var(--d),#000 20%,transparent 66%)}" +
        R + "-blur i:nth-child(3){--b:var(--ecf-blur);--s:1.35;-webkit-mask-image:linear-gradient(var(--d),#000 0%,transparent 36%);mask-image:linear-gradient(var(--d),#000 0%,transparent 36%)}" +
        // Full Page (Fit): the loop from 810 px of its own width up, as tall as the screen
        "@container " + c + " (min-width: " + LOOP_FROM + "px){" +
        loopCss(R, R) +
        R + "[data-ecf-page] " + R + "-frame{height:100vh;height:100dvh;touch-action:none}" +
        "}" +
        // a set height (Fixed, Fill, vh in Framer's panel): the loop at that height, at every width; a finger scrolls the
        // page (and the page moves the feed)
        loopCss(R, R + "[data-ecf-sized]") +
        R + "[data-ecf-sized] " + R + "-frame{height:100%;min-height:160px;touch-action:pan-y}" +
        // Full Page on a phone: the first copy as a plain list in the page; the page never scrolls sideways
        "@container " + c + " (max-width: " + (LOOP_FROM - 0.02) + "px){" +
        R + "[data-ecf-page] " + R + "-copy:not([data-ecf-copy=\"0\"]){display:none}" +
        R + "[data-ecf-page] " + R + "-frame{overflow-x:clip}" +
        "}" +
        "@media (prefers-reduced-motion: reduce){" + R + "-btn," + R + "-panel," + R + "-panel[data-open]," + R + "-dock{transition:none}}"
    )
}

function GridIcon() {
    return (
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">
            <rect x="2" y="2" width="5" height="5" rx="1.4" />
            <rect x="9" y="2" width="5" height="5" rx="1.4" />
            <rect x="2" y="9" width="5" height="5" rx="1.4" />
            <rect x="9" y="9" width="5" height="5" rx="1.4" />
        </svg>
    )
}

/**
 * Endless CMS Feed
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 720
 */
export default function EndlessCMSFeed(props: Props) {
    const L: LayoutProps = { ...D.layout, ...(props.layout || {}) }
    const M: MotionProps = { ...D.motion, ...(props.motion || {}) }
    const E: EffectProps = { ...D.effect, ...(props.effect || {}) }
    const N: NavigatorProps = { ...D.navigator, ...(props.navigator || {}) }
    const ST: StyleProps = { ...D.look, ...(props.look || {}) }
    const A: A11yProps = { ...D.a11y, ...(props.a11y || {}) }
    // several layers in Content: each one is a card; one layer: the cards are found inside it (a list, a frame)
    const own = React.Children.toArray(props.content).length > 1
    // Full Page when Framer's Height is Fit; any set height makes it a feed of that height
    const page = !setHeight(props.style)

    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    // the feed's own class names are fixed, never made from React.useId(): when an instance differs per breakpoint
    // (a height or a setting on Phone) the published page's server and browser count their ids differently, and the
    // parts the feed adds after the page loads (the repeats, the panel's rows) got a class its CSS did not have (live
    // demo, 2026-11-06). Every rule is the same for every instance (their own values come in as CSS variables), so
    // several feeds on one page can share them. The id is only for the panel's id (aria-controls).
    const cls = CLS
    const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")

    const rootRef = React.useRef<HTMLDivElement>(null)
    const frameRef = React.useRef<HTMLDivElement>(null)
    const viewRef = React.useRef<HTMLDivElement>(null)
    const stageRef = React.useRef<HTMLDivElement>(null)
    const navRef = React.useRef<HTMLDivElement>(null)
    const btnRef = React.useRef<HTMLButtonElement>(null)
    const numRef = React.useRef<HTMLSpanElement>(null)
    const totRef = React.useRef<HTMLSpanElement>(null)
    const panelRef = React.useRef<HTMLDivElement>(null)
    const [copies, setCopies] = React.useState(1)
    const [open, setOpen] = React.useState(false)
    const [rows, setRows] = React.useState<Row[]>([])

    // everything the loop needs lives in one mutable object, never in React state
    const S = React.useRef<any>(null)
    if (!S.current) {
        S.current = {
            // the feed's own copy wrappers in use, their height with the gap, how many, and the room past each end
            copyEls: [] as HTMLElement[],
            cy: [] as number[],
            period: 0,
            want: 1,
            total: 0,
            extra: 0,
            width: 0,
            height: 0,
            // the cards of the first copy (read only): where each one sits in its copy, and how tall it is drawn
            base: [] as HTMLElement[],
            tops: [] as number[],
            hs: [] as number[],
            count: 0,
            y: 0,
            prevY: 0,
            started: false,
            v: 0,
            pend: 0,
            // Skew on Speed and Zoom on Drag: the visitor's own speed (px/s, smoothed), the lean and the size now
            vs: 0,
            skew: 0,
            z: 1,
            tf: "",
            down: null,
            dragging: false,
            suppress: false,
            tap: null,
            tapAt: 0,
            visible: true,
            hidden: false,
            reduce: false,
            lowPower: false,
            inert: false,
            samples: [] as number[],
            sampleFrom: 0,
            raf: 0,
            running: false,
            cardDepth: -1,
            copiesAsked: 0,
            asks: 0,
            list: false,
            current: 0,
            shown: "",
            open: false,
        }
    }
    const opts = React.useRef<any>({})
    opts.current = { L, M, E, N, A, isStatic, page }
    // the blur strips: off on a slow device (their layers are hidden by the feed's own attribute)
    const blurOn = () => !!opts.current.E.edgeBlur && num(opts.current.E.blurHeight, 0) > 0 && num(opts.current.E.blur, 0) > 0 && !S.current.lowPower
    // Skew on Speed and Zoom on Drag: the loop only (not a phone's list), the live site and Preview, never with reduced motion
    const skewMax = () => {
        const o = opts.current
        const st = S.current
        return o.E.skew && !o.isStatic && !st.reduce && !st.list ? clamp(num(o.E.skewAngle, 0), 0, 10) : 0
    }
    const zoomMin = () => {
        const o = opts.current
        const st = S.current
        return o.E.zoom && !o.isStatic && !st.reduce && !st.list ? clamp(num(o.E.zoomTo, 100), 70, 100) / 100 : 1
    }

    // ---------- the counter: only its own characters and label change, never through a render
    const markRows = () => {
        const p = panelRef.current
        if (!p) return
        const cur = String(S.current.current)
        p.querySelectorAll("[data-i]").forEach((b) => {
            if (b.getAttribute("data-i") === cur) b.setAttribute("aria-current", "true")
            else b.removeAttribute("aria-current")
        })
    }
    const writeCounter = () => {
        const st = S.current
        const total = st.count
        const n = Math.min(total, st.current + 1)
        const label = opts.current.A.counter || ""
        const key = n + "/" + total + "|" + label
        if (key === st.shown) return
        st.shown = key
        if (numRef.current) numRef.current.textContent = total ? pad(n, total) : ""
        if (totRef.current) totRef.current.textContent = total ? pad(total, total) : ""
        const btn = btnRef.current
        if (btn) {
            const t = total ? fillIn(label, n, total) : ""
            if (t) btn.setAttribute("aria-label", t)
            else btn.removeAttribute("aria-label")
        }
        markRows()
    }

    // ---------- positions: each copy of your Content at its place on the loop, wrapped on its own, so the feed never ends
    const place = (force?: boolean) => {
        const st = S.current
        const els = st.copyEls as HTMLElement[]
        const stage = stageRef.current
        if (st.list || !stage || !els.length) return
        const K = els.length
        const P = st.period
        const H = st.height
        const mid = H / 2
        let cur = -1
        let best = Infinity
        for (let c = 0; c < K; c++) {
            const y = K > 1 && P > 0 ? mod(c * P + st.y + P + st.extra, K * P) - P - st.extra : st.y
            if (force || st.cy[c] !== y) {
                els[c].style.setProperty("translate", "0px " + y.toFixed(2) + "px")
                st.cy[c] = y
            }
            if (y + P < 0 || y > H) continue
            // the current card: the one across the middle of the view, else the nearest to it
            for (let i = 0; i < st.count; i++) {
                const t = y + st.tops[i]
                const h = st.hs[i]
                const d = t <= mid && t + h >= mid ? 0 : Math.min(Math.abs(t - mid), Math.abs(t + h - mid))
                if (d < best) {
                    best = d
                    cur = i
                }
            }
        }
        // the stage leans (Skew on Speed) and steps back (Zoom on Drag); at rest it carries no transform at all
        const tf = Math.abs(st.z - 1) < 0.0005 && Math.abs(st.skew) < 0.02 ? "" : "scale(" + st.z.toFixed(4) + ") skewY(" + st.skew.toFixed(3) + "deg)"
        if (force || tf !== st.tf) {
            stage.style.transform = tf
            st.tf = tf
        }
        if (cur >= 0) st.current = cur
        writeCounter()
    }

    // a phone's list: the current card is the one across the middle of the screen
    const scanList = () => {
        const st = S.current
        if (!st.list) return
        const mid = window.innerHeight / 2
        let cur = 0
        let best = Infinity
        ;(st.base as HTMLElement[]).forEach((el, i) => {
            const r = el.getBoundingClientRect()
            const d = r.top <= mid && r.bottom >= mid ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid))
            if (d < best) {
                best = d
                cur = i
            }
        })
        st.current = cur
        writeCounter()
    }

    // ---------- the panel's rows, from the cards of the first copy (read only)
    const readRows = (): Row[] => (S.current.base as HTMLElement[]).map((el, i) => ({ i, title: titleOf(el), src: thumbOf(el) }))
    // only when they changed (a CMS edit, a filter, an image that arrived), so a render never asks for another
    const refreshRows = () => {
        const r = readRows()
        const key = JSON.stringify(r)
        if (key === S.current.rowsKey) return
        S.current.rowsKey = key
        setRows(r)
    }

    // ---------- a layer wider than the feed is drawn smaller: a list with a fixed width (Width Own), or a list whose
    // cards have a fixed width wider than the feed (a 360 px card on a narrow phone, Width Fill too). Only the feed's
    // own fit layer is scaled and only the feed's own cell gets the height it then takes; your list keeps its own
    // width. Returns each cell's scale.
    const fitCells = (copyEls: HTMLElement[], viewW: number): number[] => {
        const first = copyEls[0]
        if (!first) return []
        const cells0 = Array.from(first.children) as HTMLElement[]
        const scales: number[] = []
        cells0.forEach((cell, j) => {
            const fit = cell.firstElementChild as HTMLElement | null
            if (!fit) return scales.push(1)
            // measured at the feed's width first (with Width Fill your layer follows it)
            fit.style.removeProperty("width")
            fit.style.removeProperty("transform")
            cell.style.removeProperty("height")
            const box = kids(fit)[0]
            let w = box ? box.offsetWidth : 0
            // one layer (a list, a frame of cards): its widest card counts too (read only)
            if (box && cells0.length === 1) for (const k of kids(box)) w = Math.max(w, k.offsetWidth)
            const s = w > viewW + 1 ? viewW / w : 1
            scales.push(s)
            for (const ce of copyEls) {
                const c = ce.children[j] as HTMLElement | undefined
                const f = c ? (c.firstElementChild as HTMLElement | null) : null
                if (!c || !f) continue
                if (s < 1) {
                    f.style.setProperty("width", w + "px")
                    f.style.setProperty("transform", "scale(" + s.toFixed(5) + ")")
                } else {
                    f.style.removeProperty("width")
                    f.style.removeProperty("transform")
                }
            }
            if (s < 1) {
                const h = fit.offsetHeight * s
                for (const ce of copyEls) {
                    const c = ce.children[j] as HTMLElement | undefined
                    if (c) c.style.setProperty("height", h.toFixed(2) + "px")
                }
            } else for (const ce of copyEls) {
                const c = ce.children[j] as HTMLElement | undefined
                if (c) c.style.removeProperty("height")
            }
        })
        return scales
    }

    // ---------- measure the feed's own first copy, read where its cards sit, and lay the copies out in one column
    const collect = React.useCallback(() => {
        const root = rootRef.current
        const view = viewRef.current
        const stage = stageRef.current
        const st = S.current
        if (!root || !view || !stage) return
        const o = opts.current
        const width = root.clientWidth
        if (!width) return
        st.reduce = !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const list = o.page && width < LOOP_FROM
        st.list = list
        const copyEls = (Array.from(stage.children) as HTMLElement[]).filter((c) => c.hasAttribute("data-ecf-copy"))
        const first = copyEls[0] || null
        const viewW = view.clientWidth || width
        const scales = fitCells(copyEls, viewW)
        if (scales.some((s) => s < 0.999)) root.setAttribute("data-ecf-wide", "")
        else root.removeAttribute("data-ecf-wide")
        // the cards of the first copy (read only): your layers one by one, or the cards found inside your one layer
        const cells0 = first ? (Array.from(first.children) as HTMLElement[]) : []
        let base: HTMLElement[] = []
        if (own) base = cells0
        else if (cells0[0] && cells0[0].firstElementChild) {
            const r = cardsIn(cells0[0].firstElementChild, st.cardDepth)
            base = r.cards
            // where the cards sit, learnt while the list holds two or more (structure only: no names, no classes)
            if (base.length >= 2) st.cardDepth = r.depth
        }
        const n = base.length
        st.base = base
        st.count = n
        if (n) root.removeAttribute("data-ecf-empty")
        else root.setAttribute("data-ecf-empty", "")
        if (n < 2) root.setAttribute("data-ecf-few", "")
        else root.removeAttribute("data-ecf-few")
        if (st.ro && first && st.roFirst !== first) {
            if (st.roFirst) st.ro.unobserve(st.roFirst)
            st.ro.observe(first)
            st.roFirst = first
        }
        if (st.mo && first && st.moFirst !== first) {
            st.mo.disconnect()
            st.mo.observe(first, { childList: true, subtree: true })
            st.moFirst = first
        }

        if (list) {
            // a phone: the first copy is a plain list in the page, as you designed it
            st.copyEls = first ? [first] : []
            st.total = 0
            st.copiesAsked = 0
            st.asks = 0
            window.clearTimeout(st.copyTimer)
            st.z = 1
            st.skew = 0
            st.vs = 0
            stage.style.transform = ""
            st.tf = ""
            for (const ce of copyEls) {
                ce.style.removeProperty("translate")
                ce.removeAttribute("inert")
                ce.setAttribute("data-ecf-placed", "")
            }
            st.cy = []
            root.setAttribute("data-ecf-list", "")
            root.setAttribute("data-ecf-ready", "")
            scanList()
            if (st.open) refreshRows()
            return
        }
        root.removeAttribute("data-ecf-list")
        const gap = Math.max(0, num(o.L.gap, 24))
        // only the feed's own wrapper is measured for the loop: its height is your Content's own height
        const copyH = first ? first.offsetHeight : 0
        const period = copyH + gap
        const height = view.clientHeight
        // where each card sits in its copy, read through the layers' own offsets (a transform never changes them)
        const tops: number[] = []
        const hs: number[] = []
        const fr = first ? first.getBoundingClientRect() : null
        const k = first && fr && first.offsetHeight ? fr.height / first.offsetHeight || 1 : 1
        base.forEach((el, i) => {
            const j = own ? i : 0
            const cell = cells0[j]
            const s = scales[j] || 1
            let t: number | null = null
            if (own) t = cell ? cell.offsetTop : null
            else if (cell && cell.firstElementChild) {
                const inFit = offsetIn(el, cell.firstElementChild as HTMLElement)
                if (inFit !== null) t = cell.offsetTop + inFit * s
            }
            // the layers' offsets do not lead to the feed's own layer: read it from the screen instead
            if (t === null && fr) t = (el.getBoundingClientRect().top - fr.top) / k
            tops.push(t || 0)
            hs.push(Math.max(1, own ? el.offsetHeight : el.offsetHeight * s))
        })
        // the room past each end the effects can show: Zoom on Drag draws more of the feed, Skew on Speed tilts its sides
        const z = zoomMin()
        const extra = (height / z - height) / 2 + ((viewW / 2) * Math.tan((skewMax() * Math.PI) / 180)) / z + 2
        const want = n ? clamp(Math.ceil((height + 2 * extra) / Math.max(1, period)) + 1, 2, MAX_COPIES) : 1
        st.want = want
        // the feed shows the first copy at once; the repeats it needs step into their places as they render. First asked
        // as a transition (it lands once the page allows). While the rest of the page is still hydrating (a slow phone)
        // the transition can be held back, and a plain update then would make React redraw parts that are not ready
        // ("recoverable error" #421; found on Endless CMS Reel, 2026-10-30): so the feed waits until the page has gone
        // quiet and only then asks again with a plain update, and looks once more until the copies are there
        if (n && want !== copyEls.length) {
            const now = performance.now()
            if (st.copiesAsked !== want) {
                st.copiesAsked = want
                st.asks = 0
            }
            if (!st.asks || (st.quiet && now - st.askedAt > 400)) {
                const plain = st.asks > 0
                st.asks++
                st.askedAt = now
                window.requestAnimationFrame(() => (plain ? setCopies(want) : React.startTransition(() => setCopies(want))))
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
        const useCopies = n ? Math.min(want, copyEls.length) : Math.min(1, copyEls.length)
        // repeats beyond what is needed wait hidden until React removes them; while a keyboard is in use, the repeats
        // are inert (out of the Tab order; screen readers skip them anyway)
        copyEls.forEach((ce, i) => {
            if (i < useCopies) ce.removeAttribute("data-ecf-spare")
            else ce.setAttribute("data-ecf-spare", "")
            if (i > 0 && st.inert) ce.setAttribute("inert", "")
            else ce.removeAttribute("inert")
        })
        st.copyEls = copyEls.slice(0, useCopies)
        st.cy = []
        st.period = period
        st.total = useCopies > 1 ? useCopies * period : 0
        st.extra = extra
        st.width = viewW
        st.height = height
        st.tops = tops
        st.hs = hs
        // the first card starts one gap below the top, as the gaps between the cards; and again when the list changes
        // its number of cards (a filter, a search, a CMS edit): the results start at their first card (Feed Buyer Test)
        if ((!st.started || (st.lastN && n !== st.lastN)) && n) {
            st.started = true
            st.y = gap
            st.prevY = gap
            st.pend = 0
            st.v = 0
        }
        st.lastN = n
        if (st.total && Math.abs(st.y) > st.total) {
            const y = mod(st.y, st.total)
            st.prevY += y - st.y
            st.y = y
        }
        place(true)
        for (const ce of st.copyEls as HTMLElement[]) ce.setAttribute("data-ecf-placed", "")
        root.setAttribute("data-ecf-ready", "")
        if (st.open) refreshRows()
        kick()
    }, [copies, own])
    S.current.collect = collect

    // ---------- the loop runs only while something moves (never on the canvas or in an export)
    const kick = () => {
        const st = S.current
        if (st.running || opts.current.isStatic || st.list) return
        st.running = true
        let last = performance.now()
        st.prevY = st.y
        const step = (now: number) => {
            const o = opts.current
            const ms = Math.min(64, now - last)
            last = now
            const dt = ms / 16.667
            let moving = false
            // a slow device: if the frames come slower than ~45 a second for a while, the blur is turned off (as the reel)
            if (!st.lowPower && blurOn() && st.visible && !st.hidden && now > st.sampleFrom && ms > 0 && ms < 200) {
                st.samples.push(ms)
                if (st.samples.length >= 90) {
                    const sorted = (st.samples as number[]).slice().sort((a, b) => a - b)
                    if (sorted[45] > 22) {
                        st.lowPower = true
                        if (rootRef.current) rootRef.current.setAttribute("data-ecf-lite", "")
                    }
                    st.samples = []
                    st.sampleFrom = Infinity
                }
            }
            if (!st.dragging) {
                // wheel, scroll and key input ease in, a throw glides out
                if (st.reduce) {
                    st.y += st.pend
                    st.pend = 0
                } else {
                    const e = st.pend * (1 - Math.pow(0.84, dt))
                    st.pend -= e
                    st.y += e
                    if (Math.abs(st.pend) < 0.05) {
                        st.y += st.pend
                        st.pend = 0
                    }
                }
                st.y += st.v * dt
                st.v *= st.reduce ? 0 : Math.pow(clamp(num(o.M.glide, 0.95), 0.8, 0.99), dt)
                if (Math.abs(st.v) < 0.01) st.v = 0
                moving = !!(st.v || st.pend)
            }
            // Skew on Speed follows the feed's speed (a drag, a throw, the wheel, the page's scroll, the keys)
            const vel = ms > 0 ? ((st.y - st.prevY) / ms) * 1000 : 0
            st.vs += (vel - st.vs) * (1 - Math.pow(0.8, dt))
            if (Math.abs(st.vs) < 4) st.vs = 0
            const lean = skewMax()
            st.skew = lean && st.vs ? -lean * Math.tanh(st.vs / SKEW_SPEED) : 0
            if (Math.abs(st.skew) < 0.02) st.skew = 0
            // Zoom on Drag: steps back while held, returns as it is let go
            const zt = st.dragging ? zoomMin() : 1
            st.z += (zt - st.z) * (1 - Math.pow(0.84, dt))
            if (Math.abs(st.z - zt) < 0.0005) st.z = zt
            if (st.vs || st.z !== 1) moving = true
            if (st.total && Math.abs(st.y) > st.total * 4) st.y = mod(st.y, st.total)
            st.prevY = st.y
            place()
            if ((moving || st.dragging) && st.visible && !st.hidden && !st.list) st.raf = window.requestAnimationFrame(step)
            else st.running = false
        }
        st.raf = window.requestAnimationFrame(step)
    }

    // ---------- go to a card: centred when it fits in the view, else its top one gap below the view's top
    const goTo = (i: number) => {
        const st = S.current
        const el = (st.base as HTMLElement[])[i]
        if (!el) return
        if (st.list) {
            const r = el.getBoundingClientRect()
            el.scrollIntoView({ block: r.height < window.innerHeight - 32 ? "center" : "start", behavior: st.reduce ? "auto" : "smooth" })
            return
        }
        if (!st.copyEls.length || st.tops[i] === undefined) return
        const gap = Math.max(0, num(opts.current.L.gap, 24))
        const h = st.hs[i]
        const want = h < st.height - 2 * gap ? (st.height - h) / 2 : gap
        const y0 = st.cy[0] === undefined ? st.y : st.cy[0]
        let d = want - (y0 + st.tops[i])
        // the shortest way round the loop
        if (st.total) d = mod(d + st.total / 2, st.total) - st.total / 2
        st.v = 0
        st.pend = d
        kick()
    }

    // ---------- measure and lay out after every render, and whenever the size or the list changes
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
        // the feed and its own first copy (an image or a font that changes a card's height, a filter)
        const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(later) : null
        st.ro = ro
        st.roFirst = null
        if (ro) ro.observe(root)
        // the list changes (a filter, a CMS edit): only the feed's own first copy is watched, never changed
        const mo = typeof MutationObserver !== "undefined" ? new MutationObserver(later) : null
        st.mo = mo
        st.moFirst = null
        collect()
        return () => {
            window.clearTimeout(timer)
            window.clearTimeout(st.copyTimer)
            window.clearTimeout(st.quietTimer)
            if (st.idleId && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(st.idleId)
            if (st.quietGo) window.removeEventListener("load", st.quietGo)
            st.waitingQuiet = false
            if (ro) ro.disconnect()
            st.ro = null
            st.roFirst = null
            if (mo) mo.disconnect()
            st.mo = null
            st.moFirst = null
        }
    }, [collect, copies])

    // ---------- off screen, a background tab, reduced motion (the live site and Preview only)
    React.useEffect(() => {
        const root = rootRef.current
        if (!root || isStatic) return
        const st = S.current
        st.sampleFrom = performance.now() + 1500
        // Save-Data: no blur
        const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
        if (conn && conn.saveData) {
            st.lowPower = true
            root.setAttribute("data-ecf-lite", "")
        }
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
        const onVis = () => {
            st.hidden = document.hidden
            place(true)
            if (!st.hidden) kick()
        }
        document.addEventListener("visibilitychange", onVis)
        const mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null
        const onMq = () => {
            if (st.collect) st.collect()
        }
        if (mq && mq.addEventListener) mq.addEventListener("change", onMq)
        return () => {
            if (io) io.disconnect()
            document.removeEventListener("visibilitychange", onVis)
            if (mq && mq.removeEventListener) mq.removeEventListener("change", onMq)
        }
    }, [isStatic])

    // ---------- pointer, wheel, page scroll, keys and focus (the live site and Preview only)
    React.useEffect(() => {
        const root = rootRef.current
        if (!root || isStatic) return
        const st = S.current
        // a finger moves a little even in a tap: up to 10 px is still a tap
        const slop = (e: PointerEvent) => (e.pointerType === "mouse" ? 6 : 10)
        // an event's target may be the window or the document (a script can send one there): only nodes are looked into
        const inNav = (t: EventTarget | null) => !!(t instanceof Node && navRef.current && navRef.current.contains(t))
        // the page may be scaled: screen px → the feed's own px
        const scale = () => {
            const h = root.getBoundingClientRect().height
            return root.offsetHeight && h ? h / root.offsetHeight : 1
        }
        // the feed fills the screen (Full Page): only then does it take the wheel and the page's keys
        const covers = () => {
            const r = root.getBoundingClientRect()
            return r.top <= 1 && r.bottom >= window.innerHeight - 1
        }
        // the repeats leave the Tab order while a keyboard is in use (Tab pressed) and come back with the pointer;
        // only the feed's own copy wrappers get the attribute
        const setInert = (on: boolean) => {
            if (st.inert === on) return
            st.inert = on
            ;(st.copyEls as HTMLElement[]).forEach((ce, i) => {
                if (i > 0 && on && !st.list) ce.setAttribute("inert", "")
                else ce.removeAttribute("inert")
            })
        }
        const onTabKey = (e: KeyboardEvent) => {
            if (e.key === "Tab") setInert(true)
        }
        const onPointerAny = (e: PointerEvent) => {
            if (e.isTrusted) setInert(false)
        }

        // while a pointer is down, its moves and its end are followed even outside the feed
        let follow = false
        const startFollow = () => {
            if (follow) return
            follow = true
            window.addEventListener("pointermove", onMove)
            window.addEventListener("pointerup", onUp)
            window.addEventListener("pointercancel", onUp)
        }
        const stopFollow = () => {
            if (!follow || st.down) return
            follow = false
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerup", onUp)
            window.removeEventListener("pointercancel", onUp)
        }

        const onDown = (e: PointerEvent) => {
            const o = opts.current
            // Drag off, a phone's list, the navigator: the cards and buttons take their own clicks and taps
            if ((e.button !== 0 && e.pointerType === "mouse") || !e.isTrusted || st.list || inNav(e.target) || !o.M.drag) return
            // a set height: a finger scrolls the page (and the page moves the feed)
            if (e.pointerType !== "mouse" && !o.page) return
            // a finger's tap is recognised on pointer-up (browsers may drop the click of the first tap after a drag)
            st.tap = e.pointerType !== "mouse" ? { id: e.pointerId, x: e.clientX, y: e.clientY, t0: performance.now(), target: e.target, moving: Math.abs(st.v) > 2 } : null
            startFollow()
            st.down = { id: e.pointerId, x: e.clientX, y: e.clientY, ly: e.clientY, lt: performance.now(), k: scale() }
            st.v = 0
            st.pend = 0
            kick()
        }
        const onMove = (e: PointerEvent) => {
            if (st.tap && st.tap.id === e.pointerId && Math.hypot(e.clientX - st.tap.x, e.clientY - st.tap.y) > slop(e)) st.tap = null
            const d = st.down
            if (!d || d.id !== e.pointerId) return
            if (!st.dragging && Math.hypot(e.clientX - d.x, e.clientY - d.y) > slop(e)) {
                st.dragging = true
                root.setAttribute("data-ecf-dragging", "")
                try {
                    root.setPointerCapture(e.pointerId)
                } catch (err) {}
                kick()
            }
            if (st.dragging) {
                const now = performance.now()
                // the feed follows the pointer exactly, also while Zoom on Drag draws it smaller
                const dy = (e.clientY - d.ly) / d.k / Math.max(0.5, st.z)
                const dt = Math.max(1, now - d.lt) / 16.667
                st.y += dy
                st.v = clamp(st.v * 0.6 + (dy / dt) * 0.4, -160, 160)
                d.lt = now
            }
            d.ly = e.clientY
        }
        const onUp = (e: PointerEvent) => {
            if (!e.isTrusted) return
            const tap = st.tap
            st.tap = null
            if (tap && tap.id === e.pointerId && e.type === "pointerup" && !tap.moving && !st.dragging && performance.now() - tap.t0 < 700) onTap(tap.target)
            const d = st.down
            if (d && d.id === e.pointerId) {
                if (st.dragging) {
                    st.suppress = true
                    window.setTimeout(() => (st.suppress = false), 0)
                    // a cancelled touch, a pause before letting go, reduced motion: no glide
                    if (e.type === "pointercancel" || performance.now() - d.lt > 80 || st.reduce) st.v = 0
                }
                st.dragging = false
                st.down = null
                root.removeAttribute("data-ecf-dragging")
                kick()
            }
            stopFollow()
        }
        // a finger's tap opens the link it landed on; the browser's own click, if it still comes, is then left out
        const onTap = (target: EventTarget | null) => {
            if (!(target instanceof Element) || !root.contains(target) || inNav(target)) return
            const a = target.closest("a[href]") as HTMLElement | null
            if (!a || !root.contains(a)) return
            st.tapAt = performance.now()
            openLink(a)
        }
        const onClick = (e: MouseEvent) => {
            if (inNav(e.target)) return
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
        // Full Page: once the feed fills the screen the wheel moves it (from anywhere on the page, so a narrower feed
        // works too); before that the page scrolls it into place. Another part of the page that scrolls keeps its wheel.
        const onWheel = (e: WheelEvent) => {
            const o = opts.current
            if (!o.page || st.list || e.ctrlKey || e.metaKey || e.defaultPrevented || !st.visible || st.hidden || !st.count) return
            const t = e.target instanceof Element ? e.target : null
            if (inNav(t)) return
            const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? st.height : 1
            const dy = e.deltaY * unit
            if (!dy || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
            if (t && !root.contains(t) && scrollsItself(t, dy)) return
            if (!covers()) return
            e.preventDefault()
            st.pend -= dy
            kick()
        }
        // a set height: the page's scroll moves the feed along; a phone's list: the counter follows the page
        let lastY = window.scrollY
        let scanRaf = 0
        const onScroll = () => {
            const y = window.scrollY
            const dy = y - lastY
            lastY = y
            if (st.list) {
                if (!scanRaf)
                    scanRaf = window.requestAnimationFrame(() => {
                        scanRaf = 0
                        scanList()
                    })
                return
            }
            const o = opts.current
            const k = Math.max(0, num(o.L.scrollLink, 0))
            if (o.page || !k || !dy || !st.visible || st.dragging) return
            st.pend -= dy * k
            kick()
        }
        // keys: ↑ ↓ the previous / next card, Page Up / Page Down / Space a screen, Home / End the first / last card
        const keyMove = (e: KeyboardEvent): boolean => {
            if (st.list || !st.count) return false
            const page = st.height * 0.85
            let d = 0
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                goTo(mod(st.current + (e.key === "ArrowDown" ? 1 : -1), st.count))
                return true
            }
            if (e.key === "Home") {
                goTo(0)
                return true
            }
            if (e.key === "End") {
                goTo(st.count - 1)
                return true
            }
            if (e.key === "PageDown") d = -page
            else if (e.key === "PageUp") d = page
            else if (e.key === " ") d = e.shiftKey ? page : -page
            else return false
            st.v = 0
            st.pend += d
            kick()
            return true
        }
        const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))
        const onKey = (e: KeyboardEvent) => {
            if (e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey || typing(e.target) || inNav(e.target)) return
            if (keyMove(e)) e.preventDefault()
        }
        // Full Page: with nothing focused the page's keys move the feed (the feed is the page)
        const onPageKey = (e: KeyboardEvent) => {
            if (!opts.current.page || e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey) return
            const a = document.activeElement
            if (a && a !== document.body && a !== document.documentElement) return
            if (!st.visible || !covers()) return
            if (keyMove(e)) e.preventDefault()
        }
        // a card reached with Tab comes fully into view (read only: where the focused card is now)
        const keyboardFocus = (el: Element) => {
            try {
                return el.matches(":focus-visible")
            } catch (err) {
                return true
            }
        }
        const onFocusIn = (e: FocusEvent) => {
            const t = e.target
            if (!(t instanceof Element) || t === root || st.list || inNav(t) || !keyboardFocus(t) || !st.copyEls.length) return
            const view = viewRef.current
            if (!view || !view.contains(t)) return
            const k = scale()
            const vr = view.getBoundingClientRect()
            const r = t.getBoundingClientRect()
            const top = (r.top - vr.top) / k
            const h = r.height / k
            if (!(h > 0) || h >= st.height) return
            const pad = Math.min(48, Math.max(0, (st.height - h) / 2))
            let d = 0
            if (top < pad) d = pad - top
            else if (top + h > st.height - pad) d = st.height - pad - (top + h)
            if (st.total) d = mod(d + st.total / 2, st.total) - st.total / 2
            st.v = 0
            st.pend = d
            kick()
        }
        const noDrag = (e: Event) => e.preventDefault()
        // older browsers without overflow: clip scroll the frame to a focused card: put it back
        const frame = frameRef.current
        const onOwnScroll = () => {
            if (frame && (frame.scrollTop || frame.scrollLeft)) {
                frame.scrollTop = 0
                frame.scrollLeft = 0
            }
        }

        root.addEventListener("pointerdown", onPointerAny, true)
        root.addEventListener("pointermove", onPointerAny)
        root.addEventListener("pointerdown", onDown)
        root.addEventListener("click", onClick, true)
        root.addEventListener("keydown", onKey)
        root.addEventListener("focusin", onFocusIn)
        root.addEventListener("dragstart", noDrag)
        if (frame) frame.addEventListener("scroll", onOwnScroll)
        window.addEventListener("wheel", onWheel, { passive: false })
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("keydown", onPageKey)
        window.addEventListener("keydown", onTabKey, true)
        kick()
        return () => {
            root.removeEventListener("pointerdown", onPointerAny, true)
            root.removeEventListener("pointermove", onPointerAny)
            root.removeEventListener("pointerdown", onDown)
            root.removeEventListener("click", onClick, true)
            root.removeEventListener("keydown", onKey)
            root.removeEventListener("focusin", onFocusIn)
            root.removeEventListener("dragstart", noDrag)
            if (frame) frame.removeEventListener("scroll", onOwnScroll)
            window.removeEventListener("wheel", onWheel)
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("keydown", onPageKey)
            window.removeEventListener("keydown", onTabKey, true)
            if (scanRaf) window.cancelAnimationFrame(scanRaf)
            st.down = null
            stopFollow()
            window.cancelAnimationFrame(st.raf)
            st.running = false
        }
    }, [isStatic])

    // ---------- the navigator: the counter opens the panel; Esc, a click outside or Tab out closes it
    const close = (refocus: boolean) => {
        S.current.open = false
        setOpen(false)
        if (refocus && btnRef.current) btnRef.current.focus({ preventScroll: true })
    }
    const toggle = () => {
        const st = S.current
        if (st.open) return close(true)
        // the cards as they are now (a filter or a CMS edit may have changed them)
        collect()
        if (st.list) scanList()
        st.open = true
        refreshRows()
        setOpen(true)
    }
    const choose = (i: number) => {
        close(true)
        const el = (S.current.base as HTMLElement[])[i]
        const a = el && opts.current.N.panelClick === "open" ? linkOf(el) : null
        if (a) openLink(a)
        else goTo(i)
    }
    // the panel opens with the focus on the current card's row, scrolled into the middle of the panel
    const wasOpen = React.useRef(false)
    useIso(() => {
        markRows()
        if (!open || wasOpen.current) {
            wasOpen.current = open
            return
        }
        wasOpen.current = true
        const p = panelRef.current
        if (!p) return
        const cur = (p.querySelector("[aria-current=true]") || p.querySelector("[data-i]")) as HTMLElement | null
        if (cur) {
            cur.focus({ preventScroll: true })
            p.scrollTop = cur.offsetTop - (p.clientHeight - cur.offsetHeight) / 2
        }
    }, [open, rows])
    React.useEffect(() => {
        if (!open) return
        const onPointer = (e: PointerEvent) => {
            if (navRef.current && !(e.target instanceof Node && navRef.current.contains(e.target))) close(false)
        }
        const onEsc = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return
            e.preventDefault()
            close(!!navRef.current && navRef.current.contains(document.activeElement))
        }
        document.addEventListener("pointerdown", onPointer, true)
        document.addEventListener("keydown", onEsc)
        return () => {
            document.removeEventListener("pointerdown", onPointer, true)
            document.removeEventListener("keydown", onEsc)
        }
    }, [open])
    // the focus leaves the navigator (Tab out, or to nothing): it closes. A press inside it (Safari does not focus a
    // clicked button, so the focus drops to the page for a moment) keeps it open.
    const onNavBlur = (e: React.FocusEvent) => {
        const st = S.current
        const next = e.relatedTarget as Node | null
        const nav = navRef.current
        if (!st.open || !nav || (next && nav.contains(next))) return
        if (next) return close(false)
        window.setTimeout(() => {
            if (st.open && !st.navPress && !nav.contains(document.activeElement)) close(false)
        }, 0)
    }
    const onNavDown = () => {
        S.current.navPress = true
        const up = () => {
            S.current.navPress = false
            window.removeEventListener("pointerup", up, true)
            window.removeEventListener("pointercancel", up, true)
        }
        window.addEventListener("pointerup", up, true)
        window.addEventListener("pointercancel", up, true)
    }
    // ↑ ↓ Home End move through the rows
    const onPanelKey = (e: React.KeyboardEvent) => {
        const p = panelRef.current
        if (!p) return
        const list = Array.from(p.querySelectorAll("[data-i]")) as HTMLElement[]
        if (!list.length) return
        const at = list.indexOf(document.activeElement as HTMLElement)
        let to = -1
        if (e.key === "ArrowDown") to = at < 0 ? 0 : Math.min(list.length - 1, at + 1)
        else if (e.key === "ArrowUp") to = at < 0 ? 0 : Math.max(0, at - 1)
        else if (e.key === "Home") to = 0
        else if (e.key === "End") to = list.length - 1
        else return
        e.preventDefault()
        list[to].focus()
    }

    // ---------- render
    const blurH = E.edgeBlur ? Math.max(0, num(E.blurHeight, 0)) : 0
    const blurPx = Math.max(0, num(E.blur, 0))
    const fade = E.edgeFade ? Math.max(0, num(E.fadeHeight, 0)) : 0
    const align = L.align === "left" ? "flex-start" : L.align === "right" ? "flex-end" : "center"
    const rootStyle = {
        ...props.style,
        position: "relative",
        "--ecf-gap": Math.max(0, num(L.gap, 24)) + "px",
        "--ecf-align": align,
        "--ecf-text": ST.text,
        "--ecf-muted": ST.muted,
        "--ecf-surface": ST.surface,
        "--ecf-hover": ST.hover,
        "--ecf-border": ST.border,
        "--ecf-focus": ST.focus,
        "--ecf-radius": Math.max(0, num(ST.radius, 16)) + "px",
        "--ecf-pw": Math.max(160, num(N.panelWidth, 320)) + "px",
        "--ecf-ph": Math.max(160, num(N.panelHeight, 440)) + "px",
        "--ecf-inset": Math.max(0, num(N.inset, 16)) + "px",
        "--ecf-blur-h": blurH + "px",
        "--ecf-blur-n": blurH,
        "--ecf-blur": blurPx + "px",
        "--ecf-fade": fade + "px",
        "--ecf-fade-n": fade,
    } as React.CSSProperties

    // Your Content as the feed's own cells (one per layer you put in: a list, a frame, or each card), each with a fit
    // layer. The first copy is kept as the very same element while only the repeats change, so adding repeats never
    // redraws it (on a slow page its cards may still be hydrating: an update there is React's "recoverable error"
    // #421). Each repeat loads inside its own Suspense, so a card part that is still loading waits there and never
    // reaches the rest of the page.
    // Width Fill: each layer you put in is given the width 100 % as a React prop, as Framer's own Ticker sizes its items
    // (Stretch): a layer on the canvas (a Collection List beside the page) cannot be set to 100 % itself. The feed
    // never writes to it afterwards.
    const fill = L.width !== "own"
    const body = React.useMemo(() => {
        const els = React.Children.toArray(props.content)
        if (!els.length) return null
        return els.map((c, i) => (
            <div key={i} className={cls + "-cell"}>
                <div className={cls + "-fit"}>{fill && React.isValidElement(c) ? stretch(c) : c}</div>
            </div>
        ))
    }, [props.content, cls, fill])
    const firstSet = React.useMemo(
        () =>
            body ? (
                <div key={0} className={cls + "-copy"} data-ecf-copy={0}>
                    {body}
                </div>
            ) : null,
        [body, cls]
    )
    const layers: React.ReactNode[] = []
    if (body) {
        layers.push(firstSet)
        for (let i = 1; i < copies; i++) {
            layers.push(
                <React.Suspense key={i} fallback={null}>
                    <div className={cls + "-copy"} data-ecf-copy={i} aria-hidden={true}>
                        {body}
                    </div>
                </React.Suspense>
            )
        }
    }
    const total = rows.length
    // the panel's id and the counter's aria-controls are set in the browser, on the feed's own elements: an id from
    // useId() differs between the server and the browser on a per-breakpoint instance, and a link set in the first
    // render would point at the server's id
    const pid = cls + "-panel-" + uid
    React.useEffect(() => {
        const b = btnRef.current
        const pn = panelRef.current
        if (!b || !pn) return
        if (pn.id !== pid) pn.id = pid
        if (b.getAttribute("aria-controls") !== pid) b.setAttribute("aria-controls", pid)
    })
    const nav =
        N.show && body ? (
            <div className={cls + "-rail"} data-corner={N.corner}>
                <div ref={navRef} className={cls + "-nav"} data-corner={N.corner} onBlur={onNavBlur} onPointerDown={onNavDown}>
                    <div className={cls + "-dock"}>
                        <button ref={btnRef} type="button" className={cls + "-btn"} style={ST.font} aria-haspopup="dialog" aria-expanded={open} onClick={toggle}>
                            <span>
                                <span ref={numRef} />
                                <span className={cls + "-of"}>
                                    {" / "}
                                    <span ref={totRef} />
                                </span>
                            </span>
                            <GridIcon />
                        </button>
                        <div ref={panelRef} className={cls + "-panel"} role="dialog" aria-label={A.panel || undefined} data-open={open ? "" : undefined} onKeyDown={onPanelKey}>
                            <ul className={cls + "-list"}>
                                {rows.map((r) => (
                                    <li key={r.i}>
                                        <button type="button" className={cls + "-row"} data-i={r.i} style={ST.rowFont} onClick={() => choose(r.i)}>
                                            <span className={cls + "-thumb"} aria-hidden="true">
                                                {r.src ? <img className={cls + "-pic"} src={r.src} alt="" loading="lazy" decoding="async" draggable={false} /> : pad(r.i + 1, total)}
                                            </span>
                                            <span className={cls + "-title"}>{r.title || pad(r.i + 1, total)}</span>
                                            <span className={cls + "-num"} aria-hidden="true">
                                                {pad(r.i + 1, total)}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        ) : null
    const top = N.corner === "top-center" || N.corner === "top-left" || N.corner === "top-right"

    return (
        <div
            ref={rootRef}
            className={cls}
            style={rootStyle}
            tabIndex={0}
            role="region"
            aria-label={A.feed || undefined}
            data-lenis-prevent=""
            data-ecf-page={page ? "" : undefined}
            data-ecf-sized={page ? undefined : ""}
            data-ecf-drag={M.drag ? "" : undefined}
            data-ecf-fade={fade > 0 ? "" : undefined}
        >
            <style dangerouslySetInnerHTML={{ __html: css(cls) }} />
            {top ? nav : null}
            <div ref={frameRef} className={cls + "-frame"} data-ecf-frame="">
                <div ref={viewRef} className={cls + "-view"}>
                    <div ref={stageRef} className={cls + "-stage"}>
                        {layers}
                    </div>
                    {isCanvas ? (
                        <div className={cls + "-empty"} data-ecf-hint={body ? "list" : "none"}>
                            {body ? "Content has no cards yet." : "Put a vertical Collection List of your cards (or your cards) into Content."}
                        </div>
                    ) : null}
                </div>
                {blurH > 0 && blurPx > 0 && body ? (
                    <>
                        <div className={cls + "-blur"} data-side="t" aria-hidden="true">
                            <i />
                            <i />
                            <i />
                        </div>
                        <div className={cls + "-blur"} data-side="b" aria-hidden="true">
                            <i />
                            <i />
                            <i />
                        </div>
                    </>
                ) : null}
                <div className={cls + "-shield"} aria-hidden="true" />
                {isCanvas ? <div className={cls + "-wide"}>Your list is wider than the feed: set Layout → Width to Fill.</div> : null}
            </div>
            {top ? null : nav}
        </div>
    )
}

// ---------- the panel
EndlessCMSFeed.displayName = "Endless CMS Feed"
addPropertyControls(EndlessCMSFeed, {
    content: {
        type: ControlType.Slot,
        title: "Content",
        maxCount: 40,
        description: "A vertical Collection List of your card (the card set to Fill inside it), a frame of cards, or your cards one by one. Set it on the Desktop breakpoint.",
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        icon: "object",
        controls: {
            width: {
                type: ControlType.Enum,
                title: "Width",
                options: ["fill", "own"],
                optionTitles: ["Fill", "Own"],
                displaySegmentedControl: true,
                defaultValue: D.layout.width,
                description: "Fill: your list (or each card added one by one) as wide as the feed, at every width. Own: the width it has on the canvas.",
            },
            align: { type: ControlType.Enum, title: "Align", options: ["left", "center", "right"], optionTitles: ["Left", "Center", "Right"], displaySegmentedControl: true, defaultValue: D.layout.align, description: "Where your list (or each card) sits when it is narrower than the feed.", hidden: (p: any) => p.width !== "own" },
            gap: { type: ControlType.Number, title: "Gap", min: 0, max: 160, step: 1, unit: "px", defaultValue: D.layout.gap, description: "Between the end of your list and its next repeat: set it to your list's own gap. Also between cards added one by one." },
            scrollLink: {
                type: ControlType.Number,
                title: "Scroll Link",
                min: 0,
                max: 3,
                step: 0.1,
                defaultValue: D.layout.scrollLink,
                description: "The feed's height is Framer's own Height. A set height (Fixed, Fill, vh): the page's scroll moves the feed this much as it passes (0 = off). Fit = Full Page: it fills the screen and takes the wheel; below 810 px a plain list.",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        icon: "interaction",
        controls: {
            drag: { type: ControlType.Boolean, title: "Drag", defaultValue: D.motion.drag, description: "With the mouse or a finger, with momentum. A drag never opens a card." },
            glide: { type: ControlType.Number, title: "Glide", min: 0.8, max: 0.99, step: 0.01, defaultValue: D.motion.glide, description: "How far the feed glides after a throw." },
        },
    },
    effect: {
        type: ControlType.Object,
        title: "Effects",
        icon: "effect",
        description: "Each effect on or off with one click. Not on a phone's list; all rest with reduced motion; the blur also on slow devices.",
        controls: {
            skew: { type: ControlType.Boolean, title: "Skew on Speed", defaultValue: D.effect.skew, description: "The feed tilts into a fast scroll, drag or throw, and straightens again as it slows." },
            skewAngle: { type: ControlType.Number, title: "Angle", min: 1, max: 10, step: 0.5, unit: "°", defaultValue: D.effect.skewAngle, description: "The most it tilts, at full speed.", hidden: (p: any) => !p.skew },
            zoom: { type: ControlType.Boolean, title: "Zoom on Drag", defaultValue: D.effect.zoom, description: "The feed steps back while it is held, and comes forward again when let go." },
            zoomTo: { type: ControlType.Number, title: "Zoom To", min: 80, max: 99, step: 1, unit: "%", defaultValue: D.effect.zoomTo, hidden: (p: any) => !p.zoom },
            edgeBlur: { type: ControlType.Boolean, title: "Edge Blur", defaultValue: D.effect.edgeBlur, description: "The cards blur at the top and the bottom, like frosted glass." },
            blurHeight: { type: ControlType.Number, title: "Blur Height", min: 20, max: 400, step: 4, unit: "px", defaultValue: D.effect.blurHeight, description: "At each end of a feed 900 px high or taller; a shorter feed gets it shorter in proportion.", hidden: (p: any) => !p.edgeBlur },
            blur: { type: ControlType.Number, title: "Blur Amount", min: 1, max: 40, step: 1, unit: "px", defaultValue: D.effect.blur, hidden: (p: any) => !p.edgeBlur },
            edgeFade: { type: ControlType.Boolean, title: "Edge Fade", defaultValue: D.effect.edgeFade, description: "The feed fades out at the top and the bottom." },
            fadeHeight: { type: ControlType.Number, title: "Fade Height", min: 20, max: 400, step: 4, unit: "px", defaultValue: D.effect.fadeHeight, description: "At each end of a feed 900 px high or taller; a shorter feed gets it shorter in proportion.", hidden: (p: any) => !p.edgeFade },
        },
    },
    navigator: {
        type: ControlType.Object,
        title: "Navigator",
        icon: "interaction",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: D.navigator.show, description: "A counter (03 / 12) that follows the feed. A click opens a panel with every card: its picture and its title, read from the card." },
            corner: {
                type: ControlType.Enum,
                title: "Position",
                options: ["bottom-center", "bottom-right", "bottom-left", "top-center", "top-right", "top-left"],
                optionTitles: ["Bottom Center", "Bottom Right", "Bottom Left", "Top Center", "Top Right", "Top Left"],
                defaultValue: D.navigator.corner,
                hidden: (p: any) => !p.show,
            },
            panelClick: {
                type: ControlType.Enum,
                title: "Panel Click",
                options: ["scroll", "open"],
                optionTitles: ["Scroll to Card", "Open Page"],
                displaySegmentedControl: true,
                defaultValue: D.navigator.panelClick,
                description: "What a card in the panel does. Open Page uses the card's own link.",
                hidden: (p: any) => !p.show,
            },
            panelWidth: { type: ControlType.Number, title: "Panel Width", min: 200, max: 560, step: 4, unit: "px", defaultValue: D.navigator.panelWidth, hidden: (p: any) => !p.show },
            panelHeight: { type: ControlType.Number, title: "Panel Height", min: 200, max: 900, step: 4, unit: "px", defaultValue: D.navigator.panelHeight, description: "At most; a shorter list takes less.", hidden: (p: any) => !p.show },
            inset: { type: ControlType.Number, title: "Inset", min: 0, max: 64, step: 1, unit: "px", defaultValue: D.navigator.inset, description: "From the edges of the feed (and of the screen).", hidden: (p: any) => !p.show },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Style",
        icon: "color",
        description: "Link the colours to your colour styles so light and dark follow.",
        controls: {
            font: { type: ControlType.Font, title: "Counter Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: D.look.font },
            rowFont: { type: ControlType.Font, title: "Panel Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: D.look.rowFont },
            text: { type: ControlType.Color, title: "Text", defaultValue: D.look.text },
            muted: { type: ControlType.Color, title: "Muted", defaultValue: D.look.muted, description: "The total, the numbers and the icon." },
            surface: { type: ControlType.Color, title: "Surface", defaultValue: D.look.surface, description: "Behind the counter and the panel." },
            hover: { type: ControlType.Color, title: "Hover", defaultValue: D.look.hover, description: "The panel's current and hovered card." },
            border: { type: ControlType.Color, title: "Border", defaultValue: D.look.border },
            focus: { type: ControlType.Color, title: "Focus Ring", defaultValue: D.look.focus, description: "Shown for keyboard users." },
            radius: { type: ControlType.Number, title: "Radius", min: 0, max: 32, step: 1, unit: "px", defaultValue: D.look.radius, description: "The panel's corners (the counter is a pill)." },
        },
    },
    a11y: {
        type: ControlType.Object,
        title: "Accessibility",
        icon: "object",
        description: "Read out by screen readers.",
        controls: {
            feed: { type: ControlType.String, title: "Feed Label", defaultValue: D.a11y.feed },
            counter: { type: ControlType.String, title: "Counter Label", defaultValue: D.a11y.counter, description: "{n} and {total} become the numbers." },
            panel: { type: ControlType.String, title: "Panel Label", defaultValue: D.a11y.panel },
        },
    },
})
