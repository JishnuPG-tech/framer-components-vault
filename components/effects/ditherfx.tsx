// Author of Dither Plugin for Tailwind CSS: Florian Kiem <https://github.com/flornkm>
// https://github.com/flornkm/dither-plugin/tree/main

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

import { useScroll, useMotionValue, animate } from "framer-motion"

/**
 * Default Bayer 4×4 pattern as data URI (from your CSS)
 */
const DEFAULT_BAYER_URI =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAu0lEQVQ4T6WSMQqFMBBEE2wDXiVgG8gtglilCuIpcoogVqlEPIVgK3gVIa2Qzw9YbIpttlqGgbcMM5wxlr33LMbI/nccx3I/PQwD0LXPj+OgAaSUBWCtLZ+2bSv308uyAF37/HkeGkAIASL0fQ8yT9MEdO3z67poAKUUiDDPM8i87zvQtc/f96UBmqZBazTG4Ds4z5MG6LoOrTGEgO8gpUQDtG2L1uicw3dw3zcNoLVGa1zXFd9BzpkE+AFp94/4eKx9+AAAAABJRU5ErkJggg=="

type PresetKey = "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
type LookPreset = "none" | "gameboy" | "newspaper" | "highContrast"
type IntensityMode = "off" | "hover" | "scroll" | "both"
type AnimEase = "linear" | "easeIn" | "easeOut" | "easeInOut"
type TintType = "solid" | "linear" | "radial"
type TintPosition = "under" | "over"

const PRESET_TO_PX: Record<PresetKey, number> = {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 28,
    "2xl": 40,
}

export type DitherProps = {
    enabled: boolean
    preset: LookPreset
    usePresetAsBase: boolean
    intensityMode: IntensityMode
    gray: number
    bright: number
    contrast: number
    blurPx: number
    sizeMode: "preset" | "custom"
    cellPreset: PresetKey
    cellCustomPx: number
    opacity: number
    blendMode:
        | "screen"
        | "multiply"
        | "overlay"
        | "soft-light"
        | "hard-light"
        | "lighten"
        | "darken"
    imageMode: "default" | "custom"
    imageUrl?: string
    background: string
    pixelate: boolean
    children?: React.ReactNode

    hoverContrastDelta: number
    hoverBrightDelta: number
    hoverOpacityDelta: number

    scrollGrayFrom: number
    scrollGrayTo: number
    scrollBrightFrom: number
    scrollBrightTo: number
    scrollContrastFrom: number
    scrollContrastTo: number
    scrollOpacityFrom: number
    scrollOpacityTo: number
    scrollOffsetStart: string
    scrollOffsetEnd: string

    animEnabled: boolean
    animPlayOnHover: boolean
    animDuration: number
    animDelay: number
    animEase: AnimEase
    animRepeat: number
    animRepeatType: "loop" | "mirror" | "reverse"

    animGrayDeltaOn: boolean
    animGrayDeltaFrom: number
    animGrayDeltaTo: number
    animBrightDeltaOn: boolean
    animBrightDeltaFrom: number
    animBrightDeltaTo: number
    animContrastDeltaOn: boolean
    animContrastDeltaFrom: number
    animContrastDeltaTo: number
    animBlurDeltaOn: boolean
    animBlurDeltaFrom: number
    animBlurDeltaTo: number
    animOpacityDeltaOn: boolean
    animOpacityDeltaFrom: number
    animOpacityDeltaTo: number

    driftEnabled: boolean
    driftSpeed: number
    driftAngle: number
    driftJitter: number
    driftPauseOnHover: boolean

    tintEnabled: boolean
    tintType: TintType
    tintPosition: TintPosition
    tintOpacity: number
    tintBlendMode:
        | "normal"
        | "screen"
        | "multiply"
        | "overlay"
        | "soft-light"
        | "hard-light"
        | "lighten"
        | "darken"
    tintColor: string
    tintColor2: string
    tintAngle: number
    tintRadialPos: string
}

