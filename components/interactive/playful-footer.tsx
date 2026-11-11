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


type ImageValue = { src: string; alt?: string }
type Decoration = {
    name?: string
    kind?: "image" | "badge"
    image?: ImageValue
    text?: string
    color?: string
    ink?: string
    x?: number
    y?: number
    size?: number
    rotation?: number
    layer?: "front" | "back"
    mobileX?: number
    mobileY?: number
    mobileSize?: number
    hideOnMobile?: boolean
    response?: number
}
interface NudgeFooterProps {
    logoSettings?: { useLogo?: boolean; logo?: ImageValue }
    layoutSettings?: { aspectRatio?: number; mobileRatio?: number; shadow?: boolean }
    motionSettings?: { enabled?: boolean; radius?: number; distance?: number; stiffness?: number; damping?: number; twist?: number }
    wordmark?: string
    logo?: ImageValue
    useLogo?: boolean
    font?: React.CSSProperties
    color?: string
    aspectRatio?: number
    mobileRatio?: number
    decorations?: Decoration[]
    enabled?: boolean
    radius?: number
    distance?: number
    stiffness?: number
    damping?: number
    twist?: number
    shadow?: boolean
    style?: React.CSSProperties
}

const FRUIT = {
    lime: "https://framerusercontent.com/images/zf3p2YtdYvNjgQVP9QsSY26bTTs.png",
    blackberry: "https://framerusercontent.com/images/soDF4CgD8xr1iJWfCqsEhZqpUQ.png",
    cherries: "https://framerusercontent.com/images/vn7N5s6lo4EyCkWPvJbLd5lpRk.png",
    blueberry: "https://framerusercontent.com/images/9rw5N16JmhnigyccaacBNchr2A4.png",
    strawberry: "https://framerusercontent.com/images/XL9Cvv9IQHEhP0ytOYu6bwfynEg.png",
}
const DEFAULT_ITEMS: Decoration[] = [
    { name: "Lime", kind: "image", image: { src: FRUIT.lime }, x: 9, y: 66, size: 21, rotation: -8, layer: "back", mobileX: 6, mobileY: 64, mobileSize: 30, response: 0.85 },
    { name: "Blackberry", kind: "image", image: { src: FRUIT.blackberry }, x: 21, y: 87, size: 12, rotation: 18, layer: "front", mobileX: 17, mobileY: 84, mobileSize: 18, response: 1 },
    { name: "Cherries", kind: "image", image: { src: FRUIT.cherries }, x: 47, y: 35, size: 28, rotation: -12, layer: "back", mobileX: 51, mobileY: 31, mobileSize: 44, response: 1.1 },
    { name: "Blueberry", kind: "image", image: { src: FRUIT.blueberry }, x: 65, y: 70, size: 10, rotation: 10, layer: "front", mobileX: 65, mobileY: 76, mobileSize: 16, response: 1.25 },
    { name: "Strawberry", kind: "image", image: { src: FRUIT.strawberry }, x: 89, y: 76, size: 19, rotation: 8, layer: "back", mobileX: 95, mobileY: 70, mobileSize: 32, response: 0.95 },
    { name: "Small nudge", kind: "badge", text: "SMALL\nNUDGE.\nBIG JOY.", color: "#9B158B", ink: "#FFFFFF", x: 9, y: 73, size: 9, rotation: -12, layer: "front", mobileX: 10, mobileY: 66, mobileSize: 15, response: 1.15 },
    { name: "Feel good", kind: "badge", text: "FEEL\nGOOD.\nLOOK GOOD.", color: "#F6ABF1", ink: "#841347", x: 27, y: 29, size: 9, rotation: 11, layer: "front", mobileX: 21, mobileY: 21, mobileSize: 14, response: 1.2 },
    { name: "Stay playful", kind: "badge", text: "STAY\nPLAYFUL", color: "#FFCA67", ink: "#7D4215", x: 88, y: 60, size: 8.5, rotation: 12, layer: "front", mobileX: 87, mobileY: 50, mobileSize: 14, response: 1.1 },
]

