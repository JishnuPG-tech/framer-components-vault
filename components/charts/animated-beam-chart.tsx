/**
 * Made with 💛 by Karim Saif
 * Created and customized for Framer by Karim Saif
 *
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 440
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */

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

import { motion } from "framer-motion"

type Mode = "hub" | "converge" | "parallel"
type Orientation = "horizontal" | "vertical"
type Easing = "linear" | "easeOut" | "easeInOut" | "expo"

type Preset =
    | "custom"
    | "hubClassic"
    | "hubNeon"
    | "hubMinimal"
    | "convergeClassic"
    | "convergeNetwork"
    | "convergeNeon"
    | "parallelClassic"
    | "parallelWave"
    | "parallelMinimal"

type ImageValue =
    | string
    | {
          src?: string
          srcSet?: string
          alt?: string
      }
    | undefined

interface NodeItem {
    image?: ImageValue
}

interface CardItem {
    text?: string
    icon?: ImageValue
}

interface Props {
    preset: Preset
    mode: Mode
    padding: number
    gap: number
    inset: number
    nodeSize: number
    centerSize: number
    centerImage?: ImageValue
    leftNodes: NodeItem[]
    rightNodes: NodeItem[]
    nodeBackground: string
    nodeBorderColor: string
    nodeBorderWidth: number
    nodeRadius: number
    lineCount: number
    convergeX: number
    convergeY: number
    bend: number
    flipVertical: boolean
    flipHorizontal: boolean
    meetIcon?: ImageValue
    meetIconSize: number
    meetIconBackground: string
    meetIconBorderColor: string
    meetIconBorderWidth: number
    meetIconRadius: number
    meetIconPadding: number
    orientation: Orientation
    curvature: number
    showCards: boolean
    cards: CardItem[]
    cardBackground: string
    cardTextColor: string
    cardBorderColor: string
    cardBorderWidth: number
    cardRadius: number
    cardPaddingX: number
    cardPaddingY: number
    cardIconSize: number
    fontSize: number
    fontWeight: number
    pathColor: string
    pathWidth: number
    pathOpacity: number
    gradientStartColor: string
    gradientStopColor: string
    beamLength: number
    duration: number
    delay: number
    stagger: number
    repeatDelay: number
    speedVariation: number
    easing: Easing
    reverse: boolean
    style?: React.CSSProperties
}

interface BeamGeometry {
    d: string
    axis: "x" | "y"
    endX: number
    endY: number
    delay: number
    duration: number
    reverse: boolean
    index: number
}

interface Size {
    width: number
    height: number
}

const DEFAULT_LEFT: NodeItem[] = [{}, {}, {}]

const DEFAULT_RIGHT: NodeItem[] = [{}, {}, {}]

const DEFAULT_CARDS: CardItem[] = [
    { text: "Notion" },
    { text: "Drive" },
    { text: "Docs" },
    { text: "Zapier" },
    { text: "Slack" },
    { text: "Gmail" },
]

