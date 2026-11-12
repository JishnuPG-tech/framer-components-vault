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
    type CSSProperties,
    type PointerEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"

const VIEWBOX_WIDTH = 996
const VIEWBOX_HEIGHT = 330

const DEFAULT_PATH =
    "M1 209.434C58.5872 255.935 387.926 325.938 482.583 209.434C600.905 63.8051 525.516 -43.2211 427.332 19.9613C329.149 83.1436 352.902 242.723 515.041 267.302C644.752 286.966 943.56 181.94 995 156.5"

const PATH_PRESETS = {
    wave: DEFAULT_PATH,
    loop: "M17 166C95 30 306 28 371 161C438 298 212 315 269 137C325 -41 661 15 604 188C551 349 842 304 979 125",
    orbit: "M53 166C118 56 285 42 403 114C527 190 476 310 335 286C184 260 153 94 319 45C534 -18 762 31 884 130C1024 243 864 331 687 273C535 224 552 102 721 82C832 69 925 101 979 158",
    rise: "M20 270C154 242 189 91 327 78C467 65 475 262 620 249C764 236 788 57 977 45",
} as const

type PathPreset = keyof typeof PATH_PRESETS | "custom"
type Direction = "forward" | "reverse"
type ObjectFit = "cover" | "contain"
type ReduceMotionBehavior = "pause" | "slow"

type ResponsiveImage = {
    src?: string
    srcSet?: string
    alt?: string
}

type MarqueeItem = {
    image?: string | ResponsiveImage
    label?: string
    alt?: string
}

type Position = {
    x: number
    y: number
}

