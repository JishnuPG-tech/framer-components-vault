// build: n3ik-cms1
// @framerDisableUnlink
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react"

// prefers-reduced-motion 은 마운트 후에만 읽는다 — 서버(false)와 하이드레이션 첫 렌더가 같아야 한다.
function useReduce(): boolean {
    const [reduce, setReduce] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setReduce(mq.matches)
        sync()
        mq.addEventListener("change", sync)
        return () => mq.removeEventListener("change", sync)
    }, [])
    return reduce
}

type ColorValue = string | { value?: string }
type LinkValue = string | { href?: string; url?: string }
type ImageValue = string | { src?: string; url?: string; alt?: string }

type DossierCard = {
    title?: string
    note?: string
    image?: ImageValue
    imageUrl?: string
    alt?: string
    link?: LinkValue
    linkUrl?: string
}

type Props = {
    cards: DossierCard[]
    cardSlots: React.ReactNode[]
    titleLayer: string
    bodyLayer: string
    imageLayer: string
    styleCmsLayers: boolean
    label: string
    sticker: string
    pocketTitle: string
    pocketMeta: string
    openOn: string
    startOpen: boolean
    spread: number
    lift: number
    radius: number
    maxWidth: number
    openLabel: string
    closeLabel: string
    emptyText: string
    font?: { fontFamily?: string; fontWeight?: number | string; fontStyle?: string }
    fontSize: number
    folder: ColorValue
    tab: ColorValue
    paper: ColorValue
    accent: ColorValue
    text: ColorValue
    muted: ColorValue
    style?: React.CSSProperties
}

type Palette = { folder: string; tab: string; paper: string; accent: string; text: string; muted: string }

// Font 컨트롤 — 값이 없으면 규칙을 내보내지 않는다(기존 페이지 폰트 상속 유지 = 시각 변화 0).
// CSS 변수 값으로 들어가므로 따옴표·구분자는 떼어낸다.
function fontFamilyOf(f?: { fontFamily?: string }): string {
    const raw = (f && f.fontFamily) || ""
    return raw.replace(/["'<>{};]/g, "").trim()
}

const tok = (v?: ColorValue): string => (!v ? "" : typeof v === "string" ? v : v.value || "")
const srcOf = (v?: ImageValue): string => (!v ? "" : typeof v === "string" ? v : v.src || v.url || "")

const paletteOf = (props: Props): Palette => ({
    folder: tok(props.folder) || "#FBBF24",
    tab: tok(props.tab) || "#F59E0B",
    paper: tok(props.paper) || "#FFFFFF",
    accent: tok(props.accent) || "#2563EB",
    text: tok(props.text) || "#111827",
    muted: tok(props.muted) || "#5F6B7A",
})

// Image/Link 컨트롤이 비어 있을 때만 옛 URL 문자열(legacy)을 쓴다.
function linkOf(item: DossierCard): string {
    const l = item.link
    const fromControl = !l ? "" : typeof l === "string" ? l : l.href || l.url || ""
    return fromControl || (item.linkUrl || "").trim()
}
const imageOf = (item: DossierCard): string => srcOf(item.image) || (item.imageUrl || "").trim()

// 폴더 라벨·스티커 글자색은 배경 휘도로 고른다(QUALITY-10 A3/B3)
function inkOn(bg: string): string {
    // Framer는 색 컨트롤 값을 rgb()/rgba() 문자열로 넘길 수 있다(9/3 캔버스 실측) — hex 만 읽으면 밝은 배경에 흰 글자가 난다.
    const s = bg.trim()
    let r = 255, g = 255, b = 255
    const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s)
    const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(s)
    if (hex) {
        const h = hex[1].length === 3 ? hex[1].split("").map((c) => c + c).join("") : hex[1]
        r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16)
    } else if (rgb) {
        r = Number(rgb[1]); g = Number(rgb[2]); b = Number(rgb[3])
    } else return "#fff"
    const ch = (v: number) => {
        const c = v / 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    }
    const lum = 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)
    return lum > 0.35 ? "#111827" : "#fff"
}

// 이미지가 없으면 제목에서 만든 파스텔 — 빈 회색 상자를 만들지 않는다
function blockColor(seed?: string): string {
    const s = (seed || "?").trim()
    let h = 0
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360
    return `hsl(${h} 46% 84%)`
}

// 타이포 스케일(QUALITY-10 A1): 본문 = Text size, 단계마다 ×1.25 / ÷1.25
const TYPE_SCALE = 1.25
function step(base: number, n: number): number {
    return Math.max(10, Math.round(base * Math.pow(TYPE_SCALE, n)))
}

const MAX_CARDS = 5

