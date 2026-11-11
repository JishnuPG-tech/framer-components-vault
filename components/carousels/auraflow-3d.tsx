/**
 * Infinite Gradient 3D Carousel
 *
 * An infinite, draggable 3D image carousel with a living gradient background
 * that picks up the colors of the centered slide.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 700
 */
import * as React from "react"
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { animate, useReducedMotion } from "framer-motion"

// ============================================================================
// TYPES
// ============================================================================

type AspectKey = "4 / 5" | "1 / 1" | "3 / 4" | "16 / 9" | "3 / 2" | "2 / 3"
type GradientMode = "auto" | "custom"
type RGB = [number, number, number]

interface ResponsiveImageValue {
    src?: string
    srcSet?: string
    alt?: string
}

interface SlideItem {
    image?: ResponsiveImageValue
    link?: string
}

interface CardSettings {
    widthPercent: number
    maxWidth: number
    aspectRatio: AspectKey
    radius: number
    gap: number
}

interface DepthSettings {
    perspective: number
    maxRotation: number
    maxDepth: number
    minScale: number
    scaleBoost: number
    edgeBlur: number
}

interface InteractionSettings {
    drag: boolean
    wheel: boolean
    dragSensitivity: number
    wheelSensitivity: number
    inertia: number
    snap: boolean
    autoplay: boolean
    autoplaySpeed: number
    pauseOnHover: boolean
    newTab: boolean
}

interface IntroSettings {
    animate: boolean
    showLoader: boolean
    loaderColor: string
}

interface ColorPair {
    primary: string
    secondary: string
}

interface BackgroundSettings {
    show: boolean
    base: string
    mode: GradientMode
    palette: ColorPair[]
    intensity: number
    blur: number
    speed: number
}

interface Props {
    slides?: SlideItem[]
    card?: Partial<CardSettings>
    depth?: Partial<DepthSettings>
    interaction?: Partial<InteractionSettings>
    intro?: Partial<IntroSettings>
    background?: Partial<BackgroundSettings>
    style?: React.CSSProperties
}

interface GradientPair {
    c1: RGB
    c2: RGB
}

interface Layout {
    stageW: number
    stageH: number
    cardW: number
    cardH: number
    step: number
    track: number
}

interface CardPose {
    x: number
    transform: string
    zIndex: number
    filter: string
    opacity: number
}

interface Stoppable {
    stop: () => void
}

interface BackgroundSurface {
    ctx: CanvasRenderingContext2D
    w: number
    h: number
}

interface RuntimeState {
    scroll: number
    velocity: number
    lastTime: number
    raf: number | null
    pressed: boolean
    dragging: boolean
    pointerId: number
    startX: number
    lastX: number
    lastT: number
    lastDelta: number
    suppressClick: boolean
    hover: boolean
    focused: boolean
    visible: boolean
    locked: boolean
    settled: boolean
    tween: Stoppable | null
    gradTween: Stoppable | null
    introControls: Stoppable[]
    intro: Float32Array | null
    poses: CardPose[]
    lastApplied: number
    lastTrack: number
    activeIndex: number
    grad: number[]
    palette: Array<GradientPair | undefined>
    custom: GradientPair[]
    phase: number
    lastBgDraw: number
    fastUntil: number
    bg: BackgroundSurface | null
}

interface RuntimeConfig {
    layout: Layout
    depth: DepthSettings
    interaction: InteractionSettings
    background: BackgroundSettings
    count: number
    reduced: boolean
    frozen: boolean
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CLASS = "igc3d"

const DRAG_THRESHOLD_PX = 6
const RELEASE_IDLE_MS = 80
const MAX_VELOCITY = 8000
const SNAP_VELOCITY = 60
const AUTOPLAY_RESUME_VELOCITY = 20
const LOAD_TIMEOUT_MS = 4000
const TWEEN_DURATION_S = 0.7

const GRADIENT_TWEEN_S = 0.45
const GRADIENT_FAST_MS = 800
const BG_INTERVAL_FAST_MS = 16
const BG_INTERVAL_IDLE_MS = 33
const BG_PHASE_RATE = 0.2
const BG_BLUR_DPR_THRESHOLD = 8
const BG_SATURATION = 1.05
const BG_PRIMARY_ALPHA = 0.85
const BG_SECONDARY_ALPHA = 0.7

const INTRO_DURATION_S = 0.6
const INTRO_STAGGER_S = 0.05
const INTRO_START_SCALE = 0.92
const INTRO_OFFSET_Y = 40
const INTRO_VISIBLE_RATIO = 0.6

const MAX_CARD_HEIGHT_RATIO = 0.9
const MIN_CARD_SIZE = 40
const PLACEHOLDER_COUNT = 6
const FALLBACK_GRAY: RGB = [128, 128, 128]

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1]
const EASE_OUT_CUBIC: [number, number, number, number] = [0.215, 0.61, 0.355, 1]

const DEFAULT_CARD: CardSettings = {
    widthPercent: 26,
    maxWidth: 360,
    aspectRatio: "4 / 5",
    radius: 15,
    gap: 28,
}

const DEFAULT_DEPTH: DepthSettings = {
    perspective: 1800,
    maxRotation: 28,
    maxDepth: 140,
    minScale: 0.92,
    scaleBoost: 0.1,
    edgeBlur: 2,
}

const DEFAULT_INTERACTION: InteractionSettings = {
    drag: true,
    wheel: true,
    dragSensitivity: 1,
    wheelSensitivity: 0.6,
    inertia: 0.9,
    snap: false,
    autoplay: false,
    autoplaySpeed: 60,
    pauseOnHover: true,
    newTab: false,
}

const DEFAULT_INTRO: IntroSettings = {
    animate: true,
    showLoader: true,
    loaderColor: "#333333",
}

const DEFAULT_PALETTE: ColorPair[] = [
    { primary: "#7C5CFF", secondary: "#B9A8FF" },
    { primary: "#FF6B6B", secondary: "#FFB4A2" },
    { primary: "#2EC4B6", secondary: "#9BE7DF" },
    { primary: "#FFB703", secondary: "#FFE08A" },
]

const DEFAULT_BACKGROUND: BackgroundSettings = {
    show: true,
    base: "#F6F7F9",
    mode: "auto",
    palette: DEFAULT_PALETTE,
    intensity: 1,
    blur: 24,
    speed: 1,
}

const DEFAULT_SLIDES: SlideItem[] = Array.from(
    { length: PLACEHOLDER_COUNT },
    () => ({})
)

