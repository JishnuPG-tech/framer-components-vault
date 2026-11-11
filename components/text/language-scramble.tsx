// LanguageScrambleTrigger.tsx
// Invisible behavior layer for language-switch buttons. On click it switches
// the active Framer locale, then scrambles every changed text value inside
// the frames the user has explicitly targeted (data-scramble attribute or a
// selector control) — unresolved characters cycle through a Latin/number/kana
// pool while the target string resolves left to right. One shared
// requestAnimationFrame loop drives all targeted frames; text is mutated
// through text-node nodeValue only, so links, bold spans and rich-text markup
// survive untouched, and the engine never traverses or mutates anything
// outside the user-designated containers. Framer Localization is the only
// source of strings — no translation APIs, no keys, no network.
// v1.0.0

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


// ---------------------------------------------------------------- types

type SwitchMode = "toggle" | "next" | "specific"
type CharacterPreset = "mixed" | "alphanumeric" | "custom"
type Scope = "page" | "viewport"
type ReducedMotionBehavior = "instant" | "short"
type EffectStyle = "scramble" | "cascade" | "centerOut" | "edgesIn" | "wipe"

interface LocaleGroupProps {
    mode: SwitchMode
    targetLocale: string
}

interface TargetGroupProps {
    mode: "marked" | "selector"
    selector: string
}

interface AnimationGroupProps {
    style: EffectStyle
    duration: number
    refreshRate: number
    characters: CharacterPreset
    customCharacters: string
    reducedMotion: ReducedMotionBehavior
}

interface PerfGroupProps {
    scope: Scope
    maxCharacters: number
    preserveWhitespace: boolean
}

interface AdvancedGroupProps {
    exclusionSelector: string
    showGuide: boolean
}

interface Props {
    locale: LocaleGroupProps
    target: TargetGroupProps
    animation: AnimationGroupProps
    perf: PerfGroupProps
    advanced: AdvancedGroupProps
    style?: React.CSSProperties
}

/**
 * Random-glyph pools split by rendered width class. Full-width targets draw
 * from `wide`, everything else from `narrow`, so a scrambled line keeps
 * roughly the target line's width on every tick and line breaks stay put.
 */
interface GlyphPools {
    narrow: string[]
    digits: string[]
    wide: string[]
}

/** Resolved per-run settings, captured at click time. */
interface Config {
    style: EffectStyle
    duration: number
    interval: number
    initialHold: number
    pools: GlyphPools
    preserveWhitespace: boolean
    scope: Scope
    maxGraphemes: number
    exclusionSelector: string
    targetMode: "marked" | "selector"
    targetSelector: string
}

/** One animated text node, fully precomputed before the loop starts. */
interface JobItem {
    node: Text
    /** Exact target string, assigned verbatim on completion. */
    target: string
    g: string[]
    ws: boolean[]
    /** Glyph class per grapheme: 0 narrow, 1 full-width (CJK/kana), 2 digit. */
    wd: number[]
    /**
     * Punctuation/symbol graphemes stay anchored in place while letters
     * scramble (the reference does this too). Widths like the CJK em dash
     * are context-dependent, so substituting them is what makes lines
     * re-wrap mid-animation.
     */
    anchor: boolean[]
    /**
     * Resolution order: rank[i] is when position i locks (null = left to
     * right). Cascade shuffles it; center-out/edges-in sort it by distance
     * from the middle.
     */
    rank: number[] | null
    /** Old-value graphemes, present only for the wipe style. */
    old: string[] | null
}

/**
 * Effect strategy: builds one node's visible text for one tick. The engine
 * knows nothing about how glyphs are chosen, so future effects (character
 * cascade, vertical glyph roll) plug in here without touching the loop.
 */
interface EffectStrategy {
    frame(item: JobItem, reveal: number, job: Job): void
}

interface Job {
    items: JobItem[]
    effect: EffectStrategy
    duration: number
    interval: number
    initialHold: number
    pools: GlyphPools
    preserveWhitespace: boolean
    restoreAria: () => void
    owner: InstanceState
    raf: number
    failsafe: ReturnType<typeof setTimeout> | null
    start: number
    lastTick: number
}

/** Snapshot taken before setLocale, consumed after the locale applies. */
interface Pending {
    wm: WeakMap<Text, string>
    list: string[]
    /** Node count at snapshot time; -1 means unknown (session-marker path). */
    count: number
    toId: string
    cfg: Config
}

