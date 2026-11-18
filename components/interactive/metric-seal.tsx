// @framerDisableUnlink
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
    animate,
    motion,
    useInView,
    useMotionValue,
    useMotionValueEvent,
    useReducedMotion,
    useTransform,
    type Transition,
} from "framer-motion"
import {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from "react"

type WipeDirection = "left" | "bottom"
type MotionPreset = "cinematic" | "balanced" | "snappy"
type TextAlign = "left" | "right" | "center" | "justify"

interface MetricSealProps {
    value: {
        from: number
        to: number
    }
    format: {
        prefix: string
        suffix: string
        decimals: number
        commas: boolean
    }
    seal: {
        ink: string
        wipe: WipeDirection
        ghost: string
        ghostOpacity: number
    }
    timing: {
        duration: number
        delay: number
        motion: MotionPreset
    }
    font: CSSProperties
    style?: CSSProperties
}

const DEFAULT_VALUE = { from: 0, to: 12000 } as const
const DEFAULT_FORMAT = {
    prefix: "",
    suffix: "+",
    decimals: 0,
    commas: true,
} as const
const DEFAULT_SEAL = {
    ink: "#8B9BFF",
    wipe: "left" as WipeDirection,
    ghost: "#8B9BFF",
    ghostOpacity: 0.18,
}
const DEFAULT_TIMING = {
    duration: 1.25,
    delay: 0,
    motion: "cinematic" as MotionPreset,
}

type Edge = "left" | "bottom"

interface InkSeed {
    edge: Edge
    x: number
    y: number
    rx: number
    ry: number
}

/** Kern house — mid-body ink travel */
const EASE_INK: [number, number, number, number] = [0.65, 0, 0.35, 1]
/** Strong ease-out — balanced / seal / late count */
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]
/** Snappy */
const EASE_SNAPPY: [number, number, number, number] = [0.16, 1, 0.3, 1]

/** Canvas mid-wipe — soft tip + mid-count readable */
const STATIC_FILL_RATIO = 0.55
/**
 * Count runs almost the full wipe — counter must be readable, not a late snap.
 * Wipe still owns the mask; digits ease independently (ease-out).
 */
const COUNT_START = 0.08
/** Bloom tip lags the solid front — droplet halo, not a full ghost */
const BLOOM_LAG = 0.06
const BLOOM_OPACITY = 0.38
/** Bloom extinguishes into a single sealed ink layer */
const BLOOM_FADE_START = 0.82
/** Canvas mid — ghost underlay still reads under partial ink */
const GHOST_STATIC_SCALE = 0.65

/** Prefer solid Ghost color — layer opacity owns strength (avoid double-alpha). */
function solidColor(input: string, fallback: string): string {
    const raw = (input || "").trim()
    if (!raw) return fallback
    const rgba = raw.match(
        /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+\s*)?\)$/i
    )
    if (rgba) {
        const r = Math.round(Number(rgba[1]))
        const g = Math.round(Number(rgba[2]))
        const b = Math.round(Number(rgba[3]))
        return `rgb(${r}, ${g}, ${b})`
    }
    const hexa = raw.match(/^#([0-9a-f]{8})$/i)
    if (hexa) return `#${hexa[1].slice(0, 6)}`
    return raw
}

/**
 * Ink feather — soft early, hardens as fill completes (wet → dry).
 * Same family as Glyph Ink — do not harden past this or it becomes a flat mask.
 */
const INK_CORE_SOFT = 68
const INK_CORE_HARD = 84
const INK_MID_SOFT = 84
const INK_MID_HARD = 94
const INK_COVER = Math.SQRT2 * (100 / INK_CORE_HARD)
const CROSS_START = 0.34

const PRESET_EASE: Record<MotionPreset, Transition["ease"]> = {
    cinematic: EASE_INK,
    balanced: EASE_OUT,
    snappy: EASE_SNAPPY,
}

