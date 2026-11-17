import * as React from "react"
import { useEffect, useRef, useState, useCallback, useMemo, useId } from "react"
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
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    animate,
    useReducedMotion,
    AnimationPlaybackControls,
} from "framer-motion"

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type ResponsiveImageValue =
    | string
    | {
          src?: string
          srcSet?: string
          alt?: string
      }

type ImageFitMode = "cover" | "contain"

export type EffectStyle =
    | "blur"
    | "wave"
    | "pixel"
    | "glitch"
    | "liquid"
    | "halftone"
    | "thermal"
    | "film"
    | "crt"
    | "duotone"

type CursorIconStyle = "plus" | "crosshair" | "dotRing"
type HalftoneColorMode = "monochrome" | "duotone"
type ThermalPaletteMode = "classic" | "cyberpunk" | "custom"
type FilmPresetMode = "neutral" | "warm" | "cool"

type EasingPreset =
    | "cinematic"
    | "expoOut"
    | "quartInOut"
    | "cubicOut"
    | "spring"

type RevealPhase = "closed" | "opening" | "open" | "closing"

export interface RevealFXProps {
    // 1. Image
    image?: ResponsiveImageValue
    imageAlt?: string
    imageFit: ImageFitMode
    imagePositionX: number
    imagePositionY: number

    // 2. Effect & Shared Treatment
    effectStyle: EffectStyle
    overlayDarkness: number
    vignette: boolean

    // 3A. Effect 01: Blur Reveal Settings
    blurIntensity: number
    grayscale: boolean
    enableTint: boolean
    tintColor: string
    tintIntensity: number

    // 3B. Effect 02: Gradient Wave Settings
    waveColor1: string
    waveColor2: string
    waveColor3: string
    waveIntensity: number
    waveSpeed: number
    waveAnimate: boolean

    // 3C. Effect 03: Pixel Distortion Settings
    pixelSize: number
    pixelDistortionIntensity: number
    pixelAnimate: boolean

    // 3D. Effect 04: RGB Glitch Settings
    glitchIntensity: number
    glitchColorSeparation: number
    glitchAnimate: boolean

    // 3E. Effect 05: Liquid Refraction Settings
    liquidRefractionIntensity: number
    liquidWaveScale: number
    liquidSpeed: number
    liquidGlossHighlight: boolean
    liquidAnimate: boolean

    // 3F. Effect 06: Halftone Print Settings
    halftoneDotSize: number
    halftoneContrast: number
    halftoneIntensity: number
    halftoneColorMode: HalftoneColorMode
    halftonePrimaryColor: string
    halftoneSecondaryColor: string

    // 3G. Effect 07: Thermal Vision Settings
    thermalIntensity: number
    thermalPalette: ThermalPaletteMode
    thermalShadowColor: string
    thermalMidtoneColor: string
    thermalHighlightColor: string
    thermalContrast: number
    thermalMappingIntensity: number

    // 3H. Effect 08: Analog Film Settings
    filmPreset: FilmPresetMode
    filmGrainIntensity: number
    filmGrainSize: number
    filmContrast: number
    filmTemperature: number
    filmVignetteIntensity: number
    filmAnimate: boolean

    // 3I. Effect 09: CRT Scanlines Settings
    crtScanlineDensity: number
    crtScanlineOpacity: number
    crtScanlineThickness: number
    crtContrast: number
    crtSignalDistortion: number
    crtAnimate: boolean

    // 3J. Effect 10: Duotone Poster Settings
    duotoneShadowColor: string
    duotoneHighlightColor: string
    duotoneContrast: number
    duotoneIntensity: number
    duotoneSaturation: number
    duotoneBackgroundBlend: boolean

    // 4. Reveal Strip
    revealWidth: number
    initialPosition: number
    followCursor: boolean
    edgeHighlight: boolean

    // 5. Custom Cursor
    enableCustomCursor: boolean
    cursorIcon: CursorIconStyle
    cursorSize: number
    cursorStrokeWidth: number
    cursorColor: string
    cursorBackground: boolean
    cursorBackgroundColor: string
    cursorBackgroundOpacity: number

    // Legacy prop aliases (for backward compatibility with v1 instances)
    showIcon?: boolean
    iconSize?: number
    iconStrokeWidth?: number
    iconColor?: string
    iconBackground?: boolean
    iconBackgroundColor?: string
    iconBackgroundOpacity?: number

    // 6. Animation
    revealDuration: number
    easingPreset: EasingPreset
    cursorSmoothing: number
    clickToReveal: boolean
    clickToReset: boolean

    // 7. Layout & Accessibility
    borderRadius: number
    ariaLabel: string
    style?: React.CSSProperties
}

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const EASING_MAP: Record<
    Exclude<EasingPreset, "spring">,
    [number, number, number, number]
> = {
    cinematic: [0.22, 1, 0.36, 1],
    expoOut: [0.16, 1, 0.3, 1],
    quartInOut: [0.76, 0, 0.24, 1],
    cubicOut: [0.33, 1, 0.68, 1],
}

const VIEWPORT_ROOT_MARGIN = "200px 0px"
const VIEWPORT_THRESHOLD = 0

/**
 * Self-contained inline SVG data URI used only when the user has not yet
 * uploaded an image in Framer, so the component previews its lighting,
 * effects, and split-reveal mechanics immediately without external URLs.
 */
const PLACEHOLDER_SVG_DATA_URI =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <defs>
    <radialGradient id="bg" cx="55%" cy="42%" r="65%">
      <stop offset="0%" stop-color="#2c2c2c"/>
      <stop offset="55%" stop-color="#141414"/>
      <stop offset="100%" stop-color="#050505"/>
    </radialGradient>
    <linearGradient id="rim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.92"/>
      <stop offset="38%" stop-color="#b8b8b8" stop-opacity="0.55"/>
      <stop offset="75%" stop-color="#222222" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#080808" stop-opacity="1"/>
    </linearGradient>
    <linearGradient id="torso" x1="25%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#1c1c1c"/>
      <stop offset="100%" stop-color="#040404"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#bg)"/>
  <g opacity="0.28">
    <ellipse cx="320" cy="400" rx="290" ry="360" fill="#2a2a2a"/>
    <ellipse cx="920" cy="370" rx="260" ry="340" fill="#242424"/>
  </g>
  <path d="M475 800 L475 560 C475 505 510 470 555 452 C530 430 518 390 518 340 C518 225 572 155 645 155 C695 155 726 192 734 242 C737 262 745 278 762 308 C772 325 768 336 750 342 C754 356 760 368 756 380 C752 390 740 394 745 405 C750 416 742 426 728 432 C726 452 715 468 688 472 C655 477 635 466 626 485 C618 505 640 538 695 566 C748 594 778 655 785 800 Z" fill="url(#rim)"/>
  <path d="M465 800 C472 620 535 525 655 538 C735 548 778 625 790 800 Z" fill="url(#torso)"/>
  <ellipse cx="704" cy="292" rx="11" ry="7" fill="#f5f5f5" opacity="0.85"/>
  <path d="M685 272 Q708 264 726 277" stroke="#111111" stroke-width="6" fill="none" stroke-linecap="round"/>
