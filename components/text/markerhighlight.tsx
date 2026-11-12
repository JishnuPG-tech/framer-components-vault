// @framerDisableUnlink

// Hand-drawn marker highlights that draw over keywords in a headline.
// Three shape modes: highlight block, underline, strike-through.
// Spring-based path animation with cursor-reactive tilt.

/**
 * Kern_MarkerHighlight
 * @version 1.0.0
 * @description Hand-drawn marker highlights with spring animation and cursor tilt
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 200
 */

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
    useMotionValue,
    useSpring,
} from "framer-motion"
import {
    useRef,
    useMemo,
    useState,
    useId,
    startTransition,
    useLayoutEffect,
    type CSSProperties,
    type RefObject,
    type FocusEvent,
    type KeyboardEvent,
} from "react"

type ShapeType = "highlight" | "underline" | "strike"
type TriggerType = "mount" | "scroll" | "hover"

interface HighlightItem {
    word: string
    shape: ShapeType
    color: string
}

interface TypographyGroup {
    fontSizeDesktop: number
    fontSizeTablet: number
    fontSizeMobile: number
    lineHeight: number
    letterSpacing: number
    textAlign: "left" | "center" | "right"
    fontStyle: Record<string, unknown>
}

interface AnimationGroup {
    trigger: TriggerType
    duration: number
    delay: number
    stagger: number
    repeatOnView: boolean
}

interface LayoutGroup {
    textColor: string
    backgroundColor: string
    paddingY: number
    paddingX: number
    maxWidth: number
}

interface CursorGroup {
    maxTilt: number
    influenceRadius: number
}

interface MarkerStyleGroup {
    strokeWidth: number
    roughness: number
    opacity: number
    rotation: number
    overflow: number
    verticalOffset: number
    markerHeight: number
    pathSeed: number
}

interface Props {
    text: string
    highlights: HighlightItem[]
    font: Record<string, unknown>
    ariaLabel: string
    animationFeel: "smooth" | "natural" | "snappy" | "bouncy"
    typography: TypographyGroup
    markerStyle: MarkerStyleGroup
    animation: AnimationGroup
    cursor?: CursorGroup
    layout: LayoutGroup
    style?: CSSProperties
}

const DEFAULT_HIGHLIGHTS: HighlightItem[] = [
    { word: "different", shape: "highlight", color: "#FFE34D" },
]

const SPRING_PRESETS = {
    smooth: { stiffness: 80, damping: 20, mass: 1.2 },
    natural: { stiffness: 120, damping: 18, mass: 1.0 },
    snappy: { stiffness: 200, damping: 22, mass: 0.8 },
    bouncy: { stiffness: 180, damping: 12, mass: 0.9 },
}

const fluidSize3 = (
    mobile: number,
    tablet: number,
    desktop: number
): string => {
    const mobileToTablet = `clamp(${mobile}px, calc(${mobile}px + (${tablet} - ${mobile}) * ((100vw - 390px) / 420)), ${tablet}px)`
    const tabletToDesktop = `clamp(${tablet}px, calc(${tablet}px + (${desktop} - ${tablet}) * ((100vw - 810px) / 390)), ${desktop}px)`
    return `clamp(${mobile}px, ${mobileToTablet}, ${tabletToDesktop})`
}

function getColorName(hex: string): string {
    const colorMap: Record<string, string> = {
        "#FFE34D": "yellow",
        "#FFD700": "gold",
        "#FFA500": "orange",
        "#FF6B9D": "pink",
        "#FF69B4": "hot pink",
        "#FF0000": "red",
        "#DC143C": "crimson",
        "#A8E6CF": "mint green",
        "#00FF00": "green",
        "#32CD32": "lime green",
        "#89CFF0": "sky blue",
        "#0000FF": "blue",
        "#4169E1": "royal blue",
        "#800080": "purple",
        "#9370DB": "medium purple",
        "#FFB347": "light orange",
        "#FFFFFF": "white",
        "#000000": "black",
        "#808080": "gray",
    }

    const upperHex = hex.toUpperCase()
    if (colorMap[upperHex]) return colorMap[upperHex]

    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)

    if (r > 200 && g > 200 && b < 100) return "yellow"
    if (r > 200 && g < 100 && b < 100) return "red"
    if (r < 100 && g > 200 && b < 100) return "green"
    if (r < 100 && g < 100 && b > 200) return "blue"
    if (r > 200 && g < 100 && b > 200) return "magenta"
    if (r < 100 && g > 200 && b > 200) return "cyan"
    if (r > 200 && g > 150 && b < 100) return "orange"
    if (r > 150 && g < 100 && b > 150) return "purple"

    return "colored"
}

function seededNoise(seed: number, x: number): number {
    const n = Math.sin(seed * 12.9898 + x * 78.233) * 43758.5453123
    return (n - Math.floor(n)) * 2 - 1
}

function jitter(
    base: number,
    position: number,
    seed: number,
    roughness: number,
    amplitude: number
): number {
    const noise1 = seededNoise(seed, position * 0.1)
    const noise2 = seededNoise(seed + 1, position * 0.3)
    const noise3 = seededNoise(seed + 2, position * 0.7)
    return (
        base +
        (noise1 * 0.6 + noise2 * 0.3 + noise3 * 0.1) * roughness * amplitude
    )
}

