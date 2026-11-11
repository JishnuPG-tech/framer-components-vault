/**
 * PILL NAV BAR
 * A compact pill navigation for any website: logo, search, language, CTA
 * and a menu button that opens a panel with links, extra links and socials.
 *
 * Starts at 600px wide. When there is enough room, the CTA and language
 * sit in the bar; when there is not, they move into the menu.
 *
 * The open menu floats over the page and never pushes content down.
 * Setup: set Overflow: Visible on every parent frame (so the menu and its
 * shadow are not cut off) and keep the nav frame above other layers.
 */

import * as React from "react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"

// Runs before the browser paints, so the bar never flashes the wrong layout
const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence } from "framer-motion"
import type { Transition } from "framer-motion"

/* =========================================================
   TYPES
   ========================================================= */

type SocialPlatform =
    | "instagram"
    | "x"
    | "tiktok"
    | "youtube"
    | "linkedin"
    | "facebook"
    | "whatsapp"
    | "dribbble"

interface ResponsiveImage {
    src?: string
    srcSet?: string
    alt?: string
}

interface NavLink {
    label: string
    link?: string
    badge?: string
    active?: boolean
    newTab?: boolean
}

interface ExtraLink {
    label: string
    link?: string
    newTab?: boolean
}

interface SocialLink {
    platform: SocialPlatform
    link?: string
}

interface LanguageItem {
    label: string
    code: string
    link?: string
}

interface SearchSettings {
    show: boolean
    placeholder: string
    url: string
}

interface LanguageSettings {
    show: boolean
    defaultIndex: number
    items: LanguageItem[]
}

interface CtaSettings {
    show: boolean
    label: string
    link?: string
    newTab: boolean
    showArrow: boolean
}

interface ColorSettings {
    barBg: string
    barText: string
    barMuted: string
    barBorder: string
    barHover: string
    shellBg: string
    shellSolid: string
    shellBorder: string
    panelText: string
    panelMuted: string
    accent: string
    divider: string
    ctaBg: string
    ctaText: string
    ctaHoverBg: string
    ctaHoverText: string
    badgeBg: string
    badgeText: string
    dim: string
    shadow: string
}

interface FontSettings {
    logo: React.CSSProperties
    bar: React.CSSProperties
    nav: React.CSSProperties
    secondary: React.CSSProperties
    small: React.CSSProperties
}

interface SizeSettings {
    barHeight: number
    radius: number
    shellPadding: number
    barPadding: number
    buttonSize: number
    panelPadding: number
    navGap: number
}

interface MotionSettings {
    itemReveal: "cutout" | "rise" | "none"
    stagger: number
    itemDuration: number
    stiffness: number
    damping: number
}

interface BehaviorSettings {
    menuTitle: string
    closeLabel: string
    closeOnClick: boolean
    dimPage: boolean
    compactBelow: number
    zIndex: number
    previewOpen: boolean
}

interface PillNavBarProps {
    logo?: ResponsiveImage
    logoText: string
    logoHeight: number
    logoLink?: string
    menuLabel: string
    links: NavLink[]
    showSecondary: boolean
    secondaryTitle: string
    secondaryLinks: ExtraLink[]
    showSocials: boolean
    socialTitle: string
    socials: SocialLink[]
    footerText: string
    search: SearchSettings
    language: LanguageSettings
    cta: CtaSettings
    colors: ColorSettings
    fonts: FontSettings
    sizes: SizeSettings
    motionSettings: MotionSettings
    behavior: BehaviorSettings
    style?: React.CSSProperties
}

interface RevealProps {
    i: number
    open: boolean
    settings: MotionSettings
    children: React.ReactNode
}

const SOCIAL_NAMES: Record<SocialPlatform, string> = {
    instagram: "Instagram",
    x: "X",
    tiktok: "TikTok",
    youtube: "YouTube",
    linkedin: "LinkedIn",
    facebook: "Facebook",
    whatsapp: "WhatsApp",
    dribbble: "Dribbble",
}

/** Accessible name that tells screen reader users a link opens a new tab */
function newTabLabel(text: string, newTab?: boolean): string | undefined {
    return newTab ? `${text} (opens in new tab)` : undefined
}

/* =========================================================
   ICONS
   ========================================================= */

const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
}

const SearchIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
        <circle cx="11" cy="11" r="6.5" />
        <path d="M16 16l4 4" />
    </svg>
)

const CloseIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
        <path d="M6 6l12 12M18 6L6 18" />
    </svg>
)

const Chevron = ({ size = 12, open = false, still = false }) => (
    <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        {...stroke}
        strokeWidth={2.4}
        initial={false}
        animate={{ rotate: open ? 180 : 0 }}
        transition={still ? { duration: 0 } : { duration: 0.3 }}
    >
        <path d="M6 9l6 6 6-6" />
    </motion.svg>
)

const Arrow = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>
        <path d="M7 17L17 7M9 7h8v8" />
    </svg>
)

const SOCIAL_ICONS: Record<SocialPlatform, JSX.Element> = {
    instagram: (
        <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
            <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
        </svg>
    ),
    x: (
        <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
            <path d="M4 4l16 16M20 4L4 20" />
        </svg>
    ),
    tiktok: (
        <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
            <path d="M14 4v10.5a3.5 3.5 0 1 1 -3.5 -3.5" />
            <path d="M14 4c0.6 2.6 2.4 4 5 4" />
        </svg>
    ),
    youtube: (
        <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
            <rect x="3" y="6" width="18" height="12" rx="4" />
            <path d="M10.5 9.5v5l4 2.5z" transform="translate(0 -2.5)" />
        </svg>
    ),
    linkedin: (
        <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
            <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
            <path d="M8 11v5M8 8v0.01M12 16v-5M12 13a2 2 0 0 1 4 0v3" />
        </svg>
    ),
    facebook: (
        <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
            <path d="M14 21v-8h3l0.5 -3.5H14V7.5c0 -1 0.4 -1.5 1.5 -1.5H17.5V3H15c-3 0 -4.5 1.8 -4.5 4.5v2H8V13h2.5v8" />
        </svg>
    ),
    whatsapp: (
        <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
            <path d="M4 20l1.4 -4.2A8 8 0 1 1 8.4 18.8z" />
            <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1 -1.5 -2 -1 -1 1c-1 -0.5 -2 -1.5 -2.5 -2.5l1 -1 -1 -2z" />
        </svg>
    ),
    dribbble: (
        <svg width="20" height="20" viewBox="0 0 24 24" {...stroke}>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M5 7.5c4 1 9 0.5 13 -2M8 20c1 -5 5 -8 12 -7M9 4c3 4 5 10 6 16" />
        </svg>
    ),
}

