import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useAnimationFrame, useReducedMotion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ─── Types ──────────────────────────────────────────────────────────────
type Img = { src?: string; srcSet?: string; alt?: string }
type Item = { label?: string; caption?: string; video?: string; videoUrl?: string; poster?: Img; link?: string }
type FontStyle = React.CSSProperties

interface Props {
    items?: Item[]
    motion?: { direction: "left" | "right"; speed: number; pauseOnHover: boolean; pauseButton: boolean }
    look?: { aspect: string; gap: number; radius: number; fade: number; showLabels: boolean; overlay: boolean }
    colors?: { label: string; caption: string; cardFill: string; border: string }
    labelFont?: FontStyle
    captionFont?: FontStyle
    label?: string
    style?: React.CSSProperties
}

const ASPECT: Record<string, string> = { "9:16": "9 / 16", "3:4": "3 / 4", "4:5": "4 / 5", "1:1": "1 / 1", "16:9": "16 / 9" }

// Sample videos shown until you add your own (replace or delete them in the Videos list)
const DEMO_ITEMS: Item[] = [
    { label: "Behind the lens", caption: "Creator series", videoUrl: "https://framerusercontent.com/assets/LsGdxg9eJVjexolyK3dAyNNSk4.mp4" },
    { label: "Shutter", caption: "Studio session", videoUrl: "https://framerusercontent.com/assets/i22AB5MZ6aTfY1MYp8ejvOmWxbw.mp4" },
    { label: "Soft light", caption: "Interior story", videoUrl: "https://framerusercontent.com/assets/LsEdaChbmxdMfChgbgJolFzcIg.mp4" },
    { label: "Late hours", caption: "Bar opening", videoUrl: "https://framerusercontent.com/assets/vRZ93WlEQQnlRshY9hYo8EWo.mp4" },
    { label: "Golden pour", caption: "Product film", videoUrl: "https://framerusercontent.com/assets/f4pLPLPOirr56A98n5tZtkyypU.mp4" },
    { label: "Slow burn", caption: "Candle launch", videoUrl: "https://framerusercontent.com/assets/zNiRrffYAlprJAel2QXKHMcv6H0.mp4" },
    { label: "Neon", caption: "Night editorial", videoUrl: "https://framerusercontent.com/assets/o5YzMOZJKmRHvaTR91xC59yM.mp4" },
    { label: "Cherry", caption: "FW lookbook", videoUrl: "https://framerusercontent.com/assets/m2vmOdgs3ph7kdJ9MzrtWblQEn0.mp4" },
    { label: "First shot", caption: "Café opening", videoUrl: "https://framerusercontent.com/assets/knkNEVRJQYPTAdvxpIMeilXE4jo.mp4" },
    { label: "The olive", caption: "Cocktail menu", videoUrl: "https://framerusercontent.com/assets/hhxozFzapQiZlWEjwh3ZcjOLsQ.mp4" },
    { label: "Blue note", caption: "Session film", videoUrl: "https://framerusercontent.com/assets/suOHt3v8DWQGXnmKiOZLwVdBk.mp4" },
    { label: "Red room", caption: "Acoustic set", videoUrl: "https://framerusercontent.com/assets/Ir5cW2fCWhkHc8DWYlTt7AmxgdM.mp4" },
]
const DEMO_POSTERS: Record<string, string> = {
    "https://framerusercontent.com/assets/LsGdxg9eJVjexolyK3dAyNNSk4.mp4": "https://framerusercontent.com/assets/Pagh3ynEodXtYWkg9kI4GYb1diI.jpg",
    "https://framerusercontent.com/assets/i22AB5MZ6aTfY1MYp8ejvOmWxbw.mp4": "https://framerusercontent.com/assets/jOxl4oirqpiO0ZLzftzxIXH3TpM.jpg",
    "https://framerusercontent.com/assets/LsEdaChbmxdMfChgbgJolFzcIg.mp4": "https://framerusercontent.com/assets/rgTYi38CBuCVN3BeP5BNDS0b9s.jpg",
    "https://framerusercontent.com/assets/vRZ93WlEQQnlRshY9hYo8EWo.mp4": "https://framerusercontent.com/assets/XSTeOOYLx3qtQ35568i5GGUtM.jpg",
    "https://framerusercontent.com/assets/f4pLPLPOirr56A98n5tZtkyypU.mp4": "https://framerusercontent.com/assets/Hl8z0H7cfxAXSyAOQZIjxfLhkic.jpg",
    "https://framerusercontent.com/assets/zNiRrffYAlprJAel2QXKHMcv6H0.mp4": "https://framerusercontent.com/assets/YLkBtOwKegP92LxgFoelnJmwMYs.jpg",
    "https://framerusercontent.com/assets/o5YzMOZJKmRHvaTR91xC59yM.mp4": "https://framerusercontent.com/assets/BWGdRXeky2xo7SfPwtxX3B6t8k.jpg",
    "https://framerusercontent.com/assets/m2vmOdgs3ph7kdJ9MzrtWblQEn0.mp4": "https://framerusercontent.com/assets/0UT6HPCZI1XUmkk0QNKRIvwDNw.jpg",
    "https://framerusercontent.com/assets/knkNEVRJQYPTAdvxpIMeilXE4jo.mp4": "https://framerusercontent.com/assets/I75HsKmZHofsQUY8lHhce0g5ehI.jpg",
    "https://framerusercontent.com/assets/hhxozFzapQiZlWEjwh3ZcjOLsQ.mp4": "https://framerusercontent.com/assets/UDmJuyGQNnDJONEEmJ4r5zLWcA.jpg",
    "https://framerusercontent.com/assets/suOHt3v8DWQGXnmKiOZLwVdBk.mp4": "https://framerusercontent.com/assets/9t8SBzoMshN3UTEZPboCaqt6A4.jpg",
    "https://framerusercontent.com/assets/Ir5cW2fCWhkHc8DWYlTt7AmxgdM.mp4": "https://framerusercontent.com/assets/FPZhd0noHfvbv1UW0X2oaCbnsI0.jpg",
}

