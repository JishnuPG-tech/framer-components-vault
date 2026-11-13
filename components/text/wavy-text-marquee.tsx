// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    useRef,
    useEffect,
    useLayoutEffect,
    useState,
    useCallback,
    useMemo,
    startTransition,
    type CSSProperties,
    type PointerEvent as ReactPointerEvent,
} from "react"

/* ═══════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════ */

type WaveType = "sine" | "triangle" | "smooth" | "elastic" | "bounce" | "chaos"
type HoverEffect = "none" | "pause" | "slow" | "reverse"
type PointerMode = "none" | "repel" | "attract"
type OverflowMode = "contain" | "bleed"
type Direction = "left" | "right"

interface Appearance {
    textColor: any
    backgroundColor: any
    uppercase: boolean
    edgeFade: number
}
interface Layout {
    gap: number
    separator: string
    paddingY: number
    overflow: OverflowMode
}
interface Animation {
    speed: number
    direction: Direction
    hoverEffect: HoverEffect
    hoverSpeed: number
    hoverSmoothing: number
}
interface Wave {
    type: WaveType
    amplitude: number
    wavelength: number
    speed: number
    followsHover: boolean
}
interface Distortion {
    intensity: number
    vertical: boolean
    horizontal: boolean
    scale: boolean
    rotation: boolean
    skew: boolean
    perspective: boolean
    opacity: boolean
    colorShift: boolean
    blur: boolean
}
interface Interaction {
    mode: PointerMode
    radius: number
    strength: number
}
interface Advanced {
    respectReducedMotion: boolean
    pauseOffscreen: boolean
}

interface Props {
    text: string
    font: any
    appearance: Appearance
    layout: Layout
    animation: Animation
    wave: Wave
    distortion: Distortion
    interaction: Interaction
    advanced: Advanced
    style?: CSSProperties
}

/** Fully normalized props shared by the static and live renderers. */
interface Normalized {
    text: string
    displayText: string
    chars: string[]
    separator: string
    font: any
    fontStyle: CSSProperties
    fontKey: string
    approxFontSize: number
    approxLineHeight: number
    textColor: string
    bgColor: string
    appearance: Appearance
    layout: Layout
    animation: Animation
    wave: Wave
    distortion: Distortion
    interaction: Interaction
    advanced: Advanced
    style?: CSSProperties
}

/** Per-glyph cache used by the live loop (no React involved). */
interface CharMeta {
    el: HTMLSpanElement
    copy: number
    x: number // glyph center X relative to its item (layout px)
}

/* ═══════════════════════════════════════════════════════════════════════
   Defaults
   ═══════════════════════════════════════════════════════════════════════ */

const DEFAULTS = {
    text: "Creative Agency  •  Bold Design  •  Innovation",
    font: {
        fontFamily: "Inter",
        fontWeight: 700,
        fontSize: 64,
        lineHeight: "1.1em",
    },
    appearance: {
        textColor: "#000000",
        backgroundColor: "transparent",
        uppercase: false,
        edgeFade: 0,
    } as Appearance,
    layout: {
        gap: 80,
        separator: "•",
        paddingY: 20,
        overflow: "contain",
    } as Layout,
    animation: {
        speed: 60,
        direction: "left",
        hoverEffect: "slow",
        hoverSpeed: 12,
        hoverSmoothing: 0.5,
    } as Animation,
    wave: {
        type: "sine",
        amplitude: 20,
        wavelength: 420,
        speed: 2,
        followsHover: true,
    } as Wave,
    distortion: {
        intensity: 1,
        vertical: true,
        horizontal: true,
        scale: true,
        rotation: false,
        skew: true,
        perspective: false,
        opacity: false,
        colorShift: false,
        blur: false,
    } as Distortion,
    interaction: {
        mode: "none",
        radius: 160,
        strength: 30,
    } as Interaction,
    advanced: {
        respectReducedMotion: true,
        pauseOffscreen: true,
    } as Advanced,
}

/* ═══════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════ */

const TWO_PI = Math.PI * 2
const DEG = Math.PI / 180
const MAX_COPIES = 60
const STATIC_VIEWPORT = 1920 // used only to estimate copy count in static mode

const parseToken = (v: any): string =>
    v && typeof v === "object" && "value" in v ? v.value : v

const withDefaults = <T extends object>(d: T, v?: Partial<T> | null): T => ({
    ...d,
    ...(v || {}),
})

const clamp = (n: number, lo: number, hi: number) =>
    n < lo ? lo : n > hi ? hi : n
const r2 = (n: number) => Math.round(n * 100) / 100

