import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

// @ts-ignore
import { Delaunay } from "https://esm.sh/d3-delaunay@6"
import { motion } from "framer-motion"

type Props = {
    count: number
    colorA: string
    colorB: string
    speed: number
    lineWidth: number
    lineColor: string
    fill: boolean
    roundness: number
    gap: number
    width: number
    height: number
    seed: number
    style?: React.CSSProperties
    className?: string
}

// Simple seeded random number generator (Linear Congruential Generator)
function createRandom(seed: number) {
    let current = seed
    return () => {
        current = (current * 1664525 + 1013904223) % 4294967296
        return current / 4294967296
    }
}

export default function VoronoiPattern(props: Props) {
    const {
        count,
        colorA,
        colorB,
        speed,
        lineWidth,
        lineColor,
        fill,
        roundness,
        gap,
        width,
        height,
        seed,
        style,
        className,
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)
    const [measuredSize, setMeasuredSize] = React.useState<{
        width: number
        height: number
    } | null>(null)

    React.useEffect(() => {
        if (!containerRef.current) return
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect
                setMeasuredSize({ width, height })
            }
        })
        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    const activeWidth = measuredSize?.width || width || 200
    const activeHeight = measuredSize?.height || height || 200

    // Initial points generation (Deterministic based on Seed)
    const initialPoints = React.useMemo(() => {
        const random = createRandom(seed)
        return Array.from({ length: count }, () => ({
            x: random(), // 0 to 1
            y: random(), // 0 to 1
            vx: (random() - 0.5) * 2, // -1 to 1
            vy: (random() - 0.5) * 2, // -1 to 1
        }))
    }, [count, seed])

    const [currentPoints, setCurrentPoints] = React.useState(initialPoints)

    React.useEffect(() => {
        if (speed === 0) {
            setCurrentPoints(initialPoints)
            return
        }

        let animationFrameId: number
        const loop = () => {
            const time = performance.now() / 1000 // Seconds

            // Speed calibration:
            // Previous logic: dx = speed / width (per frame).
            // If speed=1, w=200 -> dx=0.005. 60fps -> 0.3 per second.
            // Let's choose a factor that feels right.
            // A factor of 0.2 means at speed=1, it takes ~5 seconds to cross the screen.
            const timeFactor = speed * 0.2

            const nextPoints = initialPoints.map((p) => {
                let x = p.x + p.vx * time * timeFactor
                let y = p.y + p.vy * time * timeFactor

                // Ping-pong wrapping for 0-1 range
                // Formula: Triangle wave

                const wrap = (val: number) => {
                    const cycle = val % 2
                    const positiveCycle = cycle < 0 ? cycle + 2 : cycle
                    return positiveCycle > 1 ? 2 - positiveCycle : positiveCycle
                }

                return {
                    x: wrap(x),
                    y: wrap(y),
                    vx: 0, // Not needed for rendering
                    vy: 0, // Not needed for rendering
                }
            })

            setCurrentPoints(nextPoints)
            animationFrameId = requestAnimationFrame(loop)
        }
        loop()
        return () => cancelAnimationFrame(animationFrameId)
    }, [speed, initialPoints])

    const paths = React.useMemo(() => {
        if (
            activeWidth <= 1 ||
            activeHeight <= 1 ||
            !Number.isFinite(activeWidth) ||
            !Number.isFinite(activeHeight)
        )
            return []

        // Map normalized points to pixel space for Delaunay
        const pixelPoints: number[] = []
        currentPoints.forEach((p) => {
            pixelPoints.push(p.x * activeWidth, p.y * activeHeight)
        })

        if (
            pixelPoints.length < 4 ||
            pixelPoints.some((v) => !Number.isFinite(v))
        )
            return []

        try {
            const delaunay = new Delaunay(pixelPoints)
            const bounds = [0, 0, activeWidth, activeHeight]
            const voronoi = delaunay.voronoi(bounds)

            const resultPaths: string[] = []
            for (let i = 0; i < currentPoints.length; i++) {
                const polygon = voronoi.cellPolygon(i)
                if (polygon) {
                    const poly = gap > 0 ? insetPolygon(polygon, gap) : polygon
                    resultPaths.push(getRoundedPolygonPath(poly, roundness))
                }
            }
            return resultPaths
        } catch (e) {
            return []
        }
    }, [currentPoints, activeWidth, activeHeight, gap, roundness])

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: "transparent",
            }}
        >
            {activeWidth > 0 && activeHeight > 0 && (
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${activeWidth} ${activeHeight}`}
                    preserveAspectRatio="none"
                    style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                    }}
                >
                    {paths.map((d: string, i: number) => (
                        <path
                            key={i}
                            d={d}
                            fill={
                                fill ? (i % 2 === 0 ? colorA : colorB) : "none"
                            }
                            stroke={lineColor}
                            strokeWidth={lineWidth}
                        />
                    ))}
                </svg>
            )}
        </div>
    )
}

VoronoiPattern.defaultProps = {
    width: 200,
    height: 200,
    count: 20,
    colorA: "#FF0055",
    colorB: "#0099FF",
    speed: 0.1,
    lineWidth: 0,
    lineColor: "rgba(255,255,255,0.5)",
    fill: true,
    roundness: 0,
    gap: 0,
    seed: 1,
}

function insetPolygon(polygon: [number, number][], gap: number) {
    if (!polygon || polygon.length < 3) return polygon
    let cx = 0,
        cy = 0
    const len = polygon.length - 1
    for (let i = 0; i < len; i++) {
        cx += polygon[i][0]
        cy += polygon[i][1]
    }
    cx /= len
    cy /= len

    return polygon.map((p) => {
        const dx = p[0] - cx
        const dy = p[1] - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist <= gap) return [cx, cy]
        const ratio = (dist - gap) / dist
        return [cx + dx * ratio, cy + dy * ratio]
    })
}

function getRoundedPolygonPath(polygon: [number, number][], roundness: number) {
    if (!polygon || polygon.length < 3) return ""
    const points = polygon.slice(0, polygon.length - 1)
    if (roundness === 0) {
        return (
            `M ${points[0][0]},${points[0][1]} ` +
            points
                .slice(1)
                .map((p) => `L ${p[0]},${p[1]}`)
                .join(" ") +
            " Z"
        )
    }

    const factor = Math.min(Math.max(roundness, 0), 1) * 0.5
    let d = ""
    const len = points.length
    for (let i = 0; i < len; i++) {
        const curr = points[i]
        const next = points[(i + 1) % len]
        const prev = points[(i - 1 + len) % len]

        const v1 = { x: curr[0] - prev[0], y: curr[1] - prev[1] }
        const v2 = { x: next[0] - curr[0], y: next[1] - curr[1] }

        d +=
            (i === 0 ? "M " : " L ") +
            `${curr[0] - v1.x * factor},${curr[1] - v1.y * factor} ` +
            `Q ${curr[0]},${curr[1]} ${curr[0] + v2.x * factor},${curr[1] + v2.y * factor}`
    }
    return d + " Z"
}

addPropertyControls(VoronoiPattern, {
    seed: {
        type: ControlType.Number,
        min: 0,
        max: 1000,
        step: 1,
        title: "Seed",
        defaultValue: 1,
    },
    count: {
        type: ControlType.Number,
        min: 5,
        max: 100,
        title: "Cells",
        defaultValue: 20,
    },
    speed: {
        type: ControlType.Number,
        min: 0,
        max: 5,
        step: 0.1,
        title: "Speed",
        defaultValue: 0.1,
    },
    colorA: {
        type: ControlType.Color,
        title: "Color A",
        defaultValue: "#FF0055",
    },
    colorB: {
        type: ControlType.Color,
        title: "Color B",
        defaultValue: "#0099FF",
    },
    fill: { type: ControlType.Boolean, title: "Fill", defaultValue: true },
    lineWidth: {
        type: ControlType.Number,
        min: 0,
        max: 10,
        step: 0.1,
        title: "Width",
        defaultValue: 0,
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line",
        defaultValue: "rgba(255,255,255,0.5)",
    },
    roundness: {
        type: ControlType.Number,
        min: 0,
        max: 1,
        step: 0.1,
        title: "Roundness",
        defaultValue: 0,
    },
    gap: {
        type: ControlType.Number,
        min: 0,
        max: 50,
        title: "Gap",
        defaultValue: 0,
    },
})
