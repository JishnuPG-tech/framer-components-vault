import * as React from "react"
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { animate, useMotionValue, useReducedMotion } from "framer-motion"

type Img = { src?: string; srcSet?: string; alt?: string }
type NavLink = { label?: string; link?: string }

interface Props {
    content?: React.ReactNode[]
    image?: Img
    headline: string
    subline: string
    meta: string
    brand: string
    logo?: Img
    links: NavLink[]
    emailTitle: string
    email: string
    languageTitle: string
    languages: NavLink[]
    socialTitle: string
    socials: NavLink[]
    displayFont?: React.CSSProperties
    textFont?: React.CSSProperties
    linkSize: number
    panelColor: string
    inkColor: string
    mutedColor: string
    accentColor: string
    accentTextColor: string
    heroTextColor: string
    tilt: number
    cardRadius: number
    gap: number
    peek: number
    dim: number
    transition: any
    openOnCanvas: boolean
    closeOnNavigate: boolean
    style?: React.CSSProperties
}

const DEFAULT_IMAGE: Img = {
    src: "https://images.unsplash.com/photo-1748063578185-3d68121b11ff?auto=format&fit=crop&w=2000&q=80",
    alt: "A modern white house with glowing windows at dusk",
}

// one place for every default, shared by the component and its property controls
const DEFAULTS = {
    headline: "Spaces shaped by light",
    subline: "An architecture and interiors studio designing calm homes, schools and workplaces.",
    meta: "Est. 2012 · Copenhagen",
    brand: "Loma",
    links: [
        { label: "Work", link: "" },
        { label: "Studio", link: "" },
        { label: "Process", link: "" },
        { label: "Journal", link: "" },
    ] as NavLink[],
    emailTitle: "Say hello",
    email: "hello@yourstudio.com",
    languageTitle: "Language",
    languages: [{ label: "EN" }, { label: "ES" }, { label: "DE" }] as NavLink[],
    socialTitle: "Follow",
    socials: [
        { label: "Instagram", link: "https://www.instagram.com" },
        { label: "LinkedIn", link: "https://www.linkedin.com" },
        { label: "Behance", link: "https://www.behance.net" },
    ] as NavLink[],
    linkSize: 64,
    panelColor: "#ECE8DF",
    inkColor: "#16150F",
    mutedColor: "rgba(22, 21, 15, 0.5)",
    accentColor: "#2B45F5",
    accentTextColor: "#FFFFFF",
    heroTextColor: "#FFFFFF",
    tilt: 6,
    cardRadius: 28,
    gap: 16,
    peek: 120,
    dim: 0.35,
    transition: { type: "spring" as const, stiffness: 90, damping: 20, mass: 1 },
    openOnCanvas: false,
    closeOnNavigate: true,
}

