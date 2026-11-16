import { startTransition, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView } from "framer-motion"

type SplitBy = "character" | "word" | "line"
type Easing = "spring" | "bounce" | "smooth" | "snappy" | "gentle"
type Trigger = "onView" | "onMount" | "hover" | "loop" | "onScroll" | "sectionInView"
type Order = "forward" | "reverse" | "center" | "random"
type Origin = "center" | "top" | "bottom" | "left" | "right"

/**
 * Effects beyond plain transforms. `transform` is the default path; the rest either
 * add animated CSS properties (chroma/shine/neon/wipe) or need their own renderer
 * (scramble/type mutate content, liquid/dissolve drive an SVG filter).
 */
type EffectKind =
    | "transform"
    | "scramble"
    | "type"
    | "liquid"
    | "dissolve"
    | "chroma"
    | "shine"
    | "neon"
    | "wipe"
    | "melt"

/** Preset ids double as the dropdown values — keep them short, they are the public API. */
type Preset =
    | "fade" | "rise" | "drop" | "slide"
    | "split" | "blur" | "focus"
    | "mask" | "curtain" | "unfold" | "wipe" | "roll"
    | "pop" | "punch" | "zoom" | "shrink" | "stretch"
    | "flip" | "swivel" | "tilt" | "spin" | "shear"
    | "glitch" | "wave" | "cascade" | "scatter"
    | "scramble" | "type" | "liquid" | "dissolve" | "chroma" | "shine" | "neon"
    | "explode" | "vortex" | "warp" | "melt"
    | "custom"

interface Motion {
    splitBy: SplitBy
    effect: EffectKind
    /** Magnitude for the effect-driven presets — px offset, glow radius, brightness peak, etc. */
    amount: number
    /** Turbulence grain, 0–100. Low reads as a slow liquid wave, high as fine sand. */
    detail: number
    /** Decay exponent for the turbulence. Lower lingers, higher snaps to rest. */
    settle: number
    /** Per-token random spread on x/y/rotate. 0 means every token starts identically. */
    chaos: number
    /** Depth the token flies in from, in px behind the screen. */
    z: number
    x: number
    y: number
    opacity: number
    blur: number
    scale: number
    scaleX: number
    scaleY: number
    rotate: number
    rotateX: number
    rotateY: number
    skewX: number
    origin: Origin
    /** Reveal from behind a clipping box. `y` is then read as a percentage. */
    clip: boolean
    order: Order
    duration: number
    stagger: number
    easing: Easing
}

/** Every preset is a diff against this, so the table below stays readable. */
const BASE: Motion = {
    splitBy: "word",
    effect: "transform",
    amount: 0,
    detail: 10,
    settle: 1.8,
    chaos: 0,
    z: 0,
    x: 0,
    y: 0,
    opacity: 0,
    blur: 0,
    scale: 1,
    scaleX: 1,
    scaleY: 1,
    rotate: 0,
    rotateX: 0,
    rotateY: 0,
    skewX: 0,
    origin: "center",
    clip: false,
    order: "forward",
    duration: 0.7,
    stagger: 0.03,
    easing: "smooth",
}