const PRESET_DURATION_SCALE: Record<MotionPreset, number> = {
    cinematic: 1,
    balanced: 0.85,
    snappy: 0.65,
}

function formatValue(
    value: number,
    decimals: number,
    commas: boolean
): string {
    const fixed = value.toFixed(Math.max(0, decimals))
    if (!commas) return fixed

    const [intPart, fracPart] = fixed.split(".")
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    return fracPart !== undefined ? `${withCommas}.${fracPart}` : withCommas
}

function labelFor(
    value: number,
    prefix: string,
    suffix: string,
    decimals: number,
    commas: boolean
): string {
    return `${prefix}${formatValue(value, decimals, commas)}${suffix}`
}

/**
 * Digits from countProgress (0→1), already ease-out driven.
 * COUNT_START is handled as delay on the count timeline, not here.
 */
function labelAtProgress(
    progress: number,
    from: number,
    to: number,
    prefix: string,
    suffix: string,
    decimals: number,
    commas: boolean
): string {
    if (from === to) {
        return labelFor(to, prefix, suffix, decimals, commas)
    }
    const u = Math.max(0, Math.min(1, progress))
    const next = from + (to - from) * u
    return labelFor(next, prefix, suffix, decimals, commas)
}

function normalizeWipe(value: string | undefined): WipeDirection {
    const key = (value ?? "left").toLowerCase()
    return key === "bottom" ? "bottom" : "left"
}

function normalizeMotion(value: string | undefined): MotionPreset {
    const key = (value ?? "cinematic").toLowerCase()
    switch (key) {
        case "balanced":
            return "balanced"
        case "snappy":
            return "snappy"
        case "cinematic":
            return "cinematic"
        default:
            return "cinematic"
    }
}

function seedForBox(
    wipe: WipeDirection,
    width: number,
    height: number
): InkSeed {
    const w = Math.max(width, 1)
    const h = Math.max(height, 1)
    if (wipe === "bottom") {
        return {
            edge: "bottom",
            x: w * 0.5,
            y: h,
            rx: Math.max(w * 0.5, 1),
            ry: h,
        }
    }
    return {
        edge: "left",
        x: 0,
        y: h * 0.5,
        rx: w,
        ry: Math.max(h * 0.5, 1),
    }
}

function justifyForAlign(align: TextAlign | string | undefined): string {
    switch (align) {
        case "center":
            return "center"
        case "right":
        case "end":
            return "flex-end"
        case "justify":
            return "space-between"
        case "left":
        case "start":
        default:
            return "flex-start"
    }
}

/**
 * Directional ink front — droplet contact → wipe.
 * Tip softens early and hardens with t; cover ×√2 clears corners at t=1.
 */
function inkMask(seed: InkSeed, progress: number): string {
    const t = Math.max(0, Math.min(1, progress))
    const ox = seed.x.toFixed(2)
    const oy = seed.y.toFixed(2)
    if (t <= 0) {
        return `radial-gradient(ellipse 0.01px 0.01px at ${ox}px ${oy}px, transparent 0%, transparent 100%)`
    }

    const cross = CROSS_START + (1 - CROSS_START) * t
    let rx: number
    let ry: number
    switch (seed.edge) {
        case "left":
            rx = Math.max(seed.rx * INK_COVER * t, 0.01)
            ry = Math.max(seed.ry * INK_COVER * cross, 0.01)
            break
        case "bottom":
            rx = Math.max(seed.rx * INK_COVER * cross, 0.01)
            ry = Math.max(seed.ry * INK_COVER * t, 0.01)
            break
        default: {
            const _exhaustive: never = seed.edge
            void _exhaustive
            rx = Math.max(seed.rx * INK_COVER * t, 0.01)
            ry = Math.max(seed.ry * INK_COVER * t, 0.01)
            break
        }
    }

    const core = INK_CORE_SOFT + (INK_CORE_HARD - INK_CORE_SOFT) * t
    const mid = INK_MID_SOFT + (INK_MID_HARD - INK_MID_SOFT) * t
    return `radial-gradient(ellipse ${rx.toFixed(2)}px ${ry.toFixed(2)}px at ${ox}px ${oy}px, #000 0%, #000 ${core.toFixed(1)}%, rgba(0,0,0,0.45) ${mid.toFixed(1)}%, transparent 100%)`
}