/* =========================================================
   HELPERS
   ========================================================= */

const isCanvas = () => RenderTarget.current() === RenderTarget.canvas

function isActive(link?: string) {
    if (!link || typeof window === "undefined") return false
    try {
        const url = new URL(link, window.location.origin)
        const here = window.location.pathname.replace(/\/$/, "") || "/"
        const there = url.pathname.replace(/\/$/, "") || "/"
        return there !== "/" ? here.startsWith(there) : here === "/"
    } catch {
        return false
    }
}

/* =========================================================
   REVEAL (menu items)
   ========================================================= */

function Reveal({ i, open, settings, children }: RevealProps) {
    // On the canvas, thumbnails and exports, show the final state with no motion
    const isStatic = useIsStaticRenderer()
    const delay = open ? 0.12 + i * (settings.stagger / 1000) : 0
    const transition = {
        duration: settings.itemDuration / 1000,
        ease: [0.22, 1, 0.36, 1],
        delay,
    }
    if (settings.itemReveal === "none") return <div>{children}</div>
    if (isStatic) {
        return <div style={{ opacity: open ? 1 : 0 }}>{children}</div>
    }
    if (settings.itemReveal === "rise") {
        return (
            <motion.div
                initial={false}
                animate={{ y: open ? 0 : 16, opacity: open ? 1 : 0 }}
                transition={transition}
            >
                {children}
            </motion.div>
        )
    }
    return (
        <div style={{ overflow: "hidden", paddingBottom: 4, marginBottom: -4 }}>
            <motion.div
                initial={false}
                animate={{ y: open ? "0%" : "110%" }}
                transition={transition}
            >
                {children}
            </motion.div>
        </div>
    )
}

/* =========================================================
   COMPONENT
   ========================================================= */

