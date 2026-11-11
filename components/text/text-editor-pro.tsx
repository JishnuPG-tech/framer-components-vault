// Inkwell — floating toolbar rich text editor
//
// Marketplace compliance
// 1. Static renderer: the exported entry calls useIsStaticRenderer() first and
//    returns <StaticView />, built from plain divs only — no motion components,
//    transitions, filters, listeners, observers, timers, storage, network,
//    contentEditable or injected styles reach the canvas / export path.
// 2. Offscreen work: there is no requestAnimationFrame loop, interval or
//    autoplay anywhere. Live work is purely event-driven (selection, input,
//    scroll, resize, clicks) and only happens while someone interacts. The few
//    short one-shot timeouts (autosave debounce, status flashes) are tracked
//    and cleared on unmount. Motion honours prefers-reduced-motion.
// 3. Data handling: the component makes no network requests. Drafts stay in
//    the visitor's own browser (optional localStorage autosave). The send
//    button only opens the visitor's mail app with a prefilled draft they
//    send themselves, or fires a Framer interaction event.

import * as React from "react"
import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

/* ------------------------------------------------------------------ */
/* Types + defaults                                                    */
/* ------------------------------------------------------------------ */

type Palette = {
    background: string
    border: string
    text: string
    muted: string
    accent: string
    alert: string
    toolbar: string
    toolbarText: string
}

type Tools = { link: boolean; color: boolean; align: boolean; clear: boolean }
type Chrome = {
    radius: number
    padding: number
    showHeader: boolean
    showFooter: boolean
}
type SendVia = "email" | "event"

type Props = {
    label: string
    heading: string
    body: string
    placeholder: string
    readOnly: boolean
    wordGoal: number
    charLimit: number
    autosave: boolean
    saveKey: string
    exportMenu: boolean
    submit: boolean
    sendVia: SendVia
    mailTo: string
    mailSubject: string
    askName: boolean
    askEmail: boolean
    buttonText: string
    doneText: string
    clearAfter: boolean
    onSubmit?: () => void
    tools: Partial<Tools>
    swatches: string[]
    palette: Partial<Palette>
    font: Record<string, any>
    headingFont: Record<string, any>
    chrome: Partial<Chrome>
    style?: React.CSSProperties
}

const BASE = {
    label: "Working draft",
    heading: "A quieter way to shape your words",
    body: "Highlight any phrase in this note and a compact toolbar rises right above it. Turn a line into a heading, tint a word, drop in a link or shift the alignment without ever leaving the page.\n\nEvery change lands in place and is kept on this device, so a refresh never costs a sentence. When the draft feels right, export it or send it on.",
    placeholder: "Start writing here…",
    wordGoal: 120,
    charLimit: 0,
    saveKey: "draft-one",
    buttonText: "Send draft",
    doneText: "Received, thank you",
    mailSubject: "New message",
    tools: { link: true, color: true, align: true, clear: true } as Tools,
    swatches: [
        "#F4F4F5",
        "#FF8A8A",
        "#FFC861",
        "#7EE2A8",
        "#7FB6FF",
        "#B9A2FF",
    ],
    palette: {
        background: "#141417",
        border: "rgba(255,255,255,0.08)",
        text: "#ECECEF",
        muted: "#8B8B95",
        accent: "#9C8CFF",
        alert: "#FF8A7A",
        toolbar: "#202025",
        toolbarText: "#E7E7EB",
    } as Palette,
    chrome: {
        radius: 22,
        padding: 32,
        showHeader: true,
        showFooter: true,
    } as Chrome,
}

type BlockTag = "p" | "h2" | "h3" | "blockquote" | "ul" | "ol"

const BLOCKS: { tag: BlockTag; name: string; badge: string }[] = [
    { tag: "p", name: "Plain text", badge: "Aa" },
    { tag: "h2", name: "Large title", badge: "T1" },
    { tag: "h3", name: "Small title", badge: "T2" },
    { tag: "blockquote", name: "Pull quote", badge: "“”" },
    { tag: "ul", name: "Dotted list", badge: "••" },
    { tag: "ol", name: "Counted list", badge: "1." },
]

type Align = "left" | "center" | "right"
type Panel = "block" | "link" | "color" | null
type SendState = "idle" | "sending" | "sent" | "error"
type SaveState = "off" | "idle" | "saving" | "saved"

type ActiveState = {
    bold: boolean
    italic: boolean
    underline: boolean
    strike: boolean
    link: boolean
    block: BlockTag
    align: Align
}