interface InstanceState {
    obs: MutationObserver | null
    timer: ReturnType<typeof setTimeout> | null
}

// ---------------------------------------------------------------- constants

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
const DIGITS = "0123456789"
const LATIN = LETTERS + DIGITS
const PUNCT = "#%&+=?!@*"
// Common gojūon Hiragana + Katakana, matching the reference recording's mix.
const KANA =
    "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわん" +
    "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン"

const WS_RE = /^\s+$/u
// East Asian full-width ranges: CJK radicals through Yi (incl. kana + CJK
// unified), Hangul, compatibility ideographs, full-width forms, CJK ext B+.
const WIDE_RE = new RegExp(
    "[\\u1100-\\u115F\\u2E80-\\uA4CF\\uAC00-\\uD7A3\\uF900-\\uFAFF" +
        "\\uFE30-\\uFE4F\\uFF00-\\uFF60\\uFFE0-\\uFFE6" +
        "\\u{20000}-\\u{2FFFD}\\u{30000}-\\u{3FFFD}]",
    "u"
)

const EXCLUDE_SELECTOR = [
    "script",
    "style",
    "noscript",
    "svg",
    "canvas",
    "input",
    "textarea",
    "select",
    "option",
    "code",
    "pre",
    '[aria-hidden="true"]',
    "[data-no-scramble]",
    '[contenteditable=""]',
    '[contenteditable="true"]',
    '[contenteditable="plaintext-only"]',
].join(",")

const MARKER_KEY = "languageScrambleTrigger.pending"
const MARKER_TTL = 2000
const DOM_WAIT_MS = 1500
const VIEWPORT_MARGIN = 100

// ---------------------------------------------------------------- text utils

// Typed loosely so the file compiles under TS libs that predate ES2022's
// Intl.Segmenter declarations; the runtime guard does the real work.
let segmenter:
    | { segment(s: string): Iterable<{ segment: string }> }
    | null
    | undefined
function splitGraphemes(s: string): string[] {
    if (segmenter === undefined) {
        try {
            const Seg = (Intl as any).Segmenter
            segmenter = Seg
                ? new Seg(undefined, { granularity: "grapheme" })
                : null
        } catch {
            segmenter = null
        }
    }
    if (segmenter) return Array.from(segmenter.segment(s), (x) => x.segment)
    return Array.from(s)
}

function clamp(v: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, Number.isFinite(v) ? v : min))
}

// Letters and digits scramble; everything else anchors. Property escapes are
// ES2018 — on the off chance they're unsupported, nothing anchors (no crash).
let letterRe: RegExp | null | undefined
function isAnchor(ch: string): boolean {
    if (letterRe === undefined) {
        try {
            letterRe = new RegExp("[\\p{L}\\p{N}]", "u")
        } catch {
            letterRe = null
        }
    }
    return letterRe ? !letterRe.test(ch) : false
}

/**
 * Pools are split by width class so each unresolved character can draw a
 * stand-in of roughly its own rendered width — full-width targets get kana,
 * narrow targets get Latin/digits/punctuation. Without this, line breaks
 * dance on every tick and the whole page below jitters vertically.
 */
function buildPools(preset: CharacterPreset, custom: string): GlyphPools {
    if (preset === "alphanumeric") {
        const g = splitGraphemes(LATIN)
        return { narrow: g, digits: splitGraphemes(DIGITS), wide: g }
    }
    if (preset === "custom") {
        const g = splitGraphemes((custom ?? "").replace(/\s+/gu, ""))
        if (g.length > 0) {
            const narrow = g.filter((ch) => !WIDE_RE.test(ch))
            const wide = g.filter((ch) => WIDE_RE.test(ch))
            const digits = g.filter((ch) => ch >= "0" && ch <= "9")
            // A class with no glyphs of its own falls back to the full set.
            return {
                narrow: narrow.length > 0 ? narrow : g,
                digits:
                    digits.length > 0 ? digits : narrow.length > 0 ? narrow : g,
                wide: wide.length > 0 ? wide : g,
            }
        }
    }
    // Digits stand in for digits and letters for letters so line-break
    // behavior around numbers matches the real text.
    return {
        narrow: splitGraphemes(LETTERS + PUNCT),
        digits: splitGraphemes(DIGITS),
        wide: splitGraphemes(KANA),
    }
}