/**
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 72
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function PillNavBar(props: PillNavBarProps) {
    const {
        logo,
        logoText,
        logoHeight,
        logoLink,
        menuLabel,
        links,
        showSecondary,
        secondaryTitle,
        secondaryLinks,
        showSocials,
        socialTitle,
        socials,
        footerText,
        search,
        language,
        cta,
        colors,
        fonts,
        sizes,
        motionSettings,
        behavior,
        style,
    } = props

    const canvas = isCanvas()

    // Static rendering (canvas, thumbnails, exports): no transitions, no hover
    const isStatic = useIsStaticRenderer()
    const tr = (t: Transition): Transition => (isStatic ? { duration: 0 } : t)
    const hv = <T,>(v: T): T | undefined => (isStatic ? undefined : v)
    const rootRef = useRef<HTMLDivElement>(null)
    const shellRef = useRef<HTMLDivElement>(null)
    const panelInnerRef = useRef<HTMLDivElement>(null)
    const [panelHeight, setPanelHeight] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const langMenuId = React.useId()
    const panelId = React.useId()
    const searchId = React.useId()
    const searchBtnRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLElement>(null)
    const langBtnRef = useRef<HTMLButtonElement>(null)
    const langItemRefs = useRef<Array<HTMLAnchorElement | null>>([])
    const [langFocus, setLangFocus] = useState(-1)
    // Focus highlight only shows for keyboard users, never on mouse clicks
    const [langKeyboard, setLangKeyboard] = useState(false)

    const [open, setOpen] = useState(canvas && behavior.previewOpen)
    const [searching, setSearching] = useState(false)
    const [query, setQuery] = useState("")
    const [langOpen, setLangOpen] = useState(false)
    const [lang, setLang] = useState(
        Math.min(
            language.defaultIndex,
            Math.max(0, (language.items || []).length - 1)
        )
    )
    // null = not measured yet. CTA and language stay hidden until we know
    // whether they fit, so they never pop in and out on load.
    const [compact, setCompact] = useState<boolean | null>(null)
    const logoRef = useRef<HTMLAnchorElement>(null)
    const menuBtnRef = useRef<HTMLButtonElement>(null)
    const measureRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (canvas) setOpen(behavior.previewOpen)
    }, [behavior.previewOpen])

    // Measure the menu content so the panel opens to its exact height
    useEffect(() => {
        const el = panelInnerRef.current
        if (!el) return
        const measure = () => setPanelHeight(el.scrollHeight)
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Compact mode: CTA and language move into the menu when the bar
    // does not have room for them (or the width is under Compact Below).
    const measureFit = () => {
        const root = rootRef.current
        const m = measureRef.current
        if (!root || !m) return
        // offsetWidth ignores canvas zoom and preview scaling, so the
        // measurement matches the real layout size at any zoom level
        const width = root.offsetWidth
        const ctaW =
            (m.querySelector("[data-measure-cta]") as HTMLElement)
                ?.offsetWidth || 0
        const langW =
            (m.querySelector("[data-measure-lang]") as HTMLElement)
                ?.offsetWidth || 0
        const logoW = logoRef.current?.offsetWidth || 0
        const menuW = menuBtnRef.current?.offsetWidth || sizes.buttonSize
        const searchW = search.show ? sizes.buttonSize : 0
        const items = [searchW, langW, ctaW, menuW].filter((w) => w > 0)
        const need =
            logoW +
            items.reduce((a, b) => a + b, 0) +
            (items.length - 1) * 8 +
            8 +
            sizes.barPadding * 2 +
            sizes.shellPadding * 2 +
            8
        const next = width < behavior.compactBelow || width < need
        setCompact((prev) => (prev === next ? prev : next))
    }

    useIsoLayoutEffect(() => {
        measureFit()
    })

    useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const ro = new ResizeObserver(() => measureFit())
        ro.observe(el)
        if (measureRef.current) ro.observe(measureRef.current)
        document.fonts?.ready?.then(() => measureFit())
        return () => ro.disconnect()
    }, [])

    // Close on outside click and Escape
    useEffect(() => {
        if (canvas) return
        const down = (e: PointerEvent) => {
            const t = e.target as Node
            if (
                !rootRef.current?.contains(t) &&
                !shellRef.current?.contains(t)
            ) {
                setOpen(false)
                setLangOpen(false)
                setSearching(false)
            }
        }
        const key = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                const active = document.activeElement
                const inside = shellRef.current?.contains(active)
                const inSearch =
                    !!active && active.closest?.("[role='search']") !== null
                setOpen(false)
                setLangOpen(false)
                setSearching(false)
                if (inSearch) searchBtnRef.current?.focus()
                else if (inside) menuBtnRef.current?.focus()
            }
        }
        document.addEventListener("pointerdown", down)
        document.addEventListener("keydown", key)
        return () => {
            document.removeEventListener("pointerdown", down)
            document.removeEventListener("keydown", key)
        }
    }, [])

    useEffect(() => {
        if (!searching) return
        const id = setTimeout(() => inputRef.current?.focus(), 200)
        return () => clearTimeout(id)
    }, [searching])

    // Closed panel: remove its links from the Tab order and from screen readers
    useEffect(() => {
        const el = panelRef.current
        if (!el) return
        if (open) el.removeAttribute("inert")
        else el.setAttribute("inert", "")
    }, [open])

    // Language menu keyboard support (menu button pattern):
    // open moves focus to the selected language, arrows move between
    // languages, Escape or Tab closes and focus returns to the button.
    const openLangFrom = useRef<"first" | "last" | "current">("current")

    // Every way of opening (click, Enter, Space, arrows) moves focus into the
    // list right after it renders: the selected language by default, the
    // first item for Arrow Down, the last for Arrow Up.
    useIsoLayoutEffect(() => {
        if (!langOpen) {
            setLangFocus(-1)
            return
        }
        if (isStatic) return
        const count = (language.items || []).length
        if (!count) return
        const start =
            openLangFrom.current === "first"
                ? 0
                : openLangFrom.current === "last"
                  ? count - 1
                  : Math.max(0, Math.min(lang, count - 1))
        openLangFrom.current = "current"
        const target = langItemRefs.current[start] || langItemRefs.current[0]
        target?.focus()
    }, [langOpen])

    const closeLang = (returnFocus = true) => {
        setLangOpen(false)
        if (returnFocus)
            requestAnimationFrame(() => langBtnRef.current?.focus())
    }

    const focusLangItem = (i: number) => {
        const count = (language.items || []).length
        if (!count) return
        const next = (i + count) % count
        langItemRefs.current[next]?.focus()
    }

    const onLangButtonKey = (e: React.KeyboardEvent) => {
        setLangKeyboard(true)
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            openLangFrom.current = e.key === "ArrowDown" ? "first" : "current"
            setLangOpen(true)
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            openLangFrom.current = "last"
            setLangOpen(true)
        }
    }

    const onLangItemKey = (e: React.KeyboardEvent, i: number) => {
        setLangKeyboard(true)
        const count = (language.items || []).length
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault()
                focusLangItem(i + 1)
                break
            case "ArrowUp":
                e.preventDefault()
                focusLangItem(i - 1)
                break
            case "Home":
                e.preventDefault()
                focusLangItem(0)
                break
            case "End":
                e.preventDefault()
                focusLangItem(count - 1)
                break
            case "Escape":
                e.preventDefault()
                e.stopPropagation()
                closeLang(true)
                break
            case "Tab":
                closeLang(false)
                break
            case " ":
                e.preventDefault()
                ;(e.currentTarget as HTMLElement).click()
                break
        }
    }

    const submitSearch = (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!query.trim() || canvas) return
        window.location.href = `${search.url}${encodeURIComponent(query.trim())}`
    }

    const s = sizes
    const spring = {
        type: "spring",
        stiffness: motionSettings.stiffness,
        damping: motionSettings.damping,
    }
    const showCtaInBar = cta.show && compact === false
    const showLangInBar = language.show && compact === false
    const langItems = language.items || []
    const currentLang = langItems[lang]

    const iconButton: React.CSSProperties = {
        width: s.buttonSize,
        height: s.buttonSize,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: s.buttonSize,
        border: `1px solid ${colors.barBorder}`,
        background: "transparent",
        color: colors.barText,
        cursor: "pointer",
        padding: 0,
    }

    let index = 0

    const layer = (
        <>
            {/* Page dim */}
            <AnimatePresence>
                {open && behavior.dimPage && !canvas && (
                    <motion.div
                        initial={isStatic ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: colors.dim,
                            zIndex: behavior.zIndex - 1,
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Shell */}
            <motion.div
                ref={shellRef}
                data-hm-skip=""
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: behavior.zIndex,
                    padding: s.shellPadding,
                    borderRadius: s.radius + s.shellPadding,
                    background: colors.shellBg,
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    boxShadow:
                        [
                            open && colors.shadow && colors.shadow !== "none"
                                ? colors.shadow
                                : "",
                            colors.shellBorder
                                ? `inset 0 0 0 1px ${colors.shellBorder}`
                                : "",
                        ]
                            .filter(Boolean)
                            .join(", ") || "none",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* BAR */}
                <div
                    style={{
                        height: s.barHeight,
                        borderRadius: s.radius,
                        background: colors.barBg,
                        color: colors.barText,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        padding: `0 ${s.barPadding}px`,
                        position: "relative",
                    }}
                >
                    {/* Left: logo or search */}
                    <div
                        style={{
                            flex: 1,
                            minWidth: 0,
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            {searching ? (
                                <motion.form
                                    key="search"
                                    id={searchId}
                                    role="search"
                                    aria-label={search.placeholder || "Search"}
                                    onSubmit={submitSearch}
                                    initial={
                                        isStatic ? false : { opacity: 0, x: -8 }
                                    }
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -8 }}
                                    transition={tr({ duration: 0.24 })}
                                    style={{
                                        flex: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                        paddingLeft: 12,
                                        color: colors.barMuted,
                                    }}
                                >
                                    <SearchIcon />
                                    <input
                                        ref={inputRef}
                                        value={query}
                                        onChange={(e) =>
                                            setQuery(e.target.value)
                                        }
                                        placeholder={search.placeholder}
                                        aria-label={
                                            search.placeholder || "Search"
                                        }
                                        style={{
                                            ...fonts.bar,
                                            flex: 1,
                                            minWidth: 0,
                                            background: "transparent",
                                            border: "none",
                                            outline: "none",
                                            color: colors.barText,
                                        }}
                                    />
                                </motion.form>
                            ) : (
                                <motion.a
                                    key="logo"
                                    ref={logoRef}
                                    href={logoLink || "/"}
                                    initial={
                                        isStatic ? false : { opacity: 0, x: 8 }
                                    }
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 8 }}
                                    transition={tr({ duration: 0.24 })}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        paddingLeft: 12,
                                        textDecoration: "none",
                                        color: colors.barText,
                                        whiteSpace: "nowrap",
                                        flexShrink: 0,
                                    }}
                                >
                                    {logo?.src ? (
                                        <img
                                            src={logo.src}
                                            srcSet={logo.srcSet}
                                            alt={logo.alt || logoText}
                                            style={{
                                                height: logoHeight,
                                                width: "auto",
                                                display: "block",
                                            }}
                                        />
                                    ) : (
                                        <span
                                            style={{
                                                ...fonts.logo,
                                                color: colors.barText,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {logoText}
                                        </span>
                                    )}
                                </motion.a>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right controls */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        {search.show && (
                            <motion.button
                                ref={searchBtnRef}
                                aria-label={
                                    searching ? "Close search" : "Open search"
                                }
                                aria-expanded={searching}
                                aria-controls={searchId}
                                onClick={() => {
                                    setSearching((v) => !v)
                                    setLangOpen(false)
                                }}
                                whileHover={hv({
                                    backgroundColor: colors.barHover,
                                })}
                                whileTap={hv({ scale: 0.92 })}
                                style={iconButton}
                            >
                                {searching ? <CloseIcon /> : <SearchIcon />}
                            </motion.button>
                        )}

                        {showLangInBar && currentLang && (
                            <div style={{ position: "relative" }}>
                                <motion.button
                                    ref={langBtnRef}
                                    onClick={() => {
                                        openLangFrom.current = "current"
                                        setLangOpen((v) => !v)
                                    }}
                                    onPointerDown={() => setLangKeyboard(false)}
                                    onKeyDown={onLangButtonKey}
                                    aria-label={`Select language, current: ${currentLang.label || currentLang.code}`}
                                    aria-haspopup="menu"
                                    aria-expanded={langOpen}
                                    aria-controls={langMenuId}
                                    whileHover={hv({
                                        backgroundColor: colors.barHover,
                                    })}
                                    whileTap={hv({ scale: 0.96 })}
                                    style={{
                                        ...iconButton,
                                        width: "auto",
                                        gap: 4,
                                        padding: "0 16px",
                                        ...fonts.bar,
                                    }}
                                >
                                    {currentLang.code}
                                    <Chevron open={langOpen} still={isStatic} />
                                </motion.button>
                                <AnimatePresence>
                                    {langOpen && (
                                        <motion.div
                                            id={langMenuId}
                                            role="menu"
                                            aria-label="Languages"
                                            initial={
                                                isStatic
                                                    ? false
                                                    : {
                                                          opacity: 0,
                                                          y: -8,
                                                          scale: 0.96,
                                                      }
                                            }
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                scale: 1,
                                            }}
                                            exit={{
                                                opacity: 0,
                                                y: -8,
                                                scale: 0.96,
                                            }}
                                            transition={tr({ duration: 0.2 })}
                                            style={{
                                                position: "absolute",
                                                top: s.buttonSize + 12,
                                                right: 0,
                                                minWidth: 160,
                                                padding: 8,
                                                borderRadius: 20,
                                                background: colors.barBg,
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 4,
                                                boxShadow: colors.shadow,
                                                transformOrigin: "top right",
                                            }}
                                        >
                                            {langItems.map((l, i) => (
                                                <motion.a
                                                    key={i}
                                                    ref={(el) =>
                                                        (langItemRefs.current[
                                                            i
                                                        ] = el)
                                                    }
                                                    role="menuitemradio"
                                                    aria-checked={i === lang}
                                                    tabIndex={-1}
                                                    href={l.link || undefined}
                                                    onKeyDown={(e) =>
                                                        onLangItemKey(e, i)
                                                    }
                                                    onPointerMove={() =>
                                                        langKeyboard &&
                                                        setLangKeyboard(false)
                                                    }
                                                    onFocus={() =>
                                                        setLangFocus(i)
                                                    }
                                                    onBlur={() =>
                                                        setLangFocus((f) =>
                                                            f === i ? -1 : f
                                                        )
                                                    }
                                                    onClick={(e) => {
                                                        if (!l.link)
                                                            e.preventDefault()
                                                        setLang(i)
                                                        closeLang(!l.link)
                                                    }}
                                                    whileHover={hv({
                                                        backgroundColor:
                                                            colors.barHover,
                                                    })}
                                                    style={{
                                                        ...fonts.bar,
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        alignItems: "center",
                                                        gap: 12,
                                                        height: 40,
                                                        padding: "0 12px",
                                                        borderRadius: 12,
                                                        color:
                                                            i === lang
                                                                ? colors.barText
                                                                : colors.barMuted,
                                                        background:
                                                            langKeyboard &&
                                                            langFocus === i
                                                                ? colors.barHover
                                                                : "transparent",
                                                        outline: "none",
                                                        textDecoration: "none",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    {l.label}
                                                    <span>{l.code}</span>
                                                </motion.a>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {showCtaInBar && (
                            <motion.a
                                href={cta.link || "#"}
                                target={cta.newTab ? "_blank" : undefined}
                                rel={
                                    cta.newTab
                                        ? "noopener noreferrer"
                                        : undefined
                                }
                                aria-label={newTabLabel(cta.label, cta.newTab)}
                                initial="rest"
                                whileHover={hv("hover")}
                                whileTap={hv({ scale: 0.96 })}
                                style={{
                                    ...fonts.bar,
                                    position: "relative",
                                    overflow: "hidden",
                                    height: s.buttonSize,
                                    padding: "0 20px",
                                    borderRadius: s.buttonSize,
                                    background: colors.ctaBg,
                                    color: colors.ctaText,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    textDecoration: "none",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                <motion.span
                                    variants={{
                                        rest: { scaleX: 0 },
                                        hover: { scaleX: 1 },
                                    }}
                                    transition={tr({
                                        duration: 0.4,
                                        ease: [0.76, 0, 0.24, 1],
                                    })}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: colors.ctaHoverBg,
                                        transformOrigin: "left",
                                    }}
                                />
                                <motion.span
                                    variants={{
                                        rest: { color: colors.ctaText },
                                        hover: { color: colors.ctaHoverText },
                                    }}
                                    style={{
                                        position: "relative",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                >
                                    {cta.label}
                                    {cta.showArrow && <Arrow size={16} />}
                                </motion.span>
                            </motion.a>
                        )}

                        {/* Menu toggle */}
                        <motion.button
                            ref={menuBtnRef}
                            aria-label={open ? "Close menu" : "Open menu"}
                            aria-expanded={open}
                            aria-controls={panelId}
                            onClick={() => {
                                setOpen((v) => !v)
                                setLangOpen(false)
                            }}
                            whileHover={hv({
                                backgroundColor: colors.barHover,
                            })}
                            whileTap={hv({ scale: 0.92 })}
                            style={{
                                ...iconButton,
                                width: menuLabel ? "auto" : s.buttonSize,
                                padding: menuLabel ? "0 16px" : 0,
                                gap: 8,
                                ...fonts.bar,
                            }}
                        >
                            <span
                                aria-hidden="true"
                                style={{
                                    position: "relative",
                                    width: 16,
                                    height: 12,
                                    display: "block",
                                    flexShrink: 0,
                                }}
                            >
                                {[0, 1].map((n) => (
                                    <span
                                        key={n}
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            top: open ? 5 : n === 0 ? 2 : 8,
                                            width: 16,
                                            height: 2,
                                            borderRadius: 2,
                                            background: "currentColor",
                                            transform: `rotate(${open ? (n === 0 ? 45 : -45) : 0}deg)`,
                                            transformOrigin: "50% 50%",
                                            transition: isStatic
                                                ? "none"
                                                : "top 400ms cubic-bezier(0.76, 0, 0.24, 1), transform 400ms cubic-bezier(0.76, 0, 0.24, 1)",
                                        }}
                                    />
                                ))}
                            </span>
                            {menuLabel && (
                                <span
                                    style={{
                                        position: "relative",
                                        overflow: "hidden",
                                        display: "block",
                                        height: "1.25em",
                                    }}
                                >
                                    <motion.span
                                        initial={false}
                                        animate={{ y: open ? "-50%" : "0%" }}
                                        transition={tr({
                                            duration: 0.4,
                                            ease: [0.76, 0, 0.24, 1],
                                        })}
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                        }}
                                    >
                                        <span
                                            style={{
                                                height: "1.25em",
                                                lineHeight: "1.25em",
                                            }}
                                        >
                                            {menuLabel}
                                        </span>
                                        <span
                                            style={{
                                                height: "1.25em",
                                                lineHeight: "1.25em",
                                            }}
                                        >
                                            {behavior.closeLabel}
                                        </span>
                                    </motion.span>
                                </span>
                            )}
                        </motion.button>
                    </div>
                </div>

                {/* PANEL */}
                <motion.nav
                    ref={panelRef}
                    id={panelId}
                    aria-label={behavior.menuTitle || "Menu"}
                    aria-hidden={!open}
                    initial={false}
                    animate={{
                        height: open ? panelHeight : 0,
                        opacity: open ? 1 : 0,
                    }}
                    transition={tr({ ...spring, opacity: { duration: 0.2 } })}
                    style={{ overflow: "hidden" }}
                >
                    <div
                        ref={panelInnerRef}
                        style={{
                            padding: `${s.panelPadding}px ${s.panelPadding}px ${s.panelPadding}px`,
                            display: "flex",
                            flexDirection: "column",
                            gap: 32,
                            color: colors.panelText,
                        }}
                    >
                        {/* Main links */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 16,
                            }}
                        >
                            {behavior.menuTitle && (
                                <Reveal
                                    i={index++}
                                    open={open}
                                    settings={motionSettings}
                                >
                                    <span
                                        style={{
                                            ...fonts.small,
                                            color: colors.panelMuted,
                                        }}
                                    >
                                        {behavior.menuTitle}
                                    </span>
                                </Reveal>
                            )}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: s.navGap,
                                }}
                            >
                                {(links || []).map((l, i) => {
                                    const active =
                                        l.active ||
                                        (!canvas && isActive(l.link))
                                    const myIndex = index++
                                    return (
                                        <Reveal
                                            key={i}
                                            i={myIndex}
                                            open={open}
                                            settings={motionSettings}
                                        >
                                            <motion.a
                                                href={l.link || "#"}
                                                target={
                                                    l.newTab
                                                        ? "_blank"
                                                        : undefined
                                                }
                                                rel={
                                                    l.newTab
                                                        ? "noopener noreferrer"
                                                        : undefined
                                                }
                                                aria-label={newTabLabel(
                                                    l.badge
                                                        ? `${l.label}, ${l.badge}`
                                                        : l.label,
                                                    l.newTab
                                                )}
                                                onClick={() =>
                                                    behavior.closeOnClick &&
                                                    setOpen(false)
                                                }
                                                initial="rest"
                                                whileHover={hv("hover")}
                                                style={{
                                                    ...fonts.nav,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent:
                                                        "space-between",
                                                    gap: 16,
                                                    textDecoration: "none",
                                                    color: active
                                                        ? colors.accent
                                                        : colors.panelText,
                                                }}
                                            >
                                                <motion.span
                                                    variants={{
                                                        rest: {
                                                            x: 0,
                                                            color: active
                                                                ? colors.accent
                                                                : colors.panelText,
                                                        },
                                                        hover: {
                                                            x: 8,
                                                            color: colors.accent,
                                                        },
                                                    }}
                                                    transition={tr({
                                                        duration: 0.3,
                                                        ease: [
                                                            0.22, 1, 0.36, 1,
                                                        ],
                                                    })}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 12,
                                                    }}
                                                >
                                                    {active && (
                                                        <span
                                                            style={{
                                                                width: 8,
                                                                height: 8,
                                                                borderRadius: 8,
                                                                background:
                                                                    colors.accent,
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                    )}
                                                    {l.label}
                                                    {l.badge && (
                                                        <span
                                                            style={{
                                                                ...fonts.small,
                                                                padding:
                                                                    "4px 8px",
                                                                borderRadius: 12,
                                                                background:
                                                                    colors.badgeBg,
                                                                color: colors.badgeText,
                                                            }}
                                                        >
                                                            {l.badge}
                                                        </span>
                                                    )}
                                                </motion.span>
                                                <motion.span
                                                    variants={{
                                                        rest: {
                                                            opacity: 0,
                                                            x: -8,
                                                            rotate: -45,
                                                        },
                                                        hover: {
                                                            opacity: 1,
                                                            x: 0,
                                                            rotate: 0,
                                                        },
                                                    }}
                                                    transition={tr({
                                                        duration: 0.3,
                                                    })}
                                                    style={{
                                                        color: colors.accent,
                                                        display: "flex",
                                                    }}
                                                >
                                                    <Arrow size={24} />
                                                </motion.span>
                                            </motion.a>
                                        </Reveal>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Compact extras: language + CTA */}
                        {compact === true && (language.show || cta.show) && (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 16,
                                }}
                            >
                                {language.show && langItems.length > 0 && (
                                    <Reveal
                                        i={index++}
                                        open={open}
                                        settings={motionSettings}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: 8,
                                            }}
                                        >
                                            {langItems.map((l, i) => (
                                                <a
                                                    key={i}
                                                    href={l.link || undefined}
                                                    onClick={(e) => {
                                                        if (!l.link)
                                                            e.preventDefault()
                                                        setLang(i)
                                                    }}
                                                    style={{
                                                        ...fonts.small,
                                                        height: 32,
                                                        padding: "0 12px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        borderRadius: 32,
                                                        border: `1px solid ${colors.divider}`,
                                                        background:
                                                            i === lang
                                                                ? colors.panelText
                                                                : "transparent",
                                                        color:
                                                            i === lang
                                                                ? colors.shellSolid
                                                                : colors.panelText,
                                                        textDecoration: "none",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    {l.code}
                                                </a>
                                            ))}
                                        </div>
                                    </Reveal>
                                )}
                                {cta.show && (
                                    <Reveal
                                        i={index++}
                                        open={open}
                                        settings={motionSettings}
                                    >
                                        <a
                                            href={cta.link || "#"}
                                            target={
                                                cta.newTab
                                                    ? "_blank"
                                                    : undefined
                                            }
                                            rel={
                                                cta.newTab
                                                    ? "noopener noreferrer"
                                                    : undefined
                                            }
                                            aria-label={newTabLabel(
                                                cta.label,
                                                cta.newTab
                                            )}
                                            style={{
                                                ...fonts.bar,
                                                height: 56,
                                                borderRadius: 56,
                                                background: colors.barBg,
                                                color: colors.barText,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 8,
                                                textDecoration: "none",
                                            }}
                                        >
                                            {cta.label}
                                            {cta.showArrow && (
                                                <Arrow size={16} />
                                            )}
                                        </a>
                                    </Reveal>
                                )}
                            </div>
                        )}

                        {(showSecondary || showSocials || footerText) && (
                            <div
                                style={{
                                    height: 1,
                                    background: colors.divider,
                                }}
                            />
                        )}

                        {/* Secondary + socials */}
                        {(showSecondary || showSocials) && (
                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    justifyContent: "space-between",
                                    gap: 32,
                                }}
                            >
                                {showSecondary && (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 12,
                                        }}
                                    >
                                        {secondaryTitle && (
                                            <Reveal
                                                i={index++}
                                                open={open}
                                                settings={motionSettings}
                                            >
                                                <span
                                                    style={{
                                                        ...fonts.small,
                                                        color: colors.panelMuted,
                                                    }}
                                                >
                                                    {secondaryTitle}
                                                </span>
                                            </Reveal>
                                        )}
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 8,
                                            }}
                                        >
                                            {(secondaryLinks || []).map(
                                                (l, i) => (
                                                    <Reveal
                                                        key={i}
                                                        i={index++}
                                                        open={open}
                                                        settings={
                                                            motionSettings
                                                        }
                                                    >
                                                        <motion.a
                                                            href={l.link || "#"}
                                                            target={
                                                                l.newTab
                                                                    ? "_blank"
                                                                    : undefined
                                                            }
                                                            rel={
                                                                l.newTab
                                                                    ? "noopener noreferrer"
                                                                    : undefined
                                                            }
                                                            aria-label={newTabLabel(
                                                                l.label,
                                                                l.newTab
                                                            )}
                                                            onClick={() =>
                                                                behavior.closeOnClick &&
                                                                setOpen(false)
                                                            }
                                                            whileHover={hv({
                                                                color: colors.accent,
                                                            })}
                                                            style={{
                                                                ...fonts.secondary,
                                                                color: colors.panelText,
                                                                textDecoration:
                                                                    "none",
                                                            }}
                                                        >
                                                            {l.label}
                                                        </motion.a>
                                                    </Reveal>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                                {showSocials && (socials || []).length > 0 && (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 12,
                                        }}
                                    >
                                        {socialTitle && (
                                            <Reveal
                                                i={index++}
                                                open={open}
                                                settings={motionSettings}
                                            >
                                                <span
                                                    style={{
                                                        ...fonts.small,
                                                        color: colors.panelMuted,
                                                    }}
                                                >
                                                    {socialTitle}
                                                </span>
                                            </Reveal>
                                        )}
                                        <Reveal
                                            i={index++}
                                            open={open}
                                            settings={motionSettings}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: 8,
                                                }}
                                            >
                                                {(socials || []).map(
                                                    (sc, i) => (
                                                        <motion.a
                                                            key={i}
                                                            href={
                                                                sc.link || "#"
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            aria-label={newTabLabel(
                                                                SOCIAL_NAMES[
                                                                    sc.platform
                                                                ] ||
                                                                    sc.platform,
                                                                true
                                                            )}
                                                            whileHover={hv({
                                                                backgroundColor:
                                                                    colors.panelText,
                                                                color: colors.shellSolid,
                                                                y: -4,
                                                            })}
                                                            transition={tr({
                                                                duration: 0.2,
                                                            })}
                                                            style={{
                                                                width: 40,
                                                                height: 40,
                                                                borderRadius: 40,
                                                                border: `1px solid ${colors.divider}`,
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                                color: colors.panelText,
                                                            }}
                                                        >
                                                            {
                                                                SOCIAL_ICONS[
                                                                    sc.platform
                                                                ]
                                                            }
                                                        </motion.a>
                                                    )
                                                )}
                                            </div>
                                        </Reveal>
                                    </div>
                                )}
                            </div>
                        )}

                        {footerText && (
                            <Reveal
                                i={index++}
                                open={open}
                                settings={motionSettings}
                            >
                                <span
                                    style={{
                                        ...fonts.small,
                                        color: colors.panelMuted,
                                    }}
                                >
                                    {footerText}
                                </span>
                            </Reveal>
                        )}
                    </div>
                </motion.nav>
            </motion.div>
        </>
    )

    return (
        <div
            ref={rootRef}
            data-hm-skip=""
            style={{
                ...style,
                position: "relative",
                height: s.barHeight + s.shellPadding * 2,
                overflow: "visible",
                zIndex: behavior.zIndex,
            }}
        >
            {/* Invisible copies used only to measure if CTA and language fit */}
            <div
                ref={measureRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    display: "flex",
                    gap: 8,
                    visibility: "hidden",
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                    height: 0,
                    overflow: "visible",
                }}
            >
                {language.show && currentLang && (
                    <span
                        data-measure-lang=""
                        style={{
                            ...fonts.bar,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "0 16px",
                            border: "1px solid transparent",
                        }}
                    >
                        {currentLang.code}
                        <span
                            style={{ width: 12, height: 12, display: "block" }}
                        />
                    </span>
                )}
                {cta.show && (
                    <span
                        data-measure-cta=""
                        style={{
                            ...fonts.bar,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "0 20px",
                        }}
                    >
                        {cta.label}
                        {cta.showArrow && (
                            <span
                                style={{
                                    width: 16,
                                    height: 16,
                                    display: "block",
                                }}
                            />
                        )}
                    </span>
                )}
            </div>
            {layer}
        </div>
    )
}