const mediaSrc = (i: Item) => ((i && (i.video || i.videoUrl)) || "").trim()
const posterSrc = (i: Item) => (i && i.poster && i.poster.src) || (i && DEMO_POSTERS[mediaSrc(i)]) || ""

const STYLE_ID = "reelflow-ticker-styles"
const CSS = [
    ".rflw-toggle{opacity:0;transition:opacity .25s ease,background-color .2s ease}",
    ".rflw-root:hover .rflw-toggle,.rflw-toggle:focus-visible,.rflw-toggle[data-paused=true]{opacity:1}",
    "@media (hover:none){.rflw-toggle{opacity:1}}",
    ".rflw-toggle:focus-visible,.rflw-link:focus-visible{outline:2px solid #fff;outline-offset:2px}",
].join("\n")

// Plays only while on screen and running, always muted, never interactive
function TickerMedia(props: { item: Item; still: boolean; paused: boolean }) {
    const { item, still, paused } = props
    const ref = useRef<HTMLVideoElement>(null)
    const src = mediaSrc(item)
    const poster = posterSrc(item)
    useEffect(() => {
        const v = ref.current
        if (!v || still || !src) return
        v.muted = true
        if (paused) {
            v.pause()
            return
        }
        const play = () => {
            const p = v.play()
            if (p && p.catch) p.catch(() => {})
        }
        if (typeof IntersectionObserver === "undefined") return play()
        const io = new IntersectionObserver((entries) => entries.forEach((e) => (e.isIntersecting ? play() : v.pause())), { threshold: 0.01 })
        io.observe(v)
        return () => io.disconnect()
    }, [src, still, paused])
    const s: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }
    // Static renderers and the canvas get a still frame instead of a playing video
    if (still && poster) return <img src={poster} alt="" loading="eager" style={s} />
    if (src) return <video ref={ref} src={poster ? src : src + "#t=0.1"} poster={poster || undefined} muted autoPlay={!still && !paused} loop playsInline preload="metadata" disablePictureInPicture tabIndex={-1} aria-hidden="true" style={s} />
    if (poster) return <img src={poster} srcSet={item.poster && item.poster.srcSet} alt="" loading="lazy" style={s} />
    return null
}

const PauseIcon = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
        <rect x="2.5" y="2" width="2.4" height="8" rx="0.6" />
        <rect x="7.1" y="2" width="2.4" height="8" rx="0.6" />
    </svg>
)
const PlayIcon = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
        <path d="M3.5 2.2v7.6a.6.6 0 0 0 .92.5l5.9-3.8a.6.6 0 0 0 0-1L4.42 1.7a.6.6 0 0 0-.92.5z" />
    </svg>
)

/**
 * Reelflow — infinite video ticker.
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 460
 */
