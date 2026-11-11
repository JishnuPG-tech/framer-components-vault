import * as React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
    animate,
    motion,
    useMotionTemplate,
    useMotionValue,
    useReducedMotion,
    useSpring,
    useTransform,
} from "framer-motion"
// @ts-ignore - ControlType.Font and useIsStaticRenderer can be missing from Framer's public TS surface.
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * Premium Magnetic Button
 *
 * A high-polish animated CTA with magnetic tilt, glass/chrome depth, a
 * cursor-tracked studio highlight, tactile press ripples, and lightweight
 * particle sparks. Built for Framer code components.
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 172
 */

const smoothSpring = { stiffness: 190, damping: 23, mass: 0.7 }
const pressSpring = { stiffness: 520, damping: 24, mass: 0.42 }
const elasticSpring = { stiffness: 330, damping: 15, mass: 0.62 }
const lagSpring = { stiffness: 95, damping: 19, mass: 0.95 }

const STYLE_ID = "premium-magnetic-button-styles-v3"
const GLOBAL_CSS = `
@keyframes pmb-aurora {
  0% { background-position: 0% 30%; transform: translate3d(-1%, 0, 0) scale(1.01); }
  50% { background-position: 100% 70%; transform: translate3d(1%, -1%, 0) scale(1.045); }
  100% { background-position: 0% 30%; transform: translate3d(-1%, 0, 0) scale(1.01); }
}
@keyframes pmb-shimmer {
  0%, 62% { transform: translateX(-150%) skewX(-16deg); opacity: 0; }
  68% { opacity: .62; }
  82% { transform: translateX(150%) skewX(-16deg); opacity: 0; }
  100% { transform: translateX(150%) skewX(-16deg); opacity: 0; }
}
@keyframes pmb-chrome {
  0% { background-position: 18% 50%; }
  50% { background-position: 82% 48%; }
  100% { background-position: 18% 50%; }
}
@keyframes pmb-liquid {
  0% { transform: translate3d(-28%, 0, 0) scaleX(.95); opacity: .14; }
  50% { opacity: .38; }
  100% { transform: translate3d(28%, 0, 0) scaleX(1.05); opacity: .14; }
}
@keyframes pmb-spin {
  to { transform: rotate(360deg); }
}
.pmb-root:focus-visible {
  outline: 2px solid var(--pmb-focus, #5ce7ff);
  outline-offset: 4px;
}
`

const NOISE_URL = `url("data:image/svg+xml,${encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='.55'/></svg>"
)}")`

const CHROME_SURFACE = `
  linear-gradient(178deg,
    var(--pmb-metal-deep) 0%,
    var(--pmb-metal-shadow) 8%,
    var(--pmb-metal-mid) 18%,
    var(--pmb-metal-bright) 30%,
    var(--pmb-metal-peak) 38%,
    var(--pmb-metal-bright) 44%,
    var(--pmb-metal-low) 52%,
    var(--pmb-metal-shadow) 64%,
    var(--pmb-metal-mid) 78%,
    var(--pmb-metal-deep) 92%,
    var(--pmb-base) 100%
  )`

const REFLECTIONS = `
  radial-gradient(75% 95% at 18% 12%, var(--pmb-primary-reflection), transparent 54%),
  radial-gradient(70% 95% at 88% 24%, var(--pmb-secondary-reflection), transparent 56%),
  radial-gradient(80% 90% at 58% 108%, var(--pmb-accent-reflection), transparent 58%),
  radial-gradient(70% 80% at 28% 88%, var(--pmb-metal-reflection), transparent 58%),
  linear-gradient(105deg, transparent 18%, var(--pmb-highlight-reflection) 44%, transparent 68%)`

const THEME_PRESETS = {
    chrome: {
        baseColor: "#030813",
        metalColor: "#5E728F",
        metalHighlightColor: "#FFFFFF",
        primaryGlowColor: "#DDEBFF",
        secondaryGlowColor: "#6C89B8",
        accentGlowColor: "#FFFFFF",
    },
    purple: {
        baseColor: "#12071F",
        metalColor: "#8F5BFF",
        metalHighlightColor: "#F4EAFF",
        primaryGlowColor: "#C084FF",
        secondaryGlowColor: "#6D5BFF",
        accentGlowColor: "#F0B8FF",
    },
    emerald: {
        baseColor: "#03140F",
        metalColor: "#1FC98D",
        metalHighlightColor: "#D7FFF0",
        primaryGlowColor: "#43F0B2",
        secondaryGlowColor: "#1BAA9C",
        accentGlowColor: "#D2FF8F",
    },
    sapphire: {
        baseColor: "#06101F",
        metalColor: "#3B82F6",
        metalHighlightColor: "#E5F0FF",
        primaryGlowColor: "#60A5FA",
        secondaryGlowColor: "#2DD4BF",
        accentGlowColor: "#A78BFA",
    },
    rose: {
        baseColor: "#1E0710",
        metalColor: "#F0528F",
        metalHighlightColor: "#FFE8F1",
        primaryGlowColor: "#FF7AB6",
        secondaryGlowColor: "#F43F5E",
        accentGlowColor: "#FFD0A6",
    },
    gold: {
        baseColor: "#1A1204",
        metalColor: "#D59A26",
        metalHighlightColor: "#FFF4C6",
        primaryGlowColor: "#FFD36E",
        secondaryGlowColor: "#F59E0B",
        accentGlowColor: "#FFFFFF",
    },
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

function parseHexColor(color) {
    const hex = color.trim()

    if (/^#[0-9a-f]{3}$/i.test(hex)) {
        return {
            r: parseInt(hex[1] + hex[1], 16),
            g: parseInt(hex[2] + hex[2], 16),
            b: parseInt(hex[3] + hex[3], 16),
        }
    }

    if (/^#[0-9a-f]{6}$/i.test(hex)) {
        return {
            r: parseInt(hex.slice(1, 3), 16),
            g: parseInt(hex.slice(3, 5), 16),
            b: parseInt(hex.slice(5, 7), 16),
        }
    }

    const rgb = hex.match(
        /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)/i
    )
    if (rgb) {
        return {
            r: Math.round(clamp(Number(rgb[1]), 0, 255)),
            g: Math.round(clamp(Number(rgb[2]), 0, 255)),
            b: Math.round(clamp(Number(rgb[3]), 0, 255)),
        }
    }

    return null
}