const IDLE: ActiveState = {
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    link: false,
    block: "p",
    align: "left",
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const esc = (s: string) =>
    s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")

const splitBody = (body: string) =>
    (body || "")
        .split(/\n\s*\n/)
        .map((s) => s.trim())
        .filter(Boolean)

const seedHtml = (heading: string, body: string) => {
    const head = heading?.trim() ? `<h2>${esc(heading.trim())}</h2>` : ""
    const paras = splitBody(body)
        .map((s) => `<p>${esc(s).replace(/\n/g, "<br>")}</p>`)
        .join("")
    return head + paras
}

const cssSize = (v: any, fallback: string) =>
    v === undefined || v === null || v === ""
        ? fallback
        : typeof v === "number"
          ? `${v}px`
          : String(v)

function tint(color: string, alpha: number) {
    const s = (color || "").trim()
    const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
    if (hex) {
        let h = hex[1]
        if (h.length === 3)
            h = h
                .split("")
                .map((c) => c + c)
                .join("")
        const n = parseInt(h, 16)
        return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
    }
    const fn = s.match(/^rgba?\(([^)]+)\)$/i)
    if (fn) {
        const parts = fn[1].split(/[\s,\/]+/).filter(Boolean)
        if (parts.length >= 3)
            return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`
    }
    return s
}

function resolve(props: Props) {
    return {
        palette: { ...BASE.palette, ...(props.palette || {}) } as Palette,
        tools: { ...BASE.tools, ...(props.tools || {}) } as Tools,
        chrome: { ...BASE.chrome, ...(props.chrome || {}) } as Chrome,
        swatches:
            props.swatches && props.swatches.length
                ? props.swatches
                : BASE.swatches,
    }
}

const plainText = (el: HTMLElement) =>
    (el.innerText || "")
        .replace(/​/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim()

function toMarkdown(root: HTMLElement): string {
    const inline = (node: Node): string => {
        if (node.nodeType === 3)
            return (node.textContent || "").replace(/​/g, "")
        if (node.nodeType !== 1) return ""
        const el = node as HTMLElement
        const tag = el.tagName.toLowerCase()
        if (tag === "br") return "  \n"
        let inner = Array.from(el.childNodes).map(inline).join("")
        if (!inner.trim()) return inner
        const st = el.style
        const lead = inner.match(/^\s*/)?.[0] ?? ""
        const tail = inner.match(/\s*$/)?.[0] ?? ""
        let core = inner.trim()
        const bold =
            tag === "b" ||
            tag === "strong" ||
            /bold|[6-9]00/.test(st.fontWeight || "")
        const ital = tag === "i" || tag === "em" || st.fontStyle === "italic"
        const strike =
            tag === "s" ||
            tag === "strike" ||
            tag === "del" ||
            /line-through/.test(
                (st.textDecoration || "") + (st.textDecorationLine || "")
            )
        if (strike) core = `~~${core}~~`
        if (ital) core = `_${core}_`
        if (bold) core = `**${core}**`
        if (tag === "a") core = `[${core}](${el.getAttribute("href") || ""})`
        return lead + core + tail
    }
    const out: string[] = []
    root.childNodes.forEach((n) => {
        if (n.nodeType === 3) {
            const t = inline(n).trim()
            if (t) out.push(t)
            return
        }
        if (n.nodeType !== 1) return
        const el = n as HTMLElement
        const tag = el.tagName.toLowerCase()
        if (tag === "h2") out.push("## " + inline(el).trim())
        else if (tag === "h3") out.push("### " + inline(el).trim())
        else if (tag === "blockquote")
            out.push(
                inline(el)
                    .trim()
                    .split("\n")
                    .map((l) => "> " + l.trim())
                    .join("\n")
            )
        else if (tag === "ul" || tag === "ol")
            out.push(
                Array.from(el.children)
                    .map(
                        (li, i) =>
                            (tag === "ul" ? "- " : `${i + 1}. `) +
                            inline(li).trim()
                    )
                    .join("\n")
            )
        else {
            const t = inline(el).trim()
            if (t) out.push(t)
        }
    })
    return out.join("\n\n")
}

const slug = (s: string) =>
    (s || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48) || "draft"

/* ------------------------------------------------------------------ */
/* Glyphs (pure SVG, shared safely by both paths)                      */
/* ------------------------------------------------------------------ */

const PATHS = {
    bold: "M7 5h5.5a3.5 3.5 0 0 1 0 7H7z M7 12h6.5a3.5 3.5 0 0 1 0 7H7z",
    italic: "M18 5h-7 M13 19H6 M15 5 9 19",
    underline: "M7 4v7a5 5 0 0 0 10 0V4 M5 20h14",
    strike: "M4 12h16 M16.5 7.5C15.8 5.6 14.1 4.5 12 4.5c-2.6 0-4.4 1.4-4.4 3.3 0 1.2.6 2.1 1.9 2.7 M7.6 16.3c.7 1.9 2.4 3.2 4.6 3.2 2.7 0 4.4-1.4 4.4-3.3 0-.6-.1-1.1-.4-1.6",
    link: "M10 14a4.5 4.5 0 0 0 6.4 0l2.8-2.8a4.5 4.5 0 0 0-6.4-6.4l-1 1 M14 10a4.5 4.5 0 0 0-6.4 0l-2.8 2.8a4.5 4.5 0 0 0 6.4 6.4l1-1",
    left: "M4 6h16 M4 10.5h10 M4 15h16 M4 19.5h10",
    center: "M4 6h16 M7 10.5h10 M4 15h16 M7 19.5h10",
    right: "M4 6h16 M10 10.5h10 M4 15h16 M10 19.5h10",
    eraser: "M9 20h11 M4.9 14.6l8.5-8.5a2 2 0 0 1 2.8 0l2.7 2.7a2 2 0 0 1 0 2.8L12 18.5H8.8z M9.5 10l5.5 5.5",
    chevron: "M7 10l5 5 5-5",
    undo: "M9 14 4 9l5-5 M4 9h10.5a5.5 5.5 0 0 1 0 11H11",
    redo: "M15 14l5-5-5-5 M20 9H9.5a5.5 5.5 0 0 0 0 11H13",
    copy: "M9 9h10v10H9z M15 9V5H5v10h4",
    check: "M5 12.5l4.5 4.5L19 7.5",
    enter: "M19 5v6a3 3 0 0 1-3 3H6 M10 10l-4 4 4 4",
    cross: "M7 7l10 10 M17 7 7 17",
    ink: "M6.5 17 12 4.5 17.5 17 M8.6 12.5h6.8",
    share: "M12 15V4 M7.5 8.5 12 4l4.5 4.5 M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5",
    download: "M12 4v11 M7.5 10.5 12 15l4.5-4.5 M5 20h14",
    send: "M4.5 12 20 4.5 15.5 20l-3.5-6.5z M12 13.5 20 4.5",
    page: "M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z M14 3.5v4h4",
    restore: "M4 12a8 8 0 1 0 2.3-5.6 M4 4v4h4",
}

function Glyph({
    d,
    size = 16,
    weight = 1.8,
}: {
    d: string
    size?: number
    weight?: number
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={weight}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ display: "block", flexShrink: 0 }}
        >
            <path d={d} />
        </svg>
    )
}

/* ------------------------------------------------------------------ */
/* Entry                                                               */
/* ------------------------------------------------------------------ */

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Inkwell(props: Props) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StaticView {...props} />
    return <LiveView {...props} />
}

/* ------------------------------------------------------------------ */
/* Static view — plain divs only                                       */
/* ------------------------------------------------------------------ */

function StaticView(props: Props) {
    const { palette: c, chrome, tools } = resolve(props)
    const paras = splitBody(props.body ?? BASE.body)
    const heading = props.heading ?? BASE.heading
    const hf = props.headingFont || {}
    const first = paras[0] || ""
    const cut = first.split(" ").slice(0, 3).join(" ")
    const rest = first.slice(cut.length)
    const showFields = props.submit && (props.askName || props.askEmail)

    const btn = (d: string, on = false) => (
        <div
            style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: on ? c.accent : c.toolbarText,
                background: on ? tint(c.accent, 0.18) : "transparent",
            }}
        >
            <Glyph d={d} />
        </div>
    )
    const rule = (
        <div
            style={{
                width: 1,
                height: 18,
                background: tint(c.toolbarText, 0.14),
                margin: "0 4px",
            }}
        />
    )
    const field = (text: string) => (
        <div
            style={{
                flex: 1,
                height: 36,
                borderRadius: 10,
                border: `1px solid ${c.border}`,
                background: tint(c.text, 0.03),
                color: c.muted,
                display: "flex",
                alignItems: "center",
                padding: "0 12px",
                fontSize: 13,
            }}
        >
            {text}
        </div>
    )

    return (
        <div
            style={{
                ...props.style,
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                background: c.background,
                border: `1px solid ${c.border}`,
                borderRadius: chrome.radius,
                overflow: "hidden",
                color: c.text,
                ...(props.font || {}),
            }}
        >
            {chrome.showHeader && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: `12px ${chrome.padding}px`,
                        borderBottom: `1px solid ${c.border}`,
                        fontSize: 13,
                        lineHeight: "18px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            color: c.muted,
                        }}
                    >
                        <div
                            style={{
                                width: 7,
                                height: 7,
                                borderRadius: 7,
                                background: c.accent,
                            }}
                        />
                        {props.label ?? BASE.label}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            color: c.muted,
                        }}
                    >
                        {!props.readOnly && <Glyph d={PATHS.undo} size={15} />}
                        {!props.readOnly && <Glyph d={PATHS.redo} size={15} />}
                        {props.exportMenu !== false && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                }}
                            >
                                <Glyph d={PATHS.share} size={15} /> Export
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    overflow: "hidden",
                    padding: chrome.padding,
                }}
            >
                {heading.trim() && (
                    <div
                        style={{
                            fontWeight: 600,
                            fontSize: cssSize(hf.fontSize, "30px"),
                            lineHeight: cssSize(hf.lineHeight, "1.15em"),
                            letterSpacing: cssSize(
                                hf.letterSpacing,
                                "-0.025em"
                            ),
                            ...hf,
                            marginBottom: 18,
                        }}
                    >
                        {heading}
                    </div>
                )}
                {!props.readOnly && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-start",
                            marginBottom: 12,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                padding: 5,
                                borderRadius: 14,
                                background: c.toolbar,
                                border: `1px solid ${tint(c.toolbarText, 0.1)}`,
                                boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
                                fontSize: 13,
                                color: c.toolbarText,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "0 8px",
                                    height: 30,
                                }}
                            >
                                Plain text <Glyph d={PATHS.chevron} size={14} />
                            </div>
                            {rule}
                            {btn(PATHS.bold, true)}
                            {btn(PATHS.italic)}
                            {btn(PATHS.underline)}
                            {btn(PATHS.strike)}
                            {(tools.link || tools.color || tools.align) && rule}
                            {tools.link && btn(PATHS.link)}
                            {tools.color && btn(PATHS.ink)}
                            {tools.align && btn(PATHS.left)}
                            {tools.clear && rule}
                            {tools.clear && btn(PATHS.eraser)}
                        </div>
                    </div>
                )}
                {first && (
                    <div style={{ margin: "0 0 0.85em" }}>
                        <span
                            style={{
                                background: props.readOnly
                                    ? "transparent"
                                    : tint(c.accent, 0.32),
                                borderRadius: 3,
                                fontWeight: props.readOnly ? undefined : 700,
                            }}
                        >
                            {cut}
                        </span>
                        {rest}
                    </div>
                )}
                {paras.slice(1).map((p, i) => (
                    <div key={i} style={{ margin: "0 0 0.85em" }}>
                        {p}
                    </div>
                ))}
            </div>
            {showFields && (
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        padding: `0 ${chrome.padding}px 14px`,
                    }}
                >
                    {props.askName && field("Your name")}
                    {props.askEmail && field("Email address")}
                </div>
            )}
            {chrome.showFooter && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: `12px ${chrome.padding}px`,
                        borderTop: `1px solid ${c.border}`,
                        fontSize: 12,
                        lineHeight: "16px",
                        color: c.muted,
                        minHeight: 58,
                        boxSizing: "border-box",
                    }}
                >
                    <div>Words · Characters · Read time</div>
                    {props.submit && (
                        <div
                            style={{
                                height: 34,
                                padding: "0 14px",
                                borderRadius: 10,
                                background: c.accent,
                                color: c.background,
                                display: "flex",
                                alignItems: "center",
                                gap: 7,
                                fontSize: 13,
                                fontWeight: 600,
                            }}
                        >
                            <Glyph d={PATHS.send} size={14} />
                            {props.buttonText || BASE.buttonText}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Live view                                                           */
/* ------------------------------------------------------------------ */

type Spot = { x: number; y: number; below: boolean; nub: number; up: boolean }

function LiveView(props: Props) {
    const { palette: c, chrome, tools, swatches } = resolve(props)
    const heading = props.heading ?? BASE.heading
    const body = props.body ?? BASE.body
    const goal = Math.max(0, props.wordGoal ?? BASE.wordGoal)
    const limit = Math.max(0, props.charLimit ?? 0)
    const readOnly = !!props.readOnly
    const autosave = props.autosave !== false && !readOnly
    const storeKey = "inkwell:" + (props.saveKey || BASE.saveKey)
    const showExport = props.exportMenu !== false
    const reduced = useReducedMotion()

    const scope = "ink" + useId().replace(/[^a-zA-Z0-9]/g, "")
    const hostRef = useRef<HTMLDivElement>(null)
    const editorRef = useRef<HTMLDivElement>(null)
    const barRef = useRef<HTMLDivElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const savedRange = useRef<Range | null>(null)
    const panelRef = useRef<Panel>(null)
    const menuOpenRef = useRef(false)
    const timers = useRef<Set<number>>(new Set())
    const saveTimer = useRef<number | undefined>(undefined)
    const live = useRef({ limit, readOnly, autosave, storeKey })
    live.current = { limit, readOnly, autosave, storeKey }

    const [open, setOpen] = useState(false)
    const [spot, setSpot] = useState<Spot>({
        x: 0,
        y: 0,
        below: false,
        nub: 0,
        up: false,
    })
    const [panel, setPanelState] = useState<Panel>(null)
    const [active, setActive] = useState<ActiveState>(IDLE)
    const [stats, setStats] = useState({ words: 0, chars: 0 })
    const [empty, setEmpty] = useState(false)
    const [href, setHref] = useState("")
    const [flash, setFlash] = useState<string | null>(null)
    const [tip, setTip] = useState<{ text: string; x: number } | null>(null)
    const [menuOpen, setMenuOpenState] = useState(false)
    const [saveState, setSaveState] = useState<SaveState>(
        autosave ? "idle" : "off"
    )
    const [sendState, setSendState] = useState<SendState>("idle")
    const [formErr, setFormErr] = useState<string | null>(null)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")

    const later = (fn: () => void, ms: number) => {
        const id = window.setTimeout(() => {
            timers.current.delete(id)
            fn()
        }, ms)
        timers.current.add(id)
        return id
    }

    const setPanel = (p: Panel) => {
        panelRef.current = p
        setPanelState(p)
        if (p) setTip(null)
    }
    const setMenuOpen = (v: boolean) => {
        menuOpenRef.current = v
        setMenuOpenState(v)
    }

    /* ---------- selection utilities ---------- */

    const liveRange = useCallback((): Range | null => {
        const sel = typeof window !== "undefined" ? window.getSelection() : null
        const el = editorRef.current
        if (!sel || sel.rangeCount === 0 || !el) return null
        const r = sel.getRangeAt(0)
        return el.contains(r.commonAncestorContainer) ? r : null
    }, [])

    const restore = useCallback(() => {
        const r = savedRange.current
        const el = editorRef.current
        if (!r || !el) return
        el.focus({ preventScroll: true })
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(r)
    }, [])

    const place = useCallback((r: Range) => {
        const host = hostRef.current
        if (!host) return
        const hr = host.getBoundingClientRect()
        let rr = r.getBoundingClientRect()
        if (!rr.width && !rr.height) {
            const list = r.getClientRects()
            if (list.length) rr = list[0]
        }
        const bw = barRef.current?.offsetWidth ?? 400
        const bh = barRef.current?.offsetHeight ?? 42
        const half = bw / 2
        const target = rr.left + rr.width / 2 - hr.left
        const lo = half + 10
        const hi = Math.max(lo, hr.width - half - 10)
        const x =
            hr.width < bw + 20
                ? hr.width / 2
                : Math.min(Math.max(target, lo), hi)
        let y = rr.top - hr.top - bh - 14
        let below = false
        if (y < 10) {
            y = rr.bottom - hr.top + 14
            below = true
        }
        y = Math.min(y, Math.max(10, hr.height - bh - 10))
        const up = y > hr.height - (y + bh)
        setSpot({
            x,
            y,
            below,
            nub: Math.max(-half + 18, Math.min(half - 18, target - x)),
            up,
        })
    }, [])

    const refresh = useCallback(() => {
        const q = (cmd: string) => {
            try {
                return document.queryCommandState(cmd)
            } catch {
                return false
            }
        }
        const r = liveRange()
        const el = editorRef.current
        let block: BlockTag = "p"
        let link = false
        if (r && el) {
            let n: Node | null = r.startContainer
            let found = false
            while (n && n !== el) {
                if (n.nodeType === 1) {
                    const t = (n as HTMLElement).tagName.toLowerCase()
                    if (t === "a") link = true
                    if (
                        !found &&
                        (t === "h2" ||
                            t === "h3" ||
                            t === "blockquote" ||
                            t === "ul" ||
                            t === "ol")
                    ) {
                        block = t as BlockTag
                        found = true
                    }
                }
                n = n.parentNode
            }
        }
        const align: Align = q("justifyCenter")
            ? "center"
            : q("justifyRight")
              ? "right"
              : "left"
        setActive({
            bold: q("bold"),
            italic: q("italic"),
            underline: q("underline"),
            strike: q("strikeThrough"),
            link,
            block,
            align,
        })
    }, [liveRange])

    const measure = useCallback(() => {
        const el = editorRef.current
        if (!el) return
        const text = plainText(el)
        setStats({
            words: text ? text.split(/\s+/).length : 0,
            chars: text.length,
        })
        setEmpty(!text && !el.querySelector("li"))
    }, [])

    /* ---------- storage ---------- */

    const persist = useCallback(() => {
        const { autosave: on, storeKey: key } = live.current
        if (!on) return
        window.clearTimeout(saveTimer.current)
        setSaveState("saving")
        saveTimer.current = window.setTimeout(() => {
            try {
                localStorage.setItem(key, editorRef.current?.innerHTML ?? "")
                setSaveState("saved")
            } catch {
                setSaveState("idle")
            }
        }, 600)
    }, [])

    const forget = () => {
        try {
            localStorage.removeItem(live.current.storeKey)
        } catch {}
    }

    /* ---------- seed content ---------- */

    useEffect(() => {
        const el = editorRef.current
        if (!el) return
        let stored: string | null = null
        if (autosave) {
            try {
                stored = localStorage.getItem(storeKey)
            } catch {}
        }
        el.innerHTML = stored ?? seedHtml(heading, body)
        setSaveState(autosave ? (stored ? "saved" : "idle") : "off")
        try {
            document.execCommand("defaultParagraphSeparator", false, "p")
        } catch {}
        measure()
    }, [heading, body, autosave, storeKey, measure])

    /* ---------- listeners ---------- */

    useEffect(() => {
        const onSelect = () => {
            if (live.current.readOnly) return
            if (panelRef.current === "link") return
            const r = liveRange()
            if (r && !r.collapsed && r.toString().trim().length > 0) {
                savedRange.current = r.cloneRange()
                setOpen(true)
                place(r)
                refresh()
            } else {
                setOpen(false)
                setPanel(null)
                setTip(null)
            }
        }
        const onDown = (e: PointerEvent) => {
            const t = e.target as Node
            const bar = barRef.current
            if (!(bar && bar.contains(t)) && panelRef.current) setPanel(null)
            const menu = menuRef.current
            if (menuOpenRef.current && !(menu && menu.contains(t)))
                setMenuOpen(false)
        }
        const onResize = () => {
            const r = savedRange.current
            if (r && panelRef.current !== "link") place(r)
        }
        const el = editorRef.current
        const onBefore = (e: InputEvent) => {
            const cap = live.current.limit
            if (!cap || !el) return
            const type = e.inputType || ""
            if (!type.startsWith("insert")) return
            const sel = window.getSelection()
            const replacing =
                sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed
            if (!replacing && plainText(el).length >= cap) e.preventDefault()
        }
        document.addEventListener("selectionchange", onSelect)
        document.addEventListener("pointerdown", onDown, true)
        window.addEventListener("resize", onResize)
        el?.addEventListener("beforeinput", onBefore as EventListener)
        return () => {
            document.removeEventListener("selectionchange", onSelect)
            document.removeEventListener("pointerdown", onDown, true)
            window.removeEventListener("resize", onResize)
            el?.removeEventListener("beforeinput", onBefore as EventListener)
        }
    }, [liveRange, place, refresh])

    useEffect(
        () => () => {
            timers.current.forEach((id) => window.clearTimeout(id))
            timers.current.clear()
            window.clearTimeout(saveTimer.current)
        },
        []
    )

    useLayoutEffect(() => {
        if (!open) return
        const r = savedRange.current
        if (r) place(r)
    }, [open, place])

    /* ---------- formatting commands ---------- */

    const afterEdit = () => {
        measure()
        refresh()
        persist()
    }

    const run = (cmd: string, value?: string) => {
        const el = editorRef.current
        if (!el) return
        if (document.activeElement !== el) restore()
        try {
            document.execCommand(cmd, false, value)
        } catch {}
        afterEdit()
        const r = liveRange()
        if (r && !r.collapsed) {
            savedRange.current = r.cloneRange()
            place(r)
        }
    }

    const listCmd = (t: BlockTag) =>
        t === "ul" ? "insertUnorderedList" : "insertOrderedList"

    const setBlock = (tag: BlockTag) => {
        const cur = active.block
        const curList = cur === "ul" || cur === "ol"
        const nextList = tag === "ul" || tag === "ol"
        if (curList) run(listCmd(cur))
        if (nextList) {
            if (tag !== cur) run(listCmd(tag))
            else run("formatBlock", "<p>")
        } else {
            run("formatBlock", `<${tag}>`)
        }
        setPanel(null)
    }

    const cycleAlign = () => {
        const next: Align =
            active.align === "left"
                ? "center"
                : active.align === "center"
                  ? "right"
                  : "left"
        run(
            next === "left"
                ? "justifyLeft"
                : next === "center"
                  ? "justifyCenter"
                  : "justifyRight"
        )
    }

    const paint = (mode: "ink" | "marker", color: string | null) => {
        if (document.activeElement !== editorRef.current) restore()
        try {
            document.execCommand("styleWithCSS", false, "true")
        } catch {}
        if (mode === "ink") run("foreColor", color ?? c.text)
        else run("hiliteColor", color ? tint(color, 0.34) : "transparent")
        try {
            document.execCommand("styleWithCSS", false, "false")
        } catch {}
    }

    const wipe = () => {
        if (active.block === "ul" || active.block === "ol")
            run(listCmd(active.block))
        run("removeFormat")
        run("unlink")
        run("formatBlock", "<p>")
        setPanel(null)
    }

    const openLink = () => {
        const r = liveRange() ?? savedRange.current
        if (!r) return
        savedRange.current = r.cloneRange()
        let existing = ""
        let n: Node | null = r.startContainer
        while (n && n !== editorRef.current) {
            if (n.nodeType === 1 && (n as HTMLElement).tagName === "A") {
                existing = (n as HTMLAnchorElement).getAttribute("href") || ""
                break
            }
            n = n.parentNode
        }
        setHref(existing)
        setPanel(panelRef.current === "link" ? null : "link")
    }

    const commitLink = (remove = false) => {
        let url = href.trim()
        setPanel(null)
        restore()
        if (remove || !url) {
            run("unlink")
        } else {
            if (!/^(https?:|mailto:|tel:|#|\/)/i.test(url))
                url = "https://" + url
            run("createLink", url)
            editorRef.current?.querySelectorAll("a").forEach((a) => {
                a.setAttribute("target", "_blank")
                a.setAttribute("rel", "noopener noreferrer")
            })
        }
    }

    const history = (cmd: "undo" | "redo") => {
        editorRef.current?.focus({ preventScroll: true })
        try {
            document.execCommand(cmd)
        } catch {}
        afterEdit()
    }

    /* ---------- export ---------- */

    const ping = (msg: string) => {
        setFlash(msg)
        later(() => setFlash(null), 1600)
    }

    const docTitle = () => {
        const el = editorRef.current
        const h = el?.querySelector("h2,h3")?.textContent?.trim()
        return h || props.label || BASE.label
    }

    const grab = (kind: "html" | "md" | "txt") => {
        const el = editorRef.current
        if (!el) return ""
        return kind === "html"
            ? el.innerHTML
            : kind === "md"
              ? toMarkdown(el)
              : plainText(el)
    }

    const copyAs = async (kind: "html" | "md" | "txt") => {
        const data = grab(kind)
        try {
            await navigator.clipboard.writeText(data)
            ping("Copied")
        } catch {
            ping("Copy blocked")
        }
        setMenuOpen(false)
    }

    const downloadAs = (kind: "html" | "md" | "txt") => {
        let data = grab(kind)
        const title = docTitle()
        if (kind === "html")
            data = `<!doctype html>\n<html><head><meta charset="utf-8"><title>${esc(
                title
            )}</title></head>\n<body>\n${data}\n</body></html>\n`
        const mime =
            kind === "html"
                ? "text/html"
                : kind === "md"
                  ? "text/markdown"
                  : "text/plain"
        try {
            const blob = new Blob([data], { type: `${mime};charset=utf-8` })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `${slug(title)}.${kind}`
            document.body.appendChild(a)
            a.click()
            a.remove()
            later(() => URL.revokeObjectURL(url), 2000)
            ping("Saved file")
        } catch {
            ping("Download blocked")
        }
        setMenuOpen(false)
    }

    const clearPage = () => {
        const el = editorRef.current
        if (!el) return
        el.innerHTML = "<p><br></p>"
        afterEdit()
        setMenuOpen(false)
        el.focus({ preventScroll: true })
    }

    const restoreStarter = () => {
        const el = editorRef.current
        if (!el) return
        forget()
        el.innerHTML = seedHtml(heading, body)
        measure()
        setSaveState(autosave ? "idle" : "off")
        setMenuOpen(false)
    }

    /* ---------- submit ---------- */

    const sendDraft = () => {
        if (sendState === "sending") return
        const el = editorRef.current
        if (!el) return
        const text = plainText(el)
        setFormErr(null)
        if (!text) return setFormErr("Write something first")
        if (limit && text.length > limit)
            return setFormErr(`Trim to ${limit} characters`)
        if (props.askName && !name.trim()) return setFormErr("Add your name")
        if (props.askEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
            return setFormErr("Add a valid email")

        // No network requests: the draft never leaves the page from here.
        // "Email App" hands a prefilled draft to the visitor's own mail app,
        // where they review and send it themselves; "Interaction" only fires
        // the Framer event so the site can show an overlay, variant, etc.
        const via: SendVia = props.sendVia === "email" ? "email" : "event"
        setSendState("sending")
        try {
            if (via === "email") {
                const lines = [
                    props.askName ? `From: ${name.trim()}` : "",
                    props.askEmail ? `Reply to: ${email.trim()}` : "",
                    "",
                    toMarkdown(el),
                ]
                    .filter((l, i) => l || i > 1)
                    .join("\n")
                const subject = encodeURIComponent(
                    props.mailSubject || BASE.mailSubject
                )
                const mailBody = encodeURIComponent(lines)
                window.location.href = `mailto:${(props.mailTo || "").trim()}?subject=${subject}&body=${mailBody}`
            }
            props.onSubmit?.()
            setSendState("sent")
            if (props.clearAfter) {
                el.innerHTML = "<p><br></p>"
                forget()
                setName("")
                setEmail("")
                measure()
                setSaveState(autosave ? "idle" : "off")
            }
            later(() => setSendState("idle"), 2800)
        } catch {
            setSendState("error")
            setFormErr("Could not send, try again")
            later(() => setSendState("idle"), 2800)
        }
    }

    /* ---------- keyboard / paste / scroll ---------- */

    const onKeyDown = (e: React.KeyboardEvent) => {
        const mod = e.metaKey || e.ctrlKey
        if (e.key === "Escape") {
            setPanel(null)
            setOpen(false)
            return
        }
        if (mod && e.key.toLowerCase() === "k") {
            e.preventDefault()
            const r = liveRange()
            if (r && !r.collapsed) openLink()
            return
        }
        if (mod && e.shiftKey && e.key.toLowerCase() === "x") {
            e.preventDefault()
            run("strikeThrough")
            return
        }
        if (mod && e.key === "Enter" && props.submit) {
            e.preventDefault()
            sendDraft()
        }
    }

    const onPaste = (e: React.ClipboardEvent) => {
        let text = e.clipboardData?.getData("text/plain")
        if (text == null) return
        e.preventDefault()
        const el = editorRef.current
        if (limit && el) {
            const sel = window.getSelection()
            const replaced =
                sel && sel.rangeCount ? sel.getRangeAt(0).toString().length : 0
            const room = Math.max(0, limit - plainText(el).length + replaced)
            text = text.slice(0, room)
            if (!text) return
        }
        run("insertText", text)
    }

    const onScroll = () => {
        const r = savedRange.current
        if (open && r) place(r)
    }

    /* ---------- derived ---------- */

    const blockMeta = BLOCKS.find((b) => b.tag === active.block) ?? BLOCKS[0]
    const minutes = Math.max(1, Math.round(stats.words / 220))
    const progress = goal > 0 ? Math.min(1, stats.words / goal) : 0
    const overLimit = limit > 0 && stats.chars >= limit
    const showFields = props.submit && (props.askName || props.askEmail)
    const hf = props.headingFont || {}
    const spring = reduced
        ? { duration: 0 }
        : { type: "spring" as const, stiffness: 560, damping: 36, mass: 0.7 }
    const glide = reduced
        ? { duration: 0 }
        : { type: "spring" as const, stiffness: 420, damping: 40 }

    const scopedCss = `
.${scope}-ed{outline:none;caret-color:${c.accent};min-height:100%;box-sizing:border-box;word-break:break-word}
.${scope}-ed > *{margin:0 0 0.85em}
.${scope}-ed > *:last-child{margin-bottom:0}
.${scope}-ed h2,.${scope}-ed h3{color:${c.text};font-weight:600;font-family:${hf.fontFamily || "inherit"};${
        hf.fontWeight ? `font-weight:${hf.fontWeight};` : ""
    }${hf.fontStyle ? `font-style:${hf.fontStyle};` : ""}letter-spacing:${cssSize(hf.letterSpacing, "-0.025em")};line-height:${cssSize(
        hf.lineHeight,
        "1.15em"
    )}}
.${scope}-ed h2{font-size:${cssSize(hf.fontSize, "30px")};margin-bottom:0.55em}
.${scope}-ed h3{font-size:calc(${cssSize(hf.fontSize, "30px")} * 0.68);margin-bottom:0.5em}
.${scope}-ed blockquote{margin-left:0;padding:0.15em 0 0.15em 1em;border-left:2px solid ${c.accent};color:${c.muted};font-style:italic}
.${scope}-ed ul,.${scope}-ed ol{padding-left:1.35em}
.${scope}-ed li{margin:0.25em 0}
.${scope}-ed li::marker{color:${c.accent}}
.${scope}-ed a{color:${c.accent};text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}
.${scope}-ed ::selection{background:${tint(c.accent, 0.32)}}
.${scope}-scroll{scrollbar-width:thin;scrollbar-color:${c.border} transparent}
.${scope}-tool{appearance:none;border:0;margin:0;padding:0;font:inherit;cursor:pointer;background:transparent;color:${c.toolbarText};display:flex;align-items:center;justify-content:center;border-radius:9px;transition:background .16s ease,color .16s ease}
.${scope}-tool:hover{background:${tint(c.toolbarText, 0.08)}}
.${scope}-tool[data-on="true"]{background:${tint(c.accent, 0.2)};color:${c.accent}}
.${scope}-tool:focus-visible,.${scope}-ghost:focus-visible,.${scope}-row:focus-visible,.${scope}-send:focus-visible{outline:2px solid ${c.accent};outline-offset:1px}
.${scope}-ghost{appearance:none;border:0;margin:0;font:inherit;cursor:pointer;background:transparent;color:${c.muted};display:flex;align-items:center;gap:6px;border-radius:8px;padding:5px 7px;transition:background .16s ease,color .16s ease}
.${scope}-ghost:hover,.${scope}-ghost[data-on="true"]{background:${tint(c.text, 0.06)};color:${c.text}}
.${scope}-row{appearance:none;border:0;margin:0;font:inherit;cursor:pointer;width:100%;display:flex;align-items:center;gap:10px;padding:7px 8px;border-radius:9px;background:transparent;color:${c.toolbarText};text-align:left}
.${scope}-row:hover{background:${tint(c.toolbarText, 0.07)}}
.${scope}-dot{appearance:none;margin:0;padding:0;cursor:pointer;width:22px;height:22px;border-radius:50%;border:1px solid ${tint(
        c.toolbarText,
        0.16
    )};transition:transform .16s ease}
.${scope}-dot:hover{transform:scale(1.14)}
.${scope}-input{flex:1;min-width:0;height:32px;border-radius:9px;border:1px solid ${tint(
        c.toolbarText,
        0.12
    )};background:${tint(c.toolbarText, 0.05)};color:${c.toolbarText};padding:0 10px;font:inherit;font-size:13px;outline:none}
.${scope}-input:focus{border-color:${c.accent}}
.${scope}-input::placeholder{color:${tint(c.toolbarText, 0.4)}}
.${scope}-field{flex:1;min-width:0;height:36px;border-radius:10px;border:1px solid ${c.border};background:${tint(
        c.text,
        0.03
    )};color:${c.text};padding:0 12px;font:inherit;font-size:13px;outline:none;transition:border-color .16s ease,background .16s ease}
.${scope}-field:focus{border-color:${c.accent};background:${tint(c.text, 0.05)}}
.${scope}-field::placeholder{color:${c.muted}}
.${scope}-send{appearance:none;border:0;margin:0;font:inherit;cursor:pointer;height:34px;padding:0 14px;border-radius:10px;display:flex;align-items:center;gap:7px;font-size:13px;font-weight:600;white-space:nowrap}
.${scope}-send[disabled]{cursor:default}
@keyframes ${scope}-spin{to{transform:rotate(360deg)}}
`

    const hover = (text: string) => (e: React.MouseEvent<HTMLElement>) => {
        if (panelRef.current) return
        const t = e.currentTarget
        setTip({ text, x: t.offsetLeft + t.offsetWidth / 2 })
    }
    const keep = (e: React.MouseEvent) => {
        const tag = (e.target as HTMLElement).tagName
        if (tag !== "INPUT") e.preventDefault()
    }

    const tool = ({
        d,
        name: label,
        on,
        act,
    }: {
        d: string
        name: string
        on?: boolean
        act: () => void
    }) => (
        <motion.button
            key={label}
            type="button"
            className={`${scope}-tool`}
            data-on={on ? "true" : "false"}
            aria-label={label}
            aria-pressed={!!on}
            whileTap={reduced ? undefined : { scale: 0.88 }}
            onMouseEnter={hover(label)}
            onMouseLeave={() => setTip(null)}
            onClick={act}
            style={{ width: 30, height: 30 }}
        >
            <Glyph d={d} />
        </motion.button>
    )

    const rule = () => (
        <div
            style={{
                width: 1,
                height: 18,
                background: tint(c.toolbarText, 0.14),
                margin: "0 4px",
                flexShrink: 0,
            }}
        />
    )

    const menuItem = (
        d: string,
        text: string,
        act: () => void,
        hint?: string
    ) => (
        <button
            key={text}
            type="button"
            className={`${scope}-row`}
            onClick={act}
            style={{ fontSize: 13 }}
        >
            <span style={{ display: "flex", opacity: 0.75 }}>
                <Glyph d={d} size={15} />
            </span>
            <span style={{ flex: 1 }}>{text}</span>
            {hint && (
                <span
                    style={{ fontSize: 11, color: tint(c.toolbarText, 0.45) }}
                >
                    {hint}
                </span>
            )}
        </button>
    )
    const menuRule = (k: string) => (
        <div
            key={k}
            style={{
                height: 1,
                background: tint(c.toolbarText, 0.08),
                margin: "5px 4px",
            }}
        />
    )

    const sideStyle: React.CSSProperties = spot.up
        ? { bottom: "calc(100% + 8px)" }
        : { top: "calc(100% + 8px)" }
    const panelShell: React.CSSProperties = {
        position: "absolute",
        ...sideStyle,
        background: c.toolbar,
        border: `1px solid ${tint(c.toolbarText, 0.1)}`,
        borderRadius: 14,
        boxShadow: "0 18px 40px rgba(0,0,0,0.38), 0 2px 6px rgba(0,0,0,0.2)",
        padding: 6,
        boxSizing: "border-box",
        zIndex: 2,
    }
    const panelMotion = {
        initial: { opacity: 0, y: spot.up ? 6 : -6, scale: 0.97 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: spot.up ? 4 : -4, scale: 0.98 },
        transition: spring,
    }

    const alignGlyph =
        active.align === "center"
            ? PATHS.center
            : active.align === "right"
              ? PATHS.right
              : PATHS.left
    const ringR = 7
    const ringC = 2 * Math.PI * ringR

    const saveLabel =
        saveState === "saving"
            ? "Saving…"
            : saveState === "saved"
              ? "Kept on this device"
              : null

    const sendLabel =
        sendState === "sending"
            ? "Sending…"
            : sendState === "sent"
              ? props.doneText || BASE.doneText
              : sendState === "error"
                ? "Try again"
                : props.buttonText || BASE.buttonText
    const sendBg = sendState === "error" ? c.alert : c.accent

    return (
        <div
            ref={hostRef}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                background: c.background,
                border: `1px solid ${c.border}`,
                borderRadius: chrome.radius,
                overflow: "hidden",
                color: c.text,
                ...(props.font || {}),
            }}
        >
            <style>{scopedCss}</style>

            {/* ---------- header ---------- */}
            {chrome.showHeader && (
                <div
                    style={{
                        position: "relative",
                        zIndex: 40,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: `9px ${Math.max(12, chrome.padding - 7)}px 9px ${chrome.padding}px`,
                        borderBottom: `1px solid ${c.border}`,
                        fontSize: 13,
                        lineHeight: "18px",
                        flexShrink: 0,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            color: c.muted,
                            minWidth: 0,
                        }}
                    >
                        <div
                            style={{
                                width: 7,
                                height: 7,
                                borderRadius: 7,
                                background: c.accent,
                                flexShrink: 0,
                            }}
                        />
                        <span
                            style={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {props.label ?? BASE.label}
                        </span>
                        <AnimatePresence mode="wait">
                            {saveLabel && (
                                <motion.span
                                    key={saveLabel}
                                    initial={{ opacity: 0, x: -4 }}
                                    animate={{ opacity: 0.75, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={
                                        reduced
                                            ? { duration: 0 }
                                            : { duration: 0.2 }
                                    }
                                    style={{
                                        fontSize: 12,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    · {saveLabel}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                    <div
                        ref={menuRef}
                        style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                        }}
                    >
                        {!readOnly && (
                            <button
                                type="button"
                                className={`${scope}-ghost`}
                                aria-label="Step back"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => history("undo")}
                            >
                                <Glyph d={PATHS.undo} size={15} />
                            </button>
                        )}
                        {!readOnly && (
                            <button
                                type="button"
                                className={`${scope}-ghost`}
                                aria-label="Step forward"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => history("redo")}
                            >
                                <Glyph d={PATHS.redo} size={15} />
                            </button>
                        )}
                        {showExport && (
                            <button
                                type="button"
                                className={`${scope}-ghost`}
                                aria-haspopup="menu"
                                aria-expanded={menuOpen}
                                data-on={menuOpen ? "true" : "false"}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setMenuOpen(!menuOpen)}
                                style={{
                                    fontSize: 12.5,
                                    color: flash ? c.accent : undefined,
                                }}
                            >
                                <Glyph
                                    d={flash ? PATHS.check : PATHS.share}
                                    size={15}
                                />
                                {flash || "Export"}
                            </button>
                        )}
                        <AnimatePresence>
                            {menuOpen && (
                                <motion.div
                                    key="menu"
                                    role="menu"
                                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                    transition={spring}
                                    onMouseDown={(e) => e.preventDefault()}
                                    style={{
                                        position: "absolute",
                                        top: "calc(100% + 8px)",
                                        right: 0,
                                        width: 232,
                                        padding: 6,
                                        borderRadius: 14,
                                        background: c.toolbar,
                                        border: `1px solid ${tint(c.toolbarText, 0.1)}`,
                                        boxShadow:
                                            "0 18px 40px rgba(0,0,0,0.38), 0 2px 6px rgba(0,0,0,0.2)",
                                        transformOrigin: "100% 0%",
                                        boxSizing: "border-box",
                                    }}
                                >
                                    {menuItem(
                                        PATHS.copy,
                                        "Copy as Markdown",
                                        () => copyAs("md")
                                    )}
                                    {menuItem(PATHS.copy, "Copy as HTML", () =>
                                        copyAs("html")
                                    )}
                                    {menuItem(
                                        PATHS.copy,
                                        "Copy as plain text",
                                        () => copyAs("txt")
                                    )}
                                    {menuRule("r1")}
                                    {menuItem(
                                        PATHS.download,
                                        "Download",
                                        () => downloadAs("md"),
                                        ".md"
                                    )}
                                    {menuItem(
                                        PATHS.download,
                                        "Download",
                                        () => downloadAs("html"),
                                        ".html"
                                    )}
                                    {menuItem(
                                        PATHS.download,
                                        "Download",
                                        () => downloadAs("txt"),
                                        ".txt"
                                    )}
                                    {!readOnly && menuRule("r2")}
                                    {!readOnly &&
                                        menuItem(
                                            PATHS.page,
                                            "Blank page",
                                            clearPage
                                        )}
                                    {!readOnly &&
                                        menuItem(
                                            PATHS.restore,
                                            "Restore starter text",
                                            restoreStarter
                                        )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* ---------- writing area ---------- */}
            <div
                className={`${scope}-scroll`}
                onScroll={onScroll}
                style={{
                    position: "relative",
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                }}
            >
                {empty && !readOnly && (
                    <div
                        style={{
                            position: "absolute",
                            top: chrome.padding,
                            left: chrome.padding,
                            right: chrome.padding,
                            color: c.muted,
                            pointerEvents: "none",
                            opacity: 0.7,
                        }}
                    >
                        {props.placeholder ?? BASE.placeholder}
                    </div>
                )}
                <div
                    ref={editorRef}
                    className={`${scope}-ed`}
                    contentEditable={!readOnly}
                    suppressContentEditableWarning
                    spellCheck={false}
                    role="textbox"
                    aria-multiline="true"
                    aria-readonly={readOnly}
                    aria-label="Text editor"
                    onInput={afterEdit}
                    onKeyDown={onKeyDown}
                    onKeyUp={refresh}
                    onPaste={onPaste}
                    style={{ padding: chrome.padding }}
                />
            </div>

            {/* ---------- sender fields ---------- */}
            {showFields && !readOnly && (
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        padding: `2px ${chrome.padding}px 14px`,
                        flexShrink: 0,
                    }}
                >
                    {props.askName && (
                        <input
                            className={`${scope}-field`}
                            value={name}
                            placeholder="Your name"
                            autoComplete="name"
                            onChange={(e) => {
                                setName(e.target.value)
                                setFormErr(null)
                            }}
                        />
                    )}
                    {props.askEmail && (
                        <input
                            className={`${scope}-field`}
                            type="email"
                            value={email}
                            placeholder="Email address"
                            autoComplete="email"
                            onChange={(e) => {
                                setEmail(e.target.value)
                                setFormErr(null)
                            }}
                        />
                    )}
                </div>
            )}

            {/* ---------- footer ---------- */}
            {chrome.showFooter && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: `12px ${chrome.padding}px`,
                        borderTop: `1px solid ${c.border}`,
                        fontSize: 12,
                        lineHeight: "16px",
                        color: c.muted,
                        flexShrink: 0,
                        minHeight: 58,
                        boxSizing: "border-box",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            minWidth: 0,
                            whiteSpace: "nowrap",
                        }}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            {formErr ? (
                                <motion.span
                                    key="err"
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={
                                        reduced
                                            ? { duration: 0 }
                                            : { duration: 0.18 }
                                    }
                                    style={{ color: c.alert }}
                                >
                                    {formErr}
                                </motion.span>
                            ) : (
                                <motion.span
                                    key="stats"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={
                                        reduced
                                            ? { duration: 0 }
                                            : { duration: 0.18 }
                                    }
                                    style={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {stats.words}{" "}
                                    {stats.words === 1 ? "word" : "words"} ·{" "}
                                    <span
                                        style={{
                                            color: overLimit
                                                ? c.alert
                                                : undefined,
                                        }}
                                    >
                                        {limit
                                            ? `${stats.chars} / ${limit}`
                                            : `${stats.chars} chars`}
                                    </span>{" "}
                                    · {minutes} min
                                </motion.span>
                            )}
                        </AnimatePresence>
                        {goal > 0 && !formErr && (
                            <svg
                                width={18}
                                height={18}
                                viewBox="0 0 18 18"
                                aria-label="Word goal progress"
                                style={{ flexShrink: 0 }}
                            >
                                <circle
                                    cx={9}
                                    cy={9}
                                    r={ringR}
                                    fill="none"
                                    stroke={c.border}
                                    strokeWidth={2}
                                />
                                <motion.circle
                                    cx={9}
                                    cy={9}
                                    r={ringR}
                                    fill="none"
                                    stroke={
                                        progress >= 1
                                            ? c.accent
                                            : tint(c.accent, 0.75)
                                    }
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeDasharray={ringC}
                                    initial={false}
                                    animate={{
                                        strokeDashoffset:
                                            ringC * (1 - progress),
                                    }}
                                    transition={
                                        reduced
                                            ? { duration: 0 }
                                            : {
                                                  duration: 0.4,
                                                  ease: [0.3, 0.7, 0.2, 1],
                                              }
                                    }
                                    style={{
                                        rotate: -90,
                                        transformOrigin: "9px 9px",
                                    }}
                                />
                            </svg>
                        )}
                    </div>

                    {props.submit && !readOnly ? (
                        <motion.button
                            type="button"
                            className={`${scope}-send`}
                            disabled={sendState === "sending"}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={sendDraft}
                            whileTap={
                                reduced || sendState !== "idle"
                                    ? undefined
                                    : { scale: 0.96 }
                            }
                            animate={{ backgroundColor: sendBg }}
                            transition={
                                reduced ? { duration: 0 } : { duration: 0.25 }
                            }
                            style={{
                                color: c.background,
                                backgroundColor: sendBg,
                            }}
                        >
                            {sendState === "sending" ? (
                                <span
                                    style={{
                                        width: 13,
                                        height: 13,
                                        borderRadius: "50%",
                                        border: `2px solid ${tint(c.background, 0.35)}`,
                                        borderTopColor: c.background,
                                        animation: reduced
                                            ? undefined
                                            : `${scope}-spin .7s linear infinite`,
                                        boxSizing: "border-box",
                                    }}
                                />
                            ) : (
                                <Glyph
                                    d={
                                        sendState === "sent"
                                            ? PATHS.check
                                            : PATHS.send
                                    }
                                    size={14}
                                    weight={2}
                                />
                            )}
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.span
                                    key={sendLabel}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={
                                        reduced
                                            ? { duration: 0 }
                                            : { duration: 0.16 }
                                    }
                                >
                                    {sendLabel}
                                </motion.span>
                            </AnimatePresence>
                        </motion.button>
                    ) : (
                        !readOnly && (
                            <div style={{ whiteSpace: "nowrap", opacity: 0.8 }}>
                                Highlight words to style them
                            </div>
                        )
                    )}
                </div>
            )}

            {/* ---------- floating toolbar ---------- */}
            <AnimatePresence>
                {open && !readOnly && (
                    <motion.div
                        key="bar"
                        ref={barRef}
                        role="toolbar"
                        aria-label="Text formatting"
                        onMouseDown={keep}
                        initial={{
                            opacity: 0,
                            y: spot.below ? -6 : 6,
                            scale: 0.95,
                            left: spot.x,
                            top: spot.y,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            left: spot.x,
                            top: spot.y,
                        }}
                        exit={{
                            opacity: 0,
                            y: spot.below ? -4 : 4,
                            scale: 0.97,
                        }}
                        transition={{ ...spring, left: glide, top: glide }}
                        style={{
                            position: "absolute",
                            x: "-50%",
                            zIndex: 30,
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            padding: 5,
                            borderRadius: 14,
                            background: c.toolbar,
                            border: `1px solid ${tint(c.toolbarText, 0.1)}`,
                            boxShadow:
                                "0 16px 38px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.22)",
                            fontSize: 13,
                            lineHeight: "18px",
                            color: c.toolbarText,
                            whiteSpace: "nowrap",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                left: `calc(50% + ${spot.nub}px)`,
                                [spot.below ? "top" : "bottom"]: -5,
                                width: 9,
                                height: 9,
                                marginLeft: -4.5,
                                background: c.toolbar,
                                borderRight: `1px solid ${tint(c.toolbarText, 0.1)}`,
                                borderBottom: `1px solid ${tint(c.toolbarText, 0.1)}`,
                                transform: `rotate(${spot.below ? 225 : 45}deg)`,
                                borderRadius: 2,
                            }}
                        />

                        <motion.button
                            type="button"
                            className={`${scope}-tool`}
                            data-on={panel === "block" ? "true" : "false"}
                            aria-haspopup="menu"
                            aria-expanded={panel === "block"}
                            onClick={() =>
                                setPanel(panel === "block" ? null : "block")
                            }
                            style={{
                                height: 30,
                                padding: "0 8px 0 10px",
                                gap: 6,
                                minWidth: 104,
                                justifyContent: "space-between",
                            }}
                        >
                            <span>{blockMeta.name}</span>
                            <motion.span
                                animate={{
                                    rotate: panel === "block" ? 180 : 0,
                                }}
                                transition={spring}
                                style={{ display: "flex", opacity: 0.7 }}
                            >
                                <Glyph d={PATHS.chevron} size={14} />
                            </motion.span>
                        </motion.button>

                        {rule()}
                        {tool({
                            d: PATHS.bold,
                            name: "Bold  ⌘B",
                            on: active.bold,
                            act: () => run("bold"),
                        })}
                        {tool({
                            d: PATHS.italic,
                            name: "Italic  ⌘I",
                            on: active.italic,
                            act: () => run("italic"),
                        })}
                        {tool({
                            d: PATHS.underline,
                            name: "Underline  ⌘U",
                            on: active.underline,
                            act: () => run("underline"),
                        })}
                        {tool({
                            d: PATHS.strike,
                            name: "Strike  ⌘⇧X",
                            on: active.strike,
                            act: () => run("strikeThrough"),
                        })}
                        {(tools.link || tools.color || tools.align) && rule()}
                        {tools.link &&
                            tool({
                                d: PATHS.link,
                                name: "Link  ⌘K",
                                on: active.link || panel === "link",
                                act: openLink,
                            })}
                        {tools.color &&
                            tool({
                                d: PATHS.ink,
                                name: "Ink & marker",
                                on: panel === "color",
                                act: () =>
                                    setPanel(
                                        panel === "color" ? null : "color"
                                    ),
                            })}
                        {tools.align &&
                            tool({
                                d: alignGlyph,
                                name: `Align ${active.align}`,
                                on: active.align !== "left",
                                act: cycleAlign,
                            })}
                        {tools.clear && rule()}
                        {tools.clear &&
                            tool({
                                d: PATHS.eraser,
                                name: "Reset style",
                                act: wipe,
                            })}

                        <AnimatePresence>
                            {tip && !panel && (
                                <motion.div
                                    key={tip.text}
                                    initial={{
                                        opacity: 0,
                                        y: spot.up ? 3 : -3,
                                    }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={
                                        reduced
                                            ? { duration: 0 }
                                            : { duration: 0.14 }
                                    }
                                    style={{
                                        position: "absolute",
                                        ...sideStyle,
                                        left: tip.x,
                                        x: "-50%",
                                        padding: "4px 8px",
                                        borderRadius: 7,
                                        background: c.toolbarText,
                                        color: c.toolbar,
                                        fontSize: 11.5,
                                        lineHeight: "15px",
                                        fontWeight: 500,
                                        pointerEvents: "none",
                                        whiteSpace: "pre",
                                    }}
                                >
                                    {tip.text}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {panel === "block" && (
                                <motion.div
                                    key="block"
                                    role="menu"
                                    {...panelMotion}
                                    style={{
                                        ...panelShell,
                                        left: 0,
                                        width: 208,
                                        transformOrigin: spot.up
                                            ? "0% 100%"
                                            : "0% 0%",
                                    }}
                                >
                                    {BLOCKS.map((b) => (
                                        <button
                                            key={b.tag}
                                            type="button"
                                            role="menuitemradio"
                                            aria-checked={
                                                active.block === b.tag
                                            }
                                            className={`${scope}-row`}
                                            onClick={() => setBlock(b.tag)}
                                        >
                                            <span
                                                style={{
                                                    width: 26,
                                                    height: 22,
                                                    borderRadius: 6,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    background:
                                                        active.block === b.tag
                                                            ? tint(
                                                                  c.accent,
                                                                  0.2
                                                              )
                                                            : tint(
                                                                  c.toolbarText,
                                                                  0.07
                                                              ),
                                                    color:
                                                        active.block === b.tag
                                                            ? c.accent
                                                            : c.toolbarText,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {b.badge}
                                            </span>
                                            <span style={{ flex: 1 }}>
                                                {b.name}
                                            </span>
                                            {active.block === b.tag && (
                                                <span
                                                    style={{
                                                        color: c.accent,
                                                        display: "flex",
                                                    }}
                                                >
                                                    <Glyph
                                                        d={PATHS.check}
                                                        size={14}
                                                        weight={2.2}
                                                    />
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </motion.div>
                            )}

                            {panel === "color" && (
                                <motion.div
                                    key="color"
                                    {...panelMotion}
                                    style={{
                                        ...panelShell,
                                        left: "50%",
                                        x: "-50%",
                                        padding: "10px 12px 12px",
                                        width: "max-content",
                                    }}
                                >
                                    {(["ink", "marker"] as const).map(
                                        (mode) => (
                                            <div
                                                key={mode}
                                                style={{
                                                    marginTop:
                                                        mode === "marker"
                                                            ? 10
                                                            : 0,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: 11,
                                                        letterSpacing: "0.04em",
                                                        textTransform:
                                                            "uppercase",
                                                        color: tint(
                                                            c.toolbarText,
                                                            0.5
                                                        ),
                                                        marginBottom: 7,
                                                    }}
                                                >
                                                    {mode === "ink"
                                                        ? "Ink"
                                                        : "Marker"}
                                                </div>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: 7,
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        className={`${scope}-dot`}
                                                        aria-label={
                                                            mode === "ink"
                                                                ? "Default ink"
                                                                : "No marker"
                                                        }
                                                        onClick={() =>
                                                            paint(mode, null)
                                                        }
                                                        style={{
                                                            background: `linear-gradient(135deg, transparent 45%, ${tint(
                                                                c.toolbarText,
                                                                0.5
                                                            )} 45%, ${tint(c.toolbarText, 0.5)} 55%, transparent 55%)`,
                                                        }}
                                                    />
                                                    {swatches.map((s, i) => (
                                                        <button
                                                            key={i}
                                                            type="button"
                                                            className={`${scope}-dot`}
                                                            aria-label={`${mode} colour ${i + 1}`}
                                                            onClick={() =>
                                                                paint(mode, s)
                                                            }
                                                            style={{
                                                                background:
                                                                    mode ===
                                                                    "ink"
                                                                        ? s
                                                                        : tint(
                                                                              s,
                                                                              0.45
                                                                          ),
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </motion.div>
                            )}

                            {panel === "link" && (
                                <motion.div
                                    key="link"
                                    {...panelMotion}
                                    style={{
                                        ...panelShell,
                                        left: "50%",
                                        x: "-50%",
                                        width: 300,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                    }}
                                >
                                    <input
                                        className={`${scope}-input`}
                                        autoFocus
                                        value={href}
                                        placeholder="Paste or type an address"
                                        onChange={(e) =>
                                            setHref(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault()
                                                commitLink()
                                            } else if (e.key === "Escape") {
                                                e.preventDefault()
                                                setPanel(null)
                                                restore()
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className={`${scope}-tool`}
                                        aria-label="Apply link"
                                        data-on="true"
                                        onClick={() => commitLink()}
                                        style={{ width: 32, height: 32 }}
                                    >
                                        <Glyph d={PATHS.enter} />
                                    </button>
                                    {active.link && (
                                        <button
                                            type="button"
                                            className={`${scope}-tool`}
                                            aria-label="Remove link"
                                            onClick={() => commitLink(true)}
                                            style={{ width: 32, height: 32 }}
                                        >
                                            <Glyph d={PATHS.cross} />
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Property controls                                                   */
/* ------------------------------------------------------------------ */

addPropertyControls(Inkwell, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: BASE.label,
    },
    heading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: BASE.heading,
    },
    body: {
        type: ControlType.String,
        title: "Body",
        displayTextArea: true,
        defaultValue: BASE.body,
        description: "Leave an empty line between paragraphs.",
    },
    placeholder: {
        type: ControlType.String,
        title: "Placeholder",
        defaultValue: BASE.placeholder,
    },
    readOnly: {
        type: ControlType.Boolean,
        title: "Read Only",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },

    autosave: {
        type: ControlType.Boolean,
        title: "Autosave",
        defaultValue: true,
        description: "Keeps each visitor's draft in their browser.",
    },
    saveKey: {
        type: ControlType.String,
        title: "Save Slot",
        defaultValue: BASE.saveKey,
        description: "Give each editor on a site its own slot.",
        hidden: (p: Props) => p.autosave === false,
    },
    exportMenu: {
        type: ControlType.Boolean,
        title: "Export Menu",
        defaultValue: true,
    },
    wordGoal: {
        type: ControlType.Number,
        title: "Word Goal",
        min: 0,
        max: 5000,
        step: 10,
        defaultValue: BASE.wordGoal,
        description: "0 hides the progress ring.",
    },
    charLimit: {
        type: ControlType.Number,
        title: "Char Limit",
        min: 0,
        max: 20000,
        step: 10,
        defaultValue: BASE.charLimit,
        description: "0 means no limit.",
    },

    submit: {
        type: ControlType.Boolean,
        title: "Send Button",
        defaultValue: false,
        description: "Adds a send step. Nothing is uploaded by the component.",
    },
    sendVia: {
        type: ControlType.Enum,
        title: "Send Via",
        options: ["email", "event"],
        optionTitles: ["Email App", "Interaction"],
        defaultValue: "email",
        displaySegmentedControl: true,
        description:
            "Email App opens the visitor's mail app with the draft. Interaction only fires On Send.",
        hidden: (p: Props) => !p.submit,
    },
    mailTo: {
        type: ControlType.String,
        title: "Send To",
        placeholder: "inbox@example.com",
        defaultValue: "",
        hidden: (p: Props) => !p.submit || p.sendVia !== "email",
    },
    mailSubject: {
        type: ControlType.String,
        title: "Subject",
        defaultValue: BASE.mailSubject,
        hidden: (p: Props) => !p.submit || p.sendVia !== "email",
    },
    askName: {
        type: ControlType.Boolean,
        title: "Ask Name",
        defaultValue: false,
        hidden: (p: Props) => !p.submit,
    },
    askEmail: {
        type: ControlType.Boolean,
        title: "Ask Email",
        defaultValue: false,
        hidden: (p: Props) => !p.submit,
    },
    buttonText: {
        type: ControlType.String,
        title: "Button",
        defaultValue: BASE.buttonText,
        hidden: (p: Props) => !p.submit,
    },
    doneText: {
        type: ControlType.String,
        title: "Done Text",
        defaultValue: BASE.doneText,
        hidden: (p: Props) => !p.submit,
    },
    clearAfter: {
        type: ControlType.Boolean,
        title: "Clear After",
        defaultValue: true,
        hidden: (p: Props) => !p.submit,
    },
    onSubmit: { type: ControlType.EventHandler, title: "On Send" },

    tools: {
        type: ControlType.Object,
        title: "Tools",
        controls: {
            link: {
                type: ControlType.Boolean,
                title: "Link",
                defaultValue: true,
            },
            color: {
                type: ControlType.Boolean,
                title: "Colour",
                defaultValue: true,
            },
            align: {
                type: ControlType.Boolean,
                title: "Align",
                defaultValue: true,
            },
            clear: {
                type: ControlType.Boolean,
                title: "Reset",
                defaultValue: true,
            },
        },
    },
    swatches: {
        type: ControlType.Array,
        title: "Swatches",
        maxCount: 8,
        control: { type: ControlType.Color },
        defaultValue: BASE.swatches,
    },
    palette: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Surface",
                defaultValue: BASE.palette.background,
            },
            border: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: BASE.palette.border,
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: BASE.palette.text,
            },
            muted: {
                type: ControlType.Color,
                title: "Muted",
                defaultValue: BASE.palette.muted,
            },
            accent: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: BASE.palette.accent,
            },
            alert: {
                type: ControlType.Color,
                title: "Alert",
                defaultValue: BASE.palette.alert,
            },
            toolbar: {
                type: ControlType.Color,
                title: "Toolbar",
                defaultValue: BASE.palette.toolbar,
            },
            toolbarText: {
                type: ControlType.Color,
                title: "Toolbar Text",
                defaultValue: BASE.palette.toolbarText,
            },
        },
    },
    font: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "17px",
            lineHeight: "1.65em",
            letterSpacing: "-0.01em",
        },
    },
    headingFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "30px",
            lineHeight: "1.15em",
            letterSpacing: "-0.025em",
        },
    },
    chrome: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 60,
                defaultValue: 22,
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 12,
                max: 80,
                defaultValue: 32,
            },
            showHeader: {
                type: ControlType.Boolean,
                title: "Top Bar",
                defaultValue: true,
            },
            showFooter: {
                type: ControlType.Boolean,
                title: "Stats Bar",
                defaultValue: true,
            },
        },
    },
})
