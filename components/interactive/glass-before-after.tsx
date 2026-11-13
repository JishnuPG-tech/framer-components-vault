// Tilt Before/After Card — glass/dark, cursor-following, accessible & touch-friendly.
import React, {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
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


// ─── Types ────────────────────────────────────────────────────────────────────

type ResponsiveImageLike = { src: string; srcSet?: string; alt?: string }
type LabelVerticalPosition = "top" | "bottom"
type Mode = "subtle" | "glass" | "showcase"
type AspectRatio = "16:9" | "4:3" | "3:2" | "1:1" | "21:9" | "auto"

type Props = {
    beforeImage?: ResponsiveImageLike
    afterImage?: ResponsiveImageLike

    mode: Mode
    aspectRatio: AspectRatio
    initialSplit: number
    interactive: boolean
    showHandle: boolean
    showGlow: boolean

    showLabels: boolean
    beforeLabel: string
    afterLabel: string
    labelPosition: LabelVerticalPosition

    onSplitChange?: (value: number) => void
    /**
     * Continuous mouse-hover tracking. Reports the *target* split, which leads
     * the visible split by the easing duration. For the settled value, listen
     * to onSplitChange.
     */
    onSplitHover?: (value: number) => void
    style?: CSSProperties
}

// ─── Mode presets ─────────────────────────────────────────────────────────────

type Preset = {
    maxTilt: number
    perspective: number
    tiltSmoothing: number
    splitSmoothing: number
    radius: string
    padding: number
    background: string
    borderColor: string
    shadow: string
    handleSize: number
    glareOpacity: number
    glareColor: string
    glareBlend: CSSProperties["mixBlendMode"]
    showVignette: boolean
    labelBackground: string
    labelTextColor: string
    labelFontSize: number
}

const DIVIDER_COLOR = "#FFFFFF"

const PRESETS: Record<Mode, Preset> = {
    subtle: {
        maxTilt: 5,
        perspective: 1100,
        tiltSmoothing: 0.16,
        splitSmoothing: 0.28,
        radius: "12px",
        padding: 6,
        background: "#0E0E10",
        borderColor: "#1F1F22",
        shadow: "0 8px 24px rgba(0,0,0,0.35)",
        handleSize: 36,
        glareOpacity: 0.12,
        glareColor: "rgba(255,255,255,0.25)",
        glareBlend: "plus-lighter",
        showVignette: false,
        labelBackground: "rgba(0,0,0,0.45)",
        labelTextColor: "#FFFFFF",
        labelFontSize: 11,
    },
    glass: {
        maxTilt: 10,
        perspective: 900,
        tiltSmoothing: 0.12,
        splitSmoothing: 0.22,
        radius: "22px",
        padding: 10,
        background: "#0B0B0D",
        borderColor: "#2A2A2E",
        shadow: "0 18px 60px rgba(0,0,0,0.55)",
        handleSize: 46,
        glareOpacity: 0.22,
        glareColor: "rgba(255,255,255,0.40)",
        glareBlend: "plus-lighter",
        showVignette: true,
        labelBackground: "rgba(0,0,0,0.35)",
        labelTextColor: "#FFFFFF",
        labelFontSize: 12,
    },
    showcase: {
        maxTilt: 15,
        perspective: 800,
        tiltSmoothing: 0.1,
        splitSmoothing: 0.18,
        radius: "28px",
        padding: 14,
        background: "#08080A",
        borderColor: "#3A3A40",
        shadow: "0 30px 90px rgba(0,0,0,0.65), 0 4px 12px rgba(0,0,0,0.45)",
        handleSize: 56,
        glareOpacity: 0.35,
        glareColor: "rgba(255,255,255,0.55)",
        glareBlend: "plus-lighter",
        showVignette: true,
        labelBackground: "rgba(0,0,0,0.5)",
        labelTextColor: "#FFFFFF",
        labelFontSize: 13,
    },
}

const ASPECT_RATIO_VALUES: Record<AspectRatio, string | undefined> = {
    "16:9": "16 / 9",
    "4:3": "4 / 3",
    "3:2": "3 / 2",
    "1:1": "1 / 1",
    "21:9": "21 / 9",
    auto: undefined,
}

// CSS height keywords meaning "size to content" — treat as non-explicit so the
// card uses its aspect-ratio (or sizer image) instead of a fixed height.
const NON_EXPLICIT_HEIGHTS = new Set([
    "auto",
    "100%",
    "",
    "min-content",
    "max-content",
    "fit-content",
])

// ─── Constants & helpers ──────────────────────────────────────────────────────

const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(max, n))

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const DEFAULT_BEFORE: ResponsiveImageLike = {
    src: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?q=80&w=1288&auto=format&fit=crop",
    alt: "Before image",
}
const DEFAULT_AFTER: ResponsiveImageLike = {
    src: "https://images.unsplash.com/photo-1516205651411-aef33a44f7c2?q=80&w=1364&auto=format&fit=crop",
    alt: "After image",
}

