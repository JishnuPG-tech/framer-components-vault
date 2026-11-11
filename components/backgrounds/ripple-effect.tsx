// Interactive background ripple effect component with grid cells that animate on click
import React, { useMemo, useRef, useState, startTransition, useCallback, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView } from "framer-motion"

interface BackgroundRippleEffectProps {
    rows: number
    cols: number
    cellSize: number
    borderColor: string
    fillColor: string
    shadowColor: string
    opacity: number
    hoverOpacity: number
    animationDuration: number
    animationDelay: number
    showShadow: boolean
    interactive: boolean
    shapeType: "square" | "circle" | "triangle" | "hexagon" | "diamond"
    style?: CSSProperties
}

/**
 * Interactive Background Ripple Effect
 * 
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function BackgroundRippleEffect(props: BackgroundRippleEffectProps) {
    const {
        rows = 8,
        cols = 27,
        cellSize = 56,
        borderColor = "#E5E5E5",
        fillColor = "#F5F5F5",
        shadowColor = "#CCCCCC",
        opacity = 40,
        hoverOpacity = 80,
        animationDuration = 200,
        animationDelay = 55,
        showShadow = true,
        interactive = true,
        shapeType = "square",
    } = props

    const [clickedCell, setClickedCell] = useState<{
        row: number
        col: number
    } | null>(null)
    const [rippleKey, setRippleKey] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()
    const isInView = useInView(containerRef, { once: false, margin: "100px" })

    // Optimize for large grids by limiting cell count
    const maxCells = 1000
    const totalCells = rows * cols
    const shouldVirtualize = totalCells > maxCells
    const actualRows = shouldVirtualize ? Math.min(rows, Math.floor(maxCells / cols)) : rows
    const actualCols = shouldVirtualize ? Math.min(cols, Math.floor(maxCells / rows)) : cols

    const cells = useMemo(
        () => Array.from({ length: actualRows * actualCols }, (_, idx) => idx),
        [actualRows, actualCols]
    )

    const gridStyle: CSSProperties = {
        display: "grid",
        gridTemplateColumns: `repeat(${actualCols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${actualRows}, ${cellSize}px)`,
        width: actualCols * cellSize,
        height: actualRows * cellSize,
        margin: "0 auto",
        willChange: "transform",
        transform: "translate3d(0, 0, 0)", // Force hardware acceleration
    }

    const handleCellClick = useCallback((rowIdx: number, colIdx: number) => {
        if (!interactive || isStatic) return
        
        startTransition(() => {
            setClickedCell({ row: rowIdx, col: colIdx })
            setRippleKey(k => k + 1)
        })
    }, [interactive, isStatic])

    // Don't animate if not in view or static renderer
    const shouldAnimate = isInView && !isStatic

    const getShapeStyles = useCallback((shape: string): CSSProperties => {
        const baseSize = cellSize - 2 // Account for border
        
        switch (shape) {
            case "circle":
                return {
                    borderRadius: "50%",
                    width: baseSize,
                    height: baseSize,
                }
            case "triangle":
                return {
                    width: 0,
                    height: 0,
                    backgroundColor: "transparent",
                    borderLeft: `${baseSize / 2}px solid transparent`,
                    borderRight: `${baseSize / 2}px solid transparent`,
                    borderBottom: `${baseSize}px solid ${fillColor}`,
                    border: "none",
                }
            case "hexagon":
                return {
                    width: baseSize,
                    height: baseSize * 0.866, // Height for hexagon ratio
                    clipPath: "polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)",
                }
            case "diamond":
                return {
                    width: baseSize,
                    height: baseSize,
                    transform: "rotate(45deg)",
                    transformOrigin: "center",
                }
            default: // square
                return {
                    width: baseSize,
                    height: baseSize,
                }
        }
    }, [cellSize, fillColor])

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...props.style,
            }}
        >
            {/* Grid Background */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        zIndex: 3,
                        ...gridStyle,
                    }}
                >
                    {cells.map((idx) => {
                        const rowIdx = Math.floor(idx / actualCols)
                        const colIdx = idx % actualCols
                        const distance = clickedCell
                            ? Math.hypot(clickedCell.row - rowIdx, clickedCell.col - colIdx)
                            : 0
                        const delay = clickedCell ? Math.max(0, distance * animationDelay) : 0
                        const duration = animationDuration + distance * 80

                        return (
                            <motion.div
                                key={`${idx}-${rippleKey}`}
                                style={{
                                    position: "relative",
                                    backgroundColor: shapeType === "triangle" ? "transparent" : fillColor,
                                    border: shapeType === "triangle" ? "none" : `0.5px solid ${borderColor}`,
                                    opacity: opacity / 100,
                                    cursor: interactive ? "pointer" : "default",
                                    pointerEvents: interactive ? "auto" : "none",
                                    willChange: shouldAnimate ? "transform, opacity" : "auto",
                                    transform: "translate3d(0, 0, 0)", // Force hardware acceleration
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    ...getShapeStyles(shapeType),
                                    ...(showShadow && shapeType !== "triangle" && {
                                        boxShadow: `0px 0px 40px 1px ${shadowColor} inset`,
                                    }),
                                }}
                                onClick={() => handleCellClick(rowIdx, colIdx)}
                                whileHover={
                                    interactive && shouldAnimate
                                        ? {
                                              opacity: hoverOpacity / 100,
                                              transition: { duration: 0.15 },
                                          }
                                        : {}
                                }
                                animate={
                                    clickedCell && shouldAnimate
                                        ? {
                                              scale: [1, 1.1, 1],
                                              opacity: [opacity / 100, 1, opacity / 100],
                                          }
                                        : {}
                                }
                                transition={
                                    clickedCell && shouldAnimate
                                        ? {
                                              delay: delay / 1000,
                                              duration: Math.min(duration / 1000, 2), // Cap max duration
                                              ease: "easeOut",
                                          }
                                        : {}
                                }
                            />
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(BackgroundRippleEffect, {
    shapeType: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["square", "circle", "triangle", "hexagon"],
        optionTitles: ["Square", "Circle", "Triangle", "Hexagon"],
        defaultValue: "square",
        displaySegmentedControl: false,
    },
    rows: {
        type: ControlType.Number,
        title: "Rows",
        defaultValue: 8,
        min: 3,
        max: 20,
        step: 1,
        displayStepper: true,
    },
    cols: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 27,
        min: 5,
        max: 50,
        step: 1,
        displayStepper: true,
    },
    cellSize: {
        type: ControlType.Number,
        title: "Cell Size",
        defaultValue: 56,
        min: 20,
        max: 100,
        step: 1,
        unit: "px",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#E5E5E5",
    },
    fillColor: {
        type: ControlType.Color,
        title: "Fill Color",
        defaultValue: "#F5F5F5",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "#CCCCCC",
        hidden: ({ showShadow }) => !showShadow,
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 40,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    hoverOpacity: {
        type: ControlType.Number,
        title: "Hover Opacity",
        defaultValue: 80,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 200,
        min: 50,
        max: 1000,
        step: 10,
        unit: "ms",
    },
    animationDelay: {
        type: ControlType.Number,
        title: "Animation Delay",
        defaultValue: 55,
        min: 0,
        max: 200,
        step: 5,
        unit: "ms",
    },
    showShadow: {
        type: ControlType.Boolean,
        title: "Show Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    interactive: {
        type: ControlType.Boolean,
        title: "Interactive",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})