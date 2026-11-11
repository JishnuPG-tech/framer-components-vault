// ─────────────────────────────────────────────────────────────
//  MARQUEE TICKER — by Mero Lab · merodigital.mx
//  Infinite scrolling band for Framer: text, images, logos and
//  SVG icons — mix them however you like. Free component.
//
//  Look for "← ADJUST" to find what's safe to tweak
//  (defaults, colors, sizes, spacing, speed).
// ─────────────────────────────────────────────────────────────
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


type ItemType = "text" | "image" | "svg"
type ImageValue = { src?: string; srcSet?: string; alt?: string } | string | undefined
type Item = {
    type?: ItemType
    text?: string
    image?: ImageValue
    svg?: string
    alt?: string
    link?: string
}

// Default font when the Font control is left empty  ← ADJUST
const DEFAULT_FONT: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontWeight: 600,
    fontSize: 20,
    letterSpacing: "0.02em",
    lineHeight: 1,
}

// Sample SVG used in the default items (a simple star)  ← ADJUST
const STAR_SVG =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="#000" d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z"/></svg>'

const DEFAULT_ITEMS: Item[] = [
    // ← ADJUST: default content shown when the component is dropped in
    { type: "text", text: "Web design" },
    { type: "svg", svg: STAR_SVG },
    { type: "text", text: "Branding" },
    { type: "svg", svg: STAR_SVG },
    { type: "text", text: "Online stores" },
    { type: "svg", svg: STAR_SVG },
    { type: "text", text: "Apps" },
    { type: "svg", svg: STAR_SVG },
]

const DEFAULTS = {
    items: DEFAULT_ITEMS,
    separatorType: "none" as "none" | "text" | "image",
    separator: "✕", // ← ADJUST: default text separator ("•", "/", "★"…)
    separatorImage: undefined as ImageValue,
    direction: "left" as "left" | "right",
    speed: 60, // ← ADJUST: pixels per second
    gap: 28, // ← ADJUST: space between items (px)
    paddingY: 16, // ← ADJUST: vertical padding of the band (px)
    textColor: "#FFFFFF", // ← ADJUST: text color (also tints SVGs)
    separatorColor: "rgba(255,255,255,0.6)", // ← ADJUST: text separator color
    backgroundColor: "#E24B4A", // ← ADJUST: band background
    transparentBg: false,
    textTransform: "uppercase" as "none" | "uppercase" | "lowercase",
    mediaHeight: 28, // ← ADJUST: height of images, logos and SVGs (px)
    mediaRadius: 0, // ← ADJUST: corner radius of images (px)
    tintSvg: true,
    svgColor: "#FFFFFF", // ← ADJUST: SVG color when tint is on
    imageStyle: "original" as "original" | "grayscale",
    mediaOpacity: 1,
    fadeEdges: true,
    fadeWidth: 80, // ← ADJUST: width of the edge fade (px)
    pauseOnHover: false,
    hoverSpeed: 0.25, // speed multiplier while hovered (0 = full stop)
    reducedMotion: "animate" as "animate" | "slow" | "stop",
}

type Props = Partial<typeof DEFAULTS> & {
    font?: React.CSSProperties
    style?: React.CSSProperties
}

// Accepts both the ResponsiveImage object and a plain URL string
function imgSrc(v: ImageValue) {
    if (!v) return undefined
    return typeof v === "string" ? v : v.src
}
function imgSrcSet(v: ImageValue) {
    return v && typeof v !== "string" ? v.srcSet : undefined
}

