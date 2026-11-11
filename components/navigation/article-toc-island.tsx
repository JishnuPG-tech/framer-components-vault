import { useState, useEffect, useRef, useCallback, useId } from "react"
import type { CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * TOC Island — floating table of contents
 *
 * A floating, Dynamic-Island-style pill that builds a table of contents automatically
 * from the headings of the current page. No CMS wiring needed: place it on the
 * post template, set "Content ID" once, and it works on every article.
 *
 * Why it reads outside its own subtree: a table of contents is built from the
 * article's headings, and those live in the host page, not in this component.
 * TOC Island therefore reads the page's h2/h3 elements, their text and their
 * positions. That access is read-only.
 *
 * How the page access is bounded:
 * - Scope. "Content ID" is required: the Scroll Target name (= HTML id) of the
 *   frame that holds the article, resolved with document.getElementById only
 *   (no user-supplied CSS selectors). Scanning, observing and scroll tracking
 *   are limited to that frame. There is no whole-page fallback: with an empty
 *   ID nothing is read and one console warning is logged. While no element
 *   with the ID exists, getElementById is the only access (on mount, after
 *   400 / 1200 ms, on load, on popstate, on the Navigation API's
 *   navigatesuccess and, rAF-throttled, on scroll), so an island that stays
 *   mounted across client-side navigations (e.g. in a Layout Template) finds
 *   the next article. One warning is logged if it's still missing once both
 *   the 1200 ms retry and the load event have passed; the pill stays hidden
 *   meanwhile.
 * - Change detection. One MutationObserver on that container only, created
 *   once it exists: childList + subtree, no attributes or text. Rescans are
 *   debounced (200 ms) and the component's own re-renders are ignored. If a
 *   navigation replaces the container, the observers move to the new element.
 *   Navigations only trigger a rescan when the route changed or the held
 *   element is gone or replaced (Framer's own replaceState after every
 *   scroll gesture doesn't).
 * - Active section. An IntersectionObserver reports which headings have
 *   crossed the activation line; headings are not measured on scroll.
 *   Progress uses the first and last text block, measured on scan/resize.
 * - Scroll container. findScroller walks up from the first heading (computed
 *   overflow-y of each ancestor, stopping at <body>) once per scan and per
 *   click, so articles inside a nested scroller are tracked and scrolled there.
 * - Scroll handling is passive and requestAnimationFrame-throttled. The
 *   wheel / touch / key listeners that release a click lock exist only while
 *   the lock is active.
 * - Every listener, observer, timer and frame request is removed on unmount.
 *
 * Static rendering: on the Canvas and in exports (useIsStaticRenderer) it
 * renders a static sample island and runs no effects that touch the page: no
 * measuring, observers or listeners. A short hint asks for a Content ID there
 * while it is empty.
 *
 * Scrolling: only on an explicit click on an entry. It scrolls the heading's
 * own scroll container (nearest scrollable ancestor, else the document), with
 * smooth scrolling unless the visitor prefers reduced motion. Turn off
 * "Scroll Page" to never scroll; "On Select" fires on every entry click so
 * the host project can react or scroll itself.
 *
 * Good-neighbour design (safe to run alongside other marketplace components):
 * - Does NOT mutate the host page. It keeps element references to the headings
 *   instead of assigning ids, so existing anchors, scripts and styles are
 *   untouched.
 * - Event-driven, not polling. Content changes come from the MutationObserver,
 *   the active section from the IntersectionObserver; progress updates are
 *   throttled with requestAnimationFrame.
 * - Accessible. The panel is a <nav> named by the label, with the entries in
 *   lists (H3 entries nested under their H2). The toggle and every entry are
 *   native <button> elements (Enter/Space work), with aria-expanded /
 *   aria-controls; the toggle's name is the label, and the reading progress
 *   is its description ("48% read", not live). Collapsed, the panel is inert,
 *   aria-hidden and (after the close animation) visibility:hidden, with the
 *   list and every entry at tabIndex -1; a hidden pill is visibility:hidden
 *   too. Focus is handed back to the pill before the panel collapses.
 *   Keyboard focus shows a 2px inset ring on the pill and on entries (with a
 *   forced-colors fallback), and the motion is switched off under
 *   prefers-reduced-motion.
 *
 * How it reads content:
 * scans for the headings Framer renders with the universal `framer-text` class
 * (h2.framer-text, h3.framer-text) inside the content container, skipping
 * elements that aren't rendered (e.g. hidden breakpoint copies).
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */

interface ArticleTOCIslandProps {
    contentId?: string
    title?: string
    includeH2?: boolean
    includeH3?: boolean
    scrollOffset?: number
    scrollPage?: boolean
    onSelect?: () => void
    wordsPerMinute?: number
    readSuffix?: string
    showReadingTime?: boolean
    showProgress?: boolean
    dock?: "top" | "bottom"
    align?: "left" | "center" | "right"
    offsetX?: number
    offsetY?: number
    maxWidth?: number
    cornerRadius?: number
    revealAfter?: number
    collapseOnSelect?: boolean
    startExpanded?: boolean
    bgColor?: string
    borderColor?: string
    textColor?: string
    mutedColor?: string
    activeColor?: string
    accentColor?: string
    trackColor?: string
    badgeBg?: string
    badgeText?: string
    panelBg?: string
    readLabelColor?: string
    style?: CSSProperties
}

// Inline style that also carries the CSS custom properties (--toci-*).
type StyleWithVars = CSSProperties & { [key: `--${string}`]: string }

type Item = {
    key: string
    text: string
    level: string
    el: HTMLElement | null
}

// An entry plus the H3 entries nested under it (only H2 entries get any).
type Group = { item: Item; children: Item[] }

const SAMPLE: Item[] = [
    {
        key: "s1",
        text: "Table of Contents Dynamic Island",
        level: "h2",
        el: null,
    },
    { key: "s2", text: "Editing Content", level: "h2", el: null },
    { key: "s3", text: "Adding Content to the Canvas", level: "h2", el: null },
    { key: "s4", text: "Add a Page with Content", level: "h2", el: null },
]

function slugify(s: string): string {
    return (
        s
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .slice(0, 60) || "section"
    )
}

const WORD_SEL =
    "p.framer-text, h1.framer-text, h2.framer-text, h3.framer-text, h4.framer-text, h5.framer-text, h6.framer-text, li.framer-text"

// Keys that scroll the page; pressing one counts as manual scrolling.
const SCROLL_KEYS = [
    "ArrowUp",
    "ArrowDown",
    "PageUp",
    "PageDown",
    "Home",
    "End",
    " ",
]

// The IntersectionObserver root box reaches this far above the container top,
// so a heading counts as "above the line" however fast the user scrolls.
const FAR = 1000000

// Visually hidden, but read by assistive technology.
const SR_ONLY: CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    border: 0,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
}

// One console warning per page load for each setup problem.
let warnedEmpty = false
let warnedMissing = false

function normalizeId(contentId: string): string {
    return (contentId || "").trim().replace(/^#/, "")
}

// H3 entries nest under the preceding H2; an H3 before any H2 stays at the
// top level.
function groupItems(items: Item[]): Group[] {
    const groups: Group[] = []
    let parent: Group | null = null
    for (const it of items) {
        if (it.level === "h3" && parent) {
            parent.children.push(it)
            continue
        }
        const g: Group = { item: it, children: [] }
        groups.push(g)
        parent = it.level === "h3" ? null : g
    }
    return groups
}

// The content's own scroll container: nearest ancestor that scrolls
// vertically, or null for the document. Read-only.
function findScroller(el: Element | null): HTMLElement | null {
    let p = el ? el.parentElement : null
    while (p && p !== document.body && p !== document.documentElement) {
        const oy = getComputedStyle(p).overflowY
        if (
            (oy === "auto" || oy === "scroll" || oy === "overlay") &&
            p.scrollHeight > p.clientHeight
        )
            return p
        p = p.parentElement
    }
    return null
}

function prefersReducedMotion(): boolean {
    return (
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
}

export default function ArticleTOCIsland(props: ArticleTOCIslandProps) {
    // Defaults match the property-control defaults below.
    const {
        contentId = "",
        title = "Contents",
        includeH2 = true,
        includeH3 = true,
        scrollOffset = 100,
        scrollPage = true,
        onSelect,
        wordsPerMinute = 225,
        readSuffix = "MIN READ",
        showReadingTime = true,
        showProgress = true,
        dock = "bottom",
        align = "center",
        offsetX = 24,
        offsetY = 32,
        maxWidth = 360,
        cornerRadius = 26,
        revealAfter = 150,
        collapseOnSelect = true,
        startExpanded = false,
        bgColor = "rgb(10, 10, 10)",
        borderColor = "rgba(255, 255, 255, 0.12)",
        textColor = "rgb(255, 255, 255)",
        mutedColor = "rgb(140, 140, 140)",
        activeColor = "rgb(255, 255, 255)",
        accentColor = "rgb(255, 255, 255)",
        trackColor = "rgba(255, 255, 255, 0.18)",
        badgeBg = "rgba(255, 255, 255, 0.1)",
        badgeText = "rgb(255, 255, 255)",
        panelBg = "rgba(255, 255, 255, 0.05)",
        readLabelColor = "rgb(140, 140, 140)",
        style,
    } = props

    // True on the Canvas and in exports; false for site visitors, including
    // the server render and hydration (constant per mount).
    const isStatic = useIsStaticRenderer()
    const contentKey = normalizeId(contentId)
    // Accessible name of the toggle and the nav: the label, or a fallback.
    const navLabel = (title || "").trim() || "Table of contents"

    const [items, setItems] = useState<Item[]>([])
    const [activeKey, setActiveKey] = useState<string>("")
    const [progress, setProgress] = useState<number>(0)
    const [minutes, setMinutes] = useState<number>(0)
    const [expanded, setExpanded] = useState<boolean>(!!startExpanded)
    const [revealed, setRevealed] = useState<boolean>(false)
    // Entry list overflows below its visible area (bottom fade).
    const [fade, setFade] = useState<boolean>(false)

    const itemsRef = useRef<Item[]>([])
    const boundsRef = useRef<{ top: number; bottom: number } | null>(null)
    const revealedRef = useRef<boolean>(false)
    const lastPath = useRef<string>("")
    const rootRef = useRef<HTMLDivElement>(null)
    const btnRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLElement>(null)
    const listRef = useRef<HTMLUListElement>(null)
    // Clicked entry: stays active until the user scrolls on their own. The
    // listeners that release it exist only while it is set (lockOffRef).
    const lockRef = useRef<string>("")
    const lockOffRef = useRef<(() => void) | null>(null)
    // Content container (the Content ID element, null until found), its
    // scroll container (null = the document), the headings the
    // IntersectionObserver reports above the activation line, and a hook to
    // request a rescan from the scroll tracker.
    const contentRef = useRef<HTMLElement | null>(null)
    const scrollerRef = useRef<HTMLElement | null>(null)
    const aboveRef = useRef<Set<Element>>(new Set())
    const rescanRef = useRef<() => void>(() => {})

    // Static class names: the <style> text must be identical on server and
    // client (Framer's SSR tree differs, so useId() values don't match).
    // Per-instance values reach the CSS via custom properties on the root.
    const cls = "tocisland"
    // The panel id (aria-controls) and the progress text id (aria-describedby)
    // are assigned after mount so the server HTML and the hydration render
    // can never disagree.
    const rawId = useId()
    const [panelId, setPanelId] = useState<string | undefined>(undefined)
    const [progressId, setProgressId] = useState<string | undefined>(undefined)
    useEffect(() => {
        const uid = rawId.replace(/[^a-zA-Z0-9]/g, "")
        setPanelId("tocisland-panel" + uid)
        setProgressId("tocisland-progress" + uid)
    }, [rawId])

    const wpm = wordsPerMinute || 225

    // Collapse the panel. If focus is inside it, hand focus back to the pill
    // first, so focus never sits in a panel that turns inert / aria-hidden.
    const collapse = useCallback(() => {
        const panel = panelRef.current
        if (panel && panel.contains(document.activeElement))
            btnRef.current?.focus({ preventScroll: true })
        setExpanded(false)
    }, [])

    const releaseLock = useCallback(() => {
        lockRef.current = ""
        const off = lockOffRef.current
        lockOffRef.current = null
        if (off) off()
    }, [])

    // --- DOM scanning (read-only: never mutates the host page) ----------------
    // Everything below reads inside `root` (the Content ID container) with
    // fixed selectors only.
    const collectHeadings = useCallback(
        (root: HTMLElement): Item[] => {
            const levels: string[] = []
            if (includeH2) levels.push("h2")
            if (includeH3) levels.push("h3")
            if (!levels.length) return []

            const sel = levels.map((l) => `${l}.framer-text`).join(", ")
            let nodes = Array.from(root.querySelectorAll<HTMLElement>(sel))
            if (!nodes.length)
                nodes = Array.from(
                    root.querySelectorAll<HTMLElement>(levels.join(", "))
                )

            const result: Item[] = []
            let idx = 0
            nodes.forEach((el) => {
                // Skip elements that aren't rendered (hidden copies).
                if (!el.getClientRects().length) return
                const text = (el.innerText || el.textContent || "").trim()
                if (!text) return
                result.push({
                    key: `${slugify(text)}-${idx++}`,
                    text,
                    level: el.tagName.toLowerCase(),
                    el,
                })
            })
            return result
        },
        [includeH2, includeH3]
    )

    const countWords = useCallback((root: HTMLElement): number => {
        const blocks = Array.from(root.querySelectorAll<HTMLElement>(WORD_SEL))
        // Only leaf blocks so nested text isn't counted twice.
        const leaves = blocks.filter((el) => !el.querySelector(WORD_SEL))
        const src: HTMLElement[] = leaves.length ? leaves : [root]
        let words = 0
        src.forEach((el) => {
            // innerText of an unrendered element is its full text, so skip
            // hidden blocks explicitly.
            if (!el.getClientRects().length) return
            const t = (el.innerText || "").trim()
            if (t) words += t.split(/\s+/).filter(Boolean).length
        })
        return words
    }, [])

    // Article bounds from the first and last visible text block only, in the
    // scroll container's coordinates. Runs on scan/resize, not on scroll.
    const computeBounds = useCallback((): {
        top: number
        bottom: number
    } | null => {
        const root = contentRef.current
        if (!root) return null
        const blocks = root.querySelectorAll(WORD_SEL)
        const ok = (el: Element) => el.getClientRects().length > 0
        let first: Element | null = null
        let last: Element | null = null
        for (let i = 0; i < blocks.length && !first; i++)
            if (ok(blocks[i])) first = blocks[i]
        for (let i = blocks.length - 1; i >= 0 && !last; i--)
            if (ok(blocks[i])) last = blocks[i]
        if (!first || !last) return null
        const sc = scrollerRef.current
        const base = sc
            ? sc.getBoundingClientRect().top + sc.clientTop - sc.scrollTop
            : -window.scrollY
        return {
            top: first.getBoundingClientRect().top - base,
            bottom: last.getBoundingClientRect().bottom - base,
        }
    }, [])

    // --- scroll-derived state -------------------------------------------------
    const recompute = useCallback(() => {
        const its = itemsRef.current
        if (!its.length) return
        // Position in the content's scroll container (the page by default).
        const sc = scrollerRef.current
        const se = document.scrollingElement || document.documentElement
        const y = sc ? sc.scrollTop : window.scrollY
        const vh = sc ? sc.clientHeight : window.innerHeight
        const sh = sc ? sc.scrollHeight : se.scrollHeight
        // Scrolled to the end: the last headings may never reach the offset
        // line, so the page counts as fully read.
        const atEnd = y + vh >= sh - 2

        const b = boundsRef.current
        if (atEnd) {
            setProgress(1)
        } else if (b && b.bottom > b.top) {
            // 0 at the top of the page; 1 once the article's end reaches the
            // middle of the viewport (or the page can't scroll any further).
            const maxScroll = Math.max(0, sh - vh)
            const start = Math.min(maxScroll, Math.max(0, b.top - vh / 2))
            const end = Math.max(
                start + 1,
                Math.min(maxScroll, b.bottom - vh / 2)
            )
            const p = (y - start) / (end - start)
            setProgress(Math.min(1, Math.max(0, p)))
        }

        if (!revealedRef.current && (revealAfter <= 0 || y > revealAfter)) {
            revealedRef.current = true
            setRevealed(true)
        }

        const lock = lockRef.current
        if (lock && its.some((it) => it.key === lock)) {
            setActiveKey(lock)
            return
        }
        if (atEnd) {
            setActiveKey(its[its.length - 1].key)
            return
        }

        // Last heading whose top has crossed the activation line (scrollOffset
        // + 56px), as reported by the IntersectionObserver; the first entry
        // before any has.
        const above = aboveRef.current
        let act = its[0].key
        for (const it of its) {
            if (!it.el || !it.el.isConnected) continue
            if (above.has(it.el)) act = it.key
            else break
        }
        setActiveKey(act)
    }, [revealAfter])

    // Event-driven scan: MutationObserver + navigation listeners (no polling).
    // Nothing is read without a Content ID; while no element with the ID
    // exists, the only page access is getElementById.
    useEffect(() => {
        if (isStatic) return
        if (!contentKey) {
            if (!warnedEmpty) {
                warnedEmpty = true
                console.warn(
                    'TOC Island: set "Content ID" to the Scroll Target name of your article frame.'
                )
            }
            return
        }
        let cancelled = false
        let debounce = 0
        let observed: HTMLElement | null = null
        let mo: MutationObserver | null = null
        let seekRaf = 0
        let seeking = false

        // While no element is held: a passive, rAF-throttled scroll listener
        // (capture phase, so nested scroll containers count too) that only
        // looks the ID up again. Removed once it's found.
        const onSeek = () => {
            if (seekRaf) return
            seekRaf = requestAnimationFrame(() => {
                seekRaf = 0
                refresh()
            })
        }
        const startSeeking = () => {
            if (seeking) return
            seeking = true
            window.addEventListener("scroll", onSeek, {
                passive: true,
                capture: true,
            })
        }
        const stopSeeking = () => {
            if (!seeking) return
            seeking = false
            window.removeEventListener("scroll", onSeek, { capture: true })
            if (seekRaf) cancelAnimationFrame(seekRaf)
            seekRaf = 0
        }

        const scan = () => {
            if (cancelled) return
            // Re-resolve the container each scan: a navigation may have
            // replaced it (/blog/a -> /blog/b) or removed it (-> /about).
            const root = document.getElementById(contentKey)
            if (!root) {
                // No element: drop everything, observe nothing, keep seeking.
                if (mo) mo.disconnect()
                observed = null
                contentRef.current = null
                itemsRef.current = []
                setItems((prev) => (prev.length ? [] : prev))
                startSeeking()
                return
            }
            stopSeeking()
            contentRef.current = root
            if (root !== observed) {
                // Observes the content container only: childList + subtree,
                // no attributes or text. Mutations caused by this component's
                // own re-renders are ignored to avoid feedback loops.
                if (!mo)
                    mo = new MutationObserver((mutations) => {
                        const external = mutations.some(
                            (m) =>
                                !(
                                    rootRef.current &&
                                    rootRef.current.contains(m.target)
                                )
                        )
                        if (external) scheduleScan()
                    })
                mo.disconnect()
                mo.observe(root, { childList: true, subtree: true })
                observed = root
            }
            const its = collectHeadings(root)
            itemsRef.current = its
            setItems((prev) =>
                prev.length === its.length &&
                prev.every((p, i) => p.key === its[i].key && p.el === its[i].el)
                    ? prev
                    : its
            )
            const w = countWords(root)
            if (w > 50) setMinutes(Math.max(1, Math.round(w / wpm)))
            scrollerRef.current = findScroller(its.length ? its[0].el : root)
            boundsRef.current = computeBounds()
            recompute()
        }

        // A new path (client-side navigation) resets reveal, lock and panel.
        const refresh = () => {
            if (cancelled) return
            if (location.pathname !== lastPath.current) {
                lastPath.current = location.pathname
                releaseLock()
                revealedRef.current = false
                setRevealed(false)
                if (startExpanded) setExpanded(true)
                else collapse()
            }
            scan()
        }
        const scheduleScan = () => {
            if (debounce) return
            debounce = window.setTimeout(() => {
                debounce = 0
                refresh()
            }, 200)
        }
        rescanRef.current = scheduleScan

        lastPath.current = location.pathname
        scan()
        // One-shot safety re-scans for late hydration (not continuous polling).
        // Once both the 1200 ms retry and the load event have passed, warn
        // once if no element with the ID exists.
        let retried = false
        let loaded = document.readyState === "complete"
        const warnIfMissing = () => {
            if (cancelled || !retried || !loaded) return
            if (contentRef.current || warnedMissing) return
            warnedMissing = true
            console.warn(
                `TOC Island: no element with the ID "${contentKey}" on this page, so the table of contents stays hidden. Set "Content ID" to the Scroll Target name of the frame that holds your article.`
            )
        }
        const t1 = window.setTimeout(scan, 400)
        const t2 = window.setTimeout(() => {
            scan()
            retried = true
            warnIfMissing()
        }, 1200)
        const onLoad = () => {
            scan()
            loaded = true
            warnIfMissing()
        }

        // Navigation API (where supported) reports pushState navigations
        // that fire no popstate; Framer's router navigates that way.
        const nav = (window as Window & { navigation?: EventTarget }).navigation
        // Framer's runtime saves the scroll position with replaceState after
        // every scroll gesture, which also fires navigatesuccess. Rescan only
        // if the route changed or the held element was removed or replaced.
        const onNav = () => {
            const held = contentRef.current
            if (
                location.pathname !== lastPath.current ||
                !held ||
                !held.isConnected ||
                document.getElementById(contentKey) !== held
            )
                scheduleScan()
        }
        if (nav) nav.addEventListener("navigatesuccess", onNav)
        window.addEventListener("popstate", onNav)
        window.addEventListener("load", onLoad)

        return () => {
            cancelled = true
            rescanRef.current = () => {}
            if (debounce) clearTimeout(debounce)
            clearTimeout(t1)
            clearTimeout(t2)
            if (mo) mo.disconnect()
            stopSeeking()
            if (nav) nav.removeEventListener("navigatesuccess", onNav)
            window.removeEventListener("popstate", onNav)
            window.removeEventListener("load", onLoad)
        }
    }, [
        isStatic,
        contentKey,
        collapse,
        releaseLock,
        collectHeadings,
        countWords,
        computeBounds,
        recompute,
        wpm,
        startExpanded,
    ])

    // Scroll tracking on the content's own scroll container (the page, or a
    // nested scroller), passive and rAF-throttled. The active section comes
    // from an IntersectionObserver, so headings aren't measured on scroll.
    // Nothing is attached until headings were found in the Content ID frame.
    useEffect(() => {
        if (isStatic || !items.length) return
        const sc = scrollerRef.current
        const target: HTMLElement | Window = sc || window
        const above = new Set<Element>()
        aboveRef.current = above
        let raf = 0
        let io: IntersectionObserver | null = null

        // Root box: the container from FAR above its top down to the
        // activation line (scrollOffset + 56px below its top). A heading
        // intersects it exactly when its top has crossed the line.
        const observe = () => {
            if (io) io.disconnect()
            const h = sc ? sc.clientHeight : window.innerHeight
            const line = (scrollOffset || 0) + 56
            const onEntries = (entries: IntersectionObserverEntry[]) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) above.add(e.target)
                    else above.delete(e.target)
                })
                recompute()
            }
            const rootMargin = `${FAR}px 0px ${line - h}px 0px`
            let next: IntersectionObserver
            try {
                // A Document root keeps rootMargin working inside iframes.
                next = new IntersectionObserver(onEntries, {
                    root: sc || document,
                    rootMargin,
                })
            } catch {
                next = new IntersectionObserver(onEntries, {
                    root: sc,
                    rootMargin,
                })
            }
            io = next
            items.forEach((it) => it.el && next.observe(it.el))
        }
        observe()

        const onScroll = () => {
            if (raf) return
            raf = requestAnimationFrame(() => {
                raf = 0
                // Headings re-mounted or content swapped by a client-side
                // navigation: rescan (debounced).
                const first = itemsRef.current[0]
                const c = contentRef.current
                if (
                    (first && first.el && !first.el.isConnected) ||
                    (c && !c.isConnected)
                )
                    rescanRef.current()
                recompute()
            })
        }
        const onResize = () => {
            boundsRef.current = computeBounds()
            observe()
            recompute()
        }
        target.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onResize)
        return () => {
            target.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onResize)
            if (io) io.disconnect()
            if (raf) cancelAnimationFrame(raf)
        }
    }, [isStatic, items, scrollOffset, recompute, computeBounds])

    // Release the click lock (and its listeners) on unmount.
    useEffect(() => releaseLock, [releaseLock])

    // Collapse when clicking outside or pressing Escape (focus is handed
    // back to the pill first, see collapse()).
    useEffect(() => {
        if (isStatic || !expanded || !items.length) return
        const onDown = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node))
                collapse()
        }
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") collapse()
        }
        document.addEventListener("mousedown", onDown)
        document.addEventListener("keydown", onEsc)
        return () => {
            document.removeEventListener("mousedown", onDown)
            document.removeEventListener("keydown", onEsc)
        }
    }, [isStatic, expanded, items, collapse])

    // Bottom fade while the entry list has more entries below.
    const updateFade = useCallback(() => {
        const el = listRef.current
        if (el) setFade(el.scrollHeight - el.clientHeight - el.scrollTop > 1)
    }, [])

    // While open: keep the active entry fully visible by scrolling the LIST
    // (never the page), and keep the fade in sync.
    useEffect(() => {
        const el = listRef.current
        if (isStatic || !expanded || !el || !items.length) return
        const a = el.querySelector<HTMLElement>('[aria-current="true"]')
        if (a) {
            const lr = el.getBoundingClientRect()
            const ar = a.getBoundingClientRect()
            // 28px = height of the fade (.tocisland-fade).
            if (ar.top < lr.top || ar.bottom > lr.bottom - 28) {
                const reduce = prefersReducedMotion()
                el.scrollTo({
                    top:
                        el.scrollTop +
                        ar.top -
                        lr.top -
                        (lr.height - ar.height) / 2,
                    behavior: reduce ? "auto" : "smooth",
                })
            }
        }
        updateFade()
        window.addEventListener("resize", updateFade)
        return () => window.removeEventListener("resize", updateFade)
    }, [isStatic, expanded, activeKey, items, updateFade])

    // Resolve the freshest element for a key (handles content re-mounts).
    const goToKey = useCallback(
        (key: string) => {
            if (isStatic) return
            // "On Select": lets the host project react to every entry click.
            if (onSelect) onSelect()
            const it = itemsRef.current.find((i) => i.key === key)
            const el = it?.el
            if (!el || !el.isConnected) return
            // Highlight right away and keep it, even if the heading can't
            // reach the offset line near the end of the page. Manual
            // scrolling releases it; the programmatic smooth scroll only
            // fires `scroll`, so it keeps the lock.
            lockRef.current = key
            setActiveKey(key)
            if (!lockOffRef.current) {
                const onUser = () => {
                    releaseLock()
                    recompute()
                }
                const onKey = (e: KeyboardEvent) => {
                    if (SCROLL_KEYS.includes(e.key)) onUser()
                }
                window.addEventListener("wheel", onUser, { passive: true })
                window.addEventListener("touchmove", onUser, { passive: true })
                window.addEventListener("keydown", onKey)
                lockOffRef.current = () => {
                    window.removeEventListener("wheel", onUser)
                    window.removeEventListener("touchmove", onUser)
                    window.removeEventListener("keydown", onKey)
                }
            }
            // Scrolls only on this explicit click, and only the heading's own
            // scroll container (else the document). "Scroll Page" off leaves
            // scrolling to the host project.
            if (scrollPage) {
                const sc = findScroller(el)
                const box =
                    sc || document.scrollingElement || document.documentElement
                const top =
                    el.getBoundingClientRect().top -
                    (sc ? sc.getBoundingClientRect().top + sc.clientTop : 0) +
                    box.scrollTop -
                    (scrollOffset || 0)
                box.scrollTo({
                    top,
                    behavior: prefersReducedMotion() ? "auto" : "smooth",
                })
            }
            if (collapseOnSelect) collapse()
        },
        [
            isStatic,
            onSelect,
            scrollPage,
            scrollOffset,
            collapseOnSelect,
            collapse,
            releaseLock,
            recompute,
        ]
    )

    // --- render data ----------------------------------------------------------
    const list = isStatic ? SAMPLE : items
    const groups = groupItems(list)
    const isOpen = isStatic ? true : expanded
    const pct = Math.round((isStatic ? 0.48 : progress) * 100)
    const mins = isStatic ? 4 : minutes
    const current = isStatic ? SAMPLE[2].key : activeKey
    const show = isStatic || (revealed && list.length > 0)

    // `inert` on the collapsed panel, set as a DOM property after mount so it
    // behaves the same under React 18 and 19. aria-hidden, tabIndex and
    // visibility already cover the server HTML.
    useEffect(() => {
        const p = panelRef.current
        if (p) p.inert = !isOpen
    }, [isOpen])

    // Radii — one value drives both states; the inner panel stays concentric.
    const outerRadius = Math.max(0, cornerRadius)
    const panelRadius = Math.max(6, outerRadius - 8)

    // Progress ring geometry.
    const R = 8.5
    const C = 2 * Math.PI * R
    const dash = C * (1 - (isStatic ? 0.48 : progress))

    // Positioning.
    const baseX = align === "center" ? "-50%" : "0px"
    const ty = show ? "0px" : dock === "top" ? "-12px" : "12px"

    const posStyle: CSSProperties = isStatic
        ? { position: "relative" }
        : {
              position: "fixed",
              zIndex: 1000,
              ...(dock === "top"
                  ? { top: `${offsetY}px` }
                  : { bottom: `${offsetY}px` }),
              ...(align === "center"
                  ? { left: "50%" }
                  : align === "right"
                    ? { right: `${offsetX}px` }
                    : { left: `${offsetX}px` }),
              opacity: show ? 1 : 0,
              pointerEvents: show ? "auto" : "none",
              // A hidden pill is out of the tab order and the accessibility
              // tree too; visibility flips after the fade-out (.35s).
              visibility: show ? "visible" : "hidden",
              transition: `opacity .35s ease, transform .4s cubic-bezier(.22,1,.36,1), visibility 0s linear ${show ? "0s" : ".35s"}`,
          }

    const rootStyle: StyleWithVars = {
        ...style,
        ...posStyle,
        transform: `translateX(${baseX}) translateY(${ty})`,
        fontFamily: '"Switzer", system-ui, -apple-system, sans-serif',
        "--toci-text": textColor,
        "--toci-border": borderColor,
        // Space kept free around the list: offset + pill/panel chrome.
        "--toci-reserve": `${(offsetY || 0) + 140}px`,
        // Inner radius of the shell, for the pill's own focus ring when open.
        "--toci-pill-radius": `${Math.max(0, outerRadius - 1)}px`,
    }

    const listReset: CSSProperties = {
        margin: 0,
        padding: 0,
        listStyle: "none",
    }

    const renderEntry = (it: Item) => {
        const active = it.key === current
        return (
            <button
                type="button"
                className={`${cls}-btn ${cls}-item`}
                tabIndex={isOpen ? undefined : -1}
                aria-current={active ? "true" : undefined}
                onClick={(e) => {
                    e.stopPropagation()
                    goToKey(it.key)
                }}
                style={{
                    display: "block",
                    width: "100%",
                    color: active ? activeColor : mutedColor,
                    fontWeight: active ? 600 : 450,
                    fontSize: it.level === "h3" ? 15 : 16,
                    lineHeight: 1.3,
                    padding: "7px 4px",
                    paddingLeft: it.level === "h3" ? 18 : 4,
                    cursor: isStatic ? "default" : "pointer",
                }}
            >
                {it.text}
            </button>
        )
    }

    return (
        <div ref={rootRef} className={`${cls}-root`} style={rootStyle}>
            {/* Static text (no props / ids) so SSR and hydration match.
                None of < > & " ' in it: React 18 escapes them in the server
                HTML, which would no longer match the client text (hence the
                unquoted attribute selectors).
                The list cap uses dvh where supported so the open panel fits
                the visible viewport on mobile (toolbars shown).
                Keyboard focus rings are inset box-shadows in --toci-text: on
                the shell while collapsed (the shell's rounded overflow clip
                can't cut it off), on the pill itself while open, and on each
                entry. The transparent outlines show up in forced-colors mode,
                where box-shadow is dropped. */}
            <style>{`
                .tocisland-btn { appearance: none; -webkit-appearance: none; background: transparent; border: none; margin: 0; font: inherit; color: inherit; text-align: left; }
                .tocisland-item { transition: color .15s ease; }
                .tocisland-item:hover { color: var(--toci-text) !important; }
                .tocisland-item:focus-visible { outline: 2px solid transparent; outline-offset: -2px; box-shadow: inset 0 0 0 2px var(--toci-text); border-radius: 8px; }
                .tocisland-pill[aria-expanded=true]:focus-visible { outline: 2px solid transparent; outline-offset: -2px; box-shadow: inset 0 0 0 2px var(--toci-text); border-radius: var(--toci-pill-radius); }
                .tocisland-list { max-height: min(60vh, 480px, calc(100vh - var(--toci-reserve))); }
                @supports (height: 100dvh) { .tocisland-list { max-height: min(60dvh, 480px, calc(100dvh - var(--toci-reserve))); } }
                .tocisland-fade { -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 28px), transparent); mask-image: linear-gradient(to bottom, #000 calc(100% - 28px), transparent); }
                .tocisland-list::-webkit-scrollbar { width: 6px; }
                .tocisland-list::-webkit-scrollbar-thumb { background: var(--toci-border); border-radius: 6px; }
                @supports selector(:has(*)) {
                    .tocisland-shell:has(.tocisland-pill[aria-expanded=false]:focus-visible) { box-shadow: inset 0 0 0 2px var(--toci-text); outline: 2px solid transparent; outline-offset: -2px; }
                    .tocisland-pill[aria-expanded=false]:focus-visible { outline: none; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .tocisland-root, .tocisland-shell, .tocisland-panel, .tocisland-chevron { transition: none !important; }
                }
            `}</style>

            <div
                className={`${cls}-shell`}
                style={{
                    // Collapsed: hug the header (the hidden panel can't widen it,
                    // see width:0 / minWidth:100% on the panel below).
                    // Expanded: use the configured max width.
                    width: isOpen
                        ? `min(${maxWidth}px, calc(100vw - 32px))`
                        : "max-content",
                    maxWidth: "calc(100vw - 32px)",
                    boxSizing: "border-box",
                    background: bgColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: outerRadius,
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    overflow: "hidden",
                    transition:
                        "border-radius .45s cubic-bezier(.22,1,.36,1), width .35s cubic-bezier(.22,1,.36,1)",
                }}
            >
                {/* Header / toggle — native button for keyboard support. Its
                    name is the label only: the percentage badge is
                    aria-hidden, so the name doesn't change while scrolling. */}
                <button
                    ref={btnRef}
                    type="button"
                    className={`${cls}-btn ${cls}-pill`}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    aria-label={navLabel}
                    aria-describedby={showProgress ? progressId : undefined}
                    onClick={() => {
                        if (isStatic) return
                        if (expanded) collapse()
                        else setExpanded(true)
                    }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        padding: "10px 12px",
                        cursor: isStatic ? "default" : "pointer",
                        userSelect: "none",
                        whiteSpace: "nowrap",
                    }}
                >
                    {showProgress && (
                        <svg
                            width={24}
                            height={24}
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            style={{ flex: "0 0 auto" }}
                        >
                            <circle
                                cx="12"
                                cy="12"
                                r={R}
                                fill="none"
                                stroke={trackColor}
                                strokeWidth="2.5"
                            />
                            <circle
                                cx="12"
                                cy="12"
                                r={R}
                                fill="none"
                                stroke={accentColor}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeDasharray={C}
                                strokeDashoffset={dash}
                                transform="rotate(-90 12 12)"
                                style={{
                                    transition: "stroke-dashoffset .2s linear",
                                }}
                            />
                        </svg>
                    )}

                    <span
                        style={{
                            color: textColor,
                            fontSize: 17,
                            fontWeight: 500,
                            letterSpacing: "-0.01em",
                        }}
                    >
                        {title}
                    </span>

                    <svg
                        width={14}
                        height={14}
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                        className={`${cls}-chevron`}
                        style={{
                            flex: "0 0 auto",
                            transform: isOpen
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                            transition: "transform .35s ease",
                            opacity: 0.75,
                        }}
                    >
                        <path
                            d="M6 9l6 6 6-6"
                            stroke={textColor}
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>

                    <div style={{ flex: 1, minWidth: 16 }} />

                    {showProgress && (
                        <span
                            aria-hidden="true"
                            style={{
                                flex: "0 0 auto",
                                background: badgeBg,
                                color: badgeText,
                                fontSize: 13,
                                fontWeight: 600,
                                padding: "5px 10px",
                                borderRadius: 999,
                                lineHeight: 1,
                            }}
                        >
                            {pct}%
                        </span>
                    )}
                </button>

                {/* Expandable panel (a <nav> landmark named by the label).
                    width:0 + minWidth:100% lets it match the pill's width without
                    ever forcing the collapsed pill wider than its header.
                    Collapsed: inert (effect above), aria-hidden, tabIndex -1 on
                    every entry, and visibility:hidden after the .45s close
                    animation, so even a long list's scroll container is no Tab
                    stop where inert isn't supported. All of it depends only on
                    props and initial state, so SSR and hydration match. */}
                <nav
                    ref={panelRef}
                    id={panelId}
                    className={`${cls}-panel`}
                    aria-label={navLabel}
                    aria-hidden={isOpen ? undefined : true}
                    style={{
                        width: 0,
                        minWidth: "100%",
                        // Animation cap only; the list itself is viewport-capped.
                        maxHeight: isOpen ? "640px" : 0,
                        opacity: isOpen ? 1 : 0,
                        overflow: "hidden",
                        // "inherit" (not "visible") when open, so a hidden
                        // pill (before Reveal After) also hides an open panel.
                        visibility: isOpen ? "inherit" : "hidden",
                        transition:
                            "max-height .45s cubic-bezier(.22,1,.36,1), opacity .3s ease, visibility 0s linear " +
                            (isOpen ? "0s" : ".45s"),
                    }}
                >
                    <div style={{ padding: "0 8px 8px" }}>
                        <div
                            style={{
                                background: panelBg,
                                borderRadius: panelRadius,
                                padding: "14px 16px",
                            }}
                        >
                            {/* Canvas / export only: setup hint while the
                                required Content ID is empty. */}
                            {isStatic && !contentKey && (
                                <div
                                    style={{
                                        color: mutedColor,
                                        fontSize: 12,
                                        lineHeight: 1.4,
                                        marginBottom: 12,
                                        paddingBottom: 10,
                                        borderBottom: `1px solid ${borderColor}`,
                                    }}
                                >
                                    Set Content ID to your article frame's
                                    Scroll Target name
                                </div>
                            )}

                            {showReadingTime && mins > 0 && (
                                <div
                                    style={{
                                        color: readLabelColor,
                                        fontSize: 11,
                                        fontWeight: 500,
                                        letterSpacing: "0.12em",
                                        textTransform: "uppercase",
                                        fontFamily:
                                            '"SF Mono", SFMono-Regular, ui-monospace, Menlo, monospace',
                                        marginBottom: 12,
                                    }}
                                >
                                    {mins} {readSuffix}
                                </div>
                            )}

                            {/* role="list": Safari / VoiceOver drops list
                                semantics when list-style is none. */}
                            <ul
                                ref={listRef}
                                role="list"
                                tabIndex={isOpen ? undefined : -1}
                                className={`${cls}-list${fade ? ` ${cls}-fade` : ""}`}
                                onScroll={updateFade}
                                style={{
                                    ...listReset,
                                    display: "flex",
                                    flexDirection: "column",
                                    overflowY: "auto",
                                    margin: "0 -4px",
                                }}
                            >
                                {groups.map((g) => (
                                    <li key={g.item.key} style={listReset}>
                                        {renderEntry(g.item)}
                                        {g.children.length > 0 && (
                                            <ul role="list" style={listReset}>
                                                {g.children.map((it) => (
                                                    <li
                                                        key={it.key}
                                                        style={listReset}
                                                    >
                                                        {renderEntry(it)}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </nav>
            </div>

            {/* Reading progress for assistive technology: the pill's
                description (aria-describedby), so its name stays the label.
                Not live, so it isn't announced on every scroll step. */}
            {showProgress && (
                <span id={progressId} style={SR_ONLY}>
                    {pct}% read
                </span>
            )}
        </div>
    )
}

addPropertyControls(ArticleTOCIsland, {
    contentId: {
        type: ControlType.String,
        title: "Content ID",
        defaultValue: "",
        placeholder: "article",
        description:
            "Required. Give the frame that holds your article a Scroll Target name, ideally simple, lowercase and without spaces (e.g. article), and enter the same name here. Only that frame is read; without a match the TOC stays hidden.",
    },
    title: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Contents",
    },
    includeH2: {
        type: ControlType.Boolean,
        title: "Include H2",
        defaultValue: true,
    },
    includeH3: {
        type: ControlType.Boolean,
        title: "Include H3",
        defaultValue: true,
    },
    showReadingTime: {
        type: ControlType.Boolean,
        title: "Reading Time",
        defaultValue: true,
    },
    readSuffix: {
        type: ControlType.String,
        title: "Read Label",
        defaultValue: "MIN READ",
        hidden: (p) => p.showReadingTime === false,
    },
    wordsPerMinute: {
        type: ControlType.Number,
        title: "Words/min",
        defaultValue: 225,
        min: 100,
        max: 400,
        step: 5,
        hidden: (p) => p.showReadingTime === false,
    },
    showProgress: {
        type: ControlType.Boolean,
        title: "Progress",
        defaultValue: true,
    },
    scrollOffset: {
        type: ControlType.Number,
        title: "Scroll Offset",
        defaultValue: 100,
        min: 0,
        max: 300,
        step: 5,
        unit: "px",
    },
    scrollPage: {
        type: ControlType.Boolean,
        title: "Scroll Page",
        defaultValue: true,
    },
    onSelect: {
        type: ControlType.EventHandler,
        title: "On Select",
    },
    dock: {
        type: ControlType.Enum,
        title: "Dock",
        defaultValue: "bottom",
        options: ["top", "bottom"],
        optionTitles: ["Top", "Bottom"],
        displaySegmentedControl: true,
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        defaultValue: "center",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
    },
    offsetX: {
        type: ControlType.Number,
        title: "Offset X",
        defaultValue: 24,
        min: 0,
        max: 200,
        unit: "px",
        hidden: (p) => p.align === "center",
    },
    offsetY: {
        type: ControlType.Number,
        title: "Offset Y",
        defaultValue: 32,
        min: 0,
        max: 200,
        unit: "px",
    },
    maxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        defaultValue: 360,
        min: 140,
        max: 520,
        unit: "px",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 26,
        min: 0,
        max: 60,
        unit: "px",
    },
    revealAfter: {
        type: ControlType.Number,
        title: "Reveal After",
        defaultValue: 150,
        min: 0,
        max: 1200,
        step: 10,
        unit: "px",
    },
    collapseOnSelect: {
        type: ControlType.Boolean,
        title: "Close on Click",
        defaultValue: true,
    },
    startExpanded: {
        type: ControlType.Boolean,
        title: "Start Open",
        defaultValue: false,
    },
    bgColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgb(10, 10, 10)",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "rgba(255, 255, 255, 0.12)",
    },
    panelBg: {
        type: ControlType.Color,
        title: "Panel",
        defaultValue: "rgba(255, 255, 255, 0.05)",
    },
    textColor: {
        type: ControlType.Color,
        title: "Label Text",
        defaultValue: "rgb(255, 255, 255)",
    },
    activeColor: {
        type: ControlType.Color,
        title: "Active Item",
        defaultValue: "rgb(255, 255, 255)",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Inactive Item",
        defaultValue: "rgb(140, 140, 140)",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Progress Ring",
        defaultValue: "rgb(255, 255, 255)",
        hidden: (p) => p.showProgress === false,
    },
    trackColor: {
        type: ControlType.Color,
        title: "Ring Track",
        defaultValue: "rgba(255, 255, 255, 0.18)",
        hidden: (p) => p.showProgress === false,
    },
    badgeBg: {
        type: ControlType.Color,
        title: "Badge BG",
        defaultValue: "rgba(255, 255, 255, 0.1)",
        hidden: (p) => p.showProgress === false,
    },
    badgeText: {
        type: ControlType.Color,
        title: "Badge Text",
        defaultValue: "rgb(255, 255, 255)",
        hidden: (p) => p.showProgress === false,
    },
    readLabelColor: {
        type: ControlType.Color,
        title: "Read Color",
        defaultValue: "rgb(140, 140, 140)",
        hidden: (p) => p.showReadingTime === false,
    },
})
