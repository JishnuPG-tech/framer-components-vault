import * as React from "react"
import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import type { ControlDescription } from "framer"
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion"
import type { Easing, MotionValue } from "framer-motion"

type ImageValue = { src?: string; srcSet?: string; alt?: string } | undefined
type Effect = "fill" | "shimmer" | "pulse" | "ring"
type Direction = "up" | "down" | "left" | "right"
type Mode = "loop" | "once"
type EaseName = "easeInOut" | "easeOut" | "linear"
type ExitStyle = "fade" | "scale" | "lift"
type FontVariant = "Regular" | "Medium" | "Semibold" | "Bold"

// Built-in demo mark, used until a logo is uploaded
const DEMO_LOGO = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><path d="M66 8 22 68h34l-6 44 48-62H62l4-42Z" fill="#000"/></svg>')

const DEFAULT_RING = { color: "#0B0C0F", track: "rgba(11, 12, 15, 0.1)", width: 3, gap: 14 }
const DEFAULT_PERCENT = { show: false, color: "#0B0C0F", gap: 16 }
const DEFAULT_EXIT = { onLoad: false, minDuration: 1.2, style: "fade" as ExitStyle }

interface Props {
    logo?: ImageValue
    label?: string
    effect?: Effect
    direction?: Direction
    mode?: Mode
    duration?: number
    delay?: number
    ease?: EaseName
    logoSize?: number
    originalColors?: boolean
    fillColor?: string
    trackColor?: string
    background?: string
    ring?: Partial<typeof DEFAULT_RING>
    percent?: Partial<typeof DEFAULT_PERCENT>
    percentFont?: React.CSSProperties
    exit?: Partial<typeof DEFAULT_EXIT>
    onComplete?: () => void
    style?: React.CSSProperties
}

const maskFor = (src: string): React.CSSProperties => {
    const url = 'url("' + src.replace(/"/g, "%22") + '")'
    return {
        WebkitMaskImage: url,
        maskImage: url,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
    }
}

// Clip that reveals the logo from one edge, as progress goes 0 → 1
const revealClip = (direction: Direction, p: number): string => {
    const rest = Math.max(0, Math.min(100, (1 - p) * 100)).toFixed(2) + "%"
    if (direction === "down") return "inset(0 0 " + rest + " 0)"
    if (direction === "right") return "inset(0 " + rest + " 0 0)"
    if (direction === "left") return "inset(0 0 0 " + rest + ")"
    return "inset(" + rest + " 0 0 0)"
}

const fill: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%" }

function LogoLayer({ src, srcSet, original, color, style }: { src: string; srcSet?: string; original: boolean; color: string; style?: Record<string, MotionValue<string> | MotionValue<number> | string | number> }) {
    if (original) {
        return <motion.img src={src} srcSet={srcSet} alt="" draggable={false} style={{ ...fill, objectFit: "contain", ...style }} />
    }
    return <motion.div aria-hidden="true" style={{ ...fill, background: color, ...maskFor(src), ...style }} />
}

