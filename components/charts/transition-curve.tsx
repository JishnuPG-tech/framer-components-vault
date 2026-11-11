import { useEffect, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// EasingCurve — SVG easing-curve visualizer for Framer.
// Supports spring (physics & duration/bounce), tween (cubic-bezier), and instant transitions.
// Fills its container responsively via ResizeObserver.
// Controls: transition, curve, dots, axis.

type EasingProp =
    | {
          type?: "spring" | "tween" | "instant" | false | "false" | 0 | null
          duration?: number
          bounce?: number
          stiffness?: number
          damping?: number
          mass?: number
          delay?: number
          ease?: string | number[]
      }
    | false
    | 0
    | null
    | undefined

interface EasingCurveProps {
    transition?: EasingProp
    easing?: EasingProp
    curve?: {
        color: string
        strokeWidth: number
        lineCap: "round" | "butt" | "square"
        dashed: boolean
        dashLength: number
        dashGap: number
    }
    axis?: {
        visible: boolean
        color: string
        width: number
    }
    dots?: {
        visible: boolean
        size: number
        cornerRadius: number
        fill?: string
        strokeColor?: string
        strokeWidth: number
    }
}

type ParsedEasing =
    | {
          kind: "instant"
      }
    | {
          kind: "bezier"
          x1: number
          y1: number
          x2: number
          y2: number
          duration: number
      }
    | {
          kind: "spring"
          stiffness: number
          damping: number
          mass: number
          referenceDuration: number
      }

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

function namedEaseToPoints(name: string): [number, number, number, number] {
    switch (name) {
        case "linear":
            return [0, 0, 1, 1]
        case "easeIn":
            return [0.42, 0, 1, 1]
        case "easeOut":
            return [0, 0, 0.58, 1]
        case "easeInOut":
            return [0.42, 0, 0.58, 1]
        case "circIn":
            return [0.55, 0, 1, 0.45]
        case "circOut":
            return [0, 0.55, 0.45, 1]
        case "circInOut":
            return [0.85, 0, 0.15, 1]
        case "backIn":
            return [0.36, 0, 0.66, -0.56]
        case "backOut":
            return [0.34, 1.56, 0.64, 1]
        case "backInOut":
            return [0.68, -0.6, 0.32, 1.6]
        case "anticipate":
            return [0.36, 0, 0.66, -0.56]
        default:
            return [0.42, 0, 0.58, 1]
    }
}

function tryParseJSON(value: string): unknown {
    try {
        return JSON.parse(value)
    } catch {
        return value
    }
}

function unwrapTransitionValue(input: unknown, depth = 0): unknown {
    if (depth > 5) return input
    if (typeof input === "string") {
        const trimmed = input.trim()
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
            return unwrapTransitionValue(tryParseJSON(trimmed), depth + 1)
        }
        return input
    }
    if (!input || typeof input !== "object") return input

    const record = input as Record<string, unknown>
    if ("value" in record) {
        return unwrapTransitionValue(record.value, depth + 1)
    }
    return input
}

function getTransitionType(value: unknown): unknown {
    const normalized = unwrapTransitionValue(value)
    if (!normalized || typeof normalized !== "object") return undefined
    return (normalized as Record<string, unknown>).type
}

function isInstantLikeType(typeValue: unknown): boolean {
    return (
        typeValue === false ||
        typeValue === 0 ||
        typeValue === null ||
        typeValue === undefined ||
        typeValue === "instant" ||
        typeValue === "Instant" ||
        typeValue === "false"
    )
}

function hasSpringTransition(value: unknown): boolean {
    const normalized = unwrapTransitionValue(value)
    if (!normalized || typeof normalized !== "object") return false
    const transitionObject = normalized as Record<string, unknown>
    const typeValue = transitionObject.type
    const duration = transitionObject.duration
    if (typeof duration === "number" && duration <= 0) return false
    if (isInstantLikeType(typeValue)) return false
    return typeValue === "spring"
}

