import { useCallback, useEffect, useMemo, useRef, useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

interface ScrollingWaveTextProps {
    text: string
    fontSizeVw: number
    letterSpacing: number
    scrollScreens: number
    leadPadding: number
    waveHeight: number
    waveLength: number
    followWave: boolean
    focusBand: number
    focusScale: number
    dimOpacity: number
    riseDistance: number
    entryZone: number
    hoverLift: number
    panelRadius: number
    panelRadiusEnd: number
    panelScale: number
    panelRise: number
    expandDistance: number
    bgStart: string
    bgEnd: string
    textStart: string
    textEnd: string
    textSharpness: number
    colorOnset: number
    font: CSSProperties | string
    showAdvanced?: boolean
    style?: CSSProperties
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)

/**
 * Steepen a 0–1 ramp around its midpoint. Text and background that invert past
 * each other must cross through equal luminance; this moves the text through
 * that crossover quickly instead of dwelling in it.
 */
function sharpen(t: number, k: number): number {
    const x = clamp01(t)
    if (k <= 1) return x
    const d = Math.abs(x - 0.5) * 2
    return clamp01(0.5 + Math.sign(x - 0.5) * (Math.pow(d, 1 / k) / 2))
}

/** Blend two CSS colors at t. color-mix keeps design-token references intact. */
function mixColor(from: string, to: string, t: number): string {
    const pct = Math.round(clamp01(t) * 100)
    if (pct <= 0) return from
    if (pct >= 100) return to
    return `color-mix(in srgb, ${to} ${pct}%, ${from})`
}

/**
 * Scrolling Wave Text
 *
 * A long line of type pinned and scrubbed horizontally. Rather than tumbling in
 * at random, letters ride a standing wave that stays fixed to the viewport, each
 * one banking to the wave's tangent, dropping into the line as it enters and
 * coming into full weight and color as it crosses center stage.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 2000
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ScrollingWaveText(props: ScrollingWaveTextProps) {
    const {
        text = "Type that travels. Letters that land. Scroll to watch the line move.",
        fontSizeVw = 11,
        letterSpacing = -0.02,
        scrollScreens = 4,
        leadPadding = 105,
        waveHeight = 3,
        waveLength = 62,
        followWave = true,
        focusBand = 0.62,
        focusScale = 1.1,
        dimOpacity = 0.35,
        riseDistance = -130,
        entryZone = 0.38,
        hoverLift = 16,
        panelRadius = 80,
        panelRadiusEnd = 0,
        panelScale = 0.7,
        expandDistance = 55,
        panelRise = 10,
        bgStart = "#F4F2EE",
        bgEnd = "#151515",
        textStart = "#151515",
        textEnd = "#FFFFFF",
        textSharpness = 5,
        colorOnset = 0.82,
        font = { fontFamily: "Inter, sans-serif", fontWeight: 700 },
    } = props

    // True on the Framer canvas and during export/SSR. Gating on the canvas
    // alone missed exports, which then rendered the animated path and emitted
    // the un-positioned line.
    const isStatic = useIsStaticRenderer()

    // A scroll-scrubbed line with per-letter rotation is exactly what this query
    // is for. When it is set, the section drops to one screen and simply reads.
    const [reducedMotion, setReducedMotion] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") return
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setReducedMotion(query.matches)
        sync()
        query.addEventListener("change", sync)
        return () => query.removeEventListener("change", sync)
    }, [])

    // Static rendering and reduced motion want the same thing: a plain styled
    // element, nothing scrubbed, no per-letter work.
    const still = isStatic || reducedMotion

    const rootRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const rowRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const letterRefs = useRef<(HTMLSpanElement | null)[]>([])

    const [box, setBox] = useState({ w: 1200, h: 800 })
    const [overflowPx, setOverflowPx] = useState(1)

    const letters = useMemo(
        () => Array.from(text ?? "").map((char) => ({ char, space: char === " " })),
        [text]
    )

    // The Font control hands its value back as a CSS-properties object, but a
    // plain family string is also a valid value. Normalize both, and drop the
    // metrics the scroll math owns so a stray size cannot fight the wave.
    const fontFace = useMemo<CSSProperties>(() => {
        const resolved = typeof font === "string" ? { fontFamily: font } : (font ?? {})
        const { fontSize: _size, letterSpacing: _tracking, lineHeight: _leading, ...face } = resolved
        return face
    }, [font])

    // The control hands back a fresh object on every render. Depend on its
    // contents, not its identity, or the observer below is rebuilt each frame.
    const fontKey = JSON.stringify(fontFace)

    useEffect(() => {
        if (still || typeof ResizeObserver === "undefined") return
        const stage = stageRef.current
        const row = rowRef.current
        if (!stage || !row) return
        const read = () => {
            const r = stage.getBoundingClientRect()
            const next = { w: Math.round(r.width), h: Math.round(r.height) }
            startTransition(() => setBox((p) => (p.w === next.w && p.h === next.h ? p : next)))
            const over = Math.max(row.scrollWidth - Math.round(r.width), 1)
            startTransition(() => setOverflowPx((p) => (p === over ? p : over)))
        }
        read()
        const ro = new ResizeObserver(read)
        ro.observe(stage)
        ro.observe(row)
        return () => ro.disconnect()
    }, [still, letters.length, fontSizeVw, leadPadding, letterSpacing, fontKey])

    // The expand is an absolute run of scroll (a share of the viewport height)
    // added on top of the text travel, so its length never drifts with the
    // length of the sentence.
    const expandPx = Math.max(Math.round(((expandDistance / 100) * (box.h || 800))), 1)
    // Scroll distance is an absolute run of screen-heights, not a multiple of the
    // line's own width. The line always crosses fully within it, so editing the
    // text changes how fast it sweeps rather than how tall the section becomes.
    const travel = still ? 0 : Math.max(Math.round(scrollScreens * (box.h || 800)), 1)
    const expandFrac = clamp01(expandPx / Math.max(travel, 1))

    const paint = useCallback(
        (p: number) => {
            const row = rowRef.current
            if (!row) return
            // Opening slice of the pin expands the panel from a small card to
            // full bleed; the line only starts traveling once that has landed.
            const expand = easeInOutCubic(clamp01(p / Math.max(expandFrac, 0.001)))
            const panelEl = panelRef.current
            if (panelEl) {
                const riseY = ((panelRise / 100) * (box.h || 800)) * (1 - expand)
                panelEl.style.transform = `translateY(${riseY}px) scale(${panelScale + (1 - panelScale) * expand})`
                panelEl.style.borderRadius = `${panelRadius + (panelRadiusEnd - panelRadius) * expand}px`
            }

            const tp = clamp01((p - expandFrac) / Math.max(1 - expandFrac, 0.001))
            const shift = -overflowPx * tp
            row.style.transform = `translate3d(${shift}px, 0, 0)`

            // Hold the opening colors, then turn over during the closing stretch,
            // so the change lands as the line runs out rather than drifting throughout.
            const ramp = easeInOutCubic(clamp01((tp - colorOnset) / Math.max(1 - colorOnset, 0.001)))
            row.style.color = mixColor(textStart, textEnd, sharpen(ramp, textSharpness))
            const panel = panelRef.current
            if (panel) panel.style.background = mixColor(bgStart, bgEnd, ramp)

            const vw = box.w || 1
            const waveLenPx = Math.max((waveLength / 100) * vw, 1)
            const ampPx = (waveHeight / 100) * vw
            const k = (2 * Math.PI) / waveLenPx
            const half = vw / 2

            for (let i = 0; i < letterRefs.current.length; i++) {
                const el = letterRefs.current[i]
                if (!el) continue
                const screenX = el.offsetLeft + shift + el.offsetWidth / 2

                // Standing wave: fixed to the viewport, so the line undulates as it passes.
                const waveY = ampPx * Math.sin(k * screenX)
                const slope = ampPx * k * Math.cos(k * screenX)
                const bank = followWave ? (Math.atan(slope) * 180) / Math.PI : 0

                // Drop into the line over the first slice of its travel.
                // A negative Rise starts above the line, a positive one below it.
                const entry = clamp01((vw - screenX) / Math.max(vw * entryZone, 1))
                const riseY = riseDistance * (1 - easeOutCubic(entry))

                // Full weight and color as it crosses center stage.
                const dist = Math.abs(screenX - half) / half
                const focus = clamp01(1 - dist / Math.max(focusBand, 0.01))
                const scale = 1 + (focusScale - 1) * focus
                const opacity = dimOpacity + (1 - dimOpacity) * focus

                el.style.transform = `translateY(${waveY + riseY}px) rotate(${bank}deg) scale(${scale})`
                el.style.opacity = String(entry <= 0 ? 0 : opacity)
            }
        },
        [overflowPx, box.w, box.h, expandFrac, panelRise, panelScale, panelRadius, panelRadiusEnd, waveHeight, waveLength, followWave, focusBand, focusScale, dimOpacity, riseDistance, entryZone, bgStart, bgEnd, textStart, textEnd, textSharpness, colorOnset]
    )

    // Framer's published pages move the scroll position without dispatching
    // scroll events, so sample the element's own rect on a frame loop instead.
    // An IntersectionObserver starts the loop when the section is near and
    // stops it again once it is well out of the way.
    useEffect(() => {
        if (still) return
        const root = rootRef.current
        if (!root) return
        let frame = 0
        let running = false
        let lastP = -1
        const tick = () => {
            const r = root.getBoundingClientRect()
            const vh = window.innerHeight || 1
            const p = clamp01(-r.top / Math.max(r.height - vh, 1))
            if (Math.abs(p - lastP) > 0.0005) {
                lastP = p
                paint(p)
            }
            frame = requestAnimationFrame(tick)
        }
        const start = () => {
            if (running) return
            running = true
            frame = requestAnimationFrame(tick)
        }
        const stop = () => {
            if (!running) return
            running = false
            cancelAnimationFrame(frame)
        }
        const io = new IntersectionObserver(
            (entries) => (entries.some((en) => en.isIntersecting) ? start() : stop()),
            { rootMargin: "100% 0px" }
        )
        io.observe(root)
        return () => {
            io.disconnect()
            stop()
        }
    }, [still, paint])

    // Paint the opening frame once so the first thing on screen is the
    // composed line rather than an unstyled row. The static path never gets
    // here: it renders the plain fallback below and runs nothing.
    useEffect(() => {
        if (still) return
        paint(0)
    }, [still, paint, letters.length, box.w, box.h])

    return (
        <div ref={rootRef} style={{ ...props.style, position: "relative", height: still ? "100vh" : `calc(100vh + ${travel}px)` }}>
            <div
                ref={stageRef}
                style={{ position: "sticky", top: 0, width: "100%", height: "100vh", overflow: "hidden" }}
            >
                <div
                    ref={panelRef}
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        background: bgStart,
                        borderRadius: still ? panelRadiusEnd : panelRadius,
                        transformOrigin: "center center",
                        overflow: "hidden",
                        willChange: "transform, border-radius",
                    }}
                >
                    <div
                        ref={rowRef}
                        aria-label={text}
                        style={{
                            display: still ? "block" : "flex",
                            alignItems: "center",
                            width: still ? "100%" : "max-content",
                            padding: still ? "0 8vw" : `0 ${leadPadding}vw`,
                            color: textStart,
                            ...fontFace,
                            fontSize: still ? `${Math.min(fontSizeVw, 5)}vw` : `${fontSizeVw}vw`,
                            lineHeight: 1.2,
                            letterSpacing: `${letterSpacing}em`,
                            whiteSpace: still ? "normal" : "nowrap",
                            textAlign: still ? "center" : "start",
                            textWrap: still ? "balance" : "wrap",
                            cursor: "default",
                            willChange: still ? "auto" : "transform",
                        }}
                    >
                        {still ? (
                            text
                        ) : (
                            letters.map((l, i) =>
                            l.space ? (
                                <span
                                    key={i}
                                    aria-hidden="true"
                                    ref={(el) => {
                                        letterRefs.current[i] = el
                                    }}
                                    style={{ display: "inline-block", width: "0.3em", flex: "none" }}
                                />
                            ) : (
                                <span
                                    key={i}
                                    aria-hidden="true"
                                    ref={(el) => {
                                        letterRefs.current[i] = el
                                    }}
                                    style={{
                                        display: "inline-block",
                                        flex: "none",
                                        willChange: "transform, opacity",
                                    }}
                                >
                                    <motion.span
                                        whileHover={{ y: -hoverLift }}
                                        transition={{ type: "spring", stiffness: 480, damping: 20 }}
                                        style={{ display: "inline-block" }}
                                    >
                                        {l.char}
                                    </motion.span>
                                </span>
                                )
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(ScrollingWaveText, {
    /** Everything a buyer needs to make this their own sits above the Advanced
     *  toggle. The tuning knobs below it keep their defaults until asked for. */
    text: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        defaultValue: "Type that travels. Letters that land. Scroll to watch the line move.",
        description: "One line. It scrolls sideways, so length is free.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultFontType: "sans-serif",
        defaultValue: { fontFamily: "Inter, sans-serif", fontWeight: 700 },
        description: "Size and tracking are set below, where the scroll math reads them.",
    },
    fontSizeVw: { type: ControlType.Number, title: "Size", defaultValue: 11, min: 2, max: 30, step: 0.5, unit: "vw" },
    letterSpacing: { type: ControlType.Number, title: "Tracking", defaultValue: -0.02, min: -0.1, max: 0.1, step: 0.005, unit: "em" },
    waveHeight: { type: ControlType.Number, title: "Wave", defaultValue: 3, min: 0, max: 20, step: 0.5, unit: "%", description: "Height of the rise and dip, against the width so it holds its shape on every screen. Zero runs it flat." },
    scrollScreens: { type: ControlType.Number, title: "Scroll Distance", defaultValue: 4, min: 1, max: 12, step: 0.5, description: "How many screens of scrolling the line takes to cross. Stays put when you edit the text." },

    bgStart: { type: ControlType.Color, title: "Background", defaultValue: "#F4F2EE" },
    textStart: { type: ControlType.Color, title: "Text Color", defaultValue: "#151515" },
    bgEnd: { type: ControlType.Color, title: "Background End", defaultValue: "#151515", description: "The section turns over to these two as the line runs out." },
    textEnd: { type: ControlType.Color, title: "Text Color End", defaultValue: "#FFFFFF" },

    showAdvanced: {
        type: ControlType.Boolean,
        title: "Advanced",
        defaultValue: false,
        enabledTitle: "Shown",
        disabledTitle: "Hidden",
        description: "Fine tuning. The defaults are the intended look.",
    },

    /* ---- Advanced: the wave ---- */
    waveLength: { type: ControlType.Number, title: "Wave Length", defaultValue: 62, min: 10, max: 200, step: 1, unit: "%", hidden: (props) => !props.showAdvanced },
    followWave: { type: ControlType.Boolean, title: "Bank To Wave", defaultValue: true, description: "Tilts each letter to the slope it is sitting on.", hidden: (props) => !props.showAdvanced },

    /* ---- Advanced: how letters arrive ---- */
    riseDistance: { type: ControlType.Number, title: "Drop In", defaultValue: -130, min: -500, max: 500, step: 5, unit: "px", description: "Negative drops letters in from above, positive lifts them from below.", hidden: (props) => !props.showAdvanced },
    entryZone: { type: ControlType.Number, title: "Drop Zone", defaultValue: 0.38, min: 0.05, max: 1, step: 0.01, description: "How much of the screen a letter uses to land.", hidden: (props) => !props.showAdvanced },
    leadPadding: { type: ControlType.Number, title: "Lead In", defaultValue: 105, min: 100, max: 200, step: 1, unit: "vw", description: "Empty run before the first letter. Below 100 it starts on screen.", hidden: (props) => !props.showAdvanced },

    /* ---- Advanced: center stage ---- */
    focusBand: { type: ControlType.Number, title: "Focus Width", defaultValue: 0.62, min: 0.05, max: 1, step: 0.01, description: "How wide the fully lit band across the middle is.", hidden: (props) => !props.showAdvanced },
    focusScale: { type: ControlType.Number, title: "Focus Scale", defaultValue: 1.1, min: 1, max: 1.6, step: 0.01, hidden: (props) => !props.showAdvanced },
    dimOpacity: { type: ControlType.Number, title: "Dim", defaultValue: 0.35, min: 0, max: 1, step: 0.05, description: "Opacity of letters outside the focus band.", hidden: (props) => !props.showAdvanced },
    hoverLift: { type: ControlType.Number, title: "Hover Lift", defaultValue: 16, min: 0, max: 80, step: 1, unit: "px", hidden: (props) => !props.showAdvanced },

    /* ---- Advanced: the panel opening ---- */
    panelScale: { type: ControlType.Number, title: "Open From", defaultValue: 0.7, min: 0.2, max: 1, step: 0.01, description: "Panel size before it expands to fill the screen.", hidden: (props) => !props.showAdvanced },
    expandDistance: { type: ControlType.Number, title: "Open Length", defaultValue: 55, min: 10, max: 200, step: 5, unit: "vh", description: "Scroll the panel takes to grow, as a share of the screen.", hidden: (props) => !props.showAdvanced },
    panelRise: { type: ControlType.Number, title: "Open Rise", defaultValue: 10, min: 0, max: 60, step: 1, unit: "vh", hidden: (props) => !props.showAdvanced },
    panelRadius: { type: ControlType.Number, title: "Corners", defaultValue: 80, min: 0, max: 200, step: 1, unit: "px", description: "Radius while the panel is rising.", hidden: (props) => !props.showAdvanced },
    panelRadiusEnd: { type: ControlType.Number, title: "Corners End", defaultValue: 0, min: 0, max: 200, step: 1, unit: "px", description: "Radius once it has arrived. Raise it to stay rounded.", hidden: (props) => !props.showAdvanced },

    /* ---- Advanced: the color turnover ---- */
    colorOnset: { type: ControlType.Number, title: "Turn At", defaultValue: 0.82, min: 0, max: 0.95, step: 0.01, description: "How far along the colors start changing.", hidden: (props) => !props.showAdvanced },
    textSharpness: { type: ControlType.Number, title: "Turn Sharpness", defaultValue: 5, min: 1, max: 8, step: 0.5, description: "Higher moves the text through the crossover faster, protecting contrast.", hidden: (props) => !props.showAdvanced },
})
