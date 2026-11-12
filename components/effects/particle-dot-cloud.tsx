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
    useEffect,
    useRef,
    useState,
    useCallback,
    startTransition,
    type CSSProperties,
    type PointerEvent as ReactPointerEvent,
} from "react"

// ─── Default logo (shown when no file is uploaded) ────────────────────────────

const DEFAULT_SVG = `<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" fill="#67DBFF" d="M32,21.3h21.7V0h-43v0.2L32,21.3z"/>
<path fill-rule="evenodd" clip-rule="evenodd" fill="#01A3FF" d="M32,21.3H10.3v21.3h43v-0.2L32,21.3L32,21.3z"/>
<path fill-rule="evenodd" clip-rule="evenodd" fill="#0162FF" d="M10.3,42.5h21.5V64L10.3,42.5z"/>
</svg>`

// Hard ceiling. Above this the per-frame arc() cost stops being viable on
// mid-range hardware, so the control is capped rather than left to the user.
const MAX_DOTS = 6000
const MOBILE_DOT_CAP = 1500
const MOBILE_BREAKPOINT = 768

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/**
 * Seeded PRNG (mulberry32). Replaces Math.random so the cloud is deterministic:
 * the server render, the client hydration, the editor canvas, the exported
 * thumbnail and every resize all produce the identical arrangement.
 */