const PRESETS: Record<Exclude<LookPreset, "none">, Partial<DitherProps>> = {
    gameboy: {
        gray: 1,
        bright: 1.05,
        contrast: 140,
        blurPx: 0,
        sizeMode: "preset",
        cellPreset: "md",
        opacity: 0.7,
        blendMode: "multiply",
        background: "#0f380f",
        imageMode: "default",
        pixelate: true,
    },
    newspaper: {
        gray: 1,
        bright: 1,
        contrast: 180,
        blurPx: 0,
        sizeMode: "preset",
        cellPreset: "sm",
        opacity: 0.9,
        blendMode: "screen",
        background: "#f5f5f5",
        imageMode: "default",
        pixelate: true,
    },
    highContrast: {
        gray: 1,
        bright: 1,
        contrast: 250,
        blurPx: 0,
        sizeMode: "preset",
        cellPreset: "xs",
        opacity: 1,
        blendMode: "screen",
        background: "#000000",
        imageMode: "default",
        pixelate: true,
    },
}

/** Factory defaults for comparison */
const FACTORY_DEFAULTS = {
    gray: 1,
    bright: 1,
    contrast: 120,
    blurPx: 0,
    sizeMode: "preset" as const,
    cellPreset: "lg" as const,
    opacity: 1,
    blendMode: "screen" as const,
    background: "#000000",
    pixelate: true,
    imageMode: "default" as const,
}

/**
 * Apply preset partially if user wants to use it as base
 */
function applyPresetAsStartingPoint(p: DitherProps): DitherProps {
    if (!p.usePresetAsBase || p.preset === "none") return p
    const presetVals = PRESETS[p.preset] || {}
    const next: any = { ...p }

    ;(
        Object.keys(FACTORY_DEFAULTS) as Array<keyof typeof FACTORY_DEFAULTS>
    ).forEach((key) => {
        const userVal = (p as any)[key]
        const factoryVal = FACTORY_DEFAULTS[key]
        const presetVal = (presetVals as any)[key]
        if (presetVal !== undefined && userVal === factoryVal) {
            next[key] = presetVal
        }
    })
    return next as DitherProps
}

function applyLookPreset(p: DitherProps): DitherProps {
    if (p.preset === "none") return p
    const presetValues = PRESETS[p.preset]
    return { ...p, ...presetValues }
}

function clamp(v: number, min: number, max: number) {
    return Math.min(max, Math.max(min, v))
}
function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t
}
function useMotion(mv: any) {
    const [v, setV] = React.useState(0)
    React.useEffect(() => {
        const unsub = mv.on("change", setV)
        return () => unsub?.()
    }, [mv])
    return v
}
function run(mv: any, from: number, to: number, opts: any) {
    mv.set(from)
    const controls = animate(mv, [from, to], opts)
    return () => controls?.stop?.()
}

/**
 * Dither Component
 */