/** Normalize the extended Font control into CSS + approximate metrics. */
const getFontStyles = (
    font: any
): { style: CSSProperties; size: number; lineHeight: number } => {
    if (!font) return { style: {}, size: 64, lineHeight: 70 }
    const rawSize = font.fontSize ?? font.size
    const size =
        typeof rawSize === "number"
            ? rawSize
            : parseFloat(String(rawSize)) || 64
    const lhRaw = font.lineHeight
    const lh = typeof lhRaw === "number" ? `${lhRaw}px` : lhRaw
    let lineHeight = size * 1.2
    if (typeof lhRaw === "number") lineHeight = lhRaw
    else if (typeof lhRaw === "string") {
        const n = parseFloat(lhRaw)
        if (!isNaN(n)) {
            if (lhRaw.endsWith("px")) lineHeight = n
            else if (lhRaw.endsWith("%")) lineHeight = (size * n) / 100
            else lineHeight = size * n // em / unitless
        }
    }
    return {
        style: {
            ...font,
            fontSize: rawSize,
            lineHeight: lh,
            fontVariantNumeric: "tabular-nums",
        } as CSSProperties,
        size,
        lineHeight,
    }
}

/** Normalize all incoming props once; shared by both renderers. */
function normalizeProps(props: Props): Normalized {
    const text = props.text ?? DEFAULTS.text
    const font = props.font ?? DEFAULTS.font
    const appearance = withDefaults(DEFAULTS.appearance, props.appearance)
    const layout = withDefaults(DEFAULTS.layout, props.layout)
    const animation = withDefaults(DEFAULTS.animation, props.animation)
    const wave = withDefaults(DEFAULTS.wave, props.wave)
    const distortion = withDefaults(DEFAULTS.distortion, props.distortion)
    const interaction = withDefaults(DEFAULTS.interaction, props.interaction)
    const advanced = withDefaults(DEFAULTS.advanced, props.advanced)
    const displayText = appearance.uppercase ? text.toUpperCase() : text
    const f = getFontStyles(font)
    return {
        text,
        displayText,
        chars: Array.from(displayText), // emoji-safe
        separator: (layout.separator || "").trim(),
        font,
        fontStyle: f.style,
        fontKey: JSON.stringify(font ?? {}),
        approxFontSize: f.size,
        approxLineHeight: f.lineHeight,
        textColor: parseToken(appearance.textColor),
        bgColor: parseToken(appearance.backgroundColor),
        appearance,
        layout,
        animation,
        wave,
        distortion,
        interaction,
        advanced,
        style: props.style,
    }
}

/* ── Easings / waves ─────────────────────────────────────────────────── */

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2

const elasticOut = (t: number) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    const c4 = TWO_PI / 3
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

const bounceOut = (t: number) => {
    const n1 = 7.5625
    const d1 = 2.75
    if (t < 1 / d1) return n1 * t * t
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
    return n1 * (t -= 2.625 / d1) * t + 0.984375
}

/** All wave types normalized to [-1, 1] so padding math is exact. */
function waveValue(phase: number, type: WaveType): number {
    switch (type) {
        case "triangle": {
            const t = phase / TWO_PI - Math.floor(phase / TWO_PI)
            return 4 * Math.abs(t - 0.5) - 1
        }
        case "smooth":
            return easeInOutSine((Math.sin(phase) + 1) / 2) * 2 - 1
        case "elastic":
            return clamp(
                Math.sin(phase) * elasticOut((Math.sin(phase * 0.5) + 1) / 2),
                -1,
                1
            )
        case "bounce":
            return Math.sin(phase) * bounceOut((Math.sin(phase * 0.5) + 1) / 2)
        case "chaos":
            return (
                (Math.sin(phase) +
                    Math.sin(phase * 2.1 + 1.3) * 0.5 +
                    Math.sin(phase * 0.7 - 0.8) * 0.3) /
                1.8
            )
        case "sine":
        default:
            return Math.sin(phase)
    }
}

/* ── Glyph math shared by static pose & live loop ────────────────────── */

interface Glyph {
    tx: number
    ty: number
    sc: number
    rot: number
    sk: number
    rx: number
    ry: number
    w1: number
    w2: number
    w3: number
}

