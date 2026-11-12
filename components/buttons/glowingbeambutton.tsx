import React, { useRef, useMemo } from "react"
import { motion, useReducedMotion } from "framer-motion"
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
    ArrowRight,
    ArrowUpRight,
    Check,
    Download,
    Play,
    Star,
    Heart,
    Plus,
    Rocket,
    Crown,
    Globe,
    Gift,
    Info,
    ExternalLink,
} from "lucide-react"

/**
 * @framerDisableUnlinking
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 260
 * @framerIntrinsicHeight 56
 */

type Variant = "Black" | "White" | "Transparent"
type ColorStyle = "Rainbow" | "Lava Flow" | "Glacial Ice" | "Custom"
type TextColorChoice = "Default" | "Custom"
type BackgroundColorChoice = "Default" | "Custom"
type GlowStyle = "Default" | "Filled"

interface FontInfo {
    fontFamily?: string
    family?: string
    fontSize?: number | string
    size?: number | string
    fontWeight?: number | string
    weight?: number | string
    variant?: string
    lineHeight?: string | number
    letterSpacing?: string | number
    textAlign?: "left" | "center" | "right" | "justify"
}
interface SizingAndRadius {
    paddingX: number
    paddingY: number
    radius: number
}
interface GlareSettings {
    withGlare: boolean
    playOnce: boolean
    color: string
    opacity: number
    angle: number
    duration: number
}
interface ParticleSettings {
    speed: number
    count: number
    minSize: number
    maxSize: number
    minBlur: number
    maxBlur: number
}
interface GlowSettings {
    style: GlowStyle
    outer: number
    inner: number
    speed: number
}
type Props = {
    text: string
    font: FontInfo
    href?: string
    openInNewTab?: boolean
    variant: Variant
    backgroundColorChoice: BackgroundColorChoice
    customBackgroundColor: string
    textColorChoice: TextColorChoice
    customTextColor: string
    style?: React.CSSProperties
    particleSettings: ParticleSettings
    showIcon?: boolean
    iconName?: string
    iconScale?: number
    iconGap?: number
    matchTextColor?: boolean
    iconColor?: string
    colorStyle: ColorStyle
    customColors: string[]
    sizingAndRadius: SizingAndRadius
    glare: GlareSettings
    glowSettings: GlowSettings
}

// ----   Style & Animation Constants   ----
const CSS_ID = "rb-anim-css"
const ANGLE_VAR = "--rb-angle"

const RING_WIDTH = 1,
    ROTATION_SECONDS_BASE = 5,
    ICON_SHIFT = 4
const INNER_GLOW_BLUR_MAX = 100
const INNER_GLOW_BLUR_MIN = 15

const INNER_GLOW_OPACITY_BASE = 0.8,
    INNER_GLOW_OPACITY_MULTIPLIER = 0.8
const OUTER_GLOW_BLUR_BASE = 10,
    OUTER_GLOW_BLUR_MULTIPLIER = 30
const OUTER_GLOW_OPACITY_BASE = 0.2,
    OUTER_GLOW_OPACITY_MULTIPLIER = 0.9
const BEAM_WIDTH_DEFAULT = 200

// --- Framer Motion Config ---
const ICON_VARIANTS = { rest: { x: 0 }, hover: { x: ICON_SHIFT } }
const ICON_TRANSITION = {
    type: "spring",
    stiffness: 600,
    damping: 45,
    mass: 0.2,
}

// --- Global CSS Injection ---
function ensureGlobalCSS() {
    if (typeof document === "undefined" || document.getElementById(CSS_ID))
        return

    const style = document.createElement("style")
    style.id = CSS_ID
    style.textContent = `
        @property ${ANGLE_VAR} { syntax: '<angle>'; inherits: true; initial-value: 0deg; }
        @keyframes rb-spin { to { ${ANGLE_VAR}: 1turn; } }
        @media (prefers-reduced-motion: reduce) { .rb-stop-anim { animation: none !important; } }
        .rb-ring { position: relative; }
    `
    document.head.appendChild(style)
}