function isVisible(el: Element): boolean {
    const h = el as HTMLElement
    if (typeof (h as any).checkVisibility === "function") {
        return (h as any).checkVisibility()
    }
    return !!(h.offsetWidth || h.offsetHeight || h.getClientRects().length)
}

/**
 * The containers the user has explicitly handed to the component: frames
 * marked with a data-scramble attribute (default), or elements matching the
 * Target selector control. The engine never traverses or mutates anything
 * outside these roots — no document.body walking.
 */
function resolveScopeRoots(cfg: Config): Element[] {
    if (typeof document === "undefined") return []
    let els: Element[] = []
    try {
        els =
            cfg.targetMode === "selector" && cfg.targetSelector
                ? Array.from(document.querySelectorAll(cfg.targetSelector))
                : Array.from(document.querySelectorAll("[data-scramble]"))
    } catch {
        return []
    }
    // Drop roots nested inside other roots so text isn't visited twice.
    return els.filter((el) => !els.some((o) => o !== el && o.contains(el)))
}

/**
 * Collect visible, animatable text nodes in DOM order, only inside the
 * user-designated scope roots. One `closest` call per distinct parent
 * element (cached), so cost stays linear in practice.
 */
function collectTextNodes(cfg: Config): Text[] {
    const out: Text[] = []
    const roots = resolveScopeRoots(cfg)
    if (roots.length === 0) return out
    const cache = new Map<Element, boolean>()
    for (const root of roots) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
        let n: Node | null
        while ((n = walker.nextNode())) {
            const t = n as Text
            const v = t.nodeValue
            if (!v || WS_RE.test(v) || v.length === 0) continue
            const el = t.parentElement
            if (!el) continue
            let excluded = cache.get(el)
            if (excluded === undefined) {
                excluded =
                    !!el.closest(EXCLUDE_SELECTOR) ||
                    (el as HTMLElement).isContentEditable === true
                if (!excluded && cfg.exclusionSelector) {
                    try {
                        excluded = !!el.closest(cfg.exclusionSelector)
                    } catch {
                        // Invalid selector from the control — ignore it.
                    }
                }
                if (!excluded) excluded = !isVisible(el)
                cache.set(el, excluded)
            }
            if (!excluded) out.push(t)
        }
    }
    return out
}

function nodeInViewport(t: Text): boolean {
    try {
        const r = document.createRange()
        r.selectNodeContents(t)
        const rect = r.getBoundingClientRect()
        return (
            rect.bottom > -VIEWPORT_MARGIN &&
            rect.top < window.innerHeight + VIEWPORT_MARGIN &&
            rect.right > -VIEWPORT_MARGIN &&
            rect.left < window.innerWidth + VIEWPORT_MARGIN
        )
    } catch {
        return true
    }
}

// ---------------------------------------------------------------- session marker
// Fallback for locale switches that navigate to a localized URL or remount
// the tree: the target page picks the marker up on mount and animates once.
// Short-lived by design — never long-term storage.

interface Marker {
    t: number
    to: string
    old: string[] | null
}

function writeMarker(to: string, old: string[]): void {
    try {
        let json = JSON.stringify({ t: Date.now(), to, old })
        if (json.length > 60000) {
            json = JSON.stringify({ t: Date.now(), to, old: null })
        }
        window.sessionStorage.setItem(MARKER_KEY, json)
    } catch {
        // Storage unavailable (privacy mode) — same-page path still works.
    }
}

function readMarker(): Marker | null {
    try {
        const raw = window.sessionStorage.getItem(MARKER_KEY)
        if (!raw) return null
        const m = JSON.parse(raw)
        if (typeof m?.t !== "number" || typeof m?.to !== "string") return null
        return m as Marker
    } catch {
        return null
    }
}

function clearMarker(): void {
    try {
        window.sessionStorage.removeItem(MARKER_KEY)
    } catch {}
}

// ---------------------------------------------------------------- engine
// Module-level on purpose: one shared loop for the page, and a second trigger
// instance can never start a competing loop.

let currentJob: Job | null = null

/**
 * Random-glyph effect shared by scramble, cascade, center-out, and edges-in —
 * they differ only in the precomputed resolution order (item.rank).
 */
