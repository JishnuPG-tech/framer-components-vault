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

import { motion, useReducedMotion, useMotionValue, useSpring, useTransform, animate } from "framer-motion"

const useSafeLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

type Item = { label: string; icon: string; link?: string; newTab?: boolean }
type ThemeColors = { surface: string; ink: string; muted: string; button: string; buttonInk: string }
interface Props {
    style?: React.CSSProperties
    theme: "light" | "dark"
    brand: string
    logo?: { src: string; srcSet?: string; alt?: string }
    brandLink?: string
    brandNewTab?: boolean
    startOpen?: boolean
    triggerInset?: number
    pageOverlay?: boolean
    overlayColors?: { light: string; dark: string }
    font?: React.CSSProperties
    customColors?: boolean
    lightColors?: ThemeColors
    darkColors?: ThemeColors
    triggerLabel: string
    items: Item[]
    activeItem: number
    drawerWidth: number
    phoneWidth: number
    layout: "auto" | "desktop" | "phone"
    showThemeToggle: boolean
    ctaLabel: string
    ctaLink: string
    ctaNewTab: boolean
    padding: string
    corners: string
    blur: number
    duration: number
}

const defaults: Item[] = [
    { label: "Overview", icon: "Home", link: "", newTab: false },
    { label: "Work", icon: "Briefcase", link: "", newTab: false },
    { label: "Services", icon: "Layers", link: "", newTab: false },
    { label: "About", icon: "Users", link: "", newTab: false },
    { label: "Journal", icon: "Sparkles", link: "", newTab: false },
    { label: "Contact", icon: "Mail", link: "", newTab: false },
]
const paths: Record<string, string> = {
    Home: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
    Briefcase: "M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M3 6h18v14H3zM3 11c6 4 12 4 18 0M12 11v4",
    Layers: "m12 3 10 5-10 5L2 8zM2 12l10 5 10-5M2 16l10 5 10-5",
    Users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    Sparkles: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5zM4 2v4M2 4h4M20 18v4M18 20h4",
    Mail: "M3 5h18v14H3zM3 6l9 7 9-7",
    Menu: "M4 8h16M4 16h16",
    Close: "m6 6 12 12M18 6 6 18",
    Arrow: "M6 18 18 6M6 6h12v12",
    Sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5",
    Moon: "M20.5 13.2A9 9 0 0 1 10.8 3.5a9 9 0 1 0 9.7 9.7Z",
}
function Icon({ name, size = 20 }: { name: string; size?: number }) {
    if (name === "None") return null
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}><path d={paths[name] || paths.Home} /></svg>
}

const light = {
    edge: "linear-gradient(180deg,#fff 0%,#c9c9c9 9%,#a1a1a1 32%,#757575 73%,#fff 100%)",
    surface: "linear-gradient(150deg,rgba(208,208,208,.72) 0%,rgba(232,232,232,.64) 50.17%,rgba(200,200,200,.76) 100%)",
    ink: "#24262C", muted: "#545861", line: "rgba(45,50,60,.16)",
    inner: "inset 0 1px 1.5px rgba(0,0,0,.07),inset 0 -1px 1.5px rgba(0,0,0,.07),inset -1px 0 1px rgba(255,255,255,.7)",
    lensEdge: "linear-gradient(155deg,rgba(255,255,255,.72),rgba(255,255,255,.23) 40%,rgba(102,108,117,.20))",
    lens: "linear-gradient(150deg,rgba(255,255,255,.20),rgba(255,255,255,.12))",
    lensShadow: "inset 0 1px 0 rgba(255,255,255,.35),0 1px 2px rgba(40,45,56,.07)",
    button: "linear-gradient(180deg,#30333a,#0c0d10)", buttonInk: "#fff",
}
const dark = {
    edge: "linear-gradient(145deg,rgba(210,230,255,.65),rgba(116,163,255,.24) 25%,rgba(13,28,62,.12) 50%,rgba(104,153,255,.35) 78%,rgba(220,234,255,.64))",
    surface: "linear-gradient(150deg,rgba(25,38,68,.78),rgba(15,23,42,.70) 52%,rgba(10,17,33,.82))",
    ink: "#F1F5FF", muted: "#CDD9ED", line: "rgba(188,210,255,.17)",
    inner: "inset 0 1px 1.5px rgba(235,243,255,.36),inset 0 -1px 1.5px rgba(82,144,255,.32),inset -1px 0 0 rgba(210,230,255,.36)",
    lensEdge: "linear-gradient(155deg,rgba(231,244,255,.48),rgba(154,190,238,.16) 40%,rgba(108,151,214,.20))",
    lens: "linear-gradient(150deg,rgba(179,209,255,.13),rgba(171,207,255,.07))",
    lensShadow: "inset 0 1px 0 rgba(225,240,255,.25),0 1px 2px rgba(0,0,0,.12)",
    button: "linear-gradient(180deg,#456cdb,#274aa8)", buttonInk: "#fff",
}
const defaultLightColors: ThemeColors = { surface: "rgba(224,225,228,.68)", ink: light.ink, muted: light.muted, button: "#202329", buttonInk: light.buttonInk }
const defaultDarkColors: ThemeColors = { surface: "rgba(18,28,49,.76)", ink: dark.ink, muted: dark.muted, button: "#365BC2", buttonInk: dark.buttonInk }


