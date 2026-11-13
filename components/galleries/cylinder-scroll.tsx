// CylinderScrollGallery.tsx
// Framer Code Component
// Created by Ahmet Loca

import { useRef, useEffect, useMemo, useCallback } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ImageItem {
    src: string
    alt?: string
}

interface Props {
    width?: number
    height?: number
    images: ImageItem[]
    rows?: number
    columns?: number
    cylinderRadius?: number
    cardWidth?: number
    cardHeight?: number
    gap?: number
    borderRadius?: number
    rotationSpeed?: number
    tiltAngle?: number
}

export default function CylinderScrollGallery(props: Props) {
    const {
        width,
        images = [],
        rows = 3,
        columns = 6,
        cylinderRadius = 320,
        cardWidth = 320,
        cardHeight = 280,
        gap = 16,
        borderRadius = 18,
        rotationSpeed = 2.2,
        tiltAngle = -12,
    } = props

    const isStatic = useIsStaticRenderer()

    const cylinderRef = useRef<HTMLDivElement>(null)
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])
    const rafRef = useRef<number | null>(null)
    const autoRotRef = useRef(0)
    const smoothRotRef = useRef(0)
    const lastTimeRef = useRef<number | null>(null)

    // ── Prop refs — RAF reads these without triggering restart ────────────────
    const rotationSpeedRef = useRef(rotationSpeed)
    const tiltAngleRef = useRef(tiltAngle)
    useEffect(() => {
        rotationSpeedRef.current = rotationSpeed
        tiltAngleRef.current = tiltAngle
    }, [rotationSpeed, tiltAngle])

    // ── Memoized derived values ───────────────────────────────────────────────
    const { effectiveColumns, angleStep, totalCells } = useMemo(() => {
        const effectiveColumns =
            images.length > 0
                ? Math.max(columns, Math.ceil(images.length / rows))
                : columns
        return {
            effectiveColumns,
            angleStep: 360 / effectiveColumns,
            totalCells: rows * effectiveColumns,
        }
    }, [images.length, columns, rows])

    const { totalRowHeight, autoHeight } = useMemo(() => {
        const totalRowHeight = rows * cardHeight + (rows - 1) * gap
        return {
            totalRowHeight,
            autoHeight: totalRowHeight + Math.max(160, cylinderRadius * 0.25),
        }
    }, [rows, cardHeight, gap, cylinderRadius])

    // ── Memoized card layout — flat array, no nested maps ────────────────────
    const cardCells = useMemo(() => {
        return Array.from({ length: totalCells }, (_, cellIndex) => {
            const rowIndex = Math.floor(cellIndex / effectiveColumns)
            const colIndex = cellIndex % effectiveColumns
            const angle = colIndex * angleStep
            const rad = (angle * Math.PI) / 180
            return {
                cellIndex,
                rowIndex,
                colIndex,
                angle,
                x: Math.sin(rad) * cylinderRadius,
                z: Math.cos(rad) * cylinderRadius,
                rowY: rowIndex * (cardHeight + gap),
            }
        })
    }, [
        totalCells,
        effectiveColumns,
        angleStep,
        cylinderRadius,
        cardHeight,
        gap,
    ])

    // ── Memoized filled image array ───────────────────────────────────────────
    const filled: (ImageItem | null)[] = useMemo(
        () =>
            Array.from({ length: totalCells }, (_, i) =>
                images.length > 0 ? images[i % images.length] : null
            ),
        [images, totalCells]
    )

    // ── getSrc — stable across renders ───────────────────────────────────────
    const getSrc = useCallback((img: ImageItem | null | undefined): string => {
        return img?.src ?? ""
    }, [])

    // ── Stable ref callback factory ───────────────────────────────────────────
    // useMemo so the same function is reused per cellIndex across renders
    const getRefCallback = useMemo(() => {
        const cache: Record<number, (el: HTMLDivElement | null) => void> = {}
        return (cellIndex: number) => {
            if (!cache[cellIndex]) {
                cache[cellIndex] = (el: HTMLDivElement | null) => {
                    cardRefs.current[cellIndex] = el
                }
            }
            return cache[cellIndex]
        }
    }, []) // stable for component lifetime

    // ── RAF loop — only restarts on effectiveColumns/totalCells/isStatic ──────
    useEffect(() => {
        const prev = cardRefs.current
        cardRefs.current = Array.from(
            { length: totalCells },
            (_, i) => prev[i] ?? null
        )
        autoRotRef.current = smoothRotRef.current

        if (isStatic) {
            if (cylinderRef.current) {
                cylinderRef.current.style.transform = `rotateX(${tiltAngleRef.current}deg) rotateY(0deg)`
            }
            const angleStepStatic = 360 / effectiveColumns
            cardRefs.current.forEach((card, idx) => {
                if (!card) return
                const colIndex = idx % effectiveColumns
                const angle = colIndex * angleStepStatic
                const effectiveAngle = ((angle % 360) + 360) % 360
                const distFromFront =
                    effectiveAngle > 180 ? 360 - effectiveAngle : effectiveAngle
                const fadeStart = 30
                const visibilityThreshold = 50
                const opacity =
                    distFromFront <= fadeStart
                        ? 1
                        : distFromFront >= visibilityThreshold
                          ? 0
                          : 1 -
                            (distFromFront - fadeStart) /
                                (visibilityThreshold - fadeStart)
                card.style.opacity = String(opacity)
            })
            return () => {}
        }

        // Cache angleStep in a local var for the RAF closure
        const angleStepLocal = 360 / effectiveColumns

        const tick = (timestamp: number) => {
            const delta = lastTimeRef.current
                ? Math.min((timestamp - lastTimeRef.current) / 1000, 0.1)
                : 0.016
            lastTimeRef.current = timestamp

            autoRotRef.current += delta * rotationSpeedRef.current * 18
            smoothRotRef.current +=
                (autoRotRef.current - smoothRotRef.current) * 0.06

            const rot = smoothRotRef.current

            if (cylinderRef.current) {
                cylinderRef.current.style.transform = `rotateX(${tiltAngleRef.current}deg) rotateY(${rot}deg)`
            }

            cardRefs.current.forEach((card, idx) => {
                if (!card) return
                const colIndex = idx % effectiveColumns
                const angle = colIndex * angleStepLocal
                const effectiveAngle = (((angle + rot) % 360) + 360) % 360
                const distFromFront =
                    effectiveAngle > 180 ? 360 - effectiveAngle : effectiveAngle
                const fadeStart = 30
                const visibilityThreshold = 50
                const opacity =
                    distFromFront <= fadeStart
                        ? 1
                        : distFromFront >= visibilityThreshold
                          ? 0
                          : 1 -
                            (distFromFront - fadeStart) /
                                (visibilityThreshold - fadeStart)
                card.style.opacity = String(opacity)
            })

            rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            lastTimeRef.current = null
        }
    }, [effectiveColumns, totalCells, isStatic])
    // rotationSpeed and tiltAngle are read from refs — no restart needed

    if (images.length === 0) {
        return (
            <div
                style={{
                    width: width ?? "100%",
                    height: autoHeight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 12,
                    border: "1.5px dashed rgba(255,255,255,0.15)",
                }}
            >
                <span
                    style={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: 14,
                        fontFamily: "sans-serif",
                        textAlign: "center",
                        lineHeight: 1.6,
                    }}
                >
                    Add images in the
                    <br />
                    Properties Panel →
                </span>
            </div>
        )
    }

    return (
        <div
            style={{
                width: width ?? "100%",
                height: autoHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                perspective: `${cylinderRadius * 2.8}px`,
                perspectiveOrigin: "50% 50%",
                overflow: "visible",
                background: "transparent",
            }}
        >
            <div
                ref={cylinderRef}
                style={{
                    position: "relative",
                    width: cardWidth,
                    height: totalRowHeight,
                    transformStyle: "preserve-3d",
                    transform: `rotateX(${tiltAngle}deg) rotateY(0deg)`,
                    willChange: "transform",
                }}
            >
                {cardCells.map(({ cellIndex, angle, x, z, rowY }) => {
                    const img = filled[cellIndex]
                    const src = getSrc(img)

                    return (
                        <div
                            key={`${cellIndex}`}
                            ref={getRefCallback(cellIndex)}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: "50%",
                                width: cardWidth,
                                height: cardHeight,
                                marginTop: rowY,
                                marginLeft: -cardWidth / 2,
                                transform: `translate3d(${x}px,0px,${z}px) rotateY(${angle}deg)`,
                                transformStyle: "preserve-3d",
                                borderRadius,
                                overflow: "hidden",
                                opacity: 1,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                                backfaceVisibility: "hidden",
                                willChange: "opacity",
                            }}
                        >
                            {src ? (
                                <img
                                    src={src}
                                    alt={img?.alt || ""}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                        pointerEvents: "none",
                                        userSelect: "none",
                                    }}
                                    draggable={false}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        background: `hsl(${(cellIndex * 43) % 360},18%,${10 + (cellIndex % 5) * 3}%)`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <span
                                        style={{
                                            color: "rgba(255,255,255,0.12)",
                                            fontSize: 13,
                                            fontFamily: "monospace",
                                        }}
                                    >
                                        {cellIndex + 1}
                                    </span>
                                </div>
                            )}
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background:
                                        "linear-gradient(135deg,rgba(255,255,255,0.08) 0%,transparent 40%,rgba(0,0,0,0.25) 100%)",
                                    pointerEvents: "none",
                                    borderRadius,
                                }}
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(CylinderScrollGallery, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            controls: {
                src: { type: ControlType.Image, title: "Image" },
                alt: {
                    type: ControlType.String,
                    title: "Alt text",
                    defaultValue: "",
                },
            },
        },
    },
    rows: {
        type: ControlType.Number,
        title: "Rows",
        defaultValue: 3,
        min: 1,
        max: 5,
        step: 1,
        displayStepper: true,
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 6,
        min: 3,
        max: 12,
        step: 1,
        displayStepper: true,
    },
    cylinderRadius: {
        type: ControlType.Number,
        title: "Cylinder Radius",
        defaultValue: 320,
        min: 200,
        max: 1200,
        step: 20,
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 320,
        min: 100,
        max: 600,
        step: 10,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 280,
        min: 100,
        max: 500,
        step: 10,
    },
    gap: {
        type: ControlType.Number,
        title: "Row Gap",
        defaultValue: 16,
        min: 0,
        max: 60,
        step: 2,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 18,
        min: 0,
        max: 40,
        step: 2,
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Rotation Speed",
        defaultValue: 2.2,
        min: 0.1,
        max: 5,
        step: 0.1,
    },
    tiltAngle: {
        type: ControlType.Number,
        title: "Tilt Angle",
        defaultValue: -12,
        min: -45,
        max: 45,
        step: 1,
        displayStepper: true,
    },
})
