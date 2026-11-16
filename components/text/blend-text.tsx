/**
 * Blend Text — Multi-layer text effect with dynamic animations.
 *
 * Framer Native Version 2.0
 * • Three animation modes: Static, Scroll, Mouse-follow
 * • Smooth, soft transitions with optimized animation
 * • Automatic performance adaptation (always on)
 * • All optimizations included
 *
 * @framerDisplayName "Blend Text"
 * @framerDisableUnlink
 * @framerIntrinsicWidth 320
 * @framerIntrinsicHeight 80
 * @version 2.0
 * @author Amr Rashed
 * @website https://amrrashed.com
 * @license Commercial use allowed with attribution
 */

import React, {
    useMemo,
    useState,
    useEffect,
    useRef,
    useCallback,
    useLayoutEffect,
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

import { motion, useMotionValue, useSpring, animate } from "framer-motion"

/* ==== TYPES ==== */

interface RgbColor {
    r: number
    g: number
    b: number
    a: number
}

interface FontProperties {
    fontSize?: number
    fontFamily?: string
    fontWeight?: number | string
    lineHeight?: number | string
    letterSpacing?: number | string
    textAlign?: "left" | "center" | "right"
    [key: string]: unknown
}

interface BlendTextProps {
    text: string
    font?: FontProperties
    steps?: number
    distance?: number
    direction?: number
    faceColor?: string
    color1?: string
    color2?: string
    reverse?: boolean
    renderMode?: "solid" | "outline" | "both"
    outlineWidth?: number
    animation?: "static" | "scroll" | "mouse"
    scrollMode?: "collapse" | "expand"
    cursorReverse?: boolean
    mouseMode?: "Text Only" | "Viewport"
}

interface AnimationState {
    scroll: { current: number; target: number; active: boolean }
    mouse: {
        current: { x: number; y: number; dist: number }
        target: { x: number; y: number; dist: number }
        active: boolean
        lastActivity: number
        reductionFactor?: number
    }
    frame: number | null
}

interface LayerPosition {
    index: number
    progress: number
    curvedProgress: number
}

interface PerformanceMode {
    mode: "high" | "medium" | "low" | "potato"
    maxLayers: number
    smoothing: number
}

/* ==== CONSTANTS ==== */

const isBrowser = typeof window !== "undefined"
const DEFAULT_CURSOR_RANGE = 200
const DEFAULT_DEPTH_CURVE = 1
const MOUSE_DEAD_ZONE = 5
const TOUCH_DEAD_ZONE = 10
const MOUSE_IDLE_TIMEOUT = 800
// Capped at practical visual limits
const MAX_RENDERED_LAYERS = 25
const MAX_RENDERED_LAYERS_MOBILE = 20

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
    high: { fps: 55, maxLayers: 25, smoothing: 0.92 },
    medium: { fps: 40, maxLayers: 15, smoothing: 0.88 },
    low: { fps: 25, maxLayers: 8, smoothing: 0.85 },
    potato: { fps: 0, maxLayers: 3, smoothing: 0 },
}

// Default transition for soft, smooth animation
const DEFAULT_TRANSITION: Transition = {
    type: "spring",
    stiffness: 100, // Responsive but smooth
    damping: 28, // Well-controlled, no bounce
    mass: 0.8, // Slightly lighter for quicker response
}

// Default font settings that match the control panel
const DEFAULT_FONT = {
    fontSize: 64,
    fontFamily: "Inter, sans-serif", // Match Framer's font picker format
    fontWeight: 900, // Black weight in Inter
    lineHeight: 1.2,
    letterSpacing: 0,
    textAlign: "center" as const,
}

/* ==== UTILS ==== */

const webkitStrokeSupported = (() => {
    if (!isBrowser) return false
    const testEl = document.createElement("div")
    return (
        "webkitTextStroke" in testEl.style || "WebkitTextStroke" in testEl.style
    )
})()

const isMobileDevice = (() => {
    if (!isBrowser) return false
    return (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        ) ||
        window.matchMedia("(max-width: 768px)").matches ||
        window.matchMedia("(pointer: coarse)").matches
    )
})()

const clamp01 = (t: number) => Math.max(0, Math.min(1, t))

const debounce = (fn: Function, delay: number) => {
    let timeoutId: number
    return (...args: any[]) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => fn(...args), delay) as unknown as number
    }
}

