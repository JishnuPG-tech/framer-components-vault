import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/*
 * Line Loader — a loading line fills with the page's real load progress,
 * and when it is full the same line opens up into the hero photo.
 * Timeline on one 0..1 value: 0–0.5 loading (line fills), 0.5–1 opening (line becomes the hero).
 * Geometry is pure CSS (percentages + clip-path), so nothing has to be measured.
 */

type Easing = "smooth" | "expo" | "linear"
type Mode = "hero" | "overlay"

interface ResponsiveImage {
    src: string
    srcSet?: string
    alt?: string
}

interface Props {
    mode: Mode
    image?: ResponsiveImage
    background: string
    lineColor: string
    trackColor: string
    lineWeight: number
    barWidth: number
    label: string
    showCounter: boolean
    smallFont: CSSProperties
    smallColor: string
    title: string
    subtitle: string
    titleFont: CSSProperties
    subFont: CSSProperties
    titleColor: string
    tint: number
    zoom: number
    minDuration: number
    openDuration: number
    easing: Easing
    hold: number
    lockScroll: boolean
    oncePerSession: boolean
    preview: number
    onDone?: () => void
    style?: CSSProperties
}

interface Frame {
    clip: string
    imgScale: number
    inkOpacity: number
    chromeOpacity: number
    count: string
    heroOpacity: number
    heroShift: number
}