function hasEaseTransition(value: unknown): boolean {
    const normalized = unwrapTransitionValue(value)
    if (!normalized || typeof normalized !== "object") return false
    const transitionObject = normalized as Record<string, unknown>
    const typeValue = transitionObject.type
    const duration = transitionObject.duration
    if (typeof duration === "number" && duration <= 0) return false
    if (isInstantLikeType(typeValue)) return false
    if (typeValue === "tween" || typeValue === "ease") return true
    const ease = transitionObject.ease
    return (
        (Array.isArray(ease) && ease.length === 4) || typeof ease === "string"
    )
}

function normalizeTransitionValue(value: unknown): Record<string, unknown> {
    const normalized = unwrapTransitionValue(value)
    if (normalized && typeof normalized === "object") {
        return normalized as Record<string, unknown>
    }
    return {}
}

function parseEasing(t: unknown): ParsedEasing {
    const transitionObject = normalizeTransitionValue(t) as {
        type?: unknown
        duration?: number
        bounce?: number
        stiffness?: number
        damping?: number
        mass?: number
        ease?: string | number[]
    }
    if (
        typeof transitionObject.duration === "number" &&
        transitionObject.duration <= 0
    ) {
        return { kind: "instant" }
    }
    const hasSpring = hasSpringTransition(t)
    const hasEase = hasEaseTransition(t)

    if (hasSpring) {
        if (
            typeof transitionObject.duration === "number" &&
            typeof transitionObject.bounce === "number"
        ) {
            const duration = Math.max(0.001, transitionObject.duration)
            const bounce = clamp(transitionObject.bounce, -1, 1)
            const dampingRatio = 1 - bounce
            let wn: number
            if (dampingRatio < 1) {
                wn =
                    Math.PI /
                    (duration *
                        Math.sqrt(
                            Math.max(0.000001, 1 - dampingRatio * dampingRatio)
                        ))
            } else {
                wn = 4 / (duration * Math.max(0.000001, dampingRatio))
            }
            return {
                kind: "spring",
                stiffness: wn * wn,
                damping: 2 * dampingRatio * wn,
                mass: 1,
                referenceDuration: duration,
            }
        }
        if (typeof transitionObject.stiffness === "number") {
            const stiffness = Math.max(0.000001, transitionObject.stiffness)
            const damping = Math.max(0, transitionObject.damping ?? 20)
            const mass = Math.max(0.000001, transitionObject.mass ?? 1)
            const wn = Math.sqrt(stiffness / mass)
            const zeta = damping / (2 * mass * wn)
            const estimatedDuration =
                zeta < 1
                    ? Math.PI /
                      (wn * Math.sqrt(Math.max(0.000001, 1 - zeta * zeta)))
                    : 4 / (wn * Math.max(0.000001, zeta))
            return {
                kind: "spring",
                stiffness,
                damping,
                mass,
                referenceDuration: Math.max(0.15, estimatedDuration),
            }
        }
        return { kind: "instant" }
    }

    if (hasEase) {
        const duration = Math.max(0.001, transitionObject.duration ?? 0.4)
        let x1 = 0.42,
            y1 = 0,
            x2 = 0.58,
            y2 = 1
        const ease = transitionObject.ease
        if (Array.isArray(ease) && ease.length === 4) {
            ;[x1, y1, x2, y2] = ease
        } else if (typeof ease === "string") {
            ;[x1, y1, x2, y2] = namedEaseToPoints(ease)
        }
        return { kind: "bezier", x1, y1, x2, y2, duration }
    }

    return { kind: "instant" }
}

function springValueAtTime(
    t: number,
    stiffness: number,
    damping: number,
    mass: number
): number {
    if (t <= 0) return 0

    const wn = Math.sqrt(stiffness / mass)
    if (!Number.isFinite(wn) || wn <= 0) return 1

    const zeta = damping / (2 * mass * wn)

    if (zeta < 1) {
        const wd = wn * Math.sqrt(Math.max(0, 1 - zeta * zeta))
        const decay = Math.exp(-zeta * wn * t)
        const sinCoeff = zeta / Math.max(0.000001, Math.sqrt(1 - zeta * zeta))
        return 1 - decay * (Math.cos(wd * t) + sinCoeff * Math.sin(wd * t))
    }

    if (Math.abs(zeta - 1) < 0.0001) {
        return 1 - Math.exp(-wn * t) * (1 + wn * t)
    }

    const root = Math.sqrt(Math.max(0.000001, zeta * zeta - 1))
    const r1 = -wn * (zeta - root)
    const r2 = -wn * (zeta + root)
    const c1 = r2 / (r1 - r2)
    const c2 = -r1 / (r1 - r2)
    return 1 + c1 * Math.exp(r1 * t) + c2 * Math.exp(r2 * t)
}