function computeGlyph(
    x: number,
    t: number,
    k: number,
    amp: number,
    type: WaveType,
    d: Distortion
): Glyph {
    const I = d.intensity
    const p = x * k
    const w1 = waveValue(p + t, type)
    const w2 = waveValue(p * 0.7 + t * 1.3 + 1.7, type)
    const w3 = waveValue(p * 1.4 - t * 0.6 + 0.6, type)
    return {
        tx: d.horizontal ? w2 * amp * 0.4 * I : 0,
        ty: d.vertical ? w1 * amp * I : 0,
        sc: d.scale ? 1 + w1 * 0.2 * I : 1,
        rot: d.rotation ? w1 * 12 * I : 0,
        sk: d.skew ? w2 * 8 * I : 0,
        rx: d.perspective ? w3 * 20 * I : 0,
        ry: d.perspective ? w2 * 15 * I : 0,
        w1,
        w2,
        w3,
    }
}

function glyphTransform(g: Glyph, perspective: boolean): string {
    const base = `translate3d(${r2(g.tx)}px,${r2(g.ty)}px,0) rotate(${r2(
        g.rot
    )}deg) skewX(${r2(g.sk)}deg) scale(${r2(g.sc)})`
    return perspective
        ? `perspective(600px) rotateX(${r2(g.rx)}deg) rotateY(${r2(g.ry)}deg) ${base}`
        : base
}

function glyphFilter(g: Glyph, d: Distortion): string {
    const I = d.intensity
    let f = ""
    if (d.colorShift) {
        f = `hue-rotate(${r2(g.w1 * 40 * I)}deg) saturate(${Math.round(
            100 + g.w2 * 30 * I
        )}%) brightness(${Math.round(100 + g.w3 * 15 * I)}%)`
    }
    if (d.blur) {
        const b = Math.abs(g.w1) * 3 * I
        if (b > 0.1) f += ` blur(${r2(b)}px)`
    }
    return f
}

function glyphOpacity(g: Glyph, d: Distortion): string {
    return d.opacity
        ? String(clamp(1 - (g.w3 + 1) * 0.3 * d.intensity, 0.05, 1))
        : ""
}

/** How far glyphs can travel outside the text line (vertical safe area). */
function computeExcursion(
    lineHeight: number,
    wave: Wave,
    d: Distortion,
    inter: Interaction
): number {
    const I = d.intensity
    let e = 0
    if (d.vertical) e += wave.amplitude * I
    if (d.scale) e += lineHeight * 0.5 * 0.2 * I
    if (d.rotation) {
        const th = 12 * I * DEG
        e += Math.max(
            0,
            lineHeight * 0.5 * (0.9 * Math.sin(th) + Math.cos(th) - 1)
        )
    }
    if (d.perspective) e += lineHeight * 0.25 * I
    if (d.blur) e += 6 * I
    if (inter.mode !== "none") e += inter.strength
    return Math.ceil(e + 4)
}

const edgeMask = (fade: number) =>
    fade > 0
        ? `linear-gradient(to right, transparent 0, #000 ${fade}px, #000 calc(100% - ${fade}px), transparent 100%)`
        : undefined

const visuallyHidden: CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
    border: 0,
}

const itemStyle: CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    whiteSpace: "nowrap",
}

/* ═══════════════════════════════════════════════════════════════════════
   Reduced-motion hook
   ═══════════════════════════════════════════════════════════════════════ */

function usePrefersReducedMotion(enabled: boolean) {
    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        if (!enabled || typeof window === "undefined" || !window.matchMedia) {
            setReduced(false)
            return
        }
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => startTransition(() => setReduced(mq.matches))
        update()
        mq.addEventListener?.("change", update)
        return () => mq.removeEventListener?.("change", update)
    }, [enabled])
    return reduced
}

/* ═══════════════════════════════════════════════════════════════════════
   Static renderer — canvas / export / thumbnail / reduced motion.
   Pure JSX: no effects, no observers, no rAF, no pointer handling.
   ═══════════════════════════════════════════════════════════════════════ */