/**
 * Metric Seal
 *
 * Ink seals the metric — soft→hard tip, bloom front, parallel count.
 * Ghost underlay (Glyph-style): destination silhouette fades as ink fills.
 *
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 160
 * @framerIntrinsicHeight 64
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function MetricSeal(props: MetricSealProps) {
    const {
        value = DEFAULT_VALUE,
        format = DEFAULT_FORMAT,
        seal = DEFAULT_SEAL,
        timing = DEFAULT_TIMING,
        font,
        style,
    } = props

    const from = value?.from ?? DEFAULT_VALUE.from
    const to = value?.to ?? DEFAULT_VALUE.to
    const prefix = format?.prefix ?? DEFAULT_FORMAT.prefix
    const suffix = format?.suffix ?? DEFAULT_FORMAT.suffix
    const decimals = format?.decimals ?? DEFAULT_FORMAT.decimals
    const commas = format?.commas ?? DEFAULT_FORMAT.commas
    const ink = seal?.ink ?? DEFAULT_SEAL.ink
    const wipeProp = seal?.wipe ?? DEFAULT_SEAL.wipe
    const ghostColor = solidColor(
        seal?.ghost ?? DEFAULT_SEAL.ghost,
        DEFAULT_SEAL.ghost
    )
    const ghostPeak = Math.max(
        0,
        Math.min(1, seal?.ghostOpacity ?? DEFAULT_SEAL.ghostOpacity)
    )
    const duration = timing?.duration ?? DEFAULT_TIMING.duration
    const delay = timing?.delay ?? DEFAULT_TIMING.delay
    const motionProp = timing?.motion ?? DEFAULT_TIMING.motion

    const wipe = normalizeWipe(wipeProp)
    const motionPreset = normalizeMotion(motionProp)
    const ghostEnabled = ghostPeak > 0.001
    const ghostStatic = ghostEnabled ? ghostPeak * GHOST_STATIC_SCALE : 0

    const isStatic = useIsStaticRenderer()
    const prefersReduced = useReducedMotion()
    /** null = unresolved — do not arm wipe yet (avoid reduced-motion flash) */
    const motionReady = prefersReduced !== null
    const skipMotion = prefersReduced === true
    const staticMid = Boolean(isStatic && prefersReduced === false)
    const freezeProgress = skipMotion ? 1 : staticMid ? STATIC_FILL_RATIO : 0

    const rootRef = useRef<HTMLDivElement>(null)
    const measureRef = useRef<HTMLSpanElement>(null)
    const inkTextRef = useRef<HTMLSpanElement>(null)
    const bloomTextRef = useRef<HTMLSpanElement>(null)
    const lastLabelRef = useRef("")
    const [seed, setSeed] = useState<InkSeed>(() =>
        seedForBox(wipe, 160, 64)
    )
    const finalLabel = labelFor(to, prefix, suffix, decimals, commas)
    const midLabel = useMemo(
        () =>
            labelAtProgress(
                STATIC_FILL_RATIO,
                from,
                to,
                prefix,
                suffix,
                decimals,
                commas
            ),
        [from, to, prefix, suffix, decimals, commas]
    )
    const openingLabel = useMemo(
        () => labelAtProgress(0, from, to, prefix, suffix, decimals, commas),
        [from, to, prefix, suffix, decimals, commas]
    )
    const initialLabel = skipMotion
        ? finalLabel
        : staticMid
          ? midLabel
          : openingLabel

    const paintInk = (label: string) => {
        if (label === lastLabelRef.current) return
        lastLabelRef.current = label
        if (inkTextRef.current) inkTextRef.current.textContent = label
        if (bloomTextRef.current) bloomTextRef.current.textContent = label
    }

    const isInView = useInView(rootRef, { amount: 0.4, once: true })
    /** Wipe mask timeline — cinematic mid-body travel */
    const progress = useMotionValue(freezeProgress)
    /**
     * Digit timeline — independent ease-out so count reads as a real
     * counter, not a crawl inherited from the ink curve.
     */
    const countProgress = useMotionValue(freezeProgress)
    const inkOpacity = useMotionValue(skipMotion || staticMid ? 1 : 0.88)
    /** 0 until seal starts — avoids destination watermark before in-view */
    const ghostArmed = useMotionValue(skipMotion || staticMid ? 1 : 0)

    /** Font face only — Seal Ink/Ghost own paint (Font color is ignored) */
    const fontFace = useMemo(() => {
        if (!font) return undefined
        const { color: _ignoredColor, ...rest } = font
        return rest
    }, [font])

    const maskImage = useTransform(progress, (p) => inkMask(seed, p as number))
    const bloomMask = useTransform(progress, (p) =>
        inkMask(seed, Math.max(0, (p as number) - BLOOM_LAG))
    )
    const bloomOpacity = useTransform(progress, (p) => {
        const t = p as number
        if (t <= 0) return 0
        if (t < BLOOM_FADE_START) return BLOOM_OPACITY
        const fade = (t - BLOOM_FADE_START) / (1 - BLOOM_FADE_START)
        return BLOOM_OPACITY * (1 - Math.max(0, Math.min(1, fade)))
    })
    /** Dual-layer underlay — peak at empty ink, eases out as seal completes */
    const ghostOpacity = useTransform(
        [progress, ghostArmed],
        ([p, armed]) => {
            if (!ghostEnabled || skipMotion) return 0
            if (staticMid) return ghostStatic
            if ((armed as number) < 0.5) return 0
            const t = Math.max(0, Math.min(1, p as number))
            return ghostPeak * (1 - t)
        }
    )

    const textAlign = (font?.textAlign as TextAlign | undefined) ?? "left"
    const inkJustify = justifyForAlign(textAlign)
    const isFixedWidth = style?.width === "100%"
    const transformOrigin =
        wipe === "bottom" ? "center bottom" : "left center"

    useMotionValueEvent(countProgress, "change", (p) => {
        if (skipMotion || staticMid) return
        paintInk(
            labelAtProgress(p, from, to, prefix, suffix, decimals, commas)
        )
    })

    const measureSeed = () => {
        const el = measureRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        setSeed(seedForBox(wipe, rect.width, rect.height))
    }

    useLayoutEffect(() => {
        measureSeed()
        if (typeof ResizeObserver === "undefined") return
        const el = measureRef.current
        if (!el) return
        const ro = new ResizeObserver(() => measureSeed())
        ro.observe(el)
        return () => ro.disconnect()
    }, [wipe, finalLabel])

    useLayoutEffect(() => {
        paintInk(initialLabel)
    }, [initialLabel])

    useEffect(() => {
        if (skipMotion) {
            progress.set(1)
            countProgress.set(1)
            inkOpacity.set(1)
            ghostArmed.set(0)
            paintInk(finalLabel)
            return
        }

        if (staticMid) {
            progress.set(STATIC_FILL_RATIO)
            countProgress.set(STATIC_FILL_RATIO)
            inkOpacity.set(0.96)
            ghostArmed.set(1)
            paintInk(midLabel)
            return
        }

        if (!motionReady || !isInView) return

        paintInk(openingLabel)
        progress.set(0)
        countProgress.set(0)
        inkOpacity.set(0.88)
        ghostArmed.set(0)

        const wipeDuration = Math.max(
            0.2,
            duration * (PRESET_DURATION_SCALE[motionPreset] ?? 1)
        )
        const wipeEase = PRESET_EASE[motionPreset] ?? EASE_INK
        const startDelay = Math.max(0, delay)
        const countDuration = Math.max(0.18, wipeDuration * 0.92)
        const countDelay = startDelay + wipeDuration * COUNT_START

        /** Arm ghost with the wipe — same delay, no staged pause */
        const armControls = animate(ghostArmed, 1, {
            duration: 0,
            delay: startDelay,
        })

        const wipeControls = animate(progress, 1, {
            duration: wipeDuration,
            ease: wipeEase,
            delay: startDelay,
            onUpdate: (p) => {
                inkOpacity.set(0.88 + 0.12 * p)
            },
            onComplete: () => {
                inkOpacity.set(1)
            },
        })

        const countControls = animate(countProgress, 1, {
            duration: countDuration,
            ease: EASE_OUT,
            delay: countDelay,
            onComplete: () => {
                paintInk(finalLabel)
            },
        })

        return () => {
            armControls.stop()
            wipeControls.stop()
            countControls.stop()
        }
    }, [
        skipMotion,
        staticMid,
        motionReady,
        isInView,
        from,
        to,
        duration,
        delay,
        motionPreset,
        prefix,
        suffix,
        decimals,
        commas,
        finalLabel,
        midLabel,
        openingLabel,
        progress,
        countProgress,
        inkOpacity,
        ghostArmed,
    ])

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "baseline",
                justifyContent: inkJustify,
                width: isFixedWidth ? "100%" : "max-content",
                minWidth: isFixedWidth ? undefined : "max-content",
                margin: 0,
                ...fontFace,
                fontVariantNumeric: "tabular-nums",
                ...style,
            }}
            aria-label={staticMid ? midLabel : finalLabel}
            role="img"
        >
            <span
                ref={measureRef}
                aria-hidden
                style={{
                    opacity: 0,
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                    textAlign,
                    userSelect: "none",
                }}
            >
                {finalLabel}
            </span>

            {ghostEnabled ? (
                <motion.span
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                        color: ghostColor,
                        opacity: ghostOpacity,
                        whiteSpace: "nowrap",
                        textAlign,
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: inkJustify,
                        pointerEvents: "none",
                    }}
                >
                    {finalLabel}
                </motion.span>
            ) : null}

            <motion.span
                aria-hidden
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    color: ink,
                    opacity: bloomOpacity,
                    whiteSpace: "nowrap",
                    textAlign,
                    maskImage: bloomMask,
                    WebkitMaskImage: bloomMask,
                    maskSize: "100% 100%",
                    WebkitMaskSize: "100% 100%",
                    maskRepeat: "no-repeat",
                    WebkitMaskRepeat: "no-repeat",
                    transformOrigin,
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: inkJustify,
                    pointerEvents: "none",
                }}
            >
                <span ref={bloomTextRef}>{initialLabel}</span>
            </motion.span>

            <motion.span
                aria-hidden
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    color: ink,
                    opacity: inkOpacity,
                    whiteSpace: "nowrap",
                    textAlign,
                    maskImage,
                    WebkitMaskImage: maskImage,
                    maskSize: "100% 100%",
                    WebkitMaskSize: "100% 100%",
                    maskRepeat: "no-repeat",
                    WebkitMaskRepeat: "no-repeat",
                    transformOrigin,
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: inkJustify,
                }}
            >
                <span ref={inkTextRef}>{initialLabel}</span>
            </motion.span>
        </div>
    )
}