const PRESETS: Record<Exclude<Preset, "custom">, Partial<Props>> = {
    hubClassic: {
        mode: "hub",
        nodeSize: 48,
        centerSize: 64,
        padding: 40,
        gap: 24,
        nodeBackground: "#ffffff",
        nodeBorderColor: "#e5e7eb",
        nodeBorderWidth: 2,
        nodeRadius: 999,
        pathColor: "#9ca3af",
        pathWidth: 2,
        pathOpacity: 0.2,
        gradientStartColor: "#ffaa40",
        gradientStopColor: "#9c40ff",
        curvature: 75,
        duration: 8,
        stagger: 0.4,
        speedVariation: 0.5,
        easing: "linear",
        reverse: false,
    },

    hubNeon: {
        mode: "hub",
        nodeSize: 52,
        centerSize: 72,
        padding: 34,
        gap: 20,
        nodeBackground: "#09090b",
        nodeBorderColor: "#27272a",
        nodeBorderWidth: 1,
        nodeRadius: 999,
        pathColor: "#52525b",
        pathWidth: 2,
        pathOpacity: 0.3,
        gradientStartColor: "#00e5ff",
        gradientStopColor: "#a855f7",
        curvature: 100,
        duration: 5,
        stagger: 0.25,
        speedVariation: 0.35,
        easing: "easeOut",
        reverse: false,
    },

    hubMinimal: {
        mode: "hub",
        nodeSize: 42,
        centerSize: 58,
        padding: 44,
        gap: 28,
        nodeBackground: "#f8fafc",
        nodeBorderColor: "#cbd5e1",
        nodeBorderWidth: 1,
        nodeRadius: 14,
        pathColor: "#94a3b8",
        pathWidth: 1.5,
        pathOpacity: 0.16,
        gradientStartColor: "#64748b",
        gradientStopColor: "#0f172a",
        curvature: 55,
        duration: 10,
        stagger: 0.5,
        speedVariation: 0,
        easing: "linear",
        reverse: false,
    },

    convergeClassic: {
        mode: "converge",
        lineCount: 6,
        convergeX: 0.5,
        convergeY: 0.92,
        bend: 0.55,
        padding: 0,
        inset: 40,
        pathColor: "#9ca3af",
        pathWidth: 2,
        pathOpacity: 0.2,
        gradientStartColor: "#ffaa40",
        gradientStopColor: "#9c40ff",
        beamLength: 22,
        duration: 8,
        stagger: 0.6,
        speedVariation: 0,
        easing: "linear",
        reverse: false,
    },

    convergeNetwork: {
        mode: "converge",
        lineCount: 8,
        convergeX: 0.5,
        convergeY: 0.78,
        bend: 0.62,
        padding: 0,
        inset: 60,
        pathColor: "#71717a",
        pathWidth: 2,
        pathOpacity: 0.24,
        gradientStartColor: "#38bdf8",
        gradientStopColor: "#818cf8",
        beamLength: 26,
        duration: 6,
        stagger: 0.35,
        speedVariation: 0.4,
        easing: "easeOut",
        reverse: false,
    },

    convergeNeon: {
        mode: "converge",
        lineCount: 7,
        convergeX: 0.5,
        convergeY: 0.88,
        bend: 0.58,
        padding: 0,
        inset: 35,
        pathColor: "#3f3f46",
        pathWidth: 2,
        pathOpacity: 0.28,
        gradientStartColor: "#22d3ee",
        gradientStopColor: "#d946ef",
        beamLength: 32,
        duration: 5,
        stagger: 0.25,
        speedVariation: 0.5,
        easing: "easeOut",
        reverse: false,
    },

    parallelClassic: {
        mode: "parallel",
        lineCount: 6,
        orientation: "horizontal",
        curvature: 0,
        inset: 40,
        pathColor: "#9ca3af",
        pathWidth: 2,
        pathOpacity: 0.2,
        gradientStartColor: "#ffaa40",
        gradientStopColor: "#9c40ff",
        beamLength: 22,
        duration: 8,
        stagger: 0.6,
        speedVariation: 0,
        easing: "linear",
        reverse: false,
    },

    parallelWave: {
        mode: "parallel",
        lineCount: 7,
        orientation: "horizontal",
        curvature: 35,
        inset: 30,
        pathColor: "#71717a",
        pathWidth: 2,
        pathOpacity: 0.2,
        gradientStartColor: "#06b6d4",
        gradientStopColor: "#8b5cf6",
        beamLength: 30,
        duration: 6,
        stagger: 0.35,
        speedVariation: 0.5,
        easing: "easeInOut",
        reverse: false,
    },

    parallelMinimal: {
        mode: "parallel",
        lineCount: 5,
        orientation: "vertical",
        curvature: 0,
        inset: 45,
        pathColor: "#94a3b8",
        pathWidth: 1,
        pathOpacity: 0.15,
        gradientStartColor: "#475569",
        gradientStopColor: "#0f172a",
        beamLength: 18,
        duration: 10,
        stagger: 0.8,
        speedVariation: 0,
        easing: "linear",
        reverse: false,
    },
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
}

function imageSrc(image: ImageValue): string | undefined {
    if (!image) return undefined
    if (typeof image === "string") return image
    return image.src
}

function createSvgId(value: string): string {
    return value.replace(/[^a-zA-Z0-9_-]/g, "")
}

function getEffectiveProps(props: Props): Props {
    if (props.preset === "custom") {
        return props
    }

    return {
        ...props,
        ...PRESETS[props.preset],
    }
}

const DEFAULT_PROPS: Props = {
    preset: "custom",
    mode: "hub",
    padding: 40,
    gap: 24,
    inset: 40,
    nodeSize: 48,
    centerSize: 64,
    centerImage: undefined,
    leftNodes: DEFAULT_LEFT,
    rightNodes: DEFAULT_RIGHT,
    nodeBackground: "#ffffff",
    nodeBorderColor: "#e5e7eb",
    nodeBorderWidth: 2,
    nodeRadius: 999,
    lineCount: 6,
    convergeX: 0.5,
    convergeY: 0.92,
    bend: 0.55,
    flipVertical: false,
    flipHorizontal: false,
    meetIcon: undefined,
    meetIconSize: 48,
    meetIconBackground: "#18181b",
    meetIconBorderColor: "#3f3f46",
    meetIconBorderWidth: 1,
    meetIconRadius: 999,
    meetIconPadding: 10,
    orientation: "horizontal",
    curvature: 0,
    showCards: true,
    cards: DEFAULT_CARDS,
    cardBackground: "#18181b",
    cardTextColor: "#fafafa",
    cardBorderColor: "#3f3f46",
    cardBorderWidth: 1,
    cardRadius: 10,
    cardPaddingX: 14,
    cardPaddingY: 8,
    cardIconSize: 18,
    fontSize: 13,
    fontWeight: 500,
    pathColor: "#9ca3af",
    pathWidth: 2,
    pathOpacity: 0.2,
    gradientStartColor: "#ffaa40",
    gradientStopColor: "#9c40ff",
    beamLength: 22,
    duration: 8,
    delay: 0,
    stagger: 0.4,
    repeatDelay: 0,
    speedVariation: 0.5,
    easing: "linear",
    reverse: false,
}