const SCOPED_CSS = `
.${CLASS}-root:focus-visible{outline:2px solid #09F;outline-offset:-2px}
.${CLASS}-ring{animation:${CLASS}-spin 1s linear infinite}
@keyframes ${CLASS}-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion: reduce){.${CLASS}-ring{animation-duration:2.4s}}
`

const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

// ============================================================================
// PURE HELPERS
// ============================================================================

const clamp = (v: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, v))

const mod = (n: number, m: number): number => (m > 0 ? ((n % m) + m) % m : 0)

function parseAspect(key: AspectKey): number {
    const [a, b] = key.split("/").map((part) => Number(part.trim()))
    const ratio = a / b
    return Number.isFinite(ratio) && ratio > 0 ? ratio : 0.8
}

function sanitizeCard(card: CardSettings): CardSettings {
    return {
        ...card,
        widthPercent: clamp(card.widthPercent, 5, 100),
        maxWidth: Math.max(MIN_CARD_SIZE, card.maxWidth),
        radius: Math.max(0, card.radius),
        gap: Math.max(0, card.gap),
    }
}

function sanitizeDepth(depth: DepthSettings): DepthSettings {
    return {
        perspective: Math.max(100, depth.perspective),
        maxRotation: clamp(depth.maxRotation, 0, 80),
        maxDepth: clamp(depth.maxDepth, 0, 1000),
        minScale: clamp(depth.minScale, 0.1, 2),
        scaleBoost: clamp(depth.scaleBoost, -1, 2),
        edgeBlur: Math.max(0, depth.edgeBlur),
    }
}

function sanitizeInteraction(ix: InteractionSettings): InteractionSettings {
    return {
        ...ix,
        dragSensitivity: clamp(ix.dragSensitivity, 0.1, 5),
        wheelSensitivity: clamp(ix.wheelSensitivity, 0.05, 5),
        inertia: clamp(ix.inertia, 0.5, 0.995),
        autoplaySpeed: clamp(ix.autoplaySpeed, -2000, 2000),
    }
}

function sanitizeBackground(bg: BackgroundSettings): BackgroundSettings {
    return {
        ...bg,
        palette:
            Array.isArray(bg.palette) && bg.palette.length > 0
                ? bg.palette
                : DEFAULT_PALETTE,
        intensity: clamp(bg.intensity, 0, 1.5),
        blur: Math.max(0, bg.blur),
        speed: Math.max(0, bg.speed),
    }
}

function computeLayout(
    w: number,
    h: number,
    card: CardSettings,
    count: number
): Layout {
    const ratio = parseAspect(card.aspectRatio)
    let cardW = Math.min((w * card.widthPercent) / 100, card.maxWidth)
    cardW = Math.min(cardW, h * MAX_CARD_HEIGHT_RATIO * ratio)
    cardW = Math.max(MIN_CARD_SIZE, cardW)
    const step = cardW + card.gap
    return {
        stageW: w,
        stageH: h,
        cardW,
        cardH: cardW / ratio,
        step,
        track: step * count,
    }
}

function makePose(): CardPose {
    return { x: 0, transform: "", zIndex: 0, filter: "none", opacity: 1 }
}

/**
 * Computes the 3D pose of every card for a given scroll position and writes
 * it into `out`. Returns the index of the card closest to the center.
 */
function computePoses(
    scroll: number,
    layout: Layout,
    depth: DepthSettings,
    count: number,
    intro: Float32Array | null,
    out: CardPose[]
): number {
    while (out.length < count) out.push(makePose())
    out.length = count

    const half = layout.track / 2
    const halfW = Math.max(1, layout.stageW / 2)
    let closest = 0
    let closestDist = Infinity

    for (let i = 0; i < count; i++) {
        let x = i * layout.step - scroll
        if (x < -half) x += layout.track
        else if (x > half) x -= layout.track
        out[i].x = x
        const dist = Math.abs(x)
        if (dist < closestDist) {
            closestDist = dist
            closest = i
        }
    }

    const prev = (closest - 1 + count) % count
    const next = (closest + 1) % count

    for (let i = 0; i < count; i++) {
        const pose = out[i]
        const norm = clamp(pose.x / halfW, -1, 1)
        const inv = 1 - Math.abs(norm)
        const ry = -norm * depth.maxRotation
        const tz = inv * depth.maxDepth
        const scale = depth.minScale + inv * depth.scaleBoost
        const p = intro ? (intro[i] ?? 1) : 1

        if (p < 1) {
            const s = INTRO_START_SCALE + (scale - INTRO_START_SCALE) * p
            const ty = INTRO_OFFSET_Y * (1 - p)
            pose.transform = `translate3d(${pose.x}px,-50%,${tz}px) rotateY(${ry}deg) scale(${s}) translateY(${ty}px)`
            pose.opacity = p
        } else {
            pose.transform = `translate3d(${pose.x}px,-50%,${tz}px) rotateY(${ry}deg) scale(${scale})`
            pose.opacity = 1
        }

        pose.zIndex = Math.round(tz)

        const isCore = i === closest || i === prev || i === next
        const blur = isCore ? 0 : depth.edgeBlur * Math.pow(Math.abs(norm), 1.1)
        pose.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none"
    }

    return closest
}

// ----------------------------------------------------------------------------
// Color utilities
// ----------------------------------------------------------------------------

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    const rn = r / 255
    const gn = g / 255
    const bn = b / 255
    const max = Math.max(rn, gn, bn)
    const min = Math.min(rn, gn, bn)
    const l = (max + min) / 2
    let h = 0
    let s = 0

    if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0)
        else if (max === gn) h = (bn - rn) / d + 2
        else h = (rn - gn) / d + 4
        h /= 6
    }

    return [h * 360, s, l]
}

