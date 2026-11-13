// SpotlightTour.tsx
// A guided, zoom-based product walkthrough component for Framer.
//
// Drop in a product screenshot, place numbered pins on it, and the component
// pans and zooms to each pin as the visitor steps through the tour.
//
// Technology: React + Framer Motion only. No canvas, no WebGL, no external
// dependencies. All motion is transform/opacity based (compositor friendly).
//
// @framerSupportedLayoutWidth any
// @framerSupportedLayoutHeight auto
// @framerIntrinsicWidth 1000
// @framerIntrinsicHeight 640

import * as React from "react"
import { useState, useRef, useEffect, useCallback, useMemo, useId } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useReducedMotion } from "framer-motion"

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type FramerImage = { src?: string; srcSet?: string; alt?: string } | undefined

interface Step {
    label?: string
    title?: string
    body?: string
    x?: number
    y?: number
    zoom?: number
    useCustomImage?: boolean
    image?: FramerImage
    showCta?: boolean
    ctaLabel?: string
    ctaLink?: string
}

interface Props {
    image?: FramerImage
    imageAlt?: string
    steps?: Step[]
    heading?: string
    showHeading?: boolean

    layout?: "below" | "side" | "overlay"
    sidePosition?: "left" | "right"
    sideWidth?: number
    aspect?: "16:9" | "16:10" | "3:2" | "4:3" | "1:1" | "9:16" | "custom"
    customAspect?: number
    objectFit?: "cover" | "contain"
    gap?: number
    padding?: number
    maxWidth?: number
    constrainWidth?: boolean
    stackBelow?: number

    background?: string
    surface?: string
    borderColor?: string
    showBorder?: boolean
    radius?: number
    innerRadius?: number
    shadow?: boolean
    titleColor?: string
    bodyColor?: string
    accent?: string
    onAccent?: string
    dim?: number
    titleSize?: number
    bodySize?: number
    labelSize?: number
    font?: React.CSSProperties

    showPins?: boolean
    pinStyle?: "numbered" | "dot" | "ring"
    pinSize?: number
    pinPulse?: boolean
    inactivePinOpacity?: number

    showTabs?: boolean
    tabStyle?: "chips" | "list" | "dots"
    showArrows?: boolean
    showCounter?: boolean
    showProgress?: boolean

    animate?: boolean
    transitionType?: "spring" | "tween"
    stiffness?: number
    damping?: number
    mass?: number
    duration?: number
    ease?: "easeOut" | "easeInOut" | "circOut" | "linear"
    crossfade?: number
    respectReducedMotion?: boolean

    autoplay?: boolean
    interval?: number
    loop?: boolean
    pauseOnHover?: boolean

