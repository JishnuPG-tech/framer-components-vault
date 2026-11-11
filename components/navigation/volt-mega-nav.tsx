import * as React from "react"
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import type { ControlDescription, ObjectPropertyControlDescription } from "framer"
import { AnimatePresence, LayoutGroup, motion } from "framer-motion"
import type { Transition } from "framer-motion"

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

// Feather-style glyphs (24x24, stroke based)
const ICONS: Record<string, React.ReactNode> = {
    Zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    Layers: <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
    Grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
    Chart: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    Trending: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    Shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    Lock: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    Users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    Globe: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
    Code: <><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>,
    Cpu: <><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></>,
    Box: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    Book: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>,
    File: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
    Play: <><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></>,
    Message: <><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></>,
    Mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
    Help: <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    Compass: <><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></>,
    Star: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
    Heart: <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>,
    Briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>,
    Calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    Phone: <><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></>,
    ArrowUpRight: <><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></>,
    ArrowRight: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    ChevronDown: <><polyline points="6 9 12 15 18 9"/></>,
}
const ICON_OPTIONS = Object.keys(ICONS).filter((n) => n !== "ChevronDown")

type ImageValue = { src?: string; srcSet?: string; alt?: string } | undefined

interface ItemData {
    column?: string
    title?: string
    description?: string
    iconType?: "icon" | "image" | "none"
    icon?: string
    iconImage?: ImageValue
    link?: string
    newTab?: boolean
    badge?: string
}
interface ColumnData {
    title: string
    items: ItemData[]
}
interface MenuData {
    label?: string
    type?: "link" | "mega"
    link?: string
    newTab?: boolean
    badge?: string
    items?: ItemData[]
    featured?: boolean
    featuredImage?: ImageValue
    featuredEyebrow?: string
    featuredTitle?: string
    featuredText?: string
    featuredLinkLabel?: string
    featuredLink?: string
}

const DEFAULT_LOGO = { type: "mark", text: "Volt", image: undefined as ImageValue, imageHeight: 28, markSize: 28, markBackground: "#C8F542", markColor: "#07080B", link: "/", ariaLabel: "Home" }
const DEFAULT_BUTTONS = { showSecondary: true, secondaryLabel: "Sign in", secondaryLink: "", showPrimary: true, primaryLabel: "Get started", primaryLink: "", primaryNewTab: false, primaryArrow: true, showPrimaryInMobileBar: false }
const DEFAULT_BAR = { height: 64, radius: 22, paddingLeft: 20, paddingRight: 12, gap: 16, background: "#101115", border: "rgba(255, 255, 255, 0.08)", blur: 0, shadow: true, showTrack: true, trackBackground: "rgba(255, 255, 255, 0.03)", trackBorder: "rgba(255, 255, 255, 0.06)", itemHeight: 32, itemPadding: 14, itemRadius: 8, buttonHeight: 40, buttonRadius: 12 }
const DEFAULT_COLORS = { text: "#FFFFFF", muted: "rgba(255, 255, 255, 0.7)", hover: "rgba(255, 255, 255, 0.08)", accent: "#C8F542", accentText: "#07080B", badgeBackground: "rgba(200, 245, 66, 0.14)", badgeText: "#C8F542" }
const DEFAULT_PANEL = { background: "#101115", border: "rgba(255, 255, 255, 0.08)", radius: 22, offset: 10, padding: 12, columnGap: 8, itemRadius: 12, itemHover: "rgba(255, 255, 255, 0.05)", iconSize: 36, iconRadius: 10, iconBackground: "rgba(255, 255, 255, 0.05)", iconBorder: "rgba(255, 255, 255, 0.08)", iconColor: "#C8F542", title: "#FFFFFF", description: "rgba(255, 255, 255, 0.55)", columnTitle: "rgba(255, 255, 255, 0.4)", uppercaseTitles: true, showDescriptions: true, featuredBackground: "#17181D", featuredText: "#FFFFFF", featuredMuted: "rgba(255, 255, 255, 0.6)", shadow: true }
const DEFAULT_TRANSITION: Transition = { type: "spring", stiffness: 520, damping: 42, mass: 1 }
const DEFAULT_BEHAVIOUR = { layoutMode: "auto", mobileBreakpoint: 900, openOn: "hover", closeDelay: 140, transition: DEFAULT_TRANSITION }
const DEFAULT_PREVIEW = { menu: 0, mobileOpen: false, mobileSection: 0 }

const item = (column: string, title: string, description: string, icon: string, badge = ""): ItemData => ({ column, title, description, iconType: "icon", icon, link: "", newTab: false, badge })
const DEFAULT_MENUS: MenuData[] = [
    { label: "Product", type: "mega", link: "", newTab: false, badge: "", featured: true, featuredEyebrow: "What’s new", featuredTitle: "Volt 2.0 is here", featuredText: "A faster editor, smarter automations and a brand-new dashboard.", featuredLinkLabel: "See what’s new", featuredLink: "",
        items: [
            item("Platform", "Analytics", "Real-time insight across every channel", "Chart"),
            item("Platform", "Automations", "Workflows that run while you sleep", "Zap"),
            item("Platform", "Integrations", "Connect 200+ tools in one click", "Layers", "New"),
            item("Build", "Developer API", "Typed SDKs and a clean REST API", "Code"),
            item("Build", "Security", "SOC 2, SSO and audit logs built in", "Shield"),
            item("Build", "Infrastructure", "Edge network in 35 regions", "Cpu"),
        ] },
    { label: "Solutions", type: "mega", link: "", newTab: false, badge: "", featured: true, featuredEyebrow: "Case study", featuredTitle: "How Northwind grew 3×", featuredText: "One workspace replaced six tools for a 40-person team.", featuredLinkLabel: "Read the story", featuredLink: "",
        items: [
            item("By team", "Marketing", "Launch campaigns faster", "Trending"),
            item("By team", "Sales", "Close deals with live data", "Briefcase"),
            item("By team", "Support", "Resolve tickets in minutes", "Message"),
            item("By size", "Startups", "Everything you need to grow", "Star"),
            item("By size", "Enterprise", "Scale, control and compliance", "Globe"),
        ] },
    { label: "Resources", type: "mega", link: "", newTab: false, badge: "", featured: false, featuredEyebrow: "", featuredTitle: "", featuredText: "", featuredLinkLabel: "", featuredLink: "",
        items: [
            item("Learn", "Documentation", "Guides and API reference", "Book"),
            item("Learn", "Tutorials", "Step-by-step video lessons", "Play"),
            item("Learn", "Templates", "Start from a proven setup", "Grid"),
            item("Company", "Blog", "Ideas, updates and stories", "File"),
            item("Company", "Customers", "Teams building with us", "Heart"),
            item("Company", "Help center", "Answers to common questions", "Help"),
        ] },
    { label: "Pricing", type: "link", link: "", newTab: false, badge: "", items: [], featured: false },
    { label: "Changelog", type: "link", link: "", newTab: false, badge: "New", items: [], featured: false },
]