function AnimatedBeamKarimSaif(props: Props) {
    const mergedProps = {
        ...DEFAULT_PROPS,
        ...props,
    }

    const p = getEffectiveProps(mergedProps)

    const containerRef = React.useRef<HTMLDivElement>(null)
    const centerRef = React.useRef<HTMLDivElement>(null)
    const leftRefs = React.useRef<(HTMLDivElement | null)[]>([])
    const rightRefs = React.useRef<(HTMLDivElement | null)[]>([])

    const [size, setSize] = React.useState<Size>({
        width: 0,
        height: 0,
    })

    const [beams, setBeams] = React.useState<BeamGeometry[]>([])
    const [isInView, setIsInView] = React.useState(false)
    const [isDocumentVisible, setIsDocumentVisible] = React.useState(() =>
        typeof document === "undefined"
            ? true
            : document.visibilityState === "visible"
    )

    const isStaticRenderer = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()

    const staticMode = Boolean(isStaticRenderer || reducedMotion)

    const shouldAnimate = !staticMode && isInView && isDocumentVisible

    const uid = React.useId()
    const safeUid = createSvgId(`karimSaifBeam${uid}`)

    const {
        mode,
        padding,
        gap,
        inset,
        nodeSize,
        centerSize,
        centerImage,
        leftNodes,
        rightNodes,
        nodeBackground,
        nodeBorderColor,
        nodeBorderWidth,
        nodeRadius,
        lineCount,
        convergeX,
        convergeY,
        bend,
        flipVertical,
        flipHorizontal,
        meetIcon,
        meetIconSize,
        meetIconBackground,
        meetIconBorderColor,
        meetIconBorderWidth,
        meetIconRadius,
        meetIconPadding,
        orientation,
        curvature,
        showCards,
        cards,
        cardBackground,
        cardTextColor,
        cardBorderColor,
        cardBorderWidth,
        cardRadius,
        cardPaddingX,
        cardPaddingY,
        cardIconSize,
        fontSize,
        fontWeight,
        pathColor,
        pathWidth,
        pathOpacity,
        gradientStartColor,
        gradientStopColor,
        beamLength,
        duration,
        delay,
        stagger,
        repeatDelay,
        speedVariation,
        easing,
        reverse,
        style,
    } = p

    React.useEffect(() => {
        if (typeof document === "undefined") {
            return
        }

        const updateVisibility = () => {
            setIsDocumentVisible(document.visibilityState === "visible")
        }

        updateVisibility()

        document.addEventListener("visibilitychange", updateVisibility)

        return () => {
            document.removeEventListener("visibilitychange", updateVisibility)
        }
    }, [])

    React.useEffect(() => {
        const element = containerRef.current

        if (!element) return

        if (staticMode) {
            setIsInView(false)
            return
        }

        if (typeof IntersectionObserver === "undefined") {
            setIsInView(false)
            return
        }

        let active = true

        const observer = new IntersectionObserver(
            (entries) => {
                if (!active) return

                const entry = entries[0]

                if (!entry) return

                setIsInView(entry.isIntersecting)
            },
            {
                root: null,
                rootMargin: "0px",
                threshold: 0,
            }
        )

        observer.observe(element)

        return () => {
            active = false
            observer.disconnect()
        }
    }, [staticMode])

    const measure = React.useCallback(() => {
        const container = containerRef.current

        if (!container) return

        const rect = container.getBoundingClientRect()

        const width = Math.max(1, rect.width)
        const height = Math.max(1, rect.height)

        setSize((previous) => {
            if (
                Math.abs(previous.width - width) < 0.5 &&
                Math.abs(previous.height - height) < 0.5
            ) {
                return previous
            }

            return {
                width,
                height,
            }
        })

        const next: BeamGeometry[] = []

        if (mode === "hub") {
            const center = centerRef.current

            if (!center) {
                setBeams([])
                return
            }

            const centerRect = center.getBoundingClientRect()

            const cx = centerRect.left - rect.left + centerRect.width / 2

            const cy = centerRect.top - rect.top + centerRect.height / 2

            const halfHeight = Math.max(1, height / 2)

            const buildBeam = (
                element: HTMLDivElement | null,
                isRight: boolean,
                index: number
            ) => {
                if (!element) return

                const nodeRect = element.getBoundingClientRect()

                const sx = nodeRect.left - rect.left + nodeRect.width / 2

                const sy = nodeRect.top - rect.top + nodeRect.height / 2

                const dy = sy - cy

                const sign = dy === 0 ? 0 : dy < 0 ? -1 : 1

                const normalizedDistance = clamp(dy / halfHeight, -1, 1)

                const controlY = sy - curvature * normalizedDistance

                const midX = (sx + cx) / 2

                const endY = cy + sign * 10

                const d =
                    `M ${sx},${sy} ` +
                    `Q ${midX},${controlY} ` +
                    `${cx},${endY}`

                const variation =
                    speedVariation > 0
                        ? ((index * 1.37) % (speedVariation * 2)) -
                          speedVariation
                        : 0

                const beamDuration = Math.max(0.1, duration + variation)

                next.push({
                    d,
                    axis: "x",
                    endX: sx,
                    endY: sy,
                    delay: delay + index * stagger,
                    duration: beamDuration,
                    reverse: reverse ? !isRight : isRight,
                    index,
                })
            }

            leftRefs.current.forEach((element, index) => {
                buildBeam(element, false, index)
            })

            rightRefs.current.forEach((element, index) => {
                buildBeam(element, true, leftNodes.length + index)
            })

            setBeams(next)
            return
        }

        const count = clamp(Math.round(lineCount), 1, 12)

        const fx = (x: number) => (flipHorizontal ? width - x : x)

        const fy = (y: number) => (flipVertical ? height - y : y)

        for (let i = 0; i < count; i++) {
            const t = count === 1 ? 0.5 : i / (count - 1)

            let d = ""
            let axis: "x" | "y" = "y"
            let endX = 0
            let endY = 0

            if (mode === "converge") {
                const cx = fx(width * clamp(convergeX, 0, 1))

                const cy = fy(height * clamp(convergeY, 0, 1))

                const safeInset = Math.min(Math.max(0, inset), width / 2)

                const topX = fx(safeInset + (width - safeInset * 2) * t)

                const topY = fy(0)

                const controlY = fy(
                    height * clamp(convergeY, 0, 1) * clamp(bend, 0.1, 0.95)
                )

                d =
                    `M ${topX},${topY} ` +
                    `C ${topX},${controlY} ` +
                    `${cx},${controlY} ` +
                    `${cx},${cy}`

                axis = "y"
                endX = topX
                endY = topY
            } else if (orientation === "horizontal") {
                const y = fy(height * t)

                const safeInset = Math.min(Math.max(0, inset), width / 2)

                const x0 = fx(safeInset)

                const x1 = fx(width - safeInset)

                const midX = (x0 + x1) / 2

                const bowY = flipVertical ? y + curvature : y - curvature

                d =
                    curvature === 0
                        ? `M ${x0},${y} L ${x1},${y}`
                        : `M ${x0},${y} Q ${midX},${bowY} ${x1},${y}`

                axis = "x"
                endX = x0
                endY = y
            } else {
                const x = fx(width * t)

                const safeInset = Math.min(Math.max(0, inset), height / 2)

                const y0 = fy(safeInset)

                const y1 = fy(height - safeInset)

                const midY = (y0 + y1) / 2

                const bowX = flipHorizontal ? x - curvature : x + curvature

                d =
                    curvature === 0
                        ? `M ${x},${y0} L ${x},${y1}`
                        : `M ${x},${y0} Q ${bowX},${midY} ${x},${y1}`

                axis = "y"
                endX = x
                endY = y0
            }

            const variation =
                speedVariation > 0
                    ? ((i * 1.37) % (speedVariation * 2)) - speedVariation
                    : 0

            const beamDuration = Math.max(0.1, duration + variation)

            let beamReverse = reverse

            if (axis === "y" && flipVertical) {
                beamReverse = !beamReverse
            }

            if (axis === "x" && flipHorizontal) {
                beamReverse = !beamReverse
            }

            next.push({
                d,
                axis,
                endX,
                endY,
                delay: delay + i * stagger,
                duration: beamDuration,
                reverse: beamReverse,
                index: i,
            })
        }

        setBeams(next)
    }, [
        mode,
        padding,
        gap,
        nodeSize,
        centerSize,
        lineCount,
        leftNodes.length,
        rightNodes.length,
        inset,
        convergeX,
        convergeY,
        bend,
        curvature,
        flipVertical,
        flipHorizontal,
        orientation,
        duration,
        delay,
        stagger,
        speedVariation,
        reverse,
    ])

    React.useEffect(() => {
        measure()

        const frame = requestAnimationFrame(measure)

        if (!staticMode && !isInView) {
            return () => {
                cancelAnimationFrame(frame)
            }
        }

        const observer =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(measure)
                : null

        if (observer && containerRef.current) {
            observer.observe(containerRef.current)
        }

        if (typeof window !== "undefined") {
            window.addEventListener("resize", measure)
        }

        return () => {
            cancelAnimationFrame(frame)
            observer?.disconnect()

            if (typeof window !== "undefined") {
                window.removeEventListener("resize", measure)
            }
        }
    }, [measure, staticMode, isInView])

    const containerStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: mode === "hub" ? "hidden" : "visible",
        boxSizing: "border-box",
        ...style,
    }

    const nodeStyle = (dimension: number): React.CSSProperties => ({
        width: dimension,
        height: dimension,
        flex: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: nodeRadius,
        background: nodeBackground,
        border: `${nodeBorderWidth}px solid ${nodeBorderColor}`,
        boxShadow: "0 0 20px -12px rgba(0,0,0,0.8)",
        overflow: "hidden",
        boxSizing: "border-box",
    })

    const columnStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",
        alignItems: "center",
        gap,
        height: "100%",
        zIndex: 2,
    }

    const imageStyle: React.CSSProperties = {
        width: "70%",
        height: "70%",
        objectFit: "contain",
        display: "block",
    }

    const renderNodeContent = (
        item: NodeItem | undefined,
        fallbackColor: string
    ) => {
        const src = imageSrc(item?.image)

        if (src) {
            return <img src={src} alt="" style={imageStyle} draggable={false} />
        }

        return (
            <div
                style={{
                    width: "35%",
                    height: "35%",
                    borderRadius: 999,
                    background: fallbackColor,
                    opacity: 0.85,
                }}
            />
        )
    }

    const easingMap: Record<Easing, string | number[]> = {
        linear: "linear",
        easeOut: "easeOut",
        easeInOut: "easeInOut",
        expo: [0.16, 1, 0.3, 1],
    }

    const renderGradient = (beam: BeamGeometry, index: number) => {
        const gradientId = `${safeUid}Gradient${index}`

        return (
            <linearGradient
                id={gradientId}
                gradientUnits="objectBoundingBox"
                x1="0%"
                y1="0%"
                x2={beam.axis === "x" ? "100%" : "0%"}
                y2={beam.axis === "y" ? "100%" : "0%"}
            >
                <stop
                    offset="0%"
                    stopColor={gradientStartColor}
                    stopOpacity="0"
                />
                <stop offset="22%" stopColor={gradientStartColor} />
                <stop offset="52%" stopColor={gradientStopColor} />
                <stop
                    offset="100%"
                    stopColor={gradientStopColor}
                    stopOpacity="0"
                />
            </linearGradient>
        )
    }

    const renderBeamSVG = () => {
        if (size.width <= 0 || size.height <= 0) {
            return null
        }

        const dashLength = clamp(beamLength, 5, 90)

        const animationKey = `${isInView}-${isDocumentVisible}`

        return (
            <svg
                width={size.width}
                height={size.height}
                viewBox={`0 0 ${size.width} ${size.height}`}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    overflow: "visible",
                    transform: "translateZ(0)",
                }}
                aria-hidden="true"
            >
                <defs>{beams.map(renderGradient)}</defs>

                {beams.map((beam, index) => {
                    const gradientId = `${safeUid}Gradient${index}`

                    const animationDistance = beam.reverse ? 100 : -100

                    return (
                        <g key={`beam-${index}`}>
                            <path
                                d={beam.d}
                                pathLength={100}
                                stroke={pathColor}
                                strokeWidth={pathWidth}
                                strokeOpacity={pathOpacity}
                                strokeLinecap="round"
                                vectorEffect="non-scaling-stroke"
                            />

                            {!shouldAnimate ? (
                                <path
                                    d={beam.d}
                                    pathLength={100}
                                    stroke={`url(#${gradientId})`}
                                    strokeWidth={pathWidth}
                                    strokeOpacity={1}
                                    strokeLinecap="round"
                                    strokeDasharray={`${dashLength} ${100 - dashLength}`}
                                    strokeDashoffset={
                                        beam.reverse ? -dashLength : 0
                                    }
                                    vectorEffect="non-scaling-stroke"
                                />
                            ) : (
                                <motion.path
                                    key={`animated-${beam.index}-${animationKey}`}
                                    d={beam.d}
                                    pathLength={100}
                                    stroke={`url(#${gradientId})`}
                                    strokeWidth={pathWidth}
                                    strokeOpacity={1}
                                    strokeLinecap="round"
                                    strokeDasharray={`${dashLength} ${100 - dashLength}`}
                                    initial={{
                                        strokeDashoffset: beam.reverse
                                            ? -dashLength
                                            : 0,
                                    }}
                                    animate={{
                                        strokeDashoffset: animationDistance,
                                    }}
                                    transition={{
                                        delay: Math.max(0, beam.delay),
                                        duration: Math.max(0.1, beam.duration),
                                        ease: easingMap[easing],
                                        repeat: Infinity,
                                        repeatDelay: Math.max(0, repeatDelay),
                                    }}
                                    vectorEffect="non-scaling-stroke"
                                />
                            )}
                        </g>
                    )
                })}
            </svg>
        )
    }

    const cardStyleFor = (beam: BeamGeometry): React.CSSProperties => {
        const base: React.CSSProperties = {
            position: "absolute",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: cardBackground,
            color: cardTextColor,
            border: `${cardBorderWidth}px solid ${cardBorderColor}`,
            borderRadius: cardRadius,
            padding: `${cardPaddingY}px ${cardPaddingX}px`,
            fontSize,
            fontWeight,
            fontFamily:
                "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            zIndex: 3,
            boxSizing: "border-box",
            pointerEvents: "none",
        }

        base.left = beam.endX
        base.top = beam.endY

        if (mode === "converge" || orientation === "vertical") {
            base.transform = flipVertical
                ? "translate(-50%, 0%)"
                : "translate(-50%, -100%)"
        } else {
            base.transform = flipHorizontal
                ? "translate(0%, -50%)"
                : "translate(-100%, -50%)"
        }

        return base
    }

    const renderCard = (beam: BeamGeometry, index: number, prefix: string) => {
        const item = cards[index]

        if (!item || (!item.text && !item.icon)) {
            return null
        }

        const iconSrc = imageSrc(item.icon)

        return (
            <div key={`${prefix}-${index}`} style={cardStyleFor(beam)}>
                {iconSrc && (
                    <img
                        src={iconSrc}
                        alt=""
                        draggable={false}
                        style={{
                            width: cardIconSize,
                            height: cardIconSize,
                            objectFit: "contain",
                            flex: "none",
                            display: "block",
                        }}
                    />
                )}

                {item.text && <span>{item.text}</span>}
            </div>
        )
    }

    const meetX = flipHorizontal
        ? size.width * (1 - clamp(convergeX, 0, 1))
        : size.width * clamp(convergeX, 0, 1)

    const meetY = flipVertical
        ? size.height * (1 - clamp(convergeY, 0, 1))
        : size.height * clamp(convergeY, 0, 1)

    if (mode === "hub") {
        return (
            <div
                ref={containerRef}
                style={{
                    ...containerStyle,
                    padding,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                    }}
                >
                    {renderBeamSVG()}
                </div>

                <div
                    style={{
                        ...columnStyle,
                        position: "absolute",
                        left: padding,
                        top: padding,
                        bottom: padding,
                    }}
                >
                    {leftNodes.map((item, index) => (
                        <div
                            key={`left-${index}`}
                            ref={(element) => {
                                leftRefs.current[index] = element
                            }}
                            style={nodeStyle(nodeSize)}
                        >
                            {renderNodeContent(item, gradientStartColor)}
                        </div>
                    ))}
                </div>

                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 3,
                    }}
                >
                    <div ref={centerRef} style={nodeStyle(centerSize)}>
                        {renderNodeContent(
                            {
                                image: centerImage,
                            },
                            gradientStopColor
                        )}
                    </div>
                </div>

                <div
                    style={{
                        ...columnStyle,
                        position: "absolute",
                        right: padding,
                        top: padding,
                        bottom: padding,
                    }}
                >
                    {rightNodes.map((item, index) => (
                        <div
                            key={`right-${index}`}
                            ref={(element) => {
                                rightRefs.current[index] = element
                            }}
                            style={nodeStyle(nodeSize)}
                        >
                            {renderNodeContent(item, gradientStartColor)}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const meetIconSrc = imageSrc(meetIcon)

    return (
        <div ref={containerRef} style={containerStyle}>
            {renderBeamSVG()}

            {showCards &&
                beams.map((beam, index) =>
                    renderCard(
                        beam,
                        index,
                        mode === "converge" ? "converge-card" : "parallel-card"
                    )
                )}

            {mode === "converge" && meetIconSrc && (
                <div
                    style={{
                        position: "absolute",
                        left: meetX,
                        top: meetY,
                        transform: "translate(-50%, -50%)",
                        width: meetIconSize,
                        height: meetIconSize,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: meetIconBackground,
                        border: `${meetIconBorderWidth}px solid ${meetIconBorderColor}`,
                        borderRadius: meetIconRadius,
                        padding: meetIconPadding,
                        boxSizing: "border-box",
                        boxShadow: "0 0 20px -12px rgba(0,0,0,0.8)",
                        zIndex: 4,
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    <img
                        src={meetIconSrc}
                        alt=""
                        draggable={false}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            display: "block",
                        }}
                    />
                </div>
            )}
        </div>
    )
}

AnimatedBeamKarimSaif.defaultProps = DEFAULT_PROPS

const nodeControl = {
    type: ControlType.Object,
    controls: {
        image: {
            type: ControlType.ResponsiveImage,
            title: "Image",
            description:
                "Optional image or logo displayed inside this beam node.",
        },
    },
}

const cardControl = {
    type: ControlType.Object,
    controls: {
        text: {
            type: ControlType.String,
            title: "Text",
            defaultValue: "Label",
            description: "Text displayed inside the beam endpoint card.",
        },
        icon: {
            type: ControlType.ResponsiveImage,
            title: "Icon",
            description:
                "Optional image or logo displayed before the card text.",
        },
    },
}

addPropertyControls(AnimatedBeamKarimSaif, {
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        options: [
            "custom",
            "hubClassic",
            "hubNeon",
            "hubMinimal",
            "convergeClassic",
            "convergeNetwork",
            "convergeNeon",
            "parallelClassic",
            "parallelWave",
            "parallelMinimal",
        ],
        optionTitles: [
            "Custom",
            "Hub — Classic",
            "Hub — Neon",
            "Hub — Minimal",
            "Converge — Classic",
            "Converge — Network",
            "Converge — Neon",
            "Parallel — Classic",
            "Parallel — Wave",
            "Parallel — Minimal",
        ],
        defaultValue: "custom",
        description:
            "Loads a complete visual configuration. Choose Custom to edit the individual settings.",
    },

    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["hub", "converge", "parallel"],
        optionTitles: ["Hub & Spoke", "Converge", "Parallel"],
        defaultValue: "hub",
        description:
            "Selects the beam layout. Hub connects side nodes to a center, Converge brings lines to one point, and Parallel creates independent lines.",
    },

    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 200,
        defaultValue: 40,
        description: "Controls the inner spacing around the Hub node columns.",
        hidden: (p: Props) => p.mode !== "hub",
    },

    gap: {
        type: ControlType.Number,
        title: "Node Gap",
        min: 0,
        max: 120,
        defaultValue: 24,
        description: "Controls the spacing between nodes in each Hub column.",
        hidden: (p: Props) => p.mode !== "hub",
    },

    inset: {
        type: ControlType.Number,
        title: "Inset",
        min: 0,
        max: 300,
        defaultValue: 40,
        description:
            "Controls how far non-Hub beam endpoints are inset from the edges.",
        hidden: (p: Props) => p.mode === "hub",
    },

    nodeSize: {
        type: ControlType.Number,
        title: "Node Size",
        min: 24,
        max: 160,
        defaultValue: 48,
        description: "Sets the size of each Hub side node.",
        hidden: (p: Props) => p.mode !== "hub",
    },

    centerSize: {
        type: ControlType.Number,
        title: "Center Size",
        min: 24,
        max: 200,
        defaultValue: 64,
        description: "Sets the size of the central Hub node.",
        hidden: (p: Props) => p.mode !== "hub",
    },

    centerImage: {
        type: ControlType.ResponsiveImage,
        title: "Center Image",
        description:
            "Optional image or logo displayed inside the central Hub node.",
        hidden: (p: Props) => p.mode !== "hub",
    },

    leftNodes: {
        type: ControlType.Array,
        title: "Left Nodes",
        control: nodeControl,
        defaultValue: DEFAULT_LEFT,
        maxCount: 6,
        description: "Adds image nodes to the left side of the Hub.",
        hidden: (p: Props) => p.mode !== "hub",
    },

    rightNodes: {
        type: ControlType.Array,
        title: "Right Nodes",
        control: nodeControl,
        defaultValue: DEFAULT_RIGHT,
        maxCount: 6,
        description: "Adds image nodes to the right side of the Hub.",
        hidden: (p: Props) => p.mode !== "hub",
    },

    nodeBackground: {
        type: ControlType.Color,
        title: "Node BG",
        defaultValue: "#ffffff",
        description: "Controls the background color of Hub nodes.",
        hidden: (p: Props) => p.mode !== "hub",
    },

    nodeBorderColor: {
        type: ControlType.Color,
        title: "Node Border",
        defaultValue: "#e5e7eb",
        description: "Controls the border color of Hub nodes.",
        hidden: (p: Props) => p.mode !== "hub",
    },

    nodeBorderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        min: 0,
        max: 8,
        defaultValue: 2,
        description: "Controls the thickness of Hub node borders.",
        hidden: (p: Props) => p.mode !== "hub",
    },

    nodeRadius: {
        type: ControlType.Number,
        title: "Node Radius",
        min: 0,
        max: 999,
        defaultValue: 999,
        description: "Controls the corner radius of Hub nodes.",
        hidden: (p: Props) => p.mode !== "hub",
    },

    lineCount: {
        type: ControlType.Number,
        title: "Lines",
        min: 1,
        max: 12,
        step: 1,
        defaultValue: 6,
        description: "Controls the number of generated beam lines.",
        hidden: (p: Props) => p.mode === "hub",
    },

    convergeX: {
        type: ControlType.Number,
        title: "Meet X",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.5,
        description:
            "Controls the horizontal position of the Converge meeting point.",
        hidden: (p: Props) => p.mode !== "converge",
    },

    convergeY: {
        type: ControlType.Number,
        title: "Meet Y",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.92,
        description:
            "Controls the vertical position of the Converge meeting point.",
        hidden: (p: Props) => p.mode !== "converge",
    },

    bend: {
        type: ControlType.Number,
        title: "Bend",
        min: 0.1,
        max: 0.95,
        step: 0.05,
        defaultValue: 0.55,
        description:
            "Controls where Converge lines turn toward the meeting point.",
        hidden: (p: Props) => p.mode !== "converge",
    },

    flipVertical: {
        type: ControlType.Boolean,
        title: "Flip Vertical",
        defaultValue: false,
        description: "Mirrors the beam geometry vertically.",
        hidden: (p: Props) => p.mode === "hub",
    },

    flipHorizontal: {
        type: ControlType.Boolean,
        title: "Flip Horizontal",
        defaultValue: false,
        description: "Mirrors the beam geometry horizontally.",
        hidden: (p: Props) => p.mode === "hub",
    },

    meetIcon: {
        type: ControlType.ResponsiveImage,
        title: "Meet Icon",
        description: "Optional image displayed at the Converge meeting point.",
        hidden: (p: Props) => p.mode !== "converge",
    },

    meetIconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        min: 24,
        max: 160,
        defaultValue: 48,
        description: "Controls the size of the Converge meeting icon.",
        hidden: (p: Props) => p.mode !== "converge" || !p.meetIcon,
    },

    meetIconBackground: {
        type: ControlType.Color,
        title: "Icon BG",
        defaultValue: "#18181b",
        description:
            "Controls the background behind the Converge meeting icon.",
        hidden: (p: Props) => p.mode !== "converge" || !p.meetIcon,
    },

    meetIconBorderColor: {
        type: ControlType.Color,
        title: "Icon Border",
        defaultValue: "#3f3f46",
        description: "Controls the border color of the Converge meeting icon.",
        hidden: (p: Props) => p.mode !== "converge" || !p.meetIcon,
    },

    meetIconBorderWidth: {
        type: ControlType.Number,
        title: "Icon Border Width",
        min: 0,
        max: 6,
        defaultValue: 1,
        description: "Controls the thickness of the Converge icon border.",
        hidden: (p: Props) => p.mode !== "converge" || !p.meetIcon,
    },

    meetIconRadius: {
        type: ControlType.Number,
        title: "Icon Radius",
        min: 0,
        max: 999,
        defaultValue: 999,
        description:
            "Controls the corner radius of the Converge icon container.",
        hidden: (p: Props) => p.mode !== "converge" || !p.meetIcon,
    },

    meetIconPadding: {
        type: ControlType.Number,
        title: "Icon Padding",
        min: 0,
        max: 40,
        defaultValue: 10,
        description: "Controls the inner spacing around the Converge icon.",
        hidden: (p: Props) => p.mode !== "converge" || !p.meetIcon,
    },

    orientation: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
        description:
            "Controls whether Parallel beams run horizontally or vertically.",
        hidden: (p: Props) => p.mode !== "parallel",
    },

    curvature: {
        type: ControlType.Number,
        title: "Curvature",
        min: -200,
        max: 200,
        defaultValue: 0,
        description: "Controls the bend of Hub and Parallel beam paths.",
    },

    showCards: {
        type: ControlType.Boolean,
        title: "Cards",
        defaultValue: true,
        description:
            "Shows or hides endpoint cards in Converge and Parallel modes.",
        hidden: (p: Props) => p.mode === "hub",
    },

    cards: {
        type: ControlType.Array,
        title: "Card Labels",
        control: cardControl,
        maxCount: 12,
        defaultValue: DEFAULT_CARDS,
        description: "Creates text and icon cards attached to beam endpoints.",
        hidden: (p: Props) => p.mode === "hub" || !p.showCards,
    },

    cardBackground: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "#18181b",
        description: "Controls the background color of endpoint cards.",
        hidden: (p: Props) => p.mode === "hub" || !p.showCards,
    },

    cardTextColor: {
        type: ControlType.Color,
        title: "Card Text",
        defaultValue: "#fafafa",
        description: "Controls the text color of endpoint cards.",
        hidden: (p: Props) => p.mode === "hub" || !p.showCards,
    },

    cardBorderColor: {
        type: ControlType.Color,
        title: "Card Border",
        defaultValue: "#3f3f46",
        description: "Controls the border color of endpoint cards.",
        hidden: (p: Props) => p.mode === "hub" || !p.showCards,
    },

    cardBorderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        min: 0,
        max: 6,
        defaultValue: 1,
        description: "Controls the thickness of endpoint card borders.",
        hidden: (p: Props) => p.mode === "hub" || !p.showCards,
    },

    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        min: 0,
        max: 40,
        defaultValue: 10,
        description: "Controls the corner radius of endpoint cards.",
        hidden: (p: Props) => p.mode === "hub" || !p.showCards,
    },

    cardPaddingX: {
        type: ControlType.Number,
        title: "Card Pad X",
        min: 0,
        max: 40,
        defaultValue: 14,
        description: "Controls horizontal padding inside endpoint cards.",
        hidden: (p: Props) => p.mode === "hub" || !p.showCards,
    },

    cardPaddingY: {
        type: ControlType.Number,
        title: "Card Pad Y",
        min: 0,
        max: 40,
        defaultValue: 8,
        description: "Controls vertical padding inside endpoint cards.",
        hidden: (p: Props) => p.mode === "hub" || !p.showCards,
    },

    cardIconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        min: 10,
        max: 48,
        defaultValue: 18,
        description: "Controls the size of icons inside endpoint cards.",
        hidden: (p: Props) => p.mode === "hub" || !p.showCards,
    },

    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        min: 8,
        max: 32,
        defaultValue: 13,
        description: "Controls the text size of endpoint cards.",
        hidden: (p: Props) => p.mode === "hub" || !p.showCards,
    },

    fontWeight: {
        type: ControlType.Enum,
        title: "Font Weight",
        options: [400, 500, 600, 700],
        optionTitles: ["Regular", "Medium", "Semibold", "Bold"],
        defaultValue: 500,
        description: "Controls the weight of endpoint card text.",
        hidden: (p: Props) => p.mode === "hub" || !p.showCards,
    },

    pathColor: {
        type: ControlType.Color,
        title: "Track",
        defaultValue: "#9ca3af",
        description: "Controls the color of the static beam track.",
    },

    pathWidth: {
        type: ControlType.Number,
        title: "Line Width",
        min: 1,
        max: 16,
        defaultValue: 2,
        description:
            "Controls the thickness of the beam track and animated beam.",
    },

    pathOpacity: {
        type: ControlType.Number,
        title: "Track Opacity",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.2,
        description: "Controls the opacity of the static beam track.",
    },

    gradientStartColor: {
        type: ControlType.Color,
        title: "Gradient A",
        defaultValue: "#ffaa40",
        description: "Controls the first color of the animated beam gradient.",
    },

    gradientStopColor: {
        type: ControlType.Color,
        title: "Gradient B",
        defaultValue: "#9c40ff",
        description: "Controls the second color of the animated beam gradient.",
    },

    beamLength: {
        type: ControlType.Number,
        title: "Beam Length",
        min: 5,
        max: 90,
        step: 1,
        defaultValue: 22,
        description: "Controls the visible length of the moving gradient beam.",
        hidden: (p: Props) => p.mode === "hub",
    },

    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 1,
        max: 30,
        step: 0.5,
        defaultValue: 8,
        description: "Controls how long one complete beam sweep takes.",
    },

    delay: {
        type: ControlType.Number,
        title: "Delay",
        min: 0,
        max: 6,
        step: 0.1,
        defaultValue: 0,
        description: "Adds an initial delay before the beam animation starts.",
    },

    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        min: 0,
        max: 3,
        step: 0.1,
        defaultValue: 0.4,
        description:
            "Offsets the animation start time between consecutive beams.",
    },

    repeatDelay: {
        type: ControlType.Number,
        title: "Repeat Delay",
        min: 0,
        max: 10,
        step: 0.25,
        defaultValue: 0,
        description: "Adds a pause between repeated beam animation cycles.",
    },

    speedVariation: {
        type: ControlType.Number,
        title: "Speed Variation",
        min: 0,
        max: 3,
        step: 0.1,
        defaultValue: 0.5,
        description:
            "Adds controlled duration differences between individual beams.",
    },

    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["linear", "easeOut", "easeInOut", "expo"],
        optionTitles: ["Linear", "Ease Out", "Ease In-Out", "Expo"],
        defaultValue: "linear",
        description: "Controls the timing curve of each animated beam sweep.",
    },

    reverse: {
        type: ControlType.Boolean,
        title: "Reverse",
        defaultValue: false,
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})

export default AnimatedBeamKarimSaif