// Navigation glass is independent of the already-approved controls and CTA.
const markerGlass = {
    light: {
        fill: "linear-gradient(130deg,rgba(255,255,255,.27),rgba(255,255,255,.13))",
        rim: "linear-gradient(145deg,rgba(255,255,255,.96),rgba(255,255,255,.35) 48%,rgba(94,110,132,.30))",
        shadow: "inset 0 1px 0 rgba(255,255,255,.40),0 2px 5px -2px rgba(40,45,56,.18)",
        reflection: "linear-gradient(112deg,transparent 12%,rgba(255,255,255,.035) 32%,rgba(255,255,255,.20) 46%,rgba(255,255,255,.045) 57%,transparent 76%)",
    },
    dark: {
        fill: "linear-gradient(130deg,rgba(179,209,255,.19),rgba(171,207,255,.085))",
        rim: "linear-gradient(145deg,rgba(231,244,255,.78),rgba(154,190,238,.24) 48%,rgba(108,151,214,.30))",
        shadow: "inset 0 1px 0 rgba(225,240,255,.32),0 2px 5px -2px rgba(0,0,0,.27)",
        reflection: "linear-gradient(112deg,transparent 12%,rgba(224,239,255,.025) 32%,rgba(224,239,255,.15) 46%,rgba(224,239,255,.03) 57%,transparent 76%)",
    },
}
const rimMask: React.CSSProperties = {
    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    WebkitMaskComposite: "xor",
    maskComposite: "exclude",
}
const triggerGlass = {
    light: {
        rim: "linear-gradient(145deg,rgba(255,255,255,.96),rgba(255,255,255,.58) 24%,rgba(115,128,146,.22) 57%,rgba(255,255,255,.74))",
        reflection: "linear-gradient(112deg,rgba(255,255,255,.10),transparent 24%,rgba(255,255,255,.20) 47%,rgba(255,255,255,.035) 60%,transparent 78%)",
    },
    dark: {
        rim: "linear-gradient(145deg,rgba(231,244,255,.78),rgba(174,202,244,.34) 24%,rgba(100,141,203,.15) 57%,rgba(211,231,255,.50))",
        reflection: "linear-gradient(112deg,rgba(224,239,255,.06),transparent 24%,rgba(224,239,255,.10) 47%,rgba(224,239,255,.02) 60%,transparent 78%)",
    },
}
// Crossfade only paint layers; one backdrop filter remains behind the entire panel.
function ThemePaint({ darkMode, lightFill, darkFill }: { darkMode: boolean; lightFill: string; darkFill: string }) {
    return <>{[lightFill, darkFill].map((background, i) => <span key={i} className="gsm-paint" aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "inherit", background, opacity: (i === 1) === darkMode ? 1 : 0, pointerEvents: "none" }} />)}</>
}
const styles = `
[data-glass-side-menu] .gsm-control:focus-visible { outline: 2px solid var(--gsm-focus); outline-offset: 3px; }
[data-glass-side-menu] .gsm-control { -webkit-tap-highlight-color: transparent; }
[data-glass-side-menu] .gsm-scroll { scrollbar-width: none; }
[data-glass-side-menu] .gsm-paint { transition: opacity 360ms cubic-bezier(.22,1,.36,1); }
[data-glass-side-menu] .gsm-subtle { transition: filter 220ms ease, background-color 280ms ease, box-shadow 280ms ease, color 220ms ease; }
[data-glass-side-menu] .gsm-subtle:active { filter: brightness(.96); }
[data-glass-side-menu] .gsm-nav { transition: color 200ms ease; }
[data-glass-side-menu] .gsm-nav svg { opacity: .84; transition: opacity 200ms ease; }
[data-glass-side-menu] .gsm-nav[aria-current="page"] svg, [data-glass-side-menu] .gsm-nav:focus-visible svg { opacity: 1; }
[data-glass-side-menu] .gsm-dot { transition: opacity 220ms ease; }
[data-glass-side-menu] [data-glass-reflection], [data-glass-side-menu] [data-glass-marker], [data-glass-side-menu] [data-theme-thumb], [data-glass-side-menu] [data-glass-drawer] { transition: box-shadow 360ms ease; }
[data-glass-side-menu] .gsm-scroll::-webkit-scrollbar { display: none; }
[data-glass-side-menu] .gsm-cta { box-shadow: inset 0 1px 1px rgba(255,255,255,.28), 0 7px 16px -6px rgba(0,0,0,.38); transition: box-shadow 180ms ease, transform 140ms ease; }
[data-glass-side-menu] .gsm-cta-shine { position: absolute; left: -80px; top: -20px; width: 70px; height: 90px; transform: rotate(20deg); opacity: 0; pointer-events: none; background: linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent); }
[data-glass-side-menu] .gsm-cta-arrow { display: flex; transition: transform 220ms ease; }
@media (hover: hover) {
 [data-glass-side-menu] .gsm-nav:hover svg { opacity: 1; }
 [data-glass-side-menu] .gsm-cta:hover { box-shadow: inset 0 1px 1px rgba(255,255,255,.45), 0 12px 24px -6px rgba(0,0,0,.58); }
 [data-glass-side-menu] .gsm-cta:hover .gsm-cta-shine { left: calc(100% + 10px); opacity: 1; transition: left 800ms cubic-bezier(.25,.1,.25,1), opacity 100ms; }
 [data-glass-side-menu] .gsm-cta:hover .gsm-cta-arrow { transform: translate(2px,-2px); }
 [data-glass-side-menu] .gsm-subtle:hover:not(:active) { filter: brightness(1.06); }
 [data-glass-side-menu] .gsm-close:hover { background: var(--gsm-close-hover); box-shadow: inset 0 1px 0 rgba(255,255,255,.38),0 2px 5px var(--gsm-close-shadow); }
 [data-glass-side-menu] .gsm-close:hover .gsm-close-rim { opacity: 1; }
 [data-glass-side-menu] .gsm-close:hover .gsm-close-icon { opacity: 1; }
 [data-glass-side-menu] .gsm-trigger:hover .gsm-menu-line:first-child { transform: translateX(-2px); }
 [data-glass-side-menu] .gsm-trigger:hover .gsm-menu-line:last-child { transform: translateX(2px); }
 [data-glass-side-menu] .gsm-trigger:hover { box-shadow: 0 5px 14px rgba(0,0,0,.14),inset 0 1px 0 rgba(255,255,255,.42); }
 [data-glass-side-menu] .gsm-trigger:hover .gsm-trigger-reflection { opacity: 1; }
}
[data-glass-side-menu] .gsm-cta:focus-visible { box-shadow: inset 0 1px 1px rgba(255,255,255,.45), 0 12px 24px -6px rgba(0,0,0,.58); }
[data-glass-side-menu] .gsm-cta:focus-visible .gsm-cta-shine { left: calc(100% + 10px); opacity: 1; transition: left 800ms cubic-bezier(.25,.1,.25,1), opacity 100ms; }
[data-glass-side-menu] .gsm-cta:active { transform: translateY(1px); box-shadow: inset 0 1px 2px rgba(255,255,255,.22), 0 3px 8px -3px rgba(0,0,0,.34); }
[data-glass-side-menu] .gsm-close { background: var(--gsm-close-fill); box-shadow: inset 0 1px 0 rgba(255,255,255,.28),0 1px 2px rgba(0,0,0,.05); transition: background-color 220ms ease, box-shadow 220ms ease; }
[data-glass-side-menu] .gsm-close-icon { position: relative; display: inline-flex; opacity: .82; transition: opacity 200ms ease; }
[data-glass-side-menu] .gsm-close-rim { opacity: .35; transition: opacity 220ms ease; }
[data-glass-side-menu] .gsm-close:focus-visible { background: var(--gsm-close-hover); box-shadow: inset 0 1px 0 rgba(255,255,255,.38),0 2px 5px var(--gsm-close-shadow); }
[data-glass-side-menu] .gsm-close:focus-visible .gsm-close-rim, [data-glass-side-menu] .gsm-close:focus-visible .gsm-close-icon { opacity: 1; }
[data-glass-side-menu] .gsm-close:active { background: var(--gsm-close-press); box-shadow: inset 0 1px 2px rgba(0,0,0,.10); }
[data-glass-side-menu] .gsm-close:active .gsm-close-rim { opacity: .5; }
[data-glass-side-menu] .gsm-trigger { box-shadow: 0 3px 10px rgba(0,0,0,.10),inset 0 1px 0 rgba(255,255,255,.28); transition: box-shadow 240ms ease; }
[data-glass-side-menu] .gsm-trigger-reflection { opacity: .65; transition: opacity 300ms cubic-bezier(.22,1,.36,1); }
[data-glass-side-menu] .gsm-trigger:focus-visible .gsm-trigger-reflection { opacity: 1; }
[data-glass-side-menu] .gsm-menu-line { display: block; width: 16px; height: 1.5px; border-radius: 2px; background: currentColor; transition: transform 240ms cubic-bezier(.22,1,.36,1); }
dialog[data-glass-dialog]::backdrop { background: transparent; }
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
 [data-glass-side-menu][data-theme="light"] [data-glass-surface] { background: #e3e3e5 !important; }
 [data-glass-side-menu][data-theme="dark"] [data-glass-surface] { background: #121d33 !important; }
 [data-glass-side-menu] [data-glass-surface] { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
}
@media (prefers-reduced-motion: reduce) {
 [data-glass-side-menu] .gsm-control, [data-glass-side-menu] .gsm-cta-arrow, [data-glass-side-menu] .gsm-paint, [data-glass-side-menu] .gsm-dot, [data-glass-side-menu] [data-glass-reflection], [data-glass-side-menu] [data-glass-marker], [data-glass-side-menu] [data-theme-thumb], [data-glass-side-menu] [data-glass-drawer] { transition: none !important; }
 [data-glass-side-menu] .gsm-close-icon, [data-glass-side-menu] .gsm-close-rim, [data-glass-side-menu] .gsm-menu-line { transition: none !important; transform: none !important; }
 [data-glass-side-menu] .gsm-nav svg { transition: none !important; }
 [data-glass-side-menu] .gsm-trigger-reflection { transition: none !important; }
 [data-glass-side-menu] .gsm-cta-shine { display: none; }
}
`

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 110
 * @framerIntrinsicHeight 48
 * @framerDisableUnlink
 */