/* =========================================================
   DEFAULTS
   ========================================================= */

const FONT_STACK = `"Inter Display", "Inter", system-ui, sans-serif`

PillNavBar.defaultProps = {
    logoText: "Logo Here",
    logoHeight: 28,
    logoLink: "/",
    menuLabel: "Menu",
    links: [
        { label: "Home", link: "/", active: false, newTab: false, badge: "" },
        {
            label: "About",
            link: "/about",
            active: false,
            newTab: false,
            badge: "",
        },
        {
            label: "Services",
            link: "/services",
            active: false,
            newTab: false,
            badge: "New",
        },
        {
            label: "Work",
            link: "/work",
            active: false,
            newTab: false,
            badge: "",
        },
        {
            label: "Contact",
            link: "/contact",
            active: false,
            newTab: false,
            badge: "",
        },
    ],
    showSecondary: true,
    secondaryTitle: "Legal",
    secondaryLinks: [
        { label: "Privacy Policy", link: "/privacy", newTab: false },
        { label: "Terms & Conditions", link: "/terms", newTab: false },
    ],
    showSocials: true,
    socialTitle: "Follow",
    socials: [
        { platform: "instagram", link: "https://instagram.com" },
        { platform: "x", link: "https://x.com" },
        { platform: "linkedin", link: "https://linkedin.com" },
        { platform: "youtube", link: "https://youtube.com" },
    ],
    footerText: "hello@yourdomain.com",
    search: {
        show: true,
        placeholder: "Search",
        url: "/search?q=",
    },
    language: {
        show: true,
        defaultIndex: 0,
        items: [
            { label: "English", code: "EN", link: "" },
            { label: "Español", code: "ES", link: "" },
            { label: "Français", code: "FR", link: "" },
        ],
    },
    cta: {
        show: true,
        label: "Get Started",
        link: "/contact",
        newTab: false,
        showArrow: true,
    },
    colors: {
        barBg: "#161616",
        barText: "#FFFFFF",
        barMuted: "rgba(255,255,255,0.56)",
        barBorder: "rgba(255,255,255,0.16)",
        barHover: "rgba(255,255,255,0.08)",
        shellBg: "rgba(255,255,255,0.88)",
        shellSolid: "#FFFFFF",
        panelText: "#161616",
        panelMuted: "#8C8C8C",
        accent: "#FF5C35",
        divider: "rgba(22,22,22,0.12)",
        ctaBg: "#FFFFFF",
        ctaText: "#161616",
        ctaHoverBg: "#FF5C35",
        ctaHoverText: "#FFFFFF",
        badgeBg: "#FFE8E1",
        badgeText: "#FF5C35",
        dim: "rgba(0,0,0,0.16)",
        shellBorder: "rgba(0,0,0,0.08)",
        shadow: "0px 8px 32px rgba(0,0,0,0.08)",
    },
    fonts: {
        logo: {
            fontFamily: FONT_STACK,
            fontSize: 24,
            lineHeight: "28px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
        },
        bar: {
            fontFamily: FONT_STACK,
            fontSize: 16,
            lineHeight: "20px",
            fontWeight: 500,
        },
        nav: {
            fontFamily: FONT_STACK,
            fontSize: 40,
            lineHeight: "48px",
            fontWeight: 500,
            letterSpacing: "-0.02em",
        },
        secondary: {
            fontFamily: FONT_STACK,
            fontSize: 16,
            lineHeight: "24px",
            fontWeight: 500,
        },
        small: {
            fontFamily: FONT_STACK,
            fontSize: 12,
            lineHeight: "16px",
            fontWeight: 500,
        },
    },
    sizes: {
        barHeight: 64,
        radius: 32,
        shellPadding: 4,
        barPadding: 8,
        buttonSize: 48,
        panelPadding: 32,
        navGap: 8,
    },
    motionSettings: {
        itemReveal: "cutout",
        stagger: 48,
        itemDuration: 640,
        stiffness: 260,
        damping: 30,
    },
    behavior: {
        menuTitle: "Menu",
        closeLabel: "Close",
        closeOnClick: true,
        dimPage: false,
        compactBelow: 0,
        zIndex: 1000,
        previewOpen: false,
    },
}