// URL sinks (REVIEW-RULES R7). Images: https, data:image and blob only. Links: http(s), mailto, tel and same-site paths.
function imageUrlOk(v: string): boolean {
    try {
        const u = new URL(v)
        return u.protocol === "https:" || u.protocol === "blob:" || (u.protocol === "data:" && /^data:image\//i.test(v))
    } catch {
        return false
    }
}
function safeImageUrl(v?: string): string | undefined {
    const s = String(v || "").trim()
    return s && imageUrlOk(s) ? s : undefined
}
function safeHref(v?: string): string | undefined {
    const s = String(v || "").trim()
    if (!s) return undefined
    if (/^(\/(?!\/)|#|\?|\.\.?\/)/.test(s)) return s
    try {
        const u = new URL(s)
        return u.protocol === "https:" || u.protocol === "http:" || u.protocol === "mailto:" || u.protocol === "tel:" ? s : undefined
    } catch {
        return undefined
    }
}
// Values that reach CSS custom properties: strip declaration/block delimiters, angle brackets and comment markers.
const cssToken = (v: string): string => String(v || "").replace(/[;{}<>\\]|\/\*|\*\//g, "").slice(0, 200)

/* ------------------------------------------------------------------ *
 * One constant stylesheet for every instance (REVIEW-RULES R8: nothing is
 * interpolated). Colours, sizes and the font travel as custom properties on
 * the root's React style; switches are classes on the root. Card positions
 * (closed pocket / open fan) are inline React styles on our own card elements.
 * ------------------------------------------------------------------ */
const DS_CSS = `
.ds-root { display:block; position:relative; color:var(--ds-text); }
.ds-root.ds-ff, .ds-root.ds-ff button, .ds-root.ds-ff input, .ds-root.ds-ff select, .ds-root.ds-ff textarea { font-family:var(--ds-ff); }
.ds-root .ds-scene { position:relative; width:100%; max-width:var(--ds-maxw); margin:0 auto; aspect-ratio:1/1; overflow:hidden; border-radius:var(--ds-r); }
.ds-root .ds-btn { position:absolute; inset:0; width:100%; height:100%; border:0; padding:0; background:transparent; cursor:pointer; border-radius:var(--ds-r); -webkit-tap-highlight-color:transparent; }
.ds-root .ds-btn:focus-visible { outline:2px solid var(--ds-accent); outline-offset:-3px; }
.ds-root .ds-back { position:absolute; left:0; right:0; top:14%; bottom:0; background:var(--ds-folder); border-radius:var(--ds-r); filter:brightness(0.9); }
.ds-root .ds-tab { position:absolute; left:5%; top:6%; width:38%; height:9%; background:var(--ds-tab); border-radius:var(--ds-r-tab) var(--ds-r-tab) 0 0; display:flex; align-items:center; padding:0 12px; font-size:var(--ds-fs-down); font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:var(--ds-ink-tab); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ds-root .ds-cards { position:absolute; left:16%; right:16%; top:30%; bottom:24%; pointer-events:none; z-index:5; }
.ds-root .ds-src { position:absolute; inset:0; }
.ds-root .ds-view { position:absolute; inset:0; }
.ds-root .ds-card { position:absolute; left:0; right:0; top:0; bottom:0; background:var(--ds-paper); border-radius:var(--ds-r-card); box-shadow:0 10px 28px rgba(15,23,42,0.16); overflow:hidden; transform-origin:50% 100%; will-change:transform; text-decoration:none; color:inherit; display:flex; flex-direction:column; }
.ds-root .ds-scard > * { position:relative !important; top:auto !important; left:auto !important; width:100% !important; height:100% !important; min-width:0 !important; min-height:0 !important; max-width:none !important; max-height:none !important; margin:0 !important; box-sizing:border-box !important; overflow:hidden; color:inherit; text-decoration:none; }
.ds-root.ds-motion .ds-card, .ds-root.ds-motion .ds-front { transition:transform 520ms cubic-bezier(0.22,1,0.36,1); }
.ds-root .ds-media { flex:1 1 auto; min-height:0; display:flex; align-items:center; justify-content:center; }
.ds-root .ds-media img { width:100%; height:100%; object-fit:cover; display:block; }
.ds-root .ds-poster { width:100%; height:100%; display:block; }
.ds-root .ds-pocket { position:absolute; left:7%; right:7%; top:70%; bottom:8%; display:flex; flex-direction:column; justify-content:space-between; pointer-events:none; z-index:21; color:var(--ds-ink-folder); }
.ds-root .ds-pocket-title { margin:0; font-size:var(--ds-fs-up); font-weight:700; line-height:1.25; max-width:70%; letter-spacing:-0.01em; }
.ds-root .ds-pocket-meta { margin:0; font-size:var(--ds-fs-down); font-weight:600; line-height:1.3; opacity:0.7; text-transform:uppercase; letter-spacing:0.06em; }
.ds-root .ds-body { padding:8px 10px 10px; background:var(--ds-paper); }
.ds-root .ds-title { margin:0; font-size:var(--ds-fs-base); font-weight:600; line-height:1.3; color:var(--ds-text); }
.ds-root .ds-note { margin:2px 0 0; font-size:var(--ds-fs-down); line-height:1.4; color:var(--ds-muted); }
.ds-root .ds-empty { position:absolute; left:16%; right:16%; top:36%; margin:0; text-align:center; font-size:var(--ds-fs-base); line-height:1.4; font-weight:600; color:var(--ds-ink-folder); z-index:6; pointer-events:none; }
.ds-root .ds-front { position:absolute; left:0; right:0; top:64%; bottom:0; background:var(--ds-folder); border-radius:var(--ds-r-front) var(--ds-r-front) var(--ds-r) var(--ds-r); box-shadow:0 -8px 22px rgba(15,23,42,0.14); pointer-events:none; z-index:20; }
.ds-root .ds-scene[data-open=true] .ds-front { transform:translateY(3%); }
.ds-root .ds-sticker { position:absolute; right:7%; bottom:8%; padding:6px 12px; border-radius:999px; background:var(--ds-accent); color:var(--ds-ink-accent); font-size:var(--ds-fs-down); font-weight:700; transform:rotate(-4deg); box-shadow:0 6px 16px rgba(0,0,0,0.15); z-index:21; }
.ds-root a.ds-card:focus-visible, .ds-root .ds-scard a:focus-visible { outline:2px solid var(--ds-accent); outline-offset:-2px; }
.ds-root .ds-scene[data-open=false] .ds-card { pointer-events:none; }
.ds-root .ds-scene[data-open=true] .ds-card { pointer-events:auto; }
.ds-root.ds-layers .ds-scard > .ds-item { display:flex !important; flex-direction:column !important; justify-content:flex-start !important; align-items:stretch !important; gap:2px !important; padding:0 0 10px !important; background-color:var(--ds-paper) !important; }
.ds-root.ds-layers .ds-scard > .ds-item.ds-noimg { padding-top:10px !important; }
.ds-root.ds-layers .ds-item .ds-l-image { position:relative !important; flex:1 1 auto !important; width:100% !important; height:auto !important; min-height:0 !important; margin:0 0 6px !important; overflow:hidden !important; border-radius:0 !important; }
.ds-root.ds-layers .ds-item .ds-l-image img { width:100% !important; height:100% !important; object-fit:cover !important; display:block; }
.ds-root.ds-layers .ds-item .ds-l-title, .ds-root.ds-layers .ds-item .ds-l-body { flex:none !important; width:100% !important; margin:0 !important; padding:0 10px !important; box-sizing:border-box !important; }
.ds-root.ds-layers .ds-item .ds-l-title, .ds-root.ds-layers .ds-item .ds-l-title .framer-text { --framer-font-size:var(--ds-fs-base) !important; --framer-font-weight:600 !important; --framer-line-height:1.3 !important; --framer-text-color:var(--ds-text) !important; }
.ds-root.ds-layers .ds-item .ds-l-body, .ds-root.ds-layers .ds-item .ds-l-body .framer-text { --framer-font-size:var(--ds-fs-down) !important; --framer-font-weight:400 !important; --framer-line-height:1.4 !important; --framer-text-color:var(--ds-muted) !important; }
.ds-root.ds-ff.ds-layers .ds-item .ds-l-title, .ds-root.ds-ff.ds-layers .ds-item .ds-l-title .framer-text, .ds-root.ds-ff.ds-layers .ds-item .ds-l-body, .ds-root.ds-ff.ds-layers .ds-item .ds-l-body .framer-text { --framer-font-family:var(--ds-ff) !important; }
@media (prefers-reduced-motion:reduce) { .ds-root .ds-card, .ds-root .ds-front { transition:none !important; } }
`

// Closed: cards rest in the pocket, slightly overlapping. Open: they fan up over the pocket, centre card on top.
// One formula for demo cards, slot hosts before the first scan and our slot card wrappers.
function placeOf(i: number, count: number, open: boolean, spread: number, lift: number): React.CSSProperties {
    const k = i - (Math.max(1, count) - 1) / 2
    return open
        ? { transform: `translate3d(${k * 16}%,-${lift}%,0) rotate(${k * spread}deg)`, zIndex: Math.round(10 - Math.abs(k) * 2) }
        : { transform: `translate3d(0,${62 + i * 3}%,0) rotate(${k * 1.5}deg)`, zIndex: i + 1 }
}

function rootStyleOf(props: Props, colors: Palette): React.CSSProperties {
    const ff = fontFamilyOf(props.font)
    const vars: Record<string, string> = {
        "--ds-folder": cssToken(colors.folder),
        "--ds-tab": cssToken(colors.tab),
        "--ds-paper": cssToken(colors.paper),
        "--ds-accent": cssToken(colors.accent),
        "--ds-text": cssToken(colors.text),
        "--ds-muted": cssToken(colors.muted),
        "--ds-ink-tab": inkOn(colors.tab),
        "--ds-ink-folder": inkOn(colors.folder),
        "--ds-ink-accent": inkOn(colors.accent),
        "--ds-r": props.radius + "px",
        "--ds-r-card": Math.round(props.radius * 0.7) + "px",
        "--ds-r-tab": Math.round(props.radius * 0.6) + "px",
        "--ds-r-front": Math.round(props.radius * 0.9) + "px",
        "--ds-maxw": props.maxWidth > 0 ? props.maxWidth + "px" : "none",
        "--ds-fs-up": step(props.fontSize, 1) + "px",
        "--ds-fs-base": step(props.fontSize, 0) + "px",
        "--ds-fs-down": step(props.fontSize, -1) + "px",
    }
    if (ff) vars["--ds-ff"] = cssToken(ff)
    return { ...(props.style || {}), ...vars } as React.CSSProperties
}
function rootClassOf(props: Props, motion: boolean): string {
    return "ds-root" + (fontFamilyOf(props.font) ? " ds-ff" : "") + (props.styleCmsLayers ? " ds-layers" : "") + (motion ? " ds-motion" : "")
}

function CardFace({ item }: { item: DossierCard }) {
    const src = safeImageUrl(imageOf(item))
    return (
        <>
            <div className="ds-media" style={src ? undefined : { background: blockColor(item.title) }}>
                {src ? <img src={src} alt={item.alt || ""} /> : <Poster title={item.title} />}
            </div>
            {item.title || item.note ? (
                <div className="ds-body">
                    {item.title ? <p className="ds-title">{item.title}</p> : null}
                    {item.note ? <p className="ds-note">{item.note}</p> : null}
                </div>
            ) : null}
        </>
    )
}

/* ------------------------------------------------------------------ *
 * Cards (CMS), read-only (REVIEW-RULES §3, pattern P2). Everything inside the
 * slot wrapper (.ds-src) belongs to Framer and is only READ (children,
 * className, outerHTML, data-framer-name, textContent, tagName). Cards on screen
 * are deep copies this component creates and owns, mounted into its own card
 * wrappers (.ds-scard) inside its own view (.ds-view), a sibling of .ds-src.
 * ------------------------------------------------------------------ */
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect
const FOCUSABLE = "a[href],area[href],button,input,select,textarea,summary,iframe,object,embed,audio[controls],video[controls],[tabindex],[contenteditable]"
type Owned<T> = T & { readonly __owned: true }
type LayerNames = { title: string; body: string; image: string }
type Source = { node: HTMLElement; cms: boolean }

function slotsOf(v: React.ReactNode[] | undefined): React.ReactNode[] {
    return (Array.isArray(v) ? v : []).filter((s) => s !== null && s !== undefined && s !== false)
}

// host > list > item×N with one shared class. The most frequent class among the list's
// children marks the repeated items; anything else (a "Load more" button) is not a card. Read-only.
function detectCmsItems(host: HTMLElement): { kind: "empty" } | { kind: "plain" } | { kind: "cms"; items: HTMLElement[] } {
    const list = host.firstElementChild
    if (!(list instanceof HTMLElement)) return { kind: "empty" }
    const kids = Array.from(list.children).filter((k): k is HTMLElement => k instanceof HTMLElement && k.tagName !== "STYLE" && k.tagName !== "SCRIPT")
    if (kids.length === 0) return { kind: "empty" }
    const counts = new Map<string, number>()
    let best = ""
    let bestCount = 0
    kids.forEach((k) => {
        const n = (counts.get(k.className) || 0) + 1
        counts.set(k.className, n)
        if (n > bestCount) {
            best = k.className
            bestCount = n
        }
    })
    // Text layers sharing a class inside a hand-made card are not a collection (review-wall guard).
    const textGroup = kids.some(
        (k) => k.className === best && (/(^|\s)framer-text(\s|$)/.test(best) || k.getAttribute("data-framer-component-type") === "RichTextContainer")
    )
    if (bestCount < 2 || textGroup) return { kind: "plain" }
    return { kind: "cms", items: kids.filter((k) => k.className === best) }
}
// Card sources in order (first five): Collection List items, or the whole host for a plain frame. Read-only.
function readSources(src: HTMLElement): Source[] {
    const out: Source[] = []
    Array.from(src.children).forEach((host) => {
        if (!(host instanceof HTMLElement)) return
        const found = detectCmsItems(host)
        if (found.kind === "cms") found.items.forEach((node) => out.push({ node, cms: true }))
        // A plain frame: copy the frame itself. Our host carries pre-scan card classes and position, which the
        // card wrapper already provides.
        else if (found.kind === "plain" && host.firstElementChild instanceof HTMLElement) out.push({ node: host.firstElementChild, cms: false })
    })
    return out.slice(0, MAX_CARDS)
}
// First descendant whose layer name equals `name` (case-insensitive). No selector is built from user text. Read-only.
function findLayer(root: HTMLElement, name: string): Element | null {
    if (!name) return null
    return Array.from(root.querySelectorAll("[data-framer-name]")).find((el) => String(el.getAttribute("data-framer-name") || "").trim().toLowerCase() === name) || null
}
const textOf = (el: Element | null): string => (el ? String(el.textContent || "").replace(/\s+/g, " ").trim() : "")
const layerKey = (v: string): string => String(v || "").trim().toLowerCase()

// Deep copy of a slot node. The copy has never been attached anywhere, so it is ours: ids are dropped
// (no duplicate ids on the page), copied videos never autoplay, a CMS item and its named Title/Body/Image
// layers get our classes for the constant stylesheet, and focusable elements remember their own tab index.
function ownClone(source: Source, names: LayerNames, tabs: WeakMap<HTMLElement, number>): Owned<HTMLElement> {
    const copy = source.node.cloneNode(true) as Owned<HTMLElement>
    let hasImage = false
    const seen = { title: false, body: false, image: false }
    const inner = Array.from(copy.querySelectorAll<HTMLElement>("*"))
    ;[copy as HTMLElement, ...inner].forEach((el) => {
        if (el.hasAttribute("id")) el.toggleAttribute("id", false)
        if (el.hasAttribute("autoplay")) el.toggleAttribute("autoplay", false)
        if (source.cms && el !== copy) {
            // Only the first layer of each name is styled, as before.
            const layer = String(el.getAttribute("data-framer-name") || "").trim().toLowerCase()
            let mark = ""
            if (layer && layer === names.title && !seen.title) { seen.title = true; mark = " ds-l-title" }
            else if (layer && layer === names.body && !seen.body) { seen.body = true; mark = " ds-l-body" }
            else if (layer && layer === names.image && !seen.image) { seen.image = true; hasImage = true; mark = " ds-l-image" }
            if (mark) el.className += mark
        }
        if (el.matches(FOCUSABLE)) tabs.set(el, el.tabIndex)
    })
    if (source.cms) copy.className += hasImage ? " ds-item" : " ds-item ds-noimg"
    return copy
}
// Closed folder: every focusable in our copy leaves the Tab order; open: original tab indexes come back.
function syncCopyTabs(copy: Owned<HTMLElement>, shown: boolean, tabs: WeakMap<HTMLElement, number>) {
    const els = Array.from(copy.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (copy.matches(FOCUSABLE)) els.unshift(copy)
    els.forEach((el) => {
        const want = shown ? (tabs.get(el) ?? 0) : -1
        if (el.tabIndex !== want) el.tabIndex = want
    })
}

type Scan = { n: number; titles: string[]; links: boolean[]; version: number }
const SRC_HIDDEN: React.CSSProperties = { visibility: "hidden", opacity: 0, pointerEvents: "none", zIndex: -1 }

type BodyHandlers = {
    onToggle: () => void
    onClose: () => void
    onPointer: (over: boolean) => void
    onFocusWithin: (inside: boolean) => void
}

function Body({
    props,
    colors,
    open,
    live,
    motion,
    cardsId,
    scan,
    srcRef,
    cardRefs,
    btnRef,
    on,
}: {
    props: Props
    colors: Palette
    open: boolean
    live: boolean
    motion: boolean
    cardsId?: string
    scan: Scan | null
    srcRef?: React.RefObject<HTMLDivElement>
    cardRefs?: React.MutableRefObject<(HTMLDivElement | null)[]>
    btnRef?: React.RefObject<HTMLButtonElement>
    on: BodyHandlers
}) {
    // Any slot switches the folder to slot cards; the Cards list is then ignored (never mixed).
    const slots = slotsOf(props.cardSlots)
    const slotMode = slots.length > 0
    const cards = slotMode ? [] : (props.cards || []).slice(0, MAX_CARDS)
    const ready = slotMode && scan !== null
    // Until the first scan (server, first client render, static renderer) one card per slot, so hydration matches.
    const count = slotMode ? Math.min(MAX_CARDS, scan === null ? slots.length : scan.n) : cards.length
    if (!slotMode && !count) {
        return (
            <div className={rootClassOf(props, false)} style={rootStyleOf(props, colors)}>
                <style dangerouslySetInnerHTML={{ __html: DS_CSS }} />
                <p style={{ margin: 0, color: colors.muted, fontSize: props.fontSize }}>{props.emptyText}</p>
            </div>
        )
    }
    const hoverMode = live && props.openOn === "hover"
    const place = (i: number) => placeOf(i, count, open, props.spread, props.lift)
    return (
        <div className={rootClassOf(props, motion)} style={rootStyleOf(props, colors)}>
            <style dangerouslySetInnerHTML={{ __html: DS_CSS }} />
            <div
                className="ds-scene"
                data-open={open ? "true" : "false"}
                onPointerEnter={hoverMode ? () => on.onPointer(true) : undefined}
                onPointerLeave={hoverMode ? () => on.onPointer(false) : undefined}
                // Hover mode tracks focus on the whole scene: moving from the folder button into a card link keeps it open.
                onFocus={hoverMode ? () => on.onFocusWithin(true) : undefined}
                onBlur={
                    hoverMode
                        ? (e) => {
                              const next = e.relatedTarget
                              if (next instanceof Node && e.currentTarget.contains(next)) return
                              on.onFocusWithin(false)
                          }
                        : undefined
                }
                onKeyDown={
                    live
                        ? (e) => {
                              if (e.key === "Escape" && open) {
                                  e.preventDefault()
                                  on.onClose()
                                  // Focus inside a card that is about to leave the tab order goes back to our folder button.
                                  const btn = btnRef ? btnRef.current : null
                                  if (btn && e.target !== btn) btn.focus()
                              }
                          }
                        : undefined
                }
            >
                <div className="ds-back" aria-hidden="true" />
                <div className="ds-tab" aria-hidden="true">
                    {props.label}
                </div>
                {/* The folder itself is the button: the keyboard opens and closes it. Card links join the Tab order only when open. */}
                {live ? (
                    <button
                        ref={btnRef}
                        type="button"
                        className="ds-btn"
                        aria-expanded={open}
                        aria-controls={cardsId}
                        aria-label={open ? props.closeLabel : props.openLabel}
                        onClick={on.onToggle}
                    />
                ) : null}
                <div className="ds-cards" id={cardsId} aria-hidden={open ? undefined : "true"}>
                    {slotMode ? (
                        <>
                            {/* Our slot wrapper: only its own style changes (hidden once copies are shown); its inside is read-only. */}
                            <div ref={srcRef} className="ds-src" aria-hidden={ready || undefined} style={ready ? SRC_HIDDEN : undefined}>
                                {slots.map((slot, i) => (
                                    <div key={i} className="ds-slot ds-card" style={ready ? undefined : place(Math.min(i, MAX_CARDS - 1))}>
                                        {slot}
                                    </div>
                                ))}
                            </div>
                            {/* Our view: card wrappers rendered by React, each holding one copy we own. */}
                            <div className="ds-view" data-ds-owned="">
                                {ready && cardRefs
                                    ? Array.from({ length: count }, (_, i) => {
                                          const title = scan ? scan.titles[i] : ""
                                          const isLink = scan ? scan.links[i] : false
                                          return (
                                              <div
                                                  key={i}
                                                  ref={(el) => {
                                                      cardRefs.current[i] = el
                                                  }}
                                                  className={"ds-card ds-scard ds-c" + i}
                                                  style={place(i)}
                                                  aria-hidden={open ? undefined : "true"}
                                                  role={isLink ? undefined : "group"}
                                                  aria-label={isLink ? undefined : title || undefined}
                                              />
                                          )
                                      })
                                    : null}
                            </div>
                        </>
                    ) : (
                        cards.map((item, i) => {
                            const href = safeHref(linkOf(item))
                            const cls = `ds-card ds-c${i}`
                            return href ? (
                                <a key={i} className={cls} style={place(i)} href={href} tabIndex={open && live ? 0 : -1} aria-label={item.title || undefined}>
                                    <CardFace item={item} />
                                </a>
                            ) : (
                                <div key={i} className={cls} style={place(i)}>
                                    <CardFace item={item} />
                                </div>
                            )
                        })
                    )}
                </div>
                {slotMode && count === 0 ? <p className="ds-empty">{props.emptyText}</p> : null}
                <div className="ds-front" aria-hidden="true" />
                {props.pocketTitle || props.pocketMeta ? (
                    <div className="ds-pocket" aria-hidden="true">
                        {props.pocketTitle ? <p className="ds-pocket-title">{props.pocketTitle}</p> : <span />}
                        {props.pocketMeta ? <p className="ds-pocket-meta">{props.pocketMeta}</p> : null}
                    </div>
                ) : null}
                {props.sticker ? (
                    <div className="ds-sticker" aria-hidden="true">
                        {props.sticker}
                    </div>
                ) : null}
            </div>
        </div>
    )
}

const NOOP: BodyHandlers = { onToggle: () => undefined, onClose: () => undefined, onPointer: () => undefined, onFocusWithin: () => undefined }

// Static renderer: no listeners, no transitions, no DOM work. Drawn open so the cards can be tuned on the canvas.
function StaticDossier(props: Props) {
    return <Body props={props} colors={paletteOf(props)} open live={false} motion={false} scan={null} on={NOOP} />
}

function LiveDossier(props: Props) {
    const reduce = useReduce()
    const [open, setOpen] = useState(props.startOpen)
    const [over, setOver] = useState(false)
    const [focusIn, setFocusIn] = useState(false)
    // After Escape, hover does not reopen the folder until the cursor and focus have left it.
    const [held, setHeld] = useState(false)
    const [scan, setScan] = useState<Scan | null>(null)
    const cardsId = "ds-cards-" + useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const srcRef = useRef<HTMLDivElement>(null)
    const btnRef = useRef<HTMLButtonElement>(null)
    // Internal bookkeeping only (REVIEW-RULES R3): source node → its copy, copies in card order, copy tab indexes.
    const cache = useRef(new Map<HTMLElement, { html: string; copy: Owned<HTMLElement> }>())
    const copies = useRef<Owned<HTMLElement>[]>([])
    const copyTabs = useRef(new WeakMap<HTMLElement, number>())
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])
    const onToggle = useCallback(() => {
        setHeld(false)
        setOpen((o) => !o)
    }, [])
    const onPointer = useCallback((v: boolean) => {
        setOver(v)
        if (!v) setHeld(false)
    }, [])
    const onFocusWithin = useCallback((v: boolean) => {
        setFocusIn(v)
        if (!v) setHeld(false)
    }, [])
    const onClose = useCallback(() => {
        setOpen(false)
        setHeld(true)
    }, [])
    const shown = open || (props.openOn === "hover" && (over || focusIn) && !held)
    const slotMode = slotsOf(props.cardSlots).length > 0
    const names: LayerNames = { title: layerKey(props.titleLayer), body: layerKey(props.bodyLayer), image: layerKey(props.imageLayer) }

    // Slot cards: read the slot wrapper (never write inside it), copy each card source into our own nodes,
    // and watch only the slot wrapper for Collection List changes (Load more, CMS swaps, text edits).
    useIsoLayoutEffect(() => {
        const src = srcRef.current
        if (!slotMode || !src) {
            setScan(null)
            return
        }
        const rescan = () => {
            const sources = readSources(src)
            const next = new Map<HTMLElement, { html: string; copy: Owned<HTMLElement> }>()
            let changed = sources.length !== copies.current.length
            const out = sources.map((source, i) => {
                const html = source.node.outerHTML
                const hit = cache.current.get(source.node)
                const copy = hit && hit.html === html ? hit.copy : ownClone(source, names, copyTabs.current)
                next.set(source.node, { html, copy })
                if (copy !== copies.current[i]) changed = true
                return copy
            })
            cache.current = next
            copies.current = out
            const titles = sources.map((source) => textOf(findLayer(source.node, names.title)).slice(0, 120))
            const links = sources.map((source) => source.node.tagName === "A")
            setScan((prev) =>
                prev && !changed && prev.titles.join("\u0000") === titles.join("\u0000")
                    ? prev
                    : { n: out.length, titles, links, version: (prev ? prev.version : 0) + 1 }
            )
        }
        rescan()
        const observer = typeof MutationObserver === "function" ? batchedObserver(rescan) : null
        observer?.observe(src, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["src", "srcset", "href", "poster"] })
        return () => {
            observer?.disconnect()
            cache.current = new Map()
            copies.current = []
        }
    }, [slotMode, names.title, names.body, names.image])
    // Mount each copy into its (empty, React-rendered) card wrapper; closed folder = copies out of the Tab order.
    useIsoLayoutEffect(() => {
        if (!slotMode || scan === null) return
        copies.current.forEach((copy, i) => {
            const wrap = cardRefs.current[i]
            if (wrap && (wrap.firstChild !== copy || wrap.childNodes.length !== 1)) wrap.replaceChildren(copy)
            syncCopyTabs(copy, shown, copyTabs.current)
        })
    })
    return (
        <Body
            props={props}
            colors={paletteOf(props)}
            open={shown}
            live
            motion={!reduce}
            cardsId={cardsId}
            scan={slotMode ? scan : null}
            srcRef={srcRef}
            cardRefs={cardRefs}
            btnRef={btnRef}
            on={{ onToggle, onClose, onPointer, onFocusWithin }}
        />
    )
}


// 이미지가 없는 카드의 앞면: 자작 포스터(문서·차트·달력 3종, 제목 해시로 결정). 장식이므로 aria-hidden.
function Poster({ title }: { title?: string }) {
    const s = (title || "?").trim()
    let h = 0
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997
    const kind = h % 3
    const ink = "rgba(17,24,39,0.42)"
    const soft = "rgba(17,24,39,0.16)"
    const bars = [62, 44, 78, 52, 70]
    return (
        <svg className="ds-poster" viewBox="0 0 120 80" aria-hidden="true" focusable="false">
            <rect x="12" y="10" width="96" height="60" rx="6" fill="rgba(255,255,255,0.55)" />
            {kind === 0 ? (
                <g>
                    <rect x="22" y="20" width="12" height="12" rx="3" fill={ink} />
                    <rect x="40" y="22" width="46" height="4" rx="2" fill={ink} />
                    <rect x="40" y="30" width="30" height="3" rx="1.5" fill={soft} />
                    <rect x="22" y="42" width="76" height="3" rx="1.5" fill={soft} />
                    <rect x="22" y="50" width="64" height="3" rx="1.5" fill={soft} />
                    <rect x="22" y="58" width="40" height="3" rx="1.5" fill={soft} />
                </g>
            ) : kind === 1 ? (
                <g>
                    <rect x="22" y="18" width="40" height="4" rx="2" fill={ink} />
                    {bars.map((b, i) => (
                        <rect key={i} x={22 + i * 15} y={64 - b * 0.45} width="10" height={b * 0.45} rx="2" fill={i === 2 ? ink : soft} />
                    ))}
                </g>
            ) : (
                <g>
                    <rect x="22" y="18" width="76" height="8" rx="2" fill={ink} />
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <rect key={i} x={22 + (i % 4) * 19} y={32 + Math.floor(i / 4) * 16} width="14" height="10" rx="2" fill={i === 5 ? ink : soft} />
                    ))}
                </g>
            )}
        </svg>
    )
}