function pathHighlight(
    rough: number,
    overflow: number,
    seed: number,
    viewBoxHeight: number
): string[] {
    const r = rough
    const topY = viewBoxHeight * 0.38
    const bottomY = viewBoxHeight * 0.62
    const step = 15
    const topPoints: Array<{ x: number; y: number }> = []
    
    const baseLeft = 0
    const baseRight = 200
    
    const finalLeft = baseLeft - overflow
    const finalRight = baseRight + overflow
    
    topPoints.push({ x: finalLeft, y: topY })
    
    for (let x = finalLeft + step; x < finalRight; x += step)
        topPoints.push({ x, y: jitter(topY, x, seed, r, 3) })
    
    topPoints.push({ x: finalRight, y: topY })
    
    const bottomPoints: Array<{ x: number; y: number }> = []
    bottomPoints.push({ x: finalRight, y: bottomY })
    
    for (let x = finalRight - step; x > finalLeft; x -= step)
        bottomPoints.push({ x, y: jitter(bottomY, x, seed + 10, r, 3) })
    
    bottomPoints.push({ x: finalLeft, y: bottomY })
    
    let path = `M ${topPoints[0].x} ${topPoints[0].y}`
    for (let i = 1; i < topPoints.length - 1; i++) {
        const curr = topPoints[i]
        const next = topPoints[i + 1]
        const endX = (curr.x + next.x) / 2
        const endY = (curr.y + next.y) / 2
        path += ` Q ${curr.x} ${curr.y}, ${endX} ${endY}`
    }
    path += ` L ${topPoints[topPoints.length - 1].x} ${topPoints[topPoints.length - 1].y}`
    path += ` L ${bottomPoints[0].x} ${bottomPoints[0].y}`
    for (let i = 1; i < bottomPoints.length - 1; i++) {
        const curr = bottomPoints[i]
        const next = bottomPoints[i + 1]
        const endX = (curr.x + next.x) / 2
        const endY = (curr.y + next.y) / 2
        path += ` Q ${curr.x} ${curr.y}, ${endX} ${endY}`
    }
    path += ` L ${bottomPoints[bottomPoints.length - 1].x} ${bottomPoints[bottomPoints.length - 1].y} Z`
    return [path]
}

function pathUnderline(
    rough: number,
    overflow: number,
    seed: number,
    viewBoxHeight: number
): string[] {
    const r = rough
    const baseY = viewBoxHeight * 0.85
    const points: Array<{ x: number; y: number }> = []
    const step = 8
    
    const baseLeft = 0
    const baseRight = 200
    
    const finalLeft = baseLeft - overflow
    const finalRight = baseRight + overflow
    
    points.push({ x: finalLeft, y: baseY })
    
    for (let x = finalLeft + step; x < finalRight; x += step)
        points.push({ x, y: baseY + jitter(0, x, seed, r * 0.8, 3) })
    
    points.push({ x: finalRight, y: baseY })
    
    let path = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length - 1; i++) {
        const curr = points[i]
        const next = points[i + 1]
        path += ` Q ${curr.x} ${curr.y}, ${(curr.x + next.x) / 2} ${(curr.y + next.y) / 2}`
    }
    path += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`
    return [path]
}

function pathStrike(
    rough: number,
    overflow: number,
    seed: number,
    viewBoxHeight: number
): string[] {
    const r = rough
    const baseY = viewBoxHeight * 0.5
    const points: Array<{ x: number; y: number }> = []
    const step = 8
    
    const baseLeft = 0
    const baseRight = 200
    
    const finalLeft = baseLeft - overflow
    const finalRight = baseRight + overflow
    
    points.push({ x: finalLeft, y: baseY })
    
    for (let x = finalLeft + step; x < finalRight; x += step)
        points.push({ x, y: baseY + jitter(0, x, seed, r * 0.8, 3) })
    
    points.push({ x: finalRight, y: baseY })
    
    let path = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length - 1; i++) {
        const curr = points[i]
        const next = points[i + 1]
        path += ` Q ${curr.x} ${curr.y}, ${(curr.x + next.x) / 2} ${(curr.y + next.y) / 2}`
    }
    path += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`
    return [path]
}

function getPath(
    shape: ShapeType,
    rough: number,
    overflow: number,
    seed: number,
    viewBoxHeight: number
): string[] {
    if (shape === "highlight")
        return pathHighlight(rough, overflow, seed, viewBoxHeight)
    if (shape === "underline")
        return pathUnderline(rough, overflow, seed, viewBoxHeight)
    return pathStrike(rough, overflow, seed, viewBoxHeight)
}

function getPathLength(shape: ShapeType, overflow: number, roughness: number): number {
    if (shape === "highlight") return 0
    const baseWidth = 200
    const totalWidth = baseWidth + overflow * 2
    const curveAllowance = 2.0 + roughness * 0.5
    return totalWidth * curveAllowance
}