</svg>
`)

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
}

function resolveImage(image?: ResponsiveImageValue): {
    src: string
    srcSet?: string
    alt?: string
    isPlaceholder: boolean
} {
    if (!image) {
        return {
            src: PLACEHOLDER_SVG_DATA_URI,
            isPlaceholder: true,
        }
    }
    if (typeof image === "string") {
        const trimmed = image.trim()
        if (!trimmed) {
            return {
                src: PLACEHOLDER_SVG_DATA_URI,
                isPlaceholder: true,
            }
        }
        return { src: trimmed, isPlaceholder: false }
    }
    if (typeof image === "object" && image.src) {
        return {
            src: image.src,
            srcSet: image.srcSet,
            alt: image.alt,
            isPlaceholder: false,
        }
    }
    return {
        src: PLACEHOLDER_SVG_DATA_URI,
        isPlaceholder: true,
    }
}

function parseColorToRgb(
    color: string,
    fallback: [number, number, number] = [0, 0, 0]
): [number, number, number] {
    if (!color) return fallback
    const trimmed = color.trim()
    if (trimmed.startsWith("rgb")) {
        const nums = trimmed.match(/[\d.]+/g)
        if (nums && nums.length >= 3) {
            return [
                clamp(Math.round(Number(nums[0])), 0, 255),
                clamp(Math.round(Number(nums[1])), 0, 255),
                clamp(Math.round(Number(nums[2])), 0, 255),
            ]
        }
    }
    let hex = trimmed.replace(/^#/, "")
    if (hex.length === 3) {
        hex = hex
            .split("")
            .map((c) => c + c)
            .join("")
    }
    if (hex.length >= 6) {
        const r = parseInt(hex.slice(0, 2), 16)
        const g = parseInt(hex.slice(2, 4), 16)
        const b = parseInt(hex.slice(4, 6), 16)
        if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
            return [r, g, b]
        }
    }
    return fallback
}

function hexToRgba(color: string, alphaPercent: number): string {
    const alpha = clamp(alphaPercent / 100, 0, 1)
    const [r, g, b] = parseColorToRgb(color, [0, 0, 0])
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function mixRgb(
    c1: [number, number, number],
    c2: [number, number, number],
    t: number
): [number, number, number] {
    const clampedT = clamp(t, 0, 1)
    return [
        Math.round(c1[0] + (c2[0] - c1[0]) * clampedT),
        Math.round(c1[1] + (c2[1] - c1[1]) * clampedT),
        Math.round(c1[2] + (c2[2] - c1[2]) * clampedT),
    ]
}

function buildRgbTableStrings(stops: Array<[number, number, number]>): {
    r: string
    g: string
    b: string
} {
    const r = stops.map((s) => (s[0] / 255).toFixed(4)).join(" ")
    const g = stops.map((s) => (s[1] / 255).toFixed(4)).join(" ")
    const b = stops.map((s) => (s[2] / 255).toFixed(4)).join(" ")
    return { r, g, b }
}

/**
 * Computes destination draw rectangle so a Canvas matches CSS object-fit
 * (`cover` or `contain`) and `object-position` (`X% Y%`) identically.
 */
function computeObjectFitRect(
    containerWidth: number,
    containerHeight: number,
    naturalWidth: number,
    naturalHeight: number,
    fit: ImageFitMode,
    posXPercent: number,
    posYPercent: number
): { dx: number; dy: number; dw: number; dh: number } {
    if (naturalWidth <= 0 || naturalHeight <= 0) {
        return { dx: 0, dy: 0, dw: containerWidth, dh: containerHeight }
    }
    const containerRatio = containerWidth / containerHeight
    const imageRatio = naturalWidth / naturalHeight

    let dw = containerWidth
    let dh = containerHeight

    if (fit === "cover") {
        if (containerRatio > imageRatio) {
            dw = containerWidth
            dh = containerWidth / imageRatio
        } else {
            dh = containerHeight
            dw = containerHeight * imageRatio
        }
    } else {
        if (containerRatio > imageRatio) {
            dh = containerHeight
            dw = containerHeight * imageRatio
        } else {
            dw = containerWidth
            dh = containerWidth / imageRatio
        }
    }

    const dx = (containerWidth - dw) * (clamp(posXPercent, 0, 100) / 100)
    const dy = (containerHeight - dh) * (clamp(posYPercent, 0, 100) / 100)

    return { dx, dy, dw, dh }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 640
 */
export default function RevealFX(props: RevealFXProps) {
    const {
        // 1. Image
        image,
        imageAlt = "Interactive reveal image",
        imageFit = "cover",
        imagePositionX = 50,
        imagePositionY = 50,

        // 2. Effect & Shared Treatment
        effectStyle = "blur",
        overlayDarkness = 45,
        vignette = true,

        // 3A. Blur Reveal Settings
        blurIntensity = 14,
        grayscale = false,
        enableTint = false,
        tintColor = "#1a2436",
        tintIntensity = 25,

        // 3B. Gradient Wave Settings
        waveColor1 = "#6366f1",
        waveColor2 = "#ec4899",
        waveColor3 = "#06b6d4",
        waveIntensity = 55,
        waveSpeed = 50,
        waveAnimate = true,

        // 3C. Pixel Distortion Settings
        pixelSize = 18,
        pixelDistortionIntensity = 40,
        pixelAnimate = true,

        // 3D. RGB Glitch Settings
        glitchIntensity = 50,
        glitchColorSeparation = 12,
        glitchAnimate = true,

        // 3E. Liquid Refraction Settings
        liquidRefractionIntensity = 50,
        liquidWaveScale = 50,
        liquidSpeed = 45,
        liquidGlossHighlight = true,
        liquidAnimate = true,

        // 3F. Halftone Print Settings
        halftoneDotSize = 10,
        halftoneContrast = 60,
        halftoneIntensity = 92,
        halftoneColorMode = "monochrome",
        halftonePrimaryColor = "#111111",
        halftoneSecondaryColor = "#f4efe6",

        // 3G. Thermal Vision Settings
        thermalIntensity = 95,
        thermalPalette = "classic",
        thermalShadowColor = "#0a1142",
        thermalMidtoneColor = "#c91878",
        thermalHighlightColor = "#ffbe0b",
        thermalContrast = 55,
        thermalMappingIntensity = 92,

        // 3H. Analog Film Settings
        filmPreset = "warm",
        filmGrainIntensity = 45,
        filmGrainSize = 35,
        filmContrast = 55,
        filmTemperature = 20,
        filmVignetteIntensity = 55,
        filmAnimate = true,

        // 3I. CRT Scanlines Settings
        crtScanlineDensity = 55,
        crtScanlineOpacity = 65,
        crtScanlineThickness = 50,
        crtContrast = 60,
        crtSignalDistortion = 25,
        crtAnimate = true,

        // 3J. Duotone Poster Settings
        duotoneShadowColor = "#0b133b",
        duotoneHighlightColor = "#ff5500",
        duotoneContrast = 60,
        duotoneIntensity = 95,
        duotoneSaturation = 100,
        duotoneBackgroundBlend = false,

        // 4. Reveal Strip
        revealWidth = 10,
        initialPosition = 50,
        followCursor = true,
        edgeHighlight = true,

        // 5. Custom Cursor (with backward-compatible fallbacks)
        enableCustomCursor,
        cursorIcon = "plus",
        cursorSize,
        cursorStrokeWidth,
        cursorColor,
        cursorBackground,
        cursorBackgroundColor,
        cursorBackgroundOpacity,

        showIcon,
        iconSize,
        iconStrokeWidth,
        iconColor,
        iconBackground,
        iconBackgroundColor,
        iconBackgroundOpacity,

        // 6. Animation
        revealDuration = 0.9,
        easingPreset = "cinematic",
        cursorSmoothing = 65,
        clickToReveal = true,
        clickToReset = true,

        // 7. Layout & Accessibility
        borderRadius = 0,
        ariaLabel = "Interactive image reveal",
        style,
    } = props

    // ========================================================================
    // 0. STATIC RENDERING & VIEWPORT VISIBILITY GATING
    // ========================================================================
    const isStaticRenderer = useIsStaticRenderer()
    const isCanvasRenderTarget = RenderTarget.current() === RenderTarget.canvas
    const isStaticMode = Boolean(isStaticRenderer || isCanvasRenderTarget)
    const shouldReduceMotion = useReducedMotion()

    const containerRef = useRef<HTMLDivElement | null>(null)
    const [isNearViewport, setIsNearViewport] = useState<boolean>(
        () => !isStaticMode
    )

    // Observe container proximity to the viewport using IntersectionObserver
    useEffect(() => {
        if (isStaticMode) {
            setIsNearViewport(false)
            return
        }

        const el = containerRef.current
        if (!el) return

        if (typeof IntersectionObserver === "undefined") {
            setIsNearViewport(true)
            return
        }

        let isMounted = true
        const observer = new IntersectionObserver(
            (entries) => {
                if (!isMounted) return
                for (const entry of entries) {
                    const visible =
                        entry.isIntersecting || entry.intersectionRatio > 0
                    setIsNearViewport(visible)
                }
            },
            {
                root: null,
                rootMargin: VIEWPORT_ROOT_MARGIN,
                threshold: VIEWPORT_THRESHOLD,
            }
        )

        observer.observe(el)

        return () => {
            isMounted = false
            observer.disconnect()
        }
    }, [isStaticMode])

    // Master animation gate: false in Framer Canvas/export, offscreen, or reduced-motion
    const isAnimationEnabled =
        !isStaticMode && isNearViewport && !shouldReduceMotion

    // Resolve Custom Cursor settings (preserving compatibility if v1 props were used)
    const resolvedEnableCustomCursor =
        enableCustomCursor !== undefined
            ? enableCustomCursor
            : showIcon !== undefined
              ? showIcon
              : true
    const resolvedCursorSize = clamp(cursorSize ?? iconSize ?? 20, 8, 64)
    const resolvedCursorStroke = clamp(
        cursorStrokeWidth ?? iconStrokeWidth ?? 1.5,
        0.75,
        4
    )
    const resolvedCursorColor = cursorColor ?? iconColor ?? "#FFFFFF"
    const resolvedCursorBg =
        cursorBackground !== undefined
            ? cursorBackground
            : iconBackground !== undefined
              ? iconBackground
              : false
    const resolvedCursorBgColor =
        cursorBackgroundColor ?? iconBackgroundColor ?? "#000000"
    const resolvedCursorBgOpacity = clamp(
        cursorBackgroundOpacity ?? iconBackgroundOpacity ?? 40,
        0,
        100
    )

    // Unique SVG filter IDs so multiple RevealFX instances never collide
    const rawId = useId()
    const filterUid = useMemo(
        () => rawId.replace(/[^a-zA-Z0-9_-]/g, ""),
        [rawId]
    )
    const waveFilterId = `reveal-wave-${filterUid}`
    const redChannelFilterId = `reveal-red-${filterUid}`
    const cyanChannelFilterId = `reveal-cyan-${filterUid}`
    const pixelFallbackFilterId = `reveal-px-${filterUid}`
    const liquidFilterId = `reveal-liquid-${filterUid}`
    const thermalFilterId = `reveal-thermal-${filterUid}`
    const filmToneFilterId = `reveal-film-tone-${filterUid}`
    const filmGrainFilterId = `reveal-film-grain-${filterUid}`
    const crtSignalFilterId = `reveal-crt-signal-${filterUid}`
    const duotoneFilterId = `reveal-duotone-${filterUid}`

    // Refs
    const activeAnimRef = useRef<AnimationPlaybackControls | null>(null)
    const phaseRef = useRef<RevealPhase>("closed")
    const isPointerInsideRef = useRef<boolean>(false)
    const isTouchPointerRef = useRef<boolean>(false)
    const lastPointerClientRef = useRef<{ x: number; y: number } | null>(null)

    // Canvas Refs for Pixel Distortion & Halftone Print
    const leftEffectCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const rightEffectCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const loadedImageElementRef = useRef<HTMLImageElement | null>(null)

    // Component State
    const [phase, setPhase] = useState<RevealPhase>("closed")
    const [isPointerHovered, setIsPointerHovered] = useState<boolean>(false)
    const [isFocusVisible, setIsFocusVisible] = useState<boolean>(false)
    const [containerSize, setContainerSize] = useState<{
        width: number
        height: number
    }>({ width: 960, height: 640 })
    const [canvasImageReady, setCanvasImageReady] = useState<boolean>(false)
    const [halftoneUsesFallback, setHalftoneUsesFallback] =
        useState<boolean>(false)
    const [glitchTick, setGlitchTick] = useState<number>(0)
    const [filmGrainTick, setFilmGrainTick] = useState<number>(0)

    // Effect animations only run when allowed by static/viewport gate AND overlay panels are not fully open
    const isEffectAnimationActive = isAnimationEnabled && phase !== "open"

    // Clamp reveal width & safe bounds so the vertical strip never escapes the frame
    const safeRevealWidth = clamp(revealWidth, 3, 30)
    const halfStrip = safeRevealWidth / 2
    const minCenter = halfStrip
    const maxCenter = 100 - halfStrip
    const safeInitialCenter = clamp(initialPosition, minCenter, maxCenter)

    // ========================================================================
    // 1. REVEAL STRIP HORIZONTAL MOTION VALUES (Percentage 0..100%)
    // ========================================================================
    const targetX = useMotionValue<number>(safeInitialCenter)

    const stripSpringConfig = useMemo(() => {
        if (!isAnimationEnabled || cursorSmoothing <= 2) {
            return { stiffness: 1000, damping: 90, mass: 0.1 }
        }
        const normalized = clamp(cursorSmoothing, 0, 100) / 100
        const stiffness = Math.round(420 - normalized * 310)
        const damping = Math.round(38 - normalized * 16)
        const mass = Number((0.25 + normalized * 0.55).toFixed(2))
        return { stiffness, damping, mass }
    }, [cursorSmoothing, isAnimationEnabled])

    const smoothX = useSpring(targetX, stripSpringConfig)

    // openProgress: 0 = preview state with reveal strip, 1 = 100% revealed
    const openProgress = useMotionValue<number>(0)

    // ========================================================================
    // 2. CUSTOM CURSOR 2D MOTION VALUES (Pixels X and Y inside container)
    // ========================================================================
    const cursorTargetX = useMotionValue<number>(containerSize.width / 2)
    const cursorTargetY = useMotionValue<number>(containerSize.height / 2)

    const cursorSpringConfig = useMemo(() => {
        if (!isAnimationEnabled) {
            return { stiffness: 1200, damping: 100, mass: 0.05 }
        }
        return { stiffness: 780, damping: 44, mass: 0.14 }
    }, [isAnimationEnabled])

    const cursorSmoothX = useSpring(cursorTargetX, cursorSpringConfig)
    const cursorSmoothY = useSpring(cursorTargetY, cursorSpringConfig)
    const cursorPresence = useMotionValue<number>(0)

    const shouldShowCustomCursor =
        !isStaticMode &&
        isNearViewport &&
        resolvedEnableCustomCursor &&
        isPointerHovered &&
        phase === "closed" &&
        !isTouchPointerRef.current

    useEffect(() => {
        const target = shouldShowCustomCursor ? 1 : 0
        if (!isAnimationEnabled || cursorPresence.get() === target) {
            cursorPresence.jump(target)
            return
        }
        const controls = animate(cursorPresence, target, {
            duration: 0.18,
            ease: [0.22, 1, 0.36, 1],
        })
        return () => controls.stop()
    }, [shouldShowCustomCursor, isAnimationEnabled, cursorPresence])

    // Settle all active spring physics immediately when offscreen or in static rendering
    useEffect(() => {
        if (!isAnimationEnabled) {
            smoothX.jump(targetX.get())
            cursorSmoothX.jump(cursorTargetX.get())
            cursorSmoothY.jump(cursorTargetY.get())
            if (!shouldShowCustomCursor) {
                cursorPresence.jump(0)
            }
        }
    }, [
        isAnimationEnabled,
        shouldShowCustomCursor,
        smoothX,
        targetX,
        cursorSmoothX,
        cursorTargetX,
        cursorSmoothY,
        cursorTargetY,
        cursorPresence,
    ])

    const cursorCombinedOpacity = useTransform(
        [cursorPresence, openProgress],
        ([presenceVal, openVal]: number[]) => {
            const revealFade = clamp(1 - openVal * 2.8, 0, 1)
            return presenceVal * revealFade
        }
    )

    const cursorCombinedScale = useTransform(
        [cursorPresence, openProgress],
        ([presenceVal, openVal]: number[]) => {
            const baseScale = 0.75 + 0.25 * presenceVal
            const openShrink = 1 - openVal * 0.25
            return baseScale * openShrink
        }
    )

    const updatePhase = useCallback((next: RevealPhase) => {
        phaseRef.current = next
        setPhase(next)
    }, [])

    // Measure container dimensions cleanly on mount & resize
    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const updateSize = () => {
            const rect = el.getBoundingClientRect()
            if (rect.width > 0 && rect.height > 0) {
                const nextW = Math.round(rect.width)
                const nextH = Math.round(rect.height)
                setContainerSize((prev) =>
                    prev.width === nextW && prev.height === nextH
                        ? prev
                        : { width: nextW, height: nextH }
                )
            }
        }

        updateSize()

        if (typeof ResizeObserver !== "undefined") {
            const observer = new ResizeObserver(() => {
                updateSize()
            })
            observer.observe(el)
            return () => observer.disconnect()
        } else if (typeof window !== "undefined") {
            window.addEventListener("resize", updateSize)
            return () => window.removeEventListener("resize", updateSize)
        }
    }, [])

    // Sync strip position when initialPosition or revealWidth changes in Framer Canvas
    useEffect(() => {
        if (!isPointerInsideRef.current && phaseRef.current === "closed") {
            targetX.set(safeInitialCenter)
            if (!isAnimationEnabled || cursorSmoothing <= 2) {
                smoothX.jump(safeInitialCenter)
            }
        } else {
            const currentClamped = clamp(targetX.get(), minCenter, maxCenter)
            targetX.set(currentClamped)
            if (!isAnimationEnabled) {
                smoothX.jump(currentClamped)
            }
        }
    }, [
        safeInitialCenter,
        minCenter,
        maxCenter,
        isAnimationEnabled,
        cursorSmoothing,
        targetX,
        smoothX,
    ])

    // Cleanup active split animation on unmount
    useEffect(() => {
        return () => {
            if (activeAnimRef.current) {
                activeAnimRef.current.stop()
                activeAnimRef.current = null
            }
        }
    }, [])

    // Reset if clickToReveal is turned off in Canvas while open
    useEffect(() => {
        if (!clickToReveal && phaseRef.current !== "closed") {
            if (activeAnimRef.current) {
                activeAnimRef.current.stop()
                activeAnimRef.current = null
            }
            openProgress.jump(0)
            updatePhase("closed")
        }
    }, [clickToReveal, openProgress, updatePhase])

    // ========================================================================
    // 3. SPLIT PANEL CLIP-PATHS & EDGE HIGHLIGHTS
    // ========================================================================
    const leftPanelClipPath = useTransform(
        [smoothX, openProgress],
        ([centerVal, progressVal]: number[]) => {
            const center = clamp(centerVal, minCenter, maxCenter)
            const stripLeft = Math.max(0, center - halfStrip)
            const currentLeftEdge = stripLeft * (1 - progressVal)
            const rightInset = clamp(100 - currentLeftEdge, 0, 100)
            return `inset(0% ${rightInset.toFixed(3)}% 0% 0%)`
        }
    )

    const rightPanelClipPath = useTransform(
        [smoothX, openProgress],
        ([centerVal, progressVal]: number[]) => {
            const center = clamp(centerVal, minCenter, maxCenter)
            const stripRight = Math.min(100, center + halfStrip)
            const currentRightEdge =
                stripRight + (100 - stripRight) * progressVal
            const leftInset = clamp(currentRightEdge, 0, 100)
            return `inset(0% 0% 0% ${leftInset.toFixed(3)}%)`
        }
    )

    const leftEdgeLineX = useTransform(
        [smoothX, openProgress],
        ([centerVal, progressVal]: number[]) => {
            const center = clamp(centerVal, minCenter, maxCenter)
            const stripLeft = Math.max(0, center - halfStrip)
            const currentLeftEdge = stripLeft * (1 - progressVal)
            return `${currentLeftEdge.toFixed(3)}%`
        }
    )

    const rightEdgeLineX = useTransform(
        [smoothX, openProgress],
        ([centerVal, progressVal]: number[]) => {
            const center = clamp(centerVal, minCenter, maxCenter)
            const stripRight = Math.min(100, center + halfStrip)
            const currentRightEdge =
                stripRight + (100 - stripRight) * progressVal
            return `${currentRightEdge.toFixed(3)}%`
        }
    )

    const edgeLineOpacity = useTransform(
        openProgress,
        [0, 0.85, 1],
        [1, 0.35, 0]
    )

    // Static fallback clip-paths and line positions used when isStaticMode is true
    const staticStripLeftPercent = Math.max(0, safeInitialCenter - halfStrip)
    const staticStripRightPercent = Math.min(100, safeInitialCenter + halfStrip)
    const staticLeftClipPath = `inset(0% ${(
        100 - staticStripLeftPercent
    ).toFixed(3)}% 0% 0%)`
    const staticRightClipPath = `inset(0% 0% 0% ${staticStripRightPercent.toFixed(
        3
    )}%)`

    // ========================================================================
    // 4. POINTER TRACKING (2D Custom Cursor + 1D Horizontal Strip)
    // ========================================================================
    const updatePointerCoordinates = useCallback(
        (clientX: number, clientY: number, jumpCursor: boolean = false) => {
            if (isStaticMode) return
            const el = containerRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            if (rect.width <= 0 || rect.height <= 0) return

            lastPointerClientRef.current = { x: clientX, y: clientY }

            // 1. Update 2D Custom Cursor (exact pixel coordinates inside container)
            const localX = clamp(clientX - rect.left, 0, rect.width)
            const localY = clamp(clientY - rect.top, 0, rect.height)
            cursorTargetX.set(localX)
            cursorTargetY.set(localY)

            if (jumpCursor || !isAnimationEnabled) {
                cursorSmoothX.jump(localX)
                cursorSmoothY.jump(localY)
            }

            // 2. Update 1D Vertical Reveal Strip (horizontal percentage)
            if (followCursor && phaseRef.current === "closed") {
                const rawPercent = ((clientX - rect.left) / rect.width) * 100
                const clampedPercent = clamp(rawPercent, minCenter, maxCenter)
                targetX.set(clampedPercent)
                if (!isAnimationEnabled || cursorSmoothing <= 2) {
                    smoothX.jump(clampedPercent)
                }
            }
        },
        [
            isStaticMode,
            cursorTargetX,
            cursorTargetY,
            cursorSmoothX,
            cursorSmoothY,
            followCursor,
            minCenter,
            maxCenter,
            targetX,
            smoothX,
            isAnimationEnabled,
            cursorSmoothing,
        ]
    )

    const handlePointerEnter = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (isStaticMode) return
            if (e.pointerType === "touch") {
                isTouchPointerRef.current = true
                setIsPointerHovered(false)
                return
            }
            isTouchPointerRef.current = false
            isPointerInsideRef.current = true
            setIsPointerHovered(true)

            updatePointerCoordinates(e.clientX, e.clientY, true)
        },
        [isStaticMode, updatePointerCoordinates]
    )

    const handlePointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (isStaticMode) return
            if (e.pointerType === "touch") {
                isTouchPointerRef.current = true
                return
            }
            isTouchPointerRef.current = false
            const wasInside = isPointerInsideRef.current
            isPointerInsideRef.current = true
            if (!isPointerHovered) {
                setIsPointerHovered(true)
            }

            updatePointerCoordinates(e.clientX, e.clientY, !wasInside)
        },
        [isStaticMode, isPointerHovered, updatePointerCoordinates]
    )

    const handlePointerLeave = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (isStaticMode) return
            if (e.pointerType === "touch") return
            isPointerInsideRef.current = false
            setIsPointerHovered(false)

            if (phaseRef.current !== "closed") return

            targetX.set(safeInitialCenter)
            if (!isAnimationEnabled || cursorSmoothing <= 2) {
                smoothX.jump(safeInitialCenter)
            }
        },
        [
            isStaticMode,
            safeInitialCenter,
            targetX,
            smoothX,
            isAnimationEnabled,
            cursorSmoothing,
        ]
    )

    // ========================================================================
    // 5. CLICK / TAP SPLIT-PANEL REVEAL & RESET
    // ========================================================================
    const triggerSplitTransition = useCallback(
        (direction: "open" | "close", restorePositionPercent?: number) => {
            if (isStaticMode) return

            if (activeAnimRef.current) {
                activeAnimRef.current.stop()
                activeAnimRef.current = null
            }

            if (direction === "open") {
                const currentCenter = clamp(smoothX.get(), minCenter, maxCenter)
                targetX.set(currentCenter)
                smoothX.jump(currentCenter)
                updatePhase("opening")
            } else {
                const nextCenter =
                    typeof restorePositionPercent === "number"
                        ? clamp(restorePositionPercent, minCenter, maxCenter)
                        : safeInitialCenter
                targetX.set(nextCenter)
                smoothX.jump(nextCenter)
                updatePhase("closing")
            }

            const targetProgress = direction === "open" ? 1 : 0

            if (!isNearViewport) {
                openProgress.jump(targetProgress)
                updatePhase(direction === "open" ? "open" : "closed")
                return
            }

            const duration = shouldReduceMotion
                ? 0.2
                : clamp(revealDuration, 0.15, 5)

            const transitionConfig =
                easingPreset === "spring" && !shouldReduceMotion
                    ? {
                          type: "spring" as const,
                          duration,
                          bounce: 0.08,
                      }
                    : {
                          type: "tween" as const,
                          duration,
                          ease: shouldReduceMotion
                              ? ("easeOut" as const)
                              : EASING_MAP[
                                    easingPreset === "spring"
                                        ? "cinematic"
                                        : easingPreset
                                ],
                      }

            activeAnimRef.current = animate(openProgress, targetProgress, {
                ...transitionConfig,
                onComplete: () => {
                    activeAnimRef.current = null
                    if (direction === "open") {
                        updatePhase("open")
                    } else {
                        updatePhase("closed")
                        if (
                            isPointerInsideRef.current &&
                            !isTouchPointerRef.current &&
                            lastPointerClientRef.current
                        ) {
                            updatePointerCoordinates(
                                lastPointerClientRef.current.x,
                                lastPointerClientRef.current.y,
                                true
                            )
                        } else if (!isPointerInsideRef.current) {
                            targetX.set(safeInitialCenter)
                        }
                    }
                },
            })
        },
        [
            isStaticMode,
            isNearViewport,
            smoothX,
            targetX,
            openProgress,
            minCenter,
            maxCenter,
            safeInitialCenter,
            shouldReduceMotion,
            revealDuration,
            easingPreset,
            updatePhase,
            updatePointerCoordinates,
        ]
    )

    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (isStaticMode || !clickToReveal) return

            if (
                phaseRef.current === "opening" ||
                phaseRef.current === "closing"
            ) {
                return
            }

            if (phaseRef.current === "closed") {
                triggerSplitTransition("open")
            } else if (phaseRef.current === "open" && clickToReset) {
                const el = containerRef.current
                const isMouseClick =
                    e.detail > 0 &&
                    isPointerInsideRef.current &&
                    !isTouchPointerRef.current
                let restoreCenter = safeInitialCenter
                if (isMouseClick && followCursor && el) {
                    const rect = el.getBoundingClientRect()
                    if (rect.width > 0) {
                        const rawPercent =
                            ((e.clientX - rect.left) / rect.width) * 100
                        restoreCenter = clamp(rawPercent, minCenter, maxCenter)
                    }
                }
                triggerSplitTransition("close", restoreCenter)
            }
        },
        [
            isStaticMode,
            clickToReveal,
            clickToReset,
            followCursor,
            safeInitialCenter,
            minCenter,
            maxCenter,
            triggerSplitTransition,
        ]
    )

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (isStaticMode || !clickToReveal) return
            if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
                e.preventDefault()
                if (
                    phaseRef.current === "opening" ||
                    phaseRef.current === "closing"
                ) {
                    return
                }
                if (phaseRef.current === "closed") {
                    triggerSplitTransition("open")
                } else if (phaseRef.current === "open" && clickToReset) {
                    triggerSplitTransition("close", safeInitialCenter)
                }
            }
        },
        [
            isStaticMode,
            clickToReveal,
            clickToReset,
            safeInitialCenter,
            triggerSplitTransition,
        ]
    )

    // ========================================================================
    // 6. IMAGE & EFFECT ENGINES (STATIC & VIEWPORT-AWARE)
    // ========================================================================
    const resolvedImage = useMemo(() => resolveImage(image), [image])
    const effectiveAlt = resolvedImage.alt || imageAlt || ariaLabel
    const objectPosition = `${clamp(imagePositionX, 0, 100)}% ${clamp(
        imagePositionY,
        0,
        100
    )}%`

    // --- SHARED CANVAS IMAGE LOADER (FOR PIXEL DISTORTION & HALFTONE PRINT) ---
    useEffect(() => {
        if (effectStyle !== "pixel" && effectStyle !== "halftone") return

        let isCancelled = false
        setCanvasImageReady(false)
        setHalftoneUsesFallback(false)

        const loadWithCors = (useAnonymousCors: boolean) => {
            const img = new Image()
            img.decoding = "async"
            if (useAnonymousCors && !resolvedImage.src.startsWith("data:")) {
                img.crossOrigin = "anonymous"
            }
            img.onload = () => {
                if (isCancelled) return
                loadedImageElementRef.current = img
                setCanvasImageReady(true)
            }
            img.onerror = () => {
                if (isCancelled) return
                if (useAnonymousCors) {
                    loadWithCors(false)
                } else {
                    loadedImageElementRef.current = null
                    setCanvasImageReady(false)
                    if (effectStyle === "halftone") {
                        setHalftoneUsesFallback(true)
                    }
                }
            }
            img.src = resolvedImage.src
        }

        loadWithCors(true)

        return () => {
            isCancelled = true
        }
    }, [effectStyle, resolvedImage.src])

    // --- EFFECT 03: PIXEL DISTORTION CANVAS ENGINE ---
    const isPixelAnimating =
        isEffectAnimationActive &&
        effectStyle === "pixel" &&
        pixelAnimate &&
        pixelDistortionIntensity > 0 &&
        canvasImageReady

    useEffect(() => {
        if (effectStyle !== "pixel" || !canvasImageReady) return
        const img = loadedImageElementRef.current
        if (!img) return

        let isActive = true
        let rafId: number | null = null
        let lastFrameTime = 0

        if (!offscreenCanvasRef.current) {
            offscreenCanvasRef.current = document.createElement("canvas")
        }
        const offCanvas = offscreenCanvasRef.current

        const renderPixelFrame = (phaseSeed: number) => {
            if (!isActive) return
            const w = Math.max(1, containerSize.width)
            const h = Math.max(1, containerSize.height)
            const block = clamp(pixelSize, 4, 60)

            const cols = Math.max(6, Math.round(w / block))
            const rows = Math.max(6, Math.round(h / block))

            if (offCanvas.width !== cols || offCanvas.height !== rows) {
                offCanvas.width = cols
                offCanvas.height = rows
            }

            const offCtx = offCanvas.getContext("2d")
            if (!offCtx) return

            offCtx.clearRect(0, 0, cols, rows)
            offCtx.imageSmoothingEnabled = false

            const fitRect = computeObjectFitRect(
                cols,
                rows,
                img.naturalWidth || 1200,
                img.naturalHeight || 800,
                imageFit,
                imagePositionX,
                imagePositionY
            )

            try {
                offCtx.drawImage(
                    img,
                    fitRect.dx,
                    fitRect.dy,
                    fitRect.dw,
                    fitRect.dh
                )
            } catch {
                return
            }

            const drawToTargetCanvas = (
                targetCanvas: HTMLCanvasElement | null
            ) => {
                if (!targetCanvas) return
                if (targetCanvas.width !== w || targetCanvas.height !== h) {
                    targetCanvas.width = w
                    targetCanvas.height = h
                }
                const ctx = targetCanvas.getContext("2d")
                if (!ctx) return

                ctx.clearRect(0, 0, w, h)
                ctx.imageSmoothingEnabled = false

                // 1. Draw base pixelated mosaic
                ctx.drawImage(offCanvas, 0, 0, cols, rows, 0, 0, w, h)

                // 2. Apply horizontal pixel-row displacement slices
                const distNorm = clamp(pixelDistortionIntensity, 0, 100) / 100
                if (distNorm > 0.01) {
                    const sliceCount = Math.max(
                        3,
                        Math.round(4 + distNorm * 10)
                    )

                    for (let i = 0; i < sliceCount; i++) {
                        const hash =
                            Math.sin((i + 1) * 12.9898 + phaseSeed * 78.233) *
                            43758.5453
                        const frac = hash - Math.floor(hash)

                        const hash2 =
                            Math.cos((i + 3) * 45.164 + phaseSeed * 19.19) *
                            19432.21
                        const frac2 = hash2 - Math.floor(hash2)

                        const rowStart = Math.floor(frac * (rows - 2))
                        const rowSpan = Math.max(
                            1,
                            Math.min(rows - rowStart, Math.ceil(1 + frac2 * 3))
                        )

                        const maxBlockShift = Math.max(
                            1,
                            Math.round(distNorm * 6)
                        )
                        const signedBlocks = Math.round(
                            (frac2 - 0.5) * 2 * maxBlockShift
                        )
                        const shiftPx = signedBlocks * (w / cols)

                        const sy = rowStart
                        const sh = rowSpan
                        const dy = (rowStart / rows) * h
                        const dh = (rowSpan / rows) * h

                        ctx.drawImage(
                            offCanvas,
                            0,
                            sy,
                            cols,
                            sh,
                            shiftPx,
                            dy,
                            w,
                            dh
                        )
                    }
                }
            }

            drawToTargetCanvas(leftEffectCanvasRef.current)
            drawToTargetCanvas(rightEffectCanvasRef.current)
        }

        // Always draw 1 deterministic static frame immediately (works in Canvas/Export & offscreen)
        renderPixelFrame(1)

        // Only run requestAnimationFrame loop when not static, near viewport, and animation enabled
        if (isPixelAnimating && !isStaticMode) {
            const loop = (now: number) => {
                if (!isActive || isStaticMode) return
                if (now - lastFrameTime >= 120) {
                    lastFrameTime = now
                    const seed = Math.floor(now / 140)
                    renderPixelFrame(seed)
                }
                if (isActive && !isStaticMode) {
                    rafId = requestAnimationFrame(loop)
                }
            }
            rafId = requestAnimationFrame(loop)
        }

        return () => {
            isActive = false
            if (rafId !== null) {
                cancelAnimationFrame(rafId)
                rafId = null
            }
        }
    }, [
        effectStyle,
        canvasImageReady,
        containerSize.width,
        containerSize.height,
        pixelSize,
        pixelDistortionIntensity,
        isPixelAnimating,
        isStaticMode,
        imageFit,
        imagePositionX,
        imagePositionY,
    ])

    // --- EFFECT 06: HALFTONE PRINT CANVAS ENGINE (STATIC SINGLE-FRAME RENDER) ---
    useEffect(() => {
        if (effectStyle !== "halftone" || !canvasImageReady) return
        const img = loadedImageElementRef.current
        if (!img) return

        const w = Math.max(1, containerSize.width)
        const h = Math.max(1, containerSize.height)
        const cellSize = clamp(halftoneDotSize, 4, 32)

        const cols = Math.max(8, Math.ceil(w / cellSize) + 1)
        const rows = Math.max(8, Math.ceil(h / cellSize) + 1)

        if (!offscreenCanvasRef.current) {
            offscreenCanvasRef.current = document.createElement("canvas")
        }
        const offCanvas = offscreenCanvasRef.current
        offCanvas.width = cols
        offCanvas.height = rows

        const offCtx = offCanvas.getContext("2d", {
            willReadFrequently: true,
        })
        if (!offCtx) return

        offCtx.clearRect(0, 0, cols, rows)

        const fitRect = computeObjectFitRect(
            cols,
            rows,
            img.naturalWidth || 1200,
            img.naturalHeight || 800,
            imageFit,
            imagePositionX,
            imagePositionY
        )

        let pixelData: Uint8ClampedArray | null = null
        try {
            offCtx.drawImage(
                img,
                fitRect.dx,
                fitRect.dy,
                fitRect.dw,
                fitRect.dh
            )
            pixelData = offCtx.getImageData(0, 0, cols, rows).data
        } catch {
            setHalftoneUsesFallback(true)
            return
        }

        setHalftoneUsesFallback(false)

        const inkColor = halftonePrimaryColor || "#111111"
        const paperColor =
            halftoneColorMode === "duotone"
                ? halftoneSecondaryColor || "#f4efe6"
                : "#f2efe9"

        const contrastSlope =
            0.55 + (clamp(halftoneContrast, 0, 100) / 100) * 1.95
        const maxDotRadius = cellSize * 0.64

        const drawHalftoneToCanvas = (
            targetCanvas: HTMLCanvasElement | null
        ) => {
            if (!targetCanvas || !pixelData) return
            if (targetCanvas.width !== w || targetCanvas.height !== h) {
                targetCanvas.width = w
                targetCanvas.height = h
            }
            const ctx = targetCanvas.getContext("2d")
            if (!ctx) return

            ctx.clearRect(0, 0, w, h)
            ctx.fillStyle = paperColor
            ctx.fillRect(0, 0, w, h)

            ctx.fillStyle = inkColor
            ctx.beginPath()

            for (let r = 0; r < rows; r++) {
                const rowOffsetX = r % 2 === 1 ? cellSize * 0.5 : 0
                const cy = r * cellSize + cellSize * 0.5

                for (let c = 0; c < cols; c++) {
                    const idx = (r * cols + c) * 4
                    const red = pixelData[idx]
                    const green = pixelData[idx + 1]
                    const blue = pixelData[idx + 2]
                    const alpha = pixelData[idx + 3] / 255

                    const lum =
                        (0.299 * red + 0.587 * green + 0.114 * blue) / 255
                    const contrastedLum = clamp(
                        (lum - 0.5) * contrastSlope + 0.5,
                        0,
                        1
                    )
                    const darkness = (1 - contrastedLum) * alpha

                    if (darkness > 0.025) {
                        const radius = Math.sqrt(darkness) * maxDotRadius
                        const cx = c * cellSize + cellSize * 0.5 - rowOffsetX
                        ctx.moveTo(cx + radius, cy)
                        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
                    }
                }
            }

            ctx.fill()
        }

        drawHalftoneToCanvas(leftEffectCanvasRef.current)
        drawHalftoneToCanvas(rightEffectCanvasRef.current)
    }, [
        effectStyle,
        canvasImageReady,
        containerSize.width,
        containerSize.height,
        halftoneDotSize,
        halftoneContrast,
        halftoneColorMode,
        halftonePrimaryColor,
        halftoneSecondaryColor,
        imageFit,
        imagePositionX,
        imagePositionY,
    ])

    // --- EFFECT 04: RGB GLITCH ANIMATION TICKER ---
    const isGlitchAnimating =
        isEffectAnimationActive &&
        effectStyle === "glitch" &&
        glitchAnimate &&
        (glitchIntensity > 0 || glitchColorSeparation > 0)

    useEffect(() => {
        if (!isGlitchAnimating || isStaticMode) {
            setGlitchTick(0)
            return
        }

        const intervalId = window.setInterval(() => {
            setGlitchTick((prev) => (prev + 1) % 12)
        }, 140)

        return () => {
            window.clearInterval(intervalId)
        }
    }, [isGlitchAnimating, isStaticMode])

    // --- EFFECT 08: ANALOG FILM GRAIN TICKER ---
    const isFilmAnimating =
        isEffectAnimationActive &&
        effectStyle === "film" &&
        filmAnimate &&
        filmGrainIntensity > 0

    useEffect(() => {
        if (!isFilmAnimating || isStaticMode) {
            setFilmGrainTick(0)
            return
        }

        const intervalId = window.setInterval(() => {
            setFilmGrainTick((prev) => (prev + 1) % 8)
        }, 95)

        return () => {
            window.clearInterval(intervalId)
        }
    }, [isFilmAnimating, isStaticMode])

    // ========================================================================
    // 7. COMPUTED PARAMETERS FOR ALL 10 EFFECTS
    // ========================================================================

    // --- 01: Blur Reveal ---
    const blurPx = clamp(blurIntensity, 0, 40)
    const grayscalePercent = grayscale ? 100 : 0
    const blurImageFilter = `blur(${blurPx}px) grayscale(${grayscalePercent}%)`

    const edgeBleedScale = useMemo(() => {
        if (blurPx <= 0) return 1
        return Number((1 + Math.min(blurPx * 0.0045, 0.18)).toFixed(3))
    }, [blurPx])

    // --- 02: Gradient Wave ---
    const waveNorm = clamp(waveIntensity, 0, 100) / 100
    const waveDisplacementScale = Math.round(8 + waveNorm * 58)
    const waveCycleDuration = useMemo(() => {
        const speedNorm = clamp(waveSpeed, 5, 100) / 100
        return Number((14 - speedNorm * 10.5).toFixed(2))
    }, [waveSpeed])
    const isWaveAnimating =
        isEffectAnimationActive &&
        effectStyle === "wave" &&
        waveAnimate &&
        waveIntensity > 0

    // --- 04: RGB Glitch ---
    const glitchSlices = useMemo(() => {
        const intensityNorm = clamp(glitchIntensity, 0, 100) / 100
        const sepPx = clamp(glitchColorSeparation, 0, 40)
        const activeTick = isGlitchAnimating ? glitchTick : 0

        const burstMultiplier = !isGlitchAnimating
            ? 1
            : activeTick % 4 === 0
              ? 1.35
              : activeTick % 3 === 0
                ? 0.45
                : 0.85

        const redShiftX = Number(
            (sepPx * (0.45 + intensityNorm * 0.65) * burstMultiplier).toFixed(2)
        )
        const cyanShiftX = Number((-redShiftX * 0.95).toFixed(2))
        const sliceShift1 = Number(
            ((8 + intensityNorm * 28) * burstMultiplier).toFixed(1)
        )
        const sliceShift2 = Number(
            ((-6 - intensityNorm * 22) * burstMultiplier).toFixed(1)
        )
        const sliceShift3 = Number(
            ((4 + intensityNorm * 16) * burstMultiplier).toFixed(1)
        )

        const band1Top = 16 + ((activeTick * 7) % 18)
        const band2Top = 48 + ((activeTick * 11) % 20)
        const band3Top = 74 + ((activeTick * 5) % 14)

        return {
            redShiftX,
            cyanShiftX,
            band1: {
                top: band1Top,
                bottom: Math.max(5, 100 - (band1Top + 7)),
                shift: sliceShift1,
            },
            band2: {
                top: band2Top,
                bottom: Math.max(5, 100 - (band2Top + 5)),
                shift: sliceShift2,
            },
            band3: {
                top: band3Top,
                bottom: Math.max(5, 100 - (band3Top + 4)),
                shift: sliceShift3,
            },
        }
    }, [glitchIntensity, glitchColorSeparation, isGlitchAnimating, glitchTick])

    // --- 05: Liquid Refraction ---
    const liquidIntensityNorm = clamp(liquidRefractionIntensity, 0, 100) / 100
    const liquidDisplacementScale = Math.round(6 + liquidIntensityNorm * 82)
    const liquidBaseFreq = useMemo(() => {
        const scaleNorm = clamp(liquidWaveScale, 10, 100) / 100
        const fx = Number((0.026 - scaleNorm * 0.019).toFixed(4))
        const fy = Number((0.032 - scaleNorm * 0.023).toFixed(4))
        const fxAlt = Number((fx * 1.38).toFixed(4))
        const fyAlt = Number((fy * 0.78).toFixed(4))
        return {
            initial: `${fx} ${fy}`,
            animatedValues: `${fx} ${fy};${fxAlt} ${fyAlt};${fx} ${fy}`,
        }
    }, [liquidWaveScale])

    const liquidCycleDuration = useMemo(() => {
        const speedNorm = clamp(liquidSpeed, 5, 100) / 100
        return Number((15 - speedNorm * 11.5).toFixed(2))
    }, [liquidSpeed])

    const isLiquidAnimating =
        isEffectAnimationActive &&
        effectStyle === "liquid" &&
        liquidAnimate &&
        liquidRefractionIntensity > 0

    // --- 07: Thermal Vision ---
    const thermalTables = useMemo(() => {
        let stops: Array<[number, number, number]>
        if (thermalPalette === "cyberpunk") {
            stops = [
                [5, 5, 24],
                [24, 28, 168],
                [0, 194, 224],
                [190, 24, 165],
                [255, 42, 118],
                [255, 220, 46],
                [255, 255, 255],
            ]
        } else if (thermalPalette === "custom") {
            const cShadow = parseColorToRgb(thermalShadowColor, [10, 17, 66])
            const cMid = parseColorToRgb(thermalMidtoneColor, [201, 24, 120])
            const cHigh = parseColorToRgb(thermalHighlightColor, [255, 190, 11])
            stops = [
                mixRgb([4, 6, 18], cShadow, 0.75),
                cShadow,
                mixRgb(cShadow, cMid, 0.5),
                cMid,
                mixRgb(cMid, cHigh, 0.55),
                cHigh,
                mixRgb(cHigh, [255, 255, 245], 0.55),
            ]
        } else {
            stops = [
                [6, 9, 30],
                [26, 20, 102],
                [12, 82, 196],
                [172, 22, 148],
                [238, 38, 56],
                [255, 132, 0],
                [255, 246, 176],
            ]
        }
        return buildRgbTableStrings(stops)
    }, [
        thermalPalette,
        thermalShadowColor,
        thermalMidtoneColor,
        thermalHighlightColor,
    ])

    const thermalContrastSlope = useMemo(() => {
        const norm = clamp(thermalContrast, 0, 100) / 100
        return Number((0.65 + norm * 1.35).toFixed(3))
    }, [thermalContrast])

    const thermalContrastIntercept = useMemo(
        () => Number((0.5 * (1 - thermalContrastSlope)).toFixed(3)),
        [thermalContrastSlope]
    )

    // --- 08: Analog Film ---
    const filmColorMatrixValues = useMemo(() => {
        const tempNorm = clamp(filmTemperature, -100, 100) / 100
        const presetWarmth =
            filmPreset === "warm" ? 0.12 : filmPreset === "cool" ? -0.12 : 0
        const totalWarmth = clamp(tempNorm * 0.22 + presetWarmth, -0.32, 0.32)

        const rScale = Number((1 + totalWarmth * 0.45).toFixed(3))
        const gScale = Number((1 + totalWarmth * 0.12).toFixed(3))
        const bScale = Number((1 - totalWarmth * 0.52).toFixed(3))

        return `
            ${rScale} 0.04 0 0 0.01
            0.02 ${gScale} 0.02 0 0.005
            0 0.03 ${bScale} 0 0.015
            0 0 0 1 0
        `
    }, [filmPreset, filmTemperature])

    const filmCurveTable = useMemo(() => {
        const cNorm = clamp(filmContrast, 0, 100) / 100
        const s0 = 0.055
        const s1 = Number(clamp(0.26 - cNorm * 0.11, 0.12, 0.32).toFixed(3))
        const s2 = 0.5
        const s3 = Number(clamp(0.74 + cNorm * 0.11, 0.68, 0.88).toFixed(3))
        const s4 = 0.955
        return `${s0} ${s1} ${s2} ${s3} ${s4}`
    }, [filmContrast])

    const filmGrainBaseFreq = useMemo(() => {
        const sizeNorm = clamp(filmGrainSize, 10, 100) / 100
        const freq = Number((0.92 - sizeNorm * 0.64).toFixed(3))
        return `${freq} ${freq}`
    }, [filmGrainSize])

    const filmGrainTransform = useMemo(() => {
        if (!isFilmAnimating) return "translate3d(0%, 0%, 0)"
        const offsets = [
            "translate3d(0%, 0%, 0)",
            "translate3d(-3%, 2%, 0)",
            "translate3d(2%, -3%, 0)",
            "translate3d(-2%, -2%, 0)",
            "translate3d(3%, 1%, 0)",
            "translate3d(-1%, 3%, 0)",
            "translate3d(2%, 2%, 0)",
            "translate3d(-3%, -1%, 0)",
        ]
        return offsets[filmGrainTick % offsets.length]
    }, [isFilmAnimating, filmGrainTick])

    // --- 09: CRT Scanlines ---
    const crtParams = useMemo(() => {
        const densityNorm = clamp(crtScanlineDensity, 10, 100) / 100
        const periodPx = Number((11 - densityNorm * 8.5).toFixed(2))
        const thicknessRatio = clamp(crtScanlineThickness, 10, 90) / 100
        const clearGapPx = Number((periodPx * (1 - thicknessRatio)).toFixed(2))
        const scanlineAlpha = Number(
            (clamp(crtScanlineOpacity, 0, 100) / 100).toFixed(3)
        )
        const contrastPercent = Math.round(
            95 + (clamp(crtContrast, 0, 100) / 100) * 55
        )
        const distortionScale = Math.round(
            (clamp(crtSignalDistortion, 0, 100) / 100) * 26
        )
        return {
            periodPx,
            clearGapPx,
            scanlineAlpha,
            contrastPercent,
            distortionScale,
        }
    }, [
        crtScanlineDensity,
        crtScanlineThickness,
        crtScanlineOpacity,
        crtContrast,
        crtSignalDistortion,
    ])

    const isCrtAnimating =
        isEffectAnimationActive && effectStyle === "crt" && crtAnimate

    // --- 10: Duotone Poster ---
    const duotoneTables = useMemo(() => {
        const cShadow = parseColorToRgb(duotoneShadowColor, [11, 19, 59])
        const cHigh = parseColorToRgb(duotoneHighlightColor, [255, 85, 0])
        const stops: Array<[number, number, number]> = [
            cShadow,
            mixRgb(cShadow, cHigh, 0.25),
            mixRgb(cShadow, cHigh, 0.5),
            mixRgb(cShadow, cHigh, 0.75),
            cHigh,
        ]
        return buildRgbTableStrings(stops)
    }, [duotoneShadowColor, duotoneHighlightColor])

    const duotoneContrastSlope = useMemo(() => {
        const norm = clamp(duotoneContrast, 0, 100) / 100
        return Number((0.6 + norm * 1.65).toFixed(3))
    }, [duotoneContrast])

    const duotoneContrastIntercept = useMemo(
        () => Number((0.5 * (1 - duotoneContrastSlope)).toFixed(3)),
        [duotoneContrastSlope]
    )

    // Shared styles for synchronized sharp and effect images
    const sharedImgStyle: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: imageFit,
        objectPosition,
        display: "block",
        pointerEvents: "none",
        userSelect: "none",
        WebkitUserDrag: "none",
    } as React.CSSProperties

    // Shared darkness & vignette overlay renderer
    const renderSharedAtmosphere = (extraDarknessMultiplier: number = 1) => {
        const effectiveDarkness = clamp(
            (overlayDarkness * extraDarknessMultiplier) / 100,
            0,
            0.95
        )
        return (
            <>
                {effectiveDarkness > 0 && (
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundColor: `rgba(0, 0, 0, ${effectiveDarkness})`,
                            pointerEvents: "none",
                        }}
                    />
                )}
                {vignette && (
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            background:
                                "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.48) 100%)",
                            pointerEvents: "none",
                        }}
                    />
                )}
            </>
        )
    }

    // ========================================================================
    // 8. OVERLAY PANEL RENDERER (SUPPORTS ALL 10 SELECTABLE EFFECTS)
    // ========================================================================
    const renderEffectPanelContents = (side: "left" | "right") => {
        // --------------------------------------------------------------------
        // EFFECT 01: BLUR REVEAL
        // --------------------------------------------------------------------
        if (effectStyle === "blur") {
            return (
                <>
                    {blurPx > 0 && imageFit === "cover" && (
                        <img
                            src={resolvedImage.src}
                            srcSet={resolvedImage.srcSet}
                            alt=""
                            aria-hidden="true"
                            decoding="async"
                            style={{
                                ...sharedImgStyle,
                                filter: blurImageFilter,
                                transform: `scale(${edgeBleedScale})`,
                                transformOrigin: objectPosition,
                            }}
                        />
                    )}

                    <img
                        src={resolvedImage.src}
                        srcSet={resolvedImage.srcSet}
                        alt=""
                        aria-hidden="true"
                        decoding="async"
                        style={{
                            ...sharedImgStyle,
                            filter: blurImageFilter,
                            transform: "translateZ(0)",
                        }}
                    />

                    {renderSharedAtmosphere(1)}

                    {enableTint && tintIntensity > 0 && (
                        <>
                            <div
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    backgroundColor: hexToRgba(
                                        tintColor,
                                        tintIntensity
                                    ),
                                    mixBlendMode: "soft-light",
                                    pointerEvents: "none",
                                }}
                            />
                            <div
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    backgroundColor: hexToRgba(
                                        tintColor,
                                        tintIntensity * 0.45
                                    ),
                                    pointerEvents: "none",
                                }}
                            />
                        </>
                    )}
                </>
            )
        }

        // --------------------------------------------------------------------
        // EFFECT 02: GRADIENT WAVE
        // --------------------------------------------------------------------
        if (effectStyle === "wave") {
            const c1 = hexToRgba(waveColor1, 55 + waveNorm * 35)
            const c2 = hexToRgba(waveColor2, 50 + waveNorm * 35)
            const c3 = hexToRgba(waveColor3, 50 + waveNorm * 35)

            return (
                <>
                    <img
                        src={resolvedImage.src}
                        srcSet={resolvedImage.srcSet}
                        alt=""
                        aria-hidden="true"
                        decoding="async"
                        style={{
                            ...sharedImgStyle,
                            filter: `url(#${waveFilterId}) blur(${Math.round(
                                2 + waveNorm * 6
                            )}px) saturate(115%)`,
                            transform: `scale(${(
                                1.03 +
                                waveNorm * 0.05
                            ).toFixed(3)})`,
                            transformOrigin: objectPosition,
                        }}
                    />

                    <div
                        aria-hidden="true"
                        className={
                            isWaveAnimating
                                ? `reveal-wave-layer-a-${filterUid}`
                                : undefined
                        }
                        style={{
                            position: "absolute",
                            inset: "-25%",
                            background: `
                                radial-gradient(circle at 22% 30%, ${c1} 0%, transparent 55%),
                                radial-gradient(circle at 78% 28%, ${c2} 0%, transparent 58%),
                                radial-gradient(circle at 52% 78%, ${c3} 0%, transparent 60%),
                                linear-gradient(125deg, ${c1} 0%, ${c2} 48%, ${c3} 100%)
                            `,
                            filter: `url(#${waveFilterId}) blur(18px)`,
                            opacity: clamp(0.38 + waveNorm * 0.48, 0.2, 0.92),
                            mixBlendMode: "screen",
                            transform: isWaveAnimating
                                ? undefined
                                : "translate3d(0%, 0%, 0) scale(1.06)",
                            animation: isWaveAnimating ? undefined : "none",
                            pointerEvents: "none",
                        }}
                    />

                    <div
                        aria-hidden="true"
                        className={
                            isWaveAnimating
                                ? `reveal-wave-layer-b-${filterUid}`
                                : undefined
                        }
                        style={{
                            position: "absolute",
                            inset: "-20%",
                            background: `
                                conic-gradient(from 180deg at 50% 50%, ${c2} 0deg, transparent 95deg, ${c3} 195deg, transparent 280deg, ${c1} 360deg)
                            `,
                            filter: "blur(24px)",
                            opacity: clamp(0.28 + waveNorm * 0.42, 0.15, 0.85),
                            mixBlendMode: "color-dodge",
                            transform: isWaveAnimating
                                ? undefined
                                : "translate3d(0%, 0%, 0) scale(1.08)",
                            animation: isWaveAnimating ? undefined : "none",
                            pointerEvents: "none",
                        }}
                    />

                    {renderSharedAtmosphere(0.85)}
                </>
            )
        }

        // --------------------------------------------------------------------
        // EFFECT 03: PIXEL DISTORTION
        // --------------------------------------------------------------------
        if (effectStyle === "pixel") {
            return (
                <>
                    {!canvasImageReady && (
                        <img
                            src={resolvedImage.src}
                            srcSet={resolvedImage.srcSet}
                            alt=""
                            aria-hidden="true"
                            decoding="async"
                            style={{
                                ...sharedImgStyle,
                                filter: `url(#${pixelFallbackFilterId})`,
                                imageRendering: "pixelated",
                            }}
                        />
                    )}

                    <canvas
                        ref={
                            side === "left"
                                ? leftEffectCanvasRef
                                : rightEffectCanvasRef
                        }
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            display: "block",
                            imageRendering: "pixelated",
                            pointerEvents: "none",
                        }}
                    />

                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage: `
                                linear-gradient(to right, rgba(0, 0, 0, 0.16) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(0, 0, 0, 0.16) 1px, transparent 1px)
                            `,
                            backgroundSize: `${clamp(
                                pixelSize,
                                4,
                                60
                            )}px ${clamp(pixelSize, 4, 60)}px`,
                            pointerEvents: "none",
                        }}
                    />

                    {renderSharedAtmosphere(0.85)}
                </>
            )
        }

        // --------------------------------------------------------------------
        // EFFECT 04: RGB GLITCH
        // --------------------------------------------------------------------
        if (effectStyle === "glitch") {
            return (
                <>
                    <img
                        src={resolvedImage.src}
                        srcSet={resolvedImage.srcSet}
                        alt=""
                        aria-hidden="true"
                        decoding="async"
                        style={{
                            ...sharedImgStyle,
                            filter: "grayscale(25%) contrast(112%)",
                            opacity: 0.45,
                        }}
                    />

                    <img
                        src={resolvedImage.src}
                        srcSet={resolvedImage.srcSet}
                        alt=""
                        aria-hidden="true"
                        decoding="async"
                        style={{
                            ...sharedImgStyle,
                            filter: `url(#${redChannelFilterId})`,
                            transform: `translate3d(${glitchSlices.redShiftX}px, 0px, 0px) scale(1.015)`,
                            mixBlendMode: "screen",
                        }}
                    />

                    <img
                        src={resolvedImage.src}
                        srcSet={resolvedImage.srcSet}
                        alt=""
                        aria-hidden="true"
                        decoding="async"
                        style={{
                            ...sharedImgStyle,
                            filter: `url(#${cyanChannelFilterId})`,
                            transform: `translate3d(${glitchSlices.cyanShiftX}px, 0px, 0px) scale(1.015)`,
                            mixBlendMode: "screen",
                        }}
                    />

                    {glitchIntensity > 0 && (
                        <>
                            <img
                                src={resolvedImage.src}
                                srcSet={resolvedImage.srcSet}
                                alt=""
                                aria-hidden="true"
                                decoding="async"
                                style={{
                                    ...sharedImgStyle,
                                    clipPath: `inset(${glitchSlices.band1.top}% 0% ${glitchSlices.band1.bottom}% 0%)`,
                                    WebkitClipPath: `inset(${glitchSlices.band1.top}% 0% ${glitchSlices.band1.bottom}% 0%)`,
                                    transform: `translate3d(${glitchSlices.band1.shift}px, 0, 0)`,
                                    filter: "contrast(125%) saturate(135%)",
                                }}
                            />
                            <img
                                src={resolvedImage.src}
                                srcSet={resolvedImage.srcSet}
                                alt=""
                                aria-hidden="true"
                                decoding="async"
                                style={{
                                    ...sharedImgStyle,
                                    clipPath: `inset(${glitchSlices.band2.top}% 0% ${glitchSlices.band2.bottom}% 0%)`,
                                    WebkitClipPath: `inset(${glitchSlices.band2.top}% 0% ${glitchSlices.band2.bottom}% 0%)`,
                                    transform: `translate3d(${glitchSlices.band2.shift}px, 0, 0)`,
                                    filter: `url(#${cyanChannelFilterId}) contrast(135%)`,
                                    mixBlendMode: "screen",
                                }}
                            />
                            <img
                                src={resolvedImage.src}
                                srcSet={resolvedImage.srcSet}
                                alt=""
                                aria-hidden="true"
                                decoding="async"
                                style={{
                                    ...sharedImgStyle,
                                    clipPath: `inset(${glitchSlices.band3.top}% 0% ${glitchSlices.band3.bottom}% 0%)`,
                                    WebkitClipPath: `inset(${glitchSlices.band3.top}% 0% ${glitchSlices.band3.bottom}% 0%)`,
                                    transform: `translate3d(${glitchSlices.band3.shift}px, 0, 0)`,
                                    filter: "contrast(120%)",
                                }}
                            />
                        </>
                    )}

                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage:
                                "repeating-linear-gradient(to bottom, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)",
                            pointerEvents: "none",
                        }}
                    />

                    {renderSharedAtmosphere(0.8)}
                </>
            )
        }

        // --------------------------------------------------------------------
        // EFFECT 05: LIQUID REFRACTION
        // --------------------------------------------------------------------
        if (effectStyle === "liquid") {
            const scaleBoost = Number(
                (1.03 + liquidIntensityNorm * 0.08).toFixed(3)
            )
            return (
                <>
                    <img
                        src={resolvedImage.src}
                        srcSet={resolvedImage.srcSet}
                        alt=""
                        aria-hidden="true"
                        decoding="async"
                        style={{
                            ...sharedImgStyle,
                            filter: "blur(10px)",
                            transform: "scale(1.12)",
                            transformOrigin: objectPosition,
                        }}
                    />

                    <img
                        src={resolvedImage.src}
                        srcSet={resolvedImage.srcSet}
                        alt=""
                        aria-hidden="true"
                        decoding="async"
                        style={{
                            ...sharedImgStyle,
                            filter: `url(#${liquidFilterId}) saturate(112%) contrast(106%)`,
                            transform: `scale(${scaleBoost})`,
                            transformOrigin: objectPosition,
                        }}
                    />

                    {liquidGlossHighlight && (
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                inset: "-12%",
                                background: `
                                    linear-gradient(135deg,
                                        rgba(255,255,255,0) 15%,
                                        rgba(255,255,255,0.22) 32%,
                                        rgba(255,255,255,0.02) 48%,
                                        rgba(255,255,255,0.18) 66%,
                                        rgba(255,255,255,0) 84%
                                    ),
                                    radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.24) 0%, transparent 50%),
                                    radial-gradient(ellipse at 72% 75%, rgba(210,235,255,0.2) 0%, transparent 55%)
                                `,
                                filter: `url(#${liquidFilterId}) blur(4px)`,
                                mixBlendMode: "screen",
                                opacity: clamp(
                                    0.45 + liquidIntensityNorm * 0.45,
                                    0.3,
                                    0.9
                                ),
                                pointerEvents: "none",
                            }}
                        />
                    )}

                    {renderSharedAtmosphere(0.75)}
                </>
            )
        }

        // --------------------------------------------------------------------
        // EFFECT 06: HALFTONE PRINT
        // --------------------------------------------------------------------
        if (effectStyle === "halftone") {
            const intensityOpacity = clamp(halftoneIntensity / 100, 0.1, 1)
            const fallbackCell = clamp(halftoneDotSize, 4, 32)
            const fallbackContrast = Math.round(
                140 + (clamp(halftoneContrast, 0, 100) / 100) * 140
            )
            const paperBg =
                halftoneColorMode === "duotone"
                    ? halftoneSecondaryColor
                    : "#f2efe9"

            return (
                <>
                    <img
                        src={resolvedImage.src}
                        srcSet={resolvedImage.srcSet}
                        alt=""
                        aria-hidden="true"
                        decoding="async"
                        style={{
                            ...sharedImgStyle,
                            filter: `grayscale(100%) contrast(${fallbackContrast}%)`,
                        }}
                    />

                    {!halftoneUsesFallback && (
                        <canvas
                            ref={
                                side === "left"
                                    ? leftEffectCanvasRef
                                    : rightEffectCanvasRef
                            }
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                display: "block",
                                opacity: canvasImageReady
                                    ? intensityOpacity
                                    : 0,
                                pointerEvents: "none",
                            }}
                        />
                    )}

                    {(!canvasImageReady || halftoneUsesFallback) && (
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                inset: 0,
                                backgroundColor: paperBg,
                                opacity: intensityOpacity,
                                pointerEvents: "none",
                            }}
                        >
                            <img
                                src={resolvedImage.src}
                                srcSet={resolvedImage.srcSet}
                                alt=""
                                aria-hidden="true"
                                decoding="async"
                                style={{
                                    ...sharedImgStyle,
                                    filter: `grayscale(100%) contrast(${fallbackContrast}%)`,
                                    mixBlendMode: "multiply",
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    backgroundImage: `radial-gradient(circle, ${halftonePrimaryColor} 42%, transparent 58%)`,
                                    backgroundSize: `${fallbackCell}px ${fallbackCell}px`,
                                    mixBlendMode: "overlay",
                                }}
                            />
                        </div>
                    )}

                    {renderSharedAtmosphere(0.45)}
                </>
            )
        }

        // --------------------------------------------------------------------
        // EFFECT 07: THERMAL VISION
        // --------------------------------------------------------------------
        if (effectStyle === "thermal") {
            const combinedOpacity = clamp(
                (thermalIntensity / 100) * (thermalMappingIntensity / 100),
                0.1,
                1
            )

            return (
                <>
                    <img
                        src={resolvedImage.src}
                        srcSet={resolvedImage.srcSet}
                        alt=""
                        aria-hidden="true"
                        decoding="async"
                        style={{
                            ...sharedImgStyle,
                            filter: "grayscale(100%) contrast(120%)",
                        }}
                    />

                    <img
                        src={resolvedImage.src}
                        srcSet={resolvedImage.srcSet}
                        alt=""
                        aria-hidden="true"
                        decoding="async"
                        style={{
                            ...sharedImgStyle,
                            filter: `url(#${thermalFilterId})`,
                            opacity: combinedOpacity,
                        }}
                    />

                    <img
                        src={resolvedImage.src}
                        srcSet={resolvedImage.srcSet}
                        alt=""
                        aria-hidden="true"
                        decoding="async"
                        style={{
                            ...sharedImgStyle,
                            filter: `url(#${thermalFilterId}) blur(8px)`,
                            mixBlendMode: "screen",
                            opacity: Number(
                                (combinedOpacity * 0.24).toFixed(3)
                            ),
                        }}
                    />

                    {renderSharedAtmosphere(0.35)}
                </>
            )
        }

        // --------------------------------------------------------------------
        // EFFECT 08: ANALOG FILM
        // --------------------------------------------------------------------
        if (effectStyle === "film") {
            const grainAlpha = clamp((filmGrainIntensity / 100) * 0.72, 0, 0.78)
            const filmVignetteAlpha = clamp(
                filmVignetteIntensity / 100,
                0,
                0.95
            )
            const gradeTint =
                filmPreset === "warm"
                    ? "rgba(218, 155, 92, 0.14)"
                    : filmPreset === "cool"
                      ? "rgba(88, 148, 214, 0.14)"
                      : "rgba(180, 175, 165, 0.06)"

            return (
                <>
                    <img
                        src={resolvedImage.src}
                        srcSet={resolvedImage.srcSet}
                        alt=""
                        aria-hidden="true"
                        decoding="async"
                        style={{
                            ...sharedImgStyle,
                            filter: `url(#${filmToneFilterId})`,
                        }}
                    />

                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundColor: gradeTint,
                            mixBlendMode: "soft-light",
                            pointerEvents: "none",
                        }}
                    />

                    {grainAlpha > 0.01 && (
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                inset: "-10%",
                                width: "120%",
                                height: "120%",
                                filter: `url(#${filmGrainFilterId})`,
                                opacity: grainAlpha,
                                mixBlendMode: "overlay",
                                transform: filmGrainTransform,
                                pointerEvents: "none",
                            }}
                        />
                    )}

                    {filmVignetteAlpha > 0.01 && (
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: `radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 36%, rgba(8,6,5,${(
                                    filmVignetteAlpha * 0.82
                                ).toFixed(3)}) 100%)`,
                                pointerEvents: "none",
                            }}
                        />
                    )}

                    {renderSharedAtmosphere(0.65)}
                </>
            )
        }

        // --------------------------------------------------------------------
        // EFFECT 09: CRT SCANLINES
        // --------------------------------------------------------------------
        if (effectStyle === "crt") {
            const useSignalFilter = crtParams.distortionScale > 0
            return (
                <>
                    <img
                        src={resolvedImage.src}
                        srcSet={resolvedImage.srcSet}
                        alt=""
                        aria-hidden="true"
                        decoding="async"
                        style={{
                            ...sharedImgStyle,
                            filter: `${
                                useSignalFilter
                                    ? `url(#${crtSignalFilterId}) `
                                    : ""
                            }contrast(${crtParams.contrastPercent}%) saturate(114%)`,
                            transform: useSignalFilter ? "scale(1.02)" : "none",
                            transformOrigin: objectPosition,
                        }}
                    />

                    <img
                        src={resolvedImage.src}
                        srcSet={resolvedImage.srcSet}
                        alt=""
                        aria-hidden="true"
                        decoding="async"
                        style={{
                            ...sharedImgStyle,
                            filter: `blur(5px) contrast(${crtParams.contrastPercent}%)`,
                            mixBlendMode: "screen",
                            opacity: 0.22,
                        }}
                    />

                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage:
                                "repeating-linear-gradient(90deg, rgba(255, 40, 40, 0.07) 0px, rgba(40, 255, 40, 0.07) 1px, rgba(40, 100, 255, 0.07) 2px, rgba(0, 0, 0, 0.14) 3px)",
                            pointerEvents: "none",
                        }}
                    />

                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage: `repeating-linear-gradient(
                                to bottom,
                                rgba(255, 255, 255, 0.03) 0px,
                                rgba(255, 255, 255, 0.03) ${crtParams.clearGapPx}px,
                                rgba(0, 0, 0, ${crtParams.scanlineAlpha}) ${crtParams.clearGapPx}px,
                                rgba(0, 0, 0, ${crtParams.scanlineAlpha}) ${crtParams.periodPx}px
                            )`,
                            pointerEvents: "none",
                        }}
                    />

                    {isCrtAnimating && (
                        <div
                            aria-hidden="true"
                            className={`reveal-crt-roll-${filterUid}`}
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                height: "18%",
                                background:
                                    "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0) 100%)",
                                pointerEvents: "none",
                            }}
                        />
                    )}

                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            boxShadow:
                                "inset 0 0 36px rgba(0, 0, 0, 0.55), inset 0 0 8px rgba(0, 0, 0, 0.45)",
                            pointerEvents: "none",
                        }}
                    />

                    {renderSharedAtmosphere(0.55)}
                </>
            )
        }

        // --------------------------------------------------------------------
        // EFFECT 10: DUOTONE POSTER
        // --------------------------------------------------------------------
        const duotoneOpacity = clamp(duotoneIntensity / 100, 0.1, 1)
        const duotoneSatPercent = clamp(duotoneSaturation, 0, 150)

        return (
            <>
                <img
                    src={resolvedImage.src}
                    srcSet={resolvedImage.srcSet}
                    alt=""
                    aria-hidden="true"
                    decoding="async"
                    style={{
                        ...sharedImgStyle,
                        filter: "grayscale(100%) contrast(125%)",
                    }}
                />

                <img
                    src={resolvedImage.src}
                    srcSet={resolvedImage.srcSet}
                    alt=""
                    aria-hidden="true"
                    decoding="async"
                    style={{
                        ...sharedImgStyle,
                        filter: `url(#${duotoneFilterId}) saturate(${duotoneSatPercent}%)`,
                        opacity: duotoneOpacity,
                    }}
                />

                {duotoneBackgroundBlend && (
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: `linear-gradient(135deg, ${hexToRgba(
                                duotoneShadowColor,
                                38
                            )} 0%, ${hexToRgba(
                                duotoneHighlightColor,
                                32
                            )} 100%)`,
                            mixBlendMode: "overlay",
                            pointerEvents: "none",
                        }}
                    />
                )}

                {renderSharedAtmosphere(0.3)}
            </>
        )
    }

    // Custom Cursor SVG Icon Renderer
    const renderCursorSvg = () => {
        if (cursorIcon === "crosshair") {
            return (
                <svg
                    width={resolvedCursorSize}
                    height={resolvedCursorSize}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ display: "block", overflow: "visible" }}
                >
                    <line
                        x1="12"
                        y1="2"
                        x2="12"
                        y2="8.5"
                        stroke={resolvedCursorColor}
                        strokeWidth={resolvedCursorStroke}
                        strokeLinecap="square"
                    />
                    <line
                        x1="12"
                        y1="15.5"
                        x2="12"
                        y2="22"
                        stroke={resolvedCursorColor}
                        strokeWidth={resolvedCursorStroke}
                        strokeLinecap="square"
                    />
                    <line
                        x1="2"
                        y1="12"
                        x2="8.5"
                        y2="12"
                        stroke={resolvedCursorColor}
                        strokeWidth={resolvedCursorStroke}
                        strokeLinecap="square"
                    />
                    <line
                        x1="15.5"
                        y1="12"
                        x2="22"
                        y2="12"
                        stroke={resolvedCursorColor}
                        strokeWidth={resolvedCursorStroke}
                        strokeLinecap="square"
                    />
                    <circle
                        cx="12"
                        cy="12"
                        r="1.25"
                        fill={resolvedCursorColor}
                    />
                </svg>
            )
        }

        if (cursorIcon === "dotRing") {
            return (
                <svg
                    width={resolvedCursorSize}
                    height={resolvedCursorSize}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ display: "block", overflow: "visible" }}
                >
                    <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke={resolvedCursorColor}
                        strokeWidth={resolvedCursorStroke}
                    />
                    <line
                        x1="12"
                        y1="8"
                        x2="12"
                        y2="16"
                        stroke={resolvedCursorColor}
                        strokeWidth={resolvedCursorStroke}
                        strokeLinecap="square"
                    />
                    <line
                        x1="8"
                        y1="12"
                        x2="16"
                        y2="12"
                        stroke={resolvedCursorColor}
                        strokeWidth={resolvedCursorStroke}
                        strokeLinecap="square"
                    />
                </svg>
            )
        }

        return (
            <svg
                width={resolvedCursorSize}
                height={resolvedCursorSize}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: "block", overflow: "visible" }}
            >
                <line
                    x1="12"
                    y1="3"
                    x2="12"
                    y2="21"
                    stroke={resolvedCursorColor}
                    strokeWidth={resolvedCursorStroke}
                    strokeLinecap="square"
                />
                <line
                    x1="3"
                    y1="12"
                    x2="21"
                    y2="12"
                    stroke={resolvedCursorColor}
                    strokeWidth={resolvedCursorStroke}
                    strokeLinecap="square"
                />
            </svg>
        )
    }

    const cursorContainerDimension = resolvedCursorBg
        ? Math.round(resolvedCursorSize * 2.05)
        : resolvedCursorSize

    const isInteractive =
        !isStaticMode &&
        clickToReveal &&
        (phase === "closed" || (phase === "open" && clickToReset))

    const computedContainerCursor = shouldShowCustomCursor
        ? "none"
        : isInteractive
          ? "pointer"
          : "default"

    return (
        <div
            ref={containerRef}
            role={clickToReveal ? "button" : "region"}
            tabIndex={!isStaticMode && clickToReveal ? 0 : -1}
            aria-label={
                clickToReveal
                    ? `${ariaLabel} — ${
                          phase === "open"
                              ? clickToReset
                                  ? "Full image revealed, activate to reset"
                                  : "Full image revealed"
                              : "Activate to reveal full image"
                      }`
                    : ariaLabel
            }
            aria-expanded={clickToReveal ? phase === "open" : undefined}
            onPointerEnter={isStaticMode ? undefined : handlePointerEnter}
            onPointerMove={isStaticMode ? undefined : handlePointerMove}
            onPointerLeave={isStaticMode ? undefined : handlePointerLeave}
            onClick={isStaticMode ? undefined : handleClick}
            onKeyDown={isStaticMode ? undefined : handleKeyDown}
            onKeyUp={
                isStaticMode
                    ? undefined
                    : (e) => {
                          if (e.key === "Tab") {
                              setIsFocusVisible(true)
                          }
                      }
            }
            onBlur={
                isStaticMode
                    ? undefined
                    : () => {
                          setIsFocusVisible(false)
                      }
            }
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: `${clamp(borderRadius, 0, 500)}px`,
                backgroundColor: "#0a0a0a",
                cursor: computedContainerCursor,
                userSelect: "none",
                WebkitUserSelect: "none",
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
                outline: "none",
                isolation: "isolate",
            }}
        >
            {/* ============================================================
                0. SHARED SVG FILTERS & KEYFRAMES FOR ALL 10 EFFECTS
               ============================================================ */}
            <svg
                width="0"
                height="0"
                aria-hidden="true"
                style={{
                    position: "absolute",
                    width: 0,
                    height: 0,
                    pointerEvents: "none",
                }}
            >
                <defs>
                    {/* EFFECT 02: Gradient Wave Displacement Filter */}
                    <filter
                        id={waveFilterId}
                        x="-20%"
                        y="-20%"
                        width="140%"
                        height="140%"
                        colorInterpolationFilters="sRGB"
                    >
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.012 0.018"
                            numOctaves="2"
                            seed="7"
                            result="waveNoise"
                        >
                            {isWaveAnimating && (
                                <animate
                                    attributeName="baseFrequency"
                                    dur={`${waveCycleDuration}s`}
                                    values="0.012 0.018;0.018 0.026;0.012 0.018"
                                    repeatCount="indefinite"
                                />
                            )}
                        </feTurbulence>
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="waveNoise"
                            scale={waveDisplacementScale}
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>

                    {/* EFFECT 03: Fallback SVG Pixelation Filter */}
                    <filter
                        id={pixelFallbackFilterId}
                        x="0%"
                        y="0%"
                        width="100%"
                        height="100%"
                    >
                        <feMorphology
                            operator="dilate"
                            radius={Math.max(2, Math.round(pixelSize / 3))}
                        />
                    </filter>

                    {/* EFFECT 04: RGB Glitch Isolated Red & Cyan Channel Filters */}
                    <filter
                        id={redChannelFilterId}
                        colorInterpolationFilters="sRGB"
                    >
                        <feColorMatrix
                            type="matrix"
                            values="
                                1 0 0 0 0
                                0 0 0 0 0
                                0 0 0 0 0
                                0 0 0 1 0
                            "
                        />
                    </filter>

                    <filter
                        id={cyanChannelFilterId}
                        colorInterpolationFilters="sRGB"
                    >
                        <feColorMatrix
                            type="matrix"
                            values="
                                0 0 0 0 0
                                0 1 0 0 0
                                0 0 1 0 0
                                0 0 0 1 0
                            "
                        />
                    </filter>

                    {/* EFFECT 05: Liquid Refraction Smooth Viscous Glass Filter */}
                    <filter
                        id={liquidFilterId}
                        x="-18%"
                        y="-18%"
                        width="136%"
                        height="136%"
                        colorInterpolationFilters="sRGB"
                    >
                        <feTurbulence
                            type="turbulence"
                            baseFrequency={liquidBaseFreq.initial}
                            numOctaves="2"
                            seed="14"
                            result="liquidRaw"
                        >
                            {isLiquidAnimating && (
                                <animate
                                    attributeName="baseFrequency"
                                    dur={`${liquidCycleDuration}s`}
                                    values={liquidBaseFreq.animatedValues}
                                    repeatCount="indefinite"
                                />
                            )}
                        </feTurbulence>
                        <feGaussianBlur
                            in="liquidRaw"
                            stdDeviation="4.5"
                            result="liquidSmooth"
                        />
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="liquidSmooth"
                            scale={liquidDisplacementScale}
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>

                    {/* EFFECT 07: Thermal Vision Luminance-to-Palette Filter */}
                    <filter
                        id={thermalFilterId}
                        x="0%"
                        y="0%"
                        width="100%"
                        height="100%"
                        colorInterpolationFilters="sRGB"
                    >
                        <feColorMatrix
                            type="saturate"
                            values="0"
                            result="thermalGray"
                        />
                        <feComponentTransfer
                            in="thermalGray"
                            result="thermalContrasted"
                        >
                            <feFuncR
                                type="linear"
                                slope={thermalContrastSlope}
                                intercept={thermalContrastIntercept}
                            />
                            <feFuncG
                                type="linear"
                                slope={thermalContrastSlope}
                                intercept={thermalContrastIntercept}
                            />
                            <feFuncB
                                type="linear"
                                slope={thermalContrastSlope}
                                intercept={thermalContrastIntercept}
                            />
                        </feComponentTransfer>
                        <feComponentTransfer in="thermalContrasted">
                            <feFuncR
                                type="table"
                                tableValues={thermalTables.r}
                            />
                            <feFuncG
                                type="table"
                                tableValues={thermalTables.g}
                            />
                            <feFuncB
                                type="table"
                                tableValues={thermalTables.b}
                            />
                        </feComponentTransfer>
                    </filter>

                    {/* EFFECT 08: Analog Film Tonal & Color Grading Filter */}
                    <filter
                        id={filmToneFilterId}
                        x="0%"
                        y="0%"
                        width="100%"
                        height="100%"
                        colorInterpolationFilters="sRGB"
                    >
                        <feColorMatrix
                            type="matrix"
                            values={filmColorMatrixValues}
                            result="filmGraded"
                        />
                        <feComponentTransfer in="filmGraded">
                            <feFuncR
                                type="table"
                                tableValues={filmCurveTable}
                            />
                            <feFuncG
                                type="table"
                                tableValues={filmCurveTable}
                            />
                            <feFuncB
                                type="table"
                                tableValues={filmCurveTable}
                            />
                        </feComponentTransfer>
                    </filter>

                    {/* EFFECT 08: Monochromatic Silver-Halide Film Grain Generator */}
                    <filter
                        id={filmGrainFilterId}
                        x="0%"
                        y="0%"
                        width="100%"
                        height="100%"
                        colorInterpolationFilters="sRGB"
                    >
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency={filmGrainBaseFreq}
                            numOctaves="3"
                            stitchTiles="stitch"
                            result="rawGrain"
                        />
                        <feColorMatrix
                            type="saturate"
                            values="0"
                            in="rawGrain"
                            result="monoGrain"
                        />
                        <feComponentTransfer in="monoGrain">
                            <feFuncR
                                type="linear"
                                slope="1.7"
                                intercept="-0.35"
                            />
                            <feFuncG
                                type="linear"
                                slope="1.7"
                                intercept="-0.35"
                            />
                            <feFuncB
                                type="linear"
                                slope="1.7"
                                intercept="-0.35"
                            />
                        </feComponentTransfer>
                    </filter>

                    {/* EFFECT 09: CRT Horizontal Sync Signal Distortion Filter */}
                    <filter
                        id={crtSignalFilterId}
                        x="-10%"
                        y="-5%"
                        width="120%"
                        height="110%"
                        colorInterpolationFilters="sRGB"
                    >
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.001 0.045"
                            numOctaves="1"
                            seed="5"
                            result="crtNoise"
                        >
                            {isCrtAnimating && (
                                <animate
                                    attributeName="baseFrequency"
                                    dur="2.8s"
                                    values="0.001 0.045;0.001 0.068;0.001 0.045"
                                    repeatCount="indefinite"
                                />
                            )}
                        </feTurbulence>
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="crtNoise"
                            scale={crtParams.distortionScale}
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>

                    {/* EFFECT 10: Duotone Poster Luminance Remapping Filter */}
                    <filter
                        id={duotoneFilterId}
                        x="0%"
                        y="0%"
                        width="100%"
                        height="100%"
                        colorInterpolationFilters="sRGB"
                    >
                        <feColorMatrix
                            type="saturate"
                            values="0"
                            result="duoGray"
                        />
                        <feComponentTransfer
                            in="duoGray"
                            result="duoContrasted"
                        >
                            <feFuncR
                                type="linear"
                                slope={duotoneContrastSlope}
                                intercept={duotoneContrastIntercept}
                            />
                            <feFuncG
                                type="linear"
                                slope={duotoneContrastSlope}
                                intercept={duotoneContrastIntercept}
                            />
                            <feFuncB
                                type="linear"
                                slope={duotoneContrastSlope}
                                intercept={duotoneContrastIntercept}
                            />
                        </feComponentTransfer>
                        <feComponentTransfer in="duoContrasted">
                            <feFuncR
                                type="table"
                                tableValues={duotoneTables.r}
                            />
                            <feFuncG
                                type="table"
                                tableValues={duotoneTables.g}
                            />
                            <feFuncB
                                type="table"
                                tableValues={duotoneTables.b}
                            />
                        </feComponentTransfer>
                    </filter>
                </defs>
            </svg>

            {isWaveAnimating && (
                <style>{`
                    @keyframes revealWaveFlowA_${filterUid} {
                        0% { transform: translate3d(-4%, -3%, 0) scale(1.05) rotate(0deg); }
                        50% { transform: translate3d(4%, 3%, 0) scale(1.12) rotate(4deg); }
                        100% { transform: translate3d(-4%, -3%, 0) scale(1.05) rotate(0deg); }
                    }
                    @keyframes revealWaveFlowB_${filterUid} {
                        0% { transform: translate3d(3%, -4%, 0) scale(1.08) rotate(0deg); }
                        50% { transform: translate3d(-4%, 4%, 0) scale(1.15) rotate(-6deg); }
                        100% { transform: translate3d(3%, -4%, 0) scale(1.08) rotate(0deg); }
                    }
                    .reveal-wave-layer-a-${filterUid} {
                        animation: revealWaveFlowA_${filterUid} ${waveCycleDuration}s ease-in-out infinite;
                    }
                    .reveal-wave-layer-b-${filterUid} {
                        animation: revealWaveFlowB_${filterUid} ${(
                            waveCycleDuration * 1.25
                        ).toFixed(2)}s ease-in-out infinite;
                    }
                `}</style>
            )}

            {isCrtAnimating && (
                <style>{`
                    @keyframes revealCrtRoll_${filterUid} {
                        0% { top: -20%; }
                        100% { top: 105%; }
                    }
                    .reveal-crt-roll-${filterUid} {
                        animation: revealCrtRoll_${filterUid} 5.5s linear infinite;
                    }
                `}</style>
            )}

            {/* ============================================================
                1. BASE LAYER: SHARP ORIGINAL IMAGE
               ============================================================ */}
            <img
                src={resolvedImage.src}
                srcSet={resolvedImage.srcSet}
                alt={effectiveAlt}
                decoding="async"
                style={{
                    ...sharedImgStyle,
                    zIndex: 1,
                }}
            />

            {/* ============================================================
                2. LEFT & RIGHT EFFECT OVERLAY PANELS
                (Uses static divs during static rendering; motion.divs when live)
               ============================================================ */}
            {isStaticMode ? (
                <>
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 2,
                            overflow: "hidden",
                            pointerEvents: "none",
                            clipPath: staticLeftClipPath,
                            WebkitClipPath: staticLeftClipPath,
                        }}
                    >
                        {renderEffectPanelContents("left")}
                    </div>
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 2,
                            overflow: "hidden",
                            pointerEvents: "none",
                            clipPath: staticRightClipPath,
                            WebkitClipPath: staticRightClipPath,
                        }}
                    >
                        {renderEffectPanelContents("right")}
                    </div>
                </>
            ) : (
                <>
                    <motion.div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 2,
                            overflow: "hidden",
                            pointerEvents: "none",
                            clipPath: leftPanelClipPath,
                            WebkitClipPath: leftPanelClipPath,
                            willChange: isAnimationEnabled
                                ? "clip-path"
                                : "auto",
                        }}
                    >
                        {renderEffectPanelContents("left")}
                    </motion.div>
                    <motion.div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 2,
                            overflow: "hidden",
                            pointerEvents: "none",
                            clipPath: rightPanelClipPath,
                            WebkitClipPath: rightPanelClipPath,
                            willChange: isAnimationEnabled
                                ? "clip-path"
                                : "auto",
                        }}
                    >
                        {renderEffectPanelContents("right")}
                    </motion.div>
                </>
            )}

            {/* ============================================================
                3. OPTIONAL SUBTLE REVEAL STRIP EDGE HIGHLIGHTS
               ============================================================ */}
            {edgeHighlight &&
                (isStaticMode ? (
                    <>
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                top: 0,
                                bottom: 0,
                                left: `${staticStripLeftPercent.toFixed(3)}%`,
                                width: "1px",
                                zIndex: 3,
                                backgroundColor: "rgba(255, 255, 255, 0.14)",
                                boxShadow: "-1px 0 8px rgba(0, 0, 0, 0.35)",
                                pointerEvents: "none",
                                transform: "translateX(-0.5px)",
                            }}
                        />
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                top: 0,
                                bottom: 0,
                                left: `${staticStripRightPercent.toFixed(3)}%`,
                                width: "1px",
                                zIndex: 3,
                                backgroundColor: "rgba(255, 255, 255, 0.14)",
                                boxShadow: "1px 0 8px rgba(0, 0, 0, 0.35)",
                                pointerEvents: "none",
                                transform: "translateX(-0.5px)",
                            }}
                        />
                    </>
                ) : (
                    <>
                        <motion.div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                top: 0,
                                bottom: 0,
                                left: leftEdgeLineX,
                                width: "1px",
                                zIndex: 3,
                                backgroundColor: "rgba(255, 255, 255, 0.14)",
                                boxShadow: "-1px 0 8px rgba(0, 0, 0, 0.35)",
                                opacity: edgeLineOpacity,
                                pointerEvents: "none",
                                transform: "translateX(-0.5px)",
                                willChange: isAnimationEnabled
                                    ? "left, opacity"
                                    : "auto",
                            }}
                        />
                        <motion.div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                top: 0,
                                bottom: 0,
                                left: rightEdgeLineX,
                                width: "1px",
                                zIndex: 3,
                                backgroundColor: "rgba(255, 255, 255, 0.14)",
                                boxShadow: "1px 0 8px rgba(0, 0, 0, 0.35)",
                                opacity: edgeLineOpacity,
                                pointerEvents: "none",
                                transform: "translateX(-0.5px)",
                                willChange: isAnimationEnabled
                                    ? "left, opacity"
                                    : "auto",
                            }}
                        />
                    </>
                ))}

            {/* ============================================================
                4. POINTER-FOLLOWING 2D CUSTOM CURSOR (X & Y)
                (Static centered preview in Framer Canvas; live 2D cursor on web)
               ============================================================ */}
            {resolvedEnableCustomCursor &&
                (isStaticMode ? (
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            left: `${safeInitialCenter.toFixed(3)}%`,
                            top: "56%",
                            width: `${cursorContainerDimension}px`,
                            height: `${cursorContainerDimension}px`,
                            marginLeft: `${-cursorContainerDimension / 2}px`,
                            marginTop: `${-cursorContainerDimension / 2}px`,
                            zIndex: 10,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "9999px",
                            backgroundColor: resolvedCursorBg
                                ? hexToRgba(
                                      resolvedCursorBgColor,
                                      resolvedCursorBgOpacity
                                  )
                                : "transparent",
                            backdropFilter: resolvedCursorBg
                                ? "blur(4px)"
                                : "none",
                            WebkitBackdropFilter: resolvedCursorBg
                                ? "blur(4px)"
                                : "none",
                            pointerEvents: "none",
                        }}
                    >
                        {renderCursorSvg()}
                    </div>
                ) : (
                    <motion.div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            x: cursorSmoothX,
                            y: cursorSmoothY,
                            width: `${cursorContainerDimension}px`,
                            height: `${cursorContainerDimension}px`,
                            marginLeft: `${-cursorContainerDimension / 2}px`,
                            marginTop: `${-cursorContainerDimension / 2}px`,
                            zIndex: 10,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "9999px",
                            backgroundColor: resolvedCursorBg
                                ? hexToRgba(
                                      resolvedCursorBgColor,
                                      resolvedCursorBgOpacity
                                  )
                                : "transparent",
                            backdropFilter: resolvedCursorBg
                                ? "blur(4px)"
                                : "none",
                            WebkitBackdropFilter: resolvedCursorBg
                                ? "blur(4px)"
                                : "none",
                            opacity: cursorCombinedOpacity,
                            scale: cursorCombinedScale,
                            pointerEvents: "none",
                            willChange: isAnimationEnabled
                                ? "transform, opacity"
                                : "auto",
                        }}
                    >
                        {renderCursorSvg()}
                    </motion.div>
                ))}

            {/* ============================================================
                5. KEYBOARD FOCUS RING (ACCESSIBILITY)
               ============================================================ */}
            {!isStaticMode && isFocusVisible && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: "2px",
                        zIndex: 12,
                        borderRadius: `${Math.max(0, borderRadius - 2)}px`,
                        border: "2px solid rgba(255, 255, 255, 0.85)",
                        boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.6)",
                        pointerEvents: "none",
                    }}
                />
            )}
        </div>
    )
}