// --- Font Normalization ---
const weightMap: Record<string, number> = {
    thin: 100,
    extralight: 200,
    ultralight: 200,
    light: 300,
    regular: 400,
    normal: 400,
    book: 400,
    medium: 500,
    semibold: 600,
    demibold: 600,
    bold: 700,
    extrabold: 800,
    ultrabold: 800,
    black: 900,
    heavy: 900,
}
function normalizeFont(f: FontInfo): React.CSSProperties {
    const family = f?.fontFamily ?? f?.family
    const rawSize = f?.fontSize ?? f?.size
    const rawWeight = f?.fontWeight ?? f?.weight ?? f?.variant
    return {
        ...(family && { fontFamily: family }),
        fontSize:
            typeof rawSize === "number"
                ? rawSize
                : parseFloat(String(rawSize)) || 18,
        fontWeight:
            typeof rawWeight === "number"
                ? rawWeight
                : (weightMap[String(rawWeight || "").toLowerCase()] ?? 600),
        lineHeight: f?.lineHeight !== undefined ? f.lineHeight : "1.2em",
        ...(f?.letterSpacing !== undefined && {
            letterSpacing: f.letterSpacing,
        }),
        ...(f?.textAlign && { textAlign: f.textAlign }),
    }
}

// --- Color & Gradient Logic ---
const COLOR_PRESETS: Record<string, string[]> = {
    Rainbow: ["#FF0000", "#FF7A00", "#FFBB00", "#18FF92", "#00B3FF", "#8F00FF"],
    "Lava Flow": ["#FF2200", "#FF4A00", "#FF9500", "#FF4A00"],
    "Glacial Ice": ["#00A2FF", "#00F0FF", "#B4FFFF", "#00F0FF"],
}

function parseColor(color: string): { r: number; g: number; b: number } | null {
    if (typeof color !== "string") return null
    let match = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
    if (match)
        return {
            r: parseInt(match[1], 16),
            g: parseInt(match[2], 16),
            b: parseInt(match[3], 16),
        }
    match = color.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i)
    if (match)
        return {
            r: parseInt(match[1] + match[1], 16),
            g: parseInt(match[2] + match[2], 16),
            b: parseInt(match[3] + match[3], 16),
        }
    match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/)
    if (match)
        return {
            r: parseInt(match[1], 10),
            g: parseInt(match[2], 10),
            b: parseInt(match[3], 10),
        }
    return null
}

