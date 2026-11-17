import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react"
import * as FramerLib from "framer"
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

// Lingo — Hopara
// Selector de idioma para Framer. De 2 a 10 idiomas, como pastilla o como menú desplegable.
// Modo Paths: el primer idioma vive en la raíz (/x) y los demás con su código como prefijo (/es/x, /fr/x).
// Modo Framer Locales: usa la localización nativa de Framer.

type Flag = "none" | "us" | "gb" | "mx" | "es" | "fr" | "de" | "it" | "pt" | "br" | "nl" | "ca" | "jp" | "cn" | "kr" | "ar"
type Mode = "path" | "locales"
type Lang = { label: string; code: string; flag: Flag }
type Slug = { code: string; from: string; to: string }

interface Props {
    languages: Lang[]
    mode: Mode
    variant: "pill" | "menu"
    showFlags: boolean
    flagSize: number
    font: CSSProperties
    color: string
    activeColor: string
    track: string
    border: string
    thumb: string
    thumbBorder: string
    menuFill: string
    gap: number
    keepPosition: boolean
    transition: "fade" | "none"
    preview: number
    preset: Preset
    accent: string
    size: "s" | "m" | "l"
    radius: number
    display: "both" | "label" | "flag"
    menuDirection: "down" | "up"
    menuAlign: "right" | "left"
    navigate: boolean
    maxWidth: number
    slugs: Slug[]
    fallback: "home" | "none"
    style?: CSSProperties
}

type Preset = "custom" | "light" | "dark" | "glass" | "outline" | "accent" | "minimal"
type Palette = { color: string; activeColor: string; track: string; border: string; thumb: string; thumbBorder: string; menuFill: string; shadow: boolean; blur?: boolean; underline?: boolean }
// Estilos prediseñados. "custom" usa los colores del panel.
const PRESETS: Record<Exclude<Preset, "custom" | "accent">, Palette> = {
    light: { color: "#6B7280", activeColor: "#111827", track: "#F1F2F4", border: "rgba(17,24,39,0.08)", thumb: "#FFFFFF", thumbBorder: "rgba(17,24,39,0.12)", menuFill: "#FFFFFF", shadow: true },
    dark: { color: "rgba(255,255,255,0.58)", activeColor: "#FFFFFF", track: "#16171A", border: "rgba(255,255,255,0.10)", thumb: "#2C2E33", thumbBorder: "rgba(255,255,255,0.14)", menuFill: "#1C1D21", shadow: true },
    glass: { color: "rgba(17,24,39,0.62)", activeColor: "#111827", track: "rgba(255,255,255,0.45)", border: "rgba(255,255,255,0.65)", thumb: "rgba(255,255,255,0.92)", thumbBorder: "rgba(17,24,39,0.06)", menuFill: "rgba(255,255,255,0.82)", shadow: true, blur: true },
    outline: { color: "#6B7280", activeColor: "#FFFFFF", track: "transparent", border: "rgba(17,24,39,0.18)", thumb: "#111827", thumbBorder: "#111827", menuFill: "#FFFFFF", shadow: false },
    minimal: { color: "#9CA3AF", activeColor: "#111827", track: "transparent", border: "transparent", thumb: "#111827", thumbBorder: "transparent", menuFill: "#FFFFFF", shadow: false, underline: true },
}
function accentPalette(a: string): Palette {
    return { color: "#4B5563", activeColor: "#FFFFFF", track: "color-mix(in srgb, " + a + " 10%, transparent)", border: "color-mix(in srgb, " + a + " 18%, transparent)", thumb: a, thumbBorder: a, menuFill: "#FFFFFF", shadow: true }
}
const SIZES = {
    s: { pad: 2, item: "5px 10px", itemH: 26, btn: "6px 10px 6px 8px", btnH: 30 },
    m: { pad: 3, item: "7px 12px", itemH: 30, btn: "8px 12px 8px 10px", btnH: 36 },
    l: { pad: 4, item: "9px 16px", itemH: 38, btn: "10px 16px 10px 12px", btnH: 44 },
}

const useFramerRouter: (() => any) | undefined = (FramerLib as any).useRouter
const useFramerLocale: (() => any) | undefined = (FramerLib as any).useLocaleInfo