function colorWithAlpha(color, alpha) {
    const rgb = parseHexColor(color)
    if (!rgb) return color

    const safeAlpha = clamp(alpha, 0, 1)
    return `rgba(${rgb.r},${rgb.g},${rgb.b},${safeAlpha})`
}

function mixColors(from, to, amount, fallback = from) {
    const a = parseHexColor(from)
    const b = parseHexColor(to)
    if (!a || !b) return fallback

    const t = clamp(amount, 0, 1)
    const r = Math.round(a.r + (b.r - a.r) * t)
    const g = Math.round(a.g + (b.g - a.g) * t)
    const bValue = Math.round(a.b + (b.b - a.b) * t)

    return `rgb(${r},${g},${bValue})`
}

function makeChromePalette(metalColor, baseColor, highlightColor) {
    return {
        deep: mixColors(metalColor, baseColor, 0.86, baseColor),
        shadow: mixColors(metalColor, "#000000", 0.7, baseColor),
        mid: mixColors(metalColor, "#111827", 0.26, metalColor),
        low: mixColors(metalColor, baseColor, 0.48, metalColor),
        light: mixColors(metalColor, highlightColor, 0.6, highlightColor),
        bright: mixColors(metalColor, highlightColor, 0.78, highlightColor),
        peak: mixColors(metalColor, highlightColor, 0.94, highlightColor),
    }
}

function resolvePalette(themePreset, customPalette) {
    if (themePreset && themePreset !== "custom" && THEME_PRESETS[themePreset]) {
        return THEME_PRESETS[themePreset]
    }

    return customPalette
}

const layer = {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    pointerEvents: "none",
}

function injectStyles() {
    if (typeof document === "undefined") return
    if (document.getElementById(STYLE_ID)) return

    const el = document.createElement("style")
    el.id = STYLE_ID
    el.textContent = GLOBAL_CSS
    document.head.appendChild(el)
}

function fontToStyle(font) {
    return {
        fontFamily:
            font && font.fontFamily
                ? font.fontFamily
                : "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        ...(font && font.fontStyle ? { fontStyle: font.fontStyle } : {}),
    }
}

function GlyphIcon({ type, size }) {
    const base = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        "aria-hidden": true,
        focusable: false,
        style: { display: "block", flex: "0 0 auto" },
    }

    switch (type) {
        case "sparkle":
            return (
                <svg {...base} fill="currentColor">
                    <path d="M12 2.25c.58 4.92 2.45 6.79 7.25 7.33-4.8.55-6.67 2.42-7.25 7.34-.58-4.92-2.45-6.79-7.25-7.34 4.8-.54 6.67-2.41 7.25-7.33Z" />
                    <path d="M18.5 15.5c.24 1.92.98 2.66 2.75 2.9-1.77.24-2.51.98-2.75 2.9-.25-1.92-.99-2.66-2.75-2.9 1.76-.24 2.5-.98 2.75-2.9Z" />
                </svg>
            )
        case "bolt":
            return (
                <svg {...base} fill="currentColor">
                    <path d="M13.35 2.25 4.5 13.35h6.04l-1.23 8.4 10.19-12.5h-6.32l.17-7Z" />
                </svg>
            )
        case "play":
            return (
                <svg {...base} fill="currentColor">
                    <path d="M8.25 5.05c0-.75.82-1.21 1.46-.82l9.15 5.73c.6.37.6 1.25 0 1.62l-9.15 5.73c-.64.4-1.46-.07-1.46-.82V5.05Z" />
                </svg>
            )
        case "arrow":
        default:
            return (
                <svg
                    {...base}
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.15}
                >
                    <path d="M5 12h13.25" />
                    <path d="m12.9 6.65 5.35 5.35-5.35 5.35" />
                </svg>
            )
    }
}

function LoadingSpinner({ size, animate }) {
    const stroke =
        typeof size === "number"
            ? `${Math.max(2, Math.round(size * 0.12))}px`
            : "0.12em"

    return (
        <span
            aria-hidden
            style={{
                width: size,
                height: size,
                borderRadius: "50%",
                border: `${stroke} solid rgba(255,255,255,.34)`,
                borderTopColor: "currentColor",
                boxSizing: "border-box",
                display: "block",
                flex: "0 0 auto",
                animation: animate ? "pmb-spin .8s linear infinite" : "none",
            }}
        />
    )
}