const glyphEffect: EffectStrategy = {
    frame(item, reveal, job) {
        const len = item.g.length
        const resolved = Math.min(len, Math.floor(reveal * len))
        const { narrow, digits, wide } = job.pools
        const rank = item.rank
        let out = ""
        for (let i = 0; i < len; i++) {
            const done = rank ? rank[i] < resolved : i < resolved
            if (done) out += item.g[i]
            else if (item.anchor[i]) out += item.g[i]
            else if (job.preserveWhitespace && item.ws[i]) out += item.g[i]
            else {
                const pool =
                    item.wd[i] === 1 ? wide : item.wd[i] === 2 ? digits : narrow
                out += pool[(Math.random() * pool.length) | 0]
            }
        }
        item.node.nodeValue = out
    },
}

/**
 * Wipe: the new text types over the old, no random glyphs. The old suffix
 * shrinks proportionally as the target prefix grows, so width morphs smoothly
 * between the two layouts.
 */
const wipeEffect: EffectStrategy = {
    frame(item, reveal, _job) {
        const len = item.g.length
        const resolved = Math.min(len, Math.floor(reveal * len))
        const old = item.old
        if (!old) {
            // Old value unknown (fail-safe path) — nothing to wipe from.
            item.node.nodeValue = item.target
            return
        }
        const oldStart = Math.min(
            old.length,
            Math.round((resolved / Math.max(1, len)) * old.length)
        )
        item.node.nodeValue =
            item.g.slice(0, resolved).join("") + old.slice(oldStart).join("")
    },
}

/**
 * Resolution-order permutation per style. Returns rank[i] = the tick order in
 * which position i locks; null means plain left to right.
 */
function buildRank(len: number, style: EffectStyle): number[] | null {
    if (style === "scramble" || style === "wipe" || len <= 1) return null
    const order: number[] = []
    for (let i = 0; i < len; i++) order.push(i)
    if (style === "cascade") {
        for (let i = len - 1; i > 0; i--) {
            const j = (Math.random() * (i + 1)) | 0
            const tmp = order[i]
            order[i] = order[j]
            order[j] = tmp
        }
    } else {
        const center = (len - 1) / 2
        const sign = style === "centerOut" ? 1 : -1
        order.sort(
            (a, b) =>
                sign * (Math.abs(a - center) - Math.abs(b - center)) || a - b
        )
    }
    const rank = new Array<number>(len)
    for (let r = 0; r < len; r++) rank[order[r]] = r
    return rank
}

function paintFrame(job: Job, reveal: number): void {
    for (const item of job.items) job.effect.frame(item, reveal, job)
}

function finishJob(): void {
    const job = currentJob
    if (!job) return
    currentJob = null
    cancelAnimationFrame(job.raf)
    if (job.failsafe) clearTimeout(job.failsafe)
    // Exact, unmodified target strings — never leave scrambled glyphs behind.
    for (const item of job.items) {
        try {
            item.node.nodeValue = item.target
        } catch {}
    }
    try {
        job.restoreAria()
    } catch {}
}

function tick(now: number): void {
    const job = currentJob
    if (!job) return
    try {
        const elapsed = now - job.start
        if (elapsed >= job.duration) {
            finishJob()
            return
        }
        if (now - job.lastTick >= job.interval) {
            job.lastTick = now
            const reveal =
                elapsed <= job.initialHold
                    ? 0
                    : (elapsed - job.initialHold) /
                      (job.duration - job.initialHold)
            paintFrame(job, reveal)
        }
        job.raf = requestAnimationFrame(tick)
    } catch {
        finishJob()
    }
}

/**
 * While the visible text is gibberish, each affected element carries the final
 * text as its accessible name and live announcements are silenced. Everything
 * touched is restored verbatim on completion.
 */
function lockAria(items: JobItem[]): () => void {
    const saved: Array<{
        el: Element
        label: string | null
        live: string | null
    }> = []
    const seen = new Set<Element>()
    for (const it of items) {
        const el = it.node.parentElement
        if (!el || seen.has(el)) continue
        seen.add(el)
        saved.push({
            el,
            label: el.getAttribute("aria-label"),
            live: el.getAttribute("aria-live"),
        })
        el.setAttribute("aria-label", el.textContent ?? it.target)
        el.setAttribute("aria-live", "off")
    }
    return () => {
        for (const s of saved) {
            if (s.label === null) s.el.removeAttribute("aria-label")
            else s.el.setAttribute("aria-label", s.label)
            if (s.live === null) s.el.removeAttribute("aria-live")
            else s.el.setAttribute("aria-live", s.live)
        }
    }
}