function hslToRgb(h: number, s: number, l: number): RGB {
    const hn = (((h % 360) + 360) % 360) / 360
    if (s === 0) {
        const v = Math.round(l * 255)
        return [v, v, v]
    }

    const hue2rgb = (p: number, q: number, tIn: number): number => {
        let t = tIn
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    return [
        Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
        Math.round(hue2rgb(p, q, hn) * 255),
        Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
    ]
}

function fallbackPair(idx: number): GradientPair {
    const hue = (Math.abs(idx) * 37) % 360
    return { c1: hslToRgb(hue, 0.65, 0.52), c2: hslToRgb(hue, 0.65, 0.72) }
}

const rgbCss = (c: RGB): string => `rgb(${c[0]},${c[1]},${c[2]})`

/** Resolves any CSS color (hex, rgba, Framer color token variable) to RGB. */
function resolveColor(host: HTMLElement, value: string): RGB {
    const probe = document.createElement("span")
    probe.style.color = value
    probe.style.display = "none"
    host.appendChild(probe)
    const computed = getComputedStyle(probe).color
    host.removeChild(probe)

    const nums = computed.match(/[\d.]+/g)
    if (!nums || nums.length < 3) return FALLBACK_GRAY
    const scale = computed.startsWith("color(") ? 255 : 1
    const rgb = nums.slice(0, 3).map((n) => Math.round(Number(n) * scale))
    if (rgb.some((n) => !Number.isFinite(n))) return FALLBACK_GRAY
    return [rgb[0], rgb[1], rgb[2]]
}

/** Extracts two dominant, vivid colors from an image via a hue/saturation histogram. */
function extractColors(img: HTMLImageElement, idx: number): GradientPair {
    try {
        const MAX = 48
        const ratio =
            img.naturalWidth && img.naturalHeight
                ? img.naturalWidth / img.naturalHeight
                : 1
        const tw = ratio >= 1 ? MAX : Math.max(16, Math.round(MAX * ratio))
        const th = ratio >= 1 ? Math.max(16, Math.round(MAX / ratio)) : MAX

        const canvas = document.createElement("canvas")
        canvas.width = tw
        canvas.height = th
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return fallbackPair(idx)
        ctx.drawImage(img, 0, 0, tw, th)
        const data = ctx.getImageData(0, 0, tw, th).data

        const H_BINS = 36
        const S_BINS = 5
        const SIZE = H_BINS * S_BINS
        const wSum = new Float32Array(SIZE)
        const rSum = new Float32Array(SIZE)
        const gSum = new Float32Array(SIZE)
        const bSum = new Float32Array(SIZE)

        for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3] / 255
            if (a < 0.05) continue

            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]
            const [h, s, l] = rgbToHsl(r, g, b)
            if (l < 0.1 || l > 0.92 || s < 0.08) continue

            const w = a * (s * s) * (1 - Math.abs(l - 0.5) * 0.6)
            const hi = clamp(Math.floor((h / 360) * H_BINS), 0, H_BINS - 1)
            const si = clamp(Math.floor(s * S_BINS), 0, S_BINS - 1)
            const bin = hi * S_BINS + si

            wSum[bin] += w
            rSum[bin] += r * w
            gSum[bin] += g * w
            bSum[bin] += b * w
        }

        let pIdx = -1
        let pW = 0
        for (let i = 0; i < SIZE; i++) {
            if (wSum[i] > pW) {
                pW = wSum[i]
                pIdx = i
            }
        }
        if (pIdx < 0 || pW <= 0) return fallbackPair(idx)

        const pHue = Math.floor(pIdx / S_BINS) * (360 / H_BINS)

        let sIdx = -1
        let sW = 0
        for (let i = 0; i < SIZE; i++) {
            const w = wSum[i]
            if (w <= 0) continue
            const h = Math.floor(i / S_BINS) * (360 / H_BINS)
            let dh = Math.abs(h - pHue)
            dh = Math.min(dh, 360 - dh)
            if (dh >= 25 && w > sW) {
                sW = w
                sIdx = i
            }
        }

        const avg = (bin: number): RGB => {
            const w = wSum[bin] || 1e-6
            return [
                Math.round(rSum[bin] / w),
                Math.round(gSum[bin] / w),
                Math.round(bSum[bin] / w),
            ]
        }

        const [pr, pg, pb] = avg(pIdx)
        const [h1, rawS1] = rgbToHsl(pr, pg, pb)
        const s1 = clamp(rawS1 * 1.15, 0.45, 1)
        const c1 = hslToRgb(h1, s1, 0.5)

        let c2: RGB
        if (sIdx >= 0 && sW >= pW * 0.6) {
            const [sr, sg, sb] = avg(sIdx)
            const [h2, rawS2] = rgbToHsl(sr, sg, sb)
            c2 = hslToRgb(h2, clamp(rawS2 * 1.05, 0.45, 1), 0.72)
        } else {
            c2 = hslToRgb(h1, s1, 0.72)
        }

        return { c1, c2 }
    } catch {
        // Cross-origin images can taint the canvas; fall back to index hues.
        return fallbackPair(idx)
    }
}

function pairFor(
    rt: RuntimeState,
    mode: GradientMode,
    idx: number
): GradientPair {
    if (mode === "custom" && rt.custom.length > 0) {
        return rt.custom[mod(idx, rt.custom.length)]
    }
    return rt.palette[idx] ?? fallbackPair(idx)
}

// ----------------------------------------------------------------------------
// Background painting
// ----------------------------------------------------------------------------

function paintBlob(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    x: number,
    y: number,
    radius: number,
    grad: number[],
    offset: number,
    alpha: number
): void {
    const r = Math.round(grad[offset])
    const g = Math.round(grad[offset + 1])
    const b = Math.round(grad[offset + 2])
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, `rgba(${r},${g},${b},${alpha})`)
    gradient.addColorStop(1, `rgba(${r},${g},${b},0)`)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)
}

function paintGradient(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    grad: number[],
    phase: number,
    intensity: number
): void {
    ctx.clearRect(0, 0, w, h)

    const cx = w * 0.5
    const cy = h * 0.5
    const small = Math.min(w, h)
    const large = Math.max(w, h)
    const a1 = small * 0.35
    const a2 = small * 0.28

    const x1 = cx + Math.cos(phase) * a1
    const y1 = cy + Math.sin(phase * 0.8) * a1 * 0.4
    const x2 = cx + Math.cos(-phase * 0.9 + 1.2) * a2
    const y2 = cy + Math.sin(-phase * 0.7 + 0.7) * a2 * 0.5

    paintBlob(
        ctx,
        w,
        h,
        x1,
        y1,
        large * 0.75,
        grad,
        0,
        clamp(BG_PRIMARY_ALPHA * intensity, 0, 1)
    )
    paintBlob(
        ctx,
        w,
        h,
        x2,
        y2,
        large * 0.65,
        grad,
        3,
        clamp(BG_SECONDARY_ALPHA * intensity, 0, 1)
    )
}