function buildSpringSamples(
    parsed: Extract<ParsedEasing, { kind: "spring" }>
): {
    times: number[]
    values: number[]
    totalTime: number
} {
    const { stiffness, damping, mass, referenceDuration } = parsed

    const dt = 1 / 240
    const maxTime = 4
    let t = 0
    let consecutive = 0
    let settleTime = 0
    const threshold = 0.001

    while (t <= maxTime) {
        const x = springValueAtTime(t, stiffness, damping, mass)
        if (Math.abs(x - 1) < threshold) {
            consecutive += 1
            if (consecutive >= 10) {
                settleTime = t
                break
            }
        } else {
            consecutive = 0
        }
        t += dt
    }

    if (settleTime === 0) settleTime = maxTime

    const totalTime = Math.min(
        maxTime,
        Math.max(referenceDuration * 2, settleTime)
    )
    const sampleCount = 120
    const times: number[] = []
    const values: number[] = []

    for (let i = 0; i < sampleCount; i += 1) {
        const ratio = i / (sampleCount - 1)
        const sampleTime = ratio * totalTime
        const value = springValueAtTime(sampleTime, stiffness, damping, mass)
        times.push(sampleTime)
        values.push(value)
    }

    return { times, values, totalTime }
}

function buildBezierSamples(
    parsed: Extract<ParsedEasing, { kind: "bezier" }>
): {
    times: number[]
    values: number[]
    totalTime: number
} {
    const { x1, y1, x2, y2, duration } = parsed
    const sampleCount = 80
    const times: number[] = []
    const values: number[] = []
    for (let i = 0; i < sampleCount; i++) {
        const t = i / (sampleCount - 1)
        const bx =
            3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t ** 2 * (1 - t) + t ** 3
        const by =
            3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t ** 2 * (1 - t) + t ** 3
        times.push(bx * duration)
        values.push(by)
    }
    return { times, values, totalTime: duration }
}