/**
 * The DOM already holds the target strings when this runs. Builds the item
 * list (viewport first, capped by the grapheme budget), locks accessibility,
 * writes the first fully-scrambled frame synchronously — before the browser
 * can paint the translated text — and starts the shared loop.
 */
interface ChangedEntry {
    node: Text
    /** Value before the locale switch; null when unknown (fail-safe paths). */
    old: string | null
}

/** True in any static rendering context: canvas, export, or thumbnail. */
function isStaticContext(): boolean {
    try {
        const rt = RenderTarget.current()
        return rt !== RenderTarget.preview
    } catch {
        return false
    }
}

function startJob(
    entries: ChangedEntry[],
    cfg: Config,
    owner: InstanceState
): void {
    if (currentJob) return
    // Never animate on the canvas, during export, or in thumbnails: no
    // requestAnimationFrame, no timers, no text mutation in static contexts.
    if (isStaticContext()) return
    const inView: ChangedEntry[] = []
    const offView: ChangedEntry[] = []
    for (const entry of entries) {
        ;(nodeInViewport(entry.node) ? inView : offView).push(entry)
    }
    // Offscreen text stays instantly translated: in Viewport scope always, in
    // Page scope once the budget below runs out.
    const ordered = cfg.scope === "viewport" ? inView : inView.concat(offView)
    const items: JobItem[] = []
    let total = 0
    for (const { node, old } of ordered) {
        if (total >= cfg.maxGraphemes) break
        const target = node.nodeValue ?? ""
        const g = splitGraphemes(target)
        items.push({
            node,
            target,
            g,
            ws: g.map((ch) => WS_RE.test(ch)),
            wd: g.map((ch) =>
                WIDE_RE.test(ch) ? 1 : ch >= "0" && ch <= "9" ? 2 : 0
            ),
            anchor: g.map((ch) => !WS_RE.test(ch) && isAnchor(ch)),
            rank: buildRank(g.length, cfg.style),
            old:
                cfg.style === "wipe" && old != null
                    ? splitGraphemes(old)
                    : null,
        })
        total += g.length
    }
    if (items.length === 0) return
    const restoreAria = lockAria(items)
    const job: Job = {
        items,
        effect: cfg.style === "wipe" ? wipeEffect : glyphEffect,
        duration: cfg.duration,
        interval: cfg.interval,
        initialHold: cfg.initialHold,
        pools: cfg.pools,
        preserveWhitespace: cfg.preserveWhitespace,
        restoreAria,
        owner,
        raf: 0,
        failsafe: null,
        start: performance.now(),
        lastTick: performance.now(),
    }
    currentJob = job
    paintFrame(job, 0)
    job.raf = requestAnimationFrame(tick)
    // rAF suspends in hidden tabs; this guarantees the exact target strings
    // land at duration end even if no frame ever fires.
    job.failsafe = setTimeout(() => {
        if (currentJob === job) finishJob()
    }, cfg.duration + 250)
}

/**
 * Pair the fresh node list against the snapshot: node identity first (Framer
 * updates localized text in place), index order as fallback when the count
 * matches. Only values that differ animate. If the structures don't
 * correspond at all, fail safe: animate the currently visible target text.
 * Returns false when the DOM hasn't shown the new locale yet.
 */
function tryStart(p: Pending, owner: InstanceState): boolean {
    if (currentJob) return true
    const fresh = collectTextNodes(p.cfg)
    if (fresh.length === 0) return false
    const structureMatch = p.count >= 0 && fresh.length === p.count
    const changed: ChangedEntry[] = []
    let known = 0
    for (let i = 0; i < fresh.length; i++) {
        const node = fresh[i]
        let old = p.wm.get(node)
        if (old === undefined && structureMatch) old = p.list[i]
        if (old !== undefined) {
            known++
            if (old !== (node.nodeValue ?? "")) changed.push({ node, old })
        }
    }
    let candidates = changed
    if (known === 0) candidates = fresh.map((node) => ({ node, old: null }))
    if (candidates.length === 0) return false
    startJob(candidates, p.cfg, owner)
    return true
}

/**
 * Same-commit locale updates are caught immediately (layout effect runs after
 * React's DOM mutations, before paint). If Framer commits the text
 * asynchronously, a MutationObserver picks it up at the microtask checkpoint
 * — still before paint, so the translated text never flashes.
 */
