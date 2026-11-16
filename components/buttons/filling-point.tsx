// @framerDisableUnlink
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
    useReducedMotion,
    type Transition,
} from "framer-motion"
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type FocusEvent as ReactFocusEvent,
    type KeyboardEvent,
    type PointerEvent as ReactPointerEvent,
    type ReactElement,
} from "react"

interface FillStop {
    color: string
    delay: number
}

type FillStyle = "solid" | "soft"
type MotionPreset = "cinematic" | "balanced" | "snappy" | "custom"

interface MotionDefinition {
    enter: Transition
    exit: Transition
    exitDurationMs: number
}

interface KernFillingPointProps {
    label: string
    link: string
    newTab: boolean
    baseFill: string
    fills: FillStop[]
    fillStyle: FillStyle
    motionPreset: MotionPreset
    /** @deprecated Prefer fills */
    fillColors?: string[]
    /** @deprecated Prefer fills */
    fillColor?: string
    /** @deprecated Difference blend locks ink to white — control hidden */
    labelColor: string
    padding: string
    borderRadius: string
    font: CSSProperties
    /** @deprecated Legacy shared motion — preserved for existing instances */
    fillTransition?: Transition
    enterTransition?: Transition
    exitTransition?: Transition
    style?: CSSProperties
}

interface FillLayer {
    color: string
    delay: number
    /** Locked when this layer expands — retract uses the same point */
    originX: number
    originY: number
    coverSize: number
    /** Scale when seed diameter = 2× distance from pointer to nearest border */
    seedScale: number
    filled: boolean
}

const MAX_COLORS = 3
/** Wide enough for readable cascade vs cinematic enter (~22% steps) */
const MAX_DELAY_MS = 360
const DEFAULT_DELAY_STEP_MS = 170
/**
 * Final disk vs button half-diagonal (center → farthest corner).
 * >1 spills past the border; 1.55 reads large without Soft-mode bloom.
 */
const COVER_BORDER_OVERFLOW = 1.55
/** Soft layer vs Solid — slight extra so outer feather still floods */
const SOFT_COVER_FACTOR = 1.1
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]
/**
 * Ink travel — slow start so the seed is visible while growing.
 * (Do not use expo-out here: opacity would reveal an already-large disk.)
 */
const EASE_INK: [number, number, number, number] = [0.65, 0, 0.35, 1]
/** Slightly softer outer cascade layer */
const EASE_INK_OUTER: [number, number, number, number] = [0.72, 0, 0.28, 1]
/** Per-layer duration taper vs base preset (inner → outer) */
const LAYER_DURATION_FACTORS = [0.96, 1, 1.06] as const

const CINEMATIC_ENTER: Transition = {
    type: "tween",
    duration: 0.76,
    ease: EASE_INK,
}

/**
 * Leave breathes longer than enter — same ink family, more settle time.
 * (Strict duration mirror made exit feel clipped.)
 */
const CINEMATIC_EXIT: Transition = {
    type: "tween",
    duration: 0.88,
    ease: EASE_INK,
}

const BALANCED_ENTER: Transition = {
    type: "tween",
    duration: 0.36,
    ease: EASE_OUT,
}

const BALANCED_EXIT: Transition = {
    type: "tween",
    duration: 0.42,
    ease: EASE_OUT,
}

const SNAPPY_ENTER: Transition = {
    type: "tween",
    duration: 0.24,
    ease: EASE_OUT,
}

const SNAPPY_EXIT: Transition = {
    type: "tween",
    duration: 0.28,
    ease: EASE_OUT,
}

/** Longest tapered exit — lock lifetime must cover outer layer */
const CINEMATIC_EXIT_DURATION_MS = Math.ceil(880 * LAYER_DURATION_FACTORS[2])
const BALANCED_EXIT_DURATION_MS = Math.ceil(420 * LAYER_DURATION_FACTORS[2])
const SNAPPY_EXIT_DURATION_MS = Math.ceil(280 * LAYER_DURATION_FACTORS[2])