function useMouseTilt(
    ref: RefObject<SVGSVGElement>,
    baseRotation: number,
    maxTilt: number,
    influenceRadius: number,
    enabled: boolean,
    isInView: boolean,
    isStaticMode: boolean
) {
    const rotation = useMotionValue(baseRotation)
    const smooth = useSpring(rotation, {
        stiffness: 140,
        damping: 22,
        mass: 0.9,
    })

    useLayoutEffect(() => {
        rotation.set(baseRotation)
    }, [baseRotation, rotation])

    useLayoutEffect(() => {
        if (!enabled || !isInView || isStaticMode || typeof window === "undefined") return
        let rafId = 0
        let lastEvent: MouseEvent | null = null
        const update = () => {
            rafId = 0
            if (!lastEvent || !ref.current) return
            const rect = ref.current.getBoundingClientRect()
            const cx = rect.left + rect.width / 2
            const dx = lastEvent.clientX - cx
            const dist = Math.hypot(
                dx,
                lastEvent.clientY - (rect.top + rect.height / 2)
            )
            const influence = Math.max(0, 1 - dist / influenceRadius)
            const tilt = (dx / influenceRadius) * maxTilt * influence
            rotation.set(baseRotation + tilt)
        }
        const onMove = (e: MouseEvent) => {
            lastEvent = e
            if (!rafId) rafId = requestAnimationFrame(update)
        }
        const onLeave = () => rotation.set(baseRotation)
        window.addEventListener("mousemove", onMove, { passive: true })
        document.addEventListener("mouseleave", onLeave)
        return () => {
            window.removeEventListener("mousemove", onMove)
            document.removeEventListener("mouseleave", onLeave)
            if (rafId) cancelAnimationFrame(rafId)
        }
    }, [
        ref,
        baseRotation,
        maxTilt,
        influenceRadius,
        enabled,
        isInView,
        isStaticMode,
        rotation,
    ])

    return smooth
}

interface HighlightSegmentProps {
    item: HighlightItem
    idx: number
    word: string
    markerStyle: MarkerStyleGroup
    animationFeel: "smooth" | "natural" | "snappy" | "bouncy"
    animation: AnimationGroup
    cursor: CursorGroup
    fluidStrokeWidth: string
    isCanvas: boolean
    prefersReduced: boolean
    hasHoverSupport: boolean
    active: boolean
    hoveredIdx: number | null
    focusedIdx: number | null
    redrawCounters: Record<number, number>
    drawComplete: Record<number, boolean>
    isRedrawing: Record<number, boolean>
    isInView: boolean
    filterId: string
    motionAllowed: boolean
    isStaticMode: boolean
    onHoverStart: (idx: number) => void
    onHoverEnd: (idx: number) => void
    onFocus: (idx: number, e: FocusEvent<HTMLSpanElement>) => void
    onBlur: () => void
    onClick: (idx: number) => void
    onKeyDown: (e: KeyboardEvent<HTMLSpanElement>, idx: number) => void
    onAnimationComplete: (idx: number) => void
}

