import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useReducedMotion } from "framer-motion"

type Logo = {
    name: string
    image?: { src?: string; srcSet?: string; alt?: string }
    icon?: string
    color?: string
}

interface Props {
    logos: Logo[]
    columns: number
    rows: number
    tileHeight: number
    phoneColumns: number
    phoneRows: number
    phoneTileHeight: number
    interval: number
    order: "wave" | "random"
    spotlight: boolean
    radius: number
    accent: string
    theme: "dark" | "light"
    font: CSSProperties
    imageHeight: number
    gates: boolean
    animate: boolean
    idle: number
    style?: CSSProperties
}

const ICONS: Record<string, string> = {
    ring: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="3.2"/>',
    sun: '<circle cx="12" cy="12" r="5" fill="currentColor"/><g stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/></g>',
    hex: '<path d="M12 2l8.7 5v10L12 22l-8.7-5V7z" fill="currentColor"/>',
    wave: '<path d="M2 9c3-4 6 4 10 0s7 4 10 0M2 16c3-4 6 4 10 0s7 4 10 0" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
    leaf: '<path d="M4 20C4 9 10 3 21 3c0 11-6 17-17 17z" fill="currentColor"/>',
    bars: '<rect x="3" y="11" width="4" height="10" rx="1" fill="currentColor"/><rect x="10" y="6" width="4" height="15" rx="1" fill="currentColor"/><rect x="17" y="2" width="4" height="19" rx="1" fill="currentColor"/>',
    diamond: '<path d="M12 2l10 10-10 10L2 12z" fill="currentColor"/>',
    arch: '<path d="M3 21V12a9 9 0 0118 0v9h-5v-9a4 4 0 00-8 0v9z" fill="currentColor"/>',
    dots: '<circle cx="6" cy="6" r="3.2" fill="currentColor"/><circle cx="18" cy="6" r="3.2" fill="currentColor"/><circle cx="6" cy="18" r="3.2" fill="currentColor"/><circle cx="18" cy="18" r="3.2" fill="currentColor"/>',
    bolt: '<path d="M13 1L4 14h6l-1 9 9-13h-6z" fill="currentColor"/>',
    squares: '<rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor"/><rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor"/><rect x="13" y="3" width="8" height="8" rx="4" fill="currentColor" opacity=".55"/>',
    triangle: '<path d="M12 3l10 18H2z" fill="currentColor"/>',
    moon: '<path d="M20 15A9 9 0 119 4a7 7 0 0011 11z" fill="currentColor"/>',
}

const SAMPLES: Logo[] = [
    ["Kovra", "ring", "#FF7A45"], ["Lumio", "sun", "#FFD24A"], ["Halvex", "hex", "#6EE7B7"], ["Nordlys", "wave", "#7DD3FC"],
    ["Brindle", "leaf", "#F9A8D4"], ["Oakvane", "bars", "#C4B5FD"], ["Quilla", "diamond", "#FDBA74"], ["Mesaro", "arch", "#A7F3D0"],
    ["Tidewell", "wave", "#93C5FD"], ["Fernhaus", "leaf", "#86EFAC"], ["Stratum", "bars", "#FCA5A5"], ["Pellet", "dots", "#FDE68A"],
    ["Arcadia", "arch", "#F0ABFC"], ["Volta", "bolt", "#FFB224"], ["Cobalt&Co", "squares", "#60A5FA"], ["Juniper", "leaf", "#4ADE80"],
    ["Orrery", "ring", "#FDE047"], ["Pinemark", "triangle", "#34D399"], ["Sable", "moon", "#E5E7EB"], ["Hatchly", "hex", "#FB923C"],
    ["Ondo", "dots", "#38BDF8"], ["Marlow", "diamond", "#F472B6"], ["Quarry", "squares", "#A3E635"], ["Fieldnote", "triangle", "#FBBF24"],
].map(([name, icon, color]) => ({ name, icon, color }))

const THEMES = {
    dark: { board: "#090807", a: "#1B1915", b: "#13110E", mute: "#77705F", gate: "#5F594F", seam: "rgba(0,0,0,.55)", hair: "rgba(255,255,255,.06)", rivet: "#2B2822", shadow: "0 30px 60px -20px rgba(0,0,0,.8)" },
    light: { board: "#E7E2D8", a: "#FFFFFF", b: "#F3EFE7", mute: "#A39C8E", gate: "#B4AD9F", seam: "rgba(0,0,0,.10)", hair: "rgba(0,0,0,.07)", rivet: "#D8D2C6", shadow: "0 30px 60px -30px rgba(40,30,10,.35)" },
}