const MOTION_PRESETS: Record<
    Exclude<MotionPreset, "custom">,
    MotionDefinition
> = {
    cinematic: {
        enter: CINEMATIC_ENTER,
        exit: CINEMATIC_EXIT,
        exitDurationMs: CINEMATIC_EXIT_DURATION_MS,
    },
    balanced: {
        enter: BALANCED_ENTER,
        exit: BALANCED_EXIT,
        exitDurationMs: BALANCED_EXIT_DURATION_MS,
    },
    snappy: {
        enter: SNAPPY_ENTER,
        exit: SNAPPY_EXIT,
        exitDurationMs: SNAPPY_EXIT_DURATION_MS,
    },
}

/**
 * Enter opacity: no delay + short ease-out (seed visible while small).
 * Exit opacity: retract-first, then a longer soft dissolve (not a 28% cliff).
 */
const OPACITY_ENTER_DELAY_RATIO = 0
const OPACITY_ENTER_DURATION_RATIO = 0.28
const OPACITY_EXIT_DELAY_RATIO = 0.48
const OPACITY_EXIT_DURATION_RATIO = 0.48
/** Soft ease-in-out — dissolve without a hard cut at the end */
const EASE_OPACITY_EXIT: [number, number, number, number] = [0.4, 0, 0.2, 1]
const EXIT_LOCK_BUFFER_MS = 80
const REDUCED_FILL_DURATION = 0.2
const PRESS_FILL_IN = 0.12
/** Snappier release than press-in */
const PRESS_FILL_OUT = 0.08
const PRESS_SCALE_IDLE = 0.97
/** Softer press while paint is live — fill already carries weight */
const PRESS_SCALE_FILLED = 0.985
const LABEL_TRACK_IDLE = "-0.01em"
const LABEL_TRACK_FILLED = "-0.03em"
const FINE_POINTER_MQ = "(hover: hover) and (pointer: fine)"
/** Difference-blend ink — locked so buyers can't tank contrast */
const LABEL_INK = "#FFFFFF"

/** Soft wash — denser core, longer outer feather (no filter:blur) */
function washBackground(color: string): string {
    return `radial-gradient(circle at center, ${color} 0%, ${color} 28%, color-mix(in srgb, ${color} 65%, transparent) 48%, color-mix(in srgb, ${color} 28%, transparent) 68%, color-mix(in srgb, ${color} 8%, transparent) 82%, transparent 92%)`
}

/**
 * Solid ink — opaque core + soft perimeter feather.
 * Wider than a hairline so leave dissolve doesn't flash a hard ring.
 */
function solidBackground(color: string): string {
    return `radial-gradient(circle at center, ${color} 0%, ${color} 88%, color-mix(in srgb, ${color} 55%, transparent) 95%, transparent 100%)`
}

const DEFAULT_FILLS: FillStop[] = [
    { color: "#FFFFFF", delay: 0 },
    { color: "#6FD3FF", delay: 170 },
    { color: "#276BFF", delay: 340 },
]

function transitionDurationMs(
    transition: Transition,
    fallbackMs: number,
): number {
    const duration = transition.duration
    return typeof duration === "number" && Number.isFinite(duration)
        ? Math.max(0, duration * 1000)
        : fallbackMs
}

function layerDurationFactor(index: number): number {
    return (
        LAYER_DURATION_FACTORS[
            Math.min(index, LAYER_DURATION_FACTORS.length - 1)
        ] ?? 1
    )
}

/** Authored cascade depth — outer layers run longer / softer */
function taperTransition(base: Transition, index: number): Transition {
    if (base.type === "spring") return base
    const baseDuration =
        typeof base.duration === "number" && Number.isFinite(base.duration)
            ? base.duration
            : 0.76
    const isOuter = index >= 2
    const baseEase = base.ease ?? EASE_INK
    const ease =
        isOuter && baseEase === EASE_INK ? EASE_INK_OUTER : baseEase
    return {
        ...base,
        type: "tween",
        duration: baseDuration * layerDurationFactor(index),
        ease,
    }
}