function toRgbaString(color: string, alpha: number): string {
    const parsed = parseColor(color)
    if (!parsed) return `rgba(255, 255, 255, ${alpha.toFixed(3)})`
    return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${alpha.toFixed(3)})`
}

function interpolateColors(colors: string[], steps = 10): string[] {
    if (colors.length <= 1) return colors
    const interpolated = [colors[0]]
    for (let i = 0; i < colors.length - 1; i++) {
        const start = parseColor(colors[i])
        const end = parseColor(colors[i + 1])
        if (!start || !end) continue
        for (let j = 1; j <= steps; j++) {
            const t = j / steps
            const r = Math.round(start.r * (1 - t) + end.r * t)
            const g = Math.round(start.g * (1 - t) + end.g * t)
            const b = Math.round(start.b * (1 - t) + end.b * t)
            interpolated.push(`rgb(${r}, ${g}, ${b})`)
        }
    }
    return interpolated
}

function beamRainbow(colors, angleVar = ANGLE_VAR) {
    if (!colors || colors.length === 0) {
        return `conic-gradient(from var(${angleVar}), transparent 0deg, transparent 360deg)`
    }

    const gapDeg = 24
    const fadeDeg = 50
    const widthDeg = BEAM_WIDTH_DEFAULT
    const overlapDeg = 0

    if (colors.length === 1) {
        const color = colors[0]
        const transparent = toRgbaString(color, 0)
        const opaque = toRgbaString(color, 0.95)
        return `conic-gradient(from var(${angleVar}),
            transparent ${gapDeg}deg,
            ${transparent} ${gapDeg}deg,
            ${opaque} ${gapDeg + fadeDeg}deg,
            ${opaque} ${widthDeg - fadeDeg}deg,
            ${transparent} ${widthDeg + overlapDeg}deg,
            transparent ${widthDeg + overlapDeg}deg
        )`
    }

    const segs = colors.length > 1 ? colors.length - 1 : 1
    const bodyStartDeg = gapDeg + fadeDeg
    const bodyEndDeg = widthDeg - fadeDeg
    const bodyWidth = bodyEndDeg - bodyStartDeg

    const opaqueStops = colors
        .map((color, i) => {
            const t = i / segs
            const deg = bodyStartDeg + t * bodyWidth
            return `${toRgbaString(color, 0.95)} ${deg}deg`
        })
        .join(", ")

    return `conic-gradient(from var(${angleVar}),
        transparent ${gapDeg}deg,
        ${toRgbaString(colors[0], 0)} ${gapDeg}deg,
        ${opaqueStops},
        ${toRgbaString(colors[colors.length - 1], 0)} ${
            widthDeg + overlapDeg
        }deg,
        transparent ${widthDeg + overlapDeg}deg
    )`
}

function beamRainbowSolid(colors, angleVar = ANGLE_VAR) {
    if (!colors || colors.length === 0) {
        return `conic-gradient(from var(${angleVar}), transparent 0turn, transparent 1turn)`
    }

    const opaque = (c) => toRgbaString(c, 0.95)

    if (colors.length === 1) {
        const c = opaque(colors[0])
        return `conic-gradient(from var(${angleVar}), ${c} 0deg, ${c} 360deg)`
    }

    const extendedColors = [...colors, colors[0]]
    const stops = extendedColors
        .map((c, i) => {
            const t = i / colors.length
            const deg = (t * 360).toFixed(3) + "deg"
            return `${opaque(c)} ${deg}`
        })
        .join(", ")

    return `conic-gradient(from var(${angleVar}), ${stops})`
}

// --- Other Utilities ---
function ringColorForVariant(variant: Variant): string {
    const colorMap = {
        Black: "#303030",
        White: "#B3B3B3",
        Transparent: "#6A6A6A",
    }
    return colorMap[variant]
}
function baseRingGradient(color: string) {
    return `conic-gradient(${color} 0turn, ${color} 1turn)`
}
const ICON_OPTIONS = [
    "ArrowRight",
    "ArrowUpRight",
    "Check",
    "Download",
    "Play",
    "Star",
    "Heart",
    "Plus",
    "Rocket",
    "Crown",
    "Globe",
    "Gift",
    "Info",
    "ExternalLink",
] as const
type IconName = (typeof ICON_OPTIONS)[number]
const LucideMap: Record<IconName, React.ComponentType<any>> = {
    ArrowRight,
    ArrowUpRight,
    Check,
    Download,
    Play,
    Star,
    Heart,
    Plus,
    Rocket,
    Crown,
    Globe,
    Gift,
    Info,
    ExternalLink,
}
function normalizeIconName(name?: string): IconName {
    const n = String(name || "")
        .trim()
        .toLowerCase()
    return ICON_OPTIONS.find((opt) => opt.toLowerCase() === n) || "ArrowRight"
}
function strokeWidthFor() {
    return 2.5
}
function rnd(min: number, max: number) {
    return min + Math.random() * (max - min)
}
function mapRange(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
): number {
    if (inMin === inMax) return (outMin + outMax) / 2
    const t = (value - inMin) / (inMax - inMin)
    return outMin + t * (outMax - outMin)
}

/* ---------------------- Particles Sub-Component ---------------------- */
function MovingStarField({
    count,
    borderRadius,
    speed,
    colors,
    minSize,
    maxSize,
    minBlur,
    maxBlur,
    glowStyle,
}: any) {
    const prefersReduced = useReducedMotion()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const canAnimate = !prefersReduced && !isCanvas
    const wrapRef = React.useRef<HTMLDivElement>(null)
    const [dims, setDims] = React.useState({ w: 0, h: 0 })

    React.useLayoutEffect(() => {
        const el = wrapRef.current
        if (!el) return
        const update = () => {
            const r = el.getBoundingClientRect()
            setDims({
                w: Math.max(1, Math.round(r.width)),
                h: Math.max(1, Math.round(r.height)),
            })
        }
        update()
        const ro =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(update)
                : null
        ro?.observe(el)
        window.addEventListener("resize", update)
        return () => {
            ro?.disconnect()
            window.removeEventListener("resize", update)
        }
    }, [])

    const stars = useMemo(() => {
        return Array.from({ length: count }, () => {
            const size = rnd(minSize, maxSize)
            const calculatedBlur = rnd(minBlur, maxBlur)

            return {
                left: rnd(2, 98),
                top: rnd(6, 94),
                size,
                blur: calculatedBlur,
                ampX: rnd(3, 10) * (Math.random() < 0.5 ? -1 : 1),
                ampY: rnd(3, 10) * (Math.random() < 0.5 ? -1 : 1),
                durX: rnd(14, 26),
                durY: rnd(14, 26),
                delayX: rnd(0, 4),
                delayY: rnd(0, 4),
            }
        })
    }, [count, minSize, maxSize, minBlur, maxBlur])

    const particleGradient =
        glowStyle === "Filled" ? beamRainbowSolid : beamRainbow

    if (prefersReduced || dims.w === 0)
        return (
            <div
                ref={wrapRef}
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius,
                    pointerEvents: "none",
                    zIndex: 2,
                    overflow: "hidden",
                }}
            />
        )

    const maskStyles: React.CSSProperties = {
        WebkitMaskImage: particleGradient(colors),
        maskImage: particleGradient(colors),
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "100% 100%",
        maskSize: "100% 100%",
    }
    const sp = Math.max(0.1, speed)

    return (
        <div
            ref={wrapRef}
            aria-hidden
            style={{
                position: "absolute",
                inset: 0,
                borderRadius,
                pointerEvents: "none",
                zIndex: 2,
                overflow: "hidden",
                ...maskStyles,
            }}
        >
            {stars.map((s, idx) => {
                const initBgX = -(dims.w * s.left) / 100,
                    initBgY = -(dims.h * s.top) / 100
                const commonStyle: React.CSSProperties = {
                    position: "absolute",
                    left: `${s.left}%`,
                    top: `${s.top}%`,
                    width: `${s.size}px`,
                    height: `${s.size}px`,
                    backgroundImage: particleGradient(colors),
                    backgroundRepeat: "no-repeat",
                    backgroundSize: `${dims.w}px ${dims.h}px`,
                    filter: `blur(${s.blur}px)`,
                    borderRadius: 999,
                    pointerEvents: "none",
                    transform: "translateZ(0)",
                }
                if (!canAnimate)
                    return (
                        <div
                            key={idx}
                            style={{
                                ...commonStyle,
                                backgroundPosition: `${initBgX}px ${initBgY}px`,
                            }}
                        />
                    )
                const bgXFrames = [
                    initBgX,
                    initBgX - s.ampX,
                    initBgX + s.ampX,
                    initBgX,
                ].map((n) => `${n}px`)
                const bgYFrames = [
                    initBgY,
                    initBgY - s.ampY,
                    initBgY + s.ampY,
                    initBgY,
                ].map((n) => `${n}px`)
                return (
                    <motion.div
                        key={idx}
                        initial={{
                            backgroundPositionX: `${initBgX}px`,
                            backgroundPositionY: `${initBgY}px`,
                        }}
                        animate={{
                            x: [0, s.ampX, -s.ampX, 0],
                            y: [0, s.ampY, -s.ampY, 0],
                            backgroundPositionX: bgXFrames,
                            backgroundPositionY: bgYFrames,
                        }}
                        transition={{
                            x: {
                                duration: s.durX / sp,
                                delay: s.delayX / sp,
                                repeat: Infinity,
                                ease: "linear",
                            },
                            y: {
                                duration: s.durY / sp,
                                delay: s.delayY / sp,
                                repeat: Infinity,
                                ease: "linear",
                            },
                            backgroundPositionX: {
                                duration: s.durX / sp,
                                delay: s.delayX / sp,
                                repeat: Infinity,
                                ease: "linear",
                            },
                            backgroundPositionY: {
                                duration: s.durY / sp,
                                delay: s.delayY / sp,
                                repeat: Infinity,
                                ease: "linear",
                            },
                        }}
                        style={commonStyle}
                    />
                )
            })}
        </div>
    )
}

/* ---------------------- Main Component ---------------------- */

export default function GlowingBeamButton(props: Props) {
    React.useEffect(() => ensureGlobalCSS(), [])

    const {
        text,
        font,
        href,
        openInNewTab = false,
        style,
        variant = "Black",
        backgroundColorChoice = "Default",
        customBackgroundColor = "#000000",
        textColorChoice = "Default",
        customTextColor = "#FFFFFF",
        showIcon = false,
        iconName = "ArrowRight",
        iconScale = 1,
        iconGap = 10,
        matchTextColor = true,
        iconColor = "#FFFFFF",
        particleSettings = {
            speed: 1,
            count: 50,
            minSize: 1.5,
            maxSize: 4,
            minBlur: 0.1,
            maxBlur: 1.5,
        },
        colorStyle,
        customColors,
        glowSettings = {
            style: "Default",
            outer: 0.7,
            inner: 0.5,
            speed: 1,
        },
        sizingAndRadius = { paddingX: 26, paddingY: 18, radius: 999 },
        glare = {
            withGlare: true,
            playOnce: false,
            color: "#FFFFFF",
            opacity: 0.1,
            angle: -45,
            duration: 650,
        },
    } = props

    const glowGradient =
        glowSettings.style === "Filled" ? beamRainbowSolid : beamRainbow

    const finalRainbowColors = useMemo(() => {
        let baseColors =
            colorStyle === "Custom"
                ? customColors || []
                : COLOR_PRESETS[colorStyle] || COLOR_PRESETS["Rainbow"]

        let processedColors = [...baseColors]

        if (
            glowSettings.style === "Filled" &&
            processedColors.length > 1 &&
            processedColors[0] !== processedColors[processedColors.length - 1]
        ) {
            processedColors.push(processedColors[0])
        }

        return interpolateColors(processedColors)
    }, [colorStyle, customColors, glowSettings.style])

    const isTransparent = variant === "Transparent"
    const prefersReducedMotion = useReducedMotion()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const glareRef = useRef<HTMLDivElement>(null)
    const canAnimateGlare =
        !isCanvas && !prefersReducedMotion && glare.withGlare

    const animateGlareIn = () => {
        if (!canAnimateGlare || !glareRef.current) return
        const el = glareRef.current
        el.style.transition = "none"
        el.style.transform = "translateX(-100%)"
        requestAnimationFrame(() => {
            el.style.transition = `transform ${glare.duration}ms ease-in-out`
            el.style.transform = "translateX(100%)"
        })
    }

    const animateGlareOut = () => {
        if (!canAnimateGlare || !glareRef.current) return
        const el = glareRef.current
        if (glare.playOnce) {
            el.style.transition = "none"
            el.style.transform = "translateX(-100%)"
        } else {
            el.style.transition = `transform ${glare.duration}ms ease-in-out`
            el.style.transform = "translateX(-100%)"
        }
    }

    const surfaceBg = useMemo(() => {
        if (variant === "Transparent") {
            return "transparent"
        }
        if (backgroundColorChoice === "Custom") {
            return customBackgroundColor
        }
        return variant === "White" ? "#FFFFFF" : "#000000"
    }, [variant, backgroundColorChoice, customBackgroundColor])

    const labelColor = useMemo(() => {
        if (textColorChoice === "Custom") {
            return customTextColor
        }
        return variant === "White" ? "#000000" : "#FFFFFF"
    }, [variant, textColorChoice, customTextColor])

    const rimColor = ringColorForVariant(variant)
    const innerRadius = Math.max(0, sizingAndRadius.radius - RING_WIDTH)
    const finalOuterGlow = isTransparent ? 0 : glowSettings.outer
    const finalInnerGlow = isTransparent ? 0 : glowSettings.inner
    const normalizedFont = useMemo(() => normalizeFont(font), [font])
    const LucideIcon = showIcon ? LucideMap[normalizeIconName(iconName)] : null
    const doAnimateIcon =
        !!LucideIcon && !isTransparent && !prefersReducedMotion && !isCanvas

    const isFilled = glowSettings.style === "Filled"

    const baseGlowOpacity =
        OUTER_GLOW_OPACITY_BASE +
        OUTER_GLOW_OPACITY_MULTIPLIER * Math.min(1, Math.max(0, finalOuterGlow))
    const baseGlowBlur =
        OUTER_GLOW_BLUR_BASE +
        OUTER_GLOW_BLUR_MULTIPLIER * Math.min(1, Math.max(0, finalOuterGlow))

    const outerGlowVariants = {
        rest: {
            opacity: baseGlowOpacity,
            filter: `blur(${baseGlowBlur}px)`,
        },
        hover: {
            opacity: isFilled
                ? Math.min(1, baseGlowOpacity * 1.2)
                : baseGlowOpacity,
            filter: `blur(${isFilled ? baseGlowBlur * 0.85 : baseGlowBlur}px)`,
        },
    }

    const ringStyle = useMemo(
        (): React.CSSProperties => ({
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            padding: RING_WIDTH,
            borderRadius: sizingAndRadius.radius,
            background: isTransparent
                ? "transparent"
                : `${glowGradient(
                      finalRainbowColors,
                      ANGLE_VAR
                  )}, ${baseRingGradient(rimColor)}`,
            ["--rb-solid-bg" as any]: beamRainbowSolid(
                finalRainbowColors,
                ANGLE_VAR
            ),
            overflow: "hidden",
            boxSizing: "border-box",
            zIndex: 1,
        }),
        [
            isTransparent,
            rimColor,
            finalRainbowColors,
            glowGradient,
            sizingAndRadius.radius,
        ]
    )

    const surfaceStyle = useMemo(
        (): React.CSSProperties => ({
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            padding: `${sizingAndRadius.paddingY}px ${sizingAndRadius.paddingX}px`,
            borderRadius: innerRadius,
            background: surfaceBg,
            overflow: "hidden",
            zIndex: 1,
            backdropFilter: isTransparent ? "none" : "saturate(120%) blur(4px)",
            WebkitBackdropFilter: isTransparent
                ? "none"
                : "saturate(120%) blur(4px)",
        }),
        [
            innerRadius,
            surfaceBg,
            isTransparent,
            sizingAndRadius.paddingX,
            sizingAndRadius.paddingY,
        ]
    )

    const glareStyle = useMemo((): React.CSSProperties => {
        const rgba = toRgbaString(glare.color, glare.opacity)
        return {
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            background: `linear-gradient(${glare.angle}deg,
                transparent 20%,
                ${rgba} 50%,
                transparent 80%)`,
            transform: "translateX(-100%)",
            pointerEvents: "none",
            zIndex: 4,
        }
    }, [glare.color, glare.opacity, glare.angle])

    const iconElement = useMemo(() => {
        if (!LucideIcon) return null
        const finalIconColor = matchTextColor
            ? labelColor
            : (iconColor ?? labelColor)
        const iconSizeEm = `${iconScale ?? 1}em`
        const applyFade = !isTransparent
        const iconFadeMask: React.CSSProperties = {
            WebkitMaskImage: `linear-gradient(to bottom, rgba(0,0,0,1) 100%, rgba(0,0,0,0.9) 80%)`,
            maskImage: `linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0.7) 80%)`,
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
        }
        const iconWrapperStyle: React.CSSProperties = {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "1em",
            height: "1em",
            lineHeight: 1,
            flex: "0 0 auto",
            marginRight: "-1px",
            ...(applyFade ? iconFadeMask : {}),
        }
        const IconWrapper = doAnimateIcon ? motion.span : "span"
        const motionProps = doAnimateIcon
            ? { variants: ICON_VARIANTS, transition: ICON_TRANSITION }
            : {}

        return (
            <IconWrapper style={iconWrapperStyle} {...motionProps}>
                <LucideIcon
                    size={iconSizeEm}
                    color={finalIconColor}
                    strokeWidth={strokeWidthFor()}
                    style={{ display: "block" }}
                />
            </IconWrapper>
        )
    }, [
        LucideIcon,
        labelColor,
        iconColor,
        matchTextColor,
        iconScale,
        isTransparent,
        doAnimateIcon,
    ])

    // Calculate rotation duration based on speed (inverted: higher speed = faster rotation)
    const rotationDuration =
        ROTATION_SECONDS_BASE / Math.max(0.1, glowSettings.speed)

    const content = (
        <div className="rb-ring" style={ringStyle}>
            {isTransparent && (
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: sizingAndRadius.radius,
                        background: baseRingGradient(rimColor),
                        pointerEvents: "none",
                        zIndex: 0,
                        padding: RING_WIDTH,
                        boxSizing: "border-box",
                        WebkitMask:
                            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                        WebkitMaskComposite: "xor" as any,
                        mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                        maskComposite: "exclude" as any,
                    }}
                />
            )}
            <div style={{ ...surfaceStyle, ...style }}>
                {!isTransparent && (
                    <>
                        <div
                            aria-hidden
                            style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: innerRadius,
                                background: glowGradient(
                                    finalRainbowColors,
                                    ANGLE_VAR
                                ),
                                opacity:
                                    INNER_GLOW_OPACITY_BASE +
                                    INNER_GLOW_OPACITY_MULTIPLIER *
                                        Math.max(0, finalInnerGlow),
                                filter: `blur(${mapRange(
                                    finalInnerGlow,
                                    0,
                                    2,
                                    INNER_GLOW_BLUR_MAX,
                                    INNER_GLOW_BLUR_MIN
                                )}px)`,
                                pointerEvents: "none",
                                zIndex: 1,
                                transform: "translateZ(0)",
                            }}
                        />
                        <MovingStarField
                            count={particleSettings.count}
                            borderRadius={innerRadius}
                            speed={particleSettings.speed}
                            colors={finalRainbowColors}
                            minSize={particleSettings.minSize}
                            maxSize={particleSettings.maxSize}
                            minBlur={particleSettings.minBlur}
                            maxBlur={particleSettings.maxBlur}
                            glowStyle={glowSettings.style}
                        />
                    </>
                )}
                {glare.withGlare && <div ref={glareRef} style={glareStyle} />}
                <div
                    style={{
                        position: "relative",
                        zIndex: 3,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: iconGap,
                        whiteSpace: "nowrap",
                        ...normalizedFont,
                        color: labelColor,
                    }}
                >
                    <span
                        style={
                            !isTransparent
                                ? {
                                      transform: "translateZ(0)",
                                      paddingBottom: "0px",
                                      WebkitMaskImage: `linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0.5) 100%)`,
                                      maskImage: `linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0.5) 90%)`,
                                      WebkitMaskSize: "100% 100%",
                                      maskSize: "100% 100%",
                                      WebkitMaskRepeat: "no-repeat",
                                      maskRepeat: "no-repeat",
                                  }
                                : { transform: "translateZ(0)" }
                        }
                    >
                        {text}
                    </span>
                    {iconElement}
                </div>
            </div>
        </div>
    )

    const wrapperAnimStyle: React.CSSProperties = {
        [ANGLE_VAR as any]: "0deg",
        animation:
            isTransparent || isCanvas
                ? "none"
                : `rb-spin ${rotationDuration}s linear infinite`,
    }

    return (
        <motion.div
            className={`rb-stop-anim rb-wrap ${
                isTransparent ? "is-transparent" : ""
            }`}
            style={{
                position: "relative",
                display: "inline-block",
                width: "100%",
                height: "100%",
                borderRadius: sizingAndRadius.radius,
                cursor: "pointer",
                ...wrapperAnimStyle,
            }}
            initial="rest"
            animate="rest"
            whileHover="hover"
            onHoverStart={animateGlareIn}
            onHoverEnd={animateGlareOut}
        >
            {!isTransparent && (
                <motion.div
                    aria-hidden
                    variants={outerGlowVariants}
                    transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 25,
                    }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: sizingAndRadius.radius,
                        background: glowGradient(finalRainbowColors, ANGLE_VAR),
                        pointerEvents: "none",
                        zIndex: 0,
                        transform: "translateZ(0)",
                    }}
                />
            )}
            {href ? (
                <a
                    href={href}
                    target={openInNewTab ? "_blank" : undefined}
                    rel={openInNewTab ? "noopener noreferrer" : undefined}
                    style={{
                        display: "inline-block",
                        textDecoration: "none",
                        width: "100%",
                        height: "100%",
                    }}
                >
                    {content}
                </a>
            ) : (
                content
            )}
        </motion.div>
    )
}

/* ---------------------- Framer Property Controls ---------------------- */

GlowingBeamButton.defaultProps = {
    text: "Get Unlimited Access",
    font: {
        family: "Inter",
        size: 18,
        weight: 600,
        lineHeight: "1.2em",
        letterSpacing: "0em",
        textAlign: "center",
        color: "#FFFFFF",
    },
    href: "",
    openInNewTab: false,
    variant: "Black",
    backgroundColorChoice: "Default",
    customBackgroundColor: "#000000",
    textColorChoice: "Default",
    customTextColor: "#FFFFFF",
    showIcon: false,
    iconName: "ArrowRight",
    iconScale: 1,
    iconGap: 10,
    matchTextColor: true,
    iconColor: "#FFFFFF",
    particleSettings: {
        speed: 1,
        count: 50,
        minSize: 1.5,
        maxSize: 4,
        minBlur: 0.4,
        maxBlur: 2,
    },
    colorStyle: "Rainbow",
    customColors: ["#FF0055", "#00B3FF"],
    sizingAndRadius: {
        paddingX: 26,
        paddingY: 18,
        radius: 99,
    },
    glare: {
        withGlare: true,
        playOnce: false,
        color: "#FFFFFF",
        opacity: 0.1,
        angle: -45,
        duration: 650,
    },
    glowSettings: {
        style: "Default",
        outer: 0.7,
        inner: 0.4,
        speed: 1,
    },
}

addPropertyControls(GlowingBeamButton, {
    variant: {
        type: ControlType.Enum,
        title: "Variant",
        options: ["Black", "White", "Transparent"],
        defaultValue: "Black",
    },
    href: {
        type: ControlType.String,
        title: "Link (URL)",
        placeholder: "https://www.framer.com",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "Open in new tab",
        defaultValue: false,
    },
    text: { type: ControlType.String, title: "Text" },
    font: { type: ControlType.Font, title: "Font", controls: "extended" },
    textColorChoice: {
        type: ControlType.Enum,
        title: "Text Color",
        options: ["Default", "Custom"],
        defaultValue: "Default",
        displaySegmentedControl: true,
    },
    customTextColor: {
        type: ControlType.Color,
        title: " ",
        defaultValue: "#FFFFFF",
        hidden: (props) => props.textColorChoice !== "Custom",
    },
    backgroundColorChoice: {
        type: ControlType.Enum,
        title: "Background Color",
        options: ["Default", "Custom"],
        defaultValue: "Default",
        displaySegmentedControl: true,
        hidden: (props) => props.variant === "Transparent",
    },
    customBackgroundColor: {
        type: ControlType.Color,
        title: " ",
        defaultValue: "#000000",
        hidden: (props) =>
            props.variant === "Transparent" ||
            props.backgroundColorChoice !== "Custom",
    },
    sizingAndRadius: {
        type: ControlType.Object,
        title: "Sizing & Radius",
        controls: {
            paddingX: {
                type: ControlType.Number,
                title: "Padding X",
                defaultValue: 26,
                min: 0,
                max: 100,
                step: 1,
                unit: "px",
            },
            paddingY: {
                type: ControlType.Number,
                title: "Padding Y",
                defaultValue: 18,
                min: 0,
                max: 100,
                step: 1,
                unit: "px",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 99,
                min: 0,
                max: 100,
                step: 1,
                unit: "px",
            },
        },
    },
    glare: {
        type: ControlType.Object,
        title: "Glare Effect",
        controls: {
            withGlare: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
            },
            playOnce: {
                type: ControlType.Boolean,
                title: "Play Once",
                defaultValue: false,
                hidden: (props) => !props.glare.withGlare,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#FFFFFF",
                hidden: (props) => !props.glare.withGlare,
            },
            opacity: {
                type: ControlType.Number,
                title: "Opacity",
                defaultValue: 0.1,
                min: 0,
                max: 1,
                step: 0.05,
                hidden: (props) => !props.glare.withGlare,
            },
            angle: {
                type: ControlType.Number,
                title: "Angle",
                defaultValue: -45,
                min: -180,
                max: 180,
                step: 5,
                unit: "°",
                hidden: (props) => !props.glare.withGlare,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 650,
                min: 100,
                max: 2000,
                step: 50,
                unit: "ms",
                hidden: (props) => !props.glare.withGlare,
            },
        },
    },
    colorStyle: {
        type: ControlType.Enum,
        title: "Color Style",
        options: ["Rainbow", "Lava Flow", "Glacial Ice", "Custom"],
        defaultValue: "Rainbow",
    },
    customColors: {
        type: ControlType.Array,
        title: "Custom Colors",
        control: { type: ControlType.Color },
        hidden: (props) => props.colorStyle !== "Custom",
        defaultValue: GlowingBeamButton.defaultProps.customColors,
    },

    glowSettings: {
        type: ControlType.Object,
        title: "Glow",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["Default", "Filled"],
                defaultValue: "Default",
                displaySegmentedControl: true,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0.1,
                max: 3,
                step: 0.1,
                defaultValue: 1,
                displayStepper: true,
            },
            outer: {
                type: ControlType.Number,
                title: "Outer Glow",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0.7,
            },
            inner: {
                type: ControlType.Number,
                title: "Inner Glow",
                min: 0,
                max: 2,
                step: 0.05,
                defaultValue: 0.4,
            },
        },
        hidden: (props) => props.variant === "Transparent",
    },
    particleSettings: {
        type: ControlType.Object,
        title: "Particles",
        controls: {
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0.1,
                max: 3,
                step: 0.1,
                defaultValue: 1,
            },
            count: {
                type: ControlType.Number,
                title: "Count",
                min: 0,
                max: 200,
                step: 5,
                defaultValue: 50,
            },
            minSize: {
                type: ControlType.Number,
                title: "Min Size",
                min: 0.5,
                max: 5,
                step: 0.1,
                defaultValue: 1.5,
            },
            maxSize: {
                type: ControlType.Number,
                title: "Max Size",
                min: 0.5,
                max: 10,
                step: 0.1,
                defaultValue: 4,
            },
            minBlur: {
                type: ControlType.Number,
                title: "Min Blur",
                min: 0,
                max: 5,
                step: 0.1,
                defaultValue: 0.4,
            },
            maxBlur: {
                type: ControlType.Number,
                title: "Max Blur",
                min: 0,
                max: 10,
                step: 0.1,
                defaultValue: 2,
            },
        },
        hidden: (p) => p.variant === "Transparent",
    },
    showIcon: { type: ControlType.Boolean, title: "Icon", defaultValue: false },
    iconName: {
        type: ControlType.Enum,
        title: "Icon Name",
        options: [
            "ArrowRight",
            "ArrowUpRight",
            "Check",
            "Download",
            "Play",
            "Star",
            "Heart",
            "Plus",
            "Rocket",
            "Crown",
            "Globe",
            "Gift",
            "Info",
            "ExternalLink",
        ] as any,
        hidden: (p) => !p.showIcon,
    },
    iconScale: {
        type: ControlType.Number,
        title: "Scale",
        min: 0.7,
        max: 1.6,
        step: 0.05,
        hidden: (p) => !p.showIcon,
    },
    iconGap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 32,
        step: 1,
        hidden: (p) => !p.showIcon,
    },
    matchTextColor: {
        type: ControlType.Boolean,
        title: "Icon: Match text color",
        optionTitles: ["Match Text", "Custom"],
        defaultValue: true,
        hidden: (p) => !p.showIcon,
    },
    iconColor: {
        type: ControlType.Color,
        title: " ",
        hidden: (p) => !p.showIcon || p.matchTextColor,
    },
})