function beginWhenDomReady(p: Pending, inst: InstanceState): void {
    if (tryStart(p, inst)) return
    // Observe only the user-designated scope roots, never document.body.
    const roots = resolveScopeRoots(p.cfg)
    if (roots.length === 0) return
    const obs = new MutationObserver(() => {
        if (tryStart(p, inst)) stop()
    })
    const stop = () => {
        obs.disconnect()
        if (inst.obs === obs) inst.obs = null
        if (inst.timer) {
            clearTimeout(inst.timer)
            inst.timer = null
        }
    }
    inst.obs = obs
    for (const root of roots) {
        obs.observe(root, {
            subtree: true,
            childList: true,
            characterData: true,
        })
    }
    inst.timer = setTimeout(stop, DOM_WAIT_MS)
}

// ---------------------------------------------------------------- config

function resolveConfig(props: Props): Config | "instant" {
    const { animation, perf, advanced, target } = props
    let duration = clamp(animation.duration ?? 680, 60, 5000)
    const reduced =
        typeof window !== "undefined" &&
        !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    if (reduced) {
        if ((animation.reducedMotion ?? "instant") === "instant") {
            return "instant"
        }
        duration = Math.min(duration, 150)
    }
    const fps = clamp(animation.refreshRate ?? 30, 5, 60)
    return {
        style: animation.style ?? "scramble",
        duration,
        interval: 1000 / fps,
        initialHold: Math.min(70, duration * 0.25),
        pools: buildPools(
            animation.characters ?? "mixed",
            animation.customCharacters
        ),
        preserveWhitespace: perf.preserveWhitespace !== false,
        scope: perf.scope ?? "page",
        maxGraphemes: clamp(perf.maxCharacters ?? 4000, 100, 100000),
        exclusionSelector: (advanced.exclusionSelector ?? "").trim(),
        targetMode: target?.mode ?? "marked",
        targetSelector: (target?.selector ?? "").trim(),
    }
}

function resolveTargetLocale<
    L extends { id: string; code?: string; slug?: string },
>(
    mode: SwitchMode,
    query: string,
    activeId: string | undefined,
    locales: readonly L[]
): L | null {
    if (!locales || locales.length === 0) return null
    switch (mode) {
        case "specific": {
            const q = (query ?? "").trim().toLowerCase()
            if (!q) return null
            return (
                locales.find(
                    (l) =>
                        l.id?.toLowerCase() === q ||
                        l.slug?.toLowerCase() === q ||
                        l.code?.toLowerCase() === q
                ) ?? null
            )
        }
        case "next": {
            const i = locales.findIndex((l) => l.id === activeId)
            return locales[(i + 1) % locales.length] ?? null
        }
        case "toggle":
        default: {
            const a = locales[0]
            const b = locales[1]
            if (!a || !b) return null
            return activeId === a.id ? b : a
        }
    }
}

// ---------------------------------------------------------------- component

// Safe defaults as ES default parameters (React 18.3 deprecates defaultProps
// on function components); property-control defaultValues mirror these.
const DEFAULTS = {
    locale: { mode: "toggle", targetLocale: "" } as LocaleGroupProps,
    target: { mode: "marked", selector: "" } as TargetGroupProps,
    animation: {
        style: "scramble",
        duration: 680,
        refreshRate: 30,
        characters: "mixed",
        customCharacters: "",
        reducedMotion: "instant",
    } as AnimationGroupProps,
    perf: {
        scope: "page",
        maxCharacters: 4000,
        preserveWhitespace: true,
    } as PerfGroupProps,
    advanced: { exclusionSelector: "", showGuide: true } as AdvancedGroupProps,
}

