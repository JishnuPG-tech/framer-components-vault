import * as React from "react"
import { useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Props = {
    items: React.ReactNode[]
    columns: number
    rows: number
    gap: number
    gridTransition: number
    hoverGridSize: number
}
/**
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 800
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function GridHoverImageInstances({
    items = [],
    columns = 3,
    rows = 3,
    gap = 10,
    gridTransition = 0.3,
    hoverGridSize = 2,
}: Props) {
    const ref = useRef<HTMLDivElement | null>(null)
    const hoverId = useRef<number>(-1)

    // injectăm CSS o singură dată / la schimbarea gridTransition
    useEffect(() => {
        const styleId = "dynamic-frame-style"
        const existing = document.getElementById(styleId)
        if (existing) existing.remove()

        const style = document.createElement("style")
        style.id = styleId
        style.innerHTML = `
            .dynamic-frame {
                position: relative;
                width: 100%;
                height: 100%;
                display: grid;
                transition: grid-template-rows ${gridTransition}s, grid-template-columns ${gridTransition}s, gap ${gridTransition}s;
                overflow: hidden;
            }
            .dynamic-frame .cell {
                position: relative;
                width: 100%;
                height: 100%;
                overflow: hidden;
                transition: width ${gridTransition}s ease-in-out, height ${gridTransition}s ease-in-out;
            }
            /* Forțăm instanța să umple celula, fără să depindem de <img/> */
            .dynamic-frame .cell > * {
                position: absolute !important;
                inset: 0 !important;
                width: 100% !important;
                height: 100% !important;
            }
        `
        document.head.appendChild(style)
    }, [gridTransition])

    const applyGrid = () => {
        const grid = ref.current
        if (!grid) return

        const id = hoverId.current
        grid.style.gap = `${gap}px`

        // când nu e hover, totul e 1fr
        if (id < 0) {
            grid.style.gridTemplateColumns = Array.from({ length: columns })
                .map(() => "1fr")
                .join(" ")
            grid.style.gridTemplateRows = Array.from({ length: rows })
                .map(() => "1fr")
                .join(" ")
            return
        }

        // determinăm col/row pentru celula hover
        const col = id % columns
        const row = Math.floor(id / columns)

        grid.style.gridTemplateColumns = Array.from({ length: columns })
            .map((_, i) => (i === col ? `${hoverGridSize}fr` : "1fr"))
            .join(" ")

        grid.style.gridTemplateRows = Array.from({ length: rows })
            .map((_, i) => (i === row ? `${hoverGridSize}fr` : "1fr"))
            .join(" ")
    }

    useEffect(() => {
        applyGrid()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gap, rows, columns, hoverGridSize])

    const onHover = (id: number) => {
        if (hoverId.current === id) return
        hoverId.current = id
        applyGrid()
    }

    const onHoverOff = () => {
        hoverId.current = -1
        applyGrid()
    }

    return (
        <div
            className="dynamic-frame"
            ref={ref}
            onMouseLeave={onHoverOff}
            style={{
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
                gap,
            }}
        >
            {items.map((node, i) => (
                <div className="cell" key={i} onMouseEnter={() => onHover(i)}>
                    {node}
                </div>
            ))}
        </div>
    )
}

addPropertyControls(GridHoverImageInstances, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 50,
        propertyControl: {
            type: ControlType.ComponentInstance,
            title: "Instance",
        },
        defaultValue: [],
        description: "UPDATE: Now you can connect CMS Images.",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 10,
        min: 0,
        max: 50,
        step: 1,
        displayStepper: true,
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 3,
        min: 1,
        max: 20,
        step: 1,
        displayStepper: true,
    },
    rows: {
        type: ControlType.Number,
        title: "Rows",
        defaultValue: 3,
        min: 1,
        max: 20,
        step: 1,
        displayStepper: true,
    },
    gridTransition: {
        type: ControlType.Number,
        title: "Grid Transition",
        defaultValue: 0.3,
        min: 0,
        max: 2,
        step: 0.1,
        displayStepper: true,
    },
    hoverGridSize: {
        type: ControlType.Number,
        title: "Hover Size (fr)",
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 0.1,
        displayStepper: true,
        description: "Made by [OtVos Studio](https://x.com/OtVosStudio)",
    },
})