function makeRandom(seed: number) {
    let s = seed >>> 0
    return function random() {
        s = (s + 0x6d2b79f5) | 0
        let t = Math.imul(s ^ (s >>> 15), 1 | s)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

/**
 * Framer's Color control does not always hand back a plain hex string — it can
 * return rgb()/rgba(), hsl(), a shorthand hex, or a resolved colour token. A
 * hex-only parser silently turns all of those into black, so anything the
 * browser can understand is parsed here, with a hex fast path and a cached 1x1
 * canvas for the rest.
 */
let colorProbe: CanvasRenderingContext2D | null = null
const colorCache = new Map<string, [number, number, number]>()

function parseColor(input: string): [number, number, number] {
    const value = (input || "").trim()
    if (!value) return [0, 0, 0]

    const cached = colorCache.get(value)
    if (cached) return cached

    let result: [number, number, number] = [0, 0, 0]

    if (value.startsWith("#")) {
        const h = value.slice(1)
        if (h.length === 3 || h.length === 4) {
            result = [
                parseInt(h[0] + h[0], 16),
                parseInt(h[1] + h[1], 16),
                parseInt(h[2] + h[2], 16),
            ]
        } else if (h.length >= 6) {
            result = [
                parseInt(h.slice(0, 2), 16),
                parseInt(h.slice(2, 4), 16),
                parseInt(h.slice(4, 6), 16),
            ]
        }
    } else if (typeof document !== "undefined") {
        if (!colorProbe) {
            const c = document.createElement("canvas")
            c.width = 1
            c.height = 1
            colorProbe = c.getContext("2d", { willReadFrequently: true })
        }
        if (colorProbe) {
            colorProbe.clearRect(0, 0, 1, 1)
            colorProbe.fillStyle = "#000000"
            colorProbe.fillStyle = value
            colorProbe.fillRect(0, 0, 1, 1)
            const d = colorProbe.getImageData(0, 0, 1, 1).data
            result = [d[0], d[1], d[2]]
        }
    }

    if (result.some(Number.isNaN)) result = [0, 0, 0]
    colorCache.set(value, result)
    return result
}

function shiftBrightness(
    r: number,
    g: number,
    b: number,
    offset: number
): [number, number, number] {
    const adj = Math.round(offset * 2.55)
    const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v)
    return [clamp(r + adj), clamp(g + adj), clamp(b + adj)]
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DotData {
    // Geometry — rebuilt only when the source, size or dot count changes.
    x: number
    y: number
    baseX: number
    baseY: number
    angle: number
    driftX: number
    driftY: number
    sizeSeed: number
    parallaxDepth: number // 0 = back layer … 1 = front layer
    br: number // sampled source color, never mutated
    bg: number
    bb: number

    // Appearance — recomputed cheaply when color or size props change.
    cr: number
    cg: number
    cb: number
    rgb: string
    size: number
    radius: number

    // Per-frame scratch.
    proximityFactor: number
}

interface ColorBucket {
    rgb: string
    dots: DotData[]
}

type FileState =
    | { kind: "svg"; content: string }
    | { kind: "image"; blobUrl: string }
    | null

type LoadStatus = "loading" | "ready" | "unreadable"

interface AdvancedProps {
    colorMode?: "sampled" | "custom"
    dotColor?: string
    sizeVariation?: number
    brightnessOffset?: number
    blendMode?: CSSProperties["mixBlendMode"]
}

interface BehaviorProps {
    maxFPS?: number
    settleSpeed?: number
    enableDrift?: boolean
    driftSpeed?: number
    driftAmount?: number
    enableFadeIn?: boolean
    enableParallax?: boolean
    parallaxStrength?: number
    parallaxLayers?: number
    depthGlow?: number
    parallaxEasing?: number
    cursorRadius?: number
    separationForce?: number
    proximitySizeBoost?: number
    proximityFade?: number
    proximityGlow?: number
    allowPageScroll?: boolean
}

interface AccessibilityProps {
    decorative?: boolean
    altText?: string
    respectReducedMotion?: boolean
}

interface Props {
    sourceFile?: string
    dotCount?: number
    dotSize?: number
    dotOpacity?: number
    seed?: number
    advanced?: AdvancedProps
    behavior?: BehaviorProps
    accessibility?: AccessibilityProps
    style?: CSSProperties
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Dot Cloud
 *
 * Upload an SVG or image — dots fill the shape and sample its exact colors.
 * Pointer proximity adds a size boost, fade, glow and multi-layer parallax
 * depth. Works with mouse, touch and pen. Honours prefers-reduced-motion.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 500
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function DotCloud(props: Props) {
    const {
        sourceFile = "",
        dotCount = 1200,
        dotSize = 2,
        dotOpacity = 1,
        seed = 1,
        advanced,
        behavior,
        accessibility,
        style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    // True for every non-interactive render target — editor canvas, thumbnails
    // and image exports. In these the loop never starts; a single resting frame
    // is painted instead. Framer's docs recommend this hook over RenderTarget
    // specifically for animated components, because it also covers export and
    // so prevents the tiling artefacts you get when a component keeps animating
    // mid-export.
    const isStaticTarget = useIsStaticRenderer()

    const {
        colorMode = "sampled",
        dotColor = "#0099FF",
        sizeVariation = 0.5,
        brightnessOffset = 0,
        blendMode = "normal",
    } = advanced ?? {}

    const {
        maxFPS = 60,
        settleSpeed = 1,
        enableDrift = true,
        driftSpeed = 1,
        driftAmount = 4,
        enableFadeIn = true,
        enableParallax = true,
        parallaxStrength = 5,
        parallaxLayers = 3,
        depthGlow = 0.35,
        parallaxEasing = 6,
        cursorRadius = 120,
        separationForce = 1,
        proximitySizeBoost = 1,
        proximityFade = 0,
        proximityGlow = 0.2,
        allowPageScroll = true,
    } = behavior ?? {}

    const {
        decorative = true,
        altText = "",
        respectReducedMotion = true,
    } = accessibility ?? {}

    // ─── Refs ──────────────────────────────────────────────────────────────────

    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const dotsRef = useRef<DotData[]>([])
    const bucketsRef = useRef<ColorBucket[]>([])
    const rafRef = useRef<number | null>(null)
    const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastTimeRef = useRef(0)
    const isVisibleRef = useRef(true)
    const dprRef = useRef(1)
    const isPointerDownRef = useRef(false)
    const isPointerOverRef = useRef(false)
    // Assume hover until the media query says otherwise, so a desktop first
    // paint behaves correctly before the effect runs.
    const hoverCapableRef = useRef(true)
    // False until the pointer has been positioned at least once. Guards the
    // opening sweep described in snapPointer().
    const hasContactRef = useRef(false)
    const parallaxRef = useRef({ x: 0, y: 0 })
    const proximityDotsRef = useRef<DotData[]>([])
    // True while dots are still travelling toward their target. Lets the loop
    // skip painting entirely once everything has come to rest.
    const settlingRef = useRef(true)
    const drawStaticRef = useRef<() => void>(() => {})

    // Live config — the loop reads this each frame so prop changes never
    // restart the animation or rebuild anything.
    const configRef = useRef({
        maxFPS,
        settleSpeed,
        enableDrift,
        driftSpeed,
        driftAmount,
        enableParallax,
        parallaxStrength,
        parallaxEasing,
        cursorRadius,
        separationForce,
        proximitySizeBoost,
        proximityFade,
        proximityGlow,
        dotOpacity,
    })
    configRef.current = {
        maxFPS,
        settleSpeed,
        enableDrift,
        driftSpeed,
        driftAmount,
        enableParallax,
        parallaxStrength,
        parallaxEasing,
        cursorRadius,
        separationForce,
        proximitySizeBoost,
        proximityFade,
        proximityGlow,
        dotOpacity,
    }

    // ─── State ─────────────────────────────────────────────────────────────────

    const pointerX = useMotionValue(0)
    const pointerY = useMotionValue(0)
    const smoothX = useSpring(pointerX, { damping: 20, stiffness: 150 })
    const smoothY = useSpring(pointerY, { damping: 20, stiffness: 150 })

    const [fileState, setFileState] = useState<FileState>(null)
    const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading")
    const [containerSize, setContainerSize] = useState<{
        w: number
        h: number
    } | null>(null)
    // A counter, not a boolean. Every geometry rebuild bumps it, which is what
    // re-triggers the appearance pass. A boolean would flip to true once and
    // then never fire again, leaving the colour buckets pointing at the dot
    // objects from before the last resize.
    const [geometryVersion, setGeometryVersion] = useState(0)
    const dotsReady = geometryVersion > 0
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
    // Resolved after mount only, so the server and client first paint agree.
    const [effectiveDotCount, setEffectiveDotCount] = useState(
        Math.min(dotCount, MAX_DOTS)
    )

    // Motion is frozen when the visitor has asked the OS to reduce motion.
    const motionFrozen = respectReducedMotion && prefersReducedMotion
    const isStatic = isStaticTarget || motionFrozen

    // ─── Reduced-motion preference + hover capability ─────────────────────────
    // Read after mount only. Reading them during render would desync the
    // server-rendered HTML from the client and produce a hydration warning.
    //
    // `(hover: hover)` is false on phones and tablets. Gating hover on this as
    // well as on pointerType matters because some Android browsers report
    // pointerType "mouse" for a real finger — without the media query those
    // devices would fall into hover mode and the effect would stick to the last
    // touched point instead of releasing.

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return

        const motionQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        )
        const hoverQuery = window.matchMedia("(hover: hover)")

        const syncMotion = () => setPrefersReducedMotion(motionQuery.matches)
        const syncHover = () => {
            hoverCapableRef.current = hoverQuery.matches
        }

        syncMotion()
        syncHover()
        motionQuery.addEventListener("change", syncMotion)
        hoverQuery.addEventListener("change", syncHover)
        return () => {
            motionQuery.removeEventListener("change", syncMotion)
            hoverQuery.removeEventListener("change", syncHover)
        }
    }, [])

    // ─── Mobile dot cap ────────────────────────────────────────────────────────
    // Applied post-mount and re-evaluated on resize, so it reacts to a phone
    // rotating and never causes a hydration mismatch.

    useEffect(() => {
        if (typeof window === "undefined") return
        const requested = Math.min(dotCount, MAX_DOTS)

        const apply = () => {
            const small = !isCanvas && window.innerWidth < MOBILE_BREAKPOINT
            const next = small ? Math.min(requested, MOBILE_DOT_CAP) : requested
            setEffectiveDotCount((prev) => (prev === next ? prev : next))
        }

        apply()
        if (isCanvas) return
        window.addEventListener("resize", apply)
        return () => window.removeEventListener("resize", apply)
    }, [dotCount, isCanvas])

    // ─── Static frame ──────────────────────────────────────────────────────────
    // One resting-position pass. Used by the editor canvas, thumbnails, image
    // exports, and by visitors who prefer reduced motion.

    const drawStaticFrame = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const dpr = dprRef.current
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.save()
        ctx.scale(dpr, dpr)
        ctx.globalAlpha = dotOpacity
        for (const bucket of bucketsRef.current) {
            ctx.fillStyle = bucket.rgb
            ctx.beginPath()
            for (const dot of bucket.dots) {
                ctx.moveTo(dot.baseX + dot.radius, dot.baseY)
                ctx.arc(dot.baseX, dot.baseY, dot.radius, 0, Math.PI * 2)
            }
            ctx.fill()
        }
        ctx.restore()
    }, [dotOpacity])

    drawStaticRef.current = drawStaticFrame

    // ─── Fetch source file ─────────────────────────────────────────────────────

    useEffect(() => {
        let blobUrl: string | null = null
        let cancelled = false

        setLoadStatus("loading")

        if (!sourceFile) {
            setFileState({ kind: "svg", content: DEFAULT_SVG })
            return
        }

        const isSVG = sourceFile.toLowerCase().split("?")[0].endsWith(".svg")

        if (isSVG) {
            fetch(sourceFile)
                .then((r) => r.text())
                .then((text) => {
                    if (!cancelled) setFileState({ kind: "svg", content: text })
                })
                .catch(() => {
                    if (!cancelled) {
                        setFileState(null)
                        setLoadStatus("unreadable")
                    }
                })
        } else {
            fetch(sourceFile)
                .then((r) => r.blob())
                .then((blob) => {
                    if (cancelled) return
                    blobUrl = URL.createObjectURL(blob)
                    setFileState({ kind: "image", blobUrl })
                })
                .catch(() => {
                    if (!cancelled) {
                        setFileState(null)
                        setLoadStatus("unreadable")
                    }
                })
        }

        return () => {
            cancelled = true
            if (blobUrl) URL.revokeObjectURL(blobUrl)
        }
    }, [sourceFile])

    // ─── Size the canvas ───────────────────────────────────────────────────────

    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const w = Math.round(entry.contentRect.width) || 500
                const h = Math.round(entry.contentRect.height) || 500

                // Device pixel ratio is capped at 2 — beyond that the pixel
                // cost triples for no visible gain on dots this small.
                const dpr = isCanvas
                    ? 1
                    : Math.min(window.devicePixelRatio || 1, 2)
                dprRef.current = dpr

                canvas.width = Math.round(w * dpr)
                canvas.height = Math.round(h * dpr)
                canvas.style.width = `${w}px`
                canvas.style.height = `${h}px`

                if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current)
                resizeTimerRef.current = setTimeout(() => {
                    startTransition(() => setContainerSize({ w, h }))
                }, 180)
            }
        })

        ro.observe(container)
        return () => {
            ro.disconnect()
            if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current)
        }
    }, [isCanvas])

    // ─── Pause entirely when scrolled out of view ─────────────────────────────

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    isVisibleRef.current = entry.isIntersecting
                }
            },
            { threshold: 0 }
        )

        observer.observe(container)
        return () => observer.disconnect()
    }, [])

    // ─── Build geometry ────────────────────────────────────────────────────────
    // Positions and depth only. Colour and size changes do NOT run this, so
    // nudging Brightness or Opacity in the panel never re-scatters the cloud.

    useEffect(() => {
        if (!containerSize) return
        const { w: W, h: H } = containerSize
        if (W === 0 || H === 0) return

        const random = makeRandom(seed * 2654435761 + W * 31 + H)
        const cx = W / 2
        const cy = H / 2

        const makeDot = (
            x: number,
            y: number,
            r: number,
            g: number,
            b: number
        ): DotData => {
            const layerIndex = Math.floor(random() * parallaxLayers)
            const parallaxDepth =
                parallaxLayers > 1 ? layerIndex / (parallaxLayers - 1) : 1

            const startX = enableFadeIn ? cx + (random() - 0.5) * W * 3 : x
            const startY = enableFadeIn ? cy + (random() - 0.5) * H * 3 : y

            return {
                x: startX,
                y: startY,
                baseX: x,
                baseY: y,
                angle: random() * Math.PI * 2,
                driftX: 0,
                driftY: 0,
                sizeSeed: random(),
                parallaxDepth,
                br: r,
                bg: g,
                bb: b,
                cr: r,
                cg: g,
                cb: b,
                rgb: `rgb(${r},${g},${b})`,
                size: 2,
                radius: 1,
                proximityFactor: 0,
            }
        }

        const generateFromImageData = (imageData: ImageData): DotData[] => {
            const pts: DotData[] = []
            const data = imageData.data
            const maxAttempts = effectiveDotCount * 40
            let attempts = 0
            while (pts.length < effectiveDotCount && attempts < maxAttempts) {
                attempts++
                const x = random() * W
                const y = random() * H
                const px = Math.min(Math.floor(x), W - 1)
                const py = Math.min(Math.floor(y), H - 1)
                const idx = (py * W + px) * 4
                if (data[idx + 3] > 20) {
                    pts.push(
                        makeDot(x, y, data[idx], data[idx + 1], data[idx + 2])
                    )
                }
            }
            return pts
        }

        const generateCircleFallback = (): DotData[] => {
            const pts: DotData[] = []
            const rad = Math.min(W, H) * 0.35
            const radSq = rad * rad
            const maxAttempts = effectiveDotCount * 30
            let attempts = 0
            while (pts.length < effectiveDotCount && attempts < maxAttempts) {
                attempts++
                const x = cx + (random() - 0.5) * rad * 2
                const y = cy + (random() - 0.5) * rad * 2
                const dx = x - cx
                const dy = y - cy
                if (dx * dx + dy * dy <= radSq) {
                    pts.push(makeDot(x, y, 0, 153, 255))
                }
            }
            return pts
        }

        const finalize = (pts: DotData[], status: LoadStatus) => {
            dotsRef.current = pts
            setLoadStatus(status)
            startTransition(() => setGeometryVersion((v) => v + 1))
            settlingRef.current = true
        }

        const sampleFromUrl = (
            url: string,
            imgW: number,
            imgH: number,
            revokeAfterUse: boolean,
            cancelled: () => boolean
        ) => {
            const scale = Math.min((W * 0.8) / imgW, (H * 0.8) / imgH)
            const drawW = imgW * scale
            const drawH = imgH * scale
            const offX = (W - drawW) / 2
            const offY = (H - drawH) / 2

            const offscreen = document.createElement("canvas")
            offscreen.width = W
            offscreen.height = H
            const ctx = offscreen.getContext("2d")
            if (!ctx) {
                finalize(generateCircleFallback(), "unreadable")
                return
            }

            const img = new Image()
            img.crossOrigin = "anonymous"

            const cleanup = () => {
                if (revokeAfterUse) URL.revokeObjectURL(url)
            }

            img.onload = () => {
                cleanup()
                if (cancelled()) return
                ctx.drawImage(img, offX, offY, drawW, drawH)
                try {
                    const imageData = ctx.getImageData(0, 0, W, H)
                    finalize(generateFromImageData(imageData), "ready")
                } catch {
                    // Cross-origin source the browser refuses to let us read.
                    finalize(generateCircleFallback(), "unreadable")
                }
            }
            img.onerror = () => {
                cleanup()
                if (cancelled()) return
                finalize(generateCircleFallback(), "unreadable")
            }
            img.src = url
        }

        if (!fileState) {
            finalize(generateCircleFallback(), "unreadable")
            return
        }

        let isCancelledFlag = false
        const cancelled = () => isCancelledFlag
        let localBlobUrl: string | null = null

        if (fileState.kind === "svg") {
            const { content } = fileState
            let svgW = 0
            let svgH = 0
            try {
                const doc = new DOMParser().parseFromString(
                    content,
                    "image/svg+xml"
                )
                const svgEl = doc.querySelector("svg")
                svgW = parseFloat(svgEl?.getAttribute("width") || "0")
                svgH = parseFloat(svgEl?.getAttribute("height") || "0")
                const vb = svgEl?.getAttribute("viewBox")
                if (vb && (!svgW || !svgH)) {
                    const parts = vb.split(/[\s,]+/).map(parseFloat)
                    svgW = parts[2] || svgW
                    svgH = parts[3] || svgH
                }
            } catch {
                // Malformed SVG — fall through to the frame-sized default.
            }
            if (!svgW || isNaN(svgW)) svgW = W
            if (!svgH || isNaN(svgH)) svgH = H

            const blob = new Blob([content], { type: "image/svg+xml" })
            localBlobUrl = URL.createObjectURL(blob)
            sampleFromUrl(localBlobUrl, svgW, svgH, true, cancelled)
        } else {
            const probe = new Image()
            probe.onload = () => {
                if (cancelled()) return
                sampleFromUrl(
                    fileState.blobUrl,
                    probe.naturalWidth || W,
                    probe.naturalHeight || H,
                    false,
                    cancelled
                )
            }
            probe.onerror = () => {
                if (!cancelled())
                    finalize(generateCircleFallback(), "unreadable")
            }
            probe.src = fileState.blobUrl
        }

        return () => {
            isCancelledFlag = true
            // Guards against the unmount-before-onload leak.
            if (localBlobUrl) URL.revokeObjectURL(localBlobUrl)
        }
    }, [
        fileState,
        containerSize,
        effectiveDotCount,
        enableFadeIn,
        parallaxLayers,
        seed,
    ])

    // ─── Build appearance ──────────────────────────────────────────────────────
    // Colour, size and the colour buckets. Cheap enough to re-run on every
    // colour tweak without touching a single dot position.

    useEffect(() => {
        const dots = dotsRef.current
        if (geometryVersion === 0 || dots.length === 0) return

        const [customR, customG, customB] = parseColor(dotColor)
        const useSampled = colorMode === "sampled"
        const glowActive = enableParallax && depthGlow > 0

        for (const dot of dots) {
            const depthBoost = glowActive
                ? dot.parallaxDepth * depthGlow * 35
                : 0
            const [r, g, b] = useSampled
                ? shiftBrightness(
                      dot.br,
                      dot.bg,
                      dot.bb,
                      brightnessOffset + depthBoost
                  )
                : shiftBrightness(
                      customR,
                      customG,
                      customB,
                      brightnessOffset + depthBoost
                  )

            dot.cr = r
            dot.cg = g
            dot.cb = b

            const sizeMult =
                sizeVariation > 0
                    ? Math.max(0.2, 1 + (dot.sizeSeed - 0.5) * sizeVariation)
                    : 1
            const depthSizeAdj = enableParallax
                ? 0.76 + dot.parallaxDepth * 0.36
                : 1
            const size = Math.max(0.5, dotSize * sizeMult * depthSizeAdj)
            dot.size = size
            dot.radius = size / 2
        }

        // Buckets group dots by colour so each colour is a single batched
        // fill() per frame. Flat art (icons, logos) yields a handful of buckets
        // and stays pixel-exact. Photographic sources can produce hundreds of
        // near-unique colours — one fill() each, every frame — so above a
        // threshold the channels snap to a coarse step. That collapses the
        // bucket count with no visible change, leaving low-colour art exact.
        const uniq = new Set<number>()
        for (const d of dots) {
            uniq.add((d.cr << 16) | (d.cg << 8) | d.cb)
            if (uniq.size > 64) break
        }
        const quantize = uniq.size > 64
        const step = 16
        const q = (v: number) =>
            quantize ? Math.min(255, Math.round(v / step) * step) : v

        const map = new Map<string, DotData[]>()
        for (const dot of dots) {
            dot.rgb = `rgb(${q(dot.cr)},${q(dot.cg)},${q(dot.cb)})`
            let list = map.get(dot.rgb)
            if (!list) {
                list = []
                map.set(dot.rgb, list)
            }
            list.push(dot)
        }
        bucketsRef.current = Array.from(map.entries()).map(([rgb, d]) => ({
            rgb,
            dots: d,
        }))

        settlingRef.current = true
        if (isStatic) drawStaticRef.current()
    }, [
        geometryVersion,
        colorMode,
        dotColor,
        brightnessOffset,
        depthGlow,
        enableParallax,
        dotSize,
        sizeVariation,
        isStatic,
    ])

    // ─── Force one repaint when opacity changes ───────────────────────────────
    // Opacity is applied at draw time rather than baked into each dot's colour,
    // so it needs a nudge rather than a rebuild. This is why dragging the
    // Opacity slider no longer re-scatters the whole cloud.

    useEffect(() => {
        settlingRef.current = true
        if (isStatic) drawStaticRef.current()
    }, [isStatic, dotOpacity, containerSize, geometryVersion])

    // ─── Animation loop ────────────────────────────────────────────────────────
    // Live render targets only, and only when the visitor has not asked for
    // reduced motion. Everywhere else a single resting frame is painted and no
    // RAF is ever scheduled.

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        if (isStatic) {
            drawStaticRef.current()
            return
        }

        const tick = (time: number) => {
            rafRef.current = requestAnimationFrame(tick)

            const cfg = configRef.current
            const minInterval = 1000 / cfg.maxFPS
            const elapsed = time - lastTimeRef.current
            if (elapsed < minInterval) return
            if (!isVisibleRef.current) return
            lastTimeRef.current = time

            // Frame-rate independent step. Without this, capping Max FPS to 30
            // would silently halve the drift and settle speed.
            const dt = Math.min(elapsed / 16.667, 3)

            const dpr = dprRef.current
            const cssW = canvas.width / dpr
            const cssH = canvas.height / dpr
            const centerX = cssW / 2
            const centerY = cssH / 2

            const active = isPointerOverRef.current || isPointerDownRef.current
            const driftActive = cfg.enableDrift && cfg.driftAmount > 0
            const parallaxAtRest =
                Math.abs(parallaxRef.current.x) < 0.05 &&
                Math.abs(parallaxRef.current.y) < 0.05

            // Nothing is moving and nothing is left to settle — leave the last
            // painted frame on screen and do no work at all. This is what stops
            // a parked cloud from costing a GPU upload sixty times a second.
            if (
                !driftActive &&
                !active &&
                parallaxAtRest &&
                !settlingRef.current
            ) {
                return
            }

            const mx = smoothX.get()
            const my = smoothY.get()
            const radius = cfg.cursorRadius
            const radiusSq = radius * radius

            const targetPX = active ? mx - centerX : 0
            const targetPY = active ? my - centerY : 0
            const ease = Math.min((cfg.parallaxEasing / 100) * dt, 1)
            const px = parallaxRef.current
            px.x += (targetPX - px.x) * (active ? ease : ease * 0.7)
            px.y += (targetPY - px.y) * (active ? ease : ease * 0.7)

            const pStrength = cfg.enableParallax
                ? cfg.parallaxStrength / 100
                : 0
            const baseOffX = px.x * pStrength
            const baseOffY = px.y * pStrength

            const lerp = Math.min(0.12 * cfg.settleSpeed * dt, 0.5)
            const driftStep = 0.012 * cfg.driftSpeed * dt

            // Tracks whether any dot actually moved this frame, so the loop
            // knows when it is safe to stop repainting.
            let stillSettling = false

            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.save()
            ctx.scale(dpr, dpr)
            ctx.globalAlpha = cfg.dotOpacity

            const proximityDots = proximityDotsRef.current
            proximityDots.length = 0

            for (const bucket of bucketsRef.current) {
                ctx.fillStyle = bucket.rgb
                ctx.beginPath()
                let batched = false

                for (const dot of bucket.dots) {
                    if (driftActive) {
                        dot.angle += driftStep
                        dot.driftX = Math.sin(dot.angle) * cfg.driftAmount
                        dot.driftY =
                            Math.cos(dot.angle * 0.73) * cfg.driftAmount
                    } else if (dot.driftX !== 0 || dot.driftY !== 0) {
                        dot.driftX = 0
                        dot.driftY = 0
                    }

                    const layerMult = 0.15 + dot.parallaxDepth * 0.85
                    const pOffX = baseOffX * layerMult
                    const pOffY = baseOffY * layerMult

                    const drawX = dot.x + dot.driftX + pOffX
                    const drawY = dot.y + dot.driftY + pOffY

                    let tx = dot.baseX
                    let ty = dot.baseY

                    // Hit-test against where the dot is actually drawn, not its
                    // resting position, so the cursor radius matches what the
                    // visitor sees even at high parallax.
                    const dx = drawX - mx
                    const dy = drawY - my
                    const distSq = dx * dx + dy * dy

                    if (active && distSq < radiusSq) {
                        const dist = Math.sqrt(distSq)
                        dot.proximityFactor = 1 - dist / radius
                        if (dist > 0.001) {
                            const force =
                                dot.proximityFactor *
                                radius *
                                0.5 *
                                cfg.separationForce
                            tx += (dx / dist) * force
                            ty += (dy / dist) * force
                        }
                        proximityDots.push(dot)
                    } else {
                        dot.proximityFactor = 0
                        ctx.moveTo(drawX + dot.radius, drawY)
                        ctx.arc(drawX, drawY, dot.radius, 0, Math.PI * 2)
                        batched = true
                    }

                    const ndx = (tx - dot.x) * lerp
                    const ndy = (ty - dot.y) * lerp
                    if (Math.abs(ndx) > 0.01 || Math.abs(ndy) > 0.01)
                        stillSettling = true
                    dot.x += ndx
                    dot.y += ndy
                }

                if (batched) ctx.fill()
            }

            // Proximity dots, still batched by colour. The old build called
            // beginPath/fill once per dot with a canvas shadow attached — the
            // single most expensive 2D operation there is. The glow is now a
            // second, larger, low-alpha pass, which costs a fraction as much
            // and reads the same.
            if (proximityDots.length > 0) {
                if (cfg.proximityGlow > 0) {
                    ctx.globalAlpha = cfg.dotOpacity * cfg.proximityGlow * 0.5
                    let currentColor = ""
                    for (const dot of proximityDots) {
                        if (dot.rgb !== currentColor) {
                            if (currentColor) ctx.fill()
                            currentColor = dot.rgb
                            ctx.fillStyle = currentColor
                            ctx.beginPath()
                        }
                        const f = dot.proximityFactor
                        const gr =
                            dot.radius *
                            (1 + f * cfg.proximitySizeBoost) *
                            (1 + f * 1.6)
                        const layerMult = 0.15 + dot.parallaxDepth * 0.85
                        const gx = dot.x + dot.driftX + baseOffX * layerMult
                        const gy = dot.y + dot.driftY + baseOffY * layerMult
                        ctx.moveTo(gx + gr, gy)
                        ctx.arc(gx, gy, Math.max(0.1, gr), 0, Math.PI * 2)
                    }
                    if (currentColor) ctx.fill()
                }

                for (const dot of proximityDots) {
                    const f = dot.proximityFactor
                    const r = dot.radius * (1 + f * cfg.proximitySizeBoost)
                    const layerMult = 0.15 + dot.parallaxDepth * 0.85
                    ctx.globalAlpha = Math.max(
                        0,
                        cfg.dotOpacity * (1 - f * cfg.proximityFade)
                    )
                    ctx.fillStyle = dot.rgb
                    ctx.beginPath()
                    ctx.arc(
                        dot.x + dot.driftX + baseOffX * layerMult,
                        dot.y + dot.driftY + baseOffY * layerMult,
                        Math.max(0.1, r),
                        0,
                        Math.PI * 2
                    )
                    ctx.fill()
                }
            }

            ctx.restore()

            settlingRef.current = stillSettling
        }

        rafRef.current = requestAnimationFrame(tick)
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }, [isStatic, smoothX, smoothY])

    // ─── Pointer handlers — mouse, touch and pen ──────────────────────────────
    // Pointer Events cover all three input types with one code path. The
    // previous mouse-only handlers meant the entire interaction was dead on
    // phones and tablets.

    // An event counts as hover only from a real hovering device. Touch is
    // excluded twice over: by pointerType, and by the `(hover: hover)` query.
    const isHoverInput = useCallback(
        (e: ReactPointerEvent<HTMLDivElement>) =>
            e.pointerType !== "touch" && hoverCapableRef.current,
        []
    )

    const updatePointer = useCallback(
        (e: ReactPointerEvent<HTMLDivElement>) => {
            const rect = containerRef.current?.getBoundingClientRect()
            if (!rect) return
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            // On the very first contact the smoothing springs still sit at
            // (0,0), so springing from there would drag a visible wave across
            // the cloud from the top-left corner. That is barely noticeable
            // with a mouse, which enters from an edge, but on touch the first
            // tap lands mid-canvas and the sweep is obvious. Jump the springs
            // to the contact point instead, then smooth every move after it.
            if (!hasContactRef.current) {
                hasContactRef.current = true
                pointerX.set(x)
                pointerY.set(y)
                smoothX.set(x)
                smoothY.set(y)
                return
            }

            pointerX.set(x)
            pointerY.set(y)
        },
        [pointerX, pointerY, smoothX, smoothY]
    )

    const handlePointerEnter = useCallback(
        (e: ReactPointerEvent<HTMLDivElement>) => {
            // A touch screen has no hover state, so entering means nothing
            // there — touch is driven by pointerdown and pointermove instead.
            if (!isHoverInput(e)) return
            isPointerOverRef.current = true
            updatePointer(e)
        },
        [isHoverInput, updatePointer]
    )

    const handlePointerMove = useCallback(
        (e: ReactPointerEvent<HTMLDivElement>) => {
            if (isHoverInput(e)) {
                isPointerOverRef.current = true
            } else if (!isPointerDownRef.current) {
                // Touch with nothing held down — ignore entirely.
                return
            }
            updatePointer(e)
        },
        [isHoverInput, updatePointer]
    )

    const handlePointerDown = useCallback(
        (e: ReactPointerEvent<HTMLDivElement>) => {
            isPointerDownRef.current = true
            // Keeps the drag alive when the finger travels outside the
            // component's bounds. Without capture the effect freezes at the
            // edge the moment the touch leaves the box.
            try {
                e.currentTarget.setPointerCapture(e.pointerId)
            } catch {
                // Safari can throw on an already-released pointer. Harmless —
                // the drag simply ends at the boundary.
            }
            updatePointer(e)
        },
        [updatePointer]
    )

    const handlePointerUp = useCallback(
        (e: ReactPointerEvent<HTMLDivElement>) => {
            isPointerDownRef.current = false
            try {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                    e.currentTarget.releasePointerCapture(e.pointerId)
                }
            } catch {
                // Already released.
            }
            // A finger leaves no cursor behind, so end the interaction fully.
            if (!isHoverInput(e)) isPointerOverRef.current = false
        },
        [isHoverInput]
    )

    const handlePointerLeave = useCallback(() => {
        isPointerOverRef.current = false
        isPointerDownRef.current = false
    }, [])

    // ─── Render ────────────────────────────────────────────────────────────────

    const showCanvasHint =
        isCanvas && (!dotsReady || loadStatus === "unreadable")
    const hintLabel =
        loadStatus === "unreadable"
            ? "Source unreadable — showing fallback"
            : "Generating…"

    // A purely ornamental cloud is hidden from assistive tech entirely.
    // A meaningful one (a logo, a brand mark) is announced as an image with the
    // text the buyer supplies. Both are WCAG 1.1.1 compliant; neither leaves a
    // bare unlabelled <canvas> in the accessibility tree.
    const a11yProps = decorative
        ? ({ "aria-hidden": true, role: "presentation" } as const)
        : ({
              role: "img",
              "aria-label": altText || "Dot cloud graphic",
          } as const)

    return (
        <div
            ref={containerRef}
            {...a11yProps}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                cursor: "inherit",
                // The touch tradeoff, made explicit. "pan-y" lets the browser
                // own vertical drags so the page still scrolls when a finger
                // starts on the component — essential for a full-bleed hero.
                // "none" hands every direction to the effect, which feels
                // better in a boxed frame but traps the page if the component
                // fills the viewport.
                touchAction: allowPageScroll ? "pan-y" : "none",
                // Isolates repaints from the rest of the page so the canvas
                // cannot trigger layout work outside its own box. Deliberately
                // no `size` containment — that would collapse the component
                // when a user sets the frame to auto height.
                contain: "layout paint",
                ...style,
            }}
            {...(!isStatic && {
                onPointerEnter: handlePointerEnter,
                onPointerMove: handlePointerMove,
                onPointerDown: handlePointerDown,
                onPointerUp: handlePointerUp,
                onPointerCancel: handlePointerUp,
                onPointerLeave: handlePointerLeave,
            })}
        >
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    display: "block",
                    mixBlendMode: blendMode,
                }}
            />

            {showCanvasHint && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        pointerEvents: "none",
                        fontFamily: "Inter, sans-serif",
                    }}
                >
                    <div
                        style={{
                            padding: "6px 12px",
                            borderRadius: 999,
                            background: "rgba(127,127,127,0.16)",
                            color: "rgba(127,127,127,0.95)",
                            fontSize: 11,
                            fontWeight: 500,
                            letterSpacing: 0.2,
                        }}
                    >
                        Dot Cloud · {hintLabel}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Property Controls ────────────────────────────────────────────────────────