const FALLBACK_SVG = (label: string) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'><rect width='16' height='9' fill='#1a1a1d'/><text x='8' y='5.6' text-anchor='middle' font-size='1.2' fill='rgba(255,255,255,0.45)' font-family='sans-serif'>${label}</text></svg>`
    )}`

// In-flow sizer — drives intrinsic height when no aspect-ratio/explicit height.
const SIZER_IMG_STYLE: CSSProperties = {
    display: "block",
    width: "100%",
    height: "auto",
    pointerEvents: "none",
    userSelect: "none",
}

// Overlay images — fill the card.
const OVERLAY_IMG_STYLE: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    pointerEvents: "none",
    userSelect: "none",
}

const DIVIDER_HIT_STYLE: CSSProperties = {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: -12,
    right: -12,
}

const VIGNETTE_STYLE: CSSProperties = {
    position: "absolute",
    inset: 0,
    zIndex: 3,
    pointerEvents: "none",
    background:
        "radial-gradient(120% 120% at 50% 25%, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.35) 100%)",
    transform: "translateZ(1px)",
}

// ─── Singleton focus-visible stylesheet ───────────────────────────────────────

let focusStyleInjected = false
function ensureFocusStyles() {
    if (focusStyleInjected || typeof document === "undefined") return
    focusStyleInjected = true
    const el = document.createElement("style")
    el.setAttribute("data-tba-styles", "")
    el.textContent = `[data-tba] [data-grab]:focus-visible{outline:2px solid #4C9FFF;outline-offset:3px;border-radius:4px;}`
    document.head.appendChild(el)
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState<boolean>(() => {
        if (typeof window === "undefined" || !window.matchMedia) return false
        return window.matchMedia(query).matches
    })
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia(query)
        const update = () => setMatches(mq.matches)
        update()
        mq.addEventListener?.("change", update)
        return () => mq.removeEventListener?.("change", update)
    }, [query])
    return matches
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 320
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any
 */