export default function DitherFX(rawProps: DitherProps) {
    const props = rawProps.usePresetAsBase
        ? applyPresetAsStartingPoint(rawProps)
        : applyLookPreset(rawProps)

    const {
        enabled,
        gray,
        bright,
        contrast,
        blurPx,
        sizeMode,
        cellPreset,
        cellCustomPx,
        opacity,
        blendMode,
        imageMode,
        imageUrl,
        background,
        pixelate,
        children,
        intensityMode,

        hoverContrastDelta,
        hoverBrightDelta,
        hoverOpacityDelta,

        scrollGrayFrom,
        scrollGrayTo,
        scrollBrightFrom,
        scrollBrightTo,
        scrollContrastFrom,
        scrollContrastTo,
        scrollOpacityFrom,
        scrollOpacityTo,
        scrollOffsetStart,
        scrollOffsetEnd,

        animEnabled,
        animPlayOnHover,
        animDuration,
        animDelay,
        animEase,
        animRepeat,
        animRepeatType,
        animGrayDeltaOn,
        animGrayDeltaFrom,
        animGrayDeltaTo,
        animBrightDeltaOn,
        animBrightDeltaFrom,
        animBrightDeltaTo,
        animContrastDeltaOn,
        animContrastDeltaFrom,
        animContrastDeltaTo,
        animBlurDeltaOn,
        animBlurDeltaFrom,
        animBlurDeltaTo,
        animOpacityDeltaOn,
        animOpacityDeltaFrom,
        animOpacityDeltaTo,

        driftEnabled,
        driftSpeed,
        driftAngle,
        driftJitter,
        driftPauseOnHover,

        tintEnabled,
        tintType,
        tintPosition,
        tintOpacity,
        tintBlendMode,
        tintColor,
        tintColor2,
        tintAngle,
        tintRadialPos,
    } = props

    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const [hovered, setHovered] = React.useState(false)

    const { scrollYProgress } = useScroll({
        target: rootRef,
        offset: [scrollOffsetStart, scrollOffsetEnd],
    }) as any
    const [progress, setProgress] = React.useState(0)
    React.useEffect(() => {
        if (!scrollYProgress) return
        const unsub = scrollYProgress.on("change", (v: number) =>
            setProgress(v)
        )
        return () => unsub?.()
    }, [scrollYProgress])

    // Animated motion values
    const mvGrayD = useMotionValue(0)
    const mvBrightD = useMotionValue(0)
    const mvContrastD = useMotionValue(0)
    const mvBlurD = useMotionValue(0)
    const mvOpacityD = useMotionValue(0)

    React.useEffect(() => {
        if (!enabled || !animEnabled) return
        const runners: (() => void)[] = []
        const common = {
            duration: Math.max(0.1, animDuration),
            ease: animEase,
            delay: Math.max(0, animDelay),
            repeat: animRepeat < 0 ? Infinity : animRepeat,
            repeatType: animRepeatType as any,
        }
        const shouldRun = !animPlayOnHover || hovered
        if (shouldRun) {
            if (animGrayDeltaOn)
                runners.push(
                    run(mvGrayD, animGrayDeltaFrom, animGrayDeltaTo, common)
                )
            if (animBrightDeltaOn)
                runners.push(
                    run(
                        mvBrightD,
                        animBrightDeltaFrom,
                        animBrightDeltaTo,
                        common
                    )
                )
            if (animContrastDeltaOn)
                runners.push(
                    run(
                        mvContrastD,
                        animContrastDeltaFrom,
                        animContrastDeltaTo,
                        common
                    )
                )
            if (animBlurDeltaOn)
                runners.push(
                    run(mvBlurD, animBlurDeltaFrom, animBlurDeltaTo, common)
                )
            if (animOpacityDeltaOn)
                runners.push(
                    run(
                        mvOpacityD,
                        animOpacityDeltaFrom,
                        animOpacityDeltaTo,
                        common
                    )
                )
        }
        return () => runners.forEach((stop) => stop())
    }, [enabled, animEnabled, hovered])

    const grayD = useMotion(mvGrayD)
    const brightD = useMotion(mvBrightD)
    const contrastD = useMotion(mvContrastD)
    const blurD = useMotion(mvBlurD)
    const opacityD = useMotion(mvOpacityD)

    // Filters logic
    let g = gray + grayD
    let b = bright + brightD
    let c = contrast + contrastD
    let o = opacity + opacityD
    let bl = blurPx + blurD

    if (intensityMode === "scroll" || intensityMode === "both") {
        g = lerp(scrollGrayFrom, scrollGrayTo, progress)
        b = lerp(scrollBrightFrom, scrollBrightTo, progress)
        c = lerp(scrollContrastFrom, scrollContrastTo, progress)
        o = lerp(scrollOpacityFrom, scrollOpacityTo, progress)
    }

    if ((intensityMode === "hover" || intensityMode === "both") && hovered) {
        c += hoverContrastDelta
        b += hoverBrightDelta
        o += hoverOpacityDelta
    }

    g = clamp(g, 0, 1)
    o = clamp(o, 0, 1)
    b = Math.max(0, b)
    c = Math.max(0, c)
    bl = Math.max(0, bl)

    const [bgPos, setBgPos] = React.useState({ x: 0, y: 0 })

    React.useEffect(() => {
        if (!enabled || !driftEnabled) return // Drift check
        let raf = 0
        let last = performance.now()
        const rad = (driftAngle * Math.PI) / 180
        const dirX = Math.cos(rad)
        const dirY = Math.sin(rad)
        const tick = (now: number) => {
            raf = requestAnimationFrame(tick)
            if (driftPauseOnHover && hovered) {
                last = now
                return
            }
            const dt = (now - last) / 1000
            last = now
            let dx = dirX * driftSpeed * dt
            let dy = dirY * driftSpeed * dt
            if (driftJitter > 0) {
                const t = now / 1000
                dx += Math.sin(t * 0.7) * driftJitter * 0.5
                dy += Math.cos(t * 0.9) * driftJitter * 0.5
            }
            setBgPos((p) => ({ x: p.x + dx, y: p.y + dy }))
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [
        enabled,
        driftEnabled,
        driftSpeed,
        driftAngle,
        driftJitter,
        driftPauseOnHover,
        hovered,
    ])

    const cellPx =
        sizeMode === "preset"
            ? PRESET_TO_PX[cellPreset]
            : Math.max(1, cellCustomPx)
    const patternURL =
        imageMode === "custom" && imageUrl?.trim()
            ? imageUrl
            : DEFAULT_BAYER_URI

    const overlayStyle: React.CSSProperties = enabled
        ? {
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 2,
              backgroundImage: `url(\"${patternURL}\")`,
              backgroundRepeat: "repeat",
              backgroundSize: `${cellPx}px ${cellPx}px`,
              backgroundPosition: `${bgPos.x}px ${bgPos.y}px`,
              imageRendering: pixelate ? ("pixelated" as any) : undefined,
              opacity: o,
              mixBlendMode: blendMode as any,
              filter: `grayscale(${g}) brightness(${b}) blur(${bl}px) contrast(${c}%)`,
          }
        : { display: "none" }

    const tintBG =
        tintType === "solid"
            ? tintColor
            : tintType === "linear"
              ? `linear-gradient(${tintAngle}deg, ${tintColor}, ${tintColor2})`
              : `radial-gradient(circle at ${tintRadialPos}, ${tintColor}, ${tintColor2})`

    const tintStyle: React.CSSProperties = tintEnabled
        ? {
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: tintPosition === "under" ? 1 : 3,
              backgroundImage: tintBG.includes("gradient") ? tintBG : undefined,
              backgroundColor: tintBG.includes("gradient") ? undefined : tintBG,
              opacity: clamp(tintOpacity, 0, 1),
              mixBlendMode: tintBlendMode as any,
          }
        : { display: "none" }

    return (
        <div
            ref={rootRef}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: "relative",
                isolation: "isolate",
                overflow: "hidden",
                width: "100%",
                height: "100%",
                background: enabled ? background : "transparent",
            }}
        >
            <div
                style={{
                    position: "relative",
                    zIndex: 0,
                    width: "100%",
                    height: "100%",
                }}
            >
                {children}
            </div>
            {/* Disable all visual layers if not enabled */}
            {enabled && (
                <>
                    {tintEnabled && tintPosition === "under" && (
                        <div style={tintStyle} />
                    )}
                    <div style={overlayStyle} />
                    {tintEnabled && tintPosition === "over" && (
                        <div style={tintStyle} />
                    )}
                </>
            )}
        </div>
    )
}