/** 37 recipes, grouped by family. "custom" is absent — it falls through to the props. */
const PRESETS: Record<Exclude<Preset, "custom">, Partial<Motion>> = {
    // Movement
    fade: { y: 18, duration: 0.6, stagger: 0.04 },
    rise: { splitBy: "line", y: 80, duration: 0.8, stagger: 0.12, easing: "spring" },
    drop: { splitBy: "character", y: -60, duration: 0.7, stagger: 0.02, easing: "spring" },
    slide: { x: -60, duration: 0.7, stagger: 0.05 },

    // Softness
    split: { splitBy: "character", y: 48, blur: 8, duration: 0.7, stagger: 0.02, easing: "spring" },
    blur: { blur: 14, duration: 0.9, stagger: 0.06 },
    focus: { splitBy: "character", blur: 18, scale: 1.15, duration: 0.8, stagger: 0.02 },

    // Reveal
    mask: { splitBy: "line", clip: true, y: 100, duration: 0.9, stagger: 0.12, easing: "snappy" },
    curtain: { clip: true, y: 100, duration: 0.7, stagger: 0.05, easing: "snappy" },
    unfold: { splitBy: "line", rotateX: -80, origin: "top", duration: 0.9, stagger: 0.1, easing: "gentle" },
    /** Diagonal clip sweep — the clip does the revealing, so nothing fades. */
    wipe: { splitBy: "line", effect: "wipe", amount: 22, opacity: 1, duration: 0.9, stagger: 0.12, easing: "snappy" },
    /** Odometer roll: clipped box + a hinge at the bottom edge. */
    roll: { splitBy: "character", clip: true, y: 100, rotateX: -90, origin: "bottom", duration: 0.7, stagger: 0.03, easing: "snappy" },

    // Scale
    pop: { splitBy: "character", scale: 0.4, duration: 0.6, stagger: 0.025, easing: "snappy" },
    punch: { splitBy: "line", scale: 0.8, y: 20, duration: 0.5, stagger: 0.08, easing: "bounce" },
    zoom: { splitBy: "line", scale: 1.6, blur: 10, duration: 0.9, stagger: 0.1 },
    shrink: { splitBy: "character", scale: 2.2, duration: 0.6, stagger: 0.02, easing: "snappy" },
    /** Non-uniform squash — the only preset that scales the axes independently. */
    stretch: { splitBy: "character", scaleX: 0.3, scaleY: 1.8, duration: 0.7, stagger: 0.025, easing: "spring" },

    // Rotation
    flip: { rotateX: 90, duration: 0.8, stagger: 0.06, easing: "gentle" },
    swivel: { rotateY: 90, duration: 0.8, stagger: 0.06, easing: "gentle" },
    tilt: { splitBy: "character", rotate: -12, y: 30, duration: 0.7, stagger: 0.025, easing: "spring" },
    spin: { splitBy: "character", rotate: 180, scale: 0.5, duration: 0.7, stagger: 0.03, easing: "snappy" },
    shear: { skewX: 20, x: 30, duration: 0.6, stagger: 0.05, easing: "snappy" },

    // Sequencing
    glitch: { splitBy: "character", x: 14, skewX: -18, duration: 0.35, stagger: 0.012, easing: "snappy", order: "random" },
    wave: { splitBy: "character", y: 30, duration: 0.7, stagger: 0.035, easing: "spring", order: "center" },
    cascade: { splitBy: "character", y: 40, duration: 0.7, stagger: 0.025, order: "reverse" },
    scatter: { splitBy: "character", y: 40, x: 20, rotate: 20, duration: 0.8, stagger: 0.03, easing: "spring", order: "random" },

    // Signature — these need machinery beyond transforms
    /** Glyphs churn, then land on the real character. Opacity stays 1: the churn is the reveal. */
    scramble: { splitBy: "character", effect: "scramble", opacity: 1, duration: 0.4, stagger: 0.035 },
    /** Characters appear one at a time behind a caret. */
    type: { splitBy: "character", effect: "type", opacity: 1, duration: 0.01, stagger: 0.045 },
    /** Low-frequency turbulence: a slow wobble. Long and slow-settling — the wobble is the point. */
    liquid: { splitBy: "line", effect: "liquid", amount: 70, detail: 10, settle: 1.3, duration: 2.4, stagger: 0.18 },
    /** High-frequency turbulence: fine grain that reassembles into letterforms. */
    dissolve: { effect: "dissolve", amount: 150, detail: 76, settle: 2.2, duration: 1.2, stagger: 0.06 },
    /** Chromatic aberration — the red/cyan fringes converge. */
    chroma: { splitBy: "character", effect: "chroma", amount: 14, duration: 0.7, stagger: 0.02, easing: "snappy" },
    /** Staggered brightness peak reads as a highlight sweeping across the line. */
    shine: { splitBy: "character", effect: "shine", amount: 2.8, duration: 0.5, stagger: 0.03 },
    /** Glow blooms and tightens onto the glyph. */
    neon: { effect: "neon", amount: 18, duration: 0.9, stagger: 0.07 },

    // Extravagant — the loud end of the pack
    /** Every glyph arrives from its own random direction and converges. */
    explode: { splitBy: "character", chaos: 1, scale: 0.3, blur: 4, duration: 1.1, stagger: 0.015, easing: "spring", order: "random" },
    /** Two full turns, collapsing in from nothing, on a scattered radius. */
    vortex: { splitBy: "character", chaos: 0.55, rotate: 720, scale: 0, duration: 1.2, stagger: 0.03, easing: "spring" },
    /** Real depth: words hurtle in from far behind the screen, swivelling. */
    warp: { z: -900, rotateY: 65, blur: 12, duration: 1, stagger: 0.08, origin: "left" },
    /** Turbulence stretched into wide vertical columns — the text drips into place. */
    melt: { splitBy: "line", effect: "melt", amount: 95, detail: 6, settle: 1.2, duration: 2.3, stagger: 0.15 },
}

/** Dropdown order and labels. One punchy word each. */
const PRESET_OPTIONS: Preset[] = [
    "fade", "rise", "drop", "slide",
    "split", "blur", "focus",
    "mask", "curtain", "unfold", "wipe", "roll",
    "pop", "punch", "zoom", "shrink", "stretch",
    "flip", "swivel", "tilt", "spin", "shear",
    "glitch", "wave", "cascade", "scatter",
    "scramble", "type", "liquid", "dissolve", "chroma", "shine", "neon",
    "explode", "vortex", "warp", "melt",
    "custom",
]

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const PRESET_TITLES = PRESET_OPTIONS.map(titleCase)

/** Dots for the demo panel — every baked preset, "Custom" excluded since it has no fixed recipe to preview. */
const DEMO_PRESETS = PRESET_OPTIONS.filter((p): p is Exclude<Preset, "custom"> => p !== "custom")

const EASING: Record<Easing, object> = {
    /** Critically damped — natural spring deceleration with no overshoot. */
    spring: { type: "spring", bounce: 0 },
    /** The only genuinely bouncy option, used deliberately by the Punch preset. */
    bounce: { type: "spring", bounce: 0.55 },
    smooth: { ease: [0.22, 1, 0.36, 1] },
    snappy: { ease: [0.16, 1, 0.3, 1] },
    gentle: { ease: [0.4, 0, 0.2, 1] },
}

const ORIGIN: Record<Origin, string> = {
    center: "50% 50%",
    top: "50% 0%",
    bottom: "50% 100%",
    left: "0% 50%",
    right: "100% 50%",
}

type DemoAlign = "left" | "center" | "right"
type DemoPosition = "below" | "above"

/** Cross-axis placement of the panel within the component, and how its rows justify. */
const DEMO_ALIGN_SELF: Record<DemoAlign, CSSProperties["alignSelf"]> = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
}
const DEMO_JUSTIFY: Record<DemoAlign, CSSProperties["justifyContent"]> = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
}

/**
 * Every motion field is optional: unset means "use the preset's own value".
 * Framer clears the stored value when a control is `optional` with no defaultValue,
 * so an untouched knob genuinely arrives as undefined.
 */
