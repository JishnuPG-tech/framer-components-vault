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


/*
 * Glossary Tooltips — hover definitions for words in your page text
 * Add terms + definitions in the right panel. On the live site the component
 * finds those words in your text (including CMS Rich Text) and marks them.
 * Hover, tap or keyboard focus shows the definition.
 * Your text layers are never modified: marks are drawn in a layer on top.
 * Static rendering (canvas / export): no scanning, no animations — a static preview only.
 */

const { useEffect, useId } = React

interface Term {
    term: string
    aliases: string
    definition: string
    link: string
}

interface Highlight {
    style: "dotted" | "dashed" | "solid"
    color: string
    thickness: number
    offset: number
}

type Theme = "dark" | "light" | "auto"

interface Tip {
    theme: Theme
    radius: number
    maxWidth: number
    showTerm: boolean
    shadow: boolean
    linkLabel: string
    newTab: boolean
}

interface Props {
    terms: Term[]
    scope: "page" | "section"
    sectionId: string
    matchMode: "first" | "all"
    caseSensitive: boolean
    skipHeadings: boolean
    trigger: "hover" | "click"
    placement: "top" | "bottom"
    openDelay: number
    highlight: Highlight
    tooltip: Tip
    font: React.CSSProperties
    style?: React.CSSProperties
}

const HL: Highlight = {
    style: "dotted",
    color: "#6E7BF2",
    thickness: 1,
    offset: 3,
}
const TIP: Tip = {
    theme: "dark",
    radius: 8,
    maxWidth: 240,
    showTerm: true,
    shadow: true,
    linkLabel: "Learn more",
    newTab: true,
}

const MAX_MATCHES = 300
const WORD = /[\p{L}\p{N}_]/u
// Never mark text inside these (links and controls stay clickable)
const SKIP =
    "script,style,noscript,textarea,input,select,option,button,a,label,svg,code,pre,[contenteditable='true'],[aria-hidden='true'],[role='button']"

type Entry = { idx: number; needles: string[]; t: Term }
type Hit = { node: Text; start: number; end: number; entry: Entry }
type Match = {
    entry: Entry
    range: Range
    parent: Element
    text: string
    color: string
    fontSize: number
    pieces: HTMLButtonElement[]
    hidden: boolean
}

// Tooltip color tokens per theme
const THEMES = {
    dark: {
        bg: "rgba(20,20,22,0.92)",
        fg: "#F4F4F5",
        line: "rgba(255,255,255,0.08)",
    },
    light: {
        bg: "rgba(255,255,255,0.95)",
        fg: "#18181B",
        line: "rgba(0,0,0,0.08)",
    },
}
const SHADOW = "0 8px 24px -8px rgba(0,0,0,0.35)"
const vars = (t: (typeof THEMES)["dark"]) =>
    `--gt-bg:${t.bg};--gt-fg:${t.fg};--gt-line:${t.line};`

// Only typeface + weight come from the Font control; size and line-height stay fixed
const pickFont = (f?: React.CSSProperties): React.CSSProperties => ({
    ...(f?.fontFamily ? { fontFamily: f.fontFamily } : {}),
    ...(f?.fontWeight ? { fontWeight: f.fontWeight } : {}),
    ...(f?.fontStyle ? { fontStyle: f.fontStyle } : {}),
})