// ── SVG safety ────────────────────────────────────────────────
// Pasted SVG code is never injected into the page. It is parsed,
// rebuilt from an allowlist of shape tags/attributes (no scripts,
// event handlers, links, <image>, <use>, <foreignObject>, <style>,
// animations or external URLs) and then shown only through an
// <img> or a CSS mask, where SVG code cannot run.
const SAFE_TAGS = new Set([
    "svg", "g", "path", "circle", "ellipse", "rect", "line", "polyline", "polygon",
    "defs", "lineargradient", "radialgradient", "stop", "clippath", "mask", "title", "desc",
])
const SAFE_ATTRS = new Set([
    "viewbox", "width", "height", "d", "cx", "cy", "r", "rx", "ry", "x", "y", "x1", "y1", "x2", "y2",
    "fx", "fy", "points", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin",
    "stroke-miterlimit", "stroke-dasharray", "stroke-dashoffset", "fill-rule", "clip-rule", "opacity",
    "fill-opacity", "stroke-opacity", "transform", "id", "offset", "stop-color", "stop-opacity",
    "gradientunits", "gradienttransform", "clip-path", "mask", "maskunits", "maskcontentunits",
    "clippathunits", "preserveaspectratio", "vector-effect", "xmlns",
])
const SVG_NS = "http://www.w3.org/2000/svg"