function PremiumMagneticButton(props) {
    const {
        label = "Launch Experience",
        ariaLabel,
        style,
        font,
        fontSize = 17,
        fontWeight = "600",
        textColor = "#FFFFFF",
        themePreset = "chrome",
        sizeMode = "frame",
        textSizeMode = "component",
        customWidth = 640,
        customHeight = 172,
        radius = 999,
        baseColor = "#030813",
        metalColor = "#5E728F",
        metalHighlightColor = "#FFFFFF",
        metalIntensity = 0.78,
        primaryGlowColor = "#DDEBFF",
        secondaryGlowColor = "#6C89B8",
        accentGlowColor = "#FFFFFF",
        showIcon = true,
        iconType = "arrow",
        iconPosition = "right",
        loading = false,
        loadingLabel = "Loading",
        motionStrength = 1,
        reflectionIntensity = 1,
        outerGlowIntensity = 1,
        enableOuterGlow = true,
        enableSurfaceNoise = true,
        enableSurfaceReflections = true,
        enableSpecularDrift = true,
        enableLiquidSweep = true,
        enableShimmer = true,
        enableCursorHighlight = true,
        enableGlassSheen = true,
        enableInnerGlow = true,
        enableRimHighlight = true,
        enablePressRipple = true,
        enableParticles = true,
        enableMagneticTilt = true,
        disabled = false,
        href,
        openInNewTab = false,
    } = props

    const isStatic =
        typeof useIsStaticRenderer === "function"
            ? useIsStaticRenderer()
            : false
    const reduceMotion = !!useReducedMotion()
    const blocked = disabled || loading

    const [hovered, setHovered] = useState(false)
    const [pressed, setPressed] = useState(false)
    const [bursts, setBursts] = useState([])
    const [isNearViewport, setIsNearViewport] = useState(false)
    const [isDocumentVisible, setIsDocumentVisible] = useState(true)

    const lifecycleActive = isNearViewport && isDocumentVisible
    const animationOK = !isStatic && !reduceMotion && lifecycleActive
    const interactive = !isStatic && !blocked
    const motionOK = interactive && !reduceMotion && lifecycleActive
    const idleOK = animationOK && !blocked

    const rootRef = useRef(null)
    const burstId = useRef(0)
    const mounted = useRef(false)
    const timers = useRef([])

    const px = useMotionValue(0)
    const py = useMotionValue(0)
    const scale = useMotionValue(1)
    const pressDepth = useMotionValue(1)

    const sx = useSpring(px, smoothSpring)
    const sy = useSpring(py, smoothSpring)
    const hx = useSpring(px, lagSpring)
    const hy = useSpring(py, lagSpring)
    const motionPower = clamp(motionStrength, 0, 1.5)
    const chromeShiftX = 14 * motionPower
    const chromeShiftY = 9 * motionPower
    const highlightTravel = Math.min(42, 34 * motionPower)

    const maxTilt = motionOK && enableMagneticTilt ? 8.5 * motionPower : 0
    const maxTiltRef = useRef(maxTilt)
    maxTiltRef.current = maxTilt

    const rotateX = useTransform([sy, pressDepth], ([y, depth]) => {
        return -Number(y) * maxTiltRef.current * Number(depth)
    })
    const rotateY = useTransform([sx, pressDepth], ([x, depth]) => {
        return Number(x) * maxTiltRef.current * Number(depth)
    })
    const chromeX = useTransform(sx, [-1, 1], [-chromeShiftX, chromeShiftX])
    const chromeY = useTransform(sy, [-1, 1], [-chromeShiftY, chromeShiftY])
    const highlightX = useTransform(
        hx,
        [-1, 1],
        [50 - highlightTravel, 50 + highlightTravel]
    )
    const highlightY = useTransform(
        hy,
        [-1, 1],
        [50 - highlightTravel * 1.16, 50 + highlightTravel * 1.16]
    )

    const cursorHighlight = useMotionTemplate`radial-gradient(42% 28% at ${highlightX}% ${highlightY}%, rgba(255,255,255,.96), rgba(210,244,255,.36) 36%, rgba(255,255,255,0) 74%)`
    const rimHighlight = useMotionTemplate`
      radial-gradient(42% 145% at ${highlightX}% ${highlightY}%, rgba(255,255,255,.95), rgba(255,255,255,.18) 40%, rgba(255,255,255,0) 70%),
      linear-gradient(180deg, rgba(255,255,255,.58), rgba(123,154,196,.22) 18%, rgba(8,19,34,.5) 72%, rgba(255,255,255,.22) 100%)`

    useEffect(() => {
        mounted.current = true
        injectStyles()

        return () => {
            mounted.current = false
            timers.current.forEach((timer) => window.clearTimeout(timer))
            timers.current = []
        }
    }, [])

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return

        const node = rootRef.current
        if (!node || typeof window.IntersectionObserver !== "function") {
            // Keep effects available in older browsers that cannot report visibility.
            setIsNearViewport(true)
            return
        }

        const observer = new window.IntersectionObserver(
            ([entry]) => setIsNearViewport(entry.isIntersecting),
            {
                // Start effects shortly before the component scrolls onscreen.
                rootMargin: "200px",
                threshold: 0,
            }
        )

        observer.observe(node)
        return () => observer.disconnect()
    }, [isStatic])

    useEffect(() => {
        if (lifecycleActive) return

        setHovered(false)
        setPressed(false)
        setBursts([])
        if (typeof window !== "undefined") {
            timers.current.forEach((timer) => window.clearTimeout(timer))
        }
        timers.current = []
        px.set(0)
        py.set(0)
        scale.set(1)
        pressDepth.set(1)
    }, [lifecycleActive, pressDepth, px, py, scale])

    useEffect(() => {
        if (isStatic || typeof document === "undefined") return

        const updateDocumentVisibility = () => {
            setIsDocumentVisible(document.visibilityState === "visible")
        }

        updateDocumentVisibility()
        document.addEventListener("visibilitychange", updateDocumentVisibility)
        return () =>
            document.removeEventListener(
                "visibilitychange",
                updateDocumentVisibility
            )
    }, [isStatic])

    const resolvedPalette = resolvePalette(themePreset, {
        baseColor,
        metalColor,
        metalHighlightColor,
        primaryGlowColor,
        secondaryGlowColor,
        accentGlowColor,
    })
    const metal = clamp(metalIntensity, 0, 1)
    const reflectionPower = clamp(reflectionIntensity, 0, 1.5)
    const glowPower = clamp(outerGlowIntensity, 0, 1.5)
    const chromePalette = makeChromePalette(
        resolvedPalette.metalColor,
        resolvedPalette.baseColor,
        resolvedPalette.metalHighlightColor
    )
    const chromeContrast = hovered ? 1 + metal * 0.58 : 1 + metal * 0.32
    const chromeBrightness = hovered ? 1.075 : 1
    const tintOpacity = clamp(
        (hovered ? 0.7 : 0.48) * (0.56 + metal * 0.55) * reflectionPower,
        0,
        1
    )
    const specularOpacity = clamp(
        (hovered ? 0.82 : 0.6) * reflectionPower,
        0,
        1
    )
    const liquidOpacity = enableLiquidSweep && (hovered || pressed) ? 1 : 0
    const cursorOpacity = clamp((hovered ? 0.98 : 0) * reflectionPower, 0, 1)
    const glassSheenOpacity = clamp(
        (hovered ? 0.86 : 0.62) * (0.7 + reflectionPower * 0.3),
        0,
        1
    )
    const innerGlowOpacity = clamp((hovered ? 1 : 0.64) * reflectionPower, 0, 1)
    const height = Math.max(36, customHeight)
    const width = Math.max(88, customWidth)
    const safeRadius = Math.max(0, radius)
    const fontStyle = useMemo(() => fontToStyle(font), [font])
    const displayLabel =
        loading && loadingLabel.trim() ? loadingLabel.trim() : label
    const accessibleLabel =
        ariaLabel && ariaLabel.trim() ? ariaLabel.trim() : displayLabel
    const iconSide = iconPosition === "left" ? "left" : "right"
    const frameStyle = style || {}
    const hasFrameWidth =
        frameStyle.width !== undefined && frameStyle.width !== "auto"
    const hasFrameHeight =
        frameStyle.height !== undefined && frameStyle.height !== "auto"
    const fillFrame = sizeMode !== "fixed"
    const textFollowsComponent = textSizeMode !== "custom"
    const visualWidth = fillFrame ? "100%" : width
    const visualHeight = fillFrame ? "100%" : height
    const fixedHorizontalPadding = Math.max(14, Math.round(height * 0.42))
    const textFitUnits =
        displayLabel.length * 0.56 + (showIcon || loading ? 2.15 : 0)
    const safeTextFitUnits = Math.max(1, Number(textFitUnits.toFixed(2)))
    const widthFontUnit = clamp(74 / safeTextFitUnits, 2.8, 16)
    const componentFontSize = `clamp(10px, min(30cqh, ${widthFontUnit.toFixed(2)}cqw), 96px)`
    const resolvedFontSize = textFollowsComponent ? componentFontSize : fontSize
    const weight = Number(fontWeight || font?.fontWeight) || 600
    const iconSize = "1.08em"
    const horizontalPadding = textFollowsComponent
        ? "var(--pmb-pad-x)"
        : `${fixedHorizontalPadding}px`
    const gap =
        showIcon || loading
            ? textFollowsComponent
                ? "0.48em"
                : `${Math.max(7, Math.round(fontSize * 0.48))}px`
            : 0
    const glowLength = (ratio) =>
        fillFrame
            ? `${(ratio * 100).toFixed(2)}cqh`
            : `${Math.round(height * ratio)}px`
    const outerGlowFilter =
        enableOuterGlow && !blocked && glowPower > 0
            ? [
                  `drop-shadow(0 0 ${glowLength(0.08 + glowPower * 0.05)} ${colorWithAlpha(resolvedPalette.primaryGlowColor, (hovered ? 0.42 : 0.26) * glowPower)})`,
                  `drop-shadow(0 ${glowLength(0.05)} ${glowLength(0.2 + glowPower * 0.1)} ${colorWithAlpha(resolvedPalette.secondaryGlowColor, (hovered ? 0.34 : 0.22) * glowPower)})`,
                  `drop-shadow(0 ${glowLength(0.22)} ${glowLength(0.5 + glowPower * 0.12)} ${colorWithAlpha("#000000", 0.34 * glowPower)})`,
              ].join(" ")
            : "none"
    const rootFilter = disabled
        ? "grayscale(.9) brightness(.78)"
        : outerGlowFilter

    const readPointer = useCallback((event) => {
        const el = rootRef.current
        if (!el) return null

        const rect = el.getBoundingClientRect()
        if (!rect.width || !rect.height) return null

        const lx = event.clientX - rect.left
        const ly = event.clientY - rect.top

        return {
            lx,
            ly,
            nx: clamp((lx / rect.width) * 2 - 1, -1, 1),
            ny: clamp((ly / rect.height) * 2 - 1, -1, 1),
        }
    }, [])

    const removeBurstLater = useCallback((id) => {
        const timer = window.setTimeout(() => {
            if (mounted.current) {
                setBursts((active) => active.filter((burst) => burst.id !== id))
            }
        }, 760)
        timers.current.push(timer)
    }, [])

    const spawnBurst = useCallback(
        (x, y) => {
            if (!motionOK || (!enablePressRipple && !enableParticles)) return

            const id = ++burstId.current
            const rect = rootRef.current?.getBoundingClientRect()
            const liveHeight = rect && rect.height > 0 ? rect.height : height
            const effectScale = clamp(liveHeight / height, 0.75, 3)
            const ripple = Math.max(160, liveHeight * 2.65)
            const count = enableParticles ? 10 : 0
            const sparks = Array.from({ length: count }, (_, index) => {
                const angle =
                    (Math.PI * 2 * index) / Math.max(count, 1) +
                    (Math.random() - 0.5) * 0.52
                const distance = (30 + Math.random() * 58) * effectScale

                return {
                    id: index,
                    dx: Math.cos(angle) * distance,
                    dy: Math.sin(angle) * distance,
                    size: (1.8 + Math.random() * 2.7) * effectScale,
                    duration: 0.42 + Math.random() * 0.22,
                }
            })

            setBursts((active) => [
                ...active.slice(-3),
                { id, x, y, ripple, sparks },
            ])
            removeBurstLater(id)
        },
        [enableParticles, enablePressRipple, height, motionOK, removeBurstLater]
    )

    const resetSurface = useCallback(() => {
        px.set(0)
        py.set(0)

        if (motionOK) {
            animate(scale, 1, { type: "spring", ...smoothSpring })
            animate(pressDepth, 1, { type: "spring", ...smoothSpring })
        }
    }, [motionOK, pressDepth, px, py, scale])

    const handlePointerMove = useCallback(
        (event) => {
            if (!motionOK) return

            const pointer = readPointer(event)
            if (!pointer) return

            px.set(pointer.nx)
            py.set(pointer.ny)
        },
        [motionOK, px, py, readPointer]
    )

    const handlePointerEnter = useCallback(() => {
        setHovered(true)
        if (motionOK) {
            animate(scale, 1.046, { type: "spring", ...smoothSpring })
        }
    }, [motionOK, scale])

    const handlePointerLeave = useCallback(() => {
        setHovered(false)
        setPressed(false)
        resetSurface()
    }, [resetSurface])

    const handlePointerDown = useCallback(
        (event) => {
            if (!motionOK) return

            const pointer = readPointer(event)
            setPressed(true)

            try {
                event.currentTarget.setPointerCapture(event.pointerId)
            } catch {
                // Some embedded preview surfaces do not support capture.
            }

            if (pointer) {
                px.set(pointer.nx)
                py.set(pointer.ny)
                spawnBurst(pointer.lx, pointer.ly)
            }

            animate(scale, 0.965, { type: "spring", ...pressSpring })
            animate(pressDepth, 0.3, { type: "spring", ...pressSpring })
        },
        [motionOK, pressDepth, px, py, readPointer, scale, spawnBurst]
    )

    const handlePointerUp = useCallback(
        (event) => {
            if (!motionOK) return

            setPressed(false)

            try {
                event.currentTarget.releasePointerCapture(event.pointerId)
            } catch {
                // Already released or unsupported.
            }

            animate(scale, hovered ? 1.046 : 1, {
                type: "spring",
                ...elasticSpring,
            })
            animate(pressDepth, 1, { type: "spring", ...elasticSpring })
        },
        [hovered, motionOK, pressDepth, scale]
    )

    const handlePointerLostCapture = useCallback(() => {
        if (!motionOK) return

        setPressed(false)
        animate(scale, hovered ? 1.046 : 1, {
            type: "spring",
            ...elasticSpring,
        })
        animate(pressDepth, 1, { type: "spring", ...elasticSpring })
    }, [hovered, motionOK, pressDepth, scale])

    const handleKeyDown = useCallback(
        (event) => {
            if (!motionOK || event.repeat) return
            if (event.key !== "Enter" && event.key !== " ") return

            const el = rootRef.current
            if (!el) return

            const rect = el.getBoundingClientRect()
            setPressed(true)
            spawnBurst(rect.width / 2, rect.height / 2)
            animate(scale, 0.97, { type: "spring", ...pressSpring })
            animate(pressDepth, 0.44, { type: "spring", ...pressSpring })
        },
        [motionOK, pressDepth, scale, spawnBurst]
    )

    const handleKeyUp = useCallback(
        (event) => {
            if (!motionOK) return
            if (event.key !== "Enter" && event.key !== " ") return

            setPressed(false)
            animate(scale, hovered ? 1.046 : 1, {
                type: "spring",
                ...elasticSpring,
            })
            animate(pressDepth, 1, { type: "spring", ...elasticSpring })
        },
        [hovered, motionOK, pressDepth, scale]
    )

    const handlers = interactive
        ? {
              onPointerMove: handlePointerMove,
              onPointerEnter: handlePointerEnter,
              onPointerLeave: handlePointerLeave,
              onPointerDown: handlePointerDown,
              onPointerUp: handlePointerUp,
              onPointerCancel: handlePointerLeave,
              onLostPointerCapture: handlePointerLostCapture,
              onKeyDown: handleKeyDown,
              onKeyUp: handleKeyUp,
              onBlur: handlePointerLeave,
          }
        : {}

    const isLink = Boolean(href && !blocked)
    const MotionTag = isLink ? motion.a : motion.button
    const tagProps = isLink
        ? {
              href,
              target: openInNewTab ? "_blank" : undefined,
              rel: openInNewTab ? "noopener noreferrer" : undefined,
          }
        : {
              type: "button",
              disabled: blocked,
          }

    const outerStyle = {
        ...frameStyle,
        position: frameStyle.position || "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: hasFrameWidth ? frameStyle.width : width,
        height: hasFrameHeight ? frameStyle.height : height,
        minWidth: hasFrameWidth ? undefined : width,
        minHeight: hasFrameHeight ? undefined : height,
        boxSizing: "border-box",
        overflow: "visible",
        background: "transparent",
        border: "none",
        containerType: "size",
    }

    const rootStyle = {
        "--pmb-base": resolvedPalette.baseColor,
        "--pmb-primary": resolvedPalette.primaryGlowColor,
        "--pmb-secondary": resolvedPalette.secondaryGlowColor,
        "--pmb-accent": resolvedPalette.accentGlowColor,
        "--pmb-metal-deep": chromePalette.deep,
        "--pmb-metal-shadow": chromePalette.shadow,
        "--pmb-metal-mid": chromePalette.mid,
        "--pmb-metal-low": chromePalette.low,
        "--pmb-metal-light": chromePalette.light,
        "--pmb-metal-bright": chromePalette.bright,
        "--pmb-metal-peak": chromePalette.peak,
        "--pmb-primary-reflection": colorWithAlpha(
            resolvedPalette.primaryGlowColor,
            0.82
        ),
        "--pmb-secondary-reflection": colorWithAlpha(
            resolvedPalette.secondaryGlowColor,
            0.74
        ),
        "--pmb-accent-reflection": colorWithAlpha(
            resolvedPalette.accentGlowColor,
            0.34
        ),
        "--pmb-metal-reflection": colorWithAlpha(
            resolvedPalette.metalColor,
            0.5
        ),
        "--pmb-highlight-reflection": colorWithAlpha(
            resolvedPalette.metalHighlightColor,
            0.36
        ),
        "--pmb-primary-inner": colorWithAlpha(
            resolvedPalette.primaryGlowColor,
            0.3
        ),
        "--pmb-secondary-inner": colorWithAlpha(
            resolvedPalette.secondaryGlowColor,
            0.16
        ),
        "--pmb-pad-x": fillFrame
            ? "clamp(14px, min(14cqw, 42cqh), 96px)"
            : horizontalPadding,
        "--pmb-text": textColor,
        "--pmb-focus": resolvedPalette.primaryGlowColor,
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: visualWidth,
        height: visualHeight,
        minWidth: 0,
        minHeight: 0,
        maxWidth: "100%",
        maxHeight: "100%",
        boxSizing: "border-box",
        flex: "0 0 auto",
        border: "none",
        borderRadius: safeRadius,
        clipPath: `inset(0 round ${safeRadius}px)`,
        WebkitClipPath: `inset(0 round ${safeRadius}px)`,
        padding: 0,
        margin: 0,
        appearance: "none",
        WebkitAppearance: "none",
        background: "transparent",
        color: "var(--pmb-text)",
        cursor: disabled ? "not-allowed" : loading ? "wait" : "pointer",
        isolation: "isolate",
        overflow: "hidden",
        outline: "none",
        userSelect: "none",
        textDecoration: "none",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
        transformPerspective: 920,
        transformStyle: "flat",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        rotateX,
        rotateY,
        scale,
        opacity: disabled ? 0.52 : 1,
        filter: rootFilter,
        pointerEvents: isStatic ? "none" : "auto",
    }

    return (
        <div style={outerStyle}>
            <MotionTag
                ref={rootRef}
                className="pmb-root"
                aria-label={accessibleLabel}
                aria-disabled={blocked || undefined}
                aria-busy={loading || undefined}
                style={rootStyle}
                {...tagProps}
                {...handlers}
            >
                <div
                    aria-hidden
                    style={{
                        ...layer,
                        zIndex: 1,
                        overflow: "hidden",
                        isolation: "isolate",
                        clipPath: `inset(0 round ${safeRadius}px)`,
                        WebkitClipPath: `inset(0 round ${safeRadius}px)`,
                        background:
                            "radial-gradient(140% 125% at 50% -25%, rgba(255,255,255,.16), transparent 46%), linear-gradient(180deg, rgba(255,255,255,.08), rgba(0,0,0,0) 22%, rgba(0,0,0,.62) 100%), var(--pmb-base)",
                        boxShadow:
                            "inset 0 2px 0 rgba(255,255,255,.34), inset 0 -4px 8px rgba(0,0,0,.72), inset 0 0 0 1px rgba(255,255,255,.13), inset 0 0 0 3px rgba(10,24,44,.72)",
                    }}
                >
                    {enableSurfaceNoise && (
                        <div
                            style={{
                                ...layer,
                                backgroundImage: NOISE_URL,
                                backgroundSize: "180px 180px",
                                opacity: 0.05,
                                mixBlendMode: "overlay",
                            }}
                        />
                    )}

                    <div
                        style={{
                            ...layer,
                            background: CHROME_SURFACE,
                            backgroundRepeat: "no-repeat",
                            filter: `contrast(${chromeContrast}) brightness(${chromeBrightness})`,
                            transition: "filter .42s ease",
                        }}
                    />

                    {enableSurfaceReflections && (
                        <motion.div
                            style={{
                                ...layer,
                                inset: -22,
                                x: chromeX,
                                y: chromeY,
                                background: REFLECTIONS,
                                backgroundSize: "210% 210%",
                                opacity: tintOpacity,
                                mixBlendMode: "soft-light",
                                animation: idleOK
                                    ? "pmb-aurora 13s ease-in-out infinite"
                                    : "none",
                            }}
                        />
                    )}

                    {enableSpecularDrift && (
                        <motion.div
                            style={{
                                ...layer,
                                inset: -14,
                                x: chromeX,
                                background:
                                    "linear-gradient(180deg, transparent 16%, rgba(255,255,255,.92) 34%, rgba(255,255,255,.64) 42%, rgba(255,255,255,0) 55%)",
                                backgroundSize: "160% 100%",
                                opacity: specularOpacity,
                                mixBlendMode: "screen",
                                animation: idleOK
                                    ? "pmb-chrome 7.8s ease-in-out infinite"
                                    : "none",
                            }}
                        />
                    )}

                    <div
                        style={{
                            ...layer,
                            background:
                                "radial-gradient(140% 78% at 50% 8%, rgba(255,255,255,.28), rgba(255,255,255,0) 58%), radial-gradient(120% 120% at 50% 118%, rgba(0,0,0,.76), rgba(0,0,0,0) 58%), linear-gradient(180deg, transparent 0%, transparent 57%, rgba(116,154,220,.16) 70%, transparent 82%)",
                        }}
                    />
                    <div
                        style={{
                            ...layer,
                            background:
                                "linear-gradient(180deg, transparent 0%, transparent 50%, rgba(0,5,14,.36) 72%, rgba(0,2,7,.78) 100%)",
                        }}
                    />

                    {enableLiquidSweep && (
                        <div
                            style={{
                                ...layer,
                                width: "78%",
                                left: "-18%",
                                background:
                                    "radial-gradient(55% 135% at 50% 50%, rgba(255,255,255,.46), transparent 68%)",
                                opacity: liquidOpacity,
                                mixBlendMode: "screen",
                                transition: "opacity .34s ease",
                                animation: idleOK
                                    ? "pmb-liquid 3.2s ease-in-out infinite alternate"
                                    : "none",
                            }}
                        />
                    )}

                    {enableShimmer && (
                        <div style={{ ...layer, overflow: "hidden" }}>
                            <div
                                style={{
                                    position: "absolute",
                                    top: "-24%",
                                    bottom: "-24%",
                                    left: "-32%",
                                    width: "58%",
                                    background:
                                        "linear-gradient(90deg, transparent, rgba(255,255,255,.62), transparent)",
                                    opacity: 0,
                                    mixBlendMode: "screen",
                                    animation: idleOK
                                        ? "pmb-shimmer 4.9s ease-in-out infinite"
                                        : "none",
                                }}
                            />
                        </div>
                    )}

                    {enableCursorHighlight && hovered && (
                        <motion.div
                            style={{
                                ...layer,
                                background: cursorHighlight,
                                opacity: cursorOpacity,
                                mixBlendMode: "screen",
                                transition: "opacity .32s ease",
                            }}
                        />
                    )}

                    {enableGlassSheen && (
                        <>
                            <div
                                style={{
                                    ...layer,
                                    inset: "5% 4%",
                                    borderRadius: safeRadius,
                                    background:
                                        "linear-gradient(180deg, rgba(255,255,255,.72), rgba(255,255,255,.2) 12%, rgba(255,255,255,0) 28%, rgba(255,255,255,0) 72%, rgba(134,176,255,.18) 86%, rgba(255,255,255,.08) 100%)",
                                    opacity: glassSheenOpacity,
                                    transition: "opacity .4s ease",
                                }}
                            />
                            <div
                                style={{
                                    ...layer,
                                    inset: "4% 2.6%",
                                    borderRadius: safeRadius,
                                    boxShadow:
                                        "inset 0 0 0 1px rgba(255,255,255,.38), inset 0 0 18px rgba(214,232,255,.3)",
                                    opacity: glassSheenOpacity,
                                    transition: "opacity .4s ease",
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    inset: "7% 3.2%",
                                    borderRadius: safeRadius,
                                    boxShadow:
                                        "inset 12px 0 16px rgba(236,247,255,.56), inset -12px 0 16px rgba(236,247,255,.56)",
                                    opacity: glassSheenOpacity,
                                    pointerEvents: "none",
                                }}
                            />
                        </>
                    )}

                    {enableInnerGlow && (
                        <div
                            style={{
                                ...layer,
                                boxShadow:
                                    "inset 0 0 24px var(--pmb-primary-inner), inset 0 0 42px var(--pmb-secondary-inner)",
                                opacity: innerGlowOpacity,
                                mixBlendMode: "screen",
                                transition: "opacity .35s ease",
                            }}
                        />
                    )}

                    {bursts.map((burst) => (
                        <React.Fragment key={burst.id}>
                            {enablePressRipple && (
                                <motion.div
                                    initial={{
                                        width: 0,
                                        height: 0,
                                        opacity: 0.9,
                                    }}
                                    animate={{
                                        width: burst.ripple,
                                        height: burst.ripple,
                                        opacity: 0,
                                    }}
                                    transition={{
                                        duration: 0.52,
                                        ease: [0.16, 0.84, 0.44, 1],
                                    }}
                                    style={{
                                        position: "absolute",
                                        left: burst.x,
                                        top: burst.y,
                                        x: "-50%",
                                        y: "-50%",
                                        borderRadius: "50%",
                                        background:
                                            "radial-gradient(circle, rgba(255,255,255,.96), rgba(255,255,255,.42) 34%, transparent 70%)",
                                        mixBlendMode: "screen",
                                        pointerEvents: "none",
                                    }}
                                />
                            )}
                            {burst.sparks.map((spark) => (
                                <motion.span
                                    key={spark.id}
                                    initial={{
                                        x: 0,
                                        y: 0,
                                        opacity: 1,
                                        scale: 1,
                                    }}
                                    animate={{
                                        x: spark.dx,
                                        y: spark.dy,
                                        opacity: 0,
                                        scale: 0.28,
                                    }}
                                    transition={{
                                        duration: spark.duration,
                                        ease: "easeOut",
                                    }}
                                    style={{
                                        position: "absolute",
                                        left: burst.x,
                                        top: burst.y,
                                        width: spark.size,
                                        height: spark.size,
                                        marginLeft: -spark.size / 2,
                                        marginTop: -spark.size / 2,
                                        borderRadius: "50%",
                                        background:
                                            "radial-gradient(circle, #fff, rgba(255,255,255,.18) 72%, transparent)",
                                        boxShadow:
                                            "0 0 7px rgba(255,255,255,.88), 0 0 10px var(--pmb-primary)",
                                        pointerEvents: "none",
                                    }}
                                />
                            ))}
                        </React.Fragment>
                    ))}
                </div>

                {enableRimHighlight && (
                    <motion.div
                        aria-hidden
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 2,
                            borderRadius: "inherit",
                            boxSizing: "border-box",
                            padding: 1.25,
                            background: rimHighlight,
                            opacity: hovered ? 1 : 0.72,
                            transition: "opacity .35s ease",
                            WebkitMask:
                                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                            WebkitMaskComposite: "xor",
                            mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                            maskComposite: "exclude",
                            mixBlendMode: "screen",
                            pointerEvents: "none",
                        }}
                    />
                )}

                <span
                    style={{
                        position: "relative",
                        zIndex: 3,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        height: "100%",
                        maxWidth: "100%",
                        minWidth: 0,
                        gap,
                        padding: `0 ${horizontalPadding}`,
                        boxSizing: "border-box",
                        background: "transparent",
                        color: "var(--pmb-text)",
                        fontSize: resolvedFontSize,
                        fontWeight: weight,
                        lineHeight: 1,
                        letterSpacing: 0,
                        textAlign: "center",
                        textShadow: "0 1px 2px rgba(0,0,0,.62)",
                        mixBlendMode: "normal",
                        pointerEvents: "none",
                        ...fontStyle,
                    }}
                >
                    {(loading || showIcon) && iconSide === "left" && (
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flex: "0 0 auto",
                            }}
                        >
                            {loading ? (
                                <LoadingSpinner
                                    size={iconSize}
                                    animate={animationOK}
                                />
                            ) : (
                                <GlyphIcon type={iconType} size={iconSize} />
                            )}
                        </span>
                    )}
                    <span
                        style={{
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {displayLabel}
                    </span>
                    {(loading || showIcon) && iconSide === "right" && (
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flex: "0 0 auto",
                            }}
                        >
                            {loading ? (
                                <LoadingSpinner
                                    size={iconSize}
                                    animate={animationOK}
                                />
                            ) : (
                                <GlyphIcon type={iconType} size={iconSize} />
                            )}
                        </span>
                    )}
                </span>
            </MotionTag>
        </div>
    )
}