interface MarqueeAlongPathProps {
    items?: MarqueeItem[]
    images?: string[]
    speed?: number
    direction?: Direction
    repeat?: number
    slowdownOnHover?: boolean
    dragToScrub?: boolean
    reduceMotion?: ReduceMotionBehavior
    startOffset?: number
    showPath?: boolean
    pathPreset?: PathPreset
    pathD?: string
    pathColor?: string
    pathOpacity?: number
    pathDash?: string
    pathStrokeWidth?: number
    itemSize?: number
    itemRadius?: number
    itemShadow?: boolean
    itemBorder?: boolean
    itemBorderColor?: string
    objectFit?: ObjectFit
    hoverScale?: number
    showLabels?: boolean
    labelColor?: string
    labelBackground?: string
    backgroundColor?: string
    ariaLabel?: string
    style?: CSSProperties
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function wrapLength(value: number, total: number) {
    if (total <= 0) return 0
    return ((value % total) + total) % total
}

function cardDataUri(label: string, colorA: string, colorB: string) {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
            <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="${colorA}" />
                    <stop offset="1" stop-color="${colorB}" />
                </linearGradient>
                <radialGradient id="r" cx=".35" cy=".25" r=".72">
                    <stop offset="0" stop-color="rgba(255,255,255,.76)" />
                    <stop offset=".55" stop-color="rgba(255,255,255,.1)" />
                    <stop offset="1" stop-color="rgba(255,255,255,0)" />
                </radialGradient>
            </defs>
            <rect width="240" height="240" rx="32" fill="url(#g)" />
            <circle cx="62" cy="50" r="118" fill="url(#r)" />
            <path d="M34 164C72 124 104 211 148 165C186 125 197 77 222 94" fill="none" stroke="rgba(255,255,255,.62)" stroke-width="14" stroke-linecap="round" />
            <text x="30" y="54" fill="rgba(255,255,255,.86)" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700">${label}</text>
        </svg>
    `

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const DEFAULT_ITEMS: MarqueeItem[] = [
    {
        label: "01",
        alt: "Coral abstract gradient card",
        image: {
            src: cardDataUri("01", "#ff7a59", "#541388"),
            alt: "Coral abstract gradient card",
        },
    },
    {
        label: "02",
        alt: "Blue abstract gradient card",
        image: {
            src: cardDataUri("02", "#00b8d9", "#172b4d"),
            alt: "Blue abstract gradient card",
        },
    },
    {
        label: "03",
        alt: "Lime abstract gradient card",
        image: {
            src: cardDataUri("03", "#b7f34b", "#005f73"),
            alt: "Lime abstract gradient card",
        },
    },
    {
        label: "04",
        alt: "Pink abstract gradient card",
        image: {
            src: cardDataUri("04", "#ff4ecd", "#1d1b67"),
            alt: "Pink abstract gradient card",
        },
    },
    {
        label: "05",
        alt: "Amber abstract gradient card",
        image: {
            src: cardDataUri("05", "#f6c85f", "#d1495b"),
            alt: "Amber abstract gradient card",
        },
    },
    {
        label: "06",
        alt: "Green abstract gradient card",
        image: {
            src: cardDataUri("06", "#2dd4bf", "#164e63"),
            alt: "Green abstract gradient card",
        },
    },
]

function normalizeItem(item: MarqueeItem, index: number) {
    const image = item.image
    const label = item.label || `${index + 1}`.padStart(2, "0")

    if (typeof image === "string") {
        return {
            src: image,
            srcSet: undefined,
            alt: item.alt || label,
            label,
        }
    }

    return {
        src: image?.src || "",
        srcSet: image?.srcSet,
        alt: item.alt || image?.alt || label,
        label,
    }
}

function usePrefersReducedMotion() {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return

        const media = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setPrefersReducedMotion(media.matches)

        update()

        if (media.addEventListener) {
            media.addEventListener("change", update)
            return () => media.removeEventListener("change", update)
        }

        media.addListener(update)
        return () => media.removeListener(update)
    }, [])

    return prefersReducedMotion
}

/**
 * Marquee Along Path
 *
 * A responsive image marquee that follows an editable SVG path.
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 360
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function MarqueeAlongPath(props: MarqueeAlongPathProps) {
    const {
        items,
        images,
        speed = 0.8,
        direction = "forward",
        repeat = 2,
        slowdownOnHover = true,
        dragToScrub = true,
        reduceMotion = "pause",
        startOffset = 0,
        showPath = true,
        pathPreset = "wave",
        pathD = DEFAULT_PATH,
        pathColor = "#d4d4d8",
        pathOpacity = 0.72,
        pathDash = "4 6",
        pathStrokeWidth = 1,
        itemSize = 72,
        itemRadius = 12,
        itemShadow = true,
        itemBorder = false,
        itemBorderColor = "rgba(255, 255, 255, 0.65)",
        objectFit = "cover",
        hoverScale = 1.18,
        showLabels = false,
        labelColor = "#ffffff",
        labelBackground = "rgba(0, 0, 0, 0.42)",
        backgroundColor = "transparent",
        ariaLabel = "Animated image marquee following an SVG path",
        style,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const pathRef = useRef<SVGPathElement>(null)
    const fallbackPathRef = useRef<SVGPathElement>(null)
    const offsetRef = useRef(0)
    const velocityRef = useRef(0)
    const totalLengthRef = useRef(0)
    const hoverRef = useRef(false)
    const draggingRef = useRef(false)
    const lastPointerXRef = useRef(0)
    const updatePositionsRef = useRef<() => void>(() => {})
    const sizeRef = useRef({ width: 900, height: 360 })
    const rafRef = useRef(0)
    const layoutKeyRef = useRef("")

    const [positions, setPositions] = useState<Position[]>([])
    const [isScrubbing, setIsScrubbing] = useState(false)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [usingFallbackPath, setUsingFallbackPath] = useState(false)
    const [isInViewport, setIsInViewport] = useState(false)

    const isStatic = useIsStaticRenderer()
    const prefersReducedMotion = usePrefersReducedMotion()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const sourceItems = useMemo<MarqueeItem[]>(() => {
        if (Array.isArray(items)) return items
        if (images && images.length > 0) {
            return images.map((src, index) => ({
                image: src,
                label: `${index + 1}`.padStart(2, "0"),
                alt: `Marquee item ${index + 1}`,
            }))
        }
        return DEFAULT_ITEMS
    }, [images, items])

    const safeRepeat = clamp(Math.round(repeat), 1, 8)
    const normalizedItems = useMemo(() => {
        const repeatedItems = Array.from({ length: safeRepeat }, () => sourceItems).flat()
        return repeatedItems.map((item, index) => normalizeItem(item, index))
    }, [safeRepeat, sourceItems])

    const itemsKey = useMemo(
        () =>
            normalizedItems
                .map((item) => `${item.src}:${item.label}:${item.alt}`)
                .join("|"),
        [normalizedItems]
    )

    const activePathD =
        pathPreset === "custom" ? pathD || DEFAULT_PATH : PATH_PRESETS[pathPreset]

    const shouldReduceMotion = prefersReducedMotion && reduceMotion === "pause"
    const effectiveSpeed =
        prefersReducedMotion && reduceMotion === "slow" ? speed * 0.35 : speed
    const shouldAnimate =
        !isStatic && isInViewport && !shouldReduceMotion && effectiveSpeed !== 0

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        if (isStatic) {
            setIsInViewport(false)
            return
        }

        if (isCanvas || typeof IntersectionObserver === "undefined") {
            setIsInViewport(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInViewport(entry.isIntersecting)
            },
            { root: null, threshold: 0 }
        )

        observer.observe(container)

        return () => {
            observer.disconnect()
        }
    }, [isCanvas, isStatic])

    useEffect(() => {
        const container = containerRef.current
        const path = pathRef.current
        const fallbackPath = fallbackPathRef.current

        if (!container || !path || !fallbackPath || normalizedItems.length === 0) {
            setPositions([])
            return
        }

        const readSize = () => {
            const rect = container.getBoundingClientRect()
            sizeRef.current = {
                width: rect.width || VIEWBOX_WIDTH,
                height: rect.height || VIEWBOX_HEIGHT,
            }
        }

        const measurePath = () => {
            try {
                const length = path.getTotalLength()
                if (Number.isFinite(length) && length > 0) {
                    setUsingFallbackPath(false)
                    return { measuredPath: path, totalLength: length }
                }
            } catch {
                // Invalid custom path values fall back to the built-in wave path.
            }

            const fallbackLength = fallbackPath.getTotalLength()
            setUsingFallbackPath(true)
            return { measuredPath: fallbackPath, totalLength: fallbackLength }
        }

        readSize()

        const { measuredPath, totalLength } = measurePath()
        const layoutKey = `${activePathD}|${itemsKey}|${startOffset}`
        totalLengthRef.current = totalLength

        if (layoutKeyRef.current !== layoutKey) {
            offsetRef.current = wrapLength((startOffset / 100) * totalLength, totalLength)
            velocityRef.current = 0
            layoutKeyRef.current = layoutKey
        } else {
            offsetRef.current = wrapLength(offsetRef.current, totalLength)
        }

        const updatePositions = () => {
            const { width, height } = sizeRef.current
            const scaleX = width / VIEWBOX_WIDTH
            const scaleY = height / VIEWBOX_HEIGHT
            const spacing = totalLength / normalizedItems.length

            setPositions(
                normalizedItems.map((_, index) => {
                    const length = wrapLength(
                        offsetRef.current + index * spacing,
                        totalLength
                    )
                    const point = measuredPath.getPointAtLength(length)

                    return {
                        x: point.x * scaleX,
                        y: point.y * scaleY,
                    }
                })
            )
        }

        updatePositionsRef.current = updatePositions
        updatePositions()

        const observer =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(() => {
                      readSize()
                      updatePositions()
                  })
                : undefined

        observer?.observe(container)

        const tick = () => {
            const directionMultiplier = direction === "reverse" ? -1 : 1
            const hoverMultiplier = hoverRef.current && slowdownOnHover ? 0.15 : 1
            const targetVelocity = shouldAnimate
                ? effectiveSpeed * directionMultiplier * hoverMultiplier
                : 0

            velocityRef.current += (targetVelocity - velocityRef.current) * 0.08
            offsetRef.current = wrapLength(
                offsetRef.current + velocityRef.current,
                totalLength
            )

            updatePositions()
            rafRef.current = requestAnimationFrame(tick)
        }

        if (shouldAnimate) {
            rafRef.current = requestAnimationFrame(tick)
        }

        return () => {
            cancelAnimationFrame(rafRef.current)
            observer?.disconnect()
        }
    }, [
        activePathD,
        direction,
        effectiveSpeed,
        itemsKey,
        normalizedItems,
        shouldAnimate,
        slowdownOnHover,
        startOffset,
    ])

    const handlePointerDown = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            if (!dragToScrub || isStatic) return

            draggingRef.current = true
            setIsScrubbing(true)
            lastPointerXRef.current = event.clientX
            event.currentTarget.setPointerCapture?.(event.pointerId)
        },
        [dragToScrub, isStatic]
    )

    const handlePointerMove = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            if (!draggingRef.current || !dragToScrub) return

            const totalLength = totalLengthRef.current
            const delta = event.clientX - lastPointerXRef.current

            offsetRef.current = wrapLength(offsetRef.current + delta * 0.7, totalLength)
            lastPointerXRef.current = event.clientX
            updatePositionsRef.current()
        },
        [dragToScrub]
    )

    const endScrub = useCallback((event: PointerEvent<HTMLDivElement>) => {
        if (!draggingRef.current) return

        draggingRef.current = false
        setIsScrubbing(false)
        try {
            event.currentTarget.releasePointerCapture?.(event.pointerId)
        } catch {
            // The pointer may already be released if it left the frame.
        }
    }, [])

    const showEmptyState = isCanvas && normalizedItems.length === 0
    const visiblePathD = usingFallbackPath ? DEFAULT_PATH : activePathD

    return (
        <div
            ref={containerRef}
            role="list"
            aria-label={ariaLabel}
            onPointerEnter={() => {
                hoverRef.current = true
            }}
            onPointerLeave={(event) => {
                hoverRef.current = false
                endScrub(event)
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endScrub}
            onPointerCancel={endScrub}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: 1,
                overflow: "hidden",
                backgroundColor,
                cursor: dragToScrub
                    ? isScrubbing
                        ? "grabbing"
                        : "grab"
                    : "default",
                touchAction: dragToScrub ? "pan-y" : "auto",
                userSelect: "none",
            }}
        >
            <svg
                viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    opacity: 0,
                    pointerEvents: "none",
                }}
            >
                <path ref={pathRef} d={activePathD} />
                <path ref={fallbackPathRef} d={DEFAULT_PATH} />
            </svg>

            {showPath && (
                <svg
                    viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                        opacity: pathOpacity,
                    }}
                >
                    <path
                        d={visiblePathD}
                        stroke={pathColor}
                        strokeWidth={pathStrokeWidth}
                        strokeDasharray={pathDash || undefined}
                        vectorEffect="non-scaling-stroke"
                        fill="none"
                    />
                </svg>
            )}

            {showEmptyState && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(255,255,255,.7)",
                        fontSize: 14,
                        fontFamily: "Inter, system-ui, sans-serif",
                    }}
                >
                    Add at least one item
                </div>
            )}

            {normalizedItems.map((item, index) => {
                const position = positions[index]
                const isHovered = hoveredIndex === index
                const scale = isHovered ? hoverScale : 1

                return (
                    <figure
                        key={`${item.src}-${index}`}
                        role="listitem"
                        onPointerEnter={() => setHoveredIndex(index)}
                        onPointerLeave={() => setHoveredIndex(null)}
                        style={{
                            position: "absolute",
                            left: position?.x ?? 0,
                            top: position?.y ?? 0,
                            width: itemSize,
                            height: itemSize,
                            margin: 0,
                            overflow: "hidden",
                            opacity: position ? 1 : 0,
                            borderRadius: itemRadius,
                            border: itemBorder
                                ? `1px solid ${itemBorderColor}`
                                : "1px solid rgba(255,255,255,0)",
                            backgroundColor: "rgba(255,255,255,0.08)",
                            boxShadow: itemShadow
                                ? isHovered
                                    ? "0 18px 42px rgba(0, 0, 0, 0.28)"
                                    : "0 8px 26px rgba(0, 0, 0, 0.2)"
                                : "none",
                            transform: `translate(-50%, -50%) scale(${scale})`,
                            transformOrigin: "center",
                            transition:
                                isStatic || shouldReduceMotion
                                    ? "none"
                                    : "transform 180ms ease, box-shadow 180ms ease",
                            willChange: shouldAnimate ? "transform, left, top" : "auto",
                            zIndex: isHovered ? 3 : 2,
                        }}
                    >
                        {item.src ? (
                            <img
                                src={item.src}
                                srcSet={item.srcSet}
                                alt={item.alt}
                                draggable={false}
                                loading="lazy"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    display: "block",
                                    objectFit,
                                    pointerEvents: "none",
                                }}
                            />
                        ) : (
                            <div
                                aria-label={item.alt}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: labelColor,
                                    fontFamily: "Inter, system-ui, sans-serif",
                                    fontSize: itemSize * 0.24,
                                    fontWeight: 700,
                                    background:
                                        "linear-gradient(135deg, #64748b, #111827)",
                                }}
                            >
                                {item.label}
                            </div>
                        )}

                        {showLabels && (
                            <figcaption
                                style={{
                                    position: "absolute",
                                    right: 6,
                                    bottom: 6,
                                    maxWidth: `calc(100% - 12px)`,
                                    padding: "3px 7px",
                                    borderRadius: 999,
                                    color: labelColor,
                                    background: labelBackground,
                                    fontFamily: "Inter, system-ui, sans-serif",
                                    fontSize: Math.max(10, itemSize * 0.16),
                                    lineHeight: 1.1,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    pointerEvents: "none",
                                }}
                            >
                                {item.label}
                            </figcaption>
                        )}
                    </figure>
                )
            })}
        </div>
    )
}

MarqueeAlongPath.displayName = "Marquee Along Path"

addPropertyControls<MarqueeAlongPathProps>(MarqueeAlongPath, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Item",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt",
                    defaultValue: "",
                },
            },
        },
        defaultValue: DEFAULT_ITEMS,
        maxCount: 24,
    },
    itemSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 72,
        min: 24,
        max: 240,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    itemRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 12,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
    itemShadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    itemBorder: {
        type: ControlType.Boolean,
        title: "Border",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    itemBorderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "rgba(255, 255, 255, 0.65)",
        hidden: ({ itemBorder }) => !itemBorder,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 0.8,
        min: 0,
        max: 8,
        step: 0.1,
        displayStepper: true,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["forward", "reverse"],
        optionTitles: ["Forward", "Reverse"],
        defaultValue: "forward",
        displaySegmentedControl: true,
    },
    repeat: {
        type: ControlType.Number,
        title: "Repeat",
        defaultValue: 2,
        min: 1,
        max: 8,
        step: 1,
        displayStepper: true,
    },
    startOffset: {
        type: ControlType.Number,
        title: "Offset",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    slowdownOnHover: {
        type: ControlType.Boolean,
        title: "Hover",
        defaultValue: true,
        enabledTitle: "Slow",
        disabledTitle: "Normal",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.18,
        min: 1,
        max: 2,
        step: 0.01,
    },
    dragToScrub: {
        type: ControlType.Boolean,
        title: "Drag",
        defaultValue: true,
        enabledTitle: "Scrub",
        disabledTitle: "Off",
    },
    reduceMotion: {
        type: ControlType.Enum,
        title: "Reduced Motion",
        options: ["pause", "slow"],
        optionTitles: ["Pause", "Slow"],
        defaultValue: "pause",
        displaySegmentedControl: true,
    },
    pathPreset: {
        type: ControlType.Enum,
        title: "Path",
        options: ["wave", "loop", "orbit", "rise", "custom"],
        optionTitles: ["Wave", "Loop", "Orbit", "Rise", "Custom"],
        defaultValue: "wave",
    },
    pathD: {
        type: ControlType.String,
        title: "SVG Path",
        defaultValue: DEFAULT_PATH,
        displayTextArea: true,
        hidden: ({ pathPreset }) => pathPreset !== "custom",
    },
    showPath: {
        type: ControlType.Boolean,
        title: "Guide Path",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    pathColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#d4d4d8",
        hidden: ({ showPath }) => !showPath,
    },
    pathOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 0.72,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: ({ showPath }) => !showPath,
    },
    pathStrokeWidth: {
        type: ControlType.Number,
        title: "Stroke",
        defaultValue: 1,
        min: 0.5,
        max: 8,
        step: 0.5,
        unit: "px",
        displayStepper: true,
        hidden: ({ showPath }) => !showPath,
    },
    pathDash: {
        type: ControlType.String,
        title: "Dash",
        defaultValue: "4 6",
        hidden: ({ showPath }) => !showPath,
    },
    showLabels: {
        type: ControlType.Boolean,
        title: "Labels",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Text",
        defaultValue: "#ffffff",
        hidden: ({ showLabels }) => !showLabels,
    },
    labelBackground: {
        type: ControlType.Color,
        title: "Label Fill",
        defaultValue: "rgba(0, 0, 0, 0.42)",
        hidden: ({ showLabels }) => !showLabels,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "transparent",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "ARIA Label",
        defaultValue: "Animated image marquee following an SVG path",
    },
})
