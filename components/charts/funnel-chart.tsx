/**
 * Made with 💛 by Karim Saif
 * Created and customized for Framer by Karim Saif
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 420
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

"use client"

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

import { motion, useSpring, useTransform } from "framer-motion"

type FunnelStage = {
    label: string
    value: number
    color: string
    useGradient: boolean
    gradientStart: string
    gradientEnd: string
}

type PatternType = "none" | "diagonal" | "horizontal" | "vertical"

type FunnelChartProps = {
    data: FunnelStage[]
    orientation: "horizontal" | "vertical"
    color: string
    layers: number
    showPercentage: boolean
    showValues: boolean
    showLabels: boolean
    staggerDelay: number
    gap: number
    edges: "curved" | "straight"
    labelLayout: "spread" | "grouped"
    labelOrientation: "vertical" | "horizontal"
    labelAlign: "center" | "start" | "end"
    pattern: PatternType
    patternColor: string
    patternOpacity: number
    patternWidth: number
    gridEnabled: boolean
    gridBands: boolean
    gridBandColor: string
    gridLines: boolean
    gridLineColor: string
    gridLineOpacity: number
    gridLineWidth: number
    background: string
    backgroundOpacity: number
    animate: boolean
    hoverEffect: boolean
    hoverScale: number
    dimInactive: boolean
}

const DEFAULT_STAGES: FunnelStage[] = [
    {
        label: "Awareness",
        value: 4100,
        color: "#8B5CF6",
        useGradient: true,
        gradientStart: "#8B5CF6",
        gradientEnd: "#6366F1",
    },
    {
        label: "Interest",
        value: 2957,
        color: "#6366F1",
        useGradient: true,
        gradientStart: "#6366F1",
        gradientEnd: "#3B82F6",
    },
    {
        label: "Consideration",
        value: 1084,
        color: "#3B82F6",
        useGradient: true,
        gradientStart: "#3B82F6",
        gradientEnd: "#06B6D4",
    },
    {
        label: "Intent",
        value: 1038,
        color: "#06B6D4",
        useGradient: true,
        gradientStart: "#06B6D4",
        gradientEnd: "#14B8A6",
    },
    {
        label: "Purchase",
        value: 320,
        color: "#14B8A6",
        useGradient: true,
        gradientStart: "#14B8A6",
        gradientEnd: "#8B5CF6",
    },
]

function formatValue(value: number) {
    return value.toLocaleString("en-US")
}

function formatPercentage(value: number) {
    return `${Math.round(value)}%`
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function PatternDefinition({
    id,
    type,
    color,
    opacity,
    width,
}: {
    id: string
    type: PatternType
    color: string
    opacity: number
    width: number
}) {
    if (type === "none") return null

    const size = Math.max(4, width * 2)

    let path = ""

    if (type === "diagonal") {
        path = `M0 ${size} L${size} 0`
    } else if (type === "horizontal") {
        path = `M0 ${size / 2} L${size} ${size / 2}`
    } else {
        path = `M${size / 2} 0 L${size / 2} ${size}`
    }

    return (
        <pattern
            id={id}
            width={size}
            height={size}
            patternUnits="userSpaceOnUse"
        >
            <path
                d={path}
                fill="none"
                stroke={color}
                strokeOpacity={opacity}
                strokeWidth={width}
                strokeLinecap="square"
            />
        </pattern>
    )
}

function horizontalSegmentPath(
    start: number,
    end: number,
    width: number,
    height: number,
    scale: number,
    straight: boolean
) {
    const center = height / 2
    const startHeight = start * height * 0.44 * scale
    const endHeight = end * height * 0.44 * scale

    if (straight) {
        return [
            `M 0 ${center - startHeight}`,
            `L ${width} ${center - endHeight}`,
            `L ${width} ${center + endHeight}`,
            `L 0 ${center + startHeight}`,
            "Z",
        ].join(" ")
    }

    const curve = width * 0.55

    return [
        `M 0 ${center - startHeight}`,
        `C ${curve} ${center - startHeight}`,
        `${width - curve} ${center - endHeight}`,
        `${width} ${center - endHeight}`,
        `L ${width} ${center + endHeight}`,
        `C ${width - curve} ${center + endHeight}`,
        `${curve} ${center + startHeight}`,
        `0 ${center + startHeight}`,
        "Z",
    ].join(" ")
}

function verticalSegmentPath(
    start: number,
    end: number,
    height: number,
    width: number,
    scale: number,
    straight: boolean
) {
    const center = width / 2
    const startWidth = start * width * 0.44 * scale
    const endWidth = end * width * 0.44 * scale

    if (straight) {
        return [
            `M ${center - startWidth} 0`,
            `L ${center - endWidth} ${height}`,
            `L ${center + endWidth} ${height}`,
            `L ${center + startWidth} 0`,
            "Z",
        ].join(" ")
    }

    const curve = height * 0.55

    return [
        `M ${center - startWidth} 0`,
        `C ${center - startWidth} ${curve}`,
        `${center - endWidth} ${height - curve}`,
        `${center - endWidth} ${height}`,
        `L ${center + endWidth} ${height}`,
        `C ${center + endWidth} ${height - curve}`,
        `${center + startWidth} ${curve}`,
        `${center + startWidth} 0`,
        "Z",
    ].join(" ")
}

function HorizontalRing({
    path,
    color,
    fill,
    opacity,
    hovered,
    index,
    total,
    animate,
    hoverScale,
}: {
    path: string
    color: string
    fill?: string
    opacity: number
    hovered: boolean
    index: number
    total: number
    animate: boolean
    hoverScale: number
}) {
    const scale = useSpring(1, {
        stiffness: Math.max(100, 300 - index * 45),
        damping: Math.max(12, 24 - index * 2),
    })

    React.useEffect(() => {
        const progress = index / Math.max(total - 1, 1)

        scale.set(animate && hovered ? 1 + progress * (hoverScale - 1) : 1)
    }, [animate, hovered, hoverScale, index, scale, total])

    return (
        <motion.path
            d={path}
            fill={fill ?? color}
            opacity={opacity}
            style={{
                scaleY: scale,
                transformOrigin: "center center",
            }}
        />
    )
}

function VerticalRing({
    path,
    color,
    fill,
    opacity,
    hovered,
    index,
    total,
    animate,
    hoverScale,
}: {
    path: string
    color: string
    fill?: string
    opacity: number
    hovered: boolean
    index: number
    total: number
    animate: boolean
    hoverScale: number
}) {
    const scale = useSpring(1, {
        stiffness: Math.max(100, 300 - index * 45),
        damping: Math.max(12, 24 - index * 2),
    })

    React.useEffect(() => {
        const progress = index / Math.max(total - 1, 1)

        scale.set(animate && hovered ? 1 + progress * (hoverScale - 1) : 1)
    }, [animate, hovered, hoverScale, index, scale, total])

    return (
        <motion.path
            d={path}
            fill={fill ?? color}
            opacity={opacity}
            style={{
                scaleX: scale,
                transformOrigin: "center center",
            }}
        />
    )
}

function HorizontalSegment({
    index,
    start,
    end,
    width,
    height,
    stage,
    layers,
    staggerDelay,
    hovered,
    dimmed,
    edges,
    pattern,
    patternColor,
    patternOpacity,
    patternWidth,
    animate,
    hoverEffect,
    hoverScale,
}: {
    index: number
    start: number
    end: number
    width: number
    height: number
    stage: FunnelStage
    layers: number
    staggerDelay: number
    hovered: boolean
    dimmed: boolean
    edges: "curved" | "straight"
    pattern: PatternType
    patternColor: string
    patternOpacity: number
    patternWidth: number
    animate: boolean
    hoverEffect: boolean
    hoverScale: number
}) {
    const progress = useSpring(animate ? 0 : 1, {
        stiffness: 120,
        damping: 20,
        mass: 1,
    })

    const scaleX = useTransform(progress, [0, 1], [0, 1])

    const opacity = useSpring(1, {
        stiffness: 300,
        damping: 24,
    })

    React.useEffect(() => {
        opacity.set(dimmed ? 0.4 : 1)
    }, [dimmed, opacity])

    React.useEffect(() => {
        if (!animate) {
            progress.set(1)
            return
        }

        const timeout = window.setTimeout(
            () => progress.set(1),
            index * staggerDelay * 1000
        )

        return () => window.clearTimeout(timeout)
    }, [animate, index, progress, staggerDelay])

    const patternId = `karim-saif-funnel-h-pattern-${index}`

    const gradientId = `karim-saif-funnel-h-gradient-${index}`

    const rings = Array.from({ length: layers }, (_, layer) => {
        const scale = 1 - (layer / Math.max(layers, 1)) * 0.35

        const ringOpacity = 0.18 + (layer / Math.max(layers - 1, 1)) * 0.65

        return {
            path: horizontalSegmentPath(
                start,
                end,
                width,
                height,
                scale,
                edges === "straight"
            ),
            opacity: ringOpacity,
        }
    })

    return (
        <motion.div
            style={{
                width,
                height,
                position: "relative",
                flexShrink: 0,
                overflow: "visible",
                zIndex: hovered ? 10 : 1,
                opacity,
                pointerEvents: "none",
            }}
        >
            <motion.div
                style={{
                    position: "absolute",
                    inset: 0,
                    scaleX,
                    transformOrigin: "left center",
                }}
            >
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${width} ${height}`}
                    preserveAspectRatio="none"
                    style={{
                        position: "absolute",
                        inset: 0,
                        overflow: "visible",
                    }}
                >
                    <defs>
                        {stage.useGradient && (
                            <linearGradient
                                id={gradientId}
                                x1="0"
                                x2="1"
                                y1="0"
                                y2="0"
                            >
                                <stop
                                    offset="0%"
                                    stopColor={stage.gradientStart}
                                />
                                <stop
                                    offset="100%"
                                    stopColor={stage.gradientEnd}
                                />
                            </linearGradient>
                        )}

                        <PatternDefinition
                            id={patternId}
                            type={pattern}
                            color={patternColor}
                            opacity={patternOpacity / 100}
                            width={patternWidth}
                        />
                    </defs>

                    {rings.map((ring, ringIndex) => {
                        const inner = ringIndex === rings.length - 1

                        let fill: string | undefined = stage.color

                        if (inner && pattern !== "none") {
                            fill = `url(#${patternId})`
                        } else if (inner && stage.useGradient) {
                            fill = `url(#${gradientId})`
                        }

                        return (
                            <HorizontalRing
                                key={ringIndex}
                                path={ring.path}
                                color={stage.color}
                                fill={fill}
                                opacity={ring.opacity}
                                hovered={hoverEffect && hovered}
                                index={ringIndex}
                                total={layers}
                                animate={animate}
                                hoverScale={hoverScale}
                            />
                        )
                    })}
                </svg>
            </motion.div>
        </motion.div>
    )
}

function VerticalSegment({
    index,
    start,
    end,
    width,
    height,
    stage,
    layers,
    staggerDelay,
    hovered,
    dimmed,
    edges,
    pattern,
    patternColor,
    patternOpacity,
    patternWidth,
    animate,
    hoverEffect,
    hoverScale,
}: {
    index: number
    start: number
    end: number
    width: number
    height: number
    stage: FunnelStage
    layers: number
    staggerDelay: number
    hovered: boolean
    dimmed: boolean
    edges: "curved" | "straight"
    pattern: PatternType
    patternColor: string
    patternOpacity: number
    patternWidth: number
    animate: boolean
    hoverEffect: boolean
    hoverScale: number
}) {
    const progress = useSpring(animate ? 0 : 1, {
        stiffness: 120,
        damping: 20,
        mass: 1,
    })

    const scaleY = useTransform(progress, [0, 1], [0, 1])

    const opacity = useSpring(1, {
        stiffness: 300,
        damping: 24,
    })

    React.useEffect(() => {
        opacity.set(dimmed ? 0.4 : 1)
    }, [dimmed, opacity])

    React.useEffect(() => {
        if (!animate) {
            progress.set(1)
            return
        }

        const timeout = window.setTimeout(
            () => progress.set(1),
            index * staggerDelay * 1000
        )

        return () => window.clearTimeout(timeout)
    }, [animate, index, progress, staggerDelay])

    const patternId = `karim-saif-funnel-v-pattern-${index}`

    const gradientId = `karim-saif-funnel-v-gradient-${index}`

    const rings = Array.from({ length: layers }, (_, layer) => {
        const scale = 1 - (layer / Math.max(layers, 1)) * 0.35

        const ringOpacity = 0.18 + (layer / Math.max(layers - 1, 1)) * 0.65

        return {
            path: verticalSegmentPath(
                start,
                end,
                height,
                width,
                scale,
                edges === "straight"
            ),
            opacity: ringOpacity,
        }
    })

    return (
        <motion.div
            style={{
                width,
                height,
                position: "relative",
                flexShrink: 0,
                overflow: "visible",
                zIndex: hovered ? 10 : 1,
                opacity,
                pointerEvents: "none",
            }}
        >
            <motion.div
                style={{
                    position: "absolute",
                    inset: 0,
                    scaleY,
                    transformOrigin: "center top",
                }}
            >
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${width} ${height}`}
                    preserveAspectRatio="none"
                    style={{
                        position: "absolute",
                        inset: 0,
                        overflow: "visible",
                    }}
                >
                    <defs>
                        {stage.useGradient && (
                            <linearGradient
                                id={gradientId}
                                x1="0"
                                x2="0"
                                y1="0"
                                y2="1"
                            >
                                <stop
                                    offset="0%"
                                    stopColor={stage.gradientStart}
                                />
                                <stop
                                    offset="100%"
                                    stopColor={stage.gradientEnd}
                                />
                            </linearGradient>
                        )}

                        <PatternDefinition
                            id={patternId}
                            type={pattern}
                            color={patternColor}
                            opacity={patternOpacity / 100}
                            width={patternWidth}
                        />
                    </defs>

                    {rings.map((ring, ringIndex) => {
                        const inner = ringIndex === rings.length - 1

                        let fill = stage.color

                        if (inner && pattern !== "none") {
                            fill = `url(#${patternId})`
                        } else if (inner && stage.useGradient) {
                            fill = `url(#${gradientId})`
                        }

                        return (
                            <VerticalRing
                                key={ringIndex}
                                path={ring.path}
                                color={stage.color}
                                fill={fill}
                                opacity={ring.opacity}
                                hovered={hoverEffect && hovered}
                                index={ringIndex}
                                total={layers}
                                animate={animate}
                                hoverScale={hoverScale}
                            />
                        )
                    })}
                </svg>
            </motion.div>
        </motion.div>
    )
}

function SegmentLabel({
    stage,
    percentage,
    horizontal,
    showValues,
    showPercentage,
    showLabels,
    index,
    staggerDelay,
    layout,
    orientation,
    align,
    animate,
}: {
    stage: FunnelStage
    percentage: number
    horizontal: boolean
    showValues: boolean
    showPercentage: boolean
    showLabels: boolean
    index: number
    staggerDelay: number
    layout: "spread" | "grouped"
    orientation: "vertical" | "horizontal"
    align: "center" | "start" | "end"
    animate: boolean
}) {
    const value = showValues ? (
        <span
            style={{
                whiteSpace: "nowrap",
                fontSize: 14,
                fontWeight: 650,
                lineHeight: 1.2,
                color: "var(--framer-color-text)",
            }}
        >
            {formatValue(stage.value)}
        </span>
    ) : null

    const percentageElement = showPercentage ? (
        <span
            style={{
                whiteSpace: "nowrap",
                borderRadius: 999,
                padding: "5px 10px",
                background: "var(--framer-color-text)",
                color: "var(--framer-color-bg)",
                fontSize: 11,
                fontWeight: 700,
                lineHeight: 1,
            }}
        >
            {formatPercentage(percentage)}
        </span>
    ) : null

    const label = showLabels ? (
        <span
            style={{
                whiteSpace: "nowrap",
                fontSize: 12,
                fontWeight: 500,
                lineHeight: 1.2,
                color: "var(--framer-color-text-secondary)",
            }}
        >
            {stage.label}
        </span>
    ) : null

    if (layout === "spread") {
        return (
            <motion.div
                initial={{
                    opacity: animate ? 0 : 1,
                }}
                animate={{ opacity: 1 }}
                transition={{
                    delay: animate ? index * staggerDelay + 0.25 : 0,
                    duration: animate ? 0.35 : 0,
                    ease: "easeOut",
                }}
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: horizontal ? "column" : "row",
                    alignItems: "center",
                }}
            >
                {horizontal ? (
                    <>
                        <div
                            style={{
                                height: "16%",
                                display: "flex",
                                alignItems: "flex-end",
                                justifyContent: "center",
                                paddingBottom: 4,
                            }}
                        >
                            {value}
                        </div>

                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {percentageElement}
                        </div>

                        <div
                            style={{
                                height: "16%",
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "center",
                                paddingTop: 4,
                            }}
                        >
                            {label}
                        </div>
                    </>
                ) : (
                    <>
                        <div
                            style={{
                                width: "16%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                paddingRight: 8,
                            }}
                        >
                            {value}
                        </div>

                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {percentageElement}
                        </div>

                        <div
                            style={{
                                width: "16%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-start",
                                paddingLeft: 8,
                            }}
                        >
                            {label}
                        </div>
                    </>
                )}
            </motion.div>
        )
    }

    const direction = orientation === "vertical" ? "column" : "row"

    const justify =
        align === "start"
            ? "flex-start"
            : align === "end"
              ? "flex-end"
              : "center"

    const crossAlign =
        orientation === "vertical"
            ? align === "start"
                ? "flex-start"
                : align === "end"
                  ? "flex-end"
                  : "center"
            : "center"

    return (
        <motion.div
            initial={{
                opacity: animate ? 0 : 1,
            }}
            animate={{ opacity: 1 }}
            transition={{
                delay: animate ? index * staggerDelay + 0.25 : 0,
                duration: animate ? 0.35 : 0,
                ease: "easeOut",
            }}
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: justify,
                padding: horizontal ? "8% 0" : "0 8%",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: direction,
                    alignItems: crossAlign,
                    gap: 6,
                }}
            >
                {value}
                {percentageElement}
                {label}
            </div>
        </motion.div>
    )
}

export default function KarimSaifFunnelChart(props: FunnelChartProps) {
    const {
        data,
        orientation,
        color,
        layers,
        showPercentage,
        showValues,
        showLabels,
        staggerDelay,
        gap,
        edges,
        labelLayout,
        labelOrientation,
        labelAlign,
        pattern,
        patternColor,
        patternOpacity,
        patternWidth,
        gridEnabled,
        gridBands,
        gridBandColor,
        gridLines,
        gridLineColor,
        gridLineOpacity,
        gridLineWidth,
        background,
        backgroundOpacity,
        animate,
        hoverEffect,
        hoverScale,
        dimInactive,
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)

    const [size, setSize] = React.useState({
        width: 0,
        height: 0,
    })

    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

    const isStatic = useIsStaticRenderer()

    const reducedMotion = useReducedMotion()

    const motionEnabled = animate && !isStatic && !reducedMotion

    const safeData = data && data.length ? data : DEFAULT_STAGES

    const safeLayers = clamp(Math.round(layers), 1, 8)

    const safeGap = clamp(gap, 0, 80)

    const horizontal = orientation === "horizontal"

    React.useEffect(() => {
        const element = containerRef.current

        if (!element) return

        const measure = () => {
            const rect = element.getBoundingClientRect()

            setSize({
                width: Math.max(0, rect.width),
                height: Math.max(0, rect.height),
            })
        }

        measure()

        const observer = new ResizeObserver(measure)

        observer.observe(element)

        return () => observer.disconnect()
    }, [])

    const width = size.width
    const height = size.height

    const maxValue = Math.max(
        ...safeData.map((stage) =>
            Math.max(0, Number.isFinite(stage.value) ? stage.value : 0)
        ),
        1
    )

    const count = safeData.length

    const totalGap = safeGap * Math.max(count - 1, 0)

    const segmentWidth = horizontal
        ? Math.max(0, (width - totalGap) / count)
        : width

    const segmentHeight = horizontal
        ? height
        : Math.max(0, (height - totalGap) / count)

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
                position: "relative",
                overflow: "visible",
                userSelect: "none",
                background,
                opacity: backgroundOpacity / 100,
            }}
        >
            {width > 0 && height > 0 && (
                <>
                    {gridEnabled && (
                        <svg
                            aria-hidden="true"
                            width="100%"
                            height="100%"
                            viewBox={`0 0 ${width} ${height}`}
                            preserveAspectRatio="none"
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                            }}
                        >
                            {gridBands &&
                                safeData.map((stage, index) => {
                                    if (index % 2 !== 0) {
                                        return null
                                    }

                                    if (horizontal) {
                                        return (
                                            <rect
                                                key={`band-${index}`}
                                                x={
                                                    (segmentWidth + safeGap) *
                                                    index
                                                }
                                                y={0}
                                                width={segmentWidth}
                                                height={height}
                                                fill={gridBandColor}
                                                opacity={0.35}
                                            />
                                        )
                                    }

                                    return (
                                        <rect
                                            key={`band-${index}`}
                                            x={0}
                                            y={
                                                (segmentHeight + safeGap) *
                                                index
                                            }
                                            width={width}
                                            height={segmentHeight}
                                            fill={gridBandColor}
                                            opacity={0.35}
                                        />
                                    )
                                })}
                        </svg>
                    )}

                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: horizontal ? "row" : "column",
                            gap: safeGap,
                            overflow: "visible",
                        }}
                    >
                        {safeData.map((stage, index) => {
                            const current = Math.max(
                                0,
                                Number.isFinite(stage.value) ? stage.value : 0
                            )

                            const next =
                                safeData[Math.min(index + 1, count - 1)]

                            const nextValue = Math.max(
                                0,
                                Number.isFinite(next?.value)
                                    ? next.value
                                    : current
                            )

                            const start = current / maxValue

                            const end = nextValue / maxValue

                            const dimmed =
                                dimInactive &&
                                hoveredIndex !== null &&
                                hoveredIndex !== index

                            const stageData = {
                                ...stage,
                                color: stage.color || color,
                            }

                            if (horizontal) {
                                return (
                                    <HorizontalSegment
                                        key={`segment-${index}`}
                                        index={index}
                                        start={start}
                                        end={end}
                                        width={segmentWidth}
                                        height={height}
                                        stage={stageData}
                                        layers={safeLayers}
                                        staggerDelay={staggerDelay}
                                        hovered={hoveredIndex === index}
                                        dimmed={dimmed}
                                        edges={edges}
                                        pattern={pattern}
                                        patternColor={patternColor}
                                        patternOpacity={patternOpacity}
                                        patternWidth={patternWidth}
                                        animate={motionEnabled}
                                        hoverEffect={hoverEffect}
                                        hoverScale={hoverScale}
                                    />
                                )
                            }

                            return (
                                <VerticalSegment
                                    key={`segment-${index}`}
                                    index={index}
                                    start={start}
                                    end={end}
                                    width={width}
                                    height={segmentHeight}
                                    stage={stageData}
                                    layers={safeLayers}
                                    staggerDelay={staggerDelay}
                                    hovered={hoveredIndex === index}
                                    dimmed={dimmed}
                                    edges={edges}
                                    pattern={pattern}
                                    patternColor={patternColor}
                                    patternOpacity={patternOpacity}
                                    patternWidth={patternWidth}
                                    animate={motionEnabled}
                                    hoverEffect={hoverEffect}
                                    hoverScale={hoverScale}
                                />
                            )
                        })}
                    </div>

                    {gridEnabled && gridLines && (
                        <svg
                            aria-hidden="true"
                            width="100%"
                            height="100%"
                            viewBox={`0 0 ${width} ${height}`}
                            preserveAspectRatio="none"
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                            }}
                        >
                            {Array.from(
                                {
                                    length: Math.max(0, count - 1),
                                },
                                (_, index) => {
                                    const position = index + 1

                                    if (horizontal) {
                                        const x =
                                            segmentWidth * position +
                                            safeGap * index +
                                            safeGap / 2

                                        return (
                                            <line
                                                key={`line-${position}`}
                                                x1={x}
                                                x2={x}
                                                y1={0}
                                                y2={height}
                                                stroke={gridLineColor}
                                                strokeOpacity={
                                                    gridLineOpacity / 100
                                                }
                                                strokeWidth={gridLineWidth}
                                            />
                                        )
                                    }

                                    const y =
                                        segmentHeight * position +
                                        safeGap * index +
                                        safeGap / 2

                                    return (
                                        <line
                                            key={`line-${position}`}
                                            x1={0}
                                            x2={width}
                                            y1={y}
                                            y2={y}
                                            stroke={gridLineColor}
                                            strokeOpacity={
                                                gridLineOpacity / 100
                                            }
                                            strokeWidth={gridLineWidth}
                                        />
                                    )
                                }
                            )}
                        </svg>
                    )}

                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                        }}
                    >
                        {safeData.map((stage, index) => {
                            const percentage =
                                (Math.max(0, stage.value) / maxValue) * 100

                            const left = horizontal
                                ? (segmentWidth + safeGap) * index
                                : 0

                            const top = horizontal
                                ? 0
                                : (segmentHeight + safeGap) * index

                            const itemWidth = horizontal ? segmentWidth : width

                            const itemHeight = horizontal
                                ? height
                                : segmentHeight

                            const dimmed =
                                dimInactive &&
                                hoveredIndex !== null &&
                                hoveredIndex !== index

                            return (
                                <div
                                    key={`label-${index}`}
                                    style={{
                                        position: "absolute",
                                        left,
                                        top,
                                        width: itemWidth,
                                        height: itemHeight,
                                        zIndex: 20,
                                        cursor: hoverEffect
                                            ? "pointer"
                                            : "default",
                                        opacity: dimmed ? 0.4 : 1,
                                        transition: "opacity 180ms ease",
                                        pointerEvents: "auto",
                                    }}
                                    onMouseEnter={() => {
                                        if (hoverEffect && !isStatic) {
                                            setHoveredIndex(index)
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        if (!isStatic) {
                                            setHoveredIndex(null)
                                        }
                                    }}
                                >
                                    <SegmentLabel
                                        stage={stage}
                                        percentage={percentage}
                                        horizontal={horizontal}
                                        showValues={showValues}
                                        showPercentage={showPercentage}
                                        showLabels={showLabels}
                                        index={index}
                                        staggerDelay={staggerDelay}
                                        layout={labelLayout}
                                        orientation={labelOrientation}
                                        align={labelAlign}
                                        animate={motionEnabled}
                                    />
                                </div>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    )
}

KarimSaifFunnelChart.defaultProps = {
    data: DEFAULT_STAGES,
    orientation: "horizontal",
    color: "#6366F1",
    layers: 3,
    showPercentage: true,
    showValues: true,
    showLabels: true,
    staggerDelay: 0.12,
    gap: 4,
    edges: "curved",
    labelLayout: "spread",
    labelOrientation: "vertical",
    labelAlign: "center",
    pattern: "none",
    patternColor: "#FFFFFF",
    patternOpacity: 18,
    patternWidth: 1,
    gridEnabled: false,
    gridBands: true,
    gridBandColor: "#94A3B8",
    gridLines: true,
    gridLineColor: "#94A3B8",
    gridLineOpacity: 20,
    gridLineWidth: 1,
    background: "rgba(0,0,0,0)",
    backgroundOpacity: 100,
    animate: true,
    hoverEffect: true,
    hoverScale: 1.12,
    dimInactive: true,
}

addPropertyControls(KarimSaifFunnelChart, {
    data: {
        type: ControlType.Array,
        title: "Stages",
        maxCount: 8,
        defaultValue: DEFAULT_STAGES,
        description:
            "Add, remove, and reorder funnel stages. Each stage has its own label, value, color, and gradient settings.",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Stage",
                    description: "Text displayed for this funnel stage.",
                },
                value: {
                    type: ControlType.Number,
                    title: "Value",
                    defaultValue: 1000,
                    min: 0,
                    max: 1000000,
                    step: 1,
                    description:
                        "Numeric value used to determine the relative size of this stage.",
                },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#6366F1",
                    description: "Base color used by this stage.",
                },
                useGradient: {
                    type: ControlType.Boolean,
                    title: "Gradient",
                    defaultValue: true,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                    description:
                        "Replaces the stage's solid color with a two-color gradient.",
                },
                gradientStart: {
                    type: ControlType.Color,
                    title: "Start",
                    defaultValue: "#6366F1",
                    hidden: (props) => !props.useGradient,
                    description: "Starting color of this stage's gradient.",
                },
                gradientEnd: {
                    type: ControlType.Color,
                    title: "End",
                    defaultValue: "#06B6D4",
                    hidden: (props) => !props.useGradient,
                    description: "Ending color of this stage's gradient.",
                },
            },
        },
    },

    orientation: {
        type: ControlType.Enum,
        title: "Orientation",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
        description: "Controls the direction in which the funnel flows.",
    },

    color: {
        type: ControlType.Color,
        title: "Default Color",
        defaultValue: "#6366F1",
        description:
            "Fallback color used when a stage does not provide a color.",
    },

    layers: {
        type: ControlType.Number,
        title: "Depth Layers",
        min: 1,
        max: 8,
        step: 1,
        defaultValue: 3,
        displayStepper: true,
        description:
            "Controls the number of layered shapes used to create the depth effect.",
    },

    edges: {
        type: ControlType.Enum,
        title: "Edges",
        options: ["curved", "straight"],
        optionTitles: ["Curved", "Straight"],
        defaultValue: "curved",
        displaySegmentedControl: true,
        description:
            "Controls whether the funnel edges are curved or geometric and straight.",
    },

    gap: {
        type: ControlType.Number,
        title: "Stage Gap",
        min: 0,
        max: 80,
        step: 1,
        defaultValue: 4,
        unit: "px",
        displayStepper: true,
        description: "Controls the space between adjacent funnel stages.",
    },

    showLabels: {
        type: ControlType.Boolean,
        title: "Labels",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "Shows or hides the stage names.",
    },

    showValues: {
        type: ControlType.Boolean,
        title: "Values",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "Shows or hides the numeric stage values.",
    },

    showPercentage: {
        type: ControlType.Boolean,
        title: "Percentages",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description:
            "Shows or hides percentage badges relative to the largest stage.",
    },

    labelLayout: {
        type: ControlType.Enum,
        title: "Label Layout",
        options: ["spread", "grouped"],
        optionTitles: ["Spread", "Grouped"],
        defaultValue: "spread",
        displaySegmentedControl: true,
        description:
            "Controls whether label content is distributed around each stage or grouped together.",
    },

    labelOrientation: {
        type: ControlType.Enum,
        title: "Label Direction",
        options: ["vertical", "horizontal"],
        optionTitles: ["Vertical", "Horizontal"],
        defaultValue: "vertical",
        displaySegmentedControl: true,
        description: "Controls the direction of grouped label content.",
    },

    labelAlign: {
        type: ControlType.Enum,
        title: "Label Align",
        options: ["start", "center", "end"],
        optionTitles: ["Start", "Center", "End"],
        defaultValue: "center",
        displaySegmentedControl: true,
        description: "Controls the alignment of grouped label content.",
    },

    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.12,
        unit: "s",
        displayStepper: true,
        description:
            "Controls the delay between each stage's entrance animation.",
    },

    pattern: {
        type: ControlType.Enum,
        title: "Pattern",
        options: ["none", "diagonal", "horizontal", "vertical"],
        optionTitles: ["None", "Diagonal", "Horizontal", "Vertical"],
        defaultValue: "none",
        description:
            "Adds a line pattern to the inner layer of each funnel stage.",
    },

    patternColor: {
        type: ControlType.Color,
        title: "Pattern Color",
        defaultValue: "#FFFFFF",
        hidden: (props) => props.pattern === "none",
        description: "Controls the color of the pattern lines.",
    },

    patternOpacity: {
        type: ControlType.Number,
        title: "Pattern Opacity",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 18,
        unit: "%",
        hidden: (props) => props.pattern === "none",
        description: "Controls the visibility of the pattern.",
    },

    patternWidth: {
        type: ControlType.Number,
        title: "Pattern Width",
        min: 0.25,
        max: 5,
        step: 0.25,
        defaultValue: 1,
        unit: "px",
        hidden: (props) => props.pattern === "none",
        description: "Controls the thickness of the pattern lines.",
    },

    gridEnabled: {
        type: ControlType.Boolean,
        title: "Grid",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Enables the background grid system.",
    },

    gridBands: {
        type: ControlType.Boolean,
        title: "Grid Bands",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (props) => !props.gridEnabled,
        description: "Adds alternating background bands behind the stages.",
    },

    gridBandColor: {
        type: ControlType.Color,
        title: "Band Color",
        defaultValue: "#94A3B8",
        hidden: (props) => !props.gridEnabled || !props.gridBands,
        description: "Controls the color of the alternating grid bands.",
    },

    gridLines: {
        type: ControlType.Boolean,
        title: "Grid Lines",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (props) => !props.gridEnabled,
        description: "Adds divider lines between the funnel stages.",
    },

    gridLineColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "#94A3B8",
        hidden: (props) => !props.gridEnabled || !props.gridLines,
        description: "Controls the color of the grid divider lines.",
    },

    gridLineOpacity: {
        type: ControlType.Number,
        title: "Line Opacity",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 20,
        unit: "%",
        hidden: (props) => !props.gridEnabled || !props.gridLines,
        description: "Controls the opacity of the grid divider lines.",
    },

    gridLineWidth: {
        type: ControlType.Number,
        title: "Line Width",
        min: 0.5,
        max: 5,
        step: 0.5,
        defaultValue: 1,
        unit: "px",
        hidden: (props) => !props.gridEnabled || !props.gridLines,
        description: "Controls the thickness of the grid divider lines.",
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(0,0,0,0)",
        description: "Sets the background color behind the funnel.",
    },

    backgroundOpacity: {
        type: ControlType.Number,
        title: "Background Opacity",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 100,
        unit: "%",
        description: "Controls the opacity of the funnel background.",
    },

    animate: {
        type: ControlType.Boolean,
        title: "Animation",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Animates the funnel stages when the component appears.",
    },

    hoverEffect: {
        type: ControlType.Boolean,
        title: "Hover Effect",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Enables interactive stage highlighting and expansion on hover.",
    },

    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        min: 1,
        max: 1.4,
        step: 0.01,
        defaultValue: 1.12,
        hidden: (props) => !props.hoverEffect,
        description: "Controls how much the hovered funnel layer expands.",
    },

    dimInactive: {
        type: ControlType.Boolean,
        title: "Dim Inactive",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})