const list = <T,>(v: T[] | undefined | null): T[] => (Array.isArray(v) ? v : [])
const href = (v?: string) => (v && v.trim() !== "" ? v : undefined)
const mix = (color: string, pct: number) => "color-mix(in srgb, " + color + " " + pct + "%, transparent)"
const isMegaReady = (m: MenuData) => m.type === "mega" && (list(m.items).length > 0 || !!m.featured)
// Items sharing a Column name are grouped together, in first-appearance order (max 4 columns)
const groupColumns = (m: MenuData): ColumnData[] => {
    const out: ColumnData[] = []
    for (const it of list(m.items)) {
        const title = (it.column || "").trim()
        let group = out.find((g) => g.title === title)
        if (!group) {
            if (out.length >= 4) group = out[out.length - 1]
            else {
                group = { title, items: [] }
                out.push(group)
            }
        }
        group.items.push(it)
    }
    return out
}

function Glyph({ name, size, color, strokeWidth = 2 }: { name?: string; size: number; color: string; strokeWidth?: number }) {
    const body = name ? ICONS[name] : undefined
    if (!body) return null
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={{ display: "block", flexShrink: 0 }}>
            {body}
        </svg>
    )
}

function Badge({ text, colors }: { text?: string; colors: typeof DEFAULT_COLORS }) {
    if (!text) return null
    return (
        <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 6px", borderRadius: 6, background: colors.badgeBackground, color: colors.badgeText, border: "1px solid " + mix(colors.badgeText, 22), fontSize: 11, fontWeight: 600, lineHeight: 1, letterSpacing: 0, whiteSpace: "nowrap", flexShrink: 0 }}>
            {text}
        </span>
    )
}

// Anchors without a destination stay keyboard reachable
const linkAttrs = (v?: string): { href?: string; tabIndex?: number } => {
    const url = href(v)
    return url ? { href: url } : { tabIndex: 0 }
}

const FOCUSABLE = "a[href], a[tabindex], button:not([disabled])"
function focusables(container: Element | null | undefined): HTMLElement[] {
    if (!container) return []
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.tabIndex >= 0)
}
// Moves focus within a list (wrapping); returns false when the key is not a navigation key
function moveFocus(items: HTMLElement[], current: Element | null, key: string): boolean {
    if (items.length === 0) return false
    const index = current instanceof HTMLElement ? items.indexOf(current) : -1
    let next = -1
    if (key === "ArrowDown" || key === "ArrowRight") next = index < 0 ? 0 : (index + 1) % items.length
    else if (key === "ArrowUp" || key === "ArrowLeft") next = index < 0 ? items.length - 1 : (index - 1 + items.length) % items.length
    else if (key === "Home") next = 0
    else if (key === "End") next = items.length - 1
    if (next < 0) return false
    items[next].focus()
    return true
}

const resetButton: React.CSSProperties = { appearance: "none", WebkitAppearance: "none", background: "transparent", border: "none", margin: 0, padding: 0, cursor: "pointer", textAlign: "left" }
const resetLink: React.CSSProperties = { textDecoration: "none", color: "inherit", cursor: "pointer" }

