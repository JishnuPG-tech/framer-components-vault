// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React, {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react"

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface ItemData {
    label?: string
    description?: string
    icon?: string
    customIcon?: { src?: string; srcSet?: string; alt?: string }
}

interface FontStyle {
    [key: string]: string | number
}

interface Props {
    coreStyle?: "vector" | "duo" | "minimal" | "pixel"
    preset?: "midnight" | "aurora" | "light" | "custom"
    backgroundColor?: string
    surfaceColor?: string
    primaryColor?: string
    secondaryColor?: string
    textColor?: string
    items?: ItemData[]
    ringRadius?: number
    nodeSize?: number
    coreSize?: number
    showRing?: boolean
    showLabel?: boolean
    showDescription?: boolean
    labelFont?: FontStyle
    descriptionFont?: FontStyle
    autoPlay?: boolean
    stayDuration?: number
    transitionDuration?: number
    easing?: "smooth" | "snappy" | "linear" | "gentle"
    direction?: "cw" | "ccw"
    startIndex?: number
    isPaused?: boolean
    pauseOnHover?: boolean
    enableGlow?: boolean
    glowIntensity?: number
    eyeDepth?: number
    mouseReactivity?: number
    onNodeClick?: (index?: number) => void
    style?: React.CSSProperties
}

/* ------------------------------------------------------------------ */
/* Constants and helpers                                               */
/* ------------------------------------------------------------------ */

const BASE = 600
const CENTER = BASE / 2

/* wide almond, pointed corners, matching the vector reference */
const EYE_PATH = "M 168 300 Q 300 165 432 300 Q 300 435 168 300 Z"

/* pixel art grid */
const PIXEL = 12
const PIXEL_COLS = 8 /* half width in cells */
const PIXEL_ROWS = 5 /* half height in cells */

/* duo eye geometry */
const DUO_GAP = 68
const DUO_EYE_R = 64
const DUO_PUPIL_R = 26

const PRESETS: Record<string, Record<string, string>> = {
    midnight: {
        backgroundColor: "#050508",
        surfaceColor: "#0D0D15",
        primaryColor: "#707BCA",
        secondaryColor: "#65BBE9",
        textColor: "#FEFEFE",
    },
    aurora: {
        backgroundColor: "#04100E",
        surfaceColor: "#0A1A18",
        primaryColor: "#3FD9A4",
        secondaryColor: "#8CE99A",
        textColor: "#F2FFFA",
    },
    light: {
        backgroundColor: "#F2F3F8",
        surfaceColor: "#FFFFFF",
        primaryColor: "#5B63D3",
        secondaryColor: "#2E9BDA",
        textColor: "#0A0A12",
    },
}

/* how much sculpted shading each core style wants */
const STYLE_DEPTH: Record<string, number> = {
    vector: 0,
    duo: 1,
    minimal: 0,
    pixel: 0,
}

/* how far the pupil drifts toward the active node, per style */
const STYLE_TRAVEL: Record<string, number> = {
    vector: 15,
    duo: 16,
    minimal: 10,
    pixel: 12,
}

/* node + icon treatment per core style, matched to the references */
const NODE_STYLE: Record<
    string,
    {
        strokeWidth: number
        cap: "round" | "square" | "butt"
        join: "round" | "miter"
        dash?: string
        ringDash?: string
        radius: number /* 0.5 = circle */
        iconScale: number
        ringWidth: number
        restStroke: number
        restIcon: number
        hoverIcon: number
        /* pixel sits on a light canvas, so its outlines follow the text
           colour instead of the accent */
        strokeSource: "primary" | "text"
        surfaceTint: number
    }
> = {
    vector: {
        strokeWidth: 2.4,
        cap: "round",
        join: "round",
        radius: 0.26,
        iconScale: 0.48,
        ringWidth: 2,
        restStroke: 0.62,
        restIcon: 0.92,
        hoverIcon: 1,
        strokeSource: "primary",
        surfaceTint: 0.35,
    },
    duo: {
        strokeWidth: 2.2,
        cap: "round",
        join: "round",
        radius: 0.28,
        iconScale: 0.5,
        ringWidth: 1.6,
        restStroke: 0.42,
        restIcon: 0.88,
        hoverIcon: 1,
        strokeSource: "primary",
        surfaceTint: 0.3,
    },
    minimal: {
        strokeWidth: 1.4,
        cap: "round",
        join: "round",
        radius: 0.5,
        iconScale: 0.42,
        ringWidth: 1,
        restStroke: 0.3,
        restIcon: 0.55,
        hoverIcon: 0.85,
        strokeSource: "primary",
        surfaceTint: 0,
    },
    pixel: {
        strokeWidth: 2.4,
        cap: "butt",
        join: "miter",
        radius: 0,
        iconScale: 0.46,
        ringWidth: 2.6,
        restStroke: 0.92,
        restIcon: 0.92,
        hoverIcon: 1,
        strokeSource: "text",
        surfaceTint: 0,
    },
}

const EASINGS: Record<string, (x: number) => number> = {
    smooth: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    snappy: (x) => 1 - Math.pow(1 - x, 4),
    linear: (x) => x,
    gentle: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
}

const ICON_NAMES = [
    "spark",
    "people",
    "refresh",
    "globe",
    "award",
    "target",
    "shield",
    "bolt",
    "heart",
    "compass",
]

const ICON_PATHS: Record<string, React.ReactNode> = {
    spark: (
        <>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </>
    ),
    people: (
        <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
    ),
    refresh: (
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-1.19" />
    ),
    globe: (
        <>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
        </>
    ),
    award: (
        <>
            <circle cx="12" cy="8" r="7" />
            <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
        </>
    ),
    target: (
        <>
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </>
    ),
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    bolt: <path d="M13 2L4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5z" />,
    heart: (
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21.2l7.7-7.8 1.1-1a5.5 5.5 0 0 0 0-7.8z" />
    ),
    compass: (
        <>
            <circle cx="12" cy="12" r="10" />
            <path d="M16.2 7.8l-2.3 6.4-6.4 2.3 2.3-6.4 6.4-2.3z" />
        </>
    ),
}

/* idle "alive" motion, fixed and subtle by design, not designer-facing */
const BREATH_SPEED = (Math.PI * 2) / 4.4 /* one full breath cycle ~4.4s */
const BREATH_AMPLITUDE = 0.018
const BLINK_DURATION = 0.16
const BLINK_MIN_GAP = 3.2
const BLINK_RANDOM_GAP = 4

/* mouse reactivity */
const REPEL_RADIUS = 150
const REPEL_MAX = 10
const FOLLOW_RADIUS = 420
const FOLLOW_MAX = 6
const MOUSE_SMOOTHING = 9 /* higher = snappier */