export default function Reelflow(props: Props) {
    const { items, style, label = "Video reel" } = props
    const m = { ...defaults.motion, ...props.motion }
    const look = { ...defaults.look, ...props.look }
    const col = { ...defaults.colors, ...props.colors }
    const labelFont = props.labelFont || {}
    const captionFont = props.captionFont || {}
    const valid = (items || DEMO_ITEMS).filter((i) => i && (mediaSrc(i) || posterSrc(i)))
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    // Static renderers (thumbnails, previews, SSR snapshots) can't animate; render a still, final frame
    const isStatic = useIsStaticRenderer()
    const still = isStatic || isCanvas
    const reduce = useReducedMotion()

    const rootRef = useRef<HTMLDivElement>(null)
    const setRef = useRef<HTMLDivElement>(null)
    const setW = useRef(0)
    const visible = useRef(true)
    const hovered = useRef(false)
    const focused = useRef(false)
    const [copies, setCopies] = useState(2)
    // Starts paused for visitors who prefer reduced motion; anyone can pause or resume
    const [userPaused, setUserPaused] = useState(false)
    useEffect(() => {
        if (reduce) setUserPaused(true)
    }, [reduce])
    const x = useMotionValue(0)

    // Measure one set and render enough copies to always cover the viewport
    useEffect(() => {
        const root = rootRef.current
        const set = setRef.current
        if (!root || !set) return
        const measure = () => {
            setW.current = set.offsetWidth
            if (setW.current > 0) setCopies(Math.max(2, Math.ceil(root.offsetWidth / setW.current) + 1))
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        ro.observe(root)
        ro.observe(set)
        return () => ro.disconnect()
    }, [valid.length, look.gap, look.aspect])

    // Skip work while off screen
    useEffect(() => {
        const root = rootRef.current
        if (!root || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver((e) => (visible.current = !!e[0] && e[0].isIntersecting))
        io.observe(root)
        return () => io.disconnect()
    }, [])

    useAnimationFrame((_, delta) => {
        const w = setW.current
        if (still || userPaused || !w || !visible.current || (m.pauseOnHover && (hovered.current || focused.current))) return
        const step = (m.speed * Math.min(delta, 64)) / 1000
        let next = x.get() + (m.direction === "left" ? -step : step)
        if (next <= -w) next += w
        if (next > 0) next -= w
        x.set(next)
    })

    const mask = look.fade > 0 ? "linear-gradient(90deg, transparent 0px, #000 " + look.fade + "px, #000 calc(100% - " + look.fade + "px), transparent 100%)" : undefined
    const aspect = ASPECT[look.aspect] || "9 / 16"

    const renderSet = (copy: number) => (
        <div key={copy} ref={copy === 0 ? setRef : undefined} role={copy === 0 ? "list" : undefined} aria-hidden={copy > 0 ? "true" : undefined} style={{ display: "flex", height: "100%", flexShrink: 0 }}>
            {valid.map((item, i) => {
                const card = (
                    <div style={{ position: "relative", height: "100%", aspectRatio: aspect, borderRadius: look.radius, overflow: "hidden", background: col.cardFill, border: "1px solid " + col.border }}>
                        <TickerMedia item={item} still={still} paused={userPaused} />
                        {look.showLabels && (item.label || item.caption) ? (
                            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "56px 14px 14px", background: look.overlay ? "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.72) 100%)" : "none", display: "flex", flexDirection: "column", gap: 5, pointerEvents: "none" }}>
                                {item.label ? <span style={{ fontSize: 14, lineHeight: "1.2em", letterSpacing: "-0.01em", ...labelFont, color: col.label }}>{item.label}</span> : null}
                                {item.caption ? <span style={{ fontSize: 10, lineHeight: "1em", letterSpacing: "0.04em", ...captionFont, color: col.caption }}>{item.caption}</span> : null}
                            </div>
                        ) : null}
                    </div>
                )
                return (
                    <div key={i} role={copy === 0 ? "listitem" : undefined} aria-label={copy === 0 ? [item.label, item.caption].filter(Boolean).join(", ") || undefined : undefined} style={{ height: "100%", paddingRight: look.gap, flexShrink: 0, display: "flex" }}>
                        {item.link ? (
                            <a className="rflw-link" href={item.link} tabIndex={copy > 0 ? -1 : undefined} draggable={false} style={{ display: "flex", height: "100%", textDecoration: "none" }}>
                                {card}
                            </a>
                        ) : (
                            card
                        )}
                    </div>
                )
            })}
        </div>
    )

    return (
        <div
            ref={rootRef}
            className="rflw-root"
            role="region"
            aria-roledescription="ticker"
            aria-label={label}
            onMouseEnter={() => (hovered.current = true)}
            onMouseLeave={() => (hovered.current = false)}
            onFocus={() => (focused.current = true)}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) focused.current = false
            }}
            style={{ ...style, position: "relative", overflow: "hidden", userSelect: "none", WebkitUserSelect: "none" }}
        >
            <style id={STYLE_ID}>{CSS}</style>
            {valid.length === 0 ? (
                <div style={{ fontSize: 12, ...captionFont, height: "100%", minHeight: 160, display: "flex", alignItems: "center", justifyContent: "center", color: col.caption }}>Add videos in the properties panel</div>
            ) : (
                <div style={{ height: "100%", maskImage: mask, WebkitMaskImage: mask }}>
                    <motion.div style={{ x, display: "flex", height: "100%", width: "max-content" }}>{Array.from({ length: copies }, (_, k) => renderSet(k))}</motion.div>
                </div>
            )}
            {m.pauseButton && valid.length > 0 && !still && (
                <button
                    type="button"
                    className="rflw-toggle"
                    data-paused={userPaused ? "true" : "false"}
                    aria-pressed={userPaused}
                    aria-label={userPaused ? "Play reel" : "Pause reel"}
                    onClick={() => setUserPaused((p) => !p)}
                    style={{
                        position: "absolute",
                        right: Math.max(12, Math.min(look.fade, 40)),
                        bottom: 12,
                        width: 34,
                        height: 34,
                        borderRadius: 34,
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: "rgba(0,0,0,0.55)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        color: "#fff",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        padding: 0,
                        zIndex: 2,
                    }}
                >
                    {userPaused ? <PlayIcon /> : <PauseIcon />}
                </button>
            )}
        </div>
    )
}