interface TextMotionProps {
    text: string
    preset: Preset
    splitBy?: SplitBy | "auto"
    x?: number
    y?: number
    opacity?: number
    blur?: number
    scale?: number
    rotate?: number
    rotateX?: number
    rotateY?: number
    skewX?: number
    origin?: Origin | "auto"
    clip?: boolean
    order?: Order | "auto"
    duration?: number
    stagger?: number
    easing?: Easing | "auto"
    trigger: Trigger
    delay: number
    replay: boolean
    threshold: number
    loopDelay: number
    effect?: EffectKind | "auto"
    amount?: number
    detail?: number
    settle?: number
    chaos?: number
    z?: number
    intensity?: number
    scaleX?: number
    scaleY?: number
    demoPanel: boolean
    demoAutoPlay: boolean
    demoAutoInterval: number
    demoDotSize: number
    demoGap: number
    demoSpacing: number
    demoColor: string
    demoInactiveOpacity: number
    demoAlign: DemoAlign
    demoPosition: DemoPosition
    useCustomFont: boolean
    font: CSSProperties
    textColor?: string
    madeByKollinaStudio?: string
    style?: CSSProperties
}

/** Split text into lines, then into the animated units for that mode. */
function tokenize(text: string, splitBy: SplitBy): string[][] {
    const lines = text.split("\n")
    if (splitBy === "line") return lines.map((line) => [line])
    return lines.map((line) => line.split(/(\s+)/).filter((t) => t.length > 0))
}

/** Deterministic, so server, client and canvas all agree on the same "random". */
function pseudoRandom(n: number): number {
    const x = Math.sin((n + 1) * 12.9898) * 43758.5453
    return x - Math.floor(x)
}

/** Where a token sits in the stagger queue, which is not always its position in the text. */
function staggerIndex(i: number, total: number, order: Order): number {
    switch (order) {
        case "reverse":
            return total - 1 - i
        case "center":
            return Math.abs(i - (total - 1) / 2)
        case "random":
            return pseudoRandom(i) * total
        default:
            return i
    }
}

/** A unit is either whitespace, a single animated token, or a word split into chars. */
interface Unit {
    unit: string
    index: number
    isSpace: boolean
    chars: { c: string; index: number }[] | null
}

const SCRAMBLE_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@$*<>/\\[]{}"

/** `i` drives the stagger queue; `seed` is the token's fixed identity for chaos. */
interface TokenCustom {
    i: number
    seed: number
}

/** Resolves which engine a preset runs on, so effect-only sub-controls know when to appear. */
function presetEffect(p: Preset | undefined, propEffect?: EffectKind): EffectKind {
    if (!p) return "transform"
    if (p === "custom") return propEffect ?? "transform"
    return (PRESETS[p]?.effect as EffectKind) ?? "transform"
}

const usesTurbulenceEffect = (e: EffectKind) => e === "liquid" || e === "dissolve" || e === "melt"

/** Turbulence frequency from a friendly 0–100 dial. Squared so the low end has resolution. */
function detailToFrequency(detail: number, effect: EffectKind): string {
    const f = Math.max(Math.pow(detail / 100, 2) * 1.2, 0.0005)
    /** Liquid stretches the noise horizontally; melt stretches it hard into vertical columns. */
    if (effect === "liquid") return `${f.toFixed(4)} ${(f * 1.8).toFixed(4)}`
    if (effect === "melt") return `${(f * 0.25).toFixed(4)} ${(f * 6).toFixed(4)}`
    return `${f.toFixed(4)} ${f.toFixed(4)}`
}

/**
 * One filter string shape for every state, so framer-motion always interpolates
 * number-for-number. Dropping a function between keyframes makes it bail to a snap.
 */
function filterString(blurPx: number, brightness: number, glowPx: number, glowColor: string): string {
    return `blur(${blurPx}px) brightness(${brightness}) drop-shadow(0 0 ${glowPx}px ${glowColor})`
}

/** Both keyframes carry the same two shadows so only the numbers move. */
function chromaShadow(offset: number, alpha: number): string {
    return `${offset}px 0 0 rgba(255,0,80,${alpha}), ${-offset}px 0 0 rgba(0,255,255,${alpha})`
}

/** Four-point polygon in both states — matching point counts keep the clip interpolable. */
function wipeClip(progress: 0 | 1, skew: number): string {
    return progress === 0
        ? `polygon(0% 0%, 0% 0%, ${-skew}% 100%, 0% 100%)`
        : `polygon(0% 0%, ${100 + skew}% 0%, 100% 100%, 0% 100%)`
}