    style?: React.CSSProperties
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const clamp = (v: number, min: number, max: number) =>
    min > max ? min : v < min ? min : v > max ? max : v

const num = (v: unknown, fallback: number) =>
    typeof v === "number" && isFinite(v) ? v : fallback

/**
 * Apply an alpha to a colour of unknown format.
 *
 * Framer's Color control does not hand back the hex string you set as a
 * default. Depending on how the value was authored it can arrive as
 * "rgb(20, 24, 31)", "rgba(...)", "hsl(...)", or a shared-token reference like
 * "var(--token-abc, rgb(20, 24, 31))". Concatenating hex alpha onto any of
 * those produces invalid CSS, the declaration is dropped, and a <button> then
 * falls back to the user-agent "buttonface" background, which renders white.
 *
 * So: parse what we can parse, and fall back to color-mix() for anything else
 * (tokens, oklch, named colours), which keeps token linkage intact.
 */
function alphaColor(color: string | undefined, alpha: number): string {
    const a = clamp(alpha, 0, 1)
    const c = typeof color === "string" ? color.trim() : ""
    if (!c) return `rgba(0, 0, 0, ${a})`

    // #RGB | #RGBA | #RRGGBB | #RRGGBBAA
    if (c.charAt(0) === "#") {
        let hex = c.slice(1)
        if (hex.length === 3 || hex.length === 4) {
            hex = hex
                .split("")
                .map((ch) => ch + ch)
                .join("")
        }
        if (hex.length === 6 || hex.length === 8) {
            const r = parseInt(hex.slice(0, 2), 16)
            const g = parseInt(hex.slice(2, 4), 16)
            const b = parseInt(hex.slice(4, 6), 16)
            const base =
                hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
            if (!isNaN(r) && !isNaN(g) && !isNaN(b) && !isNaN(base)) {
                const out = Math.round(base * a * 1000) / 1000
                return `rgba(${r}, ${g}, ${b}, ${out})`
            }
        }
    }

    // rgb() | rgba() | hsl() | hsla(), comma or space separated
    const fn = c.match(/^(rgba?|hsla?)\(([^)]+)\)$/i)
    if (fn) {
        const isHsl = fn[1].toLowerCase().indexOf("hsl") === 0
        const comps = fn[2]
            .replace(/\//g, ",")
            .split(",")
            .reduce<string[]>(
                (acc, part) => acc.concat(part.trim().split(/\s+/)),
                []
            )
            .filter(Boolean)
        if (comps.length >= 3) {
            const parsed = comps.length >= 4 ? parseFloat(comps[3]) : 1
            const base = isNaN(parsed) ? 1 : parsed
            const out = Math.round(base * a * 1000) / 1000
            const head = comps.slice(0, 3).join(", ")
            return isHsl ? `hsla(${head}, ${out})` : `rgba(${head}, ${out})`
        }
    }

    // var(--token, ...), oklch(), color(), named colours, anything else
    return `color-mix(in srgb, ${c} ${Math.round(a * 10000) / 100}%, transparent)`
}

/** Reset that stops a <button> ever showing the UA "buttonface" background. */
const BUTTON_RESET: React.CSSProperties = {
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    backgroundImage: "none",
    font: "inherit",
    color: "inherit",
}

const ASPECTS: Record<string, number> = {
    "16:9": 16 / 9,
    "16:10": 16 / 10,
    "3:2": 3 / 2,
    "4:3": 4 / 3,
    "1:1": 1,
    "9:16": 9 / 16,
}

/**
 * Camera transform for a step.
 *
 * The media layer uses transform-origin 0 0, so the applied transform is
 * translate(tx%, ty%) scale(z). A point at (x%, y%) of the unscaled layer
 * therefore lands at (tx + x * z)%. Setting that equal to 50% centres the
 * focus point. The result is clamped so the layer never reveals empty space.
 */
function cameraFor(step: Step | undefined) {
    const z = clamp(num(step?.zoom, 1), 1, 8)
    const x = clamp(num(step?.x, 50), 0, 100)
    const y = clamp(num(step?.y, 50), 0, 100)
    const tx = clamp(50 - x * z, 100 - 100 * z, 0)
    const ty = clamp(50 - y * z, 100 - 100 * z, 0)
    return { tx, ty, z }
}

/* ------------------------------------------------------------------ */
/* Pin                                                                 */
/* ------------------------------------------------------------------ */

function Pin(props: {
    step: Step
    index: number
    active: boolean
    zoom: number
    transition: any
    pinStyle: NonNullable<Props["pinStyle"]>
    size: number
    pulse: boolean
    accent: string
    onAccent: string
    inactiveOpacity: number
    onSelect: (i: number) => void
    controlsId: string
    noMotion: boolean
}) {
    const {
        step,
        index,
        active,
        zoom,
        transition,
        pinStyle,
        size,
        pulse,
        accent,
        onAccent,
        inactiveOpacity,
        onSelect,
        controlsId,
        noMotion,
    } = props

    const x = clamp(num(step.x, 50), 0, 100)
    const y = clamp(num(step.y, 50), 0, 100)
    const label = step.label || step.title || `Step ${index + 1}`
    const isDot = pinStyle === "dot"
    const isRing = pinStyle === "ring"
    const boxSize = isDot ? Math.max(8, size * 0.45) : size

    return (
        <div
            style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                width: 0,
                height: 0,
                zIndex: active ? 3 : 2,
            }}
        >
            <motion.button
                type="button"
                className="spt-pin"
                onClick={() => onSelect(index)}
                aria-label={`Show step ${index + 1}: ${label}`}
                aria-current={active ? "true" : undefined}
                aria-controls={controlsId}
                initial={false}
                animate={{ scale: 1 / Math.max(1, zoom) }}
                transition={transition}
                style={{
                    ...BUTTON_RESET,
                    position: "absolute",
                    left: 0,
                    top: 0,
                    x: "-50%",
                    y: "-50%",
                    width: boxSize,
                    height: boxSize,
                    borderRadius: 999,
                    border: isRing
                        ? `2px solid ${active ? accent : "rgba(255,255,255,0.75)"}`
                        : "none",
                    background: isRing
                        ? "rgba(255,255,255,0.10)"
                        : active
                          ? accent
                          : "rgba(255,255,255,0.92)",
                    color: active ? onAccent : "#111318",
                    boxShadow: active
                        ? `0 0 0 4px ${alphaColor(accent, 0.2)}, 0 6px 18px rgba(0,0,0,0.28)`
                        : "0 2px 8px rgba(0,0,0,0.22)",
                    opacity: active ? 1 : clamp(inactiveOpacity, 0, 1),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    margin: 0,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: Math.max(9, size * 0.4),
                    fontWeight: 600,
                    lineHeight: 1,
                }}
            >
                {pinStyle === "numbered" ? index + 1 : null}
                {/* Continuous animation. Never rendered in a static renderer
                    (Framer canvas or export) or under reduced motion. */}
                {pulse && active && !noMotion ? (
                    <motion.span
                        aria-hidden
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: 999,
                            border: `2px solid ${accent}`,
                            pointerEvents: "none",
                        }}
                        animate={{ scale: [1, 1.9], opacity: [0.55, 0] }}
                        transition={{
                            duration: 1.9,
                            repeat: Infinity,
                            ease: "easeOut",
                        }}
                    />
                ) : null}
            </motion.button>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function SpotlightTour(props: Props) {
    const {
        image,
        imageAlt = "Product screenshot",
        steps = [],
        heading = "How it works",
        showHeading = false,

        layout = "below",
        sidePosition = "right",
        sideWidth = 340,
        aspect = "16:10",
        customAspect = 1.6,
        objectFit = "cover",
        gap = 20,
        padding = 0,
        maxWidth = 1120,
        constrainWidth = false,
        stackBelow = 720,

        background = "#0B0D12",
        surface = "#14181F",
        borderColor = "rgba(255,255,255,0.10)",
        showBorder = true,
        radius = 20,
        innerRadius = 14,
        shadow = true,
        titleColor = "#FFFFFF",
        bodyColor = "rgba(255,255,255,0.66)",
        accent = "#5B8CFF",
        onAccent = "#FFFFFF",
        dim = 0.28,
        titleSize = 20,
        bodySize = 15,
        labelSize = 12,
        font,

        showPins = true,
        pinStyle = "numbered",
        pinSize = 30,
        pinPulse = true,
        inactivePinOpacity = 0.55,

        showTabs = true,
        tabStyle = "chips",
        showArrows = true,
        showCounter = true,
        showProgress = true,

        animate = true,
        transitionType = "spring",
        stiffness = 150,
        damping = 24,
        mass = 1,
        duration = 0.7,
        ease = "easeOut",
        crossfade = 0.35,
        respectReducedMotion = true,

        autoplay = false,
        interval = 4,
        loop = true,
        pauseOnHover = true,

        style,
    } = props

    // True on the Framer canvas and during export/thumbnail rendering.
    // Everything that animates must be switched off when this is true:
    // it keeps the editor responsive and stops half-finished frames and
    // tiling artifacts from being baked into exported assets.
    const isStatic = useIsStaticRenderer()

    const prefersReduced = useReducedMotion()
    const reduced = !!prefersReduced && respectReducedMotion

    // Single gate for every animation in the component.
    const noMotion = isStatic || reduced
    const useAnim = animate && !noMotion

    const rawId = useId()
    const uid = rawId.replace(/[^a-zA-Z0-9]/g, "")
    const panelId = `spt-panel-${uid}`
    const tabId = (i: number) => `spt-tab-${uid}-${i}`

    const safeSteps = useMemo(
        () => (Array.isArray(steps) ? steps.filter(Boolean) : []),
        [steps]
    )
    const count = safeSteps.length

    const [active, setActive] = useState(0)
    const activeIndex = count ? clamp(active, 0, count - 1) : 0
    const step = count ? safeSteps[activeIndex] : undefined

    // If the author deletes steps, keep internal state in range.
    useEffect(() => {
        if (count && active > count - 1) setActive(count - 1)
    }, [count, active])

    /* ---------------- camera + transition ---------------- */

    const { tx, ty, z } = useMemo(() => cameraFor(step), [step])

    const transition = useMemo(() => {
        if (!useAnim) return { duration: 0 }
        if (transitionType === "tween") {
            return {
                type: "tween" as const,
                duration: clamp(duration, 0.05, 5),
                ease,
            }
        }
        return {
            type: "spring" as const,
            stiffness: clamp(stiffness, 10, 800),
            damping: clamp(damping, 2, 120),
            mass: clamp(mass, 0.1, 8),
        }
    }, [useAnim, transitionType, duration, ease, stiffness, damping, mass])

    /* ---------------- responsive (container based) ---------------- */

    const rootRef = useRef<HTMLDivElement | null>(null)
    const [width, setWidth] = useState(0)

    useEffect(() => {
        const el = rootRef.current
        if (!el) return
        if (typeof ResizeObserver === "undefined") {
            setWidth(el.getBoundingClientRect().width)
            return
        }
        const ro = new ResizeObserver((entries) => {
            for (const e of entries) {
                const w = e.contentRect?.width
                if (typeof w === "number") setWidth(w)
            }
        })
        ro.observe(el)
        setWidth(el.getBoundingClientRect().width)
        return () => ro.disconnect()
    }, [])

    const isNarrow = width > 0 && width < clamp(stackBelow, 320, 1400)
    const effectiveLayout: "below" | "side" | "overlay" = isNarrow
        ? "below"
        : layout

    /* ---------------- autoplay ---------------- */

    const [inView, setInView] = useState(false)
    const [hovered, setHovered] = useState(false)
    const [interacted, setInteracted] = useState(false)

    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }
        const io = new IntersectionObserver(
            (entries) => setInView(entries.some((e) => e.isIntersecting)),
            { threshold: 0.15 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

    const autoplayActive =
        autoplay &&
        !noMotion &&
        !interacted &&
        !(pauseOnHover && hovered) &&
        inView &&
        count > 1

    useEffect(() => {
        if (!autoplayActive) return
        const ms = Math.max(800, num(interval, 4) * 1000)
        const id = window.setTimeout(() => {
            setActive((a) => {
                const next = a + 1
                if (next >= count) return loop ? 0 : a
                return next
            })
        }, ms)
        return () => window.clearTimeout(id)
    }, [autoplayActive, activeIndex, interval, count, loop])

    /* ---------------- navigation ---------------- */

    const select = useCallback(
        (i: number) => {
            if (!count) return
            setInteracted(true)
            setActive(clamp(i, 0, count - 1))
        },
        [count]
    )

    const go = useCallback(
        (dir: 1 | -1) => {
            if (!count) return
            setInteracted(true)
            setActive((a) => {
                const next = a + dir
                if (next < 0) return loop ? count - 1 : 0
                if (next >= count) return loop ? 0 : count - 1
                return next
            })
        },
        [count, loop]
    )

    const onTabsKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault()
                go(1)
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault()
                go(-1)
            } else if (e.key === "Home") {
                e.preventDefault()
                select(0)
            } else if (e.key === "End") {
                e.preventDefault()
                select(count - 1)
            }
        },
        [go, select, count]
    )

    /* ---------------- media ---------------- */

    const [baseFailed, setBaseFailed] = useState(false)
    const hasBase = !!image?.src && !baseFailed

    const stepImages = useMemo(
        () =>
            safeSteps.map((s) =>
                s.useCustomImage && s.image?.src ? s.image : undefined
            ),
        [safeSteps]
    )
    const anyStepImage = stepImages.some(Boolean)

    /* ---------------- derived styles ---------------- */

    const ratio =
        aspect === "custom"
            ? clamp(num(customAspect, 1.6), 0.2, 6)
            : (ASPECTS[aspect] ?? 16 / 10)

    const fontStack: React.CSSProperties = {
        fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        ...(font || {}),
    }

    const rootStyle: React.CSSProperties = {
        ...style,
        height: "auto",
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
        background: "transparent",
        ...fontStack,
    }

    const shellStyle: React.CSSProperties = {
        boxSizing: "border-box",
        width: "100%",
        maxWidth: constrainWidth ? Math.max(240, maxWidth) : undefined,
        padding,
        background,
        borderRadius: radius,
        border: showBorder ? `1px solid ${borderColor}` : "none",
        boxShadow: shadow ? "0 24px 64px rgba(0,0,0,0.28)" : "none",
        display: "flex",
        flexDirection:
            effectiveLayout === "side"
                ? sidePosition === "left"
                    ? "row-reverse"
                    : "row"
                : "column",
        gap,
        alignItems: effectiveLayout === "side" ? "stretch" : undefined,
        overflow: "hidden",
    }

    const viewportStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        aspectRatio: `${ratio}`,
        borderRadius: innerRadius,
        overflow: "hidden",
        background: surface,
        flex: "1 1 auto",
        minWidth: 0,
        isolation: "isolate",
    }

    const captionPanelStyle: React.CSSProperties = {
        boxSizing: "border-box",
        flex:
            effectiveLayout === "side"
                ? `0 0 ${clamp(sideWidth, 200, 720)}px`
                : undefined,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        justifyContent: effectiveLayout === "side" ? "center" : undefined,
    }

    const progress = count > 1 ? (activeIndex + 1) / count : 1

    /* ---------------- sub renders ---------------- */

    const renderTabs = () => {
        if (!showTabs || count < 2) return null

        if (tabStyle === "dots") {
            return (
                <div
                    role="tablist"
                    aria-label="Tour steps"
                    onKeyDown={onTabsKeyDown}
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                >
                    {safeSteps.map((s, i) => {
                        const on = i === activeIndex
                        return (
                            <button
                                key={i}
                                id={tabId(i)}
                                type="button"
                                role="tab"
                                className="spt-btn"
                                aria-selected={on}
                                aria-controls={panelId}
                                tabIndex={on ? 0 : -1}
                                onClick={() => select(i)}
                                style={{
                                    ...BUTTON_RESET,
                                    position: "relative",
                                    width: on ? 26 : 10,
                                    height: 10,
                                    padding: 0,
                                    margin: 0,
                                    borderRadius: 999,
                                    border: "none",
                                    cursor: "pointer",
                                    background: on
                                        ? accent
                                        : "rgba(255,255,255,0.24)",
                                    transition: noMotion
                                        ? "none"
                                        : "width .28s ease, background .28s ease",
                                }}
                            >
                                <span className="spt-sr">
                                    {s.label || s.title || `Step ${i + 1}`}
                                </span>
                            </button>
                        )
                    })}
                </div>
            )
        }

        const listMode = tabStyle === "list"
        return (
            <div
                role="tablist"
                aria-label="Tour steps"
                aria-orientation={listMode ? "vertical" : "horizontal"}
                onKeyDown={onTabsKeyDown}
                style={{
                    display: "flex",
                    flexDirection: listMode ? "column" : "row",
                    flexWrap: listMode ? "nowrap" : "wrap",
                    gap: listMode ? 4 : 8,
                    minWidth: 0,
                }}
            >
                {safeSteps.map((s, i) => {
                    const on = i === activeIndex
                    return (
                        <button
                            key={i}
                            id={tabId(i)}
                            type="button"
                            role="tab"
                            className="spt-btn"
                            aria-selected={on}
                            aria-controls={panelId}
                            tabIndex={on ? 0 : -1}
                            onClick={() => select(i)}
                            style={{
                                ...BUTTON_RESET,
                                boxSizing: "border-box",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                textAlign: "left",
                                padding: listMode ? "10px 12px" : "8px 12px",
                                borderRadius: listMode ? 10 : 999,
                                border: `1px solid ${on ? accent : borderColor}`,
                                background: on
                                    ? alphaColor(accent, 0.12)
                                    : "transparent",
                                color: on ? titleColor : bodyColor,
                                fontFamily: "inherit",
                                fontSize: labelSize,
                                fontWeight: on ? 600 : 500,
                                lineHeight: 1.3,
                                cursor: "pointer",
                                minHeight: 40,
                                maxWidth: "100%",
                                transition: noMotion
                                    ? "none"
                                    : "background .2s ease, border-color .2s ease, color .2s ease",
                            }}
                        >
                            <span
                                aria-hidden
                                style={{
                                    flex: "0 0 auto",
                                    width: 18,
                                    height: 18,
                                    borderRadius: 999,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    background: on
                                        ? accent
                                        : "rgba(255,255,255,0.10)",
                                    color: on ? onAccent : bodyColor,
                                }}
                            >
                                {i + 1}
                            </span>
                            <span
                                style={{
                                    minWidth: 0,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: listMode ? "normal" : "nowrap",
                                }}
                            >
                                {s.label || s.title || `Step ${i + 1}`}
                            </span>
                        </button>
                    )
                })}
            </div>
        )
    }

    const captionCard = (
        <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={count > 1 ? tabId(activeIndex) : undefined}
            aria-live="polite"
            style={{
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                minWidth: 0,
                ...(effectiveLayout === "overlay"
                    ? {
                          background: alphaColor(surface, 0.9),
                          backdropFilter: "blur(10px)",
                          WebkitBackdropFilter: "blur(10px)",
                          border: `1px solid ${borderColor}`,
                          borderRadius: Math.max(8, innerRadius - 2),
                          padding: 16,
                      }
                    : {}),
            }}
        >
            {step?.title ? (
                <div
                    style={{
                        color: titleColor,
                        fontSize: titleSize,
                        fontWeight: 600,
                        lineHeight: 1.25,
                        letterSpacing: "-0.01em",
                        overflowWrap: "anywhere",
                    }}
                >
                    {step.title}
                </div>
            ) : null}
            {step?.body ? (
                <div
                    style={{
                        color: bodyColor,
                        fontSize: bodySize,
                        lineHeight: 1.55,
                        overflowWrap: "anywhere",
                    }}
                >
                    {step.body}
                </div>
            ) : null}
            {step?.showCta && step?.ctaLabel ? (
                <a
                    className="spt-btn"
                    href={step.ctaLink || "#"}
                    style={{
                        alignSelf: "flex-start",
                        marginTop: 4,
                        display: "inline-flex",
                        alignItems: "center",
                        minHeight: 44,
                        padding: "10px 18px",
                        borderRadius: 999,
                        background: accent,
                        color: onAccent,
                        fontFamily: "inherit",
                        fontSize: labelSize + 1,
                        fontWeight: 600,
                        textDecoration: "none",
                    }}
                >
                    {step.ctaLabel}
                </a>
            ) : null}
        </div>
    )

    const arrowBtn = (dir: 1 | -1) => (
        <button
            type="button"
            className="spt-btn"
            onClick={() => go(dir)}
            aria-label={dir === 1 ? "Next step" : "Previous step"}
            style={{
                ...BUTTON_RESET,
                width: 44,
                height: 44,
                borderRadius: 999,
                border: `1px solid ${borderColor}`,
                background: alphaColor(surface, 0.85),
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                color: titleColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
                margin: 0,
                pointerEvents: "auto",
            }}
        >
            <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                focusable="false"
                style={{
                    transform: dir === 1 ? undefined : "rotate(180deg)",
                }}
            >
                <path
                    d="M6 3.5L10.5 8L6 12.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    )

    /* ---------------- render ---------------- */

    return (
        <div ref={rootRef} style={rootStyle}>
            <style>{CSS_RULES}</style>

            <div
                style={shellStyle}
                onMouseEnter={pauseOnHover ? () => setHovered(true) : undefined}
                onMouseLeave={
                    pauseOnHover ? () => setHovered(false) : undefined
                }
            >
                {/* ---------- viewport ---------- */}
                <div style={viewportStyle}>
                    <motion.div
                        initial={false}
                        animate={{ x: `${tx}%`, y: `${ty}%`, scale: z }}
                        transition={transition}
                        style={{
                            position: "absolute",
                            inset: 0,
                            transformOrigin: "0% 0%",
                            willChange: "transform",
                        }}
                    >
                        {hasBase ? (
                            <img
                                src={image!.src}
                                srcSet={image!.srcSet}
                                alt={image!.alt || imageAlt}
                                draggable={false}
                                onError={() => setBaseFailed(true)}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit,
                                    display: "block",
                                    userSelect: "none",
                                }}
                            />
                        ) : (
                            <PlaceholderUI accent={accent} surface={surface} />
                        )}

                        {anyStepImage
                            ? stepImages.map((img, i) =>
                                  img?.src ? (
                                      <motion.img
                                          key={`si-${i}`}
                                          src={img.src}
                                          srcSet={img.srcSet}
                                          alt=""
                                          aria-hidden="true"
                                          draggable={false}
                                          initial={false}
                                          animate={{
                                              opacity:
                                                  i === activeIndex ? 1 : 0,
                                          }}
                                          transition={{
                                              duration: noMotion
                                                  ? 0
                                                  : clamp(crossfade, 0, 2),
                                              ease: "easeOut",
                                          }}
                                          style={{
                                              position: "absolute",
                                              inset: 0,
                                              width: "100%",
                                              height: "100%",
                                              objectFit,
                                              display: "block",
                                              pointerEvents: "none",
                                              userSelect: "none",
                                          }}
                                      />
                                  ) : null
                              )
                            : null}

                        {dim > 0 && count > 0 ? (
                            <div
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: "#000",
                                    opacity: clamp(dim, 0, 0.9),
                                    pointerEvents: "none",
                                }}
                            />
                        ) : null}

                        {showPins && count > 0
                            ? safeSteps.map((s, i) => (
                                  <Pin
                                      key={`pin-${i}`}
                                      step={s}
                                      index={i}
                                      active={i === activeIndex}
                                      zoom={z}
                                      transition={transition}
                                      pinStyle={pinStyle}
                                      size={clamp(pinSize, 12, 80)}
                                      pulse={pinPulse}
                                      accent={accent}
                                      onAccent={onAccent}
                                      inactiveOpacity={inactivePinOpacity}
                                      onSelect={select}
                                      controlsId={panelId}
                                      noMotion={noMotion}
                                  />
                              ))
                            : null}
                    </motion.div>

                    {showCounter && count > 1 ? (
                        <div
                            style={{
                                position: "absolute",
                                top: 12,
                                left: 12,
                                padding: "5px 10px",
                                borderRadius: 999,
                                background: alphaColor(surface, 0.85),
                                backdropFilter: "blur(8px)",
                                WebkitBackdropFilter: "blur(8px)",
                                border: `1px solid ${borderColor}`,
                                color: bodyColor,
                                fontSize: Math.max(10, labelSize - 1),
                                fontWeight: 600,
                                fontVariantNumeric: "tabular-nums",
                                letterSpacing: "0.02em",
                                pointerEvents: "none",
                            }}
                        >
                            {String(activeIndex + 1).padStart(2, "0")} /{" "}
                            {String(count).padStart(2, "0")}
                        </div>
                    ) : null}

                    {showArrows && count > 1 ? (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "0 12px",
                                pointerEvents: "none",
                            }}
                        >
                            {arrowBtn(-1)}
                            {arrowBtn(1)}
                        </div>
                    ) : null}

                    {effectiveLayout === "overlay" && count > 0 ? (
                        <div
                            style={{
                                position: "absolute",
                                left: 12,
                                right: 12,
                                bottom: 12,
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                                maxHeight: "calc(100% - 24px)",
                                overflow: "auto",
                            }}
                        >
                            {renderTabs()}
                            {captionCard}
                        </div>
                    ) : null}

                    {showProgress && count > 1 ? (
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                bottom: 0,
                                height: 3,
                                background: "rgba(255,255,255,0.12)",
                            }}
                        >
                            <motion.div
                                initial={false}
                                animate={{ scaleX: progress }}
                                transition={{
                                    duration: noMotion ? 0 : 0.4,
                                    ease: "easeOut",
                                }}
                                style={{
                                    height: "100%",
                                    background: accent,
                                    transformOrigin: "0% 50%",
                                }}
                            />
                        </div>
                    ) : null}
                </div>

                {/* ---------- caption panel ---------- */}
                {effectiveLayout !== "overlay" && count > 0 ? (
                    <div style={captionPanelStyle}>
                        {showHeading && heading ? (
                            <div
                                style={{
                                    color: bodyColor,
                                    fontSize: labelSize,
                                    fontWeight: 600,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                }}
                            >
                                {heading}
                            </div>
                        ) : null}
                        {renderTabs()}
                        {captionCard}
                    </div>
                ) : null}
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Placeholder (shown when no image is set, so defaults look complete) */
/* ------------------------------------------------------------------ */