function StaticMarquee({ n }: { n: Normalized }) {
    const {
        chars,
        separator,
        fontStyle,
        approxFontSize,
        approxLineHeight,
        textColor,
        bgColor,
        appearance,
        layout,
        wave,
        distortion,
        interaction,
        style,
    } = n

    // Rough metrics — only used to place a believable frozen pose.
    const advance = approxFontSize * 0.58
    const estItemWidth =
        chars.length * advance + Math.max(layout.gap, separator ? advance : 0)
    const copies = clamp(
        Math.ceil(STATIC_VIEWPORT / Math.max(estItemWidth, 1)) + 1,
        2,
        MAX_COPIES
    )

    const excursion = computeExcursion(
        approxLineHeight,
        wave,
        distortion,
        interaction
    )
    const bleedMode = layout.overflow === "bleed"
    const bleed = bleedMode ? excursion : 0
    const padTop = layout.paddingY + (bleedMode ? 0 : excursion)
    const k = TWO_PI / Math.max(wave.wavelength, 10)
    const mask = edgeMask(Math.max(0, appearance.edgeFade))

    const glyphStyle = (x: number): CSSProperties => {
        const g = computeGlyph(x, 0, k, wave.amplitude, wave.type, distortion)
        const filter = glyphFilter(g, distortion)
        const opacity = glyphOpacity(g, distortion)
        return {
            display: "inline-block",
            transform: glyphTransform(g, distortion.perspective),
            filter: filter || undefined,
            opacity: opacity || undefined,
        }
    }

    const renderItem = (copy: number, posed: boolean) => {
        const base = copy * estItemWidth
        return (
            <div key={copy} style={itemStyle}>
                {chars.map((ch, i) =>
                    ch === " " ? (
                        <span key={i} style={{ display: "inline-block" }}>
                            {"\u00A0"}
                        </span>
                    ) : (
                        <span
                            key={i}
                            style={
                                posed
                                    ? glyphStyle(base + i * advance)
                                    : { display: "inline-block" }
                            }
                        >
                            {ch}
                        </span>
                    )
                )}
                <span
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: Math.max(0, layout.gap),
                        flexShrink: 0,
                    }}
                >
                    {separator ? (
                        <span
                            style={
                                posed
                                    ? glyphStyle(base + chars.length * advance)
                                    : { display: "inline-block" }
                            }
                        >
                            {separator}
                        </span>
                    ) : null}
                </span>
            </div>
        )
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                boxSizing: "border-box",
                padding: `${padTop}px 0`,
                backgroundColor: bgColor,
                ...style,
            }}
        >
            <span style={visuallyHidden}>{n.displayText}</span>

            {/* In-flow sizer defines the auto height */}
            <div
                aria-hidden
                style={{
                    width: "100%",
                    overflow: "hidden",
                    visibility: "hidden",
                    pointerEvents: "none",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        width: "max-content",
                        ...fontStyle,
                    }}
                >
                    {renderItem(0, false)}
                </div>
            </div>

            {/* Frozen preview */}
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: -bleed,
                    bottom: -bleed,
                    overflow: "hidden",
                    pointerEvents: "none",
                    maskImage: mask,
                    WebkitMaskImage: mask,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: bleed + padTop,
                        display: "flex",
                        whiteSpace: "nowrap",
                        color: textColor,
                        ...fontStyle,
                    }}
                >
                    {Array.from({ length: copies }, (_, i) =>
                        renderItem(i, true)
                    )}
                </div>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════════
   Live renderer — preview & published site only.
   ═══════════════════════════════════════════════════════════════════════ */