// Tooltip bubble styles, shared by the live layer and the static preview
function tipCss(cls: string, tip: Tip, accent: string): string {
    const c = `.${cls}`
    const theme =
        tip.theme === "auto"
            ? `${c}-tip{${vars(THEMES.light)}}@media (prefers-color-scheme: dark){${c}-tip{${vars(THEMES.dark)}}}`
            : `${c}-tip{${vars(THEMES[tip.theme] || THEMES.dark)}}`
    const glass =
        "-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);"
    return `${theme}
${c}-tip{position:absolute;left:0;top:0;box-sizing:border-box;pointer-events:auto;width:max-content;max-width:min(${tip.maxWidth}px,calc(100vw - 16px));padding:10px 12px;border-radius:${tip.radius}px;background:var(--gt-bg);${glass}color:var(--gt-fg);border:1px solid var(--gt-line);box-shadow:${tip.shadow ? SHADOW : "none"};font-family:Inter,system-ui,sans-serif;font-size:13px;line-height:1.45;font-weight:400;text-align:left;text-transform:none;letter-spacing:normal;-webkit-text-size-adjust:100%;text-size-adjust:100%;-webkit-font-smoothing:antialiased;opacity:0;visibility:hidden;transform:translateY(4px);transition:opacity .15s ease,transform .15s ease,visibility 0s linear .15s}
${c}-tip[data-side="bottom"]{transform:translateY(-4px)}
${c}-tip.is-open{opacity:1;visibility:visible;transform:none;transition:opacity .15s ease,transform .15s ease,visibility 0s}
${c}-term{display:block;font-size:11px;line-height:1.3;font-weight:600;text-transform:uppercase;letter-spacing:.04em;opacity:.6;margin:0 0 4px}
${c}-def{display:block;font-size:13px;line-height:1.45;opacity:.9;margin:0;white-space:pre-line}
${c}-link{display:inline-block;margin-top:6px;font-size:12px;line-height:1.4;font-weight:500;color:${accent};text-decoration:none}
${c}-link:hover{text-decoration:underline;text-underline-offset:3px}
${c}-link:focus-visible{outline:2px solid ${accent};outline-offset:2px;border-radius:4px}
${c}-arrow{position:absolute;width:6px;height:6px;box-sizing:content-box;background:var(--gt-bg);${glass}border:1px solid var(--gt-line);border-top-color:transparent;border-left-color:transparent;border-bottom-right-radius:1px;clip-path:polygon(100% 0,100% 100%,0 100%);left:var(--gt-ax,50%);bottom:-4px;transform:translateX(-50%) rotate(45deg);pointer-events:none}
${c}-tip[data-side="bottom"] ${c}-arrow{bottom:auto;top:-4px;transform:translateX(-50%) rotate(-135deg)}
@media (prefers-reduced-motion: reduce){${c}-tip,${c}-tip.is-open,${c}-tip[data-side="bottom"]{transition:none;transform:none}}`
}

// Static preview: same look, no transitions or animations
const staticCss = (cls: string) =>
    `.${cls}-tip,.${cls}-tip.is-open{transition:none!important;animation:none!important}`

interface Opts {
    cls: string
    tipId: string
    terms: Term[]
    scope: Props["scope"]
    sectionId: string
    first: boolean
    cs: boolean
    skipHeadings: boolean
    trigger: Props["trigger"]
    placement: Props["placement"]
    openDelay: number
    hl: Highlight
    tip: Tip
    font: React.CSSProperties
}

function buildEntries(terms: Term[], cs: boolean): Entry[] {
    return (terms || [])
        .map((t, idx) => {
            const raw = [t?.term || "", ...(t?.aliases || "").split(",")]
            const needles = raw
                .map((s) => s.trim())
                .filter(Boolean)
                .map((s) => (cs ? s : s.toLowerCase()))
            return { idx, needles, t }
        })
        .filter((e) => e.needles.length > 0 && (e.t.definition || "").trim())
        .sort(
            (a, b) =>
                Math.max(...b.needles.map((n) => n.length)) -
                Math.max(...a.needles.map((n) => n.length))
        )
}

// Walks text nodes in document order and finds whole-word matches
function scan(
    root: Element,
    entries: Entry[],
    cs: boolean,
    first: boolean,
    skipSel: string,
    layer: HTMLElement
): Hit[] {
    const out: Hit[] = []
    const used = new Set<number>()
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
            const p = n.parentElement
            if (
                !p ||
                layer.contains(p) ||
                !n.nodeValue ||
                !n.nodeValue.trim() ||
                p.closest(skipSel)
            )
                return NodeFilter.FILTER_REJECT
            return NodeFilter.FILTER_ACCEPT
        },
    })
    let n: Node | null
    while ((n = walker.nextNode()) && out.length < MAX_MATCHES) {
        const text = n.nodeValue || ""
        const lower = text.toLowerCase()
        // Lowercasing can change length for rare characters; fall back to exact matching
        const exact = cs || lower.length !== text.length
        const hay = exact ? text : lower
        const hits: { start: number; end: number; entry: Entry }[] = []
        for (const e of entries) {
            if (first && used.has(e.idx)) continue
            for (const nd of e.needles) {
                let i = hay.indexOf(nd)
                while (i !== -1) {
                    const j = i + nd.length
                    const bounded =
                        (i === 0 || !WORD.test(hay[i - 1])) &&
                        (j >= hay.length || !WORD.test(hay[j]))
                    if (bounded && !hits.some((h) => i < h.end && j > h.start))
                        hits.push({ start: i, end: j, entry: e })
                    i = hay.indexOf(nd, j)
                }
            }
        }
        hits.sort((a, b) => a.start - b.start)
        for (const h of hits) {
            if (first) {
                if (used.has(h.entry.idx)) continue
                used.add(h.entry.idx)
            }
            out.push({ node: n as Text, ...h })
        }
    }
    return out
}