function HighlightSegment(props: HighlightSegmentProps) {
    const {
        item,
        idx,
        word,
        markerStyle,
        animationFeel,
        animation,
        cursor,
        fluidStrokeWidth,
        isCanvas,
        prefersReduced,
        hasHoverSupport,
        active,
        hoveredIdx,
        focusedIdx,
        redrawCounters,
        isRedrawing,
        isInView,
        filterId,
        motionAllowed,
        isStaticMode,
        onHoverStart,
        onHoverEnd,
        onFocus,
        onBlur,
        onClick,
        onKeyDown,
        onAnimationComplete,
    } = props

    const svgRef = useRef<SVGSVGElement>(null)
    const tiltEnabled =
        motionAllowed && !isCanvas && hasHoverSupport && !!cursor
    const tiltedRotation = useMouseTilt(
        svgRef,
        markerStyle.rotation,
        cursor?.maxTilt ?? 5,
        cursor?.influenceRadius ?? 280,
        tiltEnabled,
        isInView,
        isStaticMode
    )
    const itemDelay = animation.delay + idx * animation.stagger
    const viewBoxHeight = 100 * (markerStyle.markerHeight / 100)
    const pathD = getPath(
        item.shape,
        markerStyle.roughness,
        markerStyle.overflow,
        markerStyle.pathSeed,
        viewBoxHeight
    )
    const pathLen = getPathLength(item.shape, markerStyle.overflow, markerStyle.roughness)
    const redrawKey = redrawCounters[idx] ?? 0
    const isCurrentlyRedrawing = isRedrawing[idx] ?? false
    const transition = {
        type: "spring" as const,
        ...SPRING_PRESETS[animationFeel],
        delay: itemDelay,
    }
    const effectiveActive = motionAllowed ? active : true
    const isBehind = item.shape === "highlight"
    const isHovered = hoveredIdx === idx
    const isFocused = focusedIdx === idx
    const shouldBounce =
        motionAllowed &&
        hasHoverSupport &&
        isHovered &&
        animation.trigger !== "hover"

    const wordHandlers =
        animation.trigger === "hover"
            ? {
                  onMouseEnter: () => onHoverStart(idx),
                  onMouseLeave: () => onHoverEnd(idx),
                  onFocus: (e: FocusEvent<HTMLSpanElement>) => {
                      onHoverStart(idx)
                      onFocus(idx, e)
                  },
                  onBlur: () => {
                      onHoverEnd(idx)
                      onBlur()
                  },
                  onKeyDown: (e: KeyboardEvent<HTMLSpanElement>) =>
                      onKeyDown(e, idx),
                  tabIndex: 0,
                  role: "button" as const,
              }
            : {
                  onMouseEnter: hasHoverSupport
                      ? () => onHoverStart(idx)
                      : undefined,
                  onMouseLeave: hasHoverSupport
                      ? () => onHoverEnd(idx)
                      : undefined,
                  onFocus: (e: FocusEvent<HTMLSpanElement>) => onFocus(idx, e),
                  onBlur,
                  onClick: () => onClick(idx),
                  onKeyDown: (e: KeyboardEvent<HTMLSpanElement>) =>
                      onKeyDown(e, idx),
                  tabIndex: 0,
                  role: "button" as const,
              }

    const clipPathId = `clip-${filterId}-${idx}-${redrawKey}`
    const gradientId = `grad-${filterId}-${idx}-${redrawKey}`
    const tipGradientId = `tip-${filterId}-${idx}-${redrawKey}`
    const fluidEntryWidth = `calc(${fluidStrokeWidth} * 0.5)`

    return (
        <motion.span
            key={`h-${idx}-${item.word}-${redrawKey}`}
            {...wordHandlers}
            style={{
                position: "relative",
                display: "inline-block",
                zIndex: 1,
                cursor: "pointer",
                transformOrigin: "center bottom",
            }}
            initial={
                motionAllowed
                    ? {
                          scale: 1,
                          opacity: 1,
                      }
                    : undefined
            }
            animate={
                motionAllowed
                    ? {
                          scale: shouldBounce ? [1, 1.025, 1] : 1,
                          opacity: isCurrentlyRedrawing ? [1, 0.85, 1] : 1,
                      }
                    : undefined
            }
            transition={
                motionAllowed
                    ? {
                          scale: shouldBounce
                              ? {
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 18,
                                    mass: 0.8,
                                }
                              : { duration: 0 },
                          opacity: isCurrentlyRedrawing
                              ? { duration: 0.18 }
                              : { duration: 0 },
                      }
                    : undefined
            }
        >
            <motion.svg
                ref={svgRef}
                aria-hidden="true"
                viewBox={`${-markerStyle.overflow} 0 ${200 + markerStyle.overflow * 2} ${viewBoxHeight}`}
                preserveAspectRatio="none"
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    x: "-50%",
                    y: `calc(-50% + ${markerStyle.verticalOffset}%)`,
                    rotate: tiltEnabled ? tiltedRotation : markerStyle.rotation,
                    width: `calc(100% + ${markerStyle.overflow * 2}px)`,
                    height: `${markerStyle.markerHeight}%`,
                    overflow: "visible",
                    zIndex: isBehind ? 0 : 2,
                    pointerEvents: "none",
                    mixBlendMode: "multiply",
                    willChange:
                        motionAllowed && effectiveActive
                            ? "transform, opacity"
                            : "auto",
                    opacity: markerStyle.opacity,
                }}
            >
                <defs>
                    {item.shape === "highlight" && (
                        <>
                            <linearGradient
                                id={gradientId}
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="0%"
                            >
                                <stop offset="0%" stopOpacity="1" />
                                <stop offset="96%" stopOpacity="1" />
                                <stop offset="100%" stopOpacity="0" />
                            </linearGradient>
                            <clipPath id={clipPathId}>
                                <motion.rect
                                    x={-markerStyle.overflow}
                                    y={0}
                                    height={viewBoxHeight}
                                    fill={`url(#${gradientId})`}
                                    initial={{ width: motionAllowed && effectiveActive ? 0 : 200 + markerStyle.overflow * 2 }}
                                    animate={{ width: 200 + markerStyle.overflow * 2 }}
                                    transition={
                                        motionAllowed && effectiveActive ? transition : { duration: 0 }
                                    }
                                    onAnimationComplete={
                                        motionAllowed && effectiveActive
                                            ? (definition) => {
                                                  if (
                                                      typeof definition ===
                                                          "object" &&
                                                      definition !== null &&
                                                      "width" in definition
                                                  ) {
                                                      onAnimationComplete(idx)
                                                  }
                                              }
                                            : undefined
                                    }
                                />
                            </clipPath>
                        </>
                    )}
                    {(item.shape === "underline" ||
                        item.shape === "strike") && (
                        <linearGradient
                            id={tipGradientId}
                            gradientUnits="userSpaceOnUse"
                            x1={-markerStyle.overflow}
                            y1="0"
                            x2={200 + markerStyle.overflow}
                            y2="0"
                        >
                            <stop
                                offset="0"
                                stopColor={item.color}
                                stopOpacity="0.85"
                            />
                            <stop
                                offset="0.05"
                                stopColor={item.color}
                                stopOpacity="1"
                            />
                            <stop
                                offset="0.95"
                                stopColor={item.color}
                                stopOpacity="1"
                            />
                            <stop
                                offset="1"
                                stopColor={item.color}
                                stopOpacity="0.85"
                            />
                        </linearGradient>
                    )}
                </defs>
                {item.shape === "highlight" ? (
                    <path
                        d={pathD[0]}
                        fill={item.color}
                        stroke="none"
                        clipPath={`url(#${clipPathId})`}
                    />
                ) : (
                    pathD.map((d, pathIdx) => (
                        <motion.path
                            key={`path-${pathIdx}`}
                            d={d}
                            fill="none"
                            stroke={`url(#${tipGradientId})`}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{
                                strokeDashoffset: motionAllowed && effectiveActive ? pathLen : 0,
                                strokeWidth: motionAllowed && effectiveActive
                                    ? fluidEntryWidth
                                    : fluidStrokeWidth,
                            }}
                            animate={{
                                strokeDashoffset: 0,
                                strokeWidth: fluidStrokeWidth,
                            }}
                            transition={
                                motionAllowed && effectiveActive
                                    ? {
                                          strokeDashoffset: {
                                              ...transition,
                                              delay: itemDelay + pathIdx * 0.08,
                                          },
                                          strokeWidth: {
                                              type: "spring" as const,
                                              stiffness: 45,
                                              damping: 18,
                                              mass: 1.2,
                                              delay: itemDelay + pathIdx * 0.08,
                                          },
                                      }
                                    : { duration: 0 }
                            }
                            style={{
                                strokeDasharray: pathLen,
                                vectorEffect: "non-scaling-stroke",
                                willChange:
                                    motionAllowed && effectiveActive
                                        ? "transform"
                                        : "auto",
                            }}
                            onAnimationComplete={
                                motionAllowed &&
                                effectiveActive &&
                                pathIdx === pathD.length - 1
                                    ? (definition) => {
                                          if (
                                              typeof definition === "object" &&
                                              definition !== null &&
                                              "strokeDashoffset" in definition
                                          ) {
                                              onAnimationComplete(idx)
                                          }
                                      }
                                    : undefined
                            }
                        />
                    ))
                )}
            </motion.svg>
            <span style={{ position: "relative", zIndex: 1 }}>{word}</span>

            {isFocused && (
                <motion.span
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        bottom: "-4px",
                        left: 0,
                        right: 0,
                        height: "2px",
                        backgroundColor: item.color,
                        transformOrigin: "left",
                        pointerEvents: "none",
                    }}
                    initial={{ scaleX: motionAllowed ? 0 : 1 }}
                    animate={motionAllowed ? { scaleX: 1 } : undefined}
                    exit={motionAllowed ? { scaleX: 0 } : undefined}
                    transition={
                        motionAllowed
                            ? { type: "spring", stiffness: 400, damping: 20 }
                            : undefined
                    }
                />
            )}

            <span
                style={{
                    position: "absolute",
                    width: "1px",
                    height: "1px",
                    padding: 0,
                    margin: "-1px",
                    overflow: "hidden",
                    clip: "rect(0, 0, 0, 0)",
                    whiteSpace: "nowrap",
                    border: 0,
                }}
            >
                {item.shape === "highlight" &&
                    `, highlighted in ${getColorName(item.color)}`}
                {item.shape === "underline" &&
                    `, underlined in ${getColorName(item.color)}`}
                {item.shape === "strike" &&
                    `, crossed out in ${getColorName(item.color)}`}
            </span>
        </motion.span>
    )
}