const DEMO: DossierCard[] = [
    { title: "Placement test", note: "30 minutes · free" },
    { title: "Reading lab", note: "Three sessions a week" },
    { title: "Term report", note: "What changed, in one page" },
]

// defaultProps 대신: 컨트롤 defaultValue 와 같은 값을 빠진 prop 에만 채운다.
const DEFAULTS: Props = {
    cards: DEMO,
    cardSlots: [],
    titleLayer: "Title",
    bodyLayer: "Body",
    imageLayer: "Image",
    styleCmsLayers: true,
    label: "Autumn term",
    sticker: "New",
    pocketTitle: "Everything for the term",
    pocketMeta: "3 cards inside",
    openOn: "hover",
    startOpen: false,
    spread: 9,
    lift: 28,
    radius: 16,
    maxWidth: 560,
    openLabel: "Open the folder",
    closeLabel: "Close the folder",
    emptyText: "Add a card to fill the folder.",
    fontSize: 14,
    folder: "#FBBF24",
    tab: "#F59E0B",
    paper: "#FFFFFF",
    accent: "#2563EB",
    text: "#111827",
    muted: "#5F6B7A",
}

function withDefaults(p: Partial<Props>): Props {
    const out: Record<string, unknown> = { ...DEFAULTS }
    Object.keys(p).forEach((k) => {
        const v = (p as Record<string, unknown>)[k]
        if (v !== undefined) out[k] = v
    })
    return out as Props
}