function buildCss(o: Opts): string {
    const c = `.${o.cls}`
    const { hl } = o
    return `
${c}{position:fixed;inset:0;pointer-events:none;z-index:2147483000;overflow:hidden}
${c}-hit{position:absolute;left:0;top:0;margin:0;padding:0;border:0;background:none;color:transparent;font:inherit;box-sizing:border-box;pointer-events:auto;cursor:help;border-radius:2px;-webkit-tap-highlight-color:transparent}
${c}-hit::after{content:"";position:absolute;left:0;right:0;top:var(--gt-ul,100%);border-top:${hl.thickness}px ${hl.style} var(--gt-c,currentColor);transition:border-color .15s ease}
${c}-hit.is-hover::after,${c}-hit[aria-expanded="true"]::after{border-top-style:solid;border-top-color:${hl.color}}
${c}-hit:focus{outline:none}
${c}-hit:focus-visible{outline:2px solid ${hl.color};outline-offset:3px}
@media (prefers-reduced-motion: reduce){${c}-hit::after{transition:none}}
${tipCss(o.cls, o.tip, hl.color)}
`
}

// Imperative layer on document.body: marks + one tooltip. Returns cleanup.
function mountGlossary(o: Opts): () => void {
    const { cls } = o
    const entries = buildEntries(o.terms, o.cs)
    const skipSel = SKIP + (o.skipHeadings ? ",h1,h2,h3,h4,h5,h6,nav" : "")

    const layer = document.createElement("div")
    layer.className = cls
    const css = document.createElement("style")
    css.textContent = buildCss(o)
    const tip = document.createElement("div")
    tip.className = `${cls}-tip`
    tip.id = o.tipId
    tip.setAttribute("role", "tooltip")
    Object.assign(tip.style, pickFont(o.font))
    layer.append(css, tip)
    document.body.appendChild(layer)

    let matches: Match[] = []
    let active: Match | null = null
    let activePiece: HTMLButtonElement | null = null
    let byKeyboard = false
    let lastPointer = "mouse"
    let openT: any = 0
    let closeT: any = 0
    let scanT: any = 0
    let idleT: any = 0
    let raf = 0
    let loopUntil = 0

    const setExpanded = (m: Match, on: boolean) =>
        m.pieces.forEach((p) => {
            p.setAttribute("aria-expanded", String(on))
            if (on) p.setAttribute("aria-describedby", o.tipId)
            else p.removeAttribute("aria-describedby")
        })

    const hide = () => {
        clearTimeout(openT)
        clearTimeout(closeT)
        if (active) setExpanded(active, false)
        active = null
        activePiece = null
        tip.classList.remove("is-open")
    }
    const scheduleClose = () => {
        clearTimeout(closeT)
        closeT = setTimeout(hide, 140)
    }

    const place = () => {
        if (!active || !activePiece) return
        const r = activePiece.getBoundingClientRect()
        if (!r.width) return hide()
        const tw = tip.offsetWidth
        const th = tip.offsetHeight
        const vw = document.documentElement.clientWidth
        const vh = window.innerHeight
        const gap = 8 // word → bubble; the arrow sits inside this gap
        const above = r.top - th - gap
        const below = r.bottom + gap
        const fitsAbove = above >= 8
        const fitsBelow = below + th <= vh - 8
        // Preferred side, flip when it doesn't fit and the other side does
        const useAbove =
            o.placement === "top"
                ? fitsAbove || !fitsBelow
                : !fitsBelow && fitsAbove
        const top = Math.max(8, Math.min(useAbove ? above : below, vh - th - 8))
        const cx = r.left + r.width / 2
        const left = Math.max(8, Math.min(cx - tw / 2, vw - tw - 8))
        tip.style.left = `${Math.round(left)}px`
        tip.style.top = `${Math.round(top)}px`
        tip.style.setProperty(
            "--gt-ax",
            `${Math.round(Math.max(14, Math.min(cx - left, tw - 14)))}px`
        )
        tip.dataset.side = useAbove ? "top" : "bottom"
    }

    const show = (m: Match, piece: HTMLButtonElement, kbd = false) => {
        clearTimeout(openT)
        clearTimeout(closeT)
        if (active && active !== m) setExpanded(active, false)
        active = m
        activePiece = piece
        byKeyboard = kbd
        const t = m.entry.t
        tip.replaceChildren()
        if (o.tip.showTerm) {
            const h = document.createElement("div")
            h.className = `${cls}-term`
            h.textContent = t.term
            tip.appendChild(h)
        }
        const d = document.createElement("div")
        d.className = `${cls}-def`
        d.textContent = t.definition
        tip.appendChild(d)
        if (t.link) {
            const a = document.createElement("a")
            a.className = `${cls}-link`
            a.href = t.link
            if (o.tip.newTab) {
                a.target = "_blank"
                a.rel = "noopener noreferrer"
            }
            a.textContent = `${o.tip.linkLabel || "Learn more"} →`
            tip.appendChild(a)
        }
        const arrow = document.createElement("span")
        arrow.className = `${cls}-arrow`
        arrow.setAttribute("aria-hidden", "true")
        tip.appendChild(arrow)
        setExpanded(m, true)
        place()
        tip.classList.add("is-open")
    }

    const makePiece = (m: Match, firstPiece: boolean) => {
        const b = document.createElement("button")
        b.type = "button"
        b.className = `${cls}-hit`
        b.tabIndex = firstPiece ? 0 : -1
        b.setAttribute("aria-label", `${m.text}, show definition`)
        b.setAttribute("aria-expanded", "false")
        const hoverMode = () => o.trigger === "hover"
        b.addEventListener("pointerdown", (e) => (lastPointer = e.pointerType))
        b.addEventListener("pointerenter", (e) => {
            lastPointer = e.pointerType
            m.pieces.forEach((p) => p.classList.add("is-hover"))
            if (e.pointerType !== "mouse" || !hoverMode()) return
            clearTimeout(closeT)
            clearTimeout(openT)
            if (active === m) return
            openT = setTimeout(() => show(m, b), Math.max(0, o.openDelay))
        })
        b.addEventListener("pointerleave", (e) => {
            m.pieces.forEach((p) => p.classList.remove("is-hover"))
            if (e.pointerType !== "mouse" || !hoverMode()) return
            clearTimeout(openT)
            scheduleClose()
        })
        b.addEventListener("click", () => {
            const toggles = !hoverMode() || lastPointer !== "mouse"
            if (active === m && toggles) hide()
            else show(m, b)
        })
        b.addEventListener("focus", () => {
            if (active !== m && b.matches(":focus-visible")) show(m, b, true)
        })
        b.addEventListener("blur", (e) => {
            const to = e.relatedTarget as Node | null
            if (byKeyboard && active === m && !(to && tip.contains(to)))
                scheduleClose()
        })
        return b
    }

    const update = () => {
        raf = 0
        const vh = window.innerHeight
        for (const m of matches) {
            const rects = m.range.collapsed
                ? []
                : Array.from(m.range.getClientRects()).filter(
                      (r) => r.width > 0 && r.height > 0
                  )
            while (m.pieces.length < rects.length) {
                const p = makePiece(m, m.pieces.length === 0)
                layer.insertBefore(p, tip)
                m.pieces.push(p)
            }
            while (m.pieces.length > rects.length) m.pieces.pop()!.remove()
            rects.forEach((r, i) => {
                const p = m.pieces[i]
                const on = !m.hidden && r.bottom > -40 && r.top < vh + 40
                p.style.display = on ? "" : "none"
                if (!on) return
                p.style.transform = `translate(${r.left}px,${r.top}px)`
                p.style.width = `${r.width}px`
                p.style.height = `${r.height}px`
                // Baseline ≈ box bottom minus descent; underline sits `offset` px below it
                p.style.setProperty(
                    "--gt-ul",
                    `${Math.round(r.height - m.fontSize * 0.22 + o.hl.offset)}px`
                )
                p.style.setProperty("--gt-c", m.color)
            })
        }
        if (active) place()
        if (performance.now() < loopUntil) raf = requestAnimationFrame(update)
    }
    // Follow layout for a short while (covers scroll + appear animations), then stop
    const kick = (ms = 0) => {
        loopUntil = Math.max(loopUntil, performance.now() + ms)
        if (!raf) raf = requestAnimationFrame(update)
    }

    // Hide marks whose word is covered (sticky headers, overlays, menus)
    const occlude = () => {
        const vh = window.innerHeight
        for (const m of matches) {
            const r = m.range.collapsed ? null : m.range.getClientRects()[0]
            if (!r || !r.width || r.bottom < 0 || r.top > vh) continue
            const topEl = document
                .elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2)
                .find((el) => !layer.contains(el))
            if (!topEl) continue
            m.hidden = !(
                topEl === m.parent ||
                m.parent.contains(topEl) ||
                topEl.contains(m.parent)
            )
        }
        kick()
    }
    const scheduleIdle = () => {
        clearTimeout(idleT)
        idleT = setTimeout(occlude, 160)
    }

    const rescan = () => {
        if (active) {
            scanT = setTimeout(rescan, 800)
            return
        }
        for (const m of matches) m.pieces.forEach((p) => p.remove())
        matches = []
        const id = (o.sectionId || "").trim().replace(/^#/, "")
        const root =
            o.scope === "section"
                ? id
                    ? document.getElementById(id)
                    : null
                : document.body
        if (!root || !entries.length) return
        matches = scan(root, entries, o.cs, o.first, skipSel, layer).map(
            (h) => {
                const range = document.createRange()
                range.setStart(h.node, h.start)
                range.setEnd(h.node, h.end)
                const text = (h.node.nodeValue || "").slice(h.start, h.end)
                const parent = h.node.parentElement as Element
                const cs = getComputedStyle(parent)
                return {
                    entry: h.entry,
                    range,
                    parent,
                    text,
                    pieces: [],
                    hidden: false,
                    color: cs.color,
                    fontSize: parseFloat(cs.fontSize) || 16,
                }
            }
        )
        kick(1500)
        scheduleIdle()
    }

    const onScroll = () => {
        kick(1200)
        scheduleIdle()
    }
    const onDown = (e: PointerEvent) => {
        if (active && !layer.contains(e.target as Node)) hide()
    }
    const onKey = (e: KeyboardEvent) => {
        if (e.key !== "Escape" || !active) return
        const p = activePiece
        hide()
        p?.focus()
    }
    tip.addEventListener("pointerenter", () => clearTimeout(closeT))
    tip.addEventListener("pointerleave", (e) => {
        if (e.pointerType === "mouse" && o.trigger === "hover") scheduleClose()
    })
    tip.addEventListener("focusout", (e) => {
        const to = e.relatedTarget as Node | null
        if (!(to && (tip.contains(to) || to === activePiece))) scheduleClose()
    })

    window.addEventListener("scroll", onScroll, {
        capture: true,
        passive: true,
    })
    window.addEventListener("resize", onScroll)
    document.addEventListener("pointerdown", onDown, true)
    document.addEventListener("keydown", onKey)
    const ro =
        typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(onScroll)
            : null
    ro?.observe(document.body)
    const mo = new MutationObserver((recs) => {
        if (recs.every((r) => layer.contains(r.target))) return
        clearTimeout(scanT)
        scanT = setTimeout(rescan, 300)
    })
    mo.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
    })

    rescan()
    // Fonts/images can shift text after load
    document.fonts?.ready.then(() => kick(300)).catch(() => {})

    return () => {
        clearTimeout(openT)
        clearTimeout(closeT)
        clearTimeout(scanT)
        clearTimeout(idleT)
        if (raf) cancelAnimationFrame(raf)
        raf = 0
        loopUntil = 0
        window.removeEventListener("scroll", onScroll, { capture: true } as any)
        window.removeEventListener("resize", onScroll)
        document.removeEventListener("pointerdown", onDown, true)
        document.removeEventListener("keydown", onKey)
        ro?.disconnect()
        mo.disconnect()
        layer.remove()
    }
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight 200
 */
