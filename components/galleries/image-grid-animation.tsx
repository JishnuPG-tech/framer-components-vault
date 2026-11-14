// ImageGridAnimation.tsx
// ─────────────────────────────────────────────
// Designed & developed by Ahmet Loca
// Framer Marketplace — ImageGridAnimation
// ─────────────────────────────────────────────

import React, { useEffect, useMemo, useRef, useState } from "react"
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
 * @framerSupportedLayoutWidth auto-prefer-fixed
 * @framerSupportedLayoutHeight auto-prefer-fixed
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 500
 */

type RevealDirection =
    | "random"
    | "left-to-right"
    | "top-to-bottom"
    | "center-out"

interface Props {
    image?: string
    borderRadius?: number
    pixelSize?: number
    duration?: number
    backgroundColor?: string
    scaleFrom?: number
    revealDirection?: RevealDirection
    replayOnHover?: boolean
}

function buildOrderMap(
    total: number,
    cols: number,
    rows: number,
    direction: RevealDirection
): number[] {
    const arr = Array.from({ length: total }, (_, i) => i)
    if (direction === "random") {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[arr[i], arr[j]] = [arr[j], arr[i]]
        }
    } else if (direction === "left-to-right") {
        arr.sort((a, b) => (a % cols) - (b % cols))
    } else if (direction === "top-to-bottom") {
        arr.sort((a, b) => Math.floor(a / cols) - Math.floor(b / cols))
    } else if (direction === "center-out") {
        const cx = cols / 2
        const cy = rows / 2
        arr.sort((a, b) => {
            const dA = Math.hypot((a % cols) - cx, Math.floor(a / cols) - cy)
            const dB = Math.hypot((b % cols) - cx, Math.floor(b / cols) - cy)
            return dA - dB
        })
    }
    const orderMap = new Array(total)
    arr.forEach((pixelIdx, order) => {
        orderMap[pixelIdx] = order
    })
    return orderMap
}