export default function TiltBeforeAfterCard(props: Props) {
    const {
        beforeImage = DEFAULT_BEFORE,
        afterImage = DEFAULT_AFTER,
        mode,
        aspectRatio,
        initialSplit,
        interactive,
        showHandle,
        showGlow,
        showLabels,
        beforeLabel,
        afterLabel,
        labelPosition,
        onSplitChange,
        onSplitHover,
        style,
    } = props

    const preset = PRESETS[mode] ?? PRESETS.glass

    const isStatic = useIsStaticRenderer()
    const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
    const coarsePointer = useMediaQuery("(pointer: coarse)")

    const tiltEnabled =
        interactive && !reducedMotion && !coarsePointer && !isStatic

    const rawId = useId()
    const uid = useMemo(() => `tba-${rawId.replace(/[:]/g, "")}`, [rawId])

    const initialClamped = useMemo(
        () => clamp(initialSplit, 0, 100),
        [initialSplit]
    )

    // Did the consumer pin a real height?
    const hasExplicitHeight = useMemo(() => {
        const h = style?.height
        if (h == null) return false
        if (typeof h === "string" && NON_EXPLICIT_HEIGHTS.has(h)) return false
        return true
    }, [style])

    const aspectRatioValue = hasExplicitHeight
        ? undefined
        : ASPECT_RATIO_VALUES[aspectRatio]

    // Use the in-flow sizer image when neither aspect-ratio nor a fixed height
    // is providing a size.
    const useSizer = !aspectRatioValue && !hasExplicitHeight

    // ─── Refs ────────────────────────────────────────────────────────────────

    const wrapRef = useRef<HTMLDivElement | null>(null)
    const cardRef = useRef<HTMLDivElement | null>(null)
    const beforeWrapRef = useRef<HTMLDivElement | null>(null)
    const dividerRef = useRef<HTMLDivElement | null>(null)
    const handleRef = useRef<HTMLDivElement | null>(null)

    const splitRef = useRef<number>(initialClamped)
    const splitTargetRef = useRef<number>(initialClamped)
    const tiltTargetRef = useRef({ rx: 0, ry: 0, gx: 50, gy: 50 })
    const tiltCurrentRef = useRef({ rx: 0, ry: 0, gx: 50, gy: 50 })

    const draggingRef = useRef(false)
    // Tracks which element holds pointer capture, so the right element releases.
    const captureTargetRef = useRef<HTMLElement | null>(null)
    const capturedPointerIdRef = useRef<number | null>(null)

    const rafRef = useRef<number | null>(null)
    const rectRef = useRef<DOMRect | null>(null)

    const onSplitChangeRef = useRef(onSplitChange)
    const onSplitHoverRef = useRef(onSplitHover)
    onSplitChangeRef.current = onSplitChange
    onSplitHoverRef.current = onSplitHover

    const [splitState, setSplitState] = useState(initialClamped)
    const lastA11yUpdateRef = useRef(0)
    const lastA11yValueRef = useRef(initialClamped)

    // ─── In-view tracking ────────────────────────────────────────────────────

    const [inView, setInView] = useState(false)

    useEffect(() => {
        if (isStatic || typeof window === "undefined") {
            setInView(true)
            return
        }
        const el = wrapRef.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }
        const obs = new IntersectionObserver(
            (entries) => setInView(!!entries[0]?.isIntersecting),
            { rootMargin: "200px 0px", threshold: 0.01 }
        )
        obs.observe(el)
        return () => obs.disconnect()
    }, [isStatic])

    // ─── Cached bounding rect (also refreshed inside processPointer) ─────────

    useEffect(() => {
        const update = () => {
            rectRef.current = wrapRef.current?.getBoundingClientRect() ?? null
        }
        update()
        if (typeof window === "undefined") return
        window.addEventListener("resize", update, { passive: true })
        return () => window.removeEventListener("resize", update)
    }, [])

    // ─── Global focus-visible style (singleton) ──────────────────────────────

    useEffect(() => {
        ensureFocusStyles()
    }, [])

    // ─── DOM writers ─────────────────────────────────────────────────────────

    const applySplitToDOM = useCallback((value: number) => {
        const v = clamp(value, 0, 100)
        if (beforeWrapRef.current)
            beforeWrapRef.current.style.clipPath = `inset(0 ${100 - v}% 0 0)`
        if (dividerRef.current) dividerRef.current.style.left = `${v}%`
        if (handleRef.current) handleRef.current.style.left = `${v}%`
    }, [])

    const applyTiltToDOM = useCallback(
        (rx: number, ry: number, gx: number, gy: number) => {
            const card = cardRef.current
            if (!card) return
            const p = Math.max(200, preset.perspective)
            card.style.transform = `perspective(${p}px) rotateX(${rx.toFixed(
                3
            )}deg) rotateY(${ry.toFixed(3)}deg) translateZ(0)`
            card.style.setProperty("--glare-x", `${gx.toFixed(2)}%`)
            card.style.setProperty("--glare-y", `${gy.toFixed(2)}%`)
        },
        [preset.perspective]
    )

    /**
     * Imperative split setter for keyboard / double-click / prop sync / tap.
     * @param fireChange — false suppresses onSplitChange (used for prop sync).
     */
    const commitSplit = useCallback(
        (value: number, fireChange = true) => {
            const v = clamp(value, 0, 100)
            if (Math.abs(v - splitRef.current) < 0.001) return
            splitRef.current = v
            splitTargetRef.current = v
            applySplitToDOM(v)
            setSplitState(v)
            lastA11yValueRef.current = v
            if (fireChange) onSplitChangeRef.current?.(v)
        },
        [applySplitToDOM]
    )

    // Sync prop changes WITHOUT firing onSplitChange (no controlled-loop).
    useEffect(() => {
        commitSplit(initialClamped, false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialClamped])

    // Reset tilt when interactive / tilt-enabled flips off mid-session.
    useEffect(() => {
        if (!tiltEnabled && cardRef.current) {
            tiltTargetRef.current = { rx: 0, ry: 0, gx: 50, gy: 50 }
            tiltCurrentRef.current = { rx: 0, ry: 0, gx: 50, gy: 50 }
            applyTiltToDOM(0, 0, 50, 50)
            cardRef.current.style.willChange = "auto"
        }
    }, [tiltEnabled, applyTiltToDOM])

    // ─── Animation loop ──────────────────────────────────────────────────────

    const tick = useCallback(() => {
        rafRef.current = null
        if (!cardRef.current) return

        if (tiltEnabled) {
            const c = tiltCurrentRef.current
            const t = tiltTargetRef.current
            c.rx = lerp(c.rx, t.rx, preset.tiltSmoothing)
            c.ry = lerp(c.ry, t.ry, preset.tiltSmoothing)
            c.gx = lerp(c.gx, t.gx, preset.tiltSmoothing)
            c.gy = lerp(c.gy, t.gy, preset.tiltSmoothing)
            applyTiltToDOM(c.rx, c.ry, c.gx, c.gy)
        }

        const splitNext = lerp(
            splitRef.current,
            splitTargetRef.current,
            preset.splitSmoothing
        )
        if (Math.abs(splitNext - splitRef.current) > 0.01) {
            splitRef.current = splitNext
            applySplitToDOM(splitNext)

            const now =
                typeof performance !== "undefined"
                    ? performance.now()
                    : Date.now()
            if (now - lastA11yUpdateRef.current > 120) {
                lastA11yUpdateRef.current = now
                lastA11yValueRef.current = splitNext
                setSplitState(splitNext)
            }
        }

        const c = tiltCurrentRef.current
        const t = tiltTargetRef.current
        const needTilt =
            tiltEnabled &&
            (Math.abs(c.rx - t.rx) > 0.01 ||
                Math.abs(c.ry - t.ry) > 0.01 ||
                Math.abs(c.gx - t.gx) > 0.05)
        const needSplit =
            Math.abs(splitRef.current - splitTargetRef.current) > 0.05

        if ((needTilt || needSplit) && typeof window !== "undefined") {
            rafRef.current = window.requestAnimationFrame(tick)
        } else {
            const settled = clamp(splitTargetRef.current, 0, 100)
            if (Math.abs(settled - splitRef.current) > 0.001) {
                splitRef.current = settled
                applySplitToDOM(settled)
            }
            const settledRounded = Math.round(splitRef.current)
            if (settledRounded !== Math.round(lastA11yValueRef.current)) {
                lastA11yValueRef.current = splitRef.current
                setSplitState(splitRef.current)
            }
        }
    }, [
        applySplitToDOM,
        applyTiltToDOM,
        preset.splitSmoothing,
        preset.tiltSmoothing,
        tiltEnabled,
    ])

    const requestTick = useCallback(() => {
        if (isStatic || !inView || typeof window === "undefined") return
        if (rafRef.current != null) return
        rafRef.current = window.requestAnimationFrame(tick)
    }, [inView, isStatic, tick])

    // Pause when offscreen; resume any pending easing when onscreen again.
    useEffect(() => {
        if (!inView) {
            if (rafRef.current != null && typeof window !== "undefined") {
                window.cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
            return
        }
        const splitPending =
            Math.abs(splitRef.current - splitTargetRef.current) > 0.05
        const tiltPending =
            tiltEnabled &&
            (Math.abs(tiltCurrentRef.current.rx - tiltTargetRef.current.rx) >
                0.01 ||
                Math.abs(tiltCurrentRef.current.ry - tiltTargetRef.current.ry) >
                    0.01)
        if (splitPending || tiltPending) requestTick()
    }, [inView, requestTick, tiltEnabled])

    useEffect(() => {
        return () => {
            if (rafRef.current != null && typeof window !== "undefined") {
                window.cancelAnimationFrame(rafRef.current)
            }
        }
    }, [])

    // ─── Pointer handling ────────────────────────────────────────────────────

    /**
     * Updates target refs only — animation loop reads them.
     * Mouse: hover always follows cursor (no button required).
     * Touch/Pen: only follows while a drag is active.
     */
    const processPointer = useCallback(
        (clientX: number, clientY: number, pointerType: string) => {
            // Refresh rect lazily — fixes stale rect during page scroll.
            const rect =
                wrapRef.current?.getBoundingClientRect() ?? rectRef.current
            rectRef.current = rect
            if (!rect || rect.width <= 0 || rect.height <= 0) return

            const nx = clamp((clientX - rect.left) / rect.width, 0, 1)
            const ny = clamp((clientY - rect.top) / rect.height, 0, 1)

            if (tiltEnabled) {
                tiltTargetRef.current.rx = (0.5 - ny) * (preset.maxTilt * 2)
                tiltTargetRef.current.ry = (nx - 0.5) * (preset.maxTilt * 2)
                tiltTargetRef.current.gx = nx * 100
                tiltTargetRef.current.gy = ny * 100
            }

            if (!interactive) return

            const isMouse = pointerType === "mouse"
            const isDrag = draggingRef.current

            // Mouse: hover always follows. Touch/pen: only while dragging.
            if (!isMouse && !isDrag) return

            const next = nx * 100
            if (Math.abs(next - splitTargetRef.current) > 0.01) {
                splitTargetRef.current = next
                if (isDrag) {
                    onSplitChangeRef.current?.(next)
                } else {
                    onSplitHoverRef.current?.(next)
                }
            }
        },
        [interactive, preset.maxTilt, tiltEnabled]
    )

    const onPointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (isStatic || !inView) return
            processPointer(e.clientX, e.clientY, e.pointerType)
            requestTick()
        },
        [inView, isStatic, processPointer, requestTick]
    )

    const onPointerEnter = useCallback(
        (e: React.PointerEvent) => {
            if (isStatic || !inView) return
            rectRef.current = wrapRef.current?.getBoundingClientRect() ?? null
            if (cardRef.current && tiltEnabled) {
                cardRef.current.style.willChange = "transform"
            }
            processPointer(e.clientX, e.clientY, e.pointerType)
            requestTick()
        },
        [inView, isStatic, processPointer, requestTick, tiltEnabled]
    )

    const onPointerLeave = useCallback(() => {
        if (isStatic) return
        if (!draggingRef.current) {
            tiltTargetRef.current = { rx: 0, ry: 0, gx: 50, gy: 50 }
            if (cardRef.current) cardRef.current.style.willChange = "auto"
        }
        requestTick()
    }, [isStatic, requestTick])

    // ── Touch/pen drag (mouse uses pure hover-follow) ────────────────────────

    const beginDrag = useCallback(
        (e: React.PointerEvent) => {
            draggingRef.current = true
            const target = e.currentTarget as HTMLElement
            target.setPointerCapture?.(e.pointerId)
            captureTargetRef.current = target
            capturedPointerIdRef.current = e.pointerId

            rectRef.current = wrapRef.current?.getBoundingClientRect() ?? null
            const rect = rectRef.current
            if (rect && rect.width > 0) {
                const next = clamp(
                    ((e.clientX - rect.left) / rect.width) * 100,
                    0,
                    100
                )
                splitTargetRef.current = next
                onSplitChangeRef.current?.(next)
            }
            requestTick()
        },
        [requestTick]
    )

    const endDrag = useCallback(
        (e: React.PointerEvent) => {
            if (!draggingRef.current) return
            draggingRef.current = false
            const target = captureTargetRef.current
            const pid = capturedPointerIdRef.current
            if (target && pid != null) {
                target.releasePointerCapture?.(pid)
            }
            captureTargetRef.current = null
            capturedPointerIdRef.current = null
            requestTick()
        },
        [requestTick]
    )

    const onContainerPointerDown = useCallback(
        (e: React.PointerEvent) => {
            if (isStatic || !interactive) return
            if (e.pointerType === "mouse") return // mouse: hover-only
            if (e.button !== 0) return // ignore non-primary (pen barrel)
            beginDrag(e)
        },
        [interactive, isStatic, beginDrag]
    )

    const onContainerPointerUp = useCallback(
        (e: React.PointerEvent) => {
            if (isStatic) return
            if (e.pointerType === "mouse") return
            endDrag(e)
        },
        [isStatic, endDrag]
    )

    const onDragPointerDown = useCallback(
        (e: React.PointerEvent) => {
            if (isStatic || !interactive) return
            if (e.pointerType === "mouse") return // mouse: hover-only
            if (e.button !== 0) return
            e.preventDefault()
            e.stopPropagation()
            beginDrag(e)
        },
        [interactive, isStatic, beginDrag]
    )

    const onDragPointerUp = useCallback(
        (e: React.PointerEvent) => {
            if (isStatic) return
            if (e.pointerType === "mouse") return
            e.stopPropagation()
            endDrag(e)
        },
        [isStatic, endDrag]
    )

    // ─── Keyboard ────────────────────────────────────────────────────────────

    const onKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (!interactive) return
            const step = e.shiftKey ? 10 : 2
            const base = splitTargetRef.current
            switch (e.key) {
                case "ArrowLeft":
                    e.preventDefault()
                    commitSplit(base - step)
                    break
                case "ArrowRight":
                    e.preventDefault()
                    commitSplit(base + step)
                    break
                case "Home":
                    e.preventDefault()
                    commitSplit(0)
                    break
                case "End":
                    e.preventDefault()
                    commitSplit(100)
                    break
            }
        },
        [interactive, commitSplit]
    )

    const onDoubleClick = useCallback(() => {
        if (!interactive) return
        commitSplit(initialClamped)
    }, [interactive, commitSplit, initialClamped])

    const onImgError = useCallback(
        (e: React.SyntheticEvent<HTMLImageElement>, label: string) => {
            const img = e.currentTarget
            if (img.src.startsWith("data:")) return
            img.src = FALLBACK_SVG(label)
            img.srcset = ""
        },
        []
    )

    // ─── Styles ──────────────────────────────────────────────────────────────

    const containerStyle: CSSProperties = useMemo(
        () => ({
            position: "relative",
            width: "100%",
            height: hasExplicitHeight ? "100%" : "auto",
            padding: preset.padding,
            boxSizing: "border-box",
            display: "flex",
            userSelect: "none",
            touchAction: interactive ? "pan-y" : "auto",
            ...style,
        }),
        [style, preset.padding, interactive, hasExplicitHeight]
    )

    const cardStyle: CSSProperties = useMemo(
        () => ({
            position: "relative",
            width: "100%",
            height: hasExplicitHeight ? "100%" : "auto",
            aspectRatio: aspectRatioValue,
            borderRadius: preset.radius,
            overflow: "hidden",
            background: preset.background,
            border: `1px solid ${preset.borderColor}`,
            boxShadow: preset.shadow,
            transform: `perspective(${Math.max(
                200,
                preset.perspective
            )}px) rotateX(0deg) rotateY(0deg) translateZ(0)`,
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            contentVisibility: "auto",
        }),
        [preset, aspectRatioValue, hasExplicitHeight]
    )

    const beforeWrapStyle: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            inset: 0,
            clipPath: `inset(0 ${100 - initialClamped}% 0 0)`,
            willChange: interactive && !isStatic ? "clip-path" : "auto",
        }),
        [initialClamped, interactive, isStatic]
    )

    const dividerStyle: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            top: 0,
            left: `${initialClamped}%`,
            width: 2,
            height: "100%",
            transform: "translateX(-1px) translateZ(2px)",
            background: DIVIDER_COLOR,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.25), 0 0 18px rgba(0,0,0,0.45)",
            zIndex: 5,
            touchAction: interactive ? "none" : "auto",
            outline: "none",
        }),
        [initialClamped, interactive]
    )

    const handleStyle: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            top: "50%",
            left: `${initialClamped}%`,
            transform: "translate(-50%, -50%) translateZ(3px)",
            width: preset.handleSize,
            height: preset.handleSize,
            borderRadius: 999,
            background: "rgba(255,255,255,0.10)",
            border: `1px solid ${preset.borderColor}`,
            boxShadow: "0 10px 26px rgba(0,0,0,0.35)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: showHandle ? "flex" : "none",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 7,
            pointerEvents: interactive ? "auto" : "none",
            touchAction: interactive ? "none" : "auto",
            outline: "none",
        }),
        [
            initialClamped,
            preset.handleSize,
            preset.borderColor,
            showHandle,
            interactive,
        ]
    )

    const glareStyle: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            inset: 0,
            zIndex: 4,
            pointerEvents: "none",
            opacity: preset.glareOpacity,
            mixBlendMode: preset.glareBlend,
            background: `radial-gradient(70% 70% at var(--glare-x, 50%) var(--glare-y, 50%), ${preset.glareColor} 0%, rgba(255,255,255,0) 60%)`,
            transform: "translateZ(2px)",
        }),
        [preset.glareOpacity, preset.glareColor, preset.glareBlend]
    )

    const labelBaseStyle: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            zIndex: 6,
            display: "inline-flex",
            alignItems: "center",
            padding: "6px 10px",
            borderRadius: 999,
            background: preset.labelBackground,
            color: preset.labelTextColor,
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: `1px solid ${preset.borderColor}`,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            fontSize: preset.labelFontSize,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            lineHeight: 1,
        }),
        [preset]
    )

    const labelTopOrBottom =
        labelPosition === "top" ? { top: 12 } : { bottom: 12 }

    // ─── Accessibility ───────────────────────────────────────────────────────

    const ariaValueNow = useMemo(
        () => Math.round(clamp(splitState, 0, 100)),
        [splitState]
    )

    const a11yLabel = useMemo(
        () =>
            `Before/after image comparison. Before: ${
                beforeImage.alt || "image"
            }. After: ${afterImage.alt || "image"}.`,
        [beforeImage.alt, afterImage.alt]
    )

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div
            ref={wrapRef}
            style={containerStyle}
            onPointerMove={onPointerMove}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            onPointerDown={onContainerPointerDown}
            onPointerUp={onContainerPointerUp}
            onPointerCancel={onContainerPointerUp}
            onDoubleClick={onDoubleClick}
            role="group"
            aria-label={a11yLabel}
            data-tba={uid}
        >
            <div ref={cardRef} style={cardStyle}>
                <img
                    src={afterImage.src}
                    srcSet={afterImage.srcSet}
                    alt={afterImage.alt || "After"}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    style={useSizer ? SIZER_IMG_STYLE : OVERLAY_IMG_STYLE}
                    onError={(e) => onImgError(e, "After")}
                />

                <div ref={beforeWrapRef} style={beforeWrapStyle} aria-hidden>
                    <img
                        src={beforeImage.src}
                        srcSet={beforeImage.srcSet}
                        alt={beforeImage.alt || "Before"}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        style={OVERLAY_IMG_STYLE}
                        onError={(e) => onImgError(e, "Before")}
                    />
                </div>

                {preset.showVignette && (
                    <div style={VIGNETTE_STYLE} aria-hidden />
                )}
                {showGlow && <div style={glareStyle} aria-hidden />}

                {showLabels && (
                    <>
                        <div
                            style={{
                                ...labelBaseStyle,
                                ...labelTopOrBottom,
                                left: 12,
                            }}
                            aria-hidden
                        >
                            {beforeLabel}
                        </div>
                        <div
                            style={{
                                ...labelBaseStyle,
                                ...labelTopOrBottom,
                                right: 12,
                            }}
                            aria-hidden
                        >
                            {afterLabel}
                        </div>
                    </>
                )}

                <div
                    ref={dividerRef}
                    style={dividerStyle}
                    onPointerDown={onDragPointerDown}
                    onPointerUp={onDragPointerUp}
                    onPointerCancel={onDragPointerUp}
                    onKeyDown={onKeyDown}
                    role={interactive ? "slider" : undefined}
                    tabIndex={interactive ? 0 : -1}
                    aria-label={
                        interactive
                            ? "Adjust before/after comparison"
                            : undefined
                    }
                    aria-valuemin={interactive ? 0 : undefined}
                    aria-valuemax={interactive ? 100 : undefined}
                    aria-valuenow={interactive ? ariaValueNow : undefined}
                    aria-valuetext={
                        interactive ? `${ariaValueNow}% revealed` : undefined
                    }
                    aria-orientation={interactive ? "horizontal" : undefined}
                    data-grab={interactive ? "" : undefined}
                >
                    <div style={DIVIDER_HIT_STYLE} />
                </div>

                <div
                    ref={handleRef}
                    style={handleStyle}
                    onPointerDown={onDragPointerDown}
                    onPointerUp={onDragPointerUp}
                    onPointerCancel={onDragPointerUp}
                    aria-hidden
                >
                    <svg
                        width={Math.max(14, preset.handleSize * 0.42)}
                        height={Math.max(14, preset.handleSize * 0.42)}
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                    >
                        <path
                            d="M9 7L4 12L9 17"
                            stroke="rgba(255,255,255,0.85)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M15 7L20 12L15 17"
                            stroke="rgba(255,255,255,0.85)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </div>
        </div>
    )
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(TiltBeforeAfterCard, {
    beforeImage: { type: ControlType.ResponsiveImage, title: "Before" },
    afterImage: { type: ControlType.ResponsiveImage, title: "After" },

    mode: {
        type: ControlType.Enum,
        title: "Style",
        options: ["subtle", "glass", "showcase"],
        optionTitles: ["Subtle", "Glass", "Showcase"],
        defaultValue: "glass",
        displaySegmentedControl: true,
    },

    aspectRatio: {
        type: ControlType.Enum,
        title: "Aspect",
        options: ["16:9", "4:3", "3:2", "1:1", "21:9", "auto"],
        optionTitles: ["16:9", "4:3", "3:2", "1:1", "21:9", "Auto"],
        defaultValue: "16:9",
    },

    initialSplit: {
        type: ControlType.Number,
        title: "Split",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    interactive: {
        type: ControlType.Boolean,
        title: "Interactive",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showHandle: {
        type: ControlType.Boolean,
        title: "Handle",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showGlow: {
        type: ControlType.Boolean,
        title: "Glow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    showLabels: {
        type: ControlType.Boolean,
        title: "Labels",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    beforeLabel: {
        type: ControlType.String,
        title: "Before Text",
        defaultValue: "Before",
        hidden: (p) => !p.showLabels,
    },
    afterLabel: {
        type: ControlType.String,
        title: "After Text",
        defaultValue: "After",
        hidden: (p) => !p.showLabels,
    },
    labelPosition: {
        type: ControlType.Enum,
        title: "Label Pos",
        options: ["top", "bottom"],
        optionTitles: ["Top", "Bottom"],
        defaultValue: "top",
        hidden: (p) => !p.showLabels,
    },
})
