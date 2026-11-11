// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"

interface SquareGridProps {
    columns: number
    squareCells: boolean
    rows: number
    color: string
    strokeWidth: number
    opacity: number
    border: boolean
    style?: CSSProperties
}

const MAX = 48
// Square cells on a tall, narrow frame can ask for thousands of rows.
const MAX_SQUARE_ROWS = 400
// Size used before the frame is measured (static HTML, first paint).
const FALLBACK = 1000

const clampCount = (n: number) =>
    Math.min(MAX, Math.max(1, Math.round(Number(n) || 1)))

/**
 * Square Grid
 *
 * Draws a line grid from two numbers instead of a switch per line.
 * Square cells on: set the columns, rows fill the height so every cell
 * stays square. Square cells off: exact columns and rows, cells stretch.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 */
export default function SquareGrid(props: SquareGridProps) {
    const { squareCells, color, strokeWidth, opacity, border, style } = props
    const columns = clampCount(props.columns)
    const rows = clampCount(props.rows)

    const ref = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState({ w: 0, h: 0 })

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const ro = new ResizeObserver(([entry]) => {
            // contentRect keeps fractional sizes, so edges land exactly.
            const { width, height } = entry.contentRect
            setSize({ w: width, h: height })
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const measured = size.w > 0 && size.h > 0
    // Square cells need the real size. Stretched cells can draw at once
    // in a stretched viewBox, so static HTML already shows the grid.
    if (!measured && squareCells) {
        return <div ref={ref} style={frameStyle(style, opacity)} />
    }

    const w = measured ? size.w : FALLBACK
    const h = measured ? size.h : FALLBACK
    const half = strokeWidth / 2
    const near = (a: number, b: number) => Math.abs(a - b) <= 0.5

    const xs: number[] = []
    const ys: number[] = []
    const pitchX = w / columns
    for (let i = 0; i <= columns; i++) xs.push(i * pitchX)

    if (squareCells) {
        // A partial last row is closed only by the outer border.
        for (let i = 0; i <= MAX_SQUARE_ROWS; i++) {
            const y = i * pitchX
            if (y > h + 0.5) break
            ys.push(Math.min(y, h))
        }
        if (ys[ys.length - 1] < h - 0.5) ys.push(h)
    } else {
        const pitchY = h / rows
        for (let i = 0; i <= rows; i++) ys.push(i * pitchY)
    }

    // Only edge lines are pulled inside the frame; inner lines stay put.
    const edgeX = (x: number) => near(x, 0) || near(x, w)
    const edgeY = (y: number) => near(y, 0) || near(y, h)
    const fitX = (x: number) =>
        measured && edgeX(x) ? (near(x, 0) ? half : w - half) : x
    const fitY = (y: number) =>
        measured && edgeY(y) ? (near(y, 0) ? half : h - half) : y

    // One path: drawn once, so crossings don't darken with a see-through colour.
    let d = ""
    for (const x of xs) {
        if (!border && edgeX(x)) continue
        const fx = fitX(x)
        d += `M${fx} 0V${h}`
    }
    for (const y of ys) {
        if (!border && edgeY(y)) continue
        const fy = fitY(y)
        d += `M0 ${fy}H${w}`
    }

    return (
        <div ref={ref} style={frameStyle(style, opacity)}>
            <svg
                viewBox={`0 0 ${w} ${h}`}
                preserveAspectRatio="none"
                width="100%"
                height="100%"
                style={{ position: "absolute", inset: 0, display: "block" }}
                shapeRendering="crispEdges"
                aria-hidden="true"
                focusable="false"
            >
                <path
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
        </div>
    )
}

function frameStyle(style: CSSProperties | undefined, opacity: number) {
    return {
        ...style,
        position: "relative",
        width: "100%",
        height: "100%",
        opacity,
        pointerEvents: "none",
    } as CSSProperties
}

addPropertyControls(SquareGrid, {
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 16,
        min: 1,
        max: MAX,
        step: 1,
        displayStepper: true,
    },
    squareCells: {
        type: ControlType.Boolean,
        title: "Square Cells",
        defaultValue: true,
        description: "On: rows fill the height and every cell stays square.",
    },
    rows: {
        type: ControlType.Number,
        title: "Rows",
        defaultValue: 9,
        min: 1,
        max: MAX,
        step: 1,
        displayStepper: true,
        hidden: (p: SquareGridProps) => p.squareCells,
    },
    color: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "#453B36",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Line Width",
        defaultValue: 1,
        min: 0.5,
        max: 10,
        step: 0.5,
        unit: "px",
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.05,
    },
    border: {
        type: ControlType.Boolean,
        title: "Outer Border",
        defaultValue: true,
    },
})