export default function GlassSideMenu(props: Props) {
    const { style, theme = "light", brand = "Auren", logo, brandLink = "", brandNewTab = false, startOpen = false, triggerInset = 0, pageOverlay = false, overlayColors = { light: "rgba(24,30,40,.12)", dark: "rgba(6,12,25,.3)" }, font, customColors = false, lightColors = defaultLightColors, darkColors = defaultDarkColors, triggerLabel = "Menu", items = defaults, activeItem = 0, drawerWidth = 340, phoneWidth = 320, layout = "auto", showThemeToggle = true, ctaLabel = "Let's talk", ctaLink = "", ctaNewTab = false, padding = "28px", corners = "0px 28px 28px 0px", blur = 24, duration = .48 } = props
    const isStatic = useIsStaticRenderer()
    const showCanvasMenu = isStatic && startOpen
    const reduced = useReducedMotion()
    const initialOpen = !isStatic && startOpen
    // One clock keeps drawer, veil and trigger aligned, including interrupted motion.
    const drawerProgress = useMotionValue(initialOpen ? 1 : 0)
    const drawerDistance = useMotionValue(drawerWidth + 48)
    const drawerX = useTransform([drawerProgress, drawerDistance], ([progress, distance]) => (Number(progress) - 1) * Number(distance))
    const triggerVisibility = useTransform(drawerProgress, progress => {
        const amount = Math.max(0, Math.min(1, progress / .38))
        return 1 - amount * amount * (3 - 2 * amount)
    })
    const triggerX = useTransform(triggerVisibility, visibility => -12 * (1 - visibility))
    const reflectionTarget = useMotionValue(0)
    const reflectionX = useSpring(reflectionTarget, { stiffness: 150, damping: 24, mass: .7 })
    const [appearance, setAppearance] = React.useState(theme)
    const [open, setOpen] = React.useState(initialOpen)
    const [mounted, setMounted] = React.useState(initialOpen)
    const [selected, setSelected] = React.useState(activeItem)
    const [hovered, setHovered] = React.useState<number | null>(null)
    const [focused, setFocused] = React.useState<number | null>(null)
    const [exitTarget, setExitTarget] = React.useState(0)
    const [compact, setCompact] = React.useState(layout === "phone")
    const root = React.useRef<HTMLDivElement>(null)
    const dialog = React.useRef<HTMLDialogElement>(null)
    const trigger = React.useRef<HTMLButtonElement>(null)
    const closeButton = React.useRef<HTMLButtonElement>(null)
    const panelRef = React.useRef<HTMLDivElement>(null)
    const motionRun = React.useRef(0)
    const openRef = React.useRef(initialOpen)
    const initialFocusPending = React.useRef(initialOpen)
    const runtimeSettings = React.useRef({ isStatic, startOpen })
    const hoverTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const navId = React.useId()
    const list = Array.isArray(items) ? items.filter(Boolean) : defaults
    const chosen = Math.max(0, Math.min(selected, list.length - 1))
    const target = mounted && !open ? exitTarget : hovered ?? focused ?? chosen
    const palette = appearance === "dark" ? dark : light
    const colors = appearance === "dark" ? { ...defaultDarkColors, ...darkColors } : { ...defaultLightColors, ...lightColors }
    const t = customColors ? { ...palette, ink: colors.ink, muted: colors.muted, button: colors.button, buttonInk: colors.buttonInk } : palette
    const seconds = reduced ? 0 : duration
    const exitSeconds = seconds * .85
    const isDark = appearance === "dark"
    const markerMaterial = isDark ? markerGlass.dark : markerGlass.light
    const markerEngaged = hovered !== null || focused !== null
    const glide = reduced ? { duration: 0 } : { type: "spring" as const, stiffness: 320, damping: 32, mass: .8 }
    const rowHeight = compact ? 52 : 56
    const pad = compact ? "20px" : padding
    const parts = pad.trim().split(/\s+/)
    const pt = parts[0] || "28px", pr = parts[1] || pt
    const pb = parts[2] || pt, pl = parts[3] || pr
    const surfaceRadius = corners.split(/\s+/).map(v => `${Math.max(0, parseFloat(v) - 2)}px`).join(" ")
    React.useEffect(() => setAppearance(theme), [theme])
    React.useEffect(() => setSelected(activeItem), [activeItem])
    useSafeLayoutEffect(() => {
        if (layout !== "auto") { setCompact(layout === "phone"); return }
        const el = root.current
        if (!el) return
        // An inserted button is small even on desktop. Runtime layout follows the page.
        if (!isStatic) {
            const media = el.ownerDocument.defaultView?.matchMedia("(max-width: 809px)")
            if (!media) return
            const update = () => setCompact(media.matches)
            update()
            media.addEventListener("change", update)
            return () => media.removeEventListener("change", update)
        }
        // Explicit canvas stages retain their responsive demo layout.
        if (!showCanvasMenu || style?.width === undefined || style.width === "auto") {
            setCompact(false)
            return
        }
        const update = () => setCompact(el.clientWidth <= 809)
        update()
        const observer = new ResizeObserver(update)
        observer.observe(el)
        return () => observer.disconnect()
    }, [layout, isStatic, showCanvasMenu, style?.width])
    React.useEffect(() => () => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current)
    }, [])
    useSafeLayoutEffect(() => {
        const previous = runtimeSettings.current
        runtimeSettings.current = { isStatic, startOpen }
        if (isStatic) return
        if (previous.isStatic) {
            // A new interactive preview starts from its configured state.
            initialFocusPending.current = startOpen
            drawerProgress.set(startOpen ? 1 : 0)
            if (startOpen) show()
            else {
                openRef.current = false
                setOpen(false)
                setMounted(false)
            }
        } else if (previous.startOpen !== startOpen) {
            // Only an actual setting change can override a user's open/close action.
            if (startOpen) {
                if (!openRef.current) show()
            } else hide()
        }
    }, [isStatic, startOpen, drawerProgress])
    useSafeLayoutEffect(() => {
        if (!mounted || isStatic) return
        const el = dialog.current
        const panelEl = panelRef.current
        if (!el || !panelEl) return
        if (!el.open) el.showModal()
        const measure = () => drawerDistance.set(panelEl.getBoundingClientRect().width + 48)
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(panelEl)
        if (initialFocusPending.current) {
            el.focus({ preventScroll: true })
            initialFocusPending.current = false
        } else closeButton.current?.focus({ preventScroll: true })
        return () => {
            observer.disconnect()
            if (el.open) el.close()
        }
    }, [mounted, isStatic, drawerDistance])
    useSafeLayoutEffect(() => {
        if (!mounted || isStatic) return
        const run = ++motionRun.current
        const goal = open ? 1 : 0
        const remaining = Math.abs(goal - drawerProgress.get())
        if (reduced || remaining < .0001) {
            drawerProgress.set(goal)
            if (!open) finishClose()
            return
        }
        const controls = animate(drawerProgress, goal, {
            type: "tween",
            duration: (open ? seconds : exitSeconds) * remaining,
            ease: open ? [.25, .8, .25, 1] : [.36, 0, .66, 1],
            onComplete: () => {
                if (run === motionRun.current && goal === 0 && !openRef.current) finishClose()
            },
        })
        return () => { ++motionRun.current; controls.stop() }
    }, [mounted, open, isStatic, reduced, seconds, exitSeconds, drawerProgress])
    function show() {
        openRef.current = true
        if (hoverTimer.current) clearTimeout(hoverTimer.current)
        setHovered(null)
        setFocused(null)
        reflectionTarget.set(0)
        setMounted(true)
        setOpen(true)
    }
    function finishClose() {
        if (openRef.current) return
        dialog.current?.close()
        setMounted(false)
        trigger.current?.focus({ preventScroll: true })
    }
    function hide() {
        if (!openRef.current) return
        openRef.current = false
        setExitTarget(target)
        setOpen(false)
        if (hoverTimer.current) clearTimeout(hoverTimer.current)
    }
    function trackReflection(e: React.PointerEvent<HTMLElement>) {
        if (reduced || isStatic || !openRef.current || e.pointerType !== "mouse") return
        const rect = e.currentTarget.getBoundingClientRect()
        const localX = (e.clientX - rect.left) / Math.max(rect.width, 1)
        reflectionTarget.set(Math.max(-18, Math.min(18, (localX - .5) * 36)))
    }
    function hoverItem(index: number) {
        if (hoverTimer.current) clearTimeout(hoverTimer.current)
        setHovered(index)
    }
    function leaveItems() {
        if (hoverTimer.current) clearTimeout(hoverTimer.current)
        hoverTimer.current = setTimeout(() => {
            if (!openRef.current) return
            setHovered(null)
            reflectionTarget.set(0)
        }, reduced ? 0 : 70)
    }
    const baseButton: React.CSSProperties = { appearance: "none", boxSizing: "border-box", border: 0, margin: 0, font: "inherit", cursor: "pointer", color: "inherit", textDecoration: "none", userSelect: "none" }
    const iconButton: React.CSSProperties = { ...baseButton, position: "relative", width: 44, height: 44, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: 12 }
    const ctaStyle: React.CSSProperties = { ...baseButton, position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, height: 50, minHeight: 50, padding: "0 20px", borderRadius: 16, background: t.button, color: t.buttonInk, fontSize: 14, fontWeight: 500, overflow: "hidden", flexShrink: 0 }
    const ctaContent = <><span style={{ position: "relative", zIndex: 1 }}>{ctaLabel}</span><span className="gsm-cta-arrow" style={{ position: "relative", zIndex: 1 }}><Icon name="Arrow" size={17} /></span><span className="gsm-cta-shine" aria-hidden="true" /></>
    const BrandElement = brandLink ? "a" : "div"
    const panel = (staticView: boolean) => <motion.div
        data-glass-drawer="panel"
        ref={panelRef}
        style={{ x: staticView ? 0 : drawerX, position: "absolute", left: 0, top: 0, width: compact ? phoneWidth : drawerWidth, maxWidth: staticView ? "100%" : "90%", height: "100%", boxSizing: "border-box", padding: "0 2px 0 0", borderRadius: corners, background: "transparent", pointerEvents: "auto", color: "var(--gsm-ink)", boxShadow: appearance === "dark" ? "8px 0 28px rgba(0,0,0,.24),1px 0 3px rgba(0,0,0,.12)" : "6px 0 24px rgba(40,45,56,.11),1px 0 3px rgba(40,45,56,.06)" }}>
        <div data-glass-surface aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: corners, background: "linear-gradient(150deg,var(--gsm-surface-a),var(--gsm-surface-b) 51%,var(--gsm-surface-c))", backdropFilter: `blur(${blur}px) saturate(120%)`, WebkitBackdropFilter: `blur(${blur}px) saturate(120%)`, pointerEvents: "none" }} />
        <div data-glass-rim aria-hidden="true" style={{ position: "absolute", inset: 0, padding: "2px 2px 2px 0", borderRadius: corners, pointerEvents: "none", ...rimMask }}><ThemePaint darkMode={isDark} lightFill={light.edge} darkFill={dark.edge} /></div>
        <div data-glass-reflection aria-hidden="true" style={{ position: "absolute", inset: "2px 2px 2px 0", borderRadius: surfaceRadius, boxShadow: isDark ? "inset -1px 0 0 rgba(210,230,255,.26)" : "inset -1px 0 0 rgba(255,255,255,.52)", pointerEvents: "none" }}><ThemePaint darkMode={isDark}
            lightFill="linear-gradient(115deg,rgba(255,255,255,.13),transparent 36%,rgba(255,255,255,.025) 72%,transparent)"
            darkFill="linear-gradient(115deg,rgba(224,237,255,.11) 0%,rgba(224,237,255,.035) 23%,transparent 41%,transparent 58%,rgba(224,237,255,.10) 76%,rgba(125,167,255,.025) 88%,transparent 100%)" /></div>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box", borderRadius: surfaceRadius, overflow: "hidden", paddingTop: `max(${pt}, env(safe-area-inset-top))`, paddingBottom: `max(${pb}, env(safe-area-inset-bottom))` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 44, flexShrink: 0, marginLeft: pl, marginRight: pr }}>
                <BrandElement className={brandLink ? "gsm-control" : undefined} {...(brandLink ? { href: brandLink, target: brandNewTab ? "_blank" : undefined, rel: brandNewTab ? "noopener noreferrer" : undefined, onClick: hide } : {})} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0, color: "inherit", textDecoration: "none", borderRadius: 6 }}>
                {logo?.src ? <img src={logo.src} srcSet={logo.srcSet} alt="" style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }} /> : <div aria-hidden="true" style={{ position: "relative", width: 28, height: 28, flexShrink: 0 }}>
                    <span style={{ position: "absolute", left: 0, top: 2, width: 16, height: 22, boxSizing: "border-box", borderRadius: 3, border: "1px solid rgba(255,255,255,.75)", background: "linear-gradient(140deg,#f3f4f7,#b6bbc5)", boxShadow: "inset 0 1px 1px rgba(255,255,255,.45),0 2px 4px rgba(0,0,0,.15)" }} />
                    <span style={{ position: "absolute", left: 11, top: 6, width: 15, height: 20, borderRadius: 3, background: appearance === "dark" ? "linear-gradient(140deg,#f2f6ff,#b6c6e0)" : "linear-gradient(145deg,#3b3f47,#111216)", boxShadow: "inset 0 1px 1px rgba(255,255,255,.2),0 2px 4px rgba(0,0,0,.16)" }} />
                </div>}
                <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.03em", flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{brand}</span>
                </BrandElement>
                <button ref={closeButton} className="gsm-control gsm-close" type="button" style={iconButton} aria-label="Close menu" onClick={hide}><span className="gsm-close-rim" aria-hidden="true" style={{ position: "absolute", inset: 0, padding: 1, borderRadius: "inherit", pointerEvents: "none", ...rimMask }}><ThemePaint darkMode={isDark} lightFill={light.lensEdge} darkFill={dark.lensEdge} /></span><span className="gsm-close-icon"><Icon name="Close" size={18} /></span></button>
            </div>
            <div className="gsm-scroll" data-menu-content style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, marginTop: compact ? 32 : 44, padding: `0 ${pr} 8px ${pl}`, marginBottom: -8, overflowY: "auto", overflowX: "hidden", overscrollBehavior: "contain" }}>
                <nav aria-label="Main navigation" style={{ flexShrink: 0 }}>
                    <div onPointerLeave={e => { if (e.pointerType !== "touch") leaveItems() }} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 6 }}>
                        {list.length > 0 && <motion.div data-glass-marker aria-hidden="true" initial={false} animate={{ y: target * (rowHeight + 6) }} transition={glide} style={{ position: "absolute", top: 0, left: 0, right: 0, height: rowHeight, boxSizing: "border-box", borderRadius: 10, background: "transparent", pointerEvents: "none", boxShadow: markerMaterial.shadow, backdropFilter: `blur(${Math.min(blur, 6)}px)`, WebkitBackdropFilter: `blur(${Math.min(blur, 6)}px)` }}>
                            <ThemePaint darkMode={isDark} lightFill={markerGlass.light.fill} darkFill={markerGlass.dark.fill} />
                            <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: "inherit", pointerEvents: "none" }}>
                                <motion.span data-marker-reflection initial={false} animate={{ opacity: markerEngaged ? 1 : .6 }} transition={{ duration: reduced ? 0 : .22, ease: [.22, 1, .36, 1] }} style={{ position: "absolute", top: -18, bottom: -18, left: "calc(50% - 44px)", width: 88, x: reduced || isStatic ? 0 : reflectionX, pointerEvents: "none" }}><ThemePaint darkMode={isDark} lightFill={markerGlass.light.reflection} darkFill={markerGlass.dark.reflection} /></motion.span>
                            </div>
                            <div style={{ position: "absolute", inset: 0, padding: 1, borderRadius: "inherit", ...rimMask }}><ThemePaint darkMode={isDark} lightFill={markerGlass.light.rim} darkFill={markerGlass.dark.rim} /></div>
                        </motion.div>}

                        {list.map((item, i) => {
                            const content = <><Icon name={item.icon} /><span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span><span className="gsm-dot" aria-hidden="true" style={{ width: 4, height: 4, flexShrink: 0, borderRadius: "50%", background: "currentColor", opacity: i === chosen ? .65 : 0 }} /></>
                            const common = { className: "gsm-control gsm-nav", "aria-current": i === chosen ? "page" as const : undefined, onPointerEnter: (e: React.PointerEvent<HTMLElement>) => { if (e.pointerType !== "touch") hoverItem(i); trackReflection(e) }, onPointerMove: (e: React.PointerEvent<HTMLElement>) => { if (e.pointerType !== "touch" && focused !== null && hovered !== i) hoverItem(i); trackReflection(e) }, onFocus: (e: React.FocusEvent<HTMLElement>) => { if (e.currentTarget.matches(":focus-visible")) { if (hoverTimer.current) clearTimeout(hoverTimer.current); setHovered(null); setFocused(i); reflectionTarget.set(0) } }, onBlur: () => setFocused(null), onClick: () => { setSelected(i); setHovered(null); if (item.link) hide() }, style: { ...baseButton, display: "flex", alignItems: "center", gap: 14, padding: "0 17px", width: "100%", height: rowHeight, minHeight: rowHeight, position: "relative" as const, background: "transparent", borderRadius: 10, textAlign: "left" as const, fontSize: 16, fontWeight: 500, letterSpacing: "-.02em", ...font, color: i === chosen || i === target ? "var(--gsm-ink)" : "var(--gsm-muted)" } }
                            return item.link ? <a key={i} {...common} href={item.link} target={item.newTab ? "_blank" : undefined} rel={item.newTab ? "noopener noreferrer" : undefined}>{content}</a> : <button key={i} {...common} type="button">{content}</button>
                        })}
                    </div>
                </nav>
                <div style={{ minHeight: compact ? 24 : 32, flex: 1 }} />
                <div style={{ flexShrink: 0, borderTop: "1px solid var(--gsm-line)", paddingTop: compact ? 18 : 22, display: "flex", flexDirection: "column", gap: 16 }}>
                    {ctaLabel && (ctaLink ? <a className="gsm-control gsm-cta" href={ctaLink} target={ctaNewTab ? "_blank" : undefined} rel={ctaNewTab ? "noopener noreferrer" : undefined} onClick={hide} style={ctaStyle}>{ctaContent}</a> : <button className="gsm-control gsm-cta" type="button" onClick={() => { setSelected(Math.max(0, list.length - 1)); setHovered(null) }} style={ctaStyle}>{ctaContent}</button>)}
                    {showThemeToggle && <div role="group" aria-label="Appearance" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 44, color: "var(--gsm-muted)" }}><span style={{ fontSize: 12 }}>Appearance</span><div style={{ position: "relative", display: "flex", gap: 4, padding: 3, borderRadius: 16, background: isDark ? "rgba(0,0,0,.2)" : "rgba(82,87,97,.08)", boxShadow: "inset 0 1px 2px rgba(0,0,0,.1)", transition: "background-color 360ms ease" }}>
                        <motion.span data-theme-thumb aria-hidden="true" initial={false} animate={{ x: isDark ? 48 : 0 }} transition={glide} style={{ position: "absolute", top: 3, bottom: 3, left: 3, width: 44, borderRadius: 12, boxShadow: t.lensShadow, pointerEvents: "none" }}><ThemePaint darkMode={isDark} lightFill={light.lens} darkFill={dark.lens} /></motion.span>
                        {(["light", "dark"] as const).map(mode => <button key={mode} className="gsm-control gsm-subtle" type="button" aria-label={mode === "light" ? "Light appearance" : "Dark appearance"} aria-pressed={appearance === mode} onClick={() => setAppearance(mode)} style={{ ...baseButton, position: "relative", width: 44, height: compact ? 44 : 38, display: "grid", placeItems: "center", borderRadius: 12, background: "transparent", color: appearance === mode ? "var(--gsm-ink)" : "var(--gsm-muted)" }}><Icon name={mode === "light" ? "Sun" : "Moon"} size={17} /></button>)}
                    </div></div>}

                </div>
            </div>
        </div>
    </motion.div>
    return <motion.div ref={root} data-glass-side-menu data-theme={appearance} initial={false} animate={{
        "--gsm-ink": t.ink, "--gsm-muted": t.muted, "--gsm-line": t.line,
        "--gsm-surface-a": customColors ? colors.surface : isDark ? "rgba(25,38,68,.78)" : "rgba(208,208,208,.72)",
        "--gsm-surface-b": customColors ? colors.surface : isDark ? "rgba(15,23,42,.70)" : "rgba(232,232,232,.64)",
        "--gsm-surface-c": customColors ? colors.surface : isDark ? "rgba(10,17,33,.82)" : "rgba(200,200,200,.76)",
        "--gsm-trigger-a": customColors ? colors.surface : isDark ? "rgba(25,38,68,.70)" : "rgba(208,208,208,.46)",
        "--gsm-trigger-b": customColors ? colors.surface : isDark ? "rgba(15,23,42,.66)" : "rgba(232,232,232,.32)",
        "--gsm-trigger-c": customColors ? colors.surface : isDark ? "rgba(10,17,33,.74)" : "rgba(200,200,200,.44)",
        "--gsm-veil": pageOverlay ? (isDark ? overlayColors?.dark || "rgba(6,12,25,.3)" : overlayColors?.light || "rgba(24,30,40,.12)") : "transparent",
        "--gsm-close-fill": isDark ? "rgba(207,224,255,.07)" : "rgba(255,255,255,.25)",
        "--gsm-close-hover": isDark ? "rgba(207,224,255,.14)" : "rgba(255,255,255,.42)",
        "--gsm-close-press": isDark ? "rgba(207,224,255,.09)" : "rgba(255,255,255,.30)",
        "--gsm-close-shadow": isDark ? "rgba(0,0,0,.14)" : "rgba(0,0,0,.08)",
    }} transition={{ duration: reduced ? 0 : .36, ease: [.22, 1, .36, 1] }} style={{ ...style, width: style?.width === undefined || style.width === "auto" ? (showCanvasMenu ? (compact ? phoneWidth : drawerWidth) : "max-content") : style.width, height: style?.height === undefined || style.height === "auto" ? (showCanvasMenu ? "var(--framer-viewport-height, 800px)" : "max-content") : style.height, display: "flex", alignItems: "flex-start", position: "relative", background: "transparent", fontFamily: font?.fontFamily || 'Inter, sans-serif', pointerEvents: "none", "--gsm-focus": appearance === "dark" ? "#a4caff" : "#304f9f" } as React.CSSProperties}>
        <style>{styles}</style>
        {!(showCanvasMenu) && <motion.button ref={trigger} className="gsm-control gsm-trigger" type="button" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={open} aria-controls={navId} onClick={show}
            initial={false}
            transition={{ duration: reduced ? 0 : .18, ease: [.22, 1, .36, 1] }}
            whileHover={reduced ? undefined : { y: -1 }} whileTap={reduced ? undefined : { y: 0 }}
            style={{ ...baseButton, x: reduced ? 0 : triggerX, opacity: triggerVisibility, pointerEvents: mounted ? "none" : "auto", position: "relative", margin: Math.max(0, triggerInset), flexShrink: 0, height: compact ? 52 : 48, width: compact ? 52 : undefined, padding: "0 1px", borderRadius: 14, background: "transparent", color: "var(--gsm-ink)" }}>
            <span data-glass-surface aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "inherit", background: "linear-gradient(150deg,var(--gsm-trigger-a),var(--gsm-trigger-b) 51%,var(--gsm-trigger-c))", backdropFilter: `blur(${blur}px) saturate(120%)`, WebkitBackdropFilter: `blur(${blur}px) saturate(120%)`, pointerEvents: "none" }} />
            <span className="gsm-trigger-reflection" aria-hidden="true" style={{ position: "absolute", inset: 1.5, borderRadius: 12.5, overflow: "hidden", pointerEvents: "none" }}><ThemePaint darkMode={isDark} lightFill={triggerGlass.light.reflection} darkFill={triggerGlass.dark.reflection} /></span>
            <span aria-hidden="true" style={{ position: "absolute", inset: 0, padding: 1.5, borderRadius: "inherit", ...rimMask, pointerEvents: "none" }}><ThemePaint darkMode={isDark} lightFill={triggerGlass.light.rim} darkFill={triggerGlass.dark.rim} /></span>
            <span style={{ position: "relative", display: "flex", height: "100%", gap: 12, alignItems: "center", justifyContent: "center", padding: compact ? 0 : "0 16px", fontSize: 14, fontWeight: 550 }}><span aria-hidden="true" style={{ width: 20, height: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5 }}><span className="gsm-menu-line" /><span className="gsm-menu-line" /></span>{!compact && triggerLabel}</span>
        </motion.button>}

        {showCanvasMenu ? <><div data-glass-veil aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: corners, background: "var(--gsm-veil)", pointerEvents: "none" }} />{panel(true)}</> : <dialog ref={dialog} id={navId} data-glass-dialog aria-label={`${brand} menu`} onKeyDownCapture={e => {
            if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); hide(); return }
            if (e.key === "Tab") {
                const controls = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],[tabindex="0"]'))
                const first = controls[0], last = controls[controls.length - 1], active = e.currentTarget.ownerDocument.activeElement
                if (e.shiftKey && active === first) { e.preventDefault(); last?.focus() }
                else if (!e.shiftKey && active === last) { e.preventDefault(); first?.focus() }
            }
        }} onCancel={e => { e.preventDefault(); hide() }} onClick={e => { if (e.target === e.currentTarget) hide() }} style={{ position: "fixed", inset: 0, margin: 0, padding: 0, width: "100vw", height: "100dvh", maxWidth: "none", maxHeight: "none", border: 0, overflow: "auto", overscrollBehavior: "contain", background: "transparent", color: t.ink, fontFamily: "inherit", pointerEvents: "auto" }}>
            {mounted && <><motion.div data-glass-veil aria-hidden="true" style={{ opacity: drawerProgress, position: "absolute", inset: 0, background: "var(--gsm-veil)", pointerEvents: "none" }} />{panel(false)}</>}
        </dialog>}
    </motion.div>
}