function LiveMarquee({ n }: { n: Normalized }) {
    const {
        displayText,
        chars,
        separator,
        fontStyle,
        fontKey,
        approxLineHeight,
        textColor,
        bgColor,
        appearance,
        layout,
        animation,
        wave,
        distortion,
        interaction,
        advanced,
        style,
    } = n

    /* ── Refs & measurement ───────────────────────────────────────────── */
    const rootRef = useRef<HTMLDivElement>(null)
    const sizerRef = useRef<HTMLDivElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const charsRef = useRef<CharMeta[]>([])

    const [itemWidth, setItemWidth] = useState(0)
    const [itemHeight, setItemHeight] = useState(0)
    const [containerWidth, setContainerWidth] = useState(0)
    const sizeRef = useRef({ iw: 0, ih: 0, cw: 0 })

    const stateRef = useRef({
        pos: 0,
        time: 0,
        speed: 0,
        hover: false,
        pointerInside: false,
        pointerMix: 0,
        px: 0,
        py: 0,
    })

    useLayoutEffect(() => {
        const root = rootRef.current
        const sizer = sizerRef.current
        if (!root || !sizer) return

        const commit = (iw: number, ih: number, cw: number) => {
            const s = sizeRef.current
            if (
                Math.abs(s.iw - iw) <= 0.25 &&
                Math.abs(s.ih - ih) <= 0.25 &&
                Math.abs(s.cw - cw) <= 0.25
            )
                return
            s.iw = iw
            s.ih = ih
            s.cw = cw
            startTransition(() => {
                setItemWidth(iw)
                setItemHeight(ih)
                setContainerWidth(cw)
            })
        }

        commit(sizer.offsetWidth, sizer.offsetHeight, root.clientWidth)

        if (typeof ResizeObserver === "undefined") {
            const onResize = () =>
                commit(sizer.offsetWidth, sizer.offsetHeight, root.clientWidth)
            window.addEventListener("resize", onResize)
            return () => window.removeEventListener("resize", onResize)
        }

        const ro = new ResizeObserver((entries) => {
            let { iw, ih, cw } = sizeRef.current
            for (const e of entries) {
                if (e.target === sizer) {
                    iw = e.contentRect.width
                    ih = e.contentRect.height
                } else if (e.target === root) {
                    cw = e.contentRect.width
                }
            }
            commit(iw, ih, cw)
        })
        ro.observe(sizer)
        ro.observe(root)
        return () => ro.disconnect()
    }, [])

    const copies = useMemo(() => {
        if (itemWidth < 1 || containerWidth < 1) return 3
        return clamp(Math.ceil(containerWidth / itemWidth) + 2, 3, MAX_COPIES)
    }, [itemWidth, containerWidth])

    const excursion = useMemo(
        () =>
            computeExcursion(
                itemHeight || approxLineHeight,
                wave,
                distortion,
                interaction
            ),
        [itemHeight, approxLineHeight, wave, distortion, interaction]
    )

    const bleedMode = layout.overflow === "bleed"
    const bleed = bleedMode ? excursion : 0
    const padTop = layout.paddingY + (bleedMode ? 0 : excursion)

    /* ── Live config (refs so the loop never restarts) ────────────────── */
    const liveRef = useRef({
        speed: 0,
        dirMul: -1,
        hoverEffect: "none" as HoverEffect,
        hoverSpeed: 0,
        k: 10,
        waveType: "sine" as WaveType,
        amp: 0,
        waveK: 0,
        waveSpeed: 0,
        followsHover: true,
        distortion: DEFAULTS.distortion,
        interaction: DEFAULTS.interaction,
        padTop: 0,
    })
    useLayoutEffect(() => {
        liveRef.current = {
            speed: Math.max(0, animation.speed),
            dirMul: animation.direction === "right" ? 1 : -1,
            hoverEffect: animation.hoverEffect,
            hoverSpeed: Math.max(0, animation.hoverSpeed),
            k: 2 + (1 - clamp(animation.hoverSmoothing, 0, 1)) * 22,
            waveType: wave.type,
            amp: wave.amplitude,
            waveK: TWO_PI / Math.max(wave.wavelength, 10),
            waveSpeed: wave.speed,
            followsHover: wave.followsHover,
            distortion,
            interaction,
            padTop,
        }
    })

    /* ── Cache glyph elements + local offsets ─────────────────────────── */
    useLayoutEffect(() => {
        const track = trackRef.current
        if (!track) return
        const metas: CharMeta[] = []
        const items = track.children
        for (let c = 0; c < items.length; c++) {
            const spans = (
                items[c] as HTMLElement
            ).querySelectorAll<HTMLSpanElement>("[data-char]")
            spans.forEach((el) =>
                metas.push({
                    el,
                    copy: c,
                    x: el.offsetLeft + el.offsetWidth / 2,
                })
            )
        }
        charsRef.current = metas
    }, [
        displayText,
        separator,
        copies,
        layout.gap,
        itemWidth,
        itemHeight,
        fontKey,
    ])

    /* ── Frame step: pure DOM writes ──────────────────────────────────── */
    const step = useCallback((dt: number) => {
        const track = trackRef.current
        if (!track) return
        const cfg = liveRef.current
        const s = stateRef.current
        const { iw, ih, cw } = sizeRef.current

        let targetSpeed = cfg.speed
        if (s.hover) {
            switch (cfg.hoverEffect) {
                case "pause":
                    targetSpeed = 0
                    break
                case "slow":
                    targetSpeed = cfg.hoverSpeed
                    break
                case "reverse":
                    targetSpeed = -cfg.speed
                    break
            }
        }

        if (dt > 0) {
            s.speed += (targetSpeed - s.speed) * (1 - Math.exp(-dt * cfg.k))
            s.pointerMix +=
                ((s.pointerInside ? 1 : 0) - s.pointerMix) *
                (1 - Math.exp(-dt * 10))
            s.pos += s.speed * dt * cfg.dirMul
            const rate =
                cfg.followsHover && cfg.speed > 0
                    ? Math.max(Math.abs(s.speed / cfg.speed), 0.15)
                    : 1
            s.time += dt * cfg.waveSpeed * rate
        } else {
            s.speed = targetSpeed
        }

        // Modular wrap – valid for both directions and negative speed.
        if (iw > 0) s.pos = ((s.pos % iw) - iw) % iw
        track.style.transform = `translate3d(${r2(s.pos)}px,0,0)`

        const list = charsRef.current
        if (!list.length) return

        const d = cfg.distortion
        const inter = cfg.interaction
        const pointerOn = inter.mode !== "none" && s.pointerMix > 0.001
        const margin = 120
        const cy = cfg.padTop + ih / 2

        for (let i = 0; i < list.length; i++) {
            const m = list[i]
            const x = m.copy * iw + m.x + s.pos
            if (iw > 0 && cw > 0 && (x < -margin || x > cw + margin)) continue

            const g = computeGlyph(
                x,
                s.time,
                cfg.waveK,
                cfg.amp,
                cfg.waveType,
                d
            )

            if (pointerOn) {
                const dx = x - s.px
                const dy = cy - s.py
                const dist = Math.hypot(dx, dy)
                if (dist < inter.radius) {
                    let f = 1 - dist / inter.radius
                    f = f * f * (3 - 2 * f) * s.pointerMix
                    const dir = inter.mode === "attract" ? -1 : 1
                    const inv = dist > 0.001 ? 1 / dist : 0
                    g.tx += dx * inv * f * inter.strength * dir * 0.5
                    g.ty += dy * inv * f * inter.strength * dir
                    g.sc += f * inter.strength * 0.004
                }
            }

            const st = m.el.style
            st.transform = glyphTransform(g, d.perspective)
            st.filter = glyphFilter(g, d)
            st.opacity = glyphOpacity(g, d)
        }
    }, [])

    /* ── Animation loop with off-screen pausing ───────────────────────── */
    useEffect(() => {
        const root = rootRef.current
        let raf = 0
        let prev = 0
        let running = false

        const tick = (now: number) => {
            if (!running) return
            const dt = prev ? Math.min((now - prev) / 1000, 0.05) : 0
            prev = now
            step(dt)
            raf = requestAnimationFrame(tick)
        }
        const start = () => {
            if (running) return
            running = true
            prev = 0
            raf = requestAnimationFrame(tick)
        }
        const stop = () => {
            running = false
            cancelAnimationFrame(raf)
        }

        let io: IntersectionObserver | undefined
        if (
            advanced.pauseOffscreen &&
            root &&
            typeof IntersectionObserver !== "undefined"
        ) {
            io = new IntersectionObserver(
                ([entry]) => (entry.isIntersecting ? start() : stop()),
                { rootMargin: "120px" }
            )
            io.observe(root)
        } else {
            start()
        }

        return () => {
            stop()
            io?.disconnect()
        }
    }, [advanced.pauseOffscreen, step])

    /* ── Pointer handling (refs only) ─────────────────────────────────── */
    const updatePointer = useCallback((e: ReactPointerEvent) => {
        const root = rootRef.current
        if (!root) return
        const r = root.getBoundingClientRect()
        const sx = r.width ? root.offsetWidth / r.width : 1
        const sy = r.height ? root.offsetHeight / r.height : 1
        stateRef.current.px = (e.clientX - r.left) * sx
        stateRef.current.py = (e.clientY - r.top) * sy
    }, [])

    const onPointerEnter = useCallback(
        (e: ReactPointerEvent) => {
            const s = stateRef.current
            if (e.pointerType === "mouse") s.hover = true
            s.pointerInside = true
            updatePointer(e)
        },
        [updatePointer]
    )
    const onPointerLeave = useCallback(() => {
        const s = stateRef.current
        s.hover = false
        s.pointerInside = false
    }, [])

    /* ── Render ───────────────────────────────────────────────────────── */
    const charStyle: CSSProperties = useMemo(
        () => ({
            display: "inline-block",
            willChange: "transform",
            transformStyle: distortion.perspective ? "preserve-3d" : undefined,
            backfaceVisibility: distortion.perspective ? "hidden" : undefined,
        }),
        [distortion.perspective]
    )

    const renderItem = (copy: number) => (
        <div key={copy} style={itemStyle}>
            {chars.map((ch, i) =>
                ch === " " ? (
                    <span key={i} style={{ display: "inline-block" }}>
                        {"\u00A0"}
                    </span>
                ) : (
                    <span key={i} data-char style={charStyle}>
                        {ch}
                    </span>
                )
            )}
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: Math.max(0, layout.gap),
                    flexShrink: 0,
                }}
            >
                {separator ? (
                    <span data-char style={charStyle}>
                        {separator}
                    </span>
                ) : null}
            </span>
        </div>
    )

    const mask = edgeMask(Math.max(0, appearance.edgeFade))

    return (
        <div
            ref={rootRef}
            onPointerEnter={onPointerEnter}
            onPointerMove={updatePointer}
            onPointerLeave={onPointerLeave}
            style={{
                position: "relative",
                width: "100%",
                boxSizing: "border-box",
                padding: `${padTop}px 0`,
                backgroundColor: bgColor,
                cursor: "default",
                ...style,
            }}
        >
            <span style={visuallyHidden}>{displayText}</span>

            <div
                aria-hidden
                style={{
                    width: "100%",
                    overflow: "hidden",
                    visibility: "hidden",
                    pointerEvents: "none",
                }}
            >
                <div
                    ref={sizerRef}
                    style={{
                        display: "flex",
                        width: "max-content",
                        ...fontStyle,
                    }}
                >
                    {renderItem(0)}
                </div>
            </div>

            <div
                aria-hidden
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: -bleed,
                    bottom: -bleed,
                    overflow: "hidden",
                    pointerEvents: "none",
                    maskImage: mask,
                    WebkitMaskImage: mask,
                }}
            >
                <div
                    ref={trackRef}
                    style={{
                        position: "absolute",
                        left: 0,
                        top: bleed + padTop,
                        display: "flex",
                        whiteSpace: "nowrap",
                        willChange: "transform",
                        color: textColor,
                        ...fontStyle,
                    }}
                >
                    {Array.from({ length: copies }, (_, i) => renderItem(i))}
                </div>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════════
   Entry component
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 120
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function WavyMarquee(props: Props) {
    // Static on the canvas, during export and for thumbnails.
    const isStatic = useIsStaticRenderer()
    const n = normalizeProps(props)
    const reducedMotion = usePrefersReducedMotion(
        n.advanced.respectReducedMotion
    )

    if (isStatic || reducedMotion) return <StaticMarquee n={n} />
    return <LiveMarquee n={n} />
}

