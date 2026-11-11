import * as React from "react"
import { startTransition } from "react"
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

type BackgroundTheme = "Framer Blue" | "Midnight" | "Purple Haze" | "Emerald"

type NoiseMode = "Off" | "Soft" | "Grainy"

interface Props {
    showPresetToggle: boolean
    initialPreset: "A" | "B"

    theme: BackgroundTheme

    baseColor: string
    deepColor: string
    accentColor: string
    highlightColor: string

    vignetteStrength: number

    lineColor: string
    lineOpacity: number
    lineWidth: number
    lineGap: number
    lineBlur: number

    barOpacity: number
    barWidth: number
    barFeather: number

    blobOpacity: number
    blobBlur: number
    blobScale: number

    noise: NoiseMode
    noiseOpacity: number
    noiseScale: number

    animate: boolean
    speed: number
    direction: "up" | "down"
    parallax: number

    style?: React.CSSProperties
}

/**
 * User instructions:
 * - این تصویر رو درنظر بگیر. میخوام تبدیلش کنی به یک لوپ تکرار شونده که به عنوان بکگراند سایت استفاده بشه.
 * - میخوام از تم های مدرنی شبیه به بکگراندهای فریمر استفاده بشه
 */

/**
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
function LoopBackground(props: Props) {
    const {
        showPresetToggle = true,
        initialPreset = "A",

        theme = "Midnight",

        baseColor,
        deepColor,
        accentColor,
        highlightColor,

        vignetteStrength = 0.6,

        lineColor,
        lineOpacity = 0.08,
        lineWidth = 2,
        lineGap = 7,
        lineBlur = 0.35,

        barOpacity = 0.14,
        barWidth = 140,
        barFeather = 0.75,

        blobOpacity = 0.4,
        blobBlur = 26,
        blobScale = 1,

        noise = "Soft",
        noiseOpacity = 0.1,
        noiseScale = 1,

        animate = true,
        speed = 22,
        direction = "up",
        parallax = 0.45,

        style,
    } = props

    const [preset, setPreset] = React.useState<"A" | "B">(initialPreset)

    React.useEffect(() => {
        startTransition(() => setPreset(initialPreset))
    }, [initialPreset])

    const isStatic = useIsStaticRenderer()
    const ref = React.useRef<HTMLDivElement>(null)
    const inView = useInView(ref, { amount: 0.15, once: false })

    const themed = React.useMemo(() => {
        const themes: Record<BackgroundTheme, { base: string; deep: string; accent: string; highlight: string }> = {
            "Framer Blue": {
                base: "#0A0D1F",
                deep: "#04071A",
                accent: "#2A5BFF",
                highlight: "#BFD0FF",
            },
            Midnight: {
                base: "#050615",
                deep: "#01010A",
                accent: "#2E7CFF",
                highlight: "#BBD6FF",
            },
            "Purple Haze": {
                base: "#0B071A",
                deep: "#03010C",
                accent: "#7A4CFF",
                highlight: "#D7C9FF",
            },
            Emerald: {
                base: "#041414",
                deep: "#010A0A",
                accent: "#21D6B5",
                highlight: "#BFF7ED",
            },
        }

        const t = themes[theme] ?? themes["Framer Blue"]

        return {
            base: baseColor || t.base,
            deep: deepColor || t.deep,
            accent: accentColor || t.accent,
            highlight: highlightColor || t.highlight,
            line: lineColor || t.accent,
        }
    }, [theme, baseColor, deepColor, accentColor, highlightColor, lineColor])

    const clamped = React.useMemo(() => {
        const lw = Math.max(1, Math.min(24, Math.round(lineWidth)))
        const lg = Math.max(1, Math.min(64, Math.round(lineGap)))
        const bw = Math.max(24, Math.min(420, Math.round(barWidth)))
        const vb = Math.max(0, Math.min(0.9, vignetteStrength))
        const lo = Math.max(0, Math.min(1, lineOpacity))
        const bo = Math.max(0, Math.min(1, barOpacity))
        const bl = Math.max(0, Math.min(2, lineBlur))
        const bf = Math.max(0, Math.min(1, barFeather))
        const bbo = Math.max(0, Math.min(1, blobOpacity))
        const bblur = Math.max(0, Math.min(80, blobBlur))
        const bscale = Math.max(0.5, Math.min(2, blobScale))
        const s = Math.max(1, Math.min(120, speed))
        const pr = Math.max(0, Math.min(1, parallax))
        const ns = Math.max(0.5, Math.min(2, noiseScale))
        const no = Math.max(0, Math.min(0.5, noiseOpacity))

        return {
            lw,
            lg,
            bw,
            vb,
            lo,
            bo,
            bl,
            bf,
            bbo,
            bblur,
            bscale,
            s,
            pr,
            ns,
            no,
        }
    }, [
        lineWidth,
        lineGap,
        barWidth,
        vignetteStrength,
        lineOpacity,
        barOpacity,
        lineBlur,
        barFeather,
        blobOpacity,
        blobBlur,
        blobScale,
        speed,
        parallax,
        noiseScale,
        noiseOpacity,
    ])

    const tileX = React.useMemo(() => {
        // Make the animation loop seamlessly by shifting exactly one tile width.
        // Keep it small enough to look like the reference scanline texture.
        const stripeTile = clamped.lw + clamped.lg
        // Ensure not too tiny (banding) and not too large (obvious repetition)
        return Math.max(64, Math.min(420, stripeTile * 20))
    }, [clamped.lw, clamped.lg])

    const shouldAnimate = animate && !isStatic && inView

    const dir = direction === "up" ? -1 : 1
    const duration = tileX / Math.max(1, clamped.s)

    const baseGradient = React.useMemo(() => {
        // Deep top, lighter mid like the image.
        const angle = preset === "A" ? "180deg" : "90deg"
        return `linear-gradient(${angle}, ${themed.deep} 0%, ${themed.base} 38%, rgba(0,0,0,0) 100%)`
    }, [themed.deep, themed.base, preset])

    const verticalWash = React.useMemo(() => {
        // Subtle wide rows and a bottom-side brighter beam.
        // Use multiple gradients to approximate the tall bright bands in the reference.
        const a = themed.accent
        const h = themed.highlight

        // Feathered bar helper via transparent edges.
        const feather = clamped.bf
        const inner = Math.max(0.02, Math.min(0.35, 0.08 + (1 - feather) * 0.18))
        const edge = Math.max(inner + 0.02, Math.min(0.48, inner + 0.22 + feather * 0.12))

        const washAngle = preset === "A" ? "0deg" : "90deg"
        return [
            `linear-gradient(${washAngle},
                rgba(0,0,0,0) 0%,
                rgba(0,0,0,0) 10%,
                color-mix(in srgb, ${a} 65%, transparent) 22%,
                rgba(0,0,0,0) 36%,
                color-mix(in srgb, ${a} 55%, transparent) 52%,
                rgba(0,0,0,0) 68%,
                color-mix(in srgb, ${h} 70%, transparent) 92%,
                rgba(0,0,0,0) 100%
            )`,
            `repeating-linear-gradient(${washAngle},
                rgba(0,0,0,0) 0px,
                rgba(0,0,0,0) ${clamped.bw - 2}px,
                color-mix(in srgb, ${a} 40%, transparent) ${clamped.bw - 2}px,
                rgba(0,0,0,0) ${clamped.bw + 10}px
            )`,
            `linear-gradient(${washAngle},
                rgba(0,0,0,0) 0%,
                rgba(0,0,0,0) 78%,
                color-mix(in srgb, ${h} 25%, transparent) ${Math.round((1 - edge) * 100)}%,
                color-mix(in srgb, ${h} 45%, transparent) ${Math.round((1 - inner) * 100)}%,
                color-mix(in srgb, ${h} 25%, transparent) 98%,
                rgba(0,0,0,0) 100%
            )`,
        ].join(",")
    }, [themed.accent, themed.highlight, clamped.bw, clamped.bf, preset])

    const stripes = React.useMemo(() => {
        // Thin scanlines (support vertical/horizontal looping animation).
        const rgbaLine = `rgba(0,0,0,0)`
        const mixLine = `color-mix(in srgb, ${themed.line} 55%, transparent)`
        const angle = preset === "A" ? "0deg" : "90deg"
        return `repeating-linear-gradient(${angle},
            ${mixLine} 0px,
            ${mixLine} ${clamped.lw}px,
            rgba(0,0,0,0) ${clamped.lw}px,
            rgba(0,0,0,0) ${clamped.lw + clamped.lg}px
        ), repeating-linear-gradient(${angle},
            ${rgbaLine} 0px,
            ${rgbaLine} 1px,
            rgba(0,0,0,0) 1px,
            rgba(0,0,0,0) ${Math.max(2, Math.round((clamped.lw + clamped.lg) * 0.5))}px
        )`
    }, [themed.line, clamped.lw, clamped.lg, preset])

    const blobs = React.useMemo(() => {
        const a = themed.accent
        const h = themed.highlight
        const scale = clamped.bscale
        const o = clamped.bbo

        return [
            `radial-gradient(${Math.round(360 * scale)}px ${Math.round(680 * scale)}px at 22% 88%,
                color-mix(in srgb, ${a} 22%, transparent) 0%,
                color-mix(in srgb, ${a} 70%, transparent) 30%,
                rgba(0,0,0,0) 70%
            )`,
            `radial-gradient(${Math.round(520 * scale)}px ${Math.round(760 * scale)}px at 46% 70%,
                color-mix(in srgb, ${a} 78%, transparent) 0%,
                color-mix(in srgb, ${h} 18%, transparent) 28%,
                rgba(0,0,0,0) 68%
            )`,
            `radial-gradient(${Math.round(420 * scale)}px ${Math.round(720 * scale)}px at 72% 86%,
                color-mix(in srgb, ${a} 20%, transparent) 0%,
                color-mix(in srgb, ${a} 70%, transparent) 26%,
                rgba(0,0,0,0) 68%
            )`,
            `radial-gradient(${Math.round(240 * scale)}px ${Math.round(620 * scale)}px at 94% 62%,
                color-mix(in srgb, ${h} 22%, transparent) 0%,
                color-mix(in srgb, ${h} 60%, transparent) 20%,
                rgba(0,0,0,0) 60%
            )`,
        ].join(",")
    }, [themed.accent, themed.highlight, clamped.bscale, clamped.bbo])

    const vignette = React.useMemo(() => {
        const v = clamped.vb
        if (v <= 0) return "none"
        return `radial-gradient(120% 120% at 50% 40%,
            rgba(0,0,0,0) 35%,
            rgba(0,0,0,${Math.min(0.7, 0.22 + v * 0.55)}) 100%
        )`
    }, [clamped.vb])

    const noiseBg = React.useMemo(() => {
        if (noise === "Off" || clamped.no <= 0) return "none"

        const soft = noise === "Soft"
        const alpha = clamped.no
        const s = clamped.ns

        // Pure CSS procedural noise approximation using dense repeating gradients.
        // (Not true noise, but looks like Framer-style grain once blended.)
        const g1 = `repeating-linear-gradient(0deg,
            rgba(255,255,255,${alpha * (soft ? 0.22 : 0.38)}) 0px,
            rgba(255,255,255,0) ${Math.max(1, Math.round(2 * s))}px,
            rgba(0,0,0,${alpha * (soft ? 0.18 : 0.3)}) ${Math.max(2, Math.round(3 * s))}px,
            rgba(0,0,0,0) ${Math.max(3, Math.round(5 * s))}px
        )`
        const g2 = `repeating-linear-gradient(90deg,
            rgba(255,255,255,${alpha * (soft ? 0.16 : 0.32)}) 0px,
            rgba(255,255,255,0) ${Math.max(1, Math.round(2 * s))}px,
            rgba(0,0,0,${alpha * (soft ? 0.12 : 0.26)}) ${Math.max(2, Math.round(3 * s))}px,
            rgba(0,0,0,0) ${Math.max(3, Math.round(6 * s))}px
        )`

        return `${g1}, ${g2}`
    }, [noise, clamped.no, clamped.ns])

    const layerCommon: React.CSSProperties = React.useMemo(
        () => ({
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            backgroundRepeat: "repeat",
            willChange: shouldAnimate ? "background-position, transform" : undefined,
        }),
        [shouldAnimate]
    )

    const stripesStyle: React.CSSProperties = React.useMemo(
        () => ({
            ...layerCommon,
            opacity: 1,
            backgroundImage: stripes,
            backgroundSize: preset === "A" ? `100% ${tileX}px` : `${tileX}px 100%`,
            filter: clamped.bl > 0 ? `blur(${clamped.bl}px)` : "none",
            mixBlendMode: "screen",
        }),
        [layerCommon, stripes, tileX, clamped.bl, preset]
    )

    const barsStyle: React.CSSProperties = React.useMemo(
        () => ({
            ...layerCommon,
            opacity: 1,
            backgroundImage: verticalWash,
            backgroundSize: preset === "A" ? `100% ${Math.round(tileX * 1.35)}px` : `${Math.round(tileX * 1.35)}px 100%`,
            mixBlendMode: "screen",
        }),
        [layerCommon, verticalWash, tileX, preset]
    )

    const blobStyle: React.CSSProperties = React.useMemo(
        () => ({
            ...layerCommon,
            opacity: 1,
            backgroundImage: blobs,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            filter: clamped.bblur > 0 ? `blur(${clamped.bblur}px)` : "none",
            mixBlendMode: "screen",
            transform: "translateZ(0)",
        }),
        [layerCommon, blobs, clamped.bblur]
    )

    const noiseStyle: React.CSSProperties = React.useMemo(
        () => ({
            ...layerCommon,
            opacity: 1,
            backgroundImage: noiseBg,
            backgroundSize: `${Math.round(180 * clamped.ns)}px ${Math.round(180 * clamped.ns)}px`,
            mixBlendMode: "overlay",
        }),
        [layerCommon, noiseBg, clamped.ns]
    )

    const vignetteStyle: React.CSSProperties = React.useMemo(
        () => ({
            ...layerCommon,
            backgroundImage: vignette,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            mixBlendMode: "multiply",
            opacity: vignette === "none" ? 0 : 1,
        }),
        [layerCommon, vignette]
    )

    const baseStyle: React.CSSProperties = React.useMemo(
        () => ({
            position: "relative",
            width: "100%",
            height: "100%",
            // Ensure the component is always selectable on the canvas.
            // Framer can sometimes instantiate components at 0x0 before constraints are applied.
            minWidth: 5,
            minHeight: 5,
            overflow: "hidden",
            backgroundColor: themed.base,
            backgroundImage: baseGradient,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            transform: "translateZ(0)",
            ...style,
        }),
        [themed.base, baseGradient, style]
    )

    const stripeAnim = React.useMemo(() => {
        if (!shouldAnimate) return undefined
        const from = 0
        const to = dir * tileX
        return {
            ...(preset === "A"
                ? { backgroundPositionY: [`${from}px`, `${to}px`] }
                : { backgroundPositionX: [`${from}px`, `${to}px`] }),
            transition: {
                duration,
                ease: "linear" as const,
                repeat: Infinity,
            },
        }
    }, [shouldAnimate, dir, tileX, duration, preset])

    const barAnim = React.useMemo(() => {
        if (!shouldAnimate) return undefined
        const from = 0
        const to = dir * Math.round(tileX * (0.6 + clamped.pr))
        return {
            ...(preset === "A"
                ? { backgroundPositionY: [`${from}px`, `${to}px`] }
                : { backgroundPositionX: [`${from}px`, `${to}px`] }),
            transition: {
                duration: duration * (1.35 + clamped.pr * 1.25),
                ease: "linear" as const,
                repeat: Infinity,
            },
        }
    }, [shouldAnimate, dir, tileX, duration, clamped.pr, preset])

    const blobAnim = React.useMemo(() => {
        if (!shouldAnimate) return undefined
        const dTo = dir * Math.round(120 + tileX * 0.18 + clamped.pr * 240)
        return {
            ...(preset === "A" ? { y: [0, dTo] } : { x: [0, dTo] }),
            transition: {
                duration: duration * (1.9 + clamped.pr * 1.8),
                ease: "linear" as const,
                repeat: Infinity,
            },
        }
    }, [shouldAnimate, dir, tileX, duration, clamped.pr, preset])

    const noiseAnim = React.useMemo(() => {
        if (!shouldAnimate || noise === "Off") return undefined
        const to = dir * Math.round(90 + clamped.pr * 180)
        return {
            ...(preset === "A" ? { backgroundPositionY: ["0px", `${to}px`] } : { backgroundPositionX: ["0px", `${to}px`] }),
            transition: {
                duration: duration * (0.9 + clamped.pr),
                ease: "linear" as const,
                repeat: Infinity,
            },
        }
    }, [shouldAnimate, noise, dir, clamped.pr, duration, preset])

    return (
        <div ref={ref} style={baseStyle} aria-hidden="true">
            {showPresetToggle && (
                <button
                    type="button"
                    onClick={() => {
                        startTransition(() => setPreset((p) => (p === "A" ? "B" : "A")))
                    }}
                    style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        zIndex: 10,
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(0,0,0,0.25)",
                        color: "rgba(255,255,255,0.9)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        cursor: "pointer",
                        fontSize: 12,
                        lineHeight: "14px",
                    }}
                    aria-label="Toggle background preset"
                >
                    {preset === "A" ? "Theme 1" : "Theme 2"}
                </button>
            )}
            <motion.div style={blobStyle} animate={blobAnim} />
            <motion.div style={barsStyle} animate={barAnim} />
            <motion.div style={stripesStyle} animate={stripeAnim} />
            <motion.div style={noiseStyle} animate={noiseAnim} />
            <div style={vignetteStyle} />
        </div>
    )
}

LoopBackground.displayName = "LoopBackground"

export default LoopBackground

addPropertyControls(LoopBackground, {
    showPresetToggle: {
        type: ControlType.Boolean,
        title: "Preset Button",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    initialPreset: {
        type: ControlType.Enum,
        title: "Initial Preset",
        options: ["A", "B"],
        optionTitles: ["Horizontal + Vertical", "Vertical + Horizontal"],
        defaultValue: "A",
        displaySegmentedControl: true,
    },

    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["Framer Blue", "Midnight", "Purple Haze", "Emerald"],
        defaultValue: "Midnight",
        displaySegmentedControl: true,
    },

    baseColor: { type: ControlType.Color, title: "Base", defaultValue: "#050615" },
    deepColor: { type: ControlType.Color, title: "Deep", defaultValue: "#01010A" },
    accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#2E7CFF" },
    highlightColor: { type: ControlType.Color, title: "Highlight", defaultValue: "#BBD6FF" },

    vignetteStrength: {
        type: ControlType.Number,
        title: "Vignette",
        defaultValue: 0.6,
        min: 0,
        max: 0.9,
        step: 0.01,
    },

    lineColor: { type: ControlType.Color, title: "Line Color", defaultValue: "#2E7CFF" },
    lineOpacity: {
        type: ControlType.Number,
        title: "Line Opacity",
        defaultValue: 0.08,
        min: 0,
        max: 1,
        step: 0.01,
    },
    lineWidth: {
        type: ControlType.Number,
        title: "Line Width",
        defaultValue: 2,
        min: 1,
        max: 24,
        step: 1,
        unit: "px",
    },
    lineGap: {
        type: ControlType.Number,
        title: "Line Gap",
        defaultValue: 7,
        min: 1,
        max: 64,
        step: 1,
        unit: "px",
    },
    lineBlur: {
        type: ControlType.Number,
        title: "Line Blur",
        defaultValue: 0.35,
        min: 0,
        max: 2,
        step: 0.05,
        unit: "px",
    },

    barOpacity: {
        type: ControlType.Number,
        title: "Bar Opacity",
        defaultValue: 0.14,
        min: 0,
        max: 1,
        step: 0.01,
    },
    barWidth: {
        type: ControlType.Number,
        title: "Bar Width",
        defaultValue: 140,
        min: 24,
        max: 420,
        step: 1,
        unit: "px",
    },
    barFeather: {
        type: ControlType.Number,
        title: "Bar Feather",
        defaultValue: 0.75,
        min: 0,
        max: 1,
        step: 0.01,
    },

    blobOpacity: {
        type: ControlType.Number,
        title: "Blob Opacity",
        defaultValue: 0.4,
        min: 0,
        max: 1,
        step: 0.01,
    },
    blobBlur: {
        type: ControlType.Number,
        title: "Blob Blur",
        defaultValue: 26,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    blobScale: {
        type: ControlType.Number,
        title: "Blob Scale",
        defaultValue: 1,
        min: 0.5,
        max: 2,
        step: 0.01,
    },

    noise: {
        type: ControlType.Enum,
        title: "Noise",
        options: ["Off", "Soft", "Grainy"],
        defaultValue: "Soft",
        displaySegmentedControl: true,
    },
    noiseOpacity: {
        type: ControlType.Number,
        title: "Noise Opacity",
        defaultValue: 0.1,
        min: 0,
        max: 0.5,
        step: 0.01,
        hidden: (p) => p.noise === "Off",
    },
    noiseScale: {
        type: ControlType.Number,
        title: "Noise Scale",
        defaultValue: 1,
        min: 0.5,
        max: 2,
        step: 0.01,
        hidden: (p) => p.noise === "Off",
    },

    animate: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 22,
        min: 1,
        max: 120,
        step: 1,
        hidden: (p) => !p.animate,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["up", "down"],
        optionTitles: ["Up", "Down"],
        defaultValue: "up",
        displaySegmentedControl: true,
        hidden: (p) => !p.animate,
    },
    parallax: {
        type: ControlType.Number,
        title: "Parallax",
        defaultValue: 0.45,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: (p) => !p.animate,
    },
})