export default function Kern_MarkerHighlight(props: Partial<Props>) {
    const {
        text = "make something different",
        highlights = DEFAULT_HIGHLIGHTS,
        font = {},
        ariaLabel = "",
        animationFeel = "natural",
        style,
    } = props

    const markerStyle = props.markerStyle ?? {
        strokeWidth: 85,
        roughness: 0.25,
        opacity: 1.0,
        rotation: -2,
        overflow: 2,
        verticalOffset: 0,
        markerHeight: 160,
        pathSeed: 42,
    }

    const typography = props.typography ?? {
        fontSizeDesktop: 72,
        fontSizeTablet: 52,
        fontSizeMobile: 32,
        lineHeight: 1.2,
        letterSpacing: -0.02,
        textAlign: "center" as const,
        fontStyle: {
            fontWeight: 600,
            fontStyle: "normal",
        },
    }

    const animation = props.animation ?? {
        trigger: "scroll" as const,
        duration: 0.8,
        delay: 0.3,
        stagger: 0.2,
        repeatOnView: false,
    }

    const layout = props.layout ?? {
        textColor: "#1a1a1a",
        backgroundColor: "transparent",
        paddingY: 48,
        paddingX: 32,
        maxWidth: 1100,
    }

    const cursor = props.cursor ?? undefined

    const isCanvas = useIsOnFramerCanvas()
    const isStaticRenderer = useIsStaticRenderer()
    const prefersReduced = useReducedMotion() ?? false
    const isStaticMode = isCanvas || isStaticRenderer
    const motionAllowed = !isStaticMode && !prefersReduced
    
    const reactId = useId()
    const filterId = `marker-${reactId.replace(/:/g, "")}`
    const containerRef = useRef<HTMLDivElement>(null)

    const [isInView, setIsInView] = useState<boolean>(
        isStaticMode ? true : false
    )
    useLayoutEffect(() => {
        if (isStaticMode) {
            startTransition(() => setIsInView(true))
            return
        }
        
        if (
            typeof window === "undefined" ||
            typeof IntersectionObserver === "undefined"
        ) {
            startTransition(() => setIsInView(true))
            return
        }
        const node = containerRef.current
        if (!node) return
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (!entry) return
                const visible =
                    entry.isIntersecting && entry.intersectionRatio >= 0.4
                startTransition(() =>
                    setIsInView((prev) => (prev !== visible ? visible : prev))
                )
                if (visible && !animation.repeatOnView) observer.disconnect()
            },
            { threshold: [0, 0.4, 1] }
        )
        observer.observe(node)
        return () => observer.disconnect()
    }, [isStaticMode, animation.repeatOnView])

    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
    const [focusedIdx, setFocusedIdx] = useState<number | null>(null)
    const [redrawCounters, setRedrawCounters] = useState<
        Record<number, number>
    >({})
    const [drawComplete, setDrawComplete] = useState<Record<number, boolean>>(
        {}
    )
    const [hasHoverSupport, setHasHoverSupport] = useState(false)
    const [isRedrawing, setIsRedrawing] = useState<Record<number, boolean>>({})
    const clickTimeoutsRef = useRef<
        Record<number, ReturnType<typeof setTimeout>>
    >({})
    const previousTextRef = useRef<string>(text)
    const [announceText, setAnnounceText] = useState<string>("")

    useLayoutEffect(() => {
        if (previousTextRef.current !== text) {
            startTransition(() => setAnnounceText(text))
            previousTextRef.current = text
        }
    }, [text])

    useLayoutEffect(
        () => () =>
            Object.values(clickTimeoutsRef.current).forEach((t) =>
                clearTimeout(t)
            ),
        []
    )

    useLayoutEffect(() => {
        if (isStaticMode || typeof window === "undefined") {
            startTransition(() => setHasHoverSupport(false))
            return
        }
        const mediaQuery = window.matchMedia("(hover: hover)")
        startTransition(() => setHasHoverSupport(mediaQuery.matches))
        const handleChange = (e: MediaQueryListEvent) =>
            startTransition(() => setHasHoverSupport(e.matches))
        mediaQuery.addEventListener("change", handleChange)
        return () => mediaQuery.removeEventListener("change", handleChange)
    }, [isStaticMode])

    const segments = useMemo(() => {
        try {
            if (!text) return []
            const lowerText = text.toLowerCase()
            const matches: Array<{
                start: number
                end: number
                item: HighlightItem
            }> = []
            highlights.forEach((item) => {
                if (!item.word) return
                const word = item.word.toLowerCase()
                let idx = lowerText.indexOf(word)
                while (idx !== -1) {
                    const overlap = matches.some(
                        (m) =>
                            (idx >= m.start && idx < m.end) ||
                            (idx + word.length > m.start &&
                                idx + word.length <= m.end)
                    )
                    if (!overlap)
                        matches.push({
                            start: idx,
                            end: idx + word.length,
                            item,
                        })
                    idx = lowerText.indexOf(word, idx + word.length)
                }
            })
            matches.sort((a, b) => a.start - b.start)
            const result: Array<
                | { type: "plain"; text: string }
                | {
                      type: "highlight"
                      text: string
                      item: HighlightItem
                      index: number
                  }
            > = []
            let textCursor = 0
            let hIndex = 0
            matches.forEach((m) => {
                if (m.start > textCursor)
                    result.push({
                        type: "plain",
                        text: text.slice(textCursor, m.start),
                    })
                result.push({
                    type: "highlight",
                    text: text.slice(m.start, m.end),
                    item: m.item,
                    index: hIndex++,
                })
                textCursor = m.end
            })
            if (textCursor < text.length)
                result.push({ type: "plain", text: text.slice(textCursor) })
            return result
        } catch {
            return [{ type: "plain", text }]
        }
    }, [text, highlights])

    const handleHoverStart = (idx: number) =>
        startTransition(() => setHoveredIdx(idx))
    const handleHoverEnd = (_idx: number) =>
        startTransition(() => setHoveredIdx(null))
    const handleFocus = (idx: number, e: FocusEvent<HTMLSpanElement>) => {
        if (typeof window === "undefined") return
        try {
            if (e.target.matches(":focus-visible"))
                startTransition(() => setFocusedIdx(idx))
        } catch {
            startTransition(() => setFocusedIdx(idx))
        }
    }
    const handleBlur = () => startTransition(() => setFocusedIdx(null))

    const handleClick = (idx: number) => {
        if (isStaticMode) return
        if (clickTimeoutsRef.current[idx])
            clearTimeout(clickTimeoutsRef.current[idx])
        startTransition(() => {
            setRedrawCounters((prev) => ({
                ...prev,
                [idx]: (prev[idx] ?? 0) + 1,
            }))
            setDrawComplete((prev) => ({ ...prev, [idx]: false }))
            setIsRedrawing((prev) => ({ ...prev, [idx]: true }))
        })
        clickTimeoutsRef.current[idx] = setTimeout(
            () => {
                startTransition(() =>
                    setIsRedrawing((prev) => ({ ...prev, [idx]: false }))
                )
                delete clickTimeoutsRef.current[idx]
            },
            (animation.delay + idx * animation.stagger + animation.duration) *
                1000 +
                180
        )
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLSpanElement>, idx: number) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleClick(idx)
        }
    }

    const handleAnimationComplete = (idx: number) =>
        startTransition(() =>
            setDrawComplete((prev) => ({ ...prev, [idx]: true }))
        )

    const resolveActive = (idx: number): boolean => {
        if (isStaticMode) return true
        if (animation.trigger === "mount") return true
        if (animation.trigger === "scroll") return isInView
        if (animation.trigger === "hover") return hoveredIdx === idx
        return false
    }

    const fluidFontSize = fluidSize3(
        typography.fontSizeMobile,
        typography.fontSizeTablet,
        typography.fontSizeDesktop
    )
    const fluidStrokeWidth = fluidSize3(
        markerStyle.strokeWidth * 0.4,
        markerStyle.strokeWidth * 0.7,
        markerStyle.strokeWidth
    )

    const rootStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: `${layout.paddingY}px ${layout.paddingX}px`,
        backgroundColor: layout.backgroundColor,
        color: layout.textColor,
        fontSize: fluidFontSize,
        lineHeight: typography.lineHeight,
        letterSpacing: `${typography.letterSpacing}em`,
        textAlign: typography.textAlign,
        ...(typography.fontStyle as CSSProperties),
        position: "relative",
        ...(font as CSSProperties),
        ...style,
    }

    return (
        <div
            ref={containerRef}
            role="region"
            aria-label={ariaLabel || text}
            style={rootStyle}
        >
            <span
                role="status"
                aria-live="polite"
                style={{
                    position: "absolute",
                    width: "1px",
                    height: "1px",
                    padding: 0,
                    margin: "-1px",
                    overflow: "hidden",
                    clip: "rect(0, 0, 0, 0)",
                    whiteSpace: "nowrap",
                    border: 0,
                }}
            >
                {announceText}
            </span>
            <div
                style={{
                    maxWidth: `${layout.maxWidth}px`,
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {segments.map((seg, i) => {
                    if (seg.type === "plain")
                        return <span key={`p-${i}`}>{seg.text}</span>
                    return (
                        <HighlightSegment
                            key={`h-${seg.index}-${seg.item.word}-${redrawCounters[seg.index] ?? 0}`}
                            item={seg.item}
                            idx={seg.index}
                            word={seg.text}
                            markerStyle={markerStyle}
                            animationFeel={animationFeel}
                            animation={animation}
                            cursor={cursor}
                            fluidStrokeWidth={fluidStrokeWidth}
                            isCanvas={isCanvas}
                            prefersReduced={prefersReduced}
                            hasHoverSupport={hasHoverSupport}
                            active={resolveActive(seg.index)}
                            hoveredIdx={hoveredIdx}
                            focusedIdx={focusedIdx}
                            redrawCounters={redrawCounters}
                            drawComplete={drawComplete}
                            isRedrawing={isRedrawing}
                            isInView={isInView}
                            filterId={filterId}
                            motionAllowed={motionAllowed}
                            isStaticMode={isStaticMode}
                            onHoverStart={handleHoverStart}
                            onHoverEnd={handleHoverEnd}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            onClick={handleClick}
                            onKeyDown={handleKeyDown}
                            onAnimationComplete={handleAnimationComplete}
                        />
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(Kern_MarkerHighlight, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "make something different",
        displayTextArea: true,
        description: "Headline with highlighted keywords",
    },
    highlights: {
        type: ControlType.Array,
        title: "Highlights",
        control: {
            type: ControlType.Object,
            controls: {
                word: {
                    type: ControlType.String,
                    title: "Word",
                    defaultValue: "different",
                    description: "Target word to mark",
                },
                shape: {
                    type: ControlType.Enum,
                    title: "Shape",
                    defaultValue: "highlight",
                    options: ["highlight", "underline", "strike"],
                    optionTitles: ["Highlight", "Underline", "Strike"],
                    displaySegmentedControl: true,
                    description: "Marker shape style",
                },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#FFE34D",
                    description: "Marker color",
                },
            },
        },
        defaultValue: DEFAULT_HIGHLIGHTS,
        maxCount: 10,
        description: "Words to highlight with marker effects",
    },
    typography: {
        type: ControlType.Object,
        title: "Typography",
        buttonTitle: "Text Style",
        icon: "effect",
        controls: {
            fontSizeDesktop: {
                type: ControlType.Number,
                title: "Desktop",
                defaultValue: 72,
                min: 12,
                max: 200,
                step: 1,
                unit: "px",
                displayStepper: true,
                description: "Desktop font size",
            },
            fontSizeTablet: {
                type: ControlType.Number,
                title: "Tablet",
                defaultValue: 52,
                min: 12,
                max: 200,
                step: 1,
                unit: "px",
                displayStepper: true,
                description: "Tablet font size",
            },
            fontSizeMobile: {
                type: ControlType.Number,
                title: "Mobile",
                defaultValue: 32,
                min: 12,
                max: 200,
                step: 1,
                unit: "px",
                displayStepper: true,
                description: "Mobile font size",
            },
            fontStyle: {
                type: ControlType.Font,
                title: "Weight & Style",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    variant: "Semibold",
                },
                description: "Font weight and style",
            },
            lineHeight: {
                type: ControlType.Number,
                title: "Line Height",
                defaultValue: 1.2,
                min: 0.8,
                max: 2.5,
                step: 0.1,
                displayStepper: true,
                description: "Line height multiplier",
            },
            letterSpacing: {
                type: ControlType.Number,
                title: "Letter Spacing",
                defaultValue: -0.02,
                min: -0.1,
                max: 0.2,
                step: 0.01,
                unit: "em",
                displayStepper: true,
                description: "Letter spacing",
            },
            textAlign: {
                type: ControlType.Enum,
                title: "Alignment",
                defaultValue: "center",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                displaySegmentedControl: true,
                description: "Text alignment",
            },
        },
        description: "Responsive typography settings",
    },
    markerStyle: {
        type: ControlType.Object,
        title: "Marker Style",
        buttonTitle: "Marker",
        icon: "color",
        controls: {
            strokeWidth: {
                type: ControlType.Number,
                title: "Thickness",
                defaultValue: 85,
                min: 10,
                max: 200,
                step: 5,
                unit: "px",
                displayStepper: true,
                description: "Stroke thickness",
            },
            roughness: {
                type: ControlType.Number,
                title: "Roughness",
                defaultValue: 0.25,
                min: 0,
                max: 5,
                step: 0.05,
                displayStepper: true,
                description: "Hand-drawn irregularity",
            },
            opacity: {
                type: ControlType.Number,
                title: "Opacity",
                defaultValue: 1.0,
                min: 0.1,
                max: 1,
                step: 0.05,
                displayStepper: true,
                description: "Marker transparency",
            },
            rotation: {
                type: ControlType.Number,
                title: "Rotation",
                defaultValue: -2,
                min: -15,
                max: 15,
                step: 0.5,
                unit: "deg",
                displayStepper: true,
                description: "Base tilt angle",
            },
            overflow: {
                type: ControlType.Number,
                title: "Edge Bleed",
                defaultValue: 2,
                min: 0,
                max: 6,
                step: 0.5,
                unit: "px",
                displayStepper: true,
                description: "Symmetric edge extension",
            },
            verticalOffset: {
                type: ControlType.Number,
                title: "Vertical Offset",
                defaultValue: 0,
                min: -50,
                max: 50,
                step: 1,
                unit: "%",
                displayStepper: true,
                description: "Vertical alignment",
            },
            markerHeight: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: 160,
                min: 50,
                max: 300,
                step: 10,
                unit: "%",
                displayStepper: true,
                description: "Marker coverage height",
            },
            pathSeed: {
                type: ControlType.Number,
                title: "Path Seed",
                defaultValue: 42,
                min: 1,
                max: 999,
                step: 1,
                displayStepper: true,
                description: "Random seed for path shape",
            },
        },
        description: "Hand-drawn marker appearance",
    },
    animation: {
        type: ControlType.Object,
        title: "Animation",
        buttonTitle: "Timing",
        icon: "interaction",
        controls: {
            trigger: {
                type: ControlType.Enum,
                title: "Trigger",
                defaultValue: "scroll",
                options: ["mount", "scroll", "hover"],
                optionTitles: ["Mount", "Scroll", "Hover"],
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
                description: "Activation mode",
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 0.8,
                min: 0.1,
                max: 3,
                step: 0.1,
                unit: "s",
                displayStepper: true,
                description: "Draw duration",
            },
            delay: {
                type: ControlType.Number,
                title: "Delay",
                defaultValue: 0.3,
                min: 0,
                max: 2,
                step: 0.1,
                unit: "s",
                displayStepper: true,
                description: "Initial delay",
            },
            stagger: {
                type: ControlType.Number,
                title: "Stagger",
                defaultValue: 0.2,
                min: 0,
                max: 1,
                step: 0.05,
                unit: "s",
                displayStepper: true,
                description: "Delay between highlights",
            },
            repeatOnView: {
                type: ControlType.Boolean,
                title: "Repeat On View",
                defaultValue: false,
                enabledTitle: "Yes",
                disabledTitle: "No",
                description: "Replay when re-entering viewport",
            },
        },
        description: "Draw animation timing",
    },
    animationFeel: {
        type: ControlType.Enum,
        title: "Spring Feel",
        defaultValue: "natural",
        options: ["smooth", "natural", "snappy", "bouncy"],
        optionTitles: ["Smooth", "Natural", "Snappy", "Bouncy"],
        displaySegmentedControl: true,
        description: "Spring physics profile",
    },
    cursor: {
        type: ControlType.Object,
        title: "Cursor Tilt",
        buttonTitle: "Tilt",
        icon: "interaction",
        optional: true,
        controls: {
            maxTilt: {
                type: ControlType.Number,
                title: "Max Tilt",
                defaultValue: 5,
                min: 0,
                max: 20,
                step: 1,
                unit: "deg",
                displayStepper: true,
                description: "Maximum tilt angle",
            },
            influenceRadius: {
                type: ControlType.Number,
                title: "Influence Radius",
                defaultValue: 280,
                min: 50,
                max: 500,
                step: 10,
                unit: "px",
                displayStepper: true,
                description: "Cursor influence distance",
            },
        },
        description: "Cursor-reactive tilt",
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        buttonTitle: "Container",
        icon: "object",
        controls: {
            textColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#1a1a1a",
                description: "Headline text color",
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(0,0,0,0)",
                description: "Component background",
            },
            paddingY: {
                type: ControlType.Number,
                title: "Padding Y",
                defaultValue: 48,
                min: 0,
                max: 200,
                step: 4,
                unit: "px",
                displayStepper: true,
                description: "Vertical padding",
            },
            paddingX: {
                type: ControlType.Number,
                title: "Padding X",
                defaultValue: 32,
                min: 0,
                max: 200,
                step: 4,
                unit: "px",
                displayStepper: true,
                description: "Horizontal padding",
            },
            maxWidth: {
                type: ControlType.Number,
                title: "Max Width",
                defaultValue: 1100,
                min: 300,
                max: 2000,
                step: 50,
                unit: "px",
                displayStepper: true,
                description: "Maximum content width",
            },
        },
        description: "Container spacing and dimensions",
    },
    font: {
        type: ControlType.Font,
        title: "Font Override",
        controls: "extended",
        defaultFontType: "sans-serif",
        description: "Global font family override",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "",
        description: "Custom accessibility label",
    },
})