function resolveMotion(
    preset: MotionPreset,
    enterTransition: Transition | undefined,
    exitTransition: Transition | undefined,
    legacyTransition: Transition | undefined,
): MotionDefinition {
    if (preset !== "custom") return MOTION_PRESETS[preset]

    const legacyShared = legacyTransition ?? enterTransition
    const enter = enterTransition ?? legacyShared ?? CINEMATIC_ENTER
    const exit = exitTransition ?? legacyShared ?? CINEMATIC_EXIT
    const exitMs = transitionDurationMs(exit, 760)

    return {
        enter,
        exit,
        exitDurationMs: Math.ceil(exitMs * LAYER_DURATION_FACTORS[2]),
    }
}

function clampDelay(value: unknown, fallback = 0): number {
    const n = typeof value === "number" && Number.isFinite(value) ? value : fallback
    return Math.max(0, Math.min(MAX_DELAY_MS, Math.round(n)))
}

function pointInElement(
    el: Element,
    clientX: number,
    clientY: number,
): { x: number; y: number } {
    const rect = el.getBoundingClientRect()
    return {
        x: clientX - rect.left,
        y: clientY - rect.top,
    }
}

/**
 * Pointer = circle center. Seed radius reaches the nearest button border;
 * final cover reaches past the farthest corner (overflow).
 */
function fillGeometry(
    el: Element,
    origin: { x: number; y: number },
    fillStyle: FillStyle = "solid",
): { x: number; y: number; coverSize: number; seedScale: number } {
    const rect = el.getBoundingClientRect()
    const w = Math.max(rect.width, 1)
    const h = Math.max(rect.height, 1)
    const x = Math.min(Math.max(origin.x, 0), w)
    const y = Math.min(Math.max(origin.y, 0), h)
    const toNearestBorder = Math.max(
        1,
        Math.min(x, w - x, y, h - y),
    )
    const toFarthestCorner = Math.max(
        Math.hypot(x, y),
        Math.hypot(w - x, y),
        Math.hypot(x, h - y),
        Math.hypot(w - x, h - y),
    )
    const overflow =
        fillStyle === "soft"
            ? COVER_BORDER_OVERFLOW * SOFT_COVER_FACTOR
            : COVER_BORDER_OVERFLOW
    const coverSize = toFarthestCorner * 2 * overflow
    const seedDiameter = toNearestBorder * 2
    const seedScale = Math.min(0.92, Math.max(0.08, seedDiameter / coverSize))
    return { x, y, coverSize, seedScale }
}

function resolveFills(
    fills: FillStop[] | undefined,
    fillColors: string[] | undefined,
    fillColor: string | undefined,
): FillStop[] {
    if (Array.isArray(fills) && fills.length > 0) {
        return fills.slice(0, MAX_COLORS).map((item, index) => ({
            color:
                typeof item?.color === "string" && item.color.length > 0
                    ? item.color
                    : DEFAULT_FILLS[index]?.color ?? "#FFFFFF",
            delay: clampDelay(item?.delay, index * DEFAULT_DELAY_STEP_MS),
        }))
    }

    if (Array.isArray(fillColors) && fillColors.length > 0) {
        return fillColors.slice(0, MAX_COLORS).map((color, index) => ({
            color: typeof color === "string" ? color : "#FFFFFF",
            delay: clampDelay(index * DEFAULT_DELAY_STEP_MS),
        }))
    }

    if (typeof fillColor === "string" && fillColor.length > 0) {
        return [{ color: fillColor, delay: 0 }]
    }

    return DEFAULT_FILLS.map((f) => ({ ...f }))
}

function emptyLayers(stops: FillStop[]): FillLayer[] {
    return stops.map((stop) => ({
        color: stop.color,
        delay: stop.delay,
        originX: 0,
        originY: 0,
        coverSize: 960,
        seedScale: 0.35,
        filled: false,
    }))
}

