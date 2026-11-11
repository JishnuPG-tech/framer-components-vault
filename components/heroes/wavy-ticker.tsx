// Wavy ticker component for displaying anything
import {
    useEffect,
    useRef,
    useState,
    startTransition,
    useMemo,
    useCallback,
    type CSSProperties,
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

import { useAnimationFrame } from "framer-motion"

interface WavyTickerProps {
    items: React.ReactNode[]
    interactionType: "auto" | "scroll"
    speed: number
    scrollSpeed: number
    direction: "left" | "right" | "up" | "down"
    slowdownOnHover: number
    waveStyle: "wavy" | "straight"
    waveAmplitude: number
    waveFrequency: number
    itemSize: number
    gap: number
    padding: number
    verticalAlign: "top" | "center" | "bottom"
    fadeEdges: boolean
    fadeDistance: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
function WavyTicker(props: WavyTickerProps) {
    const {
        items = [],
        interactionType = "auto",
        speed = 50,
        scrollSpeed = 1,
        direction = "left",
        slowdownOnHover = 0.3,
        waveStyle = "wavy",
        waveAmplitude = 20,
        waveFrequency = 0.005,
        itemSize = 80,
        gap = 32,
        padding = 40,
        verticalAlign = "center",
        fadeEdges = true,
        fadeDistance = 15,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const [offset, setOffset] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const [scrollOffset, setScrollOffset] = useState(0)
    const targetScrollOffset = useRef(0)
    const isStatic = useIsStaticRenderer()
    const itemRefs = useRef<(HTMLDivElement | null)[]>([])
    const [itemWidths, setItemWidths] = useState<number[]>([])
    const [containerWidth, setContainerWidth] = useState(0)
    const [containerHeight, setContainerHeight] = useState(0)

    const isVertical = direction === "up" || direction === "down"

    // Track container dimensions
    useEffect(() => {
        if (!containerRef.current) return

        const updateDimensions = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth)
                setContainerHeight(containerRef.current.offsetHeight)
            }
        }

        updateDimensions()
        window.addEventListener("resize", updateDimensions)
        return () => window.removeEventListener("resize", updateDimensions)
    }, [])

    // Measure item widths after render
    useEffect(() => {
        if (itemRefs.current.length > 0 && items.length > 0) {
            const widths = itemRefs.current
                .slice(0, items.length)
                .map((ref) => (ref ? ref.offsetWidth || itemSize : itemSize))
            setItemWidths(widths)
        }
    }, [items, itemSize])

    // Calculate dynamic height based on wave effect
    const calculatedHeight = useMemo(() => {
        const waveHeight = waveStyle === "wavy" ? waveAmplitude * 2 : 0
        const baseHeight = itemSize + waveHeight + padding * 2
        return Math.max(5, baseHeight)
    }, [itemSize, waveAmplitude, padding, waveStyle])

    // Track scroll position
    useEffect(() => {
        if (isStatic || interactionType !== "scroll") return

        const handleScroll = () => {
            targetScrollOffset.current = window.scrollY * scrollSpeed
        }

        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [isStatic, interactionType, scrollSpeed])

    // Animation loop
    useAnimationFrame((time, delta) => {
        if (isStatic) return

        if (interactionType === "auto") {
            const effectiveSpeed = isHovered ? speed * slowdownOnHover : speed
            startTransition(() => {
                setOffset((prev) => prev + (effectiveSpeed * delta) / 1000)
            })
        } else {
            startTransition(() => {
                setScrollOffset((prev) => {
                    const diff = targetScrollOffset.current - prev
                    return prev + diff * 0.1
                })
            })
        }
    })

    // Mouse event handlers
    const handleMouseEnter = useCallback(() => {
        if (interactionType === "auto") {
            startTransition(() => setIsHovered(true))
        }
    }, [interactionType])

    const handleMouseLeave = useCallback(() => {
        if (interactionType === "auto") {
            startTransition(() => setIsHovered(false))
        }
    }, [interactionType])

    // Guard against empty items
    if (!items || items.length === 0) {
        return (
            <div
                style={{
                    width: "100%",
                    height: Math.max(5, calculatedHeight),
                    minHeight: 5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: `${padding}px 0`,
                }}
            >
                <p style={{ color: "#999", fontSize: 14 }}>Add items to display</p>
            </div>
        )
    }

    // Calculate dimensions
    const widthsToUse = itemWidths.length === items.length ? itemWidths : items.map(() => itemSize)
    const totalWidth = widthsToUse.reduce((sum, width) => sum + width + gap, 0)
    const totalHeight = items.length * (itemSize + gap)
    
    const viewportWidth = containerWidth || (typeof window !== "undefined" ? window.innerWidth : 1200)
    const viewportHeight = containerHeight || (typeof window !== "undefined" ? window.innerHeight : 800)
    
    // Calculate repeats needed for seamless loop
    const repeats = isVertical 
        ? Math.max(3, Math.ceil(viewportHeight / totalHeight) + 2)
        : Math.max(3, Math.ceil(viewportWidth / totalWidth) + 2)

    // Create repeated items array
    const allItems = useMemo(() => {
        return Array.from({ length: repeats }, () => items).flat()
    }, [repeats, items])

    const allWidths = useMemo(() => {
        return Array.from({ length: repeats }, () => widthsToUse).flat()
    }, [repeats, widthsToUse])

    // Calculate offset with proper wrapping
    const currentOffset = interactionType === "scroll" ? scrollOffset : offset
    const loopLength = isVertical ? totalHeight : totalWidth
    
    // Calculate final position based on direction with proper wrapping
    let finalOffset: number
    if (direction === "left") {
        // Moving left: content moves left (negative direction)
        const wrappedOffset = ((currentOffset % loopLength) + loopLength) % loopLength
        finalOffset = -wrappedOffset
    } else if (direction === "right") {
        // Moving right: content moves right (positive direction)
        const wrappedOffset = ((currentOffset % loopLength) + loopLength) % loopLength
        finalOffset = wrappedOffset - loopLength
    } else if (direction === "up") {
        // Moving up: content moves up (negative direction)
        const wrappedOffset = ((currentOffset % loopLength) + loopLength) % loopLength
        finalOffset = -wrappedOffset
    } else {
        // Moving down: content moves down (positive direction)
        const wrappedOffset = ((currentOffset % loopLength) + loopLength) % loopLength
        finalOffset = wrappedOffset - loopLength
    }

    // Vertical alignment styles
    const verticalStyles = useMemo(() => {
        switch (verticalAlign) {
            case "top":
                return { top: padding, bottom: "auto", transform: "" }
            case "bottom":
                return { top: "auto", bottom: padding, transform: "" }
            default:
                return { top: "50%", bottom: "auto", transform: "translateY(-50%)" }
        }
    }, [verticalAlign, padding])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: isVertical ? "100%" : Math.max(5, calculatedHeight),
                minHeight: 5,
                overflow: "hidden",
                position: "relative",
                display: "flex",
                alignItems:
                    verticalAlign === "top"
                        ? "flex-start"
                        : verticalAlign === "bottom"
                          ? "flex-end"
                          : "center",
                ...(fadeEdges &&
                    !isVertical && {
                        maskImage: `linear-gradient(to right, transparent 0%, black ${fadeDistance}%, black ${100 - fadeDistance}%, transparent 100%)`,
                        WebkitMaskImage: `linear-gradient(to right, transparent 0%, black ${fadeDistance}%, black ${100 - fadeDistance}%, transparent 100%)`,
                    }),
                ...(fadeEdges &&
                    isVertical && {
                        maskImage: `linear-gradient(to bottom, transparent 0%, black ${fadeDistance}%, black ${100 - fadeDistance}%, transparent 100%)`,
                        WebkitMaskImage: `linear-gradient(to bottom, transparent 0%, black ${fadeDistance}%, black ${100 - fadeDistance}%, transparent 100%)`,
                    }),
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: isVertical ? "column" : "row",
                    gap: `${gap}px`,
                    position: "absolute",
                    left: isVertical ? 0 : undefined,
                    top: isVertical ? 0 : undefined,
                    width: isVertical ? "100%" : undefined,
                    ...(!isVertical && verticalStyles),
                    transform: isVertical
                        ? `translateY(${finalOffset}px)`
                        : `translateX(${finalOffset}px) ${verticalStyles.transform}`,
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                }}
            >
                {allItems.map((item, index) => {
                    // Calculate position for wave effect
                    let position = 0
                    for (let i = 0; i < index; i++) {
                        position += (isVertical ? itemSize : allWidths[i]) + gap
                    }

                    const itemWidth = allWidths[index] || itemSize
                    const waveOffset =
                        waveStyle === "wavy"
                            ? Math.sin((position + currentOffset) * waveFrequency) * waveAmplitude
                            : 0

                    const isOriginalItem = index < items.length

                    return (
                        <div
                            key={`item-${index}`}
                            ref={
                                isOriginalItem
                                    ? (el) => {
                                          itemRefs.current[index] = el
                                      }
                                    : undefined
                            }
                            style={{
                                minWidth: isVertical ? "100%" : itemWidth,
                                width: isVertical ? "100%" : undefined,
                                height: itemSize,
                                flexShrink: 0,
                                transform: isVertical
                                    ? `translateX(${waveOffset}px)`
                                    : `translateY(${waveOffset}px)`,
                                willChange: "transform",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {item}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(WavyTicker, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.ComponentInstance,
        },
        maxCount: 20,
    },

    // Movement Section
    interactionType: {
        type: ControlType.Enum,
        title: "Movement",
        options: ["auto", "scroll"],
        optionTitles: ["Auto", "On Scroll"],
        defaultValue: "auto",
        displaySegmentedControl: true,
        description: "Auto moves continuously, On Scroll moves based on page scroll",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right", "up", "down"],
        optionTitles: ["←", "→", "↑", "↓"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 50,
        min: 10,
        max: 200,
        step: 10,
        description: "How fast the ticker moves automatically",
        hidden: ({ interactionType }) => interactionType === "scroll",
    },
    scrollSpeed: {
        type: ControlType.Number,
        title: "Scroll Speed",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        description: "Multiplier for how much the ticker moves when scrolling",
        hidden: ({ interactionType }) => interactionType === "auto",
    },
    slowdownOnHover: {
        type: ControlType.Number,
        title: "Hover Speed",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.1,
        description: "Speed multiplier on hover (0 = stop, 1 = full speed)",
        hidden: ({ interactionType }) => interactionType === "scroll",
    },

    // Wave Effect Section
    waveStyle: {
        type: ControlType.Enum,
        title: "Wave Effect",
        options: ["straight", "wavy"],
        optionTitles: ["Off", "On"],
        defaultValue: "wavy",
        displaySegmentedControl: true,
    },
    waveAmplitude: {
        type: ControlType.Number,
        title: "Wave Height",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 5,
        unit: "px",
        description: "How tall the wave peaks are",
        hidden: ({ waveStyle }) => waveStyle === "straight",
    },
    waveFrequency: {
        type: ControlType.Number,
        title: "Wave Frequency",
        defaultValue: 0.005,
        min: 0.001,
        max: 0.02,
        step: 0.001,
        description: "How many waves appear (higher = more waves)",
        hidden: ({ waveStyle }) => waveStyle === "straight",
    },

    // Layout Section
    itemSize: {
        type: ControlType.Number,
        title: "Item Height",
        defaultValue: 80,
        min: 40,
        max: 200,
        step: 10,
        unit: "px",
        description: "Height of each item in the ticker",
    },
    gap: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 32,
        min: 0,
        max: 100,
        step: 4,
        unit: "px",
        description: "Space between items",
    },
    verticalAlign: {
        type: ControlType.Enum,
        title: "Vertical Align",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "center",
        displaySegmentedControl: true,
        description: "Vertical position of items within the ticker",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 40,
        min: 0,
        max: 100,
        step: 10,
        unit: "px",
        description: "Vertical padding around the ticker content",
    },

    // Edge Fade Section
    fadeEdges: {
        type: ControlType.Boolean,
        title: "Fade Edges",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Gradually fade items at the left and right edges",
    },
    fadeDistance: {
        type: ControlType.Number,
        title: "Fade Width",
        defaultValue: 15,
        min: 0,
        max: 50,
        step: 1,
        unit: "%",
        description: "How far the fade extends from each edge",
        hidden: ({ fadeEdges }) => !fadeEdges,
    },
})

export default WavyTicker