export default function ImageGridAnimation({
    image = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80",
    borderRadius = 20,
    pixelSize = 20,
    duration = 1200,
    backgroundColor = "#111111",
    scaleFrom = 1.08,
    revealDirection = "random",
    replayOnHover = false,
}: Props) {
    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [revealed, setRevealed] = useState(false)
    const [pixels, setPixels] = useState<number[]>([])
    const [size, setSize] = useState({ w: 500, h: 500 })

    const cols = Math.ceil(size.w / pixelSize)
    const rows = Math.ceil(size.h / pixelSize)
    const total = cols * rows

    const cellDelays = useMemo(() => {
        return Array.from({ length: total }, (_, idx) => {
            const order = pixels[idx] ?? idx
            return (order / total) * (duration / 1000)
        })
    }, [pixels, total, duration])

    useEffect(() => {
        return () => {
            if (hoverTimerRef.current !== null)
                clearTimeout(hoverTimerRef.current)
        }
    }, [])

    useEffect(() => {
        if (isStatic) return
        const el = containerRef.current
        if (!el) return
        const ro = new ResizeObserver(([entry]) => {
            const { width: w, height: h } = entry.contentRect
            if (w > 0 && h > 0) setSize({ w, h })
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [isStatic])

    useEffect(() => {
        if (isStatic) return
        setPixels(buildOrderMap(total, cols, rows, revealDirection))
        setRevealed(false)
    }, [isStatic, total, cols, rows, revealDirection])

    useEffect(() => {
        if (isStatic) return
        const el = containerRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setRevealed(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.1 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [isStatic, pixels.length])

    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius,
                    overflow: "hidden",
                    position: "relative",
                    background: backgroundColor,
                }}
            >
                <img
                    src={image}
                    draggable={false}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            onMouseEnter={() => {
                if (replayOnHover && revealed) {
                    setRevealed(false)
                    if (hoverTimerRef.current !== null)
                        clearTimeout(hoverTimerRef.current)
                    hoverTimerRef.current = setTimeout(
                        () => setRevealed(true),
                        50
                    )
                }
            }}
            style={{
                width: "100%",
                height: "100%",
                borderRadius,
                overflow: "hidden",
                position: "relative",
                background: backgroundColor,
            }}
        >
            <img
                src={image}
                draggable={false}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    transform: revealed ? "scale(1)" : `scale(${scaleFrom})`,
                    transition: revealed
                        ? `transform ${(duration / 1000).toFixed(2)}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`
                        : "none",
                    willChange: "transform",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    gridTemplateColumns: `repeat(${cols}, ${pixelSize}px)`,
                    gridTemplateRows: `repeat(${rows}, ${pixelSize}px)`,
                    pointerEvents: "none",
                }}
            >
                {Array.from({ length: total }, (_, idx) => {
                    const delay = cellDelays[idx] ?? 0
                    return (
                        <div
                            key={idx}
                            style={{
                                width: pixelSize,
                                height: pixelSize,
                                background: backgroundColor,
                                opacity: revealed ? 0 : 1,
                                transition: revealed
                                    ? `opacity 0.2s ease ${delay.toFixed(3)}s`
                                    : "none",
                            }}
                        />
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(ImageGridAnimation, {
    image: { type: ControlType.Image, title: "Image" },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 20,
        min: 0,
        max: 60,
        step: 2,
    },
    pixelSize: {
        type: ControlType.Number,
        title: "Pixel Size",
        defaultValue: 20,
        min: 10,
        max: 80,
        step: 2,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration (ms)",
        defaultValue: 1200,
        min: 300,
        max: 4000,
        step: 100,
    },
    scaleFrom: {
        type: ControlType.Number,
        title: "Scale From",
        defaultValue: 1.08,
        min: 1,
        max: 1.5,
        step: 0.01,
    },
    revealDirection: {
        type: ControlType.Enum,
        title: "Reveal Direction",
        options: ["random", "left-to-right", "top-to-bottom", "center-out"],
        optionTitles: [
            "Random",
            "Left to Right",
            "Top to Bottom",
            "Center Out",
        ],
        defaultValue: "random",
        displaySegmentedControl: false,
    },
    replayOnHover: {
        type: ControlType.Boolean,
        title: "Replay on Hover",
        defaultValue: false,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Pixel Color",
        defaultValue: "#111111",
    },
})

// ─── Demo Component ───────────────────────────────────────────────────────────

type Direction = RevealDirection

interface DemoProps {
    image?: string
    pixelSize?: number
    duration?: number
    backgroundColor?: string
    scaleFrom?: number
    activeColor?: string
    buttonBackground?: string
    buttonRadius?: number
    labelColor?: string
    labelActiveColor?: string
    fontFamily?: string
}

function PixelGridCore({
    image,
    pixelSize,
    duration,
    backgroundColor,
    scaleFrom,
    direction,
    trigger,
}: {
    image: string
    pixelSize: number
    duration: number
    backgroundColor: string
    scaleFrom: number
    direction: Direction
    trigger: number
}) {
    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const [revealed, setRevealed] = useState(false)
    const [pixels, setPixels] = useState<number[]>([])
    const [size, setSize] = useState({ w: 500, h: 400 })

    const cols = Math.ceil(size.w / pixelSize)
    const rows = Math.ceil(size.h / pixelSize)
    const total = cols * rows

    const cellDelays = useMemo(() => {
        return Array.from({ length: total }, (_, idx) => {
            const order = pixels[idx] ?? idx
            return (order / total) * (duration / 1000)
        })
    }, [pixels, total, duration])

    useEffect(() => {
        if (isStatic) return
        const el = containerRef.current
        if (!el) return
        const ro = new ResizeObserver(([entry]) => {
            const { width: w, height: h } = entry.contentRect
            if (w > 0 && h > 0) setSize({ w, h })
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [isStatic])

    useEffect(() => {
        if (isStatic) return
        setPixels(buildOrderMap(total, cols, rows, direction))
        setRevealed(false)
        const t = setTimeout(() => setRevealed(true), 50)
        return () => clearTimeout(t)
    }, [isStatic, total, cols, rows, direction, trigger])

    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                    background: backgroundColor,
                }}
            >
                <img
                    src={image}
                    draggable={false}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                background: backgroundColor,
            }}
        >
            <img
                src={image}
                draggable={false}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    transform: revealed ? "scale(1)" : `scale(${scaleFrom})`,
                    transition: revealed
                        ? `transform ${(duration / 1000).toFixed(2)}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`
                        : "none",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    gridTemplateColumns: `repeat(${cols}, ${pixelSize}px)`,
                    gridTemplateRows: `repeat(${rows}, ${pixelSize}px)`,
                    pointerEvents: "none",
                }}
            >
                {Array.from({ length: total }, (_, idx) => {
                    const delay = cellDelays[idx] ?? 0
                    return (
                        <div
                            key={idx}
                            style={{
                                width: pixelSize,
                                height: pixelSize,
                                background: backgroundColor,
                                opacity: revealed ? 0 : 1,
                                transition: revealed
                                    ? `opacity 0.2s ease ${delay.toFixed(3)}s`
                                    : "none",
                            }}
                        />
                    )
                })}
            </div>
        </div>
    )
}

const DIRECTIONS: { key: Direction; label: string }[] = [
    { key: "random", label: "Random" },
    { key: "left-to-right", label: "Left to Right" },
    { key: "top-to-bottom", label: "Top to Bottom" },
    { key: "center-out", label: "Center Out" },
]

export function ImageGridAnimationDemo({
    image = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80",
    pixelSize = 20,
    duration = 1200,
    backgroundColor = "#111111",
    scaleFrom = 1.08,
    activeColor = "#ffffff",
    buttonBackground = "#1a1a1a",
    buttonRadius = 100,
    labelColor = "#ABABAB",
    labelActiveColor = "#ffffff",
    fontFamily = "Inter",
}: DemoProps) {
    const [active, setActive] = useState<Direction>("random")
    const [trigger, setTrigger] = useState(0)

    const handleSelect = (dir: Direction) => {
        setActive(dir)
        setTrigger((t) => t + 1)
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 12,
            }}
        >
            <div style={{ flex: 1, borderRadius: 16, overflow: "hidden" }}>
                <PixelGridCore
                    image={image}
                    pixelSize={pixelSize}
                    duration={duration}
                    backgroundColor={backgroundColor}
                    scaleFrom={scaleFrom}
                    direction={active}
                    trigger={trigger}
                />
            </div>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    alignItems: "center",
                    flexShrink: 0,
                    paddingTop: 16,
                }}
            >
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 500,
                        fontFamily,
                        color: "#555",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                    }}
                >
                    Reveal Direction
                </span>
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        justifyContent: "center",
                    }}
                >
                    {DIRECTIONS.map(({ key, label }) => {
                        const isActive = active === key
                        return (
                            <button
                                key={key}
                                onClick={() => handleSelect(key)}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: buttonRadius,
                                    border: isActive
                                        ? `1px solid ${activeColor}`
                                        : "1px solid #333",
                                    background: isActive
                                        ? activeColor
                                        : buttonBackground,
                                    color: isActive
                                        ? labelActiveColor
                                        : labelColor,
                                    fontSize: 14,
                                    fontWeight: 500,
                                    fontFamily,
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {label}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(ImageGridAnimationDemo, {
    image: { type: ControlType.Image, title: "Image" },
    pixelSize: {
        type: ControlType.Number,
        title: "Pixel Size",
        defaultValue: 20,
        min: 10,
        max: 80,
        step: 2,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration (ms)",
        defaultValue: 1200,
        min: 300,
        max: 4000,
        step: 100,
    },
    scaleFrom: {
        type: ControlType.Number,
        title: "Scale From",
        defaultValue: 1.08,
        min: 1,
        max: 1.5,
        step: 0.01,
    },
    activeColor: {
        type: ControlType.Color,
        title: "Active Button Color",
        defaultValue: "#ffffff",
    },
    buttonBackground: {
        type: ControlType.Color,
        title: "Button Background",
        defaultValue: "#1a1a1a",
    },
    buttonRadius: {
        type: ControlType.Number,
        title: "Button Radius",
        defaultValue: 100,
        min: 0,
        max: 100,
        step: 2,
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "#ABABAB",
    },
    labelActiveColor: {
        type: ControlType.Color,
        title: "Label Active Color",
        defaultValue: "#000000",
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: "Inter",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Pixel Color",
        defaultValue: "#111111",
    },
})