function fillsKey(stops: FillStop[]): string {
    return stops.map((s) => `${s.color}:${s.delay}`).join("|")
}

/**
 * Filling Point
 *
 * Pointer-origin cascade fill CTA.
 * Circle center = pointer; seed circumference starts at the nearest button border.
 *
 * @framerIntrinsicWidth 180
 * @framerIntrinsicHeight 48
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Kern_FillingPoint(
    props: KernFillingPointProps,
): ReactElement {
    const {
        label = "Get started",
        link = "",
        newTab = false,
        baseFill = "#060606",
        fills: fillsProp,
        fillStyle = "solid",
        motionPreset: motionPresetProp,
        fillColors,
        fillColor,
        labelColor: _labelColor = "#FFFFFF",
        padding = "14px 28px",
        borderRadius = "999px",
        font = {},
        fillTransition,
        enterTransition,
        exitTransition,
        style,
    } = props

    const fills = resolveFills(fillsProp, fillColors, fillColor)
    const motionPreset =
        motionPresetProp ??
        (fillTransition || enterTransition || exitTransition
            ? "custom"
            : "cinematic")
    const {
        enter: resolvedEnterTransition,
        exit: resolvedExitTransition,
        exitDurationMs: resolvedExitDurationMs,
    } = resolveMotion(
        motionPreset,
        enterTransition,
        exitTransition,
        fillTransition,
    )

    const isStatic = useIsStaticRenderer()
    const prefersReducedMotion = useReducedMotion()
    const key = fillsKey(fills)
    const rootRef = useRef<HTMLElement | null>(null)
    const pointerRef = useRef({ x: 0, y: 0 })
    const timersRef = useRef<number[]>([])
    const hoveringRef = useRef(false)
    /** True from pointer leave until cascade-out timers finish — blocks origin wipe */
    const exitingRef = useRef(false)
    const fillsKeyRef = useRef(key)
    const fillsRef = useRef(fills)
    fillsRef.current = fills
    /** Locked enter points survive React state resets during retract */
    const originLocksRef = useRef<
        Array<{
            x: number
            y: number
            coverSize: number
            seedScale: number
        } | null>
    >([])
    const [layers, setLayers] = useState<FillLayer[]>(() => emptyLayers(fills))
    const [pressed, setPressed] = useState(false)
    /** Desktop mouse/trackpad only — gates origin-fill hover */
    const [canHover, setCanHover] = useState(false)
    /** Touch press or keyboard focus — full-bleed opacity fill */
    const [forcedFill, setForcedFill] = useState(false)

    const accessibleName = (label || "").trim() || "Button"
    const hasLink = typeof link === "string" && link.length > 0
    const isFixedWidth = style?.width === "100%"
    const useOpacityPath =
        Boolean(prefersReducedMotion) || forcedFill || !canHover

    useEffect(() => {
        if (typeof window === "undefined") return
        const mq = window.matchMedia(FINE_POINTER_MQ)
        const sync = () => setCanHover(mq.matches)
        sync()
        mq.addEventListener("change", sync)
        return () => mq.removeEventListener("change", sync)
    }, [])

    // Only resync when fill config *content* changes — never on every parent render.
    // Resetting to origin 0,0 while exiting was collapsing retract to the top-left.
    useEffect(() => {
        if (fillsKeyRef.current === key) return
        if (hoveringRef.current || exitingRef.current) return
        fillsKeyRef.current = key
        originLocksRef.current = []
        setLayers(emptyLayers(fillsRef.current))
    }, [key])

    useEffect(() => {
        return () => {
            if (typeof window === "undefined") return
            timersRef.current.forEach((id) => window.clearTimeout(id))
            timersRef.current = []
        }
    }, [])

    const clearTimers = useCallback(() => {
        if (typeof window === "undefined") return
        timersRef.current.forEach((id) => window.clearTimeout(id))
        timersRef.current = []
    }, [])

    const resolveElement = useCallback(
        (target?: EventTarget | null) => {
            if (target instanceof Element) return target
            return rootRef.current
        },
        [],
    )

    const syncFromEvent = useCallback(
        (event: ReactPointerEvent) => {
            const el = resolveElement(event.currentTarget)
            if (!el) return
            pointerRef.current = pointInElement(
                el,
                event.clientX,
                event.clientY,
            )
        },
        [resolveElement],
    )

    const activateLayer = useCallback(
        (
            index: number,
            point: { x: number; y: number },
            coverSize: number,
            seedScale: number,
        ) => {
            originLocksRef.current[index] = {
                x: point.x,
                y: point.y,
                coverSize,
                seedScale,
            }
            setLayers((prev) => {
                const next = [...prev]
                const base = next[index]
                if (!base) return prev
                next[index] = {
                    ...base,
                    originX: point.x,
                    originY: point.y,
                    coverSize,
                    seedScale,
                    filled: true,
                }
                return next
            })
        },
        [],
    )

    const deactivateLayer = useCallback((index: number) => {
        setLayers((prev) => {
            const next = [...prev]
            const base = next[index]
            if (!base) return prev
            const lock = originLocksRef.current[index]
            // Keep locked circle-center origin — retract into the same point
            next[index] = {
                ...base,
                originX: lock?.x ?? base.originX,
                originY: lock?.y ?? base.originY,
                coverSize: lock?.coverSize ?? base.coverSize,
                seedScale: lock?.seedScale ?? base.seedScale,
                filled: false,
            }
            return next
        })
    }, [])

    const schedule = useCallback((delayMs: number, run: () => void) => {
        if (delayMs <= 0) {
            run()
            return
        }
        if (typeof window === "undefined") return
        const id = window.setTimeout(run, delayMs)
        timersRef.current.push(id)
    }, [])

    const startCascadeIn = useCallback(
        (event: ReactPointerEvent) => {
            if (isStatic || !canHover) return
            if (hoveringRef.current) {
                syncFromEvent(event)
                return
            }
            clearTimers()
            exitingRef.current = false
            hoveringRef.current = true
            syncFromEvent(event)
            const el = resolveElement(event.currentTarget)
            const start = { ...pointerRef.current }
            const geo = el
                ? fillGeometry(el, start, fillStyle)
                : {
                      x: start.x,
                      y: start.y,
                      coverSize: 800,
                      seedScale: 0.2,
                  }

            originLocksRef.current = fills.map(() => ({
                x: geo.x,
                y: geo.y,
                coverSize: geo.coverSize,
                seedScale: geo.seedScale,
            }))

            setLayers(
                fills.map((stop) => ({
                    color: stop.color,
                    delay: stop.delay,
                    originX: geo.x,
                    originY: geo.y,
                    coverSize: geo.coverSize,
                    seedScale: geo.seedScale,
                    filled: false,
                })),
            )

            fills.forEach((stop, index) => {
                schedule(stop.delay, () => {
                    if (!hoveringRef.current) return
                    const live = rootRef.current
                    const nextGeo = live
                        ? fillGeometry(live, start, fillStyle)
                        : geo
                    activateLayer(
                        index,
                        { x: nextGeo.x, y: nextGeo.y },
                        nextGeo.coverSize,
                        nextGeo.seedScale,
                    )
                })
            })
        },
        [
            activateLayer,
            canHover,
            clearTimers,
            fillStyle,
            fills,
            isStatic,
            resolveElement,
            schedule,
            syncFromEvent,
        ],
    )

    const startCascadeOut = useCallback(() => {
        if (!hoveringRef.current) return
        clearTimers()
        hoveringRef.current = false
        exitingRef.current = true

        const maxDelay = fills.reduce(
            (max, stop) => Math.max(max, stop.delay),
            0,
        )

        fills.forEach((_stop, index) => {
            const reverseDelay =
                fills[fills.length - 1 - index]?.delay ?? maxDelay
            schedule(reverseDelay, () => {
                deactivateLayer(index)
            })
        })

        schedule(
            maxDelay + resolvedExitDurationMs + EXIT_LOCK_BUFFER_MS,
            () => {
                exitingRef.current = false
            },
        )
    }, [
        clearTimers,
        deactivateLayer,
        fills,
        resolvedExitDurationMs,
        schedule,
    ])

    const onPointerEnter = useCallback(
        (event: ReactPointerEvent) => {
            if (!canHover) return
            startCascadeIn(event)
        },
        [canHover, startCascadeIn],
    )

    const onPointerLeave = useCallback(() => {
        setPressed(false)
        setForcedFill(false)
        if (canHover) startCascadeOut()
    }, [canHover, startCascadeOut])

    const onPointerMove = useCallback(
        (event: ReactPointerEvent) => {
            if (!canHover || !hoveringRef.current) return
            syncFromEvent(event)
        },
        [canHover, syncFromEvent],
    )

    const onPointerDown = useCallback(() => {
        setPressed(true)
        // Coarse / touch: press fill instead of sticky hover origin
        if (!canHover) setForcedFill(true)
    }, [canHover])

    const onPointerUp = useCallback(() => {
        setPressed(false)
        if (!canHover) setForcedFill(false)
    }, [canHover])

    const onKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key !== "Enter" && event.key !== " ") return
            if (!hasLink) event.preventDefault()
            if (event.repeat) return
            setPressed(true)
            setForcedFill(true)
        },
        [hasLink],
    )

    const onKeyUp = useCallback((event: KeyboardEvent) => {
        if (event.key !== "Enter" && event.key !== " ") return
        setPressed(false)
        setForcedFill(false)
    }, [])

    const onFocus = useCallback(
        (event: ReactFocusEvent<HTMLElement>) => {
            if (!canHover) {
                setForcedFill(true)
                return
            }
            // Fine pointer: only keyboard :focus-visible (not mouse click focus)
            if (event.currentTarget.matches(":focus-visible")) {
                setForcedFill(true)
            }
        },
        [canHover],
    )

    const onBlur = useCallback(() => {
        setPressed(false)
        setForcedFill(false)
    }, [])

    const rootStyle: CSSProperties = {
        ...style,
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        margin: 0,
        padding,
        // Clip lives on an inner layer so press scale doesn't break rounded overflow
        overflow: "visible",
        cursor: "pointer",
        userSelect: "none",
        textDecoration: "none",
        border: "none",
        appearance: "none",
        WebkitAppearance: "none",
        backgroundColor: baseFill,
        borderRadius,
        color: LABEL_INK,
        isolation: "isolate",
        width: isFixedWidth ? "100%" : (style?.width ?? "auto"),
        height: style?.height ?? "auto",
        minWidth: isFixedWidth ? undefined : "max-content",
        outline: "none",
        WebkitTapHighlightColor: "transparent",
    }

    const clipStyle: CSSProperties = {
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        borderRadius,
        pointerEvents: "none",
        zIndex: 0,
    }

    const labelStyle: CSSProperties = {
        position: "relative",
        zIndex: 2,
        pointerEvents: "none",
        whiteSpace: "nowrap",
        ...font,
        // Locked white ink — difference flips to dark over light fills and stays light on base
        color: LABEL_INK,
        mixBlendMode: "difference",
    }

    const fillActive =
        !isStatic &&
        (forcedFill || layers.some((layer) => layer.filled))
    const pressScale = pressed
        ? fillActive
            ? PRESS_SCALE_FILLED
            : PRESS_SCALE_IDLE
        : 1
    const pressTransition: Transition = {
        duration: pressed ? 0.14 : 0.18,
        ease: EASE_OUT,
    }
    const labelTrack =
        typeof font.letterSpacing === "string" && font.letterSpacing.length > 0
            ? font.letterSpacing
            : LABEL_TRACK_IDLE
    const labelMotionTransition: Transition = {
        duration: fillActive
            ? transitionDurationMs(resolvedEnterTransition, 760) / 1000
            : transitionDurationMs(resolvedExitTransition, 760) / 1000,
        ease: EASE_INK,
    }

    const sharedMotion = {
        ref: rootRef as never,
        onPointerEnter,
        onPointerLeave,
        onPointerMove,
        onPointerDown,
        onPointerUp,
        onPointerCancel: onPointerUp,
        onKeyDown,
        onKeyUp,
        onFocus,
        onBlur,
        style: rootStyle,
        className: "kern-filling-point",
        initial: false,
        animate: { scale: isStatic ? 1 : pressScale },
        transition: pressTransition,
    }

    const fillLayerNodes = (() => {
        // Canvas / export: idle CTA only — no settled hover washes
        if (isStatic) {
            return null
        }

        if (useOpacityPath) {
            return layers.map((layer, index) => {
                const opacityOn = layer.filled || forcedFill
                return (
                    <motion.div
                        key={`opacity-${layer.color}-${index}`}
                        aria-hidden
                        initial={false}
                        animate={{ opacity: opacityOn ? 1 : 0 }}
                        transition={{
                            duration: opacityOn
                                ? forcedFill
                                    ? PRESS_FILL_IN
                                    : REDUCED_FILL_DURATION
                                : PRESS_FILL_OUT,
                            ease: EASE_OUT,
                        }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius,
                            backgroundColor: layer.color,
                            pointerEvents: "none",
                            zIndex: index,
                        }}
                    />
                )
            })
        }

        return layers.map((layer, index) => {
            const lock = originLocksRef.current[index]
            const originX = lock?.x ?? layer.originX
            const originY = lock?.y ?? layer.originY
            const coverSize = lock?.coverSize ?? layer.coverSize
            const seedScale = lock?.seedScale ?? layer.seedScale
            const transformTransition = taperTransition(
                layer.filled
                    ? resolvedEnterTransition
                    : resolvedExitTransition,
                index,
            )
            const phaseSec =
                transitionDurationMs(transformTransition, 760) / 1000
            const opacityTransition: Transition = layer.filled
                ? {
                      // Seed-visible: fade in while scale is still small (slow-start ink)
                      duration: phaseSec * OPACITY_ENTER_DURATION_RATIO,
                      delay: phaseSec * OPACITY_ENTER_DELAY_RATIO,
                      ease: EASE_OUT,
                  }
                : {
                      // Retract-first, then soft dissolve (longer than enter seed fade)
                      duration: phaseSec * OPACITY_EXIT_DURATION_RATIO,
                      delay: phaseSec * OPACITY_EXIT_DELAY_RATIO,
                      ease: EASE_OPACITY_EXIT,
                  }

            return (
                <motion.div
                    key={`origin-${layer.color}-${index}`}
                    aria-hidden
                    initial={false}
                    animate={{
                        transform: `scale(${layer.filled ? 1 : seedScale})`,
                        opacity: layer.filled ? 1 : 0,
                    }}
                    transition={{
                        transform: transformTransition,
                        opacity: opacityTransition,
                    }}
                    style={{
                        position: "absolute",
                        left: originX,
                        top: originY,
                        width: coverSize,
                        height: coverSize,
                        marginLeft: -coverSize / 2,
                        marginTop: -coverSize / 2,
                        borderRadius: "50%",
                        background:
                            fillStyle === "soft"
                                ? washBackground(layer.color)
                                : solidBackground(layer.color),
                        pointerEvents: "none",
                        zIndex: index,
                        transformOrigin: "50% 50%",
                        willChange: "transform, opacity",
                    }}
                />
            )
        })
    })()

    const children = (
        <>
            <style>{`
                .kern-filling-point:focus-visible {
                    outline: 2px solid Highlight;
                    outline-offset: 3px;
                }
            `}</style>
            <div style={clipStyle} aria-hidden>
                {fillLayerNodes}
            </div>
            <motion.span
                style={labelStyle}
                initial={false}
                animate={{
                    letterSpacing: isStatic
                        ? labelTrack
                        : fillActive
                          ? LABEL_TRACK_FILLED
                          : labelTrack,
                }}
                transition={labelMotionTransition}
            >
                {accessibleName}
            </motion.span>
        </>
    )

    if (hasLink) {
        return (
            <motion.a
                {...sharedMotion}
                href={link}
                target={newTab ? "_blank" : undefined}
                rel={newTab ? "noopener noreferrer" : undefined}
            >
                {children}
            </motion.a>
        )
    }

    return (
        <motion.button {...sharedMotion} type="button">
            {children}
        </motion.button>
    )
}