// ── Banderas propias (SVG recortadas en círculo) ──
function stripes(colors: string[], vertical: boolean) {
    const n = colors.length, s = 16 / n
    return colors.map((c, i) =>
        vertical ? <rect key={i} x={i * s} y="0" width={s + 0.05} height="16" fill={c} />
                 : <rect key={i} x="0" y={i * s} width="16" height={s + 0.05} fill={c} />
    )
}
function FlagArt({ flag }: { flag: Flag }) {
    switch (flag) {
        case "mx": return <>{stripes(["#006847", "#FFFFFF", "#CE1126"], true)}<circle cx="8" cy="8" r="1.7" fill="#8C6A2B" /></>
        case "fr": return <>{stripes(["#0055A4", "#FFFFFF", "#EF4135"], true)}</>
        case "it": return <>{stripes(["#009246", "#FFFFFF", "#CE2B37"], true)}</>
        case "de": return <>{stripes(["#000000", "#DD0000", "#FFCE00"], false)}</>
        case "nl": return <>{stripes(["#AE1C28", "#FFFFFF", "#21468B"], false)}</>
        case "ar": return <>{stripes(["#74ACDF", "#FFFFFF", "#74ACDF"], false)}<circle cx="8" cy="8" r="1.6" fill="#F6B40E" /></>
        case "es": return <><rect width="16" height="16" fill="#AA151B" /><rect y="4" width="16" height="8" fill="#F1BF00" /></>
        case "pt": return <><rect width="16" height="16" fill="#DA291C" /><rect width="6.4" height="16" fill="#046A38" /><circle cx="6.4" cy="8" r="2.2" fill="#FFE900" /></>
        case "br": return <><rect width="16" height="16" fill="#009C3B" /><polygon points="8,2.5 14.5,8 8,13.5 1.5,8" fill="#FFDF00" /><circle cx="8" cy="8" r="3" fill="#002776" /></>
        case "ca": return <><rect width="16" height="16" fill="#FFFFFF" /><rect width="4" height="16" fill="#D80621" /><rect x="12" width="4" height="16" fill="#D80621" /><polygon points="8,4.2 9.2,7 10.6,6.4 10,9.6 8.4,9.2 8.4,11.6 7.6,11.6 7.6,9.2 6,9.6 5.4,6.4 6.8,7" fill="#D80621" /></>
        case "jp": return <><rect width="16" height="16" fill="#FFFFFF" /><circle cx="8" cy="8" r="3.4" fill="#BC002D" /></>
        case "kr": return <>
            <rect width="16" height="16" fill="#FFFFFF" />
            <g transform="rotate(-34 8 8)">
                <path d="M4.6 8a3.4 3.4 0 0 1 6.8 0z" fill="#CD2E3A" />
                <path d="M4.6 8a3.4 3.4 0 0 0 6.8 0z" fill="#0047A0" />
                <circle cx="6.3" cy="8" r="1.7" fill="#CD2E3A" />
                <circle cx="9.7" cy="8" r="1.7" fill="#0047A0" />
            </g>
            <g stroke="#111111" strokeWidth="0.7" strokeLinecap="butt">
                <path d="M2.2 4.9L4.9 2.2M3 5.7L5.7 3" /><path d="M10.3 2.2L13.8 5.7M11.1 1.4L14.6 4.9" />
                <path d="M1.4 11.1L4.9 14.6M2.2 10.3L5.7 13.8" /><path d="M10.3 13.8L13.8 10.3M11.1 14.6L14.6 11.1" />
            </g>
        </>
        case "cn": return <><rect width="16" height="16" fill="#EE1C25" /><polygon points="5,2.6 5.7,4.6 7.8,4.6 6.1,5.8 6.8,7.8 5,6.6 3.2,7.8 3.9,5.8 2.2,4.6 4.3,4.6" fill="#FFFF00" /></>
        case "gb": return <><rect width="16" height="16" fill="#012169" /><path d="M0 0L16 16M16 0L0 16" stroke="#FFFFFF" strokeWidth="3" /><path d="M0 0L16 16M16 0L0 16" stroke="#C8102E" strokeWidth="1.2" /><path d="M8 0V16M0 8H16" stroke="#FFFFFF" strokeWidth="5" /><path d="M8 0V16M0 8H16" stroke="#C8102E" strokeWidth="3" /></>
        case "us": {
            const h = 16 / 13
            return <>
                <rect width="16" height="16" fill="#FFFFFF" />
                {[0, 2, 4, 6, 8, 10, 12].map((i) => <rect key={i} x="0" y={i * h} width="16" height={h} fill="#B22234" />)}
                <rect x="0" y="0" width="7.4" height={h * 7} fill="#3C3B6E" />
                {[[1.6, 1.6], [4.2, 1.6], [2.9, 3.6], [1.6, 5.6], [4.2, 5.6]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r="0.55" fill="#FFFFFF" />)}
            </>
        }
        default: return null
    }
}
function FlagIcon({ flag, size, uid }: { flag: Flag; size: number; uid: string }) {
    const id = "lg" + flag + uid
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" style={{ display: "block", flex: "none" }}>
            <defs><clipPath id={id}><circle cx="8" cy="8" r="8" /></clipPath></defs>
            <g clipPath={"url(#" + id + ")"}><FlagArt flag={flag} /></g>
            <circle cx="8" cy="8" r="7.6" fill="none" stroke="rgba(0,0,0,0.16)" strokeWidth="0.8" />
        </svg>
    )
}

