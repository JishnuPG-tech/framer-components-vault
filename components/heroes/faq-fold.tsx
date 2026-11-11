// build: RO-faq-fold (2026-10-02) — read-only Panels (CMS): questions read as text into our own buttons, answers copied into our own panels
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

import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, MutableRefObject, ReactNode } from "react"

// Show more a11y (WAI disclosure + status pattern): the button reports aria-expanded (extra items shown or not) and
// aria-controls (our own list container, id from useId); a visually hidden polite live region of ours announces each reveal.
const SHOW_MORE_SR = { position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 } as const
function showMoreNote(added: number, shown: number, total: number): string {
    return `${added} more ${added === 1 ? "item" : "items"} shown (${shown} of ${total})`
}

/**
 * FaqAccordion
 * A clean FAQ list that smoothly expands one answer at a time. Questions come from the
 * Items list, or from a Collection List dropped into Panels (CMS): each CMS item becomes
 * one question, its Question layer is the header and the rest of the item opens as the answer.
 *
 * @framerIntrinsicWidth 520
 * @framerIntrinsicHeight 300
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
type ColorValue = string | { value?: string }
type ControlProps = Record<string, unknown>
type Item = { question?: string; answer?: string }
type HeadingTag = "h2" | "h3" | "h4"

type Props = {
    items: Item[]
    accentColor: ColorValue
    background: ColorValue
    textColor: ColorValue
    mutedColor: ColorValue
    radius: number
    gap: number
    allowMultiple: boolean
    fontSize: number
    font?: { fontFamily?: string }
    // merge-g2 additions (absorbed from Aisol Accordion)
    contentMode: string
    panels: ReactNode[]
    layout: string
    iconStyle: string
    railColor: ColorValue
    defaultOpen: number
    canvasOpen: number
    urlSync: string
    paramName: string
    allOpenDesktop: boolean
    mobileUnder: number
    // CMSFIX additions
    questionLayer: string
    answerLayer: string
    wholeItem: boolean
    styleCmsLayers: boolean
    emptyText: string
    initialCount: number
    showMoreLabel: string
    headingLevel: string
    style?: CSSProperties
}

// One FAQ row. text = typed item with a text answer; react = our header + a plain slot as the
// answer (legacy "panel i belongs to item i"); dom = a CMS item or a plain frame unwrapped in place.
type RowKind = "text" | "react" | "dom"
type URow = { kind: RowKind; question: string; answer: string; slot: number; slug: string }
type HostKind = "flat" | "react"

const FALLBACK_ITEMS: Item[] = [
    { question: "What is included?", answer: "Everything you need to launch, ready to customize." },
    { question: "Can I cancel anytime?", answer: "Yes — no contracts, cancel with one click." },
]

const DEMO_ITEMS: Item[] = [
    { question: "How does billing work?", answer: "Billed monthly or yearly. Switch or cancel anytime from your dashboard." },
    { question: "Is there a free trial?", answer: "Yes — 14 days, no credit card required." },
    { question: "Do you offer support?", answer: "Email support on all plans, priority support on Pro." },
]

const DEFAULTS: Props = {
    items: DEMO_ITEMS,
    accentColor: "#6D5EF6",
    background: "#111116",
    textColor: "#F5F5F7",
    mutedColor: "#9A9AA5",
    radius: 14,
    gap: 10,
    allowMultiple: false,
    fontSize: 16,
    font: { fontFamily: "Inter, system-ui, -apple-system, sans-serif" },
    contentMode: "slots",
    panels: [],
    layout: "cards",
    iconStyle: "plus",
    railColor: "rgba(255, 255, 255, 0.08)",
    defaultOpen: 0,
    canvasOpen: 0,
    urlSync: "off",
    paramName: "faq",
    allOpenDesktop: false,
    mobileUnder: 810,
    questionLayer: "Question",
    answerLayer: "Answer",
    wholeItem: false,
    styleCmsLayers: true,
    emptyText: "No questions yet.",
    initialCount: 0,
    showMoreLabel: "Show more",
    headingLevel: "h3",
}

// Undefined props fall back to defaults (existing instances do not carry the new keys).
function resolve(props: Partial<Props>): Props {
    const out: Record<string, unknown> = { ...DEFAULTS }
    for (const [k, v] of Object.entries(props)) if (v !== undefined) out[k] = v
    return out as Props
}

// ControlType.Color 토큰 언랩 — framerlabs SKILL.md Pitfalls
const tok = (v?: ColorValue): string => (!v ? "" : typeof v === "string" ? v : v.value || "")

// 커스텀 프로퍼티 값 가드: 선언 구분자·중괄호·꺾쇠·주석 시작 제거
const cssToken = (v: string): string => String(v || "").replace(/[;{}<>\\]|\/\*|\*\//g, "").slice(0, 200)
const normalize = (v: string): string => String(v || "").trim().toLowerCase()
const collapse = (v: string): string => String(v || "").replace(/\s+/g, " ").trim()

function fontFamilyOf(f?: { fontFamily?: string }): string {
    return (f && f.fontFamily) || "Inter, system-ui, -apple-system, sans-serif"
}

function headingTag(v: string): HeadingTag {
    return v === "h2" || v === "h4" ? v : "h3"
}

function slugify(text: string, fallback: string): string {
    const base = (text || "")
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 48)
    return base || fallback
}

function withSlugs(list: Omit<URow, "slug">[]): URow[] {
    const used = new Set<string>()
    return list.map((row, i) => {
        let slug = slugify(row.question, `q-${i + 1}`)
        let n = 2
        while (used.has(slug)) slug = `${slug}-${n++}`
        used.add(slug)
        return { ...row, slug }
    })
}

function sameItems(a: Item[], b: Item[]): boolean {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i += 1) {
        const x = a[i] || {}
        if ((x.question || "") !== (b[i].question || "") || (x.answer || "") !== (b[i].answer || "")) return false
    }
    return true
}

// Items typed by the user (not the untouched demo). Only these pair with plain slots or add rows
// next to slots; the demo list never mixes with slot rows.
function legacyItems(items: Item[] | undefined): Item[] {
    const list = Array.isArray(items) ? items : []
    if (!list.length || sameItems(list, DEMO_ITEMS) || sameItems(list, FALLBACK_ITEMS)) return []
    return list
}

function textRow(item: Item | undefined, slot: number): Omit<URow, "slug"> {
    return { kind: "text", question: String((item && item.question) || ""), answer: String((item && item.answer) || ""), slot }
}

// Text mode (no slots): the original rows.
function textRows(items: Item[] | undefined): URow[] {
    const list = Array.isArray(items) && items.length ? items : FALLBACK_ITEMS
    return withSlugs(list.map((item) => textRow(item, -1)))
}

// Before the slots are read (server, first client render, static canvas): every slot is treated as a
// plain frame. With typed Items, slot i is the answer of item i (the original Section slots
// behaviour); without them the slots show as they are until the live scan unwraps them.
function preRows(slotCount: number, legacy: Item[]): URow[] {
    const list: Omit<URow, "slug">[] = []
    for (let s = 0; s < Math.min(slotCount, legacy.length); s += 1) list.push({ kind: "react", question: String(legacy[s].question || ""), answer: "", slot: s })
    for (let i = slotCount; i < legacy.length; i += 1) list.push(textRow(legacy[i], -1))
    return withSlugs(list)
}

function preHostKinds(slotCount: number, legacy: Item[]): HostKind[] {
    return Array.from({ length: slotCount }, (_, s) => (s < legacy.length ? "react" : "flat"))
}

function slotsOf(p: Props): ReactNode[] {
    if (p.contentMode === "text") return []
    const out: ReactNode[] = []
    const src = Array.isArray(p.panels) ? p.panels : []
    for (let i = 0; i < src.length; i += 1) {
        const s = src[i]
        if (s !== null && s !== undefined && typeof s !== "boolean") out.push(s)
    }
    return out
}

// ---------------------------------------------------------------- CSS (R8: 보간 없는 모듈 상수)
// 고정 클래스 .ff-root. 모든 설정값은 루트 inline style 의 커스텀 프로퍼티(--ff-*)로만 들어온다.
// `>` · `&` · 따옴표 없음(React 18 SSR 이 <style> 텍스트를 이스케이프한다).
// 슬롯 안쪽을 겨냥한 규칙은 없다. CMS 답 서식 규칙(.ff-cl …)은 우리가 만든 복제본에만 닿는다.
const BASE_CSS =
    ".ff-root{display:flex;flex-direction:column;gap:var(--ff-gap);width:100%;height:100%;box-sizing:border-box;font-family:var(--ff-font)}" +
    ".ff-root .ff-item{background:var(--ff-bg);border:1px solid var(--ff-rail);border-radius:var(--ff-radius);overflow:hidden}" +
    ".ff-root .ff-open{border-color:var(--ff-open-border)}" +
    ".ff-root.ff-lines .ff-item{background:transparent;border-width:0 0 1px 0;border-radius:0}" +
    ".ff-root.ff-lines .ff-open{border-color:var(--ff-rail)}" +
    ".ff-root .ff-h{margin:0;font-size:inherit;font-weight:inherit}" +
    ".ff-root .ff-btn{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:16px;width:100%;padding:18px 20px;cursor:pointer;font-size:var(--ff-fs);font-weight:600;color:var(--ff-text);text-align:left;overflow-wrap:anywhere}" +
    ".ff-root .ff-btn:focus-visible{outline:2px solid var(--ff-accent);outline-offset:-2px;border-radius:var(--ff-radius)}" +
    ".ff-root.ff-lines .ff-btn{padding:18px 2px}" +
    ".ff-root .ff-locked{cursor:default}" +
    ".ff-root .ff-ic{flex-shrink:0;width:20px;height:20px;position:relative;color:var(--ff-accent)}" +
    ".ff-root .ff-bar{position:absolute;background:currentColor;border-radius:2px}" +
    ".ff-root .ff-bh{top:50%;left:0;width:100%;height:2px;transform:translateY(-50%)}" +
    ".ff-root .ff-bv{left:50%;top:0;height:100%;width:2px;transform:translateX(-50%)}" +
    ".ff-root .ff-open .ff-ic-plus{transform:rotate(45deg)}" +
    ".ff-root .ff-open .ff-ic-chevron{transform:rotate(180deg)}" +
    ".ff-root .ff-chev{display:block;width:20px;height:20px}" +
    ".ff-root .ff-panel{display:grid;grid-template-rows:0fr;opacity:0;visibility:hidden}" +
    ".ff-root .ff-open .ff-panel{grid-template-rows:1fr;opacity:1;visibility:visible}" +
    ".ff-root .ff-clip{overflow:hidden;min-height:0}" +
    ".ff-root .ff-ans{padding:0 20px 18px;font-size:var(--ff-afs);line-height:1.6;color:var(--ff-muted)}" +
    ".ff-root.ff-lines .ff-ans{padding:0 2px 18px}" +
    ".ff-root .ff-slot{padding:0 20px 18px}" +
    ".ff-root.ff-lines .ff-slot{padding:0 2px 18px}" +
    // Panels (CMS): our track lists the slot boxes and our rows in slot order, so reading and Tab order match the view.
    ".ff-root .ff-track{display:flex;flex-direction:column;gap:var(--ff-gap);width:100%;min-width:0}" +
    ".ff-root .ff-flat{display:contents}" +
    ".ff-root .ff-host{min-width:0}" +
    // A slot that was read into rows: its box (ours) is hidden by its own className.
    ".ff-root .ff-src-off{display:none}" +
    // Show more (R26): our button, existing variables only.
    ".ff-root .ff-more{all:unset;box-sizing:border-box;align-self:center;min-height:44px;padding:10px 22px;border:1px solid var(--ff-rail);border-radius:var(--ff-radius);background:var(--ff-bg);color:var(--ff-accent);font-size:var(--ff-afs);font-weight:600;cursor:pointer;text-align:center}" +
    ".ff-root .ff-more:focus-visible{outline:2px solid var(--ff-accent);outline-offset:2px}" +
    ".ff-root .ff-empty{margin:0;padding:18px 20px;font-size:var(--ff-afs);line-height:1.6;color:var(--ff-muted)}" +
    // CMS answers are our own copies of the Answer layer (P2 for the answer only). Style CMS layers On:
    // the copies take the answer colour, size and font of this component.
    ".ff-root .ff-cl{display:flex;flex-direction:column;gap:8px}" +
    // Copies of fixed-width layers fill the panel (direct children of our box, written without a child combinator).
    ".ff-root.ff-cms-style .ff-cl *:not(.ff-cl * *){width:auto !important;max-width:100%;align-self:stretch}" +
    ".ff-root.ff-cms-style .ff-cl,.ff-root.ff-cms-style .ff-cl .framer-text{--framer-text-color:var(--ff-muted);--framer-font-size:var(--ff-afs);--framer-font-weight:400;--framer-line-height:1.6;--framer-font-family:var(--ff-font);color:var(--ff-muted)}"

// Live-only motion. Not applied for reduced-motion visitors (media query).
const LIVE_CSS =
    BASE_CSS +
    "@media (prefers-reduced-motion:no-preference){" +
    ".ff-root .ff-item{transition:border-color .25s ease}" +
    ".ff-root .ff-ic{transition:transform .25s ease}" +
    ".ff-root .ff-panel{transition:grid-template-rows .3s cubic-bezier(0.4,0,0.2,1),opacity .3s cubic-bezier(0.4,0,0.2,1),visibility 0s linear .3s}" +
    ".ff-root .ff-open .ff-panel{transition:grid-template-rows .3s cubic-bezier(0.4,0,0.2,1),opacity .3s cubic-bezier(0.4,0,0.2,1),visibility 0s linear 0s}" +
    "}"

function cssVars(p: Props): Record<string, string> {
    const fs = Math.max(10, Math.min(32, Number(p.fontSize) || 16))
    return {
        "--ff-gap": `${Math.max(0, Math.min(40, Number(p.gap) || 0))}px`,
        "--ff-radius": `${Math.max(0, Math.min(40, Number(p.radius) || 0))}px`,
        "--ff-fs": `${fs}px`,
        "--ff-afs": `${fs - 1}px`,
        "--ff-font": cssToken(fontFamilyOf(p.font)),
        "--ff-accent": cssToken(tok(p.accentColor)),
        "--ff-bg": cssToken(tok(p.background)),
        "--ff-text": cssToken(tok(p.textColor)),
        "--ff-muted": cssToken(tok(p.mutedColor)),
        "--ff-rail": cssToken(tok(p.railColor)),
        // 기존 모양 유지: 열린 카드 테두리 = 강조색 40%(구 accent+"66"). color-mix 는 rgb()·hex 모두 받는다.
        "--ff-open-border": `color-mix(in srgb, ${cssToken(tok(p.accentColor))} 40%, transparent)`,
    }
}

function rootClass(p: Props): string {
    let c = "ff-root"
    if (p.layout === "lines") c += " ff-lines"
    if (p.styleCmsLayers !== false) c += " ff-cms-style"
    if (p.iconStyle === "chevron") c += " ff-chevron"
    return c
}

// ---------------------------------------------------------------- CMS slot reading (live only, read-only)
// REVIEW-RULES R2/R3: nothing inside a slot is written, moved or re-classed. The question is read as text;
// the answer is copied (cloneNode) into this component's own panel, and only the copy is ever changed.
function layerName(el: Element): string {
    return normalize(String(el.getAttribute("data-framer-name") || ""))
}

// First descendant whose layer name matches (case-insensitive). Missing layer = null, not an error.
function findLayer(item: HTMLElement, name: string): HTMLElement | null {
    const want = normalize(name)
    if (!want) return null
    const all = item.querySelectorAll("[data-framer-name]")
    for (let i = 0; i < all.length; i += 1) {
        const el = all[i]
        if (el instanceof HTMLElement && layerName(el) === want) return el
    }
    return null
}

function isContentEl(el: Element): el is HTMLElement {
    const t = el.tagName
    return el instanceof HTMLElement && t !== "STYLE" && t !== "SCRIPT" && t !== "TEMPLATE"
}

// Question fallback when no Question layer exists: the first text block outside the answer.
function firstTextEl(item: HTMLElement, exclude: HTMLElement | null): HTMLElement | null {
    const blocks = item.querySelectorAll("h1, h2, h3, h4, h5, h6, p")
    for (let i = 0; i < blocks.length; i += 1) {
        const b = blocks[i]
        if (!(b instanceof HTMLElement) || (exclude && exclude.contains(b))) continue
        if (!collapse(String(b.textContent || ""))) continue
        const rt = b.closest("[data-framer-component-type=RichTextContainer]")
        return rt instanceof HTMLElement && rt !== item && item.contains(rt) ? rt : b
    }
    return null
}

// Everything next to `start` on the way up to `stop` (exclusive): "the rest of the item".
function siblingsUpTo(start: Element, stop: Element): HTMLElement[] {
    const out: HTMLElement[] = []
    let node: Element = start
    while (node !== stop) {
        const parent: HTMLElement | null = node.parentElement
        if (!parent) break
        for (let i = 0; i < parent.children.length; i += 1) {
            const c = parent.children[i]
            if (c !== node && isContentEl(c)) out.push(c)
        }
        if (parent === stop) break
        node = parent
    }
    return out
}

interface HostSplit {
    cms: boolean
    list: HTMLElement | null
    items: HTMLElement[]
    extras: HTMLElement[]
}

// Pattern §2: the slot's first child is a Collection List when its direct children contain a
// repeated, non-empty className group of two or more. Other children (Load more) are extras.
// A first child with no children and no text is an empty collection: zero rows.
function detectCmsItems(host: HTMLElement): HostSplit {
    const first = host.firstElementChild
    if (!first || !isContentEl(first)) return { cms: false, list: null, items: [], extras: [] }
    const kids: HTMLElement[] = []
    for (let i = 0; i < first.children.length; i += 1) {
        const k = first.children[i]
        if (isContentEl(k)) kids.push(k)
    }
    if (kids.length === 0 && !collapse(String(first.textContent || ""))) return { cms: true, list: first, items: [], extras: [] }
    const count: Record<string, number> = {}
    let best = ""
    let bestN = 0
    for (let i = 0; i < kids.length; i += 1) {
        const cls = String(kids[i].getAttribute("class") || "")
        const n = (count[cls] = (count[cls] || 0) + 1)
        if (n > bestN) {
            best = cls
            bestN = n
        }
    }
    // An empty className is never a repeated item class (Framer gives every layer its own class).
    if (kids.length >= 2 && bestN >= 2 && best.trim() !== "") {
        const items: HTMLElement[] = []
        const extras: HTMLElement[] = []
        for (let i = 0; i < kids.length; i += 1) {
            if (String(kids[i].getAttribute("class") || "") === best) items.push(kids[i])
            else extras.push(kids[i])
        }
        return { cms: true, list: first, items, extras }
    }
    return { cms: false, list: first, items: [first], extras: [] }
}

// One CMS item (or a plain frame with a Question layer) read as a row: the question text and the
// source nodes of its answer. Whole item Off + an Answer layer = only that layer; otherwise everything
// in the item next to the question. Read-only: the nodes are only passed on to be copied.
interface DomRow {
    question: string
    sources: HTMLElement[]
}

function readDomRow(el: HTMLElement, qName: string, aName: string, wholeItem: boolean, allowFirstText: boolean): DomRow | null {
    let answer = findLayer(el, aName)
    let q = findLayer(el, qName)
    if (q && answer && (answer === q || answer.contains(q) || q.contains(answer))) answer = null
    if (!q && allowFirstText) q = firstTextEl(el, answer)
    if (!q || q === el) return null
    const rest = siblingsUpTo(q, el)
    const sources = answer && !wholeItem ? [answer] : rest
    return { question: collapse(String(q.textContent || "")), sources }
}

interface ScanRow {
    kind: "dom" | "react"
    question: string
    slot: number
}
interface Scan {
    key: string
    rows: ScanRow[]
    hostKinds: HostKind[]
    // Slots that were read into rows (CMS lists, frames with a Question layer): their boxes are hidden.
    readSlots: boolean[]
    anyCms: boolean
}

function rowsFromScan(scan: Scan, legacy: Item[], slotCount: number): URow[] {
    const list: Omit<URow, "slug">[] = scan.rows.map((r) => ({ kind: r.kind, question: r.question, answer: "", slot: r.slot }))
    if (!scan.anyCms) for (let i = slotCount; i < legacy.length; i += 1) list.push(textRow(legacy[i], -1))
    return withSlugs(list)
}

// A copy this component created and owns. It has never been attached to the slot, so writing to it is
// writing to our own node (REVIEW-RULES §3 P2).
type Owned<T> = T & { readonly __owned: true }

// Deep copy of an answer node. Ids are dropped (no duplicate ids on the page), copied media never autoplay.
function ownClone(node: HTMLElement): Owned<HTMLElement> {
    const copy = node.cloneNode(true) as Owned<HTMLElement>
    const all = [copy as HTMLElement, ...Array.from(copy.querySelectorAll<HTMLElement>("*"))]
    all.forEach((el) => {
        if (el.hasAttribute("id")) el.toggleAttribute("id", false)
        if (el instanceof HTMLMediaElement) {
            el.autoplay = false
            el.preload = "none"
        }
    })
    return copy
}

// Puts our copies into our own (empty, React-rendered) answer box, only when they differ.
function mountCopies(box: Owned<HTMLDivElement>, list: Owned<HTMLElement>[]): void {
    const same = box.childNodes.length === list.length && list.every((c, i) => box.childNodes[i] === c)
    if (!same) box.replaceChildren(...list)
}

// Simple string hash used as a change fingerprint for answer sources (outerHTML).
function hashText(s: string): string {
    let h = 5381
    for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0
    return `${s.length}:${h.toString(36)}`
}

// On the server this is useEffect (never runs); in the browser it is useLayoutEffect, so CMS rows
// replace the raw list before the first paint after hydration.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect
// ---------------------------------------------------------------- view (shared by static and live)
function Icon({ kind }: { kind: string }) {
    if (kind === "chevron") {
        return (
            <span className="ff-ic ff-ic-chevron" aria-hidden="true">
                <svg className="ff-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </span>
        )
    }
    return (
        <span className="ff-ic ff-ic-plus" aria-hidden="true">
            <span className="ff-bar ff-bh" />
            <span className="ff-bar ff-bv" />
        </span>
    )
}

interface ViewProps {
    p: Props
    idPrefix: string
    rows: URow[]
    slots: ReactNode[]
    hostKinds: HostKind[]
    readSlots: boolean[]
    live: boolean
    isOpen: (row: URow, index: number) => boolean
    locked: boolean
    empty: boolean
    onToggle?: (slug: string) => void
    onKeyDown?: (e: ReactKeyboardEvent<HTMLDivElement>) => void
    trackRef?: MutableRefObject<HTMLDivElement | null>
    answerRef?: (index: number) => (el: HTMLDivElement | null) => void
    more?: ShowMore
}

// ---------------------------------------------------------------- R26 Show more (rows read from Panels (CMS) only)
// initialCount > 0: only the first N rows read from the slots are drawn, plus our own button that reveals N more per
// click. Focus moves to the question button of the first newly drawn row (our <button>). 0 = all rows.
type ShowMore = { limit: number; hasMore: boolean; focusAt: number; reveal: () => void; focused: () => void; paging: boolean; expanded: boolean; note: string }
function useShowMore(total: number, initialCount: number): ShowMore {
    const step = Number.isFinite(initialCount) ? Math.max(0, Math.floor(initialCount)) : 0
    const [pages, setPages] = useState(1)
    const [focusAt, setFocusAt] = useState(-1)
    const [note, setNote] = useState("")
    useEffect(() => {
        setPages(1)
        setFocusAt(-1)
        setNote("")
    }, [step])
    const count = step > 0 ? Math.min(total, step * pages) : total
    return {
        limit: count,
        hasMore: count < total,
        focusAt,
        reveal: () => {
            const next = Math.min(total, count + step)
            setFocusAt(count)
            setPages((n) => n + 1)
            setNote(showMoreNote(next - count, next, total))
        },
        focused: () => setFocusAt(-1),
        paging: step > 0,
        expanded: step > 0 && count > step,
        note,
    }
}

function FaqView({ p, idPrefix, rows, slots, hostKinds, readSlots, live, isOpen, locked, empty, onToggle, onKeyDown, trackRef, answerRef, more }: ViewProps) {
    const H = headingTag(p.headingLevel)
    // Ordinal of each slot-read (dom) row: paging and the focus target count only these.
    const domOrd = new Map<number, number>()
    rows.forEach((row, r) => {
        if (row.kind === "dom") domOrd.set(r, domOrd.size)
    })
    const pagedOut = (r: number) => !!more && (domOrd.get(r) ?? -1) >= more.limit
    const header = (row: URow, r: number, open: boolean) => (
        <H key="h" className="ff-h">
            <button
                ref={
                    more && more.focusAt >= 0 && domOrd.get(r) === more.focusAt
                        ? (el: HTMLButtonElement | null) => {
                              if (el && more) {
                                  el.focus()
                                  more.focused()
                              }
                          }
                        : undefined
                }
                type="button"
                className={locked ? "ff-btn ff-locked" : "ff-btn"}
                id={`${idPrefix}-q-${r}`}
                aria-expanded={open}
                aria-disabled={locked || undefined}
                aria-controls={`${idPrefix}-a-${r}`}
                onClick={onToggle && !locked ? () => onToggle(row.slug) : undefined}
            >
                <span>{row.question}</span>
                <Icon kind={p.iconStyle} />
            </button>
        </H>
    )
    // Our own row: button header + region panel. A text row shows its typed answer; a CMS row gets an
    // empty answer box (ours) that the live effect fills with copies of the Answer layer.
    const ownItem = (row: URow, r: number) => {
        const open = isOpen(row, r)
        return (
            <div key={`t${r}`} className={open ? "ff-item ff-open" : "ff-item"}>
                {header(row, r, open)}
                <div className="ff-panel" id={`${idPrefix}-a-${r}`} role="region" aria-labelledby={`${idPrefix}-q-${r}`}>
                    <div className="ff-clip">
                        {row.kind === "dom" ? (
                            <div className="ff-ans ff-cl" ref={answerRef ? answerRef(r) : undefined} />
                        ) : (
                            <div className="ff-ans">{row.answer}</div>
                        )}
                    </div>
                </div>
            </div>
        )
    }
    const rootStyle = { ...p.style, ...cssVars(p) } as CSSProperties

    if (!slots.length) {
        return (
            <div className={rootClass(p)} style={rootStyle} onKeyDown={onKeyDown}>
                <style>{live ? LIVE_CSS : BASE_CSS}</style>
                {rows.map(ownItem)}
            </div>
        )
    }

    const reactRows = new Map<number, number>()
    rows.forEach((row, r) => {
        if (row.kind === "react") reactRows.set(row.slot, r)
    })
    return (
        <div className={rootClass(p)} style={rootStyle} onKeyDown={onKeyDown}>
            <style>{live ? LIVE_CSS : BASE_CSS}</style>
            <div className="ff-track" ref={trackRef} id={more && (more.hasMore || more.expanded) ? `${idPrefix}-list` : undefined}>
                {slots.map((slot, s) => {
                    const r = hostKinds[s] === "react" ? reactRows.get(s) : undefined
                    const row = r === undefined ? undefined : rows[r]
                    const open = row !== undefined && r !== undefined ? isOpen(row, r) : false
                    const hidden = !row && !!readSlots[s]
                    const boxClass = row ? (open ? "ff-slotbox ff-item ff-open" : "ff-slotbox ff-item") : hidden ? "ff-slotbox ff-src-off" : "ff-slotbox ff-flat"
                    // Same element tree in every state, so the slot content is never remounted. A slot read into
                    // rows keeps rendering here (hidden by our own class); its rows follow it as our own items.
                    return (
                        <Fragment key={`s${s}`}>
                        <div className={boxClass} aria-hidden={hidden || undefined}>
                            {row && r !== undefined ? header(row, r, open) : null}
                            <div
                                key="p"
                                className={row ? "ff-hp ff-panel" : "ff-hp ff-flat"}
                                id={row ? `${idPrefix}-a-${r}` : undefined}
                                role={row ? "region" : undefined}
                                aria-labelledby={row ? `${idPrefix}-q-${r}` : undefined}
                            >
                                <div className={row ? "ff-clip" : "ff-flat"}>
                                    <div className={row ? "ff-host ff-slot" : "ff-host"}>{slot}</div>
                                </div>
                            </div>
                        </div>
                        {rows.map((x, i) => (x.kind === "dom" && x.slot === s && !pagedOut(i) ? ownItem(x, i) : null))}
                        </Fragment>
                    )
                })}
                {rows.map((row, r) => (row.kind === "text" ? ownItem(row, r) : null))}
            </div>
            {more && more.hasMore ? (
                <button type="button" className="ff-more" aria-expanded={more.expanded} aria-controls={`${idPrefix}-list`} onClick={more.reveal}>
                    {p.showMoreLabel || "Show more"}
                </button>
            ) : null}
            {more && more.paging && live ? (
                <span role="status" aria-live="polite" aria-atomic="true" style={SHOW_MORE_SR}>{more.note}</span>
            ) : null}
            {empty ? <p className="ff-empty">{p.emptyText}</p> : null}
        </div>
    )
}

// ---------------------------------------------------------------- static renderer (canvas)
// 휴지 상태(기본 = 전부 접힘, Canvas open 으로 한 줄 열기). 리스너·관측자·타이머·트랜지션·DOM 읽기 0.
// A Collection List in Panels (CMS) shows as it is; rows are read in Preview and on the site.
function StaticFaq({ p }: { p: Props }) {
    const idPrefix = `ff-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
    const slots = slotsOf(p)
    const legacy = legacyItems(p.items)
    const rows = slots.length ? preRows(slots.length, legacy) : textRows(p.items)
    const kinds = preHostKinds(slots.length, legacy)
    const openIndex = (Number(p.canvasOpen) || 0) - 1
    return (
        <FaqView
            p={p}
            idPrefix={idPrefix}
            rows={rows}
            slots={slots}
            hostKinds={kinds}
            readSlots={[]}
            live={false}
            isOpen={(_, i) => i === openIndex}
            locked={false}
            empty={false}
        />
    )
}

function readOpen(p: Props): string[] {
    if (typeof window === "undefined" || p.urlSync === "off") return []
    const raw = new URLSearchParams(window.location.search).get(p.paramName || "faq")
    return raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : []
}

function writeOpen(p: Props, slugs: string[]): void {
    if (typeof window === "undefined" || p.urlSync === "off" || !window.history || !window.history.replaceState) return
    const url = new URL(window.location.href)
    if (slugs.length) url.searchParams.set(p.paramName || "faq", slugs.join(","))
    else url.searchParams.delete(p.paramName || "faq")
    // replaceState — 토글이 뒤로가기 기록을 채우지 않게
    window.history.replaceState(null, "", url.pathname + url.search + url.hash)
}

// ---------------------------------------------------------------- live
function LiveFaq({ p }: { p: Props }) {
    const idPrefix = `ff-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
    const slots = slotsOf(p)
    const slotMode = slots.length > 0
    const legacy = legacyItems(p.items)
    const legacyKey = JSON.stringify(legacy)
    const itemsKey = JSON.stringify(Array.isArray(p.items) ? p.items : [])
    const qName = String(p.questionLayer || "")
    const aName = String(p.answerLayer || "")
    const whole = p.wholeItem === true
    const trackRef = useRef<HTMLDivElement | null>(null)
    const [scan, setScan] = useState<Scan | null>(null)
    const [open, setOpen] = useState<string[]>([])
    const [wide, setWide] = useState(false)
    const allOpen = p.allOpenDesktop && wide
    const restored = useRef(false)
    // Internal bookkeeping only (R3): answer source → its copy, copies per row, our answer boxes per row.
    const cache = useRef(new Map<HTMLElement, { html: string; copy: Owned<HTMLElement> }>())
    const copies = useRef<Owned<HTMLElement>[][]>([])
    // Our answer boxes: empty divs this component renders (no React children), filled only with our copies.
    const answerBoxes = useRef<(Owned<HTMLDivElement> | null)[]>([])
    const answerRef = useCallback(
        (index: number) => (el: HTMLDivElement | null) => {
            answerBoxes.current[index] = el as Owned<HTMLDivElement> | null
        },
        []
    )

    const rows = useMemo(() => {
        const lg = JSON.parse(legacyKey) as Item[]
        if (!slotMode) return textRows(JSON.parse(itemsKey) as Item[])
        return scan ? rowsFromScan(scan, lg, slots.length) : preRows(slots.length, lg)
    }, [slotMode, scan, legacyKey, itemsKey, slots.length])
    const hostKinds = scan ? scan.hostKinds : preHostKinds(slots.length, legacy)

    // "All open on desktop": 뷰포트 폭은 마운트 후에만 읽는다(서버 = 좁은 폭 취급 → 하이드레이션 일치).
    useEffect(() => {
        if (!p.allOpenDesktop || typeof window === "undefined" || typeof window.matchMedia !== "function") {
            setWide(false)
            return
        }
        const mq = window.matchMedia(`(min-width: ${Math.max(320, Number(p.mobileUnder) || 810)}px)`)
        const sync = () => setWide(mq.matches)
        sync()
        mq.addEventListener("change", sync)
        return () => mq.removeEventListener("change", sync)
    }, [p.allOpenDesktop, p.mobileUnder])

    // 초기 열림: URL(?faq=slug) 우선, 없으면 Opens at. 행이 처음 생겼을 때 한 번만(CMS 는 스캔 후).
    const ready = !slotMode || scan !== null
    useEffect(() => {
        if (restored.current || !ready || !rows.length) return
        restored.current = true
        const wanted = readOpen(p).filter((slug) => rows.some((r) => r.slug === slug))
        if (wanted.length) {
            setOpen(p.allowMultiple ? wanted : wanted.slice(0, 1))
            return
        }
        const idx = (Number(p.defaultOpen) || 0) - 1
        if (idx >= 0 && idx < rows.length) setOpen([rows[idx].slug])
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, rows])

    const toggle = useCallback(
        (slug: string) => {
            if (!rows.some((r) => r.slug === slug)) return
            setOpen((prev) => {
                const was = prev.includes(slug)
                const next = p.allowMultiple ? (was ? prev.filter((s) => s !== slug) : [...prev, slug]) : was ? [] : [slug]
                writeOpen(p, next)
                return next
            })
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [rows, p.allowMultiple, p.urlSync, p.paramName]
    )

    // Read the slots (never write to them), copy each CMS answer into our own nodes, and watch our host
    // boxes for Collection List changes (Load more, hydration swaps, CMS text). Our rows and copies live
    // outside the observed hosts, so mounting them never re-triggers the observer (D2).
    useIsoLayoutEffect(() => {
        const track = trackRef.current
        if (!slotMode || !track) {
            setScan(null)
            return
        }
        let lg: Item[] = []
        try {
            const parsed: unknown = JSON.parse(legacyKey)
            if (Array.isArray(parsed)) lg = parsed as Item[]
        } catch {
            lg = []
        }
        const hosts: HTMLElement[] = []
        const found = track.querySelectorAll(".ff-host")
        for (let i = 0; i < found.length; i += 1) {
            const h = found[i]
            if (h instanceof HTMLElement && h.closest(".ff-track") === track) hosts.push(h)
        }
        let lastKey = ""
        const rescan = () => {
            const scanRows: ScanRow[] = []
            const sources: HTMLElement[][] = []
            const kinds: HostKind[] = []
            const readSlots: boolean[] = []
            let anyCms = false
            hosts.forEach((host, s) => {
                const split = detectCmsItems(host)
                if (split.cms) {
                    anyCms = true
                    kinds.push("flat")
                    readSlots.push(true)
                    split.items.forEach((item) => {
                        const d = readDomRow(item, qName, aName, whole, true)
                        if (!d) return
                        scanRows.push({ kind: "dom", question: d.question, slot: s })
                        sources.push(d.sources)
                    })
                    return
                }
                if (!split.list) {
                    kinds.push("flat")
                    readSlots.push(false)
                    return
                }
                // Plain frame: a Question layer makes it a row. Otherwise, with a typed item at the same
                // position, the frame is that item's answer (the original Section slots behaviour).
                const legacyQ = lg[s] ? String(lg[s].question || "") : ""
                const d = readDomRow(host, qName, aName, whole, !legacyQ)
                if (d) {
                    kinds.push("flat")
                    readSlots.push(true)
                    scanRows.push({ kind: "dom", question: d.question, slot: s })
                    sources.push(d.sources)
                } else {
                    kinds.push("react")
                    readSlots.push(false)
                    scanRows.push({ kind: "react", question: legacyQ || `Question ${s + 1}`, slot: s })
                }
            })
            // Copies: reuse while the source markup is unchanged (no image re-decode), copy again otherwise.
            const nextCache = new Map<HTMLElement, { html: string; copy: Owned<HTMLElement> }>()
            const htmlSig: string[] = []
            copies.current = sources.map((list) =>
                list.map((node) => {
                    const html = node.outerHTML
                    const hit = cache.current.get(node)
                    const copy = hit && hit.html === html ? hit.copy : ownClone(node)
                    nextCache.set(node, { html, copy })
                    htmlSig.push(hashText(html))
                    return copy
                })
            )
            cache.current = nextCache
            const key = JSON.stringify({ r: scanRows, k: kinds, s: readSlots, c: anyCms, h: htmlSig })
            // Same rows and answers as last time: no state update (R5).
            if (key !== lastKey) {
                lastKey = key
                setScan({ key, rows: scanRows, hostKinds: kinds, readSlots, anyCms })
            }
        }
        rescan()
        const mo = batchedObserver(rescan)
        // Of attributes, only src / srcset / href: an image or link swapped on the same node re-copies the answer.
        hosts.forEach((h) => mo.observe(h, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["src", "srcset", "href"] }))
        return () => {
            mo.disconnect()
            cache.current = new Map()
            copies.current = []
            setScan(null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slotMode, slots.length, qName, aName, whole, legacyKey])

    // Mount each row's answer copies into its (empty, React-rendered) answer box. Only our nodes change.
    useIsoLayoutEffect(() => {
        if (!scan) return
        let d = 0
        rows.forEach((row, r) => {
            if (row.kind !== "dom") return
            const box: Owned<HTMLDivElement> | null = answerBoxes.current[r]
            const list = copies.current[d] || []
            d += 1
            if (box) mountCopies(box, list)
        })
    })

    // Arrow keys, Home and End move between this component's own question buttons (WAI-ARIA accordion).
    const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
        const root = e.currentTarget
        const t = e.target
        if (!(t instanceof HTMLButtonElement)) return
        const triggers: HTMLButtonElement[] = []
        const all = root.querySelectorAll(".ff-btn")
        for (let i = 0; i < all.length; i += 1) {
            const el = all[i]
            if (el instanceof HTMLButtonElement && el.closest(".ff-root") === root) triggers.push(el)
        }
        const current = triggers.indexOf(t)
        if (current < 0) return
        let nextIndex = -1
        if (e.key === "ArrowDown") nextIndex = (current + 1) % triggers.length
        else if (e.key === "ArrowUp") nextIndex = (current - 1 + triggers.length) % triggers.length
        else if (e.key === "Home") nextIndex = 0
        else if (e.key === "End") nextIndex = triggers.length - 1
        if (nextIndex < 0) return
        e.preventDefault()
        triggers[nextIndex].focus()
    }

    const empty = slotMode && scan !== null && rows.length === 0
    const more = useShowMore(slotMode && scan ? rows.filter((r) => r.kind === "dom").length : 0, p.initialCount)
    return (
        <FaqView
            p={p}
            idPrefix={idPrefix}
            rows={rows}
            slots={slots}
            hostKinds={hostKinds}
            readSlots={scan ? scan.readSlots : []}
            live={true}
            isOpen={(row) => allOpen || open.includes(row.slug)}
            locked={allOpen}
            empty={empty}
            onToggle={toggle}
            onKeyDown={onKeyDown}
            trackRef={trackRef}
            answerRef={answerRef}
            more={slotMode && scan ? more : undefined}
        />
    )
}


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

export default function FaqAccordion(props: Partial<Props>) {
    const isStatic = useIsStaticRenderer()
    const p = resolve(props)
    return isStatic ? <StaticFaq p={p} /> : <LiveFaq p={p} />
}

const LAYER_HELP = " Case does not matter; a missing layer is fine."

addPropertyControls(FaqAccordion, {
    panels: {
        type: ControlType.Array,
        title: "Panels (CMS)",
        control: { type: ControlType.ComponentInstance },
        defaultValue: [],
        description: "Drop a Collection List here. Each CMS item becomes one question: its Question layer is the header, the rest of the item opens as the answer. The list itself is read, then hidden, so turn off its pagination. A plain frame works too. With typed Items, a frame without a Question layer is the answer of the item in the same position.",
    },
    questionLayer: {
        type: ControlType.String,
        title: "Question layer",
        defaultValue: "Question",
        description: "Text layer in each CMS item used as the clickable question. Without it, the first text in the item is used." + LAYER_HELP,
    },
    answerLayer: {
        type: ControlType.String,
        title: "Answer layer",
        defaultValue: "Answer",
        description: "Layer in each CMS item that opens as the answer. Without it, everything in the item except the question opens." + LAYER_HELP,
    },
    wholeItem: {
        type: ControlType.Boolean,
        title: "Whole item",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Off: when a CMS item has an Answer layer, only that layer opens. On: everything in the item except the question opens, as you designed it.",
    },
    styleCmsLayers: {
        type: ControlType.Boolean,
        title: "Style CMS layers",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Questions always use this component's card and button. On: CMS answers take the Answer colour, font and size set here. Off: answers keep the text styles of your Answer layer.",
    },
    initialCount: {
        type: ControlType.Number,
        title: "Initial count",
        defaultValue: 0,
        min: 0,
        max: 500,
        step: 1,
        displayStepper: true,
        description: "Questions from Panels (CMS) shown at first. A Show more button reveals this many more per click. 0 shows every question.",
    },
    showMoreLabel: { type: ControlType.String, title: "Show more label", defaultValue: "Show more", description: "Text of the Show more button used with Initial count." },
    emptyText: {
        type: ControlType.String,
        title: "Empty text",
        defaultValue: "No questions yet.",
        description: "Shown when Panels (CMS) holds an empty collection.",
    },
    contentMode: {
        type: ControlType.Enum,
        title: "Content",
        options: ["slots", "text"],
        optionTitles: ["Panels when filled", "Text only"],
        defaultValue: "slots",
        description: "Panels when filled: anything in Panels (CMS) is used. Text only: Panels is ignored and the Items below show with text answers.",
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        description: "Typed questions. Used when Panels (CMS) is empty. With plain frames in Panels, item 1 takes frame 1 as its answer.",
        control: {
            type: ControlType.Object,
            controls: {
                question: { type: ControlType.String, title: "Question", defaultValue: "Question?", description: "Header text of this row." },
                answer: { type: ControlType.String, title: "Answer", defaultValue: "Answer.", displayTextArea: true, description: "Text shown when the row opens." },
            },
        },
        defaultValue: DEFAULTS.items,
    },
    accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#6D5EF6", description: "Icon, focus ring and the open card border." },
    background: { type: ControlType.Color, title: "Card BG", defaultValue: "#111116", hidden: (p: ControlProps) => p.layout === "lines", description: "Card fill in the Cards style." },
    textColor: { type: ControlType.Color, title: "Title", defaultValue: "#F5F5F7", description: "Question text." },
    mutedColor: { type: ControlType.Color, title: "Answer", defaultValue: "#9A9AA5", description: "Answer text." },
    railColor: { type: ControlType.Color, title: "Rail", defaultValue: "rgba(255, 255, 255, 0.08)", description: "Card border, or the divider line in the Lines style." },
    layout: {
        type: ControlType.Enum,
        title: "Style",
        options: ["cards", "lines"],
        optionTitles: ["Cards", "Lines"],
        defaultValue: "cards",
        description: "Cards: each question in a filled box. Lines: questions separated by a thin line.",
    },
    iconStyle: {
        type: ControlType.Enum,
        title: "Icon",
        options: ["plus", "chevron"],
        optionTitles: ["Plus", "Chevron"],
        defaultValue: "plus",
        description: "Plus turns into a close mark; Chevron flips when open.",
    },
    headingLevel: {
        type: ControlType.Enum,
        title: "Heading",
        options: ["h2", "h3", "h4"],
        optionTitles: ["H2", "H3", "H4"],
        defaultValue: "h3",
        description: "Heading level of typed questions, to fit your page outline.",
    },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 14, min: 0, max: 40, step: 1, unit: "px", hidden: (p: ControlProps) => p.layout === "lines", description: "Card corner radius." },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 10, min: 0, max: 40, step: 1, unit: "px", description: "Space between questions." },
    font: { type: ControlType.Font, title: "Font", controls: "basic", description: "Font for questions and answers." },
    fontSize: { type: ControlType.Number, title: "Size", defaultValue: 16, min: 10, max: 32, step: 1, unit: "px", description: "Question size. Answers are 1px smaller." },
    defaultOpen: { type: ControlType.Number, title: "Opens at", defaultValue: 0, min: 0, max: 24, step: 1, description: "Row open on load, counted from 1. 0 = all closed." },
    urlSync: {
        type: ControlType.Enum,
        title: "Deep link",
        options: ["off", "query"],
        optionTitles: ["Off", "?faq="],
        defaultValue: "off",
        description: "Opening an item writes it to the URL, so the link reopens it.",
    },
    paramName: { type: ControlType.String, title: "Param", defaultValue: "faq", description: "URL parameter name used when Deep link is on, for example faq in ?faq=billing." },
    allOpenDesktop: { type: ControlType.Boolean, title: "All open on desktop", defaultValue: false, enabledTitle: "On", disabledTitle: "Off", description: "Every answer stays open on wide screens; rows fold again on phones." },
    mobileUnder: { type: ControlType.Number, title: "Desktop from", defaultValue: 810, min: 320, max: 1600, step: 10, unit: "px", hidden: (p: ControlProps) => !p.allOpenDesktop, description: "Window width from which All open on desktop applies." },
    canvasOpen: { type: ControlType.Number, title: "Canvas open", defaultValue: 0, min: 0, max: 24, step: 1, description: "Canvas preview only. 0 = all closed." },
    allowMultiple: {
        type: ControlType.Boolean,
        title: "Multi-open",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "On: several answers can be open at once. Off: opening one closes the others.",
    },
})