// Note: inside a ControlType.Object, `hidden` receives that object's own values,
// not the root props. Referencing the parent group here is what silently hides
// controls forever.

addPropertyControls(DotCloud, {
    sourceFile: {
        type: ControlType.File,
        title: "Source",
        allowedFileTypes: ["svg", "png", "jpg", "jpeg", "gif", "webp"],
        description:
            "SVG or image. Dots fill the shape and sample its colors. Leave empty to use the built-in demo mark.",
    },
    dotCount: {
        type: ControlType.Number,
        title: "Dots",
        defaultValue: 1200,
        min: 50,
        max: 6000,
        step: 50,
        description: `500–2,000 holds a steady 60fps on most hardware. Automatically capped to ${MOBILE_DOT_CAP} on screens under ${MOBILE_BREAKPOINT}px.`,
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 2,
        min: 0.5,
        max: 20,
        step: 0.5,
        unit: "px",
    },
    dotOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
    },
    seed: {
        type: ControlType.Number,
        title: "Seed",
        defaultValue: 1,
        min: 1,
        max: 999,
        step: 1,
        displayStepper: true,
        description:
            "Changes which dots get picked. Same seed always produces the same arrangement.",
    },

    advanced: {
        type: ControlType.Object,
        title: "Color",
        icon: "color",
        buttonTitle: "Color and blending",
        controls: {
            colorMode: {
                type: ControlType.Enum,
                title: "Source",
                defaultValue: "sampled",
                options: ["sampled", "custom"],
                optionTitles: ["From File", "Single Color"],
                displaySegmentedControl: true,
            },
            dotColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#0099FF",
                hidden: (p: AdvancedProps) => p.colorMode !== "custom",
            },
            brightnessOffset: {
                type: ControlType.Number,
                title: "Brightness",
                defaultValue: 0,
                min: -100,
                max: 100,
                step: 5,
                description:
                    "Shifts every dot toward black or white. Useful for placing a light logo on a light background.",
            },
            sizeVariation: {
                type: ControlType.Number,
                title: "Size Variation",
                defaultValue: 0.5,
                min: 0,
                max: 2,
                step: 0.1,
                description:
                    "0 keeps every dot identical. Higher values scatter the sizes for a looser, hand-made feel.",
            },
            blendMode: {
                type: ControlType.Enum,
                title: "Blend",
                defaultValue: "normal",
                options: [
                    "normal",
                    "multiply",
                    "screen",
                    "overlay",
                    "darken",
                    "lighten",
                    "color-dodge",
                    "difference",
                    "exclusion",
                ],
                optionTitles: [
                    "Normal",
                    "Multiply",
                    "Screen",
                    "Overlay",
                    "Darken",
                    "Lighten",
                    "Color Dodge",
                    "Difference",
                    "Exclusion",
                ],
                description:
                    "Normal renders true source colors. Other modes blend the dots into whatever sits behind them.",
            },
        },
    },

    behavior: {
        type: ControlType.Object,
        title: "Motion",
        icon: "effect",
        buttonTitle: "Drift, parallax and pointer",
        controls: {
            enableFadeIn: {
                type: ControlType.Boolean,
                title: "Assemble",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description:
                    "Dots fly in from off-frame and settle into the shape on first load.",
            },
            enableDrift: {
                type: ControlType.Boolean,
                title: "Idle Drift",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            driftSpeed: {
                type: ControlType.Number,
                title: "Drift Speed",
                defaultValue: 1,
                min: 0,
                max: 5,
                step: 0.1,
                hidden: (p: BehaviorProps) => !p.enableDrift,
            },
            driftAmount: {
                type: ControlType.Number,
                title: "Drift Range",
                defaultValue: 4,
                min: 0,
                max: 20,
                step: 0.5,
                unit: "px",
                hidden: (p: BehaviorProps) => !p.enableDrift,
            },
            enableParallax: {
                type: ControlType.Boolean,
                title: "Parallax",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description:
                    "Splits the cloud into depth layers. Front dots shift furthest with the pointer and sit brighter.",
            },
            parallaxStrength: {
                type: ControlType.Number,
                title: "Depth",
                defaultValue: 5,
                min: 0,
                max: 15,
                step: 0.5,
                hidden: (p: BehaviorProps) => !p.enableParallax,
            },
            parallaxLayers: {
                type: ControlType.Number,
                title: "Layers",
                defaultValue: 3,
                min: 2,
                max: 8,
                step: 1,
                displayStepper: true,
                hidden: (p: BehaviorProps) => !p.enableParallax,
            },
            depthGlow: {
                type: ControlType.Number,
                title: "Depth Glow",
                defaultValue: 0.35,
                min: 0,
                max: 1,
                step: 0.05,
                description:
                    "Brightness lift on the front layers. 0 reads flat, 1 reads like a lit surface.",
                hidden: (p: BehaviorProps) => !p.enableParallax,
            },
            parallaxEasing: {
                type: ControlType.Number,
                title: "Follow",
                defaultValue: 6,
                min: 1,
                max: 15,
                step: 1,
                displayStepper: true,
                description:
                    "How tightly the layers track the pointer. Low is slow and dreamy, high is snappy.",
                hidden: (p: BehaviorProps) => !p.enableParallax,
            },
            cursorRadius: {
                type: ControlType.Number,
                title: "Pointer Radius",
                defaultValue: 120,
                min: 20,
                max: 400,
                step: 10,
                unit: "px",
                description:
                    "Dots inside this radius react. On desktop this follows the cursor on hover. On touch there is no hover, so it follows a finger only while it is held down.",
            },
            allowPageScroll: {
                type: ControlType.Boolean,
                title: "Touch Scroll",
                defaultValue: true,
                enabledTitle: "Scroll",
                disabledTitle: "Drag",
                description:
                    "Scroll: a vertical swipe scrolls the page, horizontal drags drive the effect. Keep this for full-width or hero placements.\nDrag: every direction drives the effect. Only use this when the component sits in a boxed frame, or visitors will not be able to scroll past it on a phone.",
            },
            separationForce: {
                type: ControlType.Number,
                title: "Push",
                defaultValue: 1,
                min: 0,
                max: 3,
                step: 0.1,
            },
            proximitySizeBoost: {
                type: ControlType.Number,
                title: "Grow",
                defaultValue: 1,
                min: -1,
                max: 3,
                step: 0.1,
                description:
                    "Negative shrinks dots near the pointer, positive grows them, 0 leaves them alone.",
            },
            proximityFade: {
                type: ControlType.Number,
                title: "Fade",
                defaultValue: 0,
                min: 0,
                max: 1,
                step: 0.05,
                description:
                    "Fades dots out as the pointer reaches them. 1 makes the pointer erase a hole.",
            },
            proximityGlow: {
                type: ControlType.Number,
                title: "Glow",
                defaultValue: 0.2,
                min: 0,
                max: 1,
                step: 0.05,
            },
            settleSpeed: {
                type: ControlType.Number,
                title: "Settle Speed",
                defaultValue: 1,
                min: 0.1,
                max: 5,
                step: 0.1,
                description:
                    "How fast dots return to place after being pushed, and how fast they assemble on load.",
            },
            maxFPS: {
                type: ControlType.Number,
                title: "Max FPS",
                defaultValue: 60,
                min: 15,
                max: 60,
                step: 5,
                displayStepper: true,
                description:
                    "Caps the frame rate to save battery. 30 is imperceptible for drift and halves the cost.",
            },
        },
    },

    accessibility: {
        type: ControlType.Object,
        title: "Accessibility",
        icon: "boolean",
        buttonTitle: "Screen readers and motion",
        controls: {
            decorative: {
                type: ControlType.Boolean,
                title: "Decorative",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
                description:
                    "On: hidden from screen readers, which is correct for background ornament. Off: announced as an image using the label below.",
            },
            altText: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "",
                placeholder: "Acme logo",
                description:
                    "What a screen reader announces. Describe the mark, not the effect.",
                hidden: (p: AccessibilityProps) => p.decorative !== false,
            },
            respectReducedMotion: {
                type: ControlType.Boolean,
                title: "Reduced Motion",
                defaultValue: true,
                enabledTitle: "Respect",
                disabledTitle: "Ignore",
                description:
                    "When the visitor's system asks for reduced motion, the cloud renders as a still image and no animation frame is ever scheduled. Leave this on.",
            },
        },
    },
})