function pointsToSmoothPath(points: { x: number; y: number }[]): string {
    if (points.length < 2) return ""
    if (points.length === 2) {
        return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
    }

    const alpha = 0.5 // tension
    const d: string[] = [`M ${points[0].x} ${points[0].y}`]

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(i - 1, 0)]
        const p1 = points[i]
        const p2 = points[i + 1]
        const p3 = points[Math.min(i + 2, points.length - 1)]

        const cp1x = p1.x + ((p2.x - p0.x) * alpha) / 3
        const cp1y = p1.y + ((p2.y - p0.y) * alpha) / 3
        const cp2x = p2.x - ((p3.x - p1.x) * alpha) / 3
        const cp2y = p2.y - ((p3.y - p1.y) * alpha) / 3

        d.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`)
    }

    return d.join(" ")
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerDisableUnlink
 */
export default function EasingCurve(props: EasingCurveProps) {
    const transitionInput =
        props.transition ??
        (props as any).Transition ??
        (props as any).easing ??
        (props as any).$control__transition ??
        (props as any).$control__easing
    const transition = normalizeTransitionValue(transitionInput)
    const hasSpring = hasSpringTransition(transitionInput)
    const hasEase = hasEaseTransition(transitionInput)

    const {
        curve = {
            color: "rgba(18,18,18,1)",
            strokeWidth: 1.5,
            lineCap: "round",
            dashed: false,
            dashLength: 4,
            dashGap: 4,
        },
        axis = { visible: true, color: "rgba(18,18,18,0.18)", width: 1 },
        dots = {
            visible: true,
            size: 5,
            cornerRadius: 100,
            strokeWidth: 0,
        },
    } = props

    const parsed = useMemo(() => parseEasing(transition), [transition])
    const containerRef = useRef<HTMLDivElement>(null)
    const [dims, setDims] = useState({ width: 48, height: 48 })

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const ro = new ResizeObserver((entries) => {
            const e = entries[0]
            if (e)
                setDims({
                    width: e.contentRect.width,
                    height: e.contentRect.height,
                })
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const {
        pathData,
        axisOriginY,
        axisLeftX,
        axisTopY,
        axisRightX,
        startX,
        startY,
        endX,
        endY,
    } = useMemo(() => {
        const left = 0
        const right = dims.width
        const top = 0
        const bottom = dims.height

        const mapX = (time: number, totalTime: number): number => {
            if (totalTime <= 0) return left
            return left + (time / totalTime) * (right - left)
        }

        let minDisplay = 0
        let maxDisplay = 1
        let cachedSamples: {
            times: number[]
            values: number[]
            totalTime: number
        } | null = null

        if (parsed.kind === "spring") {
            cachedSamples = buildSpringSamples(parsed)
        } else if (parsed.kind === "bezier") {
            cachedSamples = buildBezierSamples(parsed)
        }

        if (cachedSamples) {
            let lo = 0
            let hi = 1
            for (const v of cachedSamples.values) {
                if (v < lo) lo = v
                if (v > hi) hi = v
            }
            minDisplay = lo
            maxDisplay = hi
        }
        const range = maxDisplay - minDisplay || 1
        const mapY = (value: number): number => {
            const clamped = clamp(value, minDisplay, maxDisplay)
            const normalized = (clamped - minDisplay) / range
            return bottom - normalized * (bottom - top)
        }

        const axisOriginY = mapY(0)
        const axisLeftX = left
        const axisTopY = 0
        const axisRightX = dims.width

        if (parsed.kind === "instant") {
            return {
                pathData: "",
                axisOriginY,
                axisLeftX,
                axisTopY,
                axisRightX,
                startX: left,
                startY: bottom,
                endX: right,
                endY: top,
            }
        }

        if (parsed.kind === "bezier" && cachedSamples) {
            const points = cachedSamples.times.map((t, i) => ({
                x: mapX(t, cachedSamples!.totalTime),
                y: mapY(cachedSamples!.values[i]),
            }))
            return {
                pathData: pointsToSmoothPath(points),
                axisOriginY,
                axisLeftX,
                axisTopY,
                axisRightX,
                startX: mapX(cachedSamples.times[0], cachedSamples.totalTime),
                startY: mapY(cachedSamples.values[0]),
                endX: mapX(
                    cachedSamples.times[cachedSamples.times.length - 1],
                    cachedSamples.totalTime
                ),
                endY: mapY(
                    cachedSamples.values[cachedSamples.values.length - 1]
                ),
            }
        }

        if (parsed.kind === "spring" && cachedSamples) {
            const points = cachedSamples.times.map((t, i) => ({
                x: mapX(t, cachedSamples!.totalTime),
                y: mapY(cachedSamples!.values[i]),
            }))

            return {
                pathData: pointsToSmoothPath(points),
                axisOriginY,
                axisLeftX,
                axisTopY,
                axisRightX,
                startX: mapX(cachedSamples.times[0], cachedSamples.totalTime),
                startY: mapY(cachedSamples.values[0]),
                endX: mapX(
                    cachedSamples.times[cachedSamples.times.length - 1],
                    cachedSamples.totalTime
                ),
                endY: mapY(
                    cachedSamples.values[cachedSamples.values.length - 1]
                ),
            }
        }

        return {
            pathData: "",
            axisOriginY: dims.height,
            axisLeftX: 0,
            axisTopY: 0,
            axisRightX: dims.width,
            startX: 0,
            startY: dims.height,
            endX: dims.width,
            endY: 0,
        }
    }, [dims.height, dims.width, parsed])

    const showCurve =
        (hasSpring || hasEase) && parsed.kind !== "instant" && Boolean(pathData)

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                display: "flex",
                width: "100%",
                height: "100%",
                background: "transparent",
                overflow: "visible",
            }}
        >
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${dims.width} ${dims.height}`}
                overflow="visible"
                role="img"
                aria-label="Easing curve preview"
            >
                {axis.visible && (
                    <>
                        <line
                            x1={axisLeftX}
                            y1={axisOriginY}
                            x2={axisRightX}
                            y2={axisOriginY}
                            stroke={axis.color}
                            strokeWidth={axis.width}
                        />
                        <line
                            x1={axisLeftX}
                            y1={axisTopY}
                            x2={axisLeftX}
                            y2={axisOriginY}
                            stroke={axis.color}
                            strokeWidth={axis.width}
                        />
                    </>
                )}
                {showCurve && (
                    <path
                        d={pathData}
                        fill="none"
                        stroke={curve.color}
                        strokeWidth={curve.strokeWidth}
                        strokeLinecap={curve.lineCap}
                        strokeLinejoin="round"
                        strokeDasharray={
                            curve.dashed
                                ? `${curve.dashLength} ${curve.dashGap}`
                                : undefined
                        }
                    />
                )}
                {showCurve &&
                    dots.visible &&
                    dots.size > 0 &&
                    [
                        { cx: startX, cy: startY },
                        { cx: endX, cy: endY },
                    ].map(({ cx, cy }, i) => (
                        <rect
                            key={i}
                            x={cx - dots.size / 2}
                            y={cy - dots.size / 2}
                            width={dots.size}
                            height={dots.size}
                            rx={(dots.size / 2) * (dots.cornerRadius / 100)}
                            ry={(dots.size / 2) * (dots.cornerRadius / 100)}
                            fill={dots.fill || curve.color}
                            stroke={dots.strokeColor}
                            strokeWidth={dots.strokeWidth}
                        />
                    ))}
            </svg>
        </div>
    )
}