/**
 * AisolDossier
 * A folder that opens on hover, focus or click and fans out the cards inside —
 * up to five, each with an image, a note and a link. Drop a Collection List into
 * "Cards (CMS)" and each CMS item becomes a card. Keyboard opens and closes it
 * (Enter, Space, Escape); cards leave the tab order while the folder is closed;
 * reduced motion skips the transition; the canvas shows the folder open.
 *
 * R5 근거: 클러스터 5(폴더 열림) — Confidential Folder #4 $5(likes 1,126) · Media Folder #5 $12 · Flip Book 3D CMS #92 $8. 무료(설치 신호용).
 *
 * @framerIntrinsicWidth 520
 * @framerIntrinsicHeight 520
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */

// One rescan per animation frame, however many DOM changes arrive at once (CMS loads, Load more, text edits),
// instead of a full rescan for every mutation record. In a hidden tab (no frames) it falls back to a 100 ms
// timer. Disconnecting also cancels a pending run.
function batchedObserver(cb: () => void, relevant?: (records: MutationRecord[]) => boolean): MutationObserver {
    let frame = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    const fire = () => {
        frame = 0
        timer = undefined
        cb()
    }
    const mo = new MutationObserver((records) => {
        if (frame || timer !== undefined || (relevant && !relevant(records))) return
        if (typeof requestAnimationFrame === "function" && !document.hidden) frame = requestAnimationFrame(fire)
        else timer = setTimeout(fire, 100)
    })
    const stop = mo.disconnect.bind(mo)
    mo.disconnect = () => {
        if (frame) cancelAnimationFrame(frame)
        if (timer !== undefined) clearTimeout(timer)
        frame = 0
        timer = undefined
        stop()
    }
    return mo
}