const clamp = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v)
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
const EASES: Record<Easing, (t: number) => number> = {
    smooth: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    expo: (t) => (t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
    linear: (t) => t,
}
const SEEN_KEY = "line-loader-seen"

/**
 * Shared page-scroll lock. Several components can hold it at once; the page's
 * original overflow is saved by the first lock and restored when the last one releases.
 */
interface ScrollLockState {
    count: number
    saved: string
}
const LOCK_KEY = "__framerScrollLock"
function acquireScrollLock(): () => void {
    const host = window as unknown as Record<string, ScrollLockState | undefined>
    const state: ScrollLockState = host[LOCK_KEY] ?? { count: 0, saved: "" }
    host[LOCK_KEY] = state
    const el = document.documentElement
    if (state.count === 0) {
        state.saved = el.style.overflow
        el.style.overflow = "hidden"
    }
    state.count++
    let released = false
    return () => {
        if (released) return
        released = true
        state.count = Math.max(0, state.count - 1)
        if (state.count === 0) el.style.overflow = state.saved
    }
}

function pageLoadProgress(): number {
    if (document.readyState === "complete") return 1
    const imgs = Array.from(document.images)
    if (!imgs.length) return document.readyState === "interactive" ? 0.7 : 0.3
    const done = imgs.filter((i) => i.complete).length
    return 0.2 + 0.75 * (done / imgs.length)
}

/** Every visual value for one moment of the timeline. */
function frameAt(p: number, o: { easing: Easing; barWidth: number; lineWeight: number; zoom: number }): Frame {
    const ease = EASES[o.easing] || EASES.smooth
    const load = clamp(p / 0.5)
    const e = clamp((p - 0.5) / 0.5)
    const e1 = ease(clamp(e / 0.5)) // the line thickens in place
    const e2 = ease(clamp((e - 0.4) / 0.6)) // and opens to full bleed

    // Horizontal, in % of the stage.
    const bl = ((1 - o.barWidth) / 2) * 100
    const left = lerp(bl, 0, e2)
    const width = lerp(o.barWidth * 100 * load, 100, e2)
    const right = 100 - left - width
    // Vertical: height = px part + % part, centered.
    const hPx = (1 - e2) * (1 - e1) * o.lineWeight
    const hPct = (1 - e2) * e1 * 42 + e2 * 100
    const tb = "calc(" + (100 - hPct) / 2 + "% - " + hPx / 2 + "px)"

    const k = clamp((e - 0.75) / 0.25)
    return {
        clip: "inset(" + tb + " " + right + "% " + tb + " " + left + "%)",
        imgScale: lerp(o.zoom, 1, (e1 + e2) / 2),
        inkOpacity: 1 - clamp(e / 0.35),
        chromeOpacity: 1 - clamp(e / 0.15),
        count: String(Math.round(load * 100)).padStart(3, "0"),
        heroOpacity: k,
        heroShift: (1 - k) * 24,
    }
}

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function LineLoader(props: Props) {
    const {
        mode,
        image,
        background,
        lineColor,
        trackColor,
        lineWeight,
        barWidth,
        label,
        showCounter,
        smallFont,
        smallColor,
        title,
        subtitle,
        titleFont,
        subFont,
        titleColor,
        tint,
        zoom,
        minDuration,
        openDuration,
        easing,
        hold,
        lockScroll,
        oncePerSession,
        preview,
        onDone,
        style,
    } = props

    // Canvas, export and other static renders get one still frame: no loop, no scroll lock, no storage.
    const isStatic = useIsStaticRenderer()
    const overlay = mode === "overlay" && !isStatic

    const groupRef = useRef<HTMLDivElement>(null)
    const imgRef = useRef<HTMLDivElement>(null)
    const inkRef = useRef<HTMLDivElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const metaRef = useRef<HTMLDivElement>(null)
    const countRef = useRef<HTMLSpanElement>(null)
    const heroRef = useRef<HTMLDivElement>(null)
    const onDoneRef = useRef(onDone)
    onDoneRef.current = onDone
    const [gone, setGone] = useState(false)
    const [busy, setBusy] = useState(!isStatic)

    const geo = { easing, barWidth, lineWeight, zoom }
    const geoRef = useRef(geo)
    geoRef.current = geo

    const apply = (p: number): void => {
        const f = frameAt(p, geoRef.current)
        const g = groupRef.current
        if (g) {
            g.style.clipPath = f.clip
            g.style.setProperty("-webkit-clip-path", f.clip)
        }
        if (imgRef.current) imgRef.current.style.transform = "scale(" + f.imgScale + ")"
        if (inkRef.current) inkRef.current.style.opacity = String(f.inkOpacity)
        if (trackRef.current) trackRef.current.style.opacity = String(f.chromeOpacity)
        if (metaRef.current) metaRef.current.style.opacity = String(f.chromeOpacity)
        if (countRef.current) countRef.current.textContent = f.count
        if (heroRef.current) {
            heroRef.current.style.opacity = String(f.heroOpacity)
            heroRef.current.style.transform = "translateY(" + f.heroShift + "px)"
        }
    }

    // The loading run (live only).
    useEffect(() => {
        if (isStatic) return
        const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        let seen = false
        if (oncePerSession) {
            try {
                seen = window.sessionStorage.getItem(SEEN_KEY) === "1"
                window.sessionStorage.setItem(SEEN_KEY, "1")
            } catch (err) {
                seen = false
            }
        }
        if (seen || reduce) {
            apply(1)
            setBusy(false)
            if (overlay) setGone(true)
            return
        }

        const release = lockScroll ? acquireScrollLock() : () => {}

        let cancelled = false
        let raf = 0
        let hideTimer: ReturnType<typeof setTimeout> | undefined
        let shown = 0
        let loaded = document.readyState === "complete"
        const onLoad = (): void => {
            loaded = true
        }
        if (!loaded) window.addEventListener("load", onLoad)

        const minMs = Math.max(0.3, minDuration) * 1000
        const openMs = Math.max(0.3, openDuration) * 1000
        const start = performance.now()
        let openStart = 0

        const finish = (): void => {
            release()
            setBusy(false)
            onDoneRef.current?.()
            if (overlay) hideTimer = setTimeout(() => !cancelled && setGone(true), Math.max(0, hold) * 1000)
        }

        const step = (now: number): void => {
            if (cancelled) return
            if (!openStart) {
                // The line never runs ahead of the real load, and never finishes before the minimum time.
                const timeP = clamp((now - start) / minMs)
                const realP = loaded ? 1 : pageLoadProgress()
                const target = Math.min(timeP, realP, loaded ? 1 : 0.97)
                shown += (target - shown) * 0.12
                if (target >= 1 && shown > 0.995) shown = 1
                apply(shown * 0.5)
                if (shown >= 1) openStart = now
                raf = requestAnimationFrame(step)
                return
            }
            const k = clamp((now - openStart) / openMs)
            apply(0.5 + k * 0.5)
            if (k < 1) raf = requestAnimationFrame(step)
            else finish()
        }
        raf = requestAnimationFrame(step)

        return () => {
            cancelled = true
            cancelAnimationFrame(raf)
            if (hideTimer) clearTimeout(hideTimer)
            window.removeEventListener("load", onLoad)
            release()
        }
    }, [isStatic, minDuration, openDuration, easing, hold, lockScroll, oncePerSession, overlay])

    // First paint (and every static render) comes straight from the frame math.
    const f0 = frameAt(isStatic ? preview : 0, geo)
    const bl = ((1 - barWidth) / 2) * 100
    const src = image?.src

    const stageStyle: CSSProperties = overlay
        ? { position: "fixed", inset: 0, zIndex: 9999, transition: "opacity 0.6s ease", opacity: gone ? 0 : 1, pointerEvents: gone ? "none" : "auto", overscrollBehavior: "contain" }
        : { position: "relative", width: "100%", height: "100%" }

    return (
        <div style={{ ...style, position: "relative", width: "100%", height: overlay ? 0 : "100%" }}>
            <div aria-busy={busy} style={{ ...stageStyle, overflow: "hidden", background }}>
                <div
                    ref={trackRef}
                    aria-hidden="true"
                    style={{ position: "absolute", left: bl + "%", width: barWidth * 100 + "%", top: "calc(50% - " + lineWeight / 2 + "px)", height: lineWeight, background: trackColor, opacity: f0.chromeOpacity }}
                />

                <div ref={groupRef} style={{ position: "absolute", inset: 0, overflow: "hidden", clipPath: f0.clip, WebkitClipPath: f0.clip }}>
                    <div
                        ref={imgRef}
                        role={src ? "img" : undefined}
                        aria-label={src ? image?.alt || title || "Hero image" : undefined}
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage: src ? "url(" + JSON.stringify(src) + ")" : "linear-gradient(135deg, #8a8a8a, #2a2a2a)",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            transform: "scale(" + f0.imgScale + ")",
                            willChange: isStatic ? undefined : "transform",
                        }}
                    >
                        {tint > 0 ? <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0," + tint + "), rgba(0,0,0,0) 65%)" }} /> : null}
                    </div>
                    <div ref={inkRef} aria-hidden="true" style={{ position: "absolute", inset: 0, background: lineColor, opacity: f0.inkOpacity }} />
                </div>

                <div
                    ref={metaRef}
                    style={{
                        position: "absolute",
                        left: bl + "%",
                        width: barWidth * 100 + "%",
                        top: "calc(50% - " + (lineWeight / 2 + 14) + "px)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        transform: "translateY(-100%)",
                        color: smallColor,
                        opacity: f0.chromeOpacity,
                        ...smallFont,
                    }}
                >
                    <span>{label}</span>
                    {showCounter ? (
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>
                            <span ref={countRef}>{f0.count}</span>%
                        </span>
                    ) : null}
                </div>

                {title || subtitle ? (
                    <div
                        ref={heroRef}
                        style={{
                            position: "absolute",
                            left: "6%",
                            right: "6%",
                            bottom: "8%",
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                            color: titleColor,
                            opacity: f0.heroOpacity,
                            transform: "translateY(" + f0.heroShift + "px)",
                        }}
                    >
                        {title ? <h2 style={{ margin: 0, font: "inherit", whiteSpace: "pre-wrap", ...titleFont }}>{title}</h2> : null}
                        {subtitle ? <p style={{ margin: 0, opacity: 0.8, whiteSpace: "pre-wrap", ...subFont }}>{subtitle}</p> : null}
                    </div>
                ) : null}
            </div>
        </div>
    )
}

