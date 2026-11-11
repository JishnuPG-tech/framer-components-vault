"use client"

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


export interface CurvedTextMarqueeProps {
    text?: string
    speed?: number
    bend?: number
    size?: number
    height?: number
    color?: string
    showDemoPanel?: boolean
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 380
 */
export default function CurvedTextMarquee(props: CurvedTextMarqueeProps) {
    const {
        text = "Bend the line",
        speed = 90,
        bend = 70,
        size = 56,
        height = 280,
        color = "#ffffff",
        showDemoPanel = true,
        style,
    } = props

    // Tüm sayıları güvenceye al
    const safeHeight = Number.isFinite(height) ? Math.max(120, height) : 280
    const safeBend = Number.isFinite(bend) ? Math.abs(bend) : 70
    const safeSize = Number.isFinite(size) ? Math.max(16, size) : 56
    const safeSpeed = Number.isFinite(speed) ? Math.max(10, speed) : 90

    const isPreview = RenderTarget.current() === RenderTarget.preview
    const shouldAnimate = isPreview

    const id = React.useId().replace(/:/g, "")
    const boxRef = React.useRef<HTMLDivElement>(null)
    const pathRef = React.useRef<SVGPathElement>(null)
    const flowRef = React.useRef<SVGTextPathElement>(null)

    const [width, setWidth] = React.useState(900)
    const [localSize, setLocalSize] = React.useState(safeSize)
    const [variant, setVariant] = React.useState<"down" | "up">("down")

    const line = `${text || "Bend the line"}  •  `
    const mid = safeHeight / 2
    const currentBend = variant === "up" ? -safeBend : safeBend

    const makePath = (w: number, depth: number) => {
        const safeW = Math.max(400, Number.isFinite(w) ? w : 900)
        const y1 = mid - depth * 0.35
        const y2 = mid + depth
        const y3 = mid - depth * 0.35
        return `M -60 ${y1} Q ${safeW / 2} ${y2} ${safeW + 60} ${y3}`
    }

    React.useEffect(() => {
        const el = boxRef.current
        if (!el) return

        const update = () => {
            const rect = el.getBoundingClientRect()
            if (rect.width > 200) setWidth(Math.round(rect.width))
        }

        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    React.useEffect(() => {
        if (!shouldAnimate) {
            if (pathRef.current) {
                pathRef.current.setAttribute("d", makePath(width, currentBend))
            }
            return
        }

        let raf = 0
        let last = performance.now()
        let offset = 0

        const tick = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000)
            last = now
            offset = (offset + safeSpeed * dt) % 2000

            if (pathRef.current) {
                pathRef.current.setAttribute("d", makePath(width, currentBend))
            }
            if (flowRef.current) {
                flowRef.current.setAttribute(
                    "startOffset",
                    (-offset).toFixed(1)
                )
            }

            raf = requestAnimationFrame(tick)
        }

        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [shouldAnimate, width, safeSpeed, currentBend, safeHeight])

    const sizePresets = { S: 36, M: 56, L: 80 }
    const currentKey = localSize <= 42 ? "S" : localSize <= 68 ? "M" : "L"

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: showDemoPanel ? safeHeight + 76 : safeHeight,
                ...style,
            }}
        >
            <div
                ref={boxRef}
                style={{
                    width: "100%",
                    height: safeHeight,
                    color,
                    overflow: "hidden",
                }}
            >
                <svg
                    viewBox={`0 0 ${Math.max(400, width)} ${safeHeight}`}
                    width="100%"
                    height={safeHeight}
                    style={{ display: "block" }}
                >
                    <defs>
                        <path
                            ref={pathRef}
                            id={id}
                            d={makePath(width, currentBend)}
                            fill="none"
                        />
                    </defs>

                    <text
                        fontSize={localSize}
                        fill="currentColor"
                        style={{
                            fontWeight: 600,
                            fontFamily: "system-ui, -apple-system, sans-serif",
                        }}
                    >
                        <textPath ref={flowRef} href={`#${id}`} startOffset="0">
                            {line.repeat(14)}
                        </textPath>
                    </text>
                </svg>
            </div>

            {showDemoPanel && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 12,
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        background: "rgba(22,22,22,0.96)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 999,
                        padding: "7px 16px",
                        fontSize: 11,
                        color: "#aaa",
                        fontFamily: "system-ui, sans-serif",
                        zIndex: 50,
                    }}
                >
                    <span style={{ fontWeight: 500 }}>VARIANT</span>
                    <div
                        style={{
                            display: "flex",
                            background: "#111",
                            borderRadius: 999,
                            padding: 2,
                        }}
                    >
                        {(["down", "up"] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => setVariant(v)}
                                style={{
                                    padding: "5px 16px",
                                    border: "none",
                                    borderRadius: 999,
                                    background:
                                        variant === v ? "#fff" : "transparent",
                                    color: variant === v ? "#111" : "#999",
                                    fontWeight: 600,
                                    fontSize: 11,
                                    cursor: "pointer",
                                }}
                            >
                                {v === "down" ? "Dial" : "Ring"}
                            </button>
                        ))}
                    </div>

                    <span style={{ fontWeight: 500 }}>SIZE</span>
                    <div
                        style={{
                            display: "flex",
                            background: "#111",
                            borderRadius: 999,
                            padding: 2,
                        }}
                    >
                        {(["S", "M", "L"] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setLocalSize(sizePresets[s])}
                                style={{
                                    padding: "5px 14px",
                                    border: "none",
                                    borderRadius: 999,
                                    background:
                                        currentKey === s
                                            ? "#fff"
                                            : "transparent",
                                    color: currentKey === s ? "#111" : "#999",
                                    fontWeight: 600,
                                    fontSize: 11,
                                    cursor: "pointer",
                                    minWidth: 32,
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

CurvedTextMarquee.defaultProps = {
    text: "Bend the line",
    speed: 90,
    bend: 70,
    size: 56,
    height: 280,
    color: "#ffffff",
    showDemoPanel: true,
}

addPropertyControls(CurvedTextMarquee, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Bend the line",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 90,
        min: 20,
        max: 200,
        step: 5,
    },
    bend: {
        type: ControlType.Number,
        title: "Bend",
        defaultValue: 70,
        min: 20,
        max: 140,
        step: 5,
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 56,
        min: 24,
        max: 120,
        step: 1,
    },
    height: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 280,
        min: 140,
        max: 500,
        step: 10,
    },
    color: { type: ControlType.Color, title: "Color", defaultValue: "#ffffff" },
    showDemoPanel: {
        type: ControlType.Boolean,
        title: "Demo Panel",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
})