/* =========================================================
   CONTROLS
   ========================================================= */

const fontControl = (title: string) => ({
    type: ControlType.Font,
    title,
    controls: "extended",
    defaultFontType: "sans-serif",
})

addPropertyControls(PillNavBar, {
    logo: { type: ControlType.ResponsiveImage, title: "Logo" },
    logoText: {
        type: ControlType.String,
        title: "Logo Text",
        description: "Shown when no logo image is set",
    },
    logoHeight: {
        type: ControlType.Number,
        title: "Logo Height",
        min: 12,
        max: 48,
        step: 4,
        unit: "px",
    },
    logoLink: { type: ControlType.Link, title: "Logo Link" },
    menuLabel: {
        type: ControlType.String,
        title: "Menu Label",
        description: "Leave empty for an icon only button",
    },

    links: {
        type: ControlType.Array,
        title: "Nav Links",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label" },
                link: { type: ControlType.Link, title: "Link" },
                badge: { type: ControlType.String, title: "Badge" },
                active: { type: ControlType.Boolean, title: "Active" },
                newTab: { type: ControlType.Boolean, title: "New Tab" },
            },
        },
    },

    showSecondary: { type: ControlType.Boolean, title: "Extra Links" },
    secondaryTitle: {
        type: ControlType.String,
        title: "Extra Title",
        hidden: (p: PillNavBarProps) => !p.showSecondary,
    },
    secondaryLinks: {
        type: ControlType.Array,
        title: "Extra Links",
        maxCount: 8,
        hidden: (p: PillNavBarProps) => !p.showSecondary,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label" },
                link: { type: ControlType.Link, title: "Link" },
                newTab: { type: ControlType.Boolean, title: "New Tab" },
            },
        },
    },

    showSocials: { type: ControlType.Boolean, title: "Socials" },
    socialTitle: {
        type: ControlType.String,
        title: "Socials Title",
        hidden: (p: PillNavBarProps) => !p.showSocials,
    },
    socials: {
        type: ControlType.Array,
        title: "Social Links",
        maxCount: 8,
        hidden: (p: PillNavBarProps) => !p.showSocials,
        control: {
            type: ControlType.Object,
            controls: {
                platform: {
                    type: ControlType.Enum,
                    title: "Platform",
                    options: [
                        "instagram",
                        "x",
                        "tiktok",
                        "youtube",
                        "linkedin",
                        "facebook",
                        "whatsapp",
                        "dribbble",
                    ],
                    optionTitles: [
                        "Instagram",
                        "X",
                        "TikTok",
                        "YouTube",
                        "LinkedIn",
                        "Facebook",
                        "WhatsApp",
                        "Dribbble",
                    ],
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
    },
    footerText: { type: ControlType.String, title: "Footer Text" },

    search: {
        type: ControlType.Object,
        title: "Search",
        controls: {
            show: { type: ControlType.Boolean, title: "Show" },
            placeholder: { type: ControlType.String, title: "Placeholder" },
            url: {
                type: ControlType.String,
                title: "Results URL",
                description: "The typed text is added to the end",
            },
        },
    },

    language: {
        type: ControlType.Object,
        title: "Language",
        controls: {
            show: { type: ControlType.Boolean, title: "Show" },
            defaultIndex: {
                type: ControlType.Number,
                title: "Default",
                min: 0,
                max: 11,
                step: 1,
                displayStepper: true,
            },
            items: {
                type: ControlType.Array,
                title: "Languages",
                maxCount: 12,
                control: {
                    type: ControlType.Object,
                    controls: {
                        label: { type: ControlType.String, title: "Name" },
                        code: { type: ControlType.String, title: "Code" },
                        link: { type: ControlType.Link, title: "Link" },
                    },
                },
            },
        },
    },

    cta: {
        type: ControlType.Object,
        title: "CTA",
        controls: {
            show: { type: ControlType.Boolean, title: "Show" },
            label: { type: ControlType.String, title: "Label" },
            link: { type: ControlType.Link, title: "Link" },
            newTab: { type: ControlType.Boolean, title: "New Tab" },
            showArrow: { type: ControlType.Boolean, title: "Arrow" },
        },
    },

    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            barBg: { type: ControlType.Color, title: "Bar" },
            barText: { type: ControlType.Color, title: "Bar Text" },
            barMuted: { type: ControlType.Color, title: "Bar Muted" },
            barBorder: { type: ControlType.Color, title: "Button Border" },
            barHover: { type: ControlType.Color, title: "Button Hover" },
            shellBg: { type: ControlType.Color, title: "Panel" },
            shellSolid: { type: ControlType.Color, title: "Panel Solid" },
            panelText: { type: ControlType.Color, title: "Panel Text" },
            panelMuted: { type: ControlType.Color, title: "Panel Muted" },
            accent: { type: ControlType.Color, title: "Accent" },
            divider: { type: ControlType.Color, title: "Divider" },
            ctaBg: { type: ControlType.Color, title: "CTA" },
            ctaText: { type: ControlType.Color, title: "CTA Text" },
            ctaHoverBg: { type: ControlType.Color, title: "CTA Hover" },
            ctaHoverText: { type: ControlType.Color, title: "CTA Hover Text" },
            badgeBg: { type: ControlType.Color, title: "Badge" },
            badgeText: { type: ControlType.Color, title: "Badge Text" },
            dim: { type: ControlType.Color, title: "Page Dim" },
            shellBorder: { type: ControlType.Color, title: "Panel Border" },
            shadow: {
                type: ControlType.String,
                title: "Shadow",
                description:
                    "CSS shadow, or none. Needs Overflow: Visible on parent frames",
            },
        },
    },

    fonts: {
        type: ControlType.Object,
        title: "Fonts",
        controls: {
            logo: fontControl("Logo Text"),
            bar: fontControl("Bar"),
            nav: fontControl("Nav Links"),
            secondary: fontControl("Extra Links"),
            small: fontControl("Labels"),
        },
    },

    sizes: {
        type: ControlType.Object,
        title: "Sizes",
        controls: {
            barHeight: {
                type: ControlType.Number,
                title: "Bar Height",
                min: 40,
                max: 96,
                step: 4,
                unit: "px",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 48,
                step: 4,
                unit: "px",
            },
            shellPadding: {
                type: ControlType.Number,
                title: "Outline",
                min: 0,
                max: 16,
                step: 4,
                unit: "px",
            },
            barPadding: {
                type: ControlType.Number,
                title: "Bar Padding",
                min: 0,
                max: 24,
                step: 4,
                unit: "px",
            },
            buttonSize: {
                type: ControlType.Number,
                title: "Button Size",
                min: 32,
                max: 64,
                step: 4,
                unit: "px",
            },
            panelPadding: {
                type: ControlType.Number,
                title: "Panel Padding",
                min: 16,
                max: 64,
                step: 4,
                unit: "px",
            },
            navGap: {
                type: ControlType.Number,
                title: "Nav Gap",
                min: 0,
                max: 32,
                step: 4,
                unit: "px",
            },
        },
    },

    motionSettings: {
        type: ControlType.Object,
        title: "Animation",
        controls: {
            itemReveal: {
                type: ControlType.Enum,
                title: "Items",
                options: ["cutout", "rise", "none"],
                optionTitles: ["Cutout", "Rise", "None"],
                displaySegmentedControl: true,
            },
            stagger: {
                type: ControlType.Number,
                title: "Stagger",
                min: 0,
                max: 200,
                step: 4,
                unit: "ms",
            },
            itemDuration: {
                type: ControlType.Number,
                title: "Item Speed",
                min: 200,
                max: 1600,
                step: 40,
                unit: "ms",
            },
            stiffness: {
                type: ControlType.Number,
                title: "Panel Stiffness",
                min: 80,
                max: 600,
                step: 10,
            },
            damping: {
                type: ControlType.Number,
                title: "Panel Damping",
                min: 10,
                max: 60,
                step: 1,
            },
        },
    },

    behavior: {
        type: ControlType.Object,
        title: "Behavior",
        controls: {
            menuTitle: { type: ControlType.String, title: "Menu Title" },
            closeLabel: { type: ControlType.String, title: "Close Label" },
            closeOnClick: {
                type: ControlType.Boolean,
                title: "Close on Click",
            },
            dimPage: {
                type: ControlType.Boolean,
                title: "Dim Page",
                description: "Darkens the page behind the open menu",
            },
            compactBelow: {
                type: ControlType.Number,
                title: "Compact Below",
                min: 320,
                max: 1200,
                step: 8,
                unit: "px",
                description:
                    "CTA and language move into the menu when they do not fit, or when the nav is narrower than this",
            },
            zIndex: {
                type: ControlType.Number,
                title: "Layer Order",
                min: 1,
                max: 99999,
                step: 1,
                description: "Keep this higher than anything else on the page",
            },
            previewOpen: {
                type: ControlType.Boolean,
                title: "Open on Canvas",
                description: "Keep the menu open while designing",
            },
        },
    },
})