const CSS = `
@property --fw-lit { syntax: "<number>"; inherits: true; initial-value: 0; }
@keyframes fw-top { from { transform: rotateX(0deg); filter: brightness(1) } to { transform: rotateX(-90deg); filter: brightness(.45) } }
@keyframes fw-bot { 0% { transform: rotateX(90deg); filter: brightness(1.5) } 70% { transform: rotateX(-10deg); filter: brightness(1) } 100% { transform: rotateX(0deg) } }
@keyframes fw-in { from { opacity: 0; transform: translateY(16px); filter: blur(6px) } to { opacity: 1; transform: none; filter: none } }
@keyframes fw-fade { from { opacity: 0 } to { opacity: 1 } }
`

const FLIP_MS = 620

/**
 * Flapwall: a split-flap logo board.
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1104
 */
export default function Flapwall(props: Props) {
    const { columns, rows, tileHeight, phoneColumns, phoneRows, phoneTileHeight, interval, order, spotlight, radius, accent, theme, font, imageHeight, gates, animate, idle = 0.3, style } = props
    const logos = props.logos?.length ? props.logos : SAMPLES
    const t = THEMES[theme] || THEMES.dark
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const reduced = useReducedMotion()
    const motion = animate && !reduced && !isCanvas

    const root = useRef<HTMLDivElement>(null)
    const board = useRef<HTMLDivElement>(null)
    const tiles = useRef<(HTMLDivElement | null)[]>([])
    const [narrow, setNarrow] = useState(false)
    const [entered, setEntered] = useState(!motion)
    const visible = useRef(true)

    const cols = Math.max(1, Math.round(narrow ? phoneColumns : columns))
    const count = cols * Math.max(1, Math.round(narrow ? phoneRows : rows))
    const height = narrow ? phoneTileHeight : tileHeight

    const [cur, setCur] = useState<number[]>(() => Array.from({ length: count }, (_, i) => i % logos.length))
    const [flip, setFlip] = useState<{ to: number[]; delays: number[]; gen: number } | null>(null)
    const ptr = useRef(count)
    const curRef = useRef(cur)
    curRef.current = cur

    // Reset the board when the tile count or the logo pool changes.
    useEffect(() => {
        setCur(Array.from({ length: count }, (_, i) => i % logos.length))
        setFlip(null)
        ptr.current = count
    }, [count, logos.length])

    // Narrow layout below 600px of component width.
    useEffect(() => {
        const el = root.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(([e]) => setNarrow(e.contentRect.width < 600))
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Entrance once in view, and pause rotation while off screen.
    useEffect(() => {
        const el = root.current
        if (!el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(([e]) => {
            visible.current = e.isIntersecting
            if (e.isIntersecting) setEntered(true)
        }, { threshold: 0.15 })
        io.observe(el)
        return () => io.disconnect()
    }, [])

    // Rotation loop.
    useEffect(() => {
        if (isCanvas || logos.length <= 1) return
        let done: ReturnType<typeof setTimeout> | undefined
        let gen = 0
        const tick = () => {
            if (!visible.current || document.hidden) return
            const n = curRef.current.length
            const to = curRef.current.map((_, i) => (ptr.current + i) % logos.length)
            ptr.current = (ptr.current + n) % logos.length
            const delays = to.map((_, i) => (order === "random" ? Math.random() * 500 : (i % cols) * 70 + Math.floor(i / cols) * 50))
            setFlip({ to, delays, gen: ++gen })
            done = setTimeout(() => { setCur(to); setFlip(null) }, Math.max(...delays) + (motion ? FLIP_MS : 320) + 40)
        }
        const id = setInterval(tick, Math.max(1.5, interval) * 1000)
        return () => { clearInterval(id); if (done) clearTimeout(done) }
    }, [isCanvas, logos.length, interval, order, cols, motion])

    // Spotlight: tiles near the pointer show their brand colour.
    const hoverable = typeof window !== "undefined" && window.matchMedia?.("(hover: hover)").matches
    const light = (x: number | null, y: number | null) => {
        const b = board.current
        if (!b) return
        if (x === null || y === null) {
            b.style.setProperty("--fw-glow", "0")
            tiles.current.forEach((el) => el?.style.setProperty("--fw-lit", String(idle)))
            return
        }
        const r = b.getBoundingClientRect()
        b.style.setProperty("--fw-sx", `${x - r.left}px`)
        b.style.setProperty("--fw-sy", `${y - r.top}px`)
        b.style.setProperty("--fw-glow", "1")
        tiles.current.forEach((el) => {
            if (!el) return
            const c = el.getBoundingClientRect()
            const d = Math.hypot(c.left + c.width / 2 - x, c.top + c.height / 2 - y)
            el.style.setProperty("--fw-lit", Math.max(idle, 1 - d / radius).toFixed(3))
        })
    }
    const frame = useRef(0)
    const onMove = (e: React.PointerEvent) => {
        if (!spotlight || e.pointerType !== "mouse") return
        const { clientX, clientY } = e
        cancelAnimationFrame(frame.current)
        frame.current = requestAnimationFrame(() => light(clientX, clientY))
    }
    useEffect(() => () => cancelAnimationFrame(frame.current), [])

    // On canvas, light one spot so the brand colours are visible while editing.
    useEffect(() => {
        if (!isCanvas || !spotlight) return
        const id = requestAnimationFrame(() => {
            const r = board.current?.getBoundingClientRect()
            if (r) light(r.left + r.width * 0.42, r.top + r.height * 0.5)
        })
        return () => cancelAnimationFrame(id)
    }, [isCanvas, spotlight, count, radius])

    const touchLit = !hoverable || !spotlight ? Math.max(idle, 0.85) : idle

    const renderLogo = (l: Logo) => {
        if (l.image?.src)
            return (
                <img src={l.image.src} srcSet={l.image.srcSet} alt="" draggable={false}
                    style={{ maxHeight: imageHeight, maxWidth: "72%", objectFit: "contain", filter: "grayscale(calc(1 - var(--fw-lit)))", opacity: "calc(.55 + var(--fw-lit) * .45)" }} />
            )
        const color = l.color || accent
        return (
            <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 21, letterSpacing: "-0.02em", whiteSpace: "nowrap", ...font, fontWeight: Number(font?.fontWeight) > 400 ? font.fontWeight : 600,
                color: `color-mix(in oklab, ${color} calc(var(--fw-lit) * 100%), ${t.mute})`,
                textShadow: theme === "dark" ? `0 0 calc(max(0, var(--fw-lit) - ${idle}) * 22px) color-mix(in oklab, ${color} calc(max(0, var(--fw-lit) - ${idle}) * 80%), transparent)` : "none" }}>
                {l.icon && ICONS[l.icon] && <svg viewBox="0 0 24 24" width={22} height={22} style={{ flex: "none" }} dangerouslySetInnerHTML={{ __html: ICONS[l.icon] }} />}
                {l.name}
            </div>
        )
    }

    const surface = `linear-gradient(${t.a}, ${t.b})`
    const half = (pos: "top" | "bottom", logo: Logo, extra?: CSSProperties) => (
        <div aria-hidden style={{ position: "absolute", left: 0, right: 0, height: "50%", overflow: "hidden", backfaceVisibility: "hidden", [pos]: 0,
            borderRadius: pos === "top" ? "12px 12px 0 0" : "0 0 12px 12px", transformOrigin: pos === "top" ? "50% 100%" : "50% 0", ...extra }}>
            <div style={{ position: "absolute", left: 0, right: 0, height: "200%", [pos]: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{renderLogo(logo)}</div>
        </div>
    )

    return (
        <div ref={root} style={{ ...style, position: "relative" }} onPointerMove={onMove} onPointerLeave={() => spotlight && light(null, null)}>
            <style>{CSS}</style>
            <div ref={board} style={{ position: "relative", background: t.board, borderRadius: 22, padding: 14,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,.05), inset 0 0 0 1px ${t.hair}, ${t.shadow}` }}>
                <div aria-hidden style={{ position: "absolute", inset: 0, borderRadius: 22, pointerEvents: "none", opacity: "var(--fw-glow, 0)" as any, transition: "opacity .4s",
                    background: `radial-gradient(260px circle at var(--fw-sx, 50%) var(--fw-sy, 50%), color-mix(in oklab, ${accent} 16%, transparent), transparent 70%)` }} />
                <div role="list" style={{ position: "relative", display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 8 }}>
                    {Array.from({ length: count }, (_, i) => {
                        const c = logos[cur[i] ?? i % logos.length] || logos[0]
                        const to = flip ? logos[flip.to[i]] : undefined
                        const flipping = !!to && to !== c
                        const d = flip?.delays[i] ?? 0
                        const ease = (name: string, ms: number, delay: number, curve: string) => `${name} ${ms}ms ${curve} ${delay}ms both`
                        return (
                            <div key={i} role="listitem" aria-label={(to || c).name} ref={(el) => { tiles.current[i] = el }}
                                style={{ ["--fw-lit" as any]: touchLit, position: "relative", height, borderRadius: 12, perspective: 700, background: surface, transition: "--fw-lit .25s",
                                    boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${accent} calc(max(0, var(--fw-lit) - ${idle}) / ${Math.max(0.01, 1 - idle)} * 60%), ${t.hair}), inset 0 1px 0 rgba(255,255,255,.05), 0 8px 16px -8px rgba(0,0,0,${theme === "dark" ? 0.9 : 0.12})`,
                                    animation: motion ? (entered ? ease("fw-in", 600, i * 50, "cubic-bezier(.22,1,.36,1)") : "none") : undefined,
                                    opacity: motion && !entered ? 0 : undefined }}>
                                {gates && <span aria-hidden style={{ position: "absolute", left: 10, top: 9, zIndex: 6, font: "500 9px/1 ui-monospace, SFMono-Regular, Menlo, monospace", letterSpacing: ".1em", color: t.gate }}>{String.fromCharCode(65 + Math.floor(i / cols))}{(i % cols) + 1}</span>}
                                {flipping && motion ? (
                                    <>
                                        {half("top", to!)}
                                        {half("bottom", c, { filter: "brightness(.86)" })}
                                        {half("top", c, { zIndex: 3, background: surface, backgroundSize: "100% 200%", backgroundPosition: "0 0", animation: ease("fw-top", 260, d, "cubic-bezier(.55,0,.9,.45)") })}
                                        {half("bottom", to!, { zIndex: 3, background: surface, backgroundSize: "100% 200%", backgroundPosition: "0 100%", transform: "rotateX(90deg)", animation: ease("fw-bot", 360, d + 260, "cubic-bezier(.2,.7,.3,1)") })}
                                    </>
                                ) : (
                                    <div key={flipping ? `f${flip!.gen}` : "s"} style={{ position: "absolute", inset: 0, animation: flipping ? ease("fw-fade", 300, d * 0.4, "ease") : undefined }}>
                                        {half("top", flipping ? to! : c)}
                                        {half("bottom", flipping ? to! : c, { filter: "brightness(.86)" })}
                                    </div>
                                )}
                                <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, zIndex: 5, background: t.seam, boxShadow: "0 1px 0 rgba(255,255,255,.035)" }}>
                                    <i style={{ position: "absolute", top: -2.5, left: -1, width: 6, height: 6, borderRadius: "50%", background: t.rivet }} />
                                    <i style={{ position: "absolute", top: -2.5, right: -1, width: 6, height: 6, borderRadius: "50%", background: t.rivet }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(Flapwall, {
    logos: {
        type: ControlType.Array,
        title: "Logos",
        maxCount: 60,
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name", defaultValue: "Brand" },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                icon: { type: ControlType.Enum, title: "Icon", options: ["", ...Object.keys(ICONS)], optionTitles: ["None", ...Object.keys(ICONS).map((k) => k[0].toUpperCase() + k.slice(1))], defaultValue: "ring" },
                color: { type: ControlType.Color, title: "Color", defaultValue: "#FFB224" },
            },
        },
        defaultValue: SAMPLES,
    },
    columns: { type: ControlType.Number, title: "Columns", min: 1, max: 8, step: 1, displayStepper: true, defaultValue: 6 },
    rows: { type: ControlType.Number, title: "Rows", min: 1, max: 4, step: 1, displayStepper: true, defaultValue: 2 },
    tileHeight: { type: ControlType.Number, title: "Tile Height", min: 64, max: 240, unit: "px", defaultValue: 132 },
    phoneColumns: { type: ControlType.Number, title: "Phone Cols", min: 1, max: 4, step: 1, displayStepper: true, defaultValue: 2, description: "Used below 600px wide." },
    phoneRows: { type: ControlType.Number, title: "Phone Rows", min: 1, max: 6, step: 1, displayStepper: true, defaultValue: 4 },
    phoneTileHeight: { type: ControlType.Number, title: "Phone Height", min: 56, max: 200, unit: "px", defaultValue: 104 },
    interval: { type: ControlType.Number, title: "Interval", min: 1.5, max: 10, step: 0.5, unit: "s", defaultValue: 3 },
    order: { type: ControlType.Enum, title: "Order", options: ["wave", "random"], optionTitles: ["Wave", "Random"], displaySegmentedControl: true, defaultValue: "wave" },
    spotlight: { type: ControlType.Boolean, title: "Spotlight", defaultValue: true },
    radius: { type: ControlType.Number, title: "Radius", min: 80, max: 600, unit: "px", defaultValue: 240, hidden: (p: Props) => !p.spotlight },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#FFB224" },
    theme: { type: ControlType.Enum, title: "Theme", options: ["dark", "light"], optionTitles: ["Dark", "Light"], displaySegmentedControl: true, defaultValue: "dark" },
    font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { variant: "Semibold", fontSize: 21, letterSpacing: "-0.02em", lineHeight: "1em" } as any },
    imageHeight: { type: ControlType.Number, title: "Image Height", min: 12, max: 80, unit: "px", defaultValue: 28 },
    idle: { type: ControlType.Number, title: "Idle Color", min: 0, max: 1, step: 0.05, defaultValue: 0.3, description: "How much brand colour logos keep outside the spotlight." },
    gates: { type: ControlType.Boolean, title: "Gate Labels", defaultValue: true },
    animate: { type: ControlType.Boolean, title: "Animate", defaultValue: true, description: "Off: logos crossfade instead of flipping. Reduced-motion visitors get the same." },
})