addPropertyControls(GlassSideMenu, {
    theme: { type: ControlType.Enum, title: "Appearance", options: ["light", "dark"], optionTitles: ["Light", "Dark"], defaultValue: "light", displaySegmentedControl: true },
    startOpen: { type: ControlType.Boolean, title: "Start Open", defaultValue: false, description: "Show the open menu on the canvas and when the page starts. Set to No to show the menu button. Use Fit sizing for the component’s natural bounds." },
    brand: { type: ControlType.String, title: "Brand", defaultValue: "Auren" },
    logo: { type: ControlType.ResponsiveImage, title: "Logo" },
    brandLink: { type: ControlType.Link, title: "Brand Link" },
    brandNewTab: { type: ControlType.Boolean, title: "Brand New Tab", defaultValue: false },
    triggerLabel: { type: ControlType.String, title: "Menu label", defaultValue: "Menu" },
    triggerInset: { type: ControlType.Number, title: "Button inset", defaultValue: 0, min: 0, max: 80, unit: "px", description: "Extra space around the button. Leave at 0 to place it directly with Framer." },
    pageOverlay: { type: ControlType.Boolean, title: "Page overlay", defaultValue: false, description: "Optionally dim the page behind the open menu. The component has no demo background." },
    overlayColors: { type: ControlType.Object, title: "Overlay colors", hidden: props => !props.pageOverlay, defaultValue: { light: "rgba(24,30,40,.12)", dark: "rgba(6,12,25,.3)" }, controls: {
        light: { type: ControlType.Color, title: "Light", defaultValue: "rgba(24,30,40,.12)" },
        dark: { type: ControlType.Color, title: "Dark", defaultValue: "rgba(6,12,25,.3)" },
    } },
    items: { type: ControlType.Array, title: "Items", defaultValue: defaults, maxCount: 12, control: { type: ControlType.Object, controls: {
        label: { type: ControlType.String, title: "Label", defaultValue: "Page" },
        icon: { type: ControlType.Enum, title: "Icon", options: ["Home", "Briefcase", "Layers", "Users", "Sparkles", "Mail", "None"], defaultValue: "Home" },
        link: { type: ControlType.Link, title: "Link" },
        newTab: { type: ControlType.Boolean, title: "New tab", defaultValue: false },
    } } },
    activeItem: { type: ControlType.Number, title: "Active item", defaultValue: 0, min: 0, max: 11, step: 1, displayStepper: true },
    drawerWidth: { type: ControlType.Number, title: "Panel width", defaultValue: 340, min: 280, max: 460, unit: "px" },
    phoneWidth: { type: ControlType.Number, title: "Phone width", defaultValue: 320, min: 260, max: 400, unit: "px" },
    layout: { type: ControlType.Enum, title: "Layout", options: ["auto", "desktop", "phone"], optionTitles: ["Auto", "Desktop", "Phone"], defaultValue: "auto" },
    showThemeToggle: { type: ControlType.Boolean, title: "Theme switch", defaultValue: true },
    ctaLabel: { type: ControlType.String, title: "CTA label", defaultValue: "Let's talk" },
    ctaLink: { type: ControlType.Link, title: "CTA link" },
    ctaNewTab: { type: ControlType.Boolean, title: "CTA new tab", defaultValue: false },
    font: { type: ControlType.Font, title: "Typography", controls: "extended", defaultFontType: "sans-serif", defaultValue: { variant: "Medium", fontSize: 16, letterSpacing: "-.02em", lineHeight: "1.2em" } },
    customColors: { type: ControlType.Boolean, title: "Custom Colors", defaultValue: false },
    lightColors: { type: ControlType.Object, title: "Light Colors", hidden: props => !props.customColors, defaultValue: defaultLightColors, controls: {
        surface: { type: ControlType.Color, title: "Glass Tint", defaultValue: defaultLightColors.surface },
        ink: { type: ControlType.Color, title: "Text", defaultValue: defaultLightColors.ink },
        muted: { type: ControlType.Color, title: "Secondary", defaultValue: defaultLightColors.muted },
        button: { type: ControlType.Color, title: "CTA Fill", defaultValue: defaultLightColors.button },
        buttonInk: { type: ControlType.Color, title: "CTA Text", defaultValue: defaultLightColors.buttonInk },
    } },
    darkColors: { type: ControlType.Object, title: "Dark Colors", hidden: props => !props.customColors, defaultValue: defaultDarkColors, controls: {
        surface: { type: ControlType.Color, title: "Glass Tint", defaultValue: defaultDarkColors.surface },
        ink: { type: ControlType.Color, title: "Text", defaultValue: defaultDarkColors.ink },
        muted: { type: ControlType.Color, title: "Secondary", defaultValue: defaultDarkColors.muted },
        button: { type: ControlType.Color, title: "CTA Fill", defaultValue: defaultDarkColors.button },
        buttonInk: { type: ControlType.Color, title: "CTA Text", defaultValue: defaultDarkColors.buttonInk },
    } },
    padding: { type: ControlType.Padding, title: "Padding", defaultValue: "28px" },
    corners: { type: ControlType.BorderRadius, title: "Corners", defaultValue: "0px 28px 28px 0px" },
    blur: { type: ControlType.Number, title: "Glass blur", defaultValue: 24, min: 0, max: 48, unit: "px" },
    duration: { type: ControlType.Number, title: "Slide time", defaultValue: .48, min: .15, max: .8, step: .01, unit: "s", description: "Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)" },
})