export default function GlossaryTooltips(props: Props) {
    const {
        terms,
        scope,
        sectionId,
        matchMode,
        caseSensitive,
        skipHeadings,
        trigger,
        placement,
        openDelay,
        font,
        style,
    } = props
    const hl: Highlight = { ...HL, ...props.highlight }
    if (!["dotted", "dashed", "solid"].includes(hl.style)) hl.style = "dotted" // e.g. old "marker" value
    const tip: Tip = { ...TIP, ...props.tooltip }
    // Canvas and export: static preview only (no scanning, timers, observers or animations)
    const isStatic = useIsStaticRenderer()
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
    const cls = `gt${uid}`

    const key = JSON.stringify({
        terms,
        scope,
        sectionId,
        matchMode,
        caseSensitive,
        skipHeadings,
        trigger,
        placement,
        openDelay,
        hl,
        tip,
        font,
    })

    useEffect(() => {
        if (isStatic || typeof document === "undefined") return
        return mountGlossary({
            cls,
            tipId: `${cls}-tip`,
            terms: terms || [],
            scope,
            sectionId,
            first: matchMode === "first",
            cs: caseSensitive,
            skipHeadings,
            trigger,
            placement,
            openDelay,
            hl,
            tip,
            font,
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, isStatic, cls])

    // Live site: takes zero space; everything is drawn in a layer on <body>
    if (!isStatic)
        return (
            <div
                aria-hidden="true"
                style={{
                    ...style,
                    width: 0,
                    height: 0,
                    minWidth: 0,
                    minHeight: 0,
                    padding: 0,
                    overflow: "hidden",
                    pointerEvents: "none",
                }}
            />
        )

    // Static: a non-animated preview of the look, plus what it will scan
    const valid = (terms || []).filter(
        (t) => t?.term?.trim() && t?.definition?.trim()
    )
    const sample = valid[0]
    const where =
        scope === "section"
            ? sectionId
                ? `#${sectionId.replace(/^#/, "")}`
                : "a section (set its ID)"
            : "the page"

    return (
        <div
            style={{
                ...style,
                width: 360,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                padding: 20,
                borderRadius: 16,
                border: "1px dashed rgba(128,128,128,0.4)",
                background: "rgba(128,128,128,0.06)",
                fontFamily: "Inter, system-ui, sans-serif",
                color: "#8E939E",
            }}
        >
            {sample ? (
                <>
                    <style>{tipCss(cls, tip, hl.color) + staticCss(cls)}</style>
                    <div
                        className={`${cls}-tip is-open`}
                        data-side="top"
                        style={{
                            position: "relative",
                            alignSelf: "flex-start",
                            maxWidth: tip.maxWidth,
                            ["--gt-ax" as any]: "30px",
                            ...pickFont(font),
                        }}
                    >
                        {tip.showTerm && (
                            <div className={`${cls}-term`}>{sample.term}</div>
                        )}
                        <div className={`${cls}-def`}>{sample.definition}</div>
                        {sample.link && (
                            <span className={`${cls}-link`}>
                                {tip.linkLabel || "Learn more"} →
                            </span>
                        )}
                        <span className={`${cls}-arrow`} aria-hidden="true" />
                    </div>
                    <div
                        style={{ fontSize: 15, lineHeight: 1.5, marginTop: -4 }}
                    >
                        <span
                            style={{
                                textDecorationLine: "underline",
                                textDecorationStyle: "solid",
                                textDecorationColor: hl.color,
                                textDecorationThickness: hl.thickness,
                                textUnderlineOffset: hl.offset,
                            }}
                        >
                            {sample.term}
                        </span>{" "}
                        gets a definition, and so does{" "}
                        <span
                            style={{
                                textDecorationLine: "underline",
                                textDecorationStyle: hl.style,
                                textDecorationThickness: hl.thickness,
                                textUnderlineOffset: hl.offset,
                            }}
                        >
                            {valid[1]?.term || sample.term}
                        </span>
                        .
                    </div>
                    <div
                        style={{
                            fontSize: 11.5,
                            letterSpacing: 0.2,
                            opacity: 0.85,
                        }}
                    >
                        Glossary · {valid.length}{" "}
                        {valid.length === 1 ? "term" : "terms"} · marks words in{" "}
                        {where} on the live site
                    </div>
                </>
            ) : (
                <div
                    style={{
                        textAlign: "center",
                        fontSize: 13,
                        lineHeight: 1.5,
                    }}
                >
                    Add terms and definitions in the right panel.
                    <br />
                    Matching words on your page get a tooltip.
                </div>
            )}
        </div>
    )
}

GlossaryTooltips.displayName = "Glossary Tooltips"

addPropertyControls(GlossaryTooltips, {
    terms: {
        type: ControlType.Array,
        title: "Terms",
        maxCount: 60,
        control: {
            type: ControlType.Object,
            controls: {
                term: {
                    type: ControlType.String,
                    title: "Term",
                    defaultValue: "Term",
                },
                aliases: {
                    type: ControlType.String,
                    title: "Also Match",
                    placeholder: "plural, synonym",
                    defaultValue: "",
                },
                definition: {
                    type: ControlType.String,
                    title: "Definition",
                    displayTextArea: true,
                    defaultValue: "A short, plain-language explanation.",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: [
            {
                term: "APR",
                aliases: "annual percentage rate",
                link: "",
                definition:
                    "The yearly cost of borrowing, including interest and fees, shown as a percentage.",
            },
            {
                term: "MRR",
                aliases: "monthly recurring revenue",
                link: "",
                definition:
                    "Predictable income from subscriptions, counted once a month.",
            },
            {
                term: "Churn",
                aliases: "churn rate",
                link: "",
                definition:
                    "The share of customers who stop using a product in a given period.",
            },
            {
                term: "API",
                aliases: "",
                link: "",
                definition:
                    "A set of rules that lets two pieces of software talk to each other.",
            },
        ],
    },
    scope: {
        type: ControlType.Enum,
        title: "Scan",
        options: ["page", "section"],
        optionTitles: ["Whole Page", "One Section"],
        displaySegmentedControl: true,
        defaultValue: "page",
    },
    sectionId: {
        type: ControlType.String,
        title: "Section ID",
        placeholder: "article",
        defaultValue: "",
        description: "The ID set on a frame (Layer → Scroll Section ID).",
        hidden: (p: any) => p.scope !== "section",
    },
    matchMode: {
        type: ControlType.Enum,
        title: "Mark",
        options: ["first", "all"],
        optionTitles: ["First Only", "Every Time"],
        displaySegmentedControl: true,
        defaultValue: "first",
    },
    caseSensitive: {
        type: ControlType.Boolean,
        title: "Match Case",
        defaultValue: false,
    },
    skipHeadings: {
        type: ControlType.Boolean,
        title: "Skip Titles",
        defaultValue: true,
    },
    trigger: {
        type: ControlType.Enum,
        title: "Open On",
        options: ["hover", "click"],
        optionTitles: ["Hover", "Click"],
        displaySegmentedControl: true,
        defaultValue: "hover",
    },
    placement: {
        type: ControlType.Enum,
        title: "Position",
        options: ["top", "bottom"],
        optionTitles: ["Above", "Below"],
        displaySegmentedControl: true,
        defaultValue: "top",
    },
    openDelay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 120,
        min: 0,
        max: 1000,
        step: 10,
        unit: "ms",
        hidden: (p: any) => p.trigger !== "hover",
    },
    highlight: {
        type: ControlType.Object,
        title: "Underline",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["dotted", "dashed", "solid"],
                optionTitles: ["Dotted", "Dashed", "Solid"],
                displaySegmentedControl: true,
                defaultValue: HL.style,
            },
            thickness: {
                type: ControlType.Number,
                title: "Thickness",
                defaultValue: HL.thickness,
                min: 1,
                max: 4,
                step: 0.5,
                unit: "px",
            },
            offset: {
                type: ControlType.Number,
                title: "Offset",
                defaultValue: HL.offset,
                min: 0,
                max: 8,
                step: 0.5,
                unit: "px",
            },
            color: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: HL.color,
                description:
                    "Underline on hover and link color. At rest the line uses the text's own color.",
            },
        },
    },
    tooltip: {
        type: ControlType.Object,
        title: "Tooltip",
        controls: {
            theme: {
                type: ControlType.Enum,
                title: "Theme",
                options: ["dark", "light", "auto"],
                optionTitles: ["Dark", "Light", "Auto"],
                displaySegmentedControl: true,
                defaultValue: TIP.theme,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: TIP.radius,
                min: 0,
                max: 16,
            },
            maxWidth: {
                type: ControlType.Number,
                title: "Max Width",
                defaultValue: TIP.maxWidth,
                min: 160,
                max: 400,
                step: 10,
            },
            showTerm: {
                type: ControlType.Boolean,
                title: "Show Term",
                defaultValue: TIP.showTerm,
            },
            shadow: {
                type: ControlType.Boolean,
                title: "Shadow",
                defaultValue: TIP.shadow,
            },
            linkLabel: {
                type: ControlType.String,
                title: "Link Label",
                defaultValue: TIP.linkLabel,
            },
            newTab: {
                type: ControlType.Boolean,
                title: "New Tab",
                defaultValue: TIP.newTab,
            },
        },
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        defaultFontType: "sans-serif",
    },
})