const SYSTEM_FONT = `system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
const BAR = 76 // height of the top bar

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const ease = (t: number) => 1 - Math.pow(1 - t, 3)
const RAD = Math.PI / 180
type Layer = HTMLElement | SVGSVGElement

// only allow web, mail, phone and in-site destinations from the link controls
function safeHref(url?: string) {
    const u = (url || "").trim()
    if (!u) return undefined
    if (/^(https?:|mailto:|tel:)/i.test(u) || /^[/#.?]/.test(u)) return u
    if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) return u
    return undefined
}

function useBox(ref: React.RefObject<HTMLElement>, fallback: { w: number; h: number }) {
    const [box, setBox] = useState(fallback)
    useLayoutEffect(() => {
        const el = ref.current
        if (!el) return
        const measure = () => {
            const w = el.offsetWidth || fallback.w
            const h = el.offsetHeight || fallback.h
            setBox((b) => (b.w === w && b.h === h ? b : { w, h }))
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    return box
}

interface Geometry {
    W: number
    H: number
    menuH: number
    tilt: number
    gap: number
    radius: number
    dim: number
}

// The page card hinges back from its bottom edge while it drops below the menu.
// The translate is solved so the card's top edge lands exactly under the menu, with an even side gap.
function cardStyle(v: number, g: Geometry) {
    const t = clamp(v, 0, 1)
    const P = Math.max(900, 1.4 * Math.max(g.W, g.H))
    const th = g.tilt * t * RAD
    const lift = (g.H * Math.sin(th)) / P
    const topW = Math.max(1, g.W - 2 * g.gap * t)
    const s = (topW / g.W) * (1 + lift)
    const target = (g.menuH + g.gap) * t
    const ty = (target - g.H) * (1 + lift) + g.H * s * Math.cos(th)
    return {
        transform: `perspective(${P}px) translateY(${ty}px) scale(${s}) rotateX(${g.tilt * t}deg)`,
        borderRadius: g.radius * t,
        shade: g.dim * t,
    }
}

// staggered progress for the i-th of n revealed lines
const lineProgress = (v: number, i: number, n: number) => {
    const step = 0.06
    const span = Math.max(0.3, 1 - step * Math.max(0, n - 1) - 0.18)
    return ease(clamp((v - 0.18 - i * step) / span, 0, 1))
}

/**
 * Hinge Menu
 * A header whose menu opens by tipping the page back like a hinged lid. The page card drops below a full menu
 * with large numbered links, contact, language and social details.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function HingeMenu(props: Partial<Props>) {
    const isStatic = useIsStaticRenderer()
    const p: any = { ...DEFAULTS, image: DEFAULT_IMAGE, content: [] }
    for (const key of Object.keys(props)) if ((props as any)[key] !== undefined) p[key] = (props as any)[key]
    return <Shell {...(p as Props)} isStatic={isStatic} />
}

function Shell(props: Props & { isStatic: boolean }) {
    const { isStatic, content, image, headline, subline, meta, brand, logo, links, emailTitle, email, languageTitle, languages, socialTitle, socials, linkSize, panelColor, inkColor, mutedColor, accentColor, accentTextColor, heroTextColor, tilt, cardRadius, gap, peek, dim, transition, openOnCanvas, closeOnNavigate } = props
    const rootRef = useRef<HTMLDivElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const toggleRef = useRef<HTMLButtonElement>(null)
    const firstLinkRef = useRef<HTMLAnchorElement>(null)
    const box = useBox(rootRef, { w: 1200, h: 760 })
    const menuBox = useBox(menuRef, { w: 1200, h: 420 })
    const reduced = useReducedMotion() ?? false
    const menuId = useId()

    const compact = box.w < 760
    const pad = compact ? 18 : 28
    const menuH = clamp(menuBox.h, 120, Math.max(120, box.h - peek))
    const geo: Geometry = { W: box.w, H: box.h, menuH, tilt, gap, radius: cardRadius, dim }

    // the canvas shows a still menu, open or closed, picked with Open on Canvas
    const [open, setOpen] = useState(isStatic ? openOnCanvas : false)
    const progress = useMotionValue(open ? 1 : 0)
    const value = isStatic ? (openOnCanvas ? 1 : 0) : progress.get()

    // live only: write each frame of the spring straight to the layers
    const cardRef = useRef<HTMLDivElement>(null)
    const shadeRef = useRef<HTMLDivElement>(null)
    const closedLayers = useRef<(Layer | null)[]>([])
    const openLayers = useRef<(Layer | null)[]>([])
    const lineRefs = useRef<(HTMLElement | null)[]>([])
    const labelClosed = useRef<HTMLSpanElement>(null)
    const labelOpen = useRef<HTMLSpanElement>(null)
    const barTop = useRef<(SVGLineElement | null)[]>([])
    const barBottom = useRef<(SVGLineElement | null)[]>([])
    const lineCount = links.length + 3
    const geoRef = useRef(geo)
    geoRef.current = geo

    const apply = useCallback(
        (v: number) => {
            const c = cardStyle(v, geoRef.current)
            if (cardRef.current) {
                cardRef.current.style.transform = c.transform
                cardRef.current.style.borderRadius = `${c.borderRadius}px`
            }
            if (shadeRef.current) shadeRef.current.style.opacity = String(c.shade)
            for (const el of closedLayers.current) if (el) el.style.opacity = String(1 - v)
            for (const el of openLayers.current) if (el) el.style.opacity = String(v)
            const lines = lineRefs.current.slice(0, lineCount)
            lines.forEach((el, i) => {
                if (!el) return
                const lp = lineProgress(v, i, lines.length)
                el.style.transform = `translateY(${(1 - lp) * 105}%) rotate(${(1 - lp) * 3}deg)`
                el.style.opacity = String(clamp(lp * 1.4, 0, 1))
            })
            if (labelClosed.current) labelClosed.current.style.transform = `translateY(${-v * 100}%)`
            if (labelOpen.current) labelOpen.current.style.transform = `translateY(${(1 - v) * 100}%)`
            for (const el of barTop.current) if (el) el.setAttribute("transform", `translate(0 ${v * 3}) rotate(${v * 45} 9 6)`)
            for (const el of barBottom.current) if (el) el.setAttribute("transform", `translate(0 ${-v * 3}) rotate(${-v * 45} 9 12)`)
        },
        [lineCount]
    )

    useEffect(() => {
        if (isStatic) return
        apply(progress.get())
        return progress.on("change", apply)
    }, [isStatic, apply])
    // keep the open card in place when the size or the menu height changes
    useEffect(() => {
        if (!isStatic) apply(progress.get())
    }, [box.w, box.h, menuH, tilt, gap, cardRadius, dim, isStatic, apply])

    const transitionRef = useRef(transition)
    transitionRef.current = transition
    const setMenu = useCallback(
        (next: boolean, keyboard = false) => {
            setOpen(next)
            if (reduced) progress.set(next ? 1 : 0)
            else animate(progress, next ? 1 : 0, transitionRef.current)
            // keyboard users land on the first link when it opens, and back on the button when it closes
            if (!keyboard) return
            if (next) firstLinkRef.current?.focus({ preventScroll: true })
            else toggleRef.current?.focus({ preventScroll: true })
        },
        [reduced]
    )

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape" && open) {
            e.preventDefault()
            setMenu(false, true)
        }
    }

    // rendered styles for the current value; the live spring then keeps them up to date
    const c = cardStyle(value, geo)
    const fade = (on: boolean): React.CSSProperties => ({ opacity: on ? value : 1 - value })
    const live = !isStatic
    const interactive = live && open

    const display: React.CSSProperties = { fontFamily: SYSTEM_FONT, fontWeight: 500, letterSpacing: "-0.035em", lineHeight: 1, ...props.displayFont }
    const text: React.CSSProperties = { fontFamily: SYSTEM_FONT, fontWeight: 500, ...props.textFont }
    const bigSize = Math.round(linkSize * clamp(box.w / 1200, compact ? 0.58 : 0.72, 1.15))

    const lineStyle = (i: number): React.CSSProperties => {
        const lp = lineProgress(value, i, lineCount)
        return { display: "block", transform: `translateY(${(1 - lp) * 105}%) rotate(${(1 - lp) * 3}deg)`, opacity: clamp(lp * 1.4, 0, 1), transformOrigin: "0% 100%" }
    }
    const lineRef = (i: number) => (el: HTMLElement | null) => {
        lineRefs.current[i] = el
    }
    const layerRef = (list: React.MutableRefObject<(Layer | null)[]>, i: number) => (el: Layer | null) => {
        list.current[i] = el
    }

    const [hovered, setHovered] = useState(-1)
    const [lang, setLang] = useState(0)
    const tab = interactive ? 0 : -1
    const navigate = () => {
        if (closeOnNavigate && live) setMenu(false)
    }

    const page =
        content && content.length > 0 && React.isValidElement(content[0]) ? (
            React.cloneElement(content[0] as React.ReactElement<any>, { style: { ...(((content[0] as any).props || {}).style || {}), width: "100%", height: "100%" } })
        ) : (
            <BuiltInHero image={image} headline={headline} subline={subline} meta={meta} color={heroTextColor} display={display} text={text} compact={compact} pad={pad} />
        )

    return (
        <div ref={rootRef} onKeyDown={onKeyDown} style={{ ...props.style, position: "relative", width: "100%", height: "100%", overflow: "hidden", background: panelColor, color: inkColor, ...text }}>
            {/* the menu, behind the page card */}
            <nav id={menuId} aria-label="Main" aria-hidden={!(isStatic ? openOnCanvas : open)} style={{ position: "absolute", left: 0, right: 0, top: 0 }}>
                <div
                    ref={menuRef}
                    style={{
                        display: "grid",
                        gridTemplateColumns: compact ? "1fr" : "minmax(0, 7fr) minmax(0, 5fr)",
                        columnGap: 48,
                        rowGap: 36,
                        padding: `${BAR + (compact ? 20 : 36)}px ${pad}px ${compact ? 28 : 44}px`,
                        boxSizing: "border-box",
                    }}
                >
                    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: compact ? 6 : 4 }} onMouseLeave={() => setHovered(-1)}>
                        {links.map((item, i) => {
                            const dimmed = hovered >= 0 && hovered !== i
                            const active = hovered === i
                            return (
                                <li key={i} style={{ overflow: "hidden", paddingBottom: "0.08em" }}>
                                    <a
                                        ref={(el) => {
                                            lineRefs.current[i] = el
                                            if (i === 0) (firstLinkRef as React.MutableRefObject<HTMLAnchorElement | null>).current = el
                                        }}
                                        href={safeHref(item.link) ?? "#"}
                                        tabIndex={tab}
                                        onClick={navigate}
                                        onMouseEnter={() => setHovered(i)}
                                        onFocus={() => setHovered(i)}
                                        onBlur={() => setHovered(-1)}
                                        style={{ ...lineStyle(i), color: inkColor, textDecoration: "none", outlineOffset: 4 }}
                                    >
                                        <span style={{ display: "inline-flex", alignItems: "flex-start", gap: Math.round(bigSize * 0.22), opacity: dimmed ? 0.32 : 1, transition: "opacity 0.35s ease" }}>
                                            <span aria-hidden style={{ position: "relative", display: "inline-block", width: Math.max(26, bigSize * 0.42), height: Math.max(16, bigSize * 0.3), marginTop: bigSize * 0.12, overflow: "hidden", fontSize: Math.max(12, bigSize * 0.2), fontWeight: 600, letterSpacing: "0.02em", ...text }}>
                                                <span style={{ position: "absolute", left: 0, top: 0, color: mutedColor, transform: `translateY(${active ? -110 : 0}%)`, transition: "transform 0.4s cubic-bezier(.2,.8,.2,1)" }}>{String(i + 1).padStart(2, "0")}</span>
                                                <span style={{ position: "absolute", left: 0, top: 0, color: accentColor, transform: `translateY(${active ? 0 : 110}%)`, transition: "transform 0.4s cubic-bezier(.2,.8,.2,1)" }}>→</span>
                                            </span>
                                            <span style={{ ...display, fontSize: bigSize, transform: `translateX(${active ? bigSize * 0.08 : 0}px)`, transition: "transform 0.45s cubic-bezier(.2,.8,.2,1)" }}>{item.label}</span>
                                        </span>
                                    </a>
                                </li>
                            )
                        })}
                    </ol>
                    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 22 : 30, justifyContent: "flex-end", paddingBottom: compact ? 0 : 8 }}>
                        <Group title={emailTitle} muted={mutedColor} innerRef={lineRef(links.length)} style={lineStyle(links.length)}>
                            <a href={email ? `mailto:${email}` : undefined} tabIndex={tab} onClick={navigate} aria-label={email ? `Email ${email}` : undefined} style={{ color: inkColor, textDecoration: "none", fontSize: compact ? 20 : 24, letterSpacing: "-0.01em", borderBottom: `1px solid ${mutedColor}`, paddingBottom: 2 }}>
                                {email}
                            </a>
                        </Group>
                        <Group title={languageTitle} muted={mutedColor} innerRef={lineRef(links.length + 1)} style={lineStyle(links.length + 1)}>
                            <Segmented items={languages} active={lang} onPick={setLang} tab={tab} ink={inkColor} accent={accentColor} accentText={accentTextColor} muted={mutedColor} />
                        </Group>
                        <Group title={socialTitle} muted={mutedColor} innerRef={lineRef(links.length + 2)} style={lineStyle(links.length + 2)}>
                            <span style={{ display: "flex", flexWrap: "wrap", columnGap: 20, rowGap: 6 }}>
                                {socials.map((s, i) => (
                                    <a key={i} href={safeHref(s.link)} target="_blank" rel="noopener noreferrer" tabIndex={tab} aria-label={`${s.label} (opens in a new tab)`} style={{ color: inkColor, textDecoration: "none", fontSize: 16 }}>
                                        {s.label} <span aria-hidden>↗</span>
                                    </a>
                                ))}
                            </span>
                        </Group>
                    </div>
                </div>
            </nav>

            {/* the page card */}
            <div
                ref={cardRef}
                style={{ position: "absolute", inset: 0, overflow: "hidden", transform: c.transform, transformOrigin: "50% 100%", borderRadius: c.borderRadius, willChange: live ? "transform" : undefined, boxShadow: "0 40px 80px -30px rgba(0,0,0,0.45)" }}
            >
                {page}
                <div ref={shadeRef} aria-hidden style={{ position: "absolute", inset: 0, background: "#000", opacity: c.shade, pointerEvents: "none" }} />
                {interactive && <button type="button" tabIndex={-1} aria-hidden onClick={() => setMenu(false)} style={{ position: "absolute", inset: 0, background: "transparent", border: "none", cursor: "pointer", padding: 0 }} />}
            </div>

            {/* the top bar, above everything */}
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: BAR, padding: `0 ${pad}px`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "space-between", pointerEvents: "none" }}>
                <div style={{ position: "relative", pointerEvents: "auto", height: 32, display: "flex", alignItems: "center" }}>
                    <Brand brand={brand} logo={logo} color={heroTextColor} display={display} innerRef={layerRef(closedLayers, 0)} style={fade(false)} />
                    <Brand brand={brand} logo={logo} color={inkColor} display={display} innerRef={layerRef(openLayers, 0)} style={{ ...fade(true), position: "absolute", left: 0, top: 0, bottom: 0 }} hidden />
                </div>
                <button
                    ref={toggleRef}
                    type="button"
                    aria-expanded={isStatic ? openOnCanvas : open}
                    aria-controls={menuId}
                    aria-label={(isStatic ? openOnCanvas : open) ? "Close menu" : "Open menu"}
                    onClick={live ? (e) => setMenu(!open, e.detail === 0) : undefined}
                    style={{ position: "relative", pointerEvents: "auto", height: 44, padding: "0 8px 0 18px", display: "flex", alignItems: "center", gap: 10, borderRadius: 999, border: "none", background: "transparent", cursor: live ? "pointer" : "default", ...text, fontSize: 15 }}
                >
                    <span ref={layerRef(closedLayers, 1)} aria-hidden style={{ ...fade(false), position: "absolute", inset: 0, borderRadius: 999, background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
                        <span style={{ position: "absolute", inset: 0, borderRadius: 999, border: `1px solid ${heroTextColor}`, opacity: 0.5 }} />
                    </span>
                    <span ref={layerRef(openLayers, 1)} aria-hidden style={{ ...fade(true), position: "absolute", inset: 0, borderRadius: 999, background: accentColor }} />
                    <span aria-hidden style={{ position: "relative", display: "inline-block", height: 20, overflow: "hidden", lineHeight: "20px", minWidth: 44, textAlign: "left" }}>
                        <span ref={labelClosed} style={{ display: "block", color: heroTextColor, transform: `translateY(${-value * 100}%)` }}>
                            Menu
                        </span>
                        <span ref={labelOpen} style={{ position: "absolute", left: 0, top: 0, color: accentTextColor, transform: `translateY(${(1 - value) * 100}%)` }}>
                            Close
                        </span>
                    </span>
                    <span aria-hidden style={{ position: "relative", width: 30, height: 30, borderRadius: 999, display: "grid", placeItems: "center" }}>
                        {[heroTextColor, accentTextColor].map((col, k) => (
                            <svg key={k} ref={layerRef(k === 0 ? closedLayers : openLayers, 2)} width="18" height="18" viewBox="0 0 18 18" style={{ position: "absolute", ...fade(k === 1) }}>
                                <line
                                    ref={(el) => {
                                        barTop.current[k] = el
                                    }}
                                    x1="3" y1="6" x2="15" y2="6" stroke={col} strokeWidth="1.8" strokeLinecap="round" transform={`translate(0 ${value * 3}) rotate(${value * 45} 9 6)`} />
                                <line
                                    ref={(el) => {
                                        barBottom.current[k] = el
                                    }}
                                    x1="3" y1="12" x2="15" y2="12" stroke={col} strokeWidth="1.8" strokeLinecap="round" transform={`translate(0 ${-value * 3}) rotate(${-value * 45} 9 12)`} />
                            </svg>
                        ))}
                    </span>
                </button>
            </div>
        </div>
    )
}

function Brand({ brand, logo, color, display, innerRef, style, hidden }: { brand: string; logo?: Img; color: string; display: React.CSSProperties; innerRef: (el: Layer | null) => void; style: React.CSSProperties; hidden?: boolean }) {
    return (
        <span ref={innerRef} aria-hidden={hidden || undefined} style={{ ...style, display: "flex", alignItems: "center", gap: 10, color }}>
            {logo?.src ? (
                <img src={logo.src} srcSet={logo.srcSet} alt={hidden ? "" : logo.alt || brand} style={{ height: 28, width: "auto", display: "block" }} />
            ) : (
                <>
                    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
                        <rect x="1" y="1" width="24" height="24" rx="7" fill="none" stroke={color} strokeWidth="1.6" />
                        <path d="M7 18 L7 8 M7 18 L13 12 L19 18 M19 18 L19 8" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ ...display, fontSize: 22, letterSpacing: "-0.03em" }}>{brand}</span>
                </>
            )}
        </span>
    )
}

function Group({ title, muted, innerRef, style, children }: { title: string; muted: string; innerRef: (el: HTMLElement | null) => void; style: React.CSSProperties; children: React.ReactNode }) {
    return (
        <div style={{ overflow: "hidden", paddingBottom: 4 }}>
            <div ref={innerRef} style={style}>
                <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: muted, marginBottom: 10 }}>{title}</div>
                {children}
            </div>
        </div>
    )
}

function Segmented({ items, active, onPick, tab, ink, accent, accentText, muted }: { items: NavLink[]; active: number; onPick: (i: number) => void; tab: number; ink: string; accent: string; accentText: string; muted: string }) {
    const W = 52
    const a = clamp(active, 0, Math.max(0, items.length - 1))
    return (
        <span role="group" aria-label="Language" style={{ position: "relative", display: "inline-flex", padding: 4, borderRadius: 999, border: `1px solid ${muted}` }}>
            <span aria-hidden style={{ position: "absolute", top: 4, bottom: 4, left: 4, width: W, borderRadius: 999, background: accent, transform: `translateX(${a * W}px)`, transition: "transform 0.45s cubic-bezier(.2,.8,.2,1)" }} />
            {items.map((it, i) => {
                const href = safeHref(it.link)
                const style: React.CSSProperties = { position: "relative", width: W, height: 32, display: "grid", placeItems: "center", borderRadius: 999, border: "none", background: "transparent", color: i === a ? accentText : ink, fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", textDecoration: "none", cursor: "pointer", transition: "color 0.3s", padding: 0, fontFamily: "inherit" }
                return href ? (
                    <a key={i} href={href} tabIndex={tab} aria-current={i === a ? "true" : undefined} onClick={() => onPick(i)} style={style}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{it.label}</span>
                    </a>
                ) : (
                    <button key={i} type="button" tabIndex={tab} aria-pressed={i === a} onClick={() => onPick(i)} style={style}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{it.label}</span>
                    </button>
                )
            })}
        </span>
    )
}

function BuiltInHero({ image, headline, subline, meta, color, display, text, compact, pad }: { image?: Img; headline: string; subline: string; meta: string; color: string; display: React.CSSProperties; text: React.CSSProperties; compact: boolean; pad: number }) {
    const img = image?.src ? image : DEFAULT_IMAGE
    return (
        <div style={{ position: "absolute", inset: 0, background: "#1A1916" }}>
            <img src={img.src} srcSet={img.srcSet} alt={img.alt || ""} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.62) 100%)" }} />
            <div style={{ position: "absolute", left: pad, right: pad, bottom: compact ? 28 : 44, color, display: "flex", flexDirection: compact ? "column" : "row", alignItems: compact ? "flex-start" : "flex-end", justifyContent: "space-between", gap: 20 }}>
                <h1 style={{ ...display, margin: 0, fontSize: compact ? 44 : 84, maxWidth: 820, ...({ textWrap: "balance" } as React.CSSProperties) }}>{headline}</h1>
                <div style={{ ...text, maxWidth: 340, fontSize: 16, lineHeight: 1.45 }}>
                    <p style={{ margin: 0, opacity: 0.88 }}>{subline}</p>
                    <p style={{ margin: "12px 0 0", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7 }}>{meta}</p>
                </div>
            </div>
        </div>
    )
}

const linkItem = {
    type: ControlType.Object,
    controls: {
        label: { type: ControlType.String, title: "Label", defaultValue: "Link" },
        link: { type: ControlType.Link, title: "Link" },
    },
} as const
const usesBuiltInHero = (p: Partial<Props>) => (p.content?.length ?? 0) > 0

addPropertyControls(HingeMenu, {
    content: { type: ControlType.Array, title: "Page", maxCount: 1, control: { type: ControlType.ComponentInstance }, description: "Optional. Connect a frame to show it as the page under the menu. Without one, the built-in hero shows." },
    image: { type: ControlType.ResponsiveImage, title: "Image", hidden: usesBuiltInHero },
    headline: { type: ControlType.String, title: "Headline", defaultValue: DEFAULTS.headline, displayTextArea: true, hidden: usesBuiltInHero },
    subline: { type: ControlType.String, title: "Subline", defaultValue: DEFAULTS.subline, displayTextArea: true, hidden: usesBuiltInHero },
    meta: { type: ControlType.String, title: "Meta", defaultValue: DEFAULTS.meta, hidden: usesBuiltInHero },
    brand: { type: ControlType.String, title: "Brand", defaultValue: DEFAULTS.brand },
    logo: { type: ControlType.ResponsiveImage, title: "Logo", description: "Optional. Replaces the built-in mark and brand name." },
    links: { type: ControlType.Array, title: "Links", maxCount: 8, control: linkItem, defaultValue: DEFAULTS.links },
    emailTitle: { type: ControlType.String, title: "Email Title", defaultValue: DEFAULTS.emailTitle },
    email: { type: ControlType.String, title: "Email", defaultValue: DEFAULTS.email },
    languageTitle: { type: ControlType.String, title: "Language Title", defaultValue: DEFAULTS.languageTitle },
    languages: { type: ControlType.Array, title: "Languages", maxCount: 6, control: linkItem, defaultValue: DEFAULTS.languages, description: "Each one can link to that language's version of the site." },
    socialTitle: { type: ControlType.String, title: "Social Title", defaultValue: DEFAULTS.socialTitle },
    socials: { type: ControlType.Array, title: "Socials", maxCount: 6, control: linkItem, defaultValue: DEFAULTS.socials },
    displayFont: { type: ControlType.Font, title: "Display Font", controls: "extended", defaultFontType: "sans-serif", displayFontSize: false, displayTextAlignment: false, defaultValue: { letterSpacing: "-0.035em", lineHeight: "1em" } },
    textFont: { type: ControlType.Font, title: "Text Font", controls: "extended", defaultFontType: "sans-serif", displayFontSize: false, displayTextAlignment: false },
    linkSize: { type: ControlType.Number, title: "Link Size", defaultValue: DEFAULTS.linkSize, min: 24, max: 140, step: 1, unit: "px", description: "Size of the menu links at 1200px wide. They scale with the component." },
    panelColor: { type: ControlType.Color, title: "Panel", defaultValue: DEFAULTS.panelColor },
    inkColor: { type: ControlType.Color, title: "Ink", defaultValue: DEFAULTS.inkColor },
    mutedColor: { type: ControlType.Color, title: "Muted", defaultValue: DEFAULTS.mutedColor },
    accentColor: { type: ControlType.Color, title: "Accent", defaultValue: DEFAULTS.accentColor },
    accentTextColor: { type: ControlType.Color, title: "On Accent", defaultValue: DEFAULTS.accentTextColor },
    heroTextColor: { type: ControlType.Color, title: "On Page", defaultValue: DEFAULTS.heroTextColor, description: "The logo, button and hero text over the page while the menu is closed." },
    tilt: { type: ControlType.Number, title: "Tilt", defaultValue: DEFAULTS.tilt, min: 0, max: 20, step: 0.5, unit: "°", description: "How far the page leans back when the menu opens." },
    cardRadius: { type: ControlType.Number, title: "Radius", defaultValue: DEFAULTS.cardRadius, min: 0, max: 60, step: 1, unit: "px" },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: DEFAULTS.gap, min: 0, max: 80, step: 1, unit: "px", description: "Space around the page card while open." },
    peek: { type: ControlType.Number, title: "Peek", defaultValue: DEFAULTS.peek, min: 40, max: 400, step: 4, unit: "px", description: "The least of the page that stays visible below a tall menu." },
    dim: { type: ControlType.Number, title: "Dim", defaultValue: DEFAULTS.dim, min: 0, max: 0.9, step: 0.01, description: "How much the page darkens while the menu is open." },
    transition: { type: ControlType.Transition, title: "Transition", defaultValue: DEFAULTS.transition },
    openOnCanvas: { type: ControlType.Boolean, title: "Open on Canvas", defaultValue: DEFAULTS.openOnCanvas, description: "Shows the open menu on the canvas so you can style it. Preview and the live site always start closed." },
    closeOnNavigate: { type: ControlType.Boolean, title: "Close on Click", defaultValue: DEFAULTS.closeOnNavigate, description: "Closes the menu when a link is clicked, useful for links to sections on the same page." },
})