WavyMarquee.displayName = "Wavy Marquee"
WavyMarquee.defaultProps = { ...DEFAULTS }

/* ═══════════════════════════════════════════════════════════════════════
   Property Controls
   ═══════════════════════════════════════════════════════════════════════ */

addPropertyControls(WavyMarquee, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: DEFAULTS.text,
        displayTextArea: true,
        placeholder: "Type something…",
    },
    font: {
        //@ts-ignore
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        displayFontSize: true,
        displayTextAlignment: false,
        defaultFontType: "sans-serif",
        defaultValue: DEFAULTS.font,
    },

    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        icon: "color",
        controls: {
            textColor: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: DEFAULTS.appearance.textColor,
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: DEFAULTS.appearance.backgroundColor,
            },
            uppercase: {
                type: ControlType.Boolean,
                title: "Case",
                defaultValue: false,
                enabledTitle: "Upper",
                disabledTitle: "As-is",
            },
            edgeFade: {
                type: ControlType.Number,
                title: "Edge Fade",
                defaultValue: 0,
                min: 0,
                max: 300,
                step: 10,
                unit: "px",
                description: "Fades the left and right edges.",
            },
        },
    },

    layout: {
        type: ControlType.Object,
        title: "Layout",
        icon: "object",
        controls: {
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: DEFAULTS.layout.gap,
                min: 0,
                max: 400,
                step: 5,
                unit: "px",
            },
            separator: {
                type: ControlType.String,
                title: "Separator",
                defaultValue: DEFAULTS.layout.separator,
                placeholder: "• / — / ✦",
                description: "Glyph placed in the gap between repeats.",
            },
            paddingY: {
                type: ControlType.Number,
                title: "Padding Y",
                defaultValue: DEFAULTS.layout.paddingY,
                min: 0,
                max: 200,
                unit: "px",
            },
            overflow: {
                type: ControlType.Enum,
                title: "Overflow",
                defaultValue: DEFAULTS.layout.overflow,
                options: ["contain", "bleed"],
                optionTitles: ["Contain", "Bleed"],
                displaySegmentedControl: true,
                description:
                    "*Contain* adds safe padding so letters never clip. *Bleed* keeps the layout tight and lets letters overflow the box.",
            },
        },
    },

    animation: {
        type: ControlType.Object,
        title: "Scroll",
        icon: "effect",
        controls: {
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: DEFAULTS.animation.speed,
                min: 0,
                max: 600,
                step: 5,
                unit: "px/s",
            },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                defaultValue: DEFAULTS.animation.direction,
                options: ["left", "right"],
                optionTitles: ["← Left", "→ Right"],
                displaySegmentedControl: true,
            },
            hoverEffect: {
                type: ControlType.Enum,
                title: "On Hover",
                defaultValue: DEFAULTS.animation.hoverEffect,
                options: ["none", "pause", "slow", "reverse"],
                optionTitles: ["None", "Pause", "Slow Down", "Reverse"],
            },
            hoverSpeed: {
                type: ControlType.Number,
                title: "Hover Speed",
                defaultValue: DEFAULTS.animation.hoverSpeed,
                min: 0,
                max: 200,
                step: 2,
                unit: "px/s",
                hidden: (p) => p.hoverEffect !== "slow",
            },
            hoverSmoothing: {
                type: ControlType.Number,
                title: "Smoothing",
                defaultValue: DEFAULTS.animation.hoverSmoothing,
                min: 0,
                max: 1,
                step: 0.05,
                hidden: (p) => p.hoverEffect === "none",
                description: "How softly the speed changes on hover.",
            },
        },
    },

    wave: {
        type: ControlType.Object,
        title: "Wave",
        icon: "effect",
        controls: {
            type: {
                type: ControlType.Enum,
                title: "Type",
                defaultValue: DEFAULTS.wave.type,
                options: [
                    "sine",
                    "triangle",
                    "smooth",
                    "elastic",
                    "bounce",
                    "chaos",
                ],
                optionTitles: [
                    "Sine",
                    "Triangle",
                    "Smooth",
                    "Elastic",
                    "Bounce",
                    "Chaos",
                ],
            },
            amplitude: {
                type: ControlType.Number,
                title: "Amplitude",
                defaultValue: DEFAULTS.wave.amplitude,
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
            },
            wavelength: {
                type: ControlType.Number,
                title: "Wavelength",
                defaultValue: DEFAULTS.wave.wavelength,
                min: 40,
                max: 2000,
                step: 10,
                unit: "px",
                description: "Distance between wave peaks on screen.",
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: DEFAULTS.wave.speed,
                min: 0,
                max: 10,
                step: 0.1,
            },
            followsHover: {
                type: ControlType.Boolean,
                title: "On Hover",
                defaultValue: true,
                enabledTitle: "Slows",
                disabledTitle: "Keeps",
                description:
                    "Whether the wave slows down together with the scroll on hover.",
            },
        },
    },

    distortion: {
        type: ControlType.Object,
        title: "Distortion",
        icon: "effect",
        controls: {
            intensity: {
                type: ControlType.Number,
                title: "Intensity",
                defaultValue: 1,
                min: 0,
                max: 3,
                step: 0.1,
                description: "Global multiplier for all effects.",
            },
            vertical: {
                type: ControlType.Boolean,
                title: "Vertical",
                defaultValue: true,
            },
            horizontal: {
                type: ControlType.Boolean,
                title: "Horizontal",
                defaultValue: true,
            },
            scale: {
                type: ControlType.Boolean,
                title: "Scale",
                defaultValue: true,
            },
            rotation: {
                type: ControlType.Boolean,
                title: "Rotation",
                defaultValue: false,
            },
            skew: {
                type: ControlType.Boolean,
                title: "Skew",
                defaultValue: true,
            },
            perspective: {
                type: ControlType.Boolean,
                title: "3D",
                defaultValue: false,
                description: "Perspective tilt on X/Y.",
            },
            opacity: {
                type: ControlType.Boolean,
                title: "Opacity",
                defaultValue: false,
            },
            colorShift: {
                type: ControlType.Boolean,
                title: "Color Shift",
                defaultValue: false,
                description: "Hue / saturation / brightness wave.",
            },
            blur: {
                type: ControlType.Boolean,
                title: "Blur",
                defaultValue: false,
                description: "Heavier on the GPU – use sparingly.",
            },
        },
    },

    interaction: {
        type: ControlType.Object,
        title: "Pointer",
        icon: "interact",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Effect",
                defaultValue: DEFAULTS.interaction.mode,
                options: ["none", "repel", "attract"],
                optionTitles: ["None", "Repel", "Attract"],
                displaySegmentedControl: true,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: DEFAULTS.interaction.radius,
                min: 20,
                max: 600,
                step: 10,
                unit: "px",
                hidden: (p) => p.mode === "none",
            },
            strength: {
                type: ControlType.Number,
                title: "Strength",
                defaultValue: DEFAULTS.interaction.strength,
                min: 0,
                max: 150,
                step: 5,
                unit: "px",
                hidden: (p) => p.mode === "none",
            },
        },
    },

    advanced: {
        type: ControlType.Object,
        title: "Advanced",
        icon: "boolean",
        controls: {
            respectReducedMotion: {
                type: ControlType.Boolean,
                title: "Reduced Motion",
                defaultValue: true,
                enabledTitle: "Respect",
                disabledTitle: "Ignore",
                description:
                    "Shows a static version for users who prefer reduced motion.",
            },
            pauseOffscreen: {
                type: ControlType.Boolean,
                title: "Offscreen",
                defaultValue: true,
                enabledTitle: "Pause",
                disabledTitle: "Run",
                description:
                    "Stops the animation loop while scrolled out of view.",
            },
        },
    },
})
