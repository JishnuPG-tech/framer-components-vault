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


/**
 * Wire Grid Board
 * ---------------
 * A thin-line wire mesh, like the copper memo-board grids used for
 * pinning up photos, plants, and stationery. Cell size stays roughly
 * constant (a target in px) and the number of rows/columns recalculates
 * from the live frame size.
 *
 * Items are placed at grid intersections (Column, Row) and hang down
 * from that point, like they're clipped onto the wire.
 *
 * Align X / Align Y:
 *  - Left / Top: Column and Row count from the top-left corner.
 *  - Center: Column 0 / Row 0 is the middle of the grid, negative
 *    numbers go left / up. Items keep their distance from the center
 *    when the frame is resized, so layouts stay centered responsively.
 *
 * Per-item controls:
 *  - Custom shape with Lock Ratio (follow the image's own ratio, or type a ratio like 4:5)
 *  - Own clip image and clip size (falls back to the global clip, then the dot)
 *  - Own corner radius, including per-corner (falls back to the global radius)
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

function imgSrc(value: any): string | undefined {
    if (!value) return undefined
    return typeof value === "string" ? value : value.src
}

function BoardItem(props: any) {
    const {
        item,
        x,
        y,
        lineColor,
        pinColor,
        pinSize,
        globalRadius,
        globalClipSrc,
        globalClipSize,
    } = props

    const {
        image,
        shape = "square",
        size = 80,
        customWidth = 80,
        customHeight = 80,
        lockRatio = false,
        ratioSource = "image",
        ratioW = 4,
        ratioH = 5,
        rotation = 0,
        opacity = 1,
        anchor = "top",
        showClip = true,
        clipImage,
        clipSize = 0,
        customRadius = false,
        radius = "6px",
    } = item

    const [natural, setNatural] = React.useState<{
        w: number
        h: number
    } | null>(null)

    const imageSrc = imgSrc(image)

    // Resolve width / height
    let itemWidth = size
    let itemHeight = size
    if (shape === "landscape") {
        itemWidth = size
        itemHeight = size * (9 / 16)
    } else if (shape === "portrait") {
        itemHeight = size
        itemWidth = size * (9 / 16)
    } else if (shape === "custom") {
        if (lockRatio) {
            let ratio = ratioW > 0 && ratioH > 0 ? ratioW / ratioH : 1
            if (ratioSource === "image" && imageSrc && natural) {
                ratio = natural.w / natural.h
            }
            itemWidth = customWidth
            itemHeight = customWidth / ratio
        } else {
            itemWidth = customWidth
            itemHeight = customHeight
        }
    }

    // Resolve radius: per item override, otherwise global number
    const resolvedRadius = customRadius ? radius : globalRadius

    // Resolve clip: per item, then global, then plain dot
    const itemClipSrc = imgSrc(clipImage) || globalClipSrc
    const itemClipSize = clipSize > 0 ? clipSize : globalClipSize

    const translateY = anchor === "top" ? "0%" : "-50%"

    return (
        <div>
            <div
                style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    width: itemWidth,
                    height: itemHeight,
                    transform: `translate(-50%, ${translateY}) rotate(${rotation}deg)`,
                    transformOrigin: "top center",
                    opacity,
                    filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.2))",
                }}
            >
                {imageSrc ? (
                    <img
                        src={imageSrc}
                        alt=""
                        onLoad={(e) =>
                            setNatural({
                                w: e.currentTarget.naturalWidth,
                                h: e.currentTarget.naturalHeight,
                            })
                        }
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            borderRadius: resolvedRadius,
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            border: `1px dashed ${lineColor}`,
                            borderRadius: resolvedRadius,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontFamily: "sans-serif",
                            color: lineColor,
                            textAlign: "center",
                            padding: 4,
                            boxSizing: "border-box",
                        }}
                    >
                        add image
                    </div>
                )}
            </div>
            {showClip &&
                (itemClipSrc ? (
                    <img
                        src={itemClipSrc}
                        alt=""
                        style={{
                            position: "absolute",
                            left: x,
                            top: y,
                            width: itemClipSize,
                            height: itemClipSize,
                            transform: "translate(-50%, -50%)",
                            objectFit: "contain",
                            pointerEvents: "none",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            position: "absolute",
                            left: x,
                            top: y,
                            width: pinSize,
                            height: pinSize,
                            background: pinColor,
                            borderRadius: "50%",
                            transform: "translate(-50%, -50%)",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
                        }}
                    />
                ))}
        </div>
    )
}

export default function WireGridBoard(props) {
    const {
        cellSize,
        margin,
        lineColor,
        lineWidth,
        showDots,
        dotColor,
        dotSize,
        pinColor,
        pinSize,
        cornerRadius,
        backgroundColor,
        imageCornerRadius,
        clipImage,
        clipSize,
        alignX,
        alignY,
        items,
        style,
    } = props

    const containerRef = React.useRef(null)
    const [frame, setFrame] = React.useState({ width: 0, height: 0 })
    const clipId = React.useRef(
        `grid-round-${Math.random().toString(36).slice(2)}`
    ).current

    React.useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect
                setFrame({ width, height })
            }
        })
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    const { width, height } = frame
    const innerWidth = Math.max(width - margin * 2, 0)
    const innerHeight = Math.max(height - margin * 2, 0)

    const columns = Math.max(Math.round(innerWidth / cellSize), 1)
    const rows = Math.max(Math.round(innerHeight / cellSize), 1)
    const colWidth = columns > 0 ? innerWidth / columns : 0
    const rowHeight = rows > 0 ? innerHeight / rows : 0

    // Origin for item positions. In "center" mode, Column / Row 0 is the
    // middle intersection of the grid, so items keep their distance from
    // the center as the frame resizes. Floor keeps it on a wire crossing.
    const originCol = alignX === "center" ? Math.floor(columns / 2) : 0
    const originRow = alignY === "center" ? Math.floor(rows / 2) : 0

    // Effective corner radius, clamped so opposing corners can't overlap.
    const r = Math.max(
        Math.min(cornerRadius, innerWidth / 2, innerHeight / 2),
        0
    )

    function verticalExtent(x) {
        let top = margin
        let bottom = margin + innerHeight
        const leftCenter = margin + r
        const rightCenter = margin + innerWidth - r
        let ox = null
        if (x < leftCenter) ox = leftCenter - x
        else if (x > rightCenter) ox = x - rightCenter
        if (ox !== null && ox <= r && r > 0) {
            const dy = Math.sqrt(Math.max(r * r - ox * ox, 0))
            top = margin + r - dy
            bottom = margin + innerHeight - r + dy
        }
        return [top, bottom]
    }

    function horizontalExtent(y) {
        let left = margin
        let right = margin + innerWidth
        const topCenter = margin + r
        const bottomCenter = margin + innerHeight - r
        let oy = null
        if (y < topCenter) oy = topCenter - y
        else if (y > bottomCenter) oy = y - bottomCenter
        if (oy !== null && oy <= r && r > 0) {
            const dx = Math.sqrt(Math.max(r * r - oy * oy, 0))
            left = margin + r - dx
            right = margin + innerWidth - r + dx
        }
        return [left, right]
    }

    const lines = []
    const dots = []
    if (width > 0 && height > 0) {
        for (let c = 1; c < columns; c++) {
            const x = margin + c * colWidth
            const [top, bottom] = verticalExtent(x)
            lines.push(
                <line
                    key={`v-${c}`}
                    x1={x}
                    y1={top}
                    x2={x}
                    y2={bottom}
                    stroke={lineColor}
                    strokeWidth={lineWidth}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                />
            )
        }
        for (let rIdx = 1; rIdx < rows; rIdx++) {
            const y = margin + rIdx * rowHeight
            const [left, right] = horizontalExtent(y)
            lines.push(
                <line
                    key={`h-${rIdx}`}
                    x1={left}
                    y1={y}
                    x2={right}
                    y2={y}
                    stroke={lineColor}
                    strokeWidth={lineWidth}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                />
            )
        }
        if (showDots) {
            for (let c = 0; c <= columns; c++) {
                for (let rIdx = 0; rIdx <= rows; rIdx++) {
                    dots.push(
                        <circle
                            key={`d-${c}-${rIdx}`}
                            cx={margin + c * colWidth}
                            cy={margin + rIdx * rowHeight}
                            r={dotSize / 2}
                            fill={dotColor}
                        />
                    )
                }
            }
        }
    }

    const globalClipSrc = imgSrc(clipImage)

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                backgroundColor,
                ...style,
            }}
        >
            {width > 0 && height > 0 && (
                <svg
                    width={width}
                    height={height}
                    style={{ position: "absolute", top: 0, left: 0 }}
                >
                    <defs>
                        <clipPath id={`${clipId}-round`}>
                            <rect
                                x={margin}
                                y={margin}
                                width={innerWidth}
                                height={innerHeight}
                                rx={r}
                                ry={r}
                            />
                        </clipPath>
                    </defs>
                    {lines}
                    <g clipPath={`url(#${clipId}-round)`}>{dots}</g>
                    <rect
                        x={margin}
                        y={margin}
                        width={innerWidth}
                        height={innerHeight}
                        rx={r}
                        ry={r}
                        fill="none"
                        stroke={lineColor}
                        strokeWidth={lineWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>
            )}
            {width > 0 &&
                height > 0 &&
                items.map((item, i) => {
                    const col = Math.min(
                        Math.max((item.column ?? 0) + originCol, 0),
                        columns
                    )
                    const rw = Math.min(
                        Math.max((item.row ?? 0) + originRow, 0),
                        rows
                    )
                    return (
                        <BoardItem
                            key={i}
                            item={item}
                            x={margin + col * colWidth}
                            y={margin + rw * rowHeight}
                            lineColor={lineColor}
                            pinColor={pinColor}
                            pinSize={pinSize}
                            globalRadius={imageCornerRadius}
                            globalClipSrc={globalClipSrc}
                            globalClipSize={clipSize}
                        />
                    )
                })}
        </div>
    )
}

WireGridBoard.displayName = "Wire Grid Board"

const defaultItems = [
    {
        column: 1,
        row: 1,
        shape: "square",
        size: 70,
        rotation: 0,
        opacity: 1,
        anchor: "top",
        showClip: true,
    },
    {
        column: 4,
        row: 2,
        shape: "landscape",
        size: 90,
        rotation: -3,
        opacity: 1,
        anchor: "top",
        showClip: true,
    },
]

WireGridBoard.defaultProps = {
    cellSize: 28,
    margin: 16,
    lineColor: "#C08552",
    lineWidth: 1,
    showDots: false,
    dotColor: "#C08552",
    dotSize: 4,
    pinColor: "#C08552",
    pinSize: 8,
    cornerRadius: 16,
    backgroundColor: "#F5F1EA",
    imageCornerRadius: 6,
    clipSize: 20,
    alignX: "left",
    alignY: "top",
    items: defaultItems,
}

addPropertyControls(WireGridBoard, {
    cellSize: {
        type: ControlType.Number,
        title: "Cell Size",
        min: 8,
        max: 200,
        step: 1,
        defaultValue: 28,
        description: "Target px per square. Count auto-adjusts.",
    },
    margin: {
        type: ControlType.Number,
        title: "Margin",
        min: 0,
        max: 200,
        step: 1,
        defaultValue: 16,
    },
    lineColor: {
        type: ControlType.Color,
        title: "Wire Color",
        defaultValue: "#C08552",
    },
    lineWidth: {
        type: ControlType.Number,
        title: "Wire Weight",
        min: 0.5,
        max: 6,
        step: 0.5,
        defaultValue: 1,
    },
    showDots: {
        type: ControlType.Boolean,
        title: "Rivets",
        defaultValue: false,
        description: "Small dot at every intersection",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Rivet Color",
        defaultValue: "#C08552",
        hidden: (props) => !props.showDots,
    },
    dotSize: {
        type: ControlType.Number,
        title: "Rivet Size",
        min: 1,
        max: 20,
        step: 1,
        defaultValue: 4,
        hidden: (props) => !props.showDots,
    },
    pinColor: {
        type: ControlType.Color,
        title: "Pin Color",
        defaultValue: "#C08552",
        description: "Color of the default pin dot (used when no clip image)",
    },
    pinSize: {
        type: ControlType.Number,
        title: "Pin Size",
        min: 2,
        max: 60,
        step: 1,
        defaultValue: 8,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F5F1EA",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 16,
        description: "Rounds the four corners of the wire grid itself",
    },
    imageCornerRadius: {
        type: ControlType.Number,
        title: "Image Corners",
        min: 0,
        max: 60,
        step: 1,
        defaultValue: 6,
        description: "Default for all items. Each item can override it.",
    },
    clipImage: {
        type: ControlType.Image,
        title: "Clip Image",
        description:
            "Default pin/clip PNG for all items. Each item can use its own.",
    },
    clipSize: {
        type: ControlType.Number,
        title: "Clip Size",
        min: 4,
        max: 200,
        step: 1,
        defaultValue: 20,
        description: "Default clip size. Each item can override it.",
    },
    alignX: {
        type: ControlType.Enum,
        title: "Align X",
        options: ["left", "center"],
        optionTitles: ["Left", "Center"],
        displaySegmentedControl: true,
        defaultValue: "center",
        description: "Center: Column 0 is the middle, negatives go left",
    },
    alignY: {
        type: ControlType.Enum,
        title: "Align Y",
        options: ["top", "center"],
        optionTitles: ["Top", "Center"],
        displaySegmentedControl: true,
        defaultValue: "top",
        description: "Center: Row 0 is the middle, negatives go up",
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                column: {
                    type: ControlType.Number,
                    title: "Column",
                    min: -100,
                    max: 100,
                    step: 1,
                    defaultValue: 0,
                },
                row: {
                    type: ControlType.Number,
                    title: "Row",
                    min: -100,
                    max: 100,
                    step: 1,
                    defaultValue: 0,
                },
                image: {
                    type: ControlType.Image,
                    title: "Image",
                },
                shape: {
                    type: ControlType.Enum,
                    title: "Shape",
                    options: ["square", "portrait", "landscape", "custom"],
                    optionTitles: [
                        "Square",
                        "Portrait (Reel)",
                        "Landscape",
                        "Custom",
                    ],
                    defaultValue: "square",
                },
                size: {
                    type: ControlType.Number,
                    title: "Size",
                    min: 8,
                    max: 800,
                    step: 1,
                    defaultValue: 80,
                    description: "Long edge of the shape",
                    hidden: (props) => props.shape === "custom",
                },

                // ---- Custom size + lock ratio ----
                lockRatio: {
                    type: ControlType.Boolean,
                    title: "Lock Ratio",
                    defaultValue: false,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                    hidden: (props) => props.shape !== "custom",
                },
                ratioSource: {
                    type: ControlType.Enum,
                    title: "Ratio From",
                    options: ["image", "manual"],
                    optionTitles: ["Image", "Manual"],
                    displaySegmentedControl: true,
                    defaultValue: "image",
                    hidden: (props) =>
                        props.shape !== "custom" || !props.lockRatio,
                },
                ratioW: {
                    type: ControlType.Number,
                    title: "Ratio W",
                    min: 1,
                    max: 100,
                    step: 1,
                    defaultValue: 4,
                    hidden: (props) =>
                        props.shape !== "custom" ||
                        !props.lockRatio ||
                        props.ratioSource !== "manual",
                },
                ratioH: {
                    type: ControlType.Number,
                    title: "Ratio H",
                    min: 1,
                    max: 100,
                    step: 1,
                    defaultValue: 5,
                    hidden: (props) =>
                        props.shape !== "custom" ||
                        !props.lockRatio ||
                        props.ratioSource !== "manual",
                },
                customWidth: {
                    type: ControlType.Number,
                    title: "Width",
                    min: 8,
                    max: 800,
                    step: 1,
                    defaultValue: 80,
                    hidden: (props) => props.shape !== "custom",
                },
                customHeight: {
                    type: ControlType.Number,
                    title: "Height",
                    min: 8,
                    max: 800,
                    step: 1,
                    defaultValue: 80,
                    description: "Hidden while Lock Ratio is on",
                    hidden: (props) =>
                        props.shape !== "custom" || props.lockRatio,
                },

                // ---- Per-item corner radius ----
                customRadius: {
                    type: ControlType.Boolean,
                    title: "Corner Radius",
                    defaultValue: false,
                    enabledTitle: "Custom",
                    disabledTitle: "Global",
                },
                radius: {
                    type: ControlType.BorderRadius,
                    title: "Radius",
                    defaultValue: "6px",
                    hidden: (props) => !props.customRadius,
                },

                rotation: {
                    type: ControlType.Number,
                    title: "Rotation",
                    min: -45,
                    max: 45,
                    step: 1,
                    defaultValue: 0,
                },
                opacity: {
                    type: ControlType.Number,
                    title: "Opacity",
                    min: 0,
                    max: 1,
                    step: 0.05,
                    defaultValue: 1,
                },
                anchor: {
                    type: ControlType.Enum,
                    title: "Anchor",
                    options: ["top", "center"],
                    optionTitles: ["Hangs Below", "Centered"],
                    defaultValue: "top",
                },

                // ---- Per-item clip ----
                showClip: {
                    type: ControlType.Boolean,
                    title: "Show Clip",
                    defaultValue: true,
                },
                clipImage: {
                    type: ControlType.Image,
                    title: "Clip Image",
                    description: "Leave empty to use the global clip",
                    hidden: (props) => !props.showClip,
                },
                clipSize: {
                    type: ControlType.Number,
                    title: "Clip Size",
                    min: 0,
                    max: 200,
                    step: 1,
                    defaultValue: 0,
                    description: "0 = use the global clip size",
                    hidden: (props) => !props.showClip,
                },
            },
        },
        defaultValue: defaultItems,
    },
})