export { RevealFX as Effects }

// ============================================================================
// FRAMER PROPERTY CONTROLS
// ============================================================================

addPropertyControls(RevealFX, {
    // --- 1. IMAGE ---
    image: {
        type: (ControlType as Record<string, unknown>).ResponsiveImage
            ? ((ControlType as unknown as { ResponsiveImage: ControlType })
                  .ResponsiveImage as ControlType.Image)
            : ControlType.Image,
        title: "Image",
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
    imagePositionX: {
        type: ControlType.Number,
        title: "Position X",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    imagePositionY: {
        type: ControlType.Number,
        title: "Position Y",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },

    // --- 2. EFFECT STYLE ---
    effectStyle: {
        type: ControlType.Enum,
        title: "Effect Style",
        options: [
            "blur",
            "wave",
            "pixel",
            "glitch",
            "liquid",
            "halftone",
            "thermal",
            "film",
            "crt",
            "duotone",
        ],
        optionTitles: [
            "Blur Reveal",
            "Gradient Wave",
            "Pixel Distortion",
            "RGB Glitch",
            "Liquid Refraction",
            "Halftone Print",
            "Thermal Vision",
            "Analog Film",
            "CRT Scanlines",
            "Duotone Poster",
        ],
        defaultValue: "blur",
    },
    overlayDarkness: {
        type: ControlType.Number,
        title: "Darkness",
        defaultValue: 45,
        min: 0,
        max: 90,
        step: 1,
        unit: "%",
    },
    vignette: {
        type: ControlType.Boolean,
        title: "Vignette",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    // --- 3A. EFFECT SETTINGS: BLUR REVEAL ---
    blurIntensity: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 14,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        hidden: (props: RevealFXProps) =>
            (props.effectStyle ?? "blur") !== "blur",
    },
    grayscale: {
        type: ControlType.Boolean,
        title: "Grayscale",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props: RevealFXProps) =>
            (props.effectStyle ?? "blur") !== "blur",
    },
    enableTint: {
        type: ControlType.Boolean,
        title: "Color Tint",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props: RevealFXProps) =>
            (props.effectStyle ?? "blur") !== "blur",
    },
    tintColor: {
        type: ControlType.Color,
        title: "Tint Color",
        defaultValue: "#1a2436",
        hidden: (props: RevealFXProps) =>
            (props.effectStyle ?? "blur") !== "blur" || !props.enableTint,
    },
    tintIntensity: {
        type: ControlType.Number,
        title: "Tint Intensity",
        defaultValue: 25,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) =>
            (props.effectStyle ?? "blur") !== "blur" || !props.enableTint,
    },

    // --- 3B. EFFECT SETTINGS: GRADIENT WAVE ---
    waveColor1: {
        type: ControlType.Color,
        title: "Wave Color 1",
        defaultValue: "#6366f1",
        hidden: (props: RevealFXProps) => props.effectStyle !== "wave",
    },
    waveColor2: {
        type: ControlType.Color,
        title: "Wave Color 2",
        defaultValue: "#ec4899",
        hidden: (props: RevealFXProps) => props.effectStyle !== "wave",
    },
    waveColor3: {
        type: ControlType.Color,
        title: "Wave Color 3",
        defaultValue: "#06b6d4",
        hidden: (props: RevealFXProps) => props.effectStyle !== "wave",
    },
    waveIntensity: {
        type: ControlType.Number,
        title: "Wave Intensity",
        defaultValue: 55,
        min: 10,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) => props.effectStyle !== "wave",
    },
    waveSpeed: {
        type: ControlType.Number,
        title: "Wave Speed",
        defaultValue: 50,
        min: 5,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) =>
            props.effectStyle !== "wave" || !props.waveAnimate,
    },
    waveAnimate: {
        type: ControlType.Boolean,
        title: "Animate Wave",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props: RevealFXProps) => props.effectStyle !== "wave",
    },

    // --- 3C. EFFECT SETTINGS: PIXEL DISTORTION ---
    pixelSize: {
        type: ControlType.Number,
        title: "Pixel Size",
        defaultValue: 18,
        min: 4,
        max: 60,
        step: 1,
        unit: "px",
        hidden: (props: RevealFXProps) => props.effectStyle !== "pixel",
    },
    pixelDistortionIntensity: {
        type: ControlType.Number,
        title: "Distortion",
        defaultValue: 40,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) => props.effectStyle !== "pixel",
    },
    pixelAnimate: {
        type: ControlType.Boolean,
        title: "Animate Pixels",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props: RevealFXProps) => props.effectStyle !== "pixel",
    },

    // --- 3D. EFFECT SETTINGS: RGB GLITCH ---
    glitchIntensity: {
        type: ControlType.Number,
        title: "Glitch Intensity",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) => props.effectStyle !== "glitch",
    },
    glitchColorSeparation: {
        type: ControlType.Number,
        title: "RGB Split",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        hidden: (props: RevealFXProps) => props.effectStyle !== "glitch",
    },
    glitchAnimate: {
        type: ControlType.Boolean,
        title: "Animate Glitch",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props: RevealFXProps) => props.effectStyle !== "glitch",
    },

    // --- 3E. EFFECT SETTINGS: LIQUID REFRACTION ---
    liquidRefractionIntensity: {
        type: ControlType.Number,
        title: "Refraction",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) => props.effectStyle !== "liquid",
    },
    liquidWaveScale: {
        type: ControlType.Number,
        title: "Wave Scale",
        defaultValue: 50,
        min: 10,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) => props.effectStyle !== "liquid",
    },
    liquidSpeed: {
        type: ControlType.Number,
        title: "Distortion Speed",
        defaultValue: 45,
        min: 5,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) =>
            props.effectStyle !== "liquid" || !props.liquidAnimate,
    },
    liquidGlossHighlight: {
        type: ControlType.Boolean,
        title: "Gloss Highlight",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props: RevealFXProps) => props.effectStyle !== "liquid",
    },
    liquidAnimate: {
        type: ControlType.Boolean,
        title: "Animated Liquid",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props: RevealFXProps) => props.effectStyle !== "liquid",
    },

    // --- 3F. EFFECT SETTINGS: HALFTONE PRINT ---
    halftoneDotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 10,
        min: 4,
        max: 32,
        step: 1,
        unit: "px",
        hidden: (props: RevealFXProps) => props.effectStyle !== "halftone",
    },
    halftoneContrast: {
        type: ControlType.Number,
        title: "Pattern Contrast",
        defaultValue: 60,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) => props.effectStyle !== "halftone",
    },
    halftoneIntensity: {
        type: ControlType.Number,
        title: "Halftone Mix",
        defaultValue: 92,
        min: 10,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) => props.effectStyle !== "halftone",
    },
    halftoneColorMode: {
        type: ControlType.Enum,
        title: "Color Mode",
        options: ["monochrome", "duotone"],
        optionTitles: ["Monochrome", "Duotone"],
        defaultValue: "monochrome",
        displaySegmentedControl: true,
        hidden: (props: RevealFXProps) => props.effectStyle !== "halftone",
    },
    halftonePrimaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#111111",
        hidden: (props: RevealFXProps) => props.effectStyle !== "halftone",
    },
    halftoneSecondaryColor: {
        type: ControlType.Color,
        title: "Secondary Color",
        defaultValue: "#f4efe6",
        hidden: (props: RevealFXProps) =>
            props.effectStyle !== "halftone" ||
            props.halftoneColorMode !== "duotone",
    },

    // --- 3G. EFFECT SETTINGS: THERMAL VISION ---
    thermalPalette: {
        type: ControlType.Enum,
        title: "Color Palette",
        options: ["classic", "cyberpunk", "custom"],
        optionTitles: ["Classic Thermal", "Cyberpunk", "Custom"],
        defaultValue: "classic",
        hidden: (props: RevealFXProps) => props.effectStyle !== "thermal",
    },
    thermalIntensity: {
        type: ControlType.Number,
        title: "Thermal Intensity",
        defaultValue: 95,
        min: 10,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) => props.effectStyle !== "thermal",
    },
    thermalShadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "#0a1142",
        hidden: (props: RevealFXProps) =>
            props.effectStyle !== "thermal" ||
            props.thermalPalette !== "custom",
    },
    thermalMidtoneColor: {
        type: ControlType.Color,
        title: "Midtone Color",
        defaultValue: "#c91878",
        hidden: (props: RevealFXProps) =>
            props.effectStyle !== "thermal" ||
            props.thermalPalette !== "custom",
    },
    thermalHighlightColor: {
        type: ControlType.Color,
        title: "Highlight Color",
        defaultValue: "#ffbe0b",
        hidden: (props: RevealFXProps) =>
            props.effectStyle !== "thermal" ||
            props.thermalPalette !== "custom",
    },
    thermalContrast: {
        type: ControlType.Number,
        title: "Contrast",
        defaultValue: 55,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) => props.effectStyle !== "thermal",
    },
    thermalMappingIntensity: {
        type: ControlType.Number,
        title: "Mapping Mix",
        defaultValue: 92,
        min: 10,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) => props.effectStyle !== "thermal",
    },

    // --- 3H. EFFECT SETTINGS: ANALOG FILM ---
    filmPreset: {
        type: ControlType.Enum,
        title: "Film Preset",
        options: ["neutral", "warm", "cool"],
        optionTitles: ["Neutral", "Warm Film", "Cool Film"],
        defaultValue: "warm",
        hidden: (props: RevealFXProps) => props.effectStyle !== "film",
    },
    filmGrainIntensity: {
        type: ControlType.Number,
        title: "Grain Intensity",
        defaultValue: 45,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) => props.effectStyle !== "film",
    },
    filmGrainSize: {
        type: ControlType.Number,
        title: "Grain Size",
        defaultValue: 35,
        min: 10,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) => props.effectStyle !== "film",
    },
    filmContrast: {
        type: ControlType.Number,
        title: "Contrast",
        defaultValue: 55,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) => props.effectStyle !== "film",
    },
    filmTemperature: {
        type: ControlType.Number,
        title: "Temperature",
        defaultValue: 20,
        min: -100,
        max: 100,
        step: 1,
        hidden: (props: RevealFXProps) => props.effectStyle !== "film",
    },
    filmVignetteIntensity: {
        type: ControlType.Number,
        title: "Film Vignette",
        defaultValue: 55,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) => props.effectStyle !== "film",
    },
    filmAnimate: {
        type: ControlType.Boolean,
        title: "Animated Grain",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props: RevealFXProps) => props.effectStyle !== "film",
    },

    // --- 3I. EFFECT SETTINGS: CRT SCANLINES ---
    crtScanlineDensity: {
        type: ControlType.Number,
        title: "Line Density",
        defaultValue: 55,
        min: 10,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) => props.effectStyle !== "crt",
    },
    crtScanlineOpacity: {
        type: ControlType.Number,
        title: "Line Opacity",
        defaultValue: 65,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) => props.effectStyle !== "crt",
    },
    crtScanlineThickness: {
        type: ControlType.Number,
        title: "Line Thickness",
        defaultValue: 50,
        min: 10,
        max: 90,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) => props.effectStyle !== "crt",
    },
    crtContrast: {
        type: ControlType.Number,
        title: "Screen Contrast",
        defaultValue: 60,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) => props.effectStyle !== "crt",
    },
    crtSignalDistortion: {
        type: ControlType.Number,
        title: "Signal Distortion",
        defaultValue: 25,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) => props.effectStyle !== "crt",
    },
    crtAnimate: {
        type: ControlType.Boolean,
        title: "Animated Signal",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props: RevealFXProps) => props.effectStyle !== "crt",
    },

    // --- 3J. EFFECT SETTINGS: DUOTONE POSTER ---
    duotoneShadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "#0b133b",
        hidden: (props: RevealFXProps) => props.effectStyle !== "duotone",
    },
    duotoneHighlightColor: {
        type: ControlType.Color,
        title: "Highlight Color",
        defaultValue: "#ff5500",
        hidden: (props: RevealFXProps) => props.effectStyle !== "duotone",
    },
    duotoneContrast: {
        type: ControlType.Number,
        title: "Contrast",
        defaultValue: 60,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) => props.effectStyle !== "duotone",
    },
    duotoneIntensity: {
        type: ControlType.Number,
        title: "Tonal Intensity",
        defaultValue: 95,
        min: 10,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) => props.effectStyle !== "duotone",
    },
    duotoneSaturation: {
        type: ControlType.Number,
        title: "Saturation",
        defaultValue: 100,
        min: 0,
        max: 150,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) => props.effectStyle !== "duotone",
    },
    duotoneBackgroundBlend: {
        type: ControlType.Boolean,
        title: "Backdrop Blend",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props: RevealFXProps) => props.effectStyle !== "duotone",
    },

    // --- 4. REVEAL STRIP ---
    revealWidth: {
        type: ControlType.Number,
        title: "Reveal Width",
        defaultValue: 10,
        min: 3,
        max: 30,
        step: 0.5,
        unit: "%",
    },
    initialPosition: {
        type: ControlType.Number,
        title: "Initial X",
        defaultValue: 50,
        min: 3,
        max: 97,
        step: 1,
        unit: "%",
    },
    followCursor: {
        type: ControlType.Boolean,
        title: "Follow Cursor",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    edgeHighlight: {
        type: ControlType.Boolean,
        title: "Strip Edge Line",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    // --- 5. CUSTOM CURSOR ---
    enableCustomCursor: {
        type: ControlType.Boolean,
        title: "Custom Cursor",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    cursorIcon: {
        type: ControlType.Enum,
        title: "Cursor Icon",
        options: ["plus", "crosshair", "dotRing"],
        optionTitles: ["Plus (+)", "Crosshair", "Plus Ring"],
        defaultValue: "plus",
        hidden: (props: RevealFXProps) =>
            !(props.enableCustomCursor ?? props.showIcon ?? true),
    },
    cursorSize: {
        type: ControlType.Number,
        title: "Cursor Size",
        defaultValue: 20,
        min: 8,
        max: 64,
        step: 1,
        unit: "px",
        hidden: (props: RevealFXProps) =>
            !(props.enableCustomCursor ?? props.showIcon ?? true),
    },
    cursorStrokeWidth: {
        type: ControlType.Number,
        title: "Cursor Stroke",
        defaultValue: 1.5,
        min: 0.75,
        max: 4,
        step: 0.25,
        unit: "px",
        hidden: (props: RevealFXProps) =>
            !(props.enableCustomCursor ?? props.showIcon ?? true),
    },
    cursorColor: {
        type: ControlType.Color,
        title: "Cursor Color",
        defaultValue: "#FFFFFF",
        hidden: (props: RevealFXProps) =>
            !(props.enableCustomCursor ?? props.showIcon ?? true),
    },
    cursorBackground: {
        type: ControlType.Boolean,
        title: "Cursor Backdrop",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props: RevealFXProps) =>
            !(props.enableCustomCursor ?? props.showIcon ?? true),
    },
    cursorBackgroundColor: {
        type: ControlType.Color,
        title: "Backdrop Color",
        defaultValue: "#000000",
        hidden: (props: RevealFXProps) =>
            !(props.enableCustomCursor ?? props.showIcon ?? true) ||
            !(props.cursorBackground ?? props.iconBackground ?? false),
    },
    cursorBackgroundOpacity: {
        type: ControlType.Number,
        title: "Backdrop Opacity",
        defaultValue: 40,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) =>
            !(props.enableCustomCursor ?? props.showIcon ?? true) ||
            !(props.cursorBackground ?? props.iconBackground ?? false),
    },

    // --- 6. ANIMATION ---
    revealDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.9,
        min: 0.2,
        max: 3.0,
        step: 0.05,
        unit: "s",
    },
    easingPreset: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["cinematic", "expoOut", "quartInOut", "cubicOut", "spring"],
        optionTitles: [
            "Cinematic",
            "Smooth Expo",
            "Dramatic In-Out",
            "Crisp Cubic",
            "Natural Spring",
        ],
        defaultValue: "cinematic",
    },
    cursorSmoothing: {
        type: ControlType.Number,
        title: "Strip Smoothing",
        defaultValue: 65,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: RevealFXProps) => !props.followCursor,
    },
    clickToReveal: {
        type: ControlType.Boolean,
        title: "Click to Reveal",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    clickToReset: {
        type: ControlType.Boolean,
        title: "Click to Reset",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props: RevealFXProps) => !props.clickToReveal,
    },

    // --- 7. LAYOUT & ACCESSIBILITY ---
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "ARIA Label",
        defaultValue: "Interactive image reveal",
    },
})