// ── Cambio suave: conservar posición y fundido ──
// Antes de cambiar de idioma se guarda dónde estaba el selector en pantalla; la página nueva
// vuelve a esa misma posición en vez de saltar al inicio. El fundido usa View Transitions
// (Chrome, Edge, Safari 18+); en navegadores sin soporte el cambio es directo.
const KEY = "lingo:spot"
const W: any = typeof window !== "undefined" ? window : {}
function allLingos(): Element[] {
    return Array.from(document.querySelectorAll("[data-lingo]"))
}
function saveSpot(el: Element | null) {
    if (!el) return
    try {
        sessionStorage.setItem(KEY, JSON.stringify({
            i: allLingos().indexOf(el), top: el.getBoundingClientRect().top, y: window.scrollY, t: Date.now(),
        }))
    } catch (e) {}
}
function restoreSpot(el: Element | null) {
    let s: any = null
    try { s = JSON.parse(sessionStorage.getItem(KEY) || "null") } catch (e) {}
    if (!s || !el || Date.now() - s.t > 8000) return false
    const list = allLingos()
    const mine = list.indexOf(el)
    const target = s.i >= 0 && s.i < list.length ? s.i : 0
    if (mine !== target) return false
    const apply = () => {
        const y = window.scrollY + el.getBoundingClientRect().top - s.top
        window.scrollTo({ top: Math.max(0, y), left: 0, behavior: "instant" as ScrollBehavior })
    }
    apply()
    requestAnimationFrame(apply)
    ;[60, 160, 320].forEach((ms) => window.setTimeout(apply, ms))
    window.setTimeout(() => { try { sessionStorage.removeItem(KEY) } catch (e) {} }, 360)
    return true
}
function finishFade() {
    const done = W.__lingoDone
    W.__lingoDone = null
    if (done) done()
}
function withFade(on: boolean, swap: () => void) {
    const d: any = document
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!on || reduce || !d.startViewTransition) { swap(); return }
    d.startViewTransition(() => new Promise<void>((resolve) => {
        W.__lingoDone = resolve
        swap()
        window.setTimeout(finishFade, 900) // por si la página nueva no trae Lingo
    }))
}
function ensureCrossDocumentFade() {
    if (document.getElementById("lingo-vt")) return
    const st = document.createElement("style")
    st.id = "lingo-vt"
    st.textContent = "@view-transition { navigation: auto; }"
    document.head.appendChild(st)
}

// ── Rutas ──
const clean = (c: string) => (c || "").trim().replace(/^\/+|\/+$/g, "").toLowerCase()
const esc = (s: string) => s.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&")
function prefixOf(path: string, codes: string[]) {
    for (let i = 1; i < codes.length; i++) {
        const c = codes[i]
        if (c && new RegExp("^/" + esc(c) + "(/|$)", "i").test(path)) return i
    }
    return 0
}
function pathFor(target: number, path: string, codes: string[]) {
    const cur = prefixOf(path, codes)
    let bare = path
    if (cur > 0) {
        bare = path.slice(codes[cur].length + 1)
        if (bare === "") bare = "/"
    }
    if (target === 0) return bare
    return bare === "/" ? "/" + codes[target] : "/" + codes[target] + bare
}