// Auto performance monitoring (always on)
function usePerformanceMonitor(): PerformanceMode {
    const [performance, setPerformance] = useState<PerformanceMode>({
        mode: "high",
        maxLayers: PERFORMANCE_THRESHOLDS.high.maxLayers,
        smoothing: PERFORMANCE_THRESHOLDS.high.smoothing,
    })

    const frameTimesRef = useRef<number[]>([])
    const lastTimeRef = useRef<number>(0)
    const monitoringRef = useRef<boolean>(false)

    useEffect(() => {
        if (!isBrowser) return

        let rafId: number
        let sampleCount = 0
        const maxSamples = 60

        const monitor = (currentTime: number) => {
            if (lastTimeRef.current) {
                const delta = currentTime - lastTimeRef.current
                const fps = 1000 / delta

                frameTimesRef.current.push(fps)
                if (frameTimesRef.current.length > maxSamples) {
                    frameTimesRef.current.shift()
                }

                sampleCount++

                // Analyze every 60 frames
                if (
                    sampleCount >= maxSamples &&
                    frameTimesRef.current.length >= 30
                ) {
                    const avgFps =
                        frameTimesRef.current.reduce((a, b) => a + b, 0) /
                        frameTimesRef.current.length

                    let newMode: PerformanceMode["mode"] = "high"
                    if (avgFps < PERFORMANCE_THRESHOLDS.low.fps) {
                        newMode = "potato"
                    } else if (avgFps < PERFORMANCE_THRESHOLDS.medium.fps) {
                        newMode = "low"
                    } else if (avgFps < PERFORMANCE_THRESHOLDS.high.fps) {
                        newMode = "medium"
                    }

                    const config = PERFORMANCE_THRESHOLDS[newMode]
                    setPerformance({
                        mode: newMode,
                        maxLayers: config.maxLayers,
                        smoothing: config.smoothing,
                    })

                    sampleCount = 0
                    frameTimesRef.current = []
                }
            }

            lastTimeRef.current = currentTime

            if (monitoringRef.current) {
                rafId = requestAnimationFrame(monitor)
            }
        }

        monitoringRef.current = true
        rafId = requestAnimationFrame(monitor)

        return () => {
            monitoringRef.current = false
            cancelAnimationFrame(rafId)
        }
    }, [])

    return performance
}

function resolveCssVar(varName: string): string {
    if (!isBrowser || !varName.startsWith("var(") || !varName.endsWith(")")) {
        return varName
    }

    const match = varName.match(/var\(([^,)]+)(?:,\s*([^)]+))?\)/)
    if (!match) return varName

    const token = match[1].trim()
    const fallback = match[2]?.trim() || ""

    try {
        const resolved = getComputedStyle(
            document.documentElement
        ).getPropertyValue(token)
        return resolved.trim() || fallback || varName
    } catch {
        return fallback || varName
    }
}

function parseCssColor(input: string): RgbColor {
    const resolved = resolveCssVar(input.trim().toLowerCase())
    let result: RgbColor = { r: 0, g: 0, b: 0, a: 1 }

    if (resolved.startsWith("#")) {
        const clean = resolved.slice(1)
        if (clean.length === 3) {
            result = {
                r: parseInt(clean[0] + clean[0], 16),
                g: parseInt(clean[1] + clean[1], 16),
                b: parseInt(clean[2] + clean[2], 16),
                a: 1,
            }
        } else if (clean.length === 6) {
            result = {
                r: parseInt(clean.slice(0, 2), 16),
                g: parseInt(clean.slice(2, 4), 16),
                b: parseInt(clean.slice(4, 6), 16),
                a: 1,
            }
        } else if (clean.length === 8) {
            result = {
                r: parseInt(clean.slice(0, 2), 16),
                g: parseInt(clean.slice(2, 4), 16),
                b: parseInt(clean.slice(4, 6), 16),
                a: parseInt(clean.slice(6, 8), 16) / 255,
            }
        }
    } else if (resolved.startsWith("rgb(")) {
        const match = resolved.match(
            /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/
        )
        if (match) {
            result = {
                r: parseInt(match[1], 10),
                g: parseInt(match[2], 10),
                b: parseInt(match[3], 10),
                a: 1,
            }
        }
    } else if (resolved.startsWith("rgba(")) {
        const match = resolved.match(
            /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/
        )
        if (match) {
            result = {
                r: parseInt(match[1], 10),
                g: parseInt(match[2], 10),
                b: parseInt(match[3], 10),
                a: parseFloat(match[4]),
            }
        }
    } else if (resolved.startsWith("hsl(")) {
        const match = resolved.match(
            /hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/
        )
        if (match) {
            const h = parseFloat(match[1])
            const s = parseFloat(match[2]) / 100
            const l = parseFloat(match[3]) / 100
            const k = (n: number) => (n + h / 30) % 12
            const a = s * Math.min(l, 1 - l)
            const f = (n: number) =>
                l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
            result = {
                r: Math.round(255 * f(0)),
                g: Math.round(255 * f(8)),
                b: Math.round(255 * f(4)),
                a: 1,
            }
        }
    } else if (resolved.startsWith("hsla(")) {
        const match = resolved.match(
            /hsla\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*,\s*([\d.]+)\s*\)/
        )
        if (match) {
            const h = parseFloat(match[1])
            const s = parseFloat(match[2]) / 100
            const l = parseFloat(match[3]) / 100
            const alpha = parseFloat(match[4])
            const k = (n: number) => (n + h / 30) % 12
            const a = s * Math.min(l, 1 - l)
            const f = (n: number) =>
                l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
            result = {
                r: Math.round(255 * f(0)),
                g: Math.round(255 * f(8)),
                b: Math.round(255 * f(4)),
                a: alpha,
            }
        }
    }

    return result
}