function parseRGB(color?: string): [number, number, number] {
    const fallback: [number, number, number] = [255, 255, 255]
    if (!color) return fallback
    const c = String(color).trim()
    if (c.charAt(0) === "#") {
        let hex = c.slice(1)
        if (hex.length === 3 || hex.length === 4) {
            hex = hex
                .split("")
                .map((h) => h + h)
                .join("")
        }
        const r = parseInt(hex.slice(0, 2), 16)
        const g = parseInt(hex.slice(2, 4), 16)
        const b = parseInt(hex.slice(4, 6), 16)
        if (isNaN(r) || isNaN(g) || isNaN(b)) return fallback
        return [r, g, b]
    }
    const match = c.match(/rgba?\(([^)]+)\)/)
    if (match) {
        const p = match[1]
            .split(/[,\s/]+/)
            .filter(Boolean)
            .map(Number)
        return [p[0] || 0, p[1] || 0, p[2] || 0]
    }
    return fallback
}

function mixColor(a: string, b: string, amount: number): string {
    const [r1, g1, b1] = parseRGB(a)
    const [r2, g2, b2] = parseRGB(b)
    const t = Math.min(Math.max(amount, 0), 1)
    return `rgb(${Math.round(r1 + (r2 - r1) * t)}, ${Math.round(
        g1 + (g2 - g1) * t
    )}, ${Math.round(b1 + (b2 - b1) * t)})`
}