/**
 * Text Motion
 *
 * Animates text in by character, word, or line. 37 presets, or switch to
 * Custom to expose every motion parameter. Turn on the Demo Panel to preview
 * every preset live from a row of dots under the text.
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 120
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TextMotion(props: TextMotionProps) {
    const {
        text = "Text animations that\nyou’ll gonna remembers.",
        preset = "split",
        trigger = "onView",
        delay = 0,
        replay = true,
        threshold = 0.4,
        loopDelay = 1.2,
        demoPanel = false,
        demoAutoPlay = false,
        demoAutoInterval = 2,
        demoDotSize = 8,
        demoGap = 5,
        demoSpacing = 34,
        demoColor = "#FFFFFF",
        demoInactiveOpacity = 0.3,
        demoAlign = "center",
        demoPosition = "below",
        useCustomFont = false,
        font,
        textColor,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const shouldForceVisiblePreview = isStatic || isCanvas
    const ref = useRef<HTMLDivElement>(null)
    const [hovered, setHovered] = useState(false)
    const [cycle, setCycle] = useState(0)
    const [sectionVisible, setSectionVisible] = useState(false)
    const [scrollTriggered, setScrollTriggered] = useState(false)
    const scrollTriggeredRef = useRef(false)
    /** Set the first time a demo dot is clicked. Once set, it overrides the Preset control. */
    const [demoPreset, setDemoPreset] = useState<Preset | null>(null)

    const inView = useInView(ref, { amount: threshold, once: !replay })

    /** Only lets the demo pick win while the panel is actually shown, so hiding it reverts to the Preset control. */
    const activePreset = demoPanel ? demoPreset ?? preset : preset

    /** A demo dot picks the preset and forces a fresh play, independent of Trigger. */
    const handleDemoSelect = (p: Preset) => {
        if (p === activePreset) return
        startTransition(() => {
            setDemoPreset(p)
            setCycle((c) => c + 1)
        })
    }

    /** Preset wins unless the user switched to Custom. */
    const m: Motion = useMemo(() => {
        /** Custom starts from a neutral character-split recipe; presets start from their own. */
        const base: Motion =
            activePreset === "custom"
                ? { ...BASE, splitBy: "character", y: 40, easing: "spring" }
                : { ...BASE, ...PRESETS[activePreset] }

        /** An enum left on "auto" defers to the preset, same as an untouched number. */
        const pick = <T,>(v: T | "auto" | undefined, fallback: T): T =>
            v === undefined || v === "auto" ? fallback : v

        /**
         * One dial instead of ten. Intensity scales every magnitude the preset moves,
         * so a preset keeps its character and only gets louder or quieter.
         * Scales are ratios around 1, so their distance from rest is what scales.
         */
        const k = props.intensity ?? 1
        const ratio = (v: number) => 1 + (v - 1) * k

        return {
            splitBy: pick(props.splitBy, base.splitBy),
            effect: pick(props.effect, base.effect),
            amount: (props.amount ?? base.amount) * k,
            detail: props.detail ?? base.detail,
            settle: props.settle ?? base.settle,
            chaos: (props.chaos ?? base.chaos) * k,
            z: (props.z ?? base.z) * k,
            x: (props.x ?? base.x) * k,
            y: (props.y ?? base.y) * k,
            opacity: props.opacity ?? base.opacity,
            blur: (props.blur ?? base.blur) * k,
            scale: ratio(props.scale ?? base.scale),
            scaleX: ratio(props.scaleX ?? base.scaleX),
            scaleY: ratio(props.scaleY ?? base.scaleY),
            rotate: (props.rotate ?? base.rotate) * k,
            rotateX: (props.rotateX ?? base.rotateX) * k,
            rotateY: (props.rotateY ?? base.rotateY) * k,
            skewX: (props.skewX ?? base.skewX) * k,
            origin: pick(props.origin, base.origin),
            clip: props.clip ?? base.clip,
            order: pick(props.order, base.order),
            duration: props.duration ?? base.duration,
            stagger: props.stagger ?? base.stagger,
            easing: pick(props.easing, base.easing),
        }
    }, [
        activePreset, props.intensity, props.splitBy, props.effect, props.amount, props.detail, props.settle, props.chaos, props.z,
        props.x, props.y, props.opacity, props.blur, props.scale, props.scaleX, props.scaleY,
        props.rotate, props.rotateX, props.rotateY, props.skewX, props.origin, props.clip,
        props.order, props.duration, props.stagger, props.easing,
    ])

    const lines = useMemo(() => tokenize(text, m.splitBy), [text, m.splitBy])

    /** Flat running index so stagger is continuous across lines and words. */
    const indexed = useMemo<Unit[][]>(() => {
        let i = 0
        return lines.map((units) =>
            units.map((unit) => {
                const isSpace = /^\s+$/.test(unit)
                if (isSpace) return { unit, index: -1, isSpace, chars: null }
                if (m.splitBy === "character") {
                    return { unit, index: -1, isSpace, chars: Array.from(unit).map((c) => ({ c, index: i++ })) }
                }
                return { unit, index: i++, isSpace, chars: null }
            })
        )
    }, [lines, m.splitBy])

    const totalUnits = useMemo(() => {
        let n = 0
        for (const units of indexed) {
            for (const u of units) {
                if (u.isSpace) continue
                n += u.chars ? u.chars.length : 1
            }
        }
        return Math.max(n, 1)
    }, [indexed])

    useEffect(() => {
        scrollTriggeredRef.current = scrollTriggered
    }, [scrollTriggered])

    /** Loop re-mounts the tree on a timer so the whole stagger replays. */
    useEffect(() => {
        if (trigger !== "loop" || isStatic) return
        const cycleMs = (delay + m.duration + m.stagger * totalUnits + loopDelay) * 1000
        const id = window.setInterval(() => startTransition(() => setCycle((c) => c + 1)), cycleMs)
        return () => window.clearInterval(id)
    }, [trigger, isStatic, delay, m.duration, m.stagger, totalUnits, loopDelay])

    /** Section in View uses the nearest section-like ancestor, or this layer as fallback. */
    useEffect(() => {
        if (trigger !== "sectionInView" || isStatic) return
        if (typeof window === "undefined") return
        const node = ref.current
        if (!node) return

        const sectionLike =
            node.closest("section, main, article, [role='region'], [data-framer-section], [data-framer-name*='Section']") ?? node

        const observer = new window.IntersectionObserver(
            (entries) => {
                const next = entries[0]?.isIntersecting ?? false
                startTransition(() => setSectionVisible(next))
            },
            { threshold }
        )

        observer.observe(sectionLike)
        return () => observer.disconnect()
    }, [trigger, isStatic, threshold])

    /** On Scroll replays the entrance on discrete scroll events (throttled). */
    useEffect(() => {
        if (trigger !== "onScroll" || isStatic) return
        if (typeof window === "undefined") return

        let lastTick = 0
        const throttleMs = 180

        const onScroll = () => {
            const now = Date.now()
            if (now - lastTick < throttleMs) return
            lastTick = now

            if (!replay && scrollTriggeredRef.current) return
            scrollTriggeredRef.current = true
            startTransition(() => setScrollTriggered(true))
            startTransition(() => setCycle((c) => c + 1))
        }

        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [trigger, isStatic, replay])

    /** Left/Right steps through the Demo Panel's presets — only wired up while the panel is on. */
    useEffect(() => {
        if (!demoPanel || isStatic) return
        if (typeof window === "undefined") return

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
            const target = e.target as HTMLElement | null
            if (target?.isContentEditable) return
            if (target && /^(input|textarea|select)$/i.test(target.tagName)) return

            e.preventDefault()
            const delta = e.key === "ArrowRight" ? 1 : -1
            const currentIndex = DEMO_PRESETS.indexOf(activePreset as (typeof DEMO_PRESETS)[number])
            const nextIndex = (currentIndex + delta + DEMO_PRESETS.length) % DEMO_PRESETS.length
            handleDemoSelect(DEMO_PRESETS[nextIndex])
        }

        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [demoPanel, isStatic, activePreset])

    /** Read inside the interval without depending on it, so Auto Play never restarts its own countdown mid-cycle. */
    const activePresetRef = useRef(activePreset)
    useEffect(() => {
        activePresetRef.current = activePreset
    }, [activePreset])

    /** Auto Play walks the whole set on a timer — same wrap-around as the arrow keys. */
    useEffect(() => {
        if (!demoPanel || !demoAutoPlay || isStatic) return
        if (typeof window === "undefined") return

        const id = window.setInterval(() => {
            const currentIndex = DEMO_PRESETS.indexOf(activePresetRef.current as (typeof DEMO_PRESETS)[number])
            const nextIndex = (currentIndex + 1 + DEMO_PRESETS.length) % DEMO_PRESETS.length
            startTransition(() => {
                setDemoPreset(DEMO_PRESETS[nextIndex])
                setCycle((c) => c + 1)
            })
        }, Math.max(demoAutoInterval, 0.1) * 1000)

        return () => window.clearInterval(id)
    }, [demoPanel, demoAutoPlay, isStatic, demoAutoInterval])

    const playing =
        shouldForceVisiblePreview ||
        /** A manual demo pick, or Auto Play, always plays — regardless of Trigger — but only while the panel is shown. */
        (demoPanel && (demoPreset !== null || demoAutoPlay)) ||
        trigger === "onMount" ||
        trigger === "loop" ||
        (trigger === "onScroll" && scrollTriggered) ||
        (trigger === "onView" && inView) ||
        (trigger === "sectionInView" && sectionVisible) ||
        (trigger === "hover" && hovered)

    /** Content-mutating and SVG-filter effects need a wall clock; transforms do not. */
    const usesClock = m.effect === "scramble" || m.effect === "type" || usesTurbulenceEffect(m.effect)
    const [elapsed, setElapsed] = useState(0)
    const displaceRef = useRef<SVGFEDisplacementMapElement>(null)
    const filterId = `tm-${useId().replace(/:/g, "")}`

    /** Restart the clock whenever a fresh play begins. */
    useEffect(() => {
        if (!usesClock) return
        setElapsed(shouldForceVisiblePreview ? 9999 : 0)
    }, [usesClock, cycle, activePreset, shouldForceVisiblePreview])

    useEffect(() => {
        if (!usesClock || shouldForceVisiblePreview || !playing) return
        if (typeof window === "undefined") return

        const start = performance.now()
        let raf = 0
        const total = delay + m.duration + m.stagger * totalUnits

        const step = () => {
            const t = (performance.now() - start) / 1000
            /** Drive the SVG filter imperatively — no re-render per frame. */
            if (displaceRef.current) {
                const p = Math.min(t / Math.max(total, 0.01), 1)
                const eased = Math.pow(1 - p, m.settle)
                displaceRef.current.setAttribute("scale", String(m.amount * eased))
            }
            setElapsed(t)
            if (t < total + 0.1) raf = window.requestAnimationFrame(step)
        }
        raf = window.requestAnimationFrame(step)
        return () => window.cancelAnimationFrame(raf)
    }, [usesClock, shouldForceVisiblePreview, playing, cycle, activePreset, delay, m.duration, m.stagger, m.amount, m.settle, totalUnits])

    const isChroma = m.effect === "chroma"
    const isShine = m.effect === "shine"
    const isNeon = m.effect === "neon"
    const isWipe = m.effect === "wipe"
    const glowColor = textColor ?? "currentColor"

    /** Signed −1..1 from a token's seed, so each glyph gets a stable direction of its own. */
    const spread = (seed: number, salt: number) => (pseudoRandom(seed * 3 + salt) - 0.5) * 2

    const variants = {
        /** A function so `chaos` can give every token its own start, not just its own delay. */
        hidden: ({ seed }: TokenCustom) => ({
            opacity: m.opacity,
            /** Chaos is px, so it cannot mix with the percentage offsets a clip mask uses. */
            x: m.x + (m.chaos && !m.clip ? spread(seed, 1) * m.chaos * 240 : 0),
            /** Under a clip mask the offset is a share of the line box, not pixels. */
            y: m.clip ? `${m.y}%` : m.y + (m.chaos ? spread(seed, 2) * m.chaos * 200 : 0),
            z: m.z,
            scale: m.scale,
            scaleX: m.scaleX,
            scaleY: m.scaleY,
            rotate: m.rotate + (m.chaos ? spread(seed, 3) * m.chaos * 160 : 0),
            rotateX: m.rotateX,
            rotateY: m.rotateY,
            skewX: m.skewX,
            /** Per-element, so 3D survives the nested word wrappers. */
            transformPerspective: 800,
            filter: filterString(m.blur, isShine ? m.amount : 1, isNeon ? m.amount : 0, glowColor),
            ...(isChroma ? { textShadow: chromaShadow(m.amount, 0.9) } : null),
            ...(isWipe ? { clipPath: wipeClip(0, m.amount) } : null),
        }),
        visible: ({ i }: TokenCustom) => ({
            opacity: 1,
            x: 0,
            y: m.clip ? "0%" : 0,
            z: 0,
            scale: 1,
            scaleX: 1,
            scaleY: 1,
            rotate: 0,
            rotateX: 0,
            rotateY: 0,
            skewX: 0,
            transformPerspective: 800,
            filter: filterString(0, 1, 0, glowColor),
            ...(isChroma ? { textShadow: chromaShadow(0, 0) } : null),
            ...(isWipe ? { clipPath: wipeClip(1, m.amount) } : null),
            transition: {
                ...EASING[m.easing],
                duration: m.duration,
                delay: delay + i * m.stagger,
            },
        }),
    }

    const tokenStyle: CSSProperties = {
        display: "inline-block",
        transformOrigin: ORIGIN[m.origin],
        willChange: "transform, filter, opacity",
    }

    /** The mask box. Padding/negative-margin keeps descenders from being sliced. */
    const clipStyle: CSSProperties = {
        display: "inline-block",
        overflow: "hidden",
        verticalAlign: "bottom",
        paddingBottom: "0.15em",
        marginBottom: "-0.15em",
    }

    const isFilled = style?.width === "100%"

    /** Liquid and Dissolve distort the whole text block, so the filter goes on a wrapper. */
    const usesTurbulence = usesTurbulenceEffect(m.effect)
    const turbulenceWrapStyle: CSSProperties = usesTurbulence
        ? { filter: `url(#${filterId})`, willChange: "filter" }
        : {}

    const isScramble = m.effect === "scramble"
    const isType = m.effect === "type"

    /**
     * For the content-driven effects, swap what the token renders based on the clock:
     * before its turn a scramble token shows a junk glyph and a type token shows nothing.
     */
    const contentFor = (content: string, orderIdx: number): string => {
        if (!isScramble && !isType) return content
        if (shouldForceVisiblePreview) return content
        const revealAt = delay + orderIdx * m.stagger
        if (elapsed >= revealAt) return content
        if (isType) return ""
        /** Re-roll roughly every 45ms, offset per token so they do not churn in lockstep. */
        const seed = Math.floor(elapsed / 0.045) + orderIdx
        return SCRAMBLE_GLYPHS[Math.floor(pseudoRandom(seed) * SCRAMBLE_GLYPHS.length)]
    }

    const renderToken = (content: string, index: number, key: number | string) => {
        const orderIdx = staggerIndex(index, totalUnits, m.order)
        const shown = contentFor(content, orderIdx)
        const token = (
            <motion.span
                key={m.clip ? undefined : key}
                custom={{ i: orderIdx, seed: index }}
                variants={variants}
                initial={shouldForceVisiblePreview ? "visible" : "hidden"}
                animate={shouldForceVisiblePreview || playing ? "visible" : "hidden"}
                style={tokenStyle}
            >
                {/* Keep the box occupied while a Type token is still empty, so nothing reflows. */}
                {shown === "" ? <span style={{ visibility: "hidden" }}>{content}</span> : shown}
            </motion.span>
        )
        if (!m.clip) return token
        return (
            <span key={key} style={clipStyle}>
                {token}
            </span>
        )
    }

    const demoPanelEl = demoPanel && (
        <div
            key="demo-panel"
            role="group"
            aria-label="Preset demo"
            style={{
                display: "flex",
                /** Always a single row — the row is free to grow as wide as it needs. */
                flexWrap: "nowrap",
                justifyContent: DEMO_JUSTIFY[demoAlign],
                alignItems: "center",
                gap: demoGap,
                marginTop: demoPosition === "below" ? demoSpacing : 0,
                marginBottom: demoPosition === "above" ? demoSpacing : 0,
                alignSelf: DEMO_ALIGN_SELF[demoAlign],
            }}
        >
            {DEMO_PRESETS.map((p) => {
                const isActive = p === activePreset
                return (
                    <button
                        key={p}
                        type="button"
                        onClick={() => handleDemoSelect(p)}
                        aria-label={titleCase(p)}
                        aria-pressed={isActive}
                        style={{
                            display: "block",
                            flexShrink: 0,
                            width: demoDotSize,
                            height: demoDotSize,
                            padding: 0,
                            margin: 0,
                            border: "none",
                            borderRadius: "50%",
                            /** Defaults to white, independent of Text Color — the panel is UI chrome, not part of the copy. */
                            background: demoColor,
                            /** Same size for every dot — the active one is only brighter. */
                            opacity: isActive ? 1 : demoInactiveOpacity,
                            cursor: "pointer",
                            transition: "opacity 0.2s ease",
                        }}
                    />
                )
            })}
        </div>
    )

    return (
        <div
            ref={ref}
            onMouseEnter={isStatic ? undefined : () => startTransition(() => setHovered(true))}
            onMouseLeave={isStatic ? undefined : () => startTransition(() => setHovered(false))}
            style={{
                ...style,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                /** Inherit the surrounding type unless the designer overrides it. */
                font: useCustomFont ? undefined : "inherit",
                ...(useCustomFont ? font : null),
                /** Always fall back to inherit, so a custom font never lands as black on black. */
                color: textColor ?? "inherit",
                ...(isFilled ? null : { minWidth: "max-content" }),
            }}
        >
            {demoPosition === "above" && demoPanelEl}

            {usesTurbulence && (
                <svg
                    aria-hidden="true"
                    focusable="false"
                    style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
                >
                    <filter id={filterId} colorInterpolationFilters="sRGB">
                        <feTurbulence
                            type="fractalNoise"
                            /** Low frequency reads as a liquid wave; high frequency as fine grain. */
                            baseFrequency={detailToFrequency(m.detail, m.effect)}
                            numOctaves={m.effect === "liquid" ? 2 : 1}
                            seed={7}
                            result="noise"
                        />
                        <feDisplacementMap
                            ref={displaceRef}
                            in="SourceGraphic"
                            in2="noise"
                            scale={shouldForceVisiblePreview ? 0 : m.amount}
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>
                </svg>
            )}

            <div style={turbulenceWrapStyle}>
            {indexed.map((units, li) => (
                <div key={`${cycle}-${li}`} style={{ display: "block", whiteSpace: "pre-wrap" }}>
                    {units.map((u, ui) => {
                        if (u.isSpace) return <span key={ui}>{u.unit}</span>
                        if (u.chars) {
                            return (
                                <span key={ui} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
                                    {u.chars.map(({ c, index }, ci) => renderToken(c, index, ci))}
                                </span>
                            )
                        }
                        return renderToken(u.unit, u.index, ui)
                    })}
                </div>
            ))}
            </div>

            {demoPosition === "below" && demoPanelEl}
        </div>
    )
}