PremiumMagneticButton.displayName = "Premium Magnetic Button"

export default PremiumMagneticButton

const FontControl = Object(ControlType).Font

addPropertyControls(PremiumMagneticButton, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Launch Experience",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "",
    },
    ...(FontControl
        ? {
              font: {
                  type: FontControl,
                  title: "Font",
                  controls: "basic",
                  displayFontSize: false,
                  displayTextAlignment: false,
                  defaultFontType: "sans-serif",
                  defaultValue: { fontFamily: "Inter", fontWeight: 600 },
              },
          }
        : {}),
    textSizeMode: {
        type: ControlType.Enum,
        title: "Text Size",
        options: ["component", "custom"],
        optionTitles: ["Follow Component", "Custom"],
        defaultValue: "component",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        min: 10,
        max: 96,
        step: 1,
        displayStepper: true,
        defaultValue: 17,
        hidden: (props) => props.textSizeMode !== "custom",
    },
    fontWeight: {
        type: ControlType.Enum,
        title: "Weight",
        options: ["400", "500", "600", "700", "800"],
        optionTitles: ["Regular", "Medium", "Semibold", "Bold", "Extra Bold"],
        defaultValue: "600",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
    },
    themePreset: {
        type: ControlType.Enum,
        title: "Theme",
        options: [
            "custom",
            "chrome",
            "purple",
            "emerald",
            "sapphire",
            "rose",
            "gold",
        ],
        optionTitles: [
            "Custom",
            "Chrome",
            "Purple",
            "Emerald",
            "Sapphire",
            "Rose",
            "Gold",
        ],
        defaultValue: "chrome",
    },
    sizeMode: {
        type: ControlType.Enum,
        title: "Size Mode",
        options: ["frame", "fixed"],
        optionTitles: ["Fill Frame", "Fixed"],
        defaultValue: "frame",
    },
    customWidth: {
        type: ControlType.Number,
        title: "Width",
        min: 88,
        max: 1400,
        step: 1,
        defaultValue: 640,
        hidden: (props) => props.sizeMode !== "fixed",
    },
    customHeight: {
        type: ControlType.Number,
        title: "Height",
        min: 36,
        max: 320,
        step: 1,
        defaultValue: 172,
        hidden: (props) => props.sizeMode !== "fixed",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 999,
        step: 1,
        defaultValue: 999,
    },
    baseColor: {
        type: ControlType.Color,
        title: "Base",
        defaultValue: "#07090D",
        hidden: (props) =>
            !!props.themePreset && props.themePreset !== "custom",
    },
    metalColor: {
        type: ControlType.Color,
        title: "Metal Color",
        defaultValue: "#6E7F9D",
        hidden: (props) =>
            !!props.themePreset && props.themePreset !== "custom",
    },
    metalHighlightColor: {
        type: ControlType.Color,
        title: "Highlight",
        defaultValue: "#FFFFFF",
        hidden: (props) =>
            !!props.themePreset && props.themePreset !== "custom",
    },
    metalIntensity: {
        type: ControlType.Number,
        title: "Metal",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.78,
    },
    primaryGlowColor: {
        type: ControlType.Color,
        title: "Glow A",
        defaultValue: "#5CE7FF",
        hidden: (props) =>
            !!props.themePreset && props.themePreset !== "custom",
    },
    secondaryGlowColor: {
        type: ControlType.Color,
        title: "Glow B",
        defaultValue: "#9A6BFF",
        hidden: (props) =>
            !!props.themePreset && props.themePreset !== "custom",
    },
    accentGlowColor: {
        type: ControlType.Color,
        title: "Glow C",
        defaultValue: "#FFD36E",
        hidden: (props) =>
            !!props.themePreset && props.themePreset !== "custom",
    },
    motionStrength: {
        type: ControlType.Number,
        title: "Motion",
        min: 0,
        max: 1.5,
        step: 0.05,
        defaultValue: 1,
    },
    reflectionIntensity: {
        type: ControlType.Number,
        title: "Reflect Power",
        min: 0,
        max: 1.5,
        step: 0.05,
        defaultValue: 1,
    },
    enableOuterGlow: {
        type: ControlType.Boolean,
        title: "Outer Glow",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: false,
    },
    outerGlowIntensity: {
        type: ControlType.Number,
        title: "Glow Power",
        min: 0,
        max: 1.5,
        step: 0.05,
        defaultValue: 1,
        hidden: (props) => !props.enableOuterGlow,
    },
    enableSurfaceNoise: {
        type: ControlType.Boolean,
        title: "Noise",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    enableSurfaceReflections: {
        type: ControlType.Boolean,
        title: "Reflections",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    enableSpecularDrift: {
        type: ControlType.Boolean,
        title: "Specular",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    enableLiquidSweep: {
        type: ControlType.Boolean,
        title: "Liquid",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    enableShimmer: {
        type: ControlType.Boolean,
        title: "Shimmer",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    enableCursorHighlight: {
        type: ControlType.Boolean,
        title: "Cursor Light",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    enableGlassSheen: {
        type: ControlType.Boolean,
        title: "Glass Sheen",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    enableInnerGlow: {
        type: ControlType.Boolean,
        title: "Inner Glow",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    enableRimHighlight: {
        type: ControlType.Boolean,
        title: "Rim",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    enablePressRipple: {
        type: ControlType.Boolean,
        title: "Ripple",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Icon",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    iconType: {
        type: ControlType.Enum,
        title: "Icon Type",
        options: ["arrow", "sparkle", "bolt", "play"],
        optionTitles: ["Arrow", "Sparkle", "Bolt", "Play"],
        defaultValue: "arrow",
        hidden: (props) => !props.showIcon,
    },
    iconPosition: {
        type: ControlType.Enum,
        title: "Icon Side",
        options: ["right", "left"],
        optionTitles: ["Right", "Left"],
        defaultValue: "right",
        hidden: (props) => !props.showIcon && !props.loading,
    },
    loading: {
        type: ControlType.Boolean,
        title: "Loading",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: false,
    },
    loadingLabel: {
        type: ControlType.String,
        title: "Loading Text",
        defaultValue: "Loading",
        hidden: (props) => !props.loading,
    },
    enableParticles: {
        type: ControlType.Boolean,
        title: "Particles",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    enableMagneticTilt: {
        type: ControlType.Boolean,
        title: "Magnetic Tilt",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
    },
    href: {
        type: ControlType.Link,
        title: "Link",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: false,
        hidden: (props) => !props.href,
    },
})