function interpolateRgb(a: RgbColor, b: RgbColor, t: number): RgbColor {
    const clampedT = clamp01(t)
    return {
        r: Math.round(a.r + (b.r - a.r) * clampedT),
        g: Math.round(a.g + (b.g - a.g) * clampedT),
        b: Math.round(a.b + (b.b - a.b) * clampedT),
        a: a.a + (b.a - a.a) * clampedT,
    }
}

function rgbToCss(color: RgbColor): string {
    if (color.a !== undefined && color.a !== 1) {
        return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
    }
    return `rgb(${color.r}, ${color.g}, ${color.b})`
}

// Persistent text measurer singleton with cache
let textMeasurerElement: HTMLDivElement | null = null
const measurementCache = new Map<string, any>()

function getTextMeasurer(): HTMLDivElement {
    if (!textMeasurerElement && isBrowser) {
        textMeasurerElement = document.createElement("div")
        textMeasurerElement.style.cssText =
            "position:absolute;visibility:hidden;pointer-events:none;white-space:nowrap;"
        textMeasurerElement.id = "blend-text-measurer"
        document.body.appendChild(textMeasurerElement)
    }
    return textMeasurerElement!
}

/* ==== COMPONENT ==== */

export default function BlendText({
    text = "BLEND",
    font, // Let Framer pass whatever it wants
    steps = 10,
    distance = 28,
    direction = 45, // Changed default from 0 to 45
    faceColor = "#ffffff",
    color1 = "#888888",
    color2 = "#000000",
    reverse = false,
    renderMode = "solid",
    outlineWidth = 1,
    animation = "static",
    scrollMode = "collapse",
    cursorReverse = false,
    mouseMode = "Viewport",
    transition = DEFAULT_TRANSITION,
}: BlendTextProps) {
    // Check if font object has any real values (Framer sometimes passes empty objects)
    const fontHasValues =
        font &&
        ((font.fontSize && font.fontSize > 0) ||
            (font.fontFamily && font.fontFamily !== "") ||
            (font.fontWeight && font.fontWeight !== "") ||
            font.lineHeight ||
            font.letterSpacing !== undefined ||
            font.textAlign)

    // Use the font if it has real values, otherwise use defaults
    const resolvedFont = useMemo(() => {
        if (!fontHasValues) {
            return DEFAULT_FONT
        }

        return {
            fontSize: font.fontSize || DEFAULT_FONT.fontSize,
            fontFamily: font.fontFamily || DEFAULT_FONT.fontFamily,
            fontWeight: font.fontWeight || DEFAULT_FONT.fontWeight,
            lineHeight: font.lineHeight ?? DEFAULT_FONT.lineHeight,
            letterSpacing: font.letterSpacing ?? DEFAULT_FONT.letterSpacing,
            textAlign: font.textAlign || DEFAULT_FONT.textAlign,
        }
    }, [font, fontHasValues])
    const containerRef = useRef<HTMLDivElement>(null)
    const rectRef = useRef<DOMRect | null>(null)
    const textMeasurementsRef = useRef<any>(null)
    const rafIds = useRef<Set<number>>(new Set())

    // Framer Motion values for smooth animations
    const scrollMotionValue = useMotionValue(0)
    const mouseXMotionValue = useMotionValue(0)
    const mouseYMotionValue = useMotionValue(0)
    const mouseDistMotionValue = useMotionValue(0)

    // Use spring with soft default animation
    const smoothedScrollProgress = useSpring(
        scrollMotionValue,
        DEFAULT_TRANSITION
    )
    const smoothedMouseX = useSpring(mouseXMotionValue, DEFAULT_TRANSITION)
    const smoothedMouseY = useSpring(mouseYMotionValue, DEFAULT_TRANSITION)
    const smoothedMouseDist = useSpring(
        mouseDistMotionValue,
        DEFAULT_TRANSITION
    )

    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
    const [prefersHighContrast, setPrefersHighContrast] = useState(false)
    const [isMobile] = useState(isMobileDevice)
    const [mouseState, setMouseState] = useState({ x: 0, y: 0, dist: 0 })
    const [scrollProgress, setScrollProgress] = useState(0)

    // Auto performance monitoring (always on)
    const performanceMode = usePerformanceMonitor()

    const effectiveAnimation = prefersReducedMotion ? "static" : animation
    const effectiveDeadZone = isMobile ? TOUCH_DEAD_ZONE : MOUSE_DEAD_ZONE

    const HOVER = effectiveAnimation === "mouse" && mouseMode === "Text Only"
    const effectiveCursorScope = HOVER ? "element" : "window"

    const computedAngle = useMemo(() => {
        return ((direction + 180) * Math.PI) / 180
    }, [direction])

    const resolvedColors = useMemo(
        () => ({
            face: parseCssColor(faceColor),
            color1: parseCssColor(color1),
            color2: parseCssColor(color2),
        }),
        [faceColor, color1, color2]
    )

    const clampedSteps = useMemo(() => {
        if (prefersHighContrast) {
            return Math.max(1, Math.min(steps, 3))
        }

        // Use auto-detected performance limits
        const perfMax = performanceMode.maxLayers

        if (isMobile) {
            return Math.max(
                1,
                Math.min(steps, Math.min(MAX_RENDERED_LAYERS_MOBILE, perfMax))
            )
        }

        const maxSteps =
            effectiveAnimation === "mouse" ? MAX_RENDERED_LAYERS : 100
        return Math.max(1, Math.min(steps, Math.min(maxSteps, perfMax)))
    }, [
        steps,
        prefersHighContrast,
        effectiveAnimation,
        isMobile,
        performanceMode,
    ])

    // Subscribe to motion value changes
    useEffect(() => {
        const unsubX = smoothedMouseX.on("change", (v) => {
            setMouseState((prev) => ({ ...prev, x: v }))
        })
        const unsubY = smoothedMouseY.on("change", (v) => {
            setMouseState((prev) => ({ ...prev, y: v }))
        })
        const unsubDist = smoothedMouseDist.on("change", (v) => {
            setMouseState((prev) => ({ ...prev, dist: v }))
        })
        const unsubScroll = smoothedScrollProgress.on("change", (v) => {
            setScrollProgress(v)
        })

        return () => {
            unsubX()
            unsubY()
            unsubDist()
            unsubScroll()
        }
    }, [
        smoothedMouseX,
        smoothedMouseY,
        smoothedMouseDist,
        smoothedScrollProgress,
    ])

    // Setup persistent text measurer
    useLayoutEffect(() => {
        if (!isBrowser) return
        getTextMeasurer()

        return () => {
            // Cleanup is handled globally
        }
    }, [])

    // Cleanup RAF IDs on unmount
    useEffect(() => {
        return () => {
            rafIds.current.forEach((id) => cancelAnimationFrame(id))
            rafIds.current.clear()
        }
    }, [])

    const scheduleFrame = useCallback((callback: () => void) => {
        const id = requestAnimationFrame(() => {
            rafIds.current.delete(id)
            callback()
        })
        rafIds.current.add(id)
        return id
    }, [])

    useEffect(() => {
        if (!isBrowser) return

        const motionQuery = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        )
        setPrefersReducedMotion(motionQuery.matches)

        const handleMotionChange = (e: MediaQueryListEvent) => {
            setPrefersReducedMotion(e.matches)
        }

        const contrastQueries = [
            "(prefers-contrast: high)",
            "(-ms-high-contrast: active)",
            "(-ms-high-contrast: black-on-white)",
            "(-ms-high-contrast: white-on-black)",
        ]

        const updateHighContrast = () => {
            const isHighContrast = contrastQueries.some(
                (query) => window.matchMedia(query).matches
            )
            setPrefersHighContrast(isHighContrast)
        }

        updateHighContrast()
        motionQuery.addEventListener("change", handleMotionChange)

        const contrastListeners = contrastQueries.map((query) => {
            const mq = window.matchMedia(query)
            mq.addEventListener("change", updateHighContrast)
            return mq
        })

        return () => {
            motionQuery.removeEventListener("change", handleMotionChange)
            contrastListeners.forEach((mq) =>
                mq.removeEventListener("change", updateHighContrast)
            )
        }
    }, [])

    const mouseAngle = useMemo(() => {
        if (effectiveAnimation !== "mouse") return 0
        const ang = Math.atan2(mouseState.y, mouseState.x)
        return cursorReverse ? ang + Math.PI : ang
    }, [effectiveAnimation, mouseState.x, mouseState.y, cursorReverse])

    const mouseFactor = useMemo(() => {
        if (effectiveAnimation !== "mouse") return 0
        const dist = Math.max(0, mouseState.dist - effectiveDeadZone)
        const norm = clamp01(dist / Math.max(1, DEFAULT_CURSOR_RANGE))
        const t = norm
        return t * t * (3 - 2 * t)
    }, [effectiveAnimation, mouseState.dist, effectiveDeadZone])

    const effectiveAngle = useMemo(() => {
        return effectiveAnimation === "mouse" ? mouseAngle : computedAngle
    }, [effectiveAnimation, mouseAngle, computedAngle])

    const computeScrollProgress = useCallback(() => {
        if (!isBrowser) return 0
        const el = containerRef.current
        if (!el) return 0

        const rect = el.getBoundingClientRect()
        const windowHeight = window.innerHeight

        if (scrollMode === "expand") {
            const elementTop = rect.top
            const triggerPoint = windowHeight * 0.5

            if (elementTop >= triggerPoint) {
                return 0
            } else {
                const distancePastTrigger = triggerPoint - elementTop
                const maxDistance = windowHeight * 0.5 + rect.height
                return clamp01(distancePastTrigger / maxDistance)
            }
        } else {
            const elementCenter = rect.top + rect.height / 2
            const viewportCenter = windowHeight / 2
            const scrollRange = windowHeight
            const offset = viewportCenter - elementCenter
            return clamp01((offset + scrollRange / 2) / scrollRange)
        }
    }, [scrollMode])

    const handleScroll = useCallback(() => {
        const progress = computeScrollProgress()
        scrollMotionValue.set(progress)
    }, [computeScrollProgress, scrollMotionValue])

    const handleResize = useCallback(() => {
        const progress = computeScrollProgress()
        scrollMotionValue.set(progress)
    }, [computeScrollProgress, scrollMotionValue])

    const debouncedResize = useMemo(
        () => debounce(handleResize, 150),
        [handleResize]
    )

    useEffect(() => {
        if (!isBrowser || effectiveAnimation !== "scroll") return

        window.addEventListener("scroll", handleScroll, { passive: true })
        window.addEventListener("resize", debouncedResize as any, {
            passive: true,
        })

        handleResize()

        return () => {
            window.removeEventListener("scroll", handleScroll)
            window.removeEventListener("resize", debouncedResize as any)
        }
    }, [effectiveAnimation, handleScroll, debouncedResize, handleResize])

    // Keyboard navigation support for mouse animation
    useEffect(() => {
        if (effectiveAnimation !== "mouse" || !containerRef.current) return

        const handleKeyboard = (e: KeyboardEvent) => {
            if (!containerRef.current?.matches(":focus-within")) return

            const step = 20
            let dx = 0,
                dy = 0

            switch (e.key) {
                case "ArrowUp":
                    dy = -step
                    break
                case "ArrowDown":
                    dy = step
                    break
                case "ArrowLeft":
                    dx = -step
                    break
                case "ArrowRight":
                    dx = step
                    break
                case "Escape":
                    mouseXMotionValue.set(0)
                    mouseYMotionValue.set(0)
                    mouseDistMotionValue.set(0)
                    return
                default:
                    return
            }

            if (dx || dy) {
                e.preventDefault()
                const currentX = mouseXMotionValue.get()
                const currentY = mouseYMotionValue.get()
                const newX = Math.max(
                    -DEFAULT_CURSOR_RANGE,
                    Math.min(DEFAULT_CURSOR_RANGE, currentX + dx)
                )
                const newY = Math.max(
                    -DEFAULT_CURSOR_RANGE,
                    Math.min(DEFAULT_CURSOR_RANGE, currentY + dy)
                )

                mouseXMotionValue.set(newX)
                mouseYMotionValue.set(newY)
                mouseDistMotionValue.set(Math.hypot(newX, newY))
            }
        }

        document.addEventListener("keydown", handleKeyboard)
        return () => document.removeEventListener("keydown", handleKeyboard)
    }, [
        effectiveAnimation,
        mouseXMotionValue,
        mouseYMotionValue,
        mouseDistMotionValue,
    ])

    useEffect(() => {
        if (!isBrowser || effectiveAnimation !== "mouse") return
        const el = containerRef.current
        if (!el) return

        let resizeTimeout: number
        const ro = new ResizeObserver(() => {
            clearTimeout(resizeTimeout)
            resizeTimeout = window.setTimeout(() => {
                rectRef.current = el.getBoundingClientRect()
            }, 100) as unknown as number
        })
        ro.observe(el)

        scheduleFrame(() => {
            rectRef.current = el.getBoundingClientRect()
        })

        let scrollRafId: number
        const onScroll = () => {
            cancelAnimationFrame(scrollRafId)
            scrollRafId = scheduleFrame(() => {
                rectRef.current = el.getBoundingClientRect()
            })
        }
        window.addEventListener("scroll", onScroll, { passive: true })

        let idleTimeout: number

        const onPointerMove = (e: PointerEvent) => {
            const rect = rectRef.current
            if (rect) {
                const cx = rect.left + rect.width / 2
                const cy = rect.top + rect.height / 2
                const dx = e.clientX - cx
                const dy = e.clientY - cy
                const dist = Math.hypot(dx, dy)

                if (effectiveCursorScope === "window") {
                    const elementUnderMouse = document.elementFromPoint(
                        e.clientX,
                        e.clientY
                    )
                    const isOverText = el.contains(elementUnderMouse)
                    const isInteractive =
                        elementUnderMouse &&
                        (elementUnderMouse.tagName === "BUTTON" ||
                            elementUnderMouse.tagName === "A" ||
                            elementUnderMouse.tagName === "INPUT" ||
                            elementUnderMouse.tagName === "TEXTAREA" ||
                            elementUnderMouse.tagName === "SELECT" ||
                            elementUnderMouse.tagName === "LABEL" ||
                            elementUnderMouse.closest("button") !== null ||
                            elementUnderMouse.closest("a") !== null ||
                            (elementUnderMouse as HTMLElement).onclick !==
                                null ||
                            (elementUnderMouse as HTMLElement).style.cursor ===
                                "pointer")

                    const reduction = isOverText || isInteractive ? 0.1 : 1.0

                    mouseXMotionValue.set(dx * reduction)
                    mouseYMotionValue.set(dy * reduction)
                    mouseDistMotionValue.set(dist * reduction)
                } else {
                    mouseXMotionValue.set(dx)
                    mouseYMotionValue.set(dy)
                    mouseDistMotionValue.set(dist)
                }

                // Reset idle timer
                clearTimeout(idleTimeout)
                idleTimeout = window.setTimeout(() => {
                    mouseXMotionValue.set(0)
                    mouseYMotionValue.set(0)
                    mouseDistMotionValue.set(0)
                }, MOUSE_IDLE_TIMEOUT) as unknown as number
            }
        }

        const onPointerEnter = (e: PointerEvent) => {
            // Keep for potential future hover states
        }

        const onPointerLeave = (e: PointerEvent) => {
            if (HOVER) {
                mouseXMotionValue.set(0)
                mouseYMotionValue.set(0)
                mouseDistMotionValue.set(0)
            }
        }

        const onDocumentMouseLeave = (e: MouseEvent) => {
            const from = e.relatedTarget || (e as any).toElement
            if (!from || from.nodeName === "HTML") {
                mouseXMotionValue.set(0)
                mouseYMotionValue.set(0)
                mouseDistMotionValue.set(0)
            }
        }

        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0]
                const rect = rectRef.current
                if (rect) {
                    const cx = rect.left + rect.width / 2
                    const cy = rect.top + rect.height / 2
                    const dx = touch.clientX - cx
                    const dy = touch.clientY - cy
                    const dist = Math.hypot(dx, dy)

                    mouseXMotionValue.set(dx)
                    mouseYMotionValue.set(dy)
                    mouseDistMotionValue.set(dist)

                    clearTimeout(idleTimeout)
                    idleTimeout = window.setTimeout(() => {
                        mouseXMotionValue.set(0)
                        mouseYMotionValue.set(0)
                        mouseDistMotionValue.set(0)
                    }, MOUSE_IDLE_TIMEOUT) as unknown as number
                }
            }
        }

        const onTouchEnd = () => {
            clearTimeout(idleTimeout)
            idleTimeout = window.setTimeout(() => {
                mouseXMotionValue.set(0)
                mouseYMotionValue.set(0)
                mouseDistMotionValue.set(0)
            }, MOUSE_IDLE_TIMEOUT) as unknown as number
        }

        const target: EventTarget =
            effectiveCursorScope === "window" ? document : el

        target.addEventListener("pointermove", onPointerMove as any, {
            passive: true,
        })
        target.addEventListener("pointerenter", onPointerEnter as any, {
            passive: true,
        })
        target.addEventListener("pointerleave", onPointerLeave as any, {
            passive: true,
        })
        target.addEventListener("touchmove", onTouchMove as any, {
            passive: true,
        })
        target.addEventListener("touchend", onTouchEnd as any, {
            passive: true,
        })

        if (effectiveCursorScope === "window") {
            document.addEventListener("mouseout", onDocumentMouseLeave as any, {
                passive: true,
            })
        }

        return () => {
            clearTimeout(idleTimeout)
            cancelAnimationFrame(scrollRafId)
            ro.disconnect()
            window.removeEventListener("scroll", onScroll)
            target.removeEventListener("pointermove", onPointerMove as any)
            target.removeEventListener("pointerenter", onPointerEnter as any)
            target.removeEventListener("pointerleave", onPointerLeave as any)
            target.removeEventListener("touchmove", onTouchMove as any)
            target.removeEventListener("touchend", onTouchEnd as any)

            if (effectiveCursorScope === "window") {
                document.removeEventListener(
                    "mouseout",
                    onDocumentMouseLeave as any
                )
            }
        }
    }, [
        effectiveAnimation,
        effectiveCursorScope,
        HOVER,
        scheduleFrame,
        mouseXMotionValue,
        mouseYMotionValue,
        mouseDistMotionValue,
    ])

    const actualDistance = useMemo(() => {
        if (effectiveAnimation === "mouse") {
            return Math.max(0, distance) * mouseFactor
        }

        if (effectiveAnimation !== "scroll") {
            return Math.max(0, distance)
        }

        let easedProgress: number

        if (scrollProgress < 0.5) {
            easedProgress = 4 * scrollProgress * scrollProgress * scrollProgress
        } else {
            const p = 2 * scrollProgress - 2
            easedProgress = 1 + (p * p * p) / 2
        }

        if (scrollMode === "collapse") {
            return Math.max(0, distance * (1 - easedProgress))
        } else {
            return Math.max(0, distance * easedProgress)
        }
    }, [effectiveAnimation, distance, scrollProgress, scrollMode, mouseFactor])

    const hasVisibleEffect = actualDistance >= 0.1

    const layerPositions = useMemo(() => {
        if (!hasVisibleEffect) return []

        const positions: LayerPosition[] = []
        const backgroundLayers = Math.max(0, clampedSteps - 1)

        for (let i = 0; i < backgroundLayers; i++) {
            const progress =
                backgroundLayers === 1 ? 0.5 : 1 - i / backgroundLayers
            const curvedProgress = Math.pow(progress, DEFAULT_DEPTH_CURVE)

            positions.push({
                index: i,
                progress,
                curvedProgress,
            })
        }

        return positions
    }, [clampedSteps, hasVisibleEffect])

    const layers = useMemo(() => {
        const result: Array<{
            x: number
            y: number
            color: string
            strokeWidth: number
            isTop: boolean
            zIndex: number
            opacity: number
        }> = []

        if (!hasVisibleEffect) {
            result.push({
                x: 0,
                y: 0,
                color: rgbToCss(resolvedColors.face),
                strokeWidth: outlineWidth,
                isTop: true,
                zIndex: 999,
                opacity: 1,
            })
            return result
        }

        const { color1: color1Rgb, color2: color2Rgb } = resolvedColors

        layerPositions.forEach((pos) => {
            const layerDistance = actualDistance * pos.curvedProgress
            const t = reverse ? 1 - pos.progress : pos.progress
            const interpolatedColor = interpolateRgb(color1Rgb, color2Rgb, t)

            if (interpolatedColor.a > 0.01) {
                const xPos = Math.cos(effectiveAngle) * layerDistance
                const yPos = Math.sin(effectiveAngle) * layerDistance

                result.push({
                    x: xPos,
                    y: yPos,
                    color: rgbToCss(interpolatedColor),
                    strokeWidth: outlineWidth,
                    isTop: false,
                    zIndex: pos.index,
                    opacity: interpolatedColor.a,
                })
            }
        })

        result.push({
            x: 0,
            y: 0,
            color: rgbToCss(resolvedColors.face),
            strokeWidth: outlineWidth,
            isTop: true,
            zIndex: 999,
            opacity: 1,
        })

        return result
    }, [
        layerPositions,
        actualDistance,
        effectiveAngle,
        resolvedColors,
        outlineWidth,
        reverse,
        hasVisibleEffect,
    ])

    const textMeasurements = useMemo(() => {
        if (!isBrowser)
            return {
                width: 320,
                height: 80,
                baseline: 60,
                padding: 50,
                textWidth: 270,
                textHeight: 64,
            }

        const cacheKey = `${text}-${resolvedFont.fontSize}-${resolvedFont.fontFamily}-${resolvedFont.fontWeight}-${resolvedFont.lineHeight}-${resolvedFont.letterSpacing}`

        if (
            textMeasurementsRef.current &&
            textMeasurementsRef.current.key === cacheKey
        ) {
            return textMeasurementsRef.current.measurements
        }

        const measurer = getTextMeasurer()
        if (!measurer)
            return (
                textMeasurementsRef.current?.measurements || {
                    width: 320,
                    height: 80,
                    baseline: 60,
                    padding: 50,
                    textWidth: 270,
                    textHeight: 48,
                }
            )

        measurer.style.fontSize = `${resolvedFont.fontSize}px`
        measurer.style.fontFamily = resolvedFont.fontFamily
        measurer.style.fontWeight = String(resolvedFont.fontWeight)
        measurer.style.lineHeight = String(resolvedFont.lineHeight)
        measurer.style.letterSpacing = `${resolvedFont.letterSpacing}px`
        measurer.textContent = text

        const rect = measurer.getBoundingClientRect()

        const padding = Math.max(distance, 50) + outlineWidth * 2

        const measurements = {
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
            baseline: rect.height * 0.75 + padding,
            padding: padding,
            textWidth: rect.width,
            textHeight: rect.height,
        }

        textMeasurementsRef.current = { key: cacheKey, measurements }

        return measurements
    }, [text, resolvedFont, distance, outlineWidth])

    const justifyContent =
        resolvedFont.textAlign === "left"
            ? "flex-start"
            : resolvedFont.textAlign === "right"
              ? "flex-end"
              : "center"

    return (
        <div
            style={{
                display: "flex",
                justifyContent,
                alignItems: "center",
                maxWidth: "100%",
                overflow: "visible",
                minHeight: "1em",
            }}
        >
            <div
                ref={containerRef}
                role="img"
                aria-label={text}
                aria-live={
                    effectiveAnimation !== "static" ? "polite" : undefined
                }
                aria-atomic="true"
                tabIndex={effectiveAnimation === "mouse" ? 0 : undefined}
                style={{
                    position: "relative",
                    display: "inline-block",
                    width: "fit-content",
                    overflow: "visible",
                    outline: "none",
                }}
                onFocus={(e) => {
                    if (effectiveAnimation === "mouse") {
                        e.currentTarget.style.outline = "2px solid currentColor"
                        e.currentTarget.style.outlineOffset = "4px"
                    }
                }}
                onBlur={(e) => {
                    if (effectiveAnimation === "mouse") {
                        e.currentTarget.style.outline = "none"
                    }
                }}
            >
                {layers.map((layer, index) => {
                    const shouldStroke =
                        renderMode === "outline" ||
                        (renderMode === "both" && !layer.isTop)
                    const strokeActive = shouldStroke && outlineWidth > 0
                    const useWebkitStroke =
                        webkitStrokeSupported && strokeActive

                    const layerProgress =
                        layers.length <= 1
                            ? 0
                            : index / Math.max(1, layers.length - 1)
                    const staggerIntensity =
                        effectiveAnimation === "scroll" && !prefersReducedMotion
                            ? 0.08
                            : 0
                    const staggerFactor = 1 - layerProgress * staggerIntensity

                    const staggeredX = layer.x * staggerFactor
                    const staggeredY = layer.y * staggerFactor
                    const transformString = `translate3d(${staggeredX.toFixed(2)}px, ${staggeredY.toFixed(2)}px, 0)`

                    const strokeStyle = useWebkitStroke
                        ? {
                              WebkitTextStroke: `${outlineWidth}px ${layer.color}`,
                              WebkitTextFillColor: "transparent",
                          }
                        : {}

                    return (
                        <span
                            key={`${index}-${layer.zIndex}`}
                            aria-hidden={!layer.isTop}
                            style={{
                                ...resolvedFont,
                                margin: 0,
                                whiteSpace: "nowrap",
                                position: layer.isTop ? "relative" : "absolute",
                                left: 0,
                                top: 0,
                                transform: transformString,
                                color:
                                    strokeActive && !useWebkitStroke
                                        ? "transparent"
                                        : strokeActive
                                          ? undefined
                                          : layer.color,
                                willChange:
                                    hasVisibleEffect &&
                                    effectiveAnimation !== "static" &&
                                    !layer.isTop
                                        ? "transform"
                                        : "auto",
                                pointerEvents: layer.isTop ? "auto" : "none",
                                userSelect: layer.isTop ? "text" : "none",
                                ...strokeStyle,
                            }}
                        >
                            {text}
                        </span>
                    )
                })}
            </div>
        </div>
    )
}