addPropertyControls(Kern_FillingPoint, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Get started",
        description: "Button text shown on the CTA.",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
        defaultValue: "",
        description: "Optional URL. Empty = button without navigation.",
    },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        description: "Open the link in a new browser tab.",
        hidden: (props) => !props.link,
    },
    baseFill: {
        type: ControlType.Color,
        title: "Base",
        defaultValue: "#060606",
        description: "Idle background behind the fill layers.",
    },
    fillStyle: {
        type: ControlType.Enum,
        title: "Fill Style",
        options: ["solid", "soft"],
        optionTitles: ["Solid", "Soft"],
        displaySegmentedControl: true,
        defaultValue: "solid",
        description:
            "Solid = crisp paint disk. Soft = long feathered wash (gradient falloff, not blur).",
    },
    fills: {
        type: ControlType.Array,
        title: "Fills",
        maxCount: MAX_COLORS,
        description:
            "Pointer-origin paint layers (max 3). Seed touches nearest border; stagger 0–360ms.",
        control: {
            type: ControlType.Object,
            controls: {
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#FFFFFF",
                    description: "Fill color for this cascade layer.",
                },
                delay: {
                    type: ControlType.Number,
                    title: "Delay",
                    defaultValue: 0,
                    min: 0,
                    max: MAX_DELAY_MS,
                    step: 10,
                    unit: "ms",
                    description:
                        "Ms after hover before this layer expands (0–360).",
                },
            },
        },
        defaultValue: DEFAULT_FILLS,
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label ink",
        defaultValue: "#FFFFFF",
        description:
            "Ignored — difference blend locks ink to white so text stays readable on any fill.",
        hidden: () => true,
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "14px 28px",
        description: "Inner spacing around the label.",
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "999px",
        description:
            "Corner radius of the CTA — applies idle and while the fill paints (clips the cascade).",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        displayTextAlignment: false,
        description: "Typography for the label (family, size, weight).",
        defaultValue: {
            fontSize: "16px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    motionPreset: {
        type: ControlType.Enum,
        title: "Motion",
        options: ["cinematic", "balanced", "snappy", "custom"],
        optionTitles: ["Cinematic", "Balanced", "Snappy", "Custom"],
        defaultValue: "cinematic",
        description:
            "Cinematic = authored ink (enter 760ms, leave breathes 880ms, per-layer taper, reverse cascade). Balanced/Snappy are tighter. Custom reveals Enter/Exit.\n\nBuiltByKern\n[Explore more components](https://www.framer.com/%40builtbykern/)",
    },
    enterTransition: {
        type: ControlType.Transition,
        title: "Enter",
        defaultValue: CINEMATIC_ENTER,
        description:
            "Forward paint cascade when Motion is Custom (defaults match Cinematic enter).",
        hidden: (props) => props.motionPreset !== "custom",
    },
    exitTransition: {
        type: ControlType.Transition,
        title: "Exit",
        defaultValue: CINEMATIC_EXIT,
        description:
            "Reverse paint cascade when Motion is Custom (defaults match Cinematic leave).",
        hidden: (props) => props.motionPreset !== "custom",
    },
    fillTransition: {
        type: ControlType.Transition,
        title: "Legacy motion",
        defaultValue: CINEMATIC_ENTER,
        description: "Compatibility control for existing instances.",
        hidden: () => true,
    },
})

Kern_FillingPoint.displayName = "Filling Point"
