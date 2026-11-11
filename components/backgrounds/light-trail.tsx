import { useEffect, useRef, useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

interface LightTrailsProps {
    trailCount: number
    trailColor: string
    glowIntensity: number
    speed: number
    trailLength: number
    pattern: "circular" | "zigzag" | "wave"
    backgroundColor: string
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function LightTrails(props: LightTrailsProps) {
    const {
        trailCount = 5,
        trailColor = "#0099FF",
        glowIntensity = 20,
        speed = 3,
        trailLength = 100,
        pattern = "circular",
        backgroundColor = "transparent",
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationRef = useRef<number>(0)
    const isVisibleRef = useRef<boolean>(true)
    const isStatic = useIsStaticRenderer()
    const [dimensions, setDimensions] = useState({ width: 400, height: 400 })

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const parent = canvas.parentElement
        if (!parent) return

        const updateDimensions = () => {
            const { width, height } = parent.getBoundingClientRect()
            startTransition(() => {
                setDimensions({ width, height })
            })
        }

        updateDimensions()
        const observer = new ResizeObserver(updateDimensions)
        observer.observe(parent)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (isStatic) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d", { alpha: true })
        if (!ctx) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisibleRef.current = entry.isIntersecting
            },
            { threshold: 0.01 }
        )
        observer.observe(canvas)

        const dpr = window.devicePixelRatio || 1
        canvas.width = dimensions.width * dpr
        canvas.height = dimensions.height * dpr
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        const centerX = dimensions.width / 2
        const centerY = dimensions.height / 2
        const maxRadius = Math.min(dimensions.width, dimensions.height) * 0.4

        interface Trail {
            points: { x: number; y: number; alpha: number }[]
            progress: number
            offset: number
        }

        const trails: Trail[] = Array.from({ length: trailCount }, (_, i) => ({
            points: [],
            progress: 0,
            offset: (i / trailCount) * Math.PI * 2,
        }))

        const getPathPoint = (progress: number, offset: number) => {
            const t = progress + offset

            switch (pattern) {
                case "circular":
                    return {
                        x: centerX + Math.cos(t) * maxRadius,
                        y: centerY + Math.sin(t) * maxRadius,
                    }
                case "zigzag":
                    return {
                        x: centerX + Math.cos(t) * maxRadius,
                        y: centerY + Math.sin(t * 3) * (maxRadius * 0.5),
                    }
                case "wave":
                    return {
                        x: centerX + Math.cos(t) * maxRadius * 0.8,
                        y: centerY + Math.sin(t * 2) * maxRadius * 0.6,
                    }
                default:
                    return { x: centerX, y: centerY }
            }
        }

        const animate = () => {
            if (!isVisibleRef.current) {
                animationRef.current = requestAnimationFrame(animate)
                return
            }

            ctx.clearRect(0, 0, dimensions.width, dimensions.height)

            if (backgroundColor && backgroundColor !== "transparent") {
                ctx.fillStyle = backgroundColor
                ctx.fillRect(0, 0, dimensions.width, dimensions.height)
            }

            trails.forEach((trail) => {
                trail.progress += 0.01 * speed

                const currentPoint = getPathPoint(trail.progress, trail.offset)
                trail.points.push({ ...currentPoint, alpha: 1 })

                if (trail.points.length > trailLength) {
                    trail.points.shift()
                }

                trail.points.forEach((point, index) => {
                    point.alpha = index / trail.points.length
                })

                if (trail.points.length > 1) {
                    ctx.shadowBlur = glowIntensity
                    ctx.shadowColor = trailColor

                    for (let i = 0; i < trail.points.length - 1; i++) {
                        const point = trail.points[i]
                        const nextPoint = trail.points[i + 1]
                        const alpha = point.alpha

                        let colorWithAlpha = trailColor
                        if (trailColor.startsWith("#")) {
                            const r = parseInt(trailColor.slice(1, 3), 16)
                            const g = parseInt(trailColor.slice(3, 5), 16)
                            const b = parseInt(trailColor.slice(5, 7), 16)
                            colorWithAlpha = `rgba(${r}, ${g}, ${b}, ${alpha})`
                        } else if (trailColor.startsWith("rgb(")) {
                            colorWithAlpha = trailColor
                                .replace("rgb(", "rgba(")
                                .replace(")", `, ${alpha})`)
                        } else if (trailColor.startsWith("rgba(")) {
                            const match = trailColor.match(
                                /rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/
                            )
                            if (match) {
                                const r = match[1]
                                const g = match[2]
                                const b = match[3]
                                const existingAlpha = match[4]
                                    ? parseFloat(match[4])
                                    : 1
                                colorWithAlpha = `rgba(${r}, ${g}, ${b}, ${existingAlpha * alpha})`
                            }
                        } else if (trailColor.startsWith("hsl")) {
                            if (trailColor.startsWith("hsla(")) {
                                const match = trailColor.match(
                                    /hsla?\(([^,]+),\s*([^,]+),\s*([^,)]+),?\s*([\d.]+)?\)/
                                )
                                if (match) {
                                    const h = match[1]
                                    const s = match[2]
                                    const l = match[3]
                                    const existingAlpha = match[4]
                                        ? parseFloat(match[4])
                                        : 1
                                    colorWithAlpha = `hsla(${h}, ${s}, ${l}, ${existingAlpha * alpha})`
                                }
                            } else {
                                colorWithAlpha = trailColor
                                    .replace("hsl(", "hsla(")
                                    .replace(")", `, ${alpha})`)
                            }
                        }

                        ctx.strokeStyle = colorWithAlpha
                        ctx.lineWidth = 2 + point.alpha * 2
                        ctx.lineCap = "round"
                        ctx.lineJoin = "round"

                        ctx.beginPath()
                        ctx.moveTo(point.x, point.y)
                        ctx.lineTo(nextPoint.x, nextPoint.y)
                        ctx.stroke()
                    }

                    ctx.shadowBlur = 0
                }
            })

            animationRef.current = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            observer.disconnect()
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [
        dimensions,
        trailCount,
        trailColor,
        glowIntensity,
        speed,
        trailLength,
        pattern,
        backgroundColor,
        isStatic,
    ])

    if (isStatic) {
        const centerX = 200
        const centerY = 200
        const maxRadius = 160

        const staticTrails = Array.from({ length: trailCount }, (_, i) => {
            const offset = (i / trailCount) * Math.PI * 2
            const points = []

            for (let j = 0; j < trailLength / 5; j++) {
                const progress = (j / (trailLength / 5)) * Math.PI * 0.5
                const t = progress + offset

                let x, y
                switch (pattern) {
                    case "circular":
                        x = centerX + Math.cos(t) * maxRadius
                        y = centerY + Math.sin(t) * maxRadius
                        break
                    case "zigzag":
                        x = centerX + Math.cos(t) * maxRadius
                        y = centerY + Math.sin(t * 3) * (maxRadius * 0.5)
                        break
                    case "wave":
                        x = centerX + Math.cos(t) * maxRadius * 0.8
                        y = centerY + Math.sin(t * 2) * maxRadius * 0.6
                        break
                    default:
                        x = centerX
                        y = centerY
                }

                points.push({ x, y, alpha: j / (trailLength / 5) })
            }

            return points
        })

        return (
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 400 400"
                style={{ backgroundColor: backgroundColor || "transparent" }}
            >
                <defs>
                    <filter id="glow">
                        <feGaussianBlur
                            stdDeviation={glowIntensity / 4}
                            result="coloredBlur"
                        />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                {staticTrails.map((points, trailIndex) => (
                    <g key={trailIndex}>
                        {points.map((point, i) => {
                            if (i === 0) return null
                            const prevPoint = points[i - 1]
                            return (
                                <line
                                    key={i}
                                    x1={prevPoint.x}
                                    y1={prevPoint.y}
                                    x2={point.x}
                                    y2={point.y}
                                    stroke={trailColor}
                                    strokeWidth={2 + point.alpha * 2}
                                    strokeOpacity={point.alpha}
                                    strokeLinecap="round"
                                    filter="url(#glow)"
                                />
                            )
                        })}
                    </g>
                ))}
            </svg>
        )
    }

    return (
        <motion.div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                role="presentation"
                style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
        </motion.div>
    )
}

addPropertyControls(LightTrails, {
    trailCount: {
        type: ControlType.Number,
        title: "Trail Count",
        defaultValue: 5,
        min: 1,
        max: 15,
        step: 1,
    },
    trailColor: {
        type: ControlType.Color,
        title: "Trail Color",
        defaultValue: "#0099FF",
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Intensity",
        defaultValue: 20,
        min: 0,
        max: 50,
        step: 1,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 3,
        min: 0.5,
        max: 10,
        step: 0.5,
    },
    trailLength: {
        type: ControlType.Number,
        title: "Trail Length",
        defaultValue: 30,
        min: 20,
        max: 200,
        step: 10,
    },
    pattern: {
        type: ControlType.Enum,
        title: "Pattern",
        options: ["circular", "zigzag", "wave"],
        optionTitles: ["Circular", "Zigzag", "Wave"],
        defaultValue: "circular",
        displaySegmentedControl: true,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "transparent",
    },
})