MetricSeal.displayName = "Metric Seal"

addPropertyControls(MetricSeal, {
    value: {
        type: ControlType.Object,
        title: "Value",
        description: "Start and end of the sealed figure.",
        controls: {
            from: {
                type: ControlType.Number,
                title: "From",
                defaultValue: DEFAULT_VALUE.from,
                displayStepper: true,
                description: "Count starts here as ink begins to seal.",
            },
            to: {
                type: ControlType.Number,
                title: "To",
                defaultValue: DEFAULT_VALUE.to,
                displayStepper: true,
                description: "Final sealed value.",
            },
        },
        defaultValue: { ...DEFAULT_VALUE },
    },
    format: {
        type: ControlType.Object,
        title: "Format",
        description: "How the figure reads once sealed.",
        controls: {
            prefix: {
                type: ControlType.String,
                title: "Prefix",
                defaultValue: DEFAULT_FORMAT.prefix,
                placeholder: "$",
                description: "Text before the number ($).",
            },
            suffix: {
                type: ControlType.String,
                title: "Suffix",
                defaultValue: DEFAULT_FORMAT.suffix,
                placeholder: "+",
                description: "Text after the number (+, %, M).",
            },
            decimals: {
                type: ControlType.Number,
                title: "Decimals",
                defaultValue: DEFAULT_FORMAT.decimals,
                min: 0,
                max: 4,
                step: 1,
                displayStepper: true,
                description: "Decimal places (0–4).",
            },
            commas: {
                type: ControlType.Boolean,
                title: "Separators",
                defaultValue: DEFAULT_FORMAT.commas,
                enabledTitle: "1,000",
                disabledTitle: "1000",
                description:
                    "US-style thousand commas (1,000). Off = plain digits.",
            },
        },
        defaultValue: { ...DEFAULT_FORMAT },
    },
    seal: {
        type: ControlType.Object,
        title: "Seal",
        description: "Ink, ghost whisper, and wipe direction.",
        controls: {
            ink: {
                type: ControlType.Color,
                title: "Ink",
                defaultValue: DEFAULT_SEAL.ink,
                description: "Paint color of the sealed metric.",
            },
            ghost: {
                type: ControlType.Color,
                title: "Ghost",
                defaultValue: DEFAULT_SEAL.ghost,
                description:
                    "Underlay color under the wipe. Solid color — strength is Ghost Op.",
            },
            ghostOpacity: {
                type: ControlType.Number,
                title: "Ghost Op.",
                defaultValue: DEFAULT_SEAL.ghostOpacity,
                min: 0,
                max: 1,
                step: 0.01,
                description:
                    "Subtle destination underlay (0 = off). Fades as ink seals — not a pre-wipe flash.",
            },
            wipe: {
                type: ControlType.Enum,
                title: "Wipe",
                options: ["left", "bottom"],
                optionTitles: ["Left", "Bottom"],
                defaultValue: DEFAULT_SEAL.wipe,
                displaySegmentedControl: true,
                description: "Ink travel direction across the figure.",
            },
        },
        defaultValue: { ...DEFAULT_SEAL },
    },
    timing: {
        type: ControlType.Object,
        title: "Timing",
        description: "Enter pacing. Preset scales duration; count eases independently.",
        controls: {
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: DEFAULT_TIMING.duration,
                min: 0.2,
                max: 8,
                step: 0.1,
                unit: "s",
                description: "Base seal length before the motion preset scales it.",
            },
            delay: {
                type: ControlType.Number,
                title: "Delay",
                defaultValue: DEFAULT_TIMING.delay,
                min: 0,
                max: 4,
                step: 0.05,
                unit: "s",
                description: "Wait before ink starts (stagger rows).",
            },
            motion: {
                type: ControlType.Enum,
                title: "Motion",
                options: ["cinematic", "balanced", "snappy"],
                optionTitles: ["Cinematic", "Balanced", "Snappy"],
                defaultValue: DEFAULT_TIMING.motion,
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
                description:
                    "Cinematic = ink mid-body travel. Balanced = ease-out. Snappy = short seal.",
            },
        },
        defaultValue: { ...DEFAULT_TIMING },
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        description:
            "Family / size / weight. Color is ignored — use Seal → Ink / Ghost. Pick Clash Grotesk for Kern sell.\n\nBuiltByKern\n[Explore more components](https://www.framer.com/%40builtbykern/)",
        defaultValue: {
            fontSize: "56px",
            variant: "Medium",
            letterSpacing: "0em",
            lineHeight: "1em",
            textAlign: "left",
        },
    },
})