export default function AisolDossier(rawProps: Partial<Props>) {
    const props = withDefaults(rawProps)
    const isStatic = useIsStaticRenderer()
    return isStatic ? <StaticDossier {...props} /> : <LiveDossier {...props} />
}

addPropertyControls(AisolDossier, {
    cardSlots: {
        type: ControlType.Array,
        title: "Cards (CMS)",
        maxCount: MAX_CARDS,
        control: { type: ControlType.ComponentInstance },
        defaultValue: [],
        description: "Drop a Collection List here. Each item becomes a card (first five). A frame placed here is one card; give it a height of 100%. Anything here replaces the Cards list.",
    },
    titleLayer: { type: ControlType.String, title: "Title Layer", defaultValue: "Title", description: "Layer name inside each CMS item used as the card title and its screen reader name. Case does not matter." },
    bodyLayer: { type: ControlType.String, title: "Body Layer", defaultValue: "Body", description: "Layer name inside each CMS item used as the card note." },
    imageLayer: { type: ControlType.String, title: "Image Layer", defaultValue: "Image", description: "Layer name inside each CMS item that fills the top of the card." },
    styleCmsLayers: {
        type: ControlType.Boolean,
        title: "Style CMS Layers",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "On: CMS items get the folder card look (Paper fill, image on top, title and note text styles). Off: CMS items keep your own design.",
    },
    cards: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: MAX_CARDS,
        defaultValue: DEMO,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "Card", description: "Card heading. Also the link name for screen readers." },
                note: { type: ControlType.String, title: "Note", defaultValue: "", description: "Short line under the title." },
                image: { type: ControlType.ResponsiveImage, title: "Image", description: "Card picture. Without one the card gets a drawn poster." },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL (legacy)",
                    defaultValue: "",
                    description: "Older fallback, used only when Image is empty. Clear it to hide this field.",
                    hidden: (p: DossierCard) => !p.imageUrl,
                },
                alt: { type: ControlType.String, title: "Image alt", defaultValue: "", description: "Describes the picture for screen readers. Leave empty for a decorative image." },
                link: { type: ControlType.Link, title: "Link", description: "Optional. The card becomes a link, for example to a CMS page." },
                linkUrl: {
                    type: ControlType.String,
                    title: "Link URL (legacy)",
                    defaultValue: "",
                    description: "Older fallback, used only when Link is empty. Clear it to hide this field.",
                    hidden: (p: DossierCard) => !p.linkUrl,
                },
            },
        },
        description: "Hand-made cards, up to five. Used only while Cards (CMS) is empty.",
    },
    label: { type: ControlType.String, title: "Tab label", defaultValue: "Autumn term", description: "Text on the folder tab." },
    sticker: { type: ControlType.String, title: "Sticker", defaultValue: "New", description: "Round label on the folder front. Leave empty to hide." },
    pocketTitle: { type: ControlType.String, title: "Pocket title", defaultValue: "Everything for the term", description: "Large text on the folder pocket." },
    pocketMeta: { type: ControlType.String, title: "Pocket meta", defaultValue: "3 cards inside", description: "Small line under the pocket title." },
    openOn: {
        type: ControlType.Enum,
        title: "Opens on",
        options: ["hover", "click"],
        optionTitles: ["Hover or focus", "Click only"],
        defaultValue: "hover",
        description: "Hover or focus opens and closes with the cursor or keyboard focus; Click only waits for a click, Enter or Space. Escape closes either way.",
    },
    startOpen: { type: ControlType.Boolean, title: "Start open", defaultValue: false, description: "Show the folder already open when the page loads." },
    spread: { type: ControlType.Number, title: "Spread", defaultValue: 9, min: 0, max: 18, step: 1, unit: "°", description: "Rotation between neighbouring cards in the open fan." },
    lift: { type: ControlType.Number, title: "Lift", defaultValue: 28, min: 0, max: 50, step: 2, unit: "%", description: "How far the cards rise out of the pocket when open, in percent of card height." },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 16, min: 0, max: 32, step: 2, description: "Corner radius of the folder. Cards use a slightly smaller radius." },
    maxWidth: { type: ControlType.Number, title: "Max width", defaultValue: 560, min: 0, max: 1200, step: 10, unit: "px", description: "0 = no cap. Keeps the folder square inside wide frames." },
    openLabel: { type: ControlType.String, title: "Open label", defaultValue: "Open the folder", description: "Screen reader name of the folder button while closed." },
    closeLabel: { type: ControlType.String, title: "Close label", defaultValue: "Close the folder", description: "Screen reader name of the folder button while open." },
    emptyText: { type: ControlType.String, title: "Empty text", defaultValue: "Add a card to fill the folder.", description: "Shown when there are no cards, for example an empty collection." },
    font: { type: ControlType.Font, title: "Font", controls: "basic", description: "Font for the folder and card text. Empty keeps the page font." },
    fontSize: { type: ControlType.Number, title: "Text size", defaultValue: 14, min: 11, max: 20, step: 1, description: "Base text size. Titles and small labels scale from it." },
    folder: { type: ControlType.Color, title: "Folder", defaultValue: "#FBBF24", description: "Folder body and pocket colour." },
    tab: { type: ControlType.Color, title: "Tab", defaultValue: "#F59E0B", description: "Folder tab colour." },
    paper: { type: ControlType.Color, title: "Paper", defaultValue: "#FFFFFF", description: "Card fill. CMS items use it when Style CMS Layers is on." },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#2563EB", description: "Sticker fill and focus ring." },
    text: { type: ControlType.Color, title: "Text", defaultValue: "#111827", description: "Card title colour." },
    muted: { type: ControlType.Color, title: "Muted", defaultValue: "#5F6B7A", description: "Card note colour, and the empty text when the Cards list is empty." },
})