// Only local references like url(#gradient) are allowed in values
function safeValue(v: string) {
    const low = v.toLowerCase()
    if (low.includes("javascript:") || low.includes("data:") || low.includes("expression(")) return false
    const urls = low.match(/url\(([^)]*)\)/g) || []
    return urls.every((u) => /^url\(\s*['"]?#[\w-]+['"]?\s*\)$/.test(u))
}

type SafeSvg = { uri: string; aspect: number }

function sanitizeSvg(raw: string): SafeSvg | null {
    if (typeof window === "undefined" || typeof DOMParser === "undefined") return null
    if (!raw || raw.length > 100000) return null // ← ADJUST: max size of pasted SVG code
    const parsed = new DOMParser().parseFromString(raw, "image/svg+xml")
    const src = parsed.documentElement
    if (!src || src.nodeName.toLowerCase() !== "svg" || parsed.getElementsByTagName("parsererror").length) return null
    const out = document.implementation.createDocument(SVG_NS, "svg", null)
    const copy = (from: Element, to: Element) => {
        for (const a of Array.from(from.attributes)) {
            const name = a.name.toLowerCase()
            if (!SAFE_ATTRS.has(name) || !safeValue(a.value)) continue
            to.setAttribute(name === "viewbox" ? "viewBox" : a.name, a.value)
        }
        for (const child of Array.from(from.childNodes)) {
            if (child.nodeType === 3 && /^(title|desc)$/i.test(from.nodeName)) {
                to.appendChild(out.createTextNode(child.textContent || ""))
                continue
            }
            if (child.nodeType !== 1) continue
            const el = child as Element
            const tag = el.localName.toLowerCase()
            if (!SAFE_TAGS.has(tag) || tag === "svg") continue
            const clean = out.createElementNS(SVG_NS, el.localName)
            copy(el, clean)
            to.appendChild(clean)
        }
    }
    const root = out.documentElement
    copy(src, root)
    // Size the SVG from its viewBox so it scales cleanly
    const vb = (root.getAttribute("viewBox") || "").trim().split(/[\s,]+/).map(Number)
    let w = vb.length === 4 ? vb[2] : parseFloat(root.getAttribute("width") || "24")
    let h = vb.length === 4 ? vb[3] : parseFloat(root.getAttribute("height") || "24")
    if (!(w > 0) || !(h > 0)) { w = 24; h = 24 }
    if (!root.getAttribute("viewBox")) root.setAttribute("viewBox", `0 0 ${w} ${h}`)
    root.setAttribute("width", String(w))
    root.setAttribute("height", String(h))
    const xml = new XMLSerializer().serializeToString(root)
    return { uri: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml), aspect: w / h }
}

/**
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 60
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerDisableUnlink
 */
export default function MarqueeTicker(props: Props) {
    const p = { ...DEFAULTS, ...props }

    // Keep only items that actually have content (memoized)
    const items = React.useMemo(
        () =>
            (p.items || []).filter((it) => {
                const t = it?.type || "text"
                if (t === "text") return !!(it.text && it.text.trim())
                if (t === "image") return !!imgSrc(it.image)
                if (t === "svg") return !!(it.svg && /<svg[\s>]/i.test(it.svg))
                return false
            }),
        [p.items]
    )
    // A short key with only what changes the band's width
    const itemsKey = React.useMemo(
        () => items.map((it) => [it.type || "text", it.text || "", imgSrc(it.image) || "", it.svg ? it.svg.length : 0].join("|")).join("\u0001"),
        [items]
    )
    const f = p.font || {}
    const fontKey = [f.fontFamily, f.fontWeight, f.fontStyle, f.fontSize, f.letterSpacing, f.lineHeight].join("|")

    const rootRef = React.useRef<HTMLDivElement>(null)
    const groupRef = React.useRef<HTMLDivElement>(null)
    const [groupW, setGroupW] = React.useState(0)
    const [rootW, setRootW] = React.useState(0)
    const [hovered, setHovered] = React.useState(false)
    const [prefersReduced, setPrefersReduced] = React.useState(false)
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    // True when Framer draws a still frame (thumbnails, exports, static previews)
    const isStatic = useIsStaticRenderer()

    // Sanitize every pasted SVG once, in the browser only (see "SVG safety")
    const svgKey = items.map((it) => (it.type === "svg" ? it.svg : "")).join("\u0000")
    const [safeSvgs, setSafeSvgs] = React.useState<Record<string, SafeSvg | null>>({})
    React.useEffect(() => {
        const next: Record<string, SafeSvg | null> = {}
        for (const it of items) if (it.type === "svg" && it.svg) next[it.svg] = sanitizeSvg(it.svg)
        setSafeSvgs(next)
    }, [svgKey])

    // Measure one set of items and the visible width, to know how
    // many copies fill the band and how far to move per loop.
    // ResizeObserver also catches images that finish loading later.
    React.useLayoutEffect(() => {
        const measure = () => {
            if (groupRef.current) setGroupW(groupRef.current.offsetWidth)
            if (rootRef.current) setRootW(rootRef.current.offsetWidth)
        }
        measure()
        const ro = new ResizeObserver(measure)
        if (groupRef.current) ro.observe(groupRef.current)
        if (rootRef.current) ro.observe(rootRef.current)
        if (typeof document !== "undefined" && (document as any).fonts?.ready) {
            ;(document as any).fonts.ready.then(measure)
        }
        return () => ro.disconnect()
    }, [itemsKey, fontKey, p.separatorType, p.separator, p.gap, p.textTransform, p.mediaHeight, safeSvgs])

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setPrefersReduced(mq.matches)
        update()
        mq.addEventListener?.("change", update)
        return () => mq.removeEventListener?.("change", update)
    }, [])

    // Effective speed (px/s), respecting Reduced Motion
    let speed = Math.max(1, p.speed)
    let stopped = false
    if (prefersReduced && !isCanvas) {
        if (p.reducedMotion === "slow") speed = speed * 0.3
        if (p.reducedMotion === "stop") stopped = true
    }

    // Viewport awareness: the loop only runs while the band is on screen
    const [inView, setInView] = React.useState(false)
    const inViewRef = React.useRef(false)
    React.useEffect(() => {
        const el = rootRef.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            inViewRef.current = true
            setInView(true)
            return
        }
        const io = new IntersectionObserver(
            ([entry]) => {
                inViewRef.current = entry.isIntersecting
                setInView(entry.isIntersecting)
            },
            { rootMargin: "100px" } // ← ADJUST: start a bit before it scrolls in
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

    // Loop animation (Web Animations API, so hover can change speed smoothly)
    const trackRef = React.useRef<HTMLDivElement>(null)
    const animRef = React.useRef<Animation | null>(null)
    React.useEffect(() => {
        const el = trackRef.current
        // No animation in static renders: the band is shown still
        if (!el || groupW === 0 || stopped || isStatic || typeof el.animate !== "function") return
        const from = p.direction === "left" ? 0 : -groupW
        const to = p.direction === "left" ? -groupW : 0
        const anim = el.animate(
            [{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }],
            { duration: (groupW / speed) * 1000, iterations: Infinity, easing: "linear" }
        )
        animRef.current = anim
        if (!inViewRef.current) anim.pause() // created paused when off screen
        return () => {
            anim.cancel()
            animRef.current = null
        }
    }, [groupW, speed, p.direction, stopped, isStatic])

    // Pause when it leaves the viewport, resume (same position) when it returns
    React.useEffect(() => {
        const anim = animRef.current
        if (!anim) return
        if (inView) anim.play()
        else anim.pause()
    }, [inView, groupW, speed, p.direction, stopped, isStatic])

    React.useEffect(() => {
        const anim = animRef.current
        if (!anim) return
        const target = p.pauseOnHover && hovered ? Math.max(0, p.hoverSpeed) : 1
        if (typeof (anim as any).updatePlaybackRate === "function") (anim as any).updatePlaybackRate(target)
        else anim.playbackRate = target
    }, [hovered, p.pauseOnHover, p.hoverSpeed, groupW, speed])

    const copies = groupW > 0 ? Math.max(2, Math.ceil(rootW / groupW) + 1) : 2

    // ── Styles ──────────────────────────────
    const font = { ...DEFAULT_FONT, ...(p.font || {}) }
    const textStyle: React.CSSProperties = {
        ...font,
        color: p.textColor,
        textTransform: p.textTransform,
        whiteSpace: "nowrap",
        flexShrink: 0,
    }
    const sepStyle: React.CSSProperties = { ...textStyle, color: p.separatorColor }
    const mediaFilter = p.imageStyle === "grayscale" ? "grayscale(1)" : undefined
    const imgStyle: React.CSSProperties = {
        height: p.mediaHeight,
        width: "auto",
        maxWidth: "none",
        display: "block",
        flexShrink: 0,
        objectFit: "contain",
        borderRadius: p.mediaRadius,
        opacity: p.mediaOpacity,
        filter: mediaFilter,
    }
    const fade = p.fadeEdges ? Math.max(0, p.fadeWidth) : 0
    const mask = fade
        ? `linear-gradient(to right, transparent 0, #000 ${fade}px, #000 calc(100% - ${fade}px), transparent 100%)`
        : undefined

    // ── Rendering ───────────────────────────
    const renderItem = (it: Item, key: string, hidden: boolean) => {
        const t = it.type || "text"
        let el: React.ReactNode = null
        if (t === "text") el = <span style={textStyle}>{it.text}</span>
        if (t === "image")
            el = (
                <img
                    src={imgSrc(it.image)}
                    srcSet={imgSrcSet(it.image)}
                    alt={hidden ? "" : it.alt || (typeof it.image === "object" ? it.image?.alt : "") || ""}
                    draggable={false}
                    style={imgStyle}
                />
            )
        if (t === "svg") {
            const safe = safeSvgs[it.svg || ""]
            const h = p.mediaHeight
            const w = safe ? h * safe.aspect : h
            const label = hidden ? undefined : it.alt || undefined
            if (!safe) el = <span aria-hidden style={{ width: w, height: h, flexShrink: 0 }} />
            else if (p.tintSvg)
                // Tinted: the sanitized SVG is used as a mask and filled with SVG Color
                el = (
                    <span
                        role={label ? "img" : undefined}
                        aria-label={label}
                        aria-hidden={label ? undefined : true}
                        style={{
                            display: "block", flexShrink: 0, width: w, height: h,
                            backgroundColor: p.svgColor, opacity: p.mediaOpacity,
                            WebkitMaskImage: `url("${safe.uri}")`, maskImage: `url("${safe.uri}")`,
                            WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
                            WebkitMaskSize: "contain", maskSize: "contain",
                            WebkitMaskPosition: "center", maskPosition: "center",
                        }}
                    />
                )
            // Original colors: shown as a plain image
            else el = <img src={safe.uri} alt={label || ""} draggable={false} style={{ height: h, width: w, flexShrink: 0, display: "block", opacity: p.mediaOpacity }} />
        }
        if (it.link)
            return (
                <a key={key} href={it.link} target="_blank" rel="noopener" tabIndex={hidden ? -1 : undefined} style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}>
                    {el}
                </a>
            )
        return <React.Fragment key={key}>{el}</React.Fragment>
    }

    const renderSeparator = (key: string) => {
        if (p.separatorType === "text" && p.separator)
            return <span key={key} style={sepStyle} aria-hidden>{p.separator}</span>
        if (p.separatorType === "image" && imgSrc(p.separatorImage))
            return <img key={key} src={imgSrc(p.separatorImage)} srcSet={imgSrcSet(p.separatorImage)} alt="" aria-hidden draggable={false} style={imgStyle} />
        return null
    }

    const renderGroup = (g: number) => {
        const first = g === 0
        return (
            <div
                key={g}
                ref={first ? groupRef : undefined}
                aria-hidden={first ? undefined : true}
                style={{ display: "flex", alignItems: "center", flexShrink: 0, gap: p.gap, paddingRight: p.gap }}
            >
                {items.map((it, i) => (
                    <React.Fragment key={i}>
                        {renderItem(it, `i${i}`, !first)}
                        {renderSeparator(`s${i}`)}
                    </React.Fragment>
                ))}
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div style={{ ...p.style, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(136,135,128,0.12)", color: "#888780", fontFamily: "Inter, sans-serif", fontSize: 13 }}>
                Add text, images or SVGs in Items →
            </div>
        )
    }

    return (
        <div
            ref={rootRef}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                ...p.style,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                width: "100%",
                paddingTop: p.paddingY,
                paddingBottom: p.paddingY,
                boxSizing: "border-box",
                background: p.transparentBg ? "transparent" : p.backgroundColor,
                WebkitMaskImage: mask,
                maskImage: mask,
            }}
        >
            <div ref={trackRef} style={{ display: "flex", flexShrink: 0, willChange: "transform" }}>
                {Array.from({ length: copies }).map((_, g) => renderGroup(g))}
            </div>
        </div>
    )
}