const normPath = (p: string) => {
    let x = (p || "").trim()
    if (!x) return ""
    if (!x.startsWith("/")) x = "/" + x
    if (x.length > 1) x = x.replace(/\/+$/, "")
    return x.toLowerCase()
}
// ¿Existe la ruta en el sitio? Compara con las páginas del router de Framer, incluidas las de CMS (/blog/:slug).
function routeExists(routes: Record<string, any>, p: string) {
    const target = p.toLowerCase()
    return Object.keys(routes).some((id) => {
        const rp: string | undefined = routes[id] && routes[id].path
        if (!rp) return false
        if (rp.toLowerCase() === target) return true
        if (rp.indexOf(":") < 0) return false
        const re = new RegExp("^" + rp.split("/").map((seg) => (seg.startsWith(":") ? "[^/]+" : esc(seg))).join("/") + "$", "i")
        return re.test(target)
    })
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function Lingo(props: Props) {
    const { mode, variant, showFlags, flagSize, font, gap, preview, style, keepPosition, transition } = props
    const preset: Preset = props.preset || "custom"
    const pal: Palette = preset === "custom"
        ? { color: props.color, activeColor: props.activeColor, track: props.track, border: props.border, thumb: props.thumb, thumbBorder: props.thumbBorder, menuFill: props.menuFill, shadow: true }
        : preset === "accent" ? accentPalette(props.accent || "#2F5BFF") : PRESETS[preset]
    const { color, activeColor, track, border, thumb, thumbBorder, menuFill } = pal
    const sz = SIZES[props.size || "m"] || SIZES.m
    const radius = props.radius ?? 999
    const display = props.display || "both"
    const up = props.menuDirection === "up"
    const alignLeft = props.menuAlign === "left"
    const blur: CSSProperties = pal.blur ? { backdropFilter: "blur(14px) saturate(160%)", WebkitBackdropFilter: "blur(14px) saturate(160%)" } : {}
    const langs: Lang[] = (props.languages && props.languages.length ? props.languages : (Lingo.defaultProps.languages as Lang[])).slice(0, 10)
    const codes = langs.map((l) => clean(l.code))
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
    const onCanvas = RenderTarget.current() === RenderTarget.canvas
    const router: any = useFramerRouter ? useFramerRouter() : null
    const locale: any = useFramerLocale ? useFramerLocale() : null
    const routes: Record<string, any> = (router && router.routes) || {}
    const routePath: string | undefined = router && router.currentRouteId && routes[router.currentRouteId] ? routes[router.currentRouteId].path : undefined
    const [winPath, setWinPath] = useState("/")
    const [rest, setRest] = useState("")
    const [picked, setPicked] = useState<number | null>(null)
    const [open, setOpen] = useState(false)
    const wrap = useRef<HTMLDivElement>(null)
    const pillRef = useRef<HTMLElement>(null)
    const rootEl = () => (variant === "menu" ? wrap.current : pillRef.current)

    // Al montar en la página nueva: regresar a la misma posición y terminar el fundido
    useLayoutEffect(() => {
        if (onCanvas) return
        if (keepPosition !== false) restoreSpot(rootEl())
        if (W.__lingoDone) requestAnimationFrame(finishFade)
        if (transition !== "none" && mode === "path") ensureCrossDocumentFade()
    }, [])

    useEffect(() => {
        if (routePath) return
        setWinPath(window.location.pathname)
        setRest(window.location.search + window.location.hash)
    }, [routePath])
    useEffect(() => {
        if (!open) return
        const close = (e: PointerEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false) }
        const esc2 = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
        window.addEventListener("pointerdown", close)
        window.addEventListener("keydown", esc2)
        return () => { window.removeEventListener("pointerdown", close); window.removeEventListener("keydown", esc2) }
    }, [open])

    const path = routePath || winPath
    const slugs: { code: string; from: string; to: string }[] = (props.slugs || [])
        .filter((r) => r && r.code && r.from && r.to)
        .map((r) => ({ code: clean(r.code), from: normPath(r.from), to: normPath(r.to) }))
    // Ruta base (idioma principal) de la página actual, aunque tenga una URL traducida
    const basePath = () => {
        const p = normPath(path) || "/"
        const own = slugs.find((r) => r.to === p)
        if (own) return own.from
        const b = pathFor(0, path, codes)
        return b === "/404" ? "/" : b // desde la página de error, cada idioma lleva a su inicio
    }
    // Destino para el idioma i: URL traducida si existe, si no /código + ruta base; y si la página no existe, el inicio de ese idioma
    const targetFor = (i: number): string | null => {
        const base = basePath()
        let t: string
        if (i === 0) t = base
        else {
            const row = slugs.find((r) => r.code === codes[i] && r.from === normPath(base))
            t = row ? row.to : base === "/" ? "/" + codes[i] : "/" + codes[i] + base
        }
        const known = Object.keys(routes).length > 0
        if (known && props.fallback !== "none" && !routeExists(routes, t)) {
            const home = i === 0 ? "/" : "/" + codes[i]
            if (routeExists(routes, home)) return home
            return null // ese idioma no existe en el sitio: no se navega, solo cambia la selección
        }
        return t
    }
    let active = 0
    if (mode === "locales" && locale && locale.activeLocale) {
        const c = String(locale.activeLocale.code || "").toLowerCase()
        const i = codes.findIndex((k) => k && (c === k || c.startsWith(k + "-")))
        active = i < 0 ? 0 : i
    } else {
        const own = slugs.find((r) => r.to === normPath(path))
        active = own ? Math.max(0, codes.indexOf(own.code)) : prefixOf(path, codes)
    }
    if (onCanvas) active = Math.max(0, Math.min(langs.length - 1, Math.round(preview || 0)))
    if (picked !== null) active = picked

    const live = props.navigate !== false
    const hrefFor = (i: number) => {
        if (!live || mode !== "path") return undefined
        const t = targetFor(i)
        return t === null ? undefined : t + (routePath ? "" : rest)
    }

    const go = (i: number) => (e: React.MouseEvent) => {
        if (onCanvas) { e.preventDefault(); return }
        e.preventDefault()
        setOpen(false)
        if (i === active) return
        if (!live) { setPicked(i); return } // modo demo: solo cambia la selección, no navega
        if (mode === "locales") {
            const list: any[] = (locale && locale.locales) || []
            const want = codes[i]
            const loc = list.find((l) => { const c = String(l.code || "").toLowerCase(); return c === want || c.startsWith(want + "-") })
            if (!loc || !locale.setLocale) return
            setPicked(i)
            if (keepPosition !== false) saveSpot(rootEl())
            window.setTimeout(() => withFade(transition !== "none", () => locale.setLocale(loc)), 180)
            return
        }
        const to = targetFor(i)
        if (to === null) { setPicked(i); return }
        const hit = Object.keys(routes).find((id) => routes[id] && String(routes[id].path).toLowerCase() === to)
        setPicked(i)
        if (keepPosition !== false) saveSpot(rootEl())
        window.setTimeout(() => {
            withFade(transition !== "none", () => {
                if (hit && router && router.navigate) router.navigate(hit, "", undefined, false)
                else window.location.href = to + rest
            })
        }, 180)
    }

    const textStyle: CSSProperties = { letterSpacing: "0.04em", lineHeight: 1, ...font }
    const content = (i: number) => (
        <>
            {(showFlags || display === "flag") && display !== "label" && langs[i].flag !== "none" && <FlagIcon flag={langs[i].flag} size={flagSize} uid={uid + i} />}
            {display !== "flag" || langs[i].flag === "none" ? (langs[i].label ? <span>{langs[i].label}</span> : null) : <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{langs[i].label}</span>}
        </>
    )
    const pad = sz.pad

    // ── Deslizamiento lateral (Pill con Max Width): arrastre con el mouse, swipe nativo en touch, sin barra visible ──
    const maxW = variant === "pill" ? Math.max(0, props.maxWidth || 0) : 0
    const scroller = useRef<HTMLDivElement>(null)
    const [edges, setEdges] = useState({ l: false, r: false })
    const drag = useRef({ down: false, moved: false, x: 0, sl: 0, lx: 0, lt: 0, v: 0, raf: 0 })
    const updateEdges = () => {
        const el = scroller.current
        if (!el) return
        const l = el.scrollLeft > 1
        const r = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
        setEdges((e) => (e.l === l && e.r === r ? e : { l, r }))
    }
    useEffect(() => {
        const el = scroller.current
        if (!el || !maxW) return
        const a = el.querySelectorAll("a")[active] as HTMLElement | undefined
        if (a && el.scrollWidth > el.clientWidth) el.scrollLeft = a.offsetLeft - (el.clientWidth - a.offsetWidth) / 2
        updateEdges()
        const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateEdges) : null
        if (ro) ro.observe(el)
        return () => { if (ro) ro.disconnect(); cancelAnimationFrame(drag.current.raf) }
    }, [maxW, langs.length])
    const onDown = (e: React.PointerEvent) => {
        const el = scroller.current, d = drag.current
        if (!el || !maxW || e.pointerType !== "mouse" || e.button !== 0) return
        cancelAnimationFrame(d.raf)
        Object.assign(d, { down: true, moved: false, x: e.clientX, sl: el.scrollLeft, lx: e.clientX, lt: performance.now(), v: 0 })
    }
    const onMove = (e: React.PointerEvent) => {
        const el = scroller.current, d = drag.current
        if (!el || !d.down) return
        const dx = e.clientX - d.x
        if (!d.moved && Math.abs(dx) > 4) { d.moved = true; try { el.setPointerCapture(e.pointerId) } catch (err) {} }
        if (!d.moved) return
        el.scrollLeft = d.sl - dx
        const now = performance.now()
        if (now > d.lt) d.v = (e.clientX - d.lx) / (now - d.lt)
        d.lx = e.clientX; d.lt = now
    }
    const onUp = () => {
        const el = scroller.current, d = drag.current
        if (!el || !d.down) return
        d.down = false
        if (!d.moved) return
        let v = -d.v * 16
        const step = () => {
            v *= 0.92
            if (Math.abs(v) < 0.4) return
            el.scrollLeft += v
            d.raf = requestAnimationFrame(step)
        }
        d.raf = requestAnimationFrame(step)
    }
    const onClickCap = (e: React.MouseEvent) => {
        if (drag.current.moved) { e.preventDefault(); e.stopPropagation(); drag.current.moved = false }
    }

    if (variant === "menu") {
        return (
            <div ref={wrap} data-lingo="" style={{ ...style, position: "relative", width: "max-content" }}>
                <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    aria-label="Language"
                    onClick={() => !onCanvas && setOpen((o) => !o)}
                    style={{
                        ...textStyle, display: "flex", alignItems: "center", gap, padding: sz.btn,
                        minHeight: sz.btnH, borderRadius: radius, background: track, border: "1px solid " + border, ...blur,
                        color: activeColor, cursor: "pointer", whiteSpace: "nowrap", boxSizing: "border-box",
                    }}
                >
                    {content(active)}
                    <motion.svg width="10" height="10" viewBox="0 0 10 10" animate={{ rotate: open ? 180 : 0 }} style={{ display: "block", opacity: 0.6 }}>
                        <path d="M2 3.5L5 6.5L8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                </button>
                <AnimatePresence>
                    {open && (
                        <motion.ul
                            role="listbox"
                            initial={{ opacity: 0, y: up ? 6 : -6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: up ? 6 : -6, scale: 0.98 }}
                            transition={{ duration: 0.16 }}
                            style={{
                                position: "absolute", ...(up ? { bottom: "calc(100% + 6px)" } : { top: "calc(100% + 6px)" }),
                                ...(alignLeft ? { left: 0 } : { right: 0 }), zIndex: 10, margin: 0, padding: 4,
                                listStyle: "none", minWidth: "100%", borderRadius: Math.min(radius, 14), background: menuFill, ...blur,
                                border: "1px solid " + border, boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)",
                                boxSizing: "border-box", transformOrigin: (up ? "bottom " : "top ") + (alignLeft ? "left" : "right"),
                            }}
                        >
                            {langs.map((l, i) => (
                                <li key={i} role="option" aria-selected={i === active}>
                                    <a
                                        href={hrefFor(i)}
                                        hrefLang={codes[i] || undefined}
                                        onClick={go(i)}
                                        style={{
                                            ...textStyle, display: "flex", alignItems: "center", gap, padding: "8px 10px",
                                            borderRadius: Math.min(radius, 10), textDecoration: "none", whiteSpace: "nowrap", cursor: "pointer", userSelect: "none",
                                            color: i === active ? activeColor : color,
                                            background: i === active && !pal.underline ? thumb : "transparent",
                                        }}
                                    >
                                        {content(i)}
                                    </a>
                                </li>
                            ))}
                        </motion.ul>
                    )}
                </AnimatePresence>
            </div>
        )
    }

    const n = langs.length
    const fade = 18
    const mask = maxW && (edges.l || edges.r)
        ? "linear-gradient(to right, " + (edges.l ? "transparent" : "#000") + " 0, #000 " + fade + "px, #000 calc(100% - " + fade + "px), " + (edges.r ? "transparent" : "#000") + " 100%)"
        : undefined
    return (
        <nav
            ref={pillRef as any}
            data-lingo=""
            aria-label="Language"
            style={{
                ...style, position: "relative", display: "flex", width: maxW ? "auto" : "max-content", maxWidth: maxW || undefined,
                padding: pad, borderRadius: radius, background: track,
                border: "1px solid " + border, boxSizing: "border-box", whiteSpace: "nowrap", ...blur,
            }}
        >
            {maxW ? <style>{"[data-lingo-scroll]::-webkit-scrollbar{display:none}"}</style> : null}
            <div
                ref={scroller}
                data-lingo-scroll=""
                onScroll={maxW ? updateEdges : undefined}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                onClickCapture={onClickCap}
                style={{
                    flex: "1 1 auto", minWidth: 0, borderRadius: Math.max(0, radius - pad),
                    overflowX: maxW ? "auto" : "visible", overflowY: maxW ? "hidden" : "visible",
                    scrollbarWidth: "none" as any, msOverflowStyle: "none" as any, overscrollBehaviorX: "contain" as any,
                    WebkitOverflowScrolling: "touch" as any, maskImage: mask, WebkitMaskImage: mask,
                }}
            >
                <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(" + n + ", 1fr)", width: "max-content" }}>
                    <motion.span
                        aria-hidden="true"
                        initial={false}
                        animate={{ x: active * 100 + "%" }}
                        transition={picked !== null ? { type: "spring", stiffness: 520, damping: 38 } : { duration: 0 }}
                        style={{
                            position: "absolute", top: pal.underline ? "auto" : 0, bottom: 0, left: 0,
                            width: "calc(100% / " + n + ")",
                            borderRadius: Math.max(0, radius - pad), background: thumb, border: "1px solid " + thumbBorder,
                            ...(pal.underline ? { height: 2, borderRadius: 2, border: "none", background: "linear-gradient(" + thumb + ", " + thumb + ") center / 36% 100% no-repeat" } : {}),
                            boxShadow: pal.shadow ? "0 1px 2px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)" : "none", boxSizing: "border-box",
                        }}
                    />
                    {langs.map((l, i) => (
                        <a
                            key={i}
                            href={hrefFor(i)}
                            hrefLang={codes[i] || undefined}
                            lang={codes[i] || undefined}
                            onClick={go(i)}
                            role={hrefFor(i) ? undefined : "button"}
                            tabIndex={0}
                            draggable={false}
                            aria-current={i === active ? "true" : undefined}
                            title={display === "flag" ? l.label : undefined}
                            style={{
                                ...textStyle, position: "relative", zIndex: 1, display: "flex", alignItems: "center",
                                justifyContent: "center", gap, padding: sz.item, minHeight: sz.itemH, boxSizing: "border-box",
                                color: i === active ? activeColor : color, textDecoration: "none",
                                cursor: "pointer", transition: "color 0.2s ease",
                                WebkitTapHighlightColor: "transparent", userSelect: "none",
                            }}
                        >
                            {content(i)}
                        </a>
                    ))}
                </div>
            </div>
        </nav>
    )
}

