// Instructions: Write a Framer code component called SlicedImage. It splits one image into a grid of tiles. Each tile can be individually shown or hidden to create an irregular grid effect. Property controls: Image, Columns, Rows, Gap, Border Radius, Visible Cells (array of booleans). Logic: CSS grid with background-position slicing, handle cols/rows === 1 edge cases. Defaults: cols 3, rows 4, gap 6, borderRadius 12, all visible, sample Unsplash placeholder.

import * as React from "react"
import { useMemo, useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type ResponsiveImageLike = {
    src: string
    srcSet?: string
    alt?: string
}

type SlicedImageProps = {
    image?: ResponsiveImageLike
    columns: number
    rows: number
    gap: number
    borderRadius: number
    visibleCells: boolean[]
    enableHover: boolean
    hoverScale: number
    hoverBrightness: number
    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SlicedImage(props: SlicedImageProps) {
    const {
        image = {
            src: "https://images.unsplash.com/photo-1520975682071-a4d8a8f5b0c8?auto=format&fit=crop&w=1400&q=80",
            alt: "Placeholder image",
        },
        columns,
        rows,
        gap,
        borderRadius,
        visibleCells,
        enableHover,
        hoverScale,
        hoverBrightness,
        style,
    } = props

    const [hoveredIndex, setHoveredIndex] = useState(-1)

    const cols = Math.max(1, Math.min(8, Math.round(columns || 1)))
    const rws = Math.max(1, Math.min(8, Math.round(rows || 1)))
    const total = cols * rws

    const vis = useMemo(() => {
        const base = Array.isArray(visibleCells) ? visibleCells : []
        if (base.length >= total) return base.slice(0, total)
        const padded = base.slice(0, total)
        while (padded.length < total) padded.push(true)
        return padded
    }, [visibleCells, total])

    const tiles = useMemo(() => {
        const bgSize = `${cols * 100}% ${rws * 100}%`
        const items: React.ReactNode[] = []

        for (let i = 0; i < total; i++) {
            const c = i % cols
            const r = Math.floor(i / cols)

            const xPct = cols === 1 ? 0 : (c / (cols - 1)) * 100
            const yPct = rws === 1 ? 0 : (r / (rws - 1)) * 100

            const isVisible = vis[i] !== false
            const isHovered = enableHover && hoveredIndex === i && isVisible

            items.push(
                <div
                    key={`${cols}x${rws}-${i}`}
                    aria-hidden={!isVisible}
                    onMouseEnter={
                        enableHover
                            ? () => {
                                  startTransition(() => setHoveredIndex(i))
                              }
                            : undefined
                    }
                    onMouseLeave={
                        enableHover
                            ? () => {
                                  startTransition(() => setHoveredIndex(-1))
                              }
                            : undefined
                    }
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        overflow: "hidden",
                        borderRadius,
                        opacity: isVisible ? 1 : 0,
                        pointerEvents: isVisible ? "auto" : "none",
                        transition: "opacity 0.2s ease",
                        zIndex: isHovered ? 1 : 0,
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage: `url(${image?.src || ""})`,
                            backgroundSize: bgSize,
                            backgroundPosition: `${xPct}% ${yPct}%`,
                            backgroundRepeat: "no-repeat",
                            transform: isHovered
                                ? `scale(${Math.max(1, Math.min(1.3, hoverScale || 1))})`
                                : "scale(1)",
                            filter: isHovered
                                ? `brightness(${Math.max(1, Math.min(2, hoverBrightness || 1))})`
                                : "brightness(1)",
                            transition: "transform 0.3s ease, filter 0.3s ease",
                            willChange: enableHover ? "transform, filter" : undefined,
                        }}
                    />
                </div>
            )
        }

        return items
    }, [cols, rws, total, vis, borderRadius, image?.src, enableHover, hoveredIndex, hoverScale, hoverBrightness])

    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rws}, 1fr)`,
                gap,
                overflow: "visible",
            }}
        >
            {tiles}
        </div>
    )
}

addPropertyControls(SlicedImage, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 3,
        min: 1,
        max: 8,
        step: 1,
        displayStepper: true,
    },
    rows: {
        type: ControlType.Number,
        title: "Rows",
        defaultValue: 4,
        min: 1,
        max: 8,
        step: 1,
        displayStepper: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 6,
        min: 0,
        max: 40,
        step: 1,
        displayStepper: true,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 12,
        min: 0,
        max: 80,
        step: 1,
        displayStepper: true,
    },
    enableHover: {
        type: ControlType.Boolean,
        title: "Enable Hover",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.08,
        min: 1,
        max: 1.3,
        step: 0.01,
        hidden: ({ enableHover }) => !enableHover,
    },
    hoverBrightness: {
        type: ControlType.Number,
        title: "Hover Brightness",
        defaultValue: 1.15,
        min: 1,
        max: 2,
        step: 0.05,
        hidden: ({ enableHover }) => !enableHover,
    },
    visibleCells: {
        type: ControlType.Array,
        title: "Visible Cells",
        maxCount: 64,
        defaultValue: new Array(64).fill(true),
        control: {
            type: ControlType.Boolean,
            defaultValue: true,
            enabledTitle: "Show",
            disabledTitle: "Hide",
        },
    },
})