function PlaceholderUI({
    accent,
    surface,
}: {
    accent: string
    surface: string
}) {
    const bar = (w: string, o = 0.16): React.CSSProperties => ({
        height: 8,
        width: w,
        borderRadius: 4,
        background: `rgba(255,255,255,${o})`,
    })
    return (
        <div
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(140deg, ${surface} 0%, #0E1219 100%)`,
                display: "flex",
                padding: "6%",
                gap: "3%",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    flex: "0 0 18%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    minWidth: 0,
                }}
            >
                <div
                    style={{
                        height: 14,
                        width: "70%",
                        borderRadius: 4,
                        background: accent,
                        opacity: 0.9,
                    }}
                />
                <div style={bar("90%")} />
                <div style={bar("75%")} />
                <div style={bar("82%")} />
                <div style={bar("60%")} />
            </div>
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "4%",
                    minWidth: 0,
                }}
            >
                <div style={{ display: "flex", gap: "3%", flex: "0 0 22%" }}>
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            style={{
                                flex: 1,
                                borderRadius: 10,
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.07)",
                            }}
                        />
                    ))}
                </div>
                <div
                    style={{
                        flex: 1,
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        display: "flex",
                        alignItems: "flex-end",
                        gap: "2.5%",
                        padding: "5%",
                        boxSizing: "border-box",
                        minHeight: 0,
                    }}
                >
                    {[38, 62, 44, 78, 55, 90, 66].map((h, i) => (
                        <div
                            key={i}
                            style={{
                                flex: 1,
                                height: `${h}%`,
                                borderRadius: 5,
                                background:
                                    i === 5 ? accent : "rgba(255,255,255,0.14)",
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Scoped CSS (focus rings, screen-reader text)                        */
/* ------------------------------------------------------------------ */

const CSS_RULES = `
.spt-btn, .spt-pin { -webkit-tap-highlight-color: transparent; outline: none; }
.spt-btn:focus-visible, .spt-pin:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}
.spt-pin:focus-visible { outline-color: #ffffff; }
.spt-sr {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
@media (prefers-reduced-motion: reduce) {
  .spt-btn, .spt-pin { transition: none !important; }
}
`

/* ------------------------------------------------------------------ */
/* Property controls                                                   */
/* ------------------------------------------------------------------ */

addPropertyControls(SpotlightTour, {
    /* ---------------- Content ---------------- */
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        description: "Base screenshot. A placeholder UI shows if left empty.",
    },
    imageAlt: {
        type: ControlType.String,
        title: "Alt Text",
        defaultValue: "Product screenshot",
        placeholder: "Describe the screenshot",
    },
    steps: {
        type: ControlType.Array,
        title: "Steps",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Step",
                    placeholder: "Short nav label",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Step title",
                },
                body: {
                    type: ControlType.String,
                    title: "Body",
                    defaultValue: "",
                    displayTextArea: true,
                    placeholder: "Explain what happens here",
                },
                x: {
                    type: ControlType.Number,
                    title: "Focus X",
                    defaultValue: 50,
                    min: 0,
                    max: 100,
                    step: 0.5,
                    unit: "%",
                },
                y: {
                    type: ControlType.Number,
                    title: "Focus Y",
                    defaultValue: 50,
                    min: 0,
                    max: 100,
                    step: 0.5,
                    unit: "%",
                },
                zoom: {
                    type: ControlType.Number,
                    title: "Zoom",
                    defaultValue: 1.8,
                    min: 1,
                    max: 5,
                    step: 0.05,
                },
                useCustomImage: {
                    type: ControlType.Boolean,
                    title: "Own Image",
                    defaultValue: false,
                    description: "Swap the screenshot for this step.",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (p: Step) => !p.useCustomImage,
                },
                showCta: {
                    type: ControlType.Boolean,
                    title: "Link",
                    defaultValue: false,
                },
                ctaLabel: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Learn more",
                    hidden: (p: Step) => !p.showCta,
                },
                ctaLink: {
                    type: ControlType.Link,
                    title: "URL",
                    hidden: (p: Step) => !p.showCta,
                },
            },
        },
        defaultValue: [
            {
                label: "Overview",
                title: "Everything in one workspace",
                body: "Open on a single view of the work in flight, so nobody has to chase a status update.",
                x: 16,
                y: 30,
                zoom: 2.1,
                useCustomImage: false,
                showCta: false,
                ctaLabel: "Learn more",
            },
            {
                label: "Filters",
                title: "Slice the data instantly",
                body: "Narrow results by owner, stage, or date without leaving the page or reloading anything.",
                x: 60,
                y: 22,
                zoom: 2.4,
                useCustomImage: false,
                showCta: false,
                ctaLabel: "Learn more",
            },
            {
                label: "Insights",
                title: "See the trend, not just the number",
                body: "Every metric links back to the records behind it, so the number is always explainable.",
                x: 74,
                y: 72,
                zoom: 2.2,
                useCustomImage: false,
                showCta: false,
                ctaLabel: "Learn more",
            },
        ],
    },
    showHeading: {
        type: ControlType.Boolean,
        title: "Eyebrow",
        defaultValue: false,
    },
    heading: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "How it works",
        hidden: (p: Props) => !p.showHeading,
    },

    /* ---------------- Layout ---------------- */
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        defaultValue: "below",
        options: ["below", "side", "overlay"],
        optionTitles: ["Below", "Beside", "Overlay"],
        displaySegmentedControl: true,
    },
    sidePosition: {
        type: ControlType.Enum,
        title: "Panel",
        defaultValue: "right",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        displaySegmentedControl: true,
        hidden: (p: Props) => p.layout !== "side",
    },
    sideWidth: {
        type: ControlType.Number,
        title: "Panel W",
        defaultValue: 340,
        min: 200,
        max: 720,
        step: 4,
        unit: "px",
        hidden: (p: Props) => p.layout !== "side",
    },
    stackBelow: {
        type: ControlType.Number,
        title: "Stack Below",
        defaultValue: 720,
        min: 320,
        max: 1400,
        step: 10,
        unit: "px",
        description:
            "Container width at which the layout collapses to a single column.",
    },
    aspect: {
        type: ControlType.Enum,
        title: "Aspect",
        defaultValue: "16:10",
        options: ["16:9", "16:10", "3:2", "4:3", "1:1", "9:16", "custom"],
        optionTitles: ["16:9", "16:10", "3:2", "4:3", "1:1", "9:16", "Custom"],
    },
    customAspect: {
        type: ControlType.Number,
        title: "Ratio",
        defaultValue: 1.6,
        min: 0.3,
        max: 4,
        step: 0.01,
        hidden: (p: Props) => p.aspect !== "custom",
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Fit",
        defaultValue: "cover",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        displaySegmentedControl: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 20,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 0,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    constrainWidth: {
        type: ControlType.Boolean,
        title: "Max Width",
        defaultValue: false,
    },
    maxWidth: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 1120,
        min: 240,
        max: 2000,
        step: 10,
        unit: "px",
        hidden: (p: Props) => !p.constrainWidth,
    },

    /* ---------------- Style ---------------- */
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0B0D12",
    },
    surface: {
        type: ControlType.Color,
        title: "Surface",
        defaultValue: "#14181F",
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#5B8CFF",
    },
    onAccent: {
        type: ControlType.Color,
        title: "On Accent",
        defaultValue: "#FFFFFF",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title",
        defaultValue: "#FFFFFF",
    },
    bodyColor: {
        type: ControlType.Color,
        title: "Body",
        defaultValue: "rgba(255,255,255,0.66)",
    },
    showBorder: {
        type: ControlType.Boolean,
        title: "Border",
        defaultValue: true,
    },
    borderColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "rgba(255,255,255,0.10)",
        hidden: (p: Props) => !p.showBorder,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 20,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },
    innerRadius: {
        type: ControlType.Number,
        title: "Media Radius",
        defaultValue: 14,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },
    shadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
    },
    dim: {
        type: ControlType.Number,
        title: "Dim",
        defaultValue: 0.28,
        min: 0,
        max: 0.85,
        step: 0.01,
        description: "Darkens the screenshot so the active pin stands out.",
    },
    titleSize: {
        type: ControlType.Number,
        title: "Title Size",
        defaultValue: 20,
        min: 12,
        max: 48,
        step: 1,
        unit: "px",
    },
    bodySize: {
        type: ControlType.Number,
        title: "Body Size",
        defaultValue: 15,
        min: 11,
        max: 28,
        step: 1,
        unit: "px",
    },
    labelSize: {
        type: ControlType.Number,
        title: "Label Size",
        defaultValue: 12,
        min: 9,
        max: 20,
        step: 1,
        unit: "px",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },

    /* ---------------- Pins ---------------- */
    showPins: {
        type: ControlType.Boolean,
        title: "Pins",
        defaultValue: true,
    },
    pinStyle: {
        type: ControlType.Enum,
        title: "Style",
        defaultValue: "numbered",
        options: ["numbered", "dot", "ring"],
        optionTitles: ["Numbered", "Dot", "Ring"],
        hidden: (p: Props) => !p.showPins,
    },
    pinSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 30,
        min: 12,
        max: 64,
        step: 1,
        unit: "px",
        hidden: (p: Props) => !p.showPins,
    },
    pinPulse: {
        type: ControlType.Boolean,
        title: "Pulse",
        defaultValue: true,
        hidden: (p: Props) => !p.showPins,
    },
    inactivePinOpacity: {
        type: ControlType.Number,
        title: "Inactive",
        defaultValue: 0.55,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p: Props) => !p.showPins,
    },

    /* ---------------- Controls ---------------- */
    showTabs: {
        type: ControlType.Boolean,
        title: "Step Nav",
        defaultValue: true,
    },
    tabStyle: {
        type: ControlType.Enum,
        title: "Nav Style",
        defaultValue: "chips",
        options: ["chips", "list", "dots"],
        optionTitles: ["Chips", "List", "Dots"],
        hidden: (p: Props) => !p.showTabs,
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        defaultValue: true,
    },
    showCounter: {
        type: ControlType.Boolean,
        title: "Counter",
        defaultValue: true,
    },
    showProgress: {
        type: ControlType.Boolean,
        title: "Progress",
        defaultValue: true,
    },

    /* ---------------- Motion ---------------- */
    animate: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: true,
    },
    transitionType: {
        type: ControlType.Enum,
        title: "Type",
        defaultValue: "spring",
        options: ["spring", "tween"],
        optionTitles: ["Spring", "Tween"],
        displaySegmentedControl: true,
        hidden: (p: Props) => !p.animate,
    },
    stiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        defaultValue: 150,
        min: 20,
        max: 500,
        step: 5,
        hidden: (p: Props) => !p.animate || p.transitionType !== "spring",
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 24,
        min: 5,
        max: 80,
        step: 1,
        hidden: (p: Props) => !p.animate || p.transitionType !== "spring",
    },
    mass: {
        type: ControlType.Number,
        title: "Mass",
        defaultValue: 1,
        min: 0.2,
        max: 4,
        step: 0.1,
        hidden: (p: Props) => !p.animate || p.transitionType !== "spring",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.7,
        min: 0.1,
        max: 3,
        step: 0.05,
        unit: "s",
        hidden: (p: Props) => !p.animate || p.transitionType !== "tween",
    },
    ease: {
        type: ControlType.Enum,
        title: "Easing",
        defaultValue: "easeOut",
        options: ["easeOut", "easeInOut", "circOut", "linear"],
        optionTitles: ["Ease Out", "Ease In Out", "Circ Out", "Linear"],
        hidden: (p: Props) => !p.animate || p.transitionType !== "tween",
    },
    crossfade: {
        type: ControlType.Number,
        title: "Crossfade",
        defaultValue: 0.35,
        min: 0,
        max: 1.5,
        step: 0.05,
        unit: "s",
        description: "Fade time when a step uses its own image.",
    },
    respectReducedMotion: {
        type: ControlType.Boolean,
        title: "Reduced Motion",
        defaultValue: true,
        description: "Snap instantly for visitors who ask for less motion.",
    },

    /* ---------------- Autoplay ---------------- */
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
    },
    interval: {
        type: ControlType.Number,
        title: "Every",
        defaultValue: 4,
        min: 1,
        max: 20,
        step: 0.5,
        unit: "s",
        hidden: (p: Props) => !p.autoplay,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        hidden: (p: Props) => !p.autoplay,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause On Hover",
        defaultValue: true,
        hidden: (p: Props) => !p.autoplay,
    },
})