/**
 * Logo Loader — turns any logo into an animated loader
 *
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 200
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function LogoLoader(props: Props) {
    const {
        logo,
        label = "Loading",
        effect = "fill",
        direction = "up",
        mode = "loop",
        duration = 1.8,
        delay = 0.25,
        ease = "easeInOut",
        logoSize = 96,
        originalColors = false,
        fillColor = "#0B0C0F",
        trackColor = "rgba(11, 12, 15, 0.14)",
        background = "rgba(0, 0, 0, 0)",
        style,
    } = props
    const ring = { ...DEFAULT_RING, ...props.ring }
    const percent = { ...DEFAULT_PERCENT, ...props.percent }
    const exit = { ...DEFAULT_EXIT, ...props.exit }

    const src = logo && logo.src ? logo.src : DEMO_LOGO
    const srcSet = logo && logo.src ? logo.srcSet : undefined
    const isStatic = useIsStaticRenderer()
    const reduceMotion = useReducedMotion() === true
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    // Static renderers and reduced-motion users get a still, representative frame
    const frozen = isStatic || reduceMotion

    const progress = useMotionValue(frozen ? (reduceMotion ? 1 : 0.62) : 0)
    const onCompleteRef = useRef(props.onComplete)
    onCompleteRef.current = props.onComplete
    const [pct, setPct] = useState(Math.round(progress.get() * 100))
    const [exiting, setExiting] = useState(false)
    const [gone, setGone] = useState(false)

    useEffect(() => {
        if (frozen) {
            progress.set(reduceMotion ? 1 : 0.62)
            return
        }
        progress.set(0)
        const easing: Easing = ease
        const controls =
            mode === "loop"
                ? animate(progress, 1, { duration: Math.max(0.1, duration), ease: easing, repeat: Infinity, repeatType: "loop", repeatDelay: Math.max(0, delay) })
                : animate(progress, 1, { duration: Math.max(0.1, duration), ease: easing, onComplete: () => { if (onCompleteRef.current) onCompleteRef.current() } })
        return () => controls.stop()
    }, [frozen, reduceMotion, mode, duration, delay, ease, effect])

    // The visible percent is driven by the motion value directly; React state only feeds aria-valuenow
    const percentText = useTransform(progress, (v) => Math.round(v * 100) + "%")
    useEffect(() => {
        if (mode !== "once") return
        setPct(Math.round(progress.get() * 100))
        return progress.on("change", (v) => setPct(Math.round(v * 100)))
    }, [mode])

    // Optional page loader: hide once the page has loaded and the minimum time has passed
    useEffect(() => {
        if (!exit.onLoad || isCanvas || isStatic) return
        let timer: number | undefined
        const start = performance.now()
        const finish = () => {
            const wait = Math.max(0, exit.minDuration * 1000 - (performance.now() - start))
            timer = window.setTimeout(() => {
                setExiting(true)
                if (mode === "loop" && onCompleteRef.current) onCompleteRef.current()
            }, wait)
        }
        if (document.readyState === "complete") finish()
        else window.addEventListener("load", finish, { once: true })
        return () => {
            window.removeEventListener("load", finish)
            if (timer !== undefined) window.clearTimeout(timer)
        }
    }, [exit.onLoad, exit.minDuration, isCanvas, isStatic, mode])

    const clip = useTransform(progress, (p) => revealClip(direction, p))
    const shine = useTransform(progress, (p) => (150 - p * 200).toFixed(2) + "% 0%")
    const pulseScale = useTransform(progress, [0, 0.5, 1], [1, 0.9, 1])
    const pulseOpacity = useTransform(progress, [0, 0.5, 1], [1, 0.45, 1])
    const spin = useTransform(progress, (p) => (mode === "loop" ? p * 360 : -90))

    const ringSize = logoSize + 2 * (ring.gap + ring.width)
    const radius = (ringSize - ring.width) / 2
    const circumference = 2 * Math.PI * radius
    const dash = useTransform(progress, (p) => (mode === "loop" ? circumference * 0.28 + " " + circumference : circumference * p + " " + circumference))

    const exitTarget = exit.style === "scale" ? { opacity: 0, scale: 1.08 } : exit.style === "lift" ? { opacity: 0, y: -24 } : { opacity: 0 }
    const showTrack = effect === "fill" || effect === "shimmer"

    const logoBox = (
        <motion.div style={{ position: "relative", width: logoSize, height: logoSize, flexShrink: 0, scale: effect === "pulse" ? pulseScale : 1, opacity: effect === "pulse" ? pulseOpacity : 1 }}>
            {showTrack ? (
                originalColors ? (
                    <LogoLayer src={src} srcSet={srcSet} original color={trackColor} style={{ opacity: 0.22, filter: "grayscale(1)" }} />
                ) : (
                    <LogoLayer src={src} srcSet={srcSet} original={false} color={trackColor} />
                )
            ) : null}
            {effect === "fill" ? <LogoLayer src={src} srcSet={srcSet} original={originalColors} color={fillColor} style={{ clipPath: clip, WebkitClipPath: clip }} /> : null}
            {effect === "shimmer" ? (
                <>
                    {originalColors ? <LogoLayer src={src} srcSet={srcSet} original color={fillColor} /> : null}
                    <motion.div aria-hidden="true" style={{ ...fill, ...maskFor(src), backgroundImage: "linear-gradient(105deg, transparent 38%, " + (originalColors ? "rgba(255, 255, 255, 0.75)" : fillColor) + " 50%, transparent 62%)", backgroundSize: "250% 100%", backgroundRepeat: "no-repeat", backgroundPosition: shine }} />
                </>
            ) : null}
            {effect === "pulse" || effect === "ring" ? <LogoLayer src={src} srcSet={srcSet} original={originalColors} color={fillColor} /> : null}
            {effect === "ring" ? (
                <svg width={ringSize} height={ringSize} viewBox={"0 0 " + ringSize + " " + ringSize} aria-hidden="true" focusable="false" style={{ position: "absolute", left: (logoSize - ringSize) / 2, top: (logoSize - ringSize) / 2, overflow: "visible" }}>
                    <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke={ring.track} strokeWidth={ring.width} />
                    <motion.circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke={ring.color} strokeWidth={ring.width} strokeLinecap="round" style={{ strokeDasharray: dash, rotate: spin, originX: "50%", originY: "50%" }} />
                </svg>
            ) : null}
        </motion.div>
    )

    const determinate = mode === "once"
    return (
        <motion.div
            role={determinate ? "progressbar" : "status"}
            aria-label={label}
            aria-live={determinate ? undefined : "polite"}
            aria-busy={!exiting}
            aria-valuemin={determinate ? 0 : undefined}
            aria-valuemax={determinate ? 100 : undefined}
            aria-valuenow={determinate ? pct : undefined}
            initial={false}
            animate={exiting ? exitTarget : { opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: isStatic ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => { if (exiting) setGone(true) }}
            style={{
                ...style,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: percent.show ? percent.gap : 0,
                background,
                overflow: "visible",
                visibility: gone ? "hidden" : "visible",
                pointerEvents: gone ? "none" : undefined,
            }}>
            {logoBox}
            {percent.show ? (
                <motion.span aria-hidden="true" style={{ fontSize: 13, fontWeight: 500, letterSpacing: "0.02em", lineHeight: "1em", fontVariantNumeric: "tabular-nums", ...props.percentFont, color: percent.color }}>{percentText}</motion.span>
            ) : null}
        </motion.div>
    )
}

LogoLoader.displayName = "Logo Loader"

// Typed wrapper for the values Framer passes to a control's hidden callback
const hiddenFor =
    <T,>(test: (values: Partial<T>) => boolean) =>
    (values: unknown): boolean =>
        test((values ?? {}) as Partial<T>)

const fontControl = (title: string, fontSize: number, variant: FontVariant): ControlDescription<Partial<Props>> => ({
    type: ControlType.Font, title, controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize, variant, letterSpacing: "0.02em", lineHeight: "1em" },
    hidden: hiddenFor<Props>((p) => !(p.percent && p.percent.show)),
})

addPropertyControls(LogoLoader, {
    logo: { type: ControlType.ResponsiveImage, title: "Logo", description: "Transparent PNG or SVG works best." },
    label: { type: ControlType.String, title: "Label", defaultValue: "Loading" },
    effect: { type: ControlType.Enum, title: "Effect", options: ["fill", "shimmer", "pulse", "ring"], optionTitles: ["Fill", "Shimmer", "Pulse", "Ring"], defaultValue: "fill" },
    direction: { type: ControlType.Enum, title: "Direction", options: ["up", "down", "left", "right"], optionTitles: ["Up", "Down", "Left", "Right"], defaultValue: "up", displaySegmentedControl: true, hidden: hiddenFor<Props>((p) => p.effect !== "fill") },
    mode: { type: ControlType.Enum, title: "Mode", options: ["loop", "once"], optionTitles: ["Loop", "Once"], defaultValue: "loop", displaySegmentedControl: true },
    duration: { type: ControlType.Number, title: "Duration", defaultValue: 1.8, min: 0.2, max: 10, step: 0.1, unit: "s" },
    delay: { type: ControlType.Number, title: "Pause", defaultValue: 0.25, min: 0, max: 5, step: 0.05, unit: "s", hidden: hiddenFor<Props>((p) => p.mode === "once") },
    ease: { type: ControlType.Enum, title: "Easing", options: ["easeInOut", "easeOut", "linear"], optionTitles: ["Ease In Out", "Ease Out", "Linear"], defaultValue: "easeInOut" },
    logoSize: { type: ControlType.Number, title: "Logo Size", defaultValue: 96, min: 16, max: 800, step: 1, unit: "px" },
    originalColors: { type: ControlType.Boolean, title: "Logo Colors", defaultValue: false, enabledTitle: "Original", disabledTitle: "Tint" },
    fillColor: { type: ControlType.Color, title: "Fill", defaultValue: "#0B0C0F", hidden: hiddenFor<Props>((p) => !!p.originalColors && p.effect !== "shimmer") },
    trackColor: { type: ControlType.Color, title: "Track", defaultValue: "rgba(11, 12, 15, 0.14)", hidden: hiddenFor<Props>((p) => !!p.originalColors || (p.effect !== "fill" && p.effect !== "shimmer")) },
    background: { type: ControlType.Color, title: "Background", defaultValue: "rgba(0, 0, 0, 0)" },
    ring: {
        type: ControlType.Object, title: "Ring", hidden: hiddenFor<Props>((p) => p.effect !== "ring"),
        controls: {
            color: { type: ControlType.Color, title: "Color", defaultValue: DEFAULT_RING.color },
            track: { type: ControlType.Color, title: "Track", defaultValue: DEFAULT_RING.track },
            width: { type: ControlType.Number, title: "Width", defaultValue: DEFAULT_RING.width, min: 1, max: 24, step: 0.5, unit: "px" },
            gap: { type: ControlType.Number, title: "Gap", defaultValue: DEFAULT_RING.gap, min: 0, max: 120, step: 1, unit: "px" },
        },
    },
    percent: {
        type: ControlType.Object, title: "Percent",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: DEFAULT_PERCENT.show },
            color: { type: ControlType.Color, title: "Color", defaultValue: DEFAULT_PERCENT.color },
            gap: { type: ControlType.Number, title: "Gap", defaultValue: DEFAULT_PERCENT.gap, min: 0, max: 80, step: 1, unit: "px" },
        },
    },
    percentFont: fontControl("Percent Font", 13, "Medium"),
    exit: {
        type: ControlType.Object, title: "Page Loader",
        controls: {
            onLoad: { type: ControlType.Boolean, title: "Hide On Load", defaultValue: DEFAULT_EXIT.onLoad },
            minDuration: { type: ControlType.Number, title: "Min Time", defaultValue: DEFAULT_EXIT.minDuration, min: 0, max: 10, step: 0.1, unit: "s" },
            style: { type: ControlType.Enum, title: "Exit", options: ["fade", "scale", "lift"], optionTitles: ["Fade", "Scale", "Lift"], defaultValue: DEFAULT_EXIT.style, displaySegmentedControl: true },
        },
    },
    onComplete: { type: ControlType.EventHandler },
})