function luminance(color?: string): number {
    const [r, g, b] = parseRGB(color)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

function toRGBA(color: string | undefined, alpha: number): string {
    if (!color) return `rgba(0, 0, 0, ${alpha})`
    const c = String(color).trim()
    if (c.charAt(0) === "#") {
        let hex = c.slice(1)
        if (hex.length === 3 || hex.length === 4) {
            hex = hex
                .split("")
                .map((h) => h + h)
                .join("")
        }
        const r = parseInt(hex.slice(0, 2), 16)
        const g = parseInt(hex.slice(2, 4), 16)
        const b = parseInt(hex.slice(4, 6), 16)
        const a = hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
        if (isNaN(r) || isNaN(g) || isNaN(b)) return c
        return `rgba(${r}, ${g}, ${b}, ${a * alpha})`
    }
    const match = c.match(/rgba?\(([^)]+)\)/)
    if (match) {
        const parts = match[1]
            .split(/[,\s/]+/)
            .filter(Boolean)
            .map(Number)
        const a = parts.length > 3 ? parts[3] : 1
        return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${a * alpha})`
    }
    return c
}

function polar(angleDeg: number, radius: number) {
    const rad = (angleDeg * Math.PI) / 180
    return {
        x: CENTER + Math.cos(rad) * radius,
        y: CENTER + Math.sin(rad) * radius,
    }
}

const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/**
 * Eyetrack, an orbiting item ring with four core eye styles.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 600
 */
export default function Eyetrack(props: Props) {
    const {
        coreStyle = "vector",
        preset = "midnight",
        items = [],
        ringRadius = 240,
        nodeSize = 52,
        coreSize = 1,
        showRing = true,
        showLabel = true,
        showDescription = false,
        labelFont,
        descriptionFont,
        autoPlay = true,
        stayDuration = 1.1,
        transitionDuration = 0.45,
        easing = "snappy",
        direction = "cw",
        startIndex = 0,
        isPaused = false,
        pauseOnHover = true,
        enableGlow = true,
        glowIntensity = 1,
        eyeDepth = 1,
        mouseReactivity = 1,
        onNodeClick,
        style,
    } = props

    /* ---------------- resolved theme ---------------- */

    const theme =
        preset === "custom" ? null : PRESETS[preset] || PRESETS.midnight
    const backgroundColor = theme
        ? theme.backgroundColor
        : props.backgroundColor || "#050508"
    const surfaceColor = theme
        ? theme.surfaceColor
        : props.surfaceColor || "#0D0D15"
    const primaryColor = theme
        ? theme.primaryColor
        : props.primaryColor || "#707BCA"
    const secondaryColor = theme
        ? theme.secondaryColor
        : props.secondaryColor || "#65BBE9"
    const textColor = theme ? theme.textColor : props.textColor || "#FEFEFE"

    /* ---------------- unique ids (multi-instance safe) ---------------- */

    const rawId = useId()
    const uid = useMemo(() => rawId.replace(/[^a-zA-Z0-9]/g, ""), [rawId])
    const id = useCallback((name: string) => `${name}-${uid}`, [uid])
    const url = useCallback((name: string) => `url(#${name}-${uid})`, [uid])

    /* ---------------- data ---------------- */

    const list: ItemData[] = items.length > 0 ? items : [{ label: "Value" }]
    const count = list.length
    const angleAt = useCallback(
        (index: number) => -90 + index * (360 / Math.max(count, 1)),
        [count]
    )
    const safeStart = Math.min(Math.max(startIndex, 0), count - 1)

    /* ---------------- render environment ---------------- */

    /* Framer canvas, export and thumbnail all report as static. Every
       animation and continuous effect below is gated on this. */
    const isStatic = useIsStaticRenderer()

    const [reducedMotion, setReducedMotion] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReducedMotion(mq.matches)
        update()
        mq.addEventListener?.("change", update)
        return () => mq.removeEventListener?.("change", update)
    }, [])

    const motionAllowed = !isStatic && !reducedMotion

    /* ---------------- responsive scaling ---------------- */

    const containerRef = useRef<HTMLDivElement>(null)
    const eyeBoxRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(1)

    useIsomorphicLayoutEffect(() => {
        const node = containerRef.current
        if (!node || typeof window === "undefined" || !window.ResizeObserver)
            return
        const observer = new window.ResizeObserver((entries) => {
            const box = entries[0]?.contentRect
            if (!box || box.width === 0 || box.height === 0) return
            setScale(Math.min(box.width, box.height) / BASE)
        })
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    /* ---------------- animation state ---------------- */

    const [activeIndex, setActiveIndex] = useState(safeStart)
    const [hoverIndex, setHoverIndex] = useState(-1)

    const arcRef = useRef<SVGGElement>(null)
    const pupilRef = useRef<SVGGElement>(null)
    const coreGroupRef = useRef<SVGGElement>(null)

    const phaseRef = useRef<"resting" | "transitioning">("resting")
    const timerRef = useRef(0)
    const activeRef = useRef(safeStart)
    const targetRef = useRef(safeStart)
    const startAngleRef = useRef(angleAt(safeStart))
    const endAngleRef = useRef(angleAt(safeStart))
    const currentAngleRef = useRef(angleAt(safeStart))
    const uiIndexRef = useRef(safeStart)

    /* mouse-reactive pupil offset, smoothed toward its target every frame
       and layered on top of the orbit-driven offset */
    const mouseOffsetRef = useRef({ x: 0, y: 0 })
    const mouseTargetRef = useRef({ x: 0, y: 0 })

    /* idle life: breathing + blinking timers */
    const breathTimerRef = useRef(0)
    const blinkTimerRef = useRef(0)
    const nextBlinkRef = useRef(
        BLINK_MIN_GAP + Math.random() * BLINK_RANDOM_GAP
    )

    const travelDistance = STYLE_TRAVEL[coreStyle] ?? 14
    const travelDistanceRef = useRef(travelDistance)
    const isPixel = coreStyle === "pixel"
    const snapRef = useRef(isPixel)
    const autoPlayRef = useRef(autoPlay)
    const isPausedRef = useRef(isPaused)
    const pauseOnHoverRef = useRef(pauseOnHover)
    /* pause is driven purely by which node is hovered, never by the
       cursor merely entering the component */
    const hoverIndexRef = useRef(-1)
    const stayRef = useRef(stayDuration)
    const transitRef = useRef(transitionDuration)
    const easingRef = useRef(easing)
    const directionRef = useRef(direction)
    const countRef = useRef(count)
    const reactivityRef = useRef(mouseReactivity)

    useEffect(() => {
        travelDistanceRef.current = travelDistance
    }, [travelDistance])
    useEffect(() => {
        snapRef.current = isPixel
    }, [isPixel])
    useEffect(() => {
        autoPlayRef.current = autoPlay
    }, [autoPlay])
    useEffect(() => {
        isPausedRef.current = isPaused
    }, [isPaused])
    useEffect(() => {
        pauseOnHoverRef.current = pauseOnHover
    }, [pauseOnHover])
    useEffect(() => {
        hoverIndexRef.current = hoverIndex
    }, [hoverIndex])
    useEffect(() => {
        stayRef.current = Math.max(stayDuration, 0.05)
    }, [stayDuration])
    useEffect(() => {
        transitRef.current = Math.max(transitionDuration, 0.05)
    }, [transitionDuration])
    useEffect(() => {
        easingRef.current = easing
    }, [easing])
    useEffect(() => {
        directionRef.current = direction
    }, [direction])
    useEffect(() => {
        countRef.current = count
    }, [count])
    useEffect(() => {
        reactivityRef.current = Math.max(mouseReactivity, 0)
    }, [mouseReactivity])

    /* one write per frame, no CSS transition fighting the loop */
    const paint = useCallback((angle: number) => {
        if (arcRef.current) {
            arcRef.current.style.transform = `rotate(${angle}deg)`
        }
        if (pupilRef.current) {
            const rad = (angle * Math.PI) / 180
            const t = travelDistanceRef.current
            let tx = Math.cos(rad) * t + mouseOffsetRef.current.x
            let ty = Math.sin(rad) * t + mouseOffsetRef.current.y
            /* pixel art keeps the pupil on the grid, no subpixel drift */
            if (snapRef.current) {
                const step = PIXEL / 2
                tx = Math.round(tx / step) * step
                ty = Math.round(ty / step) * step
            }
            pupilRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0)`
        }
    }, [])

    const setUIIndex = useCallback((next: number) => {
        if (uiIndexRef.current === next) return
        uiIndexRef.current = next
        setActiveIndex(next)
    }, [])

    /* reset whenever the structure changes */
    useIsomorphicLayoutEffect(() => {
        const angle = angleAt(safeStart)
        phaseRef.current = "resting"
        timerRef.current = 0
        activeRef.current = safeStart
        targetRef.current = safeStart
        startAngleRef.current = angle
        endAngleRef.current = angle
        currentAngleRef.current = angle
        setUIIndex(safeStart)
        paint(angle)
    }, [count, safeStart, angleAt, paint, setUIIndex, travelDistance, isPixel])

    /* the loop, mounted once */
    useEffect(() => {
        /* static render: no rAF loop at all, and everything is reset to a
           clean posed frame so exports and the canvas stay artifact free */
        if (!motionAllowed) {
            mouseOffsetRef.current = { x: 0, y: 0 }
            mouseTargetRef.current = { x: 0, y: 0 }
            paint(currentAngleRef.current)
            if (coreGroupRef.current) {
                coreGroupRef.current.style.transform = "scale(1, 1)"
            }
            return
        }

        let raf = 0
        let previous: number | null = null

        const tick = (timestamp: number) => {
            raf = requestAnimationFrame(tick)

            if (previous === null) previous = timestamp
            const dt = Math.min((timestamp - previous) / 1000, 0.05)
            previous = timestamp

            /* 1. breathing + blinking, always running */
            breathTimerRef.current += dt
            const breath =
                1 +
                Math.sin(breathTimerRef.current * BREATH_SPEED) *
                    BREATH_AMPLITUDE

            blinkTimerRef.current += dt
            let blinkY = 1
            if (blinkTimerRef.current >= nextBlinkRef.current) {
                const bt = blinkTimerRef.current - nextBlinkRef.current
                if (bt <= BLINK_DURATION) {
                    const p = bt / BLINK_DURATION
                    blinkY =
                        p < 0.5
                            ? 1 - (p / 0.5) * 0.92
                            : 0.08 + ((p - 0.5) / 0.5) * 0.92
                } else {
                    blinkTimerRef.current = 0
                    nextBlinkRef.current =
                        BLINK_MIN_GAP + Math.random() * BLINK_RANDOM_GAP
                }
            }

            if (coreGroupRef.current) {
                coreGroupRef.current.style.transform = `scale(${breath}, ${
                    breath * blinkY
                })`
            }

            /* 2. ease the pupil toward its mouse-driven target */
            const k = Math.min(dt * MOUSE_SMOOTHING, 1)
            mouseOffsetRef.current = {
                x:
                    mouseOffsetRef.current.x +
                    (mouseTargetRef.current.x - mouseOffsetRef.current.x) * k,
                y:
                    mouseOffsetRef.current.y +
                    (mouseTargetRef.current.y - mouseOffsetRef.current.y) * k,
            }

            /* 3. orbit */
            const resting = phaseRef.current === "resting"
            const paused =
                isPausedRef.current ||
                (pauseOnHoverRef.current && hoverIndexRef.current !== -1)

            if (!(resting && (paused || !autoPlayRef.current))) {
                timerRef.current += dt

                let angle = currentAngleRef.current
                const n = countRef.current
                const stepAngle = 360 / Math.max(n, 1)

                if (resting) {
                    if (n > 1 && timerRef.current >= stayRef.current) {
                        const dir = directionRef.current === "ccw" ? -1 : 1
                        phaseRef.current = "transitioning"
                        timerRef.current = 0
                        targetRef.current = (activeRef.current + dir + n) % n
                        startAngleRef.current = angle
                        endAngleRef.current = angle + stepAngle * dir
                        setUIIndex(-1)
                    }
                } else {
                    const progress = Math.min(
                        timerRef.current / transitRef.current,
                        1
                    )
                    const ease = EASINGS[easingRef.current] || EASINGS.smooth
                    angle =
                        startAngleRef.current +
                        (endAngleRef.current - startAngleRef.current) *
                            ease(progress)

                    if (progress >= 1) {
                        phaseRef.current = "resting"
                        timerRef.current = 0
                        activeRef.current = targetRef.current
                        angle = endAngleRef.current
                        setUIIndex(activeRef.current)
                    }

                    currentAngleRef.current = angle
                }
            }

            /* 4. single paint */
            paint(currentAngleRef.current)
        }

        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [motionAllowed, paint, setUIIndex])

    /* ---------------- interaction ---------------- */

    const jumpTo = useCallback(
        (index: number) => {
            onNodeClick?.(index)
            if (index === activeRef.current && phaseRef.current === "resting")
                return

            const from = currentAngleRef.current
            const to = angleAt(index)

            if (!motionAllowed) {
                phaseRef.current = "resting"
                timerRef.current = 0
                activeRef.current = index
                currentAngleRef.current = to
                setUIIndex(index)
                paint(to)
                return
            }

            const delta = ((((to - from) % 360) + 540) % 360) - 180
            phaseRef.current = "transitioning"
            timerRef.current = 0
            targetRef.current = index
            startAngleRef.current = from
            endAngleRef.current = from + delta
            setUIIndex(-1)
        },
        [angleAt, motionAllowed, onNodeClick, paint, setUIIndex]
    )

    /* ---------------- mouse reactivity ---------------- */
    /* the pupil nudges away from a cursor that gets close (repulsion) and
       gives a small, capped glance toward it otherwise (reactive follow).
       Only the target is written here, the loop smooths and paints it. */

    useEffect(() => {
        if (!motionAllowed) return
        const node = containerRef.current
        if (!node) return

        const handleMove = (event: MouseEvent) => {
            const box = eyeBoxRef.current
            if (!box) return
            const rect = box.getBoundingClientRect()
            if (!rect.width || !rect.height) return
            const s = rect.width / BASE || 1
            const localX = (event.clientX - rect.left) / s - CENTER
            const localY = (event.clientY - rect.top) / s - CENTER
            const dist = Math.hypot(localX, localY) || 1
            const amount = reactivityRef.current

            let ox: number
            let oy: number
            if (dist < REPEL_RADIUS) {
                const strength = (1 - dist / REPEL_RADIUS) * REPEL_MAX
                ox = (-localX / dist) * strength
                oy = (-localY / dist) * strength
            } else {
                const t = Math.min((dist - REPEL_RADIUS) / FOLLOW_RADIUS, 1)
                const strength = t * FOLLOW_MAX
                ox = (localX / dist) * strength
                oy = (localY / dist) * strength
            }

            mouseTargetRef.current = { x: ox * amount, y: oy * amount }
        }

        const handleLeave = () => {
            mouseTargetRef.current = { x: 0, y: 0 }
        }

        node.addEventListener("mousemove", handleMove)
        node.addEventListener("mouseleave", handleLeave)
        return () => {
            node.removeEventListener("mousemove", handleMove)
            node.removeEventListener("mouseleave", handleLeave)
        }
    }, [motionAllowed])

    /* ---------------- derived visuals ---------------- */

    const glow = enableGlow ? Math.max(glowIntensity, 0) : 0
    const depth = Math.max(eyeDepth, 0) * (STYLE_DEPTH[coreStyle] ?? 0)
    const nodeLook = NODE_STYLE[coreStyle] || NODE_STYLE.vector
    const half = nodeSize / 2
    const active = list[activeIndex] || list[0]
    const dir = direction === "ccw" ? -1 : 1
    const arcSpan = 22
    const arcStart = polar(-arcSpan * dir, ringRadius)
    const arcEnd = polar(0, ringRadius)
    const arcPath = `M ${arcStart.x} ${arcStart.y} A ${ringRadius} ${ringRadius} 0 0 ${
        dir > 0 ? 1 : 0
    } ${arcEnd.x} ${arcEnd.y}`
    const initialAngle = angleAt(safeStart)
    const initialRad = (initialAngle * Math.PI) / 180
    const initialTx = Math.cos(initialRad) * travelDistance
    const initialTy = Math.sin(initialRad) * travelDistance
    const snapStep = PIXEL / 2
    const pupilTransform = isPixel
        ? `translate3d(${Math.round(initialTx / snapStep) * snapStep}px, ${
              Math.round(initialTy / snapStep) * snapStep
          }px, 0)`
        : `translate3d(${initialTx}px, ${initialTy}px, 0)`

    const pupilStyle: React.CSSProperties = {
        transformOrigin: `${CENTER}px ${CENTER}px`,
        transform: pupilTransform,
        willChange: motionAllowed ? "transform" : undefined,
    }

    /* the eyeball stays white even when the palette's text colour is dark */
    const eyeWhite = useMemo(
        () => (luminance(textColor) > 0.6 ? textColor : "#FFFFFF"),
        [textColor]
    )
    const inkColor = useMemo(
        () => mixColor(primaryColor, "#000000", 0.72),
        [primaryColor]
    )

    /* ---------------- pixel art eye ---------------- */

    /* solid shading steps, no alpha, so light palettes stay readable */
    const pixelTone = useCallback(
        (tone: number) => {
            if (tone >= 1) return eyeWhite
            if (tone > 0.6) return mixColor(eyeWhite, primaryColor, 0.16)
            return mixColor(eyeWhite, primaryColor, 0.32)
        },
        [eyeWhite, primaryColor]
    )

    /* sclera: blocky eye shape with three flat shading tones */
    const pixelSclera = useMemo(() => {
        if (!isPixel) return []
        const cells: { x: number; y: number; tone: number }[] = []
        const rx = 92
        const ry = 56
        const lightX = CENTER - 40
        const lightY = CENTER - 26
        for (let i = -PIXEL_COLS; i < PIXEL_COLS; i++) {
            for (let j = -PIXEL_ROWS; j < PIXEL_ROWS; j++) {
                const x = CENTER + i * PIXEL + PIXEL / 2
                const y = CENTER + j * PIXEL + PIXEL / 2
                const u = (x - CENTER) / rx
                const v = (y - CENTER) / ry
                if (u * u + v * v > 1) continue
                const d = Math.hypot(x - lightX, y - lightY)
                const tone = d < 74 ? 1 : d < 110 ? 0.76 : 0.52
                cells.push({ x, y, tone })
            }
        }
        return cells
    }, [isPixel])

    /* iris: concentric blocky rings, a hard square pupil and a highlight */
    const pixelIris = useMemo(() => {
        if (!isPixel) return []
        const cells: { x: number; y: number; kind: string }[] = []
        for (let i = -4; i < 4; i++) {
            for (let j = -4; j < 4; j++) {
                const x = CENTER + i * PIXEL + PIXEL / 2
                const y = CENTER + j * PIXEL + PIXEL / 2
                const r = Math.hypot(x - CENTER, y - CENTER)
                if (r > 44) continue
                let kind = "outer"
                if (r <= 17) kind = "pupil"
                else if (r <= 31) kind = "inner"
                if (
                    (i === -3 && j === -2) ||
                    (i === -2 && j === -3) ||
                    (i === -3 && j === -3)
                ) {
                    kind = "shine"
                }
                cells.push({ x, y, kind })
            }
        }
        return cells
    }, [isPixel])

    const pixelFill = useCallback(
        (kind: string) => {
            if (kind === "pupil") return inkColor
            if (kind === "shine") return eyeWhite
            if (kind === "inner") return primaryColor
            return mixColor(secondaryColor, eyeWhite, 0.28)
        },
        [primaryColor, secondaryColor, eyeWhite, inkColor]
    )

    const nodeShadow = (isActive: boolean, isHover: boolean) => {
        const layers: string[] = []
        if (isActive && glow > 0) {
            layers.push(
                `0 0 ${20 * glow}px ${toRGBA(primaryColor, 0.55)}`,
                `0 0 ${52 * glow}px ${toRGBA(secondaryColor, 0.3)}`
            )
        } else if (isHover && glow > 0) {
            layers.push(`0 0 ${14 * glow}px ${toRGBA(primaryColor, 0.3)}`)
        }
        return layers.length ? layers.join(", ") : "none"
    }

    /* ---------------- core renderers ---------------- */

    /* reference: flat white almond, black iris, gradient four-point star */
    const renderVector = () => (
        <>
            <path d={EYE_PATH} fill={eyeWhite} />
            <g clipPath={url("eyeclip")}>
                <g ref={pupilRef} style={pupilStyle}>
                    <circle
                        cx={CENTER}
                        cy={CENTER}
                        r="58"
                        fill={
                            luminance(backgroundColor) > 0.6
                                ? "#0A0A12"
                                : backgroundColor
                        }
                    />
                    <path
                        d={`M ${CENTER} ${CENTER - 34}
                            C ${CENTER + 3.5} ${CENTER - 12}, ${CENTER + 12} ${CENTER - 3.5}, ${CENTER + 34} ${CENTER}
                            C ${CENTER + 12} ${CENTER + 3.5}, ${CENTER + 3.5} ${CENTER + 12}, ${CENTER} ${CENTER + 34}
                            C ${CENTER - 3.5} ${CENTER + 12}, ${CENTER - 12} ${CENTER + 3.5}, ${CENTER - 34} ${CENTER}
                            C ${CENTER - 12} ${CENTER - 3.5}, ${CENTER - 3.5} ${CENTER - 12}, ${CENTER} ${CENTER - 34} Z`}
                        fill={url("accent")}
                        filter={glow > 0 ? url("glow") : undefined}
                    />
                </g>
            </g>
        </>
    )

    /* reference: two glowing round eyeballs, big dark pupils, one highlight */
    const renderDuo = () => (
        <>
            {[-DUO_GAP, DUO_GAP].map((offset) => (
                <circle
                    key={offset}
                    cx={CENTER + offset}
                    cy={CENTER}
                    r={DUO_EYE_R}
                    fill={depth > 0 ? url("duo") : eyeWhite}
                    filter={depth > 0 ? url("depth") : undefined}
                />
            ))}
            <g clipPath={url("duoclip")}>
                <g ref={pupilRef} style={pupilStyle}>
                    {[-DUO_GAP, DUO_GAP].map((offset) => (
                        <g key={offset}>
                            <circle
                                cx={CENTER + offset}
                                cy={CENTER - 4}
                                r={DUO_PUPIL_R}
                                fill="#08080C"
                            />
                            <circle
                                cx={CENTER + offset + 9}
                                cy={CENTER - 15}
                                r="5.5"
                                fill={eyeWhite}
                            />
                        </g>
                    ))}
                </g>
            </g>
            {glow > 0 &&
                [-DUO_GAP, DUO_GAP].map((offset) => (
                    <circle
                        key={`glow-${offset}`}
                        cx={CENTER + offset}
                        cy={CENTER}
                        r={DUO_EYE_R}
                        fill="none"
                        stroke={url("accent")}
                        strokeWidth="2.4"
                        opacity={Math.min(glow, 1)}
                        filter={url("glow")}
                    />
                ))}
        </>
    )

    /* reference: single glowing brow arc with a hollow ring beneath it */
    const renderMinimal = () => (
        <>
            <path
                d="M 195 292 Q 300 220 405 292"
                fill="none"
                stroke={url("accent")}
                strokeWidth="7"
                strokeLinecap="round"
                filter={glow > 0 ? url("glow") : undefined}
            />
            <g ref={pupilRef} style={pupilStyle}>
                <circle
                    cx={CENTER}
                    cy={CENTER + 8}
                    r="30"
                    fill="none"
                    stroke={url("accent")}
                    strokeWidth="6"
                    filter={glow > 0 ? url("glow") : undefined}
                />
            </g>
        </>
    )

    /* reference: flat cells, grid snapped pupil, hard edges only */
    const renderPixel = () => (
        <>
            {pixelSclera.map((cell, i) => (
                <rect
                    key={i}
                    x={cell.x - PIXEL / 2}
                    y={cell.y - PIXEL / 2}
                    width={PIXEL + 0.5}
                    height={PIXEL + 0.5}
                    fill={pixelTone(cell.tone)}
                    shapeRendering="crispEdges"
                />
            ))}
            <g clipPath={url("pixelclip")}>
                <g ref={pupilRef} style={pupilStyle}>
                    {pixelIris.map((cell, i) => (
                        <rect
                            key={i}
                            x={cell.x - PIXEL / 2}
                            y={cell.y - PIXEL / 2}
                            width={PIXEL + 0.5}
                            height={PIXEL + 0.5}
                            fill={pixelFill(cell.kind)}
                            shapeRendering="crispEdges"
                        />
                    ))}
                </g>
            </g>
        </>
    )

    const renderCore = () => {
        switch (coreStyle) {
            case "duo":
                return renderDuo()
            case "minimal":
                return renderMinimal()
            case "pixel":
                return renderPixel()
            default:
                return renderVector()
        }
    }

    const outlineBase =
        nodeLook.strokeSource === "text" ? textColor : primaryColor

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                backgroundColor,
                color: textColor,
                overflow: "hidden",
                userSelect: "none",
                ...style,
            }}
            onMouseLeave={() => setHoverIndex(-1)}
        >
            <div
                ref={eyeBoxRef}
                style={{
                    position: "relative",
                    width: BASE,
                    height: BASE,
                    flexShrink: 0,
                    transform: `scale(${scale})`,
                    transformOrigin: "center center",
                }}
            >
                <svg
                    viewBox={`0 0 ${BASE} ${BASE}`}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                        overflow: "visible",
                        zIndex: 1,
                    }}
                    aria-hidden="true"
                >
                    <defs>
                        <linearGradient
                            id={id("accent")}
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                        >
                            <stop offset="0%" stopColor={primaryColor} />
                            <stop offset="100%" stopColor={secondaryColor} />
                        </linearGradient>

                        <linearGradient
                            id={id("arc")}
                            x1="0%"
                            y1="100%"
                            x2="100%"
                            y2="0%"
                        >
                            <stop
                                offset="0%"
                                stopColor={primaryColor}
                                stopOpacity="0"
                            />
                            <stop
                                offset="30%"
                                stopColor={primaryColor}
                                stopOpacity="0.5"
                            />
                            <stop
                                offset="75%"
                                stopColor={secondaryColor}
                                stopOpacity="1"
                            />
                            <stop
                                offset="100%"
                                stopColor={textColor}
                                stopOpacity="1"
                            />
                        </linearGradient>

                        <radialGradient
                            id={id("plate")}
                            cx="50%"
                            cy="42%"
                            r="60%"
                        >
                            <stop
                                offset="0%"
                                stopColor={toRGBA(surfaceColor, 0.9)}
                            />
                            <stop
                                offset="70%"
                                stopColor={toRGBA(surfaceColor, 0.28)}
                            />
                            <stop
                                offset="100%"
                                stopColor={toRGBA(surfaceColor, 0)}
                            />
                        </radialGradient>

                        <radialGradient
                            id={id("duo")}
                            cx="35%"
                            cy="28%"
                            r="82%"
                        >
                            <stop offset="0%" stopColor="#FFFFFF" />
                            <stop offset="62%" stopColor={eyeWhite} />
                            <stop
                                offset="100%"
                                stopColor={mixColor(
                                    eyeWhite,
                                    primaryColor,
                                    0.3
                                )}
                            />
                        </radialGradient>

                        <filter
                            id={id("glow")}
                            x="-30%"
                            y="-30%"
                            width="160%"
                            height="160%"
                        >
                            <feGaussianBlur
                                in="SourceGraphic"
                                stdDeviation={4 * Math.max(glow, 0.001)}
                                result="blur"
                            />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>

                        <filter
                            id={id("depth")}
                            x="-25%"
                            y="-25%"
                            width="150%"
                            height="150%"
                        >
                            <feDropShadow
                                dx="0"
                                dy={5 * depth}
                                stdDeviation={9 * depth}
                                floodColor="#000000"
                                floodOpacity={0.4 * depth}
                            />
                        </filter>

                        <clipPath id={id("eyeclip")}>
                            <path d={EYE_PATH} />
                        </clipPath>

                        <clipPath id={id("duoclip")}>
                            <circle
                                cx={CENTER - DUO_GAP}
                                cy={CENTER}
                                r={DUO_EYE_R}
                            />
                            <circle
                                cx={CENTER + DUO_GAP}
                                cy={CENTER}
                                r={DUO_EYE_R}
                            />
                        </clipPath>

                        {isPixel && (
                            <clipPath id={id("pixelclip")}>
                                {pixelSclera.map((cell, i) => (
                                    <rect
                                        key={i}
                                        x={cell.x - PIXEL / 2}
                                        y={cell.y - PIXEL / 2}
                                        width={PIXEL + 0.5}
                                        height={PIXEL + 0.5}
                                    />
                                ))}
                            </clipPath>
                        )}

                        <mask id={id("ringmask")}>
                            <rect
                                x="0"
                                y="0"
                                width={BASE}
                                height={BASE}
                                fill="#FFFFFF"
                            />
                            {list.map((_, index) => {
                                const p = polar(angleAt(index), ringRadius)
                                return (
                                    <circle
                                        key={index}
                                        cx={p.x}
                                        cy={p.y}
                                        r={half + 6}
                                        fill="#000000"
                                    />
                                )
                            })}
                        </mask>
                    </defs>

                    {depth > 0 && (
                        <circle
                            cx={CENTER}
                            cy={CENTER}
                            r={ringRadius * 0.92}
                            fill={url("plate")}
                            opacity={0.45 * depth}
                        />
                    )}

                    {showRing && (
                        <circle
                            cx={CENTER}
                            cy={CENTER}
                            r={ringRadius}
                            fill="none"
                            stroke={toRGBA(outlineBase, 0.22)}
                            strokeWidth="1.5"
                            strokeDasharray="4 6"
                            mask={url("ringmask")}
                        />
                    )}

                    <g
                        transform={`translate(${CENTER} ${CENTER}) scale(${coreSize}) translate(${-CENTER} ${-CENTER})`}
                    >
                        <g
                            ref={coreGroupRef}
                            style={{
                                transformOrigin: `${CENTER}px ${CENTER}px`,
                                willChange: motionAllowed
                                    ? "transform"
                                    : undefined,
                            }}
                        >
                            {renderCore()}
                        </g>
                    </g>

                    <g
                        ref={arcRef}
                        style={{
                            transformOrigin: `${CENTER}px ${CENTER}px`,
                            transform: `rotate(${initialAngle}deg)`,
                            willChange: motionAllowed ? "transform" : undefined,
                        }}
                    >
                        {glow > 0 && (
                            <path
                                d={arcPath}
                                stroke={url("arc")}
                                strokeWidth="6"
                                fill="none"
                                strokeLinecap="round"
                                opacity={Math.min(glow, 1)}
                                filter={url("glow")}
                            />
                        )}
                        <path
                            d={arcPath}
                            stroke={url("arc")}
                            strokeWidth="2.2"
                            fill="none"
                            strokeLinecap="round"
                        />
                    </g>
                </svg>

                {showLabel && (
                    <div
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: CENTER + 88,
                            transform: "translateX(-50%)",
                            width: Math.max(ringRadius * 1.3, 200),
                            textAlign: "center",
                            pointerEvents: "none",
                            zIndex: 20,
                            transition: motionAllowed
                                ? "opacity 0.2s ease"
                                : "none",
                            opacity: activeIndex !== -1 ? 1 : 0,
                        }}
                    >
                        <div
                            style={{
                                color: textColor,
                                wordBreak: "break-word",
                                ...labelFont,
                            }}
                        >
                            {active?.label}
                        </div>
                        {showDescription && active?.description ? (
                            <div
                                style={{
                                    marginTop: 6,
                                    color: toRGBA(textColor, 0.6),
                                    wordBreak: "break-word",
                                    ...descriptionFont,
                                }}
                            >
                                {active.description}
                            </div>
                        ) : null}
                    </div>
                )}

                {list.map((item, index) => {
                    const p = polar(angleAt(index), ringRadius)
                    const isActive = index === activeIndex
                    const isHover = index === hoverIndex
                    const iconName =
                        item.icon && ICON_PATHS[item.icon]
                            ? item.icon
                            : ICON_NAMES[index % ICON_NAMES.length]
                    const isCircle = nodeLook.radius >= 0.5
                    /* pixel highlights the active node with a solid fill
                       (an 8-bit "pressed button"), every other style keeps
                       the transparent + glowing-ring look */
                    const isPixelActiveFill = isPixel && isActive
                    const strokeColor = isPixelActiveFill
                        ? "transparent"
                        : isActive
                          ? url("accent")
                          : toRGBA(
                                outlineBase,
                                isHover
                                    ? Math.min(nodeLook.restStroke + 0.25, 1)
                                    : nodeLook.restStroke
                            )
                    return (
                        <div
                            key={index}
                            role="button"
                            tabIndex={0}
                            aria-label={item.label || `Item ${index + 1}`}
                            aria-pressed={isActive}
                            onClick={() => jumpTo(index)}
                            onKeyDown={(event) => {
                                if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                ) {
                                    event.preventDefault()
                                    jumpTo(index)
                                }
                            }}
                            onMouseEnter={() => setHoverIndex(index)}
                            onMouseLeave={() =>
                                setHoverIndex((current) =>
                                    current === index ? -1 : current
                                )
                            }
                            onFocus={() => setHoverIndex(index)}
                            onBlur={() =>
                                setHoverIndex((current) =>
                                    current === index ? -1 : current
                                )
                            }
                            style={{
                                position: "absolute",
                                left: p.x - half,
                                top: p.y - half,
                                width: nodeSize,
                                height: nodeSize,
                                borderRadius: `${nodeLook.radius * 100}%`,
                                zIndex: 10,
                                cursor: "pointer",
                                outline: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: isPixelActiveFill
                                    ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                                    : nodeLook.surfaceTint > 0
                                      ? `radial-gradient(130% 130% at 32% 22%, ${toRGBA(
                                            surfaceColor,
                                            nodeLook.surfaceTint
                                        )}, ${backgroundColor})`
                                      : backgroundColor,
                                boxShadow: nodeShadow(isActive, isHover),
                                transform: `scale(${
                                    isActive ? 1.06 : isHover ? 1.04 : 1
                                })`,
                                transition: motionAllowed
                                    ? "transform 0.22s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.25s ease"
                                    : "none",
                            }}
                        >
                            <svg
                                viewBox={`0 0 ${nodeSize} ${nodeSize}`}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    pointerEvents: "none",
                                    overflow: "visible",
                                }}
                                aria-hidden="true"
                            >
                                {isCircle ? (
                                    <circle
                                        cx={half}
                                        cy={half}
                                        r={half - 1}
                                        fill="none"
                                        stroke={strokeColor}
                                        strokeWidth={
                                            isActive
                                                ? nodeLook.ringWidth + 0.4
                                                : nodeLook.ringWidth
                                        }
                                        strokeDasharray={nodeLook.ringDash}
                                        style={{
                                            transition: motionAllowed
                                                ? "stroke 0.25s ease"
                                                : "none",
                                        }}
                                    />
                                ) : (
                                    <rect
                                        x="1"
                                        y="1"
                                        width={nodeSize - 2}
                                        height={nodeSize - 2}
                                        rx={nodeSize * nodeLook.radius}
                                        fill="none"
                                        stroke={strokeColor}
                                        strokeWidth={
                                            isActive
                                                ? nodeLook.ringWidth + 0.4
                                                : nodeLook.ringWidth
                                        }
                                        strokeDasharray={nodeLook.ringDash}
                                        shapeRendering={
                                            isPixel ? "crispEdges" : undefined
                                        }
                                        style={{
                                            transition: motionAllowed
                                                ? "stroke 0.25s ease"
                                                : "none",
                                        }}
                                    />
                                )}
                            </svg>

                            {item.customIcon?.src ? (
                                <img
                                    src={item.customIcon.src}
                                    srcSet={item.customIcon.srcSet}
                                    alt=""
                                    aria-hidden="true"
                                    style={{
                                        width: nodeSize * nodeLook.iconScale,
                                        height: nodeSize * nodeLook.iconScale,
                                        objectFit: "contain",
                                        opacity: isActive
                                            ? 1
                                            : isHover
                                              ? nodeLook.hoverIcon
                                              : nodeLook.restIcon,
                                        transform: `scale(${isActive ? 1.08 : 1})`,
                                        transition: motionAllowed
                                            ? "opacity 0.25s ease, transform 0.25s ease"
                                            : "none",
                                    }}
                                />
                            ) : (
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    strokeWidth={nodeLook.strokeWidth}
                                    strokeLinecap={nodeLook.cap}
                                    strokeLinejoin={nodeLook.join}
                                    strokeDasharray={nodeLook.dash}
                                    aria-hidden="true"
                                    style={{
                                        width: nodeSize * nodeLook.iconScale,
                                        height: nodeSize * nodeLook.iconScale,
                                        stroke: isPixelActiveFill
                                            ? "#FFFFFF"
                                            : textColor,
                                        opacity: isActive
                                            ? 1
                                            : isHover
                                              ? nodeLook.hoverIcon
                                              : nodeLook.restIcon,
                                        transform: `scale(${isActive ? 1.08 : 1})`,
                                        transition: motionAllowed
                                            ? "opacity 0.25s ease, transform 0.25s ease"
                                            : "none",
                                    }}
                                >
                                    {ICON_PATHS[iconName]}
                                </svg>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

Eyetrack.defaultProps = {
    coreStyle: "vector",
    preset: "midnight",
    backgroundColor: "#050508",
    surfaceColor: "#0D0D15",
    primaryColor: "#707BCA",
    secondaryColor: "#65BBE9",
    textColor: "#FEFEFE",
    ringRadius: 240,
    nodeSize: 52,
    coreSize: 1,
    showRing: true,
    showLabel: true,
    showDescription: false,
    autoPlay: true,
    stayDuration: 1.1,
    transitionDuration: 0.45,
    easing: "snappy",
    direction: "cw",
    startIndex: 0,
    isPaused: false,
    pauseOnHover: true,
    enableGlow: true,
    glowIntensity: 1,
    eyeDepth: 1,
    mouseReactivity: 1,
    items: [
        { label: "Innovation at Core", icon: "spark" },
        { label: "Respect & Inclusiveness", icon: "people" },
        { label: "Continuous Learning", icon: "refresh" },
        { label: "Customer Centricity", icon: "globe" },
        { label: "Leadership with Ownership", icon: "award" },
        { label: "Excellence", icon: "target" },
    ],
}

/* ------------------------------------------------------------------ */
/* Property controls                                                   */
/* ------------------------------------------------------------------ */

addPropertyControls(Eyetrack, {
    coreStyle: {
        type: ControlType.Enum,
        title: "Core Style",
        options: ["vector", "duo", "minimal", "pixel"],
        optionTitles: ["Vector", "Duo", "Minimal", "Pixel Art"],
        defaultValue: "vector",
    },
    preset: {
        type: ControlType.Enum,
        title: "Palette",
        options: ["midnight", "aurora", "light", "custom"],
        optionTitles: ["Midnight", "Aurora", "Light", "Custom"],
        defaultValue: "midnight",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#050508",
        hidden: (p: Props) => p.preset !== "custom",
    },
    surfaceColor: {
        type: ControlType.Color,
        title: "Surface",
        defaultValue: "#0D0D15",
        hidden: (p: Props) => p.preset !== "custom",
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary",
        defaultValue: "#707BCA",
        hidden: (p: Props) => p.preset !== "custom",
    },
    secondaryColor: {
        type: ControlType.Color,
        title: "Secondary",
        defaultValue: "#65BBE9",
        hidden: (p: Props) => p.preset !== "custom",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FEFEFE",
        hidden: (p: Props) => p.preset !== "custom",
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Value",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                    defaultValue: "",
                },
                icon: {
                    type: ControlType.Enum,
                    title: "Icon",
                    options: ICON_NAMES,
                    optionTitles: [
                        "Spark",
                        "People",
                        "Refresh",
                        "Globe",
                        "Award",
                        "Target",
                        "Shield",
                        "Bolt",
                        "Heart",
                        "Compass",
                    ],
                    defaultValue: "spark",
                },
                customIcon: {
                    type: ControlType.ResponsiveImage,
                    title: "Custom Icon",
                    description: "Overrides the built-in icon.",
                },
            },
        },
        defaultValue: [
            { label: "Innovation at Core", icon: "spark" },
            { label: "Respect & Inclusiveness", icon: "people" },
            { label: "Continuous Learning", icon: "refresh" },
            { label: "Customer Centricity", icon: "globe" },
            { label: "Leadership with Ownership", icon: "award" },
            { label: "Excellence", icon: "target" },
        ],
    },
    ringRadius: {
        type: ControlType.Number,
        title: "Ring Radius",
        defaultValue: 240,
        min: 120,
        max: 280,
        step: 1,
        unit: "px",
    },
    nodeSize: {
        type: ControlType.Number,
        title: "Node Size",
        defaultValue: 52,
        min: 32,
        max: 88,
        step: 1,
        unit: "px",
    },
    coreSize: {
        type: ControlType.Number,
        title: "Core Size",
        defaultValue: 1,
        min: 0.5,
        max: 1.6,
        step: 0.05,
    },
    showRing: {
        type: ControlType.Boolean,
        title: "Orbit Ring",
        defaultValue: true,
    },
    showLabel: {
        type: ControlType.Boolean,
        title: "Show Label",
        defaultValue: true,
    },
    showDescription: {
        type: ControlType.Boolean,
        title: "Show Description",
        defaultValue: false,
        hidden: (p: Props) => p.showLabel === false,
    },
    labelFont: {
        // @ts-ignore
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.15em",
            lineHeight: "1.4em",
            textTransform: "uppercase",
        },
        hidden: (p: Props) => p.showLabel === false,
    },
    descriptionFont: {
        // @ts-ignore
        type: ControlType.Font,
        title: "Description Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 13, lineHeight: "1.5em" },
        hidden: (p: Props) =>
            p.showLabel === false || p.showDescription === false,
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        description: "Motion runs in preview and on the published site.",
    },
    stayDuration: {
        type: ControlType.Number,
        title: "Stay",
        defaultValue: 1.1,
        min: 0.2,
        max: 8,
        step: 0.1,
        unit: "s",
        hidden: (p: Props) => p.autoPlay === false,
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Travel",
        defaultValue: 0.45,
        min: 0.1,
        max: 3,
        step: 0.05,
        unit: "s",
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["smooth", "snappy", "gentle", "linear"],
        optionTitles: ["Smooth", "Snappy", "Gentle", "Linear"],
        defaultValue: "snappy",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["cw", "ccw"],
        optionTitles: ["Clockwise", "Counter"],
        displaySegmentedControl: true,
        defaultValue: "cw",
        hidden: (p: Props) => p.autoPlay === false,
    },
    startIndex: {
        type: ControlType.Number,
        title: "Start At",
        defaultValue: 0,
        min: 0,
        max: 11,
        step: 1,
        displayStepper: true,
        description: "Also sets the pose shown on the canvas and in exports.",
    },
    isPaused: {
        type: ControlType.Boolean,
        title: "Pause",
        defaultValue: false,
        hidden: (p: Props) => p.autoPlay === false,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on Icon",
        defaultValue: true,
        description: "Pauses only while the cursor is over an icon.",
        hidden: (p: Props) => p.autoPlay === false,
    },
    mouseReactivity: {
        type: ControlType.Number,
        title: "Eye Follow",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.05,
        description: "Repels near the cursor, glances toward it further out.",
    },
    enableGlow: {
        type: ControlType.Boolean,
        title: "Glow",
        defaultValue: true,
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Amount",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.05,
        hidden: (p: Props) => p.enableGlow === false,
    },
    eyeDepth: {
        type: ControlType.Number,
        title: "Eye Depth",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.05,
        description: "Shading and shadow on the eyeballs.",
        hidden: (p: Props) => p.coreStyle !== "duo",
    },
    onNodeClick: {
        type: ControlType.EventHandler,
        title: "On Node Click",
    },
})