/**
 * Property Controls
 */
addPropertyControls(DitherFX, {
    // Core Setup
    enabled: { type: ControlType.Boolean, title: "Enabled" },
    children: {
        type: ControlType.ComponentInstance,
        title: "Content",
    },
    preset: {
        type: ControlType.Enum,
        title: "Look Preset",
        description: "Apply pre-made style settings.",
        options: ["none", "gameboy", "newspaper", "highContrast"],
        optionTitles: ["None", "Game Boy", "Newspaper", "High Contrast"],
    },
    usePresetAsBase: {
        type: ControlType.Boolean,
        title: "Preset as Base",
        description: "Keep all sliders editable after applying preset.",
    },

    // Pattern & Look
    background: {
        type: ControlType.Color,
        title: "Background",
        description: "Background color behind pattern.",
        defaultValue: "#000000",
    },
    gray: {
        type: ControlType.Number,
        title: "Grayscale",
        description: "Convert to monochrome tone.",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 1,
    },
    bright: {
        type: ControlType.Number,
        title: "Brightness",
        description: "Adjust brightness level.",
        min: 0,
        max: 3,
        step: 0.01,
        defaultValue: 1,
    },
    contrast: {
        type: ControlType.Number,
        title: "Contrast %",
        description: "Increase or decrease contrast.",
        min: 0,
        max: 400,
        step: 1,
        defaultValue: 120,
    },
    blurPx: {
        type: ControlType.Number,
        title: "Blur (px)",
        description: "Softens pattern edges.",
        min: 0,
        max: 50,
        step: 0.5,
        defaultValue: 0,
    },
    opacity: {
        type: ControlType.Number,
        title: "Overlay Opacity",
        description: "Transparency of pattern.",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 1,
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Blend Mode",
        description: "How the pattern blends with content.",
        options: [
            "screen",
            "multiply",
            "overlay",
            "soft-light",
            "hard-light",
            "lighten",
            "darken",
        ],
        optionTitles: [
            "Screen",
            "Multiply",
            "Overlay",
            "Soft Light",
            "Hard Light",
            "Lighten",
            "Darken",
        ],
    },
    pixelate: {
        type: ControlType.Boolean,
        title: "Pixelated Pattern",
        description: "Use blocky retro texture.",
        defaultValue: true,
    },

    // Intensity / Interaction
    intensityMode: {
        type: ControlType.Enum,
        title: "Intensity Mode",
        description: "Make the effect react to hover or scroll.",
        options: ["off", "hover", "scroll", "both"],
        optionTitles: ["Off", "Hover", "Scroll", "Both"],
    },
    hoverContrastDelta: {
        type: ControlType.Number,
        title: "Hover ΔContrast",
        description: "Extra contrast added on hover.",
        min: -200,
        max: 200,
        step: 1,
        hidden: (p) =>
            !(p.intensityMode === "hover" || p.intensityMode === "both"),
    },
    hoverBrightDelta: {
        type: ControlType.Number,
        title: "Hover ΔBrightness",
        description: "Brightness shift on hover.",
        min: -1,
        max: 2,
        step: 0.01,
        hidden: (p) =>
            !(p.intensityMode === "hover" || p.intensityMode === "both"),
    },
    hoverOpacityDelta: {
        type: ControlType.Number,
        title: "Hover ΔOpacity",
        description: "Overlay opacity change on hover.",
        min: -1,
        max: 1,
        step: 0.01,
        hidden: (p) =>
            !(p.intensityMode === "hover" || p.intensityMode === "both"),
    },

    // Pattern Cell Size
    sizeMode: {
        type: ControlType.SegmentedEnum,
        title: "Cell Size",
        options: ["preset", "custom"],
        optionTitles: ["Preset", "Custom"],
    },
    cellPreset: {
        type: ControlType.Enum,
        title: "Preset",
        options: ["xs", "sm", "md", "lg", "xl", "2xl"],
        optionTitles: ["XS", "SM", "MD", "LG", "XL", "2XL"],
        hidden: (p) => p.sizeMode !== "preset",
    },
    cellCustomPx: {
        type: ControlType.Number,
        title: "Custom Size (px)",
        min: 1,
        max: 128,
        step: 1,
        hidden: (p) => p.sizeMode !== "custom",
    },
    imageMode: {
        type: ControlType.SegmentedEnum,
        title: "Pattern Source",
        options: ["default", "custom"],
        optionTitles: ["Bayer", "Custom"],
    },
    imageUrl: {
        type: ControlType.String,
        title: "Custom Pattern URL",
        hidden: (p) => p.imageMode !== "custom",
        description:
            "Replace the default Bayer pattern with your own custom PNG or Base64 texture.",
    },

    // Drift Motion
    driftEnabled: {
        type: ControlType.Boolean,
        title: "Enable Drift",
        description: "Move the pattern slowly.",
    },
    driftSpeed: {
        type: ControlType.Number,
        title: "Speed (px/s)",
        min: 0,
        max: 200,
        step: 1,
        hidden: (p) => !p.driftEnabled,
    },
    driftAngle: {
        type: ControlType.Number,
        title: "Angle (°)",
        min: 0,
        max: 360,
        step: 1,
        hidden: (p) => !p.driftEnabled,
    },
    driftJitter: {
        type: ControlType.Number,
        title: "Jitter",
        description: "Adds random motion.",
        min: 0,
        max: 10,
        step: 0.1,
        hidden: (p) => !p.driftEnabled,
    },
    driftPauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on Hover",
        hidden: (p) => !p.driftEnabled,
    },

    // Tint Overlay
    tintEnabled: {
        type: ControlType.Boolean,
        title: "Enable Tint",
        description: "Add color or gradient layer.",
    },
    tintPosition: {
        type: ControlType.SegmentedEnum,
        title: "Layer Position",
        options: ["under", "over"],
        optionTitles: ["Under", "Over"],
        hidden: (p) => !p.tintEnabled,
    },
    tintType: {
        type: ControlType.SegmentedEnum,
        title: "Tint Type",
        options: ["solid", "linear", "radial"],
        optionTitles: ["Solid", "Linear", "Radial"],
        hidden: (p) => !p.tintEnabled,
    },
    tintColor: {
        type: ControlType.Color,
        title: "Color A",
        hidden: (p) => !p.tintEnabled,
    },
    tintColor2: {
        type: ControlType.Color,
        title: "Color B",
        hidden: (p) => !p.tintEnabled || p.tintType === "solid",
    },
    tintAngle: {
        type: ControlType.Number,
        title: "Angle (°)",
        min: 0,
        max: 360,
        step: 1,
        hidden: (p) => !p.tintEnabled || p.tintType !== "linear",
    },
    tintRadialPos: {
        type: ControlType.String,
        title: "Radial Center",
        placeholder: "center center",
        hidden: (p) => !p.tintEnabled || p.tintType !== "radial",
    },
    tintOpacity: {
        type: ControlType.Number,
        title: "Tint Opacity",
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (p) => !p.tintEnabled,
    },
    tintBlendMode: {
        type: ControlType.Enum,
        title: "Tint Blend Mode",
        options: [
            "normal",
            "screen",
            "multiply",
            "overlay",
            "soft-light",
            "hard-light",
            "lighten",
            "darken",
        ],
        hidden: (p) => !p.tintEnabled,
    },

    // Scroll-Based Intensity
    scrollGrayFrom: {
        type: ControlType.Number,
        title: "Gray From",
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (p) =>
            !(p.intensityMode === "scroll" || p.intensityMode === "both"),
    },
    scrollGrayTo: {
        type: ControlType.Number,
        title: "Gray To",
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (p) =>
            !(p.intensityMode === "scroll" || p.intensityMode === "both"),
    },
    scrollBrightFrom: {
        type: ControlType.Number,
        title: "Bright From",
        min: 0,
        max: 3,
        step: 0.01,
        hidden: (p) =>
            !(p.intensityMode === "scroll" || p.intensityMode === "both"),
    },
    scrollBrightTo: {
        type: ControlType.Number,
        title: "Bright To",
        min: 0,
        max: 3,
        step: 0.01,
        hidden: (p) =>
            !(p.intensityMode === "scroll" || p.intensityMode === "both"),
    },
    scrollContrastFrom: {
        type: ControlType.Number,
        title: "Contrast From",
        min: 0,
        max: 400,
        step: 1,
        hidden: (p) =>
            !(p.intensityMode === "scroll" || p.intensityMode === "both"),
    },
    scrollContrastTo: {
        type: ControlType.Number,
        title: "Contrast To",
        min: 0,
        max: 400,
        step: 1,
        hidden: (p) =>
            !(p.intensityMode === "scroll" || p.intensityMode === "both"),
    },
    scrollOpacityFrom: {
        type: ControlType.Number,
        title: "Opacity From",
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (p) =>
            !(p.intensityMode === "scroll" || p.intensityMode === "both"),
    },
    scrollOpacityTo: {
        type: ControlType.Number,
        title: "Opacity To",
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (p) =>
            !(p.intensityMode === "scroll" || p.intensityMode === "both"),
    },
    scrollOffsetStart: {
        type: ControlType.String,
        title: "Offset Start",
        placeholder: "start end",
        hidden: (p) =>
            !(p.intensityMode === "scroll" || p.intensityMode === "both"),
    },
    scrollOffsetEnd: {
        type: ControlType.String,
        title: "Offset End",
        placeholder: "end start",
        hidden: (p) =>
            !(p.intensityMode === "scroll" || p.intensityMode === "both"),
    },

    // Animation
    animEnabled: {
        type: ControlType.Boolean,
        title: "Enable Animation",
        description: "Animate effect parameters over time.",
    },
    animPlayOnHover: {
        type: ControlType.Boolean,
        title: "Play on Hover",
        hidden: (p) => !p.animEnabled,
    },
    animDuration: {
        type: ControlType.Number,
        title: "Duration (s)",
        min: 0.1,
        max: 20,
        step: 0.1,
        hidden: (p) => !p.animEnabled,
    },
    animDelay: {
        type: ControlType.Number,
        title: "Delay (s)",
        min: 0,
        max: 10,
        step: 0.1,
        hidden: (p) => !p.animEnabled,
    },
    animEase: {
        type: ControlType.Enum,
        title: "Ease Type",
        options: ["linear", "easeIn", "easeOut", "easeInOut"],
        hidden: (p) => !p.animEnabled,
    },
    animRepeat: {
        type: ControlType.Number,
        title: "Repeat (-1∞)",
        min: -1,
        max: 50,
        step: 1,
        hidden: (p) => !p.animEnabled,
    },
    animRepeatType: {
        type: ControlType.Enum,
        title: "Repeat Mode",
        options: ["loop", "mirror", "reverse"],
        hidden: (p) => !p.animEnabled,
    },
    // Animated Parameter Deltas
    animGrayDeltaOn: {
        type: ControlType.Boolean,
        title: "Δ Gray",
        description: "Animate grayscale amount.",
        hidden: (p) => !p.animEnabled,
    },
    animGrayDeltaFrom: {
        type: ControlType.Number,
        title: "Gray Δ From",
        min: -1,
        max: 1,
        step: 0.01,
        hidden: (p) => !p.animEnabled || !p.animGrayDeltaOn,
    },
    animGrayDeltaTo: {
        type: ControlType.Number,
        title: "Gray Δ To",
        min: -1,
        max: 1,
        step: 0.01,
        hidden: (p) => !p.animEnabled || !p.animGrayDeltaOn,
    },

    animBrightDeltaOn: {
        type: ControlType.Boolean,
        title: "Δ Bright",
        description: "Animate brightness.",
        hidden: (p) => !p.animEnabled,
    },
    animBrightDeltaFrom: {
        type: ControlType.Number,
        title: "Bright Δ From",
        min: -1,
        max: 1,
        step: 0.01,
        hidden: (p) => !p.animEnabled || !p.animBrightDeltaOn,
    },
    animBrightDeltaTo: {
        type: ControlType.Number,
        title: "Bright Δ To",
        min: -1,
        max: 1,
        step: 0.01,
        hidden: (p) => !p.animEnabled || !p.animBrightDeltaOn,
    },

    animContrastDeltaOn: {
        type: ControlType.Boolean,
        title: "Δ Contrast",
        description: "Animate contrast (%).",
        hidden: (p) => !p.animEnabled,
    },
    animContrastDeltaFrom: {
        type: ControlType.Number,
        title: "Contrast Δ From",
        min: -200,
        max: 200,
        step: 1,
        hidden: (p) => !p.animEnabled || !p.animContrastDeltaOn,
    },
    animContrastDeltaTo: {
        type: ControlType.Number,
        title: "Contrast Δ To",
        min: -200,
        max: 200,
        step: 1,
        hidden: (p) => !p.animEnabled || !p.animContrastDeltaOn,
    },

    animBlurDeltaOn: {
        type: ControlType.Boolean,
        title: "Δ Blur",
        description: "Animate blur (px).",
        hidden: (p) => !p.animEnabled,
    },
    animBlurDeltaFrom: {
        type: ControlType.Number,
        title: "Blur Δ From",
        min: -20,
        max: 20,
        step: 0.1,
        hidden: (p) => !p.animEnabled || !p.animBlurDeltaOn,
    },
    animBlurDeltaTo: {
        type: ControlType.Number,
        title: "Blur Δ To",
        min: -20,
        max: 20,
        step: 0.1,
        hidden: (p) => !p.animEnabled || !p.animBlurDeltaOn,
    },

    animOpacityDeltaOn: {
        type: ControlType.Boolean,
        title: "Δ Opacity",
        description: "Animate overlay opacity.",
        hidden: (p) => !p.animEnabled,
    },
    animOpacityDeltaFrom: {
        type: ControlType.Number,
        title: "Opacity Δ From",
        min: -1,
        max: 1,
        step: 0.01,
        hidden: (p) => !p.animEnabled || !p.animOpacityDeltaOn,
    },
    animOpacityDeltaTo: {
        type: ControlType.Number,
        title: "Opacity Δ To",
        min: -1,
        max: 1,
        step: 0.01,
        hidden: (p) => !p.animEnabled || !p.animOpacityDeltaOn,
    },
})