function createState(): RuntimeState {
    return {
        scroll: 0,
        velocity: 0,
        lastTime: 0,
        raf: null,
        pressed: false,
        dragging: false,
        pointerId: -1,
        startX: 0,
        lastX: 0,
        lastT: 0,
        lastDelta: 0,
        suppressClick: false,
        hover: false,
        focused: false,
        visible: true,
        locked: false,
        settled: true,
        tween: null,
        gradTween: null,
        introControls: [],
        intro: null,
        poses: [],
        lastApplied: -1,
        lastTrack: 0,
        activeIndex: -1,
        grad: [240, 240, 240, 235, 235, 235],
        palette: [],
        custom: [],
        phase: 0,
        lastBgDraw: 0,
        fastUntil: 0,
        bg: null,
    }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function InfiniteGradientCarousel(props: Props) {
    const isStatic = useIsStaticRenderer()
    const reducedMotion = !!useReducedMotion()
    const frozen = isStatic || RenderTarget.current() === RenderTarget.canvas

    // ---- Settings (merged with defaults, sanitized) ------------------------
    const slides = useMemo<SlideItem[]>(
        () =>
            Array.isArray(props.slides) && props.slides.length > 0
                ? props.slides
                : DEFAULT_SLIDES,
        [props.slides]
    )
    const card = useMemo(
        () => sanitizeCard({ ...DEFAULT_CARD, ...props.card }),
        [props.card]
    )
    const depth = useMemo(
        () => sanitizeDepth({ ...DEFAULT_DEPTH, ...props.depth }),
        [props.depth]
    )
    const interaction = useMemo(
        () =>
            sanitizeInteraction({
                ...DEFAULT_INTERACTION,
                ...props.interaction,
            }),
        [props.interaction]
    )
    const intro = useMemo(
        () => ({ ...DEFAULT_INTRO, ...props.intro }),
        [props.intro]
    )
    const background = useMemo(
        () =>
            sanitizeBackground({
                ...DEFAULT_BACKGROUND,
                ...props.background,
            }),
        [props.background]
    )

    const count = slides.length
    const slideKey = useMemo(
        () => slides.map((s) => s.image?.src ?? "").join("|"),
        [slides]
    )
    const paletteKey = useMemo(
        () =>
            background.palette
                .map((p) => `${p.primary}/${p.secondary}`)
                .join("|"),
        [background.palette]
    )

    // ---- Refs & state -------------------------------------------------------
    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const cardRefs = useRef<Array<HTMLDivElement | null>>([])
    const imgRefs = useRef<Array<HTMLImageElement | null>>([])
    const [rt] = useState(createState)

    const [size, setSize] = useState({ w: 1200, h: 700 })
    const [ready, setReady] = useState(false)
    const [entered, setEntered] = useState(false)

    const layout = useMemo(
        () => computeLayout(size.w, size.h, card, count),
        [size.w, size.h, card, count]
    )

    const introEnabled = !frozen && intro.animate && !reducedMotion

    const cfgRef = useRef<RuntimeConfig>({
        layout,
        depth,
        interaction,
        background,
        count,
        reduced: reducedMotion,
        frozen,
    })
    cfgRef.current = {
        layout,
        depth,
        interaction,
        background,
        count,
        reduced: reducedMotion,
        frozen,
    }

    // Initial poses are rendered inline so thumbnails / SSR show a real layout.
    const initialPoses = useMemo(() => {
        const out: CardPose[] = []
        computePoses(0, layout, depth, count, null, out)
        return out
    }, [layout, depth, count])

    // ---- Imperative core ----------------------------------------------------
    const paintBackground = useCallback(() => {
        const cfg = cfgRef.current
        if (!rt.bg || !cfg.background.show) return
        paintGradient(
            rt.bg.ctx,
            rt.bg.w,
            rt.bg.h,
            rt.grad,
            rt.phase,
            cfg.background.intensity
        )
    }, [rt])

    const refreshGradient = useCallback(
        (instant?: boolean) => {
            const cfg = cfgRef.current
            if (rt.activeIndex < 0) return

            const pair = pairFor(rt, cfg.background.mode, rt.activeIndex)
            const to = [...pair.c1, ...pair.c2]

            rt.gradTween?.stop()
            rt.gradTween = null

            if (instant || cfg.reduced || cfg.frozen) {
                for (let k = 0; k < 6; k++) rt.grad[k] = to[k]
                paintBackground()
                return
            }

            const from = rt.grad.slice()
            rt.fastUntil = performance.now() + GRADIENT_FAST_MS
            rt.gradTween = animate(0, 1, {
                duration: GRADIENT_TWEEN_S,
                ease: "easeOut",
                onUpdate: (p: number) => {
                    for (let k = 0; k < 6; k++) {
                        rt.grad[k] = from[k] + (to[k] - from[k]) * p
                    }
                },
            })
        },
        [rt, paintBackground]
    )

    /** Writes card transforms to the DOM and updates the active gradient. */
    const syncPoses = useCallback(() => {
        const cfg = cfgRef.current
        const closest = computePoses(
            rt.scroll,
            cfg.layout,
            cfg.depth,
            cfg.count,
            rt.intro,
            rt.poses
        )
        rt.lastApplied = rt.scroll

        for (let i = 0; i < cfg.count; i++) {
            const el = cardRefs.current[i]
            if (!el) continue
            const pose = rt.poses[i]
            el.style.transform = pose.transform
            el.style.zIndex = String(pose.zIndex)
            el.style.filter = pose.filter
            if (rt.intro) el.style.opacity = String(pose.opacity)
        }

        if (closest !== rt.activeIndex) {
            rt.activeIndex = closest
            refreshGradient()
        }
    }, [rt, refreshGradient])

    // ---- Measure container --------------------------------------------------
    useEffect(() => {
        const root = rootRef.current
        if (!root) return

        const measure = () => {
            const w = Math.round(root.clientWidth)
            const h = Math.round(root.clientHeight)
            if (w > 0 && h > 0) {
                setSize((prev) =>
                    prev.w === w && prev.h === h ? prev : { w, h }
                )
            }
        }

        measure()
        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", measure)
            return () => window.removeEventListener("resize", measure)
        }
        const observer = new ResizeObserver(measure)
        observer.observe(root)
        return () => observer.disconnect()
    }, [])

    // ---- Resolve custom palette colors (supports Framer color tokens) -------
    useIsoLayoutEffect(() => {
        const root = rootRef.current
        if (!root) return
        rt.custom = background.palette.map((p) => ({
            c1: resolveColor(root, p.primary),
            c2: resolveColor(root, p.secondary),
        }))
        refreshGradient()
    }, [paletteKey, background.mode, rt, refreshGradient])

    // ---- Sync background canvas size ---------------------------------------
    const bgPad = Math.ceil(background.blur * 2)
    const bgW = layout.stageW + bgPad * 2
    const bgH = layout.stageH + bgPad * 2

    useIsoLayoutEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas ? canvas.getContext("2d") : null
        if (!canvas || !ctx) {
            rt.bg = null
            return
        }
        const dpr =
            background.blur >= BG_BLUR_DPR_THRESHOLD
                ? 1
                : Math.min(2, window.devicePixelRatio || 1)
        canvas.width = Math.max(1, Math.floor(bgW * dpr))
        canvas.height = Math.max(1, Math.floor(bgH * dpr))
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        rt.bg = { ctx, w: bgW, h: bgH }
        paintBackground()
    }, [
        bgW,
        bgH,
        background.blur,
        background.show,
        isStatic,
        rt,
        paintBackground,
    ])

    // ---- Apply poses on any layout / depth change --------------------------
    useIsoLayoutEffect(() => {
        if (rt.lastTrack > 0 && rt.lastTrack !== layout.track) {
            rt.scroll = mod(
                (rt.scroll / rt.lastTrack) * layout.track,
                layout.track
            )
        }
        rt.lastTrack = layout.track
        syncPoses()
    }, [layout, depth, count, slideKey, rt, syncPoses])

    // ---- Wait for images ----------------------------------------------------
    useEffect(() => {
        let done = false
        let pending = 0
        const cleanups: Array<() => void> = []

        const finish = () => {
            if (done) return
            done = true
            setReady(true)
        }

        for (let i = 0; i < count; i++) {
            const el = imgRefs.current[i]
            if (!el || el.complete) continue
            pending++
            const onDone = () => {
                pending--
                if (pending <= 0) finish()
            }
            el.addEventListener("load", onDone, { once: true })
            el.addEventListener("error", onDone, { once: true })
            cleanups.push(() => {
                el.removeEventListener("load", onDone)
                el.removeEventListener("error", onDone)
            })
        }

        if (pending === 0) finish()
        const timer = window.setTimeout(finish, LOAD_TIMEOUT_MS)

        return () => {
            done = true
            window.clearTimeout(timer)
            cleanups.forEach((fn) => fn())
        }
    }, [slideKey, count])

    // ---- Extract gradient colors from images (auto mode) --------------------
    useEffect(() => {
        if (isStatic || !ready || background.mode !== "auto") return

        let cancelled = false
        rt.palette = []
        refreshGradient()

        slides.forEach((slide, i) => {
            const src = slide.image?.src
            if (!src) return
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.decoding = "async"
            img.onload = () => {
                if (cancelled) return
                rt.palette[i] = extractColors(img, i)
                if (rt.activeIndex === i) refreshGradient()
            }
            img.src = src
        })

        return () => {
            cancelled = true
        }
    }, [
        ready,
        isStatic,
        background.mode,
        slideKey,
        slides,
        rt,
        refreshGradient,
    ])

    // ---- Intro animation ----------------------------------------------------
    useEffect(() => {
        if (!ready || !introEnabled || entered) return

        const cfg = cfgRef.current
        computePoses(
            rt.scroll,
            cfg.layout,
            cfg.depth,
            cfg.count,
            null,
            rt.poses
        )

        const visible: number[] = []
        for (let i = 0; i < cfg.count; i++) {
            if (
                Math.abs(rt.poses[i].x) <
                cfg.layout.stageW * INTRO_VISIBLE_RATIO
            ) {
                visible.push(i)
            }
        }
        visible.sort((a, b) => rt.poses[a].x - rt.poses[b].x)

        const finish = () => {
            rt.intro = null
            rt.locked = false
            syncPoses()
            setEntered(true)
        }

        if (visible.length === 0) {
            finish()
            return
        }

        const progress = new Float32Array(cfg.count).fill(1)
        visible.forEach((i) => {
            progress[i] = 0
        })
        rt.intro = progress
        rt.locked = true
        syncPoses()

        rt.introControls = visible.map((cardIndex, order) =>
            animate(0, 1, {
                duration: INTRO_DURATION_S,
                delay: order * INTRO_STAGGER_S,
                ease: EASE_OUT_CUBIC,
                onUpdate: (v: number) => {
                    progress[cardIndex] = v
                },
                onComplete: () => {
                    if (order === visible.length - 1) finish()
                },
            })
        )

        return () => {
            rt.introControls.forEach((c) => c.stop())
            rt.introControls = []
            rt.intro = null
            rt.locked = false
        }
    }, [ready, introEnabled, entered, rt, syncPoses])

    // ---- Live loop, input and visibility (not in static/canvas) -------------
    useEffect(() => {
        const root = rootRef.current
        if (!root || frozen) return

        const stopTween = () => {
            rt.tween?.stop()
            rt.tween = null
        }

        const tweenTo = (target: number) => {
            stopTween()
            const { track } = cfgRef.current.layout
            if (cfgRef.current.reduced) {
                rt.scroll = mod(target, track)
                syncPoses()
                return
            }
            rt.tween = animate(rt.scroll, target, {
                duration: TWEEN_DURATION_S,
                ease: EASE_OUT_EXPO,
                onUpdate: (v: number) => {
                    rt.scroll = mod(v, cfgRef.current.layout.track)
                },
                onComplete: () => {
                    rt.tween = null
                },
            })
        }

        const goTo = (delta: number) => {
            const { step } = cfgRef.current.layout
            rt.velocity = 0
            rt.settled = true
            tweenTo((Math.round(rt.scroll / step) + delta) * step)
        }

        // -- Frame loop --
        const frame = (t: number) => {
            rt.raf = requestAnimationFrame(frame)
            const dt = rt.lastTime
                ? Math.min(0.05, (t - rt.lastTime) / 1000)
                : 0
            rt.lastTime = t

            const cfg = cfgRef.current
            const ix = cfg.interaction
            const { track, step } = cfg.layout

            if (!rt.dragging && !rt.tween && !rt.locked) {
                if (rt.velocity !== 0) {
                    rt.scroll = mod(rt.scroll + rt.velocity * dt, track)
                    rt.velocity *= Math.pow(ix.inertia, dt * 60)
                    if (Math.abs(rt.velocity) < 0.02) rt.velocity = 0
                }

                const paused = ix.pauseOnHover && (rt.hover || rt.focused)
                if (
                    ix.autoplay &&
                    !cfg.reduced &&
                    !paused &&
                    Math.abs(rt.velocity) < AUTOPLAY_RESUME_VELOCITY
                ) {
                    rt.scroll = mod(rt.scroll + ix.autoplaySpeed * dt, track)
                }

                if (
                    ix.snap &&
                    !ix.autoplay &&
                    !rt.settled &&
                    Math.abs(rt.velocity) < SNAP_VELOCITY
                ) {
                    rt.settled = true
                    rt.velocity = 0
                    tweenTo(Math.round(rt.scroll / step) * step)
                }
            }

            if (rt.scroll !== rt.lastApplied || rt.intro) syncPoses()

            // Background
            const speed = cfg.reduced ? 0 : cfg.background.speed
            rt.phase += dt * BG_PHASE_RATE * speed
            const fast = t < rt.fastUntil
            if (cfg.background.show && rt.bg && (speed > 0 || fast)) {
                const interval = fast
                    ? BG_INTERVAL_FAST_MS
                    : BG_INTERVAL_IDLE_MS
                if (t - rt.lastBgDraw >= interval) {
                    rt.lastBgDraw = t
                    paintBackground()
                }
            }
        }

        const start = () => {
            if (rt.raf !== null) return
            rt.lastTime = 0
            rt.raf = requestAnimationFrame(frame)
        }
        const stop = () => {
            if (rt.raf !== null) cancelAnimationFrame(rt.raf)
            rt.raf = null
        }
        const updateRunning = () => {
            if (rt.visible && !document.hidden) start()
            else stop()
        }

        // -- Input --
        const onWheel = (e: WheelEvent) => {
            const ix = cfgRef.current.interaction
            if (!ix.wheel || rt.locked) return
            e.preventDefault()
            stopTween()
            const raw =
                Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
            const delta = e.deltaMode === 1 ? raw * 16 : raw
            rt.velocity = clamp(
                rt.velocity + delta * ix.wheelSensitivity * 20,
                -MAX_VELOCITY,
                MAX_VELOCITY
            )
            rt.settled = false
        }

        const onPointerDown = (e: PointerEvent) => {
            const ix = cfgRef.current.interaction
            if (!ix.drag || rt.locked) return
            if (e.pointerType === "mouse" && e.button !== 0) return
            rt.pressed = true
            rt.dragging = false
            rt.pointerId = e.pointerId
            rt.startX = e.clientX
            rt.lastX = e.clientX
            rt.lastT = performance.now()
            rt.lastDelta = 0
        }

        const onPointerMove = (e: PointerEvent) => {
            if (!rt.pressed || e.pointerId !== rt.pointerId) return
            const ix = cfgRef.current.interaction

            if (!rt.dragging) {
                if (Math.abs(e.clientX - rt.startX) < DRAG_THRESHOLD_PX) return
                rt.dragging = true
                rt.suppressClick = true
                rt.velocity = 0
                rt.settled = false
                stopTween()
                root.setPointerCapture(e.pointerId)
                root.style.cursor = "grabbing"
            }

            const now = performance.now()
            const dx = e.clientX - rt.lastX
            const dt = Math.max(1, now - rt.lastT) / 1000
            rt.scroll = mod(
                rt.scroll - dx * ix.dragSensitivity,
                cfgRef.current.layout.track
            )
            rt.lastDelta = dx / dt
            rt.lastX = e.clientX
            rt.lastT = now
        }

        const endPointer = (e: PointerEvent) => {
            if (e.pointerId !== rt.pointerId) return
            const wasDragging = rt.dragging
            rt.pressed = false
            rt.dragging = false
            if (!wasDragging) return

            const ix = cfgRef.current.interaction
            try {
                root.releasePointerCapture(e.pointerId)
            } catch {
                // Capture may already be released by the browser.
            }
            const idle = performance.now() - rt.lastT
            rt.velocity =
                idle > RELEASE_IDLE_MS
                    ? 0
                    : clamp(
                          -rt.lastDelta * ix.dragSensitivity,
                          -MAX_VELOCITY,
                          MAX_VELOCITY
                      )
            rt.settled = false
            root.style.cursor = "grab"
            window.setTimeout(() => {
                rt.suppressClick = false
            }, 0)
        }

        const onClickCapture = (e: MouseEvent) => {
            if (!rt.suppressClick) return
            e.preventDefault()
            e.stopPropagation()
        }

        const onKeyDown = (e: KeyboardEvent) => {
            if (rt.locked) return
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault()
                goTo(e.key === "ArrowRight" ? 1 : -1)
            }
        }

        const onPointerEnter = (e: PointerEvent) => {
            if (e.pointerType === "mouse") rt.hover = true
        }
        const onPointerLeave = () => {
            rt.hover = false
        }
        const onFocusIn = () => {
            rt.focused = true
        }
        const onFocusOut = () => {
            rt.focused = false
        }
        const onDragStart = (e: DragEvent) => e.preventDefault()

        root.addEventListener("wheel", onWheel, { passive: false })
        root.addEventListener("pointerdown", onPointerDown)
        root.addEventListener("pointermove", onPointerMove)
        root.addEventListener("pointerup", endPointer)
        root.addEventListener("pointercancel", endPointer)
        root.addEventListener("click", onClickCapture, true)
        root.addEventListener("keydown", onKeyDown)
        root.addEventListener("pointerenter", onPointerEnter)
        root.addEventListener("pointerleave", onPointerLeave)
        root.addEventListener("focusin", onFocusIn)
        root.addEventListener("focusout", onFocusOut)
        root.addEventListener("dragstart", onDragStart)
        document.addEventListener("visibilitychange", updateRunning)

        let observer: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            observer = new IntersectionObserver((entries) => {
                rt.visible = entries.some((entry) => entry.isIntersecting)
                updateRunning()
            })
            observer.observe(root)
        }

        updateRunning()

        return () => {
            stop()
            stopTween()
            rt.gradTween?.stop()
            rt.gradTween = null
            observer?.disconnect()
            root.removeEventListener("wheel", onWheel)
            root.removeEventListener("pointerdown", onPointerDown)
            root.removeEventListener("pointermove", onPointerMove)
            root.removeEventListener("pointerup", endPointer)
            root.removeEventListener("pointercancel", endPointer)
            root.removeEventListener("click", onClickCapture, true)
            root.removeEventListener("keydown", onKeyDown)
            root.removeEventListener("pointerenter", onPointerEnter)
            root.removeEventListener("pointerleave", onPointerLeave)
            root.removeEventListener("focusin", onFocusIn)
            root.removeEventListener("focusout", onFocusOut)
            root.removeEventListener("dragstart", onDragStart)
            document.removeEventListener("visibilitychange", updateRunning)
        }
    }, [frozen, rt, syncPoses, paintBackground])

    // ---- Render ---------------------------------------------------------------
    const cardOpacity = introEnabled && !entered ? 0 : 1
    const showLoader = intro.showLoader && !frozen
    const interactive = !frozen

    const staticGradient = useMemo(() => {
        if (!isStatic || !background.show) return ""
        const first = background.palette[0]
        const [c1, c2] =
            background.mode === "custom" && first
                ? [first.primary, first.secondary]
                : (() => {
                      const f = fallbackPair(0)
                      return [rgbCss(f.c1), rgbCss(f.c2)]
                  })()
        return `radial-gradient(circle at 42% 46%, ${c1} 0%, transparent 75%), radial-gradient(circle at 60% 54%, ${c2} 0%, transparent 65%)`
    }, [isStatic, background.show, background.mode, background.palette])

    const backgroundFilter = `blur(${background.blur}px) saturate(${BG_SATURATION})`

    return (
        <div
            ref={rootRef}
            className={`${CLASS}-root`}
            role="region"
            aria-roledescription="carousel"
            aria-label="Image carousel"
            tabIndex={interactive ? 0 : undefined}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                isolation: "isolate",
                perspective: depth.perspective,
                background: background.base,
                touchAction: "pan-y",
                userSelect: "none",
                WebkitUserSelect: "none",
                cursor: interactive && interaction.drag ? "grab" : "default",
            }}
        >
            <style>{SCOPED_CSS}</style>

            {background.show &&
                (isStatic ? (
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: -bgPad,
                            backgroundImage: staticGradient,
                            filter: backgroundFilter,
                            opacity: clamp(background.intensity * 0.8, 0, 1),
                            pointerEvents: "none",
                        }}
                    />
                ) : (
                    <canvas
                        ref={canvasRef}
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            left: -bgPad,
                            top: -bgPad,
                            width: bgW,
                            height: bgH,
                            display: "block",
                            filter: backgroundFilter,
                            pointerEvents: "none",
                        }}
                    />
                ))}

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                    transformStyle: "preserve-3d",
                }}
            >
                {slides.map((slide, i) => {
                    const pose = initialPoses[i]
                    const image = slide.image
                    const src = image?.src
                    const hue = (i * 37) % 360

                    const media = src ? (
                        <img
                            ref={(el) => {
                                imgRefs.current[i] = el
                            }}
                            src={src}
                            srcSet={image?.srcSet}
                            sizes={`${Math.round(layout.cardW)}px`}
                            alt={image?.alt ?? ""}
                            draggable={false}
                            decoding="async"
                            loading="eager"
                            style={{
                                display: "block",
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                pointerEvents: "none",
                            }}
                        />
                    ) : (
                        <div
                            role="img"
                            aria-label={`Placeholder slide ${i + 1}`}
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "grid",
                                placeItems: "center",
                                color: "rgba(255,255,255,0.85)",
                                fontFamily:
                                    "Inter, system-ui, -apple-system, sans-serif",
                                fontSize: Math.max(12, layout.cardW * 0.28),
                                fontWeight: 600,
                                background: `linear-gradient(160deg, hsl(${hue} 65% 72%), hsl(${hue} 65% 52%))`,
                            }}
                        >
                            {i + 1}
                        </div>
                    )

                    return (
                        <div
                            key={i}
                            ref={(el) => {
                                cardRefs.current[i] = el
                            }}
                            role="group"
                            aria-roledescription="slide"
                            aria-label={`${i + 1} of ${count}`}
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                width: layout.cardW,
                                height: layout.cardH,
                                marginLeft: -layout.cardW / 2,
                                borderRadius: card.radius,
                                overflow: "hidden",
                                isolation: "isolate",
                                backfaceVisibility: "hidden",
                                willChange: "transform",
                                contain: "layout paint",
                                transform: pose.transform,
                                zIndex: pose.zIndex,
                                filter: pose.filter,
                                opacity: cardOpacity,
                            }}
                        >
                            {slide.link ? (
                                <a
                                    href={slide.link}
                                    target={
                                        interaction.newTab
                                            ? "_blank"
                                            : undefined
                                    }
                                    rel={
                                        interaction.newTab
                                            ? "noopener noreferrer"
                                            : undefined
                                    }
                                    draggable={false}
                                    aria-label={
                                        image?.alt || `Open slide ${i + 1}`
                                    }
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        height: "100%",
                                    }}
                                >
                                    {media}
                                </a>
                            ) : (
                                media
                            )}
                        </div>
                    )
                })}
            </div>

            {showLoader && (
                <div
                    role="status"
                    aria-label="Loading"
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 10,
                        display: "grid",
                        placeItems: "center",
                        background: background.base,
                        opacity: ready ? 0 : 1,
                        visibility: ready ? "hidden" : "visible",
                        transition:
                            "opacity 0.2s ease, visibility 0s linear 0.2s",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        className={`${CLASS}-ring`}
                        aria-hidden="true"
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            border: "3px solid rgba(128,128,128,0.25)",
                            borderTopColor: intro.loaderColor,
                        }}
                    />
                </div>
            )}
        </div>
    )
}