/* ==== DEFAULTS ==== */

BlendText.displayName = "Blend Text"
BlendText.framerDisableUnlink = true

/* ==== CONTROLS ==== */

addPropertyControls(BlendText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "BLEND",
    },

    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        displayFontSize: true,
        displayTextAlignment: true,
        defaultValue: {
            fontSize: 64,
            fontFamily: "Inter, sans-serif", // Match the format Framer expects
            fontWeight: 900,
            lineHeight: 1.2,
            letterSpacing: 0,
            textAlign: "center",
        },
    },

    steps: {
        type: ControlType.Number,
        title: "Steps",
        min: 1,
        max: 25,
        defaultValue: 10,
        displayStepper: true,
        description: "Higher values may impact performance",
    },

    distance: {
        type: ControlType.Number,
        title: "Distance",
        min: 0,
        max: 500,
        unit: "px",
        defaultValue: 28,
    },

    direction: {
        type: ControlType.Number,
        title: "Direction",
        min: 0,
        max: 360,
        unit: "°",
        defaultValue: 45, // Changed from 0 to 45
        hidden: (props) => props.animation === "mouse",
    },

    faceColor: {
        type: ControlType.Color,
        title: "Face Color",
        defaultValue: "#ffffff",
    },

    color1: {
        type: ControlType.Color,
        title: "Color 1",
        defaultValue: "#888888",
    },

    color2: {
        type: ControlType.Color,
        title: "Color 2",
        defaultValue: "#000000",
    },

    reverse: {
        type: ControlType.Boolean,
        title: "Reverse",
        defaultValue: false,
    },

    animation: {
        type: ControlType.Enum,
        title: "Interaction",
        options: ["static", "scroll", "mouse"],
        optionTitles: ["Static", "Scroll", "Follow Mouse"],
        defaultValue: "static",
    },

    scrollMode: {
        type: ControlType.Enum,
        title: "Scroll Mode",
        options: ["collapse", "expand"],
        optionTitles: ["Collapse", "Expand"],
        defaultValue: "collapse",
        displaySegmentedControl: true,
        hidden: (props) => props.animation !== "scroll",
    },

    cursorReverse: {
        type: ControlType.Boolean,
        title: "Reverse Cursor Direction",
        defaultValue: false,
        hidden: (props) => props.animation !== "mouse",
    },

    mouseMode: {
        type: ControlType.Enum,
        title: "On Hover",
        options: ["Text Only", "Viewport"],
        optionTitles: ["Text Only", "Viewport"],
        defaultValue: "Viewport",
        displaySegmentedControl: true,
        hidden: (props) => props.animation !== "mouse",
    },

    renderMode: {
        type: ControlType.Enum,
        title: "Style",
        options: ["solid", "outline", "both"],
        optionTitles: ["Fill", "Outline", "Mixed"],
        defaultValue: "solid",
    },

    outlineWidth: {
        type: ControlType.Number,
        title: "Outline Width",
        min: 0.5,
        max: 5,
        step: 0.5,
        unit: "px",
        defaultValue: 1,
        hidden: (props) => props.renderMode === "solid",
        description: "[Built by Amr Rashed](https://amrrashed.com)",
    },
})

/**
 * Component: Blend Text — built by Amr Rashed (https://amrrashed.com)
 * Version: 2.0 • © 2025 • License: Commercial use allowed with attribution
 *
 * Features:
 * • Three animation modes: Static, Scroll, Mouse-follow
 * • Automatic performance adaptation
 * • All optimizations included
 */
