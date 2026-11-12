import * as React from "react"
import { motion, useAnimationControls, useReducedMotion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export const __framerIntrinsicWidth = 420
export const __framerIntrinsicHeight = 140

const DEFAULT_COLORS = [
    "#ffff00",
    "#76ff03",
    "#f06292",
    "#4fc3f7",
    "#ba68c8",
    "#f57c00",
    "#673ab7",
]

type WaveMode = "Forward" | "Reverse" | "Bounce" | "Random" | "Mirror"
type Direction = "Left→Right" | "Right→Left" | "Center→Out" | "Edges→In"
type WaveCurve = "Linear" | "Sine" | "Ease"
type ColorMode = "Repeat" | "Random" | "Gradient"
type GlowStyle = "Soft" | "Strong" | "Neon" | "Bloom"
type Shape =
    | "Circle"
    | "Square"
    | "Rounded"
    | "Pill"
    | "Diamond"
    | "Triangle"
    | "Custom"

function mulberry32(seed: number) {
    let a = seed >>> 0
    return () => {
        a |= 0
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function clamp01(n: number) {
    return Math.max(0, Math.min(1, n))
}

function hexToRgb(hex: string) {
    const h = hex.trim()
    if (!h.startsWith("#")) return null
    const s = h.slice(1)
    if (s.length === 3) {
        const r = parseInt(s[0] + s[0], 16)
        const g = parseInt(s[1] + s[1], 16)
        const b = parseInt(s[2] + s[2], 16)
        return { r, g, b }
    }
    if (s.length === 6) {
        const r = parseInt(s.slice(0, 2), 16)
        const g = parseInt(s.slice(2, 4), 16)
        const b = parseInt(s.slice(4, 6), 16)
        return { r, g, b }
    }
    return null
}

function mix(a: number, b: number, t: number) {
    return a + (b - a) * t
}

function mixHex(c1: string, c2: string, t: number) {
    const A = hexToRgb(c1)
    const B = hexToRgb(c2)
    if (!A || !B) return null
    const r = Math.round(mix(A.r, B.r, t))
    const g = Math.round(mix(A.g, B.g, t))
    const b = Math.round(mix(A.b, B.b, t))
    return `rgb(${r} ${g} ${b})`
}

function curveFn(mode: WaveCurve) {
    if (mode === "Sine") return (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t)
    if (mode === "Ease") return (t: number) => t * t * (3 - 2 * t)
    return (t: number) => t
}

function basePhase(i: number, count: number, direction: Direction) {
    if (count <= 1) return 0
    const maxIndex = count - 1
    const center = maxIndex / 2
    if (direction === "Right→Left") return (maxIndex - i) / maxIndex
    if (direction === "Center→Out")
        return center === 0 ? 0 : Math.abs(i - center) / center
    if (direction === "Edges→In")
        return center === 0 ? 0 : (center - Math.abs(i - center)) / center
    return i / maxIndex
}

function applyWaveMode(t: number, mode: WaveMode) {
    const x = clamp01(t)
    if (mode === "Reverse") return 1 - x
    if (mode === "Mirror") return Math.abs(x - 0.5) * 2
    if (mode === "Bounce") return x <= 0.5 ? x * 2 : (1 - x) * 2
    return x
}

function buildGlow(
    color: string,
    spread: number,
    intensity: number,
    style: GlowStyle
) {
    const s = Math.max(0, spread)
    const k = Math.max(0, intensity)
    if (s === 0 || k === 0) return "none"

    const soft = [`0 0 ${s * 0.7}px ${color}`, `0 0 ${s * 1.2}px ${color}`]
    const strong = [
        `0 0 ${s * 0.6}px ${color}`,
        `0 0 ${s * 1.3}px ${color}`,
        `0 0 ${s * 2.0}px ${color}`,
    ]
    const neon = [
        `0 0 ${s * 0.5}px ${color}`,
        `0 0 ${s * 1.0}px ${color}`,
        `0 0 ${s * 1.8}px ${color}`,
        `0 0 ${s * 2.8}px ${color}`,
    ]
    const bloom = [
        `0 0 ${s * 0.8}px ${color}`,
        `0 0 ${s * 1.6}px ${color}`,
        `0 0 ${s * 2.6}px ${color}`,
        `0 0 ${s * 4.0}px ${color}`,
    ]

    const layers =
        style === "Bloom"
            ? bloom
            : style === "Neon"
              ? neon
              : style === "Strong"
                ? strong
                : soft

    const scaled = layers.map((layer, idx) => {
        const mult = idx === 0 ? 1 : 1 + k * 0.25 * idx
        return layer.replace(
            /0 0 ([\d.]+)px/g,
            (_, n) => `0 0 ${Number(n) * mult}px`
        )
    })

    return scaled.join(", ")
}

function getColorForIndex(
    i: number,
    count: number,
    colors: string[],
    mode: ColorMode,
    randFor: (idx: number) => number
) {
    const list = colors.length > 0 ? colors : DEFAULT_COLORS

    if (mode === "Random") {
        const r = randFor(i)
        const idx = Math.floor(r * list.length) % list.length
        return list[idx] || "#ffffff"
    }

    if (mode === "Gradient") {
        if (list.length === 1) return list[0]
        const t = count <= 1 ? 0 : i / (count - 1)
        const p = t * (list.length - 1)
        const a = Math.floor(p)
        const b = Math.min(list.length - 1, a + 1)
        const localT = p - a
        const mixed = mixHex(list[a], list[b], localT)
        return mixed || list[i % list.length] || "#ffffff"
    }

    return list[i % list.length] || "#ffffff"
}

function Dot(props: any) {
    const controls = useAnimationControls()
    const { paused, reduceMotion, duration, delay, minScale, maxScale, style } =
        props

    React.useEffect(() => {
        if (reduceMotion) {
            controls.set({ scale: 1 })
            return
        }
        if (paused) {
            controls.stop()
            return
        }
        controls.start({
            scale: [minScale, maxScale, minScale],
            transition: {
                duration,
                ease: "easeInOut",
                repeat: Infinity,
                delay,
            },
        })
    }, [paused, reduceMotion, duration, delay, minScale, maxScale, controls])

    return <motion.div style={style} animate={controls} />
}

export default function GlowLoader(props: any) {
    const {
        count,
        size,
        gap,
        padding,
        shape,
        speed,
        glowSpread,
        glowIntensity,
        glowStyle,
        colors,
        customSVG,
        waveMode,
        direction,
        waveCurve,
        colorMode,
        minScale,
        maxScale,
        wrap,
        pauseOnHover,
        respectReducedMotion,
        seed,
    } = props

    const reducedMotion = useReducedMotion()
    const shouldReduce = Boolean(respectReducedMotion && reducedMotion)

    const safeCount = Math.max(1, Math.round(count))
    const safeSpeed = Math.max(0.05, speed)
    const duration = 1.5 / safeSpeed

    const sMin = Math.max(0.05, Math.min(minScale, maxScale))
    const sMax = Math.max(sMin, maxScale)

    const isWrap = wrap === "Wrap"
    const curve = React.useMemo(() => curveFn(waveCurve), [waveCurve])

    const randFor = React.useCallback(
        (idx: number) => {
            const r = mulberry32(((Math.floor(seed) || 1) + idx * 9973) >>> 0)
            return r()
        },
        [seed]
    )

    const palette =
        Array.isArray(colors) && colors.length > 0 ? colors : DEFAULT_COLORS

    const [hovered, setHovered] = React.useState(false)
    const paused = Boolean(pauseOnHover && hovered)

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding,
            }}
            onMouseEnter={pauseOnHover ? () => setHovered(true) : undefined}
            onMouseLeave={pauseOnHover ? () => setHovered(false) : undefined}
        >
            <div
                style={{
                    display: "flex",
                    gap,
                    alignItems: "center",
                    justifyContent: "center",
                    background: "transparent",
                    flexWrap: isWrap ? "wrap" : "nowrap",
                    width: "100%",
                }}
            >
                {Array.from({ length: safeCount }).map((_, i) => {
                    const color = getColorForIndex(
                        i,
                        safeCount,
                        palette,
                        colorMode,
                        randFor
                    )

                    const isCustom = shape === "Custom"
                    const isPill = shape === "Pill"
                    const dotWidth = isPill ? size * 2 : size
                    const dotHeight = size

                    let borderRadius: number | string = 0
                    let transform = "none"
                    let clipPath: string | undefined

                    if (!isCustom) {
                        if (shape === "Circle") borderRadius = "50%"
                        else if (shape === "Rounded") borderRadius = size / 3
                        else if (shape === "Pill") borderRadius = size
                        else if (shape === "Diamond")
                            transform = "rotate(45deg)"
                        else if (shape === "Triangle")
                            clipPath = "polygon(50% 0, 0 100%, 100% 100%)"
                        else borderRadius = 0
                    }

                    const shadow = buildGlow(
                        color,
                        glowSpread,
                        glowIntensity,
                        glowStyle
                    )

                    let t0 = basePhase(i, safeCount, direction)
                    if (waveMode === "Random") t0 = randFor(i)
                    else t0 = applyWaveMode(t0, waveMode)

                    const delay = curve(clamp01(t0)) * duration

                    const baseStyle: React.CSSProperties = {
                        width: dotWidth,
                        height: dotHeight,
                        background: color,
                        boxShadow: shadow,
                        flex: "0 0 auto",
                        borderRadius,
                        transform,
                        clipPath,
                    }

                    if (isCustom && customSVG) {
                        baseStyle.borderRadius = 0
                        baseStyle.transform = "none"
                        baseStyle.clipPath = undefined
                        ;(baseStyle as any).WebkitMaskImage =
                            `url(${customSVG})`
                        ;(baseStyle as any).WebkitMaskRepeat = "no-repeat"
                        ;(baseStyle as any).WebkitMaskSize = "contain"
                        ;(baseStyle as any).WebkitMaskPosition = "center"
                        ;(baseStyle as any).maskImage = `url(${customSVG})`
                        ;(baseStyle as any).maskRepeat = "no-repeat"
                        ;(baseStyle as any).maskSize = "contain"
                        ;(baseStyle as any).maskPosition = "center"
                    }

                    return (
                        <Dot
                            key={i}
                            style={baseStyle}
                            paused={paused}
                            reduceMotion={shouldReduce}
                            duration={duration}
                            delay={delay}
                            minScale={sMin}
                            maxScale={sMax}
                        />
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(GlowLoader, {
    count: {
        type: ControlType.Number,
        title: "Count",
        min: 1,
        max: 40,
        defaultValue: 7,
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        min: 8,
        max: 200,
        defaultValue: 40,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 200,
        defaultValue: 20,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 200,
        defaultValue: 20,
    },

    wrap: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["Row", "Wrap"],
        optionTitles: ["Row", "Wrap"],
        defaultValue: "Row",
    },

    shape: {
        type: ControlType.Enum,
        title: "Shape",
        options: [
            "Circle",
            "Square",
            "Rounded",
            "Pill",
            "Diamond",
            "Triangle",
            "Custom",
        ],
        optionTitles: [
            "Circle",
            "Square",
            "Rounded",
            "Pill",
            "Diamond",
            "Triangle",
            "Custom SVG",
        ],
        defaultValue: "Circle",
    },

    customSVG: {
        type: ControlType.File,
        title: "Custom SVG",
        allowedFileTypes: ["svg"],
        hidden: (p) => p.shape !== "Custom",
    },

    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.2,
        max: 3,
        defaultValue: 1,
    },

    minScale: {
        type: ControlType.Number,
        title: "Min Scale",
        min: 0.05,
        max: 1,
        defaultValue: 0.2,
    },
    maxScale: {
        type: ControlType.Number,
        title: "Max Scale",
        min: 0.1,
        max: 2,
        defaultValue: 1,
    },

    waveMode: {
        type: ControlType.Enum,
        title: "Wave",
        options: ["Forward", "Reverse", "Bounce", "Random", "Mirror"],
        optionTitles: ["Forward", "Reverse", "Bounce", "Random", "Mirror"],
        defaultValue: "Forward",
    },

    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["Left→Right", "Right→Left", "Center→Out", "Edges→In"],
        optionTitles: ["Left→Right", "Right→Left", "Center→Out", "Edges→In"],
        defaultValue: "Left→Right",
    },

    waveCurve: {
        type: ControlType.Enum,
        title: "Curve",
        options: ["Linear", "Sine", "Ease"],
        optionTitles: ["Linear", "Sine", "Ease"],
        defaultValue: "Sine",
    },

    colorMode: {
        type: ControlType.Enum,
        title: "Colors",
        options: ["Repeat", "Random", "Gradient"],
        optionTitles: ["Repeat", "Random", "Gradient"],
        defaultValue: "Repeat",
    },

    colors: {
        type: ControlType.Array,
        title: "Palette",
        defaultValue: DEFAULT_COLORS,
        propertyControl: { type: ControlType.Color },
    },

    glowStyle: {
        type: ControlType.Enum,
        title: "Glow Style",
        options: ["Soft", "Strong", "Neon", "Bloom"],
        optionTitles: ["Soft", "Strong", "Neon", "Bloom"],
        defaultValue: "Neon",
    },

    glowSpread: {
        type: ControlType.Number,
        title: "Glow Spread",
        min: 0,
        max: 240,
        defaultValue: 40,
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Power",
        min: 0,
        max: 4,
        defaultValue: 1,
    },

    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause Hover",
        defaultValue: false,
    },
    respectReducedMotion: {
        type: ControlType.Boolean,
        title: "Reduce Motion",
        defaultValue: true,
    },

    seed: {
        type: ControlType.Number,
        title: "Seed",
        min: 1,
        max: 999999,
        defaultValue: 1337,
    },
})