/** Motion parameters are only meaningful once the preset is set to Custom. */
const hideUnlessCustom = (p: Partial<TextMotionProps>) => p.preset !== "custom"

/** Demo Panel settings are only meaningful once the panel is switched on. */
const hideUnlessDemo = (p: Partial<TextMotionProps>) => !p.demoPanel

addPropertyControls(TextMotion, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Text animations that\nyou’ll gonna remembers.",
        displayTextArea: true,
        placeholder: "Type your copy…",
    },
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        defaultValue: "split",
        options: PRESET_OPTIONS,
        optionTitles: PRESET_TITLES,
    },
    demoPanel: {
        type: ControlType.Boolean,
        title: "Demo Panel",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    demoAutoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        defaultValue: false,
        hidden: hideUnlessDemo,
    },
    demoAutoInterval: {
        type: ControlType.Number,
        title: "Auto Interval",
        defaultValue: 2,
        min: 0.5,
        max: 10,
        step: 0.1,
        unit: "s",
        hidden: (p: Partial<TextMotionProps>) => !p.demoPanel || !p.demoAutoPlay,
    },
    demoPosition: {
        type: ControlType.Enum,
        title: "Position",
        defaultValue: "below",
        options: ["above", "below"],
        optionTitles: ["Above", "Below"],
        displaySegmentedControl: true,
        hidden: hideUnlessDemo,
    },
    demoAlign: {
        type: ControlType.Enum,
        title: "Align",
        defaultValue: "center",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
        hidden: hideUnlessDemo,
    },
    demoDotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 8,
        min: 4,
        max: 20,
        step: 1,
        unit: "px",
        hidden: hideUnlessDemo,
    },
    demoGap: {
        type: ControlType.Number,
        title: "Dot Gap",
        defaultValue: 5,
        min: 0,
        max: 30,
        step: 1,
        unit: "px",
        hidden: hideUnlessDemo,
    },
    demoSpacing: {
        type: ControlType.Number,
        title: "Panel Spacing",
        defaultValue: 34,
        min: 0,
        step: 1,
        unit: "px",
        hidden: hideUnlessDemo,
    },
    demoColor: {
        type: ControlType.Color,
        title: "Panel Color",
        defaultValue: "#FFFFFF",
        hidden: hideUnlessDemo,
    },
    demoInactiveOpacity: {
        type: ControlType.Number,
        title: "Inactive Opacity",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: hideUnlessDemo,
    },

    /**
     * Per-preset sub-controls, kept deliberately short: three knobs for most presets,
     * five for the turbulence ones. Everything is optional or "auto", so an untouched
     * knob defers to the preset. The long tail of individual dimensions lives in Custom.
     */
    intensity: {
        type: ControlType.Number,
        title: "Intensity",
        description: "Scales everything the preset moves. 1 is the preset as designed.",
        optional: true,
        min: 0,
        max: 3,
        step: 0.05,
    },
    duration: { type: ControlType.Number, title: "Duration", optional: true, min: 0.05, max: 8, step: 0.05, unit: "s" },
    stagger: { type: ControlType.Number, title: "Stagger", optional: true, min: 0, max: 0.4, step: 0.005, unit: "s" },

    /** Turbulence-only, because grain and decay have no meaning anywhere else. */
    detail: {
        type: ControlType.Number,
        title: "Detail",
        description: "Turbulence grain. Low is a slow liquid wave, high is fine sand.",
        optional: true,
        min: 1,
        max: 100,
        step: 1,
        hidden: (p) => !usesTurbulenceEffect(presetEffect(p.preset, p.effect as EffectKind)),
    },
    settle: {
        type: ControlType.Number,
        title: "Settle",
        description: "How fast the turbulence decays. Lower lingers, higher snaps to rest.",
        optional: true,
        min: 0.4,
        max: 5,
        step: 0.1,
        hidden: (p) => !usesTurbulenceEffect(presetEffect(p.preset, p.effect as EffectKind)),
    },

    /** Custom-only from here — the full parameter set, hidden behind the Custom preset. */
    effect: {
        type: ControlType.Enum,
        title: "Effect",
        defaultValue: "auto",
        options: ["auto", "transform", "scramble", "type", "liquid", "dissolve", "melt", "chroma", "shine", "neon", "wipe"],
        optionTitles: ["Auto", "Transform", "Scramble", "Type", "Liquid", "Dissolve", "Melt", "Chroma", "Shine", "Neon", "Wipe"],
        hidden: hideUnlessCustom,
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        defaultValue: "auto",
        options: ["auto", "spring", "bounce", "smooth", "snappy", "gentle"],
        optionTitles: ["Auto", "Spring", "Bounce", "Smooth", "Snappy", "Gentle"],
        hidden: hideUnlessCustom,
    },
    splitBy: {
        type: ControlType.Enum,
        title: "Split By",
        defaultValue: "auto",
        options: ["auto", "character", "word", "line"],
        optionTitles: ["Auto", "Char", "Word", "Line"],
        displaySegmentedControl: true,
        hidden: hideUnlessCustom,
    },
    order: {
        type: ControlType.Enum,
        title: "Order",
        defaultValue: "auto",
        options: ["auto", "forward", "reverse", "center", "random"],
        optionTitles: ["Auto", "Forward", "Reverse", "Center", "Random"],
        hidden: hideUnlessCustom,
    },
    origin: {
        type: ControlType.Enum,
        title: "Origin",
        defaultValue: "auto",
        options: ["auto", "center", "top", "bottom", "left", "right"],
        optionTitles: ["Auto", "Center", "Top", "Bottom", "Left", "Right"],
        hidden: hideUnlessCustom,
    },
    amount: { type: ControlType.Number, title: "Amount", optional: true, min: 0, max: 300, step: 1, hidden: hideUnlessCustom },
    chaos: { type: ControlType.Number, title: "Chaos", description: "Per-glyph random spread.", optional: true, min: 0, max: 2, step: 0.05, hidden: hideUnlessCustom },
    z: { type: ControlType.Number, title: "Depth", optional: true, min: -2000, max: 2000, step: 10, unit: "px", hidden: hideUnlessCustom },
    y: { type: ControlType.Number, title: "Distance Y", optional: true, min: -300, max: 300, step: 1, unit: "px", hidden: hideUnlessCustom },
    x: { type: ControlType.Number, title: "Distance X", optional: true, min: -300, max: 300, step: 1, unit: "px", hidden: hideUnlessCustom },
    blur: { type: ControlType.Number, title: "Blur", optional: true, min: 0, max: 40, step: 1, unit: "px", hidden: hideUnlessCustom },
    scale: { type: ControlType.Number, title: "Scale", optional: true, min: 0, max: 3, step: 0.05, hidden: hideUnlessCustom },
    scaleX: { type: ControlType.Number, title: "Scale X", optional: true, min: 0, max: 3, step: 0.05, hidden: hideUnlessCustom },
    scaleY: { type: ControlType.Number, title: "Scale Y", optional: true, min: 0, max: 3, step: 0.05, hidden: hideUnlessCustom },
    rotate: { type: ControlType.Number, title: "Rotate", optional: true, min: -720, max: 720, step: 1, unit: "°", hidden: hideUnlessCustom },
    rotateX: { type: ControlType.Number, title: "Flip X", optional: true, min: -180, max: 180, step: 1, unit: "°", hidden: hideUnlessCustom },
    rotateY: { type: ControlType.Number, title: "Flip Y", optional: true, min: -180, max: 180, step: 1, unit: "°", hidden: hideUnlessCustom },
    skewX: { type: ControlType.Number, title: "Skew", optional: true, min: -60, max: 60, step: 1, unit: "°", hidden: hideUnlessCustom },
    opacity: { type: ControlType.Number, title: "Start Opacity", optional: true, min: 0, max: 1, step: 0.05, hidden: hideUnlessCustom },
    clip: { type: ControlType.Boolean, title: "Mask", optional: true, hidden: hideUnlessCustom },

    /** Always visible */
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        defaultValue: "onView",
        options: ["onView", "sectionInView", "onScroll", "onMount", "hover", "loop"],
        optionTitles: ["Layer in View", "Section in View", "On Scroll", "On Mount", "Hover", "Loop"],
    },
    delay: { type: ControlType.Number, title: "Delay", defaultValue: 0, min: 0, max: 5, step: 0.05, unit: "s" },
    threshold: {
        type: ControlType.Number,
        title: "Threshold",
        defaultValue: 0.4,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p: Partial<TextMotionProps>) => p.trigger !== "onView" && p.trigger !== "sectionInView",
    },
    replay: {
        type: ControlType.Boolean,
        title: "Replay",
        defaultValue: true,
        hidden: (p: Partial<TextMotionProps>) =>
            p.trigger !== "onView" && p.trigger !== "sectionInView" && p.trigger !== "onScroll",
    },
    loopDelay: {
        type: ControlType.Number,
        title: "Loop Gap",
        defaultValue: 1.2,
        min: 0,
        max: 8,
        step: 0.1,
        unit: "s",
        hidden: (p: Partial<TextMotionProps>) => p.trigger !== "loop",
    },

    /** Typography escape hatches — both inherit from the canvas by default. */
    textColor: { type: ControlType.Color, title: "Color", optional: true },
    useCustomFont: { type: ControlType.Boolean, title: "Own Font", defaultValue: false },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "46px", variant: "Bold", letterSpacing: "0.01em", lineHeight: "1.15em" },
        hidden: (p: Partial<TextMotionProps>) => !p.useCustomFont,
    },
    madeByKollinaStudio: {
        type: "description" as any,
        title: "",
        description: "Made by KollinaStudio",
    },
})
