// Optimized DynamicTiles component: displays child components in a repeating grid or brick pattern with scale and gap controls
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
    useRef,
    useEffect,
    useState,
    useMemo,
    Children,
    startTransition,
    type CSSProperties,
} from "react"

interface DynamicTilesProps {
    children: React.ReactNode
    tileType: "grid" | "brick"
    direction: "horizontal" | "vertical"
    scale: number
    gap: number
    backgroundColor: string
    alignment: string
    style?: CSSProperties
}

/**
 * Optimized DynamicTiles
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function DynamicTiles(props: DynamicTilesProps) {
    const {
        children,
        tileType,
        direction,
        scale,
        gap,
        backgroundColor,
        alignment = "center-center",
        style,
    } = props
    const containerRef = useRef<HTMLDivElement>(null)
    const childRef = useRef<HTMLDivElement>(null)
    const [dimensions, setDimensions] = useState<{
        itemWidth: number
        itemHeight: number
        columns: number
        rows: number
    }>({ itemWidth: 0, itemHeight: 0, columns: 1, rows: 1 })

    // Detect if children exist
    const hasChildren = Children.count(children) > 0

    // Memoize alignment styles
    const alignmentStyles = useMemo(() => {
        const [vAlign, hAlign] = alignment.split("-")
        return {
            alignItems:
                vAlign === "top"
                    ? "flex-start"
                    : vAlign === "bottom"
                      ? "flex-end"
                      : "center",
            justifyContent:
                hAlign === "left"
                    ? "flex-start"
                    : hAlign === "right"
                      ? "flex-end"
                      : "center",
        }
    }, [alignment])

    // Memoize scaled dimensions
    const scaled = useMemo(
        () => ({
            width: dimensions.itemWidth * (scale / 100),
            height: dimensions.itemHeight * (scale / 100),
        }),
        [dimensions.itemWidth, dimensions.itemHeight, scale]
    )

    // Measure child size and container size, recalculate grid
    useEffect(() => {
        if (
            typeof window === "undefined" ||
            !hasChildren ||
            !childRef.current ||
            !containerRef.current
        )
            return

        const update = () => {
            const child = childRef.current
            const container = containerRef.current
            if (!child || !container) return

            const childRect = child.getBoundingClientRect()
            const containerRect = container.getBoundingClientRect()

            const itemWidth = Math.max(1, childRect.width)
            const itemHeight = Math.max(1, childRect.height)
            const scaledW = itemWidth * (scale / 100)
            const scaledH = itemHeight * (scale / 100)
            const cW = Math.max(1, containerRect.width)
            const cH = Math.max(1, containerRect.height)

            const newDimensions = {
                itemWidth,
                itemHeight,
                columns: Math.max(1, Math.ceil(cW / (scaledW + gap))),
                rows: Math.max(1, Math.ceil(cH / (scaledH + gap))),
            }

            setDimensions((prev) => {
                if (
                    prev.itemWidth === newDimensions.itemWidth &&
                    prev.itemHeight === newDimensions.itemHeight &&
                    prev.columns === newDimensions.columns &&
                    prev.rows === newDimensions.rows
                ) {
                    return prev
                }
                return newDimensions
            })
        }

        update()
        const resizeObserver = new window.ResizeObserver(update)
        resizeObserver.observe(childRef.current)
        resizeObserver.observe(containerRef.current)

        return () => resizeObserver.disconnect()
    }, [scale, gap, hasChildren])

    // Generate grid items
    const items = useMemo(() => {
        if (!hasChildren || dimensions.itemWidth === 0) return null

        const totalItems = dimensions.columns * dimensions.rows
        const isBrick = tileType === "brick"
        const isHorizontal = direction === "horizontal"
        const halfWidth = (scaled.width + gap) / 2
        const halfHeight = (scaled.height + gap) / 2

        return Array.from({ length: totalItems }, (_, i) => {
            const row = Math.floor(i / dimensions.columns)
            const col = i % dimensions.columns

            let transform: string | undefined
            if (isBrick) {
                if (isHorizontal && row % 2 === 1) {
                    transform = `translateX(${halfWidth}px)`
                } else if (!isHorizontal && col % 2 === 1) {
                    transform = `translateY(${halfHeight}px)`
                }
            }

            return (
                <div
                    key={i}
                    style={{
                        width: scaled.width,
                        height: scaled.height,
                        display: "flex",
                        ...alignmentStyles,
                        flexShrink: 0,
                        transform,
                    }}
                >
                    {children}
                </div>
            )
        })
    }, [
        hasChildren,
        dimensions,
        tileType,
        direction,
        scaled,
        gap,
        alignmentStyles,
        children,
    ])

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                backgroundColor,
                overflow: "hidden",
            }}
        >
            {!hasChildren ? (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        height: "100%",
                        color: "#999",
                        fontSize: 14,
                        fontFamily: "Inter, sans-serif",
                        textAlign: "center",
                        padding: 40,
                        zIndex: 1000,
                        position: "absolute",
                        top: 0,
                        left: 0,
                        gap: 12,
                        pointerEvents: "none",
                    }}
                >
                    <div style={{ fontSize: 32, marginBottom: 4 }}>🔌</div>
                    <div
                        style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: "#666",
                            marginBottom: 4,
                        }}
                    >
                        Connect to Content
                    </div>
                    <div
                        style={{
                            fontSize: 13,
                            fontWeight: 400,
                            color: "#999",
                            maxWidth: 280,
                            lineHeight: 1.4,
                        }}
                    >
                        Connect a component to create a repeating pattern
                    </div>
                </div>
            ) : (
                <>
                    {/* Hidden child for measurement */}
                    <div
                        ref={childRef}
                        style={{
                            position: "absolute",
                            visibility: "hidden",
                            pointerEvents: "none",
                            width: "auto",
                            height: "auto",
                        }}
                    >
                        {children}
                    </div>
                    {items && (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: `repeat(${dimensions.columns}, 1fr)`,
                                gridTemplateRows: `repeat(${dimensions.rows}, 1fr)`,
                                gap: `${gap}px`,
                                width: "100%",
                                height: "100%",
                            }}
                        >
                            {items}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

addPropertyControls(DynamicTiles, {
    children: {
        type: ControlType.Slot,
        title: "Pattern Item",
    },
    tileType: {
        type: ControlType.Enum,
        title: "Tile Type",
        options: ["grid", "brick"],
        optionTitles: ["Grid", "Brick"],
        defaultValue: "grid",
        displaySegmentedControl: true,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["horizontal", "vertical"],
        optionTitles: ["↔", "↕"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
        hidden: ({ tileType }) => tileType !== "brick",
    },
    alignment: {
        type: ControlType.Enum,
        title: "Alignment",
        options: [
            "top-left",
            "top-center",
            "top-right",
            "center-left",
            "center-center",
            "center-right",
            "bottom-left",
            "bottom-center",
            "bottom-right",
        ],
        optionTitles: [
            "Top Left",
            "Top Center",
            "Top Right",
            "Center Left",
            "Center Center",
            "Center Right",
            "Bottom Left",
            "Bottom Center",
            "Bottom Right",
        ],
        defaultValue: "center-center",
    },
    scale: {
        type: ControlType.Number,
        title: "Scale",
        defaultValue: 100,
        min: 10,
        max: 200,
        step: 1,
        unit: "%",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 16,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
})