const FLAGS = ["none", "us", "gb", "mx", "es", "fr", "de", "it", "pt", "br", "nl", "ca", "jp", "cn", "kr", "ar"]
const FLAG_TITLES = ["None", "United States", "United Kingdom", "Mexico", "Spain", "France", "Germany", "Italy", "Portugal", "Brazil", "Netherlands", "Canada", "Japan", "China", "South Korea", "Argentina"]

Lingo.defaultProps = {
    languages: [
        { label: "EN", code: "en", flag: "us" },
        { label: "ES", code: "es", flag: "mx" },
    ],
    mode: "path", variant: "pill", showFlags: true, flagSize: 16,
    color: "#6B7280", activeColor: "#111827", track: "#F1F2F4", border: "rgba(17,24,39,0.08)",
    thumb: "#FFFFFF", thumbBorder: "rgba(17,24,39,0.12)", menuFill: "#FFFFFF", gap: 6, preview: 0,
    keepPosition: true, transition: "fade",
    preset: "custom", accent: "#2F5BFF", size: "m", radius: 999, display: "both", menuDirection: "down", menuAlign: "right", navigate: true, maxWidth: 0, slugs: [], fallback: "home",
}

addPropertyControls(Lingo, {
    languages: {
        type: ControlType.Array,
        title: "Languages",
        maxCount: 10,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "EN" },
                code: { type: ControlType.String, title: "Code", defaultValue: "en", description: "Path prefix or locale code." },
                flag: { type: ControlType.Enum, title: "Flag", options: FLAGS, optionTitles: FLAG_TITLES, defaultValue: "us" },
            },
        },
        description: "The first language lives at the root (/), the rest under /code.",
    },
    mode: {
        type: ControlType.Enum, title: "Mode", options: ["path", "locales"], optionTitles: ["Paths", "Locales (beta)"],
        description: "Paths: the first language at /, the rest at /code. Locales: Framer Localization (beta).",
        displaySegmentedControl: true,
    },
    variant: {
        type: ControlType.Enum, title: "Style", options: ["pill", "menu"], optionTitles: ["Pill", "Menu"],
        displaySegmentedControl: true,
    },
    preset: {
        type: ControlType.Enum, title: "Preset",
        options: ["custom", "light", "dark", "glass", "outline", "accent", "minimal"],
        optionTitles: ["Custom", "Light", "Dark", "Glass", "Outline", "Accent", "Minimal"],
        description: "Ready-made looks. Custom uses the colors below.",
    },
    accent: { type: ControlType.Color, title: "Accent", hidden: (p: Props) => p.preset !== "accent" },
    size: { type: ControlType.Enum, title: "Size", options: ["s", "m", "l"], optionTitles: ["S", "M", "L"], displaySegmentedControl: true },
    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 999, step: 1, description: "999 = fully rounded." },
    display: {
        type: ControlType.Enum, title: "Show", options: ["both", "label", "flag"], optionTitles: ["Flag + Label", "Label", "Flag"],
    },
    showFlags: { type: ControlType.Boolean, title: "Flags", hidden: (p: Props) => p.display === "label" || p.display === "flag" },
    flagSize: { type: ControlType.Number, title: "Flag Size", min: 10, max: 32, hidden: (p: Props) => p.display === "label" || (!p.showFlags && p.display !== "flag") },
    font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 13, variant: "Bold" } },
    color: { type: ControlType.Color, title: "Text", hidden: (p: Props) => (p.preset || "custom") !== "custom" },
    activeColor: { type: ControlType.Color, title: "Active", hidden: (p: Props) => (p.preset || "custom") !== "custom" },
    track: { type: ControlType.Color, title: "Track", hidden: (p: Props) => (p.preset || "custom") !== "custom" },
    border: { type: ControlType.Color, title: "Border", hidden: (p: Props) => (p.preset || "custom") !== "custom" },
    thumb: { type: ControlType.Color, title: "Thumb", hidden: (p: Props) => (p.preset || "custom") !== "custom" },
    thumbBorder: { type: ControlType.Color, title: "Thumb Border", hidden: (p: Props) => p.variant === "menu" || (p.preset || "custom") !== "custom" },
    menuFill: { type: ControlType.Color, title: "Menu", hidden: (p: Props) => p.variant !== "menu" || (p.preset || "custom") !== "custom" },
    menuDirection: { type: ControlType.Enum, title: "Opens", options: ["down", "up"], optionTitles: ["Down", "Up"], displaySegmentedControl: true, hidden: (p: Props) => p.variant !== "menu" },
    menuAlign: { type: ControlType.Enum, title: "Align", options: ["right", "left"], optionTitles: ["Right", "Left"], displaySegmentedControl: true, hidden: (p: Props) => p.variant !== "menu" },
    gap: { type: ControlType.Number, title: "Gap", min: 0, max: 24 },
    keepPosition: {
        type: ControlType.Boolean, title: "Keep Position", enabledTitle: "Yes", disabledTitle: "No",
        description: "Stay at the same spot of the page after switching, instead of jumping to the top.",
    },
    transition: {
        type: ControlType.Enum, title: "Transition", options: ["fade", "none"], optionTitles: ["Fade", "None"],
        displaySegmentedControl: true, description: "Soft crossfade between languages where the browser supports it.",
    },
    slugs: {
        type: ControlType.Array, title: "Translated URLs",
        hidden: (p: Props) => p.mode === "locales",
        control: {
            type: ControlType.Object,
            controls: {
                code: { type: ControlType.String, title: "Code", placeholder: "es" },
                from: { type: ControlType.String, title: "Page", placeholder: "/about" },
                to: { type: ControlType.String, title: "URL", placeholder: "/es/nosotros" },
            },
        },
        description: "Optional. Use when a page has a different URL in another language. Without a row, Lingo uses /code + the same path.",
    },
    fallback: {
        type: ControlType.Enum, title: "Missing Page", options: ["home", "none"], optionTitles: ["Go Home", "Keep URL"],
        displaySegmentedControl: true, hidden: (p: Props) => p.mode === "locales",
        description: "If a language version of the page doesn't exist, send visitors to that language's home instead of a 404.",
    },
    maxWidth: {
        type: ControlType.Number, title: "Max Width", min: 0, max: 1600, step: 1, unit: "px", hidden: (p: Props) => p.variant === "menu",
        description: "0 = show every language. Set a width and the rest slide sideways: drag with the mouse or swipe. No visible scrollbar.",
    },
    navigate: {
        type: ControlType.Boolean, title: "Links", enabledTitle: "On", disabledTitle: "Demo",
        description: "Demo: switches the selection without leaving the page. Useful for showcases.",
    },
    preview: { type: ControlType.Number, title: "Canvas", min: 0, max: 9, step: 1, displayStepper: true, description: "Which language looks active on the canvas (0 = first)." },
})