function useOwnHeight(active: boolean) {
    const ref = useRef<HTMLDivElement>(null)
    const [height, setHeight] = useState<number | null>(null)
    useIsoLayoutEffect(() => {
        const el = ref.current
        if (!active || !el) {
            setHeight(null)
            return
        }
        const update = () => setHeight(el.offsetHeight)
        update()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [active])
    return [ref, height] as const
}

interface Props {
    logo?: Partial<typeof DEFAULT_LOGO>
    menus?: MenuData[]
    buttons?: Partial<typeof DEFAULT_BUTTONS>
    bar?: Partial<typeof DEFAULT_BAR>
    colors?: Partial<typeof DEFAULT_COLORS>
    panel?: Partial<typeof DEFAULT_PANEL>
    behaviour?: Partial<typeof DEFAULT_BEHAVIOUR>
    preview?: Partial<typeof DEFAULT_PREVIEW>
    logoFont?: React.CSSProperties
    linkFont?: React.CSSProperties
    itemTitleFont?: React.CSSProperties
    itemTextFont?: React.CSSProperties
    columnTitleFont?: React.CSSProperties
    featuredTitleFont?: React.CSSProperties
    buttonFont?: React.CSSProperties
    style?: React.CSSProperties
}

/**
 * Mega Navigation
 *
 * @framerIntrinsicWidth 1120
 * @framerIntrinsicHeight 64
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function MegaNav(props: Props) {
    const logo = { ...DEFAULT_LOGO, ...props.logo }
    const buttons = { ...DEFAULT_BUTTONS, ...props.buttons }
    const bar = { ...DEFAULT_BAR, ...props.bar }
    const colors = { ...DEFAULT_COLORS, ...props.colors }
    const panel = { ...DEFAULT_PANEL, ...props.panel }
    const behaviour = { ...DEFAULT_BEHAVIOUR, ...props.behaviour }
    const preview = { ...DEFAULT_PREVIEW, ...props.preview }
    // Framer drops nested arrays from control defaults, so an untouched default menu arrives with no items.
    // Restore the demo items only when the menu still matches its default exactly.
    const menus = list(props.menus).map((m) => {
        if (!m || m.type !== "mega" || list(m.items).length > 0) return m
        const fallback = DEFAULT_MENUS.find((d) => d.label === m.label && d.type === m.type && (d.featuredTitle || "") === (m.featuredTitle || "") && (d.featuredText || "") === (m.featuredText || ""))
        return fallback ? { ...m, items: list(fallback.items) } : m
    })
    const transition = behaviour.transition || DEFAULT_BEHAVIOUR.transition

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const uid = useId().replace(/:/g, "")
    const rootRef = useRef<HTMLElement>(null)
    const closeTimer = useRef<number | null>(null)
    const pointerType = useRef("mouse")
    const lastOpen = useRef(-1)
    const direction = useRef(0)
    const triggerRefs = useRef<Array<HTMLElement | null>>([])
    const panelRef = useRef<HTMLDivElement>(null)
    const drawerRef = useRef<HTMLDivElement>(null)
    const burgerRef = useRef<HTMLButtonElement>(null)
    const pendingFocus = useRef<"first" | "last" | null>(null)

    const [width, setWidth] = useState(0)
    const [active, setActive] = useState(-1)
    const [hovered, setHovered] = useState(-1)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [mobileSection, setMobileSection] = useState(-1)

    useIsoLayoutEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            const w = entries[0] ? entries[0].contentRect.width : 0
            if (w > 0) setWidth(Math.round(w))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const isMobile = behaviour.layoutMode === "mobile" || (behaviour.layoutMode === "auto" && width > 0 && width < behaviour.mobileBreakpoint)

    const cancelClose = () => {
        if (closeTimer.current !== null) {
            window.clearTimeout(closeTimer.current)
            closeTimer.current = null
        }
    }
    const closeAll = () => {
        cancelClose()
        setActive(-1)
        setMobileOpen(false)
        setMobileSection(-1)
    }
    const scheduleClose = () => {
        cancelClose()
        closeTimer.current = window.setTimeout(() => {
            closeTimer.current = null
            setActive(-1)
        }, Math.max(0, behaviour.closeDelay))
    }

    useEffect(() => () => cancelClose(), [])
    useEffect(() => {
        closeAll()
    }, [isMobile])

    useEffect(() => {
        if (active < 0 && !mobileOpen) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return
            const root = rootRef.current
            const focusInside = !!root && document.activeElement instanceof Node && root.contains(document.activeElement)
            const returnTo = active >= 0 ? triggerRefs.current[active] : mobileOpen ? burgerRef.current : null
            closeAll()
            if (focusInside && returnTo) returnTo.focus()
        }
        const onPointer = (e: PointerEvent) => {
            const el = rootRef.current
            if (el && e.target instanceof Node && !el.contains(e.target)) closeAll()
        }
        document.addEventListener("keydown", onKey)
        document.addEventListener("pointerdown", onPointer)
        return () => {
            document.removeEventListener("keydown", onKey)
            document.removeEventListener("pointerdown", onPointer)
        }
    }, [active, mobileOpen])

    const previewIndex = isCanvas ? Math.round(preview.menu) - 1 : -1
    const openIndex = active >= 0 ? active : previewIndex >= 0 && menus[previewIndex] && isMegaReady(menus[previewIndex]) ? previewIndex : -1
    const drawerOpen = mobileOpen || (isCanvas && preview.mobileOpen)
    const pillIndex = hovered >= 0 ? hovered : openIndex

    if (openIndex !== lastOpen.current) {
        direction.current = openIndex < 0 || lastOpen.current < 0 ? 0 : openIndex > lastOpen.current ? 1 : -1
        lastOpen.current = openIndex
    }

    const [contentRef, contentHeight] = useOwnHeight(openIndex >= 0 && !isMobile)

    const currentPanelContent = (): Element | null => (panelRef.current ? panelRef.current.querySelector('[data-menu-index="' + openIndex + '"]') : null)
    const focusPanel = (which: "first" | "last"): boolean => {
        const items = focusables(currentPanelContent())
        if (items.length === 0) return false
        items[which === "first" ? 0 : items.length - 1].focus()
        return true
    }

    // After a keyboard open, move focus into the panel once it has rendered
    useEffect(() => {
        if (!pendingFocus.current || openIndex < 0 || isMobile) return
        const which = pendingFocus.current
        const frame = window.requestAnimationFrame(() => {
            if (focusPanel(which)) pendingFocus.current = null
        })
        return () => window.cancelAnimationFrame(frame)
    }, [openIndex, isMobile])

    const onTriggerKey = (e: React.KeyboardEvent<HTMLElement>, index: number, mega: boolean) => {
        const count = menus.length
        if (count === 0) return
        if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End") {
            e.preventDefault()
            const next = e.key === "Home" ? 0 : e.key === "End" ? count - 1 : (index + (e.key === "ArrowRight" ? 1 : -1) + count) % count
            const target = triggerRefs.current[next]
            if (target) target.focus()
            // While a panel is open, it follows the focused trigger
            if (active >= 0) {
                cancelClose()
                setActive(menus[next] && isMegaReady(menus[next]) ? next : -1)
            }
            return
        }
        if (mega && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault()
            cancelClose()
            const which = e.key === "ArrowDown" ? "first" : "last"
            if (openIndex === index && focusPanel(which)) return
            pendingFocus.current = which
            setActive(index)
        }
    }

    const onPanelKey = (e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return
        if (moveFocus(focusables(currentPanelContent()), document.activeElement, e.key)) e.preventDefault()
    }

    const focusDrawer = (which: "first" | "last"): boolean => {
        const items = focusables(drawerRef.current)
        if (items.length === 0) return false
        items[which === "first" ? 0 : items.length - 1].focus()
        return true
    }

    // After the burger opens the drawer from the keyboard, move focus into it
    useEffect(() => {
        if (!pendingFocus.current || !mobileOpen || !isMobile) return
        const which = pendingFocus.current
        const frame = window.requestAnimationFrame(() => {
            if (focusDrawer(which)) pendingFocus.current = null
        })
        return () => window.cancelAnimationFrame(frame)
    }, [mobileOpen, isMobile])

    const onBurgerKey = (e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
        e.preventDefault()
        const which = e.key === "ArrowDown" ? "first" : "last"
        if (mobileOpen && focusDrawer(which)) return
        pendingFocus.current = which
        setMobileOpen(true)
    }

    const onDrawerKey = (e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return
        if (moveFocus(focusables(drawerRef.current), document.activeElement, e.key)) e.preventDefault()
    }

    const onRootBlur = (e: React.FocusEvent) => {
        const next = e.relatedTarget as Node | null
        if (next && rootRef.current && rootRef.current.contains(next)) return
        if (next) closeAll()
    }

    const fontBase: React.CSSProperties = { fontFamily: '"Geist", "Inter", system-ui, sans-serif' }
    const linkFont = { ...fontBase, fontSize: 14, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: "1.2em", ...props.linkFont }
    const logoFont = { ...fontBase, fontSize: 18, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: "1em", ...props.logoFont }
    const itemTitleFont = { ...fontBase, fontSize: 14, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: "1.3em", ...props.itemTitleFont }
    const itemTextFont = { ...fontBase, fontSize: 13, fontWeight: 400, letterSpacing: "0em", lineHeight: "1.4em", ...props.itemTextFont }
    const columnTitleFont = { ...fontBase, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", lineHeight: "1em", ...props.columnTitleFont }
    const featuredTitleFont = { ...fontBase, fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: "1.2em", ...props.featuredTitleFont }
    const buttonFont = { ...fontBase, fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: "1.2em", ...props.buttonFont }

    const surfaceShadow = "inset 0px 1px 0px 0px rgba(255, 255, 255, 0.06), 0px 12px 32px -12px rgba(0, 0, 0, 0.7)"

    // ---------- Shared pieces ----------
    const renderLogo = () => {
        const content =
            logo.type === "image" && logo.image && logo.image.src ? (
                <img src={logo.image.src} srcSet={logo.image.srcSet} alt={logo.image.alt || logo.text || ""} style={{ display: "block", height: logo.imageHeight, width: "auto" }} />
            ) : (
                <>
                    {logo.type === "mark" && (
                        <svg width={logo.markSize} height={logo.markSize} viewBox="0 0 28 28" fill="none" aria-hidden="true" focusable="false" style={{ display: "block", flexShrink: 0 }}>
                            <rect width="28" height="28" rx="8" fill={logo.markBackground} />
                            <path d="M14.75 6.5L7.25 15.5H14L13.25 21.5L20.75 12.5H14L14.75 6.5Z" fill={logo.markColor} stroke={logo.markColor} strokeWidth="1.2" strokeLinejoin="round" />
                        </svg>
                    )}
                    {logo.text ? <span style={{ ...logoFont, color: colors.text, whiteSpace: "nowrap" }}>{logo.text}</span> : null}
                </>
            )
        return (
            <a {...linkAttrs(logo.link)} aria-label={logo.ariaLabel || logo.text || "Home"} onClick={closeAll} style={{ ...resetLink, display: "inline-flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                {content}
            </a>
        )
    }

    const renderSecondary = (full: boolean) =>
        buttons.showSecondary && buttons.secondaryLabel ? (
            <motion.a {...linkAttrs(buttons.secondaryLink)} onClick={closeAll} initial={false} whileHover={{ backgroundColor: colors.hover }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }}
                style={{ ...resetLink, ...buttonFont, fontWeight: (props.buttonFont && props.buttonFont.fontWeight) || 500, display: "inline-flex", alignItems: "center", justifyContent: "center", height: full ? 48 : bar.buttonHeight, padding: "0 14px", borderRadius: bar.buttonRadius, color: colors.text, backgroundColor: mix(colors.hover, 0), border: full ? "1px solid " + bar.border : "1px solid transparent", boxSizing: "border-box", whiteSpace: "nowrap", flex: full ? "1 1 0" : "0 0 auto" }}>
                {buttons.secondaryLabel}
            </motion.a>
        ) : null

    const renderPrimary = (full: boolean) =>
        buttons.showPrimary && buttons.primaryLabel ? (
            <motion.a {...linkAttrs(buttons.primaryLink)} target={buttons.primaryNewTab ? "_blank" : undefined} rel={buttons.primaryNewTab ? "noopener noreferrer" : undefined} onClick={closeAll}
                whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} transition={transition}
                style={{ ...resetLink, ...buttonFont, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, height: full ? 48 : bar.buttonHeight, padding: buttons.primaryArrow ? "0 7px 0 16px" : "0 16px", borderRadius: bar.buttonRadius, background: colors.accent, color: colors.accentText, boxShadow: "inset 0px 1px 0px 0px rgba(255, 255, 255, 0.45), 0px 0px 0px 1px " + mix(colors.accent, 35) + ", 0px 8px 24px -8px " + mix(colors.accent, 55), boxSizing: "border-box", whiteSpace: "nowrap", flex: full ? "1 1 0" : "0 0 auto" }}>
                <span>{buttons.primaryLabel}</span>
                {buttons.primaryArrow ? (
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 8, background: colors.accentText }}>
                        <Glyph name="ArrowUpRight" size={14} color={colors.accent} strokeWidth={2.25} />
                    </span>
                ) : null}
            </motion.a>
        ) : null

    const renderItemIcon = (it: ItemData, size: number) => {
        const type = it.iconType || "icon"
        if (type === "none") return null
        const inner =
            type === "image" ? (
                it.iconImage && it.iconImage.src ? <img src={it.iconImage.src} alt="" style={{ display: "block", width: size * 0.5, height: size * 0.5, objectFit: "contain" }} /> : null
            ) : (
                <Glyph name={it.icon} size={Math.round(size * 0.47)} color={panel.iconColor} />
            )
        if (!inner) return null
        return (
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, borderRadius: panel.iconRadius, background: panel.iconBackground, border: "1px solid " + panel.iconBorder, boxSizing: "border-box", flexShrink: 0 }}>
                {inner}
            </span>
        )
    }

    const renderItem = (it: ItemData, key: string, compact: boolean) => (
        <motion.a key={key} {...linkAttrs(it.link)} target={it.newTab ? "_blank" : undefined} rel={it.newTab ? "noopener noreferrer" : undefined} onClick={closeAll}
            initial={false} whileHover={{ backgroundColor: panel.itemHover }} transition={{ duration: 0.18 }}
            style={{ ...resetLink, display: "flex", alignItems: compact ? "center" : "flex-start", gap: 12, padding: compact ? "8px 10px" : 10, borderRadius: panel.itemRadius, backgroundColor: mix(panel.itemHover, 0) }}>
            {renderItemIcon(it, compact ? 32 : panel.iconSize)}
            <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0, paddingTop: compact ? 0 : 1 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ ...itemTitleFont, color: panel.title }}>{it.title}</span>
                    <Badge text={it.badge} colors={colors} />
                </span>
                {panel.showDescriptions && it.description && !compact ? <span style={{ ...itemTextFont, color: panel.description }}>{it.description}</span> : null}
            </span>
        </motion.a>
    )

    const columnTitleStyle: React.CSSProperties = { ...columnTitleFont, color: panel.columnTitle, textTransform: panel.uppercaseTitles ? "uppercase" : "none", padding: "10px 10px 6px", margin: 0 }

    const renderFeatured = (m: MenuData) => {
        if (!m.featured) return null
        const img = m.featuredImage && m.featuredImage.src ? m.featuredImage : undefined
        return (
            <motion.a {...linkAttrs(m.featuredLink)} onClick={closeAll} whileHover="hover" initial="rest" animate="rest"
                style={{ ...resetLink, position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 8, minHeight: 236, padding: 20, borderRadius: Math.max(0, panel.radius - panel.padding), overflow: "hidden", background: panel.featuredBackground, border: "1px solid " + panel.iconBorder, boxSizing: "border-box", isolation: "isolate" }}>
                {img ? (
                    <motion.img variants={{ rest: { scale: 1 }, hover: { scale: 1.04 } }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} src={img.src} srcSet={img.srcSet} alt={img.alt || ""} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: -2 }} />
                ) : (
                    <span aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: -2, background: "radial-gradient(120% 90% at 100% 0%, " + mix(colors.accent, 38) + " 0%, transparent 55%), radial-gradient(80% 60% at 0% 100%, " + mix(colors.accent, 12) + " 0%, transparent 60%)" }} />
                )}
                <span aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: -1, background: "linear-gradient(180deg, transparent 30%, " + mix(panel.featuredBackground, 92) + " 100%)" }} />
                {m.featuredEyebrow ? <span style={{ alignSelf: "flex-start" }}><Badge text={m.featuredEyebrow} colors={colors} /></span> : null}
                {m.featuredTitle ? <span style={{ ...featuredTitleFont, color: panel.featuredText }}>{m.featuredTitle}</span> : null}
                {m.featuredText ? <span style={{ ...itemTextFont, color: panel.featuredMuted }}>{m.featuredText}</span> : null}
                {m.featuredLinkLabel ? (
                    <span style={{ ...itemTitleFont, display: "inline-flex", alignItems: "center", gap: 6, color: colors.accent, marginTop: 4 }}>
                        {m.featuredLinkLabel}
                        <motion.span variants={{ rest: { x: 0 }, hover: { x: 3 } }} transition={transition} style={{ display: "inline-flex" }}>
                            <Glyph name="ArrowRight" size={14} color={colors.accent} strokeWidth={2.25} />
                        </motion.span>
                    </span>
                ) : null}
            </motion.a>
        )
    }

    const panelSurface: React.CSSProperties = { background: panel.background, border: "1px solid " + panel.border, borderRadius: panel.radius, boxShadow: panel.shadow ? surfaceShadow : "none", boxSizing: "border-box" }

    // ---------- Mobile ----------
    if (isMobile) {
        return (
            <nav ref={rootRef} aria-label="Main" onBlur={onRootBlur} style={{ ...props.style, position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%", height: bar.height, padding: "0 " + bar.paddingRight + "px 0 " + bar.paddingLeft + "px", background: bar.background, border: "1px solid " + bar.border, borderRadius: bar.radius, boxShadow: bar.shadow ? surfaceShadow : "none", backdropFilter: bar.blur > 0 ? "blur(" + bar.blur + "px)" : undefined, WebkitBackdropFilter: bar.blur > 0 ? "blur(" + bar.blur + "px)" : undefined, boxSizing: "border-box", position: "relative", zIndex: 2 }}>
                    {renderLogo()}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {buttons.showPrimaryInMobileBar ? renderPrimary(false) : null}
                        <button ref={burgerRef} onKeyDown={onBurgerKey} type="button" aria-label={drawerOpen ? "Close menu" : "Open menu"} aria-expanded={drawerOpen} aria-controls={drawerOpen ? uid + "-drawer" : undefined} onClick={() => setMobileOpen((o) => !o)}
                            style={{ ...resetButton, position: "relative", width: 40, height: 40, borderRadius: bar.buttonRadius, background: colors.hover, border: "1px solid " + bar.border, boxSizing: "border-box", flexShrink: 0 }}>
                            <motion.span initial={false} animate={drawerOpen ? { y: 0, rotate: 45 } : { y: -3, rotate: 0 }} transition={transition} style={{ position: "absolute", left: "calc(50% - 8px)", top: "calc(50% - 1px)", width: 16, height: 2, borderRadius: 2, background: colors.text }} />
                            <motion.span initial={false} animate={drawerOpen ? { y: 0, rotate: -45 } : { y: 3, rotate: 0 }} transition={transition} style={{ position: "absolute", left: "calc(50% - 8px)", top: "calc(50% - 1px)", width: 16, height: 2, borderRadius: 2, background: colors.text }} />
                        </button>
                    </div>
                </div>
                <AnimatePresence>
                    {drawerOpen && (
                        <motion.div key="drawer" id={uid + "-drawer"} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={transition}
                            style={{ position: "absolute", top: "100%", left: 0, right: 0, paddingTop: panel.offset, zIndex: 1 }}>
                            <div ref={drawerRef} onKeyDown={onDrawerKey} style={{ ...panelSurface, maxHeight: "calc(100vh - " + (bar.height + panel.offset + 48) + "px)", overflowY: "auto", overscrollBehavior: "contain", padding: 8, display: "flex", flexDirection: "column", gap: 2 }}>
                                {menus.map((m, i) => {
                                    const mega = isMegaReady(m)
                                    const rowStyle: React.CSSProperties = { ...resetLink, ...linkFont, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, width: "100%", minHeight: 48, padding: "0 12px", borderRadius: panel.itemRadius, color: colors.text, boxSizing: "border-box" }
                                    if (!mega) {
                                        return (
                                            <motion.a key={"m" + i} {...linkAttrs(m.link)} target={m.newTab ? "_blank" : undefined} rel={m.newTab ? "noopener noreferrer" : undefined} onClick={closeAll} initial={false} whileHover={{ backgroundColor: panel.itemHover }} style={{ ...rowStyle, backgroundColor: mix(panel.itemHover, 0) }}>
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>{m.label}<Badge text={m.badge} colors={colors} /></span>
                                            </motion.a>
                                        )
                                    }
                                    const open = mobileSection === i || (isCanvas && mobileSection < 0 && Math.round(preview.mobileSection) - 1 === i)
                                    return (
                                        <div key={"m" + i}>
                                            <motion.button type="button" aria-expanded={open} aria-controls={open ? uid + "-section-" + i : undefined} onClick={() => setMobileSection(open ? -1 : i)} initial={false} whileHover={{ backgroundColor: panel.itemHover }} style={{ ...resetButton, ...rowStyle, backgroundColor: open ? panel.itemHover : mix(panel.itemHover, 0) }}>
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>{m.label}<Badge text={m.badge} colors={colors} /></span>
                                                <motion.span initial={false} animate={{ rotate: open ? 180 : 0 }} transition={transition} style={{ display: "inline-flex" }}>
                                                    <Glyph name="ChevronDown" size={16} color={colors.muted} />
                                                </motion.span>
                                            </motion.button>
                                            <AnimatePresence initial={false}>
                                                {open && (
                                                    <motion.div key="section" id={uid + "-section-" + i} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={transition} style={{ overflow: "hidden" }}>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "4px 0 8px" }}>
                                                            {groupColumns(m).map((c, ci) => (
                                                                <div key={"c" + ci} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                                                    {c.title ? <p style={columnTitleStyle}>{c.title}</p> : null}
                                                                    {list(c.items).map((it, ii) => renderItem(it, "i" + ci + "-" + ii, true))}
                                                                </div>
                                                            ))}
                                                            {m.featured && m.featuredTitle ? (
                                                                <a {...linkAttrs(m.featuredLink)} onClick={closeAll} style={{ ...resetLink, ...itemTitleFont, display: "inline-flex", alignItems: "center", gap: 6, color: colors.accent, padding: "10px 10px 4px" }}>
                                                                    {m.featuredLinkLabel || m.featuredTitle}
                                                                    <Glyph name="ArrowRight" size={14} color={colors.accent} strokeWidth={2.25} />
                                                                </a>
                                                            ) : null}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )
                                })}
                                {(buttons.showSecondary && buttons.secondaryLabel) || (buttons.showPrimary && buttons.primaryLabel) ? (
                                    <div style={{ display: "flex", gap: 8, paddingTop: 8 }}>
                                        {renderSecondary(true)}
                                        {renderPrimary(true)}
                                    </div>
                                ) : null}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        )
    }

    // ---------- Desktop ----------
    const openMenu = openIndex >= 0 ? menus[openIndex] : undefined
    const columns = openMenu ? groupColumns(openMenu) : []
    const gridTemplate = columns.map(() => "minmax(0, 1fr)").concat(openMenu && openMenu.featured ? ["minmax(0, 1.15fr)"] : []).join(" ") || "minmax(0, 1fr)"
    const hoverMode = behaviour.openOn === "hover"

    return (
        <nav ref={rootRef} aria-label="Main" onBlur={onRootBlur} style={{ ...props.style, position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: bar.gap, width: "100%", height: bar.height, padding: "0 " + bar.paddingRight + "px 0 " + bar.paddingLeft + "px", background: bar.background, border: "1px solid " + bar.border, borderRadius: bar.radius, boxShadow: bar.shadow ? surfaceShadow : "none", backdropFilter: bar.blur > 0 ? "blur(" + bar.blur + "px)" : undefined, WebkitBackdropFilter: bar.blur > 0 ? "blur(" + bar.blur + "px)" : undefined, boxSizing: "border-box", position: "relative", zIndex: 2 }}>
                <div style={{ flex: "1 1 0", minWidth: "max-content", display: "flex", alignItems: "center" }}>{renderLogo()}</div>
                <LayoutGroup id={uid + "-pill"}>
                    <div onPointerLeave={() => setHovered(-1)} style={{ display: "flex", alignItems: "center", gap: 2, padding: bar.showTrack ? 4 : 0, borderRadius: bar.itemRadius + 4, background: bar.showTrack ? bar.trackBackground : "transparent", border: bar.showTrack ? "1px solid " + bar.trackBorder : "1px solid transparent", boxSizing: "border-box", flexShrink: 0 }}>
                        {menus.map((m, i) => {
                            const mega = isMegaReady(m)
                            const isOpen = openIndex === i
                            const lit = isOpen || pillIndex === i
                            const inner = (
                                <>
                                    {pillIndex === i ? <motion.span layoutId="pill" transition={transition} style={{ position: "absolute", inset: 0, borderRadius: bar.itemRadius, background: colors.hover }} /> : null}
                                    <span style={{ position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", gap: 6, color: lit ? colors.text : colors.muted, transition: "color 0.2s ease", whiteSpace: "nowrap" }}>
                                        {m.label}
                                        <Badge text={m.badge} colors={colors} />
                                        {mega ? (
                                            <motion.span initial={false} animate={{ rotate: isOpen ? 180 : 0 }} transition={transition} style={{ display: "inline-flex", opacity: 0.7 }}>
                                                <Glyph name="ChevronDown" size={14} color="currentColor" />
                                            </motion.span>
                                        ) : null}
                                    </span>
                                </>
                            )
                            const itemStyle: React.CSSProperties = { ...linkFont, position: "relative", display: "inline-flex", alignItems: "center", height: bar.itemHeight, padding: "0 " + bar.itemPadding + "px", borderRadius: bar.itemRadius, boxSizing: "border-box" }
                            const onEnter = (e: React.PointerEvent) => {
                                pointerType.current = e.pointerType
                                setHovered(i)
                                if (hoverMode && e.pointerType === "mouse") {
                                    cancelClose()
                                    setActive(mega ? i : -1)
                                }
                            }
                            const onLeave = (e: React.PointerEvent) => {
                                if (hoverMode && e.pointerType === "mouse") scheduleClose()
                            }
                            if (!mega) {
                                return (
                                    <a key={"m" + i} {...linkAttrs(m.link)} target={m.newTab ? "_blank" : undefined} rel={m.newTab ? "noopener noreferrer" : undefined} ref={(el: HTMLElement | null) => { triggerRefs.current[i] = el }} onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => onTriggerKey(e, i, mega)} onPointerEnter={onEnter} onPointerLeave={onLeave} onFocus={() => setHovered(i)} onBlur={() => setHovered(-1)} onClick={closeAll} style={{ ...resetLink, ...itemStyle }}>
                                        {inner}
                                    </a>
                                )
                            }
                            return (
                                <button key={"m" + i} type="button" aria-expanded={isOpen} aria-controls={isOpen ? uid + "-panel" : undefined} ref={(el: HTMLElement | null) => { triggerRefs.current[i] = el }} onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => onTriggerKey(e, i, mega)} onPointerEnter={onEnter} onPointerLeave={onLeave} onPointerDown={(e) => (pointerType.current = e.pointerType)} onFocus={() => setHovered(i)} onBlur={() => setHovered(-1)}
                                    onClick={(e) => {
                                        cancelClose()
                                        if (hoverMode && pointerType.current === "mouse" && e.detail > 0) setActive(i)
                                        else setActive((cur) => (cur === i ? -1 : i))
                                    }}
                                    style={{ ...resetButton, ...itemStyle }}>
                                    {inner}
                                </button>
                            )
                        })}
                    </div>
                </LayoutGroup>
                <div style={{ flex: "1 1 0", minWidth: "max-content", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                    {renderSecondary(false)}
                    {renderPrimary(false)}
                </div>
            </div>
            <AnimatePresence>
                {openMenu ? (
                    <motion.div key="panel" ref={panelRef} onKeyDown={onPanelKey} id={uid + "-panel"}
                        initial={{ opacity: 0, y: -6, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.985 }} transition={transition}
                        onPointerEnter={(e) => { if (e.pointerType === "mouse") cancelClose() }}
                        onPointerLeave={(e) => { if (hoverMode && e.pointerType === "mouse") scheduleClose() }}
                        style={{ position: "absolute", top: "100%", left: 0, right: 0, paddingTop: panel.offset, zIndex: 1, transformOrigin: "50% 0%" }}>
                        <motion.div initial={false} animate={{ height: contentHeight === null ? "auto" : contentHeight }} transition={transition} style={{ ...panelSurface, overflow: "hidden" }}>
                            <div ref={contentRef} style={{ position: "relative" }}>
                                <AnimatePresence mode="popLayout" initial={false}>
                                    <motion.div key={openIndex} data-menu-index={openIndex} initial={{ opacity: 0, x: direction.current * 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction.current * -16 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                        style={{ display: "grid", gridTemplateColumns: gridTemplate, gap: panel.columnGap, padding: panel.padding, boxSizing: "border-box", width: "100%" }}>
                                        {columns.map((c, ci) => (
                                            <div key={"c" + ci} style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                                                {c.title ? <p style={columnTitleStyle}>{c.title}</p> : null}
                                                {list(c.items).map((it, ii) => renderItem(it, "i" + ci + "-" + ii, false))}
                                            </div>
                                        ))}
                                        {renderFeatured(openMenu)}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </nav>
    )
}

MegaNav.displayName = "Mega Navigation"

type LogoValues = typeof DEFAULT_LOGO
type ButtonValues = typeof DEFAULT_BUTTONS
type BarValues = typeof DEFAULT_BAR
type BehaviourValues = typeof DEFAULT_BEHAVIOUR
type PreviewValues = typeof DEFAULT_PREVIEW
type FontVariant = "Regular" | "Medium" | "Semibold" | "Bold"

// Typed wrapper for the values Framer passes to a nested control's `hidden` callback
const hiddenFor =
    <T,>(test: (values: Partial<T>) => boolean) =>
    (values: unknown): boolean =>
        test((values ?? {}) as Partial<T>)

const itemControls: Record<keyof ItemData, ObjectPropertyControlDescription> = {
    column: { type: ControlType.String, title: "Column", defaultValue: "Column" },
    title: { type: ControlType.String, title: "Title", defaultValue: "Item" },
    description: { type: ControlType.String, title: "Description", defaultValue: "", displayTextArea: true },
    iconType: { type: ControlType.Enum, title: "Icon", options: ["icon", "image", "none"], optionTitles: ["Glyph", "Image", "None"], defaultValue: "icon", displaySegmentedControl: true },
    icon: { type: ControlType.Enum, title: "Glyph", options: ICON_OPTIONS, defaultValue: "Zap", hidden: hiddenFor<ItemData>((p) => p.iconType !== "icon") },
    iconImage: { type: ControlType.ResponsiveImage, title: "Image", hidden: hiddenFor<ItemData>((p) => p.iconType !== "image") },
    link: { type: ControlType.Link, title: "Link" },
    newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false },
    badge: { type: ControlType.String, title: "Badge", defaultValue: "" },
}

const fontControl = (title: string, fontSize: number, variant: FontVariant, letterSpacing: string, lineHeight: string): ControlDescription<Partial<Props>> => ({
    type: ControlType.Font, title, controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize, variant, letterSpacing, lineHeight },
})

addPropertyControls(MegaNav, {
    logo: {
        type: ControlType.Object, title: "Logo",
        controls: {
            type: { type: ControlType.Enum, title: "Type", options: ["mark", "image", "text"], optionTitles: ["Mark", "Image", "Text"], defaultValue: DEFAULT_LOGO.type, displaySegmentedControl: true },
            text: { type: ControlType.String, title: "Text", defaultValue: DEFAULT_LOGO.text, hidden: hiddenFor<LogoValues>((p) => p.type === "image") },
            image: { type: ControlType.ResponsiveImage, title: "Image", hidden: hiddenFor<LogoValues>((p) => p.type !== "image") },
            imageHeight: { type: ControlType.Number, title: "Height", defaultValue: DEFAULT_LOGO.imageHeight, min: 12, max: 64, unit: "px", hidden: hiddenFor<LogoValues>((p) => p.type !== "image") },
            markSize: { type: ControlType.Number, title: "Mark Size", defaultValue: DEFAULT_LOGO.markSize, min: 16, max: 48, unit: "px", hidden: hiddenFor<LogoValues>((p) => p.type !== "mark") },
            markBackground: { type: ControlType.Color, title: "Mark Fill", defaultValue: DEFAULT_LOGO.markBackground, hidden: hiddenFor<LogoValues>((p) => p.type !== "mark") },
            markColor: { type: ControlType.Color, title: "Mark Glyph", defaultValue: DEFAULT_LOGO.markColor, hidden: hiddenFor<LogoValues>((p) => p.type !== "mark") },
            link: { type: ControlType.Link, title: "Link", defaultValue: DEFAULT_LOGO.link },
            ariaLabel: { type: ControlType.String, title: "Label", defaultValue: DEFAULT_LOGO.ariaLabel },
        },
    },
    menus: {
        type: ControlType.Array, title: "Menus", maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Menu" },
                type: { type: ControlType.Enum, title: "Type", options: ["link", "mega"], optionTitles: ["Link", "Mega Menu"], defaultValue: "link", displaySegmentedControl: true },
                link: { type: ControlType.Link, title: "Link", hidden: hiddenFor<MenuData>((p) => p.type === "mega") },
                newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false, hidden: hiddenFor<MenuData>((p) => p.type === "mega") },
                badge: { type: ControlType.String, title: "Badge", defaultValue: "" },
                items: { type: ControlType.Array, title: "Items", maxCount: 32, hidden: hiddenFor<MenuData>((p) => p.type !== "mega"), control: { type: ControlType.Object, controls: itemControls } },
                featured: { type: ControlType.Boolean, title: "Feature Card", defaultValue: false, hidden: hiddenFor<MenuData>((p) => p.type !== "mega") },
                featuredImage: { type: ControlType.ResponsiveImage, title: "Card Image", hidden: hiddenFor<MenuData>((p) => p.type !== "mega" || !p.featured) },
                featuredEyebrow: { type: ControlType.String, title: "Card Tag", defaultValue: "New", hidden: hiddenFor<MenuData>((p) => p.type !== "mega" || !p.featured) },
                featuredTitle: { type: ControlType.String, title: "Card Title", defaultValue: "Featured", hidden: hiddenFor<MenuData>((p) => p.type !== "mega" || !p.featured) },
                featuredText: { type: ControlType.String, title: "Card Text", defaultValue: "", displayTextArea: true, hidden: hiddenFor<MenuData>((p) => p.type !== "mega" || !p.featured) },
                featuredLinkLabel: { type: ControlType.String, title: "Card CTA", defaultValue: "Learn more", hidden: hiddenFor<MenuData>((p) => p.type !== "mega" || !p.featured) },
                featuredLink: { type: ControlType.Link, title: "Card Link", hidden: hiddenFor<MenuData>((p) => p.type !== "mega" || !p.featured) },
            },
        },
        defaultValue: DEFAULT_MENUS,
    },
    buttons: {
        type: ControlType.Object, title: "Buttons",
        controls: {
            showSecondary: { type: ControlType.Boolean, title: "Secondary", defaultValue: DEFAULT_BUTTONS.showSecondary },
            secondaryLabel: { type: ControlType.String, title: "Label", defaultValue: DEFAULT_BUTTONS.secondaryLabel, hidden: hiddenFor<ButtonValues>((p) => !p.showSecondary) },
            secondaryLink: { type: ControlType.Link, title: "Link", hidden: hiddenFor<ButtonValues>((p) => !p.showSecondary) },
            showPrimary: { type: ControlType.Boolean, title: "Primary", defaultValue: DEFAULT_BUTTONS.showPrimary },
            primaryLabel: { type: ControlType.String, title: "Label", defaultValue: DEFAULT_BUTTONS.primaryLabel, hidden: hiddenFor<ButtonValues>((p) => !p.showPrimary) },
            primaryLink: { type: ControlType.Link, title: "Link", hidden: hiddenFor<ButtonValues>((p) => !p.showPrimary) },
            primaryNewTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false, hidden: hiddenFor<ButtonValues>((p) => !p.showPrimary) },
            primaryArrow: { type: ControlType.Boolean, title: "Arrow", defaultValue: DEFAULT_BUTTONS.primaryArrow, hidden: hiddenFor<ButtonValues>((p) => !p.showPrimary) },
            showPrimaryInMobileBar: { type: ControlType.Boolean, title: "In Phone Bar", defaultValue: false, hidden: hiddenFor<ButtonValues>((p) => !p.showPrimary) },
        },
    },
    colors: {
        type: ControlType.Object, title: "Colors",
        controls: {
            text: { type: ControlType.Color, title: "Text", defaultValue: DEFAULT_COLORS.text },
            muted: { type: ControlType.Color, title: "Muted Text", defaultValue: DEFAULT_COLORS.muted },
            hover: { type: ControlType.Color, title: "Hover", defaultValue: DEFAULT_COLORS.hover },
            accent: { type: ControlType.Color, title: "Accent", defaultValue: DEFAULT_COLORS.accent },
            accentText: { type: ControlType.Color, title: "On Accent", defaultValue: DEFAULT_COLORS.accentText },
            badgeBackground: { type: ControlType.Color, title: "Badge Fill", defaultValue: DEFAULT_COLORS.badgeBackground },
            badgeText: { type: ControlType.Color, title: "Badge Text", defaultValue: DEFAULT_COLORS.badgeText },
        },
    },
    bar: {
        type: ControlType.Object, title: "Bar",
        controls: {
            height: { type: ControlType.Number, title: "Height", defaultValue: DEFAULT_BAR.height, min: 40, max: 120, unit: "px" },
            radius: { type: ControlType.Number, title: "Radius", defaultValue: DEFAULT_BAR.radius, min: 0, max: 60, unit: "px" },
            paddingLeft: { type: ControlType.Number, title: "Pad Left", defaultValue: DEFAULT_BAR.paddingLeft, min: 0, max: 64, unit: "px" },
            paddingRight: { type: ControlType.Number, title: "Pad Right", defaultValue: DEFAULT_BAR.paddingRight, min: 0, max: 64, unit: "px" },
            gap: { type: ControlType.Number, title: "Gap", defaultValue: DEFAULT_BAR.gap, min: 0, max: 64, unit: "px" },
            background: { type: ControlType.Color, title: "Fill", defaultValue: DEFAULT_BAR.background },
            border: { type: ControlType.Color, title: "Border", defaultValue: DEFAULT_BAR.border },
            blur: { type: ControlType.Number, title: "Blur", defaultValue: DEFAULT_BAR.blur, min: 0, max: 40, unit: "px" },
            shadow: { type: ControlType.Boolean, title: "Shadow", defaultValue: DEFAULT_BAR.shadow },
            showTrack: { type: ControlType.Boolean, title: "Link Track", defaultValue: DEFAULT_BAR.showTrack },
            trackBackground: { type: ControlType.Color, title: "Track Fill", defaultValue: DEFAULT_BAR.trackBackground, hidden: hiddenFor<BarValues>((p) => !p.showTrack) },
            trackBorder: { type: ControlType.Color, title: "Track Border", defaultValue: DEFAULT_BAR.trackBorder, hidden: hiddenFor<BarValues>((p) => !p.showTrack) },
            itemHeight: { type: ControlType.Number, title: "Link Height", defaultValue: DEFAULT_BAR.itemHeight, min: 20, max: 64, unit: "px" },
            itemPadding: { type: ControlType.Number, title: "Link Pad", defaultValue: DEFAULT_BAR.itemPadding, min: 0, max: 32, unit: "px" },
            itemRadius: { type: ControlType.Number, title: "Link Radius", defaultValue: DEFAULT_BAR.itemRadius, min: 0, max: 32, unit: "px" },
            buttonHeight: { type: ControlType.Number, title: "Button Height", defaultValue: DEFAULT_BAR.buttonHeight, min: 24, max: 64, unit: "px" },
            buttonRadius: { type: ControlType.Number, title: "Button Radius", defaultValue: DEFAULT_BAR.buttonRadius, min: 0, max: 32, unit: "px" },
        },
    },
    panel: {
        type: ControlType.Object, title: "Mega Panel",
        controls: {
            background: { type: ControlType.Color, title: "Fill", defaultValue: DEFAULT_PANEL.background },
            border: { type: ControlType.Color, title: "Border", defaultValue: DEFAULT_PANEL.border },
            shadow: { type: ControlType.Boolean, title: "Shadow", defaultValue: DEFAULT_PANEL.shadow },
            radius: { type: ControlType.Number, title: "Radius", defaultValue: DEFAULT_PANEL.radius, min: 0, max: 60, unit: "px" },
            offset: { type: ControlType.Number, title: "Offset", defaultValue: DEFAULT_PANEL.offset, min: 0, max: 40, unit: "px" },
            padding: { type: ControlType.Number, title: "Padding", defaultValue: DEFAULT_PANEL.padding, min: 0, max: 48, unit: "px" },
            columnGap: { type: ControlType.Number, title: "Column Gap", defaultValue: DEFAULT_PANEL.columnGap, min: 0, max: 48, unit: "px" },
            itemRadius: { type: ControlType.Number, title: "Item Radius", defaultValue: DEFAULT_PANEL.itemRadius, min: 0, max: 32, unit: "px" },
            itemHover: { type: ControlType.Color, title: "Item Hover", defaultValue: DEFAULT_PANEL.itemHover },
            title: { type: ControlType.Color, title: "Item Title", defaultValue: DEFAULT_PANEL.title },
            description: { type: ControlType.Color, title: "Item Text", defaultValue: DEFAULT_PANEL.description },
            showDescriptions: { type: ControlType.Boolean, title: "Descriptions", defaultValue: DEFAULT_PANEL.showDescriptions },
            columnTitle: { type: ControlType.Color, title: "Column Title", defaultValue: DEFAULT_PANEL.columnTitle },
            uppercaseTitles: { type: ControlType.Boolean, title: "Uppercase", defaultValue: DEFAULT_PANEL.uppercaseTitles },
            iconSize: { type: ControlType.Number, title: "Icon Box", defaultValue: DEFAULT_PANEL.iconSize, min: 20, max: 64, unit: "px" },
            iconRadius: { type: ControlType.Number, title: "Icon Radius", defaultValue: DEFAULT_PANEL.iconRadius, min: 0, max: 32, unit: "px" },
            iconBackground: { type: ControlType.Color, title: "Icon Fill", defaultValue: DEFAULT_PANEL.iconBackground },
            iconBorder: { type: ControlType.Color, title: "Icon Border", defaultValue: DEFAULT_PANEL.iconBorder },
            iconColor: { type: ControlType.Color, title: "Icon Color", defaultValue: DEFAULT_PANEL.iconColor },
            featuredBackground: { type: ControlType.Color, title: "Card Fill", defaultValue: DEFAULT_PANEL.featuredBackground },
            featuredText: { type: ControlType.Color, title: "Card Title", defaultValue: DEFAULT_PANEL.featuredText },
            featuredMuted: { type: ControlType.Color, title: "Card Text", defaultValue: DEFAULT_PANEL.featuredMuted },
        },
    },
    logoFont: fontControl("Logo Font", 18, "Semibold", "-0.03em", "1em"),
    linkFont: fontControl("Link Font", 14, "Medium", "-0.01em", "1.2em"),
    itemTitleFont: fontControl("Item Font", 14, "Medium", "-0.01em", "1.3em"),
    itemTextFont: fontControl("Item Text Font", 13, "Regular", "0em", "1.4em"),
    columnTitleFont: fontControl("Column Font", 11, "Semibold", "0.08em", "1em"),
    featuredTitleFont: fontControl("Card Font", 18, "Semibold", "-0.02em", "1.2em"),
    buttonFont: fontControl("Button Font", 14, "Semibold", "-0.01em", "1.2em"),
    behaviour: {
        type: ControlType.Object, title: "Behaviour",
        controls: {
            layoutMode: { type: ControlType.Enum, title: "Layout", options: ["auto", "desktop", "mobile"], optionTitles: ["Auto", "Desktop", "Phone"], defaultValue: DEFAULT_BEHAVIOUR.layoutMode, displaySegmentedControl: true },
            mobileBreakpoint: { type: ControlType.Number, title: "Phone Below", defaultValue: DEFAULT_BEHAVIOUR.mobileBreakpoint, min: 320, max: 1600, unit: "px", hidden: hiddenFor<BehaviourValues>((p) => p.layoutMode !== "auto") },
            openOn: { type: ControlType.Enum, title: "Open On", options: ["hover", "click"], optionTitles: ["Hover", "Click"], defaultValue: DEFAULT_BEHAVIOUR.openOn, displaySegmentedControl: true },
            closeDelay: { type: ControlType.Number, title: "Close Delay", defaultValue: DEFAULT_BEHAVIOUR.closeDelay, min: 0, max: 1000, step: 10, unit: "ms", hidden: hiddenFor<BehaviourValues>((p) => p.openOn !== "hover") },
            transition: { type: ControlType.Transition, title: "Transition", defaultValue: DEFAULT_BEHAVIOUR.transition },
        },
    },
    preview: {
        type: ControlType.Object, title: "Canvas Preview",
        controls: {
            menu: { type: ControlType.Number, title: "Open Menu", defaultValue: 0, min: 0, max: 8, step: 1, displayStepper: true },
            mobileOpen: { type: ControlType.Boolean, title: "Phone Open", defaultValue: false },
            mobileSection: { type: ControlType.Number, title: "Open Section", defaultValue: 0, min: 0, max: 8, step: 1, displayStepper: true, hidden: hiddenFor<PreviewValues>((p) => !p.mobileOpen) },
        },
    },
})