EasingCurve.displayName = "Transition Curve"

addPropertyControls(EasingCurve, {
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: { type: "spring", duration: 0.4, bounce: 0.2 },
    },
    curve: {
        type: ControlType.Object,
        title: "Curve",
        controls: {
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "rgb(0, 0, 0)",
            },
            strokeWidth: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 1.5,
                min: 0.5,
                max: 8,
                step: 0.1,
                displayStepper: true,
            },
            lineCap: {
                type: ControlType.Enum,
                title: "Cap",
                options: ["butt", "round", "square"],
                optionTitles: ["Butt", "Round", "Square"],
                defaultValue: "butt",
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
            },
            dashed: {
                type: ControlType.Boolean,
                title: "Dashed",
                defaultValue: false,
            },
            dashLength: {
                type: ControlType.Number,
                title: "Dash",
                defaultValue: 4,
                min: 1,
                max: 40,
                step: 1,
                displayStepper: true,
                hidden: (props) => !props.dashed,
            },
            dashGap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 4,
                min: 1,
                max: 40,
                step: 1,
                displayStepper: true,
                hidden: (props) => !props.dashed,
            },
        },
        defaultValue: {
            color: "rgba(0,0,0,1)",
            strokeWidth: 1.5,
            lineCap: "round",
            dashed: false,
            dashLength: 4,
            dashGap: 4,
        },
    },
    dots: {
        type: ControlType.Object,
        title: "Dots",
        controls: {
            visible: {
                type: ControlType.Boolean,
                title: "Visible",
                defaultValue: true,
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 5,
                min: 0,
                max: 24,
                step: 0.5,
                displayStepper: true,
            },
            cornerRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 100,
                min: 0,
                max: 100,
                step: 1,
                displayStepper: true,
            },
            fill: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "rgb(0, 0, 0)",
                optional: true,
            },
            strokeColor: {
                type: ControlType.Color,
                title: "Stroke",
                optional: true,
            },
            strokeWidth: {
                type: ControlType.Number,
                title: "Stroke Width",
                defaultValue: 0,
                min: 0,
                max: 8,
                step: 0.5,
                displayStepper: true,
            },
        },
        defaultValue: {
            visible: true,
            size: 5,
            cornerRadius: 100,
            strokeWidth: 0,
        },
    },
    axis: {
        type: ControlType.Object,
        title: "Axis",
        description: "Made by *[arkuš.design](https://framer.link/S5pisEA)*",
        controls: {
            visible: {
                type: ControlType.Boolean,
                title: "Visible",
                defaultValue: true,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "rgb(0, 0, 0)",
            },
            width: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 1,
                min: 0.5,
                max: 4,
                step: 0.5,
                displayStepper: true,
            },
        },
        defaultValue: {
            visible: true,
            color: "rgba(0,0,0,0.15)",
            width: 1,
        },
    },
})