/**
 * LanguageScrambleTrigger — invisible layer that switches the Framer locale
 * and scrambles the page's changed text into place.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 120
 * @framerIntrinsicHeight 48
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function LanguageScrambleTrigger({
    locale = DEFAULTS.locale,
    target = DEFAULTS.target,
    animation = DEFAULTS.animation,
    perf = DEFAULTS.perf,
    advanced = DEFAULTS.advanced,
    style,
}: Partial<Props>) {
    const props: Props = { locale, target, animation, perf, advanced, style }
    const { activeLocale, locales, setLocale } = useLocaleInfo()
    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const pendingRef = React.useRef<Pending | null>(null)
    const pendingAtRef = React.useRef(0)
    const instRef = React.useRef<InstanceState>({ obs: null, timer: null })
    const propsRef = React.useRef(props)
    propsRef.current = props

    const activeId = activeLocale?.id

    // Locale applied on this page (no remount): consume the pending snapshot
    // before paint so the translated text never flashes un-scrambled.
    // Static contexts (canvas/export/thumbnail) never animate.
    React.useLayoutEffect(() => {
        if (isStatic) return
        const p = pendingRef.current
        if (!p || p.toId !== activeId) return
        pendingRef.current = null
        clearMarker()
        beginWhenDomReady(p, instRef.current)
    }, [activeId, isStatic])

    // Locale switch navigated or remounted: pick up the short-lived session
    // marker and animate the freshly loaded target page once.
    React.useLayoutEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const m = readMarker()
        if (!m) return
        clearMarker()
        if (Date.now() - m.t > MARKER_TTL) return
        if (activeLocale && m.to && activeLocale.id !== m.to) return
        const cfg = resolveConfig(propsRef.current)
        if (cfg === "instant") return
        tryStart(
            {
                wm: new WeakMap(),
                list: m.old ?? [],
                count: m.old ? m.old.length : -1,
                toId: m.to,
                cfg,
            },
            instRef.current
        )
        // Mount-only by design; refs carry current props.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Unmount / route change: restore exact text, drop observers and frames.
    React.useEffect(() => {
        const inst = instRef.current
        return () => {
            inst.obs?.disconnect()
            inst.obs = null
            if (inst.timer) {
                clearTimeout(inst.timer)
                inst.timer = null
            }
            if (currentJob && currentJob.owner === inst) finishJob()
            pendingRef.current = null
        }
    }, [])

    // Static rendering (canvas, export, thumbnail): return a plain styled
    // element with no handlers, no effects pending, and no animation — the
    // engine above is never invoked in these contexts.
    if (isStatic) {
        return (
            <div
                data-no-scramble=""
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    background: "none",
                    border: "none",
                    padding: 0,
                    margin: 0,
                    ...style,
                }}
            >
                {isCanvas && advanced.showGuide && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                            outline: "1px dashed rgba(0, 136, 255, 0.65)",
                            outlineOffset: -1,
                            borderRadius: "inherit",
                        }}
                    >
                        <span
                            style={{
                                position: "absolute",
                                top: 3,
                                left: 3,
                                font: "500 9px/1.5 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                                letterSpacing: 0.2,
                                color: "rgba(0, 136, 255, 0.95)",
                                background: "rgba(0, 136, 255, 0.10)",
                                padding: "1px 5px",
                                borderRadius: 3,
                                whiteSpace: "nowrap",
                            }}
                        >
                            Language Trigger
                        </span>
                    </div>
                )}
            </div>
        )
    }

    const handleClick = (e: React.MouseEvent) => {
        // The layer owns the activation — a parent Link or Tap must not also
        // navigate or fire.
        e.preventDefault()
        e.stopPropagation()
        if (isStatic || typeof window === "undefined") return
        // One animation at a time; a stale pending switch (>2 s) is discarded.
        if (currentJob) return
        if (
            pendingRef.current &&
            performance.now() - pendingAtRef.current < MARKER_TTL
        ) {
            return
        }
        pendingRef.current = null
        if (!locales || locales.length < 2) return
        const target = resolveTargetLocale(
            locale.mode ?? "toggle",
            locale.targetLocale ?? "",
            activeId,
            locales
        )
        if (!target || target.id === activeId) return
        const cfg = resolveConfig(propsRef.current)
        if (cfg === "instant") {
            setLocale(target)
            return
        }
        // Snapshot current values before the locale changes anything. With no
        // marked frames (or no selector matches) there is nothing to animate:
        // switch instantly and touch nothing.
        const nodes = collectTextNodes(cfg)
        if (nodes.length === 0) {
            setLocale(target)
            return
        }
        const wm = new WeakMap<Text, string>()
        const list: string[] = []
        for (const n of nodes) {
            const v = n.nodeValue ?? ""
            wm.set(n, v)
            list.push(v)
        }
        pendingRef.current = {
            wm,
            list,
            count: nodes.length,
            toId: target.id,
            cfg,
        }
        pendingAtRef.current = performance.now()
        writeMarker(target.id, list)
        setLocale(target)
    }

    return (
        <div
            data-no-scramble=""
            onClick={handleClick}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                background: "none",
                border: "none",
                padding: 0,
                margin: 0,
                cursor: "pointer",
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
                ...style,
            }}
        />
    )
}

// ---------------------------------------------------------------- controls

addPropertyControls(LanguageScrambleTrigger, {
    locale: {
        type: ControlType.Object,
        title: "Locale",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Switch to",
                options: ["toggle", "next", "specific"],
                optionTitles: [
                    "Toggle first two",
                    "Next locale",
                    "Specific locale",
                ],
                defaultValue: "toggle",
                description:
                    "Toggle picks whichever of the first two locales is inactive",
            },
            targetLocale: {
                type: ControlType.String,
                title: "Target locale",
                defaultValue: "",
                placeholder: "id, slug, or code",
                description:
                    "Matches a locale ID, slug, or code from Localization",
                hidden: (p: LocaleGroupProps) => p.mode !== "specific",
            },
        },
    },
    target: {
        type: ControlType.Object,
        title: "Target",
        description:
            "Only text inside targeted frames animates; the locale still switches site-wide",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Animate",
                options: ["marked", "selector"],
                optionTitles: ["Marked frames", "CSS selector"],
                defaultValue: "marked",
                description:
                    "Marked frames have a data-scramble custom attribute",
            },
            selector: {
                type: ControlType.String,
                title: "Selector",
                defaultValue: "",
                placeholder: "#content, main",
                description: "Elements whose text is allowed to animate",
                hidden: (p: TargetGroupProps) => p.mode !== "selector",
            },
        },
    },
    animation: {
        type: ControlType.Object,
        title: "Animation",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: [
                    "scramble",
                    "cascade",
                    "centerOut",
                    "edgesIn",
                    "wipe",
                ],
                optionTitles: [
                    "Scramble",
                    "Cascade",
                    "Center out",
                    "Edges in",
                    "Wipe",
                ],
                defaultValue: "scramble",
                description:
                    "Order characters resolve in; Wipe types over the old text",
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                unit: "ms",
                min: 100,
                max: 3000,
                step: 10,
                defaultValue: 680,
            },
            refreshRate: {
                type: ControlType.Number,
                title: "Refresh rate",
                unit: "fps",
                min: 10,
                max: 60,
                step: 1,
                defaultValue: 30,
                description: "How often unresolved characters change",
            },
            characters: {
                type: ControlType.Enum,
                title: "Characters",
                options: ["mixed", "alphanumeric", "custom"],
                optionTitles: ["Mixed", "Alphanumeric", "Custom"],
                defaultValue: "mixed",
                description:
                    "Mixed matches each character's width to keep lines steady",
                hidden: (p: AnimationGroupProps) => p.style === "wipe",
            },
            customCharacters: {
                type: ControlType.String,
                title: "Custom set",
                defaultValue: "",
                placeholder: "Characters to cycle through",
                hidden: (p: AnimationGroupProps) =>
                    p.characters !== "custom" || p.style === "wipe",
            },
            reducedMotion: {
                type: ControlType.Enum,
                title: "Reduced motion",
                options: ["instant", "short"],
                optionTitles: ["Instant switch", "Short scramble"],
                defaultValue: "instant",
                description: "Behavior when visitors prefer reduced motion",
            },
        },
    },
    perf: {
        type: ControlType.Object,
        title: "Performance",
        controls: {
            scope: {
                type: ControlType.Enum,
                title: "Scope",
                options: ["page", "viewport"],
                optionTitles: ["Page", "Viewport"],
                defaultValue: "page",
                displaySegmentedControl: true,
                description:
                    "Viewport scrambles on-screen text only; the rest switches instantly",
            },
            maxCharacters: {
                type: ControlType.Number,
                title: "Max characters",
                min: 500,
                max: 20000,
                step: 100,
                defaultValue: 4000,
                description:
                    "Text beyond this budget switches without animating",
            },
            preserveWhitespace: {
                type: ControlType.Boolean,
                title: "Keep whitespace",
                defaultValue: true,
                description: "Spaces and breaks never turn into glyphs",
            },
        },
    },
    advanced: {
        type: ControlType.Object,
        title: "Advanced",
        description:
            "More components at [Kullen Jahnke](https://framer.link/uqyd85k)",
        controls: {
            exclusionSelector: {
                type: ControlType.String,
                title: "Exclude",
                defaultValue: "",
                placeholder: ".no-scramble, header nav",
                description: "CSS selector for text that never scrambles",
            },
            showGuide: {
                type: ControlType.Boolean,
                title: "Canvas guide",
                defaultValue: true,
                description:
                    "Dashed outline on the canvas only; never on the site",
            },
        },
    },
})