const FLOWER = Array.from({ length: 144 }, (_, i) => {
    const a = i / 144 * Math.PI * 2
    const r = 44 + 5 * Math.cos(a * 10)
    return `${i ? "L" : "M"}${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`
}).join(" ") + " Z"
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
const numeric = (n: number | undefined, fallback: number) => Number.isFinite(n) ? n! : fallback

/**
 * Interactive wordmark with independently repelled decorations.
 * Place inside a native footer; resize its width to fit your layout.
 * @framerDisableUnlink
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 460
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function NudgeFooter(props: NudgeFooterProps) {
    const {
        wordmark = "Nudge", logo, useLogo = false,
        font: selectedFont = {},
        color = "#EC19B2", aspectRatio = 2.6, mobileRatio = 1.65,
        decorations = DEFAULT_ITEMS, enabled = true, radius = 190, distance = 120,
        stiffness = 115, damping = 15, twist = 17, shadow = false, style,
    } = { ...props, ...props.logoSettings, ...props.layoutSettings, ...props.motionSettings }
    const font: React.CSSProperties = { fontFamily: "Georgia, serif", fontWeight: 700, letterSpacing: "-0.065em", ...selectedFont }
    const isStatic = useIsStaticRenderer()
    const scopeId = React.useId()
    const root = React.useRef<HTMLDivElement>(null)
    const measure = React.useRef<HTMLSpanElement>(null)
    const elements = React.useRef<Array<HTMLDivElement | null>>([])
    const [fontSize, setFontSize] = React.useState<number | null>(null)
    const [compact, setCompact] = React.useState(false)
    const [failedLogo, setFailedLogo] = React.useState<string | null>(null)
    const items = React.useMemo(() => (decorations ?? []).slice(0, 16).map((item, index) => {
        // Framer intentionally omits ResponsiveImage defaults from array controls.
        const demo = DEFAULT_ITEMS.find(original => original.name === item.name) ?? DEFAULT_ITEMS[index]
        return item.kind !== "badge" && !item.image?.src && demo?.kind === "image" && demo.image
            ? { ...item, image: demo.image } : item
    }), [decorations])
    const fixedHeight = typeof style?.height === "number" || (typeof style?.height === "string" && style.height.trim() !== "" && !["auto", "fit-content", "max-content", "min-content"].includes(style.height.trim()))

    React.useEffect(() => {
        const host = root.current
        if (!host || !measure.current) return
        let disposed = false
        const resize = () => {
            if (disposed || !root.current || !measure.current) return
            const width = root.current.clientWidth
            React.startTransition(() => setCompact(width <= 600))
            // Layout widths stay consistent when Framer zooms the canvas with a transform.
            const natural = measure.current.offsetWidth
            if (width > 0 && natural > 0) {
                const size = width * 0.96 / natural * 100
                React.startTransition(() => setFontSize(size))
            }
        }
        resize()
        const observer = new ResizeObserver(resize)
        observer.observe(host)
        observer.observe(measure.current)
        document.fonts?.ready.then(resize)
        return () => { disposed = true; observer.disconnect() }
    }, [wordmark, font.fontFamily, font.fontWeight, font.fontStyle, font.letterSpacing])

    React.useEffect(() => {
        const host = root.current
        if (!host || isStatic || !enabled || typeof window === "undefined") return
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
        const fine = window.matchMedia("(hover: hover) and (pointer: fine)")
        const bodies = items.map(() => ({ x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0 }))
        let pointer: { x: number; y: number } | null = null
        let raf = 0, last = 0, inView = true, disposed = false
        const allowed = () => !disposed && !reduced.matches && fine.matches && inView && !document.hidden
        const paint = (i: number) => {
            const body = bodies[i]
            const node = elements.current[i]
            if (node) node.style.transform = `translate(-50%, -50%) translate3d(${body.x.toFixed(3)}px,${body.y.toFixed(3)}px,0) rotate(${numeric(items[i].rotation, 0) + body.r}deg)`
        }
        const reset = () => {
            cancelAnimationFrame(raf); raf = 0; last = 0; pointer = null
            bodies.forEach((b, i) => { b.x = b.y = b.r = b.vx = b.vy = b.vr = 0; paint(i) })
        }
        const tick = (now: number) => {
            raf = 0
            if (!allowed()) { reset(); return }
            const dt = last ? clamp((now - last) / 1000, 1 / 240, 1 / 30) : 1 / 60
            last = now
            const width = host.clientWidth, height = host.clientHeight
            const mobile = width <= 600
            const scale = clamp(width / 1200, 0.4, 1.5)
            let moving = false
            bodies.forEach((b, i) => {
                const item = items[i]
                let tx = 0, ty = 0, tr = 0
                if (pointer && !(mobile && item.hideOnMobile)) {
                    const x = width * numeric(mobile ? item.mobileX ?? item.x : item.x, 50) / 100
                    const y = height * numeric(mobile ? item.mobileY ?? item.y : item.y, 50) / 100
                    let dx = x - pointer.x, dy = y - pointer.y
                    const len = Math.hypot(dx, dy)
                    const range = Math.max(1, radius * scale)
                    if (len < range) {
                        if (len < 0.1) { dx = Math.cos(i * 2.4); dy = Math.sin(i * 2.4) }
                        const divisor = len < 0.1 ? 1 : len
                        const force = Math.pow(1 - len / range, 1.35) * distance * scale * clamp(numeric(item.response, 1), 0, 3)
                        tx = dx / divisor * force; ty = dy / divisor * force
                        tr = clamp((tx - ty * 0.25) / Math.max(1, distance * scale), -1, 1) * twist
                    }
                }
                const spring = clamp(stiffness, 20, 300), friction = Math.exp(-clamp(damping, 5, 40) * dt)
                b.vx = (b.vx + (tx - b.x) * spring * dt) * friction
                b.vy = (b.vy + (ty - b.y) * spring * dt) * friction
                b.vr = (b.vr + (tr - b.r) * spring * dt) * friction
                b.x += b.vx * dt; b.y += b.vy * dt; b.r += b.vr * dt
                if (Math.abs(tx - b.x) + Math.abs(ty - b.y) + Math.abs(tr - b.r) + Math.abs(b.vx) + Math.abs(b.vy) + Math.abs(b.vr) > 0.08) moving = true
                else { b.x = tx; b.y = ty; b.r = tr; b.vx = b.vy = b.vr = 0 }
                paint(i)
            })
            if (moving) raf = requestAnimationFrame(tick)
            else last = 0
        }
        const wake = () => { if (allowed() && !raf) { last = 0; raf = requestAnimationFrame(tick) } }
        const move = (event: PointerEvent) => {
            if (event.pointerType !== "mouse" && event.pointerType !== "pen") return
            const rect = host.getBoundingClientRect()
            if (rect.width <= 0 || rect.height <= 0) return
            pointer = { x: (event.clientX - rect.left) * host.clientWidth / rect.width, y: (event.clientY - rect.top) * host.clientHeight / rect.height }
            wake()
        }
        const leave = () => { pointer = null; wake() }
        const preference = () => { reset() }
        const viewport = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; if (!inView) reset() })
        viewport.observe(host)
        const resize = new ResizeObserver(reset)
        resize.observe(host)
        host.addEventListener("pointermove", move)
        host.addEventListener("pointerleave", leave)
        host.addEventListener("pointercancel", leave)
        window.addEventListener("blur", reset)
        document.addEventListener("visibilitychange", reset)
        reduced.addEventListener("change", preference)
        fine.addEventListener("change", preference)
        return () => {
            disposed = true; reset(); viewport.disconnect(); resize.disconnect()
            host.removeEventListener("pointermove", move); host.removeEventListener("pointerleave", leave); host.removeEventListener("pointercancel", leave)
            window.removeEventListener("blur", reset); document.removeEventListener("visibilitychange", reset)
            reduced.removeEventListener("change", preference); fine.removeEventListener("change", preference)
        }
    }, [isStatic, enabled, items, radius, distance, stiffness, damping, twist])

    return <div ref={root} className="nudge-footer-root" data-nudge-footer="" data-nudge-scope={scopeId} style={{
        ...style, width: "100%", height: fixedHeight ? style?.height : "auto",
        position: "relative", aspectRatio: fixedHeight ? undefined : compact ? mobileRatio : aspectRatio,
        background: "transparent", overflow: "visible", isolation: "isolate",
    }}>
        <style>{`
            [data-nudge-scope="${scopeId}"] { container-type:inline-size; container-name:nudge-footer; }
            [data-nudge-scope="${scopeId}"] .nudge-piece { position:absolute; left:var(--nx); top:var(--ny); width:var(--ns); pointer-events:none; }
            [data-nudge-scope="${scopeId}"] .nudge-piece img { display:block; width:100%; height:auto; user-select:none; }
            [data-nudge-scope="${scopeId}"] .nudge-badge { display:block; width:100%; aspect-ratio:1; position:relative; }
            [data-nudge-scope="${scopeId}"] .nudge-badge-copy { position:absolute; inset:16%; display:flex; align-items:center; justify-content:center; text-align:center; font-family:Arial,sans-serif; font-weight:800; font-size:var(--nbf); line-height:1.04; letter-spacing:-0.035em; white-space:pre-line; }
            @container nudge-footer (max-width:600px) {
                [data-nudge-scope="${scopeId}"] .nudge-piece { left:var(--nmx); top:var(--nmy); width:var(--nms); }
                [data-nudge-scope="${scopeId}"] .nudge-mobile-hidden { display:none; }
                [data-nudge-scope="${scopeId}"] .nudge-badge-copy { font-size:var(--nmbf); }
            }
            @media (prefers-reduced-motion:reduce) { [data-nudge-scope="${scopeId}"] .nudge-piece { will-change:auto; } }
        `}</style>
        <div aria-hidden="true" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", pointerEvents: "none" }}>
            <span ref={measure} style={{ ...font, position: "absolute", display: "block", visibility: "hidden", whiteSpace: "pre", fontSize: 100, lineHeight: 1, width: "max-content" }}>{wordmark || "Nudge"}</span>
        </div>
        {useLogo && logo?.src && failedLogo !== logo.src ? <img onError={() => setFailedLogo(logo.src)} src={logo.src} alt={logo.alt || wordmark} draggable={false} style={{ position: "absolute", width: "96%", height: "66%", objectFit: "contain", bottom: "1%", left: "2%", zIndex: 1, pointerEvents: "none" }} /> :
            <div data-nudge-wordmark="" style={{ ...font, position: "absolute", bottom: "0%", left: "50%", transform: "translateX(-50%)", color, fontSize: fontSize ?? "33cqw", whiteSpace: "pre", lineHeight: 1.2, width: "max-content", zIndex: 1, pointerEvents: "none", userSelect: "none" }}>{wordmark || "Nudge"}</div>}
        {items.map((item, i) => {
            const size = numeric(item.size, 12)
            const vars = {
                "--nx": `${numeric(item.x, 50)}%`, "--ny": `${numeric(item.y, 50)}%`, "--ns": `${size}%`,
                "--nmx": `${numeric(item.mobileX ?? item.x, 50)}%`, "--nmy": `${numeric(item.mobileY ?? item.y, 50)}%`, "--nms": `${numeric(item.mobileSize ?? item.size, 12)}%`,
                "--nbf": `${size * 0.14}cqw`, "--nmbf": `${numeric(item.mobileSize ?? item.size, 12) * 0.14}cqw`,
            } as React.CSSProperties
            return <div key={i} ref={el => { elements.current[i] = el }} className={`nudge-piece${item.hideOnMobile ? " nudge-mobile-hidden" : ""}`} aria-hidden="true" data-nudge-piece={item.name || i} style={{
                ...vars, zIndex: item.layer === "back" ? 0 : 2, transform: `translate(-50%,-50%) rotate(${numeric(item.rotation, 0)}deg)`,
                filter: shadow ? "drop-shadow(7px 10px 4px rgba(69,16,42,.15))" : undefined,
            }}>
                {item.kind === "badge" ? <div className="nudge-badge">
                    <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", display: "block" }}><path d={FLOWER} fill={item.color || "#FFCA67"} /></svg>
                    <div className="nudge-badge-copy" style={{ color: item.ink || "#72163C" }}>{item.text || "STAY\nPLAYFUL"}</div>
                </div> : item.image?.src ? <img src={item.image.src} srcSet={(item.image as any).srcSet} sizes={`${size}vw`} alt="" draggable={false} /> : null}
            </div>
        })}
    </div>
}

addPropertyControls(NudgeFooter, {
    wordmark: { type: ControlType.String, title: "Wordmark", defaultValue: "Nudge" },
    color: { type: ControlType.Color, title: "Color", defaultValue: "#EC19B2" },
    font: { type: ControlType.Font, title: "Font", description: "Wordmark typeface; text size fits automatically.", controls: "extended", defaultFontType: "serif", displayFontSize: false, defaultValue: { letterSpacing: "-0.065em", lineHeight: "0.9em" } },
    decorations: { type: ControlType.Array, title: "Decorations", description: "Cutouts and stickers. Position and size are % of the artwork.", maxCount: 16, defaultValue: DEFAULT_ITEMS, control: { type: ControlType.Object, controls: {
        name: { type: ControlType.String, title: "Name", defaultValue: "Decoration" },
        kind: { type: ControlType.Enum, title: "Type", options: ["image", "badge"], optionTitles: ["Image", "Sticker"], defaultValue: "image" },
        image: { type: ControlType.ResponsiveImage, title: "Cutout", description: "Leave blank to use the demo cutout for this slot.", hidden: p => p.kind === "badge" },
        text: { type: ControlType.String, title: "Sticker Text", displayTextArea: true, defaultValue: "STAY\nPLAYFUL", hidden: p => p.kind !== "badge" },
        color: { type: ControlType.Color, title: "Sticker Color", defaultValue: "#FFCA67", hidden: p => p.kind !== "badge" },
        ink: { type: ControlType.Color, title: "Sticker Ink", defaultValue: "#72163C", hidden: p => p.kind !== "badge" },
        x: { type: ControlType.Number, title: "X", description: "Desktop position. Use Mobile X at widths ≤600px.", min: -10, max: 110, step: 1, defaultValue: 50, unit: "%" },
        y: { type: ControlType.Number, title: "Y", description: "Desktop position. Use Mobile Y at widths ≤600px.", min: -10, max: 110, step: 1, defaultValue: 50, unit: "%" },
        size: { type: ControlType.Number, title: "Size", min: 3, max: 60, step: 0.5, defaultValue: 12, unit: "%" },
        rotation: { type: ControlType.Number, title: "Rotation", min: -180, max: 180, step: 1, defaultValue: 0, unit: "°" },
        layer: { type: ControlType.Enum, title: "Layer", options: ["back", "front"], optionTitles: ["Behind Wordmark", "Above Wordmark"], defaultValue: "front" },
        response: { type: ControlType.Number, title: "Response", min: 0, max: 2, step: 0.05, defaultValue: 1, description: "Movement multiplier: 0 = still, 1 = normal, 2 = stronger." },
        mobileX: { type: ControlType.Number, title: "Mobile X", description: "Horizontal center, % of artwork. Applies at widths ≤600px.", min: -100, max: 200, step: 0.5, defaultValue: 50, unit: "%" },
        mobileY: { type: ControlType.Number, title: "Mobile Y", description: "Vertical center, % of artwork. Applies at widths ≤600px.", min: -100, max: 200, step: 0.5, defaultValue: 50, unit: "%" },
        mobileSize: { type: ControlType.Number, title: "Mobile Size", min: 3, max: 80, step: 1, defaultValue: 18, unit: "%" },
        hideOnMobile: { type: ControlType.Boolean, title: "Hide on Mobile", defaultValue: false },
    } } },
    logoSettings: { type: ControlType.Object, title: "Logo", controls: {
    useLogo: { type: ControlType.Boolean, title: "Use Logo", defaultValue: false },
    logo: { type: ControlType.ResponsiveImage, title: "Logo", description: "Transparent image. Missing or failed images use the wordmark.", hidden: p => !p.useLogo },
    } },
    layoutSettings: { type: ControlType.Object, title: "Layout", controls: {
    aspectRatio: { type: ControlType.Number, title: "Ratio", min: 1.5, max: 5, step: 0.1, defaultValue: 2.6, description: "Width ÷ height. Fit Content only; higher = shorter." },
    mobileRatio: { type: ControlType.Number, title: "Mobile Ratio", min: 1, max: 3, step: 0.1, defaultValue: 1.65, description: "At ≤600px. Fit Content only; higher = shorter." },
    shadow: { type: ControlType.Boolean, title: "Extra Shadow", defaultValue: false, description: "Adds shadow to decorations, not the wordmark." },
    } },
    motionSettings: { type: ControlType.Object, title: "Motion", description: "[View Footer in Real Project](https://framer.link/AVGjxxi)", controls: {
    enabled: { type: ControlType.Boolean, title: "Cursor Nudge", defaultValue: true, description: "Preview with a mouse. Static on touch or reduced motion." },
    radius: { type: ControlType.Number, title: "Nudge Radius", min: 50, max: 400, step: 5, defaultValue: 190, unit: "px", description: "Cursor reach; scales with artwork width.", hidden: p => p.enabled === false },
    distance: { type: ControlType.Number, title: "Push Distance", min: 0, max: 250, step: 5, defaultValue: 120, unit: "px", description: "Push amount; scales with width and item Response.", hidden: p => p.enabled === false },
    stiffness: { type: ControlType.Number, title: "Spring", min: 20, max: 300, step: 5, defaultValue: 115, description: "Higher = faster, firmer return.", hidden: p => p.enabled === false },
    damping: { type: ControlType.Number, title: "Damping", min: 5, max: 40, step: 1, defaultValue: 15, description: "Higher = less bounce, quicker settling.", hidden: p => p.enabled === false },
    twist: { type: ControlType.Number, title: "Twist", min: 0, max: 45, step: 1, defaultValue: 17, unit: "°", description: "Maximum turn. 0 = no rotation.", hidden: p => p.enabled === false },
    } },
    useLogo: { type: ControlType.Boolean, title: "Use Logo", defaultValue: false, hidden: () => true },
    logo: { type: ControlType.ResponsiveImage, title: "Logo", hidden: () => true },
    aspectRatio: { type: ControlType.Number, title: "Ratio", min: 1.5, max: 5, step: 0.1, defaultValue: 2.6, description: "Width ÷ height. Fit Content only; higher = shorter.", hidden: () => true },
    mobileRatio: { type: ControlType.Number, title: "Mobile Ratio", min: 1, max: 3, step: 0.1, defaultValue: 1.65, description: "At ≤600px. Fit Content only; higher = shorter.", hidden: () => true },
    shadow: { type: ControlType.Boolean, title: "Extra Shadow", defaultValue: false, hidden: () => true },
    enabled: { type: ControlType.Boolean, title: "Cursor Nudge", defaultValue: true, description: "Preview with a mouse. Static on touch or reduced motion.", hidden: () => true },
    radius: { type: ControlType.Number, title: "Nudge Radius", min: 50, max: 400, step: 5, defaultValue: 190, unit: "px", description: "Cursor reach; scales with artwork width.", hidden: () => true },
    distance: { type: ControlType.Number, title: "Push Distance", min: 0, max: 250, step: 5, defaultValue: 120, unit: "px", description: "Push amount; scales with width and item Response.", hidden: () => true },
    stiffness: { type: ControlType.Number, title: "Spring", min: 20, max: 300, step: 5, defaultValue: 115, description: "Higher = faster, firmer return.", hidden: () => true },
    damping: { type: ControlType.Number, title: "Damping", min: 5, max: 40, step: 1, defaultValue: 15, description: "Higher = less bounce, quicker settling.", hidden: () => true },
    twist: { type: ControlType.Number, title: "Twist", min: 0, max: 45, step: 1, defaultValue: 17, unit: "°", description: "Maximum turn. 0 = no rotation.", hidden: () => true },
})