LineLoader.displayName = "Line Loader"

LineLoader.defaultProps = {
    mode: "hero",
    image: undefined,
    background: "#F4F1EA",
    lineColor: "#111111",
    trackColor: "rgba(17, 17, 17, 0.12)",
    lineWeight: 2,
    barWidth: 0.6,
    label: "Loading",
    showCounter: true,
    smallFont: { fontFamily: "Inter", fontWeight: 500, fontSize: 13, letterSpacing: "0.06em", lineHeight: "1.2em" },
    smallColor: "#111111",
    title: "Where the line ends",
    subtitle: "A loader that becomes the first screen.",
    titleFont: { fontFamily: "Inter", fontWeight: 600, fontSize: 96, letterSpacing: "-0.04em", lineHeight: "1em" },
    subFont: { fontFamily: "Inter", fontWeight: 400, fontSize: 18, lineHeight: "1.4em" },
    titleColor: "#FFFFFF",
    tint: 0.45,
    zoom: 1.3,
    minDuration: 1.8,
    openDuration: 1.6,
    easing: "smooth",
    hold: 0.8,
    lockScroll: true,
    oncePerSession: false,
    preview: 0.35,
}

addPropertyControls(LineLoader, {
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["hero", "overlay"],
        optionTitles: ["Hero", "Overlay"],
        displaySegmentedControl: true,
        description: "Hero: sits in the page as the first section. Overlay: covers the whole site, opens, then fades away.",
    },
    image: { type: ControlType.ResponsiveImage, title: "Image" },
    background: { type: ControlType.Color, title: "Background" },
    lineColor: { type: ControlType.Color, title: "Line" },
    trackColor: { type: ControlType.Color, title: "Track" },
    lineWeight: { type: ControlType.Number, title: "Line Weight", min: 1, max: 12, step: 1, unit: "px" },
    barWidth: { type: ControlType.Number, title: "Bar Width", min: 0.1, max: 1, step: 0.01 },
    label: { type: ControlType.String, title: "Label" },
    showCounter: { type: ControlType.Boolean, title: "Counter" },
    smallFont: { type: ControlType.Font, title: "Small Font", controls: "extended", defaultFontType: "sans-serif" },
    smallColor: { type: ControlType.Color, title: "Small Color" },

    title: { type: ControlType.String, title: "Title", displayTextArea: true },
    subtitle: { type: ControlType.String, title: "Subtitle", placeholder: "Optional" },
    titleFont: { type: ControlType.Font, title: "Title Font", controls: "extended", defaultFontType: "sans-serif" },
    subFont: { type: ControlType.Font, title: "Sub Font", controls: "extended", hidden: (p: Props) => !p.subtitle },
    titleColor: { type: ControlType.Color, title: "Title Color" },
    tint: { type: ControlType.Number, title: "Shade", min: 0, max: 0.9, step: 0.05 },
    zoom: { type: ControlType.Number, title: "Zoom From", min: 1, max: 2, step: 0.05 },

    minDuration: { type: ControlType.Number, title: "Min Load", min: 0.3, max: 8, step: 0.1, unit: "s", description: "The line waits for the real page load, but never fills faster than this." },
    openDuration: { type: ControlType.Number, title: "Open", min: 0.3, max: 6, step: 0.1, unit: "s" },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["smooth", "expo", "linear"],
        optionTitles: ["Smooth", "Expo", "Linear"],
    },
    hold: { type: ControlType.Number, title: "Hold", min: 0, max: 5, step: 0.1, unit: "s", hidden: (p: Props) => p.mode !== "overlay" },
    lockScroll: { type: ControlType.Boolean, title: "Lock Scroll", description: "Pauses page scrolling while loading, then restores it exactly." },
    oncePerSession: { type: ControlType.Boolean, title: "Once / Visit", description: "Skip straight to the open hero on later pages of the same visit." },
    preview: { type: ControlType.Number, title: "Canvas Preview", min: 0, max: 1, step: 0.01, description: "0–0.5 loading, 0.5–1 opening." },
    onDone: { type: ControlType.EventHandler },
})