InfiniteGradientCarousel.displayName = "AuraFlow 3D"

// ============================================================================
// PROPERTY CONTROLS
// ============================================================================

addPropertyControls(InfiniteGradientCarousel, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        maxCount: 40,
        defaultValue: DEFAULT_SLIDES,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
    },

    card: {
        type: ControlType.Object,
        title: "Card",
        controls: {
            widthPercent: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: DEFAULT_CARD.widthPercent,
                min: 10,
                max: 90,
                step: 1,
                unit: "%",
            },
            maxWidth: {
                type: ControlType.Number,
                title: "Max Width",
                defaultValue: DEFAULT_CARD.maxWidth,
                min: 80,
                max: 1000,
                step: 10,
                unit: "px",
            },
            aspectRatio: {
                type: ControlType.Enum,
                title: "Ratio",
                defaultValue: DEFAULT_CARD.aspectRatio,
                options: [
                    "4 / 5",
                    "1 / 1",
                    "3 / 4",
                    "16 / 9",
                    "3 / 2",
                    "2 / 3",
                ],
                optionTitles: ["4:5", "1:1", "3:4", "16:9", "3:2", "2:3"],
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: DEFAULT_CARD.radius,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: DEFAULT_CARD.gap,
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
            },
        },
    },

    depth: {
        type: ControlType.Object,
        title: "3D Depth",
        controls: {
            perspective: {
                type: ControlType.Number,
                title: "Perspective",
                defaultValue: DEFAULT_DEPTH.perspective,
                min: 400,
                max: 4000,
                step: 50,
                unit: "px",
            },
            maxRotation: {
                type: ControlType.Number,
                title: "Rotation",
                defaultValue: DEFAULT_DEPTH.maxRotation,
                min: 0,
                max: 60,
                step: 1,
                unit: "°",
            },
            maxDepth: {
                type: ControlType.Number,
                title: "Depth",
                defaultValue: DEFAULT_DEPTH.maxDepth,
                min: 0,
                max: 500,
                step: 5,
                unit: "px",
            },
            minScale: {
                type: ControlType.Number,
                title: "Edge Scale",
                defaultValue: DEFAULT_DEPTH.minScale,
                min: 0.4,
                max: 1.2,
                step: 0.01,
            },
            scaleBoost: {
                type: ControlType.Number,
                title: "Center Boost",
                defaultValue: DEFAULT_DEPTH.scaleBoost,
                min: 0,
                max: 0.6,
                step: 0.01,
            },
            edgeBlur: {
                type: ControlType.Number,
                title: "Edge Blur",
                defaultValue: DEFAULT_DEPTH.edgeBlur,
                min: 0,
                max: 12,
                step: 0.5,
                unit: "px",
            },
        },
    },

    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        controls: {
            drag: {
                type: ControlType.Boolean,
                title: "Drag",
                defaultValue: DEFAULT_INTERACTION.drag,
            },
            wheel: {
                type: ControlType.Boolean,
                title: "Wheel",
                defaultValue: DEFAULT_INTERACTION.wheel,
                description:
                    "Captures scrolling over the carousel. Turn off if it sits inside a long scrolling page.",
            },
            dragSensitivity: {
                type: ControlType.Number,
                title: "Drag Speed",
                defaultValue: DEFAULT_INTERACTION.dragSensitivity,
                min: 0.2,
                max: 3,
                step: 0.1,
                hidden: (p: Partial<InteractionSettings>) => p.drag === false,
            },
            wheelSensitivity: {
                type: ControlType.Number,
                title: "Wheel Speed",
                defaultValue: DEFAULT_INTERACTION.wheelSensitivity,
                min: 0.1,
                max: 3,
                step: 0.1,
                hidden: (p: Partial<InteractionSettings>) => p.wheel === false,
            },
            inertia: {
                type: ControlType.Number,
                title: "Inertia",
                defaultValue: DEFAULT_INTERACTION.inertia,
                min: 0.5,
                max: 0.99,
                step: 0.01,
                description: "Higher values glide for longer.",
            },
            snap: {
                type: ControlType.Boolean,
                title: "Snap",
                defaultValue: DEFAULT_INTERACTION.snap,
                description: "Settles on the nearest slide after scrolling.",
                hidden: (p: Partial<InteractionSettings>) => !!p.autoplay,
            },
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: DEFAULT_INTERACTION.autoplay,
            },
            autoplaySpeed: {
                type: ControlType.Number,
                title: "Auto Speed",
                defaultValue: DEFAULT_INTERACTION.autoplaySpeed,
                min: -400,
                max: 400,
                step: 5,
                unit: "px/s",
                hidden: (p: Partial<InteractionSettings>) => !p.autoplay,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Pause Hover",
                defaultValue: DEFAULT_INTERACTION.pauseOnHover,
                hidden: (p: Partial<InteractionSettings>) => !p.autoplay,
            },
            newTab: {
                type: ControlType.Boolean,
                title: "Links in Tab",
                enabledTitle: "New",
                disabledTitle: "Same",
                defaultValue: DEFAULT_INTERACTION.newTab,
            },
        },
    },

    background: {
        type: ControlType.Object,
        title: "Background",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Gradient",
                defaultValue: DEFAULT_BACKGROUND.show,
            },
            base: {
                type: ControlType.Color,
                title: "Base",
                defaultValue: DEFAULT_BACKGROUND.base,
            },
            mode: {
                type: ControlType.Enum,
                title: "Colors",
                defaultValue: DEFAULT_BACKGROUND.mode,
                options: ["auto", "custom"],
                optionTitles: ["From Images", "Custom"],
                displaySegmentedControl: true,
                hidden: (p: Partial<BackgroundSettings>) => p.show === false,
            },
            palette: {
                type: ControlType.Array,
                title: "Palette",
                maxCount: 20,
                defaultValue: DEFAULT_PALETTE,
                control: {
                    type: ControlType.Object,
                    controls: {
                        primary: {
                            type: ControlType.Color,
                            title: "Primary",
                            defaultValue: "#7C5CFF",
                        },
                        secondary: {
                            type: ControlType.Color,
                            title: "Secondary",
                            defaultValue: "#B9A8FF",
                        },
                    },
                },
                description:
                    "Pairs are assigned to slides in order and repeat when there are more slides.",
                hidden: (p: Partial<BackgroundSettings>) =>
                    p.show === false || p.mode !== "custom",
            },
            intensity: {
                type: ControlType.Number,
                title: "Intensity",
                defaultValue: DEFAULT_BACKGROUND.intensity,
                min: 0,
                max: 1.2,
                step: 0.05,
                hidden: (p: Partial<BackgroundSettings>) => p.show === false,
            },
            blur: {
                type: ControlType.Number,
                title: "Blur",
                defaultValue: DEFAULT_BACKGROUND.blur,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                hidden: (p: Partial<BackgroundSettings>) => p.show === false,
            },
            speed: {
                type: ControlType.Number,
                title: "Drift Speed",
                defaultValue: DEFAULT_BACKGROUND.speed,
                min: 0,
                max: 4,
                step: 0.1,
                hidden: (p: Partial<BackgroundSettings>) => p.show === false,
            },
        },
    },

    intro: {
        type: ControlType.Object,
        title: "Intro",
        controls: {
            animate: {
                type: ControlType.Boolean,
                title: "Entry Anim",
                defaultValue: DEFAULT_INTRO.animate,
            },
            showLoader: {
                type: ControlType.Boolean,
                title: "Loader",
                defaultValue: DEFAULT_INTRO.showLoader,
            },
            loaderColor: {
                type: ControlType.Color,
                title: "Loader Color",
                defaultValue: DEFAULT_INTRO.loaderColor,
                hidden: (p: Partial<IntroSettings>) => p.showLoader === false,
            },
        },
    },
})