Reelflow.displayName = "Reelflow — Video Ticker"

const defaults = {
    motion: { direction: "left" as const, speed: 40, pauseOnHover: false, pauseButton: true },
    look: { aspect: "9:16", gap: 16, radius: 18, fade: 120, showLabels: true, overlay: true },
    colors: { label: "#FFFFFF", caption: "rgba(255, 255, 255, 0.65)", cardFill: "#161616", border: "rgba(255, 255, 255, 0.08)" },
}

addPropertyControls(Reelflow, {
    items: {
        type: ControlType.Array,
        title: "Videos",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Project" },
                caption: { type: ControlType.String, title: "Caption", defaultValue: "Category" },
                video: { type: ControlType.File, title: "Video", allowedFileTypes: ["mp4", "webm", "mov"] },
                videoUrl: { type: ControlType.String, title: "Video URL", placeholder: "https://…/video.mp4", description: "Used when no file is uploaded." },
                poster: { type: ControlType.ResponsiveImage, title: "Poster" },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: DEMO_ITEMS,
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            direction: { type: ControlType.Enum, title: "Direction", options: ["left", "right"], optionTitles: ["Left", "Right"], displaySegmentedControl: true, defaultValue: defaults.motion.direction },
            speed: { type: ControlType.Number, title: "Speed", min: 5, max: 300, step: 5, unit: "px/s", defaultValue: defaults.motion.speed },
            pauseOnHover: { type: ControlType.Boolean, title: "Hover pause", defaultValue: defaults.motion.pauseOnHover },
            pauseButton: { type: ControlType.Boolean, title: "Pause button", defaultValue: defaults.motion.pauseButton, description: "Lets visitors stop the motion (recommended for accessibility)." },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            aspect: { type: ControlType.Enum, title: "Ratio", options: ["9:16", "3:4", "4:5", "1:1", "16:9"], defaultValue: defaults.look.aspect, description: "Card height follows the component height." },
            gap: { type: ControlType.Number, title: "Gap", min: 0, max: 80, step: 2, unit: "px", defaultValue: defaults.look.gap },
            radius: { type: ControlType.Number, title: "Radius", min: 0, max: 48, step: 1, unit: "px", defaultValue: defaults.look.radius },
            fade: { type: ControlType.Number, title: "Edge fade", min: 0, max: 400, step: 10, unit: "px", defaultValue: defaults.look.fade },
            showLabels: { type: ControlType.Boolean, title: "Labels", defaultValue: defaults.look.showLabels },
            overlay: { type: ControlType.Boolean, title: "Shade", defaultValue: defaults.look.overlay, hidden: (p: any) => !p.showLabels },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            label: { type: ControlType.Color, title: "Label", defaultValue: defaults.colors.label },
            caption: { type: ControlType.Color, title: "Caption", defaultValue: defaults.colors.caption },
            cardFill: { type: ControlType.Color, title: "Card fill", defaultValue: defaults.colors.cardFill },
            border: { type: ControlType.Color, title: "Border", defaultValue: defaults.colors.border },
        },
    },
    labelFont: { type: ControlType.Font, title: "Label font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 14, lineHeight: "1.2em", letterSpacing: "-0.01em" } },
    captionFont: { type: ControlType.Font, title: "Caption font", controls: "extended", defaultFontType: "monospace", defaultValue: { fontSize: 10, lineHeight: "1em", letterSpacing: "0.04em" } },
    label: { type: ControlType.String, title: "A11y label", defaultValue: "Video reel", description: "Name announced by screen readers." },
})