MarqueeTicker.displayName = "Marquee Ticker"
MarqueeTicker.defaultProps = DEFAULTS

addPropertyControls(MarqueeTicker, {
    // ── Content ───────────────────────────────
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["text", "image", "svg"],
                    optionTitles: ["Text", "Image", "SVG"],
                    displaySegmentedControl: true,
                    defaultValue: "text",
                },
                text: {
                    type: ControlType.String,
                    title: "Text",
                    defaultValue: "New item",
                    hidden: (it: any) => (it.type || "text") !== "text",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (it: any) => it.type !== "image",
                },
                svg: {
                    type: ControlType.String,
                    title: "SVG Code",
                    displayTextArea: true,
                    placeholder: "<svg …>…</svg>",
                    description: "Shapes only. Scripts, links and external files are removed.",
                    hidden: (it: any) => it.type !== "svg",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt Text",
                    placeholder: "Describe the logo/icon",
                    hidden: (it: any) => (it.type || "text") === "text",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    separatorType: {
        type: ControlType.Enum,
        title: "Separator",
        options: ["none", "text", "image"],
        optionTitles: ["None", "Text", "Image"],
        displaySegmentedControl: true,
        defaultValue: DEFAULTS.separatorType,
    },
    separator: {
        type: ControlType.String,
        title: "Separator Text",
        defaultValue: DEFAULTS.separator,
        hidden: (props: any) => props.separatorType !== "text",
    },
    separatorImage: {
        type: ControlType.ResponsiveImage,
        title: "Separator Image",
        hidden: (props: any) => props.separatorType !== "image",
    },
    // ── Motion ────────────────────────────────
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        displaySegmentedControl: true,
        defaultValue: DEFAULTS.direction,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 5,
        max: 400, // ← ADJUST: max speed in the panel
        step: 5,
        unit: " px/s",
        defaultValue: DEFAULTS.speed,
    },
    pauseOnHover: { type: ControlType.Boolean, title: "Slow on Hover", defaultValue: DEFAULTS.pauseOnHover },
    hoverSpeed: {
        type: ControlType.Number,
        title: "Hover Speed",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: DEFAULTS.hoverSpeed,
        description: "0 stops it completely.",
        hidden: (props: any) => !props.pauseOnHover,
    },
    reducedMotion: {
        type: ControlType.Enum,
        title: "Reduced Motion",
        options: ["animate", "slow", "stop"],
        optionTitles: ["Keep moving", "Slow down", "Stop"],
        defaultValue: DEFAULTS.reducedMotion,
        description: "What visitors with Reduce Motion enabled see.",
    },
    // ── Text ──────────────────────────────────
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 20, lineHeight: 1 },
    },
    textTransform: {
        type: ControlType.Enum,
        title: "Case",
        options: ["none", "uppercase", "lowercase"],
        optionTitles: ["Aa", "AA", "aa"],
        displaySegmentedControl: true,
        defaultValue: DEFAULTS.textTransform,
    },
    textColor: { type: ControlType.Color, title: "Text Color", defaultValue: DEFAULTS.textColor },
    separatorColor: {
        type: ControlType.Color,
        title: "Separator Color",
        defaultValue: DEFAULTS.separatorColor,
        hidden: (props: any) => props.separatorType !== "text",
    },
    // ── Images & SVG ──────────────────────────
    mediaHeight: { type: ControlType.Number, title: "Media Height", min: 8, max: 300, step: 1, unit: "px", defaultValue: DEFAULTS.mediaHeight },
    mediaRadius: { type: ControlType.Number, title: "Image Radius", min: 0, max: 150, step: 1, unit: "px", defaultValue: DEFAULTS.mediaRadius },
    imageStyle: {
        type: ControlType.Enum,
        title: "Image Style",
        options: ["original", "grayscale"],
        optionTitles: ["Original", "Grayscale"],
        displaySegmentedControl: true,
        defaultValue: DEFAULTS.imageStyle,
    },
    mediaOpacity: { type: ControlType.Number, title: "Media Opacity", min: 0, max: 1, step: 0.05, defaultValue: DEFAULTS.mediaOpacity },
    tintSvg: {
        type: ControlType.Boolean,
        title: "Tint SVGs",
        defaultValue: DEFAULTS.tintSvg,
        description: "On: one color. Off: the SVG's own colors.",
    },
    svgColor: {
        type: ControlType.Color,
        title: "SVG Color",
        defaultValue: DEFAULTS.svgColor,
        hidden: (props: any) => !props.tintSvg,
    },
    // ── Band ──────────────────────────────────
    transparentBg: { type: ControlType.Boolean, title: "Transparent BG", defaultValue: DEFAULTS.transparentBg },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: DEFAULTS.backgroundColor,
        hidden: (props: any) => props.transparentBg,
    },
    gap: { type: ControlType.Number, title: "Gap", min: 0, max: 200, step: 1, unit: "px", defaultValue: DEFAULTS.gap },
    paddingY: { type: ControlType.Number, title: "Padding Y", min: 0, max: 120, step: 1, unit: "px", defaultValue: DEFAULTS.paddingY },
    fadeEdges: { type: ControlType.Boolean, title: "Fade Edges", defaultValue: DEFAULTS.fadeEdges },
    fadeWidth: {
        type: ControlType.Number,
        title: "Fade Width",
        min: 0,
        max: 300,
        step: 4,
        unit: "px",
        defaultValue: DEFAULTS.fadeWidth,
        hidden: (props: any) => !props.fadeEdges,
    },
})
